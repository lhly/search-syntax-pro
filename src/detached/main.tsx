import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '../popup/App'
import '../styles/globals.css'

/**
 * Detached Window Entry Point
 *
 * 这是独立窗口的入口文件，完全复用 popup/App.tsx 组件
 * 通过 window 对象标记当前运行环境为 detached 模式
 */

// 标记当前窗口为 detached 模式，供组件内部判断使用
;(window as any).__SSP_WINDOW_MODE__ = 'detached'

// 设置国际化标题
document.title = chrome.i18n.getMessage('detached_title')

// 渲染应用
ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
