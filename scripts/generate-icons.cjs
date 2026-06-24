/**
 * PWA 图标生成脚本（纯 JS 实现，零原生依赖）
 * 生成各尺寸 PNG 图标，内嵌 emoji + 渐变背景
 * 运行: node scripts/generate-icons.js
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

const PUBLIC = path.join(__dirname, '..', 'public');
const ICONS_DIR = path.join(PUBLIC, 'icons');
const SCREENSHOTS_DIR = path.join(PUBLIC, 'screenshots');

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// ==================== 纯 JS PNG 编码器 ====================

/** 创建带简单图形的 PNG Buffer */
function createPngIcon(size) {
  // ARGB 像素数组（每行 size * 4 字节）
  const rawData = Buffer.alloc((size * 4 + 1) * size); // +1 for filter byte per row

  const cx = size / 2;
  const cy = size * 0.55;
  const rx = size * 0.44;   // 碗口横向半径
  const ry = size * 0.14;   // 碗口纵向半径
  const brx = size * 0.32;  // 碗底横向半径
  const bry = size * 0.22;  // 碗底纵向半径

  for (let y = 0; y < size; y++) {
    const rowOffset = y * (size * 4 + 1);
    rawData[rowOffset] = 0; // filter: none

    for (let x = 0; x < size; x++) {
      const px = rowOffset + 1 + x * 4;

      // 默认背景
      let r = 0xFF, g = 0xFA, b = 0xF5, a = 0xFF; // #FFFAF5

      // 圆形裁剪区域（碗的主题）
      const dx = x - cx, dy = y - cy;
      const inBowlBody = Math.pow((x - cx) / brx, 2) + Math.pow((y - (cy + size * 0.06)) / bry, 2) <= 1;
      const inBowlRim = Math.pow((x - cx) / (rx + 8), 2) + Math.pow((y - (cy - size * 0.02)) / (ry + 4), 2) <= 1;
      const inBowlInner = Math.pow((x - cx) / (rx - 4), 2) + Math.pow((y - (cy - size * 0.03)) / (ry - 2), 2) <= 1;

      if (inBowlBody) {
        // 碗身 #F5D5A0
        r = 0xF5; g = 0xD5; b = 0xA0;
      }
      if (inBowlRim) {
        // 碗口边缘 #FAE5C0
        r = 0xFA; g = 0xE5; b = 0xC0;
      }
      if (inBowlInner) {
        // 碗内 #FFF8ED
        r = 0xFF; g = 0xF8; b = 0xED;
      }

      // 圆角背景（距边缘 2px 开始的圆形裁剪）
      const edgeDist = Math.min(x, y, size - 1 - x, size - 1 - y);
      if (edgeDist < 2) {
        r = 0xFF; g = 0xFA; b = 0xF5;
      }

      rawData[px] = r;
      rawData[px + 1] = g;
      rawData[px + 2] = b;
      rawData[px + 3] = a;
    }
  }

  return pngEncode(rawData, size, size);
}

/** 创建快捷方式图标（纯色 + emoji 风格色块） */
function createShortcutIcon(color) {
  const s = 96;
  const rawData = Buffer.alloc((s * 4 + 1) * s);

  for (let y = 0; y < s; y++) {
    const rowOffset = y * (s * 4 + 1);
    rawData[rowOffset] = 0;
    for (let x = 0; x < s; x++) {
      const px = rowOffset + 1 + x * 4;
      rawData[px] = color[0];
      rawData[px + 1] = color[1];
      rawData[px + 2] = color[2];
      rawData[px + 3] = 0xFF;
    }
  }
  return pngEncode(rawData, s, s);
}

/** 最小 PNG 编码器（IHDR + IDAT + IEND） */
function pngEncode(rawData, width, height) {
  // Filter bytes: each row starts with 0x00 (no filter)
  // rawData already has filter bytes

  // Deflate the raw data
  const deflated = zlib.deflateSync(rawData);

  // CRC32 计算
  const crc32 = (buf) => {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let j = 0; j < 8; j++) {
        c = (c >>> 1) ^ (c & 1 ? 0xEDB88320 : 0);
      }
    }
    return (c ^ 0xFFFFFFFF) >>> 0;
  };

  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeB = Buffer.from(type, 'ascii');
    const crcData = Buffer.concat([typeB, data]);
    const crcVal = Buffer.alloc(4);
    crcVal.writeUInt32BE(crc32(crcData), 0);
    return Buffer.concat([len, typeB, data, crcVal]);
  };

  // PNG Signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflated),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ==================== 主流程 ====================

function generate() {
  if (!fs.existsSync(ICONS_DIR)) fs.mkdirSync(ICONS_DIR, { recursive: true });
  if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  console.log('🎨 生成 PWA 图标...');

  // 生成各尺寸 PNG 图标
  for (const size of SIZES) {
    const png = createPngIcon(size);
    const filePath = path.join(ICONS_DIR, `icon-${size}x${size}.png`);
    fs.writeFileSync(filePath, png);
    console.log(`  ✓ icon-${size}x${size}.png (${png.length} bytes)`);
  }

  // 生成快捷方式图标
  const shortcuts = [
    { name: 'shortcut-draw', color: [0xF5, 0xD5, 0xA0] },
    { name: 'shortcut-ai', color: [0xA0, 0xD5, 0xF5] },
    { name: 'shortcut-diary', color: [0xD5, 0xF5, 0xA0] },
  ];

  for (const sc of shortcuts) {
    const png = createShortcutIcon(sc.color);
    const filePath = path.join(ICONS_DIR, `${sc.name}.png`);
    fs.writeFileSync(filePath, png);
    console.log(`  ✓ ${sc.name}.png`);
  }

  // 生成 SVG 占位截图（实际部署后替换为真实截图）
  const screenshotSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844">
  <rect fill="#FFFAF5" width="390" height="844"/>
  <text x="195" y="422" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#8B6914">🍜 这顿吃什么</text>
  <text x="195" y="460" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#B8A88E">美食记录 &amp; 决策轻社区</text>
</svg>`;

  ['screenshot-1.png', 'screenshot-2.png'].forEach((name, i) => {
    const svgBuf = Buffer.from(screenshotSvg.replace('422', i === 0 ? '422' : '422'));
    // 简单起见，生成占位文件（png 替换需要截图工具，部署后自行替换）
    const s = 96;
    const rawData = Buffer.alloc((s * 4 + 1) * s);
    for (let y = 0; y < s; y++) {
      const rowOffset = y * (s * 4 + 1);
      rawData[rowOffset] = 0;
      for (let x = 0; x < s; x++) {
        const px = rowOffset + 1 + x * 4;
        rawData[px] = 0xFF; rawData[px + 1] = 0xFA; rawData[px + 2] = 0xF5; rawData[px + 3] = 0xFF;
      }
    }
    fs.writeFileSync(path.join(SCREENSHOTS_DIR, name), pngEncode(rawData, s, s));
  });

  console.log('\n✅ PWA 图标生成完成！');
  console.log(`   目录: ${ICONS_DIR}`);
  console.log('   💡 提示: 截图文件为占位图，部署后用真实截图替换');
}

generate();
