import { InventoryItem, InventoryStats, InventoryFilter } from '@/types/inventory';
import { inventoryDB } from './inventory-db';

export class InventoryService {
  // Tạo ID duy nhất cho item
  private generateId(): string {
    return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Phát hiện loại content
  private detectContentType(content: string): InventoryItem['type'] {
    // Kiểm tra JSON
    try {
      JSON.parse(content);
      return 'json';
    } catch {}

    // Kiểm tra HTML
    if (content.includes('<') && content.includes('>')) {
      return 'html';
    }

    // Kiểm tra Markdown
    if (content.includes('#') || content.includes('**') || content.includes('*') || content.includes('```')) {
      return 'markdown';
    }

    // Kiểm tra code patterns
    const codePatterns = [
      /function\s+\w+\s*\(/,
      /const\s+\w+\s*=/,
      /let\s+\w+\s*=/,
      /var\s+\w+\s*=/,
      /class\s+\w+/,
      /import\s+.*from/,
      /export\s+(default\s+)?/,
      /<\?php/,
      /def\s+\w+\s*\(/,
      /public\s+class/
    ];

    if (codePatterns.some(pattern => pattern.test(content))) {
      return 'code';
    }

    return 'text';
  }

  // Tính kích thước content
  private calculateSize(content: string): number {
    return new Blob([content]).size;
  }

  // Tạo title từ content
  private generateTitle(content: string, maxLength: number = 50): string {
    const lines = content.split('\n').filter(line => line.trim());
    const firstLine = lines[0] || 'Untitled';
    
    if (firstLine.length <= maxLength) {
      return firstLine;
    }
    
    return firstLine.substring(0, maxLength - 3) + '...';
  }

  // Thêm item mới
  async addItem(data: {
    title?: string;
    content: string;
    type?: InventoryItem['type'];
    source?: string;
    tags?: string[];
  }): Promise<InventoryItem> {
    const now = new Date();
    const item: InventoryItem = {
      id: this.generateId(),
      title: data.title || this.generateTitle(data.content),
      content: data.content,
      type: data.type || this.detectContentType(data.content),
      source: data.source,
      tags: data.tags || [],
      createdAt: now,
      updatedAt: now,
      size: this.calculateSize(data.content),
      isFavorite: false
    };

    await inventoryDB.addItem(item);
    return item;
  }

  // Cập nhật item
  async updateItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    const existingItem = await inventoryDB.getItem(id);
    if (!existingItem) {
      throw new Error('Item not found');
    }

    const updatedItem: InventoryItem = {
      ...existingItem,
      ...updates,
      id, // Đảm bảo ID không thay đổi
      updatedAt: new Date(),
      // Tính lại size nếu content thay đổi
      size: updates.content ? this.calculateSize(updates.content) : existingItem.size,
      // Tự động detect type nếu content thay đổi và type không được chỉ định
      type: updates.content && !updates.type ? this.detectContentType(updates.content) : (updates.type || existingItem.type)
    };

    await inventoryDB.updateItem(updatedItem);
    return updatedItem;
  }

  // Xóa item
  async deleteItem(id: string): Promise<void> {
    await inventoryDB.deleteItem(id);
  }

  // Lấy item theo ID
  async getItem(id: string): Promise<InventoryItem | undefined> {
    return await inventoryDB.getItem(id);
  }

  // Lấy tất cả items
  async getAllItems(): Promise<InventoryItem[]> {
    return await inventoryDB.getAllItems();
  }

  // Lọc items
  async filterItems(filter: InventoryFilter): Promise<InventoryItem[]> {
    let items = await this.getAllItems();

    // Lọc theo type
    if (filter.type) {
      items = items.filter(item => item.type === filter.type);
    }

    // Lọc theo source
    if (filter.source) {
      items = items.filter(item => item.source === filter.source);
    }

    // Lọc theo tags
    if (filter.tags && filter.tags.length > 0) {
      items = items.filter(item => 
        filter.tags!.some(tag => item.tags.includes(tag))
      );
    }

    // Lọc theo favorite
    if (filter.isFavorite !== undefined) {
      items = items.filter(item => item.isFavorite === filter.isFavorite);
    }

    // Tìm kiếm theo query
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      items = items.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query)) ||
        (item.source && item.source.toLowerCase().includes(query))
      );
    }

    return items;
  }

  // Tính thống kê
  async getStats(): Promise<InventoryStats> {
    const items = await this.getAllItems();
    
    const stats: InventoryStats = {
      totalItems: items.length,
      totalSize: items.reduce((sum, item) => sum + item.size, 0),
      itemsByType: {
        text: 0,
        json: 0,
        markdown: 0,
        html: 0,
        code: 0,
        other: 0
      },
      itemsBySource: {}
    };

    items.forEach(item => {
      // Đếm theo type
      stats.itemsByType[item.type]++;
      
      // Đếm theo source
      if (item.source) {
        stats.itemsBySource[item.source] = (stats.itemsBySource[item.source] || 0) + 1;
      }
    });

    return stats;
  }

  // Toggle favorite
  async toggleFavorite(id: string): Promise<InventoryItem> {
    const item = await this.getItem(id);
    if (!item) {
      throw new Error('Item not found');
    }

    return await this.updateItem(id, { isFavorite: !item.isFavorite });
  }

  // Xóa tất cả
  async clearAll(): Promise<void> {
    await inventoryDB.clearAll();
  }

  // Export items
  async exportItems(): Promise<Blob> {
    const items = await this.getAllItems();
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      items
    };
    
    return new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    });
  }

  // Import items
  async importItems(file: File): Promise<number> {
    const text = await file.text();
    const data = JSON.parse(text);
    
    if (!data.items || !Array.isArray(data.items)) {
      throw new Error('Invalid import file format');
    }

    let importedCount = 0;
    
    for (const itemData of data.items) {
      try {
        // Tạo ID mới để tránh conflict
        await this.addItem({
          title: itemData.title,
          content: itemData.content,
          type: itemData.type,
          source: itemData.source,
          tags: itemData.tags || []
        });
        importedCount++;
      } catch (error) {
        console.warn('Failed to import item:', itemData, error);
      }
    }

    return importedCount;
  }

  // Đọc clipboard và thêm vào inventory
  async throwClipboard(source?: string): Promise<InventoryItem | null> {
    if (!navigator.clipboard) {
      throw new Error('Clipboard API not supported');
    }

    try {
      const text = await navigator.clipboard.readText();
      
      if (!text || text.trim() === '') {
        throw new Error('Clipboard is empty');
      }

      return await this.addItem({
        content: text,
        source: source || 'clipboard',
        tags: ['clipboard']
      });
    } catch (error) {
      console.error('Failed to read clipboard:', error);
      throw error;
    }
  }

  // Lấy các tags phổ biến
  async getPopularTags(limit: number = 10): Promise<string[]> {
    const items = await this.getAllItems();
    const tagCounts: Record<string, number> = {};

    items.forEach(item => {
      item.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([tag]) => tag);
  }

  // Lấy các sources phổ biến
  async getPopularSources(): Promise<string[]> {
    const items = await this.getAllItems();
    const sources = new Set<string>();

    items.forEach(item => {
      if (item.source) {
        sources.add(item.source);
      }
    });

    return Array.from(sources).sort();
  }
}

// Singleton instance
export const inventoryService = new InventoryService();