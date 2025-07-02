import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import DraggableMarker from '../Components/DraggableMarker';
import CornerMarker from '../Components/CornerMarker';
import Header from '../Components/Header';
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

const renderArrow = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  label: string,
  key: string
) => {
  const length = Math.hypot(x2 - x1, y2 - y1);
  const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

  return (
    <div
      key={key}
      style={{
        position: 'absolute',
        left: Math.min(x1, x2),
        top: Math.min(y1, y2) - 20,
        width: length,
        height: 1,
        transform: `rotate(${angle}deg)`,
        transformOrigin: 'left center',
        borderTop: '2px solid blue',
        zIndex: 9,
      }}
    >
      <span
        style={{
          position: 'absolute',
          left: length / 2 - 15,
          top: -20,
          fontSize: 12,
          color: 'blue',
          backgroundColor: 'white',
          padding: '2px 4px',
          borderRadius: 4,
        }}
      >
        {label}
      </span>
    </div>
  );
};


const CustomMeasurePage = () => {
  const webcamRef = useRef<Webcam>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [markerPositions, setMarkerPositions] = useState([
  { x: 50, y: 50 },   // 0 - Pupille gauche (rouge)
  { x: 150, y: 50 },  // 1 - Pupille droite (rouge)
  { x: 50, y: 150 }, // 2 - Plot gauche (blanc)
  { x: 150, y: 150 }, // 3 - Plot droit (blanc)
  { x: 40, y: 200 },  // 4 - Marqueur jaune gauche
  { x: 280, y: 200 }, // 5 - Marqueur jaune droit
  { x: 120, y: 150 }, // 6 - Plot central (blanc)
]);
  const navigate = useNavigate();
  const [results, setResults] = useState<{ epg: number, epd: number, epTotal: number, hg: number, hd: number } | null>(null);
  const [clientName, setClientName] = useState('');
  const [zoom, setZoom] = useState(1); // Valeur de zoom initiale (entre 1.0 et 3.0)
  const [pantoscopicAngle, setPantoscopicAngle] = useState<number>(0);
const [vertexDistance, setVertexDistance] = useState<number>(12); // distance verre–œil
const [wrapCurve, setWrapCurve] = useState<number | null>(null);
const [step, setStep] = useState<'face' | 'profile' | 'done'>('face');
console.log("ÉTAPE ACTUELLE :", step);
const [profileScreenshot, setProfileScreenshot] = useState<string | null>(null);
const [iaAnalyzing, setIaAnalyzing] = useState(false);


  useEffect(() => {
    document.body.style.overflow = screenshot ? 'hidden' : 'auto';
  }, [screenshot]);
  useEffect(() => {
  const adjustMarkerPositions = () => {
    const img = imageRef.current;
    if (!img) return;

    const realWidth = img.naturalWidth;
    const displayWidth = img.clientWidth;
    const scaleX = displayWidth / realWidth;

    const realHeight = img.naturalHeight;
    const displayHeight = img.clientHeight;
    const scaleY = displayHeight / realHeight;

    // Corrige les repères rouges et blancs (0 à 3)
    const updated = markerPositions.map((marker, index) => {
      if (index < 4) {
        return {
          x: marker.x * scaleX,
          y: marker.y * scaleY,
        };
      }
      return marker;
    });

    setMarkerPositions(updated);
  };

  if (screenshot) {
    setTimeout(adjustMarkerPositions, 200); // attend le rendu complet
  }
}, [screenshot]);

  const redL = markerPositions[0];
const redR = markerPositions[1];
const whiteL = markerPositions[2];
const whiteR = markerPositions[3];
const yellowL = markerPositions[4];
const yellowR = markerPositions[5];


  const calculateResults = () => {
  
  const dx = whiteR.x - whiteL.x;
  const dy = whiteR.y - whiteL.y;
  const dist2D = Math.sqrt(dx * dx + dy * dy);

  const baseRealMm = 110;
  const pxPerMm = dist2D / baseRealMm;

  // Centre monture basé sur les traits jaunes
  const centreGauche = yellowL.x;
  const centreDroit = yellowR.x;
  const centreMonture = (centreGauche + centreDroit) / 2;

  console.log("---- CENTRE MONTURE ----");
  console.log("Gauche (jaune):", centreGauche);
  console.log("Droit (jaune):", centreDroit);
  console.log("Centre monture (px):", centreMonture);

  const distanceVerreOeil = 12; // mm
  const facteurCorrection = 1 + distanceVerreOeil / 1000;

  // Calcul des écarts pupillaires corrigés
  const epg = Math.abs((redL.x + 22) - centreMonture) / pxPerMm;
  const epd = Math.abs((redR.x + 10) - centreMonture) / pxPerMm;
  const epgCorr = epg * facteurCorrection;
  const epdCorr = epd * facteurCorrection;
  const epTotal = epgCorr + epdCorr;

  // ✅ Calcul des hauteurs corrigé
  const yellowLBottom = yellowL.y + 109;
  const yellowRBottom = yellowR.y + 109;

  const hauteurG = Math.abs(redL.y - yellowLBottom) / pxPerMm;
  const hauteurD = Math.abs(redR.y - yellowRBottom) / pxPerMm;

  setResults({
    epg: +epgCorr.toFixed(1),
    epd: +epdCorr.toFixed(1),
    epTotal: +epTotal.toFixed(1),
    hg: +hauteurG.toFixed(1),
    hd: +hauteurD.toFixed(1),
  });
};


  const saveMeasurementToLocalStorage = () => {
  if (!clientName) {
    alert("Merci de saisir un nom de client.");
    return;
  }

  const newMeasurement = {
    name: clientName,
    image: screenshot,
    profileImage: profileScreenshot,
    results,
    wrapCurve: wrapCurve !== null ? Math.round(wrapCurve) : null,
    pantoscopicAngle: pantoscopicAngle !== null ? parseFloat(pantoscopicAngle.toFixed(1)) : null,
    vertexDistance: vertexDistance !== null ? parseFloat(vertexDistance.toFixed(1)) : null,
    date: new Date().toISOString()
  };

  const existing = JSON.parse(localStorage.getItem("measurements") || "[]");
  existing.push(newMeasurement);
  localStorage.setItem("measurements", JSON.stringify(existing));

  alert("Mesure enregistrée avec succès !");
  navigate("/list");
};

  const capturePhoto = () => {
  if (webcamRef.current) {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      if (step === 'face') {
        setScreenshot(imageSrc);
        setStep('profile'); // ➡️ On passe à l'étape photo de profil
        return; // ✅ important pour ne pas exécuter la suite
      } else if (step === 'profile') {
        setProfileScreenshot(imageSrc);
        setStep('done');
        setIaAnalyzing(true); // ➕ Affiche le message

        analyzeProfileFromImage(imageSrc).finally(() => {
          setIaAnalyzing(false); // ➖ Cache le message
        });

        return; // ✅ important ici aussi
      }
    }

    // Si aucune image ou mauvaise étape
    alert("Erreur lors de la capture de la photo.");
  }
};



const updateMarkerPosition = (index: number, newPosition: { x: number; y: number }) => {
  setMarkerPositions((prev) => {
    const updated = [...prev];
    updated[index] = newPosition;
    return updated;
  });
};

const showLabels = markerPositions.length >= 6;


  return (
  <>
    <div style={styles.container}>
        <div style={styles.instruction}>
  {step === 'face' && (
  <div style={styles.instructionFace}>
    📸 Prenez une photo de face, bien centré, à 40 cm.
  </div>
)}

{step === 'profile' && (
  <div style={styles.instructionProfile}>
    📸 Prenez une photo de profil parfaitement perpendiculaire.
  </div>
)}

{step === 'done' && (
  <div style={styles.doneMessage}>
    ✅ Les deux photos sont prises. Passez à l’ajustement ou au calcul.
  </div>
)}


</div>

      {step === 'face' && (
  <>
    {/* PHOTO DE FACE */}
    <div
      style={{
        ...styles.webcamWrapper,
        transform: `scale(${zoom}) translate(${(1 - 1 / zoom) * 50}%, ${(1 - 1 / zoom) * 50}%)`,
        transformOrigin: 'center center',
      }}
    >

      <div style={styles.cameraFrame}>
        <div
          style={{
            ...styles.webcamWrapper,
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              facingMode: { exact: 'environment' },
            }}
            style={styles.webcam}
          />
        </div>
      </div>
    </div>

    <input
      type="text"
      placeholder="Nom du client"
      value={clientName}
      onChange={(e) => setClientName(e.target.value)}
      style={styles.input}
    />

    <div style={styles.buttonRow}>
      <button style={styles.button} onClick={capturePhoto}>
        📸 Prendre la photo de face
      </button>
      <button style={styles.button} onClick={() => navigate('/')}>
        🏠 Accueil
      </button>
    </div>

    <div style={styles.sliderContainer}>
      <label style={styles.zoomLabel}>Zoom : {zoom.toFixed(1)}x</label>
      <input
        type="range"
        min={1}
        max={3}
        step={0.1}
        value={zoom}
        onChange={(e) => setZoom(parseFloat(e.target.value))}
        style={{ width: 200 }}
      />
    </div>
  </>
)}

{step === 'profile' && (
  <>
    {/* PHOTO DE PROFIL */}
    <div style={styles.webcamWrapper}>
      <div style={styles.cameraFrame}>
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: { exact: 'environment' } }}
          style={styles.webcam}
        />

      </div>
    </div>

    <p style={{ color: 'white', textAlign: 'center', marginTop: 10 }}>
      📐 Veuillez maintenant prendre une photo de <b>profil</b> (vue latérale).
    </p>

    <div style={styles.buttonRow}>
      <button style={styles.button} onClick={capturePhoto}>
        📷 Prendre la photo de profil
      </button>
    </div>
  </>
)}

{step === 'done' && screenshot && (
  

        <>
          <div style={styles.overlay}>
            <img
              src={screenshot}
              alt="Capture"
              ref={imageRef}
              style={styles.fullImage}
            />

            <button
              onClick={() => navigate('/')}
              style={{ ...styles.resultButton, bottom: 200, backgroundColor: '#2196F3' }}
            >
              🏠 Accueil
            </button>

            <button
              onClick={() => setScreenshot(null)}
              style={{ ...styles.resultButton, bottom: 150, backgroundColor: '#f44336' }}
            >
              🔙 Retour à la prise de photo
            </button>

            {markerPositions.map((pos, index) => {
  if (index < 2) {
    // Repères rouges (pupilles)
    return (
      <DraggableMarker
        key={index}
        index={index}
        position={pos}
        color="red"
        isOffset
        onDrag={updateMarkerPosition}
      />
    );
  } else if (index < 4 || index === 6) {
    // Repères blancs (plots) : gauche, droite et central
    return (
      <DraggableMarker
        key={index}
        index={index}
        position={pos}
        color="#cccccc"
        onDrag={updateMarkerPosition}
      />
    );
  } else {
    // Repères jaunes (traits verticaux)
    return (
      <CornerMarker
        key={index}
        index={index}
        position={pos}
        side={index === 4 ? 'left' : 'right'}
        onDrag={updateMarkerPosition}
        sizeMultiplier={3}
      />
    );
  }
})}


            <button style={styles.resultButton} onClick={calculateResults}>
              🧮 Calculer
            </button>

            {results && markerPositions.length >= 6 && (() => {
  const centreMonture = ((markerPositions[4].x) + markerPositions[5].x ) / 2;

  return (
    <>
    {/* Trait centre monture en ROUGE */}
<div
  style={{
    position: 'absolute',
    left: `${((markerPositions[4].x) + markerPositions[5].x) / 2}px`,
    top: 0,
    height: '100%',
    width: '2px',
    backgroundColor: 'red',
    zIndex: 15,
  }}
/>



      {/* Ligne bleue EPG */}
      <div style={{
        position: 'absolute',
        left: `${Math.min((markerPositions[0].x + 16), centreMonture)}px`,
        top: `${markerPositions[0].y}px`,
        width: `${Math.abs((markerPositions[0].x)- centreMonture)}px`,
        height: '2px',
        backgroundColor: 'blue',
        zIndex: 5,
      }} />

      {/* Ligne bleue EPD */}
      <div style={{
        position: 'absolute',
        left: `${Math.min((markerPositions[1].x + 16), centreMonture)}px`,
        top: `${markerPositions[1].y}px`,
        width: `${Math.abs((markerPositions[1].x + 16) - centreMonture)}px`,
        height: '2px',
        backgroundColor: 'blue',
        zIndex: 5,
      }} />
      {/* Flèche bleue hauteur œil droit */}
<div style={{
  position: 'absolute',
  left: `${markerPositions[1].x}px`,
  top: `${(markerPositions[1].y + 16)}px`,
  width: '2px',
  height: `${(markerPositions[4].y + 109) - (markerPositions[1].y + 16)}px`,
  backgroundColor: 'blue',
  zIndex: 5,
}} />
<div style={{
  position: 'absolute',
  left: `${markerPositions[1].x - 60}px`,
  top: `${markerPositions[1].y + ((markerPositions[4].y + 220) - markerPositions[1].y) / 2}px`,
  color: 'blue',
  fontWeight: 'bold',
  fontSize: '16px',
  transform: 'translateY(-50%)',
  zIndex: 6,
}}>
  {results?.hd.toFixed(1)} mm
</div>

{/* Flèche bleue hauteur œil gauche */}
<div style={{
  position: 'absolute',
  left: `${(markerPositions[0].x)}px`,
  top: `${(markerPositions[0].y)}px`,
  width: '2px',
  height: `${(markerPositions[5].y + 109) - (markerPositions[0].y)}px`,
  backgroundColor: 'blue',
  zIndex: 5,
}} />
<div style={{
  position: 'absolute',
  left: `${markerPositions[0].x + 40}px`,
  top: `${markerPositions[0].y + ((markerPositions[5].y + 220) - markerPositions[0].y) / 2}px`,
  color: 'blue',
  fontWeight: 'bold',
  fontSize: '16px',
  transform: 'translateY(-50%)',
  zIndex: 6,
}}>
  {results?.hg.toFixed(1)} mm
</div>


      {/* Texte EPG */}
      <div style={{
        position: 'absolute',
        left: `${(markerPositions[1].x + centreMonture) / 2}px`,
        top: `${markerPositions[1].y - 20}px`,
        color: 'blue',
        fontWeight: 'bold',
        fontSize: 14,
        zIndex: 6,
      }}>
        {results.epd} mm
      </div>

      {/* Texte EPD */}
      <div style={{
        position: 'absolute',
        left: `${(markerPositions[0].x + centreMonture) / 2}px`,
        top: `${markerPositions[0].y - 20}px`,
        color: 'blue',
        fontWeight: 'bold',
        fontSize: 14,
        zIndex: 6,
      }}>
        {results.epg} mm
      </div>
    </>
  );
})()}

                    <button
              style={{ ...styles.resultButton, bottom: 90 }}
              onClick={saveMeasurementToLocalStorage}
            >
              💾 Enregistrer
            </button>

            {iaAnalyzing && (
  <div style={{ ...styles.results, color: 'orange' }}>
    🔍 Analyse de la photo de profil en cours...
  </div>
)}

          {results && (
  <div style={styles.results}>
    <p><b>Client :</b> {clientName || '(sans nom)'}</p>
    <p>EPG : {results.epg} mm</p>
    <p>EPD : {results.epd} mm</p>
    <p>Écart total : {results.epTotal} mm</p>
    <p>Hauteur gauche : {results.hg} mm</p>
    <p>Hauteur droite : {results.hd} mm</p>
    {wrapCurve !== null && (
  <p>Galbe de la monture : {Math.round(wrapCurve)}°</p>
)}
    <p>Angle pantoscopique : {pantoscopicAngle?.toFixed(1) ?? '...'}°</p>
    <p>Distance verre-œil : {vertexDistance?.toFixed(1) ?? '...'} mm</p>
  
              </div>
            )}
          </div>
        </>
      )}
    </div>
  </>
);
};

const analyzeProfileFromImage = async (image: string) => {
  setIaAnalyzing(true); // affiche le message "Analyse en cours..."
  const fakeResults: { anglePantoscopique: number; distanceVerreOeil: number } =
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        anglePantoscopique: 9 + Math.random() * 3,     // 9° à 12°
        distanceVerreOeil: 11 + Math.random() * 3      // 11 mm à 14 mm
      });
    }, 2000);
  });

  setPantoscopicAngle(fakeResults.anglePantoscopique);
  setVertexDistance(fakeResults.distanceVerreOeil);
  setIaAnalyzing(false); // fin de l’analyse
};

const styles = {
  cameraFrame: {
    width: '70vw',
    height: '70vh',
    margin: '0 auto',
    position: 'relative',
    overflow: 'hidden',
    border: '4px solid #00FF00', // vert fluo ou change la couleur
    borderRadius: 12,
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
    backgroundColor: '#000',
  },

  webcamWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },

  sliderContainer: {
    position: 'absolute',
    bottom: 160,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },

  zoomLabel: {
    color: 'white',
    marginBottom: 4,
    fontSize: 14,
  },

  container: {
    width: '100vw',
    height: '100vh',
    backgroundColor: '#000',
    overflow: 'hidden',
    position: 'relative',
    boxSizing: 'border-box',
  },

  webcam: {
    width: '100%',
    height: 'auto',
    maxHeight: 'calc(100vh - 60px)',
  },

  input: {
    position: 'absolute',
    top: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: 10,
    fontSize: 16,
    zIndex: 10,
    borderRadius: 6,
    border: '1px solid #ccc',
    width: 220,
    textAlign: 'center',
  },

  button: {
    fontSize: 18,
    padding: '10px 20px',
    backgroundColor: '#2196F3',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },

  overlay: {
    width: '100vw',
    height: '100vh',
    position: 'relative',
    overflow: 'hidden',
  },

  fullImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },

  resultButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    fontSize: 16,
    padding: '10px 16px',
    backgroundColor: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    zIndex: 10,
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

  buttonRow: {
    position: 'absolute',
    bottom: 50,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: 12,
    zIndex: 10,
  },
    instructionFace: {
  position: 'absolute',
  top: 500,
  left: '50%',
  transform: 'translateX(-50%)',
  color: 'white',
  backgroundColor: '#000000aa',
  padding: '10px 20px',
  borderRadius: 8,
  zIndex: 20,
  fontSize: 16,
  whiteSpace: 'nowrap',
},

instructionProfile: {
  position: 'absolute',
  top: 500, // plus bas que le précédent
  left: '50%',
  transform: 'translateX(-50%)',
  color: 'white',
  backgroundColor: '#000000aa',
  padding: '10px 20px',
  borderRadius: 8,
  zIndex: 20,
  fontSize: 16,
  whiteSpace: 'nowrap',
},

doneMessage: {
  position: 'absolute',
  bottom: 80,
  left: '50%',
  transform: 'translateX(-50%)',
  backgroundColor: '#222',
  color: 'white',
  padding: 10,
  borderRadius: 8,
  fontSize: 16,
  zIndex: 10,
  whiteSpace: 'nowrap',
},
label: {
  position: 'absolute',
  padding: '4px 8px',
  backgroundColor: '#000000cc',
  color: 'white',
  borderRadius: 6,
  fontSize: 14,
  fontWeight: 'bold',
  whiteSpace: 'nowrap',
  transform: 'translateX(-50%)',
  zIndex: 15,
},


};
export default CustomMeasurePage;
