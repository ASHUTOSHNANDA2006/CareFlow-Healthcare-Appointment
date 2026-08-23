import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/* ─── Static feature data ─── */
const FEATURES = [
  {
    icon: '🧠',
    title: 'AI Pre-Visit Brief',
    desc: 'Gemini AI analyses your symptoms and delivers a structured brief to your doctor before you arrive.',
  },
  {
    icon: '📅',
    title: 'Real-Time Scheduling',
    desc: 'Live slot availability with 5-minute hold locks, doctor leave protection, and timezone-aware filtering.',
  },
  {
    icon: '💊',
    title: 'Smart Prescriptions',
    desc: 'Doctors manage prescriptions digitally. Patients receive a patient-friendly AI-generated summary.',
  },
  {
    icon: '🔔',
    title: 'Notifications',
    desc: 'Instant in-app and email alerts for booking confirmations, leave conflicts, and medication reminders.',
  },
  {
    icon: '📆',
    title: 'Google Calendar Sync',
    desc: 'Confirmed appointments automatically sync to your Google Calendar.',
  },
  {
    icon: '🛡️',
    title: 'Role-Based Security',
    desc: 'Separate, protected portals for Patients, Doctors, and Admins with JWT-blacklist logout.',
  },
];

const STEPS = [
  { num: '01', title: 'Describe Symptoms', desc: 'Tell us how you\'re feeling before booking so AI can prepare your brief.' },
  { num: '02', title: 'Find a Specialist', desc: 'Browse verified doctors filtered by specialization and experience.' },
  { num: '03', title: 'Hold & Confirm', desc: 'Reserve a slot with a 5-minute lock, then confirm your appointment.' },
  { num: '04', title: 'Doctor Reviews Brief', desc: 'Your clinician receives an AI-generated pre-visit report.' },
  { num: '05', title: 'Post-Visit Summary', desc: 'Get a clear, patient-friendly AI summary with your prescription.' },
];

const STATS = [
  { val: '5-min', label: 'Slot hold lock' },
  { val: 'AI', label: 'Pre & post-visit briefs' },
  { val: '3', label: 'Role-based portals' },
  { val: 'Live', label: 'Slot availability' },
];

/* ─── Component ─── */
const Landing = () => {
  const heroRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-up');
            entry.target.style.opacity = '1';
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.reveal').forEach((el) => {
      el.style.opacity = '0';
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div style={s.page}>
      {/* ── Ambient background blobs ── */}
      <div style={s.blobTop} aria-hidden="true" />
      <div style={s.blobMid} aria-hidden="true" />

      {/* ──────────── NAV ──────────── */}
      <header style={s.nav}>
        <div style={s.navInner}>
          <div style={s.logoGroup}>
            <div style={s.logoIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z"
                      fill="white" fillOpacity="0.95"/>
              </svg>
            </div>
            <div>
              <span style={s.logoText}>CareFlow</span>
              <span style={s.logoSub}>Healthcare Platform</span>
            </div>
          </div>

          <nav style={s.navLinks}>
            <a href="#how-it-works" style={s.navLink}>How it works</a>
            <a href="#features" style={s.navLink}>Features</a>
          </nav>

          <Link to="/auth" style={s.navCta}>
            Get Started →
          </Link>
        </div>
      </header>

      {/* ──────────── HERO ──────────── */}
      <main>
        <section style={s.hero} ref={heroRef}>
          <div style={s.heroContent}>
            <div style={s.heroBadge}>
              <span style={s.heroBadgeDot} />
              Powered by Google Gemini AI
            </div>

            <h1 style={s.heroTitle}>
              Healthcare,{' '}
              <span style={s.heroGradient}>prepared before</span>
              <br />you arrive.
            </h1>

            <p style={s.heroDesc}>
              CareFlow connects patients, doctors, and admins through an intelligent
              appointment platform — from symptom analysis to post-visit summaries.
            </p>

            <div style={s.heroActions}>
              <Link to="/auth" style={s.heroPrimary}>
                Book an Appointment
              </Link>
              <a href="#how-it-works" style={s.heroSecondary}>
                See how it works
              </a>
            </div>

            {/* Stats strip */}
            <div style={s.statsStrip}>
              {STATS.map((stat) => (
                <div key={stat.label} style={s.statItem}>
                  <span style={s.statVal}>{stat.val}</span>
                  <span style={s.statLabel}>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hero visual — floating AI card */}
          <div style={s.heroVisual}>
            <div style={s.heroCardOuter} className="animate-float">
              <div style={s.heroCard}>
                {/* Card header */}
                <div style={s.cardHeader}>
                  <div style={s.cardHeaderLeft}>
                    <div style={s.cardAvatar}>RS</div>
                    <div>
                      <div style={s.cardName}>Rahul Sharma</div>
                      <div style={s.cardSub}>Patient · New Appointment</div>
                    </div>
                  </div>
                  <span style={s.aiChip}>✦ AI BRIEF</span>
                </div>

                <div style={s.cardDivider} />

                {/* Urgency row */}
                <div style={s.cardRow}>
                  <span style={s.cardRowLabel}>Urgency</span>
                  <span style={{ ...s.urgencyBadge, background: '#fef3c7', color: '#d97706' }}>⚡ MEDIUM</span>
                </div>

                {/* Chief complaint */}
                <div style={s.cardRow}>
                  <span style={s.cardRowLabel}>Chief Complaint</span>
                  <span style={s.cardRowVal}>Persistent fever & fatigue</span>
                </div>

                {/* Key symptoms */}
                <div style={s.symptomsRow}>
                  {['Fever 38.5°C', 'Headache', 'Fatigue'].map((sym) => (
                    <span key={sym} style={s.symTag}>{sym}</span>
                  ))}
                </div>

                <div style={s.cardDivider} />

                {/* Questions */}
                <div style={s.questionsSection}>
                  <span style={s.questionsTitle}>Suggested Questions for Doctor</span>
                  {['How long has the fever persisted?', 'Any recent travel history?'].map((q, i) => (
                    <div key={i} style={s.question}>
                      <span style={s.questionNum}>{i + 1}</span>
                      <span style={s.questionText}>{q}</span>
                    </div>
                  ))}
                </div>

                <div style={s.cardFooter}>
                  <span style={s.footerText}>✓ AI-generated · Not a diagnosis</span>
                  <span style={s.footerSynced}>📅 Calendar synced</span>
                </div>
              </div>

              {/* Floating status pill */}
              <div style={s.floatingPill}>
                <span style={s.pillDot} />
                Appointment Confirmed
              </div>
            </div>
          </div>
        </section>

        {/* ──────────── HOW IT WORKS ──────────── */}
        <section id="how-it-works" style={s.section}>
          <div style={s.sectionInner}>
            <div className="reveal" style={s.sectionLabel}>HOW IT WORKS</div>
            <h2 className="reveal" style={s.sectionTitle}>Five steps to better care</h2>
            <p className="reveal" style={s.sectionDesc}>
              A seamless end-to-end workflow connecting every touchpoint of your healthcare journey.
            </p>

            <div style={s.stepsGrid}>
              {STEPS.map((step, i) => (
                <div key={step.num} className="reveal card" style={{ ...s.stepCard, animationDelay: `${i * 0.08}s` }}>
                  <span style={s.stepNum}>{step.num}</span>
                  <div style={s.stepConnector} />
                  <h4 style={s.stepTitle}>{step.title}</h4>
                  <p style={s.stepDesc}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ──────────── FEATURES ──────────── */}
        <section id="features" style={{ ...s.section, background: 'transparent' }}>
          <div style={s.sectionInner}>
            <div className="reveal" style={s.sectionLabel}>PLATFORM FEATURES</div>
            <h2 className="reveal" style={s.sectionTitle}>Everything you need. Nothing you don't.</h2>

            <div style={s.featuresGrid}>
              {FEATURES.map((f, i) => (
                <div key={f.title} className="reveal card" style={{ ...s.featureCard, animationDelay: `${i * 0.07}s` }}>
                  <div style={s.featureIcon}>{f.icon}</div>
                  <h4 style={s.featureTitle}>{f.title}</h4>
                  <p style={s.featureDesc}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ──────────── CTA BANNER ──────────── */}
        <section style={s.ctaBanner}>
          <div style={s.ctaBannerInner}>
            <div style={s.ctaBannerContent}>
              <h2 style={s.ctaTitle}>Ready to experience smarter healthcare?</h2>
              <p style={s.ctaDesc}>Join patients and doctors already using CareFlow for seamless appointments.</p>
              <Link to="/auth" style={s.ctaBtn}>
                Get Started — It's Free
              </Link>
            </div>
          </div>
        </section>

        {/* ──────────── FOOTER ──────────── */}
        <footer style={s.footer}>
          <div style={s.footerInner}>
            <div style={s.footerLogo}>
              <div style={{ ...s.logoIcon, width: 32, height: 32, fontSize: '0.9rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z" fill="white" fillOpacity="0.95"/>
                </svg>
              </div>
              <span style={{ ...s.logoText, fontSize: '1.1rem' }}>CareFlow</span>
            </div>
            <p style={s.footerNote}>Healthcare, prepared before you arrive.</p>
          </div>
        </footer>
      </main>
    </div>
  );
};

/* ─────────────────────────────────────────────
   STYLES (inline — no className conflicts)
───────────────────────────────────────────── */
const s = {
  page: {
    fontFamily: "'Inter', sans-serif",
    backgroundColor: '#f0f9f8',
    color: '#111827',
    minHeight: '100vh',
    overflowX: 'hidden',
    position: 'relative',
  },

  /* Ambient blobs */
  blobTop: {
    position: 'fixed',
    top: '-20%',
    right: '-10%',
    width: '700px',
    height: '700px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(30,138,132,0.10) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  blobMid: {
    position: 'fixed',
    bottom: '10%',
    left: '-15%',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(30,138,132,0.07) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 0,
  },

  /* ── Nav ── */
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: 'rgba(240, 249, 248, 0.85)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(30,138,132,0.1)',
  },
  navInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 32px',
    height: '68px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '24px',
  },
  logoGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #166f6a 0%, #0a4f4b 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 16px rgba(22,111,106,0.3)',
    flexShrink: 0,
  },
  logoText: {
    fontFamily: "'Outfit', sans-serif",
    fontWeight: 800,
    fontSize: '1.3rem',
    color: '#0a2e2b',
    letterSpacing: '-0.03em',
    display: 'block',
    lineHeight: 1.1,
  },
  logoSub: {
    fontSize: '0.7rem',
    color: '#6b7280',
    fontWeight: 500,
    display: 'block',
    letterSpacing: '0.03em',
  },
  navLinks: {
    display: 'flex',
    gap: '32px',
    flex: 1,
    justifyContent: 'center',
  },
  navLink: {
    fontSize: '0.9rem',
    fontWeight: 500,
    color: '#374151',
    transition: 'color 0.2s',
  },
  navCta: {
    padding: '9px 22px',
    background: 'linear-gradient(135deg, #166f6a 0%, #0a4f4b 100%)',
    color: '#fff',
    borderRadius: '10px',
    fontWeight: 600,
    fontSize: '0.88rem',
    boxShadow: '0 4px 14px rgba(22,111,106,0.3)',
    transition: 'all 0.2s',
    flexShrink: 0,
  },

  /* ── Hero ── */
  hero: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '80px 32px 100px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '64px',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  heroContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '28px',
  },
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(30,138,132,0.08)',
    border: '1px solid rgba(30,138,132,0.2)',
    color: '#166f6a',
    padding: '6px 14px',
    borderRadius: '9999px',
    fontSize: '0.8rem',
    fontWeight: 600,
    width: 'fit-content',
    letterSpacing: '0.02em',
  },
  heroBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#1e8a84',
    animation: 'pulse-ring 2s infinite',
    flexShrink: 0,
  },
  heroTitle: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: 'clamp(2.6rem, 5vw, 3.8rem)',
    fontWeight: 800,
    lineHeight: 1.1,
    color: '#0a2e2b',
    letterSpacing: '-0.04em',
  },
  heroGradient: {
    background: 'linear-gradient(135deg, #1e8a84 0%, #2fa89f 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  heroDesc: {
    fontSize: '1.1rem',
    lineHeight: 1.7,
    color: '#4b5563',
    maxWidth: '480px',
  },
  heroActions: {
    display: 'flex',
    gap: '14px',
    flexWrap: 'wrap',
  },
  heroPrimary: {
    padding: '14px 28px',
    background: 'linear-gradient(135deg, #166f6a 0%, #0a4f4b 100%)',
    color: '#fff',
    borderRadius: '12px',
    fontWeight: 700,
    fontSize: '0.95rem',
    boxShadow: '0 8px 28px rgba(22,111,106,0.32)',
    transition: 'all 0.25s',
    letterSpacing: '-0.01em',
  },
  heroSecondary: {
    padding: '14px 28px',
    background: 'rgba(255,255,255,0.8)',
    color: '#166f6a',
    borderRadius: '12px',
    fontWeight: 600,
    fontSize: '0.95rem',
    border: '1.5px solid rgba(30,138,132,0.2)',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.25s',
  },

  /* Stats strip */
  statsStrip: {
    display: 'flex',
    gap: '28px',
    paddingTop: '8px',
    flexWrap: 'wrap',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  statVal: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#0a2e2b',
    lineHeight: 1,
    letterSpacing: '-0.03em',
  },
  statLabel: {
    fontSize: '0.78rem',
    color: '#6b7280',
    fontWeight: 500,
    letterSpacing: '0.02em',
  },

  /* ── Hero Card ── */
  heroVisual: {
    display: 'flex',
    justifyContent: 'center',
    position: 'relative',
  },
  heroCardOuter: {
    position: 'relative',
    width: '100%',
    maxWidth: '400px',
  },
  heroCard: {
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(28px)',
    WebkitBackdropFilter: 'blur(28px)',
    borderRadius: '22px',
    border: '1px solid rgba(30,138,132,0.15)',
    padding: '28px',
    boxShadow: '0 24px 80px rgba(0,0,0,0.12), 0 8px 32px rgba(30,138,132,0.1)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  cardHeaderLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  cardAvatar: {
    width: 42,
    height: 42,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #1e8a84, #0a4f4b)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.85rem',
    fontWeight: 700,
    flexShrink: 0,
    boxShadow: '0 4px 12px rgba(30,138,132,0.3)',
  },
  cardName: { fontWeight: 700, fontSize: '0.95rem', color: '#111827', lineHeight: 1.2 },
  cardSub: { fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' },
  aiChip: {
    fontSize: '0.7rem',
    fontWeight: 700,
    color: '#166f6a',
    background: 'linear-gradient(135deg, rgba(30,138,132,0.12), rgba(30,138,132,0.06))',
    border: '1px solid rgba(30,138,132,0.2)',
    padding: '4px 9px',
    borderRadius: '9999px',
    letterSpacing: '0.06em',
  },
  cardDivider: { height: 1, background: 'rgba(30,138,132,0.1)', margin: '14px 0' },
  cardRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  cardRowLabel: { fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' },
  cardRowVal: { fontSize: '0.87rem', fontWeight: 600, color: '#111827' },
  urgencyBadge: {
    fontSize: '0.75rem',
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: '9999px',
    letterSpacing: '0.04em',
  },
  symptomsRow: { display: 'flex', gap: '7px', flexWrap: 'wrap', marginBottom: '6px' },
  symTag: {
    fontSize: '0.75rem',
    fontWeight: 600,
    padding: '3px 9px',
    borderRadius: '9999px',
    background: 'rgba(30,138,132,0.08)',
    color: '#166f6a',
    border: '1px solid rgba(30,138,132,0.15)',
  },
  questionsSection: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' },
  questionsTitle: { fontSize: '0.78rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' },
  question: { display: 'flex', gap: '10px', alignItems: 'flex-start' },
  questionNum: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: 'rgba(30,138,132,0.1)',
    color: '#166f6a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.7rem',
    fontWeight: 700,
    flexShrink: 0,
    marginTop: '1px',
  },
  questionText: { fontSize: '0.82rem', color: '#374151', lineHeight: 1.4 },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  footerText: { fontSize: '0.73rem', color: '#9ca3af' },
  footerSynced: { fontSize: '0.73rem', color: '#166f6a', fontWeight: 600 },

  /* Floating pill */
  floatingPill: {
    position: 'absolute',
    bottom: '-18px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'linear-gradient(135deg, #166f6a, #0a4f4b)',
    color: '#fff',
    padding: '8px 20px',
    borderRadius: '9999px',
    fontSize: '0.8rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 8px 24px rgba(22,111,106,0.4)',
    whiteSpace: 'nowrap',
    letterSpacing: '0.01em',
  },
  pillDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#6ee7b7',
    flexShrink: 0,
  },

  /* ── Sections ── */
  section: {
    padding: '100px 32px',
    background: 'transparent',
    position: 'relative',
    zIndex: 1,
  },
  sectionInner: { maxWidth: '1200px', margin: '0 auto' },
  sectionLabel: {
    fontSize: '0.75rem',
    fontWeight: 800,
    letterSpacing: '0.14em',
    color: '#1e8a84',
    textTransform: 'uppercase',
    marginBottom: '12px',
  },
  sectionTitle: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: 'clamp(1.9rem, 3.5vw, 2.6rem)',
    fontWeight: 800,
    color: '#0a2e2b',
    letterSpacing: '-0.03em',
    marginBottom: '16px',
    maxWidth: '600px',
  },
  sectionDesc: {
    fontSize: '1.05rem',
    color: '#4b5563',
    maxWidth: '560px',
    marginBottom: '56px',
    lineHeight: 1.7,
  },

  /* Steps grid */
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '20px',
  },
  stepCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '26px 22px',
    borderRadius: '18px',
    background: 'rgba(255,255,255,0.8)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(30,138,132,0.1)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
    transition: 'transform 0.25s, box-shadow 0.25s',
    cursor: 'default',
  },
  stepNum: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: '2rem',
    fontWeight: 800,
    color: 'rgba(30,138,132,0.2)',
    lineHeight: 1,
    letterSpacing: '-0.04em',
  },
  stepConnector: { width: '32px', height: '2px', background: 'rgba(30,138,132,0.2)', borderRadius: '9999px' },
  stepTitle: { fontSize: '0.95rem', fontWeight: 700, color: '#0a2e2b', marginTop: '4px' },
  stepDesc: { fontSize: '0.83rem', color: '#6b7280', lineHeight: 1.5 },

  /* Features grid */
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '24px',
  },
  featureCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '30px 26px',
    borderRadius: '20px',
    background: 'rgba(255,255,255,0.75)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(30,138,132,0.1)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
    transition: 'transform 0.25s, box-shadow 0.25s',
  },
  featureIcon: { fontSize: '2rem', lineHeight: 1 },
  featureTitle: { fontSize: '1.05rem', fontWeight: 700, color: '#0a2e2b' },
  featureDesc: { fontSize: '0.88rem', color: '#6b7280', lineHeight: 1.6 },

  /* CTA banner */
  ctaBanner: {
    padding: '0 32px 80px',
    position: 'relative',
    zIndex: 1,
  },
  ctaBannerInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    background: 'linear-gradient(135deg, #0a2e2b 0%, #134e4a 50%, #0a4f4b 100%)',
    borderRadius: '28px',
    padding: '72px 60px',
    boxShadow: '0 24px 80px rgba(10,46,43,0.35)',
    position: 'relative',
    overflow: 'hidden',
  },
  ctaBannerContent: { position: 'relative', zIndex: 1, textAlign: 'center' },
  ctaTitle: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: 'clamp(1.8rem, 3vw, 2.4rem)',
    fontWeight: 800,
    color: '#fff',
    marginBottom: '16px',
    letterSpacing: '-0.03em',
  },
  ctaDesc: {
    fontSize: '1.05rem',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: '36px',
    lineHeight: 1.6,
  },
  ctaBtn: {
    display: 'inline-flex',
    padding: '15px 36px',
    background: 'linear-gradient(135deg, #2fa89f, #1e8a84)',
    color: '#fff',
    borderRadius: '14px',
    fontWeight: 700,
    fontSize: '1rem',
    boxShadow: '0 8px 32px rgba(47,168,159,0.4)',
    transition: 'all 0.25s',
    letterSpacing: '-0.01em',
  },

  /* Footer */
  footer: {
    borderTop: '1px solid rgba(30,138,132,0.1)',
    padding: '32px',
    position: 'relative',
    zIndex: 1,
  },
  footerInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLogo: { display: 'flex', alignItems: 'center', gap: '10px' },
  footerNote: { fontSize: '0.85rem', color: '#9ca3af' },
};

export default Landing;
