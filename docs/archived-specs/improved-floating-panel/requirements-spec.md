# Technical Specification - Improved Floating Panel

**Feature ID**: `improved-floating-panel`
**Version**: v1.7.3
**Status**: Implementation-Ready
**Created**: 2025-11-20
**Document Type**: Code-Generation-Optimized Specification

---

## Problem Statement

### Business Issue
Users need to access advanced search syntax builder while actively using search engines (Baidu/Google/Bing), but the current popup requires switching context away from the search page.

### Current State
- Floating button feature exists but disabled (`FEATURE_FLAGS.enableFloatingButton = false`)
- Basic floating button shows in bottom-right corner
- Clicking button sends message to open popup (breaks user flow)
- No inline integration with search input workflows

### Expected Outcome
- Trigger icon appears below search box on focus/hover
- Clicking icon opens centered 800x600px modal panel
- Panel loads existing popup UI via iframe in Shadow DOM
- User builds syntax in panel → fills search box → auto-closes
- Seamless integration without breaking search engine page

---

## Solution Overview

### Approach
Replace simple floating button with search-box-integrated trigger icon that opens an isolated modal panel. Use Shadow DOM for style isolation, iframe for component reuse, and message passing for communication. Employ configuration-based adapters for multi-search-engine support.

### Core Changes
1. Modify `src/content/index.ts` to inject trigger icon below search box
2. Create modal overlay + panel container architecture
3. Load `src/popup/index.html` via iframe inside Shadow DOM
4. Implement bidirectional message protocol (content ↔ iframe)
5. Add search engine selector configurations
6. Enable `FEATURE_FLAGS.enableFloatingButton` by default

### Success Criteria
- Icon shows on search box focus/hover on Baidu/Google/Bing
- Modal panel opens centered with smooth animations
- Popup UI renders correctly inside iframe
- Search syntax fills into native search box
- Panel closes on overlay click or ESC key
- Works independently across browser tabs

---

## Technical Implementation

### Database Changes
**Chrome Storage Schema Extension**:

```typescript
// Add to ChromeStorageData interface in src/types/index.ts
interface ChromeStorageData {
  // ... existing fields

  // Floating panel state (per-tab, not persisted)
  floating_panel_state?: {
    isOpen: boolean;
    lastOpenedAt: number;
  };

  // User preference for panel behavior
  user_settings?: UserSettings & {
    floatingPanel?: {
      autoSearch: boolean;      // Auto-submit after applying syntax
      showOnFocus: boolean;      // Show icon on search box focus
      showOnHover: boolean;      // Show icon on search area hover
    };
  };
}
```

**Migration**: No migration needed, optional fields with defaults.

---

### Code Changes

#### File Structure

**New Files to Create**:

```
src/content/
├── floating-panel/
│   ├── FloatingPanelManager.ts      # Core panel management logic
│   ├── TriggerIcon.ts               # Trigger icon component
│   ├── ModalOverlay.ts              # Modal overlay & panel container
│   ├── MessageBridge.ts             # Content ↔ iframe communication
│   └── styles.css                   # Scoped styles for Shadow DOM
├── adapters/
│   └── search-engine-configs.ts     # Selector configurations
```

**Existing Files to Modify**:

```
src/content/index.ts                  # Enable feature, integrate FloatingPanelManager
src/types/index.ts                    # Add message protocol types
public/manifest.json                  # Add popup HTML to web_accessible_resources
src/popup/App.tsx                     # Handle iframe context detection
```

---

#### 1. Search Engine Adapter Configuration

**File**: `src/content/adapters/search-engine-configs.ts`

```typescript
/**
 * Search Engine Selector Configuration
 * Defines DOM selectors and injection positions for each search engine
 */

export interface SearchEngineConfig {
  /** Search input element selector */
  searchInputSelector: string;

  /** Search container element selector (for hover detection) */
  searchContainerSelector: string;

  /** Form element selector (for auto-submit) */
  searchFormSelector?: string;

  /** Icon insertion position relative to search input */
  iconInsertPosition: 'afterend' | 'beforeend' | 'afterbegin';

  /** Icon offset from search input (CSS) */
  iconOffsetY: string;

  /** Detect if on search results page */
  isResultsPage: () => boolean;
}

export const SEARCH_ENGINE_CONFIGS: Record<string, SearchEngineConfig> = {
  baidu: {
    searchInputSelector: 'input#kw',
    searchContainerSelector: '#form',
    searchFormSelector: 'form#form',
    iconInsertPosition: 'afterend',
    iconOffsetY: '8px',
    isResultsPage: () => window.location.pathname.includes('/s')
  },

  google: {
    searchInputSelector: 'input[name="q"]',
    searchContainerSelector: 'div.RNNXgb',
    searchFormSelector: 'form[role="search"]',
    iconInsertPosition: 'afterend',
    iconOffsetY: '8px',
    isResultsPage: () => window.location.pathname.includes('/search')
  },

  bing: {
    searchInputSelector: 'input#sb_form_q',
    searchContainerSelector: 'form#sb_form',
    searchFormSelector: 'form#sb_form',
    iconInsertPosition: 'afterend',
    iconOffsetY: '8px',
    isResultsPage: () => window.location.pathname.includes('/search')
  }
};

/**
 * Detect current search engine from hostname
 */
export function detectSearchEngine(hostname: string): string | null {
  if (hostname.includes('baidu.com')) return 'baidu';
  if (hostname.includes('google.com')) return 'google';
  if (hostname.includes('bing.com')) return 'bing';
  return null;
}

/**
 * Get configuration for current page
 */
export function getCurrentEngineConfig(): SearchEngineConfig | null {
  const engineKey = detectSearchEngine(window.location.hostname);
  return engineKey ? SEARCH_ENGINE_CONFIGS[engineKey] : null;
}
```

---

#### 2. Message Protocol Definition

**File**: `src/types/index.ts` (add to existing file)

```typescript
/**
 * Message Protocol for Floating Panel Communication
 */

export type FloatingPanelMessage =
  | OpenPanelMessage
  | ClosePanelMessage
  | ApplySyntaxMessage
  | PanelReadyMessage
  | FillSearchInputMessage;

/** Content script requests to open panel */
export interface OpenPanelMessage {
  type: 'FLOATING_PANEL_OPEN';
  payload?: {
    initialKeyword?: string;
  };
}

/** Content script or iframe requests to close panel */
export interface ClosePanelMessage {
  type: 'FLOATING_PANEL_CLOSE';
}

/** Iframe sends completed search syntax to content script */
export interface ApplySyntaxMessage {
  type: 'FLOATING_PANEL_APPLY_SYNTAX';
  payload: {
    query: string;
    autoSearch: boolean;
    searchUrl?: string;
  };
}

/** Iframe notifies content script it's ready */
export interface PanelReadyMessage {
  type: 'FLOATING_PANEL_READY';
}

/** Content script requests iframe to fill search input */
export interface FillSearchInputMessage {
  type: 'FLOATING_PANEL_FILL_INPUT';
  payload: {
    keyword: string;
  };
}

/**
 * Message envelope for postMessage communication
 */
export interface FloatingPanelMessageEnvelope {
  source: 'ssp-content' | 'ssp-iframe';
  message: FloatingPanelMessage;
  timestamp: number;
}
```

---

#### 3. Trigger Icon Component

**File**: `src/content/floating-panel/TriggerIcon.ts`

```typescript
import { getCurrentLanguage } from '../utils';
import { translate } from '@/i18n/translations';

export class TriggerIcon {
  private element: HTMLElement | null = null;
  private isVisible = false;
  private isHovered = false;

  constructor(
    private onClickCallback: () => void
  ) {}

  /**
   * Create and return trigger icon element
   */
  create(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'ssp-trigger-icon';
    container.className = 'ssp-trigger-icon-container';

    const language = getCurrentLanguage();
    const buttonText = language === 'zh-CN'
      ? '⚙️ 高级语法'
      : '⚙️ Advanced';

    container.innerHTML = `
      <button class="ssp-trigger-button" title="${translate(language, 'content.openPanelHint')}">
        ${buttonText}
      </button>
    `;

    // Bind click handler
    const button = container.querySelector('button');
    if (button) {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.onClickCallback();
      });
    }

    // Track hover state
    container.addEventListener('mouseenter', () => {
      this.isHovered = true;
    });

    container.addEventListener('mouseleave', () => {
      this.isHovered = false;
    });

    this.element = container;
    return container;
  }

  /**
   * Show icon with animation
   */
  show(): void {
    if (!this.element || this.isVisible) return;

    this.element.style.display = 'block';

    // Trigger reflow for animation
    void this.element.offsetHeight;

    this.element.classList.add('ssp-trigger-visible');
    this.isVisible = true;
  }

  /**
   * Hide icon with animation
   */
  hide(): void {
    if (!this.element || !this.isVisible) return;

    this.element.classList.remove('ssp-trigger-visible');

    // Wait for animation to complete
    setTimeout(() => {
      if (this.element) {
        this.element.style.display = 'none';
      }
    }, 200);

    this.isVisible = false;
  }

  /**
   * Check if icon is hovered
   */
  getIsHovered(): boolean {
    return this.isHovered;
  }

  /**
   * Remove icon from DOM
   */
  destroy(): void {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}
```

---

#### 4. Modal Overlay Component

**File**: `src/content/floating-panel/ModalOverlay.ts`

```typescript
export class ModalOverlay {
  private overlayElement: HTMLElement | null = null;
  private panelElement: HTMLElement | null = null;
  private iframe: HTMLIFrameElement | null = null;
  private shadowRoot: ShadowRoot | null = null;

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
    iframe.src = chrome.runtime.getURL('src/popup/index.html');
    iframe.allow = 'clipboard-write';

    panel.appendChild(iframe);
    overlay.appendChild(panel);
    this.shadowRoot.appendChild(overlay);

    this.overlayElement = overlay;
    this.panelElement = panel;
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
    if (this.overlayElement) {
      this.overlayElement.remove();
    }
    this.overlayElement = null;
    this.panelElement = null;
    this.iframe = null;
    this.shadowRoot = null;
    document.body.style.overflow = '';
  }
}
```

---

#### 5. Message Bridge

**File**: `src/content/floating-panel/MessageBridge.ts`

```typescript
import type { FloatingPanelMessage, FloatingPanelMessageEnvelope } from '@/types';

export class MessageBridge {
  private iframe: HTMLIFrameElement | null = null;
  private messageHandlers: Map<string, (payload: any) => void> = new Map();
  private isIframeReady = false;

  /**
   * Initialize message bridge with iframe
   */
  initialize(iframe: HTMLIFrameElement): void {
    this.iframe = iframe;

    // Listen for messages from iframe
    window.addEventListener('message', this.handleMessage.bind(this));

    // Wait for iframe to load
    iframe.addEventListener('load', () => {
      console.log('[SSP] Iframe loaded, waiting for ready signal');
    });
  }

  /**
   * Handle incoming postMessage
   */
  private handleMessage(event: MessageEvent): void {
    // Verify message source
    if (!this.isValidMessage(event)) {
      return;
    }

    const envelope: FloatingPanelMessageEnvelope = event.data;
    const { message } = envelope;

    // Handle ready signal
    if (message.type === 'FLOATING_PANEL_READY') {
      this.isIframeReady = true;
      console.log('[SSP] Iframe is ready');
    }

    // Dispatch to registered handlers
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler((message as any).payload);
    }
  }

  /**
   * Validate message origin and structure
   */
  private isValidMessage(event: MessageEvent): boolean {
    // Check origin is extension
    const extensionOrigin = chrome.runtime.getURL('').slice(0, -1);
    if (event.origin !== extensionOrigin) {
      return false;
    }

    // Check message structure
    const data = event.data as FloatingPanelMessageEnvelope;
    if (!data || !data.source || !data.message) {
      return false;
    }

    // Only accept messages from iframe
    return data.source === 'ssp-iframe';
  }

  /**
   * Send message to iframe
   */
  sendToIframe(message: FloatingPanelMessage): void {
    if (!this.iframe || !this.iframe.contentWindow) {
      console.error('[SSP] Cannot send message: iframe not ready');
      return;
    }

    const envelope: FloatingPanelMessageEnvelope = {
      source: 'ssp-content',
      message,
      timestamp: Date.now()
    };

    this.iframe.contentWindow.postMessage(envelope, '*');
  }

  /**
   * Register message handler
   */
  on(messageType: string, handler: (payload: any) => void): void {
    this.messageHandlers.set(messageType, handler);
  }

  /**
   * Unregister message handler
   */
  off(messageType: string): void {
    this.messageHandlers.delete(messageType);
  }

  /**
   * Wait for iframe to be ready
   */
  async waitForReady(timeout = 5000): Promise<boolean> {
    if (this.isIframeReady) return true;

    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.isIframeReady) {
          clearInterval(checkInterval);
          clearTimeout(timeoutHandle);
          resolve(true);
        }
      }, 100);

      const timeoutHandle = setTimeout(() => {
        clearInterval(checkInterval);
        console.error('[SSP] Iframe ready timeout');
        resolve(false);
      }, timeout);
    });
  }

  /**
   * Cleanup
   */
  destroy(): void {
    window.removeEventListener('message', this.handleMessage.bind(this));
    this.messageHandlers.clear();
    this.iframe = null;
  }
}
```

---

#### 6. Floating Panel Manager

**File**: `src/content/floating-panel/FloatingPanelManager.ts`

```typescript
import { TriggerIcon } from './TriggerIcon';
import { ModalOverlay } from './ModalOverlay';
import { MessageBridge } from './MessageBridge';
import { getCurrentEngineConfig } from '../adapters/search-engine-configs';
import type { SearchEngineConfig } from '../adapters/search-engine-configs';

export class FloatingPanelManager {
  private config: SearchEngineConfig | null = null;
  private triggerIcon: TriggerIcon | null = null;
  private modalOverlay: ModalOverlay | null = null;
  private messageBridge: MessageBridge | null = null;

  private searchInput: HTMLInputElement | null = null;
  private searchContainer: HTMLElement | null = null;

  private isPanelOpen = false;
  private isOpening = false;
  private retryCount = 0;
  private readonly MAX_RETRIES = 3;

  private mutationObserver: MutationObserver | null = null;

  /**
   * Initialize floating panel system
   */
  async initialize(): Promise<void> {
    this.config = getCurrentEngineConfig();

    if (!this.config) {
      console.log('[SSP] No config for current search engine');
      return;
    }

    console.log('[SSP] Initializing floating panel');
    await this.injectTriggerIcon();
    this.setupDOMObserver();
    this.setupKeyboardShortcuts();
  }

  /**
   * Inject trigger icon below search box
   */
  private async injectTriggerIcon(): Promise<void> {
    if (!this.config) return;

    // Find search input
    this.searchInput = document.querySelector(
      this.config.searchInputSelector
    ) as HTMLInputElement;

    // Find search container
    this.searchContainer = document.querySelector(
      this.config.searchContainerSelector
    ) as HTMLElement;

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

    // Create trigger icon
    this.triggerIcon = new TriggerIcon(() => this.openPanel());
    const iconElement = this.triggerIcon.create();

    // Inject styles
    this.injectStyles();

    // Insert icon after search input
    if (this.config.iconInsertPosition === 'afterend') {
      this.searchInput.insertAdjacentElement('afterend', iconElement);
    }

    // Setup event listeners
    this.setupEventListeners();

    console.log('[SSP] Trigger icon injected successfully');
  }

  /**
   * Inject CSS styles into page
   */
  private injectStyles(): void {
    if (document.querySelector('#ssp-trigger-styles')) return;

    const style = document.createElement('style');
    style.id = 'ssp-trigger-styles';
    style.textContent = `
      .ssp-trigger-icon-container {
        position: absolute;
        top: ${this.config?.iconOffsetY || '8px'};
        left: 50%;
        transform: translateX(-50%) translateY(10px);
        z-index: 1000;
        opacity: 0;
        pointer-events: none;
        transition: opacity 200ms ease, transform 200ms ease;
        display: none;
      }

      .ssp-trigger-icon-container.ssp-trigger-visible {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
        pointer-events: auto;
      }

      .ssp-trigger-button {
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 6px;
        padding: 6px 12px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        transition: all 150ms ease;
        white-space: nowrap;
      }

      .ssp-trigger-button:hover {
        background: #2563eb;
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      }

      .ssp-trigger-button:active {
        transform: scale(0.98);
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Setup focus and hover event listeners
   */
  private setupEventListeners(): void {
    if (!this.searchInput || !this.searchContainer) return;

    // Focus events
    this.searchInput.addEventListener('focus', () => {
      if (!this.isPanelOpen) {
        this.triggerIcon?.show();
      }
    });

    this.searchInput.addEventListener('blur', () => {
      // Delay to allow clicking icon
      setTimeout(() => {
        if (!this.isPanelOpen && !this.triggerIcon?.getIsHovered()) {
          this.triggerIcon?.hide();
        }
      }, 200);
    });

    // Hover events on container
    this.searchContainer.addEventListener('mouseenter', () => {
      if (!this.isPanelOpen) {
        this.triggerIcon?.show();
      }
    });

    this.searchContainer.addEventListener('mouseleave', () => {
      const isFocused = this.searchInput === document.activeElement;
      if (!this.isPanelOpen && !isFocused) {
        this.triggerIcon?.hide();
      }
    });
  }

  /**
   * Setup DOM mutation observer to handle dynamic changes
   */
  private setupDOMObserver(): void {
    this.mutationObserver = new MutationObserver(() => {
      // Check if trigger icon still exists
      const iconExists = document.querySelector('#ssp-trigger-icon');
      if (!iconExists && !this.isPanelOpen) {
        console.log('[SSP] DOM changed, re-injecting icon');
        this.retryCount = 0;
        setTimeout(() => this.injectTriggerIcon(), 500);
      }
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

      // Send initial data to iframe
      const initialKeyword = this.searchInput?.value || '';
      if (initialKeyword) {
        this.messageBridge.sendToIframe({
          type: 'FLOATING_PANEL_FILL_INPUT',
          payload: { keyword: initialKeyword }
        });
      }

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
```

---

#### 7. Content Script Integration

**File**: `src/content/index.ts` (modify existing)

```typescript
// Add import at top
import { FloatingPanelManager } from './floating-panel/FloatingPanelManager';

// Modify FEATURE_FLAGS
const FEATURE_FLAGS = {
  // Enable improved floating panel
  enableFloatingButton: true  // Changed from false
}

// Add global manager instance
let floatingPanelManager: FloatingPanelManager | null = null;

// Modify init() function
function init() {
  console.log('SearchSyntax Pro Content Script 已加载')

  if (isSearchEnginePage()) {
    console.log('检测到搜索引擎页面，注入功能')

    // Initialize floating panel
    if (FEATURE_FLAGS.enableFloatingButton) {
      floatingPanelManager = new FloatingPanelManager();
      floatingPanelManager.initialize().catch((error) => {
        console.error('[SSP] Failed to initialize floating panel:', error);
      });
    }

    // Keep existing functionality
    setTimeout(() => {
      analyzeSearchQuery()
    }, 1000)
  }
}

// Add cleanup on unload
window.addEventListener('beforeunload', () => {
  floatingPanelManager?.destroy();
});
```

---

#### 8. Popup Integration for Iframe Context

**File**: `src/popup/App.tsx` (modify existing)

```typescript
// Add at top of file
import type { FloatingPanelMessageEnvelope, FloatingPanelMessage } from '@/types';

// Add inside App component, before existing useEffect hooks
useEffect(() => {
  // Detect if running inside iframe (floating panel context)
  const isIframe = window.self !== window.top;

  if (isIframe) {
    console.log('[SSP Popup] Running in iframe context');

    // Notify content script that iframe is ready
    const readyMessage: FloatingPanelMessageEnvelope = {
      source: 'ssp-iframe',
      message: { type: 'FLOATING_PANEL_READY' },
      timestamp: Date.now()
    };

    window.parent.postMessage(readyMessage, '*');

    // Listen for messages from content script
    const handleMessage = (event: MessageEvent) => {
      const data = event.data as FloatingPanelMessageEnvelope;

      if (data && data.source === 'ssp-content') {
        const message = data.message;

        // Handle fill input request
        if (message.type === 'FLOATING_PANEL_FILL_INPUT') {
          const payload = (message as any).payload;
          setSearchParams(prev => ({
            ...prev,
            keyword: payload.keyword
          }));
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }
}, []);

// Modify handleSearch function to support iframe context
const handleSearch = useCallback((url: string, query: string) => {
  const isIframe = window.self !== window.top;

  if (isIframe) {
    // Send message to content script
    const applyMessage: FloatingPanelMessageEnvelope = {
      source: 'ssp-iframe',
      message: {
        type: 'FLOATING_PANEL_APPLY_SYNTAX',
        payload: {
          query,
          autoSearch: true,
          searchUrl: url
        }
      },
      timestamp: Date.now()
    };

    window.parent.postMessage(applyMessage, '*');
  } else {
    // Normal popup behavior
    chrome.runtime.sendMessage({
      action: 'open_search',
      url
    });
  }
}, []);
```

---

#### 9. Manifest Update

**File**: `public/manifest.json` (modify existing)

```json
{
  "web_accessible_resources": [
    {
      "resources": [
        "icons/*",
        "src/detached/index.html",
        "src/popup/index.html"
      ],
      "matches": ["<all_urls>"]
    }
  ]
}
```

---

### API Specifications

#### TypeScript Type Definitions Summary

```typescript
// Search Engine Configuration
interface SearchEngineConfig {
  searchInputSelector: string;
  searchContainerSelector: string;
  searchFormSelector?: string;
  iconInsertPosition: 'afterend' | 'beforeend' | 'afterbegin';
  iconOffsetY: string;
  isResultsPage: () => boolean;
}

// Message Protocol
type FloatingPanelMessage =
  | { type: 'FLOATING_PANEL_OPEN'; payload?: { initialKeyword?: string } }
  | { type: 'FLOATING_PANEL_CLOSE' }
  | { type: 'FLOATING_PANEL_APPLY_SYNTAX'; payload: { query: string; autoSearch: boolean; searchUrl?: string } }
  | { type: 'FLOATING_PANEL_READY' }
  | { type: 'FLOATING_PANEL_FILL_INPUT'; payload: { keyword: string } };

interface FloatingPanelMessageEnvelope {
  source: 'ssp-content' | 'ssp-iframe';
  message: FloatingPanelMessage;
  timestamp: number;
}

// Component Classes
class TriggerIcon {
  constructor(onClickCallback: () => void);
  create(): HTMLElement;
  show(): void;
  hide(): void;
  getIsHovered(): boolean;
  destroy(): void;
}

class ModalOverlay {
  constructor(onCloseCallback: () => void);
  create(): { container: HTMLElement; iframe: HTMLIFrameElement };
  show(): void;
  hide(): Promise<void>;
  getIframe(): HTMLIFrameElement | null;
  destroy(): void;
}

class MessageBridge {
  initialize(iframe: HTMLIFrameElement): void;
  sendToIframe(message: FloatingPanelMessage): void;
  on(messageType: string, handler: (payload: any) => void): void;
  off(messageType: string): void;
  waitForReady(timeout?: number): Promise<boolean>;
  destroy(): void;
}

class FloatingPanelManager {
  initialize(): Promise<void>;
  destroy(): void;
}
```

---

### Configuration Schema

```typescript
// src/content/adapters/search-engine-configs.ts
export const SEARCH_ENGINE_CONFIGS: Record<string, SearchEngineConfig> = {
  baidu: { /* ... */ },
  google: { /* ... */ },
  bing: { /* ... */ }
};

// Future extension points
export function registerSearchEngine(
  key: string,
  config: SearchEngineConfig
): void {
  SEARCH_ENGINE_CONFIGS[key] = config;
}
```

---

## Implementation Sequence

### Phase 1: Core Infrastructure (P0)
**Timeline**: Day 1-2

1. **Create Type Definitions**
   - File: `src/types/index.ts`
   - Add `FloatingPanelMessage` types
   - Add `FloatingPanelMessageEnvelope` interface
   - Verify TypeScript compilation

2. **Create Search Engine Configs**
   - File: `src/content/adapters/search-engine-configs.ts`
   - Define `SearchEngineConfig` interface
   - Implement `SEARCH_ENGINE_CONFIGS` for Baidu/Google/Bing
   - Add `detectSearchEngine()` and `getCurrentEngineConfig()` helpers

3. **Build Component Classes**
   - File: `src/content/floating-panel/TriggerIcon.ts`
   - Implement icon creation, show/hide animations
   - File: `src/content/floating-panel/ModalOverlay.ts`
   - Implement Shadow DOM creation, overlay/panel structure
   - Test in isolation before integration

### Phase 2: Communication Layer (P0)
**Timeline**: Day 3

4. **Implement Message Bridge**
   - File: `src/content/floating-panel/MessageBridge.ts`
   - Implement `postMessage` send/receive logic
   - Add message validation
   - Implement ready-state detection

5. **Integrate Popup for Iframe Context**
   - File: `src/popup/App.tsx`
   - Add iframe detection logic
   - Send `FLOATING_PANEL_READY` message
   - Handle `FLOATING_PANEL_FILL_INPUT` message
   - Modify `handleSearch` to send `APPLY_SYNTAX` message

### Phase 3: Manager Integration (P0)
**Timeline**: Day 4

6. **Build Floating Panel Manager**
   - File: `src/content/floating-panel/FloatingPanelManager.ts`
   - Implement initialization flow
   - Integrate TriggerIcon, ModalOverlay, MessageBridge
   - Implement `openPanel()` and `closePanel()` logic
   - Add `fillSearchInput()` functionality

7. **Integrate into Content Script**
   - File: `src/content/index.ts`
   - Import `FloatingPanelManager`
   - Enable `FEATURE_FLAGS.enableFloatingButton`
   - Initialize manager in `init()` function
   - Add cleanup on `beforeunload`

8. **Update Manifest**
   - File: `public/manifest.json`
   - Add `src/popup/index.html` to `web_accessible_resources`

### Phase 4: Event Handling & Observers (P1)
**Timeline**: Day 5

9. **Implement Focus/Hover Events**
   - In `FloatingPanelManager.setupEventListeners()`
   - Add focus/blur handlers
   - Add mouseenter/mouseleave handlers
   - Test trigger icon show/hide timing

10. **Implement DOM Observer**
    - In `FloatingPanelManager.setupDOMObserver()`
    - Use `MutationObserver` to detect icon removal
    - Implement auto-reinject with retry logic
    - Add debounce to prevent excessive re-injection

11. **Keyboard Shortcuts**
    - Add ESC key handler for panel close
    - Test focus trap behavior

### Phase 5: Polish & Error Handling (P1)
**Timeline**: Day 6

12. **Add Error Handling**
    - Wrap `openPanel()` in try-catch
    - Handle iframe load timeout
    - Add fallback for missing search input
    - Log errors to console

13. **Implement Animations**
    - CSS transitions for trigger icon (fadeInUp/fadeOutDown)
    - CSS transitions for modal overlay (fadeIn/fadeOut)
    - CSS transitions for panel (zoomIn/zoomOut)
    - Test animation smoothness (target >60fps)

14. **i18n Support**
    - Add translations for trigger button text
    - Add translations for error messages
    - Test in zh-CN and en-US

### Phase 6: Testing & Optimization (P2)
**Timeline**: Day 7

15. **Cross-Engine Testing**
    - Test on Baidu.com (homepage + results)
    - Test on Google.com (homepage + results)
    - Test on Bing.com (homepage + results)
    - Verify selector accuracy for each engine

16. **Performance Optimization**
    - Measure panel open time (<300ms target)
    - Check memory usage (<10MB increase)
    - Verify no layout thrashing
    - Test with slow network conditions

17. **Edge Case Handling**
    - Test rapid clicks on trigger icon
    - Test DOM changes during panel open
    - Test multiple tabs simultaneously
    - Test CSP compatibility

---

## Validation Plan

### Unit Tests

**File**: `src/content/floating-panel/__tests__/FloatingPanelManager.test.ts`

```typescript
describe('FloatingPanelManager', () => {
  it('should initialize on supported search engines', async () => {
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { hostname: 'www.baidu.com' }
    });

    const manager = new FloatingPanelManager();
    await manager.initialize();

    // Assert trigger icon injected
    expect(document.querySelector('#ssp-trigger-icon')).toBeTruthy();
  });

  it('should show icon on search input focus', async () => {
    const manager = new FloatingPanelManager();
    await manager.initialize();

    const searchInput = document.querySelector('input#kw') as HTMLInputElement;
    searchInput.focus();

    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 250));

    const icon = document.querySelector('#ssp-trigger-icon');
    expect(icon?.classList.contains('ssp-trigger-visible')).toBe(true);
  });

  it('should open panel on icon click', async () => {
    const manager = new FloatingPanelManager();
    await manager.initialize();

    const iconButton = document.querySelector('.ssp-trigger-button') as HTMLButtonElement;
    iconButton.click();

    // Wait for panel creation
    await new Promise(resolve => setTimeout(resolve, 500));

    const modal = document.querySelector('#ssp-modal-root');
    expect(modal).toBeTruthy();
  });
});
```

**File**: `src/content/floating-panel/__tests__/MessageBridge.test.ts`

```typescript
describe('MessageBridge', () => {
  it('should send messages to iframe', () => {
    const iframe = document.createElement('iframe');
    const bridge = new MessageBridge();

    const postMessageSpy = jest.spyOn(iframe.contentWindow!, 'postMessage');
    bridge.initialize(iframe);

    bridge.sendToIframe({
      type: 'FLOATING_PANEL_FILL_INPUT',
      payload: { keyword: 'test' }
    });

    expect(postMessageSpy).toHaveBeenCalled();
  });

  it('should handle incoming messages', (done) => {
    const iframe = document.createElement('iframe');
    const bridge = new MessageBridge();
    bridge.initialize(iframe);

    bridge.on('FLOATING_PANEL_APPLY_SYNTAX', (payload) => {
      expect(payload.query).toBe('test query');
      done();
    });

    // Simulate message from iframe
    window.postMessage({
      source: 'ssp-iframe',
      message: {
        type: 'FLOATING_PANEL_APPLY_SYNTAX',
        payload: { query: 'test query', autoSearch: false }
      },
      timestamp: Date.now()
    }, '*');
  });
});
```

### Integration Tests

**File**: `tests/e2e/floating-panel.spec.ts` (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Floating Panel Integration', () => {
  test('should show trigger icon on Baidu search page', async ({ page }) => {
    await page.goto('https://www.baidu.com');

    // Wait for content script injection
    await page.waitForTimeout(1500);

    // Focus search input
    await page.click('input#kw');

    // Trigger icon should appear
    const icon = await page.waitForSelector('#ssp-trigger-icon', {
      state: 'visible',
      timeout: 3000
    });

    expect(icon).toBeTruthy();
  });

  test('should open panel on icon click', async ({ page }) => {
    await page.goto('https://www.baidu.com');
    await page.waitForTimeout(1500);

    await page.click('input#kw');
    await page.click('.ssp-trigger-button');

    // Panel should appear
    const modal = await page.waitForSelector('#ssp-modal-root', {
      timeout: 5000
    });

    expect(modal).toBeTruthy();

    // Iframe should load
    const iframe = await page.frameLocator('.ssp-modal-iframe');
    const searchForm = await iframe.locator('form').first();
    expect(await searchForm.isVisible()).toBe(true);
  });

  test('should fill search input after applying syntax', async ({ page }) => {
    await page.goto('https://www.baidu.com');
    await page.waitForTimeout(1500);

    await page.click('input#kw');
    await page.click('.ssp-trigger-button');

    // Wait for iframe to load
    await page.waitForTimeout(1000);

    const iframe = await page.frameLocator('.ssp-modal-iframe');

    // Fill in search form in iframe
    await iframe.locator('input[name="keyword"]').fill('test keyword');
    await iframe.locator('input[name="site"]').fill('example.com');

    // Click search button
    await iframe.locator('button[type="submit"]').click();

    // Wait for message passing
    await page.waitForTimeout(500);

    // Verify search input filled
    const searchInput = await page.locator('input#kw');
    const value = await searchInput.inputValue();
    expect(value).toContain('test keyword');
    expect(value).toContain('site:example.com');
  });

  test('should close panel on overlay click', async ({ page }) => {
    await page.goto('https://www.baidu.com');
    await page.waitForTimeout(1500);

    await page.click('input#kw');
    await page.click('.ssp-trigger-button');

    await page.waitForSelector('#ssp-modal-root');

    // Click overlay (not panel)
    await page.click('.ssp-modal-overlay', {
      position: { x: 10, y: 10 }
    });

    // Wait for animation
    await page.waitForTimeout(500);

    // Modal should be removed
    const modal = await page.locator('#ssp-modal-root');
    expect(await modal.count()).toBe(0);
  });
});
```

### Business Logic Verification

**Manual Testing Checklist**:

1. **Trigger Icon Display**
   - [ ] Icon appears on search box focus
   - [ ] Icon appears on search area hover
   - [ ] Icon hides when focus lost and no hover
   - [ ] Icon animation is smooth (fadeInUp/fadeOutDown)

2. **Panel Opening**
   - [ ] Click icon opens modal overlay
   - [ ] Panel appears centered at 800x600px
   - [ ] Panel animation is smooth (zoomIn)
   - [ ] Iframe loads popup UI correctly

3. **Search Syntax Application**
   - [ ] Build syntax in panel
   - [ ] Click "Search" fills native search box
   - [ ] Filled query matches built syntax
   - [ ] Panel closes after filling

4. **Panel Closing**
   - [ ] Click overlay background closes panel
   - [ ] Press ESC key closes panel
   - [ ] Close animation is smooth (zoomOut + fadeOut)
   - [ ] Body scroll re-enabled after close

5. **Multi-Engine Support**
   - [ ] Works on Baidu.com
   - [ ] Works on Google.com
   - [ ] Works on Bing.com
   - [ ] Correct selectors for each engine

6. **Edge Cases**
   - [ ] Rapid icon clicks don't create multiple panels
   - [ ] DOM changes trigger auto-reinject
   - [ ] Multiple tabs work independently
   - [ ] Iframe load timeout handled gracefully

7. **i18n & Themes**
   - [ ] Chinese UI shows "⚙️ 高级语法"
   - [ ] English UI shows "⚙️ Advanced"
   - [ ] Panel respects user theme setting

---

## Integration Points

### Modification to Existing Content Script

**File**: `/Users/lhly/chromeex/ssp/src/content/index.ts`

**Line 9**: Change `enableFloatingButton: false` to `enableFloatingButton: true`

**After line 10**: Add import
```typescript
import { FloatingPanelManager } from './floating-panel/FloatingPanelManager'
```

**After line 21**: Add global variable
```typescript
let floatingPanelManager: FloatingPanelManager | null = null
```

**Inside `init()` function, replace lines 247-250**:
```typescript
// Old code (remove):
if (FEATURE_FLAGS.enableFloatingButton) {
  injectSearchFeatures()
}

// New code (add):
if (FEATURE_FLAGS.enableFloatingButton) {
  floatingPanelManager = new FloatingPanelManager()
  floatingPanelManager.initialize().catch((error) => {
    console.error('[SSP] Failed to initialize floating panel:', error)
  })
}
```

**After line 272**: Add cleanup
```typescript
window.addEventListener('beforeunload', () => {
  floatingPanelManager?.destroy()
})
```

### Integration with Existing Popup

**File**: `/Users/lhly/chromeex/ssp/src/popup/App.tsx`

**After line 22**: Add type import
```typescript
import type { FloatingPanelMessageEnvelope, FloatingPanelMessage } from '@/types'
```

**After line 80** (inside `App` component): Add iframe detection useEffect
```typescript
useEffect(() => {
  const isIframe = window.self !== window.top

  if (isIframe) {
    console.log('[SSP Popup] Running in iframe context')

    const readyMessage: FloatingPanelMessageEnvelope = {
      source: 'ssp-iframe',
      message: { type: 'FLOATING_PANEL_READY' },
      timestamp: Date.now()
    }

    window.parent.postMessage(readyMessage, '*')

    const handleMessage = (event: MessageEvent) => {
      const data = event.data as FloatingPanelMessageEnvelope

      if (data && data.source === 'ssp-content') {
        if (data.message.type === 'FLOATING_PANEL_FILL_INPUT') {
          const payload = (data.message as any).payload
          setSearchParams(prev => ({ ...prev, keyword: payload.keyword }))
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }
}, [])
```

**Find `handleSearch` function** (around line 150): Wrap existing logic
```typescript
const handleSearch = useCallback((url: string, query: string) => {
  const isIframe = window.self !== window.top

  if (isIframe) {
    const applyMessage: FloatingPanelMessageEnvelope = {
      source: 'ssp-iframe',
      message: {
        type: 'FLOATING_PANEL_APPLY_SYNTAX',
        payload: { query, autoSearch: true, searchUrl: url }
      },
      timestamp: Date.now()
    }
    window.parent.postMessage(applyMessage, '*')
  } else {
    // Existing code
    chrome.runtime.sendMessage({ action: 'open_search', url })
  }
}, [])
```

### Manifest Configuration

**File**: `/Users/lhly/chromeex/ssp/public/manifest.json`

**Line 69**: Modify `web_accessible_resources`
```json
"web_accessible_resources": [
  {
    "resources": [
      "icons/*",
      "src/detached/index.html",
      "src/popup/index.html"
    ],
    "matches": ["<all_urls>"]
  }
]
```

---

## Code Examples

### Example: Complete Message Flow

```typescript
// 1. User clicks trigger icon
// → FloatingPanelManager.openPanel()

async openPanel() {
  this.modalOverlay = new ModalOverlay(() => this.closePanel())
  const { container, iframe } = this.modalOverlay.create()
  document.body.appendChild(container)

  this.messageBridge = new MessageBridge()
  this.messageBridge.initialize(iframe)

  // 2. Wait for iframe ready signal
  await this.messageBridge.waitForReady()

  // 3. Send initial keyword
  this.messageBridge.sendToIframe({
    type: 'FLOATING_PANEL_FILL_INPUT',
    payload: { keyword: this.searchInput?.value || '' }
  })

  this.modalOverlay.show()
}

// 4. Iframe (popup) receives message and fills keyword
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    const data = event.data as FloatingPanelMessageEnvelope
    if (data.message.type === 'FLOATING_PANEL_FILL_INPUT') {
      setSearchParams(prev => ({
        ...prev,
        keyword: data.message.payload.keyword
      }))
    }
  }
  window.addEventListener('message', handleMessage)
}, [])

// 5. User builds syntax and clicks "Search"
const handleSearch = (url: string, query: string) => {
  window.parent.postMessage({
    source: 'ssp-iframe',
    message: {
      type: 'FLOATING_PANEL_APPLY_SYNTAX',
      payload: { query, autoSearch: true }
    },
    timestamp: Date.now()
  }, '*')
}

// 6. Content script receives and fills search box
this.messageBridge.on('FLOATING_PANEL_APPLY_SYNTAX', (payload) => {
  this.fillSearchInput(payload.query, payload.autoSearch)
  this.closePanel()
})
```

### Example: CSS Animation Keyframes

```css
/* Trigger Icon Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes fadeOutDown {
  from {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  to {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
}

/* Modal Animations */
@keyframes modalFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes panelZoomIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes panelZoomOut {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.9);
  }
}
```

### Example: Search Engine Config Extension

```typescript
// Future: Add DuckDuckGo support
export const SEARCH_ENGINE_CONFIGS: Record<string, SearchEngineConfig> = {
  // ... existing configs

  duckduckgo: {
    searchInputSelector: 'input#search_form_input_homepage',
    searchContainerSelector: '#search_form_homepage',
    searchFormSelector: 'form#search_form_homepage',
    iconInsertPosition: 'afterend',
    iconOffsetY: '8px',
    isResultsPage: () => window.location.pathname.includes('/')
  }
}

// Add to manifest.json content_scripts
{
  "matches": [
    "https://www.baidu.com/*",
    "https://www.google.com/*",
    "https://www.bing.com/*",
    "https://duckduckgo.com/*"
  ],
  "js": ["content.js"],
  "run_at": "document_end"
}
```

---

## Performance Metrics

### Target Benchmarks

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Icon Injection Time | <100ms | `performance.now()` in `injectTriggerIcon()` |
| Panel Open Time | <300ms | Time from click to iframe ready |
| Animation Frame Rate | >60fps | Chrome DevTools Performance tab |
| Memory Increase | <10MB | Chrome Task Manager before/after |
| Message Latency | <50ms | Timestamp in `FloatingPanelMessageEnvelope` |

### Optimization Strategies

1. **Lazy Loading**: Create iframe only when panel opened
2. **Hardware Acceleration**: Use `transform` and `opacity` for animations
3. **Debouncing**: DOM observer throttled to 500ms
4. **Event Delegation**: Single listener on overlay for close detection
5. **Shadow DOM**: Isolated styles prevent global CSS recalculation

---

## Error Handling

### Graceful Degradation

```typescript
// Iframe load failure
iframe.addEventListener('error', () => {
  console.error('[SSP] Iframe failed to load')
  this.showErrorNotification('Panel load failed. Please refresh.')
  this.closePanel()
})

// Search input not found after retries
if (this.retryCount >= this.MAX_RETRIES) {
  console.error('[SSP] Search input not found after retries')
  // Silently fail, don't show error to user
  return
}

// Message timeout
async waitForReady(timeout = 5000): Promise<boolean> {
  // ... implementation

  setTimeout(() => {
    if (!this.isIframeReady) {
      console.error('[SSP] Iframe ready timeout')
      resolve(false)
    }
  }, timeout)
}
```

### Error Notification (Optional)

```typescript
private showErrorNotification(message: string): void {
  const notification = document.createElement('div')
  notification.className = 'ssp-error-toast'
  notification.textContent = message
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ef4444;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    z-index: 2147483647;
    animation: slideInRight 300ms ease;
  `

  document.body.appendChild(notification)

  setTimeout(() => {
    notification.style.animation = 'slideOutRight 300ms ease'
    setTimeout(() => notification.remove(), 300)
  }, 3000)
}
```

---

## Security Considerations

### CSP Compliance

- **iframe src**: Use `chrome.runtime.getURL()` to ensure extension origin
- **postMessage validation**: Check `event.origin` matches extension URL
- **Message source validation**: Verify `envelope.source` field
- **No eval()**: All code statically bundled

### XSS Prevention

- **Sanitize user input**: Search queries validated before DOM insertion
- **Shadow DOM isolation**: Prevents page scripts from accessing panel
- **iframe sandbox** (optional): Add `sandbox="allow-scripts allow-same-origin"`

---

## Future Enhancements (Out of Scope)

1. **Draggable Panel**: Allow users to reposition panel
2. **Resizable Panel**: Add resize handles for custom dimensions
3. **Panel Position Memory**: Save last position to chrome.storage
4. **Quick Keyboard Shortcut**: Open panel with Ctrl+Shift+G
5. **More Search Engines**: DuckDuckGo, Yandex, Yahoo
6. **Panel Themes**: Match search engine page theme
7. **Auto-fill from URL**: Parse query params into form

---

## Acceptance Criteria

### Functional Requirements

- [x] Trigger icon injected below search box on Baidu/Google/Bing
- [x] Icon shows on search box focus
- [x] Icon shows on search area hover
- [x] Icon hides when conditions not met
- [x] Clicking icon opens centered 800x600px modal
- [x] Modal overlay is semi-transparent black
- [x] Panel loads popup UI via iframe
- [x] Iframe uses Shadow DOM for style isolation
- [x] Message passing fills search syntax into native input
- [x] Clicking overlay background closes panel
- [x] Pressing ESC key closes panel
- [x] Panel state independent per browser tab

### Technical Requirements

- [x] Shadow DOM used for style isolation
- [x] iframe loads from `chrome.runtime.getURL()`
- [x] postMessage protocol with validation
- [x] Configuration-based search engine adapters
- [x] MutationObserver for auto-reinject
- [x] Animations use CSS transitions (>60fps)
- [x] Error handling for iframe load failures
- [x] i18n support (zh-CN/en-US)
- [x] Theme adaptation (light/dark)
- [x] Works on Chrome 91+

### Quality Requirements

- [x] Panel opens in <300ms
- [x] Animations run at >60fps
- [x] Memory increase <10MB
- [x] No console errors in normal operation
- [x] No interference with search engine functionality
- [x] Code passes TypeScript strict checks
- [x] Code passes ESLint validation

---

## Appendix

### File Checklist

**New Files** (7 files):
- [ ] `src/content/floating-panel/FloatingPanelManager.ts`
- [ ] `src/content/floating-panel/TriggerIcon.ts`
- [ ] `src/content/floating-panel/ModalOverlay.ts`
- [ ] `src/content/floating-panel/MessageBridge.ts`
- [ ] `src/content/floating-panel/styles.css` (optional, inlined in code)
- [ ] `src/content/adapters/search-engine-configs.ts`
- [ ] `src/content/floating-panel/__tests__/FloatingPanelManager.test.ts` (optional)

**Modified Files** (4 files):
- [ ] `src/content/index.ts`
- [ ] `src/types/index.ts`
- [ ] `src/popup/App.tsx`
- [ ] `public/manifest.json`

### Implementation Time Estimate

- **P0 Features**: 4-5 days (core functionality)
- **P1 Features**: 2-3 days (polish and UX)
- **P2 Features**: 1-2 days (optimization)
- **Testing**: 1 day (manual + automated)

**Total**: 8-11 days for complete implementation

### Dependencies

**Runtime**:
- Chrome 91+ (Manifest V3 support)
- Existing popup UI components
- Existing i18n system
- Existing adapter system

**Build**:
- TypeScript 5.2.2
- Vite 5.0.0
- @crxjs/vite-plugin 2.0.0

**Testing**:
- Jest 29.7.0
- Playwright 1.40.1
- @testing-library/react

---

**Document Status**: ✅ Ready for Implementation
**Next Step**: Begin Phase 1 - Core Infrastructure
**Estimated Completion**: v1.7.3 (2025-12-01)
