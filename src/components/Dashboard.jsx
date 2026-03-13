import { Badge, EmptyState, Panel, PanelHeader, ScoreBar, AttrBar, Tag } from './ui'

const STAT_ACCENTS = ['from-accent', 'from-pass', 'from-fail', 'from-accent4']

function StatCard({ label, value, color, accent }) {
  return (
    <div className={`bg-surface border border-border rounded-xl p-5 relative overflow-hidden`}>
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${accent} to-transparent`} />
      <div className="font-mono text-[11px] tracking-widest uppercase text-txt3 mb-2.5">{label}</div>
      <div className="font-syne font-extrabold text-[32px] leading-none" style={color ? { color } : {}}>
        {value}
      </div>
    </div>
  )
}

export default function Dashboard({ state, getAgentStats, getCriteriaFailRates, getReviewerActivity, onNavigate, onNewReview }) {
  const reviews = state.reviews
  const scored = reviews.filter((r) => r.result !== 'pending')
  const passes = scored.filter((r) => r.result === 'pass').length
  const fails = scored.filter((r) => r.result === 'fail').length
  const passRate = scored.length ? Math.round((passes / scored.length) * 100) : null
  const failRate = scored.length ? Math.round((fails / scored.length) * 100) : null
  const agentCount = [...new Set(reviews.map((r) => r.agentName))].length

  const agentStats = Object.values(getAgentStats()).sort((a, b) => b.passRate - a.passRate).slice(0, 6)
  const attrFails = getCriteriaFailRates()
  const recent = reviews.slice(0, 5)
  const reviewerActivity = getReviewerActivity()

  return (
    <div className="p-8 animate-fadeIn">
      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4 mb-7">
        <StatCard label="Total Reviews" value={reviews.length} accent={STAT_ACCENTS[0]} />
        <StatCard label="Pass Rate" value={passRate !== null ? passRate + '%' : '—'} color="#00d4aa" accent={STAT_ACCENTS[1]} />
        <StatCard label="Fail Rate" value={failRate !== null ? failRate + '%' : '—'} color="#ff6b6b" accent={STAT_ACCENTS[2]} />
        <StatCard label="Active Agents" value={agentCount} color="#ffa94d" accent={STAT_ACCENTS[3]} />
      </div>

      {/* Two-col */}
      <div className="grid grid-cols-2 gap-5 mb-5">
        <Panel>
          <PanelHeader title="🏆 Top Agents — Pass Rate" />
          <div className="p-5">
            {agentStats.length === 0
              ? <EmptyState icon="👤" sub="No reviews yet" />
              : <div className="flex flex-col gap-3">{agentStats.map((a) => (
                  <div key={a.name} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-txt2">{a.name}</span>
                      <span className="font-mono" style={{ color: a.passRate >= 70 ? '#00d4aa' : '#ff6b6b' }}>{a.passRate}%</span>
                    </div>
                    <div className="h-1.5 bg-surface3 rounded-full overflow-hidden">
                      <div className="h-full rounded-full score-bar-fill" style={{ width: `${a.passRate}%`, background: a.passRate >= 70 ? '#00d4aa' : '#ff6b6b' }} />
                    </div>
                  </div>
                ))}</div>
            }
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="⚠️ Failed Criteria Breakdown" />
          <div className="p-5">
            {attrFails.length === 0
              ? <EmptyState icon="📋" sub="No scored criteria yet" />
              : <div className="flex flex-col gap-3">{attrFails.map((a) => (
                  <AttrBar key={a.name} name={a.name} pct={a.failRate} />
                ))}</div>
            }
          </div>
        </Panel>
      </div>

      {/* Recent Reviews */}
      <Panel className="mb-5">
        <PanelHeader
          title="📅 Recent Reviews"
          action={
            <button onClick={() => onNavigate('calls')} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface2 text-txt2 border border-border hover:text-txt hover:bg-surface3 cursor-pointer transition-all">
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
                    <th key={h} className="text-left font-mono text-[10px] tracking-widest uppercase text-txt3 px-4 py-2.5 border-b border-border bg-surface2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-white/[0.02] cursor-pointer transition-colors last:border-0">
                    <td className="px-4 py-3 font-medium text-[13.5px]">
                      {r.agentName} {r.agentId && <Tag>{r.agentId}</Tag>}
                    </td>
                    <td className="px-4 py-3 text-txt2 text-[13.5px]">{r.callDate}</td>
                    <td className="px-4 py-3 text-txt2 text-[13.5px]">{r.reviewer}</td>
                    <td className="px-4 py-3"><Badge result={r.result} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </Panel>

      {/* Reviewer Activity */}
      <Panel>
        <PanelHeader title="👥 Reviewer Activity" />
        {reviewerActivity.length === 0
          ? <EmptyState icon="👤" sub="No activity yet" />
          : <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Reviewer', 'Reviews Done', 'Pass', 'Fail'].map((h) => (
                    <th key={h} className="text-left font-mono text-[10px] tracking-widest uppercase text-txt3 px-4 py-2.5 border-b border-border bg-surface2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reviewerActivity.map((r) => (
                  <tr key={r.name} className="border-b border-border/50 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-semibold text-[13.5px]">{r.name}</td>
                    <td className="px-4 py-3"><Tag>{r.total}</Tag></td>
                    <td className="px-4 py-3 text-pass font-mono text-sm">{r.pass}</td>
                    <td className="px-4 py-3 text-fail font-mono text-sm">{r.fail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </Panel>
    </div>
  )
}
