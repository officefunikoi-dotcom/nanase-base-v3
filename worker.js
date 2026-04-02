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
  :root { --main: #4a7c6d; --sub: #f0f7f4; --white: #ffffff; --text: #2c3e50; --border: #e0e0e0; --red: #e74c3c; }
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, sans-serif; }
  body { background: #fdfdfd; color: var(--text); padding-bottom: 60px; }
  .container { width: 100%; max-width: 500px; margin: 0 auto; padding: 15px; }
  
  /* 流れる文字 */
  .marquee-container { background: var(--sub); color: var(--main); padding: 8px 0; overflow: hidden; white-space: nowrap; margin-bottom: 20px; border-radius: 8px; font-weight: bold; }
  .marquee-text { display: inline-block; padding-left: 100%; animation: marquee 15s linear infinite; }
  @keyframes marquee { 0% { transform: translate(0, 0); } 100% { transform: translate(-100%, 0); } }

  h1 { color: var(--main); text-align: center; margin: 15px 0 5px 0; font-size: 1.5rem; letter-spacing: 0.1em; }
  .card { background: var(--white); border-radius: 12px; padding: 15px; margin-bottom: 12px; border: 1px solid var(--border); }
  .btn { display: flex; align-items: center; justify-content: center; width: 100%; min-height: 44px; background: var(--main); color: var(--white); text-decoration: none; border-radius: 8px; margin: 8px 0; font-weight: bold; border: none; cursor: pointer; }
  .btn-outline { background: transparent; border: 1px solid var(--main); color: var(--main); }
  .btn-sm { min-height: 32px; padding: 0 8px; font-size: 0.8rem; width: auto; }
  .btn-red { background: var(--red); color: white; }
  
  /* アコーディオン */
  .acc-item { border: 1px solid var(--border); border-radius: 8px; margin-bottom: 10px; overflow: hidden; }
  .acc-header { background: #f8f9fa; padding: 12px; cursor: pointer; font-weight: bold; font-size: 0.9rem; display: flex; justify-content: space-between; }
  .acc-content { padding: 12px; display: none; background: #fff; }
  
  .item-row { display: flex; align-items: center; gap: 5px; background: #fafafa; padding: 8px; border-radius: 8px; margin-bottom: 8px; border: 1px solid #eee; flex-wrap: wrap; }
  input, textarea { width: 100%; padding: 10px; margin: 4px 0; border: 1px solid var(--border); border-radius: 6px; font-size: 0.95rem; }
  .search-bar { background: var(--sub); border: 2px solid var(--main); margin-bottom: 10px; }
`;

async function mainPortalHtml(data) {
  const sections = {
    message: data.displaySettings.message ? `<div class="marquee-container"><div class="marquee-text">${data.message}</div></div>` : '',
    event: `<div class="card" style="text-align:${data.eventAlign || 'center'}"><h3>Event Info</h3><p style="white-space:pre-wrap;">${data.eventInfo}</p></div>`,
    links: `<div class="card"><h3>Links</h3>${data.links.map(l => `<a href="${l.url}" target="_blank" class="btn">${l.label}</a>`).join('')}</div>`,
    stamps: `<div class="card"><h3>Stamp Card</h3>${data.stamps.map(s => `<div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #eee;"><span>${s.name}</span><b>${s.count}</b></div>`).join('')}</div>`
  };
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>${baseStyle}</style><title>NANASE BASE</title></head>
    <body><div class="container"><h1>NANASE BASE</h1>
    ${sections.message}
    ${data.order.map(key => (key !== 'message' && data.displaySettings[key]) ? sections[key] : '').join('')}
    </div></body></html>`;
}

function adminLoginHtml() {
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>${baseStyle}</style></head>
    <body><div class="container"><h1>Admin</h1><div class="card"><input type="password" id="pass" placeholder="Password"><button class="btn" onclick="login()">Login</button></div></div>
    <script>async function login(){ const res = await fetch('/api/login',{method:'POST',body:JSON.stringify({pass:document.getElementById('pass').value})}); if(res.ok) location.reload(); else alert('Error'); }</script></body></html>`;
}

async function adminDashboardHtml(data) {
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>${baseStyle}
    .compact-input { padding: 6px; font-size: 0.8rem; }
    .align-btn-group { display: flex; gap: 5px; margin-top: 5px; }
  </style></head><body><div class="container"><h1>Admin</h1>
    
    <div class="acc-item">
      <div class="acc-header" onclick="toggleAcc(this)">🔐 管理パスワード <span>▼</span></div>
      <div class="acc-content"><input type="text" id="password" value="${data.password}"></div>
    </div>

    <div class="acc-item">
      <div class="acc-header" onclick="toggleAcc(this)">📢 メッセージ（流れる文字） <span>▼</span></div>
      <div class="acc-content"><textarea id="message" rows="2">${data.message}</textarea></div>
    </div>

    <div class="acc-item">
      <div class="acc-header" onclick="toggleAcc(this)">📅 イベント情報 <span>▼</span></div>
      <div class="acc-content">
        <textarea id="eventInfo" rows="3">${data.eventInfo}</textarea>
        <div class="align-btn-group">
          <button class="btn btn-sm ${data.eventAlign==='left'?'':'btn-outline'}" onclick="setAlign('left', this)">左揃え</button>
          <button class="btn btn-sm ${data.eventAlign==='center'?'':'btn-outline'}" onclick="setAlign('center', this)">中央揃え</button>
          <input type="hidden" id="eventAlign" value="${data.eventAlign || 'center'}">
        </div>
      </div>
    </div>

    <div class="acc-item">
      <div class="acc-header" onclick="toggleAcc(this)">🔄 セクション表示・順序 <span>▼</span></div>
      <div class="acc-content" id="sort-area">${data.order.map(key => `
        <div class="item-row" data-id="${key}" style="flex-wrap:nowrap">
          <input type="checkbox" id="check-${key}" ${data.displaySettings[key] ? 'checked' : ''} style="width:20px">
          <span style="flex-grow:1; font-size:0.8rem">${key.toUpperCase()}</span>
          <button class="btn-sm btn-outline" onclick="moveUp(this.parentElement)">↑</button>
          <button class="btn-sm btn-outline" onclick="moveDown(this.parentElement)">↓</button>
        </div>`).join('')}</div>
    </div>

    <div class="acc-item">
      <div class="acc-header" onclick="toggleAcc(this)">🔗 リンクボタン管理 <span>▼</span></div>
      <div class="acc-content">
        <div id="link-list">${data.links.map(l => `
          <div class="item-row">
            <input value="${l.label}" class="l-label compact-input" style="width:30%" placeholder="名">
            <input value="${l.url}" class="l-url compact-input" style="width:40%" placeholder="URL">
            <button class="btn-sm btn-outline" onclick="moveUp(this.parentElement)">↑</button>
            <button class="btn-sm btn-red" onclick="this.parentElement.remove()">×</button>
          </div>`).join('')}</div>
        <button class="btn btn-sm btn-outline" onclick="addLink()">+ 追加</button>
      </div>
    </div>

    <div class="card">
      <h3>👥 リスナースタンプ管理</h3>
      <input type="text" class="search-bar" placeholder="名前で検索..." oninput="filterList(this.value)">
      <div id="stamp-list" style="max-height:400px; overflow-y:auto;">${data.stamps.map(s => `
        <div class="item-row stamp-item">
          <input value="${s.name}" class="s-name compact-input" style="width:35%">
          <div style="display:flex; align-items:center; gap:2px;">
            <button class="btn-sm" onclick="this.nextElementSibling.value++">＋</button>
            <input type="number" value="${s.count}" class="s-count compact-input" style="width:35px; text-align:center; margin:0">
            <button class="btn-sm btn-outline" onclick="this.previousElementSibling.value--">－</button>
          </div>
          <button class="btn-sm btn-outline" onclick="moveUp(this.parentElement)">↑</button>
          <button class="btn-sm btn-red" onclick="this.parentElement.remove()">×</button>
        </div>`).join('')}</div>
      <button class="btn btn-outline" onclick="addStamp()">+ 新規リスナー追加</button>
      <button class="btn btn-sm btn-red" onclick="resetStamps()" style="width:100%">全リセット</button>
    </div>

    <button class="btn" onclick="save()">設定を保存して反映</button>
  </div>
  <script>
    function toggleAcc(el){ 
      const content = el.nextElementSibling;
      content.style.display = content.style.display === 'block' ? 'none' : 'block';
    }
    function setAlign(val, btn){
      document.getElementById('eventAlign').value = val;
      btn.parentElement.querySelectorAll('button').forEach(b => b.classList.add('btn-outline'));
      btn.classList.remove('btn-outline');
    }
    function moveUp(el){ if(el.previousElementSibling) el.parentNode.insertBefore(el, el.previousElementSibling); }
    function moveDown(el){ if(el.nextElementSibling) el.parentNode.insertBefore(el.nextElementSibling, el); }
    function filterList(q){
      document.querySelectorAll('.stamp-item').forEach(el => {
        el.style.display = el.querySelector('.s-name').value.includes(q) ? 'flex' : 'none';
      });
    }
    function addLink(){
      const d = document.createElement('div'); d.className='item-row';
      d.innerHTML = '<input class="l-label compact-input" style="width:30%"><input class="l-url compact-input" style="width:40%"><button class="btn-sm btn-outline" onclick="moveUp(this.parentElement)">↑</button><button class="btn-sm btn-red" onclick="this.parentElement.remove()">×</button>';
      document.getElementById('link-list').appendChild(d);
    }
    function addStamp(){
      const d = document.createElement('div'); d.className='item-row stamp-item';
      d.innerHTML = '<input class="s-name compact-input" style="width:35%"><div style="display:flex;align-items:center;gap:2px;"><button class="btn-sm" onclick="this.nextElementSibling.value++">＋</button><input type="number" value="0" class="s-count compact-input" style="width:35px;text-align:center;margin:0"><button class="btn-sm btn-outline" onclick="this.previousElementSibling.value--">－</button></div><button class="btn-sm btn-outline" onclick="moveUp(this.parentElement)">↑</button><button class="btn-sm btn-red" onclick="this.parentElement.remove()">×</button>';
      document.getElementById('stamp-list').prepend(d);
    }
    function resetStamps(){ if(confirm('リセットしますか？')) document.querySelectorAll('.s-count').forEach(i => i.value=0); }
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
