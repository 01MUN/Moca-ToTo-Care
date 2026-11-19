// ====================================================================
// 🎨 Fluffy Days HD Kawaii Pixel Sprite Engine (64x64 & 80x80 High-Density)
// High-Resolution 16-Bit & 32-Bit Micro-Dot Art Engine matching user references
// ====================================================================

import { PixelSpritePose, PixelFurColorPreset } from '../types';

export type PixelDensity = 32 | 48 | 64 | 80;

export interface KawaiiSpriteOptions {
  pose: PixelSpritePose;
  species: 'cat' | 'dog';
  gridResolution?: PixelDensity; // 32, 48, 64 (Default HD), 80 (Ultra)
  mainFurColor: string;          // Primary coat color
  secondaryFurColor?: string;    // Belly / muzzle / paw color
  stripeColor?: string;          // Tabby stripe color if any
  hasStripes?: boolean;          // Enable tabby / tiger stripes
  hasWhitePaws?: boolean;        // White socks paws
  eyeColor?: string;             // Eye color (for open eyes)
  blushColor?: string;           // Cheek blush color
  innerEarColor?: string;        // Inner ear color
  outlineColor?: string;         // Contour outline color
  pacifierColor?: string;        // Pacifier ring color
  ribbonColor?: string;          // Ribbon/bow color
  cushionColor?: string;         // Bed cushion color
  // Accessories & Details
  showFloatingHeart?: boolean;
  showPacifier?: boolean;
  showRibbon?: boolean;
  showCushion?: boolean;
  showSleepZzz?: boolean;
  isSleepingEyes?: boolean;
  showWhiskers?: boolean;
  showSparkles?: boolean;
  // Animation state (ticks for bobbing/blinking/twinkling)
  animTick?: number;
  // Background
  backdrop: 'dark' | 'white' | 'cream' | 'lavender' | 'transparent';
}

export interface FurColorPresetConfig {
  id: PixelFurColorPreset;
  name: string;
  species: 'cat' | 'dog';
  mainFur: string;
  secondaryFur: string;
  stripeColor: string;
  hasStripes: boolean;
  hasWhitePaws: boolean;
  eyeColor: string;
  blushColor: string;
  innerEarColor: string;
  outlineColor: string;
}

export const FUR_COLOR_PRESETS: FurColorPresetConfig[] = [
  {
    id: 'white',
    name: '순백 요정 (Pure White)',
    species: 'cat',
    mainFur: '#FFFFFF',
    secondaryFur: '#F7F7FA',
    stripeColor: '#E2E2EA',
    hasStripes: false,
    hasWhitePaws: true,
    eyeColor: '#423748',
    blushColor: '#FFAAA6',
    innerEarColor: '#FFB8C6',
    outlineColor: '#362E3B',
  },
  {
    id: 'grey_tabby',
    name: '고등어 태비 (Grey Tabby)',
    species: 'cat',
    mainFur: '#B2B2BC',
    secondaryFur: '#EAEAF0',
    stripeColor: '#7C7C8C',
    hasStripes: true,
    hasWhitePaws: true,
    eyeColor: '#362E3B',
    blushColor: '#FFAAA6',
    innerEarColor: '#FFAEC8',
    outlineColor: '#342E38',
  },
  {
    id: 'cheese_tabby',
    name: '치즈 태비 (Ginger Cheese)',
    species: 'cat',
    mainFur: '#F6B36D',
    secondaryFur: '#FFF6ED',
    stripeColor: '#D3792E',
    hasStripes: true,
    hasWhitePaws: true,
    eyeColor: '#442B1A',
    blushColor: '#FFAAA6',
    innerEarColor: '#FFCAD4',
    outlineColor: '#3E2415',
  },
  {
    id: 'cream_maltipoo',
    name: '크림 말티푸 (Cream Maltipoo)',
    species: 'dog',
    mainFur: '#EBD5BD',
    secondaryFur: '#FFF9F2',
    stripeColor: '#D3B799',
    hasStripes: false,
    hasWhitePaws: true,
    eyeColor: '#392B2B',
    blushColor: '#FFB7B2',
    innerEarColor: '#FFCAD4',
    outlineColor: '#43342B',
  },
  {
    id: 'bichon_fluffy',
    name: '비숑 솜뭉치 (Fluffy Bichon)',
    species: 'dog',
    mainFur: '#FFFFFF',
    secondaryFur: '#F6F6F8',
    stripeColor: '#E6E6EA',
    hasStripes: false,
    hasWhitePaws: true,
    eyeColor: '#282828',
    blushColor: '#FFAAA6',
    innerEarColor: '#FFCAD4',
    outlineColor: '#3C3440',
  },
  {
    id: 'shiba_sable',
    name: '시바견 적갈색 (Shiba Red)',
    species: 'dog',
    mainFur: '#D9793B',
    secondaryFur: '#FFF4E5',
    stripeColor: '#B0531D',
    hasStripes: false,
    hasWhitePaws: true,
    eyeColor: '#382216',
    blushColor: '#FFAAA6',
    innerEarColor: '#FFCAD4',
    outlineColor: '#432514',
  },
  {
    id: 'tuxedo',
    name: '턱시도 블랙&화이트 (Tuxedo)',
    species: 'cat',
    mainFur: '#36363E',
    secondaryFur: '#FFFFFF',
    stripeColor: '#222227',
    hasStripes: false,
    hasWhitePaws: true,
    eyeColor: '#5EAFA7',
    blushColor: '#FFB7B2',
    innerEarColor: '#FFAEC8',
    outlineColor: '#1E1E23',
  },
  {
    id: 'choco_mocha',
    name: '초코 모카 (Choco Mocha)',
    species: 'dog',
    mainFur: '#6B4936',
    secondaryFur: '#9E7457',
    stripeColor: '#483023',
    hasStripes: false,
    hasWhitePaws: true,
    eyeColor: '#261710',
    blushColor: '#FFAAA6',
    innerEarColor: '#D8A09E',
    outlineColor: '#24140D',
  },
  {
    id: 'calico',
    name: '삼색이 (Calico Lucky)',
    species: 'cat',
    mainFur: '#FFFFFF',
    secondaryFur: '#F8B570',
    stripeColor: '#48434D',
    hasStripes: true,
    hasWhitePaws: true,
    eyeColor: '#487A6E',
    blushColor: '#FFAAA6',
    innerEarColor: '#FFCAD4',
    outlineColor: '#36303B',
  },
  {
    id: 'sakura_pastel',
    name: '사쿠라 핑크 파스텔 (Sakura Kawaii)',
    species: 'cat',
    mainFur: '#FFFFFF',
    secondaryFur: '#FFF0F5',
    stripeColor: '#FFD1DC',
    hasStripes: false,
    hasWhitePaws: true,
    eyeColor: '#58485D',
    blushColor: '#FF98A0',
    innerEarColor: '#FFB5B0',
    outlineColor: '#9C90A4',
  },
];

// Color utility helpers for realistic HD shading
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16),
    ];
  }
  return [
    parseInt(clean.substring(0, 2), 16) || 0,
    parseInt(clean.substring(2, 4), 16) || 0,
    parseInt(clean.substring(4, 6), 16) || 0,
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    '#' +
    clamp(r).toString(16).padStart(2, '0') +
    clamp(g).toString(16).padStart(2, '0') +
    clamp(b).toString(16).padStart(2, '0')
  );
}

function adjustBrightness(hex: string, percent: number): string {
  const [r, g, b] = hexToRgb(hex);
  const factor = 1 + percent / 100;
  return rgbToHex(r * factor, g * factor, b * factor);
}

function blendHex(hex1: string, hex2: string, weight: number): string {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  const w = Math.max(0, Math.min(1, weight));
  return rgbToHex(r1 * (1 - w) + r2 * w, g1 * (1 - w) + g2 * w, b1 * (1 - w) + b2 * w);
}

// Low-level pixel drawing primitives
function setPixel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  pixelSize: number,
  offsetX = 0,
  offsetY = 0
) {
  ctx.fillStyle = color;
  ctx.fillRect((x + offsetX) * pixelSize, (y + offsetY) * pixelSize, pixelSize, pixelSize);
}

function fillPixelRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  pixelSize: number,
  offsetX = 0,
  offsetY = 0
) {
  ctx.fillStyle = color;
  ctx.fillRect((x + offsetX) * pixelSize, (y + offsetY) * pixelSize, w * pixelSize, h * pixelSize);
}

function drawPixelCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string,
  pixelSize: number,
  offsetX = 0,
  offsetY = 0
) {
  const r2 = radius * radius;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy <= r2) {
        setPixel(ctx, cx + dx, cy + dy, color, pixelSize, offsetX, offsetY);
      }
    }
  }
}

/**
 * ====================================================================
 * HD RENDER POSE 1: BELLY UP WITH FLOATING HEART (Reference #1)
 * High-Density 64x64: Delicate curved spine, striped bands, 4 soft paws in air,
 * pink collar/tongue highlight, 3D shining pixel heart
 * ====================================================================
 */
function renderHDBellyUp(
  ctx: CanvasRenderingContext2D,
  opt: KawaiiSpriteOptions,
  pixelSize: number,
  offsetX: number,
  offsetY: number
) {
  const {
    mainFurColor = '#B2B2BC',
    secondaryFurColor = '#EAEAF0',
    stripeColor = '#7C7C8C',
    hasStripes = true,
    blushColor = '#FFAAA6',
    innerEarColor = '#FFAEC8',
    outlineColor = '#342E38',
    showFloatingHeart = true,
    animTick = 0,
  } = opt;

  const shadeFur = adjustBrightness(mainFurColor, -14);
  const lightFur = adjustBrightness(mainFurColor, 12);
  const bellyShade = blendHex(secondaryFurColor, shadeFur, 0.25);
  const tonguePink = '#FF528A';
  const tongueLight = '#FFAAC8';

  const bx = 12;
  const by = 25;

  // --- 1. MAIN TORSO & BACK CURVE (Smooth 64-Grid Oval) ---
  // Outline
  fillPixelRect(ctx, bx + 4, by + 4, 34, 18, outlineColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, bx + 2, by + 7, 38, 12, outlineColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, bx + 6, by + 2, 30, 22, outlineColor, pixelSize, offsetX, offsetY);

  // Main Fur Fill
  fillPixelRect(ctx, bx + 5, by + 5, 32, 16, mainFurColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, bx + 3, by + 8, 36, 10, mainFurColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, bx + 7, by + 3, 28, 20, mainFurColor, pixelSize, offsetX, offsetY);

  // Under-Spine Shadow (Curved lower edge)
  fillPixelRect(ctx, bx + 6, by + 19, 30, 3, shadeFur, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, bx + 10, by + 21, 22, 2, shadeFur, pixelSize, offsetX, offsetY);

  // Upper light highlight
  fillPixelRect(ctx, bx + 10, by + 4, 20, 2, lightFur, pixelSize, offsetX, offsetY);

  // --- 2. SOFT WHITE/CREAM BELLY (Delicate Gradient) ---
  fillPixelRect(ctx, bx + 12, by + 8, 18, 10, bellyShade, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, bx + 14, by + 9, 14, 8, secondaryFurColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, bx + 16, by + 10, 10, 5, '#FFFFFF', pixelSize, offsetX, offsetY); // Specular center

  // --- 3. DETAILED TABBY STRIPES (Smooth Curved Bands) ---
  if (hasStripes) {
    // Left hip stripes
    fillPixelRect(ctx, bx + 8, by + 6, 3, 14, stripeColor, pixelSize, offsetX, offsetY);
    fillPixelRect(ctx, bx + 9, by + 8, 3, 10, adjustBrightness(stripeColor, -8), pixelSize, offsetX, offsetY);

    // Mid body stripes
    fillPixelRect(ctx, bx + 14, by + 13, 3, 7, stripeColor, pixelSize, offsetX, offsetY);
    fillPixelRect(ctx, bx + 21, by + 14, 3, 6, stripeColor, pixelSize, offsetX, offsetY);
    fillPixelRect(ctx, bx + 28, by + 13, 3, 7, stripeColor, pixelSize, offsetX, offsetY);

    // Neck stripes
    fillPixelRect(ctx, bx + 32, by + 6, 3, 12, stripeColor, pixelSize, offsetX, offsetY);
  }

  // --- 4. TAIL (Curved to the left with soft tip) ---
  // Tail base & outline
  fillPixelRect(ctx, bx - 6, by + 12, 10, 6, outlineColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, bx - 8, by + 14, 6, 4, outlineColor, pixelSize, offsetX, offsetY);
  // Tail fill
  fillPixelRect(ctx, bx - 5, by + 13, 8, 4, mainFurColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, bx - 7, by + 15, 5, 2, lightFur, pixelSize, offsetX, offsetY);
  if (hasStripes) {
    fillPixelRect(ctx, bx - 3, by + 13, 2, 4, stripeColor, pixelSize, offsetX, offsetY);
    fillPixelRect(ctx, bx + 1, by + 13, 2, 4, stripeColor, pixelSize, offsetX, offsetY);
  }

  // --- 5. 4 PAWS IN THE AIR (White Sock Paws + Pink Beans) ---
  // Back Paw 1 (Far Left)
  fillPixelRect(ctx, bx + 6, by - 4, 5, 10, outlineColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, bx + 7, by - 3, 3, 8, mainFurColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, bx + 7, by - 3, 3, 4, '#FFFFFF', pixelSize, offsetX, offsetY); // White sock
  setPixel(ctx, bx + 8, by - 2, blushColor, pixelSize, offsetX, offsetY); // Paw pad pink

  // Back Paw 2 (Inner Left)
  fillPixelRect(ctx, bx + 16, by - 6, 6, 12, outlineColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, bx + 17, by - 5, 4, 10, mainFurColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, bx + 17, by - 5, 4, 5, '#FFFFFF', pixelSize, offsetX, offsetY); // White sock
  fillPixelRect(ctx, bx + 18, by - 4, 2, 2, blushColor, pixelSize, offsetX, offsetY);

  // Front Paw 3 (Inner Right)
  fillPixelRect(ctx, bx + 27, by - 6, 6, 11, outlineColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, bx + 28, by - 5, 4, 9, mainFurColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, bx + 28, by - 5, 4, 4, '#FFFFFF', pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, bx + 29, by - 4, 2, 2, blushColor, pixelSize, offsetX, offsetY);

  // Front Paw 4 (Far Right near head)
  fillPixelRect(ctx, bx + 36, by - 7, 6, 12, outlineColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, bx + 37, by - 6, 4, 10, mainFurColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, bx + 37, by - 6, 4, 5, '#FFFFFF', pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, bx + 38, by - 5, 2, 2, blushColor, pixelSize, offsetX, offsetY);

  // --- 6. HEAD (Tilted back happily, looking up) ---
  const hx = bx + 32;
  const hy = by + 2;

  // Head outline & fill
  fillPixelRect(ctx, hx, hy, 18, 16, outlineColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, hx + 1, hy + 1, 16, 14, mainFurColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, hx + 3, hy + 2, 12, 11, lightFur, pixelSize, offsetX, offsetY);

  // Ear sticking up
  fillPixelRect(ctx, hx + 12, hy - 6, 6, 8, outlineColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, hx + 13, hy - 5, 4, 6, mainFurColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, hx + 14, hy - 4, 2, 4, innerEarColor, pixelSize, offsetX, offsetY);

  // Left folded ear tip
  fillPixelRect(ctx, hx + 3, hy - 3, 5, 5, outlineColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, hx + 4, hy - 2, 3, 3, innerEarColor, pixelSize, offsetX, offsetY);

  // Happy curved sleeping eyes (^ ^)
  drawPixelArc(ctx, hx + 5, hy + 6, 4, outlineColor, pixelSize, offsetX, offsetY);

  // Soft cheek blush
  drawPixelCircle(ctx, hx + 4, hy + 10, 2, blushColor, pixelSize, offsetX, offsetY);
  setPixel(ctx, hx + 4, hy + 10, '#FFFFFF', pixelSize, offsetX, offsetY);

  // Tongue / Cute Pink Bib Collar (Reference #1 Pop Pink)
  fillPixelRect(ctx, hx + 1, hy + 13, 8, 6, outlineColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, hx + 2, hy + 14, 6, 4, tonguePink, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, hx + 3, hy + 14, 4, 2, tongueLight, pixelSize, offsetX, offsetY);

  // Head stripes
  if (hasStripes) {
    fillPixelRect(ctx, hx + 9, hy + 3, 2, 4, stripeColor, pixelSize, offsetX, offsetY);
    fillPixelRect(ctx, hx + 12, hy + 4, 2, 5, stripeColor, pixelSize, offsetX, offsetY);
  }

  // --- 7. FLOATING 3D SHINING PIXEL HEART (Reference #1) ---
  if (showFloatingHeart) {
    const heartBob = Math.sin((animTick || 0) * 0.18) * 3;
    renderHDHeart(ctx, bx + 19, by - 18 + heartBob, pixelSize, offsetX, offsetY);
  }
}

/**
 * ====================================================================
 * HD RENDER POSE 2: SITTING CUTE WITH BIG EYES & PACIFIER (Reference #2)
 * High-Density 64x64: Big sparkling anime-dot eyes, translucent pacifier,
 * fine whiskers, soft multi-tone cheek blush, rounded front paws
 * ====================================================================
 */
function renderHDSittingCute(
  ctx: CanvasRenderingContext2D,
  opt: KawaiiSpriteOptions,
  pixelSize: number,
  offsetX: number,
  offsetY: number
) {
  const {
    species = 'cat',
    mainFurColor = '#FFFFFF',
    secondaryFurColor = '#F7F7FA',
    stripeColor = '#E2E2EA',
    hasStripes = false,
    eyeColor = '#423748',
    blushColor = '#FFAAA6',
    innerEarColor = '#FFB8C6',
    outlineColor = '#362E3B',
    pacifierColor = '#FF7597',
    showPacifier = true,
    showRibbon = false,
    showFloatingHeart = false,
    showWhiskers = true,
    isSleepingEyes = false,
    animTick = 0,
  } = opt;

  const shadeFur = adjustBrightness(mainFurColor, -12);
  const lightFur = adjustBrightness(mainFurColor, 10);
  const hx = 16;
  const hy = 16;

  // --- 1. EARS (HD Rounded with inner fluff) ---
  if (species === 'cat') {
    // Left Ear
    fillPixelRect(ctx, hx + 3, hy - 8, 7, 9, outlineColor, pixelSize, offsetX, offsetY);
    fillPixelRect(ctx, hx + 4, hy - 7, 5, 7, mainFurColor, pixelSize, offsetX, offsetY);
    fillPixelRect(ctx, hx + 5, hy - 6, 3, 5, innerEarColor, pixelSize, offsetX, offsetY);
    setPixel(ctx, hx + 6, hy - 5, '#FFFFFF', pixelSize, offsetX, offsetY); // Inner ear shine

    // Right Ear
    fillPixelRect(ctx, hx + 22, hy - 8, 7, 9, outlineColor, pixelSize, offsetX, offsetY);
    fillPixelRect(ctx, hx + 23, hy - 7, 5, 7, mainFurColor, pixelSize, offsetX, offsetY);
    fillPixelRect(ctx, hx + 24, hy - 6, 3, 5, innerEarColor, pixelSize, offsetX, offsetY);
    setPixel(ctx, hx + 25, hy - 5, '#FFFFFF', pixelSize, offsetX, offsetY);
  } else {
    // Floppy Dog Ears (Maltese/Poodle)
    fillPixelRect(ctx, hx - 3, hy + 2, 6, 18, outlineColor, pixelSize, offsetX, offsetY);
    fillPixelRect(ctx, hx - 2, hy + 3, 4, 16, mainFurColor, pixelSize, offsetX, offsetY);
    fillPixelRect(ctx, hx - 1, hy + 4, 2, 14, shadeFur, pixelSize, offsetX, offsetY);

    fillPixelRect(ctx, hx + 29, hy + 2, 6, 18, outlineColor, pixelSize, offsetX, offsetY);
    fillPixelRect(ctx, hx + 30, hy + 3, 4, 16, mainFurColor, pixelSize, offsetX, offsetY);
    fillPixelRect(ctx, hx + 31, hy + 4, 2, 14, shadeFur, pixelSize, offsetX, offsetY);
  }

  // --- 2. HEAD CONTOUR (Smooth 32x22 Oval Shape) ---
  fillPixelRect(ctx, hx + 3, hy, 26, 22, outlineColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, hx + 1, hy + 3, 30, 16, outlineColor, pixelSize, offsetX, offsetY);

  // Main Head Fill
  fillPixelRect(ctx, hx + 4, hy + 1, 24, 20, mainFurColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, hx + 2, hy + 4, 28, 14, mainFurColor, pixelSize, offsetX, offsetY);

  // Head Top Light & Bottom Shadow
  fillPixelRect(ctx, hx + 8, hy + 2, 16, 3, lightFur, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, hx + 4, hy + 19, 24, 2, shadeFur, pixelSize, offsetX, offsetY);

  // Tabby stripes if active
  if (hasStripes) {
    fillPixelRect(ctx, hx + 15, hy + 2, 2, 6, stripeColor, pixelSize, offsetX, offsetY);
    fillPixelRect(ctx, hx + 10, hy + 4, 3, 4, stripeColor, pixelSize, offsetX, offsetY);
    fillPixelRect(ctx, hx + 19, hy + 4, 3, 4, stripeColor, pixelSize, offsetX, offsetY);
  }

  // --- 3. EXPRESSIVE SPARKLING EYES (HD Multi-Shaded Dots) ---
  const isBlinking = animTick % 36 >= 32;

  if (isSleepingEyes || isBlinking) {
    // Gentle curved sleeping eye lines: ‿   ‿
    drawPixelArc(ctx, hx + 6, hy + 10, 4, eyeColor, pixelSize, offsetX, offsetY);
    drawPixelArc(ctx, hx + 20, hy + 10, 4, eyeColor, pixelSize, offsetX, offsetY);
  } else {
    // Left Eye (Big 4x6 anime-dot with gradient and specular gleams)
    fillPixelRect(ctx, hx + 6, hy + 8, 5, 6, outlineColor, pixelSize, offsetX, offsetY);
    fillPixelRect(ctx, hx + 7, hy + 9, 3, 4, eyeColor, pixelSize, offsetX, offsetY);
    setPixel(ctx, hx + 7, hy + 9, '#FFFFFF', pixelSize, offsetX, offsetY); // Big upper catchlight
    setPixel(ctx, hx + 9, hy + 12, adjustBrightness(eyeColor, 35), pixelSize, offsetX, offsetY); // Iris light

    // Right Eye
    fillPixelRect(ctx, hx + 21, hy + 8, 5, 6, outlineColor, pixelSize, offsetX, offsetY);
    fillPixelRect(ctx, hx + 22, hy + 9, 3, 4, eyeColor, pixelSize, offsetX, offsetY);
    setPixel(ctx, hx + 22, hy + 9, '#FFFFFF', pixelSize, offsetX, offsetY); // Catchlight
    setPixel(ctx, hx + 24, hy + 12, adjustBrightness(eyeColor, 35), pixelSize, offsetX, offsetY);
  }

  // --- 4. MULTI-TONE CHEEK BLUSH (Soft Aura Effect) ---
  // Left Cheek Blush
  drawPixelCircle(ctx, hx + 5, hy + 14, 3, blushColor, pixelSize, offsetX, offsetY);
  drawPixelCircle(ctx, hx + 5, hy + 14, 1, adjustBrightness(blushColor, 15), pixelSize, offsetX, offsetY);
  setPixel(ctx, hx + 4, hy + 13, '#FFFFFF', pixelSize, offsetX, offsetY);

  // Right Cheek Blush
  drawPixelCircle(ctx, hx + 26, hy + 14, 3, blushColor, pixelSize, offsetX, offsetY);
  drawPixelCircle(ctx, hx + 26, hy + 14, 1, adjustBrightness(blushColor, 15), pixelSize, offsetX, offsetY);
  setPixel(ctx, hx + 25, hy + 13, '#FFFFFF', pixelSize, offsetX, offsetY);

  // --- 5. PACIFIER OR CUTE NOSE (Reference #2) ---
  if (showPacifier) {
    // 3D Shaded Pacifier
    const px = hx + 13;
    const py = hy + 12;
    fillPixelRect(ctx, px - 1, py - 1, 8, 7, outlineColor, pixelSize, offsetX, offsetY);
    fillPixelRect(ctx, px, py, 6, 5, pacifierColor, pixelSize, offsetX, offsetY);
    fillPixelRect(ctx, px + 1, py + 1, 4, 3, adjustBrightness(pacifierColor, 20), pixelSize, offsetX, offsetY);
    // Center ring button
    fillPixelRect(ctx, px + 2, py + 2, 2, 2, '#FFFFFF', pixelSize, offsetX, offsetY);
    // Ring handle
    setPixel(ctx, px + 1, py + 5, outlineColor, pixelSize, offsetX, offsetY);
    setPixel(ctx, px + 4, py + 5, outlineColor, pixelSize, offsetX, offsetY);
    fillPixelRect(ctx, px + 2, py + 6, 2, 1, outlineColor, pixelSize, offsetX, offsetY);
  } else {
    // Soft cute nose & mouth
    fillPixelRect(ctx, hx + 15, hy + 13, 2, 2, '#FF9AA2', pixelSize, offsetX, offsetY);
    setPixel(ctx, hx + 14, hy + 15, outlineColor, pixelSize, offsetX, offsetY);
    setPixel(ctx, hx + 17, hy + 15, outlineColor, pixelSize, offsetX, offsetY);
  }

  // Whiskers (Delicate single pixel lines)
  if (species === 'cat' && showWhiskers) {
    // Left Whiskers
    setPixel(ctx, hx - 3, hy + 12, outlineColor, pixelSize, offsetX, offsetY);
    setPixel(ctx, hx - 2, hy + 12, outlineColor, pixelSize, offsetX, offsetY);
    setPixel(ctx, hx - 1, hy + 13, outlineColor, pixelSize, offsetX, offsetY);

    setPixel(ctx, hx - 3, hy + 16, outlineColor, pixelSize, offsetX, offsetY);
    setPixel(ctx, hx - 2, hy + 15, outlineColor, pixelSize, offsetX, offsetY);
    setPixel(ctx, hx - 1, hy + 15, outlineColor, pixelSize, offsetX, offsetY);

    // Right Whiskers
    setPixel(ctx, hx + 32, hy + 12, outlineColor, pixelSize, offsetX, offsetY);
    setPixel(ctx, hx + 33, hy + 12, outlineColor, pixelSize, offsetX, offsetY);
    setPixel(ctx, hx + 31, hy + 13, outlineColor, pixelSize, offsetX, offsetY);

    setPixel(ctx, hx + 32, hy + 16, outlineColor, pixelSize, offsetX, offsetY);
    setPixel(ctx, hx + 33, hy + 15, outlineColor, pixelSize, offsetX, offsetY);
    setPixel(ctx, hx + 31, hy + 15, outlineColor, pixelSize, offsetX, offsetY);
  }

  // --- 6. BODY & FRONT SITTING PAWS ---
  const by = hy + 20;
  const bx = hx + 4;

  // Body Fill
  fillPixelRect(ctx, bx + 1, by, 22, 12, outlineColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, bx + 2, by + 1, 20, 10, mainFurColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, bx + 4, by + 2, 16, 8, secondaryFurColor, pixelSize, offsetX, offsetY); // Chest fluff

  // Front Paws Division (T-Shape front paws with rounded toe dividers)
  fillPixelRect(ctx, bx + 9, by + 3, 4, 8, outlineColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, bx + 10, by + 3, 2, 7, mainFurColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, bx + 4, by + 9, 14, 2, outlineColor, pixelSize, offsetX, offsetY);

  // Left Paw Toes
  fillPixelRect(ctx, bx + 4, by + 8, 5, 2, '#FFFFFF', pixelSize, offsetX, offsetY);
  setPixel(ctx, bx + 6, by + 9, outlineColor, pixelSize, offsetX, offsetY);

  // Right Paw Toes
  fillPixelRect(ctx, bx + 13, by + 8, 5, 2, '#FFFFFF', pixelSize, offsetX, offsetY);
  setPixel(ctx, bx + 15, by + 9, outlineColor, pixelSize, offsetX, offsetY);

  // --- 7. TAIL (Curling up to the right) ---
  fillPixelRect(ctx, bx + 20, by + 3, 8, 7, outlineColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, bx + 21, by + 4, 6, 5, mainFurColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, bx + 23, by + 5, 4, 3, lightFur, pixelSize, offsetX, offsetY);

  // --- 8. ACCESSORIES ---
  // Ear Ribbon (Reference #4)
  if (showRibbon) {
    renderHDRibbon(ctx, hx + 22, hy - 4, pixelSize, offsetX, offsetY);
  }

  // Floating Heart
  if (showFloatingHeart) {
    const heartBob = Math.sin((animTick || 0) * 0.18) * 3;
    renderHDHeart(ctx, hx + 13, hy - 16 + heartBob, pixelSize, offsetX, offsetY);
  }
}

/**
 * ====================================================================
 * HD RENDER POSE 3: SLEEPING ON LACE CUSHION (Reference #3)
 * High-Density 64x64: Multi-tiered scalloped lace cushion with pink gradient,
 * curled sleeping kitten, delicate whisker arcs, zzz floating sleep effect
 * ====================================================================
 */
function renderHDSleepingCushion(
  ctx: CanvasRenderingContext2D,
  opt: KawaiiSpriteOptions,
  pixelSize: number,
  offsetX: number,
  offsetY: number
) {
  const {
    species = 'cat',
    mainFurColor = '#FFFFFF',
    secondaryFurColor = '#F7F7FA',
    eyeColor = '#423748',
    blushColor = '#FFAAA6',
    innerEarColor = '#FFB8C6',
    outlineColor = '#362E3B',
    pacifierColor = '#FF7597',
    cushionColor = '#FFB5C5',
    showPacifier = true,
    showSleepZzz = true,
    animTick = 0,
  } = opt;

  const shadeFur = adjustBrightness(mainFurColor, -12);
  const cx = 8;
  const cy = 26;

  // --- 1. SCALLOPED LACE CUSHION BED (Reference #3) ---
  // Outer White Lace Base (Multi-ring scalloped border)
  fillPixelRect(ctx, cx, cy + 6, 48, 16, '#FFFFFF', pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, cx + 2, cy + 4, 44, 20, '#FFFFFF', pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, cx + 4, cy + 2, 40, 24, '#FFFFFF', pixelSize, offsetX, offsetY);

  // Scallop bumps along bottom edge
  for (let s = 0; s < 7; s++) {
    fillPixelRect(ctx, cx + 4 + s * 6, cy + 22, 4, 3, '#FFFFFF', pixelSize, offsetX, offsetY);
    fillPixelRect(ctx, cx + 5 + s * 6, cy + 24, 2, 2, adjustBrightness('#FFFFFF', -8), pixelSize, offsetX, offsetY);
  }

  // Cushion Dark Outline
  fillPixelRect(ctx, cx + 3, cy + 6, 42, 14, outlineColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, cx + 5, cy + 4, 38, 18, outlineColor, pixelSize, offsetX, offsetY);

  // Cushion Pink Main Fill & Gradients
  const cushionDark = adjustBrightness(cushionColor, -15);
  const cushionLight = adjustBrightness(cushionColor, 20);

  fillPixelRect(ctx, cx + 4, cy + 7, 40, 12, cushionDark, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, cx + 6, cy + 5, 36, 16, cushionColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, cx + 8, cy + 7, 32, 10, cushionLight, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, cx + 12, cy + 9, 24, 6, '#FFF0F5', pixelSize, offsetX, offsetY); // Top cushion highlight

  // --- 2. SLEEPING CAT / DOG ON BED ---
  const kx = cx + 11;
  const ky = cy - 6;

  // Ears
  if (species === 'cat') {
    // Left Ear
    fillPixelRect(ctx, kx + 2, ky - 6, 6, 8, outlineColor, pixelSize, offsetX, offsetY);
    fillPixelRect(ctx, kx + 3, ky - 5, 4, 6, mainFurColor, pixelSize, offsetX, offsetY);
    fillPixelRect(ctx, kx + 4, ky - 4, 2, 4, innerEarColor, pixelSize, offsetX, offsetY);

    // Right Ear
    fillPixelRect(ctx, kx + 18, ky - 6, 6, 8, outlineColor, pixelSize, offsetX, offsetY);
    fillPixelRect(ctx, kx + 19, ky - 5, 4, 6, mainFurColor, pixelSize, offsetX, offsetY);
    fillPixelRect(ctx, kx + 20, ky - 4, 2, 4, innerEarColor, pixelSize, offsetX, offsetY);
  } else {
    fillPixelRect(ctx, kx - 2, ky, 5, 12, outlineColor, pixelSize, offsetX, offsetY);
    fillPixelRect(ctx, kx - 1, ky + 1, 3, 10, mainFurColor, pixelSize, offsetX, offsetY);
    fillPixelRect(ctx, kx + 23, ky, 5, 12, outlineColor, pixelSize, offsetX, offsetY);
    fillPixelRect(ctx, kx + 24, ky + 1, 3, 10, mainFurColor, pixelSize, offsetX, offsetY);
  }

  // Head Outline & Fill
  fillPixelRect(ctx, kx + 2, ky, 22, 18, outlineColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, kx, ky + 2, 26, 14, outlineColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, kx + 3, ky + 1, 20, 16, mainFurColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, kx + 1, ky + 3, 24, 12, mainFurColor, pixelSize, offsetX, offsetY);

  // Sleeping Eyes (Resting gentle curves: --  --)
  fillPixelRect(ctx, kx + 5, ky + 8, 5, 2, eyeColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, kx + 16, ky + 8, 5, 2, eyeColor, pixelSize, offsetX, offsetY);

  // Soft Blush
  drawPixelCircle(ctx, kx + 4, ky + 11, 2, blushColor, pixelSize, offsetX, offsetY);
  drawPixelCircle(ctx, kx + 21, ky + 11, 2, blushColor, pixelSize, offsetX, offsetY);

  // Pacifier
  if (showPacifier) {
    const px = kx + 10;
    const py = ky + 8;
    fillPixelRect(ctx, px, py, 6, 5, outlineColor, pixelSize, offsetX, offsetY);
    fillPixelRect(ctx, px + 1, py + 1, 4, 3, pacifierColor, pixelSize, offsetX, offsetY);
    setPixel(ctx, px + 2, py + 2, '#FFFFFF', pixelSize, offsetX, offsetY);
  } else {
    fillPixelRect(ctx, kx + 12, ky + 9, 2, 2, '#FF9AA2', pixelSize, offsetX, offsetY);
  }

  // Front Paws resting tucked on cushion
  fillPixelRect(ctx, kx + 6, ky + 14, 14, 5, outlineColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, kx + 7, ky + 15, 12, 3, mainFurColor, pixelSize, offsetX, offsetY);
  setPixel(ctx, kx + 13, ky + 16, outlineColor, pixelSize, offsetX, offsetY); // Paw separator

  // Tail resting on cushion
  fillPixelRect(ctx, kx + 22, ky + 8, 9, 6, outlineColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, kx + 23, ky + 9, 7, 4, mainFurColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, kx + 25, ky + 10, 4, 2, secondaryFurColor, pixelSize, offsetX, offsetY);

  // --- 3. FLOATING ZZZ SLEEP EFFECT ---
  if (showSleepZzz) {
    const zOffset = Math.sin((animTick || 0) * 0.15) * 2;
    renderHDZzz(ctx, kx + 25, ky - 10 + zOffset, pixelSize, offsetX, offsetY);
  }
}

/**
 * ====================================================================
 * HD RENDER POSE 4: FLUFFY WITH RIBBON & CLOUD TAIL (Reference #4)
 * High-Density 64x64: Soft pastel purple outline, fluffy cheek tufts,
 * satin ear bow with shading, big cloud tail, floating pixel heart
 * ====================================================================
 */
function renderHDFluffyRibbon(
  ctx: CanvasRenderingContext2D,
  opt: KawaiiSpriteOptions,
  pixelSize: number,
  offsetX: number,
  offsetY: number
) {
  const {
    mainFurColor = '#FFFFFF',
    secondaryFurColor = '#FFF0F5',
    eyeColor = '#58485D',
    blushColor = '#FF98A0',
    innerEarColor = '#FFB5B0',
    outlineColor = '#9C90A4',
    ribbonColor = '#FFB5C5',
    showFloatingHeart = true,
    animTick = 0,
  } = opt;

  const fx = 16;
  const fy = 16;

  // --- 1. EARS & SATIN RIBBON (Reference #4) ---
  // Left Ear
  fillPixelRect(ctx, fx + 2, fy - 8, 7, 9, outlineColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, fx + 3, fy - 7, 5, 7, mainFurColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, fx + 4, fy - 6, 3, 5, innerEarColor, pixelSize, offsetX, offsetY);

  // Right Ear
  fillPixelRect(ctx, fx + 23, fy - 8, 7, 9, outlineColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, fx + 24, fy - 7, 5, 7, mainFurColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, fx + 25, fy - 6, 3, 5, innerEarColor, pixelSize, offsetX, offsetY);

  // Detailed Pastel Ribbon on Right Ear (Reference #4)
  renderHDRibbon(ctx, fx + 21, fy - 6, pixelSize, offsetX, offsetY, ribbonColor, outlineColor);

  // --- 2. FLUFFY HEAD WITH CHEEK TUFTS ---
  fillPixelRect(ctx, fx + 2, fy, 28, 22, outlineColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, fx, fy + 3, 32, 16, outlineColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, fx + 3, fy + 1, 26, 20, mainFurColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, fx + 1, fy + 4, 30, 14, mainFurColor, pixelSize, offsetX, offsetY);

  // Fluffy cheek tufts (Step-out pixels)
  fillPixelRect(ctx, fx - 2, fy + 8, 2, 4, outlineColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, fx - 1, fy + 9, 2, 2, mainFurColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, fx - 2, fy + 13, 2, 4, outlineColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, fx - 1, fy + 14, 2, 2, mainFurColor, pixelSize, offsetX, offsetY);

  fillPixelRect(ctx, fx + 32, fy + 8, 2, 4, outlineColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, fx + 31, fy + 9, 2, 2, mainFurColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, fx + 32, fy + 13, 2, 4, outlineColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, fx + 31, fy + 14, 2, 2, mainFurColor, pixelSize, offsetX, offsetY);

  // Gentle sleeping/resting eyes (v   v)
  setPixel(ctx, fx + 8, fy + 9, eyeColor, pixelSize, offsetX, offsetY);
  setPixel(ctx, fx + 9, fy + 10, eyeColor, pixelSize, offsetX, offsetY);
  setPixel(ctx, fx + 10, fy + 11, eyeColor, pixelSize, offsetX, offsetY);
  setPixel(ctx, fx + 11, fy + 10, eyeColor, pixelSize, offsetX, offsetY);
  setPixel(ctx, fx + 12, fy + 9, eyeColor, pixelSize, offsetX, offsetY);

  setPixel(ctx, fx + 20, fy + 9, eyeColor, pixelSize, offsetX, offsetY);
  setPixel(ctx, fx + 21, fy + 10, eyeColor, pixelSize, offsetX, offsetY);
  setPixel(ctx, fx + 22, fy + 11, eyeColor, pixelSize, offsetX, offsetY);
  setPixel(ctx, fx + 23, fy + 10, eyeColor, pixelSize, offsetX, offsetY);
  setPixel(ctx, fx + 24, fy + 9, eyeColor, pixelSize, offsetX, offsetY);

  // Multi-tone Blush
  drawPixelCircle(ctx, fx + 6, fy + 14, 3, blushColor, pixelSize, offsetX, offsetY);
  drawPixelCircle(ctx, fx + 25, fy + 14, 3, blushColor, pixelSize, offsetX, offsetY);
  setPixel(ctx, fx + 5, fy + 13, '#FFFFFF', pixelSize, offsetX, offsetY);
  setPixel(ctx, fx + 24, fy + 13, '#FFFFFF', pixelSize, offsetX, offsetY);

  // Cute Tiny Muzzle
  fillPixelRect(ctx, fx + 15, fy + 12, 2, 2, '#FFAAA6', pixelSize, offsetX, offsetY);
  setPixel(ctx, fx + 15, fy + 14, outlineColor, pixelSize, offsetX, offsetY);
  setPixel(ctx, fx + 16, fy + 14, outlineColor, pixelSize, offsetX, offsetY);

  // --- 3. FLUFFY BODY & PAWS ---
  const bodyY = fy + 20;
  fillPixelRect(ctx, fx - 1, bodyY, 34, 14, outlineColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, fx, bodyY + 1, 32, 12, mainFurColor, pixelSize, offsetX, offsetY);

  // Front Paws
  fillPixelRect(ctx, fx + 9, bodyY + 6, 5, 6, outlineColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, fx + 10, bodyY + 7, 3, 5, mainFurColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, fx + 18, bodyY + 6, 5, 6, outlineColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, fx + 19, bodyY + 7, 3, 5, mainFurColor, pixelSize, offsetX, offsetY);

  // --- 4. HUGE FLUFFY CLOUD TAIL (Reference #4) ---
  const tx = fx - 12;
  const ty = bodyY - 8;

  fillPixelRect(ctx, tx, ty, 13, 20, outlineColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, tx - 2, ty + 4, 17, 12, outlineColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, tx + 1, ty + 1, 11, 18, mainFurColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, tx - 1, ty + 5, 15, 10, mainFurColor, pixelSize, offsetX, offsetY);
  // Pink Fluff Glow inside tail
  fillPixelRect(ctx, tx + 2, ty + 4, 8, 12, secondaryFurColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, tx + 3, ty + 6, 6, 8, '#FFF5F8', pixelSize, offsetX, offsetY);

  // --- 5. FLOATING 3D PINK HEART (Reference #4 Left) ---
  if (showFloatingHeart) {
    const heartBob = Math.sin((animTick || 0) * 0.18) * 3;
    renderHDHeart(ctx, fx - 10, fy - 10 + heartBob, pixelSize, offsetX, offsetY);
  }
}

// --------------------------------------------------------------------
// Reusable HD Accessory Drawing Helpers
// --------------------------------------------------------------------

/**
 * HD 3D Pixel Heart with Specular Highlight & Soft Shadow
 */
function renderHDHeart(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  pixelSize: number,
  offsetX: number,
  offsetY: number
) {
  const heartMatrix = [
    [0, 1, 1, 0, 0, 1, 1, 0],
    [1, 3, 3, 1, 1, 2, 2, 1],
    [1, 3, 3, 2, 2, 2, 2, 1],
    [1, 2, 2, 2, 2, 2, 4, 1],
    [0, 1, 2, 2, 2, 4, 1, 0],
    [0, 0, 1, 2, 4, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0],
  ];

  const colors: Record<number, string> = {
    1: '#362E3B', // Outline
    2: '#FF2E7E', // Base Pink
    3: '#FFAEC8', // Specular Highlight
    4: '#D60D58', // Under Shadow
  };

  for (let r = 0; r < heartMatrix.length; r++) {
    for (let c = 0; c < heartMatrix[r].length; c++) {
      const val = heartMatrix[r][c];
      if (val > 0 && colors[val]) {
        setPixel(ctx, x + c, y + r, colors[val], pixelSize, offsetX, offsetY);
      }
    }
  }
}

/**
 * HD Ribbon Bow with Central Knot & Satin Creases
 */
function renderHDRibbon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  pixelSize: number,
  offsetX: number,
  offsetY: number,
  ribbonColor = '#FF85A1',
  outlineColor = '#362E3B'
) {
  const knotColor = adjustBrightness(ribbonColor, 20);
  const shadowColor = adjustBrightness(ribbonColor, -25);

  // Left Loop
  fillPixelRect(ctx, x - 4, y - 2, 4, 6, outlineColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, x - 3, y - 1, 3, 4, ribbonColor, pixelSize, offsetX, offsetY);
  setPixel(ctx, x - 2, y, knotColor, pixelSize, offsetX, offsetY);

  // Right Loop
  fillPixelRect(ctx, x + 4, y - 2, 4, 6, outlineColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, x + 4, y - 1, 3, 4, ribbonColor, pixelSize, offsetX, offsetY);
  setPixel(ctx, x + 5, y, knotColor, pixelSize, offsetX, offsetY);

  // Center Knot
  fillPixelRect(ctx, x - 1, y - 2, 5, 6, outlineColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, x, y - 1, 3, 4, knotColor, pixelSize, offsetX, offsetY);
  setPixel(ctx, x + 1, y, '#FFFFFF', pixelSize, offsetX, offsetY); // Knot specular

  // Ribbon Tails
  fillPixelRect(ctx, x - 2, y + 4, 2, 3, ribbonColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, x + 3, y + 4, 2, 3, shadowColor, pixelSize, offsetX, offsetY);
}

/**
 * HD Floating Zzz Sleep Letters
 */
function renderHDZzz(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  pixelSize: number,
  offsetX: number,
  offsetY: number
) {
  const zColor = '#FF85A1';
  // Small Z
  fillPixelRect(ctx, x + 4, y, 4, 1, zColor, pixelSize, offsetX, offsetY);
  setPixel(ctx, x + 6, y + 1, zColor, pixelSize, offsetX, offsetY);
  setPixel(ctx, x + 5, y + 2, zColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, x + 4, y + 3, 4, 1, zColor, pixelSize, offsetX, offsetY);

  // Big Z
  fillPixelRect(ctx, x, y - 6, 6, 1, zColor, pixelSize, offsetX, offsetY);
  setPixel(ctx, x + 4, y - 5, zColor, pixelSize, offsetX, offsetY);
  setPixel(ctx, x + 3, y - 4, zColor, pixelSize, offsetX, offsetY);
  setPixel(ctx, x + 2, y - 3, zColor, pixelSize, offsetX, offsetY);
  fillPixelRect(ctx, x, y - 2, 6, 1, zColor, pixelSize, offsetX, offsetY);
}

/**
 * Draw Curved Arc for Sleeping Eye
 */
function drawPixelArc(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  color: string,
  pixelSize: number,
  offsetX: number,
  offsetY: number
) {
  setPixel(ctx, x, y, color, pixelSize, offsetX, offsetY);
  for (let i = 1; i < width - 1; i++) {
    setPixel(ctx, x + i, y + 1, color, pixelSize, offsetX, offsetY);
  }
  setPixel(ctx, x + width - 1, y, color, pixelSize, offsetX, offsetY);
}

/**
 * ====================================================================
 * Main Entry: Draw HD Kawaii Pixel Sprite on HTML Canvas
 * ====================================================================
 */
export function drawKawaiiPixelSprite(
  canvas: HTMLCanvasElement,
  options: KawaiiSpriteOptions
): string {
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const width = canvas.width;
  const height = canvas.height;

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, width, height);

  // Background Backdrop Fill
  if (options.backdrop === 'dark') {
    ctx.fillStyle = '#1E2024'; // Match Reference 1-3
    ctx.fillRect(0, 0, width, height);
  } else if (options.backdrop === 'white') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  } else if (options.backdrop === 'cream') {
    ctx.fillStyle = '#FFF9F2';
    ctx.fillRect(0, 0, width, height);
  } else if (options.backdrop === 'lavender') {
    ctx.fillStyle = '#F5F0FF';
    ctx.fillRect(0, 0, width, height);
  }

  // Logical Grid Calculation: Default 64x64 HD
  const gridDim = options.gridResolution || 64;
  const pixelSize = Math.floor(Math.min(width, height) / gridDim);
  const offsetX = Math.floor((width / pixelSize - gridDim) / 2);
  const offsetY = Math.floor((height / pixelSize - gridDim) / 2);

  // Dispatch according to requested pose
  switch (options.pose) {
    case 'belly_up_heart':
      renderHDBellyUp(ctx, options, pixelSize, offsetX, offsetY);
      break;
    case 'sitting_cute':
      renderHDSittingCute(ctx, options, pixelSize, offsetX, offsetY);
      break;
    case 'sleeping_cushion':
      renderHDSleepingCushion(ctx, options, pixelSize, offsetX, offsetY);
      break;
    case 'fluffy_ribbon':
      renderHDFluffyRibbon(ctx, options, pixelSize, offsetX, offsetY);
      break;
    default:
      renderHDSittingCute(ctx, options, pixelSize, offsetX, offsetY);
      break;
  }

  return canvas.toDataURL('image/png');
}
