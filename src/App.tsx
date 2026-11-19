/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TabType, PetProfile, ThemeId, RecordItem, HealthRecord, WalkSession, CommunityPlace, User } from './types';
import {
  INITIAL_PETS,
  THEME_OPTIONS,
  INITIAL_DAILY_RECORDS,
  INITIAL_HEALTH_RECORDS,
  INITIAL_WALK_SESSIONS,
  INITIAL_COMMUNITY_PLACES,
} from './data/mockData';
import { petApiService, authApiService, authEvents, authStorage, isUnauthorizedError } from './services/api';
import { Splash } from './components/Splash';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { HomeTab } from './components/HomeTab';
import { RecordsTab } from './components/RecordsTab';
import { WalkTab } from './components/WalkTab';
import { CommunityTab } from './components/CommunityTab';
import { ThemeSelectorModal } from './components/ThemeSelectorModal';
import { AIInteractionModal } from './components/AIInteractionModal';
import { PixelPetModal } from './components/PixelPetModal';
import { AuthModal } from './components/AuthModal';
import { FamilyShareModal } from './components/FamilyShareModal';
import { MobileFrameWrapper } from './components/MobileFrameWrapper';
import { FlutterCodeViewerModal } from './components/FlutterCodeViewerModal';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, RefreshCw } from 'lucide-react';

type AuthStatus = 'checking' | 'authenticated' | 'anonymous';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [pets, setPets] = useState<PetProfile[]>(INITIAL_PETS);
  const [currentPetId, setCurrentPetId] = useState<string>(INITIAL_PETS[0].id);
  const [activeThemeId, setActiveThemeId] = useState<ThemeId>('living');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  // 'checking' while a stored token is verified via /auth/me; the app content is
  // only rendered when 'authenticated', otherwise a login gate is shown.
  const [authStatus, setAuthStatus] = useState<AuthStatus>(() =>
    authStorage.getToken() ? 'checking' : 'anonymous'
  );
  const [authNotice, setAuthNotice] = useState<string | undefined>(undefined);

  // Modals
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showPixelModal, setShowPixelModal] = useState(false);
  const [showFlutterModal, setShowFlutterModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);

  // App Data State
  const [dailyRecords, setDailyRecords] = useState<RecordItem[]>(INITIAL_DAILY_RECORDS);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>(INITIAL_HEALTH_RECORDS);
  const [walkSessions, setWalkSessions] = useState<WalkSession[]>(INITIAL_WALK_SESSIONS);
  const [communityPlaces, setCommunityPlaces] = useState<CommunityPlace[]>(INITIAL_COMMUNITY_PLACES);

  // Any protected request answered with 401 (expired/invalid token): the API
  // client has already cleared the token; drop the session and show the login gate.
  useEffect(() => {
    return authEvents.onUnauthorized(() => {
      setCurrentUser(null);
      setAuthStatus('anonymous');
      setAuthNotice('로그인이 만료되었습니다. 다시 로그인해주세요.');
    });
  }, []);

  // Public data (no login required)
  useEffect(() => {
    let isMounted = true;
    petApiService
      .getNearbyPlaces()
      .then((places) => {
        if (isMounted && places.length > 0) setCommunityPlaces(places);
      })
      .catch((err) => console.warn('Places sync warning:', err));
    return () => {
      isMounted = false;
    };
  }, []);

  // Verify a stored token on startup
  useEffect(() => {
    if (authStatus !== 'checking') return;
    let isMounted = true;
    authApiService
      .getMe()
      .then((me) => {
        if (!isMounted) return;
        applySession(me.user, me.managedPets);
      })
      .catch((err) => {
        if (!isMounted) return;
        // 401 is handled by the onUnauthorized listener; any other failure
        // (e.g. offline) also leaves the user logged out rather than faking a session.
        if (!isUnauthorizedError(err)) console.warn('Session check failed:', err);
        setAuthStatus('anonymous');
      });
    return () => {
      isMounted = false;
    };
  }, [authStatus]);

  // Load the logged-in user's records. Network failures may fall back to demo
  // data, but a 401 never does (it rejects and triggers the login gate instead).
  async function loadProtectedData() {
    setIsSyncing(true);
    try {
      const [backendDaily, backendHealth] = await Promise.all([
        petApiService.getDailyRecords(),
        petApiService.getHealthRecords(),
      ]);
      setDailyRecords(backendDaily);
      setHealthRecords(backendHealth);
    } catch (err) {
      if (!isUnauthorizedError(err)) console.warn('Backend sync warning:', err);
    } finally {
      setIsSyncing(false);
    }
  }

  function applySession(user: User, managedPets: PetProfile[]) {
    setCurrentUser(user);
    setAuthStatus('authenticated');
    setAuthNotice(undefined);
    if (managedPets && managedPets.length > 0) {
      setPets(managedPets);
      setCurrentPetId((prevId) => (managedPets.some((p) => p.id === prevId) ? prevId : managedPets[0].id));
    }
    void loadProtectedData();
  }

  const currentPet = pets.find((p) => p.id === currentPetId) || pets[0] || INITIAL_PETS[0];
  const activeTheme = THEME_OPTIONS.find((t) => t.id === activeThemeId) || THEME_OPTIONS[1];

  const handleSelectPet = (pet: PetProfile) => {
    setCurrentPetId(pet.id);
  };

  const handleLoginSuccess = (user: User, managedPets: PetProfile[]) => {
    applySession(user, managedPets);
  };

  const handleJoinFamilySuccess = (pet: PetProfile) => {
    setPets((prev) => {
      if (prev.some((p) => p.id === pet.id)) return prev;
      return [...prev, pet];
    });
    setCurrentPetId(pet.id);
  };

  const handlePetTouch = async () => {
    // Optimistic UI update
    setPets((prev) =>
      prev.map((p) => {
        if (p.id === currentPet.id) {
          return { ...p, happiness: Math.min(100, p.happiness + 1) };
        }
        return p;
      })
    );

    // Sync with backend API
    try {
      await petApiService.updatePetHappiness(currentPet.id, 1);
    } catch (e) {
      console.warn('Happiness sync error:', e);
    }
  };

  const handleToggleRecord = (id: string) => {
    setDailyRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r))
    );
  };

  const handleAddHealthRecord = async (record: Omit<HealthRecord, 'id'>) => {
    const newRecord: HealthRecord = {
      ...record,
      id: `hlth-${Date.now()}`,
    };
    setHealthRecords((prev) => [newRecord, ...prev]);

    // Update pet weight if provided
    if (record.weightKg > 0) {
      setPets((prev) =>
        prev.map((p) => (p.id === currentPet.id ? { ...p, weightKg: record.weightKg } : p))
      );
    }

    // Sync with backend
    try {
      await petApiService.createHealthRecord({
        ...newRecord,
        petId: currentPet.id,
      });
    } catch (e) {
      console.warn('Health record sync error:', e);
    }
  };

  const handleAddDailyRecord = async (record: Omit<RecordItem, 'id' | 'completed'>) => {
    const newRecord: RecordItem = {
      ...record,
      id: `rec-${Date.now()}`,
      completed: false,
    };
    setDailyRecords((prev) => [...prev, newRecord]);

    // Sync with backend
    try {
      await petApiService.createDailyRecord({
        ...newRecord,
        petId: currentPet.id,
      });
    } catch (e) {
      console.warn('Daily record sync error:', e);
    }
  };

  const handleSaveWalkSession = async (session: WalkSession) => {
    setWalkSessions((prev) => [session, ...prev]);

    // Sync with backend & shapeify
    try {
      await petApiService.endWalk({
        ...session,
        petId: currentPet.id,
      });
      if (session.shapeType && session.rawPath) {
        await petApiService.shapeifyWalk(session.id, session.shapeType, session.rawPath);
      }
    } catch (e) {
      console.warn('Walk session sync error:', e);
    }
  };

  const handleApplyPixelAvatar = async (pixelDataUrl: string) => {
    setPets((prev) =>
      prev.map((p) => (p.id === currentPet.id ? { ...p, avatarUrl: pixelDataUrl } : p))
    );
    try {
      await petApiService.updatePet(currentPet.id, { avatarUrl: pixelDataUrl });
    } catch (e) {
      console.warn('Failed to persist pixel avatar to backend:', e);
    }
  };

  return (
    <MobileFrameWrapper onOpenFlutterCode={() => setShowFlutterModal(true)}>
      <div className="min-h-full bg-[#FDF8F0] font-sans antialiased text-[#3D2C1E] selection:bg-[#8B5E3C] selection:text-white pb-20">
        {/* Splash Screen */}
        <AnimatePresence>
          {showSplash && <Splash onFinish={() => setShowSplash(false)} />}
        </AnimatePresence>

        {/* Login gate: app content (and any demo data) is not rendered while logged out */}
        {!showSplash && authStatus === 'anonymous' && (
          <AuthModal
            isOpen
            dismissible={false}
            onClose={() => {}}
            currentUser={null}
            notice={authNotice}
            onLoginSuccess={handleLoginSuccess}
          />
        )}

        {!showSplash && authStatus === 'checking' && (
          <div className="flex min-h-full items-center justify-center gap-2 py-24 text-sm font-bold text-[#8B5E3C]">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>로그인 상태 확인 중...</span>
          </div>
        )}

        {!showSplash && authStatus === 'authenticated' && (
          <div className="flex flex-col min-h-full">
            {/* Top Backend Sync Status Bar */}
            <div className="bg-emerald-800 text-emerald-100 px-4 py-1 text-[11px] flex items-center justify-between font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                <span>Fluffy Days REST Backend API v1 연결됨</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] opacity-85">
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                    <span>실시간 동기화 중...</span>
                  </>
                ) : (
                  <span>실시간 동기화 완료 (Live)</span>
                )}
              </div>
            </div>

            {/* Top Sticky Header */}
            <Navbar
              currentPet={currentPet}
              pets={pets}
              onSelectPet={handleSelectPet}
              activeTheme={activeTheme}
              onOpenThemeModal={() => setShowThemeModal(true)}
              onOpenAIModal={() => setShowAIModal(true)}
              onOpenPixelModal={() => setShowPixelModal(true)}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled(!soundEnabled)}
              currentUser={currentUser}
              onOpenAuthModal={() => setShowAuthModal(true)}
              onOpenFamilyModal={() => setShowFamilyModal(true)}
            />

            {/* Main Tab Content View */}
            <main className="flex-1 max-w-2xl w-full mx-auto px-1 sm:px-0">
              <AnimatePresence mode="wait">
                {activeTab === 'home' && (
                  <motion.div
                    key="home-tab"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    <HomeTab
                      pet={currentPet}
                      theme={activeTheme}
                      records={dailyRecords}
                      onPetTouch={handlePetTouch}
                      onNavigateToTab={(tab) => setActiveTab(tab)}
                      onOpenAIModal={() => setShowAIModal(true)}
                      onOpenPixelModal={() => setShowPixelModal(true)}
                      soundEnabled={soundEnabled}
                    />
                  </motion.div>
                )}

                {activeTab === 'records' && (
                  <motion.div
                    key="records-tab"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    <RecordsTab
                      pet={currentPet}
                      dailyRecords={dailyRecords}
                      healthRecords={healthRecords}
                      onToggleRecord={handleToggleRecord}
                      onAddHealthRecord={handleAddHealthRecord}
                      onAddDailyRecord={handleAddDailyRecord}
                    />
                  </motion.div>
                )}

                {activeTab === 'walk' && (
                  <motion.div
                    key="walk-tab"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    <WalkTab
                      pet={currentPet}
                      walkSessions={walkSessions}
                      onSaveWalkSession={handleSaveWalkSession}
                    />
                  </motion.div>
                )}

                {activeTab === 'community' && (
                  <motion.div
                    key="community-tab"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    <CommunityTab places={communityPlaces} />
                  </motion.div>
                )}
              </AnimatePresence>
            </main>

            {/* Bottom Tab Navigation Bar */}
            <BottomNav activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} />

            {/* Theme Switcher Modal */}
            <ThemeSelectorModal
              themes={THEME_OPTIONS}
              activeThemeId={activeThemeId}
              onSelectTheme={(id) => setActiveThemeId(id)}
              isOpen={showThemeModal}
              onClose={() => setShowThemeModal(false)}
            />

            {/* AI Pet Interaction Doctor Modal */}
            <AIInteractionModal
              pet={currentPet}
              isOpen={showAIModal}
              onClose={() => setShowAIModal(false)}
            />

            {/* 8-Bit Pixel Art Pet Studio Modal */}
            <PixelPetModal
              isOpen={showPixelModal}
              onClose={() => setShowPixelModal(false)}
              currentPet={currentPet}
              onApplyAvatar={handleApplyPixelAvatar}
            />

            {/* Flutter Source Code Modal */}
            <FlutterCodeViewerModal
              isOpen={showFlutterModal}
              onClose={() => setShowFlutterModal(false)}
            />

            {/* User Login & Signup Auth Modal */}
            <AuthModal
              isOpen={showAuthModal}
              onClose={() => setShowAuthModal(false)}
              currentUser={currentUser}
              onLoginSuccess={handleLoginSuccess}
            />

            {/* Co-Parenting Family Sharing Modal */}
            <FamilyShareModal
              isOpen={showFamilyModal}
              onClose={() => setShowFamilyModal(false)}
              currentPet={currentPet}
              currentUser={currentUser}
              onJoinSuccess={handleJoinFamilySuccess}
            />
          </div>
        )}
      </div>
    </MobileFrameWrapper>
  );
}

