import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppointments } from '../../context/AppointmentContext';
import * as appointmentService from '../../services/appointment.service';
import * as visitNoteService from '../../services/visitNote.service';

/* ─── Status config ─── */
const STATUS_CONFIG = {
  CONFIRMED:  { bg: '#d1fae5', color: '#065f46', label: 'Confirmed', dot: '#10b981' },
  COMPLETED:  { bg: '#dbeafe', color: '#1e40af', label: 'Completed', dot: '#3b82f6' },
  CANCELLED:  { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled', dot: '#ef4444' },
  PENDING:    { bg: '#fef3c7', color: '#92400e', label: 'Pending',   dot: '#f59e0b' },
  REJECTED:   { bg: '#fce7f3', color: '#831843', label: 'Rejected',  dot: '#ec4899' },
};

const statusCfg = (status) => STATUS_CONFIG[status] ?? { bg: '#f3f4f6', color: '#374151', label: status, dot: '#9ca3af' };

const Dashboard = () => {
  const { user } = useAuth();
  const { appointments, loading, fetchAppointments } = useAppointments();
  const navigate = useNavigate();

  const [viewingDetail, setViewingDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { fetchAppointments(); }, []);

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

  const fmt = (d) => d
    ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  const upcoming  = appointments.filter(a => a.status === 'CONFIRMED');
  const completed = appointments.filter(a => a.status === 'COMPLETED');
  const cancelled = appointments.filter(a => ['CANCELLED', 'REJECTED'].includes(a.status));

  const stats = [
    { label: 'Upcoming',  val: upcoming.length,  icon: '📅', grad: 'linear-gradient(135deg, #0a4f4b, #1e8a84)' },
    { label: 'Completed', val: completed.length, icon: '✅', grad: 'linear-gradient(135deg, #1e3a8a, #2563eb)' },
    { label: 'Total',     val: appointments.length, icon: '📊', grad: 'linear-gradient(135deg, #3b0764, #7c3aed)' },
  ];

  return (
    <div style={s.container}>
      {/* ── Page header ── */}
      <div style={s.pageHeader}>
        <div>
          <h2 style={s.pageTitle}>
            Welcome back, <span style={s.nameHighlight}>{user?.name?.split(' ')[0]}</span> 👋
          </h2>
          <p style={s.pageSub}>Here is an overview of your healthcare activity.</p>
        </div>
        <button
          style={s.bookBtn}
          onClick={() => navigate('/doctors')}
          id="dashboard-book-btn"
        >
          + Book Appointment
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div style={s.statsGrid}>
        {stats.map((stat) => (
          <div key={stat.label} style={{ ...s.statCard, background: stat.grad }}>
            <span style={s.statIcon}>{stat.icon}</span>
            <span style={s.statVal}>{stat.val}</span>
            <span style={s.statLabel}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={s.errorBox}>
          <span>⚠</span> {error}
        </div>
      )}

      {/* ── Main grid ── */}
      <div style={s.mainGrid}>
        {/* Appointments list */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <h3 style={s.cardTitle}>Your Appointments</h3>
            <span style={s.cardCount}>{appointments.length} total</span>
          </div>

          {loading ? (
            <div style={s.listContainer}>
              {[1, 2, 3].map(i => (
                <div key={i} style={s.skeletonRow} className="skeleton" />
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <div style={s.emptyState}>
              <div style={s.emptyIcon}>📅</div>
              <p style={s.emptyText}>No appointments yet.</p>
              <button style={s.emptyBtn} onClick={() => navigate('/doctors')}>
                Find a Doctor →
              </button>
            </div>
          ) : (
            <div style={s.listContainer}>
              {appointments.map((app) => {
                const cfg = statusCfg(app.status);
                const isSelected = viewingDetail?._id === app._id;
                return (
                  <div
                    key={app._id}
                    style={{ ...s.appRow, ...(isSelected ? s.appRowSelected : {}) }}
                    onClick={() => openDetail(app._id)}
                  >
                    {/* Left — doctor info */}
                    <div style={s.appLeft}>
                      <div style={s.doctorAvatar}>
                        {(app.doctorId?.userId?.name?.[0] ?? 'D')}
                      </div>
                      <div style={s.appInfo}>
                        <span style={s.docName}>{app.doctorId?.userId?.name ?? 'Doctor'}</span>
                        <span style={s.appSpec}>{app.doctorId?.specialization}</span>
                        <span style={s.appTime}>
                          {fmt(app.date)} &nbsp;·&nbsp; {app.startTime}–{app.endTime}
                        </span>
                      </div>
                    </div>

                    {/* Right — status + cancel */}
                    <div style={s.appRight}>
                      <span style={{ ...s.badge, background: cfg.bg, color: cfg.color }}>
                        <span style={{ ...s.badgeDot, background: cfg.dot }} />
                        {cfg.label}
                      </span>
                      {app.status === 'CONFIRMED' && (
                        <button
                          style={s.cancelBtn}
                          disabled={cancellingId === app._id}
                          onClick={(e) => { e.stopPropagation(); handleCancel(app._id); }}
                          id={`cancel-appt-${app._id}`}
                        >
                          {cancellingId === app._id ? '…' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div>
          {detailLoading && (
            <div style={{ ...s.card, textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
              Loading details…
            </div>
          )}

          {viewingDetail && !detailLoading && (
            <div style={s.card}>
              <div style={s.detailHeader}>
                <h4 style={s.detailTitle}>Appointment Detail</h4>
                <button style={s.closeBtn} onClick={() => setViewingDetail(null)}>✕</button>
              </div>

              {/* Doctor + status */}
              <div style={s.detailDoctorRow}>
                <div style={s.detailAvatar}>
                  {viewingDetail.doctorId?.userId?.name?.[0] ?? 'D'}
                </div>
                <div>
                  <div style={s.detailDocName}>{viewingDetail.doctorId?.userId?.name}</div>
                  <div style={s.detailSpecTag}>{viewingDetail.doctorId?.specialization}</div>
                </div>
                <span style={{
                  ...s.badge,
                  ...(() => { const c = statusCfg(viewingDetail.status); return { background: c.bg, color: c.color }; })()
                }}>
                  <span style={{ ...s.badgeDot, background: statusCfg(viewingDetail.status).dot }} />
                  {statusCfg(viewingDetail.status).label}
                </span>
              </div>

              {/* Meta */}
              <div style={s.metaGrid}>
                <div style={s.metaItem}><span style={s.metaLabel}>Date</span><span style={s.metaVal}>{fmt(viewingDetail.date)}</span></div>
                <div style={s.metaItem}><span style={s.metaLabel}>Time</span><span style={s.metaVal}>{viewingDetail.startTime}–{viewingDetail.endTime}</span></div>
              </div>

              {/* Symptoms */}
              {viewingDetail.symptomReportId && (
                <div style={s.section}>
                  <div style={s.sectionTitle}>🩺 Pre-Visit Symptoms</div>
                  <p style={s.sectionText}>{viewingDetail.symptomReportId.symptoms}</p>
                  {viewingDetail.symptomReportId.aiSummary?.urgency && (
                    <div style={s.urgencyRow}>
                      <span style={s.urgencyLabel}>AI Urgency:</span>
                      <span style={s.urgencyVal}>{viewingDetail.symptomReportId.aiSummary.urgency}</span>
                      <span style={s.chiefComp}>{viewingDetail.symptomReportId.aiSummary.chiefComplaint}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Visit notes */}
              {viewingDetail.visitNoteId && (
                <div style={s.section}>
                  <div style={s.sectionTitle}>📋 Doctor's Notes</div>
                  <p style={s.sectionText}>{viewingDetail.visitNoteId.clinicalNotes}</p>
                  {viewingDetail.visitNoteId.diagnosis && (
                    <div style={s.diagnosisBox}>
                      <strong>Diagnosis: </strong>{viewingDetail.visitNoteId.diagnosis}
                    </div>
                  )}
                  {viewingDetail.visitNoteId.followUp && (
                    <p style={{ ...s.sectionText, marginTop: '8px' }}>
                      <strong>Follow-up: </strong>{viewingDetail.visitNoteId.followUp}
                    </p>
                  )}
                  {viewingDetail.visitNoteId.prescription?.length > 0 && (
                    <div style={s.rxSection}>
                      <div style={s.rxTitle}>💊 Prescription</div>
                      {viewingDetail.visitNoteId.prescription.map((p, i) => (
                        <div key={i} style={s.rxRow}>
                          <span style={s.rxName}>{p.name}</span>
                          <span style={s.rxDetail}>{p.dosage} · {p.frequency} · {p.duration}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {viewingDetail.visitNoteId.patientSummary?.summary && (
                    <div style={s.aiSummaryBox}>
                      <div style={s.aiSummaryTitle}>✦ AI Patient Summary</div>
                      <p style={s.aiSummaryText}>{viewingDetail.visitNoteId.patientSummary.summary}</p>
                      {viewingDetail.visitNoteId.patientSummary.precautions?.length > 0 && (
                        <ul style={s.precautionList}>
                          {viewingDetail.visitNoteId.patientSummary.precautions.map((pc, i) => (
                            <li key={i}>{pc}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}

              {viewingDetail.status === 'COMPLETED' && (
                <button
                  style={s.viewHistoryBtn}
                  onClick={() => navigate('/visits')}
                  id="view-full-history-btn"
                >
                  View Full Visit History →
                </button>
              )}
            </div>
          )}

          {!viewingDetail && !detailLoading && (
            <div style={{ ...s.card, textAlign: 'center', padding: '48px 32px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>👆</div>
              <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Select an appointment to view full details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Styles ─── */
const s = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px' },

  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' },
  pageTitle: { fontFamily: "'Outfit', sans-serif", fontSize: '1.75rem', fontWeight: 800, color: '#0a2e2b', letterSpacing: '-0.03em', lineHeight: 1.2 },
  nameHighlight: { background: 'linear-gradient(135deg, #1e8a84, #2fa89f)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  pageSub: { fontSize: '0.9rem', color: '#6b7280', marginTop: '4px' },
  bookBtn: {
    padding: '11px 22px',
    background: 'linear-gradient(135deg, #166f6a 0%, #0a4f4b 100%)',
    color: '#fff',
    borderRadius: '12px',
    fontWeight: 700,
    fontSize: '0.9rem',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 6px 20px rgba(22,111,106,0.25)',
    transition: 'all 0.2s',
    fontFamily: "'Inter', sans-serif",
    whiteSpace: 'nowrap',
  },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' },
  statCard: {
    borderRadius: '18px',
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    boxShadow: '0 8px 28px rgba(0,0,0,0.12)',
    position: 'relative',
    overflow: 'hidden',
  },
  statIcon: { fontSize: '1.4rem', lineHeight: 1 },
  statVal: { fontFamily: "'Outfit', sans-serif", fontSize: '2rem', fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: '-0.04em' },
  statLabel: { fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)', fontWeight: 600, letterSpacing: '0.02em' },

  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#fee2e2',
    border: '1px solid rgba(220,38,38,0.15)',
    color: '#b91c1c',
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: '0.88rem',
  },

  mainGrid: { display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px', alignItems: 'start' },

  card: {
    background: 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '20px',
    border: '1px solid rgba(30,138,132,0.1)',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
  },

  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  cardTitle: { fontFamily: "'Outfit', sans-serif", fontSize: '1.1rem', fontWeight: 800, color: '#0a2e2b', letterSpacing: '-0.02em' },
  cardCount: { fontSize: '0.8rem', fontWeight: 600, color: '#9ca3af', background: '#f3f4f6', padding: '3px 10px', borderRadius: '9999px' },

  listContainer: { display: 'flex', flexDirection: 'column', gap: '2px' },
  skeletonRow: { height: '68px', borderRadius: '10px', marginBottom: '4px' },

  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '40px 20px' },
  emptyIcon: { fontSize: '2.5rem' },
  emptyText: { color: '#9ca3af', fontSize: '0.9rem' },
  emptyBtn: {
    padding: '10px 24px',
    background: 'linear-gradient(135deg, #166f6a, #0a4f4b)',
    color: '#fff',
    borderRadius: '10px',
    fontWeight: 700,
    fontSize: '0.88rem',
    border: 'none',
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
  },

  appRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 12px',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  appRowSelected: { background: 'rgba(30,138,132,0.06)', border: '1px solid rgba(30,138,132,0.15)' },

  appLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  doctorAvatar: {
    width: 40,
    height: 40,
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #1e8a84, #0a4f4b)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.88rem',
    fontWeight: 800,
    flexShrink: 0,
  },
  appInfo: { display: 'flex', flexDirection: 'column', gap: '2px' },
  docName: { fontWeight: 700, color: '#111827', fontSize: '0.92rem' },
  appSpec: { fontSize: '0.78rem', color: '#1e8a84', fontWeight: 600 },
  appTime: { fontSize: '0.75rem', color: '#9ca3af' },

  appRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em' },
  badgeDot: { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 },
  cancelBtn: {
    background: 'transparent',
    border: '1px solid rgba(239,68,68,0.3)',
    color: '#ef4444',
    padding: '4px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: 600,
    fontFamily: "'Inter', sans-serif",
    transition: 'all 0.15s',
  },

  /* Detail panel */
  detailHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  detailTitle: { fontFamily: "'Outfit', sans-serif", fontSize: '1.05rem', fontWeight: 800, color: '#0a2e2b', letterSpacing: '-0.02em' },
  closeBtn: { background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1rem', padding: '4px', borderRadius: '6px', transition: 'all 0.15s' },

  detailDoctorRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' },
  detailAvatar: {
    width: 44,
    height: 44,
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #1e8a84, #0a4f4b)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
    fontWeight: 800,
    flexShrink: 0,
    boxShadow: '0 4px 12px rgba(30,138,132,0.25)',
  },
  detailDocName: { fontWeight: 700, color: '#111827', fontSize: '0.95rem' },
  detailSpecTag: { fontSize: '0.78rem', color: '#1e8a84', fontWeight: 600, marginTop: '2px' },

  metaGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' },
  metaItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    background: 'rgba(30,138,132,0.04)',
    borderRadius: '10px',
    padding: '10px 12px',
  },
  metaLabel: { fontSize: '0.7rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' },
  metaVal: { fontSize: '0.88rem', fontWeight: 700, color: '#111827' },

  section: {
    borderTop: '1px solid rgba(30,138,132,0.08)',
    paddingTop: '14px',
    marginTop: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sectionTitle: { fontSize: '0.82rem', fontWeight: 800, color: '#374151', letterSpacing: '0.02em', marginBottom: '4px' },
  sectionText: { fontSize: '0.87rem', color: '#374151', lineHeight: 1.6 },

  urgencyRow: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
  urgencyLabel: { fontSize: '0.75rem', fontWeight: 700, color: '#6b7280' },
  urgencyVal: { fontSize: '0.75rem', fontWeight: 800, background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '9999px' },
  chiefComp: { fontSize: '0.78rem', color: '#374151' },

  diagnosisBox: { background: 'rgba(30,138,132,0.05)', border: '1px solid rgba(30,138,132,0.12)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.87rem', color: '#0a2e2b', fontWeight: 500 },

  rxSection: { display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' },
  rxTitle: { fontSize: '0.78rem', fontWeight: 800, color: '#374151', letterSpacing: '0.02em' },
  rxRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#f9fafb',
    borderRadius: '8px',
    padding: '8px 12px',
    gap: '8px',
    flexWrap: 'wrap',
  },
  rxName: { fontSize: '0.85rem', fontWeight: 700, color: '#111827' },
  rxDetail: { fontSize: '0.78rem', color: '#6b7280' },

  aiSummaryBox: {
    background: 'linear-gradient(135deg, rgba(30,138,132,0.06), rgba(30,138,132,0.03))',
    border: '1px solid rgba(30,138,132,0.15)',
    borderRadius: '12px',
    padding: '14px 16px',
    marginTop: '4px',
  },
  aiSummaryTitle: { fontSize: '0.75rem', fontWeight: 800, color: '#1e8a84', letterSpacing: '0.06em', marginBottom: '8px' },
  aiSummaryText: { fontSize: '0.87rem', color: '#374151', lineHeight: 1.6 },
  precautionList: { paddingLeft: '18px', marginTop: '8px', fontSize: '0.82rem', color: '#6b7280', display: 'flex', flexDirection: 'column', gap: '4px' },

  viewHistoryBtn: {
    width: '100%',
    marginTop: '16px',
    padding: '11px',
    background: 'linear-gradient(135deg, #166f6a, #0a4f4b)',
    color: '#fff',
    borderRadius: '10px',
    fontWeight: 700,
    fontSize: '0.88rem',
    border: 'none',
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    transition: 'all 0.2s',
  },
};

export default Dashboard;
