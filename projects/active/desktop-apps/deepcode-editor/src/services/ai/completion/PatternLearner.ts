/**
 * Pattern Learner for Predictive Prefetching
 * Learns from user behavior to predict future completion needs
 *
 * October 2025 - Week 4 Implementation
 * Uses machine learning-inspired techniques for pattern recognition
 */
import { logger } from '../../../services/Logger';

import * as monaco from 'monaco-editor';

// Pattern types we track
enum PatternType {
  SEQUENCE = 'sequence',        // Sequential editing patterns
  STRUCTURAL = 'structural',    // Code structure patterns
  TEMPORAL = 'temporal',       // Time-based patterns
  CONTEXTUAL = 'contextual',   // Context-specific patterns
  REPETITIVE = 'repetitive',   // Repeated actions
}

// Behavior record for learning
interface BehaviorRecord {
  position: monaco.Position;
  accepted: boolean;
  completionText: string;
  timestamp: number;
  context?: string;
  language?: string;
  fileType?: string;
}

// Predicted position with confidence
interface PredictedPosition {
  position: monaco.Position;
  confidence: number;
  priority: number;
  pattern: PatternType;
  reasoning: string;
}

// Pattern statistics
interface PatternStats {
  type: PatternType;
  frequency: number;
  accuracy: number;
  lastSeen: number;
  weight: number;
}

// Edit sequence for pattern detection
interface EditSequence {
  positions: monaco.Position[];
  texts: string[];
  timestamps: number[];
  pattern?: string;
}

export class PatternLearner {
  private behaviorHistory: BehaviorRecord[] = [];
  private patternStats: Map<string, PatternStats> = new Map();
  private editSequences: EditSequence[] = [];
  private commonPatterns: Map<string, number> = new Map();
  private languagePatterns: Map<string, Map<string, number>> = new Map();
  private readonly maxHistorySize = 1000;
  private readonly sequenceWindow = 10;
  private readonly learningRate = 0.1;

  // Common coding patterns to detect
  private readonly COMMON_PATTERNS = {
    // Function definition followed by body
    FUNCTION_BODY: {
      trigger: /function\s+\w+\s*\([^)]*\)\s*\{$/,
      next: [
        { line: 1, col: 2, confidence: 0.9 },  // Inside function body
        { line: 2, col: 0, confidence: 0.7 },  // Next line
      ],
    },
    // Class definition followed by constructor/methods
    CLASS_BODY: {
      trigger: /class\s+\w+(\s+extends\s+\w+)?\s*\{$/,
      next: [
        { line: 1, col: 2, confidence: 0.8 },  // Constructor likely
        { line: 2, col: 2, confidence: 0.6 },  // First method
      ],
    },
    // If statement followed by condition and body
    IF_STATEMENT: {
      trigger: /if\s*\($/,
      next: [
        { line: 0, col: 'next', confidence: 0.9 },  // Condition
        { line: 1, col: 2, confidence: 0.7 },       // Body
      ],
    },
    // Array/object literal patterns
    ARRAY_ITEMS: {
      trigger: /\[\s*$/,
      next: [
        { line: 0, col: 'next', confidence: 0.8 },  // First item
        { line: 1, col: 2, confidence: 0.6 },       // Next item
      ],
    },
    OBJECT_PROPERTIES: {
      trigger: /\{\s*$/,
      next: [
        { line: 1, col: 2, confidence: 0.8 },  // First property
        { line: 2, col: 2, confidence: 0.6 },  // Next property
      ],
    },
    // Import statements
    IMPORT_STATEMENT: {
      trigger: /import\s+/,
      next: [
        { line: 0, col: 'next', confidence: 0.9 },  // Module specifier
        { line: 1, col: 0, confidence: 0.5 },       // Next import
      ],
    },
  };

  constructor() {
    logger.debug('[PatternLearner] Initialized with ML-based pattern recognition');
    this.initializeCommonPatterns();
  }

  /**
   * Initialize common coding patterns
   */
  private initializeCommonPatterns(): void {
    // Initialize with common patterns and their weights
    this.commonPatterns.set('dot_completion', 0.9);      // After dot
    this.commonPatterns.set('paren_completion', 0.8);    // After parenthesis
    this.commonPatterns.set('bracket_completion', 0.7);  // After bracket
    this.commonPatterns.set('newline_indent', 0.8);      // New line with indent
    this.commonPatterns.set('assignment_value', 0.7);    // After assignment
    this.commonPatterns.set('return_value', 0.9);        // After return
    this.commonPatterns.set('function_params', 0.8);     // Function parameters
    this.commonPatterns.set('type_annotation', 0.7);     // TypeScript types
  }

  /**
   * Record user behavior for learning
   */
  recordBehavior(record: BehaviorRecord): void {
    // Add to history
    this.behaviorHistory.push(record);

    // Maintain history size limit
    if (this.behaviorHistory.length > this.maxHistorySize) {
      this.behaviorHistory = this.behaviorHistory.slice(-this.maxHistorySize);
    }

    // Update patterns
    this.updatePatterns(record);

    // Learn from sequence
    this.learnFromSequence();

    // Update language-specific patterns
    if (record.language) {
      this.updateLanguagePatterns(record.language, record.completionText);
    }
  }

  /**
   * Predict next cursor positions based on learned patterns
   */
  predictNextPositions(
    model: monaco.editor.ITextModel,
    currentPosition: monaco.Position,
    recentEdits: string[]
  ): PredictedPosition[] {
    const predictions: PredictedPosition[] = [];

    // 1. Check structural patterns
    const structuralPredictions = this.predictFromStructure(model, currentPosition);
    predictions.push(...structuralPredictions);

    // 2. Check sequence patterns
    const sequencePredictions = this.predictFromSequence(currentPosition, recentEdits);
    predictions.push(...sequencePredictions);

    // 3. Check temporal patterns
    const temporalPredictions = this.predictFromTemporal(currentPosition);
    predictions.push(...temporalPredictions);

    // 4. Check contextual patterns
    const contextualPredictions = this.predictFromContext(model, currentPosition);
    predictions.push(...contextualPredictions);

    // 5. Apply language-specific boosts
    const language = model.getLanguageId();
    this.applyLanguageBoosts(predictions, language);

    // Sort by confidence and deduplicate
    return this.consolidatePredictions(predictions);
  }

  /**
   * Predict based on code structure
   */
  private predictFromStructure(
    model: monaco.editor.ITextModel,
    position: monaco.Position
  ): PredictedPosition[] {
    const predictions: PredictedPosition[] = [];
    const lineContent = model.getLineContent(position.lineNumber);

    // Check each structural pattern
    for (const [patternName, pattern] of Object.entries(this.COMMON_PATTERNS)) {
      if (pattern.trigger.test(lineContent)) {
        for (const next of pattern.next) {
          const nextLine = position.lineNumber + (next.line as number);
          const nextCol = next.col === 'next'
            ? position.column + 1
            : next.col as number;

          if (nextLine <= model.getLineCount()) {
            predictions.push({
              position: new monaco.Position(nextLine, nextCol),
              confidence: next.confidence,
              priority: 0.8,
              pattern: PatternType.STRUCTURAL,
              reasoning: `Structural pattern: ${patternName}`,
            });
          }
        }
      }
    }

    return predictions;
  }

  /**
   * Predict based on edit sequences
   */
  private predictFromSequence(
    currentPosition: monaco.Position,
    recentEdits: string[]
  ): PredictedPosition[] {
    const predictions: PredictedPosition[] = [];

    // Analyze recent edit sequence
    if (recentEdits.length >= 2) {
      // Look for repetitive patterns
      const lastEdit = recentEdits[recentEdits.length - 1];
      const pattern = this.detectRepetitivePattern(recentEdits);

      if (pattern) {
        // Predict next in sequence
        const nextPosition = this.extrapolatePosition(currentPosition, pattern);
        predictions.push({
          position: nextPosition,
          confidence: 0.7 + (pattern.frequency * 0.1),
          priority: 0.7,
          pattern: PatternType.SEQUENCE,
          reasoning: `Sequence pattern detected: ${pattern.type}`,
        });
      }

      // Check for common sequences
      if (lastEdit.includes('.')) {
        // Likely property access coming
        predictions.push({
          position: new monaco.Position(
            currentPosition.lineNumber,
            currentPosition.column + 1
          ),
          confidence: 0.8,
          priority: 0.9,
          pattern: PatternType.SEQUENCE,
          reasoning: 'Dot notation sequence',
        });
      }
    }

    return predictions;
  }

  /**
   * Predict based on temporal patterns
   */
  private predictFromTemporal(currentPosition: monaco.Position): PredictedPosition[] {
    const predictions: PredictedPosition[] = [];

    // Analyze time-based patterns
    const now = Date.now();
    const recentBehaviors = this.behaviorHistory.filter(
      b => now - b.timestamp < 60000 // Last minute
    );

    if (recentBehaviors.length > 0) {
      // Find common positions in recent time window
      const positionFrequency = new Map<string, number>();

      for (const behavior of recentBehaviors) {
        const key = `${behavior.position.lineNumber}:${behavior.position.column}`;
        positionFrequency.set(key, (positionFrequency.get(key) || 0) + 1);
      }

      // Predict frequently visited positions
      for (const [posKey, frequency] of positionFrequency.entries()) {
        if (frequency >= 2) {
          const [line, col] = posKey.split(':').map(Number);
          predictions.push({
            position: new monaco.Position(line, col),
            confidence: Math.min(0.5 + (frequency * 0.1), 0.9),
            priority: 0.6,
            pattern: PatternType.TEMPORAL,
            reasoning: `Frequently visited position (${frequency} times)`,
          });
        }
      }
    }

    return predictions;
  }

  /**
   * Predict based on context
   */
  private predictFromContext(
    model: monaco.editor.ITextModel,
    position: monaco.Position
  ): PredictedPosition[] {
    const predictions: PredictedPosition[] = [];
    const language = model.getLanguageId();

    // Get surrounding context
    const startLine = Math.max(1, position.lineNumber - 5);
    const endLine = Math.min(model.getLineCount(), position.lineNumber + 5);

    const context = model.getValueInRange({
      startLineNumber: startLine,
      startColumn: 1,
      endLineNumber: endLine,
      endColumn: model.getLineMaxColumn(endLine),
    });

    // Language-specific predictions
    if (language === 'typescript' || language === 'javascript') {
      // Check for unclosed brackets
      const openBrackets = (context.match(/\{/g) || []).length;
      const closeBrackets = (context.match(/\}/g) || []).length;

      if (openBrackets > closeBrackets) {
        // Predict closing bracket position
        predictions.push({
          position: new monaco.Position(position.lineNumber + 1, 1),
          confidence: 0.8,
          priority: 0.9,
          pattern: PatternType.CONTEXTUAL,
          reasoning: 'Unclosed bracket detected',
        });
      }

      // Check for function without return
      if (/function\s+\w+[^}]*\{[^}]*$/.test(context) && !/return/.test(context)) {
        predictions.push({
          position: new monaco.Position(position.lineNumber + 1, 3),
          confidence: 0.6,
          priority: 0.7,
          pattern: PatternType.CONTEXTUAL,
          reasoning: 'Function likely needs return statement',
        });
      }
    }

    return predictions;
  }

  /**
   * Update pattern statistics
   */
  private updatePatterns(record: BehaviorRecord): void {
    const patternKey = this.extractPatternKey(record);

    const stats = this.patternStats.get(patternKey) || {
      type: PatternType.CONTEXTUAL,
      frequency: 0,
      accuracy: 0,
      lastSeen: 0,
      weight: 0.5,
    };

    // Update stats with exponential moving average
    stats.frequency++;
    stats.accuracy = stats.accuracy * (1 - this.learningRate) +
      (record.accepted ? 1 : 0) * this.learningRate;
    stats.lastSeen = Date.now();
    stats.weight = Math.min(stats.accuracy * Math.log(stats.frequency + 1) / 10, 1.0);

    this.patternStats.set(patternKey, stats);
  }

  /**
   * Learn from edit sequences
   */
  private learnFromSequence(): void {
    if (this.behaviorHistory.length < this.sequenceWindow) {
      return;
    }

    const recentSequence = this.behaviorHistory.slice(-this.sequenceWindow);
    const sequence: EditSequence = {
      positions: recentSequence.map(r => r.position),
      texts: recentSequence.map(r => r.completionText),
      timestamps: recentSequence.map(r => r.timestamp),
    };

    // Detect pattern in sequence
    const pattern = this.detectSequencePattern(sequence);
    if (pattern) {
      sequence.pattern = pattern;
      this.editSequences.push(sequence);

      // Keep only recent sequences
      if (this.editSequences.length > 100) {
        this.editSequences = this.editSequences.slice(-100);
      }
    }
  }

  /**
   * Update language-specific patterns
   */
  private updateLanguagePatterns(language: string, completionText: string): void {
    if (!this.languagePatterns.has(language)) {
      this.languagePatterns.set(language, new Map());
    }

    const patterns = this.languagePatterns.get(language)!;

    // Extract pattern features
    const features = this.extractFeatures(completionText);

    for (const feature of features) {
      patterns.set(feature, (patterns.get(feature) || 0) + 1);
    }
  }

  /**
   * Apply language-specific confidence boosts
   */
  private applyLanguageBoosts(predictions: PredictedPosition[], language: string): void {
    const patterns = this.languagePatterns.get(language);
    if (!patterns) return;

    for (const prediction of predictions) {
      // Boost confidence based on language patterns
      const boost = Math.min(patterns.size / 1000, 0.2); // Max 20% boost
      prediction.confidence = Math.min(prediction.confidence + boost, 1.0);
    }
  }

  /**
   * Consolidate and deduplicate predictions
   */
  private consolidatePredictions(predictions: PredictedPosition[]): PredictedPosition[] {
    // Group by position
    const grouped = new Map<string, PredictedPosition[]>();

    for (const pred of predictions) {
      const key = `${pred.position.lineNumber}:${pred.position.column}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(pred);
    }

    // Merge predictions for same position
    const consolidated: PredictedPosition[] = [];

    for (const group of grouped.values()) {
      const merged = group.reduce((best, current) => {
        // Take highest confidence
        if (current.confidence > best.confidence) {
          return current;
        }
        // If same confidence, take highest priority
        if (current.confidence === best.confidence &&
            current.priority > best.priority) {
          return current;
        }
        return best;
      });

      consolidated.push(merged);
    }

    // Sort by confidence * priority
    return consolidated
      .sort((a, b) => (b.confidence * b.priority) - (a.confidence * a.priority))
      .slice(0, 10); // Top 10 predictions
  }

  /**
   * Detect repetitive patterns in edits
   */
  private detectRepetitivePattern(edits: string[]): any {
    // Simple pattern detection
    const patterns = new Map<string, number>();

    for (let i = 0; i < edits.length - 1; i++) {
      const pair = `${edits[i]}→${edits[i + 1]}`;
      patterns.set(pair, (patterns.get(pair) || 0) + 1);
    }

    // Find most common pattern
    let maxFreq = 0;
    let commonPattern = '';

    for (const [pattern, freq] of patterns.entries()) {
      if (freq > maxFreq) {
        maxFreq = freq;
        commonPattern = pattern;
      }
    }

    if (maxFreq >= 2) {
      return {
        type: commonPattern,
        frequency: maxFreq,
      };
    }

    return null;
  }

  /**
   * Extrapolate next position from pattern
   */
  private extrapolatePosition(
    current: monaco.Position,
    pattern: any
  ): monaco.Position {
    // Simple extrapolation - move to next likely position
    if (pattern.type.includes('→')) {
      // If pattern suggests moving down
      return new monaco.Position(current.lineNumber + 1, current.column);
    }

    // Default: next character position
    return new monaco.Position(current.lineNumber, current.column + 1);
  }

  /**
   * Extract pattern key from behavior
   */
  private extractPatternKey(record: BehaviorRecord): string {
    return `${record.language || 'unknown'}:${record.position.lineNumber % 10}`;
  }

  /**
   * Detect pattern in sequence
   */
  private detectSequencePattern(sequence: EditSequence): string | null {
    // Simple pattern detection based on position changes
    const deltas = [];

    for (let i = 1; i < sequence.positions.length; i++) {
      const deltaLine = sequence.positions[i].lineNumber -
                       sequence.positions[i - 1].lineNumber;
      const deltaCol = sequence.positions[i].column -
                      sequence.positions[i - 1].column;
      deltas.push(`${deltaLine},${deltaCol}`);
    }

    // Check for repeating deltas
    const deltaPattern = deltas.join('|');
    if (/(\d+,\d+\|?){2,}/.test(deltaPattern)) {
      return deltaPattern;
    }

    return null;
  }

  /**
   * Extract features from completion text
   */
  private extractFeatures(text: string): string[] {
    const features: string[] = [];

    // Extract structural features
    if (text.includes('function')) features.push('has_function');
    if (text.includes('class')) features.push('has_class');
    if (text.includes('return')) features.push('has_return');
    if (text.includes('=>')) features.push('has_arrow');
    if (/\{|\}/.test(text)) features.push('has_braces');
    if (/\(|\)/.test(text)) features.push('has_parens');
    if (/\[|\]/.test(text)) features.push('has_brackets');
    if (text.includes('.')) features.push('has_dot');

    return features;
  }

  /**
   * Get learning statistics
   */
  getStats(): {
    historySize: number;
    patternsLearned: number;
    languagePatterns: number;
    sequencesTracked: number;
    topPatterns: Array<{ pattern: string; weight: number }>;
  } {
    const topPatterns = Array.from(this.patternStats.entries())
      .sort((a, b) => b[1].weight - a[1].weight)
      .slice(0, 5)
      .map(([pattern, stats]) => ({
        pattern,
        weight: stats.weight,
      }));

    return {
      historySize: this.behaviorHistory.length,
      patternsLearned: this.patternStats.size,
      languagePatterns: this.languagePatterns.size,
      sequencesTracked: this.editSequences.length,
      topPatterns,
    };
  }

  /**
   * Clear learning history
   */
  clear(): void {
    this.behaviorHistory = [];
    this.patternStats.clear();
    this.editSequences = [];
    this.languagePatterns.clear();
    logger.debug('[PatternLearner] Cleared all learned patterns');
  }
}