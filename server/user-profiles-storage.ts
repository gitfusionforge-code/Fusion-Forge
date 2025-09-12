import { promises as fs } from 'fs';
import path from 'path';
import type { UserProfile, InsertUserProfile } from '../shared/schema';

const DATA_DIR = path.join(process.cwd(), 'data');
const USER_PROFILES_FILE = path.join(DATA_DIR, 'user-profiles.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Load user profiles from local JSON file
async function loadUserProfiles(): Promise<Record<string, UserProfile>> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(USER_PROFILES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist or is invalid, return empty object
    return {};
  }
}

// Save user profiles to local JSON file
async function saveUserProfiles(profiles: Record<string, UserProfile>): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(USER_PROFILES_FILE, JSON.stringify(profiles, null, 2));
}

export async function createUserProfileLocal(profile: InsertUserProfile): Promise<UserProfile> {
  console.log('📝 Creating user profile locally for UID:', profile.uid);
  
  const profiles = await loadUserProfiles();
  
  const newProfile: UserProfile = {
    ...profile,
    id: Date.now(),
    displayName: profile.displayName || undefined,
    phone: profile.phone || undefined,
    address: profile.address || undefined,
    city: profile.city || undefined,
    zipCode: profile.zipCode || undefined,
    preferences: profile.preferences || undefined,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  profiles[profile.uid] = newProfile;
  await saveUserProfiles(profiles);
  
  console.log('✅ User profile created locally for:', profile.uid);
  return newProfile;
}

export async function getUserProfileLocal(uid: string): Promise<UserProfile | undefined> {
  const profiles = await loadUserProfiles();
  return profiles[uid];
}

export async function updateUserProfileLocal(uid: string, updates: Partial<InsertUserProfile>): Promise<UserProfile> {
  const profiles = await loadUserProfiles();
  const existingProfile = profiles[uid];
  
  if (!existingProfile) {
    throw new Error('Profile not found');
  }
  
  const updatedProfile: UserProfile = {
    ...existingProfile,
    ...updates,
    updatedAt: new Date()
  };
  
  profiles[uid] = updatedProfile;
  await saveUserProfiles(profiles);
  
  return updatedProfile;
}

export async function getAllUserProfilesLocal(): Promise<UserProfile[]> {
  const profiles = await loadUserProfiles();
  return Object.values(profiles).sort((a, b) => {
    const dateA = new Date(a.createdAt || 0);
    const dateB = new Date(b.createdAt || 0);
    return dateB.getTime() - dateA.getTime();
  });
}