import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');
const API_URL = 'http://localhost:3000';

const THREAT_EMOJI: Record<string, string> = { RED: '🔴', ORANGE: '🟠', YELLOW: '🟡', GREEN: '🟢' };

export default function HomeScreen() {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const pickImage = useCallback(async () => {
    setError('');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Ứng dụng cần quyền truy cập ảnh để kiểm tra tin nhắn');
      return;
    }
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.85,
    });
    if (!pickerResult.canceled && pickerResult.assets?.[0]?.base64) {
      await analyzeImage(pickerResult.assets[0].base64);
    }
  }, []);

  const takePhoto = useCallback(async () => {
    setError('');
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Ứng dụng cần quyền chụp ảnh để kiểm tra tin nhắn');
      return;
    }
    const pickerResult = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.85,
    });
    if (!pickerResult.canceled && pickerResult.assets?.[0]?.base64) {
      await analyzeImage(pickerResult.assets[0].base64);
    }
  }, []);

  const analyzeImage = async (base64: string) => {
    setAnalyzing(true);
    setResult(null);
    try {
      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: base64, user_id: 'demo-user' }),
      });
      const data = await response.json();
      setResult(data);
    } catch (e: any) {
      setError('Không kết nối được. Vui lòng thử lại.');
    }
    setAnalyzing(false);
  };

  const dismissResult = () => setResult(null);

  if (analyzing) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Cháu đang xem...</Text>
        <ActivityIndicator size="large" color="#2d6a4f" />
        <Text style={styles.loadingSub}>Chờ cháu một chút nhé</Text>
      </View>
    );
  }

  if (result) {
    const threat = result.classification;
    const expl = result.explanation;
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.resultScroll}>
        <Text style={styles.verdictEmoji}>{THREAT_EMOJI[threat.threat_level] || '🟢'}</Text>
        <Text style={styles.verdictText}>{threat.threat_level_vi}</Text>
        <Text style={styles.explanationText}>{expl.verdict_line}</Text>
        <Text style={styles.explanationBody}>{expl.explanation}</Text>
        {expl.familiar_comparison && (
          <Text style={styles.comparison}>💡 {expl.familiar_comparison}</Text>
        )}
        {expl.action_steps.map((step: string, i: number) => (
          <View key={i} style={styles.step}>
            <Text style={styles.stepNumber}>{i + 1}</Text>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
        {expl.educational_tip && <Text style={styles.tip}>📚 {expl.educational_tip}</Text>}
        <TouchableOpacity style={styles.dismissButton} onPress={dismissResult}>
          <Text style={styles.dismissText}>✓ Đã hiểu</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Xin chào!</Text>
      <TouchableOpacity style={styles.mainButton} onPress={pickImage} activeOpacity={0.7}>
        <Text style={styles.mainButtonEmoji}>📷</Text>
        <Text style={styles.mainButtonText}>HỎI CHÁU</Text>
        <Text style={styles.mainButtonSub}>Chụp ảnh tin nhắn để kiểm tra</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cameraButton} onPress={takePhoto} activeOpacity={0.7}>
        <Text style={styles.cameraButtonText}>📸 Chụp ảnh ngay</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', padding: 24 },
  greeting: { fontSize: 32, fontWeight: '700', color: '#1a1a2e', marginBottom: 32 },
  mainButton: {
    width: width * 0.7, height: width * 0.7, borderRadius: width * 0.35,
    backgroundColor: '#2d6a4f', justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12,
  },
  mainButtonEmoji: { fontSize: 48, marginBottom: 8 },
  mainButtonText: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: 2 },
  mainButtonSub: { fontSize: 14, color: '#d8f3dc', marginTop: 4, textAlign: 'center', paddingHorizontal: 20 },
  cameraButton: { marginTop: 20, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 28, backgroundColor: '#f0f0f0' },
  cameraButtonText: { fontSize: 17, fontWeight: '600', color: '#2d6a4f' },
  loadingText: { fontSize: 28, fontWeight: '700', color: '#2d6a4f', marginBottom: 20 },
  loadingSub: { fontSize: 16, color: '#6b7280', marginTop: 12 },
  errorText: { marginTop: 16, color: '#991b1b', fontSize: 15, textAlign: 'center' },
  resultScroll: { padding: 24, alignItems: 'center' },
  verdictEmoji: { fontSize: 64, marginBottom: 8 },
  verdictText: { fontSize: 32, fontWeight: '800', color: '#1a1a2e', marginBottom: 8 },
  explanationText: { fontSize: 20, fontWeight: '600', color: '#1a1a2e', textAlign: 'center', marginBottom: 12 },
  explanationBody: { fontSize: 17, color: '#374151', lineHeight: 26, textAlign: 'center', marginBottom: 20 },
  comparison: { fontSize: 15, color: '#6b7280', fontStyle: 'italic', textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 },
  step: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, width: '100%' },
  stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#2d6a4f', color: '#fff', textAlign: 'center', lineHeight: 28, fontWeight: '700', fontSize: 15, overflow: 'hidden' },
  stepText: { flex: 1, fontSize: 17, lineHeight: 24, color: '#374151', marginLeft: 12 },
  tip: { fontSize: 15, color: '#6b7280', textAlign: 'center', marginBottom: 24, fontStyle: 'italic' },
  dismissButton: { paddingVertical: 16, paddingHorizontal: 48, borderRadius: 28, backgroundColor: '#2d6a4f', marginTop: 8 },
  dismissText: { fontSize: 18, fontWeight: '700', color: '#fff' },
});
