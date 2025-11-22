import { describe, it, expect, beforeEach } from 'vitest'
import { DeepSeekService } from '../services/DeepSeekService'

describe('DeepSeekService', () => {
  let service: DeepSeekService

  beforeEach(() => {
    service = new DeepSeekService()
  })

  describe('initialization', () => {
    it('should initialize with default config', () => {
      expect(service).toBeDefined()
      expect(service).toBeInstanceOf(DeepSeekService)
    })

    it('should accept custom config', () => {
      const customService = new DeepSeekService({
        apiKey: 'test-key',
        model: 'test-model',
        temperature: 0.5
      })
      expect(customService).toBeDefined()
    })
  })

  describe('sendMessage', () => {
    it('should return demo response when using demo key', async () => {
      const response = await service.sendMessage('help')
      
      expect(response).toBeDefined()
      expect(response.content).toContain('help')
      expect(typeof response.content).toBe('string')
    })

    it('should handle React component requests', async () => {
      const response = await service.sendMessage('create a React component')
      
      expect(response.content).toContain('React')
      expect(response.content).toContain('component')
    })
  })

  describe('getCodeCompletion', () => {
    it('should return code completion suggestions', async () => {
      const completions = await service.getCodeCompletion(
        'console.',
        'javascript',
        { line: 1, column: 8 }
      )
      
      expect(completions).toBeDefined()
      expect(Array.isArray(completions)).toBe(true)
    })
  })

  describe('explainCode', () => {
    it('should explain JavaScript code', async () => {
      const explanation = await service.explainCode(
        'const sum = (a, b) => a + b',
        'javascript'
      )
      
      expect(explanation).toBeDefined()
      expect(typeof explanation).toBe('string')
      expect(explanation.length).toBeGreaterThan(0)
    })
  })

  describe('configuration', () => {
    it('should update config', () => {
      service.updateConfig({ temperature: 0.8 })
      // Config update should not throw
    })

    it('should clear conversation history', () => {
      service.clearConversationHistory()
      // Should not throw
    })
  })
})