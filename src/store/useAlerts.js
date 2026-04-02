import { useMemo } from 'react'

export function useAlerts(reviews) {
  return useMemo(() => {
    const alerts = []
    const agentMap = {}

    // Group scored reviews per agent sorted oldest → newest
    reviews
      .filter((r) => r.result !== 'pending')
      .forEach((r) => {
        if (!agentMap[r.agentName]) agentMap[r.agentName] = []
        agentMap[r.agentName].push(r)
      })

    Object.entries(agentMap).forEach(([name, agentReviews]) => {
      const sorted = [...agentReviews].sort(
        (a, b) => new Date(a.callDate || a.reviewedAt) - new Date(b.callDate || b.reviewedAt)
      )

      // Alert 1 — 3+ consecutive fails
      const last3 = sorted.slice(-3)
      if (last3.length === 3 && last3.every((r) => r.result === 'fail')) {
        alerts.push({
          type:    'consecutive_fails',
          agent:   name,
          message: `${name} has failed the last 3 calls in a row`,
          level:   'critical',
        })
      }

      // Alert 2 — Pass rate below 60%
      const scored   = sorted.filter((r) => r.result !== 'pending')
      if (scored.length >= 3) {
        const passes   = scored.filter((r) => r.result === 'pass').length
        const passRate = Math.round((passes / scored.length) * 100)
        if (passRate < 60) {
          alerts.push({
            type:    'low_pass_rate',
            agent:   name,
            message: `${name}'s overall pass rate is ${passRate}% — below the 60% threshold`,
            level:   'warning',
          })
        }
      }

      // Alert 3 — Weekly trend drop of 15%+
      const now       = Date.now()
      const thisWeek  = sorted.filter((r) => new Date(r.callDate || r.reviewedAt) >= new Date(now - 7  * 86400000))
      const lastWeek  = sorted.filter((r) => {
        const d = new Date(r.callDate || r.reviewedAt)
        return d >= new Date(now - 14 * 86400000) && d < new Date(now - 7 * 86400000)
      })

      if (thisWeek.length >= 2 && lastWeek.length >= 2) {
        const thisPass = thisWeek.filter((r) => r.result !== 'pending')
        const lastPass = lastWeek.filter((r) => r.result !== 'pending')
        const thisRate = thisPass.length ? Math.round((thisPass.filter((r) => r.result === 'pass').length / thisPass.length) * 100) : null
        const lastRate = lastPass.length ? Math.round((lastPass.filter((r) => r.result === 'pass').length / lastPass.length) * 100) : null

        if (thisRate !== null && lastRate !== null && (lastRate - thisRate) >= 15) {
          alerts.push({
            type:    'weekly_drop',
            agent:   name,
            message: `${name}'s pass rate dropped ${lastRate - thisRate}% this week (${lastRate}% → ${thisRate}%)`,
            level:   'warning',
          })
        }
      }
    })

    // Deduplicate — one alert per agent per type
    const seen = new Set()
    return alerts.filter((a) => {
      const key = `${a.agent}:${a.type}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [reviews])
}
