import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ==========================================
  // [v1 API] In-Memory User & Auth Store
  // ==========================================
  interface UserRecord {
    id: string;
    email: string;
    passwordHash: string;
    nickname: string;
    role: 'owner' | 'co_parent' | 'guest';
    avatarUrl: string;
    ownedPetIds: string[];
    sharedPetIds: string[];
    createdAt: string;
  }

  interface FamilyInviteRecord {
    inviteCode: string;
    petId: string;
    petName: string;
    inviterId: string;
    inviterName: string;
    expiresAt: string;
  }

  let usersDb: UserRecord[] = [
    {
      id: 'u1',
      email: 'moca_mom@toto.com',
      passwordHash: 'password123',
      nickname: '모카맘 (대표 보호자)',
      role: 'owner',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      ownedPetIds: ['p1', 'p2'],
      sharedPetIds: [],
      createdAt: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'u2',
      email: 'moca_dad@toto.com',
      passwordHash: 'password123',
      nickname: '모카아빠 (공동 양육자)',
      role: 'co_parent',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      ownedPetIds: [],
      sharedPetIds: ['p1', 'p2'],
      createdAt: '2026-02-14T00:00:00.000Z'
    },
    {
      id: 'u3',
      email: 'coco_dad@pet.com',
      passwordHash: 'password123',
      nickname: '코코아빠 (단독 보호자)',
      role: 'owner',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      ownedPetIds: ['p3'],
      sharedPetIds: [],
      createdAt: '2026-03-01T00:00:00.000Z'
    }
  ];

  let familyInvitesDb: FamilyInviteRecord[] = [
    {
      inviteCode: 'MOCA-LOVE-7728',
      petId: 'p1',
      petName: '모카',
      inviterId: 'u1',
      inviterName: '모카맘',
      expiresAt: '2026-12-31T23:59:59.000Z'
    }
  ];

  // Helper to extract authenticated user from Bearer token
  function getAuthUser(req: express.Request): UserRecord {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Mock JWT token decoding: format "token_<userId>_<timestamp>" or user ID
      const parts = token.split('_');
      const userId = parts.length >= 2 ? parts[1] : token;
      const matched = usersDb.find(u => u.id === userId || u.email === token);
      if (matched) return matched;
    }
    // Default fallback to primary user u1
    return usersDb[0];
  }

  // ==========================================
  // [v1 API] Auth Endpoints
  // ==========================================
  // POST /api/v1/auth/login
  app.post('/api/v1/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = usersDb.find(u => u.email === email && u.passwordHash === password);
    if (!user) {
      return res.status(401).json({ success: false, message: '이메일 또는 비밀번호가 일치하지 않습니다.' });
    }

    const token = `token_${user.id}_${Date.now()}`;
    const userPetIds = [...user.ownedPetIds, ...user.sharedPetIds];
    const managedPets = petsDb.filter(p => userPetIds.includes(p.id));

    res.json({
      success: true,
      message: `${user.nickname}님 환영합니다!`,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          role: user.role,
          avatarUrl: user.avatarUrl,
          sharedPetIds: user.sharedPetIds,
          createdAt: user.createdAt
        },
        managedPets
      }
    });
  });

  // POST /api/v1/auth/signup
  app.post('/api/v1/auth/signup', (req, res) => {
    const { email, password, nickname, role = 'owner' } = req.body;
    if (!email || !password || !nickname) {
      return res.status(400).json({ success: false, message: '필수 회원 정보를 모두 입력해주세요.' });
    }

    const existing = usersDb.find(u => u.email === email);
    if (existing) {
      return res.status(409).json({ success: false, message: '이미 가입된 이메일 주소입니다.' });
    }

    const newUser: UserRecord = {
      id: `u${Date.now()}`,
      email,
      passwordHash: password,
      nickname,
      role: role as any,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(nickname)}`,
      ownedPetIds: [],
      sharedPetIds: [],
      createdAt: new Date().toISOString()
    };

    usersDb.push(newUser);
    const token = `token_${newUser.id}_${Date.now()}`;

    res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      data: {
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          nickname: newUser.nickname,
          role: newUser.role,
          avatarUrl: newUser.avatarUrl,
          sharedPetIds: newUser.sharedPetIds,
          createdAt: newUser.createdAt
        },
        managedPets: []
      }
    });
  });

  // GET /api/v1/auth/me
  app.get('/api/v1/auth/me', (req, res) => {
    const user = getAuthUser(req);
    const userPetIds = [...user.ownedPetIds, ...user.sharedPetIds];
    const managedPets = petsDb.filter(p => userPetIds.includes(p.id));

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          role: user.role,
          avatarUrl: user.avatarUrl,
          sharedPetIds: user.sharedPetIds,
          createdAt: user.createdAt
        },
        managedPets
      }
    });
  });

  // POST /api/v1/auth/family/invite - Create co-parenting invite code
  app.post('/api/v1/auth/family/invite', (req, res) => {
    const user = getAuthUser(req);
    const { petId } = req.body;
    const pet = petsDb.find(p => p.id === petId);
    if (!pet) return res.status(404).json({ success: false, message: '반려동물을 찾을 수 없습니다.' });

    const inviteCode = `${pet.name.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newInvite: FamilyInviteRecord = {
      inviteCode,
      petId: pet.id,
      petName: pet.name,
      inviterId: user.id,
      inviterName: user.nickname,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    familyInvitesDb.push(newInvite);
    res.status(201).json({
      success: true,
      message: `'${pet.name}'의 가족 초대 코드가 발급되었습니다.`,
      data: newInvite
    });
  });

  // POST /api/v1/auth/family/join - Join pet co-parenting using invite code
  app.post('/api/v1/auth/family/join', (req, res) => {
    const user = getAuthUser(req);
    const { inviteCode } = req.body;
    const invite = familyInvitesDb.find(i => i.inviteCode.toUpperCase() === inviteCode?.trim().toUpperCase());

    if (!invite) {
      return res.status(404).json({ success: false, message: '유효하지 않거나 만료된 가족 초대 코드입니다.' });
    }

    if (!user.sharedPetIds.includes(invite.petId) && !user.ownedPetIds.includes(invite.petId)) {
      user.sharedPetIds.push(invite.petId);
    }

    const pet = petsDb.find(p => p.id === invite.petId);
    res.json({
      success: true,
      message: `'${invite.inviterName}'님의 '${invite.petName}' 공동 양육자로 등록되었습니다! 🎉`,
      data: {
        pet,
        sharedPetIds: user.sharedPetIds
      }
    });
  });

  // ==========================================
  // [v1 API] Pets & User Management
  // ==========================================
  let petsDb = [
    {
      id: 'p1',
      userId: 'u1',
      name: '모카',
      breed: '토이푸들',
      birthDate: '2022-05-15',
      weight: 3.8,
      happiness: 92,
      traits: '호기심 많음, 산책 마니아, 애교쟁이',
      avatarUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400',
      currentTheme: 'living'
    },
    {
      id: 'p2',
      userId: 'u1',
      name: '토토',
      breed: '말티푸',
      birthDate: '2023-01-10',
      weight: 2.9,
      happiness: 85,
      traits: '겁이 조금 많음, 간식 러버, 수줍음',
      avatarUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400',
      currentTheme: 'garden'
    },
    {
      id: 'p3',
      userId: 'u3',
      name: '코코',
      breed: '골든리트리버',
      birthDate: '2021-11-20',
      weight: 28.5,
      happiness: 95,
      traits: '수영 러버, 천사견, 사람을 너무 좋아함',
      avatarUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400',
      currentTheme: 'forest'
    }
  ];

  // GET /api/v1/pets - Get user's pets (owned + co-parenting)
  app.get('/api/v1/pets', (req, res) => {
    const user = getAuthUser(req);
    const userPetIds = [...user.ownedPetIds, ...user.sharedPetIds];
    const userPets = petsDb.filter(p => userPetIds.includes(p.id));
    res.json({ success: true, count: userPets.length, data: userPets.length > 0 ? userPets : petsDb.slice(0, 2) });
  });

  // POST /api/v1/pets - Register new pet
  app.post('/api/v1/pets', (req, res) => {
    const user = getAuthUser(req);
    const { name, breed, birthDate, weight, traits, avatarUrl, currentTheme } = req.body;
    const newPet = {
      id: `p${Date.now()}`,
      userId: user.id,
      name: name || '아기 멍냥',
      breed: breed || '믹스견',
      birthDate: birthDate || new Date().toISOString().split('T')[0],
      weight: parseFloat(weight) || 3.0,
      happiness: 80,
      traits: traits || '',
      avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400',
      currentTheme: currentTheme || 'living'
    };
    petsDb.push(newPet);
    user.ownedPetIds.push(newPet.id);
    res.status(201).json({ success: true, data: newPet });
  });

  // PATCH /api/v1/pets/:petId - Update pet profile & theme
  app.patch('/api/v1/pets/:petId', (req, res) => {
    const { petId } = req.params;
    const petIndex = petsDb.findIndex(p => p.id === petId);
    if (petIndex === -1) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }
    petsDb[petIndex] = { ...petsDb[petIndex], ...req.body };
    res.json({ success: true, data: petsDb[petIndex] });
  });

  // ==========================================
  // [v1 API] Home Dashboard & Happiness State
  // ==========================================
  app.get('/api/v1/pets/:petId/dashboard', (req, res) => {
    const { petId } = req.params;
    const pet = petsDb.find(p => p.id === petId) || petsDb[0];
    res.json({
      success: true,
      data: {
        pet,
        careScore: 95,
        todaySummary: {
          walkDistanceKm: 2.4,
          walkTimeMinutes: 45,
          feedStatus: '완료 (2/2회)',
          waterMl: 350,
        },
        ddayEvents: [
          { title: '심장사상충 예방약 복용', dday: -3, targetDate: '2026-08-13' },
          { title: '건강검진 예약', dday: 12, targetDate: '2026-08-22' }
        ]
      }
    });
  });

  // POST /api/v1/pets/:petId/happiness - Update pet touch interaction happiness
  app.post('/api/v1/pets/:petId/happiness', (req, res) => {
    const { petId } = req.params;
    const { increment = 5 } = req.body;
    const pet = petsDb.find(p => p.id === petId);
    if (!pet) return res.status(404).json({ success: false, message: 'Pet not found' });

    pet.happiness = Math.min(100, pet.happiness + increment);
    res.json({ success: true, happiness: pet.happiness, message: `${pet.name}의 행복도가 상승했습니다! 💕` });
  });

  // ==========================================
  // [v1 API] Records & Health Timeline
  // ==========================================
  let dailyRecordsDb = [
    {
      id: 'r1',
      petId: 'p1',
      recordDate: '2026-08-10',
      feedChecked: true,
      waterChecked: true,
      stoolChecked: true,
      medicineChecked: true,
      notes: '아침 사료 맛있게 잘 먹음. 변 상태 매우 양호!'
    }
  ];

  let healthRecordsDb = [
    {
      id: 'h1',
      petId: 'p1',
      visitDate: '2026-08-01',
      category: 'vaccine',
      hospitalName: '행복 24시 동물병원',
      doctorName: '김수석 원장님',
      diagnosis: '광견병 및 종합 백신 5차 추가 접종 완료',
      prescription: '3일간 목욕 자제 및 무리한 운동 금지',
      cost: 45000,
      weightAtVisit: 3.8
    }
  ];

  app.get('/api/v1/records/daily', (req, res) => {
    const petId = req.query.petId as string;
    const filtered = petId ? dailyRecordsDb.filter(r => r.petId === petId) : dailyRecordsDb;
    res.json({ success: true, count: filtered.length, data: filtered });
  });

  app.post('/api/v1/records/daily', (req, res) => {
    const newRecord = {
      id: `r${Date.now()}`,
      petId: req.body.petId || 'p1',
      recordDate: req.body.recordDate || new Date().toISOString().split('T')[0],
      feedChecked: Boolean(req.body.feedChecked),
      waterChecked: Boolean(req.body.waterChecked),
      stoolChecked: Boolean(req.body.stoolChecked),
      medicineChecked: Boolean(req.body.medicineChecked),
      notes: req.body.notes || ''
    };
    dailyRecordsDb.push(newRecord);
    res.status(201).json({ success: true, data: newRecord });
  });

  app.get('/api/v1/records/health', (req, res) => {
    const petId = req.query.petId as string;
    const filtered = petId ? healthRecordsDb.filter(r => r.petId === petId) : healthRecordsDb;
    res.json({ success: true, count: filtered.length, data: filtered });
  });

  app.post('/api/v1/records/health', (req, res) => {
    const newRecord = {
      id: `h${Date.now()}`,
      petId: req.body.petId || 'p1',
      visitDate: req.body.visitDate || new Date().toISOString().split('T')[0],
      category: req.body.category || 'checkup',
      hospitalName: req.body.hospitalName || '동물병원',
      doctorName: req.body.doctorName || '',
      diagnosis: req.body.diagnosis || '',
      prescription: req.body.prescription || '',
      cost: Number(req.body.cost) || 0,
      weightAtVisit: Number(req.body.weightAtVisit) || 3.8
    };
    healthRecordsDb.push(newRecord);
    res.status(201).json({ success: true, data: newRecord });
  });

  // ==========================================
  // [v1 API] Walks & Shapeify Route Processing
  // ==========================================
  let activeWalks: Record<string, any> = {};

  app.post('/api/v1/walks/start', (req, res) => {
    const { petId, startLatitude, startLongitude } = req.body;
    const walkId = `walk_${Date.now()}`;
    activeWalks[walkId] = {
      walkId,
      petId: petId || 'p1',
      startedAt: new Date(),
      coordinates: [{ lat: startLatitude || 37.5665, lng: startLongitude || 126.9780 }]
    };
    res.status(201).json({ success: true, walkId, message: '산책이 시작되었습니다.' });
  });

  app.post('/api/v1/walks/end', (req, res) => {
    const { walkId, distanceKm, durationSeconds, calories, steps, coordinates } = req.body;
    const walk = activeWalks[walkId] || { startedAt: new Date() };

    const walkLog = {
      id: walkId || `walk_${Date.now()}`,
      petId: walk.petId || 'p1',
      distanceKm: distanceKm || 1.8,
      durationSeconds: durationSeconds || 1800,
      calories: calories || 120,
      steps: steps || 2400,
      rawCoordinatesJson: coordinates || walk.coordinates || [],
      shapeType: 'paw',
      weather: '☀️ 24°C 맑음',
      savedCardUrl: 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=600',
      endedAt: new Date()
    };

    delete activeWalks[walkId];
    res.json({ success: true, data: walkLog, message: '산책이 성공적으로 종료되어 기록되었습니다.' });
  });

  // POST /api/v1/walks/:walkId/shapeify - Shapeify Route Transformation API
  app.post('/api/v1/walks/:walkId/shapeify', (req, res) => {
    const { targetShape = 'paw', rawCoordinates = [] } = req.body;
    
    // Shapeify algorithm mock conversion metadata
    const shapeifyResult = {
      walkId: req.params.walkId,
      appliedShape: targetShape, // 'paw', 'heart', 'bone'
      pointCountOriginal: rawCoordinates.length || 42,
      pointCountSmoothed: 24,
      smoothAccuracyPercentage: 98.2,
      shapedSvgPath: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
      cardImageUrl: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600"
    };

    res.json({ success: true, data: shapeifyResult, message: `산책 경로가 '${targetShape}' 아트 형상으로 성공적으로 변환되었습니다.` });
  });

  // ==========================================
  // [v1 API] Places & Community
  // ==========================================
  const placesDb = [
    {
      id: 'place-1',
      name: '행복 24시 동물의료센터',
      category: 'hospital',
      latitude: 37.5665,
      longitude: 126.9780,
      address: '서울시 강남구 테헤란로 123',
      phone: '02-555-7582',
      tags: ['24시야간', '응급진료', '친절수의사'],
      imageUrl: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=500',
      is24h: true,
      rating: 4.9
    },
    {
      id: 'place-2',
      name: '멍뭉이네 애견동반 브런치카페',
      category: 'cafe',
      latitude: 37.5680,
      longitude: 126.9800,
      address: '서울시 서초구 반포대로 45',
      phone: '02-3482-1004',
      tags: ['야외테라스', '멍푸치노', '주차가능'],
      imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500',
      is24h: false,
      rating: 4.8
    }
  ];

  app.get('/api/v1/places/nearby', (req, res) => {
    const { category } = req.query;
    let result = placesDb;
    if (category && category !== 'all') {
      result = placesDb.filter(p => p.category === category);
    }
    res.json({ success: true, count: result.length, data: result });
  });

  app.get('/api/v1/places/:placeId', (req, res) => {
    const place = placesDb.find(p => p.id === req.params.placeId);
    if (!place) return res.status(404).json({ success: false, message: 'Place not found' });
    res.json({ success: true, data: place });
  });

  app.post('/api/v1/places/:placeId/reviews', (req, res) => {
    const { rating, content, tags } = req.body;
    const newReview = {
      id: `rev_${Date.now()}`,
      placeId: req.params.placeId,
      userId: 'u1',
      rating: rating || 5,
      content: content || '선생님들이 너무 친절하셨어요!',
      tags: tags || ['친절해요'],
      createdAt: new Date()
    };
    res.status(201).json({ success: true, data: newReview });
  });

  // ==========================================
  // [v1 API] Gemini AI Doctor Multimodal & History Module
  // ==========================================
  interface AIConsultationRecord {
    id: string;
    petId: string;
    petName: string;
    category: 'behavior' | 'stool' | 'skin' | 'food' | 'general';
    imageUrl?: string;
    userQuery: string;
    summary: string;
    urgencyLevel: 'NORMAL' | 'ATTENTION' | 'URGENT';
    healthScore: number;
    innerVoiceTranslation: string;
    moodStatus: string;
    detectedIssues: string[];
    veterinaryTip: string;
    actionPlan: string[];
    createdAt: string;
  }

  let aiConsultationsDb: AIConsultationRecord[] = [
    {
      id: 'ai-init-1',
      petId: 'p1',
      petName: '모카',
      category: 'stool',
      imageUrl: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400',
      userQuery: '오늘 아침 대변 상태가 약간 무른 편인데 괜찮을까요?',
      summary: '수분 섭취 증가 또는 사료 교체 초기 일시적인 묽은 변 양상입니다. 활력 양호 시 하루 관찰을 권장합니다.',
      urgencyLevel: 'ATTENTION',
      healthScore: 78,
      innerVoiceTranslation: '배가 살짝 꾸륵거렸지만 간식 주시면 금방 기운 날 것 같아요 멍!',
      moodStatus: '약간 나른함, 관심 요청',
      detectedIssues: ['약간의 연변 (수분 함량 증가)', '탈수 징후 없음'],
      veterinaryTip: '유산균 급여와 함께 차가운 물 대신 미온수를 급여하시고, 기름진 간식은 24시간 동안 중단해주세요.',
      actionPlan: [
        '소화기 전용 유산균 1포 급여',
        '식이섬유가 풍부한 호박 퓨레 소량 급여',
        '24시간 내 혈변이나 구토 동반 시 동물병원 내원'
      ],
      createdAt: '2026-08-16T09:30:00.000Z'
    },
    {
      id: 'ai-init-2',
      petId: 'p1',
      petName: '모카',
      category: 'behavior',
      userQuery: '산책 나갈 때마다 현관문 앞에서 뱅글뱅글 돌면서 신발을 물어요!',
      summary: '산책에 대한 극도의 기대감과 긍정적 흥분 반응으로 보이는 전형적인 장난 행동입니다.',
      urgencyLevel: 'NORMAL',
      healthScore: 95,
      innerVoiceTranslation: '보호자님 빨리 나가요! 밖에 친구들 냄새 맡으러 가고 싶어서 심장이 콩닥거려요!',
      moodStatus: '극도의 설렘과 흥분',
      detectedIssues: ['과잉 흥분 상태', '신발 집착 (장난감 대체 필요)'],
      veterinaryTip: '현관문 앞에서 "앉아/기다려"로 차분한 감정을 유도한 후 리드줄을 채우면 흥분성 부상을 예방할 수 있습니다.',
      actionPlan: [
        '현관 앞 터그놀이 전용 장난감으로 신발 대체',
        '차분히 앉았을 때만 문을 열어주는 긍정 강화 훈련',
        '산책 전 노즈워크로 흥분도 사전 완화'
      ],
      createdAt: '2026-08-15T18:20:00.000Z'
    }
  ];

  // GET /api/v1/ai/history/:petId - Get consultation history for a pet
  app.get('/api/v1/ai/history/:petId', (req, res) => {
    const { petId } = req.params;
    const records = aiConsultationsDb.filter(r => r.petId === petId);
    res.json({ success: true, count: records.length, data: records });
  });

  // POST /api/v1/ai/doctor-analyze - Multimodal (Text + Vision) AI Analysis
  app.post('/api/v1/ai/doctor-analyze', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const {
        petId = 'p1',
        petName = '모카',
        breed = '말티푸',
        age = '2살',
        category = 'general',
        behaviorText = '',
        imageBase64,
        imageMimeType = 'image/jpeg'
      } = req.body;

      const categoryLabels: Record<string, string> = {
        behavior: '행동 심리 번역',
        stool: '이상 변/소변 및 소화기 분석',
        skin: '피부 상처/털 빠짐/발진 분석',
        food: '사료 성분표 및 영양 분석',
        general: '일반 건강 및 웰니스'
      };

      const categoryName = categoryLabels[category] || '종합 반려동물 건강';

      // Fallback mock analysis when API key is missing or offline
      const getFallbackResult = (): AIConsultationRecord => ({
        id: `ai-${Date.now()}`,
        petId,
        petName,
        category,
        imageUrl: imageBase64 ? `data:${imageMimeType};base64,${imageBase64.substring(0, 100)}...` : undefined,
        userQuery: behaviorText || `${categoryName} 검진 요청`,
        summary: `${petName}의 ${categoryName} 상태를 정밀 분석하였습니다. 전반적인 건강 징후가 양호하며 세심한 관찰이 지속되고 있습니다.`,
        urgencyLevel: category === 'skin' ? 'ATTENTION' : 'NORMAL',
        healthScore: category === 'skin' ? 82 : 92,
        innerVoiceTranslation: `${petName}가 "보호자님이 이렇게 꼼꼼하게 챙겨주셔서 마음이 너무 든든하다멍! 사랑해요!"라고 전하고 있어요. 💕`,
        moodStatus: '편안함 및 높은 유대감',
        detectedIssues: ['특이 이상 징후 없음', '규칙적인 일상 관리 유지 권장'],
        veterinaryTip: `${categoryName} 건강을 위해 적정 습도(50~60%)와 일정한 식사 시간을 유지해주시면 매우 좋습니다.`,
        actionPlan: [
          '미온수 수분 섭취량 체크 (체중 1kg당 50ml 권장)',
          '정기적인 빗질 및 피부 환기',
          '주간 건강 수첩에 증상 변화 기록'
        ],
        createdAt: new Date().toISOString()
      });

      if (!apiKey) {
        const fallback = getFallbackResult();
        aiConsultationsDb.unshift(fallback);
        return res.json({ success: true, data: fallback });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const systemPrompt = `당신은 최고 수준의 임상 수의사이자 반려동물 행동심리학 전문 AI '모카토토 AI 닥터'입니다.
반려동물 기본정보:
- 이름: ${petName}
- 품종: ${breed}
- 나이: ${age}
- 진단 영역: ${categoryName} (${category})
- 보호자 문의/관찰 내용: "${behaviorText || '첨부된 이미지 상태를 수의학적으로 정밀 진단해주세요.'}"

주의: 만약 사진(이미지)이 제공된 경우, 이상 변의 형태/색상, 피부 발진/각질/상처, 사료 성분표의 조단백/조지방/첨가물 등을 시각적으로 꼼꼼하게 판별하세요.

반드시 아래 JSON 형식으로만 응답해야 합니다:
{
  "summary": "1~2문장으로 요약된 수의학적 핵심 종합 소견",
  "urgencyLevel": "상태 긴급도 ('NORMAL' | 'ATTENTION' | 'URGENT' 중 하나)",
  "healthScore": 0부터 100 사이의 건강 점수 정수 (예: 85),
  "innerVoiceTranslation": "아이가 속으로 말하는 듯한 귀엽고 사랑스러운 1인칭 한국어 속마음 번역 (1~2문장)",
  "moodStatus": "아이가 현재 느끼고 있는 기분/심리 상태 (예: 편안함, 살짝 불편함, 신남 등)",
  "detectedIssues": ["감지된 주요 증상 또는 특이점 1", "특이점 2"],
  "veterinaryTip": "보호자가 가정에서 즉시 실천할 수 있는 1문장 전문 수의사 케어 가이드",
  "actionPlan": ["추천 실행 방안 1", "추천 실행 방안 2", "추천 실행 방안 3"]
}`;

      let contentPayload: any;
      if (imageBase64) {
        contentPayload = {
          parts: [
            {
              inlineData: {
                mimeType: imageMimeType,
                data: imageBase64
              }
            },
            {
              text: systemPrompt
            }
          ]
        };
      } else {
        contentPayload = systemPrompt;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: contentPayload,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7
        }
      });

      const parsed = JSON.parse(response.text || '{}');

      const consultationRecord: AIConsultationRecord = {
        id: `ai-${Date.now()}`,
        petId,
        petName,
        category,
        imageUrl: imageBase64 ? `data:${imageMimeType};base64,${imageBase64.substring(0, 100)}...` : undefined,
        userQuery: behaviorText || `${categoryName} 사진 진단`,
        summary: parsed.summary || `${petName}의 ${categoryName} 검진 결과입니다.`,
        urgencyLevel: parsed.urgencyLevel || 'NORMAL',
        healthScore: typeof parsed.healthScore === 'number' ? parsed.healthScore : 90,
        innerVoiceTranslation: parsed.innerVoiceTranslation || `${petName}가 보호자님에게 감사의 인사를 전해요!`,
        moodStatus: parsed.moodStatus || '안정적',
        detectedIssues: Array.isArray(parsed.detectedIssues) ? parsed.detectedIssues : ['특이사항 없음'],
        veterinaryTip: parsed.veterinaryTip || '규칙적인 식습관과 산책을 권장합니다.',
        actionPlan: Array.isArray(parsed.actionPlan) ? parsed.actionPlan : ['정기 관찰'],
        createdAt: new Date().toISOString()
      };

      aiConsultationsDb.unshift(consultationRecord);

      return res.json({
        success: true,
        data: consultationRecord
      });
    } catch (err: any) {
      console.error('AI Doctor Analysis error:', err);
      return res.status(500).json({ success: false, error: err.message || 'AI Doctor Analysis failed' });
    }
  });

  // ==========================================
  // [v1 API] Gemini AI Pixel Art Pet Characterizer
  // ==========================================
  app.post('/api/v1/ai/pixel-characterize', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const {
        petName = '내 반려동물',
        breed = '믹스견/고양이',
        imageBase64,
        imageMimeType = 'image/jpeg'
      } = req.body;

      const fallbackResult = {
        pixelCharacterName: `픽셀 ${petName}`,
        species: 'cat',
        breed: breed || '코리안 숏헤어',
        furColorPreset: 'white',
        furColorName: '눈송이처럼 보드라운 순백 & 살구빛 볼터치',
        primaryColors: ['#FFFFFF', '#FFAAA6', '#FFAEC8', '#3A323F'],
        mainFurHex: '#FFFFFF',
        secondaryFurHex: '#FBFBFB',
        eyeHex: '#4A3E4D',
        blushHex: '#FFAAA6',
        outlineStyle: 'dark_charcoal',
        recommendedPose: 'sitting_cute',
        hasTabbyStripes: false,
        hasWhitePaws: true,
        accessories: ['pacifier', 'floating_heart'],
        personalityTitle: '🌸 우주최강 귀요미 8비트 요정 (Lv.99)',
        rpgStats: {
          fluffiness: 99,
          zoomies: 92,
          treatRadar: 100,
          loyalty: 95
        },
        pixelStyleTip: '동글동글한 얼굴형과 핑크빛 볼터치, 반짝이는 눈망울이 돋보이는 소프트 카와이 픽셀 펫!',
        retroDialogue: `집사님! 저 픽셀 도트 세상에서도 진짜 귀엽죠? 하트 뿅뿅 날려드릴게요! 💖`,
        recommendedGridSize: 36
      };

      if (!apiKey) {
        return res.json({ success: true, data: fallbackResult });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const prompt = `당신은 '산리오 / 다마고치 / 카와이 레트로 픽셀 아트(Kawaii 8-Bit Pixel Sprite)' 전문 디자이너이자 반려동물 이미지 분석 AI입니다.
업로드된 반려동물 사진을 관찰하여, 아래 4가지 시그니처 픽셀 스타일 중 가장 어울리는 스타일과 색상 팔레트, 캐릭터 프로필을 JSON으로 추출해주세요.

[시그니처 레퍼런스 스타일 4종]:
1. 'sitting_cute': 정면 똘망 & 핑크 쪽쪽이(또는 앙증맞은 코)/볼터치/정갈한 앞발 (순백/크림/치즈 등 모든 동물 어울림)
2. 'belly_up_heart': 배를 하늘로 드러내고 누워 4발을 든 애교 포즈 + 가슴 위로 둥둥 떠오르는 핑크 픽셀 하트 (고등어 태비, 치즈, 믹스견 등)
3. 'sleeping_cushion': 핑크 레이스 원형 방석 위에서 눈을 감고 새근새근 쿨쿨 자는 포즈
4. 'fluffy_ribbon': 귀에 핑크 리본을 달고 몽실몽실한 털뭉치 꼬리와 둥둥 뜨는 하트를 가진 포즈

반려동물 기본정보:
- 이름: ${petName}
- 품종: ${breed}

반드시 아래 JSON 형식으로만 응답해야 합니다:
{
  "pixelCharacterName": "픽셀 ${petName} (또는 특징을 살린 귀여운 칭호)",
  "species": "cat" 또는 "dog",
  "breed": "사진 속 추정 품종 (예: 코숏 고등어태비, 터키시앙고라, 말티푸, 비숑, 시바견 등)",
  "furColorPreset": "white" | "grey_tabby" | "cheese_tabby" | "cream_maltipoo" | "bichon_fluffy" | "shiba_sable" | "tuxedo" | "choco_mocha" | "calico" | "sakura_pastel" 중 하나,
  "furColorName": "털 색상 설명 (예: 보슬보슬 고등어 스트라이프 & 하얀 솜방망이 양말)",
  "mainFurHex": "털 주요색 HEX (#FFFFFF, #B5B5BD, #F8B570, #EAD4BB 등)",
  "secondaryFurHex": "가슴/배/입가/양말 포인트색 HEX",
  "eyeHex": "눈동자 색상 HEX (#4A3E4D, #3A323F 등)",
  "blushHex": "볼터치 색상 HEX (#FFAAA6, #FF9AA2 등)",
  "outlineStyle": "soft_lavender" | "dark_charcoal" | "rosy_brown" | "soft_grey" 중 하나,
  "recommendedPose": "sitting_cute" | "belly_up_heart" | "sleeping_cushion" | "fluffy_ribbon" 중 사진 분위기에 가장 어울리는 것,
  "hasTabbyStripes": 줄무늬가 있으면 true 아니면 false,
  "hasWhitePaws": 발에 하얀 양말이 있으면 true,
  "accessories": ["floating_heart", "pacifier", "pink_ribbon", "lace_cushion", "bell_collar", "sleep_zzz"] 중 어울리는 것들,
  "personalityTitle": "재치있는 RPG 칭호 (예: 💖 뒹굴뒹굴 배 까기 마스터 Lv.99)",
  "rpgStats": {
    "fluffiness": 85~100 사이 정수,
    "zoomies": 75~100 사이 정수,
    "treatRadar": 90~100 사이 정수,
    "loyalty": 85~100 사이 정수
  },
  "pixelStyleTip": "이 아이를 픽셀 아트로 표현할 때 강조할 포인트 1문장",
  "retroDialogue": "레트로 픽셀 게임 속 1인칭 깜찍 대사 1문장 (예: 배 긁어주면 골골송 불러줄게요 냥!)",
  "recommendedGridSize": 36
}`;

      let contentPayload: any;
      if (imageBase64) {
        contentPayload = {
          parts: [
            {
              inlineData: {
                mimeType: imageMimeType,
                data: imageBase64
              }
            },
            {
              text: prompt
            }
          ]
        };
      } else {
        contentPayload = prompt;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: contentPayload,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.6
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      const result = {
        pixelCharacterName: parsed.pixelCharacterName || fallbackResult.pixelCharacterName,
        species: (parsed.species === 'cat' || parsed.species === 'dog') ? parsed.species : fallbackResult.species,
        breed: parsed.breed || fallbackResult.breed,
        furColorPreset: parsed.furColorPreset || fallbackResult.furColorPreset,
        furColorName: parsed.furColorName || fallbackResult.furColorName,
        primaryColors: [
          parsed.mainFurHex || fallbackResult.mainFurHex,
          parsed.blushHex || fallbackResult.blushHex,
          parsed.secondaryFurHex || fallbackResult.secondaryFurHex,
          parsed.eyeHex || fallbackResult.eyeHex
        ],
        mainFurHex: parsed.mainFurHex || fallbackResult.mainFurHex,
        secondaryFurHex: parsed.secondaryFurHex || fallbackResult.secondaryFurHex,
        eyeHex: parsed.eyeHex || fallbackResult.eyeHex,
        blushHex: parsed.blushHex || fallbackResult.blushHex,
        outlineStyle: parsed.outlineStyle || fallbackResult.outlineStyle,
        recommendedPose: parsed.recommendedPose || fallbackResult.recommendedPose,
        hasTabbyStripes: parsed.hasTabbyStripes ?? fallbackResult.hasTabbyStripes,
        hasWhitePaws: parsed.hasWhitePaws ?? fallbackResult.hasWhitePaws,
        accessories: Array.isArray(parsed.accessories) ? parsed.accessories : fallbackResult.accessories,
        personalityTitle: parsed.personalityTitle || fallbackResult.personalityTitle,
        rpgStats: parsed.rpgStats || fallbackResult.rpgStats,
        pixelStyleTip: parsed.pixelStyleTip || fallbackResult.pixelStyleTip,
        retroDialogue: parsed.retroDialogue || fallbackResult.retroDialogue,
        recommendedGridSize: parsed.recommendedGridSize || 36
      };

      res.json({ success: true, data: result });
    } catch (err: any) {
      console.error('Pixel characterize error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Pixel characterization failed' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Fluffy Days] Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
