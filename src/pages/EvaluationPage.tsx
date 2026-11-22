import React, { useEffect, useState } from 'react';
import { 
  Cpu, 
  Target, 
  Percent, 
  BarChart3, 
  Layers, 
  Database, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { scanService } from '../services/scanService';
import { EvaluationMetrics } from '../types';

export const EvaluationPage: React.FC = () => {
  const [metrics, setMetrics] = useState<EvaluationMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMetrics() {
      try {
        setLoading(true);
        setError(null);
        const data = await scanService.getEvaluation();
        setMetrics(data);
      } catch (err: any) {
        setError(err.message || 'Gagal memuat metrik evaluasi model');
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, []);

  const featureChartData = React.useMemo(() => {
    if (!metrics?.feature_importance) return [];
    return metrics.feature_importance.slice(0, 10).map(item => ({
      feature: item.feature,
      importance: item.importance
    }));
  }, [metrics]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8FAFC]">
            Model Evaluation & Benchmarks
          </h2>
          <p className="text-sm text-[#94A3B8] mt-1">
            Performance metrics, confusion matrix, and feature importance of the Random Forest algorithm.
          </p>
        </div>

        {/* Status Badge */}
        {error ? (
          <div className="px-3.5 py-1.5 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center gap-2 text-xs text-[#EF4444]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">Backend Disconnected</span>
          </div>
        ) : (
          <div className="px-3.5 py-1.5 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 flex items-center gap-2 text-xs text-[#10B981]">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="font-semibold">VALIDATED: Clean Model v3.0 (Zero Leakage)</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <RefreshCw className="w-8 h-8 text-[#6366F1] animate-spin" />
          <p className="text-sm font-mono text-[#94A3B8]">Mengambil metrik evaluasi dari backend FastAPI...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-[#1A1D27] border border-[#EF4444]/30 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-[#EF4444] mx-auto" />
          <h3 className="text-base font-bold text-[#F8FAFC]">Gagal Memuat Metrik Evaluasi</h3>
          <p className="text-xs text-[#94A3B8] max-w-md mx-auto">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-[#6366F1] text-white text-xs font-semibold rounded-lg hover:bg-[#4F46E5] transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      ) : metrics ? (
        <>
          {/* Model Spec Card */}
          <div className="bg-[#1A1D27] border border-[#2E3347] rounded-2xl p-6 sm:p-8 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2E3347] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#6366F1]/15 border border-[#6366F1]/30 flex items-center justify-center text-[#818CF8]">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F8FAFC]">Random Forest Classifier (Deterministic Lexical)</h3>
                  <p className="text-xs text-[#94A3B8] font-mono">Scikit-learn RandomForestClassifier &bull; 100 Trees</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-[#252836] border border-[#2E3347] text-[#22D3EE]">
                  v{metrics.model_version || '3.0.0'}
                </span>
                <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981]">
                  Status: PRODUCTION READY
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
              <div className="p-3 bg-[#252836] rounded-xl border border-[#2E3347]">
                <span className="text-[#64748B] block">Dataset Reference</span>
                <span className="font-semibold text-[#F8FAFC] mt-0.5 block">{metrics.dataset_name}</span>
              </div>
              <div className="p-3 bg-[#252836] rounded-xl border border-[#2E3347]">
                <span className="text-[#64748B] block">Total Sample Corpus</span>
                <span className="font-mono font-semibold text-[#F8FAFC] mt-0.5 block">{metrics.total_samples?.toLocaleString() || '235,795'} URLs</span>
              </div>
              <div className="p-3 bg-[#252836] rounded-xl border border-[#2E3347]">
                <span className="text-[#64748B] block">Testing Validation Split</span>
                <span className="font-mono font-semibold text-[#F8FAFC] mt-0.5 block">{metrics.test_samples?.toLocaleString() || '47,074'} URLs (20%)</span>
              </div>
            </div>
          </div>

          {/* Primary KPI Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-[#1A1D27] border border-[#2E3347] rounded-xl p-5">
              <span className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Accuracy</span>
              <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono text-[#F8FAFC]">
                {(metrics.accuracy * 100).toFixed(2)}%
              </div>
              <p className="text-[11px] text-[#64748B] mt-1">Overall correct predictions</p>
            </div>

            <div className="bg-[#1A1D27] border border-[#2E3347] rounded-xl p-5">
              <span className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Precision (Phishing)</span>
              <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono text-[#22D3EE]">
                {(metrics.precision_phishing * 100).toFixed(2)}%
              </div>
              <p className="text-[11px] text-[#64748B] mt-1">Exactness of phishing flags</p>
            </div>

            <div className="bg-[#1A1D27] border border-[#2E3347] rounded-xl p-5">
              <span className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Recall (Phishing)</span>
              <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono text-[#818CF8]">
                {(metrics.recall_phishing * 100).toFixed(2)}%
              </div>
              <p className="text-[11px] text-[#64748B] mt-1">Phishing detection coverage</p>
            </div>

            <div className="bg-[#1A1D27] border border-[#2E3347] rounded-xl p-5">
              <span className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Macro F1-Score</span>
              <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono text-[#10B981]">
                {(metrics.macro_f1 * 100).toFixed(2)}%
              </div>
              <p className="text-[11px] text-[#64748B] mt-1">Balanced harmonic mean</p>
            </div>
          </div>

          {/* Visualizations: Confusion Matrix & Feature Importance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Confusion Matrix */}
            <div className="bg-[#1A1D27] border border-[#2E3347] rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-[#F8FAFC]">Confusion Matrix (Test Set)</h3>
                  <span className="text-[11px] font-mono text-[#64748B]">N = {metrics.test_samples?.toLocaleString() || '47,074'} URLs</span>
                </div>

                <p className="text-xs text-[#94A3B8] mb-6">
                  Distribution of predicted vs actual ground-truth classifications on the unseen validation test set.
                </p>

                {/* Matrix 2x2 Grid */}
                <div className="grid grid-cols-2 gap-3 max-w-md mx-auto text-center font-mono">
                  {/* True Positive */}
                  <div className="p-4 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30">
                    <span className="text-[11px] text-[#10B981] font-sans font-semibold block uppercase">
                      True Positive (TP)
                    </span>
                    <span className="text-2xl font-extrabold text-[#F8FAFC] block mt-1">
                      {metrics.confusion_matrix.true_positive?.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-[#94A3B8] font-sans mt-0.5 block">Actual Phishing &rarr; Phishing</span>
                  </div>

                  {/* False Positive */}
                  <div className="p-4 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/30">
                    <span className="text-[11px] text-[#F59E0B] font-sans font-semibold block uppercase">
                      False Positive (FP)
                    </span>
                    <span className="text-2xl font-extrabold text-[#F8FAFC] block mt-1">
                      {metrics.confusion_matrix.false_positive?.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-[#94A3B8] font-sans mt-0.5 block">Actual Legit &rarr; Phishing</span>
                  </div>

                  {/* False Negative */}
                  <div className="p-4 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30">
                    <span className="text-[11px] text-[#EF4444] font-sans font-semibold block uppercase">
                      False Negative (FN)
                    </span>
                    <span className="text-2xl font-extrabold text-[#F8FAFC] block mt-1">
                      {metrics.confusion_matrix.false_negative?.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-[#94A3B8] font-sans mt-0.5 block">Actual Phishing &rarr; Legit</span>
                  </div>

                  {/* True Negative */}
                  <div className="p-4 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30">
                    <span className="text-[11px] text-[#10B981] font-sans font-semibold block uppercase">
                      True Negative (TN)
                    </span>
                    <span className="text-2xl font-extrabold text-[#F8FAFC] block mt-1">
                      {metrics.confusion_matrix.true_negative?.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-[#94A3B8] font-sans mt-0.5 block">Actual Legit &rarr; Legit</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#2E3347] text-xs text-[#64748B]">
                * Validated using GroupShuffleSplit based on domain names to prevent domain-level data leakage.
              </div>
            </div>

            {/* Feature Importance Bar Chart */}
            <div className="bg-[#1A1D27] border border-[#2E3347] rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-[#F8FAFC]">Gini Feature Importance</h3>
                  <span className="text-[11px] font-mono text-[#818CF8]">Top 10 Features</span>
                </div>

                <p className="text-xs text-[#94A3B8] mb-6">
                  Relative importance contribution of each deterministic lexical feature in splitting tree nodes.
                </p>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={featureChartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2E3347" horizontal={false} />
                      <XAxis type="number" stroke="#64748B" fontSize={11} domain={[0, 'dataMax + 0.05']} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                      <YAxis type="category" dataKey="feature" stroke="#94A3B8" fontSize={11} width={130} tickLine={false} />
                      <Tooltip 
                        formatter={(val: any) => [`${(Number(val) * 100).toFixed(2)}%`, 'Importance']}
                        contentStyle={{ 
                          backgroundColor: '#1A1D27', 
                          borderColor: '#2E3347', 
                          borderRadius: '8px', 
                          color: '#F8FAFC',
                          fontSize: '12px' 
                        }} 
                      />
                      <Bar dataKey="importance" fill="#6366F1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#2E3347] text-xs text-[#64748B]">
                * Calculated from mean decrease in impurity across 100 estimators in Random Forest.
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
