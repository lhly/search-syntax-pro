# 技术规范 - 添加俄语和韩语国际化支持

**项目**: SearchSyntax Pro
**版本**: 1.8.6
**规范生成时间**: 2025-12-03
**需求质量评分**: 96/100

---

## 1. 实施概览

### 1.1 核心任务
添加俄语(ru-RU)和韩语(ko-KR)国际化支持到Chrome扩展项目,总计1064条翻译。

### 1.2 技术架构
**双层i18n系统**:
1. Chrome Extension i18n API: 28条 (14条×2语言)
2. React自定义i18n: 1036条 (518条×2语言)

### 1.3 实施原则
- ✅ AI辅助翻译 + 人工审核关键文本
- ✅ 优先简洁表达,适应UI空间
- ✅ 自动验证变量完整性
- ✅ 构建验证确保类型安全
- ✅ 文档同步更新

---

## 2. 详细实施步骤

### Step 1: TypeScript类型定义更新

#### 文件位置
`/Users/lhly/chromeex/ssp/src/types/index.ts:339`

#### 当前代码
```typescript
export type Language = 'zh-CN' | 'en-US';
```

#### 修改后代码
```typescript
export type Language = 'zh-CN' | 'en-US' | 'ru-RU' | 'ko-KR';
```

#### 验证方法
```bash
# TypeScript类型检查
npx tsc --noEmit
```

---

### Step 2: Chrome Extension i18n文件创建

#### 2.1 创建俄语文件

**文件路径**: `/Users/lhly/chromeex/ssp/public/_locales/ru/messages.json`

**完整内容**:
```json
{
  "app_name": {
    "message": "SearchSyntax Pro",
    "description": "SearchSyntax Pro - Advanced Search Syntax Tool"
  },
  "app_description": {
    "message": "Инструмент визуализации расширенного синтаксиса поиска для упрощения использования",
    "description": "App description"
  },
  "search_keyword": {
    "message": "Ключевое слово",
    "description": "Search keyword input label"
  },
  "search_button": {
    "message": "Поиск",
    "description": "Search button text"
  },
  "site_search": {
    "message": "Поиск по сайту",
    "description": "Site search function label"
  },
  "site_placeholder": {
    "message": "Введите домен, напр. example.com",
    "description": "Website domain input placeholder"
  },
  "file_type_search": {
    "message": "Поиск по типу файла",
    "description": "File type search function label"
  },
  "file_type_placeholder": {
    "message": "Выберите или введите тип, напр. PDF",
    "description": "File type input placeholder"
  },
  "query_preview": {
    "message": "Предпросмотр запроса",
    "description": "Query preview label"
  },
  "search_history": {
    "message": "История поиска",
    "description": "Search history label"
  },
  "clear_history": {
    "message": "Очистить историю",
    "description": "Clear history button"
  },
  "settings": {
    "message": "Настройки",
    "description": "Settings button label"
  },
  "default_engine": {
    "message": "Поисковик по умолчанию",
    "description": "Default search engine setting label"
  },
  "language": {
    "message": "Язык",
    "description": "Language setting label"
  },
  "enable_history": {
    "message": "Включить историю поиска",
    "description": "Enable search history toggle label"
  },
  "theme": {
    "message": "Тема",
    "description": "Theme setting label"
  },
  "light_theme": {
    "message": "Светлая",
    "description": "Light theme option"
  },
  "dark_theme": {
    "message": "Тёмная",
    "description": "Dark theme option"
  },
  "auto_theme": {
    "message": "Системная",
    "description": "Auto theme option"
  },
  "about": {
    "message": "О программе",
    "description": "About page label"
  },
  "version": {
    "message": "Версия",
    "description": "Version info label"
  },
  "author": {
    "message": "Автор",
    "description": "Author info label"
  },
  "export_data": {
    "message": "Экспорт данных",
    "description": "Export data button"
  },
  "import_data": {
    "message": "Импорт данных",
    "description": "Import data button"
  },
  "clear_all_data": {
    "message": "Очистить все данные",
    "description": "Clear all data button"
  },
  "popup_title": {
    "message": "SearchSyntax Pro",
    "description": "Popup window title"
  },
  "detached_title": {
    "message": "SearchSyntax Pro - Отдельное окно",
    "description": "Detached window title"
  },
  "options_title": {
    "message": "SearchSyntax Pro - Настройки",
    "description": "Options page title"
  }
}
```

#### 2.2 创建韩语文件

**文件路径**: `/Users/lhly/chromeex/ssp/public/_locales/ko/messages.json`

**完整内容**:
```json
{
  "app_name": {
    "message": "SearchSyntax Pro",
    "description": "SearchSyntax Pro - Advanced Search Syntax Tool"
  },
  "app_description": {
    "message": "고급 검색 구문 시각화 도구로 검색 사용의 진입 장벽을 낮춥니다",
    "description": "App description"
  },
  "search_keyword": {
    "message": "검색어",
    "description": "Search keyword input label"
  },
  "search_button": {
    "message": "검색",
    "description": "Search button text"
  },
  "site_search": {
    "message": "사이트 검색",
    "description": "Site search function label"
  },
  "site_placeholder": {
    "message": "도메인 입력, 예: example.com",
    "description": "Website domain input placeholder"
  },
  "file_type_search": {
    "message": "파일 형식 검색",
    "description": "File type search function label"
  },
  "file_type_placeholder": {
    "message": "형식 선택 또는 입력, 예: PDF",
    "description": "File type input placeholder"
  },
  "query_preview": {
    "message": "쿼리 미리보기",
    "description": "Query preview label"
  },
  "search_history": {
    "message": "검색 기록",
    "description": "Search history label"
  },
  "clear_history": {
    "message": "기록 지우기",
    "description": "Clear history button"
  },
  "settings": {
    "message": "설정",
    "description": "Settings button label"
  },
  "default_engine": {
    "message": "기본 검색 엔진",
    "description": "Default search engine setting label"
  },
  "language": {
    "message": "언어",
    "description": "Language setting label"
  },
  "enable_history": {
    "message": "검색 기록 활성화",
    "description": "Enable search history toggle label"
  },
  "theme": {
    "message": "테마",
    "description": "Theme setting label"
  },
  "light_theme": {
    "message": "밝게",
    "description": "Light theme option"
  },
  "dark_theme": {
    "message": "어둡게",
    "description": "Dark theme option"
  },
  "auto_theme": {
    "message": "시스템 따름",
    "description": "Auto theme option"
  },
  "about": {
    "message": "정보",
    "description": "About page label"
  },
  "version": {
    "message": "버전",
    "description": "Version info label"
  },
  "author": {
    "message": "개발자",
    "description": "Author info label"
  },
  "export_data": {
    "message": "데이터 내보내기",
    "description": "Export data button"
  },
  "import_data": {
    "message": "데이터 가져오기",
    "description": "Import data button"
  },
  "clear_all_data": {
    "message": "모든 데이터 지우기",
    "description": "Clear all data button"
  },
  "popup_title": {
    "message": "SearchSyntax Pro",
    "description": "Popup window title"
  },
  "detached_title": {
    "message": "SearchSyntax Pro - 별도 창",
    "description": "Detached window title"
  },
  "options_title": {
    "message": "SearchSyntax Pro - 설정",
    "description": "Options page title"
  }
}
```

#### 2.3 翻译策略说明

**简洁化原则**:
- "默认搜索引擎" → 俄语: "Поисковик по умолчанию" (标准表达)
- "默认搜索引擎" → 韩语: "기본 검색 엔진" (简洁表达)
- "清除" → 俄语: "Очистить" (动词形式)
- "清除" → 韩语: "지우기" (名词化动词)

**功能性文本优先准确**:
- 按钮: "Search" → "Поиск" (俄) / "검색" (韩)
- 设置项: "Settings" → "Настройки" (俄) / "설정" (韩)

---

### Step 3: React i18n翻译添加

#### 文件位置
`/Users/lhly/chromeex/ssp/src/i18n/translations.ts`

#### 当前结构
```typescript
import type { Language } from '@/types'

const translations: Record<Language, Record<string, string>> = {
  'zh-CN': { /* 518条翻译 */ },
  'en-US': { /* 518条翻译 */ },
}
```

#### 修改方式

在 `translations` 对象中添加两个新的语言对象:

```typescript
const translations: Record<Language, Record<string, string>> = {
  'zh-CN': { /* 现有518条 */ },
  'en-US': { /* 现有518条 */ },
  'ru-RU': {
    // 新增518条俄语翻译
    // 以下为示例,完整列表见后续章节
    'common.languages.zh-CN': 'Упрощённый китайский',
    'common.languages.en-US': 'English',
    'common.languages.ru-RU': 'Русский',
    'common.languages.ko-KR': '한국어',
    'common.searchEngines.baidu': 'Baidu',
    'common.searchEngines.google': 'Google',
    'common.searchEngines.bing': 'Bing',
    // ... (完整518条)
  },
  'ko-KR': {
    // 新增518条韩语翻译
    'common.languages.zh-CN': '중국어 간체',
    'common.languages.en-US': 'English',
    'common.languages.ru-RU': 'Русский',
    'common.languages.ko-KR': '한국어',
    'common.searchEngines.baidu': 'Baidu',
    'common.searchEngines.google': 'Google',
    'common.searchEngines.bing': 'Bing',
    // ... (完整518条)
  },
}
```

#### 翻译实施策略

**基于中英文对照生成**:
1. 读取 `zh-CN` 和 `en-US` 的对应键值
2. 对照分析功能上下文
3. 生成简洁准确的俄韩语翻译
4. 保留所有变量插值 `{变量名}`

**变量插值处理**:
- 识别模式: `/\{[^}]+\}/g`
- 规则: 变量名必须完全一致
- 语序: 可根据俄韩语语法调整变量位置
- 示例:
  ```typescript
  'zh-CN': '{count}条结果'
  'en-US': '{count} results'
  'ru-RU': '{count} результатов'  // 俄语: 数字在前
  'ko-KR': '{count}개 결과'        // 韩语: 数字在前+量词
  ```

**命名规范保持**:
- 三级命名空间: `组件.子类.键`
- 搜索引擎名称: 保持原始品牌名(不翻译)
- 文件类型: 使用通用技术术语

---

### Step 4: 自动化验证机制

#### 4.1 变量完整性检查脚本

创建临时验证脚本 (可选,用于开发阶段):

```javascript
// verify-i18n-variables.js
const translations = require('./src/i18n/translations.ts').default;

function extractVariables(text) {
  const matches = text.match(/\{[^}]+\}/g);
  return matches ? matches.sort() : [];
}

function verifyTranslations() {
  const baseLanguage = 'en-US';
  const newLanguages = ['ru-RU', 'ko-KR'];
  const errors = [];

  const baseKeys = Object.keys(translations[baseLanguage]);

  newLanguages.forEach(lang => {
    baseKeys.forEach(key => {
      const baseText = translations[baseLanguage][key];
      const translatedText = translations[lang][key];

      if (!translatedText) {
        errors.push(`[${lang}] Missing key: ${key}`);
        return;
      }

      const baseVars = extractVariables(baseText);
      const transVars = extractVariables(translatedText);

      if (JSON.stringify(baseVars) !== JSON.stringify(transVars)) {
        errors.push(
          `[${lang}] Variable mismatch in "${key}":\n` +
          `  Expected: ${baseVars.join(', ')}\n` +
          `  Found: ${transVars.join(', ')}`
        );
      }
    });
  });

  if (errors.length > 0) {
    console.error('❌ Translation validation failed:\n');
    errors.forEach(err => console.error(err));
    process.exit(1);
  } else {
    console.log('✅ All translations validated successfully!');
  }
}

verifyTranslations();
```

#### 4.2 TypeScript类型检查

```bash
# 编译检查(不生成文件)
npx tsc --noEmit

# 预期输出: 无错误
# 如果Language类型未更新,会报错
```

#### 4.3 构建验证

```bash
# 执行完整构建
npm run build

# 验证检查点:
# 1. 构建成功无错误
# 2. dist/_locales/ru/messages.json 存在
# 3. dist/_locales/ko/messages.json 存在
# 4. dist目录包含所有4种语言文件
```

---

### Step 5: 生成翻译对照表

#### 文件路径
`.claude/specs/add-russian-korean-i18n/translation-review.md`

#### 表格结构

**5.1 优先审核区域 (必查)**

```markdown
## 🔴 优先审核: 按钮和操作

| 键名 | 中文 | 英文 | 俄语 | 韩语 | 变量 | 状态 |
|------|------|------|------|------|------|------|
| common.save | 保存 | Save | Сохранить | 저장 | - | ⬜ |
| common.cancel | 取消 | Cancel | Отмена | 취소 | - | ⬜ |
| common.apply | 应用到搜索框 | Apply to search box | Применить | 검색창에 적용 | - | ⬜ |
| common.close | 关闭 (ESC) | Close (ESC) | Закрыть (ESC) | 닫기 (ESC) | - | ⬜ |
| common.edit | 编辑 | Edit | Редактировать | 편집 | - | ⬜ |
| common.reset | 重置 | Reset | Сбросить | 초기화 | - | ⬜ |

## 🟠 优先审核: 错误和提示

| 键名 | 中文 | 英文 | 俄语 | 韩语 | 变量 | 状态 |
|------|------|------|------|------|------|------|
| copyButton.copyError | 复制失败 | Copy failed | Ошибка копирования | 복사 실패 | - | ⬜ |
| popup.noSearchEngineError | 未选择搜索引擎 | No search engine selected | Не выбран поисковик | 검색 엔진 미선택 | - | ⬜ |

## 🟡 优先审核: 搜索引擎名称

| 键名 | 中文 | 英文 | 俄语 | 韩语 | 变量 | 状态 |
|------|------|------|------|------|------|------|
| common.searchEngines.baidu | 百度 | Baidu | Baidu | Baidu | - | ⬜ |
| common.searchEngines.google | 谷歌 | Google | Google | Google | - | ⬜ |
| common.searchEngines.twitter | X (Twitter) | X (Twitter) | X (Twitter) | X (Twitter) | - | ⬜ |

## 🟢 抽查: 变量插值文本 (10%随机)

| 键名 | 中文 | 英文 | 俄语 | 韩语 | 变量 | 状态 |
|------|------|------|------|------|------|------|
| popup.currentEngine | 当前引擎: {engine} | Current engine: {engine} | Поисковик: {engine} | 현재 엔진: {engine} | {engine} | ⬜ |
| options.exportSuccess | 已导出 {count} 条记录 | Exported {count} records | Экспортировано {count} | {count}개 내보냄 | {count} | ⬜ |

## 📝 审核说明

**状态标记**:
- ⬜ 待审核
- ✅ 通过
- ⚠️ 需修改
- ❌ 严重错误

**审核重点**:
1. 功能性文本(按钮/菜单): 准确性优先
2. 错误提示: 清晰易懂
3. 搜索引擎名称: 保持品牌一致性
4. 变量插值: 确保 {变量名} 完全一致
5. 文本长度: 是否适合UI显示

**修改建议格式**:
- 键名: common.save
- 问题: 俄语文本过长
- 建议: "Сохранить" → "Сохр."
```

#### 5.2 生成方式

使用脚本自动生成对照表骨架:

```javascript
// generate-review-table.js
const translations = require('./src/i18n/translations.ts').default;

const priorityKeys = [
  // 按钮和操作
  'common.save', 'common.cancel', 'common.apply', 'common.close',
  'common.edit', 'common.reset',
  // 错误提示
  'copyButton.copyError', 'popup.noSearchEngineError',
  // 搜索引擎名称 (前3个)
  'common.searchEngines.baidu', 'common.searchEngines.google', 'common.searchEngines.twitter',
];

// 生成Markdown表格
priorityKeys.forEach(key => {
  const zhCN = translations['zh-CN'][key] || '';
  const enUS = translations['en-US'][key] || '';
  const ruRU = translations['ru-RU'][key] || '';
  const koKR = translations['ko-KR'][key] || '';
  const vars = extractVariables(enUS).join(', ') || '-';

  console.log(`| ${key} | ${zhCN} | ${enUS} | ${ruRU} | ${koKR} | ${vars} | ⬜ |`);
});
```

---

### Step 6: 文档同步更新

#### 6.1 更新README.md

**文件路径**: `/Users/lhly/chromeex/ssp/README.md`

**修改位置**: 查找 "支持语言" 或 "Supported Languages" 章节

**修改前**:
```markdown
## 支持语言

- 🇨🇳 简体中文 (zh-CN)
- 🇺🇸 English (en-US)
```

**修改后**:
```markdown
## 🌍 支持语言 / Supported Languages

- 🇨🇳 简体中文 (zh-CN)
- 🇺🇸 English (en-US)
- 🇷🇺 Русский (ru-RU)
- 🇰🇷 한국어 (ko-KR)
```

#### 6.2 检查manifest.json

**文件路径**: `/Users/lhly/chromeex/ssp/public/manifest.json`

**检查项**:
- `default_locale` 是否正确设置 (通常是 `"en"`)
- `name` 和 `description` 是否使用 `__MSG_app_name__` 格式

**示例**:
```json
{
  "manifest_version": 3,
  "name": "__MSG_app_name__",
  "description": "__MSG_app_description__",
  "default_locale": "en",
  ...
}
```

#### 6.3 更新package.json (可选)

如果package.json包含描述字段:

```json
{
  "name": "search-syntax-pro",
  "version": "1.8.6",
  "description": "Search Syntax Visualizer - 支持中英俄韩四语言",
  ...
}
```

---

## 3. 完整翻译键值对照表 (核心示例)

### 3.1 语言名称翻译

```typescript
// 在translations对象中
'ru-RU': {
  'common.languages.zh-CN': 'Упрощённый китайский',
  'common.languages.en-US': 'English',
  'common.languages.ru-RU': 'Русский',
  'common.languages.ko-KR': '한국어',
}

'ko-KR': {
  'common.languages.zh-CN': '중국어 간체',
  'common.languages.en-US': 'English',
  'common.languages.ru-RU': 'Русский',
  'common.languages.ko-KR': '한국어',
}
```

### 3.2 搜索引擎名称 (保持原名)

```typescript
'ru-RU': {
  'common.searchEngines.baidu': 'Baidu',
  'common.searchEngines.google': 'Google',
  'common.searchEngines.bing': 'Bing',
  'common.searchEngines.twitter': 'X (Twitter)',
  'common.searchEngines.duckduckgo': 'DuckDuckGo',
  'common.searchEngines.brave': 'Brave Search',
  'common.searchEngines.yandex': 'Yandex',
  'common.searchEngines.reddit': 'Reddit',
  'common.searchEngines.github': 'GitHub',
  'common.searchEngines.stackoverflow': 'Stack Overflow',
  'common.searchEngines.yahoo': 'Yahoo',
  'common.searchEngines.startpage': 'Startpage',
  'common.searchEngines.ecosia': 'Ecosia',
  'common.searchEngines.qwant': 'Qwant',
  'common.searchEngines.naver': 'Naver',
  'common.searchEngines.sogou': 'Sogou',
  'common.searchEngines.so360': '360 Search',
}

// 韩语相同
'ko-KR': { /* 同上 */ }
```

### 3.3 文件类型翻译

```typescript
'ru-RU': {
  'common.fileTypes.pdf': 'PDF-документ',
  'common.fileTypes.doc': 'Word-документ',
  'common.fileTypes.docx': 'Word-документ',
  'common.fileTypes.xls': 'Excel-таблица',
  'common.fileTypes.xlsx': 'Excel-таблица',
  'common.fileTypes.ppt': 'PowerPoint',
  'common.fileTypes.pptx': 'PowerPoint',
  'common.fileTypes.txt': 'Текстовый файл',
  'common.fileTypes.zip': 'ZIP-архив',
  'common.fileTypes.rar': 'RAR-архив',
  'common.fileTypes.jpg': 'Изображение',
  'common.fileTypes.png': 'Изображение',
  'common.fileTypes.gif': 'GIF-анимация',
}

'ko-KR': {
  'common.fileTypes.pdf': 'PDF 문서',
  'common.fileTypes.doc': 'Word 문서',
  'common.fileTypes.docx': 'Word 문서',
  'common.fileTypes.xls': 'Excel 표',
  'common.fileTypes.xlsx': 'Excel 표',
  'common.fileTypes.ppt': 'PPT',
  'common.fileTypes.pptx': 'PPT',
  'common.fileTypes.txt': '텍스트',
  'common.fileTypes.zip': 'ZIP',
  'common.fileTypes.rar': 'RAR',
  'common.fileTypes.jpg': '이미지',
  'common.fileTypes.png': '이미지',
  'common.fileTypes.gif': 'GIF',
}
```

### 3.4 按钮和操作

```typescript
'ru-RU': {
  'common.save': 'Сохранить',
  'common.cancel': 'Отмена',
  'common.apply': 'Применить',
  'common.close': 'Закрыть (ESC)',
  'common.saving': 'Сохранение...',
  'common.edit': 'Редактировать',
  'common.reset': 'Сбросить',
}

'ko-KR': {
  'common.save': '저장',
  'common.cancel': '취소',
  'common.apply': '적용',
  'common.close': '닫기 (ESC)',
  'common.saving': '저장 중...',
  'common.edit': '편집',
  'common.reset': '초기화',
}
```

### 3.5 变量插值示例

```typescript
'ru-RU': {
  'popup.currentEngine': 'Поисковик: {engine}',
  'options.exportSuccess': 'Экспортировано {count} записей',
  'floatingPanel.applyEngineLabel': 'Применить к {engine}',
  'popup.historyEntry': '{query} в {engine}',
}

'ko-KR': {
  'popup.currentEngine': '현재 엔진: {engine}',
  'options.exportSuccess': '{count}개 내보냄',
  'floatingPanel.applyEngineLabel': '{engine}에 적용',
  'popup.historyEntry': '{engine}에서 {query}',
}
```

---

## 4. 质量保证清单

### 4.1 自动化验证 (必须全部通过)

- [ ] **TypeScript类型检查通过**
  ```bash
  npx tsc --noEmit
  # 预期: 无错误输出
  ```

- [ ] **所有翻译键完整覆盖**
  - 对比 `en-US` 的518个键
  - 确保 `ru-RU` 和 `ko-KR` 都有对应翻译
  - 无缺失键

- [ ] **变量占位符格式验证**
  - 所有 `{变量名}` 在新语言中保持一致
  - 数量和名称完全匹配
  - 语序可调整,但变量名不变

- [ ] **构建成功**
  ```bash
  npm run build
  # 预期:
  # - BUILD SUCCESSFUL
  # - dist/_locales/ru/messages.json 存在
  # - dist/_locales/ko/messages.json 存在
  # - dist/_locales/en/messages.json 存在
  # - dist/_locales/zh_CN/messages.json 存在
  ```

- [ ] **dist目录结构验证**
  ```bash
  ls -la dist/_locales/
  # 预期输出:
  # drwxr-xr-x  en/
  # drwxr-xr-x  zh_CN/
  # drwxr-xr-x  ru/       ← 新增
  # drwxr-xr-x  ko/       ← 新增
  ```

### 4.2 人工审核 (基于对照表)

- [ ] **关键按钮翻译准确** (参考对照表 🔴 区域)
  - 保存/取消/应用/关闭/编辑/重置
  - 确认功能对应正确

- [ ] **错误提示翻译清晰易懂** (参考对照表 🟠 区域)
  - 复制失败/未选择搜索引擎等
  - 用户能理解错误原因

- [ ] **搜索引擎名称翻译正确** (参考对照表 🟡 区域)
  - 保持品牌原名(不翻译)
  - X (Twitter), GitHub, Stack Overflow 等

- [ ] **抽查10%常规文本无明显错误** (参考对照表 🟢 区域)
  - 随机抽取50条左右
  - 检查语法和语义正确性
  - 确保变量插值位置合理

- [ ] **README.md语言列表已更新**
  - 包含 🇷🇺 Русский (ru-RU)
  - 包含 🇰🇷 한국어 (ko-KR)

### 4.3 UI显示测试 (可选,推荐)

- [ ] **俄语文本长度适配**
  - 俄语文本通常比英语长20-30%
  - 检查按钮、菜单、标签是否溢出
  - 特别关注: "Поисковик по умолчанию" 等长文本

- [ ] **韩语字符显示正常**
  - Hangul字符正确渲染
  - 无字体fallback问题
  - 字符高度不影响布局

- [ ] **语言切换功能正常**
  - 在设置中切换到俄语/韩语
  - 界面立即刷新显示新语言
  - 无白屏或加载错误

---

## 5. 成功标准

### 5.1 功能性标准
- ✅ 所有4种语言可正常切换
- ✅ 俄语和韩语界面文本显示正确
- ✅ 变量插值正常工作 (如 `{engine}`, `{count}`)
- ✅ Chrome扩展的manifest名称和描述显示新语言

### 5.2 技术标准
- ✅ TypeScript编译无类型错误
- ✅ 构建成功且无警告
- ✅ 所有翻译键100%覆盖
- ✅ 变量占位符验证通过

### 5.3 质量标准
- ✅ 关键文本(按钮/错误)人工审核通过
- ✅ 翻译简洁,适合UI显示
- ✅ 功能性文本准确无误
- ✅ 文档同步更新完成

### 5.4 发布标准
- ✅ README.md已更新支持语言列表
- ✅ package.json版本号已更新 (如需要)
- ✅ Git commit包含清晰的提交信息
- ✅ 可直接发布到Chrome Web Store

---

## 6. 交付物清单

### 6.1 代码文件 (必须)
1. ✅ `/Users/lhly/chromeex/ssp/src/types/index.ts` (Line 339修改)
2. ✅ `/Users/lhly/chromeex/ssp/public/_locales/ru/messages.json` (新建,14条)
3. ✅ `/Users/lhly/chromeex/ssp/public/_locales/ko/messages.json` (新建,14条)
4. ✅ `/Users/lhly/chromeex/ssp/src/i18n/translations.ts` (添加ru-RU和ko-KR,共1036条)

### 6.2 文档文件 (必须)
5. ✅ `/Users/lhly/chromeex/ssp/.claude/specs/add-russian-korean-i18n/translation-review.md` (对照表)
6. ✅ `/Users/lhly/chromeex/ssp/README.md` (更新语言列表)

### 6.3 验证报告 (推荐)
7. ✅ 构建验证输出日志
8. ✅ TypeScript检查结果截图
9. ✅ 翻译对照表审核结果

---

## 7. 实施注意事项

### 7.1 翻译质量保证
- **专业术语一致性**: 搜索引擎、文件类型等技术术语保持一致
- **上下文准确性**: 基于中英文对照理解功能后翻译,避免直译
- **简洁性优先**: 俄语倾向动词形式,韩语使用名词化动词

### 7.2 变量插值处理
- **严格验证**: 自动检查所有变量名一致性
- **语序灵活**: 允许根据语法调整变量位置
- **示例**:
  ```
  en-US: "Search {query} on {engine}"
  ru-RU: "Искать {query} в {engine}"  ← 语序保持
  ko-KR: "{engine}에서 {query} 검색"  ← 语序调整(韩语后置词结构)
  ```

### 7.3 UI适配建议
- **俄语长文本**: 如遇溢出,优先使用缩写或简洁表达
- **韩语排版**: 韩文字符较方块,行高可能需微调
- **响应式布局**: 确保不同语言文本长度不破坏布局

### 7.4 构建和发布
- **版本号**: 考虑升级到 1.9.0 (新增语言是 minor 版本)
- **Chrome Web Store**: 更新商店列表页的语言支持信息
- **发布说明**: 在Release Notes中明确提及新增俄语和韩语支持

---

## 8. 故障排查指南

### 问题1: TypeScript类型错误
**症状**: `Type '"ru-RU"' is not assignable to type 'Language'`

**解决方案**:
```typescript
// 检查 src/types/index.ts:339
export type Language = 'zh-CN' | 'en-US' | 'ru-RU' | 'ko-KR';
//                                         ^^^^^^^^  ^^^^^^^^ 确保已添加
```

### 问题2: 构建后语言文件未生成
**症状**: `dist/_locales/ru/` 或 `dist/_locales/ko/` 目录不存在

**排查步骤**:
1. 检查 `public/_locales/ru/messages.json` 是否存在
2. 检查 `public/_locales/ko/messages.json` 是否存在
3. 检查 Vite 配置中的 `publicDir` 设置
4. 手动删除 `dist/` 目录后重新构建

### 问题3: 界面显示 `undefined` 或键名
**症状**: 切换到俄语/韩语后显示 `common.save` 而非 "Сохранить"

**排查步骤**:
1. 检查 `translations.ts` 中 `'ru-RU'` 对象是否存在
2. 检查对应的键是否完整
3. 检查是否有拼写错误 (如 `ru-ru` vs `ru-RU`)
4. 在浏览器控制台查看具体错误信息

### 问题4: 变量插值不工作
**症状**: 显示 `"Поисковик: {engine}"` 而非 `"Поисковик: Google"`

**排查步骤**:
1. 检查翻译中 `{engine}` 是否保留
2. 检查变量名拼写是否与 `en-US` 完全一致
3. 检查代码中调用 `t()` 函数时是否传递了 `variables` 参数

---

## 9. 后续优化建议

### 9.1 翻译质量持续改进
- 收集用户反馈,优化翻译准确性
- 建立术语库,确保专业术语一致性
- 定期审查高频文本的翻译质量

### 9.2 技术债务
- 考虑引入 i18n 库 (如 `react-i18next`) 以获得更好的类型支持
- 实现翻译文件的热更新机制
- 添加缺失翻译的自动告警

### 9.3 用户体验增强
- 自动检测用户浏览器语言并设置默认语言
- 提供翻译贡献渠道 (如 GitHub PR)
- 添加 RTL 语言支持 (如阿拉伯语,未来扩展)

---

**规范版本**: 1.0
**最后更新**: 2025-12-03
**状态**: ✅ 已批准,可开始实施
