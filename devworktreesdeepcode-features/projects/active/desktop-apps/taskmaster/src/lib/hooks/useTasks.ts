import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api/tasks';

export function useTasks() {
  const qc = useQueryClient();

  const tasks = useQuery({
    queryKey: ['tasks'],
    queryFn: api.getTasks,
  });

  const create = useMutation({
    mutationFn: api.createTask,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const update = useMutation({
    mutationFn: api.updateTask,
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.setQueryData(['task', t.id], t);
    },
  });

  const remove = useMutation({
    mutationFn: api.deleteTask,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  return { tasks, create, update, remove };
}