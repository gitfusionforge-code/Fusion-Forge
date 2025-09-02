import { backupService } from './backup-service';

export class BackupScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  
  // Start automatic backups every 6 hours
  startScheduledBackups() {
    if (this.intervalId) {
      console.log('⚠️ Backup scheduler already running');
      return;
    }

    // Run initial backup health check
    this.runInitialCheck();
    
    // Schedule backups every 6 hours (6 * 60 * 60 * 1000 ms)
    const backupInterval = 6 * 60 * 60 * 1000;
    
    this.intervalId = setInterval(async () => {
      try {
        console.log('🔄 Running scheduled backup...');
        await backupService.performFullBackup();
        console.log('✅ Scheduled backup completed successfully');
      } catch (error) {
        console.error('❌ Scheduled backup failed:', error);
      }
    }, backupInterval);
    
    console.log(`✅ Backup scheduler started - backups will run every 6 hours`);
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