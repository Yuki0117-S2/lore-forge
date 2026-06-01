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
    border-radius: 16px 16px 0 0; padding: 12px; border-bottom: none;
  }
  .tweet.no-replies { border-radius: 16px; border-bottom: 1px solid #2a2535; }
  .tweet-header { display: flex; gap: 8px; margin-bottom: 4px; }
  .avatar {
    width: 40px; height: 40px; border-radius: 50%;
    background: linear-gradient(135deg, var(--col-indigo), var(--col-rose));
    flex-shrink: 0; display: flex; align-items: center; justify-content: center;
  }
  .avatar svg { width: 60%; height: 60%; fill: #fff; opacity: 0.85; }
  .header-right { flex: 1; min-width: 0; }
  .name-row { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
  .display-name { font-size: 15px; font-weight: 700; color: #e7e9ea; }
  .verified { width: 18px; height: 18px; fill: var(--col-indigo); flex-shrink: 0; }
  .handle-time { font-size: 14px; color: #71767b; }
  .more-btn {
    margin-left: auto; background: none; border: none;
    color: #71767b; cursor: pointer; font-size: 18px; padding: 0 4px; align-self: flex-start;
  }
  .tweet-body {
    font-size: 14px; line-height: 1.35; color: #e7e9ea;
    margin: 6px 0 8px; white-space: pre-wrap; word-break: break-word;
  }
  .tweet-body .translation { color: #71767b; font-size: 13px; display: block; margin-top: 4px; }
  .tweet-image {
    width: 100%; aspect-ratio: 16/5; background: #18141e;
    border-radius: 16px; border: 1px solid #2a2535;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 8px; margin-bottom: 8px;
  }
  .tweet-image svg { width: 40px; height: 40px; fill: var(--col-indigo); opacity: 0.4; }
  .tweet-image .img-desc { font-size: 13px; color: var(--col-pink); opacity: 0.5; text-align: center; padding: 0 20px; }
  .tweet-stats {
    display: flex; gap: 4px; flex-wrap: wrap;
    padding: 8px 0; font-size: 14px; color: #e7e9ea;
    border-top: 1px solid #2f3336;
  }
  .stat-item { display: flex; gap: 4px; }
  .stat-item span { color: #71767b; }
  .stat-divider { color: #71767b; margin: 0 4px; }
  .tweet-actions {
    display: flex; justify-content: space-between;
    padding: 4px 0; border-top: 1px solid #2f3336;
  }
  .action {
    display: flex; align-items: center; gap: 6px;
    color: #71767b; font-size: 13px; cursor: pointer;
    padding: 6px 8px; border-radius: 999px;
  }
  .action svg {
    width: 18px; height: 18px; fill: none; stroke: #71767b;
    stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round;
  }
  .replies-section {
    border: 1px solid #2a2535; border-top: 1px solid #2f3336;
    border-radius: 0 0 16px 16px; overflow: hidden;
  }
  .reply-item {
    padding: 10px 12px; display: flex; gap: 8px;
    border-bottom: 1px solid #1a1724; background: #0d0d14;
  }
  .reply-item:last-child { border-bottom: none; }
  .reply-avatar-col { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
  .reply-avatar {
    width: 34px; height: 34px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; color: #fff;
  }
  .thread-line { width: 2px; flex: 1; min-height: 6px; background: #2f3336; margin-top: 4px; }
  .reply-content { flex: 1; min-width: 0; }
  .reply-header { display: flex; align-items: baseline; gap: 5px; margin-bottom: 2px; flex-wrap: wrap; }
  .reply-name { font-size: 14px; font-weight: 700; color: #e7e9ea; }
  .reply-handle { font-size: 13px; color: #71767b; }
  .reply-body { font-size: 14px; line-height: 1.4; color: #e7e9ea; word-break: break-word; margin-bottom: 4px; }
  .reply-likes { font-size: 12px; color: #71767b; display: flex; align-items: center; gap: 4px; }
  .reply-likes svg {
    width: 14px; height: 14px; fill: none; stroke: #71767b;
    stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round;
  }
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
      <div class="action"><svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></div>
      <div class="action"><svg viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg></div>
      <div class="action like"><svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg></div>
      <div class="action"><svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
      <div class="action"><svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg></div>
    </div>
  </div>
  <div class="replies-section" id="replies-section" style="display:none">
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
    width: 0%;
    background: #fff;
    border-radius: 2px;
    animation: story-progress 5s linear infinite;
  }
  @keyframes story-progress {
    from { width: 0%; }
    to   { width: 100%; }
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
    animation: live-blink 1s ease-in-out infinite;
  }
  @keyframes live-blink {
    0%, 100% { opacity: 1; }
    50%      { opacity: 0.3; }
  }
  .live-text { font-size: 12px; color: #fff; font-weight: 600; }

  /* Donation alert */
  .donation-alert {
    position: absolute;
    top: 48px;
    left: 50%;
    transform: translateX(-50%);
    width: 92%;
    max-width: 340px;
    background: rgba(26, 20, 34, 0.95);
    border: 2px solid var(--col-pink);
    border-radius: 12px;
    padding: 14px 16px 12px;
    text-align: center;
    box-shadow: 0 6px 20px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(221, 170, 204, 0.2);
    opacity: 0;
    animation: donation-pop 6s ease-in-out forwards;
    z-index: 20;
  }
  .donation-header {
    font-size: 10px;
    color: var(--col-pink);
    letter-spacing: 2px;
    font-weight: 700;
    margin-bottom: 4px;
    opacity: 0.85;
  }
  .donation-amount {
    font-size: 22px;
    font-weight: 800;
    color: var(--col-rose);
    text-shadow: 0 0 8px rgba(187, 102, 136, 0.4);
    line-height: 1.1;
    margin-bottom: 4px;
  }
  .donation-nick {
    font-size: 13px;
    color: var(--col-indigo);
    font-weight: 700;
    margin-bottom: 8px;
  }
  .donation-message {
    font-size: 13px;
    color: var(--col-sand);
    line-height: 1.4;
    word-break: break-word;
  }
  @keyframes donation-pop {
    0%   { opacity: 0; transform: translate(-50%, -16px) scale(0.85); }
    10%  { opacity: 1; transform: translate(-50%, 0) scale(1.06); }
    18%  {            transform: translate(-50%, 0) scale(1); }
    90%  { opacity: 1; transform: translate(-50%, 0) scale(1); }
    100% { opacity: 0; transform: translate(-50%, -10px) scale(0.96); }
  }
  .donation-sparkles {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: visible;
  }
  .donation-spark {
    position: absolute;
    bottom: 4px;
    font-size: 18px;
    opacity: 0;
    line-height: 1;
    animation: donation-spark-rise 1.8s ease-out infinite;
  }
  @keyframes donation-spark-rise {
    0%   { transform: translateY(0)     scale(0.5); opacity: 0; }
    20%  {                                          opacity: 1; }
    40%  { transform: translateY(-25px) scale(1.05); }
    100% { transform: translateY(-78px) scale(0.85); opacity: 0; }
  }

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
        <div id="donation-slot"></div>
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
  const verified = parts[idx+5]==='verified';
  html = html.replace('>Display Name<', '>'+displayName+'<');
  html = html.replace('>@handle · 시간<', '>'+handle+' · '+time+'<');
  html = html.replace('>트윗 내용<', '>'+body+(translation?'<span class="translation">'+translation+'</span>':'')+'<');
  if (imgDesc) { html=html.replace('id="tweet-image" style="display:none"','id="tweet-image"'); html=html.replace('id="img-desc"></div>','id="img-desc">'+imgDesc+'</div>'); }
  if (verified) html=html.replace('id="verified-badge" style="display:none"','id="verified-badge"');
  html=html.replace('id="retweets">0<','id="retweets">'+Number(retweets).toLocaleString()+'<');
  html=html.replace('id="quotes">0<','id="quotes">'+Number(quotes).toLocaleString()+'<');
  html=html.replace('id="likes">0<','id="likes">'+Number(likes).toLocaleString()+'<');
  html=html.replace('id="bookmarks">0<','id="bookmarks">'+Number(bookmarks).toLocaleString()+'<');
  // 답글 트윗 렌더링
  if (r) {
    html=html.replace('class="tweet no-replies"','class="tweet"');
    html=html.replace('id="replies-section" style="display:none"','id="replies-section"');
    const colors=['#5865f2','#FF6699','#57f287','#fee75c','#ed4245','#8889CD','#BB6688','#CCAA88','#3ba55c','#FF7722','#0077DD','#e8a44d','#9b84ec','#00BBDD'];
    const abg=name=>{let h=7;let _i=0;for(const c of name){h=(h*31+c.charCodeAt(0)+_i*17)|0;_i++;}return colors[((h%colors.length)+colors.length)%colors.length];};
    const replyList=r.split('|');
    let rh='';
    replyList.forEach((raw,i)=>{
      const seg=raw.split('§');
      const rName=seg[0]||'',rHandle=seg[1]||'',rTime=seg[2]||'',rBody=seg[3]||'',rLikes=Number(seg[4]||'0').toLocaleString();
      const isLast=i===replyList.length-1;
      rh+='<div class="reply-item"><div class="reply-avatar-col"><div class="reply-avatar" style="background:'+abg(rName)+'">'+rName.charAt(0)+'</div>'+(isLast?'':'<div class="thread-line"></div>')+'</div><div class="reply-content"><div class="reply-header"><span class="reply-name">'+rName+'</span><span class="reply-handle">'+rHandle+' · '+rTime+'</span></div><div class="reply-body">'+rBody+'</div><div class="reply-likes"><svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>'+rLikes+'</div></div></div>';
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
    const dnick=pp[5]||'',damount=pp[6]||'',dmsg=pp[7]||'';
    html=html.replace('>스트리머<','>'+streamer+'<');
    html=html.replace('id="streamer-avatar">S<','id="streamer-avatar">'+streamer.charAt(0)+'<');
    html=html.replace('>방송 제목<','>'+title+'<');
    html=html.replace('id="viewer-count">0<','id="viewer-count">'+Number(viewers).toLocaleString()+'<');
    if(desc) html=html.replace('>방송 화면<','>'+desc+'<');
    if(tags){let th='';tags.split(' ').forEach(t=>{th+='<span class="stream-tag">'+t+'</span>';});html=html.replace('id="stream-tags"></div>','id="stream-tags">'+th+'</div>');}
    if(dnick&&damount&&dmsg){
      const sparks=[
        {l:'4%',  d:'0.6s', e:'🎉'},
        {l:'22%', d:'1.0s', e:'💰'},
        {l:'42%', d:'1.3s', e:'✨'},
        {l:'62%', d:'0.9s', e:'💖'},
        {l:'80%', d:'1.4s', e:'⭐'},
        {l:'94%', d:'1.1s', e:'🎁'},
      ];
      let sHtml='<div class="donation-sparkles">';
      sparks.forEach(s=>{sHtml+='<span class="donation-spark" style="left:'+s.l+';animation-delay:'+s.d+'">'+s.e+'</span>';});
      sHtml+='</div>';
      const dHtml='<div class="donation-alert">'
        +'<div class="donation-header">★ DONATION ★</div>'
        +'<div class="donation-amount">'+damount+'</div>'
        +'<div class="donation-nick">'+dnick+' 님</div>'
        +'<div class="donation-message">'+dmsg+'</div>'
        +sHtml
        +'</div>';
      html=html.replace('<div id="donation-slot"></div>',dHtml);
    }
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

function renderDefault(html, url) { return html; }

const RENDERERS = {
  'insta': renderInsta, 'twitter': renderTwitter, 'kakao': renderKakao,
  'reddit': renderReddit, 'lock': renderLock, 'email': renderEmail,
  'story': renderStory, 'search': renderSearch, 'news': renderNews,
  'doc': renderDoc, 'board': renderBoard, 'discord': renderDiscord,
  'voice': renderVoice, 'discord-full': renderDiscordFull, 'stream': renderStream, 'post': renderPost,
  'letter': renderLetter, 'menu': renderMenu, 'dm': renderDm,
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
  const safeBody = escapeBareAmp(body);
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
        + '<p>사용 가능한 타입 (19종):</p><ul>' + links + '</ul>'
        + '</body></html>',
        { headers: { 'content-type': 'text/html;charset=UTF-8' } }
      );
    }
    let html = TEMPLATES[t];
    if (html) {
      const renderer = RENDERERS[t] || renderDefault;
      html = renderer(html, url);
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

        // body padding(40) + tweet padding(24) + header(44) + stats(40) + actions(36) + borders(4)
        let base = 40 + 24 + 44 + 40 + 36 + 4; // = 188

        // 본문 (font 14px, line-height 1.35 → ~19px, 컨테이너 ~530px) + margin 14
        const bodyLines = calcLines(body, 530);
        base += Math.max(bodyLines, 1) * 19 + 14;

        if (hasTranslation) base += 18;
        if (hasImg) base += 120;

        // 리플라이
        if (r) {
          const replies = r.split('|');
          base += 2;
          replies.forEach(raw => {
            const seg = raw.split('§');
            const rBody = seg[3] || '';
            const rLines = Math.max(calcLines(rBody, 500), 1);
            base += 20 + 16 + rLines * 20 + 4 + 16 + 8;
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

      const FIXED_TYPES = ['kakao', 'lock', 'stream', 'story', 'discord', 'discord-full', 'voice', 'dm'];
      const isFixed = FIXED_TYPES.includes(t);
      const svg = wrapInSVG(html, w, h, isFixed);
      return new Response(svg, {
        headers: { 'content-type': 'image/svg+xml', 'cache-control': 'no-cache' }
      });
    }
    return new Response('404 Not Found', { status: 404 });
  }
};
