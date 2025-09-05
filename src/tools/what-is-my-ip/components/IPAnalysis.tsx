import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { analyzeIP } from '../utils/ipAnalysis';
import { Network, Binary, Hash, Globe, Shield, Router } from 'lucide-react';

interface IPAnalysisProps {
  ip: string;
}

const IPAnalysis: React.FC<IPAnalysisProps> = ({ ip }) => {
  const analysis = analyzeIP(ip);

  const getIPTypeColor = (type: string) => {
    if (type.includes('Private')) return 'bg-blue-100 text-blue-800';
    if (type === 'Public') return 'bg-green-100 text-green-800';
    if (type === 'Loopback') return 'bg-purple-100 text-purple-800';
    if (type === 'Multicast') return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getClassColor = (ipClass: string) => {
    if (ipClass.includes('Class A')) return 'bg-red-100 text-red-800';
    if (ipClass.includes('Class B')) return 'bg-yellow-100 text-yellow-800';
    if (ipClass.includes('Class C')) return 'bg-green-100 text-green-800';
    if (ipClass.includes('Class D')) return 'bg-purple-100 text-purple-800';
    if (ipClass.includes('Class E')) return 'bg-gray-100 text-gray-800';
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          IP Address Analysis: {ip}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Classification */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className="font-medium">IP Class:</span>
              <Badge className={getClassColor(analysis.ipClass)}>
                {analysis.ipClass}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="font-medium">IP Type:</span>
              <Badge className={getIPTypeColor(analysis.ipType)}>
                {analysis.ipType}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Router className="h-4 w-4" />
              <span className="font-medium">Subnet Mask:</span>
              <code className="bg-muted/50 border border-border px-2 py-1 rounded text-sm">
                {analysis.subnetMask}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              <span className="font-medium">CIDR:</span>
              <code className="bg-muted/50 border border-border px-2 py-1 rounded text-sm">
                {analysis.cidrNotation}
              </code>
            </div>
          </div>
        </div>

        <Separator />

        {/* Network Information */}
        <div className="space-y-4">
          <h4 className="font-semibold text-lg flex items-center gap-2">
            <Router className="h-4 w-4" />
            Network Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div>
                <span className="font-medium">Network Address:</span>
                <code className="block bg-muted/50 border border-border px-3 py-2 rounded mt-1">
                  {analysis.networkAddress}
                </code>
              </div>
              <div>
                <span className="font-medium">Broadcast Address:</span>
                <code className="block bg-muted/50 border border-border px-3 py-2 rounded mt-1">
                  {analysis.broadcastAddress}
                </code>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Total Hosts:</span>
                <div className="text-lg font-mono">
                  {analysis.totalHosts.toLocaleString()}
                </div>
              </div>
              <div>
                <span className="font-medium">Usable Hosts:</span>
                <div className="text-lg font-mono">
                  {analysis.usableHosts.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Binary and Hex Representation */}
        <div className="space-y-4">
          <h4 className="font-semibold text-lg flex items-center gap-2">
            <Binary className="h-4 w-4" />
            Number Representations
          </h4>
          <div className="space-y-3">
            <div>
              <span className="font-medium">Decimal (Octets):</span>
              <div className="flex gap-2 mt-1">
                {analysis.octets.map((octet, index) => (
                  <code key={index} className="bg-muted/50 border border-border px-3 py-2 rounded font-mono text-sm">
                    {octet}
                  </code>
                ))}
              </div>
            </div>
            <div>
              <span className="font-medium flex items-center gap-2">
                <Binary className="h-4 w-4" />
                Binary:
              </span>
              <code className="block bg-muted/50 border border-border px-3 py-2 rounded mt-1 font-mono text-sm break-all">
                {analysis.binaryRepresentation}
              </code>
            </div>
            <div>
              <span className="font-medium flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Hexadecimal:
              </span>
              <code className="block bg-muted/50 border border-border px-3 py-2 rounded mt-1 font-mono">
                {analysis.hexRepresentation}
              </code>
            </div>
          </div>
        </div>

        <Separator />

        {/* IP Properties */}
        <div className="space-y-4">
          <h4 className="font-semibold text-lg">IP Properties</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                analysis.isPrivate ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <div className="text-sm font-medium">Private</div>
              <div className="text-xs text-muted-foreground">
                {analysis.isPrivate ? 'Yes' : 'No'}
              </div>
            </div>
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                analysis.isLoopback ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <div className="text-sm font-medium">Loopback</div>
              <div className="text-xs text-muted-foreground">
                {analysis.isLoopback ? 'Yes' : 'No'}
              </div>
            </div>
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                analysis.isMulticast ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <div className="text-sm font-medium">Multicast</div>
              <div className="text-xs text-muted-foreground">
                {analysis.isMulticast ? 'Yes' : 'No'}
              </div>
            </div>
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                analysis.isBroadcast ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <div className="text-sm font-medium">Broadcast</div>
              <div className="text-xs text-muted-foreground">
                {analysis.isBroadcast ? 'Yes' : 'No'}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IPAnalysis;