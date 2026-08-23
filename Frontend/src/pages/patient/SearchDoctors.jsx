import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as doctorService from '../../services/doctor.service';

const SearchDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [specialization, setSpecialization] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await doctorService.getDoctors({
        search,
        specialization,
      });
      if (res.success) {
        setDoctors(res.data.doctors);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
      <p style={styles.sub}>Choose a specialist to book your slot hold reservation.</p>

      {/* Filters form */}
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
          <option value="Cardiology">Cardiology</option>
          <option value="Pediatrics">Pediatrics</option>
          <option value="Neurology">Neurology</option>
          <option value="General Medicine">General Medicine</option>
        </select>
        <button type="submit" className="btn-primary" style={styles.searchBtn}>
          Search
        </button>
      </form>

      {/* Doctor Listings Grid */}
      {loading ? (
        <div style={styles.skeletonContainer}>
          <div className="skeleton" style={styles.skeletonCard}></div>
          <div className="skeleton" style={styles.skeletonCard}></div>
        </div>
      ) : doctors.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: '#697776' }}>
          No doctors match your query parameters.
        </div>
      ) : (
        <div style={styles.grid}>
          {doctors.map((doc) => (
            <div key={doc._id} className="card" style={styles.docCard}>
              <h3 style={styles.name}>{doc.userId?.name || 'Dr. Health Specialist'}</h3>
              <p style={styles.spec}>{doc.specialization}</p>
              <div style={styles.metaRow}>
                <span><strong>Exp:</strong> {doc.experience} years</span>
                <span><strong>Slot:</strong> {doc.slotDuration} min</span>
              </div>
              <button
                onClick={() => navigate(`/book?doctor=${doc._id}&name=${doc.userId?.name}`)}
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
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  sub: {
    color: '#697776',
    marginTop: '-15px',
    marginBottom: '20px',
  },
  filterBar: {
    display: 'flex',
    gap: '16px',
    backgroundColor: '#FFFFFF',
    padding: '16px',
    borderRadius: '10px',
    border: '1px solid rgba(47, 111, 109, 0.1)',
    marginBottom: '20px',
  },
  searchInput: {
    flexGrow: 1,
  },
  select: {
    width: '240px',
  },
  searchBtn: {
    padding: '10px 24px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '24px',
  },
  docCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    transition: 'transform 0.2s',
  },
  name: {
    fontSize: '1.25rem',
    color: '#263536',
  },
  spec: {
    fontSize: '0.9rem',
    color: '#2F6F6D',
    fontWeight: '600',
    backgroundColor: '#EAF2F0',
    padding: '4px 8px',
    borderRadius: '4px',
    alignSelf: 'flex-start',
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
    color: '#697776',
    borderTop: '1px solid #F7F8F5',
    paddingTop: '12px',
    marginTop: '6px',
  },
  bookBtn: {
    marginTop: '12px',
    width: '100%',
  },
  skeletonContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  skeletonCard: {
    height: '180px',
  },
};

export default SearchDoctors;
