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

// Each entry has an array of keywords — ALL must appear in the criterion name for it to match.
// Shorter, distinct keywords = resilient matching regardless of exact wording.
const IMPROVEMENT_TIPS = [
  {
    keywords: ['introduce', 'brand'],
    tip: 'The agent should open the call with a proper greeting, clearly introduce the brand and their name, and proactively offer assistance to set a professional tone.',
  },
  {
    keywords: ['security', 'protocol'],
    tip: 'The agent should ensure all required security verification steps are completed before disclosing any booking information to maintain compliance and data protection.',
  },
  {
    keywords: ['empathy'],
    tip: "The agent should acknowledge the customer's situation and express empathy using appropriate phrases to build rapport and show understanding.",
  },
  {
    keywords: ['ownership'],
    tip: 'The agent should take full ownership of the issue by reassuring support, asking relevant questions, and confirming understanding through effective recaps.',
  },
  {
    keywords: ['additional help', 'close'],
    tip: 'The agent should offer further assistance and close the call using proper branding to ensure a complete and professional customer experience.',
  },
  {
    keywords: ['silence'],
    tip: 'The agent should avoid prolonged silence by setting expectations beforehand or providing periodic updates during the call.',
  },
  {
    keywords: ['refresh', 'call'],
    tip: 'The agent should return to the call within the expected timeframe to update the customer and maintain engagement.',
  },
  {
    keywords: ['negative language'],
    tip: 'The agent should maintain a professional tone by avoiding negative language, not interrupting the customer, and refraining from blaming colleagues or systems.',
  },
  {
    keywords: ['mila correctly'],
    tip: "The agent should use Mila effectively by asking clear, relevant questions aligned with the customer's request to ensure accurate support.",
  },
  {
    keywords: ['transfer', 'mila'],
    tip: "The agent should follow Mila's guidance and transfer the call to Level 2 promptly when required.",
  },
  {
    keywords: ['flag', 'slack'],
    tip: "The agent should proactively escalate cases via Slack when necessary, even without Mila's instruction, to ensure proper follow-up.",
  },
  {
    keywords: ['transparent', 'compliant'],
    tip: 'The agent should provide accurate, complete, and compliant information while setting realistic expectations throughout the call.',
  },
  {
    keywords: ['summarize', 'timeframe'],
    tip: 'The agent should clearly summarize actions taken and next steps, including accurate timelines based on available guidance.',
  },
  {
    keywords: ['fully resolved'],
    tip: "The agent should aim for first-contact resolution by fully addressing the customer's request and minimizing the need for repeat contact.",
  },
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

  const initials = agent.name.split(' ').map((w) => w[0])
