import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import ReviewCall from './components/ReviewCall'
import CallLog from './components/CallLog'
import Agents from './components/Agents'
import Reports from './components/Reports'
import Criteria from './components/Criteria'
import DataManager from './components/DataManager'
import AlertsPanel from './components/AlertsPanel'
import { ToastContainer, Btn } from './components/ui'
import { useStore } from './store/useStore'
import { useAlerts } from './store/useAlerts'

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  review:    'Review Call',
  calls:     'Call Log',
  agents:    'Agents',
  reports:   'Reports',
  criteria:  'QA Criteria',
}

const HEADER_HEIGHT = 57

export default function App() {
  const [page,         setPage]         = useState('dashboard')
  const [dataManager,  setDataManager]  = useState(false)
  const [alertsOpen,   setAlertsOpen]   = useState(false)
  const store  = useStore()
  const alerts = useAlerts(store.state.reviews)

  const criticalCount = alerts.filter((a) => a.level === 'critical').length
  const warningCount  = alerts.filter((a) => a.level === 'warning').length
  const totalAlerts   = alerts.length

  const handleRestore = () => window.location.reload()

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
            alerts={alerts}
            onOpenAlerts={() => setAlertsOpen(true)}
          />
        )
      case 'review':
        return (
          <ReviewCall
            state={store.state}
            addReview={store.addReview}
            addReviews={store.addReviews}
            updateReview={store.updateReview}
          />
        )
      case 'calls':
        return (
          <CallLog
            state={store.state}
            updateReview={store.updateReview}
            deleteReview={store.deleteReview}
          />
        )
      case 'agents':
        return <Agents getAgentStats={store.getAgentStats} state={store.state} />
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
    <div className="min-h-screen bg-bg text-txt" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <Sidebar
        activePage={page}
        onNavigate={setPage}
        headerHeight={HEADER_HEIGHT}
        alertCount={totalAlerts}
        criticalCount={criticalCount}
        onOpenAlerts={() => setAlertsOpen(true)}
      />
      <main className="ml-[220px] min-h-screen flex flex-col">
        <div
          className="sticky top-0 z-50 px-8 flex items-center justify-between"
          style={{ height: HEADER_HEIGHT, background: '#d8d8dc', borderBottom: '1px solid #c8c8ce' }}
        >
          <h1 className="font-bold text-[17px] text-txt">{PAGE_TITLES[page]}</h1>
          <div className="flex items-center gap-2.5">
            {/* Alert bell */}
            {totalAlerts > 0 && (
              <button
                onClick={() => setAlertsOpen(true)}
                className="relative hover:opacity-80 transition-all"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', height: 34, borderRadius: 9,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'Poppins',sans-serif",
                  background: criticalCount > 0 ? '#fde8ec' : '#fef3d8',
                  border: `1px solid ${criticalCount > 0 ? '#f8c0cc' : '#f8dca0'}`,
                  color: criticalCount > 0 ? '#e11d48' : '#d97706',
                }}
              >
                🔔
                <span>{totalAlerts} Alert{totalAlerts !== 1 ? 's' : ''}</span>
              </button>
            )}
            <button
              onClick={() => setDataManager(true)}
              className="hover:opacity-80 transition-all"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', height: 34, borderRadius: 9,
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'Poppins',sans-serif",
                background: '#ccccd2', border: '1px solid #b8b8c0', color: '#505060',
              }}
            >
              💾 Backup
            </button>
            <Btn variant="ghost" onClick={() => setPage('calls')}>Call Log</Btn>
            <Btn onClick={() => setPage('review')}>+ New Review</Btn>
          </div>
        </div>
        <div className="flex-1">{renderPage()}</div>
      </main>

      <DataManager
        open={dataManager}
        onClose={() => setDataManager(false)}
        onRestore={handleRestore}
      />

      <AlertsPanel
        alerts={alerts}
        open={alertsOpen}
        onClose={() => setAlertsOpen(false)}
        onNavigateAgents={() => setPage('agents')}
      />

      <ToastContainer />
    </div>
  )
}
