import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ScanSearch, 
  Clock, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle,
  Cpu,
  Hash
} from 'lucide-react';
import { scanService } from '../services/scanService';
import { HistoryItem } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

export const ScanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [scan, setScan] = useState<HistoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchScan() {
      if (!id) return;
      setLoading(true);
      setErrorMsg(null);
      try {
        const found = await scanService.getScanDetail(id);
        setScan(found);
      } catch (err: any) {
        setErrorMsg(err.message || 'Record inspeksi tidak ditemukan.');
      } finally {
        setLoading(false);
      }
    }
    fetchScan();
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <span className="text-xs text-[#94A3B8]">Memuat laporan inspeksi dari database...</span>
      </div>
    );
  }

  if (errorMsg || !scan) {
    return (
      <div className="bg-[#1A1D27] border border-[#2E3347] rounded-2xl p-8 text-center space-y-4 max-w-xl mx-auto my-12">
        <AlertTriangle className="w-12 h-12 text-[#F59E0B] mx-auto" />
        <h3 className="text-lg font-bold text-[#F8FAFC]">Record Inspeksi Tidak Ditemukan</h3>
        <p className="text-xs text-[#94A3B8]">{errorMsg || 'ID scan tidak terdaftar di database SQLite backend.'}</p>
        <button
          onClick={() => navigate('/scanner')}
          className="px-5 py-2.5 rounded-xl bg-[#6366F1] text-white text-xs font-semibold cursor-pointer"
        >
          Ke URL Scanner
        </button>
      </div>
    );
  }

  const isPhishing = scan.prediction === 'PHISHING_DETECTED';
  const f: Record<string, any> = scan.features || {};

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>
        <Link
          to="/scanner"
          className="px-4 py-2 rounded-xl bg-[#252836] border border-[#2E3347] hover:bg-[#2E3347] text-xs font-medium text-[#F8FAFC] flex items-center gap-1.5 transition-colors"
        >
          <ScanSearch className="w-4 h-4 text-[#818CF8]" />
          <span>Scan URL Lain</span>
        </Link>
      </div>

      {/* Main Inspection Banner */}
      <div className="bg-[#1A1D27] border border-[#2E3347] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#2E3347]">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <StatusBadge status={scan.prediction} size="lg" riskLevel={scan.risk_level} />
              <span className="text-xs font-mono px-2 py-0.5 rounded-sm bg-[#252836] text-[#94A3B8] border border-[#2E3347]">
                ID: {scan.id}
              </span>
            </div>
            <div className="font-mono text-sm sm:text-base text-[#F8FAFC] break-all bg-[#0F1117] p-3 rounded-lg border border-[#2E3347]">
              {scan.url}
            </div>
            <div className="flex items-center gap-4 text-xs text-[#64748B]">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {scan.scanned_at}
              </span>
              <span className="font-mono">Processing: {scan.processing_time_ms} ms</span>
            </div>
          </div>

          <div className="sm:border-l border-[#2E3347] sm:pl-8 shrink-0 flex flex-col justify-center">
            <span className="text-xs text-[#94A3B8]">Threat Probability</span>
            <span className={`text-3xl font-extrabold font-mono mt-1 ${isPhishing ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
              {scan.prob_phishing.toFixed(2)}%
            </span>
            <span className="text-xs font-mono text-[#94A3B8] mt-0.5">
              Legitimate: {scan.prob_legitimate.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Disclaimer Card */}
        <div className="p-4 rounded-xl bg-[#252836]/60 border border-[#2E3347] text-xs text-[#94A3B8] leading-relaxed">
          <strong className="text-[#F8FAFC]">Model Diagnostic Notice:</strong> Hasil prediksi ini dihitung oleh model Random Forest v3.0 (100 Decision Trees) berdasarkan 16 fitur leksikal deterministik tanpa mengunjungi server tujuan.
        </div>
      </div>

      {/* 16 Features Breakdown Grid */}
      <div className="bg-[#1A1D27] border border-[#2E3347] rounded-2xl p-6 sm:p-8 space-y-6">
        <div>
          <h3 className="text-base font-semibold text-[#F8FAFC]">16 Extracted Lexical Features Breakdown</h3>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Nilai numerik fitur leksikal statis yang dihitung secara deterministik dari URL mentah.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#252836] border border-[#2E3347]">
            <div className="flex justify-between items-center text-xs text-[#94A3B8]">
              <span>URLLength</span>
              <Hash className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold font-mono text-[#F8FAFC] mt-2">{f.URLLength ?? '--'} chars</div>
          </div>

          <div className="p-4 rounded-xl bg-[#252836] border border-[#2E3347]">
            <div className="flex justify-between items-center text-xs text-[#94A3B8]">
              <span>DomainLength</span>
              <Hash className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold font-mono text-[#F8FAFC] mt-2">{f.DomainLength ?? '--'} chars</div>
          </div>

          <div className="p-4 rounded-xl bg-[#252836] border border-[#2E3347]">
            <div className="flex justify-between items-center text-xs text-[#94A3B8]">
              <span>IsHTTPS</span>
              <Hash className="w-3.5 h-3.5" />
            </div>
            <div className={`text-xl font-bold font-mono mt-2 ${f.IsHTTPS === 1 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
              {f.IsHTTPS === 1 ? 'YES (1)' : 'NO (0)'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#252836] border border-[#2E3347]">
            <div className="flex justify-between items-center text-xs text-[#94A3B8]">
              <span>IsDomainIP</span>
              <Hash className="w-3.5 h-3.5" />
            </div>
            <div className={`text-xl font-bold font-mono mt-2 ${f.IsDomainIP === 1 ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
              {f.IsDomainIP === 1 ? 'YES (1)' : 'NO (0)'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#252836] border border-[#2E3347]">
            <div className="flex justify-between items-center text-xs text-[#94A3B8]">
              <span>NoOfSubDomain</span>
              <Hash className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold font-mono text-[#F8FAFC] mt-2">{f.NoOfSubDomain ?? '--'}</div>
          </div>

          <div className="p-4 rounded-xl bg-[#252836] border border-[#2E3347]">
            <div className="flex justify-between items-center text-xs text-[#94A3B8]">
              <span>TLDLength</span>
              <Hash className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold font-mono text-[#F8FAFC] mt-2">{f.TLDLength ?? '--'}</div>
          </div>

          <div className="p-4 rounded-xl bg-[#252836] border border-[#2E3347]">
            <div className="flex justify-between items-center text-xs text-[#94A3B8]">
              <span>NoOfLettersInURL</span>
              <Hash className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold font-mono text-[#F8FAFC] mt-2">{f.NoOfLettersInURL ?? '--'}</div>
          </div>

          <div className="p-4 rounded-xl bg-[#252836] border border-[#2E3347]">
            <div className="flex justify-between items-center text-xs text-[#94A3B8]">
              <span>LetterRatioInURL</span>
              <Hash className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold font-mono text-[#F8FAFC] mt-2">{f.LetterRatioInURL ?? '--'}</div>
          </div>

          <div className="p-4 rounded-xl bg-[#252836] border border-[#2E3347]">
            <div className="flex justify-between items-center text-xs text-[#94A3B8]">
              <span>NoOfDegitsInURL</span>
              <Hash className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold font-mono text-[#F8FAFC] mt-2">{f.NoOfDegitsInURL ?? '--'}</div>
          </div>

          <div className="p-4 rounded-xl bg-[#252836] border border-[#2E3347]">
            <div className="flex justify-between items-center text-xs text-[#94A3B8]">
              <span>DegitRatioInURL</span>
              <Hash className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold font-mono text-[#F8FAFC] mt-2">{f.DegitRatioInURL ?? '--'}</div>
          </div>

          <div className="p-4 rounded-xl bg-[#252836] border border-[#2E3347]">
            <div className="flex justify-between items-center text-xs text-[#94A3B8]">
              <span>NoOfOtherSpecialCharsInURL</span>
              <Hash className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold font-mono text-[#F8FAFC] mt-2">{f.NoOfOtherSpecialCharsInURL ?? '--'}</div>
          </div>

          <div className="p-4 rounded-xl bg-[#252836] border border-[#2E3347]">
            <div className="flex justify-between items-center text-xs text-[#94A3B8]">
              <span>SpacialCharRatioInURL</span>
              <Hash className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold font-mono text-[#F8FAFC] mt-2">{f.SpacialCharRatioInURL ?? '--'}</div>
          </div>

          <div className="p-4 rounded-xl bg-[#252836] border border-[#2E3347]">
            <div className="flex justify-between items-center text-xs text-[#94A3B8]">
              <span>NoOfEqualsInURL</span>
              <Hash className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold font-mono text-[#F8FAFC] mt-2">{f.NoOfEqualsInURL ?? '--'}</div>
          </div>

          <div className="p-4 rounded-xl bg-[#252836] border border-[#2E3347]">
            <div className="flex justify-between items-center text-xs text-[#94A3B8]">
              <span>NoOfQMarkInURL</span>
              <Hash className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold font-mono text-[#F8FAFC] mt-2">{f.NoOfQMarkInURL ?? '--'}</div>
          </div>

          <div className="p-4 rounded-xl bg-[#252836] border border-[#2E3347]">
            <div className="flex justify-between items-center text-xs text-[#94A3B8]">
              <span>NoOfAmpersandInURL</span>
              <Hash className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold font-mono text-[#F8FAFC] mt-2">{f.NoOfAmpersandInURL ?? '--'}</div>
          </div>

          <div className="p-4 rounded-xl bg-[#252836] border border-[#2E3347]">
            <div className="flex justify-between items-center text-xs text-[#94A3B8]">
              <span>CharContinuationRate</span>
              <Hash className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-bold font-mono text-[#F8FAFC] mt-2">{f.CharContinuationRate ?? '--'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
