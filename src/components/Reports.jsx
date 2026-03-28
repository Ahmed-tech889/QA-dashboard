import { useState, useMemo } from 'react'
import { AttrBar, Badge, EmptyState, Panel, PanelHeader, Tag } from './ui'

function StatCard({ label, value, color, accent }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${accent} to-transparent`} />
      <div className="font-mono text-[11px] tracking-widest uppercase text-txt3 mb-2.5">{label}</div>
      <div className="font-syne font-extrabold text-[32px] leading-none" style={color ? { color } : {}}>{value}</div>
    </div>
  )
}

function DateRangeFilter({ from, to, onFromChange, onToChange, onClear }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-2">
        <label className="font-mono text-[11px] uppercase tracking-widest text-txt3 shrink-0">From</label>
        <input
          type="date"
          value={from}
          onChange={(e) => onFromChange(e.target.value)}
          style={{ width: 150 }}
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="font-mono text-[11px] uppercase tracking-widest text-txt3 shrink-0">To</label>
        <input
          type="date"
          value={to}
          onChange={(e) => onToChange(e.target.value)}
          style={{ width: 150 }}
        />
      </div>
      {(from || to) && (
        <button
          onClick={onClear}
          className="px-3 py-1.5 rounded-lg text-[11px] font-mono cursor-pointer border transition-all bg-surface2 text-txt3 border-border hover:text-txt"
        >
          Clear
        </button>
      )}
    </div>
  )
}

function exportReportsPDF({ rangeLabel, exportDate, reviews, scored, passes, fails, passRate, failRate, agentStats, attrFails, reviewerActivity }) {
  const agentRowsHTML = agentStats.map((a) => `
    <tr>
      <td>${a.name}</td>
      <td>${a.total}</td>
      <td style="color:${a.passRate >= 60 ? '#059669' : '#dc2626'};font-weight:700">${a.passRate}%</td>
      <td><span class="badge ${a.passRate >= 60 ? 'badge-pass' : 'badge-fail'}">${a.passRate >= 60 ? '✓ Pass' : '✗ Fail'}</span></td>
    </tr>`).join('')

  const criteriaRowsHTML = attrFails.map((a) => `
    <div class="attr-row">
      <div class="attr-header">
        <span class="attr-name">${a.name}</span>
        <span class="attr-pct" style="color:${a.failRate > 50 ? '#dc2626' : '#d97706'}">${a.failRate}%</span>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width:${a.failRate}%;background:${a.failRate > 50 ? '#dc2626' : '#d97706'}"></div></div>
    </div>`).join('')

  const reviewerRowsHTML = reviewerActivity.map((r) => `
    <tr>
      <td>${r.name}</td>
      <td>${r.total}</td>
      <td style="color:#059669">${r.pass}</td>
      <td style="color:#dc2626">${r.fail}</td>
      <td style="color:#d97706">${r.total - r.pass - r.fail}</td>
    </tr>`).join('')

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>QA Report — ${rangeLabel}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1a1a2e; font-size: 13px; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb; margin-bottom: 24px; }
  .report-title { font-size: 24px; font-weight: 800; color: #111; }
  .report-sub { font-size: 11px; color: #888; font-family: monospace; margin-top: 4px; }
  .meta-chip { background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 6px; padding: 3px 10px; font-size: 11px; font-family: monospace; color: #555; margin-right: 6px; }
  .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 28px; }
  .stat-box { border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; }
  .stat-val { font-size: 30px; font-weight: 800; line-height: 1; margin-bottom: 6px; }
  .stat-lbl { font-size: 10px; color: #888; font-family: monospace; text-transform: uppercase; letter-spacing: 0.8px; }
  .section { margin-bottom: 28px; }
  .section-title { font-size: 15px; font-weight: 700; margin-bottom: 14px; color: #111; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-family: monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: #888; padding: 8px 12px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
  td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
  tr:last-child td { border-bottom: none; }
  .badge { padding: 2px 10px; border-radius: 99px; font-size: 10px; font-family: monospace; font-weight: 700; }
  .badge-pass { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
  .badge-fail { background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; }
  .attr-row { margin-bottom: 10px; }
  .attr-header { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; }
  .attr-name { color: #374151; }
  .attr-pct { font-family: monospace; font-weight: 700; }
  .bar-track { height: 6px; background: #f3f4f6; border-radius: 99px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 99px; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 10px; color: #aaa; font-family: monospace; }
  @media print { body { padding: 24px; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="report-title">QA Performance Report</div>
      <div class="report-sub">Generated: ${exportDate}</div>
    </div>
    <div>
      <span class="meta-chip">📅 ${rangeLabel}</span>
      <span class="meta-chip">${reviews.length} total calls</span>
    </div>
  </div>

  <div class="stats-grid">
    <div class="stat-box"><div class="stat-val">${reviews.length}</div><div class="stat-lbl">Total Calls</div></div>
    <div class="stat-box"><div class="stat-val" style="color:#059669">${passRate !== null ? passRate + '%' : '—'}</div><div class="stat-lbl">Pass Rate</div></div>
    <div class="stat-box"><div class="stat-val" style="color:#dc2626">${failRate !== null ? failRate + '%' : '—'}</div><div class="stat-lbl">Fail Rate</div></div>
  </div>

  <div class="section">
    <div class="section-title">📊 Agent Performance</div>
    ${agentStats.length === 0 ? '<p style="color:#888">No agent data available.</p>' : `
    <table>
      <thead><tr><th>Agent</th><th>Total</th><th>Pass %</th><th>Status</th></tr></thead>
      <tbody>${agentRowsHTML}</tbody>
    </table>`}
  </div>

  <div class="section">
    <div class="section-title">⚠️ Worst Performing Criteria</div>
    ${attrFails.length === 0 ? '<p style="color:#888">No criteria data available.</p>' : criteriaRowsHTML}
  </div>

  <div class="section">
    <div class="section-title">👥 Reviewer Activity</div>
    ${reviewerActivity.length === 0 ? '<p style="color:#888">No reviewer data available.</p>' : `
    <table>
      <thead><tr><th>Reviewer</th><th>Total</th><th>Pass</th><th>Fail</th><th>Pending</th></tr></thead>
      <tbody>${reviewerRowsHTML}</tbody>
    </table>`}
  </div>

  <div class="footer">
    <span>QA Center · Performance Report</span>
    <span>${rangeLabel} · ${exportDate}</span>
  </div>
</body>
</html>`

  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
  win.onload = () => { win.focus(); win.print() }
}

export default function Reports({ state, getAgentStats, getCriteriaFailRates, getReviewerActivity }) {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo,   setDateTo]   = useState('')

  const filteredReviews = useMemo(() => {
    return state.reviews.filter((r) => {
      const d = new Date(r.callDate || r.reviewedAt)
      if (dateFrom && d < new Date(dateFrom)) return false
      if (dateTo   && d > new Date(dateTo + 'T23:59:59')) return false
      return true
    })
  }, [state.reviews, dateFrom, dateTo])

  const scored   = filteredReviews.filter((r) => r.result !== 'pending')
  const passes   = scored.filter((r) => r.result === 'pass').length
  const fails    = scored.filter((r) => r.result === 'fail').length
  const passRate = scored.length ? Math.round((passes / scored.length) * 100) : null
  const failRate = scored.length ? Math.round((fails  / scored.length) * 100) : null

  const agentStats = useMemo(() => {
    const stats = {}
    filteredReviews.filter((r) => r.result !== 'pending').forEach((r) => {
      if (!stats[r.agentName]) stats[r.agentName] = { name: r.agentName, total: 0, pass: 0, fail: 0, scoreSum: 0, scoredCount: 0 }
      stats[r.agentName].total++
      if (r.result === 'pass') stats[r.agentName].pass++
      else stats[r.agentName].fail++
      if (typeof r.score === 'number') { stats[r.agentName].scoreSum += r.score; stats[r.agentName].scoredCount++ }
    })
    return Object.values(stats)
      .map((s) => ({ ...s, passRate: s.scoredCount > 0 ? Math.round(s.scoreSum / s.scoredCount) : s.total > 0 ? Math.round((s.pass / s.total) * 100) : 0 }))
      .sort((a, b) => b.passRate - a.passRate)
  }, [filteredReviews])

  const attrFails = useMemo(() => {
    const rates = {}
    state.criteria.forEach((c) => (rates[c.id] = { name: c.name, total: 0, fail: 0 }))
    filteredReviews.forEach((r) => {
      Object.entries(r.scores || {}).forEach(([cid, val]) => {
        if (rates[cid] && val !== 'na') { rates[cid].total++; if (val === 'fail') rates[cid].fail++ }
      })
    })
    return Object.values(rates)
      .filter((r) => r.total > 0)
      .map((r) => ({ ...r, failRate: Math.round((r.fail / r.total) * 100) }))
      .sort((a, b) => b.failRate - a.failRate)
  }, [filteredReviews, state.criteria])

  const reviewerActivity = useMemo(() => {
    const r = {}
    filteredReviews.forEach((rev) => {
      if (!r[rev.reviewer]) r[rev.reviewer] = { name: rev.reviewer, total: 0, pass: 0, fail: 0 }
      r[rev.reviewer].total++
      if (rev.result === 'pass') r[rev.reviewer].pass++
      if (rev.result === 'fail') r[rev.reviewer].fail++
    })
    return Object.values(r).sort((a, b) => b.total - a.total)
  }, [filteredReviews])

  const rangeLabel = dateFrom || dateTo
    ? `${dateFrom || '…'} → ${dateTo || '…'}`
    : 'All time'
  const exportDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  const handleExportPDF = () => {
    exportReportsPDF({ rangeLabel, exportDate, reviews: filteredReviews, scored, passes, fails, passRate, failRate, agentStats, attrFails, reviewerActivity })
  }

  return (
    <div className="p-8 animate-fadeIn">

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <DateRangeFilter
          from={dateFrom}
          to={dateTo}
          onFromChange={setDateFrom}
          onToChange={setDateTo}
          onClear={() => { setDateFrom(''); setDateTo('') }}
        />
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface2 border border-border text-txt2 hover:text-txt hover:border-accent/40 cursor-pointer transition-all text-[13px] font-medium shrink-0"
        >
          ⬇ Export PDF
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4 mb-7">
        <StatCard label="Total Calls" value={filteredReviews.length} accent="from-accent" />
        <StatCard label="Pass Rate"   value={passRate !== null ? passRate + '%' : '—'} color="#00d4aa" accent="from-pass" />
        <StatCard label="Fail Rate"   value={failRate !== null ? failRate + '%' : '—'} color="#ff6b6b" accent="from-fail" />
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5">
        <Panel>
          <PanelHeader title="📊 Agent Performance" />
          {agentStats.length === 0
            ? <EmptyState icon="👥" sub="No data" />
            : <table className="w-full border-collapse">
                <thead>
                  <tr>{['Agent', 'Total', 'Pass%', 'Status'].map((h) => (
                    <th key={h} className="text-left font-mono text-[10px] tracking-widest uppercase text-txt3 px-4 py-2.5 border-b border-border bg-surface2">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {agentStats.map((a) => (
                    <tr key={a.name} className="border-b border-border/50 last:border-0 hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-semibold text-[13.5px]">{a.name}</td>
                      <td className="px-4 py-3 text-sm">{a.total}</td>
                      <td className="px-4 py-3 font-mono text-sm" style={{ color: a.passRate >= 60 ? '#00d4aa' : '#ff6b6b' }}>{a.passRate}%</td>
                      <td className="px-4 py-3"><Badge result={a.passRate >= 60 ? 'pass' : 'fail'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </Panel>

        <Panel>
          <PanelHeader title="⚠️ Worst Performing Criteria" />
          <div className="p-5">
            {attrFails.length === 0
              ? <EmptyState icon="📋" sub="No criteria scored yet" />
              : <div className="flex flex-col gap-3">{attrFails.map((a) => <AttrBar key={a.name} name={a.name} pct={a.failRate} />)}</div>
            }
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHeader title="👥 Reviewer Activity" />
        {reviewerActivity.length === 0
          ? <EmptyState icon="👤" sub="No activity yet" />
          : <table className="w-full border-collapse">
              <thead>
                <tr>{['Reviewer', 'Total Reviews', 'Pass', 'Fail', 'Pending'].map((h) => (
                  <th key={h} className="text-left font-mono text-[10px] tracking-widest uppercase text-txt3 px-4 py-2.5 border-b border-border bg-surface2">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {reviewerActivity.map((r) => (
                  <tr key={r.name} className="border-b border-border/50 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-semibold">{r.name}</td>
                    <td className="px-4 py-3"><Tag>{r.total}</Tag></td>
                    <td className="px-4 py-3 text-pass font-mono text-sm">{r.pass}</td>
                    <td className="px-4 py-3 text-fail font-mono text-sm">{r.fail}</td>
                    <td className="px-4 py-3 text-accent4 font-mono text-sm">{r.total - r.pass - r.fail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </Panel>
    </div>
  )
}
