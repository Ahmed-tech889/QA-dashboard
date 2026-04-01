import { Badge, EmptyState, Panel, PanelHeader, AttrBar, Tag, AgentAvatar } from './ui'

const HOUR = new Date().getHours()
const GREETING = HOUR < 12 ? 'Good morning' : HOUR < 17 ? 'Good afternoon' : 'Good evening'

function KPICard({ label, value, valueColor, accentColor, delta, deltaUp }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 relative overflow-hidden card-hover"
      style={{ boxShadow: '0 1px 4px rgba(37,99,235,0.04)' }}>
      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl" style={{ background: accentColor }} />
      <div className="text-[11px] font-semibold tracking-[0.8px] uppercase text-txt3 mb-3"
        style={{ fontFamily: "'Poppins',sans-serif" }}>{label}</div>
      <div className="font-bold text-[30px] leading-none mb-2" style={{ color: valueColor || '#1a2540', fontFamily: "'Poppins',sans-serif" }}>
        {value}
      </div>
      {delta && (
        <div className="text-[12px] font-medium flex items-center gap-1"
          style={{ color: deltaUp ? '#16a34a' : '#e11d48', fontFamily: "'Poppins',sans-serif" }}>
          <span>{deltaUp ? '↑' : '↓'}</span>{delta}
        </div>
      )}
    </div>
  )
}

export default function Dashboard({ state, getAgentStats, getCriteriaFailRates, getReviewerActivity, onNavigate }) {
  const reviews     = state.reviews
  const scored      = reviews.filter((r) => r.result !== 'pending')
  const passes      = scored.filter((r) => r.result === 'pass').length
  const fails       = scored.filter((r) => r.result === 'fail').length
  const passRate    = scored.length ? Math.round((passes / scored.length) * 100) : null
  const failRate    = scored.length ? Math.round((fails  / scored.length) * 100) : null
  const agentCount  = [...new Set(reviews.map((r) => r.agentName))].length
  const agentStats  = Object.values(getAgentStats()).sort((a, b) => b.passRate - a.passRate).slice(0, 6)
  const attrFails   = getCriteriaFailRates()
  const recent      = reviews.slice(0, 5)
  const reviewerActivity = getReviewerActivity()

  const passColor = passRate === null ? '#1a2540' : passRate >= 60 ? '#16a34a' : '#e11d48'
  const failColor = failRate === null ? '#1a2540' : failRate > 40  ? '#e11d48' : '#d97706'

  return (
    <div className="p-7 animate-fadeIn">
      {/* Greeting */}
      <div className="mb-6">
        <h2 className="font-bold text-[20px] text-txt mb-1" style={{ fontFamily: "'Poppins',sans-serif" }}>
          {GREETING}
        </h2>
        <p className="text-[13px] text-txt3">Here's your QA performance overview</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KPICard label="Total Reviews"  value={reviews.length} accentColor="#2563eb" />
        <KPICard label="Pass Rate"      value={passRate !== null ? passRate + '%' : '—'} valueColor={passColor} accentColor="#16a34a" deltaUp />
        <KPICard label="Fail Rate"      value={failRate !== null ? failRate + '%' : '—'} valueColor={failColor} accentColor="#e11d48" />
        <KPICard label="Active Agents"  value={agentCount} accentColor="#d97706" valueColor="#d97706" />
      </div>

      {/* Top agents + Recurring issues */}
      <div className="grid grid-cols-2 gap-5 mb-5">
        <Panel>
          <PanelHeader title="Top Agents — Pass Rate" />
          <div className="p-5">
            {agentStats.length === 0
              ? <EmptyState icon="👤" sub="No reviews yet" />
              : <div className="flex flex-col gap-3.5">
                  {agentStats.map((a) => {
                    const color = a.passRate >= 70 ? '#16a34a' : a.passRate >= 60 ? '#d97706' : '#e11d48'
                    return (
                      <div key={a.name} className="flex items-center gap-3">
                        <AgentAvatar name={a.name} size={32} />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[13px] font-semibold text-txt truncate">{a.name}</span>
                            <span className="text-[13px] font-bold ml-2 shrink-0" style={{ color, fontFamily: "'Poppins',sans-serif" }}>{a.passRate}%</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#eef2f8' }}>
                            <div className="h-full rounded-full score-bar-fill" style={{ width: `${a.passRate}%`, background: color }} />
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
          <PanelHeader title="Recurring Issues" action={
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
              style={{ background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', fontFamily: "'Poppins',sans-serif" }}>
              Top failures
            </span>
          } />
          <div className="p-5">
            {attrFails.length === 0
              ? <EmptyState icon="📋" sub="No scored criteria yet" />
              : <div className="flex flex-col gap-3">
                  {attrFails.map((a, i) => (
                    <div key={a.name} className="flex items-center gap-3">
                      <div className="w-[22px] h-[22px] rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{ background: '#f0f4fa', color: '#5a6a85', fontFamily: "'Poppins',sans-serif" }}>
                        {i + 1}
                      </div>
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
        <PanelHeader
          title="Recent Reviews"
          action={
            <button onClick={() => onNavigate('calls')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all"
              style={{ background: '#f0f4fa', color: '#5a6a85', border: '1px solid #e8edf5', fontFamily: "'Poppins',sans-serif" }}>
              View All
            </button>
          }
        />
        {recent.length === 0
          ? <EmptyState icon="🎧" title="No reviews yet" sub="Start by reviewing a call" />
          : <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Agent', 'Date', 'Reviewer', 'Result'].map((h) => (
                    <th key={h} className="text-left text-[11px] font-semibold tracking-wide uppercase text-txt3 px-4 py-3 border-b border-border"
                      style={{ background: '#f8fafd', fontFamily: "'Poppins',sans-serif" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface2 cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <AgentAvatar name={r.agentName} size={28} />
                        <span className="font-semibold text-[13px] text-txt">{r.agentName}</span>
                        {r.agentId && <Tag>{r.agentId}</Tag>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-txt2 text-[13px]">{r.callDate}</td>
                    <td className="px-4 py-3 text-txt2 text-[13px]">{r.reviewer}</td>
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
          ? <EmptyState icon="👤" sub="No activity yet" />
          : <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Reviewer', 'Reviews Done', 'Pass', 'Fail'].map((h) => (
                    <th key={h} className="text-left text-[11px] font-semibold tracking-wide uppercase text-txt3 px-4 py-3 border-b border-border"
                      style={{ background: '#f8fafd', fontFamily: "'Poppins',sans-serif" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reviewerActivity.map((r) => (
                  <tr key={r.name} className="border-b border-border last:border-0 hover:bg-surface2 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <AgentAvatar name={r.name} size={28} />
                        <span className="font-semibold text-[13px] text-txt">{r.name}</span>
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
