import { useState } from 'react'

const EMAILJS_SERVICE_ID  = 'service_um7vbf8'
const EMAILJS_TEMPLATE_ID = 'template_4v3as9i'
const EMAILJS_PUBLIC_KEY  = '_XJwEyR4nhiM9vxpQ'

export default function EmailModal({ open, onClose, defaultSubject, defaultMessage, getPdfHtml }) {
  const [to,      setTo]      = useState('')
  const [subject, setSubject] = useState(defaultSubject || '')
  const [message, setMessage] = useState(defaultMessage || '')
  const [status,  setStatus]  = useState('idle') // idle | sending | success | error
  const [errMsg,  setErrMsg]  = useState('')

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
      const pdfHtml = getPdfHtml()

      const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id:  EMAILJS_SERVICE_ID,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id:     EMAILJS_PUBLIC_KEY,
          template_params: {
            to_email: to.trim(),
            subject:  subject,
            message:  message,
            pdf_html: pdfHtml,
          },
        }),
      })

      if (res.ok) {
        setStatus('success')
        setTimeout(() => { setStatus('idle'); onClose() }, 2000)
      } else {
        const text = await res.text()
        throw new Error(text || 'Failed to send')
      }
    } catch (e) {
      setStatus('error')
      setErrMsg(e.message || 'Something went wrong. Please try again.')
    }
  }

  const handleClose = () => {
    setStatus('idle')
    setErrMsg('')
    onClose()
  }

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
          <span className="font-bold text-[15px]" style={{ color: '#1a1a2e', fontFamily: "'Poppins',sans-serif" }}>
            Send Report via Email
          </span>
          <button onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer text-sm transition-all"
            style={{ background: '#e2e2e6', border: '1px solid #d0d0d6', color: '#505060' }}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">

          {/* To */}
          <div>
            <label style={labelStyle}>To</label>
            <input
              type="email"
              value={to}
              onChange={(e) => { setTo(e.target.value); setErrMsg('') }}
              placeholder="recipient@example.com"
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.10)' }}
              onBlur={(e)  => { e.target.style.borderColor = '#d0d0d6'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          {/* Subject */}
          <div>
            <label style={labelStyle}>Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.10)' }}
              onBlur={(e)  => { e.target.style.borderColor = '#d0d0d6'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          {/* Message */}
          <div>
            <label style={labelStyle}>Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 130, lineHeight: 1.6 }}
              onFocus={(e) => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.10)' }}
              onBlur={(e)  => { e.target.style.borderColor = '#d0d0d6'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          {/* Info note */}
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg"
            style={{ background: '#e8f0ff', border: '1px solid #c8d4f0' }}>
            <span style={{ color: '#2563eb', fontSize: 13, marginTop: 1 }}>ℹ</span>
            <span className="text-[11px] leading-relaxed" style={{ color: '#2563eb', fontFamily: "'Poppins',sans-serif" }}>
              The full report will be included in the email body as formatted HTML. The recipient can print or save it as a PDF.
            </span>
          </div>

          {/* Error */}
          {errMsg && (
            <div className="px-3 py-2.5 rounded-lg text-[12px] font-medium"
              style={{ background: '#fde8ec', border: '1px solid #f8c0cc', color: '#e11d48', fontFamily: "'Poppins',sans-serif" }}>
              {errMsg}
            </div>
          )}

          {/* Success */}
          {status === 'success' && (
            <div className="px-3 py-2.5 rounded-lg text-[12px] font-medium"
              style={{ background: '#e6f9ee', border: '1px solid #a8ecc0', color: '#16a34a', fontFamily: "'Poppins',sans-serif" }}>
              Email sent successfully!
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex items-center justify-end gap-2.5">
          <button onClick={handleClose}
            className="px-4 py-2 rounded-xl text-[13px] font-semibold cursor-pointer hover:opacity-80 transition-all"
            style={{ background: '#dcdce0', border: '1px solid #c8c8ce', color: '#505060', fontFamily: "'Poppins',sans-serif" }}>
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={status === 'sending' || status === 'success'}
            className="px-5 py-2 rounded-xl text-[13px] font-semibold cursor-pointer hover:opacity-90 transition-all disabled:opacity-60"
            style={{ background: '#2563eb', color: '#fff', border: 'none', fontFamily: "'Poppins',sans-serif", minWidth: 100 }}>
            {status === 'sending' ? 'Sending...' : status === 'success' ? 'Sent ✓' : 'Send Email'}
          </button>
        </div>
      </div>
    </div>
  )
}
