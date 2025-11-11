/**
 * 搜索模板管理服务
 */

import { BUILTIN_TEMPLATES, TEMPLATE_CATEGORY_META } from '../data/builtin-templates';
import type { SearchTemplate, TemplateCategory, TemplateCategoryMeta } from '../types/template';
import type { SearchParams } from '../types';

// 存储键
const STORAGE_KEY_TEMPLATES = 'custom_templates';
const STORAGE_KEY_USAGE = 'template_usage';

/**
 * 模板使用统计
 */
interface TemplateUsageStats {
  [templateId: string]: {
    count: number;
    lastUsedAt: number;
  };
}

/**
 * 模板管理器
 */
export class TemplateManager {
  private templates: SearchTemplate[] = [];
  private usageStats: TemplateUsageStats = {};
  private initialized = false;

  /**
   * 初始化模板管理器
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    await Promise.all([
      this.loadTemplates(),
      this.loadUsageStats()
    ]);

    this.initialized = true;
  }

  /**
   * 加载模板（内置 + 用户自定义）
   */
  private async loadTemplates(): Promise<void> {
    // 加载内置模板
    const builtIn = [...BUILTIN_TEMPLATES];

    // 加载用户自定义模板
    const custom = await this.loadCustomTemplates();

    // 合并模板
    this.templates = [...builtIn, ...custom];

    // 应用使用统计
    this.applyUsageStats();

    // 按使用次数排序
    this.sortTemplatesByUsage();
  }

  /**
   * 加载用户自定义模板
   */
  private async loadCustomTemplates(): Promise<SearchTemplate[]> {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEY_TEMPLATES);
      return result[STORAGE_KEY_TEMPLATES] || [];
    } catch (error) {
      console.error('加载自定义模板失败:', error);
      return [];
    }
  }

  /**
   * 加载使用统计
   */
  private async loadUsageStats(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEY_USAGE);
      this.usageStats = result[STORAGE_KEY_USAGE] || {};
    } catch (error) {
      console.error('加载使用统计失败:', error);
      this.usageStats = {};
    }
  }

  /**
   * 应用使用统计到模板
   */
  private applyUsageStats(): void {
    this.templates.forEach(template => {
      const stats = this.usageStats[template.id];
      if (stats) {
        template.usageCount = stats.count;
        template.lastUsedAt = stats.lastUsedAt;
      }
    });
  }

  /**
   * 按使用次数排序模板
   */
  private sortTemplatesByUsage(): void {
    this.templates.sort((a, b) => {
      // 先按使用次数降序
      if (b.usageCount !== a.usageCount) {
        return b.usageCount - a.usageCount;
      }
      // 使用次数相同时，按最后使用时间降序
      if (a.lastUsedAt && b.lastUsedAt) {
        return b.lastUsedAt - a.lastUsedAt;
      }
      // 都没使用过，按创建时间降序
      return b.createdAt - a.createdAt;
    });
  }

  /**
   * 获取所有模板
   */
  getAllTemplates(): SearchTemplate[] {
    return [...this.templates];
  }

  /**
   * 按分类获取模板
   */
  getTemplatesByCategory(category: TemplateCategory): SearchTemplate[] {
    return this.templates.filter(t => t.category === category);
  }

  /**
   * 按ID获取模板
   */
  getTemplateById(id: string): SearchTemplate | undefined {
    return this.templates.find(t => t.id === id);
  }

  /**
   * 搜索模板
   */
  searchTemplates(query: string): SearchTemplate[] {
    if (!query.trim()) {
      return this.getAllTemplates();
    }

    const lowerQuery = query.toLowerCase();
    return this.templates.filter(t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * 应用模板
   * @param templateId 模板ID
   * @param currentParams 当前搜索参数（保留关键词）
   * @returns 合并后的搜索参数
   */
  async applyTemplate(
    templateId: string,
    currentParams: SearchParams
  ): Promise<SearchParams> {
    const template = this.getTemplateById(templateId);
    if (!template) {
      throw new Error(`模板不存在: ${templateId}`);
    }

    // 增加使用次数
    await this.incrementUsage(templateId);

    // 合并参数（保留用户已输入的关键词）
    const mergedParams: SearchParams = {
      ...template.params,
      keyword: currentParams.keyword || template.params.keyword || '',
      engine: template.params.engine || currentParams.engine
    } as SearchParams;

    return mergedParams;
  }

  /**
   * 保存为自定义模板
   */
  async saveAsTemplate(
    name: string,
    description: string,
    params: SearchParams,
    category: TemplateCategory = 'custom'
  ): Promise<SearchTemplate> {
    // 生成唯一ID
    const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 创建模板对象
    const template: SearchTemplate = {
      id,
      name,
      description,
      icon: this.getCategoryIcon(category),
      category,
      params,
      tags: this.extractTags(params),
      isBuiltIn: false,
      createdAt: Date.now(),
      usageCount: 0
    };

    // 加载现有自定义模板
    const custom = await this.loadCustomTemplates();
    custom.push(template);

    // 保存到存储
    await chrome.storage.local.set({
      [STORAGE_KEY_TEMPLATES]: custom
    });

    // 重新加载模板
    await this.loadTemplates();

    return template;
  }

  /**
   * 删除自定义模板
   */
  async deleteTemplate(templateId: string): Promise<void> {
    const template = this.getTemplateById(templateId);
    if (!template) {
      throw new Error(`模板不存在: ${templateId}`);
    }

    if (template.isBuiltIn) {
      throw new Error('无法删除内置模板');
    }

    // 从存储中删除
    const custom = await this.loadCustomTemplates();
    const filtered = custom.filter(t => t.id !== templateId);
    await chrome.storage.local.set({
      [STORAGE_KEY_TEMPLATES]: filtered
    });

    // 同时删除使用统计
    delete this.usageStats[templateId];
    await chrome.storage.local.set({
      [STORAGE_KEY_USAGE]: this.usageStats
    });

    // 重新加载模板
    await this.loadTemplates();
  }

  /**
   * 更新自定义模板
   */
  async updateTemplate(
    templateId: string,
    updates: Partial<Pick<SearchTemplate, 'name' | 'description' | 'params' | 'category' | 'tags'>>
  ): Promise<void> {
    const template = this.getTemplateById(templateId);
    if (!template) {
      throw new Error(`模板不存在: ${templateId}`);
    }

    if (template.isBuiltIn) {
      throw new Error('无法修改内置模板');
    }

    // 加载自定义模板
    const custom = await this.loadCustomTemplates();
    const index = custom.findIndex(t => t.id === templateId);

    if (index === -1) {
      throw new Error('模板不存在于自定义列表中');
    }

    // 更新模板
    custom[index] = {
      ...custom[index],
      ...updates
    };

    // 保存到存储
    await chrome.storage.local.set({
      [STORAGE_KEY_TEMPLATES]: custom
    });

    // 重新加载模板
    await this.loadTemplates();
  }

  /**
   * 增加模板使用次数
   */
  private async incrementUsage(templateId: string): Promise<void> {
    // 更新使用统计
    if (!this.usageStats[templateId]) {
      this.usageStats[templateId] = { count: 0, lastUsedAt: 0 };
    }

    this.usageStats[templateId].count++;
    this.usageStats[templateId].lastUsedAt = Date.now();

    // 保存到存储
    await chrome.storage.local.set({
      [STORAGE_KEY_USAGE]: this.usageStats
    });

    // 更新本地模板对象
    const template = this.getTemplateById(templateId);
    if (template) {
      template.usageCount = this.usageStats[templateId].count;
      template.lastUsedAt = this.usageStats[templateId].lastUsedAt;
    }

    // 重新排序
    this.sortTemplatesByUsage();
  }

  /**
   * 从参数中提取标签
   */
  private extractTags(params: SearchParams): string[] {
    const tags: string[] = [];

    if (params.site) tags.push(`site:${params.site}`);
    if (params.fileType) tags.push(params.fileType.toUpperCase());
    if (params.engine) tags.push(params.engine);
    if (params.exactMatch) tags.push('精确匹配');
    if (params.dateRange) tags.push('日期范围');
    if (params.inTitle) tags.push('标题搜索');
    if (params.inUrl) tags.push('URL搜索');
    if (params.excludeWords && params.excludeWords.length > 0) tags.push('排除词');
    if (params.orKeywords && params.orKeywords.length > 0) tags.push('OR逻辑');

    return tags;
  }

  /**
   * 获取分类图标
   */
  private getCategoryIcon(category: TemplateCategory): string {
    const meta = TEMPLATE_CATEGORY_META.find(m => m.category === category);
    return meta?.icon || '⭐';
  }

  /**
   * 获取分类元数据
   */
  getCategoryMeta(): TemplateCategoryMeta[] {
    return [...TEMPLATE_CATEGORY_META];
  }

  /**
   * 导出模板
   */
  exportTemplate(templateId: string): string {
    const template = this.getTemplateById(templateId);
    if (!template) {
      throw new Error(`模板不存在: ${templateId}`);
    }

    return JSON.stringify(template, null, 2);
  }

  /**
   * 导入模板
   */
  async importTemplate(jsonString: string): Promise<SearchTemplate> {
    try {
      const imported = JSON.parse(jsonString) as SearchTemplate;

      // 验证必需字段
      if (!imported.name || !imported.params) {
        throw new Error('模板格式无效');
      }

      // 重新生成ID和时间戳
      const template: SearchTemplate = {
        ...imported,
        id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        isBuiltIn: false,
        createdAt: Date.now(),
        usageCount: 0
      };

      // 加载现有自定义模板
      const custom = await this.loadCustomTemplates();
      custom.push(template);

      // 保存到存储
      await chrome.storage.local.set({
        [STORAGE_KEY_TEMPLATES]: custom
      });

      // 重新加载模板
      await this.loadTemplates();

      return template;
    } catch (error) {
      throw new Error(`导入模板失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 清空使用统计
   */
  async clearUsageStats(): Promise<void> {
    this.usageStats = {};
    await chrome.storage.local.set({
      [STORAGE_KEY_USAGE]: {}
    });

    // 重置模板使用次数
    this.templates.forEach(t => {
      t.usageCount = 0;
      t.lastUsedAt = undefined;
    });

    this.sortTemplatesByUsage();
  }
}

// 导出单例
export const templateManager = new TemplateManager();
