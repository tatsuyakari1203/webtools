import { NextRequest, NextResponse } from 'next/server'
import { IPInfo, IPResponse } from '@/tools/what-is-my-ip/types'

// Lấy IP từ request headers
function getClientIP(request: NextRequest): string {
  // Kiểm tra các headers phổ biến cho IP thực
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  if (forwarded) {
    // x-forwarded-for có thể chứa nhiều IP, lấy IP đầu tiên
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  // For development/localhost, return a mock public IP
  return '8.8.8.8'
}

// Lấy thông tin địa lý từ IP sử dụng ipapi.co (free tier)
async function getIPInfo(ip: string): Promise<IPInfo | null> {
  try {
    // Sử dụng ipapi.co - free service với 1000 requests/day
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: {
        'User-Agent': 'WebTools/1.0'
      },
      next: { revalidate: 3600 } // Cache 1 hour
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Kiểm tra nếu có lỗi từ API
    if (data.error) {
      throw new Error(data.reason || 'Unknown error from IP API')
    }
    
    return {
      ip: data.ip || ip,
      city: data.city,
      region: data.region,
      country: data.country_name,
      countryCode: data.country_code,
      timezone: data.timezone,
      isp: data.org,
      org: data.org,
      as: data.asn,
      lat: data.latitude,
      lon: data.longitude,
      mobile: false, // ipapi.co không cung cấp thông tin này
      proxy: false,  // ipapi.co không cung cấp thông tin này
      hosting: false // ipapi.co không cung cấp thông tin này
    }
  } catch (error) {
    console.error('Error fetching IP info:', error)
    return null
  }
}

// Fallback service sử dụng ip-api.com
async function getIPInfoFallback(ip: string): Promise<IPInfo | null> {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,city,lat,lon,timezone,isp,org,as,mobile,proxy,hosting,query`, {
      next: { revalidate: 3600 }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.status === 'fail') {
      throw new Error(data.message || 'Failed to get IP info')
    }
    
    return {
      ip: data.query || ip,
      city: data.city,
      region: data.region,
      country: data.country,
      countryCode: data.countryCode,
      timezone: data.timezone,
      isp: data.isp,
      org: data.org,
      as: data.as,
      lat: data.lat,
      lon: data.lon,
      mobile: data.mobile || false,
      proxy: data.proxy || false,
      hosting: data.hosting || false
    }
  } catch (error) {
    console.error('Error fetching IP info from fallback:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request)
    
    // Check if we're in development with localhost/private IP
    const isLocalhost = clientIP === '127.0.0.1' || clientIP === '::1' || clientIP.startsWith('192.168.') || clientIP.startsWith('10.') || clientIP.startsWith('172.')
    
    if (isLocalhost || clientIP === '8.8.8.8') {
       // Return mock data for development
       const mockData: IPInfo = {
         ip: clientIP === '8.8.8.8' ? clientIP : '127.0.0.1',
         city: 'Development City',
         region: 'Dev Region',
         country: 'Development',
         countryCode: 'DEV',
         timezone: 'UTC',
         lat: 0,
         lon: 0,
         isp: 'Development ISP',
         org: 'Local Development',
         as: 'AS0000 Development Network',
         mobile: false,
         proxy: false,
         hosting: false
       }
       return NextResponse.json({
         success: true,
         data: mockData
       } as IPResponse)
    }
    
    // Thử service chính trước
    let ipInfo = await getIPInfo(clientIP)
    
    // Nếu service chính thất bại, thử fallback
    if (!ipInfo) {
      ipInfo = await getIPInfoFallback(clientIP)
    }
    
    if (!ipInfo) {
      return NextResponse.json({
        success: false,
        error: 'Failed to retrieve IP information from all services'
      } as IPResponse, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      data: ipInfo
    } as IPResponse)
    
  } catch (error) {
    console.error('Error in IP info API:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    } as IPResponse, { status: 500 })
  }
}

// Thêm OPTIONS method để hỗ trợ CORS nếu cần
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}