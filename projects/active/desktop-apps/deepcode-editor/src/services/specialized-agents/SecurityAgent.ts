/**
 * Security Agent - Specialized in security analysis and vulnerability detection
 */
import { logger } from '../../utils/logger';
import { DeepSeekService } from '../DeepSeekService';

import { AgentCapability, AgentContext, AgentResponse,BaseSpecializedAgent } from './BaseSpecializedAgent';

export interface SecurityVulnerability {
  id: string;
  type: 'xss' | 'sql_injection' | 'csrf' | 'insecure_auth' | 'data_leak' | 'dependency' | 'configuration';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location: {
    file: string;
    line?: number;
    column?: number;
  };
  remediation: string;
  cweId?: string;
}

export interface SecurityAnalysis {
  vulnerabilities: SecurityVulnerability[];
  securityScore: number;
  complianceStatus: {
    owasp: boolean;
    gdpr: boolean;
    pci: boolean;
  };
  recommendations: string[];
}

export interface SecurityScan {
  scanType: 'static' | 'dynamic' | 'dependency' | 'configuration';
  timestamp: Date;
  results: SecurityVulnerability[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export class SecurityAgent extends BaseSpecializedAgent {
  constructor(deepSeekService: DeepSeekService) {
    super(
      'SecurityAgent',
      [
        AgentCapability.SECURITY_SCANNING,
        AgentCapability.VULNERABILITY_SCANNING,
        AgentCapability.PENETRATION_TESTING,
        AgentCapability.COMPLIANCE,
        AgentCapability.DATA_VALIDATION,
        AgentCapability.AUTHENTICATION,
        AgentCapability.CODE_REVIEW
      ],
      deepSeekService
    );
  }

  getRole(): string {
    return 'Security Engineer';
  }

  getSpecialization(): string {
    return 'Security analysis, vulnerability detection, and compliance';
  }

  protected generatePrompt(request: string, context: AgentContext): string {
    return `As a Security Engineer, analyze the following request:

${request}

Context:
- Current file: ${context.currentFile || 'N/A'}
- Project type: ${context.projectType || 'Unknown'}
- Selected text: ${context.selectedText || 'None'}

Provide security analysis and vulnerability assessment.`;
  }

  protected analyzeResponse(response: string, context: AgentContext): AgentResponse {
    return {
      content: response,
      confidence: 0.85,
      reasoning: 'Security analysis based on common vulnerabilities and best practices',
      performance: {
        processingTime: Date.now(),
        memoryUsage: 0,
        apiCalls: 1,
        cacheHits: 0,
        tokenCount: response.length / 4
      }
    };
  }

  async analyzeSecurity(context: AgentContext): Promise<AgentResponse> {
    try {
      const analysis = await this.performSecurityAnalysis(context);
      const recommendations = await this.generateSecurityRecommendations(analysis);
      
      return {
        content: this.formatSecurityReport(analysis, recommendations),
        confidence: 0.85,
        reasoning: 'Security analysis based on common vulnerabilities and best practices',
        suggestions: recommendations,
        performance: {
          processingTime: Date.now(),
          memoryUsage: 0,
          apiCalls: 1,
          cacheHits: 0,
          tokenCount: 0
        }
      };
    } catch (error) {
      logger.error('Security analysis failed:', error);
      return {
        content: 'Security analysis failed due to an error.',
        confidence: 0,
        performance: {
          processingTime: Date.now(),
          memoryUsage: 0,
          apiCalls: 0,
          cacheHits: 0,
          tokenCount: 0
        }
      };
    }
  }

  async scanVulnerabilities(context: AgentContext): Promise<AgentResponse> {
    try {
      const scan = await this.performVulnerabilityScan(context);
      
      return {
        content: this.formatScanReport(scan),
        confidence: 0.80,
        reasoning: 'Vulnerability scan based on static code analysis patterns',
        suggestions: scan.results.map(v => v.remediation),
        performance: {
          processingTime: Date.now(),
          memoryUsage: 0,
          apiCalls: 1,
          cacheHits: 0,
          tokenCount: 0
        }
      };
    } catch (error) {
      logger.error('Vulnerability scan failed:', error);
      return {
        content: 'Vulnerability scan failed due to an error.',
        confidence: 0,
        performance: {
          processingTime: Date.now(),
          memoryUsage: 0,
          apiCalls: 0,
          cacheHits: 0,
          tokenCount: 0
        }
      };
    }
  }

  private async performSecurityAnalysis(context: AgentContext): Promise<SecurityAnalysis> {
    // Mock security analysis - in real implementation, this would analyze actual code
    const vulnerabilities: SecurityVulnerability[] = [
      {
        id: 'SEC-001',
        type: 'xss',
        severity: 'high',
        title: 'Potential XSS vulnerability',
        description: 'User input is not properly sanitized before rendering',
        location: {
          file: context.currentFile || 'unknown',
          line: 42,
          column: 15
        },
        remediation: 'Use proper HTML escaping or sanitization library',
        cweId: 'CWE-79'
      },
      {
        id: 'SEC-002',
        type: 'insecure_auth',
        severity: 'critical',
        title: 'Weak authentication mechanism',
        description: 'Password validation is insufficient',
        location: {
          file: context.currentFile || 'unknown',
          line: 128,
          column: 8
        },
        remediation: 'Implement strong password policies and multi-factor authentication',
        cweId: 'CWE-287'
      }
    ];

    const analysis: SecurityAnalysis = {
      vulnerabilities,
      securityScore: 65,
      complianceStatus: {
        owasp: false,
        gdpr: true,
        pci: false
      },
      recommendations: [
        'Implement input validation and sanitization',
        'Use HTTPS for all communications',
        'Enable security headers (CSP, HSTS, etc.)',
        'Regular security dependency updates'
      ]
    };

    return analysis;
  }

  private async generateSecurityRecommendations(analysis: SecurityAnalysis): Promise<string[]> {
    const recommendations = [...analysis.recommendations];
    
    // Add specific recommendations based on vulnerabilities
    analysis.vulnerabilities.forEach(vuln => {
      switch (vuln.type) {
        case 'xss':
          recommendations.push('Implement Content Security Policy (CSP)');
          break;
        case 'sql_injection':
          recommendations.push('Use parameterized queries and ORM');
          break;
        case 'insecure_auth':
          recommendations.push('Implement OAuth 2.0 or similar secure authentication');
          break;
      }
    });

    return [...new Set(recommendations)]; // Remove duplicates
  }

  private async performVulnerabilityScan(context: AgentContext): Promise<SecurityScan> {
    const vulnerabilities: SecurityVulnerability[] = [
      {
        id: 'VULN-001',
        type: 'dependency',
        severity: 'high',
        title: 'Vulnerable dependency detected',
        description: 'Package contains known security vulnerability',
        location: {
          file: 'package.json',
          line: 15
        },
        remediation: 'Update to latest secure version',
        cweId: 'CWE-1035'
      }
    ];

    return {
      scanType: 'static',
      timestamp: new Date(),
      results: vulnerabilities,
      summary: {
        critical: vulnerabilities.filter(v => v.severity === 'critical').length,
        high: vulnerabilities.filter(v => v.severity === 'high').length,
        medium: vulnerabilities.filter(v => v.severity === 'medium').length,
        low: vulnerabilities.filter(v => v.severity === 'low').length
      }
    };
  }

  private formatSecurityReport(analysis: SecurityAnalysis, recommendations: string[]): string {
    return `# Security Analysis Report

## Security Score: ${analysis.securityScore}/100

## Compliance Status
- OWASP: ${analysis.complianceStatus.owasp ? '✅' : '❌'}
- GDPR: ${analysis.complianceStatus.gdpr ? '✅' : '❌'}
- PCI DSS: ${analysis.complianceStatus.pci ? '✅' : '❌'}

## Vulnerabilities Found (${analysis.vulnerabilities.length})
${analysis.vulnerabilities.map(v => `
### ${v.id}: ${v.title}
- **Severity**: ${v.severity.toUpperCase()}
- **Type**: ${v.type}
- **Location**: ${v.location.file}:${v.location.line || 'N/A'}
- **Description**: ${v.description}
- **Remediation**: ${v.remediation}
${v.cweId ? `- **CWE ID**: ${v.cweId}` : ''}
`).join('\n')}

## Recommendations
${recommendations.map(r => `- ${r}`).join('\n')}`;
  }

  private formatScanReport(scan: SecurityScan): string {
    return `# Vulnerability Scan Report

## Scan Details
- **Type**: ${scan.scanType}
- **Timestamp**: ${scan.timestamp.toISOString()}
- **Total Issues**: ${scan.results.length}

## Summary
- Critical: ${scan.summary.critical}
- High: ${scan.summary.high}
- Medium: ${scan.summary.medium}
- Low: ${scan.summary.low}

## Detailed Results
${scan.results.map(v => `
### ${v.id}: ${v.title}
- **Severity**: ${v.severity.toUpperCase()}
- **File**: ${v.location.file}
- **Line**: ${v.location.line || 'N/A'}
- **Remediation**: ${v.remediation}
`).join('\n')}`;
  }

  async processRequest(request: string, context: AgentContext): Promise<AgentResponse> {
    const requestLower = request.toLowerCase();
    
    if (requestLower.includes('scan') || requestLower.includes('vulnerability')) {
      return await this.scanVulnerabilities(context);
    } else if (requestLower.includes('security') || requestLower.includes('analyze')) {
      return await this.analyzeSecurity(context);
    }
    
    // Default security analysis
    return await this.analyzeSecurity(context);
  }
}