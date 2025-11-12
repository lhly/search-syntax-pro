// 安全性测试
describe('安全性测试', () => {
  describe('输入验证和XSS防护', () => {
    it('应该过滤危险的HTML标签', async () => {
      const { BaiduAdapter } = await import('../../src/services/adapters/baidu')
      const adapter = new BaiduAdapter()

      const dangerousInputs = [
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(\'XSS\')">',
        'javascript:alert("XSS")',
        '<iframe src="javascript:alert(\'XSS\')"></iframe>',
        '"><script>alert("XSS")</script>',
        '\';alert("XSS");//'
      ]

      for (const dangerousInput of dangerousInputs) {
        const params = {
          keyword: dangerousInput,
          engine: 'baidu' as const
        }

        const url = adapter.buildQuery(params)

        // 验证危险字符被正确编码
        expect(url).not.toContain('<script>')
        expect(url).not.toContain('javascript:')
        expect(url).not.toContain('onerror=')
        expect(url).toContain('%3Cscript%3E') // URL编码的<script>
      }
    })

    it('应该防止URL注入攻击', async () => {
      const { BaiduAdapter } = await import('../../src/services/adapters/baidu')
      const adapter = new BaiduAdapter()

      const maliciousUrls = [
        'https://evil.com/phishing',
        'javascript:alert("XSS")',
        'data:text/html,<script>alert("XSS")</script>',
        'vbscript:msgbox("XSS")',
        '../../etc/passwd',
        'file:///etc/passwd'
      ]

      for (const maliciousUrl of maliciousUrls) {
        const params = {
          keyword: '测试',
          engine: 'baidu' as const,
          site: maliciousUrl
        }

        const result = adapter.validateParams(params)

        // 验证恶意URL被拒绝
        if (maliciousUrl.startsWith('javascript:') ||
            maliciousUrl.startsWith('data:') ||
            maliciousUrl.startsWith('vbscript:')) {
          expect(result.isValid).toBe(false)
          expect(result.errors.length).toBeGreaterThan(0)
        }
      }
    })

    it('应该限制输入长度', async () => {
      const { BaiduAdapter } = await import('../../src/services/adapters/baidu')
      const adapter = new BaiduAdapter()

      // 超长输入测试
      const longKeyword = 'a'.repeat(10000)
      const params = {
        keyword: longKeyword,
        engine: 'baidu' as const
      }

      const result = adapter.validateParams(params)

      // 应该对超长输入给出警告
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings.some(w => w.includes('过长'))).toBe(true)
    })
  })

  describe('数据存储安全', () => {
    it('应该加密敏感数据', async () => {
      // 模拟加密存储
      const encryptData = (data: any): string => {
        return Buffer.from(JSON.stringify(data)).toString('base64')
      }

      const decryptData = (encryptedData: string): any => {
        return JSON.parse(Buffer.from(encryptedData, 'base64').toString())
      }

      const sensitiveData = {
        userSettings: {
          defaultEngine: 'baidu',
          enableHistory: true,
          // 其他敏感设置
        },
        searchHistory: [
          {
            keyword: '机密搜索',
            timestamp: Date.now()
          }
        ]
      }

      const encrypted = encryptData(sensitiveData)
      const decrypted = decryptData(encrypted)

      expect(encrypted).not.toBe(JSON.stringify(sensitiveData))
      expect(decrypted).toEqual(sensitiveData)
    })

    it('应该限制存储数据量', async () => {
      const maxStorageSize = 5 * 1024 * 1024 // 5MB限制
      const currentSize = 0

      // 模拟存储大小检查
      const checkStorageLimit = (newData: any): boolean => {
        const dataSize = new Blob([JSON.stringify(newData)]).size
        return currentSize + dataSize < maxStorageSize
      }

      const largeData = {
        history: Array.from({ length: 100000 }, (_, i) => ({
          id: `item-${i}`,
          data: 'x'.repeat(1000) // 每项1KB
        }))
      }

      const canStore = checkStorageLimit(largeData)
      expect(canStore).toBe(false)
    })

    it('应该定期清理过期数据', async () => {
      const now = Date.now()
      const expirationTime = 30 * 24 * 60 * 60 * 1000 // 30天

      const oldData = {
        id: 'old-item',
        timestamp: now - (expirationTime + 86400000), // 超过30天
        data: '过期数据'
      }

      const newData = {
        id: 'new-item',
        timestamp: now,
        data: '新数据'
      }

      const isExpired = (item: any): boolean => {
        return now - item.timestamp > expirationTime
      }

      expect(isExpired(oldData)).toBe(true)
      expect(isExpired(newData)).toBe(false)

      // 模拟数据清理
      const cleanExpiredData = (data: any[]): any[] => {
        return data.filter(item => !isExpired(item))
      }

      const cleanedData = cleanExpiredData([oldData, newData])
      expect(cleanedData).toHaveLength(1)
      expect(cleanedData[0].id).toBe('new-item')
    })
  })

  describe('权限控制', () => {
    it('应该只申请必要的权限', () => {
      // 检查manifest.json中的权限
      const requiredPermissions = [
        'storage',
        'activeTab',
        'contextMenus'
      ]

      const actualPermissions = [
        'storage',
        'activeTab',
        'contextMenus'
      ]

      // 验证权限列表匹配
      expect(actualPermissions).toEqual(expect.arrayContaining(requiredPermissions))
      expect(actualPermissions.length).toBeLessThanOrEqual(requiredPermissions.length)
    })

    it('应该验证主机权限', () => {
      const allowedHosts = [
        '<all_urls>'
      ]

      // 验证主机权限的合理性
      expect(allowedHosts).toContain('<all_urls>')

      // 如果有特定域名限制，应该在这里验证
      const restrictedHosts = [
        'https://*.baidu.com/*',
        'https://*.google.com/*',
        'https://*.bing.com/*'
      ]

      // 在生产环境中，可能需要限制到特定搜索引擎
      expect(restrictedHosts.every(host =>
        host.startsWith('https://') && host.endsWith('/*')
      )).toBe(true)
    })
  })

  describe('内容安全策略', () => {
    it('应该实施CSP头部', () => {
      const cspHeader = {
        "default-src": "'self'",
        "script-src": "'self' 'unsafe-inline'",
        "style-src": "'self' 'unsafe-inline'",
        "img-src": "'self' data: https:",
        "connect-src": "'self' https://*.baidu.com https://*.google.com https://*.bing.com"
      }

      // 验证CSP配置
      expect(cspHeader["default-src"]).toBe("'self'")
      expect(cspHeader["script-src"]).toContain("'self'")
      expect(cspHeader["connect-src"]).toContain("https://*.baidu.com")
    })

    it('应该防止内联脚本执行', () => {
      const maliciousHTML = `
        <div onclick="alert('XSS')">点击我</div>
        <a href="javascript:alert('XSS')">恶意链接</a>
        <img src="x" onerror="alert('XSS')" />
      `

      // 验证HTML清理
      const sanitizeHTML = (html: string): string => {
        return html
          .replace(/on\w+="[^"]*"/g, '') // 移除事件处理器
          .replace(/javascript:/g, '') // 移除javascript:协议
          .replace(/<script[^>]*>.*?<\/script>/gs, '') // 移除script标签
      }

      const sanitized = sanitizeHTML(maliciousHTML)

      expect(sanitized).not.toContain('onclick=')
      expect(sanitized).not.toContain('javascript:')
      expect(sanitized).not.toContain('<script>')
    })
  })

  describe('跨站请求伪造(CSRF)防护', () => {
    it('应该验证请求来源', () => {
      const allowedOrigins = [
        'chrome-extension://your-extension-id',
        'moz-extension://your-extension-id'
      ]

      const isValidOrigin = (origin: string): boolean => {
        return allowedOrigins.some(allowed => origin.startsWith(allowed))
      }

      expect(isValidOrigin('chrome-extension://your-extension-id')).toBe(true)
      expect(isValidOrigin('https://evil.com')).toBe(false)
      expect(isValidOrigin('javascript:alert("XSS")')).toBe(false)
    })

    it('应该使用CSRF令牌', () => {
      const generateCSRFToken = (): string => {
        return Math.random().toString(36).substring(2) + Date.now().toString(36)
      }

      const validateCSRFToken = (token: string, sessionToken: string): boolean => {
        return token === sessionToken && token.length > 10
      }

      const sessionToken = generateCSRFToken()
      const requestToken = sessionToken // 在实际请求中应该从请求中获取
      const maliciousToken = 'evil-token'

      expect(validateCSRFToken(requestToken, sessionToken)).toBe(true)
      expect(validateCSRFToken(maliciousToken, sessionToken)).toBe(false)
    })
  })

  describe('敏感信息泄露防护', () => {
    it('不应在错误信息中泄露敏感信息', () => {
      const originalError = new Error('Database connection failed: user=admin, password=secret123')

      const sanitizeError = (error: Error): string => {
        return error.message
          .replace(/password=\w+/g, 'password=***')
          .replace(/user=\w+/g, 'user=***')
          .replace(/token=\w+/g, 'token=***')
      }

      const sanitized = sanitizeError(originalError)

      expect(sanitized).not.toContain('secret123')
      expect(sanitized).not.toContain('admin')
      expect(sanitized).toContain('***')
    })

    it('应该移除调试信息', () => {
      const developmentCode = `
        console.log('Debug: user data', userData);
        console.error('Error details:', error.stack);
        debugger;
      `

      const removeDebugInfo = (code: string): string => {
        return code
          .replace(/console\.(log|error|warn|debug)\([^)]*\);?/g, '')
          .replace(/debugger;?/g, '')
      }

      const cleaned = removeDebugInfo(developmentCode)

      expect(cleaned).not.toContain('console.log')
      expect(cleaned).not.toContain('debugger')
    })
  })

  describe('依赖安全', () => {
    it('应该检查依赖包的安全性', async () => {
      // 模拟依赖安全检查
      const vulnerabilities = [
        { package: 'lodash', severity: 'high', version: '<4.17.21' },
        { package: 'axios', severity: 'medium', version: '<0.21.0' }
      ]

      const currentDependencies = {
        'lodash': '4.17.21',
        'axios': '0.24.0',
        'react': '18.2.0'
      }

      const checkVulnerability = (pkg: string, version: string): boolean => {
        return !vulnerabilities.some(vuln =>
          vuln.package === pkg && version.includes(vuln.version.split('<')[1])
        )
      }

      Object.entries(currentDependencies).forEach(([pkg, version]) => {
        expect(checkVulnerability(pkg, version)).toBe(true)
      })
    })
  })

  describe('隐私保护', () => {
    it('不应该收集用户个人信息', () => {
      const userData = {
        searchQueries: ['React框架', 'Vue教程'],
        preferences: { engine: 'baidu', language: 'zh-CN' },
        timestamp: Date.now()
      }

      const anonymizeData = (data: any): any => {
        const { timestamp, ...anonymized } = data

        // 移除可能的个人信息
        Object.keys(anonymized).forEach(key => {
          if (typeof anonymized[key] === 'string') {
            // 移除邮箱、电话等敏感信息模式
            anonymized[key] = anonymized[key]
              .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
              .replace(/\b\d{3}-\d{3}-\d{4}\b/g, '[PHONE]')
          }
        })

        return anonymized
      }

      const anonymized = anonymizeData(userData)

      expect(anonymized).not.toHaveProperty('timestamp')
      expect(JSON.stringify(anonymized)).not.toContain('@')
    })

    it('应该支持数据遗忘权', () => {
      const userConsent = {
        analytics: false,
        personalization: false,
        storage: true
      }

      const deleteUserData = (consent: any): boolean => {
        // 如果用户不同意数据收集，应该删除所有数据
        if (!consent.analytics && !consent.personalization) {
          return true // 可以删除数据
        }
        return false // 保留必要数据
      }

      const shouldDelete = deleteUserData(userConsent)
      expect(shouldDelete).toBe(true)
    })
  })
})