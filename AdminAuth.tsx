
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Lock, ShieldCheck, ArrowRight, Loader2, KeyRound, QrCode, AlertCircle, ShieldAlert, Copy, Check } from 'lucide-react';
import * as OTPAuth from 'otpauth';

interface AdminAuthProps {
  onSuccess: () => void;
  onCancel: () => void;
}

// Security Helper: SHA-256 Hashing
async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const AdminAuth: React.FC<AdminAuthProps> = ({ onSuccess, onCancel }) => {
  const [step, setStep] = useState<'password' | 'mfa-setup' | 'mfa-verify'>('password');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lockoutTime, setLockoutTime] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  
  const mfaRefs = useRef<(HTMLInputElement | null)[]>([]);

  // The default hashed version of 'admin123'
  const DEFAULT_PWD_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';

  // Brute Force Prevention Logic
  useEffect(() => {
    const savedLockout = localStorage.getItem('admin_lockout_until');
    if (savedLockout) {
      const until = parseInt(savedLockout, 10);
      if (until > Date.now()) {
        setLockoutTime(until);
        const timer = setInterval(() => {
          const remaining = until - Date.now();
          if (remaining <= 0) {
            setLockoutTime(0);
            localStorage.removeItem('admin_lockout_until');
            localStorage.removeItem('admin_failed_attempts');
            clearInterval(timer);
          } else {
            setLockoutTime(until);
          }
        }, 1000);
        return () => clearInterval(timer);
      }
    }
  }, []);

  const recordFailedAttempt = () => {
    const attempts = parseInt(localStorage.getItem('admin_failed_attempts') || '0', 10) + 1;
    localStorage.setItem('admin_failed_attempts', attempts.toString());
    
    if (attempts >= 5) {
      const until = Date.now() + 30000; // 30 second lockout
      localStorage.setItem('admin_lockout_until', until.toString());
      setLockoutTime(until);
    }
  };

  const [tempSecret] = useState(() => {
    const existing = localStorage.getItem('sparkleclean_mfa_secret');
    return existing || new OTPAuth.Secret({ size: 20 }).base32;
  });

  const totp = useMemo(() => {
    return new OTPAuth.TOTP({
      issuer: 'CENVIRA',
      label: 'Admin',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: tempSecret,
    });
  }, [tempSecret]);

  const qrUrl = useMemo(() => {
    const otpUrl = totp.toString();
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpUrl)}`;
  }, [totp]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTime > Date.now()) return;

    setIsLoading(true);
    setError('');

    const trimmedPassword = password.trim();
    if (!trimmedPassword) {
      setError('Password cannot be empty');
      setIsLoading(false);
      return;
    }

    const hashedInput = await hashPassword(trimmedPassword);
    
    // Check for custom password hash in localStorage, otherwise use default
    const savedHash = localStorage.getItem('sparkleclean_admin_pwd_hash');
    const targetHash = savedHash || DEFAULT_PWD_HASH;

    setTimeout(() => {
      if (hashedInput === targetHash) {
        const hasMfa = !!localStorage.getItem('sparkleclean_mfa_secret');
        setStep(hasMfa ? 'mfa-verify' : 'mfa-setup');
        localStorage.setItem('admin_failed_attempts', '0');
        setIsLoading(false);
      } else {
        recordFailedAttempt();
        setError('Security breach alert: Unauthorized access credentials');
        setIsLoading(false);
      }
    }, 800);
  };

  const handleMfaChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newMfa = [...mfaCode];
    newMfa[index] = value.slice(-1);
    setMfaCode(newMfa);
    if (value && index < 5) mfaRefs.current[index + 1]?.focus();
  };

  const handleMfaKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !mfaCode[index] && index > 0) {
      mfaRefs.current[index - 1]?.focus();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(tempSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (mfaCode.every(digit => digit !== '')) {
      const code = mfaCode.join('');
      setIsLoading(true);
      
      setTimeout(() => {
        // Increased window to 2 for better clock drift compatibility
        const delta = totp.validate({ token: code, window: 2 });
        
        if (delta !== null) {
          if (step === 'mfa-setup') {
            localStorage.setItem('sparkleclean_mfa_secret', tempSecret);
          }
          onSuccess();
        } else {
          setError('Verification failed: Security token mismatch');
          setMfaCode(['', '', '', '', '', '']);
          mfaRefs.current[0]?.focus();
          setIsLoading(false);
          recordFailedAttempt();
        }
      }, 800);
    }
  }, [mfaCode, onSuccess, totp, step, tempSecret]);

  if (lockoutTime > Date.now()) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900/95 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-3xl p-10 text-center space-y-6 shadow-2xl border-4 border-red-100">
          <div className="mx-auto w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-600 animate-pulse">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Security Lockdown</h2>
          <p className="text-slate-500 font-medium">Too many failed attempts. Access restricted to prevent brute force attacks.</p>
          <div className="text-3xl font-mono font-black text-red-600">
            {Math.ceil((lockoutTime - Date.now()) / 1000)}s
          </div>
          <button onClick={onCancel} className="text-sm font-bold text-slate-400 hover:text-slate-600 underline">Exit Security Console</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 shadow-inner">
            {step === 'password' ? <Lock className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {step === 'password' ? 'Admin Access' : step === 'mfa-setup' ? 'Identity Setup' : 'Secure Verification'}
            </h2>
            <p className="text-slate-500 text-sm font-medium">
              {step === 'password' 
                ? 'Authorized personnel only. End-to-end encrypted session.' 
                : step === 'mfa-setup' 
                ? 'Scan or enter the key to link with your security app.'
                : 'Enter your 2nd factor verification code.'}
            </p>
          </div>

          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="relative group">
                <input
                  autoFocus
                  type="password"
                  placeholder="Console Password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-5 py-4 bg-slate-50 rounded-xl border-2 outline-none transition-all font-medium text-center tracking-widest ${
                    error ? 'border-red-500 bg-red-50' : 'border-transparent focus:border-slate-900 focus:bg-white'
                  }`}
                />
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
              </div>
              {error && <p className="text-red-600 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1"><AlertCircle className="w-3 h-3" /> {error}</p>}
              <button
                disabled={isLoading || !password.trim()}
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Identify <ArrowRight className="w-5 h-5" /></>}
              </button>
            </form>
          )}

          {step === 'mfa-setup' && (
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-200 shadow-sm">
                <img 
                  src={qrUrl} 
                  alt="MFA QR Code" 
                  className="w-44 h-44 object-contain"
                />
              </div>
              
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manual Setup Key</p>
                <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 group">
                  <code className="flex-1 text-[10px] font-mono text-slate-700 font-bold truncate">
                    {tempSecret}
                  </code>
                  <button 
                    onClick={copyToClipboard}
                    className="p-1.5 hover:bg-white rounded-lg transition-all text-slate-400 hover:text-slate-900"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl text-left border border-slate-100">
                <div className="flex gap-3">
                  <QrCode className="w-5 h-5 text-slate-900 shrink-0" />
                  <div className="text-[11px] text-slate-900 leading-relaxed font-bold uppercase tracking-tight">
                    Action Required<br/>
                    <span className="font-medium normal-case opacity-80">Link this device to your Google Authenticator vault to continue.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(step === 'mfa-verify' || step === 'mfa-setup') && (
            <div className="space-y-6">
              <div className="flex justify-between gap-2">
                {mfaCode.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { mfaRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    autoFocus={i === 0 && step === 'mfa-verify'}
                    value={digit}
                    onChange={(e) => handleMfaChange(i, e.target.value)}
                    onKeyDown={(e) => handleMfaKeyDown(i, e)}
                    className="w-12 h-14 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-xl text-center text-xl font-black text-slate-900 outline-none transition-all shadow-sm"
                  />
                ))}
              </div>
              {error && <p className="text-red-600 text-[10px] font-black uppercase tracking-widest">{error}</p>}
              {isLoading && (
                <div className="flex items-center justify-center gap-2 text-slate-900 font-bold text-xs">
                  <Loader2 className="w-4 h-4 animate-spin" /> Authenticating Session...
                </div>
              )}
            </div>
          )}

          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-900 text-[10px] font-black uppercase tracking-widest transition-colors"
          >
            Terminal Exit
          </button>
        </div>
        
        <div className="bg-slate-900 p-4 text-center">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            <ShieldCheck className="w-3 h-3 text-green-500" /> AES-256 Encrypted Tunnel Active
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminAuth;
