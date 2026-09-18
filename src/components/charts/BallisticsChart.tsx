import React, { useRef, useEffect, useState } from 'react';
import { SimulationResult, SimulationStep } from '../../types/ballistics';
import { formatPressure, formatVelocity, formatLength } from '../../utils/formatters';

interface BallisticsChartProps {
  result: SimulationResult;
  barrelLengthInches: number;
  mapPressureBar: number;
  isMetric: boolean;
}

export const BallisticsChart: React.FC<BallisticsChartProps> = ({
  result,
  barrelLengthInches,
  mapPressureBar,
  isMetric,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoverStep, setHoverStep] = useState<SimulationStep | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 380;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Layout Margins
    const padding = { top: 30, right: 65, bottom: 45, left: 65 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    if (chartWidth <= 0 || chartHeight <= 0) return;

    // Ranges
    const maxTravel = barrelLengthInches;
    const maxPressure = Math.max(result.max_pressure_bar * 1.15, mapPressureBar * 1.1);
    const maxVelocity = Math.max(result.muzzle_velocity_fps * 1.15, 1000);

    const getX = (travelIn: number) => padding.left + (travelIn / maxTravel) * chartWidth;
    const getYPressure = (pBar: number) => padding.top + chartHeight - (pBar / maxPressure) * chartHeight;
    const getYVelocity = (vFps: number) => padding.top + chartHeight - (vFps / maxVelocity) * chartHeight;

    // 1. Grid Lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);

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
      ctx.font = '10px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText(formatLength(xVal, 1, isMetric), xPos, padding.top + chartHeight + 18);
    }

    const pressureSteps = 5;
    for (let i = 0; i <= pressureSteps; i++) {
      const pVal = (maxPressure / pressureSteps) * i;
      const yPos = getYPressure(pVal);
      ctx.beginPath();
      ctx.moveTo(padding.left, yPos);
      ctx.lineTo(padding.left + chartWidth, yPos);
      ctx.stroke();

      // Left Y-Axis Labels (Pressure)
      ctx.fillStyle = '#ef4444';
      ctx.font = '10px JetBrains Mono';
      ctx.textAlign = 'right';
      ctx.fillText(formatPressure(pVal, isMetric), padding.left - 8, yPos + 3);

      // Right Y-Axis Labels (Velocity)
      const vVal = (maxVelocity / pressureSteps) * i;
      const yVelPos = getYVelocity(vVal);
      ctx.fillStyle = '#06b6d4';
      ctx.textAlign = 'left';
      ctx.fillText(formatVelocity(vVal, isMetric), padding.left + chartWidth + 8, yVelPos + 3);
    }

    ctx.setLineDash([]);

    // 2. SAAMI / CIP Maximum Allowable Pressure (MAP) Redline
    const mapY = getYPressure(mapPressureBar);
    if (mapY >= padding.top && mapY <= padding.top + chartHeight) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(padding.left, mapY);
      ctx.lineTo(padding.left + chartWidth, mapY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#ef4444';
      ctx.font = '10px Inter';
      ctx.textAlign = 'left';
      ctx.fillText(`MAP Limit (${formatPressure(mapPressureBar, isMetric)})`, padding.left + 6, mapY - 5);
    }

    if (result.steps.length === 0) return;

    // 3. Draw Pressure Curve P(x) (Red gradient fill & stroke)
    const pGrad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
    pGrad.addColorStop(0, 'rgba(239, 68, 68, 0.25)');
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
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(getX(result.steps[0].bullet_travel_in), getYPressure(result.steps[0].chamber_pressure_bar));
    for (const s of result.steps) {
      ctx.lineTo(getX(s.bullet_travel_in), getYPressure(s.chamber_pressure_bar));
    }
    ctx.stroke();

    // 4. Draw Velocity Curve V(x) (Cyan stroke)
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(getX(result.steps[0].bullet_travel_in), getYVelocity(result.steps[0].bullet_velocity_fps));
    for (const s of result.steps) {
      ctx.lineTo(getX(s.bullet_travel_in), getYVelocity(s.bullet_velocity_fps));
    }
    ctx.stroke();

    // 5. Highlight Peak Pressure Coordinate
    const pmaxX = getX(result.max_pressure_travel_in);
    const pmaxY = getYPressure(result.max_pressure_bar);
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(pmaxX, pmaxY, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 6. Draw Interactive Crosshair if Hovering
    if (mousePos && hoverStep) {
      const curX = getX(hoverStep.bullet_travel_in);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(curX, padding.top);
      ctx.lineTo(curX, padding.top + chartHeight);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [result, barrelLengthInches, mapPressureBar, isMetric, mousePos, hoverStep]);

  // Handle Mouse Hover
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || result.steps.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const padding = { left: 65, right: 65 };
    const chartWidth = canvas.clientWidth - padding.left - padding.right;
    const clampedX = Math.max(0, Math.min(chartWidth, mouseX - padding.left));
    const targetTravel = (clampedX / chartWidth) * barrelLengthInches;

    // Find closest step
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
        minHeight: '340px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Chart Legend Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        borderBottom: '1px solid var(--border-color)',
        fontSize: '11px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '3px', backgroundColor: '#ef4444', borderRadius: '1px' }} />
            <span style={{ color: '#ef4444', fontWeight: 600 }}>Chamber Pressure P(x)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '3px', backgroundColor: '#06b6d4', borderRadius: '1px' }} />
            <span style={{ color: '#06b6d4', fontWeight: 600 }}>Projectile Velocity V(x)</span>
          </div>
        </div>

        {/* Hover Crosshair Telemetry Tag */}
        {hoverStep && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-primary)',
            backgroundColor: 'var(--bg-secondary)',
            padding: '2px 8px',
            borderRadius: '4px',
            border: '1px solid var(--border-color)',
          }}>
            <span>Travel: <strong>{formatLength(hoverStep.bullet_travel_in, 2, isMetric)}</strong></span>
            <span>P: <strong style={{ color: '#ef4444' }}>{formatPressure(hoverStep.chamber_pressure_bar, isMetric)}</strong></span>
            <span>V: <strong style={{ color: '#06b6d4' }}>{formatVelocity(hoverStep.bullet_velocity_fps, isMetric)}</strong></span>
            <span>Burned: <strong>{hoverStep.propellant_burnt_pct}%</strong></span>
          </div>
        )}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ width: '100%', height: '100%', cursor: 'crosshair', display: 'block' }}
      />
    </div>
  );
};
