// Small key-value storage: SecureStore on the phone, localStorage in the browser
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export async function getItem(key) {
  if (Platform.OS === 'web') {
    try { return window.localStorage.getItem(key); } catch { return null; }
  }
  return SecureStore.getItemAsync(key);
}

export async function setItem(key, value) {
  if (Platform.OS === 'web') {
    try {
      if (value == null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, value);
    } catch { /* private mode: ignore */ }
    return;
  }
  if (value == null) await SecureStore.deleteItemAsync(key);
  else await SecureStore.setItemAsync(key, value);
}
