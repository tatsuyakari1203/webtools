'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
// import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useInventory } from '@/components/providers/InventoryProvider';
import { InventoryItem, ContentType } from '@/types/inventory';
import { 
  Package, 
  Search, 
  Download, 
  Upload, 
  Trash2, 
  Star, 
  Copy, 
  Edit, 
  Calendar, 
  FileText, 
  Code, 
  Hash, 
  Globe, 
  BarChart3,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Clock,
  Type
} from 'lucide-react';
import { toast } from 'sonner';
// import { formatDistanceToNow } from 'date-fns';

interface InventoryDialogProps {
  children: React.ReactNode;
}

export function InventoryDialog({ children }: InventoryDialogProps) {
  const {
    items,
    stats,
    isLoading,
    error,
    filteredItems,
    addItem,
    updateItem,
    deleteItem,
    clearAll,
    exportItems,
    importItems,
    toggleFavorite
  } = useInventory();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('items');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ContentType | 'all'>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'updatedAt' | 'createdAt' | 'title' | 'type' | 'size'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [newItemData, setNewItemData] = useState({
    title: '',
    content: '',
    type: 'text' as ContentType,
    tags: '',
    source: ''
  });

  // Apply filters
  const displayItems = useMemo(() => {
    let filtered = filteredItems;

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query)) ||
        (item.source && item.source.toLowerCase().includes(query))
      );
    }

    // Apply type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(item => item.type === selectedType);
    }

    // Apply favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter(item => item.isFavorite);
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      let aValue: string | number, bValue: string | number;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'size':
          aValue = a.size;
          bValue = b.size;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
        default:
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredItems, searchQuery, selectedType, showFavoritesOnly, sortBy, sortOrder]);

  // Handle copy to clipboard
  const copyToClipboard = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Copied to clipboard');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy to clipboard');
    }
  }, []);

  // Handle export
  const handleExport = useCallback(async () => {
    try {
      const blob = await exportItems();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
      // Error already handled in context
    }
  }, [exportItems]);

  // Handle import
  const handleImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await importItems(file);
    } catch (error) {
      console.error('Failed to import data:', error);
      // Error already handled in context
    }

    // Reset input
    event.target.value = '';
  }, [importItems]);

  // Handle edit item
  const handleEditItem = useCallback((item: InventoryItem) => {
    setEditingItem(item);
    setNewItemData({
      title: item.title,
      content: item.content,
      type: item.type,
      tags: item.tags.join(', '),
      source: item.source || ''
    });
    setIsEditDialogOpen(true);
  }, []);

  // Detect content type based on content
  const detectContentType = (content: string): ContentType => {
    const trimmed = content.trim();
    
    // Check for JSON
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
        (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        JSON.parse(trimmed);
        return 'json';
      } catch {
        // Not valid JSON, continue checking
      }
    }
    
    // Check for HTML/XML
    if (/<\/?[a-z][\s\S]*>/i.test(trimmed) || trimmed.includes('<!DOCTYPE')) {
      return 'html';
    }
    
    // Check for Markdown (improved detection)
    if (/^#{1,6}\s/.test(trimmed) || // Headers
        /\*\*.*\*\*/.test(trimmed) || // Bold
        /\*.*\*/.test(trimmed) || // Italic
        /`.*`/.test(trimmed) || // Inline code
        /```[\s\S]*```/.test(trimmed) || // Code blocks
        /\[.*\]\(.*\)/.test(trimmed) || // Links
        /^[-*+]\s/.test(trimmed) || // Lists
        /^\d+\.\s/.test(trimmed) || // Numbered lists
        /^>\s/.test(trimmed)) { // Blockquotes
      return 'markdown';
    }
    
    // Check for code patterns (improved detection)
    const codePatterns = [
      // JavaScript/TypeScript
      /\b(function|const|let|var|import|export|class|interface|type|enum)\b/,
      /=>/,
      /console\.(log|error|warn)/,
      // Python
      /\b(def|class|import|from|print|if __name__)\b/,
      // Java/C#
      /\b(public|private|protected|static|class|interface)\b/,
      // C/C++
      /#include|using namespace|std::/,
      // PHP
      /<\?php|\$\w+/,
      // SQL
      /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i,
      // CSS
      /\{[^}]*:[^}]*\}/,
      // Common programming symbols
      /[{}();].*[{}();]/
    ];
    
    if (codePatterns.some(pattern => pattern.test(trimmed))) {
      return 'code';
    }
    
    return 'text';
  };

  // Handle save item
  const handleSaveItem = useCallback(async () => {
    try {
      const tags = newItemData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
      const detectedType = newItemData.type === 'text' ? detectContentType(newItemData.content) : newItemData.type;
      
      if (editingItem) {
        await updateItem(editingItem.id, {
          title: newItemData.title,
          content: newItemData.content,
          type: detectedType,
          tags,
          source: newItemData.source || undefined
        });
      } else {
        await addItem({
          title: newItemData.title,
          content: newItemData.content,
          type: detectedType,
          tags,
          source: newItemData.source || undefined,
          isFavorite: false,
          size: new Blob([newItemData.content]).size
        });
      }
      
      setIsEditDialogOpen(false);
      setEditingItem(null);
      setNewItemData({ title: '', content: '', type: 'text', tags: '', source: '' });
    } catch (error) {
      console.error('Failed to save item:', error);
      // Error already handled in context
    }
  }, [editingItem, newItemData, updateItem, addItem]);

  // Get content type icon
  const getTypeIcon = (type: ContentType) => {
    switch (type) {
      case 'json': return <Hash className="w-4 h-4" />;
      case 'html': return <Globe className="w-4 h-4" />;
      case 'markdown': return <FileText className="w-4 h-4" />;
      case 'code': return <Code className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="w-[98vw] lg:w-auto lg:min-w-[600px] lg:max-w-[min(1200px,90vw)] h-[95vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Inventory Manager
              <Badge variant="secondary">{stats.totalItems} items</Badge>
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
            <TabsList className="bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 grid w-full grid-cols-3">
              <TabsTrigger value="items">Items</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="items" className="flex-1 overflow-hidden">
              <div className="space-y-4 h-full">
                {/* Search and Filters */}
                <div className="space-y-3">
                  {/* Top row: Search and Add button */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search items..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingItem(null);
                        setNewItemData({ title: '', content: '', type: 'text', tags: '', source: '' });
                        setIsEditDialogOpen(true);
                      }}
                      className="shrink-0"
                    >
                      Add Item
                    </Button>
                  </div>
                  
                  {/* Bottom row: Filters and Sort */}
                  <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                    <div className="flex flex-col sm:flex-row flex-wrap gap-2 flex-1">
                      <Select value={selectedType} onValueChange={(value) => setSelectedType(value as ContentType | 'all')}>
                        <SelectTrigger className="w-full sm:w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="html">HTML</SelectItem>
                          <SelectItem value="markdown">Markdown</SelectItem>
                          <SelectItem value="code">Code</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="favorites-only"
                          checked={showFavoritesOnly}
                          onCheckedChange={setShowFavoritesOnly}
                        />
                        <Label htmlFor="favorites-only" className="text-sm whitespace-nowrap">Favorites</Label>
                      </div>
                    </div>
                    
                    {/* Sort controls */}
                    <div className="flex items-center gap-2">
                      <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'updatedAt' | 'createdAt' | 'title' | 'type' | 'size')}>
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="updatedAt">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              Updated
                            </div>
                          </SelectItem>
                          <SelectItem value="createdAt">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Created
                            </div>
                          </SelectItem>
                          <SelectItem value="title">
                            <div className="flex items-center gap-2">
                              <Type className="w-4 h-4" />
                              Title
                            </div>
                          </SelectItem>
                          <SelectItem value="type">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Type
                            </div>
                          </SelectItem>
                          <SelectItem value="size">
                            <div className="flex items-center gap-2">
                              <BarChart3 className="w-4 h-4" />
                              Size
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="px-2"
                      >
                        {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <ScrollArea className="flex-1 h-[500px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    </div>
                  ) : error ? (
                    <div className="text-center text-red-500 p-4">
                      Error: {error}
                    </div>
                  ) : displayItems.length === 0 ? (
                    <div className="text-center text-muted-foreground p-8">
                      {searchQuery || selectedType !== 'all' || showFavoritesOnly
                        ? 'No items match your filters'
                        : 'No items in inventory'}
                    </div>
                  ) : (
                    <div className="inventory-container grid gap-4 p-2 grid-cols-1 inventory-grid-2 inventory-grid-3">
                      {displayItems.map((item) => (
                        <Card key={item.id} className="group hover:shadow-md transition-all duration-200 border-border/50 hover:border-border overflow-hidden h-fit">
                          <CardContent className="p-4 overflow-hidden">
                            {/* Header với title và action buttons */}
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                                <div className="flex-shrink-0">{getTypeIcon(item.type)}</div>
                                <h3 
                                  className="font-medium text-sm cursor-pointer hover:text-primary transition-colors truncate flex-1 min-w-0 max-w-full overflow-hidden break-all"
                                  onClick={() => {
                                    const newTitle = prompt('Enter new title:', item.title);
                                    if (newTitle && newTitle !== item.title) {
                                      updateItem(item.id, { title: newTitle });
                                    }
                                  }}
                                  title={`${item.title} - Click to edit`}>
                                  {item.title}
                                </h3>
                              </div>
                              
                              {/* Action buttons - luôn hiển thị */}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleFavorite(item.id)}
                                  className="h-8 w-8 p-0 hover:bg-accent"
                                  title={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                >
                                  <Star className={`h-4 w-4 ${item.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(item.content)}
                                  className="h-8 w-8 p-0 hover:bg-accent text-muted-foreground hover:text-foreground"
                                  title="Copy to clipboard"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditItem(item)}
                                  className="h-8 w-8 p-0 hover:bg-accent text-muted-foreground hover:text-foreground"
                                  title="Edit item"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to delete "${item.title}"?`)) {
                                      deleteItem(item.id);
                                    }
                                  }}
                                  className="h-8 w-8 p-0 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                  title="Delete item"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            {/* Type badge */}
                            <div className="mb-3">
                              <Badge variant="secondary" className="text-xs">
                                {item.type}
                              </Badge>
                            </div>
                            
                            {/* Metadata */}
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
                              <span className="flex items-center gap-1 flex-shrink-0">
                                <Calendar className="h-3 w-3" />
                                {new Date(item.updatedAt).toLocaleDateString('vi-VN')}
                              </span>
                              <span className="flex-shrink-0">{formatSize(item.size)}</span>
                              {item.source && (
                                <span className="flex items-center gap-1 min-w-0 overflow-hidden" title={item.source}>
                                  <Globe className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate inventory-source-wide max-w-[80px]">{item.source}</span>
                                </span>
                              )}
                            </div>
                            
                            {/* Tags */}
                            {item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {item.tags.slice(0, 3).map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs h-5">
                                    {tag}
                                  </Badge>
                                ))}
                                {item.tags.length > 3 && (
                                  <Badge variant="outline" className="text-xs h-5">
                                    +{item.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                            
                            {/* Content preview */}
                            <div className="text-sm border-t pt-3">
                              <p className="text-muted-foreground text-xs line-clamp-2 break-words overflow-hidden">
                                {item.content.length > 100 ? `${item.content.substring(0, 100)}...` : item.content}
                              </p>
                              {item.content.length > 100 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setExpandedItems(prev => {
                                    const newSet = new Set(prev);
                                    if (newSet.has(item.id)) {
                                      newSet.delete(item.id);
                                    } else {
                                      newSet.add(item.id);
                                    }
                                    return newSet;
                                  })}
                                  className="text-xs h-6 mt-2 p-0 text-primary hover:text-primary/80"
                                >
                                  {expandedItems.has(item.id) ? 'Thu gọn' : 'Xem thêm'}
                                </Button>
                              )}
                            </div>
                            
                             {/* Expanded content modal */}
                              {expandedItems.has(item.id) && (
                               <div className="mt-3 border-t pt-3 overflow-hidden">
                                 <div className="bg-muted/30 rounded-lg p-3 max-h-60 overflow-y-auto overflow-x-hidden">
                                   {item.type === 'json' ? (
                                     <pre className="text-xs font-mono whitespace-pre-wrap break-all overflow-hidden">
                                       {(() => {
                                         try {
                                           return JSON.stringify(JSON.parse(item.content), null, 2);
                                         } catch {
                                           return item.content;
                                         }
                                       })()}
                                     </pre>
                                   ) : item.type === 'code' ? (
                                     <pre className="text-xs font-mono whitespace-pre-wrap break-all overflow-hidden">
                                       {item.content}
                                     </pre>
                                   ) : item.type === 'markdown' ? (
                                     <div className="text-xs font-mono whitespace-pre-wrap break-all overflow-hidden">
                                       {item.content}
                                     </div>
                                   ) : item.type === 'html' ? (
                                     <div className="text-xs overflow-hidden">
                                       <div className="font-mono text-xs mb-2 text-muted-foreground">HTML Preview:</div>
                                       <div className="mb-2 p-2 bg-background rounded border overflow-auto" dangerouslySetInnerHTML={{ __html: item.content }} />
                                       <Separator className="my-2" />
                                       <div className="font-mono text-xs text-muted-foreground mb-1">Source:</div>
                                       <pre className="text-xs font-mono whitespace-pre-wrap break-all overflow-hidden">{item.content}</pre>
                                     </div>
                                   ) : (
                                     <div className="whitespace-pre-wrap text-xs break-all overflow-hidden">{item.content}</div>
                                   )}
                                 </div>
                                 <Button
                                   variant="ghost"
                                   size="sm"
                                   onClick={() => setExpandedItems(prev => {
                                     const newSet = new Set(prev);
                                     newSet.delete(item.id);
                                     return newSet;
                                   })}
                                   className="text-xs h-6 mt-2 p-0 text-muted-foreground hover:text-foreground"
                                 >
                                   Thu gọn
                                 </Button>
                               </div>
                             )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="stats" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalItems}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Size</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatSize(stats.totalSize)}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Favorites</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {items.filter(item => item.isFavorite).length}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Items by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(stats.itemsByType).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(type as ContentType)}
                          <span className="capitalize">{type}</span>
                        </div>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Data Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button onClick={handleExport} className="flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Export Data
                    </Button>
                    
                    <div className="relative">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Button variant="outline" className="flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Import Data
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <Button 
                      variant="destructive" 
                      className="flex items-center gap-2"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete all inventory items? This action cannot be undone.')) {
                          clearAll();
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear All Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-semibold">
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto">
            <Tabs defaultValue="content" className="h-full flex flex-col">
              <TabsList className="bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="flex-1 flex flex-col mt-0 overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <Label htmlFor="content" className="text-sm font-medium">Content</Label>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{newItemData.content.length} chars</span>
                    <span>•</span>
                    <span>{formatSize(new Blob([newItemData.content]).size)}</span>
                    {newItemData.content && (
                      <>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs">
                          {detectContentType(newItemData.content).toUpperCase()}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
                <Textarea
                  id="content"
                  value={newItemData.content}
                  onChange={(e) => {
                    const content = e.target.value;
                    const detectedType = detectContentType(content);
                    setNewItemData(prev => ({ 
                      ...prev, 
                      content,
                      type: prev.type === 'text' ? detectedType : prev.type
                    }));
                  }}
                  placeholder="Enter your content here..."
                  className="flex-1 min-h-[350px] max-h-[400px] font-mono text-sm resize-none border-2 focus:border-primary overflow-auto"
                />
              </TabsContent>
              
              <TabsContent value="metadata" className="flex-1 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title" className="text-sm font-medium">Title</Label>
                      <Input
                        id="title"
                        value={newItemData.title}
                        onChange={(e) => setNewItemData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter item title"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="type" className="text-sm font-medium">Content Type</Label>
                      <Select value={newItemData.type} onValueChange={(value) => setNewItemData(prev => ({ ...prev, type: value as ContentType }))}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">📄 Text</SelectItem>
                          <SelectItem value="json">🔧 JSON</SelectItem>
                          <SelectItem value="html">🌐 HTML</SelectItem>
                          <SelectItem value="markdown">📝 Markdown</SelectItem>
                          <SelectItem value="code">💻 Code</SelectItem>
                          <SelectItem value="other">📋 Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="tags" className="text-sm font-medium">Tags</Label>
                      <Input
                        id="tags"
                        value={newItemData.tags}
                        onChange={(e) => setNewItemData(prev => ({ ...prev, tags: e.target.value }))}
                        placeholder="tag1, tag2, tag3"
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Separate tags with commas</p>
                    </div>
                    
                    <div>
                      <Label htmlFor="source" className="text-sm font-medium">Source</Label>
                      <Input
                        id="source"
                        value={newItemData.source}
                        onChange={(e) => setNewItemData(prev => ({ ...prev, source: e.target.value }))}
                        placeholder="URL, file path, or description"
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Optional source information</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-xs text-muted-foreground">
              {editingItem ? `Last updated: ${new Date(editingItem.updatedAt).toLocaleString('vi-VN')}` : 'New item'}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveItem} className="min-w-[80px]">
                {editingItem ? 'Update' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}