import React, { useState, useEffect } from 'react';
import * as appointmentService from '../../services/appointment.service';
import * as aiService from '../../services/ai.service';
import * as visitNoteService from '../../services/visitNote.service';
import * as doctorService from '../../services/doctor.service';
import api from '../../services/api';

const DoctorDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [appDetail, setAppDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [tab, setTab] = useState('today'); // 'today' | 'upcoming' | 'completed' | 'all' | 'leaves'

  // Leave form state
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveMsg, setLeaveMsg] = useState('');

  // Consultation form state
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [meds, setMeds] = useState([{ name: '', dosage: '', frequency: '', duration: '' }]);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadAppointments();
    loadLeaves();

    // Auto-poll appointments every 12 seconds for near real-time updates
    const interval = setInterval(() => {
      loadAppointments(true);
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  const loadAppointments = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await appointmentService.getAppointments();
      if (res.success) setAppointments(res.data.appointments);
    } catch {
      if (!silent) setError('Failed to load appointments.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadLeaves = async () => {
    try {
      const res = await doctorService.getDoctorMeLeaves();
      if (res.success) setLeaves(res.data.leaves || []);
    } catch { /* silent */ }
  };

  const openConsultation = async (appId) => {
    setSelectedApp(appId);
    setSubmitResult(null);
    setSubmitError('');
    setClinicalNotes('');
    setDiagnosis('');
    setFollowUp('');
    setMeds([{ name: '', dosage: '', frequency: '', duration: '' }]);
    setIsEditingNotes(false);
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

  const handleStatusUpdate = async (appId, newStatus) => {
    if (newStatus === 'CANCELLED' && !window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await api.patch(`/appointments/${appId}/status`, { status: newStatus });
      await loadAppointments();
      if (selectedApp === appId) {
        openConsultation(appId);
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update appointment status.');
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!leaveDate) return;
    setLeaveLoading(true);
    setLeaveMsg('');
    try {
      const res = await doctorService.addDoctorMeLeave({ date: leaveDate, reason: leaveReason });
      if (res.success) {
        setLeaveMsg(`Leave added for ${leaveDate}. ${res.data.conflicts?.affectedCount || 0} conflicting appointments cancelled.`);
        setLeaveDate('');
        setLeaveReason('');
        await loadLeaves();
        await loadAppointments();
      }
    } catch (err) {
      setLeaveMsg(err.response?.data?.error?.message || 'Failed to add leave.');
    } finally {
      setLeaveLoading(false);
    }
  };

  const handleDeleteLeave = async (id) => {
    if (!window.confirm('Remove this leave entry?')) return;
    try {
      await doctorService.deleteDoctorMeLeave(id);
      await loadLeaves();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to delete leave.');
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
        await loadAppointments();
        await openConsultation(selectedApp);
      }
    } catch (err) {
      setSubmitError(err.response?.data?.error?.message || 'Failed to save visit notes.');
    } finally {
      setSubmitting(false);
    }
  };

  const startEditVisitNotes = () => {
    if (!appDetail?.visitNoteId) return;
    const note = appDetail.visitNoteId;
    setClinicalNotes(note.clinicalNotes || '');
    setDiagnosis(note.diagnosis || '');
    setFollowUp(note.followUp || '');
    setMeds(note.prescription?.length ? note.prescription : [{ name: '', dosage: '', frequency: '', duration: '' }]);
    setIsEditingNotes(true);
    setSubmitError('');
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!clinicalNotes.trim()) { setSubmitError('Clinical notes are required.'); return; }
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await aiService.updateVisitNotes(appDetail.visitNoteId._id, {
        clinicalNotes,
        diagnosis,
        followUp,
        prescription: meds.filter(m => m.name),
      });
      if (res.success) {
        setIsEditingNotes(false);
        await openConsultation(selectedApp);
      }
    } catch (err) {
      setSubmitError(err.response?.data?.error?.message || 'Failed to update visit notes.');
    } finally {
      setSubmitting(false);
    }
  };

  const displayed = tab === 'today'
    ? appointments.filter(a => a.date && a.date.startsWith(today))
    : tab === 'upcoming'
    ? appointments.filter(a => a.status === 'CONFIRMED' || a.status === 'PENDING')
    : tab === 'completed'
    ? appointments.filter(a => a.status === 'COMPLETED')
    : appointments;

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const statusColor = { CONFIRMED: '#2F6F6D', COMPLETED: '#6FA889', CANCELLED: '#C97872', PENDING: '#B8860B', REJECTED: '#C97872' };

  return (
    <div style={styles.container}>
      <h2>Doctor Dashboard</h2>
      <p style={styles.sub}>Manage patient consultations, records, and working availability.</p>

      {error && <div style={styles.errorBox}>{error}</div>}

      <div style={styles.tabs}>
        {[
          { key: 'today', label: 'Today' },
          { key: 'upcoming', label: 'Upcoming' },
          { key: 'completed', label: 'Completed' },
          { key: 'all', label: 'All Appointments' },
          { key: 'leaves', label: 'My Leaves' },
        ].map(t => (
          <button
            key={t.key}
            style={{ ...styles.tab, ...(tab === t.key ? styles.activeTab : {}) }}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'leaves' ? (
        <div className="card">
          <h3>Manage My Leaves</h3>
          <p style={styles.sub}>Mark days you are unavailable for patient appointments.</p>

          <form onSubmit={handleApplyLeave} style={styles.leaveForm}>
            <div style={styles.leaveRow}>
              <input
                type="date"
                min={today}
                value={leaveDate}
                onChange={e => setLeaveDate(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Reason (e.g. Conference, Personal)"
                value={leaveReason}
                onChange={e => setLeaveReason(e.target.value)}
              />
              <button type="submit" className="btn-primary" disabled={leaveLoading}>
                {leaveLoading ? 'Saving...' : 'Apply Leave'}
              </button>
            </div>
          </form>

          {leaveMsg && <div style={styles.successBox}>{leaveMsg}</div>}

          <h4 style={{ marginTop: '24px' }}>Your Scheduled Leaves</h4>
          {leaves.length === 0 ? (
            <p style={{ color: '#697776', fontSize: '0.9rem' }}>No leave dates scheduled.</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reason</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map(l => (
                  <tr key={l._id}>
                    <td>{fmt(l.date)}</td>
                    <td>{l.reason || 'Not specified'}</td>
                    <td>
                      <button onClick={() => handleDeleteLeave(l._id)} style={styles.deleteBtn}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div style={styles.grid}>
          {/* Appointment list */}
          <div>
            {loading ? (
              <div style={styles.loadingBox}>Loading appointments...</div>
            ) : displayed.length === 0 ? (
              <div className="card" style={styles.empty}>No appointments found for this filter.</div>
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
                      <span style={{ ...styles.statusBadge, background: `${statusColor[a.status] || '#697776'}20`, color: statusColor[a.status] || '#697776' }}>
                        {a.status}
                      </span>
                    </div>
                    <p style={styles.appMeta}>{fmt(a.date)} · {a.startTime} – {a.endTime}</p>
                    <p style={styles.appMeta}>{a.patientId?.email}</p>

                    <div style={styles.actionRow}>
                      {a.status === 'PENDING' && (
                        <>
                          <button style={styles.acceptBtn} onClick={() => handleStatusUpdate(a._id, 'CONFIRMED')}>Accept</button>
                          <button style={styles.rejectBtn} onClick={() => handleStatusUpdate(a._id, 'REJECTED')}>Reject</button>
                        </>
                      )}
                      {a.status === 'CONFIRMED' && (
                        <>
                          <button style={styles.consultBtn} onClick={() => openConsultation(a._id)}>Open Consultation</button>
                          <button style={styles.cancelBtn} onClick={() => handleStatusUpdate(a._id, 'CANCELLED')}>Cancel</button>
                        </>
                      )}
                      {a.status === 'COMPLETED' && (
                        <button style={styles.consultBtn} onClick={() => openConsultation(a._id)}>View Visit Notes</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Consultation panel */}
          <div>
            {!selectedApp && <div className="card" style={styles.empty}>Select an appointment to open clinical consultation notes.</div>}

            {selectedApp && detailLoading && <div style={styles.loadingBox}>Loading patient records...</div>}

            {selectedApp && !detailLoading && appDetail && (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>Consultation Record</h3>
                  {(appDetail.status === 'CONFIRMED' || appDetail.status === 'PENDING') && (
                    <button style={styles.cancelBtn} onClick={() => handleStatusUpdate(appDetail._id, 'CANCELLED')}>
                      Cancel Appointment
                    </button>
                  )}
                </div>
                <p style={styles.appMeta}><strong>Patient:</strong> {appDetail.patientId?.name} ({appDetail.patientId?.email})</p>
                <p style={styles.appMeta}><strong>Date:</strong> {fmt(appDetail.date)} · {appDetail.startTime}–{appDetail.endTime}</p>
                <p style={styles.appMeta}><strong>Status:</strong> <span style={{ color: statusColor[appDetail.status], fontWeight: '600' }}>{appDetail.status}</span></p>

                {/* Show symptom report if available */}
                {appDetail.symptomReportId && (
                  <div style={styles.symptomsBox}>
                    <strong>Patient Reported Symptoms:</strong>
                    <p style={{ marginTop: '4px' }}>{appDetail.symptomReportId.symptoms}</p>
                    {appDetail.symptomReportId.aiSummary && (
                      <div style={{ marginTop: '10px', background: '#FFFFFF', padding: '12px', borderRadius: '6px', borderLeft: `4px solid ${appDetail.symptomReportId.aiSummary.urgency === 'High' ? '#C97872' : '#2F6F6D'}` }}>
                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '700', background: appDetail.symptomReportId.aiSummary.urgency === 'High' ? '#FDF3F2' : '#EAF2F0', color: appDetail.symptomReportId.aiSummary.urgency === 'High' ? '#C97872' : '#2F6F6D' }}>
                          AI Urgency: {appDetail.symptomReportId.aiSummary.urgency}
                        </span>
                        <p style={{ margin: '6px 0 4px', fontSize: '0.875rem' }}><strong>Chief Complaint:</strong> {appDetail.symptomReportId.aiSummary.chiefComplaint}</p>
                        {appDetail.symptomReportId.aiSummary.suggestedQuestions?.length > 0 && (
                          <div style={{ marginTop: '6px', fontSize: '0.82rem', color: '#263536' }}>
                            <strong>Suggested Questions for Doctor:</strong>
                            <ol style={{ paddingLeft: '18px', margin: '4px 0' }}>
                              {appDetail.symptomReportId.aiSummary.suggestedQuestions.map((q, i) => (
                                <li key={i}>{q}</li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Completed visit note / Edit mode */}
                {appDetail.visitNoteId ? (
                  isEditingNotes ? (
                    <form onSubmit={handleUpdateSubmit} style={styles.form}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ margin: 0, color: '#2F6F6D' }}>✏️ Edit Consultation Notes</h4>
                        <button type="button" style={styles.secondaryBtn} onClick={() => setIsEditingNotes(false)}>Cancel Edit</button>
                      </div>

                      <label style={styles.label}>Clinical Notes *</label>
                      <textarea
                        rows={3}
                        value={clinicalNotes}
                        onChange={e => setClinicalNotes(e.target.value)}
                        placeholder="Clinical observations, patient history..."
                        required
                      />

                      <label style={styles.label}>Diagnosis</label>
                      <input
                        value={diagnosis}
                        onChange={e => setDiagnosis(e.target.value)}
                        placeholder="e.g. Acute viral rhinitis"
                      />

                      <label style={styles.label}>Follow-up Instructions</label>
                      <input
                        value={followUp}
                        onChange={e => setFollowUp(e.target.value)}
                        placeholder="e.g. Return in 5 days if fever persists"
                      />

                      <label style={styles.label}>Prescription</label>
                      {meds.map((m, idx) => (
                        <div key={idx} style={styles.medRow}>
                          <input placeholder="Medicine Name" value={m.name} onChange={e => handleMedChange(idx, 'name', e.target.value)} />
                          <input placeholder="Dosage (500mg)" value={m.dosage} onChange={e => handleMedChange(idx, 'dosage', e.target.value)} />
                          <input placeholder="Frequency (Twice daily)" value={m.frequency} onChange={e => handleMedChange(idx, 'frequency', e.target.value)} />
                          <input placeholder="Duration (5 days)" value={m.duration} onChange={e => handleMedChange(idx, 'duration', e.target.value)} />
                        </div>
                      ))}
                      <button type="button" onClick={() => setMeds(p => [...p, { name: '', dosage: '', frequency: '', duration: '' }])} style={styles.addMedBtn}>
                        + Add Medication
                      </button>

                      {submitError && <div style={styles.errorBox}>{submitError}</div>}

                      <button type="submit" className="btn-primary" disabled={submitting} style={{ marginTop: '16px' }}>
                        {submitting ? 'Updating & Re-generating AI Explainer...' : 'Save Updated Consultation Notes'}
                      </button>
                    </form>
                  ) : (
                    <div style={styles.completedBox}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <h4 style={{ margin: 0 }}>Finalized Visit Record</h4>
                        <button style={styles.editBtn} onClick={startEditVisitNotes}>
                          ✏️ Edit Consultation Notes
                        </button>
                      </div>
                      <p><strong>Clinical Notes:</strong> {appDetail.visitNoteId.clinicalNotes}</p>
                      <p><strong>Diagnosis:</strong> {appDetail.visitNoteId.diagnosis || '—'}</p>
                      <p><strong>Follow-up Instructions:</strong> {appDetail.visitNoteId.followUp || '—'}</p>
                      {appDetail.visitNoteId.prescription?.length > 0 && (
                        <div style={{ marginTop: '10px' }}>
                          <strong>Prescription:</strong>
                          <ul style={{ paddingLeft: '20px', marginTop: '4px' }}>
                            {appDetail.visitNoteId.prescription.map((p, i) => (
                              <li key={i}>{p.name} — {p.dosage}, {p.frequency}, {p.duration}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {appDetail.visitNoteId.patientSummary?.summary && (
                        <div style={styles.aiSummaryResult}>
                          <strong>Generated AI Patient Explainer:</strong>
                          <p>{appDetail.visitNoteId.patientSummary.summary}</p>
                          {appDetail.visitNoteId.patientSummary.precautions?.length > 0 && (
                            <p><strong>Precautions:</strong> {appDetail.visitNoteId.patientSummary.precautions.join(', ')}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <form onSubmit={handleSubmit} style={styles.form}>
                    <label style={styles.label}>Clinical Notes *</label>
                    <textarea
                      rows={3}
                      value={clinicalNotes}
                      onChange={e => setClinicalNotes(e.target.value)}
                      placeholder="Clinical observations, patient history..."
                      required
                    />

                    <label style={styles.label}>Diagnosis</label>
                    <input
                      value={diagnosis}
                      onChange={e => setDiagnosis(e.target.value)}
                      placeholder="e.g. Acute viral rhinitis"
                    />

                    <label style={styles.label}>Follow-up Instructions</label>
                    <input
                      value={followUp}
                      onChange={e => setFollowUp(e.target.value)}
                      placeholder="e.g. Return in 5 days if fever persists"
                    />

                    <label style={styles.label}>Prescription</label>
                    {meds.map((m, idx) => (
                      <div key={idx} style={styles.medRow}>
                        <input placeholder="Medicine Name" value={m.name} onChange={e => handleMedChange(idx, 'name', e.target.value)} />
                        <input placeholder="Dosage (500mg)" value={m.dosage} onChange={e => handleMedChange(idx, 'dosage', e.target.value)} />
                        <input placeholder="Frequency (Twice daily)" value={m.frequency} onChange={e => handleMedChange(idx, 'frequency', e.target.value)} />
                        <input placeholder="Duration (5 days)" value={m.duration} onChange={e => handleMedChange(idx, 'duration', e.target.value)} />
                      </div>
                    ))}
                    <button type="button" onClick={() => setMeds(p => [...p, { name: '', dosage: '', frequency: '', duration: '' }])} style={styles.addMedBtn}>
                      + Add Medication
                    </button>

                    {submitError && <div style={styles.errorBox}>{submitError}</div>}

                    <button type="submit" className="btn-primary" disabled={submitting} style={{ marginTop: '16px' }}>
                      {submitting ? 'Saving & Finalizing...' : 'Finalize Consultation & Complete Visit'}
                    </button>
                  </form>
                )}

                {submitResult && (
                  <div style={styles.successBox}>
                    <strong>Visit finalized and saved to MongoDB Atlas!</strong>
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

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '20px' },
  sub: { color: '#697776', marginTop: '4px', fontSize: '0.9rem' },
  errorBox: { background: '#FDF3F2', color: '#C97872', padding: '12px', borderRadius: '8px' },
  loadingBox: { textAlign: 'center', color: '#697776', padding: '40px' },
  empty: { textAlign: 'center', color: '#697776', padding: '40px' },
  tabs: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  tab: { padding: '8px 18px', borderRadius: '20px', border: '1px solid rgba(47,111,109,0.2)', background: 'transparent', color: '#697776', cursor: 'pointer', fontSize: '0.85rem' },
  activeTab: { background: '#2F6F6D', color: '#fff', border: '1px solid #2F6F6D' },
  grid: { display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px', alignItems: 'start' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  appCard: { display: 'flex', flexDirection: 'column', gap: '6px' },
  selectedCard: { border: '2px solid #2F6F6D' },
  appHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  patientName: { fontWeight: '600', color: '#263536' },
  statusBadge: { padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600' },
  appMeta: { fontSize: '0.85rem', color: '#697776' },
  actionRow: { display: 'flex', gap: '8px', marginTop: '8px' },
  acceptBtn: { background: '#2F6F6D', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' },
  rejectBtn: { background: '#FDF3F2', color: '#C97872', border: '1px solid rgba(201,120,114,0.3)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' },
  cancelBtn: { background: '#FDF3F2', color: '#C97872', border: '1px solid #C97872', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' },
  editBtn: { background: '#FFFFFF', color: '#2F6F6D', border: '1px solid #2F6F6D', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' },
  secondaryBtn: { background: 'transparent', color: '#697776', border: '1px solid #697776', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' },
  consultBtn: { flex: 1, background: '#EAF2F0', color: '#2F6F6D', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' },
  symptomsBox: { background: '#F7F8F5', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.875rem' },
  aiHint: { color: '#2F6F6D', fontWeight: '600', marginTop: '8px' },
  completedBox: { background: '#EAF2F0', padding: '16px', borderRadius: '8px', fontSize: '0.9rem', lineHeight: '1.6' },
  aiSummaryResult: { marginTop: '12px', background: '#FFFFFF', padding: '12px', borderRadius: '6px', fontSize: '0.85rem' },
  successBox: { background: '#EAF2F0', color: '#2F6F6D', padding: '12px', borderRadius: '8px', marginTop: '16px' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' },
  label: { fontSize: '0.85rem', fontWeight: '600', color: '#263536' },
  medRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' },
  addMedBtn: { background: '#F7F8F5', border: '1px dashed rgba(47,111,109,0.3)', color: '#2F6F6D', padding: '8px', borderRadius: '6px', cursor: 'pointer' },
  leaveForm: { marginTop: '16px', marginBottom: '16px' },
  leaveRow: { display: 'grid', gridTemplateColumns: '180px 1fr 140px', gap: '12px' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '12px', fontSize: '0.875rem' },
  deleteBtn: { background: 'transparent', border: '1px solid #C97872', color: '#C97872', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' },
};

export default DoctorDashboard;
