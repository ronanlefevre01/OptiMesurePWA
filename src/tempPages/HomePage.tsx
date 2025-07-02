import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLicence } from '../licence/useLicence';

const HomePage = () => {
  const navigate = useNavigate();
  const { licence } = useLicence();

  return (
    <div style={styles.container}>
      {/* Logo ajouté ici */}
      <img src="/logo.PNG" alt="Logo OptiMesure" style={styles.logo} />

      <h1 style={styles.title}>
  Bienvenue sur OptiMesure
  <img src="/mascotte.png" alt="Mascotte OptiMesure" style={styles.mascotte} />
</h1>

      <button style={styles.button} onClick={() => navigate('/measure')}>
        📸 Prendre une mesure
      </button>
      <button style={styles.button} onClick={() => navigate('/custom')}>
        📏 Prendre une mesure personnalisée
      </button>
      <button style={styles.button} onClick={() => navigate('/measures')}>
        📂 Voir les mesures enregistrées
      </button>
   
   {/* Infos licence en bas */}
      {licence && (
        <div style={styles.licenceInfo}>
          <p><strong>Licence :</strong> {licence.nom}</p>
          <p><strong>Expire le :</strong> {licence.dateExpiration}</p>
          <p><strong>Modules activés :</strong> {[
            licence.moduleAvance ? 'Mode avancé' : null,
            licence.moduleVideo ? 'Vidéo' : null,
            licence.moduleProfil ? 'Profil' : null,
            licence.moduleIA ? 'IA' : null,
          ].filter(Boolean).join(', ') || 'Aucun'}</p>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    height: '100dvh',
    overflow: 'hidden',
    backgroundColor: '#000',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    textAlign: 'center',
    padding: 20,
    boxSizing: 'border-box',
    border: '2px solid red'
  },
  mascotte: {
  width: 40,
  height: 40,
  marginLeft: 10,
  verticalAlign: 'middle',
},
  logo: {
    width: '90vw',
    maxWidth: 400,
    height: 'auto',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    marginBottom: 40,
  },
  button: {
    fontSize: 18,
    padding: '12px 24px',
    backgroundColor: '#2196F3',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
};

export default HomePage;
