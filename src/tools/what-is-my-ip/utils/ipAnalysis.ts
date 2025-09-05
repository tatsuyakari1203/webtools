export interface IPAnalysisResult {
  ipClass: string;
  ipType: string;
  networkAddress: string;
  broadcastAddress: string;
  subnetMask: string;
  cidrNotation: string;
  binaryRepresentation: string;
  hexRepresentation: string;
  octets: number[];
  isPrivate: boolean;
  isLoopback: boolean;
  isMulticast: boolean;
  isBroadcast: boolean;
  totalHosts: number;
  usableHosts: number;
}

export interface NetworkFacts {
  ipv4Facts: string[];
  subnetFacts: string[];
  protocolFacts: string[];
  securityFacts: string[];
}

// Convert IP to binary representation
export function ipToBinary(ip: string): string {
  return ip.split('.')
    .map(octet => parseInt(octet).toString(2).padStart(8, '0'))
    .join('.');
}

// Convert IP to hexadecimal representation
export function ipToHex(ip: string): string {
  return ip.split('.')
    .map(octet => parseInt(octet).toString(16).padStart(2, '0').toUpperCase())
    .join(':');
}

// Determine IP class
export function getIPClass(ip: string): string {
  const firstOctet = parseInt(ip.split('.')[0]);
  
  if (firstOctet >= 1 && firstOctet <= 126) return 'Class A';
  if (firstOctet >= 128 && firstOctet <= 191) return 'Class B';
  if (firstOctet >= 192 && firstOctet <= 223) return 'Class C';
  if (firstOctet >= 224 && firstOctet <= 239) return 'Class D (Multicast)';
  if (firstOctet >= 240 && firstOctet <= 255) return 'Class E (Reserved)';
  
  return 'Invalid';
}

// Determine IP type
export function getIPType(ip: string): string {
  const octets = ip.split('.').map(Number);
  const [first, second] = octets;
  
  // Private IP ranges
  if (first === 10) return 'Private (Class A)';
  if (first === 172 && second >= 16 && second <= 31) return 'Private (Class B)';
  if (first === 192 && second === 168) return 'Private (Class C)';
  
  // Special ranges
  if (first === 127) return 'Loopback';
  if (first === 169 && second === 254) return 'Link-Local';
  if (first >= 224 && first <= 239) return 'Multicast';
  if (first >= 240) return 'Reserved';
  
  return 'Public';
}

// Get default subnet mask based on IP class
export function getDefaultSubnetMask(ip: string): string {
  const ipClass = getIPClass(ip);
  
  switch (ipClass) {
    case 'Class A': return '255.0.0.0';
    case 'Class B': return '255.255.0.0';
    case 'Class C': return '255.255.255.0';
    default: return 'N/A';
  }
}

// Get CIDR notation
export function getCIDRNotation(ip: string): string {
  const ipClass = getIPClass(ip);
  
  switch (ipClass) {
    case 'Class A': return `${ip}/8`;
    case 'Class B': return `${ip}/16`;
    case 'Class C': return `${ip}/24`;
    default: return 'N/A';
  }
}

// Calculate network address
export function getNetworkAddress(ip: string, subnetMask: string): string {
  const ipOctets = ip.split('.').map(Number);
  const maskOctets = subnetMask.split('.').map(Number);
  
  return ipOctets
    .map((octet, index) => octet & maskOctets[index])
    .join('.');
}

// Calculate broadcast address
export function getBroadcastAddress(ip: string, subnetMask: string): string {
  const ipOctets = ip.split('.').map(Number);
  const maskOctets = subnetMask.split('.').map(Number);
  
  return ipOctets
    .map((octet, index) => octet | (255 - maskOctets[index]))
    .join('.');
}

// Calculate total and usable hosts
export function calculateHosts(subnetMask: string): { total: number; usable: number } {
  const maskOctets = subnetMask.split('.').map(Number);
  const hostBits = maskOctets.reduce((bits, octet) => {
    return bits + (8 - octet.toString(2).split('1').length + 1);
  }, 0);
  
  const total = Math.pow(2, hostBits);
  const usable = Math.max(0, total - 2); // Subtract network and broadcast addresses
  
  return { total, usable };
}

// Check if IP is private
export function isPrivateIP(ip: string): boolean {
  const octets = ip.split('.').map(Number);
  const [first, second] = octets;
  
  return (
    first === 10 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

// Check if IP is loopback
export function isLoopbackIP(ip: string): boolean {
  return ip.split('.')[0] === '127';
}

// Check if IP is multicast
export function isMulticastIP(ip: string): boolean {
  const first = parseInt(ip.split('.')[0]);
  return first >= 224 && first <= 239;
}

// Check if IP is broadcast
export function isBroadcastIP(ip: string): boolean {
  return ip === '255.255.255.255';
}

// Main analysis function
export function analyzeIP(ip: string): IPAnalysisResult {
  // Validate IP format and convert to octets
  const octets = ip.split('.').map(octet => {
    const num = parseInt(octet, 10);
    return isNaN(num) || num < 0 || num > 255 ? 0 : num;
  });
  
  const ipClass = getIPClass(ip);
  const ipType = getIPType(ip);
  const subnetMask = getDefaultSubnetMask(ip);
  const networkAddress = getNetworkAddress(ip, subnetMask);
  const broadcastAddress = getBroadcastAddress(ip, subnetMask);
  const hosts = calculateHosts(subnetMask);
  
  return {
    ipClass,
    ipType,
    networkAddress,
    broadcastAddress,
    subnetMask,
    cidrNotation: getCIDRNotation(ip),
    binaryRepresentation: ipToBinary(ip),
    hexRepresentation: ipToHex(ip),
    octets,
    isPrivate: isPrivateIP(ip),
    isLoopback: isLoopbackIP(ip),
    isMulticast: isMulticastIP(ip),
    isBroadcast: isBroadcastIP(ip),
    totalHosts: hosts.total,
    usableHosts: hosts.usable
  };
}

// Network education facts
export function getNetworkFacts(): NetworkFacts {
  return {
    ipv4Facts: [
      'IPv4 addresses are 32-bit numbers, typically written in dotted decimal notation (e.g., 192.168.1.1)',
      'There are approximately 4.3 billion possible IPv4 addresses (2^32)',
      'IPv4 was first deployed in 1983 and is still the most widely used Internet Protocol version',
      'Each octet in an IPv4 address can range from 0 to 255 (8 bits = 256 possible values)',
      'The first IPv4 address block (0.0.0.0/8) is reserved and cannot be used on the public internet'
    ],
    subnetFacts: [
      'Subnetting allows a single network to be divided into smaller sub-networks',
      'Class A networks can support up to 16,777,214 hosts per network',
      'Class B networks can support up to 65,534 hosts per network',
      'Class C networks can support up to 254 hosts per network',
      'CIDR (Classless Inter-Domain Routing) notation uses a slash followed by the number of network bits'
    ],
    protocolFacts: [
      'TCP/IP is the fundamental communication protocol suite of the internet',
      'IP handles addressing and routing, while TCP ensures reliable data delivery',
      'UDP is a faster but less reliable alternative to TCP for certain applications',
      'ICMP is used for network diagnostics and error reporting (like ping)',
      'ARP (Address Resolution Protocol) maps IP addresses to MAC addresses on local networks'
    ],
    securityFacts: [
      'Private IP addresses (RFC 1918) are not routable on the public internet',
      'NAT (Network Address Translation) allows multiple devices to share a single public IP',
      'Firewalls can filter traffic based on IP addresses, ports, and protocols',
      'IP spoofing is a technique where attackers forge the source IP address in packets',
      'VPNs create encrypted tunnels to securely connect remote networks or users'
    ]
  };
}