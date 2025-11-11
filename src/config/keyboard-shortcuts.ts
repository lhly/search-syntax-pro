/**
 * 键盘快捷键配置
 */

import type { KeyboardShortcut, ShortcutGroup } from '../types/shortcut';

/**
 * 默认快捷键配置
 *
 * 注意：全局快捷键（如打开popup）由 manifest.json 的 commands 配置管理，
 * 只能在浏览器扩展设置页面（chrome://extensions/shortcuts）修改。
 * 此处仅管理 popup 内的快捷键。
 */
export const DEFAULT_SHORTCUTS: Record<string, KeyboardShortcut> = {
  // ========== 弹窗内快捷键 ==========
  'execute_search': {
    key: 'Ctrl+Enter',
    description: '执行搜索',
    action: 'EXECUTE_SEARCH',
    scope: 'popup',
    customizable: true,
    enabled: true
  },

  'open_history': {
    key: 'Ctrl+Shift+H',
    description: '打开搜索历史',
    action: 'OPEN_HISTORY',
    scope: 'popup',
    customizable: true,
    enabled: true
  },

  'open_templates': {
    key: 'Ctrl+Shift+T',
    description: '打开模板选择器',
    action: 'OPEN_TEMPLATES',
    scope: 'popup',
    customizable: true,
    enabled: true
  },

  'copy_query': {
    key: 'Ctrl+Shift+C',
    description: '复制生成的查询',
    action: 'COPY_QUERY',
    scope: 'popup',
    customizable: true,
    enabled: true
  },

  'toggle_advanced': {
    key: 'Ctrl+Shift+A',
    description: '切换高级选项',
    action: 'TOGGLE_ADVANCED',
    scope: 'popup',
    customizable: true,
    enabled: true
  },

  'close_popup': {
    key: 'Escape',
    description: '关闭面板',
    action: 'CLOSE_POPUP',
    scope: 'popup',
    customizable: false,
    enabled: true
  },

  'focus_keyword': {
    key: 'Ctrl+K',
    description: '聚焦关键词输入框',
    action: 'FOCUS_KEYWORD',
    scope: 'popup',
    customizable: true,
    enabled: true
  },

  'next_field': {
    key: 'Tab',
    description: '下一个输入框',
    action: 'NEXT_FIELD',
    scope: 'popup',
    customizable: false,
    enabled: true
  },

  'prev_field': {
    key: 'Shift+Tab',
    description: '上一个输入框',
    action: 'PREV_FIELD',
    scope: 'popup',
    customizable: false,
    enabled: true
  },

  'show_shortcuts': {
    key: '?',
    description: '显示快捷键帮助',
    action: 'SHOW_SHORTCUTS_HELP',
    scope: 'popup',
    customizable: false,
    enabled: true
  },

  'clear_form': {
    key: 'Ctrl+L',
    description: '清空表单',
    action: 'CLEAR_FORM',
    scope: 'popup',
    customizable: true,
    enabled: true
  },

  // ========== 引擎切换快捷键 ==========
  'switch_engine_1': {
    key: 'Ctrl+1',
    description: '切换到百度搜索',
    action: 'SWITCH_ENGINE',
    actionParam: 'baidu',
    targetEngine: 'baidu',
    scope: 'popup',
    customizable: true,
    enabled: true
  },

  'switch_engine_2': {
    key: 'Ctrl+2',
    description: '切换到谷歌搜索',
    action: 'SWITCH_ENGINE',
    actionParam: 'google',
    targetEngine: 'google',
    scope: 'popup',
    customizable: true,
    enabled: true
  },

  'switch_engine_3': {
    key: 'Ctrl+3',
    description: '切换到必应搜索',
    action: 'SWITCH_ENGINE',
    actionParam: 'bing',
    targetEngine: 'bing',
    scope: 'popup',
    customizable: true,
    enabled: true
  },

  'switch_engine_4': {
    key: 'Ctrl+4',
    description: '切换到推特搜索',
    action: 'SWITCH_ENGINE',
    actionParam: 'twitter',
    targetEngine: 'twitter',
    scope: 'popup',
    customizable: true,
    enabled: true
  },

  'switch_engine_5': {
    key: 'Ctrl+5',
    description: '切换到鸭鸭搜索',
    action: 'SWITCH_ENGINE',
    actionParam: 'duckduckgo',
    targetEngine: 'duckduckgo',
    scope: 'popup',
    customizable: true,
    enabled: true
  }
};

/**
 * 快捷键分组配置（用于 UI 展示）
 *
 * 注意：全局快捷键不在此列表中，因为它们由浏览器管理
 */
export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    name: '搜索操作',
    description: '执行搜索和查询相关操作',
    shortcuts: [
      DEFAULT_SHORTCUTS['execute_search'],
      DEFAULT_SHORTCUTS['copy_query'],
      DEFAULT_SHORTCUTS['clear_form']
    ]
  },
  {
    name: '导航和界面',
    description: '界面导航和面板控制',
    shortcuts: [
      DEFAULT_SHORTCUTS['focus_keyword'],
      DEFAULT_SHORTCUTS['next_field'],
      DEFAULT_SHORTCUTS['prev_field'],
      DEFAULT_SHORTCUTS['close_popup'],
      DEFAULT_SHORTCUTS['show_shortcuts']
    ]
  },
  {
    name: '功能面板',
    description: '打开各种功能面板',
    shortcuts: [
      DEFAULT_SHORTCUTS['open_history'],
      DEFAULT_SHORTCUTS['open_templates'],
      DEFAULT_SHORTCUTS['toggle_advanced']
    ]
  },
  {
    name: '引擎切换',
    description: '快速切换搜索引擎',
    shortcuts: [
      DEFAULT_SHORTCUTS['switch_engine_1'],
      DEFAULT_SHORTCUTS['switch_engine_2'],
      DEFAULT_SHORTCUTS['switch_engine_3'],
      DEFAULT_SHORTCUTS['switch_engine_4'],
      DEFAULT_SHORTCUTS['switch_engine_5']
    ]
  }
];

/**
 * 获取快捷键的显示文本（考虑平台差异）
 */
export function getShortcutDisplayText(key: string): string {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  return key
    .replace(/Ctrl/g, isMac ? '⌘' : 'Ctrl')
    .replace(/Alt/g, isMac ? '⌥' : 'Alt')
    .replace(/Shift/g, isMac ? '⇧' : 'Shift')
    .replace(/Enter/g, '↵')
    .replace(/Escape/g, 'Esc')
    .replace(/Tab/g, '⇥');
}
