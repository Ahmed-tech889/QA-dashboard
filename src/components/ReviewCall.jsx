import { useState, useRef } from 'react'
import { Btn, Field, Panel, PanelHeader } from './ui'
import { emitToast } from './ui'
import { calcWeightedScore } from '../store/useStore'

function PFButton({ label, selected, onClick, isPass, isNA }) {
  let activeStyle = ''
  if (selected) {
    if (isNA) activeStyle = 'bg-txt3/15 text-txt2 border-txt3'
    else if (isPass) activeStyle = 'bg-pass/15 text-pass border-pass'
    else activeStyle = 'bg-fail/15 text-fail border-fail'
  } else {
    activeStyle = 'bg-surface3 text-txt3 border-border hover:text-txt'
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-1 rounded-lg text-xs font-semibold font-mono cursor-pointer border transition-all ${activeStyle}`}
    >
      {label}
    </button>
  )
}

function ScoreSummary({ scores, criteria }) {
  const scored = criteria.filter((c) => scores[c.id])
  const active = scored.filter((c) => scores[c.id] !== 'na')
  const score = calcWeightedScore(scores, criteria)

  if (criteria.length === 0) return null

  const isPassing = score !== null && score >= 60
  const color = score === null ? '#5a5a72' : isPassing ? '#00d4aa' : '#ff6b6b'
  const bgColor = score === null
    ? 'bg-surface3/50 border-border'
    : isPassing ? 'bg-pass/8 border-pass/20' : 'bg-fail/8 border-fail/20'

  return (
    <div className={`rounded-xl border p-4 mb-5 ${bgColor}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="font-syne font-bold text-sm">Score Summary</div>
        <div className="flex items-center gap-2">
          {score !== null && (
            <span className="font-syne font-extrabold text-2xl leading-none" style={{ color }}>{score}%</span>
          )}
          {score !== null && (
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border"
              style={{ color, borderColor: color, background: isPassing ? 'rgba(0,212,170,0.1)' : 'rgba(255,107,107,0.1)' }}>
              {isPassing ? '✓ PASS' : '✗ FAIL'}
            </span>
          )}
          {score === null && (
            <span className="font-mono text-[11px] text-txt3">Score will appear as you score criteria</span>
          )}
        </div>
      </div>
      <div className="h-2 bg-surface3 rounded-full overflow-hidden mb-2 relative">
        {score !== null && (
          <div className="h-full rounded-full score-bar-fill" style={{ width: `${score}%`, background: color }} />
        )}
        <div className="absolute top-0 bottom-0 w-px bg-txt3/60" style={{ left: '60%' }} />
      </div>
      <div className="flex items-center justify-between text-[10px] font-mono text-txt3">
        <span>{scored.length}/{criteria.length} scored{active.length !== scored.length ? ` (${scored.length - active.length} N/A)` : ''}</span>
        <span>Pass threshold: 60%</span>
      </div>
    </div>
  )
}

// Derive a readable agent name from email or plain name string
function deriveAgentName(agentField) {
  if (!agentField) return ''
  const base = agentField.includes('@') ? agentField.split('@')[0] : agentField
  return base.replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim()
}

// Format seconds into mm:ss or h:mm:ss
function formatDuration(seconds) {
  const s = parseInt(seconds, 10)
  if (isNaN(s) || s < 0) return ''
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
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
    const unscored = state.criteria.filter((c) => !scores[c.id])
    if (state.criteria.length > 0 && unscored.length > 0) {
      emitToast('Please score all criteria before saving', 'error'); return
    }
    addReview({ ...form, scores })
    setForm({ agentName: '', agentId: '', callDate: new Date().toISOString().split('T')[0], callLink: '', reviewer: '', notes: '', grade: '' })
    setScores({})
    const score = calcWeightedScore(scores, state.criteria)
    const passed = score === null ? true : score >= 60
    emitToast(`Review saved — ${passed ? '✓ PASS' : '✗ FAIL'}${score !== null ? ` (${score}%)` : ''}`)
  }

  const handleCSV = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const lines = e.target.result.trim().split('\n')
      if (lines.length < 2) { emitToast('CSV file is empty', 'error'); return }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''))

      // Only agent is strictly required
      if (!headers.includes('agent')) {
        emitToast('Missing required column: agent', 'error'); return
      }

      const rows = []
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        // Handle quoted fields that may contain commas
        const vals = []
        let inQuotes = false
        let current = ''
        for (const ch of line) {
          if (ch === '"') { inQuotes = !inQuotes }
          else if (ch === ',' && !inQuotes) { vals.push(current.trim()); current = '' }
          else { current += ch }
        }
        vals.push(current.trim())

        const row = {}
        headers.forEach((h, idx) => (row[h] = (vals[idx] || '').replace(/^"|"$/g, '').trim()))

        if (!row.agent) continue

        // Extract date from callAnswered timestamp (e.g. "2026-03-16 09:01:57" → "2026-03-16")
        const callDate = row.callanswered
          ? row.callanswered.split(' ')[0]
          : new Date().toISOString().split('T')[0]

        rows.push({
          // Core identity
          agentName:    deriveAgentName(row.agent),
          agentEmail:   row.agent,
          agentId:      row.booking_id || '',

          // New fields from this format
          cidPhone:     row.cidphone     || '',
          srvcidPhone:  row.srvcidphone  || '',
          cidChat:      row.cidchat      || '',
          bookingId:    row.booking_id   || '',
          requestType:  row.request_type || '',
          queue:        row.queue        || '',
          talkDuration: row.talk_duration  ? formatDuration(row.talk_duration)  : '',
          waitDuration: row.wait_duration  ? formatDuration(row.wait_duration)  : '',
          wrapDuration: row.wrap_duration  ? formatDuration(row.wrap_duration)  : '',
          transferred:  row.transfered === '1' ? 'Yes' : row.transfered === '' ? '' : 'No',

          // Timestamps
          callDate,
          callAnswered:    row.callanswered    || '',
          callWrapupStart: row.callwrapupstart || '',
          callWrapupEnd:   row.callwrapupend   || '',

          // Standard fields
          callLink:  '',
          reviewer:  '',
          notes:     '',
          scores:    {},
          result:    'pending',
        })
      }

      if (rows.length === 0) {
        emitToast('No valid rows found in CSV', 'error'); return
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
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="font-syne font-bold text-sm">QA Criteria Scoring</div>
                    {state.criteria.length > 0 && (
                      <div className="flex items-center gap-3 font-mono text-[10px] text-txt3">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pass inline-block" /> Pass</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-fail inline-block" /> Fail</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-txt3 inline-block" /> N/A</span>
                      </div>
                    )}
                  </div>
                  {state.criteria.length === 0
                    ? <div className="text-center py-6 text-txt3 text-sm">No criteria defined yet. Go to QA Criteria to add some.</div>
                    : <>
                        <div className="flex flex-col gap-2.5 mb-4">
                          {state.criteria.map((c) => (
                            <div key={c.id} className="flex items-center justify-between px-4 py-3 bg-surface2 border border-border rounded-lg">
                              <div>
                                <div className="text-[13px] font-medium">{c.name}</div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {c.cat && <span className="font-mono text-[11px] text-txt3">{c.cat}</span>}
                                  <span className="font-mono text-[10px] px-1.5 py-px rounded bg-surface3 border border-border text-txt3">
                                    {c.weight ?? 100}%
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-1.5">
                                <PFButton label="✓ Pass" isPass selected={scores[c.id] === 'pass'} onClick={() => setScore(c.id, 'pass')} />
                                <PFButton label="✗ Fail" isPass={false} selected={scores[c.id] === 'fail'} onClick={() => setScore(c.id, 'fail')} />
                                <PFButton label="— N/A" isNA selected={scores[c.id] === 'na'} onClick={() => setScore(c.id, 'na')} />
                              </div>
                            </div>
                          ))}
                        </div>
                        <ScoreSummary scores={scores} criteria={state.criteria} />
                      </>
                  }
                </div>

                <div className="flex justify-end gap-2.5">
                  <Btn variant="ghost" onClick={() => {
                    setForm({ agentName: '', agentId: '', callDate: new Date().toISOString().split('T')[0], callLink: '', reviewer: '', notes: '', grade: '' })
                    setScores({})
                  }}>Clear</Btn>
                  <Btn onClick={handleSubmit}>Save Review ✓</Btn>
                </div>
              </div>
            )}

            {/* CSV Tab */}
            {tab === 'csv' && (
              <div>
                {/* Column reference */}
                <div className="flex flex-col gap-2 px-4 py-3.5 bg-accent/8 border border-accent/20 rounded-lg mb-4">
                  <div className="text-xs text-txt2 font-medium">ℹ️ Supported CSV columns — only <span className="text-accent font-bold">agent</span> is required:</div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                    {[
                      ['agent',          'Agent email — required'],
                      ['cidPhone',       'Customer phone / CID'],
                      ['booking_id',     'Booking or case ID'],
                      ['request_type',   'Type of request'],
                      ['queue',          'Queue / team'],
                      ['callAnswered',   'Call timestamp (auto-extracts date)'],
                      ['talk_duration',  'Talk time in seconds'],
                      ['wait_duration',  'Wait time in seconds'],
                      ['wrap_duration',  'Wrap-up time in seconds'],
                      ['transfered',     '1 = transferred, blank = no'],
                    ].map(([col, desc]) => (
                      <div key={col} className="flex items-start gap-2">
                        <span className={`font-mono text-[10px] font-medium shrink-0 ${col === 'agent' ? 'text-accent' : 'text-txt2'}`}>{col}</span>
                        <span className="text-txt3 text-[10px]">— {desc}</span>
                      </div>
                    ))}
                  </div>
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
