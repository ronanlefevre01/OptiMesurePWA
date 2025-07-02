import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type SavedMeasurement = {
  id: string;
  timestamp: number;
  image: string;
  markerPositions: { x: number; y: number }[];
  results: {
    epg: number;
    epd: number;
    epTotal: number;
    hg: number;
    hd: number;
  };
  clientName?: string;
};

const MeasurementList = () => {
  const [measurements, setMeasurements] = useState<SavedMeasurement[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const data = localStorage.getItem('measurements');
    if (data) {
      setMeasurements(JSON.parse(data));
    }
  }, []);

  const handleDelete = (id: string) => {
    const updated = measurements.filter((m) => m.id !== id);
    setMeasurements(updated);
    localStorage.setItem('measurements', JSON.stringify(updated));
  };

  const handleEdit = (id: string) => {
    navigate(`/edit/${id}`);
  };

  const filtered = measurements.filter((m) =>
    (m.clientName || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.container}>
      <h2>📋 Mesures enregistrées</h2>
      <button
  onClick={() => navigate('/')}
  style={{
    position: 'absolute',
    top: 20,
    right: 20,
    padding: '8px 12px',
    backgroundColor: '#2196F3',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    zIndex: 10,
  }}
>
  🏠 Accueil
</button>


      <input
        type="text"
        placeholder="Rechercher par nom"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={styles.search}
      />

      {filtered.length === 0 ? (
        <p>Aucune mesure trouvée.</p>
      ) : (
        <ul style={styles.list}>
          {filtered.map((m) => (
            <li key={m.id} style={styles.item}>
              <div
                onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
                style={{ cursor: 'pointer' }}
              >
                <strong>{m.clientName || '(sans nom)'}</strong> –{' '}
                {new Date(m.timestamp).toLocaleString()}
              </div>

              {expandedId === m.id && (
                <div style={styles.details}>
                  <img
                    src={m.image}
                    alt="mesure"
                    style={styles.image}
                  />
                  <p>EPG : {m.results.epg} mm</p>
                  <p>EPD : {m.results.epd} mm</p>
                  <p>Écart total : {m.results.epTotal} mm</p>
                  <p>Hauteur gauche : {m.results.hg} mm</p>
                  <p>Hauteur droite : {m.results.hd} mm</p>

                  <div style={styles.buttonGroup}>
                    <button
                      style={styles.editButton}
                      onClick={() => handleEdit(m.id)}
                    >
                      ✏️ Modifier
                    </button>
                    <button
                      style={styles.deleteButton}
                      onClick={() => handleDelete(m.id)}
                    >
                      🗑 Supprimer
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: 20,
    backgroundColor: '#f7f7f7',
    height: '100vh',
  },
  search: {
    marginBottom: 20,
    padding: 8,
    fontSize: 16,
    width: '100%',
    maxWidth: 300,
  },
  list: {
    listStyle: 'none',
    padding: 0,
  },
  item: {
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  details: {
    marginTop: 10,
  },
  image: {
    maxWidth: 200,
    height: 'auto',
    display: 'block',
    marginBottom: 10,
    border: '1px solid #ccc',
    borderRadius: 4,
  },
  buttonGroup: {
    display: 'flex',
    gap: 10,
    marginTop: 10,
  },
  deleteButton: {
    padding: '6px 12px',
    backgroundColor: '#f44336',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
  },
  editButton: {
    padding: '6px 12px',
    backgroundColor: '#1976d2',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
  },
};

export default MeasurementList;
