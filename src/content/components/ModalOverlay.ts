/**
 * ModalOverlay Component
 * Creates and manages the modal overlay and panel container with Shadow DOM
 */
export class ModalOverlay {
  private overlayElement: HTMLElement | null = null;
  private iframe: HTMLIFrameElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private container: HTMLElement | null = null; // 保存真实 DOM 中的容器引用

  constructor(
    private onCloseCallback: () => void
  ) {}

  /**
   * Create modal structure inside Shadow DOM
   */
  create(): { container: HTMLElement; iframe: HTMLIFrameElement } {
    // Create container with Shadow DOM
    const container = document.createElement('div');
    container.id = 'ssp-modal-root';
    this.shadowRoot = container.attachShadow({ mode: 'open' });
    this.container = container; // 保存 container 引用，供 destroy 使用

    // Inject styles
    const styleSheet = this.createStyleSheet();
    this.shadowRoot.appendChild(styleSheet);

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'ssp-modal-overlay';

    // Click overlay to close
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.onCloseCallback();
      }
    });

    // Create panel container
    const panel = document.createElement('div');
    panel.className = 'ssp-modal-panel';

    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.className = 'ssp-modal-iframe';
    iframe.src = chrome.runtime.getURL('src/floating-panel/index.html');
    iframe.allow = 'clipboard-write';

    panel.appendChild(iframe);
    overlay.appendChild(panel);
    this.shadowRoot.appendChild(overlay);

    this.overlayElement = overlay;
    this.iframe = iframe;

    return { container, iframe };
  }

  /**
   * Create stylesheet for Shadow DOM
   */
  private createStyleSheet(): HTMLStyleElement {
    const style = document.createElement('style');
    style.textContent = `
      .ssp-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.5);
        z-index: 2147483647; /* Max z-index */
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 200ms ease-in-out;
      }

      .ssp-modal-overlay.ssp-modal-visible {
        opacity: 1;
      }

      .ssp-modal-panel {
        width: 800px;
        height: 600px;
        max-width: 90vw;
        max-height: 80vh;
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        overflow: hidden;
        transform: scale(0.9);
        opacity: 0;
        transition: transform 300ms ease-out, opacity 300ms ease-out;
      }

      .ssp-modal-overlay.ssp-modal-visible .ssp-modal-panel {
        transform: scale(1);
        opacity: 1;
      }

      .ssp-modal-iframe {
        width: 100%;
        height: 100%;
        border: none;
        display: block;
      }

      /* Responsive adjustments */
      @media (max-width: 900px) {
        .ssp-modal-panel {
          width: 90vw;
          height: 80vh;
          max-width: 700px;
          max-height: 600px;
        }
      }

      @media (max-width: 600px) {
        .ssp-modal-panel {
          width: 95vw;
          height: 90vh;
          border-radius: 8px;
        }
      }
    `;
    return style;
  }

  /**
   * Show modal with animation
   */
  show(): void {
    if (!this.overlayElement) return;

    // Trigger reflow
    void this.overlayElement.offsetHeight;

    this.overlayElement.classList.add('ssp-modal-visible');

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  /**
   * Hide modal with animation
   */
  hide(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.overlayElement) {
        resolve();
        return;
      }

      this.overlayElement.classList.remove('ssp-modal-visible');

      // Wait for animation
      setTimeout(() => {
        document.body.style.overflow = '';
        resolve();
      }, 300);
    });
  }

  /**
   * Get iframe element
   */
  getIframe(): HTMLIFrameElement | null {
    return this.iframe;
  }

  /**
   * Destroy modal
   */
  destroy(): void {
    // 删除真实 DOM 中的 container 元素（#ssp-modal-root）
    // 而不是尝试删除 Shadow DOM 内部的节点
    if (this.container && this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }

    // 清理所有引用
    this.overlayElement = null;
    this.iframe = null;
    this.shadowRoot = null;
    this.container = null;

    // 恢复 body 滚动
    document.body.style.overflow = '';
  }
}
