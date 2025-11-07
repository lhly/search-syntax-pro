import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import '../styles/globals.css'

// 初始化React应用
const root = ReactDOM.createRoot(
  document.getElementById('app') as HTMLElement
)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)