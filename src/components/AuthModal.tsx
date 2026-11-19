import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Mail, User, Heart, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, LogIn, UserPlus } from 'lucide-react';
import { authApiService } from '../services/api';
import { User as UserType, PetProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType | null;
  onLoginSuccess: (user: UserType, pets: PetProfile[]) => void;
  /** false renders a login gate without a close button (used when logged out). */
  dismissible?: boolean;
  /** Optional banner, e.g. a session-expired notice. */
  notice?: string;
}

export function AuthModal({ isOpen, onClose, currentUser, onLoginSuccess, dismissible = true, notice }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [role, setRole] = useState<'owner' | 'co_parent'>('owner');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleDemoLogin = async (demoEmail: string, demoPw: string) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await authApiService.login(demoEmail, demoPw);
      setSuccessMsg(`${res.user.nickname}님으로 로그인되었습니다!`);
      setTimeout(() => {
        onLoginSuccess(res.user, res.managedPets);
        onClose();
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || '로그인 실패');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (mode === 'login') {
        const res = await authApiService.login(email, password);
        setSuccessMsg(`${res.user.nickname}님 환영합니다!`);
        setTimeout(() => {
          onLoginSuccess(res.user, res.managedPets);
          onClose();
        }, 500);
      } else {
        const res = await authApiService.signup(email, password, nickname, role);
        setSuccessMsg('회원가입이 완료되어 자동 로그인되었습니다!');
        setTimeout(() => {
          onLoginSuccess(res.user, res.managedPets);
          onClose();
        }, 500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || '요청 처리에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-stone-100 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-br from-[#8B5E3C] to-[#5C3D24] p-5 text-white relative">
            {dismissible && (
              <button
                onClick={onClose}
                aria-label="닫기"
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-300">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-200">
                Moca-ToTo Secure Auth
              </span>
            </div>
            <h3 className="text-lg font-black tracking-tight">
              {mode === 'login' ? '보호자 계정 로그인' : '새 가족 계정 등록'}
            </h3>
            <p className="text-xs text-amber-100/80 mt-0.5">
              소중한 반려동물의 건강 데이터와 산책 기록을 안전하게 보호합니다.
            </p>
          </div>

          <div className="p-5 overflow-y-auto space-y-4">
            {notice && (
              <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold p-3 rounded-2xl">
                {notice}
              </div>
            )}
            {/* Quick Demo Switcher */}
            <div className="bg-amber-50/80 p-3 rounded-2xl border border-amber-200/70 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-extrabold text-[#8B5E3C]">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" /> 원클릭 테스트 계정 전환
                </span>
                <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                  데모용
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('moca_mom@toto.com', 'password123')}
                  disabled={isLoading}
                  className="p-2 bg-white rounded-xl border border-amber-200 text-left hover:bg-amber-100/50 transition-colors shadow-xs"
                >
                  <p className="text-[11px] font-bold text-stone-800 flex items-center gap-1">
                    👑 모카맘 (대표)
                  </p>
                  <p className="text-[10px] text-stone-500">모카 & 토토 관리</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('moca_dad@toto.com', 'password123')}
                  disabled={isLoading}
                  className="p-2 bg-white rounded-xl border border-amber-200 text-left hover:bg-amber-100/50 transition-colors shadow-xs"
                >
                  <p className="text-[11px] font-bold text-stone-800 flex items-center gap-1">
                    🤝 모카아빠 (공동)
                  </p>
                  <p className="text-[10px] text-stone-500">모카&토토 양육 공유</p>
                </button>
              </div>
            </div>

            {/* Mode Switch Tabs */}
            <div className="flex bg-stone-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(''); }}
                className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'login'
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" /> 기존 계정 로그인
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setErrorMsg(''); }}
                className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'signup'
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" /> 신규 가입
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="text-[11px] font-bold text-stone-700 block mb-1">
                      보호자 닉네임
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="예: 초코언니, 뽀삐아빠"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        required
                        className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-[#8B5E3C]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-stone-700 block mb-1">
                      양육자 역할 구분
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRole('owner')}
                        className={`p-2 rounded-xl text-xs font-bold border transition-all text-center ${
                          role === 'owner'
                            ? 'border-[#8B5E3C] bg-amber-50 text-[#8B5E3C]'
                            : 'border-stone-200 bg-stone-50 text-stone-600'
                        }`}
                      >
                        👑 대표 보호자
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('co_parent')}
                        className={`p-2 rounded-xl text-xs font-bold border transition-all text-center ${
                          role === 'co_parent'
                            ? 'border-[#8B5E3C] bg-amber-50 text-[#8B5E3C]'
                            : 'border-stone-200 bg-stone-50 text-stone-600'
                        }`}
                      >
                        🤝 가족 공동 양육자
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">
                  이메일 계정
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-[#8B5E3C]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">
                  비밀번호
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    placeholder="비밀번호 (8자 이상)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-[#8B5E3C]"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-700 font-bold">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-700 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {successMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-[#8B5E3C] hover:bg-[#724B2F] text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isLoading ? (
                  <span>처리 중...</span>
                ) : (
                  <>
                    <span>{mode === 'login' ? '로그인하기' : '회원가입 완료'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
