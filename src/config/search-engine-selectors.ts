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
 * Supports international domain variants
 * Note: Google is excluded as it has built-in advanced search tools
 */
export function detectSearchEngine(hostname: string): string | null {
  // Baidu: baidu.com, baidu.com.hk, baidu.jp, etc.
  if (hostname.includes('baidu.com')) return 'baidu';

  // Bing: bing.com, cn.bing.com, etc.
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

/**
 * Detect and return current search engine key
 * Returns engine key (baidu, bing) or 'baidu' as default
 */
export function detectCurrentEngine(): 'baidu' | 'bing' {
  const engineKey = detectSearchEngine(window.location.hostname);
  return (engineKey as 'baidu' | 'bing') || 'baidu';
}
