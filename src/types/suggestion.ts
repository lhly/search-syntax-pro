/**
 * 智能推荐相关类型定义
 */

import type { SearchParams, SyntaxType } from './index';

/**
 * 推荐来源类型
 */
export type SuggestionSourceType =
  | 'pattern'   // 基于关键词模式识别
  | 'history'   // 基于历史记录分析
  | 'context'   // 基于当前上下文
  | 'engine';   // 基于搜索引擎特性

/**
 * 语法建议
 */
export interface SyntaxSuggestion {
  /** 建议ID */
  id: string;

  /** 建议类型 */
  type: SuggestionSourceType;

  /** 建议的语法 */
  syntax: SyntaxType;

  /** 建议标题 */
  title: string;

  /** 建议理由 */
  reason: string;

  /** 置信度 (0-1) */
  confidence: number;

  /** 预览效果 */
  preview: string;

  /** 应用后的参数 */
  appliedParams: Partial<SearchParams>;

  /** 创建时间 */
  createdAt: number;
}

/**
 * 推荐引擎配置
 */
export interface SuggestionEngineConfig {
  /** 是否启用历史推荐 */
  enableHistorySuggestions: boolean;

  /** 是否启用模式识别 */
  enablePatternRecognition: boolean;

  /** 是否启用上下文推荐 */
  enableContextSuggestions: boolean;

  /** 最大推荐数量 */
  maxSuggestions: number;

  /** 最小置信度阈值 */
  minConfidence: number;

  /** 历史记录分析深度（天数） */
  historyAnalysisDays: number;
}

/**
 * 默认推荐引擎配置
 */
export const DEFAULT_SUGGESTION_CONFIG: SuggestionEngineConfig = {
  enableHistorySuggestions: true,
  enablePatternRecognition: true,
  enableContextSuggestions: true,
  maxSuggestions: 5,
  minConfidence: 0.5,
  historyAnalysisDays: 30
};
