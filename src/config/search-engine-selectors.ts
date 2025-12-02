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
    // ✅ 修复: 百度已切换到新的 textarea 输入系统
    // 优先使用 textarea#chat-textarea (用户实际看到的元素)
    // 回退到 input#kw (旧系统，某些页面可能仍在使用)
    searchInputSelector: 'textarea#chat-textarea, input#kw',
    searchContainerSelector: '#form',
    searchFormSelector: 'form#form',
    iconInsertPosition: 'afterend',
    iconOffsetY: '8px',
    isResultsPage: () => window.location.pathname.includes('/s')
  },

  bing: {
    searchInputSelector: 'input#sb_form_q',
    searchContainerSelector: 'form#sb_form',
    searchFormSelector: 'form#sb_form',
    iconInsertPosition: 'afterend',
    iconOffsetY: '8px',
    isResultsPage: () => window.location.pathname.includes('/search')
  },

  yandex: {
    searchInputSelector: 'input[name="text"]',
    searchContainerSelector: 'form.search2__form',
    searchFormSelector: 'form.search2__form',
    iconInsertPosition: 'afterend',
    iconOffsetY: '8px',
    isResultsPage: () => window.location.pathname.includes('/search')
  },

  duckduckgo: {
    searchInputSelector: 'input#search_form_input',
    searchContainerSelector: 'form#search_form',
    searchFormSelector: 'form#search_form',
    iconInsertPosition: 'afterend',
    iconOffsetY: '8px',
    isResultsPage: () => window.location.search.includes('q=')
  }
};

/**
 * Detect current search engine from hostname
 * Supports international domain variants
 * Note: Google is excluded as it has built-in advanced search tools
 */
export function detectSearchEngine(hostname: string): string | null {
  // Baidu: baidu.com, baidu.com.hk, baidu.jp, etc.
  if (hostname.includes('baidu.com')) return 'baidu';

  // Bing: bing.com, cn.bing.com, etc.
  if (hostname.includes('bing.com')) return 'bing';

  // Yandex: yandex.com (international version only)
  if (hostname.includes('yandex.com')) return 'yandex';

  // DuckDuckGo: duckduckgo.com
  if (hostname.includes('duckduckgo.com')) return 'duckduckgo';

  return null;
}

/**
 * Get configuration for current page
 */
export function getCurrentEngineConfig(): SearchEngineConfig | null {
  const engineKey = detectSearchEngine(window.location.hostname);
  return engineKey ? SEARCH_ENGINE_CONFIGS[engineKey] : null;
}

/**
 * Detect and return current search engine key
 * Returns engine key (baidu, bing, yandex, duckduckgo) or 'baidu' as default
 */
export function detectCurrentEngine(): 'baidu' | 'bing' | 'yandex' | 'duckduckgo' {
  const engineKey = detectSearchEngine(window.location.hostname);
  return (engineKey as 'baidu' | 'bing' | 'yandex' | 'duckduckgo') || 'baidu';
}
