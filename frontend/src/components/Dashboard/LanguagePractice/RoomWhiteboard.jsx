import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Pencil, Highlighter, Eraser, Square, Circle,
  Minus, MoveRight, Type, RotateCcw, RotateCw,
  Trash2, Download, X, Maximize2, Minimize2,
  Lock, Unlock, Users, Globe, Shield, Check,
  ChevronDown, UserCheck, UserPlus, UserMinus, Sparkles
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

export default function RoomWhiteboard({
  room,
  localParticipant,
  isHost,
  canPublish = false,
  participants = [],
  onClose
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const contextRef = useRef(null);

  // Drawing tools: 'pen' | 'highlighter' | 'eraser' | 'rectangle' | 'circle' | 'line' | 'arrow' | 'text'
  const [activeTool, setActiveTool] = useState('pen');
  const [selectedColor, setSelectedColor] = useState('#f97316');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Permission Modes: 'speakers' (default) | 'host_only' | 'all'
  const [drawPermissionMode, setDrawPermissionMode] = useState('speakers');
  const [customAllowedIds, setCustomAllowedIds] = useState([]); // User identities explicitly allowed to draw
  const [showPermissionMenu, setShowPermissionMenu] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const permissionMenuRef = useRef(null);

  // Active stroke streaming & shape preview refs
  const currentStrokeId = useRef(null);
  const strokeBuffer = useRef([]);
  const lastBroadcastTime = useRef(0);
  const lastShapeBroadcastTime = useRef(0);
  const peerActiveStrokes = useRef(new Map()); // strokeId -> { tool, color, width, points }
  const peerPreviewShapes = useRef(new Map()); // participantId -> shape element

  // Shapes & text in-progress
  const startPos = useRef({ x: 0, y: 0 });
  const snapshotRef = useRef(null);
  const [textInput, setTextInput] = useState(null); // { x, y, value }

  // Action history for Undo/Redo & Late Joiner Sync
  const elementsRef = useRef([]);
  const undoStackRef = useRef([]);

  // Calculate if local user can draw
  const myIdentity = String(localParticipant?.identity || '');
  const canDraw = Boolean(
    isHost ||
    drawPermissionMode === 'all' ||
    (drawPermissionMode === 'speakers' && canPublish) ||
    customAllowedIds.includes(myIdentity)
  );

  // Click outside to close permission dropdown
  useEffect(() => {
    if (!showPermissionMenu) return;
    const handleClickOutside = (e) => {
      if (permissionMenuRef.current && !permissionMenuRef.current.contains(e.target)) {
        setShowPermissionMenu(false);
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }, 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showPermissionMenu]);

  // ── Helper: Broadcast packet over LiveKit Data Channel ───────────────────────
  const broadcastPacket = useCallback((payload, reliable = true) => {
    if (!room || !localParticipant) return;
    try {
      const dataStr = JSON.stringify(payload);
      const encoder = new TextEncoder();
      localParticipant.publishData(encoder.encode(dataStr), {
        reliable,
        topic: 'whiteboard'
      }).catch(err => console.error('Whiteboard publish error:', err));
    } catch (e) {
      console.error('Failed to broadcast whiteboard packet:', e);
    }
  }, [room, localParticipant]);

  // Host updates permission mode
  const handleSetPermissionMode = (mode) => {
    if (!isHost) return;
    setDrawPermissionMode(mode);
    setShowPermissionMenu(false);
    broadcastPacket({
      type: 'DRAW_PERMISSIONS_UPDATE',
      mode,
      allowedIds: customAllowedIds,
    }, true);
    const label = mode === 'host_only' ? 'Host Only' : mode === 'speakers' ? 'Stage Speakers' : 'Everyone';
    toast.success(`Whiteboard drawing set to: ${label}`);
  };

  // Host toggles individual participant permission
  const handleToggleUserPermission = (identity) => {
    if (!isHost) return;
    const idStr = String(identity);
    const updated = customAllowedIds.includes(idStr)
      ? customAllowedIds.filter(id => id !== idStr)
      : [...customAllowedIds, idStr];
    setCustomAllowedIds(updated);
    broadcastPacket({
      type: 'DRAW_PERMISSIONS_UPDATE',
      mode: drawPermissionMode,
      allowedIds: updated,
    }, true);
  };

  // ── Draw Single Element onto Canvas ──────────────────────────────────────────
  const drawElement = useCallback((ctx, elem) => {
    if (!ctx || !elem) return;
    const canvas = canvasRef.current;
    const rect = canvas ? canvas.getBoundingClientRect() : { width: 1, height: 1 };
    const w = rect.width || 1;
    const h = rect.height || 1;

    const toX = (nx, x) => (nx !== undefined ? nx * w : x);
    const toY = (ny, y) => (ny !== undefined ? ny * h : y);
    const toW = (nw, rawW) => (nw !== undefined ? nw * w : rawW);
    const toH = (nh, rawH) => (nh !== undefined ? nh * h : rawH);

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
          const p0 = elem.points[0];
          ctx.moveTo(toX(p0.nx, p0.x), toY(p0.ny, p0.y));
          for (let i = 1; i < elem.points.length; i++) {
            const pt = elem.points[i];
            ctx.lineTo(toX(pt.nx, pt.x), toY(pt.ny, pt.y));
          }
          ctx.stroke();
        }
        break;

      case 'rectangle': {
        const x = toX(elem.nx, elem.x);
        const y = toY(elem.ny, elem.y);
        const rw = toW(elem.nw, elem.w);
        const rh = toH(elem.nh, elem.h);
        ctx.beginPath();
        ctx.strokeRect(x, y, rw, rh);
        break;
      }

      case 'circle': {
        const x = toX(elem.nx, elem.x);
        const y = toY(elem.ny, elem.y);
        const rw = toW(elem.nw, elem.w);
        const rh = toH(elem.nh, elem.h);
        ctx.beginPath();
        const rx = Math.abs(rw / 2);
        const ry = Math.abs(rh / 2);
        const cx = x + rw / 2;
        const cy = y + rh / 2;
        ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        ctx.stroke();
        break;
      }

      case 'line': {
        const x1 = toX(elem.nx1, elem.x1);
        const y1 = toY(elem.ny1, elem.y1);
        const x2 = toX(elem.nx2, elem.x2);
        const y2 = toY(elem.ny2, elem.y2);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        break;
      }

      case 'arrow': {
        const x1 = toX(elem.nx1, elem.x1);
        const y1 = toY(elem.ny1, elem.y1);
        const x2 = toX(elem.nx2, elem.x2);
        const y2 = toY(elem.ny2, elem.y2);
        const headlen = Math.max(10, elem.width * 3);
        const angle = Math.atan2(y2 - y1, x2 - x1);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
        break;
      }

      case 'text': {
        const x = toX(elem.nx, elem.x);
        const y = toY(elem.ny, elem.y);
        ctx.font = `${Math.max(14, elem.width * 4)}px Inter, sans-serif`;
        ctx.fillText(elem.text, x, y);
        break;
      }

      default:
        break;
    }

    ctx.restore();
  }, []);

  // ── Redraw Canvas from Element History + Active Live Strokes ─────────────────
  const redrawAllElements = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    // 1. Draw committed elements
    elementsRef.current.forEach(elem => {
      drawElement(ctx, elem);
    });

    // 2. Draw in-progress live peer strokes
    peerActiveStrokes.current.forEach(stroke => {
      if (stroke.points && stroke.points.length > 0) {
        drawElement(ctx, {
          type: 'path',
          tool: stroke.tool,
          color: stroke.color,
          width: stroke.width,
          points: stroke.points,
        });
      }
    });

    // 3. Draw in-progress live peer shapes
    peerPreviewShapes.current.forEach(shape => {
      if (shape) {
        drawElement(ctx, shape);
      }
    });
  }, [drawElement]);

  // ── Initialize & Resize Canvas Accurately ────────────────────────────────────
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const dpr = window.devicePixelRatio || 1;

    // Buffer dimensions (high-DPI crispness)
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    // CSS dimensions strictly locked to rendered container pixels
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    // Reset transform before scaling by DPR
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    contextRef.current = ctx;

    redrawAllElements();
  }, [redrawAllElements]);

  // Auto observe resize with ResizeObserver
  useEffect(() => {
    setupCanvas();
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      setupCanvas();
    });
    resizeObserver.observe(container);

    window.addEventListener('resize', setupCanvas);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', setupCanvas);
    };
  }, [setupCanvas]);

  // ── LiveKit Real-Time WebRTC Data Event Listener ────────────────────────────
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload, participant, kind, topic) => {
      if (topic !== 'whiteboard') return;
      try {
        const decoder = new TextDecoder();
        const message = JSON.parse(decoder.decode(payload));
        const senderId = participant?.identity || 'peer';

        switch (message.type) {
          // ⚡ Real-time Live Stroke Start
          case 'STROKE_START': {
            peerActiveStrokes.current.set(message.strokeId, {
              tool: message.tool,
              color: message.color,
              width: message.width,
              points: [message.point],
            });
            break;
          }

          // ⚡ Real-time Live Stroke Streaming Chunk
          case 'STROKE_CHUNK': {
            const activeStroke = peerActiveStrokes.current.get(message.strokeId);
            if (activeStroke && Array.isArray(message.points)) {
              const canvas = canvasRef.current;
              const ctx = contextRef.current;
              const rect = canvas ? canvas.getBoundingClientRect() : { width: 1, height: 1 };
              const w = rect.width || 1;
              const h = rect.height || 1;

              // Draw new segment directly to canvas without full clear (zero overhead)
              if (ctx && activeStroke.points.length > 0) {
                const prev = activeStroke.points[activeStroke.points.length - 1];
                const prevX = prev.nx !== undefined ? prev.nx * w : prev.x;
                const prevY = prev.ny !== undefined ? prev.ny * h : prev.y;

                ctx.save();
                ctx.strokeStyle = activeStroke.color;
                ctx.lineWidth = activeStroke.width;
                ctx.globalAlpha = activeStroke.tool === 'highlighter' ? 0.35 : 1.0;

                if (activeStroke.tool === 'eraser') {
                  ctx.globalCompositeOperation = 'destination-out';
                  ctx.lineWidth = activeStroke.width * 2;
                }

                ctx.beginPath();
                ctx.moveTo(prevX, prevY);

                for (let i = 0; i < message.points.length; i++) {
                  const pt = message.points[i];
                  const curX = pt.nx !== undefined ? pt.nx * w : pt.x;
                  const curY = pt.ny !== undefined ? pt.ny * h : pt.y;
                  ctx.lineTo(curX, curY);
                  activeStroke.points.push(pt);
                }

                ctx.stroke();
                ctx.restore();
              } else {
                activeStroke.points.push(...message.points);
              }
            }
            break;
          }

          // ⚡ Real-time Live Stroke Completion
          case 'STROKE_END': {
            peerActiveStrokes.current.delete(message.strokeId);
            if (message.element) {
              elementsRef.current.push(message.element);
            }
            redrawAllElements();
            break;
          }

          // ⚡ Live Shape Drag Preview
          case 'SHAPE_PREVIEW': {
            if (message.shape) {
              peerPreviewShapes.current.set(senderId, message.shape);
            } else {
              peerPreviewShapes.current.delete(senderId);
            }
            redrawAllElements();
            break;
          }

          // Direct element draw
          case 'DRAW_ELEMENT': {
            peerPreviewShapes.current.delete(senderId);
            elementsRef.current.push(message.element);
            if (contextRef.current) {
              drawElement(contextRef.current, message.element);
            }
            break;
          }

          case 'CLEAR': {
            elementsRef.current = [];
            undoStackRef.current = [];
            peerActiveStrokes.current.clear();
            peerPreviewShapes.current.clear();
            redrawAllElements();
            break;
          }

          case 'UNDO': {
            elementsRef.current.pop();
            redrawAllElements();
            break;
          }

          case 'DRAW_PERMISSIONS_UPDATE': {
            if (message.mode) setDrawPermissionMode(message.mode);
            if (Array.isArray(message.allowedIds)) setCustomAllowedIds(message.allowedIds);
            break;
          }

          // ONLY Host answers SYNC_REQUEST to prevent multi-peer storm
          case 'SYNC_REQUEST': {
            if (isHost) {
              broadcastPacket({
                type: 'SYNC_RESPONSE',
                elements: elementsRef.current,
                mode: drawPermissionMode,
                allowedIds: customAllowedIds,
              }, true);
            }
            break;
          }

          case 'SYNC_RESPONSE': {
            if (message.elements && Array.isArray(message.elements)) {
              elementsRef.current = message.elements;
              redrawAllElements();
            }
            if (message.mode) {
              setDrawPermissionMode(message.mode);
            }
            if (Array.isArray(message.allowedIds)) {
              setCustomAllowedIds(message.allowedIds);
            }
            break;
          }

          default:
            break;
        }
      } catch (err) {
        console.error('Error handling whiteboard packet:', err);
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);

    // Request initial sync from host
    broadcastPacket({ type: 'SYNC_REQUEST' }, true);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, isHost, drawPermissionMode, customAllowedIds, broadcastPacket, redrawAllElements, drawElement]);

  // ── Coordinates Helper (Accurate 1:1 Pixel Mapping) ──────────────────────────
  const getCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
    return {
      x: Math.max(0, Math.min(rect.width, clientX - rect.left)),
      y: Math.max(0, Math.min(rect.height, clientY - rect.top)),
    };
  };

  // ── Mouse & Touch Event Handlers (High Performance Streaming) ───────────────
  const currentPath = useRef([]);

  const handleStart = (e) => {
    if (!canDraw) {
      toast('Host controls drawing permissions', { icon: '🔒', id: 'draw_restricted' });
      return;
    }
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
    const { x, y } = getCoords(e);
    const canvas = canvasRef.current;
    const rect = canvas ? canvas.getBoundingClientRect() : { width: 1, height: 1 };
    const w = rect.width || 1;
    const h = rect.height || 1;

    startPos.current = { x, y };
    setIsDrawing(true);

    if (activeTool === 'text') {
      setTextInput({ x, y, value: '' });
      setIsDrawing(false);
      return;
    }

    if (activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'eraser') {
      const strokeId = 'strk_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
      currentStrokeId.current = strokeId;
      const point = { x, y, nx: x / w, ny: y / h };
      currentPath.current = [point];
      strokeBuffer.current = [];
      lastBroadcastTime.current = performance.now();

      // ⚡ Stream STROKE_START immediately to all peers
      broadcastPacket({
        type: 'STROKE_START',
        strokeId,
        point,
        tool: activeTool,
        color: selectedColor,
        width: strokeWidth,
      }, true);
    } else {
      // Shape snapshot
      if (canvas) {
        snapshotRef.current = canvas.toDataURL();
      }
    }
  };

  const handleMove = (e) => {
    if (!canDraw || !isDrawing) return;
    const { x, y } = getCoords(e);
    const ctx = contextRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || 1;
    const h = rect.height || 1;

    if (activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'eraser') {
      const pt = { x, y, nx: x / w, ny: y / h };
      currentPath.current.push(pt);
      strokeBuffer.current.push(pt);

      const len = currentPath.current.length;
      if (len >= 2) {
        const p1 = currentPath.current[len - 2];
        const p2 = currentPath.current[len - 1];

        // Draw locally immediately (60fps)
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

      // ⚡ Stream STROKE_CHUNK to all peers every ~25ms
      const now = performance.now();
      if (now - lastBroadcastTime.current >= 25 && strokeBuffer.current.length > 0) {
        broadcastPacket({
          type: 'STROKE_CHUNK',
          strokeId: currentStrokeId.current,
          points: [...strokeBuffer.current],
        }, false);
        strokeBuffer.current = [];
        lastBroadcastTime.current = now;
      }
    } else {
      // Preview shape locally
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
        nx: startPos.current.x / w,
        ny: startPos.current.y / h,
        nw: (x - startPos.current.x) / w,
        nh: (y - startPos.current.y) / h,
        x1: startPos.current.x,
        y1: startPos.current.y,
        x2: x,
        y2: y,
        nx1: startPos.current.x / w,
        ny1: startPos.current.y / h,
        nx2: x / w,
        ny2: y / h,
      };
      drawElement(ctx, elem);

      // ⚡ Stream live shape preview to peers every 40ms
      const now = performance.now();
      if (now - lastShapeBroadcastTime.current >= 40) {
        broadcastPacket({
          type: 'SHAPE_PREVIEW',
          shape: elem,
        }, false);
        lastShapeBroadcastTime.current = now;
      }
    }
  };

  const handleEnd = (e) => {
    if (!canDraw || !isDrawing) return;
    setIsDrawing(false);
    const { x, y } = getCoords(e);
    const canvas = canvasRef.current;
    const rect = canvas ? canvas.getBoundingClientRect() : { width: 1, height: 1 };
    const w = rect.width || 1;
    const h = rect.height || 1;

    let newElement = null;

    if (activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'eraser') {
      if (currentPath.current.length > 0) {
        newElement = {
          type: 'path',
          strokeId: currentStrokeId.current,
          tool: activeTool,
          color: selectedColor,
          width: strokeWidth,
          points: [...currentPath.current],
        };
        currentPath.current = [];
      }

      // Flush remaining points
      if (strokeBuffer.current.length > 0) {
        broadcastPacket({
          type: 'STROKE_CHUNK',
          strokeId: currentStrokeId.current,
          points: [...strokeBuffer.current],
        }, true);
        strokeBuffer.current = [];
      }

      if (newElement) {
        elementsRef.current.push(newElement);
        undoStackRef.current = [];
        redrawAllElements();

        // ⚡ Commit final STROKE_END to peers
        broadcastPacket({
          type: 'STROKE_END',
          strokeId: currentStrokeId.current,
          element: newElement,
        }, true);
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
          nx: startPos.current.x / w,
          ny: startPos.current.y / h,
          nw: dx / w,
          nh: dy / h,
          x1: startPos.current.x,
          y1: startPos.current.y,
          x2: x,
          y2: y,
          nx1: startPos.current.x / w,
          ny1: startPos.current.y / h,
          nx2: x / w,
          ny2: y / h,
        };

        elementsRef.current.push(newElement);
        undoStackRef.current = [];
        redrawAllElements();

        // Clear preview & commit element
        broadcastPacket({
          type: 'DRAW_ELEMENT',
          element: newElement,
        }, true);
      } else {
        broadcastPacket({
          type: 'SHAPE_PREVIEW',
          shape: null,
        }, true);
      }
    }
  };

  // ── Text Input Submission ────────────────────────────────────────────────────
  const handleTextSubmit = (e) => {
    if (e.key === 'Enter' && textInput && textInput.value.trim()) {
      const canvas = canvasRef.current;
      const rect = canvas ? canvas.getBoundingClientRect() : { width: 1, height: 1 };
      const w = rect.width || 1;
      const h = rect.height || 1;

      const newElem = {
        type: 'text',
        tool: 'text',
        color: selectedColor,
        width: strokeWidth,
        text: textInput.value.trim(),
        x: textInput.x,
        y: textInput.y,
        nx: textInput.x / w,
        ny: textInput.y / h,
      };

      elementsRef.current.push(newElem);
      undoStackRef.current = [];
      redrawAllElements();
      broadcastPacket({
        type: 'DRAW_ELEMENT',
        element: newElem,
      }, true);
      setTextInput(null);
    } else if (e.key === 'Escape') {
      setTextInput(null);
    }
  };

  // ── Actions: Undo, Redo, Clear, Download ─────────────────────────────────────
  const handleUndo = () => {
    if (!canDraw || elementsRef.current.length === 0) return;
    const removed = elementsRef.current.pop();
    undoStackRef.current.push(removed);
    redrawAllElements();
    broadcastPacket({ type: 'UNDO' }, true);
  };

  const handleRedo = () => {
    if (!canDraw || undoStackRef.current.length === 0) return;
    const restored = undoStackRef.current.pop();
    elementsRef.current.push(restored);
    redrawAllElements();
    broadcastPacket({
      type: 'DRAW_ELEMENT',
      element: restored,
    }, true);
  };

  const handleClear = () => {
    if (!canDraw || elementsRef.current.length === 0) return;
    elementsRef.current = [];
    undoStackRef.current = [];
    peerActiveStrokes.current.clear();
    peerPreviewShapes.current.clear();
    redrawAllElements();
    broadcastPacket({ type: 'CLEAR' }, true);
    toast.success('Whiteboard cleared');
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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

  // Participant list for individual permission management
  const allParticipantsList = [
    localParticipant,
    ...(Array.isArray(participants) ? participants : [])
  ].filter(Boolean);

  return (
    <div className={`relative w-full h-full flex flex-col bg-white dark:bg-gray-900 overflow-hidden select-none ${
      isFullscreen ? 'fixed inset-0 z-50' : 'rounded-2xl shadow-xl border border-gray-200 dark:border-white/10'
    }`}>
      {/* ── Top Whiteboard Toolbar ── */}
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-150 dark:border-white/8 px-3 py-2 flex items-center justify-between gap-2 shrink-0 z-30 relative">
        
        {/* Left: Tools & Shapes OR View-Only Status */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {canDraw ? (
            <>
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
            </>
          ) : (
            /* View Only Badge for non-drawers */
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/25 rounded-xl text-amber-600 dark:text-amber-400">
              <Lock size={13} className="animate-pulse" />
              <span className="text-xs font-bold">View Only</span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 hidden sm:inline">(Host controls drawing)</span>
            </div>
          )}
        </div>

        {/* Center: Color Picker & Stroke Width (if canDraw) OR Host Permission Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {canDraw && (
            <>
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
            </>
          )}

          {/* Host Drawing Permission Manager Menu */}
          {isHost && (
            <div className="relative" ref={permissionMenuRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPermissionMenu(prev => !prev);
                }}
                className="px-2.5 py-1 bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                title="Manage Whiteboard Drawing Permissions"
              >
                <Shield size={13} />
                <span className="hidden sm:inline">Drawing:</span>
                <span className="capitalize">
                  {drawPermissionMode === 'host_only' ? 'Host Only' : drawPermissionMode === 'speakers' ? 'Speakers' : 'Everyone'}
                </span>
                <ChevronDown size={12} className={`transition-transform duration-200 ${showPermissionMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu (Positioned safely over canvas) */}
              {showPermissionMenu && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl p-2.5 z-50 flex flex-col gap-1 backdrop-blur-2xl animate-in fade-in zoom-in-95 pointer-events-auto"
                >
                  <div className="px-2.5 py-1.5 border-b border-gray-100 dark:border-white/5 mb-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      Who Can Draw?
                    </span>
                  </div>

                  {/* Mode 1: Host Only */}
                  <button
                    onClick={() => handleSetPermissionMode('host_only')}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition cursor-pointer ${
                      drawPermissionMode === 'host_only'
                        ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/20'
                        : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500">
                        <Lock size={15} />
                      </div>
                      <div>
                        <div className="text-xs font-bold">Only Host</div>
                        <div className="text-[10px] text-gray-400 font-normal">Students watch while you teach</div>
                      </div>
                    </div>
                    {drawPermissionMode === 'host_only' && <Check size={14} className="text-orange-500 shrink-0" />}
                  </button>

                  {/* Mode 2: Stage Speakers */}
                  <button
                    onClick={() => handleSetPermissionMode('speakers')}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition cursor-pointer ${
                      drawPermissionMode === 'speakers'
                        ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/20'
                        : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                        <Users size={15} />
                      </div>
                      <div>
                        <div className="text-xs font-bold">Stage Speakers</div>
                        <div className="text-[10px] text-gray-400 font-normal">Host & speakers on stage</div>
                      </div>
                    </div>
                    {drawPermissionMode === 'speakers' && <Check size={14} className="text-orange-500 shrink-0" />}
                  </button>

                  {/* Mode 3: Everyone */}
                  <button
                    onClick={() => handleSetPermissionMode('all')}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition cursor-pointer ${
                      drawPermissionMode === 'all'
                        ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/20'
                        : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                        <Globe size={15} />
                      </div>
                      <div>
                        <div className="text-xs font-bold">Everyone in Room</div>
                        <div className="text-[10px] text-gray-400 font-normal">Open collaboration for all</div>
                      </div>
                    </div>
                    {drawPermissionMode === 'all' && <Check size={14} className="text-orange-500 shrink-0" />}
                  </button>

                  {/* Manage Specific Individuals */}
                  <div className="pt-1 mt-1 border-t border-gray-100 dark:border-white/5">
                    <button
                      onClick={() => {
                        setShowPermissionMenu(false);
                        setShowManageModal(true);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <UserCheck size={15} className="text-purple-500" />
                        <span className="text-xs font-bold">Manage Students...</span>
                      </div>
                      {customAllowedIds.length > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-full">
                          {customAllowedIds.length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Undo, Redo, Clear, Export & Close */}
        <div className="flex items-center gap-1 shrink-0">
          {canDraw && (
            <>
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
            </>
          )}

          <button
            onClick={handleDownload}
            className="p-1.5 rounded-xl text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition cursor-pointer"
            title="Download Notes as PNG"
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
      <div
        ref={containerRef}
        className={`relative flex-1 w-full h-full bg-white dark:bg-gray-950 overflow-hidden touch-none ${
          canDraw ? 'cursor-crosshair' : 'cursor-default'
        }`}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          className="absolute inset-0 block w-full h-full"
        />

        {/* Text placement input */}
        {textInput && canDraw && (
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

      {/* ── Manage Individual Participants Drawing Modal (Host Only) ── */}
      {showManageModal && isHost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-white/10 p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-500/10 text-purple-500 rounded-xl">
                  <UserCheck size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white">Individual Drawing Access</h3>
                  <p className="text-[11px] text-gray-500">Toggle drawing access per student</p>
                </div>
              </div>
              <button
                onClick={() => setShowManageModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-xl cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* List of room participants */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {allParticipantsList.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400">No other participants in room</div>
              ) : (
                allParticipantsList.map(p => {
                  const idStr = String(p.identity);
                  const isUserHost = isHost && p.isLocal;
                  const isExplicitlyAllowed = customAllowedIds.includes(idStr);
                  const isSpeaker = p.permissions?.canPublish;
                  const hasAccess = isUserHost || isExplicitlyAllowed || drawPermissionMode === 'all' || (drawPermissionMode === 'speakers' && isSpeaker);

                  return (
                    <div
                      key={p.identity}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-150 dark:border-white/5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 font-black text-xs flex items-center justify-center shrink-0">
                          {(p.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-gray-900 dark:text-white truncate">
                            {p.name || 'Participant'} {p.isLocal ? '(You)' : ''}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {isUserHost ? 'Host' : isSpeaker ? 'Speaker' : 'Audience'}
                          </div>
                        </div>
                      </div>

                      {/* Toggle button (disabled for host) */}
                      {isUserHost ? (
                        <span className="text-[10px] font-black text-orange-500 px-2 py-0.5 bg-orange-500/10 rounded-lg">Host</span>
                      ) : (
                        <button
                          onClick={() => handleToggleUserPermission(p.identity)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                            isExplicitlyAllowed
                              ? 'bg-purple-600 text-white shadow-sm'
                              : hasAccess
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600'
                          }`}
                        >
                          {isExplicitlyAllowed ? (
                            <>
                              <Check size={12} />
                              <span>Allowed</span>
                            </>
                          ) : hasAccess ? (
                            <>
                              <span>Allowed via Mode</span>
                            </>
                          ) : (
                            <>
                              <UserPlus size={12} />
                              <span>Allow</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <button
              onClick={() => setShowManageModal(false)}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-extrabold transition cursor-pointer shadow-md"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
