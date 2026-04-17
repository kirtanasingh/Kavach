import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type FarmStatus = 'Infected' | 'At risk' | 'Safe';

export interface NetworkFarm {
  id: number;
  name: string;
  state: FarmStatus;
  species: string;
  movements: number;
  connections: number;
  animals: number;
  lastDetection: string;
  district: string;
}

export interface NetworkEdge {
  a: number;
  b: number;
  strength: number;
  type: string;
}

export interface ContactTracingResponse {
  farms: NetworkFarm[];
  edges: NetworkEdge[];
}

interface PhysicsNode extends NetworkFarm {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Props {
  apiBase?: string;
  token?: string;
  pollMs?: number;
}

type FilterType = 'all' | 'infected' | 'at_risk' | 'safe';

const COLOR: Record<FarmStatus, string> = {
  Infected: '#C0392B',
  'At risk': '#E8A838',
  Safe: '#4CAF7D',
};

const RADIUS: Record<FarmStatus, number> = {
  Infected: 26,
  'At risk': 22,
  Safe: 18,
};

const MOCK_FARMS: NetworkFarm[] = [
  { id: 0, name: 'Green Valley', state: 'Infected', species: 'Cattle', movements: 12, connections: 3, animals: 240, lastDetection: '2 days ago', district: 'Pune' },
  { id: 1, name: 'Sunrise Farms', state: 'Infected', species: 'Poultry', movements: 8, connections: 3, animals: 1800, lastDetection: '5 days ago', district: 'Nashik' },
  { id: 2, name: 'Heritage Swine', state: 'At risk', species: 'Pig', movements: 5, connections: 2, animals: 320, lastDetection: '12 days ago', district: 'Solapur' },
  { id: 3, name: 'Dairy Fresh', state: 'At risk', species: 'Cattle', movements: 6, connections: 2, animals: 180, lastDetection: '8 days ago', district: 'Kolhapur' },
  { id: 4, name: 'Mountain View', state: 'Safe', species: 'Cattle', movements: 3, connections: 1, animals: 95, lastDetection: 'None', district: 'Satara' },
  { id: 5, name: 'River Bend', state: 'Safe', species: 'Poultry', movements: 9, connections: 2, animals: 2200, lastDetection: 'None', district: 'Aurangabad' },
  { id: 6, name: 'Golden Pasture', state: 'Safe', species: 'Cattle', movements: 4, connections: 2, animals: 140, lastDetection: 'None', district: 'Latur' },
  { id: 7, name: 'Valley Agro', state: 'At risk', species: 'Pig', movements: 7, connections: 3, animals: 410, lastDetection: '18 days ago', district: 'Amravati' },
  { id: 8, name: 'North Fields', state: 'Safe', species: 'Poultry', movements: 2, connections: 1, animals: 900, lastDetection: 'None', district: 'Nagpur' },
  { id: 9, name: 'Eastside Ranch', state: 'Infected', species: 'Cattle', movements: 11, connections: 4, animals: 310, lastDetection: '1 day ago', district: 'Jalgaon' },
];

const MOCK_EDGES: NetworkEdge[] = [
  { a: 0, b: 2, strength: 0.9, type: 'cattle_trade' },
  { a: 0, b: 3, strength: 0.6, type: 'shared_water' },
  { a: 1, b: 7, strength: 0.8, type: 'poultry_trade' },
  { a: 1, b: 5, strength: 0.4, type: 'equipment_share' },
  { a: 9, b: 2, strength: 0.95, type: 'cattle_trade' },
  { a: 9, b: 3, strength: 0.7, type: 'cattle_trade' },
  { a: 9, b: 7, strength: 0.5, type: 'shared_water' },
  { a: 9, b: 6, strength: 0.3, type: 'equipment_share' },
  { a: 2, b: 4, strength: 0.4, type: 'shared_water' },
  { a: 3, b: 6, strength: 0.35, type: 'shared_water' },
  { a: 5, b: 8, strength: 0.5, type: 'poultry_trade' },
  { a: 7, b: 8, strength: 0.3, type: 'equipment_share' },
  { a: 4, b: 6, strength: 0.25, type: 'shared_water' },
];

function initNodes(farms: NetworkFarm[]): PhysicsNode[] {
  return farms.map((f, i) => ({
    ...f,
    x: 300 + Math.cos((i / Math.max(farms.length, 1)) * Math.PI * 2) * 180 + (Math.random() - 0.5) * 60,
    y: 220 + Math.sin((i / Math.max(farms.length, 1)) * Math.PI * 2) * 160 + (Math.random() - 0.5) * 60,
    vx: 0,
    vy: 0,
  }));
}

function isLiveDataset(data: ContactTracingResponse): boolean {
  return Array.isArray(data.farms) && data.farms.length > 0;
}

export function InterFarmNetwork({ apiBase, token, pollMs = 15000 }: Props) {
  const resolvedBase = useMemo(() => {
    if (apiBase) return apiBase;
    const envBase = import.meta.env?.VITE_API_URL ?? 'http://localhost:8000';
    return envBase.endsWith('/api/v1') ? envBase : `${envBase}/api/v1`;
  }, [apiBase]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<PhysicsNode[]>([]);
  const edgesRef = useRef<NetworkEdge[]>([]);
  const tickRef = useRef(0);
  const rafRef = useRef<number>(0);
  const draggingRef = useRef<PhysicsNode | null>(null);
  const dragOff = useRef({ x: 0, y: 0 });

  const [filter, setFilter] = useState<FilterType>('all');
  const [showSpread, setShowSpread] = useState(true);
  const [selected, setSelected] = useState<PhysicsNode | null>(null);
  const [counts, setCounts] = useState({ infected: 0, at_risk: 0, safe: 0 });
  const [farmList, setFarmList] = useState<PhysicsNode[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');

  const loadMock = useCallback(() => {
    nodesRef.current = initNodes(MOCK_FARMS);
    edgesRef.current = MOCK_EDGES;
    setIsLive(false);
    setLastUpdate('');
  }, []);

  const fetchNetwork = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${resolvedBase}/authority/contact-tracing`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data: ContactTracingResponse = await res.json();
      if (!isLiveDataset(data)) {
        loadMock();
        return;
      }

      const existing = nodesRef.current;
      nodesRef.current = data.farms.map((farm, i) => {
        const prev = existing.find((n) => n.id === farm.id);
        if (prev) return { ...farm, x: prev.x, y: prev.y, vx: prev.vx, vy: prev.vy };
        return {
          ...farm,
          x: 300 + Math.cos((i / Math.max(data.farms.length, 1)) * Math.PI * 2) * 180,
          y: 220 + Math.sin((i / Math.max(data.farms.length, 1)) * Math.PI * 2) * 160,
          vx: 0,
          vy: 0,
        };
      });
      edgesRef.current = data.edges;
      setIsLive(true);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch {
      loadMock();
    }
  }, [loadMock, resolvedBase, token]);

  useEffect(() => {
    loadMock();
    if (!token) return;
    void fetchNetwork();
    const id = setInterval(() => {
      void fetchNetwork();
    }, pollMs);
    return () => clearInterval(id);
  }, [fetchNetwork, loadMock, pollMs, token]);

  const syncSidebar = useCallback(() => {
    const ns = nodesRef.current;
    setCounts({
      infected: ns.filter((n) => n.state === 'Infected').length,
      at_risk: ns.filter((n) => n.state === 'At risk').length,
      safe: ns.filter((n) => n.state === 'Safe').length,
    });
    setFarmList(
      [...ns].sort((a, b) => {
        const ord: Record<FarmStatus, number> = { Infected: 0, 'At risk': 1, Safe: 2 };
        return ord[a.state] - ord[b.state];
      }),
    );
  }, []);

  const simulate = useCallback(() => {
    const nodes = nodesRef.current;
    const edges = edgesRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ratio = window.devicePixelRatio || 1;
    const W = canvas.width / ratio;
    const H = canvas.height / ratio;
    const alpha = 0.05;

    nodes.forEach((n) => {
      nodes.forEach((m) => {
        if (n.id === m.id) return;
        const dx = n.x - m.x;
        const dy = n.y - m.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const rep = 1400 / (d * d);
        n.vx += (dx / d) * rep * alpha;
        n.vy += (dy / d) * rep * alpha;
      });
      n.vx += (W / 2 - n.x) * 0.003 * alpha;
      n.vy += (H / 2 - n.y) * 0.003 * alpha;
    });

    edges.forEach((e) => {
      const a = nodes[e.a];
      const b = nodes[e.b];
      if (!a || !b) return;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const target = 140;
      const f = (d - target) * 0.04 * alpha;
      a.vx += (dx / d) * f;
      a.vy += (dy / d) * f;
      b.vx -= (dx / d) * f;
      b.vy -= (dy / d) * f;
    });

    nodes.forEach((n) => {
      if (draggingRef.current?.id === n.id) return;
      n.vx *= 0.82;
      n.vy *= 0.82;
      n.x += n.vx;
      n.y += n.vy;
      n.x = Math.max(40, Math.min(W - 40, n.x));
      n.y = Math.max(40, Math.min(H - 40, n.y));
    });
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const ratio = window.devicePixelRatio || 1;
    const W = canvas.width / ratio;
    const H = canvas.height / ratio;
    const nodes = nodesRef.current;
    const edges = edgesRef.current;

    tickRef.current += 1;
    const tick = tickRef.current;
    ctx.clearRect(0, 0, W, H);

    const isVisible = (n: PhysicsNode) =>
      filter === 'all'
      || (filter === 'infected' && n.state === 'Infected')
      || (filter === 'at_risk' && n.state === 'At risk')
      || (filter === 'safe' && n.state === 'Safe');

    const edgeColor = (e: NetworkEdge) => {
      const a = nodes[e.a];
      const b = nodes[e.b];
      if (!a || !b) return '#B4B2A9';
      if (a.state === 'Infected' || b.state === 'Infected') return '#C0392B';
      if (a.state === 'At risk' || b.state === 'At risk') return '#E8A838';
      return '#B4B2A9';
    };

    if (showSpread) {
      edges.forEach((e) => {
        const a = nodes[e.a];
        const b = nodes[e.b];
        if (!a || !b || !isVisible(a) || !isVisible(b)) return;

        ctx.save();
        ctx.strokeStyle = edgeColor(e);
        ctx.lineWidth = e.strength * 2.5;
        ctx.globalAlpha = 0.18 + e.strength * 0.22;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.restore();

        if (e.strength > 0.6) {
          const prog = ((tick * 0.015) + e.a * 0.3) % 1;
          const px = a.x + (b.x - a.x) * prog;
          const py = a.y + (b.y - a.y) * prog;
          ctx.save();
          ctx.fillStyle = edgeColor(e);
          ctx.globalAlpha = 0.75;
          ctx.beginPath();
          ctx.arc(px, py, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });
    }

    nodes.forEach((n) => {
      if (!isVisible(n)) return;
      const r = RADIUS[n.state];
      const isSel = selected?.id === n.id;
      const pulse = Math.sin(tick * 0.06 + n.id) * 0.5 + 0.5;

      if (n.state === 'Infected') {
        ctx.save();
        ctx.strokeStyle = '#C0392B';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.15 + pulse * 0.15;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 8 + pulse * 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      if (isSel) {
        ctx.save();
        ctx.strokeStyle = '#1B5E42';
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = 0.65;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.fillStyle = COLOR[n.state];
      ctx.globalAlpha = isSel ? 1 : 0.9;
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = n.state === 'Infected' ? '500 11px system-ui,sans-serif' : '500 10px system-ui,sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const words = n.name.split(' ');
      if (words.length > 1) {
        ctx.fillText(words[0], n.x, n.y - 6);
        ctx.fillText(words.slice(1).join(' '), n.x, n.y + 6);
      } else {
        ctx.fillText(n.name, n.x, n.y);
      }
      ctx.restore();

      ctx.save();
      ctx.fillStyle = COLOR[n.state];
      ctx.font = '10px system-ui,sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.globalAlpha = 0.8;
      ctx.fillText(n.district, n.x, n.y + r + 5);
      ctx.restore();
    });

    simulate();
    rafRef.current = requestAnimationFrame(draw);
  }, [filter, selected, showSpread, simulate]);

  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!canvas || !wrap) return;
      const rect = wrap.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(ratio, ratio);
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  useEffect(() => {
    syncSidebar();
    const id = setInterval(syncSidebar, 2000);
    return () => clearInterval(id);
  }, [syncSidebar]);

  const getNodeAt = useCallback((x: number, y: number) => nodesRef.current.find((n) => {
    const dx = n.x - x;
    const dy = n.y - y;
    return Math.sqrt(dx * dx + dy * dy) <= RADIUS[n.state] + 4;
  }), []);

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const n = getNodeAt(x, y);
    if (!n) return;
    draggingRef.current = n;
    dragOff.current = { x: x - n.x, y: y - n.y };
    canvas.style.cursor = 'grabbing';
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;

    if (draggingRef.current) {
      draggingRef.current.x = x - dragOff.current.x;
      draggingRef.current.y = y - dragOff.current.y;
      draggingRef.current.vx = 0;
      draggingRef.current.vy = 0;
      return;
    }

    canvas.style.cursor = getNodeAt(x, y) ? 'pointer' : 'default';
  };

  const onMouseUp = () => {
    const canvas = canvasRef.current;
    draggingRef.current = null;
    if (canvas) canvas.style.cursor = 'default';
  };

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const n = getNodeAt(x, y);
    setSelected(n ?? null);
  };

  const S = {
    root: {
      fontFamily: 'system-ui, sans-serif',
      background: 'transparent',
    } as React.CSSProperties,
    toolbar: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '10px 14px',
      background: '#ffffff',
      borderBottom: '0.5px solid #E5E3DC',
      flexWrap: 'wrap',
    } as React.CSSProperties,
    wrap: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) 290px',
      border: '0.5px solid #E5E3DC',
      borderRadius: 12,
      overflow: 'hidden',
      background: '#ffffff',
      minHeight: 560,
    } as React.CSSProperties,
    graphArea: {
      position: 'relative',
      background: '#F7F5F0',
      minHeight: 560,
    } as React.CSSProperties,
    canvas: {
      display: 'block',
      width: '100%',
      height: '100%',
    } as React.CSSProperties,
    sidebar: {
      borderLeft: '0.5px solid #E5E3DC',
      display: 'flex',
      flexDirection: 'column',
      background: '#ffffff',
      minHeight: 0,
    } as React.CSSProperties,
    statsBar: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      borderBottom: '0.5px solid #E5E3DC',
    } as React.CSSProperties,
    statCell: (borderRight: boolean): React.CSSProperties => ({
      padding: '10px 12px',
      textAlign: 'center',
      borderRight: borderRight ? '0.5px solid #E5E3DC' : 'none',
    }),
    sbScroll: {
      flex: 1,
      overflowY: 'auto',
      padding: 10,
      maxHeight: 320,
    } as React.CSSProperties,
    farmCard: (sel: boolean): React.CSSProperties => ({
      border: `0.5px solid ${sel ? '#1B5E42' : '#E5E3DC'}`,
      borderRadius: 8,
      padding: '9px 11px',
      marginBottom: 7,
      cursor: 'pointer',
    }),
    detailPanel: {
      borderTop: '0.5px solid #E5E3DC',
      padding: '12px 14px',
      background: '#F7F5F0',
    } as React.CSSProperties,
    dpRow: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 11,
      color: '#7A7A6E',
      padding: '3px 0',
      borderBottom: '0.5px solid #E5E3DC',
    } as React.CSSProperties,
  };

  const filterBtnStyle = (active: boolean): React.CSSProperties => ({
    fontSize: 11,
    padding: '3px 10px',
    borderRadius: 20,
    border: `0.5px solid ${active ? '#1B5E42' : '#E5E3DC'}`,
    background: active ? '#1B5E42' : 'transparent',
    color: active ? '#ffffff' : '#7A7A6E',
    cursor: 'pointer',
  });

  return (
    <div style={S.root}>
      <div style={S.toolbar}>
        <span style={{ fontSize: 12, color: '#7A7A6E' }}>Filter:</span>
        {(['all', 'infected', 'at_risk', 'safe'] as FilterType[]).map((f) => (
          <button key={f} style={filterBtnStyle(filter === f)} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All farms' : f === 'at_risk' ? 'At risk' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}

        <div style={{ width: 1, height: 16, background: '#E5E3DC' }} />

        <button style={filterBtnStyle(showSpread)} onClick={() => setShowSpread((p) => !p)}>
          {showSpread ? 'Hide paths' : 'Show paths'}
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 10,
              padding: '2px 8px',
              borderRadius: 20,
              background: isLive ? '#E1F5EE' : '#FAEEDA',
              color: isLive ? '#0F6E56' : '#854F0B',
            }}
          >
            {isLive ? `Live · ${lastUpdate}` : 'Demo data'}
          </span>
        </div>

        {(['Infected', 'At risk', 'Safe'] as FarmStatus[]).map((s) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#7A7A6E' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: COLOR[s], display: 'inline-block' }} />
            {s}
          </div>
        ))}
      </div>

      <div style={S.wrap}>
        <div ref={wrapRef} style={S.graphArea}>
          <canvas
            ref={canvasRef}
            style={S.canvas}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onClick={onClick}
          />
        </div>

        <div style={S.sidebar}>
          <div style={S.statsBar}>
            {[
              { label: 'Infected', count: counts.infected, color: '#C0392B' },
              { label: 'At risk', count: counts.at_risk, color: '#E8A838' },
              { label: 'Safe', count: counts.safe, color: '#4CAF7D' },
            ].map((s, i) => (
              <div key={s.label} style={S.statCell(i < 2)}>
                <div style={{ fontSize: 22, fontWeight: 500, color: s.color }}>{s.count}</div>
                <div style={{ fontSize: 10, color: '#7A7A6E', marginTop: 1 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: '12px 14px', borderBottom: '0.5px solid #E5E3DC' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', marginBottom: 2 }}>Farm Movement History</div>
            <div style={{ fontSize: 11, color: '#7A7A6E' }}>
              {selected ? `${selected.state} · ${selected.district}` : 'Click a node to inspect'}
            </div>
          </div>

          <div style={S.sbScroll}>
            {farmList.map((n) => (
              <div key={n.id} style={S.farmCard(selected?.id === n.id)} onClick={() => setSelected(n)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{n.name}</span>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLOR[n.state], display: 'inline-block' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#7A7A6E' }}>
                  <span>Connections: <strong style={{ color: '#1a1a1a' }}>{n.connections}</strong></span>
                  <span>Moves: <strong style={{ color: '#1a1a1a' }}>{n.movements}</strong></span>
                </div>
              </div>
            ))}
          </div>

          {selected && (
            <div style={S.detailPanel}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#1a1a1a', marginBottom: 8 }}>
                {selected.name}
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 10,
                    padding: '2px 7px',
                    borderRadius: 20,
                    background: selected.state === 'Infected' ? '#FCEBEB' : selected.state === 'At risk' ? '#FAEEDA' : '#EAF3DE',
                    color: COLOR[selected.state],
                  }}
                >
                  {selected.state}
                </span>
              </div>
              {[
                ['Species', selected.species],
                ['Animals', selected.animals.toLocaleString()],
                ['District', selected.district],
                ['Movements (30d)', String(selected.movements)],
                ['Connections', String(selected.connections)],
                ['Last detection', selected.lastDetection],
              ].map(([label, val], i, arr) => (
                <div key={label} style={{ ...S.dpRow, borderBottom: i < arr.length - 1 ? '0.5px solid #E5E3DC' : 'none' }}>
                  <span>{label}</span>
                  <span style={{ fontWeight: 500, color: '#1a1a1a' }}>{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
