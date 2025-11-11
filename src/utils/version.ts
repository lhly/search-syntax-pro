import { useState, useEffect } from 'react'

/**
 * 获取扩展版本号
 * @returns 当前扩展的版本号
 */
export function getExtensionVersion(): string {
  try {
    return chrome.runtime.getManifest().version
  } catch (error) {
    console.error('获取扩展版本号失败:', error)
    return '未知版本'
  }
}

/**
 * React Hook: 获取扩展版本号
 * @returns 当前扩展的版本号
 */
export function useExtensionVersion(): string {
  const [version, setVersion] = useState<string>('')

  useEffect(() => {
    setVersion(getExtensionVersion())
  }, [])

  return version
}

/**
 * 获取完整的扩展信息
 * @returns 扩展的详细信息
 */
export function getExtensionInfo() {
  try {
    const manifest = chrome.runtime.getManifest()
    return {
      name: manifest.name,
      version: manifest.version,
      description: manifest.description,
      manifestVersion: manifest.manifest_version
    }
  } catch (error) {
    console.error('获取扩展信息失败:', error)
    return {
      name: '未知',
      version: '未知版本',
      description: '',
      manifestVersion: 3
    }
  }
}
