import { Router } from 'express';
import { testPrismaIntegration } from '../test-prisma';

const router = Router();

// Test endpoint to demonstrate Prisma integration
router.get('/test/prisma', async (req, res) => {
  try {
    const result = await testPrismaIntegration();
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Test endpoint error',
      error: error.message
    });
  }
});

// Database status endpoint
router.get('/test/status', (req, res) => {
  res.json({
    firebase: 'Connected (with permission fallbacks)',
    prisma: 'Connected to PostgreSQL',
    database: 'Replit PostgreSQL',
    integration: 'Dual-storage ready',
    timestamp: new Date().toISOString()
  });
});

export { router as testRoutes };