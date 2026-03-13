import { useState, useRef } from 'react'
import { Btn, EmptyState, Field, Panel, PanelHeader } from './ui'
import { emitToast } from './ui'

function PFButton({ label, selected, onClick, isPass }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-1 rounded-lg text-xs font-semibold font-mono cursor-pointer border transition-all
        ${selected && isPass ? 'bg-pass/15 text-pass border-pass' :
          selected && !isPass ? 'bg-fail/15 text-fail border-fail' :
          'bg-surface3 text-txt3 border-border hover:text-txt'}`}
    >
      {label}
    </button>
  )
}

export default function ReviewCall({ state, addReview, addReviews }) {
  const [tab, setTab] = useState('manual')
  const [form, setForm] = useState({
    agentName: '', agentId: '', callDate: new Date().toISOString().split('T')[0],
    callLink: '', reviewer: '', notes: '', grade: '',
  })
  const [scores, setScores] = useState({})
  const [csvPreview, setCsvPreview] = useState(null)
  const fileRef = useRef()

  const agentNames = [...new Set(state.reviews.map((r) => r.agentName))]

  const setScore = (id, val) => setScores((s) => ({ ...s, [id]: val }))

  const handleSubmit = () => {
    if (!form.agentName || !form.callLink || !form.reviewer) {
      emitToast('Agent name, call link, and reviewer are required', 'error'); return
    }
    if (state.criteria.length > 0 && state.criteria.some((c) => !scores[c.id])) {
      emitToast('Please score all criteria before saving', 'error'); return
    }
    const passed = state.criteria.length === 0 || state.criteria.every((c) => scores[c.id] === 'pass')
    addReview({ ...form, scores, result: passed ? 'pass' : 'fail' })
    setForm({ agentName: '', agentId: '', callDate: new Date().toISOString().split('T')[0], callLink: '', reviewer: '', notes: '', grade: '' })
    setScores({})
    emitToast(`Review saved — ${passed ? '✓ PASS' : '✗ FAIL'}`)
  }

  const handleCSV = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const lines = e.target.result.trim().split('\n')
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''))
      const required = ['agent_name', 'call_link', 'reviewer']
      const missing = required.filter((r) => !headers.includes(r))
      if (missing.length) { emitToast(`Missing columns: ${missing.join(', ')}`, 'error'); return }

      const rows = []
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(',').map((v) => v.trim().replace(/"/g, ''))
        const row = {}
        headers.forEach((h, idx) => (row[h] = vals[idx] || ''))
        if (!row.agent_name || !row.call_link) continue
        rows.push({
          agentName: row.agent_name, agentId: row.agent_id || '',
          callDate: row.call_date || new Date().toISOString().split('T')[0],
          callLink: row.call_link, reviewer: row.reviewer, notes: row.notes || '',
          scores: {}, result: 'pending',
        })
      }
      addReviews(rows)
      setCsvPreview(rows.length)
      emitToast(`Imported ${rows.length} calls ✓`)
    }
    reader.readAsText(file)
  }

  return (
    <div className="p-8 animate-fadeIn">
      <div className="max-w-2xl">
        <Panel>
          <PanelHeader title="🎧 Log a Call Review" />
          <div className="p-6">
            {/* Tabs */}
            <div className="flex gap-1 mb-5">
              {['manual', 'csv'].map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-mono cursor-pointer border transition-all
                    ${tab === t ? 'bg-accent text-white border-accent' : 'bg-surface2 text-txt3 border-border hover:text-txt'}`}>
                  {t === 'manual' ? 'Manual Entry' : 'CSV Upload'}
                </button>
              ))}
            </div>

            {/* Manual Tab */}
            {tab === 'manual' && (
              <div>
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <Field label="Agent Name">
                    <input value={form.agentName} onChange={(e) => setForm((f) => ({ ...f, agentName: e.target.value }))}
                      placeholder="e.g. Sara Al-Khatib" list="agent-dl" />
                    <datalist id="agent-dl">{agentNames.map((n) => <option key={n} value={n} />)}</datalist>
                  </Field>
                  <Field label="Agent ID">
                    <input value={form.agentId} onChange={(e) => setForm((f) => ({ ...f, agentId: e.target.value }))} placeholder="e.g. AGT-042" />
                  </Field>
                  <Field label="Call Date">
                    <input type="date" value={form.callDate} onChange={(e) => setForm((f) => ({ ...f, callDate: e.target.value }))} />
                  </Field>
                  <Field label="Reviewer">
                    <input value={form.reviewer} onChange={(e) => setForm((f) => ({ ...f, reviewer: e.target.value }))} placeholder="Your name" />
                  </Field>
                  <Field label="Performance Grade (optional)">
                    <select value={form.grade} onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}>
                      <option value="">— No grade —</option>
                      {[...Array(10)].map((_, i) => {
                        const val = 10 - i
                        const color = val >= 8 ? '🟢' : val >= 5 ? '🟡' : '🔴'
                        return <option key={val} value={val}>{color} {val} / 10</option>
                      })}
                    </select>
                  </Field>
                  <Field label="Call Link" full>
                    <input type="url" value={form.callLink} onChange={(e) => setForm((f) => ({ ...f, callLink: e.target.value }))} placeholder="https://portal.example.com/calls/12345" />
                  </Field>
                  <Field label="Notes (optional)" full>
                    <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Any observations about this call..." />
                  </Field>
                </div>

                {/* Scoring */}
                <div className="mb-5">
                  <div className="font-syne font-bold text-sm mb-3.5">QA Criteria Scoring</div>
                  {state.criteria.length === 0
                    ? <div className="text-center py-6 text-txt3 text-sm">No criteria defined yet. Go to QA Criteria to add some.</div>
                    : <div className="flex flex-col gap-2.5">
                        {state.criteria.map((c) => (
                          <div key={c.id} className="flex items-center justify-between px-4 py-3 bg-surface2 border border-border rounded-lg">
                            <div>
                              <div className="text-[13px] font-medium">{c.name}</div>
                              {c.cat && <div className="font-mono text-[11px] text-txt3">{c.cat}</div>}
                            </div>
                            <div className="flex gap-1.5">
                              <PFButton label="✓ Pass" isPass selected={scores[c.id] === 'pass'} onClick={() => setScore(c.id, 'pass')} />
                              <PFButton label="✗ Fail" isPass={false} selected={scores[c.id] === 'fail'} onClick={() => setScore(c.id, 'fail')} />
                            </div>
                          </div>
                        ))}
                      </div>
                  }
                </div>

                <div className="flex justify-end gap-2.5">
                  <Btn variant="ghost" onClick={() => { setForm({ agentName:'',agentId:'',callDate:new Date().toISOString().split('T')[0],callLink:'',reviewer:'',notes:'',grade:'' }); setScores({}) }}>Clear</Btn>
                  <Btn onClick={handleSubmit}>Save Review ✓</Btn>
                </div>
              </div>
            )}

            {/* CSV Tab */}
            {tab === 'csv' && (
              <div>
                <div className="flex items-center gap-2 px-3.5 py-2.5 bg-accent/8 border border-accent/20 rounded-lg text-xs text-txt2 mb-4">
                  ℹ️ CSV must have columns:&nbsp;
                  <span className="text-accent font-medium">agent_name, agent_id, call_date, call_link, reviewer</span>
                </div>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-all"
                >
                  <div className="text-3xl mb-2.5">📂</div>
                  <div className="text-sm text-txt2 mb-1">Click to upload or drag & drop CSV</div>
                  <div className="font-mono text-[11px] text-txt3">calls-import.csv</div>
                </div>
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => handleCSV(e.target.files[0])} />
                {csvPreview !== null && (
                  <div className="mt-4 flex items-center gap-2 px-3.5 py-2.5 bg-pass/8 border border-pass/20 rounded-lg text-xs text-pass">
                    ✓ {csvPreview} calls imported successfully.
                  </div>
                )}
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  )
}
