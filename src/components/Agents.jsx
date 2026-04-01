import { useState, useMemo } from 'react'
import { EmptyState, Modal } from './ui'

const GRADIENTS = [
  'from-[#6366f1] to-[#8b5cf6]',
  'from-[#0ea5e9] to-[#2563eb]',
  'from-[#f59e0b] to-[#ef4444]',
  'from-[#10b981] to-[#0ea5e9]',
  'from-[#ec4899] to-[#8b5cf6]',
  'from-[#f97316] to-[#eab308]',
]

const IMPROVEMENT_TIPS = [
  { keywords: ['introduce', 'brand'],       tip: 'The agent should open the call with a proper greeting, clearly introduce the brand and their name, and proactively offer assistance to set a professional tone.' },
  { keywords: ['security', 'protocol'],     tip: 'The agent should ensure all required security verification steps are completed before disclosing any booking information to maintain compliance and data protection.' },
  { keywords: ['empathy'],                  tip: "The agent should acknowledge the customer's situation and express empathy using appropriate phrases to build rapport and show understanding." },
  { keywords: ['ownership'],                tip: 'The agent should take full ownership of the issue by reassuring support, asking relevant questions, and confirming understanding through effective recaps.' },
  { keywords: ['additional help'],          tip: 'The agent should offer further assistance and close the call using proper branding to ensure a complete and professional customer experience.' },
  { keywords: ['silence'],                  tip: 'The agent should avoid prolonged silence by setting expectations beforehand or providing periodic updates during the call.' },
  { keywords: ['refresh', 'call'],          tip: 'The agent should return to the call within the expected timeframe to update the customer and maintain engagement.' },
  { keywords: ['negative language'],        tip: 'The agent should maintain a professional tone by avoiding negative language, not interrupting the customer, and refraining from blaming colleagues or systems.' },
  { keywords: ['mila correctly'],           tip: "The agent should use Mila effectively by asking clear, relevant questions aligned with the customer's request to ensure accurate support." },
  { keywords: ['transfer', 'mila'],         tip: "The agent should follow Mila's guidance and transfer the call to Level 2 promptly when required." },
  { keywords: ['flag', 'slack'],            tip: "The agent should proactively escalate cases via Slack when necessary, even without Mila's instruction, to ensure proper follow-up." },
  { keywords: ['transparent', 'compliant'], tip: 'The agent should provide accurate, complete, and compliant information while setting realistic expectations throughout the call.' },
  { keywords: ['summarize', 'timeframe'],   tip: 'The agent should clearly summarize actions taken and next steps, including accurate timelines based on available guidance.' },
  { keywords: ['fully resolved'],           tip: "The agent should aim for first-contact resolution by fully addressing the customer's request and minimizing the need for repeat contact." },
]

const DEFAULT_TIP = 'Review recorded calls with your team lead to identify specific areas for improvement.'

function getTip(name) {
  const lower = name.trim().toLowerCase()
  const found = IMPROVEMENT_TIPS.find((entry) =>
    entry.keywords.every((kw) => lower.includes(kw))
  )
  return found ? found.tip : DEFAULT_TIP
}

function computeQualityScore(reviews) {
  let attrPass = 0, attrFail = 0
  reviews.forEach((r) => {
    Object.values(r.scores || {}).forEach((val) => {
      if (val === 'pass') attrPass++
      else if (val === 'fail') attrFail++
    })
  })
  const total = attrPass + attrFail
  return total > 0 ? Math.round((attrPass / total) * 100) : null
}

function computePassRate(reviews) {
  const scored = reviews.filter((r) => r.result !== 'pending')
  if (scored.length === 0) return null
  const passes = scored.filter((r) => r.result === 'pass').length
  return Math.round((passes / scored.length) * 100)
}

function MetricBar({ label, value, description }) {
  const color = value === null ? '#8888a0' : value >= 60 ? '#16a34a' : '#e11d48'
  return (
    <div className="px-4 py-3.5 rounded-xl" style={{ background: '#ebebee', border: '1px solid #d0d0d6' }}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>{label}</span>
        <span className="text-xs font-bold" style={{ color, fontFamily: "'Poppins',sans-serif" }}>
          {value !== null ? `${value}%` : '—'}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden relative mb-1.5" style={{ background: '#dcdce0' }}>
        {value !== null && (
          <div className="h-full rounded-full score-bar-fill" style={{ width: `${value}%`, background: color }} />
        )}
        <div className="absolute top-0 bottom-0 w-px" style={{ left: '60%', background: '#a0a0b0' }} />
      </div>
      <div className="text-[9px]" style={{ color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>{description}</div>
    </div>
  )
}

function DateRangeFilter({ from, to, onFromChange, onToChange, onClear }) {
  const inputStyle = {
    background: '#f5f5f8',
    border: '1px solid #d0d0d6',
    borderRadius: 7,
    padding: '3px 8px',
    color: '#1a1a2e',
    fontSize: 11,
    fontFamily: "'Poppins',sans-serif",
    outline: 'none',
    width: 136,
    height: 26,
  }
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5">
        <label className="text-[10px] font-semibold tracking-[1.5px] uppercase shrink-0"
          style={{ color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>From</label>
        <input type="date" value={from} onChange={(e) => onFromChange(e.target.value)} style={inputStyle} />
      </div>
      <div className="flex items-center gap-1.5">
        <label className="text-[10px] font-semibold tracking-[1.5px] uppercase shrink-0"
          style={{ color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>To</label>
        <input type="date" value={to} onChange={(e) => onToChange(e.target.value)} style={inputStyle} />
      </div>
      {(from || to) && (
        <button
          onClick={onClear}
          style={{
            fontSize: 11, fontWeight: 600, padding: '3px 9px', height: 26,
            borderRadius: 7, background: '#dcdce0', border: '1px solid #c8c8ce',
            color: '#505060', cursor: 'pointer', fontFamily: "'Poppins',sans-serif",
          }}
        >
          Clear
        </button>
      )}
    </div>
  )
}

function NotesModal({ agent, agentReviews, onClose }) {
  const [expandedSid, setExpandedSid] = useState(null)

  const notedReviews = useMemo(() =>
    agentReviews
      .filter((r) => r.notes && r.notes.trim())
      .sort((a, b) => new Date(b.callDate || b.reviewedAt) - new Date(a.callDate || a.reviewedAt)),
    [agentReviews]
  )

  return (
    <Modal open onClose={onClose} title="Call Notes">
      {notedReviews.length === 0 ? (
        <div className="text-center py-10 text-sm" style={{ color: '#8888a0' }}>No notes recorded for this agent yet.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {notedReviews.map((r) => (
            <div key={r.id} className="px-4 py-3.5 rounded-xl transition-all"
              style={{ background: '#ebebee', border: '1px solid #d0d0d6' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-[11px]" style={{ color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>{r.callDate}</span>
                  {r.reviewer && (
                    <span className="text-[10px] font-medium px-1.5 py-px rounded"
                      style={{ background: '#dcdce0', border: '1px solid #c8c8ce', color: '#505060', fontFamily: "'Poppins',sans-serif" }}>
                      {r.reviewer}
                    </span>
                  )}
                </div>
                {r.sid && (
                  <button
                    onClick={() => setExpandedSid(expandedSid === r.id ? null : r.id)}
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-lg cursor-pointer transition-all"
                    style={{ background: '#e8f0ff', color: '#2563eb', border: '1px solid #c8d4f0', fontFamily: "'Poppins',sans-serif" }}
                  >
                    {expandedSid === r.id ? 'Hide SID' : 'Show SID'}
                  </button>
                )}
              </div>
              {expandedSid === r.id && r.sid && (
                <div className="mb-2 px-3 py-2 rounded-lg" style={{ background: '#dcdce0', border: '1px solid #c8c8ce' }}>
                  <span className="text-[10px] uppercase tracking-widest mr-2" style={{ color: '#8888a0' }}>SID</span>
                  <span className="text-[12px] font-semibold" style={{ color: '#1a1a2e', fontFamily: "'Poppins',sans-serif" }}>{r.sid}</span>
                </div>
              )}
              <p className="text-[13px] leading-relaxed" style={{ color: '#505060' }}>{r.notes}</p>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}

function exportAgentPDF({ agent, agentReviews, scored, passes, fails, qualityScore, passRate, mistakes, strengths, rangeLabel }) {
  const exportDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const qsColor = qualityScore === null ? '#9ca3af' : qualityScore >= 60 ? '#059669' : '#dc2626'
  const prColor = passRate === null ? '#9ca3af' : passRate >= 60 ? '#059669' : '#dc2626'

  const mistakesHTML = mistakes.length === 0
    ? `<p style="color:#059669;font-weight:600">No failures recorded in this period.</p>`
    : mistakes.map((m, i) => `
      <div style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;font-size:11px;color:#374151;margin-bottom:3px">
          <span>${i + 1}. ${m.name}${m.cat ? ` <em style="color:#9ca3af">(${m.cat})</em>` : ''}</span>
          <span style="font-weight:700;color:${m.failRate > 50 ? '#dc2626' : '#d97706'}">${m.fail}/${m.total} — ${m.failRate}%</span>
        </div>
        <div style="height:6px;background:#f3f4f6;border-radius:99px;overflow:hidden">
          <div style="height:100%;width:${m.failRate}%;border-radius:99px;background:${m.failRate > 50 ? '#dc2626' : '#f59e0b'}"></div>
        </div>
      </div>`).join('')

  const tipsHTML = mistakes.slice(0, 4).map((m) => `
    <div style="display:flex;gap:10px;padding:8px 12px;border:1px solid #dbeafe;border-radius:8px;background:#eff6ff;margin-bottom:6px;font-size:11px;color:#1d4ed8;line-height:1.5">
      <span style="font-weight:700;flex-shrink:0">&#8594;</span>
      <div><strong>${m.name}:</strong> ${getTip(m.name)}</div>
    </div>`).join('')

  const strengthsHTML = strengths.length === 0 ? '' : `
    <div style="font-size:13px;font-weight:700;margin:20px 0 10px;padding-bottom:5px;border-bottom:1px solid #f3f4f6">Strengths</div>
    <div>${strengths.map((s) => `<span style="display:inline-block;padding:2px 10px;border-radius:999px;background:#ecfdf5;color:#059669;border:1px solid #a7f3d0;font-size:10px;margin:2px">${s.name}</span>`).join('')}</div>`

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<title>Agent Scorecard - ${agent.name}</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#fff;color:#111;font-family:'Poppins',Arial,sans-serif;font-size:12px;padding:40px;max-width:800px;margin:0 auto}
  h2{font-size:13px;font-weight:700;color:#111;margin:20px 0 10px;padding-bottom:5px;border-bottom:1px solid #f3f4f6}
</style>
</head><body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #e5e7eb;padding-bottom:16px;margin-bottom:24px">
    <div>
      <div style="font-size:22px;font-weight:800;letter-spacing:-0.4px">${agent.name}</div>
      <div style="font-size:11px;color:#6b7280;margin-top:4px">${agent.id || 'No ID'} · Agent Scorecard · ${rangeLabel}</div>
    </div>
    <div style="display:flex;gap:24px">
      <div style="text-align:center">
        <div style="font-size:30px;font-weight:800;color:${qsColor};line-height:1">${qualityScore !== null ? qualityScore + '%' : '-'}</div>
        <div style="font-size:9px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;margin-top:3px">Quality Score</div>
      </div>
      <div style="width:1px;background:#e5e7eb;align-self:stretch"></div>
      <div style="text-align:center">
        <div style="font-size:30px;font-weight:800;color:${prColor};line-height:1">${passRate !== null ? passRate + '%' : '-'}</div>
        <div style="font-size:9px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;margin-top:3px">Pass Rate</div>
      </div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px">
    ${[['Total Calls', agentReviews.length, '#111'], ['Scored', scored.length, '#111'], ['Passed', passes, '#059669'], ['Failed', fails, '#dc2626']].map(([l, v, c]) => `
      <div style="border:1.5px solid #e5e7eb;border-radius:10px;padding:12px 14px;background:#f9fafb">
        <div style="font-size:9px;text-transform:uppercase;letter-spacing:1.2px;color:#9ca3af;margin-bottom:4px">${l}</div>
        <div style="font-size:24px;font-weight:800;line-height:1;color:${c}">${v}</div>
      </div>`).join('')}
  </div>
  <h2>Most Common Mistakes</h2>
  ${mistakesHTML}
  ${mistakes.length > 0 ? '<h2>Improvement Opportunities</h2>' + tipsHTML : ''}
  ${strengthsHTML}
  <div style="margin-top:32px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;display:flex;justify-content:space-between">
    <span>QIS — Quality Intelligence System</span>
    <span>Generated: ${exportDate} · Period: ${rangeLabel}</span>
  </div>
</body></html>`

  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
  win.onload = () => { win.focus(); win.print() }
}

function ScorecardModal({ agent, state, onClose }) {
  const [dateFrom, setDateFrom]   = useState('')
  const [dateTo, setDateTo]       = useState('')
  const [showNotes, setShowNotes] = useState(false)

  const agentReviews = useMemo(() => {
    if (!agent) return []
    return state.reviews.filter((r) => {
      if (r.agentName !== agent.name) return false
      const d = new Date(r.callDate || r.reviewedAt)
      if (dateFrom && d < new Date(dateFrom)) return false
      if (dateTo   && d > new Date(dateTo + 'T23:59:59')) return false
      return true
    })
  }, [agent, state.reviews, dateFrom, dateTo])

  const scored       = agentReviews.filter((r) => r.result !== 'pending')
  const passes       = scored.filter((r) => r.result === 'pass').length
  const fails        = scored.filter((r) => r.result === 'fail').length
  const qualityScore = computeQualityScore(agentReviews)
  const passRate     = computePassRate(agentReviews)
  const notesCount   = agentReviews.filter((r) => r.notes && r.notes.trim()).length

  const mistakeMap = useMemo(() => {
    const map = {}
    state.criteria.forEach((c) => { map[c.id] = { name: c.name, cat: c.cat, total: 0, fail: 0 } })
    agentReviews.forEach((r) => {
      Object.entries(r.scores || {}).forEach(([cid, val]) => {
        if (!map[cid] || val === 'na') return
        map[cid].total++
        if (val === 'fail') map[cid].fail++
      })
    })
    return Object.values(map)
      .filter((m) => m.total > 0)
      .map((m) => ({ ...m, failRate: Math.round((m.fail / m.total) * 100) }))
      .sort((a, b) => b.failRate - a.failRate)
  }, [agentReviews, state.criteria])

  const mistakes  = mistakeMap.filter((m) => m.failRate > 0)
  const strengths = mistakeMap.filter((m) => m.failRate === 0)

  const rangeLabel = dateFrom || dateTo ? `${dateFrom || '…'} → ${dateTo || '…'}` : 'All time'

  const initials = agent.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
  const gradIdx  = [...agent.name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % GRADIENTS.length

  return (
    <>
      <Modal open onClose={onClose} title="">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 -mt-2">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${GRADIENTS[gradIdx]} grid place-items-center font-bold text-lg text-white shrink-0`}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-[20px] truncate" style={{ color: '#1a1a2e', fontFamily: "'Poppins',sans-serif" }}>{agent.name}</div>
            <div className="text-[11px]" style={{ color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>{agent.id || 'No ID'} · Agent Scorecard</div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-center">
              <div className="font-bold text-[28px] leading-none" style={{ color: qualityScore === null ? '#8888a0' : qualityScore >= 60 ? '#16a34a' : '#e11d48', fontFamily: "'Poppins',sans-serif" }}>
                {qualityScore !== null ? `${qualityScore}%` : '—'}
              </div>
              <div className="text-[9px] uppercase tracking-widest mt-0.5" style={{ color: '#8888a0' }}>Quality Score</div>
            </div>
            <div className="w-px h-10" style={{ background: '#d0d0d6' }} />
            <div className="text-center">
              <div className="font-bold text-[28px] leading-none" style={{ color: passRate === null ? '#8888a0' : passRate >= 60 ? '#16a34a' : '#e11d48', fontFamily: "'Poppins',sans-serif" }}>
                {passRate !== null ? `${passRate}%` : '—'}
              </div>
              <div className="text-[9px] uppercase tracking-widest mt-0.5" style={{ color: '#8888a0' }}>Pass Rate</div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <DateRangeFilter
            from={dateFrom} to={dateTo}
            onFromChange={setDateFrom} onToChange={setDateTo}
            onClear={() => { setDateFrom(''); setDateTo('') }}
          />
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowNotes(true)}
              className="relative flex items-center gap-1.5 rounded-lg text-[12px] font-semibold cursor-pointer transition-all hover:opacity-80"
              style={{ padding: '3px 12px', height: 26, background: '#dcdce0', border: '1px solid #c8c8ce', color: '#505060', fontFamily: "'Poppins',sans-serif" }}
            >
              Notes
              {notesCount > 0 && (
                <span className="px-1.5 py-px rounded-full text-white font-semibold text-[9px]"
                  style={{ background: '#2563eb', fontFamily: "'Poppins',sans-serif" }}>
                  {notesCount}
                </span>
              )}
            </button>
            <button
              onClick={() => exportAgentPDF({ agent, agentReviews, scored, passes, fails, qualityScore, passRate, mistakes, strengths, rangeLabel })}
              className="flex items-center gap-1.5 rounded-lg text-[12px] font-semibold cursor-pointer transition-all hover:opacity-80"
              style={{ padding: '3px 12px', height: 26, background: '#dcdce0', border: '1px solid #c8c8ce', color: '#505060', fontFamily: "'Poppins',sans-serif" }}
            >
              ⬇ Export PDF
            </button>
          </div>
        </div>

        {/* Stat pills */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[['Total Calls', agentReviews.length, null], ['Scored', scored.length, null], ['Passed', passes, '#16a34a'], ['Failed', fails, '#e11d48']].map(([label, value, color]) => (
            <div key={label} className="flex flex-col items-center px-3 py-3 rounded-xl" style={{ background: '#ebebee', border: '1px solid #d0d0d6' }}>
              <span className="font-bold text-[24px] leading-none mb-1" style={color ? { color, fontFamily: "'Poppins',sans-serif" } : { color: '#1a1a2e', fontFamily: "'Poppins',sans-serif" }}>
                {value}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-center" style={{ color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>{label}</span>
            </div>
          ))}
        </div>

        {agentReviews.length === 0 ? (
          <div className="text-center py-8 text-sm" style={{ color: '#8888a0' }}>No reviews found for this period.</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <MetricBar label="Quality Score" value={qualityScore} description="Passed attributes / (Passed + Failed) — N/A excluded" />
              <MetricBar label="Pass Rate"     value={passRate}     description="Passed calls / total scored calls" />
            </div>

            <div className="mb-5">
              <div className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: '#1a1a2e', fontFamily: "'Poppins',sans-serif" }}>
                Most Common Mistakes
                <span className="text-[10px] font-normal" style={{ color: '#8888a0' }}>(by fail %)</span>
              </div>
              {mistakes.length === 0 ? (
                <div className="px-4 py-3 rounded-lg text-sm font-semibold" style={{ background: '#e6f9ee', border: '1px solid #a8ecc0', color: '#16a34a' }}>
                  No failures recorded in this period.
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {mistakes.map((m, i) => (
                    <div key={m.name} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md flex items-center justify-center font-semibold text-[9px] shrink-0"
                            style={{ background: '#dcdce0', border: '1px solid #c8c8ce', color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>
                            {i + 1}
                          </span>
                          <span className="text-[13px] font-semibold" style={{ color: '#1a1a2e' }}>{m.name}</span>
                          {m.cat && <span className="text-[10px]" style={{ color: '#8888a0' }}>{m.cat}</span>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px]" style={{ color: '#8888a0' }}>{m.fail}/{m.total}</span>
                          <span className="font-bold text-xs min-w-[40px] text-right"
                            style={{ color: m.failRate > 50 ? '#e11d48' : '#d97706', fontFamily: "'Poppins',sans-serif" }}>
                            {m.failRate}%
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#dcdce0' }}>
                        <div className="h-full rounded-full score-bar-fill"
                          style={{ width: `${m.failRate}%`, background: m.failRate > 50 ? '#e11d48' : '#d97706' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {mistakes.length > 0 && (
              <div className="mb-5">
                <div className="font-bold text-sm mb-3" style={{ color: '#1a1a2e', fontFamily: "'Poppins',sans-serif" }}>Improvement Opportunities</div>
                <div className="flex flex-col gap-2">
                  {mistakes.slice(0, 4).map((m) => (
                    <div key={m.name} className="flex gap-3 px-4 py-3 rounded-lg" style={{ background: '#e8f0ff', border: '1px solid #c8d4f0' }}>
                      <span className="text-sm shrink-0 mt-px" style={{ color: '#2563eb' }}>→</span>
                      <div>
                        <div className="text-[12px] font-semibold mb-0.5" style={{ color: '#1a1a2e' }}>{m.name}</div>
                        <div className="text-[12px] leading-relaxed" style={{ color: '#505060' }}>{getTip(m.name)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {strengths.length > 0 && (
              <div>
                <div className="font-bold text-sm mb-3" style={{ color: '#1a1a2e', fontFamily: "'Poppins',sans-serif" }}>Strengths</div>
                <div className="flex flex-wrap gap-2">
                  {strengths.map((s) => (
                    <span key={s.name} className="px-3 py-1 rounded-full text-[11px] font-semibold"
                      style={{ background: '#e6f9ee', border: '1px solid #a8ecc0', color: '#16a34a', fontFamily: "'Poppins',sans-serif" }}>
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </Modal>

      {showNotes && (
        <NotesModal agent={agent} agentReviews={agentReviews} onClose={() => setShowNotes(false)} />
      )}
    </>
  )
}

function AgentCard({ agent, index, onClick }) {
  const qsColor = agent.qualityScore === null ? '#8888a0' : agent.qualityScore >= 60 ? '#16a34a' : '#e11d48'
  const prColor = agent.passRate >= 60 ? '#16a34a' : '#e11d48'
  const initials = agent.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div onClick={onClick}
      className="rounded-xl p-5 cursor-pointer card-lift transition-all duration-200"
      style={{ background: '#f5f5f8', border: '1px solid #d0d0d6', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${GRADIENTS[index % GRADIENTS.length]} grid place-items-center font-bold text-sm text-white shrink-0`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm truncate" style={{ color: '#1a1a2e', fontFamily: "'Poppins',sans-serif" }}>{agent.name}</div>
          <div className="text-[10px]" style={{ color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>{agent.id || 'No ID'}</div>
        </div>
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded"
          style={{ color: '#8888a0', border: '1px solid #d0d0d6', background: '#ebebee', fontFamily: "'Poppins',sans-serif" }}>
          View →
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs">
          <span style={{ color: '#8888a0' }}>Quality Score</span>
          <span className="font-bold" style={{ color: qsColor, fontFamily: "'Poppins',sans-serif" }}>
            {agent.qualityScore !== null ? `${agent.qualityScore}%` : '—'}
          </span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: '#dcdce0' }}>
          <div className="h-full rounded-full score-bar-fill" style={{ width: `${agent.qualityScore ?? 0}%`, background: qsColor }} />
        </div>

        <div className="flex justify-between items-center text-xs mt-1">
          <span style={{ color: '#8888a0' }}>Pass Rate</span>
          <span className="font-bold" style={{ color: prColor, fontFamily: "'Poppins',sans-serif" }}>{agent.passRate}%</span>
        </div>
        <div className="h-1 rounded-full overflow-hidden mb-1" style={{ background: '#dcdce0' }}>
          <div className="h-full rounded-full score-bar-fill" style={{ width: `${agent.passRate}%`, background: prColor }} />
        </div>

        <div className="pt-1 flex flex-col gap-1.5 mt-1" style={{ borderTop: '1px solid #dcdce0' }}>
          <div className="flex justify-between text-xs">
            <span style={{ color: '#8888a0' }}>Total Reviews</span>
            <span className="font-semibold" style={{ color: '#1a1a2e', fontFamily: "'Poppins',sans-serif" }}>{agent.total}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: '#8888a0' }}>Passed</span>
            <span className="font-semibold" style={{ color: '#16a34a', fontFamily: "'Poppins',sans-serif" }}>{agent.pass}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: '#8888a0' }}>Failed</span>
            <span className="font-semibold" style={{ color: '#e11d48', fontFamily: "'Poppins',sans-serif" }}>{agent.fail}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Agents({ getAgentStats, state }) {
  const [selectedAgent, setSelectedAgent] = useState(null)
  const agents = Object.values(getAgentStats()).sort((a, b) => (b.qualityScore ?? 0) - (a.qualityScore ?? 0))

  if (agents.length === 0) {
    return (
      <div className="p-8 animate-fadeIn">
        <EmptyState icon="👥" title="No agents yet" sub="Agents appear after their first review" />
      </div>
    )
  }

  return (
    <div className="p-8 animate-fadeIn">
      <div className="grid grid-cols-3 gap-4">
        {agents.map((a, i) => (
          <AgentCard key={a.name} agent={a} index={i} onClick={() => setSelectedAgent(a)} />
        ))}
      </div>
      {selectedAgent && (
        <ScorecardModal agent={selectedAgent} state={state} onClose={() => setSelectedAgent(null)} />
      )}
    </div>
  )
}
