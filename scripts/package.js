/**
 * Chrome扩展自动打包脚本
 *
 * 功能：
 * - 自动从package.json读取版本号
 * - 将dist目录打包为ZIP格式
 * - 生成带版本号的发布包：releases/ssp-v{version}.zip
 * - 提供详细的错误提示和成功信息
 *
 * 架构设计：
 * - 单一职责原则：每个函数只做一件事
 * - 错误优先：完善的错误处理和用户提示
 * - 零依赖：仅使用Node.js内置模块
 *
 * @author SearchSyntax Pro Team
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ============================================================================
// 配置常量
// ============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const CONFIG = {
  distDir: join(rootDir, 'dist'),
  releasesDir: join(rootDir, 'releases'),
  packageName: 'ssp',
  packageJsonPath: join(rootDir, 'package.json'),
};

// 颜色输出（在终端中更友好）
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 格式化文件大小为人类可读格式
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小（如 "1.23 MB"）
 */
function formatFileSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * 打印带颜色的消息
 * @param {string} message - 消息内容
 * @param {string} color - 颜色代码
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * 打印成功消息
 */
function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

/**
 * 打印错误消息
 */
function logError(message) {
  log(`❌ ${message}`, colors.red);
}

/**
 * 打印警告消息
 */
function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

/**
 * 打印信息消息
 */
function logInfo(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

/**
 * 打印标题
 */
function logHeader(message) {
  log(`\n${'='.repeat(60)}`, colors.blue);
  log(`  ${message}`, colors.bright + colors.blue);
  log(`${'='.repeat(60)}\n`, colors.blue);
}

// ============================================================================
// 环境验证层
// ============================================================================

/**
 * 检查系统是否安装了zip命令
 * @throws {Error} 如果zip命令不存在
 */
function checkZipCommand() {
  try {
    execSync('which zip', { stdio: 'ignore' });
    logSuccess('检测到系统zip命令');
  } catch (error) {
    logError('未找到系统zip命令');
    console.log('\n请安装zip工具：');
    console.log('  macOS: 已预装');
    console.log('  Linux: sudo apt-get install zip');
    console.log('  Windows: 安装 Git Bash 或使用 WSL\n');
    throw new Error('缺少zip命令');
  }
}

/**
 * 检查dist目录是否存在
 * @throws {Error} 如果dist目录不存在
 */
function checkDistDirectory() {
  if (!existsSync(CONFIG.distDir)) {
    logError('dist目录不存在');
    console.log('\n请先运行构建命令：');
    console.log('  npm run build\n');
    throw new Error('缺少dist目录');
  }
  logSuccess(`找到构建目录: ${CONFIG.distDir}`);
}

// ============================================================================
// 版本管理层
// ============================================================================

/**
 * 从package.json读取版本号
 * @returns {string} 版本号（如 "1.0.0"）
 * @throws {Error} 如果读取失败或版本号无效
 */
function getVersion() {
  try {
    const packageJson = JSON.parse(
      readFileSync(CONFIG.packageJsonPath, 'utf-8')
    );

    const version = packageJson.version;
    if (!version) {
      throw new Error('package.json中未找到version字段');
    }

    // 验证版本号格式（语义化版本）
    if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version)) {
      throw new Error(`无效的版本号格式: ${version}`);
    }

    logSuccess(`读取版本号: v${version}`);
    return version;
  } catch (error) {
    logError(`读取版本号失败: ${error.message}`);
    throw error;
  }
}

// ============================================================================
// 文件系统层
// ============================================================================

/**
 * 创建releases目录（如果不存在）
 */
function prepareReleasesDir() {
  if (!existsSync(CONFIG.releasesDir)) {
    mkdirSync(CONFIG.releasesDir, { recursive: true });
    logSuccess(`创建输出目录: ${CONFIG.releasesDir}`);
  } else {
    logInfo(`使用现有输出目录: ${CONFIG.releasesDir}`);
  }
}

/**
 * 检查同名包文件是否已存在
 * @param {string} zipFileName - ZIP文件名
 * @returns {boolean} 是否存在
 */
function checkExistingPackage(zipFileName) {
  const zipPath = join(CONFIG.releasesDir, zipFileName);
  if (existsSync(zipPath)) {
    const stats = statSync(zipPath);
    const size = formatFileSize(stats.size);
    logWarning(`发现同名文件: ${zipFileName} (${size})`);
    logInfo('将覆盖现有文件');
    return true;
  }
  return false;
}

// ============================================================================
// 打包执行层
// ============================================================================

/**
 * 执行ZIP打包命令
 * @param {string} version - 版本号
 * @returns {string} 生成的ZIP文件路径
 * @throws {Error} 如果打包失败
 */
function createZipPackage(version) {
  const zipFileName = `${CONFIG.packageName}-v${version}.zip`;
  const zipPath = join(CONFIG.releasesDir, zipFileName);

  logInfo('开始打包...');

  try {
    // 切换到dist目录并打包所有内容
    // -r: 递归打包目录
    // -q: 安静模式（不显示进度）
    // -9: 最高压缩率
    // -x: 排除不必要的文件
    const excludePatterns = [
      '*.DS_Store',           // macOS系统文件
      '__MACOSX/*',           // macOS压缩产物
      '*.backup',             // 备份文件
      '*.bak',                // 备份文件
      '*.tmp',                // 临时文件
      '.git/*',               // Git文件
      'node_modules/*',       // 依赖文件（不应该在dist中）
    ].map(p => `"${p}"`).join(' ');

    const command = `cd "${CONFIG.distDir}" && zip -r -q -9 "${zipPath}" . -x ${excludePatterns}`;

    execSync(command, { stdio: 'inherit' });

    // 验证ZIP文件是否成功创建
    if (!existsSync(zipPath)) {
      throw new Error('ZIP文件创建失败');
    }

    return zipPath;
  } catch (error) {
    logError(`打包失败: ${error.message}`);
    throw error;
  }
}

/**
 * 计算并返回文件大小信息
 * @param {string} filePath - 文件路径
 * @returns {Object} 包含size和formattedSize的对象
 */
function getFileInfo(filePath) {
  const stats = statSync(filePath);
  return {
    size: stats.size,
    formattedSize: formatFileSize(stats.size),
  };
}

// ============================================================================
// 报告层
// ============================================================================

/**
 * 显示打包成功信息
 * @param {string} zipPath - ZIP文件路径
 * @param {string} version - 版本号
 */
function displaySuccess(zipPath, version) {
  const fileInfo = getFileInfo(zipPath);
  const fileName = join('releases', `${CONFIG.packageName}-v${version}.zip`);

  logHeader('打包成功！');

  console.log(`${colors.bright}📦 扩展包信息${colors.reset}`);
  console.log(`   文件名称: ${colors.cyan}${fileName}${colors.reset}`);
  console.log(`   版本号:   ${colors.green}v${version}${colors.reset}`);
  console.log(`   文件大小: ${colors.yellow}${fileInfo.formattedSize}${colors.reset}`);
  console.log(`   完整路径: ${colors.blue}${zipPath}${colors.reset}`);

  console.log(`\n${colors.bright}🚀 下一步操作${colors.reset}`);
  console.log('   1. 访问 Chrome Web Store Developer Console');
  console.log('      https://chrome.google.com/webstore/devconsole');
  console.log('   2. 上传生成的ZIP文件');
  console.log('   3. 填写商店列表信息');
  console.log('   4. 提交审核\n');

  // 文件大小警告
  if (fileInfo.size > 10 * 1024 * 1024) {
    logWarning('ZIP文件超过10MB，可能影响审核速度');
    logInfo('建议优化资源文件大小');
  } else if (fileInfo.size > 5 * 1024 * 1024) {
    logInfo('ZIP文件大小适中（5-10MB）');
  } else {
    logSuccess('ZIP文件大小优秀（<5MB）');
  }
}

/**
 * 显示错误信息并退出
 * @param {Error} error - 错误对象
 */
function displayError(error) {
  logHeader('打包失败');
  logError(error.message);

  if (error.stack) {
    console.log(`\n${colors.yellow}详细错误信息:${colors.reset}`);
    console.log(error.stack);
  }

  console.log(`\n${colors.cyan}需要帮助？${colors.reset}`);
  console.log('  - 查看项目文档: README.md');
  console.log('  - 提交Issue: https://github.com/lhly/search-syntax-pro/issues\n');

  process.exit(1);
}

// ============================================================================
// 主流程
// ============================================================================

/**
 * 主函数：执行完整的打包流程
 */
async function main() {
  try {
    logHeader('🎁 Chrome扩展自动打包工具');

    // 第1步：环境验证
    console.log(`${colors.bright}第1步: 环境验证${colors.reset}`);
    checkZipCommand();
    checkDistDirectory();

    // 第2步：读取版本号
    console.log(`\n${colors.bright}第2步: 版本管理${colors.reset}`);
    const version = getVersion();

    // 第3步：准备输出目录
    console.log(`\n${colors.bright}第3步: 文件系统准备${colors.reset}`);
    prepareReleasesDir();

    const zipFileName = `${CONFIG.packageName}-v${version}.zip`;
    checkExistingPackage(zipFileName);

    // 第4步：执行打包
    console.log(`\n${colors.bright}第4步: 执行打包${colors.reset}`);
    const zipPath = createZipPackage(version);

    // 第5步：显示结果
    logSuccess('打包完成');
    displaySuccess(zipPath, version);

  } catch (error) {
    displayError(error);
  }
}

// 执行主流程
main();
