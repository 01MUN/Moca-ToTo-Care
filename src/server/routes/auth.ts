import { randomUUID } from 'node:crypto';
import type { Express, Response } from 'express';
import type { UserRecord, FamilyInviteRecord } from '../store';
import { getAuthUser } from '../auth';
import { signAccessToken } from '../jwt';
import { hashPassword, verifyPassword } from '../password';
import { validate } from '../validation';
import { familyInviteBody, familyJoinBody, loginBody, signupBody } from '../schemas';
import type { Store } from '../store';

// Fixed bcrypt hash compared against when the email is unknown (timing equalization).
const TIMING_DUMMY_HASH = '$2b$10$G07dPzBHw0SA1soYQSQy1OIPxj0SgeV5Dl8yAKkfr6MN7TtrsXosO';

export function registerAuthRoutes(app: Express, store: Store, jwtSecret: string): void {
  const { usersDb, familyInvitesDb, petsDb } = store;

  // Signs a token or answers 500 (inside async handlers a throw would become an
  // unhandled rejection in Express 4). Returns null when a response was sent.
  const issueToken = (res: Response, userId: string): string | null => {
    try {
      return signAccessToken(userId, jwtSecret);
    } catch (err) {
      console.error('Token signing error:', err);
      res.status(500).json({ success: false, message: '인증 토큰 발급 중 오류가 발생했습니다.' });
      return null;
    }
  };

  // ==========================================
  // [v1 API] Auth Endpoints
  // ==========================================
  // POST /api/v1/auth/login
  app.post('/api/v1/auth/login', validate({ body: loginBody }), async (req, res) => {
    const { email, password } = req.body;
    let user: UserRecord | undefined;
    try {
      const candidate = usersDb.find(u => u.email === email);
      // Always run a bcrypt compare so unknown emails take as long as wrong passwords.
      const passwordOk = await verifyPassword(String(password ?? ''), candidate?.passwordHash ?? TIMING_DUMMY_HASH);
      user = candidate && passwordOk ? candidate : undefined;
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ success: false, message: '로그인 처리 중 오류가 발생했습니다.' });
    }
    if (!user) {
      return res.status(401).json({ success: false, message: '이메일 또는 비밀번호가 일치하지 않습니다.' });
    }

    const token = issueToken(res, user.id);
    if (!token) return;
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
  app.post('/api/v1/auth/signup', validate({ body: signupBody }), async (req, res) => {
    // Body is validated by signupBody; a client-supplied `role` is stripped there.
    const { email, password, nickname } = req.body as { email: string; password: string; nickname: string };

    const duplicateMessage = '이미 가입된 이메일 주소입니다.';
    if (usersDb.some(u => u.email === email)) {
      return res.status(409).json({ success: false, message: duplicateMessage });
    }

    let passwordHash: string;
    try {
      passwordHash = await hashPassword(password);
    } catch (err) {
      console.error('Signup password hashing error:', err);
      return res.status(500).json({ success: false, message: '회원가입 처리 중 오류가 발생했습니다.' });
    }
    // Re-check after the async hash: a concurrent signup may have taken the email.
    if (usersDb.some(u => u.email === email)) {
      return res.status(409).json({ success: false, message: duplicateMessage });
    }

    const newUser: UserRecord = {
      // Random, unguessable id: Date.now() ids could collide for concurrent
      // signups and let one user's token resolve to another account.
      id: `u_${randomUUID()}`,
      email,
      passwordHash,
      nickname,
      role: 'owner',
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(nickname)}`,
      ownedPetIds: [],
      sharedPetIds: [],
      createdAt: new Date().toISOString()
    };

    // Sign before persisting so a signing failure never leaves an orphan account.
    const token = issueToken(res, newUser.id);
    if (!token) return;
    usersDb.push(newUser);

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
    const user = getAuthUser(res);
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
  app.post('/api/v1/auth/family/invite', validate({ body: familyInviteBody }), (req, res) => {
    const user = getAuthUser(res);
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
  app.post('/api/v1/auth/family/join', validate({ body: familyJoinBody }), (req, res) => {
    const user = getAuthUser(res);
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
