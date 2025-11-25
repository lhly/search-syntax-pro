import { FloatingPanelManager } from './FloatingPanelManager';
import * as searchEngineSelectors from '@/config/search-engine-selectors';

// Mock Chrome API
const mockChrome = {
  runtime: {
    getURL: jest.fn((path: string) => `chrome-extension://test-id/${path}`)
  },
  storage: {
    local: {
      get: jest.fn((_keys: string | string[]) => {
        return Promise.resolve({
          user_settings: {
            language: 'zh-CN'
          }
        });
      })
    }
  }
};

Object.defineProperty(global, 'chrome', {
  value: mockChrome,
  writable: true
});

// Mock window.location
const mockLocation = {
  hostname: 'www.baidu.com',
  pathname: '/'
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
  configurable: true
});

describe('FloatingPanelManager', () => {
  let manager: FloatingPanelManager;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="form">
        <input id="kw" type="text" />
      </div>
    `;

    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    manager?.destroy();
    jest.useRealTimers();
  });

  describe('initialize', () => {
    it('应该在支持的搜索引擎上成功初始化', async () => {
      manager = new FloatingPanelManager();

      const initPromise = manager.initialize();
      jest.advanceTimersByTime(100);
      await initPromise;

      const triggerIcon = document.getElementById('ssp-trigger-icon');
      expect(triggerIcon).toBeTruthy();
    });

    it('应该注入CSS样式', async () => {
      manager = new FloatingPanelManager();

      const initPromise = manager.initialize();
      jest.advanceTimersByTime(100);
      await initPromise;

      const styleElement = document.getElementById('ssp-trigger-styles');
      expect(styleElement).toBeTruthy();
      expect(styleElement?.textContent).toContain('.ssp-trigger-icon-container');
    });

    it('应该在不支持的搜索引擎上静默失败', async () => {
      const configSpy = jest.spyOn(searchEngineSelectors, 'getCurrentEngineConfig').mockReturnValue(null);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      manager = new FloatingPanelManager();
      await manager.initialize();

      expect(consoleSpy).toHaveBeenCalledWith('[SSP] No config for current search engine');

      consoleSpy.mockRestore();
      configSpy.mockRestore();
    });

    it('应该从chrome.storage读取语言设置', async () => {
      manager = new FloatingPanelManager();

      const initPromise = manager.initialize();
      jest.advanceTimersByTime(100);
      await initPromise;

      expect(mockChrome.storage.local.get).toHaveBeenCalledWith('user_settings');
    });

    it('搜索输入未找到时应该重试', async () => {
      // Remove search input initially
      document.body.innerHTML = '<div id="form"></div>';

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      manager = new FloatingPanelManager();
      const initPromise = manager.initialize();

      // First attempt fails
      jest.advanceTimersByTime(100);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Search input not found, retrying')
      );

      // Add search input after delay
      const form = document.getElementById('form');
      const input = document.createElement('input');
      input.id = 'kw';
      form?.appendChild(input);

      // Trigger retry
      jest.advanceTimersByTime(500);

      await initPromise;

      consoleSpy.mockRestore();
    });

    it('超过最大重试次数后应该停止', async () => {
      document.body.innerHTML = '<div id="form"></div>'; // No search input

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      manager = new FloatingPanelManager();
      const initPromise = manager.initialize();

      // Attempt 1
      jest.advanceTimersByTime(600);
      // Attempt 2
      jest.advanceTimersByTime(600);
      // Attempt 3
      jest.advanceTimersByTime(600);
      // Final failure
      jest.advanceTimersByTime(600);

      await initPromise;

      expect(consoleSpy).toHaveBeenCalledWith(
        '[SSP] Failed to find search input after retries'
      );

      consoleSpy.mockRestore();
    });

    it('已存在触发图标时不应该重复注入', async () => {
      // First initialization
      manager = new FloatingPanelManager();
      const initPromise1 = manager.initialize();
      jest.advanceTimersByTime(100);
      await initPromise1;

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Second initialization
      const manager2 = new FloatingPanelManager();
      const initPromise2 = manager2.initialize();
      jest.advanceTimersByTime(100);
      await initPromise2;

      expect(consoleSpy).toHaveBeenCalledWith('[SSP] Trigger icon already exists');

      consoleSpy.mockRestore();
      manager2.destroy();
    });
  });

  describe('trigger icon显示/隐藏', () => {
    beforeEach(async () => {
      manager = new FloatingPanelManager();
      const initPromise = manager.initialize();
      jest.advanceTimersByTime(100);
      await initPromise;
    });

    it('搜索框获得焦点时应该显示图标', () => {
      const searchInput = document.getElementById('kw') as HTMLInputElement;
      searchInput.dispatchEvent(new Event('focus'));

      jest.advanceTimersByTime(100);

      const icon = document.getElementById('ssp-trigger-icon');
      expect(icon?.classList.contains('ssp-trigger-visible')).toBe(true);
    });

    it('搜索框失去焦点时应该隐藏图标', () => {
      const searchInput = document.getElementById('kw') as HTMLInputElement;

      // Show icon
      searchInput.dispatchEvent(new Event('focus'));
      jest.advanceTimersByTime(100);

      // Blur
      searchInput.dispatchEvent(new Event('blur'));
      jest.advanceTimersByTime(300);

      const icon = document.getElementById('ssp-trigger-icon');
      expect(icon?.classList.contains('ssp-trigger-visible')).toBe(false);
    });

    it('鼠标悬停在搜索容器时应该显示图标', () => {
      const searchContainer = document.getElementById('form') as HTMLElement;
      searchContainer.dispatchEvent(new MouseEvent('mouseenter'));

      jest.advanceTimersByTime(100);

      const icon = document.getElementById('ssp-trigger-icon');
      expect(icon?.classList.contains('ssp-trigger-visible')).toBe(true);
    });

    it('鼠标离开搜索容器时应该隐藏图标', () => {
      const searchContainer = document.getElementById('form') as HTMLElement;

      // Show icon
      searchContainer.dispatchEvent(new MouseEvent('mouseenter'));
      jest.advanceTimersByTime(100);

      // Leave
      searchContainer.dispatchEvent(new MouseEvent('mouseleave'));
      jest.advanceTimersByTime(100);

      const icon = document.getElementById('ssp-trigger-icon');
      expect(icon?.classList.contains('ssp-trigger-visible')).toBe(false);
    });

    it('面板打开时不应该隐藏图标', () => {
      const searchInput = document.getElementById('kw') as HTMLInputElement;

      // Show icon
      searchInput.dispatchEvent(new Event('focus'));
      jest.advanceTimersByTime(100);

      // Open panel (this would set isPanelOpen = true internally)
      const iconButton = document.querySelector('.ssp-trigger-button') as HTMLButtonElement;
      iconButton?.click();

      // Try to blur
      searchInput.dispatchEvent(new Event('blur'));
      jest.advanceTimersByTime(300);

      // Icon should remain visible because panel is open
      const icon = document.getElementById('ssp-trigger-icon');
      expect(icon?.style.display).not.toBe('none');
    });
  });

  describe('面板打开/关闭', () => {
    beforeEach(async () => {
      manager = new FloatingPanelManager();
      const initPromise = manager.initialize();
      jest.advanceTimersByTime(100);
      await initPromise;
    });

    it('点击触发图标应该打开面板', async () => {
      const iconButton = document.querySelector('.ssp-trigger-button') as HTMLButtonElement;

      iconButton.click();
      jest.advanceTimersByTime(100);

      const modal = document.getElementById('ssp-modal-root');
      expect(modal).toBeTruthy();
    });

    it('应该创建iframe并加载popup', async () => {
      const iconButton = document.querySelector('.ssp-trigger-button') as HTMLButtonElement;

      iconButton.click();
      jest.advanceTimersByTime(100);

      const modal = document.getElementById('ssp-modal-root');
      const iframe = modal?.shadowRoot?.querySelector('iframe');

      expect(iframe).toBeTruthy();
      expect(iframe?.src).toContain('src/popup/index.html');
    });

    it('重复点击不应该创建多个面板', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const iconButton = document.querySelector('.ssp-trigger-button') as HTMLButtonElement;

      iconButton.click();
      jest.advanceTimersByTime(100);

      iconButton.click();
      jest.advanceTimersByTime(100);

      expect(consoleSpy).toHaveBeenCalledWith('[SSP] Panel already open or opening');

      const modals = document.querySelectorAll('#ssp-modal-root');
      expect(modals.length).toBeLessThanOrEqual(1);

      consoleSpy.mockRestore();
    });

    it('按ESC键应该关闭面板', async () => {
      const iconButton = document.querySelector('.ssp-trigger-button') as HTMLButtonElement;

      iconButton.click();
      jest.advanceTimersByTime(100);

      // Press ESC
      const escEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escEvent);

      jest.advanceTimersByTime(400);

      const modal = document.getElementById('ssp-modal-root');
      expect(modal).toBeNull();
    });
  });

  describe('DOM变化监听', () => {
    beforeEach(async () => {
      manager = new FloatingPanelManager();
      const initPromise = manager.initialize();
      jest.advanceTimersByTime(100);
      await initPromise;
    });

    it('触发图标被移除后应该重新注入', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Remove trigger icon
      const icon = document.getElementById('ssp-trigger-icon');
      icon?.remove();

      // Wait for MutationObserver + debounce + retry delay
      jest.advanceTimersByTime(1100);

      expect(consoleSpy).toHaveBeenCalledWith('[SSP] DOM changed, re-injecting icon');

      // Icon should be re-injected
      const newIcon = document.getElementById('ssp-trigger-icon');
      expect(newIcon).toBeTruthy();

      consoleSpy.mockRestore();
    });

    it('面板打开时不应该重新注入图标', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Open panel
      const iconButton = document.querySelector('.ssp-trigger-button') as HTMLButtonElement;
      iconButton.click();
      jest.advanceTimersByTime(100);

      // Remove icon while panel is open
      const icon = document.getElementById('ssp-trigger-icon');
      icon?.remove();

      // Wait for observer
      jest.advanceTimersByTime(1100);

      // Should NOT re-inject while panel is open
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('re-injecting icon')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('destroy', () => {
    beforeEach(async () => {
      manager = new FloatingPanelManager();
      const initPromise = manager.initialize();
      jest.advanceTimersByTime(100);
      await initPromise;
    });

    it('应该移除所有DOM元素', () => {
      manager.destroy();

      expect(document.getElementById('ssp-trigger-icon')).toBeNull();
      expect(document.getElementById('ssp-modal-root')).toBeNull();
    });

    it('应该断开MutationObserver', () => {
      manager.destroy();

      // Remove icon after destroy
      const icon = document.getElementById('ssp-trigger-icon');
      icon?.remove();

      // Wait for potential observer callback
      jest.advanceTimersByTime(1100);

      // Icon should NOT be re-injected
      const newIcon = document.getElementById('ssp-trigger-icon');
      expect(newIcon).toBeNull();
    });

    it('应该清理事件监听器', () => {
      const searchInput = document.getElementById('kw') as HTMLInputElement;

      manager.destroy();

      // Try to trigger events
      searchInput.dispatchEvent(new Event('focus'));
      jest.advanceTimersByTime(100);

      // Icon should not react since manager is destroyed
      const icon = document.getElementById('ssp-trigger-icon');
      expect(icon).toBeNull();
    });
  });

  describe('搜索框填充', () => {
    beforeEach(async () => {
      manager = new FloatingPanelManager();
      const initPromise = manager.initialize();
      jest.advanceTimersByTime(100);
      await initPromise;
    });

    it('应该填充搜索输入框', async () => {
      // Simulate receiving message to fill search
      const searchInput = document.getElementById('kw') as HTMLInputElement;

      // Open panel
      const iconButton = document.querySelector('.ssp-trigger-button') as HTMLButtonElement;
      iconButton.click();
      jest.advanceTimersByTime(100);

      // Simulate iframe sending apply syntax message
      const envelope = {
        source: 'ssp-iframe',
        message: {
          type: 'FLOATING_PANEL_APPLY_SYNTAX',
          payload: {
            query: 'test site:example.com',
            autoSearch: false
          }
        },
        timestamp: Date.now()
      };

      window.dispatchEvent(new MessageEvent('message', {
        data: envelope,
        origin: 'chrome-extension://test-id'
      }));

      jest.advanceTimersByTime(100);

      expect(searchInput.value).toBe('test site:example.com');
    });

    it('应该触发input和change事件', async () => {
      const searchInput = document.getElementById('kw') as HTMLInputElement;
      const inputListener = jest.fn();
      const changeListener = jest.fn();

      searchInput.addEventListener('input', inputListener);
      searchInput.addEventListener('change', changeListener);

      // Open panel and send message
      const iconButton = document.querySelector('.ssp-trigger-button') as HTMLButtonElement;
      iconButton.click();
      jest.advanceTimersByTime(100);

      const envelope = {
        source: 'ssp-iframe',
        message: {
          type: 'FLOATING_PANEL_APPLY_SYNTAX',
          payload: {
            query: 'test',
            autoSearch: false
          }
        },
        timestamp: Date.now()
      };

      window.dispatchEvent(new MessageEvent('message', {
        data: envelope,
        origin: 'chrome-extension://test-id'
      }));

      jest.advanceTimersByTime(100);

      expect(inputListener).toHaveBeenCalled();
      expect(changeListener).toHaveBeenCalled();
    });

    it('应该设置焦点到搜索框', async () => {
      const searchInput = document.getElementById('kw') as HTMLInputElement;
      const focusSpy = jest.spyOn(searchInput, 'focus');

      // Open panel and send message
      const iconButton = document.querySelector('.ssp-trigger-button') as HTMLButtonElement;
      iconButton.click();
      jest.advanceTimersByTime(100);

      const envelope = {
        source: 'ssp-iframe',
        message: {
          type: 'FLOATING_PANEL_APPLY_SYNTAX',
          payload: {
            query: 'test',
            autoSearch: false
          }
        },
        timestamp: Date.now()
      };

      window.dispatchEvent(new MessageEvent('message', {
        data: envelope,
        origin: 'chrome-extension://test-id'
      }));

      jest.advanceTimersByTime(100);

      expect(focusSpy).toHaveBeenCalled();
    });
  });

  describe('自动搜索', () => {
    beforeEach(async () => {
      // Add form element
      const form = document.getElementById('form') as HTMLFormElement;
      form.addEventListener('submit', (e) => e.preventDefault());

      manager = new FloatingPanelManager();
      const initPromise = manager.initialize();
      jest.advanceTimersByTime(100);
      await initPromise;
    });

    it('autoSearch为true时应该提交表单', async () => {
      const form = document.getElementById('form') as HTMLFormElement;
      const submitSpy = jest.spyOn(form, 'submit').mockImplementation();

      // Open panel and send message with autoSearch
      const iconButton = document.querySelector('.ssp-trigger-button') as HTMLButtonElement;
      iconButton.click();
      jest.advanceTimersByTime(100);

      const envelope = {
        source: 'ssp-iframe',
        message: {
          type: 'FLOATING_PANEL_APPLY_SYNTAX',
          payload: {
            query: 'test',
            autoSearch: true
          }
        },
        timestamp: Date.now()
      };

      window.dispatchEvent(new MessageEvent('message', {
        data: envelope,
        origin: 'chrome-extension://test-id'
      }));

      jest.advanceTimersByTime(200);

      expect(submitSpy).toHaveBeenCalled();

      submitSpy.mockRestore();
    });

    it('autoSearch为false时不应该提交表单', async () => {
      const form = document.getElementById('form') as HTMLFormElement;
      const submitSpy = jest.spyOn(form, 'submit').mockImplementation();

      // Open panel and send message
      const iconButton = document.querySelector('.ssp-trigger-button') as HTMLButtonElement;
      iconButton.click();
      jest.advanceTimersByTime(100);

      const envelope = {
        source: 'ssp-iframe',
        message: {
          type: 'FLOATING_PANEL_APPLY_SYNTAX',
          payload: {
            query: 'test',
            autoSearch: false
          }
        },
        timestamp: Date.now()
      };

      window.dispatchEvent(new MessageEvent('message', {
        data: envelope,
        origin: 'chrome-extension://test-id'
      }));

      jest.advanceTimersByTime(200);

      expect(submitSpy).not.toHaveBeenCalled();

      submitSpy.mockRestore();
    });
  });
});
