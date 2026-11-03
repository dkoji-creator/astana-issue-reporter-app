// Alert.alert does nothing in a web browser, so use window.alert there
import { Alert, Platform } from 'react-native';

export function showAlert(title, message) {
  if (Platform.OS === 'web') window.alert(message ? `${title}\n\n${message}` : title);
  else Alert.alert(title, message);
}

// Yes/No question; resolves to true when the user confirms
export function showConfirm(title, message, okText, cancelText) {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(message ? `${title}\n\n${message}` : title));
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
      { text: okText, style: 'destructive', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  });
}
