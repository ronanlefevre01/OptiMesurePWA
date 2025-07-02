import React, { useState, useEffect, useRef } from 'react';

interface ResizableRectangleProps {
  x: number;
  y: number;
  width: number;
  height: number;
  onChange: (rect: { x: number; y: number; width: number; height: number }) => void;
  color?: string;
}

const ResizableRectangle: React.FC<ResizableRectangleProps> = ({
  x,
  y,
  width,
  height,
  onChange,
  color = 'yellow',
}) => {
  const [position, setPosition] = useState({ x, y });
  const [size, setSize] = useState({ width, height });

  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const startTouch = useRef({ x: 0, y: 0 });
  const startRect = useRef({ x, y, width, height });

  const onStart = (clientX: number, clientY: number, resize = false) => {
    if (resize) {
      isResizing.current = true;
    } else {
      isDragging.current = true;
    }
    startTouch.current = { x: clientX, y: clientY };
    startRect.current = { ...position, ...size };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onEnd);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    onStart(e.clientX, e.clientY);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    onStart(touch.clientX, touch.clientY);
  };

  const onResizeStartMouse = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStart(e.clientX, e.clientY, true);
  };

  const onResizeStartTouch = (e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.touches[0];
    onStart(touch.clientX, touch.clientY, true);
  };

  const onMouseMove = (e: MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  const onTouchMove = (e: TouchEvent) => {
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  const handleMove = (clientX: number, clientY: number) => {
    const dx = clientX - startTouch.current.x;
    const dy = clientY - startTouch.current.y;

    if (isDragging.current) {
      const newX = startRect.current.x + dx;
      const newY = startRect.current.y + dy;
      setPosition({ x: newX, y: newY });
      onChange({ x: newX, y: newY, width: size.width, height: size.height });
    }

    if (isResizing.current) {
      const newWidth = Math.max(30, startRect.current.width + dx);
      const newHeight = Math.max(30, startRect.current.height + dy);
      setSize({ width: newWidth, height: newHeight });
      onChange({ x: position.x, y: position.y, width: newWidth, height: newHeight });
    }
  };

  const onEnd = () => {
    isDragging.current = false;
    isResizing.current = false;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onEnd);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onEnd);
  };

  useEffect(() => {
    setPosition({ x, y });
    setSize({ width, height });
  }, [x, y, width, height]);

  return (
    <div
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        border: `1px solid ${color}`,
        boxSizing: 'border-box',
        backgroundColor: 'transparent',
        touchAction: 'none',
    
        zIndex: 10,
      }}
    >
      <div
        onMouseDown={onResizeStartMouse}
        onTouchStart={onResizeStartTouch}
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: 20,
          height: 20,
          backgroundColor: color,
          cursor: 'nwse-resize',
        }}
      />
    </div>
  );
};

export default ResizableRectangle;
