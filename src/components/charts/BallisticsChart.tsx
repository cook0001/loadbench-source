import React, { useRef, useEffect, useState, useMemo } from 'react';
import { SimulationResult, SimulationStep, OBTNode } from '../../types/ballistics';
import { formatPressure, formatVelocity, formatLength } from '../../utils/formatters';

interface BallisticsChartProps {
  result: SimulationResult;
  barrelLengthInches: number;
  caseLengthInches?: number;
  mapPressureBar: number;
  isMetric: boolean;
  obtNodes?: OBTNode[];
}

export const BallisticsChart: React.FC<BallisticsChartProps> = ({
  result,
  barrelLengthInches,
  caseLengthInches = 1.92,
  mapPressureBar,
  isMetric,
  obtNodes = [],
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Curve Visibility Toggles
  const [showPressure, setShowPressure] = useState<boolean>(true);
  const [showVelocity, setShowVelocity] = useState<boolean>(true);
  const [showBurnPct, setShowBurnPct] = useState<boolean>(true);
  const [showOBT, setShowOBT] = useState<boolean>(false);

  // Hover Telemetry
  const [hoverStep, setHoverStep] = useState<SimulationStep | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Memoize OBT node locations mapped to bullet travel
  const obtMarkerLocations = useMemo(() => {
    if (!obtNodes || obtNodes.length === 0 || result.steps.length === 0) return [];
    return obtNodes
      .map(node => {
        let closest = result.steps[0];
        let minDiff = Math.abs(closest.time_ms - node.target_time_ms);
        for (const s of result.steps) {
          const diff = Math.abs(s.time_ms - node.target_time_ms);
          if (diff < minDiff) {
            minDiff = diff;
            closest = s;
          }
        }
        return {
          nodeNumber: node.node_number,
          targetTimeMs: node.target_time_ms,
          travelIn: closest.bullet_travel_in,
          status: node.status,
        };
      })
      .filter(item => item.travelIn <= barrelLengthInches && item.travelIn > 0.1);
  }, [obtNodes, result.steps, barrelLengthInches]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 390;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Layout Margins (Wide margins to prevent any axis number clipping)
    const padding = { top: 32, right: 80, bottom: 62, left: 86 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    if (chartWidth <= 0 || chartHeight <= 0) return;

    // Numerical Ranges
    const maxTravel = Math.max(barrelLengthInches, 2);
    const maxPressure = Math.max(result.max_pressure_bar * 1.15, mapPressureBar * 1.1);
    const maxVelocity = Math.max(result.muzzle_velocity_fps * 1.15, 1000);

    const getX = (travelIn: number) => padding.left + (travelIn / maxTravel) * chartWidth;
    const getYPressure = (pBar: number) => padding.top + chartHeight - (pBar / maxPressure) * chartHeight;
    const getYVelocity = (vFps: number) => padding.top + chartHeight - (vFps / maxVelocity) * chartHeight;
    const getYBurn = (pct: number) => padding.top + chartHeight - (pct / 100) * chartHeight;

    // 1. Grid Lines & Axis Labels
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);

    // X-Axis Grid & Travel Ticks
    const travelSteps = 6;
    for (let i = 0; i <= travelSteps; i++) {
      const xVal = (maxTravel / travelSteps) * i;
      const xPos = getX(xVal);
      ctx.beginPath();
      ctx.moveTo(xPos, padding.top);
      ctx.lineTo(xPos, padding.top + chartHeight);
      ctx.stroke();

      // X-Axis Labels (Travel)
      ctx.fillStyle = '#64748b';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(formatLength(xVal, 1, isMetric), xPos, padding.top + chartHeight + 16);
    }

    // Y-Axis Grid & Labels
    const pressureSteps = 5;
    for (let i = 0; i <= pressureSteps; i++) {
      const pVal = (maxPressure / pressureSteps) * i;
      const yPos = getYPressure(pVal);
      ctx.beginPath();
      ctx.moveTo(padding.left, yPos);
      ctx.lineTo(padding.left + chartWidth, yPos);
      ctx.stroke();

      // Left Y-Axis Labels (Pressure)
      if (showPressure) {
        ctx.fillStyle = '#ef4444';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.textAlign = 'right';
        ctx.fillText(formatPressure(pVal, isMetric), padding.left - 10, yPos + 3);
      }

      // Right Y-Axis Labels (Velocity)
      if (showVelocity) {
        const vVal = (maxVelocity / pressureSteps) * i;
        const yVelPos = getYVelocity(vVal);
        ctx.fillStyle = '#06b6d4';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(formatVelocity(vVal, isMetric), padding.left + chartWidth + 10, yVelPos + 3);
      }
    }

    ctx.setLineDash([]);

    // 2. Chamber & Barrel Schematic Cross-Section
    const barrelY = padding.top + chartHeight + 24;
    const barrelH = 10;
    const chamberEndIn = Math.min(caseLengthInches, maxTravel);
    const chamberEndX = getX(chamberEndIn);

    // Chamber Block (Thicker case body)
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.fillRect(padding.left, barrelY - 2, chamberEndX - padding.left, barrelH + 4);
    ctx.strokeRect(padding.left, barrelY - 2, chamberEndX - padding.left, barrelH + 4);

    // Chamber Label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Chamber (${formatLength(chamberEndIn, 2, isMetric)})`, padding.left + 4, barrelY + barrelH + 14);

    // Rifled Bore Block
    const boreEndX = getX(maxTravel);
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#334155';
    ctx.fillRect(chamberEndX, barrelY, boreEndX - chamberEndX, barrelH);
    ctx.strokeRect(chamberEndX, barrelY, boreEndX - chamberEndX, barrelH);

    // Subtle Rifling Grooves
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let bx = chamberEndX + 15; bx < boreEndX - 5; bx += 14) {
      ctx.beginPath();
      ctx.moveTo(bx, barrelY + 1);
      ctx.lineTo(bx + 4, barrelY + barrelH - 1);
      ctx.stroke();
    }

    // Muzzle Crown Indicator
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(boreEndX, barrelY - 2);
    ctx.lineTo(boreEndX, barrelY + barrelH + 2);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Muzzle Exit', boreEndX, barrelY + barrelH + 14);

    // 3. SAAMI / CIP Maximum Allowable Pressure (MAP) Redline
    const mapY = getYPressure(mapPressureBar);
    if (mapY >= padding.top && mapY <= padding.top + chartHeight) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(padding.left, mapY);
      ctx.lineTo(padding.left + chartWidth, mapY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#ef4444';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`MAP Limit (${formatPressure(mapPressureBar, isMetric)})`, padding.left + 8, mapY - 6);
    }

    if (result.steps.length === 0) return;

    // 4. OBT Harmonic Node Lines (if enabled)
    if (showOBT && obtMarkerLocations.length > 0) {
      for (const marker of obtMarkerLocations) {
        const markerX = getX(marker.travelIn);
        ctx.strokeStyle = marker.status === 'exact' ? '#a855f7' : 'rgba(168, 85, 247, 0.4)';
        ctx.lineWidth = marker.status === 'exact' ? 1.5 : 1;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(markerX, padding.top);
        ctx.lineTo(markerX, padding.top + chartHeight);
        ctx.stroke();
        ctx.setLineDash([]);

        // Node Pill Tag at Top
        ctx.fillStyle = '#a855f7';
        ctx.font = '9px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Node ${marker.nodeNumber}`, markerX, padding.top - 6);
      }
    }

    // 5. Propellant Burned Curve Z(x) (Amber dashed line)
    if (showBurnPct) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(getX(result.steps[0].bullet_travel_in), getYBurn(result.steps[0].propellant_burnt_pct));
      for (const s of result.steps) {
        ctx.lineTo(getX(s.bullet_travel_in), getYBurn(s.propellant_burnt_pct));
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 6. Chamber Pressure Curve P(x) (Red gradient fill & stroke)
    if (showPressure) {
      const pGrad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
      pGrad.addColorStop(0, 'rgba(239, 68, 68, 0.22)');
      pGrad.addColorStop(1, 'rgba(239, 68, 68, 0.0)');

      ctx.beginPath();
      ctx.moveTo(getX(result.steps[0].bullet_travel_in), padding.top + chartHeight);
      for (const s of result.steps) {
        ctx.lineTo(getX(s.bullet_travel_in), getYPressure(s.chamber_pressure_bar));
      }
      ctx.lineTo(getX(result.steps[result.steps.length - 1].bullet_travel_in), padding.top + chartHeight);
      ctx.closePath();
      ctx.fillStyle = pGrad;
      ctx.fill();

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(getX(result.steps[0].bullet_travel_in), getYPressure(result.steps[0].chamber_pressure_bar));
      for (const s of result.steps) {
        ctx.lineTo(getX(s.bullet_travel_in), getYPressure(s.chamber_pressure_bar));
      }
      ctx.stroke();

      // Peak Pressure Beacon & Callout
      const pmaxX = getX(result.max_pressure_travel_in);
      const pmaxY = getYPressure(result.max_pressure_bar);

      // Halo glow
      ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
      ctx.beginPath();
      ctx.arc(pmaxX, pmaxY, 8, 0, 2 * Math.PI);
      ctx.fill();

      // Center dot
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(pmaxX, pmaxY, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 7. Projectile Velocity Curve V(x) (Cyan stroke)
    if (showVelocity) {
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(getX(result.steps[0].bullet_travel_in), getYVelocity(result.steps[0].bullet_velocity_fps));
      for (const s of result.steps) {
        ctx.lineTo(getX(s.bullet_travel_in), getYVelocity(s.bullet_velocity_fps));
      }
      ctx.stroke();
    }

    // 8. Interactive Crosshair & Tracking Marker
    if (mousePos && hoverStep) {
      const curX = getX(hoverStep.bullet_travel_in);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(curX, padding.top);
      ctx.lineTo(curX, padding.top + chartHeight + barrelH + 6);
      ctx.stroke();
      ctx.setLineDash([]);

      // Highlight point on Pressure curve
      if (showPressure) {
        const py = getYPressure(hoverStep.chamber_pressure_bar);
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(curX, py, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Highlight point on Velocity curve
      if (showVelocity) {
        const vy = getYVelocity(hoverStep.bullet_velocity_fps);
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(curX, vy, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }, [
    result,
    barrelLengthInches,
    caseLengthInches,
    mapPressureBar,
    isMetric,
    showPressure,
    showVelocity,
    showBurnPct,
    showOBT,
    obtMarkerLocations,
    mousePos,
    hoverStep,
  ]);

  // Handle Mouse Hover for Telemetry
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || result.steps.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const padding = { left: 86, right: 80 };
    const chartWidth = canvas.clientWidth - padding.left - padding.right;
    const clampedX = Math.max(0, Math.min(chartWidth, mouseX - padding.left));
    const targetTravel = (clampedX / chartWidth) * barrelLengthInches;

    let closest = result.steps[0];
    let minDiff = Math.abs(closest.bullet_travel_in - targetTravel);

    for (const step of result.steps) {
      const diff = Math.abs(step.bullet_travel_in - targetTravel);
      if (diff < minDiff) {
        minDiff = diff;
        closest = step;
      }
    }

    setHoverStep(closest);
    setMousePos({ x: mouseX, y: mouseY });
  };

  const handleMouseLeave = () => {
    setHoverStep(null);
    setMousePos(null);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        flex: 1,
        minHeight: '350px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
      }}
    >
      {/* Interactive Legend Header & Telemetry Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 14px',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-secondary)',
        fontSize: '11px',
        gap: '12px',
        flexWrap: 'wrap',
      }}>
        {/* Curve Visibility Checkbox Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={showPressure}
              onChange={(e) => setShowPressure(e.target.checked)}
              style={{ accentColor: '#ef4444' }}
            />
            <span style={{ width: '8px', height: '3px', backgroundColor: '#ef4444', borderRadius: '1px' }} />
            <span style={{ color: '#ef4444', fontWeight: 600 }}>Chamber Pressure P(x)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={showVelocity}
              onChange={(e) => setShowVelocity(e.target.checked)}
              style={{ accentColor: '#06b6d4' }}
            />
            <span style={{ width: '8px', height: '3px', backgroundColor: '#06b6d4', borderRadius: '1px' }} />
            <span style={{ color: '#06b6d4', fontWeight: 600 }}>Velocity V(x)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={showBurnPct}
              onChange={(e) => setShowBurnPct(e.target.checked)}
              style={{ accentColor: '#f59e0b' }}
            />
            <span style={{ width: '8px', height: '2px', backgroundColor: '#f59e0b', borderTop: '1px dashed #f59e0b' }} />
            <span style={{ color: '#f59e0b', fontWeight: 600 }}>Powder Burn Z(x)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={showOBT}
              onChange={(e) => setShowOBT(e.target.checked)}
              style={{ accentColor: '#a855f7' }}
            />
            <span style={{ width: '8px', height: '2px', backgroundColor: '#a855f7' }} />
            <span style={{ color: '#a855f7', fontWeight: 600 }}>OBT Nodes</span>
          </label>
        </div>

        {/* Live Hover Crosshair Telemetry HUD */}
        {hoverStep ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-primary)',
            backgroundColor: 'var(--bg-tertiary)',
            padding: '3px 10px',
            borderRadius: '4px',
            border: '1px solid var(--border-color)',
          }}>
            <span>Travel: <strong>{formatLength(hoverStep.bullet_travel_in, 2, isMetric)}</strong></span>
            <span>P: <strong style={{ color: '#ef4444' }}>{formatPressure(hoverStep.chamber_pressure_bar, isMetric)}</strong></span>
            <span>V: <strong style={{ color: '#06b6d4' }}>{formatVelocity(hoverStep.bullet_velocity_fps, isMetric)}</strong></span>
            <span>Burned: <strong style={{ color: '#f59e0b' }}>{hoverStep.propellant_burnt_pct}%</strong></span>
            <span>t: <strong>{hoverStep.time_ms.toFixed(3)} ms</strong></span>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--text-muted)',
          }}>
            <span>Peak at: <strong style={{ color: 'var(--text-secondary)' }}>{formatLength(result.max_pressure_travel_in, 2, isMetric)}</strong></span>
            <span>Muzzle: <strong style={{ color: 'var(--text-secondary)' }}>{formatLength(barrelLengthInches, 1, isMetric)}</strong></span>
          </div>
        )}
      </div>

      {/* Main Canvas */}
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ width: '100%', height: '100%', cursor: 'crosshair', display: 'block' }}
      />
    </div>
  );
};
