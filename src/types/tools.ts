export interface ToolConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  path: string;
  component: React.ComponentType;
}

export interface ToolCategory {
  id: string;
  name: string;
  description: string;
  tools: ToolConfig[];
}