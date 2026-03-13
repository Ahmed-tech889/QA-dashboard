import { EmptyState } from './ui'

const GRADIENTS = [
  'from-[#6c63ff] to-[#a78bfa]',
  'from-[#00d4aa] to-[#4ade80]',
  'from-[#ff6b6b] to-[#fb923c]',
  'from-[#ffa94d] to-[#fbbf24]',
  'from-[#38bdf8] to-[#818cf8]',
  'from-[#e879f9] to-[#a855f7]',
]

function AgentCard({ agent, index }) {
  const initials = agent.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
  const isGood = agent.passRate >= 70

  return (
    <div className="bg-surface border border-border rounded-xl p-5 cursor-pointer hover:border-accent/40 hover:-translate-y-0.5 hover:shadow-2xl transition-all duration-200">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${GRADIENTS[index % GRADIENTS.length]} grid place-items-center font-bold text-sm text-white shrink-0`}>
          {initials}
        </div>
        <div>
          <div className="font-syne font-bold text-sm">{agent.name}</div>
          <div className="font-mono text-[10px] text-txt3">{agent.id || 'No ID'}</div>
        </div>
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

export default function Agents({ getAgentStats }) {
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
        {agents.map((a, i) => <AgentCard key={a.name} agent={a} index={i} />)}
      </div>
    </div>
  )
}
