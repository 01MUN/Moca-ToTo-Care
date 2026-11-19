import React, { useState, useEffect } from 'react';
import { RecordItem, HealthRecord, PetProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Activity,
  Plus,
  CheckCircle2,
  Stethoscope,
  Calendar,
  Pill,
  Syringe,
  Scale,
  X,
  Building2,
  Check,
  TrendingUp,
  Bell,
  BellRing,
  Wifi,
  WifiOff,
  Database,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface RecordsTabProps {
  pet: PetProfile;
  dailyRecords: RecordItem[];
  healthRecords: HealthRecord[];
  onToggleRecord: (id: string) => void;
  onAddHealthRecord: (record: Omit<HealthRecord, 'id'>) => void;
  onAddDailyRecord: (record: Omit<RecordItem, 'id' | 'completed'>) => void;
}

export const RecordsTab: React.FC<RecordsTabProps> = ({
  pet,
  dailyRecords,
  healthRecords,
  onToggleRecord,
  onAddHealthRecord,
  onAddDailyRecord,
}) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'health'>('daily');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<string>('default');
  const [pushToast, setPushToast] = useState<string | null>(null);

  // Form states for Health Record
  const [hospitalName, setHospitalName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [category, setCategory] = useState<HealthRecord['category']>('checkup');
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [weightKg, setWeightKg] = useState<number>(pet.weightKg);
  const [cost, setCost] = useState<number>(45000);
  const [memo, setMemo] = useState('');

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationStatus(Notification.permission);
    }
  }, []);

  const handleTriggerDDayPush = async (medicineTitle: string, dDayText: string) => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(`🐾 ${pet.name}의 D-Day 투약 알림`, {
          body: `${medicineTitle} (${dDayText}) 예정일입니다! 잊지 말고 복용시켜 주세요 💊`,
          icon: pet.avatarUrl,
        });
        setPushToast(`🔔 "${medicineTitle}" 푸시 알림이 발송되었습니다!`);
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        setNotificationStatus(permission);
        if (permission === 'granted') {
          new Notification(`🐾 ${pet.name}의 D-Day 투약 알림`, {
            body: `${medicineTitle} (${dDayText}) 예정일입니다! 잊지 말고 복용시켜 주세요 💊`,
            icon: pet.avatarUrl,
          });
          setPushToast(`🔔 알림 권한이 승인되어 푸시가 발송되었습니다!`);
        }
      } else {
        setPushToast(`⚠️ 브라우저 알림 권한이 차단되어 있습니다. 설정에서 허용해주세요.`);
      }
    } else {
      setPushToast(`🔔 [로컬 시뮬레이션] ${pet.name} ${medicineTitle} D-Day 알림 발송 완료!`);
    }

    setTimeout(() => {
      setPushToast(null);
    }, 3000);
  };

  const handleSaveHealthRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalName || !diagnosis) return;

    onAddHealthRecord({
      date: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
      hospitalName,
      doctorName: doctorName || '주치의 선생님',
      category,
      diagnosis,
      prescription,
      weightKg,
      cost,
      memo,
    });

    // Reset form
    setHospitalName('');
    setDoctorName('');
    setDiagnosis('');
    setPrescription('');
    setMemo('');
    setShowAddModal(false);

    // Show Checkmark Feedback Micro-interaction
    setShowSuccessToast(true);
    confetti({
      particleCount: 20,
      spread: 50,
      origin: { y: 0.6 },
      colors: ['#22C55E', '#8B5E3C', '#F59E0B'],
    });

    setTimeout(() => {
      setShowSuccessToast(false);
    }, 1800);
  };

  return (
    <div className="min-h-screen pb-28 pt-4 px-4 bg-[#FDF8F0] text-[#3D2C1E]">
      <div className="max-w-md mx-auto space-y-4">
        
        {/* Title Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-stone-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#8B5E3C]" /> {pet.name}의 돌봄 일지
            </h1>
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              식사, 음수, 영양제 복용 및 병원 방문 기록을 관리하세요
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="p-2.5 bg-[#8B5E3C] hover:bg-[#724B2F] text-white rounded-2xl shadow-md font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" /> 기록 추가
          </button>
        </div>

        {/* Segmented Control Switcher */}
        <div className="relative p-1 bg-stone-200/80 rounded-2xl flex items-center shadow-inner">
          <button
            onClick={() => setActiveTab('daily')}
            className={`relative flex-1 py-2.5 text-xs font-extrabold text-center transition-colors z-10 ${
              activeTab === 'daily' ? 'text-[#8B5E3C]' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            오늘의 기록
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`relative flex-1 py-2.5 text-xs font-extrabold text-center transition-colors z-10 ${
              activeTab === 'health' ? 'text-[#8B5E3C]' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            건강 & 병원 기록
          </button>

          {/* Sliding Tab Highlight */}
          <motion.div
            layout
            className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm"
            animate={{ left: activeTab === 'daily' ? '4px' : 'calc(50%)' }}
            transition={{ type: 'spring', stiffness: 450, damping: 35 }}
          />
        </div>

        {/* Tab 1: 오늘의 기록 (Daily Logs) */}
        {activeTab === 'daily' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Daily Checklist */}
            <div className="bg-white/95 rounded-3xl p-4 shadow-sm border border-stone-200 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <span className="text-xs font-extrabold text-stone-800 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-600" /> 오늘 완료해야 할 스케줄
                </span>
                <span className="text-[11px] font-bold text-[#8B5E3C] bg-amber-50 px-2 py-0.5 rounded-md">
                  {dailyRecords.filter((r) => r.completed).length} / {dailyRecords.length} 달성
                </span>
              </div>

              <div className="space-y-2">
                {dailyRecords.map((item) => (
                  <motion.div
                    key={item.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onToggleRecord(item.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      item.completed
                        ? 'bg-emerald-50/60 border-emerald-200/80 text-stone-700'
                        : 'bg-stone-50/70 border-stone-200 text-stone-800 hover:bg-stone-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                          item.completed
                            ? 'bg-emerald-500 text-white'
                            : 'border-2 border-stone-300 bg-white'
                        }`}
                      >
                        {item.completed && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold">{item.title}</span>
                          <span className="text-[10px] text-stone-400 font-medium">{item.time}</span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">{item.detail}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                        item.completed
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {item.completed ? '완료' : '미완료'}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* D-Day Vaccine & Heartworm Smart Push Card */}
            <div className="bg-gradient-to-br from-[#8B5E3C] to-[#6F472B] rounded-3xl p-4 text-white shadow-md space-y-3">
              <div className="flex items-center justify-between border-b border-white/15 pb-2.5">
                <span className="text-xs font-black flex items-center gap-1.5 text-amber-200">
                  <BellRing className="w-4 h-4 text-amber-300 animate-pulse" /> D-Day 예방접종 & 투약 스마트 알림
                </span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                  로컬 푸시 연동
                </span>
              </div>

              <div className="space-y-2">
                {/* Item 1: Heartworm */}
                <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl flex items-center justify-between border border-white/10">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-200 flex items-center justify-center font-bold text-sm">
                      💊
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold">심장사상충 (하트가드)</h4>
                        <span className="text-[10px] bg-rose-500/30 text-rose-200 px-1.5 py-0.5 rounded font-extrabold">
                          D-9
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-200">매월 26일 권장 복용일</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTriggerDDayPush('심장사상충 (하트가드)', 'D-9')}
                    className="px-2.5 py-1.5 bg-white text-[#8B5E3C] hover:bg-amber-100 rounded-xl text-[11px] font-extrabold shadow-sm transition-transform active:scale-95"
                  >
                    알림 테스트
                  </button>
                </div>

                {/* Item 2: Rabies Vaccine */}
                <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl flex items-center justify-between border border-white/10">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-200 flex items-center justify-center font-bold text-sm">
                      💉
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold">광견병 / 종합백신 5차</h4>
                        <span className="text-[10px] bg-amber-400/30 text-amber-200 px-1.5 py-0.5 rounded font-extrabold">
                          D-42
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-200">매년 봄철 정기 접종</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTriggerDDayPush('광견병/종합백신 5차', 'D-42')}
                    className="px-2.5 py-1.5 bg-white/20 text-white hover:bg-white/30 rounded-xl text-[11px] font-extrabold border border-white/20 transition-transform active:scale-95"
                  >
                    예약 알림
                  </button>
                </div>
              </div>
            </div>

            {/* Offline Local Cache & DB Persistence Status Indicator */}
            <div className="bg-white/95 rounded-2xl p-3 border border-stone-200 shadow-2xs flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-extrabold text-stone-800 text-[11px]">오프라인 로컬 캐시 & DB</p>
                  <p className="text-[10px] text-stone-500">PostgreSQL + PostGIS 스키마 영속화 준비됨</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <Wifi className="w-3 h-3" /> 실시간 동기화
              </span>
            </div>

            {/* Quick Stats Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/95 p-3.5 rounded-2xl border border-stone-200 shadow-2xs space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-stone-600">
                  <Scale className="w-4 h-4 text-[#8B5E3C]" /> 현재 체중
                </div>
                <p className="text-lg font-extrabold text-stone-800">{pet.weightKg} kg</p>
                <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> 지난달 대비 0.1kg 안정 유지
                </p>
              </div>

              <div className="bg-white/95 p-3.5 rounded-2xl border border-stone-200 shadow-2xs space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-stone-600">
                  <Pill className="w-4 h-4 text-purple-600" /> 다음 예방약
                </div>
                <p className="text-sm font-extrabold text-purple-900 mt-1">심장사상충 (하트가드)</p>
                <p className="text-[10px] text-purple-700 font-semibold">매월 26일 권장 복용</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 2: 건강 & 병원 기록 (Health Logs) */}
        {activeTab === 'health' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="bg-white/95 rounded-3xl p-4 shadow-sm border border-stone-200 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <span className="text-xs font-extrabold text-stone-800 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-[#8B5E3C]" /> 최근 진료 및 예방접종 타임라인
                </span>
                <span className="text-[10px] text-stone-400">총 {healthRecords.length}건 기록</span>
              </div>

              <div className="space-y-3">
                {healthRecords.map((hr) => (
                  <div
                    key={hr.id}
                    className="p-3.5 rounded-2xl bg-stone-50/90 border border-stone-200/90 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 mb-1">
                          {hr.category === 'checkup'
                            ? '🏥 정기 검진'
                            : hr.category === 'vaccine'
                            ? '💉 예방 접종'
                            : hr.category === 'dental'
                            ? '🦷 치과/스케일링'
                            : '🩺 병원 치료'}
                        </span>
                        <h4 className="text-xs font-extrabold text-stone-800">{hr.diagnosis}</h4>
                        <p className="text-[11px] text-stone-500 font-medium">
                          {hr.hospitalName} {hr.doctorName ? `(${hr.doctorName})` : ''}
                        </p>
                      </div>
                      <span className="text-[11px] font-extrabold text-stone-400">{hr.date}</span>
                    </div>

                    {hr.prescription && (
                      <div className="bg-white p-2 rounded-xl text-[11px] text-stone-600 border border-stone-200/60 font-medium flex items-center gap-1.5">
                        <Pill className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span>처방: {hr.prescription}</span>
                      </div>
                    )}

                    {hr.memo && (
                      <p className="text-[11px] text-stone-500 italic bg-amber-50/50 p-2 rounded-xl border border-amber-100/60">
                        "{hr.memo}"
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-stone-400 font-medium pt-1 border-t border-stone-200/60">
                      <span>체중: {hr.weightKg} kg</span>
                      <span className="font-bold text-stone-700">
                        진료비: {hr.cost.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

      </div>

      {/* Half Modal: Add Health Record Form */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="w-full max-w-lg bg-white rounded-t-3xl shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="text-sm font-extrabold text-stone-800 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-[#8B5E3C]" /> 병원 방문 / 건강 기록 추가
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-full hover:bg-stone-100 text-stone-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveHealthRecord} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-stone-600 block mb-1">
                    병원 이름 *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="예: 24시 센트럴동물메디컬센터"
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#8B5E3C]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-stone-600 block mb-1">
                      진료 수의사
                    </label>
                    <input
                      type="text"
                      placeholder="김민준 수의사"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#8B5E3C]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-stone-600 block mb-1">
                      진료 카테고리
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#8B5E3C]"
                    >
                      <option value="checkup">🏥 정기 검진</option>
                      <option value="vaccine">💉 예방 접종</option>
                      <option value="dental">🦷 치과/스케일링</option>
                      <option value="treatment">🩺 일반 진료</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-600 block mb-1">
                    진단 / 진료 내용 *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="예: 슬개골 1기 상태 점검 및 영양제 처방"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#8B5E3C]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-600 block mb-1">
                    처방 약 / 주의사항
                  </label>
                  <input
                    type="text"
                    placeholder="예: 관절 영양제 30일분 복용"
                    value={prescription}
                    onChange={(e) => setPrescription(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#8B5E3C]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-stone-600 block mb-1">
                      측정 체중 (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={weightKg}
                      onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#8B5E3C]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-stone-600 block mb-1">
                      진료비 (원)
                    </label>
                    <input
                      type="number"
                      step="1000"
                      value={cost}
                      onChange={(e) => setCost(parseInt(e.target.value) || 0)}
                      className="w-full p-2.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#8B5E3C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-600 block mb-1">
                    메모 / 수의사 소견
                  </label>
                  <textarea
                    rows={2}
                    placeholder="선생님이 당부하신 내용이나 아이 특이사항을 적어주세요."
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:border-[#8B5E3C]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#8B5E3C] hover:bg-[#724B2F] text-white rounded-2xl font-bold text-xs shadow-md transition-colors mt-2"
                >
                  기록 저장하기
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Push Toast Notification */}
      <AnimatePresence>
        {pushToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-0 right-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-[#8B5E3C] text-white px-5 py-3 rounded-2xl shadow-xl border border-amber-300/40 text-xs font-bold flex items-center gap-2 max-w-sm">
              <Bell className="w-4 h-4 text-amber-300 animate-bounce" />
              <span>{pushToast}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Toast Micro-interaction */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center p-4"
          >
            <div className="bg-stone-900/90 backdrop-blur-md text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3 border border-emerald-500/40">
              <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg animate-bounce">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-extrabold">성공적으로 기록되었습니다!</p>
                <p className="text-[11px] text-stone-300">건강 타임라인에 업로드 완료 🎉</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
