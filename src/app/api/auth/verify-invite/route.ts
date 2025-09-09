import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

interface AccessLog {
  name: string;
  ip: string;
  location?: {
    country: string;
    city: string;
    region: string;
  };
  userAgent: string;
  timestamp: string;
  toolId: string;
}

// Parse invite keys from environment
function getInviteKeys(): Record<string, string> {
  try {
    const keysJson = process.env.INVITE_KEYS || '{}';
    return JSON.parse(keysJson);
  } catch (error) {
    console.error('Error parsing INVITE_KEYS:', error);
    return {};
  }
}

// Get IP location information
async function getLocationFromIP(ip: string) {
  try {
    // Using a free IP geolocation service
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    if (response.ok) {
      const data = await response.json();
      return {
        country: data.country || 'Unknown',
        city: data.city || 'Unknown',
        region: data.regionName || 'Unknown'
      };
    }
  } catch (error) {
    console.error('Error getting location:', error);
  }
  return {
    country: 'Unknown',
    city: 'Unknown',
    region: 'Unknown'
  };
}

// Log access attempt
async function logAccess(logData: AccessLog) {
  if (process.env.INVITE_LOG_ENABLED !== 'true') {
    return;
  }

  try {
    // In a real implementation, you might want to use a database
    // For now, we'll log to console and could extend to file logging
    console.log('🔐 Invite Access Log:', {
      timestamp: logData.timestamp,
      name: logData.name,
      ip: logData.ip,
      location: logData.location,
      toolId: logData.toolId,
      userAgent: logData.userAgent
    });

    // TODO: Implement file logging or database storage
    // await fs.appendFile('logs/access.json', JSON.stringify(logData) + '\n');
  } catch (error) {
    console.error('Error logging access:', error);
  }
}

// Generate session token
function generateToken(name: string, toolId: string): string {
  const payload = {
    name,
    toolId,
    timestamp: Date.now()
  };
  // Simple base64 encoding - in production, use proper JWT
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

// Get client IP address
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, toolId } = body;

    if (!key || !toolId) {
      return NextResponse.json(
        { success: false, error: 'Missing key or toolId' },
        { status: 400 }
      );
    }

    // Get invite keys from environment
    const inviteKeys = getInviteKeys();
    
    // Find matching key and get associated name
    let matchedName: string | null = null;
    for (const [name, envKey] of Object.entries(inviteKeys)) {
      if (envKey === key) {
        matchedName = name;
        break;
      }
    }

    if (!matchedName) {
      return NextResponse.json(
        { success: false, error: 'Invalid invite key' },
        { status: 401 }
      );
    }

    // Get client information
    const ip = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const location = await getLocationFromIP(ip);

    // Log the access
    await logAccess({
      name: matchedName,
      ip,
      location,
      userAgent,
      timestamp: new Date().toISOString(),
      toolId
    });

    // Generate session token
    const token = generateToken(matchedName, toolId);

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      name: matchedName,
      token
    });

    // Set secure cookie for session
    response.cookies.set('invite-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined
    });

    return response;

  } catch (error) {
    console.error('Error in verify-invite API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to check current session
export async function GET(_request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('invite-token')?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false });
    }

    try {
      const payload = JSON.parse(Buffer.from(token, 'base64').toString());
      const { name, toolId, timestamp } = payload;

      // Check if token is expired (24 hours) - only when strict mode is enabled
      const strictMode = process.env.INVITE_STRICT_MODE === 'true';
      const isExpired = strictMode && (Date.now() - timestamp > 24 * 60 * 60 * 1000);
      
      if (isExpired) {
        return NextResponse.json({ authenticated: false, expired: true });
      }

      return NextResponse.json({
        authenticated: true,
        name,
        toolId
      });
    } catch (_error) {
      return NextResponse.json({ authenticated: false, invalid: true });
    }

  } catch (error) {
    console.error('Error checking session:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}