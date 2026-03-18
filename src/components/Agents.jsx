import { useState, useMemo } from 'react'
import { EmptyState, Modal, Badge } from './ui'

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

function StatPill({ label, value, color }) {
  return (
    <div className="flex flex-col items-center px-5 py-3.5 bg-surface2 border border-border rounded-xl">
      <span className="font-syne font-extrabold text-[26px] leading-none mb-1" style={color ? { color } : {}}>
        {value}
      </span>
      <span className="font-mono text-[10px] tracking-widest uppercase text-txt3">{label}</span>
    </div>
  )
}

function ScorecardModal({ agent, state, onClose }) {
  const [rangeDays, setRangeDays] = useState(30)

  const agentReviews = useMemo(() => {
    if (!agent) return []
    const cutoff = rangeDays
      ? new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000)
      : null
    return state.reviews.filter((r) => {
      if (r.agentName !== agent.name) return false
      if (cutoff) {
        const d = new Date(r.callDate || r.reviewedAt)
        if (d < cutoff) return false
      }
      return true
    })
  }, [agent, state.reviews, rangeDays])

  const scored = agentReviews.filter((r) => r.result !== 'pending')
  const passes = scored.filter((r) => r.result === 'pass').length
  const fails  = scored.filter((r) => r.result === 'fail').length
  const passRate = scored.length ? Math.round((passes / scored.length) * 100) : null

  // Most common mistakes: criteria with highest fail % within this date range
  const mistakeMap = useMemo(() => {
    const map = {}
    state.criteria.forEach((c) => {
      map[c.id] = { name: c.name, cat: c.cat, total: 0, fail: 0 }
    })
    agentReviews.forEach((r) => {
      Object.entries(r.scores || {}).forEach(([cid, val]) => {
        if (!map[cid]) return
        if (val === 'na') return
        map[cid].total++
        if (val === 'fail') map[cid].fail++
      })
    })
    return Object.values(map)
      .filter((m) => m.total > 0)
      .map((m) => ({ ...m, failRate: Math.round((m.fail / m.total) * 100) }))
      .sort((a, b) => b.failRate - a.failRate)
  }, [agentReviews, state.criteria])

  const mistakes = mistakeMap.filter((m) => m.failRate > 0)
  const strengths = mistakeMap.filter((m) => m.failRate === 0)

  const initials = agent
    ? agent.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : ''

  const gradientIndex = agent
    ? [...agent.name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % GRADIENTS.length
    : 0

  if (!agent) return null

  return (
    <Modal
      open
      onClose={onClose}
      title=""
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 -mt-2">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${GRADIENTS[gradientIndex]} grid place-items-center font-bold text-lg text-white shrink-0`}>
          {initials}
        </div>
        <div className="flex-1">
          <div className="font-syne font-extrabold text-[20px]">{agent.name}</div>
          <div className="font-mono text-[11px] text-txt3">{agent.id || 'No ID'} · Agent Scorecard</div>
        </div>
        {passRate !== null && (
          <div className="text-right">
            <div
              className="font-syne font-extrabold text-[32px] leading-none"
              style={{ color: passRate >= 60 ? '#00d4aa' : '#ff6b6b' }}
            >
              {passRate}%
            </div>
            <div className="font-mono text-[10px] text-txt3 uppercase tracking-widest">Pass Rate</div>
          </div>
        )}
      </div>

      {/* Date Range Filter */}
      <div className="flex gap-1.5 flex-wrap mb-5">
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

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <StatPill label="Total Calls" value={agentReviews.length} />
        <StatPill label="Scored" value={scored.length} />
        <StatPill label="Passed" value={passes} color="#00d4aa" />
        <StatPill label="Failed" value={fails} color="#ff6b6b" />
      </div>

      {agentReviews.length === 0 ? (
        <div className="text-center py-8 text-txt3 text-sm">No reviews found for this period.</div>
      ) : (
        <>
          {/* Pass Rate Bar */}
          {passRate !== null && (
            <div className="mb-6">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-txt3 font-mono uppercase tracking-widest text-[10px]">Overall Score</span>
                <span className="font-mono font-bold" style={{ color: passRate >= 60 ? '#00d4aa' : '#ff6b6b' }}>
                  {passRate}% — {passRate >= 60 ? '✓ Passing' : '✗ Below threshold'}
                </span>
              </div>
              <div className="h-2 bg-surface3 rounded-full overflow-hidden relative">
                <div
                  className="h-full rounded-full score-bar-fill"
                  style={{ width: `${passRate}%`, background: passRate >= 60 ? '#00d4aa' : '#ff6b6b' }}
                />
                <div className="absolute top-0 bottom-0 w-px bg-txt3/50" style={{ left: '60%' }} />
              </div>
              <div className="flex justify-end mt-1">
                <span className="font-mono text-[10px] text-txt3">Pass threshold: 60%</span>
              </div>
            </div>
          )}

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
                        <span
                          className="font-mono text-xs font-bold min-w-[40px] text-right"
                          style={{ color: m.failRate > 50 ? '#ff6b6b' : '#ffa94d' }}
                        >
                          {m.failRate}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-surface3 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full score-bar-fill"
                        style={{
                          width: `${m.failRate}%`,
                          background: m.failRate > 50 ? '#ff6b6b' : '#ffa94d',
                        }}
                      />
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
  const initials = agent.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
  const isGood = agent.passRate >= 60

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
        <span className="font-mono text-[10px] text-txt3 border border-border rounded px-1.5 py-0.5 bg-surface2">
          View →
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-txt3">Pass Rate</span>
          <span className="font-mono font-medium" style={{ color: isGood ? '#00d4aa' : '#ff6b6b' }}>{agent.passRate}%</span>
        </div>
        <div className="h-1 bg-surface3 rounded-full overflow-hidden mb-1">
          <div className="h-full rounded-full score-bar-fill" style={{ width: `${agent.passRate}%`, background: isGood ? '#00d4aa' : '#ff6b6b' }} />
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
  const agents = Object.values(getAgentStats()).sort((a, b) => b.passRate - a.passRate)

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
          <AgentCard
            key={a.name}
            agent={a}
            index={i}
            onClick={() => setSelectedAgent(a)}
          />
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
