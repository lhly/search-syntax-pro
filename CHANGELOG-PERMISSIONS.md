# 🔒 权限配置优化记录

## 📅 优化时间
2025-11-07

## 🎯 优化目标
提高 Chrome Web Store 审核通过率，符合最小权限原则。

---

## ⚠️ 优化前配置（高风险）

### 问题：使用了广泛的主机权限

```json
"host_permissions": [
  "<all_urls>"
]
```

### 风险分析

| 风险级别 | 说明 |
|---------|------|
| 🔴 **审核风险** | `<all_urls>` 是高敏感权限，会触发严格审核 |
| 🔴 **信任问题** | 用户看到"可访问所有网站"会担心隐私 |
| 🔴 **政策违规** | 不符合 Chrome Web Store 最小权限原则 |

---

## ✅ 优化后配置（低风险）

### 解决方案：明确列出需要的域名

```json
"host_permissions": [
  "https://www.baidu.com/*",
  "https://www.google.com/*",
  "https://www.bing.com/*",
  "https://www.sogou.com/*",
  "https://www.so.com/*"
]
```

### 优势分析

| 优势 | 说明 |
|------|------|
| ✅ **审核友好** | 明确的权限范围，降低审核难度 |
| ✅ **用户信任** | 用户清楚知道扩展只在 5 个搜索引擎工作 |
| ✅ **政策合规** | 符合最小权限原则，透明化权限申请 |
| ✅ **功能无损** | 完全满足现有功能需求 |

---

## 🔍 技术验证

### 配置一致性检查

✅ **host_permissions 与 content_scripts.matches 完全一致**

```json
// host_permissions（主机权限）
"host_permissions": [
  "https://www.baidu.com/*",
  "https://www.google.com/*",
  "https://www.bing.com/*",
  "https://www.sogou.com/*",
  "https://www.so.com/*"
]

// content_scripts.matches（内容脚本匹配）
"matches": [
  "https://www.baidu.com/*",
  "https://www.google.com/*",
  "https://www.bing.com/*",
  "https://www.sogou.com/*",
  "https://www.so.com/*"
]
```

### 权限统计

| 配置项 | 数量 | 说明 |
|--------|------|------|
| 基础权限 (permissions) | 4 | storage, activeTab, scripting, contextMenus |
| 主机权限 (host_permissions) | 5 | 5 个搜索引擎域名 |
| Content Scripts 域名 | 5 | 与主机权限一致 ✅ |

---

## 📦 打包验证

### 新版本包信息

```
文件名: releases/ssp-v1.0.0.zip
版本号: v1.0.0
文件大小: 101.59 KB
```

### ZIP 包内容验证

✅ `manifest.json` 已包含优化后的权限配置
✅ 所有域名列表一致
✅ JSON 格式正确
✅ 符合 Manifest V3 规范

---

## 🎯 Chrome Web Store 审核材料

### 更新后的主机权限理由

```
本扩展请求主机权限的理由：

1. 多搜索引擎支持
   - 在百度、谷歌、必应、搜狗、360搜索 5 个主流搜索引擎上提供功能
   - 为每个搜索引擎提供适配的高级语法生成

2. 功能实现
   - 在搜索结果页面注入内容脚本
   - 读取搜索框内容以实现"优化当前搜索"功能
   - 将生成的搜索语法自动填入搜索框

3. 权限范围
   - 仅限于明确列出的 5 个搜索引擎域名
   - 不访问其他网站，不收集用户浏览数据
   - 符合最小权限原则

此权限是扩展核心功能的必要条件。
```

---

## 📊 影响分析

### ✅ 正面影响

1. **审核通过率提升**
   - 从高风险配置改为低风险配置
   - 减少审核人员的疑虑和问询

2. **用户信任度提升**
   - 权限申请更透明
   - 用户清楚扩展的工作范围

3. **政策合规性**
   - 符合 Chrome Web Store 最佳实践
   - 遵循最小权限原则

### ⚠️ 注意事项

1. **未来扩展搜索引擎支持**
   - 如需支持新搜索引擎，需更新 `host_permissions`
   - 同时更新 `content_scripts.matches`
   - 重新发布版本并说明权限变更原因

2. **版本更新流程**
   - 添加新域名前评估必要性
   - 在更新说明中解释权限变更
   - 提前准备审核材料

---

## 🚀 后续维护

### 添加新搜索引擎的流程

1. **评估必要性**
   - 确认用户需求
   - 评估搜索引擎市场份额

2. **更新配置**
   ```json
   // 在两个地方同时添加
   "host_permissions": [
     // 现有域名...
     "https://www.new-search-engine.com/*"  // 新增
   ],
   "content_scripts": [{
     "matches": [
       // 现有域名...
       "https://www.new-search-engine.com/*"  // 新增
     ]
   }]
   ```

3. **更新审核材料**
   - 在权限理由中说明新增搜索引擎
   - 更新"支持的搜索引擎数量"
   - 准备详细的功能说明

4. **版本发布**
   - 更新 `package.json` 版本号
   - 在 CHANGELOG.md 记录变更
   - 重新打包发布

---

## ✅ 最佳实践总结

### Chrome Web Store 审核最佳实践

1. **最小权限原则**
   - ✅ 只申请必要的权限
   - ✅ 使用具体域名代替通配符
   - ✅ 避免 `<all_urls>` 等广泛权限

2. **透明度原则**
   - ✅ 清晰说明每个权限的用途
   - ✅ 提供具体的使用场景
   - ✅ 强调隐私保护措施

3. **一致性原则**
   - ✅ 确保 `host_permissions` 与实际使用一致
   - ✅ 与 `content_scripts.matches` 保持同步
   - ✅ 权限理由与实际功能匹配

4. **用户信任原则**
   - ✅ 让用户了解扩展的工作范围
   - ✅ 说明数据处理方式（本地存储）
   - ✅ 提供隐私政策链接

---

## 📝 相关文档

- [Chrome 扩展权限文档](https://developer.chrome.com/docs/extensions/mv3/declare_permissions/)
- [Chrome Web Store 政策](https://developer.chrome.com/docs/webstore/program_policies/)
- [最小权限原则](https://developer.chrome.com/docs/extensions/mv3/security/#permissions)

---

**SearchSyntax Pro** - 遵循最佳实践，保护用户隐私
