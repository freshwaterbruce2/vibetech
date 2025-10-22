import { useState, useEffect } from 'react';
import { Play, Square, RotateCw, Activity, Clock, Cpu, MemoryStick, Heart, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  startService, 
  stopService, 
  restartService, 
  checkServiceHealth,
  toggleAutoRestart,
  type ServiceStatus 
} from '@/lib/tauri';

interface ServiceCardProps {
  service: ServiceStatus;
  onStatusChange?: () => void;
}

export function ServiceCard({ service, onStatusChange }: ServiceCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState(service.health);

  useEffect(() => {
    // Periodically check health
    const interval = setInterval(async () => {
      if (service.status === 'running') {
        try {
          const health = await checkServiceHealth(service.name);
          setHealthStatus(health as 'healthy' | 'unhealthy' | 'unknown');
        } catch (error) {
          console.error('Health check failed:', error);
        }
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [service.name, service.status]);

  const handleStart = async () => {
    setIsLoading(true);
    try {
      await startService(service.name);
      onStatusChange?.();
    } catch (error) {
      console.error(`Failed to start ${service.name}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    setIsLoading(true);
    try {
      await stopService(service.name);
      onStatusChange?.();
    } catch (error) {
      console.error(`Failed to stop ${service.name}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = async () => {
    setIsLoading(true);
    try {
      await restartService(service.name);
      onStatusChange?.();
    } catch (error) {
      console.error(`Failed to restart ${service.name}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHealthCheck = async () => {
    try {
      const health = await checkServiceHealth(service.name);
      setHealthStatus(health as 'healthy' | 'unhealthy' | 'unknown');
      onStatusChange?.();
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };

  const handleToggleAutoRestart = async () => {
    try {
      await toggleAutoRestart(service.name, !service.autoRestartEnabled);
      onStatusChange?.();
    } catch (error) {
      console.error('Failed to toggle auto-restart:', error);
    }
  };

  const getStatusBadge = () => {
    switch (service.status) {
      case 'running':
        return <Badge variant="success">Running</Badge>;
      case 'stopped':
        return <Badge variant="secondary">Stopped</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'starting':
        return <Badge variant="warning">Starting...</Badge>;
      case 'stopping':
        return <Badge variant="warning">Stopping...</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getHealthBadge = () => {
    const status = healthStatus || service.health;
    switch (status) {
      case 'healthy':
        return <Badge variant="success" className="text-xs">●</Badge>;
      case 'unhealthy':
        return <Badge variant="destructive" className="text-xs">●</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">●</Badge>;
    }
  };

  const formatUptime = (seconds: number | null) => {
    if (seconds === null) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-medium">{service.name}</CardTitle>
            {service.status === 'running' && getHealthBadge()}
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Service Info */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Activity className="h-4 w-4" />
              PID: {service.pid ?? 'N/A'}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              {formatUptime(service.uptime)}
            </div>
          </div>

          {service.port && (
            <div className="text-sm text-muted-foreground">
              Port: {service.port}
            </div>
          )}

          {/* Resource Monitoring */}
          {service.status === 'running' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Cpu className="h-4 w-4" />
                  CPU
                </div>
                <span className="font-medium">{service.cpuUsage.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MemoryStick className="h-4 w-4" />
                  Memory
                </div>
                <span className="font-medium">{service.memoryUsage} MB</span>
              </div>
            </div>
          )}

          {/* Auto-restart indicator */}
          {service.autoRestartEnabled && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-muted-foreground">
                <RefreshCw className="h-3 w-3" />
                Auto-restart enabled
              </div>
              {service.restartCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  {service.restartCount} restarts
                </Badge>
              )}
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleStart}
              disabled={service.status === 'running' || isLoading}
              className="flex-1"
            >
              <Play className="mr-2 h-4 w-4" />
              Start
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleStop}
              disabled={service.status !== 'running' || isLoading}
              className="flex-1"
            >
              <Square className="mr-2 h-4 w-4" />
              Stop
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRestart}
              disabled={service.status !== 'running' || isLoading}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Secondary Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleHealthCheck}
              disabled={service.status !== 'running'}
              className="flex-1"
            >
              <Heart className="mr-2 h-4 w-4" />
              Check Health
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleToggleAutoRestart}
              className="flex-1"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {service.autoRestartEnabled ? 'Disable' : 'Enable'} Auto-Restart
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
