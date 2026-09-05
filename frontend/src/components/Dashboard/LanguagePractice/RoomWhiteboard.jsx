import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Pencil, Highlighter, Eraser, Square, Circle,
  Minus, MoveRight, RotateCcw, RotateCw,
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
  { label: 'Fine', value: 2, dot: 4 },
  { label: 'Medium', value: 4, dot: 6 },
  { label: 'Thick', value: 8, dot: 9 },
  { label: 'Bold', value: 14, dot: 13 },
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

  // Drawing tools: 'pen' | 'highlighter' | 'eraser' | 'rectangle' | 'circle' | 'line' | 'arrow'
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
  const peerPreviewShapes = useRef(new Map()); // senderId -> shape element

  // Shapes in-progress
  const startPos = useRef({ x: 0, y: 0 });
  const snapshotRef = useRef(null);

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
    const participant = room?.localParticipant || localParticipant;
    if (!participant) return;
    try {
      const dataStr = JSON.stringify(payload);
      const encoder = new TextEncoder();
      const encoded = encoder.encode(dataStr);
      participant.publishData(encoded, {
        reliable,
        topic: 'whiteboard'
      }).catch(() => {
        // Fallback without topic for maximum compatibility
        participant.publishData(encoded, { reliable }).catch(() => {});
      });
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

  // State refs for stable event listeners without re-subscription churn
  const isHostRef = useRef(isHost);
  useEffect(() => { isHostRef.current = isHost; }, [isHost]);

  const drawPermissionModeRef = useRef(drawPermissionMode);
  useEffect(() => { drawPermissionModeRef.current = drawPermissionMode; }, [drawPermissionMode]);

  const customAllowedIdsRef = useRef(customAllowedIds);
  useEffect(() => { customAllowedIdsRef.current = customAllowedIds; }, [customAllowedIds]);

  // Robust Coordinate Converters: never produce NaN or blow up bounds
  const toX = (nx, x, w) => {
    if (typeof nx === 'number' && !isNaN(nx) && nx >= 0 && nx <= 1.05) return nx * w;
    if (typeof x === 'number' && !isNaN(x)) return x;
    return 0;
  };
  const toY = (ny, y, h) => {
    if (typeof ny === 'number' && !isNaN(ny) && ny >= 0 && ny <= 1.05) return ny * h;
    if (typeof y === 'number' && !isNaN(y)) return y;
    return 0;
  };
  const toW = (nw, rawW, w) => {
    if (typeof nw === 'number' && !isNaN(nw)) return nw * w;
    if (typeof rawW === 'number' && !isNaN(rawW)) return rawW;
    return 0;
  };
  const toH = (nh, rawH, h) => {
    if (typeof nh === 'number' && !isNaN(nh)) return nh * h;
    if (typeof rawH === 'number' && !isNaN(rawH)) return rawH;
    return 0;
  };

  // ── Draw Single Element onto Canvas ──────────────────────────────────────────
  const drawElement = useCallback((ctx, elem) => {
    if (!ctx || !elem) return;
    const canvas = canvasRef.current;
    const rect = canvas ? canvas.getBoundingClientRect() : { width: 1, height: 1 };
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);

    ctx.save();
    ctx.strokeStyle = elem.color || '#f97316';
    ctx.fillStyle = elem.color || '#f97316';
    ctx.lineWidth = elem.width || 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = elem.tool === 'highlighter' ? 0.35 : 1.0;

    if (elem.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = (elem.width || 4) * 2;
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }

    switch (elem.type) {
      case 'path':
        if (elem.points && elem.points.length > 0) {
          const p0 = elem.points[0];
          const x0 = toX(p0.nx, p0.x, w);
          const y0 = toY(p0.ny, p0.y, h);

          if (elem.points.length === 1) {
            // Draw single dot
            ctx.beginPath();
            ctx.arc(x0, y0, Math.max(1, (elem.width || 4) / 2), 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            for (let i = 1; i < elem.points.length; i++) {
              const pt = elem.points[i];
              ctx.lineTo(toX(pt.nx, pt.x, w), toY(pt.ny, pt.y, h));
            }
            ctx.stroke();
          }
        }
        break;

      case 'rectangle': {
        const x = toX(elem.nx, elem.x, w);
        const y = toY(elem.ny, elem.y, h);
        const rw = toW(elem.nw, elem.w, w);
        const rh = toH(elem.nh, elem.h, h);
        ctx.beginPath();
        ctx.strokeRect(x, y, rw, rh);
        break;
      }

      case 'circle': {
        const x = toX(elem.nx, elem.x, w);
        const y = toY(elem.ny, elem.y, h);
        const rw = toW(elem.nw, elem.w, w);
        const rh = toH(elem.nh, elem.h, h);
        ctx.beginPath();
        const rx = Math.abs(rw / 2);
        const ry = Math.abs(rh / 2);
        const cx = x + rw / 2;
        const cy = y + rh / 2;
        ctx.ellipse(cx, cy, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, 2 * Math.PI);
        ctx.stroke();
        break;
      }

      case 'line': {
        const x1 = toX(elem.nx1, elem.x1, w);
        const y1 = toY(elem.ny1, elem.y1, h);
        const x2 = toX(elem.nx2, elem.x2, w);
        const y2 = toY(elem.ny2, elem.y2, h);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        break;
      }

      case 'arrow': {
        const x1 = toX(elem.nx1, elem.x1, w);
        const y1 = toY(elem.ny1, elem.y1, h);
        const x2 = toX(elem.nx2, elem.x2, w);
        const y2 = toY(elem.ny2, elem.y2, h);
        const headlen = Math.max(10, (elem.width || 4) * 3);
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
        const x = toX(elem.nx, elem.x, w);
        const y = toY(elem.ny, elem.y, h);
        ctx.font = `${Math.max(14, (elem.width || 4) * 4)}px Inter, sans-serif`;
        ctx.fillText(elem.text, x, y);
        break;
      }

      default:
        break;
    }

    ctx.restore();
  }, []);

  // ── Redraw Canvas from Element History + Active Live Strokes ─────────────────
  const currentPath = useRef([]);
  const currentShapePreview = useRef(null);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const redrawAllElements = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    // 1. Draw committed elements in history
    elementsRef.current.forEach(elem => {
      drawElement(ctx, elem);
    });

    // 2. Draw in-progress local stroke if currently drawing with pen/highlighter/eraser
    if (currentPath.current && currentPath.current.length > 0) {
      drawElement(ctx, {
        type: 'path',
        tool: activeTool,
        color: selectedColor,
        width: strokeWidth,
        points: currentPath.current,
      });
    }

    // 3. Draw in-progress local shape preview if currently dragging shape
    if (currentShapePreview.current) {
      drawElement(ctx, currentShapePreview.current);
    }

    // 4. Draw in-progress live peer strokes
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

    // 5. Draw in-progress live peer shapes
    peerPreviewShapes.current.forEach(shape => {
      if (shape) {
        drawElement(ctx, shape);
      }
    });
  }, [drawElement, activeTool, selectedColor, strokeWidth]);

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
      try {
        const decoder = new TextDecoder();
        const message = JSON.parse(decoder.decode(payload));
        if (!message) return;

        // Accept if topic is whiteboard OR if message type is whiteboard-related
        const isWhiteboardMsg = topic === 'whiteboard' || [
          'STROKE_START', 'STROKE_CHUNK', 'STROKE_END',
          'SHAPE_PREVIEW', 'DRAW_ELEMENT', 'CLEAR', 'UNDO',
          'DRAW_PERMISSIONS_UPDATE', 'SYNC_REQUEST', 'SYNC_RESPONSE'
        ].includes(message.type);

        if (!isWhiteboardMsg) return;

        const senderId = participant?.identity || 'peer';

        switch (message.type) {
          // ⚡ Real-time Live Stroke Start
          case 'STROKE_START': {
            const initialPoints = message.point ? [message.point] : [];
            peerActiveStrokes.current.set(message.strokeId, {
              tool: message.tool || 'pen',
              color: message.color || '#f97316',
              width: message.width || 4,
              points: initialPoints,
            });

            // Immediately render starting dot on peer canvas
            if (message.point && contextRef.current) {
              const canvas = canvasRef.current;
              const rect = canvas ? canvas.getBoundingClientRect() : { width: 1, height: 1 };
              const w = Math.max(1, rect.width);
              const h = Math.max(1, rect.height);
              const x0 = toX(message.point.nx, message.point.x, w);
              const y0 = toY(message.point.ny, message.point.y, h);

              const ctx = contextRef.current;
              ctx.save();
              ctx.fillStyle = message.color || '#f97316';
              ctx.globalAlpha = message.tool === 'highlighter' ? 0.35 : 1.0;
              if (message.tool === 'eraser') {
                ctx.globalCompositeOperation = 'destination-out';
              }
              ctx.beginPath();
              ctx.arc(x0, y0, Math.max(1, (message.width || 4) / 2), 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
            break;
          }

          // ⚡ Real-time Live Stroke Streaming Chunk
          case 'STROKE_CHUNK': {
            let activeStroke = peerActiveStrokes.current.get(message.strokeId);
            if (!activeStroke) {
              activeStroke = {
                tool: message.tool || 'pen',
                color: message.color || '#f97316',
                width: message.width || 4,
                points: [],
              };
              peerActiveStrokes.current.set(message.strokeId, activeStroke);
            }

            if (Array.isArray(message.points) && message.points.length > 0) {
              const canvas = canvasRef.current;
              const ctx = contextRef.current;
              const rect = canvas ? canvas.getBoundingClientRect() : { width: 1, height: 1 };
              const w = Math.max(1, rect.width);
              const h = Math.max(1, rect.height);

              if (ctx) {
                const prev = activeStroke.points.length > 0
                  ? activeStroke.points[activeStroke.points.length - 1]
                  : message.points[0];

                const prevX = toX(prev.nx, prev.x, w);
                const prevY = toY(prev.ny, prev.y, h);

                ctx.save();
                ctx.strokeStyle = activeStroke.color;
                ctx.fillStyle = activeStroke.color;
                ctx.lineWidth = activeStroke.width;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.globalAlpha = activeStroke.tool === 'highlighter' ? 0.35 : 1.0;

                if (activeStroke.tool === 'eraser') {
                  ctx.globalCompositeOperation = 'destination-out';
                  ctx.lineWidth = activeStroke.width * 2;
                }

                ctx.beginPath();
                ctx.moveTo(prevX, prevY);

                for (let i = 0; i < message.points.length; i++) {
                  const pt = message.points[i];
                  const curX = toX(pt.nx, pt.x, w);
                  const curY = toY(pt.ny, pt.y, h);
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
              const elemId = message.element.id || message.element.strokeId;
              const exists = elemId && elementsRef.current.some(e => (e.id || e.strokeId) === elemId);
              if (!exists) {
                elementsRef.current.push(message.element);
              }
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
            if (message.element) {
              const elemId = message.element.id || message.element.strokeId;
              const exists = elemId && elementsRef.current.some(e => (e.id || e.strokeId) === elemId);
              if (!exists) {
                elementsRef.current.push(message.element);
              }
            }
            redrawAllElements();
            break;
          }

          case 'CLEAR': {
            elementsRef.current = [];
            undoStackRef.current = [];
            peerActiveStrokes.current.clear();
            peerPreviewShapes.current.clear();
            currentShapePreview.current = null;
            redrawAllElements();
            toast('Whiteboard was cleared', { icon: '🧹', id: 'board_cleared' });
            break;
          }

          case 'UNDO': {
            if (message.id) {
              elementsRef.current = elementsRef.current.filter(e => (e.id || e.strokeId) !== message.id);
            } else {
              elementsRef.current.pop();
            }
            redrawAllElements();
            break;
          }

          case 'DRAW_PERMISSIONS_UPDATE': {
            if (message.mode) setDrawPermissionMode(message.mode);
            if (Array.isArray(message.allowedIds)) setCustomAllowedIds(message.allowedIds);
            break;
          }

          // Answer SYNC_REQUEST if we have elements to share
          case 'SYNC_REQUEST': {
            if (elementsRef.current.length > 0) {
              broadcastPacket({
                type: 'SYNC_RESPONSE',
                elements: elementsRef.current,
                mode: drawPermissionModeRef.current,
                allowedIds: customAllowedIdsRef.current,
              }, true);
            }
            break;
          }

          // Safely merge existing elements on late join
          case 'SYNC_RESPONSE': {
            if (Array.isArray(message.elements) && message.elements.length > 0) {
              const existingIds = new Set(elementsRef.current.map(e => e.id || e.strokeId).filter(Boolean));
              const newItems = message.elements.filter(e => !(e.id || e.strokeId) || !existingIds.has(e.id || e.strokeId));
              if (elementsRef.current.length === 0) {
                elementsRef.current = message.elements;
              } else if (newItems.length > 0) {
                elementsRef.current = [...elementsRef.current, ...newItems];
              }
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
    room.on('dataReceived', handleDataReceived);

    // Request initial sync once upon mount
    broadcastPacket({ type: 'SYNC_REQUEST' }, true);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
      room.off('dataReceived', handleDataReceived);
    };
  }, [room, broadcastPacket, redrawAllElements, drawElement]);

  // ── Coordinates Helper (Accurate 1:1 Pixel Mapping for Touch & Mouse) ───────
  const getCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX = e?.clientX;
    let clientY = e?.clientY;

    if (e?.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e?.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    }

    if (typeof clientX !== 'number' || isNaN(clientX)) {
      clientX = lastMousePos.current.x + rect.left;
    }
    if (typeof clientY !== 'number' || isNaN(clientY)) {
      clientY = lastMousePos.current.y + rect.top;
    }

    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
    lastMousePos.current = { x, y };
    return { x, y };
  };

  // ── Mouse & Touch Event Handlers (High Performance Real-Time Streaming) ────
  const handleStart = (e) => {
    if (!canDraw) {
      toast('Host controls drawing permissions', { icon: '🔒', id: 'draw_restricted' });
      return;
    }
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
    const { x, y } = getCoords(e);
    const canvas = canvasRef.current;
    const rect = canvas ? canvas.getBoundingClientRect() : { width: 1, height: 1 };
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);

    startPos.current = { x, y };
    currentShapePreview.current = null;
    setIsDrawing(true);

    if (activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'eraser') {
      const strokeId = 'strk_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
      currentStrokeId.current = strokeId;
      const point = {
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        nx: Math.round((x / w) * 10000) / 10000,
        ny: Math.round((y / h) * 10000) / 10000,
      };
      currentPath.current = [point];
      strokeBuffer.current = [];
      lastBroadcastTime.current = performance.now();

      // Draw local starting point/dot immediately
      const ctx = contextRef.current;
      if (ctx) {
        ctx.save();
        ctx.fillStyle = selectedColor;
        ctx.globalAlpha = activeTool === 'highlighter' ? 0.35 : 1.0;
        if (activeTool === 'eraser') {
          ctx.globalCompositeOperation = 'destination-out';
        }
        ctx.beginPath();
        ctx.arc(x, y, Math.max(1, strokeWidth / 2), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // ⚡ Stream STROKE_START immediately to all peers reliably
      broadcastPacket({
        type: 'STROKE_START',
        strokeId,
        point,
        tool: activeTool,
        color: selectedColor,
        width: strokeWidth,
      }, true);
    }
  };

  const handleMove = (e) => {
    if (!canDraw || !isDrawing) return;
    const { x, y } = getCoords(e);
    const ctx = contextRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);

    if (activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'eraser') {
      const pt = {
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        nx: Math.round((x / w) * 10000) / 10000,
        ny: Math.round((y / h) * 10000) / 10000,
      };
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
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
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

      // ⚡ Stream STROKE_CHUNK to all peers every ~25ms with 100% reliability
      const now = performance.now();
      if (now - lastBroadcastTime.current >= 25 && strokeBuffer.current.length > 0) {
        broadcastPacket({
          type: 'STROKE_CHUNK',
          strokeId: currentStrokeId.current,
          tool: activeTool,
          color: selectedColor,
          width: strokeWidth,
          points: [...strokeBuffer.current],
        }, true);
        strokeBuffer.current = [];
        lastBroadcastTime.current = now;
      }
    } else if (['rectangle', 'circle', 'line', 'arrow'].includes(activeTool)) {
      // Create active shape element
      const dx = x - startPos.current.x;
      const dy = y - startPos.current.y;
      const shapeElem = {
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

      currentShapePreview.current = shapeElem;
      redrawAllElements();

      // ⚡ Stream live shape preview to peers every 35ms reliably
      const now = performance.now();
      if (now - lastShapeBroadcastTime.current >= 35) {
        broadcastPacket({
          type: 'SHAPE_PREVIEW',
          shape: shapeElem,
        }, true);
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
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);

    let newElement = null;

    if (activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'eraser') {
      if (currentPath.current.length > 0) {
        newElement = {
          id: currentStrokeId.current || ('el_' + Date.now()),
          type: 'path',
          strokeId: currentStrokeId.current,
          tool: activeTool,
          color: selectedColor,
          width: strokeWidth,
          points: [...currentPath.current],
        };
        currentPath.current = [];
      }

      // Flush remaining buffered points
      if (strokeBuffer.current.length > 0) {
        broadcastPacket({
          type: 'STROKE_CHUNK',
          strokeId: currentStrokeId.current,
          tool: activeTool,
          color: selectedColor,
          width: strokeWidth,
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
      
      const candidateShape = currentShapePreview.current || (
        (Math.abs(dx) > 3 || Math.abs(dy) > 3) ? {
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
        } : null
      );

      currentShapePreview.current = null;

      if (candidateShape && (Math.abs(candidateShape.w || 0) > 3 || Math.abs(candidateShape.h || 0) > 3 || Math.abs((candidateShape.x2 || 0) - (candidateShape.x1 || 0)) > 3 || Math.abs((candidateShape.y2 || 0) - (candidateShape.y1 || 0)) > 3)) {
        newElement = {
          ...candidateShape,
          id: 'shape_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        };

        elementsRef.current.push(newElement);
        undoStackRef.current = [];
        redrawAllElements();

        // ⚡ Clear preview on peers and commit element
        broadcastPacket({
          type: 'DRAW_ELEMENT',
          element: newElement,
        }, true);
        broadcastPacket({
          type: 'SHAPE_PREVIEW',
          shape: null,
        }, true);
      } else {
        redrawAllElements();
        broadcastPacket({
          type: 'SHAPE_PREVIEW',
          shape: null,
        }, true);
      }
    }
  };

  // ── Actions: Undo, Redo, Clear, Download ─────────────────────────────────────
  const handleUndo = () => {
    if (!canDraw || elementsRef.current.length === 0) return;
    const removed = elementsRef.current.pop();
    undoStackRef.current.push(removed);
    redrawAllElements();
    broadcastPacket({ type: 'UNDO', id: removed?.id || removed?.strokeId }, true);
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
      {/* ── Top Whiteboard Toolbar (Horizontally Scrollable & Unified Design) ── */}
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-150 dark:border-white/8 px-3 py-2 flex items-center justify-between gap-2.5 shrink-0 overflow-x-auto no-scrollbar scroll-smooth relative z-20">
        
        {/* Left: Tools & Shapes */}
        <div className="flex items-center gap-2 shrink-0 py-0.5">
          {canDraw ? (
            <>
              {/* Primary Drawing Tools */}
              <div className="flex items-center gap-1 bg-gray-100/90 dark:bg-white/5 p-1 rounded-2xl border border-gray-200/50 dark:border-white/10">
                <button
                  onClick={() => setActiveTool('pen')}
                  className={`w-7.5 h-7.5 rounded-xl transition flex items-center justify-center cursor-pointer ${
                    activeTool === 'pen'
                      ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/10'
                  }`}
                  title="Pen / Marker"
                >
                  <Pencil size={15} />
                </button>

                <button
                  onClick={() => setActiveTool('highlighter')}
                  className={`w-7.5 h-7.5 rounded-xl transition flex items-center justify-center cursor-pointer ${
                    activeTool === 'highlighter'
                      ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/10'
                  }`}
                  title="Highlighter"
                >
                  <Highlighter size={15} />
                </button>

                <button
                  onClick={() => setActiveTool('eraser')}
                  className={`w-7.5 h-7.5 rounded-xl transition flex items-center justify-center cursor-pointer ${
                    activeTool === 'eraser'
                      ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/10'
                  }`}
                  title="Eraser"
                >
                  <Eraser size={15} />
                </button>
              </div>

              {/* Shapes */}
              <div className="flex items-center gap-1 bg-gray-100/90 dark:bg-white/5 p-1 rounded-2xl border border-gray-200/50 dark:border-white/10">
                <button
                  onClick={() => setActiveTool('rectangle')}
                  className={`w-7.5 h-7.5 rounded-xl transition flex items-center justify-center cursor-pointer ${
                    activeTool === 'rectangle'
                      ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/10'
                  }`}
                  title="Rectangle"
                >
                  <Square size={15} />
                </button>

                <button
                  onClick={() => setActiveTool('circle')}
                  className={`w-7.5 h-7.5 rounded-xl transition flex items-center justify-center cursor-pointer ${
                    activeTool === 'circle'
                      ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/10'
                  }`}
                  title="Circle"
                >
                  <Circle size={15} />
                </button>

                <button
                  onClick={() => setActiveTool('line')}
                  className={`w-7.5 h-7.5 rounded-xl transition flex items-center justify-center cursor-pointer ${
                    activeTool === 'line'
                      ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/10'
                  }`}
                  title="Line"
                >
                  <Minus size={15} />
                </button>

                <button
                  onClick={() => setActiveTool('arrow')}
                  className={`w-7.5 h-7.5 rounded-xl transition flex items-center justify-center cursor-pointer ${
                    activeTool === 'arrow'
                      ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/10'
                  }`}
                  title="Arrow"
                >
                  <MoveRight size={15} />
                </button>
              </div>
            </>
          ) : (
            /* View Only Badge for non-drawers */
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-amber-600 dark:text-amber-400">
              <Lock size={13} className="animate-pulse" />
              <span className="text-xs font-bold">View Only</span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 hidden sm:inline">(Host controls drawing)</span>
            </div>
          )}
        </div>

        {/* Center: Color Picker & Stroke Width (if canDraw) + Host Permission Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {canDraw && (
            <>
              {/* Color Swatches */}
              <div className="flex items-center gap-1.5 bg-gray-100/90 dark:bg-white/5 p-1.5 rounded-2xl border border-gray-200/50 dark:border-white/10">
                {PALETTE.map(c => {
                  const isSelected = selectedColor === c;
                  return (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`w-5 h-5 rounded-full transition-all cursor-pointer relative flex items-center justify-center ${
                        isSelected 
                          ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 scale-105 shadow-sm' 
                          : 'hover:scale-110 opacity-90 hover:opacity-100'
                      } ${c === '#ffffff' ? 'border border-gray-300 dark:border-white/30' : ''}`}
                      style={{ backgroundColor: c }}
                      title={c}
                    >
                      {isSelected && (
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: c === '#ffffff' || c === '#f59e0b' ? '#000000' : '#ffffff' }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Stroke Width Selector */}
              <div className="flex items-center gap-1 bg-gray-100/90 dark:bg-white/5 p-1 rounded-2xl border border-gray-200/50 dark:border-white/10">
                {STROKE_WIDTHS.map(sw => (
                  <button
                    key={sw.value}
                    onClick={() => setStrokeWidth(sw.value)}
                    className={`h-7 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      strokeWidth === sw.value
                        ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/10'
                    }`}
                    title={`${sw.label} (${sw.value}px)`}
                  >
                    <span
                      className="rounded-full shrink-0"
                      style={{
                        width: `${sw.dot}px`,
                        height: `${sw.dot}px`,
                        backgroundColor: strokeWidth === sw.value ? '#ffffff' : (selectedColor === '#ffffff' ? '#9ca3af' : selectedColor),
                      }}
                    />
                    <span className="text-[11px] font-bold">{sw.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Host Drawing Permission Manager Trigger Button */}
          {isHost && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowPermissionMenu(prev => !prev);
              }}
              className="h-9 px-3 bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 shrink-0"
              title="Manage Whiteboard Drawing Permissions"
            >
              <Shield size={14} />
              <span className="hidden sm:inline">Drawing:</span>
              <span className="capitalize">
                {drawPermissionMode === 'host_only' ? 'Host Only' : drawPermissionMode === 'speakers' ? 'Speakers' : 'Everyone'}
              </span>
              <ChevronDown size={12} className={`transition-transform duration-200 ${showPermissionMenu ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        {/* Right: History (Undo/Redo/Clear) & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {canDraw && (
            /* History Controls */
            <div className="flex items-center gap-1 bg-gray-100/90 dark:bg-white/5 p-1 rounded-2xl border border-gray-200/50 dark:border-white/10">
              <button
                onClick={handleUndo}
                className="w-7.5 h-7.5 rounded-xl text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/10 transition flex items-center justify-center cursor-pointer"
                title="Undo"
              >
                <RotateCcw size={15} />
              </button>

              <button
                onClick={handleRedo}
                className="w-7.5 h-7.5 rounded-xl text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/10 transition flex items-center justify-center cursor-pointer"
                title="Redo"
              >
                <RotateCw size={15} />
              </button>

              <button
                onClick={handleClear}
                className="w-7.5 h-7.5 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition flex items-center justify-center cursor-pointer"
                title="Clear Whiteboard"
              >
                <Trash2 size={15} />
              </button>
            </div>
          )}

          {/* Utilities (Export, Fullscreen, Close) */}
          <div className="flex items-center gap-1 bg-gray-100/90 dark:bg-white/5 p-1 rounded-2xl border border-gray-200/50 dark:border-white/10">
            <button
              onClick={handleDownload}
              className="w-7.5 h-7.5 rounded-xl text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40 transition flex items-center justify-center cursor-pointer"
              title="Download PNG"
            >
              <Download size={15} />
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="w-7.5 h-7.5 rounded-xl text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/10 transition flex items-center justify-center cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="w-7.5 h-7.5 rounded-xl text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition flex items-center justify-center cursor-pointer"
                title="Close Whiteboard"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Unclipped Host Permission Menu Popover (Direct child of container) ── */}
      {showPermissionMenu && isHost && (
        <div 
          ref={permissionMenuRef}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-12 sm:top-14 right-3 w-72 bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl p-2.5 z-50 flex flex-col gap-1 backdrop-blur-2xl animate-in fade-in zoom-in-95 pointer-events-auto"
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
                <div className="text-xs font-bold">Host Only</div>
                <div className="text-[10px] text-gray-400 font-normal">Only you can draw</div>
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
                <div className="text-[10px] text-gray-400 font-normal">Host and speakers on stage</div>
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
