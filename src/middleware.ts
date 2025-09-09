import { NextRequest, NextResponse } from 'next/server';

// Danh sách các domain được phép truy cập API (từ biến môi trường)
const ALLOWED_ORIGINS = process.env.CORS_ALLOWED_ORIGINS 
  ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [
      'http://localhost:3000',
      'https://localhost:3000',
      'http://127.0.0.1:3000',
      'https://127.0.0.1:3000'
    ];

// Wildcard domains (từ biến môi trường)
const ALLOWED_WILDCARD_DOMAINS = process.env.CORS_WILDCARD_DOMAINS
  ? process.env.CORS_WILDCARD_DOMAINS.split(',').map(domain => domain.trim())
  : [];

// Hàm kiểm tra origin có được phép hay không
function isOriginAllowed(origin: string): boolean {
  // Kiểm tra exact match
  if (ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }
  
  // Kiểm tra wildcard domains
  try {
    const url = new URL(origin);
    const hostname = url.hostname;
    
    for (const domain of ALLOWED_WILDCARD_DOMAINS) {
      // Kiểm tra subdomain của domain được phép
      if (hostname === domain || hostname.endsWith(`.${domain}`)) {
        return true;
      }
    }
  } catch {
    console.error('[Security] Invalid origin URL:', origin);
  }
  
  return false;
}

// Các API routes cần bảo vệ (từ biến môi trường)
const PROTECTED_API_ROUTES = process.env.CORS_PROTECTED_ROUTES
  ? process.env.CORS_PROTECTED_ROUTES.split(',').map(route => route.trim())
  : [
      '/api/askgemini',
      '/api/ocr/process',
      '/api/auth/verify-invite'
    ];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Chỉ áp dụng middleware cho các API routes được bảo vệ
  const isProtectedRoute = PROTECTED_API_ROUTES.some(route => 
    pathname.startsWith(route)
  );
  
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Lấy origin từ request headers
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');
  
  console.log(`[Security] ${pathname} - Origin: ${origin}, Referer: ${referer}, Host: ${host}`);
  
  // Cho phép requests từ cùng domain (same-origin)
  if (host) {
    const sameOriginUrls = [
      `http://${host}`,
      `https://${host}`
    ];
    
    // Kiểm tra origin
    if (origin && sameOriginUrls.includes(origin)) {
      return NextResponse.next();
    }
    
    // Kiểm tra referer nếu không có origin
    if (!origin && referer) {
      const refererOrigin = new URL(referer).origin;
      if (sameOriginUrls.includes(refererOrigin)) {
        return NextResponse.next();
      }
    }
  }
  
  // Kiểm tra với danh sách ALLOWED_ORIGINS và wildcard domains
  if (origin && isOriginAllowed(origin)) {
    return NextResponse.next();
  }
  
  // Kiểm tra referer với ALLOWED_ORIGINS và wildcard domains nếu không có origin
  if (!origin && referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (isOriginAllowed(refererOrigin)) {
        return NextResponse.next();
      }
    } catch {
      console.error('[Security] Invalid referer URL:', referer);
    }
  }
  
  // Cho phép requests từ development tools (Postman, curl, etc.) trong development
  if (process.env.NODE_ENV === 'development') {
    // Nếu không có origin và referer (như từ Postman, curl)
    if (!origin && !referer) {
      console.log('[Security] Allowing request without origin/referer in development mode');
      return NextResponse.next();
    }
  }
  
  // Từ chối request không được phép
  console.warn(`[Security] Blocked request to ${pathname} from origin: ${origin || 'unknown'}, referer: ${referer || 'unknown'}`);
  
  return NextResponse.json(
    { 
      success: false, 
      error: 'Access denied. This API can only be accessed from authorized domains.' 
    },
    { 
      status: 403,
      headers: {
        'Access-Control-Allow-Origin': origin && isOriginAllowed(origin) ? origin : 'null',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    }
  );
}

// Cấu hình matcher để chỉ áp dụng middleware cho các routes cần thiết
export const config = {
  matcher: [
    // Áp dụng cho các API routes cụ thể
    '/api/askgemini',
    '/api/ocr/process',
    '/api/askgemini/:path*',
    '/api/ocr/process/:path*',
    // Loại trừ các static files và Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};