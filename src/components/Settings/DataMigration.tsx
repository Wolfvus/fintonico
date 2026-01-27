import React, { useState, useEffect, useCallback } from 'react';
import { Upload, AlertCircle, CheckCircle, Loader2, Database, Trash2, RefreshCw } from 'lucide-react';
import {
  readLocalStorageData,
  checkExistingSupabaseData,
  migrateToSupabase,
  clearLocalStorageData,
  type MigrationProgress,
  type LocalStorageData,
} from '../../services/migrationService';
import { useAuthStore } from '../../stores/authStore';

interface Props {
  onMigrationComplete?: () => void;
}

export const DataMigration: React.FC<Props> = ({ onMigrationComplete }) => {
  const { user, isDevMode, canAccessAdmin } = useAuthStore();
  const [localData, setLocalData] = useState<LocalStorageData | null>(null);
  const [supabaseData, setSupabaseData] = useState<{ hasData: boolean; counts: Record<string, number> } | null>(null);
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [migrationResult, setMigrationResult] = useState<{ success: boolean; errors: string[] } | null>(null);
  const [overwrite, setOverwrite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Check for local data on mount
  useEffect(() => {
    const data = readLocalStorageData();
    setLocalData(data);
    setLoading(false);
  }, []);

  // Check Supabase data when user is authenticated
  useEffect(() => {
    const checkSupabase = async () => {
      if (!user || isDevMode) return;
      try {
        const result = await checkExistingSupabaseData();
        setSupabaseData(result);
      } catch (err) {
        console.error('Error checking Supabase data:', err);
      }
    };
    checkSupabase();
  }, [user, isDevMode]);

  const hasLocalData = localData && (
    localData.expenses.length > 0 ||
    localData.income.length > 0 ||
    localData.accounts.length > 0 ||
    localData.ledgerAccounts.length > 0 ||
    localData.snapshots.length > 0
  );

  const handleMigrate = useCallback(async () => {
    if (!localData) return;

    setMigrationResult(null);
    setProgress({ step: 'checking', current: 0, total: 0, message: 'Starting migration...' });

    const result = await migrateToSupabase(localData, setProgress, { overwrite });

    setMigrationResult({ success: result.success, errors: result.errors });

    if (result.success) {
      onMigrationComplete?.();
    }
  }, [localData, overwrite, onMigrationComplete]);

  const handleClearLocalData = useCallback(() => {
    clearLocalStorageData();
    setLocalData(readLocalStorageData());
    setShowClearConfirm(false);
  }, []);

  const handleRefreshSupabase = useCallback(async () => {
    if (!user || isDevMode) return;
    try {
      const result = await checkExistingSupabaseData();
      setSupabaseData(result);
    } catch (err) {
      console.error('Error refreshing Supabase data:', err);
    }
  }, [user, isDevMode]);

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (isDevMode) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
        <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Dev Mode Active</span>
        </div>
        <p className="text-sm text-yellow-600 dark:text-yellow-500 mt-2">
          Data migration is not available in dev mode. Configure Supabase environment variables to enable cloud sync.
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Only show migration tools for admin/super_admin users
  if (!canAccessAdmin()) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Database className="w-5 h-5" />
        Data Migration
      </h3>

      {/* Local Data Summary */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Local Storage Data</h4>
        {hasLocalData ? (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm">
            <div className="bg-white dark:bg-gray-700 rounded p-2 text-center">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {localData?.expenses.length || 0}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Expenses</div>
            </div>
            <div className="bg-white dark:bg-gray-700 rounded p-2 text-center">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {localData?.income.length || 0}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Income</div>
            </div>
            <div className="bg-white dark:bg-gray-700 rounded p-2 text-center">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {localData?.accounts.length || 0}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Accounts</div>
            </div>
            <div className="bg-white dark:bg-gray-700 rounded p-2 text-center">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {localData?.ledgerAccounts.length || 0}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Ledger</div>
            </div>
            <div className="bg-white dark:bg-gray-700 rounded p-2 text-center">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {localData?.snapshots.length || 0}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Snapshots</div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No local data found.</p>
        )}
      </div>

      {/* Supabase Data Summary */}
      {supabaseData && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-blue-900 dark:text-blue-100">Cloud Data (Supabase)</h4>
            <button
              onClick={handleRefreshSupabase}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          {supabaseData.hasData ? (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm">
              <div className="bg-white/50 dark:bg-blue-800/30 rounded p-2 text-center">
                <div className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  {supabaseData.counts.expenses}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-300">Expenses</div>
              </div>
              <div className="bg-white/50 dark:bg-blue-800/30 rounded p-2 text-center">
                <div className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  {supabaseData.counts.income}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-300">Income</div>
              </div>
              <div className="bg-white/50 dark:bg-blue-800/30 rounded p-2 text-center">
                <div className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  {supabaseData.counts.accounts}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-300">Accounts</div>
              </div>
              <div className="bg-white/50 dark:bg-blue-800/30 rounded p-2 text-center">
                <div className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  {supabaseData.counts.ledgerAccounts}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-300">Ledger</div>
              </div>
              <div className="bg-white/50 dark:bg-blue-800/30 rounded p-2 text-center">
                <div className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  {supabaseData.counts.snapshots}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-300">Snapshots</div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-blue-600 dark:text-blue-300">No cloud data yet.</p>
          )}
        </div>
      )}

      {/* Migration Progress */}
      {progress && progress.step !== 'idle' && (
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            {progress.step === 'complete' ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : progress.step === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-500" />
            ) : (
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            )}
            <span className={`font-medium ${
              progress.step === 'complete' ? 'text-green-700 dark:text-green-400' :
              progress.step === 'error' ? 'text-red-700 dark:text-red-400' :
              'text-blue-700 dark:text-blue-400'
            }`}>
              {progress.message}
            </span>
          </div>
          {progress.total > 0 && progress.step !== 'complete' && progress.step !== 'error' && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Migration Result */}
      {migrationResult && (
        <div className={`rounded-lg p-4 ${
          migrationResult.success
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700'
        }`}>
          <div className="flex items-center gap-2">
            {migrationResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
            <span className={`font-medium ${
              migrationResult.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
            }`}>
              {migrationResult.success ? 'Migration Successful!' : 'Migration had errors'}
            </span>
          </div>
          {migrationResult.errors.length > 0 && (
            <ul className="mt-2 text-sm text-red-600 dark:text-red-400 list-disc list-inside">
              {migrationResult.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Actions */}
      {hasLocalData && (
        <div className="space-y-3">
          {/* Overwrite option */}
          {supabaseData?.hasData && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={overwrite}
                onChange={(e) => setOverwrite(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700 dark:text-gray-300">
                Overwrite existing cloud data
              </span>
            </label>
          )}

          {/* Migrate Button */}
          <button
            onClick={handleMigrate}
            disabled={progress !== null && progress.step !== 'complete' && progress.step !== 'error'}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Upload className="w-5 h-5" />
            {supabaseData?.hasData && overwrite ? 'Migrate & Overwrite Cloud Data' : 'Migrate to Cloud'}
          </button>

          {/* Clear Local Data */}
          {migrationResult?.success && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              {showClearConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Clear local data permanently?
                  </span>
                  <button
                    onClick={handleClearLocalData}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    Yes, Clear
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear local data (already migrated)
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* No local data message */}
      {!hasLocalData && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No local data to migrate. Your data is already stored in the cloud.
        </p>
      )}
    </div>
  );
};
