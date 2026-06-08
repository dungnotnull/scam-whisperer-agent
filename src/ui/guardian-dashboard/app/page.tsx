'use client';

import { useState, useEffect } from 'react';

interface AlertLog {
  id: string;
  timestamp: string;
  user_name: string;
  threat_level: 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN';
  summary: string;
  category: string;
  action_taken: string;
}

const THREAT_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  RED: { bg: '#fee2e2', text: '#991b1b', label: 'NGUY HIỂM' },
  ORANGE: { bg: '#ffedd5', text: '#9a3412', label: 'ĐÁ NGỜ' },
  YELLOW: { bg: '#fef9c3', text: '#854d0e', label: 'CHÚ Ý' },
  GREEN: { bg: '#dcfce7', text: '#166534', label: 'AN TOÀN' },
};

function AlertCard({ alert }: { alert: AlertLog }) {
  const colors = THREAT_COLORS[alert.threat_level] || THREAT_COLORS.GREEN;
  return (
    <div style={{ border: `1px solid ${colors.bg}`, borderRadius: 10, padding: 16, marginBottom: 12, backgroundColor: colors.bg }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 16, color: colors.text }}>{colors.label}</span>
        <span style={{ fontSize: 13, color: '#6b7280' }}>{new Date(alert.timestamp).toLocaleString('vi-VN')}</span>
      </div>
      <p style={{ margin: '4px 0', fontWeight: 500 }}>{alert.summary}</p>
      <p style={{ margin: '4px 0', fontSize: 14, color: '#4b5563' }}>Hành động: {alert.action_taken}</p>
      {alert.category && <span style={{ fontSize: 12, color: '#6b7280', background: '#fff', padding: '2px 8px', borderRadius: 12 }}>{alert.category}</span>}
    </div>
  );
}

export default function DashboardPage() {
  const [alerts, setAlerts] = useState<AlertLog[]>([]);

  useEffect(() => {
    fetch('/api/guardian/alerts')
      .then((r) => r.json())
      .then((data) => setAlerts(data.alerts || []))
      .catch(() => setAlerts([]));
  }, []);

  const redCount = alerts.filter((a) => a.threat_level === 'RED').length;
  const orangeCount = alerts.filter((a) => a.threat_level === 'ORANGE').length;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>🛡️ Scam Whisperer</h1>
        <p style={{ color: '#6b7280', marginTop: 4 }}>Bảng giám sát an toàn cho người thân</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
        <div style={{ background: '#fee2e2', borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#991b1b' }}>{redCount}</div>
          <div style={{ fontSize: 14, color: '#991b1b' }}>Cảnh báo nguy hiểm</div>
        </div>
        <div style={{ background: '#ffedd5', borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#9a3412' }}>{orangeCount}</div>
          <div style={{ fontSize: 14, color: '#9a3412' }}>Cảnh báo đáng ngờ</div>
        </div>
      </div>

      <section>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Lịch sử cảnh báo</h2>
        {alerts.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: 40 }}>
            Chưa có cảnh báo nào. Hệ thống đang theo dõi an toàn.
          </p>
        ) : (
          alerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)
        )}
      </section>
    </div>
  );
}
