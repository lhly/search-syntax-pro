# 📤 Microsoft Edge 扩展商店提交完整指南

> **SearchSyntax Pro** - Microsoft Edge Add-ons 发布流程
>
> **版本**: 1.0.0
> **最后更新**: 2025-11-12
> **适用版本**: SearchSyntax Pro v1.6.2

---

## 📑 目录

- [前置准备](#前置准备)
- [提交页面详解](#提交页面详解)
- [填写内容速查](#填写内容速查)
- [审核与发布](#审核与发布)
- [常见问题](#常见问题)
- [检查清单](#检查清单)

---

## 🎯 前置准备

### 第一步：确保所有文件准备就绪

#### 1. 扩展包

```bash
# 构建并打包扩展
npm run package

# 确认生成的文件
ls -lh releases/ssp-v*.zip

# 应该看到：
# releases/ssp-v1.6.2.zip
```

**文件位置**: `releases/ssp-v1.6.2.zip`
**大小要求**: < 100MB
**格式要求**: ZIP 格式

#### 2. 商店资产（图片）

```bash
# 如果还没准备截图，先截取关键界面
mkdir screenshots

# 将截图复制到 screenshots/ 目录
# 推荐截图内容：
# - 主界面功能展示
# - 模板选择器（18个专业模板）
# - 高级语法配置
# - 智能建议系统
# - 搜索历史管理
# - 设置页面

# 批量处理到商店规格
npm run resize:all

# 确认处理结果
ls -lh store-assets/
```

**输出目录**: `store-assets/`
**必需文件**:
- 扩展徽标 (300x300)
- 屏幕截图 (1280x800，至少 1 张)

**可选文件**:
- 小促销磁贴 (440x280)
- 大型促销磁贴 (1400x560)

#### 3. 隐私政策

```bash
# 推送隐私政策到 GitHub
git add PRIVACY.md
git commit -m "docs: 添加隐私政策文档"
git push origin main

# 等待推送完成后，确认 URL 可访问
# https://github.com/lhly/search-syntax-pro/blob/main/PRIVACY.md
```

**隐私政策 URL**: `https://github.com/lhly/search-syntax-pro/blob/main/PRIVACY.md`

#### 4. 商店内容文案

参考文档准备完整的描述和搜索词：
- `docs/STORE_LISTING_CONTENT.md` - 完整商店内容
- 中英文描述
- 搜索关键词

---

## 📋 提交页面详解

### 访问提交页面

**URL**: `https://partner.microsoft.com/zh-cn/dashboard/microsoftedge/{product-id}/submission`

**导航路径**:
1. 登录 Microsoft Partner Center
2. 进入 Edge Add-ons
3. 选择你的产品
4. 点击 "新建提交" 或进入现有提交草稿

---

## 1️⃣ 扩展包（Extension Package）

### 📦 上传扩展包

**操作步骤**:
1. 点击 "上传扩展包" / "Upload extension package"
2. 选择文件: `releases/ssp-v1.6.2.zip`
3. 等待上传完成（通常 10-30 秒）
4. 等待自动验证完成

**验证内容**:
- ✅ Manifest.json 格式正确
- ✅ 版本号有效（1.6.2）
- ✅ 所有引用的文件存在
- ✅ 图标文件完整
- ✅ 权限声明合规

### ⚠️ 常见验证错误及解决方案

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| "Manifest 版本不匹配" | package.json 与 manifest.json 版本不一致 | 运行 `npm run check-version` 检查 |
| "图标文件缺失" | icons/ 目录文件不完整 | 确认所有尺寸图标存在 (16/32/48/128) |
| "权限声明违规" | 请求了不必要的权限 | 检查 manifest.json 的 permissions 字段 |
| "文件大小超限" | ZIP 包 > 100MB | 检查是否包含 node_modules 等不必要文件 |

---

## 2️⃣ 可用性（Availability）

### 🌍 市场/地区选择

**推荐配置**:

```
选择方式 1: 全球所有市场 ✅ 推荐
☑️ All markets (Global)

选择方式 2: 特定市场
☑️ 中国大陆 (China)
☑️ 美国 (United States)
☑️ 英国 (United Kingdom)
☑️ 德国 (Germany)
☑️ 日本 (Japan)
☑️ 加拿大 (Canada)
☑️ 澳大利亚 (Australia)
... (根据需要添加)
```

**建议**: 选择 "全球所有市场" 以最大化覆盖范围

### 👁️ 可见性设置

```
⚫ 公开 (Public) ✅ 推荐
   - 所有用户可见
   - 出现在商店搜索结果中
   - 获得最大曝光

○ 隐藏 (Hidden)
   - 仅通过直接链接访问
   - 不出现在搜索结果中
   - 适合内测或企业内部使用

○ 私有 (Private)
   - 仅特定用户可访问
   - 需要提供用户邮箱白名单
```

**推荐**: 选择 "公开 (Public)"

### 📅 发布时间

```
⚫ 审核通过后立即发布 ✅ 推荐
   - 审核通过即上线
   - 用户可立即下载

○ 指定发布日期
   - 选择具体日期和时间
   - 适合配合营销活动
```

**推荐**: 选择 "审核通过后立即发布"

---

## 3️⃣ 属性（Properties）

### 📂 扩展类别

**主类别** (必选):

```
推荐选择:
☑️ 生产力 (Productivity)

原因:
• SearchSyntax Pro 是生产力工具
• 帮助用户提高搜索效率
• 符合工具类扩展定位
```

**副类别** (可选，最多 2 个):

```
可选类别:
☐ 开发者工具 (Developer Tools)
   - 适合: 包含 GitHub、Stack Overflow 搜索功能

☐ 搜索工具 (Search Tools)
   - 适合: 核心功能是搜索增强

☐ 研究 (Research)
   - 适合: 支持学术搜索功能
```

**推荐配置**:
- 主类别: Productivity
- 副类别: Developer Tools, Search Tools

### 🏷️ 扩展标签

**推荐标签** (最多 5-7 个):

```
中文标签:
• 搜索
• 生产力
• 工具
• 开发者
• 学术
• 效率
• 研究

英文标签:
• Search
• Productivity
• Tools
• Developer
• Academic
• Efficiency
• Research
```

**填写格式**: 用逗号或分号分隔，或每行一个

---

## 4️⃣ 定价和可用性（Pricing & Availability）

### 💰 定价模式

**推荐选择**:

```
⚫ 免费 (Free) ✅ 强烈推荐

原因:
1. 项目是开源的 (MIT License)
2. 无内购或订阅功能
3. 利于快速推广和获取用户
4. 建立用户基础和口碑
5. 降低用户安装门槛

○ 付费 (Paid)
   - 需要设置价格
   - 需要支付处理
   - 不适合当前阶段

○ 免费增值 (Freemium)
   - 基础功能免费
   - 高级功能收费
   - 需要额外开发
```

**当前配置**: 免费 (Free)

---

## 5️⃣ 隐私政策（Privacy Policy）

### 🔐 隐私政策 URL

**必填字段** ⭐ 非常重要

**填写内容**:

```
https://github.com/lhly/search-syntax-pro/blob/main/PRIVACY.md
```

**验证步骤**:
1. 在浏览器中打开上述 URL
2. 确认页面可正常访问
3. 检查内容完整（中英文版本都有）
4. 确认无 404 错误

**隐私政策要点**:
- ✅ 明确说明不收集个人信息
- ✅ 说明数据仅本地存储
- ✅ 列出所需权限及用途
- ✅ 提供联系方式
- ✅ 符合 GDPR 和 CCPA 标准

**文件位置**: 项目根目录下的 `PRIVACY.md`

---

## 6️⃣ 年龄分级（Age Rating）

### 🔞 内容分级

**推荐选择**:

```
⚫ 适合所有年龄 (For all ages) ✅ 推荐
   ESRB: Everyone / PEGI: 3+

原因:
• 扩展是纯搜索工具
• 无暴力、色情、赌博内容
• 无用户生成内容
• 无社交互动功能
• 适合所有用户使用

○ 青少年 (Teen)
   - 不适用

○ 成人 (Mature)
   - 不适用
```

**当前配置**: 适合所有年龄 (Everyone)

**内容声明**:
- ❌ 无暴力内容
- ❌ 无成人内容
- ❌ 无赌博内容
- ❌ 无恐怖内容
- ❌ 无粗俗语言

---

## 7️⃣ 测试说明（Notes for Certification）

### 📝 给审核人员的说明

**重要性**: ⭐⭐⭐⭐⭐ 非常重要

**推荐内容** (完整版，复制粘贴使用):

```markdown
感谢审核 SearchSyntax Pro！以下是测试指南：

## 📱 核心功能测试

### 基础搜索功能
1. 点击扩展图标或按 `Ctrl+Shift+F` (Mac: `Cmd+Shift+F`) 打开搜索面板
2. 在关键词输入框输入 "React Hooks"
3. 从下拉菜单选择搜索引擎（如 Google 或 GitHub）
4. 点击"执行搜索"按钮
5. **预期结果**: 在新标签页打开相应搜索引擎的搜索结果

### 模板功能测试
1. 在搜索面板中点击"模板"按钮
2. 选择"GitHub 代码搜索"模板
3. **预期结果**: 自动填充搜索参数（引擎、关键词、语言等）
4. 点击"执行搜索"查看结果

### 高级语法测试
1. 点击"展开高级选项"
2. 在 `site:` 字段填写 "github.com"
3. 在文件类型下拉菜单选择 "PDF"
4. 在排除关键词输入 "tutorial"
5. **预期结果**: 实时查询预览显示完整搜索语法
   ```
   React Hooks site:github.com filetype:pdf -tutorial
   ```

### 搜索历史测试
1. 执行几次搜索
2. 打开"搜索历史"面板
3. **预期结果**: 显示最近的搜索记录
4. 点击历史记录中的某一项
5. **预期结果**: 自动填充该搜索的参数

## 🔧 技术规格

### 支持的搜索引擎 (10个)
- Baidu, Google, Bing (传统搜索)
- Twitter, Reddit (社交平台)
- GitHub, Stack Overflow (技术平台)
- DuckDuckGo, Brave, Yandex (隐私/国际)

### 支持的高级语法 (28种)
- 基础: site:, filetype:, exact match, date range
- 高级: intitle:, inurl:, exclude, OR logic, wildcards
- 平台特有: Twitter 过滤器, GitHub 语言筛选

### 内置模板 (18个)
- 学术研究: 学术论文、Google Scholar、最新研究
- 技术开发: GitHub代码、Stack Overflow、技术博客、NPM包
- 新闻资讯: 最新新闻、本周综合
- 社交媒体: Twitter热点、Reddit讨论
- 图片素材: 高清图片、免费商用
- 购物比价: 产品评测、价格对比

## 🛡️ 隐私与安全

### 数据存储
- **所有数据仅存储在本地设备**
- 使用 Chrome Storage API (local storage)
- 不连接任何外部服务器
- 不上传任何用户数据

### 权限说明
| 权限 | 用途 |
|------|------|
| `storage` | 保存搜索历史和用户设置（仅本地） |
| `activeTab` | 在当前标签页执行搜索（不读取内容） |
| `contextMenus` | 提供右键菜单快捷搜索 |

### 安全特性
- ✅ Manifest V3 最新标准
- ✅ Content Security Policy (CSP) 严格配置
- ✅ 无远程代码执行
- ✅ 无第三方跟踪
- ✅ 开源代码可审查

## 📚 开源项目

### 项目信息
- **GitHub**: https://github.com/lhly/search-syntax-pro
- **License**: MIT
- **代码行数**: 12,000+ lines
- **技术栈**: React 18 + TypeScript 5 + Vite 5
- **测试覆盖**: 完整单元测试和 E2E 测试

### 可审查内容
- 完整源代码
- 构建配置
- 测试用例
- 开发文档

## 📞 联系方式

如有任何问题或需要额外信息，请联系：
- **Email**: lhlyzh@qq.com
- **GitHub Issues**: https://github.com/lhly/search-syntax-pro/issues

感谢您的审核！

──────────────────────────────────────────────────

## 🌍 English Version

Thank you for reviewing SearchSyntax Pro! Here's the testing guide:

## 📱 Core Functionality Test

### Basic Search
1. Click extension icon or press `Ctrl+Shift+F` (Mac: `Cmd+Shift+F`) to open panel
2. Enter "React Hooks" in keyword field
3. Select search engine from dropdown (e.g., Google or GitHub)
4. Click "Execute Search" button
5. **Expected**: Search results open in new tab

### Template Feature
1. Click "Template" button in search panel
2. Select "GitHub Code Search" template
3. **Expected**: Auto-fill search parameters
4. Click execute search to see results

### Advanced Syntax
1. Click "Expand Advanced Options"
2. Fill `site:` field with "github.com"
3. Select file type as "PDF"
4. Enter exclude keyword "tutorial"
5. **Expected**: Real-time query preview shows:
   ```
   React Hooks site:github.com filetype:pdf -tutorial
   ```

### Search History
1. Execute several searches
2. Open "Search History" panel
3. **Expected**: Recent searches displayed
4. Click on a history item
5. **Expected**: Auto-fill that search's parameters

## 🔧 Technical Specifications

### Supported Search Engines (10)
- Baidu, Google, Bing (traditional search)
- Twitter, Reddit (social platforms)
- GitHub, Stack Overflow (tech platforms)
- DuckDuckGo, Brave, Yandex (privacy/international)

### Advanced Syntax Support (28 types)
- Basic: site:, filetype:, exact match, date range
- Advanced: intitle:, inurl:, exclude, OR logic, wildcards
- Platform-specific: Twitter filters, GitHub language filters

### Built-in Templates (18)
- Academic: Papers, Google Scholar, Latest research
- Tech: GitHub code, Stack Overflow, Tech blogs, NPM
- News: Latest news, Weekly roundup
- Social: Twitter trends, Reddit discussions
- Media: HD images, Free stock photos
- Shopping: Product reviews, Price comparison

## 🛡️ Privacy & Security

### Data Storage
- **All data stored locally only**
- Uses Chrome Storage API (local storage)
- No external server connections
- No user data uploads

### Permissions Explained
| Permission | Purpose |
|------------|---------|
| `storage` | Save search history and settings (local only) |
| `activeTab` | Execute searches in current tab (no content reading) |
| `contextMenus` | Provide right-click menu shortcuts |

### Security Features
- ✅ Manifest V3 latest standard
- ✅ Strict Content Security Policy (CSP)
- ✅ No remote code execution
- ✅ No third-party tracking
- ✅ Open source code for review

## 📚 Open Source Project

### Project Info
- **GitHub**: https://github.com/lhly/search-syntax-pro
- **License**: MIT
- **Code Lines**: 12,000+
- **Tech Stack**: React 18 + TypeScript 5 + Vite 5
- **Test Coverage**: Full unit and E2E tests

### Reviewable Content
- Complete source code
- Build configurations
- Test cases
- Developer documentation

## 📞 Contact

For questions or additional information:
- **Email**: lhlyzh@qq.com
- **GitHub Issues**: https://github.com/lhly/search-syntax-pro/issues

Thank you for your review!
```

**字数**: 约 1500 字（中英文总计）
**格式**: Markdown 支持，可直接复制粘贴

---

## 📊 填写内容速查表

### 快速参考表

| 部分 | 字段 | 填写内容 | 来源 |
|------|------|---------|------|
| **1. 扩展包** | Extension Package | `releases/ssp-v1.6.2.zip` | 本地文件 |
| **2. 可用性** | Markets | 全球所有市场 (Global) | 选择 |
| | Visibility | 公开 (Public) | 选择 |
| | Publish Timing | 审核通过后立即发布 | 选择 |
| **3. 属性** | Category | Productivity | 选择 |
| | Sub-categories | Developer Tools, Search Tools | 选择 |
| | Tags | 搜索, 生产力, 工具, 开发者, 学术 | 输入 |
| **4. 定价** | Pricing Model | 免费 (Free) | 选择 |
| **5. 隐私** | Privacy Policy URL | `https://github.com/lhly/search-syntax-pro/blob/main/PRIVACY.md` | 输入 |
| **6. 年龄** | Age Rating | 适合所有年龄 (Everyone) | 选择 |
| **7. 测试** | Notes for Cert | 使用上面提供的完整测试说明 | 复制粘贴 |

### Listings 页面内容

| 字段 | 内容来源 | 位置 |
|------|---------|------|
| 扩展名称 | 自动从 manifest.json 读取 | N/A |
| 扩展描述 | `docs/STORE_LISTING_CONTENT.md` | 中文/英文版本 |
| 扩展徽标 | `store-assets/` 目录 | 300x300 PNG |
| 屏幕截图 | `store-assets/` 目录 | 1280x800 PNG (1-6张) |
| 小促销磁贴 | `store-assets/` 目录 | 440x280 PNG (可选) |
| 大促销磁贴 | `store-assets/` 目录 | 1400x560 PNG (可选) |
| YouTube URL | 留空或添加演示视频 | 可选 |
| 搜索词 | `docs/STORE_LISTING_CONTENT.md` | 最多 7 个 |

---

## ✅ 提交前检查清单

### 必需项目

#### 文件准备
- [ ] 扩展包已生成: `releases/ssp-v1.6.2.zip`
- [ ] 扩展包已测试: 在本地 Edge 中加载并验证功能
- [ ] 隐私政策已推送到 GitHub
- [ ] 隐私政策 URL 可访问
- [ ] 商店资产已准备: `store-assets/` 目录有内容

#### Listings 页面
- [ ] 扩展描述已填写 (中文或英文)
- [ ] 扩展徽标已上传 (300x300)
- [ ] 至少 1 张屏幕截图已上传 (1280x800)
- [ ] 搜索词已填写 (最多 7 个)

#### Submission 页面
- [ ] 扩展包已上传并验证通过
- [ ] 市场/地区已选择
- [ ] 可见性已设置为"公开"
- [ ] 类别已选择 (Productivity)
- [ ] 定价已设置为"免费"
- [ ] 隐私政策 URL 已填写
- [ ] 年龄分级已选择 (Everyone)
- [ ] 测试说明已填写

### 可选但推荐

- [ ] 副类别已选择 (Developer Tools, Search Tools)
- [ ] 标签已添加 (5-7 个)
- [ ] 小促销磁贴已上传 (440x280)
- [ ] 大促销磁贴已上传 (1400x560)
- [ ] 多张屏幕截图已上传 (最多 6 张)

### 质量检查

- [ ] 所有英文内容拼写正确
- [ ] 所有中文内容语法正确
- [ ] 截图清晰可见，功能明确
- [ ] 描述准确反映扩展功能
- [ ] 没有夸大宣传或误导性内容
- [ ] 所有链接可正常访问

---

## 🚀 审核与发布

### 提交后流程

#### 1. 提交确认

提交后，你会看到：
```
✅ 提交成功
📧 确认邮件已发送到注册邮箱
⏱️ 预计审核时间: 3-7 个工作日
```

#### 2. 审核阶段

| 阶段 | 状态 | 说明 | 时长 |
|------|------|------|------|
| 1 | 提交中 (Submitting) | 文件上传处理中 | 几分钟 |
| 2 | 待审核 (Pending Review) | 等待审核员处理 | 0-2天 |
| 3 | 审核中 (In Review) | 审核员正在测试 | 1-5天 |
| 4 | 需要修改 (Action Required) | 发现问题，需要修改 | - |
| 5 | 审核通过 (Approved) | 审核通过 | 立即 |
| 6 | 已发布 (Published) | 用户可下载 | 几小时 |

#### 3. 审核通知

**邮件通知**:
- 审核开始
- 审核通过或拒绝
- 需要额外信息

**仪表板通知**:
- 实时状态更新
- 详细反馈信息
- 操作指引

### 审核标准

#### 通过标准 ✅

1. **功能性**: 扩展按描述正常工作
2. **安全性**: 无恶意代码，权限合理
3. **隐私性**: 隐私政策清晰，数据处理透明
4. **质量**: 界面友好，无明显 bug
5. **合规性**: 符合商店政策和法律法规

#### 可能拒绝原因 ❌

| 原因 | 说明 | 解决方案 |
|------|------|---------|
| 功能不工作 | 核心功能无法使用 | 彻底测试并修复 bug |
| 权限过度 | 请求不必要的权限 | 移除多余权限 |
| 隐私政策缺失 | 未提供或不完整 | 添加完整隐私政策 |
| 描述不准确 | 宣传与实际不符 | 修改描述为准确内容 |
| 截图不清晰 | 图片模糊或误导 | 重新截取高清图片 |
| Manifest 错误 | 配置文件有问题 | 修复 manifest.json |
| 违反政策 | 内容或功能违规 | 移除违规内容 |

### 如果被拒绝

#### 处理步骤

1. **查看反馈**
   ```
   - 登录 Partner Center
   - 进入产品页面
   - 查看"审核反馈"部分
   - 仔细阅读拒绝原因
   ```

2. **修复问题**
   ```
   - 根据反馈修改代码或内容
   - 重新构建和打包
   - 本地彻底测试
   - 准备详细的修改说明
   ```

3. **重新提交**
   ```
   - 上传新的扩展包
   - 更新相关内容
   - 在"测试说明"中说明修改内容
   - 提交审核
   ```

4. **主动沟通**
   ```
   - 如有疑问，通过邮件联系审核团队
   - 提供额外说明或演示
   - 保持礼貌和专业
   ```

### 发布后操作

#### 第一周

1. **监控下载和评价**
   - 每天检查下载量
   - 及时回复用户评价
   - 关注 bug 反馈

2. **社交媒体宣传**
   - 在 GitHub README 添加商店链接
   - 发布推广文章
   - 社区分享

3. **收集反馈**
   - 设置反馈渠道
   - 记录用户建议
   - 优先级排序

#### 第一个月

1. **数据分析**
   - 分析下载趋势
   - 用户地区分布
   - 留存率统计

2. **内容优化**
   - 根据数据调整描述
   - 优化搜索词
   - 更新截图

3. **功能迭代**
   - 修复 bug
   - 添加高呼声功能
   - 性能优化

#### 持续运营

1. **定期更新**
   - 每 1-2 个月更新版本
   - 修复已知问题
   - 添加新功能

2. **用户互动**
   - 回复评论和反馈
   - 维护社区
   - 建立用户群

3. **营销推广**
   - 定期宣传
   - 参与相关活动
   - 寻求合作机会

---

## ❓ 常见问题 FAQ

### Q1: 审核需要多长时间？

**A**: 通常 3-7 个工作日，具体取决于：
- 提交时间（工作日 vs 周末）
- 扩展复杂度
- 审核队列长度
- 是否需要额外审查

**加快审核的技巧**:
- 工作日（周一到周四）提交
- 提供详细的测试说明
- 确保所有资料完整准确
- 避免节假日前提交

### Q2: 可以修改已发布的扩展吗？

**A**: 可以，有两种方式：

**方式 1: 更新扩展**
```
1. 修改代码
2. 增加版本号
3. 重新打包
4. 创建新提交
5. 等待审核
```

**方式 2: 更新商店内容**
```
1. 进入产品页面
2. 编辑 Listings 内容
3. 修改描述、截图等
4. 保存更新
5. 无需审核，立即生效
```

### Q3: 扩展被拒绝后怎么办？

**A**: 不要慌，按步骤处理：

1. 仔细阅读拒绝原因
2. 理解问题所在
3. 彻底修复问题
4. 重新测试确认
5. 在测试说明中详细说明修改内容
6. 重新提交审核

**注意**: 大部分被拒绝都是小问题，修复后通常能通过

### Q4: 可以同时提交多个市场吗？

**A**: 可以，推荐做法：

**全球发布** (推荐):
```
☑️ 选择"所有市场"
✅ 一次审核，全球发布
✅ 最大化覆盖
```

**分阶段发布**:
```
第一阶段: 中国、美国、欧洲主要国家
第二阶段: 根据反馈扩展到其他地区
```

### Q5: 如何查看扩展统计数据？

**A**: 在 Partner Center 可查看：

- 下载次数
- 活跃用户数
- 用户评分
- 评论内容
- 地区分布
- 版本分布

**位置**: Dashboard → 你的产品 → Analytics

### Q6: 用户评论差评怎么办？

**A**: 专业处理差评：

1. **及时回复**
   - 24小时内响应
   - 表示感谢和重视

2. **理解问题**
   - 询问详细情况
   - 复现问题

3. **提供解决方案**
   - 给出临时方案
   - 承诺修复时间

4. **跟进改进**
   - 发布修复更新
   - 通知用户更新

5. **邀请修改评价**
   - 礼貌请求更新评分
   - 不强求

### Q7: 可以转移扩展所有权吗？

**A**: 可以，通过 Microsoft 支持：

1. 联系 Microsoft 支持团队
2. 提供转移理由
3. 提供新所有者信息
4. 双方确认
5. Microsoft 处理转移

**注意**: 过程需要 1-2 周

### Q8: 扩展下架后还能恢复吗？

**A**: 分情况：

**主动下架**:
- 可以随时重新上架
- 无需重新审核

**被动下架** (违规):
- 需要修复违规问题
- 重新提交审核
- 可能需要额外审查

### Q9: 如何处理隐私合规问题？

**A**: 确保合规的关键点：

1. **明确的隐私政策**
   - 已提供: `PRIVACY.md`
   - URL 可访问
   - 内容完整

2. **最小权限原则**
   - 只请求必需权限
   - 在描述中说明用途

3. **数据处理透明**
   - 明确说明数据存储方式
   - 不收集不必要的信息

4. **用户控制权**
   - 提供数据导出功能
   - 提供数据删除功能

### Q10: 如何优化商店页面以提高下载量？

**A**: 优化技巧：

1. **标题优化**
   - 包含核心关键词
   - 简洁有力

2. **描述优化**
   - 突出核心价值
   - 使用 bullet points
   - 包含使用场景

3. **截图优化**
   - 第一张最重要
   - 展示核心功能
   - 添加文字标注

4. **搜索词优化**
   - 使用高搜索量关键词
   - 包含同义词
   - 定期更新

5. **评价管理**
   - 鼓励满意用户评价
   - 及时回复所有评论
   - 解决问题后请求更新评分

---

## 📚 相关文档

### 项目文档

- **商店内容文案**: `docs/STORE_LISTING_CONTENT.md`
  - 完整的中英文描述
  - 搜索词建议
  - 竞品对比分析

- **图片处理指南**: `docs/STORE_ASSETS_GUIDE.md`
  - 图片处理脚本使用
  - 截图建议
  - 促销图设计

- **隐私政策**: `PRIVACY.md`
  - 隐私声明
  - 权限说明
  - 联系方式

- **README**: `README.md`
  - 项目介绍
  - 功能特点
  - 安装和使用

### 外部资源

- **Microsoft Edge Add-ons 开发者指南**
  - https://docs.microsoft.com/zh-cn/microsoft-edge/extensions-chromium/

- **商店发布政策**
  - https://docs.microsoft.com/zh-cn/microsoft-edge/extensions-chromium/store-policies/

- **Partner Center 帮助**
  - https://partner.microsoft.com/support

---

## 🎯 总结

### 关键要点

1. **准备充分**: 所有文件和内容在提交前准备完整
2. **测试彻底**: 本地多次测试，确保功能正常
3. **描述准确**: 如实描述功能，不夸大宣传
4. **隐私合规**: 提供清晰的隐私政策
5. **响应及时**: 审核期间关注邮件和通知

### 提交流程概述

```
准备阶段 (1-2天)
  └─ 打包扩展
  └─ 准备截图
  └─ 推送隐私政策
  └─ 准备文案内容

填写阶段 (1-2小时)
  └─ 上传扩展包
  └─ 填写基本信息
  └─ 上传商店资产
  └─ 填写测试说明

审核阶段 (3-7天)
  └─ 等待审核
  └─ 响应反馈
  └─ 修复问题（如有）

发布阶段 (即时)
  └─ 审核通过
  └─ 自动发布
  └─ 用户可下载

运营阶段 (持续)
  └─ 监控数据
  └─ 收集反馈
  └─ 迭代更新
```

### 成功因素

✅ **质量优先**: 确保扩展功能完善、性能优良
✅ **合规第一**: 严格遵守商店政策和隐私法规
✅ **沟通顺畅**: 提供详细信息，及时响应审核
✅ **持续改进**: 根据反馈不断优化和更新
✅ **用户导向**: 关注用户需求，提供优质体验

---

**祝发布顺利！** 🎉

如有任何问题，请参考本文档或联系：
- Email: lhlyzh@qq.com
- GitHub: https://github.com/lhly/search-syntax-pro/issues

---

**文档版本**: 1.0.0
**最后更新**: 2025-11-12
**维护者**: 冷火凉烟 <lhlyzh@qq.com>
