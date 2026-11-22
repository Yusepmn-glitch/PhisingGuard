import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Download, 
  ExternalLink, 
  ChevronLeft,
  ChevronRight,
  WifiOff
} from 'lucide-react';
import { scanService } from '../services/scanService';
import { HistoryItem } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

export const HistoryPage: React.FC = () => {
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PHISHING' | 'LEGITIMATE'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await scanService.getHistory(100);
        setHistoryList(res.history);
      } catch (err: any) {
        setErrorMsg(err.message || 'Gagal memuat riwayat inspeksi dari backend.');
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  const filteredHistory = useMemo(() => {
    return historyList.filter((item) => {
      const matchesSearch = item.url.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchesStatus = 
        statusFilter === 'ALL' ||
        (statusFilter === 'PHISHING' && item.prediction === 'PHISHING_DETECTED') ||
        (statusFilter === 'LEGITIMATE' && item.prediction === 'LEGITIMATE');
      return matchesSearch && matchesStatus;
    });
  }, [historyList, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage) || 1;
  const paginatedList = filteredHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExportCSV = () => {
    if (filteredHistory.length === 0) return;
    const headers = ['ID', 'URL', 'Prediction', 'Prob_Legitimate', 'Prob_Phishing', 'Risk_Level', 'Scanned_At'];
    const rows = filteredHistory.map((s) => [
      s.id,
      `"${s.url.replace(/"/g, '""')}"`,
      s.prediction,
      s.prob_legitimate,
      s.prob_phishing,
      s.risk_level,
      s.scanned_at
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `phishingguard-history-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8FAFC]">
            Scan History & Audit Logs
          </h2>
          <p className="text-sm text-[#94A3B8] mt-1">
            Browse, search, and export archived lexical threat evaluations from SQLite database.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={filteredHistory.length === 0}
          className="px-4 py-2.5 rounded-xl bg-[#252836] hover:bg-[#2E3347] border border-[#2E3347] text-[#F8FAFC] text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <Download className="w-4 h-4 text-[#22D3EE]" />
          <span>Export CSV</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center gap-2 text-xs text-[#EF4444]">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#1A1D27] border border-[#2E3347] rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search inspected URL..."
            className="w-full bg-[#0F1117] border border-[#2E3347] rounded-lg py-2 pl-10 pr-3 text-xs text-[#F8FAFC] placeholder-[#64748B] font-mono outline-hidden focus:border-[#6366F1]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs text-[#64748B] flex items-center gap-1 font-medium mr-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          <button
            onClick={() => { setStatusFilter('ALL'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-[#6366F1] text-white'
                : 'bg-[#252836] text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            All ({historyList.length})
          </button>
          <button
            onClick={() => { setStatusFilter('PHISHING'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === 'PHISHING'
                ? 'bg-[#EF4444] text-white'
                : 'bg-[#252836] text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            Phishing ({historyList.filter(s => s.prediction === 'PHISHING_DETECTED').length})
          </button>
          <button
            onClick={() => { setStatusFilter('LEGITIMATE'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === 'LEGITIMATE'
                ? 'bg-[#10B981] text-white'
                : 'bg-[#252836] text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            Legitimate ({historyList.filter(s => s.prediction === 'LEGITIMATE').length})
          </button>
        </div>
      </div>

      {/* Scans Content: Desktop Table & Mobile Cards */}
      <div className="bg-[#1A1D27] border border-[#2E3347] rounded-xl overflow-hidden shadow-xl">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#252836]/60 text-[#94A3B8] border-b border-[#2E3347] uppercase font-mono text-[11px]">
              <tr>
                <th className="py-3 px-4">Inspection ID</th>
                <th className="py-3 px-4">URL</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Prob. Phishing</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E3347]/60 text-[#F8FAFC]">
              {paginatedList.length > 0 ? (
                paginatedList.map((item) => (
                  <tr key={item.id} className="hover:bg-[#252836]/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#64748B]">
                      {item.id}
                    </td>
                    <td className="py-3.5 px-4 font-mono max-w-sm truncate text-[#F8FAFC]">
                      {item.url}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={item.prediction} size="sm" riskLevel={item.risk_level} />
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold">
                      <span className={item.prediction === 'PHISHING_DETECTED' ? 'text-[#EF4444]' : 'text-[#10B981]'}>
                        {item.prob_phishing.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <span className={`px-2 py-0.5 rounded-sm border ${
                        item.risk_level === 'HIGH' ? 'bg-[#EF4444]/15 border-[#EF4444]/30 text-[#EF4444]' :
                        item.risk_level === 'MEDIUM' ? 'bg-[#F59E0B]/15 border-[#F59E0B]/30 text-[#F59E0B]' :
                        'bg-[#10B981]/15 border-[#10B981]/30 text-[#10B981]'
                      }`}>
                        {item.risk_level}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#64748B] font-mono text-[11px]">
                      {item.scanned_at}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/scan/${item.id}`}
                        className="inline-flex items-center gap-1 text-[#818CF8] hover:text-[#22D3EE] font-medium"
                      >
                        <span>Detail</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#64748B]">
                    {loading ? 'Memuat riwayat...' : 'Belum ada record inspeksi.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-[#2E3347]">
          {paginatedList.length > 0 ? (
            paginatedList.map((item) => (
              <div key={item.id} className="p-4 space-y-2.5">
                <div className="flex justify-between items-start gap-2">
                  <StatusBadge status={item.prediction} size="sm" riskLevel={item.risk_level} />
                  <span className="font-mono text-xs font-bold text-[#F8FAFC]">
                    {item.prob_phishing.toFixed(1)}% Phish
                  </span>
                </div>
                <div className="font-mono text-xs text-[#F8FAFC] break-all">
                  {item.url}
                </div>
                <div className="flex justify-between items-center text-[11px] text-[#64748B] pt-1">
                  <span>{item.scanned_at}</span>
                  <Link
                    to={`/scan/${item.id}`}
                    className="text-[#818CF8] hover:text-[#22D3EE] font-medium flex items-center gap-1"
                  >
                    <span>Detail</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-[#64748B]">
              Belum ada data scan.
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-[#2E3347] flex items-center justify-between text-xs text-[#94A3B8]">
          <div>
            Showing <span className="font-semibold text-[#F8FAFC]">{paginatedList.length}</span> of{' '}
            <span className="font-semibold text-[#F8FAFC]">{filteredHistory.length}</span> logs
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-[#2E3347] bg-[#252836] hover:bg-[#2E3347] text-[#94A3B8] hover:text-[#F8FAFC] disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs text-[#F8FAFC]">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-[#2E3347] bg-[#252836] hover:bg-[#2E3347] text-[#94A3B8] hover:text-[#F8FAFC] disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
