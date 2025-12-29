/**
 * Tests for Gemini API Client
 * Validates authentication, configuration, and basic functionality
 */

import { GeminiAPIClient, getGeminiClient, validateGeminiConfig, testGeminiConnection } from '../gemini-client'

// Mock the Google Generative AI SDK
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => 'Mock response from Gemini',
          usageMetadata: {
            totalTokenCount: 50
          }
        }
      })
    })
  }))
}))

describe('GeminiAPIClient', () => {
  let client: GeminiAPIClient

  beforeEach(() => {
    // Reset environment variable
    process.env.GEMINI_API_KEY = 'test-api-key'
    client = new GeminiAPIClient()
  })

  afterEach(() => {
    client.reset()
    delete process.env.GEMINI_API_KEY
  })

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      expect(client).toBeDefined()
      expect(client.isReady()).toBe(false)
    })

    test('should initialize with custom configuration', () => {
      const customClient = new GeminiAPIClient({
        model: 'gemini-1.5-flash',
        temperature: 0.5,
        maxTokens: 1024
      })
      
      const config = customClient.getConfig()
      expect(config.model).toBe('gemini-1.5-flash')
      expect(config.temperature).toBe(0.5)
      expect(config.maxTokens).toBe(1024)
    })

    test('should initialize successfully with valid API key', async () => {
      const result = await client.initialize()
      expect(result).toBe(true)
      expect(client.isReady()).toBe(true)
    })

    test('should fail initialization without API key', async () => {
      delete process.env.GEMINI_API_KEY
      const clientWithoutKey = new GeminiAPIClient()
      
      const result = await clientWithoutKey.initialize()
      expect(result).toBe(false)
      expect(clientWithoutKey.isReady()).toBe(false)
    })
  })

  describe('Configuration Management', () => {
    test('should get current configuration', () => {
      const config = client.getConfig()
      
      expect(config).toHaveProperty('apiKey')
      expect(config).toHaveProperty('model')
      expect(config).toHaveProperty('temperature')
      expect(config).toHaveProperty('maxTokens')
      expect(config).toHaveProperty('safetySettings')
    })

    test('should configure model settings', () => {
      client.configureModel({
        temperature: 0.7,
        maxTokens: 4096
      })
      
      const config = client.getConfig()
      expect(config.temperature).toBe(0.7)
      expect(config.maxTokens).toBe(4096)
    })

    test('should have medical-optimized default settings', () => {
      const config = client.getConfig()
      
      expect(config.model).toBe('gemini-1.5-pro')
      expect(config.temperature).toBe(0.3) // Lower for medical consistency
      expect(config.maxTokens).toBe(2048)
      expect(config.safetySettings).toBeDefined()
      expect(config.safetySettings?.length).toBeGreaterThan(0)
    })
  })

  describe('API Key Validation', () => {
    test('should validate API key successfully', async () => {
      const result = await client.validateAPIKey()
      expect(result).toBe(true)
    })

    test('should handle API key validation failure', async () => {
      // Mock a failure scenario
      const { GoogleGenerativeAI } = require('@google/generative-ai')
      GoogleGenerativeAI.mockImplementationOnce(() => ({
        getGenerativeModel: () => ({
          generateContent: jest.fn().mockRejectedValue(new Error('Invalid API key'))
        })
      }))

      const failingClient = new GeminiAPIClient()
      const result = await failingClient.validateAPIKey()
      expect(result).toBe(false)
    })
  })

  describe('Consultation Requests', () => {
    test('should send consultation request successfully', async () => {
      const request = {
        prompt: 'Test medical consultation prompt',
        systemInstruction: 'You are a medical AI assistant'
      }

      const response = await client.sendConsultationRequest(request)
      
      expect(response.success).toBe(true)
      expect(response.content).toBe('Mock response from Gemini')
      expect(response.metadata).toBeDefined()
      expect(response.metadata?.modelUsed).toBe('gemini-1.5-pro')
      expect(response.metadata?.processingTime).toBeGreaterThan(0)
      expect(response.metadata?.tokensUsed).toBe(50)
    })

    test('should handle consultation request without system instruction', async () => {
      const request = {
        prompt: 'Simple test prompt'
      }

      const response = await client.sendConsultationRequest(request)
      
      expect(response.success).toBe(true)
      expect(response.content).toBeDefined()
    })

    test('should handle consultation request failure', async () => {
      // Mock a failure scenario
      const { GoogleGenerativeAI } = require('@google/generative-ai')
      GoogleGenerativeAI.mockImplementationOnce(() => ({
        getGenerativeModel: () => ({
          generateContent: jest.fn().mockRejectedValue(new Error('API request failed'))
        })
      }))

      const failingClient = new GeminiAPIClient()
      const request = {
        prompt: 'Test prompt'
      }

      const response = await failingClient.sendConsultationRequest(request)
      
      expect(response.success).toBe(false)
      expect(response.error).toBe('API request failed')
      expect(response.metadata?.processingTime).toBeGreaterThan(0)
    })
  })

  describe('Rate Limiting', () => {
    test('should handle rate limiting', async () => {
      const rateLimitError = {
        retryAfter: 1000
      }

      const startTime = Date.now()
      await client.handleRateLimit(rateLimitError)
      const endTime = Date.now()

      expect(endTime - startTime).toBeGreaterThanOrEqual(1000)
    })

    test('should use default retry delay when not specified', async () => {
      const error = {}

      const startTime = Date.now()
      await client.handleRateLimit(error)
      const endTime = Date.now()

      expect(endTime - startTime).toBeGreaterThanOrEqual(1000)
    })
  })

  describe('Client Reset', () => {
    test('should reset client state', async () => {
      await client.initialize()
      expect(client.isReady()).toBe(true)

      client.reset()
      expect(client.isReady()).toBe(false)
    })
  })
})

describe('Singleton Functions', () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-api-key'
  })

  afterEach(() => {
    delete process.env.GEMINI_API_KEY
  })

  describe('getGeminiClient', () => {
    test('should return singleton instance', () => {
      const client1 = getGeminiClient()
      const client2 = getGeminiClient()
      
      expect(client1).toBe(client2)
    })
  })

  describe('validateGeminiConfig', () => {
    test('should validate configuration successfully', async () => {
      const result = await validateGeminiConfig()
      
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    test('should handle configuration validation failure', async () => {
      // Mock a failure scenario
      const { GoogleGenerativeAI } = require('@google/generative-ai')
      GoogleGenerativeAI.mockImplementationOnce(() => ({
        getGenerativeModel: () => ({
          generateContent: jest.fn().mockRejectedValue(new Error('Configuration error'))
        })
      }))

      const result = await validateGeminiConfig()
      
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('testGeminiConnection', () => {
    test('should test connection successfully', async () => {
      const response = await testGeminiConnection()
      
      expect(response.success).toBe(true)
      expect(response.content).toBeDefined()
      expect(response.metadata).toBeDefined()
    })
  })
})

describe('Safety Settings', () => {
  test('should include comprehensive safety settings', () => {
    const client = new GeminiAPIClient()
    const config = client.getConfig()
    
    expect(config.safetySettings).toBeDefined()
    expect(config.safetySettings?.length).toBe(4)
    
    const categories = config.safetySettings?.map((setting: any) => setting.category)
    expect(categories).toContain('HARM_CATEGORY_HARASSMENT')
    expect(categories).toContain('HARM_CATEGORY_HATE_SPEECH')
    expect(categories).toContain('HARM_CATEGORY_SEXUALLY_EXPLICIT')
    expect(categories).toContain('HARM_CATEGORY_DANGEROUS_CONTENT')
    
    // All should block medium and above
    config.safetySettings?.forEach((setting: any) => {
      expect(setting.threshold).toBe('BLOCK_MEDIUM_AND_ABOVE')
    })
  })
})