import { useState } from 'react'
import { Badge, EmptyState, Modal, Panel, PanelHeader, Tag, Btn } from './ui'
import { emitToast } from './ui'
import { calcWeightedScore } from '../store/useStore'

function deriveEmail(review) {
  if (review.agentEmail) return review.agentEmail
  if (!review.agentName) return ''
  return review.agentName.trim().toLowerCase().replace(/\s+/g, '.') + '@momentumegypt.com'
}

function PFButton({ label, selected, isPass, isNA, onClick }) {
  let style = ''
  if (selected) {
    if (isNA)        style = 'bg-txt3/15 text-txt2 border-txt3'
    else if (isPass) style = 'bg-pass/15 text-pass border-pass'
    else             style = 'bg-fail/15 text-fail border-fail'
  } else {
    style = 'bg-surface3 text-txt3 border-border hover:text-txt'
  }
  return (
    <button type="button" onClick={onClick}
      className={`px-3 py-1 rounded-lg text-xs font-semibold font-mono cursor-pointer border transition-all ${style}`}>
      {label}
    </button>
  )
}

function DurationPill({ label, value }) {
  if (!value) return null
  return (
    <div className="flex flex-col items-center px-3 py-2 bg-surface2 border border-border rounded-lg min-w-[60px]">
      <span className="font-mono font-bold text-sm text-txt">{value}</span>
      <span className="font-mono text-[9px] text-txt3 uppercase tracking-widest mt-0.5">{label}</span>
    </div>
  )
}

function InfoRow({ label, value, mono }) {
  if (!value) return null
  return (
    <div>
      <div className="font-mono text-[11px] text-txt3 uppercase tracking-widest mb-1">{label}</div>
      <div className={`text-sm ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  )
}

// ── Scoring modal for pending calls ──────────────────────────────────────────
function ReviewModal({ review, criteria, onSave, onClose }) {
  const [scores, setScores]   = useState({})
  const [reviewer, setReviewer] = useState('')
  const [notes, setNotes]     = useState('')
  const setScore = (id, val)  => setScores((s) => ({ ...s, [id]: val }))

  const score     = calcWeightedScore(scores, criteria)
  const isPassing = score !== null && score >= 60
  const color     = score === null ? '#5a5a72' : isPassing ? '#00d4aa' : '#ff6b6b'
  const allScored = criteria.length === 0 || criteria.every((c) => scores[c.id])

  const handleSave = () => {
    if (!reviewer.trim()) { emitToast('Please enter your name as reviewer', 'error'); return }
    if (!allScored)       { emitToast('Please score all criteria before saving', 'error'); return }
    onSave({ scores, reviewer: reviewer.trim(), notes: notes.trim() })
  }

  const email = deriveEmail(review)

  return (
    <Modal open onClose={onClose} title="Score This Call"
      footer={<><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={handleSave}>Save Review ✓</Btn></>}>

      {/* Call summary */}
      <div className="grid grid-cols-2 gap-3 mb-5 px-4 py-3.5 bg-surface2 border border-border rounded-xl">
        <div>
          <div className="font-mono text-[10px] text-txt3 uppercase tracking-widest mb-0.5">Agent</div>
          <div className="font-semibold text-sm">{review.agentName}</div>
          <div className="font-mono text-[10px] text-accent mt-0.5">{email}</div>
        </div>
        <div>
          <div className="font-mono text-[10px] text-txt3 uppercase tracking-widest mb-0.5">Call Date</div>
          <div className="text-sm">{review.callDate}{review.callTime ? ` · ${review.callTime}` : ''}</div>
        </div>
        {review.sid && <InfoRow label="SID" value={review.sid} mono />}
        {review.queue && <InfoRow label="Queue" value={review.queue} />}
      </div>

      {/* Duration pills */}
      {(review.waitDuration || review.talkDuration || review.wrapDuration) && (
        <div className="flex gap-2 flex-wrap mb-5">
          <DurationPill label="Wait"    value={review.waitDuration} />
          <DurationPill label="Talk"    value={review.talkDuration} />
          <DurationPill label="Wrap-up" value={review.wrapDuration} />
        </div>
      )}

      {/* Reviewer */}
      <div className="mb-4">
        <label className="block font-mono text-[11px] uppercase tracking-widest text-txt3 mb-1.5">Reviewer Name</label>
        <input value={reviewer} onChange={(e) => setReviewer(e.target.value)} placeholder="Your name" className="w-full" />
      </div>

      {/* Notes */}
      <div className="mb-5">
        <label className="block font-mono text-[11px] uppercase tracking-widest text-txt3 mb-1.5">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any observations about this call..."
          className="w-full"
        />
      </div>

      {/* Criteria */}
      {criteria.length === 0 ? (
        <div className="text-center py-6 text-txt3 text-sm">No criteria defined. Go to QA Criteria to add some.</div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <div className="font-syne font-bold text-sm">QA Criteria Scoring</div>
            <div className="flex items-center gap-3 font-mono text-[10px] text-txt3">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pass inline-block" /> Pass</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-fail inline-block" /> Fail</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-txt3 inline-block" /> N/A</span>
            </div>
          </div>
          <div className="flex flex-col gap-2.5 mb-5">
            {criteria.map((c) => (
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

          {/* Live score */}
          <div className={`rounded-xl border p-4 ${score === null ? 'bg-surface3/50 border-border' : isPassing ? 'bg-pass/8 border-pass/20' : 'bg-fail/8 border-fail/20'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-txt3">Score Preview</span>
              <div className="flex items-center gap-2">
                {score !== null && <span className="font-syne font-extrabold text-xl" style={{ color }}>{score}%</span>}
                {score !== null && (
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border"
                    style={{ color, borderColor: color, background: isPassing ? 'rgba(0,212,170,0.1)' : 'rgba(255,107,107,0.1)' }}>
                    {isPassing ? '✓ PASS' : '✗ FAIL'}
                  </span>
                )}
                {score === null && <span className="font-mono text-[11px] text-txt3">Score criteria above</span>}
              </div>
            </div>
            <div className="h-1.5 bg-surface3 rounded-full overflow-hidden relative">
              {score !== null && <div className="h-full rounded-full score-bar-fill" style={{ width: `${score}%`, background: color }} />}
              <div className="absolute top-0 bottom-0 w-px bg-txt3/50" style={{ left: '60%' }} />
            </div>
            <div className="flex justify-end mt-1">
              <span className="font-mono text-[9px] text-txt3">Pass threshold: 60%</span>
            </div>
          </div>
        </>
      )}
    </Modal>
  )
}

// ── Detail modal (read-only) ─────────────────────────────────────────────────
function DetailModal({ review, criteria, onClose }) {
  if (!review) return null
  const email = deriveEmail(review)
  const hasDurations = review.waitDuration || review.talkDuration || review.wrapDuration

  return (
    <Modal open title="Call Review Details" onClose={onClose}
      footer={<button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium bg-surface2 text-txt2 border border-border hover:text-txt cursor-pointer transition-all">Close</button>}>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <div className="font-mono text-[11px] text-txt3 uppercase tracking-widest mb-1">Agent</div>
          <div className="font-semibold text-sm">{review.agentName}</div>
          <div className="font-mono text-[11px] text-accent mt-0.5">{email}</div>
        </div>
        <div>
          <div className="font-mono text-[11px] text-txt3 uppercase tracking-widest mb-1">Result</div>
          <Badge result={review.result} />
        </div>
        <InfoRow label="Call Date" value={review.callDate} />
        <InfoRow label="SID"       value={review.sid} mono />
        <InfoRow label="Queue"     value={review.queue} />
        <InfoRow label="Reviewer"  value={review.reviewer} />
      </div>

      {/* Notes — shown after scoring */}
      {review.notes && (
        <div className="mb-5 px-4 py-3.5 bg-accent/6 border border-accent/15 rounded-xl">
          <div className="font-mono text-[11px] text-txt3 uppercase tracking-widest mb-1.5">Notes</div>
          <div className="text-sm text-txt2 leading-relaxed">{review.notes}</div>
        </div>
      )}

      {hasDurations && (
        <div className="flex gap-2 flex-wrap mb-5">
          <DurationPill label="Wait"    value={review.waitDuration} />
          <DurationPill label="Talk"    value={review.talkDuration} />
          <DurationPill label="Wrap-up" value={review.wrapDuration} />
        </div>
      )}

      {criteria.length > 0 && (
        <>
          <div className="font-syne font-bold text-sm mb-3">Criteria Scores</div>
          <div className="flex flex-col gap-2.5">
            {criteria.map((c) => {
              const s = review.scores?.[c.id]
              return (
                <div key={c.id} className="flex items-center justify-between px-4 py-3 bg-surface2 rounded-lg border border-border">
                  <div>
                    <div className="text-[13px] font-medium">{c.name}</div>
                    {c.cat && <div className="font-mono text-[11px] text-txt3">{c.cat}</div>}
                  </div>
                  {s ? <Badge result={s} /> : <span className="font-mono text-xs text-txt3">—</span>}
                </div>
              )
            })}
          </div>
        </>
      )}
    </Modal>
  )
}

// ── Confirm delete modal ─────────────────────────────────────────────────────
function ConfirmModal({ review, onConfirm, onClose }) {
  if (!review) return null
  return (
    <Modal open onClose={onClose} title="Remove Call"
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn variant="danger" onClick={onConfirm}>Remove</Btn>
        </>
      }>
      <p className="text-sm text-txt2 leading-relaxed">
        Are you sure you want to remove this call from the log?
        <br />
        <span className="text-txt font-medium">{review.agentName}</span>
        {review.sid && <span className="font-mono text-txt3 text-xs ml-2">{review.sid}</span>}
        <br />
        <span className="text-txt3 text-xs">This cannot be undone.</span>
      </p>
    </Modal>
  )
}

// ── Main CallLog ─────────────────────────────────────────────────────────────
export default function CallLog({ state, updateReview, deleteReview }) {
  const [search,        setSearch]        = useState('')
  const [filterResult,  setFilterResult]  = useState('')
  const [filterAgent,   setFilterAgent]   = useState('')
  const [detail,        setDetail]        = useState(null)
  const [reviewing,     setReviewing]     = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const agents = [...new Set(state.reviews.map((r) => r.agentName))].filter(Boolean).sort()

  const filtered = state.reviews.filter((r) => {
    const s = search.toLowerCase()
    const email = deriveEmail(r).toLowerCase()
    const matchSearch = !s
      || (r.agentName || '').toLowerCase().includes(s)
      || email.includes(s)
      || (r.sid       || '').toLowerCase().includes(s)
      || (r.reviewer  || '').toLowerCase().includes(s)
    const matchResult = !filterResult || r.result === filterResult
    const matchAgent  = !filterAgent  || r.agentName === filterAgent
    return matchSearch && matchResult && matchAgent
  })

  const handleSaveReview = (reviewId, patches) => {
    updateReview(reviewId, patches)
    setReviewing(null)
    const score = calcWeightedScore(patches.scores, state.criteria)
    const passed = score === null ? true : score >= 60
    emitToast(`Review saved — ${passed ? '✓ PASS' : '✗ FAIL'}${score !== null ? ` (${score}%)` : ''}`)
  }

  const handleDelete = () => {
    if (!confirmDelete) return
    deleteReview(confirmDelete.id)
    setConfirmDelete(null)
    emitToast('Call removed from log')
  }

  return (
    <div className="p-8 animate-fadeIn">
      {/* Filters */}
      <Panel className="mb-4">
        <div className="px-5 py-3.5 flex gap-3 items-center flex-wrap">
          <input
            placeholder="🔍 Search agent, email, SID..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[220px]" style={{ width: 'auto' }}
          />
          <select value={filterResult} onChange={(e) => setFilterResult(e.target.value)} style={{ width: 140 }}>
            <option value="">All Results</option>
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
            <option value="pending">Pending</option>
          </select>
          <select value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)} style={{ width: 180 }}>
            <option value="">All Agents</option>
            {agents.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="📁 Call Reviews"
          action={<span className="inline-block px-2 py-0.5 rounded bg-surface3 border border-border text-txt3 font-mono text-[11px]">{filtered.length} records</span>}
        />
        {filtered.length === 0
          ? <EmptyState icon="📞" title="No calls found" sub="Try adjusting your filters or import a CSV" />
          : <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Agent', 'Agent Email', 'Call Date', 'SID', 'Talk Time', 'Result', ''].map((h) => (
                    <th key={h} className="text-left font-mono text-[10px] tracking-widest uppercase text-txt3 px-4 py-2.5 border-b border-border bg-surface2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const email = deriveEmail(r)
                  return (
                    <tr key={r.id}
                      onClick={() => r.result !== 'pending' && setDetail(r)}
                      className={`border-b border-border/50 last:border-0 transition-colors group ${r.result !== 'pending' ? 'hover:bg-white/[0.02] cursor-pointer' : ''}`}>

                      <td className="px-4 py-3">
                        <div className="font-medium text-[13px]">{r.agentName}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-txt2">{email}</td>
                      <td className="px-4 py-3 text-[12px] text-txt2 whitespace-nowrap">{r.callDate}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-txt2 max-w-[140px] truncate" title={r.sid}>
                        {r.sid || <span className="text-txt3">—</span>}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-txt2">
                        {r.talkDuration || <span className="text-txt3">—</span>}
                      </td>
                      <td className="px-4 py-3"><Badge result={r.result} /></td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          {r.result === 'pending' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setReviewing(r) }}
                              className="px-3 py-1 rounded-lg text-[11px] font-medium font-dm cursor-pointer border transition-all bg-accent/10 text-accent border-accent/30 hover:bg-accent hover:text-white whitespace-nowrap">
                              + Review
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmDelete(r) }}
                            className="opacity-0 group-hover:opacity-100 px-2 py-1 rounded-lg text-[11px] font-medium font-dm cursor-pointer border transition-all bg-fail/8 text-fail border-fail/20 hover:bg-fail/20"
                            title="Remove call">
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
        }
      </Panel>

      {reviewing && (
        <ReviewModal
          review={reviewing}
          criteria={state.criteria}
          onSave={(patches) => handleSaveReview(reviewing.id, patches)}
          onClose={() => setReviewing(null)}
        />
      )}
      {detail && (
        <DetailModal review={detail} criteria={state.criteria} onClose={() => setDetail(null)} />
      )}
      {confirmDelete && (
        <ConfirmModal
          review={confirmDelete}
          onConfirm={handleDelete}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
