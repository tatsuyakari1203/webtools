import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getNetworkFacts } from '../utils/ipAnalysis';
import { 
  Globe, 
  Network, 
  Shield, 
  Wifi, 
  ChevronRight,
  Info,
  BookOpen,
  Lightbulb
} from 'lucide-react';

const NetworkEducation: React.FC = () => {
  const facts = getNetworkFacts();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const FactCard = ({ 
    title, 
    icon: Icon, 
    facts: factList, 
    color 
  }: { 
    title: string; 
    icon: React.ComponentType<{ className?: string }>; 
    facts: string[]; 
    color: string;
  }) => (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className={`h-5 w-5 ${color}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {factList.map((fact, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 border border-border rounded-lg">
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${color.replace('text-', 'bg-')}`}></div>
              <p className="text-sm text-foreground leading-relaxed">{fact}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const QuickReference = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Quick Reference
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">IP Classes</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-muted/50 border border-border rounded">
                <span className="font-mono text-sm">Class A</span>
                <Badge variant="outline" className="text-xs">1.0.0.0 - 126.255.255.255</Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/50 border border-border rounded">
                <span className="font-mono text-sm">Class B</span>
                <Badge variant="outline" className="text-xs">128.0.0.0 - 191.255.255.255</Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/50 border border-border rounded">
                <span className="font-mono text-sm">Class C</span>
                <Badge variant="outline" className="text-xs">192.0.0.0 - 223.255.255.255</Badge>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Private Ranges</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-muted/50 border border-border rounded">
                <span className="font-mono text-sm">10.0.0.0/8</span>
                <Badge variant="outline" className="text-xs">Class A Private</Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/50 border border-border rounded">
                <span className="font-mono text-sm">172.16.0.0/12</span>
                <Badge variant="outline" className="text-xs">Class B Private</Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/50 border border-border rounded">
                <span className="font-mono text-sm">192.168.0.0/16</span>
                <Badge variant="outline" className="text-xs">Class C Private</Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const InteractiveSection = () => {
    const sections = [
      {
        id: 'subnetting',
        title: 'Subnetting Basics',
        icon: Network,
        content: [
          'Subnetting divides a large network into smaller, manageable sub-networks',
          'Each subnet has its own network address and broadcast address',
          'Subnet masks determine which part of an IP address is the network portion',
          'CIDR notation (e.g., /24) indicates how many bits are used for the network portion',
          'Variable Length Subnet Masking (VLSM) allows different subnet sizes within the same network'
        ]
      },
      {
        id: 'routing',
        title: 'Routing Fundamentals',
        icon: Wifi,
        content: [
          'Routers forward packets between different networks based on IP addresses',
          'Routing tables contain information about network destinations and next hops',
          'Default gateway is the router that handles traffic to unknown networks',
          'Static routes are manually configured, dynamic routes are learned automatically',
          'Longest prefix match is used when multiple routes exist to the same destination'
        ]
      },
      {
        id: 'nat',
        title: 'Network Address Translation (NAT)',
        icon: Shield,
        content: [
          'NAT allows multiple devices to share a single public IP address',
          'Port Address Translation (PAT) uses port numbers to distinguish connections',
          'NAT provides a basic level of security by hiding internal network structure',
          'Static NAT creates a one-to-one mapping between private and public addresses',
          'Dynamic NAT assigns public addresses from a pool as needed'
        ]
      }
    ];

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Interactive Learning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sections.map((section) => (
              <div key={section.id} className="border rounded-lg">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <section.icon className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">{section.title}</span>
                  </div>
                  <ChevronRight 
                    className={`h-4 w-4 transition-transform ${
                      expandedSection === section.id ? 'rotate-90' : ''
                    }`} 
                  />
                </button>
                {expandedSection === section.id && (
                  <div className="px-4 pb-4">
                    <div className="space-y-2 pt-2 border-t">
                      {section.content.map((item, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                          <p className="text-sm text-gray-700">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Network Knowledge Center
          </CardTitle>
          <p className="text-sm text-gray-600">
            Learn about networking concepts, IP addressing, and internet protocols
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="facts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="facts">Network Facts</TabsTrigger>
          <TabsTrigger value="reference">Quick Reference</TabsTrigger>
          <TabsTrigger value="interactive">Interactive</TabsTrigger>
        </TabsList>
        
        <TabsContent value="facts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FactCard
              title="IPv4 Fundamentals"
              icon={Globe}
              facts={facts.ipv4Facts}
              color="text-blue-600"
            />
            <FactCard
              title="Subnetting & CIDR"
              icon={Network}
              facts={facts.subnetFacts}
              color="text-green-600"
            />
            <FactCard
              title="Network Protocols"
              icon={Wifi}
              facts={facts.protocolFacts}
              color="text-purple-600"
            />
            <FactCard
              title="Security Concepts"
              icon={Shield}
              facts={facts.securityFacts}
              color="text-red-600"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="reference">
          <QuickReference />
        </TabsContent>
        
        <TabsContent value="interactive">
          <InteractiveSection />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NetworkEducation;