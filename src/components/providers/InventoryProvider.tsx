'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { InventoryItem, InventoryStats, InventoryFilter, InventoryContextType } from '@/types/inventory';
import { inventoryService } from '@/lib/inventory-service';
import { toast } from 'sonner';

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function useInventory() {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}

interface InventoryProviderProps {
  children: React.ReactNode;
}

export function InventoryProvider({ children }: InventoryProviderProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    totalItems: 0,
    totalSize: 0,
    itemsByType: {
      text: 0,
      json: 0,
      markdown: 0,
      html: 0,
      code: 0,
      other: 0
    },
    itemsBySource: {}
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<InventoryFilter>({});
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);

  // Load initial data
  const loadItems = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [allItems, statsData] = await Promise.all([
        inventoryService.getAllItems(),
        inventoryService.getStats()
      ]);
      
      setItems(allItems);
      setStats(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load inventory';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Apply filter to items
  const applyFilter = useCallback(async () => {
    try {
      const filtered = await inventoryService.filterItems(currentFilter);
      setFilteredItems(filtered);
    } catch (err) {
      console.error('Failed to filter items:', err);
      setFilteredItems(items); // Fallback to all items
    }
  }, [currentFilter, items]);

  // Update stats
  const updateStats = useCallback(async () => {
    try {
      const newStats = await inventoryService.getStats();
      setStats(newStats);
    } catch (err) {
      console.error('Failed to update stats:', err);
    }
  }, []);

  // Add item
  const addItem = useCallback(async (itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null);
      const newItem = await inventoryService.addItem(itemData);
      
      setItems(prev => [newItem, ...prev]);
      await updateStats();
      
      toast.success('Item added to inventory');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add item';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, [updateStats]);

  // Update item
  const updateItem = useCallback(async (id: string, updates: Partial<InventoryItem>) => {
    try {
      setError(null);
      const updatedItem = await inventoryService.updateItem(id, updates);
      
      setItems(prev => prev.map(item => item.id === id ? updatedItem : item));
      await updateStats();
      
      toast.success('Item updated');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update item';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, [updateStats]);

  // Delete item
  const deleteItem = useCallback(async (id: string) => {
    try {
      setError(null);
      await inventoryService.deleteItem(id);
      
      setItems(prev => prev.filter(item => item.id !== id));
      await updateStats();
      
      toast.success('Item deleted');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete item';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, [updateStats]);

  // Get item
  const getItem = useCallback((id: string): InventoryItem | undefined => {
    return items.find(item => item.id === id);
  }, [items]);

  // Clear all
  const clearAll = useCallback(async () => {
    try {
      setError(null);
      await inventoryService.clearAll();
      
      setItems([]);
      await updateStats();
      
      toast.success('All items cleared');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear items';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, [updateStats]);

  // Export items
  const exportItems = useCallback(async (): Promise<Blob> => {
    try {
      setError(null);
      return await inventoryService.exportItems();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export items';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  // Import items
  const importItems = useCallback(async (file: File) => {
    try {
      setError(null);
      const importedCount = await inventoryService.importItems(file);
      
      await loadItems(); // Reload all data
      
      toast.success(`Imported ${importedCount} items`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import items';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, [loadItems]);

  // Set filter
  const setFilter = useCallback((filter: InventoryFilter) => {
    setCurrentFilter(filter);
  }, []);

  // Throw clipboard
  const throwClipboard = useCallback(async (source?: string) => {
    try {
      setError(null);
      const newItem = await inventoryService.throwClipboard(source);
      
      if (newItem) {
        setItems(prev => [newItem, ...prev]);
        await updateStats();
        
        toast.success('Clipboard content added to inventory');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add clipboard content';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, [updateStats]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (id: string) => {
    try {
      setError(null);
      const updatedItem = await inventoryService.toggleFavorite(id);
      
      setItems(prev => prev.map(item => item.id === id ? updatedItem : item));
      
      toast.success(updatedItem.isFavorite ? 'Added to favorites' : 'Removed from favorites');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle favorite';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Apply filter when items or filter changes
  useEffect(() => {
    applyFilter();
  }, [applyFilter]);

  const contextValue: InventoryContextType = {
    items,
    stats,
    isLoading,
    error,
    filteredItems,
    currentFilter,
    
    // CRUD operations
    addItem,
    updateItem,
    deleteItem,
    getItem,
    
    // Utility operations
    clearAll,
    exportItems,
    importItems,
    
    // Filter and search
    setFilter,
    
    // Quick actions
    throwClipboard,
    toggleFavorite
  };

  return (
    <InventoryContext.Provider value={contextValue}>
      {children}
    </InventoryContext.Provider>
  );
}