# MediaHub - Multi-Platform Media Downloader

## Overview

MediaHub is a web-based media downloader application that allows users to download content from popular social media platforms including YouTube, Instagram, and Twitter/X. The platform implements a freemium model where basic downloads are free, while premium quality downloads require viewing advertisements. The application integrates a charitable component where premium downloads contribute to fundraising efforts.

The application is built as a full-stack TypeScript project using React for the frontend and Express.js for the backend, with a focus on creating a socially responsible media downloading service that combines utility with social impact.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite as the build tool and development server
- **UI Components**: Shadcn/ui component library built on top of Radix UI primitives for accessibility and consistency
- **Styling**: Tailwind CSS with CSS custom properties for theming, supporting both light and dark modes
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

### Backend Architecture
- **Runtime**: Node.js with Express.js web framework
- **Language**: TypeScript with ES modules
- **Database Layer**: Drizzle ORM with PostgreSQL dialect, configured for Neon database
- **Session Management**: Connect-pg-simple for PostgreSQL-backed sessions
- **Data Validation**: Zod schemas shared between frontend and backend for consistent validation
- **Development**: tsx for TypeScript execution in development, esbuild for production builds

### Database Design
The application uses PostgreSQL with two main entities:
- **Downloads Table**: Stores download requests with metadata including URL, platform, quality level, processing status, and completion details
- **Charity Stats Table**: Tracks monthly charitable contributions, premium download counts, and beneficiary impact metrics

### API Structure
RESTful API design with the following endpoints:
- `POST /api/downloads` - Create new download requests
- `GET /api/downloads/:id` - Retrieve download status and details
- `GET /api/charity/stats` - Fetch current month's charitable impact statistics

### Media Processing Pipeline
The system supports multiple platforms (YouTube, Instagram, Twitter/X) with different quality tiers:
- **Free Tier**: Basic quality downloads (480p video, 128kbps audio) with no advertisements
- **Premium Tier**: High quality downloads (720p/1080p video, 320kbps audio) requiring 30-second advertisement viewing

### Component Architecture
The frontend follows a modular component structure:
- **Layout Components**: Header with navigation, footer with links, and responsive design
- **Feature Components**: Download interface with URL validation, progress tracking, and charity impact display
- **UI Components**: Reusable Shadcn/ui components with consistent theming and accessibility
- **Page Components**: Route-based pages using wouter for navigation

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL database with connection pooling
- **Drizzle Kit**: Database migration and schema management tools

### UI and Styling
- **Radix UI**: Headless UI components for accessibility and keyboard navigation
- **Tailwind CSS**: Utility-first CSS framework with custom theming
- **Shadcn/ui**: Pre-built component library with consistent design system
- **Lucide React**: Icon library for UI elements

### Development Tools
- **Vite**: Fast build tool with HMR and optimized production builds
- **TypeScript**: Type safety across the entire application stack
- **ESBuild**: Fast JavaScript bundler for server-side code
- **Replit Plugins**: Development tooling for the Replit environment including error overlay and dev banner

### Media Processing
- **URL Validation**: Custom validation logic for YouTube, Instagram, and Twitter URLs
- **Platform Detection**: Automatic platform identification from URL patterns
- **Progress Tracking**: Real-time download progress updates with WebSocket potential

### Advertising Integration
- **Placeholder Structure**: Advertisement placement components ready for integration with ad networks
- **Quality Gating**: Advertisement requirement system for premium downloads
- **Charity Tracking**: Automatic contribution calculation based on premium download volume

### Session and Security
- **Session Management**: PostgreSQL-backed sessions for user state persistence
- **CORS Configuration**: Cross-origin resource sharing setup for API access
- **Environment Configuration**: Secure environment variable management for database connections