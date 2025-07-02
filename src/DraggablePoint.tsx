import React, { useRef, useEffect, useState } from 'react';

interface Props {
  x: number;
  y: number;
  color: string;
  onChange: (x: number, y: number) => void;
}

export default function DraggablePoint({ x, y, color, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!dragging || !ref.current) return;
      const rect = ref.current.parentElement!.getBoundingClientRect();
      const newX = e.clientX - rect.left;
      const newY = e.clientY - rect.top;
      onChange(newX, newY);
    };
    const up = () => setDragging(false);

    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, [dragging]);

  return (
    <div
      ref={ref}
      onMouseDown={() => setDragging(true)}
      style={{
        position: 'absolute',
        left: x - 10,
        top: y - 30, // point de contact décalé
        width: 20,
        height: 20,
        borderRadius: '50%',
        border: `2px solid ${color}`,
        background: 'transparent',
        cursor: 'grab',
        zIndex: 10,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: 2,
          backgroundColor: color,
          transform: 'translateY(-50%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '50%',
          width: 2,
          backgroundColor: color,
          transform: 'translateX(-50%)',
        }}
      />
    </div>
  );
}
