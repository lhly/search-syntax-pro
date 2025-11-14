// 搜索引擎类型
export type SearchEngine = 'baidu' | 'google' | 'bing' | 'twitter' | 'duckduckgo' | 'brave' | 'yandex' | 'reddit' | 'github' | 'stackoverflow';

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
  | 'cache'
  // Twitter 专属语法
  | 'from_user'
  | 'to_user'
  | 'min_retweets'
  | 'min_faves'
  | 'lang'
  | 'filter';

// 搜索参数接口
export interface SearchParams {
  keyword: string;
  engine: SearchEngine;

  // ========================================
  // 🔥 多关键词支持字段（技术对等性改造）
  // ========================================

  // 精确匹配 - 原生多关键词支持 (8/10引擎)
  exactMatches?: string[];      // 多个精确短语: "phrase1" "phrase2"

  // 网站搜索 - OR组合多关键词 (10/10引擎)
  sites?: string[];             // 多个网站: (site:a.com OR site:b.com)

  // 文件类型 - OR组合多关键词 (10/10引擎)
  fileTypes?: string[];         // 多个文件类型: (filetype:pdf OR filetype:doc)

  // Twitter用户筛选 - OR组合多关键词
  fromUsers?: string[];         // 多个发送者: (from:userA OR from:userB)
  toUsers?: string[];           // 多个接收者: (to:userA OR to:userB)

  // 平台特定多值字段
  subreddits?: string[];        // Reddit: 多个版块 (subreddit:a OR subreddit:b)
  languages?: string[];         // GitHub: 多个编程语言 (language:js OR language:python)
  tags?: string[];              // StackOverflow: 多个标签 [tag1] [tag2]

  // ========================================
  // ⚠️ 向后兼容字段（已弃用，保留以防破坏性更改）
  // ========================================

  /** @deprecated 使用 sites[] 替代 */
  site?: string;

  /** @deprecated 使用 fileTypes[] 替代 */
  fileType?: string;

  /** @deprecated 使用 exactMatches[] 替代 */
  exactMatch?: string;

  /** @deprecated 使用 fromUsers[] 替代（仅Twitter） */
  fromUser?: string;

  /** @deprecated 使用 toUsers[] 替代（仅Twitter） */
  toUser?: string;

  // ========================================
  // 现有字段（保持不变）
  // ========================================

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

  // Twitter 专属字段
  minRetweets?: number;      // Twitter: 最少转发数
  minFaves?: number;         // Twitter: 最少点赞数
  language?: string;         // 语言筛选 (Twitter自然语言/GitHub编程语言)
  contentFilters?: Array<'images' | 'videos' | 'links' | 'media' | 'replies' | 'retweets' | 'news'>; // Twitter: 内容过滤器
}

// 搜索历史记录接口
export interface SearchHistory {
  id: string;
  keyword: string;
  engine: SearchEngine;
  syntax: {
    // ========================================
    // 🔥 多关键词支持字段
    // ========================================
    exactMatches?: string[];
    sites?: string[];
    fileTypes?: string[];
    fromUsers?: string[];
    toUsers?: string[];
    subreddits?: string[];
    languages?: string[];
    tags?: string[];

    // ========================================
    // ⚠️ 向后兼容字段（已弃用）
    // ========================================
    /** @deprecated */ site?: string;
    /** @deprecated */ fileType?: string;
    /** @deprecated */ exactMatch?: string;
    /** @deprecated */ fromUser?: string;
    /** @deprecated */ toUser?: string;

    // ========================================
    // 现有字段
    // ========================================
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
    // Twitter 专属字段
    minRetweets?: number;
    minFaves?: number;
    language?: string;
    contentFilters?: Array<'images' | 'videos' | 'links' | 'media' | 'replies' | 'retweets' | 'news'>;
  };
  generatedQuery: string;
  timestamp: number;
}

// 🔥 引擎偏好设置接口 (新增)
export interface EnginePreference {
  engine: SearchEngine;
  visible: boolean;
  order: number;  // 排序权重，数字越小越靠前
}

// 用户设置接口
export interface UserSettings {
  // 🔥 移除 defaultEngine - 现在使用 enginePreferences 的第一位作为默认引擎
  enginePreferences: EnginePreference[];  // 必需字段，排序第一位即为默认引擎
  language: 'zh-CN' | 'en-US';
  enableHistory: boolean;
  theme: 'light' | 'dark' | 'auto';
  historyLimit: number;
  autoOpenInNewTab: boolean;
}

// UI 功能特性类型 (用于控制 UI 显示)
export type UIFeatureType =
  // 通用特性
  | 'exact_match'      // "精确匹配"
  | 'exclude'          // -排除
  | 'or_keywords'      // OR 逻辑
  | 'date_range'       // 日期范围

  // 传统搜索引擎特性
  | 'site'             // site:
  | 'filetype'         // filetype:
  | 'intitle'          // intitle:
  | 'inurl'            // inurl:
  | 'intext'           // intext:
  | 'related'          // related:
  | 'cache'            // cache:
  | 'allintitle'       // allintitle:
  | 'wildcard'         // * 通配符
  | 'number_range'     // 数字范围

  // Twitter 专属特性
  | 'from_user'        // from:@user
  | 'to_user'          // to:@user
  | 'min_retweets'     // min_retweets:
  | 'min_faves'        // min_faves:
  | 'language'         // lang:
  | 'content_filters'; // filter:

// 语言选项配置 (用于动态生成语言选择器)
export interface LanguageOption {
  value: string;   // 实际值 (如: 'zh', 'javascript')
  label: string;   // 显示文本 (如: '中文', 'JavaScript')
}

// 语言字段配置 (适配器提供给UI的语言选项配置)
export interface LanguageFieldConfig {
  label: string;              // UI标签 (如: '语言筛选', '编程语言')
  placeholder: string;        // 选择器提示文本
  options: LanguageOption[];  // 可选的语言列表
}

// 引擎特性分组配置 (用于 UI 组织)
export interface EngineFeatureGroups {
  user_filters?: UIFeatureType[];      // 用户筛选 (Twitter)
  location?: UIFeatureType[];          // 位置限定 (传统引擎)
  precision?: UIFeatureType[];         // 匹配精度
  logic?: UIFeatureType[];             // 逻辑运算
  range?: UIFeatureType[];             // 范围过滤
  engagement?: UIFeatureType[];        // 互动数据 (Twitter)
  special?: UIFeatureType[];           // 特殊功能
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

  // 🔥 新增: 获取该引擎支持的 UI 功能特性
  getSupportedFeatures(): UIFeatureType[];

  // 🔥 新增: 获取功能分组配置 (可选，用于 UI 组织)
  getFeatureGroups?(): EngineFeatureGroups;

  // 🔥 新增: 获取语言字段的UI配置 (可选，用于动态生成语言选择器)
  // 如果引擎不支持语言筛选功能，返回 undefined
  // Twitter: 返回自然语言选项 (zh, en, ja...)
  // GitHub: 返回编程语言选项 (javascript, python, rust...)
  getLanguageOptions?(): LanguageFieldConfig;
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

// 默认设置 - enginePreferences 需要在运行时通过 EnginePreferenceService 生成
// 这里提供一个基础配置,实际使用时应调用 getDefaultUserSettings()
export const DEFAULT_SETTINGS: Omit<UserSettings, 'enginePreferences'> = {
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
