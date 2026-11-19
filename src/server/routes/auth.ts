import { randomUUID } from 'node:crypto';
import type { Express, Response } from 'express';
import type { UserRecord, FamilyInviteRecord } from '../store';
import { getAuthUser } from '../auth';
import { requirePetAccess } from '../authorization';
import { toPetProfile } from '../petProfile';
import { INVITE_TTL_MS, generateInviteCode, normalizeInviteCode } from '../inviteCode';
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
    const managedPets = petsDb.filter(p => userPetIds.includes(p.id)).map(p => toPetProfile(p));

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
    const managedPets = petsDb.filter(p => userPetIds.includes(p.id)).map(p => toPetProfile(p));

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
  // Owner only: a stranger gets 404, a co-parent gets 403.
  app.post('/api/v1/auth/family/invite', validate({ body: familyInviteBody }), requirePetAccess(petsDb, { from: 'body', level: 'owner' }), (req, res) => {
    const user = getAuthUser(res);
    const pet = res.locals.pet as Store['petsDb'][number];

    // Random and unguessable; retry on the (astronomically unlikely) collision.
    let inviteCode = generateInviteCode();
    while (familyInvitesDb.some(i => i.inviteCode === inviteCode)) inviteCode = generateInviteCode();
    const newInvite: FamilyInviteRecord = {
      inviteCode,
      petId: pet.id,
      petName: pet.name,
      inviterId: user.id,
      inviterName: user.nickname,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS).toISOString()
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
    const code = normalizeInviteCode(String(req.body.inviteCode));
    const invite = familyInvitesDb.find(i => i.inviteCode === code);
    const pet = invite ? petsDb.find(p => p.id === invite.petId) : undefined;
    const isUsable =
      invite !== undefined && pet !== undefined && !invite.usedAt && new Date(invite.expiresAt).getTime() > Date.now();

    // Unknown, already-used, expired and orphaned codes all get the same 404 so
    // the response never reveals which codes exist.
    if (!invite || !pet || !isUsable) {
      return res.status(404).json({ success: false, message: '유효하지 않거나 만료된 가족 초대 코드입니다.' });
    }

    // Already a member: do not burn the code, someone else may still need it.
    if (user.sharedPetIds.includes(pet.id) || user.ownedPetIds.includes(pet.id)) {
      return res.status(409).json({ success: false, message: '이미 함께 돌보고 있는 반려동물입니다.' });
    }

    invite.usedAt = new Date().toISOString();
    invite.usedBy = user.id;
    user.sharedPetIds.push(pet.id);
    res.json({
      success: true,
      message: `'${invite.inviterName}'님의 '${invite.petName}' 공동 양육자로 등록되었습니다! 🎉`,
      data: {
        pet: toPetProfile(pet),
        sharedPetIds: user.sharedPetIds
      }
    });
  });
}
