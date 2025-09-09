import { promises as fs } from 'fs';
import path from 'path';

// Types for logging
interface AccessLog {
  id: string;
  timestamp: string;
  userName: string;
  toolId: string;
  action: 'access' | 'denied' | 'expired' | 'invalid_key';
  ip: string;
  userAgent: string;
  location?: {
    country: string;
    city: string;
    region: string;
  };
  sessionDuration?: number; // in minutes
  metadata?: Record<string, unknown>;
}

interface LogStats {
  totalAccess: number;
  uniqueUsers: number;
  topTools: Array<{ toolId: string; count: number }>;
  topUsers: Array<{ userName: string; count: number }>;
  recentActivity: AccessLog[];
  accessByDay: Record<string, number>;
}

// Configuration
const LOG_CONFIG = {
  enabled: process.env.INVITE_LOG_ENABLED === 'true',
  logDir: process.env.INVITE_LOG_DIR || path.join(process.cwd(), 'logs'),
  maxLogSize: parseInt(process.env.INVITE_LOG_MAX_SIZE || '10485760'), // 10MB
  retentionDays: parseInt(process.env.INVITE_LOG_RETENTION_DAYS || '30'),
  enableConsoleLog: process.env.INVITE_CONSOLE_LOG === 'true',
  enableFileLog: process.env.INVITE_FILE_LOG !== 'false', // default true
};

// Ensure log directory exists
async function ensureLogDirectory(): Promise<void> {
  try {
    await fs.access(LOG_CONFIG.logDir);
  } catch {
    await fs.mkdir(LOG_CONFIG.logDir, { recursive: true });
  }
}

// Generate unique log ID
function generateLogId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get current log file path
function getCurrentLogFile(): string {
  const today = new Date().toISOString().split('T')[0];
  return path.join(LOG_CONFIG.logDir, `access-${today}.json`);
}

// Rotate log files if needed
async function rotateLogsIfNeeded(): Promise<void> {
  try {
    const logFile = getCurrentLogFile();
    
    try {
      const stats = await fs.stat(logFile);
      if (stats.size > LOG_CONFIG.maxLogSize) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const rotatedFile = logFile.replace('.json', `-${timestamp}.json`);
        await fs.rename(logFile, rotatedFile);
      }
    } catch (_error) {
      // File doesn't exist, no need to rotate
    }
  } catch (error) {
    console.error('Error rotating logs:', error);
  }
}

// Clean old log files
async function cleanOldLogs(): Promise<void> {
  try {
    const files = await fs.readdir(LOG_CONFIG.logDir);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - LOG_CONFIG.retentionDays);

    for (const file of files) {
      if (file.startsWith('access-') && file.endsWith('.json')) {
        const filePath = path.join(LOG_CONFIG.logDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          console.log(`Deleted old log file: ${file}`);
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning old logs:', error);
  }
}

// Main logging function
export async function logAccess(
  userName: string,
  toolId: string,
  action: AccessLog['action'],
  ip: string,
  userAgent: string,
  location?: AccessLog['location'],
  metadata?: Record<string, unknown>
): Promise<void> {
  if (!LOG_CONFIG.enabled) {
    return;
  }

  const logEntry: AccessLog = {
    id: generateLogId(),
    timestamp: new Date().toISOString(),
    userName,
    toolId,
    action,
    ip,
    userAgent,
    location,
    metadata
  };

  // Console logging
  if (LOG_CONFIG.enableConsoleLog) {
    const emoji = {
      access: '✅',
      denied: '❌',
      expired: '⏰',
      invalid_key: '🔑'
    }[action];

    console.log(`${emoji} [${logEntry.timestamp}] ${userName} ${action} ${toolId} from ${ip}`);
  }

  // File logging
  if (LOG_CONFIG.enableFileLog) {
    try {
      await ensureLogDirectory();
      await rotateLogsIfNeeded();
      
      const logFile = getCurrentLogFile();
      const logLine = JSON.stringify(logEntry) + '\n';
      
      await fs.appendFile(logFile, logLine, 'utf8');
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  }

  // Clean old logs periodically (1% chance per log)
  if (Math.random() < 0.01) {
    cleanOldLogs().catch(console.error);
  }
}

// Read logs from file
export async function readLogs(
  startDate?: string,
  endDate?: string,
  toolId?: string,
  userName?: string,
  limit: number = 1000
): Promise<AccessLog[]> {
  if (!LOG_CONFIG.enabled) {
    return [];
  }

  try {
    await ensureLogDirectory();
    const files = await fs.readdir(LOG_CONFIG.logDir);
    const logFiles = files
      .filter(file => file.startsWith('access-') && file.endsWith('.json'))
      .sort()
      .reverse(); // Most recent first

    const logs: AccessLog[] = [];
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    for (const file of logFiles) {
      if (logs.length >= limit) break;
      
      try {
        const filePath = path.join(LOG_CONFIG.logDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        const lines = content.trim().split('\n').filter(line => line);

        for (const line of lines) {
          if (logs.length >= limit) break;
          
          try {
            const log: AccessLog = JSON.parse(line);
            const logDate = new Date(log.timestamp);

            // Filter by date range
            if (start && logDate < start) continue;
            if (end && logDate > end) continue;

            // Filter by tool ID
            if (toolId && log.toolId !== toolId) continue;

            // Filter by user name
            if (userName && log.userName !== userName) continue;

            logs.push(log);
          } catch (parseError) {
            console.error('Error parsing log line:', parseError);
          }
        }
      } catch (fileError) {
        console.error(`Error reading log file ${file}:`, fileError);
      }
    }

    return logs.slice(0, limit);
  } catch (error) {
    console.error('Error reading logs:', error);
    return [];
  }
}

// Generate statistics from logs
export async function generateLogStats(
  days: number = 7
): Promise<LogStats> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const logs = await readLogs(startDate.toISOString());
  
  const stats: LogStats = {
    totalAccess: logs.filter(log => log.action === 'access').length,
    uniqueUsers: new Set(logs.map(log => log.userName)).size,
    topTools: [],
    topUsers: [],
    recentActivity: logs.slice(0, 10),
    accessByDay: {}
  };

  // Count by tool
  const toolCounts = new Map<string, number>();
  const userCounts = new Map<string, number>();
  const dayAccess = new Map<string, number>();

  logs.forEach(log => {
    if (log.action === 'access') {
      // Tool counts
      toolCounts.set(log.toolId, (toolCounts.get(log.toolId) || 0) + 1);
      
      // User counts
      userCounts.set(log.userName, (userCounts.get(log.userName) || 0) + 1);
      
      // Daily access
      const day = log.timestamp.split('T')[0];
      dayAccess.set(day, (dayAccess.get(day) || 0) + 1);
    }
  });

  // Top tools
  stats.topTools = Array.from(toolCounts.entries())
    .map(([toolId, count]) => ({ toolId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Top users
  stats.topUsers = Array.from(userCounts.entries())
    .map(([userName, count]) => ({ userName, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Access by day
  stats.accessByDay = Object.fromEntries(dayAccess);

  return stats;
}

// Export log data as CSV
export async function exportLogsAsCSV(
  startDate?: string,
  endDate?: string
): Promise<string> {
  const logs = await readLogs(startDate, endDate);
  
  const headers = [
    'Timestamp',
    'User Name',
    'Tool ID',
    'Action',
    'IP Address',
    'Country',
    'City',
    'User Agent'
  ];

  const csvLines = [headers.join(',')];
  
  logs.forEach(log => {
    const row = [
      log.timestamp,
      log.userName,
      log.toolId,
      log.action,
      log.ip,
      log.location?.country || '',
      log.location?.city || '',
      `"${log.userAgent.replace(/"/g, '""')}"`
    ];
    csvLines.push(row.join(','));
  });

  return csvLines.join('\n');
}

// Helper function to log tool access
export async function logToolAccess(
  userName: string,
  toolId: string,
  ip: string,
  userAgent: string,
  location?: AccessLog['location']
): Promise<void> {
  await logAccess(userName, toolId, 'access', ip, userAgent, location);
}

// Helper function to log access denied
export async function logAccessDenied(
  userName: string,
  toolId: string,
  ip: string,
  userAgent: string,
  reason: string
): Promise<void> {
  await logAccess(userName, toolId, 'denied', ip, userAgent, undefined, { reason });
}