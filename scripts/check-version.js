/**
 * 版本一致性检查脚本
 *
 * 功能：
 * - 验证 package.json 和 manifest.json 的版本号是否一致
 * - 防止版本不同步导致的发布问题
 * - 在 CI/CD 流程中作为质量门禁
 *
 * 使用：
 * - npm run check-version
 * - node scripts/check-version.js
 *
 * 退出码：
 * - 0: 版本一致
 * - 1: 版本不一致或文件读取失败
 *
 * @author SearchSyntax Pro Team
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ============================================================================
// 配置
// ============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const CONFIG = {
  packageJsonPath: join(rootDir, 'package.json'),
  manifestJsonPath: join(rootDir, 'public/manifest.json'),
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 打印带颜色的消息
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

// ============================================================================
// 版本读取和验证
// ============================================================================

/**
 * 读取 JSON 文件
 */
function readJsonFile(filePath, fileDescription) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    logError(`无法读取 ${fileDescription}: ${filePath}`);
    if (error.code === 'ENOENT') {
      logError('文件不存在');
    } else if (error instanceof SyntaxError) {
      logError('JSON 格式错误');
    } else {
      logError(error.message);
    }
    throw error;
  }
}

/**
 * 验证版本号格式（语义化版本）
 */
function validateVersionFormat(version) {
  const semverRegex = /^\d+\.\d+\.\d+(-[\w.]+)?$/;
  return semverRegex.test(version);
}

/**
 * 主函数
 */
function main() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.cyan);
  log('  版本一致性检查工具', colors.bright + colors.cyan);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.cyan);

  try {
    // 1. 读取 package.json
    logInfo('读取 package.json...');
    const packageJson = readJsonFile(
      CONFIG.packageJsonPath,
      'package.json'
    );
    const packageVersion = packageJson.version;

    if (!packageVersion) {
      throw new Error('package.json 中未找到 version 字段');
    }

    log(`   版本号: ${colors.cyan}${packageVersion}${colors.reset}`);

    // 2. 读取 manifest.json
    logInfo('读取 manifest.json...');
    const manifestJson = readJsonFile(
      CONFIG.manifestJsonPath,
      'manifest.json'
    );
    const manifestVersion = manifestJson.version;

    if (!manifestVersion) {
      throw new Error('manifest.json 中未找到 version 字段');
    }

    log(`   版本号: ${colors.cyan}${manifestVersion}${colors.reset}\n`);

    // 3. 验证版本号格式
    logInfo('验证版本号格式...');

    if (!validateVersionFormat(packageVersion)) {
      logError(
        `package.json 版本号格式无效: ${packageVersion}`
      );
      logInfo('预期格式: X.Y.Z 或 X.Y.Z-suffix (语义化版本)');
      process.exit(1);
    }

    if (!validateVersionFormat(manifestVersion)) {
      logError(
        `manifest.json 版本号格式无效: ${manifestVersion}`
      );
      logInfo('预期格式: X.Y.Z 或 X.Y.Z-suffix (语义化版本)');
      process.exit(1);
    }

    logSuccess('版本号格式有效\n');

    // 4. 比较版本号
    logInfo('比较版本号...');

    if (packageVersion !== manifestVersion) {
      log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.red);
      logError('版本号不一致！');
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.red);

      console.log(`${colors.yellow}详细信息:${colors.reset}`);
      console.log(
        `  package.json:  ${colors.cyan}${packageVersion}${colors.reset}`
      );
      console.log(
        `  manifest.json: ${colors.cyan}${manifestVersion}${colors.reset}`
      );
      console.log();

      logWarning('修复方法:');
      console.log('  1. 确定正确的版本号（推荐使用 package.json 的版本）');
      console.log('  2. 手动更新 public/manifest.json 的 version 字段');
      console.log('  或运行: npm version <版本号> (会自动更新两个文件)\n');

      process.exit(1);
    }

    // 5. 成功
    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.green);
    logSuccess('版本一致性检查通过！');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.green);

    console.log(`${colors.bright}✨ 当前版本: ${colors.green}v${packageVersion}${colors.reset}\n`);

    process.exit(0);
  } catch (error) {
    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.red);
    logError('检查失败');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', colors.red);

    if (error.stack) {
      console.log(`${colors.yellow}错误详情:${colors.reset}`);
      console.log(error.stack);
      console.log();
    }

    process.exit(1);
  }
}

// 执行主函数
main();
