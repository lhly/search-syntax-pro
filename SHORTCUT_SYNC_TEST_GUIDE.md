# 快捷键同步修复 - 测试指南

## 快速测试步骤

### 测试 1: 基本同步功能

1. **打开 Options 页面**
   ```
   右键点击扩展图标 → 选项
   ```

2. **修改快捷键目标引擎**
   - 找到 "快捷键设置" 部分
   - 找到 `Ctrl+1` (切换到百度搜索)
   - 点击编辑按钮
   - 在 "目标搜索引擎" 下拉框中选择 "Google"
   - 点击保存

3. **验证 Popup 页面**
   - 点击扩展图标打开 Popup
   - 按下 `Ctrl+1`
   - **预期结果**: 搜索引擎切换到 Google

### 测试 2: 实时同步

1. **保持 Popup 页面打开**
   - 点击扩展图标打开 Popup
   - 不要关闭

2. **在新标签页打开 Options**
   - 右键点击扩展图标 → 选项

3. **修改快捷键**
   - 修改 `Ctrl+2` 的目标引擎为 "Bing"
   - 保存

4. **返回 Popup 页面**
   - 按下 `Ctrl+2`
   - **预期结果**: 切换到 Bing 搜索引擎

### 测试 3: UI 更新验证

1. **打开快捷键帮助**
   - 在 Popup 中按 `?` 键
   - 查看 "引擎切换" 分组下的快捷键

2. **修改配置**
   - 在 Options 页面修改 `Ctrl+3` 的目标引擎

3. **重新打开帮助**
   - 关闭快捷键帮助面板
   - 再次按 `?` 打开
   - **预期结果**: 显示更新后的引擎名称

## 控制台日志验证

打开浏览器开发者工具 (F12),在控制台中应该看到:

### Options 页面修改时:
```
[ShortcutSettings] 保存快捷键配置...
[ShortcutManager] 更新快捷键 switch_engine_1 的目标引擎: google
```

### Popup 页面检测到变化:
```
[ShortcutManager] 检测到快捷键配置变化，正在重新加载...
[ShortcutManager] 快捷键配置重新加载完成
[Popup] 检测到快捷键配置变化，处理器将使用更新后的配置
```

### 按下快捷键时:
```
[ShortcutManager] 执行快捷键 切换到谷歌搜索，参数: google
[App] handleSwitchEngine 被调用，actionParam: google
[App] 使用引擎名称: google
[App] 切换到搜索引擎: google
```

## 常见问题排查

### Q: 修改后按快捷键没有反应?

**排查步骤**:
1. 检查控制台是否有错误日志
2. 确认快捷键在 Options 页面中是启用状态
3. 重新加载扩展: `chrome://extensions/` → 点击刷新按钮

### Q: UI 显示没有更新?

**排查步骤**:
1. 关闭并重新打开 Popup
2. 检查 Options 页面中的配置是否正确保存
3. 查看控制台的存储变化日志

### Q: 功能正常但没有日志输出?

**排查步骤**:
1. 确认开发者工具已打开
2. 检查控制台过滤器设置
3. 重新加载扩展并重试

## 成功标准

所有以下条件都满足,即表示修复成功:

- ✅ Options 页面修改后能保存
- ✅ Popup 页面按快捷键切换到正确的引擎
- ✅ 快捷键帮助面板显示更新后的引擎名称
- ✅ 控制台有完整的日志输出
- ✅ 无错误或警告信息

## 回滚方案

如果修复后出现问题,可以:

1. **临时回滚**:
   ```bash
   git checkout HEAD -- src/services/shortcut-manager.ts
   git checkout HEAD -- src/popup/App.tsx
   git checkout HEAD -- src/components/ShortcutSettings.tsx
   git checkout HEAD -- src/components/ShortcutHint.tsx
   npm run build
   ```

2. **重新加载扩展**:
   - 访问 `chrome://extensions/`
   - 点击扩展的刷新按钮

---

**修复完成日期**: 2025-11-11
**构建状态**: ✅ 通过
**测试建议**: 建议进行完整的回归测试
