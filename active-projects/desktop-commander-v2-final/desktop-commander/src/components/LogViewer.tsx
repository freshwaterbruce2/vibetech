import { useEffect, useState, useRef } from 'react';
import { Trash2, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { getTailLogs, clearLogs, listenToLogEvents, type LogEntry } from '@/lib/tauri';

interface LogViewerProps {
  serviceName: string;
  initialLines?: number;
}

export function LogViewer({ serviceName, initialLines = 100 }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [autoScroll, _setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load initial logs
    const loadLogs = async () => {
      try {
        const initialLogs = await getTailLogs(serviceName, initialLines);
        setLogs(initialLogs);
      } catch (error) {
        console.error('Failed to load logs:', error);
      }
    };

    loadLogs();

    // Listen for new log entries
    const setupListener = async () => {
      try {
        const unlisten = await listenToLogEvents((log) => {
          if (log.source === serviceName) {
            setLogs((prev) => [...prev, log]);
          }
        });

        return unlisten;
      } catch (error) {
        console.error('Failed to setup log listener:', error);
        return () => {};
      }
    };

    const listenerPromise = setupListener();

    return () => {
      listenerPromise.then((unlisten) => unlisten());
    };
  }, [serviceName, initialLines]);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleClear = async () => {
    try {
      await clearLogs(serviceName);
      setLogs([]);
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  };

  const handleExport = () => {
    const logText = logs
      .map((log) => `[${log.timestamp}] ${log.level}: ${log.message}`)
      .join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${serviceName}-logs-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLevelBadge = (level: LogEntry['level']) => {
    switch (level) {
      case 'ERROR':
      case 'CRITICAL':
        return <Badge variant="destructive" className="w-16 justify-center">{level}</Badge>;
      case 'WARNING':
        return <Badge variant="warning" className="w-16 justify-center">{level}</Badge>;
      case 'INFO':
        return <Badge variant="default" className="w-16 justify-center">{level}</Badge>;
      case 'DEBUG':
        return <Badge variant="secondary" className="w-16 justify-center">{level}</Badge>;
      default:
        return <Badge variant="outline" className="w-16 justify-center">{level}</Badge>;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{serviceName} Logs</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm" variant="outline" onClick={handleClear}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div ref={scrollRef} className="space-y-1 font-mono text-xs">
            {logs.length === 0 ? (
              <div className="text-muted-foreground text-center py-8">
                No logs available
              </div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-2 hover:bg-muted/50 rounded"
                >
                  <span className="text-muted-foreground shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  {getLevelBadge(log.level)}
                  <span className="break-all">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
