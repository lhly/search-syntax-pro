import { TriggerIcon } from './TriggerIcon';

// Mock chrome API
(global as any).chrome = {
  runtime: {
    getURL: jest.fn((path: string) => `chrome-extension://test-id/${path}`)
  },
  storage: {
    local: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(undefined)
    }
  }
};

describe('TriggerIcon', () => {
  let mockCallback: jest.Mock;
  let triggerIcon: TriggerIcon;

  beforeEach(() => {
    mockCallback = jest.fn();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    triggerIcon?.destroy();
  });

  describe('create', () => {
    it('应该创建触发图标元素', async () => {
      triggerIcon = new TriggerIcon(mockCallback, 'zh-CN');
      const element = await triggerIcon.create();

      expect(element).toBeTruthy();
      expect(element.id).toBe('ssp-trigger-icon');
      expect(element.className).toBe('ssp-trigger-icon-container');
    });

    it('应该包含按钮元素', async () => {
      triggerIcon = new TriggerIcon(mockCallback, 'zh-CN');
      const element = await triggerIcon.create();

      const button = element.querySelector('button');
      expect(button).toBeTruthy();
      expect(button?.className).toBe('ssp-trigger-button');
    });

    it('应该只包含图标，不包含文字', async () => {
      triggerIcon = new TriggerIcon(mockCallback, 'zh-CN');
      const element = await triggerIcon.create();

      const button = element.querySelector('button');
      const text = element.querySelector('.ssp-trigger-text');

      expect(button).toBeTruthy();
      expect(text).toBeNull(); // 不应该有文字元素
    });

    it('应该包含扩展图标', async () => {
      triggerIcon = new TriggerIcon(mockCallback, 'zh-CN');
      const element = await triggerIcon.create();

      const icon = element.querySelector('.ssp-trigger-icon') as HTMLImageElement;
      expect(icon).toBeTruthy();
      expect(icon.tagName).toBe('IMG');
      expect(icon.src).toContain('chrome-extension://');
    });

    it('应该设置正确的tooltip', async () => {
      triggerIcon = new TriggerIcon(mockCallback, 'zh-CN');
      const element = await triggerIcon.create();

      const button = element.querySelector('button');
      expect(button?.title).toContain('拖动调整位置');
      expect(button?.title).toContain('点击打开高级搜索面板');
    });

    it('点击按钮应该调用回调函数', async () => {
      triggerIcon = new TriggerIcon(mockCallback, 'zh-CN');
      const element = await triggerIcon.create();

      const button = element.querySelector('button') as HTMLButtonElement;
      button.click();

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('点击按钮应该阻止默认行为和事件冒泡', async () => {
      triggerIcon = new TriggerIcon(mockCallback, 'zh-CN');
      const element = await triggerIcon.create();

      const button = element.querySelector('button') as HTMLButtonElement;
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });

      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      const stopPropagationSpy = jest.spyOn(event, 'stopPropagation');

      button.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
    });
  });

  describe('show/hide', () => {
    beforeEach(async () => {
      triggerIcon = new TriggerIcon(mockCallback, 'zh-CN');
      const element = await triggerIcon.create();
      document.body.appendChild(element);
    });

    it('默认应该是可见状态', () => {
      expect(triggerIcon.getIsVisible()).toBe(true);
    });

    it('hide应该隐藏图标', () => {
      triggerIcon.hide();
      expect(triggerIcon.getIsVisible()).toBe(false);

      const element = document.getElementById('ssp-trigger-icon');
      expect(element?.classList.contains('ssp-trigger-visible')).toBe(false);
    });

    it('show应该显示图标', () => {
      triggerIcon.hide();
      expect(triggerIcon.getIsVisible()).toBe(false);

      triggerIcon.show();
      expect(triggerIcon.getIsVisible()).toBe(true);

      const element = document.getElementById('ssp-trigger-icon');
      expect(element?.classList.contains('ssp-trigger-visible')).toBe(true);
    });

    it('重复调用show不应该有副作用', () => {
      triggerIcon.show();
      const element = document.getElementById('ssp-trigger-icon');
      const classList = element?.className;

      triggerIcon.show();

      expect(element?.className).toBe(classList);
      expect(triggerIcon.getIsVisible()).toBe(true);
    });

    it('重复调用hide不应该有副作用', () => {
      triggerIcon.hide();
      triggerIcon.hide();

      expect(triggerIcon.getIsVisible()).toBe(false);
    });
  });

  describe('hover state', () => {
    beforeEach(async () => {
      triggerIcon = new TriggerIcon(mockCallback, 'zh-CN');
      const element = await triggerIcon.create();
      document.body.appendChild(element);
    });

    it('mouseenter应该设置hover状态', () => {
      const element = document.getElementById('ssp-trigger-icon') as HTMLElement;
      element.dispatchEvent(new MouseEvent('mouseenter'));

      expect(triggerIcon.getIsHovered()).toBe(true);
    });

    it('mouseleave应该清除hover状态', () => {
      const element = document.getElementById('ssp-trigger-icon') as HTMLElement;

      element.dispatchEvent(new MouseEvent('mouseenter'));
      expect(triggerIcon.getIsHovered()).toBe(true);

      element.dispatchEvent(new MouseEvent('mouseleave'));
      expect(triggerIcon.getIsHovered()).toBe(false);
    });

    it('初始hover状态应该为false', () => {
      expect(triggerIcon.getIsHovered()).toBe(false);
    });
  });

  describe('destroy', () => {
    it('应该从DOM中移除元素', async () => {
      triggerIcon = new TriggerIcon(mockCallback, 'zh-CN');
      const element = await triggerIcon.create();
      document.body.appendChild(element);

      expect(document.getElementById('ssp-trigger-icon')).toBeTruthy();

      triggerIcon.destroy();

      expect(document.getElementById('ssp-trigger-icon')).toBeNull();
    });

    it('销毁后应该能够重新创建', async () => {
      triggerIcon = new TriggerIcon(mockCallback, 'zh-CN');
      const element1 = await triggerIcon.create();
      document.body.appendChild(element1);

      triggerIcon.destroy();

      const element2 = await triggerIcon.create();
      document.body.appendChild(element2);

      expect(document.getElementById('ssp-trigger-icon')).toBeTruthy();
    });

    it('在未创建元素时调用destroy不应该报错', () => {
      triggerIcon = new TriggerIcon(mockCallback, 'zh-CN');

      expect(() => triggerIcon.destroy()).not.toThrow();
    });
  });

  describe('getIsVisible', () => {
    beforeEach(async () => {
      triggerIcon = new TriggerIcon(mockCallback, 'zh-CN');
      const element = await triggerIcon.create();
      document.body.appendChild(element);
    });

    it('初始状态应该为可见（新行为）', () => {
      expect(triggerIcon.getIsVisible()).toBe(true);
    });

    it('调用hide后应该为不可见', () => {
      triggerIcon.hide();
      expect(triggerIcon.getIsVisible()).toBe(false);
    });

    it('调用show后应该为可见', () => {
      triggerIcon.hide();
      triggerIcon.show();
      expect(triggerIcon.getIsVisible()).toBe(true);
    });
  });
});
