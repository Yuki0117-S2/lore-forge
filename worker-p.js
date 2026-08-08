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
  gal11: 'https://img.wintercards.com/font/gal11.woff2',     // 갈무리11 · 라틴+숫자 (2KB)
  gal11k: 'https://img.wintercards.com/font/gal11k.woff2',   // 갈무리11 · +KS X 1001 2350자 (42KB)
  gal14: 'https://img.wintercards.com/font/gal14.woff2',     // 갈무리14 · 라틴+숫자 (3KB)
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
  if (t === 'atk') {
    const nmTxt = (params.get('nm') || '') + (params.get('rk') || '');
    const [g14, g11] = await Promise.all([
      fetchFont(FONT_URL.gal14),
      fetchFont(RE_KO.test(nmTxt) ? FONT_URL.gal11k : FONT_URL.gal11),
    ]);
    const gf = (n, b) => `@font-face{font-family:'${n}';font-style:normal;font-weight:400;`
      + `src:url(data:font/woff2;base64,${b}) format('woff2');}`;
    let gcss = '';
    if (g14) gcss += gf('WGal14', g14);
    if (g11) gcss += gf('WGal11', g11);
    return gcss;
  }
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
// frame — 액자 (벽걸이 / 탁상 세움)
//   동기 렌더러. 부가 이미지·폰트 로드 없음 → 라우팅 상단 loadImg 결과를 그대로 받는다.
// ══════════════════════════════════════════════════════════════
const FR_TH = {
  wood:  { a: '#8a6a4a', b: '#6a4e34', hi: '#c9a982', lo: '#3d2b1c', lip: '#2a1d12', grain: 1 },
  gold:  { a: '#CCAA88', b: '#a8814f', hi: '#f4e0be', lo: '#6b4d28', lip: '#5c421f', bead: 1 },
  black: { a: '#2a2730', b: '#17151d', hi: '#4b4756', lo: '#0a090d', lip: '#000000' },
  white: { a: '#f4f1ec', b: '#ddd7cf', hi: '#ffffff', lo: '#b3aba1', lip: '#a49b90' },
  ornate:{ a: '#CCAA88', b: '#9c7745', hi: '#f7e6c6', lo: '#5f4321', lip: '#4e3718', bead: 1, orn: 1 },
};

const FR_WALL = {
  plain: { a: '#3a3441', b: '#241f2b' },
  paper: { a: '#e8e0d4', b: '#cdc2b2' },
  dark:  { a: '#1a1720', b: '#0c0a11' },
  rose:  { a: '#5a3a48', b: '#38222c' },
  brick: { a: '#7a4b52', b: '#4e2f36', brick: 1 },
};

// 상판(stand 전용) — 원목 고정
//   wallSh: 벽 하단 감광. 이게 없으면 어두운 벽에서 상판과 명도가 붙어 경계가 사라진다
const FR_DESK = { g: ['#8a6a4a', '#6a4e34', '#4a3524'], edge: '#d8c2a0', eo: 0.55, gloss: 0.06, refl: 0.06, wallSh: 0.30 };

function frTheme(params) {
  const f = (params.get('th') || '').split('\u00a7');
  const wk = (f[1] || '').trim().toLowerCase();
  const wall = { ...(FR_WALL[(params.get('wall') || 'plain').trim().toLowerCase()] || FR_WALL.plain) };
  if (wk) { const c = camHex(wk) || CAM_PRESETS[wk]; if (c) { wall.a = c; wall.b = c; } }
  let acc = '#CCAA88';
  const ak = (f[2] || '').trim().toLowerCase();
  if (ak) acc = camHex(ak) || CAM_PRESETS[ak] || acc;
  return { wall, acc };
}

function renderFrame(params, dataURI, autoOri, errMsg) {
  const U = camUid(params);
  const oRaw = (params.get('o') || '').trim().toLowerCase();
  const ori = CAM_IMG[oRaw] ? oRaw : (CAM_IMG[autoOri] ? autoOri : 'sq');
  const [IW, IH] = CAM_IMG[ori];
  const S = Math.min(IW, IH);

  const frKey = (params.get('fr') || 'wood').trim().toLowerCase();
  const F = FR_TH[frKey] || FR_TH.wood;
  const { wall, acc } = frTheme(params);

  // 매트지
  const mf = (params.get('mat') || '').split('\u00a7');
  let matR = mf[0] === undefined || mf[0].trim() === '' ? 0.075 : parseFloat(mf[0]);
  if (!(matR >= 0 && matR <= 0.2)) matR = 0.075;
  let matC = '#efe8dc';
  if (mf[1] && mf[1].trim()) {
    const g = mf[1].trim().toLowerCase();
    matC = camHex(g) || CAM_PRESETS[g] || matC;
  }
  const mw = Math.round(S * matR);

  const ti = esc((params.get('ti') || '').trim()).slice(0, 30);
  const by = esc((params.get('by') || '').trim()).slice(0, 24);
  const yr = esc((params.get('yr') || '').trim()).slice(0, 16);
  const plq = (params.get('plq') || '').trim() !== '0' && !!(ti || by || yr);

  const lit = (params.get('lit') || '').trim() === '1';
  const glass = (params.get('glass') || '').trim() === '1';
  const hang = (params.get('hang') || 'wire').trim().toLowerCase();
  const fx = (params.get('fx') || '').trim().toLowerCase();
  const hasFx = fx === 'vintage' || fx === 'fade';

  let tilt = parseFloat(params.get('tilt'));
  if (!(tilt >= -8 && tilt <= 8)) tilt = 0;

  const cf = (params.get('cr') || 'c').split('\u00a7');
  const [par, ax, ay] = CAM_ANCHOR[(cf[0] || 'c').trim().toLowerCase()] || CAM_ANCHOR.c;
  let zoom = parseFloat(cf[1]);
  if (!(zoom >= 1 && zoom <= 4)) zoom = 1;

  // ── 치수 ──
  const fw = Math.round(S * (F.orn ? 0.085 : 0.062));   // 프레임 두께
  const fb = plq ? Math.round(fw * 1.75) : fw;          // 명판 있으면 하단 굵게
  const lip = Math.max(4, Math.round(fw * 0.13));       // 안쪽 립
  const stand = hang === 'stand';
  const D = FR_DESK;
  const wp = Math.round(S * (hang === 'wire' ? 0.16 : 0.11));  // 좌우 여백
  const wpT = hang === 'wire' ? Math.round(S * 0.24) : (stand ? Math.round(S * 0.13) : wp);
  const wpB = stand ? Math.round(S * 0.20) : wp;

  const FX0 = wp, FY0 = wpT;
  const FW = IW + (mw + fw) * 2;
  const FH = IH + mw * 2 + fw + fb;
  const W = FW + wp * 2, H = FH + wpT + wpB;
  const deskY = FY0 + FH;
  const ix = FX0 + fw + mw, iy = FY0 + fw + mw;

  let s = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"`
        + ` width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;

  // ── defs ──
  s += `<defs>`;
  s += `<linearGradient id="wl${U}" x1="0" y1="0" x2="0" y2="1">`
     + `<stop offset="0" stop-color="${wall.a}"/><stop offset="1" stop-color="${wall.b}"/></linearGradient>`;
  if (wall.brick) {
    const bw = Math.round(S * 0.20), bh = Math.round(S * 0.075), mo = Math.max(3, Math.round(S * 0.007));
    s += `<pattern id="bk${U}" width="${bw}" height="${bh * 2}" patternUnits="userSpaceOnUse">`
       + `<rect width="${bw}" height="${bh * 2}" fill="#b6a494" opacity="0.55"/>`
       + `<rect x="0" y="0" width="${bw - mo}" height="${bh - mo}" rx="2" fill="#000" opacity="0.16"/>`
       + `<rect x="${-bw / 2}" y="${bh}" width="${bw - mo}" height="${bh - mo}" rx="2" fill="#000" opacity="0.16"/>`
       + `<rect x="${bw / 2}" y="${bh}" width="${bw - mo}" height="${bh - mo}" rx="2" fill="#000" opacity="0.16"/>`
       + `</pattern>`;
  }
  if (stand) {
    s += `<linearGradient id="dk${U}" x1="0" y1="0" x2="0" y2="1">`
       + `<stop offset="0" stop-color="${D.g[0]}"/><stop offset="0.5" stop-color="${D.g[1]}"/>`
       + `<stop offset="1" stop-color="${D.g[2]}"/></linearGradient>`
       + `<linearGradient id="ws${U}" x1="0" y1="0" x2="0" y2="1">`
       + `<stop offset="0" stop-color="#000" stop-opacity="0"/>`
       + `<stop offset="1" stop-color="#000" stop-opacity="${D.wallSh}"/></linearGradient>`
       + `<linearGradient id="ds${U}" x1="0" y1="0" x2="0" y2="1">`
       + `<stop offset="0" stop-color="#000000" stop-opacity="0.55"/>`
       + `<stop offset="1" stop-color="#000000" stop-opacity="0"/></linearGradient>`;
  }
  // 몰딩 4변 — 광원 좌상단
  const G = (id, x1, y1, x2, y2, c1, c2, c3) =>
    `<linearGradient id="${id}${U}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">`
    + `<stop offset="0" stop-color="${c1}"/><stop offset="0.45" stop-color="${c2}"/>`
    + `<stop offset="1" stop-color="${c3}"/></linearGradient>`;
  s += G('rT', 0, 0, 0, 1, F.hi, F.a, F.b);
  s += G('rB', 0, 0, 0, 1, F.b, F.lo, F.a);
  s += G('rL', 0, 0, 1, 0, F.hi, F.a, F.b);
  s += G('rR', 0, 0, 1, 0, F.b, F.lo, F.a);
  if (F.grain) {
    s += `<filter id="gr${U}" x="0" y="0" width="100%" height="100%">`
       + `<feTurbulence type="fractalNoise" baseFrequency="0.9 0.014" numOctaves="3" seed="7"/>`
       + `<feColorMatrix type="matrix" values="0 0 0 0 0.13 0 0 0 0 0.09 0 0 0 0 0.05 0 0 0 0.30 0"/>`
       + `</filter>`;
  }
  s += `<filter id="sh${U}" x="-25%" y="-25%" width="150%" height="150%">`
     + `<feDropShadow dx="0" dy="${Math.round(S * 0.018)}" stdDeviation="${Math.round(S * 0.020)}"`
     + ` flood-color="#000" flood-opacity="0.55"/></filter>`;
  if (lit) {
    s += `<radialGradient id="lt${U}" cx="0.5" cy="0.06" r="0.85">`
       + `<stop offset="0" stop-color="#fff6e2" stop-opacity="0.30"/>`
       + `<stop offset="0.45" stop-color="#fff6e2" stop-opacity="0.10"/>`
       + `<stop offset="1" stop-color="#000000" stop-opacity="0.42"/></radialGradient>`;
  }
  if (glass) {
    s += `<linearGradient id="gl${U}" x1="0" y1="0" x2="1" y2="1">`
       + `<stop offset="0" stop-color="#ffffff" stop-opacity="0.16"/>`
       + `<stop offset="0.30" stop-color="#ffffff" stop-opacity="0.05"/>`
       + `<stop offset="0.31" stop-color="#ffffff" stop-opacity="0.13"/>`
       + `<stop offset="0.44" stop-color="#ffffff" stop-opacity="0.02"/>`
       + `<stop offset="1" stop-color="#ffffff" stop-opacity="0.07"/></linearGradient>`;
  }
  if (hasFx) {
    if (fx === 'vintage') {
      s += `<filter id="fx${U}"><feColorMatrix type="matrix" values="`
         + `0.92 0.10 0.02 0 0.04  0.05 0.86 0.06 0 0.03  0.03 0.08 0.74 0 0.05  0 0 0 1 0"/></filter>`;
    } else {
      s += `<filter id="fx${U}"><feColorMatrix type="saturate" values="0.55"/></filter>`;
    }
  }
  s += `<clipPath id="cv${U}"><rect x="${ix}" y="${iy}" width="${IW}" height="${IH}"/></clipPath>`;
  s += `</defs>`;

  // ── 벽 ──
  s += `<rect width="${W}" height="${H}" fill="url(#wl${U})"/>`;
  if (wall.brick) s += `<rect width="${W}" height="${H}" fill="url(#bk${U})"/>`;

  // ── 탁상: 상판 + 접지 그림자 + 이젤 다리 ──
  if (stand) {
    const hl = Math.max(2, Math.round(S * 0.004));
    // 벽 아래쪽 감광 — 상판과의 경계를 명도차로 확실히 벌린다
    s += `<rect x="0" y="${(deskY - S * 0.16).toFixed(1)}" width="${W}" height="${(S * 0.16).toFixed(1)}" fill="url(#ws${U})"/>`
       + `<rect x="0" y="${deskY}" width="${W}" height="${H - deskY}" fill="url(#dk${U})"/>`
       + `<rect x="0" y="${deskY}" width="${W}" height="${hl}" fill="${D.edge}" opacity="${D.eo}"/>`;
    if (D.gloss) s += `<rect x="0" y="${deskY + hl}" width="${W}" height="${(S * 0.055).toFixed(1)}" fill="#ffffff" opacity="${D.gloss}"/>`;
    // 이젤 다리 (액자 뒤에서 우측으로 삐져나옴)
    const lgT = FX0 + FW * 0.86, lgB = FX0 + FW * 1.04;
    s += `<path d="M${lgT.toFixed(1)} ${(FY0 + FH * 0.32).toFixed(1)} L${(lgT + FW * 0.10).toFixed(1)} ${(FY0 + FH * 0.30).toFixed(1)}`
       + ` L${(lgB + FW * 0.09).toFixed(1)} ${deskY} L${lgB.toFixed(1)} ${deskY} Z"`
       + ` fill="${F.b}" opacity="0.92"/>`
       + `<path d="M${lgT.toFixed(1)} ${(FY0 + FH * 0.32).toFixed(1)} L${(lgT + FW * 0.04).toFixed(1)} ${(FY0 + FH * 0.315).toFixed(1)}`
       + ` L${(lgB + FW * 0.035).toFixed(1)} ${deskY} L${lgB.toFixed(1)} ${deskY} Z"`
       + ` fill="${F.hi}" opacity="0.25"/>`;
    // 접지 그림자
    s += `<ellipse cx="${(W / 2).toFixed(1)}" cy="${(deskY + S * 0.014).toFixed(1)}"`
       + ` rx="${(FW * 0.60).toFixed(1)}" ry="${(S * 0.050).toFixed(1)}" fill="#000" opacity="0.70"/>`
       + `<rect x="${FX0}" y="${deskY}" width="${FW}" height="${(S * 0.10).toFixed(1)}" fill="url(#ds${U})"/>`
       // 액자 하단 반사 (광택 상판)
       + (D.refl ? `<rect x="${FX0}" y="${deskY}" width="${FW}" height="${(S * 0.095).toFixed(1)}"`
       + ` fill="${F.a}" opacity="${D.refl}"/>` : '');
  }

  // ── 걸이 (액자 회전 밖) ──
  const cxW = W / 2;
  if (!stand && (hang === 'wire' || hang === 'nail')) {
    const ny = Math.round(wpT * 0.30);
    if (hang === 'wire') {
      const ax1 = FX0 + FW * 0.22, ax2 = FX0 + FW * 0.78;
      s += `<path d="M${ax1.toFixed(1)} ${FY0 + fw * 0.5} L${cxW.toFixed(1)} ${ny + 10} L${ax2.toFixed(1)} ${FY0 + fw * 0.5}"`
         + ` fill="none" stroke="#0d0b12" stroke-opacity="0.75" stroke-width="${Math.max(3, Math.round(S * 0.005))}"/>`;
    }
    s += `<circle cx="${cxW.toFixed(1)}" cy="${ny}" r="${Math.round(S * 0.013)}" fill="#6f6a78"/>`
       + `<circle cx="${(cxW - S * 0.004).toFixed(1)}" cy="${(ny - S * 0.004).toFixed(1)}" r="${Math.round(S * 0.005)}" fill="#cfcada" opacity="0.8"/>`;
  }

  // ── 액자 본체 ──
  s += `<g transform="rotate(${tilt} ${(W / 2).toFixed(1)} ${(H / 2).toFixed(1)})" filter="url(#sh${U})">`;

  // ── 프레임: 4변 마이터 조인 몰딩 ──
  const X1 = FX0, X2 = FX0 + FW, Y1 = FY0, Y2 = FY0 + FH;
  const iX1 = X1 + fw, iX2 = X2 - fw, iY1 = Y1 + fw, iY2 = Y2 - fb;
  const rail = (pts, g) => `<polygon points="${pts}" fill="url(#${g}${U})"/>`;
  s += rail(`${X1},${Y1} ${X2},${Y1} ${iX2},${iY1} ${iX1},${iY1}`, 'rT');   // 상
  s += rail(`${X1},${Y1} ${iX1},${iY1} ${iX1},${iY2} ${X1},${Y2}`, 'rL');   // 좌
  s += rail(`${X2},${Y1} ${X2},${Y2} ${iX2},${iY2} ${iX2},${iY1}`, 'rR');   // 우
  s += rail(`${X1},${Y2} ${iX1},${iY2} ${iX2},${iY2} ${X2},${Y2}`, 'rB');   // 하
  if (F.grain) {
    s += `<path d="M${X1} ${Y1} H${X2} V${Y2} H${X1} Z M${iX1} ${iY1} H${iX2} V${iY2} H${iX1} Z"`
       + ` fill-rule="evenodd" filter="url(#gr${U})" opacity="0.9"/>`;
  }
  // 마이터 이음선
  s += `<g stroke="#000" stroke-opacity="0.28" stroke-width="1.5">`
     + `<line x1="${X1}" y1="${Y1}" x2="${iX1}" y2="${iY1}"/>`
     + `<line x1="${X2}" y1="${Y1}" x2="${iX2}" y2="${iY1}"/>`
     + `<line x1="${X1}" y1="${Y2}" x2="${iX1}" y2="${iY2}"/>`
     + `<line x1="${X2}" y1="${Y2}" x2="${iX2}" y2="${iY2}"/></g>`;
  // 바깥 모서리
  s += `<rect x="${X1 + 0.5}" y="${Y1 + 0.5}" width="${FW - 1}" height="${FH - 1}" fill="none"`
     + ` stroke="${F.lo}" stroke-opacity="0.75" stroke-width="2"/>`;

  // 비드(금테 구슬선) — 몰딩 중앙을 따라 도는 볼록선
  if (F.bead) {
    const q = fw * 0.42;
    s += `<rect x="${(X1 + q).toFixed(1)}" y="${(Y1 + q).toFixed(1)}"`
       + ` width="${(FW - q * 2).toFixed(1)}" height="${(FH - q - fb * 0.42).toFixed(1)}"`
       + ` fill="none" stroke="${F.hi}" stroke-opacity="0.60" stroke-width="${Math.max(2, fw * 0.055).toFixed(1)}"/>`
       + `<rect x="${(X1 + q + fw * 0.07).toFixed(1)}" y="${(Y1 + q + fw * 0.07).toFixed(1)}"`
       + ` width="${(FW - q * 2 - fw * 0.14).toFixed(1)}" height="${(FH - q - fb * 0.42 - fw * 0.14).toFixed(1)}"`
       + ` fill="none" stroke="${F.lo}" stroke-opacity="0.45" stroke-width="${Math.max(1, fw * 0.03).toFixed(1)}"/>`;
  }
  // 코너 아라베스크
  if (F.orn) {
    const r = fw * 0.70;
    for (const [cx, cy, sx, sy] of [
      [X1 + fw * 0.52, Y1 + fw * 0.52, 1, 1],
      [X2 - fw * 0.52, Y1 + fw * 0.52, -1, 1],
      [X1 + fw * 0.52, Y2 - fb * 0.52, 1, -1],
      [X2 - fw * 0.52, Y2 - fb * 0.52, -1, -1],
    ]) {
      s += `<g transform="translate(${cx.toFixed(1)},${cy.toFixed(1)}) scale(${sx},${sy})">`
         + `<path d="M${(-r * 0.95).toFixed(1)} ${(r * 0.15).toFixed(1)} C${(-r * 0.55).toFixed(1)} ${(-r * 0.75).toFixed(1)} ${(r * 0.55).toFixed(1)} ${(-r * 0.75).toFixed(1)} ${(r * 0.95).toFixed(1)} ${(r * 0.15).toFixed(1)}"`
         + ` fill="none" stroke="${F.hi}" stroke-opacity="0.85" stroke-width="${Math.max(2, r * 0.13).toFixed(1)}" stroke-linecap="round"/>`
         + `<path d="M${(-r * 0.95).toFixed(1)} ${(r * 0.30).toFixed(1)} C${(-r * 0.55).toFixed(1)} ${(-r * 0.60).toFixed(1)} ${(r * 0.55).toFixed(1)} ${(-r * 0.60).toFixed(1)} ${(r * 0.95).toFixed(1)} ${(r * 0.30).toFixed(1)}"`
         + ` fill="none" stroke="${F.lo}" stroke-opacity="0.55" stroke-width="${Math.max(1, r * 0.06).toFixed(1)}"/>`
         + `<circle cx="0" cy="${(-r * 0.30).toFixed(1)}" r="${(r * 0.19).toFixed(1)}" fill="${F.hi}" opacity="0.9"/>`
         + `<circle cx="${(-r * 0.02).toFixed(1)}" cy="${(-r * 0.34).toFixed(1)}" r="${(r * 0.09).toFixed(1)}" fill="#fff" opacity="0.5"/>`
         + `</g>`;
    }
  }

  // 안쪽 립(경사면) — 프레임 → 매트로 떨어지는 단
  const lx = FX0 + fw - lip, ly = FY0 + fw - lip;
  const lw = IW + mw * 2 + lip * 2, lh = IH + mw * 2 + lip * 2;
  s += `<rect x="${lx}" y="${ly}" width="${lw}" height="${lh}" fill="${F.lip}"/>`;

  // ── 매트지 ──
  if (mw > 0) {
    s += `<rect x="${FX0 + fw}" y="${FY0 + fw}" width="${IW + mw * 2}" height="${IH + mw * 2}" fill="${matC}"/>`;
    // 매트 사면(bevel)
    s += `<path d="M${ix} ${iy} L${ix + IW} ${iy} L${ix + IW + 6} ${iy - 6} L${ix - 6} ${iy - 6} Z" fill="#000" opacity="0.20"/>`
       + `<path d="M${ix - 6} ${iy - 6} L${ix - 6} ${iy + IH + 6} L${ix} ${iy + IH} L${ix} ${iy} Z" fill="#000" opacity="0.13"/>`
       + `<path d="M${ix + IW} ${iy} L${ix + IW} ${iy + IH} L${ix + IW + 6} ${iy + IH + 6} L${ix + IW + 6} ${iy - 6} Z" fill="#fff" opacity="0.35"/>`
       + `<path d="M${ix} ${iy + IH} L${ix + IW} ${iy + IH} L${ix + IW + 6} ${iy + IH + 6} L${ix - 6} ${iy + IH + 6} Z" fill="#fff" opacity="0.28"/>`;
  }

  // ── 그림 ──
  s += `<rect x="${ix}" y="${iy}" width="${IW}" height="${IH}" fill="#141118"/>`;
  if (dataURI) {
    const ox = ix + ax * IW, oy = iy + ay * IH;
    const tf = zoom > 1
      ? ` transform="translate(${ox.toFixed(1)},${oy.toFixed(1)}) scale(${zoom}) translate(${(-ox).toFixed(1)},${(-oy).toFixed(1)})"` : '';
    const ftr = hasFx ? ` filter="url(#fx${U})"` : '';
    s += `<g clip-path="url(#cv${U})"><g${tf}><image x="${ix}" y="${iy}" width="${IW}" height="${IH}"`
       + ` preserveAspectRatio="${par} slice"${ftr} href="${dataURI}" xlink:href="${dataURI}"/></g></g>`;
  } else {
    s += `<rect x="${ix}" y="${iy}" width="${IW}" height="${IH}" fill="#1c1828"/>`
       + `<text x="${ix + IW / 2}" y="${iy + IH / 2}" text-anchor="middle" fill="#8f88a8"`
       + ` font-size="${Math.round(IW * 0.035)}" font-family="-apple-system,'Noto Sans KR',sans-serif">`
       + `${esc(errMsg || '이미지 없음')}</text>`;
  }
  // 그림 안쪽 음영
  s += `<rect x="${ix}" y="${iy}" width="${IW}" height="${IH}" fill="none" stroke="#000"`
     + ` stroke-opacity="0.35" stroke-width="3"/>`;

  // ── 유리 반사 ──
  if (glass) {
    s += `<rect x="${FX0 + fw}" y="${FY0 + fw}" width="${IW + mw * 2}" height="${IH + mw * 2}"`
       + ` fill="url(#gl${U})"/>`;
  }

  // ── 명판 ──
  if (plq) {
    const pw = Math.min(FW * 0.68, Math.round(S * 0.70));
    const ph = Math.round(fb * 0.64);
    const pxp = FX0 + (FW - pw) / 2, pyp = FY0 + FH - fb + (fb - ph) / 2;
    s += `<rect x="${pxp.toFixed(1)}" y="${pyp.toFixed(1)}" width="${pw.toFixed(1)}" height="${ph}" rx="3"`
       + ` fill="${acc}"/>`
       + `<rect x="${pxp.toFixed(1)}" y="${pyp.toFixed(1)}" width="${pw.toFixed(1)}" height="${(ph * 0.42).toFixed(1)}" rx="3"`
       + ` fill="#ffffff" opacity="0.22"/>`
       + `<rect x="${(pxp + 0.5).toFixed(1)}" y="${(pyp + 0.5).toFixed(1)}" width="${(pw - 1).toFixed(1)}" height="${ph - 1}" rx="3"`
       + ` fill="none" stroke="#000" stroke-opacity="0.35" stroke-width="1.5"/>`;
    const FN = `-apple-system,'Noto Serif KR',serif`;
    const cxp = pxp + pw / 2;
    if (ti && (by || yr)) {
      s += `<text x="${cxp.toFixed(1)}" y="${(pyp + ph * 0.46).toFixed(1)}" text-anchor="middle"`
         + ` font-size="${Math.round(ph * 0.40)}" fill="#241a10" font-family="${FN}" font-weight="700">${ti}</text>`
         + `<text x="${cxp.toFixed(1)}" y="${(pyp + ph * 0.84).toFixed(1)}" text-anchor="middle"`
         + ` font-size="${Math.round(ph * 0.29)}" fill="#241a10" opacity="0.75" font-family="${FN}">`
         + `${[by, yr].filter(Boolean).join(', ')}</text>`;
    } else {
      s += `<text x="${cxp.toFixed(1)}" y="${(pyp + ph * 0.66).toFixed(1)}" text-anchor="middle"`
         + ` font-size="${Math.round(ph * 0.46)}" fill="#241a10" font-family="${FN}" font-weight="700">`
         + `${ti || by || yr}</text>`;
    }
  }

  s += `</g>`;

  // ── 조명 ──
  if (lit) s += `<rect width="${W}" height="${H}" fill="url(#lt${U})"/>`;

  return s + `</svg>`;
}

// ══════════════════════════════════════════════════════════════
// scope — 조준경 / 쌍안경 / 문구멍 / 도트사이트
//
//  어안 왜곡: feImage 로 방사형 변위맵(PNG 상수)을 불러 feDisplacementMap 에 물린다.
//    SVG는 그라디언트로 방사 벡터장을 만들 수 없어 변위맵을 내장하는 수밖에 없다.
//    맵은 P=1.55 (rs = r^1.55) 로 구운 384px RGB. R=x변위 G=y변위, 128이 무변위.
//    scale = FISH_K * R_px * (fish/100)  → fish 로 강도만 조절, 맵은 하나만 쓴다.
//    변위맵은 fish>0 일 때만 인라인된다 (약 50KB).
// ══════════════════════════════════════════════════════════════
const FISH_K = 0.319886;                       // 2 * MAX(정규화 최대 변위)
const FISH_MAP = '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';

const SC_TH = {
  rifle: { ui: '#8ef0a8', body: '#05060a', ring: '#1a1d22', glass: 0.10 },
  peep:  { ui: '#e8dcc0', body: '#07060a', ring: '#8a6a3a', glass: 0.22 },
  holo:  { ui: '#ff5a5a', body: '#05060a', ring: '#1c1f26', glass: 0.08 },
};

function scTheme(params, sk) {
  const base = { ...(SC_TH[sk] || SC_TH.rifle) };
  const f = (params.get('th') || '').split('\u00a7');
  for (const [i, key] of [[1, 'body'], [2, 'ui']]) {
    const g = (f[i] || '').trim().toLowerCase();
    if (g) base[key] = camHex(g) || CAM_PRESETS[g] || base[key];
  }
  return base;
}

// ── 십자선 ────────────────────────────────────────────────────
function reticle(kind, cx, cy, R, col) {
  const T = R * 0.0075;                      // 가는 선
  const K = R * 0.026;                       // 굵은 기둥
  const L = (x1, y1, x2, y2, w, op = 0.95) =>
    `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"`
    + ` stroke="${col}" stroke-width="${w.toFixed(2)}" stroke-opacity="${op}"/>`;
  // 중앙 코너 브래킷 (레퍼런스 공통 요소)
  const bracket = (h) => {
    const b = R * h, t = R * 0.030, w = T * 1.6;
    let g = `<g stroke="${col}" stroke-width="${w.toFixed(2)}" fill="none" stroke-opacity="0.95">`;
    for (const [sx, sy] of [[-1,-1],[1,-1],[1,1],[-1,1]])
      g += `<path d="M${(cx+sx*b).toFixed(1)} ${(cy+sy*b-sy*t).toFixed(1)}`
         + ` V${(cy+sy*b).toFixed(1)} H${(cx+sx*b-sx*t).toFixed(1)}"/>`;
    return g + `</g>`;
  };
  // 눈금 — 축을 따라 촘촘한 해시마크
  const ticks = (n, gap, len) => {
    let g = `<g stroke="${col}" stroke-width="${T.toFixed(2)}" stroke-opacity="0.9">`;
    for (let i = 1; i <= n; i++) {
      const d = R * gap * i;
      if (d > R * 0.94) break;
      const big = i % 5 === 0, l = R * len * (big ? 2.0 : 1.0);
      g += `<line x1="${(cx-d).toFixed(1)}" y1="${(cy-l).toFixed(1)}" x2="${(cx-d).toFixed(1)}" y2="${(cy+l).toFixed(1)}"/>`
         + `<line x1="${(cx+d).toFixed(1)}" y1="${(cy-l).toFixed(1)}" x2="${(cx+d).toFixed(1)}" y2="${(cy+l).toFixed(1)}"/>`
         + `<line x1="${(cx-l).toFixed(1)}" y1="${(cy-d).toFixed(1)}" x2="${(cx+l).toFixed(1)}" y2="${(cy-d).toFixed(1)}"/>`
         + `<line x1="${(cx-l).toFixed(1)}" y1="${(cy+d).toFixed(1)}" x2="${(cx+l).toFixed(1)}" y2="${(cy+d).toFixed(1)}"/>`;
    }
    return g + `</g>`;
  };
  const cross = (w) => L(cx - R, cy, cx + R, cy, w) + L(cx, cy - R, cx, cy + R, w);
  const dot = (r) => `<circle cx="${cx}" cy="${cy}" r="${(R*r).toFixed(1)}" fill="${col}"/>`;

  if (kind === 'dot')     return cross(T) + dot(0.016);
  if (kind === 'circle')  return cross(T)
    + `<circle cx="${cx}" cy="${cy}" r="${(R*0.30).toFixed(1)}" fill="none" stroke="${col}"`
    + ` stroke-width="${(T*1.3).toFixed(2)}" stroke-opacity="0.9"/>` + dot(0.014);
  if (kind === 'duplex') {
    let g = '';
    for (const a of [-1, 1]) {
      g += L(cx + a*R, cy, cx + a*R*0.34, cy, K) + L(cx + a*R*0.34, cy, cx, cy, T)
         + L(cx, cy + a*R, cx, cy + a*R*0.34, K) + L(cx, cy + a*R*0.34, cx, cy, T);
    }
    return g;
  }
  if (kind === 'german') {
    return L(cx - R, cy, cx - R*0.12, cy, K) + L(cx + R, cy, cx + R*0.12, cy, K)
         + L(cx, cy + R, cx, cy + R*0.12, K) + L(cx, cy - R, cx, cy - R*0.015, T)
         + dot(0.012);
  }
  if (kind === 'mildot') {
    let g = cross(T);
    for (let i = 1; i <= 5; i++) {
      const d = R * 0.165 * i;
      if (d > R * 0.92) break;
      for (const [x, y] of [[cx-d,cy],[cx+d,cy],[cx,cy-d],[cx,cy+d]])
        g += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(R*0.014).toFixed(1)}" fill="${col}"/>`;
    }
    return g + bracket(0.085);
  }
  // tick (기본) — 레퍼런스의 가장 흔한 형태: 촘촘한 눈금 + 코너 브래킷 + 중심점
  return cross(T) + ticks(22, 0.042, 0.020) + bracket(0.075) + dot(0.011);
}

function renderScope(params, dataURI, autoOri, errMsg) {
  const U = camUid(params);
  const skRaw = (params.get('sk') || 'rifle').trim().toLowerCase();
  const sk = SC_TH[skRaw] ? skRaw : 'rifle';
  // 조준경은 원형 시야가 잘리면 안 되므로 캔버스를 정사각으로 고정한다 (o= 무시)
  const [W, H] = CAM_IMG.sq;
  const S = Math.min(W, H);
  const TH = scTheme(params, sk);

  const tone = (params.get('tone') || '').trim().toLowerCase();     // nv / ir / bw / ''
  const ret = (params.get('ret') || '').trim().toLowerCase() || (sk === 'holo' ? 'dot' : 'tick');
  const hasRet = ret !== '0' && sk !== 'peep';
  // rc= 레티클 색. 기본은 검정(실총) + 밝은 밑선. rc=ui 면 UI색 단색
  const rcRaw = (params.get('rc') || '').trim().toLowerCase();
  const rcHex = camHex(rcRaw) || CAM_PRESETS[rcRaw];
  const RC = rcHex ? { main: rcHex, under: '#000000' }
           : (rcRaw === 'ui' ? { main: TH.ui, under: '#000000' }
                             : { main: '#0a0d0c', under: '#ffffff' });

  const rng = esc((params.get('rng') || '').trim()).slice(0, 10);
  const wnd = esc((params.get('wnd') || '').trim()).slice(0, 10);
  const zm  = esc((params.get('zm')  || '').trim()).slice(0, 8);
  const ele = esc((params.get('ele') || '').trim()).slice(0, 8);
  const say = esc((params.get('say') || '').trim()).slice(0, 44);

  let lv = parseFloat(params.get('lv'));
  if (!(lv >= -20 && lv <= 20)) lv = 0;
  const hasLv = (params.get('lv') || '').trim() !== '';

  const br = (params.get('br') || '').trim() === '1';

  // 어안 강도 — peep은 기본 100, 나머지는 0
  let fish = parseInt(params.get('fish'), 10);
  if (!(fish >= 0 && fish <= 100)) fish = (sk === 'peep' ? 100 : 0);

  // 표적 락온 tgt=x§y§w§h (화면 비율 %)
  const tf = (params.get('tgt') || '').split('\u00a7').map(v => parseFloat(v));
  const hasTgt = tf.length >= 2 && tf.every(v => v >= 0 && v <= 100);
  const tgt = hasTgt ? {
    x: tf[0] / 100 * W, y: tf[1] / 100 * H,
    w: (tf[2] >= 1 ? tf[2] : 14) / 100 * W, h: (tf[3] >= 1 ? tf[3] : 20) / 100 * H,
  } : null;

  const cf = (params.get('cr') || 'c').split('\u00a7');
  const [par, ax, ay] = CAM_ANCHOR[(cf[0] || 'c').trim().toLowerCase()] || CAM_ANCHOR.c;
  let zoom = parseFloat(cf[1]);
  if (!(zoom >= 1 && zoom <= 4)) zoom = 1;

  // ── 시야 형상 ──
  const cx = W / 2, cy = H / 2;
  const R = sk === 'holo' ? S * 0.40 : S * 0.448;
  // fc=x§y — 어안 왜곡의 중심. 시야 지름 기준 % (기본 50§50 = 정중앙)
  const fcf = (params.get('fc') || '').split('\u00a7').map(v => parseFloat(v));
  const fcOk = fcf.length >= 2 && fcf.every(v => v >= 0 && v <= 100);
  const fcx = cx + (fcOk ? (fcf[0] - 50) / 100 * R * 2 : 0);
  const fcy = cy + (fcOk ? (fcf[1] - 50) / 100 * R * 2 : 0);

  let s = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"`
        + ` width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="ui-monospace,Menlo,monospace">`;

  s += `<defs>`;
  // 시야 클립
  s += `<clipPath id="vw${U}">`;
  if (sk === 'holo') {
    s += `<rect x="${(cx - R * 1.28).toFixed(1)}" y="${(cy - R * 0.90).toFixed(1)}"`
       + ` width="${(R * 2.56).toFixed(1)}" height="${(R * 1.80).toFixed(1)}" rx="${(R * 0.22).toFixed(1)}"/>`;
  } else {
    s += `<circle cx="${cx}" cy="${cy}" r="${R.toFixed(1)}"/>`;
  }
  s += `</clipPath>`;

  // 어안 변위 필터
  if (fish > 0) {
    const scale = (FISH_K * R * (fish / 100)).toFixed(2);
    // 변위맵 바깥은 채널값 0 → 최대 음수 변위로 화면이 찢어진다.
    // feFlood 로 중립(128,128) 바닥을 먼저 깔고 그 위에 맵을 얹어야 맵을 옮겨도 안전하다.
    s += `<filter id="fe${U}" x="0" y="0" width="100%" height="100%" primitiveUnits="userSpaceOnUse"`
       + ` color-interpolation-filters="sRGB">`
       + `<feFlood flood-color="rgb(128,128,0)" result="FLAT"/>`
       + `<feImage href="data:image/png;base64,${FISH_MAP}" xlink:href="data:image/png;base64,${FISH_MAP}"`
       + ` x="${(fcx - R).toFixed(1)}" y="${(fcy - R).toFixed(1)}" width="${(R * 2).toFixed(1)}" height="${(R * 2).toFixed(1)}"`
       + ` preserveAspectRatio="none" result="IMG"/>`
       + `<feComposite in="IMG" in2="FLAT" operator="over" result="MAP"/>`
       + `<feDisplacementMap in="SourceGraphic" in2="MAP" scale="${scale}"`
       + ` xChannelSelector="R" yChannelSelector="G"/></filter>`;
  }
  // 톤 (cctv와 동일 계수)
  if (tone === 'nv')
    s += `<filter id="tn${U}"><feColorMatrix type="matrix"`
       + ` values="0 0 0 0 0.10  0.55 0.65 0.30 0 0.06  0 0 0 0 0.14  0 0 0 1 0"/></filter>`;
  else if (tone === 'ir')
    s += `<filter id="tn${U}"><feColorMatrix type="saturate" values="0"/>`
       + `<feComponentTransfer><feFuncR type="linear" slope="1.05" intercept="0.06"/>`
       + `<feFuncG type="linear" slope="1.02" intercept="0.06"/>`
       + `<feFuncB type="linear" slope="0.96" intercept="0.08"/></feComponentTransfer></filter>`;
  else if (tone === 'bw')
    s += `<filter id="tn${U}"><feColorMatrix type="saturate" values="0"/></filter>`;

  // 비네팅 · 유리광
  s += `<radialGradient id="vg${U}" cx="0.5" cy="0.5" r="0.72">`
     + `<stop offset="${sk === 'peep' ? 0.30 : 0.55}" stop-color="#000" stop-opacity="0"/>`
     + `<stop offset="1" stop-color="#000" stop-opacity="${sk === 'peep' ? 0.88 : (sk === 'holo' ? 0.45 : 0.76)}"/></radialGradient>`
     + `<linearGradient id="gl${U}" x1="0" y1="0" x2="1" y2="1">`
     + `<stop offset="0" stop-color="#ffffff" stop-opacity="${(TH.glass * 1.9).toFixed(3)}"/>`
     + `<stop offset="0.30" stop-color="#ffffff" stop-opacity="${(TH.glass * 1.25).toFixed(3)}"/>`
     + `<stop offset="0.32" stop-color="#ffffff" stop-opacity="0.01"/>`
     + `<stop offset="1" stop-color="#ffffff" stop-opacity="0.02"/></linearGradient>`
     // 베젤 다층: 바깥 금속 → 안쪽 사면 → 접안 그림자
     + `<linearGradient id="bz${U}" x1="0.15" y1="0" x2="0.85" y2="1">`
     + `<stop offset="0" stop-color="#6b6f78"/><stop offset="0.22" stop-color="#2a2d34"/>`
     + `<stop offset="0.62" stop-color="#0d0f13"/><stop offset="1" stop-color="#33373f"/></linearGradient>`
     + `<linearGradient id="sb${U}" x1="0" y1="0" x2="0" y2="1">`
     + `<stop offset="0" stop-color="#000" stop-opacity="0"/>`
     + `<stop offset="0.45" stop-color="#000" stop-opacity="0.62"/>`
     + `<stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>`
     + `<radialGradient id="ib${U}" cx="0.5" cy="0.5" r="0.5">`
     + `<stop offset="0.88" stop-color="#000" stop-opacity="0"/>`
     + `<stop offset="1" stop-color="#000" stop-opacity="0.85"/></radialGradient>`;
  s += `</defs>`;

  // ── 경통 바깥 ──
  s += `<rect width="${W}" height="${H}" fill="${TH.body}"/>`;

  // ── 시야 ──
  const swing = br
    ? `<animateTransform attributeName="transform" type="translate" additive="sum"`
      + ` values="0,0; ${(S*0.011).toFixed(1)},${(-S*0.007).toFixed(1)}; ${(S*0.004).toFixed(1)},${(S*0.010).toFixed(1)};`
      + ` ${(-S*0.009).toFixed(1)},${(S*0.003).toFixed(1)}; 0,0"`
      + ` keyTimes="0;0.27;0.52;0.78;1" dur="6.5s" repeatCount="indefinite" calcMode="spline"`
      + ` keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1"/>`
    : '';

  s += `<g clip-path="url(#vw${U})">`;
  if (dataURI) {
    const ox = ax * W, oy = ay * H;
    const zt = zoom > 1
      ? ` transform="translate(${ox.toFixed(1)},${oy.toFixed(1)}) scale(${zoom}) translate(${(-ox).toFixed(1)},${(-oy).toFixed(1)})"` : '';
    const ftr = fish > 0 ? ` filter="url(#fe${U})"` : (tone ? ` filter="url(#tn${U})"` : '');
    // 어안 + 톤 둘 다면 바깥 g에 톤을 건다 (필터 체인 대신 중첩 — 지원 폭이 넓다)
    const outer = (fish > 0 && tone) ? ` filter="url(#tn${U})"` : '';
    s += `<g${outer}><g${zt}>${swing ? `<g>${swing}` : ''}`
       + `<image x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="${par} slice"${ftr}`
       + ` href="${dataURI}" xlink:href="${dataURI}"/>`
       + `${swing ? '</g>' : ''}</g></g>`;
  } else {
    s += `<rect width="${W}" height="${H}" fill="#12101a"/>`
       + `<text x="${cx}" y="${cy}" text-anchor="middle" fill="#8f88a8" font-size="${Math.round(S * 0.032)}"`
       + ` font-family="-apple-system,'Noto Sans KR',sans-serif">${esc(errMsg || '이미지 없음')}</text>`;
  }
  // 비네팅 + 유리광
  s += `<rect width="${W}" height="${H}" fill="url(#vg${U})"/>`
     + `<rect width="${W}" height="${H}" fill="url(#gl${U})"/>`;

  // 표적 락온
  if (tgt) {
    const tx = tgt.x - tgt.w / 2, ty = tgt.y - tgt.h / 2, c8 = Math.min(tgt.w, tgt.h) * 0.26;
    s += `<g stroke="${TH.ui}" stroke-width="${(S * 0.0045).toFixed(1)}" fill="none" stroke-opacity="0.95">`
       + `<path d="M${tx} ${ty + c8} V${ty} H${tx + c8}"/>`
       + `<path d="M${tx + tgt.w - c8} ${ty} H${tx + tgt.w} V${ty + c8}"/>`
       + `<path d="M${tx + tgt.w} ${ty + tgt.h - c8} V${ty + tgt.h} H${tx + tgt.w - c8}"/>`
       + `<path d="M${tx + c8} ${ty + tgt.h} H${tx} V${ty + tgt.h - c8}"/></g>`;
  }

  // 십자선
  if (hasRet) {
    if (sk === 'holo') {
      s += `<circle cx="${cx}" cy="${cy}" r="${(R * 0.42).toFixed(1)}" fill="none" stroke="${TH.ui}"`
         + ` stroke-width="${(R * 0.012).toFixed(2)}" stroke-opacity="0.85"/>`
         + `<circle cx="${cx}" cy="${cy}" r="${(R * 0.030).toFixed(1)}" fill="${TH.ui}">`
         + `<animate attributeName="fill-opacity" values="1;0.72;1" dur="2.4s" repeatCount="indefinite"/></circle>`;
    } else {
      // 실총 레티클은 검정이다. 어두운 배경에서 사라지지 않게 밝은 밑선을 먼저 깔고 검정을 덮는다
      s += `<g opacity="0.42" transform="translate(${(S*0.0022).toFixed(1)},${(S*0.0022).toFixed(1)})">`
         + reticle(ret, cx, cy, R, RC.under) + `</g>`
         + reticle(ret, cx, cy, R, RC.main);
    }
  }
  s += `</g>`;

  // ── 경통 링 ──
  const rw = S * (sk === 'peep' ? 0.030 : 0.020);
  if (sk === 'holo') {
    s += `<rect x="${(cx - R * 1.28 + rw / 2).toFixed(1)}" y="${(cy - R * 0.90 + rw / 2).toFixed(1)}"`
       + ` width="${(R * 2.56 - rw).toFixed(1)}" height="${(R * 1.80 - rw).toFixed(1)}" rx="${(R * 0.20).toFixed(1)}"`
       + ` fill="none" stroke="${TH.ring}" stroke-width="${rw.toFixed(1)}"/>`;
  } else if (sk === 'rifle') {
    // 레퍼런스식 다층 베젤: 접안 그림자 → 금속 몸체 → 바깥 하이라이트 → 안쪽 사면
    s += `<circle cx="${cx}" cy="${cy}" r="${(R - rw * 0.15).toFixed(1)}" fill="url(#ib${U})"/>`
       + `<circle cx="${cx}" cy="${cy}" r="${(R + rw * 1.15).toFixed(1)}" fill="none"`
       + ` stroke="url(#bz${U})" stroke-width="${(rw * 2.5).toFixed(1)}"/>`
       + `<circle cx="${cx}" cy="${cy}" r="${(R + rw * 2.40).toFixed(1)}" fill="none"`
       + ` stroke="#5d626c" stroke-width="${(rw * 0.35).toFixed(1)}" stroke-opacity="0.85"/>`
       + `<circle cx="${cx}" cy="${cy}" r="${(R + rw * 0.05).toFixed(1)}" fill="none"`
       + ` stroke="#000" stroke-width="${(rw * 0.55).toFixed(1)}" stroke-opacity="0.9"/>`
       + `<circle cx="${cx}" cy="${cy}" r="${(R + rw * 0.55).toFixed(1)}" fill="none"`
       + ` stroke="#8e939d" stroke-width="${(rw * 0.20).toFixed(1)}" stroke-opacity="0.45"/>`;
  } else {
    s += `<circle cx="${cx}" cy="${cy}" r="${(R - rw / 2).toFixed(1)}" fill="none"`
       + ` stroke="${TH.ring}" stroke-width="${rw.toFixed(1)}"/>`;
    if (sk === 'peep') {                       // 황동 문구멍 링 (안쪽 사면 + 바깥 테)
      s += `<circle cx="${cx}" cy="${cy}" r="${(R + rw * 0.55).toFixed(1)}" fill="none"`
         + ` stroke="#5b4322" stroke-width="${(rw * 0.5).toFixed(1)}"/>`
         + `<circle cx="${cx}" cy="${cy}" r="${(R - rw * 0.10).toFixed(1)}" fill="none"`
         + ` stroke="#e0c48a" stroke-width="${(rw * 0.22).toFixed(1)}" stroke-opacity="0.55"/>`;
    }
  }

  // ── OSD ──
  const FS = Math.round(S * 0.030), pad = Math.round(S * 0.045);
  const T = (x, y, t, an, op = 1, fs = FS) =>
    `<text x="${x}" y="${y}" text-anchor="${an}" font-size="${fs}" fill="${TH.ui}"`
    + ` fill-opacity="${op}" style="paint-order:stroke" stroke="#000" stroke-opacity="0.6"`
    + ` stroke-width="${Math.round(FS * 0.14)}">${t}</text>`;

  if (sk !== 'peep') {
    if (rng) s += T(pad, pad + FS, `RNG ${rng}`, 'start');
    if (wnd) s += T(pad, pad + FS * 2.4, `WIND ${wnd}`, 'start');
    if (zm)  s += T(W - pad, pad + FS, `${zm}`, 'end');
    if (ele) s += T(W - pad, pad + FS * 2.4, `ELEV ${ele}`, 'end');
  }
  if (say) {
    if (sk === 'peep') {
      // peep은 시야가 캔버스를 꽉 채워 바깥 여백이 거의 없다 → 자막을 원 안쪽 하단에 어두운 띠와 함께 깐다
      const sy = cy + R * 0.80;
      s += `<g clip-path="url(#vw${U})">`
         + `<rect x="0" y="${(sy - S * 0.055).toFixed(1)}" width="${W}" height="${(S * 0.105).toFixed(1)}"`
         + ` fill="url(#sb${U})"/></g>`
         + T(cx, sy + S * 0.012, say, 'middle', 0.98, Math.round(S * 0.036));
    } else {
      s += T(cx, H - pad, say, 'middle', 0.95, Math.round(S * 0.034));
    }
  }

  // 수평계 (캔트)
  if (hasLv && sk !== 'peep') {
    const bw = S * 0.30, by = H - pad - FS * (say ? 4.0 : 2.0), bx = cx - bw / 2;
    s += `<g><line x1="${bx.toFixed(1)}" y1="${by.toFixed(1)}" x2="${(bx + bw).toFixed(1)}" y2="${by.toFixed(1)}"`
       + ` stroke="${TH.ui}" stroke-opacity="0.35" stroke-width="${(S * 0.004).toFixed(1)}"/>`
       + `<g transform="rotate(${lv} ${cx.toFixed(1)} ${by.toFixed(1)})">`
       + `<line x1="${(cx - bw * 0.42).toFixed(1)}" y1="${by.toFixed(1)}" x2="${(cx + bw * 0.42).toFixed(1)}" y2="${by.toFixed(1)}"`
       + ` stroke="${TH.ui}" stroke-width="${(S * 0.006).toFixed(1)}" stroke-opacity="0.9"/></g>`
       + T(bx + bw + FS * 0.5, by + FS * 0.28, `${lv > 0 ? '+' : ''}${lv}\u00b0`, 'start', 0.8, Math.round(FS * 0.78))
       + `</g>`;
  }

  return s + `</svg>`;
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
// ?t=char — 초상 상태창 (신규 프로토타입)
// ══════════════════════════════════════════════════════════════
const CH_W = 1216;

// 게이지 라벨 → 색 자동 판별
const GA_RULES = [
  [/^(hp|체력|생명|life|건강)$/i, '#EE1166'],
  [/^(mp|마나|mana|sp|정신|기력)$/i, '#00BBDD'],
  [/^(st|스태미나|stamina|피로|기운)$/i, '#FF7722'],
  [/^(exp|경험치|숙련|레벨)$/i, '#CCAA88'],
  [/^(호감|애정|신뢰|affection|love)$/i, '#FF6699'],
  [/^(광기|오염|타락|공포|스트레스)$/i, '#884499'],
  [/^(궁극기|필살기|각성|오의|ult|ultimate|burst)$/i, '#0077DD'],
];
const gaugeCol = (label, acc) => {
  for (const [re, c] of GA_RULES) if (re.test(label.trim())) return c;
  return acc;
};

// "80/100" → {cur,max} / 아니면 null
function parseGauge(v) {
  const m = String(v).match(/^\s*(-?[\d.]+)\s*\/\s*([\d.]+)\s*$/);
  if (!m) return null;
  const cur = parseFloat(m[1]), max = parseFloat(m[2]);
  if (!(max > 0)) return null;
  return { cur, max, r: Math.max(0, Math.min(1, cur / max)) };
}

// 인물 단위 파싱: '||' 인물 · '|' 항목 · '§' 라벨/값
const perPerson = (raw, n) => {
  const src = String(raw || '').split('||');
  const out = [];
  for (let i = 0; i < n; i++) out.push((src[i] || '').trim());
  return out;
};
const listOf = (s) => String(s || '').split('|').map(x => x.trim()).filter(Boolean);

async function renderChar(params) {
  const U = camUid(params);

  let sk = (params.get('sk') || 'gal').trim().toLowerCase();
  if (!['gal', 'rm', 'mod'].includes(sk)) sk = 'gal';
  let ft = (params.get('ft') || 'serif').trim().toLowerCase();
  if (!FT_STACK[ft]) ft = 'serif';
  const FF = FT_STACK[ft];

  // ── 인물 목록 ──
  const imgRaw = String(params.get('img') || '').split('|').map(s => s.trim());
  const nms  = String(params.get('nm') || '').split('|').map(s => s.trim());
  const sbs  = String(params.get('sb') || '').split('|').map(s => s.trim());
  const crs  = String(params.get('cr') || '').split('|').map(s => s.trim());
  let n = Math.max(1, Math.min(4,
    Math.max(imgRaw.filter(Boolean).length, nms.filter(Boolean).length, 1)));

  // 인물별 이미지를 렌더러 안에서 직접 병렬 로드한다.
  // (라우팅의 상단 단일 loadImg는 char일 때 건너뛴다 — img=가 '|' 목록이므로)
  const imgs = (await Promise.all(
    imgRaw.slice(0, n).map(u => u ? loadImg(u) : Promise.resolve({ uri: null }))
  )).map(r => r.uri);
  const stB  = perPerson(params.get('st'), n);
  const tagB = perPerson(params.get('tag'), n);
  const koSet = new Set(listOf(params.get('ko')).map(x => parseInt(x, 10)));

  // ── 테마 ──
  const thF = (params.get('th') || '').split('\u00a7');
  const pickTh = (i, d) => {
    const g = (thF[i] || '').trim().toLowerCase();
    return g ? (camHex(g) || CAM_PRESETS[g] || d) : d;
  };
  const acc = pickTh(2, sk === 'rm' ? '#CCAA88' : '#DDAACC');
  const base = pickTh(1, sk === 'rm' ? '#1d3a7a' : sk === 'gal' ? '#0b0a14' : '#12111a');
  const light = lumaOf(base) > 0.45;
  const ui   = light ? '#1a1420' : '#ffffff';
  const dim  = light ? '#5d5468' : '#9b95ad';
  const page = light ? mixHex(base, '#ffffff', 0.55) : mixHex(base, '#000000', 0.55);
  const rx   = sk === 'rm' ? 6 : sk === 'mod' ? 22 : 16;

  const P = 40, GAP = 26;
  const ti = esc((params.get('ti') || '').trim()).slice(0, 30);
  const tiH = ti ? 78 : 0;

  // ── 격자 계산 ──
  const cols = n === 1 ? 1 : n === 3 ? 3 : 2;
  const rows = Math.ceil(n / cols);
  const cardW = n === 1 ? CH_W - P * 2 : (CH_W - P * 2 - GAP * (cols - 1)) / cols;
  const horiz = n === 1 ? true : cardW >= 460;   // 좌초상/우정보 vs 초상위/정보아래

  // 카드 높이: 스탯 수에 따라 가변
  const maxRows = (i) => {
    const items = listOf(stB[i]).map(it => it.split('\u00a7'));
    const g = items.filter(it => parseGauge(it[1] || '')).length;
    const p = items.length - g;
    return { g, p, items };
  };
  const per = [];
  for (let i = 0; i < n; i++) per.push(maxRows(i));

  let portW, portH, cardH;
  if (n === 1) {
    portW = 460; portH = 600;
    const need = 96 + Math.min(per[0].g, 8) * 70 + Math.ceil(Math.min(per[0].p, 20) / 2) * 52 + (tagB[0] ? 78 : 0);
    cardH = Math.max(portH + P * 2 - 24, need + 92);
  } else if (horiz) {
    portW = Math.round(cardW * 0.38); portH = Math.round(portW * 1.32);
    const need = 74 + Math.max(...per.map(x => Math.min(x.g, 8) * 52 + Math.ceil(x.p / 2) * 44))
               + (tagB.some(Boolean) ? 50 : 0);
    cardH = Math.max(portH + 44, need + 60);
  } else {
    portW = Math.round(cardW - 36); portH = Math.round(portW * 1.05);
    const need = 70 + Math.max(...per.map(x => Math.min(x.g, 8) * 52 + Math.min(x.p, 20) * 42))
               + (tagB.some(Boolean) ? 70 : 0);
    cardH = portH + need + 44;
  }
  const H = tiH + P * 2 + cardH * rows + GAP * (rows - 1);

  let s = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"`
        + ` width="${CH_W}" height="${H}" viewBox="0 0 ${CH_W} ${H}">`;
  s += `<defs>`
    +  `<filter id="ko${U}"><feColorMatrix type="matrix" values="`
    +  `0.32 0.5 0.18 0 0  0.32 0.5 0.18 0 0  0.32 0.5 0.18 0 0  0 0 0 1 0"/>`
    +  `<feComponentTransfer><feFuncR type="gamma" exponent="1.25" amplitude="0.9"/>`
    +  `<feFuncG type="gamma" exponent="1.25" amplitude="0.9"/>`
    +  `<feFuncB type="gamma" exponent="1.25" amplitude="0.9"/></feComponentTransfer></filter>`;
  if (sk === 'rm') {
    s += `<linearGradient id="cg${U}" x1="0" y1="0" x2="0" y2="1">`
      +  `<stop offset="0" stop-color="${mixHex(base, '#ffffff', 0.06)}"/>`
      +  `<stop offset="1" stop-color="${mixHex(base, '#000000', 0.62)}"/></linearGradient>`;
  }
  s += `</defs>`;
  s += `<rect width="${CH_W}" height="${H}" fill="${page}"/>`;

  // ── 타이틀 ──
  if (ti) {
    s += `<text x="${P}" y="${P + 44}" font-family="${FF}" font-size="42" font-weight="700"`
      +  ` fill="${ui}" letter-spacing="3">${ti}</text>`
      +  `<rect x="${P}" y="${P + 60}" width="${CH_W - P * 2}" height="2" fill="${acc}" opacity="0.45"/>`;
  }

  // ── 카드 ──
  for (let i = 0; i < n; i++) {
    const cx = P + (i % cols) * (cardW + GAP);
    const cy = P + tiH + Math.floor(i / cols) * (cardH + GAP);
    const ko = koSet.has(i + 1);
    s += card(i, cx, cy);
    // ko= 인물은 흑백 처리만 한다 (문구·오버레이 없음)

    function card(idx, x, y) {
      let o = `<g${ko ? ` filter="url(#ko${U})"` : ''}>`;
      // 카드 바탕
      if (sk === 'rm') {
        o += `<rect x="${x}" y="${y}" width="${cardW}" height="${cardH}" rx="${rx}" fill="url(#cg${U})"/>`
          +  `<rect x="${x + 5}" y="${y + 5}" width="${cardW - 10}" height="${cardH - 10}" rx="${rx}"`
          +  ` fill="none" stroke="${acc}" stroke-width="3" opacity="0.9"/>`
          +  `<rect x="${x + 12}" y="${y + 12}" width="${cardW - 24}" height="${cardH - 24}" rx="${rx}"`
          +  ` fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.3"/>`;
      } else if (sk === 'gal') {
        o += `<rect x="${x}" y="${y}" width="${cardW}" height="${cardH}" rx="${rx}" fill="${base}"/>`
          +  `<rect x="${x}" y="${y}" width="${cardW}" height="${cardH}" rx="${rx}" fill="none"`
          +  ` stroke="${acc}" stroke-width="2" opacity="0.5"/>`;
      } else {
        o += `<rect x="${x}" y="${y}" width="${cardW}" height="${cardH}" rx="${rx}" fill="${base}"/>`
          +  `<rect x="${x}" y="${y}" width="${cardW}" height="${cardH}" rx="${rx}" fill="none"`
          +  ` stroke="${light ? '#00000022' : '#ffffff18'}" stroke-width="1.5"/>`;
      }

      const pad = n === 1 ? 44 : 22;
      const px = x + pad, py = y + pad;
      // 초상
      o += portrait(idx, px, py);

      // 정보 영역 원점
      const ix = horiz ? px + portW + (n === 1 ? 40 : 20) : px;
      const iy = horiz ? py + 2 : py + portH + 18;
      const iw = horiz ? (x + cardW - pad) - ix : cardW - pad * 2;
      o += info(idx, ix, iy, iw);

      return o + `</g>`;
    }

    function portrait(idx, x, y) {
      const cf = (crs[idx] || 'c').split('\u00a7');
      const [par, ax, ay] = CAM_ANCHOR[(cf[0] || 'c').trim().toLowerCase()] || CAM_ANCHOR.c;
      let zoom = parseFloat(cf[1]); if (!(zoom >= 1 && zoom <= 4)) zoom = 1;
      const prx = sk === 'mod' ? 18 : sk === 'rm' ? 4 : 10;
      const uri = imgs[idx];
      let o = `<clipPath id="pc${U}_${idx}"><rect x="${x}" y="${y}" width="${portW}" height="${portH}" rx="${prx}"/></clipPath>`;
      if (uri) {
        const ox = x + ax * portW, oy = y + ay * portH;
        const tf = zoom > 1 ? ` transform="translate(${ox.toFixed(1)},${oy.toFixed(1)}) scale(${zoom}) translate(${(-ox).toFixed(1)},${(-oy).toFixed(1)})"` : '';
        o += `<g clip-path="url(#pc${U}_${idx})"><g${tf}><image x="${x}" y="${y}" width="${portW}" height="${portH}"`
          +  ` preserveAspectRatio="${par} slice" href="${uri}" xlink:href="${uri}"/></g></g>`;
      } else {
        // 실루엣 플레이스홀더
        const cxp = x + portW / 2, r = portW * 0.19;
        o += `<g clip-path="url(#pc${U}_${idx})">`
          +  `<rect x="${x}" y="${y}" width="${portW}" height="${portH}" fill="${mixHex(base, light ? '#000000' : '#ffffff', 0.09)}"/>`
          +  `<circle cx="${cxp}" cy="${(y + portH * 0.36).toFixed(1)}" r="${r.toFixed(1)}" fill="${dim}" opacity="0.42"/>`
          +  `<ellipse cx="${cxp}" cy="${(y + portH * 1.02).toFixed(1)}" rx="${(portW * 0.38).toFixed(1)}"`
          +  ` ry="${(portH * 0.42).toFixed(1)}" fill="${dim}" opacity="0.42"/></g>`;
      }
      o += `<rect x="${x}" y="${y}" width="${portW}" height="${portH}" rx="${prx}" fill="none"`
        +  ` stroke="${acc}" stroke-width="${n === 1 ? 3 : 2}" opacity="0.8"/>`;
      return o;
    }

    function info(idx, x, y, w) {
      const big = n === 1;
      const nmFs = big ? 58 : (horiz ? 34 : 30);
      const sbFs = big ? 28 : 21;
      const nm = esc((nms[idx] || '').trim()).slice(0, 20);
      const sb = esc((sbs[idx] || '').trim()).slice(0, 24);
      let o = '', cy2 = y + nmFs * 0.9;
      if (nm) {
        o += `<text x="${x}" y="${cy2.toFixed(1)}" font-family="${FF}" font-size="${nmFs}"`
          +  ` font-weight="700" fill="${ui}">${nm}</text>`;
        cy2 += sb ? sbFs * 1.25 : nmFs * 0.34;
      }
      if (sb) {
        o += `<text x="${x}" y="${cy2.toFixed(1)}" font-family="${FF}" font-size="${sbFs}"`
          +  ` fill="${acc}" letter-spacing="1.5">${sb}</text>`;
        cy2 += sbFs * 0.9;
      }
      o += `<rect x="${x}" y="${(cy2 + 8).toFixed(1)}" width="${w}" height="1.5" fill="${acc}" opacity="0.3"/>`;
      cy2 += big ? 48 : 34;

      const { items } = per[idx];
      const gauges = [], plains = [];
      for (const it of items) {
        const label = (it[0] || '').trim(), val = (it[1] || '').trim();
        // 3번째 § 필드가 있으면 게이지 색을 직접 지정한다 (라벨 자동판별보다 우선)
        const cRaw = (it[2] || '').trim().toLowerCase();
        const cOwn = cRaw ? (camHex(cRaw) || CAM_PRESETS[cRaw] || null) : null;
        const g = parseGauge(val);
        if (g) gauges.push([label, val, g, cOwn]); else plains.push([label, val]);
      }
      // 게이지
      const gh = big ? 26 : 18, gStep = big ? 70 : (horiz ? 54 : 52);
      const gFs = big ? 26 : 20;
      for (const [label, val, g, cOwn] of gauges.slice(0, 8)) {
        const col = cOwn || gaugeCol(label, acc);
        o += `<text x="${x}" y="${cy2.toFixed(1)}" font-family="${FF}" font-size="${gFs}" fill="${dim}">${esc(label).slice(0, 8)}</text>`
          +  `<text x="${(x + w).toFixed(1)}" y="${cy2.toFixed(1)}" text-anchor="end" font-family="${FF}"`
          +  ` font-size="${gFs}" fill="${ui}">${esc(val)}</text>`;
        const by = cy2 + 10;
        o += `<rect x="${x}" y="${by.toFixed(1)}" width="${w}" height="${gh}" rx="${gh / 2}"`
          +  ` fill="${light ? '#00000022' : '#ffffff1c'}"/>`
          +  `<rect x="${x}" y="${by.toFixed(1)}" width="${(w * g.r).toFixed(1)}" height="${gh}" rx="${gh / 2}" fill="${col}"/>`
          +  `<rect x="${x}" y="${(by + 2).toFixed(1)}" width="${(w * g.r).toFixed(1)}" height="${(gh * 0.34).toFixed(1)}"`
          +  ` rx="${(gh * 0.17).toFixed(1)}" fill="#ffffff" opacity="0.22"/>`;
        cy2 += gStep;
      }
      // 숫자 스탯 — 1인/가로카드는 2열, 세로카드는 1열
      const sCols = (big || horiz) ? 2 : 1;
      const sFs = big ? 28 : 21;
      const sStep = big ? 52 : 42;
      const colW = w / sCols;
      const lim = 20;
      plains.slice(0, lim).forEach(([label, val], k) => {
        const gx = x + (k % sCols) * colW;
        const gy = cy2 + Math.floor(k / sCols) * sStep;
        o += `<text x="${gx}" y="${gy.toFixed(1)}" font-family="${FF}" font-size="${sFs}" fill="${dim}">${esc(label).slice(0, 8)}</text>`
          +  `<text x="${(gx + colW - (sCols > 1 ? 24 : 0)).toFixed(1)}" y="${gy.toFixed(1)}" text-anchor="end"`
          +  ` font-family="${FF}" font-size="${sFs}" font-weight="700" fill="${ui}">${esc(val).slice(0, 12)}</text>`;
      });
      cy2 += Math.ceil(Math.min(plains.length, lim) / sCols) * sStep;

      // 상태 칩
      const tags = listOf(tagB[idx]).slice(0, 6);
      if (tags.length) {
        const tFs = big ? 24 : 19;
        let tx = x;
        for (const t of tags) {
          const tw = lineW(t) * tFs + 30;
          if (tx + tw > x + w) break;
          o += `<rect x="${tx.toFixed(1)}" y="${(cy2 - tFs).toFixed(1)}" width="${tw.toFixed(1)}"`
            +  ` height="${(tFs * 1.85).toFixed(1)}" rx="${(tFs * 0.92).toFixed(1)}" fill="${acc}" opacity="0.16"/>`
            +  `<rect x="${tx.toFixed(1)}" y="${(cy2 - tFs).toFixed(1)}" width="${tw.toFixed(1)}"`
            +  ` height="${(tFs * 1.85).toFixed(1)}" rx="${(tFs * 0.92).toFixed(1)}" fill="none" stroke="${acc}" stroke-width="1.5" opacity="0.6"/>`
            +  `<text x="${(tx + tw / 2).toFixed(1)}" y="${(cy2 + tFs * 0.42).toFixed(1)}" text-anchor="middle"`
            +  ` font-family="${FF}" font-size="${tFs}" fill="${acc}">${esc(t)}</text>`;
          tx += tw + 10;
        }
      }
      return o;
    }
  }
  return s + `</svg>`;
}

// ══════════════════════════════════════════════════════════════
// ?t=id — 신분증 (gov 공적 / corp 사원증 / crim 수용자 / fant 길드증)
// ══════════════════════════════════════════════════════════════
const ID_MONO = "'DejaVu Sans Mono','Consolas',monospace";
const ID_SIZE = { l: [1216, 768], p: [832, 1216] };
const ID_SK = {
  gov:  { ori: 'l', base: '#eef0f6', acc: '#8888CC' },
  corp: { ori: 'p', base: '#ffffff', acc: '#BB6688' },
  crim: { ori: 'l', base: '#17161c', acc: '#EE1166' },
  fant: { ori: 'p', base: '#e8dcc0', acc: '#CCAA88' },
};

// 결정론적 난수 (카드번호·바코드·QR 생성용)
function idRand(seed) {
  let h = 2166136261 >>> 0;
  for (const c of String(seed)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return () => { h ^= h << 13; h >>>= 0; h ^= h >> 17; h ^= h << 5; h >>>= 0; return h / 4294967296; };
}
function idBarcode(seed, x, y, w, h, col) {
  const r = idRand(seed);
  const M = 2.6;                       // 모듈 폭 — 실제 바코드처럼 촘촘하게
  let s = '', cx = x, ink = true;
  s += `<rect x="${x}" y="${y}" width="${M * 2}" height="${h}" fill="${col}"/>`;   // 시작 가드
  cx = x + M * 4;
  while (cx < x + w - M * 6) {
    const mw = (1 + Math.floor(r() * 3)) * M;
    if (ink) s += `<rect x="${cx.toFixed(1)}" y="${y}" width="${mw.toFixed(1)}" height="${h}" fill="${col}"/>`;
    cx += mw; ink = !ink;
  }
  s += `<rect x="${(x + w - M * 2).toFixed(1)}" y="${y}" width="${M * 2}" height="${h}" fill="${col}"/>`; // 끝 가드
  return s;
}
function idQR(seed, x, y, size, col) {
  const N = 21, u = size / N, r = idRand(seed);
  let s = `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="#ffffff"/>`;
  const fin = (fx, fy) => {
    s += `<rect x="${(x + fx * u).toFixed(1)}" y="${(y + fy * u).toFixed(1)}" width="${(7 * u).toFixed(1)}" height="${(7 * u).toFixed(1)}" fill="${col}"/>`
      +  `<rect x="${(x + (fx + 1) * u).toFixed(1)}" y="${(y + (fy + 1) * u).toFixed(1)}" width="${(5 * u).toFixed(1)}" height="${(5 * u).toFixed(1)}" fill="#ffffff"/>`
      +  `<rect x="${(x + (fx + 2) * u).toFixed(1)}" y="${(y + (fy + 2) * u).toFixed(1)}" width="${(3 * u).toFixed(1)}" height="${(3 * u).toFixed(1)}" fill="${col}"/>`;
  };
  for (let gy = 0; gy < N; gy++) for (let gx = 0; gx < N; gx++) {
    const inFin = (gx < 8 && gy < 8) || (gx > N - 9 && gy < 8) || (gx < 8 && gy > N - 9);
    if (inFin) continue;
    if (r() > 0.52) s += `<rect x="${(x + gx * u).toFixed(1)}" y="${(y + gy * u).toFixed(1)}" width="${u.toFixed(1)}" height="${u.toFixed(1)}" fill="${col}"/>`;
  }
  fin(0, 0); fin(N - 7, 0); fin(0, N - 7);
  return s;
}

async function renderId(params, imgURI) {
  // char과 마찬가지로 부가 이미지(문장·배경)와 손글씨 폰트를 렌더러 안에서 직접 받는다.
  // loadFonts()의 pol 전용 게이트는 건드리지 않는다.
  const U = camUid(params);
  let sk = (params.get('sk') || 'gov').trim().toLowerCase();
  if (!ID_SK[sk]) sk = 'gov';
  const SK = ID_SK[sk];
  let ft = (params.get('ft') || 'serif').trim().toLowerCase();
  if (!FT_STACK[ft]) ft = 'serif';
  const FF = FT_STACK[ft];

  const oRaw = (params.get('o') || '').trim().toLowerCase();
  const ori = ID_SIZE[oRaw] ? oRaw : SK.ori;
  const [W, H] = ID_SIZE[ori];
  const wide = ori === 'l';

  const thF = (params.get('th') || '').split('\u00a7');
  const pickTh = (i, d) => {
    const g = (thF[i] || '').trim().toLowerCase();
    return g ? (camHex(g) || CAM_PRESETS[g] || d) : d;
  };
  const acc = pickTh(2, SK.acc);
  const base = pickTh(1, SK.base);
  const light = lumaOf(base) > 0.45;
  const ui = light ? '#191722' : '#f4f2f8';
  const dim = light ? '#6d6880' : '#9b95ad';
  const line = light ? '#00000024' : '#ffffff26';

  const ti = esc((params.get('ti') || '').trim()).slice(0, 34);
  const nm = esc((params.get('nm') || '').trim()).slice(0, 20);
  const sb = esc((params.get('sb') || '').trim()).slice(0, 30);
  const no = esc((params.get('no') || '').trim()).slice(0, 28);
  const ex = esc((params.get('exp') || '').trim()).slice(0, 24);
  const seal = esc((params.get('seal') || '').trim()).slice(0, 8);
  const sigOn = (params.get('sig') || '') === '1';
  // code= 로 코드 표기 제어. 생략 시 스킨 기본값 (gov·crim 바코드 / corp QR / fant 없음)
  let code = (params.get('code') || '').trim().toLowerCase();
  if (!['0', 'x', 'off', 'bar', 'qr'].includes(code)) code = '';
  const codeOff = code === '0' || code === 'x' || code === 'off';
  const fields = String(params.get('fd') || '').split('|').map(s => s.trim()).filter(Boolean)
    .map(s => s.split('\u00a7')).slice(0, 10);

  // emb= 문장·로고 (투명 PNG 권장) / bg= fant 배경 이미지
  const embRaw = (params.get('emb') || '').trim();
  // emb=0 이면 문장을 아예 그리지 않는다 (fant는 제목·사진이 그만큼 위로 올라간다)
  const embOff = ['0', 'x', 'off'].includes(embRaw.toLowerCase());
  const bgRaw = (params.get('bg') || '').trim();
  const [embR, bgR] = await Promise.all([
    (embRaw && !embOff) ? loadImg(embRaw) : Promise.resolve({ uri: null }),
    bgRaw ? loadImg(bgRaw) : Promise.resolve({ uri: null }),
  ]);
  const embURI = embR.uri, bgURI = bgR.uri;

  // 서명(sig=1)과 ft=hand 는 손글씨 폰트를 인라인한다
  let fontCss = '';
  if (sigOn || ft === 'hand') {
    const scan = (params.get('nm') || '') + (ft === 'hand'
      ? (params.get('ti') || '') + (params.get('sb') || '') + (params.get('fd') || '') : '');
    const [zen, pen] = await Promise.all([
      fetchFont(FONT_URL.zen),
      RE_KO.test(scan) ? fetchFont(FONT_URL.pen) : Promise.resolve(null),
    ]);
    const ffc = (n, x) => `@font-face{font-family:'${n}';font-style:normal;font-weight:400;`
      + `src:url(data:font/woff2;base64,${x}) format('woff2');}`;
    if (pen) fontCss += ffc('WPen', pen);
    if (zen) fontCss += ffc('WZen', zen);
  }

  const cf = (params.get('cr') || 't').split('\u00a7');
  const [par, ax, ay] = CAM_ANCHOR[(cf[0] || 't').trim().toLowerCase()] || CAM_ANCHOR.t;
  let zoom = parseFloat(cf[1]); if (!(zoom >= 1 && zoom <= 4)) zoom = 1;

  let s = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"`
        + ` width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  if (fontCss) s += `<style>${fontCss}</style>`;
  s += `<defs><linearGradient id="hd${U}" x1="0" y1="0" x2="1" y2="0">`
    +  `<stop offset="0" stop-color="${acc}"/><stop offset="1" stop-color="${mixHex(acc, light ? '#ffffff' : '#000000', 0.42)}"/></linearGradient>`
    +  `<linearGradient id="ho${U}" x1="0" y1="0" x2="1" y2="1">`
    +  `<stop offset="0" stop-color="#ffffff" stop-opacity="0.5"/><stop offset="0.5" stop-color="${acc}" stop-opacity="0.28"/>`
    +  `<stop offset="1" stop-color="#ffffff" stop-opacity="0.5"/></linearGradient></defs>`;
  s += `<rect width="${W}" height="${H}" fill="${sk === 'fant' ? mixHex(base, '#000000', 0.72) : mixHex(base, light ? '#000000' : '#ffffff', 0.1)}"/>`;

  // 카드 판
  const M = wide ? 40 : 36;
  const CW = W - M * 2, CH = H - M * 2, CX = M, CY = M, CR = sk === 'fant' ? 8 : 26;
  if (sk !== 'fant') s += `<rect x="${CX}" y="${CY}" width="${CW}" height="${CH}" rx="${CR}" fill="${base}"/>`;

  const photo = (px, py, pw, ph, rx) => {
    let o = `<clipPath id="ph${U}"><rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="${rx}"/></clipPath>`;
    if (imgURI) {
      const ox = px + ax * pw, oy = py + ay * ph;
      const tf = zoom > 1 ? ` transform="translate(${ox.toFixed(1)},${oy.toFixed(1)}) scale(${zoom}) translate(${(-ox).toFixed(1)},${(-oy).toFixed(1)})"` : '';
      o += `<g clip-path="url(#ph${U})"><g${tf}><image x="${px}" y="${py}" width="${pw}" height="${ph}"`
        +  ` preserveAspectRatio="${par} slice" href="${imgURI}" xlink:href="${imgURI}"/></g></g>`;
    } else {
      const cxp = px + pw / 2;
      o += `<g clip-path="url(#ph${U})"><rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="${mixHex(base, light ? '#000000' : '#ffffff', 0.1)}"/>`
        +  `<circle cx="${cxp}" cy="${(py + ph * 0.36).toFixed(1)}" r="${(pw * 0.2).toFixed(1)}" fill="${dim}" opacity="0.4"/>`
        +  `<ellipse cx="${cxp}" cy="${(py + ph * 1.05).toFixed(1)}" rx="${(pw * 0.36).toFixed(1)}" ry="${(ph * 0.42).toFixed(1)}" fill="${dim}" opacity="0.4"/></g>`;
    }
    o += `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="${rx}" fill="none" stroke="${acc}" stroke-width="3" opacity="0.85"/>`;
    return o;
  };

  const fieldRows = (fx, fy, fw, cols, fs, step, labW) => {
    let o = '';
    fields.forEach((it, k) => {
      const gx = fx + (k % cols) * (fw / cols);
      const gy = fy + Math.floor(k / cols) * step;
      o += `<text x="${gx}" y="${gy}" font-family="${FF}" font-size="${(fs * 0.86).toFixed(1)}" fill="${dim}" letter-spacing="1">${esc((it[0] || '').trim()).slice(0, 10)}</text>`
        +  `<text x="${(gx + labW).toFixed(1)}" y="${gy}" font-family="${FF}" font-size="${fs}" font-weight="600" fill="${ui}">${esc((it[1] || '').trim()).slice(0, 22)}</text>`;
    });
    return o;
  };

  // emb= 문장·로고 (투명 PNG 권장). 없으면 fant는 이름 첫 글자 육각 문장으로 대체
  const emblem = (ex0, ey0, size) => {
    if (!embURI) return '';
    return `<image x="${(ex0 - size / 2).toFixed(1)}" y="${(ey0 - size / 2).toFixed(1)}" width="${size}" height="${size}"`
      +  ` preserveAspectRatio="xMidYMid meet" href="${embURI}" xlink:href="${embURI}"/>`;
  };

  const stamp = (sx, sy, r) => {
    if (!seal) return '';
    const c = '#c0332f';
    const L = lineW(seal);
    // 한자 1~2자는 크게 박히는 게 도장답다
    const sealFs = L <= 1 ? r * 0.94 : L <= 2 ? r * 0.64 : r * 1.28 / L;
    // 세로 중심: CJK 글자의 시각 중심은 폰트 크기의 약 0.36 아래에 온다
    const sealDy = sealFs * 0.36;
    // 가로 중심: letter-spacing 은 마지막 글자 뒤에도 붙어서 middle 정렬을 왼쪽으로 민다 → 절반 보정
    const sealLs = L <= 1 ? 0 : 2;
    const sealDx = sealLs / 2;
    return `<g transform="rotate(-16 ${sx} ${sy})" opacity="0.72">`
      +  `<circle cx="${sx}" cy="${sy}" r="${r}" fill="none" stroke="${c}" stroke-width="${(r * 0.1).toFixed(1)}"/>`
      +  `<circle cx="${sx}" cy="${sy}" r="${(r * 0.82).toFixed(1)}" fill="none" stroke="${c}" stroke-width="${(r * 0.045).toFixed(1)}"/>`
      +  `<rect x="${(sx - r * 0.86).toFixed(1)}" y="${(sy - r * 0.3).toFixed(1)}" width="${(r * 1.72).toFixed(1)}" height="${(r * 0.6).toFixed(1)}" fill="${c}" opacity="0.14"/>`
      +  `<text x="${(sx + sealDx).toFixed(1)}" y="${(sy + sealDy).toFixed(1)}" text-anchor="middle" font-family="${FF}" font-weight="700"`
      +  ` font-size="${sealFs.toFixed(1)}" fill="${c}" letter-spacing="${sealLs}">${seal}</text></g>`;
  };

  const sigLine = (gx, gy, gw) => {
    let o = `<line x1="${gx}" y1="${gy}" x2="${(gx + gw).toFixed(1)}" y2="${gy}" stroke="${line}" stroke-width="2"/>`
      +  `<text x="${gx}" y="${(gy + 26).toFixed(1)}" font-family="${FF}" font-size="19" fill="${dim}" letter-spacing="2">SIGNATURE</text>`;
    if (nm) o += `<text x="${(gx + 10).toFixed(1)}" y="${(gy - 12).toFixed(1)}" font-family="${FT_STACK.hand}" font-size="46" fill="${ui}">${nm}</text>`;
    return o;
  };

  // 스킨 기본 코드 종류 + code= 오버라이드
  const codeKind = codeOff ? '' : (code || (sk === 'corp' ? 'qr' : sk === 'fant' ? '' : 'bar'));

  // ── 스킨별 배치 ──
  if (sk === 'gov') {
    s += `<rect x="${CX}" y="${CY}" width="${CW}" height="104" rx="${CR}" fill="url(#hd${U})"/>`
      +  `<rect x="${CX}" y="${CY + 74}" width="${CW}" height="30" fill="url(#hd${U})"/>`
      +  `<text x="${CX + 40}" y="${CY + 66}" font-family="${FF}" font-size="40" font-weight="700" fill="#ffffff" letter-spacing="3">${ti}</text>`
      +  emblem(CX + CW - 78, CY + 52, 72);
    const px = CX + 48, py = CY + 152;
    s += photo(px, py, 300, 390, 10);
    const ix = px + 300 + 52, iw = CX + CW - 48 - ix;
    s += `<text x="${ix}" y="${py + 62}" font-family="${FF}" font-size="64" font-weight="700" fill="${ui}">${nm}</text>`;
    if (sb) s += `<text x="${ix}" y="${py + 104}" font-family="${FF}" font-size="27" fill="${acc}" letter-spacing="1.5">${sb}</text>`;
    s += `<line x1="${ix}" y1="${py + 128}" x2="${ix + iw}" y2="${py + 128}" stroke="${line}" stroke-width="2"/>`;
    s += fieldRows(ix, py + 178, iw, 2, 27, 58, 130);
    if (no) s += `<text x="${px}" y="${py + 440}" font-family="${ID_MONO}" font-size="34" fill="${ui}" letter-spacing="4">${no}</text>`;
    if (ex) s += `<text x="${px}" y="${py + 478}" font-family="${FF}" font-size="22" fill="${dim}">유효기간 ${ex}</text>`;
    const sigW = 300, sigEnd = ix + sigW;
    if (sigOn) s += sigLine(ix, CY + CH - 62, sigW);
    const bx0 = (sigOn ? sigEnd : ix) + 44, bw0 = CX + CW - 48 - bx0;
    if (codeKind === 'bar' && bw0 > 120) s += idBarcode(no || U, bx0, CY + CH - 108, bw0, 62, ui);
    else if (codeKind === 'qr') s += idQR(no || U, CX + CW - 176, CY + CH - 184, 128, ui);
    s += stamp(CX + CW - 190, CY + CH - 210, 92);

  } else if (sk === 'corp') {
    s += `<rect x="${(W / 2 - 82).toFixed(1)}" y="${CY + 26}" width="164" height="26" rx="13" fill="${mixHex(base, '#000000', 0.18)}"/>`;
    s += emblem(CX + 96, CY + 108, 84)
      +  `<text x="${W / 2}" y="${CY + 128}" text-anchor="middle" font-family="${FF}" font-size="36" font-weight="700" fill="${acc}" letter-spacing="4">${ti}</text>`
      +  `<line x1="${CX + 60}" y1="${CY + 152}" x2="${CX + CW - 60}" y2="${CY + 152}" stroke="${acc}" stroke-width="3" opacity="0.5"/>`;
    const pw = 300, px = (W - pw) / 2, py = CY + 182;
    s += photo(px, py, pw, 380, 12);
    s += `<text x="${W / 2}" y="${py + 452}" text-anchor="middle" font-family="${FF}" font-size="56" font-weight="700" fill="${ui}">${nm}</text>`;
    if (sb) s += `<text x="${W / 2}" y="${py + 490}" text-anchor="middle" font-family="${FF}" font-size="25" fill="${acc}" letter-spacing="2">${sb}</text>`;
    s += fieldRows(CX + 70, py + 548, CW - 140, 1, 24, 42, 150);
    if (codeKind === 'qr') s += idQR(no || U, CX + 56, CY + CH - 176, 136, ui);
    else if (codeKind === 'bar') s += idBarcode(no || U, CX + 56, CY + CH - 130, 240, 56, ui);
    const cq = CX + 56 + (codeKind ? (codeKind === 'qr' ? 136 : 240) : 0) + (codeKind ? 30 : 0);
    if (no) s += `<text x="${CX + CW - 56}" y="${CY + CH - 148}" text-anchor="end" font-family="${ID_MONO}" font-size="26" fill="${ui}" letter-spacing="3">${no}</text>`;
    if (ex) s += `<text x="${CX + CW - 56}" y="${CY + CH - 116}" text-anchor="end" font-family="${FF}" font-size="20" fill="${dim}">유효 ${ex}</text>`;
    if (sigOn) s += sigLine(cq, CY + CH - 60, CX + CW - 56 - cq);
    s += stamp(CX + CW - 168, CY + CH - 330, 88);

  } else if (sk === 'crim') {
    s += `<rect x="${CX}" y="${CY}" width="${CW}" height="86" rx="${CR}" fill="${acc}" opacity="0.9"/>`
      +  `<rect x="${CX}" y="${CY + 56}" width="${CW}" height="30" fill="${acc}" opacity="0.9"/>`
      +  `<text x="${CX + 40}" y="${CY + 58}" font-family="${FF}" font-size="36" font-weight="700" fill="#ffffff" letter-spacing="6">${ti}</text>`
      +  emblem(CX + CW - 72, CY + 44, 64);
    const px = CX + 48, py = CY + 132, pw = 360, ph = 450;
    // 신장 눈금
    for (let i = 0; i <= 6; i++) {
      const gy = py + (ph / 6) * i;
      s += `<line x1="${px - 26}" y1="${gy}" x2="${px}" y2="${gy}" stroke="${dim}" stroke-width="2"/>`
        +  `<text x="${px - 32}" y="${(gy + 8).toFixed(1)}" text-anchor="end" font-family="${ID_MONO}" font-size="18" fill="${dim}">${190 - i * 10}</text>`;
    }
    s += photo(px, py, pw, ph, 4);
    const ix = px + pw + 56, iw = CX + CW - 48 - ix;
    s += `<text x="${ix}" y="${py + 56}" font-family="${FF}" font-size="58" font-weight="700" fill="${ui}">${nm}</text>`;
    if (sb) s += `<text x="${ix}" y="${py + 96}" font-family="${FF}" font-size="25" fill="${acc}" letter-spacing="1.5">${sb}</text>`;
    if (no) s += `<rect x="${ix}" y="${py + 122}" width="${iw}" height="76" fill="${mixHex(base, '#ffffff', 0.08)}"/>`
      +  `<text x="${(ix + iw / 2).toFixed(1)}" y="${py + 176}" text-anchor="middle" font-family="${ID_MONO}" font-size="46" fill="${ui}" letter-spacing="8">${no}</text>`;
    s += fieldRows(ix, py + 250, iw, 1, 26, 50, 150);
    if (ex) s += `<text x="${ix}" y="${py + 250 + fields.length * 50 + 16}" font-family="${FF}" font-size="22" fill="${dim}">수감기간 ${ex}</text>`;
    if (codeKind === 'bar') s += idBarcode(no || U, CX + 48, CY + CH - 96, 372, 56, ui);
    else if (codeKind === 'qr') s += idQR(no || U, CX + 48, CY + CH - 158, 120, ui);
    if (sigOn) s += sigLine(ix, CY + CH - 62, 300);
    s += stamp(CX + CW - 180, CY + CH - 200, 96);

  } else { // fant
    // 찢긴 양피지 — 노이즈 변위 마스크로 자연스러운 결을 만든다 (지그재그 대신)
    const sd = (parseInt(U, 36) % 900) + 1;
    s += `<defs>`
      +  `<filter id="te${U}" x="-12%" y="-8%" width="124%" height="116%">`
      +  `<feTurbulence type="fractalNoise" baseFrequency="0.011 0.016" numOctaves="5" seed="${sd}" result="t"/>`
      +  `<feDisplacementMap in="SourceGraphic" in2="t" scale="34" xChannelSelector="R" yChannelSelector="G"/>`
      +  `</filter>`
      +  `<mask id="tm${U}"><rect x="${CX + 16}" y="${CY + 14}" width="${CW - 32}" height="${CH - 28}" fill="#ffffff" filter="url(#te${U})"/></mask>`
      +  `<filter id="pf${U}" x="0" y="0" width="100%" height="100%">`
      +  `<feTurbulence type="fractalNoise" baseFrequency="0.9 0.045" numOctaves="4" seed="7" result="n"/>`
      +  `<feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.9 0.5 0 0 -0.28" result="a"/>`
      +  `<feComposite in="SourceGraphic" in2="a" operator="in"/></filter>`
      +  `<filter id="pb${U}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="22"/></filter>`
      +  `<linearGradient id="pv${U}" x1="0" y1="0" x2="1" y2="1">`
      +  `<stop offset="0" stop-color="${mixHex(base, '#5a3c14', 0.62)}"/>`
      +  `<stop offset="0.4" stop-color="${base}" stop-opacity="0"/>`
      +  `<stop offset="0.6" stop-color="${base}" stop-opacity="0"/>`
      +  `<stop offset="1" stop-color="${mixHex(base, '#5a3c14', 0.62)}"/></linearGradient>`
      +  `<radialGradient id="pe${U}" cx="0.5" cy="0.5" r="0.72">`
      +  `<stop offset="0.62" stop-color="${base}" stop-opacity="0"/>`
      +  `<stop offset="1" stop-color="${mixHex(base, '#3d2708', 0.8)}" stop-opacity="0.62"/></radialGradient></defs>`;
    // 마스크 안쪽 = 종이. 글자는 마스크 밖에서 그리므로 흐트러지지 않는다
    s += `<g mask="url(#tm${U})">`
      +  `<rect x="${CX}" y="${CY}" width="${CW}" height="${CH}" fill="${base}"/>`
      +  (bgURI ? `<image x="${CX}" y="${CY}" width="${CW}" height="${CH}" preserveAspectRatio="xMidYMid slice"`
          + ` href="${bgURI}" xlink:href="${bgURI}"/>` : '')
      +  `<rect x="${CX}" y="${CY}" width="${CW}" height="${CH}" fill="${mixHex(base, '#6b4a1e', 0.6)}" filter="url(#pf${U})" opacity="${bgURI ? 0.16 : 0.5}"/>`;
    const r0 = idRand(U);
    for (let i = 0; i < 9; i++) {
      const bx = CX + r0() * CW, by = CY + r0() * CH, br = 40 + r0() * 90;
      s += `<ellipse cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" rx="${br.toFixed(1)}" ry="${(br * (0.5 + r0() * 0.6)).toFixed(1)}"`
        +  ` fill="${mixHex(base, '#7a5520', 0.7)}" opacity="${(0.05 + r0() * 0.06).toFixed(3)}" filter="url(#pb${U})"/>`;
    }
    for (let i = 0; i < 3; i++) {
      const fy = CY + CH * (0.24 + i * 0.26) + r0() * 30;
      s += `<rect x="${CX}" y="${fy.toFixed(1)}" width="${CW}" height="2.5" fill="${mixHex(base, '#6b4a1e', 0.5)}" opacity="0.1"/>`;
    }
    s += `<rect x="${CX}" y="${CY}" width="${CW}" height="${CH}" fill="url(#pv${U})" opacity="0.7"/>`
      +  `<rect x="${CX}" y="${CY}" width="${CW}" height="${CH}" fill="url(#pe${U})"/></g>`;
    // 안쪽 사각 테두리는 두지 않는다 — 종이 결이 살아야 한다
    // 문장
    const ex0 = W / 2, ey0 = CY + 108;
    // emb=0 이면 문장 자리를 통째로 비우고 그만큼 위로 당긴다
    const eUp = embOff ? 96 : 0;
    if (embURI) {
      s += emblem(ex0, ey0, 132);
    } else if (!embOff) {
      s += `<path d="M${ex0} ${ey0 - 44} L${ex0 + 40} ${ey0 - 20} L${ex0 + 40} ${ey0 + 16} L${ex0} ${ey0 + 52} L${ex0 - 40} ${ey0 + 16} L${ex0 - 40} ${ey0 - 20} Z"`
        +  ` fill="${mixHex(acc, '#000000', 0.15)}" stroke="${mixHex(acc, '#000000', 0.45)}" stroke-width="3"/>`
        +  `<text x="${ex0}" y="${ey0 + 14}" text-anchor="middle" font-family="${FF}" font-size="34" font-weight="700" fill="${base}">${(nm || '?').slice(0, 1)}</text>`;
    }
    s += `<text x="${W / 2}" y="${CY + 210 - eUp}" text-anchor="middle" font-family="${FF}" font-size="34" font-weight="700" fill="${mixHex(ui, acc, 0.25)}" letter-spacing="5">${ti}</text>`;
    const pw = embOff ? 300 : 264, px = (W - pw) / 2, py = CY + 238 - eUp;
    s += photo(px, py, pw, embOff ? 388 : 340, 2);
    const pB = embOff ? 48 : 0;   // 사진이 커진 만큼 아래 요소를 민다
    s += `<text x="${W / 2}" y="${py + 406 + pB}" text-anchor="middle" font-family="${FF}" font-size="52" font-weight="700" fill="${ui}">${nm}</text>`;
    if (sb) s += `<text x="${W / 2}" y="${py + 444 + pB}" text-anchor="middle" font-family="${FF}" font-size="24" fill="${mixHex(ui, acc, 0.4)}" letter-spacing="3">${sb}</text>`;
    s += `<line x1="${CX + 90}" y1="${py + 470 + pB}" x2="${CX + CW - 90}" y2="${py + 470 + pB}" stroke="${acc}" stroke-width="2" opacity="0.7"/>`;
    s += fieldRows(CX + 92, py + 518 + pB, CW - 184, 1, 23, 42, 140);
    if (codeKind === 'bar') s += idBarcode(no || U, CX + 92, CY + CH - 176, 240, 44, mixHex(ui, base, 0.25));
    else if (codeKind === 'qr') s += idQR(no || U, CX + 92, CY + CH - 244, 112, ui);
    if (sigOn) s += sigLine(CX + 92, CY + CH - 118, 264);
    if (no) s += `<text x="${CX + CW - 92}" y="${CY + CH - 118}" text-anchor="end" font-family="${ID_MONO}" font-size="24" fill="${dim}" letter-spacing="4">${no}</text>`;
    if (ex) s += `<text x="${CX + CW - 92}" y="${CY + CH - 84}" text-anchor="end" font-family="${FF}" font-size="20" fill="${dim}">유효 ${ex}</text>`;
    s += stamp(CX + CW - 148, CY + CH - 236, 84);
  }

  // 홀로그램 광택 (gov·corp만)
  if (sk === 'gov' || sk === 'corp') {
    s += `<rect x="${CX + CW - 150}" y="${CY + (sk === 'gov' ? 140 : 190)}" width="96" height="96" rx="48" fill="url(#ho${U})"/>`;
  }
  return s + `</svg>`;
}

// ══════════════════════════════════════════════════════════════
// 라우팅
// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
// ?t=atk — 전투 타격 컷
//   적 이미지 + 공격 이펙트 + HP 감소 + 데미지 숫자.
//   선택지 UI는 없다. "때린 결과"만 보여주는 컷이라 세계관을 타지 않는다.
//   이펙트 좌표는 360x270 기준으로 짜고 캔버스에 균등 스케일로 덮는다
//   (비균등 스케일은 마법진 원이 타원이 되어 못 쓴다).
// ══════════════════════════════════════════════════════════════
const ATK_VW = 360, ATK_VH = 270, ATK_CX = 180, ATK_CY = 130;
const ATK_END = 1.5;                       // 액션이 끝나는 시각(초)
const ATK_FX_LIST = ['slash', 'slash2', 'thrust', 'holy', 'impact', 'magic'];

// lp>0 이면 lp초 주기 반복, lp=0 이면 1회 재생 후 정지(freeze).
// 어느 쪽이든 액션은 ATK_END 안에 끝나고 나머지는 정지 화면으로 유지된다.
function atkTimer(lp) {
  const once = !(lp > 0);
  const TOT = once ? ATK_END : lp;
  const norm = (pairs) => {
    const ts = pairs.map(p => p[0]), vs = pairs.map(p => String(p[1]));
    if (ts[0] !== 0) { ts.unshift(0); vs.unshift(vs[0]); }
    if (ts[ts.length - 1] < TOT) { ts.push(TOT); vs.push(vs[vs.length - 1]); }
    // keyTimes는 반드시 정확히 1.0으로 끝나야 한다 (부동소수 오차 금지)
    const kt = ts.map((t, i) => (i === ts.length - 1 ? '1' : (t / TOT).toFixed(6))).join(';');
    return [vs.join(';'), kt];
  };
  const tail = once
    ? ` dur="${TOT}s" repeatCount="1" fill="freeze"`
    : ` dur="${TOT}s" repeatCount="indefinite"`;
  return {
    a: (attr, pairs, extra) => {
      const [v, k] = norm(pairs);
      return `<animate attributeName="${attr}" values="${v}" keyTimes="${k}"${tail} ${extra || ''}/>`;
    },
    t: (type, pairs, extra) => {
      const [v, k] = norm(pairs);
      return `<animateTransform attributeName="transform" type="${type}" values="${v}"`
        + ` keyTimes="${k}"${tail} ${extra === undefined ? 'additive="sum"' : extra}/>`;
    },
  };
}

// 양끝이 뾰족한 초승달 참격
function atkCrescent(x1, y1, x2, y2, b1, b2) {
  const dx = x2 - x1, dy = y2 - y1;
  const L = Math.hypot(dx, dy) || 1;
  const px = -dy / L, py = dx / L;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  return `M${x1} ${y1} Q${(mx + px * b1 * 2).toFixed(1)} ${(my + py * b1 * 2).toFixed(1)} ${x2} ${y2}`
    + ` Q${(mx + px * b2 * 2).toFixed(1)} ${(my + py * b2 * 2).toFixed(1)} ${x1} ${y1} Z`;
}

function atkSpark(T, n, r0, r1, col, t0, cx, cy, seed, w) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const a = (i * 360 / n + seed) * Math.PI / 180;
    const c = Math.cos(a), si = Math.sin(a);
    s += `<line x1="${(cx + c * r0).toFixed(1)}" y1="${(cy + si * r0).toFixed(1)}"`
      + ` x2="${(cx + c * r0 * 1.5).toFixed(1)}" y2="${(cy + si * r0 * 1.5).toFixed(1)}"`
      + ` stroke="${col}" stroke-width="${w}" stroke-linecap="round" opacity="0">`
      + T.a('opacity', [[0, 0], [t0, 0], [t0 + 0.05, 1], [t0 + 0.35, 0]])
      + T.t('translate', [[0, '0 0'], [t0, '0 0'],
        [t0 + 0.45, `${(c * r1).toFixed(1)} ${(si * r1).toFixed(1)}`]])
      + `</line>`;
  }
  return s;
}

function atkSlash(T, C, twin) {
  const segs = [[334, 30, 30, 226, 18, 6, 0.02]];
  if (twin) segs.push([36, 46, 326, 218, -13, -5, 0.18]);
  let s = '';
  for (const [x1, y1, x2, y2, b1, b2, t0] of segs) {
    const d = atkCrescent(x1, y1, x2, y2, b1, b2);
    s += `<g opacity="0">` + T.a('opacity', [[0, 0], [t0, 1], [t0 + 0.26, 1], [t0 + 0.5, 0]])
      + `<path d="${d}" fill="${C}" opacity="0.22"/><path d="${d}" fill="#FFFFFF" opacity="0.92"/></g>`
      + `<path d="M${x1} ${y1} L${x2} ${y2}" fill="none" stroke="${C}" stroke-width="7"`
      + ` stroke-linecap="round" stroke-dasharray="460" opacity="0">`
      + T.a('stroke-dashoffset', [[0, 460], [t0, 460], [t0 + 0.11, 0]])
      + T.a('opacity', [[0, 0], [t0, 0.4], [t0 + 0.28, 0.2], [t0 + 0.55, 0]]) + `</path>`;
  }
  return s + atkSpark(T, 5, 24, 58, '#FFFFFF', 0.18, ATK_CX, ATK_CY, 15, 2);
}

function atkThrust(T, C) {
  return `<g opacity="0">` + T.a('opacity', [[0, 0], [0.03, 1], [0.4, 1], [0.52, 0]])
    + `<g>` + T.t('translate', [[0, '-300 0'], [0.06, '-300 0'], [0.32, '0 0'], [0.4, '14 0']], '')
    + `<path d="M20 140 L196 140" stroke="${C}" stroke-width="4"/>`
    + `<path d="M196 132 L226 140 L196 148 Z" fill="#FFFFFF"/>`
    + `<path d="M50 140 L170 140" stroke="#FFFFFF" stroke-width="10" opacity="0.2"/></g></g>`
    + `<path d="M-20 140 L380 140" stroke="${C}" stroke-width="2" opacity="0">`
    + T.a('opacity', [[0, 0], [0.3, 0.7], [0.7, 0]]) + `</path>`
    + `<ellipse cx="212" cy="140" rx="8" ry="8" fill="none" stroke="#FFFFFF" stroke-width="3.5" opacity="0">`
    + T.a('rx', [[0, 8], [0.3, 8], [0.75, 76]]) + T.a('ry', [[0, 8], [0.3, 8], [0.75, 58]])
    + T.a('opacity', [[0, 0], [0.3, 1], [0.7, 0]]) + `</ellipse>`
    + atkSpark(T, 5, 22, 60, '#FFFFFF', 0.32, 212, 140, 30, 2);
}

function atkHoly(T, C, U) {
  let sp = '';
  for (const [x, y0, y1, r, t0] of [[140, 216, 84, 2.6, 0.12], [220, 226, 74, 2.2, 0.2],
                                    [190, 234, 100, 2, 0.3]]) {
    sp += `<circle cx="${x}" cy="${y0}" r="${r}" fill="#FFFFFF" opacity="0">`
      + T.a('cy', [[0, y0], [t0, y0], [1.15, y1]])
      + T.a('opacity', [[0, 0], [t0, 0.9], [0.8, 0.8], [1.15, 0]]) + `</circle>`;
  }
  return `<defs><linearGradient id="ahg${U}" x1="0" y1="0" x2="0" y2="1">`
    + `<stop offset="0" stop-color="#FFFFFF" stop-opacity="0.9"/>`
    + `<stop offset="0.6" stop-color="${C}" stop-opacity="0.5"/>`
    + `<stop offset="1" stop-color="${C}" stop-opacity="0"/></linearGradient>`
    + `<radialGradient id="ahf${U}"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.7"/>`
    + `<stop offset="1" stop-color="${C}" stop-opacity="0"/></radialGradient></defs>`
    + `<g opacity="0">` + T.a('opacity', [[0, 0], [0.16, 1], [0.9, 1], [1.3, 0]])
    + `<g transform="translate(${ATK_CX} 0)">`
    + T.t('scale', [[0, '0.12 1'], [0.28, '1 1'], [1.3, '1.04 1']])
    + `<polygon points="-30,-10 30,-10 64,236 -64,236" fill="url(#ahg${U})"/>`
    + `<polygon points="-8,-10 8,-10 18,236 -18,236" fill="#FFFFFF" opacity="0.5"/></g>`
    + `<ellipse cx="${ATK_CX}" cy="4" rx="60" ry="26" fill="url(#ahf${U})"/>`
    + `<ellipse cx="${ATK_CX}" cy="232" rx="14" ry="5" fill="none" stroke="#FFFFFF" stroke-width="2.5">`
    + T.a('rx', [[0, 14], [0.24, 14], [1.2, 104]]) + T.a('ry', [[0, 5], [0.24, 5], [1.2, 28]])
    + T.a('opacity', [[0, 0], [0.24, 0.9], [0.95, 0]]) + `</ellipse>` + sp + `</g>`;
}

function atkImpact(T, C) {
  const ring = (t0, col, w) =>
    `<circle cx="${ATK_CX}" cy="${ATK_CY}" r="10" fill="none" stroke="${col}" stroke-width="${w}" opacity="0">`
    + T.a('r', [[0, 10], [t0, 10], [t0 + 0.9, 126]])
    + T.a('stroke-width', [[0, w], [t0, w], [t0 + 0.9, Math.max(1, w - 3.5)]])
    + T.a('opacity', [[0, 0], [t0, 1], [t0 + 0.85, 0]]) + `</circle>`;
  return `<circle cx="${ATK_CX}" cy="${ATK_CY}" r="8" fill="#FFFFFF" opacity="0">`
    + T.a('r', [[0, 8], [0.16, 44], [0.4, 10]])
    + T.a('opacity', [[0, 0], [0.07, 0.9], [0.4, 0]]) + `</circle>`
    + ring(0.02, '#FFFFFF', 7) + ring(0.14, '#DDAACC', 5) + ring(0.28, C, 4);
}

// 룬은 폰트에 의존하면 글리프 없는 환경에서 두부가 된다 → path로 직접 그린다
const ATK_RUNE = [
  'M-4 -7 L-4 7 M-4 -7 L4 0 L-4 1', 'M-4 -7 L-4 7 M-4 -7 L4 -1 M-4 0 L4 7',
  'M-4 -7 L-4 7 M4 -7 L-4 0 L4 7', 'M-4 -7 L4 7 M4 -7 L-4 7',
  'M-4 -7 L-4 7 M4 -7 L4 7 M-4 -3 L4 3', 'M0 -7 L0 7 M-4 -4 L4 -4 M-4 4 L4 4',
  'M-4 7 L0 -7 L4 7 M-2 2 L2 2',
];

function atkMagic(T, C, C2) {
  const poly = (off) => [0, 120, 240].map(a => {
    const r = (a + off) * Math.PI / 180;
    return `${(Math.cos(r) * 62).toFixed(1)},${(Math.sin(r) * 62).toFixed(1)}`;
  }).join(' ');
  const hu = poly(-90), hd = poly(90);
  let ru = '';
  for (let i = 0; i < 14; i++) {
    const a = i * 360 / 14 * Math.PI / 180;
    const x = Math.cos(a) * 76, y = Math.sin(a) * 76;
    ru += `<g transform="rotate(${(a * 180 / Math.PI + 90).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})`
      + ` translate(${x.toFixed(1)} ${y.toFixed(1)})"><path d="${ATK_RUNE[i % 7]}" fill="none"`
      + ` stroke="${C2}" stroke-width="1.7" stroke-linecap="round"/></g>`;
  }
  return `<g transform="translate(${ATK_CX} ${ATK_CY})" opacity="0">`
    + T.a('opacity', [[0, 0], [0.12, 1], [1.0, 1], [1.4, 0]])
    + `<g>` + T.t('rotate', [[0, 0], [0.5, 160], [1.4, 320]])
    + T.t('scale', [[0, '0.15'], [0.26, '1'], [1.0, '1.05'], [1.4, '1.35']])
    + `<circle r="92" fill="none" stroke="${C}" stroke-width="4"/>`
    + `<circle r="86" fill="none" stroke="${C2}" stroke-width="1.2" opacity="0.7"/>`
    + `<circle r="64" fill="none" stroke="${C}" stroke-width="1.6" opacity="0.8"/>`
    + `<circle r="26" fill="none" stroke="#FFFFFF" stroke-width="1.4" opacity="0.6"/>`
    + `<polygon points="${hu}" fill="none" stroke="#DDAAEE" stroke-width="2.6"/>`
    + `<polygon points="${hd}" fill="none" stroke="#DDAAEE" stroke-width="2.6"/>${ru}</g>`
    + `<g>` + T.t('rotate', [[0, 0], [1.4, -240]])
    + `<circle r="46" fill="none" stroke="${C2}" stroke-width="2" opacity="0.65"/>`
    + `<polygon points="${hd}" fill="none" stroke="${C2}" stroke-width="1.8" opacity="0.7"/></g></g>`
    + atkSpark(T, 10, 30, 104, C2, 0.3, ATK_CX, ATK_CY, 18, 2.2);
}

function atkEffect(ef, T, C, C2, U) {
  if (ef === 'slash') return atkSlash(T, C, false);
  if (ef === 'slash2') return atkSlash(T, C, true);
  if (ef === 'thrust') return atkThrust(T, C);
  if (ef === 'holy') return atkHoly(T, C, U);
  if (ef === 'impact') return atkImpact(T, C);
  if (ef === 'magic') return atkMagic(T, C, C2);
  return '';
}

const ATK_EC = {
  slash: ['#FF6699', '#FFFFFF'], slash2: ['#FF6699', '#FFFFFF'],
  thrust: ['#DDAACC', '#FFFFFF'], holy: ['#CCAA88', '#FFFFFF'],
  impact: ['#8888CC', '#DDAACC'], magic: ['#884499', '#00BBDD'],
};

function atkUid(params) {
  let h = 5381;
  const s = params.toString();
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return 'a' + h.toString(36);
}

function atkNum(v, def) { const n = parseFloat(v); return Number.isFinite(n) ? n : def; }

function renderAtk(params, dataURI, autoOri, errMsg, fontCss) {
  const oRaw = (params.get('o') || '').trim().toLowerCase();
  const ori = CAM_IMG[oRaw] ? oRaw : (CAM_IMG[autoOri] ? autoOri : 'sq');
  const [W, H] = CAM_IMG[ori];
  const U = atkUid(params);

  const cf = (params.get('cr') || 'c').split('\u00a7');
  const [par] = CAM_ANCHOR[(cf[0] || 'c').trim().toLowerCase()] || CAM_ANCHOR.c;

  let lay = parseInt(params.get('lay') || '1', 10);
  if (!(lay >= 1 && lay <= 3)) lay = 1;
  const scrim = (params.get('sc') || '1') !== '0';

  let ef = (params.get('ef') || 'slash').trim().toLowerCase();
  if (ef === '0' || ef === 'none') ef = '';
  else if (!ATK_FX_LIST.includes(ef)) ef = 'slash';

  const [dc1, dc2] = ATK_EC[ef] || ATK_EC.slash;
  const C = camHex(params.get('ec')) || CAM_PRESETS[(params.get('ec') || '').trim().toLowerCase()] || dc1;
  const C2 = camHex(params.get('ec2')) || CAM_PRESETS[(params.get('ec2') || '').trim().toLowerCase()] || dc2;
  const DC = camHex(params.get('dc')) || CAM_PRESETS[(params.get('dc') || '').trim().toLowerCase()] || C;

  const thf = (params.get('th') || '').split('\u00a7');
  const bgCol = (thf.length >= 2 && thf[1]) ? (camHex(thf[1]) || CAM_PRESETS[thf[1].trim().toLowerCase()] || '#000000') : '#000000';
  const accCol = (thf.length >= 3 && thf[2]) ? (camHex(thf[2]) || CAM_PRESETS[thf[2].trim().toLowerCase()] || C) : C;

  const lp = Math.max(0, Math.min(120, atkNum(params.get('lp'), 10)));
  const T = atkTimer(lp);

  const shake = (params.get('sh') || '1') !== '0';
  const hitOn = (params.get('hit') || '1') !== '0';

  // HP: 이전§이후§최대. 한 필드면 정지컷(애니 없음)
  const hf = (params.get('hp') || '').split('\u00a7').map(v => v.trim());
  const hbOn = (params.get('hb') || '1') !== '0' && hf[0] !== '';
  let hMax = atkNum(hf[2], NaN), hPrev = atkNum(hf[0], NaN), hNow = atkNum(hf[1], NaN);
  if (!Number.isFinite(hMax)) hMax = Number.isFinite(hPrev) ? Math.max(hPrev, 100) : 100;
  if (!Number.isFinite(hPrev)) hPrev = hMax;
  if (!Number.isFinite(hNow)) hNow = hPrev;          // 한 필드 = 정지컷
  const rPrev = Math.max(0, Math.min(1, hPrev / (hMax || 1)));
  const rNow = Math.max(0, Math.min(1, hNow / (hMax || 1)));

  const nm = esc((params.get('nm') || '').trim()).slice(0, 40);
  const rk = esc((params.get('rk') || '').trim()).slice(0, 20);
  const dmgRaw = (params.get('dmg') || '').trim();
  const dmgTxt = dmgRaw === '' ? '' : (/^miss$/i.test(dmgRaw) ? 'MISS' : '-' + esc(dmgRaw).slice(0, 12));

  const dpf = (params.get('dp') || '').split('\u00a7');
  const dpx = Math.max(0, Math.min(100, atkNum(dpf[0], 50)));
  const dpy = Math.max(0, Math.min(100, atkNum(dpf[1], lay === 3 ? 52 : 46)));

  const FT = fontCss ? `'WGal11',monospace` : 'monospace';
  const FT2 = fontCss ? `'WGal14',monospace` : 'monospace';
  const k = Math.max(W / ATK_VW, H / ATK_VH);        // 균등 스케일 (원이 타원 되지 않게)
  const ox = (W - ATK_VW * k) / 2, oy = (H - ATK_VH * k) / 2;
  const S = W / 1024;                                // UI 치수 기준 배율

  let s = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"`
    + ` viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`;
  if (fontCss) s += `<defs><style>${fontCss}</style></defs>`;
  s += `<defs><linearGradient id="asT${U}" x1="0" y1="0" x2="0" y2="1">`
    + `<stop offset="0" stop-color="#000000" stop-opacity="0.85"/>`
    + `<stop offset="1" stop-color="#000000" stop-opacity="0"/></linearGradient>`
    + `<linearGradient id="asB${U}" x1="0" y1="1" x2="0" y2="0">`
    + `<stop offset="0" stop-color="#000000" stop-opacity="0.88"/>`
    + `<stop offset="1" stop-color="#000000" stop-opacity="0"/></linearGradient></defs>`;
  s += `<rect width="${W}" height="${H}" fill="${bgCol}"/>`;

  if (errMsg) {
    return s + `<text x="${W / 2}" y="${H / 2}" text-anchor="middle" font-family="monospace"`
      + ` font-size="${Math.round(34 * S)}" fill="#DDAACC">${esc(errMsg)}</text></svg>`;
  }

  // 흔들림 레이어: 이미지 + 이펙트 + 피격 틴트
  s += `<g>`;
  if (shake) s += T.t('translate', [[0, '0 0'], [0.05, `${-8 * S} ${5 * S}`], [0.1, `${7 * S} ${-6 * S}`],
    [0.16, `${-6 * S} ${4 * S}`], [0.22, `${5 * S} ${-3 * S}`], [0.3, `${-2 * S} ${S}`], [0.38, '0 0']], '');
  if (dataURI) {
    s += `<image x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="${par} slice"`
      + ` href="${dataURI}" xlink:href="${dataURI}"/>`;
  }
  if (ef) {
    s += `<g transform="translate(${ox.toFixed(2)} ${oy.toFixed(2)}) scale(${k.toFixed(4)})">`
      + atkEffect(ef, T, C, C2, U) + `</g>`;
  }
  if (hitOn && ef) {
    s += `<rect width="${W}" height="${H}" fill="#EE1166" opacity="0">`
      + T.a('opacity', [[0, 0], [0.04, 0.5], [0.1, 0], [0.15, 0.3], [0.24, 0]]) + `</rect>`;
  }
  s += `</g>`;

  // ── UI ──
  const TX = (x, y, txt, size, fill, anchor) =>
    `<text x="${x}" y="${y}" text-anchor="${anchor || 'start'}" font-family="${FT}"`
    + ` font-size="${size}" fill="${fill}" stroke="#000000" stroke-width="${Math.max(2, 3 * S)}"`
    + ` paint-order="stroke" stroke-linejoin="round">${txt}</text>`;

  const BAR = (x, y, bw, bh, rad) => {
    const inner = bw - 3 * S;
    return `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="${rad}" fill="#111111"`
      + ` stroke="#FFFFFF" stroke-width="${1.5 * S}"/>`
      + `<rect x="${x + 1.5 * S}" y="${y + 1.5 * S}" width="${inner}" height="${bh - 3 * S}"`
      + ` rx="${Math.max(0, rad - S)}" fill="#5a3540"/>`
      + `<rect x="${x + 1.5 * S}" y="${y + 1.5 * S}" width="${(inner * rPrev).toFixed(1)}"`
      + ` height="${bh - 3 * S}" rx="${Math.max(0, rad - S)}" fill="#22CC55">`
      + (rNow < rPrev
        ? T.a('width', [[0, (inner * rPrev).toFixed(1)], [0.2, (inner * rPrev).toFixed(1)],
          [0.7, (inner * rNow).toFixed(1)]])
        : '')
      + `</rect>`;
  };

  const hpTxt = hbOn ? `${Math.round(hNow)} / ${Math.round(hMax)}` : '';

  if (lay === 1) {
    const sh1 = rk ? 158 * S : 82 * S;
    if (scrim) s += `<rect x="0" y="${H - sh1}" width="${W}" height="${sh1}" fill="url(#asB${U})"/>`;
    if (nm) s += TX(60 * S, H - 58 * S, nm, 38 * S, '#FFFFFF');
    if (rk) s += TX(60 * S, H - 112 * S, '[' + rk + ']', 28 * S, accCol);
    if (hbOn) {
      s += TX(W - 60 * S, H - 58 * S, hpTxt, 38 * S, accCol, 'end');
      s += BAR(60 * S, H - 52 * S, W - 120 * S, 34 * S, 0);
    }
  } else if (lay === 2) {
    const PH = 210 * S;
    if (scrim) {
      s += `<rect x="0" y="${H - PH}" width="${W}" height="${PH}" fill="#000000" opacity="0.82"/>`
        + `<rect x="0" y="${H - PH}" width="${W}" height="${4 * S}" fill="${accCol}"/>`;
    }
    if (nm) {
      s += TX(46 * S, H - PH + 58 * S, 'TARGET', 36 * S, accCol);
      s += TX(200 * S, H - PH + 58 * S, nm, 40 * S, '#FFFFFF');
    }
    if (rk) s += TX(W - 46 * S, H - PH + 58 * S, '[' + rk + ']', 34 * S, '#CCAA88', 'end');
    if (hbOn) {
      s += TX(46 * S, H - PH + 120 * S, 'HP', 34 * S, '#BB6688');
      s += TX(W - 46 * S, H - PH + 120 * S, hpTxt, 34 * S, '#FFFFFF', 'end');
      s += BAR(46 * S, H - PH + 138 * S, W - 92 * S, 40 * S, 20 * S);
    }
  } else {
    if (scrim) s += `<rect x="0" y="0" width="${W}" height="${200 * S}" fill="url(#asT${U})"/>`;
    if (nm) s += TX(W / 2, 58 * S, nm, 40 * S, '#FFFFFF', 'middle');
    if (hbOn) {
      s += BAR(86 * S, 74 * S, W - 172 * S, 20 * S, 10 * S);
      s += TX(W / 2, 138 * S, (rk ? rk + '  \u00b7  ' : '') + hpTxt, 29 * S, accCol, 'middle');
    } else if (rk) {
      s += TX(W / 2, 96 * S, rk, 29 * S, accCol, 'middle');
    }
  }

  // 데미지 숫자 (최상단)
  if (dmgTxt) {
    const dx = W * dpx / 100, dy = H * dpy / 100;
    s += `<g opacity="0">` + T.a('opacity', [[0, 0], [0.1, 1]])
      + `<g>` + T.t('translate', [[0, `${dx} ${dy + 62 * S}`], [0.14, `${dx} ${dy - 46 * S}`],
        [0.26, `${dx} ${dy}`]], '')
      + `<text x="0" y="0" text-anchor="middle" font-family="${FT2}" font-size="${114 * S}"`
      + ` font-weight="700" fill="${DC}" stroke="#180008" stroke-width="${14 * S}"`
      + ` paint-order="stroke" stroke-linejoin="round">${dmgTxt}</text></g></g>`;
  }

  return s + `</svg>`;
}

const RENDERERS = {
  'cam': renderCam,
  'rec': renderRec,
  'pol': renderPol,
  'cctv': renderCctv,
  'talk': renderTalk,
  'char': renderChar,
  'id': renderId,
  'frame': renderFrame,
  'scope': renderScope,
  'atk': renderAtk,
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

    // char은 img=가 '|' 구분 인물별 목록이라 상단 단일 로드를 건너뛴다 (렌더러가 직접 로드)
    const { uri, dim, err } = t === 'char'
      ? { uri: null, dim: null, err: null }
      : await loadImg(params.get('img'));
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
