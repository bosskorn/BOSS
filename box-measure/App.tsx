import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { isARSupportedOnDevice, requestRequiredPermissions } from '@reactvision/react-viro';
import MeasureScreen from './src/MeasureScreen';

type Status = 'checking' | 'ready' | 'unsupported' | 'no-camera';

async function prepare(): Promise<Status> {
  try {
    const { isARSupported } = await isARSupportedOnDevice();
    if (!isARSupported) return 'unsupported';
  } catch {
    return 'unsupported';
  }
  // iOS asks for the camera itself when the AR session starts.
  if (Platform.OS === 'android') {
    const { camera } = await requestRequiredPermissions(['camera']);
    if (!camera) return 'no-camera';
  }
  return 'ready';
}

export default function App() {
  const [status, setStatus] = useState<Status>('checking');
  const check = () => {
    setStatus('checking');
    prepare().then(setStatus);
  };
  useEffect(check, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {status === 'ready' ? (
        <MeasureScreen />
      ) : (
        <View style={styles.center}>
          {status === 'checking' && <Text style={styles.text}>กำลังเตรียมกล้อง AR…</Text>}
          {status === 'unsupported' && (
            <Text style={styles.text}>
              เครื่องนี้ไม่รองรับ AR{'\n'}
              {Platform.OS === 'android'
                ? 'ต้องเป็นเครื่องที่รองรับ ARCore และติดตั้ง Google Play Services for AR'
                : 'ต้องเป็น iPhone หรือ iPad ที่รองรับ ARKit'}
            </Text>
          )}
          {status === 'no-camera' && (
            <>
              <Text style={styles.text}>แอปต้องใช้กล้องเพื่อวัดขนาดกล่อง กรุณาอนุญาตการใช้กล้อง</Text>
              <Pressable style={styles.button} onPress={() => Linking.openSettings()}>
                <Text style={styles.buttonText}>เปิดการตั้งค่า</Text>
              </Pressable>
              <Pressable style={styles.button} onPress={check}>
                <Text style={styles.buttonText}>ลองอีกครั้ง</Text>
              </Pressable>
            </>
          )}
        </View>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: '#0C0E10', alignItems: 'center', justifyContent: 'center', padding: 32 },
  text: { color: '#fff', fontSize: 17, lineHeight: 27, textAlign: 'center' },
  button: { marginTop: 16, paddingHorizontal: 24, height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#19E68C', justifyContent: 'center' },
  buttonText: { color: '#19E68C', fontSize: 16, fontWeight: '600' },
});
