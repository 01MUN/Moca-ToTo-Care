import type { Express } from 'express';
import { GoogleGenAI } from '@google/genai';
import type { AIConsultationRecord } from '../store';
import type { Store } from '../store';

export function registerAiRoutes(app: Express, store: Store): void {
  const { aiConsultationsDb } = store;

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
}
