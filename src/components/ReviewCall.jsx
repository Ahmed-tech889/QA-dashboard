import { useState, useRef, useCallback } from 'react'
import { Btn, Field, Panel, PanelHeader } from './ui'
import { emitToast } from './ui'
import { calcWeightedScore } from '../store/useStore'

function PFButton({ label, selected, onClick, isPass, isNA }) {
  let style = ''
  if (selected) {
    if (isNA)        style = 'bg-txt3/15 text-txt2 border-txt3'
    else if (isPass) style = 'bg-pass/15 text-pass border-pass'
    else             style = 'bg-fail/15 text-fail border-fail'
  } else {
    style = 'bg-surface3 text-txt3 border-border hover:text-txt'
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-1 rounded-lg text-xs font-semibold font-mono cursor-pointer border transition-all ${style}`}
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

export default function ReviewCall({ state, addReview, addReviews, updateReview }) {
  const [tab, setTab]               = useState('manual')
  const [form, setForm]             = useState({ ...EMPTY_FORM })
  const [scores, setScores]         = useState({})
  const [csvPreview, setCsvPreview] = useState(null)
  const [autoFilled, setAutoFilled] = useState(false)
  const [matchedReviewId, setMatchedReviewId] = useState(null)
  const fileRef = useRef()

  const allSids = [...new Set(state.reviews.map((r) => r.sid).filter(Boolean))]
  const setScore = (id, val) => setScores((s) => ({ ...s, [id]: val }))

  const handleSidChange = useCallback((value) => {
    setForm((f) => ({ ...f, sid: value }))
    setAutoFilled(false)
    setMatchedReviewId(null)

    const trimmed = value.trim()
    if (!trimmed) return

    const match = state.reviews.find(
      (r) => r.sid && r.sid.trim().toLowerCase() === trimmed.toLowerCase()
    )
    if (!match) return

    const derivedEmail = match.agentEmail
      || (match.agentName
        ? match.agentName.trim().toLowerCase().replace(/\s+/g, '.') + '@momentumegypt.com'
        : '')

    setForm((f) => ({
      ...f,
      sid:        trimmed,
      agentName:  match.agentName || f.agentName,
      agentEmail: derivedEmail    || f.agentEmail,
      callDate:   match.callDate  || f.callDate,
    }))
    setAutoFilled(true)

    if (match.result === 'pending') {
      setMatchedReviewId(match.id)
    }
  }, [state.reviews])

  const handleSubmit = () => {
    if (!form.agentName || !form.reviewer) {
      emitToast('Agent name and reviewer are required', 'error'); return
    }
    if (state.criteria.length > 0 && state.criteria.some((c) => !scores[c.id])) {
      emitToast('Please score all criteria before saving', 'error'); return
    }

    // Use the same weighted score logic as the store — 60% threshold
    const score  = calcWeightedScore(scores, state.criteria)
    const result = score === null ? 'pass' : score >= 60 ? 'pass' : 'fail'
    const passed = result === 'pass'

    if (matchedReviewId !== null) {
      updateReview(matchedReviewId, {
        scores,
        reviewer:   form.reviewer,
        notes:      form.notes,
        grade:      form.grade,
        callLink:   form.callLink,
        agentName:  form.agentName,
        agentEmail: form.agentEmail,
        result,
      })
      emitToast(`Call updated — ${passed ? '✓ PASS' : '✗ FAIL'}${score !== null ? ` (${score}%)` : ''}`)
    } else {
      addReview({ ...form, scores, result })
      emitToast(`Review saved — ${passed ? '✓ PASS' : '✗ FAIL'}${score !== null ? ` (${score}%)` : ''}`)
    }

    setForm({ ...EMPTY_FORM, callDate: new Date().toISOString().split('T')[0] })
    setScores({})
    setAutoFilled(false)
    setMatchedReviewId(null)
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

  // Live score calculation for the summary bar
  const liveScore     = calcWeightedScore(scores, state.criteria)
  const liveIsPassing = liveScore !== null && liveScore >= 60
  const liveColor     = liveScore === null ? '#5a5a72' : liveIsPassing ? '#00d4aa' : '#ff6b6b'
  const liveScoredCount = state.criteria.filter((c) => scores[c.id]).length

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
                  <div className={`flex items-center gap-2 px-3.5 py-2.5 border rounded-lg text-xs mb-4 ${
                    matchedReviewId !== null
                      ? 'bg-pass/8 border-pass/20 text-pass'
                      : 'bg-accent/8 border-accent/20 text-accent'
                  }`}>
                    <span>{matchedReviewId !== null ? '✓' : '⚡'}</span>
                    <span>
                      {matchedReviewId !== null
                        ? "Pending call found — saving will update this call's status directly, no duplicate will be created."
                        : 'Fields auto-filled from call log. You can still edit them.'}
                    </span>
                    <button onClick={() => { setAutoFilled(false); setMatchedReviewId(null) }}
                      className="ml-auto text-txt3 hover:text-txt transition-colors font-mono">✕</button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-5">
                  {/* SID */}
                  <Field label="SID">
                    <div className="relative">
                      <input
                        value={form.sid}
                        onChange={(e) => handleSidChange(e.target.value)}
                        placeholder="Paste SID from call log"
                        list="sid-dl"
                      />
                      {matchedReviewId !== null && (
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-pass font-mono text-[9px] uppercase tracking-widest pointer-events-none">
                          matched
                        </span>
                      )}
                    </div>
                    <datalist id="sid-dl">
                      {allSids.map((s) => <option key={s} value={s} />)}
                    </datalist>
                  </Field>

                  {/* Call Date */}
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

                  {/* Agent Name */}
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

                  {/* Agent Email */}
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

                {/* Scoring — matches call log ReviewModal exactly */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-3">
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
                        <div className="flex flex-col gap-2.5 mb-5">
                          {state.criteria.map((c) => (
                            <div key={c.id} className="flex items-center justify-between px-4 py-3 bg-surface2 border border-border rounded-lg">
                              <div>
                                <div className="text-[13px] font-medium">{c.name}</div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {c.cat && <span className="font-mono text-[11px] text-txt3">{c.cat}</span>}
                                  <span className="font-mono text-[10px] px-1.5 py-px rounded bg-surface3 border border-border text-txt3">{c.weight ?? 100}%</span>
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

                        {/* Live score bar */}
                        <div className={`rounded-xl border p-4 ${liveScore === null ? 'bg-surface3/50 border-border' : liveIsPassing ? 'bg-pass/8 border-pass/20' : 'bg-fail/8 border-fail/20'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-[10px] uppercase tracking-widest text-txt3">Score Preview</span>
                            <div className="flex items-center gap-2">
                              {liveScore !== null && <span className="font-syne font-extrabold text-xl" style={{ color: liveColor }}>{liveScore}%</span>}
                              {liveScore !== null && (
                                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border"
                                  style={{ color: liveColor, borderColor: liveColor, background: liveIsPassing ? 'rgba(0,212,170,0.1)' : 'rgba(255,107,107,0.1)' }}>
                                  {liveIsPassing ? '✓ PASS' : '✗ FAIL'}
                                </span>
                              )}
                              {liveScore === null && <span className="font-mono text-[11px] text-txt3">Score criteria above</span>}
                            </div>
                          </div>
                          <div className="h-1.5 bg-surface3 rounded-full overflow-hidden relative">
                            {liveScore !== null && <div className="h-full rounded-full score-bar-fill" style={{ width: `${liveScore}%`, background: liveColor }} />}
                            <div className="absolute top-0 bottom-0 w-px bg-txt3/50" style={{ left: '60%' }} />
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="font-mono text-[9px] text-txt3">{liveScoredCount}/{state.criteria.length} scored</span>
                            <span className="font-mono text-[9px] text-txt3">Pass threshold: 60%</span>
                          </div>
                        </div>
                      </>
                  }
                </div>

                <div className="flex justify-end gap-2.5">
                  <Btn variant="ghost" onClick={() => {
                    setForm({ ...EMPTY_FORM, callDate: new Date().toISOString().split('T')[0] })
                    setScores({})
                    setAutoFilled(false)
                    setMatchedReviewId(null)
                  }}>Clear</Btn>
                  <Btn onClick={handleSubmit}>
                    {matchedReviewId !== null ? 'Update Call ✓' : 'Save Review ✓'}
                  </Btn>
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
