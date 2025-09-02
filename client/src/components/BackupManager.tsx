import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Database, AlertTriangle, CheckCircle } from 'lucide-react';

interface BackupStatus {
  status: string;
  counts?: {
    builds: number;
    orders: number;
    users: number;
  };
  schedulerRunning: boolean;
  lastCheck: string;
  error?: string;
}

export function BackupManager() {
  const [backupStatus, setBackupStatus] = useState<BackupStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastAction, setLastAction] = useState<string>('');

  const fetchBackupStatus = async () => {
    try {
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'health_check' })
      });
      
      if (response.ok) {
        const data = await response.json();
        setBackupStatus(data.health);
      }
    } catch (error) {
      console.error('Failed to fetch backup status:', error);
    }
  };

  const performBackup = async () => {
    setIsLoading(true);
    setLastAction('Performing backup...');
    
    try {
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'full_backup' })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setLastAction('Backup completed successfully');
        await fetchBackupStatus(); // Refresh status
      } else {
        setLastAction('Backup failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      setLastAction('Backup failed: Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const getRestoreInfo = async () => {
    setIsLoading(true);
    setLastAction('Checking restore information...');
    
    try {
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore_info' })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setLastAction('Restore information logged to console');
      } else {
        setLastAction('Failed to get restore info: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      setLastAction('Failed to get restore info: Network error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBackupStatus();
    // Refresh status every 5 minutes
    const interval = setInterval(fetchBackupStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    if (!backupStatus) return <Database className="h-4 w-4" />;
    
    switch (backupStatus.status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'unhealthy':
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Database className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = () => {
    if (!backupStatus) return <Badge variant="secondary">Loading...</Badge>;
    
    switch (backupStatus.status) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-500">Healthy</Badge>;
      case 'unhealthy':
        return <Badge variant="destructive">Unhealthy</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <Card data-testid="backup-manager">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <CardTitle>Database Backup Manager</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        <CardDescription>
          Manage PostgreSQL backup database for data redundancy and disaster recovery
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Information */}
        {backupStatus && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {backupStatus.counts?.builds || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">PC Builds</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {backupStatus.counts?.orders || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Orders</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {backupStatus.counts?.users || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Users</div>
            </div>
          </div>
        )}

        {/* Scheduler Status */}
        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div>
            <div className="font-medium">Automatic Backup Scheduler</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Runs every 6 hours to keep backup database synchronized
            </div>
          </div>
          <Badge variant={backupStatus?.schedulerRunning ? "default" : "secondary"}>
            {backupStatus?.schedulerRunning ? "Running" : "Stopped"}
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={performBackup} 
            disabled={isLoading}
            data-testid="button-backup-now"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Database className="h-4 w-4 mr-2" />
            )}
            Backup Now
          </Button>
          
          <Button 
            onClick={fetchBackupStatus} 
            variant="outline"
            data-testid="button-refresh-status"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
          
          <Button 
            onClick={getRestoreInfo} 
            variant="outline"
            disabled={isLoading}
            data-testid="button-restore-info"
          >
            Check Restore Data
          </Button>
        </div>

        {/* Last Action */}
        {lastAction && (
          <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div className="text-sm font-medium">Last Action:</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{lastAction}</div>
          </div>
        )}

        {/* Error Display */}
        {backupStatus?.error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="text-sm font-medium text-red-800 dark:text-red-400">Error:</div>
            <div className="text-sm text-red-600 dark:text-red-300">{backupStatus.error}</div>
          </div>
        )}

        {/* Last Check Time */}
        {backupStatus?.lastCheck && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Last checked: {new Date(backupStatus.lastCheck).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}