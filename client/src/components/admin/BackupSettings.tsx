import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Database, 
  Clock, 
  Play, 
  Settings, 
  Check, 
  AlertCircle,
  Timer,
  Download
} from 'lucide-react';

interface BackupTimerStatus {
  intervalHours: number;
  isRunning: boolean;
  nextBackup: string | null;
}

interface BackupHealth {
  status: string;
  counts?: {
    builds: number;
    orders: number;
    users: number;
  };
}

export function BackupSettings() {
  const [timerStatus, setTimerStatus] = useState<BackupTimerStatus | null>(null);
  const [backupHealth, setBackupHealth] = useState<BackupHealth | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newInterval, setNewInterval] = useState<number>(6);
  const [lastAction, setLastAction] = useState<string>('');
  const { toast } = useToast();

  const fetchTimerStatus = async () => {
    try {
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_timer_status' })
      });
      
      if (response.ok) {
        const data = await response.json();
        setTimerStatus(data.timer);
      }
    } catch (error) {
      console.error('Failed to fetch timer status:', error);
    }
  };

  const fetchBackupHealth = async () => {
    try {
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'health_check' })
      });
      
      if (response.ok) {
        const data = await response.json();
        setBackupHealth(data.health);
      }
    } catch (error) {
      console.error('Failed to fetch backup health:', error);
    }
  };

  const updateBackupTimer = async () => {
    if (newInterval < 1 || newInterval > 24) {
      toast({
        title: "Invalid Interval",
        description: "Backup interval must be between 1 and 24 hours",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setLastAction('Updating backup timer...');

    try {
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'update_timer',
          intervalHours: newInterval
        })
      });

      const result = await response.json();

      if (result.success) {
        setLastAction(`Timer updated to ${newInterval} hours`);
        await fetchTimerStatus();
        toast({
          title: "Timer Updated",
          description: `Backup interval set to ${newInterval} hours`,
        });
      } else {
        setLastAction('Timer update failed: ' + result.error);
        toast({
          title: "Update Failed",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      setLastAction('Timer update failed: Network error');
      toast({
        title: "Update Failed",
        description: "Network error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const performImmediateBackup = async () => {
    setIsLoading(true);
    setLastAction('Running immediate backup...');

    try {
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'immediate_backup' })
      });

      const result = await response.json();

      if (result.success) {
        setLastAction('Immediate backup completed successfully');
        await fetchBackupHealth();
        toast({
          title: "Backup Complete",
          description: "Database backup completed successfully",
        });
      } else {
        setLastAction('Backup failed: ' + result.error);
        toast({
          title: "Backup Failed",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      setLastAction('Backup failed: Network error');
      toast({
        title: "Backup Failed",
        description: "Network error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch on initial mount - disable polling temporarily
    fetchTimerStatus();
    fetchBackupHealth();
    
    // Polling disabled until the auto-backup issue is resolved
    // TODO: Re-enable with proper safeguards
    
  }, []); // Remove isLoading dependency to prevent re-runs

  useEffect(() => {
    if (timerStatus) {
      setNewInterval(timerStatus.intervalHours);
    }
  }, [timerStatus]);

  const getStatusBadge = (status?: string) => {
    switch (status) {
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
    <div className="space-y-6">
      {/* Backup Health Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Backup Database Health
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">Status:</span>
            {getStatusBadge(backupHealth?.status)}
          </div>

          {backupHealth?.counts && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border">
                <div className="font-semibold text-2xl text-blue-600 dark:text-blue-400 mb-1">
                  {backupHealth.counts.builds}
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-xs">PC Builds</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border">
                <div className="font-semibold text-2xl text-green-600 dark:text-green-400 mb-1">
                  {backupHealth.counts.orders}
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-xs">Orders</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border">
                <div className="font-semibold text-2xl text-purple-600 dark:text-purple-400 mb-1">
                  {backupHealth.counts.users}
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-xs">Users</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backup Timer Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Backup Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {timerStatus && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Interval:</span>
                <Badge variant="outline">{timerStatus.intervalHours} hours</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant={timerStatus.isRunning ? "default" : "secondary"}>
                  {timerStatus.isRunning ? "Running" : "Stopped"}
                </Badge>
              </div>

              {timerStatus.nextBackup && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Next Backup:</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(timerStatus.nextBackup).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-4 pt-4 border-t">
            <div className="flex-1">
              <Label htmlFor="backup-interval" className="text-sm font-medium">
                Update Interval (hours)
              </Label>
              <Input
                id="backup-interval"
                type="number"
                min="1"
                max="24"
                value={newInterval}
                onChange={(e) => setNewInterval(parseInt(e.target.value) || 1)}
                className="w-20 mt-1"
                data-testid="input-backup-interval"
              />
              <p className="text-xs text-gray-500 mt-1">
                Between 1 and 24 hours
              </p>
            </div>
            
            <Button 
              onClick={updateBackupTimer} 
              disabled={isLoading || newInterval === timerStatus?.intervalHours}
              size="sm"
              data-testid="button-update-timer"
            >
              <Settings className="h-4 w-4 mr-2" />
              Update Timer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Manual Backup Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Manual Backup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Run an immediate backup of all database data to the backup storage.
          </p>
          
          <Button 
            onClick={performImmediateBackup} 
            disabled={isLoading}
            className="w-full"
            data-testid="button-immediate-backup"
          >
            {isLoading ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Running Backup...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Backup Now
              </>
            )}
          </Button>

          {lastAction && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {lastAction.includes('successfully') || lastAction.includes('completed') ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : lastAction.includes('failed') || lastAction.includes('error') ? (
                <AlertCircle className="h-4 w-4 text-red-600" />
              ) : (
                <Clock className="h-4 w-4 text-blue-600 animate-spin" />
              )}
              <span className="text-sm">{lastAction}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}