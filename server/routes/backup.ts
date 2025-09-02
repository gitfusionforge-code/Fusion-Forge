import { Request, Response } from 'express';
import { backupService } from '../services/backup-service';
import { backupScheduler } from '../services/backup-scheduler';

// Admin-only backup routes
export async function handleBackupOperations(req: Request, res: Response) {
  try {
    const { action, intervalHours } = req.body;

    switch (action) {
      case 'full_backup':
        await backupService.performFullBackup();
        res.json({ 
          success: true, 
          message: 'Full backup completed successfully' 
        });
        break;

      case 'health_check':
        const health = await backupScheduler.getBackupStatus();
        res.json({ 
          success: true, 
          health 
        });
        break;

      case 'restore_info':
        await backupService.restoreFromBackup();
        res.json({ 
          success: true, 
          message: 'Backup restoration info logged' 
        });
        break;

      case 'get_timer_status':
        const timerStatus = backupScheduler.getCurrentInterval();
        res.json({
          success: true,
          timer: timerStatus
        });
        break;

      case 'update_timer':
        if (!intervalHours || intervalHours < 1 || intervalHours > 24) {
          return res.status(400).json({
            success: false,
            error: 'Interval must be between 1 and 24 hours'
          });
        }
        const updateResult = backupScheduler.updateBackupInterval(intervalHours);
        res.json(updateResult);
        break;

      case 'immediate_backup':
        const result = await backupScheduler.triggerImmediateBackup();
        res.json(result);
        break;

      case 'execute_restore':
        // This would be a destructive operation - implement with extreme caution
        res.json({
          success: false,
          error: 'Restore execution not implemented for safety. Use database management tools directly.'
        });
        break;

      default:
        res.status(400).json({ 
          success: false, 
          error: 'Invalid backup action' 
        });
    }
  } catch (error) {
    console.error('Backup operation failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Backup operation failed' 
    });
  }
}

// Scheduled backup function (can be called periodically)
export async function performScheduledBackup() {
  try {
    console.log('🔄 Starting scheduled backup...');
    await backupService.performFullBackup();
    console.log('✅ Scheduled backup completed');
  } catch (error) {
    console.error('❌ Scheduled backup failed:', error);
  }
}