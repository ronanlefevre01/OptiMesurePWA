import React, { useEffect, useRef } from 'react';

type CornerMarkerProps = {
  index: number;
  position: { x: number; y: number };
  side: 'left' | 'right';
  onDrag: (index: number, e: any, data: { x: number; y: number }) => void;
};

const CornerMarker: React.FC<CornerMarkerProps> = ({ index, position, side, onDrag }) => {
  const markerRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const markerSize = 220;
  const lineWidth = 1;
  const handleSize = 12;
  const isLeft = side === 'left';

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    const handlePointerDown = (e: PointerEvent) => {
      e.preventDefault();
      marker.setPointerCapture(e.pointerId);

      const markerRect = marker.getBoundingClientRect();
      dragOffset.current = {
        x: e.clientX - (markerRect.left + markerRect.width / 2),
        y: e.clientY - (markerRect.top + markerRect.height / 2 + 60), // ← décalage vertical
      };

      const handlePointerMove = (e: PointerEvent) => {
        const newX = e.clientX - dragOffset.current.x;
        const newY = e.clientY - dragOffset.current.y;
        onDrag(index, e, { x: newX, y: newY });
      };

      const handlePointerUp = () => {
        marker.removeEventListener('pointermove', handlePointerMove);
        marker.removeEventListener('pointerup', handlePointerUp);
      };

      marker.addEventListener('pointermove', handlePointerMove);
      marker.addEventListener('pointerup', handlePointerUp);
    };

    marker.addEventListener('pointerdown', handlePointerDown);
    return () => {
      marker.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [index, position, onDrag]);

  return (
    <div
      ref={markerRef}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: markerSize,
        height: markerSize,
        display: 'flex',
        justifyContent: isLeft ? 'flex-end' : 'flex-start',
        alignItems: 'flex-end',
        pointerEvents: 'auto',
        zIndex: 5,
        touchAction: 'none',
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Ligne verticale */}
      <div style={{ width: lineWidth, height: markerSize, backgroundColor: 'yellow' }} />

      {/* Ligne horizontale */}
      <div style={{
        width: markerSize,
        height: lineWidth,
        backgroundColor: 'yellow',
        position: 'absolute',
        bottom: 0,
        left: 0,
      }} />

      {/* Poignée visuelle */}
      <div style={{
        width: handleSize,
        height: handleSize,
        borderRadius: handleSize / 2,
        backgroundColor: 'yellow',
        border: '2px solid black',
        position: 'absolute',
        bottom: 0,
        right: isLeft ? 0 : undefined,
        left: isLeft ? undefined : 0,
        pointerEvents: 'none',
      }} />

      {/* Zone de contact tactile élargie et décalée */}
      <div style={{
        position: 'absolute',
        top: markerSize + 40,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 80,
        height: 80,
        cursor: 'grab',
        zIndex: 11,
        backgroundColor: 'transparent',
        touchAction: 'none',
      }} />

      {/* Étiquette */}
      <div style={{
        position: 'absolute',
        top: -20,
        fontSize: 12,
        fontWeight: 'bold',
        color: 'yellow',
        backgroundColor: 'black',
        padding: '2px 6px',
        borderRadius: 4,
      }}>
        {side === 'left' ? 'Œil droit' : 'Œil gauche'}
      </div>
    </div>
  );
};

export default CornerMarker;
