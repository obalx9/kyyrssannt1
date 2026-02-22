# Kursat - Multi-Module Application Deployment

## Overview

This is a complete multi-module web application for an online learning platform:
- **Frontend**: React + TypeScript + Vite (production-optimized)
- **Backend API**: Express.js with PostgreSQL and S3 integration
- **Database**: PostgreSQL (hosted on Timeweb)
- **Storage**: S3-compatible (Timeweb S3)

## Key Changes Made for Production Deployment

### 1. Fixed Dockerfile
- Removed problematic `--omit=dev` during build phase
- Ensured all dependencies are installed before final optimization
- Kept both root and backend-api dependencies intact
- Health check configured for port 3000
- Multi-stage optimization for smaller image

### 2. Updated Deployment Scripts
- **deploy.sh**: Fixed for correct module structure (backend-api not api)
- **ecosystem.config.js**: Updated to use backend-api/index.js
- **docker-deploy.sh**: New Docker-specific deployment helper

### 3. Environment Configuration
- **.env**: Complete with all required variables
- **backend-api/.env.example**: Updated with S3 configuration
- **.dockerignore**: Optimized for Docker builds

### 4. Pre-Deployment Verification
- **pre-deploy-check.sh**: Validates all deployment prerequisites

## Project Structure

```
kursat-app/
├── src/                          # Frontend React app
├── backend-api/                  # Express API server
│   ├── index.js                 # Main entry point
│   ├── s3Service.js             # S3 integration
│   └── package.json
├── build/                        # Frontend build output
├── .env                          # Environment variables
├── Dockerfile                    # Container image
├── ecosystem.config.js           # PM2 configuration
├── deploy.sh                     # Deployment script
├── docker-deploy.sh              # Docker deployment
├── pre-deploy-check.sh           # Pre-deployment checks
└── package.json                  # Root dependencies
```

## Quick Deployment

### 1. Pre-Deployment Check
```bash
bash ./pre-deploy-check.sh
```
This verifies:
- Node.js 18+ installed
- All required files present
- Dependencies installed
- Environment variables configured
- Frontend built

### 2. Docker Deployment (Recommended)
```bash
# Build image
docker build -t kursat-app:latest .

# Push to registry
docker tag kursat-app:latest your-registry/kursat-app:latest
docker push your-registry/kursat-app:latest
```

Then deploy to Timeweb Container with image: `your-registry/kursat-app:latest`

### 3. Traditional VM Deployment with PM2
```bash
# Ensure Node.js 18+ is installed
node --version

# Run deployment script
bash ./deploy.sh
```

## Environment Variables

Copy `.env.example` or create `.env` with these variables:

```env
# Server
PORT=3000
NODE_ENV=production

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# Authentication
JWT_SECRET=your-secure-random-string-here

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# S3 Storage (Timeweb)
S3_ENDPOINT=https://s3.timeweb.com
S3_REGION=ru-1
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
```

## Verification After Deployment

### Health Check Endpoint
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "database": {
    "connected": true,
    "serverTime": "2024-01-15T10:30:45.123Z"
  }
}
```

### View Logs
```bash
# Docker
docker logs container-id

# PM2
pm2 logs kursat-api
```

## Deployment Architecture

### Docker Flow
```
Dockerfile (build) →
  Install root deps →
  Install backend deps →
  Copy source →
  Build frontend →
  Configure environment →
  Expose port 3000 →
  Start Express server
```

### PM2 Flow
```
deploy.sh →
  Install root deps →
  Install backend deps →
  Build frontend →
  Start with PM2 using ecosystem.config.js →
  Port 3000 listening →
  Health checks enabled
```

## Important Files Explained

### Dockerfile
- Uses Node.js 24 Alpine (lightweight)
- Installs both root and backend-api dependencies
- Builds React frontend with Vite
- Exposes port 3000
- Health check: GET /health every 30 seconds

### ecosystem.config.js
- Starts backend-api/index.js
- Single instance (can scale to multiple)
- Auto-restart on crash (max 10 attempts)
- Max memory: 1GB
- Log files in /logs directory
- File watching disabled for production

### backend-api/index.js
- Listens on 0.0.0.0:3000 (all interfaces)
- Connects to PostgreSQL with SSL
- S3 integration for media uploads
- JWT authentication for routes
- CORS configured for specified origins
- Provides health endpoint at /health

## Troubleshooting

### Container/App Won't Start
1. Check `.env` file exists and is valid
2. Verify DATABASE_URL is correct
3. Check logs: `docker logs <id>` or `pm2 logs kursat-api`
4. Run pre-deployment check: `bash ./pre-deploy-check.sh`

### Database Connection Failed
1. Verify DATABASE_URL: `postgresql://user:password@host:port/db?sslmode=require`
2. Test connection: `psql postgresql://...`
3. Check firewall allows database port
4. Ensure database exists and is ready

### S3 Upload Errors
1. Verify S3_ACCESS_KEY and S3_SECRET_KEY
2. Check S3_BUCKET name
3. Test S3 connectivity: `curl https://s3.timeweb.com/`
4. Configure CORS in S3 settings if needed

### High Memory Usage
1. Check application logs for memory leaks
2. Reduce instances if using clustering
3. Increase max_memory_restart in ecosystem.config.js
4. Check Timeweb container memory allocation

## Performance Notes

- Frontend (React): ~469KB gzipped (optimized)
- Backend: ~221 npm packages
- Database: Connection pooling enabled
- S3: Signed URLs for secure media delivery
- CORS: Restricted to configured origins

## Security Considerations

1. Never commit `.env` file
2. Use strong JWT_SECRET (generate with: `openssl rand -base64 32`)
3. Enable HTTPS/SSL on Timeweb (recommended)
4. Rotate credentials regularly
5. Keep Node.js updated
6. Monitor logs for suspicious activity

## Next Steps After Deployment

1. Set up HTTPS/SSL reverse proxy (Nginx recommended)
2. Configure automated backups for PostgreSQL
3. Set up monitoring and alerting
4. Implement rate limiting for APIs
5. Add application logging aggregation
6. Configure automated deployments (CI/CD)

## Support & Documentation

- **Timeweb Docs**: https://timeweb.cloud/docs
- **PostgreSQL**: https://www.postgresql.org/docs
- **Express.js**: https://expressjs.com
- **React**: https://react.dev
- **Vite**: https://vitejs.dev

## Files Modified for Deployment

✓ Dockerfile - Fixed dependency installation order
✓ deploy.sh - Updated for correct module structure
✓ ecosystem.config.js - Updated entry point and config
✓ .dockerignore - Optimized Docker builds
✓ backend-api/.env.example - Added S3 configuration

## New Files Created

✓ QUICK_START_DEPLOY.md - Quick deployment guide
✓ DEPLOYMENT_GUIDE.md - Comprehensive deployment guide
✓ docker-deploy.sh - Docker-specific deployment helper
✓ pre-deploy-check.sh - Pre-deployment verification
✓ README_DEPLOYMENT.md - This file

---

**Ready to deploy! Run `bash ./pre-deploy-check.sh` to verify everything is configured correctly.**
