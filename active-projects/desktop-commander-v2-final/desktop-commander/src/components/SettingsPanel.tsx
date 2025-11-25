import { useState, useEffect } from 'react';
import { Settings, FolderOpen, Terminal, Network, ArrowRight, Book, Code } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAllServicesStatus, type ServiceStatus } from '@/lib/tauri';

export function SettingsPanel() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const statuses = await getAllServicesStatus();
      setServices(statuses);
    } catch (error) {
      console.error('Failed to load services:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Settings</h2>
        <p className="text-muted-foreground">
          Configure services and view application settings
        </p>
      </div>

      {/* Configuration Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Service Configuration
          </CardTitle>
          <CardDescription>
            Services are configured in the Rust backend code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <div className="flex items-start gap-3">
              <FolderOpen className="h-5 w-5 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium mb-1">Configuration File</p>
                <code className="text-sm bg-background px-2 py-1 rounded">
                  src-tauri/src/main.rs
                </code>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Terminal className="h-5 w-5 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium mb-1">How to Add a Service</p>
                <ol className="text-sm space-y-2 list-decimal ml-4 text-muted-foreground">
                  <li>Open <code className="bg-background px-1.5 py-0.5 rounded">src-tauri/src/main.rs</code></li>
                  <li>Find the <code className="bg-background px-1.5 py-0.5 rounded">AppState::new()</code> function (line ~85)</li>
                  <li>Add a new service using <code className="bg-background px-1.5 py-0.5 rounded">services.insert()</code></li>
                  <li>Rebuild with <code className="bg-background px-1.5 py-0.5 rounded">npm run tauri:dev</code></li>
                </ol>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Book className="h-5 w-5 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium mb-1">Documentation</p>
                <p className="text-sm text-muted-foreground">
                  Check <code className="bg-background px-1.5 py-0.5 rounded">CLAUDE.md</code> and{' '}
                  <code className="bg-background px-1.5 py-0.5 rounded">QUICKSTART.md</code> for examples
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configured Services ({services.length})
          </CardTitle>
          <CardDescription>
            Currently configured services in your Desktop Commander instance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading services...</div>
          ) : services.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No services configured</p>
              <p className="text-sm text-muted-foreground">
                Add services in <code className="bg-muted px-2 py-1 rounded">src-tauri/src/main.rs</code>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {services.map((service) => (
                <div
                  key={service.name}
                  className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{service.name}</h3>
                      {service.port && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Network className="h-4 w-4" />
                          Port: {service.port}
                        </div>
                      )}
                    </div>
                    <Badge variant={service.status === 'running' ? 'success' : 'secondary'}>
                      {service.status}
                    </Badge>
                  </div>

                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Terminal className="h-4 w-4 flex-shrink-0" />
                      <span className="font-medium">Status:</span>
                      <span>{service.status}</span>
                    </div>

                    {service.pid && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <ArrowRight className="h-4 w-4 flex-shrink-0" />
                        <span className="font-medium">PID:</span>
                        <span>{service.pid}</span>
                      </div>
                    )}

                    {service.autoRestartEnabled && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <ArrowRight className="h-4 w-4 flex-shrink-0" />
                        <span className="font-medium">Auto-restart:</span>
                        <Badge variant="outline" className="text-xs">Enabled</Badge>
                      </div>
                    )}

                    {service.restartCount > 0 && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <ArrowRight className="h-4 w-4 flex-shrink-0" />
                        <span className="font-medium">Restarts:</span>
                        <span>{service.restartCount}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">App Name</span>
            <span className="font-medium">Desktop Commander</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Version</span>
            <span className="font-medium">0.1.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Framework</span>
            <span className="font-medium">Tauri v2.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Default Monorepo Path</span>
            <code className="text-xs bg-muted px-2 py-1 rounded">C:\dev</code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
