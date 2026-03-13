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

export default function Reports({ state, getAgentStats, getCriteriaFailRates, getReviewerActivity }) {
  const reviews = state.reviews
  const scored = reviews.filter((r) => r.result !== 'pending')
  const passes = scored.filter((r) => r.result === 'pass').length
  const fails = scored.filter((r) => r.result === 'fail').length
  const passRate = scored.length ? Math.round((passes / scored.length) * 100) : null
  const failRate = scored.length ? Math.round((fails / scored.length) * 100) : null

  const agentStats = Object.values(getAgentStats()).sort((a, b) => b.passRate - a.passRate)
  const attrFails = getCriteriaFailRates()
  const reviewerActivity = getReviewerActivity()

  return (
    <div className="p-8 animate-fadeIn">
      <div className="grid grid-cols-3 gap-4 mb-7">
        <StatCard label="Total Calls" value={reviews.length} accent="from-accent" />
        <StatCard label="Pass Rate" value={passRate !== null ? passRate + '%' : '—'} color="#00d4aa" accent="from-pass" />
        <StatCard label="Fail Rate" value={failRate !== null ? failRate + '%' : '—'} color="#ff6b6b" accent="from-fail" />
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5">
        <Panel>
          <PanelHeader title="📊 Agent Performance" />
          {agentStats.length === 0
            ? <EmptyState icon="👥" sub="No data" />
            : <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {['Agent', 'Total', 'Pass%', 'Status'].map((h) => (
                      <th key={h} className="text-left font-mono text-[10px] tracking-widest uppercase text-txt3 px-4 py-2.5 border-b border-border bg-surface2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {agentStats.map((a) => (
                    <tr key={a.name} className="border-b border-border/50 last:border-0 hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-semibold text-[13.5px]">{a.name}</td>
                      <td className="px-4 py-3 text-sm">{a.total}</td>
                      <td className="px-4 py-3 font-mono text-sm" style={{ color: a.passRate >= 70 ? '#00d4aa' : '#ff6b6b' }}>{a.passRate}%</td>
                      <td className="px-4 py-3"><Badge result={a.passRate >= 70 ? 'pass' : 'fail'} /></td>
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
                <tr>
                  {['Reviewer', 'Total Reviews', 'Pass', 'Fail', 'Pending'].map((h) => (
                    <th key={h} className="text-left font-mono text-[10px] tracking-widest uppercase text-txt3 px-4 py-2.5 border-b border-border bg-surface2">{h}</th>
                  ))}
                </tr>
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
