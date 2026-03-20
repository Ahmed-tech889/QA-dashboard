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

const DATE_RANGES = [
  { label: 'Last 7 days',   days: 7 },
  { label: 'Last 30 days',  days: 30 },
  { label: 'Last 90 days',  days: 90 },
  { label: 'Last 6 months', days: 180 },
  { label: 'Last year',     days: 365 },
  { label: 'All time',      days: null },
]

const IMPROVEMENT_TIPS = {
  'greeting':      'Practice opening scripts daily and record yourself for self-review.',
  'compliance':    'Review compliance checklist before each shift; flag unclear policies to the team lead.',
  'resolution':    'Use the knowledge base more actively during calls; escalate unresolved cases within 5 min.',
  'empathy':       'Use active listening phrases (e.g. "I understand how frustrating this is") consistently.',
  'hold':          'Inform customers before placing on hold and check back every 60 seconds.',
  'closing':       'Summarise next steps clearly before ending each call.',
  'documentation': 'Complete call notes immediately after each interaction while details are fresh.',
  'default':       'Review recorded calls with your team lead to identify specific areas for improvement.',
}

function getTip(criterionName) {
  const lower = criterionName.toLowerCase()
  for (const [key, tip] of Object.entries(IMPROVEMENT_TIPS)) {
    if (lower.includes(key)) return tip
  }
  return IMPROVEMENT_TIPS.default
}

// Compute quality score from a set of reviews (criteria pass/fail attribute ratio)
function computeQualityScore(reviews) {
  let pass = 0, fail = 0
  reviews.forEach((r) => {
    Object.values(r.scores || {}).forEach((val) => {
      if (val === 'pass' || val === 'na') pass++
      else if (val === 'fail') fail++
    })
  })
  const total = pass + fail
  return total > 0 ? Math.round((pass / total) * 100) : null
}

// Compute cumulative pass rate from a set of reviews
function computePassRate(reviews) {
  const scored = reviews.filter((r) => r.result !== 'pending')
  if (scored.length === 0) return null
  const withScore = scored.filter((r) => typeof r.score === 'number')
  if (withScore.length > 0) {
    return Math.round(withScore.reduce((s, r) => s + r.score, 0) / withScore.length)
  }
  const passes = scored.filter((r) => r.result === 'pass').length
  return Math.round((passes / scored.length) * 100)
}

function StatPill({ label, value, color, sub }) {
  return (
    <div className="flex flex-col items-center px-4 py-3.5 bg-surface2 border border-border rounded-xl">
      <span
        className="font-syne font-extrabold text-[26px] leading-none mb-1"
        style={color ? { color } : {}}
      >
        {value ?? '—'}
      </span>
      <span className="font-mono text-[10px] tracking-widest uppercase text-txt3 text-center">{label}</span>
      {sub && <span className="font-mono text-[9px] text-txt3 mt-0.5">{sub}</span>}
    </div>
  )
}

function exportAgentPDF({ agent, agentReviews, scored, passes, fails, passRate, qualityScore, mistakes, strengths, rangeDays }) {
  const rangeLabel = DATE_RANGES.find((r) => r.days === rangeDays)?.label ?? 'All time'
  const exportDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  const mistakesHTML = mistakes.length === 0
    ? `<div style="color:#059669;font-weight:600;font-size:12px;">🎉 No failures recorded in this period.</div>`
    : mistakes.map((m, i) => `
        <div style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;font-size:11px;color:#374151;margin-bottom:3px">
            <span>${i + 1}. ${m.name}${m.cat ? ` <span style="color:#9ca3af">(${m.cat})</span>` : ''}</span>
            <span style="font-family:'DM Mono',monospace;color:${m.failRate > 50 ? '#dc2626' : '#d97706'}">${m.fail}/${m.total} — ${m.failRate}%</span>
          </div>
          <div style="height:6px;background:#f3f4f6;border-radius:99px;overflow:hidden">
            <div style="height:100%;border-radius:99px;width:${m.failRate}%;background:${m.failRate > 50 ? '#dc2626' : '#f59e0b'}"></div>
          </div>
        </div>`).join('')

  const tipsHTML = mistakes.slice(0, 4).map((m) => `
    <div style="display:flex;gap:10px;padding:8px 12px;border:1px solid #dbeafe;border-radius:8px;background:#eff6ff;margin-bottom:6px;font-size:11px;color:#1d4ed8;line-height:1.5">
      <span style="flex-shrink:0;font-weight:700">→</span>
      <div><strong>${m.name}:</strong> ${getTip(m.name)}</div>
    </div>`).join('')

  const strengthsHTML = strengths.length === 0 ? '' : `
    <div style="font-size:13px;font-weight:700;color:#111;margin:20px 0 10px;padding-bottom:5px;border-bottom:1px solid #f3f4f6">✅ Strengths</div>
    <div>${strengths.map((s) => `<span style="display:inline-block;padding:2px 10px;border-radius:999px;background:#ecfdf5;color:#059669;border:1px solid #a7f3d0;font-size:10px;font-family:'DM Mono',monospace;margin:2px">${s.name}</span>`).join('')}</div>`

  const qsColor  = qualityScore === null ? '#9ca3af' : qualityScore >= 60 ? '#059669' : '#dc2626'
  const prColor  = passRate     === null ? '#9ca3af' : passRate     >= 60 ? '#059669' : '#dc2626'

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Agent Scorecard — ${agent.name}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#fff;color:#111;font-family:'DM Sans','Helvetica Neue',Arial,sans-serif;font-size:12px;padding:40px;max-width:800px;margin:0 auto}
  </style>
</head>
<body>
  <div style="display:flex;align-items:flex-start;justify-content:space-between;border-bottom:2px solid #e5e7eb;padding-bottom:16px;margin-bottom:24px">
    <div>
      <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#111;letter-spacing:-0.4px">${agent.name}</div>
      <div style="font-size:11px;color:#6b7280;margin-top:4px;font-family:'DM Mono',monospace">${agent.id || 'No ID'} · Agent Scorecard · ${rangeLabel}</div>
    </div>
    <div style="text-align:right;display:flex;gap:20px;align-items:flex-start">
      <div style="text-align:center">
        <div style="font-family:'Syne',sans-serif;font-size:28px;font-weight:800;color:${qsColor};line-height:1">${qualityScore !== null ? qualityScore + '%' : '—'}</div>
        <div style="font-size:9px;color:#9ca3af;font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:1px;margin-top:2px">Quality Score</div>
      </div>
      <div style="text-align:center">
        <div style="font-family:'Syne',sans-serif;font-size:28px;font-weight:800;color:${prColor};line-height:1">${passRate !== null ? passRate + '%' : '—'}</div>
        <div style="font-size:9px;color:#9ca3af;font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:1px;margin-top:2px">Pass Rate</div>
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

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">
    <div style="border:1.5px solid #e5e7eb;border-radius:10px;padding:14px 16px;background:#f9fafb">
      <div style="font-size:9px;font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:1.2px;color:#9ca3af;margin-bottom:6px">Quality Score (criteria-level)</div>
      <div style="height:7px;background:#e5e7eb;border-radius:99px;overflow:hidden;margin-bottom:4px">
        <div style="height:100%;border-radius:99px;width:${qualityScore ?? 0}%;background:${qsColor}"></div>
      </div>
      <div style="font-size:10px;color:${qsColor};font-family:'DM Mono',monospace;font-weight:700">${qualityScore !== null ? qualityScore + '%' : '—'} · ${qualityScore !== null && qualityScore >= 60 ? 'Passing' : 'Below threshold'}</div>
    </div>
    <div style="border:1.5px solid #e5e7eb;border-radius:10px;padding:14px 16px;background:#f9fafb">
      <div style="font-size:9px;font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:1.2px;color:#9ca3af;margin-bottom:6px">Cumulative Pass Rate (call-level)</div>
      <div style="height:7px;background:#e5e7eb;border-radius:99px;overflow:hidden;margin-bottom:4px">
        <div style="height:100%;border-radius:99px;width:${passRate ?? 0}%;background:${prColor}"></div>
      </div>
      <div style="font-size:10px;color:${prColor};font-family:'DM Mono',monospace;font-weight:700">${passRate !== null ? passRate + '%' : '—'} · ${passRate !== null && passRate >= 60 ? 'Passing' : 'Below threshold'}</div>
    </div>
  </div>

  <div style="font-size:13px;font-weight:700;color:#111;margin-bottom:10px;padding-bottom:5px;border-bottom:1px solid #f3f4f6">⚠️ Most Common Mistakes</div>
  ${mistakesHTML}
  ${mistakes.length > 0 ? `<div style="font-size:13px;font-weight:700;color:#111;margin:20px 0 10px;padding-bottom:5px;border-bottom:1px solid #f3f4f6">💡 Improvement Opportunities</div>${tipsHTML}` : ''}
  ${strengthsHTML}

  <div style="margin-top:32px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;font-family:'DM Mono',monospace;display:flex;justify-content:space-between">
    <span>QA Center — Agent Scorecard</span>
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
  const [rangeDays, setRangeDays] = useState(30)

  const agentReviews = useMemo(() => {
    if (!agent) return []
    const cutoff = rangeDays ? new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000) : null
    return state.reviews.filter((r) => {
      if (r.agentName !== agent.name) return false
      if (cutoff) {
        const d = new Date(r.callDate || r.reviewedAt)
        if (d < cutoff) return false
      }
      return true
    })
  }, [agent, state.reviews, rangeDays])

  const scored       = agentReviews.filter((r) => r.result !== 'pending')
  const passes       = scored.filter((r) => r.result === 'pass').length
  const fails        = scored.filter((r) => r.result === 'fail').length
  const passRate     = computePassRate(agentReviews)
  const qualityScore = computeQualityScore(agentReviews)

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

  const initials = agent
    ? agent.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : ''
  const gradientIndex = agent
    ? [...agent.name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % GRADIENTS.length
    : 0

  if (!agent) return null

  const handleExport = () =>
    exportAgentPDF({ agent, agentReviews, scored, passes, fails, passRate, qualityScore, mistakes, strengths, rangeDays })

  return (
    <Modal open onClose={onClose} title="">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 -mt-2">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${GRADIENTS[gradientIndex]} grid place-items-center font-bold text-lg text-white shrink-0`}>
          {initials}
        </div>
        <div className="flex-1">
          <div className="font-syne font-extrabold text-[20px]">{agent.name}</div>
          <div className="font-mono text-[11px] text-txt3">{agent.id || 'No ID'} · Agent Scorecard</div>
        </div>
        {/* Two metrics in header */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-center">
            <div
              className="font-syne font-extrabold text-[28px] leading-none"
              style={{ color: qualityScore === null ? '#5a5a72' : qualityScore >= 60 ? '#00d4aa' : '#ff6b6b' }}
            >
              {qualityScore !== null ? `${qualityScore}%` : '—'}
            </div>
            <div className="font-mono text-[9px] text-txt3 uppercase tracking-widest mt-0.5">Quality Score</div>
          </div>
          <div className="w-px h-10 bg-border" />
          <div className="text-center">
            <div
              className="font-syne font-extrabold text-[28px] leading-none"
              style={{ color: passRate === null ? '#5a5a72' : passRate >= 60 ? '#00d4aa' : '#ff6b6b' }}
            >
              {passRate !== null ? `${passRate}%` : '—'}
            </div>
            <div className="font-mono text-[9px] text-txt3 uppercase tracking-widest mt-0.5">Pass Rate</div>
          </div>
        </div>
      </div>

      {/* Date Range + Export */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {DATE_RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setRangeDays(r.days)}
              className={`px-3 py-1 rounded-lg text-[11px] font-mono cursor-pointer border transition-all
                ${rangeDays === r.days
                  ? 'bg-accent text-white border-accent'
                  : 'bg-surface2 text-txt3 border-border hover:text-txt'}`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-medium font-dm cursor-pointer border transition-all bg-surface2 text-txt2 border-border hover:text-txt hover:border-accent/40 shrink-0"
        >
          <span>⬇</span> Export PDF
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <StatPill label="Total Calls" value={agentReviews.length} />
        <StatPill label="Scored"      value={scored.length} />
        <StatPill label="Passed"      value={passes} color="#00d4aa" />
        <StatPill label="Failed"      value={fails}  color="#ff6b6b" />
      </div>

      {agentReviews.length === 0 ? (
        <div className="text-center py-8 text-txt3 text-sm">No reviews found for this period.</div>
      ) : (
        <>
          {/* Dual metric bars */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Quality Score bar */}
            <div className="px-4 py-3.5 bg-surface2 border border-border rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-txt3">Quality Score</span>
                <span className="font-mono text-xs font-bold"
                  style={{ color: qualityScore === null ? '#5a5a72' : qualityScore >= 60 ? '#00d4aa' : '#ff6b6b' }}>
                  {qualityScore !== null ? `${qualityScore}%` : '—'}
                </span>
              </div>
              <div className="h-1.5 bg-surface3 rounded-full overflow-hidden relative mb-1.5">
                {qualityScore !== null && (
                  <div className="h-full rounded-full score-bar-fill"
                    style={{ width: `${qualityScore}%`, background: qualityScore >= 60 ? '#00d4aa' : '#ff6b6b' }} />
                )}
                <div className="absolute top-0 bottom-0 w-px bg-txt3/40" style={{ left: '60%' }} />
              </div>
              <div className="font-mono text-[9px] text-txt3">
                Passed + N/A criteria attributes / all scored attributes
              </div>
            </div>

            {/* Pass Rate bar */}
            <div className="px-4 py-3.5 bg-surface2 border border-border rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-txt3">Pass Rate</span>
                <span className="font-mono text-xs font-bold"
                  style={{ color: passRate === null ? '#5a5a72' : passRate >= 60 ? '#00d4aa' : '#ff6b6b' }}>
                  {passRate !== null ? `${passRate}%` : '—'}
                </span>
              </div>
              <div className="h-1.5 bg-surface3 rounded-full overflow-hidden relative mb-1.5">
                {passRate !== null && (
                  <div className="h-full rounded-full score-bar-fill"
                    style={{ width: `${passRate}%`, background: passRate >= 60 ? '#00d4aa' : '#ff6b6b' }} />
                )}
                <div className="absolute top-0 bottom-0 w-px bg-txt3/40" style={{ left: '60%' }} />
              </div>
              <div className="font-mono text-[9px] text-txt3">
                Cumulative average of per-call weighted scores
              </div>
            </div>
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
                        <div>
                          <span className="text-[13px] font-medium">{m.name}</span>
                          {m.cat && <span className="ml-2 font-mono text-[10px] text-txt3">{m.cat}</span>}
                        </div>
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
  const isGoodQS = (agent.qualityScore ?? 0) >= 60
  const initials  = agent.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div
      onClick={onClick}
      className="bg-surface border border-border rounded-xl p-5 cursor-pointer hover:border-accent/40 hover:-translate-y-0.5 hover:shadow-2xl transition-all duration-200"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${GRADIENTS[index % GRADIENTS.length]} grid place-items-center font-bold text-sm text-white shrink-0`}>
          {initials}
        </div>
        <div className="flex-1">
          <div className="font-syne font-bold text-sm">{agent.name}</div>
          <div className="font-mono text-[10px] text-txt3">{agent.id || 'No ID'}</div>
        </div>
        <span className="font-mono text-[10px] text-txt3 border border-border rounded px-1.5 py-0.5 bg-surface2">View →</span>
      </div>

      <div className="flex flex-col gap-2">
        {/* Quality Score — primary metric on card */}
        <div className="flex justify-between items-center text-xs">
          <span className="text-txt3">Quality Score</span>
          <span className="font-mono font-medium" style={{ color: isGoodQS ? '#00d4aa' : '#ff6b6b' }}>
            {agent.qualityScore !== null ? `${agent.qualityScore}%` : '—'}
          </span>
        </div>
        <div className="h-1 bg-surface3 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full score-bar-fill"
            style={{
              width: `${agent.qualityScore ?? 0}%`,
              background: isGoodQS ? '#00d4aa' : '#ff6b6b',
            }}
          />
        </div>

        {/* Pass Rate — secondary metric */}
        <div className="flex justify-between items-center text-xs mt-1">
          <span className="text-txt3">Pass Rate</span>
          <span className="font-mono font-medium" style={{ color: (agent.passRate ?? 0) >= 60 ? '#00d4aa' : '#ff6b6b' }}>
            {agent.passRate}%
          </span>
        </div>
        <div className="h-1 bg-surface3 rounded-full overflow-hidden mb-1">
          <div
            className="h-full rounded-full score-bar-fill"
            style={{
              width: `${agent.passRate}%`,
              background: (agent.passRate ?? 0) >= 60 ? '#00d4aa' : '#ff6b6b',
            }}
          />
        </div>

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
        <ScorecardModal
          agent={selectedAgent}
          state={state}
          onClose={() => setSelectedAgent(null)}
        />
      )}
    </div>
  )
}
