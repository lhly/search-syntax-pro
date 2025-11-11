# 快捷键修复测试指南

## 快速测试步骤

### 1. 重新加载扩展
```bash
# 如果还没构建，先构建
npm run build

# 然后访问 chrome://extensions，点击扩展的"刷新"按钮
```

### 2. 验证监听器注册（核心验证）

**操作**:
1. 打开 Chrome DevTools（F12）
2. 切换到 Console 标签
3. 清空控制台（Ctrl+L 或点击清空按钮）
4. 打开扩展 Popup

**预期结果**:
```
✅ 只看到一条日志：[ShortcutManager] Keyboard listener registered
❌ 不应该看到多条相同的注册日志
```

### 3. 测试快捷键引擎切换

**操作**:
1. 打开 Options 设置页面
2. 找到"快捷键设置"部分
3. 编辑一个引擎切换快捷键（如 Ctrl+1）
4. 选择目标引擎为 **GitHub**
5. 保存配置
6. 关闭 Options，打开 Popup
7. 清空控制台
8. 按下 **Ctrl+1**

**预期结果**:
```
✅ 控制台只显示一次执行日志
✅ 日志显示参数为 'github'
✅ 搜索引擎切换到 GitHub
✅ 不应该看到参数为 'baidu' 或其他旧值的日志
```

### 4. 验证 UI 显示

**操作**:
1. 打开 Options → 快捷键设置
2. 查看引擎切换快捷键的描述文本

**预期结果**:
```
✅ 显示："切换到GitHub搜索"（而非静态的"切换搜索引擎"）
✅ 快捷键显示正确（如 Ctrl+1）
✅ 目标引擎显示正确（→ GitHub）
```

**操作2**:
1. 打开 Popup
2. 点击右上角的 "?" 图标（快捷键帮助）
3. 查看引擎切换快捷键的描述

**预期结果**:
```
✅ 显示："切换到github搜索"（根据配置动态生成）
```

---

## 详细测试场景

### 场景1: 修改引擎后立即生效

**步骤**:
1. Options → 快捷键设置
2. 将 Ctrl+1 的目标引擎设置为 **Google**
3. 保存
4. 打开 Popup（不需要重启）
5. 按 Ctrl+1

**预期**: 切换到 Google

### 场景2: 多次修改配置

**步骤**:
1. 修改 Ctrl+1 → GitHub，保存
2. 测试 ✅
3. 修改 Ctrl+1 → Baidu，保存
4. 测试 ✅
5. 修改 Ctrl+1 → Bing，保存
6. 测试 ✅

**预期**: 每次都切换到正确的引擎

### 场景3: 多个引擎快捷键

**步骤**:
1. 配置 Ctrl+1 → GitHub
2. 配置 Ctrl+2 → Google
3. 配置 Ctrl+3 → Bing
4. 打开 Popup，依次测试

**预期**: 每个快捷键都切换到正确的引擎

---

## 性能测试

### 测试初始化次数

**操作**:
1. 打开 Popup
2. 查看控制台
3. 关闭 Popup
4. 再次打开 Popup
5. 查看控制台

**预期**:
```
第1次打开: 1条 [ShortcutManager] Keyboard listener registered
第2次打开: 1条 [ShortcutManager] Keyboard listener registered
总计: 2条（每次打开一条）
```

---

## 回归测试

确保其他快捷键功能不受影响：

- [ ] Ctrl+Enter - 执行搜索 ✅
- [ ] Ctrl+C - 复制查询 ✅
- [ ] Ctrl+L - 清空表单 ✅
- [ ] Ctrl+T - 打开模板选择器 ✅
- [ ] Ctrl+H - 打开历史记录 ✅
- [ ] ? - 显示快捷键帮助 ✅
- [ ] Escape - 关闭弹窗 ✅
- [ ] Tab / Shift+Tab - 字段导航 ✅

---

## 问题排查

### 如果还是执行两次

1. **检查控制台**: 是否有多条注册日志？
2. **清除缓存**:
   - 卸载扩展
   - 清除浏览器缓存
   - 重新加载扩展
3. **检查构建**: 确认使用了最新的构建文件
4. **检查代码**: 确认修改已生效

### 如果引擎切换不正确

1. **检查存储**:
   ```javascript
   chrome.storage.local.get('custom_shortcuts', console.log)
   ```
2. **检查日志**:
   - 应该看到 `[ShortcutManager] 更新快捷键 xxx 的目标引擎: github`
   - 应该看到 `[App] 使用引擎名称: github`
3. **检查参数**:
   - 控制台应显示正确的 actionParam

---

## 成功标准

全部通过以下检查：

- ✅ 监听器只注册一次
- ✅ 快捷键只执行一次
- ✅ 引擎切换到正确的目标
- ✅ UI 显示正确的引擎名称
- ✅ 修改配置后立即生效
- ✅ 所有快捷键功能正常
- ✅ 无控制台错误
- ✅ 性能无异常

---

## 快速验证命令

在浏览器控制台执行：

```javascript
// 检查存储的快捷键配置
chrome.storage.local.get('custom_shortcuts', (data) => {
  console.log('快捷键配置:', data.custom_shortcuts);
});

// 检查某个快捷键的详细信息
chrome.storage.local.get('custom_shortcuts', (data) => {
  const shortcuts = data.custom_shortcuts || {};
  const switchEngineShortcuts = Object.entries(shortcuts)
    .filter(([, sc]) => sc.action === 'SWITCH_ENGINE')
    .map(([id, sc]) => ({ id, ...sc }));
  console.table(switchEngineShortcuts);
});
```

---

**测试完成后，请在此记录结果：**

- [ ] 测试通过 ✅
- [ ] 测试失败 ❌ (请附上错误信息)
- [ ] 需要进一步调试

**测试人**: ___________
**测试时间**: ___________
**测试结果**: ___________
