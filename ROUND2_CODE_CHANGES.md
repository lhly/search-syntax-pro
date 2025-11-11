# Round 2 代码改动详细说明

## 文件改动概览

### 改动文件 #1: `/Users/lhly/chromeex/ssp/src/popup/App.tsx`

#### 改动 1: 新增状态变量
**位置**: 第 52-53 行
**代码**:
```typescript
const [showHistory, setShowHistory] = useState(false)
const [showAdvanced, setShowAdvanced] = useState(false)
```

#### 改动 2: 补充快捷键处理器注册
**位置**: 第 111-171 行
**新增代码**:
```typescript
// Round 2: 补充缺失的快捷键处理器
shortcutManager.register('OPEN_HISTORY', () => {
  console.log('快捷键触发: 打开搜索历史')
  setShowHistory(true)
})

shortcutManager.register('COPY_QUERY', async () => {
  if (generatedQuery) {
    try {
      await navigator.clipboard.writeText(generatedQuery)
      console.log('查询已复制到剪贴板:', generatedQuery)
    } catch (error) {
      console.error('复制失败:', error)
    }
  } else {
    console.warn('没有可复制的查询')
  }
})

shortcutManager.register('TOGGLE_ADVANCED', () => {
  console.log('快捷键触发: 切换高级选项')
  setShowAdvanced(prev => !prev)
})

shortcutManager.register('NEXT_FIELD', () => {
  console.log('快捷键触发: 下一个输入框')
  const focusableElements = document.querySelectorAll<HTMLElement>(
    'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled])'
  )
  const currentIndex = Array.from(focusableElements).indexOf(document.activeElement as HTMLElement)
  if (currentIndex >= 0 && currentIndex < focusableElements.length - 1) {
    focusableElements[currentIndex + 1].focus()
  }
})

shortcutManager.register('PREV_FIELD', () => {
  console.log('快捷键触发: 上一个输入框')
  const focusableElements = document.querySelectorAll<HTMLElement>(
    'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled])'
  )
  const currentIndex = Array.from(focusableElements).indexOf(document.activeElement as HTMLElement)
  if (currentIndex > 0) {
    focusableElements[currentIndex - 1].focus()
  }
})

shortcutManager.register('SWITCH_ENGINE', (actionParam) => {
  const engines = SearchAdapterFactory.getSupportedEngines()
  const engineIndex = typeof actionParam === 'number' ? actionParam : 0

  if (engineIndex >= 0 && engineIndex < engines.length) {
    const newEngine = engines[engineIndex]
    const newParams = { ...searchParams, engine: newEngine }
    setSearchParams(newParams)
    generateQuery(newParams)
    console.log(`快捷键切换到搜索引擎: ${newEngine} (索引: ${engineIndex})`)
  } else {
    console.warn(`无效的引擎索引: ${engineIndex}，支持的引擎数量: ${engines.length}`)
  }
})
```

#### 改动 3: 更新 PopupContent props 传递
**位置**: 第 346-349 行
**新增**:
```typescript
showHistory={showHistory}
setShowHistory={setShowHistory}
showAdvanced={showAdvanced}
setShowAdvanced={setShowAdvanced}
```

#### 改动 4: 更新 PopupContentProps 接口
**位置**: 第 375-379 行
**新增**:
```typescript
// Round 2: 新增状态
showHistory: boolean
setShowHistory: (show: boolean) => void
showAdvanced: boolean
setShowAdvanced: (show: boolean) => void
```

#### 改动 5: 更新 PopupContent 函数参数
**位置**: 第 398-401 行
**新增**:
```typescript
showHistory,
setShowHistory,
showAdvanced,
setShowAdvanced
```

#### 改动 6: SearchForm 集成受控状态
**位置**: 第 436-437 行
**新增**:
```typescript
showAdvanced={showAdvanced}
onToggleAdvanced={setShowAdvanced}
```

#### 改动 7: 历史记录模态窗口 UI
**位置**: 第 513-552 行
**新增完整模态窗口**:
```typescript
{/* Round 2: 历史记录模态窗口 */}
{showHistory && (
  <div
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    onClick={() => setShowHistory(false)}
  >
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold">搜索历史 ({getShortcutDisplayText(DEFAULT_SHORTCUTS.open_history.key)})</h2>
        <button
          onClick={() => setShowHistory(false)}
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {history.length > 0 ? (
          <SearchHistoryComponent
            history={history}
            onRestore={(item) => {
              restoreFromHistory(item)
              setShowHistory(false)
            }}
            onClear={() => {
              clearHistory()
              setShowHistory(false)
            }}
          />
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            暂无搜索历史
          </div>
        )}
      </div>
    </div>
  </div>
)}
```

---

### 改动文件 #2: `/Users/lhly/chromeex/ssp/src/components/SearchForm.tsx`

#### 改动 1: 更新 SearchFormProps 接口
**位置**: 第 12-14 行
**新增**:
```typescript
// Round 2: 支持外部控制的高级选项状态
showAdvanced?: boolean
onToggleAdvanced?: (show: boolean) => void
```

#### 改动 2: 更新函数参数和状态逻辑
**位置**: 第 17-28 行
**替换原有代码**:
```typescript
export function SearchForm({
  searchParams,
  onSearchParamsChange,
  showAdvanced: externalShowAdvanced,
  onToggleAdvanced
}: SearchFormProps) {
  const [internalShowAdvanced, setInternalShowAdvanced] = useState(false)
  const { t } = useTranslation()

  // 使用外部状态或内部状态
  const showAdvanced = externalShowAdvanced !== undefined ? externalShowAdvanced : internalShowAdvanced
  const setShowAdvanced = onToggleAdvanced || setInternalShowAdvanced
```

#### 改动 3: 更新 toggleAdvanced 函数
**位置**: 第 46-51 行
**替换原有代码**:
```typescript
const toggleAdvanced = () => {
  if (onToggleAdvanced) {
    onToggleAdvanced(!showAdvanced)
  } else {
    setShowAdvanced(!showAdvanced)
  }
}
```

---

## 代码特性说明

### 1. 错误处理策略
所有新增的快捷键处理器都包含完善的错误处理:

- **COPY_QUERY**: try-catch 捕获剪贴板 API 错误
- **NEXT_FIELD/PREV_FIELD**: 边界检查防止数组越界
- **SWITCH_ENGINE**: 索引范围验证
- **所有处理器**: console 日志用于调试

### 2. 类型安全
- 使用 `SearchAdapterFactory.getSupportedEngines()` 获取引擎列表
- 避免硬编码引擎名称
- 确保与 SearchEngine 类型定义匹配
- TypeScript 编译通过,无类型错误

### 3. 向后兼容性
SearchForm 组件设计:
- 支持受控模式 (传入 showAdvanced prop)
- 支持非受控模式 (不传 prop,使用内部状态)
- 不影响现有代码的使用方式

### 4. UI/UX 增强
- 历史记录模态窗口设计
  - 点击遮罩层关闭
  - 响应式布局 (max-w-2xl, max-h-80vh)
  - 暗黑模式支持
  - 自动关闭 (选择项后)
  - 空状态提示

- SearchForm 高级选项
  - 快捷键与 UI 同步
  - 保持原有的折叠动画
  - 快捷键提示显示

### 5. 调试支持
所有快捷键处理器都包含 console.log:
```typescript
console.log('快捷键触发: XXX')
console.log(`快捷键切换到搜索引擎: ${newEngine}`)
console.warn('没有可复制的查询')
console.error('复制失败:', error)
```

## 测试验证点

### 编译验证
```bash
npm run build
# ✅ TypeScript 编译成功
# ✅ Vite 构建成功
```

### 功能验证清单
- [ ] Ctrl+Shift+H - 打开历史窗口
- [ ] Ctrl+Shift+C - 复制查询 (需要先生成查询)
- [ ] Ctrl+Shift+A - 切换高级选项
- [ ] Tab - 下一个输入框
- [ ] Shift+Tab - 上一个输入框
- [ ] Ctrl+1/2/3/4/5 - 切换引擎

### 边界测试清单
- [ ] 无查询时按 Ctrl+Shift+C (应显示警告)
- [ ] 第一个输入框按 Shift+Tab (不应报错)
- [ ] 最后一个输入框按 Tab (不应报错)
- [ ] 按 Ctrl+6 (超出引擎范围,应显示警告)

## 代码行数统计
- **App.tsx**: +80 行
- **SearchForm.tsx**: +18 行
- **总计**: +98 行

## 依赖关系
新增代码依赖的现有功能:
- `shortcutManager` 服务 (Round 1 已实现)
- `SearchAdapterFactory` (已存在)
- `SearchHistoryComponent` (已存在)
- `getShortcutDisplayText` 工具函数 (已存在)
- `DEFAULT_SHORTCUTS` 配置 (已存在)

无新增外部依赖。
