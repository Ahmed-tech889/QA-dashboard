const NAV_ITEMS = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard', section: 'Main' },
  { id: 'review', icon: '🎧', label: 'Review Call', section: null },
  { id: 'calls', icon: '📁', label: 'Call Log', section: null },
  { id: 'agents', icon: '👥', label: 'Agents', section: 'Analytics' },
  { id: 'reports', icon: '📈', label: 'Reports', section: null },
  { id: 'criteria', icon: '⚙️', label: 'QA Criteria', section: 'Config' },
]

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-surface border-r border-border flex flex-col z-[100]">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-accent to-accent3 grid place-items-center text-sm">📋</div>
          <div>
            <div className="font-syne font-extrabold text-[15px] tracking-[-0.3px]">QIS</div>
            <div className="font-mono text-[9px] text-txt3 tracking-[1.5px] uppercase mt-0.5">Quality Intelligence System</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3">
        {NAV_ITEMS.map((item) => (
          <div key={item.id}>
            {item.section && (
              <div className="font-mono text-[9px] tracking-[1.5px] uppercase text-txt3 px-2 mt-3 mb-1.5">
                {item.section}
              </div>
            )}
            <button
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer text-[13.5px] mb-0.5 transition-all border text-left font-dm
                ${activePage === item.id
                  ? 'bg-gradient-to-br from-accent/18 to-accent3/8 text-txt border-accent/25 font-medium'
                  : 'bg-transparent text-txt2 border-transparent hover:bg-surface2 hover:text-txt'
                }`}
            >
              <span className="w-[18px] text-center text-[15px]">{item.icon}</span>
              {item.label}
            </button>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2.5 px-3 py-2.5 bg-surface2 rounded-lg border border-border">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-accent3 grid place-items-center text-[11px] font-bold shrink-0">QA</div>
          <div>
            <div className="text-xs font-medium">Reviewer</div>
            <div className="font-mono text-[10px] text-txt3">QA Analyst</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
