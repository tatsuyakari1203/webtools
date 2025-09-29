#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script để dọn dẹp các folder trống trong dự án
 * Sử dụng: node scripts/cleanup-empty-folders.js [--dry-run] [--exclude=folder1,folder2]
 */

class EmptyFolderCleaner {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.excludeFolders = new Set([
      'node_modules',
      '.git',
      '.next',
      'dist',
      'build',
      '.vscode',
      'logs',
      'public',
      ...(options.exclude || [])
    ]);
    this.deletedFolders = [];
    this.skippedFolders = [];
  }

  /**
   * Kiểm tra xem folder có trống không
   */
  async isFolderEmpty(folderPath) {
    try {
      const items = await fs.promises.readdir(folderPath);
      return items.length === 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Kiểm tra xem folder có nên được bỏ qua không
   */
  shouldSkipFolder(folderPath) {
    const folderName = path.basename(folderPath);
    return this.excludeFolders.has(folderName) || folderName.startsWith('.');
  }

  /**
   * Dọn dẹp folder trống một cách đệ quy
   */
  async cleanupEmptyFolders(dirPath) {
    try {
      const items = await fs.promises.readdir(dirPath, { withFileTypes: true });
      
      // Xử lý các subfolder trước
      for (const item of items) {
        if (item.isDirectory()) {
          const subFolderPath = path.join(dirPath, item.name);
          
          if (this.shouldSkipFolder(subFolderPath)) {
            this.skippedFolders.push(subFolderPath);
            continue;
          }

          // Đệ quy vào subfolder
          await this.cleanupEmptyFolders(subFolderPath);
        }
      }

      // Kiểm tra lại xem folder hiện tại có trống không sau khi dọn dẹp subfolder
      if (await this.isFolderEmpty(dirPath)) {
        if (this.dryRun) {
          console.log(`[DRY RUN] Sẽ xóa folder trống: ${dirPath}`);
        } else {
          await fs.promises.rmdir(dirPath);
          console.log(`✅ Đã xóa folder trống: ${dirPath}`);
        }
        this.deletedFolders.push(dirPath);
      }

    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`❌ Lỗi khi xử lý ${dirPath}:`, error.message);
      }
    }
  }

  /**
   * Chạy script dọn dẹp
   */
  async run(startPath = process.cwd()) {
    console.log(`🧹 Bắt đầu dọn dẹp folder trống từ: ${startPath}`);
    console.log(`📋 Chế độ: ${this.dryRun ? 'DRY RUN (chỉ xem trước)' : 'THỰC THI'}`);
    console.log(`🚫 Bỏ qua các folder: ${Array.from(this.excludeFolders).join(', ')}`);
    console.log('');

    const startTime = Date.now();
    
    try {
      await this.cleanupEmptyFolders(startPath);
      
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      console.log('');
      console.log('📊 KẾT QUẢ:');
      console.log(`⏱️  Thời gian: ${duration}s`);
      console.log(`🗑️  Folder đã xóa: ${this.deletedFolders.length}`);
      console.log(`⏭️  Folder bỏ qua: ${this.skippedFolders.length}`);

      if (this.deletedFolders.length > 0) {
        console.log('\n📁 Danh sách folder đã xóa:');
        this.deletedFolders.forEach(folder => {
          console.log(`   - ${folder}`);
        });
      }

      if (this.dryRun && this.deletedFolders.length > 0) {
        console.log('\n💡 Để thực sự xóa các folder, chạy lại script mà không có --dry-run');
      }

    } catch (error) {
      console.error('❌ Lỗi khi dọn dẹp:', error.message);
      process.exit(1);
    }
  }
}

// Xử lý command line arguments
function parseArguments() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: false,
    exclude: []
  };

  for (const arg of args) {
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg.startsWith('--exclude=')) {
      const excludeList = arg.split('=')[1];
      options.exclude = excludeList.split(',').map(s => s.trim());
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
🧹 Script dọn dẹp folder trống

Sử dụng:
  node scripts/cleanup-empty-folders.js [options]

Options:
  --dry-run                    Chỉ xem trước, không thực sự xóa
  --exclude=folder1,folder2    Bỏ qua các folder cụ thể
  --help, -h                   Hiển thị hướng dẫn này

Ví dụ:
  node scripts/cleanup-empty-folders.js --dry-run
  node scripts/cleanup-empty-folders.js --exclude=temp,cache
  bun run cleanup:folders --dry-run
      `);
      process.exit(0);
    }
  }

  return options;
}

// Chạy script
if (require.main === module) {
  const options = parseArguments();
  const cleaner = new EmptyFolderCleaner(options);
  cleaner.run().catch(console.error);
}

module.exports = EmptyFolderCleaner;