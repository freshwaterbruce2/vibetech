import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square, RotateCcw, Star, Coffee, Focus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Task {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: number;
  est_minutes?: number;
  status: string;
  labels?: string;
  created_at: string;
  updated_at: string;
}

interface FocusSession {
  id: string;
  task_id?: string;
  session_type: 'work' | 'short_break' | 'long_break';
  planned_minutes: number;
  actual_minutes: number;
  quality_rating?: number;
  notes?: string;
  started_at: string;
  completed_at?: string;
}

export function FocusPage() {
  const queryClient = useQueryClient();
  const [timerState, setTimerState] = useState<'idle' | 'running' | 'paused'>('idle');
  const [currentSession, setCurrentSession] = useState<'work' | 'short_break' | 'long_break'>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [showRating, setShowRating] = useState(false);
  const [currentRating, setCurrentRating] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const sessionDurations = {
    work: 25 * 60,
    short_break: 5 * 60,
    long_break: 15 * 60,
  };

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      return await invoke<Task[]>('get_tasks');
    },
  });

  // TODO: Implement session tracking
  // const { data: todaysSessions = [] } = useQuery({
  //   queryKey: ['focus-sessions', new Date().toDateString()],
  //   queryFn: async () => {
  //     return [] as FocusSession[];
  //   },
  // });

  const createSession = useMutation({
    mutationFn: async (sessionData: Partial<FocusSession>) => {
      // This would create a session in the backend
      console.log('Creating session:', sessionData);
      return sessionData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-sessions'] });
    },
  });

  useEffect(() => {
    if (timerState === 'running' && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && timerState === 'running') {
      handleSessionComplete();
    }
  }, [timeLeft, timerState]);

  const handleSessionComplete = () => {
    setTimerState('idle');

    if (currentSession === 'work') {
      setSessionCount((prev) => prev + 1);
      setShowRating(true);

      // Auto-transition to break
      setTimeout(() => {
        const isLongBreak = (sessionCount + 1) % 4 === 0;
        const nextSession = isLongBreak ? 'long_break' : 'short_break';
        setCurrentSession(nextSession);
        setTimeLeft(sessionDurations[nextSession]);
      }, 2000);
    } else {
      // Break completed, go back to work
      setCurrentSession('work');
      setTimeLeft(sessionDurations.work);
    }

    // Create session record
    createSession.mutate({
      task_id: selectedTask?.id,
      session_type: currentSession,
      planned_minutes: sessionDurations[currentSession] / 60,
      actual_minutes: sessionDurations[currentSession] / 60,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    });
  };

  const startTimer = () => {
    setTimerState('running');
  };

  const pauseTimer = () => {
    setTimerState('paused');
  };

  const stopTimer = () => {
    setTimerState('idle');
    setTimeLeft(sessionDurations[currentSession]);
  };

  const resetTimer = () => {
    setTimerState('idle');
    setTimeLeft(sessionDurations[currentSession]);
  };

  const submitRating = () => {
    if (currentRating > 0) {
      // Update the last session with rating
      console.log('Rating submitted:', currentRating);
      setShowRating(false);
      setCurrentRating(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionIcon = () => {
    switch (currentSession) {
      case 'work':
        return <Focus className="h-8 w-8" />;
      case 'short_break':
      case 'long_break':
        return <Coffee className="h-8 w-8" />;
    }
  };

  const getSessionTitle = () => {
    switch (currentSession) {
      case 'work':
        return 'Focus Time';
      case 'short_break':
        return 'Short Break';
      case 'long_break':
        return 'Long Break';
    }
  };

  const todaysTasks = tasks.filter((task) => task.status === 'today' || task.status === 'doing');

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Focus Session</h1>
          <p className="text-muted-foreground">
            Stay focused with the Pomodoro Technique
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timer Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getSessionIcon()}
                  {getSessionTitle()}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Timer Display */}
                <div className="text-center">
                  <div className="text-6xl font-bold text-primary mb-4">
                    {formatTime(timeLeft)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Session {sessionCount + 1} • {currentSession === 'work' ? 'Work' : 'Break'} Time
                  </div>
                </div>

                {/* Current Task */}
                {selectedTask && currentSession === 'work' && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Current Task</div>
                    <div className="font-medium">{selectedTask.title}</div>
                    {selectedTask.description && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {selectedTask.description}
                      </div>
                    )}
                  </div>
                )}

                {/* Timer Controls */}
                <div className="flex justify-center gap-2">
                  {timerState === 'idle' && (
                    <Button onClick={startTimer} size="lg">
                      <Play className="h-4 w-4 mr-2" />
                      Start
                    </Button>
                  )}
                  {timerState === 'running' && (
                    <Button onClick={pauseTimer} size="lg" variant="outline">
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </Button>
                  )}
                  {timerState === 'paused' && (
                    <>
                      <Button onClick={startTimer} size="lg">
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </Button>
                      <Button onClick={stopTimer} size="lg" variant="outline">
                        <Square className="h-4 w-4 mr-2" />
                        Stop
                      </Button>
                    </>
                  )}
                  <Button onClick={resetTimer} size="lg" variant="ghost">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>

                {/* Session Progress */}
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((session) => (
                    <div
                      key={session}
                      className={`h-2 rounded-full ${
                        session <= sessionCount
                          ? 'bg-primary'
                          : session === sessionCount + 1 && timerState !== 'idle'
                          ? 'bg-primary/50'
                          : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  {sessionCount} of 4 sessions completed
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Task Selection & Stats */}
          <div className="space-y-6">
            {/* Task Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Task</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {todaysTasks.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No tasks for today. Add some tasks to focus on!
                  </p>
                ) : (
                  todaysTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedTask?.id === task.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="font-medium text-sm">{task.title}</div>
                      {task.est_minutes && (
                        <div className="text-xs opacity-75 mt-1">
                          Est. {task.est_minutes} min
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Today's Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Sessions Completed</span>
                  <span className="font-medium">{sessionCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Focus Time</span>
                  <span className="font-medium">{sessionCount * 25} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Break Time</span>
                  <span className="font-medium">{sessionCount * 5} min</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Rating Modal */}
        {showRating && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-96">
              <CardHeader>
                <CardTitle>Rate Your Session</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  How focused were you during this session?
                </p>
                <div className="flex justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setCurrentRating(rating)}
                      className={`p-2 transition-colors ${
                        rating <= currentRating ? 'text-yellow-500' : 'text-muted-foreground'
                      }`}
                    >
                      <Star className="h-6 w-6 fill-current" />
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setShowRating(false)} variant="outline" className="flex-1">
                    Skip
                  </Button>
                  <Button onClick={submitRating} disabled={currentRating === 0} className="flex-1">
                    Submit
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}