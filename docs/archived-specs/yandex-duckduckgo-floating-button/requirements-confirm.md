# Requirements Confirmation Document

## 功能名称
Yandex 和 DuckDuckGo 悬浮按钮支持

## 版本信息
- **目标版本**: 1.8.6
- **创建时间**: 2025-12-01
- **需求质量得分**: 95/100 ✅

---

## 原始需求

**用户请求**:
> 请你实施 yandex 和 duckduckgo 的悬浮按钮需求开发

---

## 需求澄清过程

### 第 1 轮澄清 (初始得分: 52/100)

**提出的问题**:
1. 功能范围确认 - 是否完全复制 Baidu/Bing 的悬浮按钮功能？
2. DOM 选择器配置 - 是否需要验证选择器？支持哪些域名变体？
3. 边缘情况和错误处理 - 显示策略、降级方案、国际化要求
4. 测试和验证 - 测试范围和类型
5. 优先级和约束 - 实施顺序、发布计划

### 第 2 轮澄清 (最终得分: 95/100)

**用户回答**:
1. ✅ 功能点与交互逻辑与现有悬浮按钮保持一致，只是要注意不同搜索引擎高级语法的适配有所不同
2. ✅ 需要验证 DOM 选择器，暂时只支持国际版
3. ✅ 仅在搜索结果页显示，DuckDuckGo 的简洁模式和完整模式都需要支持，国际化支持与扩展保持一致
4. ✅ 手动测试
5. ✅ 同时实施，作为新版本 1.8.6 发布

---

## 仓库上下文影响

### 现有基础设施
- ✅ **适配器已存在**: `YandexAdapter` 和 `DuckDuckGoAdapter` 已完整实现
- ✅ **悬浮面板系统**: `FloatingPanelManager`、`TriggerIcon`、`MessageBridge` 已完善
- ✅ **参考实现**: Baidu 和 Bing 的悬浮按钮功能可直接复用
- ✅ **架构模式**: 遵循现有的 Adapter Pattern 和 Message Protocol

### 技术约束
- 📦 **Manifest V3**: 需要更新 host_permissions 和 content_scripts
- 🎨 **React + TypeScript**: 遵循现有代码规范
- 🌐 **i18n**: 使用现有的 zh-CN/en-US 翻译系统
- ⚡ **性能**: 悬浮按钮使用 transform + RAF 优化

---

## 最终确认的需求规格

### 功能需求

#### 1. 核心功能（与 Baidu/Bing 完全一致）
- [x] **可拖动悬浮按钮**
  - 默认位置：右下角
  - 拖动使用 transform（GPU 加速）
  - 位置百分比存储到 chrome.storage.local
  - 窗口 resize 时响应式适配
  - 拖动阈值：5px（防误触）

- [x] **点击交互**
  - 点击打开高级搜索面板（iframe 模态框）
  - ESC 键关闭面板
  - 点击遮罩层关闭面板

- [x] **搜索功能**
  - 自动填充当前搜索框内容到面板
  - 根据用户配置生成高级搜索查询
  - 支持"立即搜索"和"仅填充"两种模式
  - 自动提交搜索表单（如果启用）

#### 2. 关键差异点
- [x] **语法适配**
  - Yandex: 使用 `title:` 和 `url:` 代替 `intitle:` 和 `inurl:`
  - Yandex: 使用 `mime:` 代替 `filetype:`
  - Yandex: 使用 `|` 符号代替 `OR` 关键词
  - Yandex: 支持独特的日期范围语法 `date:YYYYMMDD..YYYYMMDD`
  - DuckDuckGo: 标准语法（site:, filetype:, intitle:, inurl:）
  - DuckDuckGo: 不支持日期范围（dateRange 功能在 UI 中禁用）

### 技术需求

#### 1. DOM 选择器配置
需要验证并配置以下选择器（在 `src/config/search-engine-selectors.ts`）:

```typescript
// Yandex 选择器（需验证）
yandex: {
  searchInputSelector: 'input[name="text"]',
  searchContainerSelector: 'form.search2__form',
  searchFormSelector: 'form.search2__form',
  iconInsertPosition: 'afterend',
  iconOffsetY: '8px',
  isResultsPage: () => window.location.pathname.includes('/search')
}

// DuckDuckGo 选择器（需验证）
duckduckgo: {
  searchInputSelector: 'input#search_form_input',
  searchContainerSelector: 'form#search_form',
  searchFormSelector: 'form#search_form',
  iconInsertPosition: 'afterend',
  iconOffsetY: '8px',
  isResultsPage: () => window.location.search.includes('q=')
}
```

#### 2. Manifest V3 配置更新
需要更新 `public/manifest.json`:

```json
{
  "host_permissions": [
    "https://*.yandex.com/*",
    "https://*.duckduckgo.com/*"
  ],
  "content_scripts": [
    {
      "matches": [
        "https://*.yandex.com/*",
        "https://*.duckduckgo.com/*"
      ]
    }
  ],
  "web_accessible_resources": [
    {
      "matches": [
        "https://*.yandex.com/*",
        "https://*.duckduckgo.com/*"
      ]
    }
  ]
}
```

#### 3. 代码文件修改清单
- **src/config/search-engine-selectors.ts**: 添加 Yandex 和 DuckDuckGo 配置
- **src/content/index.ts**: 更新 `isSearchEnginePage()` 检测逻辑
- **src/content/FloatingPanelManager.ts**: 扩展 `engineKey` 类型定义
- **public/manifest.json**: 添加权限和匹配规则

### 边缘情况和错误处理

#### 1. 显示策略
- ✅ **仅在搜索结果页显示**: 使用 `isResultsPage()` 检测
- ✅ **DOM 加载失败**: 最多重试 3 次，间隔 500ms
- ✅ **搜索框未找到**: 静默失败，记录日志到 console

#### 2. 降级方案
- ✅ **DOM 选择器失败**: 不显示悬浮按钮，不影响其他功能
- ✅ **iframe 加载失败**: 8 秒超时后自动关闭面板
- ✅ **扩展上下文失效**: 捕获 "Extension context invalidated" 错误

#### 3. 跨模式支持
- ✅ **DuckDuckGo 简洁模式**: 确保选择器兼容
- ✅ **DuckDuckGo 完整模式**: 确保选择器兼容
- ✅ **Yandex 国际版**: 仅支持 yandex.com（不支持 yandex.ru）

### 国际化需求

#### 现有翻译复用
- ✅ **悬浮按钮提示**: `content.triggerButtonTooltip`
- ✅ **适配器验证消息**: 复用 `adapter.validation.*` 翻译
- ✅ **错误提示**: 复用现有错误消息翻译

#### 无需新增翻译
- ✅ 所有 UI 文本使用现有 zh-CN/en-US 翻译
- ✅ 不添加俄语支持（Yandex 使用英文界面）

### 测试需求

#### 手动测试清单
1. **Yandex 测试**
   - [ ] 访问 yandex.com 搜索结果页
   - [ ] 验证悬浮按钮显示在右下角
   - [ ] 测试拖动功能和位置保存
   - [ ] 测试点击打开面板
   - [ ] 验证搜索框内容自动填充
   - [ ] 测试各种高级语法组合
   - [ ] 验证生成的查询 URL 正确
   - [ ] 测试自动提交搜索

2. **DuckDuckGo 测试**
   - [ ] 访问 duckduckgo.com 搜索结果页
   - [ ] 验证悬浮按钮显示在右下角
   - [ ] 测试拖动功能和位置保存
   - [ ] 测试点击打开面板
   - [ ] 验证搜索框内容自动填充
   - [ ] 测试各种高级语法组合
   - [ ] 验证生成的查询 URL 正确
   - [ ] 测试自动提交搜索
   - [ ] 测试简洁模式和完整模式兼容性

3. **跨引擎测试**
   - [ ] 验证不同搜索引擎间位置保存独立
   - [ ] 测试在不同搜索引擎间切换
   - [ ] 验证扩展图标和设置页面正常工作

### 发布需求

#### 版本管理
- **版本号**: 1.8.6
- **更新 CHANGELOG**: 记录新增功能
- **更新 README**: 添加 Yandex 和 DuckDuckGo 支持说明

#### 发布清单
- [ ] 更新 `public/manifest.json` 版本号
- [ ] 更新 `package.json` 版本号
- [ ] 更新 CHANGELOG.md
- [ ] 更新 README.md（支持的搜索引擎列表）
- [ ] 构建并测试扩展包
- [ ] 创建 Git tag: v1.8.6
- [ ] 推送到 GitHub 触发自动发布

---

## 需求质量评分

### 最终评分: 95/100 ✅

| 评估维度 | 得分 | 详细说明 |
|---------|------|----------|
| **功能清晰度** | 28/30 | ✅ 用户交互流程完整明确<br>✅ 成功标准清晰定义<br>⚠️ DOM 选择器需要实际验证 |
| **技术特定性** | 23/25 | ✅ 集成点明确（复用现有架构）<br>✅ 技术约束清晰<br>⚠️ 选择器验证后可达满分 |
| **实现完整性** | 24/25 | ✅ 边缘情况全面覆盖<br>✅ 错误处理策略明确<br>✅ 语法适配要求清晰 |
| **业务上下文** | 20/20 | ✅ 用户价值明确<br>✅ 优先级清晰<br>✅ 发布计划完整 |

### 评分说明
- **95 分已达到高质量标准** (目标: ≥90 分)
- **扣除 5 分原因**: DOM 选择器需要实际页面验证
- **验证后可达满分**: 选择器确认后更新文档

---

## 实施准备

### 已准备就绪
- ✅ 需求规格已完整定义
- ✅ 技术方案已明确（复用现有架构）
- ✅ 集成点已识别（4 个文件需修改）
- ✅ 测试策略已确定（手动测试）
- ✅ 发布计划已制定（1.8.6）

### 待执行任务
1. **DOM 选择器验证**: 在实际页面验证选择器准确性
2. **代码实施**: 修改 4 个核心文件
3. **手动测试**: 执行完整测试清单
4. **版本发布**: 更新版本号并发布

---

## 附录：参考信息

### 现有实现参考
- **Baidu 悬浮按钮**: `src/content/FloatingPanelManager.ts`
- **悬浮图标**: `src/content/components/TriggerIcon.ts`
- **消息桥接**: `src/content/components/MessageBridge.ts`
- **Yandex 适配器**: `src/services/adapters/yandex.ts`
- **DuckDuckGo 适配器**: `src/services/adapters/duckduckgo.ts`

### 关键代码模式
```typescript
// 搜索引擎检测模式
function detectSearchEngine(hostname: string): string | null {
  if (hostname.includes('yandex.com')) return 'yandex';
  if (hostname.includes('duckduckgo.com')) return 'duckduckgo';
  return null;
}

// 悬浮按钮初始化模式
async initialize(): Promise<void> {
  this.config = getCurrentEngineConfig();
  this.engineKey = detectSearchEngine(window.location.hostname);
  if (!this.config || !this.engineKey) return;
  await this.injectTriggerIcon();
}
```

---

## 批准状态

**需求确认完成**: ✅
**质量得分**: 95/100
**等待用户批准**: 🔄

**下一步**: 等待用户确认后进入实施阶段（Phase 2）
