import { TriggerIcon } from './components/TriggerIcon';
import { ModalOverlay } from './components/ModalOverlay';
import { MessageBridge } from './components/MessageBridge';
import { getCurrentEngineConfig, detectSearchEngine } from '@/config/search-engine-selectors';
import type { SearchEngineConfig } from '@/config/search-engine-selectors';
import { translate } from '@/i18n/translations';

/**
 * FloatingPanelManager
 * Main orchestrator for the floating panel feature
 */
export class FloatingPanelManager {
  private config: SearchEngineConfig | null = null;
  private engineKey: 'baidu' | 'bing' | null = null;
  private triggerIcon: TriggerIcon | null = null;
  private modalOverlay: ModalOverlay | null = null;
  private messageBridge: MessageBridge | null = null;

  private searchInput: HTMLInputElement | null = null;

  private isPanelOpen = false;
  private isOpening = false;
  private retryCount = 0;
  private readonly MAX_RETRIES = 3;

  private mutationObserver: MutationObserver | null = null;
  private language: 'zh-CN' | 'en-US' = 'zh-CN';

  /**
   * Initialize floating panel system
   */
  async initialize(): Promise<void> {
    // Get user language preference
    try {
      const result = await chrome.storage.local.get('user_settings');
      this.language = result.user_settings?.language || 'zh-CN';
    } catch {
      this.language = 'zh-CN';
    }

    this.config = getCurrentEngineConfig();
    this.engineKey = detectSearchEngine(window.location.hostname) as 'baidu' | 'bing' | null;

    if (!this.config || !this.engineKey) {
      console.log('[SSP] No config for current search engine');
      return;
    }

    console.log('[SSP] Initializing floating panel');
    await this.injectTriggerIcon();
    this.setupDOMObserver();
    this.setupKeyboardShortcuts();
  }

  /**
   * Inject trigger icon as draggable floating button
   */
  private async injectTriggerIcon(): Promise<void> {
    if (!this.config) return;

    // Find search input (still needed for filling search query)
    this.searchInput = document.querySelector(
      this.config.searchInputSelector
    ) as HTMLInputElement;

    if (!this.searchInput) {
      if (this.retryCount < this.MAX_RETRIES) {
        this.retryCount++;
        console.log(`[SSP] Search input not found, retrying (${this.retryCount}/${this.MAX_RETRIES})`);
        setTimeout(() => this.injectTriggerIcon(), 500);
      } else {
        console.error('[SSP] Failed to find search input after retries');
      }
      return;
    }

    // Check if already injected
    if (document.querySelector('#ssp-trigger-icon')) {
      console.log('[SSP] Trigger icon already exists');
      return;
    }

    // Inject styles BEFORE creating element to prevent flash
    this.injectStyles();

    // Get translated tooltip text
    const tooltipText = translate(this.language, 'content.triggerButtonTooltip');

    // Create trigger icon (now async)
    this.triggerIcon = new TriggerIcon(() => this.openPanel(), tooltipText);
    const iconElement = await this.triggerIcon.create();

    // Insert icon into body (not relative to search input)
    document.body.appendChild(iconElement);

    // Setup any global event listeners if needed
    this.setupEventListeners();

    // Trigger icon is now always visible, no need for auto-show timer

    console.log('[SSP] Draggable trigger icon injected successfully');
  }

  /**
   * Inject CSS styles into page
   */
  private injectStyles(): void {
    if (document.querySelector('#ssp-trigger-styles')) return;

    const style = document.createElement('style');
    style.id = 'ssp-trigger-styles';
    style.textContent = `
      /* 可拖动悬浮按钮容器 */
      .ssp-trigger-icon-container {
        position: fixed;
        top: 0;
        left: 0;
        transform: translate(0, 0);
        z-index: 2147483646;
        opacity: 1;
        pointer-events: auto;
        display: block;
        cursor: grab;
        user-select: none;
        will-change: transform;
        transition: opacity 200ms ease;
      }

      .ssp-trigger-icon-container:active {
        cursor: grabbing;
      }

      /* 触发按钮样式 - 简洁圆形设计 */
      .ssp-trigger-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 50%;
        padding: 0;
        cursor: inherit;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        transition: all 200ms ease;
        box-sizing: border-box;
      }

      .ssp-trigger-button:hover {
        background: #f9fafb;
        border-color: #d1d5db;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        transform: translateY(-1px);
      }

      .ssp-trigger-button:active {
        transform: translateY(0);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      }

      /* 扩展图标 */
      .ssp-trigger-icon {
        width: 28px;
        height: 28px;
        flex-shrink: 0;
        pointer-events: none;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Setup event listeners (simplified - no longer need focus/hover logic)
   */
  private setupEventListeners(): void {
    // Trigger icon is now always visible and draggable
    // No need for focus/hover event listeners
    // Reserved for future use
  }

  /**
   * Setup DOM mutation observer to handle dynamic changes
   */
  private setupDOMObserver(): void {
    let debounceTimer: number | null = null;

    this.mutationObserver = new MutationObserver(() => {
      // Debounce to prevent excessive re-injection
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = window.setTimeout(() => {
        // Check if trigger icon still exists
        const iconExists = document.querySelector('#ssp-trigger-icon');
        if (!iconExists && !this.isPanelOpen) {
          console.log('[SSP] DOM changed, re-injecting icon');
          this.retryCount = 0;
          setTimeout(() => this.injectTriggerIcon(), 500);
        }
      }, 500);
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Setup keyboard shortcuts
   */
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      // ESC to close panel
      if (e.key === 'Escape' && this.isPanelOpen) {
        this.closePanel();
      }
    });
  }

  /**
   * Open floating panel
   */
  private async openPanel(): Promise<void> {
    if (this.isOpening || this.isPanelOpen) {
      console.log('[SSP] Panel already open or opening');
      return;
    }

    this.isOpening = true;
    this.isPanelOpen = true;

    try {
      // Create modal overlay
      this.modalOverlay = new ModalOverlay(() => this.closePanel());
      const { container, iframe } = this.modalOverlay.create();

      // Append to body
      document.body.appendChild(container);

      // Initialize message bridge
      this.messageBridge = new MessageBridge();
      this.messageBridge.initialize(iframe);

      // Register message handlers
      this.setupMessageHandlers();

      // Wait for iframe to be ready
      const isReady = await this.messageBridge.waitForReady();
      if (!isReady) {
        console.error('[SSP] Iframe failed to load');
        this.closePanel();
        return;
      }

      // Show modal with animation
      this.modalOverlay.show();

      // Send initial data to iframe (including engine to fix detection issue)
      const initialKeyword = this.searchInput?.value || '';
      this.messageBridge.sendToIframe({
        type: 'FLOATING_PANEL_FILL_INPUT',
        payload: {
          keyword: initialKeyword,
          engine: this.engineKey! // 传递当前检测到的引擎
        }
      });

      console.log('[SSP] Panel opened successfully');
    } catch (error) {
      console.error('[SSP] Failed to open panel:', error);
      this.closePanel();
    } finally {
      this.isOpening = false;
    }
  }

  /**
   * Setup message handlers
   */
  private setupMessageHandlers(): void {
    if (!this.messageBridge) return;

    // Handle apply syntax
    this.messageBridge.on('FLOATING_PANEL_APPLY_SYNTAX', (payload) => {
      this.fillSearchInput(payload.query, payload.autoSearch);
      this.closePanel();
    });

    // Handle close request
    this.messageBridge.on('FLOATING_PANEL_CLOSE', () => {
      this.closePanel();
    });
  }

  /**
   * Fill search input with generated query
   */
  private fillSearchInput(query: string, autoSearch: boolean): void {
    if (!this.searchInput) return;

    // Set value
    this.searchInput.value = query;

    // Trigger events for search engine to detect change
    this.searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    this.searchInput.dispatchEvent(new Event('change', { bubbles: true }));

    // Focus input
    this.searchInput.focus();

    // Auto-submit if requested
    if (autoSearch && this.config?.searchFormSelector) {
      const form = document.querySelector(
        this.config.searchFormSelector
      ) as HTMLFormElement;

      if (form) {
        setTimeout(() => form.submit(), 100);
      }
    }

    console.log('[SSP] Search input filled:', query);
  }

  /**
   * Close floating panel
   */
  private async closePanel(): Promise<void> {
    if (!this.isPanelOpen) return;

    this.isPanelOpen = false;

    // Hide with animation
    await this.modalOverlay?.hide();

    // Cleanup
    this.modalOverlay?.destroy();
    this.messageBridge?.destroy();

    this.modalOverlay = null;
    this.messageBridge = null;

    console.log('[SSP] Panel closed');
  }

  /**
   * Destroy floating panel system
   */
  destroy(): void {
    this.triggerIcon?.destroy();
    this.modalOverlay?.destroy();
    this.messageBridge?.destroy();
    this.mutationObserver?.disconnect();

    this.triggerIcon = null;
    this.modalOverlay = null;
    this.messageBridge = null;
    this.mutationObserver = null;
  }
}
