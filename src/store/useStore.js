import { useState, useCallback } from 'react'

const STORAGE_KEY = 'qa-center-data'

const defaultState = {
  reviews: [],
  criteria: [],
  nextId: 1,
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return defaultState
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

export function useStore() {
  const [state, setState] = useState(loadState)

  const update = useCallback((updater) => {
    setState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      saveState(next)
      return next
    })
  }, [])

  const addCriterion = useCallback(
    (name, cat) => {
      update((s) => ({
        ...s,
        criteria: [...s.criteria, { id: s.nextId, name, cat }],
        nextId: s.nextId + 1,
      }))
    },
    [update]
  )

  const deleteCriterion = useCallback(
    (id) => {
      update((s) => ({ ...s, criteria: s.criteria.filter((c) => c.id !== id) }))
    },
    [update]
  )

  const addReview = useCallback(
    (review) => {
      update((s) => ({
        ...s,
        reviews: [{ ...review, id: s.nextId, reviewedAt: new Date().toISOString() }, ...s.reviews],
        nextId: s.nextId + 1,
      }))
    },
    [update]
  )

  const addReviews = useCallback(
    (newReviews) => {
      update((s) => {
        let id = s.nextId
        const mapped = newReviews.map((r) => ({ ...r, id: id++, reviewedAt: new Date().toISOString() }))
        return { ...s, reviews: [...mapped, ...s.reviews], nextId: id }
      })
    },
    [update]
  )

  const getAgentStats = useCallback(() => {
    const stats = {}
    state.reviews
      .filter((r) => r.result !== 'pending')
      .forEach((r) => {
        if (!stats[r.agentName])
          stats[r.agentName] = { name: r.agentName, id: r.agentId, total: 0, pass: 0, fail: 0 }
        stats[r.agentName].total++
        if (r.result === 'pass') stats[r.agentName].pass++
        else stats[r.agentName].fail++
      })
    Object.values(stats).forEach((s) => (s.passRate = s.total ? Math.round((s.pass / s.total) * 100) : 0))
    return stats
  }, [state.reviews])

  const getCriteriaFailRates = useCallback(() => {
    const rates = {}
    state.criteria.forEach((c) => (rates[c.id] = { name: c.name, total: 0, fail: 0, na: 0 }))
    state.reviews.forEach((r) => {
      Object.entries(r.scores || {}).forEach(([cid, val]) => {
        if (rates[cid]) {
          if (val === 'na') {
            rates[cid].na++
          } else {
            rates[cid].total++
            if (val === 'fail') rates[cid].fail++
          }
        }
      })
    })
    return Object.values(rates)
      .filter((r) => r.total > 0)
      .map((r) => ({ ...r, failRate: Math.round((r.fail / r.total) * 100) }))
      .sort((a, b) => b.failRate - a.failRate)
  }, [state.reviews, state.criteria])

  const getReviewerActivity = useCallback(() => {
    const r = {}
    state.reviews.forEach((rev) => {
      if (!r[rev.reviewer]) r[rev.reviewer] = { name: rev.reviewer, total: 0, pass: 0, fail: 0 }
      r[rev.reviewer].total++
      if (rev.result === 'pass') r[rev.reviewer].pass++
      if (rev.result === 'fail') r[rev.reviewer].fail++
    })
    return Object.values(r).sort((a, b) => b.total - a.total)
  }, [state.reviews])

  return {
    state,
    addCriterion,
    deleteCriterion,
    addReview,
    addReviews,
    getAgentStats,
    getCriteriaFailRates,
    getReviewerActivity,
  }
}
