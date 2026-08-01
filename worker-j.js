// 겨울의 생활 앱 UI Workers (j) v1 — 뼈대 + cal(달력) 파일럿
// 구조는 i 워커(worker.js v13)와 동일: TEMPLATES → RENDERERS → THEME_RENDERERS → SIZES → 동적높이 → wrapInSVG
const TEMPLATES = {
  'compass': `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #171320; }
  .cp-lbl { font-size: 9.5px; letter-spacing: .3em; margin-bottom: 3px; }
  .cp-rule { height: 1px; opacity: .35; margin-bottom: 10px; }
  .cp-foot { margin-top: 12px; display: flex; align-items: flex-end; gap: 12px; }
</style>
</head>
<body>
\u27e6BODY\u27e7
</body>
</html>`,
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
'heist': `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background:#E5DCC6; }
  .ht { width: 420px; padding: 16px 18px 18px; position: relative; overflow: hidden;
        font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', sans-serif; }
  .ht.lupin { background-color:#E5DCC6;
    background-image: repeating-linear-gradient(0deg, rgba(45,38,26,.055) 0 1px, transparent 1px 4px);
    color:#332C22; }
  .ht.kid { background-color:#14121C;
    background-image: repeating-linear-gradient(0deg, rgba(255,255,255,.045) 0 1px, transparent 1px 4px);
    color:#C9C4D8; }
  .fg { font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', sans-serif; }
  .fm { font-family: 'Courier New', monospace; }
  .fs { font-family: Georgia, 'Times New Roman', serif; }
  /* 오려붙인 조각 */
  .hc { display: inline-block; padding: 1px 6px; margin: 1px 0; line-height: 1.25; }
  .lupin .hc { border-right: 1px solid rgba(60,50,35,.24); border-bottom: 1px solid rgba(60,50,35,.24); }
  .kid .hc { border-right: 1px solid rgba(0,0,0,.5); border-bottom: 1px solid rgba(0,0,0,.5); }
  /* 테이프 */
  .ht-tape { position: absolute; top: 8px; width: 60px; height: 16px; }
  .ht-tape.l { left: -14px; transform: rotate(-32deg); }
  .ht-tape.r { right: -14px; transform: rotate(32deg); }
  .lupin .ht-tape { background: rgba(255,255,255,.5); border: 1px solid rgba(120,108,84,.3); }
  .kid .ht-tape { background: rgba(136,136,204,.28); border: 1px solid rgba(136,136,204,.4); }
  /* 제목/구분선/수신/본문 */
  .ht-title { text-align: center; margin: 8px 0 12px; }
  .ht-div { border-top: 1px solid rgba(45,38,26,.35); margin: 0 2px 10px; }
  .kid .ht-div { border-top-color: rgba(136,136,204,.35); }
  .ht-to { font-size: 12px; letter-spacing: 1px; margin-bottom: 5px; color: #6B5F4B; }
  .kid .ht-to { color: #00BBDD; }
  .ht-body { font-size: 15px; line-height: 2.2; word-break: break-word; }
  /* 하단 */
  .ht-foot { display: flex; align-items: flex-end; justify-content: space-between; margin-top: 14px; gap: 10px; }
  .ht-place { font-size: 11px; letter-spacing: 1px; border-left: 2px solid #CCAA88; padding-left: 6px; color: #7A6C55; }
  .kid .ht-place { border-left-color: #8888CC; color: #9a92b8; }
  .ht-from { font-family: Georgia, serif; font-style: italic; font-size: 13px; margin-top: 6px; color: #4A4032; }
  .kid .ht-from { color: #8888CC; letter-spacing: 2px; }
  .ht-seal { flex-shrink: 0; }
  /* card 서브타입 */
  .ht.card { display: flex; align-items: center; gap: 14px; padding: 16px; }
  .ht-cl { flex: 1; min-width: 0; }
  .ht-chead { font-size: 11px; letter-spacing: 2px; margin-bottom: 8px; color: #7A6C55; }
  .kid .ht-chead { color: #00BBDD; }
  .ht-cfrom { margin-top: 12px; border-top: 1px solid rgba(45,38,26,.3); padding-top: 7px;
              font-family: Georgia, serif; font-style: italic; font-size: 13px; color: #4A4032; }
  .kid .ht-cfrom { border-top-color: rgba(136,136,204,.3); color: #8888CC; letter-spacing: 3px; }
  .ht-trump { width: 64px; height: 90px; border-radius: 4px; position: relative; flex-shrink: 0;
              display: flex; align-items: center; justify-content: center; transform: rotate(8deg); }
  .lupin .ht-trump { background: #F7F3E7; }
  .kid .ht-trump { background: #EFECE2; }
  .ht-tc { position: absolute; font-size: 11px; font-family: Georgia, serif; color: #14121C; }
  .ht-tc.tl { top: 4px; left: 6px; }
  .ht-tc.br { bottom: 4px; right: 6px; }
</style>
</head>
<body>
\u27e6BODY\u27e7
</body>
</html>`,
  'eviboard': `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #8a6a45; }
  .ev-wrap { position: relative; overflow: hidden; }
  .ev-title { position: absolute; left: 50%; top: 26px; transform: translateX(-50%) rotate(-1.2deg); padding: 9px 26px; font-size: 17px; font-weight: 800; white-space: nowrap; }
  .ev-title-b { position: absolute; left: 0; right: 0; top: 34px; text-align: center; font-size: 19px; font-weight: 800; }
  .ev-tape { position: absolute; width: 34px; height: 14px; background: #e8e0c8; opacity: .85; transform: rotate(-14deg); }
  .ev-card { position: absolute; width: 116px; height: 78px; padding: 8px 6px 0; text-align: center; overflow: hidden; }
  .ev-nm { font-size: 14.5px; font-weight: 800; line-height: 1.25; white-space: nowrap; overflow: hidden; }
  .ev-cat { font-size: 10px; font-weight: 600; margin-top: 1px; }
  .ev-memo { font-size: 10.5px; line-height: 1.25; margin-top: 3px; max-height: 27px; overflow: hidden; }
  .ev-lbl { position: absolute; transform: translate(-50%, -50%); height: 22px; line-height: 19px; padding: 0 8px; font-weight: 700; white-space: nowrap; }
  .ev-sh30 { box-shadow: 0 2.5px 5px rgba(0,0,0,.30); }
  .ev-sh10 { box-shadow: 0 2.5px 5px rgba(0,0,0,.10); }
  .ev-shL  { box-shadow: 0 1.5px 4px rgba(0,0,0,.18); }
</style>
</head>
<body>
\u27e6BODY\u27e7
</body>
</html>`,
  'duty': `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #171320; }
  .dt-wrap { width: 420px; padding: 24px 22px; }
  .dt-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 12px; }
  .dt-title { font-size: 19px; font-weight: 800; }
  .dt-count { font-size: 17px; font-weight: 800; font-family: ui-monospace, Menlo, monospace; }
  .dt-bar { height: 6px; border-radius: 3px; overflow: hidden; margin-bottom: 18px; }
  .dt-list { margin-left: 12px; padding-left: 0; }
  .dt-item { position: relative; display: flex; align-items: center; height: 46px; }
  .dt-dot { flex-shrink: 0; margin-left: -14px; }
  .dt-time { width: 52px; flex-shrink: 0; margin-left: 8px; font-size: 12.5px; font-weight: 700; font-family: ui-monospace, Menlo, monospace; }
  .dt-txt { flex: 1; min-width: 0; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .dt-now { display: inline-block; margin-left: 7px; padding: 1.5px 6px; border-radius: 8px; font-size: 9px; font-weight: 800; letter-spacing: .08em; vertical-align: 1.5px; }
  .dt-say { margin-top: 16px; padding: 10px 12px; border-radius: 0 8px 8px 0; font-size: 12.5px; line-height: 1.55; }
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
  'heist': [420, 560],
  'compass': [420, 470],
  'eviboard': [420, 560],
  'duty': [420, 480],
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
  const f = raw.split('\u00a7').map(s => s.trim());
  let i = 0;
  const s0 = (f[0] || '').toLowerCase();
  if (s0 === 'light' || s0 === 'dark') { out.style = s0; i = 1; }
  else if (f[0] === '') i = 1;   // 스타일 자리를 비워 쓴 표기
  if (f[i] === '') i++;                       // 빈 칸도 자리를 소비한다
  else if (f[i]) {
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
  const f = raw.split('\u00a7').map(s => s.trim());
  let i = 0;
  const s0 = (f[0] || '').toLowerCase();
  if (s0 === 'light' || s0 === 'dark') { out.style = s0; i = 1; }
  else if (f[0] === '') i = 1;   // 스타일 자리를 비워 쓴 표기
  if (f[i] === '') i++;                       // 빈 칸도 자리를 소비한다
  else if (f[i]) {
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

// ══════════════════════════════════════════════════════════════
// 🎩 HEIST (괴도 예고장) — 신문 활자 오려붙임
// sub=note(전면)/card(명함) · st=lupin/kid (th 1필드와 동일)
// title=제목(글자단위 조각화) · to=수신 · body=본문(|줄, *조각*)
// place=장소메모 · from=서명 · mark=hat/rose/spade/mask/fox/key/moon
// markcol=왁스색hex · markfg=문양색hex · markchar=트럼프 코너 글자
// th=스타일[§배경hex][§강조hex] — 3필드 위치규칙 (스타일=lupin/kid)
// ══════════════════════════════════════════════════════════════

const HEIST_MARKS = {
  'hat':   { body: '<g fill="\u27e6F\u27e7"><rect x="-6" y="-13" width="12" height="12"/><rect x="-7.5" y="-5" width="15" height="2.6"/><ellipse cx="0" cy="-1.2" rx="13" ry="3"/><path d="M0 3 m-4,0 a4,4 0 1,0 8,0 a4,4 0 1,0 -8,0 Z M0 3 m-2.4,0 a2.4,2.4 0 1,0 4.8,0 a2.4,2.4 0 1,0 -4.8,0 Z" fill-rule="evenodd"/><rect x="4" y="2.2" width="7" height="1.6"/></g>' },
  'spade': { body: '<path fill="\u27e6F\u27e7" d="M0 -13 C-6 -6 -12 -3 -12 2 C-12 6 -8 8 -5 6 C-4 5.5 -3 5 -2 5 L-4 12 L4 12 L2 5 C3 5 4 5.5 5 6 C8 8 12 6 12 2 C12 -3 6 -6 0 -13 Z"/>' },
  'moon':  { body: '<g fill="\u27e6F\u27e7"><path d="M4.8 -11 A12 12 0 1 0 4.8 11 A11 11 0 0 1 4.8 -11 Z"/><circle cx="9.5" cy="-7" r="1.7"/><circle cx="12" cy="1.5" r="1.1"/></g>' },
  'rose':  { body: '<path fill="\u27e6F\u27e7" transform="scale(0.115) translate(-142,-126)" d="M 127 226 L 123 223 L 117 223 L 101 235 L 93 235 L 86 232 L 80 227 L 69 236 L 65 245 L 118 245 L 126 236 Z M 242 158 L 236 155 L 229 155 L 218 159 L 203 172 L 152 207 L 137 222 L 137 228 L 140 234 L 153 245 L 196 245 L 199 235 L 200 223 L 204 213 L 208 208 L 219 201 L 238 194 L 244 187 L 247 180 L 247 168 Z M 208 157 L 204 145 L 202 143 L 191 163 L 180 172 L 167 179 L 153 182 L 134 183 L 112 189 L 86 185 L 86 188 L 101 205 L 114 214 L 128 220 L 134 217 L 159 196 L 205 165 L 208 161 Z M 196 145 L 194 143 L 164 157 L 147 167 L 136 172 L 124 175 L 111 174 L 72 161 L 46 150 L 58 168 L 66 176 L 70 178 L 100 182 L 117 182 L 137 176 L 156 175 L 168 172 L 183 163 Z M 7 136 L 15 148 L 17 159 L 11 184 L 10 196 L 15 209 L 21 215 L 33 219 L 55 219 L 81 215 L 85 219 L 87 225 L 93 229 L 100 229 L 113 220 L 111 217 L 97 207 L 79 186 L 61 180 L 54 173 L 31 134 L 26 132 Z M 184 140 L 170 113 L 154 127 L 142 133 L 125 138 L 112 144 L 95 155 L 89 161 L 115 170 L 126 170 L 184 142 Z M 104 112 L 100 126 L 101 144 L 119 135 Z M 124 102 L 124 116 L 133 131 L 139 123 L 143 113 L 143 109 L 127 102 Z M 153 98 L 146 102 L 146 106 L 153 101 Z M 167 91 L 160 99 L 149 108 L 141 127 L 157 118 L 167 108 L 169 104 L 169 94 Z M 156 94 L 149 90 L 139 93 L 134 101 L 142 102 L 145 97 Z M 42 81 L 32 86 L 13 104 L 6 116 L 6 119 L 16 119 L 23 122 L 32 130 L 43 145 L 63 153 L 48 125 L 44 114 L 41 99 Z M 163 81 L 159 78 L 151 78 L 144 81 L 137 81 L 128 88 L 126 93 L 127 97 L 130 100 L 132 95 L 138 89 L 145 86 L 154 87 L 160 92 L 163 86 Z M 241 60 L 235 63 L 228 73 L 229 83 L 242 102 L 247 117 L 245 132 L 235 147 L 246 154 L 259 154 L 268 150 L 272 146 L 277 137 L 278 126 L 274 115 L 266 105 L 260 94 L 261 72 L 259 67 L 250 60 Z M 109 86 L 105 101 L 106 108 L 111 117 L 120 127 L 118 114 L 118 100 L 122 90 L 127 83 L 133 78 L 141 75 L 155 75 L 166 79 L 170 83 L 175 94 L 175 111 L 180 124 L 193 139 L 198 139 L 200 137 L 203 129 L 203 114 L 200 105 L 193 93 L 176 79 L 172 70 L 171 62 L 168 58 L 161 58 L 146 68 L 124 74 L 115 79 Z M 148 58 L 129 55 L 121 55 L 112 60 L 100 76 L 99 89 L 109 76 L 117 70 L 147 61 Z M 100 45 L 83 81 L 85 95 L 94 106 L 98 108 L 98 96 L 94 86 L 94 79 L 111 54 L 120 50 L 132 52 L 144 51 L 151 56 L 161 52 L 168 52 L 176 61 L 180 77 L 199 92 L 206 104 L 209 114 L 206 143 L 212 156 L 219 155 L 230 147 L 238 133 L 239 115 L 224 86 L 222 62 L 217 54 L 210 51 L 202 51 L 191 38 L 171 37 L 142 26 L 122 29 L 109 36 Z M 93 19 L 79 22 L 68 33 L 64 51 L 52 69 L 47 89 L 48 108 L 57 134 L 66 151 L 69 154 L 79 158 L 86 156 L 97 147 L 94 130 L 96 114 L 84 100 L 77 89 L 77 77 L 86 62 L 89 52 L 100 36 L 109 27 L 105 23 Z M 112 24 L 125 22 L 142 23 L 171 33 L 179 33 L 193 29 L 191 22 L 182 15 L 158 15 L 150 9 L 143 6 L 134 6 L 129 8 Z"/>' },
  'fox':   { body: '<path fill="\u27e6F\u27e7" transform="scale(0.0575) translate(-400,-390)" d="M 518 404 L 517 404 L 511 413 L 500 425 L 486 438 L 454 463 L 424 483 L 395 500 L 367 514 L 365 514 L 343 524 L 335 526 L 332 528 L 329 528 L 326 530 L 323 530 L 302 537 L 294 538 L 294 540 L 302 541 L 316 545 L 321 545 L 327 547 L 332 547 L 333 548 L 338 548 L 345 550 L 351 550 L 352 551 L 372 552 L 373 553 L 417 553 L 418 542 L 422 529 L 433 508 L 447 490 L 468 469 L 482 457 L 498 440 L 511 421 L 517 409 Z M 497 325 L 496 325 L 496 327 L 497 328 L 497 337 L 496 338 L 496 342 L 495 343 L 493 351 L 490 357 L 488 359 L 487 362 L 480 370 L 480 371 L 466 385 L 465 385 L 461 389 L 460 389 L 457 392 L 456 392 L 453 395 L 452 395 L 449 398 L 448 398 L 444 402 L 443 402 L 439 406 L 438 406 L 426 418 L 426 419 L 422 423 L 422 424 L 419 427 L 419 428 L 415 433 L 414 436 L 412 438 L 406 450 L 406 452 L 404 455 L 403 460 L 401 463 L 401 466 L 400 467 L 400 470 L 399 471 L 399 474 L 398 476 L 415 468 L 417 466 L 431 459 L 433 457 L 436 456 L 444 450 L 447 449 L 449 447 L 456 443 L 459 440 L 460 440 L 463 437 L 464 437 L 467 434 L 468 434 L 474 428 L 475 428 L 492 411 L 492 410 L 495 407 L 495 406 L 498 403 L 498 402 L 502 397 L 509 383 L 509 381 L 511 377 L 511 374 L 512 373 L 512 367 L 513 366 L 513 356 L 512 355 L 512 350 L 511 349 L 511 346 L 506 335 L 504 333 L 504 332 Z M 480 350 L 419 364 L 384 383 L 370 395 L 349 422 L 318 483 L 303 497 L 285 506 L 271 506 L 255 496 L 245 477 L 244 455 L 253 431 L 291 386 L 299 371 L 249 394 L 225 418 L 218 434 L 216 451 L 220 472 L 230 490 L 244 504 L 258 511 L 247 511 L 230 504 L 214 489 L 204 469 L 201 445 L 206 422 L 220 399 L 236 385 L 297 364 L 304 356 L 309 336 L 309 308 L 303 283 L 286 251 L 269 234 L 268 259 L 255 284 L 237 302 L 184 341 L 154 378 L 145 397 L 139 422 L 139 450 L 144 472 L 165 508 L 189 528 L 222 541 L 254 543 L 228 535 L 200 513 L 236 525 L 275 524 L 323 511 L 381 485 L 390 449 L 406 417 L 428 392 L 466 365 Z M 595 153 L 561 181 L 547 197 L 541 209 L 541 213 L 547 218 L 509 215 L 489 219 L 491 216 L 521 208 L 497 179 L 471 164 L 474 182 L 473 224 L 455 238 L 434 262 L 391 278 L 396 288 L 415 299 L 432 303 L 472 304 L 501 315 L 525 338 L 538 370 L 539 392 L 527 426 L 511 447 L 471 482 L 451 505 L 440 525 L 434 552 L 467 547 L 496 538 L 537 516 L 574 480 L 596 442 L 608 398 L 609 353 L 603 323 L 590 293 L 565 262 L 543 247 L 513 238 L 482 240 L 508 230 L 539 231 L 564 241 L 595 268 L 603 205 L 602 181 Z M 570 360 L 578 373 L 582 385 L 583 396 L 584 397 L 584 413 L 583 414 L 582 425 L 579 432 L 579 435 L 572 450 L 564 463 L 554 476 L 532 497 L 506 514 L 490 521 L 476 525 L 475 524 L 490 515 L 508 500 L 523 483 L 535 465 L 544 445 L 548 431 L 548 427 L 549 426 L 549 420 L 550 419 L 550 395 L 549 394 L 549 388 L 550 387 L 555 397 L 555 400 L 557 404 L 558 412 L 559 413 L 559 419 L 560 420 L 560 435 L 559 436 L 559 442 L 557 449 L 558 449 L 565 438 L 571 424 L 571 421 L 574 413 L 574 408 L 575 407 L 575 384 L 574 383 L 574 378 L 573 377 L 572 370 L 569 363 Z M 465 269 L 471 263 L 471 262 L 473 260 L 474 260 L 477 257 L 478 257 L 479 256 L 480 256 L 481 255 L 483 255 L 484 254 L 498 254 L 499 255 L 502 255 L 503 256 L 506 256 L 507 257 L 509 257 L 510 258 L 511 258 L 512 259 L 513 259 L 514 260 L 516 260 L 517 261 L 518 261 L 519 262 L 520 262 L 521 263 L 520 264 L 517 264 L 516 263 L 501 263 L 500 264 L 498 264 L 497 265 L 495 265 L 494 266 L 492 266 L 491 267 L 490 267 L 489 268 L 487 268 L 486 269 L 484 269 L 483 270 L 479 270 L 478 271 L 469 271 L 468 270 L 466 270 Z"/>' },
  'key':   { body: '<path fill="\u27e6F\u27e7" stroke="\u27e6F\u27e7" stroke-width="40" transform="rotate(20) scale(0.0155) translate(-853,-736)" d="M 1669 59 L 1610 19 L 1546 11 L 1437 76 L 1375 20 L 1301 0 L 1180 44 L 1131 121 L 1134 227 L 1194 307 L 1288 340 L 1221 360 L 1213 410 L 1153 405 L 1141 481 L 395 1162 L 370 1136 L 461 1052 L 420 1008 L 387 1021 L 370 1004 L 387 972 L 293 870 L 213 942 L 281 1016 L 248 1048 L 177 976 L 113 1034 L 180 1108 L 145 1141 L 76 1068 L 1 1137 L 91 1243 L 123 1230 L 141 1247 L 124 1279 L 164 1323 L 256 1241 L 279 1265 L 194 1346 L 202 1365 L 140 1389 L 146 1455 L 219 1459 L 243 1402 L 257 1416 L 1210 538 L 1275 544 L 1279 481 L 1327 478 L 1354 412 L 1377 505 L 1451 574 L 1553 588 L 1639 546 L 1694 433 L 1682 356 L 1630 287 L 1677 246 L 1705 181 L 1702 120 Z M 1225 86 L 1279 62 L 1309 62 L 1347 75 L 1389 117 L 1403 177 L 1478 175 L 1479 141 L 1490 114 L 1529 81 L 1577 77 L 1601 86 L 1621 103 L 1640 139 L 1637 186 L 1603 227 L 1575 238 L 1535 237 L 1526 309 L 1591 335 L 1612 357 L 1628 387 L 1630 448 L 1600 498 L 1551 526 L 1503 527 L 1464 510 L 1431 475 L 1419 445 L 1417 408 L 1442 348 L 1425 329 L 1466 322 L 1485 295 L 1476 255 L 1448 228 L 1426 220 L 1396 227 L 1386 239 L 1377 277 L 1359 257 L 1319 275 L 1270 275 L 1238 262 L 1214 242 L 1189 197 L 1187 152 L 1201 114 Z"/>' },
  'mask':  { body: '<path fill="\u27e6F\u27e7" stroke="\u27e6F\u27e7" stroke-width="9" stroke-linejoin="round" transform="scale(0.062) translate(-228,-196)" d="M 15 122 L 54 171 L 8 137 L 12 160 L 87 207 L 66 306 L 95 211 L 81 337 L 98 384 L 96 240 L 113 365 L 102 222 L 173 281 L 270 258 L 352 282 L 408 252 L 446 173 L 448 123 L 419 230 L 365 275 L 260 254 L 171 276 L 104 205 L 177 272 L 262 248 L 354 272 L 413 230 L 441 139 L 409 163 L 406 147 L 327 142 L 265 190 L 211 144 L 111 143 L 206 137 L 266 182 L 322 138 L 423 139 L 341 130 L 282 155 L 266 112 L 248 154 L 197 131 L 113 137 L 129 84 L 175 65 L 121 63 L 83 109 L 87 52 L 121 8 L 57 48 L 56 130 L 30 53 Z M 138 188 L 140 186 L 187 185 L 200 188 L 211 194 L 222 204 L 234 225 L 206 230 L 189 230 L 177 227 L 161 218 L 149 206 Z M 393 188 L 381 208 L 372 217 L 355 227 L 342 230 L 327 230 L 303 227 L 297 224 L 309 204 L 331 188 L 343 185 L 363 185 L 367 179 L 370 179 L 377 186 L 391 186 Z M 91 165 L 95 165 L 102 170 L 108 183 L 107 195 L 97 206 L 90 204 L 86 200 L 81 189 L 82 176 Z M 31 116 L 48 143 L 65 160 L 79 170 L 78 173 L 65 165 L 48 149 L 36 132 L 30 119 Z M 119 81 L 120 83 L 107 100 L 99 118 L 95 138 L 95 155 L 92 158 L 91 137 L 96 115 L 107 94 Z M 83 39 L 84 41 L 77 53 L 72 68 L 69 102 L 72 123 L 78 143 L 85 156 L 85 162 L 79 157 L 72 142 L 65 110 L 65 82 L 69 64 L 78 44 Z"/>' },
};

function heistHash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h;
}

function heistMark(name, fill) {
  const m = HEIST_MARKS[name] || HEIST_MARKS['hat'];
  return m.body.split('\u27e6F\u27e7').join(fill);
}

// 실링왁스 인장 SVG (note 하단) — markcol 기준 음영 자동산출
function heistSeal(mark, waxCol, fgCol, rot) {
  const waxDark = themeMix(waxCol, '#000000', 0.4);
  const waxHi = themeMix(waxCol, '#ffffff', 0.22);
  const waxIn = themeMix(waxCol, '#000000', 0.18);
  const engraved = heistMark(mark, fgCol);
  const shadow = heistMark(mark, waxDark);
  return '<svg width="64" height="64" viewBox="-32 -32 64 64">'
    + '<defs><radialGradient id="hswx" cx="34%" cy="26%" r="78%">'
    + '<stop offset="0" stop-color="' + waxHi + '"/><stop offset="0.5" stop-color="' + waxCol + '"/><stop offset="1" stop-color="' + waxDark + '"/></radialGradient>'
    + '<radialGradient id="hswi" cx="36%" cy="28%" r="74%">'
    + '<stop offset="0" stop-color="' + themeMix(waxCol, '#ffffff', 0.1) + '"/><stop offset="1" stop-color="' + waxIn + '"/></radialGradient></defs>'
    + '<path transform="rotate(' + rot + ')" d="M27 0 C27 10 24 15 19 19 C13 24 6 25 0 24 C-8 23 -16 25 -20.5 20.5 C-26 15 -24 7 -26 0 C-28 -8 -23 -14 -17.7 -17.7 C-12 -22 -6 -27 0 -28 C8 -29 13 -21 17 -17 C22 -12 27 -8 27 0 Z" fill="url(#hswx)"/>'
    + '<circle r="19" fill="url(#hswi)"/><circle r="19" fill="none" stroke="' + waxDark + '" stroke-width="1.4"/>'
    + '<path d="M-15 -10 A18.5 18.5 0 0 1 -3 -18.2" fill="none" stroke="#FFFFFF" stroke-opacity="0.3" stroke-width="2.4" stroke-linecap="round"/>'
    + '<g transform="translate(1.2,1.4)">' + shadow + '</g>' + engraved
    + '</svg>';
}

// 조각 팔레트: [배경, 글자색, 폰트클래스, 크기px]
const HEIST_PAL = {
  'lupin': [
    ['#F7F3E7', '#191510', 'fg', 17], ['#191510', '#F4EFE0', 'fm', 16],
    ['#CCAA88', '#3A2A18', 'fg', 17], ['#F0E8D4', '#191510', 'fg', 18],
    ['#BB6688', '#2C0F1B', 'fg', 16], ['#D8CDB2', '#191510', 'fs', 17],
  ],
  'kid': [
    ['#EFECE2', '#14121C', 'fg', 19], ['#8888CC', '#191430', 'fg', 17],
    ['#D6D2C4', '#14121C', 'fs', 18], ['#00BBDD', '#062A33', 'fg', 17],
    ['#EE1166', '#F6E4EA', 'fm', 16],
  ],
};

const HEIST_ROT = [-3, 2, -2, 4, -4, 3];

// *조각* 파싱 → 조각 span + 일반 텍스트
function heistLine(line, pal, seed, counter) {
  let out = '';
  const parts = line.split(/(\*[^*]+\*)/);
  for (const p of parts) {
    if (!p) continue;
    if (p.length > 2 && p.startsWith('*') && p.endsWith('*')) {
      const txt = p.slice(1, -1);
      const c = pal[(seed + counter.n * 3 + heistHash(txt)) % pal.length];
      const rot = HEIST_ROT[(seed + counter.n) % HEIST_ROT.length];
      out += '<span class="hc ' + c[2] + '" style="background:' + c[0] + ';color:' + c[1]
        + ';font-size:' + c[3] + 'px;font-weight:' + (c[3] >= 17 ? '600' : '400')
        + ';transform:rotate(' + rot + 'deg)">' + jEsc(txt) + '</span>';
      counter.n++;
    } else {
      out += jEsc(p);
    }
  }
  return out;
}

// 제목: 글자 단위 조각화
function heistTitle(title, pal, seed) {
  const sizes = [32, 30, 34];
  const rots = [-4, 3, -2, 4];
  let out = '';
  let i = 0;
  for (const ch of title) {
    if (ch === ' ') { out += '<span style="display:inline-block;width:8px"></span>'; continue; }
    const c = pal[(seed + i) % 3];
    out += '<span class="hc fg" style="background:' + c[0] + ';color:' + c[1]
      + ';font-size:' + sizes[i % 3] + 'px;font-weight:' + (i % 2 ? '400' : '600')
      + ';transform:rotate(' + rots[(seed + i) % 4] + 'deg)' + (i % 3 === 1 ? ';padding:2px 8px' : '') + '">'
      + jEsc(ch) + '</span>';
    i++;
  }
  return out;
}

function heistTheme(url) {
  const out = { style: 'lupin', bg: null, acc: null };
  const st = (url.searchParams.get('st') || '').toLowerCase();
  if (st === 'kid' || st === 'lupin') out.style = st;
  const raw = url.searchParams.get('th');
  if (!raw) return out;
  const f = raw.split('\u00a7').map(s => s.trim());
  let i = 0;
  const s0 = (f[0] || '').toLowerCase();
  if (s0 === 'lupin' || s0 === 'kid') { out.style = s0; i = 1; }
  else if (f[0] === '') i = 1;   // 스타일 자리를 비워 쓴 표기
  if (f[i] === '') i++;                       // 빈 칸도 자리를 소비한다
  else if (f[i]) { const hx = jHex(f[i]); if (hx) { out.bg = hx; i++; } }
  if (f[i]) { const hx = jHex(f[i]); if (hx) out.acc = hx; }
  return out;
}

function renderHeist(html, url) {
  const th = heistTheme(url);
  const kid = th.style === 'kid';
  const pal = HEIST_PAL[th.style];
  const sub = (url.searchParams.get('sub') || 'note').toLowerCase();
  const title = url.searchParams.get('title') || '\uc608\uace0\uc7a5';
  const to = url.searchParams.get('to') || '';
  const bodyRaw = url.searchParams.get('body') || '';
  const place = url.searchParams.get('place') || '';
  const from = url.searchParams.get('from') || '';
  const mark = (url.searchParams.get('mark') || (kid ? 'hat' : 'rose')).toLowerCase();
  const waxCol = jHex(url.searchParams.get('markcol')) || (kid ? '#8888CC' : '#BB6688');
  const fgCol = jHex(url.searchParams.get('markfg')) || (kid ? '#EFECE2' : '#DDAACC');
  const markchar = url.searchParams.get('markchar') || (kid ? 'K' : 'A');
  const seed = heistHash(title + bodyRaw + to) % 97;
  const sealRot = (seed % 25) - 12;

  const counter = { n: 0 };
  const bodyHTML = bodyRaw.split('|').map(l => heistLine(l.trim(), pal, seed, counter)).join('<br/>');

  let inner = '';
  if (sub === 'card') {
    const cardFg = jHex(url.searchParams.get('markfg')) || '#14121C';
    inner = '<div class="ht card ' + th.style + '">'
      + '<div class="ht-cl">'
      + (place ? '<div class="ht-chead">' + jEsc(place) + '</div>' : '')
      + '<div class="ht-body" style="line-height:2">' + bodyHTML + '</div>'
      + (from ? '<div class="ht-cfrom">' + jEsc(from) + '</div>' : '')
      + '</div>'
      + '<div class="ht-trump"><span class="ht-tc tl">' + jEsc(markchar) + '</span><span class="ht-tc br">' + jEsc(markchar) + '</span>'
      + '<svg width="46" height="46" viewBox="-16 -16 32 32"><g transform="scale(1.1)">' + heistMark(mark, cardFg) + '</g></svg>'
      + '</div></div>';
  } else {
    inner = '<div class="ht ' + th.style + '">'
      + '<div class="ht-tape l"></div><div class="ht-tape r"></div>'
      + '<div class="ht-title">' + heistTitle(title, pal, seed) + '</div>'
      + '<div class="ht-div"></div>'
      + (to ? '<div class="ht-to">' + jEsc(to) + '</div>' : '')
      + '<div class="ht-body">' + bodyHTML + '</div>'
      + '<div class="ht-foot"><div>'
      + (place ? '<div class="ht-place">' + jEsc(place) + '</div>' : '')
      + (from ? '<div class="ht-from">' + jEsc(from) + '</div>' : '')
      + '</div><div class="ht-seal">' + heistSeal(mark, waxCol, fgCol, sealRot) + '</div></div>'
      + '</div>';
  }

  let out = html.split('\u27e6BODY\u27e7').join(inner);
  if (kid) out = out.replace('body { background:#E5DCC6;', 'body { background:#14121C;');
  if (th.bg) {
    out = out.replace(/background:#(E5DCC6|14121C);/g, 'background:' + th.bg + ';')
             .replace('background-color:#E5DCC6;', 'background-color:' + th.bg + ';')
             .replace('background-color:#14121C;', 'background-color:' + th.bg + ';');
  }
  return out;
}


// ══════════════════════════════════════════════════════════════
// 🔤 공통 폰트 유틸 — font=sans(기본)/serif/mono/cursive
//   cursive 는 컨테이너에 걸지 않고 라틴·숫자 덩어리만 감싼다.
//   (한글 필기체가 깔린 기기에서만 한글이 변하는 편차를 없애기 위함)
// ══════════════════════════════════════════════════════════════

const J_FAMS = {
  'sans':   "-apple-system, BlinkMacSystemFont, 'Noto Sans KR', sans-serif",
  'serif':  "Georgia, 'Times New Roman', 'Noto Serif KR', serif",
  'mono':   "ui-monospace, Menlo, Consolas, monospace",
  'cursive': "-apple-system, BlinkMacSystemFont, 'Noto Sans KR', sans-serif",
};

function jFont(url, def) {
  const f = (url.searchParams.get('font') || def || 'sans').toLowerCase();
  return J_FAMS[f] ? f : (def || 'sans');
}

function jFam(mode) {
  return J_FAMS[mode] || J_FAMS['sans'];
}

// mode==='cursive' 일 때만 라틴·숫자 조각을 필기체로 감싼다. 그 외엔 단순 이스케이프.
function jType(text, mode) {
  const t = String(text ?? '');
  if (mode !== 'cursive') return jEsc(t);
  const re = /[A-Za-z0-9][A-Za-z0-9 .,:\/\-]*[A-Za-z0-9]|[A-Za-z0-9]/g;
  let out = '', last = 0, m;
  while ((m = re.exec(t)) !== null) {
    out += jEsc(t.slice(last, m.index));
    out += '<span style="font-family:cursive">' + jEsc(m[0]) + '</span>';
    last = m.index + m[0].length;
  }
  return out + jEsc(t.slice(last));
}

// ══════════════════════════════════════════════════════════════
// 🧭 COMPASS (나침반)
// dir=침로각(0~359) · label=목적지 · dist=부연 · day=머리말
// wind=풍향각(생략하면 풍향침 없음) · sway=0이면 바늘 고정
// th=스타일[§배경][§강조색]  스타일: brass(기본) / paper
// font=sans(기본)/serif/mono/cursive
// ══════════════════════════════════════════════════════════════

const CP_TH = {
  'brass': {
    bg: '#171320', fg: '#E6DCC8', ring: '#CCAA88', rimIn: '#4E3C24',
    d0: '#241E33', d1: '#0E0B16', tick: '#CCAA88', card: '#DDAACC',
    acc: '#DDAACC', meta: '#5f5872', sub: '#7b7392', lbl: '#8888CC', big: '#CCAA88',
  },
  'paper': {
    bg: '#F7F5F0', fg: '#2A2436', ring: '#CCAA88', rimIn: '#B99A6E',
    d0: '#FFFFFF', d1: '#E8E4DA', tick: '#8A7A5E', card: '#8A5A70',
    acc: '#BB6688', meta: '#9A93A8', sub: '#6E6880', lbl: '#8888CC', big: '#8A6A42',
  },
};

function cpTheme(url) {
  const raw = url.searchParams.get('th') || '';
  const f = raw.split('\u00a7').map(x => x.trim());
  let style = 'brass', i = 0;
  const s0 = (f[0] || '').toLowerCase();
  if (CP_TH[s0]) { style = s0; i = 1; }
  else if (f[0] === '') { i = 1; }   // 스타일 자리를 비워 쓴 표기 — cal/pay/heist와 동일 규칙
  const t = Object.assign({}, CP_TH[style]);
  // 위치 고정: f[i]=배경, f[i+1]=액센트. 빈 칸이어도 자리는 소비한다.
  const bgHx = jHex(f[i] || '');
  if (bgHx) { t.bg = bgHx; t.fg = themeText(bgHx); }
  const accHx = jHex(f[i + 1] || '');
  if (accHx) { t.acc = accHx; t.card = accHx; }
  t.style = style;
  return t;
}

function cpPol(a, r) {
  const rad = (a - 90) * Math.PI / 180;
  return [150 + r * Math.cos(rad), 150 + r * Math.sin(rad)];
}

function cpDial(t) {
  let o = '';
  // 방위 장미
  for (const a of [0, 90, 180, 270]) {
    const p = cpPol(a, 74), l = cpPol(a - 90, 15), r = cpPol(a + 90, 15);
    o += '<path d="M' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ' L' + l[0].toFixed(1) + ' ' + l[1].toFixed(1) + ' L150 150 Z" fill="' + t.ring + '" fill-opacity="0.22"/>';
    o += '<path d="M' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ' L' + r[0].toFixed(1) + ' ' + r[1].toFixed(1) + ' L150 150 Z" fill="' + t.ring + '" fill-opacity="0.10"/>';
  }
  for (const a of [45, 135, 225, 315]) {
    const p = cpPol(a, 48), l = cpPol(a - 90, 11), r = cpPol(a + 90, 11);
    o += '<path d="M' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ' L' + l[0].toFixed(1) + ' ' + l[1].toFixed(1) + ' L150 150 Z" fill="#8888CC" fill-opacity="0.16"/>';
    o += '<path d="M' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ' L' + r[0].toFixed(1) + ' ' + r[1].toFixed(1) + ' L150 150 Z" fill="#8888CC" fill-opacity="0.08"/>';
  }
  // 눈금
  for (let i = 0; i < 72; i++) {
    const a = i * 5;
    let r0, sw, col, op;
    if (a % 45 === 0) { r0 = 108; sw = 2.2; col = t.card; op = 1; }
    else if (a % 15 === 0) { r0 = 114; sw = 1.4; col = t.tick; op = 0.85; }
    else { r0 = 120; sw = 0.8; col = t.tick; op = 0.45; }
    const p1 = cpPol(a, r0), p2 = cpPol(a, 126);
    o += '<line x1="' + p1[0].toFixed(1) + '" y1="' + p1[1].toFixed(1) + '" x2="' + p2[0].toFixed(1) + '" y2="' + p2[1].toFixed(1)
       + '" stroke="' + col + '" stroke-width="' + sw + '" stroke-opacity="' + op + '" stroke-linecap="round"/>';
  }
  // 방위 문자
  const CARD = [[0, 'N'], [90, 'E'], [180, 'S'], [270, 'W']];
  for (const c of CARD) {
    const p = cpPol(c[0], 92);
    o += '<text x="' + p[0].toFixed(1) + '" y="' + (p[1] + 6.5).toFixed(1) + '" text-anchor="middle" font-family="Georgia, serif"'
       + ' font-size="19" font-weight="600" fill="' + (c[0] === 0 ? t.card : t.tick) + '">' + c[1] + '</text>';
  }
  return o;
}

const CP_DIRS = ['북', '북북동', '북동', '동북동', '동', '동남동', '남동', '남남동',
                 '남', '남남서', '남서', '서남서', '서', '서북서', '북서', '북북서'];
const CP_ABBR = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

function renderCompass(html, url) {
  const t = cpTheme(url);
  const fm = jFont(url, 'serif');
  const fam = jFam(fm);

  let dir = parseFloat(url.searchParams.get('dir'));
  if (!isFinite(dir)) dir = 0;
  dir = ((dir % 360) + 360) % 360;

  const windRaw = url.searchParams.get('wind');
  let wind = parseFloat(windRaw);
  const hasWind = windRaw !== null && windRaw !== '' && isFinite(wind);
  if (hasWind) wind = ((wind % 360) + 360) % 360;

  const sway = (url.searchParams.get('sway') || '1') !== '0';
  const label = url.searchParams.get('label') || '';
  const dist = url.searchParams.get('dist') || '';
  const day = url.searchParams.get('day') || '';
  const head = url.searchParams.get('head') || 'BEARING';

  const idx = Math.round(dir / 22.5) % 16;

  // 자침 SMIL — 단일 타임라인 values/keyTimes (렌더러 호환)
  const d = dir;
  const nAnim = sway
    ? '<animateTransform attributeName="transform" type="rotate" values="'
      + [d, d + 3.5, d - 3, d + 1.5, d - 1, d].map(v => v.toFixed(1) + ' 150 150').join(';')
      + '" keyTimes="0;0.18;0.42;0.63;0.84;1" dur="6.5s" repeatCount="indefinite"/>'
    : '';
  const wAnim = (hasWind && sway)
    ? '<animateTransform attributeName="transform" type="rotate" values="'
      + [wind, wind + 6, wind - 1, wind + 4, wind].map(v => v.toFixed(1) + ' 150 150').join(';')
      + '" keyTimes="0;0.25;0.5;0.78;1" dur="9s" repeatCount="indefinite"/>'
    : '';

  const windG = hasWind
    ? '<g transform="rotate(' + wind.toFixed(1) + ' 150 150)">' + wAnim
      + '<line x1="150" y1="150" x2="150" y2="46" stroke="#00BBDD" stroke-width="1.6" stroke-opacity="0.55" stroke-dasharray="5 4"/>'
      + '<path d="M150 40 L155 54 L150 50 L145 54 Z" fill="#00BBDD" fill-opacity="0.7"/>'
      + '<text x="150" y="34" text-anchor="middle" font-family="ui-monospace, monospace" font-size="8"'
      + ' letter-spacing="1.5" fill="#00BBDD" fill-opacity="0.75">WIND</text></g>'
    : '';

  const svg = '<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">'
    + '<defs>'
    + '<radialGradient id="cpb" cx="34%" cy="26%" r="80%"><stop offset="0" stop-color="#E0C79C"/>'
    + '<stop offset="0.55" stop-color="' + t.ring + '"/><stop offset="1" stop-color="#6E5636"/></radialGradient>'
    + '<radialGradient id="cpd" cx="40%" cy="32%" r="78%"><stop offset="0" stop-color="' + t.d0 + '"/>'
    + '<stop offset="1" stop-color="' + t.d1 + '"/></radialGradient>'
    + '<linearGradient id="cpg" x1="0" y1="0" x2="0.7" y2="1">'
    + '<stop offset="0" stop-color="#ffffff" stop-opacity="0.16"/>'
    + '<stop offset="0.45" stop-color="#ffffff" stop-opacity="0.02"/>'
    + '<stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>'
    + '</defs>'
    + '<circle cx="150" cy="150" r="146" fill="url(#cpb)"/>'
    + '<circle cx="150" cy="150" r="136" fill="' + t.rimIn + '"/>'
    + '<circle cx="150" cy="150" r="132" fill="url(#cpd)"/>'
    + cpDial(t)
    + '<circle cx="150" cy="150" r="132" fill="none" stroke="' + t.ring + '" stroke-width="1" stroke-opacity="0.4"/>'
    + windG
    + '<g transform="rotate(' + d.toFixed(1) + ' 150 150)">' + nAnim
    + '<path d="M150 34 L162 150 L150 166 L138 150 Z" fill="#BB6688"/>'
    + '<path d="M150 34 L150 166 L138 150 Z" fill="#8E4560"/>'
    + '<path d="M150 266 L138 150 L150 134 L162 150 Z" fill="#8888CC"/>'
    + '<path d="M150 266 L150 134 L138 150 Z" fill="#5F5F96"/>'
    + '<circle cx="150" cy="150" r="11" fill="' + t.ring + '"/>'
    + '<circle cx="150" cy="150" r="5.5" fill="#2A2233"/></g>'
    + '<ellipse cx="112" cy="96" rx="86" ry="70" fill="url(#cpg)" transform="rotate(-28 112 96)"/>'
    + '</svg>';

  const inner = '<div style="width:420px;padding:20px 22px 22px;background:' + t.bg + ';color:' + t.fg + ';font-family:' + fam + '">'
    + '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2px">'
    + '<span style="font-size:10px;letter-spacing:.34em;color:' + t.lbl + '">' + jType(head, fm) + '</span>'
    + '<span style="font-size:10px;letter-spacing:.2em;color:' + t.meta + '">' + jType(day, fm) + '</span></div>'
    + '<div class="cp-rule" style="background:' + t.ring + '"></div>'
    + '<div style="display:flex;justify-content:center">' + svg + '</div>'
    + '<div class="cp-foot">'
    + '<div style="flex:1;min-width:0">'
    + (label ? '<div class="cp-lbl" style="color:' + t.lbl + '">침 로</div>' : '')
    + (label ? '<div style="font-size:23px;font-weight:600;color:' + t.acc + '">' + jType(label, fm) + '</div>' : '')
    + (dist ? '<div style="font-size:12px;color:' + t.sub + ';margin-top:2px;line-height:1.5">' + jType(dist, fm) + '</div>' : '')
    + '</div>'
    + '<div style="text-align:right;flex-shrink:0">'
    + '<div style="font-size:30px;font-weight:700;line-height:1;color:' + t.big + ';font-family:ui-monospace, Menlo, monospace">'
    + (Math.round(dir * 10) / 10) + '&#176;</div>'
    + '<div style="font-size:10px;letter-spacing:.16em;color:' + t.meta + ';margin-top:3px">'
    + CP_ABBR[idx] + ' &#183; ' + CP_DIRS[idx] + '</div></div>'
    + '</div></div>';

  return html.split('\u27e6BODY\u27e7').join(inner);
}


// ══════════════════════════════════════════════════════════════
// 🧵 EVIBOARD (증거 보드) — 자동 배치 관계도
// n=이름§분류§메모|... / link=1-2§라벨|1-4§?|... / th=cork·board[§배경][§액센트] / font=
// 좌표 미수신: 3=삼각 4=사각 5~7=원형 8+=3열 격자(상한 30, 파서 방탄용)
// ══════════════════════════════════════════════════════════════

const EV_PAL = ['#8888CC', '#DDAACC', '#CCAA88', '#BB6688'];          // 핀·자석 1군 순환
const EV_POSTIT = ['#fdf3c9', '#f9dbe7', '#d9ecf7', '#ddf0d9'];       // board 포스트잇 4색(연톤)
const EV_OPEN = '#FF6699';                                            // 미해결 ? 분홍 (고정)

const EV_TH = {
  'cork':  { bg: '#8a6a45', frame: '#5f4830', card: '#f6f1e4', cardLn: '#d8cfba', thread: '#BB6688',
             lblBg: '#f6f1e4', lblTx: '#5a4632', tx: '#3a2f22', sub: '#8a7a62', cat: '#a4544f', sh: 0.30 },
  'board': { bg: '#f4f4f7', frame: '#d5d5de', card: '#ffffff', cardLn: '#e2e2ea', thread: '#8888CC',
             lblBg: '#ffffff', lblTx: '#55557a', tx: '#2a2a33', sub: '#8a8a98', cat: '#7878aa', sh: 0.10 },
};

function evTheme(url) {
  const raw = url.searchParams.get('th') || '';
  const f = raw.split('\u00a7').map(s => s.trim());
  let style = 'cork', i = 0;
  const s0 = (f[0] || '').toLowerCase();
  if (EV_TH[s0]) { style = s0; i = 1; }
  else if (f[0] === '') { i = 1; }   // 스타일 자리를 비워 쓴 표기 — 6라우트 통일 규칙
  const t = Object.assign({ style: style }, EV_TH[style]);
  if (f[i] === '') i++;                       // 빈 칸도 자리를 소비한다
  else { const hx = jHex(f[i] || ''); if (hx) { t.bg = hx; t.tx = themeText(hx); t.cbg = true; i++; } }
  const ax = jHex(f[i] || '');
  if (ax) t.thread = ax;
  return t;
}

function evHash(s) { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }

// n=이름§분류§메모 파싱 (분류·메모 뒤에서부터 생략 가능, 상한 30)
function evNodes(p) {
  return (p || '').split('|').map(r => r.trim()).filter(Boolean).slice(0, 30).map(r => {
    const g = r.split('\u00a7');
    return { name: g[0] || '', cat: g[1] || '', memo: g.slice(2).join('\u00a7') || '' };
  });
}

// link=1-2§라벨 파싱 (1-기반, 라벨 '?'=미해결)
function evLinks(p, nCount) {
  return (p || '').split('|').map(r => r.trim()).filter(Boolean).map(r => {
    const g = r.split('\u00a7');
    const m = (g[0] || '').match(/^(\d+)\s*-\s*(\d+)$/);
    if (!m) return null;
    const a = parseInt(m[1], 10) - 1, b = parseInt(m[2], 10) - 1;
    if (a < 0 || b < 0 || a >= nCount || b >= nCount || a === b) return null;
    return { a: a, b: b, label: g.slice(1).join('\u00a7') || '' };
  }).filter(Boolean);
}

const EV_W = 420, EV_CW = 116, EV_CH = 78;

// 자동 배치: 1·2 특례 / 3=삼각 / 4=사각 모서리 / 5~7=원형 (-90° 시작 타원)
function evLayout(nc) {
  const cx = EV_W / 2, cy = 306, rx = 136, ry = 158;
  if (nc === 1) return [[cx, cy]];
  if (nc === 2) return [[cx - 82, cy], [cx + 82, cy]];
  const pts = [];
  for (let i = 0; i < nc; i++) {
    const a = (nc === 4 ? -45 + i * 90 : -90 + i * (360 / nc)) * Math.PI / 180;
    pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return pts;
}

// 격자 배치 (8+): 3열, 행 중앙정렬 + 지그재그 ±6, 이름 시드 세로 지터
function evLayoutGrid(nodes) {
  const cols = 3, gx = EV_CW + 14, gy = EV_CH + 46, cx = EV_W / 2, topY = 96 + EV_CH / 2;
  return nodes.map((nd, i) => {
    const r = Math.floor(i / cols), c = i % cols;
    const rowN = Math.min(cols, nodes.length - r * cols);
    const x0 = cx - ((rowN - 1) * gx) / 2 + (r % 2 ? 6 : -6);
    const jit = ((evHash(nd.name) >> 3) % 11) - 5;
    return [x0 + c * gx, topY + r * gy + jit];
  });
}

function evHeight(nCount) {
  if (nCount >= 8) return 96 + Math.ceil(nCount / 3) * (EV_CH + 46) + 28;
  return 560;
}

// 이차 베지어 t지점
function evQ(p0, pc, p1, t) {
  const u = 1 - t;
  return [u * u * p0[0] + 2 * u * t * pc[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * pc[1] + t * t * p1[1]];
}

function renderEviboard(html, url) {
  const t = evTheme(url);
  const cork = t.style === 'cork';
  const fm = jFont(url, 'sans');
  const fam = jFam(fm);
  const title = url.searchParams.get('title') || '증거 보드';
  const nodes = evNodes(url.searchParams.get('n'));
  const links = evLinks(url.searchParams.get('link'), nodes.length);
  const H = evHeight(nodes.length);
  const grid = nodes.length >= 8;
  const pts = grid ? evLayoutGrid(nodes) : evLayout(nodes.length);
  const pin = i => [pts[i][0], pts[i][1] - EV_CH / 2 + 4];

  // ── SVG 언더레이: 질감·프레임·실·핀
  let sv = '<svg width="' + EV_W + '" height="' + H + '" viewBox="0 0 ' + EV_W + ' ' + H + '" style="position:absolute;left:0;top:0">';
  sv += '<defs><filter id="evTex"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="n"/>'
      + '<feColorMatrix in="n" type="matrix" values="0 0 0 0 0.32 0 0 0 0 0.22 0 0 0 0 0.12 0 0 0 0.55 0"/>'
      + '<feComposite operator="over" in2="SourceGraphic"/></filter></defs>';
  if (cork) {
    sv += '<rect width="' + EV_W + '" height="' + H + '" fill="' + t.bg + '"/>'
        + '<rect width="' + EV_W + '" height="' + H + '" fill="' + t.bg + '" filter="url(#evTex)"/>'
        + '<rect x="6" y="6" width="' + (EV_W - 12) + '" height="' + (H - 12) + '" fill="none" stroke="' + t.frame + '" stroke-width="10" rx="4"/>';
  } else {
    sv += '<rect width="' + EV_W + '" height="' + H + '" fill="' + t.bg + '"/>'
        + '<rect x="10" y="10" width="' + (EV_W - 20) + '" height="' + (H - 20) + '" fill="' + (t.cbg ? t.bg : '#ffffff') + '" stroke="' + t.frame + '" stroke-width="2" rx="10"/>'
        + '<path d="M ' + (EV_W / 2 - 96) + ' 62 Q ' + (EV_W / 2) + ' 67 ' + (EV_W / 2 + 96) + ' 61" stroke="' + EV_OPEN + '" stroke-width="3" fill="none" stroke-linecap="round"/>';
  }

  // 실 + 라벨 좌표 (라벨은 HTML로 그리되 위치는 여기서 확정 — 35% 지점 + 수직 충돌 회피)
  const lblOut = [];
  const placed = [];
  for (const lk of links) {
    const a = pin(lk.a), b = pin(lk.b);
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 14];      // 중점 +14 처짐
    const open = lk.label === '?';
    const col = open ? EV_OPEN : t.thread;
    sv += '<path d="M ' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + ' Q ' + mid[0].toFixed(1) + ' ' + mid[1].toFixed(1)
        + ' ' + b[0].toFixed(1) + ' ' + b[1].toFixed(1) + '" fill="none" stroke="' + col + '" stroke-width="' + (cork ? 2.4 : 3) + '"'
        + (open ? ' stroke-dasharray="6 5"' : '') + ' stroke-linecap="round" opacity="0.92">';
    if (open) sv += '<animate attributeName="stroke-dashoffset" values="0;-22" keyTimes="0;1" dur="1.6s" repeatCount="indefinite"/>';
    sv += '</path>';
    if (lk.label) {
      let pt = evQ(a, mid, b, 0.35);                              // 노드 쪽 35% 지점 (겹침 수정안)
      const lw = Math.max(26, lk.label.length * (open ? 13 : 12) + 14);
      for (const q of placed) {
        if (Math.abs(pt[0] - q[0]) < (lw + q[2]) / 2 && Math.abs(pt[1] - q[1]) < 20) pt[1] += (pt[1] >= q[1] ? 20 : -20);
      }
      placed.push([pt[0], pt[1], lw]);
      lblOut.push({ x: pt[0], y: pt[1], txt: lk.label, open: open, col: col });
    }
  }

  // 핀(cork) / 자석(board) — 카드 위 레이어에 그리도록 별도 svg 조각 축적
  let pinsSv = '';
  nodes.forEach((nd, i) => {
    const p = pin(i);
    const pc = EV_PAL[evHash(nd.name) % 4];
    if (cork) {
      pinsSv += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="5.5" fill="' + pc + '"/>'
              + '<circle cx="' + (p[0] - 1.7).toFixed(1) + '" cy="' + (p[1] - 1.7).toFixed(1) + '" r="1.7" fill="#ffffff" opacity="0.75"/>';
    } else {
      pinsSv += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="6" fill="' + pc + '"/>'
              + '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="6" fill="none" stroke="#00000022" stroke-width="1"/>'
              + '<circle cx="' + (p[0] - 2).toFixed(1) + '" cy="' + (p[1] - 2).toFixed(1) + '" r="2" fill="#ffffff" opacity="0.6"/>';
    }
  });
  sv += '</svg>';

  // ── HTML 레이어: 타이틀·카드·라벨 (jType 적용 — cursive는 라틴·숫자만)
  let inner = '<div class="ev-wrap" style="width:' + EV_W + 'px;height:' + H + 'px;font-family:' + fam + '">' + sv;

  if (cork) {
    inner += '<div class="ev-title ev-sh30" style="background:' + t.card + ';color:' + t.tx + '">'
           + '<span class="ev-tape" style="left:-14px;top:-7px"></span><span class="ev-tape" style="right:-14px;bottom:-7px"></span>'
           + jType(title, fm) + '</div>';
  } else {
    inner += '<div class="ev-title-b" style="color:' + t.tx + '">' + jType(title, fm) + '</div>';
  }

  nodes.forEach((nd, i) => {
    const h = evHash(nd.name);
    const tilt = ((h % 9) - 4) * (cork ? 1.3 : 0.7);              // 이름 시드 기울기
    const bg = cork ? t.card : EV_POSTIT[h % 4];
    inner += '<div class="ev-card ' + (cork ? 'ev-sh30' : 'ev-sh10') + '" style="left:' + (pts[i][0] - EV_CW / 2).toFixed(1) + 'px;top:' + (pts[i][1] - EV_CH / 2).toFixed(1)
           + 'px;background:' + bg + ';border:1px solid ' + t.cardLn + ';border-radius:' + (cork ? 1.5 : 4) + 'px;transform:rotate(' + tilt.toFixed(1) + 'deg)">'
           + '<div class="ev-nm" style="color:' + t.tx + '">' + jType(nd.name, fm) + '</div>'
           + (nd.cat ? '<div class="ev-cat" style="color:' + t.cat + '">&#8212; ' + jType(nd.cat, fm) + ' &#8212;</div>' : '')
           + (nd.memo ? '<div class="ev-memo" style="color:' + t.sub + '">' + jType(nd.memo, fm) + '</div>' : '')
           + '</div>';
  });

  for (const lb of lblOut) {
    inner += '<div class="ev-lbl ev-shL" style="left:' + lb.x.toFixed(1) + 'px;top:' + lb.y.toFixed(1) + 'px;background:' + t.lblBg
           + ';border:1.4px solid ' + lb.col + ';border-radius:' + (cork ? 3 : 11) + 'px;color:' + (lb.open ? EV_OPEN : t.lblTx)
           + ';font-size:' + (lb.open ? 13 : 11.5) + 'px">' + jType(lb.txt, fm) + '</div>';
  }

  // 핀은 카드 위 최상단 레이어
  inner += '<svg width="' + EV_W + '" height="' + H + '" viewBox="0 0 ' + EV_W + ' ' + H + '" style="position:absolute;left:0;top:0;pointer-events:none">' + pinsSv + '</svg>';
  inner += '</div>';

  return html.split('\u27e6BODY\u27e7').join(inner);
}


// ══════════════════════════════════════════════════════════════
// 📋 DUTY (일과표) — 타임라인 체크리스트
// p=시각§내용§상태|... (상태 done/now/todo, 생략=todo) · title= · say=한줄 코멘트
// th=night(기본)/paper[§배경][§강조색] · font= 공통 · 진행률 자동계산 · now=SMIL 펄스(cal 패턴)
// ══════════════════════════════════════════════════════════════

const DT_TH = {
  'night': { bg: '#171320', rail: '#3a3448', tx: '#e8e4f0', sub: '#8a8398', acc: '#DDAACC', box: '#221c2e', done: '#6a6378' },
  'paper': { bg: '#F7F5F0', rail: '#d8d2c4', tx: '#3a2f22', sub: '#8a7a62', acc: '#BB6688', box: '#efe9dc', done: '#a89a84' },
};

function dutyTheme(url) {
  const raw = url.searchParams.get('th') || '';
  const f = raw.split('\u00a7').map(s => s.trim());
  let style = 'night', i = 0;
  const s0 = (f[0] || '').toLowerCase();
  if (DT_TH[s0]) { style = s0; i = 1; }
  else if (f[0] === '') { i = 1; }   // 스타일 자리를 비워 쓴 표기 — 통일 규칙
  const t = Object.assign({ style: style }, DT_TH[style]);
  if (f[i] === '') i++;                       // 빈 칸도 자리를 소비한다
  else { const hx = jHex(f[i] || ''); if (hx) { t.bg = hx; t.tx = themeText(hx); t.custom = true; i++; } }
  const ax = jHex(f[i] || '');
  if (ax) t.acc = ax;
  return t;
}

// p=시각§내용§상태 파싱 (상한 30, 상태 미상=todo)
function dutyItems(p) {
  return (p || '').split('|').map(r => r.trim()).filter(Boolean).slice(0, 30).map(r => {
    const g = r.split('\u00a7');
    let st = (g[2] || '').trim().toLowerCase();
    if (st !== 'done' && st !== 'now') st = 'todo';
    return { time: g[0] || '', txt: g[1] || '', st: st };
  });
}

function renderDuty(html, url) {
  const t = dutyTheme(url);
  const fm = jFont(url, 'sans');
  const fam = jFam(fm);
  const title = url.searchParams.get('title') || '오늘의 일과';
  const items = dutyItems(url.searchParams.get('p'));
  const say = url.searchParams.get('say') || '';
  const doneN = items.filter(x => x.st === 'done').length;
  const pct = items.length ? Math.round(doneN / items.length * 100) : 0;
  const railTint = t.custom ? themeMix(t.bg, t.tx, 0.18) : t.rail;
  const boxTint = t.custom ? themeMix(t.bg, t.tx, 0.08) : t.box;
  const doneTint = t.custom ? themeMix(t.bg, t.tx, 0.42) : t.done;

  let inner = '<div class="dt-wrap" style="background:' + t.bg + ';color:' + t.tx + ';font-family:' + fam + '">';

  // 헤더: 제목 + 진행률 숫자
  inner += '<div class="dt-head"><div class="dt-title">' + jType(title, fm) + '</div>'
         + '<div class="dt-count" style="color:' + t.acc + '">' + doneN + '<span style="color:' + doneTint + '"> / ' + items.length + '</span></div></div>';

  // 진행률 바 (자동계산)
  inner += '<div class="dt-bar" style="background:' + railTint + '"><div style="width:' + pct + '%;height:100%;border-radius:3px;background:' + t.acc + '"></div></div>';

  // 타임라인
  inner += '<div class="dt-list" style="border-left:2px solid ' + railTint + '">';
  items.forEach(it => {
    const done = it.st === 'done', now = it.st === 'now';
    let dot;
    if (now) {
      // cal 오늘 링과 동일 패턴: 채운 원 + 확장 링 r/opacity 이중 SMIL
      dot = '<svg width="26" height="26" viewBox="0 0 26 26" class="dt-dot">'
          + '<circle cx="13" cy="13" r="6" fill="' + t.acc + '"/>'
          + '<circle cx="13" cy="13" r="9" fill="none" stroke="' + t.acc + '" stroke-width="1.4" opacity=".6">'
          + '<animate attributeName="r" values="7.5;11.5;7.5" dur="2.4s" repeatCount="indefinite"/>'
          + '<animate attributeName="opacity" values=".65;.12;.65" dur="2.4s" repeatCount="indefinite"/>'
          + '</circle></svg>';
    } else if (done) {
      dot = '<svg width="26" height="26" viewBox="0 0 26 26" class="dt-dot">'
          + '<circle cx="13" cy="13" r="7" fill="' + t.acc + '"/>'
          + '<path d="M9.5 13.2 L12 15.7 L17 10.4" fill="none" stroke="' + t.bg + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    } else {
      dot = '<svg width="26" height="26" viewBox="0 0 26 26" class="dt-dot">'
          + '<circle cx="13" cy="13" r="6.5" fill="none" stroke="' + railTint + '" stroke-width="2"/></svg>';
    }
    inner += '<div class="dt-item">' + dot
           + '<div class="dt-time" style="color:' + (now ? t.acc : doneTint) + '">' + jEsc(it.time) + '</div>'
           + '<div class="dt-txt" style="' + (done ? 'color:' + doneTint + ';text-decoration:line-through;' : (now ? 'color:' + t.tx + ';font-weight:800;' : 'color:' + t.tx + ';')) + '">'
           + jType(it.txt, fm) + (now ? '<span class="dt-now" style="background:' + t.acc + ';color:' + themeText(t.acc) + '">NOW</span>' : '') + '</div></div>';
  });
  inner += '</div>';

  // say 한줄 코멘트
  if (say) {
    inner += '<div class="dt-say" style="background:' + boxTint + ';border-left:3px solid ' + t.acc + ';color:' + t.sub + '">&#8220;' + jType(say, fm) + '&#8221;</div>';
  }

  inner += '</div>';
  return html.split('\u27e6BODY\u27e7').join(inner);
}

const RENDERERS = {
  'cal': renderCal,
  'pay': renderPay,
  'heist': renderHeist,
  'compass': renderCompass,
  'eviboard': renderEviboard,
  'duty': renderDuty,
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

      // ── 🧭 COMPASS ──
      // pad(20+22) + 헤더(13+1+10) + 원(300) + foot(12 + 라벨 26 + dist줄*18) + MARGIN
      if (t === 'compass') {
        const labC = url.searchParams.get('label') || '';
        const disC = url.searchParams.get('dist') || '';
        let hC = 42 + 24 + 300 + 12;
        if (labC) hC += 14 + 30;
        if (disC) hC += calcLines(disC, 240) * 18 + 2;
        if (!labC && !disC) hC += 36;
        h = Math.min(hC + MARGIN, MAX_H);
      }

      // ── 🧵 EVIBOARD ──
      // 7인 이하 고정 560 / 8인+ 격자: 96 + 행수*(78+46) + 28 (renderEviboard의 evHeight와 동일식)
      if (t === 'eviboard') {
        const nE = evNodes(url.searchParams.get('n')).length;
        h = Math.min(evHeight(nE), MAX_H);
      }

      // ── 📋 DUTY ──
      // pad(24*2) + 헤더(30+12) + 바(6+18) + 항목*46 + say(16 + 코멘트줄*19 + 21)
      if (t === 'duty') {
        const itD = dutyItems(url.searchParams.get('p'));
        const sayD = url.searchParams.get('say') || '';
        let hD = 48 + 42 + 24 + itD.length * 46;
        if (sayD) hD += 16 + calcLines(sayD, 340) * 19 + 21;
        h = Math.min(Math.max(hD + MARGIN, 220), MAX_H);
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

      // ── 🎩 HEIST ──
      if (t === 'heist') {
        const subH = (url.searchParams.get('sub') || 'note').toLowerCase();
        const bodyH = url.searchParams.get('body') || '';
        const chipFactor = 1.35;
        function heistLines(raw, box) {
          let total = 0;
          for (const line of raw.split('|')) {
            const plain = line.replace(/\*/g, '').trim();
            if (!plain) { total += 1; continue; }
            let cjk = 0, ascii = 0;
            for (const ch of plain) { ch.charCodeAt(0) > 0x7F ? cjk++ : ascii++; }
            total += Math.max(Math.ceil((cjk * 16 + ascii * 8.5) * chipFactor / box), 1);
          }
          return Math.max(total, 1);
        }
        if (subH === 'card') {
          const lns = heistLines(bodyH, 250);
          let base = 32 + lns * 40;
          if (url.searchParams.get('place')) base += 27;
          if (url.searchParams.get('from')) base += 40;
          h = Math.max(base + MARGIN, 138);
        } else {
          const titleH = url.searchParams.get('title') || '\uc608\uace0\uc7a5';
          const tChars = [...titleH].length;
          const titleLines = Math.max(Math.ceil(tChars * 50 / 384), 1);
          let base = 34 + 8 + titleLines * 62 + 12 + 11;
          if (url.searchParams.get('to')) base += 27;
          base += heistLines(bodyH, 376) * 39 + 14;
          const footL = (url.searchParams.get('place') ? 22 : 0) + (url.searchParams.get('from') ? 26 : 0);
          base += Math.max(footL, 66) + 6;
          h = Math.max(base + MARGIN, 260);
        }
        h = Math.min(h, MAX_H);
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
