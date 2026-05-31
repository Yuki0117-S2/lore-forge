// m.winter0.workers.dev — R2 기반 이미지 합성 (SVG 출력)
// ?t=worldmap
//
// 지원 파라미터:
//   &world=test            (생략 시 at/path/p의 PLACES에서 자동 추론, 그것도 없으면 'test')
//   &at=장소명              내 위치 (PLACES 룩업, alias 지원)
//   &x=&y=                 내 위치 직접 좌표 (디버깅용)
//   &p=장소§이름§관계|...    다른 사람들 (멀티플레이어)
//                           관계: 아군(또는 비움) / 적 / 파티 / 중립
//                           장소 자리에 xNNNyNNN 박으면 직접 좌표
//   &path=A,B,C            이동 경로 (마지막이 목적지, 중간은 경유지)
//                           각 항목은 장소명 또는 xNNNyNNN
//                           나가 있으면 나→A→B→C 점선, 없으면 A→B→C
//
// 예시:
//   /?t=worldmap&at=center&path=topright
//   /?t=worldmap&at=center&path=upperleft,topright,lowerright
//   /?t=worldmap&at=center&p=topright§오크§적&path=lowerright

// ════════════════════════════════════════════
//  공용 헬퍼 (worker-st 컨벤션)
// ════════════════════════════════════════════

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function safeInt(v, fallback = 0, min = -10000, max = 10000) {
  const n = parseInt(v);
  if (isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function mimeFromKey(key) {
  const k = key.toLowerCase();
  if (k.endsWith('.png'))  return 'image/png';
  if (k.endsWith('.jpg') || k.endsWith('.jpeg')) return 'image/jpeg';
  if (k.endsWith('.webp')) return 'image/webp';
  if (k.endsWith('.gif'))  return 'image/gif';
  return 'image/png';
}

async function r2ToDataURI(env, key) {
  const obj = await env.MAPS.get(key);
  if (!obj) return null;
  const buf = await obj.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return `data:${mimeFromKey(key)};base64,${btoa(binary)}`;
}

// ════════════════════════════════════════════
//  WORLDS / PLACES 매핑
// ════════════════════════════════════════════

const WORLDS = {
  test: { key: 'test-grid.png', w: 1024, h: 1024 },
  // 향후: aincrad: { key: 'world/aincrad.webp', w: 1024, h: 1024 },
};

const PLACES = {
  'center':     { world: 'test', x: 512, y: 512, alias: ['중앙', 'middle'] },
  'upperleft':  { world: 'test', x: 100, y: 100, alias: ['좌상단'] },
  'lowerright': { world: 'test', x: 900, y: 900, alias: ['우하단'] },
  'topright':   { world: 'test', x: 900, y: 100, alias: ['우상단'] },
  'bottomleft': { world: 'test', x: 100, y: 900, alias: ['좌하단'] },
};

function findPlace(name) {
  if (!name) return null;
  if (PLACES[name]) return { ...PLACES[name], key: name };
  for (const [key, p] of Object.entries(PLACES)) {
    if (p.alias && p.alias.includes(name)) {
      return { ...p, key };
    }
  }
  return null;
}

// ════════════════════════════════════════════
//  관계별 색상 매핑 (멀티플레이어)
// ════════════════════════════════════════════

const REL_COLOR = {
  '아군':   '#8889CD',
  '적':     '#EE1166',
  '파티':   '#00BBDD',
  '중립':   '#CCAA88',
};
const ME_RING    = '#BB6688';
const ME_DOT     = '#DDAACC';
const STROKE     = '#0d0f1f';
const PATH_COLOR = '#FF7722';   // 점선/경유지/목적지 통일 (오렌지)

function relColor(rel) {
  return REL_COLOR[rel] || REL_COLOR['아군'];
}

// 참조(장소명 또는 xNNNyNNN) → 좌표
function resolveRef(ref) {
  const m = ref.match(/^x(\d+)y(\d+)$/);
  if (m) return { x: parseInt(m[1]), y: parseInt(m[2]), refWorld: null };
  const place = findPlace(ref);
  if (place) return { x: place.x, y: place.y, refWorld: place.world };
  return null;
}

// ════════════════════════════════════════════
//  멀티플레이어 파싱 (p=...)
// ════════════════════════════════════════════

function parsePartners(pParam) {
  if (!pParam) return [];
  return pParam.split('|').map(rec => {
    const f = rec.split('§');
    return {
      ref:      (f[0] || '').trim(),
      name:     (f[1] || '').trim(),
      relation: (f[2] || '').trim() || '아군',
    };
  }).filter(r => r.ref);
}

// ════════════════════════════════════════════
//  경로 파싱 (path=A,B,C)
// ════════════════════════════════════════════

function parsePath(pathParam) {
  if (!pathParam) return [];
  return pathParam.split(',').map(s => s.trim()).filter(s => s);
}

// ════════════════════════════════════════════
//  겹침 분산 (시계 12시부터 부채꼴) — 사람 마커만
// ════════════════════════════════════════════

function distributeMarkers(markers) {
  const R = 25;
  const groups = new Map();
  markers.forEach(m => {
    const key = `${m.origX},${m.origY}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(m);
  });

  groups.forEach(group => {
    if (group.length === 1) {
      group[0].x = group[0].origX;
      group[0].y = group[0].origY;
      return;
    }
    const me = group.find(m => m.isMe);
    const others = group.filter(m => !m.isMe);
    const ordered = me ? [me, ...others] : others;

    const step = (2 * Math.PI) / ordered.length;
    ordered.forEach((m, i) => {
      const angle = i * step - Math.PI / 2;
      m.x = m.origX + R * Math.cos(angle);
      m.y = m.origY + R * Math.sin(angle);
    });
  });
}

// ════════════════════════════════════════════
//  렌더링 — 마커
// ════════════════════════════════════════════

function renderMyMarker(x, y, label) {
  return `
<circle cx="${x}" cy="${y}" r="20" fill="none" stroke="${ME_RING}" stroke-width="3" opacity="0.55">
  <animate attributeName="r" values="20;38;20" dur="1.8s" repeatCount="indefinite"/>
  <animate attributeName="opacity" values="0.55;0;0.55" dur="1.8s" repeatCount="indefinite"/>
</circle>
<circle cx="${x}" cy="${y}" r="11" fill="${ME_RING}" stroke="${STROKE}" stroke-width="2.5"/>
<circle cx="${x}" cy="${y}" r="4"  fill="${ME_DOT}"/>
<text x="${x + 22}" y="${y + 8}"
      font-family="'Courier New',monospace" font-size="22" font-weight="900"
      fill="${ME_DOT}" stroke="${STROKE}" stroke-width="5" paint-order="stroke">${esc(label)}</text>`;
}

function renderOtherMarker(m) {
  const color = relColor(m.relation);
  return `
<circle cx="${m.x}" cy="${m.y}" r="8" fill="${color}" stroke="${STROKE}" stroke-width="2"/>
<text x="${m.x + 14}" y="${m.y + 6}"
      font-family="'Courier New',monospace" font-size="16" font-weight="900"
      fill="${color}" stroke="${STROKE}" stroke-width="4" paint-order="stroke">${esc(m.name)}</text>`;
}

// ════════════════════════════════════════════
//  렌더링 — 경로 (점선) / 경유지(다이아몬드) / 목적지(깃발)
// ════════════════════════════════════════════

// 점선 라인 + 흐름 애니메이션
function renderPathLine(points) {
  if (points.length < 2) return '';
  const d = 'M' + points.map(p => `${p.x},${p.y}`).join(' L');
  return `
<path d="${d}" stroke="${PATH_COLOR}" stroke-width="3" stroke-dasharray="10 6" fill="none" stroke-linecap="round">
  <animate attributeName="stroke-dashoffset" from="0" to="-16" dur="0.8s" repeatCount="indefinite"/>
</path>`;
}

// 경유지 다이아몬드 (외곽 빈 + 내부 작은 다이아몬드)
function renderWaypoint(x, y) {
  const S = 11; // 외곽 꼭짓점 거리
  const s = 4;  // 내부 꼭짓점 거리
  return `
<polygon points="${x},${y - S} ${x + S},${y} ${x},${y + S} ${x - S},${y}"
         fill="${STROKE}" stroke="${PATH_COLOR}" stroke-width="2.5"/>
<polygon points="${x},${y - s} ${x + s},${y} ${x},${y + s} ${x - s},${y}"
         fill="${PATH_COLOR}"/>`;
}

// 목적지 깃발 (베이스 점 + 폴 + 천)
function renderDestination(x, y) {
  const POLE_H = 36;
  const FLAG_W = 30;
  const top    = y - POLE_H;
  return `
<line x1="${x}" y1="${y}" x2="${x}" y2="${top}" stroke="${PATH_COLOR}" stroke-width="2.5"/>
<polygon points="${x},${top} ${x + FLAG_W},${top + 6} ${x},${top + 18}"
         fill="${PATH_COLOR}" stroke="${STROKE}" stroke-width="1.5"/>
<circle cx="${x}" cy="${y}" r="4" fill="${PATH_COLOR}"/>`;
}

// ════════════════════════════════════════════
//  WORLDMAP
// ════════════════════════════════════════════

async function renderWorldmap(params, env) {
  const atRaw    = params.get('at') || '';
  const xParam   = params.get('x');
  const yParam   = params.get('y');
  const pParam   = params.get('p') || '';
  const pathRaw  = params.get('path') || '';
  let   worldKey = params.get('world') || '';

  const markers = [];

  // 1) 내 위치
  if (xParam !== null && yParam !== null) {
    const ix = safeInt(xParam, 0, 0, 10000);
    const iy = safeInt(yParam, 0, 0, 10000);
    markers.push({ origX: ix, origY: iy, isMe: true, label: `(${ix},${iy})` });
    if (!worldKey) worldKey = 'test';
  } else if (atRaw) {
    const place = findPlace(atRaw);
    if (place) {
      markers.push({ origX: place.x, origY: place.y, isMe: true, label: atRaw });
      if (!worldKey) worldKey = place.world;
    }
  }

  // 2) 다른 사람들
  const partners = parsePartners(pParam);
  for (const p of partners) {
    const pos = resolveRef(p.ref);
    if (pos) {
      markers.push({
        origX: pos.x, origY: pos.y,
        isMe: false,
        name: p.name,
        relation: p.relation,
      });
      if (!worldKey && pos.refWorld) worldKey = pos.refWorld;
    }
  }

  // 3) 경로 (경유지 + 목적지)
  const pathRefs = parsePath(pathRaw);
  const waypoints = [];
  for (const ref of pathRefs) {
    const pos = resolveRef(ref);
    if (pos) {
      waypoints.push({ x: pos.x, y: pos.y });
      if (!worldKey && pos.refWorld) worldKey = pos.refWorld;
    }
  }

  // 4) 월드 확정
  if (!worldKey) worldKey = 'test';
  const world = WORLDS[worldKey];
  if (!world) return null;

  // 5) 사람 마커 겹침 분산
  distributeMarkers(markers);

  // 6) 점선 좌표 (나가 있으면 시작점에 추가)
  const meMarker = markers.find(m => m.isMe);
  const linePoints = [];
  if (meMarker && waypoints.length > 0) {
    linePoints.push({ x: meMarker.origX, y: meMarker.origY });
  }
  linePoints.push(...waypoints);

  // 7) R2 이미지
  const dataURI = await r2ToDataURI(env, world.key);
  if (!dataURI) return null;

  // 8) SVG 조립
  //    Z-order: 배경 → 점선 → 경유지(다이아) → 목적지(깃발) → 다른 사람들 → 나
  const W = world.w, H = world.h;
  const DISP = 750;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${DISP}" height="${DISP}" viewBox="0 0 ${W} ${H}">
<image href="${dataURI}" x="0" y="0" width="${W}" height="${H}"/>`;

  // 점선
  if (linePoints.length >= 2) {
    svg += renderPathLine(linePoints);
  }

  // 경유지 다이아몬드 (마지막 제외)
  for (let i = 0; i < waypoints.length - 1; i++) {
    svg += renderWaypoint(waypoints[i].x, waypoints[i].y);
  }

  // 목적지 깃발
  if (waypoints.length > 0) {
    const dest = waypoints[waypoints.length - 1];
    svg += renderDestination(dest.x, dest.y);
  }

  // 다른 사람들
  for (const m of markers) {
    if (!m.isMe) svg += renderOtherMarker(m);
  }

  // 나
  for (const m of markers) {
    if (m.isMe) svg += renderMyMarker(m.x, m.y, m.label);
  }

  svg += `</svg>`;
  return svg;
}

// ════════════════════════════════════════════
//  FETCH
// ════════════════════════════════════════════

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const params = url.searchParams;
    const t = params.get('t') || '';

    let svg;
    if (t === 'worldmap') {
      svg = await renderWorldmap(params, env);
      if (!svg) {
        return new Response(
          'worldmap: 잘못된 파라미터 또는 R2 fetch 실패\n\n' +
          '사용법:\n' +
          '  ?t=worldmap&at=center\n' +
          '  ?t=worldmap&at=중앙&p=upperleft§지나|topright§오크§적\n' +
          '  ?t=worldmap&at=center&path=upperleft,topright,lowerright\n' +
          '  ?t=worldmap&world=test&x=500&y=500\n' +
          '  ?t=worldmap&world=test (마커 없는 월드 뷰)\n\n' +
          '관계 종류: 아군(생략 가능) / 적 / 파티 / 중립\n' +
          '경로 path: 콤마 구분, 마지막이 목적지(깃발), 중간은 경유지(다이아몬드)\n' +
          '등록된 장소: center / upperleft / lowerright / topright / bottomleft\n' +
          '한글 alias:  중앙 / 좌상단 / 우하단 / 우상단 / 좌하단',
          { status: 400, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
        );
      }
    } else {
      return new Response('사용 가능: ?t=worldmap', {
        status: 400, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }

    return new Response(svg, {
      headers: { 'content-type': 'image/svg+xml', 'cache-control': 'no-cache' }
    });
  }
};
