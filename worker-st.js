// st.winter0.workers.dev — RPG/VN 상태창 (SVG 이미지 출력)
// ?t=vn / ?t=dark / ?t=pixel / ?t=ending / ?t=rpg2k / ?t=choice / ?t=dungeon

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

function hearts(val) {
  const h = Math.round(val / 20);
  return '♥'.repeat(h) + '♡'.repeat(5 - h);
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
    return '#8889CD';
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

function renderCharCard(char, y, W) {
  const PAD = 18;
  const cardH = 115;
  const parts = char.split('§');
  const rawName = parts[0];
  const name = rawName?.trim() || '???';
  const isLocked = name === '???' || !rawName?.trim();
  const af = safeInt(parts[1], 0);
  const mood = esc((parts[2] || '').trim());
  const mem = esc((parts[3] || '').trim());
  const barX = PAD + 100;
  const barW = W - barX - PAD - 50;

  return `<rect x="${PAD}" y="${y}" width="${W - PAD * 2}" height="${cardH}" rx="5"
  fill="${isLocked ? '#150f18' : '#1e1525'}" stroke="${isLocked ? '#2a2030' : '#3a2a48'}" stroke-width="1"/>
<text x="${PAD + 14}" y="${y + 28}" font-family="'Noto Serif KR',Georgia,serif"
  font-size="17" font-weight="bold" fill="${isLocked ? '#4a3a55' : '#f0e0f5'}"
  ${isLocked ? 'filter="url(#blur)"' : ''}>${esc(name)}</text>
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
  fill="#BB6688" letter-spacing="2">${hearts(af)}</text>`}
${mood && !isLocked ? `<text x="${PAD + 14}" y="${y + 92}" font-family="'Noto Serif KR',Georgia,serif"
  font-size="12" fill="#b090c8" font-style="italic">" ${mood.length > 16 ? mood.slice(0, 16) + '…' : mood} "</text>` : ''}
${mem && !isLocked ? `<text x="${W - PAD - 10}" y="${y + 92}" font-family="'Noto Serif KR',Georgia,serif"
  font-size="11" fill="#8070a0" text-anchor="end">📎 ${mem.length > 12 ? mem.slice(0, 12) + '…' : mem}</text>` : ''}
${isLocked ? `<text x="${W/2}" y="${y + 74}" font-family="monospace" font-size="14" font-weight="bold"
  fill="#3a2a45" text-anchor="middle">🔒 미해금</text>` : ''}`;
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
  const date = esc(formatVNDate(params.get('date'), params.get('time')));
  const title = esc(params.get('title') || 'RELATIONSHIP STATUS');
  const chars = rawChars.split('|').slice(0, 6);

  const HEADER_H = 64, CARD_H = 115, MY_LABEL_H = 28;
  const MY_H = 26 + 5 * 30 + 16;
  const FOOTER_H = 10;
  const TOTAL_H = HEADER_H + chars.length * CARD_H + MY_LABEL_H + MY_H + FOOTER_H;

  let cardsY = HEADER_H;
  let cardsSVG = '';
  chars.forEach(char => { cardsSVG += renderCharCard(char, cardsY, W); cardsY += CARD_H; });

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
//  DARK (다크판타지)
//  &p=이름§칭호§직업§성향§레벨
//  &s=hp§hpmax§mp§mpmax§sp§spmax§exp
//  &stat=str§def§agi§int§luk§wis
//  &eq=무기§등급§방어구§등급§악세서리§등급
//  &buf=버프1§!디버프1
// ════════════════════════════════════════════

function darkBarColor(type, val) {
  if (type === 'hp')  { if (val < 20) return '#EE1166'; if (val < 40) return '#FF7722'; return '#BB6688'; }
  if (type === 'mp')  { if (val < 20) return '#884499'; return '#8889CD'; }
  if (type === 'sp')  { if (val < 20) return '#FF7722'; return '#CCAA88'; }
  if (type === 'exp') return '#884499';
  return '#8889CD';
}

function darkBar(x, y, w, h, val, max, type) {
  const pct = Math.min(100, Math.round((val / max) * 100));
  const filled = Math.round((pct / 100) * w);
  const col = darkBarColor(type, pct);
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="#0a0805"/>
<rect x="${x}" y="${y}" width="${filled}" height="${h}" rx="2" fill="${col}"/>
<rect x="${x}" y="${y}" width="${filled}" height="${Math.ceil(h/2)}" rx="2" fill="rgba(255,255,255,0.06)"/>`;
}

function darkStatBar(x, y, w, h, val) {
  const filled = Math.round((Math.min(99, val) / 99) * w);
  const col = val > 80 ? '#CCAA88' : val > 50 ? '#8889CD' : '#BB6688';
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="#0d0a08"/>
<rect x="${x}" y="${y}" width="${filled}" height="${h}" rx="2" fill="${col}" opacity="0.85"/>`;
}

function gradeColor(g) {
  return { '전설': '#CCAA88', '에픽': '#884499', '희귀': '#8889CD', '일반': '#6a5a48' }[g] || '#6a5a48';
}

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
  const eqItems = [{icon:'🗡',type:'WEAPON',name:wpnName,grade:wpnGrade},{icon:'🧥',type:'ARMOR',name:armName,grade:armGrade},{icon:'💍',type:'ACCESSORY',name:accName,grade:accGrade}];
  svg += `<rect x="0" y="${y}" width="${W}" height="${EQ_H}" fill="#0c0a07"/>
<text x="${PAD}" y="${y+16}" font-family="monospace" font-size="10" font-weight="bold" fill="#6a5a40" letter-spacing="2">EQUIPMENT</text>`;
  eqItems.forEach((e,i) => {
    const ey = y+22+i*30; const gcol = gradeColor(e.grade);
    svg += `<rect x="${PAD}" y="${ey}" width="${INNER_W}" height="26" rx="3" fill="#0a0805" stroke="#1e1810" stroke-width="1"/>
<text x="${PAD+10}" y="${ey+18}" font-size="14">${e.icon}</text>
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
      const bcol = isD ? '#BB6688' : '#8889CD'; const bw = label.length * 9 + 24;
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
  if (type==='mp') { if(pct<20) return '#884499'; return '#8889CD'; }
  if (type==='sp') return '#CCAA88';
  if (type==='exp') return '#884499';
  if (type==='atk') return '#BB6688';
  if (type==='def') return '#8889CD';
  if (type==='agi') return '#CCAA88';
  if (type==='mag') return '#884499';
  if (type==='luk') return '#DDAACC';
  return '#8889CD';
}

function pixelBar(x, y, w, h, val, max, type) {
  const pct = Math.min(100, Math.round((val / max) * 100));
  const col = pixelBarColor(type, pct);
  const BLOCK = 4, GAP = 1;
  const totalBlocks = Math.floor(w / (BLOCK + GAP));
  const filledBlocks = Math.round((pct / 100) * totalBlocks);
  let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#000"/>`;
  for (let i = 0; i < totalBlocks; i++) {
    out += `<rect x="${x + i*(BLOCK+GAP)}" y="${y}" width="${BLOCK}" height="${h}" fill="${i < filledBlocks ? col : '#1a1a2e'}" opacity="${i < filledBlocks ? 1 : 0.5}"/>`;
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
  const S='#8889CD',D='#DDAACC',C='#CCAA88',B='#BB6688',P='#884499',E='#EE1166',O='#FF7722';
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
  svg += `<rect x="0" y="0" width="${W}" height="${TITLEBAR_H}" fill="#8889CD"/>
<rect x="0" y="${TITLEBAR_H-3}" width="${W}" height="3" fill="#000"/>
<text x="${W/2}" y="15" font-family="monospace" font-size="11" fill="#000" text-anchor="middle" letter-spacing="2" font-weight="bold">STATUS</text>`;
  y = TITLEBAR_H;

  // 헤더
  svg += `<rect x="0" y="${y}" width="${W}" height="${HEADER_H}" fill="#0d0d1e"/>
${pixelSprite(PAD, y+8, avKey)}
<text x="${PAD+58}" y="${y+24}" font-family="monospace" font-size="16" font-weight="bold" fill="#DDAACC">${name}</text>
<text x="${PAD+58}" y="${y+40}" font-family="monospace" font-size="10" font-weight="bold" fill="#8a80a0" letter-spacing="1">${job}</text>
<text x="${PAD+58}" y="${y+56}" font-family="monospace" font-size="12" font-weight="bold" fill="#8889CD">LV.${lv}</text>
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
  const eqItems = [{icon:'🗡',label:'WEAPON',name:wpn},{icon:'🛡',label:'ARMOR',name:arm},{icon:'💍',label:'ACC',name:acc}];
  svg += `<rect x="0" y="${y}" width="${W}" height="${EQ_H}" fill="#0a0a1a"/>
<text x="${PAD}" y="${y+14}" font-family="monospace" font-size="9" font-weight="bold" fill="#5a5078" letter-spacing="2">▸ EQUIPMENT</text>`;
  eqItems.forEach((e,i) => {
    const ex = PAD+i*Math.floor(INNER_W/3), ey = y+20, slotW = Math.floor(INNER_W/3)-4;
    svg += `<rect x="${ex}" y="${ey}" width="${slotW}" height="54" fill="#000" stroke="#2a2040" stroke-width="2"/>
<text x="${ex+slotW/2}" y="${ey+20}" font-size="18" text-anchor="middle">${e.icon}</text>
<text x="${ex+slotW/2}" y="${ey+33}" font-family="monospace" font-size="8" font-weight="bold" fill="#5a5078" text-anchor="middle" letter-spacing="1">${e.label}</text>
<text x="${ex+slotW/2}" y="${ey+47}" font-family="monospace" font-size="10" font-weight="bold" fill="#8889CD" text-anchor="middle">${e.name.length>7?e.name.slice(0,7)+'…':e.name}</text>`;
  });
  svg += pdiv(y + EQ_H);
  y += EQ_H;

  // BUFFS
  if (bufs.length > 0) {
    svg += `<rect x="0" y="${y}" width="${W}" height="${BUF_H}" fill="#0d0d1e"/>`;
    let bx = PAD;
    bufs.slice(0,6).forEach(buf => {
      const isD = buf.startsWith('!'); const label = esc(isD ? buf.slice(1) : buf);
      const bcol = isD ? '#BB6688' : '#8889CD'; const bw = label.length*8+20;
      svg += `<rect x="${bx}" y="${y+8}" width="${bw}" height="22" fill="#000" stroke="${bcol}" stroke-width="2"/>
<text x="${bx+bw/2}" y="${y+23}" font-family="monospace" font-size="10" font-weight="bold" fill="${bcol}" text-anchor="middle">${label}</text>`;
      bx += bw + 4;
    });
    y += BUF_H;
  }

  // 하단 바
  svg += `<rect x="0" y="${y}" width="${W}" height="3" fill="#000"/>
<rect x="0" y="${y+3}" width="${W}" height="${FOOTER_H-3}" fill="#8889CD"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${TOTAL_H}" viewBox="0 0 ${W} ${TOTAL_H}">
<rect width="${W}" height="${TOTAL_H}" fill="#080814"/>
<rect x="0" y="0" width="${W}" height="${TOTAL_H}" fill="none" stroke="#8889CD" stroke-width="4"/>
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
    normal: { bg:'#0d0d18', border:'#3a3060', accent:'#8889CD', accentDim:'#6668AA', textMain:'#d8d6f0', textSub:'#9898b8', label:'NORMAL ENDING', deco:'END'  },
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
    return `<ellipse cx="14" cy="14" rx="12" ry="6" fill="none" stroke="#DDAACC" stroke-width="1.5"/>
<circle cx="14" cy="14" r="4" fill="#BB6688"/>
<circle cx="14" cy="14" r="2" fill="#110d18"/>`;
  }
  if (mode === 'spark') {
    return `<path d="M14 26 C5 22, 3 14, 9 9 C10 13, 12 11, 11 6 C13 9, 16 4, 17 2 C18 8, 20 12, 21 9 C24 14, 23 22, 14 26 Z" fill="#CCAA88"/>
<path d="M14 24 C10 21, 9 17, 12 13 C13 15, 14 13, 13 10 C15 12, 17 8, 17 6 C18 12, 17 17, 16 20 Z" fill="#DDAACC"/>`;
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
    return `<path d="M2 14 Q14 8, 26 14" fill="none" stroke="#4a3a45" stroke-width="1.5"/>`;
  }
  if (mode === 'spark') {
    return `<g opacity="0.45"><path d="M14 26 C9 22, 8 16, 12 13 Q14 12, 14 9" fill="none" stroke="#6a5a70" stroke-width="1.2"/>
<path d="M14 9 Q11 5, 14 3 Q17 0, 13 0" fill="none" stroke="#6a5a70" stroke-width="0.8"/></g>`;
  }
  return '';
}

function renderRpg2k(params) {
  const W = 600, PAD = 32;

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

  body += `<text x="${PAD}" y="52" font-family="Georgia,'Noto Serif KR',serif" font-size="24" font-weight="bold" fill="#DDAACC">${name}</text>`;
  if (subtitle) {
    body += `<text x="${PAD}" y="74" font-family="Georgia,serif" font-size="13" fill="#BB6688" font-style="italic">${subtitle}</text>`;
  }
  if (chapter) {
    body += `<text x="${W-PAD}" y="52" font-family="monospace" font-size="11" font-weight="bold" fill="#8889CD" text-anchor="end" letter-spacing="2">${chapter}</text>`;
  }
  if (loc) {
    body += `<text x="${W-PAD}" y="72" font-family="monospace" font-size="11" fill="#8a7a90" text-anchor="end">▸ ${loc}</text>`;
  }
  body += `<line x1="${PAD}" y1="92" x2="${W-PAD}" y2="92" stroke="#2a2030" stroke-width="0.8"/>`;
  y = HEADER_H;

  const modeLabel = mode.toUpperCase();
  const hpColor = rpg2kIconColor(mode);
  body += `<text x="${PAD}" y="${y+24}" font-family="monospace" font-size="12" font-weight="bold" fill="#8a7a90" letter-spacing="2">VITALITY · ${modeLabel}</text>`;
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
  body += `<line x1="${PAD}" y1="${y+HP_H-2}" x2="${W-PAD}" y2="${y+HP_H-2}" stroke="#2a2030" stroke-width="0.8"/>`;
  y += HP_H;

  if (items.length > 0) {
    body += `<text x="${PAD}" y="${y+22}" font-family="monospace" font-size="12" font-weight="bold" fill="#8a7a90" letter-spacing="2">ITEMS</text>`;
    body += `<text x="${W-PAD}" y="${y+22}" font-family="monospace" font-size="10" fill="#8a7a90" text-anchor="end">${items.length} / 12</text>`;
    const colX = [PAD + 12, PAD + 188, PAD + 364];
    items.forEach((item, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const ix = colX[col];
      const iy = y + 46 + row * 22;
      const display = item.length > 9 ? item.slice(0, 9) + '…' : item;
      body += `<text x="${ix}" y="${iy}" font-family="Georgia,'Noto Serif KR',serif" font-size="13" fill="#CCAA88">◆ ${display}</text>`;
    });
    body += `<line x1="${PAD}" y1="${y+ITEM_H-2}" x2="${W-PAD}" y2="${y+ITEM_H-2}" stroke="#2a2030" stroke-width="0.8"/>`;
    y += ITEM_H;
  }

  if (logs.length > 0) {
    body += `<text x="${PAD}" y="${y+22}" font-family="monospace" font-size="12" font-weight="bold" fill="#8a7a90" letter-spacing="2">JOURNAL</text>`;
    logs.forEach((line, i) => {
      const ly = y + 44 + i * 20;
      const display = line.length > 36 ? line.slice(0, 36) + '…' : line;
      body += `<text x="${PAD+12}" y="${ly}" font-family="Georgia,serif" font-size="13" fill="#d8c8b0" font-style="italic">· ${display}</text>`;
    });
    body += `<line x1="${PAD}" y1="${y+LOG_H-2}" x2="${W-PAD}" y2="${y+LOG_H-2}" stroke="#2a2030" stroke-width="0.8"/>`;
    y += LOG_H;
  }

  if (note) {
    body += `<text x="${W/2}" y="${y+24}" font-family="Georgia,serif" font-size="13" fill="#8889CD" font-style="italic" text-anchor="middle">" ${note} "</text>`;
    y += NOTE_H;
  }

  const corners = `<path d="M${PAD+8} 20 L20 20 L20 ${PAD+8}" fill="none" stroke="#DDAACC" stroke-width="1" opacity="0.6"/>
<path d="M${W-PAD-8} 20 L${W-20} 20 L${W-20} ${PAD+8}" fill="none" stroke="#DDAACC" stroke-width="1" opacity="0.6"/>
<path d="M${PAD+8} ${TOTAL_H-20} L20 ${TOTAL_H-20} L20 ${TOTAL_H-PAD-8}" fill="none" stroke="#DDAACC" stroke-width="1" opacity="0.6"/>
<path d="M${W-PAD-8} ${TOTAL_H-20} L${W-20} ${TOTAL_H-20} L${W-20} ${TOTAL_H-PAD-8}" fill="none" stroke="#DDAACC" stroke-width="1" opacity="0.6"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${TOTAL_H}" viewBox="0 0 ${W} ${TOTAL_H}">
<rect width="${W}" height="${TOTAL_H}" fill="#110d18"/>
<rect x="2" y="2" width="${W-4}" height="${TOTAL_H-4}" rx="3" fill="none" stroke="#8889CD" stroke-width="1" opacity="0.4"/>
${corners}
${body}
</svg>`;
}

// ════════════════════════════════════════════
//  CHOICE (선택지 박스)
//  ?t=choice&c=보기1|보기2|보기3|보기4&title=라벨&st=vn|rpg|modern|dot
//  최대 4개, 숫자 prefix 자동, 본문 없음 (본문은 위쪽 챗봇 메시지)
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
    body += `<rect x="${PAD}" y="${y}" width="${W - PAD*2}" height="${ROW_H}" rx="6" fill="url(#choiceVnRow)" stroke="#8889CD" stroke-width="1" stroke-opacity="0.4"/>
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

  const accents = ['#8889CD', '#DDAACC', '#CCAA88', '#BB6688'];

  let body = '';
  if (title) {
    body += `<text x="${PAD}" y="26" font-family="monospace" font-size="11" font-weight="bold" fill="#8889CD" letter-spacing="3">—  ${title.toUpperCase()}</text>`;
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
<rect x="0" y="0" width="${W-4}" height="4" fill="#8889CD"/>
<rect x="0" y="${TOTAL_H-8}" width="${W-4}" height="4" fill="#8889CD"/>
<rect x="0" y="0" width="4" height="${TOTAL_H-4}" fill="#8889CD"/>
<rect x="${W-8}" y="0" width="4" height="${TOTAL_H-4}" fill="#8889CD"/>
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
  let choices = rawC ? rawC.split('|').map(s => s.trim()).filter(Boolean).slice(0, 4) : [];
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
  svg += `<text x="${svgW - PAD}" y="22" fill="#8889CD" font-family="monospace" font-size="11" text-anchor="end">${modeLabel}${rules.width}×${rules.height} · ${rules.bossLevel}${statusLabel}</text>`;
  
  const gx0 = PAD + COORD_LEFT, gy0 = PAD + HEADER + COORD_TOP;
  const px = x => gx0 + x * TILE;
  const py = y => gy0 + y * TILE;
  const cx = x => px(x) + TILE / 2;
  const cy = y => py(y) + TILE / 2;
  
  // 🆕 좌표 헤더 (coords=on일 때만, A=x1 / B=x2 ... 1=y1 / 2=y2 ...)
  if (showCoords) {
    for (let x = 1; x < w; x++) {
      const letter = String.fromCharCode(64 + x);
      svg += `<text x="${cx(x)}" y="${gy0 - 4}" fill="#8889CD" font-family="monospace" font-size="9" text-anchor="middle" opacity="0.7">${letter}</text>`;
    }
    for (let y = 1; y < h; y++) {
      svg += `<text x="${gx0 - 6}" y="${cy(y) + 3}" fill="#8889CD" font-family="monospace" font-size="9" text-anchor="end" opacity="0.7">${y}</text>`;
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
//  FETCH
// ════════════════════════════════════════════
export default {
  async fetch(req) {
    const url = new URL(req.url);
    const params = url.searchParams;
    const t = params.get('t') || '';

    let svg;
    if (t === 'vn') svg = renderVN(params);
    else if (t === 'dark') svg = renderDark(params);
    else if (t === 'pixel') svg = renderPixel(params);
    else if (t === 'ending') svg = renderEnding(params);
    else if (t === 'rpg2k') svg = renderRpg2k(params);
    else if (t === 'choice') svg = renderChoice(params);
    else if (t === 'dungeon') svg = renderDungeon(params);
    else {
      return new Response('사용 가능: ?t=vn / ?t=dark / ?t=pixel / ?t=ending / ?t=rpg2k / ?t=choice / ?t=dungeon', {
        status: 400, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }

    return new Response(svg, {
      headers: { 'content-type': 'image/svg+xml', 'cache-control': 'no-cache' }
    });
  }
};
