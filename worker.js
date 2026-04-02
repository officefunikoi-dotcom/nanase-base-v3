export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    const getData = async () => {
      const data = await env.DATA_BOX.get("CONFIG", { type: "json" });
      return data || {
        password: "607",
        message: "NON BASEへようこそ！",
        eventInfo: "イベント準備中",
        eventAlign: "center",
        links: [{ label: "Twitter", url: "#" }],
        stamps: [{ name: "リスナーA", count: 0 }],
        // デフォルトのしきい値設定
        thresholds: { silver: 10, gold: 30, platinum: 50, black: 100 },
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
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; }
  body { background: #fdfdfd; color: var(--text); padding-bottom: 80px; }
  .container { width: 100%; max-width: 500px; margin: 0 auto; padding: 15px; }
  
  /* デジタル会員証スタイル */
  .member-card { 
    width: 100%; aspect-ratio: 1.6 / 1; border-radius: 20px; padding: 25px; 
    position: relative; color: white; margin-bottom: 20px; overflow: hidden;
    box-shadow: 0 10px 20px rgba(0,0,0,0.2); transition: all 0.3s ease;
  }
  .card-bronze { background: linear-gradient(135deg, #804a00, #3d2300); }
  .card-silver { background: linear-gradient(135deg, #a0a0a0, #4a4a4a); }
  .card-gold { background: linear-gradient(135deg, #d4af37, #7a5f00); }
  .card-platinum { background: linear-gradient(135deg, #e5e4e2, #7d7d7d); }
  .card-black { background: linear-gradient(135deg, #333333, #000000); }
  .card-topfan { background: linear-gradient(135deg, #ff00cc, #3333ff); animation: shine 3s infinite; }
  
  @keyframes shine { 0% { filter: hue-rotate(0deg); } 100% { filter: hue-rotate(360deg); } }

  .card-title { font-size: 1.8rem; font-weight: 900; letter-spacing: 4px; margin-bottom: 5px; }
  .card-subtitle { font-size: 0.7rem; opacity: 0.8; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 15px; }
  .card-name { position: absolute; bottom: 45px; left: 25px; font-size: 1.8rem; font-weight: bold; }
  .card-rank { position: absolute; top: 25px; right: 25px; background: rgba(255,255,255,0.2); padding: 5px 15px; border-radius: 20px; font-weight: bold; font-size: 0.8rem; }
  .card-count { position: absolute; top: 65px; right: 25px; font-size: 0.9rem; font-weight: bold; }

  .marquee-container { background: var(--sub); color: var(--main); padding: 10px 0; overflow: hidden; white-space: nowrap; margin-bottom: 20px; border-radius: 12px; font-weight: bold; }
  .marquee-text { display: inline-block; padding-left: 100%; animation: marquee 15s linear infinite; }
  @keyframes marquee { 0% { transform: translate(0, 0); } 100% { transform: translate(-100%, 0); } }

  .link-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .link-btn { background: var(--main); color: white; text-decoration: none; padding: 8px 4px; border-radius: 8px; text-align: center; font-weight: bold; font-size: 0.75rem; min-height: 44px; display: flex; align-items: center; justify-content: center; }

  .acc-item { border: 1px solid var(--border); border-radius: 12px; margin-bottom: 10px; overflow: hidden; background: #fff; }
  .acc-header { background: #f8f9fa; padding: 15px; cursor: pointer; font-weight: bold; display: flex; justify-content: space-between; }
  .acc-content { padding: 15px; display: none; }
  .item-row { display: flex; align-items: center; gap: 8px; background: #fafafa; padding: 10px; border-radius: 10px; margin-bottom: 8px; border: 1px solid #eee; }
  
  .btn { display: flex; align-items: center; justify-content: center; width: 100%; min-height: 48px; background: var(--main); color: white; border-radius: 12px; font-weight: bold; border: none; cursor: pointer; margin-top: 10px; text-decoration: none; }
  .btn-outline { background: transparent; border: 1.5px solid var(--main); color: var(--main); }
  .btn-sm { min-height: 32px; padding: 0 10px; font-size: 0.8rem; width: auto; margin: 0; font-weight: bold; }
  .btn-red { background: var(--red); color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
  input { padding: 8px; border-radius: 6px; border: 1px solid #ddd; }
`;

async function mainPortalHtml(data) {
  const sortedStamps = [...data.stamps].sort((a, b) => b.count - a.count);
  const topCount = sortedStamps.length > 0 ? sortedStamps[0].count : 0;

  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>${baseStyle}</style><title>NON BASE</title></head>
    <body><div class="container"><h1 style="color:var(--main);text-align:center;margin-bottom:15px;">NON BASE</h1>
    
    ${data.displaySettings.message ? `<div class="marquee-container"><div class="marquee-text">${data.message}</div></div>` : ''}

    <div id="my-stamp-section" class="card" style="padding:15px; border-radius:20px; background:#f9f9f9; border:1px dashed #ccc; margin-bottom:20px;">
        <p style="font-size:0.75rem; color:#666; margin-bottom:8px; text-align:center;">--- 会員証を表示 ---</p>
        <div style="display:flex; gap:5px;">
          <input type="text" id="my-name-input" style="flex-grow:1; border-radius:12px;" placeholder="登録した名前を入力">
          <button class="btn btn-sm" onclick="saveMyName()">表示</button>
        </div>
        <div id="card-display-area" style="margin-top:15px; display:none;"></div>
    </div>

    <div class="card" style="border-radius:20px;">
      <h3 style="margin-bottom:10px; font-size:1rem; color:var(--main);">Ranking</h3>
      <input type="text" placeholder="リスナー検索..." oninput="filterUser(this.value)" style="width:100%; margin-bottom:10px; border-radius:10px;">
      <div style="max-height:300px; overflow-y:auto;">
        ${sortedStamps.map((s, i) => {
          let crown = i===0?"👑 ":i===1?"🥈 ":i===2?"🥉 ":"";
          return `<div class="user-item" data-name="${s.name}" style="display:flex; justify-content:space-between; padding:12px 5px; border-bottom:1px solid #eee;">
            <span>${crown}${s.name}</span><b class="count-badge" style="background:var(--sub); color:var(--main); padding:2px 10px; border-radius:15px;">${s.count}</b>
          </div>`
        }).join('')}
      </div>
    </div>

    ${data.displaySettings.links ? `<div class="card" style="border-radius:20px;"><h3>Links</h3><div class="link-grid">${data.links.map(l => `<a href="${l.url}" target="_blank" class="link-btn">${l.label}</a>`).join('')}</div></div>` : ''}
    ${data.displaySettings.event ? `<div class="card" style="text-align:${data.eventAlign}; border-radius:20px;"><h3>Event</h3><p style="white-space:pre-wrap;">${data.eventInfo}</p></div>` : ''}
    
    </div>
    <script>
      const stamps = ${JSON.stringify(data.stamps)};
      const th = ${JSON.stringify(data.thresholds || {silver:10,gold:30,platinum:50,black:100})};
      const topCount = ${topCount};

      function saveMyName(){
        const name = document.getElementById('my-name-input').value;
        if(name){ localStorage.setItem('nanase_name', name); location.reload(); }
      }

      window.onload = () => {
        const saved = localStorage.getItem('nanase_name');
        if(saved){
          const user = stamps.find(s => s.name === saved);
          if(user){
            document.getElementById('my-name-input').value = saved;
            let rank = "BRONZE", cls = "card-bronze";
            if(user.count >= topCount && topCount > 0) { rank = "TOP FAN"; cls = "card-topfan"; }
            else if(user.count >= th.black) { rank = "BLACK"; cls = "card-black"; }
            else if(user.count >= th.platinum) { rank = "PLATINUM"; cls = "card-platinum"; }
            else if(user.count >= th.gold) { rank = "GOLD"; cls = "card-gold"; }
            else if(user.count >= th.silver) { rank = "SILVER"; cls = "card-silver"; }

            document.getElementById('card-display-area').innerHTML = \`
              <div class="member-card \${cls}">
                <div class="card-title">NON BASE</div>
                <div class="card-subtitle">OFFICIAL MEMBER'S CARD</div>
                <div class="card-rank">\${rank}</div>
                <div class="card-count">VISIT: \${user.count}</div>
                <div class="card-name">\${user.name}</div>
              </div>\`;
            document.getElementById('card-display-area').style.display = 'block';
          }
        }
      };

      function filterUser(q){
        document.querySelectorAll('.user-item').forEach(el => {
          el.style.display = el.dataset.name.includes(q) ? 'flex' : 'none';
        });
      }
    </script></body></html>`;
}

async function adminDashboardHtml(data) {
  const sortedAdminStamps = [...data.stamps].sort((a, b) => b.count - a.count);
  const th = data.thresholds || { silver: 10, gold: 30, platinum: 50, black: 100 };

  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>${baseStyle}</style></head>
    <body><div class="container"><h1>Admin</h1>
    
    <div class="acc-item">
      <div class="acc-header" onclick="toggleAcc(this)">⚙️ 各種設定 <span>▼</span></div>
      <div class="acc-content">
        <div class="acc-item"><div class="acc-header" onclick="toggleAcc(this)">🔐 パスワード</div><div class="acc-content"><input type="text" id="password" value="${data.password}"></div></div>
        <div class="acc-item"><div class="acc-header" onclick="toggleAcc(this)">📢 メッセージ</div><div class="acc-content"><textarea id="message" style="width:100%">${data.message}</textarea></div></div>
        <div class="acc-item"><div class="acc-header" onclick="toggleAcc(this)">📅 イベント情報</div><div class="acc-content"><textarea id="eventInfo" style="width:100%">${data.eventInfo}</textarea></div></div>
        <div class="acc-item"><div class="acc-header" onclick="toggleAcc(this)">🔄 表示順序</div><div class="acc-content" id="sort-area">${data.order.map(k=>`<div class="item-row" data-id="${k}"><input type="checkbox" id="check-${k}" ${data.displaySettings[k]?'checked':''}><span>${k}</span><button class="btn-sm btn-outline" onclick="moveUp(this.parentElement)">↑</button><button class="btn-sm btn-outline" onclick="moveDown(this.parentElement)">↓</button></div>`).join('')}</div></div>
        <div class="acc-item"><div class="acc-header" onclick="toggleAcc(this)">🔗 リンク管理</div><div class="acc-content"><div id="link-list">${data.links.map(l=>`<div class="item-row"><input value="${l.label}" class="l-label" style="width:30%"><input value="${l.url}" class="l-url" style="width:40%"><button class="btn-red" onclick="this.parentElement.remove()">×</button></div>`).join('')}</div><button class="btn btn-sm btn-outline" onclick="addLink()">+追加</button></div></div>
        <div class="acc-item"><div class="acc-header" onclick="toggleAcc(this)">🏆 ランク称号設定</div><div class="acc-content">
          <div class="item-row">SILVER: <input type="number" id="th-silver" value="${th.silver}" style="width:60px">個以上</div>
          <div class="item-row">GOLD: <input type="number" id="th-gold" value="${th.gold}" style="width:60px">個以上</div>
          <div class="item-row">PLATINUM: <input type="number" id="th-platinum" value="${th.platinum}" style="width:60px">個以上</div>
          <div class="item-row">BLACK: <input type="number" id="th-black" value="${th.black}" style="width:60px">個以上</div>
        </div></div>
      </div>
    </div>

    <div class="card">
      <h3 style="margin-bottom:10px;">👤 スタンプ管理</h3>
      <input type="text" placeholder="名前検索..." oninput="filterAdmin(this.value)" style="width:100%; margin-bottom:10px;">
      <div id="stamp-list" style="max-height:400px; overflow-y:auto;">
        ${sortedAdminStamps.map(s => `
          <div class="item-row admin-stamp-item">
            <button class="btn-red" onclick="this.parentElement.remove()">×</button>
            <input value="${s.name}" class="s-name" style="flex-grow:1;">
            <button class="btn-sm btn-outline" onclick="this.nextElementSibling.value--">－</button>
            <input type="number" value="${s.count}" class="s-count" style="width:50px; text-align:center;">
            <button class="btn-sm" style="background:var(--main);color:white" onclick="this.previousElementSibling.value++">＋</button>
          </div>`).join('')}
      </div>
      <button class="btn btn-outline" onclick="addStamp()">+ リスナー追加</button>
    </div>

    <button class="btn" onclick="save()">設定を保存</button>
    <a href="/" class="btn btn-outline">サイトを確認する</a>

  </div>
  <script>
    function toggleAcc(el){ const c = el.nextElementSibling; c.style.display = c.style.display==='block'?'none':'block'; event.stopPropagation(); }
    function moveUp(e){ if(e.previousElementSibling) e.parentNode.insertBefore(e, e.previousElementSibling); }
    function moveDown(e){ if(e.nextElementSibling) e.parentNode.insertBefore(e.nextElementSibling, e); }
    function filterAdmin(q){ document.querySelectorAll('.admin-stamp-item').forEach(e=>{ e.style.display=e.querySelector('.s-name').value.includes(q)?'flex':'none'; }); }
    function addLink(){ const d=document.createElement('div'); d.className='item-row'; d.innerHTML='<input class="l-label" style="width:30%"><input class="l-url" style="width:40%"><button class="btn-red" onclick="this.parentElement.remove()">×</button>'; document.getElementById('link-list').appendChild(d); }
    function addStamp(){ const d=document.createElement('div'); d.className='item-row admin-stamp-item'; d.innerHTML='<button class="btn-red" onclick="this.parentElement.remove()">×</button><input class="s-name" style="flex-grow:1"><button class="btn-sm btn-outline" onclick="this.nextElementSibling.value--">－</button><input type="number" value="0" class="s-count" style="width:50px; text-align:center;"><button class="btn-sm" style="background:var(--main);color:white" onclick="this.previousElementSibling.value++">＋</button>'; document.getElementById('stamp-list').prepend(d); }
    
    async function save(){
      const thresholds = {
        silver: parseInt(document.getElementById('th-silver').value),
        gold: parseInt(document.getElementById('th-gold').value),
        platinum: parseInt(document.getElementById('th-platinum').value),
        black: parseInt(document.getElementById('th-black').value)
      };
      const order = [...document.querySelectorAll('#sort-area .item-row')].map(e=>e.dataset.id);
      const displaySettings = {}; order.forEach(id=>{ displaySettings[id]=document.getElementById('check-'+id).checked; });
      const links = [...document.querySelectorAll('#link-list .item-row')].map(e=>({label:e.querySelector('.l-label').value,url:e.querySelector('.l-url').value})).filter(l=>l.label);
      const stamps = [...document.querySelectorAll('#stamp-list .item-row')].map(e=>({name:e.querySelector('.s-name').value,count:parseInt(e.querySelector('.s-count').value)||0})).filter(s=>s.name);
      
      await fetch('/api/update',{method:'POST',body:JSON.stringify({
        password:document.getElementById('password').value,
        message:document.getElementById('message').value,
        eventInfo:document.getElementById('eventInfo').value,
        links,stamps,displaySettings,order,thresholds
      })});
      alert('保存完了！再読み込みします。');
      location.reload();
    }
  </script></body></html>`;
}

function adminLoginHtml() {
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>${baseStyle}</style></head>
    <body><div class="container"><h1>Admin Login</h1><div class="card"><input type="password" id="pass" placeholder="Password" style="width:100%;margin-bottom:10px;"><button class="btn" onclick="login()">Login</button></div></div>
    <script>async function login(){ const res = await fetch('/api/login',{method:'POST',body:JSON.stringify({pass:document.getElementById('pass').value})}); if(res.ok) location.reload(); }</script></body></html>`;
}
