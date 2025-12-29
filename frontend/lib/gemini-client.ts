/**
 * Gemini API Client for BioLens Application
 * Handles authentication and communication with Google Gemini AI
 */

import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai'

export interface GeminiConfig {
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
  safetySettings?: any[]
}

export interface GeminiResponse {
  success: boolean
  content?: string
  error?: string
  metadata?: {
    modelUsed: string
    processingTime: number
    tokensUsed?: number
  }
}

export interface GeminiRequest {
  prompt: string
  systemInstruction?: string
  context?: any
}

/**
 * Gemini API Client Class
 * Provides secure authentication and communication with Google Gemini AI
 */
export class GeminiAPIClient {
  private genAI: GoogleGenerativeAI | null = null
  private model: GenerativeModel | null = null
  private config: GeminiConfig
  private isInitialized = false

  constructor(config?: Partial<GeminiConfig>) {
    // Default configuration optimized for medical consultation
    this.config = {
      apiKey: process.env.GEMINI_API_KEY || '',
      model: 'gemini-1.5-pro',
      temperature: 0.3, // Lower temperature for medical consistency
      maxTokens: 2048,
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ],
      ...config
    }
  }

  /**
   * Initialize the Gemini client with authentication
   */
  async initialize(): Promise<boolean> {
    try {
      if (!this.config.apiKey) {
        throw new Error('Gemini API key is required')
      }

      // Initialize Google Generative AI
      this.genAI = new GoogleGenerativeAI(this.config.apiKey)

      // Configure the model
      const generationConfig: GenerationConfig = {
        temperature: this.config.temperature,
        maxOutputTokens: this.config.maxTokens,
      }

      // Get the model with configuration
      this.model = this.genAI.getGenerativeModel({
        model: this.config.model,
        generationConfig,
        safetySettings: this.config.safetySettings
      })

      this.isInitialized = true
      return true
    } catch (error) {
      console.error('Failed to initialize Gemini client:', error)
      this.isInitialized = false
      return false
    }
  }

  /**
   * Validate API key by making a test request
   */
  async validateAPIKey(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize()
        if (!initialized) return false
      }

      if (!this.model) {
        return false
      }

      // Make a simple test request
      const result = await this.model.generateContent('Hello')
      return result.response.text().length > 0
    } catch (error) {
      console.error('API key validation failed:', error)
      return false
    }
  }

  /**
   * Send a consultation request to Gemini
   */
  async sendConsultationRequest(request: GeminiRequest): Promise<GeminiResponse> {
    const startTime = Date.now()

    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize()
        if (!initialized) {
          throw new Error('Failed to initialize Gemini client')
        }
      }

      if (!this.model) {
        throw new Error('Gemini model not initialized')
      }

      // Construct the full prompt with system instruction if provided
      let fullPrompt = request.prompt
      if (request.systemInstruction) {
        fullPrompt = `${request.systemInstruction}\n\n${request.prompt}`
      }

      // Generate content
      const result = await this.model.generateContent(fullPrompt)
      const response = await result.response
      const content = response.text()

      const processingTime = Date.now() - startTime

      return {
        success: true,
        content,
        metadata: {
          modelUsed: this.config.model,
          processingTime,
          tokensUsed: response.usageMetadata?.totalTokenCount
        }
      }
    } catch (error) {
      const processingTime = Date.now() - startTime
      
      console.error('Gemini API request failed:', error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          modelUsed: this.config.model,
          processingTime
        }
      }
    }
  }

  /**
   * Handle rate limiting with exponential backoff
   */
  async handleRateLimit(error: any): Promise<void> {
    // Extract retry delay from error if available
    const retryAfter = error.retryAfter || 1000 // Default 1 second
    
    // Exponential backoff: wait for the specified time
    await new Promise(resolve => setTimeout(resolve, retryAfter))
  }

  /**
   * Configure model settings
   */
  configureModel(settings: Partial<GeminiConfig>): void {
    this.config = { ...this.config, ...settings }
    this.isInitialized = false // Force re-initialization with new settings
  }

  /**
   * Get current configuration
   */
  getConfig(): GeminiConfig {
    return { ...this.config }
  }

  /**
   * Check if client is properly initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.model !== null
  }

  /**
   * Reset the client (useful for testing or configuration changes)
   */
  reset(): void {
    this.genAI = null
    this.model = null
    this.isInitialized = false
  }
}

/**
 * Create a singleton instance of the Gemini client
 */
let geminiClientInstance: GeminiAPIClient | null = null

/**
 * Get the singleton Gemini client instance
 */
export function getGeminiClient(): GeminiAPIClient {
  if (!geminiClientInstance) {
    geminiClientInstance = new GeminiAPIClient()
  }
  return geminiClientInstance
}

/**
 * Initialize the global Gemini client
 */
export async function initializeGeminiClient(): Promise<boolean> {
  const client = getGeminiClient()
  return await client.initialize()
}

/**
 * Validate the Gemini API configuration
 */
export async function validateGeminiConfig(): Promise<{ valid: boolean; error?: string }> {
  try {
    const client = getGeminiClient()
    const isValid = await client.validateAPIKey()
    
    if (!isValid) {
      return {
        valid: false,
        error: 'Invalid API key or configuration'
      }
    }

    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Configuration validation failed'
    }
  }
}

/**
 * Test the Gemini connection with a simple request
 */
export async function testGeminiConnection(): Promise<GeminiResponse> {
  const client = getGeminiClient()
  
  return await client.sendConsultationRequest({
    prompt: 'Respond with "Connection successful" if you can read this message.',
    systemInstruction: 'You are a test assistant. Respond briefly and clearly.'
  })
}