import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';

type FormOfAddress = 'ông' | 'bà' | 'thầy' | 'cô' | 'bác' | 'cụ';
type Region = 'north' | 'south' | 'central';
type VoicePreference = 'north_female' | 'north_male' | 'south_female' | 'south_male';

const ADDRESS_OPTIONS: FormOfAddress[] = ['ông', 'bà', 'thầy', 'cô', 'bác', 'cụ'];
const REGION_OPTIONS: { value: Region; label: string }[] = [
  { value: 'north', label: 'Bắc (Hà Nội)' },
  { value: 'south', label: 'Nam (TP.HCM)' },
  { value: 'central', label: 'Trung (Huế/Đà Nẵng)' },
];
const VOICE_OPTIONS: { value: VoicePreference; label: string }[] = [
  { value: 'north_female', label: 'Nữ miền Bắc' },
  { value: 'south_female', label: 'Nữ miền Nam' },
  { value: 'north_male', label: 'Nam miền Bắc' },
  { value: 'south_male', label: 'Nam miền Nam' },
];

export default function SetupWizard({ onComplete }: { onComplete: (data: any) => void }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [formOfAddress, setFormOfAddress] = useState<FormOfAddress>('ông');
  const [region, setRegion] = useState<Region>('south');
  const [voicePref, setVoicePref] = useState<VoicePreference>('south_female');
  const [guardianPhone, setGuardianPhone] = useState('');

  const next = () => setStep((s) => Math.min(s + 1, 4));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <Text style={styles.title}>Cài đặt lần đầu</Text>
      <View style={styles.progressBar}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.progressDot, step >= i && styles.progressActive]} />
        ))}
      </View>
      {step === 0 && (
        <View>
          <Text style={styles.q}>Tên của ông/bà là gì?</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nhập tên" placeholderTextColor="#aaa" />
        </View>
      )}
      {step === 1 && (
        <View>
          <Text style={styles.q}>Cháu gọi ông/bà là gì?</Text>
          <View style={styles.options}>
            {ADDRESS_OPTIONS.map((a) => (
              <TouchableOpacity key={a} style={[styles.optChip, formOfAddress === a && styles.optActive]} onPress={() => setFormOfAddress(a)}>
                <Text style={[styles.optText, formOfAddress === a && styles.optActiveText]}>{a}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      {step === 2 && (
        <View>
          <Text style={styles.q}>Ông bà ở vùng nào?</Text>
          <View style={styles.options}>
            {REGION_OPTIONS.map((r) => (
              <TouchableOpacity key={r.value} style={[styles.optChipLarge, region === r.value && styles.optActive]} onPress={() => setRegion(r.value)}>
                <Text style={[styles.optText, region === r.value && styles.optActiveText]}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.qSub}>Chọn giọng nói của cháu</Text>
          <View style={styles.options}>
            {VOICE_OPTIONS.map((v) => (
              <TouchableOpacity key={v.value} style={[styles.optChipLarge, voicePref === v.value && styles.optActive]} onPress={() => setVoicePref(v.value)}>
                <Text style={[styles.optText, voicePref === v.value && styles.optActiveText]}>{v.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      {step === 3 && (
        <View>
          <Text style={styles.q}>Số điện thoại của người thân?</Text>
          <Text style={styles.qSub}>Cháu sẽ báo tin cho người này khi phát hiện lừa đảo</Text>
          <TextInput style={styles.input} value={guardianPhone} onChangeText={setGuardianPhone} placeholder="Số điện thoại" placeholderTextColor="#aaa" keyboardType="phone-pad" />
        </View>
      )}
      {step === 4 && (
        <View>
          <Text style={styles.qDone}>Sẵn sàng rồi!</Text>
          <Text style={styles.summary}>
            {name ? `${name}, ` : ''}cháu sẽ gọi là <Text style={{ fontWeight: '700' }}>{formOfAddress}</Text>{'\n'}
            Giọng nói: {VOICE_OPTIONS.find((v) => v.value === voicePref)?.label}{'\n'}
            Người thân: {guardianPhone || 'chưa có'}
          </Text>
        </View>
      )}
      <View style={styles.nav}>
        {step > 0 && <TouchableOpacity style={styles.navBtn} onPress={prev}><Text style={styles.navText}>← Quay lại</Text></TouchableOpacity>}
        {step < 4 && (
          <TouchableOpacity style={[styles.navBtn, styles.navNext]} onPress={next} disabled={step === 0 && !name}>
            <Text style={[styles.navText, styles.navNextText]}>Tiếp theo →</Text>
          </TouchableOpacity>
        )}
        {step === 4 && (
          <TouchableOpacity style={[styles.navBtn, styles.navNext]} onPress={() => onComplete({ name, formOfAddress, region, voicePref, guardianPhone })}>
            <Text style={[styles.navText, styles.navNextText]}>Bắt đầu dùng</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { padding: 32, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#1a1a2e', marginBottom: 24 },
  progressBar: { flexDirection: 'row', gap: 8, marginBottom: 32 },
  progressDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#e5e7eb' },
  progressActive: { backgroundColor: '#2d6a4f' },
  q: { fontSize: 22, fontWeight: '700', color: '#1a1a2e', textAlign: 'center', marginBottom: 20 },
  qSub: { fontSize: 15, color: '#6b7280', textAlign: 'center', marginBottom: 16 },
  qDone: { fontSize: 28, fontWeight: '800', color: '#2d6a4f', textAlign: 'center', marginBottom: 16 },
  summary: { fontSize: 17, lineHeight: 28, color: '#374151', textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, padding: 16, fontSize: 18, width: '100%', maxWidth: 320, textAlign: 'center' },
  options: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 20, maxWidth: 340 },
  optChip: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 24, backgroundColor: '#f0f0f0' },
  optChipLarge: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, backgroundColor: '#f0f0f0', minWidth: 140, alignItems: 'center' },
  optActive: { backgroundColor: '#2d6a4f' },
  optText: { fontSize: 17, color: '#374151' },
  optActiveText: { color: '#fff', fontWeight: '600' },
  nav: { flexDirection: 'row', gap: 16, marginTop: 32 },
  navBtn: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 28 },
  navNext: { backgroundColor: '#2d6a4f' },
  navText: { fontSize: 16, fontWeight: '600', color: '#6b7280' },
  navNextText: { color: '#fff' },
});
