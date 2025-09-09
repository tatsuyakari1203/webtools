import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { toolsRegistry } from './tools-registry';

// Types
interface SessionPayload {
  name: string;
  toolId: string;
  timestamp: number;
}

interface ProtectedTool {
  id: string;
  requiresInvite: boolean;
  allowedUsers?: string[]; // Optional: restrict to specific users
}

// Get protected tools from tools-registry automatically
function getProtectedToolsFromRegistry(): ProtectedTool[] {
  return toolsRegistry
    .filter(tool => tool.requiresInvite)
    .map(tool => ({
      id: tool.id,
      requiresInvite: true,
      allowedUsers: tool.allowedUsers
    }));
}

// Parse session token
function parseSessionToken(token: string): SessionPayload | null {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

// Check if token is expired
function isTokenExpired(timestamp: number): boolean {
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  return Date.now() - timestamp > TWENTY_FOUR_HOURS;
}

// Get tool configuration
function getToolConfig(toolId: string): ProtectedTool | null {
  const protectedTools = getProtectedToolsFromRegistry();
  return protectedTools.find((tool: ProtectedTool) => tool.id === toolId) || null;
}

// Check if user has access to specific tool
function hasToolAccess(toolConfig: ProtectedTool, userName: string): boolean {
  if (!toolConfig.allowedUsers) {
    return true; // No user restrictions
  }
  return toolConfig.allowedUsers.includes(userName);
}

// Main middleware function
export async function checkInviteAccess(
  request: NextRequest,
  toolId: string
): Promise<{ allowed: boolean; reason?: string; userName?: string }> {
  try {
    // Check if tool requires invite
    const toolConfig = getToolConfig(toolId);
    
    if (!toolConfig || !toolConfig.requiresInvite) {
      return { allowed: true }; // Tool doesn't require invite
    }

    // Get session token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('invite-token')?.value;

    if (!token) {
      return { 
        allowed: false, 
        reason: 'No invite session found. Please enter your invite key.' 
      };
    }

    // Parse and validate token
    const session = parseSessionToken(token);
    if (!session) {
      return { 
        allowed: false, 
        reason: 'Invalid session token. Please re-enter your invite key.' 
      };
    }

    // Check if token is expired
    if (isTokenExpired(session.timestamp)) {
      return { 
        allowed: false, 
        reason: 'Session expired. Please re-enter your invite key.' 
      };
    }

    // Check if user has access to this specific tool
    if (!hasToolAccess(toolConfig, session.name)) {
      return { 
        allowed: false, 
        reason: `Access denied. User '${session.name}' is not authorized for this tool.` 
      };
    }

    // Check if token is for the correct tool (optional strict mode)
    const strictMode = process.env.INVITE_STRICT_MODE === 'true';
    if (strictMode && session.toolId !== toolId) {
      return { 
        allowed: false, 
        reason: 'Session is for a different tool. Please re-enter your invite key.' 
      };
    }

    return { 
      allowed: true, 
      userName: session.name 
    };

  } catch (error) {
    console.error('Error in invite middleware:', error);
    return { 
      allowed: false, 
      reason: 'Authentication error. Please try again.' 
    };
  }
}

// Helper function to create unauthorized response
export function createUnauthorizedResponse(reason: string): NextResponse {
  return NextResponse.json(
    { 
      success: false, 
      error: 'Unauthorized', 
      reason,
      requiresInvite: true 
    },
    { status: 401 }
  );
}

// Helper function to add tool to protected list
export function addProtectedTool(): void {
  // This function is deprecated - tools should be configured in tools-registry.ts
  console.warn('addProtectedTool is deprecated. Configure tools in tools-registry.ts instead.');
}

// Helper function to remove tool from protected list
export function removeProtectedTool(): void {
  // This function is deprecated - tools should be configured in tools-registry.ts
  console.warn('removeProtectedTool is deprecated. Configure tools in tools-registry.ts instead.');
}

// Get all protected tools
export function getProtectedTools(): ProtectedTool[] {
  return getProtectedToolsFromRegistry();
}

// Middleware wrapper for API routes
export function withInviteProtection(
  handler: (request: NextRequest, context: { params: Record<string, string> }) => Promise<NextResponse>,
  toolId: string
) {
  return async (request: NextRequest, context: { params: Record<string, string> }) => {
    const protectedTools = getProtectedToolsFromRegistry();
    const toolConfig = protectedTools.find((tool: ProtectedTool) => tool.id === toolId);
    
    if (!toolConfig?.requiresInvite) {
      return handler(request, context);
    }

    const accessCheck = await checkInviteAccess(request, toolId);
    
    if (!accessCheck.allowed) {
      return createUnauthorizedResponse(accessCheck.reason || 'Access denied');
    }

    return handler(request, context);
  };
}