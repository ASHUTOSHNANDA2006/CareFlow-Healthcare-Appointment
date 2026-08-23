import React, { useState, useEffect } from 'react';
import * as notificationService from '../../services/notification.service';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const typeLabel = {
    BOOKING_CONFIRMATION: 'Booking Confirmed',
    CANCELLATION: 'Appointment Cancelled',
    RESCHEDULE: 'Appointment Rescheduled',
    VISIT_COMPLETED: 'Visit Completed',
    REMINDER: 'Reminder',
  };

  const typeBg = {
    BOOKING_CONFIRMATION: '#EAF2F0',
    CANCELLATION: '#FDF3F2',
    RESCHEDULE: '#FDF8EE',
    VISIT_COMPLETED: '#EAF2F0',
    REMINDER: '#F0F4FF',
  };

  const typeColor = {
    BOOKING_CONFIRMATION: '#2F6F6D',
    CANCELLATION: '#C97872',
    RESCHEDULE: '#B8860B',
    VISIT_COMPLETED: '#2F6F6D',
    REMINDER: '#4466BB',
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await notificationService.getNotifications();
        if (res.success) setNotifications(res.data.notifications);
      } catch {
        setError('Failed to load notifications.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, status: 'SENT' } : n));
    } catch { /* silent */ }
  };

  const fmt = (d) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div style={styles.container}>
      <h2>Notifications</h2>
      <p style={styles.sub}>Your recent system alerts and updates.</p>

      {error && <div style={styles.errorBox}>{error}</div>}

      {loading ? (
        <div style={styles.loadingBox}>Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="card" style={styles.empty}>No notifications yet.</div>
      ) : (
        <div style={styles.list}>
          {notifications.map(n => (
            <div
              key={n._id}
              className="card"
              style={{
                ...styles.notifCard,
                opacity: n.status === 'SENT' ? 0.7 : 1,
                borderLeft: `4px solid ${typeColor[n.type] || '#2F6F6D'}`,
              }}
            >
              <div style={styles.notifHeader}>
                <span style={{ ...styles.badge, background: typeBg[n.type] || '#EAF2F0', color: typeColor[n.type] || '#2F6F6D' }}>
                  {typeLabel[n.type] || n.type}
                </span>
                <span style={styles.time}>{fmt(n.createdAt)}</span>
              </div>
              {n.metadata?.date && (
                <p style={styles.meta}>
                  Date: <strong>{n.metadata.date}</strong>
                  {n.metadata.startTime && <> at <strong>{n.metadata.startTime}</strong></>}
                </p>
              )}
              {n.status !== 'SENT' && (
                <button style={styles.readBtn} onClick={() => handleMarkRead(n._id)}>Mark as read</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '20px' },
  sub: { color: '#697776', marginTop: '4px' },
  errorBox: { background: '#FDF3F2', color: '#C97872', padding: '12px', borderRadius: '8px' },
  loadingBox: { textAlign: 'center', color: '#697776', padding: '40px' },
  empty: { textAlign: 'center', color: '#697776', padding: '40px' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  notifCard: { display: 'flex', flexDirection: 'column', gap: '8px' },
  notifHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  badge: { padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600' },
  time: { fontSize: '0.8rem', color: '#697776' },
  meta: { fontSize: '0.9rem', color: '#263536' },
  readBtn: { alignSelf: 'flex-start', background: 'transparent', border: '1px solid #697776', color: '#697776', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' },
};

export default NotificationsPage;
