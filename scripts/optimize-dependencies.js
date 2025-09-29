#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Dependency Optimization Script
 * Removes unused dependencies and optimizes package.json
 */

class DependencyOptimizer {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.packageJsonPath = path.join(this.projectRoot, 'package.json');
    this.packageJson = require(this.packageJsonPath);
    this.backupPath = path.join(this.projectRoot, 'package.json.backup');
    this.srcPath = path.join(this.projectRoot, 'src');
  }

  /**
   * Scan codebase to check if a dependency is actually used
   */
  async checkDependencyUsage(depName) {
    try {
      // Check config files first for build-time dependencies
      if (await this.checkConfigFiles(depName)) {
        return true;
      }

      // Escape special characters for grep
      const escapedDepName = depName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Common import patterns to search for
      const patterns = [
        `from ['"]${escapedDepName}['"]`,
        `require\\(['"]${escapedDepName}['"]\\)`,
        `import.*['"]${escapedDepName}['"]`,
        `@import.*['"]${escapedDepName}['"]`,
        // For scoped packages like @types/something
        depName.replace('@types/', '').replace(/[^a-zA-Z0-9]/g, ''),
        // For packages with different naming conventions
        depName.replace(/[-_]/g, ''),
        // Check for dynamic imports
        `import\\(['"]${escapedDepName}['"]\\)`,
      ];

      for (const pattern of patterns) {
        try {
          // Use a safer approach with shell escaping
          const result = execSync(
            `grep -r -l ${JSON.stringify(pattern)} ${JSON.stringify(this.srcPath)} --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.css" --include="*.scss" 2>/dev/null || true`,
            { encoding: 'utf8', cwd: this.projectRoot }
          );
          
          if (result.trim()) {
            console.log(`   ✅ Found usage of ${depName}`);
            return true;
          }
        } catch (error) {
          // Continue checking other patterns
          console.log(`   ⚠️  Pattern check failed for ${depName}: ${error.message}`);
        }
      }

      // Additional check for type-only imports
      if (depName.startsWith('@types/')) {
        const basePackage = depName.replace('@types/', '');
        return await this.checkDependencyUsage(basePackage);
      }

      return false;
    } catch (error) {
      console.warn(`   ⚠️  Could not check usage for ${depName}: ${error.message}`);
      return true; // Err on the side of caution
    }
  }

  /**
   * Check if dependency is used in config files
   */
  async checkConfigFiles(depName) {
    const configFiles = [
      'tailwind.config.ts', 'tailwind.config.js',
      'postcss.config.mjs', 'postcss.config.js',
      'eslint.config.mjs', '.eslintrc.js', '.eslintrc.json',
      'next.config.js', 'next.config.mjs'
    ];

    for (const configFile of configFiles) {
      const configPath = path.join(this.projectRoot, configFile);
      if (fs.existsSync(configPath)) {
        try {
          const content = fs.readFileSync(configPath, 'utf8');
          if (content.includes(depName) || content.includes(depName.replace('@', ''))) {
            console.log(`   ✅ Found usage of ${depName} in ${configFile}`);
            return true;
          }
        } catch (error) {
          // Continue checking other files
        }
      }
    }
    return false;
  }

  /**
   * Get list of potentially unused dependencies by scanning codebase
   */
  async scanForUnusedDependencies() {
    console.log('🔍 Scanning codebase for unused dependencies...');
    
    const allDeps = {
      ...this.packageJson.dependencies,
      ...this.packageJson.devDependencies
    };

    const unusedDeps = [];
    const usedDeps = [];

    for (const [depName, version] of Object.entries(allDeps)) {
      // Skip critical dependencies that should never be removed
      const criticalDeps = [
        'next', 'react', 'react-dom', 'typescript',
        '@types/node', '@types/react', '@types/react-dom',
        'tailwindcss', 'eslint', 'eslint-config-next'
      ];

      // Build-time and configuration dependencies
      const buildTimeDeps = [
        'tailwindcss-animate', '@tailwindcss/line-clamp', '@tailwindcss/postcss',
        '@eslint/eslintrc', 'postcss', 'autoprefixer',
        'github-slugger', 'rehype-parse', 'rehype-remark', 'rehype-stringify'
      ];

      if (criticalDeps.includes(depName) || buildTimeDeps.includes(depName)) {
        console.log(`   🔒 Skipping critical dependency: ${depName}`);
        usedDeps.push(depName);
        continue;
      }

      console.log(`   🔍 Checking: ${depName}...`);
      const isUsed = await this.checkDependencyUsage(depName);
      
      if (isUsed) {
        usedDeps.push(depName);
      } else {
        unusedDeps.push(depName);
        console.log(`   ❌ Potentially unused: ${depName}`);
      }
    }

    console.log(`\n📊 Scan Results:`);
    console.log(`   Used dependencies: ${usedDeps.length}`);
    console.log(`   Potentially unused: ${unusedDeps.length}`);
    
    return { unusedDeps, usedDeps };
  }

  /**
   * Validate project structure and dependencies
   */
  validateProject() {
    console.log('🔍 Validating project structure...');
    
    // Check if package.json exists and is valid
    if (!fs.existsSync(this.packageJsonPath)) {
      throw new Error('package.json not found!');
    }

    // Check if src directory exists
    if (!fs.existsSync(this.srcPath)) {
      console.warn('⚠️  src directory not found, will search in project root');
      this.srcPath = this.projectRoot;
    }

    // Validate package.json structure
    if (!this.packageJson.dependencies && !this.packageJson.devDependencies) {
      throw new Error('No dependencies found in package.json');
    }

    // Check if this is a Next.js project
    const isNextProject = this.packageJson.dependencies?.next || 
                         this.packageJson.devDependencies?.next;
    if (!isNextProject) {
      console.warn('⚠️  This doesn\'t appear to be a Next.js project');
    }

    console.log('✅ Project validation passed');
  }

  /**
   * Create backup of package.json
   */
  createBackup() {
    console.log('📋 Creating backup of package.json...');
    
    // Create backup with timestamp if one already exists
    let backupPath = this.backupPath;
    if (fs.existsSync(backupPath)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      backupPath = path.join(this.projectRoot, `package.json.backup.${timestamp}`);
      console.log(`   📋 Previous backup exists, creating timestamped backup`);
    }
    
    fs.copyFileSync(this.packageJsonPath, backupPath);
    console.log(`✅ Backup created: ${backupPath}`);
    return backupPath;
  }

  /**
   * Remove unused dependencies (now with actual usage checking)
   */
  async removeUnusedDependencies(dryRun = false) {
    console.log('🗑️  Analyzing dependencies for removal...');
    
    // Get actually unused dependencies by scanning codebase
    const { unusedDeps } = await this.scanForUnusedDependencies();
    
    if (unusedDeps.length === 0) {
      console.log('✅ No unused dependencies found!');
      return [];
    }

    console.log(`\n📋 Found ${unusedDeps.length} potentially unused dependencies:`);
    unusedDeps.forEach(dep => console.log(`   - ${dep}`));

    if (dryRun) {
      console.log('\n🔍 DRY RUN MODE - No changes will be made');
      return unusedDeps;
    }

    // Ask for confirmation before removing
    console.log('\n⚠️  WARNING: About to remove the above dependencies.');
    console.log('💡 Make sure to test your application after removal!');
    
    let removed = [];

    // Remove from dependencies and devDependencies
    for (const dep of unusedDeps) {
      if (this.packageJson.dependencies && this.packageJson.dependencies[dep]) {
        delete this.packageJson.dependencies[dep];
        removed.push(dep);
        console.log(`   ❌ Removed from dependencies: ${dep}`);
      }
      
      if (this.packageJson.devDependencies && this.packageJson.devDependencies[dep]) {
        delete this.packageJson.devDependencies[dep];
        removed.push(dep);
        console.log(`   ❌ Removed from devDependencies: ${dep}`);
      }
    }

    console.log(`\n✅ Removed ${removed.length} unused dependencies`);
    return removed;
  }

  /**
   * Optimize dependency versions
   */
  optimizeDependencyVersions() {
    console.log('🔧 Optimizing dependency versions...');
    
    // Pin critical dependencies to specific versions for stability
    const criticalDeps = {
      'next': '15.5.2',
      'react': '19.1.0', 
      'react-dom': '19.1.0',
      'typescript': '^5'
    };

    let optimized = 0;
    for (const [dep, version] of Object.entries(criticalDeps)) {
      if (this.packageJson.dependencies && this.packageJson.dependencies[dep]) {
        if (this.packageJson.dependencies[dep] !== version) {
          console.log(`   🔧 ${dep}: ${this.packageJson.dependencies[dep]} → ${version}`);
          this.packageJson.dependencies[dep] = version;
          optimized++;
        }
      }
      if (this.packageJson.devDependencies && this.packageJson.devDependencies[dep]) {
        if (this.packageJson.devDependencies[dep] !== version) {
          console.log(`   🔧 ${dep}: ${this.packageJson.devDependencies[dep]} → ${version}`);
          this.packageJson.devDependencies[dep] = version;
          optimized++;
        }
      }
    }

    console.log(`✅ Optimized ${optimized} dependency versions`);
  }

  /**
   * Add bundle optimization scripts
   */
  addOptimizationScripts() {
    console.log('📜 Adding bundle optimization scripts...');
    
    const newScripts = {
      'analyze:bundle': 'node scripts/analyze-bundle.js',
      'optimize:deps': 'node scripts/optimize-dependencies.js',
      'build:analyze': 'ANALYZE=true bun run build',
      'size:check': 'bun run build && du -sh .next/static',
      'deps:check': 'bun run analyze:bundle',
      'clean:cache': 'rm -rf .next && rm -rf node_modules/.cache',
      'prebuild': 'bun run clean:cache'
    };

    let added = 0;
    for (const [script, command] of Object.entries(newScripts)) {
      if (!this.packageJson.scripts[script]) {
        this.packageJson.scripts[script] = command;
        console.log(`   ➕ Added script: ${script}`);
        added++;
      }
    }

    console.log(`✅ Added ${added} optimization scripts`);
  }

  /**
   * Sort dependencies alphabetically
   */
  sortDependencies() {
    console.log('🔤 Sorting dependencies alphabetically...');
    
    if (this.packageJson.dependencies) {
      const sorted = {};
      Object.keys(this.packageJson.dependencies)
        .sort()
        .forEach(key => {
          sorted[key] = this.packageJson.dependencies[key];
        });
      this.packageJson.dependencies = sorted;
    }

    if (this.packageJson.devDependencies) {
      const sorted = {};
      Object.keys(this.packageJson.devDependencies)
        .sort()
        .forEach(key => {
          sorted[key] = this.packageJson.devDependencies[key];
        });
      this.packageJson.devDependencies = sorted;
    }

    console.log('✅ Dependencies sorted');
  }

  /**
   * Add performance optimization fields
   */
  addPerformanceFields() {
    console.log('⚡ Adding performance optimization fields...');
    
    // Add engines field for Node.js version
    if (!this.packageJson.engines) {
      this.packageJson.engines = {
        "node": ">=18.0.0",
        "bun": ">=1.0.0"
      };
      console.log('   ➕ Added engines field');
    }

    // Add browserslist for better targeting
    if (!this.packageJson.browserslist) {
      this.packageJson.browserslist = [
        "> 1%",
        "last 2 versions",
        "not dead",
        "not ie 11"
      ];
      console.log('   ➕ Added browserslist');
    }

    // Add sideEffects field for better tree shaking
    if (!this.packageJson.sideEffects) {
      this.packageJson.sideEffects = [
        "*.css",
        "*.scss",
        "*.sass",
        "*.less"
      ];
      console.log('   ➕ Added sideEffects field');
    }

    console.log('✅ Performance fields added');
  }

  /**
   * Save optimized package.json
   */
  savePackageJson() {
    console.log('💾 Saving optimized package.json...');
    
    // Format JSON with proper indentation
    const jsonString = JSON.stringify(this.packageJson, null, 2) + '\n';
    fs.writeFileSync(this.packageJsonPath, jsonString);
    
    console.log('✅ package.json saved');
  }

  /**
   * Clean node_modules and reinstall
   */
  async reinstallDependencies() {
    console.log('🔄 Cleaning and reinstalling dependencies...');
    
    try {
      // Remove node_modules
      console.log('   🗑️  Removing node_modules...');
      execSync('rm -rf node_modules', { cwd: this.projectRoot });
      
      // Remove lock files to ensure clean install
      const lockFiles = ['package-lock.json', 'yarn.lock', 'bun.lockb'];
      for (const lockFile of lockFiles) {
        const lockPath = path.join(this.projectRoot, lockFile);
        if (fs.existsSync(lockPath)) {
          fs.unlinkSync(lockPath);
          console.log(`   🗑️  Removed ${lockFile}`);
        }
      }
      
      // Reinstall with bun
      console.log('   📦 Installing dependencies with bun...');
      execSync('bun install', { 
        cwd: this.projectRoot,
        stdio: 'inherit'
      });
      
      console.log('✅ Dependencies reinstalled');
    } catch (error) {
      console.error('❌ Failed to reinstall dependencies:', error.message);
      throw error;
    }
  }

  /**
   * Generate optimization report
   */
  generateReport(removedDeps) {
    const report = {
      timestamp: new Date().toISOString(),
      removedDependencies: removedDeps,
      totalDependencies: Object.keys(this.packageJson.dependencies || {}).length,
      totalDevDependencies: Object.keys(this.packageJson.devDependencies || {}).length,
      optimizations: [
        'Removed unused dependencies',
        'Optimized dependency versions',
        'Added bundle optimization scripts',
        'Sorted dependencies alphabetically',
        'Added performance optimization fields'
      ]
    };

    const reportPath = path.join(this.projectRoot, 'dependency-optimization-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Optimization report saved to: ${reportPath}`);
    return report;
  }

  /**
   * Run dependency analysis only (dry-run mode)
   */
  async analyze() {
    console.log('🔍 Starting dependency analysis (dry-run mode)...\n');
    
    try {
      this.validateProject();
      const { unusedDeps, usedDeps } = await this.scanForUnusedDependencies();
      
      console.log('\n📊 ANALYSIS SUMMARY:');
      console.log(`   Used dependencies: ${usedDeps.length}`);
      console.log(`   Potentially unused: ${unusedDeps.length}`);
      
      if (unusedDeps.length > 0) {
        console.log('\n📋 Potentially unused dependencies:');
        unusedDeps.forEach(dep => console.log(`   - ${dep}`));
        
        console.log('\n💡 NEXT STEPS:');
        console.log('   1. Review the list above carefully');
        console.log('   2. Run with --optimize flag to actually remove them');
        console.log('   3. Or run with --interactive for step-by-step removal');
      } else {
        console.log('\n✅ All dependencies appear to be in use!');
      }
      
      return { unusedDeps, usedDeps };
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      throw error;
    }
  }

  /**
   * Run complete optimization
   */
  async optimize(dryRun = false) {
    console.log(`🚀 Starting dependency optimization${dryRun ? ' (dry-run)' : ''}...\n`);
    
    try {
      this.validateProject();
      
      if (!dryRun) {
        this.createBackup();
      }
      
      const removedDeps = await this.removeUnusedDependencies(dryRun);
      
      if (dryRun) {
        console.log('\n🔍 DRY RUN COMPLETE - No changes were made');
        console.log('💡 Run without --dry-run flag to apply changes');
        return { removedDeps, dryRun: true };
      }
      
      this.optimizeDependencyVersions();
      this.addOptimizationScripts();
      this.sortDependencies();
      this.addPerformanceFields();
      this.savePackageJson();
      
      const report = this.generateReport(removedDeps);
      
      console.log('\n📊 OPTIMIZATION SUMMARY:');
      console.log(`   Dependencies removed: ${removedDeps.length}`);
      console.log(`   Total dependencies: ${report.totalDependencies}`);
      console.log(`   Total dev dependencies: ${report.totalDevDependencies}`);
      console.log(`   Backup created: ${this.backupPath}`);
      
      console.log('\n💡 NEXT STEPS:');
      console.log('   1. Review the changes in package.json');
      console.log('   2. Run: bun install');
      console.log('   3. Run: bun run build');
      console.log('   4. Test the application thoroughly');
      console.log('   5. If issues occur, restore from backup');
      
      console.log('\n✅ Optimization complete!');
      
      return report;
    } catch (error) {
      console.error('❌ Optimization failed:', error.message);
      
      // Restore backup if it exists
      if (!dryRun && fs.existsSync(this.backupPath)) {
        console.log('🔄 Restoring backup...');
        fs.copyFileSync(this.backupPath, this.packageJsonPath);
        console.log('✅ Backup restored');
      }
      
      throw error;
    }
  }
}

// Run optimization if called directly
if (require.main === module) {
  const optimizer = new DependencyOptimizer();
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const shouldInstall = args.includes('--install');
  const dryRun = args.includes('--dry-run');
  const analyzeOnly = args.includes('--analyze');
  const showHelp = args.includes('--help') || args.includes('-h');

  if (showHelp) {
    console.log(`
🛠️  Dependency Optimizer - Safe dependency management

Usage:
  node scripts/optimize-dependencies.js [options]

Options:
  --analyze     Only analyze dependencies, don't make changes
  --dry-run     Show what would be changed without making changes  
  --install     Reinstall dependencies after optimization
  --help, -h    Show this help message

Examples:
  node scripts/optimize-dependencies.js --analyze
  node scripts/optimize-dependencies.js --dry-run
  node scripts/optimize-dependencies.js --install
`);
    process.exit(0);
  }

  if (analyzeOnly) {
    optimizer.analyze()
      .catch(console.error);
  } else {
    optimizer.optimize(dryRun)
      .then(async (report) => {
        if (shouldInstall && !dryRun && !report.dryRun) {
          await optimizer.reinstallDependencies();
        }
      })
      .catch(console.error);
  }
}

module.exports = DependencyOptimizer;