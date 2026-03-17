import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import ReviewCall from './components/ReviewCall'
import CallLog from './components/CallLog'
import Agents from './components/Agents'
import Reports from './components/Reports'
import Criteria from './components/Criteria'
import { ToastContainer, Btn } from './components/ui'
import { useStore } from './store/useStore'

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  review: 'Review Call',
  calls: 'Call Log',
  agents: 'Agents',
  reports: 'Reports',
  criteria: 'QA Criteria',
}

export default function App() {
  const [page, setPage] = useState('dashboard')
  const store = useStore()

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return (
          <Dashboard
            state={store.state}
            getAgentStats={store.getAgentStats}
            getCriteriaFailRates={store.getCriteriaFailRates}
            getReviewerActivity={store.getReviewerActivity}
            onNavigate={setPage}
          />
        )
      case 'review':
        return (
          <ReviewCall
            state={store.state}
            addReview={store.addReview}
            addReviews={store.addReviews}
          />
        )
      case 'calls':
        return <CallLog state={store.state} />
      case 'agents':
        return <Agents getAgentStats={store.getAgentStats} />
      case 'reports':
        return (
          <Reports
            state={store.state}
            getAgentStats={store.getAgentStats}
            getCriteriaFailRates={store.getCriteriaFailRates}
            getReviewerActivity={store.getReviewerActivity}
          />
        )
      case 'criteria':
        return (
          <Criteria
            state={store.state}
            addCriterion={store.addCriterion}
            deleteCriterion={store.deleteCriterion}
            updateCriterionWeight={store.updateCriterionWeight}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-bg text-txt font-dm">
      <Sidebar activePage={page} onNavigate={setPage} />

      <main className="ml-[220px] min-h-screen flex flex-col">
        <div className="sticky top-0 z-50 px-8 py-[18px] bg-surface border-b border-border flex items-center justify-between">
          <h1 className="font-syne font-bold text-[18px]">{PAGE_TITLES[page]}</h1>
          <div className="flex items-center gap-2.5">
            <Btn variant="ghost" onClick={() => setPage('calls')}>📁 Call Log</Btn>
            <Btn onClick={() => setPage('review')}>+ New Review</Btn>
          </div>
        </div>

        <div className="flex-1">
          {renderPage()}
        </div>
      </main>

      <ToastContainer />
    </div>
  )
}
