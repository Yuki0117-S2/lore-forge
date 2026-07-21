// 겨울의 생활 앱 UI Workers (j) v1 — 뼈대 + cal(달력) 파일럿
// 구조는 i 워커(worker.js v13)와 동일: TEMPLATES → RENDERERS → THEME_RENDERERS → SIZES → 동적높이 → wrapInSVG
const TEMPLATES = {
  'cal': `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  :root { --acc: #8889CD; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background:#fdfdfe; font-family: 'Noto Sans KR', -apple-system, sans-serif; }
  .cal { width: 420px; padding: 16px; background: #ffffff; color: #1c1c22; }
  /* ── 헤더 ── */
  .cal-head { padding: 4px 6px 14px; }
  .cal-title { font-size: 22px; font-weight: 800; color: #141418; line-height: 1.3; }
  .cal-sub { font-size: 13px; color: #a6a6b0; margin-top: 3px; }
  /* ── 요일 행 ── */
  .cal-wd { display: flex; margin-bottom: 6px; }
  .cal-wd span { flex: 1; text-align: center; font-size: 12px; font-weight: 700; color: #8a8a94; padding: 5px 0; }
  .cal-wd .sun { color: #BB6688; }
  .cal-wd .sat { color: #0077DD; }
  /* ── 날짜 그리드 ── */
  .cal-grid { display: flex; flex-wrap: wrap; border-top: 1px solid #ececf0; }
  .cal-cell { width: 14.285%; min-height: 74px; padding: 4px 2px; border-bottom: 1px solid #ececf0; overflow: hidden; }
  .cal-day { font-size: 12px; font-weight: 600; color: #33333b; text-align: center; height: 26px; line-height: 26px; }
  .cal-day.sun { color: #BB6688; }
  .cal-day.sat { color: #0077DD; }
  .cal-day.out { color: #d5d5dc; }
  .cal-today-wrap { display: flex; justify-content: center; height: 26px; align-items: center; }
  .cal-chip { display: block; font-size: 9px; line-height: 15px; height: 15px; margin-top: 2px; padding: 0 4px; border-radius: 4px; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600; }
  .cal-more { display: block; font-size: 9px; color: #a6a6b0; text-align: center; margin-top: 2px; font-weight: 700; }
  /* ── 일정 리스트 ── */
  .cal-agenda { margin-top: 14px; }
  .cal-ag-item { display: flex; align-items: flex-start; gap: 10px; padding: 7px 8px; border-radius: 10px; margin-bottom: 5px; background: #f6f6f9; }
  .cal-ag-day { flex-shrink: 0; min-width: 30px; height: 22px; line-height: 22px; text-align: center; border-radius: 7px; background: var(--acc); color: #fff; font-size: 11px; font-weight: 800; }
  .cal-ag-txt { font-size: 13px; color: #33333b; line-height: 1.45; padding-top: 1px; word-break: break-all; }
  /* ── 다크 ── */
  .cal.dark { background: #17131f; color: #e0dae8; }
  .cal.dark .cal-title { color: #f0edf6; }
  .cal.dark .cal-sub { color: #8b8397; }
  .cal.dark .cal-wd span { color: #9a92a8; }
  .cal.dark .cal-wd .sun { color: #DDAACC; }
  .cal.dark .cal-wd .sat { color: #00BBDD; }
  .cal.dark .cal-grid { border-top-color: #262130; }
  .cal.dark .cal-cell { border-bottom-color: #262130; }
  .cal.dark .cal-day { color: #cfc8da; }
  .cal.dark .cal-day.sun { color: #DDAACC; }
  .cal.dark .cal-day.sat { color: #00BBDD; }
  .cal.dark .cal-day.out { color: #3a3446; }
  .cal.dark .cal-more { color: #8b8397; }
  .cal.dark .cal-ag-item { background: #221e2c; }
  .cal.dark .cal-ag-txt { color: #cfc8da; }
</style>
</head>
<body>
\u27e6BODY\u27e7
</body>
</html>`,

  'pay': `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  :root { --acc: #8889CD; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background:#fdfdfe; font-family: 'Noto Sans KR', -apple-system, sans-serif; }
  .pay { width: 420px; padding: 26px 22px 22px; background: #ffffff; color: #1c1c22; }
  .pay-brand { font-size: 13px; font-weight: 800; color: var(--acc); letter-spacing: 0.4px; margin-bottom: 18px; }
  /* ── 송금 완료 ── */
  .pay-check { display: flex; justify-content: center; margin: 6px 0 18px; }
  .pay-title { text-align: center; font-size: 17px; color: #55555f; line-height: 1.5; }
  .pay-title strong { color: #1c1c22; font-weight: 700; }
  .pay-amount { text-align: center; font-size: 34px; font-weight: 800; color: var(--acc); margin: 6px 0 2px; letter-spacing: -0.5px; }
  .pay-done-sub { text-align: center; font-size: 17px; color: #55555f; margin-bottom: 22px; }
  .pay-info { border-top: 1px solid #ececf0; padding-top: 6px; margin-bottom: 20px; }
  .pay-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; padding: 10px 4px; font-size: 14px; }
  .pay-row .k { color: #a6a6b0; flex-shrink: 0; }
  .pay-row .v { color: #33333b; font-weight: 600; text-align: right; word-break: break-all; line-height: 1.45; }
  .pay-btn { display: block; text-align: center; background: var(--acc); border-radius: 12px; padding: 14px 0; font-size: 15px; font-weight: 800; }
  .pay-btn2 { display: flex; gap: 10px; }
  .pay-btn2 .pay-btn { flex: 1; }
  .pay-btn.ghost { background: #f1f1f5; color: #55555f !important; }
  /* ── 송금 요청 ── */
  .pay-req-head { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }
  .pay-req-badge { font-size: 11px; font-weight: 800; color: #ffffff; background: var(--acc); border-radius: 20px; padding: 3px 10px; }
  .pay-ava { display: flex; justify-content: center; margin-bottom: 14px; }
  .pay-memo { background: #f6f6f9; border-radius: 12px; padding: 12px 16px; font-size: 14px; color: #33333b; line-height: 1.55; text-align: center; margin: 16px 0 6px; word-break: break-all; }
  .pay-due { text-align: center; font-size: 12px; color: #a6a6b0; margin-bottom: 20px; }
  /* ── 거래 내역 ── */
  .pay-bal { border-radius: 16px; padding: 20px; margin-bottom: 16px; color: #ffffff; }
  .pay-bal .nm { font-size: 13px; font-weight: 600; opacity: 0.85; }
  .pay-bal .amt { font-size: 28px; font-weight: 800; margin-top: 4px; letter-spacing: -0.5px; }
  .pay-tx { display: flex; align-items: center; gap: 12px; padding: 12px 4px; border-bottom: 1px solid #f1f1f5; }
  .pay-tx:last-child { border-bottom: none; }
  .pay-tx-ini { flex-shrink: 0; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 800; color: #ffffff; }
  .pay-tx-mid { flex: 1; min-width: 0; }
  .pay-tx-nm { font-size: 14px; font-weight: 700; color: #1c1c22; }
  .pay-tx-sub { font-size: 12px; color: #a6a6b0; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pay-tx-amt { flex-shrink: 0; font-size: 15px; font-weight: 800; }
  .pay-tx-amt.out { color: #EE1166; }
  .pay-tx-amt.in { color: #0077DD; }
  /* ── 다크 ── */
  .pay.dark { background: #17131f; color: #e0dae8; }
  .pay.dark .pay-title { color: #a99fb8; }
  .pay.dark .pay-title strong { color: #f0edf6; }
  .pay.dark .pay-done-sub { color: #a99fb8; }
  .pay.dark .pay-info { border-top-color: #262130; }
  .pay.dark .pay-row .k { color: #8b8397; }
  .pay.dark .pay-row .v { color: #cfc8da; }
  .pay.dark .pay-btn.ghost { background: #221e2c; color: #a99fb8 !important; }
  .pay.dark .pay-memo { background: #221e2c; color: #cfc8da; }
  .pay.dark .pay-due { color: #8b8397; }
  .pay.dark .pay-tx { border-bottom-color: #262130; }
  .pay.dark .pay-tx-nm { color: #f0edf6; }
  .pay.dark .pay-tx-sub { color: #8b8397; }
  .pay.dark .pay-tx-amt.in { color: #00BBDD; }
  .pay.dark .pay-tx-amt.out { color: #FF6699; }
</style>
</head>
<body>
\u27e6BODY\u27e7
</body>
</html>`,
};

const SIZES = {
  'cal': [420, 600],
  'pay': [420, 560],
};

// ══════════════════════════════════════════════════════════════
// 공통 테마 유틸 — i 워커(worker.js) 이식, 로직 동일
// ══════════════════════════════════════════════════════════════

function themeRGB(hex) {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

// 체감 밝기 0~255 (ITU-R BT.601 가중치)
function themeLum(hex) {
  const c = themeRGB(hex);
  return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
}

// 배경 밝기에 따른 글자색 자동 선택
function themeText(hex) {
  return themeLum(hex) > 150 ? '#1a1a1a' : '#ffffff';
}

// A색을 B색 방향으로 ratio(0~1)만큼 이동
function themeMix(hexA, hexB, ratio) {
  const a = themeRGB(hexA), b = themeRGB(hexB);
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * ratio).toString(16).padStart(2, '0')).join('');
}

// 3/6자리 헥스 정규화 (i 워커 pollHex와 동일 로직)
function jHex(s) {
  s = (s || '').trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(s)) s = s.split('').map(c => c + c).join('');
  return /^[0-9a-fA-F]{6}$/.test(s) ? '#' + s.toLowerCase() : null;
}

// XML 안전 이스케이프 (foreignObject 안 XHTML이므로 <, > 필수)
function jEsc(v) {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ══════════════════════════════════════════════════════════════
// 📅 CAL (달력) — 파일럿 1호
// p=년§월[§제목] · e=일§내용[§색]|... · d=오늘일자(SMIL 펄스) · th=스타일[§배경][§강조색]
// th 3필드 위치규칙: 스타일 light(기본)/dark · 배경 프리셋4종 또는 헥스 · 강조색 헥스
// ══════════════════════════════════════════════════════════════

const CAL_PRESETS = {
  'indigo': '#8889CD', '인디고': '#8889CD',
  'pink': '#DDAACC', '핑크': '#DDAACC',
  'sand': '#CCAA88', '샌드': '#CCAA88',
  'rose': '#BB6688', '로즈': '#BB6688',
};

const CAL_CHIP_COLORS = {
  '인디고': '#8889CD', '핑크': '#DDAACC', '샌드': '#CCAA88', '로즈': '#BB6688',
  '보라': '#884499', '빨강': '#EE1166', '진핑크': '#FF6699', '하늘': '#00BBDD', '주황': '#FF7722', '파랑': '#0077DD',
};

function calTheme(url) {
  const out = { style: 'light', bg: null, acc: null };
  const raw = url.searchParams.get('th');
  if (!raw) return out;
  const f = raw.split('\u00a7').map(s => s.trim()).filter(s => s.length);
  let i = 0;
  const s0 = (f[0] || '').toLowerCase();
  if (s0 === 'light' || s0 === 'dark') { out.style = s0; i = 1; }
  if (f[i]) {
    const p = CAL_PRESETS[f[i].toLowerCase()] || CAL_PRESETS[f[i]];
    if (p) { out.bg = p; i++; }
    else { const hx = jHex(f[i]); if (hx) { out.bg = hx; i++; } }
  }
  if (f[i]) { const hx = jHex(f[i]); if (hx) out.acc = hx; }
  return out;
}

// 일정 파싱: 일§내용[§색] | ...  (선택 필드는 통째로 생략 — 빈 §§ 금지 원칙)
function calEvents(e) {
  return (e || '').split('|').map(r => r.trim()).filter(Boolean).map(r => {
    const seg = r.split('\u00a7');
    const day = parseInt(seg[0], 10);
    let txt = '', color = null;
    if (seg.length >= 3) {
      const last = seg[seg.length - 1].trim();
      const named = CAL_CHIP_COLORS[last];
      const hx = named || jHex(last);
      if (hx) { color = hx; txt = seg.slice(1, -1).join('\u00a7'); }
      else txt = seg.slice(1).join('\u00a7');
    } else {
      txt = seg[1] || '';
    }
    return (day >= 1 && day <= 31 && txt) ? { day, txt, color } : null;
  }).filter(Boolean);
}

function renderCal(html, url) {
  const th = calTheme(url);
  const pSeg = (url.searchParams.get('p') || '').split('\u00a7');
  const now = new Date();
  let y = parseInt(pSeg[0], 10); if (!(y >= 1900 && y <= 2200)) y = now.getFullYear();
  let m = parseInt(pSeg[1], 10); if (!(m >= 1 && m <= 12)) m = now.getMonth() + 1;
  const label = pSeg[2] || '';
  const acc = th.acc || th.bg || '#8889CD';
  const dark = th.style === 'dark';

  const events = calEvents(url.searchParams.get('e'));
  const todayRaw = parseInt(url.searchParams.get('d') || '', 10);

  const firstDow = new Date(y, m - 1, 1).getDay(); // 0=일
  const daysIn = new Date(y, m, 0).getDate();
  const totalCells = firstDow + daysIn;
  const rows = Math.ceil(totalCells / 7);
  const today = (todayRaw >= 1 && todayRaw <= daysIn) ? todayRaw : 0;

  // 날짜별 일정 매핑
  const byDay = {};
  events.forEach(ev => { (byDay[ev.day] = byDay[ev.day] || []).push(ev); });

  // ── 헤더 ──
  const monthTxt = y + '년 ' + m + '월';
  let head;
  if (label) head = '<div class="cal-head"><div class="cal-title">' + jEsc(label) + '</div><div class="cal-sub">' + monthTxt + '</div></div>';
  else head = '<div class="cal-head"><div class="cal-title">' + monthTxt + '</div></div>';

  // ── 요일 행 ──
  const wdNames = ['일', '월', '화', '수', '목', '금', '토'];
  let wd = '<div class="cal-wd">';
  wdNames.forEach((n, i) => {
    wd += '<span class="' + (i === 0 ? 'sun' : i === 6 ? 'sat' : '') + '">' + n + '</span>';
  });
  wd += '</div>';

  // ── 그리드 ──
  let grid = '<div class="cal-grid">';
  for (let cell = 0; cell < rows * 7; cell++) {
    const day = cell - firstDow + 1;
    const dow = cell % 7;
    if (day < 1 || day > daysIn) {
      grid += '<div class="cal-cell"><div class="cal-day out"></div></div>';
      continue;
    }
    const cls = dow === 0 ? ' sun' : dow === 6 ? ' sat' : '';
    let dayHtml;
    if (day === today) {
      // 오늘 — SMIL 펄스 링 (SVG-as-image에서 유일하게 동작하는 애니메이션)
      const numColor = themeText(acc);
      dayHtml = '<div class="cal-today-wrap"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26">'
        + '<circle cx="13" cy="13" r="10" fill="' + acc + '"/>'
        + '<circle cx="13" cy="13" r="11" fill="none" stroke="' + acc + '" stroke-width="1.4" opacity=".6">'
        + '<animate attributeName="r" values="10.5;12.5;10.5" dur="2.4s" repeatCount="indefinite"/>'
        + '<animate attributeName="opacity" values=".65;.12;.65" dur="2.4s" repeatCount="indefinite"/>'
        + '</circle>'
        + '<text x="13" y="17" text-anchor="middle" font-size="11.5" font-weight="700" fill="' + numColor + '" font-family="Noto Sans KR, sans-serif">' + day + '</text>'
        + '</svg></div>';
    } else {
      dayHtml = '<div class="cal-day' + cls + '">' + day + '</div>';
    }
    // 칩 (최대 2 + more)
    let chips = '';
    const evs = byDay[day] || [];
    evs.slice(0, 2).forEach(ev => {
      chips += '<span class="cal-chip" style="background:' + (ev.color || acc) + ';color:' + themeText(ev.color || acc) + '">' + jEsc(ev.txt) + '</span>';
    });
    if (evs.length > 2) chips += '<span class="cal-more">+' + (evs.length - 2) + '</span>';
    grid += '<div class="cal-cell">' + dayHtml + chips + '</div>';
  }
  grid += '</div>';

  // ── 일정 리스트 (일자 오름차순, 안정 정렬로 입력 순서 유지) ──
  let agenda = '';
  if (events.length) {
    const sorted = events.map((ev, i) => [ev, i]).sort((a, b) => (a[0].day - b[0].day) || (a[1] - b[1])).map(x => x[0]);
    agenda = '<div class="cal-agenda">';
    sorted.forEach(ev => {
      const badgeBg = ev.color || acc;
      agenda += '<div class="cal-ag-item"><span class="cal-ag-day" style="background:' + badgeBg + ';color:' + themeText(badgeBg) + '">' + ev.day + '</span>'
        + '<span class="cal-ag-txt">' + jEsc(ev.txt) + '</span></div>';
    });
    agenda += '</div>';
  }

  const inner = '<div class="cal' + (dark ? ' dark' : '') + '" style="--acc:' + acc + '">' + head + wd + grid + agenda + '</div>';
  let out = html.split('\u27e6BODY\u27e7').join(inner);
  if (dark) out = out.replace('body { background:#fdfdfe;', 'body { background:#100d18;');
  return out;
}

// ══════════════════════════════════════════════════════════════
// 💸 PAY (송금) — 2호
// s 생략=완료 · s=req 요청 · s=list 내역
// 완료: p=받는사람§금액[§메모][§잔액] · f=보낸사람[§페이명] · d=날짜문구
// 요청: p=요청자§금액[§메모][§기한] · f=[§페이명]
// 내역: p=이름§±금액§시간[§메모]|... · b=잔액[§계좌명] · f=[§페이명]
// th=스타일[§배경][§강조색] — 배경 프리셋에 toss(미니멀+파랑) 추가
// ══════════════════════════════════════════════════════════════

const PAY_PRESETS = {
  'indigo': { acc: '#8889CD' }, '인디고': { acc: '#8889CD' },
  'pink': { acc: '#DDAACC' }, '핑크': { acc: '#DDAACC' },
  'sand': { acc: '#CCAA88' }, '샌드': { acc: '#CCAA88' },
  'rose': { acc: '#BB6688' }, '로즈': { acc: '#BB6688' },
  'toss': { acc: '#0077DD' }, '토스': { acc: '#0077DD' }, 'blue': { acc: '#0077DD' },
};

function payTheme(url) {
  const out = { style: 'light', bgTint: null, acc: null };
  const raw = url.searchParams.get('th');
  if (!raw) return out;
  const f = raw.split('\u00a7').map(s => s.trim()).filter(s => s.length);
  let i = 0;
  const s0 = (f[0] || '').toLowerCase();
  if (s0 === 'light' || s0 === 'dark') { out.style = s0; i = 1; }
  if (f[i]) {
    const p = PAY_PRESETS[f[i].toLowerCase()] || PAY_PRESETS[f[i]];
    if (p) { out.acc = p.acc; i++; }
    else { const hx = jHex(f[i]); if (hx) { out.bgTint = hx; i++; } }
  }
  if (f[i]) { const hx = jHex(f[i]); if (hx) out.acc = hx; }
  return out;
}

// 금액 정규화: 숫자(콤마 허용)면 콤마+원, 아니면 원문 그대로 (자유 텍스트 허용)
function payAmt(s) {
  const n = String(s ?? '').trim().replace(/,/g, '');
  if (/^-?\d+$/.test(n)) {
    const v = parseInt(n, 10);
    return { num: v, txt: Math.abs(v).toLocaleString('ko-KR') + '원', neg: v < 0 };
  }
  return { num: null, txt: jEsc(s), neg: /^\s*-/.test(String(s ?? '')) };
}

// 이니셜 아바타 색: 이름 시드로 팔레트 순환 (i 워커 avatarBg 패턴)
const PAY_AVA_COLORS = ['#8889CD', '#BB6688', '#CCAA88', '#884499', '#00BBDD', '#FF7722', '#0077DD', '#DDAACC'];
function payAva(name) {
  let h = 0;
  for (const ch of String(name || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PAY_AVA_COLORS[h % PAY_AVA_COLORS.length];
}

// SMIL 체크마크: 원 드로잉(0.7s) → 체크 획(0.35s) → 완성 유지(2.9s) → 무한 반복
// 단일 타임라인 keyTimes 방식 — id 체이닝(begin=x.end)보다 렌더러 호환성 안전
function payCheckSVG(acc) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="84" height="84" viewBox="0 0 84 84">'
    + '<circle cx="42" cy="42" r="38" fill="none" stroke="' + acc + '" stroke-width="5" stroke-linecap="round"'
    + ' stroke-dasharray="239" stroke-dashoffset="239" transform="rotate(-90 42 42)">'
    + '<animate attributeName="stroke-dashoffset" values="239;0;0" keyTimes="0;0.184;1" dur="3.8s" repeatCount="indefinite"/>'
    + '</circle>'
    + '<path d="M26 43 L38 55 L59 32" fill="none" stroke="' + acc + '" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"'
    + ' stroke-dasharray="50" stroke-dashoffset="50">'
    + '<animate attributeName="stroke-dashoffset" values="50;50;0;0" keyTimes="0;0.145;0.237;1" dur="3.8s" repeatCount="indefinite"/>'
    + '</path></svg>';
}

function payTxRows(p) {
  return (p || '').split('|').map(r => r.trim()).filter(Boolean).map(r => {
    const seg = r.split('\u00a7');
    return { name: seg[0] || '', amt: payAmt(seg[1]), time: seg[2] || '', memo: seg[3] || '' };
  }).filter(x => x.name);
}

function renderPay(html, url) {
  const s = url.searchParams.get('s') || 'done';
  const th = payTheme(url);
  const dark = th.style === 'dark';
  const acc = th.acc || '#8889CD';
  const fSeg = (url.searchParams.get('f') || '').split('\u00a7');
  const sender = fSeg[0] || '';
  const brand = fSeg[1] || 'WPay';
  const btnTxt = themeText(acc);
  let inner = '';

  if (s === 'list') {
    const bSeg = (url.searchParams.get('b') || '').split('\u00a7');
    const bal = payAmt(bSeg[0] || '0');
    const acct = bSeg[1] || '내 지갑';
    const balBg = 'linear-gradient(135deg, ' + acc + ' 0%, ' + themeMix(acc, '#000000', 0.35) + ' 100%)';
    let rows = '';
    payTxRows(url.searchParams.get('p')).forEach(tx => {
      const cls = (tx.amt.neg) ? 'out' : 'in';
      const sign = tx.amt.neg ? '-' : '+';
      const sub = [tx.time, tx.memo].filter(Boolean).map(jEsc).join(' \u00b7 ');
      rows += '<div class="pay-tx"><div class="pay-tx-ini" style="background:' + payAva(tx.name) + '">' + jEsc(String(tx.name).charAt(0)) + '</div>'
        + '<div class="pay-tx-mid"><div class="pay-tx-nm">' + jEsc(tx.name) + '</div>'
        + (sub ? '<div class="pay-tx-sub">' + sub + '</div>' : '') + '</div>'
        + '<div class="pay-tx-amt ' + cls + '">' + sign + tx.amt.txt.replace(/^-/, '') + '</div></div>';
    });
    inner = '<div class="pay-brand">' + jEsc(brand) + '</div>'
      + '<div class="pay-bal" style="background:' + balBg + ';color:' + btnTxt + '"><div class="nm">' + jEsc(acct) + '</div><div class="amt">' + bal.txt + '</div></div>'
      + rows;
  } else if (s === 'req') {
    const pSeg = (url.searchParams.get('p') || '').split('\u00a7');
    const who = pSeg[0] || '누군가';
    const amt = payAmt(pSeg[1] || '0');
    const memo = pSeg[2] || '';
    const due = pSeg[3] || '';
    const ava = payAva(who);
    // 요청 아바타 펄스 링 (SMIL)
    const avaSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="76" height="76" viewBox="0 0 76 76">'
      + '<circle cx="38" cy="38" r="34" fill="none" stroke="' + acc + '" stroke-width="1.6" opacity=".5">'
      + '<animate attributeName="r" values="32;36;32" dur="2.2s" repeatCount="indefinite"/>'
      + '<animate attributeName="opacity" values=".55;.1;.55" dur="2.2s" repeatCount="indefinite"/>'
      + '</circle>'
      + '<circle cx="38" cy="38" r="28" fill="' + ava + '"/>'
      + '<text x="38" y="47" text-anchor="middle" font-size="24" font-weight="800" fill="#ffffff" font-family="Noto Sans KR, sans-serif">' + jEsc(String(who).charAt(0)) + '</text>'
      + '</svg>';
    inner = '<div class="pay-req-head"><span class="pay-brand" style="margin-bottom:0">' + jEsc(brand) + '</span><span class="pay-req-badge" style="background:' + acc + ';color:' + btnTxt + '">송금 요청</span></div>'
      + '<div class="pay-ava">' + avaSVG + '</div>'
      + '<div class="pay-title"><strong>' + jEsc(who) + '</strong>님이 요청했어요</div>'
      + '<div class="pay-amount">' + amt.txt + '</div>'
      + (memo ? '<div class="pay-memo">' + jEsc(memo) + '</div>' : '<div style="height:10px"></div>')
      + (due ? '<div class="pay-due">' + jEsc(due) + '</div>' : '')
      + '<div class="pay-btn2"><span class="pay-btn ghost">거절</span><span class="pay-btn" style="background:' + acc + ';color:' + btnTxt + '">보내기</span></div>';
  } else {
    // 송금 완료
    const pSeg = (url.searchParams.get('p') || '').split('\u00a7');
    const to = pSeg[0] || '누군가';
    const amt = payAmt(pSeg[1] || '0');
    const memo = pSeg[2] || '';
    const bal = pSeg[3] || '';
    const dTxt = url.searchParams.get('d') || '';
    let rows = '<div class="pay-row"><span class="k">받는 분</span><span class="v">' + jEsc(to) + '</span></div>';
    if (sender) rows += '<div class="pay-row"><span class="k">보낸 분</span><span class="v">' + jEsc(sender) + '</span></div>';
    if (dTxt) rows += '<div class="pay-row"><span class="k">일시</span><span class="v">' + jEsc(dTxt) + '</span></div>';
    if (memo) rows += '<div class="pay-row"><span class="k">메모</span><span class="v">' + jEsc(memo) + '</span></div>';
    if (bal) rows += '<div class="pay-row"><span class="k">남은 잔액</span><span class="v">' + payAmt(bal).txt + '</span></div>';
    inner = '<div class="pay-brand">' + jEsc(brand) + '</div>'
      + '<div class="pay-check">' + payCheckSVG(acc) + '</div>'
      + '<div class="pay-title"><strong>' + jEsc(to) + '</strong>님에게</div>'
      + '<div class="pay-amount" style="color:' + acc + '">' + amt.txt + '</div>'
      + '<div class="pay-done-sub">보냈어요</div>'
      + '<div class="pay-info">' + rows + '</div>'
      + '<span class="pay-btn" style="background:' + acc + ';color:' + btnTxt + '">확인</span>';
  }

  const wrap = '<div class="pay' + (dark ? ' dark' : '') + '" style="--acc:' + acc + '">' + inner + '</div>';
  let out = html.split('\u27e6BODY\u27e7').join(wrap);
  if (dark) out = out.replace('body { background:#fdfdfe;', 'body { background:#100d18;');
  else if (th.bgTint) out = out.replace('body { background:#fdfdfe;', 'body { background:' + themeMix(th.bgTint, '#ffffff', 0.88) + ';');
  return out;
}

const RENDERERS = {
  'cal': renderCal,
  'pay': renderPay,
};

// th 처리를 렌더러 내부에서 하는 poll/ask 방식 채택 — 별도 테마 렌더러 불필요 시 빈 상태 유지
const THEME_RENDERERS = {};

// ══════════════════════════════════════════════════════════════
// SVG 래핑 — i 워커 이식, 로직 동일 (xmlns 자동 주입 포함)
// ══════════════════════════════════════════════════════════════

function stripToBody(html) {
  const styles = [];
  html.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (m, s) => { styles.push(s); return ''; });
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : html;
  const scripts = [];
  const cleanBody = bodyContent.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, (m, s) => { scripts.push(s); return ''; });
  return { styles: styles.join('\n'), body: cleanBody, scripts: scripts.join('\n') };
}

function wrapInSVG(html, width, height, isFixed) {
  const { styles, body } = stripToBody(html);
  const escapeBareAmp = (s) => s.replace(/&(?!amp;|lt;|gt;|quot;|#39;|#[0-9]+;|#x[0-9a-fA-F]+;)/g, '&amp;');
  const safeStyles = escapeBareAmp(styles);
  // XHTML 네임스페이스 안에서 내부 svg가 SVG로 렌더링되도록 xmlns 자동 주입
  const safeBody = escapeBareAmp(body).replace(/<svg\s(?![^>]*xmlns=)/g, '<svg xmlns="http://www.w3.org/2000/svg" ');
  // body 배경색 추출하여 wrapper div에 적용
  const bgMatch = styles.match(/body\s*\{[^}]*background\s*:\s*([^;}]+)/);
  const bgStyle = bgMatch ? `background:${bgMatch[1].trim()};` : '';
  const minH = isFixed ? `min-height:${height}px;` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
<foreignObject width="100%" height="100%">
<div xmlns="http://www.w3.org/1999/xhtml" style="${minH}${bgStyle}">
<style>${safeStyles}</style>
${safeBody}
</div>
</foreignObject>
</svg>`;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const t = url.searchParams.get('t');
    if (!t) {
      const links = Object.keys(TEMPLATES).map(k =>
        '<li><a href="/?t=' + k + '" style="color:#DDAACC;">/?t=' + k + '</a></li>'
      ).join('');
      return new Response(
        '<html><body style="font-family:sans-serif;padding:40px;background:#1a1a2e;color:#e0e0e0;">'
        + '<h1 style="color:#8889CD;">겨울의 생활 앱 UI v1</h1>'
        + '<p>사용 가능한 타입 (' + Object.keys(TEMPLATES).length + '종):</p><ul>' + links + '</ul>'
        + '</body></html>',
        { headers: { 'content-type': 'text/html;charset=UTF-8' } }
      );
    }
    let html = TEMPLATES[t];
    if (html) {
      const renderer = RENDERERS[t] || ((h) => h);
      html = renderer(html, url);
      if (THEME_RENDERERS[t]) html = THEME_RENDERERS[t](html, url);
      let [w, h] = SIZES[t] || [420, 600];

      // ══════════════════════════════════════════════════════════
      // 동적 높이 계산 — i 워커 v3 프레임 이식 (줄별 계산 + 마진)
      // ══════════════════════════════════════════════════════════
      const MAX_H = 1800;
      const MARGIN = 20;

      function calcLines(text, containerPx) {
        if (!text) return 0;
        const lines = text.split('\n');
        let total = 0;
        for (const line of lines) {
          if (line.length === 0) { total += 1; continue; }
          let cjk = 0, ascii = 0;
          for (const ch of line) { ch.charCodeAt(0) > 0x7F ? cjk++ : ascii++; }
          const estWidth = cjk * 13 + ascii * 7.5;
          total += Math.max(Math.ceil(estWidth / containerPx), 1);
        }
        return total;
      }

      // ── 📅 CAL ──
      // pad(16*2=32) + head(제목 32 [+sub 21]) + wd(32) + rows*(74+1) + agenda(14 + Σ항목) + MARGIN
      if (t === 'cal') {
        const pC = (url.searchParams.get('p') || '').split('\u00a7');
        const nowC = new Date();
        let yC = parseInt(pC[0], 10); if (!(yC >= 1900 && yC <= 2200)) yC = nowC.getFullYear();
        let mC = parseInt(pC[1], 10); if (!(mC >= 1 && mC <= 12)) mC = nowC.getMonth() + 1;
        const labelC = pC[2] || '';
        const rowsC = Math.ceil((new Date(yC, mC - 1, 1).getDay() + new Date(yC, mC, 0).getDate()) / 7);
        const evC = calEvents(url.searchParams.get('e'));

        let base = 32; // .cal 상하 패딩
        base += 18 + 32 + (labelC ? 21 : 0); // head 패딩(4+14) + 제목줄 + 부제
        base += 32; // 요일 행 (26 + margin 6)
        base += rowsC * 75; // 셀 min-height 74 + border 1
        if (evC.length) {
          base += 14; // agenda margin-top
          evC.forEach(ev => {
            const lns = Math.max(calcLines(ev.txt, 330), 1);
            base += lns * 19 + 14 + 5; // 텍스트 + 패딩 + 아이템 간격
          });
        }
        h = base + MARGIN;
        h = Math.max(h, 380); h = Math.min(h, MAX_H);
      }

      // ── 💸 PAY ──
      if (t === 'pay') {
        const sP = url.searchParams.get('s') || 'done';
        const pP = (url.searchParams.get('p') || '').split('\u00a7');
        const fP = (url.searchParams.get('f') || '').split('\u00a7');
        let base = 48; // .pay 상하 패딩
        base += 31; // 브랜드 줄
        if (sP === 'list') {
          base += 16 + 94; // 잔액 카드 + 마진
          const txs = (url.searchParams.get('p') || '').split('|').map(r => r.trim()).filter(Boolean);
          base += txs.length * 65; // 행당 (아바타 40 + 패딩 24 + 보더)
        } else if (sP === 'req') {
          base += 90 + 26 + 42 + 10; // 아바타 + 타이틀 + 금액
          const memoP = pP[2] || '';
          base += memoP ? Math.max(calcLines(memoP, 320), 1) * 22 + 46 : 10;
          if (pP[3]) base += 30; // 기한
          base += 68; // 버튼 2단
        } else {
          base += 108 + 26 + 44 + 48; // 체크 + 타이틀 + 금액 + 서브
          base += 7; // info 상단 여백
          let rowsN = 1; // 받는 분
          if (fP[0]) rowsN++;
          if (url.searchParams.get('d')) rowsN++;
          if (pP[3]) rowsN++;
          const memoP = pP[2] || '';
          base += rowsN * 41;
          if (memoP) base += (Math.max(calcLines(memoP, 240), 1) - 1) * 20 + 41;
          base += 20 + 51; // info 하단 마진 + 버튼
        }
        h = base + MARGIN;
        h = Math.max(h, 300); h = Math.min(h, MAX_H);
      }

      const FIXED_TYPES = [];
      const isFixed = FIXED_TYPES.includes(t);
      const svg = wrapInSVG(html, w, h, isFixed);
      return new Response(svg, {
        headers: { 'content-type': 'image/svg+xml', 'cache-control': 'no-cache' }
      });
    }
    return new Response('404 Not Found', { status: 404 });
  }
};
