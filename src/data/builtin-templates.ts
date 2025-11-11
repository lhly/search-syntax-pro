/**
 * 内置搜索模板数据
 */

import type { SearchTemplate } from '../types/template';

/**
 * 获取当前日期字符串 (YYYY-MM-DD)
 */
const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * 获取N天前的日期字符串
 */
const getDaysAgoString = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

/**
 * 内置模板列表
 */
export const BUILTIN_TEMPLATES: SearchTemplate[] = [
  // ========== 学术研究 ==========
  {
    id: 'academic_paper',
    name: '学术论文搜索',
    description: '搜索 PDF 格式的学术论文,限定近5年',
    icon: '📚',
    category: 'academic',
    params: {
      engine: 'google',
      fileType: 'pdf',
      dateRange: {
        from: getDaysAgoString(365 * 5),
        to: getTodayString()
      }
    },
    tags: ['学术', '论文', 'PDF', '科研'],
    isBuiltIn: true,
    createdAt: Date.now(),
    usageCount: 0
  },

  {
    id: 'scholar_google',
    name: 'Google Scholar 搜索',
    description: '在 Google Scholar 中搜索学术文献',
    icon: '🎓',
    category: 'academic',
    params: {
      engine: 'google',
      site: 'scholar.google.com',
      keyword: ''
    },
    tags: ['学术', 'Google', '文献'],
    isBuiltIn: true,
    createdAt: Date.now(),
    usageCount: 0
  },

  {
    id: 'academic_recent',
    name: '最新学术成果',
    description: '搜索最近1年的学术研究成果',
    icon: '🔬',
    category: 'academic',
    params: {
      engine: 'google',
      fileType: 'pdf',
      dateRange: {
        from: getDaysAgoString(365),
        to: getTodayString()
      },
      orKeywords: ['research', '研究', 'study', 'analysis']
    },
    tags: ['学术', '最新', '研究'],
    isBuiltIn: true,
    createdAt: Date.now(),
    usageCount: 0
  },

  // ========== 技术开发 ==========
  {
    id: 'github_code',
    name: 'GitHub 代码搜索',
    description: '搜索 GitHub 上的开源代码',
    icon: '💻',
    category: 'tech',
    params: {
      engine: 'github',
      keyword: '',
      language: 'TypeScript'
    },
    tags: ['代码', 'GitHub', '开源'],
    isBuiltIn: true,
    createdAt: Date.now(),
    usageCount: 0
  },

  {
    id: 'stackoverflow_qa',
    name: 'Stack Overflow 问答',
    description: '在 Stack Overflow 搜索技术问题解答',
    icon: '❓',
    category: 'tech',
    params: {
      engine: 'stackoverflow',
      keyword: ''
    },
    tags: ['问答', 'Stack Overflow', '编程'],
    isBuiltIn: true,
    createdAt: Date.now(),
    usageCount: 0
  },

  {
    id: 'tech_blog',
    name: '技术博客搜索',
    description: '搜索主流技术博客平台的文章',
    icon: '✍️',
    category: 'tech',
    params: {
      engine: 'google',
      keyword: '',
      orKeywords: ['site:dev.to', 'site:medium.com', 'site:hashnode.com', 'site:juejin.cn']
    },
    tags: ['博客', '教程', '技术文章'],
    isBuiltIn: true,
    createdAt: Date.now(),
    usageCount: 0
  },

  {
    id: 'official_docs',
    name: '官方文档搜索',
    description: '在官方文档网站中搜索',
    icon: '📖',
    category: 'tech',
    params: {
      engine: 'google',
      keyword: '',
      inUrl: 'docs',
      orKeywords: ['documentation', 'api', 'guide', 'tutorial']
    },
    tags: ['文档', '官方', 'API'],
    isBuiltIn: true,
    createdAt: Date.now(),
    usageCount: 0
  },

  {
    id: 'npm_packages',
    name: 'NPM 包搜索',
    description: '搜索 NPM 软件包和文档',
    icon: '📦',
    category: 'tech',
    params: {
      engine: 'google',
      site: 'npmjs.com',
      keyword: ''
    },
    tags: ['NPM', '包管理', 'JavaScript'],
    isBuiltIn: true,
    createdAt: Date.now(),
    usageCount: 0
  },

  // ========== 新闻资讯 ==========
  {
    id: 'news_recent',
    name: '最新新闻',
    description: '搜索最近24小时的新闻',
    icon: '📰',
    category: 'news',
    params: {
      engine: 'google',
      keyword: '',
      dateRange: {
        from: getDaysAgoString(1),
        to: getTodayString()
      }
    },
    tags: ['新闻', '热点', '实时'],
    isBuiltIn: true,
    createdAt: Date.now(),
    usageCount: 0
  },

  {
    id: 'news_week',
    name: '本周新闻',
    description: '搜索最近一周的新闻报道',
    icon: '📅',
    category: 'news',
    params: {
      engine: 'google',
      keyword: '',
      dateRange: {
        from: getDaysAgoString(7),
        to: getTodayString()
      }
    },
    tags: ['新闻', '周报', '综合'],
    isBuiltIn: true,
    createdAt: Date.now(),
    usageCount: 0
  },

  // ========== 社交媒体 ==========
  {
    id: 'twitter_trending',
    name: 'Twitter 热门话题',
    description: '搜索 Twitter 上的热门讨论',
    icon: '🐦',
    category: 'social',
    params: {
      engine: 'twitter',
      keyword: '',
      minRetweets: 100,
      minFaves: 500,
      contentFilters: ['links', 'media']
    },
    tags: ['Twitter', '热点', '社交'],
    isBuiltIn: true,
    createdAt: Date.now(),
    usageCount: 0
  },

  {
    id: 'reddit_discussion',
    name: 'Reddit 讨论',
    description: '搜索 Reddit 上的相关讨论',
    icon: '🔴',
    category: 'social',
    params: {
      engine: 'reddit',
      keyword: ''
    },
    tags: ['Reddit', '社区', '讨论'],
    isBuiltIn: true,
    createdAt: Date.now(),
    usageCount: 0
  },

  // ========== 图片视频 ==========
  {
    id: 'image_hd',
    name: '高清图片搜索',
    description: '搜索高分辨率图片素材',
    icon: '🖼️',
    category: 'media',
    params: {
      engine: 'google',
      keyword: '',
      fileType: 'jpg',
      orKeywords: ['high resolution', '4K', '高清']
    },
    tags: ['图片', '高清', '素材'],
    isBuiltIn: true,
    createdAt: Date.now(),
    usageCount: 0
  },

  {
    id: 'free_images',
    name: '免费图片素材',
    description: '搜索免费商用图片网站',
    icon: '🎨',
    category: 'media',
    params: {
      engine: 'google',
      keyword: '',
      orKeywords: [
        'site:unsplash.com',
        'site:pexels.com',
        'site:pixabay.com',
        'site:freepik.com'
      ]
    },
    tags: ['图片', '免费', '商用'],
    isBuiltIn: true,
    createdAt: Date.now(),
    usageCount: 0
  },

  // ========== 购物比价 ==========
  {
    id: 'product_reviews',
    name: '产品评测搜索',
    description: '搜索商品评测和用户评价',
    icon: '⭐',
    category: 'shopping',
    params: {
      engine: 'google',
      keyword: '',
      orKeywords: ['评测', 'review', '测评', '使用体验']
    },
    tags: ['购物', '评测', '评价'],
    isBuiltIn: true,
    createdAt: Date.now(),
    usageCount: 0
  },

  {
    id: 'price_comparison',
    name: '价格比较',
    description: '在多个电商平台比较商品价格',
    icon: '💰',
    category: 'shopping',
    params: {
      engine: 'google',
      keyword: '',
      orKeywords: [
        'site:taobao.com',
        'site:jd.com',
        'site:tmall.com',
        'site:amazon.cn'
      ]
    },
    tags: ['购物', '比价', '电商'],
    isBuiltIn: true,
    createdAt: Date.now(),
    usageCount: 0
  }
];

/**
 * 模板分类元数据
 */
export const TEMPLATE_CATEGORY_META = [
  {
    category: 'academic' as const,
    name: '学术研究',
    icon: '📚',
    description: '学术论文、文献、研究成果搜索'
  },
  {
    category: 'tech' as const,
    name: '技术开发',
    icon: '💻',
    description: '代码、文档、技术博客搜索'
  },
  {
    category: 'news' as const,
    name: '新闻资讯',
    icon: '📰',
    description: '最新新闻、时事报道搜索'
  },
  {
    category: 'social' as const,
    name: '社交媒体',
    icon: '🐦',
    description: 'Twitter、Reddit 等社交平台搜索'
  },
  {
    category: 'shopping' as const,
    name: '购物比价',
    icon: '🛒',
    description: '商品评测、价格比较搜索'
  },
  {
    category: 'media' as const,
    name: '图片视频',
    icon: '🖼️',
    description: '图片、视频素材搜索'
  },
  {
    category: 'custom' as const,
    name: '自定义',
    icon: '⭐',
    description: '用户自定义模板'
  }
];
