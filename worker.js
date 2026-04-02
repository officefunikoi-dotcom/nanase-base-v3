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
  body { background: #fdfdfd; color: var(--text); padding-bottom: 80px; }
  .container { width: 100%; max-width: 500px; margin: 0 auto; padding: 15px; }
  
  .marquee-container { background: var(--sub); color: var(--main); padding: 10px 0; overflow: hidden; white-space: nowrap; margin-bottom: 20px; border-radius: 12px; font-weight: bold; }
  .marquee-text { display: inline-block; padding-left: 100%; animation: marquee 15s linear infinite; }
  @keyframes marquee { 0% { transform: translate(0, 0); } 100% { transform: translate(-100%, 0); } }

  h1 { color: var(--main); text-align: center; margin: 10px 0; font-size: 1.6rem; letter-spacing: 0.1em; }
  .card { background: var(--white); border-radius: 16px; padding: 15px; margin-bottom: 12px; border: 1px solid var(--border); }
  
  /* 4列リンクタイル */
  .link-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .link-btn { background: var(--main); color: white; text-decoration: none; padding: 8px 4px; border-radius: 8px; text-align: center; font-weight: bold; font-size: 0.75rem; min-height: 44px; display: flex; align-items: center; justify-content: center; }

  /* スタンプエリア */
  .my-stamp-box { background: #fff9e6; border: 2px solid #ffcc00; padding: 10px; border-radius: 12px; margin-bottom: 10px; }
  .search-input { width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--border); margin-bottom: 10px; font-size: 0.9rem; }
  .stamp-list-scroll { max-height: 350px; overflow-y: auto; }
  .stamp-row { display: flex; justify-content: space-between; padding: 10px 5px; border-bottom: 1px solid #f0f0f0; }

  /* 管理画面アコーディオン */
  .acc-item { border: 1px solid var(--border); border-radius: 12px; margin-bottom: 10px; overflow: hidden; background: #fff; }
  .acc-header { background: #f8f9fa; padding: 15px; cursor: pointer; font-weight: bold; display: flex; justify-content: space-between; }
  .acc-content { padding: 15px; display: none; }
  .item-row { display: flex; align-items: center; gap: 5px; background: #fafafa; padding: 8px; border-radius: 8px; margin-bottom: 8px; border: 1px solid #eee; }
  
  .btn { display: flex; align-items: center; justify-content: center; width: 100%; min-height: 48px; background: var(--main); color: white; border-radius: 12px; font-weight: bold; border: none; cursor: pointer; margin-top: 10px; text-decoration: none; }
  .btn-outline { background: transparent; border: 1.5px solid var(--main); color: var(--main); }
  .btn-sm { min-height: 32px; padding: 0 8px; font-size: 0.75rem; width: auto; margin: 0; }
`;

async function mainPortalHtml(data) {
  const sections = {
    message: data.displaySettings.message ? `<div class="marquee-container"><div class="marquee-text">${data.message}</div></div>` : '',
    event: `<div class="card" style="text-align:${data.eventAlign || 'center'}"><h3>Event Info</h3><p style="white-space:pre-wrap;">${data.eventInfo}</p></div>`,
    links: `<div class="card"><h3>Links</h3><div class="link-grid">${data.links.map(l => `<a href="${l.url}" target="_blank" class="link-btn">${l.label}</a>`).join('')}</div></div>`,
    stamps: `<div class="card"><h3>Stamps</h3>
      <div id="my-stamp-section" class="my-stamp-box">
        <p style="font-size:0.7rem; color:#888; margin-bottom:5px;">マイスタンプ表示（名前を保存）</p>
        <div style="display:flex; gap:5px;">
          <input type="text" id="my-name-input" class="search-input" style="margin:0; flex-grow:1;" placeholder="自分の名前を入力">
          <button class="btn btn-sm" onclick="saveMyName()">保存</button>
        </div>
        <div id="my-count-display" style="display:none; justify-content:space-between; margin-top:10px; font-weight:bold; color:var(--main); font-size:1.1rem;">
          <span id="display-name"></span><span id="display-count"></span>
        </div>
      </div>
      <input type="text" class="search-input" placeholder="リスナーを検索..." oninput="filterUserStamps(this.value)">
      <div class="stamp-list-scroll">${data.stamps.map(s => `<div class="stamp-row user-item" data-name="${s.name}"><span>${s.name}</span><b>${s.count}</b></div>`).join('')}</div></div>`
  };

  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>${baseStyle}</style><title>NANASE BASE</title></head>
    <body><div class="container"><h1>NANASE BASE</h1>
    ${sections.message}
    ${data.order.map(key => (key !== 'message' && data.displaySettings[key]) ? sections[key] : '').join('')}
    </div>
    <script>
      const stampData = ${JSON.stringify(data.stamps)};
      function saveMyName(){
        const name = document.getElementById('my-name-input').value;
        if(name){ localStorage.setItem('nanase_name', name); location.reload(); }
      }
      window.onload = () => {
        const saved = localStorage.getItem('nanase_name');
        if(saved){
          const user = stampData.find(s => s.name === saved);
          if(user){
            document.getElementById('display-name').innerText = saved + " さんのスタンプ：";
            document.getElementById('display-count').innerText = user.count;
            document.getElementById('my-count-display').style.display = 'flex';
            document.getElementById('my-name-input').value = saved;
          }
        }
      };
      function filterUserStamps(q){
        document.querySelectorAll('.user-item').forEach(el => {
          el.style.display = el.dataset.name.toLowerCase().includes(q.toLowerCase()) ? 'flex' : 'none';
        });
      }
    </script></body></html>`;
}

function adminLoginHtml() {
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>${baseStyle}</style></head>
    <body><div class="container"><h1>Admin</h1><div class="card"><input type="password" id="pass" placeholder="PW"><button class="btn" onclick="login()">Login</button></div></div>
    <script>async function login(){ const res = await fetch('/api/login',{method:'POST',body:JSON.stringify({pass:document.getElementById('pass').value})}); if(res.ok) location.reload(); }</script></body></html>`;
}

async function adminDashboardHtml(data) {
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>${baseStyle}</style></head>
    <body><div class="container"><h1>Admin</h1>
    
    <div class="acc-item">
      <div class="acc-header" onclick="toggleAcc(this)">⚙️ 各種設定 <span>▼</span></div>
      <div class="acc-content">
        <div class="acc-item"><div class="acc-header" onclick="toggleAcc(this)">🔐 パスワード</div><div class="acc-content"><input type="text" id="password" value="${data.password}"></div></div>
        <div class="acc-item"><div class="acc-header" onclick="toggleAcc(this)">📢 メッセージ</div><div class="acc-content"><textarea id="message">${data.message}</textarea></div></div>
        <div class="acc-item"><div class="acc-header" onclick="toggleAcc(this)">📅 イベント情報</div><div class="acc-content"><textarea id="eventInfo">${data.eventInfo}</textarea>
          <div style="display:flex;gap:5px;margin-top:5px;"><button class="btn-sm" onclick="setAlign('left',this)">左</button><button class="btn-sm" onclick="setAlign('center',this)">中</button><input type="hidden" id="eventAlign" value="${data.eventAlign||'center'}"></div>
        </div></div>
        <div class="acc-item"><div class="acc-header" onclick="toggleAcc(this)">🔄 表示順序</div><div class="acc-content" id="sort-area">${data.order.map(k=>`<div class="item-row" data-id="${k}"><input type="checkbox" id="check-${k}" ${data.displaySettings[k]?'checked':''} style="width:18px"><span>${k}</span><button class="btn-sm btn-outline" onclick="moveUp(this.parentElement)">↑</button><button class="btn-sm btn-outline" onclick="moveDown(this.parentElement)">↓</button></div>`).join('')}</div></div>
        <div class="acc-item"><div class="acc-header" onclick="toggleAcc(this)">🔗 リンク管理</div><div class="acc-content"><div id="link-list">${data.links.map(l=>`<div class="item-row"><input value="${l.label}" class="l-label" style="width:30%"><input value="${l.url}" class="l-url" style="width:40%"><button class="btn-sm btn-red" onclick="this.parentElement.remove()">×</button></div>`).join('')}</div><button class="btn btn-sm btn-outline" onclick="addLink()">+追加</button></div></div>
      </div>
    </div>

    <div class="card">
      <h3>👤 リスナースタンプ管理</h3>
      <input type="text" class="search-input" placeholder="検索..." oninput="filterAdminStamps(this.value)">
      <div id="stamp-list" style="max-height:400px; overflow-y:auto;">${data.stamps.map(s => `
        <div class="item-row admin-stamp-item">
          <input value="${s.name}" class="s-name" style="flex-grow:1; font-size:0.8rem;">
          <button class="btn-sm" style="background:var(--main);color:white" onclick="this.nextElementSibling.value++">＋</button>
          <input type="number" value="${s.count}" class="s-count" style="width:35px;text-align:center;">
          <button class="btn-sm btn-outline" onclick="this.previousElementSibling.value--">－</button>
          <button class="btn-sm btn-outline" onclick="moveUp(this.parentElement)">↑</button>
          <button class="btn-sm btn-outline" onclick="moveDown(this.parentElement)">↓</button>
          <button class="btn-sm btn-red" onclick="this.parentElement.remove()">×</button>
        </div>`).join('')}</div>
      <button class="btn btn-outline" onclick="addStamp()">+ リスナー追加</button>
    </div>

    <button class="btn" onclick="save()">設定を保存</button>
    <a href="/" class="btn btn-outline">ユーザーページを確認する</a>

  </div>
  <script>
    function toggleAcc(el){ const c = el.nextElementSibling; c.style.display = c.style.display==='block'?'none':'block'; event.stopPropagation(); }
    function setAlign(v,b){ document.getElementById('eventAlign').value=v; b.parentElement.querySelectorAll('button').forEach(x=>x.style.opacity=0.5); b.style.opacity=1; }
    function moveUp(e){ if(e.previousElementSibling) e.parentNode.insertBefore(e, e.previousElementSibling); }
    function moveDown(e){ if(e.nextElementSibling) e.parentNode.insertBefore(e.nextElementSibling, e); }
    function filterAdminStamps(q){ document.querySelectorAll('.admin-stamp-item').forEach(e=>{ e.style.display=e.querySelector('.s-name').value.includes(q)?'flex':'none'; }); }
    function addLink(){ const d=document.createElement('div'); d.className='item-row'; d.innerHTML='<input class="l-label" style="width:30%"><input class="l-url" style="width:40%"><button class="btn-sm btn-red" onclick="this.parentElement.remove()">×</button>'; document.getElementById('link-list').appendChild(d); }
    function addStamp(){ const d=document.createElement('div'); d.className='item-row admin-stamp-item'; d.innerHTML='<input class="s-name" style="flex-grow:1"><button class="btn-sm" style="background:var(--main);color:white" onclick="this.nextElementSibling.value++">＋</button><input type="number" value="0" class="s-count" style="width:35px;text-align:center;"><button class="btn-sm btn-outline" onclick="this.previousElementSibling.value--">－</button><button class="btn-sm btn-outline" onclick="moveUp(this.parentElement)">↑</button><button class="btn-sm btn-outline" onclick="moveDown(this.parentElement)">↓</button><button class="btn-sm btn-red" onclick="this.parentElement.remove()">×</button>'; document.getElementById('stamp-list').prepend(d); }
    async function save(){
      const order = [...document.querySelectorAll('#sort-area .item-row')].map(e=>e.dataset.id);
      const displaySettings = {}; order.forEach(id=>{ displaySettings[id]=document.getElementById('check-'+id).checked; });
      const links = [...document.querySelectorAll('#link-list .item-row')].map(e=>({label:e.querySelector('.l-label').value,url:e.querySelector('.l-url').value})).filter(l=>l.label);
      const stamps = [...document.querySelectorAll('#stamp-list .item-row')].map(e=>({name:e.querySelector('.s-name').value,count:parseInt(e.querySelector('.s-count').value)||0})).filter(s=>s.name);
      await fetch('/api/update',{method:'POST',body:JSON.stringify({password:document.getElementById('password').value,message:document.getElementById('message').value,eventInfo:document.getElementById('eventInfo').value,eventAlign:document.getElementById('eventAlign').value,links,stamps,displaySettings,order})});
      alert('保存しました');
    }
  </script></body></html>`;
}
