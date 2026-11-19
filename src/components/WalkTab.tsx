import React, { useState, useEffect, useRef } from 'react';
import { WalkSession, PetProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  Footprints,
  Play,
  Square,
  Sparkles,
  Award,
  Flame,
  CheckCircle,
  MapPin,
  RefreshCw,
  Navigation,
  Layers,
  LocateFixed,
  Compass,
  Zap,
  Activity,
  Sliders,
  Check,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  GeoPoint,
  ScreenPoint,
  calculateDistanceKm,
  douglasPeucker,
  geoPathToSvgCoords,
  pointsToSmoothSvgPath,
  calculatePetWalkCalories,
} from '../utils/geoUtils';

interface WalkTabProps {
  pet: PetProfile;
  walkSessions: WalkSession[];
  onSaveWalkSession: (session: WalkSession) => void;
}

export const WalkTab: React.FC<WalkTabProps> = ({ pet, walkSessions, onSaveWalkSession }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [selectedShape, setSelectedShape] = useState<'paw' | 'heart' | 'bone'>('paw');
  const [isMorphing, setIsMorphing] = useState(false);
  const [isShapeified, setIsShapeified] = useState(false);
  const [finishedSession, setFinishedSession] = useState<WalkSession | null>(null);

  // Advanced GPS State
  const [geoPoints, setGeoPoints] = useState<GeoPoint[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsStatusMessage, setGpsStatusMessage] = useState<string>('GPS 대기 중');
  const [mapStyle, setMapStyle] = useState<'satellite' | 'dark' | 'emerald'>('dark');
  const [isSimulationMode, setIsSimulationMode] = useState<boolean>(false);
  const [douglasTolerance, setDouglasTolerance] = useState<number>(3.0);
  const [showSmoothingCompare, setShowSmoothingCompare] = useState<boolean>(false);

  const watchIdRef = useRef<number | null>(null);
  const simIntervalRef = useRef<any>(null);

  // Initial reference coordinates (Dosan Park, Gangnam-gu, Seoul)
  const BASE_LAT = 37.5244;
  const BASE_LNG = 127.0378;

  // Real GPS & Simulation Hook
  useEffect(() => {
    if (isTracking) {
      // 1. Check if real Geolocation is supported
      if ('geolocation' in navigator && !isSimulationMode) {
        setGpsStatusMessage('실시간 위성 GPS 수신 중...');
        try {
          watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
              const { latitude, longitude, accuracy } = pos.coords;
              setCurrentLocation({ lat: latitude, lng: longitude });
              setGpsAccuracy(Math.round(accuracy));
              setGpsStatusMessage(`위성 GPS 연결됨 (오차 ±${Math.round(accuracy)}m)`);

              setGeoPoints((prev) => {
                if (prev.length > 0) {
                  const last = prev[prev.length - 1];
                  const addedDist = calculateDistanceKm(last.lat, last.lng, latitude, longitude);
                  // Avoid zero-jitter micro updates
                  if (addedDist > 0.0005) {
                    setDistanceKm((d) => parseFloat((d + addedDist).toFixed(3)));
                    return [...prev, { lat: latitude, lng: longitude, timestamp: Date.now() }];
                  }
                  return prev;
                }
                return [{ lat: latitude, lng: longitude, timestamp: Date.now() }];
              });
            },
            (err) => {
              console.warn('Geolocation failed or permission denied, fallback to simulated park walk:', err);
              setGpsStatusMessage('시뮬레이션 가상 산책 모드로 전환');
              setIsSimulationMode(true);
            },
            { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
          );
        } catch (e) {
          setIsSimulationMode(true);
        }
      } else {
        // Fallback simulation mode
        setIsSimulationMode(true);
      }
    } else {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isTracking, isSimulationMode]);

  // Simulated GPS Walker (Smoothly walks around Dosan Park loop)
  useEffect(() => {
    if (isTracking && isSimulationMode) {
      let stepIndex = geoPoints.length;
      simIntervalRef.current = setInterval(() => {
        stepIndex++;
        const angle = (stepIndex * 0.2) % (Math.PI * 2);
        const radiusLat = 0.0018 + Math.sin(stepIndex * 0.15) * 0.0005;
        const radiusLng = 0.0022 + Math.cos(stepIndex * 0.1) * 0.0005;

        // Jitter for raw GPS realism
        const jitterLat = (Math.random() - 0.5) * 0.00015;
        const jitterLng = (Math.random() - 0.5) * 0.00015;

        const nextLat = BASE_LAT + Math.cos(angle) * radiusLat + jitterLat;
        const nextLng = BASE_LNG + Math.sin(angle) * radiusLng + jitterLng;

        setCurrentLocation({ lat: nextLat, lng: nextLng });
        setGpsAccuracy(3);
        setGpsStatusMessage('도산공원 실시간 산책로 시뮬레이션');

        setGeoPoints((prev) => {
          if (prev.length > 0) {
            const last = prev[prev.length - 1];
            const addedDist = calculateDistanceKm(last.lat, last.lng, nextLat, nextLng);
            setDistanceKm((d) => parseFloat((d + addedDist).toFixed(3)));
            return [...prev, { lat: nextLat, lng: nextLng, timestamp: Date.now() }];
          }
          return [{ lat: nextLat, lng: nextLng, timestamp: Date.now() }];
        });
      }, 1200);
    } else {
      clearInterval(simIntervalRef.current);
    }

    return () => clearInterval(simIntervalRef.current);
  }, [isTracking, isSimulationMode]);

  // Main Timer Loop
  useEffect(() => {
    let interval: any = null;
    if (isTracking) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTracking]);

  const handleStartWalk = () => {
    setIsTracking(true);
    setTimerSeconds(0);
    setDistanceKm(0);
    setIsShapeified(false);
    setFinishedSession(null);
    setGeoPoints([
      { lat: BASE_LAT, lng: BASE_LNG, timestamp: Date.now() },
      { lat: BASE_LAT + 0.0003, lng: BASE_LNG + 0.0004, timestamp: Date.now() + 1000 },
    ]);
  };

  const handleStopWalk = () => {
    setIsTracking(false);
    const weight = pet.weightKg || 3.8;
    const finalDist = Math.max(0.12, distanceKm);
    const cal = calculatePetWalkCalories(weight, finalDist);
    const steps = Math.round(finalDist * 1650);

    const screenCoords = geoPathToSvgCoords(geoPoints, 12);
    const smoothedCoords = douglasPeucker(screenCoords, douglasTolerance);

    const newSession: WalkSession = {
      id: `walk-${Date.now()}`,
      date: '방금 전 (오늘)',
      timeAgo: '방금 전',
      durationMinutes: Math.max(1, Math.round(timerSeconds / 60)),
      distanceKm: finalDist,
      calories: Math.max(15, cal),
      stepCount: Math.max(250, steps),
      rawPath: smoothedCoords.length > 0 ? smoothedCoords : [
        { x: 15, y: 75 },
        { x: 28, y: 55 },
        { x: 40, y: 80 },
        { x: 55, y: 40 },
        { x: 70, y: 65 },
        { x: 85, y: 80 },
      ],
      shapeType: 'raw',
      weather: '☀️ 24°C 맑음 / 도산공원',
      note: `${pet.name}와 함께한 상쾌한 GPS 산책 완료! 🐾`,
    };

    setFinishedSession(newSession);
    onSaveWalkSession(newSession);
  };

  const handleApplyShapeify = (shape: 'paw' | 'heart' | 'bone') => {
    setSelectedShape(shape);
    setIsMorphing(true);

    // Confetti and Morphing effect
    setTimeout(() => {
      setIsMorphing(false);
      setIsShapeified(true);

      confetti({
        particleCount: 50,
        spread: 85,
        origin: { y: 0.55 },
        colors: ['#8B5E3C', '#F59E0B', '#EC4899', '#10B981'],
      });

      if (finishedSession) {
        const updated = { ...finishedSession, shapeType: shape };
        setFinishedSession(updated);
        onSaveWalkSession(updated);
      }
    }, 850);
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Convert raw geo points to screen coordinates
  const rawScreenCoords = geoPathToSvgCoords(geoPoints, 12);
  const simplifiedCoords = douglasPeucker(rawScreenCoords, douglasTolerance);

  const rawPathD = pointsToSmoothSvgPath(
    rawScreenCoords.length >= 2
      ? rawScreenCoords
      : [
          { x: 15, y: 75 },
          { x: 30, y: 45 },
          { x: 50, y: 70 },
          { x: 70, y: 35 },
          { x: 85, y: 80 },
        ]
  );

  const simplifiedPathD = pointsToSmoothSvgPath(
    simplifiedCoords.length >= 2 ? simplifiedCoords : rawScreenCoords
  );

  // SVG Paths for Shapes
  const shapeSvgPaths = {
    paw: 'M 50,75 C 30,75 25,60 40,50 C 45,45 55,45 60,50 C 75,60 70,75 50,75 Z M 30,35 C 25,35 25,25 30,25 C 35,25 35,35 30,35 Z M 45,20 C 40,20 40,10 45,10 C 50,10 50,20 45,20 Z M 60,25 C 55,25 55,15 60,15 C 65,15 65,25 60,25 Z M 72,38 C 67,38 67,28 72,28 C 77,28 77,38 72,38 Z',
    heart: 'M 50,85 C 20,60 10,40 25,22 C 35,10 48,18 50,25 C 52,18 65,10 75,22 C 90,40 80,60 50,85 Z',
    bone: 'M 25,40 C 20,30 30,25 35,35 L 65,35 C 70,25 80,30 75,40 C 80,50 70,55 65,45 L 35,45 C 30,55 20,50 25,40 Z',
  };

  // Map background themes
  const mapThemes = {
    dark: 'bg-stone-900 border-stone-800',
    satellite: 'bg-[#15241C] border-emerald-900/60',
    emerald: 'bg-[#0E242B] border-cyan-950',
  };

  return (
    <div className="min-h-screen pb-28 pt-4 px-4 bg-[#FDF8F0] text-[#3D2C1E]">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-stone-900 flex items-center gap-2">
              <Footprints className="w-5 h-5 text-[#8B5E3C]" /> 실시간 GPS 산책 & Shapeify
            </h1>
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              실제 이동 궤적을 기록하고 귀여운 발바닥·하트 모양으로 정렬해보세요!
            </p>
          </div>
          <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-amber-200 shadow-2xs">
            ✨ AI Shapeify
          </span>
        </div>

        {/* Live GPS Map Canvas Display */}
        <div
          className={`relative rounded-3xl overflow-hidden shadow-xl border-2 transition-colors duration-300 min-h-[310px] flex flex-col justify-between p-4 ${mapThemes[mapStyle]}`}
        >
          {/* Simulated Map Background Grid / Satellites */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          {/* Top Status & Controls Bar */}
          <div className="relative z-10 flex items-center justify-between bg-black/65 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10 text-white text-xs">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isTracking ? 'bg-emerald-400 animate-ping' : 'bg-stone-500'
                }`}
              />
              <span className="font-bold text-[11px]">{gpsStatusMessage}</span>
            </div>

            {/* Map Theme Toggle */}
            <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-xl text-[10px]">
              <button
                onClick={() => setMapStyle('dark')}
                className={`px-2 py-0.5 rounded-lg transition-all ${
                  mapStyle === 'dark' ? 'bg-white text-stone-900 font-bold' : 'text-stone-300'
                }`}
              >
                다크
              </button>
              <button
                onClick={() => setMapStyle('satellite')}
                className={`px-2 py-0.5 rounded-lg transition-all ${
                  mapStyle === 'satellite' ? 'bg-emerald-500 text-white font-bold' : 'text-stone-300'
                }`}
              >
                숲
              </button>
            </div>
          </div>

          {/* Interactive Route Canvas SVG */}
          <div className="relative z-10 my-3 h-44 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full max-w-[220px]">
              {/* Grid Compass Lines */}
              <path
                d="M 10 50 L 90 50 M 50 10 L 50 90"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

              {!isShapeified ? (
                <>
                  {/* Original Raw Jitter Route (Orange dotted) */}
                  {showSmoothingCompare && (
                    <motion.path
                      d={rawPathD}
                      fill="none"
                      stroke="#F97316"
                      strokeWidth="2"
                      strokeDasharray="3,3"
                      opacity={0.6}
                    />
                  )}

                  {/* Douglas-Peucker Smoothed GPS Line (Glowing Emerald) */}
                  <motion.path
                    d={simplifiedPathD}
                    fill="none"
                    stroke={isTracking ? '#10B981' : '#F59E0B'}
                    strokeWidth="3.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={isTracking ? '100' : '0'}
                    animate={isTracking ? { strokeDashoffset: [100, 0] } : { strokeDashoffset: 0 }}
                    transition={{ duration: 3.5, repeat: isTracking ? Infinity : 0 }}
                  />
                </>
              ) : (
                /* Morphed Shapeify Cute Route */
                <motion.path
                  key={selectedShape}
                  d={shapeSvgPaths[selectedShape]}
                  fill="rgba(245, 158, 11, 0.22)"
                  stroke="#F59E0B"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 220 }}
                />
              )}

              {/* Start Pin Marker */}
              <circle cx="15" cy="75" r="4.5" fill="#22C55E" />
              <text x="15" y="77" fontSize="4" fill="white" textAnchor="middle" fontWeight="bold">
                S
              </text>

              {/* Live Location Pulsing Pin */}
              {rawScreenCoords.length > 0 && (
                <g>
                  <circle
                    cx={rawScreenCoords[rawScreenCoords.length - 1].x}
                    cy={rawScreenCoords[rawScreenCoords.length - 1].y}
                    r="6"
                    fill="#3B82F6"
                    opacity={0.4}
                    className="animate-ping"
                  />
                  <circle
                    cx={rawScreenCoords[rawScreenCoords.length - 1].x}
                    cy={rawScreenCoords[rawScreenCoords.length - 1].y}
                    r="4"
                    fill="#3B82F6"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                </g>
              )}
            </svg>

            {/* Morphing Loading Overlay */}
            {isMorphing && (
              <div className="absolute inset-0 bg-black/75 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center text-white space-y-2">
                <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
                <p className="text-xs font-bold text-amber-200">
                  GPS 경로를 {selectedShape === 'paw' ? '발바닥 🐾' : selectedShape === 'heart' ? '하트 ❤️' : '뼈다귀 🦴'}{' '}
                  모양으로 모핑 중...
                </p>
              </div>
            )}
          </div>

          {/* Live Stats Row */}
          <div className="relative z-10 grid grid-cols-3 gap-2 text-center text-white bg-black/65 backdrop-blur-md p-2.5 rounded-2xl border border-white/10">
            <div>
              <p className="text-[10px] text-stone-400 font-medium">산책 시간</p>
              <p className="text-sm font-black font-mono text-amber-300">
                {isTracking ? formatTimer(timerSeconds) : finishedSession ? `${finishedSession.durationMinutes}분` : '00:00'}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-stone-400 font-medium">실시간 거리</p>
              <p className="text-sm font-black font-mono text-emerald-300">
                {isTracking ? `${distanceKm} km` : finishedSession ? `${finishedSession.distanceKm} km` : '0.00 km'}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-stone-400 font-medium">{pet.name} 소모 칼로리</p>
              <p className="text-sm font-black font-mono text-rose-300">
                {isTracking
                  ? `${calculatePetWalkCalories(pet.weightKg || 3.8, distanceKm)} kcal`
                  : finishedSession
                  ? `${finishedSession.calories} kcal`
                  : '0 kcal'}
              </p>
            </div>
          </div>
        </div>

        {/* Start / Stop Control Buttons */}
        <div className="flex items-center gap-2">
          {!isTracking ? (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleStartWalk}
              className="flex-1 py-4 bg-[#8B5E3C] hover:bg-[#724B2F] text-white rounded-2xl font-black text-sm shadow-md flex items-center justify-center gap-2 transition-colors"
            >
              <Play className="w-5 h-5 fill-white" /> 실시간 GPS 산책 시작하기
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleStopWalk}
              className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-sm shadow-md flex items-center justify-center gap-2 transition-colors animate-pulse"
            >
              <Square className="w-5 h-5 fill-white" /> 산책 완료 & 기록 저장
            </motion.button>
          )}
        </div>

        {/* Douglas-Peucker GPS Algorithm Settings Panel */}
        <div className="bg-white/95 rounded-3xl p-3.5 shadow-2xs border border-stone-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-stone-800 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#8B5E3C]" /> Douglas-Peucker GPS 스무딩 알고리즘
            </span>
            <button
              onClick={() => setShowSmoothingCompare(!showSmoothingCompare)}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-colors ${
                showSmoothingCompare
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-stone-100 text-stone-600 border-stone-200'
              }`}
            >
              {showSmoothingCompare ? '원본 노이즈 켜짐' : '원본 노이즈 비교'}
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-stone-600">
            <span>보정 민감도 (ε: {douglasTolerance.toFixed(1)})</span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-stone-400">수집: {geoPoints.length}pts</span>
              <span className="text-[10px] text-emerald-600 font-bold">
                → 보정: {simplifiedCoords.length}pts
              </span>
            </div>
          </div>

          <input
            type="range"
            min="1.0"
            max="6.0"
            step="0.5"
            value={douglasTolerance}
            onChange={(e) => setDouglasTolerance(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#8B5E3C]"
          />
        </div>

        {/* ✨ Shapeify Magic Controls (Activated after walk finish or anytime) */}
        {finishedSession && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/95 rounded-3xl p-4 shadow-sm border border-amber-200 space-y-3"
          >
            <div className="flex items-center justify-between border-b border-amber-100 pb-2">
              <span className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" /> Shapeify 마법 모양 변환
              </span>
              {isShapeified && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> 변환 완료!
                </span>
              )}
            </div>

            <p className="text-xs text-stone-600 leading-relaxed font-medium">
              산책한 실제 GPS 궤적을 아래의 귀여운 아트워크 모양으로 모핑(Morphing)합니다.
            </p>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleApplyShapeify('paw')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  selectedShape === 'paw' && isShapeified
                    ? 'bg-[#8B5E3C] text-white border-[#8B5E3C] font-bold shadow-md'
                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-amber-50'
                }`}
              >
                <span className="text-lg block mb-0.5">🐾</span>
                <span className="text-xs font-bold">강아지 발바닥</span>
              </button>

              <button
                onClick={() => handleApplyShapeify('heart')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  selectedShape === 'heart' && isShapeified
                    ? 'bg-rose-600 text-white border-rose-600 font-bold shadow-md'
                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-rose-50'
                }`}
              >
                <span className="text-lg block mb-0.5">❤️</span>
                <span className="text-xs font-bold">하트 모양</span>
              </button>

              <button
                onClick={() => handleApplyShapeify('bone')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  selectedShape === 'bone' && isShapeified
                    ? 'bg-amber-600 text-white border-amber-600 font-bold shadow-md'
                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-amber-50'
                }`}
              >
                <span className="text-lg block mb-0.5">🦴</span>
                <span className="text-xs font-bold">뼈다귀 모양</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Saved Walk Timeline History Cards */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-4 h-4 text-[#8B5E3C]" /> 최근 산책 및 Shapeify 아트 기록
          </h3>

          <div className="space-y-3">
            {walkSessions.map((ws) => (
              <div
                key={ws.id}
                className="bg-white/95 rounded-3xl p-4 shadow-sm border border-stone-200/80 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-amber-100 text-[#8B5E3C] flex items-center justify-center font-bold text-sm">
                      {ws.shapeType === 'paw' ? '🐾' : ws.shapeType === 'heart' ? '❤️' : ws.shapeType === 'bone' ? '🦴' : '📍'}
                    </span>
                    <div>
                      <p className="text-xs font-black text-stone-800">{ws.date}</p>
                      <p className="text-[10px] text-stone-400 font-medium">{ws.weather}</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-[#8B5E3C] bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    {ws.distanceKm} km
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-stone-50 p-2.5 rounded-2xl text-center text-xs">
                  <div>
                    <span className="text-[10px] text-stone-400 block font-medium">시간</span>
                    <span className="font-black text-stone-800">{ws.durationMinutes}분</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block font-medium">걸음수</span>
                    <span className="font-black text-stone-800">{ws.stepCount.toLocaleString()}보</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block font-medium">소모 칼로리</span>
                    <span className="font-black text-stone-800">{ws.calories} kcal</span>
                  </div>
                </div>

                {ws.note && (
                  <p className="text-[11px] text-stone-600 bg-amber-50/50 p-2 rounded-xl border border-amber-100/60 font-medium">
                    "{ws.note}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
