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
};

const SIZES = {
  'cal': [420, 600],
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

const RENDERERS = {
  'cal': renderCal,
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
