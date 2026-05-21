
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Home, Bed, Bath, CheckCircle2, Info, ChevronDown, ShieldCheck, 
  Settings, Mail, User, MapPin, Phone, ShieldAlert, X, FileText, 
  Loader2, FileCheck, Calendar, Clock, MessagesSquare, Sparkles, 
  ArrowRight, ChevronLeft, ShieldEllipsis, Navigation, RefreshCcw, 
  Fingerprint, SearchX, CalendarDays, Layout as WindowIcon, DollarSign, 
  Maximize, Droplets, Tag, Pin as PinIcon, Search, Zap, Power, 
  Navigation2, ClipboardList, MessageSquare, Building2, UserCheck, Grid
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { 
  PROPERTY_OPTIONS, INCLUSIONS, WINDOW_INCLUSIONS, WINDOW_ADDONS,
  EXTRAS_DEFS, DEFAULT_PRICING, TIME_SLOTS, SERVICES, DEFAULT_PDF_TEMPLATE
} from './constants';
import { 
  PropertyDetails, BookingState, PricingConfig, CustomerDetails, 
  ServiceType, FrequencyType, PressureWashingMode, PropertyCategory, 
  PdfTemplateConfig, PdfSection, PdfField 
} from './types';
import AdminPanel from './AdminPanel';
import AdminAuth from './AdminAuth';

const MELBOURNE_CBD = { lat: -37.8136, lon: 144.9631 };

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateTravelFee(distance: number) {
  if (distance <= 50) return 0;
  const bands = Math.ceil((distance - 50) / 10);
  let total = 0; let currentAddition = 20;
  for (let i = 1; i <= bands; i++) { total += currentAddition; if (i >= 2) currentAddition += 10; }
  return total;
}

const TiltCard: React.FC<{ children: React.ReactNode; className?: string; innerClassName?: string; onClick?: () => void }> = ({ children, className = '', innerClassName = '', onClick }) => (
  <div className={`premium-card-container ${className}`} onClick={onClick}><div className={`premium-card ${innerClassName}`}><div className="relative z-30 h-full w-full">{children}</div></div></div>
);

const InclusionPortal: React.FC<{ name: string; details: string[]; rect: DOMRect; onClose: () => void }> = ({ name, details, rect, onClose }) => {
  const popupWidth = 320; const isSmallScreen = window.innerWidth < 768;
  let left = rect.left - popupWidth - 20; let top = rect.top + window.scrollY - 20;
  if (isSmallScreen || left < 20) { left = Math.max(20, Math.min(window.innerWidth - popupWidth - 20, rect.left - (popupWidth / 2))); top = rect.bottom + window.scrollY + 15; }
  return createPortal(<><div className="fixed inset-0 z-[9998] bg-black/5" onClick={(e) => { e.stopPropagation(); onClose(); }} /><div className="absolute z-[9999] modal-glass rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] border border-white/10 p-6 animate-in fade-in zoom-in slide-in-from-right-4 ring-1 ring-white/5" style={{ top: `${top}px`, left: `${left}px`, width: `${popupWidth}px`, maxHeight: '70vh' }} onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3"><h4 className="text-white font-black text-[13px] uppercase tracking-[0.15em] leading-tight pr-4">{name}</h4><button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors text-[#7EA172]"><X className="w-4 h-4" /></button></div><div className="overflow-y-auto max-h-[300px] custom-scrollbar pr-3"><ul className="space-y-3">{details.map((task, i) => (<li key={i} className="text-[#7EA172] text-[11px] font-bold leading-relaxed flex gap-3"><span className="opacity-40 shrink-0 mt-0.5">•</span><span>{task}</span></li>))}</ul></div></div></>, document.body);
};

const InclusionItem: React.FC<{ name: string; details: string[] }> = ({ name, details }) => {
  const [isOpen, setIsOpen] = useState(false); const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null); const triggerRef = useRef<HTMLButtonElement>(null);
  const toggleOpen = (e: React.MouseEvent) => { e.stopPropagation(); if (triggerRef.current) setTriggerRect(triggerRef.current.getBoundingClientRect()); setIsOpen(!isOpen); };
  return (<div className="p-4 flex items-center justify-between group/inc text-sm font-bold border-b border-white/5 last:border-0 relative"><div className="flex items-center gap-4"><CheckCircle2 className="w-5 h-5 opacity-60 shrink-0 text-white" /><span className="text-white line-clamp-1">{name}</span></div><button ref={triggerRef} onClick={toggleOpen} className={`flex items-center justify-center p-1.5 rounded-lg transition-all hover:scale-110 outline-none ${isOpen ? 'bg-[#7EA172] text-slate-900 shadow-lg' : 'text-[#7EA172] opacity-50 hover:opacity-100'}`}><Info className="w-5 h-5" /></button>{isOpen && triggerRect && (<InclusionPortal name={name} details={details} rect={triggerRect} onClose={() => setIsOpen(false)} />)}</div>);
};

export const DaysSelectorModal: React.FC<{ isOpen: boolean; onClose: () => void; selectedDays: string[]; onToggleDay: (day: string) => void }> = ({ isOpen, onClose, selectedDays, onToggleDay }) => {
  if (!isOpen) return null; const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return (<div className="fixed inset-0 z-[200] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in" onClick={onClose} /><div className="relative modal-glass rounded-[2rem] p-8 max-w-sm w-full space-y-6 shadow-2xl animate-in zoom-in border border-white/10"><div className="text-center space-y-2"><div className="mx-auto w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-[#7EA172] mb-2 border border-white/10"><CalendarDays className="w-6 h-6" /></div><h2 className="text-xl font-black font-heading text-white uppercase tracking-widest">Weekly Schedule</h2><p className="text-slate-300 text-xs font-medium">Select preferred operational days</p></div><div className="grid grid-cols-1 gap-2">{days.map(day => (<button key={day} onClick={() => onToggleDay(day)} className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${selectedDays.includes(day) ? 'bg-white border-white text-slate-900' : 'bg-white/5 border-transparent text-slate-100 hover:bg-white/10'}`}><span className="font-bold text-sm">{day}</span>{selectedDays.includes(day) && <CheckCircle2 className="w-4 h-4" />}</button>))}</div><button onClick={onClose} className="w-full py-4 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all">Finalize Schedule</button></div></div>);
};

// Added missing SuccessModal component
const SuccessModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#354F52]/90 backdrop-blur-xl animate-in fade-in" onClick={onClose} />
      <div className="relative modal-glass rounded-[3rem] p-12 max-w-sm w-full text-center space-y-8 shadow-2xl animate-in zoom-in border border-white/10">
        <div className="mx-auto w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center text-[#7EA172] mb-4 border border-white/10 shadow-inner">
          <FileCheck className="w-12 h-12" />
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl font-black font-heading text-white uppercase tracking-widest">Protocol Finalized</h2>
          <p className="text-slate-300 text-sm font-medium leading-relaxed">The quotation dossier has been synthesized and dispatched for processing.</p>
        </div>
        <button onClick={onClose} className="w-full py-5 bg-[#7EA172] hover:bg-[#8eb581] text-slate-900 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all shadow-xl active:scale-95">
          Acknowledge
        </button>
      </div>
    </div>,
    document.body
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'booking' | 'admin'>('home');
  const [showTerms, setShowTerms] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [manualDiscount, setManualDiscount] = useState<number>(0);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => sessionStorage.getItem('sparkleclean_admin_auth') === 'true');
  const [pricing, setPricing] = useState<PricingConfig>(() => { const saved = localStorage.getItem('sparkleclean_pricing'); return saved ? JSON.parse(saved) : DEFAULT_PRICING; });
  const [isAddressConfirmed, setIsAddressConfirmed] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const searchTimeout = useRef<any>(null);
  const addressContainerRef = useRef<HTMLDivElement>(null);

  const [booking, setBooking] = useState<BookingState>({
    serviceId: 'end_of_lease',
    property: { storeys: '1 Storey', bedrooms: '1 Bedroom', bathrooms: '1 Bathroom', category: 'Residential' },
    selectedExtras: [],
    customer: { firstName: '', lastName: '', email: '', phone: '', address: '', notes: '', cleanerInstructions: '', lat: 0, lon: 0 },
    date: '', timeSlot: '', isWeekend: false, isHome: true, isFurnished: false, hasPower: true, hasWater: true,
    frequency: 'Weekly', preferredDays: [], windowCount: 10, pressureMode: 'manhours', pressureManhours: 4, pressureSqMeters: 50, travelFee: 0
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => { if (addressContainerRef.current && !addressContainerRef.current.contains(event.target as Node)) { setAddressSuggestions([]); } };
    document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAdminLogin = useCallback(() => { sessionStorage.setItem('sparkleclean_admin_auth', 'true'); setIsAdminAuthenticated(true); setView('admin'); }, []);
  const handleAdminLogout = useCallback(() => { setIsAdminAuthenticated(false); sessionStorage.removeItem('sparkleclean_admin_auth'); setView('home'); }, []);

  const startBooking = (serviceId: ServiceType) => {
    setBooking(prev => ({ 
      ...prev, serviceId, selectedExtras: [], 
      property: { ...prev.property, category: (serviceId === 'pressure_washing' || serviceId === 'window') ? 'Residential' : undefined },
      windowCount: serviceId === 'window' ? 10 : undefined,
      pressureMode: serviceId === 'pressure_washing' ? 'manhours' : undefined,
      travelFee: 0
    }));
    setIsAddressConfirmed(false); setManualDiscount(0); setView('booking');
  };

  const currentServicePricing = useMemo(() => pricing.services[booking.serviceId], [pricing, booking.serviceId]);

  const subtotalAndData = useMemo(() => {
    const p = currentServicePricing;
    let base = 0; let details = "";
    const isComm = booking.property.category === 'Commercial';

    if (booking.serviceId === 'window') {
      const units = booking.windowCount || 0;
      const mins = isComm ? (p.commWindowMinutes || 15) : (p.resWindowMinutes || 10);
      const hourly = isComm ? (p.commWindowHourly || 110) : (p.resWindowHourly || 80);
      base = ((units * mins) / 60) * hourly;
      details = `${units} Units (${booking.property.category}) @ ${mins}m/ea`;
    } else if (booking.serviceId === 'pressure_washing') {
      const hourlyRate = isComm ? (p.commercialPressureHourlyRate || 135) : (p.residentialPressureHourlyRate || 95);
      const sqmRate = isComm ? (p.commercialCostPerSqMeter || 18) : (p.residentialCostPerSqMeter || 12);
      if (booking.pressureMode === 'manhours') {
        base = (booking.pressureManhours || 0) * hourlyRate;
        details = `${booking.pressureManhours} Manhours (${booking.property.category}) @ $${hourlyRate}/hr`;
      } else {
        base = (booking.pressureSqMeters || 0) * sqmRate;
        details = `${booking.pressureSqMeters} SQM Area (${booking.property.category}) @ $${sqmRate}/sqm`;
      }
    } else {
      const bedBase = p.basePrices[booking.property.bedrooms] || 230;
      const storeyAdd = p.storeyPrices[booking.property.storeys] || 0;
      const bathAdd = p.bathroomPrices[booking.property.bathrooms] || 0;
      base = bedBase + storeyAdd + bathAdd;
      details = `${booking.property.bedrooms}, ${booking.property.bathrooms}, ${booking.property.storeys}`;
    }

    let extrasTotal = 0;
    booking.selectedExtras.forEach(id => { extrasTotal += p.extrasPrices[id] || 0; });

    let freqDiscount = 0;
    if (booking.serviceId === 'regular' && booking.frequency && p.frequencyDiscounts) {
      freqDiscount = (base + extrasTotal) * ((p.frequencyDiscounts[booking.frequency] || 0) / 100);
    }

    const total = base + extrasTotal + (booking.isWeekend ? 70 : 0) + (booking.travelFee || 0) - freqDiscount - manualDiscount;
    return { base, details, extrasTotal, total, freqDiscount };
  }, [booking, currentServicePricing, manualDiscount]);

  const generatePDF = useCallback(async () => {
    const doc = new jsPDF(); const { total, base, extrasTotal, freqDiscount } = subtotalAndData; const template = pricing.pdfTemplate || DEFAULT_PDF_TEMPLATE;
    const checkPage = (heightNeeded: number) => { if (currentY + heightNeeded > 275) { doc.addPage(); currentY = 20; return true; } return false; };
    doc.setFillColor(template.header.bgColor); doc.rect(0, 0, 210, 40, 'F'); doc.setTextColor(255, 255, 255); doc.setFontSize(24); doc.setFont("helvetica", "bold"); doc.text(template.header.title, 20, 28);
    let currentY = 55; doc.setTextColor(53, 79, 82); doc.setFontSize(13); doc.text("DEPLOYMENT DOSSIER", 20, currentY); currentY += 12;
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    const info = [`Client: ${booking.customer.firstName} ${booking.customer.lastName}`, `Identity: ${booking.customer.email}`, `Protocol: ${SERVICES.find(s => s.id === booking.serviceId)?.title} (${booking.property.category || 'Standard'})`, `Schedule: ${booking.date} @ ${booking.timeSlot}`];
    info.forEach(line => { doc.text(line, 20, currentY); currentY += 6; });
    currentY += 10; doc.setFont("helvetica", "bold"); doc.text("SITE ARCHITECTURE & LOGISTICS", 20, currentY); currentY += 8; doc.setFont("helvetica", "normal");
    const logistics = [`Site: ${booking.customer.address}`, `Profile: ${booking.serviceId === 'window' ? 'Window Deployment' : subtotalAndData.details}`, `Status: ${booking.isHome ? 'On-Site' : 'Lockbox'}, Power: ${booking.hasPower ? 'OK' : 'Req'}, Water: ${booking.hasWater ? 'OK' : 'Req'}`];
    logistics.forEach(line => { const split = doc.splitTextToSize(line, 170); doc.text(split, 20, currentY); currentY += (split.length * 5) + 1; });
    if (booking.customer.cleanerInstructions) { currentY += 4; doc.setFont("helvetica", "bold"); doc.text("INSTRUCTIONS:", 20, currentY); currentY += 5; doc.setFont("helvetica", "normal"); doc.text(doc.splitTextToSize(booking.customer.cleanerInstructions, 170), 20, currentY); currentY += 15; }
    doc.save(`CENVIRA_Quote_${booking.customer.firstName}.pdf`);
  }, [booking, subtotalAndData, pricing]);

  const handleDispatchQuote = async () => { if (!booking.customer.email || !booking.customer.firstName || !booking.date || !booking.timeSlot || !isAddressConfirmed) { alert("Verification failed."); return; } setIsDispatching(true); setTimeout(async () => { await generatePDF(); setIsDispatching(false); setShowSuccess(true); }, 2000); };

  if (view === 'admin') return <AdminPanel config={pricing} onSave={(c) => {setPricing(c); localStorage.setItem('sparkleclean_pricing', JSON.stringify(c));}} onClose={handleAdminLogout} />;

  if (view === 'home') return (
    <div className="min-h-screen flex flex-col bg-[#354F52]">
      <header className="relative pt-32 pb-16 px-6 text-center"><div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/20 mb-8"><ShieldCheck className="w-3 h-3" /> CENVIRA PROTOCOL</div><h1 className="text-5xl md:text-7xl font-black font-heading text-white mb-6 tracking-tight leading-[1.1]">Elite Logistics</h1></header>
      <main className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12 flex-grow pb-24">{SERVICES.map((s) => (<TiltCard key={s.id} innerClassName="p-10 flex flex-col cursor-pointer" onClick={() => startBooking(s.id)}><div className="flex flex-col h-full"><div className="flex-grow"><div className="flex items-center gap-4 mb-8"><div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/20">{React.cloneElement(s.icon as React.ReactElement<any>, { className: "w-7 h-7" })}</div><h3 className="text-3xl font-black font-heading text-white leading-tight">{s.title}</h3></div><p className="text-sm leading-relaxed mb-8">{s.description}</p></div><div className="pt-8 border-t border-white/10 flex items-center justify-center gap-3 font-black uppercase tracking-[0.2em] text-[13px]">START QUOTE <ArrowRight className="w-5 h-5" /></div></div></TiltCard>))}</main>
      <div className="text-center pb-10"><button onClick={() => setView('admin')} className="text-white/30 hover:text-white transition-all font-black uppercase text-[9px] flex items-center gap-2 mx-auto"><ShieldAlert className="w-4 h-4" /> Control Panel</button></div>
    </div>
  );

  return (
    <div className="min-h-screen pb-20 bg-[#354F52]">
      <SuccessModal isOpen={showSuccess} onClose={() => { setShowSuccess(false); setView('home'); }} />
      {isDispatching && (<div className="fixed inset-0 z-[300] bg-[#354F52]/95 backdrop-blur-xl flex flex-col items-center justify-center gap-6"><div className="w-24 h-24 border-4 border-white/5 border-t-white rounded-full animate-spin flex items-center justify-center"><Sparkles className="w-8 h-8 text-white" /></div><h3 className="text-xl font-bold text-white">Synthesizing Protocol...</h3></div>)}

      <header className="relative pt-12 pb-4 px-6 max-w-5xl mx-auto flex items-center justify-between"><button onClick={() => setView('home')} className="flex items-center gap-2 text-white/50 hover:text-white transition-all font-black uppercase text-[10px] tracking-widest"><ChevronLeft className="w-4 h-4" /> Return to Hub</button><div className="text-white/20 font-black uppercase text-[9px] tracking-[0.5em]">Deployment OS 2.5</div></header>

      <main className="max-w-5xl mx-auto px-6 mt-8 space-y-12">
        {/* Section 1: Property Type & Scale (Architecture) */}
        <section className="space-y-6">
          <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-white text-slate-900 flex items-center justify-center font-bold text-xs">1</div><h2 className="text-xl font-black text-white tracking-tight font-heading uppercase tracking-widest">Property Architecture</h2></div>
          {booking.serviceId === 'window' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-top-4">
              <TiltCard innerClassName="p-10 space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Property Classification</label>
                  <div className="flex gap-2 relative z-20">
                    <button onClick={() => setBooking(prev => ({ ...prev, property: { ...prev.property, category: 'Residential' } }))} className={`flex-1 py-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${booking.property.category === 'Residential' ? 'bg-[#7EA172] border-[#7EA172] text-slate-900 shadow-xl' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}>Residential</button>
                    <button onClick={() => setBooking(prev => ({ ...prev, property: { ...prev.property, category: 'Commercial' } }))} className={`flex-1 py-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${booking.property.category === 'Commercial' ? 'bg-[#7EA172] border-[#7EA172] text-slate-900 shadow-xl' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}>Commercial</button>
                  </div>
                </div>
                <div className="space-y-4 relative z-20">
                  <div className="flex justify-between items-center"><label className="text-[10px] font-black uppercase tracking-widest text-white/40">Window Count</label><span className="text-xl font-black text-white">{booking.windowCount} Units</span></div>
                  <input type="range" min="1" max="100" value={booking.windowCount} onChange={(e) => setBooking(prev => ({ ...prev, windowCount: Number(e.target.value) }))} className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#7EA172]" />
                </div>
              </TiltCard>
              <div className="flex flex-col justify-center gap-6">
                <div className="modal-glass p-8 rounded-[2rem] border border-white/10 flex items-center gap-6 group hover:border-[#7EA172]/40 transition-all">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-[#7EA172] border border-white/10 group-hover:scale-110 transition-transform"><Grid className="w-6 h-6" /></div>
                  <div><p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Selected Protocol</p><p className="text-xl font-black text-white uppercase">{booking.property.category} Windows</p></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{[{ label: 'Storeys', icon: Home, field: 'storeys', options: PROPERTY_OPTIONS.storeys }, { label: 'Bedrooms', icon: Bed, field: 'bedrooms', options: PROPERTY_OPTIONS.bedrooms }, { label: 'Bathrooms', icon: Bath, field: 'bathrooms', options: PROPERTY_OPTIONS.bathrooms }].map((item) => (<TiltCard key={item.label} innerClassName="p-8"><div className="mb-6 bg-white/5 w-12 h-12 rounded-xl flex items-center justify-center text-[#7EA172] border border-white/10"><item.icon className="w-6 h-6" /></div><label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-70">{item.label}</label><div className="relative z-20 flex items-center"><select value={booking.property[item.field as keyof PropertyDetails]} onChange={(e) => setBooking(prev => ({ ...prev, property: { ...prev.property, [item.field]: e.target.value } }))} className="w-full bg-transparent border-none focus:ring-0 text-xl font-bold cursor-pointer p-0 appearance-none">{item.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select><ChevronDown className="w-5 h-5 opacity-40 ml-auto pointer-events-none" /></div></TiltCard>))}</div>
          )}
        </section>

        {/* Section 2: Logistics */}
        <section className="space-y-6">
          <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-white text-slate-900 flex items-center justify-center font-bold text-xs">2</div><h2 className="text-xl font-black text-white tracking-tight font-heading uppercase tracking-widest">Schedule & Logistics</h2></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <TiltCard innerClassName="p-8 space-y-8"><div className="space-y-4 relative z-20"><label className="text-[10px] font-black uppercase tracking-widest opacity-70">Date</label><input type="date" value={booking.date} onChange={(e) => setBooking(prev => ({ ...prev, date: e.target.value }))} className="w-full bg-transparent border-b-2 border-white/20 py-3 text-xl font-bold outline-none" /></div><div className="space-y-4 relative z-20"><label className="text-[10px] font-black uppercase tracking-widest opacity-70">Time Slot</label><select value={booking.timeSlot} onChange={(e) => setBooking(prev => ({ ...prev, timeSlot: e.target.value }))} className="w-full bg-transparent border-b-2 border-white/20 py-3 text-xl font-bold appearance-none cursor-pointer outline-none"><option value="" disabled>Select Slot</option>{TIME_SLOTS.map(slot => <option key={slot} value={slot}>{slot}</option>)}</select></div></TiltCard>
            <TiltCard innerClassName="p-8 space-y-6">
              <div className="space-y-4"><label className="block text-[10px] font-black uppercase tracking-widest opacity-70">Logistics Protocol</label><div className="grid grid-cols-2 gap-4 relative z-20">
                <button onClick={() => setBooking(prev => ({ ...prev, isHome: !prev.isHome }))} className={`px-4 py-3 rounded-xl border text-[10px] font-black uppercase transition-all ${booking.isHome ? 'bg-white text-slate-900 border-white' : 'bg-white/5 border-white/10 text-white'}`}>{booking.isHome ? 'Will Be Home' : 'Key Extraction'}</button>
                {booking.serviceId !== 'window' && <button onClick={() => setBooking(prev => ({ ...prev, isFurnished: !prev.isFurnished }))} className={`px-4 py-3 rounded-xl border text-[10px] font-black uppercase transition-all ${booking.isFurnished ? 'bg-white text-slate-900 border-white' : 'bg-white/5 border-white/10 text-white'}`}>{booking.isFurnished ? 'Furnished' : 'Unfurnished'}</button>}
                <button onClick={() => setBooking(prev => ({ ...prev, hasPower: !prev.hasPower }))} className={`px-4 py-3 rounded-xl border text-[10px] font-black uppercase transition-all ${booking.hasPower ? 'bg-white text-slate-900 border-white' : 'bg-white/5 border-white/10 text-white'}`}>{booking.hasPower ? 'Power OK' : 'No Power'}</button>
                <button onClick={() => setBooking(prev => ({ ...prev, hasWater: !prev.hasWater }))} className={`px-4 py-3 rounded-xl border text-[10px] font-black uppercase transition-all ${booking.hasWater ? 'bg-white text-slate-900 border-white' : 'bg-white/5 border-white/10 text-white'}`}>{booking.hasWater ? 'Water OK' : 'No Water'}</button>
              </div></div>
            </TiltCard>
          </div>
        </section>

        {/* Section 3: Protocol Addons */}
        <section className="space-y-6">
          <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-white text-slate-900 flex items-center justify-center font-bold text-xs">3</div><h2 className="text-xl font-black text-white tracking-tight font-heading uppercase tracking-widest">Addons & Inclusions</h2></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Standard Inclusions</h3>
              <TiltCard innerClassName="divide-y divide-white/5">
                {(booking.serviceId === 'window' ? WINDOW_INCLUSIONS : INCLUSIONS).map(inc => <InclusionItem key={inc.id} name={inc.name} details={inc.details} />)}
              </TiltCard>
            </div>
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2"><Settings className="w-4 h-4" /> Performance Extras</h3>
              <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {(booking.serviceId === 'window' ? WINDOW_ADDONS : EXTRAS_DEFS).map(extra => (
                  <button key={extra.id} onClick={() => setBooking(prev => ({ ...prev, selectedExtras: prev.selectedExtras.includes(extra.id) ? prev.selectedExtras.filter(e => e !== extra.id) : [...prev.selectedExtras, extra.id] }))} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left relative z-20 ${booking.selectedExtras.includes(extra.id) ? 'bg-[#7EA172]/20 border-[#7EA172]' : 'bg-white/5 border-transparent'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${booking.selectedExtras.includes(extra.id) ? 'bg-[#7EA172] text-slate-900' : 'bg-white/10'}`}>{extra.icon}</div>
                    <div className="flex-grow"><p className="font-bold text-sm text-white">{extra.name}</p></div>
                    <span className="text-xs font-black text-white">+${currentServicePricing.extrasPrices[extra.id] || 0}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Final Executive Summary */}
        <section className="relative overflow-hidden group pb-8">
          <div className="relative z-10 bg-[#2C3D40] rounded-[2.5rem] p-12 border border-white/5 shadow-2xl">
            <h2 className="text-3xl font-black font-heading tracking-tight text-white mb-10 flex items-center gap-4"><ClipboardList className="w-8 h-8 text-[#7EA172]" /> Executive Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-white">
              <div className="space-y-6">
                <div><h4 className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-2">Service Protocol</h4><p className="font-bold text-lg leading-tight">{SERVICES.find(s => s.id === booking.serviceId)?.title}</p></div>
                <div><h4 className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-2">Site Architecture</h4><p className="font-bold text-sm opacity-80 uppercase">{booking.property.category || 'Standard'} Site</p>{booking.serviceId === 'window' && <p className="text-xs text-[#7EA172] font-black">{booking.windowCount} Window Units</p>}</div>
              </div>
              <div className="space-y-6">
                <div><h4 className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-2">Client Identity</h4><p className="font-bold text-sm leading-tight">{booking.customer.firstName || 'Anonymous'}</p></div>
                <div><h4 className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-2">Deployment Schedule</h4><p className="font-bold text-sm opacity-80">{booking.date || 'Pending'} @ {booking.timeSlot || 'Slot TBD'}</p></div>
              </div>
              <div className="space-y-6">
                <div><h4 className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-2">Site Dossier</h4><p className="font-bold text-sm leading-relaxed opacity-80 break-words">{booking.customer.address || 'Address Required'}</p></div>
              </div>
              <div className="text-center md:text-right flex flex-col items-center md:items-end justify-center">
                <span className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-2">ESTIMATED FEE</span>
                <div className="text-7xl font-black text-white font-heading relative leading-none mb-8"><span className="text-2xl font-bold align-top mr-1 opacity-60">$</span>{subtotalAndData.total.toFixed(0)}</div>
                <button onClick={handleDispatchQuote} className="w-full md:w-auto px-10 py-5 bg-white hover:bg-slate-100 text-slate-900 font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-4 text-xs shadow-xl active:scale-95 transition-all">Generate Quote <FileText className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;
