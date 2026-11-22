import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Layers, 
  ArrowRight, 
  Code2, 
  GitBranch, 
  Lock, 
  CheckCircle2,
  FileSearch,
  Binary,
  Server,
  Zap,
  RefreshCw
} from 'lucide-react';
import { scanService } from '../services/scanService';
import { ModelInfo } from '../types';

export const AboutPage: React.FC = () => {
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);

  useEffect(() => {
    async function fetchInfo() {
      try {
        const info = await scanService.getModelInfo();
        setModelInfo(info);
      } catch (e) {
        // Fallback gracefully
      }
    }
    fetchInfo();
  }, []);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8FAFC]">
          About PhishingGuard System
        </h2>
        <p className="text-sm text-[#94A3B8] mt-1">
          Cybersecurity architecture, Random Forest algorithm rationale, and static detection workflow.
        </p>
      </div>

      {/* Overview Card */}
      <div className="bg-[#1A1D27] border border-[#2E3347] rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6366F1]/15 text-[#818CF8] text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-[#22D3EE]" />
          <span>ACADEMIC PROJECT: UAS KEAMANAN INFORMASI</span>
        </div>
        <h3 className="text-xl font-bold text-[#F8FAFC]">
          Implementasi Machine Learning untuk Deteksi dan Klasifikasi URL Phishing Menggunakan Algoritma Random Forest
        </h3>
        <p className="text-sm text-[#94A3B8] leading-relaxed">
          Phishing merupakan salah satu teknik rekayasa sosial tertua namun tetap menjadi vektor serangan siber paling mematikan di dunia digital. Melalui replikasi visual atau penipuan nama domain terpercaya, penyerang berupaya mencuri kredensial, token autentikasi, serta data finansial sensitif pengguna.
        </p>
        <p className="text-sm text-[#94A3B8] leading-relaxed">
          <strong className="text-[#F8FAFC]">PhishingGuard</strong> dirancang untuk mengatasi keterbatasan metode tradisional (seperti Blacklisting yang lambat merespons domain baru / Zero-Day Attacks) dengan mengimplementasikan pendekatan berbasis pembelajaran mesin (Machine Learning) secara murni statis tanpa mengakses server target (<em className="text-[#22D3EE]">Zero-Network Quarantine</em>).
        </p>
      </div>

      {/* Model Specifications & Specs if loaded */}
      {modelInfo && (
        <div className="bg-[#1A1D27] border border-[#2E3347] rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-[#2E3347] pb-3">
            <h3 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2">
              <Server className="w-5 h-5 text-[#22D3EE]" />
              <span>Live Engine Specs & Hyperparameters</span>
            </h3>
            <span className="text-xs font-mono text-[#10B981] bg-[#10B981]/15 px-2 py-0.5 rounded border border-[#10B981]/30">
              Active v{modelInfo.model_version}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 bg-[#252836] rounded-xl border border-[#2E3347]">
              <span className="text-[#64748B] block font-sans">N Estimators</span>
              <span className="text-[#F8FAFC] font-bold text-sm mt-0.5 block">{modelInfo.hyperparameters?.n_estimators || 100} Trees</span>
            </div>
            <div className="p-3 bg-[#252836] rounded-xl border border-[#2E3347]">
              <span className="text-[#64748B] block font-sans">Max Depth</span>
              <span className="text-[#F8FAFC] font-bold text-sm mt-0.5 block">{modelInfo.hyperparameters?.max_depth || 25} Levels</span>
            </div>
            <div className="p-3 bg-[#252836] rounded-xl border border-[#2E3347]">
              <span className="text-[#64748B] block font-sans">Split Criterion</span>
              <span className="text-[#F8FAFC] font-bold text-sm mt-0.5 block">{modelInfo.hyperparameters?.criterion?.toUpperCase() || 'GINI'}</span>
            </div>
            <div className="p-3 bg-[#252836] rounded-xl border border-[#2E3347]">
              <span className="text-[#64748B] block font-sans">Features Count</span>
              <span className="text-[#22D3EE] font-bold text-sm mt-0.5 block">{modelInfo.features_count || 16} Features</span>
            </div>
          </div>
        </div>
      )}

      {/* Detection Workflow Pipeline Visualization */}
      <div className="bg-[#1A1D27] border border-[#2E3347] rounded-2xl p-6 sm:p-8 space-y-6">
        <div>
          <h3 className="text-base font-bold text-[#F8FAFC]">Detection Architecture & Pipeline</h3>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Tahapan end-to-end dari input URL pengguna hingga inferensi model klasifikasi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
          {/* Step 1 */}
          <div className="p-4 rounded-xl bg-[#252836] border border-[#2E3347] flex flex-col justify-between">
            <div>
              <div className="w-7 h-7 rounded-lg bg-[#6366F1]/20 text-[#818CF8] flex items-center justify-center font-bold font-mono text-xs mb-3">
                1
              </div>
              <h4 className="text-xs font-bold text-[#F8FAFC]">User Input</h4>
              <p className="text-[11px] text-[#94A3B8] mt-1">Pengguna memasukkan target link/URL yang mencurigakan.</p>
            </div>
            <div className="mt-3 text-[10px] font-mono text-[#22D3EE]">Raw String</div>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-xl bg-[#252836] border border-[#2E3347] flex flex-col justify-between">
            <div>
              <div className="w-7 h-7 rounded-lg bg-[#6366F1]/20 text-[#818CF8] flex items-center justify-center font-bold font-mono text-xs mb-3">
                2
              </div>
              <h4 className="text-xs font-bold text-[#F8FAFC]">URL Parsing</h4>
              <p className="text-[11px] text-[#94A3B8] mt-1">Parsing komponen protokol, domain, TLD, query, dan path.</p>
            </div>
            <div className="mt-3 text-[10px] font-mono text-[#10B981]">Sanitization</div>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-xl bg-[#252836] border border-[#2E3347] flex flex-col justify-between">
            <div>
              <div className="w-7 h-7 rounded-lg bg-[#6366F1]/20 text-[#818CF8] flex items-center justify-center font-bold font-mono text-xs mb-3">
                3
              </div>
              <h4 className="text-xs font-bold text-[#F8FAFC]">Feature Extraction</h4>
              <p className="text-[11px] text-[#94A3B8] mt-1">Ekstraksi 16 parameter leksikal deterministik secara instan.</p>
            </div>
            <div className="mt-3 text-[10px] font-mono text-[#818CF8]">16D Vector</div>
          </div>

          {/* Step 4 */}
          <div className="p-4 rounded-xl bg-[#252836] border border-[#2E3347] flex flex-col justify-between">
            <div>
              <div className="w-7 h-7 rounded-lg bg-[#6366F1]/20 text-[#818CF8] flex items-center justify-center font-bold font-mono text-xs mb-3">
                4
              </div>
              <h4 className="text-xs font-bold text-[#F8FAFC]">Random Forest</h4>
              <p className="text-[11px] text-[#94A3B8] mt-1">Ensemble voting dari 100 pohon keputusan terlatih.</p>
            </div>
            <div className="mt-3 text-[10px] font-mono text-[#22D3EE]">Tree Voting</div>
          </div>

          {/* Step 5 */}
          <div className="p-4 rounded-xl bg-[#252836] border border-[#2E3347] flex flex-col justify-between">
            <div>
              <div className="w-7 h-7 rounded-lg bg-[#10B981]/20 text-[#10B981] flex items-center justify-center font-bold font-mono text-xs mb-3">
                5
              </div>
              <h4 className="text-xs font-bold text-[#F8FAFC]">Classification</h4>
              <p className="text-[11px] text-[#94A3B8] mt-1">Output label: Phishing vs Legitimate beserta probabilitas.</p>
            </div>
            <div className="mt-3 text-[10px] font-mono text-[#10B981]">Verdict & Risk</div>
          </div>
        </div>
      </div>

      {/* Why Random Forest? */}
      <div className="bg-[#1A1D27] border border-[#2E3347] rounded-2xl p-6 sm:p-8 space-y-4">
        <h3 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2">
          <Cpu className="w-5 h-5 text-[#818CF8]" />
          <span>Mengapa Memilih Algoritma Random Forest?</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#94A3B8] pt-2">
          <div className="p-4 rounded-xl bg-[#252836] border border-[#2E3347] space-y-1.5">
            <h5 className="font-semibold text-[#F8FAFC] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
              Resisten terhadap Overfitting
            </h5>
            <p className="leading-relaxed">
              Dengan mengombinasikan ratusan pohon keputusan (Ensemble Bagging) yang dilatih pada subset acak, varians model berkurang drastis dibandingkan single Decision Tree.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#252836] border border-[#2E3347] space-y-1.5">
            <h5 className="font-semibold text-[#F8FAFC] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
              Transparansi Feature Importance
            </h5>
            <p className="leading-relaxed">
              Random Forest menghasilkan bobot Gini Impurity yang transparan, memungkinkan analis keamanan memahami alasan tepat mengapa suatu URL diklasifikasikan sebagai bahaya.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#252836] border border-[#2E3347] space-y-1.5">
            <h5 className="font-semibold text-[#F8FAFC] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
              Inferensi Berkecepatan Tinggi (&lt; 20ms)
            </h5>
            <p className="leading-relaxed">
              Setelah pohon-pohon selesai dilatih, fase inferensi hanya melibatkan penelusuran kondisi IF-THEN sederhana sehingga dapat memproses klasifikasi dalam hitungan milidetik.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#252836] border border-[#2E3347] space-y-1.5">
            <h5 className="font-semibold text-[#F8FAFC] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
              Karakter Non-Linear Leksikal
            </h5>
            <p className="leading-relaxed">
              Struktur URL melibatkan interaksi non-linear (misalnya: URL panjang aman jika domain pendek, tapi berbahaya jika subdomain bertingkat), yang sangat efektif dipetakan oleh pohon keputusan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
