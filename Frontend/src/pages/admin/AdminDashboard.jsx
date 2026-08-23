import React, { useState, useEffect } from 'react';
import * as adminService from '../../services/admin.service';

const AdminDashboard = () => {
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState({ users: [], patients: [], doctors: [], appointments: [] });
  const [analytics, setAnalytics] = useState(null);
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
      const [usersRes, apptRes, analyticsRes] = await Promise.all([
        adminService.getAdminUsers(),
        adminService.getAdminAppointments(),
        adminService.getAdminAnalytics(),
      ]);
      setData({
        users: usersRes.data.users || [],
        patients: usersRes.data.patients || [],
        doctors: usersRes.data.doctors || [],
        appointments: apptRes.data.appointments || [],
      });
      if (analyticsRes.success) {
        setAnalytics(analyticsRes.data.analytics);
      }
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
  const statusColor = { CONFIRMED: '#2F6F6D', COMPLETED: '#6FA889', CANCELLED: '#C97872', PENDING: '#B8860B', REJECTED: '#C97872' };

  const TABS = [
    { key: 'overview', label: 'Overview & Analytics' },
    { key: 'users', label: 'Users' },
    { key: 'appointments', label: 'Appointments' },
    { key: 'create-doctor', label: 'Add Doctor' },
    { key: 'leave', label: 'Doctor Leave' },
  ];

  const ov = analytics?.overview || {
    totalUsers: data.users.length,
    patientsCount: data.patients.length,
    doctorsCount: data.doctors.length,
    totalAppointments: data.appointments.length,
    upcomingAppointments: data.appointments.filter(a => a.status === 'CONFIRMED' || a.status === 'PENDING').length,
    completedAppointments: data.appointments.filter(a => a.status === 'COMPLETED').length,
    cancelledAppointments: data.appointments.filter(a => a.status === 'CANCELLED').length,
    rejectedAppointments: data.appointments.filter(a => a.status === 'REJECTED').length,
    activeUsers: data.users.filter(u => u.isActive !== false).length,
    deactivatedUsers: data.users.filter(u => u.isActive === false).length,
  };

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Admin Control Center</h2>
          <p style={styles.sub}>System-wide real-time MongoDB Atlas analytics, oversight, and operational management.</p>
        </div>
        <button onClick={loadAll} style={styles.refreshBtn}>
          🔄 Refresh Analytics
        </button>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      <div style={styles.tabs}>
        {TABS.map(t => (
          <button key={t.key} style={{ ...styles.tab, ...(tab === t.key ? styles.activeTab : {}) }} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && tab !== 'create-doctor' && tab !== 'leave' ? (
        <div style={styles.loadingBox}>Loading real-time analytics...</div>
      ) : (
        <>
          {/* Overview & Analytics */}
          {tab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Stat Cards */}
              <div style={styles.statsGrid}>
                {[
                  { label: 'Total System Users', val: ov.totalUsers, color: '#2F6F6D' },
                  { label: 'Patients', val: ov.patientsCount, color: '#6FA889' },
                  { label: 'Doctors', val: ov.doctorsCount, color: '#4466BB' },
                  { label: 'Active Users', val: ov.activeUsers, color: '#2F6F6D' },
                  { label: 'Deactivated Users', val: ov.deactivatedUsers, color: '#C97872' },
                  { label: 'Total Appointments', val: ov.totalAppointments, color: '#B8860B' },
                  { label: 'Upcoming / Confirmed', val: ov.upcomingAppointments, color: '#2F6F6D' },
                  { label: 'Completed Visits', val: ov.completedAppointments, color: '#6FA889' },
                  { label: 'Cancelled', val: ov.cancelledAppointments, color: '#C97872' },
                  { label: 'Rejected', val: ov.rejectedAppointments, color: '#C97872' },
                ].map(s => (
                  <div key={s.label} className="card" style={styles.statCard}>
                    <span style={{ ...styles.statVal, color: s.color }}>{s.val}</span>
                    <span style={styles.statLabel}>{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Visualization Section: Appointment Status Distribution */}
              <div style={styles.analyticsRow}>
                <div className="card" style={{ flex: 1 }}>
                  <h3>Appointment Status Breakdown</h3>
                  <p style={styles.sub}>Distribution calculated dynamically from MongoDB Atlas.</p>
                  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { key: 'CONFIRMED', label: 'Confirmed', count: analytics?.statusCounts?.CONFIRMED || 0, color: '#2F6F6D' },
                      { key: 'COMPLETED', label: 'Completed', count: analytics?.statusCounts?.COMPLETED || 0, color: '#6FA889' },
                      { key: 'PENDING', label: 'Pending', count: analytics?.statusCounts?.PENDING || 0, color: '#B8860B' },
                      { key: 'CANCELLED', label: 'Cancelled', count: analytics?.statusCounts?.CANCELLED || 0, color: '#C97872' },
                      { key: 'REJECTED', label: 'Rejected', count: analytics?.statusCounts?.REJECTED || 0, color: '#E06D63' },
                    ].map(st => {
                      const total = ov.totalAppointments || 1;
                      const pct = Math.round((st.count / total) * 100);
                      return (
                        <div key={st.key}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                            <span style={{ fontWeight: '600', color: st.color }}>{st.label} ({st.count})</span>
                            <span style={{ color: '#697776' }}>{pct}%</span>
                          </div>
                          <div style={{ height: '8px', background: '#F0F4FF', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: st.color, borderRadius: '4px', transition: 'width 0.4s ease' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Specialization Distribution */}
                <div className="card" style={{ flex: 1 }}>
                  <h3>Doctor Specialization Distribution</h3>
                  <p style={styles.sub}>Registered medical specialties.</p>
                  {analytics?.specializationDistribution?.length ? (
                    <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {analytics.specializationDistribution.map(sp => (
                        <div key={sp.specialization} style={styles.specBadge}>
                          <strong style={{ color: '#2F6F6D' }}>{sp.specialization}</strong>
                          <span style={styles.badgeCount}>{sp.count} doctor{sp.count > 1 ? 's' : ''}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#697776', fontSize: '0.9rem', marginTop: '16px' }}>No doctor specializations registered.</p>
                  )}
                </div>
              </div>

              {/* Doctor Workload Analytics */}
              <div className="card">
                <h3>Doctor Workload Analytics</h3>
                <p style={styles.sub}>Appointments dynamically aggregated per attending doctor.</p>
                {analytics?.doctorWorkload?.length ? (
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th>Doctor Name</th>
                        <th>Email</th>
                        <th>Specialization</th>
                        <th>Total Appts</th>
                        <th>Upcoming</th>
                        <th>Completed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.doctorWorkload.map(dw => (
                        <tr key={dw.doctorId}>
                          <td><strong>{dw.name}</strong></td>
                          <td>{dw.email}</td>
                          <td><span style={styles.roleBadge}>{dw.specialization}</span></td>
                          <td>{dw.totalAppointments}</td>
                          <td><span style={{ color: '#2F6F6D', fontWeight: '600' }}>{dw.upcomingAppointments}</span></td>
                          <td><span style={{ color: '#6FA889', fontWeight: '600' }}>{dw.completedAppointments}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ color: '#697776', fontSize: '0.9rem', marginTop: '12px' }}>No doctor workload records available.</p>
                )}
              </div>
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
                  <tr><th>Patient</th><th>Doctor</th><th>Date</th><th>Time</th><th>Status</th><th>Google Calendar</th></tr>
                </thead>
                <tbody>
                  {data.appointments.map(a => (
                    <tr key={a._id}>
                      <td>{a.patientId?.name || '—'}</td>
                      <td>{a.doctorId?.userId?.name || '—'} <span style={styles.spec}>({a.doctorId?.specialization})</span></td>
                      <td>{fmt(a.date)}</td>
                      <td>{a.startTime}</td>
                      <td><span style={{ color: statusColor[a.status], fontWeight: '600' }}>{a.status}</span></td>
                      <td>
                        <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', background: a.googleCalendarSyncStatus === 'SYNCED' ? '#EAF2F0' : '#FDF8EE', color: a.googleCalendarSyncStatus === 'SYNCED' ? '#2F6F6D' : '#B8860B' }}>
                          {a.googleCalendarSyncStatus || 'PENDING'}
                        </span>
                      </td>
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
                    <input type="text" placeholder="Dr. Ananya Roy" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Email *</label>
                    <input type="email" placeholder="ananya@careflow.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                  </div>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Password *</label>
                    <input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Specialization *</label>
                    <input type="text" placeholder="Cardiology, Dermatology, Neurology" value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} required />
                  </div>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Qualification *</label>
                    <input type="text" placeholder="MD, MBBS, MS" value={form.qualification} onChange={e => setForm({ ...form, qualification: e.target.value })} required />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Years of Experience *</label>
                    <input type="number" min="0" placeholder="10" value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} required />
                  </div>
                </div>
                <button type="submit" className="btn-primary" disabled={creating} style={{ marginTop: '8px' }}>
                  {creating ? 'Creating...' : 'Create Doctor Account'}
                </button>
              </form>
              {createResult && <div style={createResult.includes('successfully') ? styles.successBox : styles.errorBox}>{createResult}</div>}
            </div>
          )}

          {/* Doctor Leave Management */}
          {tab === 'leave' && (
            <div className="card" style={styles.formCard}>
              <h3>Mark Doctor Leave</h3>
              <p style={styles.sub}>Mark a doctor absent for a specific date. Conflicting appointments will automatically be cancelled.</p>
              <form onSubmit={handleLeave} style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Select Doctor *</label>
                  <select value={leaveDoctor} onChange={e => setLeaveDoctor(e.target.value)} required>
                    <option value="">-- Choose Doctor --</option>
                    {data.doctors.map(d => (
                      <option key={d._id} value={d._id}>
                        {d.userId?.name || 'Doctor'} ({d.specialization})
                      </option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Leave Date *</label>
                  <input type="date" value={leaveDate} onChange={e => setLeaveDate(e.target.value)} required />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Reason</label>
                  <input type="text" placeholder="e.g. Annual Leave, Medical Conference" value={leaveReason} onChange={e => setLeaveReason(e.target.value)} />
                </div>
                <button type="submit" className="btn-primary" disabled={leavingLoading}>
                  {leavingLoading ? 'Applying Leave...' : 'Apply Leave & Resolve Conflicts'}
                </button>
              </form>

              {leaveResult && (
                <div style={leaveResult.error ? styles.errorBox : styles.successBox}>
                  {leaveResult.error ? (
                    leaveResult.error
                  ) : (
                    <div>
                      <strong>Leave applied successfully for {fmt(leaveResult.leave?.date)}.</strong>
                      <p style={{ marginTop: '4px', fontSize: '0.85rem' }}>
                        Affected appointments cancelled: <strong>{leaveResult.conflicts?.affectedCount || 0}</strong>. Patients notified via email/system alerts.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '20px' },
  sub: { color: '#697776', marginTop: '4px', fontSize: '0.9rem' },
  errorBox: { background: '#FDF3F2', color: '#C97872', padding: '12px', borderRadius: '8px' },
  successBox: { background: '#EAF2F0', color: '#2F6F6D', padding: '12px', borderRadius: '8px', marginTop: '16px' },
  loadingBox: { textAlign: 'center', color: '#697776', padding: '40px' },
  tabs: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  tab: { padding: '8px 18px', borderRadius: '20px', border: '1px solid rgba(47,111,109,0.2)', background: 'transparent', color: '#697776', cursor: 'pointer', fontSize: '0.85rem' },
  activeTab: { background: '#2F6F6D', color: '#fff', border: '1px solid #2F6F6D' },
  refreshBtn: { background: '#EAF2F0', color: '#2F6F6D', border: '1px solid #2F6F6D', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' },
  statCard: { display: 'flex', flexDirection: 'column', gap: '4px', padding: '16px' },
  statVal: { fontSize: '2rem', fontWeight: '700' },
  statLabel: { fontSize: '0.8rem', color: '#697776', fontWeight: '500' },
  analyticsRow: { display: 'flex', gap: '24px', flexWrap: 'wrap' },
  specBadge: { background: '#F7F8F5', border: '1px solid rgba(47,111,109,0.15)', padding: '10px 14px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.85rem' },
  badgeCount: { fontSize: '0.75rem', color: '#697776' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '12px', fontSize: '0.875rem' },
  roleBadge: { padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '600', background: '#EAF2F0', color: '#2F6F6D' },
  spec: { fontSize: '0.8rem', color: '#697776' },
  formCard: { maxWidth: '560px' },
  form: { display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '0.85rem', fontWeight: '500', color: '#263536' },
};

export default AdminDashboard;
