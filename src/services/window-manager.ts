/**
 * Window Manager Service
 *
 * 管理 popup 和 detached 窗口的创建、切换和状态同步
 */

export interface WindowPosition {
  left?: number
  top?: number
  width?: number
  height?: number
}

export interface DetachedWindowConfig {
  url: string
  position?: WindowPosition
  focused?: boolean
}

const STORAGE_KEY_WINDOW_POSITION = 'detached_window_position'
const STORAGE_KEY_WINDOW_ID = 'detached_window_id'
const DEFAULT_WINDOW_SIZE = { width: 420, height: 700 }

export class WindowManager {
  /**
   * 获取当前窗口模式
   */
  static getWindowMode(): 'popup' | 'detached' {
    return (window as any).__SSP_WINDOW_MODE__ === 'detached' ? 'detached' : 'popup'
  }

  /**
   * 判断是否为 detached 窗口
   */
  static isDetachedWindow(): boolean {
    return this.getWindowMode() === 'detached'
  }

  /**
   * 获取保存的窗口位置
   */
  static async getSavedWindowPosition(): Promise<WindowPosition> {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEY_WINDOW_POSITION)
      return result[STORAGE_KEY_WINDOW_POSITION] || {}
    } catch (error) {
      console.error('获取窗口位置失败:', error)
      return {}
    }
  }

  /**
   * 保存窗口位置
   */
  static async saveWindowPosition(position: WindowPosition): Promise<void> {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEY_WINDOW_POSITION]: position
      })
    } catch (error) {
      console.error('保存窗口位置失败:', error)
    }
  }

  /**
   * 获取当前保存的 detached 窗口 ID
   */
  static async getDetachedWindowId(): Promise<number | null> {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEY_WINDOW_ID)
      return result[STORAGE_KEY_WINDOW_ID] || null
    } catch (error) {
      console.error('获取窗口ID失败:', error)
      return null
    }
  }

  /**
   * 保存 detached 窗口 ID
   */
  static async saveDetachedWindowId(windowId: number): Promise<void> {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEY_WINDOW_ID]: windowId
      })
    } catch (error) {
      console.error('保存窗口ID失败:', error)
    }
  }

  /**
   * 清除保存的 detached 窗口 ID
   */
  static async clearDetachedWindowId(): Promise<void> {
    try {
      await chrome.storage.local.remove(STORAGE_KEY_WINDOW_ID)
    } catch (error) {
      console.error('清除窗口ID失败:', error)
    }
  }

  /**
   * 检查指定窗口是否存在
   */
  static async isWindowExists(windowId: number): Promise<boolean> {
    try {
      const window = await chrome.windows.get(windowId)
      return window !== null
    } catch (error) {
      // 窗口不存在会抛出异常
      return false
    }
  }

  /**
   * 创建 detached 窗口（带单例模式检查）
   */
  static async createDetachedWindow(config?: Partial<DetachedWindowConfig>): Promise<chrome.windows.Window> {
    // 检查是否已有打开的 detached 窗口
    const existingWindowId = await this.getDetachedWindowId()
    if (existingWindowId) {
      const exists = await this.isWindowExists(existingWindowId)
      if (exists) {
        // 窗口已存在，聚焦到该窗口
        const window = await chrome.windows.update(existingWindowId, { focused: true })
        console.log('Detached 窗口已存在，已聚焦:', existingWindowId)
        return window
      } else {
        // 窗口已关闭，清除记录
        await this.clearDetachedWindowId()
      }
    }

    // 获取保存的窗口位置
    const savedPosition = await this.getSavedWindowPosition()
    const position = config?.position || savedPosition

    // 计算窗口位置（如果没有保存的位置，居中显示）
    const windowConfig: chrome.windows.CreateData = {
      url: config?.url || chrome.runtime.getURL('src/detached/index.html'),
      type: 'popup', // 无地址栏的弹出窗口
      width: position.width || DEFAULT_WINDOW_SIZE.width,
      height: position.height || DEFAULT_WINDOW_SIZE.height,
      focused: config?.focused !== false,
    }

    // 如果有保存的位置，使用保存的位置
    if (position.left !== undefined && position.top !== undefined) {
      windowConfig.left = position.left
      windowConfig.top = position.top
    }

    // 创建窗口
    const newWindow = await chrome.windows.create(windowConfig)

    if (newWindow.id) {
      // 保存窗口 ID
      await this.saveDetachedWindowId(newWindow.id)

      // 监听窗口关闭事件，清除记录
      chrome.windows.onRemoved.addListener(async (windowId) => {
        if (windowId === newWindow.id) {
          await this.clearDetachedWindowId()
        }
      })

      console.log('成功创建 detached 窗口:', newWindow.id)
    }

    return newWindow
  }

  /**
   * 从 popup 弹出到独立窗口
   */
  static async popoutToDetachedWindow(): Promise<void> {
    try {
      // 创建 detached 窗口
      await this.createDetachedWindow()

      // 关闭当前 popup
      window.close()
    } catch (error) {
      console.error('弹出到独立窗口失败:', error)
      throw error
    }
  }

  /**
   * 保存当前窗口位置（在 detached 窗口中调用）
   */
  static async saveCurrentWindowPosition(): Promise<void> {
    if (!this.isDetachedWindow()) {
      return
    }

    try {
      const currentWindow = await chrome.windows.getCurrent()
      if (currentWindow) {
        const position: WindowPosition = {
          left: currentWindow.left,
          top: currentWindow.top,
          width: currentWindow.width,
          height: currentWindow.height,
        }
        await this.saveWindowPosition(position)
      }
    } catch (error) {
      console.error('保存当前窗口位置失败:', error)
    }
  }

  /**
   * 监听窗口大小变化并自动保存位置（在 detached 窗口中调用）
   */
  static setupWindowPositionTracking(): void {
    if (!this.isDetachedWindow()) {
      return
    }

    // 使用 debounce 避免频繁保存
    let saveTimer: NodeJS.Timeout
    const debouncedSave = () => {
      clearTimeout(saveTimer)
      saveTimer = setTimeout(() => {
        this.saveCurrentWindowPosition()
      }, 500)
    }

    // 监听窗口大小和位置变化
    chrome.windows.onBoundsChanged?.addListener(() => {
      debouncedSave()
    })

    // 组件卸载或窗口关闭时保存
    window.addEventListener('beforeunload', () => {
      this.saveCurrentWindowPosition()
    })
  }
}

export const windowManager = new WindowManager()
