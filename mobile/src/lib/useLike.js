// Like / unlike with an instant update on screen (R3)
import { useState } from 'react';
import { showAlert } from './alert';
import { api } from './api';
import { useI18n } from './i18n';

export function useLike(onChange) {
  const [busyId, setBusyId] = useState(null);
  const { t, errorText } = useI18n();

  const toggle = async (report) => {
    if (busyId) return;
    setBusyId(report.id);
    try {
      const res = report.voted_by_me ? await api.unvote(report.id) : await api.vote(report.id);
      onChange(report.id, res);
    } catch (err) {
      showAlert(t('error'), errorText(err));
    } finally {
      setBusyId(null);
    }
  };
  return { toggle, busyId };
}
