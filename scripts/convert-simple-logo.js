/**
 * 使用 Sharp 将 simpleLogo.svg 转换为多种尺寸的 PNG 图标
 * 适用于 Chrome 扩展的标准图标尺寸
 */

import sharp from 'sharp'
import { readFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Chrome 扩展标准图标尺寸
const SIZES = [16, 32, 48, 128]

// 输入和输出路径
const inputPath = join(__dirname, '../public/icons/simpleLogo.svg')
const outputDir = join(__dirname, '../public/icons')

console.log('🎨 开始转换 simpleLogo.svg...\n')

// 读取 SVG 文件
const svgBuffer = readFileSync(inputPath)

// 批量转换
async function convertAllSizes() {
  const results = []

  for (const size of SIZES) {
    try {
      const outputPath = join(outputDir, `icon${size}.png`)

      await sharp(svgBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 } // 透明背景
        })
        .png()
        .toFile(outputPath)

      results.push({ size, status: '✅', path: outputPath })
      console.log(`✅ 已生成 icon${size}.png (${size}x${size})`)
    } catch (error) {
      results.push({ size, status: '❌', error: error.message })
      console.error(`❌ 生成 icon${size}.png 失败:`, error.message)
    }
  }

  return results
}

// 执行转换
convertAllSizes()
  .then(results => {
    console.log('\n📊 转换完成统计:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    results.forEach(({ size, status }) => {
      console.log(`${status} icon${size}.png (${size}x${size})`)
    })
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    const successCount = results.filter(r => r.status === '✅').length
    console.log(`\n✨ 成功生成 ${successCount}/${SIZES.length} 个图标文件`)
    console.log(`📁 输出目录: ${outputDir}`)

    if (successCount === SIZES.length) {
      console.log('\n🎉 所有图标转换成功!')
    } else {
      console.log('\n⚠️  部分图标转换失败,请检查错误信息')
    }
  })
  .catch(error => {
    console.error('\n❌ 转换过程发生错误:', error)
    process.exit(1)
  })
