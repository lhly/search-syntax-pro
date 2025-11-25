import type { FloatingPanelMessage, FloatingPanelMessageEnvelope } from '@/types';

/**
 * MessageBridge Component
 * Handles bidirectional postMessage communication between content script and iframe
 */
export class MessageBridge {
  private iframe: HTMLIFrameElement | null = null;
  private messageHandlers: Map<string, (payload: any) => void> = new Map();
  private isIframeReady = false;
  private boundHandleMessage: ((event: MessageEvent) => void) | null = null;

  /**
   * Initialize message bridge with iframe
   */
  initialize(iframe: HTMLIFrameElement): void {
    this.iframe = iframe;

    // Create bound handler for proper cleanup
    this.boundHandleMessage = this.handleMessage.bind(this);

    // Listen for messages from iframe
    window.addEventListener('message', this.boundHandleMessage);

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
    if (this.boundHandleMessage) {
      window.removeEventListener('message', this.boundHandleMessage);
      this.boundHandleMessage = null;
    }
    this.messageHandlers.clear();
    this.iframe = null;
    this.isIframeReady = false;
  }
}
