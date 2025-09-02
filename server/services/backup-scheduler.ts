import { backupService } from './backup-service';

export class BackupScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private currentInterval: number = 6 * 60 * 60 * 1000; // Default: 6 hours
  
  // Start automatic backups with configurable interval
  startScheduledBackups(intervalHours?: number) {
    if (this.intervalId) {
      console.log('⚠️ Backup scheduler already running');
      return;
    }

    // Skip initial backup check - only run scheduled backups
    // Use provided interval or default to 6 hours
    if (intervalHours) {
      this.currentInterval = intervalHours * 60 * 60 * 1000;
    }
    const backupInterval = this.currentInterval;
    
    this.intervalId = setInterval(async () => {
      try {
        console.log('🔄 Running scheduled backup...');
        await backupService.performFullBackup();
        console.log('✅ Scheduled backup completed successfully');
      } catch (error) {
        console.error('❌ Scheduled backup failed:', error);
      }
    }, backupInterval);
    
    const hours = intervalHours || 6;
    console.log(`✅ Backup scheduler started - backups will run every ${hours} hours`);
  }
  
  // Update backup interval and restart scheduler
  updateBackupInterval(intervalHours: number) {
    if (intervalHours < 1 || intervalHours > 24) {
      throw new Error('Backup interval must be between 1 and 24 hours');
    }
    
    // Stop current scheduler
    this.stopScheduledBackups();
    
    // Start with new interval
    this.startScheduledBackups(intervalHours);
    
    console.log(`✅ Backup interval updated to ${intervalHours} hours`);
    return { success: true, intervalHours, message: `Backup interval updated to ${intervalHours} hours` };
  }
  
  // Get current backup interval in hours
  getCurrentInterval() {
    return {
      intervalHours: this.currentInterval / (60 * 60 * 1000),
      isRunning: this.intervalId !== null,
      nextBackup: this.intervalId ? new Date(Date.now() + this.currentInterval).toISOString() : null
    };
  }
  
  // Stop automatic backups
  stopScheduledBackups() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Backup scheduler stopped');
    }
  }
  
  // Run initial backup and health check
  private async runInitialCheck() {
    try {
      console.log('🔍 Running initial backup health check...');
      const health = await backupService.checkBackupHealth();
      
      if (health.status === 'healthy') {
        console.log('✅ Backup database is healthy');
      } else {
        console.log('⚠️ Backup database may need attention, running initial backup...');
        await backupService.performFullBackup();
      }
    } catch (error) {
      console.error('❌ Initial backup check failed:', error);
    }
  }
  
  // Manual trigger for immediate backup
  async triggerImmediateBackup() {
    try {
      console.log('🔄 Manual backup triggered...');
      await backupService.performFullBackup();
      console.log('✅ Manual backup completed');
      return { success: true, message: 'Backup completed successfully' };
    } catch (error) {
      console.error('❌ Manual backup failed:', error);
      return { success: false, error: 'Backup failed' };
    }
  }
  
  // Get backup status
  async getBackupStatus() {
    try {
      const health = await backupService.checkBackupHealth();
      return {
        ...health,
        schedulerRunning: this.intervalId !== null,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        schedulerRunning: this.intervalId !== null,
        lastCheck: new Date().toISOString()
      };
    }
  }
}

export const backupScheduler = new BackupScheduler();