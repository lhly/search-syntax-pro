import type { TriggerButtonPosition } from '@/types';

/**
 * TriggerIcon Component
 * 可拖动悬浮按钮，用于打开高级搜索面板
 *
 * 性能优化:
 * - 使用 transform 代替 top/left (GPU 加速)
 * - 使用 will-change 提示浏览器优化
 * - 拖动时使用 requestAnimationFrame 节流
 * - 位置以百分比存储，响应式适配
 */
export class TriggerIcon {
  private element: HTMLElement | null = null;
  private isVisible = true; // 改为始终可见
  private isHovered = false;

  // 拖动相关状态
  private isDragging = false;
  private hasMoved = false;
  private startX = 0;
  private startY = 0;
  private currentX = 0;
  private currentY = 0;
  private dragThreshold = 5; // 5px 移动才算拖动（防止误触点击）

  // 性能优化：RAF 控制
  private rafId: number | null = null;

  constructor(
    private onClickCallback: () => void,
    private tooltipText: string = 'Drag to move | Click to open advanced search panel'
  ) {}

  /**
   * 创建并返回触发按钮元素
   * 简洁的圆形图标按钮
   */
  async create(): Promise<HTMLElement> {
    const container = document.createElement('div');
    container.id = 'ssp-trigger-icon';
    container.className = 'ssp-trigger-icon-container';

    // 获取扩展图标 URL
    const iconUrl = chrome.runtime.getURL('icons/icon32.png');

    container.innerHTML = `
      <button class="ssp-trigger-button" title="${this.tooltipText}">
        <img src="${iconUrl}" alt="SSP" class="ssp-trigger-icon" />
      </button>
    `;

    // 绑定点击处理器
    const button = container.querySelector('button');
    if (button) {
      button.addEventListener('mousedown', this.handleMouseDown);
      button.addEventListener('click', this.handleClick);
    }

    // 跟踪悬停状态
    container.addEventListener('mouseenter', () => {
      this.isHovered = true;
    });

    container.addEventListener('mouseleave', () => {
      this.isHovered = false;
    });

    this.element = container;

    // 恢复保存的位置或使用默认位置
    await this.restorePosition();

    // 设置拖动监听
    this.setupDragListeners();

    // 设置窗口 resize 处理
    window.addEventListener('resize', this.handleResize);

    return container;
  }

  /**
   * 恢复保存的位置
   */
  private async restorePosition(): Promise<void> {
    try {
      const result = await chrome.storage.local.get('trigger_button_position');
      const saved = result.trigger_button_position as TriggerButtonPosition | undefined;

      if (saved && saved.x !== undefined && saved.y !== undefined) {
        // 从百分比转换为像素
        this.currentX = (saved.x / 100) * window.innerWidth;
        this.currentY = (saved.y / 100) * window.innerHeight;

        // 确保在边界内
        this.constrainToBounds();
        this.updatePosition();
      } else {
        // 使用默认位置
        this.setDefaultPosition();
      }
    } catch (error) {
      console.error('[SSP] Failed to restore position:', error);
      this.setDefaultPosition();
    }
  }

  /**
   * 设置默认位置（右下角）
   */
  private setDefaultPosition(): void {
    const buttonSize = 48; // 圆形按钮尺寸
    const margin = 20;

    this.currentX = window.innerWidth - buttonSize - margin;
    this.currentY = window.innerHeight - buttonSize - margin;

    this.constrainToBounds();
    this.updatePosition();
  }

  /**
   * 设置拖动监听器
   */
  private setupDragListeners(): void {
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
  }

  /**
   * 处理鼠标按下事件
   */
  private handleMouseDown = (e: MouseEvent): void => {
    // 只响应左键
    if (e.button !== 0) return;

    this.isDragging = true;
    this.hasMoved = false;
    this.startX = e.clientX - this.currentX;
    this.startY = e.clientY - this.currentY;

    if (this.element) {
      this.element.style.cursor = 'grabbing';
      this.element.style.transition = 'none'; // 拖动时禁用动画
    }

    e.preventDefault();
    e.stopPropagation();
  };

  /**
   * 处理鼠标移动事件（使用 RAF 优化）
   */
  private handleMouseMove = (e: MouseEvent): void => {
    if (!this.isDragging) return;

    // 使用 RAF 节流
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }

    this.rafId = requestAnimationFrame(() => {
      const newX = e.clientX - this.startX;
      const newY = e.clientY - this.startY;

      // 计算移动距离
      const deltaX = Math.abs(newX - this.currentX);
      const deltaY = Math.abs(newY - this.currentY);

      // 超过阈值才算拖动
      if (deltaX > this.dragThreshold || deltaY > this.dragThreshold) {
        this.hasMoved = true;
      }

      this.currentX = newX;
      this.currentY = newY;

      // 边界约束
      this.constrainToBounds();
      this.updatePosition();
    });
  };

  /**
   * 处理鼠标释放事件
   */
  private handleMouseUp = async (): Promise<void> => {
    if (!this.isDragging) return;

    this.isDragging = false;

    if (this.element) {
      this.element.style.cursor = 'grab';
      this.element.style.transition = ''; // 恢复动画
    }

    // 如果发生了拖动，保存位置
    if (this.hasMoved) {
      await this.savePosition();
    }

    this.hasMoved = false;
  };

  /**
   * 处理点击事件（只在非拖动时触发）
   */
  private handleClick = (e: MouseEvent): void => {
    if (this.hasMoved) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // 真正的点击
    e.preventDefault();
    e.stopPropagation();
    this.onClickCallback();
  };

  /**
   * 边界约束
   */
  private constrainToBounds(): void {
    if (!this.element) return;

    const buttonSize = this.element.offsetWidth || 48; // 圆形按钮尺寸

    const maxX = window.innerWidth - buttonSize;
    const maxY = window.innerHeight - buttonSize;

    this.currentX = Math.max(0, Math.min(maxX, this.currentX));
    this.currentY = Math.max(0, Math.min(maxY, this.currentY));
  }

  /**
   * 更新位置（使用 transform 优化性能）
   */
  private updatePosition(): void {
    if (!this.element) return;
    this.element.style.transform = `translate(${this.currentX}px, ${this.currentY}px)`;
  }

  /**
   * 保存位置到 storage（百分比存储）
   */
  private async savePosition(): Promise<void> {
    const position: TriggerButtonPosition = {
      x: (this.currentX / window.innerWidth) * 100,
      y: (this.currentY / window.innerHeight) * 100,
      timestamp: Date.now()
    };

    try {
      await chrome.storage.local.set({ trigger_button_position: position });
      console.log('[SSP] Position saved:', position);
    } catch (error) {
      console.error('[SSP] Failed to save position:', error);
    }
  }

  /**
   * 处理窗口 resize 事件
   */
  private handleResize = async (): Promise<void> => {
    // 从 storage 重新读取百分比位置并应用
    await this.restorePosition();
  };

  /**
   * 显示按钮（现在默认始终显示）
   */
  show(): void {
    if (!this.element || this.isVisible) return;
    this.element.classList.add('ssp-trigger-visible');
    this.isVisible = true;
  }

  /**
   * 隐藏按钮
   */
  hide(): void {
    if (!this.element || !this.isVisible) return;
    this.element.classList.remove('ssp-trigger-visible');
    this.isVisible = false;
  }

  /**
   * 检查是否悬停
   */
  getIsHovered(): boolean {
    return this.isHovered;
  }

  /**
   * 检查是否可见
   */
  getIsVisible(): boolean {
    return this.isVisible;
  }

  /**
   * 销毁按钮
   */
  destroy(): void {
    // 清理拖动监听
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('resize', this.handleResize);

    // 取消未完成的 RAF
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    // 移除元素
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}
