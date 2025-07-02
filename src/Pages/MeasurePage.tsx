import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import DraggableMarker from '../Components/DraggableMarker';
import CornerMarker from '../Components/CornerMarker';
import Header from '../Components/Header';
import { useNavigate } from 'react-router-dom';
import ResizableRectangle from '../components/ResizableRectangle';
import { Roboflow } from "roboflow"

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
    angleP: number;
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


const MeasurePage = () => {
  const webcamRef = useRef<Webcam>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);

  const [yellowRects, setYellowRects] = useState([
    { x: 100, y: 200, width: 80, height: 80 }, // œil droit
    { x: 280, y: 200, width: 80, height: 80 }, // œil gauche
  ]);

  const [markerPositions, setMarkerPositions] = useState([
    { x: 50, y: 50 },   // 0 - Pupille gauche (rouge)
    { x: 150, y: 50 },  // 1 - Pupille droite (rouge)
    { x: 50, y: 150 },  // 2 - Plot gauche (blanc)
    { x: 150, y: 150 }, // 3 - Plot droit (blanc)
    { x: 100, y: 200 }, // 4 - sera mis à jour dynamiquement
    { x: 280, y: 200 }, // 5 - sera mis à jour dynamiquement
    { x: 120, y: 150 }, // 6 - Plot central (blanc)
  ]);


const updateYellowMarkers = (newRects: typeof yellowRects) => {
  setYellowRects(newRects);
    console.log("updateYellowMarkers called", newRects);
    console.log("✅ updateYellowMarkers déclenchée !");
    console.log("➡️ newRects[0]", newRects[0]);



  setMarkerPositions((prev) => {
    const updated = [...prev];

    // Coin inférieur droit (œil droit)
    updated[4] = {
      x: newRects[0].x + newRects[0].width +6,  // -1 pour s'aligner sur le bord interne
      y: newRects[0].y + newRects[0].height -2,
    };

    // Coin inférieur gauche (œil gauche)
    updated[5] = {
      x: newRects[1].x + 8,                      // +1 pour éviter l'extérieur du border
      y: newRects[1].y + newRects[1].height - 2,
    };
console.log("Updated marker 4:", updated[4]);
console.log("Updated marker 5:", updated[5]);

    return updated;
  });
};


  const navigate = useNavigate();
  const [results, setResults] = useState<{ epg: number, epd: number, epTotal: number, hg: number, hd: number } | null>(null);
  const [clientName, setClientName] = useState('');
  const [zoom, setZoom] = useState(1); // Valeur de zoom initiale (entre 1.0 et 3.0)

  useEffect(() => {
    document.body.style.overflow = screenshot ? 'hidden' : 'auto';
  }, [screenshot]);
  useEffect(() => {
  const adjustMarkerPositions = () => {
    const img = imageRef.current;
    if (!img) return;

    const scaleX = img.clientWidth / img.naturalWidth;
    const scaleY = img.clientHeight / img.naturalHeight;

    // On met à l'échelle tous les marqueurs (0 à 6)
    const updated = markerPositions.map((marker) => ({
      x: marker.x * scaleX,
      y: marker.y * scaleY,
    }));

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
  const centreMonture = (yellowR.x + yellowL.x) / 2;


  console.log("---- CENTRE MONTURE ----");
  console.log("Gauche (jaune):", centreGauche);
  console.log("Droit (jaune):", centreDroit);
  console.log("Centre monture (px):", centreMonture);
  const distanceVerreOeil = 12; // mm
  const facteurCorrection = 1 + distanceVerreOeil / 1000;

  // Calcul des écarts pupillaires corrigés
  const epg = Math.abs((redL.x + 15)  - centreMonture) / pxPerMm;
  const epd = Math.abs((redR.x - 15) - centreMonture) / pxPerMm;
  const epgCorr = epg * facteurCorrection;
  const epdCorr = epd * facteurCorrection;
  const epTotal = epgCorr + epdCorr;

  // ✅ Calcul des hauteurs corrigé
  const yellowLBottom = yellowL.y;
  const yellowRBottom = yellowR.y;

  const hauteurG = Math.abs(redL.y - yellowLBottom) / pxPerMm;
  const hauteurD = Math.abs(redR.y - yellowRBottom) / pxPerMm;

const angleP = calculatePantoscopicAngle();
console.log("▶️ angleP avant setResults :", angleP);


  setResults({
  epg: +epgCorr.toFixed(1),
  epd: +epdCorr.toFixed(1),
  epTotal: +epTotal.toFixed(1),
  hg: +hauteurG.toFixed(1),
  hd: +hauteurD.toFixed(1),
  angleP,
});
  };

  /**
 * Calcule l’angle pantoscopique en degrés,
 * à partir des trois plots blancs (2, 3, 6).
 */
const calculatePantoscopicAngle = () => {
  // 1) Mesure en pixels entre plot blanc droit (3) et gauche (2)
  const left  = markerPositions[2];
  const right = markerPositions[3];
  const dx    = right.x - left.x;
  const dy    = right.y - left.y;
  const distPx = Math.hypot(dx, dy);

  // Conversion px→mm
  const realDistMm = 110;             
  const pxPerMm    = distPx / realDistMm;

  // Différence verticale en pixels du plot central (6) par rapport au milieu
  const midY     = (left.y + right.y) / 2;
  const deltaYpx = markerPositions[6].y - midY;
  const deltaYmm = deltaYpx / pxPerMm;

  // Distance Z fixe (mm)
  const deltaZmm = -35;

  // Logs de debug
  console.log("📐 distPx:", distPx, "pxPerMm:", pxPerMm.toFixed(2));
  console.log("⬆️ deltaYpx:", deltaYpx, "→ deltaYmm:", deltaYmm.toFixed(1));

  // Calcul de l'angle
  // Inclinaison par rapport à la verticale,
// on prend la valeur absolue de deltaZ pour garder un angle < 90°
  const angleRad = Math.atan(deltaYmm / Math.abs(deltaZmm));
  const angleDeg = angleRad * (180 / Math.PI);
  const angle    = Math.round(angleDeg * 10) / 10;

  console.log("🎯 angle pantoscopique final :", angle, "°");
  return angle;
};




  const saveMeasurementToLocalStorage = () => {
    if (!results || !screenshot) return;

    const newMeasurement: SavedMeasurement = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      image: screenshot,
      markerPositions,
      results,
      clientName,
    };

    const existing = JSON.parse(localStorage.getItem("measurements") || "[]");
    const updated = [...existing, newMeasurement];

    localStorage.setItem("measurements", JSON.stringify(updated));
    alert("Mesure enregistrée !");
  };
  const capturePhoto = async () => {
  if (!webcamRef.current) return;

  // 1. Capture toujours la photo
  const imageSrc = webcamRef.current.getScreenshot();
  setScreenshot(imageSrc);

  // 2. Prépare le corps de la requête Roboflow
  const body = {
    api_key: "rf_5l1MHG0qlMb9dvOljxkAJcRdgfY2",  // ← remplace ta clé ici
    inputs: {
      image: {
        type: "base64",
        // on retire le préfixe data:image/jpeg;base64,
        value: imageSrc!.split(",")[1]
      }
    }
  };

  try {
    // 3. Envoi au workflow serverless
    const response = await fetch(
      "https://serverless.roboflow.com/infer/workflows/ove-distribution/detect-and-classify-2",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    const result = await response.json();
    console.log("🤖 Roboflow preds raw:", result.predictions);
    console.log("🤖 Roboflow result:", result);

    // 4. Mets à jour markerPositions avec les prédictions
    const preds = result.predictions || [];
    setMarkerPositions((prev) => {
      const updated = [...prev];

      const findBox = (cls: string) =>
        preds.find((p: any) => p.class === cls);

      // Pour chaque classe, on calcule le centre du bbox
      ["pupil_left","pupil_right","plot_left","plot_right","plot_center"].forEach((cls, idx) => {
        const box = findBox(cls);
        if (box) {
          const cx = box.x + box.width / 2;
          const cy = box.y + box.height / 2;
          // idx mapping → marker index
          const mapIdx = { 
            pupille_gauche: 0,
            pupille_droite: 1,
            plot_gauche: 2,
            plot_droit: 3,
            plot_centre: 6
          }[cls];
          updated[mapIdx] = { x: cx, y: cy };
        }
      });

      return updated;
    });
  } catch (err) {
    console.error("❌ Roboflow fetch error:", err);
  }
};


const showLabels = markerPositions.length >= 7;


const updateMarkerPosition = (
  index: number,
  newPosition: Partial<{ x: number; y: number; width: number; height: number }>
) => {
  setMarkerPositions((prev) => {
    const updated = [...prev];
    updated[index] = { ...updated[index], ...newPosition };
    return updated;
  });

};

  return (
  <>
    <div style={styles.container}>
      {!screenshot ? (
        <>
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
              📸 Prendre une photo
            </button>
            <button style={styles.button} onClick={() => navigate('/')}>🏠 Accueil</button>
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
      ) : (
       <>
  <div style={styles.overlay}>
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <img
        ref={imageRef}
        src={screenshot}
        alt="Capture"
        style={styles.fullImage}
      />


      {/* Rectangles jaunes redimensionnables */}
      {yellowRects.map((rect, index) => (
        <ResizableRectangle
          key={index}
          x={rect.x}
          y={rect.y}
          width={rect.width}
          height={rect.height}
          color="yellow"
          onChange={(newRect) => {
  const updatedRects = [...yellowRects];
  updatedRects[index] = newRect;
  updateYellowMarkers(updatedRects);
}}

        />
      ))}
    </div>
  </div>
</>
      )}
      </div>
      


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

            {screenshot && markerPositions.map((pos, index) => {
              if (index < 2) {
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
                return (
                  <DraggableMarker
                    key={index}
                    index={index}
                    position={pos}
                    color="#cccccc"
                    onDrag={updateMarkerPosition}
                  />
                );
              }
              return null;
            })}

            <button style={styles.resultButton} onClick={calculateResults}>🧮 Calculer</button>
          {results && markerPositions.length >= 6 && (
  <>


    {/* Trait vertical bleu sur marker 4 */}
{markerPositions[4] && (
  <div
    style={{
      position: 'absolute',
      left: markerPositions[4].x,
      top: 0,
      width: 2,
      height: '100%',
      backgroundColor: 'blue',
      zIndex: 10,
    }}
  />
)}

{/* Trait vertical bleu sur marker 5 */}
{markerPositions[5] && (
  <div
    style={{
      position: 'absolute',
      left: markerPositions[5].x,
      top: 0,
      width: 2,
      height: '100%',
      backgroundColor: 'blue',
      zIndex: 10,
    }}
  />
)}


    {/* === Trait centre monture === */}
    <div
      style={{
        position: 'absolute',
        left: `${(markerPositions[4].x + markerPositions[5].x) / 2}px`,
        top: 0,
        height: '100%',
        width: '2px',
        backgroundColor: 'red',
        zIndex: 15,
      }}
    />

    {/* === Ligne bleue EPG === */}
    <div style={{
      position: 'absolute',
      left: `${Math.min(markerPositions[0].x + 16, (markerPositions[4].x + markerPositions[5].x) / 2)}px`,
      top: `${markerPositions[0].y}px`,
      width: `${Math.abs(markerPositions[0].x - (markerPositions[4].x + markerPositions[5].x) / 2)}px`,
      height: '2px',
      backgroundColor: 'blue',
      zIndex: 5,
    }} />

    {/* === Ligne bleue EPD === */}
    <div style={{
      position: 'absolute',
      left: `${Math.min(markerPositions[1].x + 16, (markerPositions[4].x + markerPositions[5].x) / 2)}px`,
      top: `${markerPositions[1].y}px`,
      width: `${Math.abs(markerPositions[1].x + 16 - (markerPositions[4].x + markerPositions[5].x) / 2)}px`,
      height: '2px',
      backgroundColor: 'blue',
      zIndex: 5,
    }} />

    {/* === Flèches verticales hauteurs HD/HG + valeurs === */}
    {/* Flèche bleue hauteur œil droit */}
   <div style={{
  position: 'absolute',
  left: `${markerPositions[1].x}px`,
  top: `${markerPositions[1].y + 16}px`,
  width: '2px',
  height: `${markerPositions[4].y - (markerPositions[1].y + 6)}px`,
  backgroundColor: 'blue',
  zIndex: 5,
}} />

    <div style={{
  position: 'absolute',
  left: `${markerPositions[1].x - 60}px`,
  top: `${markerPositions[1].y + 16 + (markerPositions[4].y - (markerPositions[1].y + 16)) / 2}px`,
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
  left: `${markerPositions[0].x}px`,
  top: `${markerPositions[0].y + 16}px`,
  width: '2px',
  height: `${markerPositions[5].y - (markerPositions[0].y + 6)}px`,
  backgroundColor: 'blue',
  zIndex: 5,
}} />


    <div style={{
  position: 'absolute',
  left: `${markerPositions[0].x + 40}px`,
  top: `${markerPositions[0].y + 16 + (markerPositions[5].y - (markerPositions[0].y + 16)) / 2}px`,
  color: 'blue',
  fontWeight: 'bold',
  fontSize: '16px',
  transform: 'translateY(-50%)',
  zIndex: 6,
}}>
  {results?.hg.toFixed(1)} mm
</div>


    {/* Textes EPG et EPD */}
    <div style={{
      position: 'absolute',
      left: `${(markerPositions[1].x + (markerPositions[4].x + markerPositions[5].x) / 2) / 2}px`,
      top: `${markerPositions[1].y - 20}px`,
      color: 'blue',
      fontWeight: 'bold',
      fontSize: 14,
      zIndex: 6,
    }}>
      {results.epd} mm
    </div>

    <div style={{
      position: 'absolute',
      left: `${(markerPositions[0].x + (markerPositions[4].x + markerPositions[5].x) / 2) / 2}px`,
      top: `${markerPositions[0].y - 20}px`,
      color: 'blue',
      fontWeight: 'bold',
      fontSize: 14,
      zIndex: 6,
    }}>
      {results.epg} mm
    </div>
  </>
  )};
          <button
            style={{ ...styles.resultButton, bottom: 90 }}
            onClick={saveMeasurementToLocalStorage}
          >
            💾 Enregistrer
          </button>

          {results && (
            <div style={styles.results}>
              <p><b>Client :</b> {clientName || '(sans nom)'}</p>
              <p>EPG : {results.epg} mm</p>
              <p>EPD : {results.epd} mm</p>
              <p>Écart total : {results.epTotal} mm</p>
              <p>Hauteur gauche : {results.hg} mm</p>
              <p>Hauteur droite : {results.hd} mm</p>
              <p>Angle pantoscopique : {results.angleP}°</p>
            </div>
          )}
        </>
  )};
      
    


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

}

export default MeasurePage;
