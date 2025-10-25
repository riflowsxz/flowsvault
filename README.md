# Flowsvault - Professional File Upload Service

Flowsvault is a professional file upload service with enterprise-level security. The platform provides secure file storage with automatic expiration dates for your file management needs.

## 📋 Table of Contents

- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Security](#security)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Maintenance](#maintenance)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Secure File Uploads**: Enterprise-grade security with comprehensive validation
- **Dual Authentication System**:
  - OAuth (Google and GitHub) via NextAuth.js
  - API Key authentication for programmatic access
- **Advanced Upload Queue**:
  - Upload multiple files with concurrent processing (3 parallel uploads)
  - Drag & drop support
  - Per-file pause, resume, and cancel controls
  - Automatic retry with exponential backoff (up to 3 attempts)
  - Real-time progress tracking with aggregate progress and ETA
- **File Preview**: Preview images, PDFs, videos, and audio files in browser
- **File Management**:
  - Upload, download, and delete files with one click
  - Search and filter files by name and status
  - Copy shareable download links
  - View file details (size, type, upload date, expiration)
- **Client-Side Validation**: Type checking against allowlist before upload
- **File Expiration**: Set automatic expiration dates (1h, 6h, 12h, 24h, 3d, 7d, or unlimited)
- **Streaming Uploads**: Handle large files efficiently without loading into memory
- **Secure File Access**: User-scoped file access with ownership verification
- **Rate Limiting**: Distributed rate limiting via Upstash Redis with automatic in-memory fallback
  - Upload endpoint: 50 requests per 5 minutes per IP
  - API endpoints: 200 requests per minute per IP
- **Modern UI**: Clean, responsive interface built with Radix UI and Tailwind CSS
- **Database-Backed Storage**: PostgreSQL with Drizzle ORM for reliable file metadata
- **Cloud Storage**: Cloudflare R2 (S3-compatible) for scalable file storage
- **Automated Cleanup**: Scheduled removal of expired files from both database and storage
- **Internationalization**: Multi-language support (English, Indonesian, and more)
- **API Documentation**: Interactive API documentation with code examples

## Architecture Overview

Flowsvault is built on a modern, scalable architecture leveraging Next.js 15's App Router for both frontend and backend.

> **📚 For detailed architecture documentation, see [ARCHITECTURE.md](ARCHITECTURE.md)**

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  Browser   │  │  API Client  │  │  Mobile/Desktop  │   │
│  │   (Web)    │  │  (cURL/SDK)  │  │      Apps        │   │
│  └─────┬──────┘  └──────┬───────┘  └────────┬─────────┘   │
└────────┼─────────────────┼─────────────────────┼────────────┘
         │                 │                     │
         └─────────────────┼─────────────────────┘
                           │
         ┌─────────────────▼──────────────────────┐
         │         Next.js 15 Middleware           │
         │  ┌───────────────────────────────────┐ │
         │  │  Rate Limiting (Upstash Redis)    │ │
         │  │  Authentication Check             │ │
         │  │  IP-based & User-based Limits     │ │
         │  └───────────────────────────────────┘ │
         └─────────────────┬──────────────────────┘
                           │
         ┌─────────────────▼──────────────────────┐
         │       Next.js App Router API Routes     │
         │  ┌─────────────────────────────────┐   │
         │  │ /api/upload     - File Upload    │   │
         │  │ /api/files      - List Files     │   │
         │  │ /api/files/[id] - File Operations│   │
         │  │ /api/download   - Download File  │   │
         │  │ /api/preview    - Preview File   │   │
         │  │ /api/keys       - API Key Mgmt   │   │
         │  │ /api/auth       - Authentication │   │
         │  └─────────────────────────────────┘   │
         └────────────┬──────────────┬─────────────┘
                      │              │
         ┌────────────▼─────┐   ┌────▼─────────────┐
         │   PostgreSQL      │   │  Cloudflare R2   │
         │  ┌─────────────┐ │   │   (S3-compat)    │
         │  │ users       │ │   │  ┌────────────┐  │
         │  │ file_metadata│ │   │  │ File Blobs │  │
         │  │ api_keys    │ │   │  │ with Tags  │  │
         │  │ file_shares │ │   │  └────────────┘  │
         │  │ upload_sess │ │   └──────────────────┘
         │  └─────────────┘ │
         └──────────────────┘
```

### Key Components

#### 1. **Frontend Layer** (`/app`, `/components`)
- **Next.js 15 App Router**: Server-side rendering with React Server Components
- **FileUploader Component**: Advanced queue system with:
  - Concurrent uploads (3 parallel)
  - Pause/Resume/Retry functionality
  - Real-time progress tracking with ETA
  - Automatic retry with exponential backoff (up to 3 attempts)
- **FileList Component**: File management interface with search/filter
- **API Keys Modal**: User-friendly API key generation and management
- **Responsive UI**: Radix UI primitives with Tailwind CSS
- **Theme Support**: Light/Dark mode with next-themes
- **i18n Support**: Multi-language interface

#### 2. **API Layer** (`/app/api`)
All API routes follow RESTful conventions with consistent JSON responses:

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/upload` | POST | Upload files with streaming | Session/API Key |
| `/api/files` | GET | List user's files (paginated) | Session/API Key |
| `/api/files/[id]` | GET | Get file metadata | Session/API Key |
| `/api/files/[id]` | DELETE | Delete file | Session/API Key |
| `/api/download/[id]` | GET | Download file | Session/API Key |
| `/api/preview/[id]` | GET | Preview file (images, PDFs) | Session/API Key |
| `/api/keys` | GET/POST | Manage API keys | Session Only |
| `/api/keys/[id]` | DELETE | Revoke API key | Session Only |
| `/api/admin/cleanup` | POST | Clean expired files | Admin Key |
| `/api/auth/[...nextauth]` | * | NextAuth.js routes | Public |

#### 3. **Authentication System** (`/lib/auth.ts`, `/lib/auth-helper.ts`, `/lib/api-key.ts`)
Dual authentication strategy:
- **Session-based**: NextAuth.js with Google/GitHub OAuth
  - Secure session management with JWT
  - User profile with avatar support
  - Session validation in middleware
- **API Key-based**: Programmatic access for integrations
  - Cryptographically secure key generation (32 bytes)
  - bcrypt hashing for storage
  - Prefix-based key identification (fv_xxx)
  - Per-key usage tracking

#### 4. **Storage Layer**
- **Cloudflare R2** (`/lib/r2-storage.ts`):
  - S3-compatible object storage
  - Streaming uploads for memory efficiency
  - Metadata tagging (originalName, uploadedAt, expiresAt, userId, duration)
  - Lifecycle management for expired files
- **PostgreSQL** (`/lib/db/schema.ts`):
  - File metadata and relationships
  - User accounts and profiles
  - API keys with hashing
  - Upload sessions and file shares
  - Indexed for fast queries

#### 5. **Rate Limiting** (`/lib/rate-limit.ts`, `middleware.ts`)
Multi-layer protection with Upstash Redis:
- **Upload Endpoints**: 50 requests per 5 minutes per IP
- **API Endpoints**: 200 requests per minute per IP
- **Per-User Limits**: Separate limits for authenticated users
- **Automatic Fallback**: In-memory rate limiting when Redis unavailable
- **Sliding Window**: Accurate rate limiting algorithm

#### 6. **File Processing Pipeline**
```
Upload Request → Validation → Streaming to R2 → DB Record → Response
     │              │              │                │           │
     ├─ Size check  ├─ Extension  ├─ Chunks       ├─ Metadata │
     ├─ Auth check  ├─ MIME type  ├─ Progress     ├─ User ID  │
     └─ Rate limit  └─ Filename   └─ Tagging      └─ Duration └─ Download URL
```

#### 7. **Scheduled Tasks**
- **Cleanup Cron** (configured in `vercel.json`):
  - Runs daily at 2:00 AM UTC
  - Removes expired files from R2 and PostgreSQL
  - Soft-delete pattern for data integrity
  - Admin API key protection

## Tech Stack

### Frontend
- **Framework**: Next.js 15 with TypeScript and Turbopack
- **UI Components**: Radix UI primitives
- **Styling**: Tailwind CSS 4 with custom theme
- **Icons**: Lucide React and React Icons
- **Notifications**: Sonner toast library
- **State Management**: React hooks with NextAuth session

### Backend
- **Framework**: Next.js 15 App Router with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js v4 with Google and GitHub OAuth providers
- **Storage**: Cloudflare R2 (S3-compatible) via AWS SDK v3
- **Rate Limiting**: Upstash Redis with in-memory fallback
- **Validation**: Zod v4 for request/response validation
- **File Processing**: Node.js streams for memory-efficient uploads

## Project Structure

```
flowsvault/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── admin/
│   │   │   └── cleanup/          # Expired files cleanup endpoint
│   │   │       └── route.ts
│   │   ├── auth/
│   │   │   └── [...nextauth]/    # NextAuth.js configuration
│   │   │       └── route.ts
│   │   ├── download/
│   │   │   └── [id]/             # File download endpoint
│   │   │       └── route.ts
│   │   ├── files/
│   │   │   ├── route.ts          # List files (GET)
│   │   │   └── [id]/             # Get/Delete file by ID
│   │   │       └── route.ts
│   │   ├── keys/
│   │   │   ├── route.ts          # API key management (GET/POST)
│   │   │   └── [id]/             # Delete API key
│   │   │       └── route.ts
│   │   ├── preview/
│   │   │   └── [id]/             # File preview (images, PDFs)
│   │   │       └── route.ts
│   │   ├── profile/
│   │   │   ├── delete/           # Delete user profile
│   │   │   │   └── route.ts
│   │   │   └── picture/          # Upload profile picture
│   │   │       └── route.ts
│   │   └── upload/
│   │       └── route.ts          # File upload with streaming
│   ├── docs/
│   │   └── page.tsx              # API documentation page
│   ├── favicon.ico
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout with providers
│   ├── not-found.tsx             # 404 page
│   ├── page.tsx                  # Home page
│   ├── robots.ts                 # SEO robots configuration
│   └── sitemap.ts                # SEO sitemap generation
│
├── components/                   # React Components
│   ├── ui/                       # Radix UI components
│   │   ├── alert-dialog.tsx
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── progress.tsx
│   │   ├── scroll-area.tsx
│   │   ├── select.tsx
│   │   ├── sheet.tsx
│   │   ├── switch.tsx
│   │   └── tabs.tsx
│   ├── ApiKeysModal.tsx          # API key generation & management UI
│   ├── AppHeader.tsx             # Application header with navigation
│   ├── CodeBlock.tsx             # Syntax-highlighted code blocks
│   ├── error-boundary.tsx        # Error boundary wrapper
│   ├── FileList.tsx              # File management table with actions
│   ├── FileUploader.tsx          # Advanced upload queue component
│   ├── language-switcher.tsx    # Language selection dropdown
│   ├── login-modal.tsx           # OAuth login modal
│   ├── session-provider.tsx      # NextAuth session wrapper
│   ├── theme-provider.tsx        # Theme context provider
│   └── user-menu.tsx             # User dropdown menu
│
├── lib/                          # Utility Libraries
│   ├── db/                       # Database Layer
│   │   ├── migrations/           # Drizzle ORM migrations
│   │   ├── connection.ts         # PostgreSQL connection pool
│   │   ├── indexes.ts            # Database indexes
│   │   ├── index.ts              # Database exports
│   │   ├── migrate.ts            # Migration runner
│   │   ├── schema.ts             # Database schema (users, files, keys, etc.)
│   │   └── utils.ts              # Database utility functions
│   ├── i18n/                     # Internationalization
│   │   ├── context.tsx           # Language context provider
│   │   └── translations.ts       # Translation strings (EN, ID, etc.)
│   ├── api-key.ts                # API key generation & validation
│   ├── auth-helper.ts            # Authentication helpers (session + API key)
│   ├── auth.ts                   # NextAuth.js configuration
│   ├── config.ts                 # App configuration & constants
│   ├── env.ts                    # Environment variables validation
│   ├── file-manager.ts           # File operations utilities
│   ├── image-upload.ts           # Image processing utilities
│   ├── platform.ts               # Platform detection (Vercel/VPS)
│   ├── r2-storage.ts             # Cloudflare R2 integration
│   ├── rate-limit.ts             # Rate limiting with Upstash Redis
│   ├── site-config.ts            # Site metadata configuration
│   ├── upload-client.ts          # Client-side upload logic
│   ├── upload-durations.ts       # File expiration durations
│   ├── utils.ts                  # General utility functions
│   └── validators.ts             # Zod schemas for validation
│
├── public/                       # Static Assets
│   ├── android-chrome-192x192.png
│   ├── android-chrome-512x512.png
│   ├── apple-touch-icon.png
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   └── site.webmanifest
│
├── scripts/                      # Maintenance Scripts
│   ├── cleanup-expired.ts        # Manual cleanup script
│   └── test-rate-limit.ts        # Rate limit testing
│
├── types/                        # TypeScript Type Definitions
│   └── next-auth.d.ts            # NextAuth types extension
│
├── vendor/                       # Vendored Dependencies
│   └── @esbuild-kit/             # ESBuild utilities
│
├── .env                          # Environment variables (dev)
├── .env.example                  # Environment variables template
├── .env.production               # Environment variables (prod)
├── .gitignore                    # Git ignore rules
├── components.json               # Shadcn/UI configuration
├── drizzle.config.ts             # Drizzle ORM configuration
├── ecosystem.config.js           # PM2 process manager config
├── eslint.config.mjs             # ESLint configuration
├── fix-upload-size.sh            # Upload size fix script
├── LICENSE.md                    # MIT License
├── middleware.ts                 # Next.js middleware (auth & rate limiting)
├── next.config.ts                # Next.js configuration
├── next-env.d.ts                 # Next.js TypeScript definitions
├── package.json                  # NPM dependencies & scripts
├── package-lock.json             # NPM lock file
├── postcss.config.mjs            # PostCSS configuration
├── RATE_LIMITING_ENHANCEMENT.md  # Rate limiting documentation
├── README.md                     # This file
├── server.js                     # Custom Next.js server (for PM2)
├── tailwind.config.js            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
└── vercel.json                   # Vercel deployment config (cron jobs)
```

### Key Directories Explained

#### `/app` - Application Routes
- **Next.js 15 App Router** with server components
- **API Routes**: All backend endpoints organized by function
- **Pages**: Server-rendered React pages with SEO optimization

#### `/components` - Reusable UI Components
- **FileUploader**: Core upload functionality with:
  - Drag & drop support
  - Multi-file queue with 3 concurrent uploads
  - Pause/Resume/Retry per file
  - Real-time progress with ETA calculation
  - Automatic retry with exponential backoff
- **FileList**: Complete file management with:
  - Search and filter functionality
  - Pagination
  - Download, preview, and delete actions
  - File sharing links
- **ApiKeysModal**: API key management with secure generation

#### `/lib` - Business Logic & Utilities
- **Database Layer** (`db/`): Drizzle ORM with PostgreSQL
  - Schema definitions for all tables
  - Migration management
  - Database utility functions
- **Authentication** (`auth*.ts`, `api-key.ts`): Dual auth system
- **Storage** (`r2-storage.ts`): Cloudflare R2 integration
- **Rate Limiting** (`rate-limit.ts`): Upstash Redis with fallback
- **Upload Client** (`upload-client.ts`): Client-side upload logic
- **i18n** (`i18n/`): Multi-language support

#### `/scripts` - Maintenance Tools
- Automated cleanup of expired files
- Rate limit testing utilities
- Database migration helpers

## Security

- **Authentication**: OAuth with Google and GitHub
- **Rate Limiting**: Distributed limits via Upstash Redis with automatic in-memory fallback when Redis is unavailable (50 requests per 5 minutes per IP for uploads, 200 requests per minute for API endpoints)
- **File Access Control**: Users can only access their own files
- **XSS Protection**: Content Security Policy headers
- **Secure Headers**: Multiple security headers for enhanced security
- **File Validation**: MIME type and extension validation
- **SQL Injection Prevention**: Parameterized queries with Drizzle ORM
- **API Key Security**: bcrypt hashing with cryptographically secure generation
- **CORS & CSP**: Proper Cross-Origin Resource Sharing and Content Security Policy

> **🔒 For detailed security measures, see [ARCHITECTURE.md#security-measures](ARCHITECTURE.md#security-measures)**

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Cloudflare R2 account (or compatible S3 storage)
- Google and/or GitHub OAuth credentials

## Setup

### 1. Clone the Repository

```bash
git clone https://github.com/riflowsxz/flowsvault.git
cd flowsvault
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file (for development) or `.env.production` file (for production) in the root directory and add the required environment variables. Use the `.env.example` file as a template and fill in the values as needed:

#### Environment Variables Explained:

```bash
# Database - PostgreSQL connection string
POSTGRES_URL=postgresql://username:password@localhost:5432/flowsvault

# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-key-at-least-32-characters-long
NEXTAUTH_URL=http://localhost:3000 

# OAuth Providers (Google & GitHub)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret

# Cloudflare R2 Storage
CLOUDFLARE_R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
CLOUDFLARE_ACCESS_KEY_ID=your-access-key-id
CLOUDFLARE_SECRET_ACCESS_KEY=your-secret-access-key
CLOUDFLARE_R2_BUCKET=your-bucket-name
CLOUDFLARE_R2_PUBLIC_BASE_URL=https://your-public-domain.com

# App Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_GA_ID=your-google-analytics-id
NEXT_PUBLIC_MAX_UPLOAD_SIZE=104857600

# Upload Configuration (Optional)
UPLOAD_MAX_FILE_SIZE=104857600  # Max file size in bytes (100MB)
UPLOAD_DIR=./uploads  # Local upload directory (not used when using R2)
UPLOAD_SECRET_KEY=your-upload-secret-key-at-least-32-characters-long

# Redis Configuration for Rate Limiting (Required for Production)
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Admin API Key for Cleanup Operations (Required for Production)
ADMIN_API_KEY=your-admin-api-key-at-least-32-characters-long
```

#### Setting Up OAuth Providers:

**Google OAuth Setup:**

1. **Create a Google Cloud Project:**
   - Navigate to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Click on "Select a project" in the top navigation bar
   - Click "New Project", enter a project name (e.g., "Flowsvault"), and click "Create"

2. **Enable APIs:**
   - In the left sidebar, click "APIs & Services" > "Library"
   - Search for "Google+ API" (or "People API" for newer projects)
   - Click on the API and then click "Enable"

3. **Create OAuth 2.0 Credentials:**
   - In the left sidebar, click "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Before creating credentials, you'll need to configure the OAuth consent screen
   - Click "Configure consent screen" and select "External" user type
   - Fill in the required information (App name, User support email, Authorized domains)
   - Add your test users if needed, then click "Save and Continue"
   - For testing purposes, add scopes (email, profile, openid) and click "Save and Continue"
   - Review the information and click "Back to Dashboard"

4. **Configure OAuth Application:**
   - Click "Create Credentials" > "OAuth 2.0 Client IDs" again
   - For "Application type", select "Web application"
   - Enter a name for the application (e.g., "Flowsvault Dev")
   - Under "Authorized redirect URIs", add: `http://localhost:3000/api/auth/callback/google`
   - Click "Create"

5. **Copy Credentials:**
   - After creation, you'll see your Client ID and Client Secret
   - Copy these values to your `.env` file as:
     ```
     GOOGLE_CLIENT_ID=your-client-id-here
     GOOGLE_CLIENT_SECRET=your-client-secret-here
     ```

**GitHub OAuth Setup:**

1. **Create a GitHub OAuth Application:**
   - Go to GitHub and navigate to Settings > Developer settings > OAuth Apps
   - Click "New OAuth App"
   - Fill in the application details:
     - Application name: "Flowsvault" (or your preferred name)
     - Homepage URL: `http://localhost:3000`
     - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

2. **Configure Application Settings:**
   - After creating the app, you'll see your Client ID and Client Secret
   - If you don't see the Client Secret, click "Generate a new client secret"
   - Make sure "Enable Device Flow" is checked if you plan to support device authentication

3. **Copy Credentials:**
   - Copy the Client ID and Client Secret to your `.env` file as:
     ```
     GITHUB_ID=your-github-client-id
     GITHUB_SECRET=your-github-client-secret
     ```

4. **Important Security Note:**
   - Never commit your OAuth credentials to version control
   - Keep your `.env` and `.env.production` files in your `.gitignore` to prevent accidental commits
   - If you accidentally commit credentials, regenerate them immediately in the respective dashboards

#### Setting Up Cloudflare R2:

1. **Sign Up for Cloudflare:**
   - Visit [Cloudflare Dashboard](https://dash.cloudflare.com/sign-up) and create an account
   - Verify your email address and complete the initial setup
   - Note that R2 is available to all users, even on the free plan (with generous limits)

2. **Navigate to R2 Storage:**
   - Log in to your Cloudflare Dashboard
   - From the main navigation menu, select "R2" under the "Storage" section
   - If you don't see it in the sidebar, use the search bar to find "R2"

3. **Create a New R2 Bucket:**
   - Click on "Create bucket" button
   - Enter a unique bucket name (e.g., "flowsvault-dev", "flowsvault-prod")
   - Choose the appropriate region for your use case (closer to your users for better performance)
   - Click "Create bucket"
   - Note: Bucket names must be unique globally across all Cloudflare users

4. **Generate R2 Access Keys:**
   - In the left sidebar, click on "R2" then "Manage R2 API Tokens"
   - Click "Create API Token" or "Create Access Key Pair"
   - For development purposes, create an access key pair:
     - Click on your profile icon in the top-right corner
     - Select "My Profile" > "API Tokens" tab
     - Scroll down to "API Keys" section and click "Create API Token"
     - Or, for quick access, go to "Overview" > "R2" > "Manage R2 API Tokens" > "Create Access Key Pair"
   - Enter a descriptive name for your key pair (e.g., "flowsvault-keys")
   - Keep the generated keys secure - you won't be able to retrieve the secret key again

5. **Configure Environment Variables:**
   - After generating your access keys, set the following environment variables in your `.env` file:

   ```bash
   # Cloudflare R2 Storage Configuration
   CLOUDFLARE_R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
   CLOUDFLARE_ACCESS_KEY_ID=your-access-key-id
   CLOUDFLARE_SECRET_ACCESS_KEY=your-secret-access-key
   CLOUDFLARE_R2_BUCKET=your-bucket-name
   CLOUDFLARE_R2_PUBLIC_BASE_URL=https://your-bucket-name.your-account-id.r2.dev  # Optional: Public access URL
   ```

6. **Find Your Account ID:**
   - In your Cloudflare Dashboard, go to any domain in your account
   - Look for "Account ID" in the right sidebar under "Overview"
   - Copy the alphanumeric string (e.g., "f1234567890abcdef1234567890abcdef")

7. **Test Your Configuration:**
   - After setting up the environment variables, you can verify your R2 connection by running the application
   - Make sure your application can upload and retrieve files from R2
   - Check the Cloudflare R2 dashboard to confirm files are being stored there

8. **Security Best Practices:**
   - Never commit your R2 credentials to version control
   - Use separate buckets for development and production environments
   - Regularly rotate your access keys for security
   - Consider using Cloudflare's fine-grained API tokens instead of global API keys for production applications

#### Setting Up Redis with Upstash for Rate Limiting:

1. **Create an Upstash Account:**
   - Visit [Upstash Console](https://console.upstash.com/) and sign up for an account
   - You can use the free tier for development purposes

2. **Create a Redis Database:**
   - In the Upstash console, click "Create Database"
   - Choose your preferred region (closest to your application for better performance)
   - Select "Redis" as the database type
   - Optionally adjust the configuration (max database size, throughput, etc.)
   - Click "Create" to provision your Redis database

3. **Get Your Redis Credentials:**
   - After your database is created, you'll see two values on the database overview page:
     - **REST URL**: This is your `UPSTASH_REDIS_REST_URL`
     - **REST Token**: This is your `UPSTASH_REDIS_REST_TOKEN`

4. **Configure Environment Variables:**
   - Add these values to your `.env` file:
     ```bash
     UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
     UPSTASH_REDIS_REST_TOKEN=your-redis-token
     ```

5. **Distributed Rate Limiting:**
   - The application uses Upstash Redis for distributed rate limiting across multiple server instances
   - Rate limits are applied per IP address with different limits for upload and API endpoints
   - The system implements a sliding window algorithm for more accurate rate limiting

6. **Admin API Key:**
   - Set up an `ADMIN_API_KEY` with at least 32 random characters for secure access to admin operations
   - This key is used to authenticate cleanup operations via the admin API endpoint

7. **Security Considerations:**
   - Keep your Redis credentials secure and never commit them to version control
   - Use strong, randomly generated tokens for the admin API key
   - Monitor your Redis usage to ensure it stays within your plan limits

### 4. Database Setup

Before running the application, you need to set up the PostgreSQL database. Flowsvault uses PostgreSQL with Drizzle ORM for database operations.

#### PostgreSQL Setup Options:

**Using Docker:**
```bash
# Pull and run PostgreSQL container
docker run --name flowsvault-db -p 5432:5432 -e POSTGRES_DB=flowsvault -e POSTGRES_USER=username -e POSTGRES_PASSWORD=password -d postgres:15
```

**Using Managed Services:**
- Supabase, Neon, AWS RDS, or Google Cloud SQL

**Local Installation:**
- Ubuntu/Debian: `sudo apt install postgresql postgresql-contrib`
- macOS: `brew install postgresql`

#### Database Migration:

After PostgreSQL is running and properly configured, you need to set up your database schema:

1. **Generate and Apply Migrations:**
   Run the following commands to generate and apply the database migrations:

   ```bash
   npm run db:generate    # Generate migration files based on your schema
   npm run db:migrate     # Execute migrations to set up your database tables
   ```

2. **Verify Database Setup:**
   - After running the migrations, verify that your tables were created successfully
   - You can use Drizzle Studio to visually inspect your database:
     ```bash
     npm run db:studio      # Opens Drizzle Studio for database inspection
     ```

### 5. Development Server

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Scripts

### Development
- `npm run dev` - Start development server with Turbopack (fast refresh)
- `npm run build` - Build for production with Turbopack
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

### Database Operations
- `npm run db:generate` - Generate Drizzle migration files from schema changes
- `npm run db:migrate` - Apply migrations to database
- `npm run db:studio` - Open Drizzle Studio for visual database inspection
- `npm run db:push` - Push schema changes directly (dev only)
- `npm run db:pull` - Pull schema from existing database
- `npm run db:check` - Check migration consistency
- `npm run db:up` - Apply pending migrations

### Maintenance
- `npm run cleanup:expired` - Manually remove expired files from database and R2 storage
- `npm run test:rate-limit` - Test rate limiting functionality

## Maintenance

### Automated Cleanup of Expired Files

The application includes automated cleanup for expired files with both manual and scheduled options:

#### Manual Cleanup
- Run the cleanup script manually using: `npm run cleanup:expired`
- This queries the database for expired files and removes them from both PostgreSQL and R2 storage
- The script provides detailed logs of processed, deleted, and error counts

#### Scheduled Cleanup
- The application is configured to run cleanup automatically using Vercel's Cron feature
- By default, the cleanup runs daily at 2:00 AM UTC (configured in `vercel.json`)
- The cron job calls the admin API endpoint `/api/admin/cleanup` which requires the `ADMIN_API_KEY`
- The cleanup process:
  1. Queries database for expired files
  2. Deletes files from R2 storage
  3. Soft-deletes records in database
  4. Cleans up expired upload sessions and file shares
- This ensures that expired files are regularly removed without manual intervention

### File Management & Storage Architecture

- **Database-First Design**: All file metadata is stored in PostgreSQL for reliable queries
- **Efficient Queries**: Indexed on `userId` and `expiresAt` for fast lookups
- **Soft Delete Pattern**: Files are marked as deleted rather than hard-deleted for data integrity
- **R2 Integration**: Files stored in Cloudflare R2 with metadata tags (originalName, uploadedAt, expiresAt, userId, duration)
- **Stream Processing**: Large files are streamed directly to R2 without loading into memory
- **User Isolation**: All file operations are scoped to authenticated user for security
- **Automatic Expiration**: Files past their expiration date are automatically filtered from listings and cleaned up by scheduled jobs

## Deployment

> **⚠️ IMPORTANT: File Upload Limitations**
> 
> **This application automatically detects the deployment platform and adjusts upload limits:**
> - **Vercel**: Automatically limited to **4.5MB** (serverless function constraint)
> - **VPS with PM2**: Full **100MB** file upload support (recommended)
> - **Same codebase works on both platforms** - no configuration changes needed!
> 
> See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed explanation and alternative solutions.

### Vercel Deployment (Auto-Limited to 4.5MB Files)
**ℹ️ AUTOMATIC DETECTION**: The application automatically detects Vercel deployment and enforces a **4.5MB limit** due to serverless function constraints. Users will see clear error messages for larger files.

**Deployment Steps:**
1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New Project" and import your repository
4. Add your environment variables in the "Environment Variables" section
5. Click "Deploy" and your application will be live!

**Notes**: 
- Platform detection is automatic - no configuration needed
- Upload limit automatically adjusts to 4.5MB on Vercel
- Vercel cron jobs will automatically handle expired file cleanup
- For full 100MB support, use VPS deployment below (same codebase!)

### VPS Deployment with PM2 (Recommended for 100MB Uploads)

**🎯 RECOMMENDED**: This project is optimized for VPS deployment with PM2 process manager and custom server for full 100MB upload support. The same codebase automatically enables full features when deployed to VPS.

#### Prerequisites
- Node.js 18+ installed on your VPS
- PM2 installed globally: `npm install -g pm2`
- PostgreSQL database accessible from VPS
- Cloudflare R2 configured
- Nginx or Apache for reverse proxy (optional but recommended)

#### Deployment Steps

1. **Clone and Install:**
   ```bash
   git clone https://github.com/riflowsxz/flowsvault.git
   cd flowsvault
   npm install
   ```

2. **Configure Environment:**
   - Copy `.env.example` to `.env.production`
   - Fill in all required environment variables
   ```bash
   cp .env.example .env.production
   nano .env.production
   ```

3. **Run Database Migrations:**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

4. **Build the Application:**
   ```bash
   npm run build
   ```

5. **Start with PM2:**
   ```bash
   # Start in production mode
   pm2 start ecosystem.config.js --env production
   
   # Save PM2 process list for auto-restart
   pm2 save
   
   # Setup PM2 to start on system boot
   pm2 startup
   ```

6. **PM2 Management Commands:**
   ```bash
   # View app status
   pm2 status
   
   # View logs in real-time
   pm2 logs flowsvault
   
   # View only error logs
   pm2 logs flowsvault --err
   
   # Restart application
   pm2 restart flowsvault
   
   # Stop application
   pm2 stop flowsvault
   
   # Delete from PM2
   pm2 delete flowsvault
   
   # Monitor CPU and memory usage
   pm2 monit
   
   # Zero-downtime reload
   pm2 reload flowsvault
   ```

7. **Configure Reverse Proxy (Optional but Recommended):**
   
   **Nginx Example:**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       # Maximum upload size
       client_max_body_size 100M;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           
           # Timeouts for large file uploads
           proxy_connect_timeout 300s;
           proxy_send_timeout 300s;
           proxy_read_timeout 300s;
       }
   }
   ```

8. **Setup Cron for File Cleanup (Important):**
   Since Vercel cron won't work on VPS, you need to setup system cron:
   ```bash
   # Edit crontab
   crontab -e
   
   # Add this line to run cleanup daily at 2:00 AM
   0 2 * * * cd /path/to/flowsvault && npm run cleanup:expired >> /var/log/flowsvault-cleanup.log 2>&1
   ```

#### PM2 Configuration

The project includes `ecosystem.config.js` with optimized settings:
- **Process Name**: flowsvault
- **Execution Mode**: Fork (single instance)
- **Memory Limit**: 1GB (auto-restart if exceeded)
- **Logs**: Stored in `./logs/` directory with timestamps
- **Environment Variables**: Separate configs for dev and production

#### Custom Server Features

The project uses a custom Next.js server (`server.js`) for:
- **100MB Upload Support**: Extended body size limit for file uploads
- **Extended Timeouts**: 5-minute timeout for large file uploads
- **Host Binding**: Binds to `0.0.0.0` for external access (configurable via `HOSTNAME` env)
- **Port Configuration**: Uses `PORT` environment variable (default: 3000)

### Self-Hosting with Next.js Built-in Server
1. Build the application: `npm run build`
2. Set up your environment variables in `.env.production`
3. Run the production server: `npm run start`

**Note**: Built-in Next.js server may have limitations with large file uploads. PM2 with custom server is recommended for production.

## API Quick Reference

For complete API documentation, visit `/docs` when running the application or see [ARCHITECTURE.md#api-layer](ARCHITECTURE.md#api-layer).

### Core Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/upload` | POST | Upload file (streaming, max 100MB on VPS) | Required |
| `/api/files` | GET | List user's files with pagination | Required |
| `/api/files/[id]` | GET | Get file metadata | Required |
| `/api/files/[id]` | DELETE | Delete file | Required |
| `/api/download/[id]` | GET | Download file | Required |
| `/api/preview/[id]` | GET | Preview file (images, PDFs, videos) | Required |
| `/api/keys` | GET/POST | Manage API keys | Session Only |
| `/api/keys/[id]` | DELETE | Revoke API key | Session Only |

### Authentication Methods

**1. Session (Browser)**:
```bash
# Login via web interface, session cookie is automatically set
```

**2. API Key (Programmatic)**:
```bash
curl -H "Authorization: Bearer fv_your_api_key_here" \
  https://your-domain.com/api/files
```

## Documentation

- **README.md** (this file): Quick start and setup guide
- **[ARCHITECTURE.md](ARCHITECTURE.md)**: Detailed technical architecture
- **[RATE_LIMITING_ENHANCEMENT.md](RATE_LIMITING_ENHANCEMENT.md)**: Rate limiting implementation details
- **`/docs` page**: Interactive API documentation with code examples

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please read [ARCHITECTURE.md](ARCHITECTURE.md) to understand the codebase structure before contributing.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

---

## Quick Links

- **Live Demo**: Visit your deployed URL
- **Documentation**: `/docs` route in your application
- **API Reference**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **GitHub Issues**: Report bugs or request features
- **Security**: Report security issues privately to the maintainers

---