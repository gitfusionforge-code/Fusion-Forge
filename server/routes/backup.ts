import { Request, Response } from 'express';
import { backupService } from '../services/backup-service';

// Admin-only backup routes
export async function handleBackupOperations(req: Request, res: Response) {
  try {
    const { action } = req.body;

    switch (action) {
      case 'full_backup':
        await backupService.performFullBackup();
        res.json({ 
          success: true, 
          message: 'Full backup completed successfully' 
        });
        break;

      case 'health_check':
        const health = await backupService.checkBackupHealth();
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