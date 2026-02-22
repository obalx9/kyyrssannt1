# Quick Start - Deploy Kursat to Timeweb

## What This Project Is

Multi-module application:
- **Frontend**: React app built with Vite
- **Backend API**: Express.js server (port 3000)
- **Database**: PostgreSQL (required)
- **Storage**: S3-compatible (Timeweb S3, optional but recommended)

## Pre-Deployment Checklist

- [ ] Database created in Timeweb (PostgreSQL 12+)
- [ ] Database migrations applied (see database instructions)
- [ ] S3 bucket created in Timeweb (if using media uploads)
- [ ] Environment variables prepared in `.env` file

## Step 1: Prepare Environment File

Create `.env` in project root:

```env
PORT=3000
NODE_ENV=production

DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require

JWT_SECRET=generate-random-secure-string

ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

S3_ENDPOINT=https://s3.timeweb.com
S3_REGION=ru-1
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY=your-key
S3_SECRET_KEY=your-secret
```

## Step 2: Choose Deployment Method

### Option A: Docker (Container)

Easiest for Timeweb:

```bash
# Build
docker build -t kursat-app:latest .

# Push to your registry
docker tag kursat-app:latest your-registry/kursat-app:latest
docker login your-registry
docker push your-registry/kursat-app:latest
```

Then in Timeweb panel:
1. Create Container
2. Image: `your-registry/kursat-app:latest`
3. Port: 3000
4. Add environment variables
5. Health check: GET /health

### Option B: Traditional VM Deployment

```bash
# Install PM2 globally (once)
npm install -g pm2

# Clone/pull code
cd /path/to/kursat-app

# Install dependencies
npm ci --omit=dev
cd backend-api && npm ci --omit=dev
cd ..

# Build frontend
npm run build

# Start
pm2 start ecosystem.config.js --update-env

# Save config to restart on reboot
pm2 save
```

## Step 3: Verify Deployment

Check health endpoint:

```bash
curl -f http://your-server:3000/health
```

Expected response:

```json
{
  "status": "ok",
  "database": {
    "connected": true
  }
}
```

Check logs:

```bash
# Docker
docker logs container-id

# PM2
pm2 logs kursat-api
```

## Common Issues

### "Cannot find package @aws-sdk/client-s3"

Dependencies not installed. Run:
```bash
cd backend-api && npm ci && cd ..
```

### "Database connection failed"

1. Verify DATABASE_URL format
2. Check database is running
3. Test connection: `psql postgresql://...`

### "Container keeps restarting"

1. Check logs: `docker logs container-id`
2. Verify all environment variables in `.env`
3. Ensure database is accessible

### "Port 3000 not exposed"

For Docker: ensure port mapping `-p 3000:3000`
For VM: check firewall allows port 3000

## Update Application

### Docker
```bash
docker build -t kursat-app:latest .
docker push your-registry/kursat-app:latest
# Redeploy in Timeweb panel
```

### PM2
```bash
git pull
npm run build
pm2 restart kursat-api
```

## Monitoring

### Docker
```bash
docker stats container-id
docker logs -f container-id
```

### PM2
```bash
pm2 status
pm2 monit
pm2 logs kursat-api
```

## Next Steps

1. Configure SSL/HTTPS (Nginx reverse proxy)
2. Set up log rotation
3. Configure database backups
4. Monitor application performance
5. Set up alerting

See `DEPLOYMENT_GUIDE.md` for comprehensive information.
