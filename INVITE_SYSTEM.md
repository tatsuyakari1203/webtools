# Invite System Documentation

## Overview

The WebTools Invite System provides secure access control for premium or restricted tools using invite keys. This system includes authentication, logging, and user management capabilities.

## Features

- 🔐 **Secure Authentication**: Environment-based invite keys with session management
- 📊 **Access Logging**: Comprehensive logging with IP tracking and location data
- 🎨 **Beautiful UI**: Modern invite forms with excellent UX
- 🛡️ **Middleware Protection**: Automatic protection for designated tools
- ⚙️ **Flexible Configuration**: Easy setup via environment variables
- 📈 **Analytics**: Access statistics and user activity tracking

## Quick Start

### 1. Environment Setup

Copy `.env.example` to `.env.local` and configure your invite keys:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your invite keys:

```env
# Invite system configuration
INVITE_KEYS=key1,key2,key3
JWT_SECRET=your-jwt-secret-here
```

### 2. Protect a Tool (Simplified Process)

**That's it!** Just update the tool configuration in `src/lib/tools-registry.ts`:

```typescript
{
  id: "your-tool-id",
  name: "Your Tool Name",
  description: "Tool description",
  category: "category",
  icon: YourIcon,
  path: "/tools/your-tool",
  componentPath: "@/tools/your-tool/YourTool",
  requiresInvite: true, // Enable invite protection
  inviteDescription: "This tool requires special access", // Optional
  allowedUsers: ["user1", "user2"] // Optional: restrict to specific users
}
```

**No additional configuration needed!** The system automatically:
- Applies invite protection to your tool component
- Handles authentication and access control
- Shows the invite form when needed
- Manages user sessions

### 3. Create Your Tool Component (No Wrapping Required)

Simply create your tool component as usual:

```tsx
export default function YourTool() {
  return (
    <div>
      {/* Your tool content - no wrapping needed! */}
      <h1>Your Protected Tool</h1>
      <p>This content is automatically protected by the invite system.</p>
    </div>
  )
}
```

**The system automatically handles protection!** No need to:
- Import ToolWrapper or HOCs
- Manually wrap your components
- Configure middleware separately
- Manage authentication state

Everything is handled automatically based on your `tools-registry.ts` configuration.

## API Endpoints

### POST /api/auth/verify-invite

Verify an invite key and create a session.

**Request:**
```json
{
  "key": "user-invite-key",
  "toolId": "tool-id"
}
```

**Response:**
```json
{
  "success": true,
  "name": "username",
  "token": "session-token"
}
```

### GET /api/auth/verify-invite

Check current session status.

**Response:**
```json
{
  "authenticated": true,
  "name": "username",
  "toolId": "tool-id"
}
```

## Components

### InviteForm

A beautiful form component for invite key entry:

```tsx
import { InviteForm } from '@/components/invite-form';

<InviteForm
  toolId="your-tool-id"
  toolName="Your Tool Name"
  onSuccess={(userData) => {
    console.log('User authenticated:', userData);
  }}
/>
```

### ToolWrapper

Automatic protection wrapper for tools:

```tsx
import { ToolWrapper } from '@/components/tool-wrapper';

<ToolWrapper toolId="your-tool-id">
  <YourProtectedContent />
</ToolWrapper>
```

### useInviteAuth Hook

Manage authentication state in your components:

```tsx
import { useInviteAuth } from '@/components/invite-form';

function YourComponent() {
  const { isAuthenticated, userName, isLoading } = useInviteAuth('tool-id');
  
  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please authenticate</div>;
  
  return <div>Welcome, {userName}!</div>;
}
```

## Logging System

The system automatically logs all access attempts with detailed information:

### Log Structure

```typescript
interface AccessLog {
  id: string;
  timestamp: string;
  userName: string;
  toolId: string;
  action: 'access' | 'denied' | 'expired' | 'invalid_key';
  ip: string;
  userAgent: string;
  location?: {
    country: string;
    city: string;
    region: string;
  };
}
```

### Reading Logs

```typescript
import { readLogs, generateLogStats } from '@/lib/access-logger';

// Get recent logs
const logs = await readLogs();

// Get statistics
const stats = await generateLogStats(7); // Last 7 days
```

### Log Files

Logs are stored in the configured directory (default: `./logs/`):
- `access-YYYY-MM-DD.json` - Daily log files
- Automatic rotation when files exceed size limit
- Automatic cleanup of old files based on retention policy

## Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `INVITE_LOG_ENABLED` | `false` | Enable/disable logging |
| `INVITE_CONSOLE_LOG` | `false` | Log to console |
| `INVITE_FILE_LOG` | `true` | Log to files |
| `INVITE_STRICT_MODE` | `false` | Require tool-specific sessions |
| `INVITE_LOG_DIR` | `./logs` | Log directory path |
| `INVITE_LOG_MAX_SIZE` | `10485760` | Max log file size (bytes) |
| `INVITE_LOG_RETENTION_DAYS` | `30` | Days to keep log files |
| `INVITE_KEYS` | `{}` | JSON object of username:key pairs |

### Tool Configuration

```typescript
interface Tool {
  // ... existing properties
  requiresInvite?: boolean;        // Require invite key
  allowedUsers?: string[];         // Restrict to specific users
  inviteDescription?: string;      // Description shown to users
}
```

## Security Considerations

1. **Environment Variables**: Store invite keys securely in environment variables
2. **HTTPS**: Always use HTTPS in production
3. **Session Management**: Sessions expire after 24 hours
4. **IP Logging**: All access attempts are logged with IP addresses
5. **Key Rotation**: Regularly rotate invite keys
6. **Access Control**: Use `allowedUsers` for fine-grained access control

## Usage Examples

### Basic Protection

```typescript
// In tools-registry.ts
{
  id: "premium-calculator",
  name: "Premium Calculator",
  requiresInvite: true,
  inviteDescription: "Advanced calculator with premium features."
}
```

### User-Specific Access

```typescript
{
  id: "admin-panel",
  name: "Admin Panel",
  requiresInvite: true,
  allowedUsers: ["admin", "moderator"],
  inviteDescription: "Administrative tools for system management."
}
```

### Custom Authentication Flow

```tsx
function CustomProtectedComponent() {
  const { hasAccess, isChecking, userName } = useToolAccess('tool-id');
  
  if (isChecking) {
    return <LoadingSpinner />;
  }
  
  if (!hasAccess) {
    return (
      <div>
        <h2>Access Required</h2>
        <InviteForm 
          toolId="tool-id" 
          toolName="Custom Tool"
          onSuccess={() => window.location.reload()}
        />
      </div>
    );
  }
  
  return (
    <div>
      <h2>Welcome, {userName}!</h2>
      <ProtectedContent />
    </div>
  );
}
```

## Troubleshooting

### Common Issues

1. **"Invalid invite key" error**
   - Check that the key exists in `INVITE_KEYS`
   - Verify JSON format is correct
   - Ensure no extra spaces or characters

2. **Session not persisting**
   - Check cookie settings
   - Verify HTTPS in production
   - Check browser cookie policies

3. **Logs not appearing**
   - Verify `INVITE_LOG_ENABLED=true`
   - Check log directory permissions
   - Ensure disk space is available

4. **Tool not protected**
   - Verify `requiresInvite: true` in tool config
   - Check that `ToolWrapper` is used correctly
   - Ensure tool ID matches exactly

### Debug Mode

Enable debug logging:

```env
INVITE_CONSOLE_LOG=true
DEBUG=true
```

## Migration Guide

To add invite protection to existing tools:

1. Update tool configuration in `tools-registry.ts`
2. Wrap tool component with `ToolWrapper`
3. Configure environment variables
4. Test authentication flow
5. Monitor logs for access patterns

## Contributing

When adding new features to the invite system:

1. Update type definitions
2. Add comprehensive logging
3. Include error handling
4. Update documentation
5. Add tests for new functionality

## Support

For issues or questions about the invite system:

1. Check the troubleshooting section
2. Review log files for error details
3. Verify configuration settings
4. Test with debug mode enabled