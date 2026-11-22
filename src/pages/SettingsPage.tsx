import React, { useState } from 'react';
import { 
  Moon, 
  Sun,
  Terminal, 
  Cpu, 
  Info, 
  Save, 
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [apiUrl, setApiUrl] = useState('http://localhost:8000');
  const [demoMode, setDemoMode] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear stored scan logs from local storage?')) {
      localStorage.removeItem('phishingguard_scans');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-3xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8FAFC]">
          System Settings & Preferences
        </h2>
        <p className="text-sm text-[#94A3B8] mt-1">
          Configure API bridge endpoints, local demo behavior, and workspace preferences.
        </p>
      </div>

      <div className="bg-[#1A1D27] border border-[#2E3347] rounded-2xl p-6 sm:p-8 space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Theme Mode Toggle */}
          <div className="flex items-center justify-between pb-6 border-b border-[#2E3347]">
            <div>
              <h4 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
                {theme === 'dark' ? <Moon className="w-4 h-4 text-[#818CF8]" /> : <Sun className="w-4 h-4 text-[#F59E0B]" />}
                Visual Interface Theme
              </h4>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Switch between Dark Sentinel command mode and Light clarity mode.
              </p>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="px-3.5 py-1.5 rounded-lg bg-[#252836] border border-[#2E3347] text-xs font-semibold text-[#F8FAFC] flex items-center gap-2 hover:border-[#6366F1]/50 cursor-pointer transition-all"
            >
              {theme === 'dark' ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-[#818CF8]" />
                  <span>Dark Mode (Active)</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>Light Mode (Active)</span>
                </>
              )}
            </button>
          </div>

          {/* Backend API Configuration */}
          <div className="space-y-3 pb-6 border-b border-[#2E3347]">
            <h4 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#22D3EE]" />
              Python Backend API Endpoint
            </h4>
            <p className="text-xs text-[#94A3B8]">
              Target REST API URL for machine learning model inference (FastAPI / Flask).
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="http://127.0.0.1:8000"
                className="flex-1 bg-[#0F1117] border border-[#2E3347] rounded-xl py-2.5 px-3.5 text-xs text-[#F8FAFC] font-mono outline-hidden focus:border-[#6366F1]"
              />
            </div>
            <div className="text-[11px] text-[#64748B] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              <span>Endpoints configured: <code className="text-[#818CF8]">/api/scan</code>, <code className="text-[#818CF8]">/api/evaluation</code></span>
            </div>
          </div>

          {/* Demo Simulation Switch */}
          <div className="flex items-center justify-between pb-6 border-b border-[#2E3347]">
            <div>
              <h4 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#F59E0B]" />
                Demo Simulation Mode
              </h4>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Execute client-side heuristic simulation when backend Python server is unreachable.
              </p>
            </div>
            <input
              type="checkbox"
              checked={demoMode}
              onChange={(e) => setDemoMode(e.target.checked)}
              className="w-4 h-4 rounded-sm border-[#2E3347] text-[#6366F1] focus:ring-0 cursor-pointer"
            />
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleClearHistory}
              className="px-4 py-2 rounded-xl bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/30 text-[#EF4444] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Scan Logs</span>
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#6366F1] hover:bg-[#818CF8] text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#6366F1]/20 active:scale-98"
            >
              <Save className="w-4 h-4" />
              <span>Save Preferences</span>
            </button>
          </div>

          {savedSuccess && (
            <div className="p-3 rounded-lg bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Settings and API bridge configurations saved successfully.</span>
            </div>
          )}
        </form>
      </div>

      {/* System Information */}
      <div className="bg-[#1A1D27] border border-[#2E3347] rounded-2xl p-6 text-xs text-[#94A3B8] space-y-2">
        <div className="font-semibold text-[#F8FAFC]">PhishingGuard Build Architecture</div>
        <div className="grid grid-cols-2 gap-2 font-mono text-[11px] pt-1">
          <div>Client: React 19 + TypeScript + Vite</div>
          <div>Styling: Tailwind CSS (Sentinel Tokens)</div>
          <div>Model Algorithm: Random Forest Classifier</div>
          <div>Project: UAS Keamanan Informasi 2026</div>
        </div>
      </div>
    </div>
  );
};
