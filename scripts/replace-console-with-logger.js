#!/usr/bin/env node

/**
 * Script to replace console.log/warn/error with structured logger calls
 *
 * Usage:
 *   node scripts/replace-console-with-logger.js
 *   node scripts/replace-console-with-logger.js --dry-run
 *   node scripts/replace-console-with-logger.js --file=src/app/api/some-route/route.ts
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DRY_RUN = process.argv.includes('--dry-run');
const SPECIFIC_FILE = process.argv.find(arg => arg.startsWith('--file='))?.split('=')[1];

// Directories to process
const API_ROUTES_DIR = path.join(process.cwd(), 'src/app/api');
const LIB_DIR = path.join(process.cwd(), 'src/lib');

// Files to skip (already converted or special cases)
const SKIP_FILES = [
  'src/app/api/webhooks/stripe/route.ts', // Already converted
  'src/lib/logger.ts', // Logger itself
];

// Stats tracking
const stats = {
  filesProcessed: 0,
  filesChanged: 0,
  totalReplacements: 0,
};

/**
 * Check if file already imports logger
 */
function hasLoggerImport(content) {
  return /import.*logger.*from.*['"]@\/lib\/logger['"]/.test(content);
}

/**
 * Add logger import to file
 */
function addLoggerImport(content) {
  // Find the last import statement
  const importRegex = /^import .* from ['"]/gm;
  const matches = [...content.matchAll(importRegex)];

  if (matches.length === 0) {
    // No imports found, add at the top
    return `import { logger } from '@/lib/logger';\n\n${content}`;
  }

  // Find the last import
  const lastImport = matches[matches.length - 1];
  const lastImportEnd = lastImport.index + lastImport[0].length;

  // Find the end of that line
  const restOfContent = content.slice(lastImportEnd);
  const lineEnd = restOfContent.indexOf('\n') + 1;
  const insertPosition = lastImportEnd + lineEnd;

  return (
    content.slice(0, insertPosition) +
    `import { logger } from '@/lib/logger';\n` +
    content.slice(insertPosition)
  );
}

/**
 * Replace console statements with logger calls
 */
function replaceConsoleStatements(content) {
  let replacements = 0;
  let result = content;

  // Pattern 1: console.log('Simple message')
  result = result.replace(
    /console\.log\(['"]([^'"]+)['"]\);?/g,
    (match, message) => {
      replacements++;
      return `logger.info('${message}');`;
    }
  );

  // Pattern 2: console.log('Message:', variable)
  result = result.replace(
    /console\.log\(['"]([^'"]+)['"],\s*([^)]+)\);?/g,
    (match, message, variable) => {
      replacements++;
      const varName = variable.trim();
      // Try to extract a meaningful context key
      const contextKey = varName.split('.').pop().replace(/[^a-zA-Z0-9_]/g, '');
      return `logger.info('${message}', { ${contextKey}: ${varName} });`;
    }
  );

  // Pattern 3: console.log(`Template ${variable}`)
  result = result.replace(
    /console\.log\(`([^`]*)\$\{([^}]+)\}([^`]*)`\);?/g,
    (match, before, variable, after) => {
      replacements++;
      const message = before + after;
      const varName = variable.trim();
      const contextKey = varName.split('.').pop().replace(/[^a-zA-Z0-9_]/g, '');
      return `logger.info('${message}', { ${contextKey}: ${varName} });`;
    }
  );

  // Pattern 4: console.error('Error message:', error)
  result = result.replace(
    /console\.error\(['"]([^'"]+)['"],\s*([^)]+)\);?/g,
    (match, message, errorVar) => {
      replacements++;
      return `logger.error('${message}', ${errorVar.trim()});`;
    }
  );

  // Pattern 5: console.error('Simple error')
  result = result.replace(
    /console\.error\(['"]([^'"]+)['"]\);?/g,
    (match, message) => {
      replacements++;
      return `logger.error('${message}');`;
    }
  );

  // Pattern 6: console.warn('Warning message')
  result = result.replace(
    /console\.warn\(['"]([^'"]+)['"]\);?/g,
    (match, message) => {
      replacements++;
      return `logger.warn('${message}');`;
    }
  );

  // Pattern 7: console.warn('Warning:', variable)
  result = result.replace(
    /console\.warn\(['"]([^'"]+)['"],\s*([^)]+)\);?/g,
    (match, message, variable) => {
      replacements++;
      const varName = variable.trim();
      const contextKey = varName.split('.').pop().replace(/[^a-zA-Z0-9_]/g, '');
      return `logger.warn('${message}', { ${contextKey}: ${varName} });`;
    }
  );

  // Pattern 8: console.debug
  result = result.replace(
    /console\.debug\(['"]([^'"]+)['"]\);?/g,
    (match, message) => {
      replacements++;
      return `logger.debug('${message}');`;
    }
  );

  return { content: result, replacements };
}

/**
 * Process a single file
 */
function processFile(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);

  // Check if file should be skipped
  if (SKIP_FILES.some(skip => relativePath.includes(skip))) {
    console.log(`⏭️  Skipping: ${relativePath}`);
    return;
  }

  // Read file
  const originalContent = fs.readFileSync(filePath, 'utf8');

  // Check if file has console statements
  if (!/console\.(log|error|warn|debug)/.test(originalContent)) {
    return; // No console statements, skip
  }

  console.log(`\n📝 Processing: ${relativePath}`);
  stats.filesProcessed++;

  let content = originalContent;

  // Add logger import if needed
  if (!hasLoggerImport(content)) {
    content = addLoggerImport(content);
    console.log('  ✓ Added logger import');
  }

  // Replace console statements
  const { content: newContent, replacements } = replaceConsoleStatements(content);

  if (replacements > 0) {
    console.log(`  ✓ Replaced ${replacements} console statement(s)`);
    stats.totalReplacements += replacements;
    stats.filesChanged++;

    if (!DRY_RUN) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('  ✅ File updated');
    } else {
      console.log('  🔍 (Dry run - no changes made)');
    }
  }
}

/**
 * Recursively find all TypeScript files in a directory
 */
function findTypeScriptFiles(dir) {
  const files = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...findTypeScriptFiles(fullPath));
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Main execution
 */
function main() {
  console.log('🔧 Console.log to Logger Replacement Script\n');
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN' : '✏️  WRITE'}\n`);

  let filesToProcess = [];

  if (SPECIFIC_FILE) {
    // Process specific file
    const filePath = path.join(process.cwd(), SPECIFIC_FILE);
    if (fs.existsSync(filePath)) {
      filesToProcess.push(filePath);
      console.log(`Processing single file: ${SPECIFIC_FILE}\n`);
    } else {
      console.error(`❌ File not found: ${SPECIFIC_FILE}`);
      process.exit(1);
    }
  } else {
    // Process all API routes and lib files
    console.log('📁 Scanning for TypeScript files...\n');
    filesToProcess = [
      ...findTypeScriptFiles(API_ROUTES_DIR),
      ...findTypeScriptFiles(LIB_DIR),
    ];
    console.log(`Found ${filesToProcess.length} TypeScript files\n`);
  }

  // Process all files
  filesToProcess.forEach(processFile);

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log('='.repeat(50));
  console.log(`Files scanned:       ${filesToProcess.length}`);
  console.log(`Files processed:     ${stats.filesProcessed}`);
  console.log(`Files changed:       ${stats.filesChanged}`);
  console.log(`Total replacements:  ${stats.totalReplacements}`);
  console.log('='.repeat(50));

  if (DRY_RUN) {
    console.log('\n💡 This was a dry run. Run without --dry-run to apply changes.');
  } else {
    console.log('\n✅ All changes applied successfully!');
  }
}

// Run the script
main();
