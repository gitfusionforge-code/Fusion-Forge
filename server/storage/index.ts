/**
 * Storage Factory Entry Point
 * This is the main entry point for all storage operations
 * Routes should import storage from this file
 */

import { storage } from './storage-factory';

export { storage };
export type { IStorage } from '../firebase-realtime-storage';