import { TriggerIcon } from './components/TriggerIcon';
import { ModalOverlay } from './components/ModalOverlay';
import { MessageBridge } from './components/MessageBridge';
import { getCurrentEngineConfig, detectSearchEngine } from '@/config/search-engine-selectors';
import type { SearchEngineConfig } from '@/config/search-engine-selectors';
import { translate } from '@/i18n/translations';

/**
 * Search engine URL parameter mapping
 * Inlined to avoid module import issues in Chrome extension context
 */
const SEARCH_PARAM_MAP: Record<string, string> = {
  baidu: 'wd',
  bing: 'q',
  yandex: 'text',
  duckduckgo: 'q'
} as const;

/**
 * FloatingPanelManager
 * Main orchestrator for the floating panel feature
 */
export class FloatingPanelManager {
  private config: SearchEngineConfig | null = null;
  private engineKey: 'baidu' | 'bing' | 'yandex' | 'duckduckgo' | null = null;
  private triggerIcon: TriggerIcon | null = null;
  private modalOverlay: ModalOverlay | null = null;
  private messageBridge: MessageBridge | null = null;

  private searchInput: HTMLInputElement | HTMLTextAreaElement | null = null;

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
    this.engineKey = detectSearchEngine(window.location.hostname) as 'baidu' | 'bing' | 'yandex' | 'duckduckgo' | null;

    // Check for previous submit debug data (persists across page refresh)
    // IMPORTANT: Must be after engineKey initialization to use correct param name
    try {
      const savedDebugData = localStorage.getItem('ssp_last_submit_debug');
      if (savedDebugData) {
        // Clear the debug data after page refresh
        localStorage.removeItem('ssp_last_submit_debug');
      }
    } catch (e) {
      // Silent cleanup
    }

    if (!this.config || !this.engineKey) {
      return;
    }

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
    ) as HTMLInputElement | HTMLTextAreaElement;

    if (!this.searchInput) {
      if (this.retryCount < this.MAX_RETRIES) {
        this.retryCount++;
        setTimeout(() => this.injectTriggerIcon(), 500);
      }
      return;
    }

    // Check if already injected
    if (document.querySelector('#ssp-trigger-icon')) {
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
    this.messageBridge.on('FLOATING_PANEL_APPLY_SYNTAX', async (payload) => {
      // ✅ CRITICAL FIX: Close panel BEFORE filling input
      // This ensures iframe releases focus, allowing searchInput.focus() to succeed
      // Without this, Baidu detects "value without focus" as abnormal state and clears it
      await this.closePanel();

      // Wait for panel close animation to complete and iframe to be fully removed
      // Increased delay to 300ms to ensure DOM is fully stabilized
      await new Promise(resolve => setTimeout(resolve, 300));

      // Now fill the input - at this point focus can be properly acquired
      this.fillSearchInput(payload.query, payload.autoSearch);
    });

    // Handle close request
    this.messageBridge.on('FLOATING_PANEL_CLOSE', () => {
      this.closePanel();
    });
  }

  /**
   * FIX: Dynamic prototype detection to prevent "Illegal invocation" TypeError
   *
   * ROOT CAUSE: Baidu switched from <input id="kw"> to <textarea id="chat-textarea">
   * Calling HTMLInputElement.prototype.value.set() on HTMLTextAreaElement violates
   * JavaScript's native method contract, causing: "TypeError: Illegal invocation"
   *
   * SOLUTION: Detect actual element type at runtime using instanceof, then retrieve
   * the correct prototype (HTMLTextAreaElement vs HTMLInputElement) before calling
   * the native value setter.
   *
   * APPLIES TO: Character-by-character typing and pre-submit value verification
   *
   * @since 2025-12-02 - Fix for type-aware value setter
   */
  /**
   * Get the appropriate native value setter for the search input element
   * Handles both HTMLInputElement and HTMLTextAreaElement by detecting runtime type
   *
   * @param element - The search input element (input or textarea)
   * @returns Native value setter function or undefined if unavailable
   */
  private getElementValueSetter(
    element: HTMLInputElement | HTMLTextAreaElement
  ): ((value: string) => void) | undefined {
    const elementPrototype = element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;

    return Object.getOwnPropertyDescriptor(
      elementPrototype,
      'value'
    )?.set;
  }

  /**
   * Fill search input with generated query
   */
  private fillSearchInput(query: string, autoSearch: boolean): void {
    // ✅ FIX: Re-query search input to avoid stale DOM reference
    // This ensures we always have the current input element, even if Baidu recreated it
    if (this.config) {
      this.searchInput = document.querySelector(
        this.config.searchInputSelector
      ) as HTMLInputElement | HTMLTextAreaElement;
    }

    if (!this.searchInput) {
      return;
    }

    // Get native value setter using extracted method (DRY principle)
    const nativeInputValueSetter = this.getElementValueSetter(this.searchInput);

    // Step 1: Click input to activate it (simulate real user click)
    this.searchInput.scrollIntoView({ behavior: 'instant', block: 'center' });

    // Dispatch mousedown, mouseup, and click to simulate real user click sequence
    const mouseDownEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      view: window,
      detail: 1
    });
    const mouseUpEvent = new MouseEvent('mouseup', {
      bubbles: true,
      cancelable: true,
      view: window,
      detail: 1
    });
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
      detail: 1
    });

    this.searchInput.dispatchEvent(mouseDownEvent);
    this.searchInput.dispatchEvent(mouseUpEvent);
    this.searchInput.dispatchEvent(clickEvent);

    // Step 2: Clear any existing value first
    this.searchInput.value = '';
    this.searchInput.dispatchEvent(new Event('input', { bubbles: true }));

    // Step 3: Type each character with proper events (simulates real user typing)
    const chars = query.split('');
    let currentValue = '';

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      currentValue += char;

      // Set value using native setter
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(this.searchInput, currentValue);
      } else {
        this.searchInput.value = currentValue;
      }

      // Dispatch input event for this character (triggers Baidu's listeners)
      const inputEvent = new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        data: char,
        inputType: 'insertText'
      });
      this.searchInput.dispatchEvent(inputEvent);
    }

    // Step 4: Final change event (signals completion)
    this.searchInput.dispatchEvent(new Event('change', { bubbles: true }));

    // Step 5: Try to get focus again after typing
    this.searchInput.focus();

    // Auto-submit if requested
    if (autoSearch && this.config?.searchFormSelector) {
      // Try multiple strategies to find the form
      let form: HTMLFormElement | null = null;

      // Strategy 1: Use configured selector
      form = document.querySelector(
        this.config.searchFormSelector
      ) as HTMLFormElement;

      // Strategy 2: If not found, find form through search input's parent
      if (!form && this.searchInput) {
        form = this.searchInput.closest('form');
      }

      // Strategy 3: If still not found, find first form containing search input
      if (!form && this.searchInput) {
        const allForms = document.querySelectorAll('form');
        for (const f of allForms) {
          if (f.contains(this.searchInput)) {
            form = f as HTMLFormElement;
            break;
          }
        }
      }

      if (form) {
        // Increased delay to 300ms to allow Yandex to process input events
        const submitDelay = 300;

        setTimeout(() => {
          // CRITICAL FIX: Re-verify and force-set value RIGHT BEFORE submit
          // This prevents Yandex from modifying the value between our initial set and the submit
          if (this.searchInput && this.searchInput.value !== query) {
            if (!this.searchInput) {
              return;
            }

            // Force set again using native setter with extracted method (DRY principle)
            const nativeInputValueSetter = this.getElementValueSetter(this.searchInput);

            if (nativeInputValueSetter) {
              nativeInputValueSetter.call(this.searchInput, query);
            } else {
              this.searchInput.value = query;
            }
          }

          // Save debug data to localStorage for verification across page refresh
          try {
            const preSubmitData = {
              inputValue: this.searchInput?.value,
              expectedQuery: query,
              valuesStillMatch: this.searchInput?.value === query,
              timestamp: new Date().toISOString(),
              engineKey: this.engineKey,
              formAction: form.action
            };
            localStorage.setItem('ssp_last_submit_debug', JSON.stringify(preSubmitData));
          } catch (e) {
            // Silent failure
          }

          try {
            // NEW STRATEGY: Direct URL navigation (bypasses form manipulation)
            // This is the most reliable method, especially for Yandex
            const searchUrl = new URL(form.action || window.location.href);

            // Use correct parameter name for each search engine
            const paramName = this.engineKey ? SEARCH_PARAM_MAP[this.engineKey] : 'q';
            searchUrl.searchParams.set(paramName, query);

            // Navigate directly - this cannot be intercepted
            window.location.href = searchUrl.toString();
          } catch (error) {
            // Fallback: Try form submission methods
            try {
              // Strategy 1: Try to find and click submit button
              const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;

              if (submitButton) {
                submitButton.click();
              } else {
                // Strategy 2: Fallback to form.submit()
                form.submit();
              }
            } catch (submitError) {
              // Strategy 3: Last resort - simulate Enter key
              try {
                this.searchInput?.dispatchEvent(new KeyboardEvent('keydown', {
                  key: 'Enter',
                  code: 'Enter',
                  keyCode: 13,
                  bubbles: true,
                  cancelable: true
                }));
              } catch (enterError) {
                // Final failure - silent
              }
            }
          }
        }, submitDelay);
      }
    }
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
