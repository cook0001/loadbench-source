import React, { useState, useMemo } from 'react';
import { X, DollarSign, Calculator, PiggyBank, Layers, Sparkles } from 'lucide-react';
import { CartridgeSpec } from '../../types/cartridge';
import { ProjectileSpec } from '../../types/projectile';
import { PropellantSpec } from '../../types/propellant';
import { PrimerSpec } from '../../types/primer';

interface BatchCostModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartridge: CartridgeSpec;
  projectile: ProjectileSpec;
  propellant: PropellantSpec;
  chargeGrains: number;
  primer: PrimerSpec;
}

export const BatchCostModal: React.FC<BatchCostModalProps> = ({
  isOpen,
  onClose,
  cartridge,
  projectile,
  propellant,
  chargeGrains,
  primer,
}) => {
  // Unit Cost Inputs
  const [powderPricePerLb, setPowderPricePerLb] = useState<number>(48.00); // 7000 gr/lb
  const [primerPricePer1000, setPrimerPricePer1000] = useState<number>(85.00);
  const [bulletPricePerBox, setBulletPricePerBox] = useState<number>(44.00);
  const [bulletBoxCount, setBulletBoxCount] = useState<number>(100);
  const [brassPricePer100, setBrassPricePer100] = useState<number>(75.00);
  const [brassFirings, setBrassFirings] = useState<number>(5); // Amortization firings
  const [batchSize, setBatchSize] = useState<number>(100);

  // Commercial / Factory Equivalent Comparison
  const [factoryBoxPrice, setFactoryBoxPrice] = useState<number>(38.00);
  const [factoryBoxCount, setFactoryBoxCount] = useState<number>(20);

  // Calculations
  const costs = useMemo(() => {
    const powderCostPerRound = (powderPricePerLb / 7000) * chargeGrains;
    const primerCostPerRound = primerPricePer1000 / 1000;
    const bulletCostPerRound = bulletBoxCount > 0 ? bulletPricePerBox / bulletBoxCount : 0;
    const brassCostPerRound = brassFirings > 0 ? (brassPricePer100 / 100) / brassFirings : 0;

    const totalHandloadPerRound = powderCostPerRound + primerCostPerRound + bulletCostPerRound + brassCostPerRound;
    const totalHandloadBatch = totalHandloadPerRound * batchSize;

    const factoryCostPerRound = factoryBoxCount > 0 ? factoryBoxPrice / factoryBoxCount : 0;
    const totalFactoryBatch = factoryCostPerRound * batchSize;

    const batchSavings = totalFactoryBatch - totalHandloadBatch;
    const savingsPct = totalFactoryBatch > 0 ? (batchSavings / totalFactoryBatch) * 100 : 0;
    const roundsPerLbPowder = chargeGrains > 0 ? Math.floor(7000 / chargeGrains) : 0;

    return {
      powderCostPerRound,
      primerCostPerRound,
      bulletCostPerRound,
      brassCostPerRound,
      totalHandloadPerRound,
      totalHandloadBatch,
      factoryCostPerRound,
      totalFactoryBatch,
      batchSavings,
      savingsPct,
      roundsPerLbPowder,
    };
  }, [
    powderPricePerLb,
    chargeGrains,
    primerPricePer1000,
    bulletPricePerBox,
    bulletBoxCount,
    brassPricePer100,
    brassFirings,
    batchSize,
    factoryBoxPrice,
    factoryBoxCount,
  ]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '780px', width: '95vw', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calculator size={16} color="var(--accent-green)" />
            <span style={{ fontSize: '13px', fontWeight: 700 }}>
              Batch Cost &amp; Handload Savings Calculator
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              ({cartridge.name})
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Summary Banner Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            <div
              style={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '10px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Handload / Round
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-green)', marginTop: '2px' }}>
                ${costs.totalHandloadPerRound.toFixed(3)}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                ${(costs.totalHandloadPerRound * 20).toFixed(2)} / box of 20
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '10px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Factory Equivalent
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-orange)', marginTop: '2px' }}>
                ${costs.factoryCostPerRound.toFixed(3)}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                ${factoryBoxPrice.toFixed(2)} / box of {factoryBoxCount}
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid rgba(0, 230, 118, 0.3)',
                borderRadius: '6px',
                padding: '10px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Batch Savings ({batchSize} rds)
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: '2px' }}>
                ${costs.batchSavings.toFixed(2)}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--accent-green)', marginTop: '2px' }}>
                {costs.savingsPct.toFixed(1)}% Saved
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '10px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                1 lb Powder Yield
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-gold)', marginTop: '2px' }}>
                {costs.roundsPerLbPowder}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Rounds @ {chargeGrains.toFixed(1)} gr
              </div>
            </div>
          </div>

          {/* Dual Column Configuration */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '16px' }}>
            {/* Left: Component Unit Costs */}
            <div
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '6px',
                padding: '14px',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <DollarSign size={14} color="var(--accent-green)" />
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Component Purchase Costs
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Powder */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Powder: {propellant.name} (${costs.powderCostPerRound.toFixed(3)}/rd)
                    </span>
                    <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>${powderPricePerLb.toFixed(2)} / lb</span>
                  </div>
                  <input
                    type="number"
                    step="0.50"
                    min="10"
                    max="150"
                    value={powderPricePerLb}
                    onChange={(e) => setPowderPricePerLb(parseFloat(e.target.value) || 0)}
                    className="input-control"
                    style={{ width: '100%', padding: '6px 8px', fontSize: '12px' }}
                  />
                </div>

                {/* Primer */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Primer: {primer.name} (${costs.primerCostPerRound.toFixed(3)}/rd)
                    </span>
                    <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>${primerPricePer1000.toFixed(2)} / 1000</span>
                  </div>
                  <input
                    type="number"
                    step="1.00"
                    min="20"
                    max="200"
                    value={primerPricePer1000}
                    onChange={(e) => setPrimerPricePer1000(parseFloat(e.target.value) || 0)}
                    className="input-control"
                    style={{ width: '100%', padding: '6px 8px', fontSize: '12px' }}
                  />
                </div>

                {/* Bullet */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Bullet: {projectile.weight_grains}gr {projectile.name} (${costs.bulletCostPerRound.toFixed(3)}/rd)
                    </span>
                    <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>${bulletPricePerBox.toFixed(2)} / {bulletBoxCount}ct</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                    <input
                      type="number"
                      step="1.00"
                      min="10"
                      max="300"
                      value={bulletPricePerBox}
                      onChange={(e) => setBulletPricePerBox(parseFloat(e.target.value) || 0)}
                      className="input-control"
                      placeholder="Price per box"
                      style={{ padding: '6px 8px', fontSize: '12px' }}
                    />
                    <input
                      type="number"
                      step="50"
                      min="20"
                      max="1000"
                      value={bulletBoxCount}
                      onChange={(e) => setBulletBoxCount(parseInt(e.target.value) || 100)}
                      className="input-control"
                      placeholder="Box count"
                      style={{ padding: '6px 8px', fontSize: '12px' }}
                    />
                  </div>
                </div>

                {/* Brass */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Brass Amortization (${costs.brassCostPerRound.toFixed(3)}/rd)
                    </span>
                    <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>${brassPricePer100.toFixed(2)} / 100ct ({brassFirings} firings)</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                    <input
                      type="number"
                      step="1.00"
                      min="0"
                      max="400"
                      value={brassPricePer100}
                      onChange={(e) => setBrassPricePer100(parseFloat(e.target.value) || 0)}
                      className="input-control"
                      placeholder="Price per 100 cases"
                      style={{ padding: '6px 8px', fontSize: '12px' }}
                    />
                    <input
                      type="number"
                      step="1"
                      min="1"
                      max="20"
                      value={brassFirings}
                      onChange={(e) => setBrassFirings(parseInt(e.target.value) || 1)}
                      className="input-control"
                      placeholder="Firings"
                      style={{ padding: '6px 8px', fontSize: '12px' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Batch & Commercial Comparison */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: '6px',
                  padding: '14px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <Layers size={14} color="var(--accent-cyan)" />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Batch Production Quantity
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                  {[50, 100, 250, 500, 1000].map((qty) => (
                    <button
                      key={qty}
                      onClick={() => setBatchSize(qty)}
                      style={{
                        flex: 1,
                        padding: '5px 0',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: '4px',
                        border: batchSize === qty ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                        backgroundColor: batchSize === qty ? 'rgba(0, 210, 255, 0.15)' : 'transparent',
                        color: batchSize === qty ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      {qty}
                    </button>
                  ))}
                </div>

                <input
                  type="number"
                  step="10"
                  min="10"
                  max="10000"
                  value={batchSize}
                  onChange={(e) => setBatchSize(parseInt(e.target.value) || 50)}
                  className="input-control"
                  style={{ width: '100%', padding: '6px 8px', fontSize: '12px' }}
                />
              </div>

              {/* Factory Comparison Box */}
              <div
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: '6px',
                  padding: '14px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <PiggyBank size={14} color="var(--accent-orange)" />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Factory Ammunition Comparison
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <div>
                    <label className="input-label" style={{ fontSize: '10px' }}>Factory Box Price ($)</label>
                    <input
                      type="number"
                      step="1.00"
                      min="5"
                      max="200"
                      value={factoryBoxPrice}
                      onChange={(e) => setFactoryBoxPrice(parseFloat(e.target.value) || 0)}
                      className="input-control"
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label className="input-label" style={{ fontSize: '10px' }}>Rds / Box</label>
                    <input
                      type="number"
                      step="5"
                      min="10"
                      max="100"
                      value={factoryBoxCount}
                      onChange={(e) => setFactoryBoxCount(parseInt(e.target.value) || 20)}
                      className="input-control"
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px' }}
                    />
                  </div>
                </div>

                {/* Breakeven analysis */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderRadius: '4px',
                    padding: '8px',
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.4',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-gold)', fontWeight: 600 }}>
                    <Sparkles size={12} /> Press &amp; Equipment ROI
                  </div>
                  <div>
                    At a savings of <strong>${(costs.factoryCostPerRound - costs.totalHandloadPerRound).toFixed(3)}</strong> per round, a $500 reloading press pays for itself completely after <strong>{Math.ceil(500 / Math.max(0.01, costs.factoryCostPerRound - costs.totalHandloadPerRound))}</strong> rounds loaded.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Component Cost Share Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Cost Share Breakdown</span>
              <span style={{ color: 'var(--text-muted)' }}>
                Powder: {((costs.powderCostPerRound / costs.totalHandloadPerRound) * 100).toFixed(0)}% | 
                Primer: {((costs.primerCostPerRound / costs.totalHandloadPerRound) * 100).toFixed(0)}% | 
                Bullet: {((costs.bulletCostPerRound / costs.totalHandloadPerRound) * 100).toFixed(0)}% | 
                Brass: {((costs.brassCostPerRound / costs.totalHandloadPerRound) * 100).toFixed(0)}%
              </span>
            </div>
            <div style={{ height: '8px', borderRadius: '4px', display: 'flex', overflow: 'hidden', backgroundColor: 'var(--bg-primary)' }}>
              <div style={{ width: `${(costs.powderCostPerRound / costs.totalHandloadPerRound) * 100}%`, backgroundColor: '#ff9800' }} title="Powder" />
              <div style={{ width: `${(costs.primerCostPerRound / costs.totalHandloadPerRound) * 100}%`, backgroundColor: '#00d2ff' }} title="Primer" />
              <div style={{ width: `${(costs.bulletCostPerRound / costs.totalHandloadPerRound) * 100}%`, backgroundColor: '#00e676' }} title="Bullet" />
              <div style={{ width: `${(costs.brassCostPerRound / costs.totalHandloadPerRound) * 100}%`, backgroundColor: '#ffd700' }} title="Brass" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Batch total: <strong>${costs.totalHandloadBatch.toFixed(2)}</strong> (vs factory <strong>${costs.totalFactoryBatch.toFixed(2)}</strong>)
          </div>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '12px' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
