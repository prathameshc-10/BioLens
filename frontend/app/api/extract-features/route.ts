import { NextRequest, NextResponse } from 'next/server'

interface FeatureExtractionRequest {
  imageUrl: string
  sessionId?: string
}

interface VisualFeatures {
  colorAnalysis: {
    meanRgb: number[]
    stdRgb: number[]
    dominantColorChannel: number
  }
  textureFeatures: {
    textureVariance: number
    textureMean: number
    textureContrast: number
  }
  shapeFeatures: {
    largestArea: number
    perimeter: number
    circularity: number
  }
  symmetryAnalysis: {
    verticalSymmetryScore: number
  }
}

interface FeatureExtractionResponse {
  success: boolean
  features?: VisualFeatures
  sessionId?: string
  error?: string
  processingTime?: number
}

/**
 * Server-side visual feature extraction
 * Generates mock features based on image URL characteristics
 */
function extractServerSideFeatures(imageUrl: string): VisualFeatures {
  // Generate consistent features based on URL hash
  let urlHash = 0
  for (let i = 0; i < imageUrl.length; i++) {
    urlHash = ((urlHash << 5) - urlHash + imageUrl.charCodeAt(i)) & 0xffffffff
  }
  
  // Use URL hash as seed for consistent results
  const random = (seed: number) => {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
  }
  
  // Generate color analysis
  const meanRgb = [
    random(urlHash + 1) * 0.5 + 0.25,
    random(urlHash + 2) * 0.5 + 0.25,
    random(urlHash + 3) * 0.5 + 0.25
  ]
  
  const stdRgb = [
    random(urlHash + 4) * 0.2 + 0.05,
    random(urlHash + 5) * 0.2 + 0.05,
    random(urlHash + 6) * 0.2 + 0.05
  ]
  
  const dominantColorChannel = Math.floor(random(urlHash + 7) * 3)
  
  // Generate texture features
  const textureVariance = random(urlHash + 8) * 1000 + 500
  const textureMean = random(urlHash + 9) * 100 + 50
  const textureContrast = random(urlHash + 10) * 150 + 50
  
  // Generate shape features
  const largestArea = Math.floor(random(urlHash + 11) * 40000 + 10000)
  const perimeter = Math.floor(random(urlHash + 12) * 800 + 400)
  const circularity = random(urlHash + 13) * 0.8 + 0.2
  
  // Generate symmetry analysis
  const verticalSymmetryScore = random(urlHash + 14) * 0.6 + 0.4
  
  return {
    colorAnalysis: {
      meanRgb,
      stdRgb,
      dominantColorChannel
    },
    textureFeatures: {
      textureVariance,
      textureMean,
      textureContrast
    },
    shapeFeatures: {
      largestArea,
      perimeter,
      circularity
    },
    symmetryAnalysis: {
      verticalSymmetryScore
    }
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body: FeatureExtractionRequest = await request.json()
    const { imageUrl, sessionId } = body

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      )
    }

    console.log('🔍 Starting visual feature extraction...')
    console.log('🖼️ Image URL:', imageUrl)

    // Use server-side feature extraction
    const features = extractServerSideFeatures(imageUrl)
    
    const processingTime = Date.now() - startTime
    
    console.log(`✅ Feature extraction completed in ${processingTime}ms`)

    const response: FeatureExtractionResponse = {
      success: true,
      features,
      sessionId: sessionId || `session-${Date.now()}`,
      processingTime
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Feature extraction error:', error)
    
    const processingTime = Date.now() - startTime
    
    const response: FeatureExtractionResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Feature extraction failed',
      processingTime
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}