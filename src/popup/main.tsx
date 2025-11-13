import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import '../styles/globals.css'

// 设置国际化标题
document.title = chrome.i18n.getMessage('popup_title')

// 初始化React应用
const root = ReactDOM.createRoot(
  document.getElementById('app') as HTMLElement
)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)