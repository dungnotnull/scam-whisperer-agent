import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Linking } from 'react-native';

interface Props {
  threatLevel: string;
  onContactFamily: () => void;
  onDismiss: () => void;
}

const BANK_HOTLINES: Record<string, string> = {
  vietcombank: '1900545413',
  bidv: '19009247',
  techcombank: '1800588822',
  agribank: '1900558818',
};

export default function EmergencyScreen({ threatLevel, onContactFamily, onDismiss }: Props) {
  const callBank = (bank: string) => {
    const number = BANK_HOTLINES[bank];
    if (number) Linking.openURL(`tel:${number}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.alertEmoji}>🚨</Text>
      <Text style={styles.title}>KHẨN CẤP</Text>
      <Text style={styles.subtitle}>Ông/bà đã tương tác với tin nhắn lừa đảo</Text>

      <View style={styles.stepsContainer}>
        <View style={styles.step}>
          <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>1</Text></View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Tắt mạng ngay</Text>
            <Text style={styles.stepDesc}>Tắt wifi và dữ liệu di động để kẻ gian không truy cập được</Text>
          </View>
        </View>
        <View style={styles.step}>
          <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>2</Text></View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Gọi người thân</Text>
            <Text style={styles.stepDesc}>Báo ngay cho người thân để cùng xử lý</Text>
          </View>
        </View>
        <View style={styles.step}>
          <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>3</Text></View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Gọi ngân hàng</Text>
            <Text style={styles.stepDesc}>Yêu cầu khóa tài khoản nếu đã cung cấp thông tin</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.callFamilyBtn} onPress={onContactFamily} activeOpacity={0.7}>
        <Text style={styles.callFamilyText}>📞 Gọi người thân ngay</Text>
      </TouchableOpacity>

      <View style={styles.bankSection}>
        <Text style={styles.bankSectionTitle}>Số điện thoại ngân hàng</Text>
        <View style={styles.bankGrid}>
          {Object.entries(BANK_HOTLINES).map(([bank, number]) => (
            <TouchableOpacity key={bank} style={styles.bankBtn} onPress={() => callBank(bank)}>
              <Text style={styles.bankName}>{bank.toUpperCase()}</Text>
              <Text style={styles.bankNumber}>{number}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
        <Text style={styles.dismissText}>Đã xong</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff5f5', padding: 24, alignItems: 'center' },
  alertEmoji: { fontSize: 64, marginTop: 40, marginBottom: 12 },
  title: { fontSize: 32, fontWeight: '900', color: '#991b1b', letterSpacing: 3 },
  subtitle: { fontSize: 17, color: '#b91c1c', textAlign: 'center', marginTop: 8, marginBottom: 32 },
  stepsContainer: { width: '100%', marginBottom: 24 },
  step: { flexDirection: 'row', marginBottom: 20, alignItems: 'flex-start' },
  stepBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#dc2626', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  stepBadgeText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a2e', marginBottom: 2 },
  stepDesc: { fontSize: 14, color: '#6b7280', lineHeight: 20 },
  callFamilyBtn: { width: '100%', paddingVertical: 18, backgroundColor: '#dc2626', borderRadius: 14, alignItems: 'center', marginBottom: 24, elevation: 4 },
  callFamilyText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  bankSection: { width: '100%', marginBottom: 24 },
  bankSectionTitle: { fontSize: 15, fontWeight: '600', color: '#6b7280', marginBottom: 12 },
  bankGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  bankBtn: { paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', minWidth: 100, alignItems: 'center' },
  bankName: { fontSize: 12, fontWeight: '700', color: '#374151' },
  bankNumber: { fontSize: 13, color: '#2d6a4f', marginTop: 2 },
  dismissBtn: { paddingVertical: 14, paddingHorizontal: 40, borderRadius: 28, backgroundColor: '#e5e7eb' },
  dismissText: { fontSize: 16, fontWeight: '600', color: '#6b7280' },
});
