/**
 * 快捷键设置页面组件
 * 完整的快捷键自定义和管理界面
 */

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '@/i18n';
import { shortcutManager } from '@/services/shortcut-manager';
import { SHORTCUT_GROUPS, DEFAULT_SHORTCUTS, getShortcutDisplayText } from '@/config/keyboard-shortcuts';
import { ShortcutRecorder } from './ShortcutRecorder';
import { EngineSelector } from './EngineSelector';
import { SearchAdapterFactory } from '@/services/adapters';
import type { KeyboardShortcut, ShortcutGroup } from '@/types/shortcut';
import type { SearchEngine } from '@/types';

// 扩展类型,添加 id 字段用于 UI 管理
type KeyboardShortcutWithId = KeyboardShortcut & { id: string };

interface ShortcutConflict {
  id: string;
  shortcut: KeyboardShortcut;
}

/**
 * 创建快捷键ID反向索引映射（一次性计算，O(1)查找）
 * 使用 key + action 作为唯一标识
 */
const createShortcutIdMap = (): Map<string, string> => {
  const map = new Map<string, string>();
  Object.entries(DEFAULT_SHORTCUTS).forEach(([id, shortcut]) => {
    const key = `${shortcut.key}:${shortcut.action}`;
    map.set(key, id);
  });
  return map;
};

// 全局常量，只初始化一次
const SHORTCUT_ID_MAP = createShortcutIdMap();

/**
 * 根据 key + action 查找快捷键ID（O(1)性能）
 */
const findShortcutId = (shortcut: KeyboardShortcut): string | undefined => {
  const key = `${shortcut.key}:${shortcut.action}`;
  const id = SHORTCUT_ID_MAP.get(key);

  // 添加调试日志（仅在未找到时警告）
  if (!id) {
    console.warn(`[ShortcutSettings] 未找到快捷键ID: key="${shortcut.key}", action="${shortcut.action}"`);
  }

  return id;
};

/**
 * 获取浏览器扩展快捷键设置页面URL
 */
const getBrowserShortcutsUrl = (): string => {
  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes('edg/')) {
    return 'edge://extensions/shortcuts';
  } else if (userAgent.includes('chrome')) {
    return 'chrome://extensions/shortcuts';
  } else if (userAgent.includes('firefox')) {
    return 'about:addons';
  } else {
    // 默认返回 Chrome URL
    return 'chrome://extensions/shortcuts';
  }
};

/**
 * 打开浏览器扩展快捷键设置页面
 */
const openBrowserShortcutsPage = () => {
  const url = getBrowserShortcutsUrl();
  chrome.tabs.create({ url });
};

/**
 * 根据快捷键的 actionParam 或 targetEngine 获取默认目标引擎
 * 支持引擎名称（推荐）和索引（向后兼容）两种方式
 */
const getDefaultTargetEngine = (shortcut: KeyboardShortcut): SearchEngine => {
  const supportedEngines = SearchAdapterFactory.getSupportedEngines();

  // 优先级1: 如果已经设置了 targetEngine，验证并返回
  if (shortcut.targetEngine) {
    // 验证 targetEngine 是否在支持列表中
    if (supportedEngines.includes(shortcut.targetEngine as SearchEngine)) {
      return shortcut.targetEngine as SearchEngine;
    }
    // 如果 targetEngine 无效，记录警告
    console.warn(`[ShortcutSettings] 无效的 targetEngine: "${shortcut.targetEngine}",将使用 actionParam 或默认值`);
  }

  // 优先级2: 如果 actionParam 是字符串（引擎名称），验证并返回
  if (typeof shortcut.actionParam === 'string') {
    if (supportedEngines.includes(shortcut.actionParam as SearchEngine)) {
      return shortcut.actionParam as SearchEngine;
    }
    // 如果引擎名称无效，记录警告
    console.warn(`[ShortcutSettings] 无效的 actionParam 引擎名称: "${shortcut.actionParam}",将使用默认值`);
  }

  // 优先级3: 如果 actionParam 是数字（索引，向后兼容），验证并返回
  if (typeof shortcut.actionParam === 'number') {
    // 添加边界检查
    if (shortcut.actionParam >= 0 && shortcut.actionParam < supportedEngines.length) {
      return supportedEngines[shortcut.actionParam];
    }
    // 如果索引越界，记录警告
    console.warn(`[ShortcutSettings] actionParam 索引越界: ${shortcut.actionParam} (有效范围: 0-${supportedEngines.length - 1}),将使用默认值`);
  }

  // 降级：返回第一个引擎
  return supportedEngines[0];
};

export function ShortcutSettings() {
  const { t } = useTranslation();
  const [shortcuts, setShortcuts] = useState<Map<string, KeyboardShortcut>>(new Map());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempKey, setTempKey] = useState('');
  const [tempEngine, setTempEngine] = useState<SearchEngine | null>(null);
  const [conflict, setConflict] = useState<ShortcutConflict | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [globalShortcut, setGlobalShortcut] = useState<string | null>(null);

  // 加载快捷键配置
  useEffect(() => {
    loadShortcuts();
  }, []);

  // 加载全局快捷键配置
  useEffect(() => {
    loadGlobalShortcut();
  }, []);

  // 监听存储变化，实时更新快捷键配置
  useEffect(() => {
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, namespace: string) => {
      if (namespace === 'local' && changes['custom_shortcuts']) {
        console.log('[ShortcutSettings] 检测到快捷键配置变化，重新加载');
        loadShortcuts();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  // 监听全局快捷键变更（实时同步）
  useEffect(() => {
    // 检查 chrome.commands.onChanged API 是否可用
    // 注意：onChanged 从 Chrome 116+ 开始支持
    if (!chrome?.commands?.onChanged) {
      console.warn('[ShortcutSettings] chrome.commands.onChanged API 不可用（需要 Chrome 116+）');
      return;
    }

    // 定义快捷键变更处理函数
    const handleCommandChanged = (changeInfo: chrome.commands.CommandChangedInfo) => {
      // 只处理打开面板的快捷键
      if (changeInfo.name === '_execute_action') {
        // 直接更新状态，无需重新调用 loadGlobalShortcut
        setGlobalShortcut(changeInfo.newShortcut || null);

        // 记录日志以便调试
        console.log('[ShortcutSettings] 全局快捷键已更新:', changeInfo.newShortcut || '已移除');
      }
    };

    // 注册监听器
    chrome.commands.onChanged.addListener(handleCommandChanged);

    // 清理函数：组件卸载时移除监听器，防止内存泄漏
    return () => {
      chrome.commands.onChanged.removeListener(handleCommandChanged);
    };
  }, []); // 空依赖数组，只在组件挂载时执行一次

  const loadShortcuts = async () => {
    // 🔥 P0修复：Options 页面应使用 'options' scope，避免与 Popup 页面的监听器冲突
    await shortcutManager.initialize('options');
    // 直接使用 manager 的 Map,避免查找逻辑错误
    const shortcutMap = shortcutManager.getShortcutsMap();
    setShortcuts(shortcutMap);
  };

  const loadGlobalShortcut = () => {
    // 1. 环境检查：验证 chrome.commands API 是否可用
    if (!chrome?.commands?.getAll) {
      console.warn('[ShortcutSettings] chrome.commands API 不可用');
      setGlobalShortcut(null);
      return;
    }

    // 2. API调用 + 完整的错误处理
    chrome.commands.getAll((commands) => {
      // 检查运行时错误
      if (chrome.runtime.lastError) {
        console.error('[ShortcutSettings] 读取快捷键失败:', chrome.runtime.lastError);
        setGlobalShortcut(null);
        return;
      }

      // 3. 边界情况处理
      const openPanelCommand = commands.find(cmd => cmd.name === '_execute_action');
      if (openPanelCommand?.shortcut) {
        // 已配置的快捷键
        setGlobalShortcut(openPanelCommand.shortcut);
      } else if (openPanelCommand && !openPanelCommand.shortcut) {
        // 用户主动移除快捷键
        setGlobalShortcut(null);
      } else {
        // 降级到默认值（manifest.json 中的默认配置）
        const isMac = navigator.platform.toLowerCase().includes('mac');
        setGlobalShortcut(isMac ? 'Command+Shift+F' : 'Ctrl+Shift+F');
      }
    });
  };

  // 组织快捷键分组数据
  const groups: (ShortcutGroup & { shortcuts: KeyboardShortcutWithId[] })[] = useMemo(() => {
    return SHORTCUT_GROUPS.map(group => {
      const groupShortcuts: KeyboardShortcutWithId[] = group.shortcuts.map(shortcut => {
        // 使用优化的 O(1) ID查找
        const id = findShortcutId(shortcut);

        if (!id) {
          // 理论上不应该发生，但添加类型守卫
          return null;
        }

        // 从 shortcuts Map 中获取最新状态
        const currentShortcut = shortcuts.get(id);

        return {
          ...(currentShortcut || shortcut),
          id
        } as KeyboardShortcutWithId;
      }).filter((sc): sc is KeyboardShortcutWithId => sc !== null && !!sc.id); // 类型守卫

      return {
        ...group,
        shortcuts: groupShortcuts
      };
    });
  }, [shortcuts]);

  // 检查快捷键冲突
  const checkConflict = (key: string, excludeId: string): ShortcutConflict | null => {
    for (const [id, shortcut] of shortcuts.entries()) {
      if (id !== excludeId && shortcut.key === key && shortcut.enabled) {
        return { id, shortcut };
      }
    }
    return null;
  };

  // 开始编辑快捷键
  const startEdit = (id: string, shortcut: KeyboardShortcutWithId) => {
    if (!shortcut.customizable) {
      showMessage('error', t('shortcuts.settings.notCustomizable', {}, 'This shortcut cannot be customized'));
      return;
    }

    setEditingId(id);
    setTempKey(shortcut.key);

    // 对于引擎切换快捷键，获取默认目标引擎
    if (shortcut.action === 'SWITCH_ENGINE') {
      setTempEngine(getDefaultTargetEngine(shortcut));
    } else {
      setTempEngine(null);
    }

    setConflict(null);
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingId(null);
    setTempKey('');
    setTempEngine(null);
    setConflict(null);
  };

  // 保存快捷键修改
  const saveEdit = async () => {
    if (!editingId) return;

    const shortcut = shortcuts.get(editingId);
    if (!shortcut) return;

    // 检查冲突
    if (tempKey && tempKey !== shortcut.key) {
      const conflictResult = checkConflict(tempKey, editingId);
      if (conflictResult) {
        setConflict(conflictResult);
        return;
      }
    }

    setSaving(true);

    try {
      // 更新快捷键组合
      if (tempKey !== shortcut.key) {
        await shortcutManager.updateShortcut(editingId, tempKey);
      }

      // 更新引擎选择 (对于 SWITCH_ENGINE 类型)
      if (shortcut.action === 'SWITCH_ENGINE' && tempEngine && tempEngine !== shortcut.targetEngine) {
        await shortcutManager.updateShortcutEngine(editingId, tempEngine);
      }

      // 重新加载以获取最新状态
      await loadShortcuts();
      showMessage('success', t('shortcuts.settings.saveSuccess', {}, 'Shortcut saved successfully'));
      cancelEdit();
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Failed to save shortcut');
    } finally {
      setSaving(false);
    }
  };

  // 切换快捷键启用状态
  const toggleShortcut = async (id: string, enabled: boolean) => {
    setSaving(true);
    try {
      await shortcutManager.toggleShortcut(id, enabled);
      await loadShortcuts();
      showMessage('success', t('shortcuts.settings.toggleSuccess', {}, 'Shortcut status updated'));
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Failed to update shortcut');
    } finally {
      setSaving(false);
    }
  };

  // 重置单个快捷键
  const resetShortcut = async (id: string) => {
    if (!confirm(t('shortcuts.settings.confirmReset', {}, 'Reset this shortcut to default?'))) {
      return;
    }

    setSaving(true);
    try {
      await shortcutManager.resetShortcut(id);
      await loadShortcuts();
      showMessage('success', t('shortcuts.settings.resetSuccess', {}, 'Shortcut reset successfully'));
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Failed to reset shortcut');
    } finally {
      setSaving(false);
    }
  };

  // 重置所有快捷键
  const resetAll = async () => {
    if (!confirm(t('shortcuts.settings.confirmResetAll', {}, 'Reset all shortcuts to default?'))) {
      return;
    }

    setSaving(true);
    try {
      await shortcutManager.resetAllShortcuts();
      await loadShortcuts();
      showMessage('success', t('shortcuts.settings.resetAllSuccess', {}, 'All shortcuts reset successfully'));
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Failed to reset shortcuts');
    } finally {
      setSaving(false);
    }
  };

  // 显示消息
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* 头部说明 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⌨️</span>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              {t('shortcuts.settings.title', {}, 'Keyboard Shortcuts')}
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {t('shortcuts.settings.description', {}, 'Customize keyboard shortcuts for faster workflow. Click on a shortcut to edit it.')}
            </p>
          </div>
        </div>
      </div>

      {/* 全局快捷键引导卡片 */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-lg p-5">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center">
              <span className="text-2xl">🌐</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
              {t('shortcuts.settings.globalShortcuts', {}, '全局快捷键')}
              <span className="text-xs px-2 py-0.5 bg-purple-200 dark:bg-purple-700 text-purple-800 dark:text-purple-200 rounded-full">
                {t('shortcuts.settings.browserManaged', {}, '浏览器管理')}
              </span>
            </h3>
            <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
              {t('shortcuts.settings.globalDescription', {}, '全局快捷键（如打开搜索面板）由浏览器管理，无法在此页面修改。请点击下方按钮前往浏览器设置页面进行配置。')}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={openBrowserShortcutsPage}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium shadow-sm flex items-center gap-2"
              >
                <span>🔗</span>
                {t('shortcuts.settings.openBrowserSettings', {}, '打开浏览器快捷键设置')}
              </button>
              <div className="text-xs text-purple-600 dark:text-purple-400 font-mono">
                {getBrowserShortcutsUrl()}
              </div>
            </div>
            <div className="mt-3 p-3 bg-white/50 dark:bg-black/20 rounded border border-purple-200 dark:border-purple-800">
              <p className="text-xs text-purple-600 dark:text-purple-400 mb-1 font-medium">
                💡 {t('shortcuts.settings.currentGlobalShortcut', {}, '当前全局快捷键配置')}:
              </p>
              <div className="flex items-center gap-2">
                {globalShortcut ? (
                  <>
                    <kbd className="px-2 py-1 bg-purple-100 dark:bg-purple-800 rounded shadow-sm border border-purple-300 dark:border-purple-600 font-mono text-xs font-semibold text-purple-800 dark:text-purple-200">
                      {getShortcutDisplayText(globalShortcut)}
                    </kbd>
                    <span className="text-xs text-purple-700 dark:text-purple-300">
                      - {t('shortcuts.settings.openSearchPanel', {}, '打开搜索面板')}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-purple-600 dark:text-purple-400 italic">
                    {t('shortcuts.settings.notSet', {}, '未设置')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 消息提示 */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* 快捷键分组列表 */}
      {groups.map((group, groupIndex) => (
        <div key={groupIndex} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {group.nameKey ? t(group.nameKey, {}, group.name) : group.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {group.descriptionKey ? t(group.descriptionKey, {}, group.description) : group.description}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {group.shortcuts.map((shortcut: KeyboardShortcutWithId) => {
              const isEditing = editingId === shortcut.id;
              const isEngineSwitch = shortcut.action === 'SWITCH_ENGINE';
              // 使用 useMemo 缓存默认引擎计算结果，避免重复调用
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const defaultEngine = useMemo(() => {
                if (!isEngineSwitch) return null;
                const engine = getDefaultTargetEngine(shortcut);
                console.log(`[ShortcutSettings] 快捷键 ${shortcut.id} 的目标引擎:`, engine);
                return engine;
              }, [shortcut, isEngineSwitch]);

              return (
                <div
                  key={shortcut.id}
                  className={`
                    p-4 rounded-lg border-2 transition-all
                    ${isEditing
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <div className="flex items-center gap-4">
                    {/* 启用开关 */}
                    <input
                      type="checkbox"
                      checked={shortcut.enabled}
                      onChange={(e) => toggleShortcut(shortcut.id, e.target.checked)}
                      disabled={saving}
                      className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 disabled:opacity-50"
                    />

                    {/* 快捷键信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {shortcut.action === 'SWITCH_ENGINE' && shortcut.targetEngine
                            ? t('shortcutHint.switchEngine', { engine: t(`common.searchEngines.${shortcut.targetEngine}`, {}, shortcut.targetEngine) })
                            : (shortcut.descriptionKey ? t(shortcut.descriptionKey, {}, shortcut.description) : shortcut.description)}
                        </span>
                        {!shortcut.customizable && (
                          <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                            {t('shortcuts.settings.fixed', {}, 'Fixed')}
                          </span>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="space-y-3">
                          {/* 快捷键录制 */}
                          <ShortcutRecorder
                            value={tempKey}
                            onChange={setTempKey}
                            placeholder={getShortcutDisplayText(shortcut.key)}
                            conflictMessage={
                              conflict
                                ? t('shortcuts.settings.conflict', { name: conflict.shortcut.description }, `Conflicts with: ${conflict.shortcut.description}`)
                                : undefined
                            }
                          />

                          {/* 引擎选择 (仅用于引擎切换快捷键) */}
                          {isEngineSwitch && defaultEngine && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('shortcuts.settings.targetEngine', {}, 'Target Search Engine')}
                              </label>
                              <EngineSelector
                                value={tempEngine || defaultEngine}
                                onChange={setTempEngine}
                              />
                            </div>
                          )}

                          {/* 编辑操作按钮 */}
                          <div className="flex gap-2">
                            <button
                              onClick={saveEdit}
                              disabled={saving || !tempKey || !!conflict}
                              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {saving ? t('common.saving', {}, 'Saving...') : t('common.save', {}, 'Save')}
                            </button>
                            <button
                              onClick={cancelEdit}
                              disabled={saving}
                              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                            >
                              {t('common.cancel', {}, 'Cancel')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <kbd className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded shadow-sm border border-gray-300 dark:border-gray-600 font-mono text-sm font-semibold text-gray-800 dark:text-gray-200">
                            {getShortcutDisplayText(shortcut.key)}
                          </kbd>

                          {isEngineSwitch && defaultEngine && (
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              → {t(`common.searchEngines.${defaultEngine}`, {}, defaultEngine)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 操作按钮 */}
                    {!isEditing && (
                      <div className="flex gap-2">
                        {shortcut.customizable && (
                          <button
                            onClick={() => startEdit(shortcut.id, shortcut)}
                            disabled={saving}
                            className="px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
                            title={t('common.edit', {}, 'Edit')}
                          >
                            ✏️
                          </button>
                        )}
                        <button
                          onClick={() => resetShortcut(shortcut.id)}
                          disabled={saving}
                          className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                          title={t('common.reset', {}, 'Reset')}
                        >
                          ↻
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* 底部操作 */}
      <div className="flex justify-end gap-3">
        <button
          onClick={resetAll}
          disabled={saving}
          className="px-6 py-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {t('shortcuts.settings.resetAll', {}, 'Reset All to Default')}
        </button>
      </div>
    </div>
  );
}
