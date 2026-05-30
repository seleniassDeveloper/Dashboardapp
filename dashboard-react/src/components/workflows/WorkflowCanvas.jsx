import React, { useState, useRef, useEffect } from "react";
import WorkflowNode from "./WorkflowNode.jsx";
import { ZoomIn, ZoomOut, Maximize2, Compass } from "lucide-react";

export default function WorkflowCanvas({
  nodes = [],
  transitions = [],
  selectedNodeId,
  executingNodeId,
  onSelectNode,
  onDeleteNode,
  onUpdateNodePosition,
  onStartConnection,
  onCompleteConnection
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState(null);
  
  const canvasRef = useRef(null);
  const startPanRef = useRef({ x: 0, y: 0 });
  const startNodePosRef = useRef({ x: 0, y: 0 });
  const mouseStartRef = useRef({ x: 0, y: 0 });

  // Handle Zoom In/Out
  const handleZoomIn = () => setZoom(z => Math.min(1.8, z + 0.1));
  const handleZoomOut = () => setZoom(z => Math.max(0.5, z - 0.1));
  const handleZoomReset = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  // Node Drag Handlers
  const handleNodeDragStart = (e, nodeId) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    setDraggedNodeId(nodeId);
    startNodePosRef.current = { x: node.x, y: node.y };
    mouseStartRef.current = { x: e.clientX, y: e.clientY };
  };

  // Canvas Mouse Interaction (Panning & Dragging Nodes)
  const handleMouseMove = (e) => {
    if (draggedNodeId) {
      // Dragging specific node
      const dx = (e.clientX - mouseStartRef.current.x) / zoom;
      const dy = (e.clientY - mouseStartRef.current.y) / zoom;
      
      onUpdateNodePosition(
        draggedNodeId, 
        Math.round(startNodePosRef.current.x + dx), 
        Math.round(startNodePosRef.current.y + dy)
      );
    } else if (isPanning) {
      // Panning canvas background
      const dx = e.clientX - startPanRef.current.x;
      const dy = e.clientY - startPanRef.current.y;
      setPan({ x: startPanRef.current.panX + dx, y: startPanRef.current.panY + dy });
    }
  };

  const handleMouseUp = () => {
    setDraggedNodeId(null);
    setIsPanning(false);
  };

  const handleBgMouseDown = (e) => {
    if (e.button === 0 || e.button === 1) { // Left click or middle click
      setIsPanning(true);
      startPanRef.current = { 
        x: e.clientX, 
        y: e.clientY, 
        panX: pan.x, 
        panY: pan.y 
      };
    }
  };

  // Compute SVG Bézier Curves for connection lines between nodes
  const connectionPaths = React.useMemo(() => {
    const nodeMap = nodes.reduce((acc, n) => {
      acc[n.id] = n;
      return acc;
    }, {});

    const paths = [];

    transitions.forEach((tr, index) => {
      const source = nodeMap[tr.from];
      const target = nodeMap[tr.to];

      if (!source || !target) return;

      // Output coordinates
      let x1 = source.x + 250;
      let y1 = source.y + 40; // Vertical center of a 80px high node card
      
      // Handle YES/NO bifurcation coordinates for condition nodes
      if (source.type === "condition") {
        if (tr.conditionBranch === "no") {
          y1 = source.y + 60; // Bottom branch
        } else {
          y1 = source.y + 30; // Top branch
        }
      }

      // Input coordinates
      const x2 = target.x;
      const y2 = target.y + 40; // Vertical center

      // Control points for Bézier curve
      const dx = Math.max(80, Math.abs(x2 - x1) * 0.5);
      const cp1x = x1 + dx;
      const cp1y = y1;
      const cp2x = x2 - dx;
      const cp2y = y2;

      const d = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;

      let color = "url(#purpleGlow)";
      if (source.type === "condition") {
        color = tr.conditionBranch === "no" ? "#f87171" : "#34d399";
      }

      paths.push({
        id: tr.id || `path-${index}`,
        d,
        color,
        isActive: source.status === "ACTIVE" || true
      });
    });

    return paths;
  }, [nodes, transitions]);

  return (
    <div 
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseDown={handleBgMouseDown}
      className="position-relative w-100 h-100 overflow-hidden"
      style={{
        backgroundColor: "#f8fafc",
        cursor: isPanning ? "grabbing" : "grab",
        minHeight: "560px",
        borderRadius: "16px",
        boxShadow: "inset 0 2px 8px rgba(0,0,0,0.03)"
      }}
    >
      {/* INFINITE GRID PATTERN BACKGROUND */}
      <div 
        className="position-absolute w-100 h-100"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
          backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1.5px)",
          backgroundSize: "24px 24px"
        }}
      />

      {/* SVG CONNECTIONS LAYER */}
      <svg 
        className="position-absolute w-100 h-100 pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
          zIndex: 5,
          overflow: "visible"
        }}
      >
        <defs>
          <linearGradient id="purpleGlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <filter id="shadowGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#8b5cf6" floodOpacity="0.4" />
          </filter>
        </defs>

        {connectionPaths.map((path) => (
          <g key={path.id}>
            {/* Glowing connection shadow */}
            <path
              d={path.d}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="5"
              strokeOpacity="0.2"
            />
            {/* Main connection line */}
            <path
              d={path.d}
              fill="none"
              stroke={path.color || "url(#purpleGlow)"}
              strokeWidth="3"
              strokeLinecap="round"
              filter={path.isActive ? "url(#shadowGlow)" : undefined}
              className={path.isActive ? "animate-flow-dash" : ""}
              style={{
                strokeDasharray: path.isActive ? "8 6" : undefined,
                animation: path.isActive ? "flowAnimation 25s linear infinite" : undefined
              }}
            />
          </g>
        ))}
      </svg>

      {/* RENDER DYNAMIC ACTIVE NODES */}
      <div 
        className="position-absolute w-100 h-100 pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
          zIndex: 10
        }}
      >
        {nodes.map((node) => (
          <div key={node.id} className="pointer-events-auto">
            <WorkflowNode
              node={node}
              active={node.id === selectedNodeId}
              isExecuting={node.id === executingNodeId}
              onSelect={onSelectNode}
              onDelete={onDeleteNode}
              onDragStart={handleNodeDragStart}
            />
          </div>
        ))}
      </div>

      {/* FLOAT PAN AND ZOOM TOOLBAR */}
      <div 
        className="position-absolute d-flex flex-column gap-2 p-2 bg-white rounded-2xl shadow-lg border"
        style={{
          right: "20px",
          bottom: "20px",
          zIndex: 90
        }}
      >
        <button 
          onClick={handleZoomIn} 
          className="btn btn-light p-2 rounded-xl d-flex align-items-center justify-content-center hover-bg-gray-100 border-0"
          title="Acercar"
        >
          <ZoomIn size={16} className="text-gray-700" />
        </button>
        <button 
          onClick={handleZoomOut} 
          className="btn btn-light p-2 rounded-xl d-flex align-items-center justify-content-center hover-bg-gray-100 border-0"
          title="Alejar"
        >
          <ZoomOut size={16} className="text-gray-700" />
        </button>
        <button 
          onClick={handleZoomReset} 
          className="btn btn-light p-2 rounded-xl d-flex align-items-center justify-content-center hover-bg-gray-100 border-0"
          title="Centrar Canvas"
        >
          <Maximize2 size={16} className="text-gray-700" />
        </button>
      </div>

      {/* CANVAS NAVIGATION ASSIST CARD */}
      <div 
        className="position-absolute p-2.5 bg-white bg-opacity-80 backdrop-blur rounded-xl border small text-muted d-flex align-items-center gap-1.5"
        style={{
          left: "20px",
          bottom: "20px",
          zIndex: 90,
          fontSize: "11px"
        }}
      >
        <Compass size={13} className="text-gray-400" />
        <span>Click central + arrastre para mover lienzo • Zoom: Rueda</span>
      </div>

      {/* Canvas Connection Line dash keyframes styling */}
      <style>{`
        @keyframes flowAnimation {
          to {
            stroke-dashoffset: -100;
          }
        }
      `}</style>
    </div>
  );
}
