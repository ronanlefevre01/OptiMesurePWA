import React, { useRef } from 'react';

type Props = {
  index: number;
  position: { x: number; y: number };
  color?: string;
  onDrag: (index: number, pos: { x: number; y: number }) => void;
  isOffset?: boolean;
};

const labelMap: { [key: number]: string } = {
  0: 'Pupille G',
  1: 'Pupille D',
  2: 'Plot G',
  3: 'Plot D',
  4: 'Jaune G',
  5: 'Jaune D',
  6: 'Plot C',
};

const DraggableMarker = ({
  index,
  position,
  color = 'red',
  onDrag,
  isOffset = false,
}: Props) => {
  const markerRef = useRef<HTMLDivElement>(null);

  const handleDrag = (e: React.PointerEvent) => {
    const startX = e.clientX;
    const startY = e.clientY;

    const handleMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      onDrag(index, {
        x: position.x + dx,
        y: position.y + dy,
      });
    };

    const handleUp = () => {
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleUp);
    };

    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleUp);
  };

  return (
    <div
      ref={markerRef}
      style={{
        position: 'absolute',
        left: position.x - 16,
        top: position.y - 16,
        zIndex: 10,
        touchAction: 'none',
      }}
    >
      {/* Étiquette */}
      <div
        style={{
          position: 'absolute',
          top: -28,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'black',
          color: 'white',
          fontSize: 10,
          padding: '2px 6px',
          borderRadius: 4,
          whiteSpace: 'nowrap',
        }}
      >
        {labelMap[index] || `Repère ${index}`}
      </div>

      {/* Repère visuel */}
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          backgroundColor: 'transparent',
          border: `2px solid ${index <= 1 ? 'white' : 'black'}`,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '100%',
            height: 1,
            backgroundColor: index <= 1 ? 'white' : 'black',
            transform: 'translate(-50%, -50%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 1,
            height: '100%',
            backgroundColor: index <= 1 ? 'white' : 'black',
            transform: 'translate(-50%, -50%)',
          }}
        />
        {/* Trait de liaison vers la poignée */}
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            width: 2,
            height: 10,
            backgroundColor: index <= 1 ? 'white' : 'black',
            transform: 'translateX(-50%)',
            opacity: 0.5,
          }}
        />
      </div>

      {/* Poignée de déplacement stylisée */}
<div
  onPointerDown={handleDrag}
  style={{
    position: 'absolute',
    top: 42,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 24,
    height: 24,
    fontSize: 18,
    color: index <= 1 ? 'white' : 'black',
    textAlign: 'center',
    lineHeight: '24px',
    backgroundColor: 'transparent',
    cursor: 'grab',
    zIndex: 11,
    userSelect: 'none',
    touchAction: 'none',
  }}
>
  🖐️
</div>
</div>
  );
};

export default DraggableMarker;