import { InventoryItem } from '@/types/inventory';

const DB_NAME = 'WebToolsInventory';
const DB_VERSION = 1;
const STORE_NAME = 'items';

class InventoryDB {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;

  private async openDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Xóa store cũ nếu tồn tại
        if (db.objectStoreNames.contains(STORE_NAME)) {
          db.deleteObjectStore(STORE_NAME);
        }

        // Tạo object store mới
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        
        // Tạo indexes
        store.createIndex('by-type', 'type', { unique: false });
        store.createIndex('by-source', 'source', { unique: false });
        store.createIndex('by-created', 'createdAt', { unique: false });
        store.createIndex('by-favorite', 'isFavorite', { unique: false });
        store.createIndex('by-tags', 'tags', { unique: false, multiEntry: true });
      };
    });

    return this.dbPromise;
  }

  async addItem(item: InventoryItem): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.add(item);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to add item'));
    });
  }

  async updateItem(item: InventoryItem): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.put(item);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to update item'));
    });
  }

  async deleteItem(id: string): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete item'));
    });
  }

  async getItem(id: string): Promise<InventoryItem | undefined> {
    const db = await this.openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to get item'));
    });
  }

  async getAllItems(): Promise<InventoryItem[]> {
    const db = await this.openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => {
        // Sắp xếp theo thời gian tạo (mới nhất trước)
        const items = request.result.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        resolve(items);
      };
      request.onerror = () => reject(new Error('Failed to get all items'));
    });
  }

  async getItemsByType(type: InventoryItem['type']): Promise<InventoryItem[]> {
    const db = await this.openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('by-type');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(type);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to get items by type'));
    });
  }

  async getItemsBySource(source: string): Promise<InventoryItem[]> {
    const db = await this.openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('by-source');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(source);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to get items by source'));
    });
  }

  async getFavoriteItems(): Promise<InventoryItem[]> {
    const db = await this.openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('by-favorite');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(IDBKeyRange.only(true));
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to get favorite items'));
    });
  }

  async clearAll(): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to clear all items'));
    });
  }

  async getCount(): Promise<number> {
    const db = await this.openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.count();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to get count'));
    });
  }

  async searchItems(query: string): Promise<InventoryItem[]> {
    const allItems = await this.getAllItems();
    const lowerQuery = query.toLowerCase();
    
    return allItems.filter(item => 
      item.title.toLowerCase().includes(lowerQuery) ||
      item.content.toLowerCase().includes(lowerQuery) ||
      item.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      (item.source && item.source.toLowerCase().includes(lowerQuery))
    );
  }

  // Cleanup và đóng database
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.dbPromise = null;
    }
  }
}

// Singleton instance
export const inventoryDB = new InventoryDB();

// Cleanup khi trang đóng
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    inventoryDB.close();
  });
}