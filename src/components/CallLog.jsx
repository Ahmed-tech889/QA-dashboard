import { useState } from 'react'
import { Badge, EmptyState, Modal, Panel, PanelHeader, Tag } from './ui'

function DetailModal({ review, criteria, onClose }) {
  if (!review) return null
  return (
    <Modal open title="Call Review Details" onClose={onClose}
      footer={<button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium bg-surface2 text-txt2 border border-border hover:text-txt cursor-pointer transition-all">Close</button>}
    >
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <div className="font-mono text-[11px] text-txt3 uppercase tracking-widest mb-1">Agent</div>
          <div className="font-semibold">{review.agentName} {review.agentId && <Tag>{review.agentId}</Tag>}</div>
        </div>
        <div>
          <div className="font-mono text-[11px] text-txt3 uppercase tracking-widest mb-1">Result</div>
          <Badge result={review.result} />
        </div>
        <div>
          <div className="font-mono text-[11px] text-txt3 uppercase tracking-widest mb-1">Date</div>
          <div className="text-sm">{review.callDate}</div>
        </div>
        <div>
          <div className="font-mono text-[11px] text-txt3 uppercase tracking-widest mb-1">Reviewer</div>
          <div className="text-sm">{review.reviewer}</div>
        </div>
        <div className="col-span-2">
          <div className="font-mono text-[11px] text-txt3 uppercase tracking-widest mb-1">Call Link</div>
          <a href={review.callLink} target="_blank" rel="noreferrer" className="text-accent text-sm hover:underline">{review.callLink}</a>
        </div>
        {review.notes && (
          <div className="col-span-2">
            <div className="font-mono text-[11px] text-txt3 uppercase tracking-widest mb-1">Notes</div>
            <div className="text-sm text-txt2">{review.notes}</div>
          </div>
        )}
      </div>
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
  const [detail, setDetail] = useState(null)

  const agents = [...new Set(state.reviews.map((r) => r.agentName))].sort()

  const filtered = state.reviews.filter((r) => {
    const s = search.toLowerCase()
    const matchSearch = !s || r.agentName.toLowerCase().includes(s) || r.reviewer.toLowerCase().includes(s) || r.agentId.toLowerCase().includes(s)
    const matchResult = !filterResult || r.result === filterResult
    const matchAgent = !filterAgent || r.agentName === filterAgent
    return matchSearch && matchResult && matchAgent
  })

  return (
    <div className="p-8 animate-fadeIn">
      {/* Filters */}
      <Panel className="mb-4">
        <div className="px-5 py-3.5 flex gap-3 items-center flex-wrap">
          <input
            placeholder="🔍 Search by agent, reviewer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px]"
            style={{ width: 'auto' }}
          />
          <select value={filterResult} onChange={(e) => setFilterResult(e.target.value)} style={{ width: 140 }}>
            <option value="">All Results</option>
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
          </select>
          <select value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)} style={{ width: 160 }}>
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
          ? <EmptyState icon="📞" title="No calls found" sub="Try adjusting your filters or log a new review" />
          : <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Agent', 'Date', 'Reviewer', 'Result', 'Call Link'].map((h) => (
                    <th key={h} className="text-left font-mono text-[10px] tracking-widest uppercase text-txt3 px-4 py-2.5 border-b border-border bg-surface2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} onClick={() => setDetail(r)} className="border-b border-border/50 last:border-0 hover:bg-white/[0.02] cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-medium text-[13.5px]">
                      {r.agentName} {r.agentId && <Tag>{r.agentId}</Tag>}
                    </td>
                    <td className="px-4 py-3 text-txt2 text-[13.5px]">{r.callDate}</td>
                    <td className="px-4 py-3 text-txt2 text-[13.5px]">{r.reviewer}</td>
                    <td className="px-4 py-3"><Badge result={r.result} /></td>
                    <td className="px-4 py-3">
                      <a href={r.callLink} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-accent text-xs hover:underline">Open ↗</a>
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
