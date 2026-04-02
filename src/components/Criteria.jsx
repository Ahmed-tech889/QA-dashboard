import { useState } from 'react'
import { Btn, EmptyState, Field, Modal, Panel, PanelHeader } from './ui'
import { emitToast } from './ui'

function WeightBadge({ weight, onEdit }) {
  return (
    <button onClick={onEdit} title="Click to edit weight"
      className="flex items-center gap-1 px-2 py-0.5 rounded-md cursor-pointer group transition-all"
      style={{ background: '#ebebee', border: '1px solid #d0d0d6' }}>
      <span className="text-[11px]" style={{ color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>{weight ?? 100}%</span>
      <span className="text-[9px]" style={{ color: '#a0a0b0' }}>✎</span>
    </button>
  )
}

export default function Criteria({ state, addCriterion, deleteCriterion, updateCriterionWeight, addTemplate, updateTemplate, deleteTemplate }) {
  const [activeTab,      setActiveTab]      = useState('criteria')
  const [open,           setOpen]           = useState(false)
  const [name,           setName]           = useState('')
  const [cat,            setCat]            = useState('')
  const [weight,         setWeight]         = useState('100')
  const [editingWeight,  setEditingWeight]  = useState(null)
  const [editWeightVal,  setEditWeightVal]  = useState('')
  const [templateOpen,   setTemplateOpen]   = useState(false)
  const [editTemplate,   setEditTemplate]   = useState(null)
  const [tplName,        setTplName]        = useState('')
  const [tplDesc,        setTplDesc]        = useState('')
  const [tplCrits,       setTplCrits]       = useState([])

  const totalWeight = state.criteria.reduce((sum, c) => sum + (c.weight ?? 100), 0)

  const handleSaveCriterion = () => {
    if (!name.trim()) { emitToast('Please enter a criterion name', 'error'); return }
    const w = Math.min(100, Math.max(1, parseInt(weight) || 100))
    addCriterion(name.trim(), cat.trim(), w)
    setName(''); setCat(''); setWeight('100'); setOpen(false)
    emitToast('Criterion added ✓')
  }

  const startEditWeight = (c) => { setEditingWeight(c.id); setEditWeightVal(String(c.weight ?? 100)) }

  const commitEditWeight = (id) => {
    const w = Math.min(100, Math.max(1, parseInt(editWeightVal) || 100))
    updateCriterionWeight(id, w)
    setEditingWeight(null)
    emitToast('Weight updated ✓')
  }

  const openNewTemplate = () => {
    setEditTemplate(null); setTplName(''); setTplDesc(''); setTplCrits([])
    setTemplateOpen(true)
  }

  const openEditTemplate = (t) => {
    setEditTemplate(t); setTplName(t.name); setTplDesc(t.description || ''); setTplCrits(t.criteriaIds || [])
    setTemplateOpen(true)
  }

  const handleSaveTemplate = () => {
    if (!tplName.trim()) { emitToast('Please enter a template name', 'error'); return }
    if (tplCrits.length === 0) { emitToast('Select at least one criterion', 'error'); return }
    if (editTemplate) {
      updateTemplate(editTemplate.id, { name: tplName.trim(), description: tplDesc.trim(), criteriaIds: tplCrits })
      emitToast('Template updated ✓')
    } else {
      addTemplate(tplName.trim(), tplDesc.trim(), tplCrits)
      emitToast('Template created ✓')
    }
    setTemplateOpen(false)
  }

  const toggleTplCrit = (id) =>
    setTplCrits((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id])

  const inputStyle = {
    background: '#f5f5f8', border: '1px solid #d0d0d6', borderRadius: 8,
    padding: '8px 12px', color: '#1a1a2e', fontSize: 13,
    fontFamily: "'Poppins',sans-serif", outline: 'none', width: '100%',
  }

  const tabStyle = (active) => ({
    padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
    cursor: 'pointer', fontFamily: "'Poppins',sans-serif",
    background: active ? '#2563eb' : '#dcdce0',
    color:      active ? '#fff'    : '#505060',
    border:     active ? 'none'    : '1px solid #c8c8ce',
    transition: 'all 0.15s',
  })

  return (
    <div className="p-7 animate-fadeIn">

      {/* Tab bar */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab('criteria')} style={tabStyle(activeTab === 'criteria')}>
          QA Criteria
        </button>
        <button onClick={() => setActiveTab('templates')} style={tabStyle(activeTab === 'templates')}>
          Scorecard Templates
          {(state.templates || []).length > 0 && (
            <span className="ml-2 px-1.5 py-px rounded-full text-[10px] font-bold"
              style={{ background: 'rgba(255,255,255,0.3)', fontFamily: "'Poppins',sans-serif" }}>
              {(state.templates || []).length}
            </span>
          )}
        </button>
      </div>

      {/* ── Criteria tab ── */}
      {activeTab === 'criteria' && (
        <div className="grid grid-cols-2 gap-5">
          <Panel>
            <PanelHeader
              title="QA Criteria"
              action={
                <div className="flex items-center gap-2.5">
                  {state.criteria.length > 0 && (
                    <span className="text-[11px]" style={{ color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>
                      Total: <span style={{ color: totalWeight === 100 ? '#16a34a' : '#d97706', fontWeight: 600 }}>{totalWeight}</span>
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
                      <div key={c.id} className="flex items-center justify-between px-4 py-3.5 rounded-xl transition-all"
                        style={{ background: '#ebebee', border: '1px solid #d0d0d6' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-[22px] h-[22px] rounded-md flex items-center justify-center text-[10px] font-bold shrink-0"
                            style={{ background: '#dcdce0', color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>
                            {i + 1}
                          </div>
                          <div>
                            <div className="text-[13.5px] font-medium" style={{ color: '#1a1a2e' }}>{c.name}</div>
                            {c.cat && <div className="text-[11px]" style={{ color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>{c.cat}</div>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {editingWeight === c.id ? (
                            <div className="flex items-center gap-1">
                              <input type="number" min="1" max="100" value={editWeightVal}
                                onChange={(e) => setEditWeightVal(e.target.value)}
                                onBlur={() => commitEditWeight(c.id)}
                                onKeyDown={(e) => { if (e.key === 'Enter') commitEditWeight(c.id); if (e.key === 'Escape') setEditingWeight(null) }}
                                className="w-[60px] text-center text-xs"
                                style={{ padding: '2px 6px', height: 28 }}
                                autoFocus />
                              <span className="text-xs" style={{ color: '#8888a0' }}>%</span>
                            </div>
                          ) : (
                            <WeightBadge weight={c.weight} onEdit={() => startEditWeight(c)} />
                          )}
                          <Btn variant="danger"
                            onClick={() => { deleteCriterion(c.id); emitToast('Criterion removed') }}
                            className="!px-2.5 !py-1 !text-xs">✕</Btn>
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="How It Works" />
            <div className="p-5 flex flex-col gap-4 text-[13px] leading-relaxed" style={{ color: '#505060' }}>
              {[
                ['1. Define your criteria', 'Add QA attributes you score calls on. Each criterion has a weight (1–100).'],
                ['2. Set weights', 'Click the % badge to edit weight. Weights control how much each criterion contributes.'],
                ['3. Create templates', 'Group criteria into named templates — e.g. "Sales calls" vs "Support calls".'],
                ['4. Score calls', 'Mark each criterion as Pass ✓, Fail ✗, or N/A. Pass threshold is 60%.'],
                ['5. Track trends', 'View per-agent scores, fail rates, and trends in Reports and Agents.'],
              ].map(([title, desc]) => (
                <div key={title}>
                  <div className="font-semibold mb-1" style={{ color: '#1a1a2e' }}>{title}</div>
                  <div>{desc}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {/* ── Templates tab ── */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-2 gap-5">
          <Panel>
            <PanelHeader
              title="Scorecard Templates"
              action={
                <button onClick={openNewTemplate} className="hover:opacity-80 transition-all"
                  style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    fontFamily: "'Poppins',sans-serif", background: '#2563eb', border: 'none', color: '#fff' }}>
                  + New Template
                </button>
              }
            />
            <div className="p-5">
              {(state.templates || []).length === 0
                ? <EmptyState icon="📑" title="No templates yet" sub="Create templates to use different criteria per call type" />
                : <div className="flex flex-col gap-3">
                    {(state.templates || []).map((t) => {
                      const critNames = (t.criteriaIds || [])
                        .map((id) => state.criteria.find((c) => c.id === id)?.name)
                        .filter(Boolean)
                      return (
                        <div key={t.id} className="px-4 py-3.5 rounded-xl group transition-all"
                          style={{ background: '#ebebee', border: '1px solid #d0d0d6' }}>
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="font-semibold text-[14px]" style={{ color: '#1a1a2e', fontFamily: "'Poppins',sans-serif" }}>{t.name}</div>
                              {t.description && (
                                <div className="text-[12px] mt-0.5" style={{ color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>{t.description}</div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEditTemplate(t)}
                                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg cursor-pointer hover:opacity-80"
                                style={{ background: '#e8f0ff', color: '#2563eb', border: '1px solid #c8d4f0', fontFamily: "'Poppins',sans-serif" }}>
                                Edit
                              </button>
                              <button onClick={() => { deleteTemplate(t.id); emitToast('Template removed') }}
                                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg cursor-pointer hover:opacity-80"
                                style={{ background: '#fde8ec', color: '#e11d48', border: '1px solid #f8c0cc', fontFamily: "'Poppins',sans-serif" }}>
                                ✕
                              </button>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded"
                              style={{ background: '#dcdce0', color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>
                              {critNames.length} criteria
                            </span>
                            {critNames.slice(0, 3).map((n) => (
                              <span key={n} className="text-[10px] px-2 py-0.5 rounded"
                                style={{ background: '#e8f0ff', color: '#2563eb', border: '1px solid #c8d4f0', fontFamily: "'Poppins',sans-serif" }}>
                                {n}
                              </span>
                            ))}
                            {critNames.length > 3 && (
                              <span className="text-[10px] px-2 py-0.5 rounded"
                                style={{ background: '#dcdce0', color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>
                                +{critNames.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
              }
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="About Templates" />
            <div className="p-5 flex flex-col gap-4 text-[13px] leading-relaxed" style={{ color: '#505060' }}>
              {[
                ['What are templates?', 'Templates let you group criteria into named scorecard sets — e.g. one set for sales calls and a different set for support calls.'],
                ['How to use them', 'Create a template by selecting which criteria it includes. When reviewing a call, pick the template that matches the call type.'],
                ['Example use case', '"Complaints" template uses empathy + resolution criteria. "Sales" template uses closing + offer criteria. Each gets scored differently.'],
              ].map(([title, desc]) => (
                <div key={title}>
                  <div className="font-semibold mb-1" style={{ color: '#1a1a2e' }}>{title}</div>
                  <div>{desc}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {/* ── Add Criterion Modal ── */}
      <Modal open={open} onClose={() => setOpen(false)} title="Add QA Criterion"
        footer={<><Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn><Btn onClick={handleSaveCriterion}>Add Criterion</Btn></>}>
        <div className="flex flex-col gap-4">
          <Field label="Criterion Name">
            <input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Agent greeted properly" autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSaveCriterion()} />
          </Field>
          <Field label="Category (optional)">
            <input value={cat} onChange={(e) => setCat(e.target.value)}
              placeholder="e.g. Opening, Compliance, Closing" />
          </Field>
          <Field label="Weight (1–100)">
            <div className="flex items-center gap-2">
              <input type="number" min="1" max="100" value={weight}
                onChange={(e) => setWeight(e.target.value)} placeholder="100" />
              <span className="text-sm shrink-0" style={{ color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>%</span>
            </div>
            <p className="text-[11px] mt-1" style={{ color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>
              How much this criterion contributes to the overall score.
            </p>
          </Field>
        </div>
      </Modal>

      {/* ── Template Modal ── */}
      <Modal open={templateOpen} onClose={() => setTemplateOpen(false)}
        title={editTemplate ? 'Edit Template' : 'New Scorecard Template'}
        footer={<><Btn variant="ghost" onClick={() => setTemplateOpen(false)}>Cancel</Btn><Btn onClick={handleSaveTemplate}>{editTemplate ? 'Save Changes' : 'Create Template'}</Btn></>}>
        <div className="flex flex-col gap-4">
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', color: '#8888a0', fontFamily: "'Poppins',sans-serif", display: 'block', marginBottom: 6 }}>
              Template Name
            </label>
            <input value={tplName} onChange={(e) => setTplName(e.target.value)}
              placeholder="e.g. Sales Calls, Support Calls, Complaints"
              autoFocus style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', color: '#8888a0', fontFamily: "'Poppins',sans-serif", display: 'block', marginBottom: 6 }}>
              Description (optional)
            </label>
            <input value={tplDesc} onChange={(e) => setTplDesc(e.target.value)}
              placeholder="When to use this template..."
              style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', color: '#8888a0', fontFamily: "'Poppins',sans-serif", display: 'block', marginBottom: 8 }}>
              Select Criteria
            </label>
            {state.criteria.length === 0 ? (
              <p className="text-[13px]" style={{ color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>
                No criteria defined yet. Add criteria first.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {state.criteria.map((c) => {
                  const selected = tplCrits.includes(c.id)
                  return (
                    <label key={c.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all"
                      style={{ background: selected ? '#e8f0ff' : '#ebebee', border: `1px solid ${selected ? '#c8d4f0' : '#d0d0d6'}` }}>
                      <input type="checkbox" checked={selected} onChange={() => toggleTplCrit(c.id)}
                        style={{ cursor: 'pointer', width: 14, height: 14, accentColor: '#2563eb', flexShrink: 0 }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium" style={{ color: '#1a1a2e' }}>{c.name}</div>
                        {c.cat && <div className="text-[11px]" style={{ color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>{c.cat}</div>}
                      </div>
                      <span className="text-[10px] px-1.5 py-px rounded shrink-0"
                        style={{ background: '#dcdce0', color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>
                        {c.weight ?? 100}%
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
