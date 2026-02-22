# Kursat Application - Deployment Guide

## Project Structure

This is a multi-module application:
- **Frontend**: React + TypeScript + Vite (in root `src/` directory)
- **Backend API**: Express.js (in `backend-api/` directory)
- **Database**: PostgreSQL (Timeweb)
- **Storage**: S3-compatible (Timeweb S3)

## Prerequisites

- Node.js 18+ (recommended 22+)
- PostgreSQL 12+ (provided by Timeweb)
- S3-compatible storage (Timeweb S3)
- PM2 for process management (on VM deployment)
- Docker (for containerized deployment)

## Environment Variables

Create `.env` file in the project root with:

```env
# Backend API
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@host:port/database_name?sslmode=require

# JWT Authentication
JWT_SECRET=your_very_secret_jwt_key_change_this

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# AWS S3 / Timeweb S3
S3_ENDPOINT=https://s3.timeweb.com
S3_REGION=ru-1
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key
```

## Deployment Option 1: Docker (Recommended for Timeweb Container)

### Build Docker Image

```bash
# Build the image
docker build -t kursat-app:latest .

# Run locally to test
docker run -d \
  --env-file .env \
  -p 3000:3000 \
  kursat-app:latest
```

### Push to Registry

```bash
# Tag image for your registry
docker tag kursat-app:latest your-registry/kursat-app:latest

# Login and push
docker login your-registry
docker push your-registry/kursat-app:latest
```

### Deploy to Timeweb Container

1. In Timeweb Panel, create new Container
2. Select Image: `your-registry/kursat-app:latest`
3. Configure environment variables in the panel
4. Map port 3000
5. Set health check: `GET /health`

## Deployment Option 2: VM with PM2 (For Traditional VPS)

### Initial Setup

```bash
# Clone repository and navigate to it
cd /path/to/kursat-app

# Create .env file
cp .env.example .env
# Edit .env with your credentials

# Install PM2 globally
npm install -g pm2

# Install dependencies and build
npm ci --omit=dev
cd backend-api && npm ci --omit=dev
cd ..
npm run build
```

### Deploy with Script

```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

### Manual Deployment Steps

```bash
# Install root dependencies
npm ci --omit=dev

# Install backend dependencies
cd backend-api
npm ci --omit=dev
cd ..

# Build frontend
npm run build

# Start application with PM2
pm2 start ecosystem.config.js --update-env

# Save PM2 configuration
pm2 save
```

### PM2 Management

```bash
# Check status
pm2 status

# View logs
pm2 logs kursat-api

# Restart
pm2 restart kursat-api

# Stop
pm2 stop kursat-api

# Delete
pm2 delete kursat-api

# Monitor in real-time
pm2 monit
```

## Health Check

The application provides a health check endpoint at `/health`.

### Testing Health Check

```bash
curl -f http://localhost:3000/health
echo $?  # Should return 0 if successful
```

### Health Check Response

```json
{
  "status": "ok",
  "database": {
    "connected": true,
    "serverTime": "2024-01-15T10:30:45.123Z",
    "version": "PostgreSQL 14.5 ..."
  }
}
```

## Troubleshooting

### Container Keeps Restarting

1. **Check logs**:
   ```bash
   docker logs <container-id>
   # or for PM2:
   pm2 logs kursat-api
   ```

2. **Common issues**:
   - Missing environment variables - check `.env` file
   - Database connection failed - verify DATABASE_URL
   - Missing dependencies - ensure `npm ci` completed successfully

### Database Connection Failed

1. Verify DATABASE_URL format:
   ```
   postgresql://user:password@host:port/database?sslmode=require
   ```

2. Test connection:
   ```bash
   psql postgresql://user:password@host:port/database
   ```

3. Check firewall rules allowing connection to database

### S3 Upload Errors

1. Verify S3 credentials in `.env`
2. Check bucket name and access key
3. Ensure CORS is configured in S3 bucket settings
4. Test S3 connection: `curl https://s3.timeweb.com/`

### High Memory Usage

The max memory restart is set to 1GB. If you see restarts:
1. Check for memory leaks in logs
2. Reduce instance count in ecosystem.config.js
3. Increase available RAM in deployment

## Performance Tuning

### For PM2 Deployment

Edit `ecosystem.config.js`:
- Increase `instances` for multi-core systems
- Adjust `max_memory_restart` based on available RAM
- Enable clustering mode (`exec_mode: 'cluster'`) for better performance

### For Docker Deployment

- Allocate sufficient memory to container
- Use multi-stage build to reduce image size (already implemented)
- Enable resource limits in Timeweb container settings

## Updates and Redeployment

### Docker Container
```bash
# Build new version
docker build -t kursat-app:latest .

# Push to registry
docker push your-registry/kursat-app:latest

# Redeploy in Timeweb panel (pull latest image)
```

### PM2 Deployment
```bash
# Pull latest code
git pull origin main

# Rebuild
npm run build

# Restart application
pm2 restart kursat-api
```

## Backup and Recovery

### Database Backup
```bash
pg_dump postgresql://user:password@host:port/database > backup.sql
```

### Restore from Backup
```bash
psql postgresql://user:password@host:port/database < backup.sql
```

### S3 Backup (if needed)
- Use Timeweb S3 management console
- Configure lifecycle policies for old files

## Security Considerations

1. **Never commit `.env` file** - use `.env.example` as template
2. **Change JWT_SECRET** - use strong, random value
3. **Use HTTPS** - configure reverse proxy (Nginx) on VM
4. **Enable database backups** - configure in Timeweb panel
5. **Monitor logs** - set up log aggregation for production

## Support

For issues:
1. Check application logs
2. Verify environment variables
3. Test database connectivity
4. Review firewall/network rules
5. Check Timeweb service status

## Useful Links

- [Timeweb Documentation](https://timeweb.cloud/docs)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html)
- [AWS S3 API Reference](https://docs.aws.amazon.com/s3/latest/API/Welcome.html)
