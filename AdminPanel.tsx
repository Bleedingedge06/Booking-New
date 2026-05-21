
import React, { useState, useMemo } from 'react';
import { 
  Save, RefreshCw, DollarSign, Settings2, ArrowLeft, ShieldCheck, 
  QrCode, AlertTriangle, Copy, Check, Lock, ShieldAlert, Eye, 
  CheckCircle2, Home, Bath, Bed, Layers, Calculator, Sparkles, 
  Building2, Wind, Waves, Droplets, Percent, CalendarDays, 
  Layout as WindowIcon, Clock, Maximize, FileText, ChevronDown, 
  ChevronUp, Palette, Type as TypeIcon, Zap, UserCheck, Trash2,
  Plus, Grid, ListChecks, Blinds as BlindsIcon
} from 'lucide-react';
import { 
  PricingConfig, ServiceType, ServicePricing, FrequencyType, 
  PressureWashingMode, PdfSection, PdfField, PropertyDetails 
} from './types';
import { EXTRAS_DEFS, SERVICES, DEFAULT_PDF_TEMPLATE, PROPERTY_OPTIONS, WINDOW_ADDONS } from './constants';
import * as OTPAuth from 'otpauth';

interface AdminPanelProps {
  config: PricingConfig;
  onSave: (config: PricingConfig) => void;
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ config, onSave, onClose }) => {
  const [localConfig, setLocalConfig] = useState<PricingConfig>({
    ...config,
    pdfTemplate: config.pdfTemplate || DEFAULT_PDF_TEMPLATE
  });
  const [activeService, setActiveService] = useState<ServiceType>('end_of_lease');
  const [activeTab, setActiveTab] = useState<'pricing' | 'pdf' | 'security'>('pricing');
  const [status, setStatus] = useState<'idle' | 'saved'>('idle');
  const [copied, setCopied] = useState(false);

  // --- SIMULATOR STATE ---
  const [simBedrooms, setSimBedrooms] = useState('1 Bedroom');
  const [simBathrooms, setSimBathrooms] = useState('1 Bathroom');
  const [simStoreys, setSimStoreys] = useState('1 Storey');
  const [simExtras, setSimExtras] = useState<string[]>([]);
  const [simFrequency, setSimFrequency] = useState<FrequencyType>('Weekly');
  const [simWindowCount, setSimWindowCount] = useState<number>(10);
  const [simCategory, setSimCategory] = useState<'Residential' | 'Commercial'>('Residential');
  const [simPressureMode, setSimPressureMode] = useState<PressureWashingMode>('manhours');
  const [simPressureValue, setSimPressureValue] = useState<number>(4);

  const mfaSecret = localStorage.getItem('sparkleclean_mfa_secret') || '';
  const currentPricing = localConfig.services[activeService];
  const serviceInfo = SERVICES.find(s => s.id === activeService);

  const simulatedTotal = useMemo(() => {
    const p = currentPricing;
    let total = 0;
    const isComm = simCategory === 'Commercial';

    if (activeService === 'window') {
      const mins = isComm ? (p.commWindowMinutes || 15) : (p.resWindowMinutes || 10);
      const hourly = isComm ? (p.commWindowHourly || 110) : (p.resWindowHourly || 80);
      total = ((simWindowCount * mins) / 60) * hourly;
      simExtras.forEach(id => total += (p.extrasPrices[id] || 0));
    } else if (activeService === 'pressure_washing') {
      const rate = simPressureMode === 'manhours' 
        ? (isComm ? p.commercialPressureHourlyRate : p.residentialPressureHourlyRate)
        : (isComm ? p.commercialCostPerSqMeter : p.residentialCostPerSqMeter);
      total = simPressureValue * (rate || 0);
    } else {
      const base = (p.basePrices[simBedrooms] || 0) + (p.bathroomPrices[simBathrooms] || 0) + (p.storeyPrices[simStoreys] || 0);
      let extrasTotal = 0;
      simExtras.forEach(id => extrasTotal += (p.extrasPrices[id] || 0));
      total = base + extrasTotal;
      if (activeService === 'regular' && p.frequencyDiscounts) {
        total = total * (1 - (p.frequencyDiscounts[simFrequency] || 0) / 100);
      }
    }
    return total;
  }, [activeService, currentPricing, simBedrooms, simBathrooms, simStoreys, simExtras, simFrequency, simWindowCount, simCategory, simPressureMode, simPressureValue]);

  const updatePrice = (cat: keyof ServicePricing, key: string, val: number) => {
    setLocalConfig(prev => ({
      ...prev,
      services: {
        ...prev.services,
        [activeService]: {
          ...prev.services[activeService],
          [cat]: { ...(prev.services[activeService][cat] as any), [key]: val }
        }
      }
    }));
  };

  const updateVal = (key: keyof ServicePricing, val: any) => {
    setLocalConfig(prev => ({
      ...prev,
      services: { ...prev.services, [activeService]: { ...prev.services[activeService], [key]: val } }
    }));
  };

  const handleSave = () => {
    onSave(localConfig);
    setStatus('saved');
    setTimeout(() => setStatus('idle'), 2000);
  };

  const qrUrl = useMemo(() => {
    if (!mfaSecret) return '';
    const totp = new OTPAuth.TOTP({ issuer: 'CENVIRA', label: 'Admin', algorithm: 'SHA1', digits: 6, period: 30, secret: mfaSecret });
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(totp.toString())}`;
  }, [mfaSecret]);

  return (
    <div className="min-h-screen bg-[#F8FAFB]">
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3 text-slate-900"><Settings2 className="w-6 h-6" /><h1 className="text-xl font-bold font-heading uppercase tracking-widest">Control Terminal</h1></div>
          <div className="flex gap-1">{['pricing', 'pdf', 'security'].map((tab) => (<button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' : 'text-slate-400 hover:text-slate-900'}`}>{tab}</button>))}</div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="px-5 py-2.5 text-slate-500 hover:text-slate-900 font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all"><ArrowLeft className="w-4 h-4" /> Exit</button>
          <button onClick={handleSave} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2 active:scale-95">{status === 'saved' ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}{status === 'saved' ? 'Synced' : 'Sync Engine'}</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-10 space-y-10">
        {activeTab === 'pricing' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-10">
            <section className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1"><h2 className="text-2xl font-black text-slate-900 tracking-tight">Deployment Engine</h2><p className="text-slate-500 text-sm font-medium">Select a protocol to modify its calculation matrix.</p></div>
                <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-900 shadow-sm">{React.cloneElement(serviceInfo?.icon as React.ReactElement<any>, { className: "w-4 h-4" })}</div><span className="text-xs font-black uppercase tracking-widest text-slate-900">{serviceInfo?.title}</span></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {SERVICES.map(s => (<button key={s.id} onClick={() => { setActiveService(s.id); setSimExtras([]); }} className={`p-4 rounded-2xl border-2 transition-all group flex flex-col items-center gap-3 ${activeService === s.id ? 'bg-slate-900 border-slate-900 shadow-2xl' : 'bg-white border-slate-100 hover:border-slate-300'}`}><div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeService === s.id ? 'bg-white text-slate-900' : 'bg-slate-50 text-slate-400 group-hover:text-slate-900'}`}>{React.cloneElement(s.icon as React.ReactElement<any>, { className: "w-4 h-4" })}</div><span className={`text-[9px] font-black uppercase tracking-widest ${activeService === s.id ? 'text-white' : 'text-slate-500'}`}>{s.title.split(' ')[0]}</span></button>))}
              </div>

              <div className="p-8 bg-slate-900 rounded-3xl text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Calculator className="w-48 h-48" /></div>
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-12">
                  <div className="lg:col-span-2 space-y-8">
                    <div className="flex items-center gap-3"><Zap className="w-5 h-5 text-blue-400" /><h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Precision Protocol Simulator</h4></div>
                    {activeService === 'window' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Site Classification</label>
                          <div className="flex gap-2">
                            {['Residential', 'Commercial'].map(c => (<button key={c} onClick={() => setSimCategory(c as any)} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase border-2 transition-all ${simCategory === c ? 'bg-white text-slate-900 border-white' : 'bg-white/5 border-white/10'}`}>{c}</button>))}
                          </div>
                        </div>
                        <div className="space-y-4">
                          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Window Unit Count</label>
                          <input type="number" value={simWindowCount} onChange={(e) => setSimWindowCount(Number(e.target.value))} className="w-full bg-white/5 border-2 border-white/10 rounded-xl px-4 py-3 text-xl font-bold outline-none" />
                        </div>
                        <div className="md:col-span-2 space-y-3">
                          <label className="block text-[9px] font-black uppercase text-slate-400">Addon Verification</label>
                          <div className="flex flex-wrap gap-2">
                            {WINDOW_ADDONS.map(ex => (<button key={ex.id} onClick={() => setSimExtras(prev => prev.includes(ex.id) ? prev.filter(i => i !== ex.id) : [...prev, ex.id])} className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${simExtras.includes(ex.id) ? 'bg-[#7EA172] border-[#7EA172] text-slate-900' : 'bg-white/5 border-white/10'}`}>{ex.name}</button>))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        <div className="grid grid-cols-3 gap-4">
                          {['Bedrooms', 'Bathrooms', 'Storeys'].map((label, idx) => (
                            <div key={label}>
                              <label className="block text-[9px] font-black uppercase text-slate-400 mb-2">{label}</label>
                              <select 
                                value={idx === 0 ? simBedrooms : idx === 1 ? simBathrooms : simStoreys} 
                                onChange={(e) => [setSimBedrooms, setSimBathrooms, setSimStoreys][idx](e.target.value)} 
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold"
                              >
                                {Object.values(PROPERTY_OPTIONS)[idx].map((opt: string) => <option key={opt} value={opt} className="bg-slate-900">{opt}</option>)}
                              </select>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-3"><label className="block text-[9px] font-black uppercase text-slate-400">Performance Extras</label><div className="flex flex-wrap gap-2">{EXTRAS_DEFS.map(ex => (<button key={ex.id} onClick={() => setSimExtras(prev => prev.includes(ex.id) ? prev.filter(i => i !== ex.id) : [...prev, ex.id])} className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase border transition-all ${simExtras.includes(ex.id) ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white/5 border-white/10'}`}>{ex.name}</button>))}</div></div>
                      </div>
                    )}
                  </div>
                  <div className="bg-white/5 rounded-3xl p-10 flex flex-col items-center justify-center text-center border border-white/10"><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Calculated Quotation</p><div className="text-7xl font-black font-heading mb-2"><span className="text-2xl align-top mr-1 opacity-30">$</span>{Math.round(simulatedTotal)}</div><div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-[8px] font-black uppercase tracking-widest border border-green-500/30"><CheckCircle2 className="w-3 h-3" /> Ver. 2.5 Active</div></div>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {activeService === 'window' ? (
                <section className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6 lg:col-span-2">
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Wind className="w-4 h-4" /> Window Matrix Configuration</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-6">
                        <div className="flex items-center gap-3"><UserCheck className="w-4 h-4 text-blue-500" /><h4 className="text-[11px] font-black uppercase">Residential Protocol</h4></div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400">Mins Per Window</label><input type="number" value={currentPricing.resWindowMinutes} onChange={(e) => updateVal('resWindowMinutes', Number(e.target.value))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" /></div>
                          <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400">Hourly Rate ($)</label><input type="number" value={currentPricing.resWindowHourly} onChange={(e) => updateVal('resWindowHourly', Number(e.target.value))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" /></div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div className="flex items-center gap-3"><Building2 className="w-4 h-4 text-orange-500" /><h4 className="text-[11px] font-black uppercase">Commercial Protocol</h4></div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400">Mins Per Window</label><input type="number" value={currentPricing.commWindowMinutes} onChange={(e) => updateVal('commWindowMinutes', Number(e.target.value))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" /></div>
                          <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400">Hourly Rate ($)</label><input type="number" value={currentPricing.commWindowHourly} onChange={(e) => updateVal('commWindowHourly', Number(e.target.value))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" /></div>
                        </div>
                      </div>
                   </div>
                   <div className="pt-6 border-t border-slate-100">
                     <h4 className="text-[11px] font-black uppercase mb-4">Specific Performance Extras ($)</h4>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       {WINDOW_ADDONS.map(addon => (
                         <div key={addon.id} className="space-y-2">
                           <label className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-500">{addon.icon} {addon.name}</label>
                           <input type="number" value={currentPricing.extrasPrices[addon.id] || 0} onChange={(e) => updatePrice('extrasPrices', addon.id, Number(e.target.value))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                         </div>
                       ))}
                     </div>
                   </div>
                </section>
              ) : (
                <>
                  <section className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6 lg:col-span-2">
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Global Performance Extras</h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {EXTRAS_DEFS.map(ex => (
                          <div key={ex.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                            <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400">{ex.icon}</div><span className="text-[10px] font-bold text-slate-700 uppercase">{ex.name}</span></div>
                            <input type="number" value={currentPricing.extrasPrices[ex.id]} onChange={(e) => updatePrice('extrasPrices', ex.id, Number(e.target.value))} className="w-20 px-3 py-1.5 rounded-lg border border-slate-200 font-bold text-right" />
                          </div>
                        ))}
                     </div>
                  </section>
                </>
              )}
            </div>
          </div>
        )}
        {activeTab === 'security' && (
          <div className="max-w-2xl mx-auto"><section className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-xl space-y-10 text-center"><div className="mx-auto w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white shadow-2xl"><ShieldCheck className="w-10 h-10" /></div><div className="space-y-3"><h2 className="text-3xl font-black text-slate-900 tracking-tight">Security Protocol</h2><p className="text-slate-500 font-medium">Authentication vault status.</p></div><div className="pt-10 border-t border-slate-100 space-y-8"><div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 inline-block"><img src={qrUrl} alt="MFA Secret" className="w-56 h-56 mx-auto mix-blend-multiply rounded-xl" /></div><code className="text-sm font-mono text-slate-900 block break-all leading-relaxed bg-slate-100 p-4 rounded-xl">{mfaSecret}</code></div></section></div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
