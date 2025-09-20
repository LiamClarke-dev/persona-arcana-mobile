# DigitalOcean Spaces Setup Guide

This guide walks you through setting up DigitalOcean Spaces for file storage in the Persona Arcana backend.

## Overview

DigitalOcean Spaces provides S3-compatible object storage with built-in CDN capabilities. This setup enables:

- **Profile image uploads** (optimized to 400x400 WebP)
- **Persona card images** (optimized to 600x800 WebP)
- **Audio file storage** (for voice journal entries)
- **CDN delivery** for fast global access
- **Cost-effective storage** for small to medium scale

## Quick Setup

### 1. Create DigitalOcean Spaces Bucket

1. Go to [DigitalOcean Spaces](https://cloud.digitalocean.com/spaces)
2. Click **"Create a Space"**
3. Choose your preferred region (e.g., `NYC3`)
4. Enter a unique bucket name (e.g., `persona-arcana-dev`)
5. Set **File Listing** to **"Public"** (enables CDN access)
6. Click **"Create a Space"**

### 2. Generate API Keys

1. Go to [DigitalOcean API](https://cloud.digitalocean.com/account/api/spaces)
2. Click **"Generate New Key"**
3. Enter a name (e.g., "Persona Arcana Backend")
4. Copy the **Access Key** and **Secret Key** (save them securely!)

### 3. Configure Environment Variables

Update your `.env` file with the DigitalOcean configuration:

```bash
# DigitalOcean Spaces Configuration
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_BUCKET=your-bucket-name
DO_SPACES_ACCESS_KEY=your-access-key
DO_SPACES_SECRET_KEY=your-secret-key
DO_SPACES_REGION=nyc3
```

**Important:** Replace the placeholder values with your actual credentials.

### 4. Test Configuration

Run the setup validation script:

```bash
npm run setup:digitalocean
```

This will:

- ✅ Validate all environment variables are set
- 🔗 Test connection to your Spaces bucket
- 📋 Display current configuration
- 🔧 Provide troubleshooting help if needed

## API Endpoints

Once configured, the following endpoints are available:

### Connection Test

```http
GET /api/upload/test
```

### Profile Image Upload

```http
POST /api/upload/profile/:userId
Content-Type: multipart/form-data

{
  "image": [file] // JPEG, PNG, or WebP, max 5MB
}
```

### Persona Image Upload

```http
POST /api/upload/persona/:personaId
Content-Type: multipart/form-data

{
  "image": [file] // JPEG, PNG, or WebP, max 5MB
}
```

### Audio File Upload

```http
POST /api/upload/audio/:userId
Content-Type: multipart/form-data

{
  "audio": [file] // Any audio format, max 5MB
}
```

### File Deletion

```http
DELETE /api/upload/file
Content-Type: application/json

{
  "fileUrl": "https://bucket.region.digitaloceanspaces.com/path/to/file"
}
```

### File Metadata

```http
GET /api/upload/metadata?fileUrl=https://bucket.region.digitaloceanspaces.com/path/to/file
```

## File Organization

Files are automatically organized in the bucket:

```
your-bucket/
├── profiles/
│   └── user-123/
│       └── 1640995200000.webp
├── personas/
│   └── persona-456/
│       └── 1640995200000.webp
└── audio/
    └── user-123/
        └── 1640995200000.m4a
```

## Image Optimization

All uploaded images are automatically optimized:

- **Profile images**: Resized to 400x400, converted to WebP (80% quality)
- **Persona images**: Resized to 600x800, converted to WebP (85% quality)
- **Cache headers**: Set to 1 year for optimal CDN performance

## CDN Access

Files are accessible via both direct and CDN URLs:

- **Direct**: `https://bucket.region.digitaloceanspaces.com/path/to/file`
- **CDN**: `https://bucket.region.cdn.digitaloceanspaces.com/path/to/file`

The CDN URL provides faster global access and is automatically used for public files.

## Testing

Run the upload tests to verify everything works:

```bash
# Test all upload functionality
npm run test:upload

# Test with coverage
npm run test:coverage
```

## Troubleshooting

### Common Issues

**"Access Denied" Error**

- Verify Access Key and Secret Key are correct
- Ensure keys have Spaces read/write permissions
- Check that the bucket name matches exactly

**"Bucket Not Found" Error**

- Verify bucket name in environment variables
- Ensure region in endpoint matches bucket region
- Check that the bucket exists and is accessible

**"Network Timeout" Error**

- Check internet connection
- Verify endpoint URL format: `https://[region].digitaloceanspaces.com`
- Try different region if connectivity issues persist

**File Upload Fails**

- Check file size (must be under 5MB)
- Verify file type (JPEG, PNG, WebP for images)
- Ensure bucket has public write permissions

**CDN Not Working**

- Verify Space is set to "Public" file listing
- Use CDN URL format: `https://[bucket].[region].cdn.digitaloceanspaces.com`
- Allow time for CDN propagation (up to 15 minutes)

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG=upload:*
```

This will show detailed logs for all upload operations.

## Security Considerations

- **Environment Variables**: Never commit `.env` files to version control
- **API Keys**: Rotate keys regularly and use least-privilege access
- **File Validation**: All uploads are validated for type and size
- **Public Access**: Only uploaded files are public, not the entire bucket
- **CORS**: Configure CORS settings for your mobile app domain

## Cost Optimization

- **Image Optimization**: Automatic WebP conversion reduces storage costs
- **CDN Caching**: Long cache headers reduce bandwidth costs
- **File Cleanup**: Implement cleanup for unused files (future enhancement)

## Production Deployment

For production deployment:

1. Create separate Spaces bucket for production
2. Use different API keys with production-only access
3. Configure environment variables in DigitalOcean App Platform
4. Enable monitoring and alerts for storage usage
5. Set up automated backups if needed

## Next Steps

After setup is complete:

1. ✅ Test file uploads with the API endpoints
2. 🔗 Integrate with mobile app file upload components
3. 📱 Test end-to-end file upload flow
4. 🎨 Implement persona card image generation (Phase 3)
5. 🎵 Add voice journal audio upload (Phase 2)

For questions or issues, refer to the [DigitalOcean Spaces Documentation](https://docs.digitalocean.com/products/spaces/).
