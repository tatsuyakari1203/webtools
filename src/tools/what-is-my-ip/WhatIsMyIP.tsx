'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Globe, 
  MapPin, 
  Clock, 
  Building, 
  Shield, 
  Smartphone, 
  Server, 
  RefreshCw, 
  Copy, 
  CheckCircle,
  AlertCircle,
  Wifi,
  BarChart3,
  BookOpen
} from 'lucide-react'
import { IPInfo, IPResponse } from './types'
import { useLocalIP } from './useLocalIP'
import IPAnalysis from './components/IPAnalysis'
import NetworkEducation from './components/NetworkEducation'

export default function WhatIsMyIP() {
  const [ipInfo, setIpInfo] = useState<IPInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  
  // Get local IP using WebRTC
  const { localIPInfo, loading: localIPLoading } = useLocalIP()

  const fetchIPInfo = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/ip-info')
      if (!response.ok) {
        throw new Error('Failed to fetch IP information')
      }
      
      const result: IPResponse = await response.json()
      if (result.success && result.data) {
        setIpInfo(result.data)
      } else {
        throw new Error(result.error || 'Failed to get IP information')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIPInfo()
  }, [])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const formatCoordinates = (lat?: number, lon?: number) => {
    if (lat === undefined || lon === undefined) return 'N/A'
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">What is my IP?</h1>
          <p className="text-muted-foreground text-lg">
            Discovering your public IP address and location information...
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">What is my IP?</h1>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        
        <div className="text-center mt-6">
          <Button onClick={fetchIPInfo} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">What is my IP?</h1>
        <p className="text-muted-foreground text-lg">
          Your public IP address, network analysis, and educational resources
        </p>
      </div>

      {/* Main IP Display */}
      <Card className="mb-6">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Globe className="h-6 w-6" />
            Your Public IP Address
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="text-4xl font-mono font-bold mb-4 text-primary">
            {ipInfo?.ip}
          </div>
          <Button 
            onClick={() => copyToClipboard(ipInfo?.ip || '')}
            variant="outline"
            className="gap-2"
          >
            {copied ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? 'Copied!' : 'Copy IP'}
          </Button>
        </CardContent>
      </Card>

      {/* Tabs Navigation */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="additional" className="flex items-center gap-2">
            <Wifi className="h-4 w-4" />
            Additional IPs
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            IP Analysis
          </TabsTrigger>
          <TabsTrigger value="education" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Learn
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
        {/* Location Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location Information
            </CardTitle>
            <CardDescription>
              Geographic details based on your IP address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Country:</span>
                <div className="flex items-center gap-2">
                  <span>{ipInfo?.country || 'N/A'}</span>
                  {ipInfo?.countryCode && (
                    <Badge variant="secondary">{ipInfo.countryCode}</Badge>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Region:</span>
                <span>{ipInfo?.region || 'N/A'}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">City:</span>
                <span>{ipInfo?.city || 'N/A'}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Coordinates:</span>
                <span className="font-mono text-sm">
                  {formatCoordinates(ipInfo?.lat, ipInfo?.lon)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Timezone:
                </span>
                <span>{ipInfo?.timezone || 'N/A'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Network Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Network Information
            </CardTitle>
            <CardDescription>
              Details about your internet service provider
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium flex items-center gap-1">
                  <Building className="h-4 w-4" />
                  ISP:
                </span>
                <span className="text-right">{ipInfo?.isp || 'N/A'}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Organization:</span>
                <span className="text-right">{ipInfo?.org || 'N/A'}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">AS Number:</span>
                <span className="font-mono text-sm">{ipInfo?.as || 'N/A'}</span>
              </div>
            </div>
            
            <Separator />
            
            {/* Security Badges */}
            <div className="space-y-2">
              <div className="text-sm font-medium flex items-center gap-1">
                <Shield className="h-4 w-4" />
                Connection Type:
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge 
                  variant={ipInfo?.mobile ? "default" : "secondary"}
                  className="gap-1"
                >
                  <Smartphone className="h-3 w-3" />
                  {ipInfo?.mobile ? 'Mobile' : 'Desktop'}
                </Badge>
                
                <Badge 
                  variant={ipInfo?.proxy ? "destructive" : "secondary"}
                  className="gap-1"
                >
                  <Shield className="h-3 w-3" />
                  {ipInfo?.proxy ? 'Proxy Detected' : 'Direct Connection'}
                </Badge>
                
                <Badge 
                  variant={ipInfo?.hosting ? "outline" : "secondary"}
                  className="gap-1"
                >
                  <Server className="h-3 w-3" />
                  {ipInfo?.hosting ? 'Hosting Provider' : 'Residential'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
            </div>
            
            {/* Refresh Button */}
            <div className="text-center mt-8">
              <Button onClick={fetchIPInfo} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh Information
              </Button>
            </div>

            {/* Disclaimer */}
            <Alert className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Privacy Note:</strong> This information is publicly available based on your IP address. 
                The accuracy may vary depending on your internet service provider and location.
              </AlertDescription>
            </Alert>
        </TabsContent>

        {/* Additional IPs Tab */}
        <TabsContent value="additional" className="space-y-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Wifi className="h-6 w-6" />
                Additional IP Addresses
              </CardTitle>
              <CardDescription>
                IP addresses detected via WebRTC (may include local and public IPs)
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              {localIPLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-48 mx-auto" />
                  <Skeleton className="h-4 w-32 mx-auto" />
                </div>
              ) : localIPInfo.error ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{localIPInfo.error}</AlertDescription>
                </Alert>
              ) : localIPInfo.localIPs.length > 0 ? (
                <div className="space-y-3">
                  {localIPInfo.localIPs.map((ip, index) => (
                    <div key={index} className="flex items-center justify-center gap-2">
                      <div className="text-2xl font-mono font-bold text-primary">
                        {ip}
                      </div>
                      <Button 
                        onClick={() => copyToClipboard(ip)}
                        variant="outline"
                        size="sm"
                        className="gap-1"
                      >
                        {copied ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                  <p className="text-sm text-muted-foreground">
                    Found {localIPInfo.localIPs.length} additional IP address{localIPInfo.localIPs.length > 1 ? 'es' : ''}
                  </p>
                </div>
              ) : (
                <div className="text-muted-foreground">
                  No additional IP addresses detected
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* IP Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          {ipInfo?.ip && <IPAnalysis ip={ipInfo.ip} />}
          {localIPInfo.localIPs.length > 0 && (
            <div className="space-y-4">
              {localIPInfo.localIPs.map((ip, index) => (
                <IPAnalysis key={index} ip={ip} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Education Tab */}
        <TabsContent value="education">
          <NetworkEducation />
        </TabsContent>
      </Tabs>
    </div>
  )
}