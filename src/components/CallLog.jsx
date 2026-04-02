import { useState, useMemo } from 'react'
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
    <div className="flex flex-col items-center px-3 py-2 rounded-lg min-w-[60px]"
      style={{ background: '#ebebee', border: '1px solid #d0d0d6' }}>
      <span className="font-semibold text-sm" style={{ color: '#1a1a2e' }}>{value}</span>
      <span className="text-[9px] uppercase tracking-widest mt-0.5" style={{ color: '#8888a0' }}>{label}</span>
    </div>
  )
}

function InfoRow({ label, value, mono }) {
  if (!value) return null
  return (
    <div>
      <div className="text-[11px] uppercase tracking-widest mb-1"
        style={{ color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>{label}</div>
      <div className={`text-sm ${mono ? 'font-mono' : ''}`} style={{ color: '#1a1a2e' }}>{value}</div>
    </div>
  )
}

function ReviewModal({ review, criteria, onSave, onClose }) {
  const [scores,   setScores]   = useState({})
  const [reviewer, setReviewer] = useState(review.reviewer || '')
  const [notes,    setNotes]    = useState('')
  const setScore = (id, val) => setScores((s) => ({ ...s, [id]: val }))

  const score     = calcWeightedScore(scores, criteria)
  const isPassing = score !== null && score >= 60
  const color     = score === null ? '#8888a0' : isPassing ? '#16a34a' : '#e11d48'
  const allScored = criteria.length === 0 || criteria.every((c) => scores[c.id])

  const handleSave = () => {
    if (!reviewer.trim()) { emitToast('Please enter your name as reviewer', 'error'); return }
    if (!allScored)       { emitToast('Please score all criteria before saving', 'error'); return }
    onSave({ scores, reviewer: reviewer.trim(), notes: notes.trim() })
  }

  const inputStyle = {
    background: '#f5f5f8', border: '1px solid #d0d0d6', borderRadius: 8,
    padding: '8px 12px', color: '#1a1a2e', fontSize: 13,
    fontFamily: "'Poppins',sans-serif", outline: 'none', width: '100%',
  }

  return (
    <Modal open onClose={onClose} title="Score This Call"
      footer={<><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={handleSave}>Save Review ✓</Btn></>}>

      <div className="grid grid-cols-2 gap-3 mb-5 px-4 py-3.5 rounded-xl"
        style={{ background: '#ebebee', border: '1px solid #d0d0d6' }}>
        <div>
          <div className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: '#8888a0' }}>Agent</div>
          <div className="font-semibold text-sm" style={{ color: '#1a1a2e' }}>{review.agentName}</div>
          <div className="text-[10px] mt-0.5" style={{ color: '#2563eb', fontFamily: "'Poppins',sans-serif" }}>{deriveEmail(review)}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: '#8888a0' }}>Call Date</div>
          <div className="text-sm" style={{ color: '#1a1a2e' }}>{review.callDate}</div>
        </div>
        {review.sid   && <InfoRow label="SID"   value={review.sid}   mono />}
        {review.queue && <InfoRow label="Queue" value={review.queue} />}
      </div>

      {(review.waitDuration || review.talkDuration || review.wrapDuration) && (
        <div className="flex gap-2 flex-wrap mb-5">
          <DurationPill label="Wait"    value={review.waitDuration} />
          <DurationPill label="Talk"    value={review.talkDuration} />
          <DurationPill label="Wrap-up" value={review.wrapDuration} />
        </div>
      )}

      <div className="mb-4">
        <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5"
          style={{ color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>Reviewer Name</label>
        <input value={reviewer} onChange={(e) => setReviewer(e.target.value)}
          placeholder="Your name" style={inputStyle} />
      </div>

      <div className="mb-5">
        <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5"
          style={{ color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>Notes (optional)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="Any observations about this call..."
          style={{ ...inputStyle, minHeight: 70, resize: 'vertical', lineHeight: 1.6 }} />
      </div>

      {criteria.length === 0 ? (
        <div className="text-center py-6 text-sm" style={{ color: '#8888a0' }}>
          No criteria defined. Go to QA Criteria to add some.
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold text-sm" style={{ color: '#1a1a2e', fontFamily: "'Poppins',sans-serif" }}>
              QA Criteria Scoring
            </div>
            <div className="flex items-center gap-3 text-[10px]" style={{ color: '#8888a0' }}>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pass inline-block" /> Pass</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-fail inline-block" /> Fail</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: '#8888a0' }} /> N/A</span>
            </div>
          </div>
          <div className="flex flex-col gap-2.5 mb-5">
            {criteria.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-4 py-3 rounded-lg"
                style={{ background: '#ebebee', border: '1px solid #d0d0d6' }}>
                <div>
                  <div className="text-[13px] font-medium" style={{ color: '#1a1a2e' }}>{c.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {c.cat && <span className="text-[11px]" style={{ color: '#8888a0' }}>{c.cat}</span>}
                    <span className="text-[10px] px-1.5 py-px rounded"
                      style={{ background: '#dcdce0', border: '1px solid #c8c8ce', color: '#8888a0' }}>
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

          <div className="rounded-xl border p-4"
            style={{
              background: score === null ? '#ebebee' : isPassing ? '#e6f9ee' : '#fde8ec',
              border: `1px solid ${score === null ? '#d0d0d6' : isPassing ? '#a8ecc0' : '#f8c0cc'}`,
            }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>Score Preview</span>
              <div className="flex items-center gap-2">
                {score !== null && (
                  <span className="font-bold text-xl" style={{ color, fontFamily: "'Poppins',sans-serif" }}>{score}%</span>
                )}
                {score !== null && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                    style={{ color, borderColor: color, background: isPassing ? 'rgba(22,163,74,0.1)' : 'rgba(225,29,72,0.1)', fontFamily: "'Poppins',sans-serif" }}>
                    {isPassing ? '✓ PASS' : '✗ FAIL'}
                  </span>
                )}
                {score === null && (
                  <span className="text-[11px]" style={{ color: '#8888a0' }}>Score criteria above</span>
                )}
              </div>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden relative" style={{ background: '#dcdce0' }}>
              {score !== null && (
                <div className="h-full rounded-full score-bar-fill" style={{ width: `${score}%`, background: color }} />
              )}
              <div className="absolute top-0 bottom-0 w-px" style={{ left: '60%', background: '#a0a0b0' }} />
            </div>
            <div className="flex justify-end mt-1">
              <span className="text-[9px]" style={{ color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>
                Pass threshold: 60%
              </span>
            </div>
          </div>
        </>
      )}
    </Modal>
  )
}

function DetailModal({ review, criteria, onClose, onFlag }) {
  if (!review) return null
  const hasDurations = review.waitDuration || review.talkDuration || review.wrapDuration

  return (
    <Modal open title="Call Review Details" onClose={onClose}
      footer={
        <div className="flex items-center justify-between w-full">
          <button onClick={() => onFlag(review)}
            className="text-[12px] font-semibold px-3 py-2 rounded-lg cursor-pointer hover:opacity-80"
            style={{ background: '#fef3d8', border: '1px solid #f8dca0', color: '#d97706', fontFamily: "'Poppins',sans-serif" }}>
            🚩 Flag for Re-review
          </button>
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer hover:opacity-80"
            style={{ background: '#dcdce0', border: '1px solid #c8c8ce', color: '#505060', fontFamily: "'Poppins',sans-serif" }}>
            Close
          </button>
        </div>
      }>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <div className="text-[11px] uppercase tracking-widest mb-1" style={{ color: '#8888a0' }}>Agent</div>
          <div className="font-semibold text-sm" style={{ color: '#1a1a2e' }}>{review.agentName}</div>
          <div className="text-[11px] mt-0.5" style={{ color: '#2563eb', fontFamily: "'Poppins',sans-serif" }}>{deriveEmail(review)}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-widest mb-1" style={{ color: '#8888a0' }}>Result</div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge result={review.result} />
            {review.disputed && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: '#fef3d8', color: '#d97706', border: '1px solid #f8dca0' }}>
                Disputed
              </span>
            )}
          </div>
        </div>
        <InfoRow label="Call Date" value={review.callDate} />
        <InfoRow label="SID"       value={review.sid}      mono />
        <InfoRow label="Queue"     value={review.queue} />
        <InfoRow label="Reviewer"  value={review.reviewer} />
      </div>

      {review.notes && (
        <div className="mb-5 px-4 py-3.5 rounded-xl"
          style={{ background: '#e8f0ff', border: '1px solid #c8d4f0' }}>
          <div className="text-[11px] uppercase tracking-widest mb-1.5" style={{ color: '#8888a0' }}>Notes</div>
          <div className="text-sm leading-relaxed" style={{ color: '#505060' }}>{review.notes}</div>
        </div>
      )}

      {review.disputeReason && (
        <div className="mb-5 px-4 py-3.5 rounded-xl"
          style={{ background: '#fef3d8', border: '1px solid #f8dca0' }}>
          <div className="text-[11px] uppercase tracking-widest mb-1.5" style={{ color: '#d97706' }}>Dispute Reason</div>
          <div className="text-sm leading-relaxed" style={{ color: '#505060' }}>{review.disputeReason}</div>
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
          <div className="font-bold text-sm mb-3"
            style={{ color: '#1a1a2e', fontFamily: "'Poppins',sans-serif" }}>Criteria Scores</div>
          <div className="flex flex-col gap-2.5">
            {criteria.map((c) => {
              const s = review.scores?.[c.id]
              return (
                <div key={c.id} className="flex items-center justify-between px-4 py-3 rounded-lg"
                  style={{ background: '#ebebee', border: '1px solid #d0d0d6' }}>
                  <div>
                    <div className="text-[13px] font-medium" style={{ color: '#1a1a2e' }}>{c.name}</div>
                    {c.cat && <div className="text-[11px]" style={{ color: '#8888a0' }}>{c.cat}</div>}
                  </div>
                  {s ? <Badge result={s} /> : <span className="text-xs" style={{ color: '#8888a0' }}>—</span>}
                </div>
              )
            })}
          </div>
        </>
      )}
    </Modal>
  )
}

function DisputeModal({ review, onConfirm, onClose }) {
  const [reason, setReason] = useState('')
  if (!review) return null
  return (
    <Modal open onClose={onClose} title="Flag for Re-review"
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={() => {
            if (!reason.trim()) { emitToast('Please enter a reason', 'error'); return }
            onConfirm(reason)
          }}>Flag Call</Btn>
        </>
      }>
      <p className="text-[13px] mb-4 leading-relaxed"
        style={{ color: '#505060', fontFamily: "'Poppins',sans-serif" }}>
        This will mark the call as disputed and request a second review.<br />
        <span className="font-semibold" style={{ color: '#1a1a2e' }}>{review.agentName}</span>
        {review.sid && (
          <span className="font-mono text-[12px] ml-2" style={{ color: '#8888a0' }}>{review.sid}</span>
        )}
      </p>
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-widest mb-2"
          style={{ color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>Reason for dispute</label>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)}
          placeholder="Why should this call be reviewed again?" autoFocus
          style={{
            background: '#f5f5f8', border: '1px solid #d0d0d6', borderRadius: 8,
            padding: '10px 14px', color: '#1a1a2e', fontSize: 13,
            fontFamily: "'Poppins',sans-serif", outline: 'none', width: '100%',
            minHeight: 90, resize: 'vertical', lineHeight: 1.6,
          }} />
      </div>
    </Modal>
  )
}

function BulkAssignModal({ count, onConfirm, onClose }) {
  const [reviewer, setReviewer] = useState('')
  return (
    <Modal open onClose={onClose} title={`Assign Reviewer — ${count} call${count > 1 ? 's' : ''}`}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={() => {
            if (!reviewer.trim()) { emitToast('Enter a reviewer name', 'error'); return }
            onConfirm(reviewer.trim())
          }}>Assign</Btn>
        </>
      }>
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-widest mb-2"
          style={{ color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>Reviewer Name</label>
        <input value={reviewer} onChange={(e) => setReviewer(e.target.value)}
          placeholder="Enter reviewer name" autoFocus
          style={{
            background: '#f5f5f8', border: '1px solid #d0d0d6', borderRadius: 8,
            padding: '10px 14px', color: '#1a1a2e', fontSize: 13,
            fontFamily: "'Poppins',sans-serif", outline: 'none', width: '100%',
          }} />
      </div>
    </Modal>
  )
}

function ConfirmModal({ review, onConfirm, onClose }) {
  if (!review) return null
  return (
    <Modal open onClose={onClose} title="Remove Call"
      footer={<><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn variant="danger" onClick={onConfirm}>Remove</Btn></>}>
      <p className="text-sm leading-relaxed" style={{ color: '#505060', fontFamily: "'Poppins',sans-serif" }}>
        Are you sure you want to remove this call?<br />
        <span className="font-semibold" style={{ color: '#1a1a2e' }}>{review.agentName}</span>
        {review.sid && <span className="font-mono text-[12px] ml-2" style={{ color: '#8888a0' }}>{review.sid}</span>}<br />
        <span className="text-[12px]" style={{ color: '#e11d48' }}>This cannot be undone.</span>
      </p>
    </Modal>
  )
}

function exportCSV(reviews) {
  const headers = ['Agent Name', 'Agent Email', 'Call Date', 'SID', 'Talk Time', 'Wait Time', 'Wrap Time', 'Reviewer', 'Result', 'Score', 'Notes']
  const rows = reviews.map((r) => [
    r.agentName || '', deriveEmail(r) || '', r.callDate || '', r.sid || '',
    r.talkDuration || '', r.waitDuration || '', r.wrapDuration || '',
    r.reviewer || '', r.result || '',
    r.score != null ? r.score + '%' : '',
    (r.notes || '').replace(/,/g, ';'),
  ])
  const csv  = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `QIS_calls_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function CallLog({ state, updateReview, deleteReview, bulkDeleteReviews, bulkAssignReviewer, flagForDispute }) {
  const [search,         setSearch]         = useState('')
  const [filterResult,   setFilterResult]   = useState('')
  const [filterAgent,    setFilterAgent]    = useState('')
  const [detail,         setDetail]         = useState(null)
  const [reviewing,      setReviewing]      = useState(null)
  const [confirmDelete,  setConfirmDelete]  = useState(null)
  const [flagging,       setFlagging]       = useState(null)
  const [selected,       setSelected]       = useState(new Set())
  const [bulkAssign,     setBulkAssign]     = useState(false)
  const [confirmBulkDel, setConfirmBulkDel] = useState(false)

  const agents = useMemo(() =>
    [...new Set(state.reviews.map((r) => r.agentName))].filter(Boolean).sort(),
    [state.reviews]
  )

  const filtered = useMemo(() => state.reviews.filter((r) => {
    const s     = search.toLowerCase()
    const email = deriveEmail(r).toLowerCase()
    const matchSearch = !s
      || (r.agentName || '').toLowerCase().includes(s)
      || email.includes(s)
      || (r.sid       || '').toLowerCase().includes(s)
      || (r.reviewer  || '').toLowerCase().includes(s)
    return matchSearch
      && (!filterResult || r.result === filterResult)
      && (!filterAgent  || r.agentName === filterAgent)
  }), [state.reviews, search, filterResult, filterAgent])

  const allSelected  = filtered.length > 0 && filtered.every((r) => selected.has(r.id))
  const someSelected = selected.size > 0

  const toggleSelect  = (id) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll     = ()   => setSelected(allSelected ? new Set() : new Set(filtered.map((r) => r.id)))
  const clearSelected = ()   => setSelected(new Set())

  const handleSaveReview = (reviewId, patches) => {
    updateReview(reviewId, patches)
    setReviewing(null)
    const score  = calcWeightedScore(patches.scores, state.criteria)
    const passed = score === null ? true : score >= 60
    emitToast(`Review saved — ${passed ? '✓ PASS' : '✗ FAIL'}${score !== null ? ` (${score}%)` : ''}`)
  }

  const handleDelete = () => {
    if (!confirmDelete) return
    deleteReview(confirmDelete.id)
    setConfirmDelete(null)
    emitToast('Call removed from log')
  }

  const handleBulkDelete = () => {
    bulkDeleteReviews([...selected])
    clearSelected()
    setConfirmBulkDel(false)
    emitToast(`${selected.size} call${selected.size > 1 ? 's' : ''} removed`)
  }

  const handleBulkAssign = (reviewer) => {
    bulkAssignReviewer([...selected], reviewer)
    clearSelected()
    setBulkAssign(false)
    emitToast(`Assigned ${selected.size} call${selected.size > 1 ? 's' : ''} to ${reviewer}`)
  }

  const handleFlag = (review) => {
    setDetail(null)
    setTimeout(() => setFlagging(review), 100)
  }

  const handleConfirmFlag = (reason) => {
    flagForDispute(flagging.id, reason)
    setFlagging(null)
    emitToast('Call flagged for re-review')
  }

  const handleExportSelected = () => {
    const toExport = someSelected ? filtered.filter((r) => selected.has(r.id)) : filtered
    exportCSV(toExport)
    emitToast(`Exported ${toExport.length} records ✓`)
  }

  const selectStyle = {
    background: '#f5f5f8', border: '1px solid #d0d0d6', borderRadius: 8,
    padding: '6px 10px', color: '#1a1a2e', fontSize: 12,
    fontFamily: "'Poppins',sans-serif", outline: 'none', height: 32,
  }

  const actionBtnStyle = (color = '#505060', bg = '#dcdce0', border = '#c8c8ce') => ({
    padding: '5px 12px', height: 30, borderRadius: 7,
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
    fontFamily: "'Poppins',sans-serif",
    background: bg, border: `1px solid ${border}`, color,
  })

  return (
    <div className="p-7 animate-fadeIn">

      {/* Filters */}
      <Panel className="mb-4">
        <div className="px-5 py-3.5 flex gap-3 items-center flex-wrap">
          <input
            placeholder="Search agent, email, SID..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px]"
            style={{ width: 'auto', height: 32, padding: '0 12px', fontSize: 13 }}
          />
          <select value={filterResult} onChange={(e) => setFilterResult(e.target.value)}
            style={{ ...selectStyle, width: 140 }}>
            <option value="">All Results</option>
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
            <option value="pending">Pending</option>
          </select>
          <select value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)}
            style={{ ...selectStyle, width: 180 }}>
            <option value="">All Agents</option>
            {agents.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <button onClick={handleExportSelected} className="hover:opacity-80 transition-all shrink-0"
            style={actionBtnStyle()}>
            ⬇ {someSelected ? `Export (${selected.size})` : 'Export CSV'}
          </button>
        </div>
      </Panel>

      {/* Bulk action bar */}
      {someSelected && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4"
          style={{ background: '#e8f0ff', border: '1px solid #c8d4f0' }}>
          <span className="text-[13px] font-semibold"
            style={{ color: '#2563eb', fontFamily: "'Poppins',sans-serif" }}>
            {selected.size} selected
          </span>
          <div className="w-px h-4" style={{ background: '#c8d4f0' }} />
          <button onClick={() => setBulkAssign(true)} className="hover:opacity-80"
            style={actionBtnStyle('#2563eb', '#ffffff', '#c8d4f0')}>
            Assign Reviewer
          </button>
          <button onClick={() => setConfirmBulkDel(true)} className="hover:opacity-80"
            style={actionBtnStyle('#e11d48', '#fde8ec', '#f8c0cc')}>
            Delete Selected
          </button>
          <button onClick={clearSelected} className="ml-auto hover:opacity-80"
            style={actionBtnStyle()}>
            Clear
          </button>
        </div>
      )}

      <Panel>
        <PanelHeader
          title="Call Reviews"
          action={
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded"
              style={{ background: '#ebebee', border: '1px solid #d0d0d6', color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>
              {filtered.length} records
            </span>
          }
        />
        {filtered.length === 0
          ? <EmptyState icon="📞" title="No calls found" sub="Try adjusting your filters or import a CSV" />
          : <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="px-4 py-3" style={{ borderBottom: '1px solid #dcdce0', background: '#efeff2', width: 40 }}>
                    <input type="checkbox" checked={allSelected} onChange={toggleAll}
                      style={{ cursor: 'pointer', width: 14, height: 14, accentColor: '#2563eb' }} />
                  </th>
                  {['Agent', 'Call Date', 'SID', 'Reviewer', 'Result', ''].map((h) => (
                    <th key={h} className="text-left text-[11px] font-semibold tracking-wide uppercase px-4 py-3"
                      style={{ color: '#8888a0', borderBottom: '1px solid #dcdce0', background: '#efeff2', fontFamily: "'Poppins',sans-serif" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const isSelected = selected.has(r.id)
                  return (
                    <tr key={r.id}
                      className="transition-colors group"
                      style={{
                        borderBottom: '1px solid #e4e4e8',
                        background:   isSelected ? '#f0f5ff' : 'transparent',
                        cursor:       r.result !== 'pending' ? 'pointer' : 'default',
                      }}
                      onClick={() => r.result !== 'pending' && setDetail(r)}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(r.id)}
                          style={{ cursor: 'pointer', width: 14, height: 14, accentColor: '#2563eb' }} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[13px]" style={{ color: '#1a1a2e' }}>{r.agentName}</span>
                          {r.disputed && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: '#fef3d8', color: '#d97706', border: '1px solid #f8dca0' }}>
                              Disputed
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[12px] whitespace-nowrap" style={{ color: '#505060' }}>
                        {r.callDate}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] max-w-[120px] truncate"
                        title={r.sid} style={{ color: '#505060' }}>
                        {r.sid || <span style={{ color: '#a0a0b0' }}>—</span>}
                      </td>

                      {/* ── Reviewer column — shows assigned name or "Unassigned" ── */}
                      <td className="px-4 py-3">
                        {r.reviewer ? (
                          <span className="text-[12px] font-medium" style={{ color: '#1a1a2e', fontFamily: "'Poppins',sans-serif" }}>
                            {r.reviewer}
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                            style={{ background: '#ebebee', color: '#a0a0b0', border: '1px solid #d0d0d6', fontFamily: "'Poppins',sans-serif" }}>
                            Unassigned
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3"><Badge result={r.result} /></td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2 justify-end">
                          {r.result === 'pending' && (
                            <button onClick={() => setReviewing(r)}
                              className="px-3 py-1 rounded-lg text-[11px] font-semibold cursor-pointer hover:opacity-80"
                              style={{ background: '#e8f0ff', color: '#2563eb', border: '1px solid #c8d4f0', fontFamily: "'Poppins',sans-serif" }}>
                              + Review
                            </button>
                          )}
                          <button onClick={() => setConfirmDelete(r)}
                            className="opacity-0 group-hover:opacity-100 px-2 py-1 rounded-lg text-[11px] font-semibold cursor-pointer hover:opacity-80 transition-all"
                            style={{ background: '#fde8ec', color: '#e11d48', border: '1px solid #f8c0cc', fontFamily: "'Poppins',sans-serif" }}>
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

      {reviewing      && <ReviewModal review={reviewing} criteria={state.criteria} onSave={(p) => handleSaveReview(reviewing.id, p)} onClose={() => setReviewing(null)} />}
      {detail         && <DetailModal review={detail} criteria={state.criteria} onClose={() => setDetail(null)} onFlag={handleFlag} />}
      {flagging       && <DisputeModal review={flagging} onConfirm={handleConfirmFlag} onClose={() => setFlagging(null)} />}
      {confirmDelete  && <ConfirmModal review={confirmDelete} onConfirm={handleDelete} onClose={() => setConfirmDelete(null)} />}
      {bulkAssign     && <BulkAssignModal count={selected.size} onConfirm={handleBulkAssign} onClose={() => setBulkAssign(false)} />}
      {confirmBulkDel && (
        <Modal open onClose={() => setConfirmBulkDel(false)} title="Delete Selected Calls"
          footer={<><Btn variant="ghost" onClick={() => setConfirmBulkDel(false)}>Cancel</Btn><Btn variant="danger" onClick={handleBulkDelete}>Delete {selected.size} Calls</Btn></>}>
          <p className="text-sm leading-relaxed" style={{ color: '#505060', fontFamily: "'Poppins',sans-serif" }}>
            Are you sure you want to permanently delete{' '}
            <strong style={{ color: '#1a1a2e' }}>{selected.size} call{selected.size > 1 ? 's' : ''}</strong>?<br />
            <span className="text-[12px]" style={{ color: '#e11d48' }}>This cannot be undone.</span>
          </p>
        </Modal>
      )}
    </div>
  )
}
