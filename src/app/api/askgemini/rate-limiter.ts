// Simple in-memory rate limiter
// Trong production, nên sử dụng Redis hoặc database để lưu trữ

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  windowMs: number;     // Thời gian window (ms)
  maxRequests: number;  // Số request tối đa trong window
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    
    // Cleanup expired entries every 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Kiểm tra rate limit cho một identifier (IP, user ID, etc.)
   */
  checkLimit(identifier: string): RateLimitResult {
    const now = Date.now();
    const entry = this.store.get(identifier);
    
    // Nếu chưa có entry hoặc đã hết hạn
    if (!entry || now >= entry.resetTime) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + this.config.windowMs
      };
      this.store.set(identifier, newEntry);
      
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: newEntry.resetTime
      };
    }
    
    // Nếu đã vượt quá limit
    if (entry.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      };
    }
    
    // Tăng count và cho phép request
    entry.count++;
    this.store.set(identifier, entry);
    
    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  }

  /**
   * Reset rate limit cho một identifier
   */
  reset(identifier: string): void {
    this.store.delete(identifier);
  }

  /**
   * Lấy thông tin hiện tại của rate limit
   */
  getStatus(identifier: string): { count: number; resetTime: number } | null {
    const entry = this.store.get(identifier);
    if (!entry || Date.now() >= entry.resetTime) {
      return null;
    }
    return { count: entry.count, resetTime: entry.resetTime };
  }

  /**
   * Dọn dẹp các entry đã hết hạn
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Lấy số lượng entry hiện tại (để monitoring)
   */
  getStoreSize(): number {
    return this.store.size;
  }

  /**
   * Clear toàn bộ store (để testing)
   */
  clear(): void {
    this.store.clear();
  }
}

// Cấu hình rate limit mặc định
export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 phút
  maxRequests: 100          // 100 requests per 15 minutes
};

// Cấu hình rate limit nghiêm ngặt hơn cho production
export const STRICT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 phút
  maxRequests: 50           // 50 requests per 15 minutes
};

// Cấu hình rate limit cho development
export const DEV_RATE_LIMIT_CONFIG: RateLimitConfig = {
  windowMs: 5 * 60 * 1000,  // 5 phút
  maxRequests: 200          // 200 requests per 5 minutes
};

// Singleton instance
let rateLimiterInstance: RateLimiter | null = null;

/**
 * Lấy instance của rate limiter (singleton pattern)
 */
export function getRateLimiter(): RateLimiter {
  if (!rateLimiterInstance) {
    const config = process.env.NODE_ENV === 'production' 
      ? STRICT_RATE_LIMIT_CONFIG 
      : DEV_RATE_LIMIT_CONFIG;
    
    rateLimiterInstance = new RateLimiter(config);
  }
  
  return rateLimiterInstance;
}

/**
 * Tạo identifier từ request (IP + User Agent)
 */
export function createRateLimitIdentifier(request: Request): string {
  // Lấy IP từ headers (xử lý proxy/load balancer)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  // Lấy User Agent để tạo identifier unique hơn
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  // Tạo hash đơn giản từ IP + User Agent
  const identifier = `${ip}:${userAgent.substring(0, 50)}`;
  
  return identifier;
}

/**
 * Middleware helper để kiểm tra rate limit
 */
export function checkRateLimit(request: Request): RateLimitResult {
  const rateLimiter = getRateLimiter();
  const identifier = createRateLimitIdentifier(request);
  
  return rateLimiter.checkLimit(identifier);
}