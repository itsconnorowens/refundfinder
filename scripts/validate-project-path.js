#!/usr/bin/env node

/**
 * Project Path Validation Script
 * 
 * This script validates that we're working in the correct project directory
 * and prevents confusion with other projects.
 */

const path = require('path');
const fs = require('fs');

const EXPECTED_PROJECT_NAME = 'refundfinder';
const EXPECTED_PROJECT_PATH = '/Users/connorowens/Desktop/refundfinder';

function validateProjectPath() {
  const currentPath = process.cwd();
  const projectName = path.basename(currentPath);
  
  console.log(`Current working directory: ${currentPath}`);
  console.log(`Project name: ${projectName}`);
  
  // Check if we're in the correct project directory
  if (projectName !== EXPECTED_PROJECT_NAME) {
    console.error(`❌ ERROR: Expected to be in '${EXPECTED_PROJECT_NAME}' directory, but found '${projectName}'`);
    console.error(`Please navigate to the correct project directory: ${EXPECTED_PROJECT_PATH}`);
    process.exit(1);
  }
  
  // Check if we're in the correct absolute path
  if (currentPath !== EXPECTED_PROJECT_PATH) {
    console.warn(`⚠️  WARNING: Expected path '${EXPECTED_PROJECT_PATH}', but found '${currentPath}'`);
    console.warn('This might indicate the project has been moved or renamed.');
  }
  
  // Check for package.json to confirm this is a valid project
  const packageJsonPath = path.join(currentPath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ ERROR: No package.json found. This does not appear to be a valid project directory.');
    process.exit(1);
  }
  
  // Read package.json to verify project name
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (packageJson.name !== EXPECTED_PROJECT_NAME) {
      console.warn(`⚠️  WARNING: Package name is '${packageJson.name}', expected '${EXPECTED_PROJECT_NAME}'`);
    }
  } catch (error) {
    console.error('❌ ERROR: Could not read package.json:', error.message);
    process.exit(1);
  }
  
  console.log('✅ Project path validation passed!');
  console.log(`✅ Working in correct project: ${EXPECTED_PROJECT_NAME}`);
}

// Run validation if this script is executed directly
if (require.main === module) {
  validateProjectPath();
}

module.exports = { validateProjectPath };
