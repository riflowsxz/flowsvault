# Flowsvault Architecture Documentation

This document provides an in-depth explanation of Flowsvault's architecture, design decisions, and technical implementation details.

## Table of Contents

- [System Overview](#system-overview)
- [Architecture Layers](#architecture-layers)
- [Data Flow](#data-flow)
- [Component Details](#component-details)
- [Database Schema](#database-schema)
- [Authentication & Authorization](#authentication--authorization)
- [File Upload Pipeline](#file-upload-pipeline)
- [Rate Limiting Strategy](#rate-limiting-strategy)
- [Storage Architecture](#storage-architecture)
- [Security Measures](#security-measures)
- [Performance Optimizations](#performance-optimizations)
- [Deployment Architecture](#deployment-architecture)

## System Overview

Flowsvault is a full-stack file upload and management platform built with modern web technologies. The architecture follows a serverless-first approach using Next.js 15 App Router, with support for both serverless (Vercel) and traditional VPS deployment.

### Core Design Principles

1. **Security First**: Multiple layers of security including authentication, rate limiting, and input validation
2. **Scalability**: Designed to handle concurrent uploads and large file sizes efficiently
3. **User Experience**: Advanced features like pause/resume, progress tracking, and automatic retry
4. **Flexibility**: Dual authentication (OAuth + API keys) for different use cases
5. **Maintainability**: Clear separation of concerns with organized directory structure

### Technology Choices

- **Next.js 15**: Unified frontend and backend with App Router for better DX and performance
- **PostgreSQL + Drizzle ORM**: Type-safe database operations with migrations
- **Cloudflare R2**: S3-compatible storage with zero egress fees
- **Upstash Redis**: Serverless-friendly rate limiting
- **NextAuth.js**: Industry-standard authentication
- **Radix UI + Tailwind**: Accessible, customizable component library

## Architecture Layers

### 1. Presentation Layer

**Location**: `/app`, `/components`

The presentation layer handles all user interactions and UI rendering.

#### Client Components
- **FileUploader.tsx**: Complex stateful component managing upload queue
  - Uses React hooks for state management
  - Implements XMLHttpRequest for upload progress tracking
  - Manages concurrent uploads with queue system
  - Handles pause/resume/retry logic
  
- **FileList.tsx**: File management interface
  - Real-time search and filtering
  - Pagination with server-side data
  - Action buttons for download, preview, delete
  
- **ApiKeysModal.tsx**: API key management UI
  - Secure key generation
  - Copy to clipboard functionality
  - Key revocation

#### Server Components
- **Layout.tsx**: Root layout with providers
  - Theme provider for dark/light mode
  - Session provider for authentication
  - Language context for i18n
  
- **Page.tsx**: Main dashboard
  - Server-side data fetching
  - Optimized for SEO

### 2. API Layer

**Location**: `/app/api`

RESTful API endpoints built with Next.js Route Handlers.

#### Endpoint Categories

**File Operations**
```
POST   /api/upload           - Upload file with streaming
GET    /api/files            - List user's files (paginated)
GET    /api/files/[id]       - Get file metadata
DELETE /api/files/[id]       - Delete file
GET    /api/download/[id]    - Download file
GET    /api/preview/[id]     - Preview file (images, PDFs, videos)
```

**Authentication**
```
GET    /api/auth/[...nextauth] - NextAuth.js endpoints (signin, callback, etc.)
```

**API Key Management**
```
GET    /api/keys             - List user's API keys
POST   /api/keys             - Generate new API key
DELETE /api/keys/[id]        - Revoke API key
```

**User Profile**
```
POST   /api/profile/picture  - Upload profile picture
DELETE /api/profile/delete   - Delete user account
```

**Admin Operations**
```
POST   /api/admin/cleanup    - Cleanup expired files (cron job)
```

### 3. Business Logic Layer

**Location**: `/lib`

Core business logic and utility functions.

#### Key Modules

**Authentication** (`auth.ts`, `auth-helper.ts`, `api-key.ts`)
- Dual authentication system implementation
- Session validation
- API key generation and verification
- User authorization checks

**Storage** (`r2-storage.ts`)
- Cloudflare R2 client initialization
- File upload with streaming
- File download with presigned URLs
- File deletion with cleanup
- Metadata tagging

**Rate Limiting** (`rate-limit.ts`)
- Upstash Redis integration
- Sliding window algorithm
- Per-user and per-IP limits
- Automatic in-memory fallback

**Database** (`db/`)
- Schema definitions
- Query builders
- Migration management
- Utility functions for CRUD operations

**Upload Client** (`upload-client.ts`)
- Client-side upload logic
- Progress tracking
- Chunk management
- Error handling and retry

**Validation** (`validators.ts`)
- Zod schemas for all inputs
- File type validation
- Size validation
- Request/response validation

### 4. Middleware Layer

**Location**: `middleware.ts`

Edge middleware that runs before every request.

#### Responsibilities
1. **Rate Limiting**: Check and enforce rate limits
2. **Authentication**: Validate session or API key
3. **Request Routing**: Determine which routes require auth
4. **Security Headers**: Add security headers to responses

```typescript
Request → Middleware → Rate Limit Check → Auth Check → Route Handler → Response
```

### 5. Data Layer

#### PostgreSQL Database

**Schema Tables**:
- `users`: User accounts and profiles
- `file_metadata`: File information and metadata
- `api_keys`: API key storage with hashing
- `file_shares`: File sharing links
- `upload_sessions`: Temporary upload sessions

#### Cloudflare R2 Storage

**Structure**:
```
bucket/
├── {uuid}-{sanitized-filename}.ext
├── {uuid}-{sanitized-filename}.ext
└── ...
```

**Metadata Tags**:
- `originalName`: Original filename
- `uploadedAt`: Upload timestamp
- `expiresAt`: Expiration timestamp
- `userId`: Owner user ID
- `duration`: Expiration duration setting

## Data Flow

### Upload Flow

```
User selects file
    ↓
FileUploader validates file (size, type)
    ↓
Add to upload queue
    ↓
User clicks upload
    ↓
POST /api/upload
    ↓
Middleware checks:
  - Rate limit (50/5min per IP)
  - Authentication (session or API key)
    ↓
Upload handler validates:
  - Content-Type header
  - File size (streaming)
  - File extension
    ↓
Stream file to Cloudflare R2
  - Generate UUID filename
  - Add metadata tags
  - Track progress
    ↓
Create database record
  - Insert into file_metadata table
  - Link to user ID
  - Set expiration date
    ↓
Return response with:
  - File ID
  - Download URL
  - Metadata
    ↓
Client updates UI
  - Mark upload complete
  - Add to file list
```

### Download Flow

```
User clicks download
    ↓
GET /api/download/[id]
    ↓
Middleware checks:
  - Rate limit (200/min per IP)
  - Authentication
    ↓
Download handler:
  - Query database for file metadata
  - Verify ownership
  - Check expiration
    ↓
Get file from R2
  - Generate presigned URL (5 min TTL)
  - Or stream directly
    ↓
Return file stream with headers:
  - Content-Disposition: attachment
  - Content-Type: {mime-type}
  - Content-Length: {size}
    ↓
Browser downloads file
```

### API Key Authentication Flow

```
Client sends request with header:
  Authorization: Bearer fv_xxx...
    ↓
Middleware extracts token
    ↓
If token starts with "fv_":
  - Extract prefix (first 8 chars)
  - Query database by prefix
  - Compare with bcrypt hash
  - Validate not revoked
  - Update lastUsedAt timestamp
    ↓
If valid:
  - Attach userId to request
  - Continue to route handler
Else:
  - Return 401 Unauthorized
```

## Component Details

### FileUploader Component

**File**: `/components/FileUploader.tsx`

**Features**:
- Drag & drop support with visual feedback
- Multi-file queue with concurrent uploads (3 parallel)
- Per-file controls: pause, resume, retry, cancel
- Real-time progress tracking with percentage and ETA
- Automatic retry with exponential backoff (3 attempts)
- File type validation before upload
- File size validation
- Preview generation for images

**State Management**:
```typescript
interface QueuedFile {
  id: string;                    // Unique queue ID
  file: File;                    // File object
  previewUrl?: string;           // Preview image URL
  status: 'pending' | 'uploading' | 'paused' | 'success' | 'error';
  progress: number;              // 0-100
  error?: string;                // Error message
  abortController?: AbortController; // For cancellation
  retryCount: number;            // Retry attempts
  startTime?: number;            // Upload start timestamp
  uploadedBytes?: number;        // Bytes uploaded so far
}
```

**Upload Algorithm**:
1. Add file to queue with 'pending' status
2. Process queue when concurrent uploads < 3
3. Create AbortController for cancellation support
4. Use XMLHttpRequest for progress tracking
5. Update progress state every 100ms
6. On complete: mark as 'success'
7. On error: retry up to 3 times with exponential backoff
8. On abort: clean up and remove from active queue

### FileList Component

**File**: `/components/FileList.tsx`

**Features**:
- Paginated file listing
- Real-time search by filename
- Filter by status (active, expired, all)
- Sort by date, name, size
- Bulk actions (select multiple)
- Download, preview, delete, share actions
- Copy download link to clipboard
- File size formatting
- Expiration date display
- File type icons

**Data Fetching**:
- Client-side pagination
- Debounced search (300ms)
- Optimistic UI updates
- Error handling with toast notifications

### ApiKeysModal Component

**File**: `/components/ApiKeysModal.tsx`

**Features**:
- Generate new API keys with custom names
- Display existing keys (prefix only)
- One-time display of full key after generation
- Copy to clipboard functionality
- Revoke keys
- Last used timestamp
- Created date
- Security warnings and best practices

**Security Measures**:
- Full key shown only once during creation
- Keys stored as bcrypt hashes in database
- Prefix-based lookup for performance
- Automatic encryption for display purposes
- Revoked keys remain in database for audit

## Database Schema

### users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(64),
  image TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

### file_metadata Table

```sql
CREATE TABLE file_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_name VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL UNIQUE,
  size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  extension VARCHAR(10) NOT NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  download_url VARCHAR(500) NOT NULL,
  duration VARCHAR(20) NOT NULL DEFAULT 'unlimited',
  user_id UUID NOT NULL REFERENCES users(id),
  is_deleted BOOLEAN DEFAULT false
);

CREATE INDEX idx_file_metadata_user_id ON file_metadata(user_id);
CREATE INDEX idx_file_metadata_expires_at ON file_metadata(expires_at);
```

### api_keys Table

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  hashed_key TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  prefix VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP,
  revoked_at TIMESTAMP
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_prefix ON api_keys(prefix);
```

### file_shares Table

```sql
CREATE TABLE file_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES file_metadata(id),
  shared_by_user_id UUID NOT NULL REFERENCES users(id),
  shared_with_user_id UUID REFERENCES users(id),
  share_token VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  permissions JSONB
);

CREATE INDEX idx_file_shares_file_user ON file_shares(file_id, shared_by_user_id);
```

### upload_sessions Table

```sql
CREATE TABLE upload_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  session_id VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);
```

## Authentication & Authorization

### OAuth Flow (NextAuth.js)

```
User clicks "Sign in with Google/GitHub"
    ↓
Redirect to OAuth provider
    ↓
User grants permission
    ↓
Provider redirects back with code
    ↓
NextAuth exchanges code for tokens
    ↓
Create or update user in database
    ↓
Create session with JWT
    ↓
Set session cookie
    ↓
User authenticated
```

### API Key Flow

```
User generates API key in dashboard
    ↓
System generates:
  - Random 32-byte key
  - Prefix: fv_{8-char-random}
  - Full key: {prefix}_{24-char-random}
    ↓
Hash full key with bcrypt (10 rounds)
    ↓
Encrypt full key for display (AES-256)
    ↓
Store in database:
  - hashed_key: bcrypt hash
  - encrypted_key: encrypted key
  - prefix: for lookup
    ↓
Return full key to user (one time only)
    ↓
User includes in Authorization header
    ↓
System validates:
  - Extract prefix
  - Lookup by prefix
  - Compare with bcrypt
  - Check not revoked
```

### Authorization Checks

**For File Operations**:
```typescript
// Get file metadata
const file = await getFileMetadata(fileId);

// Check ownership
if (file.userId !== authenticatedUserId) {
  return 403 Forbidden;
}

// Check expiration
if (file.expiresAt && file.expiresAt < new Date()) {
  return 410 Gone;
}

// Check soft delete
if (file.isDeleted) {
  return 404 Not Found;
}

// Authorize action
```

## File Upload Pipeline

### Step-by-Step Process

**1. Client-Side Validation**
```typescript
// Check file size
if (file.size > MAX_FILE_SIZE) {
  throw new Error('File too large');
}

// Check file type
const extension = file.name.substring(file.name.lastIndexOf('.'));
if (!ALLOWED_EXTENSIONS.has(extension)) {
  throw new Error('File type not allowed');
}
```

**2. Multipart Form Data**
```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('duration', '7d');
```

**3. Server-Side Parsing** (using busboy)
```typescript
const bb = busboy({
  headers: request.headers,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
});

bb.on('file', async (fieldname, stream, info) => {
  // Stream processing
});
```

**4. Streaming to R2**
```typescript
// Create readable stream from request
const readableStream = Readable.from(stream);

// Upload to R2 with streaming
const command = new PutObjectCommand({
  Bucket: R2_BUCKET,
  Key: storageKey,
  Body: readableStream,
  ContentType: mimeType,
  Metadata: {
    originalName,
    uploadedAt: new Date().toISOString(),
    expiresAt: expirationDate?.toISOString() || '',
    userId,
    duration,
  },
});

await r2Client.send(command);
```

**5. Database Record Creation**
```typescript
await db.insert(fileMetadata).values({
  originalName,
  fileName: storageKey,
  size,
  mimeType,
  extension,
  uploadedAt: new Date(),
  expiresAt: expirationDate,
  downloadUrl: `/api/download/${fileId}`,
  duration,
  userId,
});
```

**6. Response**
```typescript
return {
  success: true,
  data: {
    id,
    fileName: storageKey,
    originalName,
    size,
    mimeType,
    extension,
    uploadedAt,
    expiresAt,
    downloadUrl,
    duration,
  },
};
```

## Rate Limiting Strategy

### Architecture

**Distributed Rate Limiting** with Upstash Redis:
- Sliding window algorithm for accuracy
- Per-user and per-IP limits
- Separate limits for upload vs. API calls
- Automatic fallback to in-memory when Redis unavailable

### Limits Configuration

```typescript
const RATE_LIMITS = {
  // Upload endpoint
  uploadPerUser: {
    requests: 50,
    window: 300, // 5 minutes
  },
  uploadPerIP: {
    requests: 50,
    window: 300,
  },
  
  // API endpoints
  apiPerUser: {
    requests: 200,
    window: 60, // 1 minute
  },
  apiPerIP: {
    requests: 200,
    window: 60,
  },
};
```

### Implementation

```typescript
export async function rateLimitMultiple(
  checks: Array<{ identifier: string; type: RateLimitType }>
): Promise<RateLimitResult> {
  for (const check of checks) {
    const result = await rateLimit(check.identifier, check.type);
    if (!result.success) {
      return result; // Return first failure
    }
  }
  return { success: true, /* ... */ };
}
```

### Middleware Integration

```typescript
// In middleware.ts
if (request.nextUrl.pathname.startsWith('/api/upload')) {
  const checks = [
    { identifier: `upload_ip_${ip}`, type: 'uploadPerIP' },
  ];
  
  if (authenticated) {
    checks.push({ identifier: `upload_user_${userId}`, type: 'uploadPerUser' });
  }
  
  const result = await rateLimitMultiple(checks);
  
  if (!result.success) {
    return new NextResponse(
      JSON.stringify({ error: 'Rate limit exceeded' }),
      {
        status: 429,
        headers: {
          'Retry-After': result.retryAfter,
          'X-RateLimit-Limit': result.limit,
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.reset,
        },
      }
    );
  }
}
```

## Storage Architecture

### Cloudflare R2 Setup

**Configuration**:
```typescript
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
  },
});
```

**File Naming Strategy**:
```
Format: {uuid}-{sanitized-filename}.{extension}
Example: 550e8400-e29b-41d4-a716-446655440000-my_document.pdf

Benefits:
- Unique filenames prevent collisions
- Original name preserved for downloads
- Extension maintained for MIME type detection
- Sanitized to prevent path traversal
```

**Metadata Tagging**:
```typescript
Metadata: {
  originalName: 'My Document.pdf',
  uploadedAt: '2024-10-25T10:30:00Z',
  expiresAt: '2024-11-01T10:30:00Z',
  userId: '550e8400-e29b-41d4-a716-446655440000',
  duration: '7d',
}
```

### Database + Storage Sync

**Upload Process**:
1. Stream file to R2 (with metadata)
2. Insert record in PostgreSQL
3. Both must succeed or rollback

**Delete Process**:
1. Soft delete in PostgreSQL (set `is_deleted = true`)
2. Delete from R2 storage
3. Keep database record for audit

**Cleanup Process** (cron job):
1. Query expired files from database
2. Delete from R2 storage
3. Update database records
4. Log results

## Security Measures

### 1. Input Validation

**File Upload**:
- Size limit: Configurable (default 100MB)
- Type allowlist: Defined in environment
- Extension check: Must match MIME type
- Filename sanitization: Remove special characters
- Content-Type validation: Must be multipart/form-data

**API Requests**:
- Zod schema validation for all inputs
- SQL injection prevention via parameterized queries
- XSS prevention via React's built-in escaping
- CSRF protection via SameSite cookies

### 2. Authentication Security

**Session Security**:
- JWT tokens with NEXTAUTH_SECRET
- Secure cookie flags (httpOnly, secure, sameSite)
- Token expiration (30 days)
- Session rotation on sensitive actions

**API Key Security**:
- Cryptographically secure random generation (32 bytes)
- bcrypt hashing (10 rounds) for storage
- Prefix-based lookup for performance
- One-time display of full key
- Automatic expiration and revocation support

### 3. Rate Limiting

**Multiple Layers**:
- Per-IP limits: Prevent abuse from single source
- Per-User limits: Prevent abuse from single account
- Endpoint-specific limits: Different limits for different operations
- Sliding window: More accurate than fixed window

### 4. Authorization

**File Access Control**:
- User can only access their own files
- File ownership verified on every operation
- Soft delete preserves audit trail
- Share tokens for controlled sharing

### 5. Headers & Policies

**Security Headers**:
```typescript
headers: {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}
```

**CORS Policy**:
- Same-origin by default
- Configurable for API access
- Credentials required for authenticated requests

### 6. Data Protection

**At Rest**:
- PostgreSQL with encryption
- R2 with server-side encryption
- API keys hashed with bcrypt
- Passwords never stored (OAuth only)

**In Transit**:
- HTTPS everywhere (TLS 1.3)
- Secure WebSocket connections
- Certificate pinning for API clients

## Performance Optimizations

### 1. Frontend Optimizations

**React Performance**:
- Memoization with `memo()`, `useMemo()`, `useCallback()`
- Virtualized lists for large file listings
- Lazy loading of components
- Code splitting by route
- Image optimization with Next.js Image

**Upload Performance**:
- Concurrent uploads (3 parallel)
- Streaming upload (no memory buffering)
- Progress throttling (update every 100ms)
- Automatic retry on failure
- Pause/resume support

### 2. Backend Optimizations

**Database**:
- Indexes on frequently queried columns
- Connection pooling (Drizzle)
- Prepared statements
- Query result caching
- Pagination for large datasets

**API Routes**:
- Edge middleware for fast auth checks
- Streaming responses for large files
- Compression for text responses
- CDN caching for static assets
- ISR for documentation pages

### 3. Storage Optimizations

**R2 Integration**:
- Streaming uploads (no temp files)
- Presigned URLs for downloads
- Metadata tagging (avoid extra DB queries)
- Multipart uploads for large files
- Lifecycle policies for cleanup

### 4. Caching Strategy

**Browser Cache**:
- Static assets: 1 year
- API responses: No cache
- HTML pages: Revalidate

**CDN Cache** (Vercel):
- Documentation: ISR (24 hours)
- Static files: Forever (with cache busting)
- API routes: No cache

**Application Cache**:
- Rate limit counters: Redis (TTL-based)
- Session data: In-memory (encrypted)
- User preferences: LocalStorage

## Deployment Architecture

### Vercel Deployment (Serverless)

**Limitations**:
- 4.5MB file upload limit (Edge Function constraint)
- 10 second function timeout for Hobby plan
- Stateless: No file system persistence
- Cold starts: 100-300ms

**Optimizations**:
- Platform detection: Auto-adjust limits
- Edge middleware: Faster auth checks
- Streaming: Reduce memory usage
- Vercel Cron: Automated cleanup

**Configuration**:
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/admin/cleanup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### VPS Deployment (PM2)

**Advantages**:
- Full 100MB upload support
- Custom server configuration
- Longer function timeouts
- File system access
- No cold starts

**Setup**:
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'flowsvault',
    script: 'server.js',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
  }],
};
```

**Custom Server**:
```javascript
// server.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  })
    .setTimeout(300000) // 5 minutes for large uploads
    .listen(port, hostname, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
```

### Database Deployment

**Options**:
1. **Managed PostgreSQL**: Neon, Supabase, AWS RDS, Google Cloud SQL
2. **Self-hosted**: Docker container on VPS
3. **Development**: Local PostgreSQL installation

**Connection Pooling**:
```typescript
// lib/db/connection.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.POSTGRES_URL!;

const client = postgres(connectionString, {
  max: 10, // Connection pool size
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client);
```

### Redis Deployment

**Upstash Redis**:
- Serverless-friendly
- REST API (no TCP connection)
- Global replication
- Automatic failover

**Configuration**:
```typescript
// lib/rate-limit.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
```

## Monitoring & Logging

### Application Monitoring

**Metrics to Track**:
- Upload success/failure rate
- Average upload duration
- File storage usage
- API response times
- Error rates by endpoint
- Active users
- API key usage

### Logging Strategy

**Levels**:
- ERROR: Critical failures requiring immediate attention
- WARN: Potential issues or rate limit hits
- INFO: Important events (uploads, deletions)
- DEBUG: Detailed debugging information

**Log Format**:
```typescript
{
  timestamp: '2024-10-25T10:30:00Z',
  level: 'INFO',
  message: 'File uploaded successfully',
  context: {
    userId: '550e8400-...',
    fileId: 'abc123...',
    fileName: 'document.pdf',
    size: 1048576,
    duration: 1250,
  },
}
```

### Error Tracking

**Implementation**:
- Centralized error boundary in React
- API route error handlers
- Unhandled promise rejection handling
- Window error event listener

## Scalability Considerations

### Horizontal Scaling

**Stateless Design**:
- No server-side sessions (JWT only)
- No file system usage
- Database connection pooling
- Redis for shared state

**Load Balancing**:
- Multiple Next.js instances behind Nginx
- Sticky sessions not required
- Health check endpoint: `/api/health`

### Vertical Scaling

**Resource Limits**:
- Memory: 1GB per instance (PM2)
- CPU: Auto-scaling based on load
- Database: Connection pool size: 10
- Redis: Auto-scaling with Upstash

### Database Scaling

**Query Optimization**:
- Indexes on all foreign keys
- Composite indexes for common queries
- Query result caching
- Read replicas for high traffic

**Data Archival**:
- Move old files to cold storage
- Archive deleted file records
- Cleanup expired uploads regularly

### Storage Scaling

**R2 Benefits**:
- Unlimited storage capacity
- Zero egress fees
- Global distribution
- Auto-scaling

**Cost Optimization**:
- Delete expired files promptly
- Compress uploads when possible
- Use appropriate storage classes

---

**Last Updated**: 2024-10-25
**Version**: 1.0.0
**Maintainer**: Flowsvault Team
