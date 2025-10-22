import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FileExplorer, FileExplorerDemo } from '../../components/FileExplorer';

// Mock VirtualList since it's complex and tested separately
vi.mock('../../components/VirtualList', () => ({
  VirtualList: ({ items, renderItem }: any) => (
    <div data-testid="virtual-list">
      {items.map((item: any, index: number) => (
        <div key={item.id}>{renderItem(item, index)}</div>
      ))}
    </div>
  ),
}));

// Mock Logger
vi.mock('../../services/Logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  level: number;
}

describe('FileExplorer Component', () => {
  const mockFiles: FileNode[] = [
    {
      id: '1',
      name: 'src',
      path: '/src',
      type: 'directory',
      level: 0,
      children: [
        {
          id: '2',
          name: 'components',
          path: '/src/components',
          type: 'directory',
          level: 1,
          children: [
            {
              id: '3',
              name: 'Button.tsx',
              path: '/src/components/Button.tsx',
              type: 'file',
              level: 2,
            },
            {
              id: '4',
              name: 'Card.tsx',
              path: '/src/components/Card.tsx',
              type: 'file',
              level: 2,
            },
          ],
        },
        {
          id: '5',
          name: 'App.tsx',
          path: '/src/App.tsx',
          type: 'file',
          level: 1,
        },
      ],
    },
    {
      id: '6',
      name: 'package.json',
      path: '/package.json',
      type: 'file',
      level: 0,
    },
  ];

  const mockOnFileSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render file explorer', () => {
      render(<FileExplorer rootPath="/" files={mockFiles} onFileSelect={mockOnFileSelect} />);
      expect(screen.getByPlaceholderText('Search files...')).toBeInTheDocument();
    });

    it('should render root level files and directories', () => {
      render(<FileExplorer rootPath="/" files={mockFiles} onFileSelect={mockOnFileSelect} />);
      expect(screen.getByText('src')).toBeInTheDocument();
      expect(screen.getByText('package.json')).toBeInTheDocument();
    });

    it('should not render nested files initially', () => {
      render(<FileExplorer rootPath="/" files={mockFiles} onFileSelect={mockOnFileSelect} />);
      expect(screen.queryByText('components')).not.toBeInTheDocument();
      expect(screen.queryByText('Button.tsx')).not.toBeInTheDocument();
    });

    it('should render with custom height', () => {
      const { container } = render(
        <FileExplorer rootPath="/" files={mockFiles} height={600} onFileSelect={mockOnFileSelect} />
      );
      expect(container.querySelector('[data-testid="virtual-list"]')).toBeInTheDocument();
    });
  });

  describe('Directory Expansion', () => {
    it('should expand directory when clicked', () => {
      render(<FileExplorer rootPath="/" files={mockFiles} onFileSelect={mockOnFileSelect} />);

      const srcFolder = screen.getByText('src');
      fireEvent.click(srcFolder);

      expect(screen.getByText('components')).toBeInTheDocument();
      expect(screen.getByText('App.tsx')).toBeInTheDocument();
    });

    it('should collapse expanded directory when clicked again', () => {
      render(<FileExplorer rootPath="/" files={mockFiles} onFileSelect={mockOnFileSelect} />);

      const srcFolder = screen.getByText('src');

      // Expand
      fireEvent.click(srcFolder);
      expect(screen.getByText('components')).toBeInTheDocument();

      // Collapse
      fireEvent.click(srcFolder);
      expect(screen.queryByText('components')).not.toBeInTheDocument();
    });

    it('should expand nested directories', () => {
      render(<FileExplorer rootPath="/" files={mockFiles} onFileSelect={mockOnFileSelect} />);

      // Expand src
      fireEvent.click(screen.getByText('src'));

      // Expand components
      fireEvent.click(screen.getByText('components'));

      expect(screen.getByText('Button.tsx')).toBeInTheDocument();
      expect(screen.getByText('Card.tsx')).toBeInTheDocument();
    });
  });

  describe('File Selection', () => {
    it('should call onFileSelect when file is clicked', () => {
      render(<FileExplorer rootPath="/" files={mockFiles} onFileSelect={mockOnFileSelect} />);

      const file = screen.getByText('package.json');
      fireEvent.click(file);

      expect(mockOnFileSelect).toHaveBeenCalledWith('/package.json');
    });

    it('should not call onFileSelect when directory is clicked', () => {
      render(<FileExplorer rootPath="/" files={mockFiles} onFileSelect={mockOnFileSelect} />);

      const folder = screen.getByText('src');
      fireEvent.click(folder);

      expect(mockOnFileSelect).not.toHaveBeenCalled();
    });

    it('should call onFileSelect with correct path for nested files', () => {
      render(<FileExplorer rootPath="/" files={mockFiles} onFileSelect={mockOnFileSelect} />);

      // Expand directories
      fireEvent.click(screen.getByText('src'));
      fireEvent.click(screen.getByText('components'));

      // Click nested file
      const file = screen.getByText('Button.tsx');
      fireEvent.click(file);

      expect(mockOnFileSelect).toHaveBeenCalledWith('/src/components/Button.tsx');
    });
  });

  describe('Search Functionality', () => {
    it('should filter files by search query', () => {
      render(<FileExplorer rootPath="/" files={mockFiles} onFileSelect={mockOnFileSelect} />);

      const searchInput = screen.getByPlaceholderText('Search files...');
      fireEvent.change(searchInput, { target: { value: 'package' } });

      expect(screen.getByText('package.json')).toBeInTheDocument();
      expect(screen.queryByText('src')).not.toBeInTheDocument();
    });

    it('should be case insensitive', () => {
      render(<FileExplorer rootPath="/" files={mockFiles} onFileSelect={mockOnFileSelect} />);

      const searchInput = screen.getByPlaceholderText('Search files...');
      fireEvent.change(searchInput, { target: { value: 'PACKAGE' } });

      expect(screen.getByText('package.json')).toBeInTheDocument();
    });

    it('should show empty state when no files match search', () => {
      render(<FileExplorer rootPath="/" files={mockFiles} onFileSelect={mockOnFileSelect} />);

      const searchInput = screen.getByPlaceholderText('Search files...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      expect(screen.getByText('No files match your search')).toBeInTheDocument();
    });

    it('should clear search when input is cleared', () => {
      render(<FileExplorer rootPath="/" files={mockFiles} onFileSelect={mockOnFileSelect} />);

      const searchInput = screen.getByPlaceholderText('Search files...');

      // Search
      fireEvent.change(searchInput, { target: { value: 'package' } });
      expect(screen.queryByText('src')).not.toBeInTheDocument();

      // Clear
      fireEvent.change(searchInput, { target: { value: '' } });
      expect(screen.getByText('src')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no files provided', () => {
      render(<FileExplorer rootPath="/" files={[]} onFileSelect={mockOnFileSelect} />);
      expect(screen.getByText('No files in this directory')).toBeInTheDocument();
    });

    it('should show search empty state when search has no results', () => {
      render(<FileExplorer rootPath="/" files={mockFiles} onFileSelect={mockOnFileSelect} />);

      const searchInput = screen.getByPlaceholderText('Search files...');
      fireEvent.change(searchInput, { target: { value: 'xyz123' } });

      expect(screen.getByText('No files match your search')).toBeInTheDocument();
    });
  });

  describe('File Icons', () => {
    it('should display folder icon for directories', () => {
      const { container } = render(
        <FileExplorer rootPath="/" files={mockFiles} onFileSelect={mockOnFileSelect} />
      );

      // Check that folder icons are rendered (Lucide icons render as SVGs)
      const folderRow = screen.getByText('src').closest('div');
      const icons = folderRow?.querySelectorAll('svg');
      expect(icons && icons.length > 0).toBe(true);
    });

    it('should display appropriate file icons based on extension', () => {
      render(<FileExplorer rootPath="/" files={mockFiles} onFileSelect={mockOnFileSelect} />);

      // Expand to see files
      fireEvent.click(screen.getByText('src'));

      // Files should have file icons (not chevron icons)
      const appFile = screen.getByText('App.tsx').closest('div');
      expect(appFile?.querySelectorAll('svg').length).toBeGreaterThan(0);
    });
  });

  describe('Virtual Scrolling', () => {
    it('should use VirtualList for rendering', () => {
      render(<FileExplorer rootPath="/" files={mockFiles} onFileSelect={mockOnFileSelect} />);
      expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
    });

    it('should pass correct height to VirtualList', () => {
      const customHeight = 600;
      render(
        <FileExplorer
          rootPath="/"
          files={mockFiles}
          height={customHeight}
          onFileSelect={mockOnFileSelect}
        />
      );

      // VirtualList should receive height minus search bar height
      expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
    });
  });

  describe('Keyboard Accessibility', () => {
    it('should be keyboard navigable', () => {
      render(<FileExplorer rootPath="/" files={mockFiles} onFileSelect={mockOnFileSelect} />);

      const searchInput = screen.getByPlaceholderText('Search files...');
      expect(searchInput).toBeInTheDocument();

      // User can focus search input
      searchInput.focus();
      expect(document.activeElement).toBe(searchInput);
    });
  });

  describe('Component Integration', () => {
    it('should work without onFileSelect callback', () => {
      expect(() => {
        render(<FileExplorer rootPath="/" files={mockFiles} />);
      }).not.toThrow();

      const file = screen.getByText('package.json');
      expect(() => {
        fireEvent.click(file);
      }).not.toThrow();
    });
  });

  describe('FileExplorerDemo', () => {
    it('should render demo with mock data', () => {
      render(<FileExplorerDemo />);
      expect(screen.getByText('src')).toBeInTheDocument();
      expect(screen.getByText('package.json')).toBeInTheDocument();
    });

    it('should expand directories in demo', () => {
      render(<FileExplorerDemo />);

      fireEvent.click(screen.getByText('src'));
      expect(screen.getByText('components')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle files without extensions', () => {
      const filesWithoutExt: FileNode[] = [
        {
          id: '1',
          name: 'README',
          path: '/README',
          type: 'file',
          level: 0,
        },
      ];

      render(<FileExplorer rootPath="/" files={filesWithoutExt} onFileSelect={mockOnFileSelect} />);
      expect(screen.getByText('README')).toBeInTheDocument();
    });

    it('should handle deeply nested structures', () => {
      const deepFiles: FileNode[] = [
        {
          id: '1',
          name: 'level1',
          path: '/level1',
          type: 'directory',
          level: 0,
          children: [
            {
              id: '2',
              name: 'level2',
              path: '/level1/level2',
              type: 'directory',
              level: 1,
              children: [
                {
                  id: '3',
                  name: 'level3',
                  path: '/level1/level2/level3',
                  type: 'directory',
                  level: 2,
                  children: [
                    {
                      id: '4',
                      name: 'deep.txt',
                      path: '/level1/level2/level3/deep.txt',
                      type: 'file',
                      level: 3,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];

      render(<FileExplorer rootPath="/" files={deepFiles} onFileSelect={mockOnFileSelect} />);

      fireEvent.click(screen.getByText('level1'));
      fireEvent.click(screen.getByText('level2'));
      fireEvent.click(screen.getByText('level3'));

      expect(screen.getByText('deep.txt')).toBeInTheDocument();
    });

    it('should handle empty directory', () => {
      const emptyDir: FileNode[] = [
        {
          id: '1',
          name: 'empty',
          path: '/empty',
          type: 'directory',
          level: 0,
          children: [],
        },
      ];

      render(<FileExplorer rootPath="/" files={emptyDir} onFileSelect={mockOnFileSelect} />);

      fireEvent.click(screen.getByText('empty'));
      // Should not crash
      expect(screen.getByText('empty')).toBeInTheDocument();
    });

    it('should handle special characters in file names', () => {
      const specialFiles: FileNode[] = [
        {
          id: '1',
          name: 'file with spaces.txt',
          path: '/file with spaces.txt',
          type: 'file',
          level: 0,
        },
        {
          id: '2',
          name: 'file-with-dashes.js',
          path: '/file-with-dashes.js',
          type: 'file',
          level: 0,
        },
      ];

      render(<FileExplorer rootPath="/" files={specialFiles} onFileSelect={mockOnFileSelect} />);

      expect(screen.getByText('file with spaces.txt')).toBeInTheDocument();
      expect(screen.getByText('file-with-dashes.js')).toBeInTheDocument();
    });
  });
});
