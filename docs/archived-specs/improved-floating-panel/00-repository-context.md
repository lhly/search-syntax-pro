# SearchSyntax Pro (SSP) - Repository Context Report

**Generated**: 2025-11-20 08:52:54 (Asia/Shanghai)
**Version**: 1.7.2
**Purpose**: Requirements-driven development - Improved Floating Panel Feature

---

## 📋 Executive Summary

SearchSyntax Pro is a professional Chrome extension for advanced search syntax visualization, supporting 10 search engines with 28+ advanced syntax features. Built with React 18 + TypeScript 5 + Vite 5, following Manifest V3 standards. The codebase demonstrates mature architecture with comprehensive i18n support, storage management, and modular adapter pattern for search engine integration.

---

## 🎯 Project Overview

### Project Type
**Chrome Extension (Manifest V3)** - Browser productivity tool for search enhancement

### Core Purpose
Transform complex search syntax into user-friendly visual interfaces, making advanced search features accessible to all users without memorizing syntax patterns.

### Key Metrics
- **10 Search Engines**: Baidu, Google, Bing, DuckDuckGo, Brave, Yandex, Twitter/X, Reddit, GitHub, Stack Overflow
- **28+ Advanced Syntax**: Site search, file types, exact match, date range, user filters, etc.
- **2 UI Languages**: Chinese (zh-CN), English (en-US)
- **3 Interface Modes**: Popup, Detached Window, Options Page

---

## 🏗️ Technical Architecture

### Technology Stack

#### Core Framework
```yaml
Runtime: TypeScript 5.2.2 (strict mode)
UI Framework: React 18.2.0
Build Tool: Vite 5.0.0
CSS Framework: Tailwind CSS 3.3.6
Testing: Jest 29.7.0 + Playwright 1.40.1
```

#### Chrome Extension Technologies
```yaml
Standard: Manifest V3
Background: Service Worker (ES modules)
Content Scripts: Injected at document_end
Storage: Chrome Storage API (local)
Permissions: storage, activeTab, contextMenus
Host Permissions: Baidu, Google, Bing domains
```

#### Key Dependencies
```yaml
UI Components:
  - @headlessui/react: 2.2.9 (accessible UI)
  - @dnd-kit/core: 6.3.1 (drag & drop)
  - date-fns: 2.30.0 (date manipulation)

Development:
  - @crxjs/vite-plugin: 2.0.0-beta.21 (extension bundling)
  - @types/chrome: 0.0.258 (Chrome API types)
  - ESLint + Prettier (code quality)
```

### Project Structure

```
/Users/lhly/chromeex/ssp/
├── src/                          # Source code
│   ├── background/               # Service worker
│   │   └── index.ts             # Extension lifecycle management
│   ├── content/                  # Content scripts
│   │   ├── index.ts             # Main content script
│   │   └── bing-enhancer/       # Bing-specific enhancements
│   ├── popup/                    # Extension popup UI
│   │   ├── index.html
│   │   ├── main.tsx
│   │   └── App.tsx
│   ├── detached/                 # Standalone window mode
│   │   ├── index.html
│   │   ├── main.tsx
│   │   └── App.tsx (shared with popup)
│   ├── options/                  # Settings page
│   │   ├── index.html
│   │   ├── main.tsx
│   │   └── App.tsx
│   ├── components/               # React components
│   │   ├── SearchForm.tsx       # Main search form
│   │   ├── EngineSelector.tsx   # Engine picker
│   │   ├── TagInput.tsx         # Multi-value input
│   │   ├── QueryPreview.tsx     # Generated query display
│   │   ├── SearchHistory.tsx    # History manager
│   │   ├── SuggestionPanel.tsx  # Smart suggestions
│   │   └── __tests__/           # Component tests
│   ├── services/                 # Business logic
│   │   ├── adapters/            # Search engine adapters
│   │   │   ├── baidu.ts
│   │   │   ├── google.ts
│   │   │   ├── bing.ts
│   │   │   ├── twitter.ts
│   │   │   ├── reddit.ts
│   │   │   ├── github.ts
│   │   │   └── stackoverflow.ts
│   │   ├── storage.ts           # Storage service
│   │   ├── engine-preference.ts # Engine settings
│   │   ├── suggestion-engine.ts # Smart suggestions
│   │   └── template-manager.ts  # Search templates
│   ├── hooks/                    # React hooks
│   │   ├── useStorage.ts        # Storage hook
│   │   └── useTheme.tsx         # Theme management
│   ├── i18n/                     # Internationalization
│   │   ├── index.tsx            # i18n provider
│   │   └── translations.ts      # Translation resources
│   ├── types/                    # TypeScript types
│   │   └── index.ts             # Core type definitions
│   ├── utils/                    # Utilities
│   │   ├── version.ts
│   │   └── migration.ts         # Storage migration
│   ├── config/                   # Configuration
│   ├── data/                     # Static data
│   └── styles/                   # Global styles
├── public/                       # Static assets
│   ├── manifest.json            # Extension manifest
│   └── icons/                   # Extension icons
├── tests/                        # Test files
├── scripts/                      # Build scripts
├── .github/workflows/           # CI/CD pipelines
└── dist/                        # Build output
```

---

## 🔧 Code Patterns & Conventions

### TypeScript Patterns

#### Type System
```typescript
// Strict typing throughout
"strict": true
"noUnusedLocals": true
"noUnusedParameters": true

// Path aliases for clean imports
"@/*": ["src/*"]
"@/components/*": ["src/components/*"]
"@/services/*": ["src/services/*"]
"@/types/*": ["src/types/*"]
"@/utils/*": ["src/utils/*"]
"@/hooks/*": ["src/hooks/*"]
"@/i18n/*": ["src/i18n/*"]
```

#### Core Type Definitions
Located in `/src/types/index.ts`:
- `SearchEngine`: Union type for 10 supported engines
- `SearchParams`: Comprehensive search parameters interface
- `UserSettings`: User preferences with engine order
- `SearchHistory`: Historical search records
- `UIFeatureType`: UI feature flags for engine capabilities
- `SearchEngineAdapter`: Adapter interface for extensibility

### React Component Patterns

#### Component Structure
```typescript
// Functional components with TypeScript
interface ComponentProps {
  // Explicit prop types
  searchParams: SearchParams
  onSearchParamsChange: (params: SearchParams) => void
  // Optional external state control
  showAdvanced?: boolean
  onToggleAdvanced?: (show: boolean) => void
}

export function Component({ /* props */ }: ComponentProps) {
  // Hooks first
  const { t } = useTranslation()
  const { data: settings } = useStorage<UserSettings>('user_settings')

  // State management
  const [localState, setLocalState] = useState(initialValue)

  // Derived values
  const computed = useMemo(() => /* calculation */, [deps])

  // Event handlers
  const handleAction = () => { /* ... */ }

  // Render
  return <div>...</div>
}
```

#### State Management
- **Local State**: `useState` for component-specific state
- **Storage State**: Custom `useStorage` hook for Chrome storage
- **Props Drilling**: Controlled component pattern for forms
- **No Redux/Context**: Lightweight approach for extension scope

### Adapter Pattern for Search Engines

```typescript
// Interface-based extensibility
export interface SearchEngineAdapter {
  buildQuery(params: SearchParams): string
  validateSyntax(syntax: SyntaxType): boolean
  getSupportedSyntax(): SyntaxType[]
  getSupportedFeatures(): UIFeatureType[]
  getBaseUrl(): string
  getName(): string
  // Optional methods
  getLanguageOptions?(): LanguageFieldConfig
  getFeatureGroups?(): EngineFeatureGroups
}

// Factory pattern for adapter creation
export class SearchAdapterFactory {
  static getAdapter(engine: SearchEngine): SearchEngineAdapter {
    // Return appropriate adapter instance
  }
}
```

### Internationalization (i18n)

```typescript
// Translation hook usage
const { t } = useTranslation()

// Key-based translations
t('searchForm.keywordLabel')
t('common.searchEngines.google')

// Parameterized translations
t('contextMenu.searchSelection', undefined, '使用 SearchSyntax Pro 搜索 "%s"')

// Language switching
user_settings.language: 'zh-CN' | 'en-US'
```

### Chrome API Integration

```typescript
// Storage access
await chrome.storage.local.get('user_settings')
await chrome.storage.local.set({ key: value })

// Message passing
chrome.runtime.sendMessage({ action: 'open_search', url })
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {})

// Context menus
chrome.contextMenus.create({ id, title, contexts })
chrome.contextMenus.onClicked.addListener(handler)

// Commands (shortcuts)
chrome.commands.onCommand.addListener((command) => {})
```

---

## 🎨 UI/UX Patterns

### Design System

#### Tailwind CSS Approach
```javascript
// Global utility classes
className="input"  // Standardized input styling
className="btn btn-primary"  // Button variants

// Theme support
darkMode: 'class'  // Dark mode via class toggle

// Custom theme extensions
colors: {
  primary: { 50-900 },  // Blue scale
  gray: { 50-900 }       // Gray scale
}
```

#### Component Hierarchy
1. **Layout Components**: Containers, sections, grids
2. **Form Components**: Inputs, selects, buttons
3. **Display Components**: Preview, history, suggestions
4. **Interactive Components**: Collapsible sections, drag-drop lists

### Responsive Design
- Popup: Fixed 400px width (Chrome extension standard)
- Detached Window: Resizable, state persistence
- Options Page: Full-width responsive layout

### Accessibility
- Semantic HTML elements
- ARIA labels via translations
- Keyboard navigation support
- `@headlessui/react` for accessible components

---

## 📦 Build & Development Workflow

### Development Commands

```bash
# Development mode (hot reload)
npm run dev

# Production build
npm run build

# Type checking
npm run type-check

# Linting & formatting
npm run lint
npm run lint:fix
npm run format

# Testing
npm run test           # Unit tests
npm run test:e2e       # E2E tests

# Packaging
npm run package        # Build + create ZIP
npm run package:only   # Create ZIP from existing build
```

### Build Process

```yaml
Entry Points (vite.config.ts):
  - popup: src/popup/index.html
  - detached: src/detached/index.html
  - options: src/options/index.html
  - background: src/background/index.ts
  - content: src/content/index.ts

Output Structure:
  dist/
    ├── src/popup/index.html
    ├── src/detached/index.html
    ├── src/options/index.html
    ├── background.js
    ├── content.js
    ├── popup.js
    ├── detached.js
    ├── options.js
    ├── icons/
    └── manifest.json (copied from public/)

Post-Build Scripts:
  - scripts/post-build.js: Manifest adjustments
  - scripts/package.js: ZIP creation for store submission
```

### CI/CD Pipeline

```yaml
Workflow: .github/workflows/release.yml

Triggers:
  - Tag push (v*.*.*)  → Full release workflow
  - Main branch push   → Build + test only
  - Pull requests      → Quality checks

Steps:
  1. Build and test
  2. Version consistency check
  3. Generate ZIP package
  4. Create GitHub Release (draft)

Artifacts:
  - ssp-v{version}.zip
  - Build logs
```

---

## 🔌 Integration Points

### Content Script Injection

**Current State**: Feature flag controlled
```typescript
// src/content/index.ts
const FEATURE_FLAGS = {
  enableFloatingButton: false  // Experimental feature disabled
}
```

**Injection Targets**:
- Baidu: www.baidu.com/*
- Google: www.google.com/*
- Bing: www.bing.com/*

**Capabilities**:
- Search query analysis
- Syntax highlighting
- Quick search text selection
- Message communication with background

**Important**: Content scripts run at `document_end` in isolated context

### Background Service Worker

**Responsibilities**:
- Extension lifecycle management
- Storage migration on updates
- Context menu creation/management
- Message routing between components
- Periodic data cleanup

**Key Features**:
- Automatic storage migration on version updates
- Dynamic context menu based on user settings
- Language-aware menu text
- Shortcut command handling

### Chrome Storage Schema

```typescript
ChromeStorageData = {
  search_history: SearchHistory[]
  user_settings: UserSettings
  quick_search_text: string
  quick_search_trigger: number
  app_cache: { timestamp: number, ... }
}
```

**Migration System**: Automatic schema upgrades via `autoMigrateStorage()`

---

## 🎯 Feature Implementation Patterns

### Right-Click Quick Search

**Flow**:
1. User selects text → Right-click → "Search with SSP"
2. Background stores text + timestamp trigger
3. Popup auto-loads text when opened
4. Search form pre-fills and focuses engine selection

**Key Files**:
- Background: `src/background/index.ts` (context menu)
- Popup: `src/popup/App.tsx` (auto-fill logic)
- Storage: Quick search keys in `ChromeStorageData`

### Engine Preference Management

**User-Controlled Ordering**:
```typescript
EnginePreference = {
  engine: SearchEngine
  visible: boolean
  order: number  // Lower = higher priority
}
```

**Services**:
- `EnginePreferenceService.getVisibleEngines()`: Sorted visible list
- Drag-drop UI in options page
- Auto-save to storage

### Multi-Language Support

**Architecture**:
```typescript
// Centralized translations
translations.ts: {
  'zh-CN': { ... },
  'en-US': { ... }
}

// Provider pattern
<I18nProvider language={userSettings.language}>
  <App />
</I18nProvider>

// Hook-based access
const { t, language } = useTranslation()
```

**Coverage**: All UI text, context menus, error messages

---

## 🚨 Constraints & Considerations

### Chrome Extension Limitations

1. **Popup Lifecycle**:
   - Popup closes when user clicks outside
   - State must be persisted to storage
   - No background processes after close

2. **Content Script Isolation**:
   - Separate JavaScript context from page
   - Cannot access page's JS variables directly
   - Must use message passing for communication

3. **Manifest V3 Restrictions**:
   - Service worker instead of background pages
   - No persistent background context
   - Limited executeScript capabilities

4. **Storage Quotas**:
   - 5MB limit for chrome.storage.local
   - Automatic cleanup of 30-day-old data
   - Backup/restore functionality provided

### Performance Considerations

1. **Bundle Size**: Vite code splitting for lazy loading
2. **Storage Access**: Async operations with error handling
3. **Re-renders**: Memoization for expensive computations
4. **Animation**: CSS-based, Tailwind keyframes

### Security

1. **CSP Policy**: `script-src 'self'; object-src 'self'`
2. **Host Permissions**: Limited to search engine domains
3. **No External Scripts**: All code bundled locally
4. **Privacy**: No data transmission to external servers

---

## 📝 Development Best Practices

### Code Standards

```json
// ESLint configuration
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "max-warnings": 0,
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### Testing Strategy

1. **Unit Tests**: Jest + React Testing Library
   - Component rendering
   - User interactions
   - Business logic validation

2. **E2E Tests**: Playwright
   - Extension installation
   - User workflows
   - Chrome API interactions

3. **Type Safety**: TypeScript strict mode
   - No implicit any
   - Exhaustive switch cases
   - Null safety checks

### Git Workflow

```yaml
Branching:
  - main: Production-ready code
  - feature/*: New features
  - fix/*: Bug fixes

Commits:
  - Conventional commits format
  - feat: New features
  - fix: Bug fixes
  - chore: Tooling changes

Versioning:
  - npm version (patch|minor|major)
  - Auto-sync package.json ↔ manifest.json
  - Tag-based releases
```

---

## 🎯 Integration Points for New Features

### Adding Floating Panel Feature

**Recommended Approach**:

1. **Content Script Enhancement**:
   - Leverage existing `src/content/index.ts`
   - Enable `FEATURE_FLAGS.enableFloatingButton`
   - Extend `injectSearchFeatures()` function

2. **Component Structure**:
   ```
   src/content/
     ├── index.ts (entry point)
     ├── floating-panel/
     │   ├── FloatingPanel.tsx (React component)
     │   ├── styles.css (scoped styles)
     │   └── hooks/
     │       ├── usePosition.ts (drag/resize)
     │       └── usePanelState.ts (visibility)
   ```

3. **State Management**:
   - Chrome storage for panel position
   - Message passing for search actions
   - Shared types from `@/types`

4. **UI Rendering in Content Script**:
   ```typescript
   // Create Shadow DOM for isolation
   const container = document.createElement('div')
   const shadow = container.attachShadow({ mode: 'open' })

   // Render React component
   const root = createRoot(shadow)
   root.render(<FloatingPanel />)
   ```

5. **Styling Considerations**:
   - Shadow DOM isolation from page styles
   - Inline critical CSS or use CSS-in-JS
   - Avoid conflicts with Tailwind (if used)

6. **Communication Pattern**:
   ```typescript
   // Content → Background
   chrome.runtime.sendMessage({
     action: 'execute_search',
     params: searchParams
   })

   // Background → Content
   chrome.tabs.sendMessage(tabId, {
     action: 'update_panel_state',
     visible: true
   })
   ```

---

## 📊 Current Feature Status

### Implemented Features (v1.7.2)

- ✅ Visual search syntax builder
- ✅ 10 search engine support
- ✅ Multi-keyword input (sites, file types, exact matches)
- ✅ Search history management
- ✅ Right-click quick search
- ✅ Detached window mode
- ✅ Engine preference ordering (drag-drop)
- ✅ Full i18n support (Chinese + English)
- ✅ Dark mode support
- ✅ Keyboard shortcuts (Ctrl/Cmd+Shift+F)
- ✅ Storage migration system
- ✅ CI/CD automated releases

### Experimental Features (Disabled)

- ⚠️ Floating button on search pages (`enableFloatingButton: false`)
- 📝 Planned: Improved floating panel (current requirement)

### Planned Features (Roadmap)

- 🔜 10 additional universal syntax types
- 🔜 Platform-specific syntax (GitHub, Reddit, Stack Overflow)
- 🔜 Search templates
- 🔜 Advanced query builder
- 🔜 Export/import settings

---

## 🔗 Key Files for Reference

### Must-Read Files
```
/src/types/index.ts              # Core type system
/src/content/index.ts            # Content script structure
/src/background/index.ts         # Extension lifecycle
/src/components/SearchForm.tsx   # Main UI component
/src/services/adapters/*         # Engine adapter examples
/public/manifest.json            # Extension configuration
/vite.config.ts                  # Build configuration
```

### Configuration Files
```
/package.json                    # Dependencies & scripts
/tsconfig.json                   # TypeScript config
/tailwind.config.js              # Styling system
/.eslintrc.json                  # Code quality rules
/.prettierrc                     # Code formatting
```

### Documentation
```
/README.md                       # Project overview
/README.zh-CN.md                 # Chinese documentation
/PRIVACY.md                      # Privacy policy
/docs/*                          # Additional guides
```

---

## 🎓 Learning Resources

### Understanding the Codebase

1. **Start with Types**: Read `/src/types/index.ts` for data models
2. **Explore Adapters**: See pattern in `/src/services/adapters/baidu.ts`
3. **Study Components**: Check `/src/components/SearchForm.tsx` for UI patterns
4. **Review Storage**: Understand persistence in `/src/services/storage.ts`

### Chrome Extension APIs
- [Manifest V3 Guide](https://developer.chrome.com/docs/extensions/mv3/)
- [Content Scripts](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)
- [Service Workers](https://developer.chrome.com/docs/extensions/mv3/service_workers/)
- [Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)

### React Patterns
- Controlled components for forms
- Custom hooks for Chrome storage
- Context-free state management (lightweight approach)

---

## 🚀 Next Steps for Floating Panel Implementation

### Phase 1: Research & Design
1. Review existing content script (`src/content/index.ts`)
2. Analyze disabled floating button implementation
3. Define improved UX requirements
4. Design component architecture

### Phase 2: Core Implementation
1. Create component structure in `src/content/floating-panel/`
2. Implement Shadow DOM rendering
3. Build draggable/resizable panel UI
4. Integrate with existing search system

### Phase 3: Integration & Testing
1. Connect to Chrome storage for state
2. Message passing with background/popup
3. Cross-browser compatibility testing
4. Performance optimization

### Phase 4: Polish & Documentation
1. Accessibility improvements
2. Animation refinements
3. User documentation
4. Code comments and examples

---

## 📧 Contact & Resources

- **Repository**: https://github.com/lhly/search-syntax-pro
- **Issues**: https://github.com/lhly/search-syntax-pro/issues
- **Author**: 冷火凉烟 <lhlyzh@qq.com>
- **License**: MIT

---

**Document Version**: 1.0
**Last Updated**: 2025-11-20
**For**: Improved Floating Panel Feature Development
