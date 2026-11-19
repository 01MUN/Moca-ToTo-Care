import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Users, Copy, Check, QrCode, Sparkles, UserPlus, HeartHandshake, ShieldCheck, AlertCircle } from 'lucide-react';
import { authApiService } from '../services/api';
import { PetProfile, User as UserType } from '../types';

interface FamilyShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPet: PetProfile;
  currentUser: UserType | null;
  onJoinSuccess: (pet: PetProfile) => void;
}

export function FamilyShareModal({
  isOpen,
  onClose,
  currentPet,
  currentUser,
  onJoinSuccess,
}: FamilyShareModalProps) {
  const [inviteCode, setInviteCode] = useState<string>('MOCA-LOVE-7728');
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [joinStatus, setJoinStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  if (!isOpen) return null;

  const handleGenerateNewCode = async () => {
    setIsGenerating(true);
    try {
      const res = await authApiService.createFamilyInvite(currentPet.id);
      setInviteCode(res.inviteCode);
    } catch (e) {
      setInviteCode(`${currentPet.name.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleJoinFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    setIsJoining(true);
    setJoinStatus(null);
    try {
      const res = await authApiService.joinFamily(inputCode.trim());
      setJoinStatus({
        type: 'success',
        message: `'${res.pet?.name || '아이'}'의 공동 양육자로 정상 등록되었습니다!`,
      });
      setTimeout(() => {
        if (res.pet) onJoinSuccess(res.pet);
        onClose();
      }, 1200);
    } catch (err: any) {
      setJoinStatus({
        type: 'error',
        message: err.message || '유효하지 않은 초대 코드입니다.',
      });
    } finally {
      setIsJoining(false);
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
          <div className="bg-gradient-to-br from-indigo-700 to-indigo-900 p-5 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-indigo-400/20 flex items-center justify-center text-indigo-300">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                Co-Parenting Sharing
              </span>
            </div>
            <h3 className="text-lg font-black tracking-tight">
              {currentPet.name} 공동 양육자 관리
            </h3>
            <p className="text-xs text-indigo-100/80 mt-0.5">
              가족 구성원과 실시간 사료·산책·진료 기록을 함께 기록하고 공유합니다.
            </p>
          </div>

          <div className="p-5 overflow-y-auto space-y-5">
            {/* Active Co-Parents list */}
            <div>
              <h4 className="text-xs font-extrabold text-stone-800 mb-2 flex items-center justify-between">
                <span>현재 등록된 양육 가족 (2명)</span>
                <span className="text-[10px] text-indigo-700 bg-indigo-50 font-bold px-2 py-0.5 rounded-md">
                  실시간 연동
                </span>
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 bg-stone-50 rounded-2xl border border-stone-200/80">
                  <div className="flex items-center gap-2.5">
                    <img
                      src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150"
                      alt="모카맘"
                      className="w-8 h-8 rounded-full object-cover border border-amber-300"
                    />
                    <div>
                      <p className="text-xs font-black text-stone-800 flex items-center gap-1">
                        모카맘 <span className="text-[10px] text-amber-700 bg-amber-100 px-1 rounded font-bold">대표</span>
                      </p>
                      <p className="text-[10px] text-stone-500">moca_mom@toto.com</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-stone-400 font-medium">관리자</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-stone-50 rounded-2xl border border-stone-200/80">
                  <div className="flex items-center gap-2.5">
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
                      alt="모카아빠"
                      className="w-8 h-8 rounded-full object-cover border border-indigo-300"
                    />
                    <div>
                      <p className="text-xs font-black text-stone-800 flex items-center gap-1">
                        모카아빠 <span className="text-[10px] text-indigo-700 bg-indigo-100 px-1 rounded font-bold">공동</span>
                      </p>
                      <p className="text-[10px] text-stone-500">moca_dad@toto.com</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold">참여 중</span>
                </div>
              </div>
            </div>

            {/* Invite Family Code Card */}
            <div className="bg-gradient-to-br from-indigo-50 to-amber-50/50 p-4 rounded-3xl border border-indigo-100 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-indigo-600" /> 가족 초대 코드 발급
                </p>
                <button
                  type="button"
                  onClick={handleGenerateNewCode}
                  disabled={isGenerating}
                  className="text-[10px] font-bold text-indigo-700 hover:underline"
                >
                  새 코드 생성
                </button>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-indigo-200/80 flex items-center justify-between shadow-xs">
                <div className="font-mono text-base font-black text-indigo-950 tracking-wider">
                  {inviteCode}
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> 복사됨
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> 복사
                    </>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-stone-500 leading-relaxed">
                초대받은 가족이 아래에 코드를 입력하면 {currentPet.name}의 모든 데이터를 함께 관리할 수 있습니다. (유효기간: 7일)
              </p>
            </div>

            {/* Join other family */}
            <form onSubmit={handleJoinFamily} className="space-y-2">
              <label className="text-xs font-extrabold text-stone-800 flex items-center gap-1">
                <UserPlus className="w-3.5 h-3.5 text-stone-600" /> 받은 가족 초대 코드 등록
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="예: MOCA-LOVE-7728"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs uppercase font-mono focus:bg-white focus:outline-none focus:border-indigo-600"
                />
                <button
                  type="submit"
                  disabled={isJoining || !inputCode.trim()}
                  className="px-4 py-2 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {isJoining ? '확인 중...' : '등록'}
                </button>
              </div>

              {joinStatus && (
                <div
                  className={`p-2.5 rounded-xl text-[11px] font-bold ${
                    joinStatus.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {joinStatus.message}
                </div>
              )}
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
