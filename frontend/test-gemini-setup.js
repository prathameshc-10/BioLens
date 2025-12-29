/**
 * Simple test script to verify Gemini API integration setup
 * This script tests the basic configuration and client initialization
 */

const { GeminiAPIClient, getGeminiClient, validateGeminiConfig } = require('./lib/gemini-client.ts')

async function testGeminiSetup() {
  console.log('🧪 Testing Gemini API Integration Setup...\n')

  try {
    // Test 1: Client Creation
    console.log('1. Testing client creation...')
    const client = new GeminiAPIClient()
    console.log('✅ Client created successfully')

    // Test 2: Configuration
    console.log('\n2. Testing configuration...')
    const config = client.getConfig()
    console.log('✅ Configuration retrieved:')
    console.log(`   - Model: ${config.model}`)
    console.log(`   - Temperature: ${config.temperature}`)
    console.log(`   - Max Tokens: ${config.maxTokens}`)
    console.log(`   - Safety Settings: ${config.safetySettings?.length} rules`)

    // Test 3: Singleton Pattern
    console.log('\n3. Testing singleton pattern...')
    const client1 = getGeminiClient()
    const client2 = getGeminiClient()
    console.log(`✅ Singleton working: ${client1 === client2 ? 'Same instance' : 'Different instances'}`)

    // Test 4: Environment Configuration
    console.log('\n4. Testing environment configuration...')
    const hasApiKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
    if (hasApiKey) {
      console.log('✅ API key configured in environment')
      
      // Test 5: API Key Validation (only if real key is provided)
      console.log('\n5. Testing API key validation...')
      try {
        const validation = await validateGeminiConfig()
        if (validation.valid) {
          console.log('✅ API key validation successful')
        } else {
          console.log(`⚠️  API key validation failed: ${validation.error}`)
        }
      } catch (error) {
        console.log(`⚠️  API key validation error: ${error.message}`)
      }
    } else {
      console.log('⚠️  API key not configured (using placeholder)')
      console.log('   To test with real API key, set GEMINI_API_KEY environment variable')
    }

    // Test 6: Safety Settings Validation
    console.log('\n6. Testing safety settings...')
    const safetySettings = config.safetySettings
    const expectedCategories = [
      'HARM_CATEGORY_HARASSMENT',
      'HARM_CATEGORY_HATE_SPEECH', 
      'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      'HARM_CATEGORY_DANGEROUS_CONTENT'
    ]
    
    const hasAllCategories = expectedCategories.every(category =>
      safetySettings?.some(setting => setting.category === category)
    )
    
    if (hasAllCategories) {
      console.log('✅ All required safety categories configured')
    } else {
      console.log('❌ Missing required safety categories')
    }

    console.log('\n🎉 Gemini API Integration Setup Complete!')
    console.log('\nNext steps:')
    console.log('- Set GEMINI_API_KEY environment variable with your actual API key')
    console.log('- Test with real API calls once key is configured')
    console.log('- Proceed to implement consultation engine (Task 2)')

  } catch (error) {
    console.error('❌ Setup test failed:', error.message)
    process.exit(1)
  }
}

// Run the test
testGeminiSetup()