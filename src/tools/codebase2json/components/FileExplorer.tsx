"use client";

import React, { useState, useMemo } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  File, 
  Folder, 
  FolderOpen,
  Search,
  Filter,
  Eye,
  Expand,
  Minimize,
  FileText,
  Code,
  Image,
  Settings,
  Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface FileNode {
  path: string;
  name: string;
  type: 'file' | 'directory';
  extension?: string;
  size?: number;
  lines?: number;
  children?: FileNode[];
  content?: string;
}

interface FileExplorerProps {
  files: Array<{
    path: string;
    name: string;
    extension: string;
    content: string;
    size: number;
    lines: number;
    language: string;
    lastModified?: number;
    relativePath: string;
    directory: string;
    sizeFormatted: string;
    linesPercentage: number;
  }>;
  onFileSelect: (file: {
    path: string;
    name: string;
    extension: string;
    content: string;
    size: number;
    lines: number;
    language: string;
    lastModified?: number;
    relativePath: string;
    directory: string;
    sizeFormatted: string;
    linesPercentage: number;
  }) => void;
  selectedFile: string | null;
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  onFileSelect,
  selectedFile
}) => {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['/']));
  const [searchTerm, setSearchTerm] = useState('');
  const [filterExtension, setFilterExtension] = useState('');
  const [showHiddenFiles, setShowHiddenFiles] = useState(false);
  const [groupByType, setGroupByType] = useState(false);

  // Build file tree structure
  const fileTree = useMemo(() => {
    const root: FileNode = {
      path: '/',
      name: 'root',
      type: 'directory',
      children: []
    };

    const pathMap = new Map<string, FileNode>();
    pathMap.set('/', root);

    // Sort files by path for consistent ordering
    const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));

    sortedFiles.forEach(file => {
      const pathParts = file.path.split('/').filter(Boolean);
      let currentPath = '';
      let currentNode = root;

      // Create directory structure
      for (let i = 0; i < pathParts.length - 1; i++) {
        currentPath += '/' + pathParts[i];
        
        if (!pathMap.has(currentPath)) {
          const dirNode: FileNode = {
            path: currentPath,
            name: pathParts[i],
            type: 'directory',
            children: []
          };
          
          pathMap.set(currentPath, dirNode);
          currentNode.children!.push(dirNode);
          currentNode = dirNode;
        } else {
          currentNode = pathMap.get(currentPath)!;
        }
      }

      // Add file node
      const fileNode: FileNode = {
        path: file.path,
        name: file.name,
        type: 'file',
        extension: file.extension,
        size: file.size,
        lines: file.lines,
        content: file.content
      };

      currentNode.children!.push(fileNode);
    });

    // Sort children (directories first, then files)
    const sortChildren = (node: FileNode) => {
      if (node.children) {
        node.children.sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === 'directory' ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });
        node.children.forEach(sortChildren);
      }
    };

    sortChildren(root);
    return root;
  }, [files]);

  // Check if file is hidden (starts with .)
  const isHiddenFile = (name: string) => {
    return name.startsWith('.');
  };

  // Get unique file extensions for filtering
  const extensions = useMemo(() => {
    const exts = new Set(files.map(f => f.extension).filter(Boolean));
    return Array.from(exts).sort();
  }, [files]);

  // Filter files based on search, extension, and hidden files
  const filteredFiles = useMemo(() => {
    return files.filter(file => {
      const matchesSearch = !searchTerm || 
        file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.path.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesExtension = !filterExtension || file.extension === filterExtension;
      
      const matchesHidden = showHiddenFiles || !isHiddenFile(file.name);
      
      return matchesSearch && matchesExtension && matchesHidden;
    });
  }, [files, searchTerm, filterExtension, showHiddenFiles]);

  // Group files by type for better organization
  const groupedFiles = useMemo(() => {
    if (!groupByType) return { ungrouped: filteredFiles };
    
    const groups: Record<string, typeof filteredFiles> = {
      'Source Code': [],
      'Configuration': [],
      'Documentation': [],
      'Assets': [],
      'Other': []
    };
    
    filteredFiles.forEach(file => {
      const ext = file.extension.toLowerCase();
      if (['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.go', '.rs', '.php'].includes(ext)) {
        groups['Source Code'].push(file);
      } else if (['.json', '.yml', '.yaml', '.xml', '.toml', '.ini', '.env'].includes(ext)) {
        groups['Configuration'].push(file);
      } else if (['.md', '.txt', '.rst', '.adoc'].includes(ext)) {
        groups['Documentation'].push(file);
      } else if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.css', '.scss', '.less'].includes(ext)) {
        groups['Assets'].push(file);
      } else {
        groups['Other'].push(file);
      }
    });
    
    // Remove empty groups
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });
    
    return groups;
  }, [filteredFiles, groupByType]);

  // Toggle directory expansion
  const toggleDirectory = (path: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedDirs(newExpanded);
  };

  // Get file icon based on extension
  const getFileIcon = (extension: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      '.js': <Code className="h-4 w-4 text-yellow-500" />,
      '.jsx': <Code className="h-4 w-4 text-blue-500" />,
      '.ts': <Code className="h-4 w-4 text-blue-600" />,
      '.tsx': <Code className="h-4 w-4 text-blue-600" />,
      '.py': <Code className="h-4 w-4 text-green-500" />,
      '.java': <Code className="h-4 w-4 text-orange-500" />,
      '.cpp': <Code className="h-4 w-4 text-blue-700" />,
      '.c': <Code className="h-4 w-4 text-blue-700" />,
      '.html': <FileText className="h-4 w-4 text-orange-600" />,
      '.css': <FileText className="h-4 w-4 text-blue-500" />,
      '.json': <Database className="h-4 w-4 text-yellow-600" />,
      '.md': <FileText className="h-4 w-4 text-gray-600" />,
      '.xml': <FileText className="h-4 w-4 text-green-600" />,
      '.sql': <Database className="h-4 w-4 text-blue-600" />,
      '.sh': <Settings className="h-4 w-4 text-green-700" />,
      '.yml': <Settings className="h-4 w-4 text-red-500" />,
      '.yaml': <Settings className="h-4 w-4 text-red-500" />,
      // eslint-disable-next-line jsx-a11y/alt-text
      '.png': <Image className="h-4 w-4 text-purple-500" />,
      // eslint-disable-next-line jsx-a11y/alt-text
      '.jpg': <Image className="h-4 w-4 text-purple-500" />,
      // eslint-disable-next-line jsx-a11y/alt-text
      '.jpeg': <Image className="h-4 w-4 text-purple-500" />,
      // eslint-disable-next-line jsx-a11y/alt-text
      '.gif': <Image className="h-4 w-4 text-purple-500" />,
      // eslint-disable-next-line jsx-a11y/alt-text
      '.svg': <Image className="h-4 w-4 text-purple-600" />
    };
    return iconMap[extension] || <File className="h-4 w-4 text-gray-500" />;
  };

  // Expand all directories
  const expandAll = () => {
    const allDirs = new Set<string>();
    const collectDirs = (node: FileNode) => {
      if (node.type === 'directory') {
        allDirs.add(node.path);
        node.children?.forEach(collectDirs);
      }
    };
    fileTree.children?.forEach(collectDirs);
    setExpandedDirs(allDirs);
  };

  // Collapse all directories except root
  const collapseAll = () => {
    setExpandedDirs(new Set(['/']));
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Render file tree node
  const renderTreeNode = (node: FileNode, depth: number = 0): React.ReactNode => {
    if (node.type === 'directory') {
      const isExpanded = expandedDirs.has(node.path);
      const hasVisibleChildren = node.children?.some(child => 
        child.type === 'directory' || 
        filteredFiles.some(f => f.path === child.path)
      );

      if (!hasVisibleChildren && node.path !== '/') {
        return null;
      }

      return (
        <div key={node.path}>
          <Collapsible open={isExpanded} onOpenChange={() => toggleDirectory(node.path)}>
            <CollapsibleTrigger asChild>
              <div 
                className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer hover:bg-muted/50 ${
                  depth === 0 ? '' : 'ml-' + (depth * 4)
                }`}
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                {isExpanded ? (
                  <FolderOpen className="h-4 w-4 text-blue-500" />
                ) : (
                  <Folder className="h-4 w-4 text-blue-500" />
                )}
                <span className="text-sm font-medium">
                  {node.name === 'root' ? 'Project Root' : node.name}
                </span>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {node.children?.map(child => renderTreeNode(child, depth + 1))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      );
    } else {
      // File node
      const file = files.find(f => f.path === node.path);
      if (!file || !filteredFiles.includes(file)) {
        return null;
      }

      const isSelected = selectedFile === node.path;

      return (
        <div
          key={node.path}
          className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer hover:bg-muted/50 ${
            isSelected ? 'bg-primary/10 border-l-2 border-primary' : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 24}px` }}
          onClick={() => onFileSelect(file)}
        >
          {getFileIcon(file.extension)}
          <span className="text-sm flex-1">{file.name}</span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{file.lines} lines</span>
            <span>{formatFileSize(file.size)}</span>
          </div>
        </div>
      );
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Folder className="h-5 w-5" />
          File Explorer
          <Badge variant="secondary" className="ml-auto">
            {filteredFiles.length} files
          </Badge>
        </CardTitle>
        
        {/* Search and Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Extension Filter */}
          {extensions.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={filterExtension}
                onChange={(e) => setFilterExtension(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">All extensions</option>
                {extensions.map(ext => (
                  <option key={ext} value={ext}>{ext}</option>
                ))}
              </select>
            </div>
          )}
          
          {/* Control Buttons */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={expandAll}
                className="h-8 px-2"
              >
                <Expand className="h-3 w-3 mr-1" />
                Expand
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={collapseAll}
                className="h-8 px-2"
              >
                <Minimize className="h-3 w-3 mr-1" />
                Collapse
              </Button>
            </div>
          </div>
          
          {/* Toggle Options */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showHiddenFiles}
                onChange={(e) => setShowHiddenFiles(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Eye className="h-4 w-4" />
              Show hidden files
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={groupByType}
                onChange={(e) => setGroupByType(e.target.checked)}
                className="rounded border-gray-300"
              />
              Group by type
            </label>
          </div>
        </div>
      </CardHeader>
      
      <Separator />
      
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          <div className="p-4">
            {groupByType ? (
              // Grouped view
              <div className="space-y-4">
                {Object.entries(groupedFiles).map(([groupName, groupFiles]) => (
                  <div key={groupName} className="space-y-2">
                    <div className="flex items-center gap-2 py-2 px-3 bg-muted/30 rounded-md">
                      <Folder className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">{groupName}</span>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {groupFiles.length}
                      </Badge>
                    </div>
                    <div className="ml-4 space-y-1">
                      {groupFiles.map(file => {
                        const isSelected = selectedFile === file.path;
                        return (
                          <div
                            key={file.path}
                            className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer hover:bg-muted/50 ${
                              isSelected ? 'bg-primary/10 border-l-2 border-primary' : ''
                            }`}
                            onClick={() => onFileSelect(file)}
                          >
                            {getFileIcon(file.extension)}
                            <span className="text-sm flex-1">{file.name}</span>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{file.lines} lines</span>
                              <span>{formatFileSize(file.size)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Tree view
              fileTree.children?.map(child => renderTreeNode(child, 0))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default FileExplorer;