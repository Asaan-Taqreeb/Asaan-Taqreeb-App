import { Alert, Platform } from 'react-native';

export const showAlert = (
  title: string,
  message: string,
  buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>
) => {
  if (Platform.OS === 'web') {
    // Check if it has a cancel option (requires confirm dialog)
    const hasCancel = buttons?.some(b => b.style === 'cancel' || b.text.toLowerCase() === 'cancel');
    if (hasCancel) {
      const confirmButton = buttons?.find(b => b.style === 'destructive' || b.text.toLowerCase() === 'delete' || b.text.toLowerCase() === 'ok' || b.text.toLowerCase() === 'yes');
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (confirmed && confirmButton?.onPress) {
        confirmButton.onPress();
      } else {
        const cancelButton = buttons?.find(b => b.style === 'cancel' || b.text.toLowerCase() === 'cancel');
        if (cancelButton?.onPress) {
          cancelButton.onPress();
        }
      }
      return;
    }

    // Standard alert
    window.alert(`${title}: ${message}`);
    if (buttons && buttons.length > 0) {
      const primaryBtn = buttons.find(b => b.style !== 'cancel') || buttons[0];
      if (primaryBtn?.onPress) {
        primaryBtn.onPress();
      }
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};
