import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Seed content mirrors the *current* in-memory demo data in server.ts
// (usersDb / petsDb / dailyRecordsDb / healthRecordsDb / placesDb / familyInvitesDb / aiConsultationsDb),
// not src/data/mockData.ts. mockData.ts is the frontend's own offline-fallback dataset and uses a
// different shape (e.g. daily records as title/category/completed instead of feedChecked/waterChecked),
// so seeding from it would not reproduce what the live API currently returns. Using server.ts's own
// seed data instead keeps the demo byte-for-byte identical before and after the DB migration.
async function main() {
  const mom = await prisma.user.create({
    data: {
      email: 'moca_mom@toto.com',
      passwordHash: 'password123',
      nickname: '모카맘 (대표 보호자)',
      role: 'owner',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    },
  });

  const dad = await prisma.user.create({
    data: {
      email: 'moca_dad@toto.com',
      passwordHash: 'password123',
      nickname: '모카아빠 (공동 양육자)',
      role: 'co_parent',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  });

  const cocoDad = await prisma.user.create({
    data: {
      email: 'coco_dad@pet.com',
      passwordHash: 'password123',
      nickname: '코코아빠 (단독 보호자)',
      role: 'owner',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    },
  });

  const moca = await prisma.pet.create({
    data: {
      userId: mom.id,
      name: '모카',
      breed: '토이푸들',
      birthDate: new Date('2022-05-15'),
      weight: 3.8,
      happiness: 92,
      traits: '호기심 많음, 산책 마니아, 애교쟁이',
      avatarUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400',
      currentTheme: 'living',
    },
  });

  const toto = await prisma.pet.create({
    data: {
      userId: mom.id,
      name: '토토',
      breed: '말티푸',
      birthDate: new Date('2023-01-10'),
      weight: 2.9,
      happiness: 85,
      traits: '겁이 조금 많음, 간식 러버, 수줍음',
      avatarUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400',
      currentTheme: 'garden',
    },
  });

  await prisma.pet.create({
    data: {
      userId: cocoDad.id,
      name: '코코',
      breed: '골든리트리버',
      birthDate: new Date('2021-11-20'),
      weight: 28.5,
      happiness: 95,
      traits: '수영 러버, 천사견, 사람을 너무 좋아함',
      avatarUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400',
      currentTheme: 'forest',
    },
  });

  // Dad is a co-parent on both of Mom's pets (mirrors usersDb u2.sharedPetIds = ['p1', 'p2'])
  await prisma.petShare.createMany({
    data: [
      { petId: moca.id, userId: dad.id, role: 'co_parent' },
      { petId: toto.id, userId: dad.id, role: 'co_parent' },
    ],
  });

  await prisma.familyInvite.create({
    data: {
      inviteCode: 'MOCA-LOVE-7728',
      petId: moca.id,
      petName: moca.name,
      inviterId: mom.id,
      inviterName: mom.nickname,
      expiresAt: new Date('2026-12-31T23:59:59.000Z'),
    },
  });

  await prisma.dailyRecord.create({
    data: {
      petId: moca.id,
      recordDate: new Date('2026-08-10'),
      feedChecked: true,
      waterChecked: true,
      stoolChecked: true,
      medicineChecked: true,
      notes: '아침 사료 맛있게 잘 먹음. 변 상태 매우 양호!',
    },
  });

  await prisma.healthRecord.create({
    data: {
      petId: moca.id,
      visitDate: new Date('2026-08-01'),
      category: 'vaccine',
      hospitalName: '행복 24시 동물병원',
      doctorName: '김수석 원장님',
      diagnosis: '광견병 및 종합 백신 5차 추가 접종 완료',
      prescription: '3일간 목욕 자제 및 무리한 운동 금지',
      cost: 45000,
      weightAtVisit: 3.8,
    },
  });

  const place1 = await prisma.place.create({
    data: {
      name: '행복 24시 동물의료센터',
      category: 'hospital',
      latitude: 37.5665,
      longitude: 126.978,
      address: '서울시 강남구 테헤란로 123',
      phone: '02-555-7582',
      tags: ['24시야간', '응급진료', '친절수의사'],
      imageUrl: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=500',
      is24h: true,
      rating: 4.9,
    },
  });

  const place2 = await prisma.place.create({
    data: {
      name: '멍뭉이네 애견동반 브런치카페',
      category: 'cafe',
      latitude: 37.568,
      longitude: 126.98,
      address: '서울시 서초구 반포대로 45',
      phone: '02-3482-1004',
      tags: ['야외테라스', '멍푸치노', '주차가능'],
      imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500',
      is24h: false,
      rating: 4.8,
    },
  });

  // Prisma Client can't write `geometry` columns directly (Unsupported type) — set them via raw SQL,
  // built from the same latitude/longitude values just inserted above.
  for (const place of [place1, place2]) {
    await prisma.$executeRaw`
      UPDATE places
      SET geom = ST_SetSRID(ST_MakePoint(${place.longitude}, ${place.latitude}), 4326)
      WHERE id = ${place.id}::uuid
    `;
  }

  await prisma.aiConsultation.create({
    data: {
      petId: moca.id,
      petName: moca.name,
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
        '24시간 내 혈변이나 구토 동반 시 동물병원 내원',
      ],
    },
  });

  await prisma.aiConsultation.create({
    data: {
      petId: moca.id,
      petName: moca.name,
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
        '산책 전 노즈워크로 흥분도 사전 완화',
      ],
    },
  });

  console.log('Seed complete:', { users: 3, pets: 3, places: 2, aiConsultations: 2 });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
