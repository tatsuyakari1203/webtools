export interface InventoryItem {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'json' | 'markdown' | 'html' | 'code' | 'other';
  source?: string; // Tool nào tạo ra item này
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  size: number; // Kích thước content (bytes)
  isFavorite: boolean;
}

export interface InventoryFilter {
  type?: InventoryItem['type'];
  source?: string;
  tags?: string[];
  searchQuery?: string;
  isFavorite?: boolean;
}

export interface InventoryStats {
  totalItems: number;
  totalSize: number;
  itemsByType: Record<InventoryItem['type'], number>;
  itemsBySource: Record<string, number>;
}

export interface InventoryContextType {
  items: InventoryItem[];
  stats: InventoryStats;
  isLoading: boolean;
  error: string | null;
  
  // CRUD operations
  addItem: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  getItem: (id: string) => InventoryItem | undefined;
  
  // Utility operations
  clearAll: () => Promise<void>;
  exportItems: () => Promise<Blob>;
  importItems: (file: File) => Promise<void>;
  
  // Filter and search
  filteredItems: InventoryItem[];
  setFilter: (filter: InventoryFilter) => void;
  currentFilter: InventoryFilter;
  
  // Quick actions
  throwClipboard: (source?: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
}

export interface InventoryDBSchema {
  items: {
    key: string;
    value: InventoryItem;
    indexes: {
      'by-type': InventoryItem['type'];
      'by-source': string;
      'by-created': Date;
      'by-favorite': boolean;
    };
  };
}

export type ContentType = InventoryItem['type'];

export interface ClipboardData {
  text?: string;
  html?: string;
  files?: File[];
}