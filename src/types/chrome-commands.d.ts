/**
 * Chrome Commands API 扩展类型定义
 * 补充 @types/chrome 中缺失的 onChanged 事件类型
 *
 * @see https://developer.chrome.com/docs/extensions/reference/api/commands#event-onChanged
 * @since Chrome 116+
 */

declare namespace chrome.commands {
  /**
   * 快捷键变更信息
   */
  interface CommandChangedInfo {
    /**
     * 快捷键命令名称
     */
    name: string;

    /**
     * 新的快捷键组合（如果为空字符串或 undefined，表示已移除快捷键）
     */
    newShortcut: string;
  }

  /**
   * 快捷键变更事件
   */
  interface CommandChangedEvent extends chrome.events.Event<(changeInfo: CommandChangedInfo) => void> {}

  /**
   * 当注册的快捷键被修改时触发
   *
   * @since Chrome 116+
   *
   * @example
   * ```typescript
   * chrome.commands.onChanged.addListener((changeInfo) => {
   *   console.log(`快捷键 ${changeInfo.name} 更新为: ${changeInfo.newShortcut}`);
   * });
   * ```
   */
  export var onChanged: CommandChangedEvent;
}
