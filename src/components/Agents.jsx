import { useState, useMemo } from 'react'
import { EmptyState, Modal } from './ui'

const GRADIENTS = [
  'from-[#6c63ff] to-[#a78bfa]',
  'from-[#00d4aa] to-[#4ade80]',
  'from-[#ff6b6b] to-[#fb923c]',
  'from-[#ffa94d] to-[#fbbf24]',
  'from-[#38bdf8] to-[#818cf8]',
  'from-[#e879f9] to-[#a855f7]',
]

const IMPROVEMENT_TIPS = [
  {
    match: 'did the agent introduce the brand, their name, and offer help',
    tip: 'The agent should open the call with a proper greeting, clearly introduce the brand and their name, and proactively offer assistance to set a professional tone.',
  },
  {
    match: 'did the agent confirm the correct security protocol',
    tip: 'The agent should ensure all required security verification steps are completed before disclosing any booking information to maintain compliance and data protection.',
  },
  {
    match: 'did the agent demonstrate empathy',
    tip: "The agent should acknowledge the customer's situation and express empathy using appropriate phrases to build rapport and show understanding.",
  },
  {
    match: 'did the agent demonstrate ownership',
    tip: 'The agent should take full ownership of the issue by reassuring support, asking relevant questions, and confirming understanding through effective recaps.',
  },
  {
    match: 'did the agent offer additional help and close properly',
    tip: 'The agent should offer further assistance and close the call using proper branding to ensure a complete and professional customer experience.',
  },
  {
    match: 'did the agent avoid long silences',
    tip: 'The agent should avoid prolonged silence by setting expectations beforehand or providing periodic updates during the call.',
  },
  {
    match: 'did the agent refresh the call within 5 minutes',
    tip: 'The agent should return to the call within the expected timeframe to update the customer and maintain engagement.',
  },
  {
    match: 'did the agent avoid negative language, interruptions, or blame',
    tip: 'The agent should maintain a professional tone by avoiding negative language, not interrupting the customer, and refraining from blaming colleagues or systems.',
  },
  {
    match: 'did the agent use mila correctly',
    tip: 'The agent should use Mila effectively by asking clear, relevant questions aligned with the customer\'s request to ensure accurate support.',
  },
  {
    match: 'did the agent transfer when mila advised',
    tip: "The agent should follow Mila's guidance and transfer the call to Level 2 promptly when required.",
  },
  {
    match: 'did the agent flag the issue on slack when needed',
    tip: "The agent should proactively escalate cases via Slack when necessary, even without Mila's instruction, to ensure proper follow-up.",
  },
  {
    match: 'was the agent transparent and compliant',
    tip: 'The agent should provide accurate, complete, and compliant information while setting realistic expectations throughout the call.',
  },
  {
    match: 'did the agent summarize and give correct timeframes',
    tip: 'The agent should clearly summarize actions taken and next steps, including accurate timelines based on available guidance.',
  },
  {
    match: 'was the issue fully resolved',
    tip: "The agent should aim for first-contact resolution by fully addressing the customer's request and minimizing the need for repeat contact.",
  },
]

const DEFAULT_TIP = 'Review recorded calls with your team lead to identify specific areas for improvement.'

function getTip(name) {
  const lower = name.trim().toLowerCase()
  const found = IMPROVEMENT_TIPS.find((entry) => lower.includes(entry.match))
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
  const color = value === null ? '#5a5a72' : value >= 60 ? '#00d4aa' : '#ff6b6b'
  return (
    <div className="px-4 py-3.5 bg-surface2 border border-border rounded-xl">
      <div className="flex justify-between items-center mb-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-txt3">{label}</span>
        <span className="font-mono text-xs font-bold" style={{ color }}>
          {value !== null ? `${value}%` : '—'}
        </span>
      </div>
      <div className="h-1.5 bg-surface3 rounded-full overflow-hidden relative mb-1.5">
        {value !== null && (
          <div className="h-full rounded-full score-bar-fill" style={{ width: `${value}%`, background: color }} />
        )}
        <div className="absolute top-0 bottom-0 w-px bg-txt3/40" style={{ left: '60%' }} />
      </div>
      <div className="font-mono text-[9px] text-txt3 leading-relaxed">{description}</div>
    </div>
  )
}

function DateRangeFilter({ from, to, onFromChange, onToChange, onClear }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-2">
        <label className="font-mono text-[11px] uppercase tracking-widest text-txt3 shrink-0">From</label>
        <input type="date" value={from} onChange={(e) => onFromChange(e.target.value)} style={{ width: 145 }} />
      </div>
      <div className="flex items-center gap-2">
        <label className="font-mono text-[11px] uppercase tracking-widest text-txt3 shrink-0">To</label>
        <input type="date" value={to} onChange={(e) => onToChange(e.target.value)} style={{ width: 145 }} />
      </div>
      {(from || to) && (
        <button
          onClick={onClear}
          className="px-2.5 py-1 rounded-lg text-[11px] font-mono cursor-pointer border transition-all bg-surface2 text-txt3 border-border hover:text-txt"
        >
          Clear
        </button>
      )}
    </div>
  )
}

function exportAgentPDF({ agent, agentReviews, scored, passes, fails, qualityScore, passRate, mistakes, strengths, rangeLabel }) {
  const exportDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const qsColor = qualityScore === null ? '#9ca3af' : qualityScore >= 60 ? '#059669' : '#dc2626'
  const prColor = passRate     === null ? '#9ca3af' : passRate     >= 60 ? '#059669' : '#dc2626'

  const mistakesHTML = mistakes.length === 0
    ? `<p style="color:#059669;font-weight:600">🎉 No failures recorded in this period.</p>`
    : mistakes.map((m, i) => `
      <div style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;font-size:11px;color:#374151;margin-bottom:3px">
          <span>${i + 1}. ${m.name}${m.cat ? ` <em style="color:#9ca3af">(${m.cat})</em>` : ''}</span>
          <span style="font-family:'DM Mono',monospace;font-weight:700;color:${m.failRate > 50 ? '#dc2626' : '#d97706'}">${m.fail}/${m.total} — ${m.failRate}%</span>
        </div>
        <div style="height:6px;background:#f3f4f6;border-radius:99px;overflow:hidden">
          <div style="height:100%;width:${m.failRate}%;border-radius:99px;background:${m.failRate > 50 ? '#dc2626' : '#f59e0b'}"></div>
        </div>
      </div>`).join('')

  const tipsHTML = mistakes.slice(0, 4).map((m) => `
    <div style="display:flex;gap:10px;padding:8px 12px;border:1px solid #dbeafe;border-radius:8px;background:#eff6ff;margin-bottom:6px;font-size:11px;color:#1d4ed8;line-height:1.5">
      <span style="font-weight:700;flex-shrink:0">→</span>
      <div><strong>${m.name}:</strong> ${getTip(m.name)}</div>
    </div>`).join('')

  const strengthsHTML = strengths.length === 0 ? '' : `
    <div style="font-size:13px;font-weight:700;margin:20px 0 10px;padding-bottom:5px;border-bottom:1px solid #f3f4f6">✅ Strengths</div>
    <div>${strengths.map((s) => `<span style="display:inline-block;padding:2px 10px;border-radius:999px;background:#ecfdf5;color:#059669;border:1px solid #a7f3d0;font-size:10px;font-family:'DM Mono',monospace;margin:2px">${s.name}</span>`).join('')}</div>`

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Agent Scorecard — ${agent.name}</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=DM+Mono:wght@400;500&family=Syne:wght@800&display=swap" rel="stylesheet"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#fff;color:#111;font-family:'DM Sans',Arial,sans-serif;font-size:12px;padding:40px;max-width:800px;margin:0 auto}
    h2{font-size:13px;font-weight:700;color:#111;margin:20px 0 10px;padding-bottom:5px;border-bottom:1px solid #f3f4f6}
  </style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #e5e7eb;padding-bottom:16px;margin-bottom:24px">
    <div>
      <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;letter-spacing:-0.4px">${agent.name}</div>
      <div style="font-size:11px;color:#6b7280;margin-top:4px;font-family:'DM Mono',monospace">${agent.id || 'No ID'} · Agent Scorecard · ${rangeLabel}</div>
    </div>
    <div style="display:flex;gap:24px;align-items:flex-start">
      <div style="text-align:center">
        <div style="font-family:'Syne',sans-serif;font-size:30px;font-weight:800;color:${qsColor};line-height:1">${qualityScore !== null ? qualityScore + '%' : '—'}</div>
        <div style="font-size:9px;color:#9ca3af;font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:1px;margin-top:3px">Quality Score</div>
      </div>
      <div style="width:1px;background:#e5e7eb;align-self:stretch"></div>
      <div style="text-align:center">
        <div style="font-family:'Syne',sans-serif;font-size:30px;font-weight:800;color:${prColor};line-height:1">${passRate !== null ? passRate + '%' : '—'}</div>
        <div style="font-size:9px;color:#9ca3af;font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:1px;margin-top:3px">Pass Rate</div>
      </div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px">
    ${[['Total Calls', agentReviews.length, '#111'], ['Scored', scored.length, '#111'], ['Passed', passes, '#059669'], ['Failed', fails, '#dc2626']].map(([l, v, c]) => `
      <div style="border:1.5px solid #e5e7eb;border-radius:10px;padding:12px 14px;background:#f9fafb">
        <div style="font-size:9px;font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:1.2px;color:#9ca3af;margin-bottom:4px">${l}</div>
        <div style="font-size:24px;font-weight:800;line-height:1;color:${c}">${v}</div>
      </div>`).join('')}
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:24px">
    <div style="border:1.5px solid #e5e7eb;border-radius:10px;padding:14px 16px;background:#f9fafb">
      <div style="display:flex;justify-content:space-between;margin-bottom:6px">
        <span style="font-size:9px;font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:1px;color:#9ca3af">Quality Score</span>
        <span style="font-size:11px;font-family:'DM Mono',monospace;font-weight:700;color:${qsColor}">${qualityScore !== null ? qualityScore + '%' : '—'}</span>
      </div>
      <div style="height:6px;background:#e5e7eb;border-radius:99px;overflow:hidden;margin-bottom:5px">
        <div style="height:100%;border-radius:99px;width:${qualityScore ?? 0}%;background:${qsColor}"></div>
      </div>
      <div style="font-size:10px;color:#6b7280">Passed attributes ÷ (Passed + Failed attributes) — N/A excluded</div>
    </div>
    <div style="border:1.5px solid #e5e7eb;border-radius:10px;padding:14px 16px;background:#f9fafb">
      <div style="display:flex;justify-content:space-between;margin-bottom:6px">
        <span style="font-size:9px;font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:1px;color:#9ca3af">Pass Rate</span>
        <span style="font-size:11px;font-family:'DM Mono',monospace;font-weight:700;color:${prColor}">${passRate !== null ? passRate + '%' : '—'}</span>
      </div>
      <div style="height:6px;background:#e5e7eb;border-radius:99px;overflow:hidden;margin-bottom:5px">
        <div style="height:100%;border-radius:99px;width:${passRate ?? 0}%;background:${prColor}"></div>
      </div>
      <div style="font-size:10px;color:#6b7280">Passed calls ÷ total scored calls</div>
    </div>
  </div>

  <h2>⚠️ Most Common Mistakes</h2>
  ${mistakesHTML}

  ${mistakes.length > 0 ? `<h2>💡 Improvement Opportunities</h2>${tipsHTML}` : ''}

  ${strengthsHTML}

  <div style="margin-top:32px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;font-family:'DM Mono',monospace;display:flex;justify-content:space-between">
    <span>QIS — Quality Intelligence System</span>
    <span>Generated: ${exportDate} · Period: ${rangeLabel}</span>
  </div>
</body>
</html>`

  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
  win.onload = () => { win.focus(); win.print() }
}

function ScorecardModal({ agent, state, onClose }) {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo,   setDateTo]   = useState('')

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

  const rangeLabel = dateFrom || dateTo
    ? `${dateFrom || '…'} → ${dateTo || '…'}`
    : 'All time'

  const initials = agent.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
  const gradientIndex = [...agent.name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % GRADIENTS.length

  const handleExport = () =>
    exportAgentPDF({ agent, agentReviews, scored, passes, fails, qualityScore, passRate, mistakes, strengths, rangeLabel })

  return (
    <Modal open onClose={onClose} title="">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 -mt-2">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${GRADIENTS[gradientIndex]} grid place-items-center font-bold text-lg text-white shrink-0`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-syne font-extrabold text-[20px] truncate">{agent.name}</div>
          <div className="font-mono text-[11px] text-txt3">{agent.id || 'No ID'} · Agent Scorecard</div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-center">
            <div className="font-syne font-extrabold text-[28px] leading-none"
              style={{ color: qualityScore === null ? '#5a5a72' : qualityScore >= 60 ? '#00d4aa' : '#ff6b6b' }}>
              {qualityScore !== null ? `${qualityScore}%` : '—'}
            </div>
            <div className="font-mono text-[9px] text-txt3 uppercase tracking-widest mt-0.5">Quality Score</div>
          </div>
          <div className="w-px h-10 bg-border" />
          <div className="text-center">
            <div className="font-syne font-extrabold text-[28px] leading-none"
              style={{ color: passRate === null ? '#5a5a72' : passRate >= 60 ? '#00d4aa' : '#ff6b6b' }}>
              {passRate !== null ? `${passRate}%` : '—'}
            </div>
            <div className="font-mono text-[9px] text-txt3 uppercase tracking-widest mt-0.5">Pass Rate</div>
          </div>
        </div>
      </div>

      {/* Date range + Export */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <DateRangeFilter
          from={dateFrom}
          to={dateTo}
          onFromChange={setDateFrom}
          onToChange={setDateTo}
          onClear={() => { setDateFrom(''); setDateTo('') }}
        />
        <button onClick={handleExport}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-medium font-dm cursor-pointer border transition-all bg-surface2 text-txt2 border-border hover:text-txt hover:border-accent/40 shrink-0">
          ⬇ Export PDF
        </button>
      </div>

      {/* Stat pills */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[['Total Calls', agentReviews.length, null], ['Scored', scored.length, null], ['Passed', passes, '#00d4aa'], ['Failed', fails, '#ff6b6b']].map(([label, value, color]) => (
          <div key={label} className="flex flex-col items-center px-3 py-3 bg-surface2 border border-border rounded-xl">
            <span className="font-syne font-extrabold text-[24px] leading-none mb-1" style={color ? { color } : {}}>
              {value}
            </span>
            <span className="font-mono text-[10px] tracking-widest uppercase text-txt3 text-center">{label}</span>
          </div>
        ))}
      </div>

      {agentReviews.length === 0 ? (
        <div className="text-center py-8 text-txt3 text-sm">No reviews found for this period.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <MetricBar
              label="Quality Score"
              value={qualityScore}
              description="Passed attributes ÷ (Passed + Failed) — N/A excluded"
            />
            <MetricBar
              label="Pass Rate"
              value={passRate}
              description="Passed calls ÷ total scored calls"
            />
          </div>

          {/* Most Common Mistakes */}
          <div className="mb-5">
            <div className="font-syne font-bold text-sm mb-3 flex items-center gap-2">
              ⚠️ Most Common Mistakes
              <span className="font-mono text-[10px] text-txt3 font-normal">(by fail %)</span>
            </div>
            {mistakes.length === 0 ? (
              <div className="px-4 py-3 bg-pass/8 border border-pass/20 rounded-lg text-pass text-sm font-medium">
                🎉 No failures recorded in this period.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {mistakes.map((m, i) => (
                  <div key={m.name} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-surface3 border border-border grid place-items-center font-mono text-[9px] text-txt3 shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-[13px] font-medium">{m.name}</span>
                        {m.cat && <span className="font-mono text-[10px] text-txt3">{m.cat}</span>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-[11px] text-txt3">{m.fail}/{m.total}</span>
                        <span className="font-mono text-xs font-bold min-w-[40px] text-right"
                          style={{ color: m.failRate > 50 ? '#ff6b6b' : '#ffa94d' }}>
                          {m.failRate}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-surface3 rounded-full overflow-hidden">
                      <div className="h-full rounded-full score-bar-fill"
                        style={{ width: `${m.failRate}%`, background: m.failRate > 50 ? '#ff6b6b' : '#ffa94d' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Improvement Opportunities */}
          {mistakes.length > 0 && (
            <div className="mb-5">
              <div className="font-syne font-bold text-sm mb-3">💡 Improvement Opportunities</div>
              <div className="flex flex-col gap-2">
                {mistakes.slice(0, 4).map((m) => (
                  <div key={m.name} className="flex gap-3 px-4 py-3 bg-accent/6 border border-accent/15 rounded-lg">
                    <span className="text-accent text-sm shrink-0 mt-px">→</span>
                    <div>
                      <div className="text-[12px] font-semibold text-txt mb-0.5">{m.name}</div>
                      <div className="text-[12px] text-txt2 leading-relaxed">{getTip(m.name)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths */}
          {strengths.length > 0 && (
            <div>
              <div className="font-syne font-bold text-sm mb-3">✅ Strengths</div>
              <div className="flex flex-wrap gap-2">
                {strengths.map((s) => (
                  <span key={s.name} className="px-3 py-1 rounded-full bg-pass/10 border border-pass/20 text-pass font-mono text-[11px]">
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Modal>
  )
}

function AgentCard({ agent, index, onClick }) {
  const qsColor = agent.qualityScore === null ? '#5a5a72' : agent.qualityScore >= 60 ? '#00d4aa' : '#ff6b6b'
  const prColor = agent.passRate >= 60 ? '#00d4aa' : '#ff6b6b'
  const initials = agent.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div onClick={onClick}
      className="bg-surface border border-border rounded-xl p-5 cursor-pointer hover:border-accent/40 hover:-translate-y-0.5 hover:shadow-2xl transition-all duration-200">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${GRADIENTS[index % GRADIENTS.length]} grid place-items-center font-bold text-sm text-white shrink-0`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-syne font-bold text-sm truncate">{agent.name}</div>
          <div className="font-mono text-[10px] text-txt3">{agent.id || 'No ID'}</div>
        </div>
        <span className="font-mono text-[10px] text-txt3 border border-border rounded px-1.5 py-0.5 bg-surface2 shrink-0">View →</span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-txt3">Quality Score</span>
          <span className="font-mono font-bold" style={{ color: qsColor }}>
            {agent.qualityScore !== null ? `${agent.qualityScore}%` : '—'}
          </span>
        </div>
        <div className="h-1 bg-surface3 rounded-full overflow-hidden">
          <div className="h-full rounded-full score-bar-fill"
            style={{ width: `${agent.qualityScore ?? 0}%`, background: qsColor }} />
        </div>

        <div className="flex justify-between items-center text-xs mt-1">
          <span className="text-txt3">Pass Rate</span>
          <span className="font-mono font-bold" style={{ color: prColor }}>{agent.passRate}%</span>
        </div>
        <div className="h-1 bg-surface3 rounded-full overflow-hidden mb-1">
          <div className="h-full rounded-full score-bar-fill"
            style={{ width: `${agent.passRate}%`, background: prColor }} />
        </div>

        <div className="pt-1 border-t border-border/50 flex flex-col gap-1.5 mt-1">
          <div className="flex justify-between text-xs">
            <span className="text-txt3">Total Reviews</span>
            <span className="font-mono">{agent.total}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-txt3">Passed</span>
            <span className="font-mono text-pass">{agent.pass}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-txt3">Failed</span>
            <span className="font-mono text-fail">{agent.fail}</span>
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
