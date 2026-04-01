import { useState } from 'react'

const EMAILJS_SERVICE_ID  = 'service_um7vbf8'
const EMAILJS_TEMPLATE_ID = 'template_4v3as9i'
const EMAILJS_PUBLIC_KEY  = '_XJwEyR4nhiM9vxpQ'

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement('script')
    s.src = src
    s.onload  = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })
}

async function generatePdfBase64(htmlString) {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js')

  const container = document.createElement('div')
  container.innerHTML = htmlString
  container.style.cssText = 'position:absolute;left:-9999px;top:0;width:800px'
  document.body.appendChild(container)

  try {
    const pdfBlob = await window.html2pdf()
      .set({
        margin:      [10, 10, 10, 10],
        filename:    'report.pdf',
        image:       { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(container)
      .outputPdf('blob')

    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload  = () => resolve(reader.result.split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(pdfBlob)
    })
  } finally {
    document.body.removeChild(container)
  }
}

export default function EmailModal({ open, onClose, defaultSubject, defaultMessage, getPdfHtml, filename = 'QIS_Report.pdf' }) {
  const [to,       setTo]       = useState('')
  const [subject,  setSubject]  = useState(defaultSubject || '')
  const [message,  setMessage]  = useState(defaultMessage || '')
  const [status,   setStatus]   = useState('idle')
  const [errMsg,   setErrMsg]   = useState('')
  const [progress, setProgress] = useState('')

  if (!open) return null

  const inputStyle = {
    background: '#f5f5f8', border: '1px solid #d0d0d6', borderRadius: 8,
    padding: '8px 12px', color: '#1a1a2e', fontSize: 13,
    fontFamily: "'Poppins',sans-serif", outline: 'none', width: '100%',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  }

  const labelStyle = {
    fontSize: 11, fontWeight: 600, letterSpacing: '0.6px',
    textTransform: 'uppercase', color: '#8888a0',
    fontFamily: "'Poppins',sans-serif", display: 'block', marginBottom: 6,
  }

  const handleSend = async () => {
    if (!to.trim()) { setErrMsg('Please enter a recipient email.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim())) { setErrMsg('Please enter a valid email address.'); return }

    setStatus('sending')
    setErrMsg('')

    try {
      setProgress('Generating PDF...')
      const pdfBase64 = await generatePdfBase64(getPdfHtml())

      setProgress('Sending email...')
      const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id:  EMAILJS_SERVICE_ID,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id:     EMAILJS_PUBLIC_KEY,
          template_params: {
            to_email:    to.trim(),
            subject:     subject,
            message:     message,
            pdf_content: pdfBase64,
            pdf_name:    filename,
          },
        }),
      })

      if (res.ok) {
        setStatus('success')
        setProgress('')
        setTimeout(() => { setStatus('idle'); setProgress(''); onClose() }, 2200)
      } else {
        const text = await res.text()
        throw new Error(text || 'Failed to send email.')
      }
    } catch (e) {
      setStatus('error')
      setProgress('')
      setErrMsg(e.message || 'Something went wrong. Please try again.')
    }
  }

  const handleClose = () => {
    if (status === 'sending') return
    setStatus('idle')
    setErrMsg('')
    setProgress('')
    onClose()
  }

  const isBusy = status === 'sending'

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center"
      style={{ background: 'rgba(26,26,46,0.35)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="w-[520px] rounded-2xl animate-modalIn"
        style={{ background: '#f5f5f8', border: '1px solid #d0d0d6', boxShadow: '0 20px 60px rgba(0,0,0,0.14)' }}>

        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid #dcdce0', background: '#efeff2', borderRadius: '16px 16px 0 0' }}>
          <span className="font-bold text-[15px]"
            style={{ color: '#1a1a2e', fontFamily: "'Poppins',sans-serif" }}>
            Send Report via Email
          </span>
          <button onClick={handleClose} disabled={isBusy}
            className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer text-sm transition-all disabled:opacity-40"
            style={{ background: '#e2e2e6', border: '1px solid #d0d0d6', color: '#505060' }}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">

          <div>
            <label style={labelStyle}>To</label>
            <input
              type="email"
              value={to}
              onChange={(e) => { setTo(e.target.value); setErrMsg('') }}
              placeholder="recipient@example.com"
              disabled={isBusy}
              style={{ ...inputStyle, opacity: isBusy ? 0.6 : 1 }}
              onFocus={(e) => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.10)' }}
              onBlur={(e)  => { e.target.style.borderColor = '#d0d0d6'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          <div>
            <label style={labelStyle}>Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isBusy}
              style={{ ...inputStyle, opacity: isBusy ? 0.6 : 1 }}
              onFocus={(e) => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.10)' }}
              onBlur={(e)  => { e.target.style.borderColor = '#d0d0d6'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          <div>
            <label style={labelStyle}>Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              disabled={isBusy}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 130, lineHeight: 1.6, opacity: isBusy ? 0.6 : 1 }}
              onFocus={(e) => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.10)' }}
              onBlur={(e)  => { e.target.style.borderColor = '#d0d0d6'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          {/* Attachment badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ background: '#ebebee', border: '1px solid #d0d0d6', display: 'inline-flex', alignSelf: 'flex-start' }}>
            <span style={{ fontSize: 14 }}>📎</span>
            <span className="text-[11px] font-semibold"
              style={{ color: '#505060', fontFamily: "'Poppins',sans-serif" }}>
              {filename}
            </span>
            <span className="text-[10px]"
              style={{ color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>
              · PDF · auto-generated
            </span>
          </div>

          {/* Progress */}
          {isBusy && progress && (
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg"
              style={{ background: '#e8f0ff', border: '1px solid #c8d4f0' }}>
              <div style={{
                width: 14, height: 14, border: '2px solid #c8d4f0',
                borderTopColor: '#2563eb', borderRadius: '50%',
                animation: 'spin 0.7s linear infinite', flexShrink: 0,
              }} />
              <span className="text-[12px] font-medium"
                style={{ color: '#2563eb', fontFamily: "'Poppins',sans-serif" }}>
                {progress}
              </span>
            </div>
          )}

          {/* Error */}
          {errMsg && (
            <div className="px-3 py-2.5 rounded-lg text-[12px] font-medium"
              style={{ background: '#fde8ec', border: '1px solid #f8c0cc', color: '#e11d48', fontFamily: "'Poppins',sans-serif" }}>
              {errMsg}
            </div>
          )}

          {/* Success */}
          {status === 'success' && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-[12px] font-medium"
              style={{ background: '#e6f9ee', border: '1px solid #a8ecc0', color: '#16a34a', fontFamily: "'Poppins',sans-serif" }}>
              <span>✓</span> Email sent successfully with PDF attached!
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex items-center justify-end gap-2.5">
          <button onClick={handleClose} disabled={isBusy}
            className="px-4 py-2 rounded-xl text-[13px] font-semibold cursor-pointer hover:opacity-80 transition-all disabled:opacity-40"
            style={{ background: '#dcdce0', border: '1px solid #c8c8ce', color: '#505060', fontFamily: "'Poppins',sans-serif" }}>
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={isBusy || status === 'success'}
            className="px-5 py-2 rounded-xl text-[13px] font-semibold cursor-pointer hover:opacity-90 transition-all disabled:opacity-60"
            style={{ background: '#2563eb', color: '#fff', border: 'none', fontFamily: "'Poppins',sans-serif", minWidth: 110 }}>
            {isBusy ? 'Sending...' : status === 'success' ? 'Sent ✓' : 'Send Email'}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
