# Round 2 修复验证测试指南

**版本**: v1.6.1
**测试时间**: 2025-11-11

---

## 快速验证清单

### 1. 并发初始化保护测试 (P0)

**测试步骤**:
1. 打开 Chrome DevTools 控制台
2. 快速刷新 Popup 页面 3-5 次
3. 观察控制台日志

**预期结果**:
```
[ShortcutManager] 开始初始化 (scope: popup)
[ShortcutManager] ✓ 注册新的键盘监听器
[ShortcutManager] 初始化完成 (scope: popup)
```

**通过标准**:
- ✅ 每次刷新只看到一组初始化日志
- ✅ 不会出现"等待正在进行的初始化完成"的日志（因为单次刷新）
- ✅ 没有重复注册监听器的警告

---

### 2. Scope 隔离测试 (P0)

**测试步骤**:
1. 同时打开 Popup 和 Options 页面
2. 在控制台过滤 "[ShortcutManager]" 日志
3. 观察初始化 scope

**预期结果**:
```
Popup 页面:
[ShortcutManager] 开始初始化 (scope: popup)

Options 页面:
[ShortcutManager] 开始初始化 (scope: options)
```

**通过标准**:
- ✅ Popup 页面使用 'popup' scope
- ✅ Options 页面使用 'options' scope
- ✅ 两个页面的监听器不会相互干扰

---

### 3. 防抖机制测试 (P1)

**测试步骤**:
1. 打开 Options → 快捷键设置页面
2. 打开控制台，过滤 "[ShortcutManager]" 日志
3. 快速连续修改 3 个快捷键（间隔 < 250ms）
4. 观察"开始重新加载配置"的日志出现次数

**预期结果**:
```
[ShortcutManager] 检测到快捷键配置变化
[ShortcutManager] 检测到快捷键配置变化
[ShortcutManager] 检测到快捷键配置变化
[ShortcutManager] 开始重新加载配置...  // 只出现 1 次
```

**通过标准**:
- ✅ "检测到配置变化"出现 3 次
- ✅ "开始重新加载"只出现 1 次（防抖生效）
- ✅ 最后一次修改后 250ms 才触发重载

---

### 4. React Strict Mode 兼容性测试 (P0)

**测试步骤**:
1. 确保 `src/main.tsx` 中包含 `<React.StrictMode>`
2. 在开发模式下刷新 Popup 页面
3. 观察控制台日志

**预期结果** (开发模式):
```
第一次 mount:
[ShortcutManager] 开始初始化 (scope: popup)
[ShortcutManager] 初始化完成 (scope: popup)

Strict Mode unmount:
(destroy 被调用)

第二次 mount:
[ShortcutManager] 开始初始化 (scope: popup)
[ShortcutManager] 初始化完成 (scope: popup)
```

**通过标准**:
- ✅ 两次初始化都正常完成
- ✅ 没有错误或警告
- ✅ 监听器不会重复注册

---

### 5. 日志增强验证 (P1)

**测试步骤**:
1. 刷新任意页面
2. 观察控制台日志的详细程度

**预期结果**:
```
[ShortcutManager] 开始初始化 (scope: popup)
[ShortcutManager] ✓ 注册新的键盘监听器
[ShortcutManager] 初始化完成 (scope: popup)
```

刷新后再次加载:
```
[ShortcutManager] 已初始化 (scope: popup)，跳过重复初始化
```

**通过标准**:
- ✅ 日志包含清晰的步骤标识（✓ 符号）
- ✅ scope 信息明确显示
- ✅ 重复初始化有明确提示

---

## 完整功能回归测试

### 基础功能
- [ ] 快捷键正常触发
- [ ] 搜索执行正常
- [ ] 引擎切换正常
- [ ] 历史记录正常

### 快捷键管理
- [ ] 自定义快捷键保存成功
- [ ] 快捷键冲突检测正常
- [ ] 重置快捷键功能正常
- [ ] 快捷键实时同步正常

### 跨上下文
- [ ] Popup 和 Options 同时打开无冲突
- [ ] Options 修改快捷键，Popup 实时更新
- [ ] Popup 使用快捷键不影响 Options

---

## 性能测试

### 1. 内存泄漏检测
**测试步骤**:
1. 打开 Chrome DevTools → Performance → Memory
2. 录制 heap snapshot
3. 刷新 Popup 10 次
4. 再次录制 heap snapshot
5. 对比两次快照的监听器数量

**通过标准**:
- ✅ 监听器数量保持稳定（1-2 个）
- ✅ 内存增长在合理范围内
- ✅ 没有未清理的定时器

### 2. 防抖性能测试
**测试步骤**:
1. 在 Options 页面快速修改 10 个快捷键
2. 观察控制台日志中"重新加载"的次数
3. 对比修复前后的差异

**通过标准**:
- ✅ 修复前: 10 次重载
- ✅ 修复后: 1 次重载
- ✅ 性能提升约 90%

---

## 自动化测试建议

### 单元测试 (可选)
```typescript
describe('ShortcutManager - 并发初始化', () => {
  it('应该防止并发初始化', async () => {
    const manager = new ShortcutManager();

    // 同时调用 3 次 initialize
    const promises = [
      manager.initialize('popup'),
      manager.initialize('popup'),
      manager.initialize('popup')
    ];

    await Promise.all(promises);

    // 验证只初始化一次
    expect(setupListenersCalls).toBe(1);
  });
});

describe('ShortcutManager - 防抖', () => {
  it('应该防抖重载配置', async () => {
    jest.useFakeTimers();

    // 快速触发 3 次变化
    fireStorageChange();
    fireStorageChange();
    fireStorageChange();

    // 快进 250ms
    jest.advanceTimersByTime(250);

    // 验证只重载一次
    expect(reloadShortcutsCalls).toBe(1);
  });
});
```

---

## 通过标准总结

### 最低通过要求
- ✅ 所有 P0 测试 100% 通过
- ✅ 所有 P1 测试至少 80% 通过
- ✅ 无编译错误或警告
- ✅ 无控制台错误

### 生产就绪标准
- ✅ 所有测试 100% 通过
- ✅ 性能提升可量化（防抖测试）
- ✅ 内存稳定，无泄漏
- ✅ 日志清晰，便于调试

---

**预计测试时间**: 15-20 分钟
**建议测试环境**: Chrome 120+ (开发模式 + 生产模式各测一遍)
**测试完成标准**: 所有测试项通过，质量评分 ≥90/100
