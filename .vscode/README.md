# VS Code Configuration for WebTools

This directory contains VS Code workspace settings to properly support Tailwind CSS v4 and modern web development.

## Files Overview

### `settings.json`
- Disables CSS validation to prevent false warnings for Tailwind CSS v4 directives
- Configures custom CSS data for Tailwind CSS v4 at-rules
- Enables Tailwind CSS IntelliSense for TypeScript files
- Adds support for `cva`, `cx`, and `cn` utility functions

### `tailwind-css-data.json`
- Custom CSS data definitions for Tailwind CSS v4 at-rules:
  - `@custom-variant` - Define custom variants
  - `@theme` - Inline theme configuration
  - `@apply` - Apply utility classes in CSS
  - `@layer` - Organize CSS into layers
  - `@container` - CSS Container Queries

### `extensions.json`
- Recommended VS Code extensions for optimal development experience:
  - Tailwind CSS IntelliSense
  - TypeScript support
  - Prettier code formatter
  - ESLint

## Tailwind CSS v4 Support

This configuration resolves the "Unknown at rule" warnings for:
- `@custom-variant`
- `@theme`
- `@apply`
- `@layer`
- `@container`

These are valid Tailwind CSS v4 directives and should not trigger warnings with this configuration.