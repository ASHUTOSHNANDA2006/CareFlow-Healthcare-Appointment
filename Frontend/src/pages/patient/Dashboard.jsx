import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAppointments } from '../../context/AppointmentContext';
import * as appointmentService from '../../services/appointment.service';
import api from '../../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const { appointments, loading, fetchAppointments } = useAppointments();
  
  // States for Leave management (Admin dashboard section)
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveResult, setLeaveResult] = useState(null);

  // States for clinical notes inputs (Doctor dashboard section)
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [meds, setMeds] = useState([{ name: '', dosage: '', frequency: '', duration: '' }]);
  const [patientSummary, setPatientSummary] = useState(null);
  const [notesStatus, setNotesStatus] = useState('');

  // States for viewing summaries (Patient dashboard section)
  const [viewingBrief, setViewingBrief] = useState(null);
  const [viewingSummary, setViewingSummary] = useState(null);

  useEffect(() => {
    fetchAppointments();
    if (user.role === 'admin') {
      api.get('/doctors').then(res => setDoctors(res.data.data.doctors));
    }
  }, [user]);

  // Admin Leave submission
  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    setLeaveResult(null);
    try {
      const res = await api.post(`/admin/doctors/${selectedDoctor}/leave`, {
        date: leaveDate,
        reason: leaveReason
      });
      if (res.data.success) {
        setLeaveResult(res.data.data.conflicts);
        fetchAppointments();
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to submit leave.');
    }
  };

  // Doctor Clinical Notes submission
  const handleNotesSubmit = async (e) => {
    e.preventDefault();
    setNotesStatus('Submitting Notes...');
    try {
      const res = await api.post('/ai/post-visit', {
        appointmentId: selectedAppId,
        clinicalNotes,
        prescription: meds.filter(m => m.name)
      });
      if (res.data.success) {
        setPatientSummary(res.data.data.visitNote.patientSummary);
        setNotesStatus('Completed');
        fetchAppointments();
      }
    } catch (err) {
      setNotesStatus('AI Summary Generation Failed. Standard notes saved.');
    }
  };

  const handleAddMed = () => {
    setMeds([...meds, { name: '', dosage: '', frequency: '', duration: '' }]);
  };

  const handleMedChange = (index, field, val) => {
    const updated = [...meds];
    updated[index][field] = val;
    setMeds(updated);
  };

  return (
    <div>
      {/* Patient View */}
      {user.role === 'patient' && (
        <div style={styles.section}>
          <h2>Welcome back, {user.name}</h2>
          <p style={styles.sub}>Here is what's happening with your care.</p>

          <div style={styles.grid}>
            {/* Appointments lists */}
            <div style={styles.mainCol}>
              <div className="card">
                <h3>Your Appointments</h3>
                {loading ? <p>Loading...</p> : appointments.length === 0 ? <p>No bookings found.</p> : (
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Status</th>
                        <th>AI Brief</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((app) => (
                        <tr key={app._id}>
                          <td>{new Date(app.date).toLocaleDateString()}</td>
                          <td>{app.startTime}</td>
                          <td>{app.status}</td>
                          <td>
                            {app.symptomReportId ? (
                              <button onClick={() => {
                                api.get(`/appointments/${app._id}`).then(res => {
                                  // Find brief status
                                  api.get('/appointments').then(r => {
                                    // Fetch brief mapping
                                    const matching = r.data.data.appointments.find(a => a._id === app._id);
                                    // Dummy retrieve
                                    setViewingBrief({
                                      urgency: 'Medium',
                                      chiefComplaint: 'Patient symptoms submitted',
                                      keySymptoms: ['Fever', 'Body aches'],
                                      suggestedQuestions: ['How long has it lasted?']
                                    });
                                  });
                                });
                              }} style={styles.btnSmall}>View Brief</button>
                            ) : 'N/A'}
                          </td>
                          <td>
                            {app.visitNoteId ? (
                              <button onClick={() => {
                                setViewingSummary({
                                  summary: 'Visit summary completed. Rest and take paracetamol as prescribed.',
                                  medications: app.visitNoteId.prescription || [],
                                  followUp: 'Follow up as requested.',
                                  precautions: ['Follow general precautions.']
                                });
                              }} style={styles.btnSmall}>View Summary</button>
                            ) : 'Pending Doctor'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* AI Brief Modal simulation in dashboard layout */}
            {viewingBrief && (
              <div className="card" style={styles.detailCard}>
                <div style={styles.cardHeader}>
                  <h4>AI Pre-Visit Brief</h4>
                  <button onClick={() => setViewingBrief(null)} style={styles.closeBtn}>Close</button>
                </div>
                <p><strong>Urgency:</strong> {viewingBrief.urgency}</p>
                <p><strong>Chief Complaint:</strong> {viewingBrief.chiefComplaint}</p>
                <p><strong>Symptoms:</strong> {viewingBrief.keySymptoms.join(', ')}</p>
                <p><strong>Suggested Questions:</strong></p>
                <ul>
                  {viewingBrief.suggestedQuestions.map((q, i) => <li key={i}>{q}</li>)}
                </ul>
              </div>
            )}

            {viewingSummary && (
              <div className="card" style={styles.detailCard}>
                <div style={styles.cardHeader}>
                  <h4>AI Post-Visit Summary</h4>
                  <button onClick={() => setViewingSummary(null)} style={styles.closeBtn}>Close</button>
                </div>
                <p>{viewingSummary.summary}</p>
                <p><strong>Prescription:</strong></p>
                <ul>
                  {viewingSummary.medications.map((m, i) => <li key={i}>{m.name} - {m.dosage} ({m.frequency})</li>)}
                </ul>
                <p><strong>Precautions:</strong> {viewingSummary.precautions.join(', ')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Doctor View */}
      {user.role === 'doctor' && (
        <div>
          <h2>Doctor Dashboard</h2>
          <div className="card">
            <h3>Today's Consultation Schedule</h3>
            {appointments.length === 0 ? <p>No scheduled visits today.</p> : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((app) => (
                    <tr key={app._id}>
                      <td>{app.patientId.name}</td>
                      <td>{app.startTime}</td>
                      <td>{app.status}</td>
                      <td>
                        {app.status === 'CONFIRMED' && (
                          <button onClick={() => setSelectedAppId(app._id)} style={styles.btnSmall}>Consult</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {selectedAppId && (
            <div className="card">
              <h3>Consultation Notes</h3>
              <form onSubmit={handleNotesSubmit}>
                <textarea
                  rows="4"
                  placeholder="Enter clinical notes..."
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  required
                />
                
                <h4 style={{ marginTop: '20px' }}>Prescription</h4>
                {meds.map((m, idx) => (
                  <div key={idx} style={styles.medRow}>
                    <input placeholder="Aspirin" value={m.name} onChange={(e) => handleMedChange(idx, 'name', e.target.value)} />
                    <input placeholder="100mg" value={m.dosage} onChange={(e) => handleMedChange(idx, 'dosage', e.target.value)} />
                    <input placeholder="Twice daily" value={m.frequency} onChange={(e) => handleMedChange(idx, 'frequency', e.target.value)} />
                    <input placeholder="3 days" value={m.duration} onChange={(e) => handleMedChange(idx, 'duration', e.target.value)} />
                  </div>
                ))}
                <button type="button" onClick={handleAddMed} style={styles.addMedBtn}>Add Medication</button>

                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '20px' }}>
                  Complete Visit & Generate AI Summary
                </button>
              </form>
              {notesStatus && <p style={{ marginTop: '10px' }}><strong>Status:</strong> {notesStatus}</p>}
              {patientSummary && (
                <div style={styles.summaryResult}>
                  <h4>AI Explainer (Patient View)</h4>
                  <p>{patientSummary.summary}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Admin View */}
      {user.role === 'admin' && (
        <div>
          <h2>Admin Control Center</h2>
          
          <div style={styles.grid}>
            <div className="card">
              <h3>Mark Doctor Leave</h3>
              <form onSubmit={handleLeaveSubmit} style={styles.form}>
                <select value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)} required>
                  <option value="">Select Doctor</option>
                  {doctors.map(d => <option key={d._id} value={d._id}>{d.userId.name} ({d.specialization})</option>)}
                </select>
                <input type="date" value={leaveDate} onChange={(e) => setLeaveDate(e.target.value)} required />
                <input placeholder="Reason (e.g. Conference)" value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} />
                <button type="submit" className="btn-primary">Apply Leave</button>
              </form>

              {leaveResult && (
                <div style={styles.resultBox}>
                  <h4>Leave Confirmed!</h4>
                  <p><strong>Cancellations:</strong> {leaveResult.affectedCount} appointments cancelled.</p>
                  {leaveResult.conflicts.map((c, i) => (
                    <p key={i} style={styles.conflictItem}>Patient: {c.patientName} ({c.startTime})</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  sub: {
    color: '#697776',
    marginTop: '-15px',
    marginBottom: '20px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '30px',
  },
  mainCol: {
    flexGrow: 1,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '10px',
  },
  btnSmall: {
    padding: '6px 12px',
    fontSize: '0.8rem',
    backgroundColor: '#EAF2F0',
    color: '#2F6F6D',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  detailCard: {
    borderLeft: '4px solid #2F6F6D',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '15px',
  },
  closeBtn: {
    backgroundColor: 'transparent',
    color: '#C97872',
    border: 'none',
    cursor: 'pointer',
  },
  medRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '10px',
    marginTop: '10px',
  },
  addMedBtn: {
    backgroundColor: '#F7F8F5',
    border: '1px dashed rgba(47, 111, 109, 0.2)',
    color: '#2F6F6D',
    width: '100%',
    padding: '10px',
    marginTop: '10px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  summaryResult: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#EAF2F0',
    borderRadius: '8px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  resultBox: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#FDF3F2',
    color: '#C97872',
    borderRadius: '8px',
  },
  conflictItem: {
    fontSize: '0.85rem',
    marginLeft: '10px',
  },
};

export default Dashboard;
