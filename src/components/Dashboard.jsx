import { useState, useMemo } from 'react'
import { Badge, EmptyState, Panel, PanelHeader, AttrBar, Tag, AgentAvatar } from './ui'
import TrendChart from './TrendChart'

const HOUR = new Date().getHours()
const GREETING = HOUR < 12 ? 'Good morning' : HOUR < 17 ? 'Good afternoon' : 'Good evening'

const PRESETS = [
  { label: 'Today',      days: 0 },
  { label: 'This week',  days: 7 },
  { label: 'This month', days: 30 },
  { label: 'All time',   days: null },
]

function KPICard({ label, value, valueColor, accentColor, delta, deltaUp, deltaNeutral }) {
  return (
    <div className="rounded-2xl p-5 relative overflow-hidden card-lift"
      style={{ background: '#f5f5f8', border: '1px solid #d0d0d6', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl" style={{ background: accentColor }} />
      <div className="text-[10px] font-semibold tracking-[0.8px] uppercase mb-3"
        style={{ color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>{label}</div>
      <div className="font-bold text-[30px] leading-none mb-2"
        style={{ color: valueColor || '#1a1a2e', fontFamily: "'Poppins',sans-serif" }}>{value}</div>
      {delta && (
        <div className="text-[11px] font-medium flex items-center gap-1" style={{
          color: deltaNeutral ? '#8888a0' : deltaUp ? '#16a34a' : '#e11d48',
          fontFamily: "'Poppins',sans-serif",
        }}>
          {!deltaNeutral && <span>{deltaUp ? '↑' : '↓'}</span>}{delta}
        </div>
      )}
    </div>
  )
}

function DateRangeFilter({ preset, dateFrom, dateTo, onPresetChange, onFromChange, onToChange, onClear }) {
  const inputStyle = {
    background: '#f5f5f8', border: '1px solid #d0d0d6', borderRadius: 7,
    padding: '3px 8px', color: '#1a1a2e', fontSize: 11,
    fontFamily: "'Poppins',sans-serif", outline: 'none', width: 136, height: 26,
  }
  return (
    <div className="flex items-center gap-3 flex-wrap mb-6">
      <div className="flex gap-1.5">
        {PRESETS.map((p) => (
          <button key={p.label} onClick={() => onPresetChange(p.days)}
            className="transition-all cursor-pointer"
            style={{
              padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              fontFamily: "'Poppins',sans-serif",
              background: preset === p.days ? '#2563eb' : '#dcdce0',
              color:      preset === p.days ? '#fff'     : '#505060',
              border:     preset === p.days ? 'none'     : '1px solid #c8c8ce',
            }}>
            {p.label}
          </button>
        ))}
      </div>
      <div style={{ width: 1, height: 20, background: '#d0d0d6' }} />
      <div className="flex items-center gap-2">
        <label className="text-[10px] font-semibold tracking-[1.5px] uppercase shrink-0"
          style={{ color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>From</label>
        <input type="date" value={dateFrom} onChange={(e) => onFromChange(e.target.value)} style={inputStyle} />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-[10px] font-semibold tracking-[1.5px] uppercase shrink-0"
          style={{ color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>To</label>
        <input type="date" value={dateTo} onChange={(e) => onToChange(e.target.value)} style={inputStyle} />
      </div>
      {(dateFrom || dateTo) && (
        <button onClick={onClear}
          style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', height: 26, borderRadius: 7,
            background: '#dcdce0', border: '1px solid #c8c8ce', color: '#505060',
            cursor: 'pointer', fontFamily: "'Poppins',sans-serif" }}>
          Clear
        </button>
      )}
    </div>
  )
}

export default function Dashboard({ state, getAgentStats, getCriteriaFailRates, getReviewerActivity, onNavigate, alerts = [], onOpenAlerts }) {
  const [preset,   setPreset]   = useState(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo,   setDateTo]   = useState('')

  const handlePresetChange = (days) => { setPreset(days); setDateFrom(''); setDateTo('') }
  const handleFromChange   = (val)  => { setDateFrom(val); setPreset(null) }
  const handleToChange     = (val)  => { setDateTo(val);   setPreset(null) }
  const handleClear        = ()     => { setDateFrom(''); setDateTo(''); setPreset(null) }

  const filtered = useMemo(() => {
    return state.reviews.filter((r) => {
      const d = new Date(r.callDate || r.reviewedAt)
      if (preset === 0) return d.toDateString() === new Date().toDateString()
      if (preset !== null && preset !== undefined) return d >= new Date(Date.now() - preset * 86400000)
      if (dateFrom && d < new Date(dateFrom)) return false
      if (dateTo   && d > new Date(dateTo + 'T23:59:59')) return false
      return true
    })
  }, [state.reviews, preset, dateFrom, dateTo])

  const prevPeriod = useMemo(() => {
    if (preset === null || preset === undefined || preset === 0) return null
    const now    = Date.now()
    const cutoff = new Date(now - preset * 86400000)
    const prev   = new Date(now - preset * 2 * 86400000)
    return state.reviews.filter((r) => {
      const d = new Date(r.callDate || r.reviewedAt)
      return d >= prev && d < cutoff
    })
  }, [state.reviews, preset])

  const scored    = filtered.filter((r) => r.result !== 'pending')
  const passes    = scored.filter((r) => r.result === 'pass').length
  const fails     = scored.filter((r) => r.result === 'fail').length
  const passRate  = scored.length ? Math.round((passes / scored.length) * 100) : null
  const failRate  = scored.length ? Math.round((fails  / scored.length) * 100) : null
  const agentCount = [...new Set(filtered.map((r) => r.agentName))].length

  const prevScored   = prevPeriod?.filter((r) => r.result !== 'pending') ?? []
  const prevPasses   = prevScored.filter((r) => r.result === 'pass').length
  const prevPassRate = prevScored.length ? Math.round((prevPasses / prevScored.length) * 100) : null
  const passRateDelta = passRate !== null && prevPassRate !== null ? passRate - prevPassRate : null

  const agentStats = useMemo(() => {
    const stats = {}
    filtered.filter((r) => r.result !== 'pending').forEach((r) => {
      if (!stats[r.agentName]) stats[r.agentName] = { name: r.agentName, total: 0, pass: 0, fail: 0 }
      stats[r.agentName].total++
      if (r.result === 'pass') stats[r.agentName].pass++
      else stats[r.agentName].fail++
    })
    return Object.values(stats)
      .map((s) => ({ ...s, passRate: s.total > 0 ? Math.round((s.pass / s.total) * 100) : 0 }))
      .sort((a, b) => b.passRate - a.passRate).slice(0, 6)
  }, [filtered])

  const attrFails = useMemo(() => {
    const rates = {}
    state.criteria.forEach((c) => (rates[c.id] = { name: c.name, total: 0, fail: 0 }))
    filtered.forEach((r) => {
      Object.entries(r.scores || {}).forEach(([cid, val]) => {
        if (rates[cid] && val !== 'na') { rates[cid].total++; if (val === 'fail') rates[cid].fail++ }
      })
    })
    return Object.values(rates)
      .filter((r) => r.total > 0)
      .map((r) => ({ ...r, failRate: Math.round((r.fail / r.total) * 100) }))
      .sort((a, b) => b.failRate - a.failRate)
  }, [filtered, state.criteria])

  const reviewerActivity = useMemo(() => {
    const r = {}
    filtered.forEach((rev) => {
      if (!rev.reviewer) return
      if (!r[rev.reviewer]) r[rev.reviewer] = { name: rev.reviewer, total: 0, pass: 0, fail: 0 }
      r[rev.reviewer].total++
      if (rev.result === 'pass') r[rev.reviewer].pass++
      if (rev.result === 'fail') r[rev.reviewer].fail++
    })
    return Object.values(r).sort((a, b) => b.total - a.total)
  }, [filtered])

  const recent       = filtered.slice(0, 5)
  const passColor    = passRate === null ? '#1a1a2e' : passRate >= 60 ? '#16a34a' : '#e11d48'
  const failColor    = failRate === null ? '#1a1a2e' : failRate > 40  ? '#e11d48' : '#d97706'
  const periodLabel  = preset === 0 ? 'today' : preset === 7 ? 'last 7 days' : preset === 30 ? 'last 30 days' : dateFrom || dateTo ? 'selected period' : 'all time'
  const criticalAlerts = alerts.filter((a) => a.level === 'critical')
  const warningAlerts  = alerts.filter((a) => a.level === 'warning')

  return (
    <div className="p-7 animate-fadeIn">

      {/* Greeting */}
      <div className="mb-5">
        <h2 className="font-bold text-[20px] mb-1" style={{ color: '#1a1a2e', fontFamily: "'Poppins',sans-serif" }}>
          {GREETING}
        </h2>
        <p className="text-[13px]" style={{ color: '#8888a0' }}>
          Showing data for <span className="font-semibold" style={{ color: '#2563eb' }}>{periodLabel}</span>
          {filtered.length !== state.reviews.length && (
            <span> — {filtered.length} of {state.reviews.length} reviews</span>
          )}
        </p>
      </div>

      {/* Alert strip */}
      {alerts.length > 0 && (
        <div
          onClick={onOpenAlerts}
          className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5 cursor-pointer hover:opacity-80 transition-all"
          style={{
            background:   criticalAlerts.length > 0 ? '#fde8ec' : '#fef3d8',
            border:       `1px solid ${criticalAlerts.length > 0 ? '#f8c0cc' : '#f8dca0'}`,
          }}
        >
          <div className="w-2 h-2 rounded-full animate-pulse shrink-0"
            style={{ background: criticalAlerts.length > 0 ? '#e11d48' : '#d97706' }} />
          <span className="text-[13px] font-semibold flex-1"
            style={{ color: criticalAlerts.length > 0 ? '#e11d48' : '#d97706', fontFamily: "'Poppins',sans-serif" }}>
            {criticalAlerts.length > 0
              ? `${criticalAlerts.length} critical alert${criticalAlerts.length > 1 ? 's' : ''} — immediate attention needed`
              : `${warningAlerts.length} performance warning${warningAlerts.length > 1 ? 's' : ''} — review agent scores`}
          </span>
          <span className="text-[12px] font-semibold"
            style={{ color: criticalAlerts.length > 0 ? '#e11d48' : '#d97706', fontFamily: "'Poppins',sans-serif" }}>
            View all →
          </span>
        </div>
      )}

      {/* Date filter */}
      <DateRangeFilter
        preset={preset} dateFrom={dateFrom} dateTo={dateTo}
        onPresetChange={handlePresetChange}
        onFromChange={handleFromChange}
        onToChange={handleToChange}
        onClear={handleClear}
      />

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KPICard label="Total Reviews"  value={filtered.length}                                     accentColor="#2563eb" delta={`${filtered.length} in period`} deltaNeutral />
        <KPICard label="Pass Rate"      value={passRate !== null ? passRate + '%' : '—'}             accentColor="#16a34a" valueColor={passColor}
          delta={passRateDelta !== null ? `${Math.abs(passRateDelta)}% vs prev period` : passRate !== null ? 'vs prev period —' : null}
          deltaUp={passRateDelta !== null ? passRateDelta >= 0 : undefined}
          deltaNeutral={passRateDelta === null} />
        <KPICard label="Fail Rate"      value={failRate !== null ? failRate + '%' : '—'}             accentColor="#e11d48" valueColor={failColor} />
        <KPICard label="Active Agents"  value={agentCount}                                           accentColor="#d97706" valueColor="#d97706"
          delta={agentCount > 0 ? `${agentCount} agent${agentCount !== 1 ? 's' : ''} reviewed` : null} deltaNeutral />
      </div>

      {/* Team trend chart */}
      <Panel className="mb-5">
        <PanelHeader
          title="Team Pass Rate — Weekly Trend"
          action={
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
              style={{ background: '#e8f0ff', color: '#2563eb', border: '1px solid #c8d4f0', fontFamily: "'Poppins',sans-serif" }}>
              All agents
            </span>
          }
        />
        <div className="p-5">
          <TrendChart reviews={state.reviews} height={200} label="Team Pass Rate" />
        </div>
      </Panel>

      {/* Top agents + Recurring issues */}
      <div className="grid grid-cols-2 gap-5 mb-5">
        <Panel>
          <PanelHeader title="Top Agents — Pass Rate" />
          <div className="p-5">
            {agentStats.length === 0
              ? <EmptyState icon="👤" sub="No reviews in this period" />
              : <div className="flex flex-col gap-3.5">
                  {agentStats.map((a) => {
                    const c = a.passRate >= 70 ? '#16a34a' : a.passRate >= 60 ? '#d97706' : '#e11d48'
                    const hasAlert = alerts.some((al) => al.agent === a.name)
                    return (
                      <div key={a.name} className="flex items-center gap-3">
                        <AgentAvatar name={a.name} size={32} />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-[13px] font-semibold truncate" style={{ color: '#1a1a2e' }}>{a.name}</span>
                              {hasAlert && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white shrink-0"
                                  style={{ background: alerts.find((al) => al.agent === a.name && al.level === 'critical') ? '#e11d48' : '#d97706' }}>
                                  !
                                </span>
                              )}
                            </div>
                            <span className="text-[13px] font-bold ml-2 shrink-0"
                              style={{ color: c, fontFamily: "'Poppins',sans-serif" }}>{a.passRate}%</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#dcdce0' }}>
                            <div className="h-full rounded-full score-bar-fill" style={{ width: `${a.passRate}%`, background: c }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
            }
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Recurring Issues"
            action={
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                style={{ background: '#fde8ec', color: '#e11d48', border: '1px solid #f8c0cc', fontFamily: "'Poppins',sans-serif" }}>
                Top failures
              </span>
            }
          />
          <div className="p-5">
            {attrFails.length === 0
              ? <EmptyState icon="📋" sub="No scored criteria in this period" />
              : <div className="flex flex-col gap-3">
                  {attrFails.map((a, i) => (
                    <div key={a.name} className="flex items-center gap-3">
                      <div className="w-[22px] h-[22px] rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{ background: '#dcdce0', color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>{i + 1}</div>
                      <AttrBar name={a.name} pct={a.failRate} />
                    </div>
                  ))}
                </div>
            }
          </div>
        </Panel>
      </div>

      {/* Recent Reviews */}
      <Panel className="mb-5">
        <PanelHeader title="Recent Reviews"
          action={
            <button onClick={() => onNavigate('calls')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all hover:opacity-80"
              style={{ background: '#e2e2e6', color: '#505060', border: '1px solid #c8c8ce', fontFamily: "'Poppins',sans-serif" }}>
              View All
            </button>
          }
        />
        {recent.length === 0
          ? <EmptyState icon="🎧" title="No reviews in this period" sub="Try a wider date range" />
          : <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Agent', 'Date', 'Reviewer', 'Result'].map((h) => (
                    <th key={h} className="text-left text-[11px] font-semibold tracking-wide uppercase px-4 py-3"
                      style={{ color: '#8888a0', borderBottom: '1px solid #dcdce0', background: '#efeff2', fontFamily: "'Poppins',sans-serif" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id} className="cursor-pointer transition-colors hover:bg-surface2 last:border-0"
                    style={{ borderBottom: '1px solid #e4e4e8' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <AgentAvatar name={r.agentName} size={28} />
                        <span className="font-semibold text-[13px]" style={{ color: '#1a1a2e' }}>{r.agentName}</span>
                        {r.agentId && <Tag>{r.agentId}</Tag>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#505060' }}>{r.callDate}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#505060' }}>{r.reviewer}</td>
                    <td className="px-4 py-3"><Badge result={r.result} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </Panel>

      {/* Reviewer Activity */}
      <Panel>
        <PanelHeader title="Reviewer Activity" />
        {reviewerActivity.length === 0
          ? <EmptyState icon="👤" sub="No activity in this period" />
          : <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Reviewer', 'Reviews Done', 'Pass', 'Fail'].map((h) => (
                    <th key={h} className="text-left text-[11px] font-semibold tracking-wide uppercase px-4 py-3"
                      style={{ color: '#8888a0', borderBottom: '1px solid #dcdce0', background: '#efeff2', fontFamily: "'Poppins',sans-serif" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reviewerActivity.map((r) => (
                  <tr key={r.name} className="transition-colors hover:bg-surface2"
                    style={{ borderBottom: '1px solid #e4e4e8' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <AgentAvatar name={r.name} size={28} />
                        <span className="font-semibold text-[13px]" style={{ color: '#1a1a2e' }}>{r.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Tag>{r.total}</Tag></td>
                    <td className="px-4 py-3 font-semibold text-[13px]" style={{ color: '#16a34a' }}>{r.pass}</td>
                    <td className="px-4 py-3 font-semibold text-[13px]" style={{ color: '#e11d48' }}>{r.fail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </Panel>
    </div>
  )
}
