import { test, expect, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';

/**
 * E2E Tests for Floating Panel Feature
 *
 * Note: These tests require the extension to be built first.
 * Run `npm run build` before running E2E tests.
 */

let context: BrowserContext;

test.describe('Floating Panel E2E Tests', () => {
  test.beforeAll(async () => {
    // Load extension
    const extensionPath = path.join(__dirname, '../../dist');

    context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox'
      ]
    });
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test.describe('Baidu搜索引擎', () => {
    test('应该在百度首页显示触发图标', async () => {
      const page = await context.newPage();

      await page.goto('https://www.baidu.com', {
        waitUntil: 'domcontentloaded'
      });

      // Wait for content script to inject
      await page.waitForTimeout(2000);

      // Focus on search input
      await page.click('input#kw');

      // Wait for trigger icon to appear
      await page.waitForSelector('#ssp-trigger-icon', {
        state: 'visible',
        timeout: 5000
      });

      const triggerIcon = await page.locator('#ssp-trigger-icon');
      await expect(triggerIcon).toBeVisible();

      await page.close();
    });

    test('应该显示正确的按钮文本', async () => {
      const page = await context.newPage();

      await page.goto('https://www.baidu.com');
      await page.waitForTimeout(2000);

      await page.click('input#kw');
      await page.waitForSelector('#ssp-trigger-icon', { state: 'visible' });

      const buttonText = await page.locator('.ssp-trigger-button').textContent();

      // Should contain either Chinese or English text
      expect(buttonText).toMatch(/高级语法|Advanced/);

      await page.close();
    });

    test('鼠标悬停在搜索框区域应该显示图标', async () => {
      const page = await context.newPage();

      await page.goto('https://www.baidu.com');
      await page.waitForTimeout(2000);

      // Hover over search container
      await page.hover('#form');

      // Wait for icon to appear
      await page.waitForSelector('#ssp-trigger-icon.ssp-trigger-visible', {
        timeout: 3000
      });

      const triggerIcon = await page.locator('#ssp-trigger-icon');
      await expect(triggerIcon).toHaveClass(/ssp-trigger-visible/);

      await page.close();
    });

    test('点击触发图标应该打开模态面板', async () => {
      const page = await context.newPage();

      await page.goto('https://www.baidu.com');
      await page.waitForTimeout(2000);

      // Show and click trigger icon
      await page.click('input#kw');
      await page.waitForSelector('#ssp-trigger-icon', { state: 'visible' });

      await page.click('.ssp-trigger-button');

      // Wait for modal to appear
      await page.waitForSelector('#ssp-modal-root', {
        timeout: 5000
      });

      const modal = await page.locator('#ssp-modal-root');
      await expect(modal).toBeVisible();

      await page.close();
    });

    test('模态面板应该包含iframe', async () => {
      const page = await context.newPage();

      await page.goto('https://www.baidu.com');
      await page.waitForTimeout(2000);

      await page.click('input#kw');
      await page.waitForSelector('#ssp-trigger-icon', { state: 'visible' });
      await page.click('.ssp-trigger-button');

      await page.waitForSelector('#ssp-modal-root');

      // Check iframe exists in shadow DOM
      const hasIframe = await page.evaluate(() => {
        const modal = document.querySelector('#ssp-modal-root');
        const shadowRoot = modal?.shadowRoot;
        const iframe = shadowRoot?.querySelector('iframe.ssp-modal-iframe');
        return !!iframe;
      });

      expect(hasIframe).toBe(true);

      await page.close();
    });

    test('iframe应该加载popup界面', async () => {
      const page = await context.newPage();

      await page.goto('https://www.baidu.com');
      await page.waitForTimeout(2000);

      await page.click('input#kw');
      await page.waitForSelector('#ssp-trigger-icon', { state: 'visible' });
      await page.click('.ssp-trigger-button');

      await page.waitForSelector('#ssp-modal-root');

      // Wait for iframe to load
      await page.waitForTimeout(1000);

      // Check if iframe loaded popup content
      const hasPopupContent = await page.evaluate(() => {
        const modal = document.querySelector('#ssp-modal-root');
        const shadowRoot = modal?.shadowRoot;
        const iframe = shadowRoot?.querySelector('iframe.ssp-modal-iframe') as HTMLIFrameElement;

        if (!iframe || !iframe.contentDocument) return false;

        // Check for popup elements
        const hasSearchForm = !!iframe.contentDocument.querySelector('form');
        return hasSearchForm;
      });

      expect(hasPopupContent).toBe(true);

      await page.close();
    });

    test('点击遮罩层背景应该关闭面板', async () => {
      const page = await context.newPage();

      await page.goto('https://www.baidu.com');
      await page.waitForTimeout(2000);

      await page.click('input#kw');
      await page.waitForSelector('#ssp-trigger-icon', { state: 'visible' });
      await page.click('.ssp-trigger-button');

      await page.waitForSelector('#ssp-modal-root');

      // Click overlay background (use evaluate to access shadow DOM)
      await page.evaluate(() => {
        const modal = document.querySelector('#ssp-modal-root');
        const shadowRoot = modal?.shadowRoot;
        const overlay = shadowRoot?.querySelector('.ssp-modal-overlay') as HTMLElement;
        overlay?.click();
      });

      // Wait for close animation
      await page.waitForTimeout(500);

      // Modal should be removed
      const modalExists = await page.locator('#ssp-modal-root').count();
      expect(modalExists).toBe(0);

      await page.close();
    });

    test('按ESC键应该关闭面板', async () => {
      const page = await context.newPage();

      await page.goto('https://www.baidu.com');
      await page.waitForTimeout(2000);

      await page.click('input#kw');
      await page.waitForSelector('#ssp-trigger-icon', { state: 'visible' });
      await page.click('.ssp-trigger-button');

      await page.waitForSelector('#ssp-modal-root');

      // Press ESC key
      await page.keyboard.press('Escape');

      // Wait for close animation
      await page.waitForTimeout(500);

      // Modal should be removed
      const modalExists = await page.locator('#ssp-modal-root').count();
      expect(modalExists).toBe(0);

      await page.close();
    });

    test('应该填充搜索语法到搜索框', async () => {
      const page = await context.newPage();

      await page.goto('https://www.baidu.com');
      await page.waitForTimeout(2000);

      await page.click('input#kw');
      await page.waitForSelector('#ssp-trigger-icon', { state: 'visible' });
      await page.click('.ssp-trigger-button');

      await page.waitForSelector('#ssp-modal-root');
      await page.waitForTimeout(1500); // Wait for iframe to fully load

      // Interact with iframe to build search syntax
      await page.evaluate(() => {
        const modal = document.querySelector('#ssp-modal-root');
        const shadowRoot = modal?.shadowRoot;
        const iframe = shadowRoot?.querySelector('iframe.ssp-modal-iframe') as HTMLIFrameElement;

        if (!iframe || !iframe.contentWindow) return;

        // Send test message from iframe to content script
        const envelope = {
          source: 'ssp-iframe',
          message: {
            type: 'FLOATING_PANEL_APPLY_SYNTAX',
            payload: {
              query: 'test site:example.com filetype:pdf',
              autoSearch: false
            }
          },
          timestamp: Date.now()
        };

        window.postMessage(envelope, '*');
      });

      // Wait for message handling
      await page.waitForTimeout(500);

      // Check if search input was filled
      const searchInputValue = await page.inputValue('input#kw');
      expect(searchInputValue).toContain('site:example.com');

      await page.close();
    });
  });

  test.describe('Google搜索引擎', () => {
    test('应该在谷歌首页显示触发图标', async () => {
      const page = await context.newPage();

      await page.goto('https://www.google.com', {
        waitUntil: 'domcontentloaded'
      });

      await page.waitForTimeout(2000);

      // Try to click search input (Google has multiple q inputs)
      const searchInput = await page.locator('input[name="q"]').first();
      await searchInput.click();

      // Wait for trigger icon
      await page.waitForSelector('#ssp-trigger-icon', {
        state: 'visible',
        timeout: 5000
      });

      const triggerIcon = await page.locator('#ssp-trigger-icon');
      await expect(triggerIcon).toBeVisible();

      await page.close();
    });

    test('点击触发图标应该打开面板', async () => {
      const page = await context.newPage();

      await page.goto('https://www.google.com');
      await page.waitForTimeout(2000);

      const searchInput = await page.locator('input[name="q"]').first();
      await searchInput.click();

      await page.waitForSelector('#ssp-trigger-icon', { state: 'visible' });
      await page.click('.ssp-trigger-button');

      await page.waitForSelector('#ssp-modal-root', {
        timeout: 5000
      });

      const modal = await page.locator('#ssp-modal-root');
      await expect(modal).toBeVisible();

      await page.close();
    });
  });

  test.describe('Bing搜索引擎', () => {
    test('应该在必应首页显示触发图标', async () => {
      const page = await context.newPage();

      await page.goto('https://www.bing.com', {
        waitUntil: 'domcontentloaded'
      });

      await page.waitForTimeout(2000);

      await page.click('input#sb_form_q');

      await page.waitForSelector('#ssp-trigger-icon', {
        state: 'visible',
        timeout: 5000
      });

      const triggerIcon = await page.locator('#ssp-trigger-icon');
      await expect(triggerIcon).toBeVisible();

      await page.close();
    });

    test('点击触发图标应该打开面板', async () => {
      const page = await context.newPage();

      await page.goto('https://www.bing.com');
      await page.waitForTimeout(2000);

      await page.click('input#sb_form_q');
      await page.waitForSelector('#ssp-trigger-icon', { state: 'visible' });
      await page.click('.ssp-trigger-button');

      await page.waitForSelector('#ssp-modal-root', {
        timeout: 5000
      });

      const modal = await page.locator('#ssp-modal-root');
      await expect(modal).toBeVisible();

      await page.close();
    });
  });

  test.describe('多标签页独立性', () => {
    test('不同标签页的面板状态应该独立', async () => {
      const page1 = await context.newPage();
      const page2 = await context.newPage();

      // Open panel in page1
      await page1.goto('https://www.baidu.com');
      await page1.waitForTimeout(2000);
      await page1.click('input#kw');
      await page1.waitForSelector('#ssp-trigger-icon', { state: 'visible' });
      await page1.click('.ssp-trigger-button');
      await page1.waitForSelector('#ssp-modal-root');

      // Check page2 has no panel
      await page2.goto('https://www.baidu.com');
      await page2.waitForTimeout(2000);

      const page2ModalCount = await page2.locator('#ssp-modal-root').count();
      expect(page2ModalCount).toBe(0);

      // Page1 should still have panel
      const page1ModalCount = await page1.locator('#ssp-modal-root').count();
      expect(page1ModalCount).toBe(1);

      await page1.close();
      await page2.close();
    });
  });

  test.describe('响应式布局', () => {
    test('小屏幕应该调整面板尺寸', async () => {
      const page = await context.newPage();
      await page.setViewportSize({ width: 500, height: 600 });

      await page.goto('https://www.baidu.com');
      await page.waitForTimeout(2000);

      await page.click('input#kw');
      await page.waitForSelector('#ssp-trigger-icon', { state: 'visible' });
      await page.click('.ssp-trigger-button');

      await page.waitForSelector('#ssp-modal-root');

      // Check panel size in shadow DOM
      const panelSize = await page.evaluate(() => {
        const modal = document.querySelector('#ssp-modal-root');
        const shadowRoot = modal?.shadowRoot;
        const panel = shadowRoot?.querySelector('.ssp-modal-panel') as HTMLElement;

        return {
          width: panel?.offsetWidth,
          height: panel?.offsetHeight
        };
      });

      // Panel should be smaller than 800x600 on small screen
      expect(panelSize.width).toBeLessThan(800);

      await page.close();
    });
  });

  test.describe('动画效果', () => {
    test('触发图标应该有淡入动画', async () => {
      const page = await context.newPage();

      await page.goto('https://www.baidu.com');
      await page.waitForTimeout(2000);

      // Icon should be initially hidden
      const initialDisplay = await page.evaluate(() => {
        const icon = document.querySelector('#ssp-trigger-icon') as HTMLElement;
        return icon?.style.display;
      });

      expect(initialDisplay).toBe('none');

      // Focus to show icon
      await page.click('input#kw');
      await page.waitForTimeout(300);

      // Icon should have visible class
      const hasVisibleClass = await page.evaluate(() => {
        const icon = document.querySelector('#ssp-trigger-icon');
        return icon?.classList.contains('ssp-trigger-visible');
      });

      expect(hasVisibleClass).toBe(true);

      await page.close();
    });

    test('模态面板应该有缩放动画', async () => {
      const page = await context.newPage();

      await page.goto('https://www.baidu.com');
      await page.waitForTimeout(2000);

      await page.click('input#kw');
      await page.waitForSelector('#ssp-trigger-icon', { state: 'visible' });
      await page.click('.ssp-trigger-button');

      await page.waitForSelector('#ssp-modal-root');

      // Check for visible class which triggers animation
      const hasAnimation = await page.evaluate(() => {
        const modal = document.querySelector('#ssp-modal-root');
        const shadowRoot = modal?.shadowRoot;
        const overlay = shadowRoot?.querySelector('.ssp-modal-overlay');
        return overlay?.classList.contains('ssp-modal-visible');
      });

      expect(hasAnimation).toBe(true);

      await page.close();
    });
  });

  test.describe('错误处理', () => {
    test('不支持的搜索引擎不应该显示触发图标', async () => {
      const page = await context.newPage();

      await page.goto('https://duckduckgo.com');
      await page.waitForTimeout(2000);

      const iconCount = await page.locator('#ssp-trigger-icon').count();
      expect(iconCount).toBe(0);

      await page.close();
    });

    test('快速连续点击不应该创建多个面板', async () => {
      const page = await context.newPage();

      await page.goto('https://www.baidu.com');
      await page.waitForTimeout(2000);

      await page.click('input#kw');
      await page.waitForSelector('#ssp-trigger-icon', { state: 'visible' });

      // Click rapidly 5 times
      for (let i = 0; i < 5; i++) {
        await page.click('.ssp-trigger-button', { force: true });
      }

      await page.waitForTimeout(1000);

      // Should only have one modal
      const modalCount = await page.locator('#ssp-modal-root').count();
      expect(modalCount).toBeLessThanOrEqual(1);

      await page.close();
    });
  });
});
