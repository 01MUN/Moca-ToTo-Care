import React, { useState, useEffect, useRef } from 'react';
import { PetProfile, AIConsultationCategory, AIConsultationResult } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  AlertCircle,
  RefreshCw,
  Camera,
  Upload,
  Image as ImageIcon,
  History,
  CheckCircle2,
  AlertTriangle,
  Flame,
  FileText,
  ShieldCheck,
  ChevronRight,
  Trash2,
  Stethoscope,
  Heart
} from 'lucide-react';
import { petApiService } from '../services/api';

interface AIInteractionModalProps {
  pet: PetProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const AIInteractionModal: React.FC<AIInteractionModalProps> = ({
  pet,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'diagnose' | 'history'>('diagnose');
  const [selectedCategory, setSelectedCategory] = useState<AIConsultationCategory>('behavior');
  const [userQuery, setUserQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [loading, setLoading] = useState(false);
  const [consultationResult, setConsultationResult] = useState<AIConsultationResult | null>(null);
  const [historyList, setHistoryList] = useState<AIConsultationResult[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Categories config
  const categories: { id: AIConsultationCategory; name: string; icon: string; desc: string }[] = [
    { id: 'behavior', name: '행동 심리', icon: '💬', desc: '아이의 행동과 속마음 번역' },
    { id: 'stool', name: '이상 변/소화기', icon: '💩', desc: '배변 상태 & 소화기 진단' },
    { id: 'skin', name: '피부/상처/털', icon: '🩺', desc: '발진, 긁음, 탈모 판별' },
    { id: 'food', name: '사료 성분표', icon: '🥣', desc: '영양소 & 알레르기 분석' },
    { id: 'general', name: '일반 웰니스', icon: '🌿', desc: '종합 활력 & 케어 상담' },
  ];

  // Dynamic sample prompts based on category
  const samplePromptsByCategory: Record<AIConsultationCategory, string[]> = {
    behavior: [
      '꼬리를 흔들면서 자기 신발을 물고 다녀요!',
      '산책 나갔을 때 다른 강아지한테 짖는 이유가 뭘까요?',
      '혼자 집에 있을 때 문 앞만 쳐다보고 있어요.',
    ],
    stool: [
      '변에 점액질이 살짝 섞여 나왔는데 괜찮을까요?',
      '오늘 묽은 변을 2회 봤는데 활력은 좋아요.',
      '사료를 바꾼 뒤 변 냄새가 심해지고 색이 짙어졌어요.',
    ],
    skin: [
      '발바닥과 귀 주변을 계속 핥고 긁어서 붉어졌어요.',
      '턱 밑에 좁쌀 같은 피지가 올라왔는데 처치법이 궁금해요.',
      '등 쪽에 털이 뭉쳐서 빠지는 부위가 있어요.',
    ],
    food: [
      '성장기 말티푸에게 조단백 30% 사료가 적절한가요?',
      '사료 성분표 중 눈물 자국을 유발할 만한 알레르기 유발원이 있나요?',
      '체중 감량을 위해 하루 적정 급여량이 궁금해요.',
    ],
    general: [
      '환절기 면역력을 높여주는 맞춤 홈케어 루틴 추천해주세요.',
      '양치질을 너무 싫어하는데 치석 관리 팁이 있나요?',
      '심장사상충 약 복용 후 주의해야 할 점이 있나요?',
    ],
  };

  // Preset sample vision images for fast testing
  const sampleVisionPresets: Record<string, { label: string; url: string; prompt: string; cat: AIConsultationCategory }> = {
    stoolSample: {
      label: '💩 묽은 변 샘플 사진',
      url: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=400&q=80',
      prompt: '아침에 산책하며 본 대변 사진입니다. 형태와 색상이 정상 범위인지 판별해주세요.',
      cat: 'stool',
    },
    skinSample: {
      label: '🩺 피부 붉은기 샘플',
      url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=400&q=80',
      prompt: '발가락 사이와 배 주변이 붉어졌어요. 알레르기성 피부염 가능성이 있나요?',
      cat: 'skin',
    },
    foodSample: {
      label: '🥣 사료 성분표 샘플',
      url: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=400&q=80',
      prompt: '현재 급여 중인 유기농 사료 성분표입니다. 영양 밸런스와 첨가물 적합도를 봐주세요.',
      cat: 'food',
    },
  };

  // Load consultation history
  useEffect(() => {
    if (isOpen && pet.id) {
      loadHistory();
    }
  }, [isOpen, pet.id]);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const history = await petApiService.getAIHistory(pet.id);
      setHistoryList(history || []);
    } catch (e) {
      console.warn('Failed to load AI history:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      setSelectedImage(base64String);
    };
    reader.readAsDataURL(file);
  };

  const applyPresetImage = (key: keyof typeof sampleVisionPresets) => {
    const preset = sampleVisionPresets[key];
    setSelectedCategory(preset.cat);
    setSelectedImage(preset.url);
    setUserQuery(preset.prompt);
  };

  const handleAskAI = async (overridePrompt?: string) => {
    const promptToAsk = overridePrompt || userQuery;
    if (!promptToAsk.trim() && !selectedImage) return;

    setLoading(true);
    if (overridePrompt) setUserQuery(overridePrompt);

    // Extract base64 without prefix if local file
    let pureBase64: string | undefined;
    if (selectedImage && selectedImage.startsWith('data:')) {
      pureBase64 = selectedImage.split(',')[1];
    }

    try {
      const result = await petApiService.analyzePetAI({
        petId: pet.id,
        petName: pet.name,
        breed: pet.breed,
        age: pet.age || '2살',
        category: selectedCategory,
        behaviorText: promptToAsk || `${categories.find((c) => c.id === selectedCategory)?.name} 정밀 분석`,
        imageBase64: pureBase64,
        imageMimeType,
      });

      setConsultationResult(result);
      // Refresh history list in background
      loadHistory();
    } catch (err: any) {
      console.warn('AI Doctor error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-amber-200/80 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-[#8B5E3C] via-[#6F472B] to-[#4E321E] p-4 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-xl bg-amber-400/20 flex items-center justify-center text-amber-300">
              <Stethoscope className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-200">
              Gemini Multimodal AI Doctor
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black tracking-tight">
                {pet.name} 수의학 맞춤 AI 닥터
              </h3>
              <p className="text-[11px] text-amber-100/80">
                시각(Vision) 분석 & 행동 심리 번역 & 맞춤 케어 처방
              </p>
            </div>
          </div>

          {/* Top Tab Bar: Diagnose vs History */}
          <div className="flex gap-2 mt-3 pt-2 border-t border-white/10">
            <button
              onClick={() => setActiveTab('diagnose')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'diagnose'
                  ? 'bg-white text-[#8B5E3C] shadow-sm'
                  : 'bg-white/10 text-white hover:bg-white/15'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>실시간 AI 진단</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-white text-[#8B5E3C] shadow-sm'
                  : 'bg-white/10 text-white hover:bg-white/15'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>상담 히스토리 ({historyList.length})</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'diagnose' ? (
            <>
              {/* Category Selector Chips */}
              <div>
                <p className="text-[11px] font-extrabold text-stone-700 mb-1.5 flex items-center justify-between">
                  <span>진단 및 상담 영역 선택</span>
                  <span className="text-[10px] text-[#8B5E3C] font-semibold">
                    {categories.find((c) => c.id === selectedCategory)?.desc}
                  </span>
                </p>
                <div className="grid grid-cols-5 gap-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`p-2 rounded-2xl text-center border transition-all flex flex-col items-center gap-1 ${
                        selectedCategory === cat.id
                          ? 'border-[#8B5E3C] bg-amber-50 text-[#8B5E3C] shadow-xs'
                          : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      <span className="text-base">{cat.icon}</span>
                      <span className="text-[10px] font-bold leading-tight line-clamp-1">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Vision Image Upload Area */}
              <div className="p-3 bg-stone-50 rounded-2xl border border-dashed border-stone-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-[#8B5E3C]" />
                    사진 첨부 (이상 변 / 피부 상처 / 사료 성분표)
                  </span>
                  {selectedImage && (
                    <button
                      onClick={() => setSelectedImage(null)}
                      className="text-[10px] text-rose-600 font-bold hover:underline"
                    >
                      사진 제거
                    </button>
                  )}
                </div>

                {selectedImage ? (
                  <div className="relative rounded-xl overflow-hidden border border-amber-200 max-h-40 flex items-center justify-center bg-black/5">
                    <img
                      src={selectedImage}
                      alt="Uploaded preview"
                      className="object-cover w-full h-36"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> 이미지 준비 완료
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-3 px-3 bg-white rounded-xl border border-stone-200 text-stone-500 hover:text-stone-800 hover:bg-stone-50 text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-2xs"
                    >
                      <Upload className="w-4 h-4 text-stone-400" />
                      <span>기기에서 사진 업로드 (PNG, JPG)</span>
                    </button>
                  </div>
                )}

                {/* Quick Presets for Demo Testing */}
                <div className="pt-1 flex items-center gap-1.5 overflow-x-auto text-[10px]">
                  <span className="text-stone-400 font-bold whitespace-nowrap">예시 샘플:</span>
                  {Object.entries(sampleVisionPresets).map(([key, preset]) => (
                    <button
                      key={key}
                      onClick={() => applyPresetImage(key as any)}
                      className="px-2 py-1 bg-white hover:bg-amber-100/60 rounded-lg border border-stone-200 text-stone-700 whitespace-nowrap font-medium transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Input & Submit */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="증상, 행동, 궁금한 점을 입력해주세요..."
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                    className="flex-1 p-3 rounded-2xl border border-stone-200 text-xs focus:outline-none focus:border-[#8B5E3C] shadow-2xs"
                  />
                  <button
                    onClick={() => handleAskAI()}
                    disabled={loading || (!userQuery.trim() && !selectedImage)}
                    className="p-3 bg-[#8B5E3C] hover:bg-[#724B2F] text-white rounded-2xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>

                {/* Dynamic sample prompt pills */}
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    추천 질문 선택
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {samplePromptsByCategory[selectedCategory].map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAskAI(prompt)}
                        className="text-[10px] text-stone-700 bg-stone-100 hover:bg-amber-100 hover:text-amber-900 px-2.5 py-1.5 rounded-xl border border-stone-200 text-left transition-colors"
                      >
                        💡 {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Diagnosis Result Card */}
              {consultationResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 p-4 rounded-3xl border border-amber-300 shadow-sm space-y-3.5"
                >
                  {/* Result Header & Urgency Badge */}
                  <div className="flex items-center justify-between border-b border-amber-200/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-xl bg-[#8B5E3C] text-white text-xs">
                        <Bot className="w-4 h-4" />
                      </span>
                      <div>
                        <h4 className="text-xs font-black text-stone-900">
                          {pet.name} 수의학 AI 분석 소견서
                        </h4>
                        <p className="text-[10px] text-stone-500">
                          {categories.find((c) => c.id === consultationResult.category)?.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Urgency Badge */}
                      <span
                        className={`text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs ${
                          consultationResult.urgencyLevel === 'URGENT'
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : consultationResult.urgencyLevel === 'ATTENTION'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {consultationResult.urgencyLevel === 'URGENT' && <Flame className="w-3 h-3 text-rose-600" />}
                        {consultationResult.urgencyLevel === 'ATTENTION' && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                        {consultationResult.urgencyLevel === 'NORMAL' && <ShieldCheck className="w-3 h-3 text-emerald-600" />}
                        <span>
                          {consultationResult.urgencyLevel === 'URGENT'
                            ? '응급 내원 권장'
                            : consultationResult.urgencyLevel === 'ATTENTION'
                            ? '주의 / 관찰 필요'
                            : '정상 / 안심 상태'}
                        </span>
                      </span>

                      {/* Health Score */}
                      <div className="bg-[#8B5E3C] text-white text-[10px] font-black px-2 py-1 rounded-full">
                        건강지수 {consultationResult.healthScore}점
                      </div>
                    </div>
                  </div>

                  {/* Inner Voice Translation */}
                  <div className="bg-amber-100/60 p-3 rounded-2xl border border-amber-200/80">
                    <p className="text-[10px] font-bold text-amber-900 flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> {pet.name}의 속마음 번역
                      </span>
                      <span className="text-[9px] bg-amber-200 px-1.5 py-0.5 rounded font-semibold">
                        기분: {consultationResult.moodStatus}
                      </span>
                    </p>
                    <p className="text-xs font-bold text-stone-800 italic leading-relaxed">
                      "{consultationResult.innerVoiceTranslation}"
                    </p>
                  </div>

                  {/* Summary & Detected Issues */}
                  <div className="bg-white p-3 rounded-2xl border border-stone-200/80 space-y-2">
                    <p className="text-xs font-bold text-stone-800 leading-relaxed">
                      {consultationResult.summary}
                    </p>

                    {consultationResult.detectedIssues?.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {consultationResult.detectedIssues.map((issue, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-semibold bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md border border-stone-200"
                          >
                            • {issue}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Veterinary Tip */}
                  <div className="bg-white p-3 rounded-2xl border border-amber-200 space-y-1 text-xs">
                    <p className="font-extrabold text-[#8B5E3C] flex items-center gap-1 text-[11px]">
                      <Stethoscope className="w-3.5 h-3.5 text-[#8B5E3C]" /> 수의사 케어 가이드
                    </p>
                    <p className="text-stone-700 leading-normal font-medium">
                      {consultationResult.veterinaryTip}
                    </p>
                  </div>

                  {/* Action Plan */}
                  {consultationResult.actionPlan?.length > 0 && (
                    <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200 space-y-1.5">
                      <p className="text-[11px] font-extrabold text-emerald-900 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 추천 홈케어 실행 플랜
                      </p>
                      <ul className="space-y-1">
                        {consultationResult.actionPlan.map((plan, i) => (
                          <li key={i} className="text-[11px] text-emerald-800 flex items-start gap-1.5 font-medium">
                            <span className="text-emerald-500 font-bold">✓</span>
                            <span>{plan}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}
            </>
          ) : (
            /* History Tab */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-[#8B5E3C]" /> {pet.name}의 지난 AI 상담 내역
                </h4>
                <button
                  onClick={loadHistory}
                  disabled={isLoadingHistory}
                  className="text-[10px] text-[#8B5E3C] font-bold hover:underline flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingHistory ? 'animate-spin' : ''}`} /> 새로고침
                </button>
              </div>

              {historyList.length === 0 ? (
                <div className="p-8 text-center bg-stone-50 rounded-3xl border border-stone-200 space-y-2">
                  <FileText className="w-8 h-8 text-stone-300 mx-auto" />
                  <p className="text-xs font-bold text-stone-600">아직 저장된 AI 상담 기록이 없습니다.</p>
                  <p className="text-[10px] text-stone-400">
                    실시간 AI 진단 탭에서 사진이나 질문을 남겨보세요!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyList.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-stone-50 hover:bg-amber-50/40 rounded-2xl border border-stone-200 transition-colors space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">
                            {categories.find((c) => c.id === item.category)?.icon || '💡'}
                          </span>
                          <span className="text-xs font-black text-stone-800">
                            {categories.find((c) => c.id === item.category)?.name || '일반 상담'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                              item.urgencyLevel === 'URGENT'
                                ? 'bg-rose-100 text-rose-700'
                                : item.urgencyLevel === 'ATTENTION'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {item.urgencyLevel}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {new Date(item.createdAt).toLocaleDateString('ko-KR', {
                              month: 'numeric',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs font-bold text-stone-700">Q. "{item.userQuery}"</p>

                      <div className="p-2.5 bg-white rounded-xl border border-stone-100 text-[11px] space-y-1">
                        <p className="text-stone-800 font-medium leading-relaxed">{item.summary}</p>
                        <p className="text-[#8B5E3C] font-semibold text-[10px] italic">
                          "{item.innerVoiceTranslation}"
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
