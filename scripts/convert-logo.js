/**
 * SVG to PNG 转换脚本
 * 使用 Puppeteer 在浏览器环境中转换 SVG 为不同尺寸的 PNG
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 定义需要生成的图标尺寸
const SIZES = [16, 32, 48, 128]

// 读取 SVG 文件
const svgPath = join(__dirname, '../public/icons/simpleLogo.svg')
const svgContent = readFileSync(svgPath, 'utf-8')

// 解析 SVG 尺寸
const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/)
const [, , , originalWidth, originalHeight] = viewBoxMatch
  ? viewBoxMatch[1].split(' ').map(Number)
  : [0, 0, 1150, 1150]

console.log('原始SVG尺寸:', originalWidth, 'x', originalHeight)

// 创建一个简单的 Canvas 转换函数
async function convertSvgToPng(svgContent, outputPath, size) {
  try {
    // 使用 node-canvas 或其他方法
    // 这里我们将生成一个HTML文件,用户可以在浏览器中打开并保存
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>SVG to PNG Converter</title>
  <style>
    body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
    h1 { font-size: 18px; }
    canvas { border: 1px solid #ccc; margin: 10px 0; }
    .download { margin: 10px 0; }
    button { padding: 10px 20px; background: #2563eb; color: white; border: none; cursor: pointer; }
  </style>
</head>
<body>
  <h1>SVG 转 PNG - simpleLogo</h1>
  <p>右键点击下方图片选择"另存为"保存PNG文件</p>
  ${SIZES.map(s => `
  <div class="download">
    <h3>尺寸: ${s}x${s}</h3>
    <canvas id="canvas${s}" width="${s}" height="${s}"></canvas>
    <br>
    <button onclick="download${s}()">下载 icon${s}.png</button>
  </div>
  `).join('\n')}

  <script>
    const svgContent = \`${svgContent.replace(/`/g, '\\`')}\`;

    function convertSvgToCanvas(svgString, canvas) {
      const ctx = canvas.getContext('2d');
      const img = new Image();

      return new Promise((resolve, reject) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas);
        };
        img.onerror = reject;

        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        img.src = url;
      });
    }

    ${SIZES.map(s => `
    const canvas${s} = document.getElementById('canvas${s}');
    convertSvgToCanvas(svgContent, canvas${s});

    function download${s}() {
      canvas${s}.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'icon${s}.png';
        a.click();
        URL.revokeObjectURL(url);
      });
    }
    `).join('\n')}
  </script>
</body>
</html>
`

    return html
  } catch (error) {
    console.error(`转换失败 (${size}x${size}):`, error)
    throw error
  }
}

// 生成转换HTML
const html = await convertSvgToPng(svgContent, '', 0)
const outputPath = join(__dirname, '../public/icons/convert-logo.html')
writeFileSync(outputPath, html, 'utf-8')

console.log('\n✅ 已生成转换工具!')
console.log('📁 文件位置:', outputPath)
console.log('\n📝 使用方法:')
console.log('1. 在浏览器中打开 public/icons/convert-logo.html')
console.log('2. 等待图片加载完成')
console.log('3. 点击"下载"按钮或右键点击图片另存为PNG')
console.log(`4. 将生成的PNG文件重命名并保存到 public/icons/ 目录\n`)
console.log('需要生成的文件:', SIZES.map(s => `icon${s}.png`).join(', '))
