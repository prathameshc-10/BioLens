# BioLens Setup Guide

## 🚀 Quick Start

This guide will help you set up the BioLens Next.js application with Cloudinary integration and BiomedCLIP analysis.

## 📋 Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Version 8 or higher
- **Cloudinary Account**: Free account at [cloudinary.com](https://cloudinary.com)

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Install Cloudinary (if not already installed)
npm install cloudinary
```

### 2. Cloudinary Setup

1. **Create Cloudinary Account**:
   - Go to [cloudinary.com](https://cloudinary.com)
   - Sign up for a free account
   - Note your Cloud Name, API Key, and API Secret

2. **Configure Environment Variables**:
   ```bash
   # Copy the example environment file
   cp .env.example .env.local
   
   # Edit .env.local with your Cloudinary credentials
   CLOUDINARY_CLOUD_NAME=your_cloud_name_here
   CLOUDINARY_API_KEY=your_api_key_here
   CLOUDINARY_API_SECRET=your_api_secret_here
   ```

### 3. Environment Configuration

Create `.env.local` file in the frontend directory:

```bash
# Required - Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional - Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
BIOMEDCLIP_API_URL=https://huggingface.co/spaces/Ajjack404/BioLens/run/predict

# Optional - Security
SESSION_SECRET=your_random_session_secret_here
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
```

## 🏃‍♂️ Running the Application

### Development Mode

```bash
# Start the development server
npm run dev

# Open your browser to
http://localhost:3000
```

### Production Build

```bash
# Build the application
npm run build

# Start the production server
npm start
```

## 🧪 Testing the Setup

### 1. Test Image Upload

1. Open the application in your browser
2. Upload a test image (JPEG, PNG, or WebP)
3. Check the browser console for upload success messages
4. Verify the image appears in your Cloudinary dashboard

### 2. Test Analysis

1. Upload an image
2. Optionally add symptom descriptions
3. Click "Analyze with BiomedCLIP"
4. Check for analysis results or fallback mock data

### 3. Test Cleanup

1. Complete an analysis
2. Click "Analyze Another Image"
3. Check Cloudinary dashboard - previous image should be deleted

## 🔧 API Endpoints

The application provides three main API endpoints:

### Upload API
```
POST /api/upload
Content-Type: multipart/form-data

Body: FormData with 'file' field
```

### Analysis API
```
POST /api/analyze
Content-Type: application/json

Body: {
  "imageUrl": "https://cloudinary-url",
  "symptoms": "optional symptom description",
  "sessionId": "optional session id"
}
```

### Cleanup API
```
DELETE /api/cleanup?publicId=image_public_id
POST /api/cleanup (for bulk cleanup)
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Cloudinary Upload Fails
**Error**: "Failed to upload image"
**Solutions**:
- Check your Cloudinary credentials in `.env.local`
- Verify your Cloudinary account is active
- Check file size (must be < 10MB)
- Ensure file is a valid image format

#### 2. Environment Variables Not Loading
**Error**: "CLOUDINARY_CLOUD_NAME is undefined"
**Solutions**:
- Ensure `.env.local` file exists in the frontend directory
- Restart the development server after adding environment variables
- Check that variable names match exactly (case-sensitive)

#### 3. BiomedCLIP API Unavailable
**Behavior**: Analysis uses mock data
**Solutions**:
- This is expected behavior when the external API is unavailable
- The application will automatically fall back to intelligent mock analysis
- Check the console for "BiomedCLIP API unavailable" messages

#### 4. Build Errors
**Error**: TypeScript or build errors
**Solutions**:
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Try building again
npm run build
```

### Debug Mode

Enable detailed logging by adding to `.env.local`:
```bash
NODE_ENV=development
DEBUG=true
```

## 📁 Project Structure

```
frontend/
├── app/
│   ├── api/                 # API Routes
│   │   ├── upload/         # Image upload to Cloudinary
│   │   ├── analyze/        # BiomedCLIP analysis
│   │   └── cleanup/        # Image cleanup
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx            # Main application
├── components/
│   ├── ui/                 # UI components
│   └── symptom-input.tsx   # Symptom input component
├── lib/
│   ├── api-client.ts       # API client functions
│   └── utils.ts
├── .env.local              # Environment variables (create this)
├── .env.example            # Environment template
└── package.json
```

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add BioLens Next.js application"
   git push origin main
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables in Vercel dashboard:
     - `CLOUDINARY_CLOUD_NAME`
     - `CLOUDINARY_API_KEY`
     - `CLOUDINARY_API_SECRET`
   - Deploy

3. **Configure Domain** (Optional):
   - Add custom domain in Vercel dashboard
   - Update `NEXT_PUBLIC_APP_URL` environment variable

### Other Deployment Options

#### Netlify
```bash
# Build command
npm run build

# Publish directory
.next

# Environment variables (same as Vercel)
```

#### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔒 Security Considerations

### Production Checklist

- [ ] Environment variables are set securely
- [ ] Cloudinary API secret is not exposed to client
- [ ] File upload validation is working
- [ ] Image cleanup is functioning
- [ ] Rate limiting is configured (if needed)
- [ ] HTTPS is enabled in production

### Security Features

- **File Validation**: Type, size, and format checking
- **Automatic Cleanup**: Images deleted after analysis
- **Secure URLs**: HTTPS-only image delivery
- **Session Isolation**: Unique session IDs
- **Input Sanitization**: Symptom text validation

## 📊 Monitoring

### Logs to Monitor

- **Upload Success/Failure**: Check Cloudinary dashboard
- **Analysis Performance**: Monitor API response times
- **Error Rates**: Track failed uploads and analyses
- **Storage Usage**: Monitor Cloudinary storage quota

### Cloudinary Dashboard

Monitor your usage at:
- **Media Library**: View uploaded images
- **Analytics**: Usage statistics
- **Settings**: API credentials and limits

## 🆘 Support

### Getting Help

1. **Check Console**: Browser developer tools for client errors
2. **Check Server Logs**: Terminal output for server errors
3. **Cloudinary Logs**: Dashboard for upload/storage issues
4. **GitHub Issues**: Report bugs or request features

### Useful Commands

```bash
# Check environment variables
npm run env

# Clear cache and rebuild
rm -rf .next && npm run build

# Check dependencies
npm list

# Update dependencies
npm update
```

## ✅ Success Indicators

Your setup is working correctly when:

- ✅ Application loads without errors
- ✅ Images upload successfully to Cloudinary
- ✅ Analysis returns results (real or mock)
- ✅ Images are automatically cleaned up
- ✅ No console errors during normal operation
- ✅ Build completes successfully

## 🎉 Next Steps

Once your setup is complete:

1. **Customize Styling**: Modify the UI to match your brand
2. **Add Features**: Implement additional functionality
3. **Optimize Performance**: Add caching and optimization
4. **Monitor Usage**: Set up analytics and monitoring
5. **Scale**: Consider additional deployment options

Your BioLens application is now ready for development and deployment!