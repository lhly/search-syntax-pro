/**
 * 快捷键帮助组件
 */

import { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n';
import { SHORTCUT_GROUPS, getShortcutDisplayText } from '@/config/keyboard-shortcuts';
import { shortcutManager } from '@/services/shortcut-manager';
import type { ShortcutGroup } from '@/types/shortcut';

interface ShortcutHintProps {
  onClose: () => void;
}

export function ShortcutHint({ onClose }: ShortcutHintProps) {
  const { t } = useTranslation();
  const [groups, setGroups] = useState<ShortcutGroup[]>([]);

  useEffect(() => {
    const loadShortcuts = async () => {
      // 确保 shortcutManager 已初始化
      await shortcutManager.initialize('popup');

      // 获取最新的快捷键配置
      const shortcutsMap = shortcutManager.getShortcutsMap();

      // 更新分组中的快捷键配置
      const updatedGroups = SHORTCUT_GROUPS.map(group => ({
        ...group,
        shortcuts: group.shortcuts.map(shortcut => {
          // 从 shortcutManager 中找到对应的快捷键
          for (const [, sc] of shortcutsMap.entries()) {
            if (sc.action === shortcut.action && sc.key === shortcut.key) {
              return sc;
            }
          }
          return shortcut;
        })
      }));

      setGroups(updatedGroups);
    };

    loadShortcuts();

    // 监听 ESC 键关闭
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⌨️</span>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {t('shortcutHint.title')}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 快捷键列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {groups.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {group.nameKey ? t(group.nameKey, {}, group.name) : group.name}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {group.descriptionKey ? t(group.descriptionKey, {}, group.description) : group.description}
                  </span>
                </div>

                <div className="space-y-2">
                  {group.shortcuts.map((shortcut, index) => {
                    // 获取引擎的国际化名称
                    const engineName = shortcut.targetEngine
                      ? t(`common.searchEngines.${shortcut.targetEngine}`, {}, shortcut.targetEngine)
                      : '';
                    const description = shortcut.action === 'SWITCH_ENGINE' && shortcut.targetEngine
                      ? t('shortcutHint.switchEngine', { engine: engineName })
                      : (shortcut.descriptionKey ? t(shortcut.descriptionKey, {}, shortcut.description) : shortcut.description);

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <kbd className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded shadow-sm border border-gray-300 dark:border-gray-600 font-mono text-sm font-semibold text-gray-800 dark:text-gray-200 min-w-[100px] text-center">
                            {getShortcutDisplayText(shortcut.key)}
                          </kbd>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {description}
                            </span>
                          </div>
                        </div>
                        {!shortcut.enabled && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {t('shortcutHint.disabled')}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 底部提示 */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <span>{t('shortcutHint.customizeHint')}</span>
              <button
                onClick={() => chrome.runtime.openOptionsPage()}
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                {t('shortcutHint.openSettings')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 快捷键提示触发器组件（显示在Header中）
 */
export function ShortcutHintTrigger({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();

  return (
    <button
      onClick={onClick}
      className="btn btn-header"
      title={t('shortcutHint.triggerTitle')}
      aria-label={t('shortcutHint.triggerLabel')}
    >
      <span className="text-lg font-bold">?</span>
    </button>
  );
}
