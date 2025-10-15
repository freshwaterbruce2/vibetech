import { useCallback, useState } from 'react';

import { FileSystemService } from '../services/FileSystemService';
import { EditorFile } from '../types';

export interface UseFileManagerReturn {
  currentFile: EditorFile | null;
  openFiles: EditorFile[];
  handleOpenFile: (filePath: string) => Promise<void>;
  handleCloseFile: (filePath: string) => void;
  handleFileChange: (content: string) => void;
  handleSaveFile: () => Promise<void>;
  setCurrentFile: (file: EditorFile | null) => void;
}

export interface UseFileManagerProps {
  fileSystemService: FileSystemService;
  onSaveSuccess?: (fileName: string) => void;
  onSaveError?: (fileName: string, error: Error) => void;
}

function getLanguageFromExtension(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    cs: 'csharp',
    php: 'php',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    swift: 'swift',
    kt: 'kotlin',
    scala: 'scala',
    html: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    less: 'less',
    json: 'json',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    fish: 'shell',
    ps1: 'powershell',
    dockerfile: 'dockerfile',
    makefile: 'makefile',
    cmake: 'cmake',
    toml: 'toml',
    ini: 'ini',
    conf: 'conf',
    txt: 'plaintext',
  };

  return languageMap[ext || ''] || 'plaintext';
}

export function useFileManager({
  fileSystemService,
  onSaveSuccess,
  onSaveError,
}: UseFileManagerProps): UseFileManagerReturn {
  const [currentFile, setCurrentFile] = useState<EditorFile | null>(null);
  const [openFiles, setOpenFiles] = useState<EditorFile[]>([]);

  const handleOpenFile = useCallback(
    async (filePath: string) => {
      try {
        console.log('[useFileManager] Opening file:', filePath);
        const content = await fileSystemService.readFile(filePath);
        console.log('[useFileManager] File content length:', content?.length || 0);

        const file: EditorFile = {
          id: filePath,
          name: filePath.split('/').pop() || filePath,
          path: filePath,
          content,
          language: getLanguageFromExtension(filePath),
          isModified: false,
        };

        console.log('[useFileManager] Created EditorFile:', {
          name: file.name,
          path: file.path,
          language: file.language,
          contentLength: file.content.length
        });

        // Add to open files if not already open
        setOpenFiles((prev) => {
          if (!prev.find((f) => f.path === filePath)) {
            console.log('[useFileManager] Adding file to openFiles');
            return [...prev, file];
          }
          console.log('[useFileManager] File already in openFiles');
          return prev;
        });

        console.log('[useFileManager] Setting as currentFile');
        setCurrentFile(file);
      } catch (error) {
        console.error('[useFileManager] Failed to open file:', error);
        throw error;
      }
    },
    [fileSystemService]
  );

  const handleCloseFile = useCallback(
    (filePath: string) => {
      setOpenFiles((prev) => {
        const filtered = prev.filter((f) => f.path !== filePath);

        // Update current file if we're closing it
        if (currentFile?.path === filePath) {
          setCurrentFile(filtered.length > 0 && filtered[0] ? filtered[0] : null);
        }

        return filtered;
      });
    },
    [currentFile]
  );

  const handleFileChange = useCallback(
    (content: string) => {
      if (currentFile) {
        const updatedFile = { ...currentFile, content, isModified: true };
        setCurrentFile(updatedFile);
        setOpenFiles((prev) => prev.map((f) => (f.path === currentFile.path ? updatedFile : f)));
      }
    },
    [currentFile]
  );

  const handleSaveFile = useCallback(async () => {
    if (currentFile) {
      try {
        await fileSystemService.writeFile(currentFile.path, currentFile.content);
        const savedFile = { ...currentFile, isModified: false };
        setCurrentFile(savedFile);
        setOpenFiles((prev) => prev.map((f) => (f.path === currentFile.path ? savedFile : f)));
        onSaveSuccess?.(currentFile.name);
      } catch (error) {
        console.error('Failed to save file:', error);
        onSaveError?.(currentFile.name, error as Error);
        throw error;
      }
    }
  }, [currentFile, fileSystemService, onSaveSuccess, onSaveError]);

  return {
    currentFile,
    openFiles,
    handleOpenFile,
    handleCloseFile,
    handleFileChange,
    handleSaveFile,
    setCurrentFile,
  };
}
