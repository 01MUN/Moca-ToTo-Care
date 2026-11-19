import React, { useState } from 'react';
import { Heart, KeyRound, LogOut, PawPrint } from 'lucide-react';
import { authApiService, petApiService } from '../services/api';
import { PetProfile, User } from '../types';

interface FirstPetSetupProps {
  currentUser: User;
  onPetReady: (pet: PetProfile) => void;
  onLogout: () => void;
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

// Shown to a logged-in user who has no pets yet, instead of demo data. They can
// register their first pet or join a family pet with an invite code.
export function FirstPetSetup({ currentUser, onPetReady, onLogout }: FirstPetSetupProps) {
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [weight, setWeight] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    setError('');
    try {
      const weightNumber = Number(weight);
      const pet = await petApiService.createPet({
        name: name.trim(),
        ...(breed.trim() ? { breed: breed.trim() } : {}),
        ...(birthDate ? { birthDate } : {}),
        ...(weight && weightNumber > 0 ? { weight: weightNumber } : {})
      });
      onPetReady(pet);
    } catch (err) {
      setError(errorMessage(err, '반려동물을 등록하지 못했습니다. 잠시 후 다시 시도해주세요.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setIsJoining(true);
    setError('');
    try {
      const res = await authApiService.joinFamily(inviteCode.trim());
      if (res.pet) onPetReady(res.pet);
    } catch (err) {
      setError(errorMessage(err, '유효하지 않거나 만료된 초대 코드입니다.'));
    } finally {
      setIsJoining(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-[#8B5E3C]';

  return (
    <div className="min-h-full flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-stone-600 truncate">
          <span className="text-[#8B5E3C]">{currentUser.nickname}</span>님, 환영합니다!
        </p>
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold"
        >
          <LogOut className="w-3.5 h-3.5" /> 로그아웃
        </button>
      </div>

      <div className="text-center space-y-1 pt-2">
        <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-[#8B5E3C]">
          <PawPrint className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-black text-[#3D2C1E]">첫 반려동물 등록</h2>
        <p className="text-xs text-stone-500">아직 등록된 반려동물이 없어요. 함께할 아이를 소개해주세요.</p>
      </div>

      {error && (
        <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold p-3 rounded-2xl">
          {error}
        </div>
      )}

      <form onSubmit={handleCreate} className="bg-white rounded-3xl border border-stone-100 shadow-sm p-4 space-y-3">
        <div>
          <label htmlFor="first-pet-name" className="text-[11px] font-bold text-stone-700 block mb-1">이름</label>
          <input id="first-pet-name" type="text" required maxLength={30} placeholder="예: 모카" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="first-pet-breed" className="text-[11px] font-bold text-stone-700 block mb-1">품종</label>
          <input id="first-pet-breed" type="text" maxLength={50} placeholder="예: 토이푸들" value={breed} onChange={(e) => setBreed(e.target.value)} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="first-pet-birth" className="text-[11px] font-bold text-stone-700 block mb-1">생일</label>
            <input id="first-pet-birth" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="first-pet-weight" className="text-[11px] font-bold text-stone-700 block mb-1">몸무게 (kg)</label>
            <input id="first-pet-weight" type="number" min="0.1" max="200" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} className={inputClass} />
          </div>
        </div>
        <button
          type="submit"
          disabled={isSaving || !name.trim()}
          className="w-full py-2.5 rounded-xl bg-[#8B5E3C] hover:bg-[#5C3D24] text-white text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-50"
        >
          <Heart className="w-3.5 h-3.5" /> {isSaving ? '등록 중...' : '등록하기'}
        </button>
      </form>

      <form onSubmit={handleJoin} className="bg-indigo-50/60 rounded-3xl border border-indigo-100 p-4 space-y-2">
        <p className="text-xs font-extrabold text-indigo-950 flex items-center gap-1">
          <KeyRound className="w-3.5 h-3.5" /> 가족에게 초대 코드를 받았나요?
        </p>
        <label htmlFor="first-pet-invite" className="text-[11px] font-bold text-stone-700 block">초대 코드</label>
        <div className="flex gap-1.5">
          <input
            id="first-pet-invite"
            type="text"
            placeholder="XXXX-XXXX-XXXX"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            className={`${inputClass} uppercase font-mono`}
          />
          <button
            type="submit"
            disabled={isJoining || !inviteCode.trim()}
            className="shrink-0 px-4 py-2 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-bold disabled:opacity-50"
          >
            {isJoining ? '확인 중...' : '참여하기'}
          </button>
        </div>
      </form>
    </div>
  );
}
