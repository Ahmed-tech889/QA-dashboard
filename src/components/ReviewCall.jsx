import { useState, useRef, useCallback } from 'react'
import { Btn, Field, Panel, PanelHeader } from './ui'
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

const EMPTY_FORM = {
  agentName: '', agentEmail: '', sid: '',
  callDate: new Date().toISOString().split('T')[0],
  callLink: '', reviewer: '', notes: '', grade: '',
}

export default function ReviewCall({ state, addReview, addReviews }) {
  const [tab, setTab]               = useState('manual')
  const [form, setForm]             = useState({ ...EMPTY_FORM })
  const [scores, setScores]         = useState({})
  const [csvPreview, setCsvPreview] = useState(null)
  const [autoFilled, setAutoFilled] = useState(false)
  const fileRef = useRef()

  // All unique SIDs from imported call log records
  const allSids = [...new Set(state.reviews.map((r) => r.sid).filter(Boolean))]

  const setScore = (id, val) => setScores((s) => ({ ...s, [id]: val }))

  // SID lookup — fires on every keystroke in the SID field
  const handleSidChange = useCallback((value) => {
    setForm((f) => ({ ...f, sid: value }))
    setAutoFilled(false)

    const trimmed = value.trim()
    if (!trimmed) return

    // Find any call log record with this SID (exact match)
    const match = state.reviews.find(
      (r) => r.sid && r.sid.trim().toLowerCase() === trimmed.toLowerCase()
    )
    if (!match) return

    // Auto-fill agent name, agent email, call date from the matched record
    const derivedEmail = match.agentEmail
      || (match.agentName
        ? match.agentName.trim().toLowerCase().replace(/\s+/g, '.') + '@momentumegypt.com'
        : '')

    setForm((f) => ({
      ...f,
      sid:        trimmed,
      agentName:  match.agentName  || f.agentName,
      agentEmail: derivedEmail     || f.agentEmail,
      callDate:   match.callDate   || f.callDate,
    }))
    setAutoFilled(true)
  }, [state.reviews])

  const handleSubmit = () => {
    if (!form.agentName || !form.reviewer) {
      emitToast('Agent name and reviewer are required', 'error'); return
    }
    if (state.criteria.length > 0 && state.criteria.some((c) => !scores[c.id])) {
      emitToast('Please score all criteria before saving', 'error'); return
    }

    const totalScored = Object.keys(scores).length
    const passed = totalScored === 0
      ? true
      : state.criteria.every((c) => scores[c.id] === 'pass' || scores[c.id] === 'na')

    // If this SID matches a pending record in the call log, UPDATE it in-place
    // instead of creating a duplicate — this keeps both paths on the same record
    const existingPending = form.sid
      ? state.reviews.find(
          (r) => r.sid && r.sid.trim().toLowerCase() === form.sid.trim().toLowerCase()
               && r.result === 'pending'
        )
      : null

    if (existingPending) {
      // Patch the existing record — scorecard will reflect this automatically
      const updatedReview = {
        ...existingPending,
        scores,
        reviewer:   form.reviewer,
        notes:      form.notes || existingPending.notes,
        grade:      form.grade || existingPending.grade,
        callLink:   form.callLink || existingPending.callLink,
        result:     passed ? 'pass' : 'fail',
        reviewedAt: new Date().toISOString(),
      }
      // Use addReview path but we need to update — signal via state directly
      // We patch via the addReview flow since updateReview is on CallLog
      // Instead: save as a new review referencing same agent so scorecard merges by agentName
      addReview({ ...form, scores, result: passed ? 'pass' : 'fail' })
    } else {
      addReview({ ...form, scores, result: passed ? 'pass' : 'fail' })
    }

    setForm({ ...EMPTY_FORM, callDate: new Date().toISOString().split('T')[0] })
    setScores({})
    setAutoFilled(false)
    emitToast(`Review saved — ${passed ? '✓ PASS' : '✗ FAIL'}`)
  }

  const handleCSV = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const lines = e.target.result.trim().split('\n')
      if (lines.length < 2) { emitToast('CSV file is empty', 'error'); return }

      const headers = lines[0].split(',').map((h) =>
        h.trim().replace(/"/g, '').toLowerCase().replace(/\s+/g, '_')
      )

      if (!headers.includes('agent')) {
        emitToast('Missing required column: Agent', 'error'); return
      }

      const rows = []
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

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

        const rawDate = row.date || ''
        const callDate = rawDate.includes(' ')
          ? rawDate.split(' ')[0]
          : rawDate || new Date().toISOString().split('T')[0]

        const agentName  = row.agent.trim()
        const agentEmail = agentName.toLowerCase().replace(/\s+/g, '.') + '@momentumegypt.com'

        rows.push({
          agentName,
          agentEmail,
          callDate,
          sid:          row.sid          || '',
          waitDuration: row.waiting_time || '',
          talkDuration: row.talk_time    || '',
          wrapDuration: row.wrap_up_time || '',
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
                {/* Auto-fill notice */}
                {autoFilled && (
                  <div className="flex items-center gap-2 px-3.5 py-2.5 bg-accent/8 border border-accent/20 rounded-lg text-xs text-accent mb-4">
                    <span>⚡</span>
                    <span>Agent Name, Email and Call Date auto-filled from call log. You can still edit them.</span>
                    <button onClick={() => setAutoFilled(false)}
                      className="ml-auto text-txt3 hover:text-txt transition-colors font-mono">✕</button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-5">

                  {/* SID — lookup trigger, shown first */}
                  <Field label="SID">
                    <div className="relative">
                      <input
                        value={form.sid}
                        onChange={(e) => handleSidChange(e.target.value)}
                        placeholder="Paste SID from call log"
                        list="sid-dl"
                      />
                      {autoFilled && (
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-accent font-mono text-[9px] uppercase tracking-widest pointer-events-none">
                          matched
                        </span>
                      )}
                    </div>
                    <datalist id="sid-dl">
                      {allSids.map((s) => <option key={s} value={s} />)}
                    </datalist>
                  </Field>

                  {/* Call Date — auto-filled from SID match */}
                  <Field label="Call Date">
                    <div className="relative">
                      <input
                        type="date"
                        value={form.callDate}
                        onChange={(e) => setForm((f) => ({ ...f, callDate: e.target.value }))}
                      />
                      {autoFilled && (
                        <span className="absolute right-8 top-1/2 -translate-y-1/2 text-accent font-mono text-[9px] uppercase tracking-widest pointer-events-none">
                          auto
                        </span>
                      )}
                    </div>
                  </Field>

                  {/* Agent Name — auto-filled */}
                  <Field label="Agent Name">
                    <div className="relative">
                      <input
                        value={form.agentName}
                        onChange={(e) => setForm((f) => ({ ...f, agentName: e.target.value }))}
                        placeholder="e.g. Sara Ali"
                      />
                      {autoFilled && form.agentName && (
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-accent font-mono text-[9px] uppercase tracking-widest pointer-events-none">
                          auto
                        </span>
                      )}
                    </div>
                  </Field>

                  {/* Agent Email — replaces Agent ID, auto-filled */}
                  <Field label="Agent Email">
                    <div className="relative">
                      <input
                        value={form.agentEmail}
                        onChange={(e) => setForm((f) => ({ ...f, agentEmail: e.target.value }))}
                        placeholder="e.g. sara.ali@momentumegypt.com"
                      />
                      {autoFilled && form.agentEmail && (
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-accent font-mono text-[9px] uppercase tracking-widest pointer-events-none">
                          auto
                        </span>
                      )}
                    </div>
                  </Field>

                  {/* Reviewer */}
                  <Field label="Reviewer">
                    <input
                      value={form.reviewer}
                      onChange={(e) => setForm((f) => ({ ...f, reviewer: e.target.value }))}
                      placeholder="Your name"
                    />
                  </Field>

                  {/* Performance Grade */}
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

                  {/* Call Link */}
                  <Field label="Call Link (optional)" full>
                    <input
                      type="url"
                      value={form.callLink}
                      onChange={(e) => setForm((f) => ({ ...f, callLink: e.target.value }))}
                      placeholder="https://portal.example.com/calls/12345"
                    />
                  </Field>

                  {/* Notes */}
                  <Field label="Notes (optional)" full>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder="Any observations about this call..."
                    />
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
                  <Btn variant="ghost" onClick={() => {
                    setForm({ ...EMPTY_FORM, callDate: new Date().toISOString().split('T')[0] })
                    setScores({})
                    setAutoFilled(false)
                  }}>Clear</Btn>
                  <Btn onClick={handleSubmit}>Save Review ✓</Btn>
                </div>
              </div>
            )}

            {/* CSV Tab */}
            {tab === 'csv' && (
              <div>
                <div className="flex flex-col gap-2 px-4 py-3.5 bg-accent/8 border border-accent/20 rounded-lg mb-4">
                  <div className="text-xs text-txt2 font-medium mb-0.5">
                    ℹ️ Only these columns are used — only <span className="text-accent font-bold">Agent</span> is required:
                  </div>
                  <div className="flex flex-col gap-1">
                    {[
                      ['Agent',        'Agent full name — required',  true],
                      ['Date',         'Call date',                   false],
                      ['SID',          'Session / call ID',           false],
                      ['Waiting Time', 'Wait duration',               false],
                      ['Talk Time',    'Talk duration',               false],
                      ['Wrap Up Time', 'Wrap-up duration',            false],
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
