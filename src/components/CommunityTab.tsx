import React, { useState } from 'react';
import { CommunityPlace, CommunityReview } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { petApiService } from '../services/api';
import {
  MapPin,
  List,
  Map as MapIcon,
  Search,
  Star,
  Clock,
  Phone,
  Navigation,
  ChevronRight,
  Heart,
  X,
  Sparkles,
  MessageSquare,
  Building2,
  Coffee,
  Trees,
  Scissors,
} from 'lucide-react';

interface CommunityTabProps {
  places: CommunityPlace[];
}

export const CommunityTab: React.FC<CommunityTabProps> = ({ places }) => {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<CommunityPlace | null>(places[0]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(['place-1']);
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);

  const handleAddReview = async () => {
    if (!selectedPlace || !newReviewText.trim()) return;

    const newRev: CommunityReview = {
      id: `rev-${Date.now()}`,
      author: '나 (모카보호자)',
      petName: '모카',
      avatarUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=150&q=80',
      rating: newReviewRating,
      date: '오늘',
      content: newReviewText.trim(),
      tags: ['친절해요', '추천'],
    };

    // Update local place review state
    setSelectedPlace((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        reviewCount: prev.reviewCount + 1,
        reviews: [newRev, ...prev.reviews],
      };
    });

    setNewReviewText('');

    // Sync with backend API
    try {
      await petApiService.createPlaceReview(selectedPlace.id, {
        rating: newReviewRating,
        content: newReviewText.trim(),
        tags: ['친절해요'],
      });
    } catch (e) {
      console.warn('Place review sync error:', e);
    }
  };

  // Filter places
  const filteredPlaces = places.filter((p) => {
    const matchesCategory =
      selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      p.name.includes(searchQuery) ||
      p.address.includes(searchQuery) ||
      p.tags.some((t) => t.includes(searchQuery));
    return matchesCategory && matchesSearch;
  });

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getCategoryIcon = (cat: CommunityPlace['category']) => {
    switch (cat) {
      case 'hospital':
        return <Building2 className="w-4 h-4 text-rose-600" />;
      case 'cafe':
        return <Coffee className="w-4 h-4 text-amber-600" />;
      case 'park':
        return <Trees className="w-4 h-4 text-emerald-600" />;
      case 'grooming':
        return <Scissors className="w-4 h-4 text-purple-600" />;
    }
  };

  return (
    <div className="min-h-screen pb-28 pt-4 px-4 bg-[#FDF8F0] text-[#3D2C1E]">
      <div className="max-w-md mx-auto space-y-3">
        
        {/* Title & View Toggle Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-stone-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#8B5E3C]" /> 우리 동네 펫 커뮤니티
            </h1>
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              24시 동물병원, 애견카페, 산책공원 & 후기 공유
            </p>
          </div>

          {/* View Toggle Button */}
          <div className="flex items-center bg-stone-200/90 p-1 rounded-2xl shadow-inner border border-stone-300/60">
            <button
              onClick={() => setViewMode('map')}
              className={`p-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all ${
                viewMode === 'map'
                  ? 'bg-white text-[#8B5E3C] shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" /> 지도
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-[#8B5E3C] shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <List className="w-3.5 h-3.5" /> 리스트
            </button>
          </div>
        </div>

        {/* Search Bar & Category Chips */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="장소명, 24시응급, 멍푸치노, 슬개골 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#8B5E3C] shadow-2xs"
            />
          </div>

          {/* Category Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'all', label: '전체' },
              { id: 'hospital', label: '🏥 24시병원' },
              { id: 'cafe', label: '☕ 펫카페' },
              { id: 'park', label: '🌳 산책공원' },
              { id: 'grooming', label: '✂️ 펫미용' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-[#8B5E3C] text-white shadow-xs'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* MODE 1: MAP VIEW */}
        {viewMode === 'map' && (
          <div className="relative bg-stone-900 rounded-3xl overflow-hidden shadow-xl border-2 border-stone-800 min-h-[380px] flex flex-col justify-between">
            
            {/* Interactive Simulated Map Canvas */}
            <div className="absolute inset-0 bg-[#242F3E] overflow-hidden">
              {/* Map Road Grid Lines */}
              <svg className="w-full h-full opacity-30" viewBox="0 0 100 100">
                <path d="M 0 35 L 100 35 M 0 65 L 100 65 M 35 0 L 35 100 M 70 0 L 70 100" stroke="#718096" strokeWidth="2" />
                <circle cx="35" cy="35" r="8" fill="#4A5568" opacity="0.4" />
                <circle cx="70" cy="65" r="12" fill="#4A5568" opacity="0.4" />
              </svg>

              {/* Animated Map Pins */}
              {filteredPlaces.map((p) => {
                const isSelected = selectedPlace?.id === p.id;
                return (
                  <motion.div
                    key={p.id}
                    style={{ top: `${p.lat}%`, left: `${p.lng}%` }}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedPlace(p)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20"
                  >
                    {/* Pulse ring for selected pin */}
                    {isSelected && (
                      <span className="absolute inset-0 w-8 h-8 -m-1 rounded-full bg-amber-400/50 animate-ping" />
                    )}

                    <div
                      className={`p-2 rounded-2xl shadow-xl border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-[#8B5E3C] border-white text-white scale-110 z-30'
                          : 'bg-white border-stone-300 text-stone-800'
                      }`}
                    >
                      <span className="text-base">
                        {p.category === 'hospital'
                          ? '🏥'
                          : p.category === 'cafe'
                          ? '☕'
                          : p.category === 'park'
                          ? '🌳'
                          : '✂️'}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Top Map Location Badge */}
            <div className="relative z-10 m-3 flex items-center justify-between bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 text-white text-xs">
              <span className="font-bold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" /> 서울 강남구 도산대로 주변 (내 위치)
              </span>
              <span className="text-[10px] text-stone-300 font-medium">반경 1km 이내</span>
            </div>

            {/* Bottom Interactive Mini-Card (Triggered by pin click) */}
            <AnimatePresence mode="wait">
              {selectedPlace && (
                <motion.div
                  key={selectedPlace.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 30 }}
                  onClick={() => setShowDetailModal(true)}
                  className="relative z-20 m-3 bg-white/95 backdrop-blur-md rounded-3xl p-3.5 shadow-2xl border border-stone-200 cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={selectedPlace.imageUrl}
                      alt={selectedPlace.name}
                      className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-stone-200"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          {selectedPlace.distanceMeter}m 거리
                        </span>
                        <button
                          onClick={(e) => toggleFavorite(selectedPlace.id, e)}
                          className="p-1 text-stone-400 hover:text-rose-500"
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              favorites.includes(selectedPlace.id)
                                ? 'fill-rose-500 text-rose-500'
                                : ''
                            }`}
                          />
                        </button>
                      </div>

                      <h3 className="text-xs font-extrabold text-stone-900 truncate mt-1 group-hover:text-[#8B5E3C]">
                        {selectedPlace.name}
                      </h3>

                      <div className="flex items-center gap-2 mt-1 text-[11px]">
                        <span className="flex items-center text-amber-500 font-bold">
                          <Star className="w-3 h-3 fill-amber-400 mr-0.5" />
                          {selectedPlace.rating}
                        </span>
                        <span className="text-stone-400">({selectedPlace.reviewCount}개 후기)</span>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedPlace.tags.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="text-[9px] font-semibold bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded-md"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] font-bold text-[#8B5E3C]">
                    <span>상세 정보 및 수의사/리뷰 보기</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        )}

        {/* MODE 2: LIST VIEW */}
        {viewMode === 'list' && (
          <div className="space-y-3">
            {filteredPlaces.map((place) => (
              <motion.div
                key={place.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedPlace(place);
                  setShowDetailModal(true);
                }}
                className="bg-white/95 rounded-3xl p-4 shadow-sm border border-stone-200/90 cursor-pointer hover:border-[#8B5E3C]/50 transition-all space-y-3"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={place.imageUrl}
                    alt={place.name}
                    className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-stone-200"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                        {place.distanceMeter}m 📍
                      </span>
                      <button
                        onClick={(e) => toggleFavorite(place.id, e)}
                        className="p-1 text-stone-400 hover:text-rose-500"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            favorites.includes(place.id)
                              ? 'fill-rose-500 text-rose-500'
                              : ''
                          }`}
                        />
                      </button>
                    </div>

                    <h3 className="text-sm font-extrabold text-stone-900 truncate mt-1">
                      {place.name}
                    </h3>

                    <div className="flex items-center gap-2 mt-1 text-xs">
                      <span className="flex items-center text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 mr-0.5" />
                        {place.rating}
                      </span>
                      <span className="text-stone-400">({place.reviewCount}개 후기)</span>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {place.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] font-semibold bg-amber-50 text-amber-900 px-2 py-0.5 rounded-md border border-amber-100"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {place.reviews.length > 0 && (
                  <div className="bg-stone-50 p-2.5 rounded-2xl text-[11px] text-stone-600 border border-stone-200/60 font-medium">
                    <p className="line-clamp-1 italic">
                      "{place.reviews[0].author}: {place.reviews[0].content}"
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

      </div>

      {/* Detailed Place Modal */}
      <AnimatePresence>
        {showDetailModal && selectedPlace && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-amber-100 text-[#8B5E3C]">
                    {getCategoryIcon(selectedPlace.category)}
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-stone-900">
                      {selectedPlace.name}
                    </h3>
                    <p className="text-[10px] text-stone-400">{selectedPlace.address}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-1 rounded-full hover:bg-stone-100 text-stone-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cover Image & Quick Action Bar */}
              <div className="relative rounded-2xl overflow-hidden h-40">
                <img
                  src={selectedPlace.imageUrl}
                  alt={selectedPlace.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-3 text-white">
                  <div>
                    <div className="flex items-center gap-1 text-amber-300 text-xs font-bold">
                      <Star className="w-4 h-4 fill-amber-300" /> {selectedPlace.rating} / 5.0 (리뷰 {selectedPlace.reviewCount}건)
                    </div>
                    <p className="text-xs text-stone-200 mt-0.5">{selectedPlace.address}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`tel:${selectedPlace.phone}`}
                  className="py-3 bg-[#8B5E3C] hover:bg-[#724B2F] text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <Phone className="w-4 h-4" /> 전화 문의 ({selectedPlace.phone})
                </a>
                <button
                  onClick={() => alert(`${selectedPlace.name} 경로 길안내를 시작합니다!`)}
                  className="py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Navigation className="w-4 h-4 text-emerald-600" /> 카카오길안내 연결
                </button>
              </div>

              {/* Tags */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-stone-700">장소 특이사항 & 편의시설</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPlace.tags.map((t) => (
                    <span
                      key={t}
                      className="text-xs bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-xl font-semibold"
                    >
                      ✓ {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Community Reviews List & Add Review Form */}
              <div className="space-y-3 pt-2 border-t border-stone-100">
                <h4 className="text-xs font-extrabold text-stone-800 flex items-center justify-between">
                  <span>실제 동네 보호자 후기 ({selectedPlace.reviews.length}개)</span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                    인증 리뷰 100%
                  </span>
                </h4>

                {/* New Review Form */}
                <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200/80 space-y-2">
                  <p className="text-[11px] font-extrabold text-[#8B5E3C] flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" /> 방문 후기 한줄 남기기
                  </p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReviewRating(star)}
                        className="p-0.5"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            newReviewRating >= star
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-stone-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-amber-900 ml-1.5">{newReviewRating}점</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="원장님의 친절도나 시설 청결도를 남겨주세요"
                      value={newReviewText}
                      onChange={(e) => setNewReviewText(e.target.value)}
                      className="flex-1 p-2 rounded-xl bg-white border border-stone-200 text-xs focus:outline-none focus:border-[#8B5E3C]"
                    />
                    <button
                      onClick={handleAddReview}
                      disabled={!newReviewText.trim()}
                      className="px-3 py-2 bg-[#8B5E3C] hover:bg-[#724B2F] text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      등록
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {selectedPlace.reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="bg-stone-50 p-3 rounded-2xl border border-stone-200/80 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={rev.avatarUrl}
                            alt={rev.author}
                            className="w-6 h-6 rounded-full object-cover border border-stone-200"
                            referrerPolicy="no-referrer"
                          />
                          <span className="font-bold text-stone-800">{rev.author}</span>
                          <span className="text-[10px] text-stone-400">({rev.petName})</span>
                        </div>
                        <div className="flex items-center text-amber-500 font-bold text-[11px]">
                          <Star className="w-3 h-3 fill-amber-400 mr-0.5" />
                          {rev.rating}.0
                        </div>
                      </div>
                      <p className="text-stone-700 leading-relaxed font-medium">{rev.content}</p>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
