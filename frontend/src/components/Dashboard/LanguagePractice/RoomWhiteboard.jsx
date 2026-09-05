import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Pencil, Highlighter, Eraser, Square, Circle,
  Minus, MoveRight, Type, RotateCcw, RotateCw,
  Trash2, Download, X, Maximize2, Minimize2, Palette
} from 'lucide-react';
import { RoomEvent } from 'livekit-client';
import toast from 'react-hot-toast';

const PALETTE = [
  '#000000', // Black
  '#f97316', // Orange (Brand)
  '#3b82f6', // Blue
  '#10b981', // Green
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#f59e0b', // Amber
  '#ffffff', // White
];

const STROKE_WIDTHS = [
  { label: 'Fine', value: 2 },
  { label: 'Medium', value: 4 },
  { label: 'Thick', value: 8 },
  { label: 'Bold', value: 14 },
];

export default function RoomWhiteboard({ room, localParticipant, isHost, onClose }) {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);

  // Tools: 'pen' | 'highlighter' | 'eraser' | 'rectangle' | 'circle' | 'line' | 'arrow' | 'text'
  const [activeTool, setActiveTool] = useState('pen');
  const [selectedColor, setSelectedColor] = useState('#f97316');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Shapes & text in-progress
  const startPos = useRef({ x: 0, y: 0 });
  const snapshotRef = useRef(null);
  const [textInput, setTextInput] = useState(null); // { x, y, value }

  // Action history for Undo/Redo & Late Joiner Sync
  const elementsRef = useRef([]);
  const undoStackRef = useRef([]);

  // ── Helper: Broadcast packet over LiveKit Data Channel ───────────────────────
  const broadcastPacket = useCallback((payload) => {
    if (!room || !localParticipant) return;
    try {
      const dataStr = JSON.stringify(payload);
      const encoder = new TextEncoder();
      localParticipant.publishData(encoder.encode(dataStr), {
        reliable: true,
        topic: 'whiteboard'
      }).catch(err => console.error('Whiteboard publish error:', err));
    } catch (e) {
      console.error('Failed to broadcast whiteboard packet:', e);
    }
  }, [room, localParticipant]);

  // ── Initialize Canvas Size ──────────────────────────────────────────────────
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    contextRef.current = ctx;

    redrawAllElements();
  }, []);

  useEffect(() => {
    setupCanvas();
    const handleResize = () => setupCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setupCanvas]);

  // ── Redraw Canvas from Element History ───────────────────────────────────────
  const redrawAllElements = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    elementsRef.current.forEach(elem => {
      drawElement(ctx, elem);
    });
  }, []);

  // ── Draw Single Element onto Canvas ──────────────────────────────────────────
  const drawElement = (ctx, elem) => {
    ctx.save();
    ctx.strokeStyle = elem.color;
    ctx.fillStyle = elem.color;
    ctx.lineWidth = elem.width;
    ctx.globalAlpha = elem.tool === 'highlighter' ? 0.35 : 1.0;

    if (elem.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = elem.width * 2;
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }

    switch (elem.type) {
      case 'path':
        if (elem.points && elem.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(elem.points[0].x, elem.points[0].y);
          for (let i = 1; i < elem.points.length; i++) {
            ctx.lineTo(elem.points[i].x, elem.points[i].y);
          }
          ctx.stroke();
        }
        break;

      case 'rectangle':
        ctx.beginPath();
        ctx.strokeRect(elem.x, elem.y, elem.w, elem.h);
        break;

      case 'circle': {
        ctx.beginPath();
        const rx = Math.abs(elem.w / 2);
        const ry = Math.abs(elem.h / 2);
        const cx = elem.x + elem.w / 2;
        const cy = elem.y + elem.h / 2;
        ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        ctx.stroke();
        break;
      }

      case 'line':
        ctx.beginPath();
        ctx.moveTo(elem.x1, elem.y1);
        ctx.lineTo(elem.x2, elem.y2);
        ctx.stroke();
        break;

      case 'arrow': {
        const headlen = Math.max(10, elem.width * 3);
        const angle = Math.atan2(elem.y2 - elem.y1, elem.x2 - elem.x1);
        ctx.beginPath();
        ctx.moveTo(elem.x1, elem.y1);
        ctx.lineTo(elem.x2, elem.y2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(elem.x2, elem.y2);
        ctx.lineTo(elem.x2 - headlen * Math.cos(angle - Math.PI / 6), elem.y2 - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(elem.x2 - headlen * Math.cos(angle + Math.PI / 6), elem.y2 - headlen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
        break;
      }

      case 'text':
        ctx.font = `${Math.max(14, elem.width * 4)}px Inter, sans-serif`;
        ctx.fillText(elem.text, elem.x, elem.y);
        break;

      default:
        break;
    }

    ctx.restore();
  };

  // ── LiveKit Data Event Listener for Real-Time Peer Sync ─────────────────────
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload, participant, kind, topic) => {
      if (topic !== 'whiteboard') return;
      try {
        const decoder = new TextDecoder();
        const message = JSON.parse(decoder.decode(payload));

        switch (message.type) {
          case 'DRAW_ELEMENT':
            elementsRef.current.push(message.element);
            if (contextRef.current) {
              drawElement(contextRef.current, message.element);
            }
            break;

          case 'CLEAR':
            elementsRef.current = [];
            undoStackRef.current = [];
            redrawAllElements();
            break;

          case 'UNDO':
            elementsRef.current.pop();
            redrawAllElements();
            break;

          case 'SYNC_REQUEST':
            // Host or peer answers request with full element array
            if (elementsRef.current.length > 0) {
              broadcastPacket({
                type: 'SYNC_RESPONSE',
                elements: elementsRef.current,
              });
            }
            break;

          case 'SYNC_RESPONSE':
            if (message.elements && Array.isArray(message.elements)) {
              elementsRef.current = message.elements;
              redrawAllElements();
            }
            break;

          default:
            break;
        }
      } catch (err) {
        console.error('Error handling whiteboard packet:', err);
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);

    // Request initial sync from existing peers
    broadcastPacket({ type: 'SYNC_REQUEST' });

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, broadcastPacket, redrawAllElements]);

  // ── Coordinates Helper ───────────────────────────────────────────────────────
  const getCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  // ── Mouse & Touch Event Handlers ─────────────────────────────────────────────
  const currentPath = useRef([]);

  const handleStart = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
    const { x, y } = getCoords(e);
    startPos.current = { x, y };
    setIsDrawing(true);

    if (activeTool === 'text') {
      setTextInput({ x, y, value: '' });
      setIsDrawing(false);
      return;
    }

    if (activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'eraser') {
      currentPath.current = [{ x, y }];
    } else {
      // Shape snapshot
      const canvas = canvasRef.current;
      if (canvas) {
        snapshotRef.current = canvas.toDataURL();
      }
    }
  };

  const handleMove = (e) => {
    if (!isDrawing) return;
    const { x, y } = getCoords(e);
    const ctx = contextRef.current;
    if (!ctx) return;

    if (activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'eraser') {
      currentPath.current.push({ x, y });

      const len = currentPath.current.length;
      if (len >= 2) {
        const p1 = currentPath.current[len - 2];
        const p2 = currentPath.current[len - 1];

        ctx.save();
        ctx.strokeStyle = selectedColor;
        ctx.lineWidth = strokeWidth;
        ctx.globalAlpha = activeTool === 'highlighter' ? 0.35 : 1.0;

        if (activeTool === 'eraser') {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.lineWidth = strokeWidth * 2;
        }

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.restore();
      }
    } else {
      // Preview shape
      redrawAllElements();
      const elem = {
        type: activeTool,
        tool: activeTool,
        color: selectedColor,
        width: strokeWidth,
        x: startPos.current.x,
        y: startPos.current.y,
        w: x - startPos.current.x,
        h: y - startPos.current.y,
        x1: startPos.current.x,
        y1: startPos.current.y,
        x2: x,
        y2: y,
      };
      drawElement(ctx, elem);
    }
  };

  const handleEnd = (e) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const { x, y } = getCoords(e);

    let newElement = null;

    if (activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'eraser') {
      if (currentPath.current.length > 0) {
        newElement = {
          type: 'path',
          tool: activeTool,
          color: selectedColor,
          width: strokeWidth,
          points: [...currentPath.current],
        };
        currentPath.current = [];
      }
    } else if (['rectangle', 'circle', 'line', 'arrow'].includes(activeTool)) {
      const dx = x - startPos.current.x;
      const dy = y - startPos.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        newElement = {
          type: activeTool,
          tool: activeTool,
          color: selectedColor,
          width: strokeWidth,
          x: startPos.current.x,
          y: startPos.current.y,
          w: dx,
          h: dy,
          x1: startPos.current.x,
          y1: startPos.current.y,
          x2: x,
          y2: y,
        };
      }
    }

    if (newElement) {
      elementsRef.current.push(newElement);
      undoStackRef.current = []; // Clear redo stack on new action
      redrawAllElements();
      broadcastPacket({
        type: 'DRAW_ELEMENT',
        element: newElement,
      });
    }
  };

  // ── Text Input Submission ────────────────────────────────────────────────────
  const handleTextSubmit = (e) => {
    if (e.key === 'Enter' && textInput && textInput.value.trim()) {
      const newElem = {
        type: 'text',
        tool: 'text',
        color: selectedColor,
        width: strokeWidth,
        text: textInput.value.trim(),
        x: textInput.x,
        y: textInput.y,
      };

      elementsRef.current.push(newElem);
      undoStackRef.current = [];
      redrawAllElements();
      broadcastPacket({
        type: 'DRAW_ELEMENT',
        element: newElem,
      });
      setTextInput(null);
    } else if (e.key === 'Escape') {
      setTextInput(null);
    }
  };

  // ── Actions: Undo, Redo, Clear, Download ─────────────────────────────────────
  const handleUndo = () => {
    if (elementsRef.current.length === 0) return;
    const removed = elementsRef.current.pop();
    undoStackRef.current.push(removed);
    redrawAllElements();
    broadcastPacket({ type: 'UNDO' });
  };

  const handleRedo = () => {
    if (undoStackRef.current.length === 0) return;
    const restored = undoStackRef.current.pop();
    elementsRef.current.push(restored);
    redrawAllElements();
    broadcastPacket({
      type: 'DRAW_ELEMENT',
      element: restored,
    });
  };

  const handleClear = () => {
    if (elementsRef.current.length === 0) return;
    elementsRef.current = [];
    undoStackRef.current = [];
    redrawAllElements();
    broadcastPacket({ type: 'CLEAR' });
    toast.success('Whiteboard cleared');
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a temporary canvas with white background
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    tempCtx.fillStyle = '#ffffff';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(canvas, 0, 0);

    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
    toast.success('Whiteboard exported as PNG!');
  };

  return (
    <div className={`relative w-full h-full flex flex-col bg-white dark:bg-gray-900 overflow-hidden select-none ${
      isFullscreen ? 'fixed inset-0 z-50' : 'rounded-2xl shadow-xl border border-gray-200 dark:border-white/10'
    }`}>
      {/* ── Top Whiteboard Toolbar ── */}
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-150 dark:border-white/8 px-3 py-2 flex items-center justify-between gap-2 shrink-0 z-20 overflow-x-auto no-scrollbar">
        {/* Left: Tools & Shapes */}
        <div className="flex items-center gap-1">
          {/* Pen */}
          <button
            onClick={() => setActiveTool('pen')}
            className={`p-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
              activeTool === 'pen' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
            title="Pen / Marker"
          >
            <Pencil size={15} />
          </button>

          {/* Highlighter */}
          <button
            onClick={() => setActiveTool('highlighter')}
            className={`p-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
              activeTool === 'highlighter' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
            title="Highlighter"
          >
            <Highlighter size={15} />
          </button>

          {/* Eraser */}
          <button
            onClick={() => setActiveTool('eraser')}
            className={`p-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
              activeTool === 'eraser' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
            title="Eraser"
          >
            <Eraser size={15} />
          </button>

          <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-0.5" />

          {/* Rectangle */}
          <button
            onClick={() => setActiveTool('rectangle')}
            className={`p-1.5 rounded-xl transition cursor-pointer ${
              activeTool === 'rectangle' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
            title="Rectangle"
          >
            <Square size={15} />
          </button>

          {/* Circle */}
          <button
            onClick={() => setActiveTool('circle')}
            className={`p-1.5 rounded-xl transition cursor-pointer ${
              activeTool === 'circle' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
            title="Circle"
          >
            <Circle size={15} />
          </button>

          {/* Line */}
          <button
            onClick={() => setActiveTool('line')}
            className={`p-1.5 rounded-xl transition cursor-pointer ${
              activeTool === 'line' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
            title="Line"
          >
            <Minus size={15} />
          </button>

          {/* Arrow */}
          <button
            onClick={() => setActiveTool('arrow')}
            className={`p-1.5 rounded-xl transition cursor-pointer ${
              activeTool === 'arrow' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
            title="Arrow"
          >
            <MoveRight size={15} />
          </button>

          {/* Text */}
          <button
            onClick={() => setActiveTool('text')}
            className={`p-1.5 rounded-xl transition cursor-pointer ${
              activeTool === 'text' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
            title="Text Note"
          >
            <Type size={15} />
          </button>
        </div>

        {/* Center: Color Picker & Stroke Width */}
        <div className="flex items-center gap-1.5">
          {/* Color swatches */}
          <div className="flex items-center gap-1 bg-gray-50 dark:bg-white/5 p-1 rounded-xl border border-gray-150 dark:border-white/8">
            {PALETTE.map(c => (
              <button
                key={c}
                onClick={() => setSelectedColor(c)}
                className={`w-4 h-4 rounded-full transition-transform cursor-pointer border border-black/10 dark:border-white/20 ${
                  selectedColor === c ? 'scale-125 ring-2 ring-orange-500' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {/* Stroke Width Selector */}
          <div className="flex items-center gap-1 bg-gray-50 dark:bg-white/5 p-1 rounded-xl border border-gray-150 dark:border-white/8">
            {STROKE_WIDTHS.map(sw => (
              <button
                key={sw.value}
                onClick={() => setStrokeWidth(sw.value)}
                className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                  strokeWidth === sw.value ? 'bg-orange-500 text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {sw.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Undo, Redo, Clear, Export & Close */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleUndo}
            className="p-1.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition cursor-pointer"
            title="Undo"
          >
            <RotateCcw size={15} />
          </button>
          <button
            onClick={handleRedo}
            className="p-1.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition cursor-pointer"
            title="Redo"
          >
            <RotateCw size={15} />
          </button>

          <button
            onClick={handleClear}
            className="p-1.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
            title="Clear Whiteboard"
          >
            <Trash2 size={15} />
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 rounded-xl text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition cursor-pointer"
            title="Download as PNG"
          >
            <Download size={15} />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer ml-1"
              title="Close Whiteboard"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* ── Canvas Board Area ── */}
      <div className="relative flex-1 w-full h-full bg-white dark:bg-gray-950 cursor-crosshair overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          className="w-full h-full block"
        />

        {/* Text placement input */}
        {textInput && (
          <div
            className="absolute z-30"
            style={{ left: textInput.x, top: textInput.y }}
          >
            <input
              type="text"
              autoFocus
              placeholder="Type note & press Enter..."
              value={textInput.value}
              onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
              onKeyDown={handleTextSubmit}
              onBlur={() => setTextInput(null)}
              className="px-2 py-1 bg-white dark:bg-gray-900 border border-orange-500 rounded-lg text-xs font-bold text-gray-900 dark:text-white shadow-lg focus:outline-none"
              style={{ color: selectedColor }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
