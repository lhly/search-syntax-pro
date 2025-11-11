/**
 * 键盘快捷键管理服务
 */

import { DEFAULT_SHORTCUTS } from '../config/keyboard-shortcuts';
import type { KeyboardShortcut, ShortcutScope, ShortcutAction } from '../types/shortcut';

// 存储键
const STORAGE_KEY_CUSTOM_SHORTCUTS = 'custom_shortcuts';

/**
 * 快捷键处理函数类型
 */
export type ShortcutHandler = (actionParam?: string | number) => void | Promise<void>;

/**
 * 快捷键管理器
 */
export class ShortcutManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private handlers: Map<ShortcutAction, ShortcutHandler> = new Map();
  private initialized = false;
  private currentScope: ShortcutScope = 'popup';
  private storageListener: ((changes: { [key: string]: chrome.storage.StorageChange }, namespace: string) => void) | null = null;
  private boundHandleKeyPress: ((event: KeyboardEvent) => void) | null = null;
  // 🔥 P0修复：并发初始化保护 - 防止多次同时调用 initialize()
  private initializePromise: Promise<void> | null = null;
  // 🔥 P1改进：防抖定时器 - 避免频繁重载配置
  private reloadDebounceTimer: number | null = null;

  /**
   * 初始化快捷键管理器
   * 🔥 P0修复：添加并发初始化保护，防止竞态条件
   */
  async initialize(scope: ShortcutScope = 'popup'): Promise<void> {
    // 如果已经初始化完成，直接返回
    if (this.initialized) {
      console.log(`[ShortcutManager] 已初始化 (scope: ${this.currentScope})，跳过重复初始化`);
      return;
    }

    // 如果正在初始化中，等待完成后返回
    if (this.initializePromise) {
      console.log(`[ShortcutManager] 等待正在进行的初始化完成...`);
      return this.initializePromise;
    }

    // 创建初始化 Promise 并缓存
    this.initializePromise = (async () => {
      console.log(`[ShortcutManager] 开始初始化 (scope: ${scope})`);
      this.currentScope = scope;
      await this.loadShortcuts();
      this.setupListeners();
      this.setupStorageListener();
      this.initialized = true;
      console.log(`[ShortcutManager] 初始化完成 (scope: ${scope})`);
    })();

    try {
      await this.initializePromise;
    } finally {
      // 清空缓存，允许下次调用（例如 destroy 后重新初始化）
      this.initializePromise = null;
    }
  }

  /**
   * 加载快捷键配置
   */
  private async loadShortcuts(): Promise<void> {
    // 加载默认快捷键
    Object.entries(DEFAULT_SHORTCUTS).forEach(([id, shortcut]) => {
      this.shortcuts.set(id, { ...shortcut });
    });

    // 加载用户自定义快捷键
    try {
      const result = await chrome.storage.local.get(STORAGE_KEY_CUSTOM_SHORTCUTS);
      const custom = result[STORAGE_KEY_CUSTOM_SHORTCUTS] || {};

      Object.entries(custom).forEach(([id, shortcut]) => {
        const existing = this.shortcuts.get(id);
        if (existing && existing.customizable) {
          this.shortcuts.set(id, shortcut as KeyboardShortcut);
        }
      });
    } catch (error) {
      console.error('加载自定义快捷键失败:', error);
    }
  }

  /**
   * 设置监听器
   * 🔥 P1改进：增强日志系统，便于调试监听器注册/移除过程
   */
  private setupListeners(): void {
    // 先移除可能存在的旧监听器，防止重复注册
    if (this.boundHandleKeyPress) {
      document.removeEventListener('keydown', this.boundHandleKeyPress, true);
      console.log('[ShortcutManager] ✓ 移除旧的键盘监听器');
    }

    // 修复内存泄漏：保存绑定后的函数引用，以便正确移除监听器
    this.boundHandleKeyPress = this.handleKeyPress.bind(this);
    document.addEventListener('keydown', this.boundHandleKeyPress, true);

    console.log('[ShortcutManager] ✓ 注册新的键盘监听器');
  }

  /**
   * 设置存储变化监听器
   * 当其他上下文（如 Options 页面）修改快捷键配置时，自动重新加载
   * 🔥 P1改进：添加防抖机制，避免用户快速修改多个快捷键时频繁重载
   */
  private setupStorageListener(): void {
    this.storageListener = (changes, namespace) => {
      if (namespace === 'local' && changes[STORAGE_KEY_CUSTOM_SHORTCUTS]) {
        console.log('[ShortcutManager] 检测到快捷键配置变化');

        // 清除之前的防抖定时器
        if (this.reloadDebounceTimer) {
          clearTimeout(this.reloadDebounceTimer);
        }

        // 设置新的防抖定时器（250ms 延迟）
        this.reloadDebounceTimer = window.setTimeout(() => {
          console.log('[ShortcutManager] 开始重新加载配置...');
          this.reloadShortcuts();
          this.reloadDebounceTimer = null;
        }, 250);
      }
    };

    chrome.storage.onChanged.addListener(this.storageListener);
  }

  /**
   * 重新加载快捷键配置（用于响应存储变化）
   */
  private async reloadShortcuts(): Promise<void> {
    console.log('[ShortcutManager] 开始重新加载快捷键配置');

    // 清空当前快捷键
    this.shortcuts.clear();

    // 重新加载默认快捷键
    Object.entries(DEFAULT_SHORTCUTS).forEach(([id, shortcut]) => {
      this.shortcuts.set(id, { ...shortcut });
    });

    // 加载用户自定义快捷键
    try {
      const result = await chrome.storage.local.get(STORAGE_KEY_CUSTOM_SHORTCUTS);
      const custom = result[STORAGE_KEY_CUSTOM_SHORTCUTS] || {};

      Object.entries(custom).forEach(([id, shortcut]) => {
        const existing = this.shortcuts.get(id);
        if (existing && existing.customizable) {
          this.shortcuts.set(id, shortcut as KeyboardShortcut);
        }
      });

      console.log('[ShortcutManager] 快捷键配置重新加载完成');
    } catch (error) {
      console.error('[ShortcutManager] 重新加载快捷键配置失败:', error);
    }
  }

  /**
   * 移除监听器
   * 🔥 P1改进：清理防抖定时器，防止内存泄漏
   */
  destroy(): void {
    // 修复内存泄漏：使用保存的函数引用来正确移除监听器
    if (this.boundHandleKeyPress) {
      document.removeEventListener('keydown', this.boundHandleKeyPress, true);
      this.boundHandleKeyPress = null;
    }

    if (this.storageListener) {
      chrome.storage.onChanged.removeListener(this.storageListener);
      this.storageListener = null;
    }

    // 🔥 P1修复：清理防抖定时器
    if (this.reloadDebounceTimer) {
      clearTimeout(this.reloadDebounceTimer);
      this.reloadDebounceTimer = null;
    }

    this.initialized = false;
  }

  /**
   * 处理按键事件
   */
  private handleKeyPress(event: KeyboardEvent): void {
    // 如果在输入框中且不是特殊快捷键,不处理
    const target = event.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

    // 在输入框中只允许特殊快捷键
    if (isInput && !this.isSpecialShortcut(event)) {
      return;
    }

    const key = this.normalizeKey(event);

    // 查找匹配的快捷键
    for (const [, shortcut] of this.shortcuts.entries()) {
      if (
        shortcut.enabled &&
        shortcut.key === key &&
        this.isInScope(shortcut.scope)
      ) {
        event.preventDefault();
        event.stopPropagation();

        // 执行注册的处理器
        const handler = this.handlers.get(shortcut.action);
        if (handler) {
          // 关键修复：使用最新的快捷键配置中的 actionParam
          // 对于 SWITCH_ENGINE，优先使用 targetEngine，其次使用 actionParam
          const param = shortcut.action === 'SWITCH_ENGINE'
            ? (shortcut.targetEngine || shortcut.actionParam)
            : shortcut.actionParam;

          console.log(`[ShortcutManager] 执行快捷键 ${shortcut.description}，参数:`, param);
          handler(param);
        }

        break;
      }
    }
  }

  /**
   * 是否是特殊快捷键（在输入框中也允许）
   */
  private isSpecialShortcut(event: KeyboardEvent): boolean {
    return (
      event.key === 'Escape' ||
      event.key === 'Tab' ||
      (event.key === 'Enter' && event.ctrlKey)
    );
  }

  /**
   * 规范化按键组合为字符串
   */
  private normalizeKey(event: KeyboardEvent): string {
    const parts: string[] = [];

    // 修饰键 - 对于"?"字符，不添加 Shift
    if (event.ctrlKey || event.metaKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');

    // 特殊处理：'?' 字符
    // '?' 需要 Shift+/ 产生，但我们只存储 '?' 以保持简洁
    if (event.key === '?') {
      // 不添加 Shift 前缀，直接添加 '?'
      parts.push('?');
      return parts.join('+');  // 提前返回，避免重复处理
    }

    // 其他情况才添加 Shift
    if (event.shiftKey && event.key !== 'Shift') {
      parts.push('Shift');
    }

    // 特殊键
    if (['Escape', 'Enter', 'Tab', 'Space'].includes(event.key)) {
      parts.push(event.key);
    } else if (event.key.length === 1) {
      // 单字符按键（字母、数字、符号）
      parts.push(event.key.toUpperCase());
    }

    // 至少需要一个修饰键或特殊键
    if (parts.length < 2 && !['Escape', 'Tab', '?'].includes(event.key)) {
      return ''; // 返回空字符串，不匹配任何快捷键
    }

    return parts.join('+');
  }

  /**
   * 检查是否在快捷键作用域内
   */
  private isInScope(scope: ShortcutScope): boolean {
    if (scope === 'global') return true;
    return scope === this.currentScope;
  }

  /**
   * 注册快捷键处理器
   */
  register(action: ShortcutAction, handler: ShortcutHandler): void {
    this.handlers.set(action, handler);
  }

  /**
   * 注销快捷键处理器
   */
  unregister(action: ShortcutAction): void {
    this.handlers.delete(action);
  }

  /**
   * 获取所有快捷键
   */
  getAllShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * 获取快捷键 Map (key=shortcutId, value=KeyboardShortcut)
   * 用于 UI 层直接访问快捷键配置
   */
  getShortcutsMap(): Map<string, KeyboardShortcut> {
    return new Map(this.shortcuts);
  }

  /**
   * 获取指定作用域的快捷键
   */
  getShortcutsByScope(scope: ShortcutScope): KeyboardShortcut[] {
    return this.getAllShortcuts().filter(s => s.scope === scope);
  }

  /**
   * 更新自定义快捷键
   */
  async updateShortcut(shortcutId: string, newKey: string): Promise<void> {
    const shortcut = this.shortcuts.get(shortcutId);
    if (!shortcut) {
      throw new Error('快捷键不存在');
    }

    if (!shortcut.customizable) {
      throw new Error('该快捷键不可自定义');
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
    await this.saveCustomShortcuts();
  }

  /**
   * 启用/禁用快捷键
   */
  async toggleShortcut(shortcutId: string, enabled: boolean): Promise<void> {
    const shortcut = this.shortcuts.get(shortcutId);
    if (!shortcut) {
      throw new Error('快捷键不存在');
    }

    shortcut.enabled = enabled;
    this.shortcuts.set(shortcutId, shortcut);

    // 保存到存储
    await this.saveCustomShortcuts();
  }

  /**
   * 更新快捷键的目标引擎（用于 SWITCH_ENGINE 类型）
   */
  async updateShortcutEngine(shortcutId: string, targetEngine: string): Promise<void> {
    const shortcut = this.shortcuts.get(shortcutId);
    if (!shortcut) {
      throw new Error('快捷键不存在');
    }

    if (shortcut.action !== 'SWITCH_ENGINE') {
      throw new Error('只能为引擎切换快捷键设置目标引擎');
    }

    // 同时更新 targetEngine 和 actionParam 以保持一致性
    shortcut.targetEngine = targetEngine;
    shortcut.actionParam = targetEngine;
    this.shortcuts.set(shortcutId, shortcut);

    console.log(`[ShortcutManager] 更新快捷键 ${shortcutId} 的目标引擎: ${targetEngine}`);

    // 保存到存储（会触发 storage.onChanged 事件）
    await this.saveCustomShortcuts();
  }

  /**
   * 重置快捷键为默认值
   */
  async resetShortcut(shortcutId: string): Promise<void> {
    const defaultShortcut = DEFAULT_SHORTCUTS[shortcutId];
    if (!defaultShortcut) {
      throw new Error('快捷键不存在');
    }

    this.shortcuts.set(shortcutId, { ...defaultShortcut });

    // 保存到存储
    await this.saveCustomShortcuts();
  }

  /**
   * 重置所有快捷键为默认值
   */
  async resetAllShortcuts(): Promise<void> {
    Object.entries(DEFAULT_SHORTCUTS).forEach(([id, shortcut]) => {
      this.shortcuts.set(id, { ...shortcut });
    });

    await chrome.storage.local.remove(STORAGE_KEY_CUSTOM_SHORTCUTS);
  }

  /**
   * 查找快捷键冲突
   */
  private findConflict(key: string, excludeId: string): KeyboardShortcut | null {
    for (const [id, shortcut] of this.shortcuts.entries()) {
      if (id !== excludeId && shortcut.key === key && shortcut.enabled) {
        return shortcut;
      }
    }
    return null;
  }

  /**
   * 保存自定义快捷键到存储
   */
  private async saveCustomShortcuts(): Promise<void> {
    const custom: Record<string, KeyboardShortcut> = {};

    for (const [id, shortcut] of this.shortcuts.entries()) {
      const defaultShortcut = DEFAULT_SHORTCUTS[id];
      if (
        defaultShortcut &&
        (shortcut.key !== defaultShortcut.key ||
         shortcut.enabled !== defaultShortcut.enabled ||
         shortcut.targetEngine !== defaultShortcut.targetEngine)
      ) {
        custom[id] = shortcut;
      }
    }

    await chrome.storage.local.set({
      [STORAGE_KEY_CUSTOM_SHORTCUTS]: custom
    });
  }
}

// 导出单例
export const shortcutManager = new ShortcutManager();
