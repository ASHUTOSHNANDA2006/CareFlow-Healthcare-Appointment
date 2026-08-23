import React, { useState, useEffect } from 'react';
import * as appointmentService from '../../services/appointment.service';
import * as aiService from '../../services/ai.service';
import * as visitNoteService from '../../services/visitNote.service';

const DoctorDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [appDetail, setAppDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [tab, setTab] = useState('today'); // 'today' | 'all'

  // Consultation form state
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [meds, setMeds] = useState([{ name: '', dosage: '', frequency: '', duration: '' }]);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [submitError, setSubmitError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const res = await appointmentService.getAppointments();
      if (res.success) setAppointments(res.data.appointments);
    } catch {
      setError('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  const openConsultation = async (appId) => {
    setSelectedApp(appId);
    setSubmitResult(null);
    setSubmitError('');
    setClinicalNotes('');
    setDiagnosis('');
    setFollowUp('');
    setMeds([{ name: '', dosage: '', frequency: '', duration: '' }]);
    setDetailLoading(true);
    try {
      const res = await visitNoteService.getAppointmentById(appId);
      if (res.success) setAppDetail(res.data.appointment);
    } catch {
      setAppDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleMedChange = (idx, field, val) => {
    setMeds(prev => prev.map((m, i) => i === idx ? { ...m, [field]: val } : m));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clinicalNotes.trim()) { setSubmitError('Clinical notes are required.'); return; }
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await aiService.submitVisitNotes({
        appointmentId: selectedApp,
        clinicalNotes,
        diagnosis,
        followUp,
        prescription: meds.filter(m => m.name),
      });
      if (res.success) {
        setSubmitResult(res.data.visitNote);
        // Refresh appointment list to update status
        await loadAppointments();
      }
    } catch (err) {
      setSubmitError(err.response?.data?.error?.message || 'Failed to save visit notes.');
    } finally {
      setSubmitting(false);
    }
  };

  const displayed = tab === 'today'
    ? appointments.filter(a => a.date && a.date.startsWith(today))
    : appointments;

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const statusColor = { CONFIRMED: '#2F6F6D', COMPLETED: '#6FA889', CANCELLED: '#C97872', PENDING: '#B8860B' };

  return (
    <div style={styles.container}>
      <h2>Doctor Dashboard</h2>
      <p style={styles.sub}>Manage consultations and patient visits.</p>

      {error && <div style={styles.errorBox}>{error}</div>}

      <div style={styles.tabs}>
        <button style={{ ...styles.tab, ...(tab === 'today' ? styles.activeTab : {}) }} onClick={() => setTab('today')}>Today</button>
        <button style={{ ...styles.tab, ...(tab === 'all' ? styles.activeTab : {}) }} onClick={() => setTab('all')}>All Appointments</button>
      </div>

      <div style={styles.grid}>
        {/* Appointment list */}
        <div>
          {loading ? (
            <div style={styles.loadingBox}>Loading appointments...</div>
          ) : displayed.length === 0 ? (
            <div className="card" style={styles.empty}>No appointments {tab === 'today' ? 'today' : 'found'}.</div>
          ) : (
            <div style={styles.list}>
              {displayed.map(a => (
                <div
                  key={a._id}
                  className="card"
                  style={{ ...styles.appCard, ...(selectedApp === a._id ? styles.selectedCard : {}) }}
                >
                  <div style={styles.appHeader}>
                    <span style={styles.patientName}>{a.patientId?.name || 'Patient'}</span>
                    <span style={{ ...styles.statusBadge, background: `${statusColor[a.status]}20`, color: statusColor[a.status] }}>
                      {a.status}
                    </span>
                  </div>
                  <p style={styles.appMeta}>{fmt(a.date)} · {a.startTime} – {a.endTime}</p>
                  <p style={styles.appMeta}>{a.patientId?.email}</p>
                  {a.status === 'CONFIRMED' && (
                    <button style={styles.consultBtn} onClick={() => openConsultation(a._id)}>
                      Open Consultation
                    </button>
                  )}
                  {a.status === 'COMPLETED' && (
                    <button style={{ ...styles.consultBtn, background: '#EAF2F0' }} onClick={() => openConsultation(a._id)}>
                      View Notes
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Consultation panel */}
        <div>
          {!selectedApp && <div className="card" style={styles.empty}>Select an appointment to begin consultation.</div>}

          {selectedApp && detailLoading && <div style={styles.loadingBox}>Loading patient data...</div>}

          {selectedApp && !detailLoading && appDetail && (
            <div className="card">
              <h3>Consultation</h3>
              <p style={styles.appMeta}><strong>Patient:</strong> {appDetail.patientId?.name} ({appDetail.patientId?.email})</p>
              <p style={styles.appMeta}><strong>Date:</strong> {fmt(appDetail.date)} {appDetail.startTime}–{appDetail.endTime}</p>

              {/* Show symptom report if available */}
              {appDetail.symptomReportId && (
                <div style={styles.symptomsBox}>
                  <strong>Patient Symptoms:</strong>
                  <p>{appDetail.symptomReportId.rawSymptoms}</p>
                  {appDetail.symptomReportId.aiAnalysis && (
                    <p style={styles.aiHint}>
                      AI Urgency: <strong>{appDetail.symptomReportId.aiAnalysis.urgency}</strong>
                      {' — '}{appDetail.symptomReportId.aiAnalysis.chiefComplaint}
                    </p>
                  )}
                </div>
              )}

              {/* Already completed */}
              {appDetail.visitNoteId ? (
                <div style={styles.completedBox}>
                  <h4>Visit Already Completed</h4>
                  <p><strong>Notes:</strong> {appDetail.visitNoteId.clinicalNotes}</p>
                  <p><strong>Diagnosis:</strong> {appDetail.visitNoteId.diagnosis || '—'}</p>
                  <p><strong>Follow-up:</strong> {appDetail.visitNoteId.followUp || '—'}</p>
                  {appDetail.visitNoteId.prescription?.length > 0 && (
                    <>
                      <strong>Prescription:</strong>
                      <ul>
                        {appDetail.visitNoteId.prescription.map((p, i) => (
                          <li key={i}>{p.name} — {p.dosage}, {p.frequency}, {p.duration}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={styles.form}>
                  <label style={styles.label}>Clinical Notes *</label>
                  <textarea
                    rows={4}
                    value={clinicalNotes}
                    onChange={e => setClinicalNotes(e.target.value)}
                    placeholder="Enter clinical observations..."
                    required
                  />

                  <label style={styles.label}>Diagnosis</label>
                  <input value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="e.g. Viral pharyngitis" />

                  <label style={styles.label}>Follow-up Instructions</label>
                  <input value={followUp} onChange={e => setFollowUp(e.target.value)} placeholder="e.g. Return in 7 days if no improvement" />

                  <label style={styles.label}>Prescription</label>
                  {meds.map((m, idx) => (
                    <div key={idx} style={styles.medRow}>
                      <input placeholder="Medicine" value={m.name} onChange={e => handleMedChange(idx, 'name', e.target.value)} />
                      <input placeholder="Dosage" value={m.dosage} onChange={e => handleMedChange(idx, 'dosage', e.target.value)} />
                      <input placeholder="Frequency" value={m.frequency} onChange={e => handleMedChange(idx, 'frequency', e.target.value)} />
                      <input placeholder="Duration" value={m.duration} onChange={e => handleMedChange(idx, 'duration', e.target.value)} />
                    </div>
                  ))}
                  <button type="button" onClick={() => setMeds(p => [...p, { name: '', dosage: '', frequency: '', duration: '' }])} style={styles.addMedBtn}>
                    + Add Medication
                  </button>

                  {submitError && <div style={styles.errorBox}>{submitError}</div>}

                  <button type="submit" className="btn-primary" disabled={submitting} style={{ marginTop: '16px' }}>
                    {submitting ? 'Saving...' : 'Complete Visit & Generate AI Summary'}
                  </button>
                </form>
              )}

              {submitResult && (
                <div style={styles.successBox}>
                  <strong>Visit saved successfully!</strong>
                  <p>Visit ID: {submitResult._id}</p>
                  {submitResult.aiPatientSummary && <p>AI Summary generated for patient.</p>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '20px' },
  sub: { color: '#697776', marginTop: '4px' },
  errorBox: { background: '#FDF3F2', color: '#C97872', padding: '12px', borderRadius: '8px' },
  loadingBox: { textAlign: 'center', color: '#697776', padding: '40px' },
  empty: { textAlign: 'center', color: '#697776', padding: '40px' },
  tabs: { display: 'flex', gap: '12px' },
  tab: { padding: '8px 20px', borderRadius: '20px', border: '1px solid rgba(47,111,109,0.2)', background: 'transparent', color: '#697776', cursor: 'pointer' },
  activeTab: { background: '#2F6F6D', color: '#fff', border: '1px solid #2F6F6D' },
  grid: { display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px', alignItems: 'start' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  appCard: { display: 'flex', flexDirection: 'column', gap: '6px', cursor: 'default' },
  selectedCard: { border: '2px solid #2F6F6D' },
  appHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  patientName: { fontWeight: '600', color: '#263536' },
  statusBadge: { padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600' },
  appMeta: { fontSize: '0.85rem', color: '#697776' },
  consultBtn: { marginTop: '8px', background: '#2F6F6D', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' },
  symptomsBox: { background: '#F7F8F5', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' },
  aiHint: { color: '#2F6F6D', fontWeight: '600', marginTop: '8px' },
  completedBox: { background: '#EAF2F0', padding: '16px', borderRadius: '8px', fontSize: '0.9rem', lineHeight: '1.7' },
  successBox: { background: '#EAF2F0', padding: '16px', borderRadius: '8px', marginTop: '16px', color: '#2F6F6D' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' },
  label: { fontSize: '0.85rem', fontWeight: '600', color: '#263536' },
  medRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' },
  addMedBtn: { background: '#F7F8F5', border: '1px dashed rgba(47,111,109,0.3)', color: '#2F6F6D', padding: '8px', borderRadius: '6px', cursor: 'pointer' },
};

export default DoctorDashboard;
