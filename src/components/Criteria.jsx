import { useState } from 'react'
import { Btn, EmptyState, Field, Modal, Panel, PanelHeader } from './ui'
import { emitToast } from './ui'

export default function Criteria({ state, addCriterion, deleteCriterion }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [cat, setCat] = useState('')

  const handleSave = () => {
    if (!name.trim()) { emitToast('Please enter a criterion name', 'error'); return }
    addCriterion(name.trim(), cat.trim())
    setName(''); setCat(''); setOpen(false)
    emitToast('Criterion added ✓')
  }

  return (
    <div className="p-8 animate-fadeIn">
      <div className="grid grid-cols-2 gap-5">
        <Panel>
          <PanelHeader title="📋 QA Criteria" action={<Btn onClick={() => setOpen(true)}>+ Add</Btn>} />
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
                      <Btn variant="danger" onClick={() => { deleteCriterion(c.id); emitToast('Criterion removed') }} className="!px-2.5 !py-1 !text-xs">✕</Btn>
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
              ['1. Define your criteria', 'Add QA attributes you score calls on (e.g. "Agent greeted properly", "Call resolved")'],
              ['2. Score calls', 'For each call, mark each criterion as Pass ✓ or Fail ✗'],
              ['3. A call passes if…', 'All criteria are marked Pass. One fail = the call fails overall.'],
              ['4. Track trends', 'View per-agent scores, criteria fail rates, and reviewer activity in Reports.'],
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
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Agent greeted properly" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSave()} />
          </Field>
          <Field label="Category (optional)">
            <input value={cat} onChange={(e) => setCat(e.target.value)} placeholder="e.g. Opening, Compliance, Closing" />
          </Field>
        </div>
      </Modal>
    </div>
  )
}
