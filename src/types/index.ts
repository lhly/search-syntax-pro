// 搜索引擎类型
export type SearchEngine = 'baidu' | 'google' | 'bing';

// 语法类型
export type SyntaxType =
  // 已实现
  | 'site'
  | 'filetype'
  | 'exact'
  | 'date_range'
  // 新增高级语法
  | 'intitle'
  | 'inurl'
  | 'exclude'
  | 'or'
  | 'intext'
  | 'number_range'
  | 'wildcard'
  | 'allintitle'
  | 'related'
  | 'cache';

// 搜索参数接口
export interface SearchParams {
  keyword: string;
  engine: SearchEngine;

  // 已实现的字段
  site?: string;
  fileType?: string;
  exactMatch?: string;
  dateRange?: {
    from: string;
    to: string;
  };

  // 新增高级语法字段
  inTitle?: string;          // 标题搜索
  inUrl?: string;            // URL搜索
  excludeWords?: string[];   // 排除关键词
  orKeywords?: string[];     // OR逻辑关键词
  inText?: string;           // 正文搜索
  numberRange?: {            // 数字范围
    min: number;
    max: number;
  };
  wildcardQuery?: string;    // 通配符查询
  allInTitle?: string;       // 所有关键词在标题
  relatedSite?: string;      // 相关网站
  cacheSite?: string;        // 网页缓存
}

// 搜索历史记录接口
export interface SearchHistory {
  id: string;
  keyword: string;
  engine: SearchEngine;
  syntax: {
    site?: string;
    fileType?: string;
    exactMatch?: string;
    dateRange?: {
      from: string;
      to: string;
    };
    // 新增高级语法字段
    inTitle?: string;
    inUrl?: string;
    excludeWords?: string[];
    orKeywords?: string[];
    inText?: string;
    numberRange?: {
      min: number;
      max: number;
    };
    wildcardQuery?: string;
    allInTitle?: string;
    relatedSite?: string;
    cacheSite?: string;
  };
  generatedQuery: string;
  timestamp: number;
}

// 用户设置接口
export interface UserSettings {
  defaultEngine: SearchEngine;
  language: 'zh-CN' | 'en-US';
  enableHistory: boolean;
  theme: 'light' | 'dark' | 'auto';
  historyLimit: number;
  autoOpenInNewTab: boolean;
}

// 搜索引擎适配器接口
export interface SearchEngineAdapter {
  buildQuery(params: SearchParams): string;
  validateSyntax(syntax: SyntaxType): boolean;
  getSupportedSyntax(): SyntaxType[];
  getBaseUrl(): string;
  getName(): string;
  validateParams?(params: SearchParams): ValidationResult;
  getSearchSuggestions?(params: SearchParams): string[];
  // 新增: 语法兼容性检查
  isSyntaxSupported?(syntax: SyntaxType): boolean;
  // 新增: 语法降级处理
  degradeSyntax?(params: SearchParams): SearchParams;
}

// 验证结果接口
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// 存储键名常量
export const STORAGE_KEYS = {
  HISTORY: 'search_history',
  SETTINGS: 'user_settings',
  CACHE: 'app_cache'
} as const;

// 默认设置
export const DEFAULT_SETTINGS: UserSettings = {
  defaultEngine: 'baidu',
  language: 'zh-CN',
  enableHistory: true,
  theme: 'auto',
  historyLimit: 1000,
  autoOpenInNewTab: true
};

// 常见文件类型
export const COMMON_FILE_TYPES = [
  { value: 'pdf', labelKey: 'common.fileTypes.pdf' },
  { value: 'doc', labelKey: 'common.fileTypes.doc' },
  { value: 'docx', labelKey: 'common.fileTypes.docx' },
  { value: 'xls', labelKey: 'common.fileTypes.xls' },
  { value: 'xlsx', labelKey: 'common.fileTypes.xlsx' },
  { value: 'ppt', labelKey: 'common.fileTypes.ppt' },
  { value: 'pptx', labelKey: 'common.fileTypes.pptx' },
  { value: 'txt', labelKey: 'common.fileTypes.txt' },
  { value: 'zip', labelKey: 'common.fileTypes.zip' },
  { value: 'rar', labelKey: 'common.fileTypes.rar' },
  { value: 'jpg', labelKey: 'common.fileTypes.jpg' },
  { value: 'png', labelKey: 'common.fileTypes.png' },
  { value: 'gif', labelKey: 'common.fileTypes.gif' }
] as const;

// 主题类型
export type Theme = 'light' | 'dark' | 'auto';

// 语言类型
export type Language = 'zh-CN' | 'en-US';
