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
        thresholds: { silver: 10, gold: 30, platinum: 50, black: 100 },
        displaySettings: { message: true, event: true, links: true, stamps: true }
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
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: sans-serif; }
  body { background: #fdfdfd; color: var(--text); padding-bottom: 80px; }
  .container { width: 100%; max-width: 500px; margin: 0 auto; padding: 15px; }
  
  .member-card { width: 100%; aspect-ratio: 1.6 / 1; border-radius: 20px; padding: 25px; position: relative; color: white; margin-bottom: 20px; box-shadow: 0 8px 15px rgba(0,0,0,0.15); }
  .card-bronze { background: linear-gradient(135deg, #804a00, #3d2300); }
  .card-silver { background: linear-gradient(135deg, #a0a0a0, #4a4a4a); }
  .card-gold { background: linear-gradient(135deg, #d4af37, #7a5f00); }
  .card-platinum { background: linear-gradient(135deg, #e5e4e2, #7d7d7d); }
  .card-black { background: linear-gradient(135deg, #333, #000); }
  .card-topfan { background: linear-gradient(135deg, #ff00cc, #3333ff); animation: shine 3s infinite; }
  @keyframes shine { 0% { filter: hue-rotate(0deg); } 100% { filter: hue-rotate(360deg); } }

  .card-title { font-size: 1.6rem; font-weight: 900; letter-spacing: 3px; }
  .card-name { position: absolute; bottom: 30px; left: 25px; font-size: 1.8rem; font-weight: bold; }
  .card-rank { position: absolute; top: 25px; right: 25px; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 15px; font-size: 0.8rem; font-weight: bold; }
  .card-count { position: absolute; top: 60px; right: 25px; font-size: 0.9rem; font-weight: bold; }

  .marquee-container { background: var(--sub); color: var(--main); padding: 12px 0; overflow: hidden; white-space: nowrap; margin-bottom: 15px; border-radius: 12px; font-weight: bold; }
  .marquee-text { display: inline-block; padding-left: 100%; animation: marquee 15s linear infinite; }
  @keyframes marquee { 0% { transform: translate(0, 0); } 100% { transform: translate(-100%, 0); } }

  .link-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 15px; }
  .link-btn { background: var(--main); color: white; text-decoration: none; padding: 10px 4px; border-radius: 8px; text-align: center; font-weight: bold; font-size: 0.7rem; display: flex; align-items: center; justify-content: center; min-height: 44px; }

  .card { background: var(--white); border-radius: 16px; padding: 15px; margin-bottom: 15px; border: 1px solid var(--border); }
  .item-row { display: flex; align-items: center; gap: 8px; background: #fafafa; padding: 10px; border-radius: 10px; margin-bottom: 8px; border: 1px solid #eee; }
  .btn { display: flex; align-items: center; justify-content: center; width: 100%; min-height: 48px; background: var(--main); color: white; border-radius: 12px; font-weight: bold; border: none; cursor: pointer; text-decoration: none; }
  .btn-sm { min-height: 32px; padding: 0 10px; font-size: 0.8rem; width: auto; margin: 0; }
  .btn-red { background: var(--red); color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border:none; cursor:pointer; font-weight:bold; }
  input, textarea { padding: 8px; border-radius: 8px; border: 1px solid #ddd; width: 100%; }
`;

async function mainPortalHtml(data) {
  const sortedStamps = [...data.stamps].sort((a, b) => b.count - a.count);
  const topCount = sortedStamps.length > 0 ? sortedStamps[0].count : 0;

  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>${baseStyle}</style><title>NANASE BASE</title></head>
    <body><div class="container">
    <h1 style="color:var(--main);text-align:center;margin:10px 0 20px 0; letter-spacing:0.1em;">NANASE BASE</h1>
    
    ${data.displaySettings.message ? `<div class="marquee-container"><div class="marquee-text">${data.message}</div></div>` : ''}

    ${data.displaySettings.event ? `<div class="card" style="text-align:${data.eventAlign || 'center'};">
      <h3 style="font-size:0.9rem; color:var(--main); margin-bottom:5px;">EVENT INFO</h3>
      <p style="white-space:pre-wrap;">${data.eventInfo}</p>
    </div>` : ''}

    ${data.displaySettings.links ? `<div class="link-grid">${data.links.map(l => `<a href="${l.url}" target="_blank" class="link-btn">${l.label}</a>`).join('')}</div>` : ''}

    <div id="my-stamp-section" class="card" style="background:#fcfcfc; border:1px dashed #bbb;">
        <div style="display:flex; gap:5px; margin-bottom:10px;">
          <input type="text" id="my-name-input" placeholder="名前を入力してカードを表示">
          <button class="btn btn-sm" onclick="saveMyName()">表示</button>
        </div>
        <div id="card-display-area" style="display:none;"></div>
    </div>

    <div class="card">
      <h3 style="margin-bottom:10px; font-size:1rem; color:var(--main);">RANKING</h3>
      <input type="text" placeholder="名前で検索..." oninput="filterUser(this.value)" style="margin-bottom:10px;">
      <div style="max-height:400px; overflow-y:auto;">
        ${sortedStamps.map((s, i) => {
          let crown = i===0?"👑 ":i===1?"🥈 ":i===2?"🥉 ":"";
          return `<div class="user-item" data-name="${s.name}" style="display:flex; justify-content:space-between; padding:10px 5px; border-bottom:1px solid #f0f0f0;">
            <span>${crown}${s.name}</span><b style="color:var(--main);">${s.count}</b>
          </div>`
        }).join('')}
      </div>
    </div>
    
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
  const sortedStamps = [...data.stamps].sort((a, b) => b.count - a.count);
  const th = data.thresholds || { silver: 10, gold: 30, platinum: 50, black: 100 };

  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>${baseStyle}</style></head>
    <body><div class="container"><h1>Admin</h1>
    
    <div class="acc-item">
      <div class="acc-header" onclick="toggleAcc(this)">⚙️ 各種設定 <span>▼</span></div>
      <div class="acc-content">
        <div class="acc-item"><div class="acc-header" onclick="toggleAcc(this)">🔐 パスワード</div><div class="acc-content"><input type="text" id="password" value="${data.password}"></div></div>
        <div class="acc-item"><div class="acc-header" onclick="toggleAcc(this)">📢 メッセージ</div><div class="acc-content"><textarea id="message">${data.message}</textarea></div></div>
        <div class="acc-item"><div class="acc-header" onclick="toggleAcc(this)">📅 イベント情報</div><div class="acc-content">
          <textarea id="eventInfo" style="margin-bottom:10px;">${data.eventInfo}</textarea>
          <div style="display:flex; gap:10px; align-items:center;">
            配置：
            <button class="btn-sm ${data.eventAlign==='left'?'':'btn-outline'}" onclick="setAlign('left',this)">左揃え</button>
            <button class="btn-sm ${data.eventAlign==='center'?'':'btn-outline'}" onclick="setAlign('center',this)">中央揃え</button>
            <input type="hidden" id="eventAlign" value="${data.eventAlign || 'center'}">
          </div>
        </div></div>
        <div class="acc-item"><div class="acc-header" onclick="toggleAcc(this)">🔗 リンク管理 (4列表示)</div><div class="acc-content"><div id="link-list">${data.links.map(l=>`<div class="item-row"><input value="${l.label}" class="l-label" placeholder="表示名"><input value="${l.url}" class="l-url" placeholder="URL"><button class="btn-red" onclick="this.parentElement.remove()">×</button></div>`).join('')}</div><button class="btn btn-sm btn-outline" onclick="addLink()">+ リンク追加</button></div></div>
        <div class="acc-item"><div class="acc-header" onclick="toggleAcc(this)">🏆 ランクしきい値</div><div class="acc-content">
          銀: <input type="number" id="th-silver" value="${th.silver}" style="width:60px"> 金: <input type="number" id="th-gold" value="${th.gold}" style="width:60px"><br><br>
          白金: <input type="number" id="th-platinum" value="${th.platinum}" style="width:60px"> 黒: <input type="number" id="th-black" value="${th.black}" style="width:60px">
        </div></div>
      </div>
    </div>

    <div class="card">
      <h3>👤 リスナー管理 (多い順)</h3>
      <input type="text" placeholder="名前検索..." oninput="filterAdmin(this.value)" style="margin-bottom:10px;">
      <div id="stamp-list">
        ${sortedStamps.map(s => `
          <div class="item-row admin-stamp-item">
            <button class="btn-red" onclick="this.parentElement.remove()">×</button>
            <input value="${s.name}" class="s-name" style="flex-grow:1;">
            <button class="btn-sm btn-outline" onclick="this.nextElementSibling.value--">－</button>
            <input type="number" value="${s.count}" class="s-count" style="width:55px; text-align:center;">
            <button class="btn-sm" style="background:var(--main);color:white" onclick="this.previousElementSibling.value++">＋</button>
          </div>`).join('')}
      </div>
      <button class="btn btn-outline" onclick="addStamp()">+ リスナー新規追加</button>
    </div>

    <button class="btn" onclick="save()">設定をすべて保存</button>
    <a href="/" class="btn btn-outline" style="margin-top:10px;">ユーザーページを確認する</a>

  </div>
  <script>
    function toggleAcc(el){ const c = el.nextElementSibling; c.style.display = c.style.display==='block'?'none':'block'; event.stopPropagation(); }
    function setAlign(v, btn){ 
        document.getElementById('eventAlign').value = v; 
        btn.parentElement.querySelectorAll('button').forEach(b => b.classList.add('btn-outline'));
        btn.classList.remove('btn-outline');
    }
    function filterAdmin(q){ document.querySelectorAll('.admin-stamp-item').forEach(e=>{ e.style.display=e.querySelector('.s-name').value.includes(q)?'flex':'none'; }); }
    function addLink(){ const d=document.createElement('div'); d.className='item-row'; d.innerHTML='<input class="l-label"><input class="l-url"><button class="btn-red" onclick="this.parentElement.remove()">×</button>'; document.getElementById('link-list').appendChild(d); }
    function addStamp(){ const d=document.createElement('div'); d.className='item-row admin-stamp-item'; d.innerHTML='<button class="btn-red" onclick="this.parentElement.remove()">×</button><input class="s-name" style="flex-grow:1"><button class="btn-sm btn-outline" onclick="this.nextElementSibling.value--">－</button><input type="number" value="0" class="s-count" style="width:55px; text-align:center;"><button class="btn-sm" style="background:var(--main);color:white" onclick="this.previousElementSibling.value++">＋</button>'; document.getElementById('stamp-list').prepend(d); }
    
    async function save(){
      const thresholds = {
        silver: parseInt(document.getElementById('th-silver').value),
        gold: parseInt(document.getElementById('th-gold').value),
        platinum: parseInt(document.getElementById('th-platinum').value),
        black: parseInt(document.getElementById('th-black').value)
      };
      const links = [...document.querySelectorAll('#link-list .item-row')].map(e=>({label:e.querySelector('.l-label').value,url:e.querySelector('.l-url').value})).filter(l=>l.label);
      const stamps = [...document.querySelectorAll('#stamp-list .item-row')].map(e=>({name:e.querySelector('.s-name').value,count:parseInt(e.querySelector('.s-count').value)||0})).filter(s=>s.name);
      
      await fetch('/api/update',{method:'POST',body:JSON.stringify({
        password:document.getElementById('password').value,
        message:document.getElementById('message').value,
        eventInfo:document.getElementById('eventInfo').value,
        eventAlign:document.getElementById('eventAlign').value,
        links,stamps,thresholds,
        displaySettings: { message: true, event: true, links: true, stamps: true }
      })});
      alert('保存しました！');
      location.reload();
    }
  </script></body></html>`;
}

function adminLoginHtml() {
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>${baseStyle}</style></head>
    <body><div class="container"><h1>Login</h1><div class="card"><input type="password" id="pass" placeholder="PW"><button class="btn" onclick="login()">Login</button></div></div>
    <script>async function login(){ const res = await fetch('/api/login',{method:'POST',body:JSON.stringify({pass:document.getElementById('pass').value})}); if(res.ok) location.reload(); }</script></body></html>`;
}
