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
          // Only show completed visits
          const completed = res.data.appointments.filter(a => a.status === 'COMPLETED');
          setAppointments(completed);
        }
      } catch (err) {
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

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2>Previous Visits</h2>
          <p style={styles.sub}>Your completed consultations and prescriptions.</p>
        </div>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>← Dashboard</button>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      {loading ? (
        <div style={styles.loadingBox}>Loading your visit history...</div>
      ) : appointments.length === 0 ? (
        <div className="card" style={styles.empty}>No completed visits yet.</div>
      ) : (
        <div style={styles.grid}>
          {/* Visit list */}
          <div style={styles.list}>
            {appointments.map(a => (
              <div
                key={a._id}
                className="card"
                style={{ ...styles.visitCard, ...(selected === a._id ? styles.selected : {}) }}
                onClick={() => loadDetail(a._id)}
              >
                <div style={styles.visitHeader}>
                  <span style={styles.docName}>{a.doctorId?.userId?.name || 'Doctor'}</span>
                  <span style={styles.dateTag}>{fmt(a.date)}</span>
                </div>
                <span style={styles.spec}>{a.doctorId?.specialization}</span>
                <span style={styles.time}>{a.startTime} – {a.endTime}</span>
              </div>
            ))}
          </div>

          {/* Detail panel */}
          <div style={styles.detail}>
            {!selected && <div style={styles.empty}>Select a visit to view details.</div>}
            {detailLoading && <div style={styles.loadingBox}>Loading visit details...</div>}
            {detail && !detailLoading && (
              <div className="card">
                <h3 style={styles.detailTitle}>Visit on {fmt(detail.date)}</h3>
                <p style={styles.detailDoc}>
                  <strong>Doctor:</strong> {detail.doctorId?.userId?.name} ({detail.doctorId?.specialization})
                </p>
                <p style={styles.detailDoc}><strong>Time:</strong> {detail.startTime} – {detail.endTime}</p>

                {detail.visitNoteId ? (
                  <>
                    <hr style={styles.divider} />
                    <h4>Clinical Notes</h4>
                    <p style={styles.notes}>{detail.visitNoteId.clinicalNotes || '—'}</p>

                    <h4 style={styles.sectionTitle}>Diagnosis</h4>
                    <p style={styles.notes}>{detail.visitNoteId.diagnosis || '—'}</p>

                    <h4 style={styles.sectionTitle}>Follow-up</h4>
                    <p style={styles.notes}>{detail.visitNoteId.followUp || '—'}</p>

                    {detail.visitNoteId.prescription?.length > 0 && (
                      <>
                        <h4 style={styles.sectionTitle}>Prescription</h4>
                        <table style={styles.table}>
                          <thead>
                            <tr>
                              <th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detail.visitNoteId.prescription.map((p, i) => (
                              <tr key={i}>
                                <td>{p.name}</td>
                                <td>{p.dosage}</td>
                                <td>{p.frequency}</td>
                                <td>{p.duration}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </>
                    )}

                    {detail.visitNoteId.patientSummary && (
                      <>
                        <h4 style={styles.sectionTitle}>AI Patient Summary</h4>
                        <div style={styles.aiBox}>
                          <p>{detail.visitNoteId.patientSummary.summary}</p>
                          {detail.visitNoteId.patientSummary.precautions?.length > 0 && (
                            <p><strong>Precautions:</strong> {detail.visitNoteId.patientSummary.precautions.join(', ')}</p>
                          )}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <p style={styles.sub}>No visit notes available yet.</p>
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
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  sub: { color: '#697776', marginTop: '4px' },
  backBtn: { background: 'transparent', border: '1px solid #2F6F6D', color: '#2F6F6D', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' },
  errorBox: { background: '#FDF3F2', color: '#C97872', padding: '12px', borderRadius: '8px' },
  loadingBox: { textAlign: 'center', color: '#697776', padding: '40px' },
  empty: { textAlign: 'center', color: '#697776', padding: '40px' },
  grid: { display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  visitCard: { cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px', transition: 'box-shadow 0.2s' },
  selected: { border: '2px solid #2F6F6D' },
  visitHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  docName: { fontWeight: '600', color: '#263536' },
  dateTag: { fontSize: '0.8rem', color: '#697776' },
  spec: { fontSize: '0.85rem', color: '#2F6F6D', fontWeight: '600' },
  time: { fontSize: '0.8rem', color: '#697776' },
  detail: {},
  detailTitle: { fontSize: '1.2rem', marginBottom: '12px' },
  detailDoc: { fontSize: '0.9rem', color: '#697776', marginBottom: '6px' },
  divider: { margin: '16px 0', borderColor: 'rgba(47,111,109,0.1)' },
  sectionTitle: { marginTop: '16px', marginBottom: '8px' },
  notes: { fontSize: '0.9rem', color: '#263536', lineHeight: '1.6' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginTop: '8px' },
  aiBox: { background: '#EAF2F0', padding: '16px', borderRadius: '8px', fontSize: '0.9rem', lineHeight: '1.6' },
};

export default PreviousVisits;
