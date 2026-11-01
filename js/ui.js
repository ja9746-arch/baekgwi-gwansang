/* 백귀관상 — 화면
   관상소에 들어와 얼굴을 비추고, 열 장의 첩을 받아 가기까지. */

/* ── 값 ───────────────────────────────────────── */
const PRICE = { now: 9900, list: null };     /* list 는 기념값이 끝난 뒤 실제로 받을 값. 받을 뜻이 없으면 null */
const DEMO_CHECKOUT = true;                  /* 결제대행사를 붙이면 false 로 */
const KEY_PAID = "baekgwi-gwansang-paid";
const KEY_LAST = "baekgwi-gwansang-last";

/* ── 지금 보고 있는 것 ────────────────────────── */
const ST = {
  age: 0, sex: "", img: null,
  F: null, m: null, C: null, R: null, cheop: null,
  paid: false, open: 1
};

/* ── 자잘한 것들 ──────────────────────────────── */
const $  = (s, r)=> (r||document).querySelector(s);
const $$ = (s, r)=> Array.from((r||document).querySelectorAll(s));
const esc = (t)=> String(t==null?"":t).replace(/[&<>"]/g, c=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;" }[c]));
const won = (n)=> n.toLocaleString("ko-KR") + "원";

function go(id){
  $$(".screen").forEach(s=> s.hidden = (s.id !== id));
  document.documentElement.setAttribute("data-scene", id);
  window.scrollTo({ top:0, behavior:"instant" });
  const s = $("#"+id);
  if (!s) return;
  /* 화면이 넘어갈 때마다 스미는 결을 다시 틉니다.
     이걸 안 하면 다음 일이 무거울 때(얼굴 읽기 같은) 결이 틔지 못하고
     화면이 투명한 채로 멈춥니다. */
  s.style.animation = "none"; void s.offsetHeight; s.style.animation = "";
  s.dispatchEvent(new CustomEvent("enter"));
}
/* 그림이 한 번 그려질 틈을 줍니다 */
const breathe = ()=> new Promise(r=> requestAnimationFrame(()=> requestAnimationFrame(()=> setTimeout(r, 30))));
function toast(msg){
  let t = $("#toast");
  if(!t){ t = document.createElement("div"); t.id="toast"; t.className="toast"; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("on");
  clearTimeout(t._t); t._t = setTimeout(()=> t.classList.remove("on"), 2600);
}

/* ── 들머리 ───────────────────────────────────── */
function bindIntro(){
  $("#go-ask").addEventListener("click", ()=> go("s-ask"));
}

/* ── 나이와 성별 ────────────────────────────────
   묻기만 하고 가만히 있으면 손님은 신청서를 쓰는 기분이 됩니다.
   나이를 고르시는 동안 그 나이가 걸리는 자리를 바로 읽어 드립니다.
   아직 얼굴을 보지 않았으니 자리 이름과 맡은 일까지만 말합니다. */
function bindAsk(){
  const age = $("#age"), ok = $("#ask-ok");
  const now = $("#age-now"), pae = $("#yunpae");
  const bu = $("#yun-bu"), mal = $("#yun-mal"), note = $("#segnote");
  const sexes = $$("[data-sex]");

  function check(){
    const a = parseInt(age.value, 10);
    ok.disabled = !(a >= 14 && a <= 90 && ST.sex);
  }
  function drawAge(){
    const a = parseInt(age.value,10) || 33;
    ST.age = a;
    now.innerHTML = a + "<i>세</i>";
    age.setAttribute("aria-valuetext", a + "세");
    /* 유년운기부위 — 남좌여우는 성별을 고르셔야 갈리니, 아직이면 남자 자로 봅니다 */
    try{
      const y = yunOf(a, ST.sex || "남");
      const g = (typeof GUNG !== "undefined") && GUNG.find(G=>G.k === y.g);
      if (g){
        bu.textContent = g.n + "(" + g.h + ")";
        mal.textContent = y.bu + " — " + g.d + " 쪽을 맡는 자리입니다.";
        pae.classList.add("on");
      }
    }catch(e){ pae.classList.remove("on"); }
    check();
  }
  age.addEventListener("input", drawAge);
  drawAge();

  sexes.forEach(b=> b.addEventListener("click", ()=>{
    ST.sex = b.dataset.sex;
    sexes.forEach(x=> x.setAttribute("aria-pressed", String(x===b)));
    note.textContent = ST.sex === "남"
      ? "남좌여우(男左女右) — 자네는 남자이니 짝이 있는 여덟 자리는 몸의 왼쪽으로 봅니다."
      : "남좌여우(男左女右) — 자네는 여자이니 짝이 있는 여덟 자리는 몸의 오른쪽으로 봅니다.";
    drawAge();
  }));
  ok.addEventListener("click", ()=> go("s-mirror"));
}

/* ── 거울 — 얼굴 비추기 ───────────────────────── */
function bindMirror(){
  const file = $("#file"), shot = $("#shot"), pick = $("#pick");
  const hole = $("#hole"), note = $("#mirror-note");

  const take = (inp)=> inp.addEventListener("change", ()=>{
    const f = inp.files && inp.files[0];
    if(!f) return;
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = ()=>{ ST.img = img; URL.revokeObjectURL(url); look(); };
    img.onerror = ()=>{ URL.revokeObjectURL(url); note.textContent = "그림을 열지 못했습니다. 다른 사진으로 해 보시겠어요?"; };
    img.src = url;
    inp.value = "";
  });
  take(file); take(shot);
  pick.addEventListener("click", ()=> file.click());
  $("#snap").addEventListener("click", ()=> shot.click());
  /* 거울을 눌러도 사진첩이 열립니다 — 거기를 먼저 누르시니까요 */
  hole.addEventListener("click", ()=> file.click());

  async function look(){
    note.textContent = "";
    go("s-read");
    await breathe();          /* 화면이 먼저 떠야 합니다 */
    await read();
  }
}

/* ── 얼굴을 읽습니다 ──────────────────────────── */
async function read(){
  const bar = $("#readbar"), say = $("#read-say"), cv = $("#readcv");
  const step = (t, p)=>{ say.textContent = t; bar.style.width = p + "%"; };

  showRaw(cv, ST.img, false);
  step("거울을 닦고 있습니다…", 6);
  await breathe();

  /* 얼굴 읽는 눈은 처음 한 번만 받아 둡니다. 그동안 멈춘 것처럼 보이지 않게
     걸음을 조금씩 옮겨 둡니다. */
  let pct = 6, alive = true;
  const 느림 = setTimeout(()=>{ if(alive) step("얼굴 읽는 눈을 뜨고 있습니다… 처음 한 번만 받습니다.", pct); }, 1800);
  const 걸음 = setInterval(()=>{ if(!alive) return; pct = Math.min(30, pct + 1.4); bar.style.width = pct + "%"; }, 700);

  let r;
  try { r = await readFace(ST.img); }
  catch(e){ r = { err:"얼굴을 읽는 기계를 못 깨웠습니다", net:true }; }
  alive = false; clearInterval(걸음); clearTimeout(느림);

  if (!r.ok){
    step(r.err, 100);
    $("#read-again").hidden = false;
    $("#read-tip").textContent = r.net
      ? "그물이 끊겼습니다. 잠시 뒤에 다시 해 주세요."
      : (r.err.indexOf("못 찾") >= 0
          ? "얼굴 전체가 들어오게, 밝은 데서 한 장만 다시 주세요. 모자나 선글라스는 벗으시고요."
          : "조금 더 밝은 데서 한 장만 다시 주세요.");
    if (r.canvas && r.F) drawFace(cv, r.canvas, r.F, true);
    else showRaw(cv, ST.img, true);
    return;
  }

  ST.F = r.F; ST.m = r.m; ST.note = r.note; ST.word = r.word;
  drawFace(cv, r.canvas, r.F, false);

  step("삼정과 오악을 재고 있습니다…", 34);
  await sleep(420);
  ST.C = readClues(r.F);

  step("열두 자리의 빛을 보고 있습니다…", 62);
  await sleep(420);
  ST.R = divine(r.m, ST.age, ST.sex);

  step("백 가지 가운데 자네 얼굴의 것을 고르고 있습니다…", 84);
  await sleep(420);
  ST.cheop = makeCheop(ST.R, ST.C, ST.age, ST.sex);
  /* 지난번에 오셨다면 그때와 견주어 둡니다 */
  try { ST.prev = compareReading(loadReading(), ST.R); } catch(e){ ST.prev = null; }
  saveReading(ST.R);

  step(`자네 얼굴에서 ${ST.C.count} 자리가 섰네.`, 100);
  await sleep(700);
  renderFree();
  go("s-free");
}
const sleep = (ms)=> new Promise(r=> setTimeout(r, ms));

/* 그림을 거울에 그대로 띄웁니다. 얼굴을 읽기 전에도, 못 읽었을 때도
   손님이 올린 것이 보여야 합니다. 검은 네모만 보이면 기다리지 않습니다. */
function showRaw(cv, img, dim){
  const W = 620, H = Math.round(W*4/3);
  cv.width = W; cv.height = H;
  const g = cv.getContext("2d");
  g.fillStyle = "#0b0607"; g.fillRect(0,0,W,H);
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  if (iw && ih){
    const k = Math.max(W/iw, H/ih);
    const w = iw*k, h = ih*k;
    try { g.drawImage(img, (W-w)/2, (H-h)/2, w, h); } catch(e){}
  }
  g.fillStyle = dim ? "rgba(10,5,7,.62)" : "rgba(10,5,7,.34)";
  g.fillRect(0,0,W,H);
}

/* ── 거울 안에 얼굴을 그립니다 ──────────────────
   얼굴 자리에 맞춰 잘라 키우고, 관상이 보는 자리를 점과 줄로 얹습니다.
   손님이 "아, 진짜 내 얼굴을 보고 있구나" 하고 아시게. */
function drawFace(cv, src, F, dim){
  const W = 620, H = Math.round(W * 4 / 3);
  cv.width = W; cv.height = H;
  const g = cv.getContext("2d");
  g.fillStyle = "#0b0607"; g.fillRect(0,0,W,H);

  /* 얼굴이 화폭을 꽉 채우게 잘라 옵니다 */
  let sx=0, sy=0, sw=src.width, sh=src.height;
  if (F){
    const xs = OVAL.map(i=>F.rawAll[i].x), ys = OVAL.map(i=>F.rawAll[i].y);
    const x0=Math.min.apply(null,xs), x1=Math.max.apply(null,xs);
    const y0=Math.min.apply(null,ys), y1=Math.max.apply(null,ys);
    const fw=x1-x0, fh=y1-y0;
    const cx=(x0+x1)/2, cy=(y0+y1)/2 - fh*0.06;
    let w = fw*1.62, h = w*4/3;
    if (h < fh*1.34){ h = fh*1.34; w = h*3/4; }
    sx = cx - w/2; sy = cy - h/2; sw = w; sh = h;
  }
  const k = W / sw;
  g.save();
  g.translate(-sx*k, -sy*k); g.scale(k, k);
  try { g.drawImage(src, 0, 0); } catch(e){}
  g.restore();
  if (dim){ g.fillStyle = "rgba(10,5,7,.6)"; g.fillRect(0,0,W,H); return; }
  if (!F) return;

  const pt = (i)=>({ x:(F.rawAll[i].x - sx)*k, y:(F.rawAll[i].y - sy)*k });

  /* 얼굴 바깥을 살짝 눌러 얼굴만 떠오르게 */
  g.save();
  g.beginPath(); g.rect(0,0,W,H);
  OVAL.forEach((i,n)=>{ const q=pt(i); n ? g.lineTo(q.x,q.y) : g.moveTo(q.x,q.y); });
  g.closePath();
  g.fillStyle = "rgba(10,5,7,.42)"; g.fill("evenodd");
  g.restore();

  g.save();
  g.shadowColor = "rgba(255,214,140,.85)"; g.shadowBlur = 9;

  /* 얼굴 둘레 */
  g.strokeStyle = "rgba(240,210,150,.9)"; g.lineWidth = 2;
  g.beginPath();
  OVAL.forEach((i,n)=>{ const q=pt(i); n ? g.lineTo(q.x,q.y) : g.moveTo(q.x,q.y); });
  g.closePath(); g.stroke();

  /* 삼정을 가르는 줄 — 발제·인당·준두·지각 */
  const 인당=pt(P.인당), 준두=pt(P.준두), 턱=pt(P.턱끝), 이마=pt(P.이마꼭지);
  const 발제 = { x:이마.x, y:이마.y - (인당.y-이마.y)*0.92 };
  g.strokeStyle = "rgba(232,195,119,.62)"; g.lineWidth = 1.3;
  g.setLineDash([7,6]);
  [발제, 인당, 준두, 턱].forEach(q=>{
    g.beginPath(); g.moveTo(W*0.10, q.y); g.lineTo(W*0.90, q.y); g.stroke();
  });
  g.setLineDash([]);

  /* 가운뎃줄 */
  g.strokeStyle = "rgba(232,195,119,.5)"; g.lineWidth = 1.2;
  g.beginPath();
  [P.이마꼭지,P.인당,P.산근,P.준두,P.윗입술,P.턱끝].forEach((i,n)=>{
    const q=pt(i); n ? g.lineTo(q.x,q.y) : g.moveTo(q.x,q.y);
  });
  g.stroke();

  /* 눈썹·눈·코·입의 테두리 */
  const 줄 = [
    [P.미두왼,P.미중왼,P.미미왼], [P.미두오른,P.미중오른,P.미미오른],
    [P.눈머리왼,P.눈위왼,P.눈꼬리왼,P.눈아래왼,P.눈머리왼],
    [P.눈머리오른,P.눈위오른,P.눈꼬리오른,P.눈아래오른,P.눈머리오른],
    [P.콧방울왼,P.준두,P.콧방울오른],
    [P.입꼬리왼,P.윗입술,P.입꼬리오른,P.아랫입술,P.입꼬리왼]
  ];
  g.strokeStyle = "rgba(255,226,170,.78)"; g.lineWidth = 1.5;
  줄.forEach(line=>{
    g.beginPath();
    line.forEach((i,n)=>{ const q=pt(i); n ? g.lineTo(q.x,q.y) : g.moveTo(q.x,q.y); });
    g.stroke();
  });

  /* 관상이 보는 자리 — 점 */
  g.fillStyle = "rgba(255,236,196,.95)";
  for (const key in P){
    const q = pt(P[key]);
    g.beginPath(); g.arc(q.x, q.y, 2.4, 0, 7); g.fill();
  }
  g.restore();
}

/* ── 단서 한 줄 ───────────────────────────────── */
function clueChip(e){
  const g = e.g > 0 ? "ok" : (e.g < 0 ? "bad" : "mid");
  return `<li class="cl g${g}"><b>${esc(e.n)}</b><span>${esc(e.s)}</span></li>`;
}

/* ── 무료로 보여 드리는 것 ────────────────────── */
function renderFree(){
  const R = ST.R, C = ST.C;
  $("#free-count").textContent = C.count;
  const w = $("#read-word"); if (w) w.textContent = ST.word || "";
  $("#free-head").innerHTML =
    `자네 얼굴은 <b>${esc(R.hyeong)}형(${esc(OH[R.hyeong].ja)})</b>의 그릇에 ` +
    `<b>${esc(R.gisaek)}기(${esc(GISAEK[R.gisaek].ja)})</b>가 도는 얼굴일세. ` +
    `열두 자리 가운데 트인 데가 <b>${R.opened}</b>, 막힌 데가 <b>${R.blocked}</b>이고.`;

  /* 얼굴에서 실제로 잡힌 자리 */
  $("#free-clues").innerHTML = C.list.slice(0, 8).map(h=>clueChip({
    n:h.c.n, s:h.c.s, g:h.c.g
  })).join("");
  $("#free-clue-more").textContent = C.count > 8 ? `그 밖에 ${C.count - 8} 자리가 더 섰습니다.` : "";

  /* 첩 목록 — 두루마리로. 앞의 둘만 열고 나머지는 봉인합니다. */
  const list = sealCheop(ST.cheop);
  const fpara = (b)=> `<h4>${esc(b.h)}</h4>` + (b.p ? `<p>${esc(b.p)}</p>` : "") +
    (b.list ? `<ul class="jari">` + b.list.map(x=>
      `<li${x.g>0?' class="gok"':x.g<0?' class="gbad"':''}><b>${esc(x.t)}</b><span>${esc(x.d)}</span></li>`
    ).join("") + `</ul>` : "");

  /* 열 장을 모두 내어 놓습니다. 먼저 열어 드리는 두 장은 절반까지 읽히고,
     봉인된 여덟 장은 첫 마디가 흐린 채로 보입니다. 무엇이 적혀 있는지는
     보이고 읽히지는 않습니다. */
  const veilBlock = (c)=>{
    if (!c.veil || !c.veil.length) return "";
    const inner = c.veil.map(fpara).join("");
    const n = c.more || c.veil.length;
    return `<div class="veil">
      <div class="veiled" aria-hidden="true">${inner}</div>
      <div class="veilsay"><i class="vlock" aria-hidden="true"></i>
        <b>${c.sealed ? "봉인" : "이 뒤로 " + n + "마디"}</b>
        <span>${c.sealed ? "복채를 내시면 이 첩이 풀립니다" : "복채를 내시면 끝까지 읽힙니다"}</span>
      </div>
    </div>`;
  };

  $("#free-cheop").innerHTML = list.map((c)=>{
    const art = `img/cheop/c${String(c.no).padStart(2,"0")}.webp`;
    const tag = c.sealed
      ? `<span class="seal" aria-hidden="true">封</span>`
      : `<span class="free">무료</span>`;
    return `<article class="cp ${c.sealed ? "shut" : "open"}">
      <div class="cph"><img src="${art}" alt="" loading="lazy">${tag}</div>
      <div class="cpt"><span class="no">제${c.no}첩</span><h3>${esc(c.title)}</h3><p>${esc(c.sub)}</p></div>
      <div class="cpb">${c.body.map(fpara).join("")}${veilBlock(c)}</div>
    </article>`;
  }).join("");

  /* 지난번과 견주기 */
  const pv = $("#free-prev");
  if (pv){
    const P = ST.prev;
    if (P && P.days >= 1 && (P.better.length || P.worse.length)){
      const 날 = P.days < 30 ? `${P.days}일 만에`
               : P.days < 365 ? `${Math.round(P.days/30)}달 만에`
               : `${Math.round(P.days/365)}해 만에`;
      pv.hidden = false;
      pv.innerHTML = `<span class="gt">지난번과 견주면</span>` +
        `<p class="agoline">${esc(날)} 다시 오셨습니다. 얼굴은 해마다 달라집니다.</p>` +
        (P.better.length ? `<ul class="cmp up">` + P.better.map(x=>
          `<li><b>${esc(x.n)}</b><span>${["트임","반반","막힘"][x.from]} → ${["트임","반반","막힘"][x.to]}</span></li>`).join("") + `</ul>` : "") +
        (P.worse.length ? `<ul class="cmp down">` + P.worse.map(x=>
          `<li><b>${esc(x.n)}</b><span>${["트임","반반","막힘"][x.from]} → ${["트임","반반","막힘"][x.to]}</span></li>`).join("") + `</ul>` : "") +
        (P.gisaekMoved ? `<p class="agoline">도는 기운이 ${esc(P.prevGisaek)}기에서 ${esc(ST.R.gisaek)}기로 바뀌었습니다.</p>` : "") +
        (P.bossMoved ? `<p class="agoline">올해를 쥐는 자리도 ${esc(P.prevBoss.n||P.prevBoss.k)}에서 ${esc(ST.R.boss.g.n)}으로 넘어갔습니다.</p>` : "");
    } else pv.hidden = true;
  }

  $("#free-tease").textContent =
    ST.R.blocked >= 3
      ? "아직 열지 않은 첩에 막힌 자리의 까닭이 적혀 있습니다. 그 자리를 모르고 지나시면 올해가 그대로 갑니다."
      : "아직 열지 않은 첩에 자네가 쥐고 있으면서 모르는 것이 적혀 있습니다.";
}

/* ── 복채 ─────────────────────────────────────── */
function bindPay(){
  $("#to-pay").addEventListener("click", ()=> go("s-pay"));
  $("#pay-price").innerHTML =
    (PRICE.list ? `<del>${won(PRICE.list)}</del>` : "") +
    `${won(PRICE.now)}`;
  $("#pay-now").addEventListener("click", async ()=>{
    const ok = await openCheckout(PRICE.now);
    if (!ok){ toast("복채를 받지 못했습니다."); return; }
    ST.paid = true;
    try { localStorage.setItem(KEY_PAID, "1"); } catch(e){}
    renderCheop();
    go("s-cheop");
  });
}

/* 결제대행사를 여기 한 군데만 갈아 끼우면 됩니다.
   성공이면 true, 취소·실패면 false 를 돌려주세요. */
async function openCheckout(amount){
  if (DEMO_CHECKOUT){
    return confirm(`복채 ${won(amount)}\n\n(아직 결제를 붙이기 전입니다. 확인을 누르시면 전부 열립니다.)`);
  }
  return false;
}

/* ── 열 장을 모두 ─────────────────────────────── */
function renderCheop(){
  const wrap = $("#cheop-all");
  wrap.innerHTML = ST.cheop.map(c=>{
    const art = `img/cheop/c${String(c.no).padStart(2,"0")}.webp`;
    const para = (b)=> `<h4>${esc(b.h)}</h4>` + (b.p ? `<p>${esc(b.p)}</p>` : "") +
      (b.list ? `<ul class="jari">` + b.list.map(x=>
        `<li${x.g>0?' class="gok"':x.g<0?' class="gbad"':''}><b>${esc(x.t)}</b><span>${esc(x.d)}</span></li>`
      ).join("") + `</ul>` : "");
    let inner = c.body.map(para).join("");

    if (c.key === "십이궁" && c.jari){
      inner += `<div class="ggungs">` + c.jari.map(j=>`
        <div class="gu gl${j.lv}${j.boss?" gboss":""}">
          <div class="guh"><b>${esc(j.n)}</b><span>${esc(j.bu)}</span>
            <i class="lv">${["트임","반반","막힘"][j.lv]}</i>${j.boss?'<i class="bs">올해</i>':""}</div>
          <p class="dx">${esc(j.dx)}</p>
          <p class="rd">${esc(j.rd)}</p>
          <p class="ac">${esc(j.ac)}</p>
          <div class="gw"><img src="${esc(j.gwi.img)}" alt="" loading="lazy">
            <span>${esc(j.gwi.n)}${j.gwi.h?` <i>${esc(j.gwi.h)}</i>`:""}</span></div>
        </div>`).join("") + `</div>`;
    }

    if (c.key === "백귀" && c.gwi){
      inner += `<div class="gwis">` + c.gwi.map(g=>`
        <div class="gwc">
          <div class="rk">제${g.rank}귀</div>
          <img src="${esc(g.g.img)}" alt="" loading="lazy">
          <h5>${esc(g.g.n)}${g.g.h?` <i>${esc(g.g.h)}</i>`:""}</h5>
          <p class="why">${esc(g.근거)}</p>
          <p class="gsay">${esc(g.말)}</p>
          <div class="two">
            <div class="gt gok"><b>복(福)</b><span>${esc(g.두얼굴[0].t)}</span></div>
            <div class="gt gbad"><b>흉(凶)</b><span>${esc(g.두얼굴[1].t)}</span></div>
          </div>
        </div>`).join("") + `</div>`;
    }

    if (c.key === "처방"){
      inner += `<div class="gcure">
        <h5>점 찍을 자리</h5>
        <ul class="moles">` + c.jeom.map(j=>`<li><b>${esc(j.t)}</b><span>${esc(j.w)}</span></li>`).join("") + `</ul>
        <h5>길한 색</h5>
        <ul class="cols">` + c.gil.map(g=>`<li><i style="background:${esc(g[1])}"></i><b>${esc(g[0])}</b><span>${esc(g[2])} — ${esc(g[3])}</span></li>`).join("") +
        `<li class="gno"><i style="background:${esc(c.hyung[1])}"></i><b>${esc(c.hyung[0])}</b><span>${esc(c.hyung[2])}</span></li></ul>
        <h5>머리</h5>
        <p class="mori"><b>${esc(c.mori[0])}</b> ${esc(c.mori[1])}</p>
      </div>`;
    }

    if (c.key === "밀서"){
      inner += `<div class="last">
        <div class="gverd"><span>올해</span><b>${esc(c.verdict)}</b></div>
        <h5>올해 할 일 셋</h5><ol class="todo">` +
        c.todo.map(t=>`<li><b>${esc(t.n)}</b> ${esc(t.t)}</li>`).join("") + `</ol>
        <h5>피할 것 둘</h5><ol class="gavoid">` +
        c.avoid.map(t=>`<li><b>${esc(t.n)}</b> ${esc(t.t)}</li>`).join("") + `</ol>
        <p class="gwhen">움직일 달은 <b>${esc((c.go||[]).join("·"))}</b>, 멈출 달은 <b>${esc((c.stop||[]).join("·"))}</b>입니다.</p>
      </div>`;
    }

    const ev = (c.ev||[]).length
      ? `<div class="evid"><span class="gt">이 첩의 근거</span><ul class="cls">` +
        c.ev.map(clueChip).join("") + `</ul></div>`
      : "";

    return `<article class="cp open full">
      <div class="cph"><img src="${art}" alt="" loading="lazy"></div>
      <div class="cpt"><span class="no">제${c.no}첩</span><h3>${esc(c.title)}</h3><p>${esc(c.sub)}</p></div>
      <div class="cpb">${inner}
        ${c.si ? `<div class="si"><span>시기</span><p>${esc(c.si)}</p></div>` : ""}
        ${c.act ? `<div class="act"><span>풀 길</span><p>${esc(c.act)}</p></div>` : ""}
        ${ev}
      </div></article>`;
  }).join("");
}

/* ── 다시 보기 ────────────────────────────────── */
function bindMisc(){
  $("#read-again").addEventListener("click", ()=>{
    $("#read-again").hidden = true; $("#read-tip").textContent = "";
    go("s-mirror");
  });
  $$("[data-go]").forEach(b=> b.addEventListener("click", ()=> go(b.dataset.go)));
  try { ST.paid = localStorage.getItem(KEY_PAID) === "1"; } catch(e){}
}

/* ── 시작 ─────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", ()=>{
  bindIntro(); bindAsk(); bindMirror(); bindPay(); bindMisc();
  /* 얼굴 읽는 기계를 미리 깨워 둡니다 — 손님이 사진을 고르는 동안 */
  setTimeout(()=>{ try { wakeMesh(); } catch(e){} }, 1200);
});
