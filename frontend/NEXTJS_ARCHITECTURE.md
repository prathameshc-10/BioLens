# BioLens Next.js Architecture

## 🏗️ Project Structure

The BioLens project has been restructured to use Next.js for the entire application, including API routes, ML services, and image storage. This provides a unified, scalable architecture.

```
frontend/
├── app/
│   ├── api/                    # Next.js API Routes
│   │   ├── upload/
│   │   │   └── route.ts       # Cloudinary image upload
│   │   ├── analyze/
│   │   │   └── route.ts       # BiomedCLIP analysis
│   │   └── cleanup/
│   │       └── route.ts       # Image cleanup
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx               # Main application page
├── components/
│   ├── ui/                    # Reusable UI components
│   └── symptom-input.tsx      # Symptom input component
├── lib/
│   ├── api-client.ts          # API client functions
│   └── utils.ts               # Utility functions
├── .env.example               # Environment variables template
├── package.json
└── README.md
```

## 🚀 API Routes

### 1. Upload API (`/api/upload`)
**Purpose**: Handle image uploads to Cloudinary
**Method**: POST
**Features**:
- File validation (type, size, format)
- Cloudinary integration with transformations
- Automatic image optimization
- Secure upload with folder organization

**Request**:
```typescript
FormData with 'file' field containing the image
```

**Response**:
```typescript
{
  success: boolean
  imageUrl?: string
  publicId?: string
  metadata?: {
    width: number
    height: number
    format: string
    bytes: number
    uploadedAt: string
  }
  error?: string
}
```

### 2. Analysis API (`/api/analyze`)
**Purpose**: Analyze skin conditions using BiomedCLIP
**Method**: POST
**Features**:
- BiomedCLIP integration with fallback
- Enhanced symptom processing
- Comprehensive medical recommendations
- Risk assessment and categorization

**Request**:
```typescript
{
  imageUrl: string
  symptoms?: string
  sessionId?: string
}
```

**Response**:
```typescript
{
  success: boolean
  analysis?: AnalysisResult
  sessionId?: string
  error?: string
}
```

### 3. Cleanup API (`/api/cleanup`)
**Purpose**: Clean up uploaded images from Cloudinary
**Methods**: DELETE (single), POST (bulk)
**Features**:
- Individual image deletion
- Bulk cleanup for old images
- Automatic cleanup scheduling

## 🔧 Core Components

### API Client (`lib/api-client.ts`)
Centralized API communication with type safety:

```typescript
// Upload image
const uploadResponse = await uploadImage(file)

// Analyze condition
const analysisResponse = await analyzeSkinCondition(imageUrl, symptoms)

// Cleanup image
const cleanupResponse = await cleanupImage(publicId)
```

### Enhanced Features
- **File Validation**: Client-side and server-side validation
- **Error Handling**: Comprehensive error management
- **Session Management**: Unique session tracking
- **Image Optimization**: Automatic Cloudinary transformations
- **Privacy**: Automatic cleanup after analysis

## 🌐 Cloudinary Integration

### Configuration
```typescript
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})
```

### Features
- **Automatic Optimization**: Quality and format optimization
- **Transformations**: Resize to 1024x1024, convert to JPG
- **Folder Organization**: Images stored in `biolens-uploads/`
- **Secure URLs**: HTTPS delivery with CDN
- **Automatic Cleanup**: Scheduled deletion of old images

### Upload Transformations
```typescript
transformation: [
  { width: 1024, height: 1024, crop: 'limit' },
  { quality: 'auto' },
  { format: 'jpg' }
]
```

## 🧠 BiomedCLIP Integration

### Enhanced Analysis Flow
1. **Image Upload**: Secure upload to Cloudinary
2. **URL Generation**: Get public HTTPS URL
3. **BiomedCLIP API**: Send image URL + symptoms
4. **Fallback System**: Intelligent mock if API unavailable
5. **Result Processing**: Map to structured medical data
6. **Cleanup**: Automatic image deletion

### Medical Data Structure
```typescript
interface DetectedCondition {
  condition: string
  confidence: number
  severity: 'mild' | 'moderate' | 'severe'
  category: string
  requiresAttention: boolean
  description: string
}
```

### Risk Assessment
- **Low Risk**: Healthy skin, benign conditions
- **Moderate Risk**: Common conditions requiring attention
- **High Risk**: Potential cancers, emergency conditions

## 🔒 Security & Privacy

### Image Security
- **Validation**: File type, size, and format checks
- **Sanitization**: Automatic image processing and optimization
- **Temporary Storage**: Images deleted after analysis
- **Secure URLs**: HTTPS-only delivery

### Privacy Features
- **No Permanent Storage**: Images automatically deleted
- **Session Isolation**: Unique session IDs
- **Data Minimization**: Only necessary data processed
- **Encryption**: HTTPS for all communications

### Environment Variables
```bash
# Required
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
BIOMEDCLIP_API_URL=https://huggingface.co/spaces/Ajjack404/BioLens/run/predict
```

## 📱 Frontend Integration

### Updated Page Component
- **File Validation**: Client-side validation before upload
- **Progress Tracking**: Upload and analysis progress
- **Error Handling**: User-friendly error messages
- **Cleanup**: Automatic image cleanup on reset

### State Management
```typescript
const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
const [uploadedPublicId, setUploadedPublicId] = useState<string | null>(null)
const [sessionId] = useState<string>(() => generateSessionId())
```

### Enhanced User Experience
- **Real-time Feedback**: Progress indicators and status updates
- **Error Recovery**: Clear error messages with actionable advice
- **Performance**: Optimized image handling and processing
- **Accessibility**: Proper error states and loading indicators

## 🚀 Deployment

### Environment Setup
1. **Cloudinary Account**: Create account and get credentials
2. **Environment Variables**: Set up `.env.local` file
3. **Dependencies**: Install Cloudinary SDK
4. **Build**: Next.js handles API routes automatically

### Production Considerations
- **Rate Limiting**: Implement request rate limiting
- **Monitoring**: Add logging and error tracking
- **Caching**: Implement response caching where appropriate
- **Scaling**: Consider serverless deployment options

### Vercel Deployment
```bash
# Install dependencies
npm install

# Set environment variables in Vercel dashboard
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Deploy
vercel --prod
```

## 🔄 Migration Benefits

### From Separate Services to Next.js
- **Simplified Architecture**: Single codebase for frontend and backend
- **Better Performance**: Reduced latency with co-located API routes
- **Easier Deployment**: Single deployment target
- **Type Safety**: Shared types between frontend and backend
- **Development Experience**: Hot reloading for both frontend and API

### Enhanced Features
- **Image Optimization**: Automatic Cloudinary transformations
- **Better Error Handling**: Comprehensive error management
- **Session Management**: Proper session tracking
- **Privacy Compliance**: Automatic data cleanup
- **Scalability**: Serverless-ready architecture

## 🧪 Testing

### API Route Testing
```typescript
// Test upload endpoint
const formData = new FormData()
formData.append('file', imageFile)
const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
})

// Test analysis endpoint
const analysisResponse = await fetch('/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ imageUrl, symptoms })
})
```

### Integration Testing
- **Upload Flow**: File validation → Upload → URL generation
- **Analysis Flow**: Image URL → BiomedCLIP → Result processing
- **Cleanup Flow**: Analysis complete → Image deletion
- **Error Handling**: Network failures, API errors, validation errors

## 📊 Monitoring & Analytics

### Logging
- **Upload Events**: File size, format, processing time
- **Analysis Events**: Model used, processing time, confidence scores
- **Error Events**: Error types, frequency, user impact
- **Cleanup Events**: Images deleted, storage usage

### Performance Metrics
- **Upload Speed**: Time to upload and process images
- **Analysis Speed**: BiomedCLIP response times
- **Error Rates**: Success/failure ratios
- **User Experience**: End-to-end completion rates

## 🔮 Future Enhancements

### Planned Features
- **Batch Processing**: Multiple image analysis
- **User Accounts**: Save analysis history
- **Advanced Analytics**: Usage patterns and insights
- **Mobile App**: React Native integration
- **Offline Mode**: Local model for privacy-sensitive users

### Technical Improvements
- **Caching**: Redis for session and result caching
- **Queue System**: Background processing for heavy workloads
- **Real-time Updates**: WebSocket for live progress updates
- **Advanced Security**: Rate limiting, DDoS protection
- **Multi-region**: Global CDN and processing

The new Next.js architecture provides a solid foundation for scaling BioLens while maintaining excellent performance, security, and user experience.