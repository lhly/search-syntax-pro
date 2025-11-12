/**
 * 键盘快捷键相关类型定义
 */

/**
 * 快捷键作用域
 */
export type ShortcutScope = 'global' | 'popup' | 'options';

/**
 * 快捷键操作类型
 */
export type ShortcutAction =
  // 全局操作
  | 'OPEN_POPUP'

  // 弹窗内操作
  | 'EXECUTE_SEARCH'
  | 'OPEN_HISTORY'
  | 'OPEN_TEMPLATES'
  | 'COPY_QUERY'
  | 'TOGGLE_ADVANCED'
  | 'CLOSE_POPUP'
  | 'FOCUS_KEYWORD'
  | 'NEXT_FIELD'
  | 'PREV_FIELD'
  | 'SHOW_SHORTCUTS_HELP'

  // 引擎切换
  | 'SWITCH_ENGINE'

  // 其他
  | 'CLEAR_FORM';

/**
 * 快捷键定义
 */
export interface KeyboardShortcut {
  /** 快捷键组合 (例: 'Ctrl+K', 'Alt+Shift+F') */
  key: string;

  /** 快捷键描述 (已弃用，请使用 descriptionKey) */
  description: string;

  /** 快捷键描述的翻译键 */
  descriptionKey?: string;

  /** 执行的动作 */
  action: ShortcutAction;

  /** 动作参数（可选，支持引擎名称或索引以保持向后兼容） */
  actionParam?: string | number;

  /** 作用域 */
  scope: ShortcutScope;

  /** 是否可自定义 */
  customizable: boolean;

  /** 是否启用 */
  enabled: boolean;

  /** 目标引擎 (仅用于 SWITCH_ENGINE 动作,指定要切换到的引擎)
   * 注意: 类型为 string 以保持与 SearchEngine 的兼容性,但实际值应为有效的 SearchEngine
   */
  targetEngine?: string; // SearchEngine type from @/types
}

/**
 * 快捷键分组
 */
export interface ShortcutGroup {
  /** 分组名称 (fallback) */
  name: string;
  /** 分组名称的翻译键 */
  nameKey?: string;
  /** 分组描述 (fallback) */
  description: string;
  /** 分组描述的翻译键 */
  descriptionKey?: string;
  /** 该分组包含的快捷键 */
  shortcuts: KeyboardShortcut[];
}
