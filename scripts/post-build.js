/**
 * 构建后处理脚本
 * 复制必要的静态文件到 dist 目录
 */

import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');
const publicDir = join(rootDir, 'public');

/**
 * 将ES模块转换为Chrome扩展兼容格式
 * Chrome的content scripts和service workers不支持ES模块导入
 */
function convertESModulesToIIFE() {
  console.log('🔧 转换ES模块为Chrome扩展兼容格式...');

  const contentPath = join(distDir, 'content.js');
  const backgroundPath = join(distDir, 'background.js');
  const migrationPath = join(distDir, 'migration.js');

  // 读取所有需要处理的文件
  let contentCode = existsSync(contentPath) ? readFileSync(contentPath, 'utf-8') : '';
  let backgroundCode = existsSync(backgroundPath) ? readFileSync(backgroundPath, 'utf-8') : '';
  let migrationCode = existsSync(migrationPath) ? readFileSync(migrationPath, 'utf-8') : '';

  // 1. 处理content.js - 内联translations.js和search-engine-selectors.js并移除import/export
  if (contentCode) {
    // 1.1 内联search-engine-selectors.js
    const selectorsPath = join(distDir, 'search-engine-selectors.js');
    let selectorsCode = existsSync(selectorsPath) ? readFileSync(selectorsPath, 'utf-8') : '';

    // 检查content.js中的search-engine-selectors导入
    const contentSelectorsImport = contentCode.match(/import\s*\{([^}]+)\}\s*from\s*["']\.\/search-engine-selectors\.js["']\s*;?/);

    if (contentSelectorsImport && selectorsCode) {
      // 解析导入的变量，支持多个导入: import{g as y, d as a}
      const importVars = contentSelectorsImport[1].trim();
      const imports = importVars.split(',').map(s => s.trim());

      // 解析export语句，找到导出名称对应的源变量名
      // 例如: export{i as d,t as g} -> {d: 'i', g: 't'}
      const exportMatch = selectorsCode.match(/export\s*\{([^}]+)\}\s*;?\s*$/m);
      const exportMap = {}; // {exported: source}

      if (exportMatch) {
        const exports = exportMatch[1].split(',').map(s => s.trim());
        for (const exp of exports) {
          if (exp.includes(' as ')) {
            const [source, exported] = exp.split(' as ').map(s => s.trim());
            exportMap[exported] = source;
          } else {
            exportMap[exp] = exp;
          }
        }
      }

      // 清理search-engine-selectors.js - 移除export语句
      let inlineSelectors = selectorsCode.replace(/export\s*\{[^}]+\}\s*;?\s*$/m, '');

      // 使用 IIFE 包装以避免变量名冲突，并导出需要的变量
      const exportedVarNames = [];
      for (const imp of imports) {
        let exportedName = imp, localImportName = imp;
        if (imp.includes(' as ')) {
          [exportedName, localImportName] = imp.split(' as ').map(s => s.trim());
        }

        // 查找源变量名
        const sourceVarName = exportMap[exportedName] || exportedName;
        exportedVarNames.push({ source: sourceVarName, local: localImportName });
      }

      // 创建 IIFE 包装的代码
      const iifeExports = exportedVarNames.map(v => `${v.local}:${v.source}`).join(',');
      inlineSelectors = `const {${exportedVarNames.map(v => v.local).join(',')}}=(function(){
${inlineSelectors}
return {${iifeExports}};
})();`;

      // 从content.js移除import语句
      contentCode = contentCode.replace(/import\s*\{[^}]+\}\s*from\s*["']\.\/search-engine-selectors\.js["']\s*;?/g, '');

      // 将selectors代码内联到content.js开头
      contentCode = inlineSelectors + '\n' + contentCode;

      console.log('  ✓ content.js: 内联search-engine-selectors.js并移除import');
    }

    // 1.2 内联translations.js
    const translationsPath = join(distDir, 'translations.js');
    let translationsCode = existsSync(translationsPath) ? readFileSync(translationsPath, 'utf-8') : '';

    // 检查content.js中的translations导入
    const contentTranslationsImport = contentCode.match(/import\s*\{([^}]+)\}\s*from\s*["']\.\/translations\.js["']\s*;?/);

    if (contentTranslationsImport && translationsCode) {
      // 解析导入的变量
      const importVars = contentTranslationsImport[1].trim();
      let imported = importVars, local = importVars;
      if (importVars.includes(' as ')) {
        [imported, local] = importVars.split(' as ').map(s => s.trim());
      }

      // 解析export语句，找到真正的源函数名
      // export{m as t} 中，m 是源函数名（translate函数），t 是导出名
      const exportMatch = translationsCode.match(/export\s*\{([^}]+)\}\s*;?\s*$/m);
      let sourceFunctionName = imported; // 默认使用导入的名称

      if (exportMatch) {
        const exports = exportMatch[1].split(',').map(s => s.trim());
        for (const exp of exports) {
          if (exp.includes(' as ')) {
            const [source, exported] = exp.split(' as ').map(s => s.trim());
            if (exported === imported) {
              sourceFunctionName = source; // 找到真正的源函数名
              break;
            }
          } else if (exp === imported) {
            sourceFunctionName = imported;
            break;
          }
        }
      }

      // 清理translations.js - 移除export语句
      let inlineTranslations = translationsCode.replace(/export\s*\{[^}]+\}\s*;?\s*$/m, '');

      // 使用 IIFE 包装translations以避免变量名冲突(与TriggerIcon的TypeScript私有字段辅助函数冲突)
      // 返回真正的源函数（translate函数），而不是内部的变量
      inlineTranslations = `const ${local}=(function(){
${inlineTranslations}
return ${sourceFunctionName};
})();`;

      // 从content.js移除import语句
      contentCode = contentCode.replace(/import\s*\{[^}]+\}\s*from\s*["']\.\/translations\.js["']\s*;?/g, '');

      // 将translations代码内联到content.js开头
      contentCode = inlineTranslations + '\n' + contentCode;

      console.log(`  ✓ content.js: 内联translations.js(IIFE包装)并移除import，返回${sourceFunctionName}`);
    }

    // 提取export的变量映射
    const exportMatch = contentCode.match(/export\s*\{([^}]+)\}\s*;?\s*$/);
    const exportedVars = {};

    if (exportMatch) {
      const exports = exportMatch[1].split(',').map(s => s.trim());
      exports.forEach(exp => {
        const [local, exported] = exp.includes(' as ')
          ? exp.split(' as ').map(s => s.trim())
          : [exp.trim(), exp.trim()];
        exportedVars[exported] = local;
      });

      // 移除export语句
      contentCode = contentCode.replace(/export\s*\{[^}]+\}\s*;?\s*$/, '');
      console.log('  ✓ content.js: 移除export语句');
    }

    // 将导出的变量添加到全局作用域
    if (Object.keys(exportedVars).length > 0) {
      const globalExports = Object.entries(exportedVars)
        .map(([exported, local]) => `window.__SSP_EXPORTS__=window.__SSP_EXPORTS__||{};window.__SSP_EXPORTS__.${exported}=${local};`)
        .join('');
      contentCode = contentCode + globalExports;
      console.log('  ✓ content.js: 导出变量到全局作用域');
    }

    writeFileSync(contentPath, contentCode);
  }

  // 2. 处理migration.js - 保留ES模块格式供popup/detached使用
  // migration.js将被popup/detached作为ES模块导入，需要保留export
  // 只有内联到background.js时才需要清理export
  console.log('  ✓ migration.js: 保持ES模块格式（供popup/detached使用）');

  // 3. 处理background.js - 替换import为内联代码
  if (backgroundCode) {
    const translationsPath = join(distDir, 'translations.js');

    // 简化处理：直接内联translations.js并移除import
    let translationsCode = existsSync(translationsPath) ? readFileSync(translationsPath, 'utf-8') : '';

    // 检查background.js中的import - 提取导入信息
    const translationsImportMatch = backgroundCode.match(/import\s*\{([^}]+)\}\s*from\s*["']\.\/translations\.js["']\s*;?/);

    if (translationsImportMatch && translationsCode) {
      // 解析导入的变量: import{t as a} -> imported='t', local='a'
      const importVars = translationsImportMatch[1].trim();
      let imported = importVars, local = importVars;
      if (importVars.includes(' as ')) {
        [imported, local] = importVars.split(' as ').map(s => s.trim());
      }

      // 解析export语句，找到真正的源函数名
      // export{m as t} 中，m 是源函数名（translate函数），t 是导出名
      const exportMatch = translationsCode.match(/export\s*\{([^}]+)\}\s*;?\s*$/m);
      let sourceFunctionName = imported; // 默认使用导入的名称

      if (exportMatch) {
        const exports = exportMatch[1].split(',').map(s => s.trim());
        for (const exp of exports) {
          if (exp.includes(' as ')) {
            const [source, exported] = exp.split(' as ').map(s => s.trim());
            if (exported === imported) {
              sourceFunctionName = source; // 找到真正的源函数名
              break;
            }
          } else if (exp === imported) {
            sourceFunctionName = imported;
            break;
          }
        }
      }

      // 清理translations.js - 移除export语句
      translationsCode = translationsCode.replace(/export\s*\{[^}]+\}\s*;?\s*$/m, '');

      // 使用 IIFE 包装translations以避免变量名冲突
      // 返回真正的源函数（translate函数），而不是内部的变量
      translationsCode = `const ${local}=(function(){
${translationsCode}
return ${sourceFunctionName};
})();`;

      // 从background.js移除import语句
      backgroundCode = backgroundCode.replace(/import\s*\{[^}]+\}\s*from\s*["']\.\/translations\.js["']\s*;?/g, '');

      // 将translations代码内联到background.js开头
      backgroundCode = translationsCode + '\n' + backgroundCode;

      console.log(`  ✓ background.js: 内联translations.js(IIFE包装)并移除import，返回${sourceFunctionName}`);
    }

    // 检查是否有migration.js的import
    const hasMigrationImport = backgroundCode.includes('from"./migration.js"') ||
                               backgroundCode.includes("from'./migration.js'");

    if (hasMigrationImport && migrationCode) {
      // 创建内联版本的migration.js（移除ES模块语法）
      let inlineMigration = migrationCode;
      // 移除export语句
      inlineMigration = inlineMigration.replace(/export\s*\{[^}]+\}\s*;?\s*$/m, '');
      // 移除migration.js中的translations导入(因为translations已经内联了)
      inlineMigration = inlineMigration.replace(/import\s*\{[^}]+\}\s*from\s*["']\.\/translations\.js["']\s*;?/g, '');

      // 移除background.js中的import语句
      backgroundCode = backgroundCode.replace(/import\s*\{[^}]+\}\s*from\s*["']\.\/migration\.js["']\s*;?/g, '');

      // 将清理后的migration代码内联到background.js开头
      backgroundCode = inlineMigration + '\n' + backgroundCode;

      console.log('  ✓ background.js: 内联migration.js并移除import');
    }

    writeFileSync(backgroundPath, backgroundCode);

    // 保留translations.js和migration.js给popup/detached使用(它们支持ES模块)
    console.log('  ✓ 保留translations.js和migration.js供popup/detached使用');
  }

  console.log('  ✓ ES模块转换完成\n');
}

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

// 4. 转换ES模块为Chrome扩展兼容格式
convertESModulesToIIFE();

console.log('✅ 构建后处理完成!\n');
console.log('📦 生产构建已准备就绪: dist/');
console.log('💡 提示: 可以将 dist/ 目录加载为 Chrome 扩展进行测试\n');
