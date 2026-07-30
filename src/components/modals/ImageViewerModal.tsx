/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useRef } from "react";
import { useModal } from "@/hooks/use-modal-store";
import { X, ZoomIn, ZoomOut, Download } from "lucide-react";

export function ImageViewerModal() {
  const { isOpen, type, data, onClose } = useModal();
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
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

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 4));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const newScale = Math.max(prev - 0.25, 0.5);
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Prevent default drag behavior on the image itself
  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 animate-fade-in backdrop-blur-sm">
      {/* Top Controls Bar */}
      <div className="absolute top-0 left-0 w-full p-4 flex items-center justify-end gap-x-4 bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none">
        <div className="flex gap-x-2 pointer-events-auto">
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="text-discord-muted hover:text-white transition-colors p-2 bg-black/50 rounded-md hover:bg-discord-dark"
            title="Open Original"
          >
            <Download className="h-5 w-5" />
          </a>
          <button 
            onClick={handleZoomIn} 
            disabled={scale >= 4}
            className="text-discord-muted hover:text-white transition-colors p-2 bg-black/50 rounded-md hover:bg-discord-dark disabled:opacity-50"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
          <button 
            onClick={handleZoomOut} 
            disabled={scale <= 0.5}
            className="text-discord-muted hover:text-white transition-colors p-2 bg-black/50 rounded-md hover:bg-discord-dark disabled:opacity-50"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          <button 
            onClick={onClose} 
            className="text-discord-muted hover:text-white transition-colors p-2 bg-black/50 rounded-md hover:bg-discord-red ml-4"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Image Container */}
      <div 
        ref={containerRef}
        className="w-full h-full flex items-center justify-center overflow-hidden"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={(e) => {
          // Close if clicking outside the image
          if (e.target === containerRef.current && scale === 1) {
            onClose();
          }
        }}
      >
        <div 
          className="relative transition-transform duration-100 ease-out flex items-center justify-center"
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default"
          }}
        >
          <img
            src={imageUrl}
            alt="Expanded view"
            className="max-w-[90vw] max-h-[90vh] object-contain select-none"
            onDragStart={handleDragStart}
            draggable={false}
          />
        </div>
      </div>
      
      {/* Hint Tooltip */}
      {scale === 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/70 rounded-full text-xs text-white/70 pointer-events-none">
          Scroll to zoom • Click and drag to pan
        </div>
      )}
    </div>
  );
}
