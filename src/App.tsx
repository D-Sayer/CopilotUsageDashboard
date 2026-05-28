import { useEffect } from "react";
import { Activity, AlertTriangle } from "lucide-react";
import { useUsageData } from "./hooks/useUsageData";
import { SummaryCards } from "./components/SummaryCards";
import { DailyTokenChart } from "./components/DailyTokenChart";
import { DailyRequestsChart } from "./components/DailyRequestsChart";
import { ModelTable } from "./components/ModelTable";
import { SessionsTable } from "./components/SessionsTable";
import { SyncButton } from "./components/SyncButton";
import "./App.css";

function App() {
  const { data, loading, error, lastSynced, fetchData } = useUsageData();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <Activity size={20} className="header-icon" />
            <div>
              <h1>Copilot Usage</h1>
              <p className="subtitle">Token consumption & session analytics</p>
            </div>
          </div>
          <SyncButton onSync={fetchData} loading={loading} lastSynced={lastSynced} />
        </div>
      </header>

      <main className="dashboard-main">
        {error && (
          <div className="error-banner">
            <AlertTriangle size={16} className="error-banner-icon" />
            {error}
          </div>
        )}

        {data && (
          <>
            <SummaryCards summary={data.summary} models={data.modelTotals} dailyByModel={data.dailyByModel} />
            <div className="charts-grid">
              <DailyTokenChart data={data.dailyUsage} />
              <DailyRequestsChart data={data.dailyUsage} />
            </div>
            <ModelTable models={data.modelTotals} />
            <SessionsTable sessions={data.sessions} />
          </>
        )}

        {!data && !loading && !error && (
          <div className="empty-state">
            <p>Click "Sync Data" to load your Copilot usage data.</p>
          </div>
        )}

        {loading && !data && (
          <div className="loading-state">
            <span className="spinner large" />
            <p>Parsing session data...</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
