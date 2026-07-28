// st.winter0.workers.dev — RPG/VN 상태창 (SVG 이미지 출력)
// ?t=vn / ?t=vn2 / ?t=dark / ?t=pixel / ?t=ending / ?t=rpg2k / ?t=choice / ?t=dungeon / ?t=mmo / ?t=reward / ?t=gameover / ?t=inv

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function safeInt(v, fallback = 0, min = 0, max = 100) {
  const n = parseInt(v);
  if (isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

// ════════════════════════════════════════════
//  VN (미연시)
//  &chars=이름§호감도§속마음§기억|...
//  &my=체력§스트레스§정신력§피로도§발정도
//  &date=날짜(YYYY-MM-DD면 요일자동) &time=HH:MM(선택) &title=제목
// ════════════════════════════════════════════

function hearts(val, bgColor = '#1e1525') {
  const h = Math.round(val / 20);
  // 빈 하트도 ♥ 글리프로 통일 (크기 일치), fill만 배경색으로 → 안 보이게
  return `<tspan fill="#BB6688">${'♥'.repeat(h)}</tspan><tspan fill="${bgColor}">${'♥'.repeat(5-h)}</tspan>`;
}

// ════════════════════════════════════════════
//  통일 등급 시스템 (rarity) — 모든 라우트 공용
//  6단계: legend / epic / rare / uncommon / common / cursed
//  한글/영문 alias 자동 매핑
// ════════════════════════════════════════════
function normalizeRarity(g) {
  const s = (g || '').toString().trim().toLowerCase();
  if (['legend', '전설'].includes(s)) return 'legend';
  if (['epic', '에픽', '유니크', '영웅'].includes(s)) return 'epic';
  if (['rare', '레어', '희귀'].includes(s)) return 'rare';
  if (['uncommon', '언커먼', '매직', '고급'].includes(s)) return 'uncommon';
  if (['common', '일반', '노멀'].includes(s)) return 'common';
  if (['cursed', '저주', '저주받은'].includes(s)) return 'cursed';
  return 'common';
}
const RARITY_COLOR = {
  legend:   '#CCAA88',
  epic:     '#884499',
  rare:     '#8888CC',
  uncommon: '#BB6688',
  common:   '#7a7a90',
  cursed:   '#EE1166',
};
function rarityColor(g) {
  return RARITY_COLOR[normalizeRarity(g)];
}

// ════════════════════════════════════════════
//  장비 슬롯 아이콘 (검/갑옷/반지) — SVG path
//  슬롯 종류 자동 인식 (WEAPON/ARMOR/ACC* 또는 한글)
//  scale로 사이즈 조정 (stroke 두께 자동 보정)
// ════════════════════════════════════════════
function equipIcon(slot, color, x, y, scale) {
  scale = scale || 1;
  const t = `translate(${x},${y}) scale(${scale})`;
  const sw = (2 / scale).toFixed(2);
  const s = (slot || '').toString().toUpperCase();
  if (s.includes('WEAPON') || s === '무기') {
    return `<g transform="${t}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" fill="none">`
      + `<line x1="11" y1="5" x2="11" y2="14"/>`
      + `<line x1="7" y1="14" x2="15" y2="14"/>`
      + `<line x1="11" y1="14" x2="11" y2="20"/>`
      + `<circle cx="11" cy="21" r="1.5" fill="${color}"/>`
      + `</g>`;
  }
  if (s.includes('ARMOR') || s === '방어구') {
    return `<path transform="${t}" d="M11 5 L18 8 L18 14 Q18 19 11 22 Q4 19 4 14 L4 8 Z" stroke="${color}" stroke-width="${sw}" stroke-linejoin="round" fill="none"/>`;
  }
  if (s.includes('ACC') || s === '장신구' || s === '악세서리') {
    return `<g transform="${t}" stroke="${color}" stroke-width="${sw}" fill="none">`
      + `<circle cx="11" cy="16" r="4"/>`
      + `<polygon points="11,6 14,10 11,13 8,10" fill="${color}"/>`
      + `</g>`;
  }
  return '';
}

// 날짜 포맷: YYYY-MM-DD 패턴이면 자동으로 요일 붙임. 아니면 원문 유지.
// time이 HH:MM 패턴이면 " · HH:MM"으로 뒤에 붙임.
function formatVNDate(rawDate, rawTime) {
  const DOW = ['일', '월', '화', '수', '목', '금', '토'];
  let out;
  const dateStr = rawDate || '';
  const m = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) {
    const y = parseInt(m[1]), mo = parseInt(m[2]), d = parseInt(m[3]);
    const dt = new Date(Date.UTC(y, mo - 1, d));
    // 유효 날짜 검증 (예: 2026-02-31 같은 거 걸러냄)
    if (dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d) {
      const mm = String(mo).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      out = `${y}.${mm}.${dd} (${DOW[dt.getUTCDay()]})`;
    } else {
      out = dateStr; // 잘못된 날짜면 원문 그대로
    }
  } else {
    out = dateStr || '○월 ○일';
  }
  if (rawTime) {
    const t = rawTime.match(/^(\d{1,2}):(\d{2})$/);
    if (t) {
      const hour = parseInt(t[1]), min = parseInt(t[2]);
      if (hour >= 0 && hour <= 23 && min >= 0 && min <= 59) {
        out += ` · ${String(hour).padStart(2, '0')}:${t[2]}`;
      }
    }
  }
  return out;
}

// 생일 파싱 + 오늘과 비교
// rawBday: "MM-DD" 또는 "M-D" 형식
// currentDate: "YYYY-MM-DD" (params.get('date'))
// 반환: { display: "M/D", isBirthday: boolean } 또는 null
function parseBirthday(rawBday, currentDate) {
  if (!rawBday) return null;
  const m = String(rawBday).trim().match(/^(\d{1,2})-(\d{1,2})$/);
  if (!m) return null;
  const mo = parseInt(m[1]), d = parseInt(m[2]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  let isBirthday = false;
  if (currentDate) {
    const cm = String(currentDate).match(/^\d{4}-(\d{1,2})-(\d{1,2})$/);
    if (cm) isBirthday = parseInt(cm[1]) === mo && parseInt(cm[2]) === d;
  }
  return { display: `${mo}/${d}`, isBirthday };
}

// ──── 생일 당일 애니메이션 헬퍼 ────
// B: 카드 stroke 색 사이클 (#FF6699 ↔ #FFAABB, 무한)
function bdayStrokeAnim() {
  return `<animate attributeName="stroke" values="#FF6699;#FFAABB;#FF6699" dur="2s" repeatCount="indefinite"/>`;
}

// A: 🎂 이모지 좌우 흔들림 (rotate -12 ↔ 12, 무한)
// dir: 'left' | 'right' (좌우 케이크가 반대 방향으로 흔들림)
function bdayCake(cx, cy, size, dir) {
  const vals = dir === 'left' ? '-12;12;-12' : '12;-12;12';
  return `<g transform="translate(${cx} ${cy})">
<text font-size="${size}" text-anchor="middle" dominant-baseline="middle" fill="#fff">🎂</text>
<animateTransform attributeName="transform" type="rotate" additive="sum" values="${vals}" dur="1.2s" repeatCount="indefinite"/>
</g>`;
}

// C: BIRTHDAY 텍스트 깜빡임 (1회만)
function bdayBlinkAnim() {
  return `<animate attributeName="opacity" values="1;0.3;1;0.3;1;0.3;1" dur="1.4s" repeatCount="1" fill="freeze"/>`;
}

// D: Floating 이모지 (1회, 위로 떠오르며 사라짐 — RPG reward legend 스타일)
// 카드 하단에서 시작 → 약 50px 위로 이동 + opacity fade out
function bdaySparkles(x, y, w, h) {
  const items = [
    { text: '🎉', delay: 0.2, sx: w*0.20 },
    { text: '🎁', delay: 0.7, sx: w*0.50 },
    { text: '✨', delay: 1.2, sx: w*0.80 },
    { text: '🎂', delay: 1.7, sx: w*0.35 },
    { text: '🎉', delay: 2.2, sx: w*0.65 },
  ];
  const startY = y + h - 30;
  const rise = 55;
  return items.map(item => {
    const sx = x + item.sx;
    return `<text x="${sx}" y="${startY}" font-size="16" text-anchor="middle" opacity="0">${item.text}<animate attributeName="y" from="${startY}" to="${startY - rise}" dur="1.6s" begin="${item.delay}s" fill="freeze"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.2;0.75;1" dur="1.6s" begin="${item.delay}s" fill="freeze"/></text>`;
  }).join('');
}


function barColor(type, val) {
  if (type === 'af') {
    if (val < 20) return '#cc3355';
    if (val < 40) return '#BB6688';
    return '#DDAACC';
  }
  if (type === 'stress' || type === 'fatigue' || type === 'arousal') {
    if (val > 80) return '#EE1166';
    if (val > 60) return '#FF7722';
    return '#BB6688';
  }
  if (type === 'hp') {
    if (val < 20) return '#EE1166';
    if (val < 40) return '#FF7722';
    return '#DDAACC';
  }
  if (type === 'mental') {
    if (val < 30) return '#884499';
    return '#8888CC';
  }
  return '#CCAA88';
}

function renderBar(x, y, w, h, val, type) {
  const filled = Math.round((val / 100) * w);
  const col = barColor(type, val);
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#1a1018"/>
<rect x="${x}" y="${y}" width="${filled}" height="${h}" rx="3" fill="${col}"/>
<rect x="${x}" y="${y}" width="${filled}" height="${Math.floor(h/2)}" rx="3" fill="rgba(255,255,255,0.08)"/>`;
}

function renderCharCard(char, y, W, currentDate) {
  const PAD = 18;
  const cardH = 115;
  const parts = char.split('§');
  const rawName = parts[0];
  const name = rawName?.trim() || '???';
  const isLocked = name === '???' || !rawName?.trim();
  const af = safeInt(parts[1], 0);
  const mood = esc((parts[2] || '').trim());
  const mem = esc((parts[3] || '').trim());
  const bday = parseBirthday(parts[4], currentDate);
  const barX = PAD + 100;
  const barW = W - barX - PAD - 50;
  const isBday = bday?.isBirthday && !isLocked;

  // 생일 당일이면 카드 stroke / fill 강조
  const cardStroke = isBday ? '#FF6699' : (isLocked ? '#2a2030' : '#3a2a48');
  const cardFill = isBday ? '#241420' : (isLocked ? '#150f18' : '#1e1525');
  const strokeW = isBday ? '1.5' : '1';

  // 카드 rect (B: stroke 사이클 애니메이션)
  let cardRect;
  if (isBday) {
    cardRect = `<rect x="${PAD}" y="${y}" width="${W - PAD * 2}" height="${cardH}" rx="5" fill="${cardFill}" stroke="${cardStroke}" stroke-width="${strokeW}">${bdayStrokeAnim()}</rect>`;
  } else {
    cardRect = `<rect x="${PAD}" y="${y}" width="${W - PAD * 2}" height="${cardH}" rx="5" fill="${cardFill}" stroke="${cardStroke}" stroke-width="${strokeW}"/>`;
  }

  // 생일 라벨 (이름 옆 우측)
  let bdaySVG = '';
  if (bday && !isLocked) {
    if (isBday) {
      // C: 텍스트 깜빡임 (1회) + A: 🎂 흔들림
      bdaySVG = `<text x="${W - PAD - 26}" y="${y + 28}" font-family="monospace" font-size="11" font-weight="bold" fill="#FF6699" text-anchor="end" letter-spacing="1">BIRTHDAY ${bday.display}${bdayBlinkAnim()}</text>
${bdayCake(W - PAD - 12, y + 24, 13, 'right')}`;
    } else {
      bdaySVG = `<text x="${W - PAD - 6}" y="${y + 28}" font-family="monospace" font-size="10"
  fill="#8070a0" text-anchor="end">🎂 ${bday.display}</text>`;
    }
  }

  // D: sparkle (생일 당일만, 1회)
  const sparkles = isBday ? bdaySparkles(PAD, y, W - PAD*2, cardH) : '';

  return `${cardRect}
<text x="${PAD + 14}" y="${y + 28}" font-family="'Noto Serif KR',Georgia,serif"
  font-size="17" font-weight="bold" fill="${isLocked ? '#4a3a55' : '#f0e0f5'}"
  ${isLocked ? 'filter="url(#blur)"' : ''}>${esc(name)}</text>
${bdaySVG}
<text x="${PAD + 14}" y="${y + 52}" font-family="monospace" font-size="11" font-weight="bold"
  fill="${isLocked ? '#3a2a45' : '#b090c8'}" letter-spacing="1">AFFECTION</text>
${isLocked
  ? `<rect x="${barX}" y="${y + 42}" width="${barW}" height="9" rx="3" fill="#1a1018"/>
<text x="${barX + barW/2}" y="${y + 51}" font-family="monospace" font-size="10" font-weight="bold" fill="#3a2a45" text-anchor="middle">— LOCKED —</text>`
  : renderBar(barX, y + 42, barW, 9, af, 'af')
}
${isLocked ? '' : `<text x="${W - PAD - 6}" y="${y + 51}" font-family="monospace" font-size="12" font-weight="bold"
  fill="#DDAACC" text-anchor="end">${af}</text>
<text x="${PAD + 14}" y="${y + 72}" font-family="monospace" font-size="13"
  letter-spacing="2">${hearts(af, cardFill)}</text>`}
${mood && !isLocked ? `<text x="${PAD + 14}" y="${y + 92}" font-family="'Noto Serif KR',Georgia,serif"
  font-size="12" fill="#b090c8" font-style="italic">" ${mood.length > 16 ? mood.slice(0, 16) + '…' : mood} "</text>` : ''}
${mem && !isLocked ? `<text x="${W - PAD - 10}" y="${y + 92}" font-family="'Noto Serif KR',Georgia,serif"
  font-size="11" fill="#8070a0" text-anchor="end">📎 ${mem.length > 12 ? mem.slice(0, 12) + '…' : mem}</text>` : ''}
${isLocked ? `<text x="${W/2}" y="${y + 74}" font-family="monospace" font-size="14" font-weight="bold"
  fill="#3a2a45" text-anchor="middle">🔒 미해금</text>` : ''}
${sparkles}`;
}

function renderMyStatus(my, y, W) {
  const PAD = 18;
  const parts = (my || '100§0§100§0§0').split('§');
  const items = [
    { label: '체력',    val: safeInt(parts[0], 100), type: 'hp',      icon: '💗' },
    { label: '스트레스', val: safeInt(parts[1], 0),   type: 'stress',  icon: '😰' },
    { label: '정신력',   val: safeInt(parts[2], 100), type: 'mental',  icon: '🌸' },
    { label: '피로도',   val: safeInt(parts[3], 0),   type: 'fatigue', icon: '😴' },
    { label: '발정도',   val: safeInt(parts[4], 0),   type: 'arousal', icon: '🔥' },
  ];
  const labelX = PAD + 14;
  const barX = PAD + 100;
  const barW = W - barX - PAD - 40;
  const rowH = 30;
  const totalH = 26 + items.length * rowH + 16;

  let svg = `<rect x="${PAD}" y="${y}" width="${W - PAD * 2}" height="${totalH}" rx="5"
  fill="#160e1c" stroke="#2a2035" stroke-width="1"/>
<text x="${labelX}" y="${y + 18}" font-family="monospace" font-size="10" font-weight="bold"
  fill="#8070a0" letter-spacing="2">MY STATUS</text>`;

  items.forEach((item, i) => {
    const iy = y + 28 + i * rowH;
    svg += `<text x="${labelX}" y="${iy + 15}" font-family="'Noto Serif KR',Georgia,serif"
  font-size="14" font-weight="bold" fill="#a888c0">${item.icon} ${item.label}</text>
${renderBar(barX, iy + 4, barW, 9, item.val, item.type)}
<text x="${W - PAD - 6}" y="${iy + 15}" font-family="monospace" font-size="12" font-weight="bold"
  fill="${barColor(item.type, item.val)}" text-anchor="end">${item.val}</text>`;
  });
  return { svg, height: totalH };
}

function renderVN(params) {
  const W = 470;
  const PAD = 18;
  const rawChars = params.get('chars') || '???§0§§';
  const rawMy = params.get('my') || '100§0§100§0§0';
  const rawDate = params.get('date');
  const date = esc(formatVNDate(rawDate, params.get('time')));
  const title = esc(params.get('title') || 'RELATIONSHIP STATUS');
  const chars = rawChars.split('|').slice(0, 6);

  const HEADER_H = 64, CARD_H = 115, MY_LABEL_H = 28;
  const MY_H = 26 + 5 * 30 + 16;
  const FOOTER_H = 10;
  const TOTAL_H = HEADER_H + chars.length * CARD_H + MY_LABEL_H + MY_H + FOOTER_H;

  let cardsY = HEADER_H;
  let cardsSVG = '';
  chars.forEach(char => { cardsSVG += renderCharCard(char, cardsY, W, rawDate); cardsY += CARD_H; });

  const myY = cardsY + MY_LABEL_H;
  const { svg: mySVG } = renderMyStatus(rawMy, myY, W);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${TOTAL_H}" viewBox="0 0 ${W} ${TOTAL_H}">
<defs>
  <filter id="blur"><feGaussianBlur stdDeviation="2"/></filter>
  <pattern id="deco" width="18" height="6" patternUnits="userSpaceOnUse">
    <rect width="8" height="6" fill="#DDAACC" opacity="0.35"/>
    <rect x="8" width="2" height="6" fill="#BB6688" opacity="0.3"/>
  </pattern>
</defs>
<rect width="${W}" height="${TOTAL_H}" fill="#110d16"/>
<rect width="${W}" height="${TOTAL_H}" fill="url(#deco)" opacity="0.06"/>
<rect x="1" y="1" width="${W-2}" height="${TOTAL_H-2}" rx="6" fill="none" stroke="#3a2a48" stroke-width="1"/>
<path d="M1 20 L1 6 Q1 1 6 1 L20 1" fill="none" stroke="#DDAACC" stroke-width="1.5" opacity="0.6"/>
<path d="M${W-1} 20 L${W-1} 6 Q${W-1} 1 ${W-6} 1 L${W-20} 1" fill="none" stroke="#DDAACC" stroke-width="1.5" opacity="0.6"/>
<path d="M1 ${TOTAL_H-20} L1 ${TOTAL_H-6} Q1 ${TOTAL_H-1} 6 ${TOTAL_H-1} L20 ${TOTAL_H-1}" fill="none" stroke="#DDAACC" stroke-width="1.5" opacity="0.6"/>
<path d="M${W-1} ${TOTAL_H-20} L${W-1} ${TOTAL_H-6} Q${W-1} ${TOTAL_H-1} ${W-6} ${TOTAL_H-1} L${W-20} ${TOTAL_H-1}" fill="none" stroke="#DDAACC" stroke-width="1.5" opacity="0.6"/>
<rect x="0" y="0" width="${W}" height="${HEADER_H}" rx="6" fill="#160e1e"/>
<rect x="0" y="${HEADER_H - 1}" width="${W}" height="1" fill="#2a2035"/>
<text x="${W/2}" y="24" font-family="monospace" font-size="10" font-weight="bold" fill="#8070a0" letter-spacing="3" text-anchor="middle">✦ ${title} ✦</text>
<text x="${W/2}" y="48" font-family="'Noto Serif KR',Georgia,serif" font-size="15" font-weight="bold" fill="#BB6688" text-anchor="middle" font-style="italic">${date}</text>
<line x1="${PAD*2}" y1="56" x2="${W - PAD*2}" y2="56" stroke="#2a1a30" stroke-width="0.5"/>
${cardsSVG}
<text x="${PAD}" y="${myY - 8}" font-family="monospace" font-size="10" font-weight="bold" fill="#5a4068" letter-spacing="2">— MY STATUS —</text>
${mySVG}
</svg>`;
}

// ════════════════════════════════════════════
//  VN2 (미연시 — 풍부한 정보 카드, 1~6명 자동 레이아웃)
//  &chars=이름§호감도§기분§체력§정신력§발정도§진척도§관계횟수§속마음§기억|...
//  &date=YYYY-MM-DD &time=HH:MM &title=제목
//  레이아웃: 1명→와이드 / 2명→2등분 / 3명→3등분 / 4명→2x2 / 5명→3+2 중앙 / 6명→3x2
//  색 변화: 호감도 ≤20 회색·≥80 진핑크 / 체력 ≤20 빨강 / 정신력 ≤20 진파랑 / 발정도 ≥80 강렬핑크
// ════════════════════════════════════════════

function vn2BarColor(type, val) {
  if (type === 'af') {
    if (val <= 20) return '#888888';
    if (val >= 80) return '#EE1166';
    return '#FF6699';
  }
  if (type === 'hp')      { if (val <= 20) return '#EE1166'; return '#BB6688'; }
  if (type === 'mental')  { if (val <= 20) return '#0077DD'; return '#8888CC'; }
  if (type === 'arousal') { if (val >= 80) return '#EE1166'; return '#884499'; }
  return '#CCAA88';
}

function vn2Bar(x, y, w, h, val, type) {
  const filled = Math.round((val / 100) * w);
  const col = vn2BarColor(type, val);
  const r = Math.min(h / 2, 3);
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="#1a1018"/>
<rect x="${x}" y="${y}" width="${filled}" height="${h}" rx="${r}" fill="${col}"/>
<rect x="${x}" y="${y}" width="${filled}" height="${Math.floor(h/2)}" rx="${r}" fill="rgba(255,255,255,0.08)"/>`;
}

function vn2ParseChar(char, currentDate) {
  const parts = char.split('§');
  const rawName = parts[0];
  const name = rawName?.trim() || '???';
  return {
    name, isLocked: name === '???' || !rawName?.trim(),
    af:       safeInt(parts[1], 0),
    mood:     esc((parts[2] || '').trim()),
    hp:       safeInt(parts[3], 100),
    mental:   safeInt(parts[4], 100),
    arousal:  safeInt(parts[5], 0),
    progress: esc((parts[6] || '').trim()),
    count:    safeInt(parts[7], 0, 0, 9999),
    heart:    esc((parts[8] || '').trim()),
    mem:      esc((parts[9] || '').trim()),
    bday:     parseBirthday(parts[10], currentDate),
  };
}

// vn2 카드 stroke / fill 결정 (생일 당일이면 강조)
function vn2CardStroke(c) {
  if (c.isLocked) return { stroke: '#2a2030', fill: '#150f18', w: '1' };
  if (c.bday?.isBirthday) return { stroke: '#FF6699', fill: '#241420', w: '1.5' };
  return { stroke: '#3a2a48', fill: '#1e1525', w: '1' };
}

// 생일 당일이면 카드 상단에 가로 banner 렌더
function vn2BirthdayBanner(c, x, y, w, size) {
  if (!c.bday?.isBirthday || c.isLocked) return '';
  const bh = size === 'wide' ? 18 : (size === 'medium' ? 16 : 14);
  const fs = size === 'wide' ? 11 : (size === 'medium' ? 10 : 9);
  const cx = x + w/2;
  const cy = y + bh/2 + 2;  // 텍스트 baseline 보정
  // 케이크 위치: BIRTHDAY MM/DD 문구 폭에 맞춰 양쪽 배치
  const halfWidth = size === 'wide' ? 75 : (size === 'medium' ? 60 : 48);
  const leftX = cx - halfWidth;
  const rightX = cx + halfWidth;
  return `<rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="${bh}" rx="3" fill="#FF6699"/>
<text x="${cx}" y="${y + bh/2 + 5}" font-family="monospace" font-size="${fs}" font-weight="bold" fill="#fff" text-anchor="middle" letter-spacing="1">BIRTHDAY ${c.bday.display}${bdayBlinkAnim()}</text>
${bdayCake(leftX, cy + 3, fs, 'left')}
${bdayCake(rightX, cy + 3, fs, 'right')}`;
}

// 평소 모드: 카드 footer 우측에 생일 라벨 (모든 카드 사이즈 통일)
// 당일이 아닐 때만 표시
function vn2BirthdayLabel(c, x, y, w, size) {
  if (!c.bday || c.bday.isBirthday || c.isLocked) return '';
  let footerY, fs;
  if (size === 'wide') { footerY = y + 226; fs = 11; }
  else if (size === 'medium') { footerY = y + 192; fs = 10; }
  else { footerY = y + 200; fs = 9; }  // small
  const margin = size === 'small' ? 10 : 12;
  return `<text x="${x + w - margin}" y="${footerY}" font-family="monospace" font-size="${fs}" font-weight="600" fill="#9080a8" text-anchor="end">🎂 ${c.bday.display}</text>`;
}

// 작은 카드 (143px 폭) — 3명 이상일 때
function vn2CardSmall(char, x, y, w, currentDate) {
  const c = vn2ParseChar(char, currentDate);
  const PAD = 10;
  if (c.isLocked) {
    return `<rect x="${x}" y="${y}" width="${w}" height="235" rx="5" fill="#150f18" stroke="#2a2030" stroke-width="1"/>
<text x="${x + w/2}" y="${y + 235/2 - 5}" font-family="'Noto Serif KR'" font-size="38" font-weight="bold" fill="#3a2a45" text-anchor="middle" filter="url(#vn2blur)">???</text>
<text x="${x + w/2}" y="${y + 235/2 + 30}" font-family="monospace" font-size="11" font-weight="bold" fill="#3a2a45" text-anchor="middle">🔒 미해금</text>`;
  }
  const s = vn2CardStroke(c);
  const bdayBanner = c.bday?.isBirthday;
  const off = bdayBanner ? 14 : 0;
  const cardH = 235 + off;
  const barX = x + PAD, barW = w - PAD*2;
  // B: stroke 애니메이션 (생일 당일만)
  let svg = bdayBanner
    ? `<rect x="${x}" y="${y}" width="${w}" height="${cardH}" rx="5" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.w}">${bdayStrokeAnim()}</rect>`
    : `<rect x="${x}" y="${y}" width="${w}" height="${cardH}" rx="5" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.w}"/>`;
  svg += vn2BirthdayBanner(c, x, y, w, 'small');
  svg += `<text x="${x + PAD}" y="${y + 20 + off}" font-family="'Noto Serif KR'" font-size="14" font-weight="bold" fill="#f0e0f5">${esc(c.name)}</text>`;
  if (c.mood) svg += `<text x="${x + w - PAD}" y="${y + 20 + off}" font-family="monospace" font-size="9" fill="#b090c8" text-anchor="end">${c.mood.length > 4 ? c.mood.slice(0,4) : c.mood}</text>`;
  if (c.progress) svg += `<text x="${x + PAD}" y="${y + 36 + off}" font-family="'Noto Serif KR'" font-size="10" fill="#FF6699" font-style="italic">${c.progress.length > 8 ? c.progress.slice(0,8) + '…' : c.progress}</text>`;
  svg += `<text x="${x + w - PAD}" y="${y + 36 + off}" font-family="monospace" font-size="9" fill="#8070a0" text-anchor="end">× ${c.count}회</text>`;
  svg += `<text x="${x + PAD}" y="${y + 58 + off}" font-family="monospace" font-size="9" fill="#8070a0" font-weight="600" letter-spacing="1">호감도</text>`;
  svg += `<text x="${x + w - PAD}" y="${y + 58 + off}" font-family="monospace" font-size="10" font-weight="bold" fill="${vn2BarColor('af', c.af)}" text-anchor="end">${c.af}</text>`;
  svg += vn2Bar(barX, y + 62 + off, barW, 7, c.af, 'af');
  svg += `<text x="${x + PAD}" y="${y + 84 + off}" font-family="monospace" font-size="9" fill="#8070a0" font-weight="600">체력</text>`;
  svg += `<text x="${x + w - PAD}" y="${y + 84 + off}" font-family="monospace" font-size="9" font-weight="bold" fill="${vn2BarColor('hp', c.hp)}" text-anchor="end">${c.hp}</text>`;
  svg += vn2Bar(barX, y + 88 + off, barW, 5, c.hp, 'hp');
  svg += `<text x="${x + PAD}" y="${y + 106 + off}" font-family="monospace" font-size="9" fill="#8070a0" font-weight="600">정신력</text>`;
  svg += `<text x="${x + w - PAD}" y="${y + 106 + off}" font-family="monospace" font-size="9" font-weight="bold" fill="${vn2BarColor('mental', c.mental)}" text-anchor="end">${c.mental}</text>`;
  svg += vn2Bar(barX, y + 110 + off, barW, 5, c.mental, 'mental');
  svg += `<text x="${x + PAD}" y="${y + 128 + off}" font-family="monospace" font-size="9" fill="#8070a0" font-weight="600">발정도</text>`;
  svg += `<text x="${x + w - PAD}" y="${y + 128 + off}" font-family="monospace" font-size="9" font-weight="bold" fill="${vn2BarColor('arousal', c.arousal)}" text-anchor="end">${c.arousal}</text>`;
  svg += vn2Bar(barX, y + 132 + off, barW, 5, c.arousal, 'arousal');
  if (c.heart) svg += `<text x="${x + PAD}" y="${y + 165 + off}" font-family="'Noto Serif KR'" font-size="11" fill="#b090c8" font-style="italic">" ${c.heart.length > 12 ? c.heart.slice(0,12) + '…' : c.heart} "</text>`;
  if (c.mem) svg += `<text x="${x + PAD}" y="${y + 200 + off}" font-family="'Noto Serif KR'" font-size="10" fill="#8070a0">📎 ${c.mem.length > 12 ? c.mem.slice(0,12) + '…' : c.mem}</text>`;
  // 평소 모드 생일 라벨 (footer 우측)
  if (!bdayBanner) svg += vn2BirthdayLabel(c, x, y + off, w, 'small');
  // D: floating 이모지 (생일 당일만, 1회)
  if (bdayBanner) svg += bdaySparkles(x, y, w, cardH);
  return svg;
}

// 중간 카드 (220px 폭) — 2명/4명일 때
function vn2CardMedium(char, x, y, w, currentDate) {
  const c = vn2ParseChar(char, currentDate);
  const PAD = 12;
  if (c.isLocked) {
    return `<rect x="${x}" y="${y}" width="${w}" height="205" rx="5" fill="#150f18" stroke="#2a2030" stroke-width="1"/>
<text x="${x + w/2}" y="${y + 205/2}" font-family="'Noto Serif KR'" font-size="50" font-weight="bold" fill="#3a2a45" text-anchor="middle" filter="url(#vn2blur)">???</text>
<text x="${x + w/2}" y="${y + 205/2 + 35}" font-family="monospace" font-size="12" font-weight="bold" fill="#3a2a45" text-anchor="middle">🔒 미해금</text>`;
  }
  const s = vn2CardStroke(c);
  const bdayBanner = c.bday?.isBirthday;
  const off = bdayBanner ? 16 : 0;
  const cardH = 205 + off;
  const barX = x + PAD, barW = w - PAD*2;
  let svg = bdayBanner
    ? `<rect x="${x}" y="${y}" width="${w}" height="${cardH}" rx="5" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.w}">${bdayStrokeAnim()}</rect>`
    : `<rect x="${x}" y="${y}" width="${w}" height="${cardH}" rx="5" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.w}"/>`;
  svg += vn2BirthdayBanner(c, x, y, w, 'medium');
  svg += `<text x="${x + PAD}" y="${y + 24 + off}" font-family="'Noto Serif KR'" font-size="16" font-weight="bold" fill="#f0e0f5">${esc(c.name)}</text>`;
  if (c.mood) svg += `<text x="${x + w - PAD}" y="${y + 24 + off}" font-family="monospace" font-size="10" fill="#b090c8" text-anchor="end">${c.mood.length > 6 ? c.mood.slice(0,6) : c.mood}</text>`;
  if (c.progress) svg += `<text x="${x + PAD}" y="${y + 42 + off}" font-family="'Noto Serif KR'" font-size="11" fill="#FF6699" font-style="italic">${c.progress.length > 10 ? c.progress.slice(0,10) + '…' : c.progress}</text>`;
  svg += `<text x="${x + w - PAD}" y="${y + 42 + off}" font-family="monospace" font-size="10" fill="#8070a0" text-anchor="end">× ${c.count}회</text>`;
  svg += `<text x="${x + PAD}" y="${y + 66 + off}" font-family="monospace" font-size="10" fill="#8070a0" font-weight="600" letter-spacing="1">호감도</text>`;
  svg += `<text x="${x + w - PAD}" y="${y + 66 + off}" font-family="monospace" font-size="12" font-weight="bold" fill="${vn2BarColor('af', c.af)}" text-anchor="end">${c.af}</text>`;
  svg += vn2Bar(barX, y + 70 + off, barW, 8, c.af, 'af');
  svg += `<text x="${x + PAD}" y="${y + 94 + off}" font-family="monospace" font-size="9" fill="#8070a0" font-weight="600">체력</text>`;
  svg += `<text x="${x + w - PAD}" y="${y + 94 + off}" font-family="monospace" font-size="10" font-weight="bold" fill="${vn2BarColor('hp', c.hp)}" text-anchor="end">${c.hp}</text>`;
  svg += vn2Bar(barX, y + 98 + off, barW, 6, c.hp, 'hp');
  svg += `<text x="${x + PAD}" y="${y + 116 + off}" font-family="monospace" font-size="9" fill="#8070a0" font-weight="600">정신력</text>`;
  svg += `<text x="${x + w - PAD}" y="${y + 116 + off}" font-family="monospace" font-size="10" font-weight="bold" fill="${vn2BarColor('mental', c.mental)}" text-anchor="end">${c.mental}</text>`;
  svg += vn2Bar(barX, y + 120 + off, barW, 6, c.mental, 'mental');
  svg += `<text x="${x + PAD}" y="${y + 138 + off}" font-family="monospace" font-size="9" fill="#8070a0" font-weight="600">발정도</text>`;
  svg += `<text x="${x + w - PAD}" y="${y + 138 + off}" font-family="monospace" font-size="10" font-weight="bold" fill="${vn2BarColor('arousal', c.arousal)}" text-anchor="end">${c.arousal}</text>`;
  svg += vn2Bar(barX, y + 142 + off, barW, 6, c.arousal, 'arousal');
  if (c.heart) svg += `<text x="${x + PAD}" y="${y + 170 + off}" font-family="'Noto Serif KR'" font-size="12" fill="#b090c8" font-style="italic">" ${c.heart.length > 16 ? c.heart.slice(0,16) + '…' : c.heart} "</text>`;
  if (c.mem) svg += `<text x="${x + PAD}" y="${y + 192 + off}" font-family="'Noto Serif KR'" font-size="10" fill="#8070a0">📎 ${c.mem.length > 16 ? c.mem.slice(0,16) + '…' : c.mem}</text>`;
  // 평소 모드 생일 라벨 (footer 우측)
  if (!bdayBanner) svg += vn2BirthdayLabel(c, x, y + off, w, 'medium');
  if (bdayBanner) svg += bdaySparkles(x, y, w, cardH);
  return svg;
}

// 와이드 카드 (446px 폭) — 1명 전용
function vn2CardWide(char, x, y, w, currentDate) {
  const c = vn2ParseChar(char, currentDate);
  const PAD = 16;
  if (c.isLocked) {
    return `<rect x="${x}" y="${y}" width="${w}" height="245" rx="5" fill="#150f18" stroke="#2a2030" stroke-width="1"/>
<text x="${x + w/2}" y="${y + 245/2 + 10}" font-family="'Noto Serif KR'" font-size="70" font-weight="bold" fill="#3a2a45" text-anchor="middle" filter="url(#vn2blur)">???</text>
<text x="${x + w/2}" y="${y + 245/2 + 60}" font-family="monospace" font-size="14" font-weight="bold" fill="#3a2a45" text-anchor="middle">🔒 미해금</text>`;
  }
  const s = vn2CardStroke(c);
  const bdayBanner = c.bday?.isBirthday;
  const off = bdayBanner ? 22 : 0;
  const cardH = 245 + off;
  const fullBarX = x + PAD, fullBarW = w - PAD*2;
  let svg = bdayBanner
    ? `<rect x="${x}" y="${y}" width="${w}" height="${cardH}" rx="5" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.w}">${bdayStrokeAnim()}</rect>`
    : `<rect x="${x}" y="${y}" width="${w}" height="${cardH}" rx="5" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.w}"/>`;
  svg += vn2BirthdayBanner(c, x, y, w, 'wide');
  svg += `<text x="${x + PAD}" y="${y + 30 + off}" font-family="'Noto Serif KR'" font-size="20" font-weight="bold" fill="#f0e0f5">${esc(c.name)}</text>`;
  if (c.mood) svg += `<text x="${x + w - PAD}" y="${y + 28 + off}" font-family="monospace" font-size="12" fill="#b090c8" text-anchor="end">${c.mood.length > 8 ? c.mood.slice(0,8) : c.mood}</text>`;
  if (c.progress) svg += `<text x="${x + PAD}" y="${y + 52 + off}" font-family="'Noto Serif KR'" font-size="12" fill="#FF6699" font-style="italic">${c.progress.length > 18 ? c.progress.slice(0,18) + '…' : c.progress}</text>`;
  svg += `<text x="${x + w - PAD}" y="${y + 50 + off}" font-family="monospace" font-size="11" fill="#8070a0" text-anchor="end">× ${c.count}회</text>`;
  svg += `<text x="${x + PAD}" y="${y + 76 + off}" font-family="monospace" font-size="11" fill="#8070a0" font-weight="600" letter-spacing="2">호감도</text>`;
  svg += `<text x="${x + w - PAD}" y="${y + 76 + off}" font-family="monospace" font-size="14" font-weight="bold" fill="${vn2BarColor('af', c.af)}" text-anchor="end">${c.af}</text>`;
  svg += vn2Bar(fullBarX, y + 82 + off, fullBarW, 10, c.af, 'af');
  svg += `<text x="${x + PAD}" y="${y + 110 + off}" font-family="monospace" font-size="11" fill="#8070a0" font-weight="600">체력</text>`;
  svg += `<text x="${x + w - PAD}" y="${y + 110 + off}" font-family="monospace" font-size="12" font-weight="bold" fill="${vn2BarColor('hp', c.hp)}" text-anchor="end">${c.hp}</text>`;
  svg += vn2Bar(fullBarX, y + 114 + off, fullBarW, 8, c.hp, 'hp');
  svg += `<text x="${x + PAD}" y="${y + 138 + off}" font-family="monospace" font-size="11" fill="#8070a0" font-weight="600">정신력</text>`;
  svg += `<text x="${x + w - PAD}" y="${y + 138 + off}" font-family="monospace" font-size="12" font-weight="bold" fill="${vn2BarColor('mental', c.mental)}" text-anchor="end">${c.mental}</text>`;
  svg += vn2Bar(fullBarX, y + 142 + off, fullBarW, 8, c.mental, 'mental');
  svg += `<text x="${x + PAD}" y="${y + 166 + off}" font-family="monospace" font-size="11" fill="#8070a0" font-weight="600">발정도</text>`;
  svg += `<text x="${x + w - PAD}" y="${y + 166 + off}" font-family="monospace" font-size="12" font-weight="bold" fill="${vn2BarColor('arousal', c.arousal)}" text-anchor="end">${c.arousal}</text>`;
  svg += vn2Bar(fullBarX, y + 170 + off, fullBarW, 8, c.arousal, 'arousal');
  if (c.heart) svg += `<text x="${x + PAD}" y="${y + 200 + off}" font-family="'Noto Serif KR'" font-size="13" fill="#b090c8" font-style="italic">" ${c.heart.length > 24 ? c.heart.slice(0,24) + '…' : c.heart} "</text>`;
  if (c.mem) svg += `<text x="${x + PAD}" y="${y + 226 + off}" font-family="'Noto Serif KR'" font-size="11" fill="#8070a0">📎 ${c.mem.length > 30 ? c.mem.slice(0,30) + '…' : c.mem}</text>`;
  // 평소 모드 생일 라벨 (footer 우측)
  if (!bdayBanner) svg += vn2BirthdayLabel(c, x, y + off, w, 'wide');
  if (bdayBanner) svg += bdaySparkles(x, y, w, cardH);
  return svg;
}

function renderVN2(params) {
  const W = 470, PAD = 12;
  const rawChars = params.get('chars') || '???§0§§§§§§0§§';
  const rawDate = params.get('date');
  const date = esc(formatVNDate(rawDate, params.get('time')));
  const title = esc(params.get('title') || 'ROUTE STATUS');
  const chars = rawChars.split('|').slice(0, 6);
  const n = chars.length;
  const HEADER_H = 64, FOOTER_H = 16;
  const startY = HEADER_H + 4;
  let cardsSVG = '', bodyH = 0;

  // 카드별 생일 banner 여부 → row별 max 높이 계산용
  const hasBday = chars.map(ch => {
    const c = vn2ParseChar(ch, rawDate);
    return c.bday?.isBirthday && !c.isLocked;
  });
  // 카드 종류별 banner 추가 높이
  const bannerOff = { small: 14, medium: 16, wide: 22 };

  if (n === 1) {
    const cardW = W - PAD*2;
    cardsSVG = vn2CardWide(chars[0], PAD, startY, cardW, rawDate);
    bodyH = 245 + (hasBday[0] ? bannerOff.wide : 0);
  } else if (n === 2) {
    const cardW = (W - PAD*3) / 2;
    cardsSVG += vn2CardMedium(chars[0], PAD, startY, cardW, rawDate);
    cardsSVG += vn2CardMedium(chars[1], PAD*2 + cardW, startY, cardW, rawDate);
    const rowMax = (hasBday[0] || hasBday[1]) ? bannerOff.medium : 0;
    bodyH = 205 + rowMax;
  } else if (n === 3) {
    const cardW = (W - PAD*4) / 3;
    cardsSVG += vn2CardSmall(chars[0], PAD, startY, cardW, rawDate);
    cardsSVG += vn2CardSmall(chars[1], PAD*2 + cardW, startY, cardW, rawDate);
    cardsSVG += vn2CardSmall(chars[2], PAD*3 + cardW*2, startY, cardW, rawDate);
    const rowMax = hasBday.slice(0,3).some(b => b) ? bannerOff.small : 0;
    bodyH = 235 + rowMax;
  } else if (n === 4) {
    // 2x2 — row별로 banner 여부 계산
    const cardW = (W - PAD*3) / 2;
    const row1Off = (hasBday[0] || hasBday[1]) ? bannerOff.medium : 0;
    const row2Y = startY + 205 + row1Off + PAD;
    cardsSVG += vn2CardMedium(chars[0], PAD, startY, cardW, rawDate);
    cardsSVG += vn2CardMedium(chars[1], PAD*2 + cardW, startY, cardW, rawDate);
    cardsSVG += vn2CardMedium(chars[2], PAD, row2Y, cardW, rawDate);
    cardsSVG += vn2CardMedium(chars[3], PAD*2 + cardW, row2Y, cardW, rawDate);
    const row2Off = (hasBday[2] || hasBday[3]) ? bannerOff.medium : 0;
    bodyH = 205*2 + PAD + row1Off + row2Off;
  } else if (n === 5) {
    const cardW = (W - PAD*4) / 3;
    const row1Off = hasBday.slice(0,3).some(b => b) ? bannerOff.small : 0;
    const row2Y = startY + 235 + row1Off + PAD;
    cardsSVG += vn2CardSmall(chars[0], PAD, startY, cardW, rawDate);
    cardsSVG += vn2CardSmall(chars[1], PAD*2 + cardW, startY, cardW, rawDate);
    cardsSVG += vn2CardSmall(chars[2], PAD*3 + cardW*2, startY, cardW, rawDate);
    const row2X = (W - (cardW*2 + PAD)) / 2;
    cardsSVG += vn2CardSmall(chars[3], row2X, row2Y, cardW, rawDate);
    cardsSVG += vn2CardSmall(chars[4], row2X + cardW + PAD, row2Y, cardW, rawDate);
    const row2Off = (hasBday[3] || hasBday[4]) ? bannerOff.small : 0;
    bodyH = 235*2 + PAD + row1Off + row2Off;
  } else {
    const cardW = (W - PAD*4) / 3;
    const row1Off = hasBday.slice(0,3).some(b => b) ? bannerOff.small : 0;
    const row2Y = startY + 235 + row1Off + PAD;
    cardsSVG += vn2CardSmall(chars[0], PAD, startY, cardW, rawDate);
    cardsSVG += vn2CardSmall(chars[1], PAD*2 + cardW, startY, cardW, rawDate);
    cardsSVG += vn2CardSmall(chars[2], PAD*3 + cardW*2, startY, cardW, rawDate);
    cardsSVG += vn2CardSmall(chars[3], PAD, row2Y, cardW, rawDate);
    cardsSVG += vn2CardSmall(chars[4], PAD*2 + cardW, row2Y, cardW, rawDate);
    cardsSVG += vn2CardSmall(chars[5], PAD*3 + cardW*2, row2Y, cardW, rawDate);
    const row2Off = hasBday.slice(3,6).some(b => b) ? bannerOff.small : 0;
    bodyH = 235*2 + PAD + row1Off + row2Off;
  }
  const TOTAL_H = startY + bodyH + FOOTER_H;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${TOTAL_H}" viewBox="0 0 ${W} ${TOTAL_H}">
<defs>
  <filter id="vn2blur"><feGaussianBlur stdDeviation="3"/></filter>
  <pattern id="vn2deco" width="18" height="6" patternUnits="userSpaceOnUse">
    <rect width="8" height="6" fill="#DDAACC" opacity="0.35"/>
    <rect x="8" width="2" height="6" fill="#BB6688" opacity="0.3"/>
  </pattern>
</defs>
<rect width="${W}" height="${TOTAL_H}" fill="#110d16"/>
<rect width="${W}" height="${TOTAL_H}" fill="url(#vn2deco)" opacity="0.06"/>
<rect x="1" y="1" width="${W-2}" height="${TOTAL_H-2}" rx="6" fill="none" stroke="#3a2a48" stroke-width="1"/>
<path d="M1 20 L1 6 Q1 1 6 1 L20 1" fill="none" stroke="#DDAACC" stroke-width="1.5" opacity="0.6"/>
<path d="M${W-1} 20 L${W-1} 6 Q${W-1} 1 ${W-6} 1 L${W-20} 1" fill="none" stroke="#DDAACC" stroke-width="1.5" opacity="0.6"/>
<path d="M1 ${TOTAL_H-20} L1 ${TOTAL_H-6} Q1 ${TOTAL_H-1} 6 ${TOTAL_H-1} L20 ${TOTAL_H-1}" fill="none" stroke="#DDAACC" stroke-width="1.5" opacity="0.6"/>
<path d="M${W-1} ${TOTAL_H-20} L${W-1} ${TOTAL_H-6} Q${W-1} ${TOTAL_H-1} ${W-6} ${TOTAL_H-1} L${W-20} ${TOTAL_H-1}" fill="none" stroke="#DDAACC" stroke-width="1.5" opacity="0.6"/>
<rect x="0" y="0" width="${W}" height="${HEADER_H}" rx="6" fill="#160e1e"/>
<rect x="0" y="${HEADER_H - 1}" width="${W}" height="1" fill="#2a2035"/>
<text x="${W/2}" y="24" font-family="monospace" font-size="10" font-weight="bold" fill="#8070a0" letter-spacing="3" text-anchor="middle">✦ ${title} ✦</text>
<text x="${W/2}" y="48" font-family="'Noto Serif KR',Georgia,serif" font-size="15" font-weight="bold" fill="#BB6688" text-anchor="middle" font-style="italic">${date}</text>
<line x1="${PAD*2}" y1="56" x2="${W - PAD*2}" y2="56" stroke="#2a1a30" stroke-width="0.5"/>
${cardsSVG}
</svg>`;
}

// ════════════════════════════════════════════
//  DARK (다크판타지)
//  &p=이름§칭호§직업§성향§레벨
//  &s=hp§hpmax§mp§mpmax§sp§spmax§exp
//  &stat=str§def§agi§int§luk§wis
//  &eq=무기§등급§방어구§등급§악세서리§등급
//  &buf=버프1§!디버프1
// ════════════════════════════════════════════

function darkBarColor(type, val) {
  if (type === 'hp')  { if (val < 20) return '#EE1166'; if (val < 40) return '#FF7722'; return '#BB6688'; }
  if (type === 'mp')  { if (val < 20) return '#884499'; return '#8888CC'; }
  if (type === 'sp')  { if (val < 20) return '#FF7722'; return '#CCAA88'; }
  if (type === 'exp') return '#884499';
  return '#8888CC';
}

function darkBar(x, y, w, h, val, max, type) {
  const pct = Math.min(100, Math.round((val / max) * 100));
  const filled = Math.round((pct / 100) * w);
  const col = darkBarColor(type, pct);
  const pulse = (type === 'hp' || type === 'mp') && pct < 20;
  const bg = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="#0a0805"/>`;
  const fill = `<rect x="${x}" y="${y}" width="${filled}" height="${h}" rx="2" fill="${col}"/>`;
  const hi = `<rect x="${x}" y="${y}" width="${filled}" height="${Math.ceil(h/2)}" rx="2" fill="rgba(255,255,255,0.06)"/>`;
  if (pulse) {
    return `${bg}<g>${fill}${hi}<animate attributeName="opacity" values="1;0.4;1" dur="0.9s" repeatCount="indefinite"/></g>`;
  }
  return bg + fill + hi;
}

function darkStatBar(x, y, w, h, val) {
  const filled = Math.round((Math.min(99, val) / 99) * w);
  const col = val > 80 ? '#CCAA88' : val > 50 ? '#8888CC' : '#BB6688';
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="#0d0a08"/>
<rect x="${x}" y="${y}" width="${filled}" height="${h}" rx="2" fill="${col}" opacity="0.85"/>`;
}

// (gradeColor 제거 — 통일 rarityColor 헬퍼 사용)

function renderDark(params) {
  const W = 470, PAD = 18;
  const pp   = (params.get('p')    || '이름§칭호§직업§혼돈중립§1').split('§');
  const ss   = (params.get('s')    || '80§100§55§100§90§100§73').split('§');
  const stat = (params.get('stat') || '72§58§85§66§40§60').split('§');
  const eq   = (params.get('eq')   || '§§§§§').split('§');
  const bufs = params.get('buf') ? params.get('buf').split('§') : [];

  const name = esc(pp[0] || '이름없음'), title2 = esc(pp[1] || ''), job = esc(pp[2] || '');
  const align = esc(pp[3] || ''), lv = safeInt(pp[4], 1, 1, 999);
  const hp = safeInt(ss[0],80), hpMax = safeInt(ss[1],100,1,9999);
  const mp = safeInt(ss[2],55), mpMax = safeInt(ss[3],100,1,9999);
  const sp = safeInt(ss[4],90), spMax = safeInt(ss[5],100,1,9999);
  const exp = safeInt(ss[6], 0);
  const STR=safeInt(stat[0],50,0,99), DEF=safeInt(stat[1],50,0,99), AGI=safeInt(stat[2],50,0,99);
  const INT=safeInt(stat[3],50,0,99), LUK=safeInt(stat[4],50,0,99), WIS=safeInt(stat[5],50,0,99);
  const wpnName=esc(eq[0]||'—'), wpnGrade=esc(eq[1]||'일반');
  const armName=esc(eq[2]||'—'), armGrade=esc(eq[3]||'일반');
  const accName=esc(eq[4]||'—'), accGrade=esc(eq[5]||'일반');

  const HEADER_H=90, VITAL_H=118, EXP_H=40, STAT_H=118, EQ_H=120;
  const BUF_H = bufs.length > 0 ? 50 : 0;
  const FOOTER_H = 10;
  const TOTAL_H = HEADER_H + VITAL_H + EXP_H + STAT_H + EQ_H + BUF_H + FOOTER_H;
  const INNER_W = W - PAD*2, BAR_X = PAD+52, BAR_W = INNER_W-52-64;
  const div = (yy) => `<line x1="${PAD}" y1="${yy}" x2="${W-PAD}" y2="${yy}" stroke="#2a1e14" stroke-width="0.8"/>`;

  let y = 0;
  const sep = (a, b) => (a && b) ? '  ·  ' : '';
  let svg = `<rect x="0" y="0" width="${W}" height="${HEADER_H}" fill="#13100d"/>
<path d="M${PAD} 12 L12 12 L12 ${PAD}" fill="none" stroke="#CCAA88" stroke-width="1" opacity="0.5"/>
<path d="M${W-PAD} 12 L${W-12} 12 L${W-12} ${PAD}" fill="none" stroke="#CCAA88" stroke-width="1" opacity="0.5"/>
<text x="${PAD}" y="40" font-family="Georgia,'Noto Serif KR',serif" font-size="24" font-weight="bold" fill="#CCAA88">${name}</text>
<text x="${PAD}" y="58" font-family="Georgia,serif" font-size="14" font-weight="bold" fill="#BB6688" font-style="italic">${title2}</text>
<text x="${PAD}" y="76" font-family="monospace" font-size="11" font-weight="bold" fill="#8a7a68" letter-spacing="1">${job}${sep(job,align)}${align}</text>
<text x="${W-PAD}" y="40" font-family="monospace" font-size="13" font-weight="bold" fill="#CCAA88" text-anchor="end" letter-spacing="1">LV. ${lv}</text>
${div(HEADER_H)}`;
  y = HEADER_H;

  // HP/MP/SP
  svg += `<rect x="0" y="${y}" width="${W}" height="${VITAL_H}" fill="#0e0b08"/>`;
  [{label:'HP',val:hp,max:hpMax,type:'hp'},{label:'MP',val:mp,max:mpMax,type:'mp'},{label:'SP',val:sp,max:spMax,type:'sp'}].forEach((v,i) => {
    const vy = y + 18 + i*34;
    svg += `<text x="${PAD}" y="${vy+14}" font-family="monospace" font-size="13" font-weight="bold" fill="#8a7a68" letter-spacing="1">${v.label}</text>
${darkBar(BAR_X, vy+2, BAR_W, 12, v.val, v.max, v.type)}
<text x="${W-PAD}" y="${vy+14}" font-family="monospace" font-size="13" font-weight="bold" fill="${darkBarColor(v.type, Math.round(v.val/v.max*100))}" text-anchor="end">${v.val}/${v.max}</text>`;
  });
  svg += div(y + VITAL_H);
  y += VITAL_H;

  // EXP
  svg += `<rect x="0" y="${y}" width="${W}" height="${EXP_H}" fill="#0c0a07"/>
<text x="${PAD}" y="${y+16}" font-family="monospace" font-size="10" font-weight="bold" fill="#6a5a40" letter-spacing="2">EXPERIENCE</text>
${darkBar(PAD, y+22, INNER_W, 10, exp, 100, 'exp')}
<text x="${W-PAD}" y="${y+16}" font-family="monospace" font-size="11" font-weight="bold" fill="#884499" text-anchor="end">${exp}%</text>
${div(y + EXP_H)}`;
  y += EXP_H;

  // STATS
  const stats = [{label:'STR',val:STR},{label:'DEF',val:DEF},{label:'AGI',val:AGI},{label:'INT',val:INT},{label:'LUK',val:LUK},{label:'WIS',val:WIS}];
  const SBAW = Math.floor((INNER_W-16)/2) - 50;
  svg += `<rect x="0" y="${y}" width="${W}" height="${STAT_H}" fill="#0e0b08"/>
<text x="${PAD}" y="${y+16}" font-family="monospace" font-size="10" font-weight="bold" fill="#6a5a40" letter-spacing="2">ATTRIBUTES</text>`;
  stats.forEach((s,i) => {
    const col=i%2, row=Math.floor(i/2);
    const sx=PAD+col*Math.floor(INNER_W/2)+(col?8:0), sy=y+24+row*30, bx=sx+40;
    svg += `<text x="${sx}" y="${sy+14}" font-family="monospace" font-size="12" font-weight="bold" fill="#8a7a68" letter-spacing="0.5">${s.label}</text>
${darkStatBar(bx, sy+4, SBAW, 10, s.val)}
<text x="${bx+SBAW+6}" y="${sy+14}" font-family="monospace" font-size="13" font-weight="bold" fill="#CCAA88">${s.val}</text>`;
  });
  svg += div(y + STAT_H);
  y += STAT_H;

  // EQUIPMENT
  const eqItems = [{type:'WEAPON',name:wpnName,grade:wpnGrade},{type:'ARMOR',name:armName,grade:armGrade},{type:'ACCESSORY',name:accName,grade:accGrade}];
  svg += `<rect x="0" y="${y}" width="${W}" height="${EQ_H}" fill="#0c0a07"/>
<text x="${PAD}" y="${y+16}" font-family="monospace" font-size="10" font-weight="bold" fill="#6a5a40" letter-spacing="2">EQUIPMENT</text>`;
  eqItems.forEach((e,i) => {
    const ey = y+22+i*30; const gcol = rarityColor(e.grade);
    svg += `<rect x="${PAD}" y="${ey}" width="${INNER_W}" height="26" rx="3" fill="#0a0805" stroke="#1e1810" stroke-width="1"/>
${equipIcon(e.type, gcol, PAD+4, ey+2, 1)}
<text x="${PAD+30}" y="${ey+10}" font-family="monospace" font-size="9" font-weight="bold" fill="#6a5a40" letter-spacing="1">${e.type}</text>
<text x="${PAD+30}" y="${ey+22}" font-family="Georgia,'Noto Serif KR',serif" font-size="14" font-weight="bold" fill="#d8c8b0">${e.name}</text>
<text x="${W-PAD-6}" y="${ey+18}" font-family="monospace" font-size="12" font-weight="bold" fill="${gcol}" text-anchor="end">◆ ${e.grade}</text>`;
  });
  svg += div(y + EQ_H);
  y += EQ_H;

  // BUFFS
  if (bufs.length > 0) {
    svg += `<rect x="0" y="${y}" width="${W}" height="${BUF_H}" fill="#0e0b08"/>
<text x="${PAD}" y="${y+16}" font-family="monospace" font-size="10" font-weight="bold" fill="#6a5a40" letter-spacing="2">STATUS EFFECTS</text>`;
    let bx = PAD;
    bufs.slice(0,6).forEach(buf => {
      const isD = buf.startsWith('!'); const label = esc(isD ? buf.slice(1) : buf);
      const bcol = isD ? '#BB6688' : '#8888CC'; const bw = label.length * 9 + 24;
      svg += `<rect x="${bx}" y="${y+22}" width="${bw}" height="22" rx="3" fill="#0a0805" stroke="${bcol}" stroke-width="1.5"/>
<text x="${bx+bw/2}" y="${y+37}" font-family="'Noto Serif KR',Georgia,serif" font-size="12" font-weight="bold" fill="${bcol}" text-anchor="middle">${label}</text>`;
      bx += bw + 6;
    });
    y += BUF_H;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${TOTAL_H}" viewBox="0 0 ${W} ${TOTAL_H}">
<rect width="${W}" height="${TOTAL_H}" fill="#110e0a"/>
<rect x="1" y="1" width="${W-2}" height="${TOTAL_H-2}" rx="3" fill="none" stroke="#2a1e14" stroke-width="1"/>
<rect x="3" y="3" width="${W-6}" height="${TOTAL_H-6}" rx="2" fill="none" stroke="#1a1410" stroke-width="0.5"/>
${svg}
</svg>`;
}

// ════════════════════════════════════════════
//  PIXEL (픽셀 RPG)
//  &p=이름§직업§레벨§exp
//  &s=hp§hpmax§mp§mpmax§sp§spmax
//  &stat=atk§def§agi§mag§luk
//  &eq=무기§방어구§악세서리
//  &buf=버프1§!디버프1
//  &av=옷색§머리색 (선택)
// ════════════════════════════════════════════

function pixelBarColor(type, pct) {
  if (type==='hp') { if(pct<20) return '#EE1166'; if(pct<40) return '#FF7722'; return '#BB6688'; }
  if (type==='mp') { if(pct<20) return '#884499'; return '#8888CC'; }
  if (type==='sp') { if(pct<20) return '#FF7722'; return '#CCAA88'; }
  if (type==='exp') return '#884499';
  if (type==='atk') return '#BB6688';
  if (type==='def') return '#8888CC';
  if (type==='agi') return '#CCAA88';
  if (type==='mag') return '#884499';
  if (type==='luk') return '#DDAACC';
  return '#8888CC';
}

function pixelBar(x, y, w, h, val, max, type) {
  const pct = Math.min(100, Math.round((val / max) * 100));
  const col = pixelBarColor(type, pct);
  const BLOCK = 4, GAP = 1;
  const totalBlocks = Math.floor(w / (BLOCK + GAP));
  const filledBlocks = Math.round((pct / 100) * totalBlocks);
  const pulse = (type === 'hp' || type === 'mp') && pct < 20;
  let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#000"/>`;
  // 빈 블록은 바로 그리고, 채워진 블록은 모았다가 그룹으로 (펄스용)
  let filledOut = '';
  for (let i = 0; i < totalBlocks; i++) {
    if (i < filledBlocks) {
      filledOut += `<rect x="${x + i*(BLOCK+GAP)}" y="${y}" width="${BLOCK}" height="${h}" fill="${col}" opacity="1"/>`;
    } else {
      out += `<rect x="${x + i*(BLOCK+GAP)}" y="${y}" width="${BLOCK}" height="${h}" fill="#1a1a2e" opacity="0.5"/>`;
    }
  }
  if (pulse && filledBlocks > 0) {
    out += `<g>${filledOut}<animate attributeName="opacity" values="1;0.4;1" dur="0.9s" repeatCount="indefinite"/></g>`;
  } else {
    out += filledOut;
  }
  return out;
}

function pixelStatBar(x, y, w, h, val, type) {
  const pct = Math.min(99, val);
  const col = pixelBarColor(type, pct);
  const BLOCK = 3, GAP = 1;
  const totalBlocks = Math.floor(w / (BLOCK + GAP));
  const filledBlocks = Math.round((pct / 99) * totalBlocks);
  let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#000"/>`;
  for (let i = 0; i < totalBlocks; i++) {
    out += `<rect x="${x + i*(BLOCK+GAP)}" y="${y}" width="${BLOCK}" height="${h}" fill="${i < filledBlocks ? col : '#1a1a2e'}"/>`;
  }
  return out;
}

// 직업별 도트 아이콘 (16x16 무기/상징)
// [x,y,color] 배열, 좌표는 16x16 기준 (렌더 시 SC=3 곱함)
function jobIcons() {
  const S='#8888CC',D='#DDAACC',C='#CCAA88',B='#BB6688',P='#884499',E='#EE1166',O='#FF7722';
  const m1='#ccc',m2='#ddd',m3='#eee',m0='#aaa',m4='#bbb';
  const w='#6a4a2a',w2='#8a6a3a',dk='#2a1a2a',dkp='#4a2a4a';
  const g1='#6aa04a',g2='#5a8a3a',g3='#7ab85a';
  const fl='#aac8dd';
  return {
    // ── 근접 ──
    warrior: [ // 검+방패
      [1,4,S],[2,3,S],[2,4,'#6668AA'],[2,5,S],[3,2,S],[3,3,S],[3,4,D],[3,5,S],[3,6,S],
      [4,2,S],[4,3,S],[4,4,D],[4,5,S],[4,6,S],[5,2,S],[5,3,S],[5,4,D],[5,5,S],[5,6,S],
      [6,3,S],[6,4,'#6668AA'],[6,5,S],[7,4,S],
      [10,0,m1],[10,1,m2],[10,2,m2],[10,3,m3],[10,4,m3],[10,5,m3],[10,6,m3],[10,7,m3],[10,8,m3],
      [9,9,C],[10,9,C],[11,9,C],[10,10,w],[10,11,w],[10,12,C],
    ],
    knight: [ // 랜스
      [7,0,C],[7,1,m3],[6,1,m2],[8,1,m2],[6,2,B],[7,2,m3],[8,2,B],
      [7,3,C],[7,4,C],[7,5,C],[7,6,C],[7,7,C],[7,8,C],[7,9,C],[7,10,C],[7,11,C],
      [5,5,S],[6,5,S],[8,5,S],[9,5,S],[7,12,w],
    ],
    berserker: [ // 넓적한 전투도끼 X자
      [0,0,'#999'],[1,0,m0],[2,0,m4],[0,1,m0],[1,1,m2],[2,1,m2],[3,1,m2],
      [0,2,'#999'],[1,2,m4],[2,2,m2],[3,2,m3],[4,2,m2],
      [1,3,'#999'],[2,3,m4],[3,3,m2],[4,3,m3],
      [5,4,w],[6,5,w],[7,6,C],[8,6,C],
      [13,0,m4],[14,0,m0],[15,0,'#999'],[12,1,m2],[13,1,m2],[14,1,m2],[15,1,m0],
      [11,2,m2],[12,2,m2],[13,2,m4],[14,2,'#999'],[15,2,'#999'],
      [11,3,m3],[12,3,m2],[13,3,m4],[14,3,'#999'],
      [10,4,w],[9,5,w],
      [6,7,w],[5,8,w],[3,9,m4],[4,9,m2],[2,10,m2],[3,10,m4],
      [1,10,m0],[1,11,'#999'],[2,11,m0],
      [9,7,w],[10,8,w],[11,9,m4],[12,9,m2],[13,10,m2],[12,10,m4],
      [14,10,m0],[13,11,m0],[14,11,'#999'],
      [0,3,B+'99'],[15,3,B+'99'],
    ],
    swordsman: [ // 카타나
      [8,0,m3],[8,1,m3],[8,2,m3],[8,3,m2],[8,4,m2],[8,5,m2],[8,6,m2],[8,7,m2],[8,8,m2],
      [6,9,C],[7,9,C],[8,9,C],[9,9,C],[10,9,C],
      [8,10,B],[8,11,dkp],[8,12,B],[8,13,dkp],[8,14,C],
    ],
    monk: [ // 격투 글러브
      [2,4,C],[1,5,C],[2,5,B],[3,5,B],[4,5,B],[1,6,B],[2,6,B],[3,6,B],[4,6,B],
      [1,7,B],[2,7,B],[3,7,B],[4,7,B],[2,8,C],[3,8,C],
      [13,4,C],[11,5,B],[12,5,B],[13,5,B],[14,5,C],[11,6,B],[12,6,B],[13,6,B],[14,6,B],
      [11,7,B],[12,7,B],[13,7,B],[14,7,B],[12,8,C],[13,8,C],
      [0,4,O+'99'],[5,3,O+'66'],
    ],
    // ── 민첩 ──
    rogue: [ // 단검+주머니(노란코인)
      [2,0,m2],[2,1,m2],[2,2,m2],[2,3,m3],[2,4,m3],
      [1,5,C],[2,5,C],[3,5,C],[2,6,w],[2,7,w],
      [6,2,w],[7,2,w],[8,2,w],[9,2,w],[10,2,w],[11,2,w],
      [6,3,w2],[7,3,w2],[8,3,w2],[9,3,w2],[10,3,w2],[11,3,w2],
      [6,4,w2],[7,4,w2],[8,4,w2],[9,4,w2],[10,4,w2],[11,4,w2],
      [6,5,w2],[7,5,w2],[8,5,w2],[9,5,w2],[10,5,w2],[11,5,w2],
      [6,6,w2],[7,6,w2],[8,6,w2],[9,6,w2],[10,6,w2],[11,6,w2],
      [7,7,w],[8,7,w],[9,7,w],[10,7,w],
      [8,1,'#e8c840'],[9,1,'#d4b430'],[7,1,'#d4b43099'],
    ],
    archer: [ // 활+화살 겹침
      [4,0,w],[3,1,w],[2,2,w],[2,3,w],[1,4,w],[1,5,w],[1,6,w],
      [2,7,w],[2,8,w],[3,9,w],[4,10,w],[5,11,w],
      [0,5,B],[0,6,B+'99'],
      [1,5,w2],[2,5,w2],[3,5,w2],[4,5,w2],[5,5,w2],[6,5,w2],
      [7,5,w2],[8,5,w2],[9,5,w2],[10,5,w2],
      [11,4,m2],[11,5,m2],[11,6,m2],[12,5,m3],
    ],
    assassin: [ // 넓은 칼날 X자+어둠오라
      [1,0,m4],[2,0,m2],[2,1,m2],[3,1,m2],[3,2,m2],[4,2,m3],[4,3,m3],[5,3,m3],[5,4,m3],[6,4,m3],
      [14,0,m4],[13,0,m2],[12,1,m2],[13,1,m2],[12,2,m2],[11,2,m3],[10,3,m3],[11,3,m3],[9,4,m3],[10,4,m3],
      [6,5,dkp],[7,5,dkp],[8,5,dkp],[9,5,dkp],[7,4,m2],[8,4,m2],
      [7,6,dk],[8,7,dk],[9,8,dk],
      [8,6,dk],[7,7,dk],[6,8,dk],
      [0,1,P+'40'],[15,1,P+'33'],[4,6,P+'33'],[11,6,P+'40'],[7,2,P+'4D'],
      [1,1,P+'59'],[14,1,P+'59'],
    ],
    hunter: [ // 산탄총
      [0,5,'#777'],[0,6,'#666'],
      [1,5,'#888'],[2,5,'#999'],[3,5,m0],[4,5,m0],[5,5,m0],[6,5,m0],[7,5,m4],
      [1,6,'#777'],[2,6,'#888'],[3,6,'#999'],[4,6,'#999'],[5,6,'#999'],[6,6,'#999'],[7,6,m0],
      [8,4,w2],[8,5,w],[8,6,w],
      [9,4,w2],[10,4,w2],[9,5,w2],[10,5,w2],[11,5,w2],[12,5,w2],
      [9,6,w],[10,6,w],[11,6,w],[12,6,w],
      [13,5,w2],[13,6,w2],[14,5,w],
      [8,7,'#888'],[9,7,'#888'],[9,8,m0],
      [4,4,'#777'],
      [0,4,O+'80'],[0,7,O+'4D'],
    ],
    // ── 마법 ──
    mage: [ // 지팡이+별
      [7,0,D],[5,1,D],[6,1,D],[7,1,'#ffffffCC'],[8,1,D],[9,1,D],
      [6,2,D],[7,2,D],[8,2,D],[7,3,D],
      [4,0,D+'66'],[10,2,D+'4D'],
      [7,4,P],[7,5,P],[7,6,P],[7,7,P],[7,8,P],[7,9,P],[7,10,P],[7,11,P],[7,12,P],
    ],
    warlock: [ // 마법서+어둠오라
      [3,3,dk],[4,3,dk],[5,3,dk],[6,3,dk],[7,3,dk],[8,3,dk],[9,3,dk],[10,3,dk],[11,3,dk],
      [3,4,dkp],[4,4,'#1a0a1a'],[5,4,'#1a0a1a'],[6,4,'#1a0a1a'],[7,4,P],[8,4,'#1a0a1a'],[9,4,'#1a0a1a'],[10,4,'#1a0a1a'],[11,4,dkp],
      [3,5,dkp],[4,5,'#1a0a1a'],[5,5,'#1a0a1a'],[6,5,P],[7,5,B],[8,5,P],[9,5,'#1a0a1a'],[10,5,'#1a0a1a'],[11,5,dkp],
      [3,6,dkp],[4,6,'#1a0a1a'],[5,6,'#1a0a1a'],[6,6,'#1a0a1a'],[7,6,P],[8,6,'#1a0a1a'],[9,6,'#1a0a1a'],[10,6,'#1a0a1a'],[11,6,dkp],
      [3,7,dk],[4,7,dk],[5,7,dk],[6,7,dk],[7,7,dk],[8,7,dk],[9,7,dk],[10,7,dk],[11,7,dk],
      [3,8,dkp],[4,8,dkp],[5,8,dkp],[6,8,dkp],[7,8,dkp],[8,8,dkp],[9,8,dkp],[10,8,dkp],[11,8,dkp],
      [2,2,P+'40'],[12,2,P+'33'],[1,5,P+'4D'],[12,6,P+'4D'],[2,9,P+'33'],[12,9,P+'40'],
    ],
    summoner: [ // 새 실루엣
      [6,3,S],[7,3,S],[5,4,S],[6,4,S],[7,4,'#6668AA'],[8,4,S],
      [5,5,S],[6,5,'#6668AA'],[7,5,S],[8,5,S],[6,6,S],[7,6,S],
      [9,4,C],[10,4,C],[8,3,E],
      [3,2,'#6668AA'],[4,2,S],[2,1,'#6668AA'],[3,1,S],[4,1,'#6668AA'],
      [1,0,'#6668AA'],[2,0,S],
      [3,7,'#6668AA'],[4,7,S],[2,8,'#6668AA'],[3,8,S],
      [4,6,'#6668AA'],[3,6,S],
      [11,2,D+'66'],[10,6,D+'4D'],[1,3,D+'4D'],
    ],
    necromancer: [ // 낫+어둠오라
      [2,0,m0],[3,0,m2],[4,0,m2],[5,0,m2],
      [1,1,'#999'],[2,1,m2],[5,1,m3],[1,2,m0],[5,2,m2],[5,3,m2],
      [6,2,dkp],[6,3,dkp],[6,4,dkp],[6,5,dkp],[6,6,dkp],[6,7,dkp],
      [6,8,dkp],[6,9,dkp],[6,10,dkp],[6,11,dkp],[6,12,dkp],
      [4,2,P+'4D'],[7,1,P+'40'],[8,4,P+'33'],[4,5,P+'4D'],[8,7,P+'40'],[4,9,P+'33'],[8,10,P+'4D'],
    ],
    // ── 성직 ──
    cleric: [ // 십자가+신성오라
      [7,0,C],[7,1,C],[7,2,C],[7,3,C],
      [4,4,C],[5,4,C],[6,4,C],[7,4,D],[8,4,C],[9,4,C],[10,4,C],
      [7,5,C],[7,6,C],[7,7,C],[7,8,C],[7,9,C],[7,10,C],[7,11,C],
      [2,1,C+'33'],[12,1,C+'26'],[1,5,C+'40'],[13,4,C+'33'],[2,8,C+'26'],[12,7,C+'40'],
      [4,0,C+'26'],[11,8,C+'26'],
    ],
    druid: [ // 나뭇잎+지팡이
      [5,0,g2],[6,0,g1],[7,0,g2],[8,0,g1],
      [4,1,g1],[5,1,g3],[6,1,g1],[7,1,g3],[8,1,g3],[9,1,g1],
      [4,2,g2],[5,2,g1],[6,2,g3],[7,2,g1],[8,2,g1],[9,2,g2],
      [5,3,g2],[6,3,g1],[7,3,g2],[8,3,g2],
      [7,4,w],[7,5,w],[7,6,w],[7,7,w],[7,8,w],[7,9,w],[7,10,w],[7,11,w],[7,12,'#5a3a1a'],
    ],
    shaman: [ // 저주인형+어둠오라
      [6,1,C],[7,1,C],[8,1,C],
      [6,2,dk],[7,2,B],[8,2,dk],
      [4,3,C],[5,3,C],[6,3,C],[7,3,C],[8,3,C],[9,3,C],[10,3,C],
      [6,4,C],[7,4,B],[8,4,C],[6,5,C],[7,5,C],[8,5,C],
      [6,6,C],[8,6,C],[6,7,C],[8,7,C],
      [5,4,m0],[9,4,m0],[7,6,m0],[7,3,w2],
      [3,1,P+'4D'],[11,2,P+'40'],[3,5,P+'33'],[10,6,P+'4D'],[4,8,P+'33'],[10,8,P+'26'],
    ],
    // ── 기타 ──
    bard: [ // 류트+음표
      [4,0,w],[4,1,w],[4,2,w],[3,0,w2],[5,0,w2],[3,1,m0],[5,1,m0],
      [5,3,w2],[6,3,w2],[7,3,w2],
      [4,4,w2],[5,4,C],[6,4,C],[7,4,C],[8,4,w2],
      [4,5,w2],[5,5,C],[6,5,w],[7,5,C],[8,5,w2],
      [4,6,w2],[5,6,C],[6,6,C],[7,6,C],[8,6,w2],
      [5,7,w2],[6,7,w2],[7,7,w2],
      [11,0,D+'4D'],[11,1,D],[12,0,D],[11,2,D+'CC'],[10,3,D],[11,3,D],
      [13,3,D+'80'],[13,4,D+'80'],[12,5,D+'80'],[13,5,D+'80'],
    ],
    alchemist: [ // 플라스크
      [6,0,fl],[7,0,fl],[8,0,fl],[6,1,fl],[7,1,fl],[8,1,fl],[6,2,fl],[7,2,fl],[8,2,fl],
      [4,3,fl],[5,3,fl],[6,3,fl],[7,3,fl],[8,3,fl],[9,3,fl],[10,3,fl],
      [3,4,fl],[4,4,fl],[5,4,P],[6,4,P],[7,4,P],[8,4,P],[9,4,P],[10,4,fl],[11,4,fl],
      [3,5,fl],[4,5,P],[5,5,B],[6,5,P],[7,5,B],[8,5,P],[9,5,B],[10,5,P],[11,5,fl],
      [3,6,fl],[4,6,P],[5,6,P],[6,6,P],[7,6,P],[8,6,P],[9,6,P],[10,6,P],[11,6,fl],
      [4,7,fl],[5,7,P],[6,7,P],[7,7,P],[8,7,P],[9,7,P],[10,7,fl],
      [5,8,fl],[6,8,fl],[7,8,fl],[8,8,fl],[9,8,fl],
      [9,2,B+'80'],[10,1,P+'66'],[11,0,B+'4D'],
    ],
    sorcerer: [ // 가로 두루마리+핏빛오라
      [0,4,'#b89a70'],[0,5,C],[0,6,'#b89a70'],
      [1,3,C],[1,4,C],[1,5,'#e0d0b0'],[1,6,C],[1,7,C],
      [2,3,C],[2,4,'#e0d0b0'],[2,5,'#e0d0b0'],[2,6,'#e0d0b0'],[2,7,C],
      [3,3,C],[3,4,'#e0d0b0'],[3,5,'#e0d0b0'],[3,6,'#e0d0b0'],[3,7,C],
      [4,3,C],[4,4,'#e0d0b0'],[4,5,'#e0d0b0'],[4,6,'#e0d0b0'],[4,7,C],
      [5,3,C],[5,4,'#e0d0b0'],[5,5,'#e0d0b0'],[5,6,'#e0d0b0'],[5,7,C],
      [6,3,C],[6,4,'#e0d0b0'],[6,5,'#e0d0b0'],[6,6,'#e0d0b0'],[6,7,C],
      [7,3,C],[7,4,'#e0d0b0'],[7,5,'#e0d0b0'],[7,6,'#e0d0b0'],[7,7,C],
      [8,3,C],[8,4,'#e0d0b0'],[8,5,'#e0d0b0'],[8,6,'#e0d0b0'],[8,7,C],
      [9,3,C],[9,4,'#e0d0b0'],[9,5,'#e0d0b0'],[9,6,'#e0d0b0'],[9,7,C],
      [10,3,C],[10,4,'#e0d0b0'],[10,5,'#e0d0b0'],[10,6,'#e0d0b0'],[10,7,C],
      [11,3,C],[11,4,'#e0d0b0'],[11,5,'#e0d0b0'],[11,6,'#e0d0b0'],[11,7,C],
      [12,3,C],[12,4,C],[12,5,'#e0d0b0'],[12,6,C],[12,7,C],
      [13,4,'#b89a70'],[13,5,C],[13,6,'#b89a70'],
      [4,2,'#ddd99'],[4,8,'#ddd99'],[9,2,'#eee99'],[9,8,'#eee99'],
      [2,1,E+'40'],[5,1,B+'4D'],[9,1,E+'33'],
      [12,2,B+'40'],[0,2,E+'33'],[14,3,E+'33'],
      [1,8,B+'40'],[12,8,E+'33'],[3,9,E+'26'],[7,9,B+'33'],[11,9,E+'26'],
      [6,1,E+'26'],[14,6,B+'26'],
    ],
    paladin: [ // 날개투구+신성오라
      [7,0,S],
      [6,1,S],[7,1,'#6668AA'],[8,1,S],
      [5,2,S],[6,2,S],[7,2,S],[8,2,S],[9,2,S],
      [5,3,S],[6,3,'#6668AA'],[7,3,S],[8,3,'#6668AA'],[9,3,S],
      [5,4,S],[6,4,S],[7,4,D],[8,4,S],[9,4,S],
      [5,5,S],[6,5,'#1a0a2a'],[7,5,S],[8,5,'#1a0a2a'],[9,5,S],
      [5,6,S],[6,6,'#6668AA'],[7,6,S],[8,6,'#6668AA'],[9,6,S],
      [5,7,'#6668AA'],[6,7,S],[7,7,'#6668AA'],[8,7,S],[9,7,'#6668AA'],
      [6,8,'#6668AA'],[7,8,S],[8,8,'#6668AA'],
      [7,9,'#6668AA'],
      [0,4,m4],[1,3,m2],[1,4,m2],[2,2,m4],[2,3,m2],[2,4,m3],
      [3,2,m2],[3,3,m3],[3,4,m3],[3,5,m2],
      [4,3,m3],[4,4,m3],[4,5,m3],[4,6,m2],
      [14,4,m4],[13,3,m2],[13,4,m2],[12,2,m4],[12,3,m2],[12,4,m3],
      [11,2,m2],[11,3,m3],[11,4,m3],[11,5,m2],
      [10,3,m3],[10,4,m3],[10,5,m3],[10,6,m2],
      [7,-1,C+'59'],[1,1,C+'26'],[13,1,C+'26'],[0,6,C+'1F'],[14,6,C+'1F'],
    ],
  };
}

// ════════════════════════════════════════════
//  직업 아이콘 — 48x48 PNG (data-URI 인라인)
//  기존 jobIcons()(16x16 도트) + pixelSprite()를 대체.
//  옛 함수 둘은 남겨두되 호출되지 않음.
//  ※ 기존 pixelSprite도 SC=3 이라 48x48 이었으므로 좌표 변경 없음.
// ════════════════════════════════════════════
const JOB_ICON_PNG = {
  warrior: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAADAFBMVEXq6u/X0s3KvrG0tce2o42bna6fhm2BfpF8ZG9lWnhMQF4qIzcODh8JChsHBxgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACsYyk3AAAAEHRSTlP///////////////////8A4CNdGQAAAkRJREFUeNqVluuygzAIhNXcCIT0/d/2LKS1avWM5kdn6vDJLhDa6XVytOvr6kwnz3oKpT8A+jTNSW8D3eJDup8B8VMIoepNwBJMKVxrOgdSeAQgPN0FdCgKiW8Cb0H3+/BO8Bi4VnQGIEG6O0sWDyBdKzoBzHN9kiH9q+gU+E/RHlBXlEJ9CKR/4s+Az2Vosp7WL4ECz9xtCDvP87yMExXffwGzXMagqhLlmAmfOHEh/mQ5BToTxSVmFmZrY45geYzLLxCKKiI8hGsNNik1G9NOgFIK2gzAohEOYA7znEqlKyClygBEEAx8AFgjnH8AKyoSFEkao7DHO+BEzXQEulsOdQO4pNmYAOdbQPsbQG5OJgkOijEe7cBWEoqnCkm1BJb0AdxFsEWILDtArL0ikFDKAFBT67nX1E/ZVUnw5oBYypURWKwPJh5nSsiDZLwDmnhJloUEZlk0L3Md75+CWz8AqphMRgIiM1pF4szFlBvg8UJRtlXqjpCw2ajS8kJ1AMkAZslR97NkhDSxiYAmMhMuKY0EGN0D8GoUyQhgL+W8cJrdg1vmJWc9dFoiALixF6kMTTZ3iK4CgA8ZGp5J++wXpIhUDCiucVX0BYQ8weqIl0gmqrwdjNHbARnAdxI9CKUtI57lADTGlWmbjWeickXb0YLlG7/2gXGHd0BvuP/07jF93X2AEBPR7lcBNoBUS7Qx9wUyxNJ+CavYksH1Fm3HRdbJl8RhayOJraSt0tV0x1BIa8e/NUhyeLqWtaue/Sr8PP0D99lnXUxtKaQAAAAASUVORK5CYII=',
  knight: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAADAFBMVEXV09azoJy6hnKGeorOW4+aWGVsXGlaSVd+N2JLN0o2K0MyHDohGTceEzEYDy4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABmFXcaAAAAEHRSTlP///////////////////8A4CNdGQAAAWVJREFUeNqVleuWwyAIhL0UUUF8/7ddzKZd020j5pfnZD5lBmJctzyS5Ll0Nr3fAiS6uAPU6PxOSeSdi9jNQBn6yFaAh97FZAVKckMfazcCOPb3GwCno6LJwsoDxXEEihWQqokmj90I1OAAmbFagRJ9KNJF7CcgzPWvAPaQCu8AGEqrJFagIRCVDIC2lBoGFAJ46JPFANQAVdqhf+hqCXCA0nrPhx5ypgXAKeDQyChoWFkArQQ44pH8gNyn3rlvBsLZMdIT2jIlhoDnSFO+hPQFQC3orA00WFgBaqCcmvrWho8Aq4H2PED1yPce2pnor2Wg1hazVMKrsQ3yelrbnwGNiN5fu08FvTalLCtAWzxdc52WwJTocW00uQfGSNDtzePeZxT+V3ED6Ejgvf4K1LX+AuhXPCe0BqYWmwC6JroEKrxm1AQw+sBiB/RnjFg2APQ+Vup2oMSEVTYAxmSxPJkWsezf+w/e5nt38/QXOAAAAABJRU5ErkJggg==',
  berserker: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAADAFBMVEXq6u3Lysa3tLSepLSUk5qTf4B5gZlncIqORlRQSV82O1oqIToXFTMTES8SDy0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABCtyQZAAAAEHRSTlP///////////////////8A4CNdGQAAAnBJREFUeNqVlu2aqyAMhIEgEfLR+7/bM0Hts+qereVXa3nJJBli0+u03Mxff6708wt2py8AnJ5SYnsKuGJ/zo8Bh5ycUhsH4GP4W+kdCPnYTq3vgPW8yPZRm/wGpADKO4Iteek7kLv7Bdj3Y3WZhEtZ1u1g05TczsC+nwDwDOG6YukWQJDbO40DqCnVViMEq5l1yrmrb9UgRvnEfwIImnKlPYSKtNR42fI3Lg3lphuQGNupMcsYAwCxmKOZTJUAZDsBNAH8RNxHEw6gi6oKzqi1lUxmZ6AQl4KfeNQcAVof0mVAIx62UGA3SZFy5cHcZ4AxeEjdgZyrnoCMCBNoYwinWmsXyl3wCEJbSReg5DLbRrXFyYngEQXUkRUVACjTTwClgySOsnIIB8DgII9i1ajSGbAwNmM3SqpBEitSGHsvofgMuBY8aR1GMtPRGYnbEJlJAUCAo9XpbWYoHRKWMYWqYIVnHRq3nEuxE+AoSak6H8qSYFQFMPpU1Epk7n6+DyMT6TTqipKBgC1kMDrJKBOVYZcrClE07ekiYW1cCxAdghguqCRXAKXdAKCriERNAGB7Klhd72NGZQNkgaDNatI7HIYMRO2XQbantQHbR3QugG726+TbsHWmvMXE+YXQS3v9H9AYF77PF+yv0czX/wGTXPYA8CTu02U834EVKdhRBtHrcL4BEinYe3z6n+N+tm05Un7wfogJXNe+9+MRoGtejhH5EJg+ehzBdF1WaHoORE0PXzwDPik6AxjyEcEev3Z9Xp0vAJuA+lPA1gLfib6+AOL6fwPkvHwo0vmKwnjL3227Jq3rh7bdGufuH/7N/AP292r8YujFWwAAAABJRU5ErkJggg==',
  swordsman: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAADAFBMVEXq6u/68IrRuWeagX61WWx2h6ZUWW+MNF9BK0AZHEEWFTkSFjsREzgNDi4KCycAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACEqaaGAAAAEHRSTlP///////////////////8A4CNdGQAAAU9JREFUeNqV1NuWwyAIBVBDTAFF8v9/O5jbdDUmYp/6cLZctA2r75Oz7F+CE/AnD4KF8gjgz8I8BkIeA2EMMC2D4DMGshUYAcLLGKgNWd5/D/RVwAOsQAXup7FPENgL5ChwdNQHecv7gez5cOZ7IPMguPLZB44Brp32wJXn1QXYbuCnoVdgb/TW0Bto55/BQ/4R1Atr5e+g8ExfefnJ34DIPEF5zt9AIQCY6cpLF6SEE9AnPOQbM5QUJ+Ad3PONLakkmEBCKK18o4JgtDlmlma+sSWMESnCnJr5XyAcDUSqghwgS4QqSBHAATJt5yOpVtUFlt/PL6pEVDpAMtbjI2JSW67q+g6Etm6sn6RvP9twbtO2sh1veQ9ggGmqNVLR9z+eHdg2DQAh9vIHKGgPDgCJ1AmsG4iApVvgnKGQtYPUz59ASzLiyP/fg6qqI7/+Ad/odr1iisJEAAAAAElFTkSuQmCC',
  monk: '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',
  rogue: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAADAFBMVEXt7OTRxanNpWCcnqvAg1KbelmEhphycYCOWj+BPkhYTVFRKjAzLDQmFyMUDRoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFj3fEAAAAEHRSTlP///////////////////8A4CNdGQAAAtlJREFUeNqNle2WgzAIRE2M+QT6/m+7MyTb1tbdo/1XuWGAIW6Pfx7j8/Hf9k+85LD1+4BK2Lb9dgazviM+f8b/BZiVbdvCbcAkI37Le7kHmOw8P+/fJVwCLp8FQNEdwCxsXsC+93uAn48C9l2+4i8A62EJCjcBb1DIGU29A1j5TXCp6ALIz/h8B5gJQsneo8cNYI6g/JXgCgiomBlmAmxE72/z2K4SZApyG5kNPWKM/blJn0DwimEKusKkjtZSDDFprXYNgCiMZwKJdcioNaVqI44LYG6BA6ZYupSgBYeDO9IFYLYqyLNiHQhTyFc5jqFnwLpA86wgr5aajhoPNAmampxrwMCK+xqCvKV+HoiEHkVo0nOXuDMh9162AgDnz9c6tNXjqIPCzkDZ3RK59KcgT9BUxmD8+Mqwc8YwhfWiU48JEqSGcCL6+KiBG4O1DNQzAbYTjWoNwwD8MTicJ1CfWYOXYBX1plpFVJFC2yS2t7sF73rBkwtqsNmfyI4yGj89A5CbHEESAgkeCmERCcjw0b0kMb5VVSDdxGDSsIAECxKobN6zaLggpoE3/CaU3SoiGR/TEQ8I4kjaO9BCSOiHKkrGvlk94qohwUe0FHzyAmy0IxIQDITrg54mj55Ak0afvwGtod/I2aEbVRcbsMQMT7QGKqhnIEWOFA7ZO0IPEbznGEiBYPibJK/gIIBBu5A4z5zhsB/jx/gFDIooCQkYP2uF8VqriekItIr3CzApubNvik2rqznDOhcBafx8DLq2NTh8b+C6DsugQ716pbAQusYpu/rKscHpE9BMW+eigv4X9W7WEdczqAzy4T0pv4B/YEsXX84xXe1Tdmk2N4jGXJI6dgyt78ILElbFY7MUSKtKseo+Xm5VK1yDosX3n0uRZcw580Yq63ltXMd1C0d3rr//CZ7XBUvBv/w7n2/vzpSMf91pRdy2S/jXdZ9PhywEFxhO//w+/ADlPWGm2oyE8QAAAABJRU5ErkJggg==',
  archer: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAADAFBMVEXXwqTDpIG+jWaZgnGTZE6kSVlgTEdWPTiNLFNNKzA2LDMvHisdFiQaEyIVDh4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABkqG0jAAAAEHRSTlP///////////////////8A4CNdGQAAAmVJREFUeNqVltuiozAIRUMSiUkA//9vZxO12h61HR760LLCHRqWIdK7LD9JGJ+WA7H9Dhj1wK3/BxAkcC4qLvqbBeIYc3XpqpeMSktNN0CLlJwpBIpEITbRjxSoMuEX1j1oMymcE6yAIIop6/ltwVuQlwWkVcwaEEgMzsSDaKt2oMTdDgBmeq2lgIrRES4b0tL6fEosywvoq2PmVHYkUt7ybINwfXi0A729PDarZRh5edU4EQBiXQ6gnFKyEgC2VxocTXCy2QG0M7ARMa/d0nLkznBKlhsLIAoI5gFoplIVcTwBsMHwo4otmmLpZspehAdAiszTVEXhWDPzPMryAKBboD9XRbWq2p95+AssNs/T3Ciz+/UTAIIpl/aufw943CkXFL7bj4DrtxlS5SeXXL/WyWM/27gFOEK/D/2KQL4CI16Toc+Uqn4BODLq69WAfgygHwFj2tKP+Sg+tccAXra36+veI3UQef/iCoB+sdM88SDkFiih1FMeN6fuAQ6lvNXWOpYcZlSvAeh/rmWsLN8J7+29ja8wfby/dhUmNne9AFz/72a1MeLhDLTWIZLP+XkDsHHpNNM2EWEg85H/5TNsynRYsMkFdnO5PlxW3gDFto1TTeiYajcAggi7S31GRNCPGcOidwD6aQd4mqL7nxhjf3MZJe+FCEtHvHNvFIs3/w2gXoi2AuMS9jD0n4HY9yxpC7HCL0yX9HYlveIyhbIfFGnUEIjHbLrLeoPHhyrGIodMebtx2rm7Pw9/H6z5XULc+xWVsUkfDrrgAuT6OoqLvm+fSxutH0dx0W/6H1vDvfrt788/+wxrasqAbugAAAAASUVORK5CYII=',
  assassin: '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',
  hunter: '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',
  mage: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAADAFBMVEXt1KXWq2+TnYIBmubBiF/WaoGSeFiFXzyiS1qeL1xeRj5QKjgvIjghEzcTDDMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACz5yfBAAAAEHRSTlP///////////////////8A4CNdGQAAAVZJREFUeNqV1FGWwyAIBVBpUBQR97/bks45nSSNSvLZcgPybEOfP8KXD8ICJGhe0JL0zgHYDSC8OMSMTViWYNvs7ZAhxpgTQHWdoUGO0VpkTOoAkgBzDCHEcmxwC/Z5bD2p7PUmGBO3OTChgn8i5mJYJmD7gO8ZbE9U23okGwpLLDEWW+wqhw/QFyFCyUCgnuD4hZAqIjLuYW9LkEKg0hiotz3oNVAGIG1JvLeVAhHWrt0JJDGS3nwxAjUhc38AmCrrccsLIEiil+SngPH7/n6qHwABkkvwU6AJq94UD0EFaqN8wryBD9gFGtbfAbUfTH8CBndiCBSoPgF6zMwD2imzNbCVThv8gLpocAWCWPUBEFtp636gKaDoE1DyLORfUGOp8gC0HMtqohPYG6zqj0Dtn3o10Am4GhyAr8E/sEvkafAFSgHQ0eAIlrfiDISWIV/OYI8HvAGskXxttF5hzwAAAABJRU5ErkJggg==',
  warlock: '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',
  summoner: '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',
  necromancer: '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',
  cleric: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAADAFBMVEX2467oyYzYt3zLpXLjcq7jca3GimWqelTHbXySXz6cO1ZEODsoHCgZEyYRDyAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD+WNwhAAAAEHRSTlP///////////////////8A4CNdGQAAAgRJREFUeNqNle22hCAIRfE7RPT93/aCzTSZ1s0/utSdwsETtHXz3q8XYJ4KJyC8AfadPhzjd8C+//EEP9xpP2ZaOwMhXIF5abzSLzG8t2Mh3MTwXWA2ABC/RPDtFugEl2RctA75ep8pS/u3KIHFnJzdiSUw6EoACbacjC0PSvszYDJsGxnLc3ww57xRhJS37GziOYMLpRsTRCKUG9VZ1RUgd4qIaFz9r1qZpLVWBUjxA8hMqTcAsxW9CvMBVGaZQeYbQPIiekkzST5s+1AUTLQGGI1BTFZaJMiZ+n5UPU4E9MfV3xcn0UsFS6loTyQj6goq8Nm1A0Hl52Qwbx2o0m+5KCA9GqoqVC+18UqqF+oJCvYTcOsn1HUM0cXsjDRHWWLQkRHFXVwDrRQJW+JGVKWLtTrUmZsstcokO7iqcJikNKo0maFab5SuXEr5Kd2LVWZ4rXQYiu8ArqswO0AvvuRGYCrvMD65GC/AQcDKigjc9UrHk4OVEw8x+Edv/djGGRhN4wJ4HxbAvS991xQQ4Ry3mYDF/p4lm77ASJzt/kjtBWg3wG+WjOhwAs4qrX4oHYh4BsLTL6sVAaRIraN3f1FGMGrGUR5/fQfIixMzztK9BayaAL0HxMjkTYt7l3cAqaNJCA7fAeKopN6Rhrf8aPe1qDlRqe0lIDZwdfl/gKYGs9zf/gDVkG/7GqtkPwAAAABJRU5ErkJggg==',
  druid: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAADAFBMVEWMqkKSjz2rfTx2eTWVaTOHXC50Uy0/WShgQidGMSMkOyIhKB8nHSAUGR4QEB4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABD0JPxAAAAEHRSTlP///////////////////8A4CNdGQAAAY1JREFUeNqVldu6hCAIhU2Rgwm+/9turLloprYmF1308ctiQRbaLag/TFWtPUS4vdHghEaPXF8CoViO4IHaWilFJ0BKhDFLFYysJYQwAVohisDSmgAIhZCGkpIfmCWCoDTrQKIyBEryAO+XuZlzprOmlYgQ0NxTidh90jGQQtKawVuo0Zt2D7Z9CLiNzcRdkhi7rZsfMHGpz5lB+BgchVTaHHBH2QVV3T2fetEZYBkiYOa0weajozngq4RSLdHuRtNoDmd17Pne7J6Kr+140nQW4Nq3ew9bGQ+Okq+O+fLV82ugq/7nSbsAOkb2OaG0ua0pANdnNx4BZd/pFaDilkQXAI585Ov+DtDu6WFQ2F8B9XNdbIleVfA1wrNjfddD/6Ct/Rs3wCBibSuAF9AFwO88Him6AQJ5mH8D/Iapa0DmUQc3oCuqi8BY0Q9gnzVaADLbCuDXr6wAFnHi0S+Q46zAF2CSZx79AIC4AhgCTxVdgQowV3QFMANP868A+59/CcD8osBXDyJrgNmL/PYHBvV6i8lh2KcAAAAASUVORK5CYII=',
  shaman: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAADAFBMVEXVqnbNn23Jk261h1x9jIqjcUx1bF+TX0ePTEpgSDxUMDonNUcnGSYSDB4JCBsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABDYq7YAAAAEHRSTlP///////////////////8A4CNdGQAAAllJREFUeNqNlom26yAIRRWKCoLv///2HWzvlHQIK+m02DKTln8vxfzZr+Wl6iC7CjhbhNF1wMg8mAaAWOsSIKYkA3Zo+BWASRuN4USiVwAfYoNSf5wMPM+SDzO2AfF1CVhmNlzxuq7Vwd1cHRKX0rqWFO7C0vsT4gwsLqWw1MpAxucYllUAAoAIhMYnIEpKrTVvEJ+AYGscHcrRyDTjeA9YqRYK/dqRK5iQj0CxoAQqGrCS8EfAtLmkvireLwDMtTMA2e9XXCr1S5BYfhl0rC+gdTbqeAHBfbwAlO7OOhdWU4jproM9B5YW8seHIloNmvfCHRv8y4Jl70PmbN8h7Pab80UM6GVtTW+3KZx1oO2P4XvugRXnLEUz+D9vc6qksIx221/V4zbsCCytrVWeEzoZcZ86cbxbZ9YodAYwBiYFTuPQ2/3GNeBfYecnFrINcgJ+AWsN2eGYn2NYyqX3bl3CNjCnCwY1AaP63SE/gAvKqt4xzh3ayBB6GwXH+bDcTwBMDDVfOTvUwPF2UDNmEjlbyG2RkiuAxHfDgjDkS+TX4B27dXU0q2AvyaPW2N+K2Nar9l5ecvz93t7YM5FN4P5yHtaihwXK5vi8NTIInG19z/UVoGmGyz3rBZf0uMlOe0nq6DmZe+911OT9TGdWK5IvyAwuPIKuAJUzL245F7Djb4CFMoDgkSX0PUjHtXEARFVw6N7yjg3FiPpv2AcAqyjruic/FN2IVvrr09FCNqY+Hm0B9VPYBwADQF0fq2WpYNp6j3dZcjj9/Xdh5fNB1/tKR8SPRqT8VfgPw6BoAwSx/fwAAAAASUVORK5CYII=',
  bard: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAADAFBMVEXgtX3crnTVpm6+lmaqgFlIgqIAjuiIZVF7TTtgSTpSOS4+KCkjGyURDiAMChwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAApfsr0AAAAEHRSTlP///////////////////8A4CNdGQAAAmlJREFUeNqVlo0OIisMhaFtLP0B3/9t7wF11xkH14uJ0eR87SktzJT7ad2w7l9WOYv/B3C7bYDhovY7MHrXUkrmBpg/3tQj2yg1lUhG/wBeP96AiDQ2MTPiHL8A7izBoQDiB+AO/1UoJYr6LsOh6NGIi4hS88yZ4gycdmkktExFWiTK+TdgisXMLdPjYOnPlh6AASvsJM172Kr5BdzegTf9NM9m03/0+xVw6LGpzDXN9Ozj0OkrILA73MQtx8Xwfc5oZyTwEh59bMb7aGjqleKYYA+kL/8SftBvge61IYXGMf41gBPQmay2qX/u5h6AGK2d+4OPx1l/AnBeYJuwln+2PBk6AmOoSq04jyTIwVz5I8E7MKzRVGOxrE+t/gUIlymfGXj6EsYf31tKXbEno8KKTZ1/zTdFj07LPIKTKmmRB+wtL4ERWqcbEk01E6lSKhEsbYBuSIAlPdVVE5agp0rXwOiI/9Kbt04+5VTRucsaRudpoJbsqp27afACLNolkLYS4P40w41lml1mirIBRjwSIIOFa2gAmAm2gD0KrATLmtj6TDSZaniz2AGVMDqC+KYdpddC34EqmDtSNqToabMlJGEtrkZjAqXhBOBSxFCg6EcTGhJ86P9mmIQw7tHVQnyrtR0QGGsS3FpIQKtlMz4MWfbLh2KGYA+5NRxKeQK4vlr7PD7PWeqN4Qq29AFUFm+Xhp7A6C5lzY6u8CyJ+O1K/xpvx6OMV/vQD86A3Pv4AuDZF7Huas2c4dHv8e1NYCTu0FiYreVjfH91QBkxfc9azXfhD7fGmL4cYkf08cvLCWQj8aD5osb6D12zZSoEhch2AAAAAElFTkSuQmCC',
  alchemist: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAADAFBMVEX49/rq6u/KzeG6tcjHmreKk70skOPTYpfDSIaoTnJVUW6WLGdDIEYOEzUMEDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACxhD7pAAAAEHRSTlP///////////////////8A4CNdGQAAAfZJREFUeNqtlQmSxCAIRV2jUbTvf9sBNAaTmJ6pGqr3/Bc/SKP63KKecb/4UeLz1vTJjahvwLbprQN7CAFf9v0LsDUAdg7ICR5MXS2VWiGhPGOk9JCGumZcdC17BkgAULX+FVBRio9CQBmG18AUJ7C9AYbD2sMSVbAT6rZtJdmu96mUs4IzMFbEOiWbkudIRRZdWjpvQIDxlvXWS0AmLSwSoL1G/9YaAcxl3eYVtP134JI0AeYLIOv6N6DQxlnWW48bXeorUCrJcYMZIIKYNVD4/saoAyCiduKhNUhuTOukpveMMHHUUc1+rFYYEiCkPK5A97dGNcDaO3HJQejV0d0DEMQMaKE3pG/QCvANaLvG98Z6uTegEWb4d/StAeUK0AbQ+MLLIUQM/BKiwx9jzFkQEohhzMjQo31aABknpOsyN97wGZcAGok49cRKFPvKEuzs3unYg+clxxvgtJoJGrQrgERUyhNwjpBVlSgJ9K9CHIFlXVmirHPbgFMfeYUsm2nqJV5iSI80AJbN15ZoeuyinvYLoCEffqgJI3UF65+ARow1AncRG4LnP1A7GijFToS9+cmTfhoCNGN0noL9TCfjPGaYABGJ/NeXQUaJJBG0Y7AcZHjk4CEFrOsYlELH0RLwHtoJLUzRr0tLfLC9yR/Gvb/E9foPp4hfpebVHMMAAAAASUVORK5CYII=',
  sorcerer: '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',
  paladin: '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',
};

function renderJobIconPNG(jobKey, x, y, size) {
  const b64 = JOB_ICON_PNG[jobKey] || JOB_ICON_PNG.warrior;
  const href = 'data:image/png;base64,' + b64;
  const pix = 'image-rendering:pixelated;image-rendering:crisp-edges;-ms-interpolation-mode:nearest-neighbor';
  return `<image x="${x}" y="${y}" width="${size}" height="${size}" style="${pix}"`
       + ` image-rendering="pixelated" href="${href}" xlink:href="${href}"/>`;
}

function pixelSprite(x, y, jobKey) {
  const SC = 3;
  const icons = jobIcons();
  const data = icons[jobKey] || icons['warrior'];
  let out = '';
  data.forEach(([px, py, col]) => {
    out += `<rect x="${x+px*SC}" y="${y+py*SC}" width="${SC}" height="${SC}" fill="${col}"/>`;
  });
  return out;
}

function renderPixel(params) {
  const W = 470, PAD = 16;
  const pp   = (params.get('p')    || '이름§전사§1§0').split('§');
  const ss   = (params.get('s')    || '80§100§55§100§90§100').split('§');
  const stat = (params.get('stat') || '72§58§85§66§40').split('§');
  const eq   = (params.get('eq')   || '목검§면갑§낡은반지').split('§');
  const bufs = params.get('buf') ? params.get('buf').split('§') : [];

  const name = esc(pp[0]||'???'), job = esc(pp[1]||''), lv = safeInt(pp[2],1,1,999), exp = safeInt(pp[3],0);
  const hp=safeInt(ss[0],80),hpMax=safeInt(ss[1],100,1,9999);
  const mp=safeInt(ss[2],55),mpMax=safeInt(ss[3],100,1,9999);
  const sp=safeInt(ss[4],90),spMax=safeInt(ss[5],100,1,9999);
  const ATK=safeInt(stat[0],50,0,99), DEF=safeInt(stat[1],50,0,99), AGI=safeInt(stat[2],50,0,99);
  const MAG=safeInt(stat[3],50,0,99), LUK=safeInt(stat[4],50,0,99);
  const wpn=esc(eq[0]||'—'), arm=esc(eq[1]||'—'), acc=esc(eq[2]||'—');

  // 아바타 (직업 아이콘)
  const avKey = (params.get('av') || 'warrior').toLowerCase();

  const TITLEBAR_H=22, HEADER_H=84, VITAL_H=114, STAT_H=96, EQ_H=84;
  const BUF_H = bufs.length > 0 ? 42 : 0;
  const FOOTER_H = 22;
  const TOTAL_H = TITLEBAR_H+HEADER_H+VITAL_H+STAT_H+EQ_H+BUF_H+FOOTER_H;
  const INNER_W = W-PAD*2, BAR_LX = PAD+40, BAR_W = INNER_W-40-60;
  const pdiv = (yy) => `<rect x="0" y="${yy}" width="${W}" height="3" fill="#000"/><rect x="0" y="${yy+1}" width="${W}" height="1" fill="#2a2040"/>`;

  let y = 0, svg = '';

  // 타이틀바
  svg += `<rect x="0" y="0" width="${W}" height="${TITLEBAR_H}" fill="#8888CC"/>
<rect x="0" y="${TITLEBAR_H-3}" width="${W}" height="3" fill="#000"/>
<text x="${W/2}" y="15" font-family="monospace" font-size="11" fill="#000" text-anchor="middle" letter-spacing="2" font-weight="bold">STATUS</text>`;
  y = TITLEBAR_H;

  // 헤더
  svg += `<rect x="0" y="${y}" width="${W}" height="${HEADER_H}" fill="#0d0d1e"/>
${renderJobIconPNG(avKey, PAD, y+8, 48)}
<text x="${PAD+58}" y="${y+24}" font-family="monospace" font-size="16" font-weight="bold" fill="#DDAACC">${name}</text>
<text x="${PAD+58}" y="${y+40}" font-family="monospace" font-size="10" font-weight="bold" fill="#8a80a0" letter-spacing="1">${job}</text>
<text x="${PAD+58}" y="${y+56}" font-family="monospace" font-size="12" font-weight="bold" fill="#8888CC">LV.${lv}</text>
<text x="${PAD}" y="${y+HEADER_H-16}" font-family="monospace" font-size="9" font-weight="bold" fill="#6a6080">EXP</text>
${pixelBar(PAD+32, y+HEADER_H-26, INNER_W-32, 12, exp, 100, 'exp')}
<text x="${W-PAD}" y="${y+HEADER_H-16}" font-family="monospace" font-size="10" font-weight="bold" fill="#884499" text-anchor="end">${exp}%</text>
${pdiv(y + HEADER_H)}`;
  y += HEADER_H;

  // HP/MP/SP
  svg += `<rect x="0" y="${y}" width="${W}" height="${VITAL_H}" fill="#0a0a1a"/>`;
  [{label:'HP',val:hp,max:hpMax,type:'hp',icon:'♥'},{label:'MP',val:mp,max:mpMax,type:'mp',icon:'✦'},{label:'SP',val:sp,max:spMax,type:'sp',icon:'⚡'}].forEach((v,i) => {
    const vy = y+12+i*34; const pct = Math.min(100, Math.round((v.val/v.max)*100));
    svg += `<text x="${PAD}" y="${vy+16}" font-family="monospace" font-size="12" font-weight="bold" fill="${pixelBarColor(v.type, pct)}">${v.icon} ${v.label}</text>
${pixelBar(BAR_LX, vy+4, BAR_W, 14, v.val, v.max, v.type)}
<text x="${W-PAD}" y="${vy+16}" font-family="monospace" font-size="11" font-weight="bold" fill="${pixelBarColor(v.type, pct)}" text-anchor="end">${v.val}/${v.max}</text>`;
  });
  svg += pdiv(y + VITAL_H);
  y += VITAL_H;

  // STATS
  const stats = [{label:'ATK',val:ATK,type:'atk'},{label:'DEF',val:DEF,type:'def'},{label:'AGI',val:AGI,type:'agi'},{label:'MAG',val:MAG,type:'mag'},{label:'LUK',val:LUK,type:'luk'}];
  const SBAW = Math.floor((INNER_W-16)/2) - 48;
  svg += `<rect x="0" y="${y}" width="${W}" height="${STAT_H}" fill="#0d0d1e"/>
<text x="${PAD}" y="${y+16}" font-family="monospace" font-size="9" font-weight="bold" fill="#5a5078" letter-spacing="2">▸ STATS</text>`;
  stats.forEach((s,i) => {
    const col=i%2, row=Math.floor(i/2);
    const sx=PAD+col*Math.floor(INNER_W/2)+(col?8:0), sy=y+22+row*24, bx=sx+38;
    svg += `<text x="${sx}" y="${sy+14}" font-family="monospace" font-size="11" font-weight="bold" fill="#6a6080">${s.label}</text>
${pixelStatBar(bx, sy+4, SBAW, 10, s.val, s.type)}
<text x="${bx+SBAW+6}" y="${sy+14}" font-family="monospace" font-size="11" font-weight="bold" fill="${pixelBarColor(s.type, s.val)}">${s.val}</text>`;
  });
  svg += pdiv(y + STAT_H);
  y += STAT_H;

  // EQUIPMENT
  const eqItems = [{type:'WEAPON',name:wpn},{type:'ARMOR',name:arm},{type:'ACC',name:acc}];
  svg += `<rect x="0" y="${y}" width="${W}" height="${EQ_H}" fill="#0a0a1a"/>
<text x="${PAD}" y="${y+14}" font-family="monospace" font-size="9" font-weight="bold" fill="#5a5078" letter-spacing="2">▸ EQUIPMENT</text>`;
  eqItems.forEach((e,i) => {
    const ex = PAD+i*Math.floor(INNER_W/3), ey = y+20, slotW = Math.floor(INNER_W/3)-4;
    // pixel은 등급 입력 없음 — 인디고 통일색 사용
    const iconColor = '#8888CC';
    // 가운데 정렬: 아이콘 24px 기준 scale 1.2 → 28.8px. iconY를 살짝 위로 올려 라벨 가림 방지
    const iconScale = 1.2;
    const iconSize = 24 * iconScale;
    const iconX = ex + slotW/2 - iconSize/2;
    const iconY = ey - 1;
    svg += `<rect x="${ex}" y="${ey}" width="${slotW}" height="54" fill="#000" stroke="#2a2040" stroke-width="2"/>
${equipIcon(e.type, iconColor, iconX, iconY, iconScale)}
<text x="${ex+slotW/2}" y="${ey+38}" font-family="monospace" font-size="8" font-weight="bold" fill="#5a5078" text-anchor="middle" letter-spacing="1">${e.type}</text>
<text x="${ex+slotW/2}" y="${ey+50}" font-family="monospace" font-size="10" font-weight="bold" fill="#8888CC" text-anchor="middle">${e.name.length>7?e.name.slice(0,7)+'…':e.name}</text>`;
  });
  svg += pdiv(y + EQ_H);
  y += EQ_H;

  // BUFFS
  if (bufs.length > 0) {
    svg += `<rect x="0" y="${y}" width="${W}" height="${BUF_H}" fill="#0d0d1e"/>`;
    let bx = PAD;
    bufs.slice(0,6).forEach(buf => {
      const isD = buf.startsWith('!'); const label = esc(isD ? buf.slice(1) : buf);
      const bcol = isD ? '#BB6688' : '#8888CC'; const bw = label.length*8+20;
      svg += `<rect x="${bx}" y="${y+8}" width="${bw}" height="22" fill="#000" stroke="${bcol}" stroke-width="2"/>
<text x="${bx+bw/2}" y="${y+23}" font-family="monospace" font-size="10" font-weight="bold" fill="${bcol}" text-anchor="middle">${label}</text>`;
      bx += bw + 4;
    });
    y += BUF_H;
  }

  // 하단 바
  svg += `<rect x="0" y="${y}" width="${W}" height="3" fill="#000"/>
<rect x="0" y="${y+3}" width="${W}" height="${FOOTER_H-3}" fill="#8888CC"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${TOTAL_H}" viewBox="0 0 ${W} ${TOTAL_H}">
<rect width="${W}" height="${TOTAL_H}" fill="#080814"/>
<rect x="0" y="0" width="${W}" height="${TOTAL_H}" fill="none" stroke="#8888CC" stroke-width="4"/>
<rect x="4" y="4" width="${W-8}" height="${TOTAL_H-8}" fill="none" stroke="#000" stroke-width="2"/>
${svg}
</svg>`;
}

// ════════════════════════════════════════════
//  ENDING
//  &type=bad/normal/good/true
//  &num=숫자
//  &name=엔딩이름
//  &text=플레이버텍스트
//  &cond=조건1§조건2
//  &char=캐릭터1|캐릭터2
// ════════════════════════════════════════════

function renderEnding(params) {
  const W = 600, PAD = 32;
  const type  = (params.get('type') || 'normal').toLowerCase();
  const num   = esc(params.get('num') || '');
  const name  = esc(params.get('name') || '???');
  const rawText = params.get('text') || '';
  const textLines = rawText ? rawText.split('§').map(esc) : [];
  const conds = params.get('cond') ? params.get('cond').split('§').map(esc) : [];
  const chars = params.get('char') ? params.get('char').split('|').map(esc) : [];

  const themes = {
    bad:    { bg:'#110a0a', border:'#4a2020', accent:'#BB6688', accentDim:'#9a5060', textMain:'#f0c8c8', textSub:'#a87878', label:'BAD ENDING',    deco:'BAD'  },
    normal: { bg:'#0d0d18', border:'#3a3060', accent:'#8888CC', accentDim:'#6668AA', textMain:'#d8d6f0', textSub:'#9898b8', label:'NORMAL ENDING', deco:'END'  },
    good:   { bg:'#0a100d', border:'#285038', accent:'#6ab87a', accentDim:'#4a8858', textMain:'#c0e8c8', textSub:'#78a880', label:'GOOD ENDING',   deco:'END'  },
    true:   { bg:'#0d0a14', border:'#4a3868', accent:'#CCAA88', accentDim:'#aa8858', textMain:'#f0e0c0', textSub:'#c0a878', label:'TRUE ENDING',   deco:'TRUE' },
  };
  const th = themes[type] || themes.normal;

  // 패턴 (타입별 고유)
  const patDefs = {
    bad:    { w:48, h:48, inner:`<polyline points="0,12 6,8 10,16 18,6 24,14 30,4 36,10 42,2 48,9" fill="none" stroke="rgba(187,102,136,0.16)" stroke-width="0.8"/><polyline points="8,30 14,26 20,34 28,24 32,32 38,22 44,28 48,20" fill="none" stroke="rgba(187,102,136,0.10)" stroke-width="0.7"/><polyline points="0,42 5,38 12,46 18,36 22,44 30,38 36,46 42,40 48,44" fill="none" stroke="rgba(187,102,136,0.12)" stroke-width="0.6"/><polyline points="2,0 8,4 14,0 20,6 26,0 32,5 38,0 44,4 48,0" fill="none" stroke="rgba(187,102,136,0.06)" stroke-width="0.5"/>` },
    normal: { w:20, h:8,  inner:`<line x1="0" y1="4" x2="6" y2="4" stroke="rgba(136,137,205,0.15)" stroke-width="0.8"/>` },
    good:   { w:18, h:18, inner:`<polygon points="9,1 17,9 9,17 1,9" fill="none" stroke="rgba(106,184,122,0.14)" stroke-width="0.8"/>` },
    true:   { w:16, h:16, inner:`<circle cx="8" cy="8" r="1" fill="rgba(204,170,136,0.18)"/>` },
  };
  const pat = patDefs[type] || patDefs.normal;

  // 높이 계산
  const HAS_META = conds.length > 0 || chars.length > 0;
  const META_H = HAS_META ? 16 + 16 + Math.max(conds.length * 20, 28) + 16 : 0;
  const TOTAL_H = PAD + 16 + (num ? 22 : 0) + 30 + 20 + (textLines.length * 22 + 10) + META_H + PAD;

  let y = 0, svg = '';

  // defs — 패턴 + 디바이더 그라데이션
  const defs = `<defs>
  <pattern id="ep" width="${pat.w}" height="${pat.h}" patternUnits="userSpaceOnUse">${pat.inner}</pattern>
  <linearGradient id="div-grad" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
    <stop offset="0%" stop-color="${th.accent}" stop-opacity="0.9"/>
    <stop offset="55%" stop-color="${th.accent}" stop-opacity="0.4"/>
    <stop offset="100%" stop-color="${th.accent}" stop-opacity="0"/>
  </linearGradient>
</defs>`;

  // 배경
  svg += `<rect width="${W}" height="${TOTAL_H}" fill="${th.bg}"/>
<rect width="${W}" height="${TOTAL_H}" fill="url(#ep)"/>
<rect x="1" y="1" width="${W-2}" height="${TOTAL_H-2}" fill="none" stroke="${th.border}" stroke-width="1.5" rx="6"/>`;

  // 워터마크
  svg += `<text x="${W-PAD}" y="${PAD+44}" font-family="monospace" font-size="64" font-weight="bold" fill="${th.accent}" opacity="0.05" text-anchor="end">${th.deco}</text>`;

  y = PAD;

  // 태그 라벨
  svg += `<text x="${PAD}" y="${y+13}" font-family="monospace" font-size="10" font-weight="bold" fill="${th.accent}" letter-spacing="3">${th.label}</text>`;
  y += 22;

  // ED 번호
  if (num) {
    svg += `<text x="${PAD}" y="${y+13}" font-family="monospace" font-size="11" fill="${th.accentDim}" letter-spacing="2">ED · ${num}</text>`;
    y += 22;
  }

  // 엔딩 이름
  svg += `<text x="${PAD}" y="${y+26}" font-family="Georgia,'Noto Serif KR',serif" font-size="22" font-weight="bold" fill="${th.textMain}" letter-spacing="1">${name}</text>`;
  y += 36;

  // 디바이더
  svg += `<rect x="${PAD}" y="${y}" width="${W - PAD*2}" height="1" fill="url(#div-grad)"/>`;
  y += 18;

  // 플레이버 텍스트
  textLines.forEach(line => {
    svg += `<text x="${PAD}" y="${y+14}" font-family="Georgia,'Noto Serif KR',serif" font-size="13" fill="${th.textSub}">${line}</text>`;
    y += 22;
  });
  y += 10;

  // 메타
  if (HAS_META) {
    svg += `<rect x="${PAD}" y="${y}" width="${W-PAD*2}" height="1" fill="${th.border}" opacity="0.6"/>`;
    y += 16;

    // cond 왼쪽, char 오른쪽
    const midX = Math.floor(W / 2);

    if (conds.length > 0) {
      svg += `<text x="${PAD}" y="${y+11}" font-family="monospace" font-size="9" fill="${th.accent}" letter-spacing="2" opacity="0.8">CONDITION</text>`;
      let cy = y + 22;
      conds.forEach(cond => {
        svg += `<text x="${PAD}" y="${cy+11}" font-family="Georgia,'Noto Serif KR',serif" font-size="12" fill="${th.textSub}">· ${cond}</text>`;
        cy += 20;
      });
    }

    if (chars.length > 0) {
      const cx0 = conds.length > 0 ? midX : PAD;
      svg += `<text x="${cx0}" y="${y+11}" font-family="monospace" font-size="9" fill="${th.accent}" letter-spacing="2" opacity="0.8">CHARACTER</text>`;
      let cx = cx0;
      const pillY = y + 26;
      chars.forEach(char => {
        const pw2 = char.length * 10 + 24;
        svg += `<rect x="${cx}" y="${pillY-13}" width="${pw2}" height="22" rx="11" fill="${th.accent}22" stroke="${th.accent}66" stroke-width="1"/>
<text x="${cx+pw2/2}" y="${pillY+4}" font-family="Georgia,'Noto Serif KR',serif" font-size="12" fill="${th.accent}" text-anchor="middle">${char}</text>`;
        cx += pw2 + 8;
      });
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${TOTAL_H}" viewBox="0 0 ${W} ${TOTAL_H}">
${defs}
${svg}
</svg>`;
}

// ════════════════════════════════════════════
//  RPG2K (쯔꾸르 호러/어드벤처)
//  &p=이름§부제목§위치§장
//  &hp=현재§최대§모드     (모드: heart/rose/moon/eye/spark, 기본 heart)
//  &items=아이템1|아이템2|...   (최대 12개)
//  &log=일지1§일지2§...          (최대 4줄)
//  &say=하단 대사
// ════════════════════════════════════════════

function rpg2kIconColor(mode) {
  if (mode === 'heart') return '#BB6688';
  if (mode === 'rose')  return '#BB6688';
  if (mode === 'moon')  return '#CCAA88';
  if (mode === 'eye')   return '#DDAACC';
  if (mode === 'spark') return '#CCAA88';
  return '#BB6688';
}

function rpg2kAliveIcon(mode, phase, hpCur) {
  if (mode === 'heart') {
    return `<path d="M14 24 C8 18, 2 14, 2 8 C2 4, 6 2, 10 4 C12 5, 14 8, 14 8 C14 8, 16 5, 18 4 C22 2, 26 4, 26 8 C26 14, 20 18, 14 24 Z" fill="#BB6688"/>`;
  }
  if (mode === 'rose') {
    // 꽃잎 수 = hpCur (살아있는 꽃은 다 같은 꽃잎 수)
    // hpCur가 1이면 한 잎짜리 꽃, 7이면 일곱 잎. 0은 안 들어옴(살아있는 케이스만).
    const petals = Math.max(1, Math.min(hpCur || 5, 12));
    const cx = 14, cy = 14;
    // 꽃잎 많을수록 살짝 작게
    const ry = petals >= 6 ? 4 : 5;
    const rx = petals >= 6 ? 2 : 2.5;
    const dist = petals >= 6 ? 5.5 : 5;
    let out = '';
    for (let i = 0; i < petals; i++) {
      const angle = (360 / petals) * i - 90;
      const rad = angle * Math.PI / 180;
      const px = cx + Math.cos(rad) * dist;
      const py = cy + Math.sin(rad) * dist;
      const rot = (angle + 90).toFixed(0);
      out += `<ellipse cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" rx="${rx}" ry="${ry}" fill="#BB6688" transform="rotate(${rot} ${px.toFixed(1)} ${py.toFixed(1)})"/>`;
    }
    out += `<circle cx="${cx}" cy="${cy}" r="2.5" fill="#8a3a55"/>`;
    out += `<circle cx="${cx}" cy="${cy}" r="1.2" fill="#DDAACC"/>`;
    return out;
  }
  if (mode === 'moon') {
    const C = '#CCAA88', D = '#2a2030';
    if (phase >= 0.98) {
      // 보름달
      return `<circle cx="14" cy="14" r="11" fill="${C}"/>
<circle cx="17" cy="11" r="2" fill="#DDAACC" opacity="0.5"/>`;
    }
    // 연속 보간:
    // phase=0.5 → 안쪽 호 rx=0 (반달)
    // phase=1.0 → rx=11, sweep=1 (왼쪽으로 볼록 = 거의 보름)
    // phase=0   → rx=11, sweep=0 (오른쪽으로 오목 = 거의 신월)
    const rx = Math.abs(phase - 0.5) * 22;
    const sweep = phase >= 0.5 ? 1 : 0;
    return `<circle cx="14" cy="14" r="11" fill="${D}"/>
<path d="M14 3 A11 11 0 0 1 14 25 A${rx.toFixed(1)} 11 0 0 ${sweep} 14 3 Z" fill="${C}"/>`;
  }
  if (mode === 'eye') {
    return `<path d="M 15.0,11.7 L 14.9,11.8 L 14.8,11.8 L 14.7,11.9 L 14.6,11.9 L 14.3,12.2 L 14.3,12.3 L 14.2,12.3 L 14.2,12.5 L 14.1,12.6 L 14.1,13.2 L 14.2,13.2 L 14.2,13.3 L 14.3,13.4 L 14.3,13.5 L 14.5,13.7 L 14.6,13.7 L 14.7,13.8 L 14.8,13.8 L 14.8,13.9 L 15.6,13.9 L 15.7,13.8 L 15.7,13.8 L 16.1,13.4 L 16.1,13.2 L 16.2,13.2 L 16.2,12.5 L 16.1,12.4 L 16.1,12.3 L 16.1,12.3 L 16.1,12.2 L 15.7,11.9 L 15.7,11.9 L 15.6,11.8 L 15.4,11.8 L 15.3,11.7 L 15.0,11.7 M 13.4,8.9 L 13.3,9.0 L 12.9,9.0 L 12.8,9.0 L 12.7,9.0 L 12.6,9.1 L 12.3,9.1 L 12.3,9.2 L 12.2,9.2 L 12.1,9.3 L 11.9,9.3 L 11.9,9.4 L 11.8,9.4 L 11.7,9.4 L 11.6,9.4 L 11.5,9.6 L 11.4,9.6 L 11.3,9.7 L 11.2,9.7 L 11.1,9.8 L 11.0,9.8 L 9.9,10.9 L 9.9,11.0 L 9.8,11.1 L 9.8,11.2 L 9.6,11.4 L 9.6,11.5 L 9.5,11.5 L 9.5,11.6 L 9.4,11.7 L 9.4,11.8 L 9.4,11.9 L 9.4,12.0 L 9.3,12.1 L 9.3,12.2 L 9.2,12.3 L 9.2,12.4 L 9.1,12.5 L 9.1,12.7 L 9.0,12.7 L 9.0,13.1 L 9.0,13.2 L 9.0,14.9 L 9.0,15.0 L 9.0,15.3 L 9.1,15.3 L 9.1,15.6 L 9.2,15.7 L 9.2,15.7 L 9.3,15.8 L 9.3,16.0 L 9.4,16.1 L 9.4,16.1 L 9.4,16.2 L 9.4,16.3 L 9.5,16.4 L 9.5,16.5 L 9.6,16.5 L 9.6,16.6 L 9.8,16.8 L 9.8,16.9 L 9.9,17.0 L 9.9,17.1 L 10.3,17.5 L 10.3,17.6 L 10.4,17.6 L 11.0,18.2 L 11.1,18.2 L 11.2,18.3 L 11.3,18.3 L 11.5,18.5 L 11.5,18.5 L 11.6,18.6 L 11.7,18.6 L 11.8,18.6 L 11.9,18.6 L 11.9,18.7 L 12.0,18.7 L 12.1,18.8 L 12.3,18.8 L 12.3,18.9 L 12.5,18.9 L 12.6,19.0 L 12.7,19.0 L 12.8,19.0 L 13.2,19.0 L 13.3,19.1 L 14.7,19.1 L 14.8,19.0 L 15.2,19.0 L 15.3,19.0 L 15.4,19.0 L 15.5,18.9 L 15.7,18.9 L 15.7,18.8 L 15.9,18.8 L 16.0,18.7 L 16.1,18.7 L 16.1,18.6 L 16.2,18.6 L 16.3,18.6 L 16.4,18.6 L 16.5,18.5 L 16.5,18.5 L 16.6,18.4 L 16.7,18.4 L 16.9,18.2 L 16.9,18.2 L 17.2,18.0 L 17.3,18.0 L 18.0,17.3 L 18.0,17.2 L 18.2,16.9 L 18.2,16.9 L 18.4,16.7 L 18.4,16.6 L 18.5,16.5 L 18.5,16.5 L 18.6,16.4 L 18.6,16.3 L 18.6,16.2 L 18.6,16.1 L 18.7,16.1 L 18.7,16.0 L 18.8,15.9 L 18.8,15.7 L 18.9,15.7 L 18.9,15.5 L 19.0,15.4 L 19.0,15.2 L 19.0,15.1 L 19.0,14.8 L 19.1,14.7 L 19.1,13.2 L 19.0,13.2 L 19.0,12.8 L 19.0,12.7 L 19.0,12.5 L 18.9,12.4 L 18.9,12.3 L 18.8,12.2 L 18.8,12.1 L 18.7,12.0 L 18.7,11.9 L 18.6,11.7 L 18.6,11.6 L 18.5,11.5 L 18.5,11.5 L 18.4,11.4 L 18.4,11.3 L 18.2,11.1 L 18.2,11.1 L 18.1,10.9 L 18.1,10.8 L 17.2,9.9 L 17.1,9.9 L 16.9,9.7 L 16.8,9.7 L 16.7,9.6 L 16.6,9.6 L 16.5,9.5 L 16.5,9.5 L 16.3,9.4 L 16.1,9.4 L 16.1,9.3 L 16.0,9.3 L 15.9,9.2 L 15.8,9.2 L 15.7,9.1 L 15.5,9.1 L 15.4,9.0 L 15.3,9.0 L 15.2,9.0 L 14.8,9.0 L 14.7,8.9 L 13.4,8.9 M 13.3,10.6 L 13.4,10.5 L 14.7,10.5 L 14.8,10.6 L 15.0,10.6 L 15.1,10.7 L 15.3,10.7 L 15.3,10.7 L 15.4,10.7 L 15.5,10.8 L 15.6,10.8 L 15.7,10.9 L 15.7,10.9 L 15.8,11.0 L 15.9,11.0 L 16.1,11.2 L 16.2,11.2 L 16.8,11.8 L 16.8,11.9 L 17.0,12.1 L 17.0,12.2 L 17.2,12.3 L 17.2,12.5 L 17.3,12.6 L 17.3,12.7 L 17.3,12.7 L 17.3,12.8 L 17.4,12.9 L 17.4,13.2 L 17.5,13.2 L 17.5,13.6 L 17.6,13.7 L 17.6,14.2 L 17.5,14.3 L 17.5,14.8 L 17.4,14.8 L 17.4,15.0 L 17.3,15.1 L 17.3,15.3 L 17.3,15.3 L 17.3,15.4 L 17.2,15.5 L 17.2,15.6 L 17.1,15.7 L 17.1,15.7 L 16.9,15.9 L 16.9,16.0 L 16.8,16.1 L 16.8,16.2 L 16.2,16.8 L 16.1,16.8 L 15.9,17.0 L 15.8,17.0 L 15.7,17.1 L 15.7,17.1 L 15.6,17.2 L 15.5,17.2 L 15.4,17.3 L 15.3,17.3 L 15.3,17.3 L 15.1,17.3 L 15.0,17.4 L 14.8,17.4 L 14.7,17.5 L 13.4,17.5 L 13.3,17.4 L 13.1,17.4 L 13.0,17.3 L 12.8,17.3 L 12.7,17.3 L 12.7,17.3 L 12.6,17.2 L 12.5,17.2 L 12.4,17.1 L 12.3,17.1 L 12.3,17.0 L 12.2,17.0 L 12.0,16.9 L 11.9,16.9 L 11.1,16.1 L 11.1,16.0 L 11.0,15.8 L 11.0,15.7 L 10.9,15.7 L 10.9,15.6 L 10.8,15.5 L 10.8,15.4 L 10.7,15.3 L 10.7,15.2 L 10.7,15.1 L 10.7,14.9 L 10.6,14.8 L 10.6,14.5 L 10.5,14.4 L 10.5,13.6 L 10.6,13.6 L 10.6,13.2 L 10.7,13.1 L 10.7,12.9 L 10.7,12.8 L 10.7,12.7 L 10.8,12.6 L 10.8,12.5 L 10.9,12.4 L 10.9,12.3 L 11.1,12.2 L 11.1,12.1 L 11.1,12.0 L 11.1,11.9 L 11.9,11.1 L 12.0,11.1 L 12.2,11.0 L 12.3,11.0 L 12.3,10.9 L 12.4,10.9 L 12.5,10.8 L 12.6,10.8 L 12.7,10.7 L 12.7,10.7 L 12.8,10.7 L 13.0,10.7 L 13.1,10.6 L 13.3,10.6 M 13.0,5.9 L 12.9,6.0 L 12.2,6.0 L 12.1,6.1 L 11.6,6.1 L 11.5,6.1 L 11.1,6.1 L 11.1,6.2 L 10.7,6.2 L 10.7,6.3 L 10.4,6.3 L 10.3,6.4 L 10.1,6.4 L 10.0,6.5 L 9.8,6.5 L 9.7,6.5 L 9.5,6.5 L 9.4,6.6 L 9.3,6.6 L 9.2,6.7 L 9.0,6.7 L 9.0,6.8 L 8.8,6.8 L 8.7,6.9 L 8.6,6.9 L 8.5,6.9 L 8.4,6.9 L 8.3,7.0 L 8.1,7.0 L 8.1,7.1 L 8.0,7.1 L 7.9,7.2 L 7.8,7.2 L 7.7,7.3 L 7.6,7.3 L 7.5,7.3 L 7.4,7.3 L 7.3,7.4 L 7.3,7.4 L 7.2,7.5 L 7.1,7.5 L 7.0,7.6 L 6.9,7.6 L 6.9,7.7 L 6.8,7.7 L 6.7,7.7 L 6.6,7.7 L 6.5,7.9 L 6.4,7.9 L 6.3,8.0 L 6.2,8.0 L 6.1,8.1 L 6.1,8.1 L 6.0,8.1 L 5.9,8.1 L 5.7,8.3 L 5.6,8.3 L 5.5,8.5 L 5.4,8.5 L 5.3,8.6 L 5.2,8.6 L 5.1,8.7 L 5.0,8.7 L 4.8,8.9 L 4.8,8.9 L 4.5,9.1 L 4.4,9.1 L 4.2,9.4 L 4.1,9.4 L 3.9,9.6 L 3.8,9.6 L 3.4,10.0 L 3.3,10.0 L 2.7,10.7 L 2.6,10.7 L 1.6,11.6 L 1.6,11.7 L 1.0,12.3 L 1.0,12.3 L 0.6,12.7 L 0.6,12.8 L 0.4,13.1 L 0.4,13.2 L 0.2,13.4 L 0.2,13.5 L 0.1,13.6 L 0.1,13.6 L 0.0,13.7 L 0.0,14.3 L 0.1,14.4 L 0.1,14.4 L 0.2,14.5 L 0.2,14.6 L 0.4,14.8 L 0.4,14.9 L 0.6,15.2 L 0.6,15.3 L 1.0,15.7 L 1.0,15.7 L 1.6,16.3 L 1.6,16.4 L 2.6,17.3 L 2.7,17.3 L 3.3,18.0 L 3.4,18.0 L 3.8,18.4 L 3.9,18.4 L 4.1,18.6 L 4.2,18.6 L 4.4,18.9 L 4.5,18.9 L 4.8,19.1 L 4.8,19.1 L 5.0,19.3 L 5.1,19.3 L 5.2,19.4 L 5.2,19.4 L 5.4,19.5 L 5.5,19.5 L 5.6,19.7 L 5.7,19.7 L 5.9,19.9 L 6.0,19.9 L 6.1,19.9 L 6.1,19.9 L 6.2,20.0 L 6.3,20.0 L 6.4,20.1 L 6.5,20.1 L 6.6,20.3 L 6.7,20.3 L 6.8,20.3 L 6.9,20.3 L 6.9,20.4 L 7.0,20.4 L 7.1,20.5 L 7.2,20.5 L 7.3,20.6 L 7.3,20.6 L 7.4,20.7 L 7.5,20.7 L 7.6,20.7 L 7.7,20.7 L 7.8,20.8 L 7.9,20.8 L 8.0,20.9 L 8.1,20.9 L 8.1,21.0 L 8.3,21.0 L 8.4,21.1 L 8.5,21.1 L 8.6,21.1 L 8.7,21.1 L 8.8,21.2 L 9.0,21.2 L 9.0,21.3 L 9.2,21.3 L 9.3,21.4 L 9.4,21.4 L 9.5,21.5 L 9.7,21.5 L 9.8,21.5 L 10.0,21.5 L 10.1,21.6 L 10.3,21.6 L 10.4,21.7 L 10.7,21.7 L 10.7,21.8 L 11.1,21.8 L 11.1,21.9 L 11.5,21.9 L 11.5,21.9 L 12.1,21.9 L 12.2,22.0 L 12.9,22.0 L 13.0,22.1 L 15.1,22.1 L 15.2,22.0 L 15.9,22.0 L 16.0,21.9 L 16.5,21.9 L 16.5,21.9 L 16.9,21.9 L 16.9,21.8 L 17.3,21.8 L 17.3,21.7 L 17.7,21.7 L 17.8,21.6 L 18.0,21.6 L 18.1,21.5 L 18.2,21.5 L 18.3,21.5 L 18.6,21.5 L 18.6,21.4 L 18.8,21.4 L 18.9,21.3 L 19.0,21.3 L 19.1,21.2 L 19.3,21.2 L 19.4,21.1 L 19.4,21.1 L 19.5,21.1 L 19.7,21.1 L 19.8,21.0 L 19.9,21.0 L 19.9,20.9 L 20.1,20.9 L 20.2,20.8 L 20.3,20.8 L 20.3,20.7 L 20.4,20.7 L 20.5,20.7 L 20.6,20.7 L 20.7,20.6 L 20.7,20.6 L 20.8,20.5 L 21.0,20.5 L 21.1,20.4 L 21.1,20.4 L 21.3,20.3 L 21.4,20.3 L 21.5,20.2 L 21.5,20.2 L 21.6,20.1 L 21.7,20.1 L 21.9,19.9 L 21.9,19.9 L 22.0,19.9 L 22.1,19.9 L 22.2,19.8 L 22.3,19.8 L 22.4,19.6 L 22.5,19.6 L 22.7,19.4 L 22.8,19.4 L 22.9,19.3 L 23.0,19.3 L 23.1,19.2 L 23.2,19.2 L 23.4,19.0 L 23.5,19.0 L 23.7,18.7 L 23.8,18.7 L 24.0,18.5 L 24.1,18.5 L 24.4,18.2 L 24.5,18.2 L 25.1,17.6 L 25.2,17.6 L 26.5,16.2 L 26.5,16.1 L 27.0,15.7 L 27.0,15.6 L 27.4,15.3 L 27.4,15.2 L 27.6,14.9 L 27.6,14.8 L 27.8,14.6 L 27.8,14.5 L 27.9,14.4 L 27.9,14.3 L 28.0,14.2 L 28.0,13.8 L 27.9,13.7 L 27.9,13.6 L 27.8,13.5 L 27.8,13.4 L 27.6,13.2 L 27.6,13.1 L 27.4,12.8 L 27.4,12.7 L 27.0,12.4 L 27.0,12.3 L 26.5,11.9 L 26.5,11.8 L 25.2,10.4 L 25.1,10.4 L 24.6,9.9 L 24.5,9.9 L 24.1,9.5 L 24.0,9.5 L 23.8,9.3 L 23.7,9.3 L 23.5,9.0 L 23.4,9.0 L 23.2,8.8 L 23.1,8.8 L 22.9,8.6 L 22.8,8.6 L 22.8,8.6 L 22.7,8.6 L 22.5,8.4 L 22.4,8.4 L 22.3,8.2 L 22.2,8.2 L 22.1,8.1 L 22.0,8.1 L 21.9,8.0 L 21.8,8.0 L 21.7,7.9 L 21.6,7.9 L 21.5,7.8 L 21.5,7.8 L 21.4,7.7 L 21.3,7.7 L 21.1,7.6 L 21.1,7.6 L 21.0,7.5 L 20.9,7.5 L 20.8,7.4 L 20.7,7.4 L 20.6,7.3 L 20.5,7.3 L 20.4,7.3 L 20.3,7.3 L 20.3,7.2 L 20.2,7.2 L 20.1,7.1 L 19.9,7.1 L 19.9,7.0 L 19.8,7.0 L 19.7,6.9 L 19.5,6.9 L 19.4,6.9 L 19.4,6.9 L 19.3,6.8 L 19.1,6.8 L 19.0,6.7 L 18.9,6.7 L 18.8,6.6 L 18.6,6.6 L 18.6,6.5 L 18.3,6.5 L 18.2,6.5 L 18.1,6.5 L 18.0,6.4 L 17.8,6.4 L 17.7,6.3 L 17.4,6.3 L 17.3,6.2 L 17.0,6.2 L 16.9,6.1 L 16.5,6.1 L 16.5,6.1 L 16.0,6.1 L 15.9,6.0 L 15.2,6.0 L 15.1,5.9 L 13.0,5.9 M 12.6,8.1 L 12.7,8.1 L 15.4,8.1 L 15.5,8.1 L 16.0,8.1 L 16.1,8.2 L 16.5,8.2 L 16.5,8.3 L 16.8,8.3 L 16.9,8.4 L 17.2,8.4 L 17.3,8.5 L 17.4,8.5 L 17.5,8.6 L 17.8,8.6 L 17.8,8.6 L 18.0,8.6 L 18.1,8.7 L 18.2,8.7 L 18.3,8.8 L 18.5,8.8 L 18.6,8.9 L 18.6,8.9 L 18.7,9.0 L 18.9,9.0 L 19.0,9.0 L 19.1,9.0 L 19.2,9.1 L 19.3,9.1 L 19.4,9.2 L 19.4,9.2 L 19.5,9.3 L 19.6,9.3 L 19.7,9.4 L 19.8,9.4 L 19.9,9.4 L 19.9,9.4 L 20.0,9.5 L 20.1,9.5 L 20.2,9.6 L 20.3,9.6 L 20.3,9.7 L 20.4,9.7 L 20.5,9.8 L 20.6,9.8 L 20.7,9.8 L 20.7,9.8 L 20.9,10.0 L 21.0,10.0 L 21.1,10.1 L 21.1,10.1 L 21.3,10.2 L 21.4,10.2 L 21.5,10.3 L 21.5,10.3 L 21.8,10.6 L 21.9,10.6 L 22.0,10.7 L 22.1,10.7 L 22.3,10.9 L 22.4,10.9 L 22.7,11.2 L 22.8,11.2 L 23.1,11.5 L 23.2,11.5 L 23.7,12.1 L 23.8,12.1 L 24.9,13.2 L 24.9,13.2 L 25.3,13.7 L 25.3,13.8 L 25.5,14.0 L 25.5,14.0 L 25.3,14.2 L 25.3,14.3 L 24.9,14.8 L 24.9,14.8 L 23.8,15.9 L 23.7,15.9 L 23.2,16.5 L 23.1,16.5 L 22.8,16.8 L 22.7,16.8 L 22.4,17.1 L 22.3,17.1 L 22.1,17.3 L 22.0,17.3 L 21.9,17.4 L 21.8,17.4 L 21.6,17.6 L 21.5,17.6 L 21.4,17.8 L 21.3,17.8 L 21.1,17.9 L 21.1,17.9 L 21.0,18.0 L 20.9,18.0 L 20.7,18.2 L 20.7,18.2 L 20.6,18.2 L 20.5,18.2 L 20.4,18.3 L 20.3,18.3 L 20.3,18.4 L 20.2,18.4 L 20.1,18.5 L 20.0,18.5 L 19.9,18.6 L 19.9,18.6 L 19.8,18.6 L 19.7,18.6 L 19.6,18.7 L 19.5,18.7 L 19.4,18.8 L 19.4,18.8 L 19.3,18.9 L 19.2,18.9 L 19.1,19.0 L 19.0,19.0 L 18.9,19.0 L 18.7,19.0 L 18.6,19.1 L 18.6,19.1 L 18.5,19.2 L 18.3,19.2 L 18.2,19.3 L 18.1,19.3 L 18.0,19.4 L 17.8,19.4 L 17.8,19.4 L 17.5,19.4 L 17.4,19.5 L 17.3,19.5 L 17.2,19.6 L 16.9,19.6 L 16.8,19.7 L 16.5,19.7 L 16.5,19.8 L 16.1,19.8 L 16.0,19.9 L 15.5,19.9 L 15.4,19.9 L 12.7,19.9 L 12.6,19.9 L 12.1,19.9 L 12.0,19.8 L 11.6,19.8 L 11.5,19.7 L 11.3,19.7 L 11.2,19.6 L 10.9,19.6 L 10.8,19.5 L 10.6,19.5 L 10.5,19.4 L 10.3,19.4 L 10.2,19.4 L 10.1,19.4 L 10.0,19.3 L 9.8,19.3 L 9.7,19.2 L 9.6,19.2 L 9.5,19.1 L 9.4,19.1 L 9.3,19.0 L 9.1,19.0 L 9.0,19.0 L 9.0,19.0 L 8.9,18.9 L 8.8,18.9 L 8.7,18.8 L 8.6,18.8 L 8.5,18.7 L 8.4,18.7 L 8.3,18.6 L 8.2,18.6 L 8.1,18.6 L 8.1,18.6 L 8.0,18.5 L 7.9,18.5 L 7.8,18.4 L 7.7,18.4 L 7.7,18.3 L 7.6,18.3 L 7.4,18.2 L 7.3,18.2 L 7.3,18.1 L 7.2,18.1 L 7.1,18.0 L 7.0,18.0 L 6.9,17.8 L 6.8,17.8 L 6.7,17.8 L 6.6,17.8 L 6.5,17.6 L 6.4,17.6 L 6.2,17.4 L 6.1,17.4 L 6.0,17.3 L 5.9,17.3 L 5.6,17.0 L 5.6,17.0 L 5.2,16.7 L 5.2,16.7 L 4.8,16.4 L 4.8,16.4 L 4.2,15.8 L 4.1,15.8 L 3.3,15.0 L 3.3,14.9 L 2.7,14.3 L 2.7,14.2 L 2.5,14.0 L 2.5,14.0 L 2.7,13.8 L 2.7,13.7 L 3.3,13.1 L 3.3,13.0 L 4.0,12.3 L 4.1,12.3 L 4.8,11.6 L 4.8,11.6 L 5.2,11.3 L 5.2,11.3 L 5.6,11.0 L 5.6,11.0 L 5.9,10.7 L 6.0,10.7 L 6.1,10.6 L 6.2,10.6 L 6.4,10.4 L 6.5,10.4 L 6.6,10.2 L 6.7,10.2 L 6.8,10.2 L 6.9,10.2 L 7.0,10.0 L 7.1,10.0 L 7.2,9.9 L 7.3,9.9 L 7.4,9.8 L 7.5,9.8 L 7.6,9.7 L 7.7,9.7 L 7.7,9.6 L 7.8,9.6 L 7.9,9.5 L 8.0,9.5 L 8.1,9.4 L 8.1,9.4 L 8.2,9.4 L 8.3,9.4 L 8.4,9.3 L 8.5,9.3 L 8.6,9.2 L 8.7,9.2 L 8.8,9.1 L 8.9,9.1 L 9.0,9.0 L 9.0,9.0 L 9.1,9.0 L 9.3,9.0 L 9.4,8.9 L 9.5,8.9 L 9.6,8.8 L 9.7,8.8 L 9.8,8.7 L 10.0,8.7 L 10.1,8.6 L 10.2,8.6 L 10.3,8.6 L 10.5,8.6 L 10.6,8.5 L 10.8,8.5 L 10.9,8.4 L 11.1,8.4 L 11.2,8.3 L 11.5,8.3 L 11.6,8.2 L 12.0,8.2 L 12.1,8.1 L 12.6,8.1" fill="#DDAACC"/>`;
  }
  if (mode === 'spark') {
    return `<path d="M 13.3,1.8e-15 L 13.2,0.1 L 13.4,0.4 L 13.4,0.6 L 13.7,0.7 L 13.9,1.3 L 13.8,1.5 L 14.0,1.7 L 14.3,2.8 L 14.2,4.3 L 14.0,4.6 L 14.0,4.9 L 13.8,5.1 L 13.9,5.4 L 13.6,5.7 L 13.4,6.3 L 13.1,6.6 L 12.9,7.1 L 12.6,7.4 L 12.5,7.4 L 12.5,7.6 L 11.8,8.3 L 11.6,8.3 L 11.8,7.4 L 12.1,6.4 L 12.0,6.2 L 11.2,7.0 L 11.1,7.2 L 10.8,7.4 L 10.8,7.6 L 10.6,7.8 L 10.4,8.5 L 10.2,8.5 L 10.2,8.8 L 10.1,8.9 L 10.0,9.6 L 9.8,9.7 L 9.9,10.0 L 9.8,10.7 L 9.8,11.7 L 10.1,13.6 L 10.0,15.0 L 9.8,15.1 L 9.8,15.5 L 9.6,16.0 L 9.2,16.3 L 9.2,16.5 L 9.0,16.8 L 8.7,16.8 L 8.7,16.9 L 8.4,17.1 L 8.1,17.0 L 7.8,16.6 L 7.8,15.4 L 8.1,14.2 L 8.8,12.8 L 8.4,12.8 L 7.8,13.3 L 7.6,13.3 L 5.7,15.1 L 5.7,15.3 L 5.5,15.5 L 5.3,15.9 L 5.1,16.1 L 5.1,16.4 L 5.0,16.4 L 5.0,16.7 L 4.8,17.0 L 4.8,17.4 L 4.5,17.6 L 4.5,18.4 L 4.4,18.5 L 4.5,20.4 L 4.8,22.0 L 4.9,22.1 L 5.0,22.6 L 5.2,22.8 L 5.1,23.0 L 5.3,23.1 L 5.3,23.4 L 5.6,23.6 L 5.7,23.9 L 5.9,24.0 L 6.3,24.7 L 6.4,24.7 L 6.7,24.9 L 6.7,25.1 L 6.8,25.1 L 7.9,26.0 L 8.0,26.2 L 8.2,26.2 L 10.4,27.3 L 12.2,27.9 L 13.7,28.0 L 15.4,28.0 L 17.1,27.6 L 18.5,27.2 L 19.6,26.7 L 21.0,25.7 L 22.0,24.7 L 23.1,22.9 L 23.5,21.4 L 23.6,20.0 L 23.5,19.3 L 23.2,18.6 L 23.2,18.3 L 22.9,18.3 L 23.0,19.2 L 22.8,19.7 L 22.7,19.8 L 22.7,20.1 L 22.5,20.2 L 22.5,20.5 L 22.3,20.6 L 22.3,20.8 L 21.8,21.3 L 21.6,21.4 L 21.3,21.7 L 20.8,21.7 L 20.8,20.2 L 21.3,18.9 L 21.8,17.8 L 22.1,16.3 L 22.1,15.0 L 21.8,13.6 L 21.3,12.9 L 21.3,12.7 L 21.2,12.7 L 20.0,11.5 L 20.0,11.3 L 19.7,11.3 L 19.3,11.0 L 18.6,10.9 L 18.5,10.8 L 18.9,11.3 L 18.9,11.5 L 19.1,11.6 L 19.1,11.7 L 19.4,11.9 L 19.5,12.2 L 19.7,12.5 L 19.9,12.9 L 19.9,13.9 L 19.5,14.6 L 18.9,15.0 L 18.4,15.0 L 17.8,14.5 L 17.4,13.3 L 17.4,11.5 L 17.9,8.6 L 17.9,6.6 L 17.6,5.3 L 17.2,4.2 L 16.8,3.5 L 16.8,3.2 L 16.4,2.9 L 16.4,2.7 L 16.0,2.4 L 15.4,1.7 L 15.4,1.5 L 15.3,1.5 L 15.1,1.3 L 15.1,1.2 L 14.9,1.2 L 14.7,1.0 L 14.7,0.8 L 14.4,0.7 L 14.0,0.4 L 14.0,0.2 L 13.3,1.8e-15 M 20.4,6.3 L 20.4,7.5 L 19.9,8.1 L 19.9,8.3 L 19.6,8.5 L 19.6,9.2 L 19.9,9.8 L 20.4,10.0 L 20.8,10.0 L 21.2,9.9 L 21.5,9.6 L 21.6,9.1 L 21.6,8.4 L 21.4,7.6 L 21.5,7.4 L 21.3,7.2 L 20.7,6.3 L 20.4,6.3 M 8.0,4.2 L 8.1,5.2 L 8.0,5.3 L 7.9,5.7 L 7.4,6.4 L 7.4,7.9 L 7.6,7.9 L 8.0,8.3 L 8.7,8.3 L 9.0,8.2 L 9.5,7.6 L 9.5,6.6 L 9.3,5.8 L 8.7,4.6 L 8.5,4.6 L 8.3,4.3 L 8.3,4.2 L 8.0,4.2" fill="#CCAA88"/>
<path d="M 13.2,12.8 L 13.5,12.8 L 13.8,13.2 L 14.0,13.2 L 14.6,13.8 L 14.7,13.8 L 14.9,14.0 L 14.9,14.1 L 15.1,14.1 L 15.7,14.9 L 15.7,15.1 L 16.0,15.3 L 16.6,16.5 L 16.8,17.2 L 16.7,18.1 L 16.5,18.3 L 16.5,18.6 L 16.2,18.7 L 16.2,18.9 L 15.8,19.5 L 17.0,19.5 L 17.9,19.2 L 18.5,20.9 L 18.6,23.5 L 18.5,23.9 L 18.3,24.2 L 18.4,24.5 L 18.2,24.8 L 18.2,25.1 L 17.8,25.5 L 17.8,25.7 L 17.6,25.9 L 17.5,26.2 L 16.8,26.8 L 16.6,26.8 L 16.4,27.1 L 15.8,27.4 L 15.6,27.4 L 15.5,27.2 L 16.2,26.6 L 16.6,25.9 L 17.0,24.8 L 17.0,23.9 L 16.9,23.5 L 16.7,23.2 L 16.5,23.4 L 16.5,23.7 L 16.2,23.8 L 16.2,24.0 L 15.9,24.4 L 15.7,24.3 L 16.1,22.9 L 16.1,21.7 L 16.0,21.1 L 15.4,20.0 L 15.4,19.8 L 15.1,19.5 L 14.8,19.5 L 14.8,19.8 L 14.9,19.9 L 15.0,20.9 L 14.8,21.6 L 14.6,21.7 L 14.6,22.0 L 14.2,22.3 L 14.2,22.4 L 14.0,22.5 L 14.0,22.6 L 13.7,22.8 L 13.6,22.8 L 12.9,23.6 L 12.9,23.7 L 12.6,23.9 L 12.5,23.9 L 12.5,24.3 L 12.3,24.4 L 12.3,24.8 L 12.0,24.8 L 11.8,24.4 L 11.8,23.6 L 11.6,23.6 L 11.4,23.9 L 11.4,25.6 L 11.5,25.7 L 11.7,26.2 L 12.1,26.7 L 12.1,27.0 L 12.6,27.2 L 12.5,27.4 L 11.7,27.1 L 10.7,26.3 L 10.3,25.7 L 9.7,24.2 L 9.7,22.6 L 10.2,21.2 L 10.6,20.5 L 12.4,18.3 L 13.3,16.6 L 13.5,15.3 L 13.5,14.7 L 13.3,13.5 L 13.1,13.0 L 13.2,12.8" fill="#DDAACC"/>`;
  }
  return '';
}

function rpg2kDeadIcon(mode) {
  if (mode === 'heart') {
    return `<path d="M14 24 C8 18, 2 14, 2 8 C2 4, 6 2, 10 4 C12 5, 14 8, 14 8 C14 8, 16 5, 18 4 C22 2, 26 4, 26 8 C26 14, 20 18, 14 24 Z" fill="none" stroke="#4a3a45" stroke-width="1.2"/>`;
  }
  if (mode === 'rose') {
    // 시든 줄기 — 회색 막대만 남음
    return `<rect x="13" y="6" width="2" height="18" fill="#4a3a45" opacity="0.7"/>
<rect x="11" y="22" width="6" height="2" fill="#4a3a45" opacity="0.7"/>`;
  }
  if (mode === 'moon') {
    return `<circle cx="14" cy="14" r="10" fill="#2a2030" stroke="#4a3a45" stroke-width="0.8"/>`;
  }
  if (mode === 'eye') {
    return `<path d="M 1.4,9.1 L 1.4,9.8 L 1.5,9.9 L 1.5,10.0 L 3.1,11.6 L 3.2,11.6 L 3.7,12.1 L 3.8,12.1 L 4.1,12.4 L 4.2,12.4 L 4.4,12.6 L 4.5,12.6 L 4.6,12.8 L 4.7,12.8 L 5.0,13.0 L 4.9,13.1 L 4.9,13.2 L 4.6,13.5 L 4.6,13.6 L 4.5,13.8 L 4.5,13.9 L 4.2,14.2 L 4.2,14.3 L 4.0,14.5 L 4.0,14.6 L 3.7,14.9 L 3.7,15.0 L 3.5,15.1 L 3.5,15.3 L 3.4,15.4 L 3.4,15.7 L 3.7,16.2 L 3.8,16.2 L 4.1,16.4 L 4.4,16.4 L 4.5,16.3 L 4.6,16.3 L 4.9,16.0 L 4.9,15.9 L 5.5,15.2 L 5.5,15.1 L 5.7,15.0 L 5.7,14.9 L 6.0,14.6 L 6.0,14.5 L 6.6,13.8 L 6.6,13.9 L 6.7,13.9 L 6.8,14.0 L 6.9,14.0 L 7.4,14.3 L 7.6,14.3 L 7.9,14.5 L 8.1,14.5 L 8.2,14.6 L 8.4,14.6 L 8.7,14.8 L 8.9,14.8 L 9.0,14.9 L 9.0,15.1 L 8.9,15.1 L 8.9,15.3 L 8.7,15.8 L 8.7,16.0 L 8.4,16.5 L 8.4,16.7 L 8.3,16.8 L 8.3,16.9 L 8.1,17.1 L 8.1,17.3 L 7.9,17.6 L 7.9,17.9 L 8.0,18.0 L 8.1,18.3 L 8.3,18.5 L 8.4,18.5 L 8.5,18.6 L 8.9,18.6 L 9.0,18.5 L 9.1,18.5 L 9.4,18.2 L 9.4,18.1 L 9.7,17.6 L 9.7,17.4 L 9.8,17.3 L 9.8,17.2 L 10.1,16.8 L 10.1,16.6 L 10.3,16.3 L 10.3,16.1 L 10.4,16.0 L 10.4,15.9 L 10.5,15.8 L 10.5,15.7 L 10.8,15.2 L 10.8,15.2 L 10.9,15.3 L 11.4,15.3 L 11.5,15.4 L 12.2,15.4 L 12.3,15.5 L 13.0,15.5 L 13.1,15.6 L 13.1,18.6 L 13.2,18.7 L 13.2,18.9 L 13.3,19.0 L 13.3,19.1 L 13.8,19.3 L 14.1,19.3 L 14.2,19.2 L 14.4,19.2 L 14.7,19.0 L 14.7,18.9 L 14.8,18.8 L 14.8,15.6 L 14.9,15.5 L 15.7,15.5 L 15.8,15.4 L 16.5,15.4 L 16.6,15.3 L 17.1,15.3 L 17.1,15.2 L 17.3,15.4 L 17.3,15.5 L 17.6,16.0 L 17.6,16.2 L 17.9,16.7 L 17.9,16.9 L 18.2,17.3 L 18.2,17.5 L 18.5,18.0 L 18.5,18.2 L 18.8,18.5 L 18.9,18.5 L 19.0,18.6 L 19.4,18.6 L 19.5,18.5 L 19.6,18.5 L 19.9,18.2 L 19.9,18.1 L 20.0,18.0 L 20.0,17.5 L 19.8,17.2 L 19.8,17.1 L 19.5,16.6 L 19.5,16.4 L 19.2,15.9 L 19.2,15.7 L 19.2,15.6 L 19.2,15.5 L 19.1,15.4 L 19.1,15.2 L 18.9,15.0 L 19.1,14.8 L 19.2,14.8 L 19.3,14.7 L 19.5,14.7 L 19.6,14.6 L 19.8,14.6 L 19.9,14.5 L 20.0,14.5 L 20.1,14.4 L 20.3,14.4 L 20.8,14.1 L 21.0,14.1 L 21.4,13.8 L 21.6,14.0 L 21.6,14.1 L 21.8,14.3 L 21.8,14.4 L 22.1,14.7 L 22.1,14.8 L 22.3,15.0 L 22.3,15.1 L 22.9,15.7 L 22.9,15.8 L 23.4,16.3 L 23.5,16.3 L 23.5,16.4 L 23.8,16.4 L 23.9,16.3 L 24.1,16.3 L 24.4,16.0 L 24.4,15.9 L 24.5,15.8 L 24.5,15.2 L 24.3,15.1 L 24.3,15.0 L 24.1,14.8 L 24.1,14.7 L 23.8,14.4 L 23.8,14.3 L 23.6,14.1 L 23.6,14.0 L 23.4,13.7 L 23.4,13.6 L 23.2,13.4 L 23.2,13.3 L 22.9,13.0 L 23.1,12.9 L 23.2,12.9 L 23.4,12.7 L 23.5,12.7 L 23.6,12.5 L 23.7,12.5 L 24.0,12.2 L 24.1,12.2 L 24.4,11.9 L 24.5,11.9 L 25.1,11.3 L 25.2,11.3 L 26.4,10.1 L 26.4,10.0 L 26.6,9.7 L 26.6,9.2 L 26.5,9.1 L 26.5,9.0 L 26.2,8.8 L 26.0,8.8 L 25.9,8.7 L 25.6,8.7 L 25.6,8.8 L 25.3,8.8 L 25.0,9.1 L 25.0,9.2 L 24.2,10.0 L 24.1,10.0 L 23.5,10.6 L 23.5,10.6 L 23.1,10.9 L 23.0,10.9 L 22.8,11.1 L 22.7,11.1 L 22.4,11.4 L 22.3,11.4 L 21.8,11.8 L 21.5,11.9 L 21.4,12.1 L 21.3,12.1 L 21.2,12.2 L 21.1,12.2 L 21.0,12.3 L 20.9,12.3 L 20.8,12.4 L 20.7,12.4 L 20.2,12.7 L 20.0,12.7 L 19.5,12.9 L 19.3,12.9 L 19.2,13.0 L 19.1,13.0 L 19.0,13.1 L 18.8,13.1 L 18.7,13.2 L 18.5,13.2 L 18.4,13.3 L 18.2,13.3 L 18.1,13.4 L 17.8,13.4 L 17.7,13.5 L 17.4,13.5 L 17.3,13.6 L 17.1,13.6 L 17.0,13.7 L 16.5,13.7 L 16.4,13.8 L 15.9,13.8 L 15.8,13.9 L 14.8,13.9 L 14.7,14.0 L 13.2,14.0 L 13.1,13.9 L 12.2,13.9 L 12.1,13.8 L 11.5,13.8 L 11.4,13.7 L 11.0,13.7 L 10.9,13.6 L 10.6,13.6 L 10.5,13.5 L 10.2,13.5 L 10.1,13.4 L 9.9,13.4 L 9.8,13.3 L 9.5,13.3 L 9.4,13.2 L 9.2,13.2 L 9.1,13.1 L 8.9,13.1 L 8.7,12.9 L 8.5,12.9 L 8.4,12.9 L 8.2,12.9 L 8.1,12.8 L 8.0,12.8 L 7.5,12.5 L 7.3,12.5 L 7.2,12.4 L 7.1,12.4 L 6.9,12.2 L 6.8,12.2 L 6.7,12.1 L 6.5,12.0 L 6.3,11.8 L 6.0,11.7 L 5.8,11.5 L 5.7,11.5 L 5.5,11.3 L 5.4,11.3 L 5.1,11.0 L 5.0,11.0 L 4.7,10.8 L 4.6,10.8 L 4.3,10.4 L 4.2,10.4 L 2.5,8.8 L 2.4,8.8 L 2.3,8.7 L 2.0,8.7 L 1.9,8.8 L 1.8,8.8 L 1.4,9.1" fill="#4a3a45"/>`;
  }
  if (mode === 'spark') {
    return `<g opacity="0.55"><path d="M 15.1,10.5 L 15.1,10.7 L 14.9,10.9 L 14.6,11.0 L 14.6,11.2 L 14.3,11.5 L 14.2,11.8 L 14.0,11.9 L 14.0,12.1 L 14.0,12.4 L 13.8,13.0 L 13.8,13.4 L 13.7,13.5 L 13.7,14.0 L 13.8,14.1 L 13.7,14.7 L 13.9,14.7 L 14.0,14.8 L 14.0,15.1 L 14.0,15.1 L 14.2,15.4 L 14.4,15.4 L 14.5,15.5 L 14.6,15.6 L 14.6,15.8 L 14.9,15.8 L 14.9,16.0 L 15.0,16.0 L 15.2,16.2 L 15.2,16.3 L 15.4,16.8 L 15.7,16.8 L 15.9,17.4 L 15.9,17.7 L 16.1,17.7 L 16.2,17.7 L 16.1,17.6 L 16.1,17.0 L 16.2,16.9 L 16.1,16.8 L 16.1,16.3 L 15.9,15.9 L 15.9,15.6 L 16.0,15.5 L 15.9,15.4 L 15.7,15.3 L 15.7,14.9 L 15.4,14.5 L 15.4,14.2 L 15.1,13.7 L 15.0,13.7 L 14.9,13.5 L 14.8,12.7 L 14.7,12.6 L 14.8,12.4 L 14.8,11.6 L 14.9,11.4 L 15.0,11.3 L 15.1,10.8 L 15.3,10.8 L 15.2,10.5 L 15.1,10.5 M 13.7,0.0 L 13.7,0.2 L 14.8,1.2 L 15.2,1.7 L 15.2,1.9 L 15.5,2.1 L 15.4,2.4 L 15.7,2.5 L 15.7,2.8 L 15.8,2.9 L 15.8,3.1 L 15.7,3.2 L 15.8,3.3 L 15.8,3.9 L 15.7,4.2 L 15.5,4.3 L 15.6,4.5 L 15.4,4.7 L 15.4,5.0 L 15.1,5.2 L 14.9,5.4 L 14.9,5.7 L 14.7,5.7 L 14.7,5.9 L 14.5,6.0 L 14.5,6.2 L 14.3,6.2 L 14.3,6.5 L 14.0,6.6 L 14.0,6.7 L 13.9,6.9 L 13.7,6.9 L 13.7,7.1 L 13.4,7.3 L 13.4,7.5 L 13.1,7.6 L 12.9,7.8 L 12.9,8.0 L 12.7,8.0 L 12.7,8.1 L 12.6,8.2 L 12.6,8.4 L 12.4,8.5 L 12.4,8.7 L 12.2,8.8 L 12.2,9.0 L 11.8,9.2 L 11.8,9.4 L 11.7,9.4 L 11.7,9.7 L 11.4,9.9 L 11.2,10.3 L 11.0,10.6 L 11.1,10.9 L 10.9,11.2 L 10.8,11.2 L 10.7,11.4 L 10.8,11.5 L 10.8,11.9 L 10.6,12.3 L 10.6,14.1 L 10.8,14.7 L 11.1,14.9 L 11.1,15.1 L 11.2,15.2 L 11.3,15.5 L 11.7,15.8 L 11.7,16.0 L 12.2,16.6 L 12.6,16.8 L 12.6,17.0 L 12.8,17.0 L 13.1,17.3 L 13.2,17.3 L 13.3,17.6 L 13.5,17.6 L 13.5,17.7 L 14.2,18.3 L 14.5,18.3 L 14.5,18.6 L 14.8,18.6 L 14.9,18.8 L 15.3,18.9 L 15.4,19.0 L 15.4,19.2 L 15.7,19.2 L 15.9,19.5 L 16.3,19.6 L 16.5,19.9 L 16.5,20.0 L 17.0,20.4 L 17.2,20.9 L 17.2,21.5 L 17.2,21.7 L 17.0,21.8 L 16.9,22.1 L 16.7,22.4 L 16.7,22.6 L 16.5,22.7 L 16.2,23.1 L 15.6,23.5 L 15.3,23.9 L 15.0,23.9 L 13.9,24.6 L 13.7,24.8 L 13.7,25.0 L 13.4,25.2 L 13.0,25.9 L 13.0,26.2 L 12.9,26.3 L 13.1,26.9 L 13.3,27.2 L 13.3,27.3 L 13.4,27.3 L 13.6,27.7 L 13.8,27.7 L 14.0,27.9 L 14.5,28.0 L 14.5,27.9 L 15.3,27.9 L 15.4,26.6 L 15.5,26.3 L 15.6,25.8 L 15.8,25.3 L 16.3,25.0 L 16.2,24.9 L 16.3,24.6 L 16.5,24.4 L 16.4,24.1 L 16.8,23.6 L 16.8,23.5 L 17.0,23.3 L 17.2,22.9 L 17.1,22.5 L 17.2,22.0 L 17.2,21.3 L 17.3,21.3 L 17.3,20.6 L 17.4,20.5 L 17.2,20.4 L 17.2,20.1 L 17.3,20.0 L 17.2,19.7 L 17.0,19.6 L 17.0,19.5 L 16.8,19.5 L 16.7,19.3 L 16.7,19.0 L 16.5,19.0 L 16.4,18.7 L 16.2,18.6 L 15.9,18.4 L 15.9,18.2 L 15.7,18.0 L 15.5,18.0 L 15.3,17.7 L 15.3,17.6 L 14.9,17.2 L 14.7,17.2 L 14.6,17.0 L 14.0,16.4 L 13.8,16.3 L 13.8,16.2 L 13.5,15.9 L 13.0,15.3 L 12.7,15.1 L 12.6,14.8 L 12.2,14.5 L 12.2,14.4 L 12.1,14.3 L 12.0,13.9 L 11.8,13.6 L 11.6,13.5 L 11.6,13.2 L 11.7,13.1 L 11.4,12.6 L 11.4,11.7 L 11.5,11.4 L 11.7,11.3 L 11.7,11.2 L 11.6,11.1 L 11.7,10.4 L 12.2,9.9 L 12.2,9.6 L 12.5,9.4 L 12.6,8.9 L 12.8,8.8 L 12.8,8.6 L 13.1,8.4 L 13.1,8.2 L 13.3,8.1 L 13.3,8.0 L 13.5,7.9 L 13.5,7.7 L 13.7,7.6 L 13.8,7.5 L 14.2,7.1 L 14.3,6.9 L 14.5,6.9 L 14.9,6.7 L 15.1,6.2 L 15.4,6.2 L 15.4,6.1 L 16.2,5.4 L 16.3,5.2 L 16.5,5.0 L 16.6,4.6 L 16.8,4.5 L 17.0,4.1 L 16.9,3.7 L 17.1,3.6 L 17.0,3.5 L 16.9,2.0 L 16.6,1.2 L 16.4,1.1 L 16.3,1.0 L 16.2,1.0 L 15.8,0.5 L 15.7,0.5 L 15.6,0.3 L 15.3,0.2 L 15.2,0.2 L 14.7,0.2 L 14.6,0.0 L 13.7,0.0" fill="#6a5a70"/></g>`;
  }
  return '';
}

// ── rpg2k 윈도우 컬러 (th=창색[§제목색]) — th 없으면 기본색 그대로 ──
function rpg2kTheme(raw) {
  const DEF = { bg:'#110d18', frame:'#8888CC', light:'#DDAACC', sub:'#BB6688', accent:'#8888CC', label:'#8a7a90', div:'#2a2030' };
  if (!raw) return DEF;
  const norm = s => {
    s = (s || '').trim().replace(/^#/, '');
    if (/^[0-9a-fA-F]{3}$/.test(s)) s = s.split('').map(c => c + c).join('');
    return /^[0-9a-fA-F]{6}$/.test(s) ? '#' + s.toLowerCase() : null;
  };
  const parts = raw.split('§').map(norm);
  const c = parts[0];
  if (!c) return DEF; // 불량값 → 기본색 안전 폴백
  const rgb = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
  const mix = (a, b, r) => { const A = rgb(a), B = rgb(b);
    return '#' + A.map((v,i) => Math.round(v + (B[i]-v)*r).toString(16).padStart(2,'0')).join(''); };
  return {
    bg:     mix(c, '#000000', 0.85),  // 배경 틴트
    frame:  c,                         // 외곽 프레임
    light:  parts[1] || mix(c, '#ffffff', 0.40), // 이름·코너 (2번째 색으로 별도 지정 가능)
    sub:    c,                         // 부제
    accent: mix(c, '#ffffff', 0.15),   // 챕터·하단 인용문
    label:  mix(c, '#808080', 0.55),   // 섹션 라벨·위치
    div:    mix(c, '#000000', 0.60),   // 구분선
  };
}

function renderRpg2k(params) {
  const W = 600, PAD = 32;
  const wc = rpg2kTheme(params.get('th')); // th 없으면 기본색

  const pp = (params.get('p') || '이름§§§').split('§');
  const name    = esc(pp[0] || '???');
  const subtitle= esc(pp[1] || '');
  const loc     = esc(pp[2] || '');
  const chapter = esc(pp[3] || '');

  const hpStr = (params.get('hp') || '5§5§heart').split('§');
  const hp    = safeInt(hpStr[0], 5, 0, 999);
  const hpMax = safeInt(hpStr[1], 5, 1, 999);
  const modeRaw = (hpStr[2] || 'heart').toLowerCase();
  const validModes = ['heart','rose','moon','eye','spark'];
  const mode = validModes.includes(modeRaw) ? modeRaw : 'heart';
  const hpCur = Math.min(hp, hpMax);
  const count = Math.min(hpMax, 12);

  const iconSize = count <= 8 ? 28 : 24;
  const step = count <= 8 ? (iconSize + 12) : (iconSize + 6);

  const items = params.get('items') ? params.get('items').split('|').slice(0, 12).map(esc) : [];
  const logs  = params.get('log')   ? params.get('log').split('§').slice(0, 4).map(esc)  : [];
  const note  = esc(params.get('say') || '');

  const hpRatio = hpMax > 0 ? hpCur / hpMax : 0;

  const HEADER_H = 92;
  const HP_H = 90;
  const itemRows = items.length > 0 ? Math.ceil(items.length / 3) : 0;
  const ITEM_H = itemRows > 0 ? (28 + itemRows * 22 + 14) : 0;
  const LOG_H  = logs.length > 0 ? (28 + logs.length * 20 + 10) : 0;
  const NOTE_H = note ? 38 : 0;
  const TOTAL_H = HEADER_H + HP_H + ITEM_H + LOG_H + NOTE_H + 8;

  let y = 0;
  let body = '';

  body += `<text x="${PAD}" y="52" font-family="Georgia,'Noto Serif KR',serif" font-size="24" font-weight="bold" fill="${wc.light}">${name}</text>`;
  if (subtitle) {
    body += `<text x="${PAD}" y="74" font-family="Georgia,serif" font-size="13" fill="${wc.sub}" font-style="italic">${subtitle}</text>`;
  }
  if (chapter) {
    body += `<text x="${W-PAD}" y="52" font-family="monospace" font-size="11" font-weight="bold" fill="${wc.accent}" text-anchor="end" letter-spacing="2">${chapter}</text>`;
  }
  if (loc) {
    body += `<text x="${W-PAD}" y="72" font-family="monospace" font-size="11" fill="${wc.label}" text-anchor="end">▸ ${loc}</text>`;
  }
  body += `<line x1="${PAD}" y1="92" x2="${W-PAD}" y2="92" stroke="${wc.div}" stroke-width="0.8"/>`;
  y = HEADER_H;

  const modeLabel = mode.toUpperCase();
  const hpColor = rpg2kIconColor(mode);
  body += `<text x="${PAD}" y="${y+24}" font-family="monospace" font-size="12" font-weight="bold" fill="${wc.label}" letter-spacing="2">VITALITY · ${modeLabel}</text>`;
  body += `<text x="${W-PAD}" y="${y+24}" font-family="monospace" font-size="13" font-weight="bold" fill="${hpColor}" text-anchor="end">${hpCur} / ${hpMax}</text>`;

  const iconStartX = PAD + 8;
  for (let i = 0; i < count; i++) {
    const ix = iconStartX + i * step;
    const iy = y + 38;
    if (i < hpCur) {
      const phase = mode === 'moon' ? hpRatio : 1;
      body += `<g transform="translate(${ix}, ${iy})">${rpg2kAliveIcon(mode, phase, hpCur)}</g>`;
    } else {
      body += `<g transform="translate(${ix}, ${iy})">${rpg2kDeadIcon(mode)}</g>`;
    }
  }
  body += `<line x1="${PAD}" y1="${y+HP_H-2}" x2="${W-PAD}" y2="${y+HP_H-2}" stroke="${wc.div}" stroke-width="0.8"/>`;
  y += HP_H;

  if (items.length > 0) {
    body += `<text x="${PAD}" y="${y+22}" font-family="monospace" font-size="12" font-weight="bold" fill="${wc.label}" letter-spacing="2">ITEMS</text>`;
    body += `<text x="${W-PAD}" y="${y+22}" font-family="monospace" font-size="10" fill="${wc.label}" text-anchor="end">${items.length} / 12</text>`;
    const colX = [PAD + 12, PAD + 188, PAD + 364];
    items.forEach((item, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const ix = colX[col];
      const iy = y + 46 + row * 22;
      const display = item.length > 9 ? item.slice(0, 9) + '…' : item;
      body += `<text x="${ix}" y="${iy}" font-family="Georgia,'Noto Serif KR',serif" font-size="13" fill="#CCAA88">◆ ${display}</text>`;
    });
    body += `<line x1="${PAD}" y1="${y+ITEM_H-2}" x2="${W-PAD}" y2="${y+ITEM_H-2}" stroke="${wc.div}" stroke-width="0.8"/>`;
    y += ITEM_H;
  }

  if (logs.length > 0) {
    body += `<text x="${PAD}" y="${y+22}" font-family="monospace" font-size="12" font-weight="bold" fill="${wc.label}" letter-spacing="2">JOURNAL</text>`;
    logs.forEach((line, i) => {
      const ly = y + 44 + i * 20;
      const display = line.length > 36 ? line.slice(0, 36) + '…' : line;
      body += `<text x="${PAD+12}" y="${ly}" font-family="Georgia,serif" font-size="13" fill="#d8c8b0" font-style="italic">· ${display}</text>`;
    });
    body += `<line x1="${PAD}" y1="${y+LOG_H-2}" x2="${W-PAD}" y2="${y+LOG_H-2}" stroke="${wc.div}" stroke-width="0.8"/>`;
    y += LOG_H;
  }

  if (note) {
    body += `<text x="${W/2}" y="${y+24}" font-family="Georgia,serif" font-size="13" fill="${wc.accent}" font-style="italic" text-anchor="middle">" ${note} "</text>`;
    y += NOTE_H;
  }

  const corners = `<path d="M${PAD+8} 20 L20 20 L20 ${PAD+8}" fill="none" stroke="${wc.light}" stroke-width="1" opacity="0.6"/>
<path d="M${W-PAD-8} 20 L${W-20} 20 L${W-20} ${PAD+8}" fill="none" stroke="${wc.light}" stroke-width="1" opacity="0.6"/>
<path d="M${PAD+8} ${TOTAL_H-20} L20 ${TOTAL_H-20} L20 ${TOTAL_H-PAD-8}" fill="none" stroke="${wc.light}" stroke-width="1" opacity="0.6"/>
<path d="M${W-PAD-8} ${TOTAL_H-20} L${W-20} ${TOTAL_H-20} L${W-20} ${TOTAL_H-PAD-8}" fill="none" stroke="${wc.light}" stroke-width="1" opacity="0.6"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${TOTAL_H}" viewBox="0 0 ${W} ${TOTAL_H}">
<rect width="${W}" height="${TOTAL_H}" fill="${wc.bg}"/>
<rect x="2" y="2" width="${W-4}" height="${TOTAL_H-4}" rx="3" fill="none" stroke="${wc.frame}" stroke-width="1" opacity="0.4"/>
${corners}
${body}
</svg>`;
}

// ════════════════════════════════════════════
//  CHOICE (선택지 박스)
//  ?t=choice&c=보기1|보기2|보기3|보기4&title=라벨&st=vn|rpg|modern|dot
//  최대 개수 제한 없음 (권장 8개 이하), 숫자 prefix 자동, 본문 없음 (본문은 위쪽 챗봇 메시지)
//  st 생략 시 vn
// ════════════════════════════════════════════

function clipChoice(s, max) {
  return s.length > max ? s.slice(0, max) + '…' : s;
}

function renderChoiceVN(choices, title, W) {
  const PAD = 20;
  const ROW_H = 46;
  const GAP = 8;
  const TITLE_H = title ? 36 : 0;
  const TOP = TITLE_H + 16;
  const BOT = 18;
  const TOTAL_H = TOP + choices.length * ROW_H + Math.max(0, choices.length - 1) * GAP + BOT;

  let body = '';
  if (title) {
    body += `<text x="${W/2}" y="28" font-family="'Noto Serif KR',Georgia,serif" font-size="14" font-weight="bold" fill="#DDAACC" text-anchor="middle" letter-spacing="3">─  ${title}  ─</text>`;
  }

  choices.forEach((choice, i) => {
    const y = TOP + i * (ROW_H + GAP);
    const display = clipChoice(choice, 30);
    body += `<rect x="${PAD}" y="${y}" width="${W - PAD*2}" height="${ROW_H}" rx="6" fill="url(#choiceVnRow)" stroke="#8888CC" stroke-width="1" stroke-opacity="0.4"/>
<circle cx="${PAD + 24}" cy="${y + ROW_H/2}" r="14" fill="#BB6688" fill-opacity="0.25" stroke="#DDAACC" stroke-width="1" stroke-opacity="0.6"/>
<text x="${PAD + 24}" y="${y + ROW_H/2 + 5}" font-family="'Noto Serif KR',Georgia,serif" font-size="14" font-weight="bold" fill="#DDAACC" text-anchor="middle">${i+1}</text>
<text x="${PAD + 52}" y="${y + ROW_H/2 + 5}" font-family="'Noto Serif KR',Georgia,serif" font-size="14" fill="#f0eaf5">${display}</text>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${TOTAL_H}" viewBox="0 0 ${W} ${TOTAL_H}">
<defs>
  <linearGradient id="choiceVnBg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#1a1226"/>
    <stop offset="100%" stop-color="#0e0818"/>
  </linearGradient>
  <linearGradient id="choiceVnRow" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#2a1e3c" stop-opacity="0.9"/>
    <stop offset="100%" stop-color="#1e1428" stop-opacity="0.95"/>
  </linearGradient>
</defs>
<rect width="${W}" height="${TOTAL_H}" fill="url(#choiceVnBg)"/>
<rect x="1" y="1" width="${W-2}" height="${TOTAL_H-2}" rx="12" fill="none" stroke="#DDAACC" stroke-width="1" stroke-opacity="0.35"/>
${body}
</svg>`;
}

function renderChoiceRpg(choices, title, W) {
  const PAD = 24;
  const ROW_H = 32;
  const TITLE_H = title ? 32 : 0;
  const TOP = TITLE_H + 18;
  const BOT = 18;
  const TOTAL_H = TOP + choices.length * ROW_H + BOT;

  let body = '';
  if (title) {
    body += `<text x="${W/2}" y="34" font-family="monospace" font-size="13" font-weight="bold" fill="#fff" text-anchor="middle" letter-spacing="4">▼  ${title}  ▼</text>`;
  }

  choices.forEach((choice, i) => {
    const ty = TOP + i * ROW_H + 22;
    const display = clipChoice(choice, 28);
    body += `<text x="${PAD + 4}" y="${ty}" font-family="monospace" font-size="15" font-weight="bold" fill="#fff" letter-spacing="1.5">${i+1}.   ${display}</text>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${TOTAL_H}" viewBox="0 0 ${W} ${TOTAL_H}">
<rect width="${W}" height="${TOTAL_H}" fill="#000"/>
<rect x="4" y="4" width="${W-8}" height="${TOTAL_H-8}" fill="none" stroke="#fff" stroke-width="2"/>
<rect x="10" y="10" width="${W-20}" height="${TOTAL_H-20}" fill="none" stroke="#fff" stroke-width="1" stroke-opacity="0.7"/>
${body}
</svg>`;
}

function renderChoiceModern(choices, title, W) {
  const PAD = 20;
  const ROW_H = 50;
  const GAP = 8;
  const TITLE_H = title ? 32 : 0;
  const TOP = TITLE_H + 12;
  const BOT = 16;
  const TOTAL_H = TOP + choices.length * ROW_H + Math.max(0, choices.length - 1) * GAP + BOT;

  const accents = ['#8888CC', '#DDAACC', '#CCAA88', '#BB6688'];

  let body = '';
  if (title) {
    body += `<text x="${PAD}" y="26" font-family="monospace" font-size="11" font-weight="bold" fill="#8888CC" letter-spacing="3">—  ${title.toUpperCase()}</text>`;
  }

  choices.forEach((choice, i) => {
    const y = TOP + i * (ROW_H + GAP);
    const accent = accents[i % accents.length];
    const display = clipChoice(choice, 30);
    const numStr = String(i+1).padStart(2, '0');
    body += `<rect x="${PAD}" y="${y}" width="${W - PAD*2}" height="${ROW_H}" rx="6" fill="#1a1422" stroke="#2a2034" stroke-width="1"/>
<rect x="${PAD}" y="${y}" width="3" height="${ROW_H}" fill="${accent}"/>
<text x="${PAD + 20}" y="${y + ROW_H/2 + 5}" font-family="monospace" font-size="13" font-weight="bold" fill="${accent}" letter-spacing="1">${numStr}</text>
<text x="${PAD + 58}" y="${y + ROW_H/2 + 5}" font-family="'Noto Sans KR',sans-serif" font-size="14" fill="#f0eaf5">${display}</text>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${TOTAL_H}" viewBox="0 0 ${W} ${TOTAL_H}">
<rect width="${W}" height="${TOTAL_H}" fill="#0d0916"/>
${body}
</svg>`;
}

function renderChoiceDot(choices, title, W) {
  const PAD = 24;
  const ROW_H = 34;
  const TITLE_H = title ? 32 : 0;
  const TOP = TITLE_H + 22;
  const BOT = 22;
  const TOTAL_H = TOP + choices.length * ROW_H + BOT;

  let body = '';
  if (title) {
    // 그림자(검정 2,2 오프셋) + 본문
    body += `<text x="${W/2 + 2}" y="38" font-family="monospace" font-size="13" font-weight="bold" fill="#000" text-anchor="middle" letter-spacing="3">★  ${title}  ★</text>
<text x="${W/2}" y="36" font-family="monospace" font-size="13" font-weight="bold" fill="#CCAA88" text-anchor="middle" letter-spacing="3">★  ${title}  ★</text>`;
  }

  choices.forEach((choice, i) => {
    const ty = TOP + i * ROW_H + 22;
    const display = clipChoice(choice, 28);
    // 그림자 + 본문 (8-bit 텍스트 그림자)
    body += `<text x="${PAD + 2}" y="${ty + 2}" font-family="monospace" font-size="14" font-weight="bold" fill="#000" letter-spacing="1.5">${i+1}.   ${display}</text>
<text x="${PAD}" y="${ty}" font-family="monospace" font-size="14" font-weight="bold" fill="#fff" letter-spacing="1.5"><tspan fill="#DDAACC">${i+1}.</tspan>   ${display}</text>`;
  });

  // 8-bit 픽셀 테두리: 바깥 검정 그림자 + 컬러 픽셀 링
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${TOTAL_H}" viewBox="0 0 ${W} ${TOTAL_H}">
<rect x="4" y="4" width="${W-4}" height="${TOTAL_H-4}" fill="#000"/>
<rect x="0" y="0" width="${W-4}" height="${TOTAL_H-4}" fill="#1a1438"/>
<rect x="0" y="0" width="${W-4}" height="4" fill="#8888CC"/>
<rect x="0" y="${TOTAL_H-8}" width="${W-4}" height="4" fill="#8888CC"/>
<rect x="0" y="0" width="4" height="${TOTAL_H-4}" fill="#8888CC"/>
<rect x="${W-8}" y="0" width="4" height="${TOTAL_H-4}" fill="#8888CC"/>
<rect x="4" y="4" width="${W-12}" height="4" fill="#DDAACC"/>
<rect x="4" y="${TOTAL_H-12}" width="${W-12}" height="4" fill="#DDAACC"/>
<rect x="4" y="4" width="4" height="${TOTAL_H-12}" fill="#DDAACC"/>
<rect x="${W-12}" y="4" width="4" height="${TOTAL_H-12}" fill="#DDAACC"/>
${body}
</svg>`;
}

function renderChoice(params) {
  const W = 480;
  const validStyles = ['vn', 'rpg', 'modern', 'dot'];
  const stRaw = (params.get('st') || 'vn').toLowerCase();
  const st = validStyles.includes(stRaw) ? stRaw : 'vn';

  const rawC = params.get('c') || '';
  let choices = rawC ? rawC.split('|').map(s => s.trim()).filter(Boolean) : [];
  if (choices.length === 0) choices = ['선택지 없음'];
  choices = choices.map(esc);

  const title = esc((params.get('title') || '').trim());

  if (st === 'rpg')    return renderChoiceRpg(choices, title, W);
  if (st === 'modern') return renderChoiceModern(choices, title, W);
  if (st === 'dot')    return renderChoiceDot(choices, title, W);
  return renderChoiceVN(choices, title, W);
}

// ════════════════════════════════════════════
//  DUNGEON — 던전 맵 생성기
//  ?t=dungeon
//  &seed=tx7f       — 시드 (4글자 영숫자)
//  &floor=5         — 현재 층
//  &max=10          — 최대 층 (또는 type=short/medium/long)
//  &type=short      — 길이 프리셋 (short=10, medium=25, long=50)
//  &px=3&py=5       — 플레이어 좌표 (그리드 인덱스, 0부터)
//  &dir=e           — 방향 (n/s/e/w)
//  &label=라벨      — 상단 제목
//  &labyrinth=on    — 미궁 모드
//  &traps=B2,C3     — 함정 위치 (알파벳+숫자, A=1)
//  &events=D5       — 이벤트 위치
//  &treasures=E3    — 보물상자 위치
//  &saves=F4        — 세이브 포인트 위치
//  &doors=G2        — 잠긴 문 위치
//  &secrets=H3      — 발견된 비밀 통로 위치
// ════════════════════════════════════════════

// ─── PRNG ───
function dgSeededRandom(seedStr) {
  let state = 0;
  for (let i = 0; i < seedStr.length; i++) state = (state * 31 + seedStr.charCodeAt(i)) | 0;
  if (state === 0) state = 1;
  return function() {
    state = (state * 1664525 + 1013904223) | 0;
    return ((state >>> 0) / 4294967296);
  };
}
function dgRandInt(rand, min, max) { return Math.floor(rand() * (max - min + 1)) + min; }

// ─── 좌표 파싱 (B2 → {x:2, y:2}) ───
function dgParseCoords(str) {
  if (!str) return [];
  return str.split(',').map(s => {
    s = s.trim();
    if (!s) return null;
    const m = s.match(/^([A-Z])(\d+)$/i);
    if (m) return { x: m[1].toUpperCase().charCodeAt(0) - 64, y: parseInt(m[2]) };
    return null;
  }).filter(c => c !== null);
}

// ─── 층 규칙 ───
//  customSize = {w, h} 주면 그 크기를 최대층 크기로 강제
//  안 주면 자동 공식 (8~16 × 6~12)
function dgGetFloorRules(floor, maxFloor, customSize) {
  const progress = floor / maxFloor;
  const eliteInterval = Math.ceil(maxFloor / 5);
  
  // 크기 결정
  let width, height;
  if (customSize && customSize.w && customSize.h) {
    // 사용자 지정: 최대층이 customSize, 1층은 그것의 50%부터 시작
    const minW = Math.max(5, Math.floor(customSize.w * 0.5));
    const minH = Math.max(4, Math.floor(customSize.h * 0.5));
    width = minW + Math.floor(progress * (customSize.w - minW));
    height = minH + Math.floor(progress * (customSize.h - minH));
  } else {
    // 자동 공식
    width = 8 + Math.floor(progress * 8);
    height = 6 + Math.floor(progress * 6);
  }
  
  return {
    width, height,
    bossLevel: floor === maxFloor ? 'final'
             : (floor % eliteInterval === 0) ? 'elite'
             : 'normal'
  };
}

// ─── 기본 던전 생성 (방+복도) ───
function dgGenerateBasic(seed, w, h, bossLevel) {
  const rand = dgSeededRandom(seed);
  const grid = [];
  for (let y = 0; y < h; y++) grid.push(new Array(w).fill(0));
  const rooms = [];
  const bossSize = bossLevel === 'final' ? 3 : bossLevel === 'elite' ? 2 : 1;
  const bossRoom = { x: w - bossSize - 1, y: h - bossSize - 1, w: bossSize, h: bossSize };
  rooms.push(bossRoom);
  for (let y = bossRoom.y; y < bossRoom.y + bossRoom.h; y++)
    for (let x = bossRoom.x; x < bossRoom.x + bossRoom.w; x++) grid[y][x] = 1;
  const eW = Math.min(2, Math.max(1, w - 3));
  const eH = Math.min(2, Math.max(1, h - 3));
  const entranceRoom = { x: 1, y: 1, w: eW, h: eH };
  rooms.push(entranceRoom);
  for (let y = entranceRoom.y; y < entranceRoom.y + entranceRoom.h; y++)
    for (let x = entranceRoom.x; x < entranceRoom.x + entranceRoom.w; x++) grid[y][x] = 1;
  const targetRoomCount = Math.max(3, Math.floor((w * h) / 12));
  let attempts = 0;
  while (rooms.length < targetRoomCount && attempts < 100) {
    attempts++;
    const rw = dgRandInt(rand, 1, 3), rh = dgRandInt(rand, 1, 2);
    const rx = dgRandInt(rand, 1, w - rw - 1), ry = dgRandInt(rand, 1, h - rh - 1);
    let overlap = false;
    for (const r of rooms) {
      if (rx <= r.x + r.w && rx + rw >= r.x && ry <= r.y + r.h && ry + rh >= r.y) { overlap = true; break; }
    }
    if (!overlap) {
      rooms.push({ x: rx, y: ry, w: rw, h: rh });
      for (let y = ry; y < ry + rh; y++) for (let x = rx; x < rx + rw; x++) grid[y][x] = 1;
    }
  }
  const centers = rooms.map(r => ({ x: Math.floor(r.x + r.w / 2), y: Math.floor(r.y + r.h / 2), room: r }));
  for (let i = 1; i < centers.length; i++) {
    const a = centers[i - 1], b = centers[i];
    if (rand() < 0.5) {
      for (let x = Math.min(a.x, b.x); x <= Math.max(a.x, b.x); x++) grid[a.y][x] = 1;
      for (let y = Math.min(a.y, b.y); y <= Math.max(a.y, b.y); y++) grid[y][b.x] = 1;
    } else {
      for (let y = Math.min(a.y, b.y); y <= Math.max(a.y, b.y); y++) grid[y][a.x] = 1;
      for (let x = Math.min(a.x, b.x); x <= Math.max(a.x, b.x); x++) grid[b.y][x] = 1;
    }
  }
  let nearest = null, minDist = Infinity;
  const bc = { x: Math.floor(bossRoom.x + bossRoom.w / 2), y: Math.floor(bossRoom.y + bossRoom.h / 2) };
  for (const c of centers) {
    if (c.room === bossRoom) continue;
    const d = Math.abs(c.x - bc.x) + Math.abs(c.y - bc.y);
    if (d < minDist) { minDist = d; nearest = c; }
  }
  if (nearest) {
    for (let x = Math.min(nearest.x, bc.x); x <= Math.max(nearest.x, bc.x); x++) grid[nearest.y][x] = 1;
    for (let y = Math.min(nearest.y, bc.y); y <= Math.max(nearest.y, bc.y); y++) grid[y][bc.x] = 1;
  }
  return { grid, w, h, bossRoom, entranceRoom, type: 'basic' };
}

// ─── 미궁 생성 (DFS) ───
function dgGenerateLabyrinth(seed, w, h, bossLevel) {
  const rand = dgSeededRandom(seed);
  const gw = w * 2 + 1, gh = h * 2 + 1;
  const grid = [];
  for (let y = 0; y < gh; y++) grid.push(new Array(gw).fill(0));
  const visited = [];
  for (let y = 0; y < h; y++) visited.push(new Array(w).fill(false));
  const stack = [[0, 0]];
  visited[0][0] = true;
  grid[1][1] = 1;
  while (stack.length > 0) {
    const [cx, cy] = stack[stack.length - 1];
    const ns = [];
    if (cy > 0 && !visited[cy - 1][cx]) ns.push([cx, cy - 1]);
    if (cy < h - 1 && !visited[cy + 1][cx]) ns.push([cx, cy + 1]);
    if (cx > 0 && !visited[cy][cx - 1]) ns.push([cx - 1, cy]);
    if (cx < w - 1 && !visited[cy][cx + 1]) ns.push([cx + 1, cy]);
    if (ns.length === 0) { stack.pop(); continue; }
    const [nx, ny] = ns[Math.floor(rand() * ns.length)];
    const gx = cx * 2 + 1, gy = cy * 2 + 1, ngx = nx * 2 + 1, ngy = ny * 2 + 1;
    grid[ngy][ngx] = 1;
    grid[(gy + ngy) / 2][(gx + ngx) / 2] = 1;
    visited[ny][nx] = true;
    stack.push([nx, ny]);
  }
  const bossSize = bossLevel === 'final' ? 3 : bossLevel === 'elite' ? 2 : 1;
  const bossRoom = { x: gw - bossSize - 1, y: gh - bossSize - 1, w: bossSize, h: bossSize };
  for (let y = bossRoom.y; y < bossRoom.y + bossRoom.h; y++)
    for (let x = bossRoom.x; x < bossRoom.x + bossRoom.w; x++)
      if (y >= 0 && y < gh && x >= 0 && x < gw) grid[y][x] = 1;
  if (bossRoom.x - 1 >= 0) grid[bossRoom.y][bossRoom.x - 1] = 1;
  if (bossRoom.y - 1 >= 0) grid[bossRoom.y - 1][bossRoom.x] = 1;
  const entranceRoom = { x: 1, y: 1, w: 1, h: 1 };
  return { grid, w: gw, h: gh, bossRoom, entranceRoom, type: 'labyrinth' };
}

// ─── 헬퍼 ───
function dgIsInBossRoom(x, y, br) {
  return x >= br.x && x < br.x + br.w && y >= br.y && y < br.y + br.h;
}
function dgSnapToFloor(grid, x, y, w, h, br) {
  if (x < 0 || x >= w || y < 0 || y >= h) return null;
  if (grid[y][x] === 1 && !dgIsInBossRoom(x, y, br)) return { x, y };
  const visited = grid.map(r => r.map(() => false));
  const queue = [[x, y, 0]];
  visited[y][x] = true;
  while (queue.length > 0) {
    const [cx, cy, d] = queue.shift();
    if (d > 5) break;
    for (const [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
      if (visited[ny][nx]) continue;
      if (grid[ny][nx] === 1 && !dgIsInBossRoom(nx, ny, br)) return { x: nx, y: ny };
      visited[ny][nx] = true;
      queue.push([nx, ny, d + 1]);
    }
  }
  return null;
}

// 플레이어 전용 snap (보스방 포함, 모든 통로 OK)
function dgSnapPlayer(grid, x, y, w, h) {
  if (x < 0 || x >= w || y < 0 || y >= h) return null;
  if (grid[y][x] === 1) return { x, y };
  const visited = grid.map(r => r.map(() => false));
  const queue = [[x, y, 0]];
  visited[y][x] = true;
  while (queue.length > 0) {
    const [cx, cy, d] = queue.shift();
    if (d > 10) break;
    for (const [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
      if (visited[ny][nx]) continue;
      if (grid[ny][nx] === 1) return { x: nx, y: ny };
      visited[ny][nx] = true;
      queue.push([nx, ny, d + 1]);
    }
  }
  return null;
}

// 비밀 공간 전용 snap (벽으로 보정 - 통로 좌표면 가까운 벽 찾기)
function dgSnapToWall(grid, x, y, w, h) {
  if (x < 0 || x >= w || y < 0 || y >= h) return null;
  if (grid[y][x] === 0) return { x, y };  // 이미 벽이면 그대로
  // 통로면 가까운 벽 찾기 (BFS, 던전 가장자리 벽은 제외 - 의미 없음)
  const visited = grid.map(r => r.map(() => false));
  const queue = [[x, y, 0]];
  visited[y][x] = true;
  while (queue.length > 0) {
    const [cx, cy, d] = queue.shift();
    if (d > 5) break;
    for (const [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 1 || nx >= w - 1 || ny < 1 || ny >= h - 1) continue;  // 가장자리 제외
      if (visited[ny][nx]) continue;
      if (grid[ny][nx] === 0) {
        // 벽인데 양옆에 통로 하나 이상 있어야 의미있는 비밀공간
        const hasNeighborFloor = 
          grid[ny][nx-1] === 1 || grid[ny][nx+1] === 1 ||
          grid[ny-1]?.[nx] === 1 || grid[ny+1]?.[nx] === 1;
        if (hasNeighborFloor) return { x: nx, y: ny };
      }
      visited[ny][nx] = true;
      queue.push([nx, ny, d + 1]);
    }
  }
  return null;
}

// 자동 비밀 공간 배치 - 던전에서 적절한 벽 자리 찾기
function dgAutoSecrets(grid, w, h, count, seed) {
  const rand = dgSeededRandom(seed + '-secrets');
  const candidates = [];
  // 가장자리 제외하고, 양옆에 통로 있는 벽 찾기
  for (let y = 2; y < h - 2; y++) {
    for (let x = 2; x < w - 2; x++) {
      if (grid[y][x] !== 0) continue;
      // 양옆 통로 체크
      const hasNeighborFloor = 
        grid[y][x-1] === 1 || grid[y][x+1] === 1 ||
        grid[y-1]?.[x] === 1 || grid[y+1]?.[x] === 1;
      if (hasNeighborFloor) candidates.push({ x, y });
    }
  }
  if (candidates.length === 0) return [];
  // 시드 기반으로 섞고 count 개 뽑기
  const shuffled = [...candidates];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  // 너무 가까운 것끼리 안 뽑게
  const result = [];
  for (const c of shuffled) {
    if (result.length >= count) break;
    const tooClose = result.some(r => Math.abs(r.x - c.x) + Math.abs(r.y - c.y) < 3);
    if (!tooClose) result.push(c);
  }
  return result;
}
function dgBfsDist(grid, sx, sy, ex, ey, w, h) {
  if (sx < 0 || sx >= w || sy < 0 || sy >= h) return -1;
  if (ex < 0 || ex >= w || ey < 0 || ey >= h) return -1;
  if (!grid[sy] || !grid[ey]) return -1;
  if (grid[sy][sx] === 0 || grid[ey][ex] === 0) return -1;
  const visited = grid.map(r => r.map(() => false));
  const queue = [[sx, sy, 0]];
  visited[sy][sx] = true;
  while (queue.length > 0) {
    const [x, y, d] = queue.shift();
    if (x === ex && y === ey) return d;
    for (const [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
      if (visited[ny][nx]) continue;
      if (grid[ny][nx] === 0) continue;
      visited[ny][nx] = true;
      queue.push([nx, ny, d + 1]);
    }
  }
  return -1;
}

// ─── 아이콘 SVG ───
function dgCrown(cx, cy, level) {
  const s = 25 / 30;
  if (level === 'normal') {
    const w = 28 * s, h = 20 * s;
    return `<g transform="translate(${cx - w/2}, ${cy - h/2 + 1}) scale(${s})">
<g fill="#fff"><path d="M 0 16 L 0 10 L 4 14 L 7 5 L 11 14 L 14 2 L 17 14 L 21 5 L 24 14 L 28 10 L 28 16 Z"/><rect x="0" y="16" width="28" height="4"/></g>
<circle cx="14" cy="15" r="2" fill="#FF7722"/></g>`;
  }
  if (level === 'elite') {
    const w = 56 * s, h = 39 * s;
    return `<g transform="translate(${cx - w/2}, ${cy - h/2 + 2}) scale(${s})">
<g fill="#fff"><path d="M 0 32 L 0 20 L 8 28 L 14 10 L 22 28 L 28 4 L 34 28 L 42 10 L 48 28 L 56 20 L 56 32 Z"/><rect x="0" y="32" width="56" height="7"/></g>
<circle cx="28" cy="30" r="3.5" fill="#FF7722"/><circle cx="14" cy="30" r="2.5" fill="#00BBDD"/><circle cx="42" cy="30" r="2.5" fill="#00BBDD"/></g>`;
  }
  const w = 84 * s, h = 58 * s;
  return `<g transform="translate(${cx - w/2}, ${cy - h/2 + 3}) scale(${s})">
<g fill="#fff"><path d="M 0 48 L 0 30 L 12 42 L 21 15 L 33 42 L 42 4 L 51 42 L 63 15 L 72 42 L 84 30 L 84 48 Z"/><rect x="0" y="48" width="84" height="10"/></g>
<circle cx="42" cy="45" r="4.5" fill="#FF7722"/><circle cx="21" cy="45" r="3" fill="#00BBDD"/><circle cx="63" cy="45" r="3" fill="#00BBDD"/>
<circle cx="6" cy="45" r="2" fill="#DDAACC"/><circle cx="78" cy="45" r="2" fill="#DDAACC"/></g>`;
}
function dgSkull(cx, cy) {
  return `<g transform="translate(${cx}, ${cy}) scale(0.7) translate(-14, -14)" fill="#EE1166">
<ellipse cx="14" cy="14" rx="11" ry="10"/><rect x="6" y="20" width="16" height="6" rx="2"/>
<ellipse cx="9" cy="14" rx="3" ry="4" fill="#0e0e16"/><ellipse cx="19" cy="14" rx="3" ry="4" fill="#0e0e16"/>
<path d="M 12 18 L 14 21 L 16 18 Z" fill="#0e0e16"/>
<rect x="9" y="24" width="1.5" height="2" fill="#0e0e16"/><rect x="13" y="24" width="1.5" height="2" fill="#0e0e16"/><rect x="17" y="24" width="1.5" height="2" fill="#0e0e16"/></g>`;
}
function dgTreasure(cx, cy) {
  return `<g transform="translate(${cx - 9}, ${cy - 8})">
<rect x="0" y="3" width="18" height="13" fill="#CCAA88" stroke="#fff" stroke-width="0.5"/>
<rect x="0" y="3" width="18" height="4" fill="#FF7722"/>
<circle cx="9" cy="9" r="1.5" fill="#1a1410"/><rect x="8" y="9" width="2" height="4" fill="#1a1410"/></g>`;
}
function dgSave(cx, cy) {
  return `<g transform="translate(${cx - 8}, ${cy - 8})">
<rect x="6" y="0" width="4" height="16" fill="#00BBDD"/><rect x="0" y="6" width="16" height="4" fill="#00BBDD"/></g>`;
}
function dgLockedDoor(px, py, t) {
  return `<rect x="${px}" y="${py}" width="${t}" height="${t}" fill="#BB6688"/>
<g transform="translate(${px + t/2 - 5}, ${py + t/2 - 7})" fill="#fff">
<rect x="0" y="2" width="10" height="11" rx="1"/><circle cx="5" cy="7" r="1.5" fill="#BB6688"/><rect x="4" y="7" width="2" height="4" fill="#BB6688"/></g>`;
}
function dgPlayer(cx, cy, dir) {
  const arrow = dir === 'e' ? '▶' : dir === 'w' ? '◀' : dir === 'n' ? '▲' : '▼';
  return `<circle cx="${cx}" cy="${cy}" r="10" fill="#EE1166" stroke="#fff" stroke-width="2"/>
<text x="${cx}" y="${cy + 4}" fill="#fff" font-family="-apple-system,sans-serif" font-size="11" text-anchor="middle" font-weight="bold">${arrow}</text>`;
}

// ─── 메인 렌더 ───
function renderDungeon(params) {
  const TILE = 25, PAD = 20, HEADER = 32;
  
  // 파라미터 파싱
  const seed = (params.get('seed') || 'tx7f').slice(0, 16);
  const floor = safeInt(params.get('floor'), 1, 1, 999);
  
  let maxFloor;
  const explicitMax = parseInt(params.get('max'));
  if (explicitMax > 0) maxFloor = explicitMax;
  else {
    const tp = params.get('type');
    maxFloor = tp === 'long' ? 50 : tp === 'medium' ? 25 : tp === 'short' ? 10 : 10;
  }
  if (floor > maxFloor) maxFloor = floor;
  
  const label = esc(params.get('label') || `던전 ${floor}층`);
  const dirParam = params.get('dir');  // 명시값만 raw로 받음 (자동 계산 후 결정)
  const isLabyrinth = params.get('labyrinth') === 'on';
  const showCoords = params.get('coords') === 'on';  // 🆕 좌표 헤더 표시
  
  // 사용자 지정 크기 (선택)
  let customSize = null;
  const sizeParam = params.get('size');
  if (sizeParam) {
    const m = sizeParam.match(/^(\d+),(\d+)$/);
    if (m) {
      const w = Math.min(20, Math.max(5, parseInt(m[1])));
      const h = Math.min(16, Math.max(4, parseInt(m[2])));
      customSize = { w, h };
    }
  }
  
  const rules = dgGetFloorRules(floor, maxFloor, customSize);
  const dungeon = isLabyrinth
    ? dgGenerateLabyrinth(`${seed}-${floor}`, rules.width, rules.height, rules.bossLevel)
    : dgGenerateBasic(`${seed}-${floor}`, rules.width, rules.height, rules.bossLevel);
  const { grid, w, h, bossRoom, entranceRoom, type } = dungeon;
  
  // 플레이어/오브젝트 좌표
  const pxRaw = parseInt(params.get('px'));
  const pyRaw = parseInt(params.get('py'));
  let player = null;
  if (!isNaN(pxRaw) && !isNaN(pyRaw)) {
    // 플레이어는 보스방 포함 모든 통로로 자동 보정
    player = dgSnapPlayer(grid, pxRaw, pyRaw, w, h);
  }
  
  // ─── 신규: enter=on, px/py 없을 때 입구방 중앙에 자동 배치 ───
  let autoEntered = false;
  if (!player && params.get('enter') === 'on') {
    const ex = type === 'basic'
      ? entranceRoom.x + Math.floor((entranceRoom.w || 1) / 2)
      : entranceRoom.x;
    const ey = type === 'basic'
      ? entranceRoom.y + Math.floor((entranceRoom.h || 1) / 2)
      : entranceRoom.y;
    player = dgSnapPlayer(grid, ex, ey, w, h);
    autoEntered = true;
  }
  
  // ─── 신규: dir 결정 — 명시값 > 자동입장 시 입구→보스 방향 > 기본 's' ───
  let dir;
  if (dirParam) {
    dir = dirParam.toLowerCase();
  } else if (autoEntered && player) {
    const bossCx = bossRoom.x + (bossRoom.w || 1) / 2;
    const bossCy = bossRoom.y + (bossRoom.h || 1) / 2;
    const dx = bossCx - player.x;
    const dy = bossCy - player.y;
    if (Math.abs(dx) >= Math.abs(dy)) {
      dir = dx >= 0 ? 'e' : 'w';
    } else {
      dir = dy >= 0 ? 's' : 'n';
    }
  } else {
    dir = 's';
  }
  
  const snap = c => c ? dgSnapToFloor(grid, c.x, c.y, w, h, bossRoom) : null;
  const traps = dgParseCoords(params.get('traps')).map(snap).filter(c => c);
  const events = dgParseCoords(params.get('events')).map(snap).filter(c => c);
  const treasures = dgParseCoords(params.get('treasures')).map(snap).filter(c => c);
  const saves = dgParseCoords(params.get('saves')).map(snap).filter(c => c);
  const doors = dgParseCoords(params.get('doors'));
  
  // 비밀 공간: 사용자 지정 (벽 보정) + 자동 배치
  const secretsRaw = dgParseCoords(params.get('secrets'));
  const secrets = secretsRaw.map(c => dgSnapToWall(grid, c.x, c.y, w, h)).filter(c => c);
  
  // 자동 비밀 공간 추가 (auto_secrets=2 같이)
  const autoSecretsCount = parseInt(params.get('auto_secrets'));
  if (!isNaN(autoSecretsCount) && autoSecretsCount > 0) {
    const autoList = dgAutoSecrets(grid, w, h, Math.min(autoSecretsCount, 5), `${seed}-${floor}`);
    // 이미 지정된 비밀공간이랑 안 겹치게
    for (const a of autoList) {
      if (!secrets.some(s => s.x === a.x && s.y === a.y)) secrets.push(a);
    }
  }
  
  const playerInBoss = player && dgIsInBossRoom(player.x, player.y, bossRoom);
  
  // SVG 크기 (coords=on이면 좌표 헤더 영역 추가)
  const COORD_LEFT = showCoords ? 18 : 0;
  const COORD_TOP = showCoords ? 14 : 0;
  const svgW = PAD * 2 + COORD_LEFT + w * TILE;
  const svgH = PAD * 2 + HEADER + COORD_TOP + h * TILE;
  
  const bossColor = rules.bossLevel === 'final' ? '#EE1166'
                  : rules.bossLevel === 'elite' ? '#884499' : '#BB6688';
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">`;
  svg += `<rect width="${svgW}" height="${svgH}" fill="#0f0f18"/>`;
  
  // 헤더
  svg += `<text x="${PAD}" y="22" fill="#DDAACC" font-family="monospace" font-size="13" font-weight="bold">${label}</text>`;
  const modeLabel = isLabyrinth ? '[미궁] ' : '';
  const statusLabel = playerInBoss ? ' · ⚔ 전투' : '';
  svg += `<text x="${svgW - PAD}" y="22" fill="#8888CC" font-family="monospace" font-size="11" text-anchor="end">${modeLabel}${rules.width}×${rules.height} · ${rules.bossLevel}${statusLabel}</text>`;
  
  const gx0 = PAD + COORD_LEFT, gy0 = PAD + HEADER + COORD_TOP;
  const px = x => gx0 + x * TILE;
  const py = y => gy0 + y * TILE;
  const cx = x => px(x) + TILE / 2;
  const cy = y => py(y) + TILE / 2;
  
  // 🆕 좌표 헤더 (coords=on일 때만, A=x1 / B=x2 ... 1=y1 / 2=y2 ...)
  if (showCoords) {
    for (let x = 1; x < w; x++) {
      const letter = String.fromCharCode(64 + x);
      svg += `<text x="${cx(x)}" y="${gy0 - 4}" fill="#8888CC" font-family="monospace" font-size="9" text-anchor="middle" opacity="0.7">${letter}</text>`;
    }
    for (let y = 1; y < h; y++) {
      svg += `<text x="${gx0 - 6}" y="${cy(y) + 3}" fill="#8888CC" font-family="monospace" font-size="9" text-anchor="end" opacity="0.7">${y}</text>`;
    }
  }
  
  // 1. 그리드
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (grid[y][x] === 0) {
        const isSecret = secrets.some(s => s.x === x && s.y === y);
        if (isSecret) {
          svg += `<rect x="${px(x)}" y="${py(y)}" width="${TILE}" height="${TILE}" fill="#3a3a48" stroke="#DDAACC" stroke-dasharray="3 3" stroke-width="1.5"/>`;
        } else {
          svg += `<rect x="${px(x)}" y="${py(y)}" width="${TILE}" height="${TILE}" fill="#3a3a48"/>`;
        }
      } else {
        svg += `<rect x="${px(x)}" y="${py(y)}" width="${TILE}" height="${TILE}" fill="#0e0e16" stroke="#2a2a38" stroke-width="0.5"/>`;
      }
    }
  }
  
  // 2. 입구방
  if (type === 'basic') {
    svg += `<rect x="${px(entranceRoom.x)}" y="${py(entranceRoom.y)}" width="${entranceRoom.w * TILE}" height="${entranceRoom.h * TILE}" fill="#CCAA88" opacity="0.3"/>`;
    svg += `<rect x="${px(entranceRoom.x)}" y="${py(entranceRoom.y)}" width="${entranceRoom.w * TILE}" height="${entranceRoom.h * TILE}" fill="none" stroke="#CCAA88" stroke-width="1"/>`;
    const eCx = px(entranceRoom.x) + entranceRoom.w * TILE / 2;
    const eCy = py(entranceRoom.y) + entranceRoom.h * TILE / 2 + 5;
    svg += `<text x="${eCx}" y="${eCy}" fill="#CCAA88" font-family="monospace" font-size="14" text-anchor="middle" font-weight="bold">E</text>`;
  } else {
    svg += `<rect x="${px(entranceRoom.x)}" y="${py(entranceRoom.y)}" width="${TILE}" height="${TILE}" fill="#CCAA88"/>`;
    svg += `<text x="${px(entranceRoom.x) + TILE/2}" y="${py(entranceRoom.y) + TILE/2 + 5}" fill="#0f0f18" font-family="monospace" font-size="13" text-anchor="middle" font-weight="bold">E</text>`;
  }
  
  // 3. 보스방
  const bPxX = px(bossRoom.x), bPxY = py(bossRoom.y);
  const bPxW = bossRoom.w * TILE, bPxH = bossRoom.h * TILE;
  if (rules.bossLevel === 'normal') {
    svg += `<rect x="${bPxX}" y="${bPxY}" width="${bPxW}" height="${bPxH}" fill="${bossColor}"/>`;
  } else {
    const op = rules.bossLevel === 'final' ? 0.3 : 0.4;
    const sw = rules.bossLevel === 'final' ? 3 : 2;
    svg += `<rect x="${bPxX}" y="${bPxY}" width="${bPxW}" height="${bPxH}" fill="${bossColor}" opacity="${op}"/>`;
    svg += `<rect x="${bPxX}" y="${bPxY}" width="${bPxW}" height="${bPxH}" fill="none" stroke="${bossColor}" stroke-width="${sw}"/>`;
  }
  if (!playerInBoss) {
    svg += dgCrown(bPxX + bPxW / 2, bPxY + bPxH / 2, rules.bossLevel);
  }
  
  // 4. 잠긴 문
  for (const d of doors) {
    if (d.x >= 0 && d.x < w && d.y >= 0 && d.y < h) {
      svg += dgLockedDoor(px(d.x), py(d.y), TILE);
    }
  }
  
  // 5. 함정/이벤트 (거리 기반)
  function calcDist(tx, ty) {
    if (!player) return 999;
    return dgBfsDist(grid, player.x, player.y, tx, ty, w, h);
  }
  
  for (const t of traps) {
    const d = calcDist(t.x, t.y);
    if (d < 0 || d > 4) continue;
    if (d <= 1) svg += dgSkull(cx(t.x), cy(t.y));
    else if (d <= 3) svg += `<text x="${cx(t.x)}" y="${cy(t.y) + 8}" fill="#EE1166" font-family="-apple-system,sans-serif" font-size="22" text-anchor="middle" font-weight="bold" opacity="0.65">!</text>`;
  }
  for (const e of events) {
    const d = calcDist(e.x, e.y);
    if (d < 0 || d > 4) continue;
    if (d <= 1) svg += `<text x="${cx(e.x)}" y="${cy(e.y) + 8}" fill="#FF7722" font-family="-apple-system,sans-serif" font-size="22" text-anchor="middle" font-weight="bold">?</text>`;
    else if (d <= 3) svg += `<text x="${cx(e.x)}" y="${cy(e.y) + 8}" fill="#FF7722" font-family="-apple-system,sans-serif" font-size="22" text-anchor="middle" font-weight="bold" opacity="0.55">?</text>`;
  }
  
  // 6. 보물/세이브
  for (const t of treasures) svg += dgTreasure(cx(t.x), cy(t.y));
  for (const s of saves) svg += dgSave(cx(s.x), cy(s.y));
  
  // 7. 플레이어
  if (player && player.x >= 0 && player.x < w && player.y >= 0 && player.y < h) {
    svg += dgPlayer(cx(player.x), cy(player.y), dir);
  }
  
  svg += `</svg>`;
  return svg;
}



// ════════════════════════════════════════════
//  MMO (MMORPG 상태창 — SAO 아인크라드 톤)
//  &p=이름§칭호§직업§레벨
//  &s=HP§HPmax§MP§MPmax§EXP(0-100)§COL
//  &tm=날짜§요일§시각§누적시간      (예: 2024.03.15§FRI§14:32§3day 47hr)
//  &sk=스킬§숙련도(0-1000)§상태|...
//      상태: ready / active / cd:N / lock:사유 / seal:사유 / empty
//  &eq=무기들§등급들§...|방어구...|장신구...
//      한 슬롯 안에서 (이름§등급) 짝으로 다중 (이도류 등)
//  &pt=파티원§HP%§직업|... (최대 4명)
//  &gd=길드명§계급
//  &buf=상태이상§남은초|... (최대 8개)
//      디버프: 독/혼란/실명/출혈/마비/저주/침묵
//      버프:   축복/가속/방어/회복/집중
//  &lo=1 (로그아웃 버튼 표시; 0이거나 생략시 슬롯 자체 사라짐)
// ════════════════════════════════════════════
function renderMmo(params) {
  const W = 480, PAD = 18;
  const INNER_W = W - PAD*2;

  const pp = (params.get('p') || '겨울§월광 검사§듀얼 블레이드§42').split('§');
  const ss = (params.get('s') || '780§980§420§600§67§14580').split('§');
  const skRaw = params.get('sk') ? params.get('sk').split('|') : [];
  const eq = params.get('eq') ? params.get('eq').split('|') : [];
  const pt = params.get('pt') ? params.get('pt').split('|') : [];
  const gd = (params.get('gd') || '§').split('§');
  const tm = (params.get('tm') || '§§§').split('§');
  const buf = params.get('buf') ? params.get('buf').split('|') : [];
  const lo = params.get('lo') === '1';

  const name = esc(pp[0]||'???'), title = esc(pp[1]||''), job = esc(pp[2]||'');
  const lv = safeInt(pp[3], 1, 1, 999);
  const hp = safeInt(ss[0], 100, 0, 999999), hpMax = safeInt(ss[1], 100, 1, 999999);
  const mp = safeInt(ss[2], 50, 0, 999999),  mpMax = safeInt(ss[3], 100, 1, 999999);
  const exp = safeInt(ss[4], 0, 0, 100);
  const col = safeInt(ss[5], 0, 0, 99999999);
  const guildName = esc(gd[0]||''), guildRank = esc(gd[1]||'');
  const tDate = esc(tm[0]||''), tDay = esc(tm[1]||''), tNow = esc(tm[2]||''), tPlay = esc(tm[3]||'');

  // 색상 팔레트 (네 가지 메인 + 비비드 보조)
  const C = {
    bg:'#0d0f1f', panel:'#13162a', panelHi:'#1a1f38', border:'#2a3050',
    indigo:'#8888CC', indigoSoft:'#5a5e9a',
    rose:'#BB6688', sand:'#CCAA88', pink:'#DDAACC',
    cyan:'#00BBDD', purple:'#884499', orange:'#FF7722',
    hot:'#FF6699', danger:'#EE1166', blue:'#0077DD',
    dim:'#5a5e7a', text:'#d8d6f0', textDim:'#9a9bc0',
  };

  // 텍스트 길이 제한 (ellipsis)
  const truncate = (str, maxChars) => {
    if (str.length <= maxChars) return str;
    return str.slice(0, maxChars - 1) + '…';
  };

  // 스킬 파싱 + empty 필터
  const skills = skRaw
    .map(s => {
      const parts = s.split('§');
      const state = (parts[2] || 'ready').trim();
      return {
        name: esc(parts[0]||''),
        prof: safeInt(parts[1], 0, 0, 1000),
        baseState: state.split(':')[0],
        reason: state.includes(':') ? state.slice(state.indexOf(':')+1) : ''
      };
    })
    .filter(s => s.baseState !== 'empty')
    .slice(0, 6);

  // HP/MP 비율 따라 색상 변동
  const hpPct = hp / hpMax;
  const hpColor = hpPct < 0.2 ? C.danger : (hpPct < 0.5 ? C.orange : C.rose);
  const hpColor2 = hpPct < 0.2 ? C.hot : (hpPct < 0.5 ? C.sand : C.pink);
  const mpPct = mp / mpMax;
  const mpColor = mpPct < 0.2 ? C.purple : C.indigoSoft;
  const mpColor2 = mpPct < 0.2 ? '#5a3a6a' : C.indigo;

  // EQUIP 파싱 — § 짝수 단위로 (이름,등급) 쌍
  const eqRows = eq.slice(0,3).map(slot => {
    const tokens = slot.split('§');
    const pairs = [];
    for (let i = 0; i < tokens.length; i += 2) {
      const n = (tokens[i] || '').trim();
      const g = (tokens[i+1] || '일반').trim();
      if (n) pairs.push({name: n, grade: g});
    }
    if (pairs.length === 0) pairs.push({name:'—', grade:'일반'});
    return pairs;
  });
  // 좌측: 무기+방어구 / 우측: 장신구
  const leftSlots  = [];
  const rightSlots = [];
  if (eqRows[0]) leftSlots.push({label:'무기',   pairs:eqRows[0]});
  if (eqRows[1]) leftSlots.push({label:'방어구', pairs:eqRows[1]});
  if (eqRows[2]) rightSlots.push({label:'장신구',pairs:eqRows[2]});

  const EQ_ROW = 20;
  const leftLines  = leftSlots.reduce((acc, s) => acc + s.pairs.length, 0);
  const rightLines = rightSlots.reduce((acc, s) => acc + s.pairs.length, 0);
  const leftHeight  = leftLines * EQ_ROW + Math.max(0, leftSlots.length - 1) * 4;
  const rightHeight = rightLines * EQ_ROW + Math.max(0, rightSlots.length - 1) * 4;
  const maxEqHeight = Math.max(leftHeight, rightHeight, 0);

  // 섹션 높이 계산
  const H_HEADER = 78;
  const H_TIME   = (tDate || tNow) ? 26 : 0;
  const H_VITAL  = 70;
  const H_BUFF   = buf.length > 0 ? 58 : 0;
  const H_EXP    = 34;
  const SK_ROW   = 32;
  const H_SKILL  = skills.length > 0 ? (26 + skills.length * SK_ROW + 10) : 0;
  const H_EQUIP  = eq.length > 0 ? (26 + maxEqHeight + 10) : 0;
  const PT_ROW   = 28;
  const H_PARTY  = pt.length > 0 ? (26 + Math.min(pt.length, 4) * PT_ROW + 10) : 0;
  const H_GUILD  = guildName ? 32 : 0;
  const H_LOGOUT = lo ? 48 : 0;
  const H_FOOT   = 14;

  const TOTAL_H = H_HEADER + H_TIME + H_VITAL + H_BUFF + H_EXP + H_SKILL + H_EQUIP + H_PARTY + H_GUILD + H_LOGOUT + H_FOOT;

  let y = 0;
  let svg = '';

  // 배경 + 격자
  svg += `<defs>
    <pattern id="mmoGrid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${C.border}" stroke-width="0.3" opacity="0.4"/>
    </pattern>
    <linearGradient id="mmoHp" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${hpColor}"/><stop offset="100%" stop-color="${hpColor2}"/>
    </linearGradient>
    <linearGradient id="mmoMp" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${mpColor}"/><stop offset="100%" stop-color="${mpColor2}"/>
    </linearGradient>
    <linearGradient id="mmoExp" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${C.purple}"/><stop offset="100%" stop-color="${C.indigo}"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${W}" height="${TOTAL_H}" fill="${C.bg}"/>
  <rect x="0" y="0" width="${W}" height="${TOTAL_H}" fill="url(#mmoGrid)"/>`;
  svg += `<line x1="0" y1="0" x2="0" y2="${TOTAL_H}" stroke="${C.indigo}" stroke-width="2" opacity="0.6"/>`;
  svg += `<line x1="${W}" y1="0" x2="${W}" y2="${TOTAL_H}" stroke="${C.indigo}" stroke-width="2" opacity="0.6"/>`;

  // HEADER
  svg += `<rect x="0" y="${y}" width="${W}" height="${H_HEADER}" fill="${C.panel}"/>`;
  svg += `<path d="M${PAD-4} ${y+8} L${PAD-4} ${y+18} M${PAD-4} ${y+8} L${PAD+6} ${y+8}" stroke="${C.indigo}" stroke-width="2" fill="none"/>`;
  svg += `<path d="M${W-PAD+4} ${y+8} L${W-PAD+4} ${y+18} M${W-PAD+4} ${y+8} L${W-PAD-6} ${y+8}" stroke="${C.indigo}" stroke-width="2" fill="none"/>`;
  svg += `<text x="${PAD}" y="${y+30}" font-family="'Noto Sans KR',sans-serif" font-size="20" font-weight="bold" fill="${C.text}">${name}</text>`;
  if (title) svg += `<text x="${PAD}" y="${y+48}" font-family="'Noto Sans KR',sans-serif" font-size="11" fill="${C.pink}" font-style="italic">― ${title} ―</text>`;
  if (job)   svg += `<text x="${PAD}" y="${y+64}" font-family="monospace" font-size="10" font-weight="bold" fill="${C.textDim}" letter-spacing="1">${job}</text>`;
  svg += `<rect x="${W-PAD-58}" y="${y+18}" width="58" height="36" fill="${C.bg}" stroke="${C.indigo}" stroke-width="1"/>`;
  svg += `<text x="${W-PAD-29}" y="${y+31}" font-family="monospace" font-size="8" fill="${C.textDim}" text-anchor="middle" letter-spacing="2">LEVEL</text>`;
  svg += `<text x="${W-PAD-29}" y="${y+49}" font-family="monospace" font-size="18" font-weight="bold" fill="${C.indigo}" text-anchor="middle">${lv}</text>`;
  y += H_HEADER;

  // TIME
  if (H_TIME > 0) {
    svg += `<rect x="0" y="${y}" width="${W}" height="${H_TIME}" fill="${C.panelHi}"/>`;
    let leftStr = '';
    if (tDate) leftStr += tDate;
    if (tDay) leftStr += ` ${tDay}`;
    if (tNow) leftStr += `  ${tNow}`;
    svg += `<text x="${PAD}" y="${y+17}" font-family="monospace" font-size="11" font-weight="bold" fill="${C.cyan}" letter-spacing="1">⏱ ${leftStr}</text>`;
    if (tPlay) svg += `<text x="${W-PAD}" y="${y+17}" font-family="monospace" font-size="10" fill="${C.textDim}" text-anchor="end" letter-spacing="1">PLAY ${tPlay}</text>`;
    y += H_TIME;
  }

  // HP/MP
  svg += `<rect x="0" y="${y}" width="${W}" height="${H_VITAL}" fill="${C.panelHi}"/>`;
  const drawVitalBar = (label, val, max, gradId, yy, valColor, pulse) => {
    const pct = Math.max(0, Math.min(1, val / max));
    const barX = PAD + 36, barW = INNER_W - 36 - 90;
    let out = `<text x="${PAD}" y="${yy+13}" font-family="monospace" font-size="12" font-weight="bold" fill="${C.textDim}" letter-spacing="1">${label}</text>`;
    out += `<rect x="${barX}" y="${yy+3}" width="${barW}" height="13" fill="${C.bg}" stroke="${C.border}" stroke-width="0.5"/>`;
    if (pulse) {
      out += `<g><rect x="${barX}" y="${yy+3}" width="${Math.round(barW*pct)}" height="13" fill="url(#${gradId})"/>`;
      out += `<rect x="${barX}" y="${yy+3}" width="${Math.round(barW*pct)}" height="6" fill="rgba(255,255,255,0.18)"/>`;
      out += `<animate attributeName="opacity" values="1;0.4;1" dur="0.9s" repeatCount="indefinite"/></g>`;
    } else {
      out += `<rect x="${barX}" y="${yy+3}" width="${Math.round(barW*pct)}" height="13" fill="url(#${gradId})"/>`;
      out += `<rect x="${barX}" y="${yy+3}" width="${Math.round(barW*pct)}" height="6" fill="rgba(255,255,255,0.18)"/>`;
    }
    for (let i = 1; i < 4; i++) {
      const tx = barX + Math.round(barW * i / 4);
      out += `<line x1="${tx}" y1="${yy+3}" x2="${tx}" y2="${yy+16}" stroke="${C.bg}" stroke-width="1" opacity="0.6"/>`;
    }
    out += `<text x="${W-PAD}" y="${yy+14}" font-family="monospace" font-size="12" font-weight="bold" fill="${valColor}" text-anchor="end">${val} / ${max}</text>`;
    return out;
  };
  svg += drawVitalBar('HP', hp, hpMax, 'mmoHp', y + 12, hpPct < 0.2 ? C.danger : C.text, hpPct < 0.2);
  svg += drawVitalBar('MP', mp, mpMax, 'mmoMp', y + 40, mpPct < 0.2 ? C.purple : C.text, mpPct < 0.2);
  y += H_VITAL;

  // BUFF/DEBUFF
  if (H_BUFF > 0) {
    svg += `<rect x="0" y="${y}" width="${W}" height="${H_BUFF}" fill="${C.panel}"/>`;
    svg += `<text x="${PAD}" y="${y+14}" font-family="monospace" font-size="9" fill="${C.textDim}" letter-spacing="2">STATUS</text>`;
    const debuffSet = {'독':[C.purple,'☠'], '혼란':[C.hot,'?'], '실명':[C.dim,'◐'], '출혈':[C.danger,'✚'], '마비':[C.orange,'⚡'], '저주':[C.purple,'✠'], '침묵':[C.dim,'✕']};
    const buffSet   = {'축복':[C.sand,'✦'], '가속':[C.cyan,'»'], '방어':[C.indigo,'◈'], '회복':[C.pink,'❤'], '집중':[C.blue,'◎']};
    const BOX_W = 54, BOX_H = 34, GAP = 4;
    buf.slice(0, 8).forEach((b, i) => {
      const parts = b.split('§');
      const bname = (parts[0] || '').trim();
      const btime = (parts[1] || '').trim();
      const def = debuffSet[bname] || buffSet[bname] || [C.textDim, '•'];
      const bx = PAD + i * (BOX_W + GAP);
      const by = y + 20;
      svg += `<rect x="${bx}" y="${by}" width="${BOX_W}" height="${BOX_H}" fill="${C.bg}" stroke="${def[0]}" stroke-width="1"/>`;
      svg += `<text x="${bx+9}" y="${by+14}" font-family="monospace" font-size="11" fill="${def[0]}" text-anchor="middle">${def[1]}</text>`;
      svg += `<text x="${bx+32}" y="${by+13}" font-family="'Noto Sans KR',sans-serif" font-size="10" font-weight="bold" fill="${C.text}" text-anchor="middle">${esc(bname)}</text>`;
      svg += `<line x1="${bx+3}" y1="${by+19}" x2="${bx+BOX_W-3}" y2="${by+19}" stroke="${def[0]}" stroke-width="0.4" opacity="0.5"/>`;
      if (btime) svg += `<text x="${bx+BOX_W/2}" y="${by+30}" font-family="monospace" font-size="10" font-weight="bold" fill="${def[0]}" text-anchor="middle">${esc(btime)}</text>`;
    });
    y += H_BUFF;
  }

  // EXP / COL
  svg += `<rect x="0" y="${y}" width="${W}" height="${H_EXP}" fill="${C.panel}"/>`;
  svg += `<text x="${PAD}" y="${y+13}" font-family="monospace" font-size="9" fill="${C.textDim}" letter-spacing="2">EXP</text>`;
  svg += `<rect x="${PAD+36}" y="${y+6}" width="${INNER_W-36-90}" height="8" fill="${C.bg}" stroke="${C.border}" stroke-width="0.5"/>`;
  svg += `<rect x="${PAD+36}" y="${y+6}" width="${Math.round((INNER_W-36-90)*exp/100)}" height="8" fill="url(#mmoExp)"/>`;
  svg += `<text x="${W-PAD}" y="${y+13}" font-family="monospace" font-size="10" font-weight="bold" fill="${C.indigo}" text-anchor="end">${exp}.00%</text>`;
  svg += `<text x="${PAD}" y="${y+27}" font-family="monospace" font-size="9" fill="${C.textDim}" letter-spacing="2">COL</text>`;
  svg += `<text x="${W-PAD}" y="${y+27}" font-family="monospace" font-size="11" font-weight="bold" fill="${C.sand}" text-anchor="end">${col.toLocaleString()}</text>`;
  y += H_EXP;

  // SKILL
  if (H_SKILL > 0) {
    svg += `<rect x="0" y="${y}" width="${W}" height="${H_SKILL}" fill="${C.panel}"/>`;
    svg += `<text x="${PAD}" y="${y+16}" font-family="monospace" font-size="10" font-weight="bold" fill="${C.indigo}" letter-spacing="2">― SKILL ―</text>`;
    svg += `<line x1="${PAD+60}" y1="${y+12}" x2="${W-PAD}" y2="${y+12}" stroke="${C.border}" stroke-width="0.5"/>`;
    const ICON_SIZE = 24;
    skills.forEach((s, i) => {
      const sy = y + 26 + i * SK_ROW;
      const iconX = PAD;
      let iconBorder = C.indigo, iconFill = C.bg, glyph = '✦', glyphColor = C.indigo, opacity = 1;
      let overlay = '';

      if (s.baseState === 'lock') {
        iconBorder = C.dim; glyph = '🔒'; glyphColor = C.dim; opacity = 0.4;
      } else if (s.baseState === 'seal') {
        iconBorder = C.danger; glyph = '✕'; glyphColor = C.danger; opacity = 0.8;
      } else if (s.baseState === 'active') {
        iconBorder = C.pink; glyphColor = C.pink;
      } else if (s.baseState === 'cd') {
        const raw = (s.reason || '').trim();
        // 단위 파싱: 숫자+선택적단위 (ms/s/m/h). 단위 없으면 초로 가정.
        const mt = raw.match(/^(\d+(?:\.\d+)?)\s*(ms|s|m|h)?$/i);
        let cdDur = '', cdDisplay = raw;
        if (mt) {
          const num = mt[1];
          const unit = (mt[2] || 's').toLowerCase();
          // SMIL dur: 분은 'min'으로 변환, 나머지는 그대로
          if (unit === 'm')      cdDur = num + 'min';
          else if (unit === 'h') cdDur = num + 'h';
          else if (unit === 'ms')cdDur = num + 'ms';
          else                    cdDur = num + 's';
          // 표시: 입력에 단위가 있으면 그대로, 없으면 's' 부착
          cdDisplay = mt[2] ? raw : (num + 's');
        }
        iconBorder = C.indigoSoft; opacity = 0.7;
        overlay = `<rect x="${iconX}" y="${sy}" width="${ICON_SIZE}" height="${ICON_SIZE}" fill="rgba(0,0,0,0.65)"/>`;
        const cx = iconX + ICON_SIZE/2, cy = sy + ICON_SIZE/2, r = ICON_SIZE/2 - 2;
        const circ = (2 * Math.PI * r).toFixed(2);
        // 원형 stroke 게이지: 시계방향으로 비워짐 → 다시 처음부터 반복 (무한)
        overlay += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.orange}" stroke-width="2" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="0" transform="rotate(-90 ${cx} ${cy})" opacity="0.9">`;
        if (cdDur) {
          overlay += `<animate attributeName="stroke-dashoffset" from="0" to="${circ}" dur="${cdDur}" repeatCount="indefinite"/>`;
        }
        overlay += `</circle>`;
        overlay += `<text x="${cx}" y="${cy+5}" font-family="monospace" font-size="12" font-weight="bold" fill="${C.orange}" text-anchor="middle" stroke="${C.bg}" stroke-width="0.3">${esc(cdDisplay)}</text>`;
        glyph = '';
      }

      svg += `<rect x="${iconX}" y="${sy}" width="${ICON_SIZE}" height="${ICON_SIZE}" fill="${iconFill}" stroke="${iconBorder}" stroke-width="1" opacity="${opacity}"/>`;
      if (glyph) svg += `<text x="${iconX+ICON_SIZE/2}" y="${sy+ICON_SIZE/2+5}" font-family="monospace" font-size="14" fill="${glyphColor}" text-anchor="middle" opacity="${opacity}">${glyph}</text>`;
      svg += overlay;

      const nameColor = (s.baseState === 'lock' || s.baseState === 'seal') ? C.dim : (s.baseState === 'active' ? C.pink : C.text);
      svg += `<text x="${PAD+34}" y="${sy+11}" font-family="'Noto Sans KR',sans-serif" font-size="12" font-weight="bold" fill="${nameColor}">${s.name || '???'}</text>`;

      let stateLabel = '', stateColor = C.textDim;
      if (s.baseState === 'ready')       { stateLabel = 'READY';    stateColor = C.indigo; }
      else if (s.baseState === 'active') { stateLabel = 'ACTIVE';   stateColor = C.pink; }
      else if (s.baseState === 'lock')   { stateLabel = 'LOCKED';   stateColor = C.dim; }
      else if (s.baseState === 'seal')   { stateLabel = 'SEALED';   stateColor = C.danger; }
      else if (s.baseState === 'cd')     { stateLabel = 'COOLDOWN'; stateColor = C.orange; }
      if (s.reason && (s.baseState === 'lock' || s.baseState === 'seal')) stateLabel += ` [${esc(s.reason)}]`;
      svg += `<text x="${W-PAD}" y="${sy+11}" font-family="monospace" font-size="10" font-weight="bold" fill="${stateColor}" text-anchor="end" letter-spacing="1">${stateLabel}</text>`;

      const profBarW = INNER_W - 34;
      svg += `<rect x="${PAD+34}" y="${sy+15}" width="${profBarW}" height="4" fill="${C.bg}" stroke="${C.border}" stroke-width="0.3"/>`;
      if (s.baseState !== 'lock' && s.baseState !== 'seal') {
        svg += `<rect x="${PAD+34}" y="${sy+15}" width="${Math.round(profBarW*s.prof/1000)}" height="4" fill="${C.indigo}" opacity="${s.baseState==='active'?1:0.7}"/>`;
      }
      const profText = (s.baseState === 'lock' || s.baseState === 'seal') ? '---' : s.prof + ' / 1000';
      svg += `<text x="${W-PAD}" y="${sy+27}" font-family="monospace" font-size="9" fill="${C.textDim}" text-anchor="end">${profText}</text>`;
    });
    y += H_SKILL;
  }

  // EQUIP - 2칼럼 (좌: 무기+방어구, 우: 장신구)
  if (H_EQUIP > 0) {
    svg += `<rect x="0" y="${y}" width="${W}" height="${H_EQUIP}" fill="${C.panelHi}"/>`;
    svg += `<text x="${PAD}" y="${y+16}" font-family="monospace" font-size="10" font-weight="bold" fill="${C.indigo}" letter-spacing="2">― EQUIP ―</text>`;
    svg += `<line x1="${PAD+60}" y1="${y+12}" x2="${W-PAD}" y2="${y+12}" stroke="${C.border}" stroke-width="0.5"/>`;
    const gradeColor = (g) => rarityColor(g);
    const COL_W = (INNER_W - 12) / 2;
    const LEFT_X  = PAD;
    const RIGHT_X = PAD + COL_W + 12;
    const dividerX = PAD + COL_W + 6;
    svg += `<line x1="${dividerX}" y1="${y+22}" x2="${dividerX}" y2="${y+H_EQUIP-6}" stroke="${C.border}" stroke-width="0.5" opacity="0.6"/>`;

    const drawColumn = (slots, colX, colW) => {
      let cy = y + 26;
      slots.forEach((slot, si) => {
        slot.pairs.forEach((it, j) => {
          if (j === 0) {
            svg += `<text x="${colX}" y="${cy+12}" font-family="monospace" font-size="9" fill="${C.textDim}" letter-spacing="1">${slot.label}</text>`;
          } else {
            svg += `<text x="${colX+34}" y="${cy+12}" font-family="monospace" font-size="9" fill="${C.dim}">└</text>`;
          }
          const itemName = truncate(it.name, 11);
          const nameX = (j === 0) ? colX + 38 : colX + 44;
          svg += `<text x="${nameX}" y="${cy+12}" font-family="'Noto Sans KR',sans-serif" font-size="11" fill="${C.text}">${esc(itemName)}</text>`;
          svg += `<text x="${colX+colW}" y="${cy+12}" font-family="monospace" font-size="9" font-weight="bold" fill="${gradeColor(it.grade)}" text-anchor="end" letter-spacing="1">[${esc(it.grade)}]</text>`;
          cy += EQ_ROW;
        });
        if (si < slots.length - 1) cy += 4;
      });
    };
    drawColumn(leftSlots, LEFT_X, COL_W);
    drawColumn(rightSlots, RIGHT_X, COL_W);
    y += H_EQUIP;
  }

  // PARTY
  if (H_PARTY > 0) {
    svg += `<rect x="0" y="${y}" width="${W}" height="${H_PARTY}" fill="${C.panel}"/>`;
    svg += `<text x="${PAD}" y="${y+16}" font-family="monospace" font-size="10" font-weight="bold" fill="${C.indigo}" letter-spacing="2">― PARTY ―</text>`;
    svg += `<line x1="${PAD+60}" y1="${y+12}" x2="${W-PAD}" y2="${y+12}" stroke="${C.border}" stroke-width="0.5"/>`;
    pt.slice(0, 4).forEach((p, i) => {
      const parts = p.split('§');
      const pname = esc(parts[0]||'—');
      const phpPct = safeInt(parts[1], 100, 0, 100);
      const pjob = esc(parts[2]||'');
      const py = y + 26 + i * PT_ROW;
      svg += `<rect x="${PAD}" y="${py}" width="20" height="20" fill="${C.bg}" stroke="${C.indigo}" stroke-width="1"/>`;
      svg += `<text x="${PAD+10}" y="${py+15}" font-family="monospace" font-size="12" fill="${C.indigo}" text-anchor="middle">●</text>`;
      svg += `<text x="${PAD+28}" y="${py+10}" font-family="'Noto Sans KR',sans-serif" font-size="11" font-weight="bold" fill="${C.text}">${pname}</text>`;
      svg += `<text x="${PAD+28}" y="${py+21}" font-family="monospace" font-size="9" fill="${C.textDim}">${pjob}</text>`;
      const pbarX = PAD + 140, pbarW = INNER_W - 140 - 40;
      const pColor = phpPct < 20 ? C.danger : (phpPct < 50 ? C.orange : C.rose);
      svg += `<rect x="${pbarX}" y="${py+7}" width="${pbarW}" height="7" fill="${C.bg}" stroke="${C.border}" stroke-width="0.3"/>`;
      svg += `<rect x="${pbarX}" y="${py+7}" width="${Math.round(pbarW*phpPct/100)}" height="7" fill="${pColor}"/>`;
      svg += `<text x="${W-PAD}" y="${py+13}" font-family="monospace" font-size="10" font-weight="bold" fill="${pColor}" text-anchor="end">${phpPct}%</text>`;
    });
    y += H_PARTY;
  }

  // GUILD
  if (H_GUILD > 0) {
    svg += `<rect x="0" y="${y}" width="${W}" height="${H_GUILD}" fill="${C.panelHi}"/>`;
    svg += `<text x="${PAD}" y="${y+20}" font-family="monospace" font-size="10" fill="${C.textDim}" letter-spacing="2">GUILD</text>`;
    svg += `<text x="${PAD+58}" y="${y+20}" font-family="'Noto Sans KR',sans-serif" font-size="13" font-weight="bold" fill="${C.pink}">⚜ ${guildName}</text>`;
    if (guildRank) svg += `<text x="${W-PAD}" y="${y+20}" font-family="monospace" font-size="11" font-weight="bold" fill="${C.sand}" text-anchor="end">[${guildRank}]</text>`;
    y += H_GUILD;
  }

  // LOGOUT (lo=1일 때만)
  if (lo) {
    svg += `<rect x="0" y="${y}" width="${W}" height="${H_LOGOUT}" fill="${C.panel}"/>`;
    const btnW = 180, btnH = 32;
    const btnX = (W - btnW) / 2, btnY = y + 8;
    svg += `<rect x="${btnX}" y="${btnY}" width="${btnW}" height="${btnH}" fill="${C.bg}" stroke="${C.danger}" stroke-width="1.5"/>`;
    svg += `<rect x="${btnX+3}" y="${btnY+3}" width="${btnW-6}" height="${btnH-6}" fill="none" stroke="${C.danger}" stroke-width="0.3" opacity="0.6"/>`;
    svg += `<text x="${W/2}" y="${btnY+22}" font-family="monospace" font-size="13" font-weight="bold" fill="${C.danger}" text-anchor="middle" letter-spacing="3">LOG OUT</text>`;
    y += H_LOGOUT;
  }

  // FOOTER
  svg += `<text x="${PAD}" y="${y+9}" font-family="monospace" font-size="8" fill="${C.dim}" letter-spacing="1">[ SYSTEM ]</text>`;
  svg += `<text x="${W-PAD}" y="${y+9}" font-family="monospace" font-size="8" fill="${C.dim}" text-anchor="end" letter-spacing="1">v2.04</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${TOTAL_H}" viewBox="0 0 ${W} ${TOTAL_H}">${svg}</svg>`;
}



// ════════════════════════════════════════════
//  REWARD (보상/드랍 화면)
//  &st=mmo / pixel
//  &p=출처명§[헤더라벨]              (라벨 생략시 REWARD)
//  &items=이름§등급§타입§스탯§플레이버§수량|...   (최대 6개)
//      등급: legend / epic / rare / uncommon / common
//      수량 1이면 미표시
// ════════════════════════════════════════════
const REWARD_GRADES = ['legend', 'epic', 'rare', 'uncommon', 'common', 'cursed'];

function rewardGradeColor(g) {
  // 통일 rarityColor 사용 (한글/영문 자동 매핑)
  return rarityColor(g);
}

// (rewardGradeLabel 제거 — 표시는 입력 그대로 gradeRaw 사용)

function parseRewardItems(raw) {
  if (!raw) return [];
  return raw.split('|').slice(0, 6).map(s => {
    const parts = s.split('§');
    const rawGrade = (parts[1] || 'common').trim();
    return {
      name:     (parts[0] || '???').trim() || '???',
      grade:    normalizeRarity(rawGrade), // 정규화 (색/gradient ID용)
      gradeRaw: rawGrade,                  // 원본 (표시용 — 입력 그대로 보존)
      type:     (parts[2] || '').trim(),
      stats:    (parts[3] || '').trim(),
      flavor:   (parts[4] || '').trim(),
      qty:      safeInt(parts[5], 1, 1, 999),
    };
  });
}

function renderReward(params) {
  const validStyles = ['mmo', 'pixel'];
  const stRaw = (params.get('st') || 'mmo').toLowerCase();
  const st = validStyles.includes(stRaw) ? stRaw : 'mmo';

  const pp = (params.get('p') || '???§REWARD').split('§');
  const fromName = (pp[0] || '???').trim() || '???';
  const headerLabel = ((pp[1] || '').trim() || 'REWARD').toUpperCase();

  const items = parseRewardItems(params.get('items') || '');
  if (items.length === 0) items.push({ name: '아이템 없음', grade: 'common', type: '', stats: '', flavor: '', qty: 1 });

  if (st === 'pixel') return renderRewardPixel({ fromName, headerLabel, items });
  return renderRewardMmo({ fromName, headerLabel, items });
}

// ── MMO 스타일 (다크 판타지) ──
function renderRewardMmo({ fromName, headerLabel, items }) {
  const W = 480, PAD = 18;
  const C = {
    bg: '#0d0f1f', panel: '#13162a', border: '#2a3050',
    text: '#d8d6f0', textDim: '#9a9bc0', dim: '#5a5e7a',
    rose: '#BB6688',
  };

  const HEADER_H = 92;
  const CARD_H = 118;
  const CARD_GAP = 10;
  const BOTTOM_PAD = 16;
  const TOTAL_H = HEADER_H + items.length * CARD_H + (items.length - 1) * CARD_GAP + BOTTOM_PAD;

  let defs = `<defs>`;
  for (const g of REWARD_GRADES) {
    defs += `<linearGradient id="rwMGlow-${g}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${rewardGradeColor(g)}" stop-opacity="0"/>
      <stop offset="0.5" stop-color="${rewardGradeColor(g)}" stop-opacity="0.22"/>
      <stop offset="1" stop-color="${rewardGradeColor(g)}" stop-opacity="0"/>
    </linearGradient>`;
  }
  defs += `</defs>`;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${TOTAL_H}" viewBox="0 0 ${W} ${TOTAL_H}" font-family="'Noto Serif KR',Georgia,serif">
${defs}
<rect width="${W}" height="${TOTAL_H}" fill="${C.bg}"/>

<text x="${W/2}" y="30" font-family="monospace" font-size="10" font-weight="bold" fill="${C.textDim}" letter-spacing="3" text-anchor="middle">— ${esc(headerLabel)} —</text>
<text x="${W/2}" y="56" font-size="16" font-style="italic" fill="${C.rose}" text-anchor="middle">${esc(fromName)}</text>
<line x1="${W/2 - 90}" y1="70" x2="${W/2 + 90}" y2="70" stroke="${C.border}" stroke-width="1"/>
<text x="${W/2}" y="85" font-family="monospace" font-size="10" fill="${C.dim}" letter-spacing="2" text-anchor="middle">${items.length} ITEM${items.length>1?'S':''} OBTAINED</text>
`;

  items.forEach((it, idx) => {
    const y = HEADER_H + idx * (CARD_H + CARD_GAP);
    const gcol = rewardGradeColor(it.grade);
    const qtyText = it.qty > 1 ? `  <tspan font-family="monospace" font-weight="normal" fill="${C.textDim}">× ${it.qty}</tspan>` : '';
    const iconX = PAD + 36;
    const iconY = y + CARD_H/2;
    const tx = PAD + 78;
    const isLegend = it.grade === 'legend';
    const isEpic = it.grade === 'epic';

    // 카드 외곽: epic이면 stroke-width 펄스
    const cardRect = isEpic
      ? `<rect x="${PAD}" y="${y}" width="${W - PAD*2}" height="${CARD_H}" rx="4" fill="${C.panel}" stroke="${gcol}" stroke-width="2"><animate attributeName="stroke-width" values="2;3.5;2" dur="2.4s" repeatCount="indefinite"/></rect>`
      : `<rect x="${PAD}" y="${y}" width="${W - PAD*2}" height="${CARD_H}" rx="4" fill="${C.panel}" stroke="${gcol}" stroke-width="2"/>`;

    // 다이아 아이콘: legend=강 펄스 / epic=약 펄스 / 그 외=정적
    let diamond;
    if (isLegend) {
      diamond = `<g transform="translate(${iconX}, ${iconY})"><polygon points="0,-24 24,0 0,24 -24,0" fill="none" stroke="${gcol}" stroke-width="1.5"><animate attributeName="stroke-width" values="1.5;2.5;1.5" dur="1.6s" repeatCount="indefinite"/></polygon><polygon points="0,-13 13,0 0,13 -13,0" fill="${gcol}" opacity="0.32"><animate attributeName="opacity" values="0.32;0.9;0.32" dur="1.6s" repeatCount="indefinite"/></polygon></g>`;
    } else if (isEpic) {
      diamond = `<g transform="translate(${iconX}, ${iconY})"><polygon points="0,-24 24,0 0,24 -24,0" fill="none" stroke="${gcol}" stroke-width="1.5"/><polygon points="0,-13 13,0 0,13 -13,0" fill="${gcol}" opacity="0.32"><animate attributeName="opacity" values="0.32;0.55;0.32" dur="2.4s" repeatCount="indefinite"/></polygon></g>`;
    } else {
      diamond = `<g transform="translate(${iconX}, ${iconY})"><polygon points="0,-24 24,0 0,24 -24,0" fill="none" stroke="${gcol}" stroke-width="1.5"/><polygon points="0,-13 13,0 0,13 -13,0" fill="${gcol}" opacity="0.32"/></g>`;
    }

    // legend 입자 6개 (좌3, 우3 시간차 상승)
    let particles = '';
    if (isLegend) {
      const startCy = y + CARD_H - 6;
      const endCy = y - 6;
      const pts = [
        { cx: 10,  r: 1.8, begin: 0    },
        { cx: 6,   r: 1.4, begin: 0.7  },
        { cx: 12,  r: 1.6, begin: 1.4  },
        { cx: 470, r: 1.8, begin: 0.3  },
        { cx: 474, r: 1.4, begin: 1.0  },
        { cx: 468, r: 1.6, begin: 1.8  },
      ];
      for (const p of pts) {
        particles += `<circle cx="${p.cx}" cy="${startCy}" r="${p.r}" fill="${gcol}" opacity="0"><animate attributeName="cy" values="${startCy};${endCy}" dur="2.6s" begin="${p.begin}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;0" dur="2.6s" begin="${p.begin}s" repeatCount="indefinite"/></circle>`;
      }
    }

    svg += `
${cardRect}
<rect x="${PAD}" y="${y}" width="${W - PAD*2}" height="${CARD_H}" rx="4" fill="url(#rwMGlow-${it.grade})"/>
${diamond}
${particles}
<text x="${tx}" y="${y + 22}" font-family="monospace" font-size="9" font-weight="bold" fill="${gcol}" letter-spacing="3">◆ ${esc(it.gradeRaw)}</text>
<text x="${tx}" y="${y + 46}" font-size="17" font-weight="bold" fill="${C.text}">${esc(it.name)}${qtyText}</text>
${it.type   ? `<text x="${tx}" y="${y + 66}" font-family="monospace" font-size="10" fill="${C.textDim}" letter-spacing="1">${esc(it.type)}</text>` : ''}
${it.stats  ? `<text x="${tx}" y="${y + 86}" font-family="monospace" font-size="11" font-weight="bold" fill="${gcol}">${esc(it.stats)}</text>` : ''}
${it.flavor ? `<text x="${tx}" y="${y + 104}" font-size="10" font-style="italic" fill="${C.dim}">"${esc(it.flavor)}"</text>` : ''}
`;
  });

  svg += `</svg>`;
  return svg;
}

// ── PIXEL 스타일 (16비트 RPG) ──
function renderRewardPixel({ fromName, headerLabel, items }) {
  const W = 480, PAD = 20;
  const C = {
    bg: '#1c1828', panel: '#2d2540',
    text: '#e0d8f0', textDim: '#8a7aa0', dim: '#5a4068',
    pink: '#DDAACC',
  };

  const HEADER_H = 92;
  const CARD_H = 128;
  const CARD_GAP = 10;
  const BOTTOM_PAD = 18;
  const TOTAL_H = HEADER_H + items.length * CARD_H + (items.length - 1) * CARD_GAP + BOTTOM_PAD;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${TOTAL_H}" viewBox="0 0 ${W} ${TOTAL_H}" font-family="monospace" shape-rendering="crispEdges">
<rect width="${W}" height="${TOTAL_H}" fill="${C.bg}"/>

<text x="${W/2}" y="32" font-size="11" font-weight="bold" fill="#8888CC" letter-spacing="3" text-anchor="middle">★ ${esc(headerLabel)} ★</text>
<text x="${W/2}" y="54" font-size="13" fill="${C.pink}" text-anchor="middle" letter-spacing="1">[ ${esc(fromName)} ]</text>
<text x="${W/2}" y="76" font-size="10" fill="${C.dim}" text-anchor="middle" letter-spacing="2">${items.length} ITEM${items.length>1?'S':''} OBTAINED</text>
`;

  // 픽셀 보석 아이콘 (등급 색 적용)
  const pixelGem = (cx, cy, gcol, opts) => {
    opts = opts || {};
    const u = 4;
    const pixels = [
      [3,0],[4,0],
      [2,1],[3,1],[4,1],[5,1],
      [1,2],[2,2],[3,2],[4,2],[5,2],[6,2],
      [0,3],[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],
      [0,4],[1,4],[2,4],[3,4],[4,4],[5,4],[6,4],[7,4],
      [1,5],[2,5],[3,5],[4,5],[5,5],[6,5],
      [2,6],[3,6],[4,6],[5,6],
      [3,7],[4,7],
    ];
    const highlights = [[2,1],[3,1],[1,2],[2,2]];
    // epic이면 보석 g 전체에 8비트 discrete 깜빡 animate
    const gOpen = opts.epicBlink
      ? `<g transform="translate(${cx - 4*u}, ${cy - 5*u})"><animate attributeName="opacity" values="1;0.35;1;0.7" calcMode="discrete" keyTimes="0;0.33;0.66;0.99" dur="1s" repeatCount="indefinite"/>`
      : `<g transform="translate(${cx - 4*u}, ${cy - 5*u})">`;
    let g = gOpen;
    for (const [x,y] of pixels) g += `<rect x="${x*u}" y="${y*u}" width="${u}" height="${u}" fill="${gcol}"/>`;
    for (const [x,y] of highlights) g += `<rect x="${x*u}" y="${y*u}" width="${u}" height="${u}" fill="#ffffff" opacity="0.4"/>`;
    // legend면 광택 흐름 오버레이 (y행마다 시간차)
    if (opts.legendShine) {
      const peakByRow = [0.85, 0.85, 0.85, 0.75, 0.7, 0.65, 0.6, 0.55];
      for (const [x,y] of pixels) {
        const delay = (y * 0.12).toFixed(2);
        const peak = peakByRow[y];
        g += `<rect x="${x*u}" y="${y*u}" width="${u}" height="${u}" fill="#ffffff" opacity="0"><animate attributeName="opacity" values="0;${peak};0;0" keyTimes="0;0.08;0.25;1" dur="2.4s" begin="${delay}s" repeatCount="indefinite"/></rect>`;
      }
    }
    g += `</g>`;
    return g;
  };

  items.forEach((it, idx) => {
    const y = HEADER_H + idx * (CARD_H + CARD_GAP);
    const gcol = rewardGradeColor(it.grade);
    const tx = PAD + 78;
    const qtyTail = it.qty > 1 ? `  · x${it.qty}` : '';
    const isLegend = it.grade === 'legend';
    const isEpic = it.grade === 'epic';

    // 카드 외곽: epic이면 stroke-width 펄스
    const cardRect = isEpic
      ? `<rect x="${PAD}" y="${y}" width="${W - PAD*2}" height="${CARD_H}" fill="${C.panel}" stroke="${gcol}" stroke-width="3"><animate attributeName="stroke-width" values="3;4;3" dur="2.4s" repeatCount="indefinite"/></rect>`
      : `<rect x="${PAD}" y="${y}" width="${W - PAD*2}" height="${CARD_H}" fill="${C.panel}" stroke="${gcol}" stroke-width="3"/>`;

    // 모서리 점 4개: epic이면 시간차 깜빡
    const cornerBegins = [0, 0.5, 1.5, 1]; // 좌상, 우상, 좌하, 우하 (시계 반대)
    const cornerDot = (cx, cy, i) => isEpic
      ? `<rect x="${cx}" y="${cy}" width="6" height="6" fill="${gcol}"><animate attributeName="opacity" values="1;0.25;1" dur="2s" begin="${cornerBegins[i]}s" repeatCount="indefinite"/></rect>`
      : `<rect x="${cx}" y="${cy}" width="6" height="6" fill="${gcol}"/>`;

    // legend ✦ 별 4개 (카드 좌우 PAD 영역, 시간차 깜빡)
    let sparkles = '';
    if (isLegend) {
      const stars = [
        { x: 10,  y: y + 50,  size: 14, begin: 0    },
        { x: 10,  y: y + 100, size: 12, begin: 1.1  },
        { x: 470, y: y + 50,  size: 12, begin: 0.55 },
        { x: 470, y: y + 100, size: 14, begin: 1.65 },
      ];
      for (const s of stars) {
        sparkles += `<text x="${s.x}" y="${s.y}" font-size="${s.size}" font-weight="bold" fill="${gcol}" text-anchor="middle" opacity="0">✦<animate attributeName="opacity" values="0;1;0;0" keyTimes="0;0.2;0.5;1" dur="2.2s" begin="${s.begin}s" repeatCount="indefinite"/></text>`;
      }
    }

    svg += `
${cardRect}
${cornerDot(PAD-3, y-3, 0)}
${cornerDot(W-PAD-3, y-3, 1)}
${cornerDot(PAD-3, y+CARD_H-3, 2)}
${cornerDot(W-PAD-3, y+CARD_H-3, 3)}

<rect x="${PAD}" y="${y + 10}" width="${W - PAD*2}" height="20" fill="${gcol}"/>
<text x="${W/2}" y="${y + 24}" font-size="10" font-weight="bold" fill="${C.bg}" letter-spacing="4" text-anchor="middle">— ${esc(it.gradeRaw)} —</text>

${pixelGem(PAD + 38, y + 80, gcol, { legendShine: isLegend, epicBlink: isEpic })}
${sparkles}

<text x="${tx}" y="${y + 56}" font-size="15" font-weight="bold" fill="${C.text}">${esc(it.name)}</text>
${it.type   ? `<text x="${tx}" y="${y + 72}" font-size="10" fill="${C.textDim}">${esc(it.type)}${qtyTail}</text>` : (it.qty > 1 ? `<text x="${tx}" y="${y + 72}" font-size="10" fill="${C.textDim}">x${it.qty}</text>` : '')}
${it.stats  ? `<text x="${tx}" y="${y + 92}" font-size="11" font-weight="bold" fill="${gcol}">${esc(it.stats)}</text>` : ''}
${it.flavor ? `<text x="${tx}" y="${y + 112}" font-size="9" fill="${C.dim}" font-style="italic">"${esc(it.flavor)}"</text>` : ''}
`;
  });

  svg += `</svg>`;
  return svg;
}



// ════════════════════════════════════════════
//  GAMEOVER (modern / pixel)
//  ?t=gameover&st=modern  — 일반 게임오버 (기본값)
//  ?t=gameover&st=pixel   — 픽셀 게임오버
//
//  공통 파라미터:
//    title=GAME OVER    제목
//    cause=...          게임오버 사유
//    n=...              캐릭터 이름
//    sub=...            캐릭터 부가설명
//    d=...              캐릭터 대사
//    ach=아이콘§제목§설명|...  업적 (0~3개)
//    count=숫자         사망 횟수
//
//  아이콘 키 16종: trophy, star, heart, skull, crown,
//                  sword, shield, flame, key, book,
//                  hourglass, coin, potion, note, eye, mask
// ════════════════════════════════════════════

// ─── 픽셀 아이콘 (10x10, '1'=메인, '2'=그림자, '.'=빈칸) ──
const GAMEOVER_ICON_PIXEL = {
  trophy: ['..111111..','.11111111.','.11111111.','..111111..','..111111..','...1111...','....11....','....11....','..111111..','.11111111.'],
  star: ['....11....','....11....','...1111...','1111111111','.11111111.','..111111..','..11..11..','.11....11.','.11....11.','11......11'],
  heart: ['.11....11.','1111..1111','1111111111','1111111111','.11111111.','..111111..','...1111...','....11....','..........','..........'],
  skull: ['..111111..','.11111111.','1111111111','11..11..11','11..11..11','1111111111','.11111111.','.1.1111.1.','..1.11.1..','..........'],
  crown: ['....11....','....11....','.11.11.11.','.11.11.11.','1111111111','1111..1111','111....111','1111..1111','1111111111','..........'],
  sword: ['....11....','....11....','....11....','....11....','....11....','...1111...','.11111111.','....11....','...1111...','....11....'],
  shield: ['1111111111','1111111111','1111..1111','111....111','1111..1111','1111111111','.11111111.','..111111..','...1111...','....11....'],
  flame: ['.....1....','....11....','...11.1...','..11.111..','.1111111..','11.111111.','11..1111..','1111111111','.11111111.','..111111..'],
  key: ['...1111...','..111111..','.11.11.11.','.11.11.11.','..111111..','...1111...','....11....','....1111..','....11.1..','....11....'],
  book: ['1111111111','1........1','1.111111.1','1........1','1.111111.1','1........1','1.111111.1','1........1','1.111111.1','1111111111'],
  hourglass: ['1111111111','2........2','.2......2.','..211112..','...2112...','....22....','...2222...','..222222..','.22222222.','1111111111'],
  coin: ['...1111...','.11111111.','1111111111','11.1..1.11','11.1..1.11','11.1..1.11','11.1..1.11','1111111111','.11111111.','...1111...'],
  potion: ['...1111...','...1..1...','...1..1...','..111111..','.11111111.','1111111111','1.111111.1','1111111111','.11111111.','..111111..'],
  note: ['....111111','....111111','....11..11','....11....','....11....','....11....','....11....','.1111.....','11111.....','11111.....'],
  eye: ['..........','...2222...','..2....2..','.2..11..2.','2..1111..2','2..1111..2','.2..11..2.','..2....2..','...2222...','..........'],
  mask: ['11......11','1111111111','11..11..11','11..11..11','1111111111','1111111111','.11111111.','...1..1...','..........','..........'],
};

// ─── 벡터 아이콘 (24x24 viewBox path) ──
const GAMEOVER_ICON_VECTOR = {
  trophy: 'M 3.9,0.0 L 3.6,0.5 L 4.1,1.1 L 4.1,2.1 L 3.9,2.4 L 2.0,2.4 L 1.5,2.9 L 1.5,6.4 L 2.5,8.8 L 4.1,10.4 L 7.3,11.7 L 10.3,14.1 L 10.3,17.1 L 8.7,18.7 L 7.6,18.7 L 7.3,20.0 L 6.0,20.5 L 5.2,21.3 L 5.2,24.0 L 18.8,24.0 L 18.8,21.6 L 18.5,21.1 L 16.7,20.0 L 16.4,18.7 L 15.3,18.7 L 13.7,17.1 L 13.7,14.1 L 16.7,11.7 L 20.1,10.1 L 21.5,8.8 L 22.5,6.4 L 22.5,2.9 L 22.0,2.4 L 20.1,2.4 L 19.9,2.1 L 19.9,1.1 L 20.4,0.5 L 20.1,0.0 L 3.9,0.0 M 8.9,5.6 L 9.2,5.3 L 11.1,5.3 L 11.9,3.5 L 12.4,3.7 L 12.9,5.3 L 14.8,5.3 L 15.1,5.6 L 13.5,6.9 L 14.0,8.8 L 13.7,9.1 L 12.1,8.0 L 10.3,9.1 L 10.0,8.5 L 10.5,6.9 L 8.9,5.6 M 21.5,3.2 L 21.7,3.5 L 21.5,6.9 L 20.9,8.0 L 19.1,9.9 L 18.0,10.4 L 17.7,9.9 L 19.1,6.9 L 19.6,3.5 L 19.9,3.2 L 21.5,3.2 M 2.5,3.2 L 4.1,3.2 L 4.4,3.5 L 4.7,6.1 L 6.3,9.9 L 6.0,10.4 L 4.9,9.9 L 3.1,8.0 L 2.3,6.1 L 2.3,3.5 L 2.5,3.2',
  star: 'M 11.8,0.6 L 11.5,0.8 L 8.4,8.2 L 7.9,8.2 L 7.8,8.2 L 7.4,8.2 L 7.3,8.3 L 6.9,8.3 L 6.8,8.3 L 6.3,8.3 L 6.2,8.4 L 5.7,8.4 L 5.7,8.4 L 5.2,8.4 L 5.2,8.5 L 4.6,8.5 L 4.6,8.5 L 4.1,8.5 L 4.0,8.5 L 3.6,8.5 L 3.5,8.6 L 3.0,8.6 L 3.0,8.6 L 2.4,8.6 L 2.4,8.7 L 0.4,8.8 L 0.2,8.9 L 0.0,9.3 L 0.0,9.6 L 0.3,10.0 L 6.2,15.1 L 6.0,15.7 L 6.0,15.9 L 5.8,16.3 L 5.8,16.5 L 5.5,17.7 L 5.5,17.9 L 5.4,18.3 L 5.4,18.5 L 5.0,19.7 L 5.0,19.9 L 4.9,20.3 L 4.9,20.5 L 4.7,20.9 L 4.7,21.1 L 4.6,21.7 L 4.3,22.9 L 4.6,23.3 L 4.7,23.4 L 5.2,23.4 L 11.8,19.4 L 12.1,19.4 L 18.6,23.3 L 19.1,23.5 L 19.3,23.4 L 19.5,23.2 L 19.7,22.9 L 19.7,22.8 L 19.0,19.9 L 18.7,18.5 L 18.5,17.9 L 18.2,16.5 L 18.0,15.9 L 18.0,15.7 L 17.9,15.3 L 17.9,15.0 L 23.9,9.8 L 24.0,9.6 L 24.0,9.3 L 23.9,9.1 L 23.6,8.8 L 15.6,8.2 L 12.5,0.8 L 12.2,0.6 L 12.0,0.5 L 11.8,0.6',
  heart: 'M 20.5,2.3 L 18.9,1.8 L 17.0,1.8 L 16.9,1.9 L 16.4,1.9 L 15.6,2.2 L 14.4,2.7 L 13.2,3.9 L 12.5,5.0 L 12.2,5.8 L 12.0,5.9 L 11.8,5.7 L 11.8,5.4 L 11.0,4.0 L 9.9,3.0 L 9.0,2.4 L 7.1,1.8 L 5.1,1.8 L 5.0,1.9 L 4.5,1.9 L 3.8,2.2 L 2.2,3.1 L 1.2,4.3 L 0.5,5.5 L 0.1,6.6 L 0.1,7.2 L 0.0,7.3 L 0.0,8.7 L 0.1,8.8 L 0.2,9.8 L 0.7,11.1 L 1.7,13.0 L 2.7,14.2 L 3.7,15.2 L 6.2,17.2 L 9.4,19.5 L 11.3,21.3 L 12.0,22.2 L 14.3,19.7 L 20.0,15.4 L 22.0,13.3 L 23.2,11.5 L 23.2,11.2 L 23.7,10.3 L 23.7,10.0 L 24.0,8.9 L 24.0,7.0 L 23.9,6.9 L 23.9,6.5 L 23.5,5.4 L 22.6,3.9 L 21.7,3.0 L 20.5,2.3',
  skull: 'M 2.8,15.0 L 2.8,15.2 L 2.7,15.3 L 2.7,16.1 L 2.8,16.2 L 2.8,16.4 L 3.1,16.7 L 3.1,16.9 L 3.0,17.0 L 2.5,17.0 L 2.4,17.2 L 2.2,17.2 L 1.8,17.6 L 1.8,18.7 L 2.1,19.0 L 2.1,19.1 L 2.2,19.3 L 2.5,19.3 L 2.7,19.4 L 3.1,19.4 L 3.3,19.3 L 3.7,19.3 L 4.5,18.8 L 4.9,18.8 L 5.4,19.1 L 5.7,19.1 L 5.9,19.3 L 6.2,19.3 L 6.3,19.4 L 6.6,19.4 L 7.1,19.7 L 7.4,19.7 L 7.5,19.9 L 7.8,19.9 L 8.3,20.2 L 8.0,20.5 L 7.7,20.5 L 7.5,20.6 L 7.2,20.6 L 6.8,20.9 L 6.5,20.9 L 6.3,21.1 L 6.0,21.1 L 5.9,21.3 L 5.6,21.3 L 5.4,21.4 L 5.1,21.4 L 4.9,21.6 L 4.5,21.6 L 4.3,21.4 L 4.2,21.4 L 3.4,20.9 L 2.5,20.9 L 2.4,21.1 L 2.2,21.1 L 1.9,21.4 L 1.9,21.6 L 1.8,21.7 L 1.8,22.6 L 2.1,23.1 L 2.2,23.1 L 2.4,23.2 L 2.7,23.2 L 3.1,23.5 L 2.7,24.3 L 2.7,25.0 L 3.3,25.6 L 3.4,25.6 L 3.6,25.8 L 4.2,25.8 L 4.3,25.6 L 4.5,25.6 L 5.1,25.0 L 5.1,24.9 L 5.3,24.7 L 5.3,24.4 L 5.4,24.3 L 5.4,24.0 L 5.9,23.7 L 6.2,23.7 L 6.3,23.5 L 6.6,23.5 L 7.1,23.2 L 7.4,23.2 L 7.5,23.1 L 7.8,23.1 L 8.0,22.9 L 8.3,22.9 L 8.7,22.6 L 9.0,22.6 L 9.2,22.5 L 9.5,22.5 L 10.0,22.2 L 10.3,22.2 L 10.4,22.0 L 10.7,22.0 L 10.9,21.9 L 11.2,21.9 L 11.6,21.6 L 12.4,21.6 L 12.8,21.9 L 13.1,21.9 L 13.3,22.0 L 13.6,22.0 L 13.7,22.2 L 14.0,22.2 L 14.5,22.5 L 14.8,22.5 L 15.0,22.6 L 15.3,22.6 L 15.7,22.9 L 16.0,22.9 L 16.2,23.1 L 16.5,23.1 L 16.6,23.2 L 16.9,23.2 L 17.4,23.5 L 17.7,23.5 L 17.8,23.7 L 18.1,23.7 L 18.3,23.8 L 18.4,23.8 L 18.6,24.0 L 18.6,24.3 L 18.7,24.4 L 18.7,24.7 L 18.9,24.9 L 18.9,25.0 L 19.5,25.6 L 19.7,25.6 L 19.8,25.8 L 20.4,25.8 L 21.2,25.3 L 21.2,25.2 L 21.3,25.0 L 21.3,24.1 L 21.2,24.0 L 21.2,23.8 L 20.9,23.5 L 21.3,23.2 L 21.6,23.2 L 21.8,23.1 L 21.9,23.1 L 22.2,22.6 L 22.2,21.7 L 22.1,21.6 L 22.1,21.4 L 21.8,21.1 L 21.6,21.1 L 21.5,20.9 L 20.6,20.9 L 20.4,21.1 L 20.3,21.1 L 20.1,21.3 L 19.7,21.4 L 19.4,21.7 L 19.2,21.6 L 18.9,21.6 L 18.7,21.4 L 18.4,21.4 L 18.0,21.1 L 17.7,21.1 L 17.5,20.9 L 17.2,20.9 L 16.8,20.6 L 16.5,20.6 L 16.3,20.5 L 16.0,20.5 L 15.7,20.2 L 16.2,19.9 L 16.5,19.9 L 16.6,19.7 L 16.9,19.7 L 17.4,19.4 L 17.7,19.4 L 17.8,19.3 L 18.1,19.3 L 18.3,19.1 L 18.6,19.1 L 19.1,18.8 L 19.5,18.8 L 20.3,19.3 L 20.7,19.3 L 20.9,19.4 L 21.3,19.4 L 21.5,19.3 L 21.8,19.3 L 22.1,19.0 L 22.1,18.8 L 22.2,18.7 L 22.2,17.6 L 21.8,17.2 L 21.6,17.2 L 21.5,17.0 L 21.0,17.0 L 20.9,16.9 L 20.9,16.7 L 21.2,16.4 L 21.2,16.2 L 21.3,16.1 L 21.3,15.3 L 21.2,15.2 L 21.2,15.0 L 20.9,14.7 L 20.7,14.7 L 20.6,14.6 L 19.8,14.6 L 19.7,14.7 L 19.5,14.7 L 18.9,15.3 L 18.9,15.5 L 18.7,15.6 L 18.7,16.1 L 18.6,16.2 L 18.6,16.4 L 18.3,16.7 L 18.0,16.7 L 17.8,16.9 L 17.5,16.9 L 17.4,17.0 L 17.1,17.0 L 16.6,17.3 L 16.3,17.3 L 16.2,17.5 L 15.9,17.5 L 15.4,17.8 L 15.1,17.8 L 15.0,17.9 L 14.7,17.9 L 14.2,18.2 L 13.9,18.2 L 13.7,18.4 L 13.4,18.4 L 13.3,18.5 L 13.0,18.5 L 12.8,18.7 L 12.7,18.7 L 12.5,18.8 L 12.2,18.8 L 12.1,19.0 L 11.9,19.0 L 11.8,18.8 L 11.5,18.8 L 11.3,18.7 L 11.0,18.7 L 10.9,18.5 L 10.6,18.5 L 10.1,18.2 L 9.8,18.2 L 9.6,18.1 L 9.3,18.1 L 8.9,17.8 L 8.6,17.8 L 8.4,17.6 L 8.1,17.6 L 8.0,17.5 L 7.7,17.5 L 7.2,17.2 L 6.9,17.2 L 6.8,17.0 L 6.5,17.0 L 6.3,16.9 L 6.0,16.9 L 5.9,16.7 L 5.7,16.7 L 5.4,16.4 L 5.4,16.1 L 5.3,15.9 L 5.3,15.8 L 5.1,15.6 L 4.9,15.2 L 4.5,14.7 L 4.3,14.7 L 4.2,14.6 L 3.4,14.6 L 3.3,14.7 L 3.1,14.7 L 2.8,15.0 M 7.7,-1.0 L 7.5,-0.9 L 7.4,-0.9 L 7.2,-0.7 L 7.1,-0.7 L 6.9,-0.6 L 6.5,-0.4 L 6.2,-0.1 L 6.0,-0.1 L 5.6,0.3 L 5.4,0.3 L 3.7,2.0 L 3.7,2.1 L 3.3,2.6 L 3.3,2.7 L 3.0,3.1 L 3.0,3.2 L 2.5,4.0 L 2.5,4.3 L 2.4,4.4 L 2.4,4.7 L 2.2,4.9 L 2.2,5.2 L 2.1,5.3 L 2.1,5.9 L 1.9,6.1 L 1.9,6.7 L 1.8,6.8 L 1.8,8.4 L 1.9,8.5 L 1.9,9.1 L 2.1,9.3 L 2.1,9.6 L 2.2,9.7 L 2.2,10.0 L 2.4,10.2 L 2.5,10.6 L 2.8,10.9 L 2.8,11.1 L 3.4,11.7 L 3.4,11.8 L 3.7,12.2 L 3.9,12.2 L 4.5,12.8 L 4.6,12.8 L 4.9,13.1 L 5.1,13.1 L 5.3,13.2 L 5.4,13.2 L 5.6,13.4 L 5.7,13.4 L 6.5,13.8 L 6.8,13.8 L 6.9,14.0 L 7.2,14.0 L 7.5,14.3 L 7.5,14.6 L 7.7,14.7 L 7.7,15.3 L 7.8,15.5 L 7.8,15.6 L 8.3,16.1 L 8.4,16.1 L 8.9,16.4 L 10.1,16.4 L 10.6,16.1 L 10.9,16.4 L 11.2,16.4 L 11.3,16.5 L 12.5,16.5 L 13.0,16.2 L 13.4,16.2 L 13.6,16.4 L 14.7,16.4 L 14.8,16.2 L 15.3,16.1 L 15.9,15.5 L 15.9,15.3 L 16.0,15.2 L 16.0,14.4 L 16.3,14.1 L 16.6,14.1 L 16.8,14.0 L 17.1,14.0 L 17.2,13.8 L 17.5,13.8 L 17.7,13.7 L 17.8,13.7 L 18.0,13.5 L 18.1,13.5 L 18.3,13.4 L 18.4,13.4 L 18.6,13.2 L 19.1,13.1 L 19.4,12.8 L 19.5,12.8 L 20.0,12.3 L 20.1,12.3 L 21.3,10.9 L 21.3,10.8 L 21.5,10.6 L 21.5,10.5 L 21.9,9.7 L 21.9,9.4 L 22.1,9.3 L 22.1,8.7 L 22.2,8.5 L 22.2,6.7 L 22.1,6.5 L 22.1,5.8 L 21.9,5.6 L 21.9,5.3 L 21.8,5.2 L 21.8,4.7 L 21.5,4.3 L 21.5,4.0 L 21.3,3.8 L 21.3,3.7 L 21.2,3.5 L 21.0,3.1 L 20.7,2.7 L 20.7,2.6 L 20.3,2.1 L 20.3,2.0 L 18.7,0.5 L 18.6,0.5 L 18.1,0.0 L 18.0,0.0 L 17.7,-0.3 L 17.5,-0.3 L 17.2,-0.6 L 17.1,-0.6 L 16.6,-0.9 L 16.3,-0.9 L 16.2,-1.0 L 16.0,-1.0 L 15.9,-1.2 L 15.6,-1.2 L 15.4,-1.3 L 15.0,-1.3 L 14.8,-1.5 L 14.4,-1.5 L 14.2,-1.6 L 13.3,-1.6 L 13.1,-1.8 L 10.9,-1.8 L 10.7,-1.6 L 9.8,-1.6 L 9.6,-1.5 L 9.0,-1.5 L 8.9,-1.3 L 8.6,-1.3 L 8.4,-1.2 L 8.1,-1.2 L 8.0,-1.0 L 7.7,-1.0 M 11.9,10.2 L 12.1,10.3 L 12.4,10.3 L 12.7,10.6 L 12.7,10.8 L 13.0,11.1 L 13.0,11.4 L 13.1,11.5 L 13.1,12.3 L 12.7,12.8 L 12.5,12.8 L 12.4,12.9 L 11.6,12.9 L 11.5,12.8 L 11.3,12.8 L 10.7,12.2 L 10.7,11.5 L 10.9,11.4 L 11.0,10.9 L 11.6,10.3 L 11.8,10.3 L 11.9,10.2 M 15.4,3.5 L 16.9,3.5 L 17.1,3.7 L 17.5,3.8 L 18.4,4.7 L 18.4,4.9 L 18.7,5.2 L 18.7,5.5 L 18.9,5.6 L 18.9,6.1 L 19.1,6.2 L 19.1,7.5 L 18.9,7.6 L 18.9,8.1 L 18.7,8.2 L 18.6,8.7 L 18.3,9.0 L 18.3,9.1 L 17.8,9.6 L 17.7,9.6 L 17.4,9.9 L 17.2,9.9 L 17.1,10.0 L 16.8,10.0 L 16.6,10.2 L 15.6,10.2 L 15.4,10.0 L 15.3,10.0 L 15.1,9.9 L 14.7,9.7 L 13.9,9.0 L 13.9,8.8 L 13.6,8.5 L 13.6,8.4 L 13.4,8.2 L 13.4,7.9 L 13.3,7.8 L 13.3,5.9 L 13.4,5.8 L 13.4,5.5 L 13.6,5.3 L 13.7,4.9 L 14.2,4.4 L 14.2,4.3 L 14.4,4.1 L 14.5,4.1 L 14.8,3.8 L 15.0,3.8 L 15.4,3.5 M 6.9,3.5 L 8.3,3.5 L 8.4,3.7 L 8.7,3.7 L 9.0,4.0 L 9.2,4.0 L 10.0,4.7 L 10.0,4.9 L 10.4,5.6 L 10.4,6.1 L 10.6,6.2 L 10.6,7.3 L 10.4,7.5 L 10.4,7.9 L 10.3,8.1 L 10.3,8.4 L 10.1,8.5 L 10.1,8.7 L 8.9,9.9 L 8.7,9.9 L 8.6,10.0 L 8.3,10.0 L 8.1,10.2 L 7.1,10.2 L 6.9,10.0 L 6.6,10.0 L 6.5,9.9 L 6.3,9.9 L 5.3,8.8 L 5.3,8.7 L 4.8,7.9 L 4.8,7.0 L 4.6,6.8 L 4.8,6.7 L 4.8,5.8 L 4.9,5.6 L 4.9,5.3 L 5.1,5.2 L 5.1,5.0 L 5.6,4.6 L 5.6,4.4 L 5.9,4.1 L 6.0,4.1 L 6.5,3.7 L 6.8,3.7 L 6.9,3.5',
  crown: 'M 4.6,17.5 L 4.6,18.0 L 4.5,18.1 L 4.0,18.1 L 4.0,18.7 L 20.1,18.7 L 20.1,18.6 L 20.1,18.5 L 20.1,18.2 L 20.2,18.1 L 19.5,18.1 L 19.4,18.0 L 19.4,17.5 L 4.6,17.5 M 12.0,5.3 L 11.8,5.5 L 11.7,5.5 L 11.3,5.9 L 11.2,5.9 L 11.2,6.0 L 11.2,6.1 L 10.9,6.3 L 10.9,6.3 L 10.9,6.4 L 10.9,6.5 L 10.8,6.6 L 10.8,6.6 L 10.7,6.7 L 10.7,6.9 L 10.7,6.9 L 10.7,7.7 L 10.7,7.7 L 10.7,7.9 L 10.8,8.0 L 10.8,8.1 L 10.9,8.2 L 10.9,8.2 L 10.9,8.3 L 10.9,8.4 L 11.0,8.5 L 11.0,8.5 L 11.1,8.6 L 11.1,8.7 L 11.2,8.8 L 11.2,8.8 L 11.2,8.9 L 11.2,9.0 L 11.3,9.0 L 11.3,9.1 L 11.4,9.2 L 11.4,9.3 L 11.5,9.3 L 11.5,9.5 L 11.5,9.6 L 11.5,9.7 L 11.6,9.8 L 11.6,10.0 L 11.7,10.1 L 11.7,11.0 L 11.6,11.1 L 11.3,11.1 L 11.2,11.0 L 11.2,10.9 L 11.2,10.9 L 11.2,10.4 L 11.1,10.4 L 11.1,10.1 L 11.0,10.1 L 11.0,9.8 L 10.9,9.8 L 10.9,9.7 L 10.9,9.6 L 10.9,9.5 L 10.8,9.4 L 10.8,9.3 L 10.7,9.3 L 10.7,9.2 L 10.6,9.0 L 10.6,9.0 L 10.0,8.4 L 9.9,8.4 L 9.8,8.3 L 9.8,8.3 L 9.7,8.2 L 9.6,8.2 L 9.6,8.2 L 9.3,8.2 L 9.3,8.1 L 8.4,8.1 L 8.3,8.2 L 8.2,8.2 L 8.1,8.2 L 8.0,8.2 L 8.0,8.3 L 7.9,8.3 L 7.8,8.4 L 7.7,8.4 L 7.7,8.5 L 7.6,8.5 L 7.1,8.9 L 7.1,9.0 L 7.1,9.0 L 7.1,9.1 L 7.0,9.2 L 7.0,9.3 L 6.9,9.3 L 6.9,9.6 L 6.9,9.6 L 6.9,10.1 L 6.9,10.2 L 6.9,10.4 L 7.0,10.5 L 7.0,10.6 L 7.1,10.7 L 7.1,10.7 L 7.2,10.9 L 7.2,10.9 L 7.4,11.2 L 7.5,11.2 L 7.7,11.3 L 7.7,11.3 L 7.9,11.5 L 8.0,11.5 L 8.0,11.5 L 8.2,11.5 L 8.2,11.6 L 8.2,11.5 L 8.2,11.4 L 8.2,10.8 L 8.2,10.7 L 8.2,10.5 L 8.3,10.4 L 8.3,10.4 L 8.4,10.3 L 8.4,10.2 L 8.7,9.9 L 8.8,9.9 L 8.9,9.8 L 9.1,9.8 L 9.2,9.7 L 9.4,9.7 L 9.5,9.8 L 9.6,9.8 L 9.7,9.8 L 9.8,9.8 L 9.8,9.9 L 9.9,9.9 L 10.4,10.4 L 10.4,10.4 L 10.5,10.6 L 10.5,10.7 L 10.6,10.8 L 10.6,11.0 L 10.7,11.1 L 10.6,11.2 L 10.0,11.2 L 9.9,11.2 L 9.9,12.3 L 10.0,12.3 L 10.6,12.3 L 10.7,12.4 L 10.7,12.5 L 10.6,12.6 L 10.6,12.8 L 10.5,12.8 L 10.5,12.9 L 10.2,13.2 L 10.1,13.2 L 10.1,13.3 L 9.5,13.3 L 9.4,13.2 L 9.3,13.2 L 9.1,13.0 L 9.1,12.9 L 9.0,12.8 L 9.0,12.8 L 9.0,12.7 L 9.0,12.2 L 8.8,12.3 L 8.8,12.3 L 8.5,12.5 L 8.5,12.6 L 8.4,12.8 L 8.4,12.8 L 8.3,12.9 L 8.3,13.0 L 8.2,13.1 L 8.2,13.3 L 8.2,13.3 L 8.2,13.4 L 8.1,13.5 L 8.0,13.4 L 8.0,13.3 L 7.6,12.9 L 7.6,12.8 L 7.4,12.6 L 7.4,12.5 L 7.4,12.4 L 7.4,12.3 L 7.5,12.3 L 7.5,12.2 L 7.6,12.1 L 7.6,11.8 L 7.5,11.7 L 7.5,11.7 L 7.3,11.5 L 7.1,11.5 L 7.1,11.4 L 6.9,11.4 L 6.9,11.5 L 6.7,11.5 L 6.5,11.7 L 6.5,11.7 L 6.4,11.8 L 6.4,12.2 L 6.5,12.3 L 6.5,12.3 L 6.7,12.5 L 6.7,12.6 L 6.6,12.7 L 6.6,12.8 L 6.6,12.8 L 6.6,12.9 L 6.4,13.1 L 6.4,13.1 L 6.3,13.2 L 6.3,13.3 L 6.2,13.4 L 6.2,13.5 L 6.1,13.6 L 6.1,13.7 L 5.7,14.1 L 5.7,14.2 L 5.3,14.5 L 5.3,14.5 L 5.2,14.4 L 5.3,14.3 L 5.3,14.2 L 5.4,14.2 L 5.4,14.1 L 5.5,14.0 L 5.5,13.3 L 5.4,13.3 L 5.4,13.2 L 5.0,12.8 L 5.0,12.8 L 4.9,12.8 L 4.8,12.8 L 4.7,12.7 L 4.6,12.7 L 4.5,12.6 L 4.4,12.6 L 4.4,12.7 L 4.5,12.8 L 4.5,12.9 L 4.6,13.0 L 4.6,13.3 L 4.5,13.3 L 4.5,13.4 L 4.3,13.6 L 4.2,13.6 L 4.2,13.7 L 4.0,13.7 L 3.9,13.8 L 3.9,13.8 L 3.8,13.7 L 3.6,13.7 L 3.3,13.3 L 3.3,13.3 L 3.4,13.2 L 3.4,13.2 L 3.5,13.1 L 3.6,13.1 L 3.6,13.1 L 3.7,13.1 L 3.8,13.0 L 3.7,12.9 L 3.7,12.8 L 3.6,12.8 L 3.6,12.7 L 3.6,12.6 L 3.6,12.5 L 3.5,12.5 L 3.5,12.4 L 3.4,12.3 L 3.4,12.3 L 3.2,12.3 L 3.1,12.3 L 3.1,12.3 L 3.0,12.4 L 2.9,12.4 L 2.8,12.3 L 2.8,11.6 L 2.8,11.5 L 2.8,11.5 L 2.9,11.4 L 2.9,11.3 L 3.3,10.9 L 3.4,10.9 L 3.4,10.9 L 3.9,10.9 L 4.0,10.9 L 4.1,10.9 L 4.2,11.1 L 4.3,11.1 L 4.4,11.2 L 4.4,11.2 L 4.5,11.4 L 4.5,11.5 L 4.6,11.5 L 4.6,11.6 L 4.7,11.7 L 4.7,11.7 L 4.7,11.8 L 4.7,11.9 L 5.0,11.7 L 5.0,11.6 L 5.0,11.5 L 5.0,11.5 L 5.1,11.4 L 5.1,11.3 L 5.2,11.2 L 5.2,11.1 L 5.3,11.0 L 5.3,10.5 L 5.2,10.4 L 5.2,10.3 L 5.1,10.2 L 5.1,10.1 L 5.0,10.0 L 5.0,9.9 L 4.7,9.7 L 4.7,9.7 L 4.6,9.6 L 4.5,9.6 L 4.4,9.6 L 4.4,9.6 L 4.3,9.5 L 3.9,9.5 L 3.9,9.4 L 3.7,9.4 L 3.6,9.5 L 3.4,9.5 L 3.3,9.6 L 3.1,9.6 L 3.1,9.6 L 3.0,9.6 L 2.9,9.7 L 2.8,9.7 L 2.4,10.1 L 2.4,10.2 L 2.3,10.3 L 2.3,10.4 L 2.3,10.4 L 2.3,10.6 L 2.2,10.7 L 2.2,10.9 L 2.1,11.0 L 2.1,11.5 L 2.2,11.6 L 2.2,12.0 L 2.3,12.0 L 2.3,12.2 L 2.3,12.3 L 2.3,12.5 L 2.4,12.5 L 2.4,12.6 L 2.3,12.7 L 2.3,12.7 L 2.2,12.8 L 2.1,12.8 L 2.0,12.6 L 2.0,12.5 L 1.9,12.5 L 1.9,12.4 L 1.8,12.3 L 1.8,12.2 L 1.8,12.1 L 1.8,12.0 L 1.7,11.9 L 1.7,11.5 L 1.6,11.5 L 1.6,10.5 L 1.7,10.4 L 1.7,10.4 L 1.6,10.3 L 1.6,9.8 L 1.5,9.8 L 1.5,9.7 L 1.5,9.6 L 1.5,9.6 L 1.4,9.5 L 1.4,9.4 L 1.1,9.1 L 1.0,9.1 L 0.9,9.0 L 0.7,9.0 L 0.7,8.9 L 0.6,8.9 L 0.5,8.8 L 0.3,8.8 L 0.2,8.8 L 0.0,8.8 L 0.0,8.8 L 0.1,8.9 L 0.1,9.0 L 0.1,9.0 L 0.1,9.1 L 0.2,9.2 L 0.2,9.3 L 0.3,9.3 L 0.3,9.4 L 0.4,9.5 L 0.4,9.6 L 0.4,9.7 L 0.4,9.8 L 0.5,9.8 L 0.5,9.9 L 0.6,10.0 L 0.6,10.1 L 0.7,10.1 L 0.7,10.2 L 0.7,10.3 L 0.7,10.4 L 0.8,10.4 L 0.8,10.5 L 0.9,10.6 L 0.9,10.7 L 0.9,10.7 L 0.9,10.8 L 1.0,10.9 L 1.0,10.9 L 1.1,11.0 L 1.1,11.1 L 1.2,11.2 L 1.2,11.3 L 1.2,11.4 L 1.2,11.5 L 1.3,11.5 L 1.3,11.6 L 1.4,11.7 L 1.4,11.7 L 1.5,11.8 L 1.5,11.9 L 1.5,12.0 L 1.5,12.0 L 1.6,12.1 L 1.6,12.2 L 1.7,12.3 L 1.7,12.3 L 1.8,12.4 L 1.8,12.5 L 1.8,12.5 L 1.8,12.6 L 1.9,12.7 L 1.9,12.8 L 2.0,12.8 L 2.0,13.0 L 2.0,13.1 L 2.0,13.1 L 2.1,13.2 L 2.1,13.3 L 2.2,13.3 L 2.2,13.4 L 2.3,13.5 L 2.3,13.6 L 2.3,13.6 L 2.3,13.7 L 2.4,13.8 L 2.4,13.9 L 2.5,13.9 L 2.5,14.0 L 2.6,14.1 L 2.6,14.2 L 2.6,14.2 L 2.6,14.3 L 2.7,14.4 L 2.7,14.4 L 2.8,14.5 L 2.8,14.6 L 2.8,14.7 L 2.8,14.7 L 2.9,14.8 L 2.9,15.0 L 3.0,15.0 L 3.0,15.1 L 3.1,15.2 L 3.1,15.2 L 3.1,15.3 L 3.1,15.4 L 3.2,15.5 L 3.2,15.5 L 3.3,15.6 L 3.3,15.7 L 3.4,15.8 L 3.4,15.8 L 3.4,15.9 L 3.4,16.0 L 3.5,16.0 L 3.5,16.2 L 3.4,16.3 L 3.4,16.3 L 3.4,16.9 L 20.6,16.9 L 20.6,16.3 L 20.5,16.3 L 20.4,16.2 L 20.5,16.1 L 20.5,16.0 L 20.6,16.0 L 20.6,15.9 L 20.6,15.8 L 20.6,15.8 L 20.7,15.7 L 20.7,15.6 L 20.8,15.5 L 20.8,15.5 L 20.9,15.4 L 20.9,15.2 L 20.9,15.2 L 20.9,15.1 L 21.0,15.0 L 21.0,15.0 L 21.1,14.9 L 21.1,14.8 L 21.2,14.7 L 21.2,14.7 L 21.2,14.6 L 21.2,14.5 L 21.3,14.4 L 21.3,14.4 L 21.4,14.3 L 21.4,14.2 L 21.4,14.2 L 21.4,14.1 L 21.5,14.0 L 21.5,13.9 L 21.6,13.9 L 21.6,13.7 L 21.7,13.6 L 21.7,13.6 L 21.7,13.5 L 21.7,13.4 L 21.8,13.3 L 21.8,13.3 L 21.9,13.2 L 21.9,13.1 L 22.0,13.1 L 22.0,13.0 L 22.0,12.9 L 22.0,12.8 L 22.1,12.8 L 22.1,12.7 L 22.2,12.6 L 22.2,12.5 L 22.2,12.5 L 22.2,12.4 L 22.3,12.3 L 22.3,12.3 L 22.4,12.2 L 22.4,12.1 L 22.5,12.0 L 22.5,12.0 L 22.5,11.9 L 22.5,11.7 L 22.6,11.7 L 22.6,11.6 L 22.7,11.5 L 22.7,11.5 L 22.8,11.4 L 22.8,11.3 L 22.8,11.2 L 22.8,11.2 L 22.9,11.1 L 22.9,11.0 L 23.0,10.9 L 23.0,10.9 L 23.1,10.8 L 23.1,10.7 L 23.1,10.7 L 23.1,10.6 L 23.2,10.5 L 23.2,10.4 L 23.3,10.4 L 23.3,10.3 L 23.3,10.2 L 23.3,10.1 L 23.4,10.0 L 23.4,9.9 L 23.5,9.8 L 23.5,9.8 L 23.6,9.7 L 23.6,9.6 L 23.6,9.6 L 23.6,9.5 L 23.7,9.4 L 23.7,9.3 L 23.8,9.3 L 23.8,9.2 L 23.9,9.1 L 23.9,9.0 L 23.9,9.0 L 23.9,8.9 L 24.0,8.8 L 24.0,8.8 L 23.7,8.8 L 23.6,8.8 L 23.5,8.8 L 23.4,8.9 L 23.3,8.9 L 23.2,9.0 L 23.1,9.0 L 23.0,9.1 L 22.9,9.1 L 22.5,9.5 L 22.5,9.6 L 22.5,9.6 L 22.5,9.8 L 22.4,9.8 L 22.4,10.1 L 22.3,10.2 L 22.3,11.8 L 22.2,11.9 L 22.2,12.0 L 22.2,12.1 L 22.2,12.3 L 22.1,12.3 L 22.1,12.4 L 22.0,12.5 L 22.0,12.6 L 21.9,12.8 L 21.7,12.8 L 21.6,12.6 L 21.6,12.5 L 21.7,12.4 L 21.7,12.3 L 21.7,12.2 L 21.7,12.0 L 21.8,11.9 L 21.8,10.7 L 21.7,10.6 L 21.7,10.4 L 21.7,10.4 L 21.7,10.3 L 21.5,10.1 L 21.5,10.1 L 21.2,9.8 L 21.2,9.8 L 21.0,9.6 L 20.9,9.6 L 20.9,9.6 L 20.7,9.6 L 20.6,9.5 L 20.4,9.5 L 20.3,9.4 L 20.1,9.4 L 20.0,9.5 L 19.7,9.5 L 19.6,9.6 L 19.6,9.6 L 19.5,9.6 L 19.4,9.6 L 19.3,9.7 L 19.3,9.7 L 19.0,10.0 L 19.0,10.1 L 18.9,10.1 L 18.9,10.2 L 18.8,10.3 L 18.8,10.4 L 18.7,10.4 L 18.7,11.1 L 18.8,11.2 L 18.8,11.3 L 18.9,11.4 L 18.9,11.5 L 19.0,11.6 L 19.0,11.7 L 19.3,11.9 L 19.3,11.8 L 19.3,11.7 L 19.3,11.6 L 19.4,11.5 L 19.4,11.5 L 19.6,11.3 L 19.6,11.2 L 19.8,11.0 L 19.8,11.0 L 19.9,10.9 L 20.0,10.9 L 20.1,10.9 L 20.6,10.9 L 20.6,10.9 L 20.7,10.9 L 21.1,11.3 L 21.1,11.4 L 21.2,11.5 L 21.2,11.6 L 21.2,11.7 L 21.2,12.2 L 21.2,12.3 L 21.2,12.3 L 21.1,12.4 L 21.0,12.4 L 20.9,12.3 L 20.9,12.3 L 20.8,12.3 L 20.6,12.3 L 20.5,12.3 L 20.5,12.4 L 20.4,12.5 L 20.4,12.5 L 20.4,12.6 L 20.4,12.7 L 20.3,12.8 L 20.3,12.9 L 20.2,13.0 L 20.3,13.1 L 20.4,13.1 L 20.4,13.1 L 20.5,13.1 L 20.6,13.2 L 20.6,13.2 L 20.7,13.3 L 20.7,13.3 L 20.4,13.7 L 20.1,13.7 L 20.1,13.8 L 20.0,13.7 L 19.8,13.7 L 19.5,13.4 L 19.5,13.3 L 19.4,13.3 L 19.4,12.9 L 19.5,12.8 L 19.5,12.7 L 19.6,12.6 L 19.4,12.6 L 19.3,12.7 L 19.2,12.7 L 19.1,12.8 L 19.0,12.8 L 18.9,12.9 L 18.8,12.9 L 18.7,13.1 L 18.7,13.1 L 18.6,13.2 L 18.6,13.3 L 18.5,13.3 L 18.5,13.5 L 18.5,13.6 L 18.5,13.8 L 18.5,13.9 L 18.5,14.1 L 18.6,14.2 L 18.6,14.2 L 18.9,14.5 L 19.0,14.5 L 19.0,14.6 L 19.1,14.6 L 19.2,14.7 L 19.9,14.7 L 20.0,14.6 L 20.1,14.6 L 20.1,14.5 L 20.2,14.5 L 20.4,14.4 L 20.4,14.4 L 20.9,13.9 L 20.9,13.8 L 21.1,13.6 L 21.1,13.6 L 21.2,13.5 L 21.2,13.5 L 21.3,13.6 L 21.4,13.6 L 21.5,13.7 L 21.4,13.8 L 21.4,13.9 L 21.3,14.0 L 21.3,14.1 L 21.2,14.2 L 21.2,14.3 L 20.6,14.8 L 20.6,14.8 L 20.1,15.2 L 20.1,15.2 L 20.1,15.1 L 19.7,15.1 L 19.6,15.0 L 19.5,15.0 L 19.4,15.0 L 19.3,15.0 L 19.3,14.9 L 19.2,14.9 L 19.1,14.8 L 19.0,14.8 L 18.9,14.7 L 18.8,14.7 L 18.2,14.1 L 18.2,14.0 L 17.9,13.7 L 17.9,13.6 L 17.8,13.5 L 17.8,13.4 L 17.7,13.3 L 17.7,13.2 L 17.6,13.1 L 17.6,13.1 L 17.4,12.9 L 17.4,12.8 L 17.4,12.8 L 17.4,12.7 L 17.3,12.6 L 17.3,12.5 L 17.4,12.4 L 17.5,12.4 L 17.5,12.3 L 17.6,12.3 L 17.6,12.2 L 17.7,12.1 L 17.7,11.8 L 17.6,11.7 L 17.6,11.7 L 17.4,11.5 L 17.2,11.5 L 17.1,11.4 L 16.9,11.4 L 16.9,11.5 L 16.8,11.5 L 16.5,11.7 L 16.5,12.2 L 16.6,12.3 L 16.6,12.3 L 16.7,12.5 L 16.6,12.5 L 16.6,12.6 L 16.4,12.8 L 16.4,12.9 L 16.0,13.3 L 16.0,13.4 L 15.9,13.5 L 15.8,13.5 L 15.8,13.4 L 15.8,13.1 L 15.7,13.1 L 15.7,12.9 L 15.6,12.8 L 15.6,12.8 L 15.4,12.5 L 15.4,12.5 L 15.3,12.4 L 15.2,12.4 L 15.0,12.2 L 15.0,12.6 L 15.0,12.7 L 15.0,12.8 L 14.9,12.9 L 14.9,13.0 L 14.7,13.2 L 14.6,13.2 L 14.5,13.3 L 13.9,13.3 L 13.9,13.2 L 13.8,13.2 L 13.5,12.9 L 13.5,12.8 L 13.4,12.8 L 13.4,12.6 L 13.3,12.5 L 13.3,12.4 L 13.4,12.3 L 14.0,12.3 L 14.1,12.3 L 14.1,11.2 L 14.0,11.2 L 13.4,11.2 L 13.3,11.1 L 13.3,11.0 L 13.4,10.9 L 13.4,10.7 L 13.5,10.7 L 13.5,10.6 L 13.6,10.5 L 13.6,10.4 L 13.8,10.2 L 13.8,10.1 L 13.9,10.1 L 13.9,10.1 L 14.2,9.8 L 14.2,9.8 L 14.3,9.8 L 14.5,9.8 L 14.6,9.7 L 14.8,9.7 L 14.9,9.8 L 15.0,9.8 L 15.1,9.8 L 15.2,9.8 L 15.2,9.9 L 15.3,9.9 L 15.5,10.1 L 15.5,10.2 L 15.7,10.4 L 15.7,10.5 L 15.8,10.6 L 15.8,10.9 L 15.8,10.9 L 15.8,11.2 L 15.8,11.3 L 15.8,11.6 L 15.8,11.5 L 15.9,11.5 L 16.0,11.5 L 16.0,11.5 L 16.1,11.4 L 16.2,11.4 L 16.3,11.3 L 16.3,11.3 L 16.9,10.7 L 16.9,10.7 L 17.0,10.6 L 17.0,10.4 L 17.1,10.4 L 17.1,10.1 L 17.1,10.1 L 17.1,9.8 L 17.1,9.7 L 17.1,9.4 L 17.0,9.3 L 17.0,9.2 L 16.9,9.1 L 16.9,9.0 L 16.8,8.9 L 16.8,8.8 L 16.5,8.5 L 16.4,8.5 L 16.3,8.4 L 16.2,8.4 L 16.1,8.3 L 16.0,8.3 L 16.0,8.2 L 15.9,8.2 L 15.8,8.2 L 15.6,8.2 L 15.5,8.1 L 14.7,8.1 L 14.7,8.2 L 14.4,8.2 L 14.4,8.2 L 14.3,8.2 L 14.2,8.3 L 14.2,8.3 L 14.1,8.4 L 14.0,8.4 L 13.8,8.6 L 13.7,8.6 L 13.6,8.7 L 13.6,8.8 L 13.4,9.0 L 13.4,9.0 L 13.3,9.2 L 13.3,9.3 L 13.2,9.3 L 13.2,9.4 L 13.1,9.5 L 13.1,9.6 L 13.1,9.6 L 13.1,9.8 L 13.0,9.8 L 13.0,10.0 L 12.9,10.1 L 12.9,10.4 L 12.8,10.4 L 12.8,10.7 L 12.8,10.8 L 12.8,11.0 L 12.7,11.1 L 12.3,11.1 L 12.3,11.0 L 12.3,10.6 L 12.3,10.5 L 12.3,10.0 L 12.4,9.9 L 12.4,9.7 L 12.5,9.6 L 12.5,9.5 L 12.5,9.4 L 12.5,9.3 L 12.6,9.3 L 12.6,9.1 L 12.7,9.0 L 12.7,9.0 L 12.8,8.9 L 12.8,8.8 L 12.8,8.8 L 12.8,8.7 L 12.9,8.6 L 12.9,8.5 L 13.0,8.5 L 13.0,8.4 L 13.1,8.3 L 13.1,8.2 L 13.1,8.2 L 13.1,8.1 L 13.2,8.0 L 13.2,8.0 L 13.3,7.9 L 13.3,7.7 L 13.3,7.6 L 13.3,7.0 L 13.3,6.9 L 13.3,6.7 L 13.2,6.6 L 13.2,6.6 L 13.1,6.5 L 13.1,6.4 L 13.1,6.3 L 13.1,6.3 L 12.3,5.5 L 12.3,5.5 L 12.0,5.3 L 12.0,5.3 M 2.7,13.6 L 2.8,13.5 L 2.8,13.5 L 2.9,13.6 L 2.9,13.6 L 3.0,13.7 L 3.0,13.8 L 3.6,14.4 L 3.7,14.4 L 3.8,14.5 L 3.9,14.5 L 3.9,14.6 L 4.0,14.6 L 4.1,14.7 L 4.8,14.7 L 4.9,14.6 L 5.0,14.6 L 5.0,14.5 L 5.1,14.5 L 5.2,14.6 L 5.0,14.7 L 5.0,14.7 L 4.8,14.9 L 4.7,14.9 L 4.7,15.0 L 4.6,15.0 L 4.5,15.0 L 4.4,15.0 L 4.3,15.1 L 3.9,15.1 L 3.9,15.2 L 3.8,15.2 L 3.4,14.8 L 3.4,14.8 L 2.8,14.2 L 2.8,14.2 L 2.6,14.0 L 2.6,13.9 L 2.6,13.9 L 2.6,13.8 L 2.5,13.7 L 2.6,13.6 L 2.7,13.6 M 16.8,13.5 L 16.9,13.4 L 17.1,13.4 L 17.1,13.5 L 17.3,13.5 L 17.4,13.6 L 17.5,13.6 L 17.6,13.7 L 17.6,13.8 L 17.7,13.9 L 17.7,14.1 L 17.8,14.2 L 17.8,14.4 L 17.7,14.4 L 17.7,14.6 L 17.6,14.7 L 17.6,14.8 L 17.4,15.0 L 17.4,15.0 L 17.3,15.0 L 17.1,15.0 L 17.1,15.1 L 16.9,15.1 L 16.8,15.0 L 16.6,15.0 L 16.6,15.0 L 16.5,15.0 L 16.3,14.7 L 16.3,14.7 L 16.2,14.6 L 16.2,14.5 L 16.1,14.4 L 16.1,14.2 L 16.2,14.1 L 16.2,13.9 L 16.3,13.8 L 16.3,13.7 L 16.4,13.6 L 16.5,13.6 L 16.6,13.5 L 16.8,13.5 M 6.9,13.5 L 7.0,13.4 L 7.1,13.4 L 7.2,13.5 L 7.4,13.5 L 7.4,13.6 L 7.5,13.6 L 7.7,13.8 L 7.7,13.9 L 7.8,13.9 L 7.8,14.0 L 7.9,14.1 L 7.9,14.5 L 7.8,14.6 L 7.8,14.7 L 7.5,15.0 L 7.4,15.0 L 7.4,15.0 L 7.3,15.0 L 7.2,15.1 L 6.9,15.1 L 6.9,15.0 L 6.7,15.0 L 6.3,14.7 L 6.3,14.6 L 6.3,14.5 L 6.3,14.0 L 6.3,13.9 L 6.3,13.9 L 6.7,13.5 L 6.9,13.5 M 12.3,12.3 L 12.3,12.3 L 12.7,12.3 L 12.8,12.3 L 12.8,12.6 L 12.8,12.7 L 12.8,13.0 L 12.9,13.1 L 12.9,13.3 L 13.0,13.3 L 13.0,13.4 L 13.1,13.5 L 13.1,13.6 L 13.1,13.6 L 13.1,13.7 L 13.2,13.8 L 13.2,13.9 L 13.3,13.9 L 13.3,14.0 L 13.8,14.5 L 13.9,14.5 L 13.9,14.6 L 13.9,14.7 L 13.9,14.7 L 13.7,14.7 L 13.6,14.8 L 13.4,14.8 L 13.3,14.9 L 13.1,14.9 L 13.1,15.0 L 13.0,14.9 L 13.0,14.8 L 12.9,14.7 L 12.9,14.6 L 12.8,14.5 L 12.8,14.4 L 12.8,14.4 L 12.8,14.2 L 12.7,14.2 L 12.7,14.1 L 12.6,14.0 L 12.6,13.9 L 12.5,13.9 L 12.5,13.8 L 12.5,13.7 L 12.5,13.6 L 12.4,13.5 L 12.4,13.3 L 12.3,13.3 L 12.3,12.8 L 12.3,12.8 L 12.3,12.3 M 11.2,12.3 L 11.3,12.3 L 11.6,12.3 L 11.7,12.4 L 11.7,12.5 L 11.7,12.5 L 11.7,12.6 L 11.7,12.7 L 11.7,13.1 L 11.6,13.2 L 11.6,13.4 L 11.5,13.5 L 11.5,13.6 L 11.5,13.7 L 11.5,13.9 L 11.4,13.9 L 11.4,14.0 L 11.3,14.1 L 11.3,14.2 L 11.2,14.2 L 11.2,14.3 L 11.2,14.4 L 11.2,14.4 L 11.1,14.5 L 11.1,14.7 L 11.0,14.7 L 11.0,14.8 L 10.9,14.9 L 10.7,14.9 L 10.6,14.8 L 10.4,14.8 L 10.3,14.7 L 10.1,14.7 L 10.1,14.7 L 10.1,14.6 L 10.1,14.5 L 10.2,14.5 L 10.7,14.1 L 10.7,14.0 L 10.8,13.9 L 10.8,13.8 L 10.9,13.7 L 10.9,13.6 L 10.9,13.6 L 10.9,13.5 L 11.0,13.4 L 11.0,13.3 L 11.1,13.2 L 11.1,13.0 L 11.2,12.9 L 11.2,12.5 L 11.2,12.5 L 11.2,12.3',
  sword: 'M12 2l2 4v8h-4V6l2-4zm-4 14h8v2H8v-2zm3 2h2v3h-2v-3zm-1 3h4l-1 1h-2l-1-1z',
  shield: 'M 12.0,3.0 L 11.9,3.0 L 11.9,3.0 L 11.8,3.1 L 11.8,3.1 L 11.7,3.1 L 11.7,3.1 L 11.6,3.2 L 11.6,3.2 L 11.5,3.2 L 11.5,3.2 L 11.4,3.3 L 11.4,3.3 L 11.3,3.3 L 11.3,3.3 L 11.2,3.4 L 11.2,3.4 L 11.1,3.4 L 11.1,3.4 L 11.0,3.5 L 11.0,3.5 L 10.9,3.5 L 10.8,3.5 L 10.8,3.6 L 10.7,3.6 L 10.7,3.6 L 10.6,3.6 L 10.6,3.7 L 10.5,3.7 L 10.5,3.7 L 10.4,3.7 L 10.4,3.8 L 10.3,3.8 L 10.3,3.8 L 10.2,3.8 L 10.1,3.9 L 10.1,3.9 L 10.0,3.9 L 10.0,3.9 L 9.9,4.0 L 9.8,4.0 L 9.8,4.0 L 9.7,4.0 L 9.7,4.1 L 9.6,4.1 L 9.5,4.1 L 9.5,4.1 L 9.4,4.2 L 9.4,4.2 L 9.3,4.2 L 9.3,4.2 L 9.2,4.3 L 9.1,4.3 L 9.1,4.3 L 9.0,4.3 L 8.9,4.4 L 8.8,4.4 L 8.8,4.4 L 8.7,4.4 L 8.6,4.5 L 8.5,4.5 L 8.5,4.5 L 8.4,4.5 L 8.3,4.6 L 8.2,4.6 L 8.1,4.6 L 8.0,4.6 L 8.0,4.7 L 7.8,4.7 L 7.8,4.7 L 7.6,4.7 L 7.6,4.8 L 7.4,4.8 L 7.4,4.8 L 7.2,4.8 L 7.1,4.9 L 6.9,4.9 L 6.9,4.9 L 6.7,4.9 L 6.7,5.0 L 6.4,5.0 L 6.3,5.0 L 6.1,5.0 L 6.1,5.1 L 5.8,5.1 L 5.7,5.1 L 5.5,5.1 L 5.5,5.2 L 5.2,5.2 L 5.1,5.2 L 4.9,5.2 L 4.8,5.3 L 4.7,5.3 L 4.6,5.3 L 4.6,6.6 L 4.7,6.7 L 4.7,7.8 L 4.7,7.9 L 4.7,8.7 L 4.8,8.7 L 4.8,9.5 L 4.8,9.6 L 4.8,10.0 L 4.9,10.1 L 4.9,10.5 L 4.9,10.5 L 4.9,10.7 L 5.0,10.8 L 5.0,11.0 L 5.0,11.1 L 5.0,11.2 L 5.1,11.3 L 5.1,11.5 L 5.1,11.5 L 5.1,11.7 L 5.2,11.7 L 5.2,11.9 L 5.2,11.9 L 5.2,12.0 L 5.3,12.1 L 5.3,12.2 L 5.3,12.2 L 5.3,12.4 L 5.4,12.4 L 5.4,12.6 L 5.4,12.6 L 5.4,12.8 L 5.5,12.8 L 5.5,12.9 L 5.5,12.9 L 5.5,13.1 L 5.6,13.1 L 5.6,13.2 L 5.6,13.3 L 5.6,13.4 L 5.7,13.4 L 5.7,13.5 L 5.7,13.5 L 5.7,13.6 L 5.8,13.7 L 5.8,13.8 L 5.8,13.8 L 5.8,13.9 L 5.9,13.9 L 5.9,14.0 L 5.9,14.1 L 5.9,14.1 L 6.0,14.2 L 6.0,14.3 L 6.0,14.3 L 6.0,14.4 L 6.1,14.4 L 6.1,14.5 L 6.1,14.5 L 6.1,14.6 L 6.2,14.7 L 6.2,14.7 L 6.2,14.8 L 6.2,14.8 L 6.3,14.9 L 6.3,14.9 L 6.3,15.0 L 6.3,15.0 L 6.4,15.1 L 6.4,15.1 L 6.5,15.2 L 6.5,15.3 L 6.5,15.3 L 6.5,15.4 L 6.6,15.4 L 6.6,15.5 L 6.6,15.5 L 6.6,15.6 L 6.7,15.7 L 6.7,15.7 L 6.8,15.8 L 6.8,15.8 L 6.9,15.9 L 6.9,16.0 L 6.9,16.0 L 6.9,16.1 L 7.0,16.2 L 7.0,16.2 L 7.1,16.3 L 7.1,16.4 L 7.2,16.4 L 7.2,16.5 L 7.3,16.6 L 7.3,16.7 L 7.4,16.8 L 7.4,16.8 L 7.5,16.9 L 7.5,17.0 L 7.7,17.1 L 7.7,17.1 L 7.8,17.3 L 7.8,17.3 L 8.0,17.5 L 8.0,17.5 L 8.2,17.7 L 8.2,17.8 L 9.4,19.0 L 9.4,19.0 L 9.7,19.3 L 9.7,19.3 L 10.0,19.6 L 10.1,19.6 L 10.3,19.8 L 10.4,19.8 L 10.6,20.0 L 10.6,20.0 L 10.7,20.1 L 10.8,20.1 L 10.8,20.2 L 10.9,20.2 L 11.0,20.3 L 11.0,20.3 L 11.1,20.3 L 11.1,20.3 L 11.2,20.4 L 11.3,20.4 L 11.4,20.5 L 11.4,20.5 L 11.5,20.6 L 11.5,20.6 L 11.6,20.6 L 11.6,20.6 L 11.7,20.7 L 11.7,20.7 L 11.8,20.7 L 11.8,20.7 L 11.9,20.8 L 11.9,20.8 L 12.0,20.8 L 12.0,20.8 L 12.1,20.8 L 12.1,20.8 L 12.2,20.7 L 12.2,20.7 L 12.3,20.7 L 12.4,20.7 L 12.4,20.6 L 12.5,20.6 L 12.5,20.6 L 12.6,20.6 L 12.7,20.5 L 12.7,20.5 L 12.8,20.4 L 12.9,20.4 L 12.9,20.3 L 13.0,20.3 L 13.1,20.2 L 13.1,20.2 L 13.2,20.2 L 13.2,20.2 L 13.3,20.1 L 13.4,20.1 L 13.5,20.0 L 13.5,20.0 L 13.7,19.8 L 13.8,19.8 L 14.0,19.5 L 14.1,19.5 L 14.4,19.2 L 14.4,19.2 L 14.7,18.9 L 14.8,18.9 L 15.7,18.0 L 15.7,17.9 L 16.0,17.6 L 16.0,17.5 L 16.2,17.4 L 16.2,17.3 L 16.3,17.2 L 16.3,17.1 L 16.5,17.0 L 16.5,17.0 L 16.6,16.9 L 16.6,16.8 L 16.7,16.7 L 16.7,16.7 L 16.8,16.5 L 16.8,16.5 L 16.9,16.4 L 16.9,16.3 L 17.0,16.3 L 17.0,16.2 L 17.1,16.1 L 17.1,16.1 L 17.2,16.0 L 17.2,15.9 L 17.2,15.9 L 17.2,15.8 L 17.3,15.7 L 17.3,15.7 L 17.4,15.6 L 17.4,15.6 L 17.4,15.5 L 17.4,15.5 L 17.5,15.4 L 17.5,15.3 L 17.6,15.3 L 17.6,15.2 L 17.6,15.2 L 17.6,15.1 L 17.7,15.0 L 17.7,15.0 L 17.8,14.9 L 17.8,14.8 L 17.8,14.8 L 17.8,14.7 L 17.9,14.7 L 17.9,14.6 L 17.9,14.6 L 17.9,14.5 L 18.0,14.5 L 18.0,14.4 L 18.0,14.4 L 18.0,14.3 L 18.1,14.2 L 18.1,14.2 L 18.1,14.1 L 18.1,14.0 L 18.2,14.0 L 18.2,13.9 L 18.2,13.9 L 18.2,13.8 L 18.3,13.7 L 18.3,13.7 L 18.3,13.6 L 18.3,13.5 L 18.4,13.5 L 18.4,13.4 L 18.4,13.3 L 18.4,13.2 L 18.5,13.2 L 18.5,13.1 L 18.5,13.0 L 18.5,13.0 L 18.6,12.9 L 18.6,12.8 L 18.6,12.7 L 18.6,12.6 L 18.7,12.6 L 18.7,12.4 L 18.7,12.4 L 18.7,12.2 L 18.8,12.2 L 18.8,12.0 L 18.8,12.0 L 18.8,11.9 L 18.9,11.8 L 18.9,11.7 L 18.9,11.6 L 18.9,11.5 L 19.0,11.4 L 19.0,11.2 L 19.0,11.2 L 19.0,11.0 L 19.1,10.9 L 19.1,10.7 L 19.1,10.7 L 19.1,10.4 L 19.2,10.3 L 19.2,10.0 L 19.2,9.9 L 19.2,9.4 L 19.3,9.3 L 19.3,8.6 L 19.3,8.5 L 19.3,7.5 L 19.4,7.5 L 19.4,6.4 L 19.4,6.3 L 19.4,5.3 L 19.2,5.3 L 19.1,5.2 L 19.0,5.2 L 18.9,5.2 L 18.6,5.2 L 18.6,5.1 L 18.4,5.1 L 18.3,5.1 L 18.0,5.1 L 18.0,5.0 L 17.7,5.0 L 17.7,5.0 L 17.4,5.0 L 17.4,4.9 L 17.2,4.9 L 17.1,4.9 L 16.9,4.9 L 16.9,4.8 L 16.7,4.8 L 16.7,4.8 L 16.5,4.8 L 16.5,4.7 L 16.3,4.7 L 16.2,4.7 L 16.1,4.7 L 16.1,4.6 L 15.9,4.6 L 15.9,4.6 L 15.8,4.6 L 15.7,4.5 L 15.6,4.5 L 15.5,4.5 L 15.4,4.5 L 15.4,4.4 L 15.3,4.4 L 15.2,4.4 L 15.1,4.4 L 15.1,4.3 L 15.0,4.3 L 15.0,4.3 L 14.9,4.3 L 14.8,4.2 L 14.7,4.2 L 14.7,4.2 L 14.6,4.2 L 14.6,4.1 L 14.5,4.1 L 14.5,4.1 L 14.4,4.1 L 14.3,4.0 L 14.3,4.0 L 14.2,4.0 L 14.2,4.0 L 14.1,3.9 L 14.0,3.9 L 14.0,3.9 L 13.9,3.9 L 13.9,3.8 L 13.8,3.8 L 13.8,3.8 L 13.7,3.8 L 13.7,3.7 L 13.6,3.7 L 13.5,3.7 L 13.5,3.7 L 13.4,3.6 L 13.4,3.6 L 13.3,3.6 L 13.3,3.6 L 13.2,3.5 L 13.2,3.5 L 13.1,3.5 L 13.1,3.5 L 13.0,3.4 L 12.9,3.4 L 12.9,3.4 L 12.8,3.4 L 12.8,3.3 L 12.7,3.3 L 12.7,3.3 L 12.6,3.3 L 12.6,3.2 L 12.5,3.2 L 12.5,3.2 L 12.4,3.2 L 12.4,3.1 L 12.3,3.1 L 12.3,3.1 L 12.2,3.1 L 12.2,3.0 L 12.1,3.0 L 12.1,3.0 L 12.0,3.0 M 11.9,1.8 L 11.8,1.8 L 11.8,1.8 L 11.7,1.9 L 11.7,1.9 L 11.6,1.9 L 11.6,1.9 L 11.5,2.0 L 11.4,2.0 L 11.3,2.1 L 11.3,2.1 L 11.2,2.1 L 11.2,2.1 L 11.1,2.2 L 11.1,2.2 L 11.0,2.2 L 11.0,2.2 L 10.9,2.3 L 10.9,2.3 L 10.8,2.3 L 10.8,2.3 L 10.7,2.4 L 10.7,2.4 L 10.6,2.4 L 10.6,2.4 L 10.5,2.5 L 10.4,2.5 L 10.4,2.5 L 10.3,2.5 L 10.3,2.6 L 10.2,2.6 L 10.2,2.6 L 10.1,2.6 L 10.1,2.7 L 10.0,2.7 L 10.0,2.7 L 9.9,2.7 L 9.8,2.8 L 9.8,2.8 L 9.7,2.8 L 9.6,2.8 L 9.6,2.9 L 9.5,2.9 L 9.5,2.9 L 9.4,2.9 L 9.4,3.0 L 9.3,3.0 L 9.3,3.0 L 9.2,3.0 L 9.2,3.1 L 9.1,3.1 L 9.0,3.1 L 9.0,3.1 L 8.9,3.2 L 8.8,3.2 L 8.8,3.2 L 8.7,3.2 L 8.6,3.3 L 8.5,3.3 L 8.5,3.3 L 8.4,3.3 L 8.4,3.4 L 8.2,3.4 L 8.2,3.4 L 8.1,3.4 L 8.0,3.5 L 7.9,3.5 L 7.9,3.5 L 7.8,3.5 L 7.7,3.6 L 7.6,3.6 L 7.6,3.6 L 7.4,3.6 L 7.4,3.7 L 7.2,3.7 L 7.2,3.7 L 7.0,3.7 L 7.0,3.8 L 6.8,3.8 L 6.8,3.8 L 6.6,3.8 L 6.6,3.9 L 6.4,3.9 L 6.3,3.9 L 6.1,3.9 L 6.1,4.0 L 5.9,4.0 L 5.8,4.0 L 5.6,4.0 L 5.6,4.1 L 5.3,4.1 L 5.2,4.1 L 5.0,4.1 L 5.0,4.2 L 4.7,4.2 L 4.6,4.2 L 4.4,4.2 L 4.4,4.3 L 4.1,4.3 L 4.1,4.3 L 3.8,4.3 L 3.8,4.4 L 3.5,4.4 L 3.5,4.4 L 3.4,4.4 L 3.4,5.6 L 3.5,5.7 L 3.5,7.0 L 3.5,7.1 L 3.5,7.9 L 3.6,7.9 L 3.6,8.8 L 3.6,8.8 L 3.6,9.4 L 3.7,9.4 L 3.7,10.0 L 3.7,10.1 L 3.7,10.4 L 3.8,10.4 L 3.8,10.6 L 3.8,10.7 L 3.8,10.9 L 3.9,10.9 L 3.9,11.1 L 3.9,11.1 L 3.9,11.4 L 4.0,11.4 L 4.0,11.6 L 4.0,11.6 L 4.0,11.8 L 4.1,11.8 L 4.1,12.0 L 4.1,12.0 L 4.1,12.1 L 4.2,12.2 L 4.2,12.3 L 4.2,12.4 L 4.2,12.5 L 4.3,12.5 L 4.3,12.7 L 4.3,12.7 L 4.3,12.8 L 4.4,12.9 L 4.4,13.0 L 4.4,13.1 L 4.4,13.1 L 4.4,13.2 L 4.4,13.3 L 4.5,13.4 L 4.5,13.5 L 4.5,13.5 L 4.5,13.6 L 4.6,13.7 L 4.6,13.8 L 4.6,13.8 L 4.6,13.9 L 4.7,13.9 L 4.7,14.0 L 4.7,14.1 L 4.7,14.2 L 4.8,14.2 L 4.8,14.3 L 4.8,14.3 L 4.8,14.4 L 4.9,14.4 L 4.9,14.5 L 4.9,14.6 L 4.9,14.6 L 5.0,14.7 L 5.0,14.8 L 5.0,14.8 L 5.0,14.9 L 5.1,14.9 L 5.1,15.0 L 5.1,15.1 L 5.1,15.1 L 5.2,15.2 L 5.2,15.2 L 5.2,15.3 L 5.2,15.3 L 5.3,15.4 L 5.3,15.4 L 5.3,15.5 L 5.3,15.5 L 5.4,15.6 L 5.4,15.6 L 5.5,15.7 L 5.5,15.8 L 5.5,15.8 L 5.5,15.9 L 5.6,15.9 L 5.6,16.0 L 5.7,16.1 L 5.7,16.1 L 5.7,16.2 L 5.7,16.2 L 5.8,16.3 L 5.8,16.3 L 5.9,16.4 L 5.9,16.5 L 6.0,16.6 L 6.0,16.6 L 6.0,16.7 L 6.0,16.7 L 6.1,16.8 L 6.1,16.8 L 6.2,16.9 L 6.2,17.0 L 6.3,17.1 L 6.3,17.1 L 6.4,17.2 L 6.4,17.2 L 6.5,17.3 L 6.5,17.4 L 6.6,17.5 L 6.6,17.5 L 6.7,17.7 L 6.7,17.7 L 6.8,17.8 L 6.8,17.9 L 7.0,18.1 L 7.0,18.1 L 7.1,18.2 L 7.1,18.3 L 7.3,18.5 L 7.3,18.5 L 7.7,18.9 L 7.7,19.0 L 8.7,19.9 L 8.7,19.9 L 9.0,20.2 L 9.0,20.2 L 9.4,20.5 L 9.4,20.5 L 9.6,20.8 L 9.7,20.8 L 9.9,21.0 L 10.0,21.0 L 10.2,21.2 L 10.2,21.2 L 10.3,21.3 L 10.4,21.3 L 10.5,21.4 L 10.5,21.4 L 10.6,21.5 L 10.7,21.5 L 10.7,21.6 L 10.8,21.6 L 10.9,21.7 L 10.9,21.7 L 11.0,21.7 L 11.0,21.7 L 11.1,21.8 L 11.2,21.8 L 11.3,21.9 L 11.3,21.9 L 11.4,22.0 L 11.4,22.0 L 11.5,22.0 L 11.5,22.0 L 11.6,22.1 L 11.6,22.1 L 11.7,22.1 L 11.7,22.1 L 11.8,22.2 L 11.9,22.2 L 11.9,22.2 L 12.0,22.2 L 12.1,22.2 L 12.2,22.2 L 12.2,22.1 L 12.3,22.1 L 12.3,22.1 L 12.4,22.1 L 12.4,22.0 L 12.5,22.0 L 12.5,22.0 L 12.6,22.0 L 12.7,21.9 L 12.8,21.9 L 12.9,21.8 L 12.9,21.8 L 13.0,21.7 L 13.0,21.7 L 13.1,21.6 L 13.2,21.6 L 13.2,21.6 L 13.3,21.6 L 13.4,21.5 L 13.4,21.5 L 13.5,21.4 L 13.5,21.4 L 13.6,21.3 L 13.7,21.3 L 13.8,21.2 L 13.9,21.2 L 14.1,21.0 L 14.1,21.0 L 14.4,20.7 L 14.4,20.7 L 14.7,20.4 L 14.7,20.4 L 15.0,20.1 L 15.1,20.1 L 15.4,19.8 L 15.5,19.8 L 16.1,19.2 L 16.1,19.1 L 16.6,18.6 L 16.6,18.5 L 16.8,18.4 L 16.8,18.3 L 16.9,18.2 L 16.9,18.1 L 17.1,18.0 L 17.1,17.9 L 17.2,17.8 L 17.2,17.7 L 17.4,17.6 L 17.4,17.5 L 17.5,17.4 L 17.5,17.4 L 17.6,17.3 L 17.6,17.2 L 17.7,17.1 L 17.7,17.1 L 17.8,17.0 L 17.8,17.0 L 17.9,16.9 L 17.9,16.8 L 18.0,16.7 L 18.0,16.7 L 18.0,16.6 L 18.0,16.6 L 18.1,16.5 L 18.1,16.4 L 18.2,16.4 L 18.2,16.3 L 18.3,16.2 L 18.3,16.2 L 18.3,16.1 L 18.3,16.1 L 18.4,16.0 L 18.4,16.0 L 18.5,15.9 L 18.5,15.8 L 18.5,15.8 L 18.5,15.7 L 18.6,15.7 L 18.6,15.6 L 18.7,15.5 L 18.7,15.4 L 18.7,15.4 L 18.7,15.3 L 18.8,15.3 L 18.8,15.2 L 18.8,15.2 L 18.8,15.1 L 18.9,15.1 L 18.9,15.0 L 18.9,15.0 L 18.9,14.9 L 19.0,14.9 L 19.0,14.8 L 19.0,14.7 L 19.0,14.7 L 19.1,14.6 L 19.1,14.6 L 19.1,14.5 L 19.1,14.4 L 19.2,14.4 L 19.2,14.3 L 19.2,14.3 L 19.2,14.2 L 19.3,14.1 L 19.3,14.1 L 19.3,14.0 L 19.3,13.9 L 19.4,13.9 L 19.4,13.8 L 19.4,13.7 L 19.4,13.7 L 19.5,13.6 L 19.5,13.5 L 19.5,13.5 L 19.5,13.4 L 19.6,13.3 L 19.6,13.2 L 19.6,13.2 L 19.6,13.1 L 19.6,13.0 L 19.6,12.9 L 19.7,12.8 L 19.7,12.7 L 19.7,12.7 L 19.7,12.5 L 19.8,12.5 L 19.8,12.4 L 19.8,12.3 L 19.8,12.2 L 19.9,12.1 L 19.9,12.0 L 19.9,12.0 L 19.9,11.8 L 20.0,11.8 L 20.0,11.6 L 20.0,11.5 L 20.0,11.4 L 20.1,11.3 L 20.1,11.1 L 20.1,11.1 L 20.1,10.9 L 20.2,10.9 L 20.2,10.6 L 20.2,10.6 L 20.2,10.3 L 20.3,10.3 L 20.3,9.9 L 20.3,9.8 L 20.3,9.4 L 20.4,9.4 L 20.4,8.8 L 20.4,8.7 L 20.4,7.8 L 20.5,7.8 L 20.5,6.9 L 20.5,6.9 L 20.5,5.5 L 20.6,5.5 L 20.6,4.4 L 20.5,4.4 L 20.4,4.4 L 20.2,4.4 L 20.2,4.3 L 20.0,4.3 L 19.9,4.3 L 19.7,4.3 L 19.6,4.2 L 19.4,4.2 L 19.4,4.2 L 19.1,4.2 L 19.0,4.1 L 18.8,4.1 L 18.7,4.1 L 18.5,4.1 L 18.4,4.0 L 18.2,4.0 L 18.2,4.0 L 18.0,4.0 L 17.9,3.9 L 17.7,3.9 L 17.6,3.9 L 17.5,3.9 L 17.4,3.8 L 17.2,3.8 L 17.2,3.8 L 17.1,3.8 L 17.0,3.7 L 16.8,3.7 L 16.8,3.7 L 16.7,3.7 L 16.6,3.6 L 16.5,3.6 L 16.4,3.6 L 16.3,3.6 L 16.3,3.5 L 16.1,3.5 L 16.1,3.5 L 16.0,3.5 L 15.9,3.4 L 15.8,3.4 L 15.8,3.4 L 15.7,3.4 L 15.6,3.3 L 15.5,3.3 L 15.5,3.3 L 15.4,3.3 L 15.3,3.2 L 15.3,3.2 L 15.2,3.2 L 15.1,3.2 L 15.1,3.1 L 15.0,3.1 L 14.9,3.1 L 14.9,3.1 L 14.8,3.0 L 14.7,3.0 L 14.7,3.0 L 14.6,3.0 L 14.6,2.9 L 14.5,2.9 L 14.5,2.9 L 14.4,2.9 L 14.4,2.8 L 14.3,2.8 L 14.2,2.8 L 14.2,2.8 L 14.1,2.7 L 14.1,2.7 L 14.0,2.7 L 14.0,2.7 L 13.9,2.6 L 13.8,2.6 L 13.8,2.6 L 13.7,2.6 L 13.7,2.5 L 13.6,2.5 L 13.6,2.5 L 13.5,2.5 L 13.5,2.4 L 13.4,2.4 L 13.4,2.4 L 13.3,2.4 L 13.3,2.3 L 13.2,2.3 L 13.1,2.3 L 13.1,2.3 L 13.0,2.2 L 13.0,2.2 L 12.9,2.2 L 12.9,2.2 L 12.8,2.1 L 12.8,2.1 L 12.7,2.1 L 12.7,2.1 L 12.6,2.0 L 12.6,2.0 L 12.5,2.0 L 12.5,2.0 L 12.4,1.9 L 12.4,1.9 L 12.3,1.9 L 12.3,1.9 L 12.2,1.8 L 12.2,1.8 L 12.1,1.8 L 11.9,1.8 M 11.8,2.5 L 11.9,2.5 L 12.1,2.5 L 12.2,2.5 L 12.2,2.5 L 12.3,2.6 L 12.3,2.6 L 12.4,2.6 L 12.4,2.6 L 12.5,2.7 L 12.5,2.7 L 12.6,2.7 L 12.6,2.7 L 12.7,2.8 L 12.7,2.8 L 12.8,2.8 L 12.8,2.8 L 12.9,2.9 L 12.9,2.9 L 13.0,2.9 L 13.0,2.9 L 13.1,3.0 L 13.2,3.0 L 13.2,3.0 L 13.3,3.0 L 13.3,3.1 L 13.4,3.1 L 13.4,3.1 L 13.5,3.1 L 13.5,3.2 L 13.6,3.2 L 13.6,3.2 L 13.7,3.2 L 13.8,3.3 L 13.8,3.3 L 13.9,3.3 L 13.9,3.3 L 14.0,3.4 L 14.0,3.4 L 14.1,3.4 L 14.2,3.4 L 14.2,3.5 L 14.3,3.5 L 14.3,3.5 L 14.4,3.5 L 14.5,3.6 L 14.5,3.6 L 14.6,3.6 L 14.6,3.6 L 14.6,3.7 L 14.7,3.7 L 14.8,3.7 L 14.9,3.7 L 14.9,3.8 L 15.0,3.8 L 15.1,3.8 L 15.1,3.8 L 15.2,3.9 L 15.3,3.9 L 15.3,3.9 L 15.4,3.9 L 15.5,4.0 L 15.6,4.0 L 15.6,4.0 L 15.7,4.0 L 15.8,4.1 L 15.9,4.1 L 15.9,4.1 L 16.1,4.1 L 16.1,4.2 L 16.2,4.2 L 16.3,4.2 L 16.4,4.2 L 16.5,4.3 L 16.6,4.3 L 16.7,4.3 L 16.8,4.3 L 16.9,4.4 L 17.1,4.4 L 17.1,4.4 L 17.3,4.4 L 17.3,4.5 L 17.6,4.5 L 17.6,4.5 L 17.8,4.5 L 17.9,4.6 L 18.1,4.6 L 18.2,4.6 L 18.4,4.6 L 18.4,4.7 L 18.8,4.7 L 18.8,4.7 L 19.0,4.7 L 19.1,4.8 L 19.4,4.8 L 19.4,4.8 L 19.6,4.8 L 19.6,4.9 L 19.8,4.9 L 19.8,4.9 L 19.9,4.9 L 20.0,5.0 L 20.0,5.0 L 19.9,5.1 L 19.9,6.6 L 19.9,6.6 L 19.9,6.7 L 19.9,6.7 L 19.9,7.8 L 19.8,7.8 L 19.8,8.5 L 19.8,8.6 L 19.8,9.4 L 19.7,9.5 L 19.7,9.9 L 19.7,9.9 L 19.7,10.3 L 19.6,10.4 L 19.6,10.6 L 19.6,10.7 L 19.6,10.9 L 19.6,11.0 L 19.6,11.1 L 19.5,11.2 L 19.5,11.4 L 19.5,11.4 L 19.5,11.6 L 19.4,11.6 L 19.4,11.8 L 19.4,11.8 L 19.4,12.0 L 19.3,12.0 L 19.3,12.1 L 19.3,12.2 L 19.3,12.3 L 19.2,12.4 L 19.2,12.5 L 19.2,12.6 L 19.2,12.7 L 19.1,12.8 L 19.1,12.9 L 19.1,12.9 L 19.1,13.0 L 19.0,13.1 L 19.0,13.2 L 19.0,13.2 L 19.0,13.3 L 18.9,13.4 L 18.9,13.5 L 18.9,13.5 L 18.9,13.6 L 18.8,13.6 L 18.8,13.7 L 18.8,13.8 L 18.8,13.9 L 18.7,13.9 L 18.7,14.0 L 18.7,14.0 L 18.7,14.1 L 18.6,14.2 L 18.6,14.2 L 18.6,14.3 L 18.6,14.3 L 18.5,14.4 L 18.5,14.5 L 18.5,14.5 L 18.5,14.6 L 18.4,14.6 L 18.4,14.7 L 18.4,14.7 L 18.4,14.8 L 18.3,14.9 L 18.3,14.9 L 18.3,15.0 L 18.3,15.0 L 18.2,15.1 L 18.2,15.1 L 18.2,15.2 L 18.2,15.2 L 18.1,15.3 L 18.1,15.3 L 18.0,15.4 L 18.0,15.5 L 18.0,15.5 L 18.0,15.6 L 17.9,15.6 L 17.9,15.7 L 17.8,15.8 L 17.8,15.8 L 17.8,15.9 L 17.8,15.9 L 17.7,16.0 L 17.7,16.1 L 17.6,16.1 L 17.6,16.2 L 17.5,16.3 L 17.5,16.3 L 17.5,16.4 L 17.5,16.4 L 17.4,16.5 L 17.4,16.6 L 17.3,16.7 L 17.3,16.7 L 17.2,16.8 L 17.2,16.9 L 17.1,17.0 L 17.1,17.0 L 16.9,17.1 L 16.9,17.2 L 16.8,17.3 L 16.8,17.3 L 16.7,17.5 L 16.7,17.5 L 16.5,17.7 L 16.5,17.7 L 16.3,17.9 L 16.3,18.0 L 15.9,18.4 L 15.9,18.4 L 15.1,19.3 L 15.0,19.3 L 14.7,19.6 L 14.7,19.6 L 14.4,19.9 L 14.3,19.9 L 14.1,20.2 L 14.0,20.2 L 13.8,20.4 L 13.8,20.4 L 13.6,20.5 L 13.6,20.5 L 13.4,20.7 L 13.4,20.7 L 13.3,20.7 L 13.3,20.7 L 13.2,20.8 L 13.1,20.8 L 13.1,20.9 L 13.0,20.9 L 12.9,21.0 L 12.9,21.0 L 12.8,21.0 L 12.8,21.0 L 12.7,21.1 L 12.6,21.1 L 12.6,21.2 L 12.5,21.2 L 12.5,21.2 L 12.4,21.2 L 12.4,21.3 L 12.3,21.3 L 12.3,21.3 L 12.2,21.3 L 12.2,21.4 L 12.1,21.4 L 12.1,21.4 L 11.9,21.4 L 11.8,21.4 L 11.8,21.4 L 11.7,21.3 L 11.7,21.3 L 11.6,21.3 L 11.6,21.3 L 11.5,21.2 L 11.5,21.2 L 11.4,21.2 L 11.4,21.2 L 11.3,21.1 L 11.2,21.1 L 11.2,21.0 L 11.1,21.0 L 11.0,20.9 L 11.0,20.9 L 10.9,20.8 L 10.8,20.8 L 10.8,20.8 L 10.7,20.8 L 10.6,20.7 L 10.6,20.7 L 10.5,20.6 L 10.5,20.6 L 10.3,20.5 L 10.3,20.5 L 10.0,20.2 L 10.0,20.2 L 9.7,20.0 L 9.7,20.0 L 9.4,19.7 L 9.4,19.7 L 9.1,19.4 L 9.1,19.4 L 7.8,18.1 L 7.8,18.1 L 7.6,17.9 L 7.6,17.8 L 7.4,17.6 L 7.4,17.6 L 7.3,17.5 L 7.3,17.4 L 7.1,17.3 L 7.1,17.2 L 7.0,17.1 L 7.0,17.1 L 6.9,17.0 L 6.9,16.9 L 6.8,16.8 L 6.8,16.8 L 6.7,16.7 L 6.7,16.6 L 6.6,16.5 L 6.6,16.5 L 6.5,16.4 L 6.5,16.3 L 6.4,16.3 L 6.4,16.2 L 6.3,16.1 L 6.3,16.1 L 6.3,16.0 L 6.3,16.0 L 6.2,15.9 L 6.2,15.8 L 6.1,15.8 L 6.1,15.7 L 6.1,15.7 L 6.1,15.6 L 6.0,15.5 L 6.0,15.5 L 5.9,15.4 L 5.9,15.4 L 5.9,15.3 L 5.9,15.3 L 5.8,15.2 L 5.8,15.2 L 5.7,15.1 L 5.7,15.0 L 5.7,15.0 L 5.7,14.9 L 5.6,14.8 L 5.6,14.8 L 5.6,14.7 L 5.6,14.7 L 5.5,14.6 L 5.5,14.6 L 5.5,14.5 L 5.5,14.4 L 5.4,14.4 L 5.4,14.3 L 5.4,14.3 L 5.4,14.2 L 5.3,14.1 L 5.3,14.1 L 5.3,14.0 L 5.3,13.9 L 5.2,13.9 L 5.2,13.8 L 5.2,13.8 L 5.2,13.7 L 5.1,13.6 L 5.1,13.5 L 5.1,13.5 L 5.1,13.4 L 5.0,13.3 L 5.0,13.2 L 5.0,13.2 L 5.0,13.1 L 4.9,13.0 L 4.9,12.9 L 4.9,12.9 L 4.9,12.8 L 4.8,12.7 L 4.8,12.6 L 4.8,12.5 L 4.8,12.4 L 4.7,12.4 L 4.7,12.2 L 4.7,12.2 L 4.7,12.1 L 4.6,12.0 L 4.6,11.9 L 4.6,11.8 L 4.6,11.7 L 4.5,11.6 L 4.5,11.5 L 4.5,11.5 L 4.5,11.3 L 4.4,11.2 L 4.4,11.0 L 4.4,11.0 L 4.4,10.8 L 4.4,10.7 L 4.4,10.5 L 4.3,10.5 L 4.3,10.1 L 4.3,10.1 L 4.3,9.6 L 4.2,9.6 L 4.2,8.8 L 4.2,8.8 L 4.2,8.1 L 4.1,8.0 L 4.1,7.1 L 4.1,7.1 L 4.1,7.0 L 4.1,7.0 L 4.1,5.7 L 4.0,5.7 L 4.0,5.0 L 4.1,4.9 L 4.1,4.9 L 4.2,4.9 L 4.4,4.9 L 4.4,4.8 L 4.6,4.8 L 4.7,4.8 L 5.0,4.8 L 5.0,4.7 L 5.2,4.7 L 5.3,4.7 L 5.6,4.7 L 5.6,4.6 L 5.8,4.6 L 5.9,4.6 L 6.2,4.6 L 6.2,4.5 L 6.4,4.5 L 6.5,4.5 L 6.7,4.5 L 6.7,4.4 L 6.9,4.4 L 7.0,4.4 L 7.1,4.4 L 7.2,4.3 L 7.3,4.3 L 7.4,4.3 L 7.5,4.3 L 7.6,4.2 L 7.7,4.2 L 7.8,4.2 L 7.9,4.2 L 7.9,4.1 L 8.1,4.1 L 8.1,4.1 L 8.2,4.1 L 8.3,4.0 L 8.4,4.0 L 8.4,4.0 L 8.5,4.0 L 8.6,3.9 L 8.7,3.9 L 8.7,3.9 L 8.8,3.9 L 8.9,3.8 L 9.0,3.8 L 9.0,3.8 L 9.1,3.8 L 9.2,3.7 L 9.2,3.7 L 9.3,3.7 L 9.4,3.7 L 9.4,3.6 L 9.4,3.6 L 9.5,3.6 L 9.6,3.6 L 9.6,3.5 L 9.7,3.5 L 9.7,3.5 L 9.8,3.5 L 9.8,3.4 L 9.9,3.4 L 10.0,3.4 L 10.0,3.4 L 10.1,3.3 L 10.2,3.3 L 10.2,3.3 L 10.3,3.3 L 10.3,3.2 L 10.4,3.2 L 10.4,3.2 L 10.5,3.2 L 10.5,3.1 L 10.6,3.1 L 10.6,3.1 L 10.7,3.1 L 10.8,3.0 L 10.8,3.0 L 10.9,3.0 L 10.9,3.0 L 11.0,2.9 L 11.0,2.9 L 11.1,2.9 L 11.1,2.9 L 11.2,2.8 L 11.2,2.8 L 11.3,2.8 L 11.3,2.8 L 11.4,2.7 L 11.4,2.7 L 11.5,2.7 L 11.5,2.7 L 11.6,2.6 L 11.6,2.6 L 11.7,2.6 L 11.7,2.6 L 11.8,2.5 L 11.8,2.5',
  flame: 'M 11.7,0.0 L 11.8,0.1 L 11.8,0.1 L 11.8,0.2 L 11.8,0.3 L 11.9,0.4 L 11.9,0.6 L 12.0,0.6 L 12.0,0.7 L 12.0,0.8 L 12.0,1.0 L 12.1,1.1 L 12.1,1.2 L 12.2,1.3 L 12.2,1.6 L 12.2,1.6 L 12.2,1.8 L 12.3,1.9 L 12.3,2.2 L 12.3,2.3 L 12.3,2.7 L 12.4,2.7 L 12.4,4.4 L 12.3,4.4 L 12.3,4.8 L 12.3,4.8 L 12.3,5.0 L 12.2,5.1 L 12.2,5.3 L 12.2,5.3 L 12.2,5.5 L 12.1,5.5 L 12.1,5.6 L 12.0,5.7 L 12.0,5.8 L 12.0,5.8 L 12.0,5.9 L 11.8,6.0 L 11.8,6.1 L 11.8,6.2 L 11.8,6.2 L 11.3,6.7 L 11.2,6.7 L 11.1,6.8 L 11.0,6.8 L 10.9,6.9 L 10.8,6.9 L 10.7,7.0 L 10.5,7.0 L 10.4,6.9 L 10.3,6.9 L 10.2,6.8 L 10.2,6.8 L 10.0,6.7 L 10.0,6.7 L 10.0,6.6 L 10.0,6.0 L 10.0,6.0 L 10.0,5.8 L 10.1,5.7 L 10.1,5.6 L 10.2,5.5 L 10.2,5.4 L 10.2,5.3 L 10.2,5.2 L 10.3,5.1 L 10.3,4.3 L 10.3,4.4 L 10.2,4.4 L 10.2,4.5 L 10.2,4.5 L 10.2,4.7 L 10.0,4.8 L 10.0,4.8 L 10.0,4.9 L 10.0,5.0 L 9.9,5.0 L 9.9,5.1 L 9.8,5.2 L 9.8,5.3 L 9.7,5.4 L 9.7,5.5 L 9.5,5.7 L 9.5,5.7 L 9.3,5.9 L 9.3,6.0 L 9.0,6.2 L 9.0,6.3 L 8.8,6.5 L 8.8,6.6 L 8.5,6.9 L 8.5,7.0 L 8.2,7.3 L 8.2,7.3 L 7.9,7.6 L 7.9,7.7 L 7.6,8.0 L 7.6,8.0 L 7.4,8.3 L 7.4,8.3 L 7.1,8.6 L 7.1,8.6 L 6.9,8.8 L 6.9,8.9 L 6.7,9.1 L 6.7,9.1 L 6.6,9.3 L 6.6,9.3 L 6.4,9.5 L 6.4,9.6 L 6.3,9.7 L 6.3,9.8 L 6.2,9.9 L 6.2,9.9 L 6.1,10.0 L 6.1,10.1 L 6.0,10.2 L 6.0,10.3 L 5.9,10.3 L 5.9,10.4 L 5.8,10.5 L 5.8,10.6 L 5.8,10.6 L 5.8,10.7 L 5.6,10.8 L 5.6,10.9 L 5.6,10.9 L 5.6,11.0 L 5.5,11.1 L 5.5,11.1 L 5.4,11.2 L 5.4,11.3 L 5.4,11.3 L 5.4,11.4 L 5.3,11.4 L 5.3,11.5 L 5.3,11.6 L 5.3,11.6 L 5.2,11.7 L 5.2,11.8 L 5.1,11.9 L 5.1,11.9 L 5.1,12.0 L 5.1,12.1 L 5.0,12.1 L 5.0,12.2 L 4.9,12.3 L 4.9,12.4 L 4.9,12.4 L 4.9,12.6 L 4.8,12.6 L 4.8,12.7 L 4.8,12.8 L 4.8,12.9 L 4.7,13.0 L 4.7,13.1 L 4.6,13.2 L 4.6,13.3 L 4.6,13.4 L 4.6,13.6 L 4.5,13.6 L 4.5,13.8 L 4.4,13.9 L 4.4,14.1 L 4.4,14.2 L 4.4,14.4 L 4.3,14.5 L 4.3,14.9 L 4.3,14.9 L 4.3,15.5 L 4.2,15.6 L 4.2,16.4 L 4.3,16.4 L 4.3,17.0 L 4.3,17.1 L 4.3,17.5 L 4.4,17.5 L 4.4,17.8 L 4.4,17.8 L 4.4,18.0 L 4.5,18.1 L 4.5,18.3 L 4.6,18.3 L 4.6,18.5 L 4.6,18.5 L 4.6,18.7 L 4.7,18.7 L 4.7,18.8 L 4.8,18.9 L 4.8,19.0 L 4.8,19.0 L 4.8,19.2 L 4.9,19.2 L 4.9,19.3 L 4.9,19.3 L 4.9,19.5 L 5.0,19.5 L 5.0,19.6 L 5.1,19.6 L 5.1,19.7 L 5.1,19.8 L 5.1,19.8 L 5.2,19.9 L 5.2,20.0 L 5.3,20.1 L 5.3,20.1 L 5.4,20.2 L 5.4,20.3 L 5.5,20.4 L 5.5,20.5 L 5.6,20.5 L 5.6,20.6 L 5.7,20.7 L 5.7,20.8 L 5.9,21.0 L 5.9,21.0 L 6.1,21.3 L 6.1,21.3 L 6.6,21.8 L 6.6,21.9 L 6.7,22.0 L 6.8,22.0 L 7.2,22.4 L 7.3,22.4 L 7.6,22.7 L 7.6,22.7 L 7.8,22.9 L 7.9,22.9 L 8.0,23.0 L 8.1,23.0 L 8.2,23.1 L 8.2,23.1 L 8.3,23.2 L 8.4,23.2 L 8.5,23.3 L 8.5,23.3 L 8.6,23.4 L 8.7,23.4 L 8.7,23.4 L 8.8,23.4 L 8.9,23.5 L 8.9,23.5 L 9.0,23.6 L 9.0,23.6 L 9.1,23.6 L 9.2,23.6 L 9.2,23.7 L 9.3,23.7 L 9.4,23.8 L 9.4,23.8 L 9.5,23.8 L 9.6,23.8 L 9.7,23.9 L 9.7,23.9 L 9.8,23.9 L 9.9,23.9 L 10.0,24.0 L 9.9,23.9 L 9.9,23.9 L 9.7,23.8 L 9.7,23.8 L 9.5,23.6 L 9.4,23.6 L 9.2,23.4 L 9.1,23.4 L 8.5,22.8 L 8.5,22.8 L 8.3,22.5 L 8.3,22.4 L 8.2,22.3 L 8.2,22.3 L 8.1,22.1 L 8.1,22.1 L 8.0,22.0 L 8.0,21.9 L 7.9,21.8 L 7.9,21.7 L 7.8,21.6 L 7.8,21.6 L 7.7,21.5 L 7.7,21.5 L 7.7,21.4 L 7.7,21.3 L 7.6,21.2 L 7.6,21.0 L 7.6,21.0 L 7.6,20.8 L 7.5,20.7 L 7.5,20.2 L 7.4,20.1 L 7.4,19.7 L 7.5,19.6 L 7.5,19.2 L 7.6,19.2 L 7.6,19.0 L 7.6,18.9 L 7.6,18.7 L 7.7,18.7 L 7.7,18.5 L 7.7,18.5 L 7.7,18.4 L 7.8,18.3 L 7.8,18.2 L 7.9,18.2 L 7.9,18.1 L 8.0,18.0 L 8.0,17.9 L 8.1,17.8 L 8.1,17.8 L 8.2,17.7 L 8.2,17.6 L 8.4,17.4 L 8.4,17.3 L 8.5,17.2 L 8.5,17.2 L 8.6,17.0 L 8.6,17.0 L 8.7,16.8 L 8.7,16.8 L 8.8,16.7 L 8.8,16.7 L 8.9,16.5 L 8.9,16.5 L 9.0,16.4 L 9.0,16.4 L 9.0,16.3 L 9.0,16.2 L 9.1,16.2 L 9.1,16.1 L 9.2,16.0 L 9.2,16.0 L 9.2,15.9 L 9.2,15.8 L 9.3,15.7 L 9.3,15.6 L 9.4,15.5 L 9.4,15.3 L 9.4,15.2 L 9.4,15.1 L 9.5,15.0 L 9.5,15.1 L 9.5,15.2 L 9.6,15.2 L 9.6,15.3 L 9.7,15.4 L 9.7,15.5 L 9.7,15.5 L 9.7,15.7 L 9.8,15.7 L 9.8,16.0 L 9.9,16.1 L 9.9,16.7 L 9.8,16.7 L 9.8,17.2 L 9.7,17.2 L 9.7,17.4 L 9.7,17.5 L 9.7,17.7 L 9.6,17.8 L 9.6,17.9 L 9.5,18.0 L 9.5,18.2 L 9.5,18.2 L 9.5,18.3 L 9.4,18.4 L 9.4,18.6 L 9.4,18.7 L 9.4,19.0 L 9.4,19.1 L 9.4,19.2 L 9.7,19.5 L 9.7,19.5 L 9.8,19.5 L 9.9,19.5 L 9.9,19.6 L 10.4,19.6 L 10.5,19.5 L 10.5,19.5 L 10.6,19.5 L 10.7,19.5 L 10.7,19.4 L 10.8,19.4 L 10.8,19.3 L 11.0,19.2 L 11.0,19.1 L 11.0,19.0 L 11.0,18.9 L 11.1,18.8 L 11.1,17.8 L 11.0,17.8 L 11.0,17.3 L 11.0,17.3 L 11.0,16.9 L 10.9,16.8 L 10.9,16.5 L 10.8,16.4 L 10.8,16.0 L 10.8,16.0 L 10.8,15.6 L 10.7,15.5 L 10.7,14.3 L 10.8,14.2 L 10.8,13.9 L 10.8,13.8 L 10.8,13.6 L 10.9,13.6 L 10.9,13.4 L 11.0,13.3 L 11.0,13.2 L 11.0,13.1 L 11.0,13.0 L 11.1,12.9 L 11.1,12.8 L 11.2,12.7 L 11.2,12.6 L 11.2,12.6 L 11.2,12.5 L 11.3,12.4 L 11.3,12.4 L 11.3,12.3 L 11.3,12.2 L 11.4,12.2 L 11.4,12.1 L 11.5,12.0 L 11.5,11.9 L 11.7,11.8 L 11.7,11.8 L 11.8,11.6 L 11.8,11.5 L 12.0,11.4 L 12.0,11.4 L 12.0,11.5 L 12.0,11.6 L 12.0,11.6 L 11.9,11.7 L 11.9,11.8 L 11.8,11.8 L 11.8,11.9 L 11.8,12.0 L 11.8,12.2 L 11.7,12.2 L 11.7,12.4 L 11.7,12.5 L 11.7,12.9 L 11.6,12.9 L 11.6,13.9 L 11.7,14.0 L 11.7,14.4 L 11.7,14.4 L 11.7,14.7 L 11.8,14.7 L 11.8,14.9 L 11.8,14.9 L 11.8,15.1 L 11.9,15.2 L 11.9,15.2 L 12.0,15.3 L 12.0,15.4 L 12.0,15.5 L 12.0,15.5 L 12.1,15.6 L 12.1,15.7 L 12.2,15.7 L 12.2,15.8 L 12.2,15.9 L 12.2,15.9 L 12.3,16.0 L 12.3,16.1 L 12.5,16.2 L 12.5,16.3 L 13.0,16.8 L 13.0,16.8 L 13.2,16.9 L 13.2,16.9 L 13.3,17.0 L 13.3,17.0 L 13.4,17.0 L 13.5,17.0 L 13.5,17.1 L 13.6,17.1 L 13.7,17.2 L 13.8,17.2 L 13.9,17.2 L 14.4,17.2 L 14.5,17.2 L 14.6,17.2 L 14.6,17.1 L 14.8,17.1 L 14.9,17.0 L 15.0,17.0 L 15.1,16.8 L 15.1,16.7 L 15.3,16.6 L 15.3,16.5 L 15.3,16.5 L 15.3,16.4 L 15.4,16.4 L 15.4,16.2 L 15.5,16.2 L 15.5,15.5 L 15.4,15.5 L 15.4,15.4 L 15.3,15.3 L 15.3,15.2 L 15.4,15.2 L 15.5,15.3 L 15.5,15.4 L 15.8,15.7 L 15.8,15.7 L 15.9,15.9 L 15.9,15.9 L 16.1,16.0 L 16.1,16.1 L 16.1,16.2 L 16.1,16.2 L 16.2,16.3 L 16.2,16.4 L 16.3,16.4 L 16.3,16.5 L 16.3,16.5 L 16.3,16.6 L 16.4,16.7 L 16.4,16.8 L 16.4,16.8 L 16.4,16.9 L 16.5,17.0 L 16.5,17.1 L 16.6,17.2 L 16.6,17.3 L 16.6,17.4 L 16.6,17.6 L 16.7,17.7 L 16.7,18.0 L 16.8,18.0 L 16.8,19.7 L 16.7,19.8 L 16.7,20.1 L 16.6,20.1 L 16.6,20.4 L 16.6,20.5 L 16.6,20.6 L 16.5,20.7 L 16.5,20.8 L 16.4,20.9 L 16.4,21.0 L 16.4,21.1 L 16.4,21.2 L 16.3,21.3 L 16.3,21.4 L 16.3,21.5 L 16.3,21.5 L 16.2,21.6 L 16.2,21.7 L 16.1,21.8 L 16.1,21.8 L 16.1,21.9 L 16.1,21.9 L 16.0,22.0 L 16.0,22.1 L 15.9,22.1 L 15.9,22.2 L 15.8,22.3 L 15.8,22.4 L 15.8,22.4 L 15.8,22.5 L 15.6,22.6 L 15.6,22.7 L 15.5,22.8 L 15.5,22.9 L 15.3,23.1 L 15.3,23.2 L 14.6,23.9 L 14.5,23.9 L 14.4,24.0 L 14.5,23.9 L 14.6,23.9 L 14.6,23.9 L 14.7,23.9 L 14.8,23.8 L 14.9,23.8 L 15.0,23.8 L 15.0,23.8 L 15.1,23.7 L 15.1,23.7 L 15.2,23.6 L 15.3,23.6 L 15.4,23.6 L 15.5,23.6 L 15.5,23.5 L 15.6,23.5 L 15.6,23.4 L 15.7,23.4 L 15.8,23.3 L 15.9,23.3 L 15.9,23.3 L 16.0,23.3 L 16.1,23.2 L 16.1,23.2 L 16.3,23.1 L 16.3,23.1 L 16.4,22.9 L 16.5,22.9 L 16.6,22.8 L 16.7,22.8 L 16.9,22.6 L 16.9,22.6 L 17.2,22.4 L 17.3,22.4 L 18.1,21.6 L 18.1,21.5 L 18.4,21.2 L 18.4,21.1 L 18.5,21.0 L 18.5,21.0 L 18.6,20.8 L 18.6,20.8 L 18.7,20.6 L 18.7,20.6 L 18.8,20.5 L 18.8,20.5 L 18.9,20.3 L 18.9,20.3 L 19.0,20.2 L 19.0,20.1 L 19.1,20.1 L 19.1,20.0 L 19.1,20.0 L 19.1,19.9 L 19.2,19.8 L 19.2,19.7 L 19.2,19.6 L 19.2,19.6 L 19.3,19.5 L 19.3,19.4 L 19.4,19.3 L 19.4,19.3 L 19.4,19.2 L 19.4,19.0 L 19.5,19.0 L 19.5,18.8 L 19.6,18.8 L 19.6,18.6 L 19.6,18.5 L 19.6,18.3 L 19.7,18.3 L 19.7,18.0 L 19.7,17.9 L 19.7,17.4 L 19.8,17.3 L 19.8,16.4 L 19.7,16.4 L 19.7,15.9 L 19.7,15.8 L 19.7,15.5 L 19.6,15.5 L 19.6,15.2 L 19.6,15.2 L 19.6,15.0 L 19.5,14.9 L 19.5,14.8 L 19.4,14.7 L 19.4,14.6 L 19.4,14.5 L 19.4,14.4 L 19.3,14.4 L 19.3,14.3 L 19.2,14.2 L 19.2,14.1 L 19.2,14.1 L 19.2,14.0 L 19.1,13.9 L 19.1,13.9 L 19.1,13.8 L 19.1,13.7 L 19.0,13.7 L 19.0,13.6 L 18.9,13.5 L 18.9,13.4 L 18.8,13.4 L 18.8,13.3 L 18.7,13.2 L 18.7,13.1 L 18.6,13.1 L 18.6,13.0 L 18.5,12.9 L 18.5,12.8 L 18.4,12.7 L 18.4,12.6 L 18.2,12.5 L 18.2,12.4 L 18.1,12.2 L 18.1,12.2 L 17.9,12.1 L 17.9,12.0 L 17.8,11.8 L 17.8,11.8 L 17.6,11.6 L 17.6,11.5 L 17.3,11.3 L 17.3,11.2 L 17.1,11.0 L 17.1,10.9 L 16.8,10.6 L 16.8,10.6 L 16.6,10.3 L 16.6,10.3 L 16.3,9.9 L 16.3,9.9 L 16.1,9.7 L 16.1,9.6 L 15.8,9.4 L 15.8,9.3 L 15.7,9.2 L 15.7,9.1 L 15.6,9.0 L 15.6,9.0 L 15.5,8.8 L 15.5,8.8 L 15.3,8.6 L 15.3,8.6 L 15.3,8.5 L 15.3,8.5 L 15.1,8.3 L 15.1,8.3 L 15.1,8.2 L 15.1,8.1 L 15.0,8.0 L 15.0,8.0 L 15.0,7.9 L 15.0,7.8 L 14.9,7.7 L 14.9,7.5 L 14.8,7.5 L 14.8,7.3 L 14.8,7.4 L 14.8,7.5 L 14.8,7.6 L 14.7,7.6 L 14.7,7.9 L 14.6,8.0 L 14.6,8.2 L 14.6,8.3 L 14.6,9.0 L 14.5,9.1 L 14.5,9.2 L 14.6,9.3 L 14.6,10.0 L 14.6,10.1 L 14.6,10.4 L 14.7,10.4 L 14.7,10.7 L 14.8,10.8 L 14.8,10.9 L 14.8,11.0 L 14.8,11.2 L 14.9,11.3 L 14.9,11.4 L 15.0,11.5 L 15.0,11.7 L 15.0,11.8 L 15.0,11.9 L 15.1,11.9 L 15.1,12.1 L 15.1,12.2 L 15.1,12.4 L 15.2,12.4 L 15.2,12.8 L 15.3,12.9 L 15.3,13.1 L 15.2,13.2 L 15.2,13.4 L 15.1,13.5 L 15.1,13.6 L 15.1,13.7 L 15.1,13.7 L 14.8,14.1 L 14.7,14.1 L 14.6,14.1 L 14.1,14.1 L 14.0,14.1 L 14.0,14.1 L 13.9,14.0 L 13.8,14.0 L 13.4,13.6 L 13.4,13.5 L 13.3,13.4 L 13.3,13.3 L 13.2,13.2 L 13.2,13.2 L 13.2,13.1 L 13.2,13.0 L 13.1,12.9 L 13.1,12.7 L 13.0,12.7 L 13.0,12.4 L 13.0,12.4 L 13.0,11.9 L 12.9,11.9 L 12.9,11.0 L 13.0,10.9 L 13.0,10.3 L 13.0,10.3 L 13.0,9.9 L 13.1,9.9 L 13.1,9.6 L 13.2,9.5 L 13.2,9.3 L 13.2,9.2 L 13.2,9.0 L 13.3,9.0 L 13.3,8.8 L 13.3,8.7 L 13.3,8.5 L 13.4,8.5 L 13.4,8.3 L 13.5,8.2 L 13.5,8.0 L 13.5,8.0 L 13.5,7.8 L 13.6,7.8 L 13.6,7.6 L 13.6,7.5 L 13.6,7.4 L 13.7,7.3 L 13.7,7.2 L 13.8,7.2 L 13.8,7.0 L 13.8,6.9 L 13.8,6.7 L 13.9,6.7 L 13.9,6.4 L 14.0,6.3 L 14.0,6.0 L 14.0,6.0 L 14.0,4.5 L 14.0,4.4 L 14.0,4.0 L 13.9,4.0 L 13.9,3.7 L 13.8,3.7 L 13.8,3.4 L 13.8,3.4 L 13.8,3.2 L 13.7,3.2 L 13.7,3.0 L 13.6,3.0 L 13.6,2.9 L 13.6,2.8 L 13.6,2.7 L 13.5,2.6 L 13.5,2.5 L 13.5,2.4 L 13.5,2.4 L 13.4,2.3 L 13.4,2.2 L 13.3,2.2 L 13.3,2.1 L 13.3,2.0 L 13.3,1.9 L 13.2,1.8 L 13.2,1.7 L 13.1,1.7 L 13.1,1.6 L 13.0,1.6 L 13.0,1.5 L 12.9,1.4 L 12.9,1.3 L 12.8,1.2 L 12.8,1.1 L 12.7,1.0 L 12.7,0.9 L 12.4,0.7 L 12.4,0.6 L 11.8,0.0 L 11.7,0.0',
  key: 'M 23.5,2.6 L 22.7,2.0 L 21.8,1.9 L 20.2,2.8 L 19.4,2.0 L 18.3,1.7 L 16.6,2.3 L 15.9,3.4 L 16.0,4.9 L 16.8,6.0 L 18.1,6.5 L 17.2,6.8 L 17.1,7.5 L 16.2,7.4 L 16.1,8.5 L 5.5,18.1 L 5.2,17.7 L 6.5,16.5 L 5.9,15.9 L 5.4,16.1 L 5.2,15.9 L 5.4,15.4 L 4.1,14.0 L 3.0,15.0 L 3.9,16.0 L 3.5,16.5 L 2.5,15.5 L 1.6,16.3 L 2.5,17.3 L 2.0,17.8 L 1.1,16.8 L 0.0,17.7 L 1.3,19.2 L 1.7,19.0 L 2.0,19.3 L 1.7,19.7 L 2.3,20.4 L 3.6,19.2 L 3.9,19.5 L 2.7,20.7 L 2.8,21.0 L 2.0,21.3 L 2.0,22.2 L 3.1,22.3 L 3.4,21.5 L 3.6,21.7 L 17.0,9.3 L 17.9,9.4 L 18.0,8.5 L 18.7,8.5 L 19.1,7.5 L 19.4,8.8 L 20.4,9.8 L 21.9,10.0 L 23.1,9.4 L 23.8,7.8 L 23.7,6.7 L 22.9,5.8 L 23.6,5.2 L 24.0,4.3 L 24.0,3.4 L 23.5,2.6 M 17.2,2.9 L 18.0,2.6 L 18.4,2.6 L 19.0,2.8 L 19.5,3.4 L 19.7,4.2 L 20.8,4.2 L 20.8,3.7 L 21.0,3.3 L 21.5,2.9 L 22.2,2.8 L 22.5,2.9 L 22.8,3.2 L 23.1,3.7 L 23.0,4.3 L 22.6,4.9 L 22.2,5.1 L 21.6,5.1 L 21.5,6.1 L 22.4,6.4 L 22.7,6.8 L 22.9,7.2 L 22.9,8.0 L 22.5,8.7 L 21.8,9.1 L 21.2,9.1 L 20.6,8.9 L 20.1,8.4 L 20.0,8.0 L 19.9,7.5 L 20.3,6.6 L 20.1,6.4 L 20.6,6.3 L 20.9,5.9 L 20.8,5.3 L 20.4,4.9 L 20.1,4.8 L 19.6,4.9 L 19.5,5.1 L 19.4,5.6 L 19.1,5.3 L 18.6,5.6 L 17.9,5.6 L 17.4,5.4 L 17.1,5.1 L 16.7,4.5 L 16.7,3.9 L 16.9,3.3 L 17.2,2.9',
  book: 'M 23.1,6.3 L 23.1,6.2 L 23.0,6.2 L 23.0,6.2 L 22.9,6.2 L 22.8,6.2 L 22.5,6.2 L 22.5,6.2 L 22.1,6.2 L 22.0,6.2 L 21.7,6.2 L 21.7,6.2 L 21.4,6.2 L 21.4,6.1 L 21.1,6.1 L 20.4,5.2 L 20.3,5.1 L 20.2,5.1 L 20.2,5.1 L 20.1,5.1 L 20.1,5.0 L 20.0,5.0 L 20.0,5.0 L 19.9,5.0 L 19.9,5.0 L 19.8,5.0 L 19.8,5.0 L 19.7,5.0 L 19.7,5.0 L 19.6,5.0 L 19.6,5.0 L 19.6,5.0 L 19.5,4.9 L 19.4,4.9 L 19.4,4.9 L 19.2,4.9 L 19.1,4.9 L 19.1,4.9 L 19.1,4.9 L 18.9,4.9 L 18.9,4.8 L 18.8,4.8 L 18.8,4.8 L 18.6,4.8 L 18.6,4.8 L 18.5,4.8 L 18.5,4.8 L 18.2,4.8 L 18.2,4.8 L 18.1,4.8 L 18.1,4.7 L 18.0,4.7 L 18.0,4.7 L 17.8,4.7 L 17.8,4.7 L 17.7,4.7 L 17.7,4.7 L 17.5,4.7 L 17.5,4.7 L 17.4,4.7 L 17.4,4.7 L 17.0,4.7 L 17.0,4.6 L 16.4,4.6 L 16.4,4.6 L 15.3,4.6 L 15.3,4.6 L 15.1,4.6 L 15.1,4.7 L 14.9,4.7 L 14.9,4.7 L 14.8,4.7 L 14.7,4.7 L 14.5,4.7 L 14.5,4.7 L 14.3,4.7 L 14.3,4.8 L 14.2,4.8 L 14.2,4.8 L 14.1,4.8 L 14.1,4.8 L 14.0,4.8 L 13.9,4.8 L 13.9,4.8 L 13.9,4.8 L 13.8,4.8 L 13.7,4.9 L 13.6,4.9 L 13.6,4.9 L 13.5,4.9 L 13.5,4.9 L 13.4,5.0 L 13.3,5.0 L 13.2,5.0 L 13.1,5.1 L 13.1,5.1 L 13.0,5.2 L 12.8,5.2 L 12.8,5.3 L 12.7,5.3 L 12.4,5.5 L 12.4,5.5 L 12.1,5.8 L 12.1,5.8 L 12.0,6.0 L 11.8,5.9 L 11.8,5.8 L 11.6,5.6 L 11.6,5.6 L 11.5,5.5 L 11.5,5.5 L 11.3,5.3 L 11.0,5.2 L 10.8,5.1 L 10.8,5.1 L 10.6,5.0 L 10.6,5.0 L 10.3,4.9 L 10.3,4.9 L 10.2,4.9 L 10.2,4.9 L 10.1,4.8 L 10.0,4.8 L 10.0,4.8 L 9.7,4.8 L 9.7,4.8 L 9.5,4.7 L 9.5,4.7 L 9.4,4.7 L 9.4,4.7 L 9.3,4.7 L 9.3,4.7 L 9.1,4.7 L 9.1,4.7 L 8.9,4.7 L 8.9,4.7 L 8.6,4.7 L 8.6,4.6 L 7.4,4.6 L 7.4,4.7 L 7.1,4.7 L 7.1,4.7 L 6.8,4.7 L 6.8,4.7 L 6.4,4.7 L 6.4,4.7 L 6.3,4.7 L 6.3,4.7 L 6.1,4.7 L 6.1,4.8 L 6.0,4.8 L 6.0,4.8 L 5.7,4.8 L 5.7,4.8 L 5.6,4.8 L 5.6,4.8 L 5.5,4.8 L 5.5,4.8 L 5.3,4.8 L 5.3,4.8 L 5.2,4.8 L 5.2,4.9 L 5.1,4.9 L 5.1,4.9 L 5.0,4.9 L 5.0,4.9 L 4.9,4.9 L 4.9,4.9 L 4.8,4.9 L 4.8,4.9 L 4.6,4.9 L 4.6,5.0 L 4.5,5.0 L 4.5,5.0 L 4.5,5.0 L 4.4,5.0 L 4.3,5.0 L 4.2,5.0 L 4.1,5.0 L 4.1,5.1 L 4.0,5.1 L 4.0,5.1 L 3.9,5.1 L 3.8,5.1 L 3.7,5.1 L 3.7,5.1 L 3.6,5.1 L 3.6,5.2 L 3.5,5.3 L 3.4,5.4 L 3.4,5.5 L 3.3,5.5 L 3.3,5.6 L 3.2,5.7 L 3.0,6.0 L 2.9,6.2 L 2.9,6.2 L 2.8,6.3 L 2.7,6.3 L 2.7,6.3 L 2.5,6.3 L 2.4,6.3 L 2.2,6.3 L 2.2,6.3 L 1.8,6.3 L 1.8,6.3 L 1.1,6.4 L 1.1,6.4 L 0.9,6.4 L 0.9,6.4 L 0.9,6.4 L 0.8,6.4 L 0.8,6.5 L 0.8,6.5 L 0.8,6.9 L 0.8,6.9 L 0.8,7.1 L 0.8,7.1 L 0.8,7.3 L 0.8,7.3 L 0.8,7.5 L 0.7,7.6 L 0.7,7.8 L 0.7,7.8 L 0.7,8.1 L 0.7,8.1 L 0.7,8.3 L 0.7,8.3 L 0.7,8.6 L 0.7,8.6 L 0.7,8.8 L 0.7,8.8 L 0.7,9.1 L 0.6,9.1 L 0.6,9.3 L 0.6,9.3 L 0.6,9.6 L 0.6,9.6 L 0.6,9.8 L 0.6,9.8 L 0.6,10.0 L 0.6,10.1 L 0.6,10.3 L 0.6,10.3 L 0.5,10.8 L 0.5,10.8 L 0.5,11.0 L 0.5,11.0 L 0.5,11.2 L 0.5,11.3 L 0.5,11.5 L 0.5,11.5 L 0.5,11.7 L 0.5,11.8 L 0.5,12.0 L 0.4,12.0 L 0.4,12.2 L 0.4,12.3 L 0.4,12.5 L 0.4,12.5 L 0.4,12.7 L 0.4,12.8 L 0.4,13.0 L 0.4,13.0 L 0.4,13.5 L 0.3,13.5 L 0.3,14.0 L 0.3,14.0 L 0.3,14.2 L 0.3,14.2 L 0.3,14.4 L 0.3,14.4 L 0.3,14.7 L 0.3,14.7 L 0.3,14.9 L 0.2,15.0 L 0.2,15.2 L 0.2,15.2 L 0.2,15.7 L 0.2,15.7 L 0.2,15.9 L 0.2,15.9 L 0.2,16.1 L 0.2,16.2 L 0.2,16.4 L 0.1,16.4 L 0.1,16.7 L 0.1,16.7 L 0.1,17.1 L 0.1,17.2 L 0.1,17.6 L 0.1,17.6 L 0.1,17.9 L 0.0,17.9 L 0.0,18.3 L 0.0,18.4 L 0.0,18.6 L 1.8e-15,18.6 L 1.8e-15,18.7 L 0.0,18.8 L 0.0,18.8 L 0.1,18.8 L 0.1,19.1 L 0.2,19.1 L 0.2,19.1 L 0.3,19.3 L 0.3,19.4 L 0.4,19.4 L 0.4,19.4 L 0.7,19.4 L 0.7,19.3 L 1.3,19.3 L 1.3,19.3 L 1.8,19.3 L 1.8,19.3 L 2.1,19.3 L 2.1,19.3 L 2.3,19.3 L 2.3,19.2 L 2.6,19.2 L 2.6,19.2 L 2.8,19.2 L 2.8,19.2 L 3.1,19.2 L 3.1,19.2 L 3.6,19.2 L 3.6,19.2 L 3.8,19.2 L 3.8,19.2 L 4.1,19.2 L 4.1,19.1 L 4.3,19.1 L 4.4,19.1 L 4.8,19.1 L 4.8,19.1 L 5.0,19.1 L 5.1,19.1 L 5.6,19.1 L 5.6,19.0 L 5.8,19.0 L 5.8,19.0 L 6.1,19.0 L 6.1,19.0 L 6.3,19.0 L 6.3,19.0 L 6.5,19.0 L 6.6,19.0 L 6.8,19.0 L 6.8,19.0 L 7.0,19.0 L 7.1,18.9 L 7.3,18.9 L 7.3,18.9 L 7.5,18.9 L 7.6,18.9 L 7.8,18.9 L 7.8,18.9 L 8.0,18.9 L 8.1,18.9 L 8.3,18.9 L 8.3,18.9 L 8.8,18.8 L 8.8,18.8 L 9.3,18.8 L 9.3,18.8 L 9.5,18.8 L 9.5,18.8 L 9.7,18.8 L 9.7,18.8 L 9.9,18.8 L 10.5,19.0 L 10.5,19.0 L 10.7,19.0 L 10.7,19.0 L 10.7,19.0 L 10.8,19.0 L 10.9,19.1 L 11.0,19.1 L 11.0,19.1 L 11.2,19.1 L 11.2,19.1 L 11.3,19.2 L 11.3,19.2 L 11.5,19.2 L 11.5,19.2 L 11.7,19.2 L 11.7,19.2 L 11.8,19.2 L 11.8,19.2 L 12.4,19.2 L 12.4,19.2 L 12.6,19.2 L 12.6,19.2 L 12.8,19.2 L 12.8,19.2 L 13.0,19.1 L 13.1,19.1 L 13.2,19.1 L 13.2,19.1 L 13.3,19.1 L 13.3,19.0 L 13.4,19.0 L 13.4,19.0 L 13.6,19.0 L 13.6,18.9 L 13.7,18.9 L 13.7,18.9 L 13.8,18.9 L 13.8,18.9 L 13.8,18.9 L 13.9,18.8 L 14.0,18.8 L 14.1,18.8 L 14.1,18.8 L 14.1,18.8 L 14.4,18.8 L 14.5,18.8 L 15.0,18.8 L 15.0,18.8 L 15.2,18.8 L 15.2,18.8 L 15.5,18.8 L 15.5,18.8 L 15.8,18.8 L 15.8,18.9 L 16.1,18.9 L 16.1,18.9 L 16.3,18.9 L 16.3,18.9 L 16.6,18.9 L 16.6,18.9 L 16.8,18.9 L 16.8,18.9 L 17.1,18.9 L 17.1,18.9 L 17.4,18.9 L 17.4,19.0 L 17.7,19.0 L 17.7,19.0 L 17.9,19.0 L 17.9,19.0 L 18.2,19.0 L 18.2,19.0 L 18.8,19.0 L 18.8,19.0 L 19.0,19.0 L 19.0,19.1 L 19.3,19.1 L 19.3,19.1 L 19.5,19.1 L 19.6,19.1 L 19.8,19.1 L 19.8,19.1 L 20.1,19.1 L 20.1,19.1 L 20.4,19.1 L 20.4,19.1 L 20.9,19.2 L 20.9,19.2 L 21.2,19.2 L 21.2,19.2 L 21.5,19.2 L 21.5,19.2 L 22.0,19.2 L 22.0,19.2 L 22.3,19.2 L 22.3,19.2 L 22.5,19.2 L 22.6,19.3 L 22.8,19.3 L 22.8,19.3 L 23.1,19.3 L 23.1,19.3 L 23.6,19.3 L 23.6,19.3 L 23.7,19.3 L 23.8,19.2 L 23.8,19.2 L 23.9,19.0 L 23.9,18.9 L 23.9,18.8 L 24.0,18.7 L 24.0,18.7 L 24.0,18.5 L 24.0,18.5 L 24.0,18.3 L 24.0,18.3 L 24.0,18.0 L 24.0,18.0 L 24.0,17.8 L 23.9,17.8 L 23.9,17.6 L 23.9,17.6 L 23.9,17.3 L 23.9,17.3 L 23.9,16.9 L 23.9,16.9 L 23.9,16.7 L 23.9,16.7 L 23.8,16.2 L 23.8,16.2 L 23.8,16.0 L 23.8,16.0 L 23.8,15.8 L 23.8,15.8 L 23.8,15.5 L 23.8,15.5 L 23.8,15.3 L 23.8,15.3 L 23.8,15.1 L 23.7,15.1 L 23.7,14.8 L 23.7,14.8 L 23.7,14.6 L 23.7,14.6 L 23.7,14.4 L 23.7,14.4 L 23.7,14.1 L 23.7,14.1 L 23.7,13.9 L 23.7,13.9 L 23.7,13.7 L 23.6,13.6 L 23.6,13.4 L 23.6,13.4 L 23.6,13.2 L 23.6,13.2 L 23.6,13.0 L 23.6,12.9 L 23.6,12.7 L 23.6,12.7 L 23.6,12.5 L 23.6,12.5 L 23.6,12.3 L 23.5,12.2 L 23.5,12.0 L 23.5,12.0 L 23.5,11.8 L 23.5,11.8 L 23.5,11.6 L 23.5,11.5 L 23.5,11.3 L 23.5,11.3 L 23.5,11.1 L 23.5,11.1 L 23.5,10.8 L 23.4,10.8 L 23.4,10.6 L 23.4,10.6 L 23.4,10.4 L 23.4,10.4 L 23.4,10.1 L 23.4,10.1 L 23.4,9.9 L 23.4,9.9 L 23.4,9.4 L 23.3,9.4 L 23.3,9.2 L 23.3,9.2 L 23.3,9.0 L 23.3,8.9 L 23.3,8.7 L 23.3,8.7 L 23.3,8.5 L 23.3,8.5 L 23.3,8.2 L 23.3,8.2 L 23.3,8.0 L 23.2,8.0 L 23.2,7.8 L 23.2,7.8 L 23.2,7.6 L 23.2,7.6 L 23.2,7.3 L 23.2,7.3 L 23.2,7.1 L 23.2,7.1 L 23.2,6.7 L 23.1,6.7 L 23.1,6.5 L 23.1,6.5 L 23.1,6.3 L 23.1,6.3 L 23.1,6.3 M 3.4,16.8 L 3.8,16.0 L 3.9,15.9 L 4.1,15.9 L 4.1,15.9 L 4.2,15.9 L 4.2,15.9 L 4.3,15.9 L 4.3,15.9 L 4.5,15.9 L 4.5,15.8 L 4.6,15.8 L 4.6,15.8 L 4.7,15.8 L 4.7,15.8 L 4.8,15.8 L 4.8,15.8 L 4.9,15.8 L 4.9,15.8 L 5.0,15.8 L 5.1,15.8 L 5.4,15.7 L 5.4,15.7 L 5.5,15.7 L 5.6,15.7 L 5.8,15.7 L 5.8,15.7 L 6.0,15.7 L 6.0,15.6 L 6.1,15.6 L 6.1,15.6 L 6.5,15.6 L 6.5,15.6 L 6.7,15.6 L 6.7,15.6 L 6.9,15.6 L 6.9,15.6 L 7.3,15.6 L 7.3,15.6 L 8.6,15.6 L 8.6,15.6 L 9.0,15.6 L 9.0,15.6 L 9.3,15.6 L 9.3,15.6 L 9.4,15.6 L 9.4,15.6 L 9.6,15.7 L 9.6,15.7 L 9.8,15.7 L 9.8,15.7 L 9.8,15.7 L 9.8,15.7 L 10.1,15.8 L 10.1,15.8 L 10.3,15.8 L 10.4,15.9 L 10.5,15.9 L 10.7,16.0 L 10.9,16.2 L 11.1,16.4 L 11.4,16.7 L 11.4,16.7 L 11.3,16.7 L 11.3,16.7 L 11.3,16.7 L 11.2,16.7 L 11.2,16.7 L 11.1,16.6 L 11.0,16.6 L 10.8,16.5 L 10.6,16.3 L 10.4,16.3 L 10.4,16.3 L 10.2,16.3 L 10.2,16.3 L 9.9,16.3 L 9.9,16.4 L 9.7,16.4 L 9.7,16.4 L 9.2,16.4 L 9.2,16.4 L 9.0,16.4 L 9.0,16.4 L 8.7,16.4 L 8.7,16.4 L 8.5,16.4 L 8.5,16.5 L 8.2,16.5 L 8.2,16.5 L 8.0,16.5 L 8.0,16.5 L 7.7,16.5 L 7.7,16.5 L 7.5,16.5 L 7.5,16.5 L 7.3,16.5 L 7.3,16.5 L 6.8,16.6 L 6.8,16.6 L 6.6,16.6 L 6.6,16.6 L 6.3,16.6 L 6.3,16.6 L 6.1,16.6 L 6.1,16.6 L 5.9,16.6 L 5.8,16.6 L 5.6,16.6 L 5.6,16.7 L 5.4,16.7 L 5.4,16.7 L 5.2,16.7 L 5.2,16.7 L 4.9,16.7 L 4.9,16.7 L 4.5,16.7 L 4.5,16.7 L 4.3,16.7 L 4.2,16.8 L 4.0,16.8 L 4.0,16.8 L 3.7,16.8 L 3.7,16.8 L 3.4,16.8 L 3.4,16.8 M 12.5,16.8 L 12.5,16.7 L 12.7,16.5 L 12.8,16.4 L 12.8,16.4 L 13.0,16.2 L 13.3,16.0 L 13.3,16.0 L 13.4,16.0 L 13.6,15.9 L 13.8,15.8 L 13.9,15.8 L 14.0,15.8 L 14.0,15.7 L 14.1,15.7 L 14.1,15.7 L 14.2,15.7 L 14.2,15.7 L 14.3,15.7 L 14.3,15.7 L 14.4,15.7 L 14.4,15.6 L 14.5,15.6 L 14.5,15.6 L 14.6,15.6 L 14.6,15.6 L 14.7,15.6 L 14.7,15.6 L 15.0,15.6 L 15.0,15.6 L 15.1,15.6 L 15.1,15.6 L 15.3,15.6 L 15.3,15.5 L 15.7,15.5 L 15.7,15.5 L 16.4,15.5 L 16.4,15.5 L 16.8,15.5 L 16.8,15.6 L 17.1,15.6 L 17.1,15.6 L 17.3,15.6 L 17.3,15.6 L 17.6,15.6 L 17.6,15.6 L 17.7,15.6 L 17.8,15.6 L 18.1,15.6 L 18.1,15.6 L 18.2,15.6 L 18.3,15.7 L 18.4,15.7 L 18.4,15.7 L 18.5,15.7 L 18.5,15.7 L 18.8,15.7 L 18.8,15.7 L 18.9,15.7 L 18.9,15.7 L 19.2,15.8 L 19.3,15.8 L 19.5,15.8 L 19.5,15.8 L 19.6,15.8 L 19.6,15.8 L 19.7,15.8 L 19.7,15.9 L 19.8,15.9 L 19.8,15.9 L 19.9,15.9 L 19.9,15.9 L 20.0,15.9 L 20.0,15.9 L 20.1,15.9 L 20.1,15.9 L 20.2,15.9 L 20.7,16.7 L 20.7,16.8 L 20.5,16.8 L 20.5,16.7 L 20.3,16.7 L 20.3,16.7 L 20.0,16.7 L 20.0,16.7 L 19.7,16.7 L 19.7,16.7 L 19.5,16.7 L 19.5,16.7 L 19.2,16.7 L 19.2,16.7 L 19.0,16.7 L 19.0,16.6 L 18.5,16.6 L 18.5,16.6 L 18.2,16.6 L 18.2,16.6 L 18.0,16.6 L 17.9,16.6 L 17.7,16.6 L 17.7,16.6 L 17.2,16.5 L 17.2,16.5 L 17.0,16.5 L 17.0,16.5 L 16.7,16.5 L 16.7,16.5 L 16.5,16.5 L 16.4,16.5 L 16.2,16.5 L 16.2,16.5 L 15.9,16.5 L 15.9,16.4 L 15.7,16.4 L 15.7,16.4 L 15.4,16.4 L 15.4,16.4 L 15.2,16.4 L 15.2,16.4 L 14.7,16.4 L 14.7,16.4 L 14.5,16.4 L 14.4,16.3 L 14.2,16.3 L 14.2,16.3 L 13.9,16.3 L 13.9,16.3 L 13.7,16.3 L 13.7,16.3 L 13.5,16.3 L 13.4,16.4 L 13.3,16.4 L 12.9,16.7 L 12.9,16.7 L 12.9,16.7 L 12.8,16.7 L 12.8,16.7 L 12.7,16.7 L 12.6,16.8 L 12.6,16.8 L 12.5,16.8 M 2.0,7.7 L 2.0,7.7 L 2.0,7.8 L 2.0,7.8 L 2.0,8.1 L 2.0,8.1 L 2.0,8.3 L 2.0,8.4 L 2.0,8.6 L 2.0,8.6 L 2.0,8.9 L 1.9,8.9 L 1.9,9.2 L 1.9,9.2 L 1.9,9.7 L 1.9,9.8 L 1.9,10.0 L 1.9,10.0 L 1.9,10.3 L 1.9,10.3 L 1.9,10.6 L 1.8,10.6 L 1.8,10.8 L 1.8,10.8 L 1.8,11.1 L 1.8,11.1 L 1.8,11.4 L 1.8,11.4 L 1.8,11.7 L 1.8,11.7 L 1.8,11.9 L 1.8,11.9 L 1.7,12.5 L 1.7,12.5 L 1.7,13.0 L 1.7,13.0 L 1.7,13.3 L 1.7,13.3 L 1.7,13.8 L 1.6,13.9 L 1.6,14.1 L 1.6,14.1 L 1.6,14.4 L 1.6,14.4 L 1.6,14.7 L 1.6,14.7 L 1.6,15.0 L 1.6,15.0 L 1.6,15.2 L 1.6,15.3 L 1.6,15.6 L 1.5,15.6 L 1.5,15.9 L 1.5,15.9 L 1.5,16.1 L 1.5,16.1 L 1.5,16.4 L 1.5,16.4 L 1.5,16.7 L 1.5,16.7 L 1.5,16.9 L 1.5,16.9 L 1.5,17.3 L 1.4,17.3 L 1.4,17.5 L 1.5,17.5 L 1.5,17.5 L 1.6,17.8 L 1.6,18.0 L 1.6,18.0 L 1.6,18.0 L 1.4,18.0 L 1.4,18.0 L 1.2,18.0 L 1.2,18.1 L 1.0,18.1 L 1.0,18.0 L 1.0,17.9 L 1.0,17.9 L 1.1,17.4 L 1.1,17.4 L 1.1,17.1 L 1.1,17.1 L 1.1,16.9 L 1.1,16.8 L 1.1,16.6 L 1.1,16.6 L 1.1,16.1 L 1.2,16.1 L 1.2,15.8 L 1.2,15.8 L 1.2,15.2 L 1.2,15.2 L 1.2,15.0 L 1.2,15.0 L 1.2,14.7 L 1.2,14.7 L 1.2,14.4 L 1.2,14.4 L 1.2,14.2 L 1.3,14.2 L 1.3,13.9 L 1.3,13.9 L 1.3,13.7 L 1.3,13.6 L 1.3,13.4 L 1.3,13.4 L 1.3,13.1 L 1.3,13.1 L 1.3,12.9 L 1.3,12.8 L 1.3,12.6 L 1.4,12.6 L 1.4,12.3 L 1.4,12.3 L 1.4,12.0 L 1.4,12.0 L 1.4,11.8 L 1.4,11.7 L 1.4,11.5 L 1.4,11.5 L 1.4,11.0 L 1.5,10.9 L 1.5,10.7 L 1.5,10.7 L 1.5,10.5 L 1.5,10.4 L 1.5,10.2 L 1.5,10.2 L 1.5,9.9 L 1.5,9.9 L 1.5,9.7 L 1.5,9.6 L 1.5,9.4 L 1.6,9.4 L 1.6,9.1 L 1.6,9.1 L 1.6,8.8 L 1.6,8.8 L 1.6,8.6 L 1.6,8.6 L 1.6,8.3 L 1.6,8.3 L 1.6,7.8 L 1.7,7.8 L 1.7,7.7 L 1.7,7.7 L 2.0,7.7 M 22.0,7.5 L 22.3,7.5 L 22.3,7.6 L 22.3,8.0 L 22.3,8.0 L 22.3,8.3 L 22.4,8.3 L 22.4,8.5 L 22.4,8.5 L 22.4,8.8 L 22.4,8.8 L 22.4,9.0 L 22.4,9.1 L 22.4,9.3 L 22.4,9.3 L 22.4,9.8 L 22.5,9.8 L 22.5,10.0 L 22.5,10.1 L 22.5,10.3 L 22.5,10.3 L 22.5,10.6 L 22.5,10.6 L 22.5,10.8 L 22.5,10.8 L 22.5,11.1 L 22.5,11.1 L 22.5,11.3 L 22.6,11.4 L 22.6,11.6 L 22.6,11.6 L 22.6,11.9 L 22.6,11.9 L 22.6,12.1 L 22.6,12.1 L 22.6,12.4 L 22.6,12.4 L 22.6,12.6 L 22.6,12.6 L 22.6,12.9 L 22.7,12.9 L 22.7,13.1 L 22.7,13.2 L 22.7,13.4 L 22.7,13.4 L 22.7,13.6 L 22.7,13.6 L 22.7,14.1 L 22.7,14.1 L 22.8,14.6 L 22.8,14.6 L 22.8,14.9 L 22.8,14.9 L 22.8,15.1 L 22.8,15.1 L 22.8,15.4 L 22.8,15.4 L 22.8,15.6 L 22.8,15.6 L 22.8,15.9 L 22.8,15.9 L 22.8,16.1 L 22.9,16.2 L 22.9,16.4 L 22.9,16.4 L 22.9,16.6 L 22.9,16.7 L 22.9,16.9 L 22.9,16.9 L 22.9,17.1 L 22.9,17.1 L 22.9,17.7 L 23.0,17.7 L 23.0,17.9 L 23.0,17.9 L 23.0,18.0 L 23.0,18.0 L 22.9,18.0 L 22.9,18.0 L 22.6,18.0 L 22.6,18.0 L 22.4,18.0 L 22.4,18.0 L 22.4,17.9 L 22.4,17.9 L 22.4,17.8 L 22.4,17.7 L 22.4,17.7 L 22.5,17.6 L 22.5,17.5 L 22.5,17.5 L 22.6,17.3 L 22.5,17.3 L 22.5,17.1 L 22.5,17.1 L 22.5,16.9 L 22.5,16.9 L 22.5,16.6 L 22.5,16.6 L 22.5,16.4 L 22.5,16.3 L 22.5,16.1 L 22.5,16.1 L 22.5,15.8 L 22.4,15.8 L 22.4,15.6 L 22.4,15.6 L 22.4,15.3 L 22.4,15.3 L 22.4,15.0 L 22.4,15.0 L 22.4,14.8 L 22.4,14.7 L 22.4,14.5 L 22.4,14.5 L 22.4,14.2 L 22.3,14.2 L 22.3,13.7 L 22.3,13.7 L 22.3,13.5 L 22.3,13.5 L 22.3,13.2 L 22.3,13.2 L 22.3,13.0 L 22.3,13.0 L 22.3,12.7 L 22.2,12.7 L 22.2,12.5 L 22.2,12.4 L 22.2,12.2 L 22.2,12.2 L 22.2,11.9 L 22.2,11.9 L 22.2,11.7 L 22.2,11.6 L 22.2,11.4 L 22.2,11.4 L 22.2,11.1 L 22.1,11.1 L 22.1,10.9 L 22.1,10.8 L 22.1,10.6 L 22.1,10.6 L 22.1,10.3 L 22.1,10.3 L 22.1,10.1 L 22.1,10.0 L 22.1,9.8 L 22.1,9.8 L 22.1,9.5 L 22.0,9.5 L 22.0,9.3 L 22.0,9.2 L 22.0,9.0 L 22.0,9.0 L 22.0,8.5 L 22.0,8.5 L 22.0,8.2 L 22.0,8.2 L 22.0,7.9 L 21.9,7.9 L 21.9,7.7 L 21.9,7.6 L 21.9,7.6 L 22.0,7.5 M 20.4,7.3 L 20.5,7.5 L 20.5,7.5 L 20.6,7.6 L 20.7,7.7 L 20.8,7.9 L 20.9,8.0 L 20.9,8.0 L 20.9,8.1 L 21.1,8.3 L 21.1,8.4 L 21.1,8.4 L 21.1,8.7 L 21.1,8.7 L 21.1,9.0 L 21.1,9.0 L 21.1,9.3 L 21.2,9.3 L 21.2,9.5 L 21.2,9.5 L 21.2,9.8 L 21.2,9.8 L 21.2,10.1 L 21.2,10.1 L 21.2,10.4 L 21.2,10.4 L 21.2,10.7 L 21.2,10.7 L 21.2,11.0 L 21.3,11.0 L 21.3,11.2 L 21.3,11.3 L 21.3,11.8 L 21.3,11.8 L 21.3,12.4 L 21.3,12.4 L 21.3,12.7 L 21.4,12.7 L 21.4,13.3 L 21.4,13.3 L 21.4,13.6 L 21.4,13.6 L 21.4,13.9 L 21.4,13.9 L 21.4,14.5 L 21.5,14.5 L 21.5,15.0 L 21.5,15.0 L 21.5,15.2 L 21.5,15.3 L 21.5,15.6 L 21.5,15.6 L 21.5,15.7 L 21.5,15.7 L 21.4,15.6 L 21.3,15.5 L 21.3,15.4 L 21.2,15.3 L 21.2,15.3 L 21.1,15.1 L 21.0,15.1 L 20.9,14.9 L 20.8,14.7 L 20.8,14.6 L 20.8,14.6 L 20.7,14.1 L 20.7,14.1 L 20.7,13.8 L 20.7,13.8 L 20.7,13.5 L 20.7,13.5 L 20.7,13.2 L 20.7,13.2 L 20.7,12.9 L 20.7,12.8 L 20.7,12.5 L 20.6,12.5 L 20.6,12.2 L 20.6,12.2 L 20.6,11.9 L 20.6,11.9 L 20.6,11.6 L 20.6,11.6 L 20.6,11.3 L 20.6,11.3 L 20.6,11.0 L 20.6,11.0 L 20.5,10.4 L 20.5,10.4 L 20.5,10.1 L 20.5,10.1 L 20.5,9.8 L 20.5,9.7 L 20.5,9.5 L 20.5,9.4 L 20.5,9.1 L 20.5,9.1 L 20.4,8.5 L 20.4,8.5 L 20.4,8.2 L 20.4,8.2 L 20.4,7.9 L 20.4,7.9 L 20.4,7.6 L 20.4,7.6 L 20.4,7.3 L 20.4,7.3 M 3.6,7.3 L 3.6,7.3 L 3.6,7.4 L 3.6,7.4 L 3.6,8.0 L 3.5,8.0 L 3.5,8.7 L 3.5,8.7 L 3.5,9.0 L 3.5,9.0 L 3.5,9.3 L 3.5,9.3 L 3.5,9.6 L 3.5,9.7 L 3.5,10.0 L 3.4,10.0 L 3.4,10.3 L 3.4,10.3 L 3.4,10.6 L 3.4,10.7 L 3.4,10.9 L 3.4,11.0 L 3.4,11.3 L 3.4,11.3 L 3.4,11.6 L 3.4,11.6 L 3.4,11.9 L 3.3,12.0 L 3.3,12.3 L 3.3,12.3 L 3.3,12.6 L 3.3,12.6 L 3.3,13.3 L 3.3,13.3 L 3.3,13.6 L 3.3,13.6 L 3.3,13.9 L 3.2,13.9 L 3.2,14.2 L 3.2,14.3 L 3.2,14.8 L 2.7,15.6 L 2.5,15.8 L 2.5,15.8 L 2.5,15.2 L 2.5,15.2 L 2.5,14.9 L 2.5,14.9 L 2.5,14.4 L 2.6,14.4 L 2.6,14.1 L 2.6,14.0 L 2.6,13.8 L 2.6,13.7 L 2.6,13.5 L 2.6,13.4 L 2.6,13.2 L 2.6,13.2 L 2.6,12.9 L 2.6,12.9 L 2.6,12.5 L 2.7,12.5 L 2.7,12.2 L 2.7,12.2 L 2.7,11.9 L 2.7,11.9 L 2.7,11.6 L 2.7,11.6 L 2.7,11.3 L 2.7,11.3 L 2.7,11.0 L 2.7,11.0 L 2.7,10.7 L 2.8,10.7 L 2.8,10.4 L 2.8,10.4 L 2.8,10.1 L 2.8,10.1 L 2.8,9.8 L 2.8,9.8 L 2.8,9.5 L 2.8,9.4 L 2.8,9.2 L 2.8,9.1 L 2.8,8.9 L 2.9,8.9 L 2.9,8.3 L 2.9,8.3 L 2.9,8.2 L 2.9,8.2 L 3.0,8.0 L 3.1,8.0 L 3.1,7.9 L 3.2,7.9 L 3.3,7.7 L 3.3,7.7 L 3.3,7.6 L 3.4,7.6 L 3.5,7.4 L 3.6,7.3 M 4.5,6.4 L 4.6,6.4 L 4.7,6.4 L 4.7,6.3 L 4.8,6.3 L 4.8,6.3 L 4.8,6.3 L 4.9,6.3 L 5.0,6.3 L 5.0,6.3 L 5.0,6.3 L 5.1,6.3 L 5.1,6.3 L 5.2,6.3 L 5.2,6.3 L 5.3,6.2 L 5.3,6.2 L 5.4,6.2 L 5.5,6.2 L 5.5,6.2 L 5.6,6.2 L 5.6,6.2 L 5.8,6.2 L 5.8,6.2 L 6.0,6.1 L 6.1,6.1 L 6.2,6.1 L 6.2,6.1 L 6.3,6.1 L 6.3,6.1 L 6.7,6.1 L 6.7,6.1 L 6.9,6.1 L 6.9,6.0 L 7.3,6.0 L 7.4,6.0 L 8.8,6.0 L 8.8,6.0 L 9.2,6.0 L 9.2,6.0 L 9.4,6.1 L 9.4,6.1 L 9.5,6.1 L 9.5,6.1 L 9.7,6.1 L 9.8,6.1 L 9.8,6.1 L 9.8,6.2 L 10.0,6.2 L 10.1,6.2 L 10.1,6.2 L 10.2,6.2 L 10.3,6.3 L 10.5,6.4 L 10.5,6.4 L 10.9,6.6 L 11.0,6.7 L 11.3,6.9 L 11.4,7.1 L 11.5,7.4 L 11.5,7.4 L 11.6,7.4 L 11.6,7.5 L 11.6,7.7 L 11.6,15.1 L 11.6,15.1 L 11.6,15.2 L 11.6,15.2 L 11.4,15.1 L 11.2,15.0 L 11.2,15.0 L 11.1,14.9 L 11.0,14.9 L 11.0,14.9 L 10.8,14.7 L 10.7,14.7 L 10.6,14.7 L 10.5,14.7 L 10.2,14.5 L 10.0,14.5 L 9.9,14.5 L 9.8,14.5 L 9.8,14.4 L 9.7,14.4 L 9.7,14.4 L 9.6,14.4 L 9.6,14.4 L 9.3,14.4 L 9.3,14.4 L 9.2,14.4 L 9.2,14.3 L 9.1,14.3 L 9.1,14.3 L 8.9,14.3 L 8.9,14.3 L 8.4,14.3 L 8.4,14.3 L 7.0,14.3 L 7.0,14.3 L 6.6,14.3 L 6.5,14.3 L 6.3,14.3 L 6.3,14.3 L 6.2,14.3 L 6.1,14.4 L 6.0,14.4 L 6.0,14.4 L 5.9,14.4 L 5.8,14.4 L 5.7,14.4 L 5.7,14.4 L 5.5,14.4 L 5.5,14.4 L 5.4,14.4 L 5.4,14.4 L 5.2,14.4 L 5.2,14.4 L 5.1,14.4 L 5.1,14.5 L 4.8,14.5 L 4.8,14.5 L 4.7,14.5 L 4.7,14.5 L 4.5,14.5 L 4.5,14.5 L 4.2,14.6 L 4.2,14.6 L 4.1,14.6 L 4.1,14.6 L 4.1,14.4 L 4.1,14.4 L 4.1,14.0 L 4.1,14.0 L 4.1,13.6 L 4.2,13.6 L 4.2,13.3 L 4.2,13.3 L 4.2,12.9 L 4.2,12.9 L 4.2,12.6 L 4.2,12.6 L 4.2,11.8 L 4.2,11.8 L 4.2,11.5 L 4.3,11.5 L 4.3,11.1 L 4.3,11.1 L 4.3,10.8 L 4.3,10.7 L 4.3,10.4 L 4.3,10.4 L 4.3,10.0 L 4.3,10.0 L 4.3,9.3 L 4.4,9.2 L 4.4,8.5 L 4.4,8.5 L 4.4,8.2 L 4.4,8.2 L 4.4,7.8 L 4.4,7.8 L 4.4,7.4 L 4.4,7.4 L 4.5,6.7 L 4.5,6.7 L 4.5,6.5 L 4.5,6.5 L 4.5,6.4 L 4.5,6.4 M 19.5,6.3 L 19.5,6.4 L 19.5,6.6 L 19.5,6.6 L 19.5,7.0 L 19.5,7.0 L 19.5,7.6 L 19.6,7.6 L 19.6,8.0 L 19.6,8.0 L 19.6,8.3 L 19.6,8.4 L 19.6,8.7 L 19.6,8.7 L 19.6,9.0 L 19.6,9.1 L 19.6,9.4 L 19.6,9.4 L 19.6,9.8 L 19.7,9.8 L 19.7,10.5 L 19.7,10.5 L 19.7,10.8 L 19.7,10.8 L 19.7,11.0 L 19.7,11.1 L 19.7,11.4 L 19.7,11.4 L 19.7,11.8 L 19.8,11.8 L 19.8,12.1 L 19.8,12.1 L 19.8,12.5 L 19.8,12.5 L 19.8,12.8 L 19.8,12.8 L 19.8,13.5 L 19.8,13.5 L 19.9,14.2 L 19.9,14.2 L 19.9,14.4 L 19.9,14.4 L 19.9,14.5 L 19.9,14.5 L 19.8,14.5 L 19.8,14.5 L 19.6,14.5 L 19.5,14.5 L 19.5,14.5 L 19.5,14.5 L 19.3,14.5 L 19.3,14.5 L 19.2,14.5 L 19.2,14.4 L 19.1,14.4 L 19.1,14.4 L 19.0,14.4 L 19.0,14.4 L 18.9,14.4 L 18.9,14.4 L 18.8,14.4 L 18.8,14.4 L 18.7,14.4 L 18.7,14.4 L 18.4,14.4 L 18.4,14.3 L 18.3,14.3 L 18.2,14.3 L 18.1,14.3 L 18.1,14.3 L 17.6,14.3 L 17.6,14.3 L 17.2,14.3 L 17.2,14.3 L 15.3,14.3 L 15.3,14.3 L 15.0,14.3 L 15.0,14.3 L 14.7,14.3 L 14.7,14.3 L 14.6,14.3 L 14.6,14.3 L 14.5,14.3 L 14.5,14.4 L 14.4,14.4 L 14.4,14.4 L 14.3,14.4 L 14.3,14.4 L 14.2,14.4 L 14.2,14.4 L 13.9,14.5 L 13.8,14.5 L 13.8,14.5 L 13.8,14.5 L 13.5,14.6 L 13.0,14.8 L 13.0,14.9 L 12.9,14.9 L 12.9,14.9 L 12.8,14.9 L 12.7,15.0 L 12.5,15.2 L 12.4,15.3 L 12.3,15.3 L 12.3,14.7 L 12.3,14.7 L 12.3,8.2 L 12.3,8.2 L 12.3,7.7 L 12.4,7.6 L 12.4,7.5 L 12.4,7.5 L 12.5,7.3 L 12.6,7.1 L 12.7,6.9 L 13.0,6.6 L 13.1,6.5 L 13.2,6.5 L 13.2,6.5 L 13.3,6.4 L 13.4,6.4 L 13.5,6.3 L 13.6,6.3 L 13.6,6.3 L 13.7,6.3 L 13.7,6.3 L 13.8,6.2 L 13.9,6.2 L 13.9,6.2 L 14.0,6.2 L 14.0,6.2 L 14.0,6.2 L 14.0,6.2 L 14.1,6.2 L 14.2,6.1 L 14.2,6.1 L 14.3,6.1 L 14.3,6.1 L 14.3,6.1 L 14.4,6.1 L 14.4,6.1 L 14.5,6.1 L 14.5,6.1 L 14.6,6.1 L 14.6,6.0 L 14.7,6.0 L 14.7,6.0 L 15.0,6.0 L 15.0,6.0 L 15.3,6.0 L 15.3,6.0 L 16.1,6.0 L 16.2,6.0 L 17.0,6.0 L 17.0,6.0 L 17.2,6.0 L 17.3,6.0 L 17.4,6.0 L 17.4,6.1 L 17.6,6.1 L 17.6,6.1 L 17.7,6.1 L 17.7,6.1 L 17.9,6.1 L 17.9,6.1 L 18.1,6.1 L 18.2,6.1 L 18.4,6.2 L 18.4,6.2 L 18.5,6.2 L 18.5,6.2 L 18.7,6.2 L 18.7,6.2 L 18.9,6.2 L 18.9,6.2 L 19.1,6.3 L 19.1,6.3 L 19.2,6.3 L 19.2,6.3 L 19.3,6.3 L 19.3,6.3 L 19.5,6.3',
  hourglass: 'M 11.7,15.8 L 11.7,15.9 L 11.2,15.9 L 11.2,15.9 L 11.0,15.9 L 10.9,16.0 L 10.8,16.0 L 10.7,16.0 L 10.6,16.0 L 10.5,16.1 L 10.4,16.1 L 10.3,16.1 L 10.2,16.1 L 10.2,16.2 L 10.1,16.2 L 10.1,16.2 L 10.0,16.2 L 10.0,16.3 L 9.9,16.3 L 9.8,16.3 L 9.8,16.3 L 9.7,16.4 L 9.7,16.4 L 9.6,16.5 L 9.5,16.5 L 9.5,16.6 L 9.4,16.6 L 9.3,16.7 L 9.2,16.7 L 9.1,16.8 L 9.1,16.8 L 8.9,16.9 L 8.9,16.9 L 8.2,17.6 L 8.2,17.7 L 8.0,17.8 L 8.0,17.9 L 7.9,18.0 L 7.9,18.1 L 7.8,18.1 L 7.8,18.2 L 7.7,18.3 L 7.7,18.3 L 7.7,18.4 L 7.7,18.4 L 7.6,18.5 L 7.6,18.6 L 7.6,18.6 L 7.6,18.7 L 7.5,18.7 L 7.5,18.8 L 7.5,18.8 L 7.5,18.9 L 7.4,19.0 L 7.4,19.0 L 7.4,19.1 L 7.4,19.2 L 7.3,19.2 L 7.3,19.3 L 7.3,19.4 L 7.3,19.5 L 7.2,19.6 L 7.2,19.8 L 7.2,19.9 L 7.2,20.1 L 7.1,20.2 L 7.1,20.8 L 7.2,20.8 L 7.2,20.9 L 7.2,20.9 L 7.3,20.9 L 7.3,21.0 L 16.7,21.0 L 16.7,20.9 L 16.8,20.9 L 16.8,20.9 L 16.8,20.8 L 16.9,20.8 L 16.9,20.1 L 16.8,20.1 L 16.8,19.8 L 16.8,19.8 L 16.8,19.6 L 16.7,19.5 L 16.7,19.4 L 16.7,19.3 L 16.7,19.2 L 16.6,19.2 L 16.6,19.1 L 16.6,19.0 L 16.6,18.9 L 16.5,18.9 L 16.5,18.8 L 16.5,18.8 L 16.5,18.7 L 16.4,18.7 L 16.4,18.6 L 16.4,18.6 L 16.4,18.5 L 16.3,18.4 L 16.3,18.4 L 16.3,18.3 L 16.3,18.3 L 16.2,18.2 L 16.2,18.2 L 16.1,18.1 L 16.1,18.0 L 16.0,17.9 L 16.0,17.9 L 15.9,17.7 L 15.9,17.7 L 15.1,16.9 L 15.1,16.9 L 14.9,16.8 L 14.9,16.8 L 14.8,16.7 L 14.7,16.7 L 14.6,16.6 L 14.5,16.6 L 14.4,16.5 L 14.4,16.5 L 14.3,16.4 L 14.3,16.4 L 14.2,16.3 L 14.2,16.3 L 14.1,16.3 L 14.1,16.3 L 14.0,16.2 L 13.9,16.2 L 13.9,16.2 L 13.8,16.2 L 13.8,16.1 L 13.7,16.1 L 13.6,16.1 L 13.5,16.1 L 13.4,16.0 L 13.3,16.0 L 13.3,16.0 L 13.1,16.0 L 13.1,15.9 L 12.8,15.9 L 12.8,15.9 L 12.4,15.9 L 12.3,15.8 L 11.7,15.8 M 11.9,14.5 L 11.8,14.5 L 11.8,14.5 L 11.8,14.6 L 11.7,14.6 L 11.7,14.7 L 11.7,14.7 L 11.7,14.8 L 11.7,14.9 L 11.7,14.9 L 11.8,15.0 L 11.8,15.0 L 11.8,15.0 L 11.9,15.1 L 12.1,15.1 L 12.2,15.0 L 12.2,15.0 L 12.3,15.0 L 12.3,14.9 L 12.3,14.9 L 12.3,14.7 L 12.3,14.6 L 12.3,14.6 L 12.2,14.5 L 12.2,14.5 L 12.1,14.5 L 11.9,14.5 M 11.9,13.0 L 11.8,13.1 L 11.8,13.1 L 11.8,13.2 L 11.7,13.2 L 11.7,13.3 L 11.7,13.3 L 11.7,13.4 L 11.7,13.5 L 11.7,13.5 L 11.9,13.7 L 12.1,13.7 L 12.2,13.6 L 12.2,13.6 L 12.3,13.6 L 12.3,13.5 L 12.3,13.5 L 12.3,13.3 L 12.3,13.2 L 12.3,13.2 L 12.2,13.1 L 12.2,13.1 L 12.1,13.0 L 11.9,13.0 M 10.2,6.4 L 10.1,6.5 L 9.6,6.5 L 9.5,6.6 L 9.2,6.6 L 9.2,6.6 L 9.0,6.6 L 9.0,6.7 L 8.8,6.7 L 8.8,6.7 L 8.6,6.7 L 8.6,6.8 L 8.5,6.8 L 8.4,6.8 L 8.4,6.8 L 8.3,6.9 L 8.2,6.9 L 8.1,6.9 L 8.1,6.9 L 8.0,7.0 L 7.9,7.0 L 7.9,7.0 L 7.8,7.0 L 7.7,7.2 L 7.7,7.4 L 7.7,7.5 L 7.7,7.5 L 8.7,8.5 L 8.8,8.5 L 10.0,9.8 L 10.1,9.8 L 10.9,10.6 L 11.0,10.6 L 11.0,10.7 L 11.0,10.7 L 11.2,10.9 L 11.2,11.0 L 11.2,11.0 L 11.2,11.1 L 11.3,11.1 L 11.3,11.2 L 11.3,11.2 L 11.3,11.3 L 11.4,11.4 L 11.4,11.6 L 11.4,11.6 L 11.4,11.8 L 11.5,11.8 L 11.5,11.9 L 11.7,12.1 L 11.7,12.1 L 11.8,12.1 L 11.9,12.1 L 11.9,12.2 L 12.1,12.2 L 12.2,12.1 L 12.3,12.1 L 12.4,12.0 L 12.4,12.0 L 12.4,11.9 L 12.6,11.8 L 12.6,11.6 L 12.6,11.6 L 12.6,11.4 L 12.7,11.4 L 12.7,11.3 L 12.7,11.2 L 12.7,11.2 L 12.8,11.1 L 12.8,11.1 L 12.8,11.0 L 12.8,11.0 L 12.9,10.9 L 12.9,10.8 L 13.9,9.8 L 14.0,9.8 L 15.1,8.6 L 15.2,8.6 L 16.0,7.8 L 16.1,7.8 L 16.1,7.8 L 16.4,7.4 L 16.4,7.4 L 16.5,7.2 L 16.5,7.2 L 16.6,7.1 L 16.6,7.0 L 16.7,7.0 L 16.7,6.9 L 16.7,6.9 L 16.7,6.7 L 16.7,6.6 L 16.7,6.6 L 16.6,6.4 L 16.3,6.4 L 16.2,6.5 L 16.2,6.5 L 16.1,6.6 L 16.1,6.6 L 16.0,6.6 L 16.0,6.6 L 15.9,6.7 L 15.9,6.7 L 15.8,6.7 L 15.7,6.7 L 15.7,6.8 L 15.6,6.8 L 15.6,6.8 L 15.5,6.8 L 15.4,6.9 L 15.4,6.9 L 15.3,6.9 L 15.3,6.9 L 15.2,7.0 L 15.1,7.0 L 15.1,7.0 L 15.0,7.0 L 14.9,7.1 L 14.8,7.1 L 14.7,7.1 L 14.3,7.1 L 14.3,7.2 L 14.0,7.2 L 13.9,7.1 L 13.5,7.1 L 13.4,7.1 L 13.2,7.1 L 13.2,7.0 L 13.0,7.0 L 13.0,7.0 L 12.8,7.0 L 12.8,6.9 L 12.6,6.9 L 12.6,6.9 L 12.4,6.9 L 12.4,6.8 L 12.2,6.8 L 12.2,6.8 L 12.1,6.8 L 12.0,6.7 L 11.9,6.7 L 11.9,6.7 L 11.7,6.7 L 11.7,6.6 L 11.4,6.6 L 11.4,6.6 L 11.1,6.6 L 11.1,6.5 L 10.6,6.5 L 10.5,6.4 L 10.2,6.4 M 3.9,0.0 L 3.7,0.2 L 3.7,0.2 L 3.7,0.3 L 3.7,2.0 L 3.7,2.0 L 3.7,2.1 L 3.8,2.1 L 3.9,2.1 L 3.9,2.2 L 5.1,2.2 L 5.2,2.3 L 5.2,4.1 L 5.2,4.2 L 5.2,5.0 L 5.3,5.0 L 5.3,5.3 L 5.3,5.4 L 5.3,5.7 L 5.4,5.7 L 5.4,5.9 L 5.4,6.0 L 5.4,6.1 L 5.5,6.2 L 5.5,6.3 L 5.5,6.3 L 5.5,6.5 L 5.6,6.6 L 5.6,6.7 L 5.6,6.7 L 5.6,6.8 L 5.7,6.8 L 5.7,6.9 L 5.7,7.0 L 5.7,7.0 L 5.8,7.1 L 5.8,7.1 L 5.8,7.2 L 5.8,7.3 L 5.9,7.3 L 5.9,7.4 L 5.9,7.4 L 5.9,7.5 L 6.1,7.6 L 6.1,7.7 L 6.1,7.7 L 6.1,7.8 L 6.2,7.9 L 6.2,7.9 L 6.3,8.0 L 6.3,8.1 L 6.4,8.2 L 6.4,8.2 L 6.6,8.4 L 6.6,8.5 L 7.4,9.3 L 7.5,9.3 L 8.0,9.9 L 8.1,9.9 L 8.6,10.4 L 8.7,10.4 L 9.2,11.0 L 9.3,11.0 L 9.8,11.5 L 9.8,11.5 L 9.9,11.6 L 9.9,11.6 L 9.9,11.7 L 9.9,11.7 L 10.0,11.8 L 10.0,11.9 L 10.0,11.9 L 10.0,12.3 L 10.0,12.3 L 10.0,12.4 L 9.9,12.5 L 9.9,12.6 L 9.9,12.6 L 9.9,12.7 L 9.8,12.8 L 9.8,12.8 L 9.5,13.1 L 9.5,13.1 L 8.9,13.6 L 8.9,13.6 L 8.3,14.2 L 8.3,14.2 L 7.7,14.7 L 7.7,14.7 L 7.0,15.4 L 7.0,15.4 L 6.9,15.5 L 6.9,15.5 L 6.5,15.9 L 6.5,15.9 L 6.4,16.1 L 6.4,16.1 L 6.3,16.2 L 6.3,16.3 L 6.2,16.4 L 6.2,16.5 L 6.1,16.5 L 6.1,16.6 L 6.0,16.7 L 6.0,16.7 L 5.9,16.8 L 5.9,16.8 L 5.9,16.9 L 5.9,16.9 L 5.8,17.0 L 5.8,17.0 L 5.8,17.1 L 5.8,17.1 L 5.7,17.2 L 5.7,17.3 L 5.7,17.3 L 5.7,17.4 L 5.6,17.4 L 5.6,17.6 L 5.6,17.6 L 5.6,17.7 L 5.5,17.8 L 5.5,17.9 L 5.5,17.9 L 5.5,18.1 L 5.4,18.1 L 5.4,18.3 L 5.4,18.3 L 5.4,18.5 L 5.3,18.6 L 5.3,18.8 L 5.3,18.9 L 5.3,19.2 L 5.2,19.2 L 5.2,19.9 L 5.2,19.9 L 5.2,21.7 L 5.1,21.8 L 4.0,21.8 L 3.9,21.9 L 3.9,21.9 L 3.7,22.0 L 3.7,22.0 L 3.7,22.1 L 3.7,23.8 L 3.7,23.8 L 3.7,23.9 L 3.9,24.0 L 20.1,24.0 L 20.3,23.8 L 20.3,22.0 L 20.1,21.9 L 20.1,21.9 L 20.0,21.8 L 18.9,21.8 L 18.8,21.7 L 18.8,19.9 L 18.8,19.9 L 18.8,19.2 L 18.7,19.2 L 18.7,18.9 L 18.7,18.8 L 18.7,18.6 L 18.6,18.5 L 18.6,18.3 L 18.6,18.2 L 18.6,18.1 L 18.5,18.0 L 18.5,17.9 L 18.5,17.9 L 18.5,17.8 L 18.4,17.7 L 18.4,17.6 L 18.4,17.6 L 18.4,17.4 L 18.3,17.4 L 18.3,17.3 L 18.3,17.2 L 18.3,17.2 L 18.2,17.1 L 18.2,17.1 L 18.2,17.0 L 18.2,17.0 L 18.1,16.9 L 18.1,16.9 L 18.1,16.8 L 18.1,16.8 L 18.0,16.7 L 18.0,16.7 L 17.9,16.6 L 17.9,16.6 L 17.8,16.5 L 17.8,16.4 L 17.7,16.3 L 17.7,16.2 L 17.6,16.1 L 17.6,16.1 L 17.5,15.9 L 17.5,15.9 L 17.2,15.6 L 17.2,15.5 L 16.9,15.2 L 16.8,15.2 L 16.3,14.7 L 16.2,14.7 L 15.6,14.1 L 15.6,14.1 L 15.1,13.6 L 15.0,13.6 L 14.5,13.0 L 14.4,13.0 L 14.3,12.9 L 14.3,12.8 L 14.1,12.7 L 14.1,12.6 L 14.1,12.6 L 14.1,12.5 L 14.0,12.4 L 14.0,12.3 L 14.0,12.3 L 14.0,12.0 L 14.0,11.9 L 14.0,11.8 L 14.1,11.8 L 14.1,11.7 L 14.1,11.6 L 14.1,11.6 L 14.2,11.5 L 14.2,11.4 L 14.5,11.2 L 14.5,11.2 L 15.1,10.6 L 15.1,10.6 L 15.6,10.1 L 15.7,10.1 L 16.3,9.5 L 16.3,9.5 L 16.8,9.0 L 16.9,9.0 L 17.1,8.8 L 17.1,8.8 L 17.5,8.4 L 17.5,8.3 L 17.6,8.2 L 17.6,8.1 L 17.7,8.0 L 17.7,8.0 L 17.8,7.9 L 17.8,7.8 L 17.9,7.7 L 17.9,7.7 L 18.0,7.6 L 18.0,7.5 L 18.1,7.5 L 18.1,7.4 L 18.1,7.4 L 18.1,7.3 L 18.2,7.3 L 18.2,7.2 L 18.2,7.2 L 18.2,7.1 L 18.3,7.1 L 18.3,7.0 L 18.3,6.9 L 18.3,6.9 L 18.4,6.8 L 18.4,6.7 L 18.4,6.7 L 18.4,6.6 L 18.5,6.5 L 18.5,6.4 L 18.5,6.3 L 18.5,6.2 L 18.6,6.1 L 18.6,6.0 L 18.6,6.0 L 18.6,5.8 L 18.7,5.7 L 18.7,5.4 L 18.7,5.4 L 18.7,5.1 L 18.8,5.0 L 18.8,4.4 L 18.8,4.3 L 18.8,2.3 L 18.9,2.2 L 20.1,2.2 L 20.3,2.1 L 20.3,2.0 L 20.3,2.0 L 20.3,0.2 L 20.3,0.2 L 20.3,0.1 L 20.2,0.1 L 20.1,0.1 L 20.1,0.0 L 3.9,0.0 M 5.8,2.3 L 5.9,2.2 L 18.1,2.2 L 18.2,2.3 L 18.2,4.6 L 18.1,4.7 L 18.1,5.1 L 18.1,5.2 L 18.1,5.4 L 18.0,5.5 L 18.0,5.7 L 17.9,5.8 L 17.9,5.9 L 17.9,6.0 L 17.9,6.1 L 17.8,6.2 L 17.8,6.3 L 17.8,6.3 L 17.8,6.4 L 17.7,6.5 L 17.7,6.6 L 17.7,6.7 L 17.7,6.7 L 17.6,6.8 L 17.6,6.8 L 17.6,6.9 L 17.6,7.0 L 17.5,7.0 L 17.5,7.1 L 17.5,7.1 L 17.5,7.2 L 17.4,7.3 L 17.4,7.3 L 17.3,7.4 L 17.3,7.4 L 17.2,7.5 L 17.2,7.6 L 17.1,7.7 L 17.1,7.8 L 16.9,8.0 L 16.9,8.0 L 16.1,8.9 L 16.0,8.9 L 15.5,9.4 L 15.4,9.4 L 14.9,10.0 L 14.8,10.0 L 14.2,10.5 L 14.2,10.5 L 13.7,11.0 L 13.7,11.1 L 13.6,11.2 L 13.6,11.2 L 13.5,11.3 L 13.5,11.3 L 13.5,11.4 L 13.5,11.4 L 13.4,11.5 L 13.4,11.5 L 13.4,11.6 L 13.4,11.7 L 13.3,11.8 L 13.3,12.1 L 13.3,12.1 L 13.3,12.2 L 13.3,12.2 L 13.3,12.5 L 13.4,12.5 L 13.4,12.7 L 13.4,12.7 L 13.4,12.8 L 13.5,12.8 L 13.5,12.9 L 13.5,12.9 L 13.5,13.0 L 13.6,13.0 L 13.6,13.1 L 13.7,13.2 L 13.7,13.3 L 14.1,13.7 L 14.2,13.7 L 14.8,14.3 L 14.8,14.3 L 15.4,14.8 L 15.4,14.8 L 16.0,15.4 L 16.1,15.4 L 16.9,16.2 L 16.9,16.3 L 17.1,16.5 L 17.1,16.5 L 17.2,16.7 L 17.2,16.7 L 17.3,16.8 L 17.3,16.9 L 17.4,16.9 L 17.4,17.0 L 17.4,17.0 L 17.4,17.1 L 17.5,17.1 L 17.5,17.2 L 17.5,17.2 L 17.5,17.3 L 17.6,17.3 L 17.6,17.4 L 17.6,17.4 L 17.6,17.5 L 17.7,17.6 L 17.7,17.7 L 17.7,17.7 L 17.7,17.8 L 17.8,17.8 L 17.8,17.9 L 17.8,18.0 L 17.8,18.1 L 17.9,18.1 L 17.9,18.3 L 17.9,18.3 L 17.9,18.5 L 18.0,18.6 L 18.0,18.8 L 18.1,18.8 L 18.1,19.1 L 18.1,19.2 L 18.1,19.7 L 18.2,19.8 L 18.2,21.7 L 18.1,21.8 L 5.9,21.8 L 5.8,21.7 L 5.8,19.7 L 5.9,19.7 L 5.9,19.2 L 5.9,19.1 L 5.9,18.8 L 6.0,18.8 L 6.0,18.6 L 6.1,18.5 L 6.1,18.3 L 6.1,18.3 L 6.1,18.1 L 6.2,18.1 L 6.2,18.0 L 6.2,17.9 L 6.2,17.8 L 6.3,17.8 L 6.3,17.7 L 6.3,17.7 L 6.3,17.6 L 6.4,17.5 L 6.4,17.4 L 6.4,17.4 L 6.4,17.3 L 6.5,17.3 L 6.5,17.2 L 6.5,17.2 L 6.5,17.1 L 6.6,17.1 L 6.6,17.0 L 6.6,17.0 L 6.6,16.9 L 6.7,16.9 L 6.7,16.8 L 6.8,16.7 L 6.8,16.7 L 6.9,16.5 L 6.9,16.5 L 7.1,16.3 L 7.1,16.2 L 7.8,15.5 L 7.9,15.5 L 8.5,14.9 L 8.5,14.9 L 9.0,14.4 L 9.1,14.4 L 9.7,13.8 L 9.7,13.8 L 10.3,13.2 L 10.3,13.2 L 10.4,13.1 L 10.4,13.0 L 10.5,12.9 L 10.5,12.9 L 10.6,12.8 L 10.6,12.7 L 10.6,12.7 L 10.6,12.6 L 10.7,12.5 L 10.7,12.3 L 10.7,12.3 L 10.7,12.0 L 10.7,11.9 L 10.7,11.7 L 10.6,11.7 L 10.6,11.6 L 10.6,11.5 L 10.6,11.4 L 10.5,11.4 L 10.5,11.3 L 10.5,11.3 L 10.5,11.2 L 10.3,11.1 L 10.3,11.1 L 9.8,10.5 L 9.8,10.5 L 9.2,10.0 L 9.1,10.0 L 8.6,9.4 L 8.6,9.4 L 8.0,8.9 L 8.0,8.9 L 7.1,8.0 L 7.1,8.0 L 6.9,7.8 L 6.9,7.7 L 6.8,7.6 L 6.8,7.5 L 6.7,7.4 L 6.7,7.4 L 6.6,7.3 L 6.6,7.3 L 6.6,7.2 L 6.6,7.2 L 6.5,7.1 L 6.5,7.1 L 6.5,7.0 L 6.5,7.0 L 6.4,6.9 L 6.4,6.9 L 6.4,6.8 L 6.4,6.8 L 6.3,6.7 L 6.3,6.7 L 6.3,6.6 L 6.3,6.5 L 6.2,6.4 L 6.2,6.3 L 6.2,6.3 L 6.2,6.2 L 6.1,6.1 L 6.1,6.0 L 6.1,5.9 L 6.1,5.8 L 6.0,5.7 L 6.0,5.5 L 5.9,5.4 L 5.9,5.1 L 5.9,5.1 L 5.9,4.6 L 5.8,4.6 L 5.8,2.3',
  coin: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 3a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm-1 3h2v8h-2V8z',
  potion: 'M 22.4,18.8 L 22.0,20.8 L 21.9,20.8 L 21.8,20.9 L 21.5,20.9 L 20.7,21.2 L 21.7,21.4 L 22.0,21.4 L 22.0,21.5 L 22.4,23.4 L 22.7,21.5 L 22.8,21.4 L 22.8,21.4 L 24.0,21.2 L 22.7,20.8 L 22.7,20.8 L 22.4,18.8 M 4.9,10.2 L 4.6,10.8 L 4.3,11.4 L 4.1,12.0 L 4.1,12.0 L 4.0,12.3 L 3.9,12.7 L 3.8,13.3 L 3.8,13.3 L 3.8,13.6 L 3.7,13.7 L 3.7,14.0 L 3.7,14.0 L 3.7,14.7 L 3.7,14.8 L 3.7,15.1 L 3.8,15.1 L 3.8,15.3 L 3.8,15.3 L 3.8,15.7 L 4.0,16.4 L 4.2,16.9 L 4.3,17.4 L 4.7,18.0 L 4.9,18.5 L 5.3,19.0 L 5.7,19.5 L 6.3,20.0 L 6.8,20.5 L 7.5,20.9 L 8.1,21.2 L 8.7,21.4 L 9.5,21.7 L 10.1,21.8 L 10.5,21.8 L 10.5,21.8 L 10.8,21.8 L 10.8,21.8 L 11.6,21.8 L 11.6,21.8 L 11.9,21.8 L 11.9,21.8 L 12.4,21.8 L 13.2,21.6 L 13.9,21.3 L 14.4,21.1 L 14.7,20.9 L 14.7,20.9 L 15.2,20.7 L 15.7,20.3 L 16.1,19.9 L 16.7,19.4 L 17.3,18.7 L 17.6,18.2 L 17.7,17.7 L 17.7,17.1 L 17.7,17.0 L 17.7,16.9 L 17.6,16.6 L 17.5,16.1 L 17.3,15.9 L 17.1,15.5 L 16.7,15.0 L 16.1,14.6 L 15.4,14.2 L 14.6,13.9 L 14.2,13.8 L 13.7,13.8 L 13.7,13.8 L 13.1,13.8 L 13.0,13.8 L 12.8,13.8 L 12.8,13.8 L 12.6,13.8 L 12.5,13.8 L 12.0,13.9 L 11.1,14.1 L 10.6,14.2 L 9.6,14.7 L 9.2,14.8 L 8.9,14.8 L 8.7,14.8 L 8.7,14.9 L 8.3,14.8 L 7.9,14.8 L 7.5,14.7 L 7.0,14.4 L 6.6,14.0 L 6.3,13.6 L 6.2,13.3 L 6.0,12.8 L 5.9,12.4 L 5.9,12.3 L 5.9,12.2 L 5.9,11.7 L 5.9,11.7 L 5.9,10.6 L 5.9,10.6 L 5.8,10.3 L 5.6,10.1 L 5.5,10.0 L 5.2,10.1 L 5.1,10.1 L 4.9,10.2 M 14.3,2.6 L 14.1,2.6 L 13.9,2.6 L 13.9,2.6 L 13.6,2.6 L 13.3,2.6 L 13.0,2.8 L 12.9,2.9 L 12.8,3.0 L 11.3,4.5 L 11.2,4.6 L 10.6,4.6 L 10.6,4.6 L 10.3,4.6 L 10.3,4.6 L 9.8,4.7 L 9.0,4.8 L 8.9,4.9 L 8.8,4.9 L 8.3,5.0 L 8.3,5.0 L 7.5,5.3 L 6.7,5.7 L 6.1,6.0 L 5.5,6.4 L 4.7,7.1 L 4.0,7.7 L 3.5,8.4 L 3.1,8.9 L 2.7,9.7 L 2.3,10.4 L 2.1,11.0 L 1.8,11.9 L 1.8,12.0 L 1.7,12.2 L 1.7,12.5 L 1.6,12.7 L 1.6,13.1 L 1.6,13.2 L 1.6,13.4 L 1.6,13.4 L 1.6,13.6 L 1.5,13.7 L 1.5,14.8 L 1.6,14.8 L 1.6,15.1 L 1.6,15.1 L 1.6,15.7 L 1.6,15.7 L 1.7,16.2 L 1.9,16.8 L 2.2,17.7 L 2.4,18.3 L 3.0,19.3 L 3.4,19.9 L 4.0,20.7 L 4.8,21.6 L 5.6,22.2 L 6.5,22.8 L 7.2,23.1 L 8.0,23.5 L 8.9,23.7 L 9.7,23.9 L 10.4,24.0 L 10.4,24.0 L 10.6,24.0 L 10.7,24.0 L 11.9,24.0 L 11.9,24.0 L 12.2,24.0 L 12.2,24.0 L 12.7,23.9 L 13.4,23.8 L 14.5,23.5 L 15.3,23.1 L 16.0,22.8 L 16.5,22.5 L 17.4,21.8 L 17.9,21.4 L 18.7,20.6 L 19.3,19.8 L 19.7,19.2 L 20.2,18.1 L 20.4,17.6 L 20.7,16.7 L 20.7,16.6 L 20.9,16.0 L 20.9,15.8 L 20.9,15.6 L 20.9,15.5 L 20.9,15.4 L 21.0,15.0 L 21.0,14.9 L 21.0,14.2 L 22.6,12.6 L 22.8,12.4 L 22.9,12.1 L 22.9,11.9 L 22.9,11.8 L 22.9,11.6 L 22.9,11.6 L 22.9,11.4 L 22.9,11.4 L 22.9,11.2 L 22.7,10.6 L 22.4,10.1 L 21.6,10.7 L 21.8,11.1 L 21.9,11.4 L 21.9,11.8 L 21.9,11.8 L 21.8,11.8 L 21.5,11.8 L 20.7,11.5 L 20.2,11.2 L 19.6,10.8 L 19.7,10.7 L 21.9,9.1 L 21.5,8.9 L 21.2,8.7 L 20.4,8.3 L 19.5,7.6 L 18.8,7.0 L 18.5,6.7 L 17.8,5.9 L 17.2,5.1 L 16.7,4.2 L 16.5,3.6 L 14.7,5.9 L 14.6,5.8 L 14.1,5.1 L 13.8,4.5 L 13.6,3.9 L 13.6,3.7 L 13.7,3.6 L 14.1,3.7 L 14.4,3.8 L 14.8,3.9 L 15.5,3.1 L 14.9,2.8 L 14.3,2.6 M 10.4,5.6 L 10.5,5.6 L 10.6,5.7 L 10.6,6.1 L 10.7,6.7 L 11.0,7.4 L 11.6,8.4 L 12.2,9.3 L 12.8,10.0 L 13.7,10.9 L 14.2,11.4 L 14.9,12.1 L 15.8,12.9 L 16.7,13.6 L 17.6,14.2 L 18.0,14.4 L 18.8,14.8 L 19.4,14.9 L 19.5,14.9 L 19.6,15.0 L 19.9,15.0 L 19.9,14.9 L 19.9,15.0 L 19.9,15.5 L 19.9,15.6 L 19.9,15.7 L 19.7,16.3 L 19.6,16.8 L 19.3,17.8 L 19.0,18.4 L 18.7,18.9 L 18.3,19.5 L 17.7,20.2 L 17.2,20.6 L 16.5,21.3 L 15.9,21.6 L 15.3,22.0 L 14.6,22.3 L 13.8,22.6 L 13.2,22.8 L 12.5,22.9 L 12.2,22.9 L 12.2,22.9 L 11.4,23.0 L 11.4,23.0 L 10.4,22.9 L 10.4,22.9 L 10.2,22.9 L 10.2,22.9 L 10.0,22.9 L 9.8,22.8 L 9.6,22.8 L 8.8,22.6 L 7.9,22.3 L 7.1,21.9 L 6.4,21.4 L 5.8,21.0 L 5.5,20.7 L 4.8,20.0 L 4.5,19.7 L 3.9,18.9 L 3.6,18.3 L 3.3,17.7 L 2.9,16.8 L 2.7,15.9 L 2.7,15.8 L 2.6,15.5 L 2.6,15.3 L 2.6,15.3 L 2.6,15.1 L 2.6,15.1 L 2.6,14.9 L 2.6,14.8 L 2.6,13.6 L 2.6,13.6 L 2.6,13.4 L 2.6,13.4 L 2.6,13.2 L 2.6,13.2 L 2.6,13.0 L 2.7,13.0 L 2.7,12.6 L 2.9,11.8 L 3.1,11.2 L 3.5,10.4 L 4.0,9.6 L 4.5,8.8 L 4.8,8.4 L 5.6,7.7 L 6.4,7.1 L 7.1,6.7 L 8.0,6.2 L 8.7,6.0 L 9.5,5.8 L 10.0,5.7 L 10.0,5.7 L 10.4,5.7 L 10.4,5.6 M 12.7,4.6 L 12.9,5.1 L 13.2,5.7 L 13.5,6.1 L 14.0,6.9 L 15.1,8.2 L 15.9,9.1 L 16.4,9.6 L 17.1,10.2 L 17.7,10.8 L 18.7,11.5 L 19.5,12.1 L 20.1,12.4 L 20.5,12.6 L 20.9,12.8 L 19.8,13.9 L 19.8,13.9 L 19.5,13.9 L 19.2,13.8 L 18.8,13.6 L 17.9,13.1 L 16.9,12.4 L 16.3,11.9 L 15.3,11.0 L 14.2,9.9 L 13.6,9.3 L 13.0,8.6 L 12.5,7.8 L 12.0,7.1 L 12.0,7.0 L 11.9,6.8 L 11.7,6.4 L 11.6,6.0 L 11.6,5.7 L 12.7,4.6 M 17.5,2.2 L 17.4,2.3 L 17.4,2.4 L 17.3,2.8 L 17.4,3.1 L 17.5,3.4 L 17.8,3.9 L 18.2,4.5 L 18.7,5.2 L 19.1,5.7 L 19.8,6.4 L 20.4,6.9 L 21.1,7.4 L 21.6,7.8 L 22.1,8.0 L 22.7,8.2 L 23.1,8.2 L 23.3,8.1 L 23.4,8.0 L 23.5,7.8 L 23.5,7.3 L 23.3,6.8 L 23.0,6.2 L 22.7,5.7 L 22.2,5.0 L 21.6,4.4 L 21.1,3.9 L 20.5,3.4 L 19.7,2.8 L 19.2,2.5 L 18.6,2.2 L 18.1,2.0 L 17.7,2.0 L 17.5,2.2 M 2.6,0.0 L 2.6,0.1 L 2.6,0.1 L 2.6,0.2 L 2.6,0.3 L 2.6,0.4 L 2.6,0.4 L 2.6,0.5 L 2.5,0.5 L 2.5,0.6 L 2.5,0.7 L 2.5,0.8 L 2.5,0.8 L 2.1,3.1 L 2.0,3.2 L 1.9,3.2 L 1.8,3.3 L 0.0,3.7 L 0.0,3.7 L 2.0,4.2 L 2.1,4.2 L 2.5,6.6 L 2.5,6.6 L 2.5,6.7 L 2.5,6.7 L 2.5,6.8 L 2.6,6.9 L 2.6,7.0 L 2.6,7.0 L 2.6,7.1 L 2.6,7.1 L 2.6,7.2 L 2.6,7.3 L 2.6,7.4 L 2.6,7.4 L 2.6,7.3 L 2.7,7.2 L 2.7,7.1 L 2.7,7.1 L 2.7,7.0 L 2.7,7.0 L 2.7,6.9 L 2.7,6.8 L 2.7,6.7 L 2.8,6.7 L 2.8,6.6 L 2.8,6.6 L 3.2,4.2 L 3.2,4.2 L 3.4,4.2 L 3.6,4.1 L 3.8,4.1 L 3.9,4.0 L 4.2,4.0 L 4.7,3.8 L 4.8,3.8 L 4.9,3.8 L 5.0,3.8 L 5.1,3.7 L 5.3,3.7 L 5.3,3.7 L 4.9,3.6 L 4.8,3.6 L 4.7,3.6 L 4.7,3.5 L 4.6,3.5 L 4.5,3.5 L 4.4,3.5 L 4.1,3.4 L 4.0,3.4 L 3.9,3.3 L 3.8,3.3 L 3.5,3.2 L 3.3,3.2 L 3.2,3.1 L 2.8,1.1 L 2.8,0.9 L 2.8,0.8 L 2.8,0.8 L 2.6,0.0 L 2.6,0.0',
  note: 'M 20.9,0.0 L 20.9,0.0 L 20.8,0.0 L 20.7,0.1 L 20.6,0.1 L 20.5,0.1 L 20.4,0.1 L 20.4,0.2 L 20.3,0.2 L 20.2,0.2 L 20.1,0.2 L 20.1,0.3 L 20.0,0.3 L 19.9,0.3 L 19.8,0.3 L 19.8,0.4 L 19.7,0.4 L 19.6,0.4 L 19.5,0.4 L 19.5,0.5 L 19.4,0.5 L 19.3,0.5 L 19.2,0.5 L 19.2,0.6 L 19.1,0.6 L 19.0,0.6 L 18.9,0.6 L 18.8,0.7 L 18.7,0.7 L 18.7,0.7 L 18.6,0.7 L 18.6,0.8 L 18.5,0.8 L 18.4,0.8 L 18.3,0.8 L 18.2,0.8 L 18.1,0.8 L 18.1,0.9 L 18.0,0.9 L 17.9,0.9 L 17.8,0.9 L 17.8,1.0 L 17.7,1.0 L 17.6,1.0 L 17.5,1.0 L 17.5,1.1 L 17.4,1.1 L 17.3,1.1 L 17.2,1.1 L 17.1,1.2 L 17.0,1.2 L 17.0,1.2 L 16.9,1.2 L 16.9,1.3 L 16.8,1.3 L 16.7,1.3 L 16.6,1.3 L 16.5,1.4 L 16.4,1.4 L 16.4,1.4 L 16.3,1.4 L 16.3,1.5 L 16.2,1.5 L 16.1,1.5 L 16.0,1.5 L 15.9,1.5 L 15.8,1.5 L 15.8,1.6 L 15.7,1.6 L 15.6,1.6 L 15.5,1.6 L 15.5,1.7 L 15.4,1.7 L 15.3,1.7 L 15.2,1.7 L 15.2,1.8 L 15.1,1.8 L 15.0,1.8 L 14.9,1.8 L 14.9,1.9 L 14.7,1.9 L 14.7,1.9 L 14.6,1.9 L 14.6,2.0 L 14.5,2.0 L 14.4,2.0 L 14.3,2.0 L 14.3,2.1 L 14.1,2.1 L 14.1,2.1 L 14.0,2.1 L 13.9,2.2 L 13.9,2.2 L 13.8,2.2 L 13.7,2.2 L 13.6,2.3 L 13.5,2.3 L 13.5,2.3 L 13.4,2.3 L 13.3,2.3 L 13.2,2.3 L 13.2,2.4 L 13.1,2.4 L 13.0,2.4 L 12.9,2.4 L 12.9,2.5 L 12.8,2.5 L 12.7,2.5 L 12.6,2.5 L 12.5,2.6 L 12.4,2.6 L 12.4,2.6 L 12.3,2.6 L 12.3,2.7 L 12.2,2.7 L 12.1,2.7 L 12.0,2.7 L 11.9,2.8 L 11.8,2.8 L 11.8,2.8 L 11.7,2.8 L 11.6,2.9 L 11.6,2.9 L 11.5,2.9 L 11.4,2.9 L 11.3,3.0 L 11.2,3.0 L 11.2,3.0 L 11.1,3.0 L 11.0,3.1 L 10.9,3.1 L 10.9,3.1 L 10.8,3.1 L 10.7,3.1 L 10.6,3.1 L 10.6,3.2 L 10.5,3.2 L 10.4,3.2 L 10.3,3.2 L 10.2,3.3 L 10.1,3.3 L 10.1,3.3 L 10.0,3.3 L 10.0,3.4 L 9.9,3.4 L 9.8,3.4 L 9.7,3.4 L 9.6,3.5 L 9.5,3.5 L 9.5,3.5 L 9.4,3.5 L 9.3,3.6 L 9.2,3.6 L 9.2,3.6 L 9.1,3.6 L 9.0,3.7 L 8.9,3.7 L 8.9,3.7 L 8.8,3.7 L 8.7,3.8 L 8.7,3.8 L 8.6,3.8 L 8.6,3.8 L 8.3,4.1 L 8.3,4.1 L 8.3,4.2 L 8.3,4.2 L 8.2,4.3 L 8.2,4.4 L 8.2,4.4 L 8.2,17.5 L 8.1,17.5 L 8.0,17.5 L 8.0,17.5 L 7.9,17.5 L 7.8,17.4 L 7.7,17.4 L 7.7,17.4 L 7.6,17.4 L 7.5,17.3 L 7.3,17.3 L 7.3,17.3 L 7.0,17.3 L 7.0,17.2 L 6.0,17.2 L 5.9,17.3 L 5.6,17.3 L 5.6,17.3 L 5.4,17.3 L 5.3,17.4 L 5.2,17.4 L 5.1,17.4 L 5.0,17.4 L 5.0,17.5 L 4.8,17.5 L 4.8,17.5 L 4.7,17.5 L 4.6,17.6 L 4.6,17.6 L 4.6,17.6 L 4.5,17.6 L 4.4,17.7 L 4.4,17.7 L 4.3,17.7 L 4.3,17.7 L 4.2,17.8 L 4.1,17.8 L 4.1,17.8 L 4.0,17.8 L 4.0,17.8 L 3.9,17.8 L 3.9,17.9 L 3.8,17.9 L 3.8,18.0 L 3.7,18.0 L 3.6,18.1 L 3.6,18.1 L 3.5,18.2 L 3.4,18.2 L 3.3,18.3 L 3.2,18.3 L 3.0,18.6 L 3.0,18.6 L 2.8,18.7 L 2.8,18.8 L 2.5,19.0 L 2.5,19.1 L 2.4,19.2 L 2.4,19.3 L 2.3,19.4 L 2.3,19.4 L 2.3,19.4 L 2.3,19.5 L 2.2,19.6 L 2.2,19.6 L 2.1,19.7 L 2.1,19.8 L 2.1,19.8 L 2.1,19.9 L 2.0,19.9 L 2.0,20.0 L 2.0,20.1 L 2.0,20.1 L 1.9,20.2 L 1.9,20.3 L 1.9,20.3 L 1.9,20.5 L 1.8,20.6 L 1.8,21.4 L 1.9,21.5 L 1.9,21.7 L 1.9,21.7 L 1.9,21.8 L 2.0,21.8 L 2.0,21.9 L 2.0,22.0 L 2.0,22.1 L 2.1,22.1 L 2.1,22.2 L 2.1,22.2 L 2.1,22.3 L 2.2,22.3 L 2.2,22.4 L 2.3,22.5 L 2.3,22.5 L 2.3,22.6 L 2.3,22.6 L 2.9,23.2 L 3.0,23.2 L 3.1,23.3 L 3.1,23.3 L 3.2,23.4 L 3.3,23.4 L 3.3,23.5 L 3.4,23.5 L 3.4,23.5 L 3.5,23.5 L 3.5,23.6 L 3.6,23.6 L 3.6,23.6 L 3.7,23.6 L 3.7,23.7 L 3.8,23.7 L 3.9,23.7 L 3.9,23.7 L 3.9,23.8 L 4.0,23.8 L 4.1,23.8 L 4.2,23.8 L 4.3,23.9 L 4.4,23.9 L 4.5,23.9 L 4.6,23.9 L 4.7,24.0 L 5.0,24.0 L 5.1,24.0 L 5.8,24.0 L 5.9,24.0 L 6.2,24.0 L 6.2,23.9 L 6.5,23.9 L 6.5,23.9 L 6.7,23.9 L 6.7,23.8 L 6.9,23.8 L 6.9,23.8 L 7.0,23.8 L 7.1,23.7 L 7.2,23.7 L 7.2,23.7 L 7.3,23.7 L 7.4,23.6 L 7.4,23.6 L 7.5,23.6 L 7.5,23.6 L 7.6,23.5 L 7.7,23.5 L 7.7,23.5 L 7.7,23.5 L 7.8,23.4 L 7.8,23.4 L 7.9,23.4 L 7.9,23.4 L 8.0,23.3 L 8.0,23.3 L 8.1,23.2 L 8.2,23.2 L 8.2,23.2 L 8.3,23.2 L 8.4,23.1 L 8.4,23.1 L 8.5,23.0 L 8.6,23.0 L 8.7,22.8 L 8.8,22.8 L 9.3,22.3 L 9.3,22.3 L 9.4,22.1 L 9.4,22.1 L 9.5,22.0 L 9.5,21.9 L 9.6,21.8 L 9.6,21.8 L 9.7,21.7 L 9.7,21.7 L 9.8,21.6 L 9.8,21.6 L 9.8,21.5 L 9.8,21.4 L 9.9,21.4 L 9.9,21.3 L 9.9,21.3 L 9.9,21.2 L 10.0,21.1 L 10.0,21.0 L 10.0,21.0 L 10.0,20.9 L 10.1,20.8 L 10.1,20.5 L 10.1,20.5 L 10.1,10.6 L 10.2,10.5 L 10.3,10.5 L 10.3,10.4 L 10.4,10.4 L 10.5,10.4 L 10.6,10.4 L 10.7,10.3 L 10.8,10.3 L 10.8,10.3 L 10.9,10.3 L 10.9,10.2 L 11.0,10.2 L 11.1,10.2 L 11.2,10.2 L 11.3,10.1 L 11.4,10.1 L 11.4,10.1 L 11.5,10.1 L 11.6,10.1 L 11.6,10.1 L 11.7,10.0 L 11.8,10.0 L 11.9,10.0 L 12.0,10.0 L 12.0,9.9 L 12.1,9.9 L 12.2,9.9 L 12.3,9.9 L 12.3,9.8 L 12.4,9.8 L 12.5,9.8 L 12.6,9.8 L 12.6,9.7 L 12.7,9.7 L 12.8,9.7 L 12.9,9.7 L 12.9,9.6 L 13.1,9.6 L 13.1,9.6 L 13.2,9.6 L 13.2,9.5 L 13.3,9.5 L 13.4,9.5 L 13.5,9.5 L 13.6,9.4 L 13.7,9.4 L 13.7,9.4 L 13.8,9.4 L 13.9,9.3 L 13.9,9.3 L 14.0,9.3 L 14.1,9.3 L 14.2,9.3 L 14.3,9.3 L 14.3,9.2 L 14.4,9.2 L 14.5,9.2 L 14.6,9.2 L 14.7,9.1 L 14.7,9.1 L 14.8,9.1 L 14.9,9.1 L 14.9,9.0 L 15.0,9.0 L 15.1,9.0 L 15.2,9.0 L 15.2,8.9 L 15.4,8.9 L 15.4,8.9 L 15.5,8.9 L 15.5,8.8 L 15.6,8.8 L 15.7,8.8 L 15.8,8.8 L 15.9,8.7 L 16.0,8.7 L 16.0,8.7 L 16.1,8.7 L 16.2,8.6 L 16.3,8.6 L 16.3,8.6 L 16.4,8.6 L 16.5,8.5 L 16.6,8.5 L 16.6,8.5 L 16.7,8.5 L 16.8,8.5 L 16.9,8.5 L 16.9,8.4 L 17.0,8.4 L 17.1,8.4 L 17.2,8.4 L 17.2,8.3 L 17.3,8.3 L 17.4,8.3 L 17.5,8.3 L 17.6,8.2 L 17.7,8.2 L 17.7,8.2 L 17.8,8.2 L 17.8,8.1 L 17.9,8.1 L 18.0,8.1 L 18.1,8.1 L 18.2,8.0 L 18.3,8.0 L 18.3,8.0 L 18.4,8.0 L 18.5,7.9 L 18.6,7.9 L 18.6,7.9 L 18.7,7.9 L 18.8,7.8 L 18.9,7.8 L 18.9,7.8 L 19.0,7.8 L 19.1,7.7 L 19.2,7.7 L 19.3,7.7 L 19.4,7.7 L 19.4,7.7 L 19.5,7.7 L 19.5,7.6 L 19.6,7.6 L 19.7,7.6 L 19.8,7.6 L 19.9,7.5 L 20.0,7.5 L 20.0,7.5 L 20.1,7.5 L 20.2,7.5 L 20.2,15.5 L 20.1,15.5 L 20.1,15.5 L 20.0,15.5 L 20.0,15.4 L 19.9,15.4 L 19.8,15.4 L 19.7,15.4 L 19.6,15.3 L 19.4,15.3 L 19.4,15.3 L 19.2,15.3 L 19.1,15.2 L 17.9,15.2 L 17.8,15.3 L 17.6,15.3 L 17.5,15.3 L 17.4,15.3 L 17.3,15.4 L 17.2,15.4 L 17.1,15.4 L 17.0,15.4 L 17.0,15.5 L 16.9,15.5 L 16.8,15.5 L 16.7,15.5 L 16.7,15.5 L 16.6,15.5 L 16.5,15.6 L 16.5,15.6 L 16.4,15.6 L 16.4,15.6 L 16.3,15.7 L 16.3,15.7 L 16.3,15.7 L 16.2,15.7 L 16.2,15.8 L 16.1,15.8 L 16.0,15.9 L 15.9,15.9 L 15.9,15.9 L 15.8,15.9 L 15.8,16.0 L 15.7,16.0 L 15.6,16.1 L 15.6,16.1 L 15.5,16.2 L 15.5,16.2 L 15.3,16.3 L 15.2,16.3 L 14.6,17.0 L 14.6,17.0 L 14.5,17.1 L 14.5,17.1 L 14.4,17.3 L 14.4,17.3 L 14.3,17.4 L 14.3,17.4 L 14.3,17.5 L 14.3,17.5 L 14.2,17.6 L 14.2,17.6 L 14.1,17.7 L 14.1,17.8 L 14.1,17.8 L 14.1,17.9 L 14.0,17.9 L 14.0,18.0 L 14.0,18.1 L 14.0,18.2 L 13.9,18.3 L 13.9,18.4 L 13.9,18.5 L 13.9,18.8 L 13.9,18.9 L 13.9,19.1 L 13.9,19.1 L 13.9,19.5 L 13.9,19.5 L 13.9,19.7 L 14.0,19.7 L 14.0,19.8 L 14.0,19.9 L 14.0,20.0 L 14.1,20.0 L 14.1,20.1 L 14.1,20.1 L 14.1,20.1 L 14.2,20.2 L 14.2,20.2 L 14.2,20.3 L 14.2,20.3 L 14.3,20.4 L 14.3,20.5 L 14.4,20.6 L 14.4,20.6 L 15.0,21.2 L 15.0,21.2 L 15.2,21.3 L 15.2,21.3 L 15.3,21.4 L 15.3,21.4 L 15.4,21.5 L 15.5,21.5 L 15.5,21.5 L 15.5,21.5 L 15.6,21.6 L 15.6,21.6 L 15.7,21.6 L 15.8,21.6 L 15.8,21.7 L 15.9,21.7 L 15.9,21.7 L 16.0,21.7 L 16.1,21.7 L 16.2,21.7 L 16.2,21.8 L 16.3,21.8 L 16.4,21.8 L 16.5,21.8 L 16.6,21.9 L 16.8,21.9 L 16.8,21.9 L 17.4,21.9 L 17.4,22.0 L 17.5,22.0 L 17.6,21.9 L 18.2,21.9 L 18.2,21.9 L 18.5,21.9 L 18.5,21.8 L 18.7,21.8 L 18.7,21.8 L 18.9,21.8 L 18.9,21.7 L 19.0,21.7 L 19.1,21.7 L 19.2,21.7 L 19.2,21.7 L 19.3,21.7 L 19.4,21.6 L 19.4,21.6 L 19.5,21.6 L 19.5,21.6 L 19.6,21.5 L 19.7,21.5 L 19.7,21.5 L 19.8,21.5 L 19.8,21.4 L 19.9,21.4 L 19.9,21.4 L 20.0,21.4 L 20.0,21.3 L 20.1,21.3 L 20.1,21.2 L 20.2,21.2 L 20.2,21.2 L 20.3,21.2 L 20.4,21.1 L 20.4,21.1 L 20.5,21.0 L 20.6,21.0 L 20.7,20.9 L 20.8,20.9 L 21.4,20.2 L 21.4,20.1 L 21.6,20.0 L 21.6,20.0 L 21.7,19.9 L 21.7,19.8 L 21.7,19.8 L 21.7,19.7 L 21.8,19.6 L 21.8,19.6 L 21.8,19.5 L 21.8,19.5 L 21.9,19.4 L 21.9,19.4 L 21.9,19.3 L 21.9,19.3 L 22.0,19.2 L 22.0,19.1 L 22.0,19.1 L 22.0,18.9 L 22.1,18.9 L 22.1,18.7 L 22.1,18.7 L 22.1,18.4 L 22.2,18.3 L 22.2,18.1 L 22.1,18.0 L 22.1,0.8 L 22.1,0.8 L 22.1,0.6 L 22.0,0.6 L 22.0,0.5 L 22.0,0.5 L 22.0,0.4 L 21.7,0.1 L 21.7,0.1 L 21.6,0.1 L 21.6,0.1 L 21.5,0.0 L 21.5,0.0 L 21.4,0.0 L 20.9,0.0 M 20.0,2.3 L 20.0,2.3 L 20.1,2.3 L 20.2,2.3 L 20.2,5.4 L 20.1,5.4 L 20.1,5.4 L 20.1,5.4 L 20.0,5.4 L 19.9,5.5 L 19.8,5.5 L 19.8,5.5 L 19.7,5.5 L 19.6,5.6 L 19.5,5.6 L 19.5,5.6 L 19.4,5.6 L 19.3,5.7 L 19.2,5.7 L 19.2,5.7 L 19.1,5.7 L 19.0,5.8 L 18.9,5.8 L 18.8,5.8 L 18.7,5.8 L 18.7,5.9 L 18.6,5.9 L 18.6,5.9 L 18.5,5.9 L 18.4,6.0 L 18.3,6.0 L 18.2,6.0 L 18.1,6.0 L 18.1,6.1 L 18.0,6.1 L 17.9,6.1 L 17.8,6.1 L 17.8,6.2 L 17.7,6.2 L 17.6,6.2 L 17.5,6.2 L 17.5,6.2 L 17.4,6.2 L 17.3,6.3 L 17.2,6.3 L 17.1,6.3 L 17.0,6.3 L 17.0,6.4 L 16.9,6.4 L 16.9,6.4 L 16.8,6.4 L 16.7,6.5 L 16.6,6.5 L 16.5,6.5 L 16.4,6.5 L 16.4,6.6 L 16.3,6.6 L 16.3,6.6 L 16.2,6.6 L 16.1,6.7 L 16.0,6.7 L 15.9,6.7 L 15.8,6.7 L 15.8,6.8 L 15.7,6.8 L 15.6,6.8 L 15.5,6.8 L 15.5,6.9 L 15.4,6.9 L 15.3,6.9 L 15.2,6.9 L 15.2,7.0 L 15.1,7.0 L 15.0,7.0 L 14.9,7.0 L 14.8,7.0 L 14.7,7.0 L 14.7,7.1 L 14.6,7.1 L 14.6,7.1 L 14.5,7.1 L 14.4,7.2 L 14.3,7.2 L 14.2,7.2 L 14.1,7.2 L 14.1,7.3 L 14.0,7.3 L 13.9,7.3 L 13.9,7.3 L 13.8,7.4 L 13.7,7.4 L 13.6,7.4 L 13.5,7.4 L 13.5,7.5 L 13.4,7.5 L 13.3,7.5 L 13.2,7.5 L 13.2,7.6 L 13.1,7.6 L 13.0,7.6 L 12.9,7.6 L 12.9,7.7 L 12.8,7.7 L 12.7,7.7 L 12.6,7.7 L 12.5,7.7 L 12.4,7.7 L 12.4,7.8 L 12.3,7.8 L 12.3,7.8 L 12.2,7.8 L 12.1,7.9 L 12.0,7.9 L 11.9,7.9 L 11.8,7.9 L 11.8,8.0 L 11.7,8.0 L 11.6,8.0 L 11.6,8.0 L 11.5,8.1 L 11.4,8.1 L 11.3,8.1 L 11.2,8.1 L 11.2,8.2 L 11.1,8.2 L 11.0,8.2 L 10.9,8.2 L 10.9,8.3 L 10.8,8.3 L 10.7,8.3 L 10.6,8.3 L 10.6,8.4 L 10.5,8.4 L 10.4,8.4 L 10.3,8.4 L 10.2,8.5 L 10.1,8.5 L 10.1,8.4 L 10.1,5.4 L 10.2,5.3 L 10.3,5.3 L 10.3,5.3 L 10.4,5.3 L 10.5,5.2 L 10.6,5.2 L 10.7,5.2 L 10.8,5.2 L 10.8,5.1 L 10.9,5.1 L 10.9,5.1 L 11.0,5.1 L 11.1,5.0 L 11.2,5.0 L 11.3,5.0 L 11.4,5.0 L 11.4,4.9 L 11.5,4.9 L 11.6,4.9 L 11.6,4.9 L 11.7,4.8 L 11.8,4.8 L 11.9,4.8 L 12.0,4.8 L 12.0,4.7 L 12.1,4.7 L 12.2,4.7 L 12.3,4.7 L 12.3,4.6 L 12.4,4.6 L 12.5,4.6 L 12.6,4.6 L 12.6,4.6 L 12.7,4.6 L 12.8,4.5 L 12.9,4.5 L 12.9,4.5 L 13.1,4.5 L 13.1,4.4 L 13.2,4.4 L 13.2,4.4 L 13.3,4.4 L 13.4,4.3 L 13.5,4.3 L 13.6,4.3 L 13.7,4.3 L 13.7,4.2 L 13.8,4.2 L 13.9,4.2 L 13.9,4.2 L 14.0,4.1 L 14.1,4.1 L 14.2,4.1 L 14.3,4.1 L 14.3,4.0 L 14.4,4.0 L 14.5,4.0 L 14.6,4.0 L 14.7,3.9 L 14.7,3.9 L 14.8,3.9 L 14.9,3.9 L 14.9,3.9 L 15.0,3.9 L 15.1,3.8 L 15.2,3.8 L 15.2,3.8 L 15.4,3.8 L 15.4,3.7 L 15.5,3.7 L 15.5,3.7 L 15.6,3.7 L 15.7,3.6 L 15.8,3.6 L 15.9,3.6 L 16.0,3.6 L 16.0,3.5 L 16.1,3.5 L 16.2,3.5 L 16.3,3.5 L 16.3,3.4 L 16.4,3.4 L 16.5,3.4 L 16.6,3.4 L 16.6,3.3 L 16.7,3.3 L 16.8,3.3 L 16.9,3.3 L 16.9,3.2 L 17.0,3.2 L 17.1,3.2 L 17.2,3.2 L 17.2,3.1 L 17.3,3.1 L 17.4,3.1 L 17.5,3.1 L 17.6,3.1 L 17.7,3.1 L 17.7,3.0 L 17.8,3.0 L 17.8,3.0 L 17.9,3.0 L 18.0,2.9 L 18.1,2.9 L 18.2,2.9 L 18.3,2.9 L 18.3,2.8 L 18.4,2.8 L 18.5,2.8 L 18.6,2.8 L 18.6,2.7 L 18.7,2.7 L 18.8,2.7 L 18.9,2.7 L 18.9,2.6 L 19.0,2.6 L 19.1,2.6 L 19.2,2.6 L 19.2,2.5 L 19.4,2.5 L 19.4,2.5 L 19.5,2.5 L 19.5,2.4 L 19.6,2.4 L 19.7,2.4 L 19.8,2.4 L 19.9,2.3 L 20.0,2.3',
  eye: 'M 12.9,10.0 L 12.8,10.1 L 12.7,10.1 L 12.6,10.2 L 12.5,10.2 L 12.2,10.4 L 12.2,10.5 L 12.2,10.6 L 12.2,10.7 L 12.1,10.8 L 12.1,11.3 L 12.2,11.3 L 12.2,11.4 L 12.2,11.5 L 12.2,11.6 L 12.4,11.8 L 12.5,11.8 L 12.6,11.8 L 12.7,11.8 L 12.7,11.9 L 13.3,11.9 L 13.4,11.8 L 13.5,11.8 L 13.8,11.5 L 13.8,11.3 L 13.9,11.3 L 13.9,10.7 L 13.8,10.7 L 13.8,10.6 L 13.8,10.5 L 13.8,10.4 L 13.5,10.2 L 13.4,10.2 L 13.3,10.1 L 13.2,10.1 L 13.1,10.0 L 12.9,10.0 M 11.5,7.6 L 11.4,7.7 L 11.1,7.7 L 11.0,7.7 L 10.9,7.7 L 10.8,7.8 L 10.6,7.8 L 10.5,7.9 L 10.4,7.9 L 10.4,8.0 L 10.2,8.0 L 10.2,8.0 L 10.1,8.0 L 10.0,8.1 L 10.0,8.1 L 9.8,8.2 L 9.8,8.2 L 9.7,8.3 L 9.6,8.3 L 9.5,8.4 L 9.4,8.4 L 8.5,9.3 L 8.5,9.4 L 8.4,9.5 L 8.4,9.6 L 8.2,9.8 L 8.2,9.8 L 8.2,9.9 L 8.2,10.0 L 8.1,10.0 L 8.1,10.1 L 8.0,10.2 L 8.0,10.3 L 8.0,10.4 L 8.0,10.4 L 7.9,10.5 L 7.9,10.7 L 7.8,10.7 L 7.8,10.9 L 7.7,10.9 L 7.7,11.2 L 7.7,11.3 L 7.7,12.8 L 7.7,12.9 L 7.7,13.1 L 7.8,13.1 L 7.8,13.3 L 7.9,13.4 L 7.9,13.5 L 8.0,13.6 L 8.0,13.7 L 8.0,13.8 L 8.0,13.8 L 8.1,13.9 L 8.1,14.0 L 8.2,14.0 L 8.2,14.1 L 8.2,14.2 L 8.2,14.2 L 8.4,14.4 L 8.4,14.5 L 8.5,14.6 L 8.5,14.7 L 8.9,15.0 L 8.9,15.1 L 8.9,15.1 L 9.4,15.6 L 9.5,15.6 L 9.6,15.7 L 9.7,15.7 L 9.8,15.8 L 9.9,15.8 L 10.0,15.9 L 10.0,15.9 L 10.1,16.0 L 10.2,16.0 L 10.2,16.0 L 10.3,16.0 L 10.4,16.1 L 10.5,16.1 L 10.6,16.2 L 10.7,16.2 L 10.8,16.3 L 10.9,16.3 L 11.0,16.3 L 11.3,16.3 L 11.4,16.4 L 12.6,16.4 L 12.7,16.3 L 13.0,16.3 L 13.1,16.3 L 13.2,16.3 L 13.3,16.2 L 13.4,16.2 L 13.5,16.1 L 13.6,16.1 L 13.7,16.0 L 13.8,16.0 L 13.8,16.0 L 13.9,16.0 L 14.0,15.9 L 14.0,15.9 L 14.1,15.8 L 14.2,15.8 L 14.2,15.8 L 14.3,15.8 L 14.5,15.6 L 14.5,15.6 L 14.7,15.4 L 14.8,15.4 L 15.4,14.8 L 15.4,14.7 L 15.6,14.5 L 15.6,14.5 L 15.8,14.3 L 15.8,14.2 L 15.8,14.2 L 15.8,14.1 L 15.9,14.0 L 15.9,14.0 L 16.0,13.9 L 16.0,13.8 L 16.0,13.8 L 16.0,13.7 L 16.1,13.6 L 16.1,13.5 L 16.2,13.4 L 16.2,13.3 L 16.3,13.2 L 16.3,13.0 L 16.3,12.9 L 16.3,12.7 L 16.4,12.6 L 16.4,11.3 L 16.3,11.3 L 16.3,11.0 L 16.3,10.9 L 16.3,10.7 L 16.2,10.7 L 16.2,10.5 L 16.1,10.4 L 16.1,10.4 L 16.0,10.3 L 16.0,10.2 L 15.9,10.0 L 15.9,10.0 L 15.8,9.9 L 15.8,9.8 L 15.8,9.8 L 15.8,9.7 L 15.6,9.5 L 15.6,9.5 L 15.5,9.3 L 15.5,9.3 L 14.7,8.5 L 14.7,8.5 L 14.5,8.3 L 14.4,8.3 L 14.3,8.2 L 14.2,8.2 L 14.2,8.2 L 14.1,8.2 L 14.0,8.0 L 13.8,8.0 L 13.8,8.0 L 13.7,8.0 L 13.6,7.9 L 13.6,7.9 L 13.5,7.8 L 13.3,7.8 L 13.2,7.7 L 13.1,7.7 L 13.0,7.7 L 12.7,7.7 L 12.6,7.6 L 11.5,7.6 M 11.4,9.1 L 11.5,9.0 L 12.6,9.0 L 12.7,9.1 L 12.9,9.1 L 12.9,9.1 L 13.1,9.1 L 13.1,9.2 L 13.2,9.2 L 13.3,9.3 L 13.3,9.3 L 13.4,9.3 L 13.5,9.3 L 13.6,9.4 L 13.6,9.4 L 13.8,9.6 L 13.9,9.6 L 14.4,10.1 L 14.4,10.2 L 14.6,10.4 L 14.6,10.4 L 14.7,10.6 L 14.7,10.7 L 14.8,10.8 L 14.8,10.9 L 14.9,10.9 L 14.9,11.0 L 14.9,11.1 L 14.9,11.3 L 15.0,11.3 L 15.0,11.7 L 15.1,11.8 L 15.1,12.2 L 15.0,12.2 L 15.0,12.7 L 14.9,12.7 L 14.9,12.9 L 14.9,12.9 L 14.9,13.1 L 14.8,13.1 L 14.8,13.2 L 14.7,13.3 L 14.7,13.3 L 14.7,13.4 L 14.7,13.5 L 14.5,13.6 L 14.5,13.7 L 14.4,13.8 L 14.4,13.9 L 13.9,14.4 L 13.8,14.4 L 13.6,14.6 L 13.6,14.6 L 13.5,14.7 L 13.4,14.7 L 13.3,14.7 L 13.3,14.7 L 13.2,14.8 L 13.1,14.8 L 13.1,14.9 L 12.9,14.9 L 12.9,14.9 L 12.7,14.9 L 12.6,15.0 L 11.5,15.0 L 11.4,14.9 L 11.2,14.9 L 11.1,14.9 L 11.0,14.9 L 10.9,14.8 L 10.9,14.8 L 10.8,14.7 L 10.7,14.7 L 10.7,14.7 L 10.6,14.7 L 10.5,14.6 L 10.4,14.6 L 10.3,14.5 L 10.2,14.5 L 9.5,13.8 L 9.5,13.7 L 9.4,13.6 L 9.4,13.5 L 9.3,13.4 L 9.3,13.3 L 9.3,13.3 L 9.3,13.2 L 9.2,13.1 L 9.2,13.0 L 9.1,12.9 L 9.1,12.8 L 9.1,12.7 L 9.1,12.4 L 9.0,12.4 L 9.0,11.7 L 9.1,11.6 L 9.1,11.3 L 9.1,11.2 L 9.1,11.1 L 9.2,11.0 L 9.2,10.9 L 9.3,10.8 L 9.3,10.7 L 9.3,10.7 L 9.3,10.6 L 9.5,10.4 L 9.5,10.4 L 9.5,10.3 L 9.5,10.2 L 10.2,9.5 L 10.3,9.5 L 10.4,9.4 L 10.5,9.4 L 10.6,9.3 L 10.7,9.3 L 10.7,9.3 L 10.8,9.3 L 10.9,9.2 L 10.9,9.2 L 11.0,9.1 L 11.1,9.1 L 11.2,9.1 L 11.4,9.1 M 11.1,5.0 L 11.1,5.1 L 10.4,5.1 L 10.4,5.2 L 10.0,5.2 L 9.9,5.3 L 9.5,5.3 L 9.5,5.3 L 9.2,5.3 L 9.1,5.4 L 8.9,5.4 L 8.9,5.5 L 8.6,5.5 L 8.6,5.5 L 8.4,5.5 L 8.3,5.6 L 8.2,5.6 L 8.1,5.7 L 8.0,5.7 L 7.9,5.7 L 7.7,5.7 L 7.7,5.8 L 7.5,5.8 L 7.5,5.9 L 7.3,5.9 L 7.3,5.9 L 7.2,5.9 L 7.1,6.0 L 7.0,6.0 L 6.9,6.1 L 6.8,6.1 L 6.8,6.2 L 6.7,6.2 L 6.6,6.2 L 6.5,6.2 L 6.4,6.3 L 6.4,6.3 L 6.3,6.4 L 6.2,6.4 L 6.2,6.4 L 6.1,6.4 L 6.0,6.5 L 5.9,6.5 L 5.9,6.6 L 5.8,6.6 L 5.7,6.6 L 5.7,6.6 L 5.5,6.8 L 5.5,6.8 L 5.4,6.8 L 5.3,6.8 L 5.3,6.9 L 5.2,6.9 L 5.1,7.0 L 5.0,7.0 L 4.9,7.1 L 4.8,7.1 L 4.7,7.3 L 4.6,7.3 L 4.6,7.3 L 4.5,7.3 L 4.4,7.5 L 4.3,7.5 L 4.1,7.6 L 4.1,7.6 L 3.9,7.8 L 3.8,7.8 L 3.6,8.0 L 3.5,8.0 L 3.3,8.2 L 3.3,8.2 L 2.9,8.6 L 2.8,8.6 L 2.3,9.1 L 2.2,9.1 L 1.4,10.0 L 1.4,10.0 L 0.9,10.5 L 0.9,10.6 L 0.6,10.9 L 0.6,11.0 L 0.3,11.2 L 0.3,11.3 L 0.1,11.5 L 0.1,11.6 L 0.1,11.6 L 0.1,11.7 L -1.8e-15,11.8 L -1.8e-15,12.2 L 0.1,12.3 L 0.1,12.4 L 0.1,12.4 L 0.1,12.5 L 0.3,12.7 L 0.3,12.8 L 0.6,13.0 L 0.6,13.1 L 0.9,13.4 L 0.9,13.5 L 1.4,14.0 L 1.4,14.0 L 2.2,14.9 L 2.3,14.9 L 2.8,15.4 L 2.9,15.4 L 3.3,15.8 L 3.3,15.8 L 3.5,16.0 L 3.6,16.0 L 3.8,16.2 L 3.9,16.2 L 4.1,16.4 L 4.1,16.4 L 4.3,16.5 L 4.4,16.5 L 4.4,16.6 L 4.5,16.6 L 4.6,16.7 L 4.7,16.7 L 4.8,16.9 L 4.9,16.9 L 5.0,17.0 L 5.1,17.0 L 5.2,17.1 L 5.3,17.1 L 5.3,17.2 L 5.4,17.2 L 5.5,17.2 L 5.5,17.2 L 5.7,17.4 L 5.7,17.4 L 5.8,17.4 L 5.9,17.4 L 5.9,17.5 L 6.0,17.5 L 6.1,17.6 L 6.2,17.6 L 6.2,17.6 L 6.3,17.6 L 6.4,17.7 L 6.4,17.7 L 6.5,17.8 L 6.6,17.8 L 6.7,17.8 L 6.8,17.8 L 6.8,17.9 L 6.9,17.9 L 7.0,18.0 L 7.1,18.0 L 7.2,18.1 L 7.3,18.1 L 7.3,18.1 L 7.5,18.1 L 7.5,18.2 L 7.7,18.2 L 7.7,18.3 L 7.9,18.3 L 8.0,18.3 L 8.1,18.3 L 8.2,18.4 L 8.3,18.4 L 8.4,18.5 L 8.6,18.5 L 8.6,18.5 L 8.9,18.5 L 8.9,18.6 L 9.1,18.6 L 9.2,18.7 L 9.5,18.7 L 9.5,18.7 L 9.8,18.7 L 9.9,18.8 L 10.4,18.8 L 10.4,18.9 L 11.1,18.9 L 11.1,19.0 L 12.9,19.0 L 13.0,18.9 L 13.6,18.9 L 13.7,18.8 L 14.1,18.8 L 14.2,18.7 L 14.5,18.7 L 14.5,18.7 L 14.8,18.7 L 14.9,18.6 L 15.1,18.6 L 15.2,18.5 L 15.4,18.5 L 15.5,18.5 L 15.6,18.5 L 15.7,18.4 L 15.9,18.4 L 16.0,18.3 L 16.1,18.3 L 16.2,18.3 L 16.3,18.3 L 16.4,18.2 L 16.5,18.2 L 16.6,18.1 L 16.7,18.1 L 16.7,18.1 L 16.9,18.1 L 16.9,18.0 L 17.0,18.0 L 17.1,17.9 L 17.2,17.9 L 17.3,17.8 L 17.4,17.8 L 17.4,17.8 L 17.5,17.8 L 17.6,17.7 L 17.6,17.7 L 17.7,17.6 L 17.8,17.6 L 17.8,17.6 L 18.0,17.6 L 18.1,17.5 L 18.1,17.5 L 18.3,17.4 L 18.3,17.4 L 18.4,17.3 L 18.5,17.3 L 18.5,17.2 L 18.6,17.2 L 18.7,17.1 L 18.8,17.1 L 18.9,17.0 L 19.0,17.0 L 19.0,16.9 L 19.1,16.9 L 19.2,16.8 L 19.3,16.8 L 19.4,16.7 L 19.5,16.7 L 19.6,16.5 L 19.7,16.5 L 19.8,16.5 L 19.9,16.5 L 20.1,16.3 L 20.1,16.3 L 20.3,16.0 L 20.4,16.0 L 20.6,15.8 L 20.7,15.8 L 21.0,15.6 L 21.0,15.6 L 21.5,15.1 L 21.6,15.1 L 22.8,13.9 L 22.8,13.8 L 23.2,13.4 L 23.2,13.3 L 23.4,13.1 L 23.4,13.0 L 23.7,12.8 L 23.7,12.7 L 23.9,12.5 L 23.9,12.4 L 23.9,12.4 L 23.9,12.2 L 24.0,12.2 L 24.0,11.8 L 23.9,11.8 L 23.9,11.6 L 23.9,11.6 L 23.9,11.5 L 23.7,11.3 L 23.7,11.2 L 23.4,11.0 L 23.4,10.9 L 23.2,10.7 L 23.2,10.6 L 22.8,10.2 L 22.8,10.1 L 21.6,8.9 L 21.5,8.9 L 21.1,8.5 L 21.0,8.5 L 20.7,8.2 L 20.6,8.2 L 20.4,8.0 L 20.3,8.0 L 20.1,7.7 L 20.1,7.7 L 19.9,7.5 L 19.8,7.5 L 19.6,7.4 L 19.6,7.4 L 19.5,7.3 L 19.4,7.3 L 19.3,7.2 L 19.2,7.2 L 19.1,7.1 L 19.0,7.1 L 19.0,7.0 L 18.9,7.0 L 18.7,6.8 L 18.7,6.8 L 18.6,6.8 L 18.5,6.8 L 18.5,6.7 L 18.4,6.7 L 18.3,6.6 L 18.3,6.6 L 18.1,6.5 L 18.1,6.5 L 18.0,6.4 L 17.9,6.4 L 17.8,6.4 L 17.7,6.4 L 17.6,6.3 L 17.6,6.3 L 17.5,6.2 L 17.4,6.2 L 17.4,6.2 L 17.3,6.2 L 17.2,6.1 L 17.1,6.1 L 17.0,6.0 L 16.9,6.0 L 16.9,5.9 L 16.7,5.9 L 16.7,5.9 L 16.6,5.9 L 16.5,5.8 L 16.4,5.8 L 16.3,5.7 L 16.2,5.7 L 16.1,5.7 L 16.0,5.7 L 15.9,5.6 L 15.7,5.6 L 15.6,5.5 L 15.5,5.5 L 15.4,5.5 L 15.2,5.5 L 15.1,5.4 L 14.9,5.4 L 14.9,5.3 L 14.6,5.3 L 14.5,5.3 L 14.2,5.3 L 14.1,5.2 L 13.7,5.2 L 13.6,5.1 L 13.0,5.1 L 12.9,5.0 L 11.1,5.0 M 10.8,7.0 L 10.9,6.9 L 13.2,6.9 L 13.3,7.0 L 13.7,7.0 L 13.8,7.1 L 14.1,7.1 L 14.2,7.1 L 14.4,7.1 L 14.5,7.2 L 14.7,7.2 L 14.8,7.3 L 14.9,7.3 L 15.0,7.3 L 15.2,7.3 L 15.3,7.4 L 15.4,7.4 L 15.5,7.5 L 15.6,7.5 L 15.7,7.5 L 15.8,7.5 L 15.9,7.6 L 16.0,7.6 L 16.0,7.7 L 16.2,7.7 L 16.3,7.7 L 16.4,7.7 L 16.5,7.8 L 16.5,7.8 L 16.6,7.9 L 16.7,7.9 L 16.7,8.0 L 16.8,8.0 L 16.9,8.0 L 16.9,8.0 L 17.0,8.1 L 17.1,8.1 L 17.2,8.2 L 17.2,8.2 L 17.3,8.2 L 17.4,8.2 L 17.4,8.3 L 17.5,8.3 L 17.6,8.4 L 17.6,8.4 L 17.7,8.4 L 17.8,8.4 L 17.9,8.6 L 18.0,8.6 L 18.1,8.6 L 18.1,8.6 L 18.3,8.8 L 18.3,8.8 L 18.4,8.9 L 18.5,8.9 L 18.7,9.1 L 18.7,9.1 L 18.9,9.2 L 19.0,9.2 L 19.1,9.3 L 19.2,9.3 L 19.4,9.6 L 19.5,9.6 L 19.8,9.9 L 19.9,9.9 L 20.3,10.4 L 20.4,10.4 L 21.3,11.3 L 21.3,11.3 L 21.7,11.8 L 21.7,11.8 L 21.9,12.0 L 21.9,12.0 L 21.7,12.2 L 21.7,12.2 L 21.3,12.7 L 21.3,12.7 L 20.4,13.6 L 20.3,13.6 L 19.9,14.1 L 19.8,14.1 L 19.5,14.4 L 19.4,14.4 L 19.2,14.7 L 19.1,14.7 L 19.0,14.8 L 18.9,14.8 L 18.7,14.9 L 18.7,14.9 L 18.5,15.1 L 18.5,15.1 L 18.3,15.2 L 18.3,15.2 L 18.1,15.4 L 18.1,15.4 L 18.0,15.4 L 17.9,15.4 L 17.8,15.6 L 17.7,15.6 L 17.6,15.6 L 17.6,15.6 L 17.5,15.7 L 17.4,15.7 L 17.4,15.8 L 17.3,15.8 L 17.2,15.8 L 17.2,15.8 L 17.1,15.9 L 17.0,15.9 L 16.9,16.0 L 16.9,16.0 L 16.8,16.0 L 16.7,16.0 L 16.7,16.1 L 16.6,16.1 L 16.5,16.2 L 16.5,16.2 L 16.4,16.3 L 16.3,16.3 L 16.2,16.3 L 16.0,16.3 L 16.0,16.4 L 15.9,16.4 L 15.8,16.5 L 15.7,16.5 L 15.6,16.5 L 15.5,16.5 L 15.4,16.6 L 15.3,16.6 L 15.2,16.7 L 15.0,16.7 L 14.9,16.7 L 14.8,16.7 L 14.7,16.8 L 14.5,16.8 L 14.4,16.9 L 14.2,16.9 L 14.1,16.9 L 13.8,16.9 L 13.7,17.0 L 13.3,17.0 L 13.2,17.1 L 10.9,17.1 L 10.8,17.0 L 10.4,17.0 L 10.3,16.9 L 10.0,16.9 L 9.9,16.9 L 9.7,16.9 L 9.6,16.8 L 9.3,16.8 L 9.3,16.7 L 9.1,16.7 L 9.0,16.7 L 8.9,16.7 L 8.8,16.6 L 8.6,16.6 L 8.6,16.5 L 8.4,16.5 L 8.3,16.5 L 8.2,16.5 L 8.2,16.4 L 8.0,16.4 L 8.0,16.3 L 7.8,16.3 L 7.7,16.3 L 7.7,16.3 L 7.6,16.2 L 7.5,16.2 L 7.5,16.1 L 7.3,16.1 L 7.3,16.0 L 7.2,16.0 L 7.1,16.0 L 7.1,16.0 L 7.0,15.9 L 6.9,15.9 L 6.8,15.8 L 6.8,15.8 L 6.7,15.8 L 6.6,15.8 L 6.6,15.7 L 6.5,15.7 L 6.4,15.6 L 6.3,15.6 L 6.2,15.5 L 6.2,15.5 L 6.1,15.4 L 6.0,15.4 L 5.9,15.3 L 5.8,15.3 L 5.7,15.2 L 5.7,15.2 L 5.5,15.1 L 5.5,15.1 L 5.3,14.9 L 5.3,14.9 L 5.1,14.8 L 5.0,14.8 L 4.8,14.6 L 4.8,14.6 L 4.5,14.3 L 4.4,14.3 L 4.1,14.0 L 4.1,14.0 L 3.6,13.6 L 3.5,13.6 L 2.8,12.9 L 2.8,12.8 L 2.3,12.2 L 2.3,12.2 L 2.1,12.0 L 2.1,12.0 L 2.3,11.8 L 2.3,11.8 L 2.8,11.2 L 2.8,11.1 L 3.5,10.5 L 3.5,10.5 L 4.1,10.0 L 4.1,10.0 L 4.4,9.7 L 4.5,9.7 L 4.8,9.4 L 4.8,9.4 L 5.0,9.2 L 5.1,9.2 L 5.3,9.1 L 5.3,9.1 L 5.5,8.9 L 5.5,8.9 L 5.7,8.8 L 5.7,8.8 L 5.8,8.7 L 5.9,8.7 L 6.0,8.6 L 6.1,8.6 L 6.2,8.5 L 6.2,8.5 L 6.4,8.4 L 6.4,8.4 L 6.5,8.3 L 6.6,8.3 L 6.6,8.2 L 6.7,8.2 L 6.8,8.2 L 6.8,8.2 L 6.9,8.1 L 7.0,8.1 L 7.1,8.0 L 7.1,8.0 L 7.2,8.0 L 7.3,8.0 L 7.3,7.9 L 7.5,7.9 L 7.5,7.8 L 7.6,7.8 L 7.7,7.7 L 7.7,7.7 L 7.8,7.7 L 8.0,7.7 L 8.0,7.6 L 8.2,7.6 L 8.2,7.5 L 8.3,7.5 L 8.4,7.5 L 8.6,7.5 L 8.6,7.4 L 8.8,7.4 L 8.9,7.3 L 9.0,7.3 L 9.1,7.3 L 9.3,7.3 L 9.3,7.2 L 9.5,7.2 L 9.6,7.1 L 9.9,7.1 L 10.0,7.1 L 10.3,7.1 L 10.4,7.0 L 10.8,7.0',
  mask: { d: 'M 0.4,8.0 L 2.5,10.6 L 0.0,8.8 L 0.2,10.0 L 4.3,12.6 L 3.2,18.0 L 4.7,12.8 L 4.0,19.7 L 4.9,22.3 L 4.8,14.4 L 5.7,21.2 L 5.1,13.4 L 9.0,16.6 L 14.3,15.4 L 18.8,16.7 L 21.8,15.1 L 23.9,10.7 L 24.0,8.0 L 22.4,13.9 L 19.5,16.3 L 13.7,15.2 L 8.9,16.4 L 5.2,12.5 L 9.2,16.1 L 13.9,14.8 L 18.9,16.1 L 22.1,13.9 L 23.6,8.9 L 21.9,10.2 L 21.7,9.3 L 17.4,9.1 L 14.0,11.7 L 11.1,9.2 L 5.6,9.1 L 10.8,8.8 L 14.1,11.2 L 17.1,8.8 L 22.6,8.9 L 18.2,8.4 L 14.9,9.8 L 14.1,7.4 L 13.1,9.7 L 10.3,8.5 L 5.7,8.8 L 6.6,5.9 L 9.1,4.9 L 6.2,4.7 L 4.1,7.3 L 4.3,4.1 L 6.2,1.7 L 2.7,3.9 L 2.6,8.4 L 1.2,4.2 L 0.4,8.0 M 7.1,11.6 L 7.2,11.5 L 9.8,11.4 L 10.5,11.6 L 11.1,11.9 L 11.7,12.4 L 12.3,13.6 L 10.8,13.9 L 9.9,13.9 L 9.2,13.7 L 8.3,13.2 L 7.7,12.5 L 7.1,11.6 M 21.0,11.6 L 20.3,12.7 L 19.9,13.1 L 18.9,13.7 L 18.2,13.9 L 17.4,13.9 L 16.1,13.7 L 15.8,13.5 L 16.4,12.4 L 17.6,11.6 L 18.3,11.4 L 19.4,11.4 L 19.6,11.1 L 19.7,11.1 L 20.1,11.5 L 20.9,11.5 L 21.0,11.6 M 4.5,10.3 L 4.7,10.3 L 5.1,10.6 L 5.5,11.3 L 5.4,11.9 L 4.9,12.5 L 4.5,12.4 L 4.3,12.2 L 4.0,11.6 L 4.0,10.9 L 4.5,10.3 M 1.3,7.6 L 2.2,9.1 L 3.1,10.0 L 3.9,10.6 L 3.8,10.7 L 3.1,10.3 L 2.2,9.4 L 1.5,8.5 L 1.2,7.8 L 1.3,7.6 M 6.1,5.7 L 6.1,5.8 L 5.4,6.8 L 5.0,7.7 L 4.7,8.8 L 4.7,9.8 L 4.6,9.9 L 4.5,8.8 L 4.8,7.6 L 5.4,6.4 L 6.1,5.7 M 4.1,3.4 L 4.1,3.5 L 3.8,4.2 L 3.5,5.0 L 3.3,6.9 L 3.5,8.0 L 3.8,9.1 L 4.2,9.8 L 4.2,10.1 L 3.9,9.9 L 3.5,9.1 L 3.1,7.3 L 3.1,5.8 L 3.3,4.8 L 3.8,3.7 L 4.1,3.4', sw: 0.49 },
};

function darkenGameoverColor(hex, ratio) {
  if (ratio == null) ratio = 0.55;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const d = (v) => Math.round(v * ratio).toString(16).padStart(2, '0');
  return '#' + d(r) + d(g) + d(b);
}

// ════════════════════════════════════════════
//  GAMEOVER 아이콘 — 48x48 PNG (data-URI 인라인)
//  기존 GAMEOVER_ICON_PIXEL(10x10 도트)를 대체.
//  옛 함수는 남겨두되 호출되지 않음.
// ════════════════════════════════════════════
const GAMEOVER_ICON_PNG = {
  trophy: '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',
  star: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAADAFBMVEX+/tb++qX874j74272z2LyvUzsqj3ioD7ekDTRhjHAcCeSYjR1QyQ6HSQnEiMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABk0tBSAAAAEHRSTlP///////////////////8A4CNdGQAAAlxJREFUeNqVluuCqyAMhBHCJVxy3v9tzwzaLVtr1+ZfKx+ZJAPq/n0Z7uL/Mb4CrLc27CtAUv8CsJa3qM1uA0PFSa7jLjBGBpBuA9Y1bC5EpLCbQPYEkt4GZHMEyj3AavZuAlrftPYMjJqDc54ZbgG2AwFAvgOgRTG4A9B6NsgZqH8Ctsbo0Xt/AKWUMX49BmAdzlxCg/ec2wG0Pp/3I4Y5awld35YIYQHS7+gEsohbw4OYAJZT3wz+rrUyQ2+asARuWIg9Q5LwWC4cS6Mk1AwiYa8nsR2A/OwfsV4bx+L2WVUiEn6YQOBYHTPVo3w26QBaVZQXo8iRZ5siuTrGXHKmrxYAra21zI2QBcE6di3liKnffiZthg5oyrswthWN9uzTsbwegp7WYB1IguQQEcU7KFEGluvs54uX4ImOQqhr9lLmHPb1+tx/NR8GUjVTkndeiohw1Jl6VpsvbsVAKgpgzdCTAmpIOBPr9icAzsPyzUN/RiESeU7rR4D7bwLdOUYPQ8SsHwAN6CYLAMBu0XLw3AdAZvtnQwmgfuS4AtAl3keb5PIASASBpvGuS6OpZ8Gz86r7BOMGgfq+rWOWHOIO0FoEaO18BUQk2PVABBycpyhofA90lW1O4LBCn+eKdSft4wTgypZHgv02oh21cPQB0zubrxecy1h2ObOPA7K0YOLxEhAcXG5vj8HsfkwXgGxxdvA5JpsHC8wZGJo9JlbHGOtYjbpIpPp4pz4A2Jl3r9nL5Ys/Wqsl6SuA6pj33at5XiqvGXgl934FzHvYXoo2M7v6glkfum8/f/4DN1ZjL1NXcWMAAAAASUVORK5CYII=',
  heart: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAADAFBMVEX8sNL6Yqf6VKH5VKD2VJ74Up/kQZDYM4TDKnmyGWikEV6FEFZLCEMsAzcfAiwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABVmU2AAAAEHRSTlP///////////////////8A4CNdGQAAAkFJREFUeNqtlut6gyAMhkE5H9L7v9vlC4JgdVv3LP3RVvImX0JE1etDU38GKlsppZY6L+MSrtb6DpRuM9CvvQG1phiD8yHEeIarNUexnDNVWoASvHNaO+f9ADhp8GLxDKPaSkrOGK2U1sZxOERD+OCMBOG8JRfqAC95zysMAPE+IxpH8RYXt82z1JSKiFJYyRFylGqAcyFzlTkHN0JAVS7IoSS+092fl1lVYMnRu133EMgRE6QqJJgBdmAgoF6oFFsA6Y853Vvh7OGcNAGRjFzgylMhAEt8OFlruQsjgd4NqliA0xm2wfo320/AdgU2+yhpcpLQ/GmEmYHWjjvgJCVDOgAZgC7oxnkHgLYeQJsY3YDb8DvXsADebQD0rB2GCuTHUcETsJ/WflsnEz4BGNZR8H4xCyAMgDCsMh0NON2GyQ3B3omHmNSLmijXK74mQEtbASkTppWBBFWc48adCzYX4NVFuak/kzmMURPUbqBXz8F3tezSosego0GAcYu+iABAlt0nAH+s7/HRIRrHDFQxE7gfS58Qv3eI5nNpAbbRfokfj/jrQUbEZx8ffl5qP4gJ4FOE1rOVgZxae9mxu4djgw/9C8CVZ5aVkMMwYbcGQD6OQnp/PoiqAzjktH7mLucKUEWOVsc+9Od86rk+gbCDSQDc9H5u/wPAOwhRgvSGfgdI7SknP9rJ20XfPhT5OfMhwKqw6a0/mM8fgHMU47v8ZwDN/T3QRzHfuT8AIET/r18dMLy37o/vGkT0GfCPbzNfqUBU+yNkAOEAAAAASUVORK5CYII=',
  skull: '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',
  crown: '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',
  sword: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAADAFBMVEXR8fq32OWpx8uEveaxqJZopuHPelFyeJSrNnRhJGU0MnsrClgVDFYTB1EVBEsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB8ckHdAAAAEHRSTlP///////////////////8A4CNdGQAAAb1JREFUeNqtlu1yhCAMRWX5EAhJ3/9tewOsq60InWl+7YznxAtE3e3rj7Utk7lWWRW4eGO27bUqlOyBb699USh5V97YRaHk3Hi/JvT+1uIGvC0st+W3VVjYVur5vbc+81xAHtt5m2kuvPMob3GDicDUeF/5wlOh56/9fS48myXkOfLvjX8Uzjzy82Raa36jx6s8d/5BQH5rTOP3gx8L5czngx8JOg+3/EBo+Tvvz/whiLB8+Hz0h0Bn/i1IQsldfs8X/hDCy4V+oZRsla/tPRX+uhVQxO885na9FyGGEJMaQlde7t9LQhGF5THX/HbEf4Q9RpeISHaQLb/ln3nOQqq3CCEJqs1n4YdXJTK5GF8cdLvEDvmTQMmlGGqJviDod/7LaKgRUgiuCTsxP7+9kZy0uwrJjfpfhg/3qHgNJTL9PuhGiak4jfmPwOCxp0nPIo0WcNkl8BFRMCE4EpquofJgsfS066zjzJ+Exkc95YLfusXhScB1p5OhDHPBJIaxoAeQtH3qIfC0ktZgDYLmDkesvKx8p/VZcy4i9xKvgtN5SImW+CroPMS1/irEasRFXnfpedhuzkFq/f+/mV7fN3FxEvhqNOUAAAAASUVORK5CYII=',
  shield: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAADAFBMVEXq1JDUv6XarFa9qJq5j16ag8aWeKSHapmGW1xoV5RZSohQPF82KlMaESwNCB8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACPif9nAAAAEHRSTlP///////////////////8A4CNdGQAAAh9JREFUeNqtltuWrCAMRGkNcgv0///tqQRUBO3x4fAya03XthKBlOZ7t4qu25/MrZ7WdV2ovARKIWMWLJ/L30ApmVZTgYWAlJ9AKd7j8cYQ/qqJ5wExXZfsvZenQ8/MyTcXn3L3DhqQOCUojBZD0DvHTGoiDH5k7oGyqFZLJ8ocw/oJkbPfGZi2l7YDR594VIzOfj7WhcQ5NQLtXAAyi+nkVoBtCzEdLn4GMhaKsboAWOcc6mL5vzQyA5xi2OwJbADEBMw9kIJztgOsAlHqegKstZMD1jOwXYBKAGF+5+BU/z+BOJZ0AuaVQwPCD+DqsG0/AJyvHCAb1qp0YJy9GUg3wEeB6JcRkMtCPPdQd46hfwDaI4+ddvVoTIASo0PteQf89YqqxQC4djBk324AWkxv0QGJaQb2mrYT2Drg1HcALHzq7oPbAfYyNyZAbjvhCp1A2FtGRZhn4+QTAhatqE2BqLdHdu3QXwFYxGrhPmt9fkzpYtABWV+UnFiHflfbDERPKc/At7AcKB+d6IHFs6B+7nfTe7cI7gRqQSnfjntMb7HAcDqAtmd9sPT5gDaEwPQLDZj110DJmiIEIiog4+jS8ZRAWU6BoRwFSKofU2vIOCkKrXOSQEG79BRZ/W7IeMcEThjx0I9JOqZornlAuvysn3O6ZK4BKsCsvwl2SVPS9LxJ6ftPh9qIpu3Lbw0cXd8d0BfA9/Fj5gn4Pum//wDBOlr3EkAJ2gAAAABJRU5ErkJggg==',
  flame: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAADAFBMVEX//b//9Zb/5nX+02v7s2T1kV/wdmDoX2HeQGTNNWPGKWWlIl96GVFJDkEoCDYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfw6IRAAAAEHRSTlP///////////////////8A4CNdGQAAAlFJREFUeNqVltt26yAMRLkLccv//+0ZCTu1a+hJWKsPTbSRRhog5vVcA+u1W2b14eitj2+AV291h6yB0Zk3xA4oxO0roBLlOr4BMlGpi26tuzQBLh8DrbAC9SncLBM05pwS8adAq5xj/ASYNaMiohDjJ4BMSxIACDGV9l+gYs+BglIEkMsZP/4AGoBMKYSQTuBm3t8AqmiVsH+IdADw7g6AWgF4AokUgKQdgPkKABtFj/gJYJMdAEMULq2VlKL3mgFdGoU3gBiIMteaFPAyuNLmJmsAxScFfIzhBHrlxDugZgDMAngnQEaBAHK5nAxzMVAhicfQYnBORVCt4tt8UWEuI9AEOjQPQInMavTyBFAQnwAUOyWSEExo108Kc7ZIcuP7fADWOtVN0CRAXQNRAUgGYEW3bJG02UuApOoDMFJVwP9pBWAG0JzJRyIxBoKNsc7BgTT7+z4aJ1APICng30CMbjarLgBE4iSnFEQ0AOtg2iCfrYBSslouii8kARZEiKlCQE1PAE3yQgQXvNV466wIx6KyBtQRwWmTFND5YZcFIF1KCQEAnJsSJuD0ZNTfXeoKWI2YCayMwlrxrUroz8GR1IQB2xsA1WqN8QCQIoolPP4OwBorjspivvHLrU1kx6CAOZZMTwsq7/j7AUIKfwUkQVAnLQ6QdKqwEs68CQyS+bL//ZoBIZfqDyAdna4Ym3vpIO7xrW/vVjw9Mo3wrkf03vZ/PihdHgdF4NK5e//zBeod91mmYEOqrfX++J1iFj9lcHvVJDfq+PDZHedaPcn/AF+0Y/Pf7W4AAAAAAElFTkSuQmCC',
  key: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAADAFBMVEX68KDy23/hw23RrFnLmD20j02xeSyOajeNUillTzN0MypFMCUoGh8XDxsTDBkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADu4FxKAAAAEHRSTlP///////////////////8A4CNdGQAAAhlJREFUeNqNltF2KyEIRRUUVMT8/9/ew6S9bbMmGh7GeWCTAwKT9NiZw+Jc3y+PR9r6M3G1OJlr9yNgmlLOatdJta8DEH4AuPc4icvcA15TKkUkw52ltZKLrQ2wKCWSPqdSLtd5ADwCjw6rLHjOTnICcnFlNpVmWu0IUAYQeXR3MfeeD0DJqaxpVrtJISIkvk9aK+UKE+093lmuy35f1tVL5rhiAMOUo1TrBDQYdyOz2Yu0DwCqADoy6ADGHjDc7WhtsHa0YNcT4CI1DRhSX2vVzHoAcibJMOF4Ere21qZKFpUsYU1rHDps195uRQqzoEvNhipymWszQC6MVq1U2jBfhkzsy/8emI1z4qLKV+1joteX/y1ghj6KIbAn8MduANcSrS1t/OyKHYAZCD0C2b+UvAeWF7ri21x3+b0C3kPPJefW/xWYvVLCrEQ1Hx8Aa4aeqM07/79A1Acd9F7PC2DQkynyvanODYD+odh1zd7H/w2g/inCj7nz/w+sSw/SHTs9vwAMeb527tgK+gZ8Fo7dC39RP0t6thuj+0cT4nlKOuSnq54BcK5qawcsi/gkmNoxuxQs4eFboFN8ayI8pstE6AhEfMHSmh75Yz0eJHVsBxRIUKAVF25vRuEnB42ggo/ytZ+x506t4bFHBm6Czf2xt/Qcyzl9KqNX9SPg+V9iSNnewGu34nsWdfKPgRA25ukH/kzcOoaH/QOaeW9hBXxeFAAAAABJRU5ErkJggg==',
  book: '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',
  hourglass: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAADAFBMVEXm6+nPzMbZpGWbo8G/g3yoZ0l+cIiATHZ3QnRhM19DKV04GFogDEQXBzsRBDkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAApcWkAAAAEHRSTlP///////////////////8A4CNdGQAAAjVJREFUeNqNluuihCAIhCuTRNHe/23PgHZZ19oz/yq+UgSmaa8qUB6rVLXAqcWnsECrc7PKNZEpQElKD/h1Rby7hQMIh76ByCFs20Yg6BQimaNqAMQh0OK/AUkp2RN9aTyUTKLKHVCyRARKlga2cCkWLmeapiOt4pElzyUSnenBmmLxKs5dWhXwBiB+muYzrQHAMgQy25vEzZOpnQeJ3uf4BewZi805OjedqidiBVDy3gM7olni8YEL0Nv5jL8Be2F8egCwj0VGQK7AvDTpnhTwAPYhgHQAcP4GkAH8DKTg1hvA5KJoUscAAciuEXZeqyMsdHkBOKP6/CnnQublGZjxSIKb1loO64wF/QJQZ1FXBSGpWqX+B4ACJSOw/oCrN2DFIwkhgpj8OhMOPoQ3YMOmZSNKEgBMSRKqVYvyCcBJiwIxVSBFBYRRS29L4pSwiWVBSlN6X5IB6ExqwwmbjvEN8LoHpLUVq/uZ1gqQRS+LlXcA8LxpA8i1XqgfIbv7AnDroNkIHHbkN+DquEXXZIT4d2A6AP8P4OhpLEdn/3wAjy3aAHS1NjbKyVL7DBxT42ppHRvCD0BmHe3n1KgtRwrgfhkA4mvXtyHQmpSYP0/uGsZswzgT+TNaQ4tdyuP0VuAmosdxfzNd+TDdw3l72zWLo85G1RW3JxcN6DXqfXozBW30HjBrw/tufoVIbl4nIxetFnoHqus2K/0C4jewVWMfApfuPyQf6tP6U70pfv7sdMqny/0B2s9ZJj74vNwAAAAASUVORK5CYII=',
  coin: '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',
  potion: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAADAFBMVEXw8vjO1N7VwNCrveHNo6vVfol9jcHqUKqnSoTNJ4+VF4RUVIlIPGcfGkINCTgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACXSaF5AAAAEHRSTlP///////////////////8A4CNdGQAAAdxJREFUeNq1lt3W6yAIRBGMPxHt+7/tATWpWdE038WZ284WlIkWPneVU5MfYWLfDvEEgYnf2gfiBmQFDiS8AEretg4Ezi+Bvjzzi5YycxiAnPMjUJIByGETa1A/O+PyM0BApAvXxdnRL4CJTBMiVaVH4MNJFgUAY5rduZx/bDolKVKtqsTl96S7terFHD5FChjoVPm8AwBaT38F6P8D7jcghyRDgHawMrbyfKyFk6TJtLHVEreTvQA5a/j6kBtBjnkJlMyg3dNA3OIH16iqfYA6MeZjBNzh112c6XNAc0A+HjFpVBsgCW+EMePEYSxgyFe/jYdsJWgGFFnJekQF0Heh9d61eUwAME4BFB1+QaNfAxjEcgPinhaAwRAPoCPSkQD7A+AtorXaWCN0489AbwWgmV8C3oN/B+yxm3s7aMW+ApjQNuDsX2cofkk5TyddS2A8+5IKm1ZYRqMCsQPnBtaAzCfs+1Hg6w805vv6PZhQAa0SPVa7Flh8D1kA2vf4VV1f0j1eyHB5fSSA0tU++PVryJymQNIXhxBdCN0t7dcLfwUoITsnjVOTToDlNVoBSX7U9+F7baT6ei2ASoghfdXso/96kVVCX/NDzZ4e7tbUmEFX++z2TqPuf3/+Ae6SZBnXOPTzAAAAAElFTkSuQmCC',
  note: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAADAFBMVEV53fgnuvgUkuYAi/kEcucGUscOQJUAPcAAM68AJpUBB18ABFkAAlwAAlcAAk8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABs/Og/AAAAEHRSTlP///////////////////8A4CNdGQAAAdlJREFUeNqdltt2AyEIRRV1VBTy/39b0Ll36tjw1KyyD0cDGPOZCcJS1j/NFFARcRooiAVsTMyTgIijFYBmACLElEAipjIDqHqM1no/U6HUHAOAteBCGFeoGnLYHLy1RvXjGBAjOUYVt86BmwOCWFfAa4wASV4AjFHxFjOAs0aIPV+OPAIWSZWTnipIdhoCxu7pIUkQg3sD3CYvZiKSnwG8imdmolrfAb2aLPkCMNVWgQZAVxdtaj1NBPNAb6oXwIa8ia+t9QqkespfgTKsUPnSvO+WyhUYjagA8KuCAn9bsr8BeAHi3dL4DF8B9DVAuiX/Y0k3E456qQjgdwCzrBkDoHvpAWhqHVj/Kx+sTrcM9QNQlx5urcBlAduHIz4BiEHXXJu1Doi+bA/n+ta4AaUsC+zD2SxxH74QHisgQpfTPXQCnIuxL5rrgyL6mn8HLGiyWsp4AeikfwA1B4mkfuL+TW5Av74GyJ33a5USqR046va4ABX7Lu35G/BhRnWfEh6tdQF076qJjKsDxtyC7wCh3/ZiDD4V2iwzFXmLzr27AXrbza4QYmiX5BafO8CU5PJWIF2n4RZmV8opthpn/TGQU1gX9ujpPpqP+mNbefxL4gBkrzMx8wvwA+ClaBxru22dAAAAAElFTkSuQmCC',
  eye: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAADAFBMVEX7+/zq6u+jk76xVKfoMZlsVYhYNXbYKZDLJYiiHHRmFlw6IFYsEkApDDkaCS8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACyXHjtAAAAEHRSTlP///////////////////8A4CNdGQAAAhFJREFUeNrtltuSwiAMhjkVAgR8/7fdP4QW7Oqs3m+mU6nNR45EzeNLMf/AkhA+AsLXQLgW4Q1qXnsSrA13o69jkPeJQiKiQPQe2DyAPqVMWW6A7+HdgQShPIXk6easefJFpJTSp2CZlFkeLCCR7F1ra42nyLLCDnwML4ImyoU7x+OIVSXGyL2WPKL/BRAV5nqIxKrUeKj8RJhtf4aec0PTe3/ECEKfN8JoQAggd8Zra8WMdX4gla11LrYOglTTaMYS/Klu6MOMMcbXFp2HESFc7QVAWC6JfnTn/g5A5AaD/qjNDiNcplcDkPQMd6xtTeIw2LN3hHJEAZTIdAIIV/QVGGl1tQFospwAAmk5KyClnfsDQAiRK18A6/dCQBFARz3Ff3sCUJqd0aL3JwDikBbopuO+9O+AO04ARK3cu4FHrfNuwfuqAPK6uXRAm4vEgBp3voIQc4OQunipw6UPRc0SmhQpnARLWh3aDh+XAdHnnOiqA5V2EUiTd0OkN079ymjz50qfBHoj+lOfr/2L6u+91NCbdiLartOfAwkV/bB1K4xkZCsuI3J4VL02tEU6z7VZ8wCnGZkbRdcYxBdJF072GgTrTIcgZ1qqgpJp4XCVMkbHqyGgXxUguFRkfZ9bvwZZwji65lLO9GaQrUDSuNGcR481yN4M47QG4LbD3+P+keizcb9NqS9/sr4G/v8J7PIDouxnTvjyoSAAAAAASUVORK5CYII=',
  mask: 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAADAFBMVEXqv2bPmky4dlmacnueXWqIVGh0UWpsQ3hmOX9TMXQ+Lls/IlosIE0YEDwMBjIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC/d+mxAAAAEHRSTlP///////////////////8A4CNdGQAAAjNJREFUeNrtlcuSGzEIRfVo1BIC/P9/mwtSd7smUxVnkUWqho1twQGJl9PrLyX9AP8GMPvcGrbJ6NBP7fVoliznT2OYpgKglCKfIGaSywJya43/ZM+t0Qao5ZQKQ+zbSGauKyllogBUuWQwKdXavjD42Wp1Xc6Fpi5gCIOFXMyb71o9fDmIiGVsoI8pc4zhGJibgPccF2Eec4qMDTQY915rPXsfzrRA4L6lQtSghQa6MVsAWWDfzxqC8yMlUgjcl/B0+rETyOsD1EsQJWdqRGF/ufEAb8B4A6BuGWmjQudZvwNSG3j2RK5x5mCfxTNDM34MniFQtgAIRetDbYkCcSAjkwDO+SgGykWG9i6JEUK9nCyqs/cJV4iAi7KphMImQqH3+AF2sUQFdmgbYnyqXDUc74Dr5J6KiEG4EPJ42buXSRtAFvHsLq9HefYJ+37bv2AfT1Cfac+Tq68Qqlf276jqTYC6mwRA2e8Eh9FDJrsoMNJ14vb+LjKOrYHaHdNrJy6zP0CfceSFm8iDyQbwneddbfRVium4Owb3mVEEWXtJpYCIDowmaz4uPlLUA/G2cPt4Uiwy4yDGIjBgufgE51QXAP8YuFWUANTEcxtBWoV7wh4RKiBa5AeVx5HyvSrVFGrfHmhqKGEuaq34eOIwP/bXbl3EGnZimEf/MK3lAHvd9vcyRlMqNhSazt2zKxn3onWGb9v+2d7s+hC4v892c+ty8WXdiy6RZwuy/Hb086f4nwK/ABRQZ1F0z2qeAAAAAElFTkSuQmCC',
};

// key가 없으면 trophy로 폴백. size는 표시 픽셀(원본 48과 같게 두면 1:1).
function renderGameoverIconPNG(key, x, y, size) {
  const b64 = GAMEOVER_ICON_PNG[key] || GAMEOVER_ICON_PNG.trophy;
  const href = 'data:image/png;base64,' + b64;
  const pix = 'image-rendering:pixelated;image-rendering:crisp-edges;-ms-interpolation-mode:nearest-neighbor';
  return `<image x="${x}" y="${y}" width="${size}" height="${size}" style="${pix}"`
       + ` image-rendering="pixelated" href="${href}" xlink:href="${href}"/>`;
}

function renderGameoverPixelIcon(key, x, y, dotSize, mainColor) {
  const grid = GAMEOVER_ICON_PIXEL[key] || GAMEOVER_ICON_PIXEL.trophy;
  const shadowColor = darkenGameoverColor(mainColor);
  let dots = '';
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      const ch = grid[row][col];
      if (ch === '1') {
        dots += `<rect x="${x + col*dotSize}" y="${y + row*dotSize}" width="${dotSize}" height="${dotSize}" fill="${mainColor}"/>`;
      } else if (ch === '2') {
        dots += `<rect x="${x + col*dotSize}" y="${y + row*dotSize}" width="${dotSize}" height="${dotSize}" fill="${shadowColor}"/>`;
      }
    }
  }
  return dots;
}

function renderGameoverVectorIcon(key, x, y, size, color) {
  const v = GAMEOVER_ICON_VECTOR[key] || GAMEOVER_ICON_VECTOR.trophy;
  const d = (typeof v === 'string') ? v : v.d;
  const sw = (typeof v === 'string') ? '' : ` stroke="${color}" stroke-width="${v.sw}" stroke-linejoin="round"`;
  return `<g transform="translate(${x},${y}) scale(${size/24})" fill="${color}"><path d="${d}"${sw}/></g>`;
}

function parseGameoverAchievements(ach) {
  if (!ach) return [];
  return ach.split('|').slice(0, 3).map(item => {
    const parts = item.split('§');
    return {
      icon: (parts[0] || 'trophy').trim(),
      title: (parts[1] || '???').trim(),
      desc: (parts[2] || '').trim(),
    };
  });
}

// ─── 라우터 ───
function renderGameover(params) {
  const validStyles = ['modern', 'pixel'];
  const stRaw = (params.get('st') || 'modern').toLowerCase();
  const st = validStyles.includes(stRaw) ? stRaw : 'modern';
  if (st === 'pixel') return renderGameoverPixel(params);
  return renderGameoverModern(params);
}

// ─── MODERN 스타일 ───
function renderGameoverModern(params) {
  const W = 540;
  const title = esc(params.get('title') || 'GAME OVER');
  const cause = esc(params.get('cause') || '');
  const name = esc(params.get('n') || '');
  const sub = esc(params.get('sub') || '');
  const dialog = esc(params.get('d') || '');
  const count = params.get('count');
  const achievements = parseGameoverAchievements(params.get('ach'));

  const HAS_CHAR = name || dialog;
  const charBlockH = HAS_CHAR ? 100 : 0;
  const achBlockH = achievements.length > 0 ? (achievements.length * 70 + 40) : 0;
  const countH = count ? 30 : 0;
  const H = 180 + charBlockH + achBlockH + countH + 30;

  let y = 0;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs><radialGradient id="bg" cx="50%" cy="40%" r="70%">
<stop offset="0%" stop-color="#1a0a14"/><stop offset="100%" stop-color="#000000"/>
</radialGradient></defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>`;

  y = 70;
  svg += `<text x="${W/2}" y="${y}" font-family="'Georgia',serif" font-size="44" font-weight="bold"
fill="#BB6688" text-anchor="middle" letter-spacing="6" opacity="0">${title}<animate attributeName="opacity" values="0;1" dur="1s" begin="0s" fill="freeze" repeatCount="1"/></text>`;

  if (cause) {
    y += 30;
    svg += `<text x="${W/2}" y="${y}" font-family="'Noto Serif KR',Georgia,serif" font-size="14"
fill="#CCAA88" text-anchor="middle" font-style="italic" opacity="0">— ${cause} —<animate attributeName="opacity" values="0;0.85" dur="0.5s" begin="0.6s" fill="freeze" repeatCount="1"/></text>`;
  }

  y += 40;
  svg += `<line x1="${W/2}" y1="${y}" x2="${W/2}" y2="${y}" stroke="#BB6688" stroke-width="1" opacity="0"><animate attributeName="x1" values="${W/2};${W/2-60}" dur="0.7s" begin="1.2s" fill="freeze" repeatCount="1"/><animate attributeName="x2" values="${W/2};${W/2+60}" dur="0.7s" begin="1.2s" fill="freeze" repeatCount="1"/><animate attributeName="opacity" values="0;0.4" dur="0.5s" begin="1.2s" fill="freeze" repeatCount="1"/></line>`;
  y += 30;

  if (HAS_CHAR) {
    if (name) {
      const nameLine = sub ? `${name}  ·  ${sub}` : name;
      svg += `<text x="${W/2}" y="${y}" font-family="'Noto Serif KR',Georgia,serif" font-size="15"
font-weight="bold" fill="#8888CC" text-anchor="middle" letter-spacing="2" opacity="0">${nameLine}<animate attributeName="opacity" values="0;1" dur="0.5s" begin="1.8s" fill="freeze" repeatCount="1"/></text>`;
      y += 28;
    }
    if (dialog) {
      svg += `<text x="${W/2}" y="${y}" font-family="'Noto Serif KR',Georgia,serif" font-size="17"
fill="#f0e0e5" text-anchor="middle" opacity="0">"${dialog}"<animate attributeName="opacity" values="0;1" dur="0.5s" begin="2.2s" fill="freeze" repeatCount="1"/></text>`;
      y += 40;
    }
  }

  if (achievements.length > 0) {
    y += 20;
    svg += `<text x="${W/2}" y="${y}" font-family="monospace" font-size="11" font-weight="bold"
fill="#CCAA88" text-anchor="middle" letter-spacing="3" opacity="0">— ACHIEVEMENTS —<animate attributeName="opacity" values="0;0.7" dur="0.4s" begin="2.6s" fill="freeze" repeatCount="1"/></text>`;
    y += 25;

    achievements.forEach((a, ai) => {
      const aBegin = (2.9 + ai * 0.3).toFixed(2);
      svg += `<g opacity="0"><animate attributeName="opacity" values="0;1" dur="0.4s" begin="${aBegin}s" fill="freeze" repeatCount="1"/>`;
      svg += `<rect x="40" y="${y}" width="${W - 80}" height="60" rx="4"
fill="#1a1018" stroke="#3a2030" stroke-width="1"/>`;
      svg += renderGameoverVectorIcon(a.icon, 54, y + 18, 24, '#DDAACC');
      svg += `<text x="92" y="${y + 26}" font-family="'Noto Serif KR',sans-serif" font-size="14"
font-weight="bold" fill="#DDAACC">${esc(a.title)}</text>`;
      if (a.desc) {
        svg += `<text x="92" y="${y + 46}" font-family="'Noto Serif KR',sans-serif" font-size="12"
fill="#CCAA88" opacity="0.8">${esc(a.desc)}</text>`;
      }
      svg += `</g>`;
      y += 70;
    });
  }

  if (count) {
    y += 15;
    svg += `<text x="${W/2}" y="${y}" font-family="monospace" font-size="12"
fill="#8888CC" text-anchor="middle" opacity="0">DEATH COUNT: ${esc(count)}<animate attributeName="opacity" values="0;0.7" dur="0.4s" begin="4s" fill="freeze" repeatCount="1"/></text>`;
  }

  svg += `</svg>`;
  return svg;
}

// ─── PIXEL 스타일 ───
function renderGameoverPixel(params) {
  const W = 540;
  const title = esc(params.get('title') || 'GAME OVER');
  const cause = esc(params.get('cause') || '');
  const name = esc(params.get('n') || '');
  const sub = esc(params.get('sub') || '');
  const dialog = esc(params.get('d') || '');
  const count = params.get('count');
  const achievements = parseGameoverAchievements(params.get('ach'));

  const HAS_CHAR = name || dialog;
  const charBlockH = HAS_CHAR ? 100 : 0;
  const achBlockH = achievements.length > 0 ? (achievements.length * 70 + 40) : 0;
  const countH = count ? 30 : 0;
  const H = 180 + charBlockH + achBlockH + countH + 30;

  let y = 0;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="#000000"/>`;

  y = 70;
  svg += `<text x="${W/2}" y="${y}" font-family="'Courier New',monospace" font-size="38" font-weight="bold"
fill="#BB6688" text-anchor="middle" letter-spacing="4" opacity="0">${title}<animate attributeName="opacity" values="0;1" dur="1s" begin="0s" fill="freeze" repeatCount="1"/></text>`;

  if (cause) {
    y += 28;
    svg += `<text x="${W/2}" y="${y}" font-family="'Courier New',monospace" font-size="13"
fill="#CCAA88" text-anchor="middle" letter-spacing="1" opacity="0">* ${cause} *<animate attributeName="opacity" values="0;1" dur="0.5s" begin="0.6s" fill="freeze" repeatCount="1"/></text>`;
  }

  y += 40;
  for (let i = 0; i < 15; i++) {
    const dotBegin = (1.2 + i * 0.05).toFixed(2);
    svg += `<rect x="${W/2 - 60 + i*8}" y="${y - 2}" width="3" height="3" fill="#BB6688" opacity="0"><animate attributeName="opacity" values="0;0.5" dur="0.2s" begin="${dotBegin}s" fill="freeze" repeatCount="1"/></rect>`;
  }
  y += 30;

  if (HAS_CHAR) {
    if (name) {
      const nameLine = sub ? `${name} - ${sub}` : name;
      svg += `<text x="${W/2}" y="${y}" font-family="'Courier New',monospace" font-size="14"
font-weight="bold" fill="#8888CC" text-anchor="middle" letter-spacing="2" opacity="0">[ ${nameLine} ]<animate attributeName="opacity" values="0;1" dur="0.5s" begin="1.8s" fill="freeze" repeatCount="1"/></text>`;
      y += 28;
    }
    if (dialog) {
      svg += `<text x="${W/2}" y="${y}" font-family="'Courier New',monospace" font-size="16"
fill="#f0e0e5" text-anchor="middle" opacity="0">"${dialog}"<animate attributeName="opacity" values="0;1" dur="0.5s" begin="2.2s" fill="freeze" repeatCount="1"/></text>`;
      y += 40;
    }
  }

  if (achievements.length > 0) {
    y += 20;
    svg += `<text x="${W/2}" y="${y}" font-family="'Courier New',monospace" font-size="11" font-weight="bold"
fill="#CCAA88" text-anchor="middle" letter-spacing="3" opacity="0">&gt;&gt; ACHIEVEMENTS &lt;&lt;<animate attributeName="opacity" values="0;1" dur="0.4s" begin="2.6s" fill="freeze" repeatCount="1"/></text>`;
    y += 25;

    achievements.forEach((a, ai) => {
      const aBegin = (2.9 + ai * 0.3).toFixed(2);
      svg += `<g opacity="0"><animate attributeName="opacity" values="0;1" dur="0.4s" begin="${aBegin}s" fill="freeze" repeatCount="1"/>`;
      svg += `<rect x="40" y="${y}" width="${W - 80}" height="60" fill="#1a0a14" stroke="#BB6688" stroke-width="2"/>`;
      svg += renderGameoverIconPNG(a.icon, 48, y + 6, 48);
      svg += `<text x="100" y="${y + 26}" font-family="'Courier New',monospace" font-size="14"
font-weight="bold" fill="#DDAACC">${esc(a.title)}</text>`;
      if (a.desc) {
        svg += `<text x="100" y="${y + 46}" font-family="'Courier New',monospace" font-size="11"
fill="#CCAA88">${esc(a.desc)}</text>`;
      }
      svg += `</g>`;
      y += 70;
    });
  }

  if (count) {
    y += 15;
    svg += `<text x="${W/2}" y="${y}" font-family="'Courier New',monospace" font-size="12"
fill="#8888CC" text-anchor="middle" opacity="0">DEATHS: ${esc(count)}<animate attributeName="opacity" values="0;1" dur="0.4s" begin="4s" fill="freeze" repeatCount="1"/></text>`;
  }

  svg += `</svg>`;
  return svg;
}


// ════════════════════════════════════════════
//  INVENTORY (격자 인벤토리/장비창)
//  ?t=inv  &st=dark|mmo|pixel (기본 mmo)
//  &p=주인§소지금§최대칸수
//  &col=가로 열 수
//  &items=[*]이름§등급§타입§스탯§설명§수량|...   (이름 앞 * = 신규 드랍 빛 스윕)
//  &eq=무기§등급§방어구§등급§장신구§등급   (선택 · 있으면 착용 줄 표시)
//  타입: 무기/방어구/장신구→equipIcon 재사용 · 물약/폭탄/열쇠/재료/음식/두루마리/보석/기타→신규 아이콘
//  items 포맷은 reward와 100% 동일 (앞 * 플래그만 추가)
// ════════════════════════════════════════════

function parseInvItems(raw) {
  if (!raw) return [];
  return raw.split('|').slice(0, 60).map(s => {
    const parts = s.split('§');
    let name = (parts[0] || '???').trim() || '???';
    let isNew = false;
    if (name.startsWith('*')) { isNew = true; name = name.slice(1).trim() || '???'; }
    const rawGrade = (parts[1] || 'common').trim();
    return {
      name,
      isNew,
      grade:    normalizeRarity(rawGrade),
      gradeRaw: rawGrade,
      type:     (parts[2] || '').trim(),
      stats:    (parts[3] || '').trim(),
      flavor:   (parts[4] || '').trim(),
      qty:      safeInt(parts[5], 1, 1, 999),
    };
  });
}

// 슬롯 중앙(cx,cy)에 아이콘 배치. 장비 3종은 기존 equipIcon 재사용, 나머지는 신규 벡터.
// 최종 stroke ~2px 유지 (scale 보정).
const INV_FILL_ICONS = {
  potion: 'M 13.3,17.7 L 12.9,17.8 L 12.5,18.2 L 12.4,18.6 L 12.3,18.8 L 12.3,18.9 L 12.3,19.4 L 12.3,19.4 L 12.4,19.7 L 12.5,20.0 L 12.7,20.2 L 12.7,20.2 L 13.2,20.6 L 13.2,20.6 L 13.4,20.7 L 13.6,20.7 L 13.7,20.7 L 14.0,20.7 L 14.0,20.7 L 14.4,20.6 L 14.8,20.3 L 15.0,20.1 L 15.2,19.9 L 15.2,19.8 L 15.3,19.6 L 15.3,19.5 L 15.4,19.4 L 15.4,18.8 L 15.3,18.8 L 15.3,18.6 L 15.1,18.3 L 14.6,17.8 L 14.5,17.8 L 14.3,17.7 L 14.2,17.7 L 14.1,17.6 L 13.5,17.6 L 13.4,17.7 L 13.3,17.7 M 13.6,18.3 L 14.0,18.3 L 14.3,18.4 L 14.6,18.7 L 14.7,19.0 L 14.7,19.0 L 14.7,19.3 L 14.6,19.6 L 14.3,19.9 L 14.0,20.0 L 13.6,20.0 L 13.3,19.9 L 13.0,19.5 L 13.0,19.3 L 12.9,19.3 L 12.9,19.0 L 13.0,19.0 L 13.0,18.7 L 13.1,18.6 L 13.4,18.4 L 13.6,18.3 M 7.9,16.4 L 7.5,16.7 L 7.2,17.1 L 7.2,17.2 L 7.2,17.2 L 7.2,17.8 L 7.2,17.8 L 7.2,17.9 L 7.4,18.2 L 7.6,18.4 L 7.8,18.6 L 7.9,18.6 L 8.0,18.6 L 8.2,18.6 L 8.3,18.6 L 8.7,18.6 L 9.0,18.4 L 9.2,18.2 L 9.3,17.9 L 9.3,17.8 L 9.4,17.8 L 9.4,17.2 L 9.3,17.2 L 9.3,17.1 L 9.2,16.8 L 9.0,16.6 L 8.7,16.4 L 8.5,16.4 L 8.5,16.4 L 8.1,16.4 L 8.0,16.4 L 7.9,16.4 M 8.2,17.0 L 8.4,17.0 L 8.5,17.1 L 8.7,17.4 L 8.7,17.6 L 8.7,17.7 L 8.4,17.9 L 8.2,17.9 L 8.1,17.9 L 7.8,17.6 L 7.9,17.3 L 8.0,17.1 L 8.2,17.0 M 15.9,15.3 L 15.5,15.5 L 15.3,15.7 L 15.0,16.1 L 15.0,16.3 L 15.0,16.4 L 15.0,16.5 L 15.0,16.5 L 15.0,16.7 L 15.2,17.0 L 15.5,17.4 L 15.8,17.5 L 16.2,17.6 L 16.3,17.5 L 16.4,17.5 L 16.7,17.4 L 17.0,17.1 L 17.2,16.7 L 17.2,16.2 L 17.2,16.2 L 17.1,15.9 L 16.8,15.5 L 16.6,15.4 L 16.5,15.4 L 16.3,15.3 L 15.9,15.3 M 16.1,16.0 L 16.3,16.0 L 16.4,16.1 L 16.6,16.3 L 16.5,16.6 L 16.3,16.9 L 16.0,16.9 L 15.7,16.7 L 15.7,16.6 L 15.7,16.5 L 15.7,16.3 L 15.7,16.2 L 15.9,16.0 L 16.0,16.0 L 16.1,16.0 M 5.6,14.3 L 5.5,14.7 L 5.5,14.7 L 5.5,15.0 L 5.4,15.0 L 5.4,15.4 L 5.4,15.4 L 5.4,16.6 L 5.4,16.6 L 5.4,17.0 L 5.5,17.0 L 5.5,17.2 L 5.5,17.3 L 5.6,17.7 L 5.7,17.8 L 5.7,18.1 L 5.8,18.3 L 5.9,18.5 L 6.3,19.4 L 6.7,19.9 L 7.1,20.4 L 7.1,20.4 L 7.9,21.2 L 8.3,21.5 L 8.4,21.5 L 8.6,21.7 L 9.0,21.8 L 9.1,21.9 L 9.2,21.9 L 9.7,22.2 L 9.8,22.2 L 10.0,22.3 L 10.1,22.3 L 10.3,22.4 L 10.7,22.5 L 10.8,22.5 L 10.9,22.5 L 11.0,22.5 L 11.3,22.5 L 11.4,22.6 L 12.7,22.6 L 12.8,22.5 L 13.1,22.5 L 13.1,22.5 L 13.3,22.5 L 13.3,22.5 L 13.5,22.5 L 13.9,22.3 L 14.0,22.3 L 14.1,22.3 L 14.3,22.2 L 14.5,22.1 L 14.6,22.1 L 15.4,21.7 L 16.0,21.3 L 16.4,20.9 L 16.5,20.9 L 16.9,20.5 L 16.9,20.4 L 17.4,19.9 L 17.7,19.5 L 17.7,19.4 L 17.8,19.3 L 18.1,18.6 L 18.1,18.5 L 18.2,18.4 L 18.2,18.3 L 18.4,17.8 L 18.4,17.7 L 18.5,17.4 L 18.5,17.2 L 18.6,17.2 L 18.6,17.0 L 18.6,16.9 L 18.6,16.5 L 18.6,16.5 L 18.6,15.5 L 18.6,15.5 L 18.6,15.0 L 18.6,15.0 L 18.6,14.8 L 18.5,14.7 L 18.5,14.6 L 18.5,14.5 L 18.4,14.2 L 18.4,14.1 L 18.1,13.9 L 10.4,13.9 L 10.3,13.9 L 10.2,14.1 L 10.2,14.4 L 10.3,14.6 L 10.4,14.6 L 10.5,14.6 L 17.8,14.6 L 17.8,14.7 L 17.8,14.9 L 17.9,14.9 L 17.9,15.2 L 17.9,15.3 L 17.9,15.8 L 18.0,15.9 L 18.0,16.1 L 17.9,16.2 L 17.9,16.7 L 17.9,16.8 L 17.8,17.3 L 17.7,17.7 L 17.7,17.8 L 17.6,17.9 L 17.6,18.0 L 17.4,18.4 L 17.4,18.5 L 17.3,18.8 L 17.2,18.9 L 17.1,19.1 L 16.9,19.4 L 16.8,19.6 L 15.9,20.5 L 14.9,21.2 L 14.4,21.5 L 14.3,21.5 L 14.1,21.6 L 14.0,21.6 L 13.6,21.7 L 13.4,21.7 L 13.3,21.8 L 12.9,21.8 L 12.9,21.9 L 12.5,21.9 L 12.4,21.9 L 11.6,21.9 L 11.6,21.9 L 11.2,21.9 L 11.1,21.8 L 10.7,21.8 L 10.5,21.7 L 10.3,21.7 L 10.3,21.7 L 9.9,21.6 L 8.9,21.0 L 8.2,20.5 L 7.5,19.8 L 6.8,18.9 L 6.4,18.1 L 6.4,18.0 L 6.3,17.7 L 6.2,17.3 L 6.2,17.3 L 6.2,16.8 L 6.1,16.8 L 6.1,16.3 L 6.1,16.3 L 6.1,15.7 L 6.1,15.7 L 6.1,15.2 L 6.2,15.2 L 6.2,14.7 L 6.3,14.6 L 8.7,14.6 L 8.9,14.5 L 9.0,14.4 L 9.0,14.1 L 8.8,13.9 L 8.7,13.9 L 8.7,13.9 L 5.9,13.9 L 5.7,14.1 L 5.6,14.3 M 18.9,3.4 L 18.7,3.5 L 18.6,3.8 L 18.6,4.0 L 18.5,4.1 L 18.4,4.4 L 18.3,4.5 L 18.3,4.6 L 18.2,4.9 L 18.0,5.4 L 17.8,5.5 L 17.5,5.5 L 17.4,5.6 L 17.1,5.7 L 17.0,5.8 L 16.8,5.8 L 16.6,5.9 L 16.4,6.0 L 16.1,6.1 L 16.0,6.4 L 16.1,6.4 L 16.1,6.5 L 16.3,6.7 L 16.4,6.7 L 16.5,6.8 L 16.9,6.9 L 17.0,7.0 L 17.3,7.0 L 17.4,7.1 L 17.5,7.1 L 17.7,7.2 L 18.0,7.3 L 18.1,7.5 L 18.1,7.7 L 18.2,7.8 L 18.3,8.1 L 18.4,8.2 L 18.5,8.6 L 18.6,8.7 L 18.6,8.8 L 18.6,9.0 L 18.7,9.2 L 18.8,9.3 L 19.2,9.3 L 19.4,9.1 L 19.4,8.8 L 19.6,8.5 L 19.6,8.2 L 19.8,7.8 L 20.0,7.4 L 20.1,7.3 L 20.3,7.2 L 20.5,7.1 L 20.7,7.1 L 20.9,7.0 L 21.1,7.0 L 21.2,6.9 L 21.3,6.9 L 21.8,6.7 L 21.9,6.5 L 22.0,6.3 L 21.9,6.3 L 21.9,6.2 L 21.8,6.1 L 21.6,6.0 L 21.4,5.9 L 21.0,5.7 L 20.9,5.7 L 20.9,5.7 L 20.6,5.6 L 20.5,5.5 L 20.2,5.5 L 20.1,5.4 L 20.0,5.4 L 19.9,5.1 L 19.8,4.9 L 19.7,4.7 L 19.7,4.5 L 19.6,4.4 L 19.6,4.3 L 19.5,4.1 L 19.5,4.0 L 19.3,3.6 L 19.2,3.4 L 18.9,3.4 M 19.0,4.8 L 19.1,4.8 L 19.1,4.9 L 19.2,5.1 L 19.2,5.3 L 19.3,5.4 L 19.3,5.5 L 19.4,5.9 L 19.6,6.0 L 19.7,6.0 L 19.8,6.1 L 20.4,6.2 L 20.6,6.3 L 20.5,6.4 L 19.9,6.6 L 19.4,6.9 L 19.4,7.0 L 19.3,7.3 L 19.2,7.4 L 19.2,7.7 L 19.0,7.9 L 18.9,7.9 L 18.9,7.8 L 18.8,7.7 L 18.6,7.0 L 18.5,6.8 L 17.4,6.4 L 17.5,6.3 L 17.6,6.3 L 17.9,6.1 L 18.4,6.0 L 18.6,5.8 L 18.7,5.4 L 18.8,5.3 L 18.8,5.1 L 19.0,4.8 M 4.1,2.0 L 4.0,2.0 L 3.9,2.2 L 3.9,2.3 L 3.9,2.4 L 3.8,2.6 L 3.7,2.8 L 3.7,2.9 L 3.6,3.0 L 3.5,3.3 L 3.2,3.5 L 3.1,3.5 L 2.9,3.7 L 2.6,3.7 L 2.5,3.8 L 2.3,3.9 L 2.1,3.9 L 2.0,4.2 L 2.1,4.3 L 2.1,4.4 L 2.2,4.5 L 2.3,4.5 L 2.4,4.6 L 2.5,4.6 L 2.8,4.7 L 3.4,4.9 L 3.5,5.0 L 3.5,5.1 L 3.6,5.3 L 3.7,5.5 L 3.8,5.6 L 3.8,5.9 L 3.9,6.0 L 3.9,6.1 L 4.0,6.3 L 4.2,6.4 L 4.4,6.4 L 4.6,6.3 L 4.6,6.1 L 4.6,6.0 L 4.7,5.9 L 4.7,5.8 L 4.9,5.5 L 5.0,5.0 L 5.1,4.9 L 5.4,4.9 L 5.5,4.8 L 5.6,4.8 L 5.9,4.6 L 6.3,4.5 L 6.5,4.4 L 6.5,4.2 L 6.4,3.9 L 5.1,3.4 L 5.0,3.2 L 4.9,3.0 L 4.8,2.9 L 4.8,2.6 L 4.7,2.5 L 4.7,2.4 L 4.6,2.1 L 4.4,2.0 L 4.1,2.0 M 4.3,3.3 L 4.4,3.6 L 4.5,3.8 L 4.6,4.0 L 4.7,4.0 L 4.9,4.1 L 5.0,4.1 L 5.2,4.2 L 5.0,4.3 L 4.9,4.3 L 4.8,4.4 L 4.6,4.4 L 4.5,4.5 L 4.5,4.7 L 4.4,4.8 L 4.4,4.9 L 4.3,5.1 L 4.2,4.9 L 4.2,4.8 L 4.1,4.7 L 4.0,4.5 L 3.9,4.4 L 3.6,4.3 L 3.4,4.2 L 3.4,4.1 L 3.7,4.1 L 3.8,4.0 L 3.9,4.0 L 4.0,3.9 L 4.3,3.3 M 10.9,0.0 L 10.8,0.0 L 10.7,0.0 L 10.3,0.3 L 10.1,0.5 L 10.0,0.8 L 10.0,0.9 L 10.0,1.0 L 10.0,2.4 L 9.9,2.5 L 9.5,2.5 L 9.5,2.5 L 9.3,2.6 L 9.0,2.8 L 8.8,3.1 L 8.8,5.2 L 8.9,5.4 L 9.2,5.7 L 9.4,5.8 L 9.8,5.8 L 9.9,5.9 L 9.9,8.2 L 9.8,8.3 L 9.5,8.4 L 9.3,8.5 L 8.9,8.6 L 7.9,9.1 L 7.7,9.3 L 7.6,9.2 L 7.6,8.9 L 7.5,8.8 L 7.4,8.5 L 7.3,8.4 L 7.3,8.3 L 7.1,7.8 L 7.0,7.7 L 6.7,7.7 L 6.5,7.9 L 6.4,8.2 L 6.3,8.3 L 6.3,8.5 L 6.2,8.7 L 6.2,8.9 L 6.1,9.1 L 6.1,9.2 L 6.0,9.3 L 5.9,9.5 L 5.9,9.5 L 5.6,9.6 L 5.5,9.7 L 5.3,9.7 L 5.1,9.8 L 4.9,9.9 L 4.7,10.0 L 4.5,10.0 L 4.4,10.1 L 4.3,10.1 L 4.1,10.2 L 4.1,10.4 L 4.1,10.5 L 4.1,10.6 L 4.3,10.7 L 4.5,10.8 L 4.7,10.8 L 4.8,10.9 L 5.1,11.0 L 5.2,11.1 L 5.3,11.1 L 5.5,11.2 L 5.5,11.3 L 5.3,11.6 L 5.3,11.7 L 5.0,12.0 L 4.6,12.9 L 4.6,13.0 L 4.5,13.1 L 4.5,13.2 L 4.3,13.8 L 4.3,13.9 L 4.2,14.0 L 4.2,14.1 L 4.1,14.4 L 4.1,14.6 L 4.1,14.7 L 4.1,14.9 L 4.0,14.9 L 4.0,15.3 L 4.0,15.4 L 4.0,16.6 L 4.0,16.6 L 4.0,17.0 L 4.1,17.1 L 4.1,17.6 L 4.2,17.7 L 4.3,18.2 L 4.3,18.2 L 4.5,18.9 L 4.6,19.0 L 4.6,19.1 L 5.1,20.1 L 5.5,20.8 L 5.7,20.9 L 5.9,21.2 L 6.7,22.0 L 6.8,22.0 L 7.2,22.5 L 7.9,22.9 L 8.9,23.4 L 9.0,23.4 L 9.1,23.5 L 9.2,23.5 L 9.8,23.7 L 10.0,23.7 L 10.0,23.8 L 10.1,23.8 L 10.4,23.9 L 10.6,23.9 L 10.6,23.9 L 11.3,24.0 L 11.3,24.0 L 12.7,24.0 L 12.8,24.0 L 13.1,24.0 L 13.2,23.9 L 13.4,23.9 L 13.5,23.9 L 13.9,23.8 L 13.9,23.8 L 14.2,23.7 L 14.6,23.6 L 14.7,23.6 L 14.8,23.5 L 15.2,23.4 L 16.1,22.9 L 16.4,22.7 L 16.5,22.6 L 16.5,22.4 L 16.3,22.2 L 16.1,22.1 L 15.6,22.4 L 14.5,22.9 L 14.4,22.9 L 14.2,23.0 L 14.1,23.0 L 13.9,23.1 L 13.8,23.1 L 13.7,23.2 L 13.5,23.2 L 13.5,23.2 L 13.3,23.2 L 13.2,23.2 L 13.0,23.2 L 12.9,23.3 L 12.5,23.3 L 12.4,23.3 L 11.6,23.3 L 11.6,23.3 L 11.1,23.3 L 11.1,23.2 L 10.5,23.2 L 10.5,23.2 L 10.1,23.1 L 10.0,23.0 L 9.8,23.0 L 9.8,23.0 L 9.5,22.9 L 9.4,22.8 L 9.3,22.8 L 9.2,22.7 L 9.1,22.7 L 8.0,22.2 L 7.3,21.7 L 6.8,21.1 L 6.8,21.1 L 6.3,20.7 L 6.3,20.6 L 6.0,20.2 L 5.7,19.8 L 5.6,19.6 L 5.5,19.5 L 5.1,18.5 L 5.1,18.4 L 5.0,18.2 L 5.0,18.0 L 4.9,17.8 L 4.9,17.7 L 4.8,17.7 L 4.8,17.5 L 4.8,17.4 L 4.8,17.2 L 4.7,17.2 L 4.7,16.9 L 4.7,16.9 L 4.6,15.7 L 4.7,15.6 L 4.7,15.1 L 4.7,15.1 L 4.7,14.8 L 4.8,14.7 L 4.8,14.3 L 4.9,14.3 L 4.9,14.1 L 5.0,13.9 L 5.0,13.8 L 5.0,13.8 L 5.1,13.5 L 5.6,12.4 L 5.7,12.3 L 5.9,11.9 L 6.1,11.7 L 6.2,12.0 L 6.2,12.3 L 6.3,12.4 L 6.3,12.5 L 6.5,13.0 L 6.8,13.2 L 7.0,13.1 L 7.1,13.0 L 7.1,12.9 L 7.3,12.5 L 7.3,12.4 L 7.5,12.2 L 7.5,11.9 L 7.6,11.8 L 7.7,11.4 L 7.9,11.3 L 8.0,11.3 L 8.4,11.1 L 8.6,11.0 L 8.7,10.9 L 9.0,10.9 L 9.1,10.8 L 9.3,10.8 L 9.5,10.6 L 9.6,10.3 L 9.4,10.1 L 8.9,10.0 L 8.3,9.7 L 8.4,9.6 L 9.1,9.3 L 9.2,9.3 L 9.3,9.2 L 9.4,9.2 L 9.5,9.1 L 9.6,9.1 L 10.0,8.9 L 10.1,8.9 L 10.3,8.8 L 10.5,8.6 L 10.6,8.4 L 10.6,5.9 L 10.6,5.8 L 13.4,5.8 L 13.5,5.9 L 13.5,8.4 L 13.6,8.6 L 13.8,8.8 L 13.9,8.9 L 14.5,9.1 L 15.5,9.5 L 15.6,9.6 L 15.9,9.7 L 16.7,10.3 L 17.2,10.8 L 17.2,10.8 L 17.3,10.9 L 17.7,11.3 L 18.1,11.9 L 18.2,12.0 L 18.7,12.9 L 18.7,13.0 L 18.8,13.2 L 18.8,13.3 L 18.9,13.4 L 18.9,13.5 L 19.1,14.0 L 19.1,14.1 L 19.2,14.4 L 19.2,14.6 L 19.3,14.6 L 19.3,14.8 L 19.3,14.8 L 19.3,15.1 L 19.4,15.2 L 19.4,15.8 L 19.4,15.9 L 19.4,16.1 L 19.4,16.2 L 19.4,16.8 L 19.3,16.9 L 19.3,17.1 L 19.3,17.2 L 19.3,17.4 L 19.2,17.5 L 19.1,18.0 L 19.1,18.0 L 18.9,18.6 L 18.7,18.9 L 18.7,19.0 L 18.3,19.8 L 17.9,20.4 L 17.4,21.0 L 17.4,21.1 L 17.5,21.3 L 17.7,21.4 L 17.9,21.4 L 18.0,21.4 L 18.4,20.9 L 19.0,20.0 L 19.4,19.2 L 19.4,19.1 L 19.5,19.0 L 19.5,18.9 L 19.6,18.7 L 19.6,18.6 L 19.7,18.3 L 19.7,18.2 L 19.9,17.8 L 19.9,17.4 L 20.0,17.3 L 20.0,16.6 L 20.1,16.5 L 20.1,15.5 L 20.0,15.4 L 20.0,15.0 L 20.0,14.9 L 20.0,14.7 L 19.9,14.6 L 19.9,14.2 L 19.8,14.1 L 19.8,14.0 L 19.7,13.8 L 19.7,13.7 L 19.7,13.6 L 19.6,13.2 L 19.1,12.1 L 18.3,11.0 L 17.3,9.9 L 17.2,9.9 L 16.8,9.5 L 16.0,9.0 L 15.2,8.6 L 15.1,8.6 L 14.9,8.5 L 14.3,8.3 L 14.2,8.2 L 14.2,5.9 L 14.2,5.8 L 14.7,5.8 L 14.8,5.7 L 15.2,5.3 L 15.2,5.2 L 15.2,5.2 L 15.2,3.1 L 15.0,2.8 L 14.8,2.6 L 14.5,2.5 L 14.1,2.5 L 14.1,2.4 L 14.1,1.0 L 14.0,1.0 L 14.0,0.8 L 13.9,0.5 L 13.8,0.3 L 13.7,0.3 L 13.5,0.1 L 13.2,0.0 L 10.9,0.0 M 6.8,9.1 L 6.9,9.1 L 6.9,9.2 L 7.0,9.3 L 7.1,9.8 L 7.3,10.1 L 7.5,10.1 L 7.7,10.2 L 7.9,10.3 L 8.0,10.3 L 8.2,10.4 L 8.2,10.5 L 7.9,10.5 L 7.8,10.6 L 7.6,10.7 L 7.4,10.8 L 7.3,10.8 L 7.2,10.9 L 7.2,11.0 L 7.0,11.4 L 7.0,11.6 L 6.9,11.7 L 6.8,11.7 L 6.8,11.6 L 6.7,11.5 L 6.5,11.0 L 6.3,10.8 L 5.9,10.6 L 5.5,10.4 L 5.7,10.3 L 5.9,10.2 L 6.4,10.0 L 6.8,9.1 M 9.5,3.3 L 9.6,3.2 L 14.5,3.2 L 14.6,3.3 L 14.6,5.0 L 14.5,5.1 L 9.6,5.1 L 9.5,5.0 L 9.5,3.3 M 10.7,0.9 L 10.8,0.8 L 11.0,0.7 L 13.0,0.7 L 13.2,0.8 L 13.4,1.0 L 13.4,2.4 L 13.3,2.5 L 10.7,2.5 L 10.7,2.4 L 10.7,1.0 L 10.7,0.9',
  bomb: 'M 3.9,16.0 L 3.7,16.3 L 3.7,17.0 L 3.8,17.1 L 3.8,17.3 L 3.8,17.4 L 3.9,17.9 L 4.0,18.4 L 4.3,18.8 L 4.3,18.9 L 4.6,19.4 L 5.2,20.1 L 5.6,20.5 L 6.1,20.9 L 6.8,21.2 L 7.0,21.3 L 7.2,21.4 L 7.8,21.5 L 7.9,21.6 L 8.1,21.6 L 8.2,21.6 L 8.9,21.7 L 9.2,21.6 L 9.3,21.4 L 9.3,21.3 L 9.3,21.0 L 9.2,20.8 L 9.0,20.7 L 8.5,20.7 L 8.5,20.7 L 8.0,20.6 L 7.2,20.4 L 6.5,20.0 L 5.7,19.3 L 5.1,18.5 L 5.1,18.3 L 4.9,17.9 L 4.7,17.3 L 4.6,16.3 L 4.5,16.1 L 4.4,16.0 L 4.2,16.0 L 4.2,16.0 L 3.9,16.0 M 19.1,8.7 L 18.9,8.8 L 18.8,8.9 L 18.7,9.2 L 18.7,10.7 L 18.7,10.8 L 18.7,10.9 L 18.9,11.1 L 19.3,11.1 L 19.4,11.1 L 19.6,10.9 L 19.6,10.8 L 19.6,9.1 L 19.6,9.0 L 19.4,8.8 L 19.1,8.7 M 20.0,8.3 L 19.7,8.6 L 19.7,8.9 L 19.8,9.1 L 20.9,10.1 L 21.1,10.2 L 21.4,10.2 L 21.6,10.1 L 21.7,9.9 L 21.7,9.7 L 21.6,9.5 L 20.5,8.4 L 20.2,8.3 L 20.0,8.3 M 20.2,7.7 L 20.2,7.8 L 20.3,8.0 L 20.5,8.2 L 22.3,8.2 L 22.5,8.0 L 22.6,7.8 L 22.5,7.5 L 22.5,7.4 L 22.3,7.3 L 20.5,7.3 L 20.3,7.4 L 20.2,7.7 M 21.5,5.3 L 21.4,5.2 L 21.0,5.2 L 20.9,5.3 L 19.9,6.3 L 19.8,6.5 L 19.8,6.8 L 20.0,7.1 L 20.3,7.1 L 20.5,7.0 L 21.6,6.0 L 21.7,5.8 L 21.7,5.5 L 21.5,5.3 M 19.3,4.3 L 19.0,4.3 L 18.9,4.4 L 18.7,4.6 L 18.7,4.7 L 18.7,4.7 L 18.7,6.3 L 18.8,6.5 L 18.9,6.6 L 19.2,6.7 L 19.4,6.6 L 19.6,6.5 L 19.6,6.3 L 19.6,4.6 L 19.5,4.5 L 19.3,4.3 M 12.6,0.0 L 11.6,0.0 L 11.0,0.2 L 10.5,0.5 L 10.0,0.9 L 9.5,1.6 L 9.3,2.3 L 9.3,4.8 L 9.3,4.9 L 7.7,4.9 L 7.7,4.9 L 7.5,4.9 L 7.1,5.2 L 6.9,5.6 L 6.9,7.8 L 6.6,8.0 L 6.2,8.1 L 5.4,8.6 L 4.2,9.4 L 3.4,10.2 L 2.6,11.4 L 2.2,12.2 L 1.6,13.7 L 1.6,13.9 L 1.6,13.9 L 1.6,14.1 L 1.5,14.4 L 1.5,15.2 L 1.4,15.3 L 1.4,16.2 L 1.5,16.2 L 1.5,16.6 L 1.5,16.7 L 1.5,17.0 L 1.5,17.0 L 1.6,17.7 L 2.1,19.1 L 2.7,20.1 L 2.8,20.3 L 3.1,20.8 L 3.6,21.3 L 4.1,21.9 L 4.8,22.5 L 5.4,22.8 L 6.3,23.3 L 6.6,23.4 L 6.9,23.5 L 7.3,23.6 L 7.6,23.8 L 8.5,23.9 L 8.5,24.0 L 8.9,24.0 L 9.0,24.0 L 10.5,24.0 L 10.6,24.0 L 10.9,24.0 L 11.0,23.9 L 11.2,23.9 L 11.2,23.9 L 12.0,23.7 L 13.3,23.2 L 14.1,22.8 L 14.8,22.3 L 15.5,21.8 L 16.1,21.1 L 16.5,20.6 L 17.1,19.5 L 17.6,18.5 L 17.7,18.2 L 17.8,17.8 L 17.9,17.0 L 18.0,17.0 L 18.0,16.5 L 18.0,16.5 L 18.0,14.9 L 18.0,14.8 L 18.0,14.5 L 17.9,14.4 L 17.8,13.6 L 17.4,12.4 L 17.0,11.5 L 16.5,10.8 L 16.0,10.1 L 15.0,9.2 L 14.2,8.6 L 13.7,8.4 L 13.6,8.3 L 12.6,7.8 L 12.6,5.6 L 12.4,5.3 L 12.3,5.1 L 12.0,4.9 L 11.9,4.9 L 11.8,4.9 L 10.3,4.9 L 10.2,4.8 L 10.2,2.5 L 10.3,2.2 L 10.5,1.8 L 10.7,1.5 L 11.1,1.2 L 11.7,0.9 L 12.5,0.9 L 12.8,1.0 L 13.2,1.2 L 13.6,1.6 L 13.9,2.1 L 13.9,2.3 L 14.0,2.4 L 14.0,2.8 L 14.0,2.8 L 14.0,5.8 L 14.1,5.9 L 14.1,6.1 L 14.2,6.5 L 14.7,7.2 L 15.2,7.7 L 15.7,8.0 L 16.4,8.2 L 19.4,8.2 L 19.4,8.1 L 19.6,7.9 L 19.6,7.6 L 19.6,7.5 L 19.4,7.3 L 16.8,7.3 L 16.7,7.2 L 16.4,7.2 L 15.9,7.0 L 15.3,6.5 L 15.1,6.1 L 15.0,5.8 L 15.0,5.5 L 14.9,5.4 L 14.9,2.4 L 14.7,1.6 L 14.3,0.9 L 13.8,0.5 L 13.2,0.2 L 12.6,0.0 M 9.6,8.3 L 10.6,8.3 L 10.6,8.4 L 11.2,8.4 L 11.2,8.5 L 11.9,8.6 L 12.2,8.7 L 12.6,8.8 L 13.8,9.5 L 14.7,10.1 L 15.5,11.1 L 16.3,12.2 L 16.3,12.3 L 16.6,12.9 L 16.7,13.3 L 16.8,13.4 L 16.9,13.8 L 17.0,14.1 L 17.0,14.4 L 17.1,14.7 L 17.1,15.1 L 17.1,15.2 L 17.1,16.2 L 17.1,16.3 L 17.0,17.0 L 17.0,17.0 L 17.0,17.2 L 17.0,17.2 L 16.9,17.8 L 16.6,18.3 L 16.6,18.6 L 16.3,19.2 L 15.5,20.4 L 15.0,20.9 L 14.5,21.4 L 13.3,22.2 L 12.7,22.5 L 11.8,22.8 L 11.7,22.8 L 11.3,22.9 L 11.0,22.9 L 10.7,23.0 L 10.3,23.0 L 10.2,23.1 L 8.8,23.0 L 8.8,23.0 L 8.2,22.9 L 8.0,22.8 L 7.5,22.7 L 7.4,22.6 L 6.9,22.5 L 6.1,22.1 L 5.5,21.7 L 4.8,21.2 L 4.2,20.6 L 3.6,19.7 L 2.9,18.5 L 2.8,18.1 L 2.7,17.8 L 2.7,17.7 L 2.5,17.1 L 2.4,16.5 L 2.4,16.5 L 2.4,15.8 L 2.3,15.8 L 2.4,14.8 L 2.5,14.5 L 2.5,14.2 L 2.8,13.1 L 3.1,12.5 L 3.1,12.4 L 3.5,11.7 L 4.0,11.0 L 4.4,10.6 L 5.1,9.9 L 5.5,9.6 L 6.7,8.9 L 7.4,8.7 L 7.6,8.6 L 7.7,8.6 L 8.3,8.4 L 8.9,8.4 L 8.9,8.3 L 9.5,8.3 L 9.6,8.3 M 7.8,5.9 L 7.9,5.8 L 11.6,5.8 L 11.6,5.9 L 11.6,7.5 L 11.6,7.6 L 11.5,7.6 L 11.2,7.5 L 10.6,7.4 L 10.5,7.4 L 9.0,7.4 L 9.0,7.4 L 8.6,7.4 L 8.5,7.5 L 8.3,7.5 L 8.3,7.5 L 7.9,7.6 L 7.8,7.5 L 7.8,5.9',
  key: 'M 0.0,11.8 L 0.0,12.2 L 0.1,12.6 L 0.3,13.0 L 0.5,13.2 L 0.9,13.6 L 1.3,13.8 L 2.2,13.8 L 2.4,13.7 L 2.5,13.8 L 2.4,13.9 L 2.5,14.6 L 2.6,15.0 L 2.8,15.4 L 3.1,15.7 L 3.6,16.1 L 4.2,16.4 L 4.4,16.4 L 4.4,16.4 L 5.1,16.4 L 5.8,16.2 L 6.1,16.0 L 6.6,15.5 L 6.9,15.0 L 7.1,14.2 L 7.0,13.9 L 7.5,13.7 L 7.9,13.6 L 8.4,13.1 L 8.6,13.4 L 8.8,13.4 L 9.0,13.2 L 9.1,12.9 L 16.0,12.9 L 16.1,13.1 L 16.3,13.2 L 16.7,13.2 L 16.8,13.4 L 17.0,13.4 L 17.1,13.2 L 17.3,12.9 L 18.7,12.9 L 18.7,12.9 L 18.7,13.3 L 18.7,13.3 L 18.1,13.3 L 18.1,15.5 L 18.1,15.6 L 18.2,15.5 L 19.0,15.5 L 19.1,15.6 L 19.2,15.5 L 19.2,14.2 L 19.3,14.1 L 19.8,14.1 L 19.9,14.1 L 19.9,15.5 L 19.9,15.6 L 20.9,15.6 L 21.0,15.5 L 21.0,15.6 L 21.1,15.5 L 21.1,14.1 L 21.1,14.1 L 21.7,14.1 L 21.8,14.1 L 21.8,15.5 L 21.8,15.6 L 21.8,15.5 L 22.9,15.5 L 22.9,13.3 L 22.3,13.3 L 22.2,13.3 L 22.2,12.9 L 22.3,12.9 L 23.5,12.9 L 23.9,12.6 L 24.0,12.3 L 24.0,11.7 L 23.9,11.4 L 23.6,11.2 L 23.4,11.1 L 23.4,11.2 L 17.8,11.2 L 17.8,11.1 L 17.3,11.1 L 17.2,10.8 L 17.0,10.6 L 16.9,10.6 L 16.7,10.9 L 16.2,10.9 L 16.2,10.9 L 16.0,11.2 L 9.1,11.2 L 8.9,10.8 L 8.7,10.6 L 8.6,10.7 L 8.4,10.9 L 8.4,10.9 L 7.9,10.5 L 7.3,10.2 L 7.1,10.2 L 7.0,10.1 L 7.1,9.8 L 6.9,9.2 L 6.5,8.4 L 6.1,8.0 L 5.6,7.8 L 5.2,7.6 L 4.8,7.6 L 4.8,7.6 L 4.0,7.7 L 3.3,8.1 L 2.8,8.6 L 2.5,9.2 L 2.4,9.7 L 2.5,10.3 L 2.4,10.3 L 2.2,10.2 L 1.7,10.2 L 1.2,10.3 L 0.9,10.4 L 0.7,10.6 L 0.4,10.9 L 0.2,11.2 L 0.0,11.8 M 4.4,12.8 L 5.0,12.8 L 5.3,12.9 L 5.8,13.4 L 6.0,13.8 L 6.0,14.2 L 6.0,14.2 L 6.0,14.4 L 5.9,14.7 L 5.5,15.1 L 5.0,15.4 L 4.5,15.4 L 4.0,15.1 L 3.7,14.8 L 3.5,14.4 L 3.4,14.0 L 3.5,14.0 L 3.5,13.8 L 3.7,13.4 L 4.0,13.0 L 4.4,12.8 M 1.6,11.3 L 2.0,11.3 L 2.2,11.4 L 2.5,11.7 L 2.5,11.9 L 2.5,12.1 L 2.4,12.4 L 2.2,12.6 L 2.0,12.7 L 1.7,12.7 L 1.5,12.6 L 1.2,12.3 L 1.1,12.2 L 1.1,11.8 L 1.2,11.6 L 1.4,11.4 L 1.6,11.3 M 4.7,8.6 L 4.8,8.7 L 5.0,8.7 L 5.4,8.9 L 5.8,9.2 L 6.0,9.6 L 6.0,9.9 L 6.0,9.9 L 5.9,10.4 L 5.7,10.8 L 5.4,11.1 L 4.9,11.2 L 4.4,11.2 L 4.0,11.0 L 3.6,10.6 L 3.5,10.3 L 3.5,10.1 L 3.4,10.0 L 3.5,9.6 L 3.8,9.1 L 4.1,8.9 L 4.3,8.7 L 4.7,8.6',
  ore: 'M 21.6,23.2 L 21.6,24.0 L 22.4,24.0 L 22.4,23.2 L 21.6,23.2 M 20.0,23.2 L 20.0,24.0 L 20.8,24.0 L 20.8,23.2 L 20.0,23.2 M 20.7,3.2 L 20.5,3.3 L 20.4,3.4 L 20.4,4.0 L 20.1,4.6 L 19.8,4.8 L 19.4,5.1 L 19.2,5.2 L 18.6,5.2 L 18.5,5.4 L 18.4,5.6 L 18.5,5.8 L 18.6,6.0 L 19.2,6.0 L 19.4,6.1 L 19.8,6.3 L 20.1,6.6 L 20.3,7.0 L 20.4,7.7 L 20.5,7.9 L 20.7,8.0 L 20.9,8.0 L 21.2,7.7 L 21.2,7.3 L 21.3,7.0 L 21.7,6.5 L 21.9,6.2 L 22.3,6.1 L 22.8,6.0 L 23.1,5.9 L 23.2,5.7 L 23.2,5.4 L 23.0,5.2 L 22.3,5.1 L 21.7,4.7 L 21.5,4.5 L 21.2,3.9 L 21.2,3.6 L 21.1,3.3 L 20.9,3.2 L 20.7,3.2 M 20.8,4.9 L 21.5,5.6 L 20.8,6.2 L 20.1,5.6 L 20.8,4.9 M 12.2,0.0 L 11.7,0.0 L 7.0,3.2 L 6.8,3.5 L 6.8,4.1 L 6.9,4.1 L 6.9,4.6 L 6.9,4.7 L 6.9,5.3 L 7.0,5.3 L 7.0,5.8 L 7.0,5.9 L 7.0,6.4 L 7.0,6.5 L 7.0,7.0 L 7.1,7.0 L 7.1,7.6 L 7.1,7.7 L 7.1,8.2 L 7.2,8.2 L 7.2,8.8 L 7.2,8.8 L 7.2,9.3 L 7.3,9.4 L 7.5,12.3 L 7.4,12.4 L 4.4,9.8 L 4.1,9.6 L 3.8,9.6 L 3.5,10.0 L 0.0,15.9 L 0.0,16.2 L 0.4,17.1 L 0.5,17.5 L 0.6,17.6 L 0.8,18.4 L 0.9,18.5 L 2.6,23.1 L 2.5,23.2 L 1.6,23.2 L 1.6,24.0 L 19.2,24.0 L 19.2,23.2 L 18.5,23.2 L 18.5,23.2 L 24.0,15.7 L 24.0,15.2 L 23.9,15.0 L 23.8,14.5 L 23.7,14.3 L 23.6,13.8 L 23.5,13.6 L 22.5,9.6 L 22.3,9.3 L 22.2,9.2 L 21.9,9.2 L 21.7,9.3 L 17.1,12.8 L 16.9,13.0 L 16.0,14.8 L 16.0,14.9 L 15.9,15.1 L 15.8,15.1 L 16.0,13.2 L 16.1,12.7 L 16.1,12.4 L 16.2,11.9 L 16.2,11.6 L 16.3,11.1 L 16.3,10.8 L 16.4,10.3 L 16.4,10.0 L 16.5,9.5 L 16.5,9.2 L 16.6,8.7 L 16.6,8.4 L 16.7,7.9 L 16.7,7.6 L 16.8,7.1 L 16.8,6.8 L 16.9,6.3 L 16.9,6.0 L 17.0,5.5 L 17.0,5.2 L 17.0,4.7 L 17.0,4.4 L 17.1,3.9 L 17.2,3.1 L 17.0,2.8 L 12.2,0.0 M 22.3,16.7 L 22.3,16.7 L 17.5,23.1 L 17.4,23.2 L 16.7,23.2 L 16.7,23.2 L 16.8,22.9 L 16.9,22.8 L 19.4,18.0 L 19.8,17.8 L 19.9,17.8 L 22.3,16.7 M 1.1,16.6 L 3.8,17.5 L 3.9,17.5 L 4.1,17.6 L 4.2,17.8 L 6.2,23.2 L 6.2,23.2 L 3.5,23.2 L 3.4,23.2 L 2.8,21.4 L 2.6,20.9 L 2.5,20.5 L 2.3,20.0 L 2.2,19.6 L 1.9,19.1 L 1.8,18.7 L 1.6,18.2 L 1.5,17.8 L 1.3,17.3 L 1.2,17.0 L 1.0,16.7 L 1.1,16.6 M 8.4,14.8 L 8.4,14.8 L 8.4,23.2 L 8.4,23.2 L 7.1,23.2 L 4.9,17.4 L 5.3,17.0 L 8.4,14.8 M 17.2,14.2 L 18.7,17.4 L 18.7,17.7 L 15.8,23.2 L 15.7,23.2 L 13.1,23.2 L 13.1,23.1 L 13.3,22.6 L 13.3,22.5 L 13.6,22.0 L 13.6,21.9 L 13.9,21.4 L 13.9,21.3 L 14.2,20.8 L 14.2,20.7 L 14.5,20.1 L 14.5,20.1 L 14.7,19.5 L 14.7,19.4 L 15.0,18.9 L 15.0,18.8 L 15.3,18.3 L 15.3,18.2 L 15.6,17.7 L 15.6,17.6 L 15.9,17.1 L 15.9,17.0 L 16.2,16.5 L 16.2,16.4 L 16.4,15.9 L 17.1,14.3 L 17.2,14.2 M 3.6,11.4 L 3.7,11.8 L 3.7,12.6 L 3.8,12.6 L 3.8,13.4 L 3.8,13.5 L 3.8,14.3 L 3.9,14.3 L 3.9,15.1 L 3.9,15.2 L 3.9,16.0 L 3.9,16.0 L 3.9,16.6 L 3.9,16.6 L 3.0,16.4 L 1.0,15.8 L 1.1,15.6 L 3.6,11.4 M 22.0,11.0 L 23.2,15.4 L 22.6,15.6 L 22.5,15.6 L 22.1,15.9 L 20.0,16.8 L 19.9,16.8 L 20.0,16.5 L 20.1,16.3 L 21.9,11.1 L 22.0,11.0 M 4.5,10.9 L 8.1,14.0 L 4.8,16.4 L 4.7,16.1 L 4.7,15.3 L 4.6,15.2 L 4.6,14.4 L 4.6,14.4 L 4.6,13.6 L 4.6,13.5 L 4.6,12.7 L 4.5,12.7 L 4.5,11.9 L 4.5,11.8 L 4.5,11.0 L 4.4,11.0 L 4.5,10.9 M 21.1,10.8 L 21.2,10.8 L 21.1,11.0 L 19.5,15.5 L 19.2,16.5 L 17.7,13.3 L 21.1,10.8 M 10.1,6.8 L 13.1,6.8 L 13.2,6.8 L 13.2,7.5 L 13.1,7.6 L 13.0,9.5 L 13.0,9.6 L 13.0,10.2 L 12.9,10.2 L 12.9,10.8 L 12.9,10.9 L 12.9,11.6 L 12.8,11.6 L 12.8,12.2 L 12.8,12.3 L 12.8,12.9 L 12.7,12.9 L 12.7,13.6 L 12.7,13.6 L 12.7,14.2 L 12.6,14.3 L 12.6,14.9 L 12.6,14.9 L 12.6,15.6 L 12.5,15.6 L 12.4,19.0 L 12.3,19.0 L 12.3,19.6 L 12.3,19.7 L 12.3,20.3 L 12.2,20.3 L 12.2,21.0 L 12.2,21.0 L 12.2,21.7 L 12.1,21.7 L 12.1,22.3 L 12.1,22.4 L 12.1,23.0 L 12.0,23.2 L 11.2,23.2 L 11.1,23.0 L 11.1,22.4 L 11.1,22.3 L 11.0,20.3 L 10.9,20.3 L 10.9,19.7 L 10.9,19.6 L 10.9,19.0 L 10.8,19.0 L 10.8,18.3 L 10.8,18.3 L 10.8,17.7 L 10.8,17.6 L 10.8,17.0 L 10.7,17.0 L 10.7,16.3 L 10.7,16.3 L 10.7,15.6 L 10.6,15.6 L 10.6,15.0 L 10.6,14.9 L 10.6,14.3 L 10.5,14.2 L 10.5,13.6 L 10.5,13.6 L 10.5,13.0 L 10.4,12.9 L 10.4,12.3 L 10.4,12.2 L 10.4,11.6 L 10.3,11.6 L 10.3,10.9 L 10.3,10.9 L 10.3,10.2 L 10.2,10.2 L 10.2,9.6 L 10.2,9.5 L 10.2,8.9 L 10.1,8.9 L 10.1,8.2 L 10.1,8.2 L 10.1,7.6 L 10.1,7.5 L 10.1,6.9 L 10.0,6.9 L 10.1,6.8 M 7.7,4.8 L 9.2,6.5 L 9.2,6.8 L 9.3,6.8 L 9.3,8.8 L 9.4,8.9 L 9.5,10.8 L 9.5,10.9 L 9.6,12.9 L 9.7,12.9 L 9.8,14.9 L 9.8,14.9 L 9.9,16.9 L 10.0,17.0 L 10.1,18.9 L 10.1,19.0 L 10.2,20.9 L 10.2,21.0 L 10.3,23.0 L 10.4,23.0 L 10.3,23.2 L 9.3,23.2 L 9.2,23.2 L 9.2,14.0 L 9.2,13.8 L 8.4,13.1 L 8.3,12.9 L 8.2,10.6 L 8.1,10.5 L 8.1,10.0 L 8.1,10.0 L 8.1,9.4 L 8.0,9.3 L 8.0,8.8 L 8.0,8.8 L 8.0,8.2 L 7.9,8.2 L 7.7,5.3 L 7.7,5.3 L 7.7,4.9 L 7.7,4.8 M 16.2,4.4 L 16.3,4.4 L 16.3,4.7 L 16.2,4.7 L 16.2,5.1 L 16.2,5.2 L 15.9,7.5 L 15.8,7.9 L 15.8,8.3 L 15.7,8.7 L 15.7,9.1 L 15.6,9.5 L 15.6,9.9 L 15.5,10.3 L 15.5,10.7 L 15.5,11.1 L 15.5,11.5 L 15.4,11.9 L 15.4,12.3 L 15.3,12.7 L 15.3,13.1 L 15.2,13.5 L 15.2,13.9 L 15.1,14.3 L 15.1,14.7 L 15.0,15.1 L 15.0,15.5 L 14.9,15.9 L 14.7,17.5 L 14.6,17.9 L 13.0,21.3 L 13.0,21.3 L 13.0,21.0 L 13.0,20.9 L 13.0,20.3 L 13.1,20.2 L 13.2,18.3 L 13.2,18.2 L 13.2,17.6 L 13.2,17.6 L 13.2,17.0 L 13.3,16.9 L 13.3,16.3 L 13.3,16.2 L 13.3,15.6 L 13.4,15.5 L 13.4,14.9 L 13.4,14.9 L 13.4,14.2 L 13.5,14.2 L 13.5,13.6 L 13.5,13.5 L 13.5,12.9 L 13.6,12.9 L 13.7,10.8 L 13.7,10.8 L 13.8,8.8 L 13.9,8.8 L 13.9,8.2 L 13.9,8.1 L 13.9,7.5 L 13.9,7.5 L 13.9,6.8 L 14.0,6.6 L 16.2,4.4 M 16.2,3.3 L 13.4,6.0 L 9.8,6.0 L 7.8,3.7 L 12.0,0.8 L 16.2,3.3 M 2.2,0.0 L 2.0,0.2 L 2.0,0.7 L 1.7,1.3 L 1.3,1.7 L 1.0,1.9 L 0.7,2.0 L 0.2,2.0 L 0.0,2.2 L 0.0,2.5 L 0.2,2.8 L 0.9,2.9 L 1.4,3.1 L 1.7,3.5 L 2.0,4.1 L 2.0,4.4 L 2.1,4.6 L 2.2,4.7 L 2.4,4.8 L 2.6,4.7 L 2.8,4.5 L 2.8,4.0 L 3.1,3.5 L 3.5,3.1 L 3.9,2.9 L 4.6,2.7 L 4.7,2.6 L 4.8,2.3 L 4.7,2.1 L 4.6,2.0 L 4.1,2.0 L 3.8,1.9 L 3.3,1.6 L 3.0,1.2 L 2.9,0.9 L 2.8,0.2 L 2.7,0.1 L 2.5,0.0 L 2.2,0.0 M 2.3,1.7 L 3.1,2.4 L 2.8,2.6 L 2.4,3.1 L 1.7,2.4 L 2.1,2.1 L 2.3,1.7',
  food: 'M 23.1,1.0 L 22.8,0.8 L 22.5,0.6 L 22.0,0.4 L 21.5,0.2 L 21.0,0.1 L 20.6,0.0 L 20.5,0.0 L 19.5,0.0 L 19.5,0.0 L 19.1,0.0 L 19.1,0.1 L 18.5,0.2 L 18.0,0.3 L 17.7,0.4 L 17.7,0.4 L 16.7,0.7 L 15.8,1.2 L 15.5,1.2 L 15.5,1.2 L 15.3,1.2 L 15.3,1.1 L 14.5,1.1 L 14.4,1.1 L 14.1,1.1 L 14.0,1.2 L 13.7,1.2 L 12.8,1.4 L 12.3,1.5 L 11.9,1.7 L 11.3,2.1 L 11.0,2.6 L 10.8,3.0 L 10.6,3.4 L 10.6,3.7 L 10.6,3.7 L 10.6,4.4 L 10.6,4.5 L 10.3,4.4 L 10.3,4.4 L 10.2,4.4 L 10.2,4.4 L 9.6,4.4 L 9.5,4.4 L 9.3,4.4 L 9.3,4.5 L 8.8,4.5 L 8.2,4.7 L 7.7,4.8 L 7.3,5.1 L 6.8,5.4 L 6.5,5.7 L 6.3,6.0 L 6.0,6.4 L 5.8,7.0 L 5.7,7.5 L 5.6,7.8 L 5.6,7.8 L 5.6,8.6 L 5.6,8.6 L 5.5,8.6 L 5.1,8.6 L 4.3,8.9 L 3.7,9.2 L 3.2,9.4 L 2.9,9.7 L 2.4,10.2 L 2.2,10.6 L 2.0,10.9 L 1.8,11.5 L 1.8,11.6 L 1.8,11.7 L 1.7,12.0 L 1.7,12.5 L 1.6,12.6 L 1.6,13.5 L 1.5,13.7 L 1.1,14.4 L 0.8,15.1 L 0.5,16.0 L 0.3,16.9 L 0.3,17.0 L 0.2,17.4 L 0.2,17.5 L 0.1,17.9 L 0.1,18.1 L 0.1,18.1 L 0.0,18.5 L 0.0,18.6 L 0.0,18.9 L 0.0,18.9 L 0.0,20.1 L 0.0,20.2 L 0.0,20.4 L 0.1,20.4 L 0.1,20.5 L 0.1,20.6 L 0.1,20.9 L 0.2,21.4 L 0.5,22.0 L 0.7,22.4 L 0.9,22.8 L 1.3,23.2 L 1.5,23.4 L 1.9,23.6 L 2.5,23.9 L 2.9,24.0 L 3.2,24.0 L 3.2,24.0 L 3.9,24.0 L 3.9,24.0 L 4.1,24.0 L 4.1,24.0 L 4.3,24.0 L 4.3,23.9 L 4.7,23.9 L 5.5,23.7 L 6.6,23.3 L 7.3,22.9 L 8.2,22.4 L 9.3,21.6 L 10.2,20.9 L 11.4,20.0 L 12.5,19.0 L 13.9,17.7 L 16.5,15.1 L 18.7,12.8 L 19.5,11.9 L 20.6,10.7 L 21.3,9.7 L 22.1,8.6 L 22.7,7.6 L 23.1,6.7 L 23.5,5.9 L 23.8,4.8 L 23.8,4.7 L 23.9,4.4 L 23.9,4.0 L 24.0,4.0 L 24.0,3.8 L 24.0,3.8 L 24.0,2.8 L 23.9,2.3 L 23.7,1.8 L 23.5,1.4 L 23.1,1.0 M 2.6,13.3 L 2.9,13.1 L 3.4,13.0 L 3.7,12.9 L 3.7,12.9 L 4.6,12.9 L 4.6,12.9 L 4.8,12.9 L 4.8,13.0 L 4.9,13.0 L 5.0,13.0 L 5.4,13.1 L 5.8,13.2 L 6.1,13.3 L 6.1,13.3 L 6.7,13.5 L 7.1,13.7 L 7.3,13.8 L 7.3,13.9 L 7.2,14.0 L 7.0,14.0 L 7.0,14.0 L 6.5,14.0 L 6.5,14.0 L 6.0,14.0 L 6.0,13.9 L 5.3,13.9 L 4.7,13.7 L 4.6,13.7 L 4.4,13.7 L 4.3,13.7 L 3.2,13.4 L 2.6,13.4 L 2.6,13.3 M 6.4,8.7 L 6.6,8.5 L 6.9,8.3 L 7.1,8.2 L 7.4,8.1 L 7.7,8.1 L 7.7,8.1 L 8.5,8.1 L 8.6,8.1 L 8.7,8.1 L 8.8,8.1 L 8.9,8.1 L 9.2,8.2 L 10.2,8.5 L 10.8,8.7 L 11.5,9.1 L 12.1,9.5 L 12.3,9.7 L 12.4,9.8 L 12.4,9.9 L 12.4,10.0 L 12.3,10.0 L 12.0,10.0 L 12.0,10.1 L 11.4,10.0 L 11.4,10.0 L 11.3,10.0 L 10.8,9.9 L 9.5,9.6 L 7.3,8.9 L 7.2,8.9 L 7.1,8.8 L 6.6,8.7 L 6.5,8.7 L 6.4,8.7 M 11.0,4.5 L 11.1,4.4 L 11.4,4.3 L 11.8,4.3 L 12.0,4.2 L 12.1,4.2 L 12.3,4.2 L 12.3,4.2 L 13.1,4.2 L 13.1,4.2 L 13.5,4.2 L 13.5,4.3 L 13.7,4.3 L 14.1,4.3 L 14.9,4.6 L 15.6,4.9 L 15.8,5.1 L 16.0,5.3 L 16.1,5.5 L 16.2,5.6 L 16.1,5.7 L 15.8,5.7 L 15.8,5.7 L 15.6,5.7 L 15.6,5.6 L 15.1,5.6 L 13.7,5.2 L 12.1,4.7 L 11.0,4.5 M 22.5,1.8 L 22.7,2.0 L 22.8,2.2 L 23.0,2.6 L 23.0,2.9 L 23.0,2.9 L 23.0,3.4 L 23.0,3.4 L 23.0,3.9 L 23.0,3.9 L 23.0,4.0 L 22.9,4.1 L 22.9,4.4 L 22.6,5.3 L 22.2,6.2 L 21.8,7.0 L 21.4,7.7 L 20.9,8.5 L 20.4,9.2 L 19.4,10.4 L 17.8,12.3 L 16.9,13.2 L 15.4,14.8 L 12.9,17.3 L 11.7,18.4 L 10.6,19.4 L 9.6,20.2 L 8.7,20.9 L 7.6,21.6 L 7.0,22.0 L 6.4,22.3 L 5.6,22.6 L 4.7,22.9 L 4.2,23.0 L 4.2,23.0 L 4.0,23.0 L 4.0,23.0 L 3.2,23.0 L 3.2,23.0 L 3.1,23.0 L 2.8,22.9 L 2.3,22.7 L 1.9,22.5 L 1.7,22.1 L 1.5,21.9 L 1.3,21.5 L 1.2,21.0 L 1.2,20.9 L 1.1,20.6 L 1.0,20.1 L 1.0,20.1 L 1.0,19.0 L 1.0,19.0 L 1.0,18.7 L 1.0,18.6 L 1.0,18.4 L 1.0,18.4 L 1.1,18.0 L 1.4,16.8 L 1.8,15.4 L 2.3,14.3 L 2.4,14.3 L 2.4,14.3 L 2.8,14.4 L 4.2,14.7 L 4.3,14.7 L 4.5,14.7 L 4.6,14.7 L 4.7,14.8 L 5.2,14.8 L 5.4,14.9 L 5.7,14.9 L 5.7,14.9 L 6.4,15.0 L 6.4,15.0 L 7.3,15.0 L 7.3,15.0 L 7.5,15.0 L 7.7,14.9 L 7.9,14.8 L 8.1,14.7 L 8.4,14.4 L 8.5,14.1 L 8.5,13.8 L 8.5,13.6 L 8.4,13.5 L 8.1,13.2 L 7.8,12.9 L 7.5,12.8 L 7.1,12.6 L 6.5,12.3 L 5.6,12.1 L 5.0,12.0 L 5.0,12.0 L 4.6,11.9 L 4.6,11.9 L 4.3,11.9 L 4.2,11.9 L 3.6,11.9 L 3.6,11.9 L 3.4,11.9 L 3.4,12.0 L 3.2,12.0 L 2.8,12.1 L 2.8,12.1 L 2.8,11.9 L 3.0,11.3 L 3.2,10.9 L 3.3,10.7 L 3.6,10.4 L 4.1,10.1 L 4.7,9.8 L 5.3,9.6 L 5.4,9.6 L 5.5,9.6 L 5.9,9.6 L 5.9,9.6 L 6.1,9.6 L 6.5,9.7 L 7.3,9.9 L 9.0,10.4 L 9.0,10.4 L 9.1,10.5 L 9.2,10.5 L 10.0,10.7 L 10.9,11.0 L 11.3,11.0 L 11.4,11.0 L 11.5,11.0 L 11.6,11.1 L 12.1,11.1 L 12.5,11.0 L 12.7,10.9 L 13.0,10.7 L 13.2,10.5 L 13.4,10.2 L 13.4,10.1 L 13.4,9.6 L 13.3,9.4 L 13.1,9.1 L 12.7,8.7 L 12.4,8.5 L 11.8,8.1 L 11.2,7.8 L 10.2,7.4 L 9.6,7.2 L 9.0,7.1 L 9.0,7.1 L 8.9,7.1 L 8.9,7.1 L 8.3,7.1 L 8.3,7.1 L 7.6,7.1 L 7.6,7.1 L 7.5,7.1 L 7.1,7.2 L 6.9,7.3 L 6.8,7.2 L 7.0,6.8 L 7.3,6.3 L 7.6,6.0 L 7.8,5.9 L 8.3,5.6 L 9.0,5.5 L 9.4,5.4 L 9.4,5.4 L 10.6,5.4 L 11.7,5.7 L 14.0,6.3 L 15.0,6.6 L 15.1,6.6 L 15.5,6.6 L 15.7,6.6 L 15.7,6.7 L 16.2,6.7 L 16.3,6.6 L 16.5,6.6 L 16.8,6.5 L 17.0,6.2 L 17.2,6.0 L 17.2,5.9 L 17.2,5.5 L 17.1,5.2 L 16.9,4.8 L 16.7,4.6 L 16.4,4.3 L 16.0,4.0 L 15.6,3.8 L 15.0,3.6 L 14.3,3.4 L 14.0,3.3 L 13.9,3.3 L 13.8,3.3 L 13.5,3.3 L 13.4,3.2 L 12.5,3.2 L 12.4,3.3 L 12.2,3.3 L 12.2,3.3 L 12.1,3.3 L 11.7,3.4 L 11.7,3.3 L 11.7,3.2 L 11.9,3.0 L 12.1,2.7 L 12.4,2.6 L 13.1,2.3 L 13.6,2.2 L 14.0,2.2 L 14.0,2.1 L 14.2,2.1 L 14.3,2.1 L 15.2,2.1 L 15.3,2.1 L 15.5,2.1 L 15.5,2.2 L 16.0,2.2 L 16.6,1.9 L 17.6,1.4 L 18.4,1.2 L 19.4,1.0 L 20.2,1.0 L 20.2,1.0 L 20.6,1.0 L 21.2,1.1 L 21.6,1.3 L 22.0,1.4 L 22.2,1.6 L 22.5,1.8',
  scroll: 'M 19.7,19.9 L 19.4,20.2 L 19.4,20.5 L 19.7,20.8 L 20.0,20.8 L 20.3,20.5 L 20.3,20.2 L 20.0,19.9 L 19.7,19.9 M 8.4,14.5 L 8.4,14.7 L 8.5,14.9 L 8.7,15.1 L 17.8,15.1 L 18.0,15.0 L 18.1,14.7 L 18.1,14.4 L 17.8,14.2 L 8.7,14.2 L 8.5,14.3 L 8.4,14.5 M 8.4,11.9 L 8.4,12.1 L 8.5,12.3 L 8.7,12.4 L 17.8,12.4 L 18.0,12.4 L 18.1,12.0 L 18.1,11.8 L 17.8,11.6 L 8.7,11.6 L 8.5,11.7 L 8.4,11.9 M 8.4,9.3 L 8.4,9.5 L 8.5,9.7 L 8.7,9.8 L 17.8,9.8 L 18.0,9.7 L 18.1,9.4 L 18.1,9.2 L 17.8,8.9 L 8.7,8.9 L 8.5,9.1 L 8.4,9.3 M 8.4,6.6 L 8.4,6.9 L 8.5,7.0 L 8.7,7.2 L 17.8,7.2 L 18.0,7.1 L 18.1,6.8 L 18.1,6.5 L 17.8,6.3 L 8.7,6.3 L 8.5,6.4 L 8.4,6.6 M 10.4,3.9 L 10.4,4.3 L 10.7,4.6 L 17.8,4.6 L 18.0,4.5 L 18.1,4.1 L 18.1,3.9 L 17.8,3.7 L 10.7,3.7 L 10.4,3.9 M 8.7,3.7 L 8.5,3.8 L 8.4,4.0 L 8.4,4.2 L 8.5,4.4 L 8.7,4.6 L 9.0,4.6 L 9.2,4.5 L 9.3,4.3 L 9.3,4.1 L 9.3,3.9 L 9.2,3.8 L 9.0,3.7 L 8.7,3.7 M 1.2,0.5 L 0.8,0.9 L 0.5,1.4 L 0.2,2.0 L 0.0,2.5 L 0.0,3.9 L 0.1,4.4 L 0.4,5.0 L 0.6,5.3 L 1.1,5.8 L 1.4,6.0 L 1.9,6.2 L 4.8,6.2 L 4.9,6.2 L 4.9,13.8 L 5.0,13.9 L 6.0,14.6 L 4.9,15.7 L 4.9,20.7 L 4.9,20.8 L 5.0,21.3 L 5.2,22.1 L 5.4,22.5 L 5.8,23.0 L 6.3,23.5 L 6.7,23.7 L 7.1,23.9 L 7.6,24.0 L 21.4,24.0 L 22.1,23.8 L 22.8,23.4 L 23.4,22.8 L 23.8,22.1 L 24.0,21.4 L 24.0,20.4 L 23.8,19.8 L 23.3,19.0 L 22.9,18.5 L 22.5,18.3 L 22.1,18.0 L 21.5,17.8 L 21.5,7.5 L 21.4,7.3 L 20.1,6.4 L 21.1,5.8 L 21.3,5.5 L 21.2,5.3 L 20.9,5.0 L 20.2,4.5 L 20.2,4.2 L 20.3,4.1 L 21.2,4.1 L 21.5,3.9 L 21.5,2.3 L 21.3,1.6 L 20.9,1.1 L 20.4,0.5 L 19.8,0.2 L 19.2,0.0 L 2.3,0.0 L 1.8,0.1 L 1.2,0.5 M 9.9,23.1 L 10.1,22.7 L 10.5,22.0 L 10.6,21.5 L 10.7,20.9 L 10.7,20.8 L 18.2,20.8 L 18.5,20.5 L 18.5,20.2 L 18.2,19.9 L 10.7,19.9 L 10.6,19.8 L 10.4,19.3 L 10.1,18.8 L 10.1,18.7 L 20.9,18.7 L 21.0,18.8 L 21.4,18.8 L 21.8,18.9 L 22.4,19.3 L 22.7,19.7 L 22.9,20.1 L 23.1,20.5 L 23.1,20.9 L 23.1,20.9 L 23.1,21.4 L 22.9,21.8 L 22.7,22.1 L 22.1,22.7 L 21.8,22.9 L 21.4,23.1 L 21.0,23.1 L 20.9,23.1 L 10.0,23.1 L 9.9,23.1 M 5.0,0.9 L 18.7,0.9 L 19.4,1.0 L 19.7,1.2 L 20.1,1.6 L 20.3,1.8 L 20.5,2.3 L 20.6,3.2 L 20.5,3.2 L 19.6,3.2 L 19.4,3.4 L 19.3,3.6 L 19.3,4.8 L 19.9,5.4 L 19.0,6.0 L 18.8,6.3 L 18.8,6.5 L 19.0,6.8 L 20.6,7.9 L 20.6,17.8 L 20.5,17.8 L 8.0,17.8 L 7.4,18.1 L 6.9,18.6 L 6.7,19.0 L 6.6,19.4 L 6.6,19.9 L 6.7,20.3 L 6.9,20.7 L 7.1,21.0 L 7.5,21.3 L 8.0,21.5 L 8.5,21.5 L 8.6,21.4 L 8.8,21.2 L 8.8,20.9 L 8.5,20.6 L 8.1,20.5 L 7.7,20.2 L 7.6,19.9 L 7.6,19.4 L 7.7,19.1 L 8.0,18.8 L 8.4,18.7 L 8.5,18.8 L 8.7,18.8 L 9.0,19.0 L 9.3,19.3 L 9.7,20.0 L 9.8,20.8 L 9.6,21.7 L 9.4,22.1 L 9.2,22.5 L 8.7,22.9 L 8.4,23.1 L 8.0,23.1 L 7.3,23.0 L 6.9,22.7 L 6.4,22.3 L 6.2,21.9 L 6.0,21.4 L 5.8,20.8 L 5.8,20.1 L 5.8,20.0 L 5.8,19.9 L 5.8,16.0 L 7.2,14.8 L 7.2,14.4 L 7.0,14.1 L 6.5,13.9 L 5.8,13.3 L 5.8,3.9 L 5.8,3.9 L 5.8,3.1 L 5.6,2.2 L 5.2,1.3 L 4.9,0.9 L 5.0,0.9 M 1.9,1.1 L 2.2,1.0 L 2.6,0.9 L 2.7,0.9 L 3.1,0.9 L 3.7,1.1 L 4.0,1.3 L 4.4,1.7 L 4.6,2.3 L 4.8,3.1 L 4.8,3.8 L 4.9,3.8 L 4.9,5.2 L 4.8,5.3 L 3.9,5.3 L 3.9,5.2 L 4.0,4.6 L 4.0,4.0 L 3.9,3.6 L 3.8,3.2 L 3.5,3.0 L 3.3,2.8 L 2.7,2.5 L 2.2,2.5 L 2.0,2.7 L 1.9,2.9 L 1.9,3.1 L 2.0,3.3 L 2.2,3.4 L 2.6,3.5 L 2.8,3.6 L 3.0,3.8 L 3.1,4.1 L 3.1,4.6 L 3.0,4.9 L 2.7,5.1 L 2.3,5.3 L 1.8,5.1 L 1.4,4.7 L 1.1,4.4 L 0.9,3.8 L 0.9,3.4 L 0.9,3.4 L 0.9,2.8 L 1.1,2.3 L 1.4,1.7 L 1.9,1.1',
  gem: 'M 4.9,1.1 L 4.5,1.3 L 3.8,2.0 L 0.1,7.7 L 0.0,8.0 L 0.1,9.3 L 1.1,10.6 L 10.6,22.2 L 11.0,22.6 L 12.0,22.9 L 12.8,22.7 L 13.7,21.9 L 19.3,14.8 L 19.3,14.5 L 19.0,14.0 L 18.8,13.9 L 18.3,14.0 L 13.8,19.4 L 13.7,19.3 L 16.9,9.4 L 17.0,9.3 L 21.9,9.3 L 22.0,9.4 L 19.4,12.5 L 19.5,13.3 L 20.2,13.6 L 20.4,13.5 L 21.1,12.8 L 23.7,9.5 L 24.0,8.8 L 23.9,7.8 L 20.1,1.9 L 19.3,1.2 L 19.0,1.1 L 4.9,1.1 M 2.0,9.3 L 7.0,9.3 L 7.1,9.4 L 7.3,10.2 L 8.7,14.1 L 8.7,14.4 L 10.0,18.3 L 10.0,18.6 L 10.3,19.2 L 10.2,19.5 L 1.9,9.4 L 2.0,9.3 M 16.4,7.3 L 19.2,3.1 L 22.2,7.8 L 22.1,7.9 L 16.9,7.9 L 16.4,7.3 M 12.0,3.1 L 12.2,3.4 L 15.1,7.8 L 15.0,7.9 L 13.3,7.9 L 13.0,8.3 L 12.9,8.5 L 13.0,9.1 L 13.3,9.3 L 15.3,9.3 L 15.4,9.4 L 12.5,18.1 L 12.1,19.5 L 12.0,19.7 L 8.6,9.4 L 8.7,9.3 L 11.3,9.3 L 11.7,8.9 L 11.7,8.3 L 11.2,7.9 L 9.0,7.9 L 8.9,7.7 L 12.0,3.1 M 7.6,7.3 L 7.1,7.9 L 1.8,7.9 L 1.7,7.8 L 4.8,3.1 L 7.6,7.3 M 13.3,2.6 L 13.4,2.5 L 17.7,2.5 L 17.8,2.6 L 15.6,5.9 L 15.4,5.8 L 13.3,2.6 M 6.2,2.6 L 6.3,2.5 L 10.5,2.5 L 10.6,2.7 L 8.4,6.0 L 6.2,2.6',
  pouch: 'M 8.5,12.0 L 8.3,12.2 L 8.3,12.5 L 8.3,12.6 L 8.5,12.8 L 8.6,12.9 L 8.8,12.9 L 9.1,12.7 L 9.2,12.5 L 9.2,12.2 L 9.0,12.0 L 8.8,11.9 L 8.5,12.0 M 13.6,0.0 L 12.6,0.0 L 12.1,0.2 L 11.7,0.6 L 11.1,1.5 L 10.5,1.1 L 9.9,0.9 L 8.8,0.9 L 8.3,1.0 L 7.9,1.2 L 7.6,1.5 L 7.4,1.8 L 7.3,2.2 L 7.3,2.9 L 7.6,4.1 L 8.0,5.1 L 7.6,5.3 L 7.1,5.7 L 6.9,6.2 L 6.9,6.9 L 7.0,7.3 L 7.7,7.9 L 7.1,8.7 L 5.0,11.5 L 4.1,12.8 L 3.1,14.7 L 2.7,15.7 L 2.7,15.8 L 2.3,16.9 L 2.2,17.6 L 2.2,18.0 L 2.2,18.0 L 2.2,19.5 L 2.3,20.4 L 2.4,20.5 L 2.5,20.8 L 3.0,21.7 L 3.7,22.5 L 4.8,23.4 L 5.8,23.8 L 6.7,24.0 L 7.9,24.0 L 8.6,23.9 L 9.2,23.7 L 9.4,23.5 L 9.7,23.5 L 10.7,23.9 L 11.4,24.0 L 12.6,24.0 L 13.3,23.9 L 13.9,23.7 L 14.1,23.5 L 14.4,23.5 L 15.4,23.9 L 16.1,24.0 L 17.3,24.0 L 17.4,24.0 L 17.8,23.9 L 18.6,23.7 L 19.2,23.4 L 20.3,22.5 L 20.7,22.1 L 21.2,21.4 L 21.7,20.4 L 21.8,19.5 L 21.8,18.2 L 21.6,17.0 L 21.1,15.8 L 20.1,13.8 L 18.6,11.7 L 16.9,9.2 L 16.2,7.9 L 16.6,7.7 L 16.9,7.4 L 17.1,6.9 L 17.1,6.2 L 17.0,5.9 L 16.8,5.5 L 16.3,5.3 L 15.7,5.1 L 16.2,4.3 L 16.5,3.4 L 16.6,3.1 L 16.6,2.3 L 16.6,2.2 L 16.3,1.7 L 15.9,1.5 L 15.1,1.5 L 14.7,1.6 L 14.6,1.5 L 14.6,1.1 L 14.3,0.6 L 14.0,0.3 L 13.6,0.0 M 8.7,7.9 L 9.7,7.9 L 9.7,8.0 L 8.9,10.4 L 8.9,10.8 L 9.1,11.0 L 9.3,11.1 L 9.6,11.0 L 9.8,10.8 L 10.7,7.9 L 13.1,7.9 L 13.2,8.0 L 13.2,8.5 L 13.7,9.8 L 13.9,10.4 L 14.2,10.6 L 14.6,10.5 L 14.8,10.3 L 14.8,10.0 L 14.4,9.0 L 14.1,8.2 L 14.1,8.0 L 14.2,7.9 L 15.2,7.9 L 15.2,8.0 L 15.4,8.5 L 15.9,9.5 L 18.5,13.2 L 19.4,14.5 L 20.3,16.3 L 20.7,17.4 L 20.9,17.9 L 20.9,18.7 L 20.9,18.8 L 20.9,19.4 L 20.8,20.1 L 20.4,20.9 L 20.0,21.6 L 19.4,22.1 L 19.0,22.4 L 18.3,22.8 L 17.3,23.1 L 16.8,23.1 L 16.8,23.1 L 16.1,23.1 L 15.4,22.9 L 15.3,22.8 L 15.7,22.5 L 16.2,21.9 L 16.5,21.3 L 16.5,21.1 L 16.4,20.9 L 16.2,20.8 L 15.9,20.8 L 15.6,21.0 L 15.2,21.6 L 14.7,22.1 L 14.1,22.5 L 13.6,22.8 L 12.6,23.1 L 12.1,23.1 L 12.0,23.1 L 11.9,23.1 L 11.4,23.1 L 10.4,22.8 L 9.9,22.5 L 9.3,22.1 L 8.8,21.6 L 8.4,21.0 L 8.2,20.8 L 7.8,20.8 L 7.6,20.9 L 7.5,21.1 L 7.5,21.3 L 8.0,22.1 L 8.7,22.8 L 8.2,23.0 L 7.2,23.1 L 7.2,23.1 L 6.7,23.1 L 6.1,22.9 L 5.2,22.5 L 4.6,22.1 L 4.0,21.6 L 3.8,21.2 L 3.2,20.1 L 3.1,19.4 L 3.1,19.0 L 3.1,18.9 L 3.1,17.6 L 3.4,16.4 L 3.6,15.8 L 4.4,14.2 L 4.9,13.2 L 5.7,12.1 L 8.0,9.2 L 8.7,7.9 M 7.8,6.4 L 8.0,6.2 L 8.3,6.1 L 15.7,6.1 L 16.0,6.2 L 16.2,6.3 L 16.2,6.7 L 16.0,7.0 L 15.7,7.0 L 8.3,7.0 L 8.0,7.0 L 7.8,6.8 L 7.8,6.4 M 15.6,2.4 L 15.7,2.6 L 15.6,3.1 L 15.5,3.7 L 14.7,5.1 L 14.6,5.2 L 13.7,5.2 L 13.7,5.1 L 14.4,2.8 L 14.6,2.6 L 14.8,2.5 L 15.0,2.5 L 15.2,2.4 L 15.6,2.4 M 13.6,1.1 L 13.7,1.3 L 13.7,1.6 L 13.7,1.7 L 13.7,2.1 L 12.7,5.1 L 12.6,5.2 L 11.5,5.2 L 11.4,5.1 L 11.4,4.6 L 11.1,4.3 L 10.8,4.3 L 10.6,4.5 L 10.5,4.6 L 10.5,5.1 L 10.5,5.2 L 9.1,5.2 L 8.5,3.9 L 8.2,2.9 L 8.2,2.6 L 8.2,2.5 L 8.2,2.3 L 8.5,2.0 L 8.9,1.8 L 9.6,1.8 L 10.2,2.0 L 10.8,2.3 L 10.7,2.7 L 10.7,3.1 L 10.9,3.3 L 11.3,3.3 L 11.5,3.1 L 12.0,1.9 L 12.2,1.5 L 12.6,1.0 L 12.8,0.9 L 13.0,0.9 L 13.1,0.9 L 13.3,0.9 L 13.6,1.1',
};

function invItemIcon(type, color, cx, cy, S) {
  const T = (type || '').toString().trim().toUpperCase();
  const k = (type || '').toString().trim();
  if (T.includes('WEAPON') || k === '무기' ||
      T.includes('ARMOR')  || k === '방어구' ||
      T.includes('ACC')    || k === '장신구' || k === '악세서리') {
    return equipIcon(type, color, cx - 11 * S, cy - 11 * S, S);
  }
  const tx = (cx - 12 * S).toFixed(2), ty = (cy - 12 * S).toFixed(2);
  let key = 'pouch';
  if (k === '물약' || T === 'POTION' || k === '포션') key = 'potion';
  else if (k === '폭탄' || T === 'BOMB') key = 'bomb';
  else if (k === '열쇠' || T === 'KEY') key = 'key';
  else if (k === '재료' || T === 'MATERIAL' || k === '광석' || T === 'ORE') key = 'ore';
  else if (k === '음식' || T === 'FOOD' || k === '사과' || k === '빵' || T === 'BREAD') key = 'food';
  else if (k === '두루마리' || T === 'SCROLL' || k === '스크롤') key = 'scroll';
  else if (k === '보석' || T === 'GEM' || T === 'JEWEL') key = 'gem';
  return `<g transform="translate(${tx},${ty}) scale(${S})" fill="${color}">` +
    `<path d="${INV_FILL_ICONS[key]}"/></g>`;
}

const INV_THEMES = {
  mmo: {
    bg:'#0d0f1f', slotFill:'#13162a', emptyStroke:'#222842', border:'#2a3050',
    text:'#d8d6f0', dim:'#9a9bc0', accent:'#8888CC', sand:'#CCAA88',
    font:"'Noto Sans KR',sans-serif", mono:"monospace", rx:6, grid:true,
  },
  dark: {
    bg:'#110e0a', slotFill:'#0a0805', emptyStroke:'#1a1410', border:'#2a1e14',
    text:'#d8c8b0', dim:'#8a7a68', accent:'#CCAA88', sand:'#CCAA88',
    font:"Georgia,'Noto Serif KR',serif", mono:"monospace", rx:3, grid:false,
  },
  pixel: {
    bg:'#000000', slotFill:'#1a0a14', emptyStroke:'#2a1620', border:'#BB6688',
    text:'#f0e0e5', dim:'#8888CC', accent:'#BB6688', sand:'#CCAA88',
    font:"'Courier New',monospace", mono:"'Courier New',monospace", rx:0, grid:false,
  },
};

function renderInv(params) {
  const valid = ['mmo', 'dark', 'pixel'];
  const stRaw = (params.get('st') || 'mmo').toLowerCase();
  const st = valid.includes(stRaw) ? stRaw : 'mmo';
  const TH = INV_THEMES[st];

  const W = 480, PAD = 18, INNER_W = W - PAD * 2;
  const pp = (params.get('p') || '§§').split('§');
  const owner = esc((pp[0] || '').trim());
  const gold  = (pp[1] || '').trim();
  const items = parseInvItems(params.get('items'));
  const maxSlotsRaw = safeInt(pp[2], 0, 0, 60);
  const col = safeInt(params.get('col'), st === 'mmo' ? 5 : 6, 1, 10);

  const filled = items.length;
  const maxSlots = Math.min(Math.max(maxSlotsRaw, filled, col), 60);
  const rows = Math.ceil(maxSlots / col);

  const gap = 8;
  const slotSize = Math.floor((INNER_W - (col - 1) * gap) / col);
  const nameH = 15;
  const rowH = slotSize + nameH + 6;

  // 착용 장비 (선택)
  const eqRaw = params.get('eq');
  let eqRows = null;
  if (eqRaw) {
    const e = eqRaw.split('§');
    eqRows = [
      { type: '무기',   name: (e[0] || '—').trim() || '—', grade: (e[1] || '일반').trim() },
      { type: '방어구', name: (e[2] || '—').trim() || '—', grade: (e[3] || '일반').trim() },
      { type: '장신구', name: (e[4] || '—').trim() || '—', grade: (e[5] || '일반').trim() },
    ];
  }

  const H_HEADER = 60;
  const H_EQ = eqRows ? 64 : 0;
  const H_BAGLBL = 22;
  const H_GRID = rows * rowH;
  const H_FOOT = 16;
  const TOTAL_H = H_HEADER + H_EQ + H_BAGLBL + H_GRID + H_FOOT;

  const maxNameChars = Math.max(3, Math.floor(slotSize / 8));
  const trunc = (s) => s.length <= maxNameChars ? s : s.slice(0, maxNameChars - 1) + '…';

  let defs = `<defs>`;
  if (TH.grid) {
    defs += `<pattern id="invGrid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0 L0 0 0 40" fill="none" stroke="${TH.border}" stroke-width="0.5" opacity="0.5"/></pattern>`;
  }
  defs += `<linearGradient id="invShine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0"/><stop offset="0.5" stop-color="#ffffff" stop-opacity="0.55"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>`;
  let clipDefs = '';

  let body = '';
  let y = 0;

  // HEADER
  body += `<text x="${PAD}" y="36" font-family="${TH.font}" font-size="22" font-weight="bold" fill="${TH.accent}">${owner || 'INVENTORY'}</text>`;
  if (gold) {
    body += `<text x="${W - PAD}" y="30" font-family="${TH.mono}" font-size="13" font-weight="bold" fill="${TH.sand}" text-anchor="end">${esc(gold)} G</text>`;
  }
  body += `<text x="${W - PAD}" y="48" font-family="${TH.mono}" font-size="11" fill="${TH.dim}" text-anchor="end">${filled} / ${maxSlots} 칸</text>`;
  body += `<line x1="${PAD}" y1="${H_HEADER - 4}" x2="${W - PAD}" y2="${H_HEADER - 4}" stroke="${TH.border}" stroke-width="1"/>`;
  y = H_HEADER;

  // 착용 장비
  if (eqRows) {
    body += `<text x="${PAD}" y="${y + 14}" font-family="${TH.mono}" font-size="10" font-weight="bold" fill="${TH.dim}" letter-spacing="2">EQUIPPED</text>`;
    const chipW = Math.floor((INNER_W - 2 * 8) / 3);
    eqRows.forEach((eq, i) => {
      const cx0 = PAD + i * (chipW + 8);
      const cy0 = y + 22;
      const gcol = rarityColor(eq.grade);
      body += `<rect x="${cx0}" y="${cy0}" width="${chipW}" height="30" rx="${TH.rx}" fill="${TH.slotFill}" stroke="${gcol}" stroke-width="1.2"/>`;
      body += invItemIcon(eq.type, gcol, cx0 + 16, cy0 + 15, 0.95);
      body += `<text x="${cx0 + 31}" y="${cy0 + 19}" font-family="${TH.font}" font-size="12" font-weight="bold" fill="${TH.text}">${esc(trunc(eq.name))}</text>`;
    });
    y += H_EQ;
  }

  // BAG label
  body += `<text x="${PAD}" y="${y + 14}" font-family="${TH.mono}" font-size="10" font-weight="bold" fill="${TH.dim}" letter-spacing="2">BAG</text>`;
  y += H_BAGLBL;

  // GRID
  const gridTop = y;
  for (let idx = 0; idx < maxSlots; idx++) {
    const r = Math.floor(idx / col), c = idx % col;
    const sx = PAD + c * (slotSize + gap);
    const sy = gridTop + r * rowH;
    const item = items[idx];

    if (!item) {
      body += `<rect x="${sx}" y="${sy}" width="${slotSize}" height="${slotSize}" rx="${TH.rx}" fill="${TH.bg}" stroke="${TH.emptyStroke}" stroke-width="1" stroke-dasharray="4 4"/>`;
      continue;
    }

    const gcol = rarityColor(item.grade);
    const isHi = item.grade === 'legend' || item.grade === 'epic';
    const ccx = sx + slotSize / 2, ccy = sy + slotSize / 2;

    body += `<rect x="${sx}" y="${sy}" width="${slotSize}" height="${slotSize}" rx="${TH.rx}" fill="${TH.slotFill}" stroke="${gcol}" stroke-width="${isHi ? 2 : 1.5}"/>`;
    const iconS = (slotSize * 0.5) / 24;
    body += invItemIcon(item.type, gcol, ccx, ccy, iconS);

    if (isHi) {
      body += `<rect x="${sx}" y="${sy}" width="${slotSize}" height="${slotSize}" rx="${TH.rx}" fill="none" stroke="${gcol}" stroke-width="2.5" opacity="0.3"><animate attributeName="opacity" values="0.2;0.9;0.2" dur="1.6s" repeatCount="indefinite"/><animate attributeName="stroke-width" values="2;3.5;2" dur="1.6s" repeatCount="indefinite"/></rect>`;
    }
    if (item.isNew) {
      const cid = `invShineClip${idx}`;
      clipDefs += `<clipPath id="${cid}"><rect x="${sx}" y="${sy}" width="${slotSize}" height="${slotSize}" rx="${TH.rx}"/></clipPath>`;
      const band = Math.round(slotSize * 0.35);
      body += `<g clip-path="url(#${cid})"><rect x="${sx}" width="${slotSize}" height="${band}" fill="url(#invShine)"><animate attributeName="y" values="${sy - band};${sy + slotSize}" dur="1.7s" repeatCount="indefinite"/></rect></g>`;
    }
    if (item.qty > 1) {
      body += `<text x="${sx + slotSize - 5}" y="${sy + slotSize - 6}" font-family="${TH.mono}" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="end">×${item.qty}</text>`;
    }
    body += `<text x="${ccx}" y="${sy + slotSize + 12}" font-family="${TH.font}" font-size="10" fill="${item.isNew ? TH.accent : TH.text}" text-anchor="middle">${esc(trunc(item.name))}</text>`;
  }
  y = gridTop + rows * rowH;

  defs += clipDefs + `</defs>`;

  let bg = `<rect width="${W}" height="${TOTAL_H}" fill="${TH.bg}"/>`;
  if (TH.grid) bg += `<rect width="${W}" height="${TOTAL_H}" fill="url(#invGrid)"/>`;
  let frame;
  if (st === 'pixel') {
    frame = `<rect x="4" y="4" width="${W - 8}" height="${TOTAL_H - 8}" fill="none" stroke="${TH.border}" stroke-width="2"/>`;
  } else if (st === 'dark') {
    frame = `<rect x="1" y="1" width="${W - 2}" height="${TOTAL_H - 2}" rx="3" fill="none" stroke="${TH.border}" stroke-width="1"/>`
          + `<path d="M${PAD} 12 L12 12 L12 ${PAD}" fill="none" stroke="#CCAA88" stroke-width="1" opacity="0.5"/>`
          + `<path d="M${W - PAD} 12 L${W - 12} 12 L${W - 12} ${PAD}" fill="none" stroke="#CCAA88" stroke-width="1" opacity="0.5"/>`;
  } else {
    frame = `<rect x="1" y="1" width="${W - 2}" height="${TOTAL_H - 2}" rx="4" fill="none" stroke="${TH.border}" stroke-width="1"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${TOTAL_H}" viewBox="0 0 ${W} ${TOTAL_H}">${defs}${bg}${frame}${body}</svg>`;
}



// ════════════════════════════════════════════
//  STAT (능력치 상태창) — ?t=stat & st=list|hex|hybrid
//  &p=이름§직업§레벨
//  &stats=STR§14|DEX§16|...   (§ 라벨/수치, | 구분, 표준약자는 한글 자동)
//  &hp=현재§최대  &ac=13  &init=+3  &spd=9
//  &extras=저항§화염|상태§집중   (커스텀 칩, 자유)
//
//  ROLL (주사위 판정) — ?t=roll
//  &d=2d8+3  (NdM±K)   &r=5§6 (굴림값 지정, 생략 시 랜덤)
//  &dc=15  (있으면 성공/실패 판정, 없으면 데미지 합산)
//  &label=설득 판정
//  · 1d20 = 판정(자연20 대성공 / 자연1 대실패) · 그 외 = 데미지 합산
//  · 면수(d4~d20)마다 주사위 모양 자동, 비표준은 범용 폴백
// ════════════════════════════════════════════

const SD_C = {
  bg: '#14100c', panel: '#1c1712', slot: '#120e0a', line: '#2e2418',
  sand: '#CCAA88', indigo: '#8888CC', rose: '#BB6688', pink: '#DDAACC',
  purple: '#884499', red: '#EE1166', cyan: '#00BBDD', orange: '#FF7722',
  dim: '#8a7a68', txt: '#e8ddcc',
};
const SD_ABBR = { STR: '근력', DEX: '민첩', CON: '건강', INT: '지능', WIS: '지혜', CHA: '매력' };

function sdMod(v) { const m = Math.floor((v - 10) / 2); return (m >= 0 ? '+' : '') + m; }
function sdWrap(w, h, inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="'Noto Serif KR',Georgia,serif">${inner}</svg>`;
}
function sdFrame(w, h) {
  const p = 6;
  return `<rect x="1.5" y="1.5" width="${w - 3}" height="${h - 3}" rx="6" fill="none" stroke="${SD_C.line}" stroke-width="1"/>`
    + `<rect x="4" y="4" width="${w - 8}" height="${h - 8}" rx="4" fill="none" stroke="${SD_C.sand}" stroke-width="1" opacity="0.35"/>`
    + [[p, p, 1, 1], [w - p, p, -1, 1], [p, h - p, 1, -1], [w - p, h - p, -1, -1]].map(([x, y, dx, dy]) =>
      `<path d="M${x} ${y + dy * 12} L${x} ${y} L${x + dx * 12} ${y}" fill="none" stroke="${SD_C.sand}" stroke-width="1.4" opacity="0.7"/>`).join('');
}
function sdHeader(x, y, name, job, lv) {
  let s = `<text x="${x}" y="${y}" font-size="21" font-weight="bold" fill="${SD_C.sand}">${esc(name)}</text>`;
  const meta = [job, lv ? ('Lv.' + lv) : ''].filter(Boolean).join(' · ');
  if (meta) s += `<text x="${x}" y="${y + 18}" font-family="'Noto Sans KR',sans-serif" font-size="12" fill="${SD_C.dim}">${esc(meta)}</text>`;
  return s;
}
function sdHpBar(x, y, w, cur, max) {
  const r = Math.max(0, Math.min(1, cur / max)), fw = Math.round(w * r);
  return `<text x="${x}" y="${y - 6}" font-family="monospace" font-size="10" font-weight="bold" fill="${SD_C.dim}" letter-spacing="1">HP</text>`
    + `<text x="${x + w}" y="${y - 6}" font-family="monospace" font-size="11" font-weight="bold" fill="${SD_C.rose}" text-anchor="end">${cur} / ${max}</text>`
    + `<rect x="${x}" y="${y}" width="${w}" height="9" rx="4.5" fill="${SD_C.slot}" stroke="${SD_C.line}" stroke-width="1"/>`
    + `<rect x="${x}" y="${y}" width="${fw}" height="9" rx="4.5" fill="${SD_C.rose}"><animate attributeName="width" values="0;${fw}" dur="0.8s" fill="freeze" keySplines="0.2 0.8 0.2 1" calcMode="spline"/><animate attributeName="opacity" values="0.7;1;0.7" dur="2.2s" repeatCount="indefinite"/></rect>`;
}
function sdShield(x, y, val) {
  return `<g transform="translate(${x},${y})"><path d="M0 -13 L11 -8 L11 3 Q11 12 0 17 Q-11 12 -11 3 L-11 -8 Z" fill="${SD_C.slot}" stroke="${SD_C.sand}" stroke-width="1.5"/><text x="0" y="4" font-size="15" font-weight="bold" fill="${SD_C.sand}" text-anchor="middle">${val}</text><text x="0" y="30" font-family="monospace" font-size="9" fill="${SD_C.dim}" text-anchor="middle" letter-spacing="1">AC</text></g>`;
}
function sdChip(x, y, label, val, w) {
  return `<rect x="${x}" y="${y}" width="${w}" height="34" rx="6" fill="${SD_C.slot}" stroke="${SD_C.line}" stroke-width="1"/><text x="${x + w / 2}" y="${y + 14}" font-family="monospace" font-size="9" fill="${SD_C.dim}" text-anchor="middle" letter-spacing="1">${esc(label)}</text><text x="${x + w / 2}" y="${y + 28}" font-size="13" font-weight="bold" fill="${SD_C.pink}" text-anchor="middle">${esc(val)}</text>`;
}
function sdNPoint(cx, cy, R, i, n) { const a = (-90 + i * (360 / n)) * Math.PI / 180; return [cx + R * Math.cos(a), cy + R * Math.sin(a)]; }

function sdParseStats(raw) {
  if (!raw) return [];
  return raw.split('|').map(s => { const i = s.indexOf('§'); if (i < 0) return null; const label = s.slice(0, i).trim(); const val = parseInt(s.slice(i + 1)); if (!label || isNaN(val)) return null; return { label, val }; }).filter(Boolean).slice(0, 12);
}
function sdParseHp(raw) { if (!raw) return null; const a = raw.split('§'); const c = parseInt(a[0]), m = parseInt(a[1]); if (isNaN(c) || isNaN(m) || m <= 0) return null; return [c, m]; }
function sdParseExtras(raw) { if (!raw) return []; return raw.split('|').map(s => { const i = s.indexOf('§'); if (i < 0) return null; const label = s.slice(0, i).trim(); const value = s.slice(i + 1).trim(); if (!label) return null; return { label, value }; }).filter(Boolean).slice(0, 8); }

function renderStat(params) {
  const st = (params.get('st') || 'list').toLowerCase();
  const pp = (params.get('p') || '§§').split('§');
  const ch = {
    name: (pp[0] || '').trim() || '이름 없음',
    job: (pp[1] || '').trim(),
    lv: (pp[2] || '').trim(),
    stats: sdParseStats(params.get('stats')),
    hp: sdParseHp(params.get('hp')),
    ac: (params.get('ac') || '').trim(),
    init: (params.get('init') || '').trim(),
    spd: (params.get('spd') || '').trim(),
    extras: sdParseExtras(params.get('extras')),
  };
  if (st === 'hex') return sdStatHex(ch);
  if (st === 'hybrid') return sdStatHybrid(ch);
  return sdStatList(ch);
}

function sdStatList(ch) {
  const W = 300, PAD = 18, rows = ch.stats;
  const hasBot = ch.ac || ch.init || ch.spd;
  const listTop = ch.hp ? 118 : 96;
  const H = listTop + rows.length * 34 + 14 + (hasBot ? 52 : 0) + (ch.extras.length ? 30 : 0) + 12;
  let b = `<rect width="${W}" height="${H}" fill="${SD_C.bg}"/>` + sdFrame(W, H) + sdHeader(PAD, 42, ch.name, ch.job, ch.lv);
  let y = 64;
  if (ch.hp) { b += sdHpBar(PAD, y + 20, W - PAD * 2, ch.hp[0], ch.hp[1]); y += 44; }
  rows.forEach((it, i) => {
    const ry = listTop - 14 + i * 34;
    const kor = SD_ABBR[it.label.toUpperCase()] || '';
    b += `<rect x="${PAD}" y="${ry}" width="${W - PAD * 2}" height="28" rx="6" fill="${SD_C.slot}" stroke="${SD_C.line}" stroke-width="1"/>`;
    b += `<text x="${PAD + 12}" y="${ry + 19}" font-family="monospace" font-size="11" font-weight="bold" fill="${SD_C.sand}" letter-spacing="1">${esc(it.label)}</text>`;
    if (kor) b += `<text x="${PAD + 46}" y="${ry + 19}" font-family="'Noto Sans KR',sans-serif" font-size="12" fill="${SD_C.txt}">${kor}</text>`;
    b += `<text x="${W - PAD - 52}" y="${ry + 20}" font-size="17" font-weight="bold" fill="${SD_C.txt}" text-anchor="end">${it.val}</text>`;
    const mv = sdMod(it.val), pos = !mv.startsWith('-');
    b += `<circle cx="${W - PAD - 22}" cy="${ry + 14}" r="0" fill="${SD_C.slot}" stroke="${pos ? SD_C.indigo : SD_C.rose}" stroke-width="1.5"><animate attributeName="r" values="0;13" dur="0.4s" begin="${(0.3 + i * 0.08).toFixed(2)}s" fill="freeze" keySplines="0.3 1.4 0.5 1" calcMode="spline"/></circle>`;
    b += `<text x="${W - PAD - 22}" y="${ry + 18}" font-size="12" font-weight="bold" fill="${pos ? SD_C.indigo : SD_C.rose}" text-anchor="middle" opacity="0">${mv}<animate attributeName="opacity" values="0;1" dur="0.3s" begin="${(0.4 + i * 0.08).toFixed(2)}s" fill="freeze"/></text>`;
  });
  let y2 = listTop - 14 + rows.length * 34 + 6;
  if (hasBot) {
    let bx = PAD;
    if (ch.ac) { b += sdShield(bx + 13, y2 + 16, esc(ch.ac)); bx += 44; }
    const chips = [];
    if (ch.init) chips.push(['이니셔티브', ch.init]);
    if (ch.spd) chips.push(['이동', ch.spd]);
    if (chips.length) {
      const cw = (W - PAD * 2 - (ch.ac ? 44 : 0) - (chips.length - 1) * 8) / chips.length;
      chips.forEach(([lab, val]) => { b += sdChip(bx, y2, lab, val, cw); bx += cw + 8; });
    }
    y2 += 52;
  }
  if (ch.extras.length) {
    let ex = PAD;
    ch.extras.forEach(e => {
      const tw = (e.label.length + e.value.length) * 8 + 30;
      b += `<rect x="${ex}" y="${y2}" width="${tw}" height="20" rx="10" fill="${SD_C.slot}" stroke="${SD_C.purple}" stroke-width="1"/>`;
      b += `<text x="${ex + 10}" y="${y2 + 14}" font-family="'Noto Sans KR',sans-serif" font-size="11" fill="${SD_C.pink}">${esc(e.label)} <tspan fill="${SD_C.sand}" font-weight="bold">${esc(e.value)}</tspan></text>`;
      ex += tw + 8;
    });
  }
  return sdWrap(W, H, b);
}

function sdStatHex(ch) {
  const W = 300, H = 340, cx = W / 2, cy = 150, R = 92;
  const keys = ch.stats, n = keys.length;
  let b = `<rect width="${W}" height="${H}" fill="${SD_C.bg}"/>` + sdFrame(W, H) + sdHeader(18, 36, ch.name, ch.job, ch.lv);
  if (n < 3) { b += `<text x="${cx}" y="${cy}" font-family="'Noto Sans KR',sans-serif" font-size="13" fill="${SD_C.dim}" text-anchor="middle">능력치 3개 이상 필요 · 리스트형 권장</text>`; return sdWrap(W, H, b); }
  [1, 0.66, 0.33].forEach(f => { const pts = keys.map((_, i) => sdNPoint(cx, cy, R * f, i, n).map(v => v.toFixed(1)).join(',')).join(' '); b += `<polygon points="${pts}" fill="none" stroke="${SD_C.line}" stroke-width="1"/>`; });
  keys.forEach((_, i) => { const [x, y] = sdNPoint(cx, cy, R, i, n); b += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${SD_C.line}" stroke-width="0.8"/>`; });
  const dpts = keys.map((it, i) => { const r = R * Math.max(0.08, Math.min(1, it.val / 20)); return sdNPoint(0, 0, r, i, n).map(v => v.toFixed(1)).join(','); }).join(' ');
  b += `<g transform="translate(${cx},${cy})"><polygon points="${dpts}" fill="${SD_C.indigo}" fill-opacity="0.28" stroke="${SD_C.indigo}" stroke-width="2"><animateTransform attributeName="transform" type="scale" values="0;1.08;1" dur="0.7s" fill="freeze" keySplines="0.2 0.8 0.3 1;0.4 0 0.6 1" calcMode="spline"/></polygon>`;
  keys.forEach((it, i) => { const r = R * Math.max(0.08, Math.min(1, it.val / 20)); const [px, py] = sdNPoint(0, 0, r, i, n); b += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3" fill="${SD_C.pink}" opacity="0"><animate attributeName="opacity" values="0;1" dur="0.3s" begin="0.6s" fill="freeze"/></circle>`; });
  b += `</g>`;
  keys.forEach((it, i) => { const [lx, ly] = sdNPoint(cx, cy, R + 22, i, n); b += `<text x="${lx.toFixed(1)}" y="${(ly - 2).toFixed(1)}" font-family="monospace" font-size="10" font-weight="bold" fill="${SD_C.sand}" text-anchor="middle">${esc(it.label)}</text><text x="${lx.toFixed(1)}" y="${(ly + 10).toFixed(1)}" font-size="12" font-weight="bold" fill="${SD_C.txt}" text-anchor="middle">${it.val} <tspan fill="${SD_C.indigo}" font-size="10">${sdMod(it.val)}</tspan></text>`; });
  let y = 278;
  const hpW = ch.ac ? W - 102 : W - 48;
  if (ch.hp) b += sdHpBar(24, y + 20, hpW, ch.hp[0], ch.hp[1]);
  if (ch.ac) b += sdShield(W - 36, y + 8, esc(ch.ac));
  return sdWrap(W, H, b);
}

function sdStatHybrid(ch) {
  const W = 440, H = 290, cx = 110, cy = 150, R = 58;
  const keys = ch.stats, n = keys.length;
  let b = `<rect width="${W}" height="${H}" fill="${SD_C.bg}"/>` + sdFrame(W, H) + sdHeader(20, 40, ch.name, ch.job, ch.lv);
  if (n >= 3) {
    [1, 0.55].forEach(f => { const pts = keys.map((_, i) => sdNPoint(cx, cy, R * f, i, n).map(v => v.toFixed(1)).join(',')).join(' '); b += `<polygon points="${pts}" fill="none" stroke="${SD_C.line}" stroke-width="1"/>`; });
    keys.forEach((_, i) => { const [x, y] = sdNPoint(cx, cy, R, i, n); b += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${SD_C.line}" stroke-width="0.7"/>`; });
    const dpts = keys.map((it, i) => { const r = R * Math.max(0.08, Math.min(1, it.val / 20)); return sdNPoint(0, 0, r, i, n).map(v => v.toFixed(1)).join(','); }).join(' ');
    b += `<g transform="translate(${cx},${cy})"><polygon points="${dpts}" fill="${SD_C.indigo}" fill-opacity="0.28" stroke="${SD_C.indigo}" stroke-width="2"><animateTransform attributeName="transform" type="scale" values="0;1.08;1" dur="0.7s" fill="freeze" keySplines="0.2 0.8 0.3 1;0.4 0 0.6 1" calcMode="spline"/></polygon></g>`;
    keys.forEach((it, i) => { const [lx, ly] = sdNPoint(cx, cy, R + 13, i, n); b += `<text x="${lx.toFixed(1)}" y="${(ly + 3).toFixed(1)}" font-family="monospace" font-size="9" font-weight="bold" fill="${SD_C.sand}" text-anchor="middle">${esc(it.label)}</text>`; });
  }
  const lx = 232, lw = W - lx - 20;
  keys.slice(0, 6).forEach((it, i) => {
    const ry = 64 + i * 23, mv = sdMod(it.val), pos = !mv.startsWith('-');
    const kor = SD_ABBR[it.label.toUpperCase()] || '';
    b += `<text x="${lx}" y="${ry}" font-family="monospace" font-size="11" font-weight="bold" fill="${SD_C.sand}">${esc(it.label)}</text>`;
    if (kor) b += `<text x="${lx + 34}" y="${ry}" font-family="'Noto Sans KR',sans-serif" font-size="11" fill="${SD_C.dim}">${kor}</text>`;
    b += `<text x="${lx + lw - 34}" y="${ry}" font-size="14" font-weight="bold" fill="${SD_C.txt}" text-anchor="end">${it.val}</text><text x="${lx + lw}" y="${ry}" font-size="12" font-weight="bold" fill="${pos ? SD_C.indigo : SD_C.rose}" text-anchor="end">${mv}</text>`;
  });
  let y = 256;
  if (ch.hp) b += sdHpBar(20, y, 200, ch.hp[0], ch.hp[1]);
  if (ch.ac) b += sdShield(258, y - 18, esc(ch.ac));
  if (ch.init) b += sdChip(298, y - 22, '이니셔티브', ch.init, 66);
  if (ch.spd) b += sdChip(372, y - 22, '이동', ch.spd, 46);
  return sdWrap(W, H, b);
}

// ──── 주사위 ────
function sdD20Body(R, stroke, fill) {
  const pts = [[0, -R], [0.866 * R, -0.5 * R], [0.866 * R, 0.5 * R], [0, R], [-0.866 * R, 0.5 * R], [-0.866 * R, -0.5 * R]].map(p => p.map(v => v.toFixed(1)).join(',')).join(' ');
  const LS = (a, b) => `<line x1="${(a[0] * R).toFixed(1)}" y1="${(a[1] * R).toFixed(1)}" x2="${(b[0] * R).toFixed(1)}" y2="${(b[1] * R).toFixed(1)}" stroke="${stroke}" stroke-width="1" opacity="0.55"/>`;
  const A = [0, -1], BL = [-0.866, -0.5], BR = [0.866, -0.5], D = [0, 1];
  return `<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>` + LS(BL, BR) + LS(BL, D) + LS(BR, D) + LS(A, BL) + LS(A, BR);
}
function sdDieShape(faces, R, st, showPips) {
  showPips = showPips !== false;
  const f = Number(faces);
  if (f === 4) { const p = [[0, -R], [0.87 * R, 0.6 * R], [-0.87 * R, 0.6 * R]].map(a => a.map(v => v.toFixed(1)).join(',')).join(' '); return `<polygon points="${p}" fill="${SD_C.slot}" stroke="${st}" stroke-width="2.5" stroke-linejoin="round"/><line x1="0" y1="${(-R).toFixed(1)}" x2="0" y2="${(0.6 * R).toFixed(1)}" stroke="${st}" stroke-width="1" opacity="0.5"/>`; }
  if (f === 6) { const s = R * 0.82; let g = `<rect x="${(-s).toFixed(1)}" y="${(-s).toFixed(1)}" width="${(2 * s).toFixed(1)}" height="${(2 * s).toFixed(1)}" rx="${(R * 0.18).toFixed(1)}" fill="${SD_C.slot}" stroke="${st}" stroke-width="2.5"/>`; if (showPips) { const pr = R * 0.11, o = s * 0.45;[[-o, -o], [o, -o], [0, 0], [-o, o], [o, o]].forEach(([px, py]) => { g += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${pr.toFixed(1)}" fill="${st}"/>`; }); } return g; }
  if (f === 8) { return `<polygon points="0,${(-R).toFixed(1)} ${(R * 0.8).toFixed(1)},0 0,${R.toFixed(1)} ${(-R * 0.8).toFixed(1)},0" fill="${SD_C.slot}" stroke="${st}" stroke-width="2.5" stroke-linejoin="round"/><line x1="${(-R * 0.8).toFixed(1)}" y1="0" x2="${(R * 0.8).toFixed(1)}" y2="0" stroke="${st}" stroke-width="1" opacity="0.5"/>`; }
  if (f === 10) { const p = [[0, -R], [0.72 * R, -0.08 * R], [0.45 * R, 0.78 * R], [-0.45 * R, 0.78 * R], [-0.72 * R, -0.08 * R]].map(a => a.map(v => v.toFixed(1)).join(',')).join(' '); return `<polygon points="${p}" fill="${SD_C.slot}" stroke="${st}" stroke-width="2.5" stroke-linejoin="round"/><line x1="0" y1="${(-R).toFixed(1)}" x2="${(0.45 * R).toFixed(1)}" y2="${(0.78 * R).toFixed(1)}" stroke="${st}" stroke-width="1" opacity="0.5"/><line x1="0" y1="${(-R).toFixed(1)}" x2="${(-0.45 * R).toFixed(1)}" y2="${(0.78 * R).toFixed(1)}" stroke="${st}" stroke-width="1" opacity="0.5"/><line x1="${(-0.72 * R).toFixed(1)}" y1="${(-0.08 * R).toFixed(1)}" x2="${(0.72 * R).toFixed(1)}" y2="${(-0.08 * R).toFixed(1)}" stroke="${st}" stroke-width="1" opacity="0.5"/>`; }
  if (f === 12) { const p = [0, 1, 2, 3, 4].map(i => { const a = (-90 + i * 72) * Math.PI / 180; return `${(R * Math.cos(a)).toFixed(1)},${(R * Math.sin(a)).toFixed(1)}`; }).join(' '); return `<polygon points="${p}" fill="${SD_C.slot}" stroke="${st}" stroke-width="2.5" stroke-linejoin="round"/>`; }
  return sdD20Body(R, st, SD_C.slot);
}
function sdParseDice(raw) {
  const s = (raw || '').trim().replace(/\s+/g, '+');
  const m = s.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (!m) return null;
  const n = Math.min(20, Math.max(1, parseInt(m[1])));
  const faces = Math.min(1000, Math.max(2, parseInt(m[2])));
  const bonus = m[3] ? parseInt(m[3]) : 0;
  return { n, faces, bonus };
}

function renderRoll(params) {
  const dice = sdParseDice(params.get('d') || '1d20');
  if (!dice) return sdRollError();
  const { n, faces, bonus } = dice;
  let rolls = [];
  const rRaw = params.get('r');
  if (rRaw) rolls = rRaw.split('§').map(x => parseInt(x)).filter(x => !isNaN(x));
  while (rolls.length < n) rolls.push(1 + Math.floor(Math.random() * faces));
  rolls = rolls.slice(0, n).map(v => Math.min(faces, Math.max(1, v)));
  const dcRaw = params.get('dc');
  const dc = (dcRaw != null && dcRaw !== '' && !isNaN(parseInt(dcRaw))) ? parseInt(dcRaw) : null;
  const label = (params.get('label') || '').trim();
  const dmgRaw = params.get('dmg');
  let mode;
  if (dc != null) mode = { kind: 'judge', dc };
  else if (dmgRaw != null) mode = { kind: 'damage', name: dmgRaw.trim() };
  else mode = { kind: 'plain' };
  if (n === 1 && faces === 20) return sdRenderJudge(rolls[0], bonus, label, mode);
  return sdRenderDamage(n, faces, bonus, rolls, label, mode);
}

function sdRenderJudge(val, bonus, label, mode) {
  const W = 300, H = 280, cx = W / 2, cy = 128, R = 62;
  const total = val + bonus;
  const isJudge = mode.kind === 'judge', isDmg = mode.kind === 'damage';
  const crit = val === 20 && !isDmg, fumble = val === 1 && !isDmg;
  const color = crit ? SD_C.sand : fumble ? SD_C.red : (isDmg ? SD_C.orange : SD_C.indigo);
  const CY = 4.2, x0 = cx - 70, y0 = cy - 120;
  let b = `<rect width="${W}" height="${H}" fill="${SD_C.bg}"/>` + sdFrame(W, H);
  const dieLabel = `d20${bonus ? (bonus > 0 ? '+' + bonus : bonus) : ''}`;
  let info = dieLabel;
  if (isJudge) info += ` · 목표 DC ${mode.dc} 이상`;
  else if (isDmg) info += mode.name ? ` · ${esc(mode.name)} 데미지` : ' · 데미지';
  let infoY = 28;
  if (label) { b += `<text x="${cx}" y="28" font-family="'Noto Sans KR',sans-serif" font-size="14" font-weight="bold" fill="${SD_C.txt}" text-anchor="middle">${esc(label)}</text>`; infoY = 46; }
  b += `<text x="${cx}" y="${infoY}" font-family="monospace" font-size="11" fill="${SD_C.sand}" text-anchor="middle" letter-spacing="1">${info}</text>`;
  // 그림자
  b += `<ellipse cx="${cx}" cy="${cy + R + 8}" rx="43" ry="7" fill="#000" opacity="0"><animate attributeName="opacity" values="0;0;0.4;0.4;0" keyTimes="0;0.18;0.24;0.9;1" dur="${CY}s" repeatCount="indefinite"/></ellipse>`;
  // 대성공 글로우
  if (crit) b += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${SD_C.sand}" stroke-width="3" opacity="0"><animate attributeName="r" values="${R};${R};${R + 40};${R + 40}" keyTimes="0;0.24;0.42;1" dur="${CY}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0;0.9;0;0" keyTimes="0;0.24;0.33;0.5;1" dur="${CY}s" repeatCount="indefinite"/></circle>`;
  // 몸체 (opacity 사이클 → translate → rotate)
  b += `<g opacity="0"><animate attributeName="opacity" values="0;1;1;1;0" keyTimes="0;0.05;0.24;0.9;1" dur="${CY}s" repeatCount="indefinite"/>`
    + `<g><animateTransform attributeName="transform" type="translate" values="${x0} ${y0};${cx} ${cy + 6};${cx} ${cy};${cx} ${cy}" keyTimes="0;0.14;0.22;1" keySplines="0.4 0 0.7 1;0.3 0 0.4 1;0 0 1 1" calcMode="spline" dur="${CY}s" repeatCount="indefinite"/>`
    + `<g><animateTransform attributeName="transform" type="rotate" values="0;720;720" keyTimes="0;0.22;1" keySplines="0.1 0.6 0.3 1;0 0 1 1" calcMode="spline" dur="${CY}s" repeatCount="indefinite"/>`
    + sdD20Body(R, color, SD_C.slot)
    + `</g></g></g>`;
  // 대성공 황금 파티클 분출
  if (crit) {
    const parts = [[-32, 1.9, 0.00], [-16, 1.4, 0.05], [-4, 1.7, 0.02], [12, 1.5, 0.08], [26, 1.9, 0.03], [34, 1.3, 0.11], [-24, 1.5, 0.09], [4, 2.0, 0.06]];
    parts.forEach(([px, pr, dl]) => {
      const sy = cy + 6, ey = cy - 78, t0 = 0.24 + dl;
      b += `<circle cx="${cx + px}" cy="${sy}" r="${pr}" fill="${SD_C.sand}" opacity="0"><animate attributeName="cy" values="${sy};${sy};${ey};${ey}" keyTimes="0;${t0.toFixed(3)};${(t0 + 0.32).toFixed(3)};1" dur="${CY}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;${t0.toFixed(3)};${(t0 + 0.13).toFixed(3)};${(t0 + 0.32).toFixed(3)};1" dur="${CY}s" repeatCount="indefinite"/></circle>`;
    });
  }
  // 대실패 크랙 (착지 후)
  if (fumble) b += `<path transform="translate(${cx},${cy})" d="M-9 ${(-R * 0.5).toFixed(0)} L4 -8 L-6 6 L9 ${(R * 0.5).toFixed(0)}" fill="none" stroke="${SD_C.red}" stroke-width="1.5" opacity="0"><animate attributeName="opacity" values="0;0;0.85;0.85;0" keyTimes="0;0.24;0.28;0.9;1" dur="${CY}s" repeatCount="indefinite"/></path>`;
  // 숫자 룰렛
  const roulette = [7, 14, 3, 19, 11, 5, 16, 9];
  roulette.forEach((nn, i) => { const t = 0.04 + i * 0.02; b += `<text x="${cx}" y="${cy + 9}" font-size="30" font-weight="bold" fill="${SD_C.dim}" text-anchor="middle" opacity="0">${nn}<animate attributeName="opacity" values="0;0;0.8;0;0" keyTimes="0;${(t - 0.015).toFixed(3)};${t.toFixed(3)};${(t + 0.015).toFixed(3)};1" dur="${CY}s" repeatCount="indefinite"/></text>`; });
  // 최종 숫자 (배경 외곽선으로 크랙 위에 선명)
  b += `<text x="${cx}" y="${cy + 11}" font-size="36" font-weight="bold" fill="${color}" text-anchor="middle" paint-order="stroke" stroke="${SD_C.bg}" stroke-width="5" stroke-linejoin="round" opacity="0">${isDmg ? total : val}<animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.21;0.24;0.9;1" dur="${CY}s" repeatCount="indefinite"/><animate attributeName="font-size" values="46;36;36;36" keyTimes="0;0.3;0.9;1" dur="${CY}s" repeatCount="indefinite"/></text>`;
  // 판정
  let verdict, vcolor;
  if (crit) { verdict = 'CRITICAL · 대성공'; vcolor = SD_C.sand; }
  else if (fumble) { verdict = 'FUMBLE · 대실패'; vcolor = SD_C.red; }
  else if (isJudge) { const ok = total >= mode.dc; verdict = `${ok ? '성공' : '실패'} · ${total} vs DC ${mode.dc}`; vcolor = ok ? SD_C.cyan : SD_C.rose; }
  else if (isDmg) { verdict = (mode.name ? esc(mode.name) + ' ' : '') + '데미지'; vcolor = SD_C.orange; }
  else { verdict = `굴림 ${total}`; vcolor = SD_C.indigo; }
  const boxPulse = crit ? `<animate attributeName="stroke-width" values="1.5;1.5;3.5;1.5;1.5" keyTimes="0;0.34;0.43;0.58;1" dur="${CY}s" repeatCount="indefinite"/>` : '';
  const stamp = crit ? `<animate attributeName="font-size" values="26;26;14;14;14" keyTimes="0;0.34;0.42;0.9;1" dur="${CY}s" repeatCount="indefinite"/>` : '';
  b += `<rect x="30" y="${H - 58}" width="${W - 60}" height="34" rx="8" fill="${SD_C.slot}" stroke="${vcolor}" stroke-width="1.5" opacity="0"><animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.3;0.34;0.9;1" dur="${CY}s" repeatCount="indefinite"/>${boxPulse}</rect>`;
  b += `<text x="${cx}" y="${H - 36}" font-size="14" font-weight="bold" fill="${vcolor}" text-anchor="middle" opacity="0">${esc(verdict)}<animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.3;0.34;0.9;1" dur="${CY}s" repeatCount="indefinite"/>${stamp}</text>`;
  return sdWrap(W, H, b);
}

function sdRenderDamage(n, faces, bonus, rolls, label, mode) {
  const W = 340, H = 210, color = mode.kind === 'judge' ? SD_C.indigo : SD_C.orange, CY = 4.4;
  const gap = Math.min(88, (W - 60) / n), startX = (W - (n - 1) * gap) / 2, dy = 82, R = 30;
  const sum = rolls.reduce((a, c) => a + c, 0), total = sum + bonus;
  let b = `<rect width="${W}" height="${H}" fill="${SD_C.bg}"/>` + sdFrame(W, H);
  if (label) b += `<text x="${W / 2}" y="26" font-family="'Noto Sans KR',sans-serif" font-size="14" font-weight="bold" fill="${SD_C.txt}" text-anchor="middle">${esc(label)}</text>`;
  let dinfo = `${n}d${faces}${bonus ? (bonus > 0 ? '+' + bonus : bonus) : ''}`;
  if (mode.kind === 'judge') dinfo += ` · 목표 DC ${mode.dc}`;
  else if (mode.kind === 'damage') dinfo += mode.name ? ` · ${esc(mode.name)} 데미지` : ' · 데미지';
  b += `<text x="${W / 2}" y="${label ? 44 : 30}" font-family="monospace" font-size="13" font-weight="bold" fill="${SD_C.sand}" text-anchor="middle" letter-spacing="1">${dinfo}</text>`;
  rolls.forEach((val, i) => {
    const dx = startX + i * gap;
    const land = 0.10 + i * 0.06, t0 = Math.max(0, land - 0.10);
    b += `<ellipse cx="${dx}" cy="${dy + R + 6}" rx="21" ry="5" fill="#000" opacity="0"><animate attributeName="opacity" values="0;0;0.35;0.35;0" keyTimes="0;${land.toFixed(3)};${(land + 0.03).toFixed(3)};0.9;1" dur="${CY}s" repeatCount="indefinite"/></ellipse>`;
    b += `<g opacity="0"><animate attributeName="opacity" values="0;0;1;1;1;0" keyTimes="0;${t0.toFixed(3)};${(t0 + 0.03).toFixed(3)};${land.toFixed(3)};0.9;1" dur="${CY}s" repeatCount="indefinite"/>`
      + `<g><animateTransform attributeName="transform" type="translate" values="${(dx - 40).toFixed(0)} ${(dy - 90).toFixed(0)};${dx} ${dy + 6};${dx} ${dy};${dx} ${dy}" keyTimes="0;${(land - 0.03).toFixed(3)};${land.toFixed(3)};1" keySplines="0.4 0 0.7 1;0.4 0 0.6 1;0 0 1 1" calcMode="spline" dur="${CY}s" repeatCount="indefinite"/>`
      + `<g><animateTransform attributeName="transform" type="rotate" values="0;360;360" keyTimes="0;${land.toFixed(3)};1" keySplines="0.1 0.6 0.3 1;0 0 1 1" calcMode="spline" dur="${CY}s" repeatCount="indefinite"/>`
      + sdDieShape(faces, R, color, false)
      + `</g></g></g>`;
    for (let r = 0; r < 4; r++) { const rn = 1 + ((val + r * 3) % faces); const tt = t0 + 0.02 + r * 0.02; b += `<text x="${dx}" y="${dy + 7}" font-size="20" font-weight="bold" fill="${SD_C.dim}" text-anchor="middle" opacity="0">${rn}<animate attributeName="opacity" values="0;0;0.7;0;0" keyTimes="0;${(tt - 0.012).toFixed(3)};${tt.toFixed(3)};${(tt + 0.012).toFixed(3)};1" dur="${CY}s" repeatCount="indefinite"/></text>`; }
    b += `<text x="${dx}" y="${dy + 8}" font-size="24" font-weight="bold" fill="${color}" text-anchor="middle" paint-order="stroke" stroke="${SD_C.bg}" stroke-width="4" stroke-linejoin="round" opacity="0">${val}<animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;${(land - 0.01).toFixed(3)};${(land + 0.02).toFixed(3)};0.9;1" dur="${CY}s" repeatCount="indefinite"/></text>`;
  });
  const rev = 0.10 + n * 0.06 + 0.05;
  const parts = rolls.join(' + ') + (bonus ? ` + ${bonus}` : '');
  b += `<line x1="30" y1="150" x2="${W - 30}" y2="150" stroke="${SD_C.line}" stroke-width="1" opacity="0"><animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;${rev.toFixed(3)};${(rev + 0.03).toFixed(3)};0.9;1" dur="${CY}s" repeatCount="indefinite"/></line>`;
  b += `<text x="30" y="176" font-family="monospace" font-size="13" fill="${SD_C.dim}" opacity="0">${esc(parts)} =<animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;${rev.toFixed(3)};${(rev + 0.03).toFixed(3)};0.9;1" dur="${CY}s" repeatCount="indefinite"/></text>`;
  let rlabel, rcolor;
  if (mode.kind === 'judge') { const ok = total >= mode.dc; rlabel = ok ? `성공 · DC ${mode.dc}` : `실패 · DC ${mode.dc}`; rcolor = ok ? SD_C.cyan : SD_C.rose; }
  else if (mode.kind === 'damage') { rlabel = mode.name ? `${esc(mode.name)} 데미지` : '데미지'; rcolor = SD_C.orange; }
  else { rlabel = '합계'; rcolor = SD_C.orange; }
  b += `<text x="${W - 30}" y="180" font-size="26" font-weight="bold" fill="${rcolor}" text-anchor="end" opacity="0">${total}<animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;${rev.toFixed(3)};${(rev + 0.02).toFixed(3)};0.9;1" dur="${CY}s" repeatCount="indefinite"/><animate attributeName="font-size" values="34;26;26" keyTimes="0;${(rev + 0.06).toFixed(3)};1" dur="${CY}s" repeatCount="indefinite"/></text>`;
  b += `<text x="${W - 30}" y="196" font-family="'Noto Sans KR',sans-serif" font-size="10" fill="${SD_C.dim}" text-anchor="end" opacity="0">${rlabel}<animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;${rev.toFixed(3)};${(rev + 0.03).toFixed(3)};0.9;1" dur="${CY}s" repeatCount="indefinite"/></text>`;
  return sdWrap(W, H, b);
}

function sdRollError() {
  const W = 300, H = 120;
  let b = `<rect width="${W}" height="${H}" fill="${SD_C.bg}"/>` + sdFrame(W, H);
  b += `<text x="${W / 2}" y="50" font-family="'Noto Sans KR',sans-serif" font-size="13" fill="${SD_C.rose}" text-anchor="middle">주사위 형식 오류</text>`;
  b += `<text x="${W / 2}" y="74" font-family="monospace" font-size="12" fill="${SD_C.dim}" text-anchor="middle">예: d=2d8+3</text>`;
  return sdWrap(W, H, b);
}

// ════════════════════════════════════════════
//  RADAR / TERM  (콘솔·소나 계열)
// ════════════════════════════════════════════

function rtNum(v, fb, min, max) {
  const n = parseFloat(v);
  if (isNaN(n)) return fb;
  return Math.min(max, Math.max(min, n));
}
function rtHex(s) {
  s = (s || '').trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(s)) s = s.split('').map(c => c + c).join('');
  return /^[0-9a-fA-F]{6}$/.test(s) ? '#' + s.toLowerCase() : null;
}
function rtRgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
function rtMix(a, b, r) {
  const A = rtRgb(a), B = rtRgb(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * r).toString(16).padStart(2, '0')).join('');
}
// th=주색[§배경][§경고색] — 통일 3포지션
function rtTheme(raw) {
  const p = (raw || '').split('§').map(rtHex);
  const main = p[0] || '#22ff66';
  const bg = p[1] || rtMix(main, '#000000', 0.94);
  return {
    main, bg,
    warn: p[2] || '#EE1166',
    dim: rtMix(main, bg, 0.55),
    faint: rtMix(main, bg, 0.78),
    hot: rtMix(main, '#ffffff', 0.55),
    panel: rtMix(bg, main, 0.06),
  };
}
function rtSeed(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function rtRnd(seed) { let x = seed || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }

// ── ① RADAR ──
function renderRadar(params) {
  const g = k => params.get(k);
  const C = rtTheme(g('th'));
  const range = rtNum(g('r'), 8000, 1, 9999999);
  const spd = rtNum(g('spd'), 4, 1, 30);
  const rings = Math.round(rtNum(g('ring'), 3, 1, 6));
  const nz = Math.round(rtNum(g('nz'), 3, 0, 6));
  const sys = g('sys') || 'SYSTEM';
  const unit = g('unit') || 'm';

  // deg=주눈금[§부눈금]  — 부눈금 0이면 없음
  // dg=주눈금[§부눈금] — deg는 &deg가 HTML 엔티티(°)로 해석되므로 dg 사용, deg는 하위호환
  const dg = (g('dg') || g('deg') || '').split('§');
  const major = Math.round(rtNum(dg[0], 30, 5, 180));
  const minor = Math.round(rtNum(dg[1] === undefined || dg[1] === '' ? Math.max(0, Math.round(major / 3)) : dg[1], 0, 0, 180));

  // tc=위험§주의§우호§중립
  const T = (g('tc') || '').split('§').map(rtHex);
  const TCOL = { 2: T[0] || C.warn, 1: T[1] || '#FF7722', 3: T[2] || '#00BBDD', 0: T[3] || C.main };

  const tgts = (g('tgt') || '').split('|').filter(Boolean).map(s => {
    const f = s.split('§');
    let st = (f[3] || '').trim(), lv = 0;
    if (st.startsWith('!')) { lv = 2; st = st.slice(1); }
    else if (st.startsWith('*')) { lv = 1; st = st.slice(1); }
    else if (st.startsWith('~') || st.startsWith('+')) { lv = 3; st = st.slice(1); }
    return {
      name: (f[0] || '').trim(),
      dist: rtNum(f[1], 0, 0, 9999999),
      brg: ((rtNum(f[2], 0, -3600, 3600) % 360) + 360) % 360,
      st, lv, data: (f[4] || '').trim(),
    };
  }).filter(t => t.name);

  const W = 400, R = 155, CX = W / 2, CY = 28 + R;
  const scopeH = CY + R + 32;
  const hasData = tgts.some(t => t.data);
  const rowH = hasData ? 42 : 26;
  const panelH = tgts.length ? 34 + tgts.length * rowH + 12 : 0;
  const H = scopeH + panelH + 12;
  const uid = 'rs' + (rtSeed(sys + range + tgts.length) % 100000);

  let b = `<rect width="${W}" height="${H}" fill="${C.bg}"/>`;

  // 부눈금 틱
  if (minor > 0) {
    for (let a = 0; a < 360; a += minor) {
      if (a % major === 0) continue;
      const rad = (a - 90) * Math.PI / 180, co = Math.cos(rad), si = Math.sin(rad);
      b += `<line x1="${(CX + R * co).toFixed(1)}" y1="${(CY + R * si).toFixed(1)}" x2="${(CX + (R + 4) * co).toFixed(1)}" y2="${(CY + (R + 4) * si).toFixed(1)}" stroke="${C.dim}" stroke-width="1" opacity="0.7"/>`;
    }
  }
  // 주눈금 틱 + 라벨
  for (let a = 0; a < 360; a += major) {
    const rad = (a - 90) * Math.PI / 180, co = Math.cos(rad), si = Math.sin(rad);
    b += `<line x1="${(CX + R * co).toFixed(1)}" y1="${(CY + R * si).toFixed(1)}" x2="${(CX + (R + 7) * co).toFixed(1)}" y2="${(CY + (R + 7) * si).toFixed(1)}" stroke="${C.main}" stroke-width="1.3" opacity="0.85"/>`;
    b += `<text x="${(CX + (R + 18) * co).toFixed(1)}" y="${(CY + (R + 18) * si + 4).toFixed(1)}" font-family="monospace" font-size="10.5" font-weight="600" fill="${C.dim}" text-anchor="middle">${a}</text>`;
  }

  b += `<clipPath id="${uid}"><circle cx="${CX}" cy="${CY}" r="${R}"/></clipPath>`;
  b += `<circle cx="${CX}" cy="${CY}" r="${R}" fill="${C.panel}"/>`;

  // 배경 간섭파 — 균등 레인 분할(겹침 구조적 불가)
  let noise = '';
  if (nz > 0) {
    const rnd = rtRnd(rtSeed(sys + '|' + range));
    const step = (R * 2) / (nz + 1);
    const amp = Math.min(18, step * 0.34);
    for (let i = 1; i <= nz; i++) {
      const y0 = CY - R + step * i + (rnd() - 0.5) * step * 0.22;
      const wl = R * (1.1 + rnd() * 0.9), ph = rnd() * 6.28, a = amp * (0.65 + rnd() * 0.35);
      const yAt = x => y0 + Math.sin(ph + x / wl * 3.14) * a;
      let d = `M${(CX - R).toFixed(1)} ${yAt(-R).toFixed(1)}`;
      for (let x = -R + 32; x <= R; x += 32) {
        d += ` Q${(CX + x - 16).toFixed(1)} ${yAt(x - 16).toFixed(1)} ${(CX + x).toFixed(1)} ${yAt(x).toFixed(1)}`;
      }
      noise += `<path d="${d}" fill="none" stroke="${C.faint}" stroke-width="0.9" opacity="0.55"/>`;
    }
  }
  b += `<g clip-path="url(#${uid})">${noise}</g>`;

  for (let i = 1; i <= rings; i++) {
    b += `<circle cx="${CX}" cy="${CY}" r="${(R * i / (rings + 1)).toFixed(1)}" fill="none" stroke="${C.dim}" stroke-width="1" stroke-dasharray="3 4" opacity="0.75"/>`;
  }
  b += `<line x1="${CX - R}" y1="${CY}" x2="${CX + R}" y2="${CY}" stroke="${C.dim}" stroke-width="1" opacity="0.6"/>`;
  b += `<line x1="${CX}" y1="${CY - R}" x2="${CX}" y2="${CY + R}" stroke="${C.dim}" stroke-width="1" opacity="0.6"/>`;

  // 회전 스윕
  const SEG = 9, SPAN = 62;
  let sweep = '';
  for (let i = 0; i < SEG; i++) {
    const r0 = (-SPAN + i * (SPAN / SEG) - 90) * Math.PI / 180;
    const r1 = (-SPAN + (i + 1) * (SPAN / SEG) - 90) * Math.PI / 180;
    sweep += `<path d="M${CX} ${CY} L${(CX + R * Math.cos(r0)).toFixed(1)} ${(CY + R * Math.sin(r0)).toFixed(1)} A${R} ${R} 0 0 1 ${(CX + R * Math.cos(r1)).toFixed(1)} ${(CY + R * Math.sin(r1)).toFixed(1)} Z" fill="${C.main}" opacity="${(0.30 * (i + 1) / SEG).toFixed(3)}"/>`;
  }
  sweep += `<line x1="${CX}" y1="${CY}" x2="${CX}" y2="${CY - R}" stroke="${C.hot}" stroke-width="1.6" opacity="0.9"/>`;
  b += `<g clip-path="url(#${uid})"><g>${sweep}<animateTransform attributeName="transform" type="rotate" values="0 ${CX} ${CY};360 ${CX} ${CY}" dur="${spd}s" repeatCount="indefinite"/></g></g>`;

  // 표적 블립 + 핑 링
  tgts.forEach(t => {
    const rr = Math.min(R - 4, R * (t.dist / range));
    const rad = (t.brg - 90) * Math.PI / 180;
    const x = (CX + rr * Math.cos(rad)).toFixed(1), y = (CY + rr * Math.sin(rad)).toFixed(1);
    const col = TCOL[t.lv];
    const h0 = Math.max(0.0005, t.brg / 360);
    const dec = Math.min(0.34, 1 - h0 - 0.0005);
    const kt = `0;${(h0 - 0.0005).toFixed(4)};${h0.toFixed(4)};${(h0 + dec).toFixed(4)};1`;
    const d2 = dec * 0.62;
    const kt2 = `0;${(h0 - 0.0005).toFixed(4)};${h0.toFixed(4)};${(h0 + d2).toFixed(4)};1`;
    b += `<circle cx="${x}" cy="${y}" r="3.1" fill="${col}" opacity="0.22"/>`;
    b += `<circle cx="${x}" cy="${y}" fill="none" stroke="${col}" stroke-width="1.6" r="3.5" opacity="0"><animate attributeName="r" values="3.5;3.5;3.5;24;24" keyTimes="${kt}" dur="${spd}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0;0.85;0;0" keyTimes="${kt}" dur="${spd}s" repeatCount="indefinite"/></circle>`;
    b += `<circle cx="${x}" cy="${y}" fill="none" stroke="${col}" stroke-width="1.1" r="3.5" opacity="0"><animate attributeName="r" values="3.5;3.5;3.5;14.5;14.5" keyTimes="${kt2}" dur="${spd}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0;0.5;0;0" keyTimes="${kt2}" dur="${spd}s" repeatCount="indefinite"/></circle>`;
    b += `<circle cx="${x}" cy="${y}" r="3.9" fill="${t.lv === 0 ? C.hot : col}" opacity="0"><animate attributeName="opacity" values="0;0;1;0.15;0.15" keyTimes="${kt}" dur="${spd}s" repeatCount="indefinite"/></circle>`;
  });

  b += `<circle cx="${CX}" cy="${CY}" r="6" fill="none" stroke="${C.warn}" stroke-width="1.4" opacity="0.9"/>`;
  b += `<circle cx="${CX}" cy="${CY}" r="2.5" fill="${C.warn}"/>`;
  b += `<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${C.main}" stroke-width="2"/>`;

  if (tgts.length) {
    const py = scopeH;
    const dataCol = rtMix(C.main, C.bg, 0.34);            // 부가설명 — 기존 dim보다 밝게
    // 표적명 최대 폭 기준으로 거리 컬럼 정렬 (이름 길이 달라도 안 겹침)
    const nameMax = Math.max(...tgts.map(t => rtTw('[' + t.name + ']', 12.5)));
    const distX = Math.min(W - 200, 20 + nameMax + 16);
    b += `<rect x="10" y="${py}" width="${W - 20}" height="${panelH}" fill="none" stroke="${C.main}" stroke-width="1.3" rx="2"/>`;
    b += `<text x="20" y="${py + 20}" font-family="monospace" font-size="11.5" font-weight="600" fill="${C.main}">보고체계: ${esc(sys)}</text>`;
    b += `<text x="${W - 20}" y="${py + 20}" font-family="monospace" font-size="11.5" font-weight="600" fill="${C.main}" text-anchor="end">스캔반경: ${range}${esc(unit)}</text>`;
    b += `<line x1="16" y1="${py + 28}" x2="${W - 16}" y2="${py + 28}" stroke="${C.main}" stroke-width="1.1" opacity="0.55"/>`;
    // 폭 초과 시 ① 폰트 축소(하한 8.5) ② 그래도 넘치면 말줄임 — 폭이 고정이라 잘림 방지
    const fit = (txt, x, base) => {
      const avail = W - 20 - x;
      let fs = base;
      const need = rtTw(txt, base);
      if (need > avail) fs = Math.max(8.5, base * avail / need);
      if (rtTw(txt, fs) > avail) {
        let s = txt;
        while (s.length > 1 && rtTw(s + '…', fs) > avail) s = s.slice(0, -1);
        txt = s + '…';
      }
      return { fs: fs.toFixed(1), txt };
    };
    tgts.forEach((t, i) => {
      const ty = py + 50 + i * rowH, col = TCOL[t.lv];
      const nm = fit('[' + t.name + ']', 20, 12.5);
      const ln = fit(`거리: ${t.dist}${unit}  |  상태: ${t.st}`, distX, 12.5);
      b += `<text x="20" y="${ty}" font-family="monospace" font-size="${nm.fs}" fill="${col}" font-weight="bold">${esc(nm.txt)}</text>`;
      b += `<text x="${distX.toFixed(1)}" y="${ty}" font-family="monospace" font-size="${ln.fs}" font-weight="600" fill="${col}">${esc(ln.txt)}</text>`;
      if (t.data) {
        const dt = fit('데이터: ' + t.data, 20, 11);
        b += `<text x="20" y="${ty + 17}" font-family="monospace" font-size="${dt.fs}" font-weight="600" fill="${dataCol}">${esc(dt.txt)}</text>`;
      }
    });
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${b}</svg>`;
}

// ── ② TERM ──
const RT_FS = 13, RT_LH = 21, RT_CW = RT_FS * 0.6;
function rtTw(s, fs) { const f = fs || RT_FS, cw = f * 0.6; let w = 0; for (const c of s) w += c.charCodeAt(0) > 0x1100 ? f : cw; return w; }
function rtWrap(s, maxW) {
  const out = []; let line = '';
  for (const ch of s) { if (rtTw(line + ch) > maxW) { out.push(line); line = ch; } else line += ch; }
  if (line) out.push(line);
  return out.length ? out : [''];
}
function rtSigBars(xRight, yBase, pct, C) {
  const N = 5, BW = 3.5, GAP = 2.2, H0 = 3.5, STEP = 2.4;
  const W = N * BW + (N - 1) * GAP, x0 = xRight - W;
  const filled = Math.max(0, Math.min(N, Math.ceil(pct / 100 * N)));
  let s = '';
  for (let i = 0; i < N; i++) {
    const h = H0 + i * STEP, on = i < filled;
    const flick = (on && i === filled - 1 && pct < 60)
      ? `<animate attributeName="opacity" values="1;1;0.15;1;1" keyTimes="0;0.3;0.42;0.55;1" dur="${pct < 30 ? 0.9 : 1.6}s" repeatCount="indefinite"/>` : '';
    s += `<rect x="${(x0 + i * (BW + GAP)).toFixed(1)}" y="${(yBase - h).toFixed(1)}" width="${BW}" height="${h.toFixed(1)}" fill="${on ? C.main : C.faint}">${flick}</rect>`;
  }
  return { svg: s, width: W };
}

function renderTerm(params) {
  const g = k => params.get(k);
  const C = rtTheme(g('th'));
  const W = rtNum(g('w'), 400, 260, 720);
  const PAD = 22, INNER = W - PAD * 2 - 4;
  const hd = (g('hd') || 'SECURE§--:--§NODE_0§100').split('§');
  const me = (g('me') || '').trim();
  const status = g('st') || 'TRANSMITTING...';
  const curMode = (g('cur') || 'nl').toLowerCase();   // nl | end | off

  const blocks = (g('log') || '').split('|').filter(Boolean).map(s => {
    const f = s.split('§');
    const txt = (f[1] || '').trim();
    return { who: (f[0] || '').trim(), txt, lines: rtWrap(txt, INNER) };
  });

  const bodyH = blocks.reduce((a, x) => a + 24 + x.lines.length * RT_LH + 10, 0);
  const HEAD = 62, CUR = curMode === 'off' ? 8 : 26, FOOT = 42;
  const H = HEAD + bodyH + CUR + FOOT;

  let b = `<rect width="${W}" height="${H}" fill="${C.bg}"/>`;
  b += `<rect x="2" y="2" width="${W - 4}" height="${H - 4}" fill="none" stroke="${C.main}" stroke-width="2"/>`;
  b += `<rect x="6" y="6" width="${W - 12}" height="${H - 12}" fill="none" stroke="${C.main}" stroke-width="1" opacity="0.45"/>`;

  const hl = (g('hl') || '').split('§');
  const DEFL = ['LINK', 'T', 'NODE', 'SIG'];
  const L = i => (hl[i] !== undefined && hl[i] !== '') ? hl[i] : DEFL[i];
  const HF = `font-family="monospace" font-size="12.5" font-weight="bold" fill="${C.main}"`;
  b += `<text x="${PAD}" y="30" ${HF}>${esc(L(0))}: ${esc(hd[0] || '')}</text>`;
  b += `<text x="${W - PAD}" y="30" ${HF} text-anchor="end">${esc(L(1))}: ${esc(hd[1] || '')}</text>`;
  b += `<text x="${PAD}" y="48" ${HF}>${esc(L(2))}: ${esc(hd[2] || '')}</text>`;

  const raw4 = (hd[3] || '').trim();
  if (raw4.startsWith('~')) {
    const rest = raw4.slice(1).trim();
    const pct = rest === '' ? 100 : rtNum(rest, 100, 0, 100);
    const bars = rtSigBars(W - PAD, 48, pct, C);
    b += bars.svg;
    let tx = W - PAD - bars.width - 6;
    if (rest !== '') { b += `<text x="${tx.toFixed(1)}" y="48" ${HF} text-anchor="end">${pct}%</text>`; tx -= rtTw(pct + '%') + 6; }
    b += `<text x="${tx.toFixed(1)}" y="48" ${HF} text-anchor="end">${esc(L(3))}:</text>`;
  } else {
    b += `<text x="${W - PAD}" y="48" ${HF} text-anchor="end">${esc(L(3))}: ${esc(raw4)}%</text>`;
  }
  b += `<line x1="${PAD - 6}" y1="${HEAD - 4}" x2="${W - PAD + 6}" y2="${HEAD - 4}" stroke="${C.main}" stroke-width="1.2"/>`;

  let y = HEAD + 22, lastX = PAD, lastY = y;
  blocks.forEach(bl => {
    const tagW = rtTw(bl.who) + 14;
    if (me && bl.who === me) {
      b += `<rect x="${PAD}" y="${y - 12}" width="${tagW.toFixed(1)}" height="17" fill="${C.main}"/>`;
      b += `<text x="${PAD + 7}" y="${y + 1}" font-family="monospace" font-size="12" fill="${C.bg}">${esc(bl.who)}</text>`;
    } else {
      b += `<rect x="${PAD}" y="${y - 12}" width="${tagW.toFixed(1)}" height="17" fill="none" stroke="${C.main}" stroke-width="1"/>`;
      b += `<text x="${PAD + 7}" y="${y + 1}" font-family="monospace" font-size="12" fill="${C.main}">${esc(bl.who)}</text>`;
    }
    y += 22;
    bl.lines.forEach(ln => {
      b += `<text x="${PAD}" y="${y}" font-family="monospace" font-size="${RT_FS}" fill="${C.main}">${esc(ln)}</text>`;
      lastX = PAD + rtTw(ln) + 3; lastY = y;
      y += RT_LH;
    });
    y += 12;
  });

  if (curMode !== 'off') {
    const cx = curMode === 'end' && blocks.length ? lastX : PAD;
    const cy = curMode === 'end' && blocks.length ? lastY - 11 : y - 12;
    b += `<rect x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" width="9" height="15" fill="${C.main}"><animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.45;0.5;1" dur="1.1s" repeatCount="indefinite"/></rect>`;
  }

  b += `<line x1="${PAD - 6}" y1="${H - FOOT + 4}" x2="${W - PAD + 6}" y2="${H - FOOT + 4}" stroke="${C.main}" stroke-width="1.2"/>`;
  b += `<text x="${PAD}" y="${H - 16}" font-family="monospace" font-size="12.5" font-weight="bold" fill="${C.main}">${esc(status)}<animate attributeName="opacity" values="1;1;0.25;1;1" keyTimes="0;0.35;0.5;0.65;1" dur="1.8s" repeatCount="indefinite"/></text>`;

  let sl = '';
  for (let sy = 0; sy < H; sy += 3) sl += `<rect x="0" y="${sy}" width="${W}" height="1" fill="${C.main}" opacity="0.04"/>`;
  b += sl;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${b}</svg>`;
}

// ── ③ VITAL (생체 모니터) ──
// 정상범위는 성인 일반값 기준의 연출용 근사치. 임상 판단 근거로 쓰지 말 것.
const VT_RANGE = {
  hr:   { lo: 60,   hi: 100,  clo: 45,  chi: 130, unit: 'bpm', label: 'HR' },
  spo2: { lo: 95,   hi: 100,  clo: 90,  chi: 101, unit: '%',   label: 'SpO2' },
  sbp:  { lo: 90,   hi: 140,  clo: 80,  chi: 170, unit: '',    label: 'BP' },
  rr:   { lo: 12,   hi: 20,   clo: 9,   chi: 26,  unit: '/min', label: 'RR' },
  tp:   { lo: 36.1, hi: 37.4, clo: 35,  chi: 38.5, unit: '°C', label: 'TEMP' },
};

// 값 앞 마커(!위험 *주의 ~정상) 우선, 없으면 자동 판정
function vtLevel(raw, key) {
  const s = String(raw == null ? '' : raw).trim();
  if (s.startsWith('!')) return { v: s.slice(1), lv: 2 };
  if (s.startsWith('*')) return { v: s.slice(1), lv: 1 };
  if (s.startsWith('~')) return { v: s.slice(1), lv: 0 };
  const n = parseFloat(s);
  const R = VT_RANGE[key];
  if (!R || isNaN(n)) return { v: s, lv: 0 };
  if (n <= R.clo || n >= R.chi) return { v: s, lv: 2 };
  if (n < R.lo || n > R.hi) return { v: s, lv: 1 };
  return { v: s, lv: 0 };
}

// ── 파형 점 생성 ──
// Philips 계열 = 스윕 방식: 커서가 좌→우로 지나가며 그 자리에 새로 그림
// jit>0 이면 비트마다 진폭·타이밍을 미세하게 흔들어 잔상과 새 파형이 어긋나 보이게 함
function vtPts(kind, x0, w, base, amp, cycles, step, jit) {
  const pts = [];
  const cw = w / cycles;
  // 파형 활성 구간 비율 — 이 구간은 폭 고정(모양 불변), 남는 휴지 구간만 가변
  const ACT = kind === 'ecg' ? 0.75 : (kind === 'resp' ? 0.62 : 0.90);
  const actW = cw * ACT;
  const rest0 = w - cycles * actW;              // 휴지 구간 총량
  const rnd = rtRnd(jit ? Math.round(jit * 7919) + cycles : 1);
  // 휴지 길이 배열 — 합이 정확히 rest0이 되도록 정규화 (총 폭이 w에서 안 어긋남)
  const rs = [];
  for (let c = 0; c < cycles; c++) rs.push(jit ? Math.max(0.10, 1 + (rnd() - 0.5) * jit * 3.6) : 1);
  const sum = rs.reduce((a2, b2) => a2 + b2, 0);
  for (let c = 0; c < cycles; c++) rs[c] = rs[c] / sum * rest0;

  let bx = x0;
  for (let c = 0; c < cycles; c++) {
    for (let u = 0; u < ACT; u += step) {
      let y = base;
      if (kind === 'ecg') {
        if (u >= 0.14 && u < 0.22) y = base - amp * 0.09 * Math.sin((u - 0.14) / 0.08 * Math.PI);
        else if (u >= 0.30 && u < 0.325) y = base + amp * 0.10 * ((u - 0.30) / 0.025);
        else if (u >= 0.325 && u < 0.355) y = base + amp * 0.10 - amp * 1.10 * ((u - 0.325) / 0.030);
        else if (u >= 0.355 && u < 0.390) y = base - amp + amp * 1.28 * ((u - 0.355) / 0.035);
        else if (u >= 0.390 && u < 0.425) y = base + amp * 0.28 - amp * 0.28 * ((u - 0.390) / 0.035);
        else if (u >= 0.46 && u < 0.72) y = base - amp * 0.20 * Math.sin((u - 0.46) / 0.26 * Math.PI);
      } else if (kind === 'pleth' || kind === 'abp') {
        const k = kind === 'abp' ? 0.82 : 1;
        if (u < 0.10) y = base - amp * k * Math.pow(u / 0.10, 0.75);
        else if (u < 0.20) y = base - amp * k * (1 - 0.20 * ((u - 0.10) / 0.10));
        else if (u < 0.30) y = base - amp * k * (0.80 - 0.14 * ((u - 0.20) / 0.10));
        else if (u < 0.36) y = base - amp * k * (0.66 + 0.07 * ((u - 0.30) / 0.06));
        else if (u < 0.88) y = base - amp * k * 0.73 * Math.pow(1 - (u - 0.36) / 0.52, 1.5);
      } else {
        if (u < 0.16) y = base - amp * 0.9 * Math.pow(u / 0.16, 1.4);
        else if (u < 0.40) y = base - amp * (0.9 + 0.1 * Math.sin((u - 0.16) / 0.24 * Math.PI));
        else if (u < 0.60) y = base - amp * 0.9 * Math.pow(1 - (u - 0.40) / 0.20, 1.2);
      }
      pts.push([bx + u * cw, y]);
    }
    bx += actW;
    pts.push([bx, base]);
    bx += rs[c];
    pts.push([bx, base]);
  }
  return pts;
}
function vtSimplify(pts, tol) {
  if (pts.length < 3) return pts;
  const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = out[out.length - 1], b = pts[i], c = pts[i + 1];
    const dx = c[0] - a[0], dy = c[1] - a[1];
    const L = Math.hypot(dx, dy) || 1;
    if (Math.abs((b[0] - a[0]) * dy - (b[1] - a[1]) * dx) / L > tol) out.push(b);
  }
  out.push(pts[pts.length - 1]);
  return out;
}
function vtPath(pts) {
  const r = v => (Math.round(v * 10) / 10).toString();
  return 'M' + pts.map(p => r(p[0]) + ' ' + r(p[1])).join('L');
}
function vtLen(pts) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return L;
}

// 스윕 파형 1줄
function vtTrace(x, y, w, h, kind, bpm, color, C, uid, flat, sw, box, grid, jit, cline) {
  const base = y + h * 0.57, amp = h * 0.32;
  let g = '';
  if (box) g += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${C.faint}" stroke-width="0.8" opacity="0.5"/>`;
  // 스케일 그리드 — 실기에서 pleth는 점선, abp는 실선+눈금라벨
  // (지우개보다 나중에 그려야 커서가 지나가도 안 사라짐)
  let gridSvg = '';
  if (grid && (kind === 'pleth' || kind === 'abp')) {
    const lv = kind === 'abp' ? [0.20, 0.52, 0.88] : [0.22, 0.44, 0.66];
    const dash = kind === 'abp' ? '' : ' stroke-dasharray="2 3"';
    lv.forEach((f, i) => {
      const gy = (y + h * f).toFixed(1);
      gridSvg += `<line x1="${x}" y1="${gy}" x2="${x + w}" y2="${gy}" stroke="${color}" stroke-width="0.7" opacity="0.34"${dash}/>`;
      if (kind === 'abp') gridSvg += `<text x="${x + 3}" y="${(y + h * f - 2).toFixed(1)}" font-family="monospace" font-size="7.5" fill="${color}" opacity="0.6">${[150, 75, 0][i]}</text>`;
    });
  }
  g += `<clipPath id="${uid}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath>`;
  if (flat) {
    g += `<g clip-path="url(#${uid})">${gridSvg}<line x1="${x}" y1="${base}" x2="${x + w}" y2="${base}" stroke="${color}" stroke-width="1.8"/>`
      + (cline ? `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + h}" stroke="${color}" stroke-width="1.5" opacity="0.85">`
        + `<animateTransform attributeName="transform" type="translate" values="0 0;${w} 0" dur="${sw}s" repeatCount="indefinite"/></line>` : '')
      + `</g>`;
    return g;
  }
  // 주기당 최소 폭 보장 — 좁으면 파형이 뭉개지므로 주기 수를 제한하고 스윕을 그만큼 빠르게
  const MINCW = kind === 'resp' ? 60 : 40;
  const maxC = Math.max(1, Math.floor(w / MINCW));
  let cycles = Math.max(1, Math.round(bpm / 60 * sw));
  let swE = sw;
  if (cycles > maxC) { cycles = maxC; swE = Math.max(1.2, cycles * 60 / bpm); }
  const cwPx = w / cycles;
  const tol = Math.min(0.28, cwPx / 170);      // 주기가 좁을수록 단순화를 약하게
  const step = kind === 'ecg' ? 0.004 : 0.010;
  const mk = j => vtSimplify(vtPts(kind, x, w, base, amp, cycles, step, j), tol);
  const cur = mk(0);                          // 새로 그려지는 파형 (정형)
  const gh = jit > 0 ? mk(jit) : cur;         // 잔상 (직전 사이클, 미세하게 다름)
  const d = vtPath(cur), L = vtLen(cur);
  const EB = Math.max(9, w * 0.03);

  g += `<g clip-path="url(#${uid})">`;
  // 직전 사이클 잔상
  g += `<path d="${vtPath(gh)}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linejoin="round" opacity="0.24"/>`;
  // 커서가 지나간 자리의 잔상을 지움 (커서 왼쪽엔 새 파형만 남음)
  g += `<rect x="${x}" y="${y + 1}" width="0" height="${h - 2}" fill="${C.bg}">`
    + `<animate attributeName="width" values="0;${(w + EB).toFixed(1)}" dur="${swE.toFixed(2)}s" repeatCount="indefinite"/></rect>`;
  g += gridSvg;   // 지우개 위에 다시 → 커서가 지나가도 그리드 유지
  g += `<path d="${d}" fill="none" stroke="${color}" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round"`
    + ` stroke-dasharray="${L.toFixed(1)}" stroke-dashoffset="${L.toFixed(1)}">`
    + `<animate attributeName="stroke-dashoffset" values="${L.toFixed(1)};0" dur="${swE.toFixed(2)}s" repeatCount="indefinite"/></path>`;
  if (cline) g += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + h}" stroke="${C.hot}" stroke-width="1.4" opacity="0.9">`
    + `<animateTransform attributeName="transform" type="translate" values="0 0;${w} 0" dur="${swE.toFixed(2)}s" repeatCount="indefinite"/></line>`;
  g += `</g>`;
  return g;
}

function renderVital(params) {
  const g = k => params.get(k);
  const C = rtTheme(g('th'));
  const lay = (g('lay') || 'a').toLowerCase() === 'b' ? 'b' : 'a';
  const W = rtNum(g('w'), lay === 'b' ? 680 : 420, 360, 920);
  const sw = rtNum(g('sw'), 6, 2, 30);         // 화면 1회 스윕 시간(초). 좁으면 자동 단축됨
  const box = ['1', 'on', 'y'].includes((g('bx') || '').toLowerCase());   // 파형 박스 테두리 (기본 없음)
  const grid = !['0', 'off', 'n'].includes((g('gr') || '').toLowerCase()); // 스케일 그리드 (기본 켜짐)
  const jit = rtNum(g('jit'), 0.35, 0, 1);    // R-R 간격 변동 (0이면 완전 규칙)
  const cline = (g('cur') || '').toLowerCase() !== 'off';  // 스윕 커서 선 표시 (동작은 동일, 선만 숨김)
  const flat = ['1', 'on', 'y', 'true'].includes((g('flat') || '').toLowerCase());

  const pp = (g('p') || '').split('§');
  const name = (pp[0] || '').trim(), pid = (pp[1] || '').trim(), cond = (pp[2] || '').trim();

  const COL = { 0: C.main, 1: '#FF7722', 2: C.warn };

  // 수치 수집
  const bpRaw = (g('bp') || '').split('§');
  const cells = [];
  const push = (key, raw, disp) => {
    if (raw === null || raw === undefined || String(raw).trim() === '') return;
    const r = vtLevel(raw, key);
    const R = VT_RANGE[key];
    cells.push({ label: R.label, val: disp ? disp(r.v) : r.v, unit: R.unit, lv: flat && key === 'hr' ? 2 : r.lv });
  };
  push('hr', flat ? '!0' : g('hr'));
  push('spo2', flat ? '!0' : g('spo2'));
  if (bpRaw[0] && bpRaw[0].trim() !== '') {
    const r = vtLevel(bpRaw[0], 'sbp');
    const dia = (bpRaw[1] || '').replace(/^[!*~]/, '').trim();
    cells.push({ label: 'BP', val: r.v + (dia ? '/' + dia : ''), unit: '', lv: flat ? 2 : r.lv });
  }
  push('rr', flat ? '!0' : g('rr'));
  push('tp', g('tp'));

  // ex=라벨§값§단위§상태 | ...
  (g('ex') || '').split('|').filter(Boolean).forEach(s => {
    const f = s.split('§');
    const lb = (f[0] || '').trim();
    if (!lb) return;
    let v = (f[1] || '').trim(), lv = 0;
    const mk = (f[3] || v).trim();
    if (mk.startsWith('!')) lv = 2; else if (mk.startsWith('*')) lv = 1;
    v = v.replace(/^[!*~]/, '');
    cells.push({ label: lb, val: v, unit: (f[2] || '').trim(), lv });
  });

  // 파형 종류
  const wv = (g('wv') || 'ecg').split('§').map(s => s.trim().toLowerCase()).filter(Boolean);
  const traces = wv.filter(k => ['ecg', 'pleth', 'abp', 'resp'].includes(k));
  const TR = traces.length ? traces : ['ecg'];

  const hrN = rtNum(String(g('hr') || '').replace(/^[!*~]/, ''), 72, 1, 300);
  const rrN = rtNum(String(g('rr') || '').replace(/^[!*~]/, ''), 16, 1, 80);

  const PAD = 14, TOPBAR = name || pid || cond ? 34 : 8;
  const TRH = 68, TRGAP = 6;
  const waveH = TR.length * TRH + (TR.length - 1) * TRGAP;

  // 셀 배치
  const perRow = lay === 'b' ? 1 : (W >= 520 ? 4 : 3);
  const cellRows = Math.ceil(cells.length / perRow) || 1;
  const CELLH = 52;

  let waveW, panelW, H;
  if (lay === 'b') {
    panelW = 196;
    waveW = W - PAD * 2 - panelW - 10;
    const panelH = cells.length * CELLH + (cells.length - 1) * 6;
    H = TOPBAR + Math.max(waveH, panelH) + PAD * 2 + 24;
  } else {
    waveW = W - PAD * 2;
    H = TOPBAR + waveH + 10 + cellRows * CELLH + (cellRows - 1) * 6 + PAD * 2 + 24;
  }

  const uid = 'vt' + (rtSeed(name + W + TR.join()) % 100000);
  let b = `<rect width="${W}" height="${H}" fill="${C.bg}"/>`;
  b += `<rect x="2" y="2" width="${W - 4}" height="${H - 4}" fill="none" stroke="${flat ? C.warn : C.main}" stroke-width="2">`
    + (flat ? `<animate attributeName="opacity" values="1;1;0.25;1" keyTimes="0;0.4;0.55;1" dur="1.2s" repeatCount="indefinite"/>` : '')
    + `</rect>`;

  // 상단 바
  if (TOPBAR > 8) {
    const meta = [pid, cond].filter(Boolean).join('  ·  ');
    b += `<text x="${PAD}" y="24" font-family="monospace" font-size="14" font-weight="bold" fill="${C.main}">${esc(name)}</text>`;
    if (meta) b += `<text x="${W - PAD}" y="24" font-family="monospace" font-size="11.5" font-weight="600" fill="${C.dim}" text-anchor="end">${esc(meta)}</text>`;
    b += `<line x1="${PAD - 4}" y1="31" x2="${W - PAD + 4}" y2="31" stroke="${C.main}" stroke-width="1" opacity="0.5"/>`;
  }

  // 파형
  const wy0 = TOPBAR + 6;
  const TRCOL = { ecg: C.main, pleth: '#00BBDD', abp: '#FF6699', resp: '#CCAA88' };
  TR.forEach((k, i) => {
    const y = wy0 + i * (TRH + TRGAP);
    const bpm = k === 'resp' ? rrN : hrN;
    void 0;
    b += vtTrace(PAD, y, waveW, TRH, k, bpm, flat ? C.warn : TRCOL[k], C, uid + '_' + i, flat, sw, box, grid, jit, cline);
    const lb = k.toUpperCase();
    b += `<rect x="${PAD + 3}" y="${y + 2}" width="${(rtTw(lb, 9.5) + 7).toFixed(1)}" height="13" fill="${C.bg}"/>`;
    b += `<text x="${PAD + 6}" y="${y + 12}" font-family="monospace" font-size="9.5" font-weight="700" fill="${TRCOL[k] || C.dim}" opacity="0.85">${lb}</text>`;
  });

  // 수치 셀
  const drawCell = (c, x, y, w) => {
    const col = COL[c.lv];
    let s = `<rect x="${x.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${CELLH - 4}" fill="none" stroke="${col}" stroke-width="${c.lv ? 1.4 : 1}" opacity="${c.lv ? 1 : 0.55}" rx="2">`;
    if (c.lv === 2) s += `<animate attributeName="opacity" values="1;1;0.3;1" keyTimes="0;0.45;0.6;1" dur="1s" repeatCount="indefinite"/>`;
    s += `</rect>`;
    s += `<text x="${(x + 7).toFixed(1)}" y="${y + 15}" font-family="monospace" font-size="10" font-weight="600" fill="${C.dim}">${esc(c.label)}</text>`;
    const vs = String(c.val);
    let fs = 21;
    const availW = w - 14 - (c.unit ? rtTw(c.unit, 10) + 4 : 0);
    if (rtTw(vs, fs) > availW) fs = Math.max(11, fs * availW / rtTw(vs, fs));
    s += `<text x="${(x + 7).toFixed(1)}" y="${y + 39}" font-family="monospace" font-size="${fs.toFixed(1)}" font-weight="bold" fill="${col}">${esc(vs)}`;
    if (c.lv === 2) s += `<animate attributeName="opacity" values="1;1;0.35;1" keyTimes="0;0.45;0.6;1" dur="1s" repeatCount="indefinite"/>`;
    s += `</text>`;
    if (c.unit) s += `<text x="${(x + w - 7).toFixed(1)}" y="${y + 39}" font-family="monospace" font-size="10" font-weight="600" fill="${C.dim}" text-anchor="end">${esc(c.unit)}</text>`;
    return s;
  };

  if (lay === 'b') {
    const px = PAD + waveW + 10;
    cells.forEach((c, i) => { b += drawCell(c, px, wy0 + i * (CELLH + 2), 196); });
  } else {
    const py0 = wy0 + waveH + 10;
    const gap = 6;
    const cw = (W - PAD * 2 - gap * (perRow - 1)) / perRow;
    cells.forEach((c, i) => {
      const r = Math.floor(i / perRow), q = i % perRow;
      b += drawCell(c, PAD + q * (cw + gap), py0 + r * (CELLH + gap), cw);
    });
  }

  // 하단 상태
  const msg = flat ? 'ASYSTOLE — NO PULSE' : (cells.some(c => c.lv === 2) ? 'ALARM' : cells.some(c => c.lv === 1) ? 'CAUTION' : 'STABLE');
  const mcol = flat || cells.some(c => c.lv === 2) ? C.warn : cells.some(c => c.lv === 1) ? '#FF7722' : C.main;
  b += `<line x1="${PAD - 4}" y1="${H - 26}" x2="${W - PAD + 4}" y2="${H - 26}" stroke="${C.main}" stroke-width="1" opacity="0.5"/>`;
  b += `<text x="${PAD}" y="${H - 10}" font-family="monospace" font-size="11.5" font-weight="bold" fill="${mcol}">${msg}`;
  if (mcol !== C.main) b += `<animate attributeName="opacity" values="1;1;0.3;1" keyTimes="0;0.45;0.6;1" dur="1s" repeatCount="indefinite"/>`;
  b += `</text>`;
  if (!flat) b += `<text x="${W - PAD}" y="${H - 10}" font-family="monospace" font-size="11.5" font-weight="600" fill="${C.dim}" text-anchor="end">MONITORING</text>`;

  let sl = '';
  for (let y = 0; y < H; y += 3) sl += `<rect x="0" y="${y}" width="${W}" height="1" fill="${C.main}" opacity="0.035"/>`;
  b += sl;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${b}</svg>`;
}

// ════════════════════════════════════════════
//  FETCH
// ════════════════════════════════════════════
export default {
  async fetch(req) {
    const url = new URL(req.url);
    const params = url.searchParams;
    const t = params.get('t') || '';

    let svg;
    if (t === 'vn') svg = renderVN(params);
    else if (t === 'vn2') svg = renderVN2(params);
    else if (t === 'dark') svg = renderDark(params);
    else if (t === 'pixel') svg = renderPixel(params);
    else if (t === 'ending') svg = renderEnding(params);
    else if (t === 'rpg2k') svg = renderRpg2k(params);
    else if (t === 'choice') svg = renderChoice(params);
    else if (t === 'dungeon') svg = renderDungeon(params);
    else if (t === 'mmo') svg = renderMmo(params);
    else if (t === 'reward') svg = renderReward(params);
    else if (t === 'gameover') svg = renderGameover(params);
    else if (t === 'inv') svg = renderInv(params);
    else if (t === 'stat') svg = renderStat(params);
    else if (t === 'roll') svg = renderRoll(params);
    else if (t === 'radar') svg = renderRadar(params);
    else if (t === 'term') svg = renderTerm(params);
    else if (t === 'vital') svg = renderVital(params);
    else {
      return new Response('사용 가능: ?t=vn / ?t=vn2 / ?t=dark / ?t=pixel / ?t=ending / ?t=rpg2k / ?t=choice / ?t=dungeon / ?t=mmo / ?t=reward / ?t=gameover / ?t=inv / ?t=stat / ?t=roll / ?t=radar / ?t=term / ?t=vital', {
        status: 400, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }

    return new Response(svg, {
      headers: { 'content-type': 'image/svg+xml', 'cache-control': 'no-cache' }
    });
  }
};
