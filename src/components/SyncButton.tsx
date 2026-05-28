import { RefreshCw } from "lucide-react";

interface Props {
  onSync: () => void;
  loading: boolean;
  lastSynced: Date | null;
}

export function SyncButton({ onSync, loading, lastSynced }: Props) {
  return (
    <div className="sync-container">
      <button className="sync-button" onClick={onSync} disabled={loading}>
        {loading ? (
          <>
            <span className="spinner" />
            Syncing...
          </>
        ) : (
          <>
            <RefreshCw size={14} />
            Sync Data
          </>
        )}
      </button>
      {lastSynced && (
        <span className="last-synced">
          Last synced: {lastSynced.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
