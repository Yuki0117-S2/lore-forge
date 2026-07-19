// 겨울의 SNS UI Workers v13 — 19종 UI (구분자 § 통일 + letter/menu/dm 추가)
const TEMPLATES = {
  'insta': `<!DOCTYPE html>
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
    padding: 8px 14px;
  }

  .post-header-left {
    display: flex;
    align-items: center;
    gap: 7px;
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
    aspect-ratio: 4/3;
    background: #ede6ef;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 7px;
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
    line-height: 1.35;
  }

  /* Actions */
  .post-actions {
    padding: 8px 16px 4px;
    display: flex;
    align-items: center;
    gap: 8px;
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
    font-size: 13px;
    color: #262626;
    line-height: 1.35;
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
    line-height: 1.3;
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
    font-size: 13px;
    color: #262626;
    margin-bottom: 4px;
    line-height: 1.3;
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

  const parts = p.split('§');
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
      const seg = raw.split('§');
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
  'twitter': `<!DOCTYPE html>
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
    display: flex; justify-content: center; align-items: flex-start;
    min-height: 100vh; padding: 20px 0;
  }
  .tweet-wrap { width: 100%; max-width: 598px; color: #e7e9ea; }
  .tweet {
    background: #0d0d14; border: 1px solid #2a2535;
    border-radius: 16px 16px 0 0; padding: 14px 16px 4px; border-bottom: none;
  }
  .tweet.no-replies { border-radius: 16px; border-bottom: 1px solid #2a2535; padding-bottom: 6px; }
  .tweet-header { display: flex; gap: 10px; margin-bottom: 10px; }
  .avatar {
    width: 44px; height: 44px; border-radius: 50%;
    background: linear-gradient(135deg, var(--col-indigo), var(--col-rose));
    flex-shrink: 0; display: flex; align-items: center; justify-content: center;
  }
  .avatar svg { width: 60%; height: 60%; fill: #fff; opacity: 0.85; }
  .header-right { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; gap: 1px; }
  .name-row { display: flex; align-items: center; gap: 4px; }
  .display-name { font-size: 16px; font-weight: 700; color: #e7e9ea; }
  .verified { width: 18px; height: 18px; fill: var(--col-indigo); flex-shrink: 0; }
  .lock-icon { width: 15px; height: 15px; fill: #e7e9ea; flex-shrink: 0; opacity: 0.9; }
  .handle-row { font-size: 14px; color: #71767b; }
  .more-btn {
    margin-left: auto; background: none; border: none;
    color: #71767b; cursor: pointer; font-size: 18px; padding: 0 4px; align-self: flex-start;
  }
  .tweet-body {
    font-size: 17px; line-height: 1.45; color: #e7e9ea;
    margin: 2px 0 12px; white-space: pre-wrap; word-break: break-word;
  }
  .tweet-body .translation { color: #71767b; font-size: 14px; display: block; margin-top: 6px; }
  .tweet-image {
    width: 100%; aspect-ratio: 16/9; background: #18141e;
    border-radius: 16px; border: 1px solid #2a2535;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 8px; margin-bottom: 12px;
  }
  .tweet-image svg { width: 40px; height: 40px; fill: var(--col-indigo); opacity: 0.4; }
  .tweet-image .img-desc { font-size: 13px; color: var(--col-pink); opacity: 0.5; text-align: center; padding: 0 20px; }
  .tweet-meta {
    font-size: 14px; color: #71767b; padding-bottom: 12px;
    display: flex; gap: 5px; flex-wrap: wrap; align-items: baseline;
  }
  .tweet-meta .views-num { color: #e7e9ea; font-weight: 700; }
  .tweet-stats {
    display: flex; gap: 20px; flex-wrap: wrap; row-gap: 10px;
    padding: 12px 0; font-size: 15px; color: #e7e9ea;
    border-top: 1px solid #2f3336;
  }
  .stat-item { display: flex; gap: 5px; align-items: baseline; }
  .stat-item strong { font-weight: 700; font-size: 16px; }
  .stat-item span { color: #71767b; font-size: 14px; }
  .tweet-actions {
    display: flex; justify-content: space-around;
    padding: 6px 0; border-top: 1px solid #2f3336;
  }
  .action {
    display: flex; align-items: center; gap: 6px;
    color: #71767b; font-size: 13px; cursor: pointer;
    padding: 8px 10px; border-radius: 999px;
  }
  .action svg {
    width: 20px; height: 20px; fill: none; stroke: #71767b;
    stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round;
  }
  .replies-section {
    border: 1px solid #2a2535; border-top: 1px solid #2f3336;
    border-radius: 0 0 16px 16px; overflow: hidden;
  }
  .replies-sort {
    padding: 12px 16px 6px; font-size: 14px; font-weight: 700; color: #e7e9ea;
    display: flex; align-items: center; gap: 4px;
  }
  .replies-sort svg { width: 16px; height: 16px; fill: none; stroke: #71767b; stroke-width: 2; stroke-linecap: round; }
  .reply-item {
    padding: 12px 16px 6px; display: flex; gap: 10px;
    border-bottom: 1px solid #1a1724; background: #0d0d14;
  }
  .reply-item:last-child { border-bottom: none; }
  .reply-avatar {
    width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; font-weight: 700; color: #fff;
  }
  .reply-content { flex: 1; min-width: 0; }
  .reply-header { display: flex; align-items: baseline; gap: 5px; flex-wrap: wrap; }
  .reply-name { font-size: 15px; font-weight: 700; color: #e7e9ea; }
  .reply-handle { font-size: 14px; color: #71767b; }
  .replying-to { font-size: 14px; color: #71767b; margin: 1px 0 2px; }
  .replying-to .mention { color: #1d9bf0; }
  .reply-body { font-size: 15px; line-height: 1.4; color: #e7e9ea; word-break: break-word; margin: 2px 0 4px; white-space: pre-wrap; }
  .reply-actions {
    display: flex; justify-content: space-between; max-width: 425px;
    padding: 2px 0;
  }
  .reply-actions .action { padding: 5px 6px; font-size: 12px; gap: 5px; }
  .reply-actions .action svg { width: 17px; height: 17px; }
</style>
</head>
<body>
<div class="tweet-wrap">
  <div class="tweet no-replies" id="tweet-main">
    <div class="tweet-header">
      <div class="avatar">
        <svg viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
      </div>
      <div class="header-right">
        <div class="name-row">
          <span class="display-name" id="display-name">Display Name</span>
          <svg class="verified" id="verified-badge" viewBox="0 0 24 24" style="display:none"><path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.9-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91C2.88 9.33 2 10.57 2 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.66 1.31 1.9 2.19 3.34 2.19s2.67-.88 3.33-2.19c1.4.46 2.91.2 3.92-.81s1.26-2.52.8-3.91C21.37 14.67 22.25 13.43 22.25 12zm-6.12-1.26l-4.5 4.5a.75.75 0 01-1.06 0l-2.25-2.25a.75.75 0 011.06-1.06l1.72 1.72 3.97-3.97a.75.75 0 011.06 1.06z"/></svg>
          <svg class="lock-icon" id="lock-icon" viewBox="0 0 24 24" style="display:none"><path d="M17 9V7a5 5 0 00-10 0v2H5.5A1.5 1.5 0 004 10.5v9A1.5 1.5 0 005.5 21h13a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0018.5 9H17zm-8-2a3 3 0 016 0v2H9V7z"/></svg>
        </div>
        <div class="handle-row" id="handle-row">@handle</div>
      </div>
      <button class="more-btn">···</button>
    </div>
    <div class="tweet-body" id="tweet-body">트윗 내용</div>
    <div class="tweet-image" id="tweet-image" style="display:none">
      <svg viewBox="0 0 24 24"><path d="M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4z"/><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>
      <div class="img-desc" id="img-desc"></div>
    </div>
    <div class="tweet-meta" id="tweet-meta"></div>
    <div class="tweet-stats" id="tweet-stats" style="display:none"></div>
    <div class="tweet-actions">
      <div class="action"><svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></div>
      <div class="action"><svg viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg></div>
      <div class="action like"><svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg></div>
      <div class="action"><svg viewBox="0 0 24 24"><path d="M19 21l-7-4-7 4V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg></div>
      <div class="action"><svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg></div>
    </div>
  </div>
  <div class="replies-section" id="replies-section" style="display:none">
    <div class="replies-sort">관련성이 가장 높은 답글 <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></div>
    <div id="replies-container"></div>
  </div>
</div>
</body>
</html>`,
  'kakao': `<!DOCTYPE html>
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
    min-height: 900px;
  }

  .chat-wrap {
    width: 100%;
    max-width: 420px;
    min-height: 900px;
    background: #c8bdd4;
    display: flex;
    flex-direction: column;
  }

  /* Header */
  .chat-header {
    background: rgba(0,0,0,0.08);
    padding: 8px 14px;
    display: flex;
    align-items: center;
    gap: 7px;
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
    gap: 8px;
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
    padding: 6px 12px 70px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow-y: auto;
  }

  .msg-row {
    display: flex;
    align-items: flex-end;
    gap: 4px;
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
    padding: 6px 10px;
    font-size: 13px;
    line-height: 1.35;
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

  /* 발신자 변경 시 간격 */
  .msg-row:not(.cont) { margin-top: 10px; }
  .msg-row:not(.cont):first-child { margin-top: 0; }

  /* 연속 메시지 */
  .msg-row.cont { margin-top: 6px; }
  .msg-row.cont .msg-avatar { opacity: 0; }
  .msg-row.cont .msg-name { display: none; }

  /* Input bar */
  .input-bar {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 420px;
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
    <input class="input-field" placeholder="메시지 보내기" readonly="readonly"/>
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
  const colors = ['#e8736c','#f0a05a','#7eb8d4','#82c4a0','#a78fd4','#d47eb8','#7ab8c4','#e0976e','#6ecfcf','#c87eaa','#8fb87e','#cf9e6e','#7eaab8','#d48f8f'];
  let hash = 7;
  let _i=0; for (const c of name) { hash = (hash * 31 + c.charCodeAt(0) + _i * 17) | 0; _i++; }
  return colors[((hash % colors.length) + colors.length) % colors.length];
}

function parseParams() {
  const params = new URLSearchParams(window.location.search);
  const r = params.get('r');
  const m = params.get('m');

  if (r) {
    const rp = r.split('§');
    document.getElementById('room-name').textContent = rp[0] || '채팅방';
    if (rp[1]) document.getElementById('date-divider').textContent = rp[1];
    if (rp[2]) document.getElementById('member-count').textContent = rp[2];
  }

  if (!m) return;

  const container = document.getElementById('messages');
  const msgList = m.split('|');
  const prevSenders = {};

  msgList.forEach((raw, i) => {
    const seg = raw.split('§');
    const sender  = seg[0] || '';
    const content = seg[1] || '';
    const time    = seg[2] || '';
    const readCnt = seg[3] || '0';
    const isMe    = seg[seg.length - 1] === 'me';

    const prevSender = i > 0 ? msgList[i-1].split('§')[0] : null;
    const nextSender = i < msgList.length-1 ? msgList[i+1].split('§')[0] : null;
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
  'reddit': `<!DOCTYPE html>
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
    padding: 12px;
    margin-bottom: 5px;
  }
  .post-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #71677b;
    margin-bottom: 6px;
  }
  .subreddit { color: var(--col-indigo); font-weight: 700; }
  .post-author { color: var(--col-sand); }
  .post-title {
    font-size: 17px;
    font-weight: 700;
    color: #ede8f2;
    line-height: 1.3;
    margin-bottom: 5px;
  }
  .post-body {
    font-size: 13px;
    line-height: 1.45;
    color: #b8b0c4;
    margin-bottom: 6px;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .post-actions {
    display: flex;
    gap: 8px;
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
    padding: 8px 12px;
    margin-bottom: 5px;
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
    font-size: 12px;
    line-height: 1.3;
    color: #b8b0c4;
    margin-bottom: 5px;
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

  const parts = p.split('§');
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
      const seg = raw.split('§');
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
  'lock': `<!DOCTYPE html>
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
    min-height: 844px;
  }
  .phone {
    width: 100%;
    max-width: 390px;
    min-height: 844px;
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
    gap: 6px;
    margin-top: 30px;
  }
  .notif {
    background: rgba(255,255,255,0.08);
    backdrop-filter: blur(40px);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    padding: 8px 12px;
    display: flex;
    gap: 7px;
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
    font-size: 13px;
    font-weight: 600;
    color: #fff;
    margin-bottom: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .notif-body {
    font-size: 12px;
    color: rgba(255,255,255,0.6);
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Bottom */
  .bottom-bar {
    position: absolute;
    bottom: 30px;
    left: 0; right: 0;
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
    position: absolute;
    bottom: 8px;
    left: 50%;
    transform: translateX(-50%);
    width: 134px;
    height: 5px;
    background: rgba(255,255,255,0.3);
    border-radius: 3px;
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
  const timeParam = params.get('time') || params.get('t');
  const n = params.get('n');

  if (timeParam) {
    const tp = timeParam.split('§');
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
    const seg = raw.split('§');
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
  'email': `<!DOCTYPE html>
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
    min-height: 844px;
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
    gap: 8px;
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
    padding: 14px 18px 12px;
    border-bottom: 1px solid #f0e8ee;
  }
  .email-subject {
    font-size: 18px;
    font-weight: 700;
    color: #1a1a1a;
    line-height: 1.3;
    margin-bottom: 5px;
  }
  .email-from-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
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
    padding: 14px 18px;
    font-size: 13px;
    line-height: 1.35;
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

  const parts = p.split('§');
  const fromName  = parts[0] || '';
  const fromEmail = parts[1] || '';
  const toAddr    = parts[2] || '';
  const subject   = parts[3] || '';
  const date      = parts[4] || '';
  const body      = parts.slice(5).join('§') || '';

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
  'story': `<!DOCTYPE html>
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
    min-height: 900px;
  }
  .story {
    width: 100%;
    max-width: 420px;
    min-height: 900px;
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
    gap: 7px;
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
    gap: 8px;
    padding: 60px 20px;
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
    line-height: 1.3;
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
    line-height: 1.35;
    text-shadow: 0 1px 6px rgba(0,0,0,0.7);
  }

  /* Bottom */
  .story-bottom {
    padding: 12px 16px 24px;
    display: flex;
    align-items: center;
    gap: 7px;
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
    <input class="story-input" placeholder="메시지 보내기..." readonly="readonly"/>
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

  const parts = p.split('§');
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
  'search': `<!DOCTYPE html>
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
    padding: 8px 14px;
    display: flex;
    align-items: center;
    gap: 7px;
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
    padding: 10px 0;
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
    font-size: 15px;
    color: var(--col-indigo);
    font-weight: 600;
    line-height: 1.3;
    margin-bottom: 6px;
    cursor: pointer;
  }
  .result-title:hover { text-decoration: underline; }
  .result-snippet {
    font-size: 12px;
    color: #9a90a8;
    line-height: 1.3;
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
    padding: 8px 14px;
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
    const qp = q.split('§');
    document.getElementById('search-query').textContent = qp[0] || '';
    const count = qp[1] || '0';
    document.getElementById('result-info').textContent =
      \`검색결과 약 \${Number(count).toLocaleString()}개 (0.\${Math.floor(Math.random()*9)+1}\${Math.floor(Math.random()*9)}초)\`;
  }

  if (r) {
    const container = document.getElementById('results');
    r.split('|').forEach(raw => {
      const seg = raw.split('§');
      const title   = seg[0] || '';
      const url     = seg[1] || '';
      const snippet = seg.slice(2).join('§') || '';
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
  'news': `<!DOCTYPE html>
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
    gap: 7px;
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
    aspect-ratio: 16/6;
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
    padding: 14px 18px 18px;
  }
  .article-category {
    font-size: 11px;
    font-weight: 700;
    color: var(--col-rose);
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-bottom: 6px;
    font-family: -apple-system, sans-serif;
  }
  .article-title {
    font-size: 20px;
    font-weight: 700;
    color: #1a1a1a;
    line-height: 1.35;
    margin-bottom: 5px;
    font-family: Georgia, 'Times New Roman', serif;
  }
  .article-subtitle {
    font-size: 15px;
    color: #666;
    line-height: 1.35;
    margin-bottom: 6px;
    font-family: -apple-system, sans-serif;
  }
  .article-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #8e8e8e;
    padding-bottom: 10px;
    border-bottom: 1px solid #f0e8ee;
    margin-bottom: 12px;
    font-family: -apple-system, sans-serif;
  }
  .article-author-name { color: var(--col-indigo); font-weight: 600; }
  .article-body {
    font-size: 14px;
    line-height: 1.55;
    color: #333;
    white-space: pre-wrap;
    word-break: break-word;
  }

  /* Share bar */
  .article-share {
    border-top: 1px solid #f0e8ee;
    padding: 12px 20px;
    display: flex;
    gap: 8px;
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

  const parts = p.split('§');
  const outlet   = parts[0] || 'NEWS';
  const category = parts[1] || '';
  const title    = parts[2] || '';
  const subtitle = parts[3] || '';
  const author   = parts[4] || '';
  const date     = parts[5] || '';
  const imgDesc  = parts[6] || '';
  const body     = parts.slice(7).join('§') || '';

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
  'doc': `<!DOCTYPE html>
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
    padding: 20px 24px 12px;
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
    font-size: 18px;
    font-weight: 700;
    color: #1a1a1a;
    line-height: 1.3;
  }

  /* Info grid */
  .doc-info {
    padding: 12px 22px;
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
    padding: 14px 22px;
    font-size: 13px;
    line-height: 1.55;
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
    line-height: 1.3;
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
  const t = params.get('t2');
  const f = params.get('f');

  if (p) {
    const pp = p.split('§');
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
    const fp = f.split('§');
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
  'board': `<!DOCTYPE html>
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
    padding: 10px 14px;
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
    padding: 8px 14px;
    border-bottom: 1px solid #1e1828;
    display: flex;
    align-items: center;
    gap: 8px;
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
    line-height: 1.3;
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
    const bp = b.split('§');
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
      const seg = raw.split('§');
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
  'discord': `<!DOCTYPE html>
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
    min-height: 900px;
  }
  .discord {
    width: 100%;
    max-width: 520px;
    background: #313338;
    display: flex;
    flex-direction: column;
    min-height: 900px;
  }

  /* Channel header */
  .channel-header {
    background: #313338;
    border-bottom: 1px solid #1e1f22;
    padding: 8px 14px;
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
    padding: 8px 0;
    overflow-y: auto;
  }
  .msg-group {
    padding: 1px 14px;
    display: flex;
    gap: 8px;
    margin-top: 10px;
  }
  .msg-group:first-child { margin-top: 0; }
  .msg-group:hover { background: rgba(0,0,0,0.06); }

  .msg-avatar {
    width: 36px; height: 36px;
    border-radius: 50%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
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
    font-size: 14px;
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
    font-size: 14px;
    color: #dbdee1;
    line-height: 1.3;
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
  .msg-cont .msg-text { font-size: 14px; }

  /* Input */
  .discord-input {
    padding: 0 14px 16px;
  }
  .input-wrap {
    background: #383a40;
    border-radius: 8px;
    padding: 10px 16px;
    display: flex;
    align-items: center;
    gap: 7px;
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
  const colors = ['#5865f2','#FF6699','#57f287','#fee75c','#ed4245','#8889CD','#BB6688','#CCAA88','#3ba55c','#FF7722','#0077DD','#e8a44d','#9b84ec','#00BBDD'];
  let h = 7;
  let _i=0; for (const c of name) { h = (h * 31 + c.charCodeAt(0) + _i * 17) | 0; _i++; }
  return colors[((h % colors.length) + colors.length) % colors.length];
}

function parseParams() {
  const params = new URLSearchParams(window.location.search);
  const ch = params.get('ch');
  const m = params.get('m');

  if (ch) {
    const cp = ch.split('§');
    document.getElementById('channel-name').textContent = cp[0] || '일반';
    document.getElementById('input-placeholder').textContent = \`#\${cp[0] || '일반'}에 메시지 보내기\`;
    if (cp[1]) document.getElementById('channel-topic').textContent = cp[1];
  }

  if (!m) return;

  const container = document.getElementById('messages');
  const msgList = m.split('|');
  let lastAuthor = '';

  msgList.forEach(raw => {
    const seg = raw.split('§');
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
  'voice': `<!DOCTYPE html>
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
    min-height: 900px;
  }
  .discord-vc {
    width: 100%;
    max-width: 280px;
    background: #2b2d31;
    display: flex;
    flex-direction: column;
    min-height: 900px;
  }

  /* Server name */
  .server-header {
    padding: 8px 14px;
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
    font-size: 9px;
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
    padding: 12px 6px 3px 14px;
    font-size: 9px;
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
    padding: 0 0 2px 36px;
  }
  .vc-member {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 2px 6px;
    margin: 0;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.15s;
  }
  .vc-member:hover { background: rgba(255,255,255,0.04); }
  .vc-member-avatar {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
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
    font-size: 12px;
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
// &tc=채널1|채널2|채널3  (텍스트 채널 목록)
// &v=음성채널이름,멤버1:역할색:상태:아이콘|멤버2:역할색:상태:아이콘;음성채널2,멤버...
//   상태: online, idle, dnd, streaming
//   아이콘: mute, deaf, stream, video (공백구분 복수 가능)
// &active=현재접속중인음성채널이름  (선택 - 하단 연결 바 표시)

function avatarBg(name) {
  const colors = ['#5865f2','#FF6699','#57f287','#fee75c','#ed4245','#8889CD','#BB6688','#CCAA88','#3ba55c','#FF7722','#0077DD','#e8a44d','#9b84ec','#00BBDD'];
  let h = 7;
  let _i=0; for (const c of name) { h = (h * 31 + c.charCodeAt(0) + _i * 17) | 0; _i++; }
  return colors[((h % colors.length) + colors.length) % colors.length];
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
  const tc = params.get('tc');
  const v = params.get('v');
  const active = params.get('active');

  let myName = '나';
  if (s) {
    const sp = s.split('§');
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
  if (tc) {
    const catDiv = document.createElement('div');
    catDiv.innerHTML = '<div class="category"><span class="category-arrow">▼</span> 채팅 채널</div>';
    list.appendChild(catDiv);

    tc.split('|').forEach((ch, i) => {
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
      const [vcInfo, ...rest] = vcRaw.split('§');
      const vcName = vcInfo || '음성';
      const membersRaw = rest.join('§');

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
  'discord-full': `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Discord Full</title>
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
    min-height: 900px;
  }
  .app {
    width: 100%;
    max-width: 800px;
    display: flex;
    min-height: 900px;
  }

  /* Server bar */
  .server-bar {
    width: 52px;
    background: #1e1f22;
    padding: 8px 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }
  .server-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
    color: #fff;
    cursor: pointer;
    transition: border-radius 0.2s;
    position: relative;
  }
  .server-icon:hover { border-radius: 12px; }
  .server-icon.active { border-radius: 12px; }
  .server-icon .indicator {
    position: absolute;
    left: -8px;
    width: 4px;
    height: 8px;
    background: #fff;
    border-radius: 0 4px 4px 0;
  }
  .server-icon.active .indicator { height: 32px; }
  .server-divider {
    width: 28px;
    height: 2px;
    background: #35363c;
    border-radius: 1px;
    margin: 2px 0;
  }
  .home-icon {
    background: #313338;
    border-radius: 50%;
  }
  .home-icon:hover { background: #5865f2; border-radius: 12px; }

  /* Channel sidebar */
  .channel-side {
    width: 180px;
    background: #2b2d31;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }
  .server-header {
    padding: 12px 12px;
    border-bottom: 1px solid #1e1f22;
    font-size: 14px;
    font-weight: 700;
    color: #f2f3f5;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .channels { flex: 1; padding: 8px 0; overflow-y: auto; }
  .category {
    padding: 16px 8px 4px 12px;
    font-size: 10px;
    font-weight: 700;
    color: #80848e;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    cursor: pointer;
  }
  .ch-item {
    padding: 5px 8px 5px 12px;
    margin: 1px 6px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 14px;
    color: #80848e;
    font-weight: 500;
    transition: background 0.1s;
  }
  .ch-item:hover { background: rgba(255,255,255,0.04); color: #dbdee1; }
  .ch-item.active { background: rgba(255,255,255,0.06); color: #f2f3f5; }
  .ch-icon { width: 18px; text-align: center; font-size: 16px; flex-shrink: 0; }

  /* Voice members in sidebar */
  .vc-members-side { padding-left: 36px; }
  .vc-member-side {
    padding: 3px 6px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #80848e;
  }
  .vc-av-sm {
    width: 20px; height: 20px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 9px; font-weight: 700; color: #fff; flex-shrink: 0;
  }

  /* User panel */
  .user-panel {
    background: #232428;
    padding: 6px 8px;
    display: flex;
    align-items: center;
    gap: 6px;
    border-top: 1px solid #1e1f22;
  }
  .user-av {
    width: 28px; height: 28px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: #fff; flex-shrink: 0;
  }
  .user-name { font-size: 12px; font-weight: 600; color: #f2f3f5; flex: 1; }
  .user-btns { display: flex; gap: 2px; }
  .user-btn {
    width: 24px; height: 24px; background: none; border: none;
    cursor: pointer; font-size: 13px; color: #b5bac1; border-radius: 4px;
  }

  /* Chat area */
  .chat-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: #313338;
    min-width: 0;
  }
  .chat-header {
    padding: 10px 14px;
    border-bottom: 1px solid #1e1f22;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 600;
    color: #f2f3f5;
    flex-shrink: 0;
  }
  .chat-header-hash { color: #80848e; font-weight: 500; }
  .chat-header-topic {
    font-size: 12px; color: #80848e; font-weight: 400;
    margin-left: 8px; padding-left: 8px;
    border-left: 1px solid #3f4147;
  }

  /* Messages */
  .messages {
    flex: 1;
    padding: 8px 0;
    overflow-y: auto;
  }
  .date-divider {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 16px; margin: 8px 0;
  }
  .date-divider::before, .date-divider::after {
    content: ''; flex: 1; height: 1px; background: #3f4147;
  }
  .date-divider span {
    font-size: 11px; font-weight: 700; color: #80848e;
    white-space: nowrap;
  }

  .msg-group {
    padding: 1px 14px;
    display: flex;
    gap: 7px;
    margin-top: 8px;
  }
  .msg-group:hover { background: rgba(0,0,0,0.06); }
  .msg-avatar {
    width: 36px; height: 36px; border-radius: 50%;
    flex-shrink: 0; display: flex; align-items: center;
    justify-content: center; font-size: 13px; font-weight: 700; color: #fff;
  }
  .msg-content { flex: 1; min-width: 0; }
  .msg-header { display: flex; align-items: baseline; gap: 8px; margin-bottom: 2px; }
  .msg-author { font-size: 14px; font-weight: 600; cursor: pointer; }
  .msg-author:hover { text-decoration: underline; }
  .msg-time { font-size: 11px; color: #80848e; }
  .msg-text { font-size: 14px; color: #dbdee1; line-height: 1.3; word-break: break-word; }

  .msg-cont {
    padding: 0 14px 0 68px;
  }
  .msg-cont:hover { background: rgba(0,0,0,0.06); }

  /* Chat input */
  .chat-input {
    padding: 0 12px 14px;
    flex-shrink: 0;
  }
  .input-box {
    background: #383a40;
    border-radius: 8px;
    padding: 9px 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .input-plus { font-size: 18px; color: #b5bac1; cursor: pointer; }
  .input-text { flex: 1; font-size: 15px; color: #6d6f78; }
  .input-icons { display: flex; gap: 6px; font-size: 16px; color: #b5bac1; }
</style>
</head>
<body>
<div class="app">
  <!-- Server bar -->
  <div class="server-bar" id="server-bar">
    <div class="server-icon home-icon">🏠</div>
    <div class="server-divider"></div>
  </div>

  <!-- Channel sidebar -->
  <div class="channel-side">
    <div class="server-header" id="server-name">서버</div>
    <div class="channels" id="channels"></div>
    <div class="user-panel">
      <div class="user-av" id="user-av" style="background:#5865f2">나</div>
      <span class="user-name" id="user-name">나</span>
      <div class="user-btns">
        <button class="user-btn">🎤</button>
        <button class="user-btn">🎧</button>
        <button class="user-btn">⚙</button>
      </div>
    </div>
  </div>

  <!-- Chat -->
  <div class="chat-area">
    <div class="chat-header">
      <span class="chat-header-hash">#</span>
      <span id="chat-ch-name">일반</span>
      <span class="chat-header-topic" id="chat-topic"></span>
    </div>
    <div class="messages" id="messages"></div>
    <div class="chat-input">
      <div class="input-box">
        <span class="input-plus">＋</span>
        <span class="input-text" id="input-ph">#일반에 메시지 보내기</span>
        <div class="input-icons"><span>😀</span><span>🎁</span></div>
      </div>
    </div>
  </div>
</div>

<script>
// ?s=서버이름,내닉네임
// &sv=서버약자1:색|서버약자2:색  (왼쪽 서버 아이콘들, 첫번째가 active)
// &tc=텍채1|텍채2|텍채3  (active는 첫번째)
// &vc=음챗이름,멤버1|멤버2|멤버3;음챗2,멤버...
// &ch=현재채널이름,[토픽]
// &d=날짜구분텍스트  (선택)
// &m=닉네임,역할색,시간,내용|닉네임,...

function avatarBg(name) {
  const colors = ['#5865f2','#FF6699','#57f287','#fee75c','#ed4245','#8889CD','#BB6688','#CCAA88','#3ba55c','#FF7722','#0077DD','#e8a44d','#9b84ec','#00BBDD'];
  let h = 7;
  let _i=0; for (const c of name) { h = (h * 31 + c.charCodeAt(0) + _i * 17) | 0; _i++; }
  return colors[((h % colors.length) + colors.length) % colors.length];
}
function roleColor(c) {
  const map = {
    '인디고':'#8889CD','핑크':'#DDAACC','샌드':'#CCAA88',
    '로즈':'#BB6688','빨강':'#ed4245','초록':'#57f287',
    '파랑':'#5865f2','노랑':'#fee75c','흰색':'#f2f3f5'
  };
  return map[c] || '#b5bac1';
}

function parseParams() {
  const params = new URLSearchParams(window.location.search);
  const s = params.get('s');
  const sv = params.get('sv');
  const tc = params.get('tc');
  const vc = params.get('vc');
  const ch = params.get('ch');
  const d = params.get('d');
  const m = params.get('m');

  let myName = '나';
  if (s) {
    const sp = s.split('§');
    document.getElementById('server-name').textContent = sp[0] || '서버';
    if (sp[1]) {
      myName = sp[1];
      document.getElementById('user-name').textContent = sp[1];
      document.getElementById('user-av').textContent = sp[1].charAt(0);
      document.getElementById('user-av').style.background = avatarBg(sp[1]);
    }
  }

  // Server icons
  if (sv) {
    const bar = document.getElementById('server-bar');
    sv.split('|').forEach((raw, i) => {
      const [abbr, color] = raw.split(':');
      const div = document.createElement('div');
      div.className = 'server-icon' + (i === 0 ? ' active' : '');
      div.style.background = color || avatarBg(abbr);
      div.textContent = abbr;
      if (i === 0) div.innerHTML = '<div class="indicator"></div>' + abbr;
      bar.appendChild(div);
    });
  }

  // Channels
  const chList = document.getElementById('channels');
  if (tc) {
    const cat = document.createElement('div');
    cat.className = 'category';
    cat.textContent = '▾ 채팅 채널';
    chList.appendChild(cat);

    const activeChName = ch ? ch.split('§')[0] : '';
    tc.split('|').forEach(name => {
      const div = document.createElement('div');
      div.className = 'ch-item' + (name === activeChName ? ' active' : '');
      div.innerHTML = \`<span class="ch-icon">#</span>\${name}\`;
      chList.appendChild(div);
    });
  }

  if (vc) {
    const cat = document.createElement('div');
    cat.className = 'category';
    cat.textContent = '▾ 음성 채널';
    chList.appendChild(cat);

    vc.split(';').forEach(vcRaw => {
      const parts = vcRaw.split('§');
      const vcName = parts[0];
      const members = parts.slice(1);

      const div = document.createElement('div');
      div.className = 'ch-item';
      div.innerHTML = \`<span class="ch-icon">🔊</span>\${vcName}\`;
      chList.appendChild(div);

      if (members.length > 0 && members[0]) {
        const mDiv = document.createElement('div');
        mDiv.className = 'vc-members-side';
        members.forEach(name => {
          const md = document.createElement('div');
          md.className = 'vc-member-side';
          md.innerHTML = \`<div class="vc-av-sm" style="background:\${avatarBg(name)}">\${name.charAt(0)}</div>\${name}\`;
          mDiv.appendChild(md);
        });
        chList.appendChild(mDiv);
      }
    });
  }

  // Chat header
  if (ch) {
    const cp = ch.split('§');
    document.getElementById('chat-ch-name').textContent = cp[0] || '일반';
    document.getElementById('input-ph').textContent = \`#\${cp[0] || '일반'}에 메시지 보내기\`;
    if (cp[1]) document.getElementById('chat-topic').textContent = cp[1];
  }

  const msgContainer = document.getElementById('messages');

  // Date divider
  if (d) {
    const dd = document.createElement('div');
    dd.className = 'date-divider';
    dd.innerHTML = \`<span>\${d}</span>\`;
    msgContainer.appendChild(dd);
  }

  // Messages
  if (m) {
    let lastAuthor = '';
    m.split('|').forEach(raw => {
      const seg = raw.split('§');
      const nick = seg[0] || '';
      const rColor = seg[1] || '';
      const time = seg[2] || '';
      const text = seg.slice(3).join('§') || '';
      const isCont = nick === lastAuthor;
      lastAuthor = nick;

      if (isCont) {
        const div = document.createElement('div');
        div.className = 'msg-cont';
        div.innerHTML = \`<div class="msg-text">\${text}</div>\`;
        msgContainer.appendChild(div);
      } else {
        const div = document.createElement('div');
        div.className = 'msg-group';
        div.innerHTML = \`
          <div class="msg-avatar" style="background:\${avatarBg(nick)}">\${nick.charAt(0)}</div>
          <div class="msg-content">
            <div class="msg-header">
              <span class="msg-author" style="color:\${roleColor(rColor)}">\${nick}</span>
              <span class="msg-time">\${time}</span>
            </div>
            <div class="msg-text">\${text}</div>
          </div>
        \`;
        msgContainer.appendChild(div);
      }
    });
  }

  // Scroll to bottom
  msgContainer.scrollTop = msgContainer.scrollHeight;
}
parseParams();
</script>
</body>
</html>`,
  'stream': `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Live Stream</title>
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
    min-height: 900px;
  }
  .stream-app {
    width: 100%;
    max-width: 820px;
    display: flex;
    flex-direction: column;
    min-height: 900px;
  }

  /* Top bar */
  .top-bar {
    background: #1a1422;
    padding: 8px 14px;
    display: flex;
    align-items: center;
    gap: 7px;
    border-bottom: 1px solid #2a2235;
  }
  .top-logo {
    font-size: 18px;
    font-weight: 800;
    color: var(--col-indigo);
  }
  .top-search {
    flex: 1;
    background: #2a2235;
    border: none;
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 13px;
    color: #71677b;
    max-width: 240px;
    margin-left: auto;
  }
  .top-user {
    width: 28px; height: 28px; border-radius: 50%;
    background: var(--col-rose);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; color: #fff;
  }

  /* Main content */
  .main {
    flex: 1;
    display: flex;
    min-height: 0;
  }

  /* Video section */
  .video-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  /* Player */
  .player {
    width: 100%;
    aspect-ratio: 16/8;
    background: #111;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 8px;
  }
  .player svg {
    width: 48px; height: 48px;
    fill: var(--col-indigo); opacity: 0.3;
  }
  .player-desc {
    font-size: 13px; color: var(--col-pink); opacity: 0.4;
    text-align: center; padding: 0 20px;
  }
  .live-badge {
    position: absolute;
    top: 12px; left: 12px;
    background: #e91916;
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 4px;
    letter-spacing: 0.5px;
  }
  .viewer-count {
    position: absolute;
    top: 12px; right: 12px;
    background: rgba(0,0,0,0.6);
    color: #fff;
    font-size: 12px;
    padding: 3px 8px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .viewer-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #e91916;
  }

  /* Player controls */
  .player-controls {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    background: linear-gradient(transparent, rgba(0,0,0,0.8));
    padding: 24px 12px 8px;
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .ctrl-btn {
    background: none; border: none;
    color: #fff; font-size: 16px; cursor: pointer;
    padding: 4px;
  }
  .ctrl-spacer { flex: 1; }
  .live-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #e91916;
  }
  .live-text { font-size: 12px; color: #fff; font-weight: 600; }

  /* Stream info */
  .stream-info {
    padding: 8px 12px;
    display: flex;
    gap: 7px;
    border-bottom: 1px solid #2a2235;
  }
  .streamer-avatar {
    width: 44px; height: 44px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; font-weight: 700; color: #fff;
    flex-shrink: 0;
    border: 2px solid var(--col-rose);
  }
  .stream-details { flex: 1; min-width: 0; }
  .stream-title {
    font-size: 15px; font-weight: 700; color: #ede8f2;
    line-height: 1.3;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .streamer-name {
    font-size: 13px; color: var(--col-indigo); font-weight: 600;
    margin-top: 2px;
  }
  .stream-tags {
    display: flex; gap: 4px; margin-top: 4px; flex-wrap: wrap;
  }
  .stream-tag {
    font-size: 10px; padding: 2px 8px;
    background: rgba(136,137,205,0.12);
    color: var(--col-pink);
    border-radius: 12px; font-weight: 600;
  }
  .follow-btn {
    align-self: center;
    background: var(--col-rose);
    border: none; border-radius: 6px;
    padding: 6px 14px;
    font-size: 12px; font-weight: 700;
    color: #fff; cursor: pointer;
    flex-shrink: 0;
    font-family: inherit;
  }
  .follow-btn:hover { opacity: 0.9; }

  /* Chat sidebar */
  .chat-side {
    width: 280px;
    background: #1a1422;
    border-left: 1px solid #2a2235;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }
  .chat-header {
    padding: 10px 12px;
    font-size: 13px;
    font-weight: 700;
    color: #ede8f2;
    border-bottom: 1px solid #2a2235;
    text-align: center;
  }
  .chat-messages {
    flex: 1;
    padding: 8px 10px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .chat-msg {
    font-size: 12px;
    line-height: 1.35;
    word-break: break-word;
  }
  .chat-nick {
    font-weight: 700;
    margin-right: 4px;
  }
  .chat-text { color: #b8b0c4; }
  .chat-system {
    font-size: 12px;
    color: #71677b;
    text-align: center;
    padding: 4px 0;
  }

  /* Chat input */
  .chat-input-area {
    padding: 8px 10px;
    border-top: 1px solid #2a2235;
  }
  .chat-input-box {
    background: #2a2235;
    border-radius: 6px;
    padding: 8px 10px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .chat-input-text {
    flex: 1;
    font-size: 13px;
    color: #71677b;
  }
  .chat-send {
    background: var(--col-indigo);
    border: none; border-radius: 4px;
    padding: 4px 10px;
    font-size: 12px; font-weight: 700;
    color: #fff; cursor: pointer;
    font-family: inherit;
  }

  @media (max-width: 600px) {
    .chat-side { width: 200px; }
  }
</style>
</head>
<body>
<div class="stream-app">
  <div class="top-bar">
    <span class="top-logo">LIVE</span>
    <div class="top-search">검색</div>
    <div class="top-user" id="top-user">U</div>
  </div>

  <div class="main">
    <div class="video-section">
      <div class="player">
        <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        <div class="player-desc" id="player-desc">방송 화면</div>
        <div class="live-badge">LIVE</div>
        <div class="viewer-count">
          <div class="viewer-dot"></div>
          <span id="viewer-count">0</span>
        </div>
        <div class="player-controls">
          <button class="ctrl-btn">▶</button>
          <button class="ctrl-btn">🔊</button>
          <div class="ctrl-spacer"></div>
          <div class="live-dot"></div>
          <span class="live-text">LIVE</span>
          <button class="ctrl-btn">⛶</button>
        </div>
      </div>
      <div class="stream-info">
        <div class="streamer-avatar" id="streamer-avatar">S</div>
        <div class="stream-details">
          <div class="stream-title" id="stream-title">방송 제목</div>
          <div class="streamer-name" id="streamer-name">스트리머</div>
          <div class="stream-tags" id="stream-tags"></div>
        </div>
        <button class="follow-btn">팔로우</button>
      </div>
    </div>

    <div class="chat-side">
      <div class="chat-header">실시간 채팅</div>
      <div class="chat-messages" id="chat-messages"></div>
      <div class="chat-input-area">
        <div class="chat-input-box">
          <span class="chat-input-text">채팅을 입력하세요</span>
          <button class="chat-send">전송</button>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
// ?p=스트리머닉,방송제목,시청자수,화면설명,[태그1 태그2 태그3]
// &c=닉:색:내용|닉:색:내용|system:시스템메시지
// 색: 인디고/핑크/샌드/로즈/빨강/초록/파랑/노랑 또는 생략

function roleColor(c) {
  const map = {
    '인디고':'#8889CD','핑크':'#DDAACC','샌드':'#CCAA88',
    '로즈':'#BB6688','빨강':'#ed4245','초록':'#57f287',
    '파랑':'#5865f2','노랑':'#fee75c','구독자':'#BB6688',
    '매니저':'#CCAA88'
  };
  return map[c] || '#DDAACC';
}

function parseParams() {
  const params = new URLSearchParams(window.location.search);
  const p = params.get('p');
  const c = params.get('c');

  if (p) {
    const pp = p.split('§');
    const streamer = pp[0] || '스트리머';
    const title    = pp[1] || '';
    const viewers  = pp[2] || '0';
    const desc     = pp[3] || '';
    const tags     = pp[4] || '';

    document.getElementById('streamer-name').textContent = streamer;
    document.getElementById('streamer-avatar').textContent = streamer.charAt(0);
    document.getElementById('streamer-avatar').style.background =
      \`linear-gradient(135deg, var(--col-indigo), var(--col-rose))\`;
    document.getElementById('stream-title').textContent = title;
    document.getElementById('viewer-count').textContent = Number(viewers).toLocaleString();
    if (desc) document.getElementById('player-desc').textContent = desc;

    if (tags) {
      const tagsEl = document.getElementById('stream-tags');
      tags.split(' ').forEach(t => {
        const span = document.createElement('span');
        span.className = 'stream-tag';
        span.textContent = t;
        tagsEl.appendChild(span);
      });
    }
  }

  if (c) {
    const chatEl = document.getElementById('chat-messages');
    c.split('|').forEach(raw => {
      const seg = raw.split(':');

      if (seg[0] === 'system') {
        const div = document.createElement('div');
        div.className = 'chat-system';
        div.textContent = seg.slice(1).join(':');
        chatEl.appendChild(div);
        return;
      }

      const nick  = seg[0] || '';
      const color = seg[1] || '';
      const text  = seg.slice(2).join(':') || '';

      const div = document.createElement('div');
      div.className = 'chat-msg';
      div.innerHTML = \`<span class="chat-nick" style="color:\${roleColor(color)}">\${nick}</span><span class="chat-text">\${text}</span>\`;
      chatEl.appendChild(div);
    });

    chatEl.scrollTop = chatEl.scrollHeight;
  }
}
parseParams();
</script>
</body>
</html>
`,
  'post': `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Board Post</title>
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
  .post-page {
    width: 100%;
    max-width: 600px;
    color: #d7d7d7;
  }

  /* Header */
  .post-header {
    background: #1a1422;
    border: 1px solid #2a2235;
    border-radius: 12px 12px 0 0;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .post-back {
    color: var(--col-pink);
    font-size: 18px;
    cursor: pointer;
    padding: 0 4px;
  }
  .post-board-name {
    font-size: 15px;
    font-weight: 700;
    color: var(--col-indigo);
  }

  /* Post content */
  .post-content {
    background: #1a1422;
    border-left: 1px solid #2a2235;
    border-right: 1px solid #2a2235;
    padding: 14px 16px 10px;
  }
  .post-tag {
    display: inline-block;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 3px;
    margin-bottom: 5px;
  }
  .tag-notice { background: rgba(187,102,136,0.2); color: var(--col-rose); }
  .tag-hot { background: rgba(204,170,136,0.2); color: var(--col-sand); }
  .tag-new { background: rgba(221,170,204,0.2); color: var(--col-pink); }
  .tag-normal { background: rgba(136,137,205,0.15); color: var(--col-indigo); }
  .post-title {
    font-size: 17px;
    font-weight: 700;
    color: #ede8f2;
    line-height: 1.3;
    margin-bottom: 6px;
  }
  .post-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #71677b;
    margin-bottom: 6px;
    padding-bottom: 14px;
    border-bottom: 1px solid #2a2235;
  }
  .post-author { color: var(--col-sand); font-weight: 600; }
  .post-body {
    font-size: 13px;
    line-height: 1.35;
    color: #b8b0c4;
    white-space: pre-wrap;
    word-break: break-word;
  }

  /* Post actions */
  .post-actions {
    background: #1a1422;
    border-left: 1px solid #2a2235;
    border-right: 1px solid #2a2235;
    padding: 8px 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    border-top: 1px solid #2a2235;
  }
  .vote-box {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 12px;
    background: #221b2a;
    border-radius: 20px;
  }
  .vote-btn {
    cursor: pointer;
    font-size: 14px;
    color: #71677b;
  }
  .vote-btn:hover { color: var(--col-rose); }
  .vote-count {
    font-size: 13px;
    font-weight: 700;
    color: var(--col-indigo);
  }
  .action-item {
    font-size: 12px;
    color: #71677b;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .action-item:hover { color: var(--col-pink); }

  /* Comments */
  .comments-section {
    background: #1a1422;
    border: 1px solid #2a2235;
    border-top: none;
    border-radius: 0 0 12px 12px;
    padding: 10px 16px;
  }
  .comments-title {
    font-size: 13px;
    font-weight: 700;
    color: #71677b;
    margin-bottom: 5px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .comments-count {
    color: var(--col-indigo);
  }
  .comment {
    padding: 8px 0;
    border-bottom: 1px solid #1e1828;
  }
  .comment:last-child { border-bottom: none; }
  .comment-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    margin-bottom: 6px;
  }
  .comment-author {
    color: var(--col-pink);
    font-weight: 700;
  }
  .comment-time { color: #71677b; }
  .comment-op {
    font-size: 9px;
    background: rgba(136,137,205,0.2);
    color: var(--col-indigo);
    padding: 1px 5px;
    border-radius: 3px;
    font-weight: 700;
  }
  .comment-body {
    font-size: 12px;
    line-height: 1.3;
    color: #b8b0c4;
  }
  .comment-actions {
    margin-top: 4px;
    display: flex;
    gap: 8px;
    font-size: 11px;
    color: #71677b;
  }
  .comment-like { cursor: pointer; }
  .comment-like:hover { color: var(--col-rose); }

  /* Reply */
  .reply {
    margin-left: 20px;
    padding-left: 12px;
    border-left: 2px solid #2a2235;
  }
</style>
</head>
<body>
<div class="post-page">
  <div class="post-header">
    <span class="post-back">←</span>
    <span class="post-board-name" id="board-name">게시판</span>
  </div>
  <div class="post-content">
    <div id="post-tag"></div>
    <div class="post-title" id="post-title">제목</div>
    <div class="post-meta">
      <span class="post-author" id="post-author">작성자</span>
      <span id="post-time">시간</span>
      <span>조회 <span id="post-views">0</span></span>
    </div>
    <div class="post-body" id="post-body">본문</div>
  </div>
  <div class="post-actions">
    <div class="vote-box">
      <span class="vote-btn">▲</span>
      <span class="vote-count" id="post-votes">0</span>
      <span class="vote-btn">▼</span>
    </div>
    <div class="action-item">💬 댓글 <span id="comment-count">0</span></div>
    <div class="action-item">↗ 공유</div>
    <div class="action-item">🔖 저장</div>
  </div>
  <div class="comments-section">
    <div class="comments-title">댓글 <span class="comments-count" id="comment-count2">0</span></div>
    <div id="comments-container"></div>
  </div>
</div>

<script>
// ?p=게시판명,태그,제목,작성자,시간,조회,추천,본문
// &c=닉,시간,내용,[op]|닉,시간,내용|>닉,시간,내용 (>는 대댓글)
function parseParams() {
  const params = new URLSearchParams(window.location.search);
  const p = params.get('p');
  const c = params.get('c');
  if (!p) return;

  const parts = p.split('§');
  const board = parts[0] || '게시판';
  const tag = parts[1] || '';
  const title = parts[2] || '';
  const author = parts[3] || '';
  const time = parts[4] || '';
  const views = parts[5] || '0';
  const votes = parts[6] || '0';
  const body = parts.slice(7).join('§') || '';

  document.getElementById('board-name').textContent = board;
  document.getElementById('post-title').textContent = title;
  document.getElementById('post-author').textContent = author;
  document.getElementById('post-time').textContent = time;
  document.getElementById('post-views').textContent = Number(views).toLocaleString();
  document.getElementById('post-votes').textContent = Number(votes).toLocaleString();
  document.getElementById('post-body').textContent = body;

  if (tag) {
    const tagMap = {notice:['공지','tag-notice'],hot:['HOT','tag-hot'],new:['NEW','tag-new'],normal:['','tag-normal']};
    const [tagText, tagClass] = tagMap[tag] || [tag, 'tag-normal'];
    if (tagText) document.getElementById('post-tag').innerHTML = '<span class="post-tag '+tagClass+'">'+tagText+'</span>';
  }

  if (c) {
    const container = document.getElementById('comments-container');
    const commentList = c.split('|');
    let count = 0;
    commentList.forEach(raw => {
      const isReply = raw.startsWith('>');
      const clean = isReply ? raw.substring(1) : raw;
      const seg = clean.split('§');
      const cNick = seg[0] || '';
      const cTime = seg[1] || '';
      const cBody = seg[2] || '';
      const isOp = seg[3] === 'op';

      const div = document.createElement('div');
      div.className = 'comment' + (isReply ? ' reply' : '');
      div.innerHTML =
        '<div class="comment-meta">' +
          '<span class="comment-author">' + cNick + '</span>' +
          (isOp ? '<span class="comment-op">글쓴이</span>' : '') +
          '<span class="comment-time">' + cTime + '</span>' +
        '</div>' +
        '<div class="comment-body">' + cBody + '</div>' +
        '<div class="comment-actions"><span class="comment-like">♡ 좋아요</span><span>답글</span></div>';
      container.appendChild(div);
      count++;
    });
    document.getElementById('comment-count').textContent = count;
    document.getElementById('comment-count2').textContent = count;
  }
}
parseParams();
</script>
</body>
</html>
`,
  'letter': `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Letter</title>
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
    font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, serif;
    display: flex;
    justify-content: center;
    padding: 20px 8px;
    min-height: 100vh;
  }

  .letter-wrap {
    width: 100%;
    max-width: 480px;
  }

  /* ── 봉투 상단 (접힌 플랩) ── */
  .envelope-flap {
    width: 100%;
    height: 44px;
    background: linear-gradient(135deg, #d4c4b8, #c9b8a8);
    clip-path: polygon(0 0, 50% 100%, 100% 0);
    position: relative;
    z-index: 2;
  }
  .envelope-flap::after {
    content: '';
    position: absolute;
    bottom: 4px;
    left: 50%;
    transform: translateX(-50%);
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--col-rose);
    opacity: 0.6;
  }

  /* ── 편지지 본체 ── */
  .letter {
    background: #fffbf5;
    border-left: 1px solid #e0d4c8;
    border-right: 1px solid #e0d4c8;
    border-bottom: 1px solid #e0d4c8;
    position: relative;
    overflow: hidden;
    margin-top: -2px;
  }

  /* 줄무늬 배경 */
  .letter::before {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      transparent,
      transparent 27px,
      rgba(136,137,205,0.08) 27px,
      rgba(136,137,205,0.08) 28px
    );
    pointer-events: none;
  }

  /* 왼쪽 빨간 줄 (편지지 느낌) */
  .letter::after {
    content: '';
    position: absolute;
    top: 0;
    left: 38px;
    bottom: 0;
    width: 1.5px;
    background: rgba(187,102,136,0.2);
    pointer-events: none;
  }

  /* ── 날짜 영역 ── */
  .letter-date {
    padding: 18px 24px 4px 52px;
    font-size: 12px;
    color: var(--col-sand);
    text-align: left;
    position: relative;
    z-index: 1;
    letter-spacing: 0.5px;
    font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, serif;
  }

  /* ── 수신자 ── */
  .letter-to {
    padding: 10px 24px 14px 52px;
    font-size: 16px;
    color: #4a3a2e;
    position: relative;
    z-index: 1;
    line-height: 1.6;
    font-weight: 600;
    font-family: cursive, 'Segoe Script', 'Comic Sans MS', serif;
  }

  .letter-to .dear-label {
    font-size: 12px;
    color: var(--col-rose);
    font-weight: 400;
    display: block;
    margin-bottom: 2px;
    letter-spacing: 1px;
  }

  /* ── 본문 ── */
  .letter-body {
    padding: 8px 24px 16px 52px;
    font-size: 14px;
    line-height: 1.6;
    color: #3a2e24;
    position: relative;
    z-index: 1;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: cursive, 'Segoe Script', 'Comic Sans MS', serif;
  }

  /* ── 서명 영역 ── */
  .letter-sign {
    padding: 14px 24px 8px 52px;
    text-align: right;
    position: relative;
    z-index: 1;
  }

  .letter-closing {
    font-size: 13px;
    color: var(--col-sand);
    margin-bottom: 6px;
    font-style: italic;
    font-family: cursive, 'Segoe Script', 'Comic Sans MS', serif;
  }

  .letter-from {
    font-size: 18px;
    font-weight: 700;
    color: #4a3a2e;
    display: inline-block;
    position: relative;
    font-family: cursive, 'Segoe Script', 'Comic Sans MS', serif;
  }

  .letter-from::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--col-pink), transparent);
  }

  /* ── PS ── */
  .letter-ps {
    padding: 10px 24px 18px 52px;
    font-size: 12px;
    color: var(--col-rose);
    font-style: italic;
    position: relative;
    z-index: 1;
    line-height: 1.5;
    font-family: cursive, 'Segoe Script', 'Comic Sans MS', serif;
  }

  .letter-ps::before {
    content: 'P.S.';
    font-weight: 700;
    margin-right: 4px;
  }

  /* ── 봉투 하단 ── */
  .envelope-bottom {
    width: 100%;
    height: 28px;
    background: linear-gradient(180deg, #d4c4b8, #c0ae9e);
    border-radius: 0 0 4px 4px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .envelope-bottom::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(187,102,136,0.3), transparent);
  }

  .envelope-stamp {
    font-size: 8px;
    color: rgba(74,58,46,0.4);
    letter-spacing: 2px;
    font-family: -apple-system, sans-serif;
  }

  /* ── 장식: 우표 ── */
  .stamp {
    position: absolute;
    top: 10px;
    right: 14px;
    width: 44px;
    height: 52px;
    background: #fff;
    border: 2px dashed rgba(136,137,205,0.3);
    border-radius: 2px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    z-index: 3;
    opacity: 0.7;
  }

  .stamp-icon {
    font-size: 18px;
    opacity: 0.6;
  }

  .stamp-text {
    font-size: 7px;
    color: var(--col-indigo);
    font-family: -apple-system, sans-serif;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-align: center;
  }

  /* ── 장식: 꽃/하트 워터마크 ── */
  .watermark {
    position: absolute;
    bottom: 40px;
    right: 20px;
    font-size: 64px;
    opacity: 0.04;
    z-index: 0;
    pointer-events: none;
    transform: rotate(-15deg);
  }
</style>
</head>
<body>
<div class="letter-wrap">
  <div class="envelope-flap"></div>
  <div class="letter">
    <div class="stamp">
      <div class="stamp-icon">✉</div>
      <div class="stamp-text" id="stamp-label">LETTER</div>
    </div>
    <div class="watermark" id="watermark">♥</div>
    <div class="letter-date" id="letter-date">2026. 01. 01.</div>
    <div class="letter-to" id="letter-to">
      <span class="dear-label">To.</span>
      받는 사람
    </div>
    <div class="letter-body" id="letter-body">편지 내용</div>
    <div class="letter-sign">
      <div class="letter-closing" id="letter-closing">마음을 담아</div>
      <div class="letter-from" id="letter-from">보내는 사람</div>
    </div>
    <div class="letter-ps" id="letter-ps" style="display:none;"></div>
  </div>
  <div class="envelope-bottom">
    <span class="envelope-stamp">MAIL</span>
  </div>
</div>

<script>
// ?p=보내는사람§받는사람§날짜§맺음말§우표라벨
// &b=본문내용
// &ps=추신내용
// &w=워터마크이모지
function parseParams() {
  const params = new URLSearchParams(window.location.search);
  const p = params.get('p');
  const b = params.get('b');
  const ps = params.get('ps');
  const w = params.get('w');

  if (p) {
    const pp = p.split('§');
    const from = pp[0] || '';
    const to = pp[1] || '';
    const date = pp[2] || '';
    const closing = pp[3] || '마음을 담아';
    const stampLabel = pp[4] || 'LETTER';

    if (to) {
      document.getElementById('letter-to').innerHTML =
        '<span class="dear-label">To.</span>' + to;
    }
    if (from) document.getElementById('letter-from').textContent = from;
    if (date) document.getElementById('letter-date').textContent = date;
    if (closing) document.getElementById('letter-closing').textContent = closing;
    if (stampLabel) document.getElementById('stamp-label').textContent = stampLabel;
  }

  if (b) {
    document.getElementById('letter-body').textContent = b;
  }

  if (ps) {
    const psEl = document.getElementById('letter-ps');
    psEl.style.display = 'block';
    psEl.textContent = '';
    psEl.insertAdjacentText('beforeend', ps);
  }

  if (w) {
    document.getElementById('watermark').textContent = w;
  }
}
parseParams();
</script>
</body>
</html>
`,
  'menu': `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Menu</title>
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
    font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, serif;
    display: flex;
    justify-content: center;
    padding: 20px 8px;
    min-height: 100vh;
  }

  .menu {
    width: 100%;
    max-width: 480px;
    background: #1a1520;
    border-radius: 6px;
    overflow: hidden;
    position: relative;
  }

  /* 질감 오버레이 */
  .menu::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 0;
  }

  /* ── 메뉴판 헤더 ── */
  .menu-header {
    padding: 28px 24px 20px;
    text-align: center;
    position: relative;
    z-index: 1;
    border-bottom: 1px solid rgba(221,170,204,0.15);
  }

  .menu-header::before,
  .menu-header::after {
    content: '✦';
    position: absolute;
    top: 24px;
    font-size: 10px;
    color: var(--col-sand);
    opacity: 0.5;
  }
  .menu-header::before { left: 20px; }
  .menu-header::after { right: 20px; }

  .menu-name {
    font-size: 24px;
    font-weight: 700;
    color: var(--col-pink);
    letter-spacing: 5px;
    margin-bottom: 4px;
    font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, serif;
  }

  .menu-sub {
    font-size: 11px;
    color: var(--col-sand);
    opacity: 0.7;
    letter-spacing: 4px;
    font-family: 'Courier New', Courier, monospace;
    text-transform: uppercase;
  }

  /* 장식 라인 */
  .menu-divider {
    width: 60px;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--col-rose), transparent);
    margin: 12px auto 0;
  }

  /* ── 카테고리 섹션 ── */
  .menu-section {
    padding: 18px 22px 10px;
    position: relative;
    z-index: 1;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(136,137,205,0.1);
  }

  .section-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(136,137,205,0.25), transparent);
  }

  .section-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--col-indigo);
    letter-spacing: 3px;
    white-space: nowrap;
    text-transform: uppercase;
    background: rgba(136,137,205,0.08);
    padding: 4px 12px;
    border-radius: 3px;
    border: 1px solid rgba(136,137,205,0.12);
  }

  .section-icon {
    font-size: 14px;
    opacity: 0.7;
  }

  /* ── 메뉴 아이템 ── */
  .menu-item {
    display: flex;
    align-items: flex-start;
    padding: 8px 0;
    gap: 8px;
  }

  .menu-item + .menu-item {
    border-top: 1px dashed rgba(221,170,204,0.12);
  }

  .item-info {
    flex: 1;
    min-width: 0;
  }

  .item-name-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .item-name {
    font-size: 14px;
    font-weight: 600;
    color: #f0eaf0;
    line-height: 1.3;
    font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, serif;
  }

  .item-badge {
    font-size: 8px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 3px;
    letter-spacing: 0.5px;
    flex-shrink: 0;
    font-family: -apple-system, sans-serif;
  }

  .badge-best {
    background: rgba(187,102,136,0.2);
    color: var(--col-rose);
    border: 1px solid rgba(187,102,136,0.35);
  }

  .badge-new {
    background: rgba(136,137,205,0.2);
    color: var(--col-indigo);
    border: 1px solid rgba(136,137,205,0.35);
  }

  .badge-hot {
    background: rgba(204,170,136,0.2);
    color: var(--col-sand);
    border: 1px solid rgba(204,170,136,0.35);
  }

  .item-desc {
    font-size: 11px;
    color: rgba(221,170,204,0.5);
    margin-top: 3px;
    line-height: 1.4;
    font-style: italic;
  }

  .item-price {
    font-size: 13px;
    font-weight: 700;
    color: var(--col-sand);
    white-space: nowrap;
    flex-shrink: 0;
    align-self: center;
    background: rgba(204,170,136,0.1);
    padding: 3px 10px;
    border-radius: 12px;
    border: 1px solid rgba(204,170,136,0.15);
  }

  .item-dots {
    flex: 0 0 auto;
    align-self: center;
    border-bottom: 1px dotted rgba(204,170,136,0.2);
    min-width: 20px;
    flex-grow: 1;
    height: 0;
    margin: 0 4px;
  }

  /* ── 푸터 ── */
  .menu-footer {
    padding: 14px 22px 18px;
    text-align: center;
    position: relative;
    z-index: 1;
    border-top: 1px solid rgba(221,170,204,0.1);
  }

  .menu-footer-text {
    font-size: 10px;
    color: rgba(204,170,136,0.4);
    letter-spacing: 1px;
    line-height: 1.6;
    font-family: -apple-system, sans-serif;
  }

  .menu-footer-line {
    width: 40px;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--col-rose), transparent);
    margin: 8px auto;
    opacity: 0.4;
  }

  .menu-hours {
    font-size: 10px;
    color: rgba(136,137,205,0.5);
    margin-top: 4px;
    font-family: -apple-system, sans-serif;
  }
</style>
</head>
<body>
<div class="menu">

  <!-- 헤더 -->
  <div class="menu-header">
    <div class="menu-name" id="menu-name">가게 이름</div>
    <div class="menu-sub" id="menu-sub">MENU</div>
    <div class="menu-divider"></div>
  </div>

  <!-- 메뉴 섹션들 -->
  <div id="menu-sections"></div>

  <!-- 푸터 -->
  <div class="menu-footer">
    <div class="menu-footer-line"></div>
    <div class="menu-footer-text" id="menu-notice"></div>
    <div class="menu-hours" id="menu-hours"></div>
  </div>

</div>

<script>
// ?p=가게이름§부제(MENU등)§공지문구§영업시간
// &s=카테고리명§아이콘|메뉴명§설명§가격§뱃지|메뉴명~설명~가격;;카테고리명2~아이콘|...
//   뱃지: best / new / hot (선택)
//   카테고리 구분: ;;  /  아이템 구분: |  /  필드 구분: §
function parseParams() {
  const params = new URLSearchParams(window.location.search);
  const p = params.get('p');
  const s = params.get('s');

  if (p) {
    const pp = p.split('§');
    if (pp[0]) document.getElementById('menu-name').textContent = pp[0];
    if (pp[1]) document.getElementById('menu-sub').textContent = pp[1];
    if (pp[2]) document.getElementById('menu-notice').textContent = pp[2];
    if (pp[3]) document.getElementById('menu-hours').textContent = pp[3];
  }

  if (s) {
    const container = document.getElementById('menu-sections');
    container.innerHTML = '';

    // 카테고리별 분리
    const categories = s.split(';;');

    categories.forEach(cat => {
      const items = cat.split('|');
      if (items.length === 0) return;

      // 첫 번째는 카테고리 헤더
      const catParts = items[0].split('§');
      const catName = catParts[0] || '';
      const catIcon = catParts[1] || '';

      const section = document.createElement('div');
      section.className = 'menu-section';

      // 섹션 헤더
      let headerHtml = '<div class="section-header">';
      headerHtml += '<div class="section-line"></div>';
      if (catIcon) headerHtml += '<span class="section-icon">' + catIcon + '</span>';
      headerHtml += '<span class="section-title">' + catName + '</span>';
      if (catIcon) headerHtml += '<span class="section-icon">' + catIcon + '</span>';
      headerHtml += '<div class="section-line"></div>';
      headerHtml += '</div>';

      let itemsHtml = '';
      // 나머지는 메뉴 아이템
      items.slice(1).forEach(raw => {
        const seg = raw.split('§');
        const name = seg[0] || '';
        const desc = seg[1] || '';
        const price = seg[2] || '';
        const badge = seg[3] || '';

        let badgeHtml = '';
        if (badge === 'best') badgeHtml = '<span class="item-badge badge-best">BEST</span>';
        else if (badge === 'new') badgeHtml = '<span class="item-badge badge-new">NEW</span>';
        else if (badge === 'hot') badgeHtml = '<span class="item-badge badge-hot">HOT</span>';

        itemsHtml += '<div class="menu-item">';
        itemsHtml += '<div class="item-info">';
        itemsHtml += '<div class="item-name-row"><span class="item-name">' + name + '</span>' + badgeHtml + '</div>';
        if (desc) itemsHtml += '<div class="item-desc">' + desc + '</div>';
        itemsHtml += '</div>';
        if (price) {
          itemsHtml += '<div class="item-dots"></div>';
          itemsHtml += '<div class="item-price">' + price + '</div>';
        }
        itemsHtml += '</div>';
      });

      section.innerHTML = headerHtml + itemsHtml;
      container.appendChild(section);
    });
  }
}
parseParams();
</script>
</body>
</html>
`,
  'dm': `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Instagram DM</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --col-indigo: #8889CD;
    --col-pink:   #DDAACC;
    --col-sand:   #CCAA88;
    --col-rose:   #BB6688;
  }

  body {
    background: #fff;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    min-height: 900px;
  }

  .chat-wrap {
    width: 100%;
    max-width: 420px;
    min-height: 900px;
    background: #fff;
    display: flex;
    flex-direction: column;
  }

  /* Header */
  .chat-header {
    background: #fff;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    border-bottom: 1px solid #efefef;
  }

  .back-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: #262626;
    font-size: 22px;
    line-height: 1;
    padding: 4px;
  }

  .header-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #ccc;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    color: #fff;
  }

  .header-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .header-username {
    font-size: 14px;
    font-weight: 600;
    color: #262626;
    line-height: 1.2;
  }

  .header-status {
    font-size: 12px;
    color: #8e8e8e;
    line-height: 1.2;
  }

  .header-actions {
    display: flex;
    gap: 14px;
    color: #262626;
  }

  .header-actions svg {
    width: 24px; height: 24px;
    fill: none; stroke: #262626;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
    cursor: pointer;
  }

  /* Messages */
  .messages {
    flex: 1;
    padding: 14px 14px 70px;
    display: flex;
    flex-direction: column;
    gap: 2px;
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
    background: #efefef;
    color: #262626;
    border-radius: 18px;
  }

  /* 내 메시지 */
  .msg-row.me {
    flex-direction: row-reverse;
  }

  .msg-row.me .bubble {
    background: var(--col-indigo);
    color: #fff;
    border-radius: 18px;
  }

  .msg-row.me .meta {
    align-items: flex-end;
  }

  /* 아바타 — DM에서는 1:1이므로 숨김 처리 */
  .msg-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #ccc;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
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
    color: #8e8e8e;
    margin-bottom: 1px;
    padding-left: 4px;
    display: none;
  }

  .bubble {
    padding: 8px 14px;
    font-size: 14px;
    line-height: 1.4;
    word-break: break-word;
    max-width: 100%;
    display: inline-block;
  }

  .meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-bottom: 2px;
    min-width: 32px;
  }

  .msg-time {
    font-size: 11px;
    color: #8e8e8e;
    white-space: nowrap;
  }

  /* 발신자 변경 시 간격 */
  .msg-row:not(.cont) { margin-top: 10px; }
  .msg-row:not(.cont):first-child { margin-top: 0; }

  /* 연속 메시지 */
  .msg-row.cont { margin-top: 3px; }
  .msg-row.cont .msg-avatar { opacity: 0; }

  /* 읽음 표시 */
  .seen-label {
    text-align: right;
    font-size: 11px;
    color: #8e8e8e;
    padding: 2px 4px 0;
  }

  /* Input bar */
  .input-bar {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 420px;
    background: #fff;
    border-top: 1px solid #efefef;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .input-btn {
    background: none; border: none;
    cursor: pointer; color: #262626;
    padding: 4px;
    display: flex; align-items: center; justify-content: center;
  }

  .input-btn svg {
    width: 24px; height: 24px;
    fill: none; stroke: #262626;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .input-field {
    flex: 1;
    background: transparent;
    border: 1px solid #dbdbdb;
    border-radius: 22px;
    padding: 8px 14px;
    font-size: 14px;
    color: #262626;
    font-family: inherit;
    outline: none;
  }

  .input-right {
    display: flex;
    gap: 10px;
  }
</style>
</head>
<body>
<div class="chat-wrap">
  <div class="chat-header">
    <button class="back-btn">‹</button>
    <div class="header-avatar" id="header-avatar">U</div>
    <div class="header-info">
      <div class="header-username" id="header-username">username</div>
      <div class="header-status" id="header-status"></div>
    </div>
    <div class="header-actions">
      <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.86 19.86 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.86 19.86 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.13.81.37 1.61.7 2.36a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.75.33 1.55.57 2.36.7a2 2 0 011.72 2.01z"/></svg>
      <svg viewBox="0 0 24 24"><path d="M15.1 1.81a2 2 0 012.28-.47l4.5 2A2 2 0 0123 5.18v13.64a2 2 0 01-1.12 1.8l-4.5 2a2 2 0 01-2.28-.47L12 18.5V5.5l3.1-3.69z"/><rect x="1" y="5" width="11" height="14" rx="2"/></svg>
    </div>
  </div>

  <div class="messages" id="messages">
  </div>

  <div class="input-bar">
    <button class="input-btn">
      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
    </button>
    <input class="input-field" placeholder="메시지 보내기..." readonly="readonly"/>
    <div class="input-right">
      <button class="input-btn">
        <svg viewBox="0 0 24 24"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>
      </button>
      <button class="input-btn">
        <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
      </button>
    </div>
  </div>
</div>
</body>
</html>
`,
  'tl': `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Twitter Timeline</title>
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
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
    display: flex; justify-content: center; align-items: flex-start;
    min-height: 100vh; padding: 20px 0;
  }
  .tl-wrap {
    width: 100%; max-width: 598px; color: #e7e9ea;
    background: #0d0d14; border: 1px solid #2a2535; border-radius: 16px; overflow: hidden;
  }
  .tl-header { display: flex; align-items: center; gap: 24px; padding: 10px 16px; }
  .tl-back { font-size: 20px; color: #e7e9ea; }
  .tl-title { display: flex; flex-direction: column; }
  .tl-name { font-size: 18px; font-weight: 800; }
  .tl-count { font-size: 13px; color: #71767b; }
  .tl-tabs { display: flex; border-bottom: 1px solid #2f3336; }
  .tl-tab { flex: 1; text-align: center; padding: 12px 0 10px; font-size: 14px; color: #71767b; font-weight: 500; position: relative; }
  .tl-tab.active { color: #e7e9ea; font-weight: 700; }
  .tl-tab.active::after {
    content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
    width: 52px; height: 4px; border-radius: 999px; background: #1d9bf0;
  }
  .tl-item-outer { border-bottom: 1px solid #1a1724; padding: 12px 16px 4px; }
  .tl-item-outer:last-child { border-bottom: none; }
  .tl-item-outer.threaded { border-bottom: none; padding-bottom: 0; }
  .tl-repost {
    display: flex; align-items: center; gap: 8px;
    font-size: 13px; font-weight: 700; color: #71767b;
    padding-left: 30px; margin-bottom: 4px;
  }
  .tl-repost svg { width: 15px; height: 15px; fill: none; stroke: #71767b; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
  .tl-item { display: flex; gap: 10px; }
  .tl-avatar-col { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
  .tl-avatar {
    width: 40px; height: 40px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; font-weight: 700; color: #fff;
  }
  .tl-thread-line { width: 2px; flex: 1; min-height: 8px; background: #2f3336; margin-top: 4px; }
  .tl-content { flex: 1; min-width: 0; }
  .tl-item-header { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
  .tl-item-name { font-size: 15px; font-weight: 700; }
  .tl-item-header .verified { width: 16px; height: 16px; fill: var(--col-indigo); flex-shrink: 0; }
  .tl-item-header .lock-icon { width: 13px; height: 13px; fill: #e7e9ea; flex-shrink: 0; opacity: 0.9; }
  .tl-item-handle { font-size: 14px; color: #71767b; }
  .tl-item-more { margin-left: auto; color: #71767b; font-size: 16px; }
  .tl-replying { font-size: 14px; color: #71767b; margin-top: 1px; }
  .tl-replying .mention { color: #1d9bf0; }
  .tl-body { font-size: 15px; line-height: 1.4; margin: 2px 0 8px; white-space: pre-wrap; word-break: break-word; }
  .tl-img-grid { display: flex; gap: 3px; margin-bottom: 8px; border-radius: 14px; overflow: hidden; }
  .tl-img {
    flex: 1; aspect-ratio: 1/1; background: #18141e; border: 1px solid #2a2535;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
  }
  .tl-img-grid.single .tl-img { aspect-ratio: 16/9; }
  .tl-img svg { width: 32px; height: 32px; fill: var(--col-indigo); opacity: 0.4; }
  .tl-img .img-desc { font-size: 12px; color: var(--col-pink); opacity: 0.5; text-align: center; padding: 0 14px; }
  .tl-quote { border: 1px solid #2f3336; border-radius: 14px; padding: 10px 12px; margin-bottom: 8px; }
  .tl-quote-header { display: flex; align-items: center; gap: 5px; margin-bottom: 3px; flex-wrap: wrap; }
  .tl-quote-avatar {
    width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 9px; font-weight: 700; color: #fff;
  }
  .tl-quote-name { font-size: 13px; font-weight: 700; }
  .tl-quote-handle { font-size: 13px; color: #71767b; }
  .tl-quote-body { font-size: 14px; line-height: 1.4; color: #e7e9ea; word-break: break-word; white-space: pre-wrap; }
  .tl-actions { display: flex; justify-content: space-between; max-width: 425px; padding: 2px 0; }
  .tl-actions .action {
    display: flex; align-items: center; gap: 5px;
    color: #71767b; font-size: 12px; padding: 5px 6px; border-radius: 999px;
  }
  .tl-actions .action svg {
    width: 17px; height: 17px; fill: none; stroke: #71767b;
    stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round;
  }
</style>
</head>
<body>
<div class="tl-wrap">
  <div class="tl-header" id="tl-header" style="display:none">
    <div class="tl-back">←</div>
    <div class="tl-title">
      <span class="tl-name" id="tl-name"></span>
      <span class="tl-count" id="tl-count"></span>
    </div>
  </div>
  <div class="tl-tabs" id="tl-tabs" style="display:none"></div>
  <div id="tl-feed"></div>
</div>
</body>
</html>`,
  'shorts': `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>Shorts</title>
<style>
  :root {
    --col-indigo: #8889CD;
    --col-pink:   #DDAACC;
    --col-sand:   #CCAA88;
    --col-rose:   #BB6688;
    --tt-red: #FE2C55;
  }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#000; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif; color:#fff; }
  .sh-app {
    width:390px; height:693px;
    position:relative; overflow:hidden;
    background:linear-gradient(160deg, #2a2440 0%, #16121f 55%, #241a2e 100%);
    color:#fff;
    font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
  }
  .sh-bgimg {
    position:absolute; inset:0;
    background-size:cover; background-position:center;
  }
  .sh-deco {
    position:absolute; inset:0;
    display:flex; align-items:center; justify-content:center;
    font-size:96px; opacity:.25;
  }
  .sh-shade-top { position:absolute; top:0; left:0; right:0; height:100px; background:linear-gradient(rgba(0,0,0,.45), transparent); }
  .sh-shade-bot { position:absolute; bottom:0; left:0; right:0; height:200px; background:linear-gradient(transparent, rgba(0,0,0,.65)); }

  .tt-top {
    position:absolute; top:16px; left:0; right:0;
    display:flex; justify-content:center; gap:20px;
    font-size:16px; color:rgba(255,255,255,.6); font-weight:600;
    text-shadow:0 1px 3px rgba(0,0,0,.5);
  }
  .tt-top .on { color:#fff; position:relative; }
  .tt-top .on::after { content:''; position:absolute; left:20%; right:20%; bottom:-7px; height:3px; background:#fff; border-radius:2px; }
  .tt-search { position:absolute; top:15px; right:16px; }

  .sh-actions {
    position:absolute; right:11px; bottom:126px;
    display:flex; flex-direction:column; align-items:center; gap:19px;
    z-index:3;
  }
  .sh-act { display:flex; flex-direction:column; align-items:center; gap:3px; }
  .sh-act .num { font-size:12px; font-weight:600; text-shadow:0 1px 2px rgba(0,0,0,.6); }
  .sh-avwrap { position:relative; margin-bottom:5px; }
  .sh-avatar {
    width:47px; height:47px; border-radius:50%;
    border:1.5px solid #fff;
    background:linear-gradient(135deg, var(--col-indigo), var(--col-rose));
    display:flex; align-items:center; justify-content:center;
    font-size:21px; font-weight:700;
  }
  .sh-plus {
    position:absolute; left:50%; bottom:-8px; transform:translateX(-50%);
    width:19px; height:19px; border-radius:50%;
    background:var(--tt-red); color:#fff;
    font-size:14px; line-height:18px; text-align:center; font-weight:700;
  }
  .sh-disc { margin-top:6px; }

  .sh-caption {
    position:absolute; left:14px; right:76px; bottom:72px; z-index:3;
    text-shadow:0 1px 3px rgba(0,0,0,.6);
  }
  .sh-caption .uid { font-size:16px; font-weight:700; margin-bottom:6px; }
  .sh-caption .txt { font-size:14px; line-height:1.45; }
  .sh-caption .tag { font-weight:700; }
  .sh-music { display:flex; align-items:center; gap:6px; margin-top:8px; }

  .tt-nav {
    position:absolute; bottom:0; left:0; right:0; height:52px;
    background:#000;
    display:flex; align-items:center; justify-content:space-around;
    font-size:9.5px; color:rgba(255,255,255,.7); z-index:4;
  }
  .tt-nav .ni { display:flex; flex-direction:column; align-items:center; gap:2px; font-size:15px; }
  .tt-nav .ni div { font-size:9.5px; }
  .tt-nav .on { color:#fff; font-weight:700; }
  .tt-plusbtn {
    width:41px; height:28px; border-radius:8px; background:#fff;
    position:relative; display:flex; align-items:center; justify-content:center;
    color:#000; font-size:18px; font-weight:700;
  }
  .tt-plusbtn::before, .tt-plusbtn::after { content:''; position:absolute; top:0; bottom:0; width:41px; border-radius:8px; z-index:-1; }
  .tt-plusbtn::before { left:-4px; background:#25F4EE; }
  .tt-plusbtn::after  { right:-4px; background:var(--tt-red); }

  .rl-top {
    position:absolute; top:16px; left:16px; right:16px;
    display:flex; justify-content:space-between; align-items:center;
    font-size:20px; font-weight:700; text-shadow:0 1px 3px rgba(0,0,0,.5); z-index:3;
  }
  .rl-userline { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
  .rl-ava {
    width:32px; height:32px; border-radius:50%;
    background:linear-gradient(135deg, var(--col-pink), var(--col-sand));
    display:flex; align-items:center; justify-content:center; font-size:15px; font-weight:700;
    border:1px solid rgba(255,255,255,.7);
  }
  .rl-follow { font-size:12.5px; font-weight:600; border:1px solid rgba(255,255,255,.85); border-radius:7px; padding:4px 11px; }
  .rl-audio {
    width:36px; height:36px; border-radius:7px;
    border:1.5px solid #fff;
    background:linear-gradient(135deg, var(--col-indigo), #241a2e);
    display:flex; align-items:center; justify-content:center;
  }
  .rl-nav {
    position:absolute; bottom:0; left:0; right:0; height:50px;
    background:#000; display:flex; align-items:center; justify-content:space-around; z-index:4;
  }
  .rl-profile { width:23px; height:23px; border-radius:50%; border:1.7px solid #fff; background:linear-gradient(135deg, var(--col-pink), var(--col-indigo)); }

  .sh-sheet {
    position:absolute; left:0; right:0; bottom:0; height:54%;
    background:#fff; color:#161823;
    border-radius:14px 14px 0 0; z-index:5;
    display:none; flex-direction:column;
  }
  .sh-app.cmt-open .sh-sheet { display:flex; }
  .sh-app.cmt-open .sh-actions,
  .sh-app.cmt-open .tt-nav,
  .sh-app.cmt-open .rl-nav,
  .sh-app.cmt-open .sh-shade-bot { display:none; }
  .sh-app.cmt-open .sh-caption { bottom:auto; top:190px; right:14px; }
  .sh-app.cmt-open .sh-music { display:none; }
  .sheet-head { text-align:center; font-size:13.5px; font-weight:600; padding:13px 0 10px; border-bottom:1px solid #f0f0f0; position:relative; }
  .sheet-head .x { position:absolute; right:15px; top:11px; color:#999; font-size:15px; }
  .sh-cmts { flex:1; overflow:hidden; padding:4px 0; }
  .sh-cmt { display:flex; gap:10px; padding:10px 15px; }
  .sh-cava {
    width:34px; height:34px; border-radius:50%; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    font-size:15px; font-weight:700; color:#fff;
  }
  .sh-cbody { flex:1; min-width:0; }
  .sh-cnick { font-size:12.5px; font-weight:600; color:#8a8b91; }
  .sh-ctxt { font-size:14px; line-height:1.4; margin:2px 0 3px; }
  .sh-cmeta { font-size:11.5px; color:#8a8b91; display:flex; gap:12px; }
  .sh-clike { display:flex; flex-direction:column; align-items:center; gap:1px; color:#8a8b91; font-size:11px; padding-top:3px; }
  .sh-cinput { display:flex; align-items:center; gap:9px; padding:10px 15px; border-top:1px solid #f0f0f0; }
  .sh-cinput .field { flex:1; background:#f1f1f2; border-radius:18px; padding:9px 14px; font-size:13.5px; color:#999; }
</style>
</head>
<body>
<div class="sh-app" id="sh-app">
  <div class="sh-bgimg" id="sh-bgimg" style="display:none"></div>
  <div class="sh-deco" id="sh-deco" style="display:none">⟦EMO⟧</div>
  <div class="sh-shade-top"></div>
  <div class="sh-shade-bot"></div>

  <div id="skin-tt">
    <div class="tt-top"><div>라이브</div><div>팔로잉</div><div class="on">추천</div></div>
    <div class="tt-search">
      <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>
    </div>

    <div class="sh-actions">
      <div class="sh-avwrap">
        <div class="sh-avatar">⟦AVA⟧</div>
        <div class="sh-plus">+</div>
      </div>
      <div class="sh-act">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="30" viewBox="0 0 24 24" fill="#fff">
          <path d="M12 21s-7.5-4.9-9.7-9.1C.7 8.7 2.6 5 6.2 5c2.1 0 3.5 1.1 4.3 2.4l1.5 2.3 1.5-2.3C14.3 6.1 15.7 5 17.8 5c3.6 0 5.5 3.7 3.9 6.9C19.5 16.1 12 21 12 21z">
            <animateTransform attributeName="transform" type="scale" values="1;1.12;1" dur="1.6s" repeatCount="indefinite" additive="sum" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1"/>
          </path>
        </svg>
        <div class="num">⟦LIKES⟧</div>
      </div>
      <div class="sh-act">
        <svg xmlns="http://www.w3.org/2000/svg" width="29" height="29" viewBox="0 0 24 24" fill="#fff"><path d="M12 3C6.5 3 2 6.9 2 11.7c0 2.6 1.3 4.9 3.4 6.5-.2 1-.7 2.3-1.6 3.3 1.9-.2 3.6-.9 4.8-1.6 1.1.3 2.2.5 3.4.5 5.5 0 10-3.9 10-8.7S17.5 3 12 3z"/></svg>
        <div class="num">⟦CMTN⟧</div>
      </div>
      <div class="sh-act">
        <svg xmlns="http://www.w3.org/2000/svg" width="27" height="27" viewBox="0 0 24 24" fill="#fff"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1z"/></svg>
        <div class="num">⟦BOOKN⟧</div>
      </div>
      <div class="sh-act">
        <svg xmlns="http://www.w3.org/2000/svg" width="29" height="29" viewBox="0 0 24 24" fill="#fff"><path d="M13 4l8 7-8 7v-4.4C7.8 13.6 4.6 15.3 3 18c0-5.6 3.7-9.4 10-9.7V4z"/></svg>
        <div class="num">⟦SHARES⟧</div>
      </div>
      <div class="sh-disc">
        <svg xmlns="http://www.w3.org/2000/svg" width="45" height="45" viewBox="0 0 42 42">
          <g>
            <circle cx="21" cy="21" r="20" fill="#161616" stroke="#3a3a3a" stroke-width="1"/>
            <circle cx="21" cy="21" r="12" fill="none" stroke="#2c2c2c" stroke-width="1"/>
            <circle cx="21" cy="21" r="7.5" fill="url(#sh-dgrad)"/>
            <text x="21" y="24.5" font-size="9" fill="#fff" text-anchor="middle">♪</text>
            <animateTransform attributeName="transform" type="rotate" from="0 21 21" to="360 21 21" dur="4s" repeatCount="indefinite"/>
          </g>
          <defs>
            <linearGradient id="sh-dgrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#8889CD"/><stop offset="1" stop-color="#BB6688"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>

    <div class="sh-caption">
      <div class="uid">@⟦UID⟧</div>
      <div class="txt">⟦CAP⟧</div>
      <div class="sh-music">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M9 18.5A2.5 2.5 0 1 1 6.5 16c.5 0 1 .15 1.5.4V5l11-2v12.5A2.5 2.5 0 1 1 16.5 13c.5 0 1 .15 1.5.4V6.4L9 8v10.5z"/></svg>
        <svg xmlns="http://www.w3.org/2000/svg" width="170" height="17" viewBox="0 0 170 17">
          <clipPath id="sh-mq1"><rect x="0" y="0" width="170" height="17"/></clipPath>
          <g clip-path="url(#sh-mq1)">
            <text y="13" font-size="12.5" fill="#fff" font-family="-apple-system,'Noto Sans KR',sans-serif">⟦MUSIC⟧ · ⟦MUSIC⟧ · <animateTransform attributeName="transform" type="translate" from="0 0" to="-⟦MQW⟧ 0" dur="⟦MQD⟧s" repeatCount="indefinite"/></text>
          </g>
        </svg>
      </div>
    </div>

    <div class="tt-nav">
      <div class="ni on">⌂<div>홈</div></div>
      <div class="ni">👥<div>친구</div></div>
      <div class="tt-plusbtn">＋</div>
      <div class="ni">✉<div>메시지</div></div>
      <div class="ni">👤<div>프로필</div></div>
    </div>
  </div>

  <div id="skin-rl" style="display:none">
    <div class="rl-top">
      <div>릴스</div>
      <svg xmlns="http://www.w3.org/2000/svg" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8"><rect x="2.5" y="5.5" width="13" height="13" rx="3"/><path d="M15.5 10.5 21 7v10l-5.5-3.5z"/></svg>
    </div>

    <div class="sh-actions" style="bottom:112px;">
      <div class="sh-act">
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="28" viewBox="0 0 24 24" fill="#fff">
          <path d="M12 21s-7.5-4.9-9.7-9.1C.7 8.7 2.6 5 6.2 5c2.1 0 3.5 1.1 4.3 2.4l1.5 2.3 1.5-2.3C14.3 6.1 15.7 5 17.8 5c3.6 0 5.5 3.7 3.9 6.9C19.5 16.1 12 21 12 21z">
            <animateTransform attributeName="transform" type="scale" values="1;1.1;1" dur="1.8s" repeatCount="indefinite" additive="sum"/>
          </path>
        </svg>
        <div class="num">⟦LIKES⟧</div>
      </div>
      <div class="sh-act">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9"><path d="M21 11.5c0 4.1-4 7.5-9 7.5-1.1 0-2.2-.17-3.2-.5L4 20l1.3-3.2C3.9 15.4 3 13.5 3 11.5 3 7.4 7 4 12 4s9 3.4 9 7.5z"/></svg>
        <div class="num">⟦CMTN⟧</div>
      </div>
      <div class="sh-act">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9"><path d="M21 3 3 10.5l6.7 2.6L12.3 20 21 3z"/><path d="M9.7 13.1 21 3"/></svg>
        <div class="num">⟦SHARES⟧</div>
      </div>
      <div class="sh-act" style="font-weight:700; font-size:19px;">⋮</div>
      <div class="rl-audio">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="#fff"><path d="M9 18.5A2.5 2.5 0 1 1 6.5 16c.5 0 1 .15 1.5.4V5l11-2v12.5A2.5 2.5 0 1 1 16.5 13c.5 0 1 .15 1.5.4V6.4L9 8v10.5z"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="5s" repeatCount="indefinite"/></path></svg>
      </div>
    </div>

    <div class="sh-caption" style="bottom:64px;">
      <div class="rl-userline">
        <div class="rl-ava">⟦AVA⟧</div>
        <div class="uid" style="margin:0; font-size:14px;">⟦UID⟧</div>
        <div class="rl-follow">팔로우</div>
      </div>
      <div class="txt">⟦CAP⟧</div>
      <div class="sh-music">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M9 18.5A2.5 2.5 0 1 1 6.5 16c.5 0 1 .15 1.5.4V5l11-2v12.5A2.5 2.5 0 1 1 16.5 13c.5 0 1 .15 1.5.4V6.4L9 8v10.5z"/></svg>
        <svg xmlns="http://www.w3.org/2000/svg" width="170" height="17" viewBox="0 0 170 17">
          <clipPath id="sh-mq2"><rect x="0" y="0" width="170" height="17"/></clipPath>
          <g clip-path="url(#sh-mq2)">
            <text y="13" font-size="12.5" fill="#fff" font-family="-apple-system,'Noto Sans KR',sans-serif">⟦MUSIC⟧ · ⟦MUSIC⟧ · <animateTransform attributeName="transform" type="translate" from="0 0" to="-⟦MQW⟧ 0" dur="⟦MQD⟧s" repeatCount="indefinite"/></text>
          </g>
        </svg>
      </div>
    </div>

    <div class="rl-nav">
      <svg xmlns="http://www.w3.org/2000/svg" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9"><path d="M3 10.5 12 3l9 7.5V21h-6v-6h-6v6H3V10.5z"/></svg>
      <svg xmlns="http://www.w3.org/2000/svg" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>
      <svg xmlns="http://www.w3.org/2000/svg" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><path d="M3.5 9.5h17M9.5 3.5l2 6M14.5 3.5l2 6"/><path d="m10.5 12.5 4 2.5-4 2.5v-5z" fill="#fff" stroke="none"/></svg>
      <svg xmlns="http://www.w3.org/2000/svg" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1z"/></svg>
      <div class="rl-profile"></div>
    </div>
  </div>

  <div class="sh-sheet">
    <div class="sheet-head">댓글 ⟦CMTN⟧개 <span class="x">✕</span></div>
    <div class="sh-cmts">⟦CMTS⟧</div>
    <div class="sh-cinput">
      <div class="sh-cava" style="background:linear-gradient(135deg,#8889CD,#BB6688); width:30px; height:30px; font-size:14px;">⟦AVA⟧</div>
      <div class="field">댓글 추가...</div>
    </div>
  </div>
</div>
</body>
</html>`,
  'match': `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>Match</title>
<style>
  :root {
    --col-indigo: #8889CD;
    --col-pink:   #DDAACC;
    --col-sand:   #CCAA88;
    --col-rose:   #BB6688;
  }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#161221; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif; color:#fff; }
  .ma-app {
    width:390px; position:relative; overflow:hidden;
    background:linear-gradient(165deg, #221d33 0%, #161221 60%, #251a2c 100%);
    color:#fff;
    font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
  }
  .ma-app.fx { height:693px; }

  /* ── 공통 버튼 ── */
  .ma-btn {
    border-radius:50%; display:flex; align-items:center; justify-content:center;
    background:rgba(30,25,44,.92); box-shadow:0 3px 12px rgba(0,0,0,.4);
    border:1.5px solid rgba(255,255,255,.14);
  }
  .ma-btn.s { width:44px; height:44px; }
  .ma-btn.m { width:54px; height:54px; }
  .ma-btn.l { width:62px; height:62px; }
  .ma-btn.like { background:linear-gradient(145deg, #FF6699, var(--col-rose)); border:none; }
  .ma-btn.nope { border-color:rgba(238,17,102,.55); }

  /* ══ ① CARD ══ */
  .mc-top {
    position:absolute; top:0; left:0; right:0; height:52px;
    display:flex; align-items:center; justify-content:space-between;
    padding:0 18px; z-index:5;
  }
  .mc-logo { display:flex; align-items:center; gap:6px; font-weight:800; font-size:19px;
    background:linear-gradient(90deg, #FF6699, var(--col-indigo));
    -webkit-background-clip:text; background-clip:text; color:transparent; }
  .mc-topicons { display:flex; gap:16px; opacity:.75; }
  .mc-stack { position:absolute; top:56px; left:14px; right:14px; bottom:108px; }
  .mc-card-back {
    position:absolute; inset:0; top:10px; left:10px; right:10px;
    border-radius:16px; background:#2b2540; transform:rotate(1.6deg);
  }
  .mc-card {
    position:absolute; inset:0; border-radius:16px; overflow:hidden;
    background:linear-gradient(160deg, var(--col-indigo) 0%, #6a5a9e 45%, var(--col-rose) 100%);
    box-shadow:0 6px 24px rgba(0,0,0,.45);
  }
  .ma-bgimg { position:absolute; inset:0; background-size:cover; background-position:center; }
  .ma-deco {
    position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
    font-size:120px; opacity:.32;
  }
  .mc-shade { position:absolute; left:0; right:0; bottom:0; height:56%;
    background:linear-gradient(transparent, rgba(20,14,28,.55) 45%, rgba(16,10,24,.92)); }
  .mc-info { position:absolute; left:0; right:0; bottom:0; padding:0 18px 18px; z-index:3; }
  .mc-name { font-size:29px; font-weight:800; display:flex; align-items:center; gap:8px; }
  .mc-age { font-weight:400; font-size:25px; opacity:.92; }
  .mc-dist { margin-top:5px; font-size:13px; color:rgba(255,255,255,.82);
    display:flex; align-items:center; gap:5px; }
  .mc-bio { margin-top:8px; font-size:14px; line-height:1.45; color:rgba(255,255,255,.94); }
  .mc-tags { margin-top:11px; display:flex; flex-wrap:wrap; gap:7px; }
  .mc-tag {
    font-size:12px; padding:5px 12px; border-radius:99px;
    border:1px solid rgba(255,255,255,.45); background:rgba(255,255,255,.12);
  }
  .mc-tag.hl { border-color:var(--col-pink); background:rgba(221,170,204,.28); }
  .mc-actions {
    position:absolute; bottom:24px; left:0; right:0;
    display:flex; align-items:center; justify-content:center; gap:14px; z-index:5;
  }

  /* ══ ② MATCH ══ */
  .mm-bg { position:absolute; inset:0;
    background:radial-gradient(circle at 50% 30%, #3a2d55 0%, #1c1630 55%, #150f22 100%); }
  .mm-wrap { position:absolute; inset:0; display:flex; flex-direction:column;
    align-items:center; justify-content:center; z-index:3; padding-bottom:20px; }
  .mm-title {
    font-size:47px; font-weight:800; font-style:italic; letter-spacing:1px;
    background:linear-gradient(95deg, #FF6699 10%, var(--col-pink) 50%, var(--col-indigo) 95%);
    -webkit-background-clip:text; background-clip:text; color:transparent;
    transform:rotate(-4deg);
  }
  .mm-sub { margin-top:10px; font-size:14px; color:rgba(255,255,255,.78); }
  .mm-avas { margin-top:38px; display:flex; align-items:center; }
  .mm-ava {
    width:124px; height:124px; border-radius:50%;
    display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px;
    color:#fff; border:4px solid #fff; box-shadow:0 6px 24px rgba(0,0,0,.5);
    background-size:cover; background-position:center;
  }
  .mm-ava .emo { font-size:44px; line-height:1; }
  .mm-ava .nm { font-size:14px; font-weight:700; letter-spacing:1px;
    color:rgba(255,255,255,.95); text-shadow:0 1px 4px rgba(0,0,0,.4); }
  .mm-ava.a { background-color:var(--col-indigo);
    background-image:linear-gradient(150deg, var(--col-indigo), #884499);
    transform:rotate(-7deg); z-index:2; }
  .mm-ava.b { background-color:var(--col-rose);
    background-image:linear-gradient(150deg, #FF6699, var(--col-rose));
    transform:rotate(7deg); margin-left:-26px; }
  .mm-ava.img { background-image:none; }
  .mm-heartmid {
    position:absolute; z-index:4; width:52px; height:52px; border-radius:50%;
    background:linear-gradient(145deg, #EE1166, #FF6699);
    display:flex; align-items:center; justify-content:center;
    left:50%; transform:translateX(-50%); margin-top:86px;
    box-shadow:0 4px 16px rgba(238,17,102,.55);
  }
  .mm-btns { margin-top:64px; display:flex; flex-direction:column; gap:13px; width:270px; }
  .mm-btn {
    height:50px; border-radius:99px; display:flex; align-items:center; justify-content:center;
    font-size:15px; font-weight:700;
  }
  .mm-btn.go { background:linear-gradient(90deg, #FF6699, var(--col-rose)); color:#fff;
    box-shadow:0 4px 18px rgba(187,102,136,.5); }
  .mm-btn.stay { border:1.5px solid rgba(255,255,255,.4); color:rgba(255,255,255,.88); }
  .mm-spark { position:absolute; inset:0; z-index:2; }

  /* ══ ③ PROFILE ══ */
  .mp-photo {
    position:relative; height:340px;
    background:linear-gradient(160deg, var(--col-pink) 0%, var(--col-indigo) 60%, #884499 100%);
    display:flex; align-items:center; justify-content:center;
  }
  .mp-photo .ma-deco { font-size:110px; opacity:.34; }
  .mp-photo-shade { position:absolute; left:0; right:0; bottom:0; height:110px;
    background:linear-gradient(transparent, #161221); }
  .mp-back { position:absolute; top:14px; left:14px; width:36px; height:36px; border-radius:50%;
    background:rgba(20,15,30,.55); display:flex; align-items:center; justify-content:center; z-index:2; }
  .mp-body { padding:0 20px 26px; margin-top:-34px; position:relative; z-index:2; }
  .mp-name { font-size:27px; font-weight:800; display:flex; align-items:center; gap:8px; }
  .mp-name .age { font-weight:400; font-size:23px; opacity:.9; }
  .mp-sub { margin-top:6px; font-size:13px; color:#b9b3c8; display:flex; flex-direction:column; gap:5px; }
  .mp-sub .row { display:flex; align-items:center; gap:7px; }
  .mp-sec { margin-top:20px; }
  .mp-sec h4 { font-size:12px; letter-spacing:1.5px; color:var(--col-sand); font-weight:700; margin-bottom:9px; }
  .mp-intro { font-size:14px; line-height:1.6; color:#e8e4f0; }
  .mp-tags { display:flex; flex-wrap:wrap; gap:7px; }
  .mp-tag { font-size:12px; padding:6px 13px; border-radius:99px;
    border:1px solid rgba(136,137,205,.6); background:rgba(136,137,205,.16); color:#d9d7ef; }
  .mp-life { display:flex; flex-wrap:wrap; gap:9px; }
  .mp-lf { display:flex; align-items:center; gap:6px; font-size:12.5px; color:#d5d0e2;
    padding:7px 12px; border-radius:11px; background:rgba(255,255,255,.06);
    border:1px solid rgba(255,255,255,.1); }
  .mp-actions { margin-top:24px; display:flex; justify-content:center; gap:16px; }
</style>
</head>
<body>
<div class="ma-app fx" id="ma-app">

<div id="ma-card">
  <div class="mc-top">
    <div class="mc-logo">
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
        <path d="M13.5 2c.6 3.4-.8 5.4-2.4 7.1C9.5 10.8 8 12.6 8 15.4 8 19 10.7 22 14.3 22c3.7 0 6.7-3 6.7-6.9C21 9.5 16.8 4 13.5 2z" fill="#FF6699"/>
        <path d="M12.2 13.2c-1.1 1.1-1.9 2.2-1.9 3.7 0 2 1.6 3.6 3.7 3.6s3.8-1.7 3.8-3.9c0-2.6-1.7-5-3.5-6.6.2 1.6-.9 2.1-2.1 3.2z" fill="#DDAACC"/>
      </svg>
      spark
    </div>
    <div class="mc-topicons">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M4 5h16M4 12h16M4 19h16"/></svg>
    </div>
  </div>
  <div class="mc-stack">
    <div class="mc-card-back"></div>
    <div class="mc-card">
      <svg width="338" height="3" viewBox="0 0 338 3" style="position:absolute;top:10px;left:12px;z-index:3">⟦BARS⟧</svg>
      <div class="ma-bgimg" id="mc-bgimg" style="display:none"></div>
      <div class="ma-deco" id="mc-deco" style="display:none">⟦EMO⟧</div>
      <div class="mc-shade"></div>
      <div class="mc-info">
        <div class="mc-name">⟦NAME⟧ <span class="mc-age">⟦AGE⟧</span>
          <svg width="22" height="22" viewBox="0 0 24 24">
            <path d="M12 1.8l2.4 2 3.1-.3 1 3 2.8 1.4-.7 3.1 2 2.4-2 2.4.7 3.1-2.8 1.4-1 3-3.1-.3-2.4 2-2.4-2-3.1.3-1-3L2.7 18l.7-3.1-2-2.4 2-2.4L2.7 7l2.8-1.4 1-3 3.1.3z" fill="#00BBDD"/>
            <path d="M8.4 12.2l2.4 2.4 4.8-4.9" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="mc-dist">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#DDAACC" stroke-width="2.4"><path d="M12 21s-7-6.1-7-11a7 7 0 1114 0c0 4.9-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>
          ⟦DIST⟧
        </div>
        <div class="mc-bio">⟦BIO⟧</div>
        <div class="mc-tags">⟦TAGS⟧</div>
      </div>
    </div>
  </div>
  <div class="mc-actions">
    <div class="ma-btn s">
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#CCAA88" stroke-width="2.2"><path d="M5.5 8.25A7.5 7.5 0 1 0 12 4.5" stroke-linecap="round"/><path d="M13.8 1.8L10.6 4.6L13.6 7.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>
    <div class="ma-btn m nope">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EE1166" stroke-width="2.6"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/></svg>
    </div>
    <div class="ma-btn s">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="#00BBDD"><path d="M12 2.5l2.6 6 6.4.5-4.9 4.2 1.5 6.3L12 16l-5.6 3.5 1.5-6.3L3 9l6.4-.5z"/></svg>
    </div>
    <div class="ma-btn l like">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
        <path d="M12 21s-7.5-4.9-9.7-9.1C.7 8.7 2.6 5 6.2 5c2.1 0 3.5 1.1 4.3 2.4l1.5 2.3 1.5-2.3C14.3 6.1 15.7 5 17.8 5c3.6 0 5.5 3.7 3.9 6.9C19.5 16.1 12 21 12 21z">
          <animateTransform attributeName="transform" type="scale" values="1;1.14;1" keyTimes="0;.5;1" dur="1.6s" repeatCount="indefinite" additive="sum"/>
          <animateTransform attributeName="transform" type="translate" values="0 0;-1.7 -1.7;0 0" keyTimes="0;.5;1" dur="1.6s" repeatCount="indefinite" additive="sum"/>
        </path>
      </svg>
    </div>
    <div class="ma-btn m">
      <svg width="21" height="21" viewBox="0 0 24 24" fill="#884499"><path d="M13 2L4.5 13.5H11l-1 8.5L18.5 10H12z"/></svg>
    </div>
  </div>
</div>

<div id="ma-match" style="display:none">
  <div class="mm-bg"></div>
  <svg class="mm-spark" width="390" height="693" viewBox="0 0 390 693">
    <g fill="#DDAACC">
      <path d="M60 120l3 8 8 3-8 3-3 8-3-8-8-3 8-3z"><animate attributeName="opacity" values="0;1;0" dur="2.2s" repeatCount="indefinite"/></path>
      <path d="M330 90l2.5 7 7 2.5-7 2.5-2.5 7-2.5-7-7-2.5 7-2.5z" fill="#8889CD"><animate attributeName="opacity" values="0;1;0" dur="1.8s" begin=".5s" repeatCount="indefinite"/></path>
      <path d="M320 300l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#FF6699"><animate attributeName="opacity" values="0;1;0" dur="2.5s" begin=".9s" repeatCount="indefinite"/></path>
      <path d="M55 330l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#CCAA88"><animate attributeName="opacity" values="0;1;0" dur="2s" begin="1.3s" repeatCount="indefinite"/></path>
      <circle cx="120" cy="80" r="2.5" fill="#fff"><animate attributeName="opacity" values=".1;.9;.1" dur="1.7s" repeatCount="indefinite"/></circle>
      <circle cx="280" cy="170" r="2" fill="#DDAACC"><animate attributeName="opacity" values=".1;.9;.1" dur="2.1s" begin=".4s" repeatCount="indefinite"/></circle>
      <circle cx="90" cy="230" r="2" fill="#8889CD"><animate attributeName="opacity" values=".1;.8;.1" dur="1.9s" begin=".8s" repeatCount="indefinite"/></circle>
      <circle cx="310" cy="480" r="2.5" fill="#FF6699"><animate attributeName="opacity" values=".1;.9;.1" dur="2.3s" begin=".2s" repeatCount="indefinite"/></circle>
      <path d="M195 430c-2-3.5-6-4-8-1.6-1.6 2-1 5 1.4 7.4l6.6 6 6.6-6c2.4-2.4 3-5.4 1.4-7.4-2-2.4-6-1.9-8 1.6z" fill="#EE1166" opacity="0">
        <animateTransform attributeName="transform" type="translate" values="0 40;0 -60" dur="3.4s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0;.85;0" keyTimes="0;.35;1" dur="3.4s" repeatCount="indefinite"/>
      </path>
      <path d="M160 440c-1.6-2.8-4.8-3.2-6.4-1.3-1.3 1.6-.8 4 1.1 5.9l5.3 4.8 5.3-4.8c1.9-1.9 2.4-4.3 1.1-5.9-1.6-1.9-4.8-1.5-6.4 1.3z" fill="#FF6699" opacity="0">
        <animateTransform attributeName="transform" type="translate" values="0 45;0 -50" dur="4s" begin="1.2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0;.7;0" keyTimes="0;.35;1" dur="4s" begin="1.2s" repeatCount="indefinite"/>
      </path>
      <path d="M232 435c-1.6-2.8-4.8-3.2-6.4-1.3-1.3 1.6-.8 4 1.1 5.9l5.3 4.8 5.3-4.8c1.9-1.9 2.4-4.3 1.1-5.9-1.6-1.9-4.8-1.5-6.4 1.3z" fill="#DDAACC" opacity="0">
        <animateTransform attributeName="transform" type="translate" values="0 42;0 -55" dur="3.7s" begin="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0;.75;0" keyTimes="0;.35;1" dur="3.7s" begin="2s" repeatCount="indefinite"/>
      </path>
    </g>
  </svg>
  <div class="mm-wrap">
    <div class="mm-title">It's a Match!</div>
    <div class="mm-sub">⟦SUB⟧</div>
    <div class="mm-avas">
      <div class="mm-ava a⟦AC1⟧" style="⟦AV1S⟧"><span class="emo" style="⟦AE1S⟧">⟦E1⟧</span><span class="nm">⟦N1⟧</span></div>
      <div class="mm-ava b⟦AC2⟧" style="⟦AV2S⟧"><span class="emo" style="⟦AE2S⟧">⟦E2⟧</span><span class="nm">⟦N2⟧</span></div>
    </div>
    <div class="mm-heartmid">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff">
        <path d="M12 21s-7.5-4.9-9.7-9.1C.7 8.7 2.6 5 6.2 5c2.1 0 3.5 1.1 4.3 2.4l1.5 2.3 1.5-2.3C14.3 6.1 15.7 5 17.8 5c3.6 0 5.5 3.7 3.9 6.9C19.5 16.1 12 21 12 21z">
          <animateTransform attributeName="transform" type="scale" values="1;1.18;1" keyTimes="0;.5;1" dur="1.1s" repeatCount="indefinite" additive="sum"/>
          <animateTransform attributeName="transform" type="translate" values="0 0;-2.2 -2.2;0 0" keyTimes="0;.5;1" dur="1.1s" repeatCount="indefinite" additive="sum"/>
        </path>
      </svg>
    </div>
    <div class="mm-btns">
      <div class="mm-btn go">메시지 보내기</div>
      <div class="mm-btn stay">계속 둘러보기</div>
    </div>
  </div>
</div>

<div id="ma-profile" style="display:none">
  <div class="mp-photo">
    <div class="mp-back">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4"><path d="M15 5l-7 7 7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>
    <div class="ma-bgimg" id="mp-bgimg" style="display:none"></div>
    <div class="ma-deco" id="mp-deco" style="display:none">⟦EMO⟧</div>
    <div class="mp-photo-shade"></div>
  </div>
  <div class="mp-body">
    <div class="mp-name">⟦NAME⟧ <span class="age">⟦AGE⟧</span>
      <svg width="20" height="20" viewBox="0 0 24 24">
        <path d="M12 1.8l2.4 2 3.1-.3 1 3 2.8 1.4-.7 3.1 2 2.4-2 2.4.7 3.1-2.8 1.4-1 3-3.1-.3-2.4 2-2.4-2-3.1.3-1-3L2.7 18l.7-3.1-2-2.4 2-2.4L2.7 7l2.8-1.4 1-3 3.1.3z" fill="#00BBDD"/>
        <path d="M8.4 12.2l2.4 2.4 4.8-4.9" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      </svg>
    </div>
    <div class="mp-sub">⟦ROWS⟧</div>
    ⟦SECS⟧
    <div class="mp-actions">
      <div class="ma-btn m nope">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EE1166" stroke-width="2.6"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/></svg>
      </div>
      <div class="ma-btn l like">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff"><path d="M12 21s-7.5-4.9-9.7-9.1C.7 8.7 2.6 5 6.2 5c2.1 0 3.5 1.1 4.3 2.4l1.5 2.3 1.5-2.3C14.3 6.1 15.7 5 17.8 5c3.6 0 5.5 3.7 3.9 6.9C19.5 16.1 12 21 12 21z"/></svg>
      </div>
      <div class="ma-btn m">
        <svg width="21" height="21" viewBox="0 0 24 24" fill="#884499"><path d="M13 2L4.5 13.5H11l-1 8.5L18.5 10H12z"/></svg>
      </div>
    </div>
  </div>
</div>

</div>
</body>
</html>`,
  'wiki': `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>Wiki</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#ffffff; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif; }
  .wk-app {
    width:390px; overflow:hidden;
    --wk-bg:#ffffff; --wk-fg:#212529; --wk-sub:#666a70; --wk-line:#d5d9dd;
    --wk-accent:#00A478; --wk-top:#00A478; --wk-box:#f6f7f8; --wk-boxline:#c8ccd1;
    background:var(--wk-bg); color:var(--wk-fg);
    font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
    font-size:13.5px; line-height:1.6;
  }
  .wk-top {
    display:flex; align-items:center; justify-content:space-between;
    padding:10px 14px; background:var(--wk-top);
  }
  .wk-logo { font-weight:800; font-size:17px; color:#fff; letter-spacing:.5px; display:flex; align-items:center; gap:7px; }
  .wk-topic { display:flex; gap:14px; opacity:.9; }
  .wk-body { padding:14px 16px 24px; }
  .wk-title { font-size:23px; font-weight:800; display:flex; align-items:baseline; justify-content:space-between; gap:8px;
    border-bottom:1px solid var(--wk-line); padding-bottom:8px; }
  .wk-tbtns { display:flex; gap:5px; flex-shrink:0; }
  .wk-tbtn { font-size:11px; font-weight:400; color:var(--wk-sub); border:1px solid var(--wk-line);
    padding:2.5px 8px; border-radius:4px; white-space:nowrap; }
  .wk-cats { margin-top:8px; font-size:12px; color:var(--wk-sub); }
  .wk-cats a { color:var(--wk-accent); text-decoration:none; }
  .wk-info { margin-top:14px; border:1px solid var(--wk-boxline); border-radius:6px; overflow:hidden; }
  .wk-info-img {
    height:150px; background:linear-gradient(160deg, #8889CD, #BB6688);
    display:flex; align-items:center; justify-content:center; font-size:64px;
    background-size:cover; background-position:center;
  }
  .wk-info-name { text-align:center; font-weight:800; font-size:15px; padding:9px 10px;
    background:var(--wk-box); border-bottom:1px solid var(--wk-boxline); }
  .wk-irow { display:flex; border-bottom:1px solid var(--wk-boxline); font-size:12.5px; }
  .wk-irow:last-child { border-bottom:none; }
  .wk-ilab { width:88px; flex-shrink:0; background:var(--wk-box); padding:7px 10px; font-weight:700; color:var(--wk-sub); }
  .wk-ival { padding:7px 11px; }
  .wk-ival a { color:var(--wk-accent); text-decoration:none; }
  .wk-toc { margin-top:16px; border:1px solid var(--wk-boxline); background:var(--wk-box);
    border-radius:6px; padding:11px 14px; display:inline-block; min-width:200px; }
  .wk-toc-t { font-weight:800; font-size:13px; margin-bottom:6px; }
  .wk-toc a { display:block; color:var(--wk-accent); text-decoration:none; font-size:12.5px; padding:1.5px 0; }
  .wk-toc a .n { color:var(--wk-sub); margin-right:6px; }
  .wk-sec { margin-top:22px; }
  .wk-h2 { font-size:18px; font-weight:800; border-bottom:1px solid var(--wk-line); padding-bottom:6px; margin-bottom:10px; }
  .wk-h2 .n { color:var(--wk-accent); margin-right:7px; font-weight:700; }
  .wk-p a { color:var(--wk-accent); text-decoration:none; }
  .wk-p del { color:var(--wk-sub); }
  .wk-p sup { color:var(--wk-accent); font-size:10px; margin-left:1px; }
  .wk-quote { margin:10px 0 0; padding:9px 13px; border-left:3px solid var(--wk-accent);
    background:var(--wk-box); font-style:italic; color:var(--wk-sub); font-size:13px; }
  .wk-foot { margin-top:26px; border-top:1px solid var(--wk-line); padding-top:10px; font-size:11.5px; color:var(--wk-sub); }
  .wk-foot .fn { color:var(--wk-accent); margin-right:6px; }
  .wk-foot div { padding:2px 0; }
  .wk-last { margin-top:18px; font-size:11px; color:var(--wk-sub); text-align:right; }
</style>
</head>
<body>
<div class="wk-app" id="wk-app">
  <div class="wk-top">
    <div class="wk-logo">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2"><path d="M4 5h16M4 5v6c0 5 3.6 8 8 8s8-3 8-8V5" stroke-linecap="round"/><path d="M12 19v-8" stroke-linecap="round"/></svg>
      위키위키
    </div>
    <div class="wk-topic">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
    </div>
  </div>
  <div class="wk-body">
    <div class="wk-title">⟦TITLE⟧ <div class="wk-tbtns"><span class="wk-tbtn">편집</span><span class="wk-tbtn">역사</span><span class="wk-tbtn">토론</span></div></div>
    ⟦CATS⟧
    ⟦INFO⟧
    ⟦TOC⟧
    ⟦SECS⟧
    ⟦FOOT⟧
    ⟦LAST⟧
  </div>
</div>
</body>
</html>`,
};

const SIZES = {
  // 🔒 고정: lock(844), story(900), kakao(900), insta(1000), stream(900), discord(900), voice(900)
  'insta': [470, 800], 'twitter': [598, 600], 'kakao': [420, 900],
  'reddit': [600, 700], 'lock': [390, 844], 'email': [560, 600],
  'story': [420, 900], 'search': [600, 700], 'news': [560, 800],
  'doc': [540, 700], 'board': [600, 600], 'discord': [520, 700],
  'voice': [280, 700], 'discord-full': [620, 700], 'stream': [820, 750],
  'post': [600, 1200],
  'letter': [480, 700],
  'menu': [480, 850],
  'dm': [420, 900],
  'tl': [598, 600],
  'shorts': [390, 693],
  'match': [390, 693],
  'wiki': [390, 800],
};


// ══════════════════════════════════════════════════════════════
// 서버사이드 렌더러 — 각 UI 타입별로 파라미터를 HTML에 직접 주입
// ══════════════════════════════════════════════════════════════

function fmt(n) {
  const num = Number(n);
  if (num >= 1000) return (num/1000).toFixed(1).replace(/\.0$/,'') + 'k';
  return String(n);
}

function avatarColor(name) {
  const colors = ['#e8736c','#f0a05a','#7eb8d4','#82c4a0','#a78fd4','#d47eb8','#7ab8c4','#e0976e','#6ecfcf','#c87eaa','#8fb87e','#cf9e6e','#7eaab8','#d48f8f'];
  let hash = 7;
  let _i=0; for (const c of name) { hash = (hash * 31 + c.charCodeAt(0) + _i * 17) | 0; _i++; }
  return colors[((hash % colors.length) + colors.length) % colors.length];
}

function avatarBg(name) {
  const colors = ['#5865f2','#FF6699','#57f287','#fee75c','#ed4245','#8889CD','#BB6688','#CCAA88','#3ba55c','#FF7722','#0077DD','#e8a44d','#9b84ec','#00BBDD'];
  let h = 7;
  let _i=0; for (const c of name) { h = (h * 31 + c.charCodeAt(0) + _i * 17) | 0; _i++; }
  return colors[((h % colors.length) + colors.length) % colors.length];
}

function roleColor(c) {
  const map = {'인디고':'#8889CD','핑크':'#DDAACC','샌드':'#CCAA88','로즈':'#BB6688','빨강':'#ed4245','초록':'#57f287','파랑':'#5865f2','노랑':'#fee75c','흰색':'#f2f3f5','구독자':'#BB6688','매니저':'#CCAA88'};
  return map[c] || '#b5bac1';
}

// ── INSTA ──
function renderInsta(html, url) {
  const p = url.searchParams.get('p');
  const c = url.searchParams.get('c');
  if (!p) return html;
  const parts = p.split('§');
  const user = parts[0] || '@lorem_ipsum';
  const followers = parts[1] || '0';
  const commentCount = parts[2] || '0';
  const time = parts[3] || '방금';
  const imgDesc = parts[4] || '사진 설명';
  const caption = parts[5] || '';
  const hasT = parts[6] && parts[6].startsWith('[');
  const capT = hasT ? parts[6] : '';
  const tags = hasT ? (parts[7]||'') : (parts[6]||'');
  const uname = user.startsWith('@') ? user : '@'+user;
  html = html.replace('>@lorem_ipsum<', '>'+uname+'<');
  html = html.replace('id="cap-user">lorem_ipsum<', 'id="cap-user">'+uname.replace('@','')+'<');
  html = html.replace('>사진 설명<', '>'+imgDesc+'<');
  html = html.replace('>좋아요 1,204개<', '>좋아요 '+Number(followers).toLocaleString()+'개<');
  html = html.replace('>오늘 수고했어요<', '>'+caption+'<');
  html = html.replace('>[Good job today]<', '>'+(capT||'')+'<');
  if (!capT) html = html.replace('class="cap-translation"', 'class="cap-translation" style="display:none"');
  html = html.replace('>#일상 #감성<', '>'+tags.replace(/%23/g,'#')+'<');
  if (!tags) html = html.replace('class="post-hashtags"', 'class="post-hashtags" style="display:none"');
  html = html.replace('>댓글 48개 모두 보기<', '>댓글 '+commentCount+'개 모두 보기<');
  html = html.replace('>2일 전<', '>'+time+'<');
  if (c) {
    let ch = '';
    c.split('|').forEach(raw => {
      const seg = raw.split('§');
      const cu=seg[0]||'', ct=seg[1]||'';
      const hasCT = seg.length>=4 && !isNaN(Number(seg[seg.length-1]));
      const ctr = hasCT && seg.length>=4 ? seg[2] : '';
      const cl = seg[seg.length-1]||'0';
      ch += '<div class="comment"><div class="comment-left"><span class="com-user">'+cu+'</span>'+ct;
      if(ctr) ch += '<span class="com-translation">'+ctr+'</span>';
      ch += '</div><div class="comment-likes">♡ '+Number(cl).toLocaleString()+'</div></div>';
    });
    html = html.replace('id="comments-container"></div>', 'id="comments-container">'+ch+'</div>');
  }
  return html;
}

// ── TWITTER ──
function renderTwitter(html, url) {
  const p = url.searchParams.get('p');
  const r = url.searchParams.get('r');
  if (!p) return html;
  const parts = p.split('§');
  const handle=parts[0]||'@handle', displayName=parts[1]||'Name', time=parts[2]||'방금', body=parts[3]||'';
  let idx=4, translation='', imgDesc='';
  if (parts[idx]&&parts[idx].startsWith('[')) { translation=parts[idx]; idx++; }
  if (parts[idx]&&isNaN(Number(parts[idx]))&&!(parts[idx]||'').startsWith('[')) { imgDesc=parts[idx]; idx++; }
  const replies=parts[idx]||'0',retweets=parts[idx+1]||'0',quotes=parts[idx+2]||'0',likes=parts[idx+3]||'0',bookmarks=parts[idx+4]||'0';
  const verified = (parts[idx+5]||'').split(',').includes('verified');
  const flags=(parts[idx+5]||'').split(',');
  const lock=flags.includes('lock');
  const views=parts[idx+6]||'';
  const fmtNum=v=>{const n=Number(v);return isNaN(n)?v:n.toLocaleString();};
  html = html.replace('>Display Name<', '>'+displayName+'<');
  html = html.replace('>@handle<', '>'+handle+'<');
  html = html.replace('>트윗 내용<', '>'+body+(translation?'<span class="translation">'+translation+'</span>':'')+'<');
  if (imgDesc) { html=html.replace('id="tweet-image" style="display:none"','id="tweet-image"'); html=html.replace('id="img-desc"></div>','id="img-desc">'+imgDesc+'</div>'); }
  if (verified) html=html.replace('id="verified-badge" viewBox="0 0 24 24" style="display:none"','id="verified-badge" viewBox="0 0 24 24"');
  if (lock) html=html.replace('id="lock-icon" viewBox="0 0 24 24" style="display:none"','id="lock-icon" viewBox="0 0 24 24"');
  // 메타줄: 시간 (+ 조회수)
  let metaHtml='<span>'+time+'</span>';
  if (views) metaHtml+='<span>·</span><span>조회수</span><span class="views-num">'+fmtNum(views)+'</span><span>회</span>';
  html=html.replace('id="tweet-meta"></div>','id="tweet-meta">'+metaHtml+'</div>');
  // 통계: 0인 항목 숨김, 전부 0이면 줄 자체 숨김
  const statDefs=[[retweets,'재게시물'],[quotes,'인용'],[likes,'마음에 들어요'],[bookmarks,'북마크']];
  let statHtml='';
  statDefs.forEach(d=>{ if(d[0]&&d[0]!=='0') statHtml+='<div class="stat-item"><strong>'+fmtNum(d[0])+'</strong><span>'+d[1]+'</span></div>'; });
  if (statHtml) html=html.replace('id="tweet-stats" style="display:none"></div>','id="tweet-stats">'+statHtml+'</div>');
  // 답글 트윗 렌더링
  if (r) {
    html=html.replace('class="tweet no-replies"','class="tweet"');
    html=html.replace('id="replies-section" style="display:none"','id="replies-section"');
    const colors=['#5865f2','#FF6699','#57f287','#fee75c','#ed4245','#8889CD','#BB6688','#CCAA88','#3ba55c','#FF7722','#0077DD','#e8a44d','#9b84ec','#00BBDD'];
    const abg=name=>{let h=7;let _i=0;for(const c of name){h=(h*31+c.charCodeAt(0)+_i*17)|0;_i++;}return colors[((h%colors.length)+colors.length)%colors.length];};
    const icoReply='<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>';
    const icoRT='<svg viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>';
    const icoLike='<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>';
    const icoViews='<svg viewBox="0 0 24 24"><line x1="4" y1="20" x2="4" y2="12"/><line x1="10" y1="20" x2="10" y2="6"/><line x1="16" y1="20" x2="16" y2="10"/><line x1="22" y1="20" x2="22" y2="4"/></svg>';
    const icoBm='<svg viewBox="0 0 24 24"><path d="M19 21l-7-4-7 4V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>';
    const icoShare='<svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>';
    const replyList=r.split('|');
    let rh='';
    replyList.forEach((raw,i)=>{
      const seg=raw.split('§');
      const rName=seg[0]||'',rHandle=seg[1]||'',rTime=seg[2]||'',rBody=seg[3]||'';
      // 5번째 필드부터: @핸들=답글대상 지정, -=대상줄 숨김, 숫자=좋아요/리트윗/조회수/답글수 순
      let rTo=handle; const nums=[];
      for(let s=4;s<seg.length;s++){
        const f=seg[s]||'';
        if(f==='-') rTo='';
        else if(f.startsWith('@')) rTo=f;
        else if(f) nums.push(f);
      }
      const numTxt=v=>(v&&v!=='0')?fmtNum(v):'';
      const rLikes=numTxt(nums[0]),rRT=numTxt(nums[1]),rViews=numTxt(nums[2]),rReplies=numTxt(nums[3]);
      rh+='<div class="reply-item"><div class="reply-avatar" style="background:'+abg(rName)+'">'+rName.charAt(0)+'</div><div class="reply-content"><div class="reply-header"><span class="reply-name">'+rName+'</span><span class="reply-handle">'+rHandle+' · '+rTime+'</span></div>'
        +(rTo?'<div class="replying-to"><span class="mention">'+rTo+'</span> 님에게 보내는 답글</div>':'')
        +'<div class="reply-body">'+rBody+'</div><div class="reply-actions">'
        +'<div class="action">'+icoReply+rReplies+'</div>'
        +'<div class="action">'+icoRT+rRT+'</div>'
        +'<div class="action">'+icoLike+rLikes+'</div>'
        +'<div class="action">'+icoViews+rViews+'</div>'
        +'<div class="action">'+icoBm+'</div>'
        +'<div class="action">'+icoShare+'</div>'
        +'</div></div></div>';
    });
    html=html.replace('id="replies-container"></div>','id="replies-container">'+rh+'</div>');
  }
  return html;
}

// ── KAKAO ──
function renderKakao(html, url) {
  const r = url.searchParams.get('r');
  const m = url.searchParams.get('m');
  if (r) {
    const rp = r.split('§');
    html = html.replace('>채팅방<', '>'+(rp[0]||'채팅방')+'<');
    if (rp[1]) html = html.replace('>2025년 1월 1일 수요일<', '>'+rp[1]+'<');
    if (rp[2]) html = html.replace('id="member-count"></span>', 'id="member-count">'+rp[2]+'</span>');
  }
  if (m) {
    let msgs = '';
    const msgList = m.split('|');
    msgList.forEach((raw,i) => {
      const seg=raw.split('§');
      const sender=seg[0]||'',content=seg[1]||'',time=seg[2]||'',readCnt=seg[3]||'0';
      const isMe=seg[seg.length-1]==='me';
      const prev=i>0?msgList[i-1].split('§')[0]:null;
      const next=i<msgList.length-1?msgList[i+1].split('§')[0]:null;
      const isCont=sender===prev, isLast=sender!==next;
      const cls = isMe?'msg-row me':'msg-row other';
      const bubbleCls = isMe?'bubble':'bubble';
      const ac = avatarColor(sender);
      let row = '<div class="'+cls+(isCont?' cont':'')+'">';
      if (!isMe) {
        row += '<div class="msg-avatar" style="background:'+ac+'">'+sender.charAt(0)+'</div>';
        row += '<div class="msg-content">';
        if (!isCont) row += '<div class="msg-name">'+sender+'</div>';
        row += '<div class="'+bubbleCls+'">'+content+'</div></div>';
      } else {
        const meta = '<div class="meta">'+(readCnt!=='0'?'<div class="read-count">'+readCnt+'</div>':'')+(isLast?'<div class="msg-time">'+time+'</div>':'')+'</div>';
        row += meta+'<div class="msg-content"><div class="'+bubbleCls+'">'+content+'</div></div>';
      }
      if (!isMe) {
        row += '<div class="meta">'+(isLast?'<div class="msg-time">'+time+'</div>':'')+'</div>';
      }
      row += '</div>';
      msgs += row;
    });
    html = html.replace('id="messages">\n    <div class="date-divider"', 'id="messages"><div class="date-divider"');
    html = html.replace('</div>\n  </div>\n\n  <div class="input-bar">', '</div>'+msgs+'</div><div class="input-bar">');
  }
  return html;
}

// ── DM (Instagram DM) ──
function renderDm(html, url) {
  const r = url.searchParams.get('r');
  const m = url.searchParams.get('m');
  if (r) {
    const rp = r.split('§');
    const username = rp[0] || 'username';
    const status = rp[1] || '';
    html = html.replace('>username<', '>'+username+'<');
    html = html.replace('id="header-avatar">U<', 'id="header-avatar" style="background:'+avatarColor(username)+'">'+username.charAt(0).toUpperCase()+'<');
    if (status) html = html.replace('id="header-status"></div>', 'id="header-status">'+status+'</div>');
  }
  if (m) {
    let msgs = '';
    const msgList = m.split('|');
    msgList.forEach((raw,i) => {
      const seg=raw.split('§');
      const sender=seg[0]||'',content=seg[1]||'',time=seg[2]||'';
      const isMe=seg[seg.length-1]==='me';
      const prev=i>0?msgList[i-1].split('§')[0]:null;
      const next=i<msgList.length-1?msgList[i+1].split('§')[0]:null;
      const isCont=sender===prev, isLast=sender!==next;
      const cls = isMe?'msg-row me':'msg-row other';
      const ac = avatarColor(sender);
      let row = '<div class="'+cls+(isCont?' cont':'')+'">';
      if (!isMe) {
        row += '<div class="msg-avatar" style="background:'+ac+'">'+sender.charAt(0)+'</div>';
        row += '<div class="msg-content"><div class="bubble">'+content+'</div></div>';
      } else {
        row += '<div class="msg-content"><div class="bubble">'+content+'</div></div>';
      }
      if (isLast && time) {
        row += '<div class="meta"><div class="msg-time">'+time+'</div></div>';
      }
      row += '</div>';
      msgs += row;
    });
    // 마지막 me 메시지 뒤에 '읽음' 표시
    const lastMe = msgList.map((raw,i)=>({raw,i})).filter(x=>x.raw.split('§')[x.raw.split('§').length-1]==='me').pop();
    if (lastMe) {
      msgs += '<div class="seen-label">읽음</div>';
    }
    html = html.replace('id="messages">\n  </div>', 'id="messages">'+msgs+'</div>');
    html = html.replace('id="messages"></div>', 'id="messages">'+msgs+'</div>');
  }
  return html;
}

// ── REDDIT ──
function renderReddit(html, url) {
  const p = url.searchParams.get('p');
  const c = url.searchParams.get('c');
  if (!p) return html;
  const parts=p.split('§');
  const sub=parts[0]||'AskReddit',author=parts[1]||'throwaway',time=parts[2]||'방금',title=parts[3]||'',body=parts[4]||'',upvotes=parts[5]||'0',commentN=parts[6]||'0';
  let postHtml = '<div class="post-meta"><span class="subreddit">r/'+sub+'</span><span>•</span><span class="post-author">u/'+author+'</span><span>•</span><span>'+time+'</span></div>';
  postHtml += '<div class="post-title">'+title+'</div><div class="post-body">'+body+'</div>';
  postHtml += '<div class="post-actions"><div class="vote"><span class="vote-btn">▲</span><span class="vote-count">'+fmt(upvotes)+'</span><span class="vote-btn">▼</span></div><div class="post-action">💬 '+fmt(commentN)+'개</div><div class="post-action">↗ 공유</div></div>';
  html = html.replace('id="post"></div>', 'id="post">'+postHtml+'</div>');
  if (c) {
    let ch='';
    c.split('|').forEach(raw => {
      const seg=raw.split('§');
      ch+='<div class="comment"><div class="comment-meta"><span class="comment-author">'+(seg[0]||'')+'</span><span class="comment-time">'+(seg[2]||'')+'</span></div><div class="comment-body">'+(seg[1]||'')+'</div><div class="comment-votes"><span class="up">▲</span> '+fmt(seg[3]||'0')+'</div></div>';
    });
    html = html.replace('id="comments"></div>', 'id="comments">'+ch+'</div>');
  }
  return html;
}

// ── LOCKSCREEN ──
function renderLock(html, url) {
  const time = url.searchParams.get('time');
  const n = url.searchParams.get('n');
  if (time) {
    const tp=time.split('§');
    html=html.replace('>12:00</div>\n  <div class="lock-date"','>'+(tp[0]||'12:00')+'</div><div class="lock-date"');
    html=html.replace('id="lock-time">12:00<','id="lock-time">'+(tp[0]||'12:00')+'<');
    html=html.replace('id="status-time">12:00<','id="status-time">'+(tp[0]||'12:00')+'<');
    if(tp[1]) html=html.replace('>1월 1일 수요일<','>'+tp[1]+'<');
  }
  if (n) {
    const icons={'msg':'💬','call':'📞','insta':'📷','sns':'🐦','mail':'✉️','app':'🔔'};
    let nh='';
    n.split('|').forEach(raw => {
      const seg=raw.split('§');
      const type=seg[0]||'app',app=seg[1]||'',title=seg[2]||'',body=seg[3]||'',time=seg[4]||'';
      nh+='<div class="notif"><div class="notif-icon '+type+'">'+(icons[type]||'🔔')+'</div><div class="notif-content"><div class="notif-header"><span class="notif-app">'+app+'</span><span class="notif-time">'+time+'</span></div><div class="notif-title">'+title+'</div><div class="notif-body">'+body+'</div></div></div>';
    });
    html=html.replace('id="notif-area"></div>','id="notif-area">'+nh+'</div>');
  }
  return html;
}

// ── EMAIL ──
function renderEmail(html, url) {
  const p = url.searchParams.get('p');
  if (!p) return html;
  const parts=p.split('§');
  const fromName=parts[0]||'',fromEmail=parts[1]||'',toAddr=parts[2]||'',subject=parts[3]||'',date=parts[4]||'',body=parts.slice(5).join('§')||'';
  const initial=fromName.charAt(0).toUpperCase();
  const headerHtml='<div class="email-subject">'+subject+'</div><div class="email-from-row"><div class="email-avatar">'+initial+'</div><div class="email-from-info"><div class="email-from-name">'+fromName+'</div><div class="email-from-addr">&lt;'+fromEmail+'&gt;</div><div class="email-to">받는 사람: '+toAddr+'</div></div><div class="email-date">'+date+'</div></div>';
  html=html.replace('id="email-header"></div>','id="email-header">'+headerHtml+'</div>');
  html=html.replace('>이메일 내용<','>'+body+'<');
  return html;
}

// ── STORY ──
function renderStory(html, url) {
  const p = url.searchParams.get('p');
  if (!p) return html;
  const parts=p.split('§');
  const user=parts[0]||'@user',time=parts[1]||'',desc=parts[2]||'',caption=parts[3]||'';
  html=html.replace('>username<','>'+user.replace('@','')+'<');
  if(time) html=html.replace('>14분 전<','>'+time+'<');
  if(desc) html=html.replace('>사진 설명<','>'+desc+'<');
  if(caption) { html=html.replace('id="story-caption" style="display:none"','id="story-caption"'); html=html.replace('id="caption-text"></div>','id="caption-text">'+caption+'</div>'); }
  return html;
}

// ── SEARCH ──
function renderSearch(html, url) {
  const q = url.searchParams.get('q');
  const r = url.searchParams.get('r');
  const a = url.searchParams.get('a');
  if(q) {
    const qp=q.split('§');
    html=html.replace('>검색어<','>'+(qp[0]||'')+'<');
    html=html.replace('>검색결과 약 0개<','>검색결과 약 '+Number(qp[1]||0).toLocaleString()+'개 (0.42초)<');
  }
  if(r) {
    let rh='';
    r.split('|').forEach(raw => {
      const seg=raw.split('§');
      const title=seg[0]||'',rurl=seg[1]||'',snippet=seg.slice(2).join('§')||'';
      const fav=rurl.charAt(0).toUpperCase();
      rh+='<div class="result-item"><div class="result-url"><div class="result-favicon">'+fav+'</div>'+rurl+'</div><div class="result-title">'+title+'</div><div class="result-snippet">'+snippet+'</div></div>';
    });
    html=html.replace('id="results"></div>','id="results">'+rh+'</div>');
  }
  if(a) {
    html=html.replace('id="paa" style="display:none"','id="paa"');
    let ah='';
    a.split('|').forEach(t => { ah+='<div class="paa-item"><span>'+t+'</span><span class="paa-arrow">▼</span></div>'; });
    html=html.replace('id="paa-items"></div>','id="paa-items">'+ah+'</div>');
  }
  return html;
}

// ── NEWS ──
function renderNews(html, url) {
  const p = url.searchParams.get('p');
  if (!p) return html;
  const parts=p.split('§');
  const outlet=parts[0]||'NEWS',category=parts[1]||'',title=parts[2]||'',subtitle=parts[3]||'',author=parts[4]||'',date=parts[5]||'',imgDesc=parts[6]||'',body=parts.slice(7).join('§')||'';
  html=html.replace('>NEWS<','>'+outlet+'<');
  html=html.replace('id="bar-tag"></span>','id="bar-tag">'+category+'</span>');
  html=html.replace('id="category"></div>','id="category">'+category+'</div>');
  html=html.replace('>기사 제목<','>'+title+'<');
  if(subtitle) html=html.replace('id="subtitle"></div>','id="subtitle">'+subtitle+'</div>');
  else html=html.replace('id="subtitle"></div>','id="subtitle" style="display:none"></div>');
  html=html.replace('id="author"></span>','id="author">'+author+'</span>');
  html=html.replace('id="date"></span>','id="date">'+date+'</span>');
  if(imgDesc) html=html.replace('id="img-desc"></div>','id="img-desc">'+imgDesc+'</div>');
  html=html.replace('>기사 본문<','>'+body+'<');
  return html;
}

// ── DOC ──
function renderDoc(html, url) {
  const p=url.searchParams.get('p'), info=url.searchParams.get('i'), b=url.searchParams.get('b'), t=url.searchParams.get('t2'), f=url.searchParams.get('f');
  if(p) {
    const pp=p.split('§');
    html=html.replace('>기관명<','>'+(pp[0]||'')+'<');
    html=html.replace('>문서 유형<','>'+(pp[1]||'')+'<');
    html=html.replace('>문서 제목<','>'+(pp[2]||'')+'<');
    if(pp[3]) html=html.replace('id="stamp"></span>','id="stamp">'+pp[3]+'</span>');
  }
  if(info) {
    let ih='';
    info.split('|').forEach(pair => { const [l,v]=pair.split(':'); ih+='<div class="doc-info-label">'+(l||'')+'</div><div class="doc-info-value">'+(v||'')+'</div>'; });
    html=html.replace('id="doc-info"></div>','id="doc-info">'+ih+'</div>');
  }
  if(b) html=html.replace('id="doc-body"></div>','id="doc-body">'+b+'</div>');
  if(t) {
    const rows=t.split('|');
    const headers=rows[0].split(':');
    let th='<table class="doc-table"><thead><tr>';
    headers.forEach(h => th+='<th>'+h+'</th>');
    th+='</tr></thead><tbody>';
    rows.slice(1).forEach(row => { th+='<tr>'; row.split(':').forEach(cell => th+='<td>'+cell+'</td>'); th+='</tr>'; });
    th+='</tbody></table>';
    html=html.replace('id="doc-body">','id="doc-body">'+th);
  }
  if(f) {
    const fp=f.split('§');
    html=html.replace('id="doc-footer"></div>','id="doc-footer">'+(fp[0]||'')+'</div>');
    if(fp[1]) html=html.replace('id="doc-seal"></div>','id="doc-seal">'+fp[1]+'</div>');
    else html=html.replace('id="doc-seal"></div>','id="doc-seal" style="display:none"></div>');
  }
  return html;
}

// ── BOARD ──
function renderBoard(html, url) {
  const b=url.searchParams.get('b'), tabs=url.searchParams.get('tabs'), p=url.searchParams.get('p');
  if(b) {
    const bp=b.split('§');
    html=html.replace('>게시판<','>'+(bp[0]||'게시판')+'<');
    if(bp[1]) html=html.replace('id="board-count"></span>','id="board-count">총 '+Number(bp[1]).toLocaleString()+'개</span>');
  }
  if(tabs) {
    let th='';
    tabs.split('|').forEach((t,i) => { th+='<div class="board-tab'+(i===0?' active':'')+'">'+t+'</div>'; });
    html=html.replace('id="board-tabs"></div>','id="board-tabs">'+th+'</div>');
  }
  if(p) {
    const tagMap={'notice':['공지','tag-notice'],'hot':['HOT','tag-hot'],'new':['NEW','tag-new'],'normal':['','tag-normal']};
    let lh='';
    p.split('|').forEach(raw => {
      const seg=raw.split('§');
      const tag=seg[0]||'normal',title=seg[1]||'',author=seg[2]||'',time=seg[3]||'',views=seg[4]||'0',votes=seg[5]||'0',comments=seg[6]||'';
      const [tagText,tagClass]=tagMap[tag]||[tag,'tag-normal'];
      lh+='<div class="board-item"><div class="board-item-left"><div class="board-item-title">'+(tagText?'<span class="board-item-tag '+tagClass+'">'+tagText+'</span>':'')+title+(comments?'<span class="board-item-comment">['+comments+']</span>':'')+'</div><div class="board-item-meta"><span>'+author+'</span><span>'+time+'</span><span>조회 '+Number(views).toLocaleString()+'</span></div></div><div class="board-item-right"><div class="board-item-votes">'+Number(votes).toLocaleString()+'</div><div class="board-item-vote-label">추천</div></div></div>';
    });
    html=html.replace('id="board-list"></div>','id="board-list">'+lh+'</div>');
  }
  return html;
}

// ── DISCORD ──
function renderDiscord(html, url) {
  const ch=url.searchParams.get('ch'), m=url.searchParams.get('m');
  if(ch) {
    const cp=ch.split('§');
    html=html.replace('>일반<','>'+(cp[0]||'일반')+'<');
    html=html.replace('id="input-placeholder">#일반에 메시지 보내기<','id="input-placeholder">#'+(cp[0]||'일반')+'에 메시지 보내기<');
    if(cp[1]) html=html.replace('id="channel-topic"></span>','id="channel-topic">'+cp[1]+'</span>');
  }
  if(m) {
    let mh='', lastAuthor='';
    m.split('|').forEach(raw => {
      const seg=raw.split('§');
      const nick=seg[0]||'',rColor=seg[1]||'',rTag=seg[2]||'',time=seg[3]||'',text=seg[4]||'',reactions=seg[5]||'';
      const color=roleColor(rColor);
      const isCont=nick===lastAuthor;
      lastAuthor=nick;
      let rh='';
      if(reactions) { rh='<div class="msg-reactions">'; reactions.split(' ').forEach(r=>{const emoji=r.replace(/[0-9]/g,'');const count=r.replace(/[^0-9]/g,'')||'1';rh+='<span class="reaction">'+emoji+'<span class="reaction-count">'+count+'</span></span>';}); rh+='</div>'; }
      if(isCont) {
        mh+='<div class="msg-cont"><div class="msg-text">'+text+'</div>'+rh+'</div>';
      } else {
        mh+='<div class="msg-group"><div class="msg-avatar" style="background:'+avatarBg(nick)+'">'+nick.charAt(0)+'</div><div class="msg-content"><div class="msg-header"><span class="msg-author" style="color:'+color+'">'+nick+'</span>'+(rTag?'<span class="msg-role-tag" style="background:'+color+'22;color:'+color+'">'+rTag+'</span>':'')+'<span class="msg-timestamp">'+time+'</span></div><div class="msg-text">'+text+'</div>'+rh+'</div></div>';
      }
    });
    html=html.replace('id="messages"></div>','id="messages">'+mh+'</div>');
  }
  return html;
}

// ── VOICE ── (복잡해서 기본 passthrough, 필요시 추가)
function renderVoice(html, url) {
  const s=url.searchParams.get('s'),tc=url.searchParams.get('tc'),v=url.searchParams.get('v'),active=url.searchParams.get('active');
  if(s){const sp=s.split('§');html=html.replace('>서버 이름<','>'+(sp[0]||'서버')+'<');if(sp[1]){html=html.replace('id="user-display">나<','id="user-display">'+sp[1]+'<');html=html.replace('id="user-avatar" style="background:#5865f2">나<','id="user-avatar" style="background:'+avatarBg(sp[1])+'">'+sp[1].charAt(0)+'<');}}
  let chHtml='';
  if(tc){chHtml+='<div class="category"><span class="category-arrow">▼</span> 채팅 채널</div>';tc.split('|').forEach((ch,i)=>{chHtml+='<div class="text-channel'+(i===0?' active':'')+'"><span class="ch-hash">#</span><span class="ch-name">'+ch+'</span></div>';});}
  if(v){chHtml+='<div class="category"><span class="category-arrow">▼</span> 음성 채널</div>';v.split(';').forEach(vcRaw=>{const [vcInfo,...rest]=vcRaw.split('§');const vcName=vcInfo||'음성';const membersRaw=rest.join('§');const members=[];if(membersRaw){membersRaw.split('|').forEach(mRaw=>{const mp=mRaw.split(':');members.push({name:mp[0]||'',color:mp[1]||'',status:mp[2]||'online',icons:mp[3]||''});});}const isActive=active&&vcName===active;chHtml+='<div class="voice-channel'+(isActive?' active-vc':'')+'"><span class="vc-icon">🔊</span><span class="vc-name">'+vcName+'</span>'+(members.length>0?'<span class="vc-count">'+members.length+'</span>':'')+'</div>';if(members.length>0){chHtml+='<div class="vc-members">';members.forEach(m=>{const color=roleColor(m.color);const statusClass='status-'+m.status;let iconsHtml='';if(m.icons){const iconMap={mute:'🔇',deaf:'🔇',stream:'🖥',video:'📷'};m.icons.split(' ').forEach(ic=>{const cls=(ic==='mute'||ic==='deaf')?' icon-muted':(ic==='stream'?' icon-streaming':' icon-video');iconsHtml+='<span class="'+cls+'">'+(iconMap[ic]||'')+'</span>';});}chHtml+='<div class="vc-member"><div class="vc-member-avatar" style="background:'+avatarBg(m.name)+'">'+m.name.charAt(0)+'<div class="vc-member-status '+statusClass+'"></div></div><span class="vc-member-name" style="color:'+color+'">'+m.name+'</span><div class="vc-member-icons">'+iconsHtml+'</div></div>';});chHtml+='</div>';}});}
  html=html.replace('id="channel-list"></div>','id="channel-list">'+chHtml+'</div>');
  if(active){html=html.replace('id="connected-bar" style="display:none"','id="connected-bar"');html=html.replace('id="connected-ch"></div>','id="connected-ch">🔊 '+active+'</div>');}
  return html;
}

// ── DISCORD-FULL ──
function renderDiscordFull(html, url) {
  const params = url.searchParams;
  const s  = params.get('s');
  const sv = params.get('sv');
  const tc = params.get('tc');
  const vc = params.get('vc');
  const ch = params.get('ch');
  const d  = params.get('d');
  const m  = params.get('m');

  const esc = (v) => String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const br = (v) => esc(v).replace(/\r?\n/g, '<br/>');

  const safeColor = (v, fallback) => {
    let c = String(v || '').trim();
    if (/^[0-9a-fA-F]{3,8}$/.test(c)) c = '#' + c;
    if (/^#[0-9a-fA-F]{3,8}$/.test(c)) return c;
    if (/^(rgb|rgba|hsl|hsla)\([0-9.,%\s]+\)$/.test(c)) return c;
    return fallback;
  };

  let serverName = '서버';
  let myName = '나';

  if (s) {
    const sp = s.split('§');
    serverName = sp[0] || '서버';
    myName = sp[1] || '나';
  }

  html = html.replace('id="server-name">서버<', 'id="server-name">' + esc(serverName) + '<');
  html = html.replace('id="user-name">나<', 'id="user-name">' + esc(myName) + '<');
  html = html.replace(
    'id="user-av" style="background:#5865f2">나<',
    'id="user-av" style="background:' + avatarBg(myName) + '">' + esc(myName.charAt(0) || '나') + '<'
  );

  if (sv) {
    let svh = '';
    sv.split('|').forEach((raw, i) => {
      const [abbrRaw, colorRaw] = raw.split(':');
      const abbr = abbrRaw || '';
      const bg = safeColor(colorRaw, avatarBg(abbr));
      svh += '<div class="server-icon' + (i === 0 ? ' active' : '') + '" style="background:' + bg + '">' +
        (i === 0 ? '<div class="indicator"></div>' : '') +
        esc(abbr) +
      '</div>';
    });
    html = html.replace('<div class="server-divider"></div>', '<div class="server-divider"></div>' + svh);
  }

  const activeChName = ch ? (ch.split('§')[0] || '일반') : (tc ? (tc.split('|')[0] || '일반') : '일반');

  let channelHtml = '';
  if (tc) {
    channelHtml += '<div class="category">▾ 채팅 채널</div>';
    tc.split('|').forEach(nameRaw => {
      const name = nameRaw || '';
      channelHtml += '<div class="ch-item' + (name === activeChName ? ' active' : '') + '">' +
        '<span class="ch-icon">#</span>' + esc(name) +
      '</div>';
    });
  }

  if (vc) {
    channelHtml += '<div class="category">▾ 음성 채널</div>';
    vc.split(';').forEach(vcRaw => {
      const parts = vcRaw.split('§');
      const vcName = parts[0] || '음성';
      const membersRaw = parts.slice(1).join('§');
      const members = membersRaw ? membersRaw.split('|').filter(Boolean) : [];

      channelHtml += '<div class="ch-item"><span class="ch-icon">🔊</span>' + esc(vcName) + '</div>';

      if (members.length > 0) {
        channelHtml += '<div class="vc-members-side">';
        members.forEach(name => {
          channelHtml += '<div class="vc-member-side">' +
            '<div class="vc-av-sm" style="background:' + avatarBg(name) + '">' + esc(name.charAt(0)) + '</div>' +
            esc(name) +
          '</div>';
        });
        channelHtml += '</div>';
      }
    });
  }
  html = html.replace('id="channels"></div>', 'id="channels">' + channelHtml + '</div>');

  if (activeChName) {
    html = html.replace('id="chat-ch-name">일반<', 'id="chat-ch-name">' + esc(activeChName) + '<');
    html = html.replace('id="input-ph">#일반에 메시지 보내기<', 'id="input-ph">#' + esc(activeChName) + '에 메시지 보내기<');
  }

  if (ch) {
    const cp = ch.split('§');
    const topic = cp.slice(1).join('§');
    if (topic) html = html.replace('id="chat-topic"></span>', 'id="chat-topic">' + esc(topic) + '</span>');
  }

  let msgHtml = '';
  if (d) {
    msgHtml += '<div class="date-divider"><span>' + esc(d) + '</span></div>';
  }

  if (m) {
    let lastAuthor = '';
    m.split('|').forEach(raw => {
      const seg = raw.split('§');
      const nick = seg[0] || '';
      const rColor = seg[1] || '';
      const time = seg[2] || '';
      const bodyText = seg.slice(3).join('§') || '';
      const isCont = nick === lastAuthor;
      lastAuthor = nick;

      if (isCont) {
        msgHtml += '<div class="msg-cont"><div class="msg-text">' + br(bodyText) + '</div></div>';
      } else {
        msgHtml += '<div class="msg-group">' +
          '<div class="msg-avatar" style="background:' + avatarBg(nick) + '">' + esc(nick.charAt(0)) + '</div>' +
          '<div class="msg-content">' +
            '<div class="msg-header">' +
              '<span class="msg-author" style="color:' + roleColor(rColor) + '">' + esc(nick) + '</span>' +
              '<span class="msg-time">' + esc(time) + '</span>' +
            '</div>' +
            '<div class="msg-text">' + br(bodyText) + '</div>' +
          '</div>' +
        '</div>';
      }
    });
  }

  html = html.replace('id="messages"></div>', 'id="messages">' + msgHtml + '</div>');
  return html;
}

// ── STREAM ──
function renderStream(html, url) {
  const p=url.searchParams.get('p'), c=url.searchParams.get('c');
  if(p){
    const pp=p.split('§');
    const streamer=pp[0]||'스트리머',title=pp[1]||'',viewers=pp[2]||'0',desc=pp[3]||'',tags=pp[4]||'';
    html=html.replace('>스트리머<','>'+streamer+'<');
    html=html.replace('id="streamer-avatar">S<','id="streamer-avatar">'+streamer.charAt(0)+'<');
    html=html.replace('>방송 제목<','>'+title+'<');
    html=html.replace('id="viewer-count">0<','id="viewer-count">'+Number(viewers).toLocaleString()+'<');
    if(desc) html=html.replace('>방송 화면<','>'+desc+'<');
    if(tags){let th='';tags.split(' ').forEach(t=>{th+='<span class="stream-tag">'+t+'</span>';});html=html.replace('id="stream-tags"></div>','id="stream-tags">'+th+'</div>');}
  }
  if(c){
    let ch='';
    c.split('|').forEach(raw=>{
      const seg=raw.split(':');
      if(seg[0]==='system'){ch+='<div class="chat-system">'+seg.slice(1).join(':')+'</div>';return;}
      const nick=seg[0]||'',color=seg[1]||'',text=seg.slice(2).join(':')||'';
      ch+='<div class="chat-msg"><span class="chat-nick" style="color:'+roleColor(color)+'">'+nick+'</span><span class="chat-text">'+text+'</span></div>';
    });
    html=html.replace('id="chat-messages"></div>','id="chat-messages">'+ch+'</div>');
  }
  return html;
}


// ── POST (게시판 글 상세) ──
function renderPost(html, url) {
  const p=url.searchParams.get('p'), c=url.searchParams.get('c');
  if(!p) return html;
  const parts=p.split('§');
  const board=parts[0]||'게시판',tag=parts[1]||'',title=parts[2]||'',author=parts[3]||'',time=parts[4]||'',views=parts[5]||'0',votes=parts[6]||'0',body=parts.slice(7).join('§')||'';
  html=html.replace('>게시판<','>'+board+'<');
  html=html.replace('>제목<','>'+title+'<');
  html=html.replace('>작성자<','>'+author+'<');
  html=html.replace('>시간<','>'+time+'<');
  html=html.replace('id="post-views">0<','id="post-views">'+Number(views).toLocaleString()+'<');
  html=html.replace('id="post-votes">0<','id="post-votes">'+Number(votes).toLocaleString()+'<');
  html=html.replace('>본문<','>'+body+'<');
  if(tag){const tagMap={'notice':['공지','tag-notice'],'hot':['HOT','tag-hot'],'new':['NEW','tag-new'],'normal':['','tag-normal']};const[tagText,tagClass]=tagMap[tag]||[tag,'tag-normal'];if(tagText)html=html.replace('id="post-tag"></div>','id="post-tag"><span class="post-tag '+tagClass+'">'+tagText+'</span></div>');}
  if(c){let ch='',count=0;c.split('|').forEach(raw=>{const isReply=raw.startsWith('>');const clean=isReply?raw.substring(1):raw;const seg=clean.split('§');const cNick=seg[0]||'',cTime=seg[1]||'',cBody=seg[2]||'',isOp=seg[3]==='op';ch+='<div class="comment'+(isReply?' reply':'')+'"><div class="comment-meta"><span class="comment-author">'+cNick+'</span>'+(isOp?'<span class="comment-op">글쓴이</span>':'')+'<span class="comment-time">'+cTime+'</span></div><div class="comment-body">'+cBody+'</div><div class="comment-actions"><span class="comment-like">♡ 좋아요</span><span>답글</span></div></div>';count++;});html=html.replace('id="comments-container"></div>','id="comments-container">'+ch+'</div>');html=html.replace('id="comment-count">0<','id="comment-count">'+count+'<');html=html.replace('id="comment-count2">0<','id="comment-count2">'+count+'<');}
  return html;
}

function renderLetter(html, url) {
  const p = url.searchParams.get('p');
  const b = url.searchParams.get('b');
  const ps = url.searchParams.get('ps');
  const w = url.searchParams.get('w');

  if (p) {
    const pp = p.split('§');
    const from = pp[0] || '';
    const to = pp[1] || '';
    const date = pp[2] || '';
    const closing = pp[3] || '마음을 담아';
    const stampLabel = pp[4] || 'LETTER';

    if (to) html = html.replace('>받는 사람<', '>' + to + '<');
    if (from) html = html.replace('>보내는 사람<', '>' + from + '<');
    if (date) html = html.replace('>2026. 01. 01.<', '>' + date + '<');
    if (closing) html = html.replace('>마음을 담아<', '>' + closing + '<');
    if (stampLabel) html = html.replace('>LETTER<', '>' + stampLabel + '<');
  }

  if (b) {
    html = html.replace('>편지 내용<', '>' + b + '<');
  }

  if (ps) {
    html = html.replace('id="letter-ps" style="display:none;">', 'id="letter-ps">' + ps);
  }

  if (w) {
    html = html.replace('>♥<', '>' + w + '<');
  }

  return html;
}

function renderMenu(html, url) {
  const p = url.searchParams.get('p');
  const s = url.searchParams.get('s');

  if (p) {
    const pp = p.split('§');
    if (pp[0]) html = html.replace('>가게 이름<', '>' + pp[0] + '<');
    if (pp[1]) html = html.replace('>MENU<', '>' + pp[1] + '<');
    if (pp[2]) html = html.replace('id="menu-notice"><', 'id="menu-notice">' + pp[2] + '<');
    if (pp[3]) html = html.replace('id="menu-hours"><', 'id="menu-hours">' + pp[3] + '<');
  }

  if (s) {
    let sectionsHtml = '';
    const categories = s.split(';;');

    categories.forEach(cat => {
      const items = cat.split('|');
      if (items.length === 0) return;

      const catParts = items[0].split('§');
      const catName = catParts[0] || '';
      const catIcon = catParts[1] || '';

      sectionsHtml += '<div class="menu-section"><div class="section-header"><div class="section-line"></div>';
      if (catIcon) sectionsHtml += '<span class="section-icon">' + catIcon + '</span>';
      sectionsHtml += '<span class="section-title">' + catName + '</span>';
      if (catIcon) sectionsHtml += '<span class="section-icon">' + catIcon + '</span>';
      sectionsHtml += '<div class="section-line"></div></div>';

      items.slice(1).forEach(raw => {
        const seg = raw.split('§');
        const name = seg[0] || '';
        const desc = seg[1] || '';
        const price = seg[2] || '';
        const badge = seg[3] || '';

        let badgeHtml = '';
        if (badge === 'best') badgeHtml = '<span class="item-badge badge-best">BEST</span>';
        else if (badge === 'new') badgeHtml = '<span class="item-badge badge-new">NEW</span>';
        else if (badge === 'hot') badgeHtml = '<span class="item-badge badge-hot">HOT</span>';

        sectionsHtml += '<div class="menu-item"><div class="item-info"><div class="item-name-row"><span class="item-name">' + name + '</span>' + badgeHtml + '</div>';
        if (desc) sectionsHtml += '<div class="item-desc">' + desc + '</div>';
        sectionsHtml += '</div>';
        if (price) sectionsHtml += '<div class="item-dots"></div><div class="item-price">' + price + '</div>';
        sectionsHtml += '</div>';
      });

      sectionsHtml += '</div>';
    });

    html = html.replace('id="menu-sections"></div>', 'id="menu-sections">' + sectionsHtml + '</div>');
  }

  return html;
}


// ── SHORTS (틱톡/릴스) ──
function shortsRep(html, token, val) {
  return html.split('\u27e6' + token + '\u27e7').join(val);
}
function shortsTag(text) {
  return (text || '').replace(/(#[^\s#<]+)/g, '<span class="tag">$1</span>');
}
function shortsMqWidth(s) {
  let w = 0;
  for (const ch of s) w += ch.charCodeAt(0) > 255 ? 12.5 : 7;
  return Math.max(Math.round(w + 14), 60); // ' · ' 포함 한 유닛 폭
}
function renderShorts(html, url) {
  const p = url.searchParams.get('p') || '';
  const s = url.searchParams.get('s') || 'tt';
  const b = url.searchParams.get('b') || '';
  const e = url.searchParams.get('e') || '';
  const c = url.searchParams.get('c') || '';

  const seg = p.split('§');
  const uid    = (seg[0] || 'winter').replace(/^@/, '');
  const cap    = seg[1] || '캡션을 입력하세요';
  const music  = seg[2] || '노래 제목';
  const likes  = seg[3] || '1.2만';
  const cmtn   = seg[4] || '328';
  const shares = seg[5] || '96';
  const bookn  = seg[6] || '541';

  // 스킨 전환
  if (s === 'reels') {
    html = html.replace('<div id="skin-tt">', '<div id="skin-tt" style="display:none">');
    html = html.replace('<div id="skin-rl" style="display:none">', '<div id="skin-rl">');
  }

  // 배경 이미지 / 이모지
  if (b) {
    html = html.replace('class="sh-bgimg" id="sh-bgimg" style="display:none"',
      'class="sh-bgimg" id="sh-bgimg" style="background-image:url(' + b.replace(/'/g, '') + ')"');
  } else if (e) {
    html = html.replace('class="sh-deco" id="sh-deco" style="display:none"', 'class="sh-deco" id="sh-deco"');
  }

  // 댓글 시트
  if (c) {
    html = html.replace('class="sh-app" id="sh-app"', 'class="sh-app cmt-open" id="sh-app"');
    const rows = c.split('|').map(raw => {
      const f = raw.split('§');
      const nick = f[0] || '익명';
      const txt  = f[1] || '';
      const lk   = f[2] || '';
      const initial = [...nick][0] || '?';
      return '<div class="sh-cmt">'
        + '<div class="sh-cava" style="background:' + avatarBg(nick) + '">' + initial + '</div>'
        + '<div class="sh-cbody"><div class="sh-cnick">' + nick + '</div>'
        + '<div class="sh-ctxt">' + txt + '</div>'
        + '<div class="sh-cmeta"><span>방금 전</span><span>답글 달기</span></div></div>'
        + '<div class="sh-clike">'
        + '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="14" viewBox="0 0 24 24" fill="none" stroke="#8a8b91" stroke-width="2"><path d="M12 21s-7.5-4.9-9.7-9.1C.7 8.7 2.6 5 6.2 5c2.1 0 3.5 1.1 4.3 2.4l1.5 2.3 1.5-2.3C14.3 6.1 15.7 5 17.8 5c3.6 0 5.5 3.7 3.9 6.9C19.5 16.1 12 21 12 21z"/></svg>'
        + (lk || '&#8203;') + '</div></div>';
    }).join('');
    html = shortsRep(html, 'CMTS', rows);
  } else {
    html = shortsRep(html, 'CMTS', '');
  }

  // marquee 폭·주기
  const mqw = shortsMqWidth(music + ' · ');
  const mqd = Math.max(Math.round(mqw / 25 * 10) / 10, 4);

  html = shortsRep(html, 'UID', uid);
  html = shortsRep(html, 'CAP', shortsTag(cap));
  html = shortsRep(html, 'MUSIC', music);
  html = shortsRep(html, 'LIKES', likes);
  html = shortsRep(html, 'CMTN', cmtn);
  html = shortsRep(html, 'SHARES', shares);
  html = shortsRep(html, 'BOOKN', bookn);
  html = shortsRep(html, 'AVA', [...uid][0] ? [...uid][0].toUpperCase() : 'W');
  html = shortsRep(html, 'MQW', String(mqw));
  html = shortsRep(html, 'MQD', String(mqd));
  if (e) html = shortsRep(html, 'EMO', e); else html = shortsRep(html, 'EMO', '');
  return html;
}

function renderDefault(html, url) { return html; }
// ── 🐦 트위터 타임라인 (tl) ──
function renderTimeline(html, url) {
  const hP = url.searchParams.get('h');
  const mP = url.searchParams.get('m');
  const fmtNum = v => { const n = Number(v); return isNaN(n) ? v : n.toLocaleString(); };
  const colors=['#5865f2','#FF6699','#57f287','#fee75c','#ed4245','#8889CD','#BB6688','#CCAA88','#3ba55c','#FF7722','#0077DD','#e8a44d','#9b84ec','#00BBDD'];
  const abg=name=>{let hh=7;let _i=0;for(const c of name){hh=(hh*31+c.charCodeAt(0)+_i*17)|0;_i++;}return colors[((hh%colors.length)+colors.length)%colors.length];};
  // 프로필 헤더 + 탭 (h= 있을 때만)
  if (hP) {
    const hp = hP.split('§');
    const hName = hp[0]||'', hCount = hp[1]||'', hTab = hp[2]||'게시물';
    html = html.replace('id="tl-header" style="display:none"','id="tl-header"');
    html = html.replace('id="tl-name"></span>','id="tl-name">'+hName+'</span>');
    if (hCount) html = html.replace('id="tl-count"></span>','id="tl-count">게시물 '+fmtNum(hCount)+'개</span>');
    let th='';
    ['게시물','답글','하이라이트','미디어'].forEach(t=>{ th+='<div class="tl-tab'+(t===hTab?' active':'')+'">'+t+'</div>'; });
    html = html.replace('id="tl-tabs" style="display:none"></div>','id="tl-tabs">'+th+'</div>');
  }
  const icoReply='<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>';
  const icoRT='<svg viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>';
  const icoLike='<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>';
  const icoViews='<svg viewBox="0 0 24 24"><line x1="4" y1="20" x2="4" y2="12"/><line x1="10" y1="20" x2="10" y2="6"/><line x1="16" y1="20" x2="16" y2="10"/><line x1="22" y1="20" x2="22" y2="4"/></svg>';
  const icoBm='<svg viewBox="0 0 24 24"><path d="M19 21l-7-4-7 4V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>';
  const icoShare='<svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>';
  const icoVerified='<svg class="verified" viewBox="0 0 24 24"><path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.9-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91C2.88 9.33 2 10.57 2 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.66 1.31 1.9 2.19 3.34 2.19s2.67-.88 3.33-2.19c1.4.46 2.91.2 3.92-.81s1.26-2.52.8-3.91C21.37 14.67 22.25 13.43 22.25 12zm-6.12-1.26l-4.5 4.5a.75.75 0 01-1.06 0l-2.25-2.25a.75.75 0 011.06-1.06l1.72 1.72 3.97-3.97a.75.75 0 011.06 1.06z"/></svg>';
  const icoLock='<svg class="lock-icon" viewBox="0 0 24 24"><path d="M17 9V7a5 5 0 00-10 0v2H5.5A1.5 1.5 0 004 10.5v9A1.5 1.5 0 005.5 21h13a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0018.5 9H17zm-8-2a3 3 0 016 0v2H9V7z"/></svg>';
  const icoCam='<svg viewBox="0 0 24 24"><path d="M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4z"/><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>';
  const items = (mP || '이름§@handle§방금§트윗 내용§0§0§0§0').split('|');
  let fh='';
  items.forEach(raw=>{
    const seg=raw.split('§');
    const iName=seg[0]||'', iHandle=seg[1]||'', iTime=seg[2]||'', iBody=seg[3]||'';
    // 5번째 필드부터 타입 감지: 숫자(답글·RT·좋아요·조회수 순), verified/lock/thread, rt:/re:/pic:/qt: (img:·= 병행 인식)
    let verified=false,lock=false,thread=false,rtBy='',reTo='',imgs=null,qt='';
    const nums=[];
    for(let s=4;s<seg.length;s++){
      const f=seg[s]||''; if(!f) continue;
      if(f==='verified') verified=true;
      else if(f==='lock') lock=true;
      else if(f==='thread') thread=true;
      else if(f.startsWith('rt:')||f.startsWith('rt=')) rtBy=f.slice(3);
      else if(f.startsWith('re:')||f.startsWith('re=')) reTo=f.slice(3);
      else if(f.startsWith('pic:')||f.startsWith('pic=')||f.startsWith('img:')||f.startsWith('img=')) imgs=f.slice(4).split(';');
      else if(f.startsWith('qt:')||f.startsWith('qt=')) qt=f.slice(3);
      else nums.push(f);
    }
    const numTxt=v=>(v&&v!=='0')?fmtNum(v):'';
    const nReply=numTxt(nums[0]),nRT=numTxt(nums[1]),nLike=numTxt(nums[2]),nViews=numTxt(nums[3]);
    let ih='<div class="tl-item-outer'+(thread?' threaded':'')+'">';
    if(rtBy) ih+='<div class="tl-repost">'+icoRT+rtBy+' 님이 재게시함</div>';
    ih+='<div class="tl-item"><div class="tl-avatar-col"><div class="tl-avatar" style="background:'+abg(iName)+'">'+iName.charAt(0)+'</div>'+(thread?'<div class="tl-thread-line"></div>':'')+'</div><div class="tl-content">';
    ih+='<div class="tl-item-header"><span class="tl-item-name">'+iName+'</span>'+(verified?icoVerified:'')+(lock?icoLock:'')+'<span class="tl-item-handle">'+iHandle+' · '+iTime+'</span><span class="tl-item-more">···</span></div>';
    if(reTo) ih+='<div class="tl-replying"><span class="mention">'+reTo+'</span> 님에게 보내는 답글</div>';
    ih+='<div class="tl-body">'+iBody+'</div>';
    if(imgs&&imgs.length){
      ih+='<div class="tl-img-grid'+(imgs.length===1?' single':'')+'">';
      imgs.slice(0,2).forEach(d=>{ ih+='<div class="tl-img">'+icoCam+'<div class="img-desc">'+d+'</div></div>'; });
      ih+='</div>';
    }
    if(qt){
      const qp=qt.split(';');
      const qName=qp[0]||'', qHandle=qp[1]||'';
      let qTime='', qBody='';
      if(qp.length>=4){ qTime=qp[2]; qBody=qp.slice(3).join(';'); } else { qBody=qp[2]||''; }
      ih+='<div class="tl-quote"><div class="tl-quote-header"><div class="tl-quote-avatar" style="background:'+abg(qName)+'">'+qName.charAt(0)+'</div><span class="tl-quote-name">'+qName+'</span><span class="tl-quote-handle">'+qHandle+(qTime?' · '+qTime:'')+'</span></div><div class="tl-quote-body">'+qBody+'</div></div>';
    }
    ih+='<div class="tl-actions">'
      +'<div class="action">'+icoReply+nReply+'</div>'
      +'<div class="action">'+icoRT+nRT+'</div>'
      +'<div class="action">'+icoLike+nLike+'</div>'
      +'<div class="action">'+icoViews+nViews+'</div>'
      +'<div class="action">'+icoBm+'</div>'
      +'<div class="action">'+icoShare+'</div>'
      +'</div></div></div></div>';
    fh+=ih;
  });
  html = html.replace('id="tl-feed"></div>','id="tl-feed">'+fh+'</div>');
  return html;
}


// ══════════════════════════════════════════════════════════
// 테마 시스템 (th= 파라미터) — 순수 추가, th 없으면 기존 출력과 100% 동일
//
// 공통 형식: th=색1§색2§색3  (# 없이 헥스 3/6자리, 뒤에서부터 생략 가능)
// · kakao/dm (말풍선형): th=배경§내말풍선§상대말풍선
//     단, 색 1개만 주면 → 내말풍선 = 그 색, 배경 = 자동 연화 (B규칙)
//     말풍선 글자색은 밝기 계산으로 검정/흰색 자동 선택
//     배경이 어두우면 이름·시간·헤더·인풋바 글자 자동 반전
// · lock/story (무드형): th=색1[§색2]
//     1색 → 명암 자동 그라데이션 / 2색 → 색1→색2 그라데이션
//     밝은 배경이면 시계·알림·UI 글자 자동 반전
// · letter: th=봉투색[§종이색] — 종이색은 글자 가독성 위해 밝기 자동 보정
// · menu: th=악센트[§보드색] — 보드색은 어두운 쪽으로 자동 보정
// ══════════════════════════════════════════════════════════

function themeParse(url) {
  const th = url.searchParams.get('th');
  if (!th) return null;
  const parts = th.split('§').map(s => {
    s = (s || '').trim().replace(/^#/, '');
    if (/^[0-9a-fA-F]{3}$/.test(s)) s = s.split('').map(c => c + c).join('');
    return /^[0-9a-fA-F]{6}$/.test(s) ? '#' + s.toLowerCase() : null;
  });
  return parts[0] ? parts : null; // 첫 색이 유효하지 않으면 테마 미적용
}

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

// 첫 </style> 직전에 오버라이드 블록 삽입 — 기존 CSS는 건드리지 않음
function themeInject(html, css) {
  return html.replace('</style>', '\n/* ── th 테마 오버라이드 ── */\n' + css + '</style>');
}

// ── 말풍선형 공통 (kakao / dm) ──
function themeBubbleCSS(t, bgSel, darkUI) {
  let bg, me, other = null;
  if (!t[1]) { // 1색 = 내 말풍선 + 배경 자동 연화
    me = t[0];
    bg = themeMix(t[0], '#ffffff', 0.55);
  } else {
    bg = t[0]; me = t[1]; other = t[2] || null;
  }
  let css = bgSel + ' { background: ' + bg + ' !important; }\n';
  css += '.msg-row.me .bubble { background: ' + me + ' !important; color: ' + themeText(me) + ' !important; }\n';
  css += '.send-btn { background: ' + me + ' !important; }\n';
  if (other) {
    css += '.msg-row.other .bubble { background: ' + other + ' !important; color: ' + themeText(other) + ' !important; }\n';
  }
  if (themeLum(bg) <= 150) css += darkUI(bg);
  return css;
}

function themeKakao(html, url) {
  const t = themeParse(url);
  if (!t) return html;
  const css = themeBubbleCSS(t, 'body, .chat-wrap', function (bg) {
    const bar = themeMix(bg, '#ffffff', 0.08);
    const field = themeMix(bg, '#ffffff', 0.16);
    return '.chat-title, .back-btn { color: #ececf2 !important; }\n'
      + '.header-actions svg { stroke: #ececf2 !important; }\n'
      + '.chat-header { background: rgba(255,255,255,0.06) !important; }\n'
      + '.member-count, .msg-name, .msg-time, .date-divider { color: rgba(255,255,255,0.55) !important; }\n'
      + '.input-bar { background: ' + bar + ' !important; border-top-color: rgba(255,255,255,0.08) !important; }\n'
      + '.input-field { background: ' + field + ' !important; color: #ececf2 !important; }\n'
      + '.input-btn { color: rgba(255,255,255,0.6) !important; }\n';
  });
  return themeInject(html, css);
}

function themeDm(html, url) {
  const t = themeParse(url);
  if (!t) return html;
  const css = themeBubbleCSS(t, 'body, .chat-wrap, .chat-header', function (bg) {
    const bar = themeMix(bg, '#ffffff', 0.08);
    const field = themeMix(bg, '#ffffff', 0.16);
    return '.header-username, .back-btn { color: #ececf2 !important; }\n'
      + '.header-actions svg { stroke: #ececf2 !important; }\n'
      + '.chat-header { border-bottom-color: rgba(255,255,255,0.1) !important; }\n'
      + '.header-status, .msg-name, .msg-time, .seen-label { color: rgba(255,255,255,0.55) !important; }\n'
      + '.msg-row.other .bubble { background: ' + themeMix(bg, '#ffffff', 0.14) + ' !important; color: #ececf2 !important; }\n'
      + '.input-bar { background: ' + bar + ' !important; border-top-color: rgba(255,255,255,0.08) !important; }\n'
      + '.input-field { background: ' + field + ' !important; color: #ececf2 !important; }\n';
  });
  return themeInject(html, css);
}

function themeLock(html, url) {
  const t = themeParse(url);
  if (!t) return html;
  const c1 = t[0], c2 = t[1] || null;
  let grad, avgLum;
  if (c2) {
    grad = 'linear-gradient(180deg, ' + c1 + ' 0%, ' + c2 + ' 100%)';
    avgLum = (themeLum(c1) + themeLum(c2)) / 2;
  } else { // 1색 → 명암 3단 자동 그라데이션 (기존 잠금화면 무드 유지)
    const top = themeMix(c1, '#000000', 0.45);
    const mid = themeMix(c1, '#000000', 0.25);
    const bot = themeMix(c1, '#000000', 0.55);
    grad = 'linear-gradient(180deg, ' + top + ' 0%, ' + mid + ' 40%, ' + bot + ' 100%)';
    avgLum = themeLum(mid);
  }
  let css = 'body { background: ' + themeMix(c1, '#000000', 0.7) + ' !important; }\n'
    + '.phone { background: ' + grad + ' !important; }\n';
  if (avgLum > 150) { // 밝은 배경 → 글자·알림 카드 반전
    css += '.status-bar, .lock-time, .notif-title { color: #1a1a1a !important; }\n'
      + '.lock-date { color: rgba(0,0,0,0.65) !important; }\n'
      + '.notif { background: rgba(0,0,0,0.06) !important; }\n'
      + '.notif-app { color: rgba(0,0,0,0.85) !important; }\n'
      + '.notif-time { color: rgba(0,0,0,0.45) !important; }\n'
      + '.notif-body { color: rgba(0,0,0,0.6) !important; }\n'
      + '.bottom-btn { background: rgba(0,0,0,0.08) !important; }\n';
  }
  return themeInject(html, css);
}

function themeStory(html, url) {
  const t = themeParse(url);
  if (!t) return html;
  const c1 = t[0];
  const c2 = t[1] || themeMix(t[0], '#000000', 0.45); // 1색 → 은은한 명암 그라데이션
  const grad = 'linear-gradient(160deg, ' + c1 + ' 0%, ' + c2 + ' 100%)';
  const avgLum = (themeLum(c1) + themeLum(c2)) / 2;
  let css = '.story { background: ' + grad + ' !important; }\n';
  if (avgLum > 150) { // 밝은 배경 → 상단 UI 반전
    css += '.story-user, .story-close { color: #1a1a1a !important; }\n'
      + '.story-time { color: rgba(0,0,0,0.55) !important; }\n'
      + '.progress-bar { background: rgba(0,0,0,0.2) !important; }\n'
      + '.progress-fill { background: #1a1a1a !important; }\n'
      + '.story-image svg { fill: rgba(0,0,0,0.35) !important; }\n'
      + '.story-image-desc { color: rgba(0,0,0,0.5) !important; }\n'
      + '.story-avatar-inner { border-color: rgba(0,0,0,0.15) !important; }\n';
  }
  return themeInject(html, css);
}

function themeLetter(html, url) {
  const t = themeParse(url);
  if (!t) return html;
  const env = t[0]; // 봉투색
  let css = 'body { background: ' + themeMix(env, '#ffffff', 0.55) + ' !important; }\n'
    + '.envelope-flap { background: linear-gradient(135deg, ' + env + ', ' + themeMix(env, '#000000', 0.12) + ') !important; }\n'
    + '.envelope-bottom { background: linear-gradient(180deg, ' + env + ', ' + themeMix(env, '#000000', 0.2) + ') !important; }\n';
  if (t[1]) { // 종이색 — 어두우면 글자(고정 갈색톤)가 안 보이므로 밝기 자동 보정
    const paper = themeLum(t[1]) < 160 ? themeMix(t[1], '#ffffff', 0.78) : t[1];
    css += '.letter { background: ' + paper + ' !important; }\n';
  }
  return themeInject(html, css);
}

function themeMenu(html, url) {
  const t = themeParse(url);
  if (!t) return html;
  const accent = t[0];
  // 보드는 밝은 글자 고정이라 어두운 쪽으로 자동 보정
  let board = t[1] || themeMix(accent, '#000000', 0.82);
  if (themeLum(board) > 120) board = themeMix(board, '#000000', 0.72);
  let css = 'body { background: ' + themeMix(accent, '#ffffff', 0.55) + ' !important; }\n'
    + '.menu { background: ' + board + ' !important; }\n'
    + ':root { --col-rose: ' + accent + '; --col-indigo: ' + themeMix(accent, '#ffffff', 0.25) + '; }\n';
  return themeInject(html, css);
}


// · shorts (배경 그라데이션형): th=프리셋명 또는 th=색1[§색2]
//     프리셋: indigo(기본)·rose·sand·pink·night·dawn / 1색 → 어두운 쪽 자동 생성
const SHORTS_PRESETS = {
  'indigo': ['#2a2440', '#16121f'],
  'rose':   ['#40242f', '#1f1216'],
  'sand':   ['#3d3222', '#1c1710'],
  'pink':   ['#3f2a3a', '#1d141b'],
  'night':  ['#101014', '#000000'],
  'dawn':   ['#1b2a40', '#0e1420'],
};
function themeShorts(html, url) {
  const raw = url.searchParams.get('th');
  if (!raw) return html;
  let c1, c2;
  const preset = SHORTS_PRESETS[raw.trim().toLowerCase()];
  if (preset) { c1 = preset[0]; c2 = preset[1]; }
  else {
    const t = themeParse(url);
    if (!t) return html;
    c1 = t[0];
    c2 = t[1] || themeMix(t[0], '#000000', 0.68);
  }
  const mid = themeMix(c1, c2, 0.5);
  const css = '.sh-app { background: linear-gradient(160deg, ' + c1 + ' 0%, ' + c2 + ' 55%, ' + mid + ' 100%) !important; }\n';
  return themeInject(html, css);
}


// ── 💘 MATCH (데이팅앱) ──
function matchRep(html, token, val) {
  return html.split('\u27e6' + token + '\u27e7').join(val);
}
function matchClean(html) {
  // 비활성 스킨에 남은 토큰 일괄 제거
  return html.replace(/\u27e6[A-Z0-9]+\u27e7/g, '');
}
function matchChips(csv, cls, hlFirst) {
  return (csv || '').split(',').map(function (t, i) {
    return t.trim();
  }).filter(Boolean).map(function (t, i) {
    var h = (hlFirst && i === 0) ? ' hl' : '';
    return '<div class="' + cls + h + '">' + t + '</div>';
  }).join('');
}
function matchBars(n) {
  n = Math.max(Math.min(parseInt(n, 10) || 3, 8), 1);
  var gap = 5, total = 338;
  var segw = Math.floor((total - gap * (n - 1)) / n);
  var out = '', x = 0;
  for (var i = 0; i < n; i++) {
    out += '<rect x="' + x + '" y="0" width="' + segw + '" height="3" rx="1.5" fill="rgba(255,255,255,.32)"/>';
    x += segw + gap;
  }
  out += '<rect x="0" y="0" width="0" height="3" rx="1.5" fill="#ffffff">'
    + '<animate attributeName="width" values="0;' + segw + '" dur="6s" repeatCount="indefinite"/></rect>';
  return out;
}
function renderMatch(html, url) {
  var s = url.searchParams.get('s') || 'card';
  var p = url.searchParams.get('p') || '';
  var b = url.searchParams.get('b') || '';
  var e = url.searchParams.get('e') || '';
  var seg = p.split('\u00a7');

  if (s === 'match') {
    html = html.replace('<div id="ma-card">', '<div id="ma-card" style="display:none">');
    html = html.replace('<div id="ma-match" style="display:none">', '<div id="ma-match">');
  } else if (s === 'profile') {
    html = html.replace('<div id="ma-card">', '<div id="ma-card" style="display:none">');
    html = html.replace('<div id="ma-profile" style="display:none">', '<div id="ma-profile">');
    html = html.replace('<div class="ma-app fx" id="ma-app">', '<div class="ma-app" id="ma-app">');
  }

  if (s === 'match') {
    // p=이름1§이름2§이모지1§이모지2§부제 / b1= b2= 아바타 이미지
    var n1 = seg[0] || '겨울';
    var n2 = seg[1] || '지수';
    var e1 = seg[2] || '\u2764\ufe0f';
    var e2 = seg[3] || '\ud83c\udf38';
    var sub = seg[4] || (n1 + '\ub2d8\uacfc ' + n2 + '\ub2d8\uc774 \uc11c\ub85c \uc88b\uc544\ud569\ub2c8\ub2e4 \ud83d\udc97');
    var b1 = (url.searchParams.get('b1') || '').replace(/'/g, '');
    var b2 = (url.searchParams.get('b2') || '').replace(/'/g, '');
    html = matchRep(html, 'N1', n1);
    html = matchRep(html, 'N2', n2);
    html = matchRep(html, 'SUB', sub);
    html = matchRep(html, 'E1', b1 ? '' : e1);
    html = matchRep(html, 'E2', b2 ? '' : e2);
    html = matchRep(html, 'AC1', b1 ? ' img' : '');
    html = matchRep(html, 'AC2', b2 ? ' img' : '');
    html = matchRep(html, 'AV1S', b1 ? 'background-image:url(' + b1 + ')' : '');
    html = matchRep(html, 'AV2S', b2 ? 'background-image:url(' + b2 + ')' : '');
    html = matchRep(html, 'AE1S', b1 ? 'display:none' : '');
    html = matchRep(html, 'AE2S', b2 ? 'display:none' : '');
    return matchClean(html);
  }

  if (s === 'profile') {
    // p=이름§나이§거리§직업§학교§소개§태그들§라이프들 (빈 필드는 해당 줄/섹션 생략)
    var name = seg[0] || '\uc9c0\uc218';
    var age = seg[1] || '24';
    var dist = seg[2] || '';
    var job = seg[3] || '';
    var sch = seg[4] || '';
    var intro = seg[5] || '';
    var tags = seg[6] || '';
    var life = seg[7] || '';
    var rows = '';
    if (job) rows += '<div class="row"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#CCAA88" stroke-width="2.2"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>' + job + '</div>';
    if (sch) rows += '<div class="row"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8889CD" stroke-width="2.2"><path d="M12 3L2 8l10 5 10-5-10-5z"/><path d="M6 10v6c0 1 2.7 3 6 3s6-2 6-3v-6"/></svg>' + sch + '</div>';
    if (dist) rows += '<div class="row"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#DDAACC" stroke-width="2.2"><path d="M12 21s-7-6.1-7-11a7 7 0 1114 0c0 4.9-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>' + dist + '</div>';
    var secs = '';
    if (intro) secs += '<div class="mp-sec"><h4>\uc18c\uac1c</h4><div class="mp-intro">' + intro + '</div></div>';
    if (tags) secs += '<div class="mp-sec"><h4>\uad00\uc2ec\uc0ac</h4><div class="mp-tags">' + matchChips(tags, 'mp-tag', false) + '</div></div>';
    if (life) secs += '<div class="mp-sec"><h4>\ub77c\uc774\ud504\uc2a4\ud0c0\uc77c</h4><div class="mp-life">' + matchChips(life, 'mp-lf', false) + '</div></div>';
    html = matchRep(html, 'NAME', name);
    html = matchRep(html, 'AGE', age);
    html = matchRep(html, 'ROWS', rows);
    html = matchRep(html, 'SECS', secs);
    if (b) {
      html = html.replace('class="ma-bgimg" id="mp-bgimg" style="display:none"',
        'class="ma-bgimg" id="mp-bgimg" style="background-image:url(' + b.replace(/'/g, '') + ')"');
      html = matchRep(html, 'EMO', '');
    } else if (e) {
      html = html.replace('class="ma-deco" id="mp-deco" style="display:none"', 'class="ma-deco" id="mp-deco"');
      html = matchRep(html, 'EMO', e);
    } else {
      html = matchRep(html, 'EMO', '');
    }
    return matchClean(html);
  }

  // ── card (기본) ──
  // p=이름§나이§거리§소개§태그들§사진수
  var cName = seg[0] || '\uc9c0\uc218';
  var cAge = seg[1] || '24';
  var cDist = seg[2] || '3km \uac70\ub9ac \u00b7 \uc9c0\uae08 \ud65c\ub3d9 \uc911';
  var cBio = seg[3] || '\uc8fc\ub9d0\uc5d4 \uce74\ud398\uc5d0\uc11c \ucc45 \uc77d\ub294 \uac8c \ub099\uc774\uc5d0\uc694 \u2615';
  var cTags = seg[4] || '\ud83d\udcda \ub3c5\uc11c,\u2615 \uce74\ud398\ud22c\uc5b4,\ud83c\udfa8 \uc804\uc2dc\ud68c';
  var cPh = seg[5] || '3';
  html = matchRep(html, 'NAME', cName);
  html = matchRep(html, 'AGE', cAge);
  html = matchRep(html, 'DIST', cDist);
  html = matchRep(html, 'BIO', cBio);
  html = matchRep(html, 'TAGS', matchChips(cTags, 'mc-tag', true));
  html = matchRep(html, 'BARS', matchBars(cPh));
  if (b) {
    html = html.replace('class="ma-bgimg" id="mc-bgimg" style="display:none"',
      'class="ma-bgimg" id="mc-bgimg" style="background-image:url(' + b.replace(/'/g, '') + ')"');
    html = matchRep(html, 'EMO', '');
  } else if (e) {
    html = html.replace('class="ma-deco" id="mc-deco" style="display:none"', 'class="ma-deco" id="mc-deco"');
    html = matchRep(html, 'EMO', e);
  } else {
    html = matchRep(html, 'EMO', '');
  }
  return matchClean(html);
}

// · match: th=프리셋명 또는 th=색1[§색2] — 카드/프로필 사진 그라데 + 매치 배경 틴트
const MATCH_PRESETS = {
  'indigo': ['#8889CD', '#BB6688'],
  'rose':   ['#BB6688', '#884499'],
  'sand':   ['#CCAA88', '#BB6688'],
  'pink':   ['#DDAACC', '#FF6699'],
  'night':  ['#3a3a55', '#16121f'],
  'dawn':   ['#1b2a40', '#8889CD'],
};
function themeMatch(html, url) {
  const raw = url.searchParams.get('th');
  if (!raw) return html;
  let c1, c2;
  const preset = MATCH_PRESETS[raw.trim().toLowerCase()];
  if (preset) { c1 = preset[0]; c2 = preset[1]; }
  else {
    const t = themeParse(url);
    if (!t) return html;
    c1 = t[0];
    c2 = t[1] || themeMix(t[0], '#000000', 0.55);
  }
  const mid = themeMix(c1, c2, 0.5);
  const deep = themeMix(c2, '#000000', 0.72);
  const css = '.mc-card { background: linear-gradient(160deg, ' + c1 + ' 0%, ' + mid + ' 45%, ' + c2 + ' 100%) !important; }\n'
    + '.mp-photo { background: linear-gradient(160deg, ' + c1 + ' 0%, ' + mid + ' 60%, ' + c2 + ' 100%) !important; }\n'
    + '.mm-bg { background: radial-gradient(circle at 50% 30%, ' + themeMix(c1, '#000000', 0.45) + ' 0%, ' + deep + ' 60%, #100c18 100%) !important; }\n';
  return themeInject(html, css);
}


// ── 📖 WIKI (위키위키 문서) ──
function wikiRep(html, token, val) {
  return html.split('\u27e6' + token + '\u27e7').join(val);
}
function wikiFmt(text) {
  return (text || '')
    .replace(/\[\[([^\]]+)\]\]/g, '<a>$1</a>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
    .replace(/\[(\d+)\]/g, '<sup>[$1]</sup>')
    .split('//').join('<br/>');
}
function renderWiki(html, url) {
  var p = url.searchParams.get('p') || '';
  var iP = url.searchParams.get('i') || '';
  var sP = url.searchParams.get('s') || '';
  var qP = url.searchParams.get('q') || '';
  var fP = url.searchParams.get('f') || '';
  var b = url.searchParams.get('b') || '';
  var e = url.searchParams.get('e') || '';

  var seg = p.split('\u00a7');
  var title = seg[0] || '\ubb38\uc11c \uc81c\ubaa9';
  var cats = seg[1] || '';
  var last = seg[2] || '';

  html = wikiRep(html, 'TITLE', title);

  // 분류
  if (cats) {
    var catLinks = cats.split(',').map(function (c) { return '<a>' + c.trim() + '</a>'; }).join(' \u00b7 ');
    html = wikiRep(html, 'CATS', '<div class="wk-cats">\ubd84\ub958: ' + catLinks + '</div>');
  } else {
    html = wikiRep(html, 'CATS', '');
  }

  // 인포박스
  var info = '';
  if (iP || b || e) {
    info = '<div class="wk-info">';
    if (b) info += '<div class="wk-info-img" style="background-image:url(' + b.replace(/'/g, '') + ')"></div>';
    else if (e) info += '<div class="wk-info-img">' + e + '</div>';
    info += '<div class="wk-info-name">' + title + '</div>';
    if (iP) {
      iP.split('|').forEach(function (row) {
        var f2 = row.split('\u00a7');
        var lab = f2[0] || '';
        var val = f2[1] || '';
        if (!lab) return;
        info += '<div class="wk-irow"><div class="wk-ilab">' + lab + '</div><div class="wk-ival">' + wikiFmt(val) + '</div></div>';
      });
    }
    info += '</div>';
  }
  html = wikiRep(html, 'INFO', info);

  // 섹션 + 목차
  var toc = '', secs = '';
  if (sP) {
    var items = sP.split('|');
    var tocLinks = '';
    items.forEach(function (raw, idx) {
      var f3 = raw.split('\u00a7');
      var sName = f3[0] || (idx + 1) + '\ubc88 \uc139\uc158';
      var sBody = f3[1] || '';
      var n = idx + 1;
      tocLinks += '<a><span class="n">' + n + '.</span>' + sName + '</a>';
      secs += '<div class="wk-sec"><div class="wk-h2"><span class="n">' + n + '.</span>' + sName + '</div>'
        + '<div class="wk-p">' + wikiFmt(sBody) + '</div>';
      if (idx === 0 && qP) {
        secs += '<div class="wk-quote">"' + qP + '"</div>';
      }
      secs += '</div>';
    });
    toc = '<div class="wk-toc"><div class="wk-toc-t">\ubaa9\ucc28</div>' + tocLinks + '</div>';
  }
  html = wikiRep(html, 'TOC', toc);
  html = wikiRep(html, 'SECS', secs);

  // 각주
  if (fP) {
    var foot = '<div class="wk-foot">';
    fP.split('|').forEach(function (fn, idx) {
      foot += '<div><span class="fn">[' + (idx + 1) + ']</span>' + wikiFmt(fn) + '</div>';
    });
    foot += '</div>';
    html = wikiRep(html, 'FOOT', foot);
  } else {
    html = wikiRep(html, 'FOOT', '');
  }

  // 최근 수정 시각
  html = wikiRep(html, 'LAST', last ? '<div class="wk-last">\ucd5c\uadfc \uc218\uc815 \uc2dc\uac01: ' + last + '</div>' : '');
  return html;
}

// · wiki: th=wiki(기본 라이트)/dark 또는 th=악센트헥스 / th=dark§악센트헥스
function themeWiki(html, url) {
  var raw = (url.searchParams.get('th') || '').trim();
  if (!raw || raw.toLowerCase() === 'wiki') return html;
  var parts = raw.split('\u00a7');
  var dark = parts[0].toLowerCase() === 'dark';
  var accRaw = dark ? parts[1] : parts[0];
  var acc = '';
  if (accRaw) {
    var hx = accRaw.replace('#', '').trim();
    if (/^[0-9a-fA-F]{6}$/.test(hx)) acc = '#' + hx;
  }
  var css = '';
  if (dark) {
    // wrapper 배경은 body 규칙 첫 매치를 긁어가므로 직접 치환
    html = html.replace('body { background:#ffffff;', 'body { background:#1b1b22;');
    css += '.wk-app { --wk-bg:#1b1b22; --wk-fg:#e3e0ea; --wk-sub:#9a96a8; --wk-line:#3a3844;'
      + ' --wk-accent:' + (acc || '#8889CD') + '; --wk-top:#2c2b38; --wk-box:#24232d; --wk-boxline:#3a3844; }\n';
  } else if (acc) {
    css += '.wk-app { --wk-accent:' + acc + '; --wk-top:' + acc + '; }\n';
  }
  return css ? themeInject(html, css) : html;
}

// th= 지원 타입 매핑 (renderer 통과 후 적용)
const THEME_RENDERERS = {
  'kakao': themeKakao, 'dm': themeDm, 'lock': themeLock,
  'story': themeStory, 'letter': themeLetter, 'menu': themeMenu,
  'shorts': themeShorts,
  'match': themeMatch,
  'wiki': themeWiki,
};

const RENDERERS = {
  'insta': renderInsta, 'twitter': renderTwitter, 'kakao': renderKakao,
  'reddit': renderReddit, 'lock': renderLock, 'email': renderEmail,
  'story': renderStory, 'search': renderSearch, 'news': renderNews,
  'doc': renderDoc, 'board': renderBoard, 'discord': renderDiscord,
  'voice': renderVoice, 'discord-full': renderDiscordFull, 'stream': renderStream, 'post': renderPost,
  'letter': renderLetter, 'menu': renderMenu, 'dm': renderDm,
  'tl': renderTimeline,
  'shorts': renderShorts,
  'match': renderMatch,
  'wiki': renderWiki,
};


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
        + '<h1 style="color:#8889CD;">겨울의 SNS UI v13</h1>'
        + '<p>사용 가능한 타입 (' + Object.keys(TEMPLATES).length + '종):</p><ul>' + links + '</ul>'
        + '</body></html>',
        { headers: { 'content-type': 'text/html;charset=UTF-8' } }
      );
    }
    let html = TEMPLATES[t];
    if (html) {
      const renderer = RENDERERS[t] || renderDefault;
      html = renderer(html, url);
      if (THEME_RENDERERS[t]) html = THEME_RENDERERS[t](html, url); // th= 테마 (없으면 no-op)
      let [w, h] = SIZES[t] || [600, 700];

      // ══════════════════════════════════════════════════════════
      // 동적 높이 계산 v3 — 줄별 계산 + body padding 반영 + footer 보강
      // ══════════════════════════════════════════════════════════
      const MAX_H = 1800;
      const MARGIN = 20; // 안전 여유 마진 (잘림 방지, v2보다 축소)

      // 텍스트 줄 수 계산 — 줄바꿈 기준으로 각 줄 개별 계산 (이중 계산 방지)
      function calcLines(text, containerPx) {
        if (!text) return 0;
        const lines = text.split('\n');
        let total = 0;
        for (const line of lines) {
          if (line.length === 0) { total += 1; continue; } // 빈 줄도 1줄
          let cjk = 0, ascii = 0;
          for (const ch of line) { ch.charCodeAt(0) > 0x7F ? cjk++ : ascii++; }
          const estWidth = cjk * 13 + ascii * 7.5;
          total += Math.max(Math.ceil(estWidth / containerPx), 1);
        }
        return total;
      }

      // ── 🔒 고정 높이 ──
      if (t === 'kakao') { h = 900; }
      if (t === 'dm') { h = 900; }
      if (t === 'lock')  { h = 844; }
      if (t === 'stream') { h = 900; }
      if (t === 'discord') { h = 900; }
      if (t === 'discord-full') { h = 900; }
      if (t === 'voice') { h = 900; }
      if (t === 'shorts') { h = 693; }
      if (t === 'match') {
        const sM = url.searchParams.get('s') || 'card';
        if (sM === 'profile') {
          const pM = url.searchParams.get('p') || '';
          const gM = pM.split('§');
          const distM = gM[2] || '', jobM = gM[3] || '', schM = gM[4] || '';
          const introM = gM[5] || '', tagsM = gM[6] || '', lifeM = gM[7] || '';
          // 칩 줄 수 추정 (그리디 랩, 컨테이너 350px)
          function matchChipRows(csv, padPer) {
            const items = csv.split(',').map(x => x.trim()).filter(Boolean);
            if (!items.length) return 0;
            let rows = 1, x = 0;
            for (const it of items) {
              let w = padPer;
              for (const ch of it) w += ch.charCodeAt(0) > 0x7F ? 13 : 7.2;
              if (x > 0 && x + w > 350) { rows++; x = w + 7; } else { x += w + 7; }
            }
            return rows;
          }
          let base = 340 - 34 + 38; // 사진 + 겹침 + 이름줄
          let rowsN = (jobM ? 1 : 0) + (schM ? 1 : 0) + (distM ? 1 : 0);
          if (rowsN) base += 6 + rowsN * 19;
          if (introM) base += 20 + 24 + calcLines(introM, 350) * 23;
          if (tagsM) base += 20 + 24 + matchChipRows(tagsM, 33) * 36;
          if (lifeM) base += 20 + 24 + matchChipRows(lifeM, 31) * 42;
          base += 24 + 62 + 26; // 액션 + 하단 패딩
          h = base + MARGIN;
          h = Math.max(h, 560); h = Math.min(h, MAX_H);
        } else { h = 693; }
      }
      if (t === 'wiki') {
        const pW = url.searchParams.get('p') || '';
        const iW = url.searchParams.get('i') || '';
        const sW = url.searchParams.get('s') || '';
        const qW = url.searchParams.get('q') || '';
        const fW = url.searchParams.get('f') || '';
        const bW = url.searchParams.get('b') || '';
        const eW = url.searchParams.get('e') || '';
        const gW = pW.split('§');
        const stripW = x => x.replace(/\[\[|\]\]|~~/g, '');
        let base = 44 + 14 + 24; // 상단바 + body 패딩
        base += 42; // 제목줄
        if (gW[1]) base += calcLines('분류: ' + gW[1], 358) * 19 + 8;
        if (iW || bW || eW) {
          base += 14 + 2; // margin + border
          if (bW || eW) base += 150;
          base += 37; // 이름 칸
          if (iW) iW.split('|').forEach(row => {
            const v = row.split('§')[1] || '';
            const brN = v.split('//').length;
            base += Math.max(calcLines(stripW(v).split('//').join(' '), 250), brN) * 19 + 15;
          });
        }
        if (sW) {
          const items = sW.split('|');
          base += 16 + 24 + items.length * 19 + 22; // 목차 박스
          items.forEach((raw, idx) => {
            const f3 = raw.split('§');
            base += 22 + 41; // 섹션 margin + h2
            base += Math.max(calcLines(stripW(f3[1] || ''), 358), 1) * 22;
            if (idx === 0 && qW) base += 28 + calcLines(qW, 330) * 20;
          });
        }
        if (fW) {
          base += 26 + 11;
          fW.split('|').forEach(fn => { base += Math.max(calcLines(stripW(fn), 340), 1) * 18 + 4; });
        }
        if (gW[2]) base += 36;
        h = base + MARGIN + 14; // 하단 여유 소폭 보강
        h = Math.max(h, 300); h = Math.min(h, MAX_H);
      }
      // story: SIZES 기본값 420×900 그대로

      // ── 📸 INSTA ──
      // body: padding 20px 0 → 상하 40px 추가
      // 구조: header(58) + image(4:3=352) + actions(40) + likes(26)
      //       + caption + translation? + hashtags? + comments-link(24) + comments + time(32)
      // max-width 470, 텍스트 padding 16 양쪽 → ~438px
      if (t === 'insta') {
        const c = url.searchParams.get('c') || '';
        const p = url.searchParams.get('p') || '';
        const parts = p.split('§');
        const caption = parts[5] || '';
        const hasTranslation = parts[6] && parts[6].startsWith('[');
        const hashtags = hasTranslation ? (parts[7] || '') : (parts[6] || '');

        // body padding(40) + header(58) + image(352) + actions(40) + likes(26) + comments-link(24) + timestamp(32)
        let base = 40 + 58 + 352 + 40 + 26 + 24 + 32; // = 572

        // 캡션 (font 13px, line-height 1.35 → ~18px/줄, 컨테이너 438px) + padding 8
        const capLines = calcLines(caption, 438);
        base += Math.max(capLines, 1) * 18 + 8;

        // 번역
        if (hasTranslation) base += 20;

        // 해시태그 (font 14px, 컨테이너 438px)
        if (hashtags) {
          const tagLines = calcLines(hashtags, 438);
          base += tagLines * 20 + 6;
        }

        // 댓글 (com-user + text inline, font 13px, 컨테이너 ~390px, margin-bottom 4)
        if (c) {
          c.split('|').forEach(raw => {
            const seg = raw.split('§');
            const combined = (seg[0] || '') + ' ' + (seg[1] || '');
            // 번역 존재: 4필드 이상 + 마지막이 숫자(좋아요) + seg[2]가 실제 텍스트 있음
            const hasCT = seg.length >= 4 && !isNaN(Number(seg[seg.length - 1])) && seg[2] && seg[2].length > 0;
            const cmLines = Math.max(calcLines(combined, 390), 1);
            base += cmLines * 18 + (hasCT ? 16 : 0) + 4;
          });
        }

        h = base + MARGIN;
        h = Math.max(h, 560); h = Math.min(h, MAX_H);
      }

      // ── 🐦 TWITTER ──
      // body: padding 20px 0 → 상하 40px
      // tweet: padding 12, border-radius, header(44), body, image?, stats(40), actions(36)
      if (t === 'twitter') {
        const p = url.searchParams.get('p') || '';
        const r = url.searchParams.get('r') || '';
        const parts = p.split('§');
        const body = parts[3] || '';
        let idx = 4;
        let hasTranslation = false;
        if (parts[idx] && parts[idx].startsWith('[')) { hasTranslation = true; idx++; }
        let hasImg = false;
        if (parts[idx] && isNaN(Number(parts[idx])) && !(parts[idx] || '').startsWith('[')) { hasImg = true; idx++; }

        // body padding(40) + tweet padding(20) + header(54) + meta(26) + actions(40) + borders(4)
        let base = 40 + 20 + 54 + 26 + 40 + 4; // = 184

        // 통계: 0 아닌 항목이 하나라도 있으면 표시 (retweets~bookmarks = idx+1..idx+4)
        const hasStats = [parts[idx+1],parts[idx+2],parts[idx+3],parts[idx+4]].some(v => v && v !== '0');
        if (hasStats) base += 46;

        // 본문 (font 17px, line-height 1.45 → ~25px, 컨테이너 ~555px) + margin 14
        const bodyLines = calcLines(body, 555);
        base += Math.max(bodyLines, 1) * 25 + 14;

        if (hasTranslation) base += 22;
        if (hasImg) base += 330;

        // 리플라이 (미니 트윗: 헤더 + 답글대상줄 + 본문 + 액션바)
        if (r) {
          const replies = r.split('|');
          base += 40; // 정렬 라벨
          replies.forEach(raw => {
            const seg = raw.split('§');
            const rBody = seg[3] || '';
            let rTo = true;
            for (let s = 4; s < seg.length; s++) { if (seg[s] === '-') rTo = false; }
            const rLines = Math.max(calcLines(rBody, 495), 1);
            base += 80 + (rTo ? 20 : 0) + rLines * 21;
          });
        }

        h = base + MARGIN;
        h = Math.max(h, 300); h = Math.min(h, MAX_H);
      }

      // ── 🐦 TWITTER 타임라인 (tl) ──
      // body padding 20px 0 → 상하 40px, wrap 테두리 2
      if (t === 'tl') {
        const hParam = url.searchParams.get('h') || '';
        const mParam = url.searchParams.get('m') || '';
        let base = 40 + 2;
        if (hParam) base += 62 + 45; // 프로필 헤더 + 탭바

        if (mParam) {
          mParam.split('|').forEach(raw => {
            const seg = raw.split('§');
            const iBody = seg[3] || '';
            let hasRt = false, hasRe = false, imgN = 0, qtBody = '';
            for (let s = 4; s < seg.length; s++) {
              const f = seg[s] || '';
              if (f.startsWith('rt:') || f.startsWith('rt=')) hasRt = true;
              else if (f.startsWith('re:') || f.startsWith('re=')) hasRe = true;
              else if (f.startsWith('pic:') || f.startsWith('pic=') || f.startsWith('img:') || f.startsWith('img=')) imgN = Math.min(f.slice(4).split(';').length, 2);
              else if (f.startsWith('qt:') || f.startsWith('qt=')) {
                const qp = f.slice(3).split(';');
                qtBody = qp.length >= 4 ? qp.slice(3).join(';') : (qp[2] || '');
              }
            }
            // 패딩(16) + 헤더(22) + 액션바(30) + 본문 여백
            const bLines = Math.max(calcLines(iBody, 500), 1);
            let ih = 70 + bLines * 21;
            if (hasRt) ih += 22;
            if (hasRe) ih += 20;
            if (imgN === 1) ih += 320; // 16/9 와이드
            if (imgN === 2) ih += 285; // 정사각 2칸 그리드
            if (qtBody) ih += 58 + Math.max(calcLines(qtBody, 470), 1) * 20;
            base += ih;
          });
        }

        h = base + MARGIN;
        h = Math.max(h, 300); h = Math.min(h, MAX_H);
      }

      // ── 📋 POST (게시판 글) ──
      // body: padding 20px 0 → 상하 40px
      if (t === 'post') {
        const p = url.searchParams.get('p') || '';
        const c = url.searchParams.get('c') || '';
        const parts = p.split('§');
        const tag = parts[1] || '';
        const title = parts[2] || '';
        const bodyText = parts.slice(7).join('§') || '';

        // body padding(40) + header(42) + tag + meta(40) + actions(44) + comments header(30) + section padding(20)
        let base = 40 + 42 + (tag ? 22 : 0) + 40 + 44 + 30 + 20;

        // 제목 (font 17px, line-height 1.3 → ~22px)
        const titleLines = Math.max(calcLines(title, 568), 1);
        base += titleLines * 22 + 6;

        // 본문 (font 13px, line-height 1.35 → ~18px)
        const bodyLines = calcLines(bodyText, 568);
        base += bodyLines * 18;

        // 댓글
        if (c) {
          c.split('|').forEach(raw => {
            const isReply = raw.startsWith('>');
            const clean = isReply ? raw.substring(1) : raw;
            const seg = clean.split('§');
            const cBody = seg[2] || '';
            const cLines = Math.max(calcLines(cBody, isReply ? 520 : 568), 1);
            base += 16 + 20 + cLines * 16 + 20 + 1;
          });
        }

        h = base + MARGIN;
        h = Math.max(h, 340); h = Math.min(h, MAX_H);
      }

      // ── 🟠 REDDIT ──
      // body: padding 20px 0 → 상하 40px
      if (t === 'reddit') {
        const p = url.searchParams.get('p') || '';
        const c = url.searchParams.get('c') || '';
        const parts = p.split('§');
        const title = parts[3] || '';
        const bodyText = parts[4] || '';

        // body padding(40) + post padding(24) + meta(20) + actions(36) + border/margin(8)
        let base = 40 + 24 + 20 + 36 + 8;

        // 제목
        const titleLines = Math.max(calcLines(title, 576), 1);
        base += titleLines * 22 + 4;

        // 본문
        const bodyLines = calcLines(bodyText, 576);
        base += bodyLines * 19 + 6;

        // 댓글
        if (c) {
          c.split('|').forEach(raw => {
            const seg = raw.split('§');
            const cBody = seg[1] || '';
            const cLines = Math.max(calcLines(cBody, 530), 1);
            base += 20 + 18 + cLines * 19 + 18 + 4;
          });
        }

        h = base + MARGIN;
        h = Math.max(h, 300); h = Math.min(h, MAX_H);
      }

      // ── 📑 BOARD (목록) ──
      // 아이템: padding 10*2 + title row(~18) + meta(~14) + border(1) ≈ 53px
      if (t === 'board') {
        const p = url.searchParams.get('p') || '';
        const tabs = url.searchParams.get('tabs') || '';
        const itemCount = p ? p.split('|').length : 0;
        const hasTab = !!tabs;
        h = 50 + (hasTab ? 40 : 0) + itemCount * 56 + MARGIN;
        h = Math.max(h, 200); h = Math.min(h, MAX_H);
      }

      // ── ✉️ EMAIL ──
      // body: padding 20px 0 → 상하 40px
      if (t === 'email') {
        const p = url.searchParams.get('p') || '';
        const parts = p.split('§');
        const subject = parts[3] || '';
        const bodyText = parts.slice(5).join('§') || '';

        // body padding(40) + toolbar(44) + subject(28) + from-row(60) + divider(20) + body padding(40)
        let base = 40 + 44 + 28 + 60 + 20 + 40;

        // 제목 줄 수
        const subjLines = Math.max(calcLines(subject, 520), 1);
        base += (subjLines - 1) * 24;

        // 본문 (font 14px, line-height 1.6 → ~22px)
        const bodyLines = calcLines(bodyText, 520);
        base += Math.max(bodyLines, 1) * 22;

        h = base + MARGIN;
        h = Math.max(h, 300); h = Math.min(h, MAX_H);
      }

      // ── 📰 NEWS ──
      // body: padding 20px 0 → 상하 40px
      if (t === 'news') {
        const p = url.searchParams.get('p') || '';
        const parts = p.split('§');
        const title = parts[2] || '';
        const subtitle = parts[3] || '';
        const bodyText = parts.slice(7).join('§') || '';

        // body padding(40) + topbar(36) + category(28) + meta(26) + image(200) + body margin(16)
        let base = 40 + 36 + 28 + 26 + 200 + 16;

        // 제목 (font 24px, line-height 1.3 → ~31px)
        const titleLines = Math.max(calcLines(title, 520), 1);
        base += titleLines * 31 + 8;

        // 부제
        if (subtitle) {
          const subLines = Math.max(calcLines(subtitle, 520), 1);
          base += subLines * 22 + 8;
        }

        // 본문 (font 15px, line-height 1.7 → ~26px)
        const bodyLines = calcLines(bodyText, 520);
        base += Math.max(bodyLines, 1) * 26;

        h = base + MARGIN;
        h = Math.max(h, 480); h = Math.min(h, MAX_H);
      }

      // ── 📄 DOC ──
      if (t === 'doc') {
        const pDoc = url.searchParams.get('p') || '';
        const info = url.searchParams.get('i') || '';
        const t2 = url.searchParams.get('t2') || '';
        const b = url.searchParams.get('b') || '';
        const f = url.searchParams.get('f') || '';
        const infoCount = info ? info.split('|').length : 0;
        const tableRows = t2 ? t2.split('|').length : 0;

        // body padding(40) + header(134) + footer
        let base = 40 + 134 + (f ? 70 : 0);

        base += infoCount * 28;

        if (tableRows > 0) {
          base += 36 + tableRows * 36 + 16;
        }

        const bodyLines = calcLines(b, 500);
        base += bodyLines * 22;

        h = base + MARGIN;
        h = Math.max(h, 350); h = Math.min(h, MAX_H);
      }

      // ── 🔍 SEARCH ──
      if (t === 'search') {
        const r = url.searchParams.get('r') || '';
        const a = url.searchParams.get('a') || '';

        let base = 56 + 20; // searchbar + top padding

        if (r) {
          r.split('|').forEach(raw => {
            const seg = raw.split('§');
            const snippet = seg.slice(2).join('§') || '';
            const snipLines = Math.max(calcLines(snippet, 540), 1);
            base += 20 + 22 + snipLines * 18 + 16;
          });
        }

        if (a) {
          const paaCount = a.split('|').length;
          base += 40 + paaCount * 44;
        }

        h = base + MARGIN;
        h = Math.max(h, 300); h = Math.min(h, MAX_H);
      }

      // ── 💌 LETTER ──
      // body: padding 20px 8px → 상하 40px
      // flap(44) + date(37) + to(66) + body(pad 24 + 줄당22) + sign(68) + bottom(28) - overlap(2)
      // letter-body 컨테이너: 480-52-24=404px, cursive 폰트 보정 → 380px
      if (t === 'letter') {
        const b = url.searchParams.get('b') || '';
        const ps = url.searchParams.get('ps') || '';

        // body padding(40) + flap(44) + date(37) + to(66) + body padding(24) + sign(68) + bottom(28) - overlap(2)
        let base = 40 + 44 + 37 + 66 + 24 + 68 + 28 - 2; // = 305

        // 본문 (font 14px, line-height 1.6 → 22px, 컨테이너 380px cursive 보정)
        const bodyLines = calcLines(b, 380);
        base += Math.max(bodyLines, 1) * 22;

        // PS (font 12px, line-height 1.5 → 18px, padding 10+18=28)
        if (ps) {
          const psLines = Math.max(calcLines(ps, 380), 1);
          base += 28 + psLines * 18;
        }

        h = base + MARGIN;
        h = Math.max(h, 340); h = Math.min(h, MAX_H);
      }

      // ── 🍽️ MENU ──
      // body: padding 20px 8px → 상하 40px
      // menu-header: pad 28+20 + name(28) + sub(11) + divider(13) + border(1) = 101
      // menu-footer: pad 14+18 + border(1) + line(17) = 50 (기본 프레임)
      //   + notice(16px/줄) + hours(16px/줄 + mt4)
      // menu-section: pad 18+10 = 28
      // section-header: mb14 + pb8 + title(21) + border(1) = 44
      // item without desc: pad 8*2 + name(18) + border(1) = 35
      // item with desc: pad 8*2 + name(18) + desc(18) + border(1) = 53
      if (t === 'menu') {
        const s = url.searchParams.get('s') || '';
        const pMenu = url.searchParams.get('p') || '';
        const menuParts = pMenu ? pMenu.split('§') : [];
        const noticeText = menuParts[2] || '';
        const hoursText = menuParts[3] || '';

        // body padding(40) + header(108) + footer 기본 프레임(50)
        let base = 40 + 108 + 50;

        // footer 동적: notice + hours
        if (noticeText) {
          const noticeLines = Math.max(calcLines(noticeText, 430), 1);
          base += noticeLines * 16;
        }
        if (hoursText) {
          const hoursLines = Math.max(calcLines(hoursText, 430), 1);
          base += hoursLines * 16 + 4;
        }

        if (s) {
          const cats = s.split(';;');
          cats.forEach(cat => {
            const items = cat.split('|');
            base += 28 + 49; // section padding(18+10) + section header(49)
            items.slice(1).forEach((item, idx) => {
              const seg = item.split('§');
              const desc = seg[1] || '';
              base += (desc ? 53 : 35) + (idx > 0 ? 1 : 0); // item + border between items
            });
          });
        }

        h = base + MARGIN;
        h = Math.max(h, 350); h = Math.min(h, MAX_H);
      }

      const FIXED_TYPES = ['kakao', 'lock', 'stream', 'story', 'discord', 'discord-full', 'voice', 'dm', 'shorts'];
      const isFixed = FIXED_TYPES.includes(t);
      const svg = wrapInSVG(html, w, h, isFixed);
      return new Response(svg, {
        headers: { 'content-type': 'image/svg+xml', 'cache-control': 'no-cache' }
      });
    }
    return new Response('404 Not Found', { status: 404 });
  }
};
