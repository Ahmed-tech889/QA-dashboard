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
      if (lines.length < 2) { emitToast('CSV file is empty', 'error'); return }

      // Normalise headers: trim, strip quotes, lowercase, collapse spaces to underscore
      const headers = lines[0].split(',').map((h) =>
        h.trim().replace(/"/g, '').toLowerCase().replace(/\s+/g, '_')
      )

      // Only Agent is required
      if (!headers.includes('agent')) {
        emitToast('Missing required column: Agent', 'error'); return
      }

      const rows = []
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        // Quote-aware CSV split (handles URLs with commas inside quotes)
        const vals = []
        let inQuotes = false, current = ''
        for (const ch of line) {
          if (ch === '"') { inQuotes = !inQuotes }
          else if (ch === ',' && !inQuotes) { vals.push(current.trim()); current = '' }
          else { current += ch }
        }
        vals.push(current.trim())

        const row = {}
        headers.forEach((h, idx) => (row[h] = (vals[idx] || '').replace(/^"|"$/g, '').trim()))

        if (!row.agent) continue

        // Date: strip time portion from "2026-03-27 00:00:00" → "2026-03-27"
        const rawDate = row.date || ''
        const callDate = rawDate.includes(' ')
          ? rawDate.split(' ')[0]
          : rawDate || new Date().toISOString().split('T')[0]

        // Derive email: "Abdallah Wael" → "abdallah.wael@momentumegypt.com"
        const agentName  = row.agent.trim()
        const agentEmail = agentName.toLowerCase().replace(/\s+/g, '.') + '@momentumegypt.com'

        rows.push({
          agentName,
          agentEmail,
          callDate,
          sid:         row.sid          || '',
          waitDuration: row.waiting_time || '',
          talkDuration: row.talk_time    || '',
          wrapDuration: row.wrap_up_time || '',
          // unused fields left blank
          callLink:  '',
          reviewer:  '',
          notes:     '',
          scores:    {},
          result:    'pending',
        })
      }

      if (rows.length === 0) { emitToast('No valid rows found in CSV', 'error'); return }
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
                  <Field label="SID">
                    <input value={form.sid || ''} onChange={(e) => setForm((f) => ({ ...f, sid: e.target.value }))} placeholder="e.g. CA73f098ff..." />
                  </Field>
                  <Field label="Call Link (optional)" full>
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
                {/* Column reference */}
                <div className="flex flex-col gap-2 px-4 py-3.5 bg-accent/8 border border-accent/20 rounded-lg mb-4">
                  <div className="text-xs text-txt2 font-medium mb-0.5">
                    ℹ️ Only these columns are used — only <span className="text-accent font-bold">Agent</span> is required:
                  </div>
                  <div className="flex flex-col gap-1">
                    {[
                      ['Agent',        'Agent full name — required',     true],
                      ['Date',         'Call date',                      false],
                      ['SID',          'Session / call ID',              false],
                      ['Waiting Time', 'Wait duration',                  false],
                      ['Talk Time',    'Talk duration',                  false],
                      ['Wrap Up Time', 'Wrap-up duration',               false],
                    ].map(([col, desc, required]) => (
                      <div key={col} className="flex items-center gap-2">
                        <span className={`font-mono text-[11px] font-medium w-28 shrink-0 ${required ? 'text-accent' : 'text-txt2'}`}>{col}</span>
                        <span className="text-txt3 text-[10px]">— {desc}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-1 text-[10px] text-txt3">All other columns in the file are ignored.</div>
                </div>

                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-all"
                >
                  <div className="text-3xl mb-2.5">📂</div>
                  <div className="text-sm text-txt2 mb-1">Click to upload or drag & drop CSV</div>
                  <div className="font-mono text-[11px] text-txt3">calls-import.csv</div>
                </div>
                <input ref={fileRef} type="file" accept=".csv" className="hidden"
                  onChange={(e) => { handleCSV(e.target.files[0]); e.target.value = '' }} />

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
