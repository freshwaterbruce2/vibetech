import { useEffect, useState } from 'react';
import { PlayCircle, StopCircle, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ServiceCard } from '@/components/ServiceCard';
import { LogViewer } from '@/components/LogViewer';
import { TradingMetricsDisplay } from '@/components/TradingMetrics';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { SettingsPanel } from '@/components/SettingsPanel';
import {
  getAllServicesStatus,
  listenToServiceEvents,
  startAllServices,
  stopAllServices,
  type ServiceStatus
} from '@/lib/tauri';

export function Dashboard() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [isStartingAll, setIsStartingAll] = useState(false);
  const [isStoppingAll, setIsStoppingAll] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadServices = async () => {
    try {
      setError(null);
      const statuses = await getAllServicesStatus();
      setServices(statuses);
      if (!selectedService && statuses.length > 0) {
        const firstService = statuses[0];
        if (firstService) {
          setSelectedService(firstService.name);
        }
      }
    } catch (error) {
      console.error('Failed to load services:', error);
      setError(error instanceof Error ? error.message : 'Failed to load services');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServices();

    // Listen for service status changes
    const setupListener = async () => {
      try {
        const unlisten = await listenToServiceEvents(() => {
          loadServices();
        });

        return unlisten;
      } catch (error) {
        console.error('Failed to setup service listener:', error);
        return () => {};
      }
    };

    const listenerPromise = setupListener();

    // Refresh every 10 seconds
    const interval = setInterval(loadServices, 10000);

    return () => {
      clearInterval(interval);
      listenerPromise.then((unlisten) => unlisten());
    };
  }, []);

  const handleStartAll = async () => {
    setIsStartingAll(true);
    try {
      const results = await startAllServices();
      console.log('Start all results:', results);
      await loadServices();
    } catch (error) {
      console.error('Failed to start all services:', error);
    } finally {
      setIsStartingAll(false);
    }
  };

  const handleStopAll = async () => {
    setIsStoppingAll(true);
    try {
      const results = await stopAllServices();
      console.log('Stop all results:', results);
      await loadServices();
    } catch (error) {
      console.error('Failed to stop all services:', error);
    } finally {
      setIsStoppingAll(false);
    }
  };

  const runningCount = services.filter(s => s.status === 'running').length;
  const totalCount = services.length;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Desktop Commander</h1>
            <p className="text-sm text-muted-foreground">
              Monorepo Service Management Dashboard • {runningCount}/{totalCount} services running
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadServices}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleStartAll}
              disabled={isStartingAll || runningCount === totalCount}
            >
              <PlayCircle className="h-4 w-4 mr-2" />
              Start All
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleStopAll}
              disabled={isStoppingAll || runningCount === 0}
            >
              <StopCircle className="h-4 w-4 mr-2" />
              Stop All
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="services" className="h-full flex flex-col">
          <div className="border-b px-6">
            <TabsList>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
              <TabsTrigger value="trading">Trading</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
          </div>

          {/* Services Tab */}
          <TabsContent value="services" className="flex-1 overflow-auto p-6">
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Loading services...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 mb-4">
                <h3 className="font-semibold text-destructive mb-2">Error Loading Services</h3>
                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                {error.includes('Tauri context') ? (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-4 mt-4">
                    <p className="text-sm font-semibold mb-2">⚠️ Wrong Launch Method</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      You're viewing this in a browser. Desktop Commander must run in the Tauri app.
                    </p>
                    <code className="block bg-background p-2 rounded text-sm mt-2">
                      npm run tauri:dev
                    </code>
                    <p className="text-xs text-muted-foreground mt-2">
                      (Not <code>npm run dev</code>)
                    </p>
                  </div>
                ) : (
                  <Button onClick={loadServices} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                )}
              </div>
            )}

            {/* Services Grid */}
            {!isLoading && !error && services.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((service) => (
                  <ServiceCard
                    key={service.name}
                    service={service}
                    onStatusChange={loadServices}
                  />
                ))}
              </div>
            )}

            {/* Empty State - Show Welcome Screen */}
            {!isLoading && !error && services.length === 0 && (
              <WelcomeScreen onDismiss={loadServices} />
            )}
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="flex-1 overflow-hidden p-6">
            <div className="h-full flex flex-col gap-4">
              {/* Service Selector */}
              <div className="flex gap-2 flex-wrap">
                {services.map((service) => (
                  <button
                    key={service.name}
                    onClick={() => setSelectedService(service.name)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedService === service.name
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {service.name}
                  </button>
                ))}
              </div>

              {/* Log Viewer */}
              {selectedService ? (
                <div className="flex-1 min-h-0">
                  <LogViewer serviceName={selectedService} />
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  Select a service to view logs
                </div>
              )}
            </div>
          </TabsContent>

          {/* Trading Tab */}
          <TabsContent value="trading" className="flex-1 overflow-auto p-6">
            <div className="max-w-4xl mx-auto">
              <TradingMetricsDisplay />
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="flex-1 overflow-auto p-6">
            <SettingsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
