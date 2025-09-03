# FusionForge PCs - Custom PC Building Platform

## Project Overview
A professional PC building platform that empowers students and tech enthusiasts to create custom computer configurations with advanced pricing, order tracking, and personalized user experience features.

## Stack
- **Frontend**: React.js with TypeScript, Tailwind CSS, Wouter routing
- **Backend**: Node.js with Express, TypeScript
- **Database**: Firebase Realtime Database
- **Authentication**: Firebase Authentication
- **Email Service**: NodeMailer with Brevo SMTP
- **Payment Gateway**: Razorpay integration
- **UI Components**: Radix UI primitives, custom component library

## Recent Changes

### September 3, 2025 - Complete PostgreSQL Removal & Deployment Fix
✓ Removed complete NeonDB backup system and secondary database functionality
✓ Cleaned up all backup-related service files (backup-service.ts, backup-scheduler.ts, db.ts)
✓ Removed backup routes and backup management components from admin panel
✓ Simplified storage architecture to use Firebase Realtime Database exclusively
✓ Eliminated backup scheduling system and related PostgreSQL dependencies
✓ Updated admin interface to remove backup management tabs and components
✓ **Fixed deployment failure by removing all PostgreSQL/NeonDB dependencies**
✓ **Converted business settings service to static configuration (no DATABASE_URL required)**
✓ **Removed remaining database files: drizzle-schema.ts, business-settings-service.ts**
✓ Application now runs with streamlined Firebase-only architecture and deploys successfully

### July 28, 2025 - Critical Bug Fixes & Complete Project Cleanup
✓ Fixed import/export error with EnhancedErrorBoundary component
✓ Resolved authentication context issues and error handling
✓ Verified all asset imports are correctly configured
✓ Removed all unwanted documentation and deployment files (15+ .md files)
✓ Cleaned up attached_assets folder (removed 50+ unnecessary images and text files)
✓ Eliminated duplicate logos and temporary files
✓ Removed build cache directories and temporary files
✓ Updated .gitignore to prevent future unwanted file accumulation
✓ Application now running without runtime errors

**Final Project Structure (Clean & Production-Ready):**
- Core application: 1.2MB (client + server + shared)
- Essential assets: 2.9MB (2 logo files only)
- Dependencies: 693MB (node_modules - standard)
- Total project size reduced by ~60MB through cleanup

### Previous Fixes
✓ Implemented lazy loading for all pages (fixed severe performance issues)
✓ Fixed Firebase ID generation vulnerability
✓ Enhanced error boundary implementation
✓ Resolved duplicate error handling layers
✓ Fixed authentication race conditions

## Project Architecture

### Core Features
- **PC Build Configurator**: Custom PC building with real-time pricing
- **Shopping Cart**: Advanced cart management with persistent storage
- **User Authentication**: Firebase-based auth with profile management
- **Order Tracking**: Comprehensive order management system
- **Admin Panel**: Complete administrative interface for PC build management
- **Payment Processing**: Secure Razorpay integration
- **Email Notifications**: Professional receipt generation and order confirmations
- **Performance Monitoring**: Core Web Vitals tracking

### Key Components
- `AuthContext`: Firebase authentication management
- `EnhancedErrorBoundary`: Comprehensive error handling and reporting
- `PerformanceMonitor`: Core Web Vitals tracking
- `SEOHead`: Enhanced SEO meta tag management
- Admin panel with inventory and order management

### Database Schema (Firebase Realtime Database)
- `pcBuilds`: PC configurations with components and pricing
- `components`: Individual PC components with stock tracking
- `orders`: Order management with status tracking
- `userProfiles`: User account information and preferences
- `inquiries`: Customer support and custom build requests

## User Preferences
- Clean, professional codebase without unnecessary files
- Focus on performance optimization
- Comprehensive error handling and monitoring

## Current Status
The application is production-ready with a streamlined architecture using Firebase Realtime Database exclusively. All critical bugs have been fixed and the backup system complexity has been removed. The codebase has been cleaned of unnecessary documentation files, deployment guides, and temporary assets. All features are functioning correctly including authentication, PC building, cart management, and payment processing.

## Assets
- Main logo: `attached_assets/Fusion Forge Logo bgremoved_1750750872227.png`
- Alternative logo: `attached_assets/Fusion Forge Logo_1750928679404.png`