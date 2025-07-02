import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DraggableMarker from '../components/DraggableMarker';
import CornerMarker from '../components/CornerMarker';

type SavedMeasurement = {
  id: string;
  timestamp: number;
  image: string;
  markerPositions: { x: number; y: number }[];
  results: { epg: number; epd: number; epTotal: number; hg: number; hd: number };
  clientName?: string;
};

const EditMeasurementPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const imageRef = useRef<HTMLImageElement>(null);

  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [markerPositions, setMarkerPositions] = useState<{ x: number; y: number }[]>([]);
  const [results, setResults] = useState<SavedMeasurement["results"] | null>(null);
  const [clientName, setClientName] = useState('');

  useEffect(() => {
  const stored = JSON.parse(localStorage.getItem("measurements") || "[]") as SavedMeasurement[];
  const current = stored.find(m => m.id === id);

  if (current) {
    const image = current.image;
    const results = current.results;
    const clientName = current.clientName || "";

    if (current) {
  const corrected = current.markerPositions.map(pos => ({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  }));
  setMarkerPositions(corrected);
}


    // Si des positions sont enregistrées, les utiliser en les corrigeant
    let markerPositions = current.markerPositions;

    if (!markerPositions || markerPositions.length !== 7) {
      // Valeur par défaut : centre de l’écran (7 repères)
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      markerPositions = Array.from({ length: 7 }, () => ({ x: centerX, y: centerY }));
    } else {
      // Corriger les positions extrêmes pour éviter hors écran
      markerPositions = markerPositions.map(pos => ({
        x: Math.min(Math.max(pos.x, 20), window.innerWidth - 20),
        y: Math.min(Math.max(pos.y, 20), window.innerHeight - 20),
      }));
    }

    setScreenshot(image);
    setMarkerPositions(markerPositions);
    setResults(results);
    setClientName(clientName);
  }
}, [id]);



  const updateMarkerPosition = (index: number, _: any, data: { x: number; y: number }) => {
  const updated = [...markerPositions];
  updated[index] = { x: data.x, y: data.y };
  setMarkerPositions(updated);
};


  const calculateResults = () => {
    const [redL, redR, whiteL, whiteR, yellowL, yellowR, whiteC] = markerPositions;

    const dx = whiteR.x - whiteL.x;
    const dy = whiteR.y - whiteL.y;
    const dist2D = Math.sqrt(dx * dx + dy * dy);

    const dxc = whiteC.x - whiteL.x;
    const dyc = whiteC.y - whiteL.y;
    const dist2D_central = Math.sqrt(dxc * dxc + dyc * dyc);

    const baseRealMm = 110;
    const avancePlotC_mm = 35;
    const baseCentral_mm = 55;
    const dist3D_central = Math.sqrt(avancePlotC_mm ** 2 + baseCentral_mm ** 2);

    const pxPerMm1 = dist2D / baseRealMm;
    const pxPerMm2 = dist2D_central / dist3D_central;
    const pxPerMm = (pxPerMm1 + pxPerMm2) / 2;

    const centreGauche = yellowL.x;
  const centreDroit = yellowR.x + 220;
  const centreMonture = (centreGauche + centreDroit) / 2;

    const distanceVerreOeil = 12;
    const facteurCorrection = 1 + distanceVerreOeil / 1000;

    const epg = Math.abs((redL.x + 16) - centreMonture) / pxPerMm;
    const epd = Math.abs((redR.x + 16) - centreMonture) / pxPerMm;
    const epTotal = (epg + epd) * facteurCorrection;

    const hg = Math.abs(redL.y - yellowL.y) / pxPerMm;
    const hd = Math.abs(redR.y - yellowR.y) / pxPerMm;

    setResults({
      epg: +epg.toFixed(1),
      epd: +epd.toFixed(1),
      epTotal: +epTotal.toFixed(1),
      hg: +hg.toFixed(1),
      hd: +hd.toFixed(1),
    });
  };

  const saveUpdatedMeasurement = () => {
    const all = JSON.parse(localStorage.getItem("measurements") || "[]") as SavedMeasurement[];
    const updated = all.map(m => m.id === id ? ({
      ...m,
      markerPositions,
      clientName,
      results: results!,
    }) : m);
    localStorage.setItem("measurements", JSON.stringify(updated));
    alert("Mesure mise à jour !");
    navigate("/measures");
  };

  if (!screenshot) return <p>Chargement…</p>;

  const repCentre = markerPositions[6];
const repGauche = markerPositions[4];
const repDroit = markerPositions[5];

const correctionRotation = repCentre && repGauche && repDroit
  ? ((repGauche.x + repDroit.x) / 2 + 10) // +10 pour l’offset visuel du repère droit
  : 0;

const centreMonture = correctionRotation;


  return (
    <div style={styles.wrapper}>
  <div style={styles.imageContainer}>
      <img ref={imageRef} src={screenshot} alt="Mesure" style={styles.fullImage} />

      {markerPositions.map((pos, i) =>
        i < 2 ? (
          <DraggableMarker
            key={i}
            index={i}
            position={pos}
            color="white"
            isOffset
            onDrag={updateMarkerPosition}
          />
        ) : i < 4 || i === 6 ? (
          <DraggableMarker
            key={i}
            index={i}
            position={pos}
            color="black"
            onDrag={updateMarkerPosition}
          />
        ) : (
          <CornerMarker
            key={i}
            index={i}
            position={pos}
            side={i === 4 ? 'left' : 'right'}
            onDrag={updateMarkerPosition}
            sizeMultiplier={3}
          />
        )
      )}

      {/* Trait centre monture rouge */}
      <div style={{
        position: 'absolute',
        left: `${centreMonture}px`,
        top: 0,
        height: '100%',
        width: '2px',
        backgroundColor: 'red',
        zIndex: 5,
      }} />

      {/* Flèches bleues */}
      {results && (
        <>
          {/* EPG */}
          <div style={{
            position: 'absolute',
            left: `${Math.min(centreMonture, markerPositions[0].x + 16)}px`,
            top: `${markerPositions[0].y}px`,
            width: `${Math.abs((markerPositions[0].x + 16) - centreMonture)}px`,
            height: '2px',
            backgroundColor: 'blue',
            zIndex: 5,
          }} />
          <div style={{
            position: 'absolute',
            left: `${((markerPositions[0].x + 16) + centreMonture) / 2}px`,
            top: `${markerPositions[0].y - 20}px`,
            color: 'blue',
            fontWeight: 'bold',
            fontSize: 14,
            transform: 'translateX(-50%)',
          }}>{results.epg} mm</div>

          {/* EPD */}
          <div style={{
            position: 'absolute',
            left: `${Math.min(centreMonture, markerPositions[1].x + 16)}px`,
            top: `${markerPositions[1].y}px`,
            width: `${Math.abs((markerPositions[1].x + 16) - centreMonture)}px`,
            height: '2px',
            backgroundColor: 'blue',
            zIndex: 5,
          }} />
          <div style={{
            position: 'absolute',
            left: `${((markerPositions[1].x + 16) + centreMonture) / 2}px`,
            top: `${markerPositions[1].y - 40}px`,
            color: 'blue',
            fontWeight: 'bold',
            fontSize: 14,
            transform: 'translateX(-50%)',
          }}>{results.epd} mm</div>

          {/* Hauteur gauche */}
          <div style={{
            position: 'absolute',
            left: `${markerPositions[0].x}px`,
            top: `${Math.min(markerPositions[0].y, markerPositions[4].y)}px`,
            height: `${Math.abs(markerPositions[0].y - markerPositions[4].y)}px`,
            width: '2px',
            backgroundColor: 'blue',
            zIndex: 5,
          }} />
          <div style={{
            position: 'absolute',
            left: `${markerPositions[0].x + 6}px`,
            top: `${(markerPositions[0].y + markerPositions[4].y) / 2}px`,
            color: 'blue',
            fontSize: 14,
            transform: 'translateY(-50%)',
          }}>{results.hg} mm</div>

          {/* Hauteur droite */}
          <div style={{
            position: 'absolute',
            left: `${markerPositions[1].x}px`,
            top: `${Math.min(markerPositions[1].y, markerPositions[5].y)}px`,
            height: `${Math.abs(markerPositions[1].y - markerPositions[5].y)}px`,
            width: '2px',
            backgroundColor: 'blue',
            zIndex: 5,
          }} />
          <div style={{
            position: 'absolute',
            left: `${markerPositions[1].x + 6}px`,
            top: `${(markerPositions[1].y + markerPositions[5].y) / 2}px`,
            color: 'blue',
            fontSize: 14,
            transform: 'translateY(-50%)',
          }}>{results.hd} mm</div>
        </>
      )}

      <button style={styles.resultButton} onClick={calculateResults}>🧮 Recalculer</button>
      <button style={{ ...styles.resultButton, bottom: 90 }} onClick={saveUpdatedMeasurement}>💾 Enregistrer</button>
      <button style={styles.backButton} onClick={() => navigate('/measures')}>🔙 Retour aux mesures</button>

      {results && (
        <div style={styles.results}>
          <p><b>Client :</b> {clientName || '(sans nom)'}</p>
          <p>EPG : {results.epg} mm</p>
          <p>EPD : {results.epd} mm</p>
          <p>Écart total : {results.epTotal} mm</p>
          <p>Hauteur gauche : {results.hg} mm</p>
          <p>Hauteur droite : {results.hd} mm</p>
        </div>
      )}
    </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'relative',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
  },
  fullImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    zIndex: 1,
  },
  resultButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    padding: '10px 16px',
    backgroundColor: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    zIndex: 10,
    cursor: 'pointer',
  },
  backButton: {
    position: 'absolute',
    bottom: 150,
    right: 30,
    padding: '8px 12px',
    backgroundColor: '#f44336',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    zIndex: 10,
    cursor: 'pointer',
  },
  results: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#ffffffcc',
    padding: 12,
    borderRadius: 8,
    color: '#000',
    fontSize: 14,
    zIndex: 10,
    lineHeight: '1.6em',
  },

 
  wrapper: {
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
};


export default EditMeasurementPage;
