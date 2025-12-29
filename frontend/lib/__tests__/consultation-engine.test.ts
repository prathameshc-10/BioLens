/**
 * Tests for ConsultationEngine
 * Validates core functionality, error handling, and fallback mechanisms
 */

import { ConsultationEngine, ConsultationInput, ValidationResult } from '../consultation-engine'
import { GeminiAPIClient } from '../gemini-client'
import { AnalysisResult, DetectedCondition } from '../api-client'

// Mock Gemini client for testing
class MockGeminiClient extends GeminiAPIClient {
  private shouldFail: boolean = false
  private failureType: 'network' | 'auth' | 'rate_limit' | 'unknown' = 'network'

  constructor() {
    super()
  }

  setFailure(shouldFail: boolean, type: 'network' | 'auth' | 'rate_limit' | 'unknown' = 'network') {
    this.shouldFail = shouldFail
    this.failureType = type
  }

  async initialize(): Promise<boolean> {
    return !this.shouldFail
  }

  isReady(): boolean {
    return !this.shouldFail
  }

  async sendConsultationRequest(request: any): Promise<any> {
    if (this.shouldFail) {
      switch (this.failureType) {
        case 'auth':
          throw new Error('Authentication failed - invalid API key')
        case 'rate_limit':
          const error = new Error('Rate limit exceeded')
          ;(error as any).status = 429
          throw error
        case 'network':
          throw new Error('Network connection failed')
        default:
          throw new Error('Unknown error occurred')
      }
    }

    return {
      success: true,
      content: 'Mock consultation response',
      metadata: {
        modelUsed: 'mock-model',
        processingTime: 100
      }
    }
  }
}

// Test data
const mockAnalysisResult: AnalysisResult = {
  predictions: [
    {
      condition: 'Eczema (Atopic Dermatitis)',
      confidence: 0.85,
      severity: 'moderate',
      category: 'Dermatological',
      requiresAttention: true,
      description: 'Inflammatory skin condition causing itchy, red, swollen skin patches.'
    },
    {
      condition: 'Dermatitis',
      confidence: 0.65,
      severity: 'mild',
      category: 'Dermatological',
      requiresAttention: true,
      description: 'General skin inflammation.'
    }
  ],
  topPrediction: 'Eczema (Atopic Dermatitis)',
  overallConfidence: 0.85,
  riskLevel: 'moderate',
  recommendations: ['Apply moisturizer', 'Avoid triggers'],
  processingInfo: {
    imageProcessed: true,
    symptomsIncluded: true,
    modelUsed: 'BiomedCLIP',
    processingTime: 1500
  }
}

const mockConsultationInput: ConsultationInput = {
  analysisResult: mockAnalysisResult,
  symptoms: 'Itchy red patches on arms that have been present for 2 weeks',
  sessionId: 'test-session-123',
  timestamp: new Date()
}

describe('ConsultationEngine', () => {
  let engine: ConsultationEngine
  let mockClient: MockGeminiClient

  beforeEach(() => {
    mockClient = new MockGeminiClient()
    engine = new ConsultationEngine(mockClient)
  })

  describe('Input Validation', () => {
    test('should validate correct input successfully', () => {
      const result = engine.validateInput(mockConsultationInput)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should reject input without analysis result', () => {
      const invalidInput = {
        ...mockConsultationInput,
        analysisResult: null as any
      }
      
      const result = engine.validateInput(invalidInput)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Analysis result is required')
    })

    test('should reject input without session ID', () => {
      const invalidInput = {
        ...mockConsultationInput,
        sessionId: ''
      }
      
      const result = engine.validateInput(invalidInput)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Session ID is required')
    })

    test('should warn about very long symptoms', () => {
      const longSymptoms = 'a'.repeat(6000)
      const inputWithLongSymptoms = {
        ...mockConsultationInput,
        symptoms: longSymptoms
      }
      
      const result = engine.validateInput(inputWithLongSymptoms)
      
      expect(result.valid).toBe(true)
      expect(result.warnings).toContain('Symptom description is very long and may be truncated')
    })
  })

  describe('Fallback Consultation', () => {
    test('should generate fallback consultation when Gemini fails', async () => {
      mockClient.setFailure(true, 'network')
      
      const result = await engine.generateConsultation(
        mockAnalysisResult,
        mockConsultationInput.symptoms,
        mockConsultationInput.sessionId
      )
      
      expect(result.metadata.fallbackUsed).toBe(true)
      expect(result.consultation.conditionAssessment).toContain('Enhanced Analysis Results')
      expect(result.consultation.recommendations.length).toBeGreaterThanOrEqual(6)
      expect(result.consultation.medicalDisclaimer).toContain('NOT a substitute')
    })

    test('should handle high-risk conditions appropriately in fallback', async () => {
      const highRiskAnalysis = {
        ...mockAnalysisResult,
        predictions: [{
          condition: 'Potential Melanoma',
          confidence: 0.75,
          severity: 'severe',
          category: 'Oncological',
          requiresAttention: true,
          description: 'Potentially dangerous form of skin cancer.'
        }],
        topPrediction: 'Potential Melanoma',
        riskLevel: 'high' as const
      }

      mockClient.setFailure(true, 'network')
      
      const result = await engine.generateConsultation(
        highRiskAnalysis,
        'Dark mole that has changed color',
        mockConsultationInput.sessionId
      )
      
      expect(result.consultation.urgencyLevel).toBe('immediate')
      expect(result.consultation.recommendations[0]).toContain('🚨 URGENT')
      expect(result.emergencyContacts).toBeDefined()
      expect(result.emergencyContacts!.some(contact => contact.type === 'emergency')).toBe(true)
    })

    test('should correlate symptoms with conditions in fallback', async () => {
      mockClient.setFailure(true, 'network')
      
      const result = await engine.generateConsultation(
        mockAnalysisResult,
        'Very itchy skin with red patches',
        mockConsultationInput.sessionId
      )
      
      expect(result.consultation.symptomCorrelation).toContain('itching')
      expect(result.consultation.symptomCorrelation).toContain('eczema')
    })
  })

  describe('Error Handling and Circuit Breaker', () => {
    test('should track errors and update circuit breaker', async () => {
      mockClient.setFailure(true, 'network')
      
      // Generate multiple failures
      for (let i = 0; i < 3; i++) {
        await engine.generateConsultation(
          mockAnalysisResult,
          mockConsultationInput.symptoms,
          mockConsultationInput.sessionId
        )
      }
      
      const stats = engine.getErrorStatistics()
      expect(stats.totalErrors).toBe(3)
      expect(stats.recentErrors).toBe(3)
    }, 15000) // Increase timeout to 15 seconds

    test('should provide health status information', () => {
      const healthStatus = engine.getHealthStatus()
      
      expect(healthStatus).toHaveProperty('healthy')
      expect(healthStatus).toHaveProperty('circuitBreakerState')
      expect(healthStatus).toHaveProperty('recentErrorCount')
      expect(healthStatus).toHaveProperty('recommendedAction')
    })

    test('should reset error tracking', async () => {
      mockClient.setFailure(true, 'network')
      
      // Generate an error
      await engine.generateConsultation(
        mockAnalysisResult,
        mockConsultationInput.symptoms,
        mockConsultationInput.sessionId
      )
      
      expect(engine.getErrorStatistics().totalErrors).toBe(1)
      
      engine.resetErrorTracking()
      
      expect(engine.getErrorStatistics().totalErrors).toBe(0)
    })
  })

  describe('Symptom Processing', () => {
    test('should sanitize harmful content from symptoms', async () => {
      const maliciousSymptoms = '<script>alert("xss")</script>Itchy skin with javascript:void(0) content'
      
      mockClient.setFailure(true, 'network') // Use fallback to test sanitization
      
      const result = await engine.generateConsultation(
        mockAnalysisResult,
        maliciousSymptoms,
        mockConsultationInput.sessionId
      )
      
      // Should not contain script tags or javascript protocols
      expect(result.consultation.symptomCorrelation).not.toContain('<script>')
      expect(result.consultation.symptomCorrelation).not.toContain('javascript:')
      expect(result.consultation.symptomCorrelation).toContain('itchy')
    })

    test('should handle empty symptoms gracefully', async () => {
      mockClient.setFailure(true, 'network')
      
      const result = await engine.generateConsultation(
        mockAnalysisResult,
        '',
        mockConsultationInput.sessionId
      )
      
      expect(result.consultation.symptomCorrelation).toContain('No symptoms were provided')
    })
  })

  describe('Risk Assessment', () => {
    test('should assess low risk conditions correctly', async () => {
      const lowRiskAnalysis = {
        ...mockAnalysisResult,
        predictions: [{
          condition: 'Healthy Skin',
          confidence: 0.90,
          severity: 'mild',
          category: 'Normal',
          requiresAttention: false,
          description: 'No significant abnormalities detected.'
        }],
        topPrediction: 'Healthy Skin',
        riskLevel: 'low' as const
      }

      mockClient.setFailure(true, 'network')
      
      const result = await engine.generateConsultation(
        lowRiskAnalysis,
        'No symptoms',
        mockConsultationInput.sessionId
      )
      
      expect(result.consultation.urgencyLevel).toBe('monitor')
      expect(result.emergencyContacts?.some(contact => contact.type === 'emergency')).toBe(false)
    })
  })
})