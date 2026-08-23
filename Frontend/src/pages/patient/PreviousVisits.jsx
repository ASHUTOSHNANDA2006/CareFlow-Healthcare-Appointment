import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as appointmentService from '../../services/appointment.service';
import * as visitNoteService from '../../services/visitNote.service';

const PreviousVisits = () => {
  const [appointments, setAppointments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await appointmentService.getAppointments();
        if (res.success) {
          const completed = res.data.appointments.filter(a => a.status === 'COMPLETED');
          setAppointments(completed);
        }
      } catch {
        setError('Failed to load visits.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const loadDetail = async (id) => {
    setSelected(id);
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await visitNoteService.getAppointmentById(id);
      if (res.success) setDetail(res.data.appointment);
    } catch {
      setError('Failed to load visit details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const fmt = (d) => d
    ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  const SPEC_COLORS = ['#0a4f4b', '#1e3a8a', '#7c3aed', '#b45309', '#0f766e', '#9d174d'];
  const specColor = (spec) => SPEC_COLORS[(spec?.charCodeAt(0) ?? 0) % SPEC_COLORS.length];

  return (
    <div style={s.container}>
      {/* ── Header ── */}
      <div style={s.pageHeader}>
        <div>
          <h2 style={s.pageTitle}>Previous Visits</h2>
          <p style={s.pageSub}>Your completed consultations and medical records.</p>
        </div>
        <button onClick={() => navigate('/dashboard')} style={s.backBtn}>
          ← Dashboard
        </button>
      </div>

      {error && (
        <div style={s.errorBox}><span>⚠</span> {error}</div>
      )}

      {loading ? (
        <div style={s.loadingGrid}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={s.skeletonCard} />)}
        </div>
      ) : appointments.length === 0 ? (
        <div style={s.emptyState}>
          <div style={s.emptyIcon}>🩺</div>
          <h3 style={s.emptyTitle}>No completed visits yet</h3>
          <p style={s.emptyDesc}>Your completed appointments and medical notes will appear here.</p>
          <button style={s.primaryBtn} onClick={() => navigate('/doctors')}>
            Book an Appointment →
          </button>
        </div>
      ) : (
        <div style={s.mainGrid}>
          {/* ── Visit list ── */}
          <div style={s.visitList}>
            <div style={s.listHeader}>
              <span style={s.listHeaderText}>All visits ({appointments.length})</span>
            </div>
            {appointments.map((a) => {
              const color = specColor(a.doctorId?.specialization);
              const isSelected = selected === a._id;
              return (
                <div
                  key={a._id}
                  style={{ ...s.visitCard, ...(isSelected ? s.visitCardSelected : {}) }}
                  onClick={() => loadDetail(a._id)}
                  role="button"
                  tabIndex={0}
                >
                  {/* Color bar */}
                  <div style={{ ...s.visitColorBar, background: color }} />

                  <div style={s.visitCardInner}>
                    {/* Top row */}
                    <div style={s.visitTop}>
                      <div style={{ ...s.visitAvatar, background: color }}>
                        {(a.doctorId?.userId?.name?.[0] ?? 'D').toUpperCase()}
                      </div>
                      <div style={s.visitInfo}>
                        <span style={s.visitDocName}>{a.doctorId?.userId?.name ?? 'Doctor'}</span>
                        <span style={{ ...s.visitSpecTag, color, background: `${color}12` }}>
                          {a.doctorId?.specialization}
                        </span>
                      </div>
                    </div>

                    {/* Meta */}
                    <div style={s.visitMeta}>
                      <span style={s.visitDate}>📅 {fmt(a.date)}</span>
                      <span style={s.visitTime}>⏱ {a.startTime}–{a.endTime}</span>
                    </div>

                    {/* Completed badge */}
                    <span style={s.completedBadge}>✓ Completed</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Detail panel ── */}
          <div style={s.detailPanel}>
            {!selected && (
              <div style={s.detailEmpty}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📋</div>
                <h4 style={s.detailEmptyTitle}>Select a visit</h4>
                <p style={s.detailEmptyDesc}>Click on a visit from the list to view your medical records and AI summary.</p>
              </div>
            )}

            {detailLoading && (
              <div style={s.detailCard}>
                {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '40px', borderRadius: '8px', marginBottom: '12px' }} />)}
              </div>
            )}

            {detail && !detailLoading && (
              <div style={s.detailCard}>
                {/* Header */}
                <div style={s.detailHeader}>
                  <h3 style={s.detailTitle}>Visit on {fmt(detail.date)}</h3>
                  <button style={s.closeBtn} onClick={() => { setSelected(null); setDetail(null); }}>✕</button>
                </div>

                {/* Doctor */}
                <div style={s.detailDoctorRow}>
                  <div style={{ ...s.detailAvatar, background: specColor(detail.doctorId?.specialization) }}>
                    {(detail.doctorId?.userId?.name?.[0] ?? 'D').toUpperCase()}
                  </div>
                  <div>
                    <div style={s.detailDocName}>{detail.doctorId?.userId?.name}</div>
                    <div style={{ ...s.detailSpecTag, color: specColor(detail.doctorId?.specialization) }}>
                      {detail.doctorId?.specialization}
                    </div>
                  </div>
                </div>

                <div style={s.metaChips}>
                  <div style={s.metaChip}><span>📅</span> {fmt(detail.date)}</div>
                  <div style={s.metaChip}><span>⏱</span> {detail.startTime}–{detail.endTime}</div>
                </div>

                {/* Visit note */}
                {detail.visitNoteId ? (
                  <>
                    {/* Clinical notes */}
                    <div style={s.noteSection}>
                      <div style={s.noteSectionTitle}>📋 Clinical Notes</div>
                      <p style={s.noteText}>{detail.visitNoteId.clinicalNotes || '—'}</p>
                    </div>

                    {/* Diagnosis */}
                    {detail.visitNoteId.diagnosis && (
                      <div style={s.noteSection}>
                        <div style={s.noteSectionTitle}>🔬 Diagnosis</div>
                        <div style={s.diagnosisBox}>{detail.visitNoteId.diagnosis}</div>
                      </div>
                    )}

                    {/* Follow-up */}
                    {detail.visitNoteId.followUp && (
                      <div style={s.noteSection}>
                        <div style={s.noteSectionTitle}>📆 Follow-up</div>
                        <p style={s.noteText}>{detail.visitNoteId.followUp}</p>
                      </div>
                    )}

                    {/* Prescription */}
                    {detail.visitNoteId.prescription?.length > 0 && (
                      <div style={s.noteSection}>
                        <div style={s.noteSectionTitle}>💊 Prescription</div>
                        <div style={s.prescriptionTable}>
                          <div style={s.prescTableHeader}>
                            <span>Medicine</span><span>Dosage</span><span>Frequency</span><span>Duration</span>
                          </div>
                          {detail.visitNoteId.prescription.map((p, i) => (
                            <div key={i} style={{ ...s.prescTableRow, background: i % 2 === 0 ? '#f9fafb' : '#fff' }}>
                              <span style={s.rxName}>{p.name}</span>
                              <span style={s.rxDetail}>{p.dosage}</span>
                              <span style={s.rxDetail}>{p.frequency}</span>
                              <span style={s.rxDetail}>{p.duration}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Summary */}
                    {detail.visitNoteId.patientSummary && (
                      <div style={s.aiSummaryBox}>
                        <div style={s.aiSummaryTitle}>✦ AI Patient Summary</div>
                        <p style={s.aiSummaryText}>
                          {typeof detail.visitNoteId.patientSummary === 'string'
                            ? detail.visitNoteId.patientSummary
                            : detail.visitNoteId.patientSummary.summary}
                        </p>
                        {detail.visitNoteId.patientSummary.precautions?.length > 0 && (
                          <ul style={s.precautionList}>
                            {detail.visitNoteId.patientSummary.precautions.map((pc, i) => (
                              <li key={i}>{pc}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={s.noNotes}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📝</div>
                    <p>No visit notes available yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Styles ─── */
const s = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px' },

  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' },
  pageTitle: { fontFamily: "'Outfit', sans-serif", fontSize: '1.75rem', fontWeight: 800, color: '#0a2e2b', letterSpacing: '-0.03em' },
  pageSub: { fontSize: '0.9rem', color: '#6b7280', marginTop: '4px' },
  backBtn: {
    padding: '9px 18px',
    background: 'transparent',
    border: '1.5px solid rgba(30,138,132,0.25)',
    color: '#1e8a84',
    borderRadius: '10px',
    fontWeight: 600,
    fontSize: '0.88rem',
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    transition: 'all 0.2s',
  },

  errorBox: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    background: '#fee2e2',
    border: '1px solid rgba(220,38,38,0.15)',
    color: '#b91c1c',
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: '0.87rem',
  },

  loadingGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' },
  skeletonCard: { height: '140px', borderRadius: '16px' },

  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '64px 32px', textAlign: 'center' },
  emptyIcon: { fontSize: '3.5rem' },
  emptyTitle: { fontFamily: "'Outfit', sans-serif", fontSize: '1.25rem', fontWeight: 800, color: '#0a2e2b' },
  emptyDesc: { fontSize: '0.9rem', color: '#9ca3af', maxWidth: '300px', lineHeight: 1.6 },
  primaryBtn: {
    padding: '12px 28px',
    background: 'linear-gradient(135deg, #166f6a, #0a4f4b)',
    color: '#fff',
    borderRadius: '12px',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.9rem',
    boxShadow: '0 6px 18px rgba(22,111,106,0.25)',
    marginTop: '8px',
    transition: 'all 0.2s',
  },

  mainGrid: { display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', alignItems: 'start' },

  visitList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  listHeader: { paddingBottom: '4px' },
  listHeaderText: { fontSize: '0.75rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' },

  visitCard: {
    background: 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '16px',
    border: '1px solid rgba(30,138,132,0.08)',
    cursor: 'pointer',
    overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
    transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
  },
  visitCardSelected: {
    border: '1.5px solid rgba(30,138,132,0.35)',
    boxShadow: '0 6px 24px rgba(30,138,132,0.1)',
    transform: 'translateX(4px)',
  },
  visitColorBar: { height: '3px' },
  visitCardInner: { padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' },

  visitTop: { display: 'flex', alignItems: 'center', gap: '10px' },
  visitAvatar: {
    width: 38,
    height: 38,
    borderRadius: '10px',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.9rem',
    fontWeight: 800,
    flexShrink: 0,
  },
  visitInfo: { display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 },
  visitDocName: { fontSize: '0.9rem', fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  visitSpecTag: { fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', alignSelf: 'flex-start', letterSpacing: '0.03em', textTransform: 'uppercase' },

  visitMeta: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  visitDate: { fontSize: '0.78rem', color: '#6b7280', fontWeight: 500 },
  visitTime: { fontSize: '0.78rem', color: '#6b7280', fontWeight: 500 },

  completedBadge: { fontSize: '0.7rem', fontWeight: 800, color: '#065f46', background: '#d1fae5', padding: '3px 9px', borderRadius: '9999px', alignSelf: 'flex-start', letterSpacing: '0.04em' },

  detailPanel: { position: 'sticky', top: '24px' },

  detailEmpty: {
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    border: '1px solid rgba(30,138,132,0.08)',
    padding: '48px 32px',
    textAlign: 'center',
    boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
  },
  detailEmptyTitle: { fontFamily: "'Outfit', sans-serif", fontSize: '1.1rem', fontWeight: 800, color: '#0a2e2b', marginBottom: '8px' },
  detailEmptyDesc: { fontSize: '0.87rem', color: '#9ca3af', lineHeight: 1.6 },

  detailCard: {
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '20px',
    border: '1px solid rgba(30,138,132,0.1)',
    padding: '24px',
    boxShadow: '0 8px 28px rgba(0,0,0,0.07)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },

  detailHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  detailTitle: { fontFamily: "'Outfit', sans-serif", fontSize: '1.05rem', fontWeight: 800, color: '#0a2e2b', letterSpacing: '-0.02em' },
  closeBtn: { background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1rem', padding: '4px', borderRadius: '6px' },

  detailDoctorRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  detailAvatar: {
    width: 46,
    height: 46,
    borderRadius: '12px',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
    fontWeight: 800,
    flexShrink: 0,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  detailDocName: { fontWeight: 700, color: '#111827', fontSize: '0.95rem' },
  detailSpecTag: { fontSize: '0.76rem', fontWeight: 700, marginTop: '3px' },

  metaChips: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  metaChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(30,138,132,0.05)',
    border: '1px solid rgba(30,138,132,0.1)',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '0.8rem',
    color: '#166f6a',
    fontWeight: 600,
  },

  noteSection: { display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(30,138,132,0.07)', paddingTop: '14px' },
  noteSectionTitle: { fontSize: '0.78rem', fontWeight: 800, color: '#374151', letterSpacing: '0.03em' },
  noteText: { fontSize: '0.88rem', color: '#374151', lineHeight: 1.65 },

  diagnosisBox: {
    background: 'rgba(30,138,132,0.06)',
    border: '1px solid rgba(30,138,132,0.12)',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '0.88rem',
    color: '#0a2e2b',
    fontWeight: 600,
    lineHeight: 1.5,
  },

  prescriptionTable: { borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb' },
  prescTableHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1.5fr 1.5fr',
    gap: '0',
    padding: '8px 14px',
    background: '#f3f4f6',
    fontSize: '0.7rem',
    fontWeight: 800,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  prescTableRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1.5fr 1.5fr',
    padding: '10px 14px',
    gap: '0',
    borderTop: '1px solid #e5e7eb',
  },
  rxName: { fontSize: '0.85rem', fontWeight: 700, color: '#111827' },
  rxDetail: { fontSize: '0.82rem', color: '#6b7280' },

  aiSummaryBox: {
    background: 'linear-gradient(135deg, rgba(30,138,132,0.07), rgba(30,138,132,0.03))',
    border: '1px solid rgba(30,138,132,0.15)',
    borderRadius: '14px',
    padding: '16px 18px',
  },
  aiSummaryTitle: { fontSize: '0.72rem', fontWeight: 800, color: '#1e8a84', letterSpacing: '0.08em', marginBottom: '8px', textTransform: 'uppercase' },
  aiSummaryText: { fontSize: '0.87rem', color: '#374151', lineHeight: 1.7 },
  precautionList: { paddingLeft: '18px', marginTop: '10px', fontSize: '0.82rem', color: '#6b7280', display: 'flex', flexDirection: 'column', gap: '4px' },

  noNotes: { textAlign: 'center', color: '#9ca3af', padding: '24px', fontSize: '0.88rem' },
};

export default PreviousVisits;
