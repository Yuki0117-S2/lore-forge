// ══════════════════════════════════════════════════════════════
// 겨울의 이미지 위젯 Workers (p) v1  —  p.winter0.workers.dev
//
// 구조: st 워커 방식(렌더러가 완성된 SVG 문자열을 직접 반환).
//       i/j의 TEMPLATES→wrapInSVG(foreignObject) 경로는 쓰지 않는다.
//       이미지 레이어에 native <image>가 필요하므로 HTML 경유가 불필요하기 때문.
//
// 이미지는 워커가 서버사이드로 fetch해서 base64 data URI로 인라인한다.
//   → 바베챗이 SVG 내부의 외부 리소스 로딩을 전면 차단하는 제약을 우회
//
// 라우트: ?t=cam (스마트폰 카메라) · ?t=rec (캠코더 뷰파인더)
// ══════════════════════════════════════════════════════════════

// ── 이미지 출처 화이트리스트 ──────────────────────────────────
// 호스트만 검사. 경로(/OA/90.png 등)는 자유롭게 바뀌어도 무관.
// 서브도메인까지 허용하려면 SUFFIX 쪽에 루트 도메인을 추가할 것.
const IMG_HOSTS = ['img.wintercards.com'];
const IMG_SUFFIX = ['.wintercards.com'];        // *.wintercards.com 전부 허용
const IMG_MAX_BYTES = 4 * 1024 * 1024;          // 원본 4MB 상한 (base64 ≈ 5.3MB)
const IMG_TIMEOUT_MS = 8000;

function hostAllowed(h) {
  h = (h || '').toLowerCase();
  if (IMG_HOSTS.includes(h)) return true;
  return IMG_SUFFIX.some(sfx => h === sfx.slice(1) || h.endsWith(sfx));
}

// ── 매직바이트 → MIME ────────────────────────────────────────
// URL 확장자(endsWith)로 판별하면 ?v=1 같은 쿼리에 오판하므로 바이트로 본다
function sniffMime(b) {
  if (b.length > 12) {
    if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
    if (b[0] === 0xff && b[1] === 0xd8) return 'image/jpeg';
    if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return 'image/gif';
    if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46
     && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp';
  }
  return null;
}

// ── 바이트 → base64 (8KB 청크; 대용량에서 스택 오버플로 방지) ──
function toBase64(b) {
  let bin = '';
  const CH = 0x2000;
  for (let i = 0; i < b.length; i += CH) {
    bin += String.fromCharCode.apply(null, b.subarray(i, i + CH));
  }
  return btoa(bin);
}

// ══════════════════════════════════════════════════════════════
// 이미지 헤더 → [폭, 높이]  (PNG / WebP 3종 / JPEG)
// base64 만들려고 arrayBuffer를 어차피 받으므로 추가 비용 0
// ══════════════════════════════════════════════════════════════
function imgSize(b) {
  if (!b || b.length < 26) return null;
  const s4 = (o) => String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]);

  // PNG: 시그니처 8B + IHDR, 폭@16 높이@20 (빅엔디안 4B)
  if (b[0] === 0x89 && s4(1) === 'PNG\r' && s4(12) === 'IHDR') {
    const be = (o) => (b[o] << 24 | b[o + 1] << 16 | b[o + 2] << 8 | b[o + 3]) >>> 0;
    return [be(16), be(20)];
  }

  // WebP: RIFF....WEBP + 청크별 분기
  if (s4(0) === 'RIFF' && s4(8) === 'WEBP') {
    const c = s4(12);
    if (c === 'VP8 ') {                                   // 손실
      if (b[23] === 0x9d && b[24] === 0x01 && b[25] === 0x2a) {
        return [((b[27] << 8 | b[26]) & 0x3fff), ((b[29] << 8 | b[28]) & 0x3fff)];
      }
      return null;
    }
    if (c === 'VP8L') {                                   // 무손실
      if (b[20] !== 0x2f) return null;
      const n = b[21] | b[22] << 8 | b[23] << 16 | b[24] << 24;
      return [(n & 0x3fff) + 1, ((n >>> 14) & 0x3fff) + 1];
    }
    if (c === 'VP8X') {                                   // 확장(알파/애니)
      const le3 = (o) => b[o] | b[o + 1] << 8 | b[o + 2] << 16;
      return [le3(24) + 1, le3(27) + 1];
    }
    return null;
  }

  // JPEG: SOF0~SOF15 마커 스캔 (SOF4/8/12 = DHT/JPG/DAC 제외)
  if (b[0] === 0xff && b[1] === 0xd8) {
    let o = 2;
    while (o + 9 < b.length) {
      if (b[o] !== 0xff) { o++; continue; }
      const m = b[o + 1];
      if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { o += 2; continue; }
      const len = b[o + 2] << 8 | b[o + 3];
      if (len < 2) return null;
      if ((m >= 0xc0 && m <= 0xcf) && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
        return [b[o + 7] << 8 | b[o + 8], b[o + 5] << 8 | b[o + 6]];
      }
      o += 2 + len;
    }
  }
  return null;
}

// 폭/높이 비율 → 캔버스 프리셋 키
function oriOf(dim) {
  if (!dim) return null;
  const [w, h] = dim;
  if (!(w > 0 && h > 0)) return null;
  const r = w / h;
  if (r > 1.12) return 'l';
  if (r < 0.89) return 'p';
  return 'sq';
}

// ══════════════════════════════════════════════════════════════
// 이미지 로드 → { uri, dim, err }
// err 코드: none(URL없음) host(도메인거부) bad(URL형식) http(응답실패)
//           big(용량초과) type(이미지아님) net(네트워크/타임아웃)
// ══════════════════════════════════════════════════════════════
async function loadImg(raw) {
  const src = (raw || '').trim();
  if (!src) return { uri: null, dim: null, err: 'none' };

  let u;
  try { u = new URL(src); } catch { return { uri: null, dim: null, err: 'bad' }; }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return { uri: null, dim: null, err: 'bad' };
  if (!hostAllowed(u.hostname)) return { uri: null, dim: null, err: 'host' };

  try {
    const res = await fetch(u.toString(), {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'image/*,*/*' },
      signal: AbortSignal.timeout(IMG_TIMEOUT_MS),
      cf: { cacheEverything: true, cacheTtl: 3600 },
    });
    if (!res.ok) return { uri: null, dim: null, err: 'http' };

    // Content-Length로 선차단 (없으면 본문 받고 재검사)
    const cl = parseInt(res.headers.get('content-length') || '', 10);
    if (cl > IMG_MAX_BYTES) return { uri: null, dim: null, err: 'big' };

    const buf = await res.arrayBuffer();
    if (buf.byteLength > IMG_MAX_BYTES) return { uri: null, dim: null, err: 'big' };

    const b = new Uint8Array(buf);
    const mime = sniffMime(b);
    if (!mime) return { uri: null, dim: null, err: 'type' };

    return { uri: `data:${mime};base64,${toBase64(b)}`, dim: imgSize(b), err: null };
  } catch {
    return { uri: null, dim: null, err: 'net' };
  }
}

const ERR_MSG = {
  none: 'img= 파라미터가 비어 있음',
  bad:  'URL 형식이 올바르지 않음',
  host: '허용되지 않은 이미지 도메인',
  http: '이미지를 불러오지 못함',
  big:  `이미지가 너무 큼 (${IMG_MAX_BYTES / 1024 / 1024}MB 초과)`,
  type: '이미지 파일이 아님',
  net:  '이미지 서버 응답 없음',
};


const esc = (v) => String(v ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// ── 이미지 박스 (원본 크기 고정 — 띠는 바깥에 덧붙는다) ────────
const CAM_IMG = { sq: [1024, 1024], p: [832, 1216], l: [1216, 832] };

const CAM_ANCHOR = {
  c: ['xMidYMid', 0.5, 0.5], t: ['xMidYMin', 0.5, 0.0], b: ['xMidYMax', 0.5, 1.0],
  l: ['xMinYMid', 0.0, 0.5], r: ['xMaxYMid', 1.0, 0.5],
};

const CAM_TH = {
  light: { ui: '#ffffff', dim: '#a9a9b2', bar: '#000000', acc: '#DDAACC' },
  warm:  { ui: '#fff6ec', dim: '#9a8d84', bar: '#0d0805', acc: '#CCAA88' },
  mono:  { ui: '#e8e8ee', dim: '#83839a', bar: '#05050a', acc: '#8888CC' },
};
const CAM_PRESETS = {
  pink: '#DDAACC', 핑크: '#DDAACC', indigo: '#8888CC', 인디고: '#8888CC',
  gold: '#CCAA88', 골드: '#CCAA88', rose: '#BB6688', 로즈: '#BB6688',
};
// 칩(알약/원형 버튼) 배경 — 프리뷰 위에선 검정, 검은 띠 위에선 흰색 저투명
const chipF = (ov) => ov ? '#000000' : '#ffffff';
const chipO = (ov) => ov ? 0.45 : 0.14;

const REC_COL = '#FF6F52';   // 삼성 녹화 주황 (실기기 색)
const NL_COL   = '#FFC94D';  // 저조도(야간) 배지 앰버 — 실기기 색
const LIVE_COL = '#3ECF7E';  // 안드로이드 프라이버시 표시 (초록)

function camHex(s) {
  s = (s || '').trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(s)) s = s.split('').map(c => c + c).join('');
  return /^[0-9a-fA-F]{6}$/.test(s) ? '#' + s.toLowerCase() : null;
}
function camTheme(params) {
  const f = (params.get('th') || '').split('\u00a7');
  const th = { ...(CAM_TH[(f[0] || '').trim().toLowerCase()] || CAM_TH.light) };
  if (f.length >= 2 && f[1]) {
    const g = f[1].trim().toLowerCase();
    th.bar = camHex(g) || CAM_PRESETS[g] || th.bar;
  }
  if (f.length >= 3 && f[2]) {
    const g = f[2].trim().toLowerCase();
    th.acc = camHex(g) || CAM_PRESETS[g] || th.acc;
  }
  return th;
}

function camList(raw, def) {
  const out = ((raw && raw.trim()) ? raw : def).split('|').map(s => s.trim())
    .filter(Boolean).map(s => {
      const on = s.endsWith('*');
      return { txt: on ? s.slice(0, -1) : s, on };
    });
  if (!out.some(i => i.on) && out.length) out[0].on = true;
  return out.slice(0, 7);
}

// ── 레이아웃: 이미지 크기는 고정, 띠만 상태별로 달라진다 ───────
function camLayout(ori, st) {
  const [IW, IH] = CAM_IMG[ori];
  const wide = ori === 'l';
  const barT = wide ? 88 : 66;
  // photo=전부 띠 안 / video=모드만 / rec=모드 없음
  // 가로: 사진·동영상 모두 컨트롤이 우측 띠 안 (실기기 확인) → 같은 두께
  // 세로: 사진만 띠 안, 동영상은 오버레이 → 띠는 모드 스트립만
  // 녹화중: 모드 스트립 소멸 → 여백만
  // 녹화중은 동영상과 동일한 뼈대를 쓴다 — 재생 시작해도 버튼이 움직이면 안 되므로
  // 띠 두께·캔버스 크기까지 동영상과 완전히 일치시킨다
  const barB = st === 'photo' ? (wide ? 340 : 362) : (wide ? 340 : 152);
  return {
    IW, IH, wide, barT, barB,
    W: wide ? IW + barT + barB : IW,
    H: wide ? IH : IH + barT + barB,
    ix: wide ? barT : 0,
    iy: wide ? 0 : barT,
  };
}

function camUid(params) {
  let h = 5381;
  for (const c of params.toString()) h = ((h * 33) ^ c.charCodeAt(0)) >>> 0;
  return h.toString(36).slice(0, 6);
}

// ══════════════════════════════════════════════════════════════
function renderCam(params, dataURI, autoOri, errMsg) {
  const U = camUid(params);
  const oRaw = (params.get('o') || '').trim().toLowerCase();
  const ori = CAM_IMG[oRaw] ? oRaw : (CAM_IMG[autoOri] ? autoOri : 'sq');

  let st = (params.get('st') || 'photo').trim().toLowerCase();
  if (!['photo', 'video', 'rec'].includes(st)) st = 'photo';
  const vid = st !== 'photo';                    // 동영상 계열
  const L = camLayout(ori, st);
  const { W, H, IW, IH, ix, iy, wide, barB } = L;
  const th = camTheme(params);
  const u = th.ui, dim = th.dim, acc = th.acc;

  // 크롭
  const cf = (params.get('cr') || 'c').split('\u00a7');
  const [par, ax, ay] = CAM_ANCHOR[(cf[0] || 'c').trim().toLowerCase()] || CAM_ANCHOR.c;
  let zoom = parseFloat(cf[1]);
  if (!(zoom >= 1 && zoom <= 4)) zoom = 1;

  // 텍스트류
  const badge = esc((params.get('bd') || (vid ? 'FHD 30' : '12M')).trim()).slice(0, 10);
  const tcode = esc((params.get('tc') || '00:00:01').trim()).slice(0, 12);
  const nl = (params.get('nl') || '').trim();
  const say = esc((params.get('say') || '').trim()).slice(0, 40);
  const zooms = camList(params.get('z'), '.6|1*|2|3|5|10');
  const modes = camList(params.get('m'), '인물 사진|사진*|동영상|더보기');
  const pf = (params.get('p') || '').split('\u00a7');
  const clock = pf[0] ? esc(pf[0].trim()) : null;   // 지정 시에만 표시 (실기기는 없음)
  const batt = Math.max(0, Math.min(100, parseInt(pf[1], 10) || 87));

  // AF
  const afRaw = (params.get('af') || '').trim().toLowerCase();
  const afOff = afRaw === 'x' || afRaw === 'off';
  const af = afRaw.split('\u00a7');
  const afx = ix + Math.max(10, Math.min(90, parseFloat(af[0]) || 50)) / 100 * IW;
  const afy = iy + Math.max(10, Math.min(90, parseFloat(af[1]) || 50)) / 100 * IH;

  let s = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"`
        + ` width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"`
        + ` font-family="-apple-system,'Noto Sans KR',sans-serif">`
        + `<defs><clipPath id="cv${U}"><rect x="${ix}" y="${iy}" width="${IW}" height="${IH}"/></clipPath></defs>`
        + `<rect width="${W}" height="${H}" fill="${th.bar}"/>`;

  // ── 프리뷰 이미지 ──
  if (dataURI) {
    const ox = ix + ax * IW, oy = iy + ay * IH;
    const tf = zoom > 1
      ? ` transform="translate(${ox.toFixed(1)},${oy.toFixed(1)}) scale(${zoom}) translate(${(-ox).toFixed(1)},${(-oy).toFixed(1)})"` : '';
    // clip-path는 자기 transform 이후의 좌표계에서 해석된다.
    // 같은 <g>에 걸면 클립 사각형까지 확대돼 이미지가 검은 띠로 새어나온다.
    // → 바깥 <g>가 클립, 안쪽 <g>가 줌.
    s += `<g clip-path="url(#cv${U})"><g${tf}><image x="${ix}" y="${iy}" width="${IW}" height="${IH}"`
       + ` preserveAspectRatio="${par} slice" href="${dataURI}" xlink:href="${dataURI}"/></g></g>`;
  } else {
    s += `<rect x="${ix}" y="${iy}" width="${IW}" height="${IH}" fill="#1c1828"/>`
       + `<g opacity="0.5" stroke="#6a6280" stroke-width="4" fill="none">`
       + `<rect x="${ix + IW/2 - 52}" y="${iy + IH/2 - 84}" width="104" height="80" rx="12"/>`
       + `<circle cx="${ix + IW/2}" cy="${iy + IH/2 - 44}" r="24"/></g>`
       + `<text x="${ix + IW/2}" y="${iy + IH/2 + 46}" text-anchor="middle" fill="#8f88a8"`
       + ` font-size="26">${esc(errMsg || '이미지 없음')}</text>`;
  }

  // ── 3×3 격자 ──
  s += `<g stroke="${u}" stroke-width="1.6" opacity="0.55">`;
  for (let i = 1; i <= 2; i++) {
    s += `<line x1="${ix + IW*i/3}" y1="${iy}" x2="${ix + IW*i/3}" y2="${iy + IH}"/>`
      +  `<line x1="${ix}" y1="${iy + IH*i/3}" x2="${ix + IW}" y2="${iy + IH*i/3}"/>`;
  }
  s += `</g>`;

  // ── AF 원 + 노출 슬라이더 ──
  if (!afOff) {
    s += `<g transform="translate(${afx.toFixed(1)},${afy.toFixed(1)})">`
      +  `<g fill="none" stroke="${u}" stroke-width="2.6" stroke-linecap="round">`
      +  `<animateTransform attributeName="transform" type="scale" values="1.1;1;1"`
      +  ` keyTimes="0;0.1;1" dur="7s" repeatCount="indefinite"/>`
      +  `<circle r="86"/>`;
    for (let i = 0; i < 3; i++) {                        // 노출 눈금 (중심 대칭)
      const off = 20 + i * 20;
      s += `<line x1="-30" y1="${-off}" x2="30" y2="${-off}"/>`
        +  `<line x1="-30" y1="${off}"  x2="30" y2="${off}"/>`;
    }
    s += `</g><line x1="-108" y1="6" x2="108" y2="-6" stroke="${u}" stroke-width="4" stroke-linecap="round"/></g>`;
  }

  // ── 저조도 배지 (어두울 때만 나오는 것 → nl= 지정 시에만) ──
  if (nl) {
    const nx = wide ? ix + IW - 78 : ix + IW - 78, ny = iy + IH - 78;
    s += `<circle cx="${nx}" cy="${ny}" r="42" fill="#000" opacity="0.55"/>`
      +  `<path d="M${nx - 8} ${ny - 16} a17 17 0 1 0 12 28 21 21 0 0 1-12-28z" fill="${NL_COL}"/>`
      +  `<text x="${nx + 16}" y="${ny + 8}" text-anchor="middle" fill="${NL_COL}" font-size="24" font-weight="700">${esc(nl).slice(0,2)}</text>`;
  }

  // ══ 상단 띠 (세로=위 / 가로=좌측 세로 스택) ══════════════════
  {
    // 녹화중에는 플래시만 남는다 (실기기 확인)
    const ico = [{ k: 'flash' }];
    if (st !== 'rec') {
      ico.push({ k: 'txt', t: badge });
      ico.push({ k: vid ? 'stab' : 'timer' });
      ico.push({ k: vid ? 'hdr' : 'filter' });
    }

    if (!wide) {
      const cy = 34;
      const wOf = (it) => it.k === 'txt' ? 92 : (it.k === 'hdr' ? 84 : 74);
      let cx = W - 40 - ico.reduce((a, it) => a + wOf(it), 0) + wOf(ico[0]) / 2;
      for (const it of ico) { s += camIcon(it, cx, cy, u, th.acc); cx += wOf(it); }
      if (clock) {
        s += `<text x="30" y="${cy + 9}" fill="${u}" font-size="25" font-weight="600">${clock}</text>`;
        s += camBatt(96, cy, batt, u);
      }
    } else {
      const cx = 44;
      let cy = 62;
      for (const it of ico) { s += camIcon(it, cx, cy, u, th.acc); cy += it.k === 'txt' ? 78 : 66; }
      if (clock) s += `<text x="${cx}" y="${H - 26}" text-anchor="middle" fill="${u}" font-size="21" font-weight="600"`
                   + ` transform="rotate(-90 ${cx} ${H - 26})">${clock}</text>`;
    }
  }

  // ══ 컨트롤 영역 ═════════════════════════════════════════════
  // photo → 전부 검은 띠 안 / video·rec → 배율·셔터는 프리뷰 위 오버레이
  const zc = zooms.map(z => z.txt), zi = zooms.findIndex(z => z.on);

  // 녹화중도 동영상과 동일 취급 — 오버레이 여부까지 일치시켜야 버튼이 안 움직인다
  const overlay = !wide && vid;

  // 녹화중(rec)은 동영상(video)과 좌표를 100% 공유한다.
  // 바뀌는 것은 버튼의 '내용'뿐 — 셔터→정지·일시정지 알약, 썸네일→촬영용 흰 원,
  // ⠿→돋보기(+주황 점), 모드 스트립→숨김.
  const rec = st === 'rec';

  if (!wide) {
    // ── 세로 ──
    const bTop = iy + IH;                       // 하단 띠 시작 y
    // 배율바(높이 76)와 셔터(r=63)가 겹치지 않도록 간격 확보
    const zY  = overlay ? bTop - 288 : bTop + 26;   // 하단: zY+76
    const shY = overlay ? bTop - 118 : bTop + 190;  // 상단: shY-63
    s += camZoomH(W / 2 - 34, zY, zc, zi, u, overlay);
    if (rec) s += camMag(W - 78, zY + 38, u);
    else s += `<circle cx="${W - 78}" cy="${zY + 38}" r="34" fill="${chipF(overlay)}" opacity="${chipO(overlay)}"/>`
            +  camDots(W - 78, zY + 38, u);
    if (rec) {
      s += camStopPair(W / 2, shY, false, u);
      s += `<circle cx="${W / 2 - 244}" cy="${shY}" r="40" fill="${u}"/>`;
    } else {
      s += camShutter(W / 2, shY, st, u);
      s += camThumb(W / 2 - 244, shY, u, overlay);
    }
    s += camFlip(W / 2 + 244, shY, u, overlay);
    if (!rec) s += camModes(modes, W / 2, overlay ? H - 46 : bTop + 320, u, dim, false);
  } else {
    // ── 가로 (모든 컨트롤이 우측으로) ──
    const rx = ix + IW;                          // 우측 띠 시작 x
    const zX  = overlay ? rx - 196 : rx + 48;
    const shX = overlay ? rx -  84 : rx + 180;
    s += camZoomV(zX, H / 2, zc, zi, u, overlay);
    if (rec) s += camMag(shX, 72, u);
    else s += `<circle cx="${shX}" cy="72" r="34" fill="${chipF(overlay)}" opacity="${chipO(overlay)}"/>`
            +  camDots(shX, 72, u);
    s += camFlip(shX, 170, u, overlay);
    if (rec) {
      s += camStopPair(shX, H / 2, true, u);
      s += `<circle cx="${shX}" cy="${H - 82}" r="40" fill="${u}"/>`;
    } else {
      s += camShutter(shX, H / 2, st, u);
      s += camThumb(shX, H - 82, u, overlay);
    }
    if (!rec) s += camModes(modes, rx + 296, H / 2, u, dim, true);
  }

  // ── 녹화중 오버레이: 타임코드 + 라이브 배지 ──
  if (st === 'rec') {
    const run = (params.get('run') || '') === '1';
    const tw = run ? Math.round(tickWidth(34)) + 62 : 44 + tcode.length * 21;
    const tx = ix + IW / 2, ty = iy + 62;
    s += `<rect x="${tx - tw/2}" y="${ty - 34}" width="${tw}" height="68" rx="34" fill="${REC_COL}"/>`;
    s += run
      ? camTick(tx, ty + 12, 34, camSecs(tcode), '#ffffff')
      : `<text x="${tx}" y="${ty + 11}" text-anchor="middle" fill="#fff" font-size="34"`
        + ` font-weight="700" letter-spacing="1">${tcode}</text>`;
    const lx = ix + IW - 78, ly = iy + 44;
    if (wide) s += `<rect x="${lx - 52}" y="${ly - 27}" width="104" height="54" rx="27" fill="${LIVE_COL}"/>`
      +  `<g fill="#fff"><rect x="${lx - 36}" y="${ly - 11}" width="26" height="21" rx="4"/>`
      +  `<path d="M${lx - 8} ${ly - 8} l10-6v22l-10-6z"/>`
      +  `<rect x="${lx + 14}" y="${ly - 13}" width="12" height="18" rx="6"/>`
      +  `<path d="M${lx + 12} ${ly + 2} a8 8 0 0 0 16 0" fill="none" stroke="#fff" stroke-width="3"/></g>`;
  }

  // ── 캡션 ──
  if (say) {
    const cw = 60 + say.length * 19, cy2 = iy + IH - (vid ? 300 : 60);
    s += `<rect x="${ix + IW/2 - cw/2}" y="${cy2 - 32}" width="${cw}" height="58" rx="29" fill="#000" opacity="0.42"/>`
      +  `<text x="${ix + IW/2}" y="${cy2 + 7}" text-anchor="middle" fill="${u}" font-size="26">${say}</text>`;
  }

  return s + `</svg>`;
}

// ── 흐르는 타임코드 (run=1) ─────────────────────────────────
// SMIL은 텍스트 '내용'을 바꿀 수 없다. 그래서 자릿수마다 글리프를 겹쳐두고
// opacity를 discrete로 순환시킨다. 자릿수별 주기가 정확히 배수 관계라
// 별도 로직 없이 자리올림이 저절로 맞물린다. begin에 음수를 주면 그 시각부터 출발.
const TICK_COLS = [
  [10, 36000], [10, 3600], null,   // HH
  [6, 600],    [10, 60],   null,   // MM
  [6, 10],     [10, 1],            // SS
];
const tickWidth = (fs2) => fs2 * 0.62 * 7.1;

function camTick(cx, cy, fs2, offset, col) {
  const W1 = fs2 * 0.62;
  let x = cx - tickWidth(fs2) / 2 + W1 / 2, g = '';
  for (const c of TICK_COLS) {
    if (!c) {
      g += `<text x="${(x - W1 * 0.22).toFixed(1)}" y="${cy}" text-anchor="middle"`
        +  ` font-size="${fs2}" font-family="ui-monospace,monospace" fill="${col}" font-weight="700">:</text>`;
      x += W1 * 0.55; continue;
    }
    const [n, unit] = c, dur = n * unit;
    for (let i = 0; i < n; i++) {
      // keyTimes는 반드시 0에서 시작해 1에서 끝나야 한다.
      // (i+1)/n 으로 끝내면 규격 위반이라 브라우저가 값을 물고 있어
      // 여러 글자가 동시에 보이는 버그가 난다 → 위치별로 3점 형태를 나눠 쓴다.
      // 1/6 같은 순환소수를 반올림하면 전환 시점이 미세하게 '늦어' 경계에서 빈틈이 생긴다.
      // 내림(truncate)하면 아주 살짝 이르게 걸려 빈틈이 사라진다.
      const tr = (v) => (Math.floor(v * 1e7) / 1e7).toFixed(7);
      const a = tr(i / n), b2 = tr((i + 1) / n);
      const anim = i === 0        ? `values="1;0;0" keyTimes="0;${b2};1"`
                 : i === n - 1    ? `values="0;1;1" keyTimes="0;${a};1"`
                 :                  `values="0;1;0;0" keyTimes="0;${a};${b2};1"`;
      g += `<text x="${x.toFixed(1)}" y="${cy}" text-anchor="middle" opacity="0"`
        +  ` font-size="${fs2}" font-family="ui-monospace,monospace" fill="${col}" font-weight="700">${i}`
        +  `<animate attributeName="opacity" dur="${dur}s" repeatCount="indefinite" calcMode="discrete"`
        +  ` begin="${-offset}s" ${anim}/></text>`;
    }
    x += W1;
  }
  return g;
}

// "SS" / "MM:SS" / "HH:MM:SS" → 초 (100시간 순환)
function camSecs(t) {
  const f = String(t).split(':').map(v => parseInt(v, 10) || 0);
  while (f.length < 3) f.unshift(0);
  return (f[0] * 3600 + f[1] * 60 + f[2]) % 360000;
}

// ══ 부품 ══════════════════════════════════════════════════════
function camIcon(it, cx, cy, u, acc) {
  if (it.k === 'txt')
    return `<text x="${cx}" y="${cy + 9}" text-anchor="middle" fill="${u}" font-size="25" font-weight="600">${it.t}</text>`;
  if (it.k === 'hdr')
    return `<rect x="${cx - 33}" y="${cy - 17}" width="66" height="34" rx="17" fill="none" stroke="${acc}" stroke-width="2.4"/>`
         + `<text x="${cx}" y="${cy + 8}" text-anchor="middle" fill="${acc}" font-size="21" font-weight="700">HDR</text>`;
  if (it.k === 'flash')                      // 번개 + 취소선
    return `<g stroke="${u}" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round">`
         + `<path d="M${cx+4} ${cy-15} L${cx-8} ${cy+1} L${cx-1} ${cy+1} L${cx-4} ${cy+15} L${cx+8} ${cy-1} L${cx+1} ${cy-1} Z"/>`
         + `<line x1="${cx-14}" y1="${cy+15}" x2="${cx+14}" y2="${cy-15}"/></g>`;
  if (it.k === 'timer')                      // 원 + 사선
    return `<g stroke="${u}" stroke-width="2.6" fill="none" stroke-linecap="round">`
         + `<circle cx="${cx}" cy="${cy}" r="14"/><line x1="${cx-13}" y1="${cy+13}" x2="${cx+13}" y2="${cy-13}"/></g>`;
  if (it.k === 'stab')                       // 손떨림 보정 (사람 + 사선)
    return `<g stroke="${u}" stroke-width="2.6" fill="none" stroke-linecap="round">`
         + `<circle cx="${cx-2}" cy="${cy-11}" r="3.6" fill="${u}"/>`
         + `<path d="M${cx-11} ${cy-1} l9-3 9 3M${cx-2} ${cy-4} v9M${cx-2} ${cy+5} l-6 10M${cx-2} ${cy+5} l6 10"/>`
         + `<line x1="${cx-14}" y1="${cy+15}" x2="${cx+14}" y2="${cy-15}"/></g>`;
  // filter — 점 채운 원
  let d = `<circle cx="${cx}" cy="${cy}" r="14" fill="none" stroke="${u}" stroke-width="2.4"/>`;
  for (let i = 0; i < 5; i++)
    d += `<circle cx="${cx - 6 + (i % 3) * 6}" cy="${cy - 5 + Math.floor(i / 3) * 8}" r="2.1" fill="${u}"/>`;
  return d;
}

function camBatt(x, cy, pct, u) {
  return `<rect x="${x}" y="${cy - 10}" width="40" height="20" rx="6" fill="none" stroke="${u}" stroke-width="2.4" opacity="0.9"/>`
       + `<rect x="${x + 43}" y="${cy - 4}" width="4" height="9" rx="2" fill="${u}" opacity="0.9"/>`
       + `<rect x="${x + 3.5}" y="${cy - 6.5}" width="${33 * pct / 100}" height="13" rx="3" fill="${pct <= 20 ? '#EE1166' : u}"/>`;
}

function camDots(cx, cy, u) {
  let d = '';
  for (let i = 0; i < 4; i++)
    d += `<circle cx="${cx - 7 + (i % 2) * 14}" cy="${cy - 7 + Math.floor(i / 2) * 14}" r="3.6" fill="${u}"/>`;
  return d;
}

// 배율 알약바 — 가로형(세로 화면용)
function camZoomH(cx, cy, list, act, u, overlay) {
  const gap = 66, w = list.length * gap + 22, x = cx - w / 2;
  let d = `<rect x="${x}" y="${cy}" width="${w}" height="76" rx="38" fill="${chipF(overlay)}" opacity="${chipO(overlay)}"/>`;
  list.forEach((t, i) => {
    const px2 = x + 11 + gap * i + gap / 2, on = i === act;
    if (on) d += `<circle cx="${px2}" cy="${cy + 38}" r="30" fill="#fff" opacity="0.22"/>`;
    d += `<text x="${px2}" y="${cy + 47}" text-anchor="middle" fill="${u}"`
      +  ` font-size="${on ? 27 : 25}" font-weight="${on ? 700 : 500}">${esc(t)}${on ? '\u00d7' : ''}</text>`;
  });
  return d;
}

// 배율 알약바 — 세로형(가로 화면용). 위에서부터 큰 배율
function camZoomV(cx, cy, list, act, u, overlay) {
  const rev = list.slice().reverse(), ra = list.length - 1 - act;
  const gap = 78, h = rev.length * gap + 22, y = cy - h / 2;
  let d = `<rect x="${cx - 38}" y="${y}" width="76" height="${h}" rx="38" fill="${chipF(overlay)}" opacity="${chipO(overlay)}"/>`;
  rev.forEach((t, i) => {
    const py = y + 11 + gap * i + gap / 2, on = i === ra;
    if (on) d += `<circle cx="${cx}" cy="${py}" r="30" fill="#fff" opacity="0.22"/>`;
    d += `<text x="${cx}" y="${py + 9}" text-anchor="middle" fill="${u}"`
      +  ` font-size="${on ? 27 : 25}" font-weight="${on ? 700 : 500}">${esc(t)}${on ? '\u00d7' : ''}</text>`;
  });
  return d;
}

function camShutter(cx, cy, st, u) {
  if (st === 'photo') return `<circle cx="${cx}" cy="${cy}" r="63" fill="${u}"/>`;
  if (st === 'video')
    return `<circle cx="${cx}" cy="${cy}" r="63" fill="${u}"/>`
         + `<circle cx="${cx}" cy="${cy}" r="29" fill="${REC_COL}"/>`;
  // rec — 정지(사각). 일시정지는 camPause로 분리
  return `<circle cx="${cx}" cy="${cy}" r="63" fill="${u}"/>`
       + `<rect x="${cx - 21}" y="${cy - 21}" width="42" height="42" rx="7" fill="${REC_COL}"/>`;
}

// 녹화중 전용 — 줌 돋보기(+). 우상단에 주황 점 배지
function camMag(cx, cy, u) {
  return `<circle cx="${cx}" cy="${cy}" r="34" fill="#000" opacity="0.45"/>`
       + `<g fill="none" stroke="${u}" stroke-width="3" stroke-linecap="round">`
       + `<circle cx="${cx - 3}" cy="${cy - 3}" r="12"/>`
       + `<line x1="${cx + 6}" y1="${cy + 6}" x2="${cx + 15}" y2="${cy + 15}"/>`
       + `<line x1="${cx - 8}" y1="${cy - 3}" x2="${cx + 2}" y2="${cy - 3}"/>`
       + `<line x1="${cx - 3}" y1="${cy - 8}" x2="${cx - 3}" y2="${cy + 2}"/></g>`
       + `<circle cx="${cx + 26}" cy="${cy - 26}" r="5" fill="${REC_COL}"/>`;
}

// 녹화중 전용 — 일시정지(‖)와 정지(■)가 하나의 알약 안에
function camStopPair(cx, cy, vert, u) {
  const half = 139, r = 59;
  let d = vert
    ? `<rect x="${cx - r}" y="${cy - half}" width="${r * 2}" height="${half * 2}" rx="${r}" fill="#000" opacity="0.42"/>`
    : `<rect x="${cx - half}" y="${cy - r}" width="${half * 2}" height="${r * 2}" rx="${r}" fill="#000" opacity="0.42"/>`;
  // 가로화면(vert): 정지가 위 / 세로화면: 일시정지가 왼쪽
  const a = vert ? [cx, cy - 58] : [cx - 58, cy];
  const b = vert ? [cx, cy + 58] : [cx + 58, cy];
  const stop = vert ? a : b, ps = vert ? b : a;
  return d
    + `<rect x="${stop[0] - 21}" y="${stop[1] - 21}" width="42" height="42" rx="6" fill="${u}"/>`
    + `<g fill="${u}"><rect x="${ps[0] - 15}" y="${ps[1] - 21}" width="11" height="42" rx="5"/>`
    + `<rect x="${ps[0] + 4}" y="${ps[1] - 21}" width="11" height="42" rx="5"/></g>`;
}

function camPause(cx, cy, u, overlay) {
  return `<circle cx="${cx}" cy="${cy}" r="40" fill="${chipF(overlay)}" opacity="${chipO(overlay)}"/>`
       + `<g fill="${u}"><rect x="${cx - 13}" y="${cy - 16}" width="9" height="32" rx="4"/>`
       + `<rect x="${cx + 4}" y="${cy - 16}" width="9" height="32" rx="4"/></g>`;
}

function camThumb(cx, cy, u, overlay) {
  return `<circle cx="${cx}" cy="${cy}" r="40" fill="${chipF(overlay)}" opacity="${chipO(overlay)}"/>`
       + `<circle cx="${cx}" cy="${cy}" r="40" fill="none" stroke="${u}" stroke-width="2.4" opacity="0.5"/>`;
}

function camFlip(cx, cy, u, overlay) {
  return `<circle cx="${cx}" cy="${cy}" r="42" fill="${chipF(overlay)}" opacity="${chipO(overlay)}"/>`
       + `<g fill="none" stroke="${u}" stroke-width="3.4" stroke-linecap="round">`
       + `<path d="M${cx - 18} ${cy - 5} a18 18 0 0 1 30-9"/>`
       + `<path d="M${cx + 18} ${cy + 5} a18 18 0 0 1-30 9"/>`
       + `<path d="M${cx + 6} ${cy - 20} l7 6-6 7M${cx - 6} ${cy + 20} l-7-6 6-7"/></g>`;
}

// 모드 스트립. vert=true면 90° 회전 (가로 화면)
function camModes(modes, cx, cy, u, dim, vert) {
  const fs = 25, gap = 54;
  const wOf = (t) => { let w = 0; for (const c of t) w += c.charCodeAt(0) > 0x7f ? fs : fs * 0.55; return w; };
  const ws = modes.map(m => wOf(m.txt));
  const tot = ws.reduce((a, b) => a + b, 0) + gap * (modes.length - 1);
  let p = -tot / 2;
  let d = '';
  modes.forEach((m, i) => {
    const off = p + ws[i] / 2;
    const x = vert ? cx : cx + off, y = vert ? cy - off : cy;
    const rot = vert ? ` transform="rotate(-90 ${x} ${y})"` : '';
    d += `<text x="${x}" y="${y + (vert ? 0 : 9)}" text-anchor="middle"${rot}`
      +  ` fill="${m.on ? u : dim}" font-size="${fs}" font-weight="${m.on ? 800 : 500}">${esc(m.txt)}</text>`;
    p += ws[i] + gap;
  });
  return d;
}
// ══════════════════════════════════════════════════════════════
// 📹 REC (캠코더 뷰파인더) — st `camc`의 이미지판
// t=rec · img= · o=sq|p|l · cr=앵커[§줌]  ← cam과 동일한 인프라
//
// camc 계승 파라미터 (st에서 검증된 이름 그대로):
//   rec=0(STBY) · tc=타임코드 · run=1(흐름) · bat=배터리 · zm=배율표기
//   face=N(0~3 감지 프레임) · glitch=1 · mem=% or FULL · sig=0~4
//   vu=0~10 · scn=장면번호 · date=날짜스탬프 · focus=0(AF실패) · say=하단자막
//   tone=nv(나이트비전)/ir(적외선)/생략(컬러)
// ══════════════════════════════════════════════════════════════

function renderRec(params, dataURI, autoOri, errMsg) {
  const U = camUid(params);
  const oRaw = (params.get('o') || '').trim().toLowerCase();
  const ori = CAM_IMG[oRaw] ? oRaw : (CAM_IMG[autoOri] ? autoOri : 'sq');
  const [W, H] = CAM_IMG[ori];

  // 크롭/줌 — cam과 동일 규칙
  const cf = (params.get('cr') || 'c').split('\u00a7');
  const [par, ax, ay] = CAM_ANCHOR[(cf[0] || 'c').trim().toLowerCase()] || CAM_ANCHOR.c;
  let zoom = parseFloat(cf[1]);
  if (!(zoom >= 1 && zoom <= 4)) zoom = 1;

  // camc 계승 옵션
  const tone = (params.get('tone') || '').trim().toLowerCase();     // nv / ir / ''
  const isRec = (params.get('rec') || '1') !== '0';
  const tcode = esc((params.get('tc') || '00:00:00').trim()).slice(0, 12);
  const run = (params.get('run') || '') === '1';
  const bat = esc((params.get('bat') || '84%').trim()).slice(0, 8);
  const batWarn = bat.includes('-') || parseInt(bat, 10) <= 10;
  const zm = esc((params.get('zm') || '').trim()).slice(0, 6);
  const face = Math.max(0, Math.min(3, parseInt(params.get('face'), 10) || 0));
  const glitch = (params.get('glitch') || '') === '1';
  const memRaw = (params.get('mem') || '').trim();
  const sigRaw = (params.get('sig') || '').trim();
  const vuRaw = (params.get('vu') || '').trim();
  const scn = esc((params.get('scn') || '').trim()).slice(0, 10);
  const dateStamp = esc((params.get('date') || '').trim()).slice(0, 20);
  const afFail = (params.get('focus') || '') === '0';
  const fx = (params.get('fx') || '1') !== '0';   // fx=0 = 클린 화면 (노이즈·스캔라인·비네팅 OFF)
  const say = esc((params.get('say') || '').trim()).slice(0, 40);

  // camc 색: 나이트비전 연두 / IR 회백 / 컬러 모드는 흰색 UI
  const ui = tone === 'ir' ? '#e8e8e8' : (tone === 'nv' ? '#aef0c2' : '#f2f2f2');
  const warn = '#ff4d4d';

  let s = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"`
        + ` width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="ui-monospace,Menlo,monospace">`;
  // 컬러 모드에서 흰 이미지 위 텍스트 가독용 외곽선
  const SH = ` style="paint-order:stroke" stroke="#000" stroke-opacity="0.55" stroke-width="3"`;

  // ── defs: 노이즈(camc 이식) + 비네팅 + 색조 + 클립 ──
  s += `<defs>`
    + `<filter id="nz${U}"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="n">`
    + `<animate attributeName="seed" values="1;9" dur="0.5s" repeatCount="indefinite" calcMode="discrete"/></feTurbulence>`
    + `<feColorMatrix in="n" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.10 0"/>`
    + `<feComposite operator="over" in2="SourceGraphic"/></filter>`
    + `<radialGradient id="vig${U}" cx="0.5" cy="0.5" r="0.75">`
    + `<stop offset="0.6" stop-color="#000" stop-opacity="0"/>`
    + `<stop offset="1" stop-color="#000" stop-opacity="0.62"/></radialGradient>`;
  if (tone === 'nv')                                   // 나이트비전: 초록 단색화
    s += `<filter id="tn${U}"><feColorMatrix type="matrix"`
      + ` values="0 0 0 0 0.10  0.55 0.65 0.30 0 0.06  0 0 0 0 0.14  0 0 0 1 0"/></filter>`;
  else if (tone === 'ir')                              // 적외선: 회백 반전풍
    s += `<filter id="tn${U}"><feColorMatrix type="saturate" values="0"/>`
      + `<feComponentTransfer><feFuncR type="gamma" amplitude="1.25" exponent="0.8" offset="0"/>`
      + `<feFuncG type="gamma" amplitude="1.25" exponent="0.8" offset="0"/>`
      + `<feFuncB type="gamma" amplitude="1.25" exponent="0.8" offset="0"/></feComponentTransfer></filter>`;
  s += `<clipPath id="rc${U}"><rect x="0" y="0" width="${W}" height="${H}"/></clipPath></defs>`;

  s += `<rect width="${W}" height="${H}" fill="#0a0c0a"/>`;

  // ── 이미지 (색조필터 → 클립 → 줌: cam과 같은 중첩 규칙) ──
  if (dataURI) {
    const ox = ax * W, oy = ay * H;
    const tf = zoom > 1
      ? ` transform="translate(${ox.toFixed(1)},${oy.toFixed(1)}) scale(${zoom}) translate(${(-ox).toFixed(1)},${(-oy).toFixed(1)})"` : '';
    const tn = tone === 'nv' || tone === 'ir' ? ` filter="url(#tn${U})"` : '';
    s += `<g clip-path="url(#rc${U})"><g${tf}><image x="0" y="0" width="${W}" height="${H}"`
       + ` preserveAspectRatio="${par} slice"${tn} href="${dataURI}" xlink:href="${dataURI}"/></g></g>`;
  } else {
    s += `<text x="${W/2}" y="${H/2}" text-anchor="middle" fill="#5a6a5e" font-size="26">`
       + `${esc(errMsg || '이미지 없음')}</text>`;
  }

  // ── 노이즈·스캔라인 (fx=0이면 생략 — 현대 고화질 캠코더) ──
  if (fx) {
    s += `<g filter="url(#nz${U})" opacity="0.55"><rect width="${W}" height="${H}" fill="none"/></g>`;
    s += `<g opacity="0.13">`;
    for (let y = 0; y < H; y += 8) s += `<rect x="0" y="${y}" width="${W}" height="2" fill="#000"/>`;
    s += `</g>`;
  }

  // ── 화면 찢김 (glitch, camc 이식) ──
  if (glitch) {
    s += `<rect x="0" y="300" width="${W}" height="26" fill="#ffffff" opacity="0.25">`
      +  `<animate attributeName="y" values="${H*0.13|0};${H*0.82|0};${H*0.35|0};${H*0.63|0};${H*0.13|0}"`
      +  ` keyTimes="0;0.3;0.55;0.8;1" dur="1.1s" repeatCount="indefinite" calcMode="discrete"/></rect>`
      +  `<rect width="${W}" height="${H}" fill="${warn}" opacity="0.06">`
      +  `<animate attributeName="opacity" values="0.06;0.16;0.06" dur="0.4s" repeatCount="indefinite"/></rect>`;
  }
  if (fx) s += `<rect width="${W}" height="${H}" fill="url(#vig${U})"/>`;

  // ── 코너 브래킷 (뷰파인더 프레임) ──
  {
    const m = 56, L = 60;
    s += `<g stroke="${ui}" stroke-width="4" fill="none" opacity="0.8" stroke-linecap="square">`
      + `<path d="M ${m} ${m+L} L ${m} ${m} L ${m+L} ${m}"/>`
      + `<path d="M ${W-m-L} ${m} L ${W-m} ${m} L ${W-m} ${m+L}"/>`
      + `<path d="M ${m} ${H-m-L} L ${m} ${H-m} L ${m+L} ${H-m}"/>`
      + `<path d="M ${W-m-L} ${H-m} L ${W-m} ${H-m} L ${W-m} ${H-m-L}"/></g>`;
  }

  // ── 중앙 포커스 브래킷 ──
  {
    const bw = W * 0.28, bh = H * 0.30, bx = (W - bw) / 2, by = (H - bh) / 2, L = 34;
    s += `<g stroke="${ui}" stroke-width="3" fill="none" opacity="0.75">`;
    for (const [x, y, dx, dy] of [[bx, by, 1, 1], [bx + bw, by, -1, 1], [bx, by + bh, 1, -1], [bx + bw, by + bh, -1, -1]])
      s += `<path d="M ${x} ${y + dy * L} L ${x} ${y} L ${x + dx * L} ${y}"/>`;
    s += `</g>`;
  }

  // ── 상단: REC/STBY + SCN + 타임코드 ──
  const PAD = 90;                 // 코너 브래킷 안쪽 공통 여백 (좌우 대칭 기준선)
  const topY = 96;                // 상단 행 baseline — 브래킷 세로 중앙과 일치
  if (isRec)
    s += `<circle cx="${PAD + 13}" cy="${topY - 10}" r="13" fill="${warn}">`
      +  `<animate attributeName="opacity" values="1;0.1;1" dur="1s" repeatCount="indefinite"/></circle>`
      +  `<text x="${PAD + 40}" y="${topY}" font-size="30" font-weight="700" fill="${ui}" letter-spacing="3"${SH}>REC</text>`;
  else
    s += `<text x="${PAD}" y="${topY}" font-size="30" font-weight="700" fill="${ui}" letter-spacing="3"${SH}>STBY</text>`;
  if (scn)
    s += `<text x="${W/2}" y="${topY - 2}" font-size="24" fill="${ui}" text-anchor="middle" opacity="0.85">SCN ${scn}</text>`;
  if (run) {
    // 내용물(TC 라벨 + 간격 + 숫자열)의 실측 폭을 먼저 구하고,
    // 알약을 그 폭 + 좌우 동일 패딩으로 만들어 완전 중앙 정렬한다.
    const fs2 = 28, W1 = fs2 * 0.62;
    const tkw = tickWidth(fs2);           // 숫자열 폭
    const tcW = 2 * W1;                   // 'TC' 라벨 폭 (모노스페이스 2글자)
    const gap = 14, inPad = 16;           // 라벨↔숫자 간격 / 알약 내부 좌우 패딩
    const content = tcW + gap + tkw;
    const pr = W - PAD, pl = pr - content - inPad * 2;   // 우단은 PAD 기준선 고정
    s += `<rect x="${pl.toFixed(1)}" y="${topY - 29}" width="${(content + inPad * 2).toFixed(1)}" height="40" rx="20" fill="#000" opacity="0.35"/>`
      +  `<text x="${(pl + inPad + tcW).toFixed(1)}" y="${topY - 1}" font-size="${fs2}" fill="${ui}" text-anchor="end">TC</text>`
      +  camTick(pl + inPad + tcW + gap + tkw / 2, topY - 1, fs2, camSecs(tcode), ui);
  } else {
    s += `<text x="${W - PAD}" y="${topY - 1}" font-size="28" fill="${ui}" text-anchor="end"${SH}>TC ${tcode}</text>`;
  }

  // ── 우상단 2행: 배율 / 신호 ──
  let ry = 158;
  if (zm) { s += `<text x="${W - PAD}" y="${ry}" font-size="24" fill="${ui}" text-anchor="end">x${zm}</text>`; ry += 46; }
  if (sigRaw !== '') {
    const sig = Math.max(0, Math.min(4, parseInt(sigRaw, 10) || 0));
    if (sig === 0) {
      s += `<text x="${W - PAD}" y="${ry}" font-size="22" fill="${warn}" text-anchor="end">NO LINK`
        +  `<animate attributeName="opacity" values="1;0.2;1" dur="0.6s" repeatCount="indefinite"/></text>`;
    } else {
      for (let i = 0; i < 4; i++) {
        const on = i < sig, bx2 = W - PAD - 70 + i * 20, bh2 = 12 + i * 7;
        s += `<rect x="${bx2}" y="${ry - bh2}" width="13" height="${bh2}" fill="${ui}" opacity="${on ? 0.95 : 0.25}"`;
        s += (on && i === sig - 1 && sig <= 1)
          ? `><animate attributeName="opacity" values="0.95;0.1;0.95" dur="0.5s" repeatCount="indefinite"/></rect>` : `/>`;
      }
      s += `<text x="${W - PAD - 82}" y="${ry - 2}" font-size="20" fill="${ui}" text-anchor="end" opacity="0.75">LINK</text>`;
    }
  }

  // ── 얼굴 감지 프레임 (공포 연출, camc 이식 — % 좌표로 환산) ──
  if (face > 0) {
    const spots = [[0.47, 0.42, 0.086, 0.14], [0.15, 0.53, 0.071, 0.12], [0.79, 0.29, 0.067, 0.114]];
    for (let i = 0; i < face; i++) {
      const [fx, fy, fw, fh] = spots[i];
      s += `<rect x="${(fx * W)|0}" y="${(fy * H)|0}" width="${(fw * W)|0}" height="${(fh * H)|0}"`
        +  ` fill="none" stroke="${warn}" stroke-width="3.6">`
        +  `<animate attributeName="opacity" values="1;0.35;1" dur="0.8s" repeatCount="indefinite"/></rect>`;
    }
    s += `<text x="${PAD}" y="176" font-size="26" font-weight="700" fill="${warn}">FACE ${face}`
      +  `<animate attributeName="opacity" values="1;0.4;1" dur="0.8s" repeatCount="indefinite"/></text>`;
  }

  // ── 좌하단: MODE / MEM / VU ──
  const modeTxt = tone === 'ir' ? 'IR MODE' : (tone === 'nv' ? 'NIGHT VISION' : 'AUTO');
  const botY = H - 78;            // 하단 행 baseline — 하단 브래킷 세로 중앙과 일치
  s += `<text x="${PAD}" y="${botY}" font-size="22" fill="${ui}" letter-spacing="4"${SH}>${modeTxt}</text>`;
  if (memRaw) {
    const full = memRaw.toUpperCase() === 'FULL' || parseInt(memRaw, 10) <= 5;
    s += `<text x="${PAD}" y="${botY - 46}" font-size="22" fill="${full ? warn : ui}">MEM ${esc(memRaw)}${/^\d+$/.test(memRaw) ? '%' : ''}`;
    s += full ? `<animate attributeName="opacity" values="1;0.2;1" dur="0.7s" repeatCount="indefinite"/></text>` : `</text>`;
  }
  if (vuRaw !== '') {
    const vu = Math.max(0, Math.min(10, parseInt(vuRaw, 10) || 0));
    for (let i = 0; i < 10; i++) {
      const lit = i < vu, c = i >= 8 ? warn : ui;
      s += `<rect x="${PAD + i * 18}" y="${botY - 108}" width="11" height="20" fill="${c}" opacity="${lit ? 0.9 : 0.2}"`;
      s += lit ? `><animate attributeName="opacity" values="0.9;${(0.35 + i * 0.05).toFixed(2)};0.9"`
               + ` dur="${(0.3 + i * 0.06).toFixed(2)}s" repeatCount="indefinite"/></rect>` : `/>`;
    }
    s += `<text x="${PAD + 10 * 18 + 12}" y="${botY - 91}" font-size="20" fill="${ui}" opacity="0.8">AUDIO</text>`;
  }

  // ── 우하단: BAT / 날짜 / AF 실패 / 자막 ──
  s += `<text x="${W - PAD}" y="${botY}" font-size="24" fill="${batWarn ? warn : ui}" text-anchor="end"${SH}>BAT ${bat}`;
  s += batWarn ? `<animate attributeName="opacity" values="1;0.2;1" dur="0.6s" repeatCount="indefinite"/></text>` : `</text>`;
  if (dateStamp)
    s += `<text x="${W - PAD}" y="${botY - 46}" font-size="21" fill="${ui}" text-anchor="end" opacity="0.8">${dateStamp}</text>`;
  if (afFail)
    s += `<text x="${W/2}" y="${botY - 46}" font-size="24" fill="${warn}" text-anchor="middle">AF ---`
      +  `<animate attributeName="opacity" values="1;0.15;1" dur="0.5s" repeatCount="indefinite"/></text>`;
  if (say) {
    // 밝은 이미지 위에서도 읽히도록 어두운 알약 스크림을 깐다
    const sw = 60 + say.length * 20;
    s += `<rect x="${W/2 - sw/2}" y="${H - 76}" width="${sw}" height="48" rx="24" fill="#000" opacity="0.45"/>`
      +  `<text x="${W/2}" y="${H - 43}" font-size="27" fill="${ui}" text-anchor="middle">${say}</text>`;
  }

  return s + `</svg>`;
}


// ══════════════════════════════════════════════════════════════
// 라우팅
// ══════════════════════════════════════════════════════════════
const RENDERERS = {
  'cam': renderCam,
  'rec': renderRec,
};

function indexPage() {
  const links = Object.keys(RENDERERS).map(k =>
    `<li><a href="/?t=${k}" style="color:#DDAACC">/?t=${k}</a></li>`).join('');
  return `<html><head><meta charset="UTF-8"></head>`
    + `<body style="font-family:sans-serif;padding:40px;background:#14121c;color:#e6e1ef">`
    + `<h1 style="color:#8888CC">겨울의 이미지 위젯 v1 (p)</h1>`
    + `<p>사용 가능한 타입 (${Object.keys(RENDERERS).length}종):</p><ul>${links}</ul>`
    + `<p style="color:#8f88a3;font-size:13px">이미지 출처: ${IMG_HOSTS.concat(IMG_SUFFIX.map(s => '*' + s)).join(' / ')}</p>`
    + `</body></html>`;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const params = url.searchParams;
    const t = (params.get('t') || '').trim();

    if (!t) {
      return new Response(indexPage(), {
        headers: { 'content-type': 'text/html;charset=UTF-8' },
      });
    }

    const renderer = RENDERERS[t];
    if (!renderer) {
      return new Response(
        '사용 가능: ' + Object.keys(RENDERERS).map(k => '?t=' + k).join(' / '),
        { status: 400, headers: { 'content-type': 'text/plain;charset=utf-8' } }
      );
    }

    const { uri, dim, err } = await loadImg(params.get('img'));
    const svg = renderer(params, uri, oriOf(dim), err ? ERR_MSG[err] : null);

    return new Response(svg, {
      headers: {
        'content-type': 'image/svg+xml; charset=utf-8',
        // 이미지 인라인이라 응답이 크다 → 텍스트 워커의 no-cache와 달리 장기 캐시
        'cache-control': err ? 'no-cache' : 'public, max-age=3600',
        'access-control-allow-origin': '*',
      },
    });
  }
};
