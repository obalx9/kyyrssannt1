# Cloudflare Workers Setup for Supabase Proxy

This directory contains Cloudflare Workers scripts that proxy all requests to Supabase through your custom domain.

## Workers Overview

### 1. supabase-api-proxy.js
Handles all Supabase REST API and Auth requests.
- Route: `api.keykurs.ru/*`
- Proxies to: `https://uhmfboajfkqcfcupewjg.supabase.co`

### 2. supabase-storage-proxy.js
Handles all Supabase Storage requests with caching.
- Route: `storage.keykurs.ru/*`
- Proxies to: `https://uhmfboajfkqcfcupewjg.supabase.co`
- Cache TTL: 3600 seconds (1 hour)

## Configuration

### DNS Records
The following DNS records have been configured:
- `api.keykurs.ru` → AAAA record (100::) with Cloudflare proxy enabled
- `storage.keykurs.ru` → AAAA record (100::) with Cloudflare proxy enabled

### Worker Routes
- `api.keykurs.ru/*` → supabase-api-proxy
- `storage.keykurs.ru/*` → supabase-storage-proxy

### CORS Configuration
Both workers are configured to allow requests from:
- https://keykurs.ru
- https://www.keykurs.ru
- http://localhost:5173 (development)
- http://localhost:4173 (preview)

## Features

### API Proxy Features
- Transparent proxying of all Supabase REST API requests
- Auth endpoint support
- CORS handling
- Error handling and logging

### Storage Proxy Features
- Transparent proxying of all Supabase Storage requests
- Cloudflare CDN caching for GET requests
- Cache headers for optimal performance
- X-Cache header to indicate HIT/MISS

## Deployment

Workers are deployed using the Cloudflare API:

```bash
# Deploy API proxy
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/{account_id}/workers/scripts/supabase-api-proxy" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/javascript" \
  --data-binary "@supabase-api-proxy.js"

# Deploy Storage proxy
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/{account_id}/workers/scripts/supabase-storage-proxy" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/javascript" \
  --data-binary "@supabase-storage-proxy.js"
```

## Environment Variables

The application now uses the proxied URLs:

```env
VITE_SUPABASE_URL=https://api.keykurs.ru
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Testing

Test the workers:

```bash
# Test API proxy
curl -H "apikey: your_anon_key" https://api.keykurs.ru/rest/v1/

# Test Storage proxy
curl https://storage.keykurs.ru/storage/v1/bucket/list
```

## Benefits

1. **Bypass Restrictions**: Access Supabase even if direct access is blocked
2. **Performance**: Cloudflare CDN caching for media files
3. **Custom Domain**: Use your own domain for all Supabase requests
4. **Security**: Additional layer of control over API requests
5. **Analytics**: Cloudflare analytics for all API traffic

## Maintenance

To update a worker:
1. Edit the worker script in this directory
2. Use the Cloudflare API or dashboard to deploy the updated script
3. No application changes needed - workers are transparent proxies

## Support

For issues related to:
- Worker configuration: Check Cloudflare Workers dashboard
- DNS propagation: Use `dig` or online DNS checkers
- Application errors: Check browser console and Cloudflare logs
