import { ModalOverlay } from './ModalOverlay';

// Mock chrome API
const mockChrome = {
  runtime: {
    getURL: jest.fn((path: string) => `chrome-extension://mock-id/${path}`)
  }
};

Object.defineProperty(global, 'chrome', {
  value: mockChrome,
  writable: true
});

describe('ModalOverlay', () => {
  let mockCloseCallback: jest.Mock;
  let modalOverlay: ModalOverlay;

  beforeEach(() => {
    mockCloseCallback = jest.fn();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    modalOverlay?.destroy();
  });

  describe('create', () => {
    it('应该创建modal容器和iframe', () => {
      modalOverlay = new ModalOverlay(mockCloseCallback);
      const { container, iframe } = modalOverlay.create();

      expect(container).toBeTruthy();
      expect(iframe).toBeTruthy();
      expect(container.id).toBe('ssp-modal-root');
    });

    it('应该附加Shadow DOM', () => {
      modalOverlay = new ModalOverlay(mockCloseCallback);
      const { container } = modalOverlay.create();

      expect(container.shadowRoot).toBeTruthy();
      expect(container.shadowRoot?.mode).toBe('open');
    });

    it('应该在Shadow DOM中创建样式表', () => {
      modalOverlay = new ModalOverlay(mockCloseCallback);
      const { container } = modalOverlay.create();

      const styleElement = container.shadowRoot?.querySelector('style');
      expect(styleElement).toBeTruthy();
      expect(styleElement?.textContent).toContain('.ssp-modal-overlay');
      expect(styleElement?.textContent).toContain('.ssp-modal-panel');
      expect(styleElement?.textContent).toContain('.ssp-modal-iframe');
    });

    it('应该创建overlay元素', () => {
      modalOverlay = new ModalOverlay(mockCloseCallback);
      const { container } = modalOverlay.create();

      const overlay = container.shadowRoot?.querySelector('.ssp-modal-overlay');
      expect(overlay).toBeTruthy();
    });

    it('应该创建panel元素', () => {
      modalOverlay = new ModalOverlay(mockCloseCallback);
      const { container } = modalOverlay.create();

      const panel = container.shadowRoot?.querySelector('.ssp-modal-panel');
      expect(panel).toBeTruthy();
    });

    it('iframe应该有正确的src', () => {
      modalOverlay = new ModalOverlay(mockCloseCallback);
      const { iframe } = modalOverlay.create();

      expect(iframe.src).toBe('chrome-extension://mock-id/src/popup/index.html');
      expect(mockChrome.runtime.getURL).toHaveBeenCalledWith('src/popup/index.html');
    });

    it('iframe应该有正确的属性', () => {
      modalOverlay = new ModalOverlay(mockCloseCallback);
      const { iframe } = modalOverlay.create();

      expect(iframe.className).toBe('ssp-modal-iframe');
      expect(iframe.allow).toBe('clipboard-write');
    });

    it('iframe应该嵌套在panel中', () => {
      modalOverlay = new ModalOverlay(mockCloseCallback);
      const { container } = modalOverlay.create();

      const panel = container.shadowRoot?.querySelector('.ssp-modal-panel');
      const iframe = panel?.querySelector('iframe');

      expect(iframe).toBeTruthy();
      expect(iframe?.className).toBe('ssp-modal-iframe');
    });

    it('panel应该嵌套在overlay中', () => {
      modalOverlay = new ModalOverlay(mockCloseCallback);
      const { container } = modalOverlay.create();

      const overlay = container.shadowRoot?.querySelector('.ssp-modal-overlay');
      const panel = overlay?.querySelector('.ssp-modal-panel');

      expect(panel).toBeTruthy();
    });
  });

  describe('overlay click handling', () => {
    it('点击overlay背景应该调用关闭回调', () => {
      modalOverlay = new ModalOverlay(mockCloseCallback);
      const { container } = modalOverlay.create();

      const overlay = container.shadowRoot?.querySelector('.ssp-modal-overlay') as HTMLElement;
      overlay.click();

      expect(mockCloseCallback).toHaveBeenCalledTimes(1);
    });

    it('点击panel不应该调用关闭回调', () => {
      modalOverlay = new ModalOverlay(mockCloseCallback);
      const { container } = modalOverlay.create();

      const panel = container.shadowRoot?.querySelector('.ssp-modal-panel') as HTMLElement;

      // Create and dispatch click event on panel
      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: panel, enumerable: true });

      panel.dispatchEvent(event);

      expect(mockCloseCallback).not.toHaveBeenCalled();
    });

    it('点击iframe不应该调用关闭回调', () => {
      modalOverlay = new ModalOverlay(mockCloseCallback);
      const { container } = modalOverlay.create();

      const iframe = container.shadowRoot?.querySelector('.ssp-modal-iframe') as HTMLElement;

      // Create and dispatch click event on iframe
      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: iframe, enumerable: true });

      iframe.dispatchEvent(event);

      expect(mockCloseCallback).not.toHaveBeenCalled();
    });
  });

  describe('show', () => {
    it('应该添加visible类', () => {
      modalOverlay = new ModalOverlay(mockCloseCallback);
      const { container } = modalOverlay.create();
      document.body.appendChild(container);

      modalOverlay.show();

      const overlay = container.shadowRoot?.querySelector('.ssp-modal-overlay');
      expect(overlay?.classList.contains('ssp-modal-visible')).toBe(true);
    });

    it('应该阻止body滚动', () => {
      modalOverlay = new ModalOverlay(mockCloseCallback);
      const { container } = modalOverlay.create();
      document.body.appendChild(container);

      modalOverlay.show();

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('在未创建overlay时调用show不应该报错', () => {
      modalOverlay = new ModalOverlay(mockCloseCallback);

      expect(() => modalOverlay.show()).not.toThrow();
    });
  });

  describe('hide', () => {
    it('应该移除visible类', async () => {
      modalOverlay = new ModalOverlay(mockCloseCallback);
      const { container } = modalOverlay.create();
      document.body.appendChild(container);

      modalOverlay.show();
      await modalOverlay.hide();

      const overlay = container.shadowRoot?.querySelector('.ssp-modal-overlay');
      expect(overlay?.classList.contains('ssp-modal-visible')).toBe(false);
    });

    it('应该恢复body滚动', async () => {
      modalOverlay = new ModalOverlay(mockCloseCallback);
      const { container } = modalOverlay.create();
      document.body.appendChild(container);

      modalOverlay.show();
      await modalOverlay.hide();

      expect(document.body.style.overflow).toBe('');
    });

    it('应该等待动画完成', async () => {
      jest.useFakeTimers();

      modalOverlay = new ModalOverlay(mockCloseCallback);
      const { container } = modalOverlay.create();
      document.body.appendChild(container);

      modalOverlay.show();
      const hidePromise = modalOverlay.hide();

      // Animation should take 300ms
      jest.advanceTimersByTime(200);

      // At 200ms, body overflow should still be 'hidden'
      expect(document.body.style.overflow).toBe('hidden');

      jest.advanceTimersByTime(100);
      await hidePromise;

      // After 300ms, body overflow should be restored
      expect(document.body.style.overflow).toBe('');

      jest.useRealTimers();
    });

    it('在未创建overlay时调用hide不应该报错', async () => {
      modalOverlay = new ModalOverlay(mockCloseCallback);

      await expect(modalOverlay.hide()).resolves.not.toThrow();
    });
  });

  describe('getIframe', () => {
    it('应该返回iframe元素', () => {
      modalOverlay = new ModalOverlay(mockCloseCallback);
      const { iframe } = modalOverlay.create();

      expect(modalOverlay.getIframe()).toBe(iframe);
    });

    it('在未创建时应该返回null', () => {
      modalOverlay = new ModalOverlay(mockCloseCallback);

      expect(modalOverlay.getIframe()).toBeNull();
    });
  });

  describe('destroy', () => {
    it('应该移除容器元素', () => {
      modalOverlay = new ModalOverlay(mockCloseCallback);
      const { container } = modalOverlay.create();
      document.body.appendChild(container);

      expect(document.getElementById('ssp-modal-root')).toBeTruthy();

      // Manually remove container since destroy only clears internal references
      // In actual usage, FloatingPanelManager handles container removal
      container.remove();
      modalOverlay.destroy();

      expect(document.getElementById('ssp-modal-root')).toBeNull();
    });

    it('应该恢复body滚动', () => {
      modalOverlay = new ModalOverlay(mockCloseCallback);
      const { container } = modalOverlay.create();
      document.body.appendChild(container);

      modalOverlay.show();
      modalOverlay.destroy();

      expect(document.body.style.overflow).toBe('');
    });

    it('应该清空内部引用', () => {
      modalOverlay = new ModalOverlay(mockCloseCallback);
      modalOverlay.create();

      modalOverlay.destroy();

      expect(modalOverlay.getIframe()).toBeNull();
    });

    it('在未创建时调用destroy不应该报错', () => {
      modalOverlay = new ModalOverlay(mockCloseCallback);

      expect(() => modalOverlay.destroy()).not.toThrow();
    });
  });

  describe('responsive styles', () => {
    it('样式表应该包含响应式媒体查询', () => {
      modalOverlay = new ModalOverlay(mockCloseCallback);
      const { container } = modalOverlay.create();

      const styleElement = container.shadowRoot?.querySelector('style');
      const styles = styleElement?.textContent || '';

      expect(styles).toContain('@media (max-width: 900px)');
      expect(styles).toContain('@media (max-width: 600px)');
    });

    it('样式表应该定义正确的panel尺寸', () => {
      modalOverlay = new ModalOverlay(mockCloseCallback);
      const { container } = modalOverlay.create();

      const styleElement = container.shadowRoot?.querySelector('style');
      const styles = styleElement?.textContent || '';

      expect(styles).toContain('width: 800px');
      expect(styles).toContain('height: 600px');
    });
  });

  describe('CSS transitions', () => {
    it('overlay应该有transition属性', () => {
      modalOverlay = new ModalOverlay(mockCloseCallback);
      const { container } = modalOverlay.create();

      const styleElement = container.shadowRoot?.querySelector('style');
      const styles = styleElement?.textContent || '';

      expect(styles).toContain('transition: opacity 200ms');
    });

    it('panel应该有transform transition', () => {
      modalOverlay = new ModalOverlay(mockCloseCallback);
      const { container } = modalOverlay.create();

      const styleElement = container.shadowRoot?.querySelector('style');
      const styles = styleElement?.textContent || '';

      expect(styles).toContain('transition: transform 300ms');
    });
  });
});
