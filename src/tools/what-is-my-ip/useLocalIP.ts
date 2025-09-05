import { useState, useEffect } from 'react';
import { LocalIPInfo } from './types';

export const useLocalIP = () => {
  const [localIPInfo, setLocalIPInfo] = useState<LocalIPInfo>({ localIPs: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getLocalIPs = async () => {
      try {
        const localIPs: string[] = [];
        
        // Create RTCPeerConnection
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        // Create data channel
        pc.createDataChannel('');

        // Create offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Listen for ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            const candidate = event.candidate.candidate;
            const ipMatch = candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/);
            
            if (ipMatch && ipMatch[1]) {
              const ip = ipMatch[1];
              // Filter out common invalid IPs
              if (!ip.startsWith('0.') && 
                  !ip.startsWith('169.254.') && 
                  !localIPs.includes(ip)) {
                localIPs.push(ip);
                setLocalIPInfo({ localIPs: [...localIPs] });
              }
            }
          }
        };

        // Set timeout to close connection
        setTimeout(() => {
          pc.close();
          setLoading(false);
        }, 3000);

      } catch (error) {
        console.error('Error getting local IP:', error);
        setLocalIPInfo({ 
          localIPs: [], 
          error: 'Failed to retrieve local IP addresses' 
        });
        setLoading(false);
      }
    };

    getLocalIPs();
  }, []);

  return { localIPInfo, loading };
};