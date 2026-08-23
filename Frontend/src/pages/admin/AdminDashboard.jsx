import React, { useState, useEffect } from 'react';
import * as adminService from '../../services/admin.service';

const AdminDashboard = () => {
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState({ users: [], patients: [], doctors: [], appointments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Doctor creation form
  const [form, setForm] = useState({ name: '', email: '', password: '', specialization: '', qualification: '', experience: '' });
  const [createResult, setCreateResult] = useState('');
  const [creating, setCreating] = useState(false);

  // Leave form
  const [leaveDoctor, setLeaveDoctor] = useState('');
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveResult, setLeaveResult] = useState(null);
  const [leavingLoading, setLeavingLoading] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [usersRes, apptRes] = await Promise.all([
        adminService.getAdminUsers(),
        adminService.getAdminAppointments(),
      ]);
      setData({
        users: usersRes.data.users || [],
        patients: usersRes.data.patients || [],
        doctors: usersRes.data.doctors || [],
        appointments: apptRes.data.appointments || [],
      });
    } catch {
      setError('Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateResult('');
    try {
      await adminService.createDoctor({ ...form, experience: Number(form.experience) });
      setCreateResult('Doctor created successfully.');
      setForm({ name: '', email: '', password: '', specialization: '', qualification: '', experience: '' });
      await loadAll();
    } catch (err) {
      setCreateResult(err.response?.data?.error?.message || 'Failed to create doctor.');
    } finally {
      setCreating(false);
    }
  };

  const handleLeave = async (e) => {
    e.preventDefault();
    if (!leaveDoctor || !leaveDate) return;
    setLeavingLoading(true);
    setLeaveResult(null);
    try {
      const res = await adminService.addDoctorLeave(leaveDoctor, { date: leaveDate, reason: leaveReason });
      setLeaveResult(res.data);
    } catch (err) {
      setLeaveResult({ error: err.response?.data?.error?.message || 'Failed to apply leave.' });
    } finally {
      setLeavingLoading(false);
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const statusColor = { CONFIRMED: '#2F6F6D', COMPLETED: '#6FA889', CANCELLED: '#C97872', PENDING: '#B8860B' };

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'users', label: 'Users' },
    { key: 'appointments', label: 'Appointments' },
    { key: 'create-doctor', label: 'Add Doctor' },
    { key: 'leave', label: 'Doctor Leave' },
  ];

  return (
    <div style={styles.container}>
      <h2>Admin Control Center</h2>
      <p style={styles.sub}>System-wide management and oversight.</p>

      {error && <div style={styles.errorBox}>{error}</div>}

      <div style={styles.tabs}>
        {TABS.map(t => (
          <button key={t.key} style={{ ...styles.tab, ...(tab === t.key ? styles.activeTab : {}) }} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && tab !== 'create-doctor' && tab !== 'leave' ? (
        <div style={styles.loadingBox}>Loading data...</div>
      ) : (
        <>
          {/* Overview */}
          {tab === 'overview' && (
            <div style={styles.statsGrid}>
              {[
                { label: 'Total Users', val: data.users.length, color: '#2F6F6D' },
                { label: 'Patients', val: data.patients.length, color: '#6FA889' },
                { label: 'Doctors', val: data.doctors.length, color: '#4466BB' },
                { label: 'Total Appointments', val: data.appointments.length, color: '#B8860B' },
                { label: 'Confirmed', val: data.appointments.filter(a => a.status === 'CONFIRMED').length, color: '#2F6F6D' },
                { label: 'Completed', val: data.appointments.filter(a => a.status === 'COMPLETED').length, color: '#6FA889' },
                { label: 'Cancelled', val: data.appointments.filter(a => a.status === 'CANCELLED').length, color: '#C97872' },
              ].map(s => (
                <div key={s.label} className="card" style={styles.statCard}>
                  <span style={{ ...styles.statVal, color: s.color }}>{s.val}</span>
                  <span style={styles.statLabel}>{s.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Users */}
          {tab === 'users' && (
            <div className="card">
              <h3>All Users ({data.users.length})</h3>
              <table style={styles.table}>
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {data.users.map(u => (
                    <tr key={u._id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td><span style={{ ...styles.roleBadge, background: u.role === 'admin' ? '#FDF3F2' : u.role === 'doctor' ? '#F0F4FF' : '#EAF2F0', color: u.role === 'admin' ? '#C97872' : u.role === 'doctor' ? '#4466BB' : '#2F6F6D' }}>{u.role}</span></td>
                      <td>
                        <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', background: u.isActive !== false ? '#EAF2F0' : '#FDF3F2', color: u.isActive !== false ? '#2F6F6D' : '#C97872' }}>
                          {u.isActive !== false ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td>{fmt(u.createdAt)}</td>
                      <td>
                        {u.role !== 'admin' && (
                          <button
                            onClick={async () => {
                              try {
                                await adminService.toggleUserStatus(u._id);
                                await loadAll();
                              } catch (err) {
                                alert(err.response?.data?.error?.message || 'Failed to change user status.');
                              }
                            }}
                            style={{ background: 'transparent', border: `1px solid ${u.isActive !== false ? '#C97872' : '#2F6F6D'}`, color: u.isActive !== false ? '#C97872' : '#2F6F6D', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                          >
                            {u.isActive !== false ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Appointments */}
          {tab === 'appointments' && (
            <div className="card">
              <h3>All Appointments ({data.appointments.length})</h3>
              <table style={styles.table}>
                <thead>
                  <tr><th>Patient</th><th>Doctor</th><th>Date</th><th>Time</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {data.appointments.map(a => (
                    <tr key={a._id}>
                      <td>{a.patientId?.name || '—'}</td>
                      <td>{a.doctorId?.userId?.name || '—'} <span style={styles.spec}>({a.doctorId?.specialization})</span></td>
                      <td>{fmt(a.date)}</td>
                      <td>{a.startTime}</td>
                      <td><span style={{ color: statusColor[a.status], fontWeight: '600' }}>{a.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Create Doctor */}
          {tab === 'create-doctor' && (
            <div className="card" style={styles.formCard}>
              <h3>Create Doctor Account</h3>
              <form onSubmit={handleCreate} style={styles.form}>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Full Name *</label>
                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="Dr. Priya Sharma" />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Email *</label>
                    <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required placeholder="doctor@example.com" />
                  </div>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Password *</label>
                    <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Specialization *</label>
                    <input value={form.specialization} onChange={e => setForm(p => ({ ...p, specialization: e.target.value }))} required placeholder="General Medicine" />
                  </div>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Qualification *</label>
                    <input value={form.qualification} onChange={e => setForm(p => ({ ...p, qualification: e.target.value }))} required placeholder="MBBS, MD" />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Experience (years) *</label>
                    <input type="number" min="0" value={form.experience} onChange={e => setForm(p => ({ ...p, experience: e.target.value }))} required />
                  </div>
                </div>
                {createResult && <div style={createResult.includes('success') ? styles.successBox : styles.errorBox}>{createResult}</div>}
                <button type="submit" className="btn-primary" disabled={creating}>{creating ? 'Creating...' : 'Create Doctor'}</button>
              </form>
            </div>
          )}

          {/* Leave management */}
          {tab === 'leave' && (
            <div className="card" style={styles.formCard}>
              <h3>Mark Doctor Leave</h3>
              <form onSubmit={handleLeave} style={styles.form}>
                <label style={styles.label}>Select Doctor *</label>
                <select value={leaveDoctor} onChange={e => setLeaveDoctor(e.target.value)} required>
                  <option value="">— Select Doctor —</option>
                  {data.doctors.map(d => (
                    <option key={d._id} value={d._id}>{d.userId?.name} ({d.specialization})</option>
                  ))}
                </select>
                <label style={styles.label}>Leave Date *</label>
                <input type="date" value={leaveDate} onChange={e => setLeaveDate(e.target.value)} required />
                <label style={styles.label}>Reason</label>
                <input value={leaveReason} onChange={e => setLeaveReason(e.target.value)} placeholder="Conference, Personal, etc." />
                <button type="submit" className="btn-primary" disabled={leavingLoading}>{leavingLoading ? 'Applying...' : 'Apply Leave'}</button>
              </form>
              {leaveResult && !leaveResult.error && (
                <div style={styles.successBox}>
                  <strong>Leave applied!</strong>
                  <p>Conflicting appointments cancelled: {leaveResult.conflicts?.affectedCount ?? 0}</p>
                </div>
              )}
              {leaveResult?.error && <div style={styles.errorBox}>{leaveResult.error}</div>}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '20px' },
  sub: { color: '#697776', marginTop: '4px' },
  errorBox: { background: '#FDF3F2', color: '#C97872', padding: '12px', borderRadius: '8px' },
  successBox: { background: '#EAF2F0', color: '#2F6F6D', padding: '12px', borderRadius: '8px' },
  loadingBox: { textAlign: 'center', color: '#697776', padding: '40px' },
  tabs: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  tab: { padding: '8px 18px', borderRadius: '20px', border: '1px solid rgba(47,111,109,0.2)', background: 'transparent', color: '#697776', cursor: 'pointer', fontSize: '0.85rem' },
  activeTab: { background: '#2F6F6D', color: '#fff', border: '1px solid #2F6F6D' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' },
  statCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' },
  statVal: { fontSize: '2rem', fontWeight: '700' },
  statLabel: { fontSize: '0.85rem', color: '#697776' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '16px', fontSize: '0.875rem' },
  roleBadge: { padding: '3px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '600' },
  spec: { fontSize: '0.8rem', color: '#697776' },
  formCard: {},
  form: { display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '680px' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '0.85rem', fontWeight: '600', color: '#263536' },
};

export default AdminDashboard;
