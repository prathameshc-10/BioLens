/**
 * Simple validation script for ImageAnalyzer
 * Tests basic functionality without requiring a full test framework
 */

// Mock browser APIs for Node.js environment
global.File = class MockFile {
  constructor(chunks, filename, options = {}) {
    this.name = filename
    this.size = chunks.reduce((acc, chunk) => acc + (chunk.length || 0), 0)
    this.type = options.type || 'application/octet-stream'
  }
}

global.Image = class MockImage {
  constructor() {
    this.onload = null
    this.onerror = null
    this.naturalWidth = 224
    this.naturalHeight = 224
  }
  
  set src(value) {
    setTimeout(() => {
      if (this.onload) this.onload()
    }, 0)
  }
}

global.HTMLCanvasElement = class MockCanvas {
  constructor() {
    this.width = 224
    this.height = 224
  }
  
  getContext(type) {
    if (type === '2d') {
      return {
        drawImage: () => {},
        getImageData: () => ({
          data: new Uint8ClampedArray(224 * 224 * 4).fill(128),
          width: 224,
          height: 224
        })
      }
    }
    return null
  }
}

global.document = {
  createElement: (tagName) => {
    if (tagName === 'canvas') {
      return new global.HTMLCanvasElement()
    }
    return {}
  }
}

global.URL = {
  createObjectURL: () => 'blob:mock-url',
  revokeObjectURL: () => {}
}

// Import and test ImageAnalyzer
async function testImageAnalyzer() {
  console.log('🧪 Testing ImageAnalyzer implementation...\n')
  
  try {
    // Dynamic import to handle ES modules
    const { ImageAnalyzer } = await import('../lib/image-analyzer.js')
    
    console.log('✅ ImageAnalyzer imported successfully')
    
    // Test 1: Initialization
    console.log('\n📋 Test 1: Initialization')
    const analyzer = new ImageAnalyzer()
    console.log('✅ ImageAnalyzer initialized successfully')
    
    // Test 2: Image validation
    console.log('\n📋 Test 2: Image Validation')
    
    // Valid image
    const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const validResult = analyzer.validateImage(validFile)
    console.log(`Valid image test: ${validResult.valid ? '✅ PASS' : '❌ FAIL'}`)
    
    // Invalid image (too large)
    const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })
    const largeResult = analyzer.validateImage(largeFile)
    console.log(`Large image rejection: ${!largeResult.valid ? '✅ PASS' : '❌ FAIL'}`)
    
    // Invalid file type
    const textFile = new File(['test'], 'test.txt', { type: 'text/plain' })
    const textResult = analyzer.validateImage(textFile)
    console.log(`Non-image rejection: ${!textResult.valid ? '✅ PASS' : '❌ FAIL'}`)
    
    // Test 3: Metadata extraction
    console.log('\n📋 Test 3: Metadata Extraction')
    try {
      const metadata = await analyzer.extractImageMetadata(validFile)
      console.log('✅ Metadata extracted successfully')
      console.log(`   Width: ${metadata.width}, Height: ${metadata.height}`)
      console.log(`   Format: ${metadata.format}, Size: ${metadata.sizeBytes} bytes`)
    } catch (error) {
      console.log('❌ Metadata extraction failed:', error.message)
    }
    
    // Test 4: Image preprocessing
    console.log('\n📋 Test 4: Image Preprocessing')
    try {
      const imageData = await analyzer.preprocessImage(validFile)
      console.log('✅ Image preprocessing successful')
      console.log(`   Processed size: ${imageData.width}x${imageData.height}`)
      console.log(`   Data length: ${imageData.data.length}`)
    } catch (error) {
      console.log('❌ Image preprocessing failed:', error.message)
    }
    
    // Test 5: Skin condition analysis
    console.log('\n📋 Test 5: Skin Condition Analysis')
    try {
      const analysis = await analyzer.analyzeSkinCondition(validFile)
      console.log('✅ Skin condition analysis successful')
      console.log(`   Analysis ID: ${analysis.analysisId}`)
      console.log(`   Conditions detected: ${analysis.conditions.length}`)
      console.log(`   Processing time: ${analysis.processingTime}ms`)
      
      if (analysis.conditions.length > 0) {
        const topCondition = analysis.conditions[0]
        console.log(`   Top condition: ${topCondition.condition} (${(topCondition.confidence * 100).toFixed(1)}%)`)
        console.log(`   Severity: ${topCondition.severity}, Category: ${topCondition.category}`)
        console.log(`   Requires attention: ${topCondition.requiresAttention}`)
      }
    } catch (error) {
      console.log('❌ Skin condition analysis failed:', error.message)
    }
    
    // Test 6: Visual feature extraction
    console.log('\n📋 Test 6: Visual Feature Extraction')
    try {
      const features = await analyzer.extractVisualFeatures(validFile)
      console.log('✅ Visual feature extraction successful')
      console.log(`   Color analysis: Mean RGB [${features.colorAnalysis.meanRgb.map(v => v.toFixed(3)).join(', ')}]`)
      console.log(`   Texture variance: ${features.textureFeatures.textureVariance.toFixed(3)}`)
      console.log(`   Symmetry score: ${features.symmetryAnalysis.verticalSymmetryScore.toFixed(3)}`)
    } catch (error) {
      console.log('❌ Visual feature extraction failed:', error.message)
    }
    
    console.log('\n🎉 All tests completed!')
    
  } catch (error) {
    console.error('❌ Failed to import or test ImageAnalyzer:', error.message)
    process.exit(1)
  }
}

// Run tests
testImageAnalyzer().catch(console.error)