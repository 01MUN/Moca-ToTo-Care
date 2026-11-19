import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Camera,
  Upload,
  Sparkles,
  RefreshCw,
  Download,
  Check,
  Gamepad2,
  Sliders,
  Eye,
  Heart,
  Zap,
  Award,
  Volume2,
  ArrowRight,
  Palette,
  FlipHorizontal,
  Layers,
  Smile,
  Moon,
  Gift,
  Play,
  Pause,
  Grid,
} from 'lucide-react';
import { PetProfile, PixelCharacterAnalysis, PixelSpritePose, PixelFurColorPreset } from '../types';
import {
  drawKawaiiPixelSprite,
  FUR_COLOR_PRESETS,
  KawaiiSpriteOptions,
  PixelDensity,
} from '../utils/kawaiiPixelEngine';
import confetti from 'canvas-confetti';

interface PixelPetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPet: PetProfile;
  onApplyAvatar: (pixelDataUrl: string) => void;
}

const SAMPLE_PET_PHOTOS = [
  {
    name: '고등어 냥이 (태비)',
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400',
    preset: 'grey_tabby' as PixelFurColorPreset,
    pose: 'belly_up_heart' as PixelSpritePose,
    species: 'cat' as const,
  },
  {
    name: '순백 요정 (화이트 냥이)',
    url: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=400',
    preset: 'white' as PixelFurColorPreset,
    pose: 'sitting_cute' as PixelSpritePose,
    species: 'cat' as const,
  },
  {
    name: '치즈 태비 (오렌지)',
    url: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400',
    preset: 'cheese_tabby' as PixelFurColorPreset,
    pose: 'sleeping_cushion' as PixelSpritePose,
    species: 'cat' as const,
  },
  {
    name: '크림 말티푸 (댕댕이)',
    url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400',
    preset: 'cream_maltipoo' as PixelFurColorPreset,
    pose: 'fluffy_ribbon' as PixelSpritePose,
    species: 'dog' as const,
  },
];

export const PixelPetModal: React.FC<PixelPetModalProps> = ({
  isOpen,
  onClose,
  currentPet,
  onApplyAvatar,
}) => {
  // Navigation tabs: 'studio' | 'rpg_card'
  const [activeTab, setActiveTab] = useState<'studio' | 'rpg_card'>('studio');

  // Input source mode
  const [sourceMode, setSourceMode] = useState<'upload' | 'camera' | 'sample'>('sample');
  const [selectedImageSrc, setSelectedImageSrc] = useState<string>(currentPet.avatarUrl);

  // Camera states
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- KAWAII PIXEL SPRITE TUNING STATES ---
  const [gridResolution, setGridResolution] = useState<PixelDensity>(64); // Default HD 64x64
  const [pose, setPose] = useState<PixelSpritePose>('sitting_cute');
  const [species, setSpecies] = useState<'cat' | 'dog'>('cat');
  const [selectedPresetId, setSelectedPresetId] = useState<PixelFurColorPreset>('white');
  const [mainFurColor, setMainFurColor] = useState<string>('#FFFFFF');
  const [secondaryFurColor, setSecondaryFurColor] = useState<string>('#F7F7FA');
  const [stripeColor, setStripeColor] = useState<string>('#E2E2EA');
  const [hasStripes, setHasStripes] = useState<boolean>(false);
  const [hasWhitePaws, setHasWhitePaws] = useState<boolean>(true);
  const [eyeColor, setEyeColor] = useState<string>('#423748');
  const [blushColor, setBlushColor] = useState<string>('#FFAAA6');
  const [innerEarColor, setInnerEarColor] = useState<string>('#FFB8C6');
  const [outlineColor, setOutlineColor] = useState<string>('#362E3B');

  // Accessories & Detail Toggles
  const [showFloatingHeart, setShowFloatingHeart] = useState<boolean>(true);
  const [showPacifier, setShowPacifier] = useState<boolean>(true);
  const [showRibbon, setShowRibbon] = useState<boolean>(false);
  const [showCushion, setShowCushion] = useState<boolean>(false);
  const [showSleepZzz, setShowSleepZzz] = useState<boolean>(false);
  const [showWhiskers, setShowWhiskers] = useState<boolean>(true);
  const [isSleepingEyes, setIsSleepingEyes] = useState<boolean>(false);

  // Animation & Backdrop
  const [backdrop, setBackdrop] = useState<'dark' | 'white' | 'cream' | 'lavender' | 'transparent'>('dark');
  const [isAnimated, setIsAnimated] = useState<boolean>(true);
  const [animTick, setAnimTick] = useState<number>(0);

  // AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState<PixelCharacterAnalysis | null>(null);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState<boolean>(false);
  const [isAppliedSuccess, setIsAppliedSuccess] = useState<boolean>(false);
  const [pixelResultUrl, setPixelResultUrl] = useState<string>('');

  // Apply a preset
  const applyPreset = useCallback((presetId: PixelFurColorPreset) => {
    const p = FUR_COLOR_PRESETS.find((x) => x.id === presetId);
    if (!p) return;
    setSelectedPresetId(presetId);
    setSpecies(p.species);
    setMainFurColor(p.mainFur);
    setSecondaryFurColor(p.secondaryFur);
    setStripeColor(p.stripeColor);
    setHasStripes(p.hasStripes);
    setHasWhitePaws(p.hasWhitePaws);
    setEyeColor(p.eyeColor);
    setBlushColor(p.blushColor);
    setInnerEarColor(p.innerEarColor);
    setOutlineColor(p.outlineColor);
  }, []);

  // Animation Loop
  useEffect(() => {
    if (!isAnimated) return;
    const interval = setInterval(() => {
      setAnimTick((t) => (t + 1) % 360);
    }, 90);
    return () => clearInterval(interval);
  }, [isAnimated]);

  // Re-draw Canvas
  const redrawCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    const options: KawaiiSpriteOptions = {
      pose,
      species,
      gridResolution,
      mainFurColor,
      secondaryFurColor,
      stripeColor,
      hasStripes,
      hasWhitePaws,
      eyeColor,
      blushColor,
      innerEarColor,
      outlineColor,
      showFloatingHeart,
      showPacifier,
      showRibbon,
      showCushion,
      showSleepZzz,
      showWhiskers,
      isSleepingEyes,
      animTick,
      backdrop,
    };
    const dataUrl = drawKawaiiPixelSprite(canvasRef.current, options);
    setPixelResultUrl(dataUrl);
  }, [
    pose,
    species,
    gridResolution,
    mainFurColor,
    secondaryFurColor,
    stripeColor,
    hasStripes,
    hasWhitePaws,
    eyeColor,
    blushColor,
    innerEarColor,
    outlineColor,
    showFloatingHeart,
    showPacifier,
    showRibbon,
    showCushion,
    showSleepZzz,
    showWhiskers,
    isSleepingEyes,
    animTick,
    backdrop,
  ]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Handle Camera
  const startCamera = async () => {
    try {
      setCameraError(null);
      if (videoRef.current && videoRef.current.srcObject) {
        const s = videoRef.current.srcObject as MediaStream;
        s.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacingMode,
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('카메라를 시작할 수 없습니다. 권한 설정을 확인해주세요.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const handleCaptureFromCamera = () => {
    if (!videoRef.current) return;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 400;
    tempCanvas.height = 400;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, 400, 400);
    const capturedDataUrl = tempCanvas.toDataURL('image/jpeg', 0.9);
    setSelectedImageSrc(capturedDataUrl);
    stopCamera();
    setSourceMode('upload');
    analyzePhotoWithAI(capturedDataUrl);
  };

  // Handle Photo Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setSelectedImageSrc(url);
      setSourceMode('upload');
      analyzePhotoWithAI(url);
    };
    reader.readAsDataURL(file);
  };

  // AI Analysis with Gemini 3.7 Flash
  const analyzePhotoWithAI = async (imageDataUrl: string) => {
    setIsAnalyzingAI(true);
    try {
      let base64 = imageDataUrl;
      let mimeType = 'image/jpeg';
      if (imageDataUrl.startsWith('data:')) {
        const parts = imageDataUrl.split(',');
        mimeType = parts[0].split(':')[1].split(';')[0];
        base64 = parts[1];
      }

      const response = await fetch('/api/v1/ai/pixel-characterize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petName: currentPet.name,
          breed: currentPet.breed,
          imageBase64: base64,
          imageMimeType: mimeType,
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        const analysis: PixelCharacterAnalysis = resData.data;
        setAiAnalysis(analysis);

        // Apply AI detected traits
        if (analysis.furColorPreset) {
          applyPreset(analysis.furColorPreset);
        }
        if (analysis.species) {
          setSpecies(analysis.species);
        }
        if (analysis.recommendedPose) {
          setPose(analysis.recommendedPose);
        }
        if (analysis.mainFurHex) setMainFurColor(analysis.mainFurHex);
        if (analysis.secondaryFurHex) setSecondaryFurColor(analysis.secondaryFurHex);
        if (analysis.eyeHex) setEyeColor(analysis.eyeHex);
        if (analysis.blushHex) setBlushColor(analysis.blushHex);
        if (typeof analysis.hasTabbyStripes === 'boolean') setHasStripes(analysis.hasTabbyStripes);
        if (typeof analysis.hasWhitePaws === 'boolean') setHasWhitePaws(analysis.hasWhitePaws);

        if (Array.isArray(analysis.accessories)) {
          setShowFloatingHeart(analysis.accessories.includes('floating_heart'));
          setShowPacifier(analysis.accessories.includes('pacifier'));
          setShowRibbon(analysis.accessories.includes('pink_ribbon'));
          setShowCushion(analysis.accessories.includes('lace_cushion'));
        }
      }
    } catch (err) {
      console.warn('AI analysis fallback:', err);
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  // Apply as Avatar
  const handleApplyToPet = () => {
    if (!pixelResultUrl) return;
    onApplyAvatar(pixelResultUrl);
    setIsAppliedSuccess(true);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF85A1', '#FFAAA6', '#FFD1DC', '#FFAEC8', '#8B5E3C'],
    });
    setTimeout(() => {
      setIsAppliedSuccess(false);
      onClose();
    }, 1200);
  };

  // Download High-Res Pixel PNG
  const handleDownloadPNG = () => {
    if (!canvasRef.current) return;
    const downloadCanvas = document.createElement('canvas');
    downloadCanvas.width = 512;
    downloadCanvas.height = 512;
    drawKawaiiPixelSprite(downloadCanvas, {
      pose,
      species,
      gridResolution,
      mainFurColor,
      secondaryFurColor,
      stripeColor,
      hasStripes,
      hasWhitePaws,
      eyeColor,
      blushColor,
      innerEarColor,
      outlineColor,
      showFloatingHeart,
      showPacifier,
      showRibbon,
      showCushion,
      showSleepZzz,
      showWhiskers,
      isSleepingEyes,
      animTick,
      backdrop,
    });
    const link = document.createElement('a');
    link.download = `fluffy_days_pixel_${currentPet.name}_${gridResolution}px.png`;
    link.href = downloadCanvas.toDataURL('image/png');
    link.click();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-[#1C1D24] text-slate-100 rounded-3xl border border-slate-700/60 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-[#15161B]/90 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-400 to-amber-300 flex items-center justify-center shadow-lg shadow-pink-500/20 text-white">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-white tracking-tight">
                    카와이 픽셀 펫 스튜디오
                  </h3>
                  <span className="bg-pink-500/20 text-pink-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-pink-500/30">
                    HD {gridResolution}×{gridResolution} Micro-Dots
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  고밀도 픽셀 그리드로 디테일한 음영과 반짝이는 눈망울, 포근한 털결을 표현합니다.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sub Navigation Bar */}
          <div className="flex border-b border-slate-800 bg-[#17181F] px-4">
            <button
              onClick={() => setActiveTab('studio')}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition ${
                activeTab === 'studio'
                  ? 'border-pink-500 text-pink-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>픽셀 캐릭터 스튜디오</span>
            </button>
            <button
              onClick={() => setActiveTab('rpg_card')}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition ${
                activeTab === 'rpg_card'
                  ? 'border-pink-500 text-pink-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>레트로 RPG 캐릭터 카드</span>
              {aiAnalysis && (
                <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
              )}
            </button>
          </div>

          {/* Main Content Area */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
            {activeTab === 'studio' ? (
              <>
                {/* 1. Main Pixel Art Stage & Live Canvas */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* Left: Pixel Art Screen */}
                  <div className="md:col-span-6 flex flex-col items-center justify-center">
                    <div className="relative w-full aspect-square max-w-[280px] bg-[#121316] rounded-2xl border-4 border-slate-700/80 shadow-inner flex items-center justify-center p-2.5 overflow-hidden group">
                      {/* Live Canvas */}
                      <canvas
                        ref={canvasRef}
                        width={384}
                        height={384}
                        className="w-full h-full object-contain image-rendering-pixelated rounded-lg shadow-md"
                        style={{ imageRendering: 'pixelated' }}
                      />

                      {/* AI Analyzing Overlay */}
                      {isAnalyzingAI && (
                        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4">
                          <Sparkles className="w-8 h-8 text-pink-400 animate-spin mb-2" />
                          <p className="text-xs font-bold text-pink-300">
                            Gemini AI 시각 관찰 중...
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            털 색상, 무늬, 눈동자를 분석하고 있습니다
                          </p>
                        </div>
                      )}

                      {/* Backdrop Switcher in Corner */}
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur px-2 py-1 rounded-lg border border-white/10">
                        <button
                          onClick={() => setBackdrop('dark')}
                          title="다크 차콜 배경 (레퍼런스)"
                          className={`w-3.5 h-3.5 rounded-full bg-[#1E2024] border ${
                            backdrop === 'dark' ? 'border-pink-400 scale-110' : 'border-slate-600'
                          }`}
                        />
                        <button
                          onClick={() => setBackdrop('white')}
                          title="화이트 배경"
                          className={`w-3.5 h-3.5 rounded-full bg-white border ${
                            backdrop === 'white' ? 'border-pink-400 scale-110' : 'border-slate-600'
                          }`}
                        />
                        <button
                          onClick={() => setBackdrop('lavender')}
                          title="파스텔 라벤더 배경"
                          className={`w-3.5 h-3.5 rounded-full bg-[#F5F0FF] border ${
                            backdrop === 'lavender' ? 'border-pink-400 scale-110' : 'border-slate-600'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Quick Canvas Controls */}
                    <div className="flex items-center justify-center gap-2 mt-3 w-full">
                      <button
                        onClick={() => setIsAnimated(!isAnimated)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition ${
                          isAnimated
                            ? 'bg-pink-500/20 text-pink-300 border-pink-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {isAnimated ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        <span>{isAnimated ? '애니메이션 ON' : '정지 화면'}</span>
                      </button>

                      <button
                        onClick={handleDownloadPNG}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition"
                      >
                        <Download className="w-3 h-3 text-emerald-400" />
                        <span>PNG 저장</span>
                      </button>
                    </div>
                  </div>

                  {/* Right: Pose & Density Selector */}
                  <div className="md:col-span-6 space-y-3">
                    {/* 픽셀 해상도/밀도 선택기 (HD 64x64 / Ultra 80x80) */}
                    <div className="bg-[#15161D] p-3 rounded-2xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-pink-300 flex items-center gap-1.5">
                          <Grid className="w-3.5 h-3.5" />
                          <span>픽셀 해상도 (디테일 밀도)</span>
                        </span>
                        <span className="text-[10px] text-pink-400 font-mono font-bold bg-pink-500/15 px-2 py-0.5 rounded">
                          {gridResolution}×{gridResolution}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          onClick={() => setGridResolution(48)}
                          className={`py-1.5 px-2 rounded-xl text-xs font-bold transition border ${
                            gridResolution === 48
                              ? 'bg-pink-500 text-white border-pink-400 shadow-sm'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                          }`}
                        >
                          48px (클래식)
                        </button>
                        <button
                          onClick={() => setGridResolution(64)}
                          className={`py-1.5 px-2 rounded-xl text-xs font-bold transition border ${
                            gridResolution === 64
                              ? 'bg-pink-500 text-white border-pink-400 shadow-sm'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                          }`}
                        >
                          64px (HD 추천)
                        </button>
                        <button
                          onClick={() => setGridResolution(80)}
                          className={`py-1.5 px-2 rounded-xl text-xs font-bold transition border ${
                            gridResolution === 80
                              ? 'bg-pink-500 text-white border-pink-400 shadow-sm'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                          }`}
                        >
                          80px (울트라)
                        </button>
                      </div>
                    </div>

                    <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-pink-300">
                        <Sparkles className="w-3.5 h-3.5" />
                        시그니처 레퍼런스 포즈 (4종)
                      </span>
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Pose 1: Sitting Cute */}
                      <button
                        onClick={() => {
                          setPose('sitting_cute');
                          setShowPacifier(true);
                          setShowFloatingHeart(false);
                          setShowCushion(false);
                          setIsSleepingEyes(false);
                        }}
                        className={`p-3 rounded-2xl text-left border transition flex flex-col justify-between ${
                          pose === 'sitting_cute'
                            ? 'bg-pink-500/15 border-pink-500 text-white shadow-md shadow-pink-500/10'
                            : 'bg-[#15161D] border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-lg">🐾</span>
                          {pose === 'sitting_cute' && (
                            <Check className="w-3.5 h-3.5 text-pink-400" />
                          )}
                        </div>
                        <div className="mt-2">
                          <div className="text-xs font-bold">정면 똘망 & 쪽쪽이</div>
                          <div className="text-[10px] text-slate-400">
                            동글동글 앞발 모으기
                          </div>
                        </div>
                      </button>

                      {/* Pose 2: Belly Up + Heart */}
                      <button
                        onClick={() => {
                          setPose('belly_up_heart');
                          setShowFloatingHeart(true);
                          setShowCushion(false);
                          setHasStripes(true);
                        }}
                        className={`p-3 rounded-2xl text-left border transition flex flex-col justify-between ${
                          pose === 'belly_up_heart'
                            ? 'bg-pink-500/15 border-pink-500 text-white shadow-md shadow-pink-500/10'
                            : 'bg-[#15161D] border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-lg">💖</span>
                          {pose === 'belly_up_heart' && (
                            <Check className="w-3.5 h-3.5 text-pink-400" />
                          )}
                        </div>
                        <div className="mt-2">
                          <div className="text-xs font-bold">배 까고 뒹굴 + 하트</div>
                          <div className="text-[10px] text-slate-400">
                            양말 4발 든 애교 포즈
                          </div>
                        </div>
                      </button>

                      {/* Pose 3: Sleeping Cushion */}
                      <button
                        onClick={() => {
                          setPose('sleeping_cushion');
                          setShowCushion(true);
                          setShowSleepZzz(true);
                          setIsSleepingEyes(true);
                        }}
                        className={`p-3 rounded-2xl text-left border transition flex flex-col justify-between ${
                          pose === 'sleeping_cushion'
                            ? 'bg-pink-500/15 border-pink-500 text-white shadow-md shadow-pink-500/10'
                            : 'bg-[#15161D] border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-lg">🛏️</span>
                          {pose === 'sleeping_cushion' && (
                            <Check className="w-3.5 h-3.5 text-pink-400" />
                          )}
                        </div>
                        <div className="mt-2">
                          <div className="text-xs font-bold">핑크 레이스 방석 낮잠</div>
                          <div className="text-[10px] text-slate-400">
                            새근새근 쿨쿨 수면
                          </div>
                        </div>
                      </button>

                      {/* Pose 4: Fluffy Ribbon */}
                      <button
                        onClick={() => {
                          setPose('fluffy_ribbon');
                          setShowRibbon(true);
                          setShowFloatingHeart(true);
                          setShowCushion(false);
                        }}
                        className={`p-3 rounded-2xl text-left border transition flex flex-col justify-between ${
                          pose === 'fluffy_ribbon'
                            ? 'bg-pink-500/15 border-pink-500 text-white shadow-md shadow-pink-500/10'
                            : 'bg-[#15161D] border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-lg">🎀</span>
                          {pose === 'fluffy_ribbon' && (
                            <Check className="w-3.5 h-3.5 text-pink-400" />
                          )}
                        </div>
                        <div className="mt-2">
                          <div className="text-xs font-bold">핑크 리본 & 몽실 꼬리</div>
                          <div className="text-[10px] text-slate-400">
                            소프트 구름 털뭉치
                          </div>
                        </div>
                      </button>
                    </div>

                    {/* Species Switcher */}
                    <div className="flex items-center justify-between bg-[#15161D] p-2.5 rounded-2xl border border-slate-800">
                      <span className="text-xs text-slate-300 font-medium">동물 캐릭터 종:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSpecies('cat')}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                            species === 'cat'
                              ? 'bg-pink-500 text-white shadow-sm'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          🐱 고양이
                        </button>
                        <button
                          onClick={() => setSpecies('dog')}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                            species === 'dog'
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          🐶 강아지
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Photo Input & Gemini Vision Trigger */}
                <div className="p-4 rounded-2xl bg-[#15161D] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <Camera className="w-4 h-4 text-pink-400" />
                      <span>내 반려동물 사진으로 AI 픽셀 자동 생성</span>
                    </label>
                    {isAnalyzingAI && (
                      <span className="text-[11px] text-pink-400 font-medium animate-pulse">
                        분석 중...
                      </span>
                    )}
                  </div>

                  {/* Input Source Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => {
                        setSourceMode('upload');
                        stopCamera();
                        fileInputRef.current?.click();
                      }}
                      className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 flex items-center justify-center gap-1.5 transition"
                    >
                      <Upload className="w-3.5 h-3.5 text-blue-400" />
                      <span>사진 업로드</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />

                    <button
                      onClick={() => {
                        setSourceMode('camera');
                        startCamera();
                      }}
                      className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 flex items-center justify-center gap-1.5 transition"
                    >
                      <Camera className="w-3.5 h-3.5 text-emerald-400" />
                      <span>카메라 촬영</span>
                    </button>

                    <button
                      onClick={() => analyzePhotoWithAI(selectedImageSrc)}
                      disabled={isAnalyzingAI}
                      className="py-2.5 px-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl text-xs font-bold shadow-md shadow-pink-500/20 flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI 자동 맞춤</span>
                    </button>
                  </div>

                  {/* Camera Live View if Active */}
                  {isCameraActive && (
                    <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-h-[220px] flex items-center justify-center border border-slate-700">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-3">
                        <button
                          onClick={handleCaptureFromCamera}
                          className="px-5 py-2 bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1.5"
                        >
                          <Camera className="w-4 h-4" />
                          <span>찰칵 촬영하기</span>
                        </button>
                        <button
                          onClick={stopCamera}
                          className="px-3 py-2 bg-slate-800/80 text-slate-300 text-xs rounded-full"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Quick Preset Samples */}
                  <div className="pt-2">
                    <span className="text-[11px] text-slate-400 block mb-2 font-medium">
                      또는 빠른 테스트 샘플 선택:
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      {SAMPLE_PET_PHOTOS.map((sample, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedImageSrc(sample.url);
                            applyPreset(sample.preset);
                            setPose(sample.pose);
                            setSpecies(sample.species);
                            analyzePhotoWithAI(sample.url);
                          }}
                          className="p-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/50 flex flex-col items-center gap-1 transition text-center"
                        >
                          <img
                            src={sample.url}
                            alt={sample.name}
                            className="w-9 h-9 rounded-lg object-cover"
                          />
                          <span className="text-[10px] text-slate-300 font-medium truncate w-full">
                            {sample.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Fur Coat & Details Color Customizer */}
                <div className="p-4 rounded-2xl bg-[#15161D] border border-slate-800 space-y-3">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-pink-400" />
                    <span>털 색상 & 디테일 팔레트</span>
                  </label>

                  {/* Fur Presets Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {FUR_COLOR_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => applyPreset(p.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border flex items-center gap-1.5 transition ${
                          selectedPresetId === p.id
                            ? 'bg-pink-500/20 text-pink-300 border-pink-500/40'
                            : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-slate-200'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/20"
                          style={{ backgroundColor: p.mainFur }}
                        />
                        <span>{p.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Accessory & Detail Toggles */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-[11px] text-slate-400 block mb-2 font-medium">
                      액세서리 & 디테일 토글:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        onClick={() => setShowFloatingHeart(!showFloatingHeart)}
                        className={`p-2 rounded-xl text-xs font-medium border flex items-center justify-between transition ${
                          showFloatingHeart
                            ? 'bg-pink-500/15 border-pink-500/40 text-pink-300'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        <span>💖 픽셀 하트</span>
                        {showFloatingHeart && <Check className="w-3 h-3" />}
                      </button>

                      <button
                        onClick={() => setShowPacifier(!showPacifier)}
                        className={`p-2 rounded-xl text-xs font-medium border flex items-center justify-between transition ${
                          showPacifier
                            ? 'bg-pink-500/15 border-pink-500/40 text-pink-300'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        <span>🍼 아기 쪽쪽이</span>
                        {showPacifier && <Check className="w-3 h-3" />}
                      </button>

                      <button
                        onClick={() => setShowRibbon(!showRibbon)}
                        className={`p-2 rounded-xl text-xs font-medium border flex items-center justify-between transition ${
                          showRibbon
                            ? 'bg-pink-500/15 border-pink-500/40 text-pink-300'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        <span>🎀 귀 핑크 리본</span>
                        {showRibbon && <Check className="w-3 h-3" />}
                      </button>

                      <button
                        onClick={() => setHasStripes(!hasStripes)}
                        className={`p-2 rounded-xl text-xs font-medium border flex items-center justify-between transition ${
                          hasStripes
                            ? 'bg-pink-500/15 border-pink-500/40 text-pink-300'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        <span>🐯 태비 줄무늬</span>
                        {hasStripes && <Check className="w-3 h-3" />}
                      </button>

                      <button
                        onClick={() => setShowWhiskers(!showWhiskers)}
                        className={`p-2 rounded-xl text-xs font-medium border flex items-center justify-between transition ${
                          showWhiskers
                            ? 'bg-pink-500/15 border-pink-500/40 text-pink-300'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        <span>✨ 수염 디테일</span>
                        {showWhiskers && <Check className="w-3 h-3" />}
                      </button>

                      <button
                        onClick={() => setHasWhitePaws(!hasWhitePaws)}
                        className={`p-2 rounded-xl text-xs font-medium border flex items-center justify-between transition ${
                          hasWhitePaws
                            ? 'bg-pink-500/15 border-pink-500/40 text-pink-300'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        <span>🧦 흰 양말 솜방망이</span>
                        {hasWhitePaws && <Check className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* RPG CARD TAB */
              <div className="space-y-4">
                {/* 8-Bit Retro Gameboy Frame */}
                <div className="bg-gradient-to-b from-[#2B2D38] to-[#1E2028] p-5 rounded-3xl border-2 border-pink-500/30 shadow-2xl space-y-4">
                  {/* Top Badge */}
                  <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🎮</span>
                      <div>
                        <div className="text-xs font-bold text-pink-400">
                          {aiAnalysis?.personalityTitle || '🌸 우주최강 8비트 요정 (Lv.99)'}
                        </div>
                        <h4 className="text-base font-bold text-white tracking-tight">
                          {aiAnalysis?.pixelCharacterName || `픽셀 ${currentPet.name}`}
                        </h4>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono bg-pink-500 text-white font-bold px-2 py-0.5 rounded">
                      HP 999 / MP 999
                    </span>
                  </div>

                  {/* Character Sprite Box */}
                  <div className="bg-[#121316] rounded-2xl p-4 flex flex-col items-center border border-slate-700 shadow-inner">
                    <img
                      src={pixelResultUrl}
                      alt="Pixel Sprite"
                      className="w-36 h-36 object-contain image-rendering-pixelated drop-shadow-lg"
                      style={{ imageRendering: 'pixelated' }}
                    />

                    {/* Dialogue Bubble */}
                    <div className="mt-3 w-full bg-[#1C1D24] p-3 rounded-xl border border-pink-500/30 text-xs text-pink-200 font-mono flex items-start gap-2">
                      <span className="text-pink-400 font-bold shrink-0">💬</span>
                      <p className="leading-relaxed">
                        "{aiAnalysis?.retroDialogue || '집사님! 저 픽셀 세상에서도 진짜 귀엽죠? 하트 뿅뿅 날려드릴게요! 💖'}"
                      </p>
                    </div>
                  </div>

                  {/* RPG Stats Grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-[#15161D] p-2.5 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-pink-400" />
                          <span>복슬복슬 지수</span>
                        </span>
                        <span className="font-mono text-pink-300 font-bold">
                          {aiAnalysis?.rpgStats?.fluffiness || 99}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-pink-500 h-full rounded-full"
                          style={{ width: `${aiAnalysis?.rpgStats?.fluffiness || 99}%` }}
                        />
                      </div>
                    </div>

                    <div className="bg-[#15161D] p-2.5 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>우다다 광폭화</span>
                        </span>
                        <span className="font-mono text-amber-300 font-bold">
                          {aiAnalysis?.rpgStats?.zoomies || 92}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-500 h-full rounded-full"
                          style={{ width: `${aiAnalysis?.rpgStats?.zoomies || 92}%` }}
                        />
                      </div>
                    </div>

                    <div className="bg-[#15161D] p-2.5 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3 text-rose-400" />
                          <span>간식 레이더</span>
                        </span>
                        <span className="font-mono text-rose-300 font-bold">
                          {aiAnalysis?.rpgStats?.treatRadar || 100}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-rose-500 h-full rounded-full"
                          style={{ width: `${aiAnalysis?.rpgStats?.treatRadar || 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="bg-[#15161D] p-2.5 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span className="flex items-center gap-1">
                          <Award className="w-3 h-3 text-emerald-400" />
                          <span>보호자 애착도</span>
                        </span>
                        <span className="font-mono text-emerald-300 font-bold">
                          {aiAnalysis?.rpgStats?.loyalty || 95}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${aiAnalysis?.rpgStats?.loyalty || 95}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Action Bar */}
          <div className="px-5 py-4 border-t border-slate-800 bg-[#15161B] flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              닫기
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPNG}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>PNG 다운로드</span>
              </button>

              <button
                onClick={handleApplyToPet}
                disabled={isAppliedSuccess}
                className="px-5 py-2.5 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 hover:opacity-95 text-white rounded-xl text-xs font-bold shadow-lg shadow-pink-500/25 flex items-center gap-1.5 transition"
              >
                {isAppliedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>적용 완료!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>대표 펫 아바타로 적용</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
