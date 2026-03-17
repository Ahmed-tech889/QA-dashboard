import { useState } from 'react'
import { Btn, EmptyState, Field, Modal, Panel, PanelHeader } from './ui'
import { emitToast } from './ui'

function WeightBadge({ weight, onEdit }) {
  return (
    <button
      onClick={onEdit}
      title="Click to edit weight"
      className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface3 border border-border hover:border-accent/40 transition-all cursor-pointer group"
    >
      <span className="font-mono text-[11px] text-txt3 group-hover:text-txt2">{weight ?? 100}%</span>
      <span className="text-[9px] text-txt3 group-hover:text-accent">✎</span>
    </button>
  )
}

export default function Criteria({ state, addCriterion, deleteCriterion, updateCriterionWeight }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [cat, setCat] = useState('')
  const [weight, setWeight] = useState('100')
  const [editingWeight, setEditingWeight] = useState(null)
  const [editWeightVal, setEditWeightVal] = useState('')

  const totalWeight = state.criteria.reduce((sum, c) => sum + (c.weight ?? 100), 0)

  const handleSave = () => {
    if (!name.trim()) { emitToast('Please enter a criterion name', 'error'); return }
    const w = Math.min(100, Math.max(1, parseInt(weight) || 100))
    addCriterion(name.trim(), cat.trim(), w)
    setName(''); setCat(''); setWeight('100'); setOpen(false)
    emitToast('Criterion added ✓')
  }

  const startEditWeight = (c) => {
    setEditingWeight(c.id)
    setEditWeightVal(String(c.weight ?? 100))
  }

  const commitEditWeight = (id) => {
    const w = Math.min(100, Math.max(1, parseInt(editWeightVal) || 100))
    updateCriterionWeight(id, w)
    setEditingWeight(null)
    emitToast('Weight updated ✓')
  }

  return (
    <div className="p-8 animate-fadeIn">
      <div className="grid grid-cols-2 gap-5">
        <Panel>
          <PanelHeader
            title="📋 QA Criteria"
            action={
              <div className="flex items-center gap-2.5">
                {state.criteria.length > 0 && (
                  <span className="font-mono text-[11px] text-txt3">
                    Total weight: <span className={totalWeight === 100 ? 'text-pass' : 'text-accent4'}>{totalWeight}</span>
                  </span>
                )}
                <Btn onClick={() => setOpen(true)}>+ Add</Btn>
              </div>
            }
          />
          <div className="p-5">
            {state.criteria.length === 0
              ? <EmptyState icon="📋" title="No criteria yet" sub="Add your first QA criterion" />
              : <div className="flex flex-col gap-2.5">
                  {state.criteria.map((c, i) => (
                    <div key={c.id} className="flex items-center justify-between px-4 py-3.5 bg-surface2 border border-border rounded-lg hover:border-accent/30 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-[22px] h-[22px] bg-surface3 rounded-md grid place-items-center font-mono text-[10px] text-txt3 shrink-0">
                          {i + 1}
                        </div>
                        <div>
                          <div className="text-[13.5px] font-medium">{c.name}</div>
                          {c.cat && <div className="font-mono text-[11px] text-txt3">{c.cat}</div>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {editingWeight === c.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={editWeightVal}
                              onChange={(e) => setEditWeightVal(e.target.value)}
                              onBlur={() => commitEditWeight(c.id)}
                              onKeyDown={(e) => { if (e.key === 'Enter') commitEditWeight(c.id); if (e.key === 'Escape') setEditingWeight(null) }}
                              className="w-[60px] !py-0.5 !px-2 text-center text-xs"
                              autoFocus
                            />
                            <span className="font-mono text-xs text-txt3">%</span>
                          </div>
                        ) : (
                          <WeightBadge weight={c.weight} onEdit={() => startEditWeight(c)} />
                        )}
                        <Btn variant="danger" onClick={() => { deleteCriterion(c.id); emitToast('Criterion removed') }} className="!px-2.5 !py-1 !text-xs">✕</Btn>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="ℹ️ How It Works" />
          <div className="p-5 flex flex-col gap-4 text-[13px] text-txt2 leading-relaxed">
            {[
              ['1. Define your criteria', 'Add QA attributes you score calls on (e.g. "Agent greeted properly", "Call resolved"). Each criterion has a weight (1–100).'],
              ['2. Set weights', 'Click the % badge on any criterion to edit its weight. Weights control how much each criterion contributes to the final score.'],
              ['3. Score calls', 'For each call, mark each criterion as Pass ✓, Fail ✗, or N/A. N/A criteria are excluded from the score.'],
              ['4. Pass threshold is 60%', 'A call passes if the weighted score is ≥ 60%. The live score updates as you score criteria.'],
              ['5. Track trends', 'View per-agent scores, criteria fail rates, and reviewer activity in Reports.'],
            ].map(([title, desc]) => (
              <div key={title}>
                <div className="text-txt font-semibold mb-1">{title}</div>
                <div>{desc}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add QA Criterion"
        footer={<>
          <Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
          <Btn onClick={handleSave}>Add Criterion</Btn>
        </>}
      >
        <div className="flex flex-col gap-4">
          <Field label="Criterion Name">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder='e.g. Agent greeted properly' autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSave()} />
          </Field>
          <Field label="Category (optional)">
            <input value={cat} onChange={(e) => setCat(e.target.value)} placeholder="e.g. Opening, Compliance, Closing" />
          </Field>
          <Field label="Weight (1–100)">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="100"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="100"
              />
              <span className="font-mono text-sm text-txt3 shrink-0">%</span>
            </div>
            <p className="text-[11px] text-txt3 mt-1">How much this criterion contributes to the overall score.</p>
          </Field>
        </div>
      </Modal>
    </div>
  )
}
