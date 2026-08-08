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
// 폰트 로더 — hand=1 일 때만 동작
//   바베챗이 SVG 내부의 외부 리소스를 전면 차단하므로, 이미지와 같은 방식으로
//   워커가 서버사이드 fetch → base64 인라인한다.
//   캡션에 한글이 있을 때만 pen(567KB)을 받고, 없으면 zen(27KB)만 받는다.
//   실패해도 null을 돌려 조용히 시스템 폰트로 폴백한다 (위젯은 안 깨진다).
// ══════════════════════════════════════════════════════════════
const FONT_URL = {
  pen: 'https://img.wintercards.com/font/pen.woff2',   // 나눔손글씨 펜 · 한글 11172 + 라틴
  zen: 'https://img.wintercards.com/font/zen.woff2',   // Zen Kurenaido · 가나 182 + 라틴
};
const FONT_MAX_BYTES = 2 * 1024 * 1024;
const FONT_TIMEOUT_MS = 6000;
const RE_KO = /[\uac00-\ud7a3\u1100-\u11ff\u3130-\u318f]/;

async function fetchFont(url) {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FONT_TIMEOUT_MS),
      cf: { cacheEverything: true, cacheTtl: 86400 },
    });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    if (buf.byteLength > FONT_MAX_BYTES) return null;
    return toBase64(new Uint8Array(buf));
  } catch { return null; }
}

// 반환값: <style>에 넣을 @font-face CSS 문자열 ('' 면 손글씨 없이 진행)
async function loadFonts(params, t) {
  if (t !== 'pol') return '';
  if ((params.get('hand') || '').trim() !== '1') return '';

  const txt = (params.get('say') || '') + (params.get('date') || '');
  const needKo = RE_KO.test(txt);

  const [zen, pen] = await Promise.all([
    fetchFont(FONT_URL.zen),
    needKo ? fetchFont(FONT_URL.pen) : Promise.resolve(null),
  ]);

  const ff = (n, b) => `@font-face{font-family:'${n}';font-style:normal;font-weight:400;`
    + `src:url(data:font/woff2;base64,${b}) format('woff2');}`;
  let css = '';
  if (pen) css += ff('WPen', pen);
  if (zen) css += ff('WZen', zen);
  return css;
}


// ══════════════════════════════════════════════════════════════
// ?t=pol — 폴라로이드
//   실물 폴라로이드 600 비율 근사(이미지 79mm · 좌우 4.75 · 상 4.5 · 하 26)
//   프레임 두께는 짧은 변 기준 → 가로 원본에서 하단 여백이 폭주하지 않는다.
//   여백 96px + 그림자 상시: 배경색과 무관하게 카드 경계가 생기고,
//   바베챗이 씌우는 border-radius에 모서리가 잘리지 않는다.
// ══════════════════════════════════════════════════════════════
const POL_PAD = 112;   // tapex 대각 테이프 끝(약 100px)까지 여유 있게 감싼다

const POL_TH = {
  white: { paper: '#f6f4ef', edge: '#ddd8cf', ink: '#3a3a44' },
  cream: { paper: '#efe6d4', edge: '#d9cdb4', ink: '#5a4c3c' },
  black: { paper: '#1c1a20', edge: '#0e0d12', ink: '#e8e4ee' },
};

function polTheme(params) {
  const f = (params.get('th') || '').split('\u00a7');
  const th = { ...(POL_TH[(f[0] || '').trim().toLowerCase()] || POL_TH.white) };
  th.acc = '#BB6688';
  if (f.length >= 2 && f[1]) {                       // 2번째 = 종이색
    const g = f[1].trim().toLowerCase();
    th.paper = camHex(g) || CAM_PRESETS[g] || th.paper;
  }
  if (f.length >= 3 && f[2]) {                       // 3번째 = 강조색(압정 등)
    const g = f[2].trim().toLowerCase();
    th.acc = camHex(g) || CAM_PRESETS[g] || th.acc;
  }
  return th;
}

function renderPol(params, dataURI, autoOri, errMsg, fontCss) {
  const U = camUid(params);
  const oRaw = (params.get('o') || '').trim().toLowerCase();
  const ori = CAM_IMG[oRaw] ? oRaw : (CAM_IMG[autoOri] ? autoOri : 'sq');
  const [IW, IH] = CAM_IMG[ori];

  // 프레임 두께 (짧은 변 기준 mm 환산)
  const k = Math.min(IW, IH) / 79;
  const bs = Math.round(4.75 * k), bt = Math.round(4.5 * k), bb = Math.round(26 * k);
  const PW = IW + bs * 2, PH = IH + bt + bb;
  const W = PW + POL_PAD * 2, H = PH + POL_PAD * 2;
  const px = POL_PAD, py = POL_PAD;               // 종이 좌상단
  const ix = px + bs, iy = py + bt;               // 사진 좌상단

  const th = polTheme(params);
  const run = (params.get('run') || '').trim() === '1';
  const say = esc((params.get('say') || '').trim()).slice(0, 40);
  const date = esc((params.get('date') || '').trim()).slice(0, 20);

  let tilt = parseFloat(params.get('tilt'));
  if (!(tilt >= -12 && tilt <= 12)) tilt = 0;

  const fx = (params.get('fx') || '').trim().toLowerCase();
  const hasFx = fx === 'vintage' || fx === 'fade';

  const decs = (params.get('dec') || '').split('|').map(s => s.trim().toLowerCase())
    .filter(d => ['tape', 'tapex', 'pin'].includes(d)).slice(0, 3);

  // 크롭 (cam/rec과 동일 규약)
  const cf = (params.get('cr') || 'c').split('\u00a7');
  const [par, ax, ay] = CAM_ANCHOR[(cf[0] || 'c').trim().toLowerCase()] || CAM_ANCHOR.c;
  let zoom = parseFloat(cf[1]);
  if (!(zoom >= 1 && zoom <= 4)) zoom = 1;

  const HAND = fontCss
    ? `'WPen','WZen',-apple-system,'Noto Sans KR',sans-serif`
    : `-apple-system,'Noto Sans KR',sans-serif`;

  let s = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"`
        + ` width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;

  s += `<defs>`;
  if (fontCss) s += `<style type="text/css"><![CDATA[${fontCss}]]></style>`;
  s += `<clipPath id="cv${U}"><rect x="${ix}" y="${iy}" width="${IW}" height="${IH}"/></clipPath>`
     + `<filter id="sh${U}" x="-30%" y="-30%" width="160%" height="160%">`
     + `<feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#000" flood-opacity="0.42"/>`
     + `<feDropShadow dx="0" dy="0" stdDeviation="1.5" flood-color="#fff" flood-opacity="0.30"/></filter>`;
  if (fx === 'vintage') {
    s += `<filter id="fx${U}"><feColorMatrix type="matrix" values="`
       + `0.92 0.10 0.02 0 0.04  0.05 0.86 0.06 0 0.03  0.03 0.08 0.74 0 0.05  0 0 0 1 0"/>`
       + `<feComponentTransfer><feFuncR type="gamma" amplitude="1" exponent="0.92" offset="0.02"/>`
       + `<feFuncB type="gamma" amplitude="1" exponent="1.08" offset="0"/></feComponentTransfer></filter>`;
  } else if (fx === 'fade') {
    s += `<filter id="fx${U}"><feColorMatrix type="saturate" values="0.55"/>`
       + `<feComponentTransfer><feFuncR type="linear" slope="0.88" intercept="0.10"/>`
       + `<feFuncG type="linear" slope="0.88" intercept="0.10"/>`
       + `<feFuncB type="linear" slope="0.88" intercept="0.12"/></feComponentTransfer></filter>`;
  }
  s += `</defs>`;

  s += `<g transform="rotate(${tilt} ${(W / 2).toFixed(1)} ${(H / 2).toFixed(1)})" filter="url(#sh${U})">`;

  // ── 인화지 ──
  s += `<rect x="${px}" y="${py}" width="${PW}" height="${PH}" rx="10" fill="${th.paper}"`
     + ` stroke="${th.edge}" stroke-width="2"/>`;
  s += `<rect x="${ix}" y="${iy}" width="${IW}" height="${IH}" fill="#141118"/>`;

  // ── 사진 ──
  if (dataURI) {
    const ox = ix + ax * IW, oy = iy + ay * IH;
    const tf = zoom > 1
      ? ` transform="translate(${ox.toFixed(1)},${oy.toFixed(1)}) scale(${zoom}) translate(${(-ox).toFixed(1)},${(-oy).toFixed(1)})"` : '';
    const ftr = hasFx ? ` filter="url(#fx${U})"` : '';
    const op = run
      ? `<animate attributeName="opacity" values="0.04;0.35;1" keyTimes="0;0.45;1" dur="9s" repeatCount="1" fill="freeze"/>`
      : '';
    s += `<g clip-path="url(#cv${U})"><g${tf}><image x="${ix}" y="${iy}" width="${IW}" height="${IH}"`
       + ` preserveAspectRatio="${par} slice"${ftr}${run ? ' opacity="0.04"' : ''}`
       + ` href="${dataURI}" xlink:href="${dataURI}">${op}</image></g></g>`;
    // 현상 중 유백막 (실물 미현상 필름의 뿌연 연녹빛)
    if (run) {
      s += `<rect x="${ix}" y="${iy}" width="${IW}" height="${IH}" fill="#dde0d2" opacity="0.95">`
         + `<animate attributeName="opacity" values="0.95;0.55;0" keyTimes="0;0.45;1" dur="9s" repeatCount="1" fill="freeze"/></rect>`
         + `<rect x="${ix}" y="${iy}" width="${IW}" height="${IH}" fill="#9fb08f" opacity="0.30">`
         + `<animate attributeName="opacity" values="0.30;0.16;0" keyTimes="0;0.45;1" dur="9s" repeatCount="1" fill="freeze"/></rect>`;
    }
  } else {
    s += `<rect x="${ix}" y="${iy}" width="${IW}" height="${IH}" fill="#1c1828"/>`
       + `<text x="${ix + IW / 2}" y="${iy + IH / 2}" text-anchor="middle" fill="#8f88a8"`
       + ` font-size="${Math.round(IW * 0.035)}" font-family="-apple-system,'Noto Sans KR',sans-serif">`
       + `${esc(errMsg || '이미지 없음')}</text>`;
  }

  // 사진 안쪽 음영 (필름 깊이감)
  s += `<rect x="${ix}" y="${iy}" width="${IW}" height="${IH}" fill="none"`
     + ` stroke="#000" stroke-opacity="0.35" stroke-width="3"/>`;

  // ── 캡션 / 날짜 ──
  if (say) {
    const cy = iy + IH + bb * 0.52;
    s += `<text x="${px + PW / 2}" y="${cy.toFixed(1)}" text-anchor="middle"`
       + ` font-size="${Math.round(bb * 0.30)}" fill="${th.ink}" font-family="${HAND}"`
       + ` transform="rotate(-1.2 ${px + PW / 2} ${cy.toFixed(1)})">${say}</text>`;
  }
  if (date) {
    s += `<text x="${px + PW - bs - 14}" y="${py + PH - 30}" text-anchor="end"`
       + ` font-size="${Math.round(bb * 0.16)}" fill="${th.ink}" opacity="0.55"`
       + ` font-family="${HAND}">${date}</text>`;
  }

  // ── 장식 ──
  const TP = '#e8dcc0', TPE = '#cfbf99';
  for (const d of decs) {
    if (d === 'tape') {
      for (const [cx, rot] of [[px + PW * 0.24, -6], [px + PW * 0.76, 5]]) {
        s += `<g transform="rotate(${rot} ${cx.toFixed(1)} ${py})" opacity="0.80">`
           + `<rect x="${(cx - 100).toFixed(1)}" y="${py - 30}" width="200" height="62" fill="${TP}" stroke="${TPE}" stroke-width="1.5"/>`
           + `<rect x="${(cx - 100).toFixed(1)}" y="${py - 30}" width="200" height="10" fill="#fff" opacity="0.35"/></g>`;
      }
    } else if (d === 'tapex') {
      for (const [cx, cy] of [[px, py], [px + PW, py + PH]]) {
        s += `<g transform="rotate(-45 ${cx} ${cy})" opacity="0.80">`
           + `<rect x="${cx - 110}" y="${cy - 31}" width="220" height="62" fill="${TP}" stroke="${TPE}" stroke-width="1.5"/>`
           + `<rect x="${cx - 110}" y="${cy - 31}" width="220" height="10" fill="#fff" opacity="0.35"/></g>`;
      }
    } else if (d === 'pin') {
      const cx = px + PW / 2, cy = py + bt * 0.30;
      s += `<g><ellipse cx="${(cx + 4).toFixed(1)}" cy="${(cy + 10).toFixed(1)}" rx="44" ry="17" fill="#000" opacity="0.28"/>`
         + `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="44" fill="${th.acc}"/>`
         + `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="44" fill="none" stroke="#000" stroke-opacity="0.35" stroke-width="3"/>`
         + `<circle cx="${(cx - 13).toFixed(1)}" cy="${(cy - 15).toFixed(1)}" r="13" fill="#fff" opacity="0.55"/>`
         + `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="10" fill="#000" opacity="0.30"/></g>`;
    }
  }

  return s + `</g></svg>`;
}

// ══════════════════════════════════════════════════════════════
// camClock — cctv 전용 24시간 벽시계 (rec의 camTick은 손대지 않는다)
//   camTick의 HH는 100시간 순환(경과시간용)이라 23:59:59→24:00:00이 된다.
//   여기서는 HH를 "00"~"23" 24개 글리프 한 덩어리로 돌려 86400s에 정확히 순환.
//   MM/SS 컬럼 규칙(6/10 분해)과 keyTimes 3점 형태는 camTick과 동일.
// ══════════════════════════════════════════════════════════════
const CLK_COLS = [
  { n: 24, unit: 3600, w: 2, pad: 2 },   // HH  (00~23)
  null,
  { n: 6, unit: 600, w: 1 }, { n: 10, unit: 60, w: 1 },   // MM
  null,
  { n: 6, unit: 10, w: 1 }, { n: 10, unit: 1, w: 1 },     // SS
];
const clockWidth = (fs) => fs * 0.62 * (2 + 1 + 1 + 1 + 1) + fs * 0.62 * 0.55 * 2;

function camClock(x0, cy, fs, offset, col, wt) {
  const W1 = fs * 0.62;
  const tr = (v) => (Math.floor(v * 1e7) / 1e7).toFixed(7);
  let x = x0, g = '';
  for (const c of CLK_COLS) {
    if (!c) {
      g += `<text x="${(x + W1 * 0.14).toFixed(1)}" y="${cy}" text-anchor="middle" font-size="${fs}"`
        +  ` font-family="ui-monospace,monospace" fill="${col}" font-weight="${wt}">:</text>`;
      x += W1 * 0.55; continue;
    }
    const { n, unit, w, pad } = c, dur = n * unit, cw = W1 * w;
    for (let i = 0; i < n; i++) {
      const a = tr(i / n), b2 = tr((i + 1) / n);
      const anim = i === 0     ? `values="1;0;0" keyTimes="0;${b2};1"`
                 : i === n - 1 ? `values="0;1;1" keyTimes="0;${a};1"`
                 :               `values="0;1;0;0" keyTimes="0;${a};${b2};1"`;
      const glyph = pad ? String(i).padStart(pad, '0') : String(i);
      g += `<text x="${(x + cw / 2).toFixed(1)}" y="${cy}" text-anchor="middle" opacity="0"`
        +  ` font-size="${fs}" font-family="ui-monospace,monospace" fill="${col}" font-weight="${wt}">${glyph}`
        +  `<animate attributeName="opacity" dur="${dur}s" repeatCount="indefinite" calcMode="discrete"`
        +  ` begin="${-offset}s" ${anim}/></text>`;
    }
    x += cw;
  }
  return g;
}

// ── 날짜 롤오버: YYYY-MM-DD / YYYY.MM.DD / YYYY/MM/DD 만 인식 ──
function nextDate(s) {
  const m = String(s).match(/^(\d{4})([-./])(\d{1,2})\2(\d{1,2})$/);
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[3] - 1, +m[4]));
  if (isNaN(d) || d.getUTCMonth() !== +m[3] - 1) return null;   // 2024-02-31 같은 값 거르기
  d.setUTCDate(d.getUTCDate() + 1);
  const p = (v) => String(v).padStart(2, '0');
  return `${d.getUTCFullYear()}${m[2]}${p(d.getUTCMonth() + 1)}${m[2]}${p(d.getUTCDate())}`;
}

const WD_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
function weekdayOf(str) {                       // 파싱 가능한 날짜만 요일 반환
  const m = String(str).match(/^(\d{4})([-./])(\d{1,2})\2(\d{1,2})$/);
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[3] - 1, +m[4]));
  if (isNaN(d) || d.getUTCMonth() !== +m[3] - 1) return null;
  return WD_EN[d.getUTCDay()];
}

const CCTV_CORNERS = ['tl', 'tr', 'bl', 'br'];

function renderCctv(params, dataURI, autoOri, errMsg) {
  const U = camUid(params);
  const oRaw = (params.get('o') || '').trim().toLowerCase();
  const ori = CAM_IMG[oRaw] ? oRaw : (CAM_IMG[autoOri] ? autoOri : 'sq');
  const [W, H] = CAM_IMG[ori];
  const K = Math.min(W, H) / 1024;                  // 캔버스 스케일 계수

  // ── 파라미터 ──
  const cf = (params.get('cr') || 'c').split('\u00a7');
  const [par, ax, ay] = CAM_ANCHOR[(cf[0] || 'c').trim().toLowerCase()] || CAM_ANCHOR.c;
  let zoom = parseFloat(cf[1]); if (!(zoom >= 1 && zoom <= 4)) zoom = 1;

  const chF = (params.get('ch') || 'CAM 01').split('\u00a7');
  const chName = esc((chF[0] || 'CAM 01').trim()).slice(0, 16);
  const chLoc = esc((chF[1] || '').trim()).slice(0, 20);

  const tsPos = CCTV_CORNERS.includes((params.get('ts') || '').trim().toLowerCase())
    ? params.get('ts').trim().toLowerCase() : 'tr';
  const cpPos = CCTV_CORNERS.includes((params.get('cp') || '').trim().toLowerCase())
    ? params.get('cp').trim().toLowerCase() : 'tl';

  const dateRaw = (params.get('date') || '').trim().slice(0, 24);
  const tcode = (params.get('tc') || '03:42:17').trim().slice(0, 8);
  const run = (params.get('run') || '') === '1';
  const dw = (params.get('dw') || '') === '1';
  const tone = (params.get('tone') || '').trim().toLowerCase();      // '' | bw | ir
  const isRec = (params.get('rec') || '1') !== '0';
  // mot — 두 가지 표기를 겸용한다.
  //   ① 개수 모드   mot=2                     → 프리셋 좌표 앞에서 2개
  //   ② 좌표 모드   mot=42§48§16§28|12§55§10§18  → x% y% w% h% (|로 여러 개)
  //   미지정/0/파싱실패 → 박스도 MOTION 라벨도 안 그린다.
  const MOT_PRESET = [[40, 44, 16, 28], [13, 55, 12, 20], [74, 33, 11, 19]];
  const motRaw = (params.get('mot') || '').trim();
  let motBoxes = [];
  if (motRaw.includes('\u00a7')) {
    for (const item of motRaw.split('|').slice(0, 4)) {
      const f = item.split('\u00a7').map(v => parseFloat(v));
      if (f.length < 4 || f.some(v => !isFinite(v))) continue;
      const [bx, by, bw, bh] = f;
      if (!(bw > 0 && bh > 0)) continue;
      motBoxes.push([
        Math.max(-20, Math.min(120, bx)), Math.max(-20, Math.min(120, by)),
        Math.min(140, bw), Math.min(140, bh),
      ]);
    }
  } else {
    const n = Math.max(0, Math.min(3, parseInt(motRaw, 10) || 0));
    motBoxes = MOT_PRESET.slice(0, n);
  }
  const mot = motBoxes.length;
  const lost = (params.get('lost') || '') === '1';
  const sp = esc((params.get('sp') || '').trim()).slice(0, 8);
  const hdd = esc((params.get('hdd') || '').trim()).slice(0, 18);
  const fx = (params.get('fx') || '1') !== '0';
  const say = esc((params.get('say') || '').trim()).slice(0, 40);
  const nos = esc((params.get('nos') || 'NO SIGNAL').trim()).slice(0, 16);

  const gf = (params.get('grid') || '').split('\u00a7');
  const gridOn = (gf[0] || '').trim() === '4';
  const liveCell = Math.max(1, Math.min(4, parseInt(gf[1], 10) || 1));
  const deadMode = ['nos', 'off', 'frz'].includes((params.get('dead') || '').trim().toLowerCase())
    ? params.get('dead').trim().toLowerCase() : 'nos';
  const chsList = (params.get('chs') || '').split('|').map(s => esc(s.trim())).filter(Boolean);

  // 테마: 3필드 위치규칙 (스타일은 cctv에선 미사용 자리 → 색만 받는다)
  const thF = (params.get('th') || '').split('\u00a7');
  const pick = (i, d) => {
    const g = (thF[i] || '').trim().toLowerCase();
    return g ? (camHex(g) || CAM_PRESETS[g] || d) : d;
  };
  const ui = pick(1, '#ffffff');            // OSD 글자색
  const acc = pick(2, '#3ECF7E');           // 모션 박스색
  const warn = '#ff3b30';

  let s = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"`
        + ` width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="ui-monospace,Menlo,monospace">`;
  const SH = ` style="paint-order:stroke" stroke="#000" stroke-opacity="0.7" stroke-width="${(3 * K).toFixed(1)}"`;

  // ── defs ──
  s += `<defs>`
    + `<filter id="nz${U}"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" result="n">`
    + `<animate attributeName="seed" values="1;9" dur="0.5s" repeatCount="indefinite" calcMode="discrete"/></feTurbulence>`
    + `<feColorMatrix in="n" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.09 0"/>`
    + `<feComposite operator="over" in2="SourceGraphic"/></filter>`
    + `<filter id="nzh${U}"><feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" result="n">`
    + `<animate attributeName="seed" values="1;7;3;9" dur="0.28s" repeatCount="indefinite" calcMode="discrete"/></feTurbulence>`
    + `<feColorMatrix in="n" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.55 0"/></filter>`
    + `<radialGradient id="vig${U}" cx="0.5" cy="0.5" r="0.78">`
    + `<stop offset="0.62" stop-color="#000" stop-opacity="0"/>`
    + `<stop offset="1" stop-color="#000" stop-opacity="${tone === 'ir' ? 0.72 : 0.5}"/></radialGradient>`;
  if (tone === 'bw')
    s += `<filter id="tn${U}"><feColorMatrix type="saturate" values="0"/></filter>`;
  else if (tone === 'ir') {
    // 실기기 IR 야간: 전체를 밝히는 게 아니라 대비를 벌린다.
    //   그림자는 완전히 뭉개져 검정으로, 조명 맞은 곳만 하얗게 날아가고 번진다.
    const TBL = '0 0.05 0.13 0.24 0.38 0.54 0.71 0.86 0.96 1';   // 완만한 S커브
    s += `<filter id="tn${U}" x="-10%" y="-10%" width="120%" height="120%">`
      +  `<feColorMatrix type="saturate" values="0" result="g"/>`
      +  `<feComponentTransfer in="g" result="cv">`
      +  `<feFuncR type="table" tableValues="${TBL}"/>`
      +  `<feFuncG type="table" tableValues="${TBL}"/>`
      +  `<feFuncB type="table" tableValues="${TBL}"/></feComponentTransfer>`
      // 밝은 부분만 뽑아 blur → screen 합성 = 조명 블룸
      +  `<feComponentTransfer in="cv" result="hi">`
      +  `<feFuncR type="linear" slope="2.6" intercept="-1.62"/>`
      +  `<feFuncG type="linear" slope="2.6" intercept="-1.62"/>`
      +  `<feFuncB type="linear" slope="2.6" intercept="-1.62"/></feComponentTransfer>`
      +  `<feGaussianBlur in="hi" stdDeviation="7" result="bl"/>`
      +  `<feBlend in="cv" in2="bl" mode="screen"/></filter>`;
  }
  s += `</defs>`;

  s += `<rect width="${W}" height="${H}" fill="#000"/>`;

  // ── 이미지 그리기 유틸 (칸/전체 공용) ──
  const tnAttr = (tone === 'bw' || tone === 'ir') ? ` filter="url(#tn${U})"` : '';
  const drawImg = (x, y, w, h, id, extraFilter) => {
    if (!dataURI) {
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#141416"/>`
        + `<text x="${x + w / 2}" y="${y + h / 2}" text-anchor="middle" fill="#5a5a62"`
        + ` font-size="${(24 * K).toFixed(0)}">${esc(errMsg || '이미지 없음')}</text>`;
    }
    const ox = x + ax * w, oy = y + ay * h;
    const tf = zoom > 1
      ? ` transform="translate(${ox.toFixed(1)},${oy.toFixed(1)}) scale(${zoom}) translate(${(-ox).toFixed(1)},${(-oy).toFixed(1)})"` : '';
    return `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath>`
      + `<g clip-path="url(#${id})"><g${tf}><image x="${x}" y="${y}" width="${w}" height="${h}"`
      + ` preserveAspectRatio="${par} slice"${extraFilter || tnAttr} href="${dataURI}" xlink:href="${dataURI}"/></g></g>`;
  };

  // ── 죽은 칸 ──
  const drawDead = (x, y, w, h, i) => {
    let g = '';
    if (deadMode === 'off') {
      g += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#070708"/>`;
    } else if (deadMode === 'frz' && dataURI) {
      g += drawImg(x, y, w, h, `dz${U}${i}`, ` filter="url(#tn${U})"`);
      g += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#000" opacity="0.55"/>`;
      g += `<text x="${x + w - 14 * K}" y="${y + 30 * K}" text-anchor="end" font-size="${(19 * K).toFixed(0)}"`
        +  ` fill="${ui}" opacity="0.8"${SH}>FRZ</text>`;
    } else {
      g += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#0d0d10"/>`
        +  `<g clip-path="url(#dc${U}${i})" opacity="0.5"><rect x="${x}" y="${y}" width="${w}" height="${h}"`
        +  ` fill="#888" filter="url(#nzh${U})"/></g>`
        +  `<clipPath id="dc${U}${i}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath>`
        +  `<text x="${x + w / 2}" y="${y + h / 2 + 8 * K}" text-anchor="middle" font-size="${(30 * K).toFixed(0)}"`
        +  ` fill="${ui}" opacity="0.72" letter-spacing="${(3 * K).toFixed(1)}"${SH}>${nos}`
        +  `<animate attributeName="opacity" values="0.72;0.28;0.72" dur="1.6s" repeatCount="indefinite"/></text>`;
    }
    return g;
  };

  // ── 화면 본체 ──
  const cw = W / 2, chh = H / 2;
  if (gridOn) {
    for (let i = 0; i < 4; i++) {
      const x = (i % 2) * cw, y = ((i / 2) | 0) * chh;
      s += (i + 1 === liveCell) ? drawImg(x, y, cw, chh, `lc${U}`) : drawDead(x, y, cw, chh, i);
    }
    // 칸 구분선
    s += `<g stroke="#000" stroke-width="${(4 * K).toFixed(1)}" opacity="0.9">`
      +  `<line x1="${cw}" y1="0" x2="${cw}" y2="${H}"/><line x1="0" y1="${chh}" x2="${W}" y2="${chh}"/></g>`;
  } else {
    s += drawImg(0, 0, W, H, `lc${U}`);
  }

  // ── 신호 두절 오버레이 ──
  if (lost) {
    s += `<rect width="${W}" height="${H}" fill="#000" opacity="0.7"/>`
      +  `<rect width="${W}" height="${H}" fill="#999" filter="url(#nzh${U})" opacity="0.75"/>`
      +  `<text x="${W / 2}" y="${H / 2}" text-anchor="middle" font-size="${(52 * K).toFixed(0)}" font-weight="700"`
      +  ` fill="${ui}" letter-spacing="${(6 * K).toFixed(1)}"${SH}>SIGNAL LOST`
      +  `<animate attributeName="opacity" values="1;0.25;1" dur="1.1s" repeatCount="indefinite"/></text>`;
  }

  // ── 화질 효과 (인터레이스 + 미세 노이즈 + 비네팅) ──
  if (fx) {
    s += `<g filter="url(#nz${U})" opacity="0.5"><rect width="${W}" height="${H}" fill="none"/></g>`;
    s += `<g opacity="${tone ? 0.05 : 0.09}">`;
    for (let y = 0; y < H; y += 4) s += `<rect x="0" y="${y}" width="${W}" height="1" fill="#000"/>`;
    s += `</g>`;
    s += `<rect width="${W}" height="${H}" fill="url(#vig${U})"/>`;
  }

  // ── 모션 감지 박스 (실기기 관례: 초록) ──
  if (mot > 0 && !lost) {
    for (const [bx, by, bw, bh] of motBoxes) {
      s += `<rect x="${(bx / 100 * W).toFixed(1)}" y="${(by / 100 * H).toFixed(1)}"`
        +  ` width="${(bw / 100 * W).toFixed(1)}" height="${(bh / 100 * H).toFixed(1)}"`
        +  ` fill="none" stroke="${acc}" stroke-width="${(3.4 * K).toFixed(1)}">`
        +  `<animate attributeName="opacity" values="1;0.35;1" dur="0.9s" repeatCount="indefinite"/></rect>`;
    }
  }

  // ══ OSD 스택 ══════════════════════════════════════════════════
  const PAD = 30 * K;
  const stack = { tl: 0, tr: 0, bl: 0, br: 0 };
  const put = (corner, hgt, fn) => {          // fn(x, y, anchor) — y는 baseline
    const top = corner[0] === 't';
    const rightSide = corner[1] === 'r';
    const x = rightSide ? W - PAD : PAD;
    const y = top ? PAD + stack[corner] + hgt : H - PAD - stack[corner];
    stack[corner] += hgt + 8 * K;
    return fn(x, y, rightSide ? 'end' : 'start');
  };

  // 타임스탬프
  {
    const fs = 34 * K, hgt = fs * 0.78;
    const dateNext = run && dateRaw ? nextDate(dateRaw) : null;
    const withWd = (v) => {
      if (!v) return v;
      const w = dw ? weekdayOf(v) : null;
      return w ? `${v} ${w}` : v;
    };
    const dispDate = withWd(dateRaw), dispNext = withWd(dateNext);
    const sec = camSecs(tcode) % 86400;
    s += put(tsPos, hgt, (x, y, anc) => {
      let g = '';
      if (run) {
        const clkW = clockWidth(fs);
        const dW = dispDate ? (dispDate.length * fs * 0.62 + fs * 0.5) : 0;
        const x0 = anc === 'end' ? x - clkW : x + dW;
        if (dateRaw) {
          const dx = anc === 'end' ? x - clkW - fs * 0.5 : x;
          const da = anc === 'end' ? 'end' : 'start';
          if (dateNext) {
            const k = ((86400 - sec) / 86400).toFixed(7);
            g += `<text x="${dx.toFixed(1)}" y="${y}" text-anchor="${da}" font-size="${fs}" fill="${ui}" font-weight="700"${SH}>${esc(dispDate)}`
              +  `<animate attributeName="opacity" dur="86400s" repeatCount="indefinite" calcMode="discrete"`
              +  ` values="1;0;0" keyTimes="0;${k};1"/></text>`
              +  `<text x="${dx.toFixed(1)}" y="${y}" text-anchor="${da}" font-size="${fs}" fill="${ui}" font-weight="700" opacity="0"${SH}>${esc(dispNext)}`
              +  `<animate attributeName="opacity" dur="86400s" repeatCount="indefinite" calcMode="discrete"`
              +  ` values="0;1;1" keyTimes="0;${k};1"/></text>`;
          } else {
            g += `<text x="${dx.toFixed(1)}" y="${y}" text-anchor="${da}" font-size="${fs}" fill="${ui}" font-weight="700"${SH}>${esc(dispDate)}</text>`;
          }
        }
        g += camClock(x0, y, fs, sec, ui, 700);
      } else {
        const txt = (dispDate ? esc(dispDate) + ' ' : '') + esc(tcode);
        g += `<text x="${x.toFixed(1)}" y="${y}" text-anchor="${anc}" font-size="${fs}" fill="${ui}" font-weight="700"${SH}>${txt}</text>`;
      }
      return g;
    });
  }

  // 채널명 (+ REC 점) — 그리드에서는 칸마다 그리므로 전역 표시는 생략
  if (!gridOn) {
    const fs = 32 * K, hgt = fs * 0.78;
    s += put(cpPos, hgt, (x, y, anc) => {
      let g = '';
      const r = 9 * K, gap = 15 * K;
      const tw = chName.length * fs * 0.62;
      if (isRec) {
        const cxd = anc === 'end' ? x - tw - gap - r : x + r;
        g += `<circle cx="${cxd.toFixed(1)}" cy="${(y - fs * 0.3).toFixed(1)}" r="${r.toFixed(1)}" fill="${warn}">`
          +  `<animate attributeName="opacity" values="1;0.15;1" dur="1s" repeatCount="indefinite"/></circle>`;
      }
      const tx = isRec && anc !== 'end' ? x + r * 2 + gap : x;
      g += `<text x="${tx.toFixed(1)}" y="${y}" text-anchor="${anc}" font-size="${fs}" fill="${ui}" font-weight="700"${SH}>${chName}</text>`;
      return g;
    });
    if (chLoc) {
      const fs2 = 24 * K;
      s += put(cpPos, fs2 * 0.78, (x, y, anc) =>
        `<text x="${x.toFixed(1)}" y="${y}" text-anchor="${anc}" font-size="${fs2}" fill="${ui}" opacity="0.85"${SH}>${chLoc}</text>`);
    }
  } else {
    // 칸별 라벨: 좌상단 채널명 · 라이브 칸 우상단 REC 점
    const fs = 22 * K;
    for (let i = 0; i < 4; i++) {
      const x = (i % 2) * cw, y = ((i / 2) | 0) * chh;
      const nm = chsList[i] || `CAM 0${i + 1}`;
      s += `<text x="${(x + 16 * K).toFixed(1)}" y="${(y + 34 * K).toFixed(1)}" font-size="${fs}" fill="${ui}"`
        +  ` font-weight="700" opacity="0.95"${SH}>${nm}</text>`;
      if (i + 1 === liveCell && isRec)
        s += `<circle cx="${(x + cw - 22 * K).toFixed(1)}" cy="${(y + 28 * K).toFixed(1)}" r="${(8 * K).toFixed(1)}" fill="${warn}">`
          +  `<animate attributeName="opacity" values="1;0.15;1" dur="1s" repeatCount="indefinite"/></circle>`;
    }
  }

  // 모션 라벨 · 재생속도 · HDD — 비어 있는 하단 코너부터 채운다
  const freeBottom = (pref) => (stack[pref] === 0 ? pref : (pref === 'bl' ? 'br' : 'bl'));
  if (mot > 0 && !lost) {
    const c = freeBottom('bl'), fs = 26 * K;
    s += put(c, fs * 0.78, (x, y, anc) =>
      `<text x="${x.toFixed(1)}" y="${y}" text-anchor="${anc}" font-size="${fs}" fill="${acc}" font-weight="700"`
      + ` letter-spacing="${(2 * K).toFixed(1)}"${SH}>MOTION`
      + `<animate attributeName="opacity" values="1;0.35;1" dur="0.9s" repeatCount="indefinite"/></text>`);
  }
  if (sp) {
    const c = freeBottom('bl'), fs = 24 * K;
    s += put(c, fs * 0.78, (x, y, anc) =>
      `<text x="${x.toFixed(1)}" y="${y}" text-anchor="${anc}" font-size="${fs}" fill="${ui}" opacity="0.9"${SH}>▶▶ ${sp}</text>`);
  }
  if (hdd) {
    const c = freeBottom('br'), fs = 22 * K;
    const bad = /FULL|OVERWRITE|ERROR/i.test(hdd);
    s += put(c, fs * 0.78, (x, y, anc) =>
      `<text x="${x.toFixed(1)}" y="${y}" text-anchor="${anc}" font-size="${fs}" fill="${bad ? warn : ui}" opacity="0.9"${SH}>HDD ${hdd}</text>`);
  }
  if (say) {
    const fs = 27 * K, sw = (60 + say.length * 20) * K;
    s += `<rect x="${(W / 2 - sw / 2).toFixed(1)}" y="${(H - 76 * K).toFixed(1)}" width="${sw.toFixed(1)}"`
      +  ` height="${(48 * K).toFixed(1)}" rx="${(24 * K).toFixed(1)}" fill="#000" opacity="0.45"/>`
      +  `<text x="${W / 2}" y="${(H - 43 * K).toFixed(1)}" font-size="${fs}" fill="${ui}" text-anchor="middle">${say}</text>`;
  }

  return s + `</svg>`;
}

function mixHex(hex, target, r) {
  const a = hex.replace('#', ''), b = target.replace('#', '');
  const p = (h, i) => parseInt(h.substr(i * 2, 2), 16);
  const o = (i) => Math.round(p(a, i) + (p(b, i) - p(a, i)) * r).toString(16).padStart(2, '0');
  return '#' + o(0) + o(1) + o(2);
}

function lumaOf(hex) {
  const h = hex.replace('#', '');
  const c = (i) => parseInt(h.substr(i * 2, 2), 16) / 255;
  const g = (v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * g(c(0)) + 0.7152 * g(c(1)) + 0.0722 * g(c(2));
}


// ══════════════════════════════════════════════════════════════
// 대사 줄바꿈 — 서버에서 폭을 추정해 감싼다.
//   한글·가나·한자는 1자 ≈ 1em, 라틴·숫자·기호는 ≈ 0.52em.
//   명시적 \n(%0A)은 강제 개행으로 먼저 쪼갠다.
// ══════════════════════════════════════════════════════════════
const RE_WIDE = /[\u1100-\u11ff\u3000-\u303f\u3040-\u30ff\u3130-\u318f\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7a3\uff00-\uff60]/;
const chW = (c) => (RE_WIDE.test(c) ? 1 : 0.52);
const lineW = (s) => { let w = 0; for (const c of s) w += chW(c); return w; };

function wrapText(text, maxEm, maxLines) {
  const out = [];
  for (const para of String(text).split('\n')) {
    if (para === '') { out.push(''); continue; }
    // 한국어는 어절(공백) 단위로 끊는 게 자연스럽다.
    // 공백이 없는 언어(일본어·중국어)는 통째로 한 덩어리가 되어
    // 아래 '어절이 한 줄보다 길 때' 경로에서 글자 단위로 떨어진다.
    let cur = '';
    for (const word of para.split(/(?<=\s)/)) {
      const w = word.replace(/\s+$/, '');
      if (cur === '') {
        cur = word;
      } else if (lineW(cur.replace(/\s+$/, '') + ' ' + w) <= maxEm) {
        cur += word;
      } else {
        out.push(cur.replace(/\s+$/, ''));
        if (out.length >= maxLines) return out.slice(0, maxLines);
        cur = word;
      }
      // 어절 하나가 한 줄보다 길면 그 안에서 글자 단위로 쪼갠다
      while (lineW(cur.replace(/\s+$/, '')) > maxEm) {
        let acc = '', rest = '';
        for (const ch of cur) {
          if (rest === '' && lineW(acc + ch) <= maxEm) acc += ch; else rest += ch;
        }
        if (acc === '') break;
        out.push(acc.replace(/\s+$/, ''));
        if (out.length >= maxLines) return out.slice(0, maxLines);
        cur = rest;
      }
    }
    if (cur.replace(/\s+$/, '') !== '') out.push(cur.replace(/\s+$/, ''));
    if (out.length >= maxLines) return out.slice(0, maxLines);
  }
  return out.slice(0, maxLines);
}

const FT_STACK = {
  serif: "'Noto Serif KR',AppleMyungjo,Batang,serif",
  sans:  "'Apple SD Gothic Neo','Malgun Gothic',sans-serif",
  hand:  "'WPen','WZen','Noto Serif KR',serif",
};

// ══════════════════════════════════════════════════════════════
// ?t=talk — 대사창 (sk=gal 미연시 / rm 쯔꾸르 / mod 모던)
// ══════════════════════════════════════════════════════════════
async function renderTalk(params, dataURI, autoOri, errMsg) {
  // 이 렌더러만 async다. 얼굴칩 이미지(fc=)와 손글씨 폰트를 여기서 직접 받아오므로
  // loadFonts()의 pol 전용 게이트를 건드리지 않는다.
  const U = camUid(params);
  const oRaw = (params.get('o') || '').trim().toLowerCase();
  const ori = CAM_IMG[oRaw] ? oRaw : (CAM_IMG[autoOri] ? autoOri : 'sq');
  const [W, IH] = CAM_IMG[ori];
  const K = Math.min(W, IH) / 1024;

  let sk = (params.get('sk') || 'gal').trim().toLowerCase();
  if (!['gal', 'rm', 'mod'].includes(sk)) sk = 'gal';

  let ft = (params.get('ft') || 'serif').trim().toLowerCase();
  if (!FT_STACK[ft]) ft = 'serif';
  const FF = FT_STACK[ft];

  const cf = (params.get('cr') || 'c').split('\u00a7');
  const [par, ax, ay] = CAM_ANCHOR[(cf[0] || 'c').trim().toLowerCase()] || CAM_ANCHOR.c;
  let zoom = parseFloat(cf[1]); if (!(zoom >= 1 && zoom <= 4)) zoom = 1;

  const nm = esc((params.get('nm') || '').trim()).slice(0, 20);
  const sayRaw = (params.get('say') || '').replace(/\r/g, '').slice(0, 400);
  const nx = (params.get('nx') || '1') !== '0';

  // 얼굴칩: face=0 기본, fc= 이미지를 주면 자동으로 켜진다
  const fcRaw = (params.get('fc') || '').trim();
  const faceParam = (params.get('face') || '').trim();
  const faceOn = faceParam === '1' || (faceParam !== '0' && !!fcRaw);
  const ff = (params.get('fcr') || 't').split('\u00a7');
  const [fpar, fax, fay] = CAM_ANCHOR[(ff[0] || 't').trim().toLowerCase()] || CAM_ANCHOR.t;
  let fzoom = parseFloat(ff[1]); if (!(fzoom >= 1 && fzoom <= 4)) fzoom = 1;
  let faceURI = null;
  if (faceOn && fcRaw) {
    const r = await loadImg(fcRaw);
    faceURI = r.uri;                       // 실패하면 조용히 본 이미지로 대체
  }
  const chipURI = faceURI || dataURI;

  const thF = (params.get('th') || '').split('\u00a7');
  const pickTh = (i, d) => {
    const g = (thF[i] || '').trim().toLowerCase();
    return g ? (camHex(g) || CAM_PRESETS[g] || d) : d;
  };

  // ── 스킨별 상수 ──
  const SK = {
    gal:  { boxFill: '#0b0a14', boxOp: 0.72, rx: 18 * K, pad: 40 * K, mgn: 26 * K,
            fs: 40 * K, lh: 1.62, nameFs: 30 * K, chip: 148 * K },
    rm:   { boxFill: '#0b1636', boxOp: 0.94, rx: 6 * K,  pad: 34 * K, mgn: 16 * K,
            fs: 39 * K, lh: 1.55, nameFs: 29 * K, chip: 152 * K },
    mod:  { boxFill: '#000000', boxOp: 0.55, rx: 0,      pad: 34 * K, mgn: 0,
            fs: 38 * K, lh: 1.58, nameFs: 25 * K, chip: 120 * K },
  }[sk];
  // th 규칙은 3스킨 공통 — 2번 자리 = 창 색, 3번 자리 = 강조색
  const acc = pickTh(2, sk === 'rm' ? '#CCAA88' : '#DDAACC');
  const boxBase = pickTh(1, sk === 'rm' ? '#1d3a7a' : sk === 'gal' ? '#0b0a14' : '#000000');
  // 창이 밝으면 본문 글자를 어둡게 뒤집는다
  const lightBox = lumaOf(boxBase) > 0.45;
  const ui = lightBox ? '#1a1420' : '#ffffff';
  if (lightBox) SK.boxOp = Math.max(SK.boxOp, 0.9);

  // ── 대사 배치 계산 ──
  const chipW = faceOn ? SK.chip : 0;
  const chipGap = faceOn ? 22 * K : 0;
  const innerW = W - SK.mgn * 2 - SK.pad * 2 - chipW - chipGap;
  const maxEm = Math.max(6, (innerW / SK.fs) * 0.94);   // 우측 6% 여백
  const HARD_MAX = 8;
  let lines = wrapText(sayRaw, maxEm, HARD_MAX);
  if (lines.length === 0) lines = [''];

  const lineH = SK.fs * SK.lh;
  const nameH = nm ? SK.nameFs * 1.5 : 0;
  let textH = lines.length * lineH;
  if (faceOn) textH = Math.max(textH, SK.chip);          // 얼굴칩보다 작아지지 않게
  let boxH = SK.pad * 2 + nameH + textH;

  // 얹기 기본. 박스가 화면의 45%를 넘으면 아래로 확장한다. ex=0/1로 강제.
  const exRaw = (params.get('ex') || '').trim();
  const RATIO = 0.45;
  const over = boxH + SK.mgn * 2 > IH * RATIO;
  const expand = exRaw === '1' ? true : exRaw === '0' ? false : over;
  const extra = expand ? Math.max(0, Math.ceil(boxH + SK.mgn * 2 - IH * RATIO)) : 0;
  const H = IH + extra;

  const boxX = SK.mgn, boxW = W - SK.mgn * 2;
  const boxY = H - SK.mgn - boxH;

  let fontCss = '';
  if (ft === 'hand') {
    const scan = (params.get('say') || '') + (params.get('nm') || '');
    const [zen, pen] = await Promise.all([
      fetchFont(FONT_URL.zen),
      RE_KO.test(scan) ? fetchFont(FONT_URL.pen) : Promise.resolve(null),
    ]);
    const ffc = (n, b) => `@font-face{font-family:'${n}';font-style:normal;font-weight:400;`
      + `src:url(data:font/woff2;base64,${b}) format('woff2');}`;
    if (pen) fontCss += ffc('WPen', pen);
    if (zen) fontCss += ffc('WZen', zen);
  }

  let s = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"`
        + ` width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  if (fontCss) s += `<style>${fontCss}</style>`;
  s += `<rect width="${W}" height="${H}" fill="#07060c"/>`;

  // ── 화면 이미지 ──
  if (dataURI) {
    const ox = ax * W, oy = ay * IH;
    const tf = zoom > 1
      ? ` transform="translate(${ox.toFixed(1)},${oy.toFixed(1)}) scale(${zoom}) translate(${(-ox).toFixed(1)},${(-oy).toFixed(1)})"` : '';
    s += `<clipPath id="mc${U}"><rect width="${W}" height="${IH}"/></clipPath>`
      +  `<g clip-path="url(#mc${U})"><g${tf}><image width="${W}" height="${IH}"`
      +  ` preserveAspectRatio="${par} slice" href="${dataURI}" xlink:href="${dataURI}"/></g></g>`;
  } else {
    s += `<rect width="${W}" height="${IH}" fill="#141220"/>`
      +  `<text x="${W / 2}" y="${IH / 2}" text-anchor="middle" fill="#5a5a72"`
      +  ` font-size="${(26 * K).toFixed(0)}" font-family="${FF}">${esc(errMsg || '이미지 없음')}</text>`;
  }
  // 확장분 배경 — 이미지 하단색이 이어지도록 어둡게
  if (extra > 0) s += `<rect y="${IH}" width="${W}" height="${extra}" fill="#0a0910"/>`;
  // 박스 뒤 그라디언트(글자 가독성)
  if (sk !== 'rm') {
    s += `<defs><linearGradient id="fg${U}" x1="0" y1="0" x2="0" y2="1">`
      +  `<stop offset="0" stop-color="#000" stop-opacity="0"/>`
      +  `<stop offset="1" stop-color="#000" stop-opacity="${lightBox ? 0.2 : 0.55}"/></linearGradient></defs>`
      +  `<rect x="0" y="${(boxY - 110 * K).toFixed(1)}" width="${W}" height="${(boxH + 110 * K + SK.mgn).toFixed(1)}" fill="url(#fg${U})"/>`;
  }

  // ── 대사 박스 ──
  if (sk === 'rm') {
    // 쯔꾸르: 파란 그라디언트 + 이중 테두리
    // 창 색은 기준색 하나에서 위(밝게)·아래(어둡게)를 만들어 낸다
    const top = mixHex(boxBase, '#ffffff', 0.06);
    const bot = mixHex(boxBase, '#000000', 0.62);
    s += `<defs><linearGradient id="bg${U}" x1="0" y1="0" x2="0" y2="1">`
      +  `<stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bot}"/></linearGradient></defs>`
      +  `<rect x="${boxX}" y="${boxY.toFixed(1)}" width="${boxW}" height="${boxH.toFixed(1)}" rx="${SK.rx}"`
      +  ` fill="url(#bg${U})" opacity="${SK.boxOp}"/>`
      +  `<rect x="${(boxX + 5 * K).toFixed(1)}" y="${(boxY + 5 * K).toFixed(1)}" width="${(boxW - 10 * K).toFixed(1)}"`
      +  ` height="${(boxH - 10 * K).toFixed(1)}" rx="${SK.rx}" fill="none" stroke="${acc}" stroke-width="${(3 * K).toFixed(1)}" opacity="0.9"/>`
      +  `<rect x="${(boxX + 12 * K).toFixed(1)}" y="${(boxY + 12 * K).toFixed(1)}" width="${(boxW - 24 * K).toFixed(1)}"`
      +  ` height="${(boxH - 24 * K).toFixed(1)}" rx="${SK.rx}" fill="none" stroke="#ffffff" stroke-width="${(1.5 * K).toFixed(1)}" opacity="0.32"/>`;
  } else if (sk === 'gal') {
    s += `<rect x="${boxX}" y="${boxY.toFixed(1)}" width="${boxW}" height="${boxH.toFixed(1)}" rx="${SK.rx}"`
      +  ` fill="${boxBase}" opacity="${SK.boxOp}"/>`
      +  `<rect x="${boxX}" y="${boxY.toFixed(1)}" width="${boxW}" height="${boxH.toFixed(1)}" rx="${SK.rx}"`
      +  ` fill="none" stroke="${acc}" stroke-width="${(2 * K).toFixed(1)}" opacity="0.5"/>`;
  } else {
    s += `<rect x="0" y="${boxY.toFixed(1)}" width="${W}" height="${(boxH + SK.mgn).toFixed(1)}"`
      +  ` fill="${boxBase}" opacity="${SK.boxOp}"/>`;
  }

  // ── 얼굴칩 ──
  const textX0 = boxX + SK.pad + chipW + chipGap;
  if (faceOn) {
    const cx0 = boxX + SK.pad, cy0 = boxY + SK.pad + (sk === 'mod' ? 0 : nameH * 0.15);
    const cs = SK.chip;
    if (chipURI) {
      const ox = cx0 + fax * cs, oy = cy0 + fay * cs;
      const tf = fzoom > 1
        ? ` transform="translate(${ox.toFixed(1)},${oy.toFixed(1)}) scale(${fzoom}) translate(${(-ox).toFixed(1)},${(-oy).toFixed(1)})"` : '';
      const rr = sk === 'mod' ? cs / 2 : 8 * K;
      s += `<clipPath id="fc${U}"><rect x="${cx0.toFixed(1)}" y="${cy0.toFixed(1)}" width="${cs.toFixed(1)}"`
        +  ` height="${cs.toFixed(1)}" rx="${rr.toFixed(1)}"/></clipPath>`
        +  `<g clip-path="url(#fc${U})"><g${tf}><image x="${cx0.toFixed(1)}" y="${cy0.toFixed(1)}"`
        +  ` width="${cs.toFixed(1)}" height="${cs.toFixed(1)}" preserveAspectRatio="${fpar} slice"`
        +  ` href="${chipURI}" xlink:href="${chipURI}"/></g></g>`
        +  `<rect x="${cx0.toFixed(1)}" y="${cy0.toFixed(1)}" width="${cs.toFixed(1)}" height="${cs.toFixed(1)}"`
        +  ` rx="${rr.toFixed(1)}" fill="none" stroke="${acc}" stroke-width="${(2.5 * K).toFixed(1)}" opacity="0.85"/>`;
    }
  }

  // ── 이름표 ──
  if (nm) {
    if (sk === 'gal') {
      // 박스 위에 걸치는 라벨
      const tw = lineW(nm) * SK.nameFs + 44 * K;
      const ly = boxY - SK.nameFs * 0.95;
      s += `<rect x="${(boxX + 26 * K).toFixed(1)}" y="${ly.toFixed(1)}" width="${tw.toFixed(1)}"`
        +  ` height="${(SK.nameFs * 1.9).toFixed(1)}" rx="${(SK.nameFs * 0.95).toFixed(1)}" fill="${acc}"/>`
        +  `<text x="${(boxX + 26 * K + tw / 2).toFixed(1)}" y="${(ly + SK.nameFs * 1.32).toFixed(1)}"`
        +  ` text-anchor="middle" font-family="${FF}" font-size="${SK.nameFs.toFixed(1)}" font-weight="700"`
        +  ` fill="${lumaOf(acc) > 0.45 ? '#1a1020' : '#ffffff'}">${nm}</text>`;
    } else if (sk === 'rm') {
      s += `<text x="${textX0.toFixed(1)}" y="${(boxY + SK.pad + SK.nameFs).toFixed(1)}" font-family="${FF}"`
        +  ` font-size="${SK.nameFs.toFixed(1)}" font-weight="700" fill="${acc}">${nm}</text>`;
    } else {
      s += `<text x="${textX0.toFixed(1)}" y="${(boxY + SK.pad + SK.nameFs).toFixed(1)}" font-family="${FF}"`
        +  ` font-size="${SK.nameFs.toFixed(1)}" fill="${acc}" letter-spacing="${(2 * K).toFixed(1)}">${nm}</text>`;
    }
  }

  // ── 대사 본문 ──
  let ty = boxY + SK.pad + nameH + SK.fs * 0.86;
  for (const ln of lines) {
    if (ln !== '') {
      s += `<text x="${textX0.toFixed(1)}" y="${ty.toFixed(1)}" font-family="${FF}" font-size="${SK.fs.toFixed(1)}"`
        +  ` fill="${ui}">${esc(ln)}</text>`;
    }
    ty += lineH;
  }

  // ── 계속 표시 ▼ ──
  if (nx) {
    const dx = boxX + boxW - SK.pad * 0.8, dy = boxY + boxH - SK.pad * 0.55;
    s += `<path d="M${(dx - 15 * K).toFixed(1)} ${(dy - 9 * K).toFixed(1)} L${dx.toFixed(1)} ${(dy + 6 * K).toFixed(1)}`
      +  ` L${(dx + 15 * K).toFixed(1)} ${(dy - 9 * K).toFixed(1)} Z" fill="${acc}">`
      +  `<animate attributeName="opacity" values="1;0.15;1" dur="1.3s" repeatCount="indefinite"/>`
      +  `<animateTransform attributeName="transform" type="translate" values="0 0;0 ${(7 * K).toFixed(1)};0 0"`
      +  ` dur="1.3s" repeatCount="indefinite"/></path>`;
  }

  return s + `</svg>`;
}

// ══════════════════════════════════════════════════════════════
// 라우팅
// ══════════════════════════════════════════════════════════════
const RENDERERS = {
  'cam': renderCam,
  'rec': renderRec,
  'pol': renderPol,
  'cctv': renderCctv,
  'talk': renderTalk,
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
    const fontCss = await loadFonts(params, t);
    const svg = await renderer(params, uri, oriOf(dim), err ? ERR_MSG[err] : null, fontCss);

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
