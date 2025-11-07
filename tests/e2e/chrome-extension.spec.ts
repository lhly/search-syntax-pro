import { test, expect } from '@playwright/test'
import path from 'path'

// Chrome扩展E2E测试
test.describe('SSP Chrome扩展 E2E测试', () => {
  let extensionId: string

  test.beforeAll(async ({ context }) => {
    // 加载Chrome扩展
    const pathToExtension = path.join(__dirname, '../../dist')
    const [extension] = await Promise.all([
      context.waitForEvent('page'), // 等待扩展页面打开
      context.addInitScript(() => {
        // 模拟Chrome扩展API
        window.chrome = {
          storage: {
            local: {
              get: (keys: any, callback: any) => {
                const result = {
                  user_settings: {
                    defaultEngine: 'baidu',
                    language: 'zh-CN',
                    enableHistory: true,
                    theme: 'auto',
                    historyLimit: 1000,
                    autoOpenInNewTab: true
                  }
                }
                callback?.(result)
                return Promise.resolve(result)
              },
              set: (items: any, callback?: any) => {
                console.log('Chrome storage set:', items)
                callback?.()
                return Promise.resolve()
              },
              remove: (keys: any, callback?: any) => {
                console.log('Chrome storage remove:', keys)
                callback?.()
                return Promise.resolve()
              }
            }
          },
          tabs: {
            create: (options: any) => {
              console.log('Chrome tabs create:', options)
              return Promise.resolve({ id: 1 })
            }
          }
        }
      })
    ])

    // 创建扩展页面
    const page = await context.newPage()
    await page.goto(`chrome-extension://${extensionId}/popup.html`)

    // 如果没有实��扩展ID，使用本地HTML文件
    try {
      await page.goto('http://localhost:3000/popup.html')
    } catch {
      // 如果无法访问，直接测试组件
      await page.setContent(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>SSP智能搜索</title>
          <script src="popup.js"></script>
        </head>
        <body>
          <div id="app"></div>
        </body>
        </html>
      `)
    }
  })

  test('应该正确加载扩展界面', async ({ page }) => {
    await page.goto('http://localhost:3000/popup.html')

    // 检查页面标题
    await expect(page).toHaveTitle(/SSP智能搜索/)

    // 检查主要元素存在
    await expect(page.locator('h1')).toContainText('智能搜索')
    await expect(page.locator('input[placeholder*="关键词"]')).toBeVisible()
    await expect(page.locator('select[name="engine"]')).toBeVisible()
  })

  test('应该执行基础搜索流程', async ({ page }) => {
    await page.goto('http://localhost:3000/popup.html')

    // 1. 输入搜索关键词
    await page.fill('input[placeholder*="关键词"]', 'React框架学习')

    // 2. 等待查询预览生成
    await expect(page.locator('.query-preview')).toBeVisible()
    await expect(page.locator('.query-preview')).toContainText('React框架学习')

    // 3. 点击搜索按钮
    await page.click('button:has-text("搜索")')

    // 4. 验证搜索执行（模拟）
    // 在实际环境中会验证新标签页打开
    await expect(page.locator('.search-status')).toBeVisible()
  })

  test('应该展开和使用高级搜索选项', async ({ page }) => {
    await page.goto('http://localhost:3000/popup.html')

    // 1. 点击高级选项展开
    await page.click('button:has-text("高级搜索选项")')

    // 2. 验证高级选项显示
    await expect(page.locator('input[placeholder*="网站"]')).toBeVisible()
    await expect(page.locator('select[name="fileType"]')).toBeVisible()
    await expect(page.locator('input[placeholder*="精确"]')).toBeVisible()

    // 3. 填写网站限制
    await page.fill('input[placeholder*="网站"]', 'react.dev')

    // 4. 选择文件类型
    await page.selectOption('select[name="fileType"]', 'pdf')

    // 5. 输入精确匹配
    await page.fill('input[placeholder*="精确"]', 'React文档')

    // 6. 验证查询预览更新
    await expect(page.locator('.query-preview')).toContainText('site:react.dev')
    await expect(page.locator('.query-preview')).toContainText('filetype:pdf')
    await expect(page.locator('.query-preview')).toContainText('"React文档"')
  })

  test('应该保存和显示搜索历史', async ({ page }) => {
    await page.goto('http://localhost:3000/popup.html')

    // 1. 执行一次搜索
    await page.fill('input[placeholder*="关键词"]', 'Vue.js教程')
    await page.click('button:has-text("搜索")')

    // 2. 模拟页面刷新（重新加载）
    await page.reload()

    // 3. 验证历史记录显示
    await expect(page.locator('.search-history')).toBeVisible()
    await expect(page.locator('.search-history')).toContainText('Vue.js教程')

    // 4. 点击历史记录项
    await page.click('.search-history-item:has-text("Vue.js教程")')

    // 5. 验证搜索参数恢复
    await expect(page.locator('input[placeholder*="关键词"]')).toHaveValue('Vue.js教程')
  })

  test('应该处理搜索错误和验证', async ({ page }) => {
    await page.goto('http://localhost:3000/popup.html')

    // 1. 展开高级选项
    await page.click('button:has-text("高级搜索选项")')

    // 2. 输入无效的网站域名
    await page.fill('input[placeholder*="网站"]', 'invalid-domain')

    // 3. 验证错误信息显示
    await expect(page.locator('.error-message')).toBeVisible()
    await expect(page.locator('.error-message')).toContainText('网站域名格式不正确')

    // 4. 验证搜索按钮被禁用
    await expect(page.locator('button:has-text("搜索")')).toBeDisabled()

    // 5. 修正域名
    await page.fill('input[placeholder*="网站"]', 'example.com')

    // 6. 验证错误信息消失，搜索按钮可用
    await expect(page.locator('.error-message')).not.toBeVisible()
    await expect(page.locator('button:has-text("搜索")')).toBeEnabled()
  })

  test('应该切换搜索引擎', async ({ page }) => {
    await page.goto('http://localhost:3000/popup.html')

    // 1. 切换到Google
    await page.selectOption('select[name="engine"]', 'google')

    // 2. 验证底部状态更新
    await expect(page.locator('.current-engine')).toContainText('GOOGLE')

    // 3. 切换到Bing
    await page.selectOption('select[name="engine"]', 'bing')

    // 4. 验证底部状态更新
    await expect(page.locator('.current-engine')).toContainText('BING')
  })

  test('应该响应键盘快捷键', async ({ page }) => {
    await page.goto('http://localhost:3000/popup.html')

    // 1. 聚焦到关键词输入框
    await page.focus('input[placeholder*="关键词"]')

    // 2. 输入搜索内容
    await page.type('input[placeholder*="关键词"]', 'TypeScript指南')

    // 3. 按Enter键执行搜索
    await page.press('input[placeholder*="关键词"]', 'Enter')

    // 4. 验证搜索执行
    await expect(page.locator('.search-status')).toBeVisible()

    // 5. 测试Ctrl+K快捷键（如果实现）
    await page.keyboard.press('Control+k')
    await expect(page.locator('input[placeholder*="关键词"]')).toBeFocused()
  })

  test('应该处理无障碍功能', async ({ page }) => {
    await page.goto('http://localhost:3000/popup.html')

    // 1. 验证ARIA标签
    await expect(page.locator('[aria-label]')).toHaveCount({ min: 1 })

    // 2. 测试Tab键导航
    await page.keyboard.press('Tab')
    await expect(page.locator('input:focus, button:focus, select:focus')).toBeVisible()

    // 3. 测试键盘导航高级选项
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter') // 打开高级选项

    // 4. 验证高级选项可通过键盘访问
    await expect(page.locator('input[placeholder*="网站"]')).toBeVisible()
    await page.keyboard.press('Tab')
    await expect(page.locator('select[name="fileType"]:focus')).toBeVisible()
  })

  test('应该在移动端正常工作', async ({ page }) => {
    // 模拟移动设备视口
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:3000/popup.html')

    // 1. 验证响应式布局
    await expect(page.locator('body')).toHaveCSS('width', '380px')

    // 2. 验证触摸交互
    await page.tap('input[placeholder*="关键词"]')
    await page.fill('input[placeholder*="关键词"]', '移动端搜索测试')

    // 3. 验证按钮大小适合触摸
    const searchButton = page.locator('button:has-text("搜索")')
    const buttonBox = await searchButton.boundingBox()
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44) // 最小触摸目标

    // 4. 执行搜索
    await page.tap('button:has-text("搜索")')
    await expect(page.locator('.search-status')).toBeVisible()
  })

  test('应该处理极端输入情况', async ({ page }) => {
    await page.goto('http://localhost:3000/popup.html')

    // 1. 测试超长关键词
    const longKeyword = 'a'.repeat(1000)
    await page.fill('input[placeholder*="关键词"]', longKeyword)

    // 2. 验证输入处理
    await expect(page.locator('.query-preview')).toContainText('aaaaaaaa...')

    // 3. 测试特殊字符
    await page.fill('input[placeholder*="关键词"]', '测试特殊字符: !@#$%^&*()[]{}|\\:";\'<>?,./')

    // 4. 验证特殊字符正确编码
    await expect(page.locator('.query-preview')).toBeVisible()

    // 5. 测试Unicode字符
    await page.fill('input[placeholder*="关键词"]', 'Тест на русском языке')
    await expect(page.locator('.query-preview')).toBeVisible()

    // 6. 测试Emoji
    await page.fill('input[placeholder*="关键词"]', 'React框架学习 🚀 ⚛️')
    await expect(page.locator('.query-preview')).toBeVisible()
  })
})

test.describe('性能测试', () => {
  test('应该在合理时间内响应', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('http://localhost:3000/popup.html')

    // 等待页面完全加载
    await page.waitForLoadState('networkidle')

    const loadTime = Date.now() - startTime

    // 验证页面加载时间 < 1秒
    expect(loadTime).toBeLessThan(1000)
  })

  test('应该快速响应搜索输入', async ({ page }) => {
    await page.goto('http://localhost:3000/popup.html')

    const startTime = Date.now()

    // 输入搜索内容
    await page.fill('input[placeholder*="关键词"]', '性能测试')

    // 等待查询预览更新
    await page.waitForSelector('.query-preview')

    const responseTime = Date.now() - startTime

    // 验证响应时间 < 100ms
    expect(responseTime).toBeLessThan(100)
  })
})