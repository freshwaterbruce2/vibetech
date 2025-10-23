import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Clock, Calendar, Flag, CheckCircle2, Circle, Sparkles, Target } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';

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

export function TasksPage() {
  const queryClient = useQueryClient();
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      return await invoke<Task[]>('get_tasks');
    },
  });

  const createTask = useMutation({
    mutationFn: async (title: string) => {
      return await invoke('create_task', {
        input: {
          title,
          status: 'today',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setNewTaskTitle('');
    },
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await invoke('update_task', {
        id,
        input: { status },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      createTask.mutate(newTaskTitle);
    }
  };

  const tasksByStatus = {
    today: tasks.filter((t) => t.status === 'today'),
    backlog: tasks.filter((t) => t.status === 'backlog'),
    doing: tasks.filter((t) => t.status === 'doing'),
    done: tasks.filter((t) => t.status === 'done'),
  };

  const TaskItem = ({ task }: { task: Task }) => {
    const isCompleted = task.status === 'done';
    const statusIcon = isCompleted ? CheckCircle2 : Circle;
    const StatusIcon = statusIcon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 p-4 rounded-lg bg-surface/50 border border-border hover:bg-surface-hover hover:border-border-hover transition-all duration-200 group cursor-pointer shadow-sm hover:shadow-md"
      >
        <button
          onClick={() =>
            updateTaskStatus.mutate({
              id: task.id,
              status: isCompleted ? 'today' : 'done',
            })
          }
          className="text-muted-foreground hover:text-primary transition-all duration-200 hover:scale-110"
        >
          <StatusIcon className="h-5 w-5" />
        </button>

        <div className="flex-1">
          <p className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'} transition-colors`}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-sm text-muted-foreground mt-1 opacity-80">{task.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
          {task.priority > 0 && (
            <span className="px-2 py-1 rounded-md bg-orange-500/10 text-orange-500">
              <Flag className="h-3.5 w-3.5" />
            </span>
          )}
          {task.est_minutes && (
            <span className="text-xs text-muted-foreground flex items-center gap-1 px-2 py-1 rounded-md bg-surface">
              <Clock className="h-3 w-3" />
              {task.est_minutes}m
            </span>
          )}
          {task.due_date && (
            <span className="text-xs text-muted-foreground flex items-center gap-1 px-2 py-1 rounded-md bg-surface">
              <Calendar className="h-3 w-3" />
              {new Date(task.due_date).toLocaleDateString()}
            </span>
          )}
        </div>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 border-2 border-primary/20 border-t-primary rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Target className="h-5 w-5" />
            </div>
            <h1 className="text-3xl tracking-tight text-foreground" style={{ fontWeight: 600 }}>Today's Focus</h1>
          </div>
          <p className="text-muted-foreground ml-11">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <form onSubmit={handleQuickAdd} className="mb-8">
          <div className="flex gap-2 p-4 rounded-xl bg-surface border border-border shadow-sm">
            <Input
              placeholder="What needs to be done?"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="flex-1 border-0 bg-transparent placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
            />
            <Button
              type="submit"
              disabled={!newTaskTitle.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all duration-200 rounded-lg px-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </form>

        <Tabs defaultValue="today" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-surface border border-border p-1 rounded-lg shadow-sm">
            <TabsTrigger value="today" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all">
              <span className="font-medium">Today</span>
              <span className="ml-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">{tasksByStatus.today.length}</span>
            </TabsTrigger>
            <TabsTrigger value="backlog" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all">
              <span className="font-medium">Backlog</span>
              <span className="ml-2 px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full">{tasksByStatus.backlog.length}</span>
            </TabsTrigger>
            <TabsTrigger value="doing" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all">
              <span className="font-medium">Doing</span>
              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-500/10 text-blue-500 rounded-full">{tasksByStatus.doing.length}</span>
            </TabsTrigger>
            <TabsTrigger value="done" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all">
              <span className="font-medium">Done</span>
              <span className="ml-2 px-2 py-0.5 text-xs bg-green-500/10 text-green-500 rounded-full">{tasksByStatus.done.length}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-border bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-foreground" style={{ fontWeight: 600 }}>Today's Tasks</CardTitle>
                    <Sparkles className="h-4 w-4 text-primary/60" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {tasksByStatus.today.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface mb-4">
                        <Target className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                      <p className="text-muted-foreground font-medium mb-2">No tasks for today</p>
                      <p className="text-sm text-muted-foreground/60">Add one to get started!</p>
                    </div>
                  ) : (
                    tasksByStatus.today.map((task) => (
                      <TaskItem key={task.id} task={task} />
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="backlog">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-border bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-foreground" style={{ fontWeight: 600 }}>Backlog</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {tasksByStatus.backlog.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground font-medium">No tasks in backlog</p>
                    </div>
                  ) : (
                    tasksByStatus.backlog.map((task) => (
                      <TaskItem key={task.id} task={task} />
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="doing">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-border bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-foreground" style={{ fontWeight: 600 }}>In Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {tasksByStatus.doing.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground font-medium">No tasks in progress</p>
                    </div>
                  ) : (
                    tasksByStatus.doing.map((task) => (
                      <TaskItem key={task.id} task={task} />
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="done">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-border bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-foreground" style={{ fontWeight: 600 }}>Completed</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {tasksByStatus.done.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground font-medium">No completed tasks yet</p>
                    </div>
                  ) : (
                    tasksByStatus.done.map((task) => (
                      <TaskItem key={task.id} task={task} />
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}