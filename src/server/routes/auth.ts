import type { Express } from 'express';
import type { UserRecord, FamilyInviteRecord } from '../store';
import { getAuthUser as getAuthUserFrom } from '../auth';
import type { Store } from '../store';

export function registerAuthRoutes(app: Express, store: Store): void {
  const { usersDb, familyInvitesDb, petsDb } = store;
  const getAuthUser = (req: Parameters<typeof getAuthUserFrom>[1]) => getAuthUserFrom(usersDb, req);

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
}
