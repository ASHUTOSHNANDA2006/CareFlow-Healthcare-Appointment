import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logoSection}>
          <h1 style={styles.logo}>CARE<br />FLOW</h1>
          <span style={styles.tagline}>Healthcare, prepared before you arrive.</span>
        </div>
        <div>
          <Link to="/auth" style={styles.loginBtn}>
            Get Started
          </Link>
        </div>
      </header>

      <main style={styles.heroSection}>
        <div style={styles.heroContent}>
          <h2 style={styles.heroTitle}>Healthcare,<br />prepared before you arrive.</h2>
          <p style={styles.heroSub}>
            From symptoms and scheduling to doctor preparation and follow-up, CareFlow keeps every appointment connected.
          </p>
          <div style={styles.ctaGroup}>
            <Link to="/auth" style={styles.ctaPrimary}>
              Book an appointment
            </Link>
            <a href="#how-it-works" style={styles.ctaSecondary}>
              See how it works
            </a>
          </div>
        </div>

        <div style={styles.heroVisual}>
          <div style={styles.visualCard}>
            <span style={styles.visualBadge}>AI PRE-VISIT BRIEF</span>
            <h4 style={styles.visualPatient}>Rahul Sharma (Patient)</h4>
            <div style={styles.visualSection}>
              <strong>Urgency:</strong> <span style={{ color: '#D6A85C', fontWeight: 'bold' }}>MEDIUM</span>
            </div>
            <div style={styles.visualSection}>
              <strong>Key Symptoms:</strong> Fever, headache, fatigue
            </div>
            <div style={styles.visualSection}>
              <strong>Suggested Questions:</strong>
              <ul style={styles.list}>
                <li>How long has the fever persisted?</li>
                <li>What was the highest recorded temperature?</li>
              </ul>
            </div>
            <p style={styles.disclaimer}>AI-generated support · Not a diagnosis</p>
          </div>
        </div>
      </main>

      <section id="how-it-works" style={styles.howItWorks}>
        <h3 style={styles.sectionTitle}>How CareFlow Works</h3>
        <div style={styles.stepsGrid}>
          <div style={styles.stepCard}>
            <span style={styles.stepNum}>01</span>
            <h4>Tell us how you feel</h4>
            <p>Describe your symptoms before booking to initialize the brief generator.</p>
          </div>
          <div style={styles.stepCard}>
            <span style={styles.stepNum}>02</span>
            <h4>Find the right doctor</h4>
            <p>Search qualified specialists based on your health preferences.</p>
          </div>
          <div style={styles.stepCard}>
            <span style={styles.stepNum}>03</span>
            <h4>Prepare with AI</h4>
            <p>Your clinician gets an AI preparation brief before you walk in.</p>
          </div>
          <div style={styles.stepCard}>
            <span style={styles.stepNum}>04</span>
            <h4>Attend appointment</h4>
            <p>Focus on your consultation with a doctor already briefed on your details.</p>
          </div>
          <div style={styles.stepCard}>
            <span style={styles.stepNum}>05</span>
            <h4>Follow-up</h4>
            <p>Get simple summaries, reminders, and calendar sync updates.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: '"Inter", sans-serif',
    backgroundColor: '#F7F8F5',
    color: '#263536',
    minHeight: '100vh',
    padding: '0 40px 80px 40px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '30px 0',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  logoSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  logo: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#2F6F6D',
    lineHeight: '1',
    letterSpacing: '0.05em',
  },
  tagline: {
    fontSize: '0.85rem',
    color: '#697776',
    marginTop: '6px',
  },
  loginBtn: {
    padding: '10px 24px',
    backgroundColor: '#2F6F6D',
    color: '#FFFFFF',
    borderRadius: '10px',
    fontWeight: '500',
  },
  heroSection: {
    maxWidth: '1200px',
    margin: '60px auto',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '80px',
    alignItems: 'center',
  },
  heroContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  heroTitle: {
    fontSize: '3.5rem',
    fontWeight: '700',
    color: '#263536',
    lineHeight: '1.15',
  },
  heroSub: {
    fontSize: '1.15rem',
    color: '#697776',
    lineHeight: '1.6',
  },
  ctaGroup: {
    display: 'flex',
    gap: '16px',
    marginTop: '12px',
  },
  ctaPrimary: {
    padding: '14px 28px',
    backgroundColor: '#2F6F6D',
    color: '#FFFFFF',
    borderRadius: '10px',
    fontWeight: '500',
  },
  ctaSecondary: {
    padding: '14px 28px',
    backgroundColor: 'transparent',
    color: '#2F6F6D',
    border: '1px solid rgba(47, 111, 109, 0.2)',
    borderRadius: '10px',
    fontWeight: '500',
    textAlign: 'center',
  },
  heroVisual: {
    display: 'flex',
    justifyContent: 'center',
  },
  visualCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid rgba(47, 111, 109, 0.1)',
    borderRadius: '18px',
    padding: '30px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.02)',
  },
  visualBadge: {
    display: 'inline-block',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#2F6F6D',
    backgroundColor: '#EAF2F0',
    padding: '4px 8px',
    borderRadius: '4px',
    marginBottom: '16px',
  },
  visualPatient: {
    marginBottom: '16px',
  },
  visualSection: {
    fontSize: '0.9rem',
    color: '#697776',
    marginBottom: '12px',
  },
  list: {
    paddingLeft: '20px',
    marginTop: '6px',
  },
  disclaimer: {
    fontSize: '0.75rem',
    color: '#697776',
    borderTop: '1px solid #F7F8F5',
    paddingTop: '12px',
    marginTop: '20px',
    textAlign: 'center',
  },
  howItWorks: {
    maxWidth: '1200px',
    margin: '100px auto 0 auto',
    borderTop: '1px solid rgba(47, 111, 109, 0.1)',
    paddingTop: '60px',
  },
  sectionTitle: {
    fontSize: '2rem',
    textAlign: 'center',
    marginBottom: '48px',
  },
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '24px',
  },
  stepCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid rgba(47, 111, 109, 0.05)',
    borderRadius: '14px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  stepNum: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#A8C8BE',
    lineHeight: '1',
  },
};

export default Landing;
