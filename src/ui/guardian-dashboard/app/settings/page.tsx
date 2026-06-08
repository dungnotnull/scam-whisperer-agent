'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Cài đặt giám hộ</h1>

      <div style={{ marginBottom: 24 }}>
        <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>Kênh nhận thông báo</label>
        <select style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d1d5db', fontSize: 15 }}>
          <option value="zalo">Zalo (khuyên dùng)</option>
          <option value="push">Thông báo đẩy (FCM)</option>
          <option value="sms">SMS (dự phòng)</option>
        </select>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>Cảnh báo</label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <input type="checkbox" defaultChecked />
          Nhận cảnh báo 🔴 NGUY HIỂM ngay lập tức
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <input type="checkbox" defaultChecked />
          Nhận cảnh báo 🟠 ĐÁ NGỜ
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" defaultChecked />
          Nhận báo cáo tuần (Chủ nhật 09:00)
        </label>
      </div>

      <button
        onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
        style={{
          padding: '12px 32px',
          background: '#1a1a2e',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: 16,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {saved ? '✔ Đã lưu' : 'Lưu cài đặt'}
      </button>
    </div>
  );
}
