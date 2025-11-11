/**
 * 智能语法推荐引擎
 */

import type { SearchParams, SearchHistory } from '../types';
import type { SyntaxSuggestion, SuggestionSourceType, SuggestionEngineConfig } from '../types/suggestion';
import { DEFAULT_SUGGESTION_CONFIG } from '../types/suggestion';

/**
 * 推荐模式规则
 */
interface PatternRule {
  pattern: RegExp;
  suggestions: Partial<SyntaxSuggestion>[];
}

/**
 * 智能推荐引擎
 */
export class SuggestionEngine {
  private config: SuggestionEngineConfig;
  private patternRules: PatternRule[];

  constructor(config: Partial<SuggestionEngineConfig> = {}) {
    this.config = { ...DEFAULT_SUGGESTION_CONFIG, ...config };
    this.patternRules = this.initializePatternRules();
  }

  /**
   * 初始化模式识别规则
   */
  private initializePatternRules(): PatternRule[] {
    return [
      // 学术搜索意图
      {
        pattern: /论文|研究|学术|paper|research|journal|article/i,
        suggestions: [
          {
            syntax: 'filetype',
            title: '限定文件类型为 PDF',
            reason: '检测到学术搜索意图,建议添加 PDF 文件过滤',
            confidence: 0.85,
            preview: 'filetype:pdf',
            appliedParams: { fileType: 'pdf' }
          },
          {
            syntax: 'date_range',
            title: '限定近5年文献',
            reason: '学术搜索建议限制近5年文献',
            confidence: 0.75,
            preview: '2020-01-01 至今',
            appliedParams: {
              dateRange: {
                from: this.getDaysAgoString(365 * 5),
                to: this.getTodayString()
              }
            }
          }
        ]
      },

      // 新闻时效性意图
      {
        pattern: /最新|今日|最近|latest|recent|today|breaking|news/i,
        suggestions: [
          {
            syntax: 'date_range',
            title: '限定最近24小时',
            reason: '检测到时效性需求,建议限制最近24小时',
            confidence: 0.8,
            preview: '最近24小时',
            appliedParams: {
              dateRange: {
                from: this.getDaysAgoString(1),
                to: this.getTodayString()
              }
            }
          }
        ]
      },

      // 站内搜索意图
      {
        pattern: /在(\w+)\s*搜索|search\s+in\s+(\w+)|site:(\S+)/i,
        suggestions: [
          {
            syntax: 'site',
            title: '限定站内搜索',
            reason: '检测到站内搜索意图',
            confidence: 0.9,
            preview: 'site:example.com',
            appliedParams: {}  // 需要动态提取
          }
        ]
      },

      // 技术文档搜索
      {
        pattern: /文档|教程|api|docs|documentation|tutorial|guide/i,
        suggestions: [
          {
            syntax: 'inurl',
            title: '限定文档URL',
            reason: '技术搜索建议限定文档URL',
            confidence: 0.75,
            preview: 'inurl:docs',
            appliedParams: { inUrl: 'docs' }
          },
          {
            syntax: 'or',
            title: '扩展文档来源',
            reason: '建议搜索多个文档平台',
            confidence: 0.7,
            preview: 'OR tutorial OR guide',
            appliedParams: { orKeywords: ['tutorial', 'guide', 'documentation'] }
          }
        ]
      },

      // GitHub/开源搜索
      {
        pattern: /github|开源|source\s*code|repository|repo/i,
        suggestions: [
          {
            syntax: 'site',
            title: '限定 GitHub',
            reason: '检测到开源代码搜索意图',
            confidence: 0.85,
            preview: 'site:github.com',
            appliedParams: { site: 'github.com' }
          }
        ]
      },

      // 精确匹配建议
      {
        pattern: /.{15,}/,  // 长度超过15的关键词
        suggestions: [
          {
            syntax: 'exact',
            title: '使用精确匹配',
            reason: '关键词较长,建议使用精确匹配提高准确度',
            confidence: 0.7,
            preview: '"关键词"',
            appliedParams: {}  // 需要动态填充
          }
        ]
      },

      // 排除干扰词建议
      {
        pattern: /搜索|查找|find|search/i,
        suggestions: [
          {
            syntax: 'exclude',
            title: '排除广告内容',
            reason: '建议排除广告和推广内容',
            confidence: 0.6,
            preview: '-广告 -推广',
            appliedParams: { excludeWords: ['广告', '推广', 'AD'] }
          }
        ]
      }
    ];
  }

  /**
   * 获取推荐建议
   */
  getSuggestions(
    keyword: string,
    currentParams: SearchParams,
    history: SearchHistory[] = []
  ): SyntaxSuggestion[] {
    const suggestions: SyntaxSuggestion[] = [];

    // 1. 基于关键词模式识别
    if (this.config.enablePatternRecognition) {
      suggestions.push(...this.analyzeKeywordPattern(keyword, currentParams));
    }

    // 2. 基于搜索历史推荐
    if (this.config.enableHistorySuggestions && history.length > 0) {
      suggestions.push(...this.analyzeHistory(keyword, history));
    }

    // 3. 基于上下文推荐
    if (this.config.enableContextSuggestions) {
      suggestions.push(...this.analyzeContext(currentParams));
    }

    // 去重、过滤和排序
    return this.deduplicateAndSort(suggestions)
      .filter(s => s.confidence >= this.config.minConfidence)
      .slice(0, this.config.maxSuggestions);
  }

  /**
   * 关键词模式识别
   */
  private analyzeKeywordPattern(
    keyword: string,
    currentParams: SearchParams
  ): SyntaxSuggestion[] {
    const suggestions: SyntaxSuggestion[] = [];

    for (const rule of this.patternRules) {
      if (rule.pattern.test(keyword)) {
        for (const suggestion of rule.suggestions) {
          // 检查是否已经设置了相应的参数
          if (this.shouldSkipSuggestion(suggestion.syntax!, currentParams)) {
            continue;
          }

          // 创建完整的建议对象
          const fullSuggestion = this.createSuggestion(
            'pattern',
            suggestion,
            keyword,
            currentParams
          );

          suggestions.push(fullSuggestion);
        }
      }
    }

    return suggestions;
  }

  /**
   * 基于历史记录推荐
   */
  private analyzeHistory(
    keyword: string,
    history: SearchHistory[]
  ): SyntaxSuggestion[] {
    const suggestions: SyntaxSuggestion[] = [];

    // 过滤时间范围内的历史记录
    const cutoffDate = Date.now() - this.config.historyAnalysisDays * 24 * 60 * 60 * 1000;
    const recentHistory = history.filter(h => h.timestamp >= cutoffDate);

    // 查找相似的历史搜索
    const similar = recentHistory.filter(h =>
      this.calculateSimilarity(h.keyword, keyword) > 0.6
    );

    if (similar.length === 0) return suggestions;

    // 统计常用语法组合
    const syntaxUsage: Record<string, number> = {};

    similar.forEach(h => {
      if (h.syntax.site) syntaxUsage['site'] = (syntaxUsage['site'] || 0) + 1;
      if (h.syntax.fileType) syntaxUsage['filetype'] = (syntaxUsage['filetype'] || 0) + 1;
      if (h.syntax.exactMatch) syntaxUsage['exact'] = (syntaxUsage['exact'] || 0) + 1;
      if (h.syntax.dateRange) syntaxUsage['date_range'] = (syntaxUsage['date_range'] || 0) + 1;
      if (h.syntax.inTitle) syntaxUsage['intitle'] = (syntaxUsage['intitle'] || 0) + 1;
      if (h.syntax.inUrl) syntaxUsage['inurl'] = (syntaxUsage['inurl'] || 0) + 1;
      if (h.syntax.excludeWords?.length) syntaxUsage['exclude'] = (syntaxUsage['exclude'] || 0) + 1;
    });

    // 生成历史推荐
    Object.entries(syntaxUsage).forEach(([syntax, count]) => {
      const confidence = Math.min(count / similar.length, 0.9);

      if (confidence > 0.5) {
        const matchedHistory = similar.find(h => this.hasUsedSyntax(h, syntax));
        if (matchedHistory) {
          suggestions.push({
            id: `history_${syntax}_${Date.now()}`,
            type: 'history',
            syntax: syntax as any,
            title: `使用 ${syntax} 语法`,
            reason: `您在 ${count} 次类似搜索中使用了此语法`,
            confidence,
            preview: this.getPreviewFromHistory(syntax, matchedHistory),
            appliedParams: this.extractParamsFromHistory(syntax, matchedHistory),
            createdAt: Date.now()
          });
        }
      }
    });

    return suggestions;
  }

  /**
   * 基于上下文推荐
   */
  private analyzeContext(currentParams: SearchParams): SyntaxSuggestion[] {
    const suggestions: SyntaxSuggestion[] = [];

    // 如果已设置 site,建议添加 inurl
    if (currentParams.site && !currentParams.inUrl) {
      suggestions.push({
        id: `context_inurl_${Date.now()}`,
        type: 'context',
        syntax: 'inurl',
        title: '进一步限定 URL 路径',
        reason: '已限定站点,可进一步限定 URL 路径',
        confidence: 0.6,
        preview: 'inurl:blog',
        appliedParams: { inUrl: 'blog' },
        createdAt: Date.now()
      });
    }

    // 如果设置了精确匹配,建议添加排除词
    if (currentParams.exactMatch && !currentParams.excludeWords?.length) {
      suggestions.push({
        id: `context_exclude_${Date.now()}`,
        type: 'context',
        syntax: 'exclude',
        title: '排除不相关结果',
        reason: '精确匹配可能结果过多,建议排除不相关词',
        confidence: 0.5,
        preview: '-广告 -推广',
        appliedParams: { excludeWords: ['广告', '推广'] },
        createdAt: Date.now()
      });
    }

    // 如果没有日期范围,建议添加
    if (!currentParams.dateRange && currentParams.keyword.length > 5) {
      suggestions.push({
        id: `context_daterange_${Date.now()}`,
        type: 'context',
        syntax: 'date_range',
        title: '限定时间范围',
        reason: '添加时间范围可获得更相关的结果',
        confidence: 0.55,
        preview: '近一年',
        appliedParams: {
          dateRange: {
            from: this.getDaysAgoString(365),
            to: this.getTodayString()
          }
        },
        createdAt: Date.now()
      });
    }

    return suggestions;
  }

  /**
   * 创建建议对象
   */
  private createSuggestion(
    type: SuggestionSourceType,
    partial: Partial<SyntaxSuggestion>,
    keyword: string,
    _currentParams: SearchParams
  ): SyntaxSuggestion {
    let appliedParams = partial.appliedParams || {};
    let preview = partial.preview || '';

    // 动态处理特殊情况
    if (partial.syntax === 'exact' && !appliedParams.exactMatch) {
      appliedParams = { exactMatch: keyword };
      preview = `"${keyword}"`;
    }

    return {
      id: `${type}_${partial.syntax}_${Date.now()}_${Math.random()}`,
      type,
      syntax: partial.syntax!,
      title: partial.title || '',
      reason: partial.reason || '',
      confidence: partial.confidence || 0.5,
      preview,
      appliedParams,
      createdAt: Date.now()
    };
  }

  /**
   * 是否应该跳过此建议
   */
  private shouldSkipSuggestion(syntax: string, currentParams: SearchParams): boolean {
    switch (syntax) {
      case 'site':
        return !!currentParams.site;
      case 'filetype':
        return !!currentParams.fileType;
      case 'exact':
        return !!currentParams.exactMatch;
      case 'date_range':
        return !!currentParams.dateRange;
      case 'intitle':
        return !!currentParams.inTitle;
      case 'inurl':
        return !!currentParams.inUrl;
      case 'exclude':
        return !!(currentParams.excludeWords && currentParams.excludeWords.length > 0);
      case 'or':
        return !!(currentParams.orKeywords && currentParams.orKeywords.length > 0);
      default:
        return false;
    }
  }

  /**
   * 计算关键词相似度 (Jaccard 相似度)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const set1 = new Set(str1.toLowerCase().split(/\s+/));
    const set2 = new Set(str2.toLowerCase().split(/\s+/));

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  /**
   * 检查历史记录是否使用了某个语法
   */
  private hasUsedSyntax(history: SearchHistory, syntax: string): boolean {
    switch (syntax) {
      case 'site': return !!history.syntax.site;
      case 'filetype': return !!history.syntax.fileType;
      case 'exact': return !!history.syntax.exactMatch;
      case 'date_range': return !!history.syntax.dateRange;
      case 'intitle': return !!history.syntax.inTitle;
      case 'inurl': return !!history.syntax.inUrl;
      case 'exclude': return !!(history.syntax.excludeWords?.length);
      default: return false;
    }
  }

  /**
   * 从历史记录获取预览文本
   */
  private getPreviewFromHistory(syntax: string, history: SearchHistory): string {
    switch (syntax) {
      case 'site':
        return `site:${history.syntax.site}`;
      case 'filetype':
        return `filetype:${history.syntax.fileType}`;
      case 'exact':
        return `"${history.syntax.exactMatch}"`;
      case 'date_range':
        return `${history.syntax.dateRange?.from} 至 ${history.syntax.dateRange?.to}`;
      case 'intitle':
        return `intitle:${history.syntax.inTitle}`;
      case 'inurl':
        return `inurl:${history.syntax.inUrl}`;
      case 'exclude':
        return history.syntax.excludeWords?.map(w => `-${w}`).join(' ') || '';
      default:
        return syntax;
    }
  }

  /**
   * 从历史记录提取参数
   */
  private extractParamsFromHistory(syntax: string, history: SearchHistory): Partial<SearchParams> {
    switch (syntax) {
      case 'site':
        return { site: history.syntax.site };
      case 'filetype':
        return { fileType: history.syntax.fileType };
      case 'exact':
        return { exactMatch: history.syntax.exactMatch };
      case 'date_range':
        return { dateRange: history.syntax.dateRange };
      case 'intitle':
        return { inTitle: history.syntax.inTitle };
      case 'inurl':
        return { inUrl: history.syntax.inUrl };
      case 'exclude':
        return { excludeWords: history.syntax.excludeWords };
      default:
        return {};
    }
  }

  /**
   * 去重并按置信度排序
   */
  private deduplicateAndSort(suggestions: SyntaxSuggestion[]): SyntaxSuggestion[] {
    const seen = new Set<string>();
    const unique = suggestions.filter(s => {
      const key = `${s.syntax}:${s.preview}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return unique.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * 获取今天的日期字符串
   */
  private getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * 获取N天前的日期字符串
   */
  private getDaysAgoString(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }
}

// 导出单例
export const suggestionEngine = new SuggestionEngine();
