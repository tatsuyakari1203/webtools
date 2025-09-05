export interface IPInfo {
  ip: string
  city?: string
  region?: string
  country?: string
  countryCode?: string
  timezone?: string
  isp?: string
  org?: string
  as?: string
  lat?: number
  lon?: number
  mobile?: boolean
  proxy?: boolean
  hosting?: boolean
}

export interface LocalIPInfo {
  localIPs: string[]
  error?: string
}

export interface IPResponse {
  success: boolean
  data?: IPInfo
  error?: string
}

export interface LocationInfo {
  city: string
  region: string
  country: string
  countryCode: string
  timezone: string
  coordinates: {
    lat: number
    lon: number
  }
}

export interface SecurityInfo {
  isp: string
  org: string
  as: string
  mobile: boolean
  proxy: boolean
  hosting: boolean
}