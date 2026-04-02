import { useEffect, useRef } from 'react'

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement('script')
    s.src = src; s.onload = resolve; s.onerror = reject
    document.head.appendChild(s)
  })
}

function groupByWeek(reviews) {
  const weeks = {}
  reviews
    .filter((r) => r.result !== 'pending')
    .forEach((r) => {
      const d    = new Date(r.callDate || r.reviewedAt)
      const mon  = new Date(d)
      mon.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1))
      const key  = mon.toISOString().split('T')[0]
      if (!weeks[key]) weeks[key] = { pass: 0, total: 0 }
      weeks[key].total++
      if (r.result === 'pass') weeks[key].pass++
    })

  return Object.entries(weeks)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, { pass, total }]) => ({
      week,
      label: new Date(week).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      passRate: Math.round((pass / total) * 100),
      total,
    }))
}

export default function TrendChart({ reviews, height = 180, label = 'Pass Rate Trend' }) {
  const canvasRef = useRef(null)
  const chartRef  = useRef(null)

  useEffect(() => {
    const data = groupByWeek(reviews)
    if (data.length === 0) return

    loadScript('https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js').then(() => {
      const ctx = canvasRef.current?.getContext('2d')
      if (!ctx) return

      if (chartRef.current) { chartRef.current.destroy() }

      const bestIdx  = data.reduce((bi, d, i) => d.passRate > data[bi].passRate ? i : bi, 0)
      const worstIdx = data.reduce((wi, d, i) => d.passRate < data[wi].passRate ? i : wi, 0)

      const pointColors = data.map((_, i) => {
        if (i === bestIdx)  return '#16a34a'
        if (i === worstIdx) return '#e11d48'
        return '#2563eb'
      })

      const pointRadius = data.map((_, i) =>
        (i === bestIdx || i === worstIdx) ? 6 : 3
      )

      chartRef.current = new window.Chart(ctx, {
        type: 'line',
        data: {
          labels: data.map((d) => d.label),
          datasets: [{
            label: 'Pass Rate %',
            data:  data.map((d) => d.passRate),
            borderColor:     '#2563eb',
            backgroundColor: 'rgba(37,99,235,0.08)',
            borderWidth:     2,
            pointBackgroundColor: pointColors,
            pointBorderColor:     pointColors,
            pointRadius,
            pointHoverRadius: 7,
            fill: true,
            tension: 0.4,
          }],
        },
        options: {
          responsive:          true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#f5f5f8',
              titleColor:      '#1a1a2e',
              bodyColor:       '#505060',
              borderColor:     '#d0d0d6',
              borderWidth:     1,
              padding:         10,
              callbacks: {
                label: (ctx) => ` Pass rate: ${ctx.parsed.y}%`,
                afterLabel: (ctx) => {
                  const d = data[ctx.dataIndex]
                  return ` Calls reviewed: ${d.total}`
                },
              },
            },
            annotation: {},
          },
          scales: {
            x: {
              grid:  { color: 'rgba(0,0,0,0.04)', drawBorder: false },
              ticks: { color: '#8888a0', font: { family: 'Poppins', size: 10 } },
            },
            y: {
              min:  0,
              max:  100,
              grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false },
              ticks: {
                color: '#8888a0',
                font:  { family: 'Poppins', size: 10 },
                callback: (v) => v + '%',
                stepSize: 20,
              },
            },
          },
        },
      })
    })

    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null } }
  }, [reviews])

  const data     = groupByWeek(reviews)
  const bestWeek = data.length ? data.reduce((b, d) => d.passRate > b.passRate ? d : b, data[0]) : null
  const worstWeek = data.length ? data.reduce((w, d) => d.passRate < w.passRate ? d : w, data[0]) : null

  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center text-[13px]"
        style={{ height, color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>
        Not enough data yet — need reviews across at least 2 weeks
      </div>
    )
  }

  return (
    <div>
      <div style={{ height, position: 'relative' }}>
        <canvas ref={canvasRef} />
      </div>
      {/* Best / worst markers */}
      <div className="flex items-center gap-4 mt-3 flex-wrap">
        {bestWeek && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
            style={{ background: '#e6f9ee', border: '1px solid #a8ecc0', color: '#16a34a', fontFamily: "'Poppins',sans-serif" }}>
            ▲ Best: {bestWeek.label} ({bestWeek.passRate}%)
          </div>
        )}
        {worstWeek && worstWeek.week !== bestWeek?.week && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
            style={{ background: '#fde8ec', border: '1px solid #f8c0cc', color: '#e11d48', fontFamily: "'Poppins',sans-serif" }}>
            ▼ Lowest: {worstWeek.label} ({worstWeek.passRate}%)
          </div>
        )}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
          style={{ background: '#ebebee', border: '1px solid #d0d0d6', color: '#8888a0', fontFamily: "'Poppins',sans-serif" }}>
          {data.length} weeks tracked
        </div>
      </div>
    </div>
  )
}
