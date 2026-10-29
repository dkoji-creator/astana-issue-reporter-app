import { Platform } from 'react-native';
import { File } from 'expo-file-system';
import { API_URL } from './config';

let authToken = null;
let onUnauthorized = null;

export function setAuthToken(token) { authToken = token; }
export function setUnauthorizedHandler(fn) { onUnauthorized = fn; }

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  // The free cloud server sleeps after 15 min and needs up to a minute to wake up, so wait long enough
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 75000);
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { method, headers, body: payload, signal: controller.signal });
  } catch {
    throw new ApiError('network', 0);
  } finally {
    clearTimeout(timer);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && authToken && onUnauthorized) onUnauthorized();
    throw new ApiError(data.error || `HTTP ${res.status}`, res.status);
  }
  return data;
}

// Builds multipart form data for a new report; the photo is attached differently on web and on phones
async function reportForm({ photo, description, categoryId, lat, lng }) {
  const form = new FormData();
  form.append('description', description);
  form.append('category_id', String(categoryId));
  form.append('lat', String(lat));
  form.append('lng', String(lng));
  if (Platform.OS === 'web') {
    const blob = await (await fetch(photo.uri)).blob();
    form.append('photo', blob, 'photo.jpg');
  } else {
    // Expo's fetch cannot send the old React Native { uri } file parts,
    // so we give it an object with bytes() that reads the photo from the phone's storage
    const file = new File(photo.uri);
    form.append('photo', { name: 'photo.jpg', type: 'image/jpeg', bytes: () => file.bytes() });
  }
  return form;
}

const query = (params) => {
  const q = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return q.length ? '?' + q.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&') : '';
};

export const api = {
  login: (email, password) => request('/api/auth/login', { method: 'POST', body: { email, password } }),
  register: (data) => request('/api/auth/register', { method: 'POST', body: data }),
  me: () => request('/api/auth/me'),
  savePushToken: (token) => request('/api/auth/push-token', { method: 'PUT', body: { token } }),
  categories: () => request('/api/reports/categories'),
  reports: (params = {}) => request('/api/reports' + query(params)),
  report: (id) => request(`/api/reports/${id}`),
  createReport: async (data) => request('/api/reports', { method: 'POST', form: await reportForm(data) }),
  vote: (id) => request(`/api/reports/${id}/vote`, { method: 'POST' }),
  unvote: (id) => request(`/api/reports/${id}/vote`, { method: 'DELETE' }),
  setStatus: (id, status) => request(`/api/admin/reports/${id}/status`, { method: 'PATCH', body: { status } }),
  stats: () => request('/api/admin/stats'),
  notifications: () => request('/api/notifications'),
  readAllNotifications: () => request('/api/notifications/read-all', { method: 'POST' }),
};
