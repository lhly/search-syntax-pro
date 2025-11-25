import {
  SEARCH_ENGINE_CONFIGS,
  detectSearchEngine,
  getCurrentEngineConfig
} from './search-engine-selectors';

describe('Search Engine Selectors Configuration', () => {
  describe('SEARCH_ENGINE_CONFIGS', () => {
    it('应该包含所有支持的搜索引擎配置', () => {
      expect(SEARCH_ENGINE_CONFIGS).toHaveProperty('baidu');
      expect(SEARCH_ENGINE_CONFIGS).toHaveProperty('google');
      expect(SEARCH_ENGINE_CONFIGS).toHaveProperty('bing');
    });

    it('Baidu配置应该包含正确的选择器', () => {
      const config = SEARCH_ENGINE_CONFIGS.baidu;

      expect(config.searchInputSelector).toBe('input#kw');
      expect(config.searchContainerSelector).toBe('#form');
      expect(config.searchFormSelector).toBe('form#form');
      expect(config.iconInsertPosition).toBe('afterend');
      expect(config.iconOffsetY).toBe('8px');
    });

    it('Google配置应该包含正确的选择器', () => {
      const config = SEARCH_ENGINE_CONFIGS.google;

      expect(config.searchInputSelector).toBe('input[name="q"]');
      expect(config.searchContainerSelector).toBe('div.RNNXgb');
      expect(config.searchFormSelector).toBe('form[role="search"]');
      expect(config.iconInsertPosition).toBe('afterend');
      expect(config.iconOffsetY).toBe('8px');
    });

    it('Bing配置应该包含正确的选择器', () => {
      const config = SEARCH_ENGINE_CONFIGS.bing;

      expect(config.searchInputSelector).toBe('input#sb_form_q');
      expect(config.searchContainerSelector).toBe('form#sb_form');
      expect(config.searchFormSelector).toBe('form#sb_form');
      expect(config.iconInsertPosition).toBe('afterend');
      expect(config.iconOffsetY).toBe('8px');
    });

    it('每个配置应该有isResultsPage函数', () => {
      Object.values(SEARCH_ENGINE_CONFIGS).forEach(config => {
        expect(config.isResultsPage).toBeInstanceOf(Function);
      });
    });
  });

  describe('detectSearchEngine', () => {
    it('应该检测百度域名', () => {
      expect(detectSearchEngine('www.baidu.com')).toBe('baidu');
      expect(detectSearchEngine('baidu.com')).toBe('baidu');
      expect(detectSearchEngine('m.baidu.com')).toBe('baidu');
    });

    it('应该检测谷歌域名', () => {
      expect(detectSearchEngine('www.google.com')).toBe('google');
      expect(detectSearchEngine('google.com')).toBe('google');
      // Note: Currently only google.com is supported, not regional domains
      // expect(detectSearchEngine('google.co.jp')).toBe('google');
      // expect(detectSearchEngine('www.google.com.hk')).toBe('google');
    });

    it('应该检测必应域名', () => {
      expect(detectSearchEngine('www.bing.com')).toBe('bing');
      expect(detectSearchEngine('bing.com')).toBe('bing');
      expect(detectSearchEngine('cn.bing.com')).toBe('bing');
    });

    it('应该对不支持的域名返回null', () => {
      expect(detectSearchEngine('www.example.com')).toBeNull();
      expect(detectSearchEngine('duckduckgo.com')).toBeNull();
      expect(detectSearchEngine('yahoo.com')).toBeNull();
    });

    it('应该处理空字符串', () => {
      expect(detectSearchEngine('')).toBeNull();
    });
  });

  describe('getCurrentEngineConfig', () => {
    const originalLocation = window.location;

    beforeEach(() => {
      delete (window as any).location;
    });

    afterEach(() => {
      (window as any).location = originalLocation;
    });

    it('应该返回百度配置', () => {
      (window as any).location = { hostname: 'www.baidu.com' };

      const config = getCurrentEngineConfig();
      expect(config).not.toBeNull();
      expect(config?.searchInputSelector).toBe('input#kw');
    });

    it('应该返回谷歌配置', () => {
      (window as any).location = { hostname: 'www.google.com' };

      const config = getCurrentEngineConfig();
      expect(config).not.toBeNull();
      expect(config?.searchInputSelector).toBe('input[name="q"]');
    });

    it('应该返回必应配置', () => {
      (window as any).location = { hostname: 'www.bing.com' };

      const config = getCurrentEngineConfig();
      expect(config).not.toBeNull();
      expect(config?.searchInputSelector).toBe('input#sb_form_q');
    });

    it('应该对不支持的域名返回null', () => {
      (window as any).location = { hostname: 'www.unsupported.com' };

      const config = getCurrentEngineConfig();
      expect(config).toBeNull();
    });
  });

  describe('isResultsPage 函数', () => {
    const originalLocation = window.location;

    beforeEach(() => {
      delete (window as any).location;
    });

    afterEach(() => {
      (window as any).location = originalLocation;
    });

    it('Baidu应该正确检测搜索结果页', () => {
      const config = SEARCH_ENGINE_CONFIGS.baidu;

      (window as any).location = { pathname: '/s' };
      expect(config.isResultsPage()).toBe(true);

      (window as any).location = { pathname: '/s?wd=test' };
      expect(config.isResultsPage()).toBe(true);

      (window as any).location = { pathname: '/' };
      expect(config.isResultsPage()).toBe(false);
    });

    it('Google应该正确检测搜索结果页', () => {
      const config = SEARCH_ENGINE_CONFIGS.google;

      (window as any).location = { pathname: '/search' };
      expect(config.isResultsPage()).toBe(true);

      (window as any).location = { pathname: '/search?q=test' };
      expect(config.isResultsPage()).toBe(true);

      (window as any).location = { pathname: '/' };
      expect(config.isResultsPage()).toBe(false);
    });

    it('Bing应该正确检测搜索结果页', () => {
      const config = SEARCH_ENGINE_CONFIGS.bing;

      (window as any).location = { pathname: '/search' };
      expect(config.isResultsPage()).toBe(true);

      (window as any).location = { pathname: '/search?q=test' };
      expect(config.isResultsPage()).toBe(true);

      (window as any).location = { pathname: '/' };
      expect(config.isResultsPage()).toBe(false);
    });
  });
});
