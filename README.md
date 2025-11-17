# SearchSyntax Pro

<div align="center">

[![CI](https://github.com/lhly/search-syntax-pro/actions/workflows/release.yml/badge.svg)](https://github.com/lhly/search-syntax-pro/actions/workflows/release.yml)
[![Version](https://img.shields.io/badge/version-1.7.0-blue.svg)](https://github.com/lhly/search-syntax-pro/releases)
[![Edge Add-ons](https://img.shields.io/badge/Edge-Install-blue?logo=microsoft-edge)](https://microsoftedge.microsoft.com/addons/detail/搜索语法大师/jhbaiiccckiclmgmoclidimjfcneeofh)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**English** | [简体中文](README.zh-CN.md)

</div>

**A professional search syntax visualization tool** that supports 10 search engines and 28 advanced search syntax features, making complex searches simple and accessible.

## Why Choose SearchSyntax Pro?

### 📊 Feature Comparison

| Traditional Search | SearchSyntax Pro |
|-------------------|------------------|
| ❌ Limited to basic keywords | ✅ **28 advanced syntax** features for professional search |
| ❌ Requires memorizing complex syntax | ✅ **Visual interface** with zero learning curve |
| ❌ Manual input prone to errors | ✅ **Smart validation** with real-time error correction |
| ❌ Limited to single search engine | ✅ **10 engines** with seamless switching |
| ❌ Incompatible syntax across engines | ✅ **Auto-adaptation** to different engine features |

### 🌟 Core Advantages

**Scale Advantages**:
- 🌐 **10 Search Engines** - 6 general-purpose + 4 specialized platforms
- 🔍 **28 Advanced Syntax** - 14 universal + 14+ platform-specific
- 📄 **13 File Formats** - Full coverage of Office, PDF, images, archives

**Experience Advantages**:
- ⚡ **Zero Learning Curve** - Visual forms replace complex syntax memorization
- 🎯 **Smart Adaptation** - Auto-adjust syntax support based on search engine
- 🔄 **One-Click Switching** - Seamlessly reuse queries across different engines

---

## Features

### 🌐 Powerful Search Engine Support

**10 mainstream search engines** to meet different scenario needs:

| Category | Supported Engines |
|----------|-------------------|
| **General Search** | Baidu, Google, Bing, DuckDuckGo, Brave, Yandex |
| **Specialized Platforms** | Twitter/X, Reddit, GitHub, Stack Overflow |

### 🔍 28 Professional Search Syntax

Search like an expert with precision:

#### **Universal Syntax (14 Types)**

**✅ Implemented (4 Types)**
- **Site Search** (`site:`) - Limit to specific website or domain
- **File Type** (`filetype:`) - Support 13 common formats (PDF, DOCX, XLSX, PPT, images, archives, etc.)
- **Exact Match** (`"..."`) - Complete phrase search without keyword splitting
- **Date Range** - Filter results by publication time

**🔜 Planned (10 Types)**
- **Title Search** (`intitle:`) - Find keywords in page titles
- **URL Search** (`inurl:`) - Find keywords in URLs
- **Exclude Keywords** (`-`) - Filter out unwanted results
- **Logical OR** (`OR` / `|`) - Match any of multiple keywords
- **Body Search** (`intext:`) - Find in page content
- **Number Range** (`..`) - Search within specified numeric range
- **Wildcard** (`*`) - Fuzzy matching for unknown parts
- **All in Title** (`allintitle:`) - All keywords in title
- **Related Sites** (`related:`) - Find similar websites
- **Cache** (`cache:`) - View historical snapshots

#### **Platform-Specific Syntax (14+ Types)**

**Twitter/X Specific (8 Types)**
- `from:@user` - Tweets from specific user
- `to:@user` - Tweets to specific user
- `filter:images/videos/links/media` - Content type filtering
- `min_retweets:N` - Minimum retweet count
- `min_faves:N` - Minimum like count
- `lang:xx` - Language filtering
- Date range and exclude keyword support

**GitHub Specific**
- Repository search, issue filtering, user lookup, etc.

**Reddit Specific**
- Subreddit filtering, author filtering, score filtering, etc.

**Stack Overflow Specific**
- Tag filtering, vote count filtering, answer status filtering, etc.

### 💡 Smart Assistant System

- **Real-time Validation** - Auto-check syntax correctness to avoid search errors
- **Smart Suggestions** - Provide optimization tips based on search engine features
- **Error Prevention** - Friendly error and warning messages

### 📝 User-Friendly Features

- **Search History** - Auto-save and quickly reuse past searches
- **One-Click Copy** - Generated query ready to copy and use
- **Multi-language UI** - Full Chinese and English support
- **Responsive Design** - Adapt to all screen sizes
- **Right-Click Quick Search** - Select text → right-click → instant search with visual syntax builder

### 🪟 Window Management

- **Detached Window Mode** - Dedicated search without occupying browser tabs
- **Keyboard Shortcuts** - `Ctrl+Shift+F` (Win/Linux) or `Cmd+Shift+F` (Mac)
- **Flexible Switching** - Freely switch between popup and detached modes
- **State Persistence** - Auto-save window position and settings

### ⚙️ Personalized Configuration

- **Engine Management** - Customize display order and visibility
- **Drag-and-Drop Sorting** - Intuitive drag-and-drop to reorder
- **Preference Saving** - Remember your choices and configurations
- **Interface Customization** - Hide infrequently used engines to simplify UI

## Technical Architecture

### Core Tech Stack
- **TypeScript 5.x**: Type-safe development experience
- **React 18.x**: Modern UI component development
- **Vite 5.x**: Fast build tooling
- **Tailwind CSS**: Utility-first CSS framework

### Chrome Extension Technologies
- **Manifest V3**: Latest Chrome extension standard
- **Service Worker**: Background service handling
- **Content Scripts**: Page content injection
- **Chrome Storage API**: Local data storage
- **Internationalization**: Complete i18n architecture for multi-language support

### Search Engine Adapters
- **Adapter Pattern**: Extensible search engine architecture
- **Unified Interface**: Consistent API design
- **Specialized Optimization**: Tailored optimizations for different search engines

## Installation

### Browser Extension Store (Recommended)

#### Microsoft Edge
[![Edge Add-ons](https://img.shields.io/badge/Edge-Install-blue?logo=microsoft-edge)](https://microsoftedge.microsoft.com/addons/detail/搜索语法大师/jhbaiiccckiclmgmoclidimjfcneeofh)

Visit [Edge Add-ons Store](https://microsoftedge.microsoft.com/addons/detail/搜索语法大师/jhbaiiccckiclmgmoclidimjfcneeofh) and click "Get" to install.

#### Chrome Web Store
🚧 Chrome Web Store version coming soon!

### Developer Mode Installation

For developers or those wanting the latest development version:

1. Clone the repository
```bash
git clone https://github.com/lhly/search-syntax-pro.git
cd search-syntax-pro
```

2. Install dependencies
```bash
npm install
```

3. Build the project
```bash
npm run build
```

4. Load the extension in your browser

   **Chrome/Edge**:
   - Visit `chrome://extensions/` or `edge://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` directory

## Usage

### Basic Search
1. Click the extension icon to open the search panel
2. Enter your search keywords
3. Select a search engine
4. Click "Search" to view results

### Advanced Search
1. Expand "Advanced Search Options"
2. **Site Search**: Enter domain name (e.g., wikipedia.org)
3. **File Type**: Select specific file format (e.g., PDF, DOCX)
4. **Exact Match**: Enter phrase to match exactly
5. View the generated search query in real-time
6. Click "Search"

### Search History
1. View recent searches in the main interface
2. Click history items to quickly restore search settings
3. Use "Clear History" to clean up records

## Development Guide

### Project Structure
```
src/
├── components/          # React components
├── services/           # Business logic services
│   ├── adapters/       # Search engine adapters
│   └── storage.ts      # Data storage service
├── hooks/              # Custom React Hooks
├── types/              # TypeScript type definitions
├── popup/              # Popup interface
├── options/            # Settings page
├── background/         # Background scripts
└── content/            # Content scripts
```

### Development Commands
```bash
# Development mode (with hot reload)
npm run dev

# Build production version
npm run build

# Type checking
npm run type-check

# Code formatting
npm run format

# Run tests
npm run test

# E2E tests
npm run test:e2e

# Linting
npm run lint
```

### Adding New Search Engines
1. Create new adapter file in `src/services/adapters/`
2. Implement `SearchEngineAdapter` interface
3. Register new adapter in `SearchAdapterFactory`
4. Update search engine types in type definitions

### Customizing UI Theme
1. Modify theme configuration in `tailwind.config.js`
2. Use theme variables in components
3. Test light/dark mode switching

## Testing

### Unit Tests
- Using Jest + React Testing Library
- Coverage of core business logic
- Testing component rendering and interactions

### E2E Tests
- Using Playwright for end-to-end testing
- Simulating real user operations
- Testing Chrome extension functionality

### Running Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test -- SearchForm.test.tsx

# Run E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

## 📦 Release Process

### Automated Release (Recommended)

This project uses GitHub Actions for automated builds and releases.

#### Quick Release New Version

```bash
# 1. Update version (automatically updates package.json and manifest.json)
npm version patch   # Patch version: 1.5.0 -> 1.5.1
npm version minor   # Minor version: 1.5.0 -> 1.6.0
npm version major   # Major version: 1.5.0 -> 2.0.0

# 2. Push code and tags
git push origin main
git push origin --tags

# 3. Wait for GitHub Actions to complete (3-5 minutes)
# Visit https://github.com/lhly/search-syntax-pro/actions to check progress

# 4. Review and publish on Releases page
# Visit https://github.com/lhly/search-syntax-pro/releases

# 5. Download ZIP file and upload to Chrome Web Store
```

#### CI/CD Workflow Description

- **Trigger Conditions**:
  - Tag push (v*.*.*): Triggers full build, test, package, and release workflow
  - Main branch push: Build and test only (no release)
  - Pull Request: Quality checks during code review

- **Automated Steps**:
  1. 🔨 Build and test (type check, lint, unit tests)
  2. ✅ Version consistency verification
  3. 📦 Generate ZIP package
  4. 🚀 Create GitHub Release (draft status)

- **Build Artifacts**:
  - `ssp-v{version}.zip`: Chrome extension package
  - Build logs and test reports

### Manual Release (Traditional Method)

For manual releases:

```bash
# 1. Build project
npm run build

# 2. Package extension
npm run package

# 3. Find generated ZIP file in releases/ directory
ls -lh releases/

# 4. Manually upload to Chrome Web Store
```

## Contributing

### Submitting Code
1. Fork the project
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Code Standards
- Follow ESLint and Prettier configurations
- Add appropriate type annotations
- Write unit tests
- Update relevant documentation

### Issue Reporting
- Use GitHub Issues to report problems
- Provide detailed reproduction steps
- Include browser version and system information

## Privacy Policy

- This extension does not collect any personal user information
- All data is stored only on the user's local device
- No data is transmitted to third-party servers
- Users can clear all locally stored data at any time

## License

This project is open source under the MIT License. See [LICENSE](LICENSE) file for details.

## Changelog

### v1.7.0 (2025-11-13)
- 🪟 **Detached Window Feature**
  - Support for using search in a dedicated window without occupying browser tabs
  - Quick access via keyboard shortcut (`Ctrl+Shift+F` / `Cmd+Shift+F`)
  - Auto-save and restore window state
  - Flexible switching between popup and detached window modes
- 🌐 **Full Internationalization Support**
  - Added English language pack (`en`)
  - Improved multi-language switching experience
  - All UI text supports internationalization
  - Auto-select interface language based on browser language
- 🏪 **Store Release**
  - Officially launched on Microsoft Edge Add-ons Store
  - Completed store assets and user guide documentation

### v1.6.0 (2025-11-12)
- ⚙️ **Search Engine Management**
  - Customize search engine display order
  - Drag-and-drop sorting support
  - Show/hide engine configuration
  - Auto-save user preferences
- 📝 **Documentation Improvements**
  - Added complete Edge store submission guide
  - Added store assets creation guide
  - Improved privacy policy and store listing content
  - Added search engine documentation

### v1.5.0 (2025-11-10)
- 🚀 **Automated CI/CD Workflow**
  - GitHub Actions for automated builds and releases
  - Tag push auto-creates releases
  - Build artifacts auto-packaged as ZIP
- ✅ **Version Management Optimization**
  - Added version consistency check script
  - Auto-verify package.json and manifest.json version sync
- 📝 **Documentation Improvements**
  - Added automated release workflow instructions
  - Added CI status badges
  - Improved contribution guidelines

### v1.0.0 (2025-11-06)
- ✨ Initial release
- 🔍 Support for 10 search engines (Baidu, Google, Bing, DuckDuckGo, Brave, Yandex, Twitter/X, Reddit, GitHub, Stack Overflow)
- 💡 Smart search syntax generation and validation
- 📝 Search history management
- 🌐 Chinese and English UI support
- 🎨 Modern UI design

## Contact

- **Project Homepage**: https://github.com/lhly/search-syntax-pro
- **Issue Tracker**: https://github.com/lhly/search-syntax-pro/issues
- **Email**: lhlyzh@qq.com

---

> **SearchSyntax Pro** - Making advanced search simple and accessible
