import { useState } from 'react'
import { Badge, EmptyState, Modal, Panel, PanelHeader, Tag, Btn } from './ui'
import { emitToast } from './ui'
import { calcWeightedScore } from '../store/useStore'

// ── Scoring modal for pending calls ──────────────────────────────────────────
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

function ReviewModal({ review, criteria, onSave, onClose }) {
  const [scores, setScores]     = useState({})
  const [reviewer, setReviewer] = useState('')

  const setScore = (id, val) => setScores((s) => ({ ...s, [id]: val }))

  const score     = calcWeightedScore(scores, criteria)
  const isPassing = score !== null && score >= 60
  const color     = score === null ? '#5a5a72' : isPassing ? '#00d4aa' : '#ff6b6b'

  const allScored = criteria.length === 0 || criteria.every((c) => scores[c.id])

  const handleSave = () => {
    if (!reviewer.trim()) { emitToast('Please enter your name as reviewer', 'error'); return }
    if (!allScored)       { emitToast('Please score all criteria before saving', 'error'); return }
    onSave({ scores, reviewer: reviewer.trim() })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Score This Call"
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={handleSave}>Save Review ✓</Btn>
        </>
      }
    >
      {/* Call summary */}
      <div className="grid grid-cols-2 gap-3 mb-5 px-4 py-3.5 bg-surface2 border border-border rounded-xl">
        <div>
          <div className="font-mono text-[10px] text-txt3 uppercase tracking-widest mb-0.5">Agent</div>
          <div className="font-semibold text-sm">{review.agentName}</div>
          {review.agentEmail && <div className="font-mono text-[10px] text-txt3">{review.agentEmail}</div>}
        </div>
        <div>
          <div className="font-mono text-[10px] text-txt3 uppercase tracking-widest mb-0.5">Call Date</div>
          <div className="text-sm">{review.callDate}</div>
        </div>
        {review.cidPhone && (
          <div>
            <div className="font-mono text-[10px] text-txt3 uppercase tracking-widest mb-0.5">CID / Phone</div>
            <div className="font-mono text-sm">{review.cidPhone}</div>
          </div>
        )}
        {review.bookingId && (
          <div>
            <div className="font-mono text-[10px] text-txt3 uppercase tracking-widest mb-0.5">Booking ID</div>
            <Tag>{review.bookingId}</Tag>
          </div>
        )}
        {review.requestType && (
          <div>
            <div className="font-mono text-[10px] text-txt3 uppercase tracking-widest mb-0.5">Request Type</div>
            <div className="text-sm">{review.requestType}</div>
          </div>
        )}
        {review.queue && (
          <div>
            <div className="font-mono text-[10px] text-txt3 uppercase tracking-widest mb-0.5">Queue</div>
            <div className="text-sm">{review.queue}</div>
          </div>
        )}
      </div>

      {/* Reviewer name */}
      <div className="mb-5">
        <label className="block font-mono text-[11px] uppercase tracking-widest text-txt3 mb-1.5">
          Reviewer Name
        </label>
        <input
          value={reviewer}
          onChange={(e) => setReviewer(e.target.value)}
          placeholder="Your name"
          className="w-full"
        />
      </div>

      {/* Criteria scoring */}
      {criteria.length === 0 ? (
        <div className="text-center py-6 text-txt3 text-sm">
          No criteria defined. Go to QA Criteria to add some.
        </div>
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

          {/* Live score bar */}
          <div className={`rounded-xl border p-4 ${score === null ? 'bg-surface3/50 border-border' : isPassing ? 'bg-pass/8 border-pass/20' : 'bg-fail/8 border-fail/20'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-txt3">Score Preview</span>
              <div className="flex items-center gap-2">
                {score !== null && (
                  <span className="font-syne font-extrabold text-xl" style={{ color }}>{score}%</span>
                )}
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
              {score !== null && (
                <div className="h-full rounded-full score-bar-fill" style={{ width: `${score}%`, background: color }} />
              )}
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

// ── Detail modal (read-only, for already-scored calls) ───────────────────────
function DetailModal({ review, criteria, onClose }) {
  if (!review) return null
  const isCsvImport = !!review.agentEmail
  const hasDurations = review.talkDuration || review.waitDuration || review.wrapDuration

  return (
    <Modal open title="Call Review Details" onClose={onClose}
      footer={<button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium bg-surface2 text-txt2 border border-border hover:text-txt cursor-pointer transition-all">Close</button>}
    >
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <div className="font-mono text-[11px] text-txt3 uppercase tracking-widest mb-1">Agent</div>
          <div className="font-semibold text-sm">{review.agentName}</div>
          {review.agentEmail && <div className="font-mono text-[11px] text-accent mt-0.5">{review.agentEmail}</div>}
        </div>
        <div>
          <div className="font-mono text-[11px] text-txt3 uppercase tracking-widest mb-1">Result</div>
          <Badge result={review.result} />
        </div>

        {isCsvImport ? (
          <>
            {review.cidPhone    && <div><div className="font-mono text-[11px] text-txt3 uppercase tracking-widest mb-1">CID / Phone</div><div className="font-mono text-sm">{review.cidPhone}</div></div>}
            {review.bookingId   && <div><div className="font-mono text-[11px] text-txt3 uppercase tracking-widest mb-1">Booking ID</div><Tag>{review.bookingId}</Tag></div>}
            {review.requestType && <div><div className="font-mono text-[11px] text-txt3 uppercase tracking-widest mb-1">Request Type</div><div className="text-sm">{review.requestType}</div></div>}
            {review.queue       && <div><div className="font-mono text-[11px] text-txt3 uppercase tracking-widest mb-1">Queue</div><div className="text-sm">{review.queue}</div></div>}
            {review.transferred && <div><div className="font-mono text-[11px] text-txt3 uppercase tracking-widest mb-1">Transferred</div><div className="text-sm">{review.transferred}</div></div>}
          </>
        ) : (
          <>
            {review.callLink && (
              <div className="col-span-2">
                <div className="font-mono text-[11px] text-txt3 uppercase tracking-widest mb-1">Call Link</div>
                <a href={review.callLink} target="_blank" rel="noreferrer" className="text-accent text-sm hover:underline break-all">{review.callLink}</a>
              </div>
            )}
          </>
        )}

        <div><div className="font-mono text-[11px] text-txt3 uppercase tracking-widest mb-1">Call Date</div><div className="text-sm">{review.callDate}</div></div>
        {review.reviewer && <div><div className="font-mono text-[11px] text-txt3 uppercase tracking-widest mb-1">Reviewer</div><div className="text-sm">{review.reviewer}</div></div>}

        {review.grade && (
          <div>
            <div className="font-mono text-[11px] text-txt3 uppercase tracking-widest mb-1">Performance Grade</div>
            <div className="flex items-center gap-2">
              <span className="font-syne font-bold text-xl" style={{ color: review.grade >= 8 ? '#00d4aa' : review.grade >= 5 ? '#ffa94d' : '#ff6b6b' }}>{review.grade}</span>
              <span className="text-txt3 text-sm font-mono">/ 10</span>
              <div className="flex-1 h-1.5 bg-surface3 rounded-full overflow-hidden ml-1">
                <div className="h-full rounded-full score-bar-fill" style={{ width: `${review.grade * 10}%`, background: review.grade >= 8 ? '#00d4aa' : review.grade >= 5 ? '#ffa94d' : '#ff6b6b' }} />
              </div>
            </div>
          </div>
        )}
        {review.notes && (
          <div className="col-span-2">
            <div className="font-mono text-[11px] text-txt3 uppercase tracking-widest mb-1">Notes</div>
            <div className="text-sm text-txt2">{review.notes}</div>
          </div>
        )}
      </div>

      {hasDurations && (
        <div className="flex gap-2 mb-5">
          {[['Talk', review.talkDuration], ['Wait', review.waitDuration], ['Wrap-up', review.wrapDuration]].filter(([, v]) => v).map(([l, v]) => (
            <div key={l} className="flex flex-col items-center px-3 py-2 bg-surface2 border border-border rounded-lg">
              <span className="font-mono font-bold text-sm">{v}</span>
              <span className="font-mono text-[9px] text-txt3 uppercase tracking-widest mt-0.5">{l}</span>
            </div>
          ))}
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

// ── Main CallLog component ───────────────────────────────────────────────────
export default function CallLog({ state, updateReview }) {
  const [search,            setSearch]            = useState('')
  const [filterResult,      setFilterResult]      = useState('')
  const [filterAgent,       setFilterAgent]       = useState('')
  const [filterQueue,       setFilterQueue]       = useState('')
  const [filterRequestType, setFilterRequestType] = useState('')
  const [detail,            setDetail]            = useState(null)
  const [reviewing,         setReviewing]         = useState(null) // review being scored

  const agents       = [...new Set(state.reviews.map((r) => r.agentName))].filter(Boolean).sort()
  const queues       = [...new Set(state.reviews.map((r) => r.queue))].filter(Boolean).sort()
  const requestTypes = [...new Set(state.reviews.map((r) => r.requestType))].filter(Boolean).sort()

  const filtered = state.reviews.filter((r) => {
    const s = search.toLowerCase()
    const matchSearch = !s
      || (r.agentName   || '').toLowerCase().includes(s)
      || (r.agentEmail  || '').toLowerCase().includes(s)
      || (r.cidPhone    || '').toLowerCase().includes(s)
      || (r.bookingId   || '').toLowerCase().includes(s)
      || (r.requestType || '').toLowerCase().includes(s)
      || (r.queue       || '').toLowerCase().includes(s)
      || (r.reviewer    || '').toLowerCase().includes(s)
    const matchResult      = !filterResult      || r.result      === filterResult
    const matchAgent       = !filterAgent       || r.agentName   === filterAgent
    const matchQueue       = !filterQueue       || r.queue       === filterQueue
    const matchRequestType = !filterRequestType || r.requestType === filterRequestType
    return matchSearch && matchResult && matchAgent && matchQueue && matchRequestType
  })

  const handleSaveReview = (reviewId, patches) => {
    updateReview(reviewId, patches)
    setReviewing(null)
    const score = calcWeightedScore(patches.scores, state.criteria)
    const passed = score === null ? true : score >= 60
    emitToast(`Review saved — ${passed ? '✓ PASS' : '✗ FAIL'}${score !== null ? ` (${score}%)` : ''}`)
  }

  return (
    <div className="p-8 animate-fadeIn">
      {/* Filters */}
      <Panel className="mb-4">
        <div className="px-5 py-3.5 flex gap-3 items-center flex-wrap">
          <input
            placeholder="🔍 Search agent, email, CID, booking ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[220px]"
            style={{ width: 'auto' }}
          />
          <select value={filterResult} onChange={(e) => setFilterResult(e.target.value)} style={{ width: 130 }}>
            <option value="">All Results</option>
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
            <option value="pending">Pending</option>
          </select>
          <select value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)} style={{ width: 170 }}>
            <option value="">All Agents</option>
            {agents.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          {queues.length > 0 && (
            <select value={filterQueue} onChange={(e) => setFilterQueue(e.target.value)} style={{ width: 120 }}>
              <option value="">All Queues</option>
              {queues.map((q) => <option key={q} value={q}>{q}</option>)}
            </select>
          )}
          {requestTypes.length > 0 && (
            <select value={filterRequestType} onChange={(e) => setFilterRequestType(e.target.value)} style={{ width: 180 }}>
              <option value="">All Request Types</option>
              {requestTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
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
                  {['Agent', 'CID / Phone', 'Booking ID', 'Request Type', 'Queue', 'Date', 'Talk', 'Result', ''].map((h) => (
                    <th key={h} className="text-left font-mono text-[10px] tracking-widest uppercase text-txt3 px-4 py-2.5 border-b border-border bg-surface2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => r.result !== 'pending' && setDetail(r)}
                    className={`border-b border-border/50 last:border-0 transition-colors ${r.result !== 'pending' ? 'hover:bg-white/[0.02] cursor-pointer' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-[13px]">{r.agentName}</div>
                      {r.agentEmail && <div className="font-mono text-[10px] text-txt3 mt-0.5">{r.agentEmail}</div>}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-txt2">
                      {r.cidPhone || <span className="text-txt3">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {r.bookingId ? <Tag>{r.bookingId}</Tag> : <span className="text-txt3 font-mono text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-txt2">
                      {r.requestType || <span className="text-txt3">—</span>}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-txt2">
                      {r.queue || <span className="text-txt3">—</span>}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-txt2 whitespace-nowrap">{r.callDate}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-txt2">
                      {r.talkDuration || <span className="text-txt3">—</span>}
                    </td>
                    <td className="px-4 py-3"><Badge result={r.result} /></td>
                    <td className="px-4 py-3">
                      {r.result === 'pending' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setReviewing(r) }}
                          className="px-3 py-1 rounded-lg text-[11px] font-medium font-dm cursor-pointer border transition-all bg-accent/10 text-accent border-accent/30 hover:bg-accent hover:text-white whitespace-nowrap"
                        >
                          + Review
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </Panel>

      {/* Score a pending call */}
      {reviewing && (
        <ReviewModal
          review={reviewing}
          criteria={state.criteria}
          onSave={(patches) => handleSaveReview(reviewing.id, patches)}
          onClose={() => setReviewing(null)}
        />
      )}

      {/* Read-only detail for already-scored calls */}
      {detail && (
        <DetailModal
          review={detail}
          criteria={state.criteria}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  )
}
