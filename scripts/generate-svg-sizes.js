/**
 * 生成不同尺寸的 SVG 文件
 * 基于 simpleLogo.svg 创建适配不同场景的 SVG 版本
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// SVG 尺寸定义
const SIZES = [
  { size: 16, name: 'icon16.svg' },
  { size: 32, name: 'icon32.svg' },
  { size: 48, name: 'icon48.svg' },
  { size: 128, name: 'icon128.svg' }
]

// 输入和输出路径
const inputPath = join(__dirname, '../public/icons/simpleLogo.svg')
const outputDir = join(__dirname, '../public/icons')

console.log('📐 开始生成不同尺寸的 SVG 文件...\n')

// 读取原始 SVG
const svgContent = readFileSync(inputPath, 'utf-8')

// 提取 viewBox 信息
const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/)
const viewBox = viewBoxMatch ? viewBoxMatch[1] : '650 600 1400 1550'

// 生成优化后的 SVG
function generateOptimizedSvg(size, originalSvg) {
  // 移除原始的 width 和 height 属性,使用统一的 viewBox
  let optimizedSvg = originalSvg
    .replace(/width="[^"]*"/, `width="${size}"`)
    .replace(/height="[^"]*"/, `height="${size}"`)
    .replace(/preserveAspectRatio="[^"]*"/, 'preserveAspectRatio="xMidYMid meet"')

  return optimizedSvg
}

// 批量生成
function generateAllSizes() {
  const results = []

  for (const { size, name } of SIZES) {
    try {
      const outputPath = join(outputDir, name)
      const optimizedSvg = generateOptimizedSvg(size, svgContent)

      writeFileSync(outputPath, optimizedSvg, 'utf-8')

      results.push({ size, name, status: '✅', path: outputPath })
      console.log(`✅ 已生成 ${name} (${size}x${size})`)
    } catch (error) {
      results.push({ size, name, status: '❌', error: error.message })
      console.error(`❌ 生成 ${name} 失败:`, error.message)
    }
  }

  return results
}

// 执行生成
const results = generateAllSizes()

console.log('\n📊 生成完成统计:')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
results.forEach(({ name, size, status }) => {
  console.log(`${status} ${name} (${size}x${size})`)
})
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

const successCount = results.filter(r => r.status === '✅').length
console.log(`\n✨ 成功生成 ${successCount}/${SIZES.length} 个 SVG 文件`)
console.log(`📁 输出目录: ${outputDir}`)

if (successCount === SIZES.length) {
  console.log('\n🎉 所有 SVG 文件生成成功!')
} else {
  console.log('\n⚠️  部分 SVG 文件生成失败,请检查错误信息')
}

// 同时替换 logo.svg 为 simpleLogo.svg
try {
  const logoPath = join(outputDir, 'logo.svg')
  const backupPath = join(outputDir, 'logo.svg.backup')

  // 备份原有 logo.svg
  try {
    const originalLogo = readFileSync(logoPath, 'utf-8')
    writeFileSync(backupPath, originalLogo, 'utf-8')
    console.log('\n💾 已备份原有 logo.svg 到 logo.svg.backup')
  } catch (e) {
    // 如果原文件不存在也没关系
  }

  // 复制 simpleLogo.svg 到 logo.svg
  writeFileSync(logoPath, svgContent, 'utf-8')
  console.log('✅ 已将 simpleLogo.svg 复制为 logo.svg')
} catch (error) {
  console.error('❌ 替换 logo.svg 失败:', error.message)
}
