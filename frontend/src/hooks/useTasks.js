import { useState, useEffect, useCallback } from 'react';
import { tasksAPI } from '../utils/api';

export function useTasks(projectId) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await tasksAPI.getAll(projectId);
      setTasks(data.tasks);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addTask = useCallback((task) => {
    setTasks(prev => [task, ...prev]);
  }, []);

  const updateTask = useCallback((updated) => {
    setTasks(prev => prev.map(t => t._id === updated._id ? updated : t));
  }, []);

  const removeTask = useCallback((id) => {
    setTasks(prev => prev.filter(t => t._id !== id));
  }, []);

  return { tasks, loading, error, refetch: fetch, addTask, updateTask, removeTask };
}
