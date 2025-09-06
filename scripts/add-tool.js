#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg) => console.log(`${colors.bright}${colors.cyan}${msg}${colors.reset}`)
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  
  // First non-option argument is the tool name
  let positionalIndex = 0;
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const [key, value] = arg.split('=');
      const optionName = key.replace('--', '');
      options[optionName] = value || true;
    } else {
      // Handle positional arguments
      if (positionalIndex === 0) {
        options.name = arg;
      } else if (positionalIndex === 1) {
        options.description = arg;
      }
      positionalIndex++;
    }
  }
  
  return options;
}

// Validate required options
function validateOptions(options) {
  const required = ['name'];
  const missing = required.filter(key => !options[key]);
  
  if (missing.length > 0) {
    log.error(`Missing required options: ${missing.join(', ')}`);
    showUsage();
    process.exit(1);
  }
  
  // Validate tool name format
  if (!/^[a-z0-9-]+$/.test(options.name)) {
    log.error('Tool name must contain only lowercase letters, numbers, and hyphens');
    process.exit(1);
  }
  
  return true;
}

// Show usage information
function showUsage() {
  log.title('\n🛠️  WebTools CLI - Add New Tool\n');
  console.log('Usage: bun run tool:create --name=<tool-name> [options]\n');
  console.log('Required:');
  console.log('  --name=<string>        Tool ID (lowercase, hyphens allowed)');
  console.log('\nOptional:');
  console.log('  --display-name=<string> Display name (default: auto-generated)');
  console.log('  --description=<string>  Tool description');
  console.log('  --category=<string>     Tool category (default: "Utility")');
  console.log('  --icon=<string>         Lucide icon name (default: "Settings")');
  console.log('  --featured=<boolean>    Mark as featured (default: false)');
  console.log('\nExamples:');
  console.log('  bun run tool:create --name=my-awesome-tool');
  console.log('  bun run tool:create --name=json-formatter --category=Developer --icon=Code');
  console.log('  bun run tool:create --name=password-gen --description="Generate secure passwords" --featured=true\n');
}

// Main function
async function main() {
  const options = parseArgs();
  
  // Show help if no arguments or help flag
  if (Object.keys(options).length === 0 || options.help || options.h) {
    showUsage();
    return;
  }
  
  validateOptions(options);
  
  log.title('🛠️  Creating new WebTool...');
  log.info(`Tool name: ${options.name}`);
  
  try {
    // Set default values
    const toolConfig = {
      id: options.name,
      name: options['display-name'] || generateDisplayName(options.name),
      description: options.description || `A useful ${options.name.replace(/-/g, ' ')} tool`,
      category: options.category || 'Utility',
      icon: options.icon || 'Settings',
      featured: options.featured === 'true' || options.featured === true,
      path: `/tools/${options.name}`,
      componentPath: `@/tools/${options.name}/${generateComponentName(options.name)}`
    };
    
    // Validate inputs
    validateIcon(toolConfig.icon);
    validateCategory(toolConfig.category);
    
    log.info('Configuration:');
    console.log(JSON.stringify(toolConfig, null, 2));
    
    // Check if tool already exists
    await checkToolExists(toolConfig.id);
    
    // Create component files
    await createComponentFiles(toolConfig);
    
    // Update tools registry
    await updateToolsRegistry(toolConfig);
    
    // Update dynamic component loader
    await updateDynamicLoader(toolConfig);
    
    // Run type checking
    await runTypeCheck();
    
    log.success(`\n🎉 Tool '${toolConfig.name}' created successfully!`);
    log.info(`\n📁 Files created:`);
    log.info(`   src/tools/${toolConfig.id}/`);
    log.info(`   ├── ${generateComponentName(toolConfig.id)}.tsx`);
    log.info(`   ├── index.tsx`);
    log.info(`   └── types.ts`);
    log.info(`\n📝 Files updated:`);
    log.info(`   src/lib/tools-registry.ts`);
    log.info(`   src/lib/dynamic-component-loader.ts`);
    log.info(`\n🚀 Next steps:`);
    log.info(`   1. Implement your tool logic in src/tools/${toolConfig.id}/${generateComponentName(toolConfig.id)}.tsx`);
    log.info(`   2. Run 'bun run dev' to test your tool`);
    log.info(`   3. Visit http://localhost:3000/tools/${toolConfig.id}`);
    
  } catch (error) {
    log.error(`Failed to create tool: ${error.message}`);
    process.exit(1);
  }
}

// Helper functions
function generateDisplayName(toolId) {
  return toolId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function generateComponentName(toolId) {
  return toolId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

// Check if tool already exists
async function checkToolExists(toolId) {
  const registryPath = path.join(__dirname, '../src/lib/tools-registry.ts');
  
  if (!fs.existsSync(registryPath)) {
    throw new Error('tools-registry.ts not found');
  }
  
  const registryContent = fs.readFileSync(registryPath, 'utf8');
  
  // Check if tool ID already exists
  const idPattern = new RegExp(`id:\s*["']${toolId}["']`, 'g');
  if (idPattern.test(registryContent)) {
    throw new Error(`Tool with ID '${toolId}' already exists`);
  }
  
  // Check if component path already exists
  const componentDir = path.join(__dirname, `../src/tools/${toolId}`);
  if (fs.existsSync(componentDir)) {
    throw new Error(`Component directory 'src/tools/${toolId}' already exists`);
  }
  
  log.success('Tool ID is available');
}

// Read and parse tools registry
function readToolsRegistry() {
  const registryPath = path.join(__dirname, '../src/lib/tools-registry.ts');
  
  if (!fs.existsSync(registryPath)) {
    throw new Error('tools-registry.ts not found');
  }
  
  return fs.readFileSync(registryPath, 'utf8');
}

// Validate icon name (check if it's a valid Lucide icon)
function validateIcon(iconName) {
  // Common Lucide icons - in a real implementation, you might want to fetch this dynamically
  const commonIcons = [
    'Settings', 'Calculator', 'Type', 'Image', 'ImageIcon', 'FileText', 'ScanText',
    'FileCode', 'Timer', 'Banana', 'Crop', 'Globe', 'Key', 'Code', 'Hash', 'Lock',
    'Zap', 'Palette', 'Download', 'Upload', 'Search', 'Filter', 'Edit', 'Trash',
    'Copy', 'Share', 'Star', 'Heart', 'Bookmark', 'Tag', 'Calendar', 'Clock',
    'User', 'Users', 'Mail', 'Phone', 'MapPin', 'Home', 'Building', 'Car',
    'Plane', 'Ship', 'Train', 'Bike', 'Camera', 'Video', 'Music', 'Headphones'
  ];
  
  if (!commonIcons.includes(iconName)) {
    log.warning(`Icon '${iconName}' might not be available in Lucide React. Common icons: ${commonIcons.slice(0, 10).join(', ')}...`);
  }
  
  return true;
}

// Validate category
function validateCategory(category) {
  const commonCategories = [
    'Math', 'Text', 'Image', 'AI', 'Developer', 'Productivity', 'Network', 'Utilities'
  ];
  
  if (!commonCategories.includes(category)) {
    log.warning(`Category '${category}' is new. Existing categories: ${commonCategories.join(', ')}`);
  }
  
  return true;
}

async function createComponentFiles(toolConfig) {
  const toolDir = path.join(__dirname, `../src/tools/${toolConfig.id}`);
  
  // Create tool directory
  if (!fs.existsSync(toolDir)) {
    fs.mkdirSync(toolDir, { recursive: true });
    log.success(`Created directory: src/tools/${toolConfig.id}/`);
  }
  
  // Generate component files
  const componentName = generateComponentName(toolConfig.id);
  
  // Main component file
  const componentContent = generateComponentTemplate(toolConfig, componentName);
  const componentPath = path.join(toolDir, `${componentName}.tsx`);
  fs.writeFileSync(componentPath, componentContent);
  log.success(`Created: ${componentName}.tsx`);
  
  // Index file
  const indexContent = generateIndexTemplate(componentName);
  const indexPath = path.join(toolDir, 'index.tsx');
  fs.writeFileSync(indexPath, indexContent);
  log.success(`Created: index.tsx`);
  
  // Types file
  const typesContent = generateTypesTemplate(toolConfig);
  const typesPath = path.join(toolDir, 'types.ts');
  fs.writeFileSync(typesPath, typesContent);
  log.success(`Created: types.ts`);
}

// Generate main component template
function generateComponentTemplate(toolConfig, componentName) {
  return `'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ${toolConfig.icon} } from 'lucide-react';
import type { Tool } from '@/lib/tools-registry';
import type { ${componentName}Props, ${componentName}State } from './types';

export default function ${componentName}({ tool }: ${componentName}Props) {
  const [state, setState] = useState<${componentName}State>({
    input: '',
    output: '',
    isProcessing: false,
    error: null
  });

  const handleProcess = async () => {
    if (!state.input.trim()) {
      setState(prev => ({ ...prev, error: 'Please enter some input' }));
      return;
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      // TODO: Implement your tool logic here
      const result = await processInput(state.input);
      setState(prev => ({ 
        ...prev, 
        output: result, 
        isProcessing: false 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'An error occurred',
        isProcessing: false 
      }));
    }
  };

  const handleReset = () => {
    setState({
      input: '',
      output: '',
      isProcessing: false,
      error: null
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <${toolConfig.icon} className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-4xl font-bold">{tool.name}</h1>
          </div>
          <p className="text-xl text-muted-foreground">{tool.description}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Input</CardTitle>
            <CardDescription>
              Enter your input below to process with {tool.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="input">Input</Label>
              <Input
                id="input"
                placeholder="Enter your input here..."
                value={state.input}
                onChange={(e) => setState(prev => ({ ...prev, input: e.target.value }))}
                disabled={state.isProcessing}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleProcess} 
                disabled={state.isProcessing || !state.input.trim()}
                className="flex-1"
              >
                {state.isProcessing ? 'Processing...' : 'Process'}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleReset}
                disabled={state.isProcessing}
              >
                Reset
              </Button>
            </div>

            {state.error && (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {state.output && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Output</CardTitle>
              <CardDescription>
                Processed result from {tool.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-md">
                <pre className="whitespace-pre-wrap text-sm">{state.output}</pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// TODO: Implement your processing logic
async function processInput(input: string): Promise<string> {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Replace this with your actual logic
  return \`Processed: \${input}\`;
}
`;
}

// Generate index template
function generateIndexTemplate(componentName) {
  return `import ${componentName} from './${componentName}';

export default ${componentName};
`;
}

// Generate types template
function generateTypesTemplate(toolConfig) {
  const componentName = generateComponentName(toolConfig.id);
  return `import type { Tool } from '@/lib/tools-registry';

export interface ${componentName}Props {
  tool: unknown;
}

export interface ${componentName}State {
  input: string;
  output: string;
  isProcessing: boolean;
  error: string | null;
}

// Add your custom types here
export interface ProcessingOptions {
  // Define options for your tool
}

export interface ProcessingResult {
  // Define the structure of your processing result
}
`;
}

async function updateToolsRegistry(toolConfig) {
  const registryPath = path.join(__dirname, '../src/lib/tools-registry.ts');
  let registryContent = readToolsRegistry();
  
  // Add icon import if needed
  registryContent = addIconImport(registryContent, toolConfig.icon);
  
  // Generate the new tool entry
  const newToolEntry = generateToolRegistryEntry(toolConfig);
  
  // Find the toolsRegistry array closing bracket
  const arrayPattern = /export const toolsRegistry: Tool\[\] = \[([\s\S]*?)\]/;
  const arrayMatch = registryContent.match(arrayPattern);
  
  if (!arrayMatch) {
    throw new Error('Could not find toolsRegistry array in tools registry');
  }
  
  const arrayStart = arrayMatch.index;
  const arrayEnd = arrayStart + arrayMatch[0].length;
  const arrayContent = arrayMatch[1];
  
  // Check if we need to add a comma before the new entry
  const needsComma = arrayContent.trim().endsWith('}');
  
  // Find the position to insert (before the closing bracket of the array)
  const beforeArray = registryContent.substring(0, arrayEnd - 1);
  const afterArray = registryContent.substring(arrayEnd - 1);
  
  const comma = needsComma ? ',' : '';
  const updatedContent = beforeArray + comma + '\n' + newToolEntry + afterArray;
  
  // Write the updated content back to the file
  fs.writeFileSync(registryPath, updatedContent);
  log.success('Updated tools-registry.ts');
}

// Generate tool registry entry
function generateToolRegistryEntry(toolConfig) {
  const componentName = generateComponentName(toolConfig.id);
  
  return `  {
    id: "${toolConfig.id}",
    name: "${toolConfig.name}",
    description: "${toolConfig.description}",
    category: "${toolConfig.category}",
    icon: ${toolConfig.icon},
    path: "${toolConfig.path}",
    featured: ${toolConfig.featured},
    componentPath: "@/tools/${toolConfig.id}/${componentName}",
  },`;
}

// Add import for the icon if it's not already imported
function addIconImport(registryContent, iconName) {
  // Check if icon is already imported
  const importRegex = /import\s*{([^}]+)}\s*from\s*["']lucide-react["']/;
  const importMatch = registryContent.match(importRegex);
  
  if (!importMatch) {
    throw new Error('Could not find lucide-react import in tools registry');
  }
  
  const currentImports = importMatch[1]
    .split(',')
    .map(imp => imp.trim())
    .filter(imp => imp.length > 0);
  
  // Check if icon is already imported
  if (currentImports.includes(iconName)) {
    return registryContent; // Icon already imported
  }
  
  // Add the new icon to imports
  const newImports = [...currentImports, iconName].sort();
  const newImportLine = `import { ${newImports.join(', ')} } from "lucide-react"`;
  
  // Replace the old import line
  return registryContent.replace(importRegex, newImportLine);
}

async function updateDynamicLoader(toolConfig) {
  const loaderPath = path.join(__dirname, '../src/lib/dynamic-component-loader.ts');
  
  if (!fs.existsSync(loaderPath)) {
    throw new Error('dynamic-component-loader.ts not found');
  }
  
  let loaderContent = fs.readFileSync(loaderPath, 'utf8');
  
  // Generate new case for the switch statement
  const newCase = generateSwitchCase(toolConfig);
  
  // Find the switch statement and add the new case
  const switchPattern = /(case\s+["'][^"']+["']:[\s\S]*?return\s+\(\)\s*=>\s*import\([^)]+\))/g;
  const matches = [...loaderContent.matchAll(switchPattern)];
  
  if (matches.length === 0) {
    throw new Error('Could not find switch cases in dynamic-component-loader.ts');
  }
  
  // Find the last case statement
  const lastMatch = matches[matches.length - 1];
  const lastCaseEnd = lastMatch.index + lastMatch[0].length;
  
  // Insert the new case after the last case
  const beforeNewCase = loaderContent.substring(0, lastCaseEnd);
  const afterNewCase = loaderContent.substring(lastCaseEnd);
  
  const updatedContent = beforeNewCase + '\n' + newCase + afterNewCase;
  
  // Write the updated content back to the file
  fs.writeFileSync(loaderPath, updatedContent);
  log.success('Updated dynamic-component-loader.ts');
}

// Generate switch case for the new tool
function generateSwitchCase(toolConfig) {
  const componentName = generateComponentName(toolConfig.id);
  
  return `    case "@/tools/${toolConfig.id}/${componentName}":
      return () => import("@/tools/${toolConfig.id}/${componentName}")`;
}

async function runTypeCheck() {
  // TODO: Run TypeScript type checking
}

// Run the CLI
if (require.main === module) {
  main().catch(error => {
    log.error(`Unexpected error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  main,
  parseArgs,
  validateOptions,
  generateDisplayName,
  generateComponentName
};