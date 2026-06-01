// m.winter0.workers.dev — R2 기반 이미지 합성 (SVG 출력)
// ?t=worldmap
// ?t=meta       메타데이터 JSON 반환 (CORS 허용)
//
// 지원 파라미터 (worldmap):
//   &world=floor1          월드 키 (또는 한글 alias: '1층'). 생략 시 자동 추론
//   &at=장소명              내 위치 (PLACES 룩업, alias 지원)
//   &x=&y=                 내 위치 직접 좌표 (디버깅용)
//   &p=장소§이름§관계|...    다른 사람들 (멀티플레이어)
//                           관계: 아군(또는 비움) / 적 / 파티 / 중립
//                           장소 자리에 xNNNyNNN 박으면 직접 좌표
//   &path=A,B,C            이동 경로 (마지막이 목적지, 중간은 경유지)
//   &labels=on             해당 월드의 모든 PLACES 라벨 자동 표시
//
// 예시:
//   /?t=worldmap&world=1층&at=center
//   /?t=worldmap&world=floor4&labels=on        (4층 모든 장소 라벨 표시)
//   /?t=worldmap&world=floor5&x=500&y=400      (좌표 찍기 디버그)
//   /?t=meta                                    (map.html이 fetch로 사용)

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
//  WORLDS / PLACES / GROUPS 매핑
// ════════════════════════════════════════════

const WORLDS = {
  // 검증용
  test:    { src: 'test-grid.png',  w: 1024, h: 1024, alias: [],      group: 'test' },

  // 아인크라드 10층
  floor1:  { src: 'world/f01.webp', w: 1024, h: 1024, alias: ['1층',  '여명의 평원'],                 group: 'aincrad' },
  floor2:  { src: 'world/f02.webp', w: 1024, h: 1024, alias: ['2층',  '푸른 안개의 호수'],            group: 'aincrad' },
  floor3:  { src: 'world/f03.webp', w: 1024, h: 1024, alias: ['3층',  '바닷바람 무역항'],             group: 'aincrad' },
  floor4:  { src: 'world/f04.webp', w: 1024, h: 1024, alias: ['4층',  '요정의 물거울 쉼터'],          group: 'aincrad' },
  floor5:  { src: 'world/f05.webp', w: 1024, h: 1024, alias: ['5층',  '백야의 왕도'],                 group: 'aincrad' },
  floor6:  { src: 'world/f06.webp', w: 1024, h: 1024, alias: ['6층',  '고목의 정령 숲'],              group: 'aincrad' },
  floor7:  { src: 'world/f07.webp', w: 1024, h: 1024, alias: ['7층',  '단풍과 온천의 산등성이'],      group: 'aincrad' },
  floor8:  { src: 'world/f08.webp', w: 1024, h: 1024, alias: ['8층',  '전운의 요새'],                 group: 'aincrad' },
  floor9:  { src: 'world/f09.webp', w: 1024, h: 1024, alias: ['9층',  '환상의 화원'],                 group: 'aincrad' },
  floor10: { src: 'world/f10.webp', w: 1024, h: 1024, alias: ['10층', '종언의 옥좌'],                 group: 'aincrad' },
};

const PLACES = {
  // 검증용 (test 월드)
  'center':     { world: 'test', x: 512, y: 512, alias: ['중앙', 'middle'] },
  'upperleft':  { world: 'test', x: 100, y: 100, alias: ['좌상단'] },
  'lowerright': { world: 'test', x: 900, y: 900, alias: ['우하단'] },
  'topright':   { world: 'test', x: 900, y: 100, alias: ['우상단'] },
  'bottomleft': { world: 'test', x: 100, y: 900, alias: ['좌하단'] },

  // ─── 1층 : 여명의 평원 ───
  'f1_starter':         { world: 'floor1', x: 512, y: 512, alias: ['개척자의 원형 성채'] },
  'f1_silver_river':    { world: 'floor1', x: 410, y: 530, alias: ['은빛물결 강'] },
  'f1_wheat_village':   { world: 'floor1', x: 220, y: 680, alias: ['풍요의 밀밭 촌락'] },
  'f1_spring_village':  { world: 'floor1', x: 750, y: 660, alias: ['평온의 샘터 마을'] },
  'f1_watcher_tower':   { world: 'floor1', x: 540, y: 100, alias: ['감시자의 탑'] },

  // ─── 2층 : 푸른 안개의 호수 ───
  'f2_stilt_village':   { world: 'floor2', x: 512, y: 500, alias: ['물안개 수상 마을'] },
  'f2_scale_lake':      { world: 'floor2', x: 512, y: 550, alias: ['고요한 비늘 호수'] },
  'f2_ferry_cabin':     { world: 'floor2', x: 730, y: 260, alias: ['외딴 나루터 오두막'] },
  'f2_guardian_tower':  { world: 'floor2', x: 490, y:  80, alias: ['이끼 낀 수호탑'] },

  // ─── 3층 : 바닷바람 무역항 ───
  'f3_port_city':       { world: 'floor3', x: 780, y: 580, alias: ['붉은 지붕의 항구도시'] },
  'f3_ashen_bay':       { world: 'floor3', x: 450, y: 700, alias: ['잿빛 모래 만'] },
  'f3_hilltop':         { world: 'floor3', x: 220, y: 480, alias: ['언덕 위 촌락'] },
  'f3_windmill_farm':   { world: 'floor3', x: 180, y: 260, alias: ['풍차 언덕 농장'] },
  'f3_lighthouse':      { world: 'floor3', x: 180, y: 700, alias: ['길잡이 등대'] },

  // ─── 4층 : 요정의 물거울 쉼터 ───
  'f4_guesthouse':      { world: 'floor4', x: 500, y: 130, alias: ['호숫가 영빈관'] },
  'f4_mirror_lake':     { world: 'floor4', x: 512, y: 500, alias: ['요정의 거울 호수'] },
  'f4_floating_stone':  { world: 'floor4', x: 420, y: 590, alias: ['중앙 부유석'] },
  'f4_jade_mansion':    { world: 'floor4', x: 840, y: 440, alias: ['비취색 저택'] },

  // ─── 5층 : 백야의 왕도 ───
  'f5_palace':          { world: 'floor5', x: 512, y: 450, alias: ['태양왕의 대궁전'] },
  'f5_waterway':        { world: 'floor5', x: 512, y: 530, alias: ['십자 수로'] },
  'f5_garden':          { world: 'floor5', x: 260, y: 170, alias: ['귀족들의 정원'] },
  'f5_training':        { world: 'floor5', x: 800, y: 750, alias: ['기사단 훈련소'] },
  'f5_cathedral':       { world: 'floor5', x: 790, y: 190, alias: ['별빛 대성당'] },

  // ─── 6층 : 고목의 정령 숲 ───
  'f6_stone_plaza':     { world: 'floor6', x: 512, y: 450, alias: ['고대석 판석 광장'] },
  'f6_root_village':    { world: 'floor6', x: 220, y: 400, alias: ['세계수의 뿌리 마을'] },
  'f6_herbalist':       { world: 'floor6', x: 500, y: 800, alias: ['약초꾼의 계단밭'] },
  'f6_altar':           { world: 'floor6', x: 740, y: 250, alias: ['이름 잊힌 자의 제단'] },

  // ─── 7층 : 단풍과 온천의 산등성이 ───
  'f7_market':          { world: 'floor7', x: 450, y: 750, alias: ['홍련의 저잣거리'] },
  'f7_dragon_bath':     { world: 'floor7', x: 760, y: 300, alias: ['솟아오르는 용의 탕'] },
  'f7_paddies':         { world: 'floor7', x: 230, y: 250, alias: ['황금빛 다랑논'] },
  'f7_maple_valley':    { world: 'floor7', x: 450, y: 450, alias: ['단풍잎 계곡'] },
  'f7_fox_hideout':     { world: 'floor7', x: 520, y: 100, alias: ['구미호의 은신처'] },

  // ─── 8층 : 전운의 요새 ───
  'f8_fortress':        { world: 'floor8', x: 512, y: 650, alias: ['강철 맹세의 요새'] },
  'f8_trench':          { world: 'floor8', x: 512, y: 430, alias: ['마르지 않는 참호'] },
  'f8_outpost':         { world: 'floor8', x: 220, y: 340, alias: ['전초기지 야영지'] },
  'f8_siege':           { world: 'floor8', x: 750, y: 340, alias: ['공성 병기 정비소'] },
  'f8_demon_castle':    { world: 'floor8', x: 500, y: 180, alias: ['검은 뿔의 마성'] },

  // ─── 9층 : 환상의 화원 ───
  'f9_greenhouse':      { world: 'floor9', x: 630, y: 460, alias: ['수정 온실 정원'] },
  'f9_eternal_spring':  { world: 'floor9', x: 512, y: 500, alias: ['영원한 봄의 군락'] },
  'f9_petal_manors':    { world: 'floor9', x: 780, y: 730, alias: ['꽃잎 지붕 장원들'] },
  'f9_briar':           { world: 'floor9', x: 512, y: 460, alias: ['가시덤불 미궁'] },

  // ─── 10층 : 종언의 옥좌 ───
  'f10_blood_path':     { world: 'floor10', x: 500, y: 850, alias: ['피의 진입로'] },
  'f10_mana_tower':     { world: 'floor10', x: 180, y: 250, alias: ['부서진 마력탑'] },
  'f10_execution':      { world: 'floor10', x: 800, y: 350, alias: ['버려진 처형장'] },
  'f10_demon_castle':   { world: 'floor10', x: 512, y: 350, alias: ['검붉은 심연의 마왕성'] },
};

// 그룹 메타 — map.html이 카테고리 자동 생성용으로 사용
// 새 세계관 추가 시 여기에 한 줄, WORLDS에 group 필드만 박으면 끝
const GROUPS = {
  test:    { label: '검증용',     icon: '🧪', order: 99 },
  aincrad: { label: '아인크라드', icon: '🗡️', order: 1 },
};

function findWorld(name) {
  if (!name) return null;
  if (WORLDS[name]) return { ...WORLDS[name], key: name };
  for (const [key, w] of Object.entries(WORLDS)) {
    if (w.alias && w.alias.includes(name)) {
      return { ...w, key };
    }
  }
  return null;
}

function findPlace(name, worldContext) {
  if (!name) return null;

  // 1) 정식 키 매칭 — world 컨텍스트 있으면 매칭되는 경우만 채택
  if (PLACES[name]) {
    const p = PLACES[name];
    if (!worldContext || p.world === worldContext) {
      return { ...p, key: name };
    }
  }

  // 2) world 컨텍스트 우선: 같은 world 내에서 alias 매칭
  if (worldContext) {
    for (const [key, p] of Object.entries(PLACES)) {
      if (p.world === worldContext && p.alias && p.alias.includes(name)) {
        return { ...p, key };
      }
    }
  }

  // 3) fallback: world 무관 alias 매칭 (첫 매칭)
  for (const [key, p] of Object.entries(PLACES)) {
    if (p.alias && p.alias.includes(name)) {
      return { ...p, key };
    }
  }

  return null;
}

// PLACE 표시명 — 한글 alias 우선, 없으면 정식 키
function getPlaceDisplayName(key, place) {
  if (place.alias && place.alias.length > 0) {
    const ko = place.alias.find(a => /[\u3131-\uD79D\uAC00-\uD7A3]/.test(a));
    if (ko) return ko;
    return place.alias[0];
  }
  return key;
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
const PLACE_LBL  = '#CCAA88';   // labels=on 배경 라벨 (샌드 톤다운)

function relColor(rel) {
  return REL_COLOR[rel] || REL_COLOR['아군'];
}

// 참조(장소명 또는 xNNNyNNN) → 좌표
function resolveRef(ref, worldContext) {
  const m = ref.match(/^x(\d+)y(\d+)$/);
  if (m) return { x: parseInt(m[1]), y: parseInt(m[2]), refWorld: null };
  const place = findPlace(ref, worldContext);
  if (place) return { x: place.x, y: place.y, refWorld: place.world };
  return null;
}

// ════════════════════════════════════════════
//  META — map.html이 fetch로 가져갈 JSON
// ════════════════════════════════════════════

function renderMeta() {
  return JSON.stringify({
    worlds: WORLDS,
    places: PLACES,
    groups: GROUPS,
    colors: {
      rel: REL_COLOR,
      me_ring: ME_RING,
      me_dot: ME_DOT,
      stroke: STROKE,
      path: PATH_COLOR,
      place_label: PLACE_LBL,
    },
  });
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
<circle cx="${x}" cy="${y}" r="21" fill="none" stroke="${STROKE}" stroke-width="6" opacity="0.45">
  <animate attributeName="r" values="21;40;21" dur="1.8s" repeatCount="indefinite"/>
  <animate attributeName="opacity" values="0.45;0;0.45" dur="1.8s" repeatCount="indefinite"/>
</circle>
<circle cx="${x}" cy="${y}" r="21" fill="none" stroke="${ME_RING}" stroke-width="3" opacity="0.85">
  <animate attributeName="r" values="21;40;21" dur="1.8s" repeatCount="indefinite"/>
  <animate attributeName="opacity" values="0.85;0;0.85" dur="1.8s" repeatCount="indefinite"/>
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

// labels=on: 배경 PLACE 라벨 (작고 톤다운, 마커 아래)
function renderPlaceLabel(x, y, name) {
  return `
<text x="${x}" y="${y + 24}"
      font-family="'Courier New',monospace" font-size="15" font-weight="700"
      fill="${PLACE_LBL}" stroke="${STROKE}" stroke-width="3.5" paint-order="stroke"
      text-anchor="middle">${esc(name)}</text>`;
}

// 월드 타이틀 (좌측 상단, 항상 표시)
// alias가 있으면 ' · ' 로 연결 (예: "1층 · 여명의 평원"), 없으면 정식 키
function renderWorldTitle(world, key) {
  const aliases = (world.alias || []).filter(a => a);
  const title = aliases.length > 0 ? aliases.join(' · ') : key;
  return `
<text x="24" y="44"
      font-family="'Courier New',monospace" font-size="22" font-weight="700"
      fill="${PLACE_LBL}" stroke="${STROKE}" stroke-width="4" paint-order="stroke">${esc(title)}</text>`;
}

// ════════════════════════════════════════════
//  렌더링 — 경로 (점선) / 경유지(다이아몬드) / 목적지(깃발)
// ════════════════════════════════════════════

function renderPathLine(points) {
  if (points.length < 2) return '';
  const d = 'M' + points.map(p => `${p.x},${p.y}`).join(' L');
  return `
<path d="${d}" stroke="${PATH_COLOR}" stroke-width="3" stroke-dasharray="10 6" fill="none" stroke-linecap="round">
  <animate attributeName="stroke-dashoffset" from="0" to="-16" dur="0.8s" repeatCount="indefinite"/>
</path>`;
}

function renderWaypoint(x, y) {
  const S = 11;
  const s = 4;
  return `
<polygon points="${x},${y - S} ${x + S},${y} ${x},${y + S} ${x - S},${y}"
         fill="${STROKE}" stroke="${PATH_COLOR}" stroke-width="2.5"/>
<polygon points="${x},${y - s} ${x + s},${y} ${x},${y + s} ${x - s},${y}"
         fill="${PATH_COLOR}"/>`;
}

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
  const atRaw     = params.get('at') || '';
  const xParam    = params.get('x');
  const yParam    = params.get('y');
  const pParam    = params.get('p') || '';
  const pathRaw   = params.get('path') || '';
  const labelsOn  = params.get('labels') === 'on';
  let   worldRaw  = params.get('world') || '';

  // 사용자가 명시한 world 컨텍스트 (PLACES 룩업 시 우선 매칭용)
  // 입력값(예: '1층') → 정식 키('floor1')로 변환해서 사용
  let worldCtx = null;
  if (worldRaw) {
    const w = findWorld(worldRaw);
    if (w) worldCtx = w.key;
  }

  const markers = [];

  // 1) 내 위치
  if (xParam !== null && yParam !== null) {
    const ix = safeInt(xParam, 0, 0, 10000);
    const iy = safeInt(yParam, 0, 0, 10000);
    markers.push({ origX: ix, origY: iy, isMe: true, label: `(${ix},${iy})` });
  } else if (atRaw) {
    const place = findPlace(atRaw, worldCtx);
    if (place) {
      markers.push({ origX: place.x, origY: place.y, isMe: true, label: atRaw });
      if (!worldRaw) worldRaw = place.world;
    }
  }

  // 2) 다른 사람들
  const partners = parsePartners(pParam);
  for (const p of partners) {
    const pos = resolveRef(p.ref, worldCtx);
    if (pos) {
      markers.push({
        origX: pos.x, origY: pos.y,
        isMe: false,
        name: p.name,
        relation: p.relation,
      });
      if (!worldRaw && pos.refWorld) worldRaw = pos.refWorld;
    }
  }

  // 3) 경로 (경유지 + 목적지)
  const pathRefs = parsePath(pathRaw);
  const waypoints = [];
  for (const ref of pathRefs) {
    const pos = resolveRef(ref, worldCtx);
    if (pos) {
      waypoints.push({ x: pos.x, y: pos.y });
      if (!worldRaw && pos.refWorld) worldRaw = pos.refWorld;
    }
  }

  // 4) 월드 확정 (findWorld 사용 — alias 지원)
  if (!worldRaw) worldRaw = 'test';
  const world = findWorld(worldRaw);
  if (!world) return null;
  const worldKey = world.key;

  // 5) 사람 마커 겹침 분산
  distributeMarkers(markers);

  // 6) 점선 좌표
  const meMarker = markers.find(m => m.isMe);
  const linePoints = [];
  if (meMarker && waypoints.length > 0) {
    linePoints.push({ x: meMarker.origX, y: meMarker.origY });
  }
  linePoints.push(...waypoints);

  // 7) R2 이미지
  const dataURI = await r2ToDataURI(env, world.src);
  if (!dataURI) return null;

  // 8) labels=on: 현재 월드에 속한 모든 PLACES 라벨 수집
  const placeLabels = [];
  if (labelsOn) {
    for (const [pk, p] of Object.entries(PLACES)) {
      // world 매칭: 정식 키 또는 alias 어느 쪽으로든
      const matchKey = p.world === worldKey;
      const matchAlias = world.alias && world.alias.includes(p.world);
      if (matchKey || matchAlias) {
        placeLabels.push({
          x: p.x, y: p.y,
          name: getPlaceDisplayName(pk, p),
        });
      }
    }
  }

  // 9) SVG 조립
  //    Z-order: 배경 → PLACE 라벨(배경 텍스트) → 점선 → 경유지 → 목적지 → 다른 사람들 → 나
  const W = world.w, H = world.h;
  const DISP = 750;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${DISP}" height="${DISP}" viewBox="0 0 ${W} ${H}">
<image href="${dataURI}" x="0" y="0" width="${W}" height="${H}"/>`;

  // 월드 타이틀 (좌상단, 배경 직후)
  svg += renderWorldTitle(world, worldKey);

  // PLACE 배경 라벨
  for (const pl of placeLabels) {
    svg += renderPlaceLabel(pl.x, pl.y, pl.name);
  }

  // 점선
  if (linePoints.length >= 2) {
    svg += renderPathLine(linePoints);
  }

  // 경유지 다이아몬드
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

    // ── 메타 엔드포인트 (JSON + CORS) ──
    if (t === 'meta') {
      return new Response(renderMeta(), {
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'access-control-allow-origin': '*',
          'cache-control': 'no-cache',
        },
      });
    }

    let svg;
    if (t === 'worldmap') {
      svg = await renderWorldmap(params, env);
      if (!svg) {
        return new Response(
          'worldmap: 잘못된 파라미터 또는 R2 fetch 실패\n\n' +
          '사용법:\n' +
          '  ?t=worldmap&world=1층\n' +
          '  ?t=worldmap&world=floor4&at=center\n' +
          '  ?t=worldmap&world=4층&labels=on            (모든 장소 라벨 표시)\n' +
          '  ?t=worldmap&world=floor5&x=500&y=400       (좌표 찍기 디버그)\n' +
          '  ?t=worldmap&at=중앙&p=upperleft§지나|topright§오크§적\n' +
          '  ?t=worldmap&at=center&path=upperleft,topright,lowerright\n\n' +
          '관계 종류: 아군(생략 가능) / 적 / 파티 / 중립\n' +
          '경로 path: 콤마 구분, 마지막이 목적지(깃발), 중간은 경유지(다이아몬드)\n\n' +
          '등록된 월드: test / floor1~floor10 (한글 alias: 1층~10층)\n' +
          '등록된 장소 (test): center / upperleft / lowerright / topright / bottomleft\n' +
          '※ floor1~floor10의 PLACES는 좌표 찍어가며 점진적 추가 예정',
          { status: 400, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
        );
      }
    } else {
      return new Response('사용 가능: ?t=worldmap | ?t=meta', {
        status: 400, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }

    return new Response(svg, {
      headers: { 'content-type': 'image/svg+xml', 'cache-control': 'no-cache' }
    });
  }
};
