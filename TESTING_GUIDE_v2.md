# 第二轮优化测试指南

## 快速测试清单

### 测试环境
- Chrome 浏览器 (版本 88+)
- 已加载 `dist/` 目录作为扩展程序

---

## P0 测试: targetEngine 持久化

### 测试步骤
1. 打开扩展设置页面 (chrome-extension://[id]/src/options/index.html)
2. 找到"引擎切换"分组下的任意快捷键（如 Ctrl+1）
3. 点击"编辑"按钮
4. 修改"目标搜索引擎"（如从百度改为谷歌）
5. 点击"保存"
6. **刷新设置页面**
7. 验证：目标引擎是否保持为谷歌（而非回到百度）

### 期望结果
✅ targetEngine 修改在刷新后依然保留
✅ 控制台无错误信息

### 失败现象（优化前）
❌ 刷新后 targetEngine 恢复为默认值
❌ 用户修改丢失

---

## P1 测试: 性能优化验证

### 测试步骤
1. 打开 Chrome DevTools (F12)
2. 切换到"Console"标签
3. 打开扩展设置页面
4. 观察控制台输出

### 期望结果
✅ 无 "未找到快捷键ID" 警告（除非数据真的损坏）
✅ 页面加载快速（无明显延迟）
✅ 切换编辑状态响应迅速

### 性能对比
- 优化前: 加载时执行 ~225 次字符串比较
- 优化后: 加载时执行 ~15 次 Map 查找（O(1)）

---

## P2 测试: 综合功能测试

### 测试场景1: 修改快捷键
1. 编辑任意快捷键（如"执行搜索"从 Ctrl+Enter 改为 Alt+Enter）
2. 保存后验证显示正确
3. 刷新页面验证持久化

### 测试场景2: 启用/禁用快捷键
1. 切换任意快捷键的启用开关
2. 验证状态立即更新
3. 刷新页面验证持久化

### 测试场景3: 重置快捷键
1. 修改某个快捷键
2. 点击"重置"按钮
3. 验证恢复为默认值

### 测试场景4: 冲突检测
1. 尝试将两个快捷键设置为相同按键
2. 验证显示冲突提示
3. 验证无法保存冲突的快捷键

---

## 调试技巧

### 查看持久化数据
在 DevTools Console 中执行:
```javascript
chrome.storage.local.get('custom_shortcuts', (result) => {
  console.log('Saved shortcuts:', result.custom_shortcuts);
});
```

### 清除所有自定义快捷键
```javascript
chrome.storage.local.remove('custom_shortcuts', () => {
  console.log('Cleared all custom shortcuts');
  location.reload();
});
```

### 验证 ID 映射
在 ShortcutSettings 组件加载时，检查控制台是否有警告:
```
⚠️ [ShortcutSettings] 未找到快捷键ID: key="...", action="..."
```
如果有此警告，说明数据不一致，需要检查配置。

---

## 自动化验证

运行验证脚本:
```bash
node verify-optimization.mjs
```

期望输出:
```
✅ saveCustomShortcuts 方法已包含 targetEngine 比较逻辑
✅ 已添加 updateShortcutEngine 专用方法
✅ 已添加 createShortcutIdMap 辅助函数
...
📊 质量评分: 90%+
```

---

## 回归测试

确保优化没有破坏现有功能:
- ✅ 快捷键在 popup 中正常触发
- ✅ 快捷键帮助面板正常显示
- ✅ 所有引擎切换快捷键正常工作
- ✅ Tab 导航正常工作
- ✅ Escape 关闭面板正常工作

---

## 已知限制

1. 修改的 targetEngine 只影响设置显示，实际引擎切换逻辑需要在 popup 中实现
2. 快捷键冲突检测只在同一作用域内生效
3. 全局快捷键 (Ctrl+Shift+F) 由 Chrome 扩展 API 管理，无法在设置中修改

---

## 问题反馈

如果发现问题，请收集以下信息:
1. Chrome 版本
2. 控制台错误信息
3. 重现步骤
4. 期望行为 vs 实际行为

---

## 测试签署

测试完成后，请确认以下项目:
- [ ] P0: targetEngine 持久化正常
- [ ] P1: 性能优化无警告
- [ ] P2: 所有功能正常工作
- [ ] 回归测试通过
- [ ] 无控制台错误

**测试人员**: _____________  
**测试日期**: _____________  
**测试结果**: ✅ 通过 / ❌ 失败  
**备注**: _________________
