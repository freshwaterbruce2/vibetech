/**
 * Code Quality Panel Component Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CodeQualityPanel } from '../../components/CodeQualityPanel';
import { CodeQualityAnalyzer } from '../../services/CodeQualityAnalyzer';
import { ThemeProvider } from 'styled-components';

const theme = {
  colors: {
    background: '#1e1e1e',
    backgroundSecondary: '#252526',
    text: '#d4d4d4',
    textSecondary: '#808080',
    border: '#3e3e42',
    primary: '#007acc',
    hover: '#2a2d2e',
  },
};

describe('CodeQualityPanel', () => {
  let mockAnalyzer: CodeQualityAnalyzer;

  beforeEach(() => {
    mockAnalyzer = {
      analyzeFile: vi.fn(),
      analyzeProject: vi.fn(),
      getComplexityRating: vi.fn(),
      getMaintainabilityRating: vi.fn(),
    } as any;
  });

  const renderWithTheme = (ui: React.ReactElement) => {
    return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
  };

  it('should render file view by default', () => {
    renderWithTheme(<CodeQualityPanel analyzer={mockAnalyzer} />);

    expect(screen.getByText('Code Quality')).toBeInTheDocument();
    expect(screen.getByText('File')).toBeInTheDocument();
    expect(screen.getByText('Project')).toBeInTheDocument();
  });

  it('should display quality metrics for current file', async () => {
    const mockFileQuality = {
      filePath: '/test.ts',
      language: 'typescript',
      linesOfCode: 50,
      commentLines: 10,
      complexity: 5,
      quality: 85,
      maintainability: 'high' as const,
      issues: [],
    };

    vi.mocked(mockAnalyzer.analyzeFile).mockResolvedValue(mockFileQuality);
    vi.mocked(mockAnalyzer.getComplexityRating).mockReturnValue('simple');

    renderWithTheme(
      <CodeQualityPanel
        analyzer={mockAnalyzer}
        currentFile={{ path: '/test.ts', content: 'const x = 1;' }}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument(); // Lines of code
      expect(screen.getByText('10')).toBeInTheDocument(); // Comments
      expect(screen.getByText('5')).toBeInTheDocument(); // Complexity
    });
  });

  it('should display issues when present', async () => {
    const mockFileQuality = {
      filePath: '/test.ts',
      language: 'typescript',
      linesOfCode: 20,
      commentLines: 2,
      complexity: 3,
      quality: 70,
      maintainability: 'medium' as const,
      issues: [
        {
          type: 'code-smell' as const,
          severity: 'warning' as const,
          message: 'Found 2 usage(s) of var',
          suggestion: 'Use const or let instead',
        },
      ],
    };

    vi.mocked(mockAnalyzer.analyzeFile).mockResolvedValue(mockFileQuality);

    renderWithTheme(
      <CodeQualityPanel
        analyzer={mockAnalyzer}
        currentFile={{ path: '/test.ts', content: 'var x = 1;' }}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Issues (1)')).toBeInTheDocument();
      expect(screen.getByText('Found 2 usage(s) of var')).toBeInTheDocument();
      expect(screen.getByText('Use const or let instead')).toBeInTheDocument();
    });
  });

  it('should show no issues message when code is clean', async () => {
    const mockFileQuality = {
      filePath: '/test.ts',
      language: 'typescript',
      linesOfCode: 10,
      commentLines: 5,
      complexity: 1,
      quality: 95,
      maintainability: 'high' as const,
      issues: [],
    };

    vi.mocked(mockAnalyzer.analyzeFile).mockResolvedValue(mockFileQuality);

    renderWithTheme(
      <CodeQualityPanel
        analyzer={mockAnalyzer}
        currentFile={{ path: '/test.ts', content: 'const x = 1;' }}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No quality issues detected!')).toBeInTheDocument();
    });
  });

  it('should switch to project view when clicked', async () => {
    const mockProjectQuality = {
      totalFiles: 10,
      totalLinesOfCode: 500,
      averageQuality: 75,
      averageComplexity: 5,
      filesWithIssues: 3,
      fileReports: [],
    };

    vi.mocked(mockAnalyzer.analyzeProject).mockResolvedValue(mockProjectQuality);

    renderWithTheme(<CodeQualityPanel analyzer={mockAnalyzer} workspaceRoot="/project" />);

    const projectButton = screen.getByText('Project');
    fireEvent.click(projectButton);

    await waitFor(() => {
      expect(screen.getByText('Files Analyzed')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('500')).toBeInTheDocument();
    });
  });

  it('should call onIssueClick when issue is clicked', async () => {
    const mockFileQuality = {
      filePath: '/test.ts',
      language: 'typescript',
      linesOfCode: 20,
      commentLines: 2,
      complexity: 3,
      quality: 70,
      maintainability: 'medium' as const,
      issues: [
        {
          type: 'code-smell' as const,
          severity: 'error' as const,
          message: 'eval() detected',
          line: 10,
        },
      ],
    };

    vi.mocked(mockAnalyzer.analyzeFile).mockResolvedValue(mockFileQuality);

    const onIssueClick = vi.fn();

    renderWithTheme(
      <CodeQualityPanel
        analyzer={mockAnalyzer}
        currentFile={{ path: '/test.ts', content: 'eval("bad");' }}
        onIssueClick={onIssueClick}
      />
    );

    await waitFor(() => {
      const issueElement = screen.getByText('eval() detected');
      fireEvent.click(issueElement.closest('div')!);
      expect(onIssueClick).toHaveBeenCalledWith('/test.ts', 10);
    });
  });
});
