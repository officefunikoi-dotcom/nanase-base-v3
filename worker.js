export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    const getData = async () => {
      const data = await env.DATA_BOX.get("CONFIG", { type: "json" });
      return data || {
        password: "607",
        message: "NANASE BASEへようこそ！",
        eventInfo: "イベント準備中",
        eventAlign: "center",
        links: [{ label: "Twitter", url: "#" }],
        stamps: [{ name: "リスナーA", count: 0 }],
        displaySettings: { message: true, event: true, links: true, stamps: true },
        order: ["message", "event", "links", "stamps"]
      };
    };

    const cookie = request.headers.get("Cookie") || "";
    const isAuth = cookie.includes("auth=true");

    if (path === "/admin") {
      if (!isAuth) return new Response(adminLoginHtml(), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
      return new Response(await adminDashboardHtml(await getData()), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
    }

    if (path === "/api/login" && request.method === "POST") {
      const { pass } = await request.json();
      const config = await getData();
      if (pass === config.password) {
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Set-Cookie": "auth=true; Path=/; HttpOnly; SameSite=Strict; Max-Age=3600", "Content-Type": "application/json" }
        });
      }
      return new Response(JSON.stringify({ success: false }), { status: 401 });
    }

    if (path === "/api/update" && request.method === "POST" && isAuth) {
      const newConfig = await request.json();
      await env.DATA_BOX.put("CONFIG", JSON.stringify(newConfig));
      return new Response(JSON.stringify({ success: true }));
    }

    return new Response(await mainPortalHtml(await getData()), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
  }
};

const baseStyle = `
  :root { --main: #4a7c6d; --sub: #f0f7f4; --white: #ffffff; --text: #2c3e50; --border: #e0e0e0; --red: #e74c3c; --gold: #ffd700; }
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, sans-serif; }
  body { background: #fdfdfd; color: var(--text); padding-bottom: 60px; }
  .container { width: 100%; max-width: 500px; margin: 0 auto; padding: 15px; }
  
  /* 流れる文字 */
  .marquee-container { background: var(--sub); color: var(--main); padding: 10px 0; overflow: hidden; white-space: nowrap; margin-bottom: 20px; border-radius: 12px; font-weight: bold; border: 1px solid #dceae4; }
  .marquee-text { display: inline-block; padding-left: 100%; animation: marquee 15s linear infinite; }
  @keyframes marquee { 0% { transform: translate(0, 0); } 100% { transform: translate(-100%, 0); } }

  h1 { color: var(--main); text-align: center; margin: 15px 0 5px 0; font-size: 1.6rem; letter-spacing: 0.1em; }
  .card { background: var(--white); border-radius: 16px; padding: 15px; margin-bottom: 12px; border: 1px solid var(--border); box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
  h3 { font-size: 0.85rem; color: #99aab5; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; }

  /* リンクタイル */
  .link-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .link-btn { background: var(--main); color: white; text-decoration: none; padding: 12px; border-radius: 10px; text-align: center; font-weight: bold; font-size: 0.9rem; transition: transform 0.1s; display: flex; align-items: center; justify-content: center; min-height: 50px; }
  .link-btn:active { transform: scale(0.96); }

  /* スタンプエリア */
  .search-input { width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border); margin-bottom: 10px; font-size: 0.9rem; background: #f9f9f9; }
  .stamp-list-scroll { max-height: 400px; overflow-y: auto; border-top: 1px solid #f0f0f0; }
  .stamp-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 5px; border-bottom: 1px solid #f9f9f9; }
  .rank-icon { margin-right: 8px; font-size: 1rem; }
  .stamp-count { background: var(--sub); color: var(--main); padding: 2px 8px; border-radius: 20px; font-weight: 800; font-size: 1rem; }

  /* アコーディオン */
  .acc-item { border: 1px solid var(--border); border-radius: 12px; margin-bottom: 10px; overflow: hidden; background: #fff; }
  .acc-header { background: #f8f9fa; padding: 15px; cursor: pointer; font-weight: bold; font-size: 0.95rem; display: flex; justify-content: space-between; align-items: center; }
  .acc-content { padding: 15px; display: none; }
  .nested-acc { margin-top: 10px; border: 1px solid #eee; }

  input, textarea { width: 100%; padding: 12px; margin: 5px 0; border: 1px solid var(--border); border-radius: 8px; font-size: 1rem; }
  .btn { display: flex; align-items: center; justify-content: center; width: 100%; min-height: 48px; background: var(--main); color: white; border-radius: 12px; font-weight: bold; border: none; cursor: pointer; margin-top: 10px; }
  .btn-outline { background: transparent; border: 1.5px solid var(--main); color: var(--main); }
  .btn-sm { min-height: 36px; padding: 0 10px; font-size: 0.8rem; width: auto; margin: 0; }
  .btn-red { background: var(--red); color: white; }
  .item-row { display: flex; align-items: center; gap: 8px; background: #fafafa; padding: 10px; border-radius: 10px; margin-bottom: 10px; border: 1px solid #eee; }
`;

async function mainPortalHtml(data) {
  // スタンプ数でソート
  const sortedStamps = [...data.stamps].sort((a, b) => b.count - a.count);
  
  const sections = {
    message: data.displaySettings.message ? `<div class="marquee-container"><div class="marquee-text">${data.message}</div></div>` : '',
    event: `<div class="card" style="text-align:${data.eventAlign || 'center'}"><h3>Event Info</h3><p style="white-space:pre-wrap; font-weight:500;">${data.eventInfo}</p></div>`,
    links: `<div class="card"><h3>Links</h3><div class="link-grid">${data.links.map(l => `<a href="${l.url}" target="_blank" class="link-btn">${l.label}</a>`).join('')}</div></div>`,
    stamps: `<div class="card"><h3>Listener Stamps</h3>
      <input type="text" class="search-input" placeholder="リスナー名で検索..." oninput="filterUserStamps(this.value)">
      <div class="stamp-list-scroll" id="user-stamp-list">${sortedStamps.map((s, index) => {
        let rank = "";
        if(index === 0 && s.count > 0) rank = "👑";
        else if(index === 1 && s.count > 0) rank = "🥈";
        else if(index === 2 && s.count > 0) rank = "🥉";
        return `<div class="stamp-row user-item" data-name="${s.name}">
          <span><span class="rank-icon">${rank}</span>${s.name}</span>
          <span class="stamp-count">${s.count}</span>
        </div>`
      }).join('')}</div></div>`
  };

  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>${baseStyle}</style><title>NANASE BASE</title></head>
    <body><div class="container"><h1>NANASE BASE</h1>
    ${sections.message}
    ${data.order.map(key => (key !== 'message' && data.displaySettings[key]) ? sections[key] : '').join('')}
    </div>
    <script>
      function filterUserStamps(q){
        document.querySelectorAll('.user-item').forEach(el => {
          el.style.display = el.dataset.name.toLowerCase().includes(q.toLowerCase()) ? 'flex' : 'none';
        });
      }
    </script></body></html>`;
}

function adminLoginHtml() {
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>${baseStyle}</style></head>
    <body><div class="container"><h1>Admin</h1><div class="card"><input type="password" id="pass" placeholder="Password"><button class="btn" onclick="login()">Login</button></div></div>
    <script>async function login(){ const res = await fetch('/api/login',{method:'POST',body:JSON.stringify({pass:document.getElementById('pass').value})}); if(res.ok) location.reload(); else alert('Error'); }</script></body></html>`;
}

async function adminDashboardHtml(data) {
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>${baseStyle}
    .compact-box { font-size: 0.8rem; padding: 6px; }
  </style></head><body><div class="container"><h1>Admin Portal</h1>
    
    <div class="card">
      <h3 style="color:var(--main); font-weight:bold;">👤 リスナースタンプ管理</h3>
      <input type="text" class="search-input" placeholder="リスナーを検索..." oninput="filterAdminStamps(this.value)">
      <div id="stamp-list" style="max-height:450px; overflow-y:auto; margin-bottom:10px;">${data.stamps.map(s => `
        <div class="item-row admin-stamp-item">
          <input value="${s.name}" class="s-name compact-box" style="flex-grow:1" placeholder="リスナー名">
          <div style="display:flex; align-items:center; gap:3px;">
            <button class="btn-sm" style="background:var(--main); color:white" onclick="this.nextElementSibling.value++">＋</button>
            <input type="number" value="${s.count}" class="s-count compact-box" style="width:40px; text-align:center; margin:0">
            <button class="btn-sm btn-outline" onclick="this.previousElementSibling.value--">－</button>
          </div>
          <button class="btn-sm btn-red" onclick="this.parentElement.remove()">×</button>
        </div>`).join('')}</div>
      <button class="btn btn-outline" onclick="addStamp()">+ 新規リスナー追加</button>
      <button class="btn btn-sm btn-red" onclick="resetStamps()" style="width:100%; margin-top:5px; font-size:0.7rem;">全スタンプを0にリセット</button>
    </div>

    <div class="acc-item">
      <div class="acc-header" onclick="toggleAcc(this)" style="background:var(--sub); color:var(--main);">⚙️ 各種設定 <span>▼</span></div>
      <div class="acc-content">
        
        <div class="acc-item nested-acc">
          <div class="acc-header" onclick="toggleAcc(this)">🔐 管理パスワード <span>▼</span></div>
          <div class="acc-content"><input type="text" id="password" value="${data.password}"></div>
        </div>

        <div class="acc-item nested-acc">
          <div class="acc-header" onclick="toggleAcc(this)">📢 流れるメッセージ <span>▼</span></div>
          <div class="acc-content"><textarea id="message" rows="2">${data.message}</textarea></div>
        </div>

        <div class="acc-item nested-acc">
          <div class="acc-header" onclick="toggleAcc(this)">📅 イベント情報 <span>▼</span></div>
          <div class="acc-content">
            <textarea id="eventInfo" rows="3">${data.eventInfo}</textarea>
            <div style="display:flex; gap:5px; margin-top:5px;">
              <button class="btn-sm ${data.eventAlign==='left'?'':'btn-outline'}" onclick="setAlign('left', this)">左揃え</button>
              <button class="btn-sm ${data.eventAlign==='center'?'':'btn-outline'}" onclick="setAlign('center', this)">中央揃え</button>
              <input type="hidden" id="eventAlign" value="${data.eventAlign || 'center'}">
            </div>
          </div>
        </div>

        <div class="acc-item nested-acc">
          <div class="acc-header" onclick="toggleAcc(this)">🔄 表示項目の順序 <span>▼</span></div>
          <div class="acc-content" id="sort-area">${data.order.map(key => `
            <div class="item-row" data-id="${key}" style="padding:5px; margin-bottom:5px;">
              <input type="checkbox" id="check-${key}" ${data.displaySettings[key] ? 'checked' : ''} style="width:18px">
              <span style="flex-grow:1; font-size:0.75rem">${key.toUpperCase()}</span>
              <button class="btn-sm btn-outline" onclick="moveUp(this.parentElement)">↑</button>
              <button class="btn-sm btn-outline" onclick="moveDown(this.parentElement)">↓</button>
            </div>`).join('')}</div>
        </div>

        <div class="acc-item nested-acc">
          <div class="acc-header" onclick="toggleAcc(this)">🔗 リンクボタン管理 <span>▼</span></div>
          <div class="acc-content">
            <div id="link-list">${data.links.map(l => `
              <div class="item-row" style="gap:4px; padding:6px;">
                <input value="${l.label}" class="l-label compact-box" style="width:35%" placeholder="名前">
                <input value="${l.url}" class="l-url compact-box" style="width:45%" placeholder="URL">
                <button class="btn-sm btn-red" onclick="this.parentElement.remove()">×</button>
              </div>`).join('')}</div>
            <button class="btn btn-sm btn-outline" onclick="addLink()">+ リンク追加</button>
          </div>
        </div>

      </div>
    </div>

    <button class="btn" onclick="save()">設定をすべて保存して反映</button>
  </div>
  <script>
    function toggleAcc(el){ 
      const content = el.nextElementSibling;
      content.style.display = content.style.display === 'block' ? 'none' : 'block';
      event.stopPropagation();
    }
    function setAlign(val, btn){
      document.getElementById('eventAlign').value = val;
      btn.parentElement.querySelectorAll('button').forEach(b => b.classList.add('btn-outline'));
      btn.classList.remove('btn-outline');
    }
    function moveUp(el){ if(el.previousElementSibling) el.parentNode.insertBefore(el, el.previousElementSibling); }
    function moveDown(el){ if(el.nextElementSibling) el.parentNode.insertBefore(el.nextElementSibling, el); }
    function filterAdminStamps(q){
      document.querySelectorAll('.admin-stamp-item').forEach(el => {
        el.style.display = el.querySelector('.s-name').value.toLowerCase().includes(q.toLowerCase()) ? 'flex' : 'none';
      });
    }
    function addLink(){
      const d = document.createElement('div'); d.className='item-row'; d.style="gap:4px; padding:6px;";
      d.innerHTML = '<input class="l-label compact-box" style="width:35%"><input class="l-url compact-box" style="width:45%"><button class="btn-sm btn-red" onclick="this.parentElement.remove()">×</button>';
      document.getElementById('link-list').appendChild(d);
    }
    function addStamp(){
      const d = document.createElement('div'); d.className='item-row admin-stamp-item';
      d.innerHTML = '<input class="s-name compact-box" style="flex-grow:1" placeholder="リスナー名"><div style="display:flex;align-items:center;gap:3px;"><button class="btn-sm" style="background:var(--main); color:white" onclick="this.nextElementSibling.value++">＋</button><input type="number" value="0" class="s-count compact-box" style="width:40px;text-align:center;margin:0"><button class="btn-sm btn-outline" onclick="this.previousElementSibling.value--">－</button></div><button class="btn-sm btn-red" onclick="this.parentElement.remove()">×</button>';
      document.getElementById('stamp-list').prepend(d);
    }
    function resetStamps(){ if(confirm('全リスナーのスタンプを0にしますか？')) document.querySelectorAll('.s-count').forEach(i => i.value=0); }
    async function save(){
      const order = [...document.querySelectorAll('#sort-area .item-row')].map(el => el.dataset.id);
      const displaySettings = {}; order.forEach(id => { displaySettings[id] = document.getElementById('check-'+id).checked; });
      const links = [...document.querySelectorAll('#link-list .item-row')].map(el => ({ label: el.querySelector('.l-label').value, url: el.querySelector('.l-url').value })).filter(l => l.label);
      const stamps = [...document.querySelectorAll('#stamp-list .item-row')].map(el => ({ name: el.querySelector('.s-name').value, count: parseInt(el.querySelector('.s-count').value) || 0 })).filter(s => s.name);
      const res = await fetch('/api/update',{method:'POST',body:JSON.stringify({password:document.getElementById('password').value,message:document.getElementById('message').value,eventInfo:document.getElementById('eventInfo').value,eventAlign:document.getElementById('eventAlign').value,links,stamps,displaySettings,order})});
      if(res.ok) alert('保存完了');
    }
  </script></body></html>`;
}
