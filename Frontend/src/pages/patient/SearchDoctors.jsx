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

  useEffect(() => { fetchDoctors(); }, [specialization]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDoctors();
  };

  const getInitials = (name = '') =>
    name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'DR';

  const SPEC_COLORS = ['#0a4f4b', '#1e3a8a', '#7c3aed', '#b45309', '#0f766e', '#9d174d'];
  const specColor = (spec) => SPEC_COLORS[(spec?.charCodeAt(0) ?? 0) % SPEC_COLORS.length];

  return (
    <div style={s.container}>
      {/* ── Page header ── */}
      <div style={s.pageHeader}>
        <div>
          <h2 style={s.pageTitle}>Find a Specialist</h2>
          <p style={s.pageSub}>Browse qualified doctors and book your consultation.</p>
        </div>
      </div>

      {/* ── Search bar ── */}
      <form onSubmit={handleSearchSubmit} style={s.searchBar}>
        <div style={s.searchInputWrap}>
          <span style={s.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search by doctor name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={s.searchInput}
            id="doctor-search-input"
          />
        </div>
        <select
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
          style={s.select}
          id="spec-filter-select"
        >
          <option value="">All Specializations</option>
          {specializations.map(sp => (
            <option key={sp} value={sp}>{sp}</option>
          ))}
        </select>
        <button type="submit" style={s.searchBtn} id="doctor-search-btn">
          Search
        </button>
      </form>

      {/* ── Results count ── */}
      {!loading && (
        <div style={s.resultsBar}>
          <span style={s.resultsCount}>
            {doctors.length} {doctors.length === 1 ? 'doctor' : 'doctors'} found
            {specialization ? ` · ${specialization}` : ''}
          </span>
        </div>
      )}

      {/* ── Grid ── */}
      {loading ? (
        <div style={s.grid}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={s.skeletonCard} className="skeleton" />
          ))}
        </div>
      ) : doctors.length === 0 ? (
        <div style={s.emptyState}>
          <div style={s.emptyIcon}>🔍</div>
          <h3 style={s.emptyTitle}>No doctors match your query</h3>
          <p style={s.emptyDesc}>Try adjusting your search or clearing the specialization filter.</p>
          <button style={s.clearBtn} onClick={() => { setSearch(''); setSpecialization(''); }}>
            Clear Filters
          </button>
        </div>
      ) : (
        <div style={s.grid}>
          {doctors.map((doc) => {
            const docName = doc.userId?.name || 'Dr. Specialist';
            const color = specColor(doc.specialization);
            return (
              <div key={doc._id} style={s.docCard}>
                {/* Card header accent */}
                <div style={{ ...s.cardAccent, background: color }} />

                {/* Avatar + name */}
                <div style={s.docTop}>
                  <div style={{ ...s.docAvatar, background: color }}>
                    {getInitials(docName)}
                  </div>
                  <div style={s.docInfo}>
                    <h3 style={s.docName}>{docName}</h3>
                    <span style={{ ...s.specBadge, background: `${color}18`, color }}>
                      {doc.specialization}
                    </span>
                  </div>
                </div>

                {/* Meta chips */}
                <div style={s.metaChips}>
                  <div style={s.metaChip}>
                    <span style={s.metaChipIcon}>🎓</span>
                    <span style={s.metaChipText}>{doc.qualification}</span>
                  </div>
                  <div style={s.metaChipRow}>
                    <div style={s.metaSmall}>
                      <span style={s.metaSmallIcon}>⚡</span>
                      <span>{doc.experience} yrs exp</span>
                    </div>
                    <div style={s.metaSmall}>
                      <span style={s.metaSmallIcon}>⏱</span>
                      <span>{doc.slotDuration} min slots</span>
                    </div>
                    <div style={s.metaSmall}>
                      <span style={s.metaSmallIcon}>🕐</span>
                      <span>{doc.workingHours?.start}–{doc.workingHours?.end}</span>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <button
                  style={s.bookBtn}
                  onClick={() => navigate(`/book?doctor=${doc._id}&name=${encodeURIComponent(docName)}`)}
                  id={`book-btn-${doc._id}`}
                >
                  Schedule Visit →
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ─── Styles ─── */
const s = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px' },

  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  pageTitle: { fontFamily: "'Outfit', sans-serif", fontSize: '1.75rem', fontWeight: 800, color: '#0a2e2b', letterSpacing: '-0.03em' },
  pageSub: { fontSize: '0.9rem', color: '#6b7280', marginTop: '4px' },

  searchBar: {
    display: 'flex',
    gap: '12px',
    background: 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    padding: '16px',
    borderRadius: '16px',
    border: '1px solid rgba(30,138,132,0.1)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchInputWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: 1,
    minWidth: '200px',
    background: '#f9fafb',
    borderRadius: '10px',
    border: '1.5px solid #e5e7eb',
    padding: '0 14px',
  },
  searchIcon: { fontSize: '0.9rem', flexShrink: 0 },
  searchInput: {
    border: 'none',
    background: 'transparent',
    padding: '10px 0',
    fontSize: '0.9rem',
    color: '#111827',
    outline: 'none',
    width: '100%',
    fontFamily: "'Inter', sans-serif",
  },
  select: {
    padding: '10px 36px 10px 14px',
    borderRadius: '10px',
    border: '1.5px solid #e5e7eb',
    background: '#f9fafb',
    fontSize: '0.88rem',
    color: '#374151',
    cursor: 'pointer',
    minWidth: '200px',
    fontFamily: "'Inter', sans-serif",
    outline: 'none',
    WebkitAppearance: 'none',
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")",
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    backgroundSize: '16px',
  },
  searchBtn: {
    padding: '10px 24px',
    background: 'linear-gradient(135deg, #166f6a, #0a4f4b)',
    color: '#fff',
    borderRadius: '10px',
    fontWeight: 700,
    fontSize: '0.9rem',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(22,111,106,0.25)',
    fontFamily: "'Inter', sans-serif",
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
  },

  resultsBar: { display: 'flex', alignItems: 'center' },
  resultsCount: { fontSize: '0.82rem', color: '#9ca3af', fontWeight: 600 },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  skeletonCard: { height: '240px', borderRadius: '18px' },

  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '60px 32px', textAlign: 'center' },
  emptyIcon: { fontSize: '3rem' },
  emptyTitle: { fontFamily: "'Outfit', sans-serif", fontSize: '1.2rem', fontWeight: 800, color: '#0a2e2b' },
  emptyDesc: { fontSize: '0.9rem', color: '#9ca3af', maxWidth: '300px' },
  clearBtn: {
    padding: '10px 24px',
    background: 'linear-gradient(135deg, #166f6a, #0a4f4b)',
    color: '#fff',
    borderRadius: '10px',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    marginTop: '8px',
  },

  docCard: {
    background: 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '20px',
    border: '1px solid rgba(30,138,132,0.08)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
    position: 'relative',
    overflow: 'hidden',
    transition: 'transform 0.25s, box-shadow 0.25s',
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    borderRadius: '20px 20px 0 0',
  },

  docTop: { display: 'flex', alignItems: 'center', gap: '14px' },
  docAvatar: {
    width: 52,
    height: 52,
    borderRadius: '14px',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
    fontWeight: 800,
    flexShrink: 0,
    boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
    letterSpacing: '0.05em',
  },
  docInfo: { display: 'flex', flexDirection: 'column', gap: '5px', minWidth: 0 },
  docName: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: '1rem',
    fontWeight: 800,
    color: '#0a2e2b',
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  specBadge: {
    fontSize: '0.72rem',
    fontWeight: 800,
    padding: '3px 9px',
    borderRadius: '9999px',
    alignSelf: 'flex-start',
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
  },

  metaChips: { display: 'flex', flexDirection: 'column', gap: '8px' },
  metaChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#f9fafb',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '0.82rem',
    color: '#374151',
  },
  metaChipIcon: { fontSize: '0.85rem' },
  metaChipText: { fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  metaChipRow: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  metaSmall: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    background: '#f3f4f6',
    borderRadius: '6px',
    padding: '5px 8px',
    fontSize: '0.75rem',
    color: '#6b7280',
    fontWeight: 500,
  },
  metaSmallIcon: { fontSize: '0.78rem' },

  bookBtn: {
    width: '100%',
    padding: '12px',
    background: 'linear-gradient(135deg, #166f6a, #0a4f4b)',
    color: '#fff',
    borderRadius: '12px',
    fontWeight: 700,
    fontSize: '0.9rem',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 6px 18px rgba(22,111,106,0.22)',
    fontFamily: "'Inter', sans-serif",
    transition: 'all 0.2s',
    marginTop: 'auto',
  },
};

export default SearchDoctors;
