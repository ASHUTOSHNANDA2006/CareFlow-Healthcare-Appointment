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
  const [isPastDate, setIsPastDate] = useState(false);
  const [holdId, setHoldId] = useState(null);
  const [timer, setTimer] = useState(300);
  const [timerInterval, setTimerInterval] = useState(null);
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiMessage, setAiMessage] = useState(null); // set when AI is quota-limited but symptoms saved

  const navigate = useNavigate();
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  // Live availability refresh while on Step 2
  React.useEffect(() => {
    if (step === 2 && date) {
      const interval = setInterval(async () => {
        try {
          const res = await appointmentService.getAvailability(doctorId, date);
          if (res.success && res.data.slots) setSlots(res.data.slots);
        } catch { /* silent */ }
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [step, date, doctorId]);

  const handleDateSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsOnLeave(false);
    setIsPastDate(false);
    setLoading(true);
    try {
      const res = await appointmentService.getAvailability(doctorId, date);
      if (res.success) {
        if (res.data.available === false && res.data.reason === 'DOCTOR_ON_LEAVE') {
          setIsOnLeave(true);
          setSlots([]);
          setError('Doctor unavailable — on leave for this date.');
        } else if (res.data.available === false && res.data.reason === 'PAST_DATE') {
          setIsPastDate(true);
          setSlots([]);
          setError('No appointments available for past dates.');
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
      const res = await appointmentService.holdSlot({ doctorId, date, startTime: slot.startTime, endTime: slot.endTime });
      if (res.success) {
        const slotHoldId = res.data.slotHold?._id || res.data.appointment?._id;
        setHoldId(slotHoldId);
        setSelectedSlot(slot);
        setStep(3);
        const interval = setInterval(() => {
          setTimer((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              setError('Your slot reservation has expired. Please select another slot.');
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
      const confirmRes = await appointmentService.confirmBooking({ slotHoldId: holdId });
      if (confirmRes.success) {
        const confirmedApp = confirmRes.data.appointment;
        if (symptoms.trim() && confirmedApp?._id) {
          try {
            const aiRes = await aiService.submitSymptoms({ appointmentId: confirmedApp._id, symptoms });
            // If AI quota exceeded, show user-friendly message (symptoms ARE saved)
            if (aiRes?.data?.aiMessage) {
              setAiMessage(aiRes.data.aiMessage);
            }
          } catch (aiErr) {
            console.warn('Pre-visit AI warning:', aiErr);
            // Even if AI call fails entirely, booking succeeded — don't block user
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
    const sec = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const timerPct = (timer / 300) * 100;
  const timerColor = timer < 60 ? '#ef4444' : timer < 120 ? '#f59e0b' : '#1e8a84';

  const STEP_LABELS = ['Date', 'Slot', 'Symptoms', 'Review', 'Done'];

  return (
    <div style={s.page}>
      {/* ── Progress stepper ── */}
      <div style={s.stepper}>
        {STEP_LABELS.map((label, i) => {
          const num = i + 1;
          const done = step > num;
          const active = step === num;
          return (
            <React.Fragment key={label}>
              <div style={s.stepperItem}>
                <div style={{
                  ...s.stepperDot,
                  background: done ? '#1e8a84' : active ? 'linear-gradient(135deg, #166f6a, #0a4f4b)' : '#e5e7eb',
                  color: (done || active) ? '#fff' : '#9ca3af',
                  boxShadow: active ? '0 4px 12px rgba(22,111,106,0.35)' : 'none',
                }}>
                  {done ? '✓' : num}
                </div>
                <span style={{ ...s.stepperLabel, color: active ? '#0a2e2b' : done ? '#1e8a84' : '#9ca3af', fontWeight: active ? 700 : 500 }}>
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div style={{ ...s.stepperLine, background: step > i + 1 ? '#1e8a84' : '#e5e7eb' }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ── Card ── */}
      <div style={s.card}>
        {/* Doctor info strip */}
        <div style={s.doctorStrip}>
          <div style={s.docAvatar}>{(doctorName?.[0] ?? 'D').toUpperCase()}</div>
          <div>
            <div style={s.docName}>{doctorName}</div>
            <div style={s.docSub}>New Appointment</div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={s.errorBox}>
            <span>⚠</span> {error}
          </div>
        )}

        {/* Timer badge (steps 3 & 4) */}
        {(step === 3 || step === 4) && (
          <div style={s.timerWrap}>
            <div style={s.timerTrack}>
              <div style={{ ...s.timerFill, width: `${timerPct}%`, background: timerColor }} />
            </div>
            <div style={{ ...s.timerText, color: timerColor }}>
              ⏱ Slot reserved — {formatTimer(timer)} remaining
            </div>
          </div>
        )}

        {/* ── STEP 1: Date ── */}
        {step === 1 && (
          <form onSubmit={handleDateSubmit} style={s.stepForm}>
            <h3 style={s.stepTitle}>Choose appointment date</h3>
            <p style={s.stepDesc}>Select a date to see available time slots for {doctorName}.</p>
            <input
              type="date"
              value={date}
              min={todayStr}
              onChange={(e) => setDate(e.target.value)}
              required
              style={s.dateInput}
              id="booking-date-input"
            />
            <button type="submit" disabled={loading} style={s.primaryBtn}>
              {loading ? 'Checking availability…' : 'Find Available Slots →'}
            </button>
          </form>
        )}

        {/* ── STEP 2: Slots ── */}
        {step === 2 && (
          <div style={s.stepForm}>
            <div style={s.stepHeader2}>
              <h3 style={s.stepTitle}>Available slots for {date}</h3>
              <button style={s.backLink} onClick={() => setStep(1)}>← Change date</button>
            </div>
            <p style={s.stepDesc}>Select a time slot to place a 5-minute hold.</p>

            {(isOnLeave || isPastDate) ? (
              <div style={s.unavailBox}>
                <div style={s.unavailIcon}>{isOnLeave ? '🏖️' : '📅'}</div>
                <h4 style={s.unavailTitle}>{isOnLeave ? 'Doctor on Leave' : 'Past Date'}</h4>
                <p style={s.unavailDesc}>
                  {isOnLeave
                    ? 'This doctor is on leave for the selected date. Please choose another date.'
                    : 'Appointments cannot be booked for past dates. Please choose today or a future date.'}
                </p>
                <button style={s.primaryBtn} onClick={() => setStep(1)}>Choose Another Date</button>
              </div>
            ) : slots.length === 0 ? (
              <div style={s.unavailBox}>
                <div style={s.unavailIcon}>😕</div>
                <h4 style={s.unavailTitle}>No slots available</h4>
                <p style={s.unavailDesc}>All time slots for this date are booked. Try another date.</p>
                <button style={s.primaryBtn} onClick={() => setStep(1)}>Choose Another Date</button>
              </div>
            ) : (
              <div style={s.slotGrid}>
                {slots.map((sl, idx) => {
                  const avail = sl.status === 'AVAILABLE';
                  return (
                    <button
                      key={idx}
                      disabled={!avail || loading}
                      onClick={() => handleSlotHold(sl)}
                      style={{
                        ...s.slotBtn,
                        ...(avail ? s.slotAvailable : s.slotUnavailable),
                      }}
                      id={`slot-btn-${idx}`}
                    >
                      <span style={s.slotTime}>{sl.startTime}</span>
                      <span style={s.slotEnd}>–{sl.endTime}</span>
                      {!avail && <span style={s.slotTaken}>Taken</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: Symptoms ── */}
        {step === 3 && (
          <div style={s.stepForm}>
            <h3 style={s.stepTitle}>Describe your symptoms</h3>
            <p style={s.stepDesc}>
              This helps your doctor prepare an AI pre-visit brief before your appointment.
              <br />
              <em style={{ fontSize: '0.82rem', color: '#9ca3af' }}>You can skip this if you prefer.</em>
            </p>
            <div style={s.textareaWrap}>
              <span style={s.textareaIcon}>🩺</span>
              <textarea
                rows={4}
                placeholder="e.g. Fever since 2 days, headache, mild fatigue…"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                style={s.textarea}
                id="symptoms-textarea"
              />
            </div>
            <button onClick={() => setStep(4)} style={s.primaryBtn}>
              Review Booking →
            </button>
          </div>
        )}

        {/* ── STEP 4: Review ── */}
        {step === 4 && (
          <div style={s.stepForm}>
            <h3 style={s.stepTitle}>Review your booking</h3>
            <p style={s.stepDesc}>Confirm the details below to finalize your appointment.</p>

            <div style={s.reviewCard}>
              <div style={s.reviewRow}>
                <span style={s.reviewLabel}>Doctor</span>
                <span style={s.reviewVal}>{doctorName}</span>
              </div>
              <div style={s.reviewDivider} />
              <div style={s.reviewRow}>
                <span style={s.reviewLabel}>Date</span>
                <span style={s.reviewVal}>{date}</span>
              </div>
              <div style={s.reviewDivider} />
              <div style={s.reviewRow}>
                <span style={s.reviewLabel}>Time Slot</span>
                <span style={s.reviewVal}>{selectedSlot?.startTime} – {selectedSlot?.endTime}</span>
              </div>
              {symptoms && (
                <>
                  <div style={s.reviewDivider} />
                  <div style={{ ...s.reviewRow, alignItems: 'flex-start' }}>
                    <span style={s.reviewLabel}>Symptoms</span>
                    <span style={{ ...s.reviewVal, textAlign: 'right', maxWidth: '65%', fontSize: '0.84rem', lineHeight: 1.5 }}>{symptoms}</span>
                  </div>
                </>
              )}
            </div>

            <div style={s.calendarNote}>
              📆 This appointment will be automatically synced to your Google Calendar.
            </div>

            <button onClick={handleConfirm} disabled={loading} style={s.confirmBtn} id="confirm-appt-btn">
              {loading ? '⏳ Confirming…' : '✓ Confirm Appointment'}
            </button>
            <button onClick={() => setStep(3)} style={s.secondaryBtn}>
              ← Edit Symptoms
            </button>
          </div>
        )}

        {/* ── STEP 5: Success ── */}
        {step === 5 && (
          <div style={{ ...s.stepForm, alignItems: 'center', textAlign: 'center' }}>
            <div style={s.successCircle}>✓</div>
            <h3 style={{ ...s.stepTitle, color: '#065f46' }}>Appointment Confirmed!</h3>
            <p style={s.stepDesc}>
              Your appointment has been successfully booked and synced to your Google Calendar.
            </p>

            {/* AI quota-exceeded notice */}
            {aiMessage && (
              <div style={s.aiNoticeBox}>
                <span style={s.aiNoticeIcon}>🧠</span>
                <div style={s.aiNoticeContent}>
                  <strong style={s.aiNoticeTitle}>Symptoms Saved</strong>
                  <p style={s.aiNoticeText}>{aiMessage}</p>
                </div>
              </div>
            )}

            {/* When AI worked normally */}
            {!aiMessage && symptoms && (
              <div style={{ ...s.aiNoticeBox, background: '#d1fae5', borderColor: 'rgba(5,150,105,0.15)' }}>
                <span style={s.aiNoticeIcon}>✦</span>
                <div style={s.aiNoticeContent}>
                  <strong style={{ ...s.aiNoticeTitle, color: '#065f46' }}>AI Brief Ready</strong>
                  <p style={{ ...s.aiNoticeText, color: '#047857' }}>Your pre-visit AI brief has been generated and will be available for your doctor.</p>
                </div>
              </div>
            )}

            <div style={s.successMeta}>
              <div style={s.successMetaItem}>📅 {date}</div>
              <div style={s.successMetaItem}>⏱ {selectedSlot?.startTime} – {selectedSlot?.endTime}</div>
              <div style={s.successMetaItem}>👨‍⚕️ {doctorName}</div>
            </div>
            <button onClick={() => navigate('/dashboard')} style={s.primaryBtn} id="go-to-dashboard-btn">
              Go to Dashboard →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Styles ─── */
const s = {
  page: {
    maxWidth: '560px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },

  /* Stepper */
  stepper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0',
    padding: '20px 0 8px',
  },
  stepperItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' },
  stepperDot: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.82rem',
    fontWeight: 800,
    transition: 'all 0.25s',
    zIndex: 1,
  },
  stepperLabel: { fontSize: '0.68rem', letterSpacing: '0.03em', textTransform: 'uppercase', transition: 'color 0.25s' },
  stepperLine: { flex: 1, height: 2, minWidth: '28px', maxWidth: '56px', borderRadius: '9999px', marginBottom: '18px', transition: 'background 0.25s' },

  card: {
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '24px',
    border: '1px solid rgba(30,138,132,0.1)',
    padding: '28px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },

  doctorStrip: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    background: 'rgba(30,138,132,0.05)',
    borderRadius: '14px',
    padding: '14px 18px',
    border: '1px solid rgba(30,138,132,0.1)',
  },
  docAvatar: {
    width: 44,
    height: 44,
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #1e8a84, #0a4f4b)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.1rem',
    fontWeight: 800,
    flexShrink: 0,
    boxShadow: '0 4px 12px rgba(30,138,132,0.3)',
  },
  docName: { fontWeight: 800, color: '#0a2e2b', fontSize: '0.95rem', fontFamily: "'Outfit', sans-serif" },
  docSub: { fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' },

  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#fee2e2',
    border: '1px solid rgba(220,38,38,0.15)',
    color: '#b91c1c',
    borderRadius: '10px',
    padding: '12px 14px',
    fontSize: '0.87rem',
  },

  timerWrap: { display: 'flex', flexDirection: 'column', gap: '6px' },
  timerTrack: { height: '4px', background: '#e5e7eb', borderRadius: '9999px', overflow: 'hidden' },
  timerFill: { height: '100%', borderRadius: '9999px', transition: 'width 1s linear, background 1s' },
  timerText: { fontSize: '0.8rem', fontWeight: 700, textAlign: 'center', letterSpacing: '0.02em' },

  stepForm: { display: 'flex', flexDirection: 'column', gap: '18px' },
  stepHeader2: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  stepTitle: { fontFamily: "'Outfit', sans-serif", fontSize: '1.25rem', fontWeight: 800, color: '#0a2e2b', letterSpacing: '-0.02em' },
  stepDesc: { fontSize: '0.88rem', color: '#6b7280', lineHeight: 1.6 },
  backLink: { background: 'transparent', border: 'none', color: '#1e8a84', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif", padding: '0' },

  dateInput: {
    padding: '13px 16px',
    borderRadius: '12px',
    border: '1.5px solid #e5e7eb',
    fontSize: '1rem',
    color: '#111827',
    background: '#f9fafb',
    outline: 'none',
    width: '100%',
    fontFamily: "'Inter', sans-serif",
    cursor: 'pointer',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },

  slotGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  slotBtn: {
    padding: '12px 6px',
    borderRadius: '12px',
    fontSize: '0.82rem',
    fontWeight: 700,
    cursor: 'pointer',
    border: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    transition: 'all 0.18s',
    fontFamily: "'Inter', sans-serif",
  },
  slotAvailable: {
    background: 'rgba(30,138,132,0.07)',
    border: '1.5px solid rgba(30,138,132,0.2)',
    color: '#0a4f4b',
  },
  slotUnavailable: {
    background: '#f3f4f6',
    border: '1.5px solid #e5e7eb',
    color: '#d1d5db',
    cursor: 'not-allowed',
  },
  slotTime: { fontSize: '0.9rem', fontWeight: 800 },
  slotEnd: { fontSize: '0.72rem', opacity: 0.7 },
  slotTaken: { fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.04em', color: '#9ca3af', textTransform: 'uppercase', marginTop: '2px' },

  unavailBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    textAlign: 'center',
    background: '#fef3c7',
    borderRadius: '16px',
    padding: '28px 24px',
    border: '1px solid rgba(245,158,11,0.2)',
  },
  unavailIcon: { fontSize: '2.5rem' },
  unavailTitle: { fontFamily: "'Outfit', sans-serif", fontSize: '1.1rem', fontWeight: 800, color: '#92400e' },
  unavailDesc: { fontSize: '0.87rem', color: '#b45309', lineHeight: 1.6, maxWidth: '320px' },

  textareaWrap: { position: 'relative' },
  textareaIcon: { position: 'absolute', top: '12px', left: '14px', fontSize: '1rem', pointerEvents: 'none' },
  textarea: {
    width: '100%',
    padding: '12px 16px 12px 40px',
    borderRadius: '12px',
    border: '1.5px solid #e5e7eb',
    fontSize: '0.9rem',
    color: '#111827',
    resize: 'vertical',
    minHeight: '96px',
    fontFamily: "'Inter', sans-serif",
    outline: 'none',
    background: '#f9fafb',
    lineHeight: 1.6,
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },

  reviewCard: {
    background: '#f9fafb',
    borderRadius: '14px',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
  },
  reviewRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 18px',
    gap: '12px',
  },
  reviewLabel: { fontSize: '0.82rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' },
  reviewVal: { fontSize: '0.92rem', fontWeight: 700, color: '#111827' },
  reviewDivider: { height: 1, background: '#e5e7eb', margin: '0' },

  calendarNote: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(30,138,132,0.05)',
    border: '1px solid rgba(30,138,132,0.12)',
    borderRadius: '10px',
    padding: '12px 14px',
    fontSize: '0.82rem',
    color: '#166f6a',
    fontWeight: 600,
  },

  primaryBtn: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #166f6a 0%, #0a4f4b 100%)',
    color: '#fff',
    borderRadius: '12px',
    fontSize: '0.95rem',
    fontWeight: 700,
    cursor: 'pointer',
    border: 'none',
    boxShadow: '0 6px 20px rgba(22,111,106,0.25)',
    fontFamily: "'Inter', sans-serif",
    transition: 'all 0.2s',
    letterSpacing: '-0.01em',
  },
  confirmBtn: {
    width: '100%',
    padding: '15px',
    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    color: '#fff',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: 800,
    cursor: 'pointer',
    border: 'none',
    boxShadow: '0 6px 20px rgba(5,150,105,0.3)',
    fontFamily: "'Inter', sans-serif",
    transition: 'all 0.2s',
    letterSpacing: '-0.01em',
  },
  secondaryBtn: {
    width: '100%',
    padding: '11px',
    background: 'transparent',
    color: '#6b7280',
    borderRadius: '10px',
    fontSize: '0.88rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: '1.5px solid #e5e7eb',
    fontFamily: "'Inter', sans-serif",
    transition: 'all 0.2s',
  },

  /* Success */
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    fontWeight: 800,
    boxShadow: '0 12px 32px rgba(5,150,105,0.35)',
    marginBottom: '8px',
  },
  successMeta: { display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' },
  successMetaItem: {
    background: '#f0fdf4',
    border: '1px solid rgba(16,185,129,0.15)',
    borderRadius: '10px',
    padding: '10px 16px',
    fontSize: '0.87rem',
    fontWeight: 600,
    color: '#065f46',
    textAlign: 'center',
  },

  /* AI notice box (quota / success) */
  aiNoticeBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    background: '#fef3c7',
    border: '1px solid rgba(245,158,11,0.2)',
    borderRadius: '14px',
    padding: '16px 18px',
    width: '100%',
    textAlign: 'left',
  },
  aiNoticeIcon: { fontSize: '1.4rem', lineHeight: 1, flexShrink: 0 },
  aiNoticeContent: { display: 'flex', flexDirection: 'column', gap: '4px' },
  aiNoticeTitle: { fontSize: '0.85rem', fontWeight: 800, color: '#92400e' },
  aiNoticeText: { fontSize: '0.82rem', color: '#b45309', lineHeight: 1.6, margin: 0 },
};


export default BookingFlow;
