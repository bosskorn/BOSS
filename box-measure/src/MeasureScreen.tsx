import { useSyncExternalStore } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ViroARSceneNavigator } from '@reactvision/react-viro';
import MeasureScene from './MeasureScene';
import { toCm } from './geometry';
import { confirm, getState, reset, State, subscribe, undo } from './store';

const HINTS = [
  'เล็งจุดกลางจอไปที่มุมล่างของกล่อง (ตรงที่กล่องแตะพื้น) แล้วกด "ปักจุด"',
  'เล็งไปที่มุมล่างอีกด้านของขอบเดียวกัน แล้วกด "ปักจุด"',
  'ขยับไปด้านข้าง เล็งที่พื้นตรงขอบฝั่งตรงข้ามของกล่อง แล้วกด "ปักจุด"',
  'เงยกล้องขึ้นจนกรอบสีเขียวพอดีกับขอบบนของกล่อง แล้วกด "ปักจุด"',
  'วัดเสร็จแล้ว',
];

function hint(s: State): string {
  if (!s.tracking) return 'ขยับมือถือช้า ๆ ไปรอบ ๆ เพื่อให้กล้องจับพื้นได้';
  if (s.step === 0 && !s.reticle) return 'เล็งกล้องไปที่พื้นข้างกล่อง แล้วขยับช้า ๆ จนมีจุดสีขาวขึ้นบนพื้น';
  return HINTS[s.step];
}

function canConfirm(s: State): boolean {
  if (s.step === 0) return !!s.reticle;
  if (s.step === 1) return s.length >= 0.02;
  if (s.step === 2) return s.width >= 0.02;
  if (s.step === 3) return s.height >= 0.02;
  return false;
}

const Value = ({ label, metres, active }: { label: string; metres: number; active: boolean }) => (
  <View style={styles.value}>
    <Text style={styles.valueLabel}>{label}</Text>
    <Text style={[styles.valueNumber, active && styles.valueActive]}>
      {metres > 0 ? toCm(metres) : '–'}
    </Text>
    <Text style={styles.valueUnit}>ซม.</Text>
  </View>
);

export default function MeasureScreen() {
  const s = useSyncExternalStore(subscribe, getState);
  const insets = useSafeAreaInsets();
  const done = s.step === 4;
  const ready = canConfirm(s);

  return (
    <View style={styles.root}>
      <ViroARSceneNavigator autofocus initialScene={{ scene: MeasureScene }} style={styles.root} />

      {!done && (
        <View pointerEvents="none" style={styles.crosshairWrap}>
          <View style={[styles.crosshair, ready && styles.crosshairReady]} />
        </View>
      )}

      <View style={[styles.top, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.stepText}>{done ? 'ผลการวัด' : `ขั้นที่ ${s.step + 1} จาก 4`}</Text>
        <Text style={styles.hint}>{hint(s)}</Text>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.values}>
          <Value label="ด้านที่ 1" metres={s.length} active={s.step === 1} />
          <Value label="ด้านที่ 2" metres={s.width} active={s.step === 2} />
          <Value label="สูง" metres={s.height} active={s.step === 3} />
        </View>
        {s.step === 3 && s.snapped && <Text style={styles.note}>จับผิวด้านบนของกล่องได้ ใช้ความสูงจากผิวที่ตรวจพบ</Text>}
        {done && <Text style={styles.note}>ค่าที่ได้เป็นค่าประมาณ อาจคลาดเคลื่อนราว 1–2 ซม.</Text>}

        <View style={styles.buttons}>
          <Pressable
            style={[styles.button, styles.secondary, s.step === 0 && styles.disabled]}
            disabled={s.step === 0}
            onPress={undo}
          >
            <Text style={styles.secondaryText}>ย้อนกลับ</Text>
          </Pressable>
          {done ? (
            <Pressable style={[styles.button, styles.primary]} onPress={reset}>
              <Text style={styles.primaryText}>วัดกล่องใหม่</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.button, styles.primary, !ready && styles.disabled]}
              disabled={!ready}
              onPress={confirm}
            >
              <Text style={styles.primaryText}>ปักจุด</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const GREEN = '#19E68C';
const PANEL = 'rgba(12,14,16,0.78)';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  crosshairWrap: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' },
  crosshair: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)' },
  crosshairReady: { borderColor: GREEN },
  top: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: 14, backgroundColor: PANEL },
  stepText: { color: GREEN, fontSize: 13, fontWeight: '600', marginBottom: 4 },
  hint: { color: '#fff', fontSize: 16, lineHeight: 24 },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 16, backgroundColor: PANEL },
  values: { flexDirection: 'row', justifyContent: 'space-between' },
  value: { flex: 1, alignItems: 'center' },
  valueLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  valueNumber: { color: '#fff', fontSize: 30, fontWeight: '700', fontVariant: ['tabular-nums'] },
  valueActive: { color: GREEN },
  valueUnit: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  note: { color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center', marginTop: 10 },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  button: { height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  primary: { flex: 2, backgroundColor: GREEN },
  primaryText: { color: '#06281A', fontSize: 18, fontWeight: '700' },
  secondary: { flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  secondaryText: { color: '#fff', fontSize: 16 },
  disabled: { opacity: 0.35 },
});
