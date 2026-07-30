"use client";

import { useModal } from "@/hooks/use-modal-store";
import { X, ZoomIn, ZoomOut } from "lucide-react";
import Image from "next/image";
import { useState, useRef, useEffect, MouseEvent as ReactMouseEvent } from "react";

export function ImageViewerModal() {
  const { isOpen, type, data, onClose } = useModal();
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const isModalOpen = isOpen && type === "imageViewer";
  const { imageUrl } = data;

  useEffect(() => {
    if (isModalOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setIsDragging(false);
    }
  }, [isModalOpen]);

  if (!isModalOpen || !imageUrl) return null;

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.5, 4));
  const handleZoomOut = () => {
    setScale((s) => {
      const newScale = Math.max(s - 0.5, 1);
      if (newScale === 1) setPosition({ x: 0, y: 0 }); // Reset pan when fully zoomed out
      return newScale;
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY < 0) handleZoomIn();
    else handleZoomOut();
  };

  const handleMouseDown = (e: ReactMouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: ReactMouseEvent) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClose = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 animate-fade-in backdrop-blur-sm">
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 z-[60] rounded-full p-2 bg-black/50 text-discord-muted hover:text-white hover:bg-black/80 transition-colors"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-4 rounded-full bg-black/50 px-4 py-2 backdrop-blur-md">
        <button onClick={handleZoomOut} disabled={scale <= 1} className="text-white disabled:opacity-50 hover:bg-white/10 p-1.5 rounded-full transition-colors">
          <ZoomOut className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-white min-w-[3rem] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button onClick={handleZoomIn} disabled={scale >= 4} className="text-white disabled:opacity-50 hover:bg-white/10 p-1.5 rounded-full transition-colors">
          <ZoomIn className="h-5 w-5" />
        </button>
      </div>

      <div
        ref={containerRef}
        className="relative flex h-full w-full items-center justify-center overflow-hidden outline-none select-none"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="relative transition-transform duration-200 ease-out"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
          }}
          onClick={(e) => {
            // Only zoom in on click if not dragging
            if (scale === 1) {
              e.stopPropagation();
              handleZoomIn();
            }
          }}
        >
          {/* Prevent dragging ghost image */}
          <img
            src={imageUrl}
            alt="Maximized view"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-md shadow-2xl pointer-events-none"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}
