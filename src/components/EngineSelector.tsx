/**
 * 搜索引擎选择器组件
 * 用于选择快捷键对应的搜索引擎
 */

import { useTranslation } from '@/i18n';
import { SearchAdapterFactory } from '@/services/adapters';
import type { SearchEngine } from '@/types';

interface EngineSelectorProps {
  /** 当前选中的引擎 */
  value: SearchEngine;
  /** 引擎变化回调 */
  onChange: (engine: SearchEngine) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否显示清除按钮 */
  showClear?: boolean;
}

export function EngineSelector({
  value,
  onChange,
  disabled = false,
  showClear = false
}: EngineSelectorProps) {
  const { t } = useTranslation();
  const supportedEngines = SearchAdapterFactory.getSupportedEngines();

  const clearSelection = () => {
    // 默认选择第一个引擎
    onChange(supportedEngines[0]);
  };

  return (
    <div className="flex gap-2">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SearchEngine)}
        disabled={disabled}
        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {supportedEngines.map((engine) => (
          <option key={engine} value={engine}>
            {t(`common.searchEngines.${engine}`, {}, SearchAdapterFactory.getEngineName(engine))}
          </option>
        ))}
      </select>

      {showClear && (
        <button
          onClick={clearSelection}
          disabled={disabled}
          className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={t('common.reset', {}, 'Reset')}
        >
          ↻
        </button>
      )}
    </div>
  );
}
