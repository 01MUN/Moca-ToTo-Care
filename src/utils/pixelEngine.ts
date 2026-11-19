// ====================================================================
// 🎨 Fluffy Days Pixel Art Generation & Processing Engine
// ====================================================================

export interface PixelPalette {
  id: string;
  name: string;
  colors: string[]; // Hex codes
}

export const PIXEL_PALETTES: PixelPalette[] = [
  {
    id: 'natural',
    name: '자연스러운 원본 (Natural)',
    colors: [], // Dynamic from image
  },
  {
    id: 'warm_fur',
    name: '포근한 털색 (Warm Fluffy)',
    colors: [
      '#1C110A', '#3C2317', '#5C3818', '#8B5E3C', '#B08968',
      '#DDB892', '#EDE0D4', '#FFF9F4', '#FF85A1', '#4A3E3D'
    ],
  },
  {
    id: 'kawaii_pastel',
    name: '파스텔 요정 (Kawaii Pastel)',
    colors: [
      '#3A3042', '#FF9AA2', '#FFB7B2', '#FFDAC1', '#E2F0CB',
      '#B5EAD7', '#C7CEEA', '#FFFFFF', '#6C5B7B', '#F8B195'
    ],
  },
  {
    id: 'gameboy',
    name: '8비트 게임보이 (GameBoy Retro)',
    colors: ['#0F380F', '#306230', '#8BAC0F', '#9BBC0F'],
  },
  {
    id: 'cyber_neon',
    name: '사이버 네온 (Cyber Neon)',
    colors: [
      '#0D0221', '#0F084B', '#26408B', '#0D0887', '#CC4678',
      '#F89441', '#F0F921', '#00F0FF', '#FF007F', '#FFFFFF'
    ],
  },
  {
    id: 'nes_retro',
    name: '패미컴 레트로 (NES 8-Bit)',
    colors: [
      '#000000', '#FCFCFC', '#BCBCBC', '#747474', '#002088',
      '#F83800', '#E45C10', '#AC7C00', '#00B800', '#00A844',
      '#008888', '#0000FC', '#6888FC', '#9878F8', '#F878F8',
      '#F85898', '#F8A4C0', '#F0D0B0', '#503000', '#881400'
    ],
  }
];

export interface PixelateOptions {
  gridSize: number; // e.g. 16, 24, 32, 48, 64
  paletteId: string;
  dithering: boolean;
  showGridLines: boolean;
  outlineEnhance: boolean;
  brightness: number; // -50 to 50
  contrast: number; // -50 to 50
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): RGB {
  const cleanHex = hex.replace('#', '');
  const bigint = parseInt(cleanHex, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function colorDistance(c1: RGB, c2: RGB): number {
  // Weighted Euclidean distance for human perception (Redmean color difference)
  const rmean = (c1.r + c2.r) / 2;
  const r = c1.r - c2.r;
  const g = c1.g - c2.g;
  const b = c1.b - c2.b;
  return Math.sqrt((((512 + rmean) * r * r) >> 8) + 4 * g * g + (((767 - rmean) * b * b) >> 8));
}

function findNearestColor(target: RGB, paletteRgb: RGB[]): RGB {
  if (paletteRgb.length === 0) return target;
  let minDistance = Infinity;
  let nearest = paletteRgb[0];

  for (const c of paletteRgb) {
    const dist = colorDistance(target, c);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = c;
    }
  }
  return nearest;
}

/**
 * Pixelates an image onto a target canvas with retro quantization and optional dithering
 */
export function processPixelArt(
  imageSource: HTMLImageElement | HTMLVideoElement,
  targetCanvas: HTMLCanvasElement,
  options: PixelateOptions
): string {
  const ctx = targetCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return '';

  const { gridSize, paletteId, dithering, showGridLines, outlineEnhance, brightness, contrast } = options;
  const width = targetCanvas.width;
  const height = targetCanvas.height;

  // Step 1: Create a tiny low-res offscreen canvas
  const offscreen = document.createElement('canvas');
  offscreen.width = gridSize;
  offscreen.height = gridSize;
  const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
  if (!offCtx) return '';

  // Draw source image into tiny canvas (downsampling)
  offCtx.imageSmoothingEnabled = true;
  offCtx.drawImage(imageSource, 0, 0, gridSize, gridSize);

  // Step 2: Read low-res pixel data
  const imgData = offCtx.getImageData(0, 0, gridSize, gridSize);
  const data = imgData.data;

  // Prepare Palette
  const selectedPalette = PIXEL_PALETTES.find((p) => p.id === paletteId) || PIXEL_PALETTES[0];
  const paletteRgb = selectedPalette.colors.map(hexToRgb);

  // Contrast & Brightness lookup adjustments
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  // Step 3: Color Quantization + Floyd-Steinberg Dithering
  // Create 2D floating buffer for dithering error diffusion
  const rBuf: number[][] = [];
  const gBuf: number[][] = [];
  const bBuf: number[][] = [];

  for (let y = 0; y < gridSize; y++) {
    rBuf[y] = [];
    gBuf[y] = [];
    bBuf[y] = [];
    for (let x = 0; x < gridSize; x++) {
      const idx = (y * gridSize + x) * 4;
      let r = data[idx];
      let g = data[idx + 1];
      let b = data[idx + 2];

      // Apply brightness & contrast
      r = Math.min(255, Math.max(0, factor * (r - 128) + 128 + brightness));
      g = Math.min(255, Math.max(0, factor * (g - 128) + 128 + brightness));
      b = Math.min(255, Math.max(0, factor * (b - 128) + 128 + brightness));

      rBuf[y][x] = r;
      gBuf[y][x] = g;
      bBuf[y][x] = b;
    }
  }

  // Result pixel grid (gridSize x gridSize)
  const finalPixels: RGB[][] = [];

  for (let y = 0; y < gridSize; y++) {
    finalPixels[y] = [];
    for (let x = 0; x < gridSize; x++) {
      const oldR = Math.min(255, Math.max(0, rBuf[y][x]));
      const oldG = Math.min(255, Math.max(0, gBuf[y][x]));
      const oldB = Math.min(255, Math.max(0, bBuf[y][x]));

      let newColor: RGB;
      if (paletteRgb.length > 0) {
        newColor = findNearestColor({ r: oldR, g: oldG, b: oldB }, paletteRgb);
      } else {
        // Natural posterization: quantize to 16-level steps
        const step = 24;
        newColor = {
          r: Math.round(oldR / step) * step,
          g: Math.round(oldG / step) * step,
          b: Math.round(oldB / step) * step,
        };
      }

      finalPixels[y][x] = newColor;

      if (dithering && paletteRgb.length > 0) {
        const errR = oldR - newColor.r;
        const errG = oldG - newColor.g;
        const errB = oldB - newColor.b;

        // Distribute error to neighbors (Floyd-Steinberg coefficients)
        if (x + 1 < gridSize) {
          rBuf[y][x + 1] += (errR * 7) / 16;
          gBuf[y][x + 1] += (errG * 7) / 16;
          bBuf[y][x + 1] += (errB * 7) / 16;
        }
        if (x - 1 >= 0 && y + 1 < gridSize) {
          rBuf[y + 1][x - 1] += (errR * 3) / 16;
          gBuf[y + 1][x - 1] += (errG * 3) / 16;
          bBuf[y + 1][x - 1] += (errB * 3) / 16;
        }
        if (y + 1 < gridSize) {
          rBuf[y + 1][x] += (errR * 5) / 16;
          gBuf[y + 1][x] += (errG * 5) / 16;
          bBuf[y + 1][x] += (errB * 5) / 16;
        }
        if (x + 1 < gridSize && y + 1 < gridSize) {
          rBuf[y + 1][x + 1] += (errR * 1) / 16;
          gBuf[y + 1][x + 1] += (errG * 1) / 16;
          bBuf[y + 1][x + 1] += (errB * 1) / 16;
        }
      }
    }
  }

  // Optional: Outline Enhance
  if (outlineEnhance) {
    for (let y = 1; y < gridSize - 1; y++) {
      for (let x = 1; x < gridSize - 1; x++) {
        const curr = finalPixels[y][x];
        const right = finalPixels[y][x + 1];
        const bottom = finalPixels[y + 1][x];
        const diffR = Math.abs(curr.r - right.r) + Math.abs(curr.r - bottom.r);
        const diffG = Math.abs(curr.g - right.g) + Math.abs(curr.g - bottom.g);
        const diffB = Math.abs(curr.b - right.b) + Math.abs(curr.b - bottom.b);

        if (diffR + diffG + diffB > 180) {
          // Darken edge pixel
          finalPixels[y][x] = {
            r: Math.floor(curr.r * 0.4),
            g: Math.floor(curr.g * 0.4),
            b: Math.floor(curr.b * 0.4),
          };
        }
      }
    }
  }

  // Step 4: Render crisp scaled pixels onto target canvas
  ctx.clearRect(0, 0, width, height);
  const cellWidth = width / gridSize;
  const cellHeight = height / gridSize;

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const p = finalPixels[y][x];
      ctx.fillStyle = `rgb(${p.r}, ${p.g}, ${p.b})`;
      ctx.fillRect(Math.floor(x * cellWidth), Math.floor(y * cellHeight), Math.ceil(cellWidth), Math.ceil(cellHeight));
    }
  }

  // Step 5: Optional retro grid lines overlay
  if (showGridLines) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= gridSize; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellWidth, 0);
      ctx.lineTo(i * cellWidth, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * cellHeight);
      ctx.lineTo(width, i * cellHeight);
      ctx.stroke();
    }
  }

  return targetCanvas.toDataURL('image/png');
}
