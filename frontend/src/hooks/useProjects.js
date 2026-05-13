import { useState, useEffect, useCallback } from 'react';
import { projectsAPI } from '../utils/api';
import toast from 'react-hot-toast';

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await projectsAPI.getAll();
      setProjects(data.projects);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const addProject = useCallback((project) => {
    setProjects(prev => [project, ...prev]);
  }, []);

  const removeProject = useCallback((id) => {
    setProjects(prev => prev.filter(p => p._id !== id));
  }, []);

  return { projects, loading, error, refetch: fetch, addProject, removeProject };
}
