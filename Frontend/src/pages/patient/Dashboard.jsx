import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppointments } from '../../context/AppointmentContext';
import * as appointmentService from '../../services/appointment.service';
import * as visitNoteService from '../../services/visitNote.service';

const STATUS_COLOR = {
  CONFIRMED: { bg: '#EAF2F0', color: '#2F6F6D' },
  COMPLETED: { bg: '#E8F4ED', color: '#4A9068' },
  CANCELLED: { bg: '#FDF3F2', color: '#C97872' },
};

const Dashboard = () => {
  const { user } = useAuth();
  const { appointments, loading, fetchAppointments } = useAppointments();
  const navigate = useNavigate();

  const [viewingDetail, setViewingDetail] = useState(null); // full appointment detail
  const [detailLoading, setDetailLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const openDetail = async (appId) => {
    if (viewingDetail?._id === appId) { setViewingDetail(null); return; }
    setDetailLoading(true);
    try {
      const res = await visitNoteService.getAppointmentById(appId);
      if (res.success) setViewingDetail(res.data.appointment);
    } catch {
      setError('Could not load appointment detail.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCancel = async (appId) => {
    if (!window.confirm('Cancel this appointment?')) return;
    setCancellingId(appId);
    try {
      await appointmentService.cancelAppointment(appId);
      await fetchAppointments();
      if (viewingDetail?._id === appId) setViewingDetail(null);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to cancel appointment.');
    } finally {
      setCancellingId(null);
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const upcoming = appointments.filter(a => a.status === 'CONFIRMED');
  const completed = appointments.filter(a => a.status === 'COMPLETED');

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2>Welcome back, {user.name}</h2>
          <p style={styles.sub}>Here is what's happening with your care.</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/doctors')} style={styles.bookBtn}>
          + Book Appointment
        </button>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        {[
          { label: 'Upcoming', val: upcoming.length, color: '#2F6F6D' },
          { label: 'Completed Visits', val: completed.length, color: '#4A9068' },
          { label: 'Total', val: appointments.length, color: '#697776' },
        ].map(s => (
          <div key={s.label} className="card" style={styles.statCard}>
            <span style={{ ...styles.statVal, color: s.color }}>{s.val}</span>
            <span style={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      <div style={styles.grid}>
        {/* Appointment list */}
        <div className="card">
          <h3>Your Appointments</h3>
          {loading ? (
            <p style={styles.muted}>Loading...</p>
          ) : appointments.length === 0 ? (
            <div style={styles.empty}>
              <p>No appointments yet.</p>
              <button className="btn-primary" onClick={() => navigate('/doctors')}>Find a Doctor</button>
            </div>
          ) : (
            <div style={styles.list}>
              {appointments.map(app => (
                <div
                  key={app._id}
                  style={{ ...styles.appRow, ...(viewingDetail?._id === app._id ? styles.selectedRow : {}) }}
                  onClick={() => openDetail(app._id)}
                >
                  <div style={styles.appLeft}>
                    <span style={styles.docName}>{app.doctorId?.userId?.name || 'Doctor'}</span>
                    <span style={styles.spec}>{app.doctorId?.specialization}</span>
                    <span style={styles.datetime}>{fmt(app.date)} · {app.startTime}–{app.endTime}</span>
                  </div>
                  <div style={styles.appRight}>
                    <span style={{ ...styles.badge, ...STATUS_COLOR[app.status] }}>{app.status}</span>
                    {app.status === 'CONFIRMED' && (
                      <button
                        style={styles.cancelBtn}
                        disabled={cancellingId === app._id}
                        onClick={e => { e.stopPropagation(); handleCancel(app._id); }}
                      >
                        {cancellingId === app._id ? '...' : 'Cancel'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div>
          {detailLoading && <div className="card" style={styles.muted}>Loading details...</div>}

          {viewingDetail && !detailLoading && (
            <div className="card">
              <div style={styles.detailHeader}>
                <h4>Appointment Details</h4>
                <button style={styles.closeBtn} onClick={() => setViewingDetail(null)}>✕</button>
              </div>
              <p style={styles.detailMeta}><strong>Doctor:</strong> {viewingDetail.doctorId?.userId?.name}</p>
              <p style={styles.detailMeta}><strong>Specialization:</strong> {viewingDetail.doctorId?.specialization}</p>
              <p style={styles.detailMeta}><strong>Date:</strong> {fmt(viewingDetail.date)}</p>
              <p style={styles.detailMeta}><strong>Time:</strong> {viewingDetail.startTime}–{viewingDetail.endTime}</p>
              <p style={styles.detailMeta}><strong>Status:</strong> {viewingDetail.status}</p>

              {/* Symptoms */}
              {viewingDetail.symptomReportId && (
                <>
                  <hr style={styles.divider} />
                  <h5>Your Symptoms</h5>
                  <p style={styles.detailMeta}>{viewingDetail.symptomReportId.symptoms}</p>
                  {viewingDetail.symptomReportId.aiSummary?.urgency && (
                    <p style={styles.detailMeta}>
                      <strong>AI Urgency:</strong> {viewingDetail.symptomReportId.aiSummary.urgency}
                      {' — '}{viewingDetail.symptomReportId.aiSummary.chiefComplaint}
                    </p>
                  )}
                </>
              )}

              {/* Visit notes */}
              {viewingDetail.visitNoteId && (
                <>
                  <hr style={styles.divider} />
                  <h5>Doctor's Notes</h5>
                  <p style={styles.detailMeta}><strong>Notes:</strong> {viewingDetail.visitNoteId.clinicalNotes}</p>
                  {viewingDetail.visitNoteId.diagnosis && (
                    <p style={styles.detailMeta}><strong>Diagnosis:</strong> {viewingDetail.visitNoteId.diagnosis}</p>
                  )}
                  {viewingDetail.visitNoteId.followUp && (
                    <p style={styles.detailMeta}><strong>Follow-up:</strong> {viewingDetail.visitNoteId.followUp}</p>
                  )}

                  {viewingDetail.visitNoteId.prescription?.length > 0 && (
                    <>
                      <strong style={{ fontSize: '0.85rem' }}>Prescription:</strong>
                      <ul style={styles.rxList}>
                        {viewingDetail.visitNoteId.prescription.map((p, i) => (
                          <li key={i}>{p.name} — {p.dosage}, {p.frequency}, {p.duration}</li>
                        ))}
                      </ul>
                    </>
                  )}

                  {viewingDetail.visitNoteId.patientSummary?.summary && (
                    <div style={styles.aiBox}>
                      <strong>AI Summary for You</strong>
                      <p>{viewingDetail.visitNoteId.patientSummary.summary}</p>
                      {viewingDetail.visitNoteId.patientSummary.precautions?.length > 0 && (
                        <p><strong>Precautions:</strong> {viewingDetail.visitNoteId.patientSummary.precautions.join(', ')}</p>
                      )}
                    </div>
                  )}
                </>
              )}

              {viewingDetail.status === 'COMPLETED' && (
                <button style={{ ...styles.cancelBtn, marginTop: '16px', width: '100%' }} onClick={() => navigate('/visits')}>
                  View Full Visit History →
                </button>
              )}
            </div>
          )}

          {!viewingDetail && !detailLoading && (
            <div className="card" style={styles.empty}>
              <p>Click an appointment to see details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  sub: { color: '#697776', marginTop: '4px' },
  bookBtn: { whiteSpace: 'nowrap' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' },
  statCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '4px' },
  statVal: { fontSize: '2rem', fontWeight: '700' },
  statLabel: { fontSize: '0.8rem', color: '#697776' },
  errorBox: { background: '#FDF3F2', color: '#C97872', padding: '12px', borderRadius: '8px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' },
  list: { display: 'flex', flexDirection: 'column', gap: '0' },
  appRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 0', borderBottom: '1px solid #F7F8F5', cursor: 'pointer',
  },
  selectedRow: { background: '#F0F9F8', borderRadius: '8px', padding: '14px 12px' },
  appLeft: { display: 'flex', flexDirection: 'column', gap: '3px' },
  appRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' },
  docName: { fontWeight: '600', color: '#263536', fontSize: '0.95rem' },
  spec: { fontSize: '0.8rem', color: '#2F6F6D', fontWeight: '500' },
  datetime: { fontSize: '0.8rem', color: '#697776' },
  badge: { padding: '3px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '600' },
  cancelBtn: {
    background: 'transparent', border: '1px solid rgba(201,120,114,0.4)',
    color: '#C97872', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.78rem',
  },
  muted: { color: '#697776', textAlign: 'center', padding: '20px' },
  empty: { textAlign: 'center', color: '#697776', padding: '30px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' },
  detailHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  closeBtn: { background: 'transparent', border: 'none', color: '#697776', cursor: 'pointer', fontSize: '1.1rem' },
  detailMeta: { fontSize: '0.875rem', color: '#263536', marginBottom: '6px' },
  divider: { margin: '16px 0', borderColor: 'rgba(47,111,109,0.1)' },
  rxList: { fontSize: '0.85rem', paddingLeft: '20px', marginTop: '6px' },
  aiBox: { background: '#EAF2F0', padding: '14px', borderRadius: '8px', marginTop: '14px', fontSize: '0.875rem', lineHeight: '1.6' },
};

export default Dashboard;
