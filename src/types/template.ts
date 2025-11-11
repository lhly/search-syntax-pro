/**
 * 搜索模板相关类型定义
 */

import type { SearchParams } from './index';

/**
 * 模板分类
 */
export type TemplateCategory =
  | 'academic'   // 学术研究
  | 'tech'       // 技术开发
  | 'news'       // 新闻资讯
  | 'social'     // 社交媒体
  | 'shopping'   // 购物比价
  | 'media'      // 图片视频
  | 'custom';    // 自定义

/**
 * 搜索模板接口
 */
export interface SearchTemplate {
  /** 模板唯一标识 */
  id: string;

  /** 模板名称 */
  name: string;

  /** 模板描述 */
  description: string;

  /** 模板图标 (emoji) */
  icon: string;

  /** 模板分类 */
  category: TemplateCategory;

  /** 搜索参数 */
  params: Partial<SearchParams>;

  /** 标签列表（用于搜索和分类） */
  tags: string[];

  /** 是否为内置模板 */
  isBuiltIn: boolean;

  /** 创建时间 */
  createdAt: number;

  /** 使用次数 */
  usageCount: number;

  /** 最后使用时间 */
  lastUsedAt?: number;
}

/**
 * 模板分组
 */
export interface TemplateGroup {
  category: TemplateCategory;
  name: string;
  icon: string;
  templates: SearchTemplate[];
}

/**
 * 模板分类元数据
 */
export interface TemplateCategoryMeta {
  category: TemplateCategory;
  name: string;
  icon: string;
  description: string;
}
