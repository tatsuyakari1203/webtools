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
  }

  /**
   * Create backup of package.json
   */
  createBackup() {
    console.log('📋 Creating backup of package.json...');
    fs.copyFileSync(this.packageJsonPath, this.backupPath);
    console.log(`✅ Backup created: ${this.backupPath}`);
  }

  /**
   * Remove unused dependencies
   */
  removeUnusedDependencies() {
    console.log('🗑️  Removing unused dependencies...');
    
    // Dependencies that are definitely unused based on analysis
    const unusedDeps = [
      '@types/cropperjs',
      '@types/dompurify', 
      '@types/howler',
      '@types/turndown',
      'cropperjs',
      'dompurify',
      'exif-js',
      'github-slugger',
      'hastscript',
      'he',
      'react-cropper',
      'rehype-parse',
      'rehype-remark', 
      'rehype-stringify',
      'turndown',
      'unist-util-visit-parents',
      'use-sound'
    ];

    // Dev dependencies that are unused
    const unusedDevDeps = [
      '@eslint/eslintrc',
      '@tailwindcss/line-clamp',
      '@types/file-saver',
      '@types/he',
      'tw-animate-css'
    ];

    let removed = [];

    // Remove from dependencies
    for (const dep of unusedDeps) {
      if (this.packageJson.dependencies && this.packageJson.dependencies[dep]) {
        delete this.packageJson.dependencies[dep];
        removed.push(dep);
        console.log(`   ❌ Removed: ${dep}`);
      }
    }

    // Remove from devDependencies  
    for (const dep of unusedDevDeps) {
      if (this.packageJson.devDependencies && this.packageJson.devDependencies[dep]) {
        delete this.packageJson.devDependencies[dep];
        removed.push(dep);
        console.log(`   ❌ Removed: ${dep} (dev)`);
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
   * Run complete optimization
   */
  async optimize() {
    console.log('🚀 Starting dependency optimization...\n');
    
    try {
      this.createBackup();
      const removedDeps = this.removeUnusedDependencies();
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
      if (fs.existsSync(this.backupPath)) {
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
  
  // Check for --install flag
  const shouldInstall = process.argv.includes('--install');
  
  optimizer.optimize()
    .then(async (report) => {
      if (shouldInstall) {
        await optimizer.reinstallDependencies();
      }
    })
    .catch(console.error);
}

module.exports = DependencyOptimizer;