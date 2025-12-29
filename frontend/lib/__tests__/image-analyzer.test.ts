/**
 * Tests for ImageAnalyzer class
 * Validates image analysis functionality and CNN model integration
 */

import { ImageAnalyzer } from '../image-analyzer'

// Mock File and Image classes for Node.js environment
global.File = class MockFile {
  name: string
  size: number
  type: string
  
  constructor(chunks: any[], filename: string, options: any = {}) {
    this.name = filename
    this.size = chunks.reduce((acc, chunk) => acc + (chunk.length || 0), 0)
    this.type = options.type || 'application/octet-stream'
  }
} as any

global.Image = class MockImage {
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  src: string = ''
  naturalWidth: number = 224
  naturalHeight: number = 224
  
  set src(value: string) {
    setTimeout(() => {
      if (this.onload) this.onload()
    }, 0)
  }
} as any

// Mock Canvas and CanvasRenderingContext2D
global.HTMLCanvasElement = class MockCanvas {
  width: number = 224
  height: number = 224
  
  getContext(type: string) {
    if (type === '2d') {
      return {
        drawImage: jest.fn(),
        getImageData: jest.fn(() => ({
          data: new Uint8ClampedArray(224 * 224 * 4).fill(128), // Gray image
          width: 224,
          height: 224
        }))
      }
    }
    return null
  }
} as any

global.document = {
  createElement: (tagName: string) => {
    if (tagName === 'canvas') {
      return new global.HTMLCanvasElement()
    }
    return {}
  }
} as any

global.URL = {
  createObjectURL: jest.fn(() => 'blob:mock-url'),
  revokeObjectURL: jest.fn()
} as any

describe('ImageAnalyzer', () => {
  let analyzer: ImageAnalyzer

  beforeEach(() => {
    analyzer = new ImageAnalyzer()
  })

  describe('Initialization', () => {
    test('should initialize with default parameters', () => {
      expect(analyzer).toBeDefined()
    })

    test('should initialize with custom device', () => {
      const customAnalyzer = new ImageAnalyzer(undefined, 'cuda')
      expect(customAnalyzer).toBeDefined()
    })
  })

  describe('Image Validation', () => {
    test('should validate correct image file', () => {
      const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const result = analyzer.validateImage(validFile)
      
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    test('should reject oversized image', () => {
      const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })
      const result = analyzer.validateImage(largeFile)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('exceeds maximum allowed size')
    })

    test('should reject non-image file', () => {
      const textFile = new File(['test'], 'test.txt', { type: 'text/plain' })
      const result = analyzer.validateImage(textFile)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('File must be an image')
    })

    test('should reject unsupported image format', () => {
      const unsupportedFile = new File(['test'], 'test.gif', { type: 'image/gif' })
      const result = analyzer.validateImage(unsupportedFile)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Unsupported image format')
    })
  })

  describe('Image Metadata Extraction', () => {
    test('should extract metadata from image file', async () => {
      const imageFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      const metadata = await analyzer.extractImageMetadata(imageFile)
      
      expect(metadata).toEqual({
        width: 224,
        height: 224,
        format: 'image/jpeg',
        sizeBytes: 4,
        hasAlpha: false
      })
    })

    test('should detect PNG with alpha channel', async () => {
      const pngFile = new File(['test'], 'test.png', { type: 'image/png' })
      
      const metadata = await analyzer.extractImageMetadata(pngFile)
      
      expect(metadata.hasAlpha).toBe(true)
    })
  })

  describe('Image Preprocessing', () => {
    test('should preprocess image successfully', async () => {
      const imageFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      const imageData = await analyzer.preprocessImage(imageFile)
      
      expect(imageData).toBeDefined()
      expect(imageData.width).toBe(224)
      expect(imageData.height).toBe(224)
      expect(imageData.data).toBeInstanceOf(Uint8ClampedArray)
    })
  })

  describe('Skin Condition Analysis', () => {
    test('should analyze skin condition successfully', async () => {
      const imageFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      const analysis = await analyzer.analyzeSkinCondition(imageFile)
      
      expect(analysis).toBeDefined()
      expect(analysis.analysisId).toBeDefined()
      expect(analysis.conditions).toBeInstanceOf(Array)
      expect(analysis.confidenceScores).toBeDefined()
      expect(analysis.processingTime).toBeGreaterThan(0)
      expect(analysis.imageMetadata).toBeDefined()
      expect(analysis.timestamp).toBeInstanceOf(Date)
    })

    test('should return top conditions with confidence scores', async () => {
      const imageFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      const analysis = await analyzer.analyzeSkinCondition(imageFile)
      
      expect(analysis.conditions.length).toBeGreaterThan(0)
      expect(analysis.conditions.length).toBeLessThanOrEqual(5)
      
      // Check that conditions are sorted by confidence
      for (let i = 1; i < analysis.conditions.length; i++) {
        expect(analysis.conditions[i].confidence).toBeLessThanOrEqual(analysis.conditions[i - 1].confidence)
      }
      
      // Check condition structure
      const condition = analysis.conditions[0]
      expect(condition).toHaveProperty('condition')
      expect(condition).toHaveProperty('confidence')
      expect(condition).toHaveProperty('severity')
      expect(condition).toHaveProperty('category')
      expect(condition).toHaveProperty('requiresAttention')
      expect(condition).toHaveProperty('description')
      
      expect(typeof condition.confidence).toBe('number')
      expect(condition.confidence).toBeGreaterThanOrEqual(0)
      expect(condition.confidence).toBeLessThanOrEqual(1)
    })

    test('should handle analysis errors gracefully', async () => {
      const invalidFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })
      
      const analysis = await analyzer.analyzeSkinCondition(invalidFile)
      
      expect(analysis).toBeDefined()
      expect(analysis.conditions.length).toBe(1)
      expect(analysis.conditions[0].condition).toBe('Analysis Error')
      expect(analysis.conditions[0].confidence).toBe(0)
    })
  })

  describe('Visual Feature Extraction', () => {
    test('should extract visual features successfully', async () => {
      const imageFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      const features = await analyzer.extractVisualFeatures(imageFile)
      
      expect(features).toBeDefined()
      expect(features.colorAnalysis).toBeDefined()
      expect(features.textureFeatures).toBeDefined()
      expect(features.shapeFeatures).toBeDefined()
      expect(features.symmetryAnalysis).toBeDefined()
    })

    test('should extract color analysis features', async () => {
      const imageFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      const features = await analyzer.extractVisualFeatures(imageFile)
      
      expect(features.colorAnalysis.meanRgb).toBeInstanceOf(Array)
      expect(features.colorAnalysis.meanRgb.length).toBe(3)
      expect(features.colorAnalysis.stdRgb).toBeInstanceOf(Array)
      expect(features.colorAnalysis.stdRgb.length).toBe(3)
      expect(typeof features.colorAnalysis.dominantColorChannel).toBe('number')
    })

    test('should extract texture features', async () => {
      const imageFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      const features = await analyzer.extractVisualFeatures(imageFile)
      
      expect(typeof features.textureFeatures.textureVariance).toBe('number')
      expect(typeof features.textureFeatures.textureMean).toBe('number')
      expect(typeof features.textureFeatures.textureContrast).toBe('number')
    })

    test('should extract shape features', async () => {
      const imageFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      const features = await analyzer.extractVisualFeatures(imageFile)
      
      expect(typeof features.shapeFeatures.largestArea).toBe('number')
      expect(typeof features.shapeFeatures.perimeter).toBe('number')
      expect(typeof features.shapeFeatures.circularity).toBe('number')
    })

    test('should extract symmetry analysis', async () => {
      const imageFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      const features = await analyzer.extractVisualFeatures(imageFile)
      
      expect(typeof features.symmetryAnalysis.verticalSymmetryScore).toBe('number')
      expect(features.symmetryAnalysis.verticalSymmetryScore).toBeGreaterThanOrEqual(0)
      expect(features.symmetryAnalysis.verticalSymmetryScore).toBeLessThanOrEqual(1)
    })
  })

  describe('Condition Information Mapping', () => {
    test('should provide detailed information for known conditions', async () => {
      const imageFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      const analysis = await analyzer.analyzeSkinCondition(imageFile)
      const condition = analysis.conditions[0]
      
      expect(condition.description).toBeDefined()
      expect(condition.description.length).toBeGreaterThan(0)
      expect(condition.category).toBeDefined()
      expect(['mild', 'moderate', 'severe']).toContain(condition.severity)
      expect(typeof condition.requiresAttention).toBe('boolean')
    })
  })

  describe('BiomedCLIP Model Integration', () => {
    test('should use BiomedCLIP-style disease prompts', async () => {
      const imageFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      const analysis = await analyzer.analyzeSkinCondition(imageFile)
      
      // Should detect conditions that match BiomedCLIP disease categories
      const detectedConditions = analysis.conditions.map(c => c.condition.toLowerCase())
      const expectedConditions = [
        'healthy skin', 'acne', 'eczema', 'psoriasis', 'fungal infection',
        'melanoma', 'basal cell carcinoma', 'seborrheic keratosis', 'dermatitis', 'rosacea'
      ]
      
      // At least one condition should match expected medical conditions
      const hasValidCondition = detectedConditions.some(detected => 
        expectedConditions.some(expected => 
          detected.includes(expected.replace(' ', '').toLowerCase()) ||
          expected.includes(detected.replace(' ', '').toLowerCase())
        )
      )
      
      expect(hasValidCondition).toBe(true)
    })
  })

  describe('Performance Requirements', () => {
    test('should complete analysis within reasonable time', async () => {
      const imageFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      const startTime = Date.now()
      const analysis = await analyzer.analyzeSkinCondition(imageFile)
      const endTime = Date.now()
      
      const actualTime = endTime - startTime
      const reportedTime = analysis.processingTime
      
      // Processing time should be reasonable (less than 5 seconds for mock)
      expect(actualTime).toBeLessThan(5000)
      expect(reportedTime).toBeLessThan(5000)
      expect(reportedTime).toBeGreaterThan(0)
    })
  })
})