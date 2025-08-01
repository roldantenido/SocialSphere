# Replit.md

## Recent Changes
- **January 26, 2025**: Implemented comprehensive database migration system with data preservation
  - Created complete migration utilities in `server/migrations.ts` with backup and safety features
  - Built automatic database initialization system that runs on application startup
  - Added setup scripts for new installations and migration scripts for updates
  - Implemented safe schema update process that preserves existing data during changes
  - Created database setup documentation with Git integration for easy deployment
  - Modified setup wizard to use new migration system for database configuration
  - Added automatic migration generation and execution for seamless database updates
- **January 21, 2025**: Added aapanel integration for simplified VPS deployment
  - Created aapanel-specific deployment script with interactive configuration
  - Built automatic Docker installation and container management for aapanel
  - Added nginx configuration template optimized for aapanel reverse proxy setup
  - Created comprehensive aapanel deployment guide with web panel integration
  - Integrated aapanel installer into the deployment wizard interface
  - Implemented automatic SSL management through aapanel's certificate system
- **January 20, 2025**: Added cloud Docker image automation with GitHub Actions integration
  - Created GitHub Actions workflows for automatic Docker image building and pushing
  - Built support for GitHub Container Registry (ghcr.io) and Docker Hub deployment
  - Added cloud deployment scripts with image pulling from registries
  - Created comprehensive cloud deployment guide with multiple deployment options
  - Integrated cloud Docker setup into the deployment wizard interface
  - Implemented multi-platform builds (AMD64, ARM64) with build caching optimization
- **January 20, 2025**: Created comprehensive Docker deployment package for VPS hosting
  - Built complete Docker infrastructure with Dockerfile, docker-compose.yml, and nginx configuration
  - Created automated deployment scripts (build-image.sh, import-and-deploy.sh, deploy.sh)
  - Implemented production-ready setup with PostgreSQL, SSL support, and security headers
  - Added comprehensive deployment guides (DEPLOYMENT.md, IMAGE-DEPLOYMENT.md, DOCKER-EXPORT-GUIDE.md)
  - Configured proper file upload handling and server payload limits (50MB) for Docker environment
  - Included health checks, auto-restart policies, and database backup procedures
- **January 20, 2025**: Enhanced media posting with file browsing and improved photo/video functionality
  - Replaced URL input with native file browsing for photo and video uploads
  - Added separate Photo, Video, and Reels upload buttons with file selection dialogs
  - Implemented file size validation (5MB images, 25MB videos, 15MB reels optimized for base64)
  - Added video duration check for Reels (max 60 seconds)
  - Enhanced media preview with file name, size display, and remove functionality
  - Fixed photo display issues by implementing base64 conversion for file storage
  - Added error handling and fallback displays for media that fails to load
  - Maintained complete dark mode support for all new UI elements
- **January 20, 2025**: Previously implemented comprehensive dark mode support and profile interaction features
  - Added complete dark mode support throughout the entire application with ThemeProvider component
  - Created theme toggle functionality in navbar with sun/moon icon switching
  - Updated all pages and components with proper dark mode styling and backgrounds
  - Enhanced profile viewing and interaction capabilities:
    - Added chat functionality for friends directly from profile pages
    - Implemented friend request system with proper status tracking (friends, pending, not connected)
    - Updated discover page with enhanced user cards including view profile and connect actions
    - Enhanced friend cards with view profile and message buttons
    - Added fixed-position chat window with dark mode support
    - Integrated real-time chat with message polling and proper UI feedback

## Overview

This is a full-stack social media application built with React, Express, and PostgreSQL. The app follows a typical social media structure with user authentication, posts, comments, likes, friendships, and real-time chat functionality. It uses a modern tech stack with TypeScript throughout, shadcn/ui components for the frontend, and Drizzle ORM for database management. The application features complete dark mode support with system preference detection and smooth theme transitions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state
- **UI Components**: shadcn/ui (Radix UI primitives with Tailwind CSS)
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite with React plugin

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful endpoints under `/api/*`
- **Session Management**: Simple in-memory session storage with Bearer tokens
- **Database**: PostgreSQL with Drizzle ORM
- **Build Tool**: esbuild for production builds

### Project Structure
```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Route components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and configs
├── server/                # Express backend
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Database interface
│   └── vite.ts           # Development server setup
├── shared/                # Shared types and schemas
│   └── schema.ts          # Database schema and Zod validation
└── migrations/            # Database migration files
```

## Key Components

### Authentication System
- **Implementation**: Session-based authentication with in-memory storage
- **Security**: Bearer token authorization headers
- **Validation**: Zod schemas for login and registration
- **Frontend Storage**: localStorage for session persistence

### Database Schema
The application uses a PostgreSQL database with the following main entities:
- **Users**: Profile information, credentials, metadata
- **Posts**: User-generated content with engagement metrics
- **Comments**: Threaded discussions on posts
- **Likes**: User engagement tracking
- **Friendships**: Social connections with status management
- **Chat Messages**: Direct messaging between users

### API Design
- **Pattern**: RESTful APIs with consistent error handling
- **Authentication**: Required for most endpoints via middleware
- **Response Format**: JSON with standardized error messages
- **Validation**: Zod schemas for request/response validation

### UI Component System
- **Base**: shadcn/ui components built on Radix UI primitives
- **Theming**: Complete dark/light mode implementation with CSS variables and automatic system preference detection
- **Theme Toggle**: Integrated theme switcher in navbar with sun/moon icons and smooth transitions
- **Dark Mode Coverage**: Full application dark mode support across all pages and components
- **Responsiveness**: Mobile-first design with Tailwind breakpoints
- **Accessibility**: ARIA-compliant components from Radix UI

## Data Flow

### User Authentication Flow
1. User submits login/registration form
2. Frontend validates with Zod schemas
3. Backend authenticates and creates session
4. Session ID stored in localStorage
5. All subsequent requests include Bearer token
6. Middleware validates session on protected routes

### Post Creation and Display
1. User creates post via CreatePost component
2. Content validated and sent to `/api/posts`
3. Database stores post with user association
4. TanStack Query invalidates and refetches posts
5. PostCard components render updated feed

### Real-time Features
- **Chat**: Polling-based message updates (3-second intervals) with fixed-position chat window
- **Profile Interaction**: View any user profile and initiate chat (any user) or send friend requests
- **Universal Messaging**: Users can now message anyone, not restricted to friends only
- **Feed Updates**: Manual refresh via TanStack Query
- **Friendship Status**: Real-time updates on accept/decline with proper status tracking
- **User Discovery**: Enhanced search and discovery with connect/view profile actions

## External Dependencies

### Database
- **Provider**: Neon Database (PostgreSQL)
- **ORM**: Drizzle with PostgreSQL dialect
- **Connection**: `@neondatabase/serverless` driver
- **Migrations**: Drizzle Kit for schema management

### UI Libraries
- **Component Library**: Radix UI primitives
- **Styling**: Tailwind CSS with PostCSS
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod resolvers
- **Date Handling**: date-fns for formatting

### Development Tools
- **Type Checking**: TypeScript with strict mode
- **Build**: Vite for frontend, esbuild for backend
- **Linting**: Built-in TypeScript checking
- **Development**: Hot reload with Vite middleware

## Deployment Strategy

### Production Build
- **Frontend**: Vite builds to `dist/public`
- **Backend**: esbuild bundles to `dist/index.js`
- **Assets**: Static files served by Express in production
- **Environment**: NODE_ENV determines build/dev behavior

### Database Setup
- **Schema**: Defined in `shared/schema.ts`
- **Migrations**: Generated in `./migrations` directory
- **Deployment**: `npm run db:push` applies schema changes
- **Connection**: Environment variable `DATABASE_URL` required

### Server Configuration
- **Development**: tsx with hot reload and Vite middleware
- **Production**: Node.js serving bundled application
- **Static Files**: Express serves built frontend assets
- **API Routes**: All backend routes prefixed with `/api`

### Environment Requirements
- **Node.js**: ES modules support required
- **Database**: PostgreSQL compatible (Neon)
- **Environment Variables**: `DATABASE_URL` for database connection
- **Port**: Configurable, defaults to system assignment