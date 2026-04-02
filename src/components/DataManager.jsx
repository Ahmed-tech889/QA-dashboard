import { useState, useRef } from 'react'

const STORAGE_KEY = 'qa-center-data'

export default function DataManager({ open, onClose, onRestore }) {
  const [status,  setStatus]  = useState('idle')
  const [msg,     setMsg]     = useState('')
  const fileRef = useRef()

  if (!open) return null

  const handleExport = () => {
    try {
      const raw  = localStorage.getItem(STORAGE_KEY)
      if (!raw)  { setStatus('error'); setMsg('No data found to export.'); return }
      const data = JSON.parse(raw)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url  = URL.createObjectURL(blob)
      const date = new Date().toISOString().split('T')[0]
      const a    = document.createElement('a')
      a.href     = url
      a.download = `QIS_backup_${date}.json`
      a.click()
      URL.revokeObjectURL(url)
      setStatus('success')
      setMsg(`Backup saved — QIS_backup_${date}.json`)
    } catch (e) {
      setStatus('error')
      setMsg('Export failed: ' + e.message)
    }
  }

  const handleImport = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        if (!data.reviews || !data.criteria) {
          setStatus('error')
          setMsg('Invalid backup file — missing required fields.')
          return
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
        setStatus('success')
        setMsg(`Restored ${data.reviews.length} reviews and ${data.criteria.length} criteria successfully.`)
        setTimeout(() => { onRestore(); onClose() }, 1800)
      } catch {
        setStatus('error')
        setMsg('Failed to read file — make sure it is a valid QIS backup.')
      }
    }
    reader.readAsText(file)
  }

  const handleClose = () => {
    setStatus('idle')
    setMsg('')
    onClose()
  }

  const raw        = localStorage.getItem(STORAGE_KEY)
  const parsed     = raw ? JSON.parse(raw) : null
  const reviewCount  = parsed?.reviews?.length  ?? 0
  const criteriaCount = parsed?.criteria?.length ?? 0
  const lastBackup = parsed ? new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : null

  const sectionStyle = {
    background: '#ebebee', border: '1px solid #d0d0d6',
    borderRadius: 12, padding: '18px 20px',
  }

  const btnBase = {
    fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 600,
    borderRadius: 9, cursor: 'pointer', padding: '9px 20px',
    transition: 'opacity 0.15s', border: 'none',
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center"
      style={{ background: 'rgba(26,26,46,0.35)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}>

      <div className="w-[500px] rounded-2xl animate-modalIn"
        style={{ background: '#f5f5f8', border: '1px solid #d0d0d6', boxShadow: '0 20px 60px rgba(0,0,0,0.14)' }}>

        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid #dcdce0', background: '#efeff2', borderRadius: '16px 16px 0 0' }}>
          <span className="font-bold text-[15px]" style={{ color: '#1a1a2e', fontFamily: "'Poppins',sans-serif" }}>
            Data Backup & Restore
          </span>
          <button onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer text-sm"
            style={{ background: '#e2e2e6', border: '1px solid #d0d0d6', color: '#505060' }}>
            ✕
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">

          {/* Current data summary */}
          <div style={sectionStyle}>
            <div className="text-[11px] font-semibold uppercase tracking-widest mb-3"
              style={{ color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>
              Current data
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Reviews', reviewCount, '#2563eb'],
                ['Criteria', criteriaCount, '#16a34a'],
              ].map(([label, value, color]) => (
                <div key={label} className="flex flex-col items-center py-3 rounded-xl"
                  style={{ background: '#f5f5f8', border: '1px solid #d0d0d6' }}>
                  <span className="font-bold text-[26px]" style={{ color, fontFamily: "'Poppins',sans-serif" }}>{value}</span>
                  <span className="text-[11px]" style={{ color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Export */}
          <div style={sectionStyle}>
            <div className="text-[11px] font-semibold uppercase tracking-widest mb-1"
              style={{ color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>
              Export backup
            </div>
            <p className="text-[12px] mb-3 leading-relaxed" style={{ color: '#505060', fontFamily: "'Poppins',sans-serif" }}>
              Downloads all your reviews, criteria and settings as a <strong>.json</strong> file.
              Store it somewhere safe — Google Drive, email, USB.
            </p>
            <button onClick={handleExport} className="hover:opacity-80 w-full"
              style={{ ...btnBase, background: '#2563eb', color: '#fff' }}>
              ⬇ Download Backup
            </button>
          </div>

          {/* Import */}
          <div style={sectionStyle}>
            <div className="text-[11px] font-semibold uppercase tracking-widest mb-1"
              style={{ color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>
              Restore from backup
            </div>
            <p className="text-[12px] mb-3 leading-relaxed" style={{ color: '#505060', fontFamily: "'Poppins',sans-serif" }}>
              Upload a previously exported <strong>.json</strong> backup file.
              <span className="font-semibold" style={{ color: '#e11d48' }}> This will replace all current data.</span>
            </p>
            <button onClick={() => fileRef.current?.click()} className="hover:opacity-80 w-full"
              style={{ ...btnBase, background: '#dcdce0', border: '1px solid #c8c8ce', color: '#505060' }}>
              📂 Choose Backup File
            </button>
            <input ref={fileRef} type="file" accept=".json" className="hidden"
              onChange={(e) => { handleImport(e.target.files[0]); e.target.value = '' }} />
          </div>

          {/* Status messages */}
          {status === 'success' && msg && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-[12px] font-medium"
              style={{ background: '#e6f9ee', border: '1px solid #a8ecc0', color: '#16a34a', fontFamily: "'Poppins',sans-serif" }}>
              ✓ {msg}
            </div>
          )}
          {status === 'error' && msg && (
            <div className="px-3 py-2.5 rounded-lg text-[12px] font-medium"
              style={{ background: '#fde8ec', border: '1px solid #f8c0cc', color: '#e11d48', fontFamily: "'Poppins',sans-serif" }}>
              {msg}
            </div>
          )}
        </div>

        <div className="px-6 pb-5 flex justify-end">
          <button onClick={handleClose}
            className="px-5 py-2 rounded-xl text-[13px] font-semibold cursor-pointer hover:opacity-80"
            style={{ background: '#dcdce0', border: '1px solid #c8c8ce', color: '#505060', fontFamily: "'Poppins',sans-serif" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
