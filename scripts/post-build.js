/**
 * 构建后处理脚本
 * 复制必要的静态文件到 dist 目录
 */

import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');
const publicDir = join(rootDir, 'public');

console.log('📦 开始后构建处理...\n');

// 确保 dist 目录存在
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

/**
 * 递归复制目录
 * @param {string} src 源目录
 * @param {string} dest 目标目录
 */
function copyDirectory(src, dest) {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }

  const entries = readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
      console.log(`  ✓ 复制: ${entry.name}`);
    }
  }
}

// 1. 复制 manifest.json
console.log('📋 复制 manifest.json...');
try {
  const manifestSrc = join(publicDir, 'manifest.json');
  const manifestDest = join(distDir, 'manifest.json');
  copyFileSync(manifestSrc, manifestDest);
  console.log('  ✓ manifest.json 已复制\n');
} catch (error) {
  console.error('  ✗ 复制 manifest.json 失败:', error.message);
}

// 2. 复制 icons 目录
console.log('🎨 复制图标文件...');
try {
  const iconsSrc = join(publicDir, 'icons');
  const iconsDest = join(distDir, 'icons');
  copyDirectory(iconsSrc, iconsDest);
  console.log('  ✓ 所有图标已复制\n');
} catch (error) {
  console.error('  ✗ 复制图标失败:', error.message);
}

// 3. 复制 _locales 目录(如果存在)
console.log('🌐 复制语言文件...');
try {
  const localesSrc = join(publicDir, '_locales');
  if (existsSync(localesSrc)) {
    const localesDest = join(distDir, '_locales');
    copyDirectory(localesSrc, localesDest);
    console.log('  ✓ 语言文件已复制\n');
  } else {
    console.log('  ⚠ _locales 目录不存在,跳过\n');
  }
} catch (error) {
  console.error('  ✗ 复制语言文件失败:', error.message);
}

console.log('✅ 构建后处理完成!\n');
console.log('📦 生产构建已准备就绪: dist/');
console.log('💡 提示: 可以将 dist/ 目录加载为 Chrome 扩展进行测试\n');
