import { useRef, useEffect, useMemo, useState } from 'react';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';

import type { ApiGraphEdge, ApiGraphNode, RoutingCandidate } from '@/types/api';

interface GraphCanvasProps {
  nodes: ApiGraphNode[];
  edges: ApiGraphEdge[];
  selectedCandidates: RoutingCandidate[];
  loading?: boolean;
  error?: string;
}

export function GraphCanvas({ nodes, edges, selectedCandidates, loading, error }: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ForceGraphMethods>();
  const [dimensions, setDimensions] = useState({ w: 800, h: 600 });
  const [activeNode, setActiveNode] = useState<ApiGraphNode | null>(null);
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
      (graphRef.current as any)?.refresh?.();
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
    edges.forEach(edge => {
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
  }, [edges]);

  const graphNodes = useMemo(() => {
    return nodes.map(node => {
      const department = typeof node.properties?.department === 'string' ? node.properties.department : undefined;
      const group = department ?? node.type ?? 'node';
      return {
        ...node,
        group,
        val: selectedIds.has(node.id) ? 24 : 6,
        color: selectedIds.has(node.id) ? '#ffffff' : undefined
      };
    });
  }, [nodes, selectedIds]);

  const links = useMemo(() => {
    return edges.map(edge => ({
      source: edge.source,
      target: edge.target,
      color: edge.type === 'risk' ? '#ef4444' : '#3b82f6'
    }));
  }, [edges]);

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
          graphData={{ nodes: graphNodes, links }}
          nodeLabel="name"
          nodeAutoColorBy="group"
          cooldownTicks={Infinity}
          d3AlphaDecay={0.005}
          d3VelocityDecay={0.2}
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={() => 0.005} // Slow particles
          backgroundColor="#020617" // slate-950
          onNodeHover={node => {
            const nextId = node ? (node as ApiGraphNode).id : null;
            if (hoveredIdRef.current !== nextId) {
              hoveredIdRef.current = nextId;
              (graphRef.current as any)?.refresh?.();
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
            setActiveNode(node as ApiGraphNode);
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
           그래프 모드: 클러스터 뷰 · 노드에 마우스를 올려보세요
        </div>
      {loading && graphNodes.length > 0 && (
        <div className="absolute top-4 right-4 rounded-full bg-slate-900/70 p-2 text-slate-200 shadow">
          <div className="h-6 w-6 rounded-full border-[3px] border-slate-400/40 border-t-sky-400 animate-spin" />
        </div>
      )}
      {graphNodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-xs text-slate-300 space-y-2">
          {loading && (
            <div className="h-10 w-10 rounded-full border-[3px] border-slate-400/40 border-t-sky-400 animate-spin" />
          )}
          <div>{loading ? '그래프 데이터를 불러오는 중...' : '그래프 데이터가 없습니다.'}</div>
          {error && (
            <div className="max-w-xs text-[10px] text-red-300 text-center break-words">
              {error}
            </div>
          )}
        </div>
      )}
      {activeNode && (
        <div className="absolute bottom-4 left-4 max-w-xs rounded-lg border border-white/10 bg-slate-900/90 p-3 text-white shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{activeNode.name}</p>
                <p className="text-xs text-slate-300">
                  {activeNode.type ?? 'Node'} · {typeof activeNode.properties?.department === 'string' ? activeNode.properties.department : '조직'}
                </p>
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
            {selectedById.get(activeNode.id)?.score && (
              <p className="mt-2 text-xs text-slate-200">
                적합도: {selectedById.get(activeNode.id)?.score?.toFixed(2)}
              </p>
            )}
          </div>
        )}
    </div>
  );
}
