// ═══════════════════════════════════════════════════════════════
// 겨울의 SNS UI Workers v5 — 13종 UI
// ═══════════════════════════════════════════════════════════════

const PAGES = {
  '/insta': `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Instagram Post</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --col-indigo: #8889CD;
    --col-pink:   #DDAACC;
    --col-sand:   #CCAA88;
    --col-rose:   #BB6688;
  }

  body {
    background: #f5f0f4;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    min-height: 100vh;
    padding: 20px 0;
  }

  .post {
    background: #fff;
    width: 100%;
    max-width: 470px;
    border: 1px solid #e0d4dc;
    border-radius: 8px;
    overflow: hidden;
  }

  /* Header */
  .post-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
  }

  .post-header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .avatar {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: linear-gradient(45deg, var(--col-sand), var(--col-rose), var(--col-indigo));
    padding: 2px;
    flex-shrink: 0;
  }

  .avatar-inner {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: var(--col-sand);
    border: 2px solid #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .avatar-inner svg {
    width: 60%;
    height: 60%;
    fill: #fff;
    opacity: 0.8;
  }

  .username {
    font-size: 14px;
    font-weight: 600;
    color: #262626;
    line-height: 1.2;
  }

  .location {
    font-size: 12px;
    color: #8e8e8e;
    margin-top: 1px;
  }

  .more-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: #262626;
    font-size: 20px;
    line-height: 1;
    padding: 4px;
  }

  /* Image area */
  .post-image {
    width: 100%;
    aspect-ratio: 1;
    background: #ede6ef;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: #c7c7c7;
    position: relative;
    overflow: hidden;
  }

  .post-image svg {
    width: 48px;
    height: 48px;
    fill: var(--col-pink);
    opacity: 0.5;
  }

  .post-image .image-desc {
    font-size: 13px;
    color: var(--col-rose);
    opacity: 0.6;
    text-align: center;
    padding: 0 24px;
    line-height: 1.5;
  }

  /* Actions */
  .post-actions {
    padding: 8px 16px 4px;
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .action-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 0;
    display: flex;
    align-items: center;
  }

  .action-btn svg {
    width: 24px;
    height: 24px;
    fill: none;
    stroke: #262626;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .action-btn.liked svg {
    fill: var(--col-rose);
    stroke: var(--col-rose);
  }

  .bookmark-btn {
    margin-left: auto;
  }

  /* Likes */
  .post-likes {
    padding: 4px 16px;
    font-size: 14px;
    font-weight: 600;
    color: #262626;
  }

  /* Caption */
  .post-caption {
    padding: 4px 16px;
    font-size: 14px;
    color: #262626;
    line-height: 1.5;
  }

  .post-caption .cap-user {
    font-weight: 600;
    margin-right: 4px;
  }

  .post-caption .cap-translation {
    color: #8e8e8e;
    display: block;
    margin-top: 2px;
  }

  .post-hashtags {
    padding: 2px 16px 4px;
    font-size: 14px;
    color: var(--col-indigo);
    line-height: 1.6;
  }

  /* Comments link */
  .post-comments-link {
    padding: 2px 16px;
    font-size: 14px;
    color: #8e8e8e;
    cursor: pointer;
  }

  /* Comments */
  .post-comments {
    padding: 4px 16px 2px;
  }

  .comment {
    font-size: 14px;
    color: #262626;
    margin-bottom: 6px;
    line-height: 1.4;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }

  .comment-left { flex: 1; }

  .comment .com-user {
    font-weight: 600;
    margin-right: 4px;
  }

  .comment .com-translation {
    color: #8e8e8e;
    font-size: 12px;
    display: block;
    margin-top: 1px;
    margin-left: 0;
  }

  .comment-likes {
    font-size: 12px;
    color: #8e8e8e;
    white-space: nowrap;
    padding-top: 2px;
  }

  /* Timestamp */
  .post-time {
    padding: 6px 16px 16px;
    font-size: 10px;
    color: #8e8e8e;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
</style>
</head>
<body>
<div class="post" id="post">
  <!-- Header -->
  <div class="post-header">
    <div class="post-header-left">
      <div class="avatar">
        <div class="avatar-inner">
          <svg viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
        </div>
      </div>
      <div>
        <div class="username" id="username">@lorem_ipsum</div>
        <div class="location" id="location" style="display:none"></div>
      </div>
    </div>
    <button class="more-btn">···</button>
  </div>

  <!-- Image -->
  <div class="post-image">
    <svg viewBox="0 0 24 24"><path d="M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4z"/><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>
    <div class="image-desc" id="image-desc">사진 설명</div>
  </div>

  <!-- Actions -->
  <div class="post-actions">
    <button class="action-btn" id="like-btn" onclick="toggleLike()">
      <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
    </button>
    <button class="action-btn">
      <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
    </button>
    <button class="action-btn">
      <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
    </button>
    <button class="action-btn bookmark-btn">
      <svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
    </button>
  </div>

  <!-- Likes -->
  <div class="post-likes" id="likes">좋아요 1,204개</div>

  <!-- Caption -->
  <div class="post-caption">
    <span class="cap-user" id="cap-user">lorem_ipsum</span>
    <span id="caption">오늘 수고했어요</span>
    <span class="cap-translation" id="cap-translation">[Good job today]</span>
  </div>

  <!-- Hashtags -->
  <div class="post-hashtags" id="hashtags">#일상 #감성</div>

  <!-- Comments link -->
  <div class="post-comments-link" id="comments-link">댓글 48개 모두 보기</div>

  <!-- Comments -->
  <div class="post-comments" id="comments-container"></div>

  <!-- Timestamp -->
  <div class="post-time" id="timestamp">2일 전</div>
</div>

<script>
// ── URL 파라미터 파싱 ──────────────────────────────────────────
// 형식: ?p=@유저,팔로워수,댓글수,시간,이미지설명,캡션,[번역],해시태그&c=닉,댓글,[번역],좋아요|닉,댓글,[번역],좋아요
// 번역은 선택사항 (없으면 빈칸)

function parseParams() {
  const params = new URLSearchParams(window.location.search);
  const p = params.get('p');
  const c = params.get('c');

  if (!p) return;

  const parts = p.split(',');
  const user    = parts[0] || '@lorem_ipsum';
  // parts[1] = 팔로워 (표시 안 함)
  const commentCount = parts[2] || '48';
  const time    = parts[3] || '방금';
  const imgDesc = parts[4] || '';
  const caption = parts[5] || '';
  const hasTranslation = parts[6] && parts[6].startsWith('[');
  const capTranslation = hasTranslation ? parts[6] : '';
  const hashtagsRaw = hasTranslation ? parts[7] : parts[6];
  const likes   = parts[1] ? Number(parts[1]).toLocaleString() : '0';

  // 유저명
  const uname = user.startsWith('@') ? user : '@' + user;
  document.getElementById('username').textContent = uname;
  document.getElementById('cap-user').textContent = uname.replace('@','');

  // 이미지 설명
  if (imgDesc) document.getElementById('image-desc').textContent = imgDesc;

  // 좋아요
  document.getElementById('likes').textContent = \`좋아요 \${likes}개\`;

  // 캡션
  document.getElementById('caption').textContent = caption;

  // 번역
  if (capTranslation) {
    document.getElementById('cap-translation').textContent = capTranslation;
  } else {
    document.getElementById('cap-translation').style.display = 'none';
  }

  // 해시태그
  if (hashtagsRaw) {
    document.getElementById('hashtags').textContent = hashtagsRaw.replace(/%23/g,'#');
  } else {
    document.getElementById('hashtags').style.display = 'none';
  }

  // 댓글 수 링크
  document.getElementById('comments-link').textContent = \`댓글 \${commentCount}개 모두 보기\`;

  // 시간
  document.getElementById('timestamp').textContent = time;

  // 댓글 파싱
  if (c) {
    const container = document.getElementById('comments-container');
    container.innerHTML = '';
    const commentList = c.split('|');
    commentList.forEach(raw => {
      const seg = raw.split(',');
      const cUser  = seg[0] || '';
      const cText  = seg[1] || '';
      const hasCtrans = seg[2] && !isNaN(Number(seg[seg.length-1])) && seg.length >= 4;
      const cTrans = hasCtrans ? seg[2] : '';
      const cLikes = seg[seg.length-1] || '';

      const div = document.createElement('div');
      div.className = 'comment';
      div.innerHTML = \`
        <div class="comment-left">
          <span class="com-user">\${cUser}</span>\${cText}
          \${cTrans ? \`<span class="com-translation">\${cTrans}</span>\` : ''}
        </div>
        <div class="comment-likes">♡ \${Number(cLikes).toLocaleString()}</div>
      \`;
      container.appendChild(div);
    });
  }
}

// ── 좋아요 토글 ───────────────────────────────────────────────
let liked = false;
function toggleLike() {
  liked = !liked;
  const btn = document.getElementById('like-btn');
  btn.classList.toggle('liked', liked);

  const likesEl = document.getElementById('likes');
  const match = likesEl.textContent.match(/[\\d,]+/);
  if (match) {
    let n = parseInt(match[0].replace(/,/g, ''));
    n = liked ? n + 1 : n - 1;
    likesEl.textContent = \`좋아요 \${n.toLocaleString()}개\`;
  }
}

// ── 실행 ──────────────────────────────────────────────────────
parseParams();
</script>
</body>
</html>
`,
  '/twitter': `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Twitter Post</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --col-indigo: #8889CD;
    --col-pink:   #DDAACC;
    --col-sand:   #CCAA88;
    --col-rose:   #BB6688;
  }

  body {
    background: #0d0d14;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    min-height: 100vh;
    padding: 20px 0;
  }

  .tweet {
    background: #0d0d14;
    width: 100%;
    max-width: 598px;
    border: 1px solid #2a2535;
    border-radius: 16px;
    padding: 16px;
    color: #e7e9ea;
  }

  .tweet-header {
    display: flex;
    gap: 12px;
    margin-bottom: 4px;
  }

  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--col-indigo), var(--col-rose));
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .avatar svg { width: 60%; height: 60%; fill: #fff; opacity: 0.85; }

  .header-right { flex: 1; min-width: 0; }

  .name-row {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
  }

  .display-name {
    font-size: 15px;
    font-weight: 700;
    color: #e7e9ea;
  }

  .verified {
    width: 18px;
    height: 18px;
    fill: var(--col-indigo);
    flex-shrink: 0;
  }

  .handle-time {
    font-size: 15px;
    color: #71767b;
  }

  .more-btn {
    margin-left: auto;
    background: none;
    border: none;
    color: #71767b;
    cursor: pointer;
    font-size: 18px;
    padding: 0 4px;
    align-self: flex-start;
  }

  .tweet-body {
    font-size: 15px;
    line-height: 1.6;
    color: #e7e9ea;
    margin: 8px 0 12px;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .tweet-body .translation {
    color: #71767b;
    font-size: 13px;
    display: block;
    margin-top: 4px;
  }

  .tweet-image {
    width: 100%;
    aspect-ratio: 16/9;
    background: #18141e;
    border-radius: 16px;
    border: 1px solid #2a2535;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  .tweet-image svg { width: 40px; height: 40px; fill: var(--col-indigo); opacity: 0.4; }
  .tweet-image .img-desc { font-size: 13px; color: var(--col-pink); opacity: 0.5; text-align: center; padding: 0 20px; }

  .tweet-stats {
    display: flex;
    gap: 4px;
    padding: 12px 0;
    border-top: 1px solid #2f3336;
    border-bottom: 1px solid #2f3336;
    margin-bottom: 8px;
    font-size: 14px;
    color: #e7e9ea;
    flex-wrap: wrap;
  }

  .stat-item { display: flex; gap: 4px; }
  .stat-item span { color: #71767b; }
  .stat-divider { color: #71767b; margin: 0 4px; }

  .tweet-actions {
    display: flex;
    justify-content: space-between;
    padding-top: 4px;
  }

  .action {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #71767b;
    font-size: 13px;
    cursor: pointer;
    padding: 8px;
    border-radius: 999px;
    transition: background 0.15s;
  }

  .action:hover { background: rgba(136,137,205,0.12); color: var(--col-indigo); }
  .action:hover svg { stroke: var(--col-indigo); }
  .action.like:hover { background: rgba(187,102,136,0.12); color: var(--col-rose); }
  .action.like:hover svg { stroke: var(--col-rose); }

  .action svg {
    width: 18px; height: 18px;
    fill: none; stroke: #71767b;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
    transition: stroke 0.15s;
  }

  .tweet-time-full {
    font-size: 14px;
    color: #71767b;
    margin-top: 4px;
    padding-top: 8px;
  }
</style>
</head>
<body>
<div class="tweet">
  <div class="tweet-header">
    <div class="avatar">
      <svg viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
    </div>
    <div class="header-right">
      <div class="name-row">
        <span class="display-name" id="display-name">Display Name</span>
        <svg class="verified" id="verified-badge" viewBox="0 0 24 24" style="display:none"><path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.9-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91C2.88 9.33 2 10.57 2 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.66 1.31 1.9 2.19 3.34 2.19s2.67-.88 3.33-2.19c1.4.46 2.91.2 3.92-.81s1.26-2.52.8-3.91C21.37 14.67 22.25 13.43 22.25 12zm-6.12-1.26l-4.5 4.5a.75.75 0 01-1.06 0l-2.25-2.25a.75.75 0 011.06-1.06l1.72 1.72 3.97-3.97a.75.75 0 011.06 1.06z"/></svg>
        <span class="handle-time" id="handle-time">@handle · 시간</span>
      </div>
    </div>
    <button class="more-btn">···</button>
  </div>

  <div class="tweet-body" id="tweet-body">트윗 내용</div>

  <div class="tweet-image" id="tweet-image" style="display:none">
    <svg viewBox="0 0 24 24"><path d="M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4z"/><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>
    <div class="img-desc" id="img-desc"></div>
  </div>

  <div class="tweet-stats" id="tweet-stats">
    <div class="stat-item"><strong id="retweets">0</strong><span>리트윗</span></div>
    <span class="stat-divider">·</span>
    <div class="stat-item"><strong id="quotes">0</strong><span>인용</span></div>
    <span class="stat-divider">·</span>
    <div class="stat-item"><strong id="likes">0</strong><span>마음에 들어요</span></div>
    <span class="stat-divider">·</span>
    <div class="stat-item"><strong id="bookmarks">0</strong><span>북마크</span></div>
  </div>

  <div class="tweet-actions">
    <div class="action">
      <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
      <span id="replies-count">0</span>
    </div>
    <div class="action">
      <svg viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
      <span id="rt-count">0</span>
    </div>
    <div class="action like">
      <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
      <span id="likes-count">0</span>
    </div>
    <div class="action">
      <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
    </div>
    <div class="action">
      <svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
    </div>
  </div>

  <div class="tweet-time-full" id="tweet-time-full"></div>
</div>

<script>
// 형식: ?p=@handle,표시이름,시간,본문,[번역],[이미지설명],답글수,리트윗수,인용수,좋아요수,북마크수,[verified]
function parseParams() {
  const params = new URLSearchParams(window.location.search);
  const p = params.get('p');
  if (!p) return;

  const parts = p.split(',');
  const handle      = parts[0] || '@handle';
  const displayName = parts[1] || 'Name';
  const time        = parts[2] || '방금';
  const body        = parts[3] || '';
  let idx = 4;

  // 번역 ([ 로 시작하면)
  let translation = '';
  if (parts[idx] && parts[idx].startsWith('[')) {
    translation = parts[idx]; idx++;
  }

  // 이미지 설명 (다음이 숫자가 아니고 [ 아니면 이미지)
  let imgDesc = '';
  if (parts[idx] && isNaN(Number(parts[idx])) && !parts[idx].startsWith('[')) {
    imgDesc = parts[idx]; idx++;
  }

  const replies   = parts[idx]   || '0';
  const retweets  = parts[idx+1] || '0';
  const quotes    = parts[idx+2] || '0';
  const likes     = parts[idx+3] || '0';
  const bookmarks = parts[idx+4] || '0';
  const verified  = parts[idx+5] === 'verified';

  // 적용
  document.getElementById('display-name').textContent = displayName;
  document.getElementById('handle-time').textContent = \`\${handle} · \${time}\`;

  if (verified) document.getElementById('verified-badge').style.display = 'inline';

  const bodyEl = document.getElementById('tweet-body');
  bodyEl.textContent = body;
  if (translation) {
    const span = document.createElement('span');
    span.className = 'translation';
    span.textContent = translation;
    bodyEl.appendChild(span);
  }

  if (imgDesc) {
    document.getElementById('tweet-image').style.display = 'flex';
    document.getElementById('img-desc').textContent = imgDesc;
  }

  const fmt = n => Number(n).toLocaleString();
  document.getElementById('retweets').textContent    = fmt(retweets);
  document.getElementById('quotes').textContent      = fmt(quotes);
  document.getElementById('likes').textContent       = fmt(likes);
  document.getElementById('bookmarks').textContent   = fmt(bookmarks);
  document.getElementById('replies-count').textContent = fmt(replies);
  document.getElementById('rt-count').textContent    = fmt(retweets);
  document.getElementById('likes-count').textContent = fmt(likes);
  document.getElementById('tweet-time-full').textContent = time;
}

parseParams();
</script>
</body>
</html>
`,
  '/kakao': `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>KakaoTalk</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --col-indigo: #8889CD;
    --col-pink:   #DDAACC;
    --col-sand:   #CCAA88;
    --col-rose:   #BB6688;
  }

  body {
    background: #c8bdd4;
    font-family: -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    min-height: 100vh;
  }

  .chat-wrap {
    width: 100%;
    max-width: 480px;
    min-height: 100vh;
    background: #c8bdd4;
    display: flex;
    flex-direction: column;
  }

  /* Header */
  .chat-header {
    background: rgba(0,0,0,0.08);
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    position: sticky;
    top: 0;
    z-index: 10;
    backdrop-filter: blur(10px);
  }

  .back-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: #1a1a1a;
    font-size: 20px;
    line-height: 1;
    padding: 4px;
  }

  .chat-title {
    flex: 1;
    font-size: 16px;
    font-weight: 700;
    color: #1a1a1a;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .member-count {
    font-size: 14px;
    font-weight: 400;
    color: #555;
  }

  .header-actions {
    display: flex;
    gap: 16px;
    color: #1a1a1a;
  }

  .header-actions svg {
    width: 22px; height: 22px;
    fill: none; stroke: #1a1a1a;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
    cursor: pointer;
  }

  /* Date divider */
  .date-divider {
    text-align: center;
    margin: 16px 0 8px;
    font-size: 12px;
    color: rgba(0,0,0,0.45);
  }

  /* Messages */
  .messages {
    flex: 1;
    padding: 8px 12px 80px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    overflow-y: auto;
  }

  .msg-row {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    max-width: 100%;
  }

  /* 상대방 메시지 */
  .msg-row.other { flex-direction: row; }

  .msg-row.other .bubble {
    background: #fff;
    color: #1a1a1a;
    border-radius: 0 12px 12px 12px;
  }

  /* 내 메시지 */
  .msg-row.me {
    flex-direction: row-reverse;
  }

  .msg-row.me .bubble {
    background: var(--col-pink);
    color: #2a1a22;
    border-radius: 12px 0 12px 12px;
  }

  .msg-row.me .meta {
    align-items: flex-end;
  }

  /* 아바타 */
  .msg-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #888;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    color: #fff;
    align-self: flex-start;
  }

  /* 이름 + 말풍선 묶음 */
  .msg-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-width: 72%;
  }

  .msg-name {
    font-size: 12px;
    color: rgba(0,0,0,0.55);
    margin-bottom: 2px;
    padding-left: 2px;
  }

  .bubble {
    padding: 8px 12px;
    font-size: 14px;
    line-height: 1.5;
    word-break: break-word;
    max-width: 100%;
    display: inline-block;
  }

  .meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-bottom: 2px;
    min-width: 40px;
  }

  .read-count {
    font-size: 11px;
    color: var(--col-rose);
    font-weight: 600;
    text-align: right;
  }

  .msg-time {
    font-size: 11px;
    color: rgba(0,0,0,0.4);
    white-space: nowrap;
  }

  /* 연속 메시지 */
  .msg-row.cont .msg-avatar { opacity: 0; }
  .msg-row.cont .msg-name { display: none; }

  /* Input bar */
  .input-bar {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 480px;
    background: #fff;
    border-top: 1px solid rgba(0,0,0,0.1);
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .input-btn {
    background: none; border: none;
    cursor: pointer; color: #666;
    font-size: 22px; padding: 4px;
  }

  .input-field {
    flex: 1;
    background: #f0f0f0;
    border: none; outline: none;
    border-radius: 20px;
    padding: 8px 14px;
    font-size: 14px;
    color: #1a1a1a;
    font-family: inherit;
  }

  .send-btn {
    background: none; border: none;
    cursor: pointer;
    width: 36px; height: 36px;
    border-radius: 50%;
    background: var(--col-indigo);
    display: flex; align-items: center; justify-content: center;
  }

  .send-btn svg {
    width: 18px; height: 18px;
    fill: none; stroke: #fff;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>
</head>
<body>
<div class="chat-wrap">
  <div class="chat-header">
    <button class="back-btn">‹</button>
    <div class="chat-title">
      <span id="room-name">채팅방</span>
      <span class="member-count" id="member-count"></span>
    </div>
    <div class="header-actions">
      <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    </div>
  </div>

  <div class="messages" id="messages">
    <div class="date-divider" id="date-divider">2025년 1월 1일 수요일</div>
  </div>

  <div class="input-bar">
    <button class="input-btn">+</button>
    <input class="input-field" placeholder="메시지 보내기" readonly>
    <button class="send-btn">
      <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
    </button>
  </div>
</div>

<script>
// ── 파라미터 형식 ──────────────────────────────────────────────
// ?r=방이름,날짜,[인원수]
// &m=발신자,내용,시간,[읽음수],[me]|발신자,내용,시간,[읽음수],[me]|...
//
// 발신자: 이름 (me 면 내 메시지)
// 읽음수: 안 읽은 사람 수 (0이면 표시 안 함)
// me: 내 메시지로 표시하려면 마지막에 'me' 추가
//
// 예시:
// ?r=코랄뷰 동창,1월 15일,5
// &m=블레어,야 너 파티 가?,오후 2:14,1|나,응 갈듯,오후 2:15,0,me|블레어,ㄹㅇ? 완전 기대돼,오후 2:15,2

function avatarColor(name) {
  const colors = ['#e8736c','#f0a05a','#7eb8d4','#82c4a0','#a78fd4','#d47eb8','#7ab8c4'];
  let hash = 0;
  for (let c of name) hash = (hash * 31 + c.charCodeAt(0)) % colors.length;
  return colors[Math.abs(hash)];
}

function parseParams() {
  const params = new URLSearchParams(window.location.search);
  const r = params.get('r');
  const m = params.get('m');

  if (r) {
    const rp = r.split(',');
    document.getElementById('room-name').textContent = rp[0] || '채팅방';
    if (rp[1]) document.getElementById('date-divider').textContent = rp[1];
    if (rp[2]) document.getElementById('member-count').textContent = rp[2];
  }

  if (!m) return;

  const container = document.getElementById('messages');
  const msgList = m.split('|');
  const prevSenders = {};

  msgList.forEach((raw, i) => {
    const seg = raw.split(',');
    const sender  = seg[0] || '';
    const content = seg[1] || '';
    const time    = seg[2] || '';
    const readCnt = seg[3] || '0';
    const isMe    = seg[seg.length - 1] === 'me';

    const prevSender = i > 0 ? msgList[i-1].split(',')[0] : null;
    const nextSender = i < msgList.length-1 ? msgList[i+1].split(',')[0] : null;
    const isCont = sender === prevSender;
    const isLast = sender !== nextSender;

    const row = document.createElement('div');
    row.className = \`msg-row \${isMe ? 'me' : 'other'}\${isCont ? ' cont' : ''}\`;

    const avatarEl = document.createElement('div');
    avatarEl.className = 'msg-avatar';
    avatarEl.style.background = avatarColor(sender);
    avatarEl.textContent = sender.charAt(0);

    const contentEl = document.createElement('div');
    contentEl.className = 'msg-content';

    if (!isCont && !isMe) {
      const nameEl = document.createElement('div');
      nameEl.className = 'msg-name';
      nameEl.textContent = sender;
      contentEl.appendChild(nameEl);
    }

    const bubbleEl = document.createElement('div');
    bubbleEl.className = 'bubble';
    bubbleEl.textContent = content;

    const metaEl = document.createElement('div');
    metaEl.className = 'meta';

    if (isMe && readCnt !== '0') {
      const readEl = document.createElement('div');
      readEl.className = 'read-count';
      readEl.textContent = readCnt;
      metaEl.appendChild(readEl);
    }

    if (isLast) {
      const timeEl = document.createElement('div');
      timeEl.className = 'msg-time';
      timeEl.textContent = time;
      metaEl.appendChild(timeEl);
    }

    contentEl.appendChild(bubbleEl);

    if (isMe) {
      row.appendChild(metaEl);
      row.appendChild(contentEl);
    } else {
      row.appendChild(avatarEl);
      row.appendChild(contentEl);
      row.appendChild(metaEl);
    }

    container.appendChild(row);
  });

  // 스크롤 아래로
  container.scrollTop = container.scrollHeight;
}

parseParams();
</script>
</body>
</html>
`,
  '/reddit': `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Reddit Thread</title>
<style>
  :root {
    --col-indigo: #8889CD;
    --col-pink:   #DDAACC;
    --col-sand:   #CCAA88;
    --col-rose:   #BB6688;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #0e0a14;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    display: flex;
    justify-content: center;
    padding: 20px 0;
    min-height: 100vh;
  }
  .thread {
    width: 100%;
    max-width: 600px;
    color: #d7d7d7;
  }

  /* Post */
  .post {
    background: #1a1422;
    border: 1px solid #2a2235;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
  }
  .post-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #71677b;
    margin-bottom: 10px;
  }
  .subreddit { color: var(--col-indigo); font-weight: 700; }
  .post-author { color: var(--col-sand); }
  .post-title {
    font-size: 18px;
    font-weight: 700;
    color: #ede8f2;
    line-height: 1.4;
    margin-bottom: 12px;
  }
  .post-body {
    font-size: 14px;
    line-height: 1.7;
    color: #b8b0c4;
    margin-bottom: 16px;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .post-actions {
    display: flex;
    gap: 16px;
    font-size: 12px;
    color: #71677b;
    font-weight: 600;
  }
  .post-action {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 20px;
    transition: background 0.15s;
  }
  .post-action:hover { background: rgba(136,137,205,0.1); color: var(--col-indigo); }
  .vote {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 20px;
    background: #221b2a;
  }
  .vote-btn { cursor: pointer; font-size: 16px; color: #71677b; transition: color 0.15s; }
  .vote-btn:hover { color: var(--col-rose); }
  .vote-count { font-size: 12px; font-weight: 700; color: #d7d7d7; }

  /* Comments */
  .comments { padding: 0 4px; }
  .comment {
    background: #1a1422;
    border: 1px solid #2a2235;
    border-radius: 10px;
    padding: 12px 14px;
    margin-bottom: 8px;
  }
  .comment-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    margin-bottom: 6px;
  }
  .comment-author { color: var(--col-pink); font-weight: 700; }
  .comment-time { color: #71677b; }
  .comment-body {
    font-size: 13px;
    line-height: 1.6;
    color: #b8b0c4;
    margin-bottom: 8px;
  }
  .comment-votes {
    font-size: 11px;
    color: #71677b;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .comment-votes .up { color: var(--col-rose); }
</style>
</head>
<body>
<div class="thread">
  <div class="post" id="post"></div>
  <div class="comments" id="comments"></div>
</div>

<script>
// ?p=서브레딧,유저,시간,제목,본문,업보트,댓글수
// &c=유저,내용,시간,업보트|유저,내용,시간,업보트
function parseParams() {
  const params = new URLSearchParams(window.location.search);
  const p = params.get('p');
  const c = params.get('c');
  if (!p) return;

  const parts = p.split(',');
  const sub      = parts[0] || 'AskReddit';
  const author   = parts[1] || 'throwaway';
  const time     = parts[2] || '방금';
  const title    = parts[3] || '';
  const body     = parts[4] || '';
  const upvotes  = parts[5] || '0';
  const commentN = parts[6] || '0';

  const fmt = n => {
    const num = Number(n);
    if (num >= 1000) return (num/1000).toFixed(1).replace(/\\.0$/,'') + 'k';
    return n;
  };

  document.getElementById('post').innerHTML = \`
    <div class="post-meta">
      <span class="subreddit">r/\${sub}</span>
      <span>•</span>
      <span class="post-author">u/\${author}</span>
      <span>•</span>
      <span>\${time}</span>
    </div>
    <div class="post-title">\${title}</div>
    <div class="post-body">\${body}</div>
    <div class="post-actions">
      <div class="vote">
        <span class="vote-btn">▲</span>
        <span class="vote-count">\${fmt(upvotes)}</span>
        <span class="vote-btn">▼</span>
      </div>
      <div class="post-action">💬 \${fmt(commentN)}개</div>
      <div class="post-action">↗ 공유</div>
    </div>
  \`;

  if (c) {
    const container = document.getElementById('comments');
    c.split('|').forEach(raw => {
      const seg = raw.split(',');
      const cUser = seg[0] || '';
      const cBody = seg[1] || '';
      const cTime = seg[2] || '';
      const cUp   = seg[3] || '0';
      const div = document.createElement('div');
      div.className = 'comment';
      div.innerHTML = \`
        <div class="comment-meta">
          <span class="comment-author">\${cUser}</span>
          <span class="comment-time">\${cTime}</span>
        </div>
        <div class="comment-body">\${cBody}</div>
        <div class="comment-votes"><span class="up">▲</span> \${fmt(cUp)}</div>
      \`;
      container.appendChild(div);
    });
  }
}
parseParams();
</script>
</body>
</html>
`,
  '/lock': `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Lock Screen</title>
<style>
  :root {
    --col-indigo: #8889CD;
    --col-pink:   #DDAACC;
    --col-sand:   #CCAA88;
    --col-rose:   #BB6688;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #0a0812;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    min-height: 100vh;
  }
  .phone {
    width: 100%;
    max-width: 390px;
    min-height: 100vh;
    background: linear-gradient(180deg, #12101a 0%, #1a1528 40%, #0e0a14 100%);
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 60px;
  }

  /* Status bar */
  .status-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 14px 24px 0;
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    font-weight: 600;
    color: #fff;
  }
  .status-icons { display: flex; gap: 5px; font-size: 12px; }

  /* Time */
  .lock-time {
    font-size: 72px;
    font-weight: 200;
    color: #fff;
    letter-spacing: -2px;
    margin-top: 40px;
    line-height: 1;
  }
  .lock-date {
    font-size: 18px;
    color: rgba(255,255,255,0.7);
    margin-top: 6px;
    font-weight: 400;
  }

  /* Notifications */
  .notif-area {
    width: 100%;
    padding: 40px 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 30px;
  }
  .notif {
    background: rgba(255,255,255,0.08);
    backdrop-filter: blur(40px);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    padding: 12px 14px;
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }
  .notif-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }
  .notif-icon.msg   { background: linear-gradient(135deg, #34c759, #30b350); }
  .notif-icon.call  { background: linear-gradient(135deg, #30b350, #28a745); }
  .notif-icon.insta { background: linear-gradient(135deg, var(--col-rose), var(--col-indigo)); }
  .notif-icon.sns   { background: linear-gradient(135deg, var(--col-indigo), var(--col-pink)); }
  .notif-icon.mail  { background: linear-gradient(135deg, #3478f6, #2563eb); }
  .notif-icon.app   { background: linear-gradient(135deg, var(--col-sand), var(--col-rose)); }
  .notif-content { flex: 1; min-width: 0; }
  .notif-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2px;
  }
  .notif-app {
    font-size: 13px;
    font-weight: 600;
    color: rgba(255,255,255,0.9);
  }
  .notif-time {
    font-size: 12px;
    color: rgba(255,255,255,0.4);
  }
  .notif-title {
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    margin-bottom: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .notif-body {
    font-size: 13px;
    color: rgba(255,255,255,0.6);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Bottom */
  .bottom-bar {
    margin-top: auto;
    padding: 20px 0 30px;
    display: flex;
    justify-content: center;
    gap: 60px;
  }
  .bottom-btn {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: rgba(255,255,255,0.08);
    backdrop-filter: blur(20px);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
  }
  .home-indicator {
    width: 134px;
    height: 5px;
    background: rgba(255,255,255,0.3);
    border-radius: 3px;
    margin: 0 auto 8px;
  }
</style>
</head>
<body>
<div class="phone">
  <div class="status-bar">
    <span id="status-time">12:00</span>
    <div class="status-icons">
      <span>📶</span>
      <span>🔋</span>
    </div>
  </div>

  <div class="lock-time" id="lock-time">12:00</div>
  <div class="lock-date" id="lock-date">1월 1일 수요일</div>

  <div class="notif-area" id="notif-area"></div>

  <div class="bottom-bar">
    <div class="bottom-btn">🔦</div>
    <div class="bottom-btn">📷</div>
  </div>
  <div class="home-indicator"></div>
</div>

<script>
// ?t=시간,날짜
// &n=타입,앱이름,제목,내용,시간|타입,앱이름,제목,내용,시간
// 타입: msg, call, insta, sns, mail, app
function parseParams() {
  const params = new URLSearchParams(window.location.search);
  const t = params.get('t');
  const n = params.get('n');

  if (t) {
    const tp = t.split(',');
    const time = tp[0] || '12:00';
    const date = tp[1] || '';
    document.getElementById('lock-time').textContent = time;
    document.getElementById('status-time').textContent = time;
    if (date) document.getElementById('lock-date').textContent = date;
  }

  if (!n) return;

  const container = document.getElementById('notif-area');
  const icons = {
    msg: '💬', call: '📞', insta: '📷',
    sns: '🐦', mail: '✉️', app: '🔔'
  };

  n.split('|').forEach(raw => {
    const seg = raw.split(',');
    const type    = seg[0] || 'app';
    const app     = seg[1] || '';
    const title   = seg[2] || '';
    const body    = seg[3] || '';
    const time    = seg[4] || '';

    const div = document.createElement('div');
    div.className = 'notif';
    div.innerHTML = \`
      <div class="notif-icon \${type}">\${icons[type] || '🔔'}</div>
      <div class="notif-content">
        <div class="notif-header">
          <span class="notif-app">\${app}</span>
          <span class="notif-time">\${time}</span>
        </div>
        <div class="notif-title">\${title}</div>
        <div class="notif-body">\${body}</div>
      </div>
    \`;
    container.appendChild(div);
  });
}
parseParams();
</script>
</body>
</html>
`,
  '/email': `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Email</title>
<style>
  :root {
    --col-indigo: #8889CD;
    --col-pink:   #DDAACC;
    --col-sand:   #CCAA88;
    --col-rose:   #BB6688;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #f5f0f4;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    display: flex;
    justify-content: center;
    padding: 20px 0;
    min-height: 100vh;
  }
  .email {
    width: 100%;
    max-width: 560px;
    background: #fff;
    border-radius: 12px;
    border: 1px solid #e0d4dc;
    overflow: hidden;
  }

  /* Header bar */
  .email-toolbar {
    background: #faf6f9;
    border-bottom: 1px solid #e0d4dc;
    padding: 10px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
    color: #8e8e8e;
  }
  .toolbar-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 16px;
    color: var(--col-indigo);
    padding: 4px;
  }
  .toolbar-title {
    font-weight: 600;
    color: #333;
    flex: 1;
  }

  /* Email header */
  .email-header {
    padding: 20px 20px 16px;
    border-bottom: 1px solid #f0e8ee;
  }
  .email-subject {
    font-size: 20px;
    font-weight: 700;
    color: #1a1a1a;
    line-height: 1.4;
    margin-bottom: 14px;
  }
  .email-from-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }
  .email-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--col-indigo), var(--col-rose));
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
  }
  .email-from-info { flex: 1; }
  .email-from-name {
    font-size: 14px;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 1px;
  }
  .email-from-addr {
    font-size: 12px;
    color: #8e8e8e;
  }
  .email-to {
    font-size: 12px;
    color: #8e8e8e;
    margin-top: 2px;
  }
  .email-date {
    font-size: 12px;
    color: #8e8e8e;
    text-align: right;
    white-space: nowrap;
    align-self: flex-start;
  }

  /* Body */
  .email-body {
    padding: 20px;
    font-size: 14px;
    line-height: 1.8;
    color: #333;
    white-space: pre-wrap;
    word-break: break-word;
  }

  /* Footer */
  .email-footer {
    border-top: 1px solid #f0e8ee;
    padding: 12px 20px;
    display: flex;
    gap: 8px;
  }
  .reply-btn {
    padding: 8px 20px;
    border-radius: 20px;
    border: 1px solid #e0d4dc;
    background: #fff;
    font-size: 13px;
    color: var(--col-indigo);
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s;
  }
  .reply-btn:hover {
    background: rgba(136,137,205,0.08);
    border-color: var(--col-indigo);
  }
</style>
</head>
<body>
<div class="email">
  <div class="email-toolbar">
    <button class="toolbar-btn">←</button>
    <span class="toolbar-title">받은편지함</span>
    <button class="toolbar-btn">🗑</button>
    <button class="toolbar-btn">⋯</button>
  </div>
  <div class="email-header" id="email-header"></div>
  <div class="email-body" id="email-body">이메일 내용</div>
  <div class="email-footer">
    <button class="reply-btn">↩ 답장</button>
    <button class="reply-btn">↩↩ 전체 답장</button>
    <button class="reply-btn">↪ 전달</button>
  </div>
</div>

<script>
// ?p=보낸사람이름,이메일주소,받는사람,제목,날짜,본문
function parseParams() {
  const params = new URLSearchParams(window.location.search);
  const p = params.get('p');
  if (!p) return;

  const parts = p.split(',');
  const fromName  = parts[0] || '';
  const fromEmail = parts[1] || '';
  const toAddr    = parts[2] || '';
  const subject   = parts[3] || '';
  const date      = parts[4] || '';
  const body      = parts.slice(5).join(',') || '';

  const initial = fromName.charAt(0).toUpperCase();

  document.getElementById('email-header').innerHTML = \`
    <div class="email-subject">\${subject}</div>
    <div class="email-from-row">
      <div class="email-avatar">\${initial}</div>
      <div class="email-from-info">
        <div class="email-from-name">\${fromName}</div>
        <div class="email-from-addr">&lt;\${fromEmail}&gt;</div>
        <div class="email-to">받는 사람: \${toAddr}</div>
      </div>
      <div class="email-date">\${date}</div>
    </div>
  \`;

  document.getElementById('email-body').textContent = body;
}
parseParams();
</script>
</body>
</html>
`,
  '/story': `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Instagram Story</title>
<style>
  :root {
    --col-indigo: #8889CD;
    --col-pink:   #DDAACC;
    --col-sand:   #CCAA88;
    --col-rose:   #BB6688;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    min-height: 100vh;
  }
  .story {
    width: 100%;
    max-width: 420px;
    min-height: 100vh;
    background: #1a1422;
    position: relative;
    display: flex;
    flex-direction: column;
  }

  /* Progress bar */
  .progress-bar {
    position: absolute;
    top: 12px;
    left: 12px;
    right: 12px;
    height: 2px;
    background: rgba(255,255,255,0.2);
    border-radius: 2px;
    z-index: 10;
  }
  .progress-fill {
    height: 100%;
    width: 70%;
    background: #fff;
    border-radius: 2px;
  }

  /* Header */
  .story-header {
    position: absolute;
    top: 22px;
    left: 0;
    right: 0;
    padding: 0 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 10;
  }
  .story-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(45deg, var(--col-sand), var(--col-rose), var(--col-indigo));
    padding: 2px;
    flex-shrink: 0;
  }
  .story-avatar-inner {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: var(--col-sand);
    border: 2px solid #1a1422;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .story-avatar-inner svg {
    width: 55%;
    height: 55%;
    fill: #fff;
    opacity: 0.8;
  }
  .story-user {
    font-size: 14px;
    font-weight: 600;
    color: #fff;
  }
  .story-time {
    font-size: 12px;
    color: rgba(255,255,255,0.5);
  }
  .story-close {
    margin-left: auto;
    background: none;
    border: none;
    color: #fff;
    font-size: 24px;
    cursor: pointer;
    line-height: 1;
  }

  /* Image area */
  .story-image {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 80px 20px;
  }
  .story-image svg {
    width: 56px;
    height: 56px;
    fill: var(--col-pink);
    opacity: 0.4;
  }
  .story-image-desc {
    font-size: 14px;
    color: var(--col-pink);
    opacity: 0.5;
    text-align: center;
    line-height: 1.6;
    max-width: 280px;
  }

  /* Caption overlay */
  .story-caption {
    position: absolute;
    bottom: 80px;
    left: 0;
    right: 0;
    padding: 16px 20px;
    text-align: center;
  }
  .story-caption-text {
    font-size: 16px;
    color: #fff;
    line-height: 1.5;
    text-shadow: 0 1px 6px rgba(0,0,0,0.7);
  }

  /* Bottom */
  .story-bottom {
    padding: 12px 16px 24px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .story-input {
    flex: 1;
    background: none;
    border: 1px solid rgba(255,255,255,0.3);
    border-radius: 24px;
    padding: 10px 16px;
    font-size: 14px;
    color: rgba(255,255,255,0.5);
    font-family: inherit;
    outline: none;
  }
  .story-send {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 22px;
  }
</style>
</head>
<body>
<div class="story">
  <div class="progress-bar"><div class="progress-fill"></div></div>

  <div class="story-header">
    <div class="story-avatar">
      <div class="story-avatar-inner">
        <svg viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
      </div>
    </div>
    <span class="story-user" id="story-user">username</span>
    <span class="story-time" id="story-time">14분 전</span>
    <button class="story-close">✕</button>
  </div>

  <div class="story-image">
    <svg viewBox="0 0 24 24"><path d="M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4z"/><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>
    <div class="story-image-desc" id="story-desc">사진 설명</div>
  </div>

  <div class="story-caption" id="story-caption" style="display:none">
    <div class="story-caption-text" id="caption-text"></div>
  </div>

  <div class="story-bottom">
    <input class="story-input" placeholder="메시지 보내기..." readonly>
    <span class="story-send">❤️</span>
    <span class="story-send">↗</span>
  </div>
</div>

<script>
// ?p=@유저,시간,이미지설명,[캡션]
function parseParams() {
  const params = new URLSearchParams(window.location.search);
  const p = params.get('p');
  if (!p) return;

  const parts = p.split(',');
  const user    = parts[0] || '@user';
  const time    = parts[1] || '';
  const desc    = parts[2] || '';
  const caption = parts[3] || '';

  document.getElementById('story-user').textContent = user.replace('@','');
  if (time) document.getElementById('story-time').textContent = time;
  if (desc) document.getElementById('story-desc').textContent = desc;

  if (caption) {
    document.getElementById('story-caption').style.display = 'block';
    document.getElementById('caption-text').textContent = caption;
  }
}
parseParams();
</script>
</body>
</html>
`,
  '/search': `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Search Results</title>
<style>
  :root {
    --col-indigo: #8889CD;
    --col-pink:   #DDAACC;
    --col-sand:   #CCAA88;
    --col-rose:   #BB6688;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #0e0a14;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    display: flex;
    justify-content: center;
    padding: 0;
    min-height: 100vh;
  }
  .search-page {
    width: 100%;
    max-width: 600px;
    color: #d7d7d7;
  }

  /* Search bar */
  .search-bar {
    position: sticky;
    top: 0;
    z-index: 10;
    background: #1a1422;
    border-bottom: 1px solid #2a2235;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .search-back {
    background: none;
    border: none;
    color: var(--col-pink);
    font-size: 18px;
    cursor: pointer;
    padding: 4px;
  }
  .search-input-wrap {
    flex: 1;
    background: #221b2a;
    border: 1px solid #3a2e48;
    border-radius: 24px;
    padding: 10px 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .search-icon { font-size: 14px; color: var(--col-indigo); }
  .search-text {
    font-size: 14px;
    color: #fff;
    flex: 1;
    font-weight: 500;
  }
  .search-clear {
    background: none;
    border: none;
    color: #71677b;
    cursor: pointer;
    font-size: 14px;
  }

  /* Result count */
  .result-info {
    padding: 12px 16px 8px;
    font-size: 12px;
    color: #71677b;
  }

  /* Results */
  .results { padding: 0 16px 20px; }
  .result-item {
    padding: 16px 0;
    border-bottom: 1px solid #1e1828;
  }
  .result-item:last-child { border-bottom: none; }
  .result-url {
    font-size: 12px;
    color: var(--col-sand);
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .result-favicon {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #2a2235;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    flex-shrink: 0;
  }
  .result-title {
    font-size: 16px;
    color: var(--col-indigo);
    font-weight: 600;
    line-height: 1.4;
    margin-bottom: 6px;
    cursor: pointer;
  }
  .result-title:hover { text-decoration: underline; }
  .result-snippet {
    font-size: 13px;
    color: #9a90a8;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .result-snippet strong {
    color: var(--col-pink);
    font-weight: 600;
  }

  /* People also ask */
  .paa {
    margin: 8px 16px 16px;
    background: #1a1422;
    border: 1px solid #2a2235;
    border-radius: 12px;
    overflow: hidden;
  }
  .paa-title {
    padding: 14px 16px 10px;
    font-size: 15px;
    font-weight: 700;
    color: #ede8f2;
  }
  .paa-item {
    padding: 12px 16px;
    border-top: 1px solid #2a2235;
    font-size: 14px;
    color: #b8b0c4;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: background 0.15s;
  }
  .paa-item:hover { background: rgba(136,137,205,0.06); }
  .paa-arrow { color: #71677b; font-size: 12px; }
</style>
</head>
<body>
<div class="search-page">
  <div class="search-bar">
    <button class="search-back">←</button>
    <div class="search-input-wrap">
      <span class="search-icon">🔍</span>
      <span class="search-text" id="search-query">검색어</span>
      <button class="search-clear">✕</button>
    </div>
  </div>

  <div class="result-info" id="result-info">검색결과 약 0개</div>
  <div class="results" id="results"></div>
  <div class="paa" id="paa" style="display:none">
    <div class="paa-title">관련 검색어</div>
    <div id="paa-items"></div>
  </div>
</div>

<script>
// ?q=검색어,결과수
// &r=제목,URL,스니펫|제목,URL,스니펫
// &a=관련검색1|관련검색2|관련검색3
function parseParams() {
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q');
  const r = params.get('r');
  const a = params.get('a');

  if (q) {
    const qp = q.split(',');
    document.getElementById('search-query').textContent = qp[0] || '';
    const count = qp[1] || '0';
    document.getElementById('result-info').textContent =
      \`검색결과 약 \${Number(count).toLocaleString()}개 (0.\${Math.floor(Math.random()*9)+1}\${Math.floor(Math.random()*9)}초)\`;
  }

  if (r) {
    const container = document.getElementById('results');
    r.split('|').forEach(raw => {
      const seg = raw.split(',');
      const title   = seg[0] || '';
      const url     = seg[1] || '';
      const snippet = seg.slice(2).join(',') || '';
      const favicon = url.charAt(0).toUpperCase();

      const div = document.createElement('div');
      div.className = 'result-item';
      div.innerHTML = \`
        <div class="result-url">
          <div class="result-favicon">\${favicon}</div>
          \${url}
        </div>
        <div class="result-title">\${title}</div>
        <div class="result-snippet">\${snippet}</div>
      \`;
      container.appendChild(div);
    });
  }

  if (a) {
    document.getElementById('paa').style.display = 'block';
    const paaContainer = document.getElementById('paa-items');
    a.split('|').forEach(text => {
      const div = document.createElement('div');
      div.className = 'paa-item';
      div.innerHTML = \`<span>\${text}</span><span class="paa-arrow">▼</span>\`;
      paaContainer.appendChild(div);
    });
  }
}
parseParams();
</script>
</body>
</html>
`,
  '/news': `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>News Article</title>
<style>
  :root {
    --col-indigo: #8889CD;
    --col-pink:   #DDAACC;
    --col-sand:   #CCAA88;
    --col-rose:   #BB6688;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #f5f0f4;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Georgia, serif;
    display: flex;
    justify-content: center;
    padding: 20px 0;
    min-height: 100vh;
  }
  .article {
    width: 100%;
    max-width: 560px;
    background: #fff;
    border-radius: 12px;
    border: 1px solid #e0d4dc;
    overflow: hidden;
  }

  /* Top bar */
  .article-bar {
    background: #1a1422;
    padding: 10px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .article-outlet {
    font-size: 14px;
    font-weight: 700;
    color: var(--col-pink);
    font-family: Georgia, 'Times New Roman', serif;
    letter-spacing: 0.5px;
  }
  .article-bar-tag {
    margin-left: auto;
    font-size: 10px;
    color: var(--col-sand);
    background: rgba(204,170,136,0.15);
    padding: 3px 8px;
    border-radius: 4px;
    font-weight: 600;
    font-family: -apple-system, sans-serif;
  }

  /* Image */
  .article-image {
    width: 100%;
    aspect-ratio: 16/9;
    background: #ede6ef;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .article-image svg {
    width: 44px;
    height: 44px;
    fill: var(--col-pink);
    opacity: 0.4;
  }
  .article-image-desc {
    font-size: 12px;
    color: var(--col-rose);
    opacity: 0.5;
    text-align: center;
    padding: 0 20px;
    font-family: -apple-system, sans-serif;
  }
  .article-image-credit {
    font-size: 10px;
    color: #b0a8b8;
    text-align: right;
    padding: 4px 16px;
    font-family: -apple-system, sans-serif;
  }

  /* Content */
  .article-content {
    padding: 20px 20px 24px;
  }
  .article-category {
    font-size: 11px;
    font-weight: 700;
    color: var(--col-rose);
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-bottom: 10px;
    font-family: -apple-system, sans-serif;
  }
  .article-title {
    font-size: 24px;
    font-weight: 700;
    color: #1a1a1a;
    line-height: 1.35;
    margin-bottom: 12px;
    font-family: Georgia, 'Times New Roman', serif;
  }
  .article-subtitle {
    font-size: 15px;
    color: #666;
    line-height: 1.5;
    margin-bottom: 16px;
    font-family: -apple-system, sans-serif;
  }
  .article-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #8e8e8e;
    padding-bottom: 16px;
    border-bottom: 1px solid #f0e8ee;
    margin-bottom: 18px;
    font-family: -apple-system, sans-serif;
  }
  .article-author-name { color: var(--col-indigo); font-weight: 600; }
  .article-body {
    font-size: 15px;
    line-height: 1.9;
    color: #333;
    white-space: pre-wrap;
    word-break: break-word;
  }

  /* Share bar */
  .article-share {
    border-top: 1px solid #f0e8ee;
    padding: 12px 20px;
    display: flex;
    gap: 12px;
    font-family: -apple-system, sans-serif;
  }
  .share-btn {
    padding: 6px 14px;
    border-radius: 20px;
    border: 1px solid #e0d4dc;
    background: #fff;
    font-size: 12px;
    color: #666;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s;
  }
  .share-btn:hover {
    border-color: var(--col-indigo);
    color: var(--col-indigo);
  }
</style>
</head>
<body>
<div class="article">
  <div class="article-bar">
    <span class="article-outlet" id="outlet">NEWS</span>
    <span class="article-bar-tag" id="bar-tag"></span>
  </div>

  <div class="article-image" id="article-image">
    <svg viewBox="0 0 24 24"><path d="M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4z"/><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>
    <div class="article-image-desc" id="img-desc"></div>
  </div>
  <div class="article-image-credit" id="img-credit"></div>

  <div class="article-content">
    <div class="article-category" id="category"></div>
    <div class="article-title" id="title">기사 제목</div>
    <div class="article-subtitle" id="subtitle"></div>
    <div class="article-meta">
      <span class="article-author-name" id="author"></span>
      <span>•</span>
      <span id="date"></span>
    </div>
    <div class="article-body" id="body">기사 본문</div>
  </div>

  <div class="article-share">
    <button class="share-btn">🔗 공유</button>
    <button class="share-btn">🔖 저장</button>
    <button class="share-btn">💬 댓글</button>
  </div>
</div>

<script>
// ?p=매체명,카테고리,제목,부제,기자,날짜,이미지설명,본문
function parseParams() {
  const params = new URLSearchParams(window.location.search);
  const p = params.get('p');
  if (!p) return;

  const parts = p.split(',');
  const outlet   = parts[0] || 'NEWS';
  const category = parts[1] || '';
  const title    = parts[2] || '';
  const subtitle = parts[3] || '';
  const author   = parts[4] || '';
  const date     = parts[5] || '';
  const imgDesc  = parts[6] || '';
  const body     = parts.slice(7).join(',') || '';

  document.getElementById('outlet').textContent = outlet;
  document.getElementById('bar-tag').textContent = category;
  document.getElementById('category').textContent = category;
  document.getElementById('title').textContent = title;
  if (subtitle) {
    document.getElementById('subtitle').textContent = subtitle;
  } else {
    document.getElementById('subtitle').style.display = 'none';
  }
  document.getElementById('author').textContent = author;
  document.getElementById('date').textContent = date;
  if (imgDesc) document.getElementById('img-desc').textContent = imgDesc;
  document.getElementById('body').textContent = body;
}
parseParams();
</script>
</body>
</html>
`,
  '/doc': `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Document</title>
<style>
  :root {
    --col-indigo: #8889CD;
    --col-pink:   #DDAACC;
    --col-sand:   #CCAA88;
    --col-rose:   #BB6688;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #e8e0e6;
    font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    display: flex;
    justify-content: center;
    padding: 24px 8px;
    min-height: 100vh;
  }
  .doc {
    width: 100%;
    max-width: 540px;
    background: #fff;
    border-radius: 4px;
    box-shadow: 0 2px 16px rgba(0,0,0,0.1);
    overflow: hidden;
  }

  /* Header band */
  .doc-band {
    background: linear-gradient(135deg, #1a1422, #2a2235);
    padding: 18px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .doc-org {
    font-size: 16px;
    font-weight: 700;
    color: var(--col-pink);
    letter-spacing: 1px;
  }
  .doc-stamp {
    font-size: 10px;
    color: var(--col-sand);
    background: rgba(204,170,136,0.15);
    padding: 3px 10px;
    border-radius: 3px;
    font-weight: 600;
    letter-spacing: 1px;
  }

  /* Title section */
  .doc-title-section {
    padding: 24px 24px 16px;
    border-bottom: 2px solid #1a1422;
  }
  .doc-type {
    font-size: 10px;
    color: var(--col-rose);
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  .doc-title {
    font-size: 20px;
    font-weight: 700;
    color: #1a1a1a;
    line-height: 1.4;
  }

  /* Info grid */
  .doc-info {
    padding: 16px 24px;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 6px 16px;
    border-bottom: 1px solid #f0e8ee;
  }
  .doc-info-label {
    font-size: 12px;
    color: #8e8e8e;
    font-weight: 600;
    white-space: nowrap;
  }
  .doc-info-value {
    font-size: 12px;
    color: #333;
    word-break: break-word;
  }

  /* Body */
  .doc-body {
    padding: 20px 24px;
    font-size: 14px;
    line-height: 1.9;
    color: #333;
    white-space: pre-wrap;
    word-break: break-word;
  }

  /* Table (성적표 등) */
  .doc-table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 13px;
  }
  .doc-table th {
    background: #1a1422;
    color: var(--col-pink);
    padding: 8px 12px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-align: left;
    border: 1px solid #2a2235;
  }
  .doc-table td {
    padding: 7px 12px;
    border: 1px solid #e0d4dc;
    color: #333;
  }
  .doc-table tr:nth-child(even) td {
    background: #faf6f9;
  }

  /* Footer */
  .doc-footer {
    padding: 16px 24px;
    border-top: 1px solid #f0e8ee;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .doc-footer-text {
    font-size: 11px;
    color: #8e8e8e;
    line-height: 1.6;
  }
  .doc-seal {
    width: 56px;
    height: 56px;
    border: 2px solid var(--col-rose);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: var(--col-rose);
    font-weight: 700;
    text-align: center;
    line-height: 1.2;
    transform: rotate(-15deg);
    opacity: 0.7;
    flex-shrink: 0;
  }
</style>
</head>
<body>
<div class="doc">
  <div class="doc-band">
    <span class="doc-org" id="org">기관명</span>
    <span class="doc-stamp" id="stamp"></span>
  </div>
  <div class="doc-title-section">
    <div class="doc-type" id="doc-type">문서 유형</div>
    <div class="doc-title" id="doc-title">문서 제목</div>
  </div>
  <div class="doc-info" id="doc-info"></div>
  <div class="doc-body" id="doc-body"></div>
  <div class="doc-footer">
    <div class="doc-footer-text" id="doc-footer"></div>
    <div class="doc-seal" id="doc-seal"></div>
  </div>
</div>

<script>
// ?p=기관명,문서유형,제목,스탬프라벨
// &i=라벨:값|라벨:값|라벨:값
// &b=본문내용
// &t=헤더1:헤더2:헤더3|값1:값2:값3|값1:값2:값3  (표 데이터, 선택)
// &f=푸터텍스트,직인텍스트
function parseParams() {
  const params = new URLSearchParams(window.location.search);
  const p = params.get('p');
  const i = params.get('i');
  const b = params.get('b');
  const t = params.get('t');
  const f = params.get('f');

  if (p) {
    const pp = p.split(',');
    document.getElementById('org').textContent = pp[0] || '';
    document.getElementById('doc-type').textContent = pp[1] || '';
    document.getElementById('doc-title').textContent = pp[2] || '';
    if (pp[3]) document.getElementById('stamp').textContent = pp[3];
  }

  if (i) {
    const infoEl = document.getElementById('doc-info');
    infoEl.innerHTML = '';
    i.split('|').forEach(pair => {
      const [label, value] = pair.split(':');
      infoEl.innerHTML += \`<div class="doc-info-label">\${label || ''}</div><div class="doc-info-value">\${value || ''}</div>\`;
    });
  }

  if (b) {
    document.getElementById('doc-body').textContent = b;
  }

  if (t) {
    const rows = t.split('|');
    const headers = rows[0].split(':');
    let html = '<table class="doc-table"><thead><tr>';
    headers.forEach(h => html += \`<th>\${h}</th>\`);
    html += '</tr></thead><tbody>';
    rows.slice(1).forEach(row => {
      html += '<tr>';
      row.split(':').forEach(cell => html += \`<td>\${cell}</td>\`);
      html += '</tr>';
    });
    html += '</tbody></table>';
    document.getElementById('doc-body').innerHTML += html;
  }

  if (f) {
    const fp = f.split(',');
    document.getElementById('doc-footer').textContent = fp[0] || '';
    if (fp[1]) {
      document.getElementById('doc-seal').textContent = fp[1];
    } else {
      document.getElementById('doc-seal').style.display = 'none';
    }
  }
}
parseParams();
</script>
</body>
</html>
`,
  '/board': `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Board</title>
<style>
  :root {
    --col-indigo: #8889CD;
    --col-pink:   #DDAACC;
    --col-sand:   #CCAA88;
    --col-rose:   #BB6688;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #0e0a14;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    display: flex;
    justify-content: center;
    padding: 20px 0;
    min-height: 100vh;
  }
  .board {
    width: 100%;
    max-width: 600px;
    color: #d7d7d7;
  }

  /* Header */
  .board-header {
    background: #1a1422;
    border: 1px solid #2a2235;
    border-radius: 12px 12px 0 0;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .board-name {
    font-size: 16px;
    font-weight: 700;
    color: var(--col-indigo);
  }
  .board-count {
    font-size: 12px;
    color: #71677b;
  }

  /* Category tabs */
  .board-tabs {
    background: #1a1422;
    border-left: 1px solid #2a2235;
    border-right: 1px solid #2a2235;
    padding: 0 12px;
    display: flex;
    gap: 4px;
    overflow-x: auto;
  }
  .board-tab {
    padding: 8px 14px;
    font-size: 12px;
    color: #71677b;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    white-space: nowrap;
    transition: all 0.15s;
    font-weight: 600;
  }
  .board-tab.active {
    color: var(--col-pink);
    border-bottom-color: var(--col-pink);
  }
  .board-tab:hover { color: var(--col-pink); }

  /* Post list */
  .board-list {
    border: 1px solid #2a2235;
    border-top: none;
    border-radius: 0 0 12px 12px;
    overflow: hidden;
  }
  .board-item {
    padding: 12px 16px;
    border-bottom: 1px solid #1e1828;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: background 0.15s;
  }
  .board-item:last-child { border-bottom: none; }
  .board-item:hover { background: rgba(136,137,205,0.05); }

  .board-item-left { flex: 1; min-width: 0; }
  .board-item-tag {
    display: inline-block;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 3px;
    margin-right: 6px;
  }
  .tag-notice { background: rgba(187,102,136,0.2); color: var(--col-rose); }
  .tag-hot { background: rgba(204,170,136,0.2); color: var(--col-sand); }
  .tag-normal { background: rgba(136,137,205,0.15); color: var(--col-indigo); }
  .tag-new { background: rgba(221,170,204,0.2); color: var(--col-pink); }

  .board-item-title {
    font-size: 14px;
    color: #e0dae8;
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .board-item-comment {
    font-size: 12px;
    color: var(--col-rose);
    font-weight: 600;
    margin-left: 4px;
  }
  .board-item-meta {
    margin-top: 4px;
    font-size: 11px;
    color: #71677b;
    display: flex;
    gap: 8px;
  }
  .board-item-right {
    text-align: center;
    flex-shrink: 0;
    min-width: 40px;
  }
  .board-item-votes {
    font-size: 14px;
    font-weight: 700;
    color: var(--col-indigo);
  }
  .board-item-vote-label {
    font-size: 9px;
    color: #71677b;
  }
</style>
</head>
<body>
<div class="board">
  <div class="board-header">
    <span class="board-name" id="board-name">게시판</span>
    <span class="board-count" id="board-count"></span>
  </div>
  <div class="board-tabs" id="board-tabs"></div>
  <div class="board-list" id="board-list"></div>
</div>

<script>
// ?b=게시판이름,[총게시글수]
// &tabs=전체|인기|공지|자유   (선택)
// &p=태그,제목,작성자,시간,조회,좋아요,[댓글수]|태그,제목,...
// 태그: notice, hot, new, normal (또는 커스텀 텍스트)
function parseParams() {
  const params = new URLSearchParams(window.location.search);
  const b = params.get('b');
  const tabs = params.get('tabs');
  const p = params.get('p');

  if (b) {
    const bp = b.split(',');
    document.getElementById('board-name').textContent = bp[0] || '게시판';
    if (bp[1]) document.getElementById('board-count').textContent = \`총 \${Number(bp[1]).toLocaleString()}개\`;
  }

  if (tabs) {
    const tabsEl = document.getElementById('board-tabs');
    tabs.split('|').forEach((t, i) => {
      const div = document.createElement('div');
      div.className = 'board-tab' + (i === 0 ? ' active' : '');
      div.textContent = t;
      tabsEl.appendChild(div);
    });
  }

  if (p) {
    const list = document.getElementById('board-list');
    p.split('|').forEach(raw => {
      const seg = raw.split(',');
      const tag     = seg[0] || 'normal';
      const title   = seg[1] || '';
      const author  = seg[2] || '';
      const time    = seg[3] || '';
      const views   = seg[4] || '0';
      const votes   = seg[5] || '0';
      const comments = seg[6] || '';

      const tagMap = {
        notice: ['공지', 'tag-notice'],
        hot: ['HOT', 'tag-hot'],
        new: ['NEW', 'tag-new'],
        normal: ['', 'tag-normal']
      };
      const [tagText, tagClass] = tagMap[tag] || [tag, 'tag-normal'];

      const div = document.createElement('div');
      div.className = 'board-item';
      div.innerHTML = \`
        <div class="board-item-left">
          <div class="board-item-title">
            \${tagText ? \`<span class="board-item-tag \${tagClass}">\${tagText}</span>\` : ''}\${title}\${comments ? \`<span class="board-item-comment">[\${comments}]</span>\` : ''}
          </div>
          <div class="board-item-meta">
            <span>\${author}</span>
            <span>\${time}</span>
            <span>조회 \${Number(views).toLocaleString()}</span>
          </div>
        </div>
        <div class="board-item-right">
          <div class="board-item-votes">\${Number(votes).toLocaleString()}</div>
          <div class="board-item-vote-label">추천</div>
        </div>
      \`;
      list.appendChild(div);
    });
  }
}
parseParams();
</script>
</body>
</html>
`,
  '/discord': `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Discord</title>
<style>
  :root {
    --col-indigo: #8889CD;
    --col-pink:   #DDAACC;
    --col-sand:   #CCAA88;
    --col-rose:   #BB6688;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #313338;
    font-family: 'gg sans', 'Noto Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    display: flex;
    justify-content: center;
    min-height: 100vh;
  }
  .discord {
    width: 100%;
    max-width: 520px;
    background: #313338;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  /* Channel header */
  .channel-header {
    background: #313338;
    border-bottom: 1px solid #1e1f22;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .channel-hash {
    font-size: 20px;
    color: #80848e;
    font-weight: 500;
  }
  .channel-name {
    font-size: 16px;
    font-weight: 600;
    color: #f2f3f5;
  }
  .channel-topic {
    font-size: 12px;
    color: #80848e;
    margin-left: 8px;
    padding-left: 8px;
    border-left: 1px solid #3f4147;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Messages */
  .messages {
    flex: 1;
    padding: 16px 0;
    overflow-y: auto;
  }
  .msg-group {
    padding: 2px 16px;
    display: flex;
    gap: 16px;
    margin-top: 16px;
  }
  .msg-group:first-child { margin-top: 0; }
  .msg-group:hover { background: rgba(0,0,0,0.06); }

  .msg-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 700;
    color: #fff;
  }
  .msg-content { flex: 1; min-width: 0; }
  .msg-header {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 2px;
  }
  .msg-author {
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
  }
  .msg-author:hover { text-decoration: underline; }
  .msg-role-tag {
    font-size: 10px;
    padding: 1px 5px;
    border-radius: 3px;
    font-weight: 600;
  }
  .msg-timestamp {
    font-size: 12px;
    color: #80848e;
  }
  .msg-text {
    font-size: 16px;
    color: #dbdee1;
    line-height: 1.4;
    word-break: break-word;
  }
  .msg-text .mention {
    background: rgba(136,137,205,0.15);
    color: var(--col-indigo);
    padding: 0 2px;
    border-radius: 3px;
    font-weight: 500;
    cursor: pointer;
  }

  /* Reactions */
  .msg-reactions {
    display: flex;
    gap: 4px;
    margin-top: 4px;
    flex-wrap: wrap;
  }
  .reaction {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    background: rgba(136,137,205,0.1);
    border: 1px solid rgba(136,137,205,0.2);
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .reaction:hover { background: rgba(136,137,205,0.2); }
  .reaction-count { font-size: 12px; color: #dbdee1; font-weight: 600; }

  /* Continued messages */
  .msg-cont {
    padding: 0 16px 0 72px;
    margin-top: 2px;
  }
  .msg-cont:hover { background: rgba(0,0,0,0.06); }
  .msg-cont .msg-text { font-size: 16px; }

  /* Input */
  .discord-input {
    padding: 0 16px 24px;
  }
  .input-wrap {
    background: #383a40;
    border-radius: 8px;
    padding: 10px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .input-plus {
    font-size: 20px;
    color: #b5bac1;
    cursor: pointer;
    flex-shrink: 0;
  }
  .input-text {
    flex: 1;
    font-size: 16px;
    color: #6d6f78;
  }
  .input-icons {
    display: flex;
    gap: 8px;
    font-size: 18px;
    color: #b5bac1;
  }
</style>
</head>
<body>
<div class="discord">
  <div class="channel-header">
    <span class="channel-hash">#</span>
    <span class="channel-name" id="channel-name">일반</span>
    <span class="channel-topic" id="channel-topic"></span>
  </div>

  <div class="messages" id="messages"></div>

  <div class="discord-input">
    <div class="input-wrap">
      <span class="input-plus">＋</span>
      <span class="input-text" id="input-placeholder">#일반에 메시지 보내기</span>
      <div class="input-icons">
        <span>😀</span>
        <span>🎁</span>
      </div>
    </div>
  </div>
</div>

<script>
// ?ch=채널이름,[토픽]
// &m=닉네임,역할색,역할태그,시간,내용,[리액션]|닉네임,...
// 역할색: 인디고/핑크/샌드/로즈/기본(흰색)
// 리액션: 이모지+숫자 (예: 👍3 🔥5)
// 같은 닉네임 연속이면 자동으로 이어붙이기

function roleColor(c) {
  const map = {
    '인디고': '#8889CD', '핑크': '#DDAACC', '샌드': '#CCAA88',
    '로즈': '#BB6688', '빨강': '#ed4245', '초록': '#57f287',
    '파랑': '#5865f2', '노랑': '#fee75c'
  };
  return map[c] || '#f2f3f5';
}

function avatarBg(name) {
  const colors = ['#5865f2','#eb459e','#57f287','#fee75c','#ed4245','#8889CD','#BB6688'];
  let h = 0;
  for (let c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return colors[Math.abs(h)];
}

function parseParams() {
  const params = new URLSearchParams(window.location.search);
  const ch = params.get('ch');
  const m = params.get('m');

  if (ch) {
    const cp = ch.split(',');
    document.getElementById('channel-name').textContent = cp[0] || '일반';
    document.getElementById('input-placeholder').textContent = \`#\${cp[0] || '일반'}에 메시지 보내기\`;
    if (cp[1]) document.getElementById('channel-topic').textContent = cp[1];
  }

  if (!m) return;

  const container = document.getElementById('messages');
  const msgList = m.split('|');
  let lastAuthor = '';

  msgList.forEach(raw => {
    const seg = raw.split(',');
    const nick      = seg[0] || '';
    const rColor    = seg[1] || '';
    const rTag      = seg[2] || '';
    const time      = seg[3] || '';
    const text      = seg[4] || '';
    const reactions  = seg[5] || '';

    const isCont = nick === lastAuthor;
    lastAuthor = nick;

    if (isCont) {
      const div = document.createElement('div');
      div.className = 'msg-cont';
      let html = \`<div class="msg-text">\${text}</div>\`;
      if (reactions) {
        html += '<div class="msg-reactions">';
        reactions.split(' ').forEach(r => {
          const emoji = r.replace(/[0-9]/g,'');
          const count = r.replace(/[^0-9]/g,'') || '1';
          html += \`<span class="reaction">\${emoji}<span class="reaction-count">\${count}</span></span>\`;
        });
        html += '</div>';
      }
      div.innerHTML = html;
      container.appendChild(div);
    } else {
      const group = document.createElement('div');
      group.className = 'msg-group';

      const color = roleColor(rColor);
      const initial = nick.charAt(0).toUpperCase();

      let html = \`
        <div class="msg-avatar" style="background:\${avatarBg(nick)}">\${initial}</div>
        <div class="msg-content">
          <div class="msg-header">
            <span class="msg-author" style="color:\${color}">\${nick}</span>
            \${rTag ? \`<span class="msg-role-tag" style="background:\${color}22;color:\${color};border:1px solid \${color}44">\${rTag}</span>\` : ''}
            <span class="msg-timestamp">\${time}</span>
          </div>
          <div class="msg-text">\${text}</div>\`;

      if (reactions) {
        html += '<div class="msg-reactions">';
        reactions.split(' ').forEach(r => {
          const emoji = r.replace(/[0-9]/g,'');
          const count = r.replace(/[^0-9]/g,'') || '1';
          html += \`<span class="reaction">\${emoji}<span class="reaction-count">\${count}</span></span>\`;
        });
        html += '</div>';
      }

      html += '</div>';
      group.innerHTML = html;
      container.appendChild(group);
    }
  });
}
parseParams();
</script>
</body>
</html>
`,
  '/voice': `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Discord Voice</title>
<style>
  :root {
    --col-indigo: #8889CD;
    --col-pink:   #DDAACC;
    --col-sand:   #CCAA88;
    --col-rose:   #BB6688;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #2b2d31;
    font-family: 'gg sans', 'Noto Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    display: flex;
    justify-content: center;
    min-height: 100vh;
  }
  .discord-vc {
    width: 100%;
    max-width: 280px;
    background: #2b2d31;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  /* Server name */
  .server-header {
    padding: 12px 16px;
    border-bottom: 1px solid #1e1f22;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .server-name {
    font-size: 15px;
    font-weight: 700;
    color: #f2f3f5;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .server-chevron {
    font-size: 11px;
    color: #80848e;
  }

  /* Channel list */
  .channel-list {
    flex: 1;
    padding: 8px 0;
    overflow-y: auto;
  }

  /* Category */
  .category {
    padding: 18px 8px 4px 16px;
    font-size: 11px;
    font-weight: 700;
    color: #80848e;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
  }
  .category-arrow {
    font-size: 8px;
    color: #80848e;
  }

  /* Text channels */
  .text-channel {
    padding: 6px 8px 6px 16px;
    margin: 1px 8px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: background 0.15s;
  }
  .text-channel:hover { background: rgba(255,255,255,0.04); }
  .text-channel.active { background: rgba(255,255,255,0.06); color: #f2f3f5; }
  .text-channel .ch-hash {
    font-size: 18px;
    color: #80848e;
    font-weight: 500;
    width: 20px;
    text-align: center;
    flex-shrink: 0;
  }
  .text-channel .ch-name {
    font-size: 15px;
    color: #80848e;
    font-weight: 500;
  }
  .text-channel.active .ch-name { color: #f2f3f5; }
  .text-channel:hover .ch-name { color: #dbdee1; }

  /* Voice channel */
  .voice-channel {
    padding: 6px 8px 6px 16px;
    margin: 1px 8px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: background 0.15s;
  }
  .voice-channel:hover { background: rgba(255,255,255,0.04); }
  .voice-channel .vc-icon {
    font-size: 18px;
    color: #80848e;
    width: 20px;
    text-align: center;
    flex-shrink: 0;
  }
  .voice-channel .vc-name {
    font-size: 15px;
    color: #80848e;
    font-weight: 500;
    flex: 1;
  }
  .voice-channel.active-vc .vc-name { color: #23a55a; }
  .voice-channel .vc-count {
    font-size: 12px;
    color: #80848e;
    background: rgba(255,255,255,0.06);
    padding: 1px 6px;
    border-radius: 8px;
  }

  /* Voice members */
  .vc-members {
    padding: 0 0 4px 44px;
  }
  .vc-member {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 8px;
    margin: 1px 0;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.15s;
  }
  .vc-member:hover { background: rgba(255,255,255,0.04); }
  .vc-member-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
    position: relative;
  }
  .vc-member-status {
    position: absolute;
    bottom: -1px;
    right: -1px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 2px solid #2b2d31;
  }
  .status-online { background: #23a55a; }
  .status-idle { background: #f0b232; }
  .status-dnd { background: #f23f43; }
  .status-streaming { background: #593695; }
  .vc-member-name {
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .vc-member-icons {
    margin-left: auto;
    display: flex;
    gap: 4px;
    font-size: 12px;
    color: #80848e;
    flex-shrink: 0;
  }
  .icon-muted { color: #f23f43; }
  .icon-deafened { color: #f23f43; }
  .icon-streaming { color: #593695; }
  .icon-video { color: #23a55a; }

  /* Connected bar */
  .connected-bar {
    background: #232428;
    border-top: 1px solid #1e1f22;
    padding: 8px 12px;
  }
  .connected-info {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  .connected-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #23a55a;
    flex-shrink: 0;
  }
  .connected-text {
    font-size: 13px;
    font-weight: 600;
    color: #23a55a;
  }
  .connected-channel {
    font-size: 12px;
    color: #80848e;
    font-weight: 500;
  }
  .connected-actions {
    display: flex;
    gap: 8px;
    justify-content: center;
  }
  .vc-action-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #383a40;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: #b5bac1;
    transition: all 0.15s;
  }
  .vc-action-btn:hover { background: #43444b; }
  .vc-action-btn.disconnect { background: #a12d2f; color: #fff; }
  .vc-action-btn.disconnect:hover { background: #c93b3e; }

  /* User panel */
  .user-panel {
    background: #232428;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    border-top: 1px solid #1e1f22;
  }
  .user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
  }
  .user-info { flex: 1; min-width: 0; }
  .user-display {
    font-size: 14px;
    font-weight: 600;
    color: #f2f3f5;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .user-status-text {
    font-size: 12px;
    color: #80848e;
  }
  .user-actions {
    display: flex;
    gap: 4px;
  }
  .user-action-btn {
    width: 28px;
    height: 28px;
    border-radius: 4px;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 16px;
    color: #b5bac1;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;
  }
  .user-action-btn:hover { background: rgba(255,255,255,0.08); }
</style>
</head>
<body>
<div class="discord-vc">
  <div class="server-header">
    <span class="server-name" id="server-name">서버 이름</span>
    <span class="server-chevron">▼</span>
  </div>

  <div class="channel-list" id="channel-list"></div>

  <div class="connected-bar" id="connected-bar" style="display:none">
    <div class="connected-info">
      <div class="connected-dot"></div>
      <span class="connected-text">음성 연결됨</span>
    </div>
    <div class="connected-channel" id="connected-ch"></div>
    <div class="connected-actions">
      <button class="vc-action-btn">📷</button>
      <button class="vc-action-btn">🖥</button>
      <button class="vc-action-btn">🎤</button>
      <button class="vc-action-btn">🎧</button>
      <button class="vc-action-btn disconnect">📞</button>
    </div>
  </div>

  <div class="user-panel">
    <div class="user-avatar" id="user-avatar" style="background:#5865f2">나</div>
    <div class="user-info">
      <div class="user-display" id="user-display">나</div>
      <div class="user-status-text">온라인</div>
    </div>
    <div class="user-actions">
      <button class="user-action-btn">🎤</button>
      <button class="user-action-btn">🎧</button>
      <button class="user-action-btn">⚙</button>
    </div>
  </div>
</div>

<script>
// ?s=서버이름,[내닉네임]
// &t=채널1|채널2|채널3  (텍스트 채널 목록)
// &v=음성채널이름,멤버1:역할색:상태:아이콘|멤버2:역할색:상태:아이콘;음성채널2,멤버...
//   상태: online, idle, dnd, streaming
//   아이콘: mute, deaf, stream, video (공백구분 복수 가능)
// &active=현재접속중인음성채널이름  (선택 - 하단 연결 바 표시)

function avatarBg(name) {
  const colors = ['#5865f2','#eb459e','#57f287','#fee75c','#ed4245','#8889CD','#BB6688','#CCAA88'];
  let h = 0;
  for (let c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return colors[Math.abs(h)];
}

function roleColor(c) {
  const map = {
    '인디고': '#8889CD', '핑크': '#DDAACC', '샌드': '#CCAA88',
    '로즈': '#BB6688', '빨강': '#ed4245', '초록': '#57f287',
    '파랑': '#5865f2', '노랑': '#fee75c', '흰색': '#f2f3f5'
  };
  return map[c] || '#b5bac1';
}

function parseParams() {
  const params = new URLSearchParams(window.location.search);
  const s = params.get('s');
  const t = params.get('t');
  const v = params.get('v');
  const active = params.get('active');

  let myName = '나';
  if (s) {
    const sp = s.split(',');
    document.getElementById('server-name').textContent = sp[0] || '서버';
    if (sp[1]) {
      myName = sp[1];
      document.getElementById('user-display').textContent = sp[1];
      document.getElementById('user-avatar').textContent = sp[1].charAt(0);
      document.getElementById('user-avatar').style.background = avatarBg(sp[1]);
    }
  }

  const list = document.getElementById('channel-list');

  // 텍스트 채널
  if (t) {
    const catDiv = document.createElement('div');
    catDiv.innerHTML = '<div class="category"><span class="category-arrow">▼</span> 채팅 채널</div>';
    list.appendChild(catDiv);

    t.split('|').forEach((ch, i) => {
      const div = document.createElement('div');
      div.className = 'text-channel' + (i === 0 ? ' active' : '');
      div.innerHTML = \`<span class="ch-hash">#</span><span class="ch-name">\${ch}</span>\`;
      list.appendChild(div);
    });
  }

  // 음성 채널
  if (v) {
    const catDiv = document.createElement('div');
    catDiv.innerHTML = '<div class="category"><span class="category-arrow">▼</span> 음성 채널</div>';
    list.appendChild(catDiv);

    v.split(';').forEach(vcRaw => {
      const [vcInfo, ...rest] = vcRaw.split(',');
      const vcName = vcInfo || '음성';
      const membersRaw = rest.join(',');

      // Parse members
      const members = [];
      if (membersRaw) {
        membersRaw.split('|').forEach(mRaw => {
          const parts = mRaw.split(':');
          members.push({
            name: parts[0] || '',
            color: parts[1] || '',
            status: parts[2] || 'online',
            icons: parts[3] || ''
          });
        });
      }

      const isActive = active && vcName === active;

      const vcDiv = document.createElement('div');
      vcDiv.className = 'voice-channel' + (isActive ? ' active-vc' : '');
      vcDiv.innerHTML = \`
        <span class="vc-icon">🔊</span>
        <span class="vc-name">\${vcName}</span>
        \${members.length > 0 ? \`<span class="vc-count">\${members.length}</span>\` : ''}
      \`;
      list.appendChild(vcDiv);

      // Members
      if (members.length > 0) {
        const membersDiv = document.createElement('div');
        membersDiv.className = 'vc-members';

        members.forEach(m => {
          const color = roleColor(m.color);
          const statusClass = 'status-' + m.status;
          let iconsHtml = '';
          if (m.icons) {
            const iconMap = { mute: '🔇', deaf: '🔇', stream: '🖥', video: '📷' };
            m.icons.split(' ').forEach(ic => {
              const cls = (ic === 'mute' || ic === 'deaf') ? ' icon-muted' : (ic === 'stream' ? ' icon-streaming' : ' icon-video');
              iconsHtml += \`<span class="\${cls}">\${iconMap[ic] || ''}</span>\`;
            });
          }

          const mDiv = document.createElement('div');
          mDiv.className = 'vc-member';
          mDiv.innerHTML = \`
            <div class="vc-member-avatar" style="background:\${avatarBg(m.name)}">
              \${m.name.charAt(0)}
              <div class="vc-member-status \${statusClass}"></div>
            </div>
            <span class="vc-member-name" style="color:\${color}">\${m.name}</span>
            <div class="vc-member-icons">\${iconsHtml}</div>
          \`;
          membersDiv.appendChild(mDiv);
        });

        list.appendChild(membersDiv);
      }
    });

    // Connected bar
    if (active) {
      document.getElementById('connected-bar').style.display = 'block';
      document.getElementById('connected-ch').textContent = \`🔊 \${active}\`;
    }
  }
}
parseParams();
</script>
</body>
</html>
`,
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (path === '/' || path === '') {
      const links = Object.keys(PAGES).map(p => 
        '<li><a href="' + p + '" style="color:#DDAACC;">' + p + '</a></li>'
      ).join('');
      return new Response(
        '<html><body style="font-family:sans-serif;padding:40px;background:#1a1a2e;color:#e0e0e0;">'
        + '<h1 style="color:#8889CD;">겨울의 SNS UI v5</h1>'
        + '<p>사용 가능한 경로 (13종):</p><ul>' + links + '</ul>'
        + '</body></html>',
        { headers: { 'content-type': 'text/html;charset=UTF-8' } }
      );
    }
    const html = PAGES[path];
    if (html) return new Response(html, { headers: { 'content-type': 'text/html;charset=UTF-8' } });
    return new Response('404 Not Found', { status: 404 });
  }
};
