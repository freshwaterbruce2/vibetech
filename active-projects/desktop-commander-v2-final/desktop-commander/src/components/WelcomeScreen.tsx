import { CheckCircle2, Book, Settings, PlayCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface WelcomeScreenProps {
  onDismiss?: () => void;
}

export function WelcomeScreen({ onDismiss }: WelcomeScreenProps) {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome to Desktop Commander</h1>
        <p className="text-lg text-muted-foreground">
          Manage your monorepo services with ease
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* What is Desktop Commander */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              What is Desktop Commander?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              Desktop Commander is a Tauri-based desktop application for managing multiple services in your monorepo:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                <span>Start, stop, and restart services with one click</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                <span>Monitor CPU, memory usage, and health status</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                <span>View real-time logs for each service</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                <span>Track trading bot metrics and performance</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                <span>Auto-restart crashed services</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* How to Configure Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              How to Configure Services
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              Services are configured in the Rust backend code:
            </p>
            <ol className="space-y-3 ml-4 list-decimal">
              <li>
                Open <code className="bg-muted px-1.5 py-0.5 rounded text-xs">src-tauri/src/main.rs</code>
              </li>
              <li>
                Find the <code className="bg-muted px-1.5 py-0.5 rounded text-xs">AppState::new()</code> function (around line 85)
              </li>
              <li>
                Add your service using the <code className="bg-muted px-1.5 py-0.5 rounded text-xs">services.insert()</code> pattern
              </li>
              <li>
                Configure: name, command, working directory, port, dependencies
              </li>
              <li>
                Rebuild the app with <code className="bg-muted px-1.5 py-0.5 rounded text-xs">npm run tauri:dev</code>
              </li>
            </ol>
            <p className="text-muted-foreground mt-4">
              Check CLAUDE.md and QUICKSTART.md for detailed examples
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Start Steps */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5" />
            Quick Start
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="font-semibold">Services Tab</h3>
              <p className="text-muted-foreground">
                View all configured services and their status. Click Play to start a service.
              </p>
            </div>
            <div className="space-y-2">
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="font-semibold">Logs Tab</h3>
              <p className="text-muted-foreground">
                Monitor real-time logs from any running service. Select a service to view its output.
              </p>
            </div>
            <div className="space-y-2">
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="font-semibold">Trading Tab</h3>
              <p className="text-muted-foreground">
                Track your crypto trading bot performance, balance, and trade history.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {onDismiss && (
        <div className="text-center">
          <Button onClick={onDismiss} size="lg">
            Get Started
          </Button>
        </div>
      )}
    </div>
  );
}
