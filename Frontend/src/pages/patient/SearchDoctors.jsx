import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as doctorService from '../../services/doctor.service';

const SearchDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [specialization, setSpecialization] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Load all doctors on mount to extract dynamic specializations
  useEffect(() => {
    const init = async () => {
      try {
        const res = await doctorService.getDoctors({});
        if (res.success) {
          const docs = res.data.doctors;
          setDoctors(docs);
          // Extract unique specializations from real data
          const unique = [...new Set(docs.map(d => d.specialization).filter(Boolean))].sort();
          setSpecializations(unique);
        }
      } catch { /* silent */ }
    };
    init();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await doctorService.getDoctors({ search, specialization });
      if (res.success) setDoctors(res.data.doctors);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  };

  // Re-fetch when specialization filter changes
  useEffect(() => {
    fetchDoctors();
  }, [specialization]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDoctors();
  };

  return (
    <div style={styles.container}>
      <h2>Find the right doctor</h2>
      <p style={styles.sub}>Browse available specialists and book your appointment.</p>

      <form onSubmit={handleSearchSubmit} style={styles.filterBar}>
        <input
          type="text"
          placeholder="Search by doctor name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
        <select
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
          style={styles.select}
        >
          <option value="">All Specializations</option>
          {specializations.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button type="submit" className="btn-primary" style={styles.searchBtn}>Search</button>
      </form>

      {loading ? (
        <div style={styles.grid}>
          {[1, 2].map(i => <div key={i} className="skeleton" style={styles.skeletonCard} />)}
        </div>
      ) : doctors.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: '#697776' }}>
          No doctors match your query.
        </div>
      ) : (
        <div style={styles.grid}>
          {doctors.map((doc) => (
            <div key={doc._id} className="card" style={styles.docCard}>
              <div style={styles.avatar}>{(doc.userId?.name || 'Dr')[0]}</div>
              <h3 style={styles.name}>{doc.userId?.name || 'Dr. Health Specialist'}</h3>
              <span style={styles.spec}>{doc.specialization}</span>
              <div style={styles.metaRow}>
                <span><strong>Exp:</strong> {doc.experience} yrs</span>
                <span><strong>Slot:</strong> {doc.slotDuration} min</span>
                <span><strong>Hours:</strong> {doc.workingHours?.start}–{doc.workingHours?.end}</span>
              </div>
              <p style={styles.qual}>{doc.qualification}</p>
              <button
                onClick={() => navigate(`/book?doctor=${doc._id}&name=${encodeURIComponent(doc.userId?.name || 'Doctor')}`)}
                className="btn-primary"
                style={styles.bookBtn}
              >
                Schedule Visit
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '20px' },
  sub: { color: '#697776', marginTop: '-15px' },
  filterBar: {
    display: 'flex', gap: '16px', backgroundColor: '#FFFFFF',
    padding: '16px', borderRadius: '10px',
    border: '1px solid rgba(47,111,109,0.1)', flexWrap: 'wrap',
  },
  searchInput: { flexGrow: 1, minWidth: '180px' },
  select: { width: '220px' },
  searchBtn: { padding: '10px 24px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' },
  docCard: { display: 'flex', flexDirection: 'column', gap: '10px' },
  avatar: {
    width: '48px', height: '48px', borderRadius: '50%',
    background: '#2F6F6D', color: '#fff', display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '1.2rem',
  },
  name: { fontSize: '1.1rem', color: '#263536', margin: 0 },
  spec: {
    fontSize: '0.82rem', color: '#2F6F6D', fontWeight: '600',
    background: '#EAF2F0', padding: '3px 8px', borderRadius: '4px', alignSelf: 'flex-start',
  },
  qual: { fontSize: '0.82rem', color: '#697776' },
  metaRow: { display: 'flex', gap: '12px', fontSize: '0.82rem', color: '#697776', flexWrap: 'wrap' },
  bookBtn: { marginTop: '8px', width: '100%' },
  skeletonCard: { height: '220px', borderRadius: '12px' },
};

export default SearchDoctors;
