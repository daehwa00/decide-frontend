import { useRef, useEffect, useMemo, useState } from 'react';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';

import { Candidate, Person } from '@/types';
import { MOCK_PEOPLE, MOCK_EDGES } from '@/services/mockData';

interface GraphCanvasProps {
  selectedCandidates: Candidate[];
}

export function GraphCanvas({ selectedCandidates }: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ForceGraphMethods>();
  const [dimensions, setDimensions] = useState({ w: 800, h: 600 });
  const [activeNode, setActiveNode] = useState<Person | null>(null);
  const hoveredIdRef = useRef<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const zoomedRef = useRef<string>('');

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        w: containerRef.current.clientWidth,
        h: containerRef.current.clientHeight
      });
    }
  }, []); // Simple mount resize

  useEffect(() => {
    const animate = () => {
      // graphRef.current?.refresh();
      rafRef.current = window.requestAnimationFrame(animate);
    };
    rafRef.current = window.requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);



  const selectedIds = useMemo(() => new Set(selectedCandidates.map(c => c.id)), [selectedCandidates]);
  const selectedById = useMemo(() => {
    return new Map(selectedCandidates.map(candidate => [candidate.id, candidate]));
  }, [selectedCandidates]);

  useEffect(() => {
    const key = selectedCandidates.map(candidate => candidate.id).sort().join('|');
    if (!key || zoomedRef.current === key) {
      return;
    }
    zoomedRef.current = key;
    const timer = window.setTimeout(() => {
      graphRef.current?.zoomToFit(900, 90, (node: any) => selectedIds.has(node.id));
    }, 450);
    return () => window.clearTimeout(timer);
  }, [selectedCandidates, selectedIds]);

  const adjacency = useMemo(() => {
    const map = new Map<string, Set<string>>();
    MOCK_EDGES.forEach(edge => {
      if (!map.has(edge.source)) {
        map.set(edge.source, new Set());
      }
      if (!map.has(edge.target)) {
        map.set(edge.target, new Set());
      }
      map.get(edge.source)?.add(edge.target);
      map.get(edge.target)?.add(edge.source);
    });
    return map;
  }, []);

  const nodes = useMemo(() => {
    return MOCK_PEOPLE.map(p => ({
      group: p.org_path.split('/')[1], // Dept color
      val: selectedIds.has(p.id) ? 20 : 5, // Size
      color: selectedIds.has(p.id) ? '#ffffff' : undefined,
      ...p
    }));
  }, [selectedIds]);

  const links = useMemo(() => {
    return MOCK_EDGES.map(e => ({
      source: e.source,
      target: e.target,
      color: e.type === 'risk' ? '#ef4444' : '#3b82f6'
    }));
  }, []);

  const getNodeId = (node: any) => {
    if (typeof node === 'string') return node;
    return node?.id ?? '';
  };

  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  return (
    <div ref={containerRef} className="w-full h-[600px] border rounded-lg overflow-hidden bg-slate-950 relative">
       <ForceGraph2D
          ref={graphRef}
          width={dimensions.w}
          height={dimensions.h}
          graphData={{ nodes, links }}
          nodeLabel="name"
          nodeAutoColorBy="group"
          cooldownTicks={Infinity}
          d3AlphaDecay={0.005}
          d3VelocityDecay={0.2}
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={() => 0.005} // Slow particles
          backgroundColor="#020617" // slate-950
          onNodeHover={node => {
            const nextId = node ? (node as Person).id : null;
            if (hoveredIdRef.current !== nextId) {
              hoveredIdRef.current = nextId;
              // graphRef.current?.refresh();
            }
          }}
          nodeCanvasObject={(node: any, ctx, globalScale) => {
            const isSelected = selectedIds.has(node.id);
            const hoveredId = hoveredIdRef.current;
            const hoveredNeighbors = hoveredId ? adjacency.get(hoveredId) : null;
            const isNeighbor = hoveredId ? (hoveredNeighbors?.has(node.id) || node.id === hoveredId) : true;
            const shouldDim = hoveredId ? !isNeighbor : false;
            const label = node.name;
            const fontSize = 13 / globalScale;
            const now = performance.now();
            const pulse = isSelected ? (Math.sin(now / 260) + 1) / 2 : 0;
            
            // Draw Node
            const r = isSelected ? 10 + pulse * 3 : 4;
            ctx.beginPath();
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
            ctx.fillStyle = isSelected ? '#ffffff' : node.color || '#444';
            ctx.globalAlpha = shouldDim ? 0.15 : 1;
            ctx.shadowBlur = isSelected ? 18 : ctx.shadowBlur;
            ctx.shadowColor = isSelected ? '#60a5fa' : ctx.shadowColor;
            if (isSelected || (hoveredId && isNeighbor)) {
              ctx.shadowColor = '#3b82f6';
              ctx.shadowBlur = 12;
            } else {
              ctx.shadowBlur = 0;
            }
            ctx.fill();
            ctx.globalAlpha = 1;
            if (isSelected) {
               ctx.strokeStyle = '#3b82f6';
               ctx.lineWidth = 2;
               ctx.stroke();

               ctx.beginPath();
               ctx.arc(node.x, node.y, r + 6 + pulse * 8, 0, 2 * Math.PI, false);
               ctx.strokeStyle = 'rgba(59, 130, 246, 0.7)';
               ctx.lineWidth = 2;
               ctx.globalAlpha = 0.7 - pulse * 0.4;
               ctx.stroke();
               ctx.globalAlpha = 1;
            }

            // Draw Label for selected or hovered
            if (isSelected || (hoveredId && isNeighbor) || globalScale > 2.2) {
               ctx.font = `${fontSize}px Sans-Serif`;
               ctx.textAlign = 'center';
               ctx.textBaseline = 'middle';
               const textY = node.y + r + fontSize + 4;
               if (isSelected) {
                 const padding = 4;
                 const textWidth = ctx.measureText(label).width;
                 ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
                 const rectX = node.x - textWidth / 2 - padding;
                 const rectY = textY - fontSize / 2 - padding;
                 const rectW = textWidth + padding * 2;
                 const rectH = fontSize + padding * 2;
                 if (typeof (ctx as any).roundRect === 'function') {
                   ctx.beginPath();
                   (ctx as any).roundRect(rectX, rectY, rectW, rectH, 6);
                   ctx.fill();
                 } else {
                   drawRoundedRect(ctx, rectX, rectY, rectW, rectH, 6);
                   ctx.fill();
                 }
               }
               ctx.fillStyle = isSelected ? '#ffffff' : 'rgba(255,255,255,0.6)';
               ctx.fillText(label, node.x, textY);
            }
          }}
          onNodeClick={node => {
            // Center view on node
            graphRef.current?.centerAt(node.x, node.y, 1000);
            graphRef.current?.zoom(3, 2000);
            setActiveNode(node as Person);
          }}
          onBackgroundClick={() => setActiveNode(null)}
          linkColor={link => {
            const hoveredId = hoveredIdRef.current;
            if (!hoveredId) return (link as any).color;
            const sourceId = getNodeId((link as any).source);
            const targetId = getNodeId((link as any).target);
            const hoveredNeighbors = adjacency.get(hoveredId) ?? new Set();
            const isConnected =
              (hoveredNeighbors.has(sourceId) || sourceId === hoveredId) &&
              (hoveredNeighbors.has(targetId) || targetId === hoveredId);
            return isConnected ? (link as any).color : 'rgba(148, 163, 184, 0.15)';
          }}
        />
        <div className="absolute top-4 left-4 bg-black/50 p-2 rounded text-xs text-white">
           그래프 모드: 클러스터 뷰 (1200 노드) · 노드에 마우스를 올려보세요
        </div>
        {activeNode && (
          <div className="absolute bottom-4 left-4 max-w-xs rounded-lg border border-white/10 bg-slate-900/90 p-3 text-white shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{activeNode.name}</p>
                <p className="text-xs text-slate-300">{activeNode.role} · {activeNode.org_path}</p>
              </div>
              <button
                type="button"
                className="text-xs text-slate-300 hover:text-white"
                onClick={() => setActiveNode(null)}
              >
                닫기
              </button>
            </div>
            {selectedById.get(activeNode.id)?.reason && (
              <p className="mt-2 text-xs text-slate-200">
                근거: {selectedById.get(activeNode.id)?.reason}
              </p>
            )}
          </div>
        )}
    </div>
  );
}
