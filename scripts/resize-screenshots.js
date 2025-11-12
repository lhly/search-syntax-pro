/**
 * 截图尺寸调整工具
 * 自动将截图调整到目标分辨率，添加透明背景填充
 */

import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, readdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 预设的目标尺寸配置
const PRESETS = {
  'screenshot': { width: 1280, height: 800, desc: '商店截图' },
  'screenshot-small': { width: 640, height: 400, desc: '小尺寸截图' },
  'logo': { width: 300, height: 300, desc: '扩展徽标' },
  'small-promo': { width: 440, height: 280, desc: '小促销磁贴' },
  'large-promo': { width: 1400, height: 560, desc: '大型促销磁贴' },
};

/**
 * 调整图片尺寸并添加透明背景
 * @param {string} inputPath - 输入图片路径
 * @param {string} outputPath - 输出图片路径
 * @param {number} targetWidth - 目标宽度
 * @param {number} targetHeight - 目标高度
 * @param {string} position - 图片位置 (center, top, bottom, left, right)
 * @param {string} background - 背景颜色 (transparent, white, 或 hex 颜色)
 */
async function resizeWithPadding(inputPath, outputPath, targetWidth, targetHeight, position = 'center', background = 'transparent') {
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    console.log(`\n📷 处理图片: ${inputPath}`);
    console.log(`   原始尺寸: ${metadata.width}x${metadata.height}`);
    console.log(`   目标尺寸: ${targetWidth}x${targetHeight}`);

    // 计算缩放比例（保持宽高比）
    const widthRatio = targetWidth / metadata.width;
    const heightRatio = targetHeight / metadata.height;
    const ratio = Math.min(widthRatio, heightRatio);

    const resizedWidth = Math.round(metadata.width * ratio);
    const resizedHeight = Math.round(metadata.height * ratio);

    console.log(`   缩放后: ${resizedWidth}x${resizedHeight}`);

    // 计算填充位置
    let left = 0;
    let top = 0;

    switch (position) {
      case 'center':
        left = Math.round((targetWidth - resizedWidth) / 2);
        top = Math.round((targetHeight - resizedHeight) / 2);
        break;
      case 'top':
        left = Math.round((targetWidth - resizedWidth) / 2);
        top = 0;
        break;
      case 'bottom':
        left = Math.round((targetWidth - resizedWidth) / 2);
        top = targetHeight - resizedHeight;
        break;
      case 'left':
        left = 0;
        top = Math.round((targetHeight - resizedHeight) / 2);
        break;
      case 'right':
        left = targetWidth - resizedWidth;
        top = Math.round((targetHeight - resizedHeight) / 2);
        break;
    }

    // 处理背景颜色
    const bgColor = background === 'transparent'
      ? { r: 0, g: 0, b: 0, alpha: 0 }
      : background === 'white'
      ? { r: 255, g: 255, b: 255, alpha: 1 }
      : parseColor(background);

    // 调整图片尺寸并添加背景
    await sharp(inputPath)
      .resize(resizedWidth, resizedHeight, {
        fit: 'contain',
        background: bgColor
      })
      .extend({
        top: top,
        bottom: targetHeight - resizedHeight - top,
        left: left,
        right: targetWidth - resizedWidth - left,
        background: bgColor
      })
      .png() // 使用 PNG 格式以支持透明背景
      .toFile(outputPath);

    console.log(`   ✅ 已保存: ${outputPath}`);
    console.log(`   填充位置: left=${left}, top=${top}`);

    return { success: true, outputPath };
  } catch (error) {
    console.error(`   ❌ 处理失败: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 解析颜色字符串（支持 hex 格式）
 */
function parseColor(colorStr) {
  if (colorStr.startsWith('#')) {
    const hex = colorStr.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return { r, g, b, alpha: 1 };
  }
  return { r: 255, g: 255, b: 255, alpha: 1 };
}

/**
 * 批量处理目录中的图片
 */
async function batchResize(inputDir, outputDir, preset, options = {}) {
  const { position = 'center', background = 'transparent' } = options;

  if (!existsSync(inputDir)) {
    console.error(`❌ 输入目录不存在: ${inputDir}`);
    return;
  }

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
    console.log(`📁 已创建输出目录: ${outputDir}`);
  }

  const config = PRESETS[preset];
  if (!config) {
    console.error(`❌ 未知的预设: ${preset}`);
    console.log('可用预设:', Object.keys(PRESETS).join(', '));
    return;
  }

  console.log(`\n🚀 开始批量处理 - ${config.desc}`);
  console.log(`   目标尺寸: ${config.width}x${config.height}`);
  console.log(`   图片位置: ${position}`);
  console.log(`   背景: ${background}`);

  const files = readdirSync(inputDir).filter(file =>
    /\.(png|jpg|jpeg|webp)$/i.test(file)
  );

  if (files.length === 0) {
    console.log('⚠️  未找到图片文件');
    return;
  }

  console.log(`   找到 ${files.length} 个图片文件`);

  const results = [];
  for (const file of files) {
    const inputPath = join(inputDir, file);
    const outputPath = join(outputDir, file.replace(/\.(jpg|jpeg|webp)$/i, '.png'));

    const result = await resizeWithPadding(
      inputPath,
      outputPath,
      config.width,
      config.height,
      position,
      background
    );

    results.push({ file, ...result });
  }

  // 统计结果
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  console.log('\n📊 处理完成:');
  console.log(`   ✅ 成功: ${successCount}`);
  if (failCount > 0) {
    console.log(`   ❌ 失败: ${failCount}`);
  }
}

/**
 * 命令行接口
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
📐 截图尺寸调整工具
===================

用法:
  node scripts/resize-screenshots.js <preset> <input-dir> [output-dir] [options]

预设尺寸:
  screenshot        1280x800   商店截图（推荐）
  screenshot-small  640x400    小尺寸截图
  logo              300x300    扩展徽标（正方形）
  small-promo       440x280    小促销磁贴
  large-promo       1400x560   大型促销磁贴

选项:
  --position=<pos>      图片位置: center, top, bottom, left, right (默认: center)
  --background=<color>  背景颜色: transparent, white, #RRGGBB (默认: transparent)

示例:
  # 处理截图，居中显示，透明背景
  node scripts/resize-screenshots.js screenshot ./screenshots ./output

  # 处理 logo，白色背景
  node scripts/resize-screenshots.js logo ./icons ./output --background=white

  # 处理促销图，顶部对齐
  node scripts/resize-screenshots.js small-promo ./images ./output --position=top

快速使用:
  1. 将原始截图放到 screenshots/ 目录
  2. 运行: node scripts/resize-screenshots.js screenshot ./screenshots ./screenshots-processed
  3. 在 screenshots-processed/ 目录获取处理后的图片
`);
    return;
  }

  const preset = args[0];
  const inputDir = args[1] || './screenshots';
  const outputDir = args[2] || './screenshots-processed';

  // 解析选项
  const options = {};
  args.slice(3).forEach(arg => {
    if (arg.startsWith('--position=')) {
      options.position = arg.split('=')[1];
    }
    if (arg.startsWith('--background=')) {
      options.background = arg.split('=')[1];
    }
  });

  await batchResize(inputDir, outputDir, preset, options);
}

// 导出函数供其他脚本使用
export { resizeWithPadding, batchResize, PRESETS };

// 命令行执行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
