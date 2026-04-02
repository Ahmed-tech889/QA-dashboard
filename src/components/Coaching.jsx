import { useState, useMemo } from 'react'
import { EmptyState, Panel, PanelHeader, Badge, Btn, Modal, Field } from './ui'
import { emitToast } from './ui'

const STATUS_STYLES = {
  planned:     { bg: '#e8f0ff', border: '#c8d4f0', color: '#2563eb',  label: 'Planned' },
  'in-progress': { bg: '#fef3d8', border: '#f8dca0', color: '#d97706',  label: 'In Progress' },
  completed:   { bg: '#e6f9ee', border: '#a8ecc0', color: '#16a34a',  label: 'Completed' },
}

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.planned
  return (
    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, fontFamily: "'Poppins',sans-serif" }}>
      {s.label}
    </span>
  )
}

function SessionModal({ session, agents, criteria, onSave, onClose }) {
  const isEdit = !!session
  const [agentName,   setAgentName]   = useState(session?.agentName   || '')
  const [date,        setDate]        = useState(session?.date         || new Date().toISOString().split('T')[0])
  const [notes,       setNotes]       = useState(session?.notes        || '')
  const [focusCrits,  setFocusCrits]  = useState(session?.focusCriteria || [])
  const [status,      setStatus]      = useState(session?.status       || 'planned')
  const [outcome,     setOutcome]     = useState(session?.outcome      || '')

  const toggleCrit = (id) => setFocusCrits((prev) =>
    prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
  )

  const handleSave = () => {
    if (!agentName.trim()) { emitToast('Please select an agent', 'error'); return }
    if (!date)             { emitToast('Please set a session date', 'error'); return }
    onSave({ agentName: agentName.trim(), date, notes, focusCriteria: focusCrits, status, outcome })
  }

  const inputStyle = {
    background: '#f5f5f8', border: '1px solid #d0d0d6', borderRadius: 8,
    padding: '8px 12px', color: '#1a1a2e', fontSize: 13,
    fontFamily: "'Poppins',sans-serif", outline: 'none', width: '100%',
  }

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Edit Coaching Session' : 'Log Coaching Session'}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={handleSave}>{isEdit ? 'Save Changes' : 'Log Session'}</Btn>
        </>
      }>

      <div className="flex flex-col gap-4">
        {/* Agent */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', color: '#8888a0', fontFamily: "'Poppins',sans-serif", display: 'block', marginBottom: 6 }}>
            Agent
          </label>
          {agents.length > 0 ? (
            <select value={agentName} onChange={(e) => setAgentName(e.target.value)} style={inputStyle}>
              <option value="">— Select agent —</option>
              {agents.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          ) : (
            <input value={agentName} onChange={(e) => setAgentName(e.target.value)}
              placeholder="Agent name" style={inputStyle} />
          )}
        </div>

        {/* Date + Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', color: '#8888a0', fontFamily: "'Poppins',sans-serif", display: 'block', marginBottom: 6 }}>
              Session Date
            </label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', color: '#8888a0', fontFamily: "'Poppins',sans-serif", display: 'block', marginBottom: 6 }}>
              Status
            </label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
              <option value="planned">Planned</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Focus criteria */}
        {criteria.length > 0 && (
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', color: '#8888a0', fontFamily: "'Poppins',sans-serif", display: 'block', marginBottom: 8 }}>
              Focus Criteria (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {criteria.map((c) => {
                const selected = focusCrits.includes(c.id)
                return (
                  <button key={c.id} onClick={() => toggleCrit(c.id)}
                    className="px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition-all"
                    style={{
                      background:  selected ? '#2563eb' : '#ebebee',
                      color:       selected ? '#fff'    : '#505060',
                      border:      `1px solid ${selected ? '#2563eb' : '#d0d0d6'}`,
                      fontFamily:  "'Poppins',sans-serif",
                    }}>
                    {c.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', color: '#8888a0', fontFamily: "'Poppins',sans-serif", display: 'block', marginBottom: 6 }}>
            Session Notes
          </label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="What was covered in this session..."
            style={{ ...inputStyle, minHeight: 90, resize: 'vertical', lineHeight: 1.6 }} />
        </div>

        {/* Outcome — only for completed */}
        {status === 'completed' && (
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', color: '#8888a0', fontFamily: "'Poppins',sans-serif", display: 'block', marginBottom: 6 }}>
              Outcome / Result
            </label>
            <textarea value={outcome} onChange={(e) => setOutcome(e.target.value)}
              placeholder="Did performance improve? Key takeaways..."
              style={{ ...inputStyle, minHeight: 70, resize: 'vertical', lineHeight: 1.6 }} />
          </div>
        )}
      </div>
    </Modal>
  )
}

export default function Coaching({ state, addCoachingSession, updateCoachingSession, deleteCoachingSession }) {
  const [modalOpen,    setModalOpen]    = useState(false)
  const [editSession,  setEditSession]  = useState(null)
  const [filterAgent,  setFilterAgent]  = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const agents = useMemo(() =>
    [...new Set(state.reviews.map((r) => r.agentName))].filter(Boolean).sort(),
    [state.reviews]
  )

  const sessions = useMemo(() => {
    return (state.coachingSessions || [])
      .filter((s) => {
        if (filterAgent  && s.agentName !== filterAgent)  return false
        if (filterStatus && s.status    !== filterStatus)  return false
        return true
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [state.coachingSessions, filterAgent, filterStatus])

  const stats = useMemo(() => {
    const all = state.coachingSessions || []
    return {
      total:      all.length,
      planned:    all.filter((s) => s.status === 'planned').length,
      inProgress: all.filter((s) => s.status === 'in-progress').length,
      completed:  all.filter((s) => s.status === 'completed').length,
    }
  }, [state.coachingSessions])

  const handleSave = (data) => {
    if (editSession) {
      updateCoachingSession(editSession.id, data)
      emitToast('Session updated ✓')
    } else {
      addCoachingSession(data)
      emitToast('Coaching session logged ✓')
    }
    setModalOpen(false)
    setEditSession(null)
  }

  const handleEdit = (session) => {
    setEditSession(session)
    setModalOpen(true)
  }

  const handleDelete = (id) => {
    deleteCoachingSession(id)
    emitToast('Session removed')
  }

  const selectStyle = {
    background: '#f5f5f8', border: '1px solid #d0d0d6', borderRadius: 8,
    padding: '6px 10px', color: '#1a1a2e', fontSize: 12,
    fontFamily: "'Poppins',sans-serif", outline: 'none', height: 32,
  }

  return (
    <div className="p-7 animate-fadeIn">

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          ['Total Sessions', stats.total,      '#2563eb'],
          ['Planned',        stats.planned,    '#2563eb'],
          ['In Progress',    stats.inProgress, '#d97706'],
          ['Completed',      stats.completed,  '#16a34a'],
        ].map(([label, value, color]) => (
          <div key={label} className="rounded-2xl p-5 relative overflow-hidden"
            style={{ background: '#f5f5f8', border: '1px solid #d0d0d6', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl" style={{ background: color }} />
            <div className="text-[10px] font-semibold tracking-[0.8px] uppercase mb-2"
              style={{ color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>{label}</div>
            <div className="font-bold text-[28px]" style={{ color, fontFamily: "'Poppins',sans-serif" }}>{value}</div>
          </div>
        ))}
      </div>

      <Panel>
        <PanelHeader
          title="Coaching Sessions"
          action={
            <div className="flex items-center gap-2">
              <select value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)} style={{ ...selectStyle, width: 160 }}>
                <option value="">All Agents</option>
                {agents.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ ...selectStyle, width: 140 }}>
                <option value="">All Status</option>
                <option value="planned">Planned</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <button
                onClick={() => { setEditSession(null); setModalOpen(true) }}
                className="hover:opacity-80 transition-all"
                style={{
                  padding: '6px 14px', height: 32, borderRadius: 8,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'Poppins',sans-serif",
                  background: '#2563eb', border: 'none', color: '#fff',
                }}>
                + Log Session
              </button>
            </div>
          }
        />

        {sessions.length === 0 ? (
          <EmptyState icon="📋" title="No coaching sessions yet" sub="Log your first session to start tracking agent development" />
        ) : (
          <div className="divide-y" style={{ borderColor: '#e4e4e8' }}>
            {sessions.map((s) => {
              const focusCritNames = (s.focusCriteria || [])
                .map((id) => state.criteria.find((c) => c.id === id)?.name)
                .filter(Boolean)

              return (
                <div key={s.id} className="px-5 py-4 hover:bg-surface2 transition-colors group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                        <span className="font-semibold text-[14px]" style={{ color: '#1a1a2e', fontFamily: "'Poppins',sans-serif" }}>
                          {s.agentName}
                        </span>
                        <StatusBadge status={s.status} />
                        <span className="text-[12px]" style={{ color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>
                          {s.date}
                        </span>
                      </div>

                      {/* Focus criteria chips */}
                      {focusCritNames.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {focusCritNames.map((name) => (
                            <span key={name} className="px-2 py-0.5 rounded text-[10px] font-medium"
                              style={{ background: '#e8f0ff', color: '#2563eb', border: '1px solid #c8d4f0', fontFamily: "'Poppins',sans-serif" }}>
                              {name}
                            </span>
                          ))}
                        </div>
                      )}

                      {s.notes && (
                        <p className="text-[12px] leading-relaxed mb-1.5" style={{ color: '#505060', fontFamily: "'Poppins',sans-serif" }}>
                          {s.notes}
                        </p>
                      )}

                      {s.outcome && s.status === 'completed' && (
                        <div className="flex items-start gap-2 px-3 py-2 rounded-lg mt-2"
                          style={{ background: '#e6f9ee', border: '1px solid #a8ecc0' }}>
                          <span style={{ color: '#16a34a', fontSize: 13 }}>✓</span>
                          <p className="text-[12px] leading-relaxed" style={{ color: '#16a34a', fontFamily: "'Poppins',sans-serif" }}>
                            {s.outcome}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(s)}
                        className="text-[11px] font-semibold px-3 py-1.5 rounded-lg cursor-pointer hover:opacity-80"
                        style={{ background: '#e8f0ff', color: '#2563eb', border: '1px solid #c8d4f0', fontFamily: "'Poppins',sans-serif" }}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(s.id)}
                        className="text-[11px] font-semibold px-3 py-1.5 rounded-lg cursor-pointer hover:opacity-80"
                        style={{ background: '#fde8ec', color: '#e11d48', border: '1px solid #f8c0cc', fontFamily: "'Poppins',sans-serif" }}>
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Panel>

      {modalOpen && (
        <SessionModal
          session={editSession}
          agents={agents}
          criteria={state.criteria}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditSession(null) }}
        />
      )}
    </div>
  )
}
