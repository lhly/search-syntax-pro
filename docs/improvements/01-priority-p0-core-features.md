# P0 - 核心体验提升功能

> **优先级**: P0（最高）
> **目标**: 降低学习成本 60%+，提升专业用户效率 50%+
> **周期**: 2-3 周
> **版本**: v1.6.0

---

## 📋 功能清单

| 功能 | 用户价值 | 技术复杂度 | 工作量 | 负责人 |
|------|----------|------------|--------|--------|
| 搜索模板/预设 | ⭐⭐⭐⭐⭐ | ⭐⭐ | 3-5天 | 待定 |
| 键盘快捷键系统 | ⭐⭐⭐⭐ | ⭐⭐⭐ | 2-3天 | 待定 |
| 智能语法推荐引擎 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 5-7天 | 待定 |

---

## 1. 搜索模板/预设功能

### 📖 功能描述

提供预定义的搜索模板，让用户无需学习复杂语法即可快速执行常见搜索场景。

### 🎯 用户价值

- **降低学习门槛**: 新用户无需了解语法即可使用高级功能
- **提升效率**: 一键应用模板，减少重复配置
- **知识传播**: 内置最佳实践，教育用户正确使用搜索语法

### 💡 核心设计

#### 数据结构

```typescript
// src/types/template.ts

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
}

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
 * 模板分组
 */
export interface TemplateGroup {
  category: TemplateCategory;
  name: string;
  icon: string;
  templates: SearchTemplate[];
}
```

#### 内置模板定义

```typescript
// src/data/builtin-templates.ts

export const BUILTIN_TEMPLATES: SearchTemplate[] = [
  // ========== 学术研究 ==========
  {
    id: 'academic_paper',
    name: '学术论文搜索',
    description: '搜索 PDF 格式的学术论文，限定近5年',
    icon: '📚',
    category: 'academic',
    params: {
      engine: 'google',
      fileType: 'pdf',
      dateRange: {
        from: '2020-01-01',
        to: new Date().toISOString().split('T')[0]
      }
    },
    tags: ['学术', '论文', 'PDF', '科研'],
    isBuiltIn: true,
    createdAt: Date.now(),
    usageCount: 0
  },

  {
    id: 'scholar_google',
    name: 'Google Scholar 搜索',
    description: '在 Google Scholar 中搜索学术文献',
    icon: '🎓',
    category: 'academic',
    params: {
      engine: 'google',
      site: 'scholar.google.com',
      keyword: ''
    },
    tags: ['学术', 'Google', '文献'],
    isBuiltIn: true,
    createdAt: Date.now(),
    usageCount: 0
  },

  // ========== 技术开发 ==========
  {
    id: 'github_code',
    name: 'GitHub 代码搜索',
    description: '搜索 GitHub 上的开源代码',
    icon: '💻',
    category: 'tech',
    params: {
      engine: 'github',
      keyword: '',
      language: 'TypeScript'
    },
    tags: ['代码', 'GitHub', '开源'],
    isBuiltIn: true,
    createdAt: Date.now(),
    usageCount: 0
  },

  {
    id: 'stackoverflow_qa',
    name: 'Stack Overflow 问答',
    description: '在 Stack Overflow 搜索技术问题解答',
    icon: '❓',
    category: 'tech',
    params: {
      engine: 'stackoverflow',
      keyword: '',
      tags: ['javascript']
    },
    tags: ['问答', 'Stack Overflow', '编程'],
    isBuiltIn: true,
    createdAt: Date.now(),
    usageCount: 0
  },

  {
    id: 'tech_blog',
    name: '技术博客搜索',
    description: '搜索主流技术博客平台的文章',
    icon: '✍️',
    category: 'tech',
    params: {
      engine: 'google',
      keyword: '',
      orKeywords: ['site:dev.to', 'site:medium.com', 'site:hashnode.com']
    },
    tags: ['博客', '教程', '技术文章'],
    isBuiltIn: true,
    createdAt: Date.now(),
    usageCount: 0
  },

  // ========== 新闻资讯 ==========
  {
    id: 'news_recent',
    name: '最新新闻',
    description: '搜索最近24小时的新闻',
    icon: '📰',
    category: 'news',
    params: {
      engine: 'google',
      keyword: '',
      dateRange: {
        from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
      }
    },
    tags: ['新闻', '热点', '实时'],
    isBuiltIn: true,
    createdAt: Date.now(),
    usageCount: 0
  },

  // ========== 社交媒体 ==========
  {
    id: 'twitter_trending',
    name: 'Twitter 热门话题',
    description: '搜索 Twitter 上的热门讨论',
    icon: '🐦',
    category: 'social',
    params: {
      engine: 'twitter',
      keyword: '',
      minRetweets: 100,
      minFaves: 500,
      contentFilters: ['links', 'media']
    },
    tags: ['Twitter', '热点', '社交'],
    isBuiltIn: true,
    createdAt: Date.now(),
    usageCount: 0
  },

  {
    id: 'reddit_discussion',
    name: 'Reddit 讨论',
    description: '搜索 Reddit 上的相关讨论',
    icon: '🔴',
    category: 'social',
    params: {
      engine: 'reddit',
      keyword: '',
      site: 'reddit.com'
    },
    tags: ['Reddit', '社区', '讨论'],
    isBuiltIn: true,
    createdAt: Date.now(),
    usageCount: 0
  },

  // ========== 图片视频 ==========
  {
    id: 'image_search',
    name: '高清图片搜索',
    description: '搜索高分辨率图片',
    icon: '🖼️',
    category: 'media',
    params: {
      engine: 'google',
      keyword: '',
      fileType: 'jpg',
      exactMatch: 'high resolution'
    },
    tags: ['图片', '高清', '素材'],
    isBuiltIn: true,
    createdAt: Date.now(),
    usageCount: 0
  },

  // ========== 文档资料 ==========
  {
    id: 'official_docs',
    name: '官方文档搜索',
    description: '在官方文档网站中搜索',
    icon: '📖',
    category: 'tech',
    params: {
      engine: 'google',
      keyword: '',
      site: '',  // 用户需要指定
      inUrl: 'docs'
    },
    tags: ['文档', '官方', 'API'],
    isBuiltIn: true,
    createdAt: Date.now(),
    usageCount: 0
  }
];
```

#### 模板管理服务

```typescript
// src/services/template-manager.ts

import { BUILTIN_TEMPLATES } from '@/data/builtin-templates';
import { STORAGE_KEYS } from '@/types';
import type { SearchTemplate, TemplateCategory, SearchParams } from '@/types';

/**
 * 模板管理器
 */
export class TemplateManager {
  private templates: SearchTemplate[] = [];

  constructor() {
    this.loadTemplates();
  }

  /**
   * 加载模板（内置 + 用户自定义）
   */
  async loadTemplates(): Promise<void> {
    // 加载内置模板
    const builtIn = [...BUILTIN_TEMPLATES];

    // 加载用户自定义模板
    const custom = await this.loadCustomTemplates();

    // 合并并按使用次数排序
    this.templates = [...builtIn, ...custom].sort(
      (a, b) => b.usageCount - a.usageCount
    );
  }

  /**
   * 加载用户自定义模板
   */
  private async loadCustomTemplates(): Promise<SearchTemplate[]> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.TEMPLATES);
    return result[STORAGE_KEYS.TEMPLATES] || [];
  }

  /**
   * 获取所有模板
   */
  getAllTemplates(): SearchTemplate[] {
    return this.templates;
  }

  /**
   * 按分类获取模板
   */
  getTemplatesByCategory(category: TemplateCategory): SearchTemplate[] {
    return this.templates.filter(t => t.category === category);
  }

  /**
   * 搜索模板
   */
  searchTemplates(query: string): SearchTemplate[] {
    const lowerQuery = query.toLowerCase();
    return this.templates.filter(t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * 应用模板
   */
  async applyTemplate(
    templateId: string,
    currentParams: SearchParams
  ): Promise<SearchParams> {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) {
      throw new Error(`模板不存在: ${templateId}`);
    }

    // 增加使用次数
    await this.incrementUsage(templateId);

    // 合并参数（保留用户已输入的关键词）
    return {
      ...template.params,
      keyword: currentParams.keyword || template.params.keyword || '',
    } as SearchParams;
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
    const template: SearchTemplate = {
      id: `custom_${Date.now()}`,
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

    // 保存到存储
    const custom = await this.loadCustomTemplates();
    custom.push(template);
    await chrome.storage.local.set({
      [STORAGE_KEYS.TEMPLATES]: custom
    });

    // 重新加载
    await this.loadTemplates();

    return template;
  }

  /**
   * 删除自定义模板
   */
  async deleteTemplate(templateId: string): Promise<void> {
    const template = this.templates.find(t => t.id === templateId);
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
      [STORAGE_KEYS.TEMPLATES]: filtered
    });

    // 重新加载
    await this.loadTemplates();
  }

  /**
   * 增加模板使用次数
   */
  private async incrementUsage(templateId: string): Promise<void> {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) return;

    template.usageCount++;

    // 如果是自定义模板，更新存储
    if (!template.isBuiltIn) {
      const custom = await this.loadCustomTemplates();
      const index = custom.findIndex(t => t.id === templateId);
      if (index !== -1) {
        custom[index].usageCount = template.usageCount;
        await chrome.storage.local.set({
          [STORAGE_KEYS.TEMPLATES]: custom
        });
      }
    }
  }

  /**
   * 从参数中提取标签
   */
  private extractTags(params: SearchParams): string[] {
    const tags: string[] = [];

    if (params.site) tags.push(`site:${params.site}`);
    if (params.fileType) tags.push(params.fileType);
    if (params.engine) tags.push(params.engine);
    if (params.exactMatch) tags.push('精确匹配');
    if (params.dateRange) tags.push('日期范围');

    return tags;
  }

  /**
   * 获取分类图标
   */
  private getCategoryIcon(category: TemplateCategory): string {
    const icons: Record<TemplateCategory, string> = {
      academic: '📚',
      tech: '💻',
      news: '📰',
      social: '🐦',
      shopping: '🛒',
      media: '🖼️',
      custom: '⭐'
    };
    return icons[category];
  }
}

// 导出单例
export const templateManager = new TemplateManager();
```

#### UI 组件设计

```typescript
// src/components/TemplateSelector.tsx

import { useState, useEffect } from 'react';
import { templateManager } from '@/services/template-manager';
import type { SearchTemplate, TemplateCategory, SearchParams } from '@/types';

interface TemplateSelectorProps {
  currentParams: SearchParams;
  onApplyTemplate: (params: SearchParams) => void;
}

export function TemplateSelector({ currentParams, onApplyTemplate }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<SearchTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    await templateManager.loadTemplates();
    setTemplates(templateManager.getAllTemplates());
  };

  const filteredTemplates = templates.filter(t => {
    // 分类过滤
    if (selectedCategory !== 'all' && t.category !== selectedCategory) {
      return false;
    }

    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return true;
  });

  const handleApply = async (templateId: string) => {
    const newParams = await templateManager.applyTemplate(templateId, currentParams);
    onApplyTemplate(newParams);
  };

  return (
    <div className="template-selector">
      {/* 搜索框 */}
      <input
        type="text"
        placeholder="搜索模板..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="input mb-3"
      />

      {/* 分类标签 */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`btn btn-sm ${selectedCategory === 'all' ? 'btn-primary' : 'btn-ghost'}`}
        >
          全部
        </button>
        <button
          onClick={() => setSelectedCategory('academic')}
          className={`btn btn-sm ${selectedCategory === 'academic' ? 'btn-primary' : 'btn-ghost'}`}
        >
          📚 学术
        </button>
        <button
          onClick={() => setSelectedCategory('tech')}
          className={`btn btn-sm ${selectedCategory === 'tech' ? 'btn-primary' : 'btn-ghost'}`}
        >
          💻 技术
        </button>
        <button
          onClick={() => setSelectedCategory('news')}
          className={`btn btn-sm ${selectedCategory === 'news' ? 'btn-primary' : 'btn-ghost'}`}
        >
          📰 新闻
        </button>
        <button
          onClick={() => setSelectedCategory('social')}
          className={`btn btn-sm ${selectedCategory === 'social' ? 'btn-primary' : 'btn-ghost'}`}
        >
          🐦 社交
        </button>
      </div>

      {/* 模板列表 */}
      <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
        {filteredTemplates.map(template => (
          <div
            key={template.id}
            className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition"
            onClick={() => handleApply(template.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{template.icon}</span>
                  <h4 className="font-medium">{template.name}</h4>
                  {!template.isBuiltIn && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      自定义
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {template.description}
                </p>
                <div className="flex gap-1 flex-wrap">
                  {template.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-xs text-gray-500">
                使用 {template.usageCount} 次
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          未找到匹配的模板
        </div>
      )}
    </div>
  );
}
```

### 📝 实施步骤

1. **第1天**: 数据结构设计和内置模板定义
2. **第2天**: TemplateManager 服务实现
3. **第3天**: TemplateSelector UI 组件开发
4. **第4天**: 集成到主界面，测试交互流程
5. **第5天**: 优化体验，添加动画和反馈

### ✅ 验收标准

- [ ] 提供至少 15 个内置模板
- [ ] 支持按分类和搜索筛选模板
- [ ] 模板应用后正确填充搜索参数
- [ ] 支持保存为自定义模板
- [ ] 模板使用次数统计准确
- [ ] UI 响应流畅，动画自然

---

## 2. 键盘快捷键系统

### 📖 功能描述

提供全局和局部键盘快捷键，让专业用户通过键盘完成所有操作，减少鼠标依赖。

### 🎯 用户价值

- **效率提升**: 专业用户操作速度提升 50%+
- **无缝体验**: 无需中断思考，全键盘操作流
- **可访问性**: 提升键盘导航用户的体验

### 💡 核心设计

#### 快捷键定义

```typescript
// src/config/keyboard-shortcuts.ts

/**
 * 快捷键定义
 */
export interface KeyboardShortcut {
  /** 快捷键组合 (例: 'Ctrl+K', 'Alt+Shift+F') */
  key: string;

  /** 快捷键描述 */
  description: string;

  /** 执行的动作 */
  action: string;

  /** 作用域 ('global' | 'popup' | 'options') */
  scope: ShortcutScope;

  /** 是否可自定义 */
  customizable: boolean;
}

export type ShortcutScope = 'global' | 'popup' | 'options';

/**
 * 内置快捷键映射
 */
export const DEFAULT_SHORTCUTS: Record<string, KeyboardShortcut> = {
  // ========== 全局快捷键 ==========
  'open_popup': {
    key: 'Ctrl+Shift+F',
    description: '打开搜索面板',
    action: 'OPEN_POPUP',
    scope: 'global',
    customizable: true
  },

  // ========== 弹窗内快捷键 ==========
  'execute_search': {
    key: 'Ctrl+Enter',
    description: '执行搜索',
    action: 'EXECUTE_SEARCH',
    scope: 'popup',
    customizable: true
  },

  'open_history': {
    key: 'Ctrl+H',
    description: '打开搜索历史',
    action: 'OPEN_HISTORY',
    scope: 'popup',
    customizable: true
  },

  'open_templates': {
    key: 'Ctrl+T',
    description: '打开模板选择器',
    action: 'OPEN_TEMPLATES',
    scope: 'popup',
    customizable: true
  },

  'copy_query': {
    key: 'Ctrl+Shift+C',
    description: '复制生成的查询',
    action: 'COPY_QUERY',
    scope: 'popup',
    customizable: true
  },

  'toggle_advanced': {
    key: 'Ctrl+A',
    description: '切换高级选项',
    action: 'TOGGLE_ADVANCED',
    scope: 'popup',
    customizable: true
  },

  'close_popup': {
    key: 'Escape',
    description: '关闭面板',
    action: 'CLOSE_POPUP',
    scope: 'popup',
    customizable: false
  },

  // 快速切换搜索引擎
  'switch_engine_1': {
    key: 'Ctrl+1',
    description: '切换到第1个搜索引擎',
    action: 'SWITCH_ENGINE:0',
    scope: 'popup',
    customizable: true
  },

  'switch_engine_2': {
    key: 'Ctrl+2',
    description: '切换到第2个搜索引擎',
    action: 'SWITCH_ENGINE:1',
    scope: 'popup',
    customizable: true
  },

  // ... 其他引擎切换快捷键

  // 导航快捷键
  'focus_keyword': {
    key: 'Ctrl+K',
    description: '聚焦关键词输入框',
    action: 'FOCUS_KEYWORD',
    scope: 'popup',
    customizable: true
  },

  'next_field': {
    key: 'Tab',
    description: '下一个输入框',
    action: 'NEXT_FIELD',
    scope: 'popup',
    customizable: false
  },

  'prev_field': {
    key: 'Shift+Tab',
    description: '上一个输入框',
    action: 'PREV_FIELD',
    scope: 'popup',
    customizable: false
  },
};
```

#### 快捷键管理器

```typescript
// src/services/shortcut-manager.ts

import { DEFAULT_SHORTCUTS } from '@/config/keyboard-shortcuts';
import type { KeyboardShortcut, ShortcutScope } from '@/config/keyboard-shortcuts';

/**
 * 快捷键管理器
 */
export class ShortcutManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private handlers: Map<string, () => void> = new Map();

  constructor() {
    this.loadShortcuts();
    this.setupListeners();
  }

  /**
   * 加载快捷键配置
   */
  private async loadShortcuts(): Promise<void> {
    // 加载默认快捷键
    Object.entries(DEFAULT_SHORTCUTS).forEach(([id, shortcut]) => {
      this.shortcuts.set(id, shortcut);
    });

    // 加载用户自定义快捷键
    const custom = await this.loadCustomShortcuts();
    Object.entries(custom).forEach(([id, shortcut]) => {
      if (shortcut.customizable) {
        this.shortcuts.set(id, shortcut);
      }
    });
  }

  /**
   * 加载用户自定义快捷键
   */
  private async loadCustomShortcuts(): Promise<Record<string, KeyboardShortcut>> {
    const result = await chrome.storage.local.get('custom_shortcuts');
    return result.custom_shortcuts || {};
  }

  /**
   * 设置监听器
   */
  private setupListeners(): void {
    document.addEventListener('keydown', this.handleKeyPress.bind(this));
  }

  /**
   * 处理按键事件
   */
  private handleKeyPress(event: KeyboardEvent): void {
    const key = this.normalizeKey(event);

    // 查找匹配的快捷键
    for (const [id, shortcut] of this.shortcuts.entries()) {
      if (shortcut.key === key && this.isInScope(shortcut.scope)) {
        event.preventDefault();
        event.stopPropagation();

        // 执行注册的处理器
        const handler = this.handlers.get(id);
        if (handler) {
          handler();
        }

        break;
      }
    }
  }

  /**
   * 规范化按键组合
   */
  private normalizeKey(event: KeyboardEvent): string {
    const parts: string[] = [];

    if (event.ctrlKey || event.metaKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');

    // 特殊键
    if (['Escape', 'Enter', 'Tab', 'Space'].includes(event.key)) {
      parts.push(event.key);
    } else if (event.key.length === 1) {
      // 字母或数字
      parts.push(event.key.toUpperCase());
    }

    return parts.join('+');
  }

  /**
   * 检查是否在快捷键作用域内
   */
  private isInScope(scope: ShortcutScope): boolean {
    // 实现逻辑：检查当前页面类型
    const currentPage = window.location.pathname;

    if (scope === 'global') return true;
    if (scope === 'popup') return currentPage.includes('popup');
    if (scope === 'options') return currentPage.includes('options');

    return false;
  }

  /**
   * 注册快捷键处理器
   */
  register(shortcutId: string, handler: () => void): void {
    this.handlers.set(shortcutId, handler);
  }

  /**
   * 注销快捷键处理器
   */
  unregister(shortcutId: string): void {
    this.handlers.delete(shortcutId);
  }

  /**
   * 获取所有快捷键
   */
  getAllShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * 更新自定义快捷键
   */
  async updateShortcut(shortcutId: string, newKey: string): Promise<void> {
    const shortcut = this.shortcuts.get(shortcutId);
    if (!shortcut || !shortcut.customizable) {
      throw new Error('快捷键不可自定义');
    }

    // 检查冲突
    const conflict = this.findConflict(newKey, shortcutId);
    if (conflict) {
      throw new Error(`快捷键冲突: ${conflict.description}`);
    }

    // 更新快捷键
    shortcut.key = newKey;
    this.shortcuts.set(shortcutId, shortcut);

    // 保存到存储
    const custom = await this.loadCustomShortcuts();
    custom[shortcutId] = shortcut;
    await chrome.storage.local.set({ custom_shortcuts: custom });
  }

  /**
   * 查找快捷键冲突
   */
  private findConflict(key: string, excludeId: string): KeyboardShortcut | null {
    for (const [id, shortcut] of this.shortcuts.entries()) {
      if (id !== excludeId && shortcut.key === key) {
        return shortcut;
      }
    }
    return null;
  }
}

// 导出单例
export const shortcutManager = new ShortcutManager();
```

#### 快捷键提示组件

```typescript
// src/components/ShortcutHint.tsx

import { useState, useEffect } from 'react';
import { shortcutManager } from '@/services/shortcut-manager';
import type { KeyboardShortcut } from '@/config/keyboard-shortcuts';

export function ShortcutHint() {
  const [visible, setVisible] = useState(false);
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);

  useEffect(() => {
    setShortcuts(shortcutManager.getAllShortcuts());

    // 按 ? 键显示快捷键帮助
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        setVisible(!visible);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl max-h-96 overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">键盘快捷键</h3>

        <div className="space-y-4">
          {/* 全局快捷键 */}
          <div>
            <h4 className="font-medium mb-2">全局快捷键</h4>
            <table className="w-full text-sm">
              <tbody>
                {shortcuts.filter(s => s.scope === 'global').map(shortcut => (
                  <tr key={shortcut.action}>
                    <td className="py-1 pr-4">
                      <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                        {shortcut.key}
                      </kbd>
                    </td>
                    <td className="py-1">{shortcut.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 弹窗快捷键 */}
          <div>
            <h4 className="font-medium mb-2">弹窗快捷键</h4>
            <table className="w-full text-sm">
              <tbody>
                {shortcuts.filter(s => s.scope === 'popup').map(shortcut => (
                  <tr key={shortcut.action}>
                    <td className="py-1 pr-4">
                      <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                        {shortcut.key}
                      </kbd>
                    </td>
                    <td className="py-1">{shortcut.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-500 text-center">
          按 ? 键或 ESC 键关闭此窗口
        </div>
      </div>
    </div>
  );
}
```

### 📝 实施步骤

1. **第1天**: 快捷键定义和 ShortcutManager 实现
2. **第2天**: 集成到主界面，实现核心快捷键
3. **第3天**: 快捷键帮助 UI 和自定义设置

### ✅ 验收标准

- [ ] 支持至少 15 个常用快捷键
- [ ] 全局快捷键可在任意页面唤起扩展
- [ ] 快捷键冲突检测和提示
- [ ] 支持自定义快捷键配置
- [ ] 按 ? 键显示快捷键帮助

---

## 3. 智能语法推荐引擎

### 📖 功能描述

基于关键词分析和历史行为，自动推荐适合的搜索语法组合。

### 🎯 用户价值

- **智能辅助**: AI 级别的搜索优化建议
- **学习效果**: 通过推荐让用户了解最佳实践
- **精确度提升**: 提高搜索结果相关性 30-40%

### 💡 核心设计

#### 推荐引擎架构

```typescript
// src/services/suggestion-engine.ts

import type { SearchParams, SearchHistory, SyntaxType } from '@/types';

/**
 * 语法建议
 */
export interface SyntaxSuggestion {
  /** 建议类型 */
  type: 'auto' | 'context' | 'pattern' | 'history';

  /** 建议的语法 */
  syntax: SyntaxType;

  /** 建议理由 */
  reason: string;

  /** 置信度 (0-1) */
  confidence: number;

  /** 预览效果 */
  preview: string;

  /** 应用后的参数 */
  appliedParams: Partial<SearchParams>;
}

/**
 * 智能推荐引擎
 */
export class SuggestionEngine {
  /**
   * 获取推荐建议
   */
  getSuggestions(
    keyword: string,
    currentParams: SearchParams,
    history: SearchHistory[]
  ): SyntaxSuggestion[] {
    const suggestions: SyntaxSuggestion[] = [];

    // 1. 基于关键词模式识别
    suggestions.push(...this.analyzeKeywordPattern(keyword, currentParams));

    // 2. 基于搜索历史推荐
    suggestions.push(...this.analyzeHistory(keyword, history));

    // 3. 基于上下文推荐
    suggestions.push(...this.analyzeContext(currentParams));

    // 按置信度排序并去重
    return this.deduplicateAndSort(suggestions);
  }

  /**
   * 关键词模式识别
   */
  private analyzeKeywordPattern(
    keyword: string,
    currentParams: SearchParams
  ): SyntaxSuggestion[] {
    const suggestions: SyntaxSuggestion[] = [];
    const lowerKeyword = keyword.toLowerCase();

    // 学术搜索意图
    if (/论文|研究|学术|paper|research|journal/i.test(keyword)) {
      if (!currentParams.fileType) {
        suggestions.push({
          type: 'pattern',
          syntax: 'filetype',
          reason: '检测到学术搜索意图，建议添加 PDF 过滤',
          confidence: 0.85,
          preview: 'filetype:pdf',
          appliedParams: { fileType: 'pdf' }
        });
      }

      if (!currentParams.dateRange) {
        suggestions.push({
          type: 'pattern',
          syntax: 'date_range',
          reason: '学术搜索建议限制近5年文献',
          confidence: 0.75,
          preview: '2020-01-01 至今',
          appliedParams: {
            dateRange: {
              from: '2020-01-01',
              to: new Date().toISOString().split('T')[0]
            }
          }
        });
      }
    }

    // 站内搜索意图
    const sitePattern = /在(\w+)\s*搜索|search\s+in\s+(\w+)|site:(\S+)/i;
    const siteMatch = keyword.match(sitePattern);
    if (siteMatch && !currentParams.site) {
      const siteName = siteMatch[1] || siteMatch[2] || siteMatch[3];
      suggestions.push({
        type: 'pattern',
        syntax: 'site',
        reason: '检测到站内搜索意图',
        confidence: 0.9,
        preview: `site:${siteName}.com`,
        appliedParams: { site: `${siteName}.com` }
      });
    }

    // 新闻时效性意图
    if (/最新|今日|最近|latest|recent|today/i.test(keyword)) {
      if (!currentParams.dateRange) {
        suggestions.push({
          type: 'pattern',
          syntax: 'date_range',
          reason: '检测到时效性需求，建议限制最近24小时',
          confidence: 0.8,
          preview: '最近24小时',
          appliedParams: {
            dateRange: {
              from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              to: new Date().toISOString().split('T')[0]
            }
          }
        });
      }
    }

    // 精确匹配建议
    if (keyword.length > 15 && !currentParams.exactMatch) {
      suggestions.push({
        type: 'pattern',
        syntax: 'exact',
        reason: '关键词较长，建议使用精确匹配提高准确度',
        confidence: 0.7,
        preview: `"${keyword}"`,
        appliedParams: { exactMatch: keyword }
      });
    }

    // 技术文档搜索
    if (/文档|教程|api|docs|documentation|tutorial|guide/i.test(keyword)) {
      if (!currentParams.inUrl) {
        suggestions.push({
          type: 'pattern',
          syntax: 'inurl',
          reason: '技术搜索建议限定文档URL',
          confidence: 0.75,
          preview: 'inurl:docs',
          appliedParams: { inUrl: 'docs' }
        });
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

    // 查找相似的历史搜索
    const similar = history.filter(h =>
      this.calculateSimilarity(h.keyword, keyword) > 0.7
    );

    if (similar.length === 0) return suggestions;

    // 统计常用语法组合
    const syntaxUsage: Record<string, number> = {};

    similar.forEach(h => {
      if (h.syntax.site) syntaxUsage['site'] = (syntaxUsage['site'] || 0) + 1;
      if (h.syntax.fileType) syntaxUsage['filetype'] = (syntaxUsage['filetype'] || 0) + 1;
      if (h.syntax.exactMatch) syntaxUsage['exact'] = (syntaxUsage['exact'] || 0) + 1;
      if (h.syntax.dateRange) syntaxUsage['date_range'] = (syntaxUsage['date_range'] || 0) + 1;
    });

    // 生成历史推荐
    Object.entries(syntaxUsage).forEach(([syntax, count]) => {
      const confidence = Math.min(count / similar.length, 0.9);

      if (confidence > 0.5) {
        suggestions.push({
          type: 'history',
          syntax: syntax as SyntaxType,
          reason: `您在 ${count} 次类似搜索中使用了此语法`,
          confidence,
          preview: this.getPreview(syntax, similar[0]),
          appliedParams: this.extractParams(syntax, similar[0])
        });
      }
    });

    return suggestions;
  }

  /**
   * 基于上下文推荐
   */
  private analyzeContext(currentParams: SearchParams): SyntaxSuggestion[] {
    const suggestions: SyntaxSuggestion[] = [];

    // 如果已设置 site，建议添加 inurl
    if (currentParams.site && !currentParams.inUrl) {
      suggestions.push({
        type: 'context',
        syntax: 'inurl',
        reason: '已限定站点，可进一步限定 URL 路径',
        confidence: 0.6,
        preview: 'inurl:blog',
        appliedParams: { inUrl: 'blog' }
      });
    }

    // 如果设置了精确匹配，建议添加排除词
    if (currentParams.exactMatch && !currentParams.excludeWords?.length) {
      suggestions.push({
        type: 'context',
        syntax: 'exclude',
        reason: '精确匹配可能结果过多，建议排除不相关词',
        confidence: 0.5,
        preview: '-广告 -推广',
        appliedParams: { excludeWords: ['广告', '推广'] }
      });
    }

    return suggestions;
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

    return unique.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  }

  /**
   * 获取预览文本
   */
  private getPreview(syntax: string, history: SearchHistory): string {
    switch (syntax) {
      case 'site':
        return `site:${history.syntax.site}`;
      case 'filetype':
        return `filetype:${history.syntax.fileType}`;
      case 'exact':
        return `"${history.syntax.exactMatch}"`;
      case 'date_range':
        return `${history.syntax.dateRange?.from} 至 ${history.syntax.dateRange?.to}`;
      default:
        return syntax;
    }
  }

  /**
   * 提取参数
   */
  private extractParams(syntax: string, history: SearchHistory): Partial<SearchParams> {
    switch (syntax) {
      case 'site':
        return { site: history.syntax.site };
      case 'filetype':
        return { fileType: history.syntax.fileType };
      case 'exact':
        return { exactMatch: history.syntax.exactMatch };
      case 'date_range':
        return { dateRange: history.syntax.dateRange };
      default:
        return {};
    }
  }
}

// 导出单例
export const suggestionEngine = new SuggestionEngine();
```

#### 推荐建议 UI 组件

```typescript
// src/components/SuggestionPanel.tsx

import { useState, useEffect } from 'react';
import { suggestionEngine } from '@/services/suggestion-engine';
import type { SyntaxSuggestion, SearchParams, SearchHistory } from '@/types';

interface SuggestionPanelProps {
  keyword: string;
  currentParams: SearchParams;
  history: SearchHistory[];
  onApplySuggestion: (params: Partial<SearchParams>) => void;
}

export function SuggestionPanel({
  keyword,
  currentParams,
  history,
  onApplySuggestion
}: SuggestionPanelProps) {
  const [suggestions, setSuggestions] = useState<SyntaxSuggestion[]>([]);

  useEffect(() => {
    if (keyword.trim()) {
      const newSuggestions = suggestionEngine.getSuggestions(
        keyword,
        currentParams,
        history
      );
      setSuggestions(newSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [keyword, currentParams, history]);

  if (suggestions.length === 0) return null;

  return (
    <div className="suggestion-panel bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-blue-600 dark:text-blue-400">💡</span>
        <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100">
          智能推荐
        </h4>
      </div>

      <div className="space-y-2">
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded p-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
            onClick={() => onApplySuggestion(suggestion.appliedParams)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                    {suggestion.preview}
                  </code>
                  <span className="text-xs text-gray-500">
                    {Math.round(suggestion.confidence * 100)}% 匹配
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {suggestion.reason}
                </p>
              </div>
              <button className="text-xs text-blue-600 hover:text-blue-800">
                应用
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 📝 实施步骤

1. **第1-2天**: SuggestionEngine 核心逻辑实现
2. **第3-4天**: 模式识别规则完善
3. **第5天**: SuggestionPanel UI 组件开发
4. **第6-7天**: 集成测试和规则优化

### ✅ 验收标准

- [ ] 至少支持 8 种模式识别规则
- [ ] 历史推荐准确率 > 70%
- [ ] 推荐建议置信度计算合理
- [ ] 推荐建议 UI 清晰易懂
- [ ] 一键应用推荐参数

---

## 📊 P0 功能整体验收

### 性能指标

- [ ] 模板加载时间 < 200ms
- [ ] 快捷键响应时间 < 50ms
- [ ] 推荐建议生成时间 < 100ms

### 用户体验指标

- [ ] 新用户完成首次搜索时间 < 30秒
- [ ] 模板使用率 > 40%
- [ ] 快捷键使用率 > 20%（专业用户）
- [ ] 推荐建议采纳率 > 30%

### 质量指标

- [ ] 单元测试覆盖率 > 80%
- [ ] E2E 测试通过率 100%
- [ ] 无 P0/P1 级别 Bug

---

## 📚 相关文档

- [功能扩展文档 (P1)](./02-priority-p1-feature-expansion.md)
- [技术优化文档 (P2)](./03-priority-p2-technical-optimization.md)
- [实施路线图](./06-implementation-roadmap.md)

---

**下一步**: 完成 P0 功能后，继续阅读 [P1 功能扩展文档](./02-priority-p1-feature-expansion.md)
