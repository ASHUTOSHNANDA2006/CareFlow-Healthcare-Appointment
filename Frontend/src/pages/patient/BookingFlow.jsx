import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as appointmentService from '../../services/appointment.service';
import * as aiService from '../../services/ai.service';

const BookingFlow = () => {
  const [doctorId] = useState(new URLSearchParams(window.location.search).get('doctor'));
  const [doctorName] = useState(new URLSearchParams(window.location.search).get('name') || 'Doctor');
  
  const [step, setStep] = useState(1);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isOnLeave, setIsOnLeave] = useState(false);
  
  const [holdId, setHoldId] = useState(null);
  const [timer, setTimer] = useState(300); // 5 minutes hold countdown timer
  const [timerInterval, setTimerInterval] = useState(null);

  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleDateSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsOnLeave(false);
    setLoading(true);

    try {
      const res = await appointmentService.getAvailability(doctorId, date);
      if (res.success) {
        if (res.data.available === false || res.data.reason === 'DOCTOR_ON_LEAVE') {
          setIsOnLeave(true);
          setSlots([]);
          setError('Doctor unavailable — On leave for this date.');
        } else {
          setSlots(res.data.slots || []);
        }
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to fetch doctor availability.');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotHold = async (slot) => {
    setError('');
    setLoading(true);

    try {
      const res = await appointmentService.holdSlot({
        doctorId,
        date,
        startTime: slot.startTime,
        endTime: slot.endTime,
      });

      if (res.success) {
        const slotHoldId = res.data.slotHold?._id || res.data.appointment?._id;
        setHoldId(slotHoldId);
        setSelectedSlot(slot);
        setStep(3);

        // Start 5 minutes hold lock countdown timer
        const interval = setInterval(() => {
          setTimer((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              setError('Your slot reservation hold has expired. Please select another slot.');
              setStep(2);
              return 300;
            }
            return prev - 1;
          });
        }, 1000);
        setTimerInterval(interval);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'This slot was locked by another user. Refreshing.');
      // Refresh slots
      const refreshRes = await appointmentService.getAvailability(doctorId, date);
      setSlots(refreshRes.data?.slots || []);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setError('');
    setLoading(true);

    try {
      // 1. Confirm booking to convert SlotHold to permanent Appointment
      const confirmRes = await appointmentService.confirmBooking({ slotHoldId: holdId });
      if (confirmRes.success) {
        const confirmedApp = confirmRes.data.appointment;
        
        // 2. Submit symptoms AI triggers attached to confirmed appointment
        if (symptoms.trim() && confirmedApp?._id) {
          try {
            await aiService.submitSymptoms({
              appointmentId: confirmedApp._id,
              symptoms,
            });
          } catch (aiErr) {
            console.warn('Pre-visit AI analysis warning:', aiErr);
          }
        }

        if (timerInterval) clearInterval(timerInterval);
        setStep(5);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Booking confirmation failed.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.progress}>
        <div style={{ ...styles.progressBar, width: `${(step / 5) * 100}%` }}></div>
      </div>

      <div style={styles.card}>
        <span style={styles.stepIndicator}>STEP 0{step} OF 05</span>

        {error && <div style={styles.error}>{error}</div>}

        {step === 1 && (
          <form onSubmit={handleDateSubmit} style={styles.stepContainer}>
            <h3>Choose a date for your visit with {doctorName}</h3>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            <button type="submit" className="btn-primary" style={styles.btn}>
              Find Slots
            </button>
          </form>
        )}

        {step === 2 && (
          <div style={styles.stepContainer}>
            <h3>Slots for {date}</h3>
            {isOnLeave ? (
              <div style={{ textAlign: 'center', padding: '20px', background: '#FDF3F2', color: '#C97872', borderRadius: '8px' }}>
                <strong>Doctor unavailable — On leave for this date.</strong>
                <p style={{ marginTop: '8px', fontSize: '0.85rem' }}>Please choose another date for your consultation.</p>
                <button onClick={() => setStep(1)} className="btn-primary" style={{ marginTop: '14px' }}>Choose Another Date</button>
              </div>
            ) : slots.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#697776', padding: '20px' }}>
                <p>No available slots found for this date.</p>
                <button onClick={() => setStep(1)} className="btn-primary" style={{ marginTop: '14px' }}>Choose Another Date</button>
              </div>
            ) : (
              <div style={styles.slotGrid}>
                {slots.map((s, idx) => (
                  <button
                    key={idx}
                    disabled={s.status !== 'AVAILABLE' || loading}
                    onClick={() => handleSlotHold(s)}
                    style={{
                      ...styles.slotBtn,
                      backgroundColor: s.status === 'AVAILABLE' ? '#FFFFFF' : '#f0f0f0',
                      color: s.status === 'AVAILABLE' ? '#2F6F6D' : '#697776',
                      border: s.status === 'AVAILABLE' ? '1px solid #2F6F6D' : '1px solid #e0e0e0',
                    }}
                  >
                    {s.startTime} - {s.endTime}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div style={styles.stepContainer}>
            <div style={styles.timerBadge}>
              Slot Reserved — {formatTimer(timer)} remaining
            </div>
            <h3>Describe your symptoms</h3>
            <p style={styles.helper}>This helps your doctor prepare before the appointment.</p>
            <textarea
              rows="4"
              placeholder="Fever, headache, chills since last 2 days..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
            />
            <button onClick={() => setStep(4)} className="btn-primary" style={styles.btn}>
              Review Booking
            </button>
          </div>
        )}

        {step === 4 && (
          <div style={styles.stepContainer}>
            <div style={styles.timerBadge}>
              Slot Reserved — {formatTimer(timer)} remaining
            </div>
            <h3>Review Details</h3>
            <div style={styles.detailsBox}>
              <p><strong>Doctor:</strong> {doctorName}</p>
              <p><strong>Date:</strong> {date}</p>
              <p><strong>Time Slot:</strong> {selectedSlot?.startTime} - {selectedSlot?.endTime}</p>
              {symptoms && <p><strong>Symptoms:</strong> {symptoms}</p>}
            </div>
            <button onClick={handleConfirm} disabled={loading} className="btn-primary" style={styles.btn}>
              {loading ? 'Confirming...' : 'Confirm Appointment'}
            </button>
          </div>
        )}

        {step === 5 && (
          <div style={styles.stepContainer}>
            <span style={styles.successBadge}>SUCCESS</span>
            <h3>Appointment Confirmed!</h3>
            <p>Your appointment has been successfully scheduled and synced to your calendar.</p>
            <button onClick={() => navigate('/dashboard')} className="btn-primary" style={styles.btn}>
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '500px',
    margin: '40px auto',
  },
  progress: {
    height: '6px',
    backgroundColor: 'rgba(47, 111, 109, 0.1)',
    borderRadius: '3px',
    marginBottom: '20px',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2F6F6D',
    transition: 'width 0.3s ease',
  },
  card: {
    backgroundColor: '#FFFFFF',
    border: '1px solid rgba(47, 111, 109, 0.1)',
    borderRadius: '14px',
    padding: '30px',
  },
  stepIndicator: {
    fontSize: '0.75rem',
    fontWeight: 'bold',
    color: '#697776',
    letterSpacing: '0.05em',
    marginBottom: '16px',
    display: 'block',
  },
  stepContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  slotGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  slotBtn: {
    padding: '12px',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  timerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FDF3F2',
    color: '#C97872',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.8rem',
    fontWeight: '600',
  },
  helper: {
    fontSize: '0.85rem',
    color: '#697776',
  },
  detailsBox: {
    backgroundColor: '#F7F8F5',
    padding: '16px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontSize: '0.9rem',
  },
  btn: {
    width: '100%',
  },
  error: {
    color: '#C97872',
    fontSize: '0.9rem',
    marginBottom: '12px',
  },
  successBadge: {
    alignSelf: 'center',
    backgroundColor: '#EAF2F0',
    color: '#6FA889',
    fontWeight: 'bold',
    padding: '6px 12px',
    borderRadius: '12px',
    fontSize: '0.8rem',
  },
};

export default BookingFlow;
