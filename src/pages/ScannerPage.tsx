import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  ScanSearch, 
  RotateCcw, 
  AlertCircle, 
  FileText,
  Lock,
  Cpu,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Hash
} from 'lucide-react';
import { scanService } from '../services/scanService';
import { ScanResult } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

export const ScannerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [inputUrl, setInputUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  useEffect(() => {
    const urlParam = searchParams.get('url');
    if (urlParam) {
      setInputUrl(urlParam);
      runScan(urlParam);
    }
  }, [searchParams]);

  const runScan = async (target: string) => {
    const trimmed = target.trim();
    setErrorMessage(null);

    if (!trimmed) {
      setErrorMessage('Input URL cannot be empty.');
      return;
    }

    if (trimmed.length < 4 || (!trimmed.includes('.') && !trimmed.includes(':'))) {
      setErrorMessage('Input URL is invalid. Please enter a valid domain or IP address (e.g., https://example.com or 192.168.1.1).');
      return;
    }

    setLoading(true);
    setScanResult(null);

    // Visual pipeline stages
    setLoadingStep('Lexical Syntax Sanitization...');
    await new Promise((r) => setTimeout(r, 200));
    setLoadingStep('Extracting 16 Deterministic Lexical Features...');
    await new Promise((r) => setTimeout(r, 250));
    setLoadingStep('Forwarding Feature Vector to FastAPI Backend Engine...');

    try {
      // Direct call to FastAPI POST /api/scan
      const result = await scanService.scanUrl(trimmed);
      setScanResult(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal melakukan pemindaian URL. Pastikan backend API aktif.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runScan(inputUrl);
  };

  const handleClear = () => {
    setInputUrl('');
    setScanResult(null);
    setErrorMessage(null);
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8FAFC]">
          Analyze Suspicious URL
        </h2>
        <p className="text-sm text-[#94A3B8] mt-1">
          Perform immediate static lexical feature extraction & Random Forest inference via FastAPI.
        </p>
      </div>

      {/* Input Card */}
      <div className="bg-[#1A1D27] border border-[#2E3347] rounded-2xl p-6 sm:p-8 shadow-xl">
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="relative">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-2">
              Target URL for Inspection
            </label>
            <div className="relative flex items-center">
              <ScanSearch className="absolute left-4 w-5 h-5 text-[#64748B]" />
              <input
                type="text"
                disabled={loading}
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://example.com/login or subdomain.domain.tld"
                className="w-full bg-[#0F1117] border border-[#2E3347] focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] rounded-xl py-3.5 pl-12 pr-4 text-sm sm:text-base text-[#F8FAFC] placeholder-[#64748B] font-mono outline-hidden transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-[#64748B]">
              <Lock className="w-3.5 h-3.5 text-[#22D3EE]" />
              <span>Zero-Network Quarantine: Destination server is never visited</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleClear}
                disabled={loading || (!inputUrl && !scanResult)}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-[#2E3347] bg-[#252836] hover:bg-[#2E3347] text-[#94A3B8] hover:text-[#F8FAFC] text-sm font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Clear</span>
              </button>
              <button
                type="submit"
                disabled={loading || !inputUrl.trim()}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-[#6366F1] hover:bg-[#818CF8] text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[#6366F1]/20 transition-all cursor-pointer disabled:opacity-50 active:scale-98"
              >
                <ScanSearch className="w-4 h-4" />
                <span>{loading ? 'Analyzing...' : 'Scan URL'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Error State */}
        {errorMessage && (
          <div className="mt-6 p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-start gap-3 text-sm text-[#EF4444]">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold">Inspection Failed</div>
              <p className="text-xs text-[#94A3B8]">{errorMessage}</p>
            </div>
          </div>
        )}
      </div>

      {/* Loading State Pipeline */}
      {loading && (
        <div className="bg-[#1A1D27] border border-[#6366F1]/30 rounded-2xl p-8 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 mx-auto rounded-full border-3 border-[#2E3347] border-t-[#6366F1] animate-spin flex items-center justify-center">
            <Cpu className="w-6 h-6 text-[#22D3EE] animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#F8FAFC]">Analyzing URL...</h3>
            <p className="text-xs font-mono text-[#818CF8] mt-1">{loadingStep}</p>
          </div>
          <div className="max-w-md mx-auto bg-[#0F1117] h-2 rounded-full overflow-hidden border border-[#2E3347]">
            <div className="h-full bg-gradient-to-r from-[#6366F1] to-[#22D3EE] animate-pulse w-3/4"></div>
          </div>
        </div>
      )}

      {/* Result State — Live from Backend API */}
      {scanResult && !loading && (
        <div className={`rounded-2xl border p-6 sm:p-8 space-y-6 shadow-2xl transition-all ${
          scanResult.prediction === 'PHISHING_DETECTED'
            ? 'bg-[#1A1D27] border-[#EF4444]/40 shadow-[#EF4444]/5'
            : 'bg-[#1A1D27] border-[#10B981]/40 shadow-[#10B981]/5'
        }`}>
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#2E3347]">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <StatusBadge status={scanResult.prediction} size="lg" riskLevel={scanResult.risk_level} />
                <span className="text-xs font-mono px-2 py-0.5 rounded-sm bg-[#252836] text-[#22D3EE] border border-[#2E3347]">
                  MODEL v{scanResult.model_version}
                </span>
              </div>
              <p className="font-mono text-sm sm:text-base text-[#F8FAFC] break-all">
                {scanResult.url}
              </p>
              <div className="flex items-center gap-4 text-xs text-[#64748B]">
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5" /> {scanResult.processing_time_ms} ms
                </span>
                <span>ID: {scanResult.id}</span>
              </div>
            </div>

            <div className="text-right sm:border-l border-[#2E3347] sm:pl-6 shrink-0 space-y-1">
              <span className="text-xs text-[#94A3B8] block">Estimated Threat Probability</span>
              <span className={`text-3xl font-extrabold font-mono block ${
                scanResult.prediction === 'PHISHING_DETECTED' ? 'text-[#EF4444]' : 'text-[#10B981]'
              }`}>
                {scanResult.probability.phishing.toFixed(2)}%
              </span>
              <span className="text-[11px] text-[#64748B] block font-mono">
                Legitimate: {scanResult.probability.legitimate.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Quick 16 Features Grid */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-3">
              Extracted Deterministic Features (16 Attributes)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#252836] border border-[#2E3347]">
                <div className="text-[#64748B]">URL Length</div>
                <div className="font-mono font-bold text-[#F8FAFC] text-sm mt-0.5">
                  {scanResult.features.URLLength} chars
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#252836] border border-[#2E3347]">
                <div className="text-[#64748B]">Domain Length</div>
                <div className="font-mono font-bold text-[#F8FAFC] text-sm mt-0.5">
                  {scanResult.features.DomainLength} chars
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#252836] border border-[#2E3347]">
                <div className="text-[#64748B]">Subdomain Count</div>
                <div className="font-mono font-bold text-[#F8FAFC] text-sm mt-0.5">
                  {scanResult.features.NoOfSubDomain}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#252836] border border-[#2E3347]">
                <div className="text-[#64748B]">HTTPS Flag</div>
                <div className={`font-mono font-bold text-sm mt-0.5 ${
                  scanResult.features.IsHTTPS === 1 ? 'text-[#10B981]' : 'text-[#EF4444]'
                }`}>
                  {scanResult.features.IsHTTPS === 1 ? 'YES' : 'NO'}
                </div>
              </div>
            </div>
          </div>

          {/* Notice Disclaimer */}
          <div className="p-4 rounded-xl bg-[#0F1117] border border-[#2E3347] text-xs text-[#94A3B8] leading-relaxed">
            <strong className="text-[#F8FAFC]">Disclaimer Keamanan:</strong> Hasil di atas merupakan estimasi probabilitas statistik algoritma Random Forest berbasis fitur leksikal URL statis, bukan jaminan mutlak keamanan maupun bahaya suatu situs web.
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              onClick={() => navigate(`/scan/${scanResult.id}`)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#6366F1] hover:bg-[#818CF8] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>View Full 16-Feature Breakdown</span>
            </button>
            <button
              onClick={handleClear}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#252836] hover:bg-[#2E3347] text-[#F8FAFC] text-xs font-semibold flex items-center justify-center gap-2 border border-[#2E3347] cursor-pointer transition-all"
            >
              <span>Scan Another URL</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
