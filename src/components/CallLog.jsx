import { useState } from 'react'
import { Badge, EmptyState, Modal, Panel, PanelHeader, Tag } from './ui'

function DetailRow({ label, value, mono, accent, full }) {
  if (!value && value !== 0) return null
  return (
    <div className={full ? 'col-span-2' : ''}>
      <div className="font-mono text-[11px] text-txt3 uppercase tracking-widest mb-1">{label}</div>
      <div className={`text-sm ${mono ? 'font-mono' : ''} ${accent ? 'text-accent' : 'text-txt'}`}>{value}</div>
    </div>
  )
}

function DurationPill({ label, value }) {
  if (!value) return null
  return (
    <div className="flex flex-col items-center px-3 py-2 bg-surface2 border border-border rounded-lg">
      <span className="font-mono font-bold text-sm text-txt">{value}</span>
      <span className="font-mono text-[9px] text-txt3 uppercase tracking-widest mt-0.5">{label}</span>
    </div>
  )
}

function DetailModal({ review, criteria, onClose }) {
  if (!review) return null
  const isCsvImport = !!review.agentEmail
  const hasDurations = review.talkDuration || review.waitDuration || review.wrapDuration

  return (
    <Modal open title="Call Review Details" onClose={onClose}
      footer={<button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium bg-surface2 text-txt2 border border-border hover:text-txt cursor-pointer transition-all">Close</button>}
    >
      {/* Agent + Result */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <div className="font-mono text-[11px] text-txt3 uppercase tracking-widest mb-1">Agent</div>
          <div className="font-semibold text-sm">{review.agentName}</div>
          {review.agentEmail && (
            <div className="font-mono text-[11px] text-accent mt-0.5">{review.agentEmail}</div>
          )}
        </div>
        <div>
          <div className="font-mono text-[11px] text-txt3 uppercase tracking-widest mb-1">Result</div>
          <Badge result={review.result} />
        </div>

        {/* CSV fields */}
        {isCsvImport ? (
          <>
            <DetailRow label="CID / Phone"   value={review.cidPhone}     mono />
            <DetailRow label="Booking ID"    value={review.bookingId}    mono />
            <DetailRow label="Request Type"  value={review.requestType} />
            <DetailRow label="Queue"         value={review.queue} />
            {review.transferred && (
              <DetailRow label="Transferred" value={review.transferred} />
            )}
            <DetailRow label="Call Date"     value={review.callDate} />
            <DetailRow label="Call Answered" value={review.callAnswered} mono />
          </>
        ) : (
          <>
            <DetailRow label="Date"     value={review.callDate} />
            <DetailRow label="Reviewer" value={review.reviewer} />
            {review.callLink && (
              <div className="col-span-2">
                <div className="font-mono text-[11px] text-txt3 uppercase tracking-widest mb-1">Call Link</div>
                <a href={review.callLink} target="_blank" rel="noreferrer"
                  className="text-accent text-sm hover:underline break-all">{review.callLink}</a>
              </div>
            )}
          </>
        )}

        {/* Grade */}
        {review.grade && (
          <div>
            <div className="font-mono text-[11px] text-txt3 uppercase tracking-widest mb-1">Performance Grade</div>
            <div className="flex items-center gap-2">
              <span className="font-syne font-bold text-xl"
                style={{ color: review.grade >= 8 ? '#00d4aa' : review.grade >= 5 ? '#ffa94d' : '#ff6b6b' }}>
                {review.grade}
              </span>
              <span className="text-txt3 text-sm font-mono">/ 10</span>
              <div className="flex-1 h-1.5 bg-surface3 rounded-full overflow-hidden ml-1">
                <div className="h-full rounded-full score-bar-fill"
                  style={{ width: `${review.grade * 10}%`, background: review.grade >= 8 ? '#00d4aa' : review.grade >= 5 ? '#ffa94d' : '#ff6b6b' }} />
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

      {/* Duration pills */}
      {hasDurations && (
        <div className="flex gap-2 mb-5">
          <DurationPill label="Talk"    value={review.talkDuration} />
          <DurationPill label="Wait"    value={review.waitDuration} />
          <DurationPill label="Wrap-up" value={review.wrapDuration} />
        </div>
      )}

      {/* Criteria scores */}
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

export default function CallLog({ state }) {
  const [search, setSearch] = useState('')
  const [filterResult, setFilterResult] = useState('')
  const [filterAgent, setFilterAgent] = useState('')
  const [filterQueue, setFilterQueue] = useState('')
  const [filterRequestType, setFilterRequestType] = useState('')
  const [detail, setDetail] = useState(null)

  const agents      = [...new Set(state.reviews.map((r) => r.agentName))].filter(Boolean).sort()
  const queues      = [...new Set(state.reviews.map((r) => r.queue))].filter(Boolean).sort()
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
            <select value={filterQueue} onChange={(e) => setFilterQueue(e.target.value)} style={{ width: 130 }}>
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
                  {['Agent', 'CID / Phone', 'Booking ID', 'Request Type', 'Queue', 'Date', 'Talk', 'Result'].map((h) => (
                    <th key={h} className="text-left font-mono text-[10px] tracking-widest uppercase text-txt3 px-4 py-2.5 border-b border-border bg-surface2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} onClick={() => setDetail(r)}
                    className="border-b border-border/50 last:border-0 hover:bg-white/[0.02] cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[13px]">{r.agentName}</div>
                      {r.agentEmail && (
                        <div className="font-mono text-[10px] text-txt3 mt-0.5">{r.agentEmail}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-txt2">
                      {r.cidPhone || <span className="text-txt3">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {r.bookingId
                        ? <Tag>{r.bookingId}</Tag>
                        : <span className="text-txt3 font-mono text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-txt2">
                      {r.requestType || <span className="text-txt3">—</span>}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-txt2">
                      {r.queue || <span className="text-txt3">—</span>}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-txt2 whitespace-nowrap">
                      {r.callDate}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-txt2">
                      {r.talkDuration || <span className="text-txt3">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge result={r.result} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </Panel>

      <DetailModal review={detail} criteria={state.criteria} onClose={() => setDetail(null)} />
    </div>
  )
}
