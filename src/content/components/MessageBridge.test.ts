import { MessageBridge } from './MessageBridge';
import type { FloatingPanelMessageEnvelope } from '@/types';

// Mock chrome API
const mockChrome = {
  runtime: {
    getURL: jest.fn((path: string) => `chrome-extension://test-extension-id/${path}`)
  }
};

Object.defineProperty(global, 'chrome', {
  value: mockChrome,
  writable: true
});

describe('MessageBridge', () => {
  let messageBridge: MessageBridge;
  let mockIframe: HTMLIFrameElement;
  let mockContentWindow: any;

  beforeEach(() => {
    messageBridge = new MessageBridge();

    // Create mock iframe with contentWindow
    mockContentWindow = {
      postMessage: jest.fn()
    };

    mockIframe = document.createElement('iframe');
    Object.defineProperty(mockIframe, 'contentWindow', {
      value: mockContentWindow,
      writable: true
    });

    // Clear all timers
    jest.clearAllTimers();
  });

  afterEach(() => {
    messageBridge.destroy();
  });

  describe('initialize', () => {
    it('应该设置iframe引用', () => {
      messageBridge.initialize(mockIframe);

      expect(() => {
        messageBridge.sendToIframe({ type: 'FLOATING_PANEL_CLOSE' });
      }).not.toThrow();
    });

    it('应该添加message事件监听器', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      messageBridge.initialize(mockIframe);

      expect(addEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });

    it('应该添加iframe load事件监听器', () => {
      const addEventListenerSpy = jest.spyOn(mockIframe, 'addEventListener');

      messageBridge.initialize(mockIframe);

      expect(addEventListenerSpy).toHaveBeenCalledWith('load', expect.any(Function));
    });
  });

  describe('sendToIframe', () => {
    beforeEach(() => {
      messageBridge.initialize(mockIframe);
    });

    it('应该向iframe发送消息', () => {
      const message = { type: 'FLOATING_PANEL_CLOSE' as const };

      messageBridge.sendToIframe(message);

      expect(mockContentWindow.postMessage).toHaveBeenCalled();

      const [envelope] = mockContentWindow.postMessage.mock.calls[0];
      expect(envelope.source).toBe('ssp-content');
      expect(envelope.message).toEqual(message);
      expect(envelope.timestamp).toBeDefined();
    });

    it('应该发送FLOATING_PANEL_FILL_INPUT消息', () => {
      const message = {
        type: 'FLOATING_PANEL_FILL_INPUT' as const,
        payload: { keyword: 'test keyword' }
      };

      messageBridge.sendToIframe(message);

      const [envelope] = mockContentWindow.postMessage.mock.calls[0];
      expect(envelope.message.type).toBe('FLOATING_PANEL_FILL_INPUT');
      expect(envelope.message.payload.keyword).toBe('test keyword');
    });

    it('在iframe未初始化时应该记录错误', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const uninitializedBridge = new MessageBridge();

      uninitializedBridge.sendToIframe({ type: 'FLOATING_PANEL_CLOSE' });

      expect(consoleSpy).toHaveBeenCalledWith('[SSP] Cannot send message: iframe not ready');

      consoleSpy.mockRestore();
    });

    it('在contentWindow为null时应该记录错误', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const brokenIframe = document.createElement('iframe');
      Object.defineProperty(brokenIframe, 'contentWindow', {
        value: null,
        writable: true
      });

      messageBridge.initialize(brokenIframe);
      messageBridge.sendToIframe({ type: 'FLOATING_PANEL_CLOSE' });

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('message handling', () => {
    beforeEach(() => {
      messageBridge.initialize(mockIframe);
    });

    it('应该接收并处理FLOATING_PANEL_READY消息', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const envelope: FloatingPanelMessageEnvelope = {
        source: 'ssp-iframe',
        message: { type: 'FLOATING_PANEL_READY' },
        timestamp: Date.now()
      };

      window.dispatchEvent(new MessageEvent('message', {
        data: envelope,
        origin: 'chrome-extension://test-extension-id'
      }));

      expect(consoleSpy).toHaveBeenCalledWith('[SSP] Iframe is ready');

      consoleSpy.mockRestore();
    });

    it('应该调用注册的消息处理器', () => {
      const handler = jest.fn();
      messageBridge.on('FLOATING_PANEL_APPLY_SYNTAX', handler);

      const envelope: FloatingPanelMessageEnvelope = {
        source: 'ssp-iframe',
        message: {
          type: 'FLOATING_PANEL_APPLY_SYNTAX',
          payload: {
            query: 'test query',
            autoSearch: true
          }
        },
        timestamp: Date.now()
      };

      window.dispatchEvent(new MessageEvent('message', {
        data: envelope,
        origin: 'chrome-extension://test-extension-id'
      }));

      expect(handler).toHaveBeenCalledWith({
        query: 'test query',
        autoSearch: true
      });
    });

    it('应该忽略非扩展来源的消息', () => {
      const handler = jest.fn();
      messageBridge.on('FLOATING_PANEL_CLOSE', handler);

      const envelope: FloatingPanelMessageEnvelope = {
        source: 'ssp-iframe',
        message: { type: 'FLOATING_PANEL_CLOSE' },
        timestamp: Date.now()
      };

      window.dispatchEvent(new MessageEvent('message', {
        data: envelope,
        origin: 'https://malicious-site.com'
      }));

      expect(handler).not.toHaveBeenCalled();
    });

    it('应该忽略非iframe来源的消息', () => {
      const handler = jest.fn();
      messageBridge.on('FLOATING_PANEL_CLOSE', handler);

      const envelope: FloatingPanelMessageEnvelope = {
        source: 'ssp-content', // Wrong source
        message: { type: 'FLOATING_PANEL_CLOSE' },
        timestamp: Date.now()
      };

      window.dispatchEvent(new MessageEvent('message', {
        data: envelope,
        origin: 'chrome-extension://test-extension-id'
      }));

      expect(handler).not.toHaveBeenCalled();
    });

    it('应该忽略格式错误的消息', () => {
      const handler = jest.fn();
      messageBridge.on('FLOATING_PANEL_CLOSE', handler);

      const invalidEnvelope = {
        // Missing required fields
        message: { type: 'FLOATING_PANEL_CLOSE' }
      };

      window.dispatchEvent(new MessageEvent('message', {
        data: invalidEnvelope,
        origin: 'chrome-extension://test-extension-id'
      }));

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('on/off', () => {
    it('应该注册消息处理器', () => {
      const handler = jest.fn();

      messageBridge.on('FLOATING_PANEL_CLOSE', handler);

      // Should be able to trigger handler (tested in message handling tests)
      expect(() => messageBridge.on('FLOATING_PANEL_CLOSE', handler)).not.toThrow();
    });

    it('应该注销消息处理器', () => {
      const handler = jest.fn();
      messageBridge.initialize(mockIframe);

      messageBridge.on('FLOATING_PANEL_CLOSE', handler);
      messageBridge.off('FLOATING_PANEL_CLOSE');

      const envelope: FloatingPanelMessageEnvelope = {
        source: 'ssp-iframe',
        message: { type: 'FLOATING_PANEL_CLOSE' },
        timestamp: Date.now()
      };

      window.dispatchEvent(new MessageEvent('message', {
        data: envelope,
        origin: 'chrome-extension://test-extension-id'
      }));

      expect(handler).not.toHaveBeenCalled();
    });

    it('应该支持多个消息类型的处理器', () => {
      messageBridge.initialize(mockIframe);

      const closeHandler = jest.fn();
      const applyHandler = jest.fn();

      messageBridge.on('FLOATING_PANEL_CLOSE', closeHandler);
      messageBridge.on('FLOATING_PANEL_APPLY_SYNTAX', applyHandler);

      // Send CLOSE message
      const closeEnvelope: FloatingPanelMessageEnvelope = {
        source: 'ssp-iframe',
        message: { type: 'FLOATING_PANEL_CLOSE' },
        timestamp: Date.now()
      };

      window.dispatchEvent(new MessageEvent('message', {
        data: closeEnvelope,
        origin: 'chrome-extension://test-extension-id'
      }));

      expect(closeHandler).toHaveBeenCalled();
      expect(applyHandler).not.toHaveBeenCalled();
    });
  });

  describe('waitForReady', () => {
    beforeEach(() => {
      messageBridge.initialize(mockIframe);
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('如果已经ready应该立即返回true', async () => {
      // Send ready message first
      const envelope: FloatingPanelMessageEnvelope = {
        source: 'ssp-iframe',
        message: { type: 'FLOATING_PANEL_READY' },
        timestamp: Date.now()
      };

      window.dispatchEvent(new MessageEvent('message', {
        data: envelope,
        origin: 'chrome-extension://test-extension-id'
      }));

      const result = await messageBridge.waitForReady();
      expect(result).toBe(true);
    });

    it('应该等待iframe ready信号', async () => {
      const readyPromise = messageBridge.waitForReady();

      // Advance timers a bit
      jest.advanceTimersByTime(500);

      // Send ready message
      const envelope: FloatingPanelMessageEnvelope = {
        source: 'ssp-iframe',
        message: { type: 'FLOATING_PANEL_READY' },
        timestamp: Date.now()
      };

      window.dispatchEvent(new MessageEvent('message', {
        data: envelope,
        origin: 'chrome-extension://test-extension-id'
      }));

      // Advance timers to let the interval check
      jest.advanceTimersByTime(100);

      const result = await readyPromise;
      expect(result).toBe(true);
    });

    it('超时后应该返回false', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const readyPromise = messageBridge.waitForReady(1000);

      // Advance past timeout
      jest.advanceTimersByTime(1100);

      const result = await readyPromise;

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('[SSP] Iframe ready timeout');

      consoleSpy.mockRestore();
    });

    it('应该使用自定义超时时间', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const readyPromise = messageBridge.waitForReady(2000);

      // Advance to just before timeout
      jest.advanceTimersByTime(1900);

      // Should not timeout yet
      let result = null;
      readyPromise.then(r => { result = r; });

      expect(result).toBeNull();

      // Advance past timeout
      jest.advanceTimersByTime(200);

      await readyPromise;

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('destroy', () => {
    it('应该移除message事件监听器', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      messageBridge.initialize(mockIframe);
      messageBridge.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });

    it('应该清空消息处理器', () => {
      messageBridge.initialize(mockIframe);

      const handler = jest.fn();
      messageBridge.on('FLOATING_PANEL_CLOSE', handler);

      messageBridge.destroy();

      const envelope: FloatingPanelMessageEnvelope = {
        source: 'ssp-iframe',
        message: { type: 'FLOATING_PANEL_CLOSE' },
        timestamp: Date.now()
      };

      window.dispatchEvent(new MessageEvent('message', {
        data: envelope,
        origin: 'chrome-extension://test-extension-id'
      }));

      expect(handler).not.toHaveBeenCalled();
    });

    it('应该清空iframe引用', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      messageBridge.initialize(mockIframe);
      messageBridge.destroy();

      messageBridge.sendToIframe({ type: 'FLOATING_PANEL_CLOSE' });

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('应该重置ready状态', async () => {
      messageBridge.initialize(mockIframe);

      // Set ready state
      const envelope: FloatingPanelMessageEnvelope = {
        source: 'ssp-iframe',
        message: { type: 'FLOATING_PANEL_READY' },
        timestamp: Date.now()
      };

      window.dispatchEvent(new MessageEvent('message', {
        data: envelope,
        origin: 'chrome-extension://test-extension-id'
      }));

      messageBridge.destroy();

      // Re-initialize
      messageBridge.initialize(mockIframe);

      // waitForReady should wait again since ready state was reset
      jest.useFakeTimers();
      const readyPromise = messageBridge.waitForReady(100);
      jest.advanceTimersByTime(150);

      const result = await readyPromise;
      expect(result).toBe(false);

      jest.useRealTimers();
    });
  });
});
