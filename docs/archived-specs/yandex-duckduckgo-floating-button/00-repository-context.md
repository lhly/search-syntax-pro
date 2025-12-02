# Repository Context Report
**Generated**: 2025-12-01
**Project**: SearchSyntax Pro (SSP)
**Version**: 1.8.5

---

## 1. Project Overview

### 1.1 Project Type
**Chrome Extension (Manifest V3)** - A professional search syntax visualization tool

### 1.2 Purpose
SearchSyntax Pro is a browser extension that simplifies advanced search across 17 search engines by providing a visual interface for building complex search queries. It eliminates the need to memorize search syntax by offering an intuitive form-based approach to constructing searches with advanced operators.

### 1.3 Key Statistics
- **Search Engines Supported**: 17 (Baidu, Google, Bing, DuckDuckGo, Brave, Yandex, Twitter/X, Reddit, GitHub, Stack Overflow, Yahoo, Startpage, Ecosia, Qwant, Naver, Sogou, 360 Search)
- **Advanced Syntax Features**: 28+ types
- **File Formats Supported**: 13 common formats
- **Current Version**: 1.8.5
- **Target Browsers**: Chrome, Edge (Chromium-based)
- **Minimum Chrome Version**: 91

---

## 2. Technology Stack

### 2.1 Core Technologies
```yaml
Frontend Framework:
  - React: 18.2.0 (Modern UI development)
  - TypeScript: 5.2.2 (Type-safe development)

Build & Development:
  - Vite: 5.0.0 (Fast build tooling)
  - Node.js: 18.x (Runtime requirement)

Styling:
  - Tailwind CSS: 3.3.6 (Utility-first CSS)
  - PostCSS: 8.4.32 (CSS processing)
  - Autoprefixer: 10.4.16 (Cross-browser compatibility)

Chrome Extension:
  - Manifest Version: V3 (Latest standard)
  - Service Worker: Background processing
  - Content Scripts: Page injection
  - Chrome Storage API: Local data persistence
```

### 2.2 UI/UX Libraries
```yaml
Component Libraries:
  - @headlessui/react: 2.2.9 (Accessible UI components)
  - @dnd-kit/core: 6.3.1 (Drag-and-drop functionality)
  - @dnd-kit/sortable: 10.0.0 (Sortable lists)

Utilities:
  - date-fns: 2.30.0 (Date manipulation)
```

### 2.3 Development Tools
```yaml
Testing:
  - Jest: 29.7.0 (Unit testing)
  - @testing-library/react: 13.4.0 (Component testing)
  - Playwright: 1.40.1 (E2E testing)

Code Quality:
  - ESLint: 8.54.0 (Linting)
  - Prettier: 3.1.0 (Code formatting)
  - TypeScript: 5.2.2 (Type checking)

Build Tools:
  - @crxjs/vite-plugin: 2.0.0-beta.21 (Chrome extension support)
  - @vitejs/plugin-react: 4.1.1 (React integration)
```

---

## 3. Project Structure

### 3.1 Directory Layout
```
ssp/
├── .github/
│   └── workflows/
│       └── release.yml           # CI/CD automation
├── .claude/                      # AI assistant configuration
├── public/
│   ├── manifest.json            # Chrome extension manifest
│   ├── icons/                   # Extension icons
│   └── _locales/                # Internationalization
│       ├── en/messages.json
│       └── zh_CN/messages.json
├── src/
│   ├── background/              # Service worker scripts
│   │   └── index.ts
│   ├── content/                 # Content scripts
│   │   ├── index.ts
│   │   ├── FloatingPanelManager.ts
│   │   └── components/
│   │       ├── TriggerIcon.ts
│   │       ├── ModalOverlay.ts
│   │       └── MessageBridge.ts
│   ├── popup/                   # Extension popup UI
│   │   ├── index.html
│   │   ├── main.tsx
│   │   └── App.tsx
│   ├── detached/                # Detached window mode
│   │   ├── index.html
│   │   ├── main.tsx
│   │   └── App.tsx
│   ├── floating-panel/          # Floating search panel
│   │   ├── index.html
│   │   ├── main.tsx
│   │   └── App.tsx
│   ├── options/                 # Settings page
│   │   ├── index.html
│   │   ├── main.tsx
│   │   └── App.tsx
│   ├── components/              # Shared React components
│   │   ├── SearchForm.tsx
│   │   ├── EngineSelector.tsx
│   │   ├── EngineManager.tsx
│   │   ├── QueryPreview.tsx
│   │   ├── SearchHistory.tsx
│   │   ├── ShortcutSettings.tsx
│   │   └── [28+ components]
│   ├── services/                # Business logic
│   │   ├── adapters/            # Search engine adapters
│   │   │   ├── factory.ts
│   │   │   ├── baidu.ts
│   │   │   ├── google.ts
│   │   │   ├── bing.ts
│   │   │   ├── duckduckgo.ts
│   │   │   ├── yandex.ts
│   │   │   └── [12+ adapters]
│   │   ├── storage.ts
│   │   ├── window-manager.ts
│   │   ├── template-manager.ts
│   │   ├── suggestion-engine.ts
│   │   └── engine-preference.ts
│   ├── hooks/                   # Custom React hooks
│   │   ├── useStorage.ts
│   │   └── useTheme.tsx
│   ├── utils/                   # Utility functions
│   │   ├── url-utils.ts
│   │   ├── syntax-parser.ts
│   │   ├── migration.ts
│   │   └── version.ts
│   ├── types/                   # TypeScript definitions
│   │   ├── index.ts
│   │   ├── template.ts
│   │   ├── suggestion.ts
│   │   └── shortcut.ts
│   ├── i18n/                    # Internationalization
│   │   ├── index.tsx
│   │   └── translations.ts
│   ├── config/                  # Configuration files
│   │   ├── search-engine-selectors.ts
│   │   └── keyboard-shortcuts.ts
│   └── data/                    # Static data
│       └── builtin-templates.ts
├── scripts/                     # Build and utility scripts
│   ├── post-build.js
│   ├── package.js
│   ├── check-version.js
│   └── resize-screenshots.js
├── tests/                       # Test files
│   ├── setup.ts
│   ├── security/
│   └── integration/
├── dist/                        # Build output
├── releases/                    # Packaged releases
├── docs/                        # Documentation
├── screenshots/                 # Store assets
└── store-assets/               # Browser store materials
```

### 3.2 Key Entry Points
```yaml
Extension Entry Points:
  - Popup: src/popup/index.html
  - Detached Window: src/detached/index.html
  - Options Page: src/options/index.html
  - Floating Panel: src/floating-panel/index.html
  - Background: src/background/index.ts
  - Content Script: src/content/index.ts

Configuration Files:
  - Manifest: public/manifest.json
  - TypeScript: tsconfig.json
  - Vite: vite.config.ts
  - Tailwind: tailwind.config.js
  - ESLint: .eslintrc.json
  - Jest: jest.config.js
  - Playwright: playwright.config.ts
```

---

## 4. Architecture Patterns

### 4.1 Adapter Pattern (Search Engines)
**Purpose**: Provide unified interface for 17 different search engines

```typescript
interface SearchEngineAdapter {
  // Core Methods
  buildQuery(params: SearchParams): string
  validateSyntax(syntax: SyntaxType): boolean
  getSupportedSyntax(): SyntaxType[]
  getBaseUrl(): string
  getName(): string

  // Optional Methods
  validateParams?(params: SearchParams): ValidationResult | Promise<ValidationResult>
  getSearchSuggestions?(params: SearchParams): string[]
  isSyntaxSupported?(syntax: SyntaxType): boolean
  degradeSyntax?(params: SearchParams): SearchParams

  // UI Feature Support
  getSupportedFeatures(): UIFeatureType[]
  getFeatureGroups?(): EngineFeatureGroups
  getLanguageOptions?(): LanguageFieldConfig
}
```

**Adapter Factory Pattern**:
- Single entry point: `SearchAdapterFactory`
- Singleton instances per engine
- Lazy initialization
- Type-safe engine selection

**Example Adapters**:
- `BaiduAdapter`: Chinese market optimization
- `GoogleAdapter`: Comprehensive syntax support
- `DuckDuckGoAdapter`: Privacy-focused features
- `YandexAdapter`: Russian/Cyrillic optimization
- `TwitterAdapter`: Platform-specific filters
- `GitHubAdapter`: Code search specialization

### 4.2 Component Architecture
**React Component Hierarchy**:
```
App (Root)
├── SearchForm (Main interface)
│   ├── EngineSelector (Engine selection)
│   ├── TagInput (Multi-value inputs)
│   ├── QueryPreview (Real-time preview)
│   └── SuggestionPanel (Smart suggestions)
├── SearchHistory (Recent searches)
├── EngineManager (Drag-drop reordering)
└── ShortcutSettings (Keyboard shortcuts)
```

**Component Patterns**:
- Functional components with hooks
- Custom hooks for shared logic (`useStorage`, `useTheme`)
- Headless UI for accessibility
- Collapsible sections for advanced options

### 4.3 State Management
**Storage Strategy**:
```typescript
Chrome Storage (chrome.storage.local):
  - search_history: SearchHistory[]
  - user_settings: UserSettings
  - app_cache: { timestamp, ...data }
  - quick_search_text: string
  - quick_search_trigger: number
  - trigger_button_position: TriggerButtonPosition

Local State (React useState):
  - Form inputs
  - UI state (collapsed sections, etc.)
  - Validation errors/warnings
```

### 4.4 Message Communication
**Content Script ↔ Background**:
- Chrome runtime messaging
- Context menu integration
- Window management

**Content Script ↔ Floating Panel (iframe)**:
```typescript
interface FloatingPanelMessageEnvelope {
  source: 'ssp-content' | 'ssp-iframe'
  message: FloatingPanelMessage
  timestamp: number
}

Message Types:
  - FLOATING_PANEL_OPEN
  - FLOATING_PANEL_CLOSE
  - FLOATING_PANEL_APPLY_SYNTAX
  - FLOATING_PANEL_READY
  - FLOATING_PANEL_FILL_INPUT
```

---

## 5. Code Conventions & Standards

### 5.1 TypeScript Configuration
```json
{
  "target": "ES2020",
  "module": "ESNext",
  "strict": true,
  "jsx": "react-jsx",
  "moduleResolution": "bundler",
  "baseUrl": ".",
  "paths": {
    "@/*": ["src/*"],
    "@/components/*": ["src/components/*"],
    "@/services/*": ["src/services/*"],
    "@/types/*": ["src/types/*"],
    "@/utils/*": ["src/utils/*"],
    "@/hooks/*": ["src/hooks/*"],
    "@/i18n/*": ["src/i18n/*"]
  }
}
```

### 5.2 Naming Conventions
```yaml
Files:
  - Components: PascalCase (SearchForm.tsx)
  - Services: camelCase (storage.ts)
  - Types: camelCase (index.ts)
  - Utils: kebab-case (url-utils.ts)
  - Tests: *.test.ts or *.test.tsx

Code:
  - Interfaces: PascalCase (SearchEngineAdapter)
  - Types: PascalCase (SearchEngine, SyntaxType)
  - Functions: camelCase (buildQuery, validateSyntax)
  - Constants: UPPER_SNAKE_CASE (STORAGE_KEYS, DEFAULT_SETTINGS)
  - Components: PascalCase (SearchForm, EngineSelector)
  - Hooks: camelCase with 'use' prefix (useStorage, useTheme)
```

### 5.3 Code Quality Standards
```yaml
ESLint Rules:
  - No unused variables (errors ignored with '_' prefix)
  - No explicit 'any' (warning)
  - Prefer const over let
  - No var declarations
  - React hooks rules enforced

Testing Coverage:
  - Branches: 80%
  - Functions: 80%
  - Lines: 80%
  - Statements: 80%

Type Safety:
  - Strict mode enabled
  - No unused locals/parameters
  - No fallthrough in switch cases
```

### 5.4 Component Patterns
```typescript
// Functional Component with Props
interface ComponentProps {
  prop1: string
  prop2?: number
  onAction?: () => void
}

export function Component({ prop1, prop2, onAction }: ComponentProps) {
  // Hooks at top
  const [state, setState] = useState<Type>()
  const customValue = useCustomHook()

  // Event handlers
  const handleAction = () => {
    // ...
  }

  // Return JSX
  return (
    <div>
      {/* ... */}
    </div>
  )
}
```

### 5.5 Adapter Implementation Pattern
```typescript
// Each adapter must:
// 1. Implement SearchEngineAdapter interface
// 2. Support multi-keyword syntax (sites[], fileTypes[], exactMatches[])
// 3. Maintain backward compatibility with single values
// 4. Provide UI feature declarations
// 5. Include validation with i18n support

export class EngineAdapter implements SearchEngineAdapter {
  getName(): string { /* ... */ }
  getBaseUrl(): string { /* ... */ }
  buildQuery(params: SearchParams): string { /* ... */ }
  validateSyntax(syntax: SyntaxType): boolean { /* ... */ }
  getSupportedSyntax(): SyntaxType[] { /* ... */ }
  getSupportedFeatures(): UIFeatureType[] { /* ... */ }
  async validateParams(params: SearchParams): Promise<ValidationResult> { /* ... */ }
}
```

---

## 6. Development Workflow

### 6.1 Available Scripts
```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build            # Build production version
npm run preview          # Preview production build

# Testing
npm test                 # Run unit tests
npm run test:e2e         # Run E2E tests with Playwright
npm run test:coverage    # Run tests with coverage report

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix linting issues
npm run format           # Format code with Prettier
npm run type-check       # TypeScript type checking

# Packaging
npm run package          # Build and create ZIP package
npm run package:only     # Create ZIP from existing build
npm run check-version    # Verify version consistency

# Assets
npm run resize:screenshots  # Resize screenshots for store
npm run resize:logo         # Resize logo assets
npm run resize:all          # Resize all assets
```

### 6.2 Git Workflow
```yaml
Branching Strategy:
  - main: Production-ready code
  - feature/*: New features
  - fix/*: Bug fixes
  - refactor/*: Code improvements

Commit Message Format:
  - feat: New feature
  - fix: Bug fix
  - refactor: Code refactoring
  - chore: Build/tooling changes
  - docs: Documentation updates

Recent Commits:
  - 47f301a: feat: 新增7个搜索引擎适配器并更新相关配置
  - fea71a3: chore: 更新版本号至1.8.1
  - e0bf4e5: fix(TriggerIcon): 添加扩展上下文检查避免无效操作
  - 2e5f502: refactor(搜索组件): 优化搜索参数处理逻辑
  - 0b39914: feat(floating-panel): 新增悬浮按钮功能及高级搜索面板
```

### 6.3 CI/CD Pipeline
```yaml
Triggers:
  - Tag push (v*.*.*): Full release workflow
  - Main branch push: CI validation
  - Pull request: Code review validation

Jobs:
  1. Build and Test:
     - Node.js 18 setup
     - Dependency caching
     - Type checking
     - Linting (continue on error)
     - Unit tests (continue on error)
     - Version consistency check
     - Build extension
     - Upload artifacts (90 day retention)

  2. Package:
     - Download build artifacts
     - Create ZIP package
     - Upload package artifacts

  3. Release (Tag only):
     - Download package
     - Extract version info
     - Generate changelog
     - Create GitHub Release (draft)
     - Attach ZIP files

Permissions:
  - contents: write (for releases)
  - pull-requests: read
```

---

## 7. Testing Strategy

### 7.1 Test Structure
```yaml
Unit Tests (Jest + React Testing Library):
  - Location: src/**/*.test.{ts,tsx}
  - Focus: Component rendering, business logic
  - Coverage: 80% threshold
  - Environment: jsdom

E2E Tests (Playwright):
  - Location: tests/**/*.test.ts
  - Focus: User workflows, integration
  - Browsers: Chromium-based

Test Categories:
  - Component tests: UI components
  - Service tests: Business logic
  - Adapter tests: Search engine adapters
  - Integration tests: Full workflows
  - Security tests: XSS, injection prevention
```

### 7.2 Test Examples
```typescript
// Adapter Test Pattern
describe('YandexAdapter', () => {
  test('builds query with multiple sites', () => {
    const adapter = new YandexAdapter()
    const result = adapter.buildQuery({
      keyword: 'test',
      sites: ['site1.com', 'site2.com']
    })
    expect(result).toContain('(site:site1.com | site:site2.com)')
  })
})

// Component Test Pattern
describe('SearchForm', () => {
  test('renders search input', () => {
    render(<SearchForm />)
    expect(screen.getByPlaceholderText(/enter keywords/i)).toBeInTheDocument()
  })
})
```

---

## 8. Internationalization (i18n)

### 8.1 Language Support
```yaml
Supported Languages:
  - Chinese (Simplified): zh-CN (default)
  - English: en-US

Implementation:
  - Chrome i18n API: chrome.i18n.getMessage()
  - Translation files: public/_locales/{locale}/messages.json
  - Translation helper: src/i18n/translations.ts
```

### 8.2 Translation Pattern
```typescript
// Translation usage
const language = await getCurrentLanguage()
const message = translate(language, 'adapter.validation.keywordRequired')

// Translation file structure
{
  "adapter": {
    "validation": {
      "keywordRequired": "Please enter search keywords",
      "domainInvalid": "Invalid domain format"
    }
  }
}
```

---

## 9. Build & Deployment

### 9.1 Build Configuration
```yaml
Vite Configuration:
  - Multi-page build (popup, detached, options, floating-panel)
  - Background and content scripts
  - Output: Single-file bundles (no ES modules)
  - Post-build processing: Inline shared chunks

Build Output (dist/):
  - popup.html, popup.js, popup.css
  - detached.html, detached.js
  - options.html, options.js
  - floating-panel.html, floating-panel.js
  - background.js
  - content.js
  - manifest.json
  - icons/
  - _locales/
```

### 9.2 Manifest V3 Configuration
```json
{
  "manifest_version": 3,
  "permissions": ["storage", "activeTab", "contextMenus"],
  "host_permissions": [
    "https://*.baidu.com/*",
    "https://*.bing.com/*",
    "https://cn.bing.com/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [{
    "matches": ["<host_permissions>"],
    "js": ["content.js"],
    "run_at": "document_end"
  }],
  "web_accessible_resources": [{
    "resources": ["icons/*", "src/floating-panel/index.html", "floating-panel.js"],
    "matches": ["<host_permissions>"]
  }]
}
```

### 9.3 Release Process
```bash
# Manual Release
1. Update version: npm version [patch|minor|major]
2. Push code: git push origin main
3. Push tags: git push origin --tags
4. Wait for CI/CD (3-5 minutes)
5. Review draft release on GitHub
6. Download ZIP and upload to Chrome Web Store

# Automated Release (GitHub Actions)
- Tag push triggers full workflow
- Creates draft release with ZIP
- Includes auto-generated changelog
- Requires manual approval to publish
```

---

## 10. Feature Highlights

### 10.1 Core Features
```yaml
Search Capabilities:
  - 17 search engines
  - 28+ advanced syntax types
  - Multi-keyword support (sites, fileTypes, exactMatches)
  - Real-time query preview
  - Smart validation
  - Search suggestions

UI/UX:
  - Popup interface
  - Detached window mode (Ctrl/Cmd+Shift+F)
  - Floating panel on search pages
  - Draggable floating button
  - Right-click context menu
  - Engine drag-and-drop reordering
  - Search history management
  - Template system

Accessibility:
  - Keyboard shortcuts
  - ARIA labels
  - Focus management
  - Screen reader support
```

### 10.2 Advanced Features
```yaml
Floating Panel System:
  - Injected iframe on Baidu/Bing
  - Draggable trigger button
  - Position persistence
  - Message bridge communication
  - Auto-detect current engine
  - Fill from page search input

Engine Management:
  - Customize display order
  - Show/hide engines
  - Preference persistence
  - First visible = default engine

Multi-keyword Support:
  - sites[]: OR combination
  - fileTypes[]: OR combination
  - exactMatches[]: Native parallel
  - Backward compatible with single values
```

---

## 11. Integration Points for New Features

### 11.1 Adding New Search Engine
```typescript
// 1. Create adapter file: src/services/adapters/new-engine.ts
export class NewEngineAdapter implements SearchEngineAdapter {
  getName(): string { return 'New Engine' }
  getBaseUrl(): string { return 'https://example.com/search' }
  buildQuery(params: SearchParams): string { /* ... */ }
  getSupportedSyntax(): SyntaxType[] { return ['site', 'exact'] }
  getSupportedFeatures(): UIFeatureType[] { return ['site', 'exact_match'] }
}

// 2. Register in factory: src/services/adapters/factory.ts
import { NewEngineAdapter } from './new-engine'
// Add case to createAdapter switch

// 3. Update type: src/types/index.ts
export type SearchEngine = 'baidu' | ... | 'new-engine'

// 4. Update getSupportedEngines in factory
```

### 11.2 Adding New Syntax Type
```typescript
// 1. Add to SyntaxType union: src/types/index.ts
export type SyntaxType = ... | 'new_syntax'

// 2. Add to SearchParams interface
export interface SearchParams {
  // ...
  newSyntaxField?: string
}

// 3. Add UI feature type
export type UIFeatureType = ... | 'new_syntax'

// 4. Update adapters to support new syntax
// 5. Update SearchForm component for UI
```

### 11.3 Floating Button Integration
```yaml
Current Implementation:
  - Location: src/content/components/TriggerIcon.ts
  - Manager: src/content/FloatingPanelManager.ts
  - Message Bridge: src/content/components/MessageBridge.ts
  - Supported Sites: Baidu, Bing (cn.bing.com)

Extension Points:
  - Add new site: Update manifest.json host_permissions
  - Add new site: Update content_scripts matches
  - Customize position: Modify TriggerButtonPosition
  - Customize appearance: Update TriggerIcon styles
```

---

## 12. Known Patterns & Practices

### 12.1 Error Handling
```typescript
// Validation Results Pattern
interface ValidationResult {
  isValid: boolean
  errors: string[]      // Blocking errors
  warnings: string[]    // Non-blocking warnings
}

// Storage Error Handling
try {
  const result = await chrome.storage.local.get('key')
  return result.key || defaultValue
} catch (error) {
  console.error('Storage error:', error)
  return defaultValue
}
```

### 12.2 Multi-keyword Support Pattern
```typescript
// Always support both array and single value
const sites = params.sites?.filter(s => s.trim()) ||
              (params.site ? [params.site] : [])

if (sites.length > 0) {
  const siteQuery = sites
    .map(s => `site:${s}`)
    .join(' OR ')
  queryParts.push(sites.length > 1 ? `(${siteQuery})` : siteQuery)
}
```

### 12.3 i18n Pattern
```typescript
// Always get current language asynchronously
async function getCurrentLanguage(): Promise<Language> {
  try {
    const result = await chrome.storage.local.get('user_settings')
    return result.user_settings?.language || 'zh-CN'
  } catch {
    return 'zh-CN'
  }
}

// Use in validation
const language = await getCurrentLanguage()
errors.push(translate(language, 'adapter.validation.keywordRequired'))
```

---

## 13. Constraints & Considerations

### 13.1 Technical Constraints
```yaml
Chrome Extension Limitations:
  - Service worker lifecycle (no long-running processes)
  - Content script isolation (no direct DOM access from background)
  - CSP restrictions (no inline scripts, eval)
  - Storage quota (chrome.storage.local: ~5MB)
  - Host permissions required for content injection

Build Constraints:
  - No ES modules in content/background scripts
  - Shared code must be inlined
  - Manifest V3 requirements
  - Single-file bundle requirement
```

### 13.2 Browser Compatibility
```yaml
Minimum Requirements:
  - Chrome: 91+
  - Edge: 91+ (Chromium-based)
  - Node.js: 18.x (development)

Tested Environments:
  - Chrome/Edge on Windows, macOS, Linux
  - Content injection on Baidu, Bing
```

### 13.3 Performance Considerations
```yaml
Optimization Strategies:
  - Lazy adapter initialization (factory pattern)
  - Component code splitting
  - Chrome storage caching
  - Debounced validation
  - Minimal bundle size

Current Bundle Sizes:
  - Popup: ~150KB
  - Background: ~50KB
  - Content: ~80KB
  - Total: ~280KB (reasonable for extension)
```

---

## 14. Documentation & Resources

### 14.1 Project Documentation
```yaml
Available Docs:
  - README.md: Project overview, installation, usage
  - README.zh-CN.md: Chinese documentation
  - PRIVACY.md: Privacy policy
  - docs/: Additional documentation
  - .github/workflows/release.yml: CI/CD documentation
```

### 14.2 External Resources
```yaml
Official Links:
  - Repository: https://github.com/lhly/search-syntax-pro
  - Issues: https://github.com/lhly/search-syntax-pro/issues
  - Edge Store: https://microsoftedge.microsoft.com/addons/detail/jhbaiiccckiclmgmoclidimjfcneeofh
  - Chrome Store: Coming soon

Contact:
  - Email: lhlyzh@qq.com
  - Author: 冷火凉烟
```

---

## 15. Recent Development Context

### 15.1 Latest Changes (as of 1.8.5)
```yaml
Recent Features:
  - v1.8.x: Added 7 new search engine adapters (Yahoo, Startpage, Ecosia, Qwant, Naver, Sogou, 360)
  - v1.7.0: Detached window feature, full i18n support, Edge store launch
  - v1.6.0: Engine management with drag-drop, preference persistence
  - v1.5.0: Automated CI/CD workflow, version management

Current Status:
  - Working directory: Clean (no uncommitted changes)
  - Main branch: Up to date
  - Recent focus: Multi-engine support expansion
```

### 15.2 Development Priorities
```yaml
Completed:
  ✅ 17 search engines
  ✅ Multi-keyword support (sites[], fileTypes[], exactMatches[])
  ✅ Floating panel system
  ✅ Engine preference management
  ✅ Automated CI/CD
  ✅ Full internationalization

In Progress:
  🔄 Expanding test coverage
  🔄 Chrome Web Store submission

Planned (from README):
  📋 10 additional universal syntax types
  📋 Platform-specific features
  📋 Enhanced suggestion engine
```

---

## 16. Key Takeaways for New Development

### 16.1 Before Starting New Features
```yaml
✅ Must Do:
  1. Read this context document
  2. Review adapter pattern in src/services/adapters/
  3. Check existing similar features
  4. Review type definitions in src/types/index.ts
  5. Understand message communication patterns
  6. Review test examples in src/**/*.test.ts

📚 Reference Implementations:
  - Yandex adapter: src/services/adapters/yandex.ts
  - DuckDuckGo adapter: src/services/adapters/duckduckgo.ts
  - Floating panel: src/content/FloatingPanelManager.ts
  - Multi-keyword support: Check sites[], fileTypes[] usage
```

### 16.2 Common Tasks
```yaml
Adding Search Engine:
  → Follow section 11.1 pattern
  → Test with existing SearchForm
  → Add unit tests
  → Update documentation

Modifying Syntax:
  → Update types first
  → Update all relevant adapters
  → Update SearchForm UI
  → Add validation
  → Add tests

Enhancing Floating Panel:
  → Modify FloatingPanelManager
  → Update message protocol
  → Test on Baidu/Bing
  → Update manifest if needed
```

### 16.3 Quality Checklist
```yaml
Before Committing:
  ☐ npm run type-check (must pass)
  ☐ npm run lint (fix issues)
  ☐ npm run test (aim for 80%+ coverage)
  ☐ npm run build (must succeed)
  ☐ Manual testing in Chrome
  ☐ Check i18n for both languages
  ☐ Update version if needed
  ☐ Write clear commit message
```

---

**End of Repository Context Report**

This document provides a comprehensive foundation for understanding the SearchSyntax Pro codebase and implementing new features like Yandex/DuckDuckGo floating button support. Refer to specific sections as needed during development.
