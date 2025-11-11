/**
 * 模板选择器组件
 */

import { useState, useEffect } from 'react';
import { templateManager } from '@/services/template-manager';
import type { SearchTemplate, TemplateCategory } from '@/types/template';
import type { SearchParams } from '@/types';

interface TemplateSelectorProps {
  currentParams: SearchParams;
  onApplyTemplate: (params: SearchParams) => void;
  onClose: () => void;
}

export function TemplateSelector({ 
  currentParams, 
  onApplyTemplate,
  onClose
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<SearchTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      await templateManager.initialize();
      setTemplates(templateManager.getAllTemplates());
    } catch (error) {
      console.error('加载模板失败:', error);
    } finally {
      setLoading(false);
    }
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
    try {
      const newParams = await templateManager.applyTemplate(templateId, currentParams);
      onApplyTemplate(newParams);
      onClose();
    } catch (error) {
      console.error('应用模板失败:', error);
    }
  };

  const categoryMeta = templateManager.getCategoryMeta();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              📋 搜索模板
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 搜索框 */}
          <input
            type="text"
            placeholder="搜索模板..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input w-full"
          />
        </div>

        {/* 分类选择器 */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as TemplateCategory | 'all')}
            className="select w-full"
          >
            <option value="all">📋 全部分类</option>
            {categoryMeta.slice(0, -1).map((meta) => (
              <option key={meta.category} value={meta.category}>
                {meta.icon} {meta.name}
              </option>
            ))}
          </select>
        </div>

        {/* 模板列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">加载中...</div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              未找到匹配的模板
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  onClick={() => handleApply(template.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{template.icon}</span>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {template.name}
                        </h4>
                        {!template.isBuiltIn && (
                          <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded">
                            自定义
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {template.description}
                      </p>
                      <div className="flex gap-1 flex-wrap">
                        {template.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      使用 {template.usageCount} 次
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            💡 提示: 点击模板即可快速应用 | 按 Esc 关闭
          </p>
        </div>
      </div>
    </div>
  );
}
