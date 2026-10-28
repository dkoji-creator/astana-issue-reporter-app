// Loads reports from the server and reloads them each time the screen is opened
import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { api } from './api';
import { useI18n } from './i18n';

export function useReports(params) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { errorText } = useI18n();
  const key = JSON.stringify(params);
  const requestNo = useRef(0);

  const load = useCallback(async () => {
    const no = ++requestNo.current; // ignore answers to old requests when filters change fast
    setLoading(true);
    try {
      const data = await api.reports(JSON.parse(key));
      if (no === requestNo.current) { setReports(data); setError(''); }
    } catch (err) {
      if (no === requestNo.current) setError(errorText(err));
    } finally {
      if (no === requestNo.current) setLoading(false);
    }
  }, [key, errorText]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // After a like: update one report in place, without reloading the whole list
  const updateOne = useCallback((id, patch) => {
    setReports((list) => list.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  return { reports, loading, error, reload: load, updateOne };
}
