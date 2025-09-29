#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Bundle Analysis and Optimization Script
 * Analyzes the project for unused dependencies and bundle optimization opportunities
 */

class BundleAnalyzer {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.packageJson = require(path.join(this.projectRoot, 'package.json'));
    this.srcDir = path.join(this.projectRoot, 'src');
    this.publicDir = path.join(this.projectRoot, 'public');
    
    this.usedDependencies = new Set();
    this.unusedDependencies = [];
    this.heavyDependencies = [];
    this.optimizationSuggestions = [];
  }

  /**
   * Scan all source files for import statements
   */
  scanSourceFiles() {
    console.log('🔍 Scanning source files for dependencies...');
    
    const scanDirectory = (dir) => {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          // Skip node_modules and .next directories
          if (!['node_modules', '.next', '.git'].includes(file)) {
            scanDirectory(filePath);
          }
        } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
          this.scanFile(filePath);
        }
      }
    };

    scanDirectory(this.srcDir);
    
    // Also scan root level files
    const rootFiles = ['next.config.js', 'tailwind.config.js', 'postcss.config.js'];
    for (const file of rootFiles) {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        this.scanFile(filePath);
      }
    }
  }

  /**
   * Scan individual file for imports
   */
  scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Match various import patterns
      const importPatterns = [
        /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g,
        /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
        /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
        /from\s+['"]([^'"]+)['"]/g,
      ];

      for (const pattern of importPatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const importPath = match[1];
          
          // Extract package name (handle scoped packages)
          let packageName = importPath;
          if (importPath.startsWith('@')) {
            const parts = importPath.split('/');
            packageName = parts.slice(0, 2).join('/');
          } else {
            packageName = importPath.split('/')[0];
          }
          
          // Skip relative imports and built-in modules
          if (!importPath.startsWith('.') && !importPath.startsWith('/') && 
              !['fs', 'path', 'crypto', 'http', 'https', 'url', 'util'].includes(packageName)) {
            this.usedDependencies.add(packageName);
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not scan ${filePath}: ${error.message}`);
    }
  }

  /**
   * Find unused dependencies
   */
  findUnusedDependencies() {
    console.log('🔍 Analyzing unused dependencies...');
    
    const allDependencies = {
      ...this.packageJson.dependencies,
      ...this.packageJson.devDependencies
    };

    for (const dep of Object.keys(allDependencies)) {
      if (!this.usedDependencies.has(dep)) {
        // Check if it's a commonly unused but necessary dependency
        const necessaryDeps = [
          'typescript',
          'eslint',
          'tailwindcss',
          '@types/node',
          '@types/react',
          '@types/react-dom',
          'eslint-config-next',
          '@tailwindcss/postcss'
        ];
        
        if (!necessaryDeps.includes(dep)) {
          this.unusedDependencies.push(dep);
        }
      }
    }
  }

  /**
   * Analyze heavy dependencies
   */
  analyzeHeavyDependencies() {
    console.log('📊 Analyzing heavy dependencies...');
    
    // Known heavy dependencies and their lighter alternatives
    const heavyDeps = {
      'moment': { size: '~67KB', alternative: 'date-fns (~13KB) or dayjs (~2KB)' },
      'lodash': { size: '~70KB', alternative: 'lodash-es with tree shaking or native JS' },
      'axios': { size: '~15KB', alternative: 'native fetch API' },
      'react-router-dom': { size: '~20KB', alternative: 'Next.js built-in routing' },
      'material-ui': { size: '~300KB+', alternative: 'Radix UI (already used)' },
      'antd': { size: '~500KB+', alternative: 'Radix UI (already used)' },
      'chart.js': { size: '~60KB', alternative: 'recharts with tree shaking' },
      'three': { size: '~600KB', alternative: 'Consider if 3D is necessary' },
    };

    for (const [dep, info] of Object.entries(heavyDeps)) {
      if (this.usedDependencies.has(dep)) {
        this.heavyDependencies.push({ name: dep, ...info });
      }
    }
  }

  /**
   * Generate optimization suggestions
   */
  generateOptimizations() {
    console.log('💡 Generating optimization suggestions...');
    
    // Check for duplicate functionality
    const duplicateFunctionality = [
      {
        packages: ['react-image-crop', 'react-cropper', 'cropperjs'],
        suggestion: 'Multiple image cropping libraries detected. Consider using only one.'
      },
      {
        packages: ['rehype-parse', 'rehype-dom-parse'],
        suggestion: 'Multiple HTML parsing libraries. Consider consolidating.'
      },
      {
        packages: ['remark-stringify', 'turndown'],
        suggestion: 'Multiple markdown conversion tools. Consider using unified pipeline.'
      }
    ];

    for (const check of duplicateFunctionality) {
      const foundPackages = check.packages.filter(pkg => this.usedDependencies.has(pkg));
      if (foundPackages.length > 1) {
        this.optimizationSuggestions.push({
          type: 'duplicate',
          packages: foundPackages,
          suggestion: check.suggestion
        });
      }
    }

    // Check for tree-shaking opportunities
    const treeShakingOpportunities = [
      {
        package: 'lucide-react',
        suggestion: 'Import specific icons instead of the entire library: import { Icon } from "lucide-react/dist/esm/icons/icon"'
      },
      {
        package: 'react-syntax-highlighter',
        suggestion: 'Import specific languages and styles to reduce bundle size'
      }
    ];

    for (const opportunity of treeShakingOpportunities) {
      if (this.usedDependencies.has(opportunity.package)) {
        this.optimizationSuggestions.push({
          type: 'tree-shaking',
          package: opportunity.package,
          suggestion: opportunity.suggestion
        });
      }
    }

    // Bundle splitting suggestions
    this.optimizationSuggestions.push({
      type: 'bundle-splitting',
      suggestion: 'Consider lazy loading heavy components and tools to reduce initial bundle size'
    });

    this.optimizationSuggestions.push({
      type: 'compression',
      suggestion: 'Enable gzip/brotli compression in production deployment'
    });
  }

  /**
   * Generate report
   */
  generateReport() {
    const report = {
      summary: {
        totalDependencies: Object.keys(this.packageJson.dependencies || {}).length,
        totalDevDependencies: Object.keys(this.packageJson.devDependencies || {}).length,
        usedDependencies: this.usedDependencies.size,
        unusedDependencies: this.unusedDependencies.length,
        heavyDependencies: this.heavyDependencies.length,
        optimizationSuggestions: this.optimizationSuggestions.length
      },
      unusedDependencies: this.unusedDependencies,
      heavyDependencies: this.heavyDependencies,
      optimizationSuggestions: this.optimizationSuggestions,
      usedDependencies: Array.from(this.usedDependencies).sort()
    };

    return report;
  }

  /**
   * Print formatted report
   */
  printReport(report) {
    console.log('\n📋 BUNDLE ANALYSIS REPORT');
    console.log('========================\n');

    // Summary
    console.log('📊 SUMMARY:');
    console.log(`   Total Dependencies: ${report.summary.totalDependencies}`);
    console.log(`   Total Dev Dependencies: ${report.summary.totalDevDependencies}`);
    console.log(`   Used Dependencies: ${report.summary.usedDependencies}`);
    console.log(`   Unused Dependencies: ${report.summary.unusedDependencies}`);
    console.log(`   Heavy Dependencies: ${report.summary.heavyDependencies}`);
    console.log(`   Optimization Opportunities: ${report.summary.optimizationSuggestions}\n`);

    // Unused dependencies
    if (report.unusedDependencies.length > 0) {
      console.log('🗑️  UNUSED DEPENDENCIES:');
      for (const dep of report.unusedDependencies) {
        console.log(`   - ${dep}`);
      }
      console.log(`\n   💡 Run: npm uninstall ${report.unusedDependencies.join(' ')}\n`);
    } else {
      console.log('✅ No unused dependencies found!\n');
    }

    // Heavy dependencies
    if (report.heavyDependencies.length > 0) {
      console.log('⚖️  HEAVY DEPENDENCIES:');
      for (const dep of report.heavyDependencies) {
        console.log(`   - ${dep.name} (${dep.size})`);
        console.log(`     Alternative: ${dep.alternative}`);
      }
      console.log('');
    }

    // Optimization suggestions
    if (report.optimizationSuggestions.length > 0) {
      console.log('💡 OPTIMIZATION SUGGESTIONS:');
      for (const suggestion of report.optimizationSuggestions) {
        console.log(`   ${suggestion.type.toUpperCase()}:`);
        if (suggestion.packages) {
          console.log(`   Packages: ${suggestion.packages.join(', ')}`);
        }
        if (suggestion.package) {
          console.log(`   Package: ${suggestion.package}`);
        }
        console.log(`   Suggestion: ${suggestion.suggestion}\n`);
      }
    }

    // Used dependencies (for reference)
    console.log('📦 USED DEPENDENCIES:');
    const chunks = [];
    for (let i = 0; i < report.usedDependencies.length; i += 5) {
      chunks.push(report.usedDependencies.slice(i, i + 5));
    }
    for (const chunk of chunks) {
      console.log(`   ${chunk.join(', ')}`);
    }
  }

  /**
   * Save report to file
   */
  saveReport(report) {
    const reportPath = path.join(this.projectRoot, 'bundle-analysis-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved to: ${reportPath}`);
  }

  /**
   * Run complete analysis
   */
  async analyze() {
    console.log('🚀 Starting bundle analysis...\n');
    
    try {
      this.scanSourceFiles();
      this.findUnusedDependencies();
      this.analyzeHeavyDependencies();
      this.generateOptimizations();
      
      const report = this.generateReport();
      this.printReport(report);
      this.saveReport(report);
      
      console.log('\n✅ Analysis complete!');
      
      return report;
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      throw error;
    }
  }
}

// Run analysis if called directly
if (require.main === module) {
  const analyzer = new BundleAnalyzer();
  analyzer.analyze().catch(console.error);
}

module.exports = BundleAnalyzer;