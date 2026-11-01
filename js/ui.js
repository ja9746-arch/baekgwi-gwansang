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
window.ST = ST;   /* 검사할 때 들여다보려고 내어 둡니다 */

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
/* ── 배경음 ──────────────────────────────────────
   처음에는 꺼져 있습니다. 소리를 손님이 먼저 청하지 않았는데
   울리는 것은 무례합니다. 켜고 끈 것은 기기에 적어 둡니다. */
function bindSound(){
  const b = $("#snd");
  if (!b || typeof Sound === "undefined") { if(b) b.hidden = true; return; }
  const 적기 = (on)=>{ try{ localStorage.setItem("baekgwi-gwansang-snd", on?"1":"0"); }catch(e){} };
  b.addEventListener("click", ()=>{
    const on = Sound.toggle();
    b.setAttribute("aria-pressed", String(!!on));
    b.setAttribute("aria-label", on ? "배경음 끄기" : "배경음 켜기");
    적기(!!on);
  });
}

/* ── 따라다니는 복채 띠 ───────────────────────────
   무료 구간이 깁니다. 끝까지 내려가야 단추가 나오면, 중간에서
   마음이 선 손님이 그 자리에서 열 수가 없습니다.
   첫 첩을 지나면 올라오고, 아래 봉인 상자가 보이면 물러납니다. */
function bindPaybar(){
  const bar = $("#paybar"), 단추 = $("#paybar-go");
  if (!bar || !단추) return;
  let 켜짐 = false;
  단추.addEventListener("click", ()=>{
    bar.classList.remove("on"); bar.hidden = true; 켜짐 = false;
    go("s-pay");                       /* go 는 화면을 넘기는 함수입니다 */
  });
  const 보기 = ()=>{
    const free = $("#s-free");
    if (!free || free.hidden){ if(켜짐){ bar.classList.remove("on"); bar.hidden = true; 켜짐=false; } return; }
    const 첫첩 = $("#free-cheop .cp");
    const 상자 = $(".sealbox");
    if (!첫첩 || !상자) return;
    const 지났나 = 첫첩.getBoundingClientRect().bottom < innerHeight * 0.6;
    const 닿았나 = 상자.getBoundingClientRect().top < innerHeight * 0.92;
    const 켤까 = 지났나 && !닿았나;
    if (켤까 === 켜짐) return;
    켜짐 = 켤까;
    if (켤까){ bar.hidden = false; requestAnimationFrame(()=> bar.classList.add("on")); }
    else { bar.classList.remove("on"); setTimeout(()=>{ if(!켜짐) bar.hidden = true; }, 340); }
  };
  addEventListener("scroll", 보기, { passive:true });
  addEventListener("resize", 보기, { passive:true });
  const free = $("#s-free");
  if (free) free.addEventListener("enter", ()=> setTimeout(보기, 60));
}

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
  /* 거울을 눌러도 사진첩이 열립니다 — 거기를 먼저 누르시니까요.
     다만 거울이 화면을 거의 다 덮고 있어, 거기를 짚고 밀어 내리시는 일이
     잦습니다. 민 것인지 누른 것인지를 갈라, 민 것이면 열지 않습니다. */
  let 짚은데 = null;
  const 짚기 = (e)=>{ const t = (e.touches && e.touches[0]) || e;
    짚은데 = { x:t.clientX, y:t.clientY, s:window.scrollY, t:Date.now() }; };
  hole.addEventListener("pointerdown", 짚기);
  hole.addEventListener("touchstart", 짚기, { passive:true });
  hole.addEventListener("click", (e)=>{
    if (짚은데){
      const t = e;
      const 움직임 = Math.abs((t.clientX||0) - 짚은데.x) + Math.abs((t.clientY||0) - 짚은데.y);
      const 밀림 = Math.abs(window.scrollY - 짚은데.s);
      /* 손가락이 열 점 넘게 가거나 화면이 밀렸으면 민 것입니다 */
      if (움직임 > 10 || 밀림 > 4){ 짚은데 = null; return; }
    }
    짚은데 = null; file.click();
  });
  /* 손가락 대신 자판으로 오시는 분 */
  hole.addEventListener("keydown", (e)=>{
    if (e.key === "Enter" || e.key === " "){ e.preventDefault(); file.click(); }
  });

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
  /* 궁을 먼저 읽어야 맞서는 단서를 빼고 그만큼 채울 수 있습니다 */
  ST.C = null;

  step("열두 자리의 빛을 보고 있습니다…", 62);
  await sleep(420);
  ST.R = divine(r.m, ST.age, ST.sex);
  ST.C = readClues(r.F, 궁걸름(ST.R));

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

/* 빈 줄로 끊긴 글을 문단으로 나눠 놓습니다.
   한 덩어리로 두면 열 줄이 넘어 눈이 쉴 자리가 없습니다. */
function 글월(t){
  return String(t||"").split(/\n{2,}/).map(x=>x.trim()).filter(Boolean)
    .map(x=>`<p>${esc(x)}</p>`).join("");
}

/* ── 내 얼굴 관상도 ──────────────────────────────
   글로 "준두가 재백궁입니다" 해 봐야 손님은 제 코를 못 봅니다.
   손님 사진 위에 자리마다 불을 켜고 이름을 붙입니다.
   누르면 그 자리를 맡은 첩으로 갑니다. */
/* 가운데 줄에 선 자리는 이름을 얼굴 바깥으로 빼고 실로 잇습니다.
   그러지 않으면 코 이름표가 입을, 입 이름표가 턱을 덮습니다. */
const CHART = [
  { i:[103,332,10], nm:"이마",  sub:"초년", no:4, side:"l", out:58 },
  { i:[9],          nm:"미간",  sub:"명궁", no:1, side:"r", out:58 },
  { i:[105],        nm:"눈썹",  sub:"인연", no:3, side:"l", out:14 },
  { i:[263],        nm:"눈",    sub:"인상", no:3, side:"r", out:14 },
  { i:[116],        nm:"광대",  sub:"조력", no:6, side:"l", out:14 },
  { i:[1],          nm:"코",    sub:"재물", no:2, side:"r", out:64 },
  { i:[13],         nm:"입",    sub:"표현", no:3, side:"l", out:64 },
  { i:[152],        nm:"턱",    sub:"말년", no:5, side:"c", out:0 }
];
function renderChart(box, src, F, R){
  if (!box) return;
  if (!src || !F || !F.rawAll){ box.hidden = true; return; }
  box.hidden = false;
  /* 얼굴을 화폭에 꽉 채워 그립니다 */
  const W = 620, H = Math.round(W*4/3);
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const g = cv.getContext("2d");
  g.fillStyle = "#0b0607"; g.fillRect(0,0,W,H);
  const kx = (F.W ? src.width/F.W : 1), ky = (F.H ? src.height/F.H : 1);
  const P = i => ({ x:F.rawAll[i].x*kx, y:F.rawAll[i].y*ky });
  const ov = [10,152,234,454,103,332,172,397];
  const xs = ov.map(i=>P(i).x), ys = ov.map(i=>P(i).y);
  const x0=Math.min.apply(null,xs), x1=Math.max.apply(null,xs);
  const y0=Math.min.apply(null,ys), y1=Math.max.apply(null,ys);
  const fw=x1-x0, fh=y1-y0, cx=(x0+x1)/2, cy=(y0+y1)/2 - fh*0.04;
  let w = fw*1.46, h = w*4/3;
  if (h < fh*1.24){ h = fh*1.24; w = h*3/4; }
  const sx = cx-w/2, sy = cy-h/2, k = W/w;
  g.save(); g.translate(-sx*k,-sy*k); g.scale(k,k);
  try { g.drawImage(src, 0, 0); } catch(e){}
  g.restore();
  /* 가장자리를 어둡게 눌러 글자가 읽히게 합니다 */
  const vg = g.createRadialGradient(W/2,H*0.46,W*0.22,W/2,H*0.5,W*0.78);
  vg.addColorStop(0,"rgba(10,5,7,0)"); vg.addColorStop(1,"rgba(10,5,7,.88)");
  g.fillStyle = vg; g.fillRect(0,0,W,H);

  const pos = (c)=>{
    const ps = c.i.map(P);
    const mx = ps.reduce((a,p)=>a+p.x,0)/ps.length;
    const my = ps.reduce((a,p)=>a+p.y,0)/ps.length;
    return { x:((mx-sx)*k)/W*100, y:((my-sy)*k)/H*100 };
  };
  const dots = CHART.map(c=>{
    const q = pos(c);
    return `<button class="cdot c${c.side}" data-cheop="${c.no}" type="button"
       style="left:${q.x.toFixed(2)}%;top:${q.y.toFixed(2)}%;--out:${c.out}px"
       aria-label="${esc(c.nm)}(${esc(c.sub)}) — 제${c.no}첩으로">
       <i class="pin"></i>
       <span class="lab"><b>${esc(c.nm)}</b><em>${esc(c.sub)}</em></span></button>`;
  }).join("");
  box.innerHTML = `<span class="gt">내 얼굴 관상도</span>
    <div class="chart"><div class="cwrap"></div>${dots}</div>
    <p class="cfoot">불이 켜진 자리를 누르면 그 자리를 맡은 첩으로 갑니다.</p>`;
  box.querySelector(".cwrap").appendChild(cv);
}

/* ── 읽은 것을 한 판에 ───────────────────────────
   글만 죽 늘어놓으면 손님은 무엇을 받았는지 모릅니다.
   타고난 꼴, 도는 빛, 세 마디, 올해 쥐는 자리를 한 판에 모읍니다. */
function renderVerdict(box, R, C){
  if (!box || !R) return;
  box.hidden = false;
  const oh = OH[R.hyeong], gi = GISAEK[R.gisaek];
  const sam = (R.m && R.m.F && R.m.F.sam) ? R.m.F.sam : null;
  const t = sam ? (sam[0]+sam[1]+sam[2]) : 0;
  const pc = i => t ? Math.round(sam[i]/t*100) : 0;
  const 센것 = C.list[0];
  const 칸 = [
    ["五行", R.hyeong + "형", oh ? oh.ja : "", oh ? oh.sul : ""],
    ["氣色", R.gisaek + "기", gi ? gi.ja : "", gi ? (gi.mal||"").split(".")[0] : ""],
    ["三停", R.samjeong + "정", "",
      t ? `상 ${pc(0)} · 중 ${pc(1)} · 하 ${pc(2)}` : "위·가운데·아래의 몫"],
    ["流年", R.boss.g.n, "", `${R.age}세 · ${R.yun.bu}`]
  ];
  box.innerHTML =
    `<span class="ink" aria-hidden="true"></span>
     <div class="vhead"><i></i><span>한눈에 보는 자네 얼굴</span><i></i></div>
     <div class="vgrid">` +
    칸.map(([k,b,ja,sub])=>
      `<div class="vcell"><em>${esc(k)}</em>
         <b>${esc(b)}${ja?`<i>${esc(ja)}</i>`:""}</b>
         <span>${esc(sub)}</span></div>`).join("") +
    `</div>
     <div class="vbar" aria-hidden="true">` +
       ["상","중","하"].map((n,i)=>
         `<i class="${R.samjeong===n?"on":""}" style="flex:${t?sam[i]:1}"><u>${n}</u></i>`).join("") +
     `</div>
     <p class="vsay">${esc(
        `자네 얼굴은 ${R.hyeong}의 그릇에 ${R.gisaek}기가 도는 얼굴일세. ` +
        `둘 사이가 ${R.gyo.dan}이니, ${R.gyo.mal}`)}</p>
      <p class="vsay">${esc(
        `열두 자리 가운데 트인 데가 ${R.opened}, 막힌 데가 ${R.blocked}. ` +
        `가장 환한 데는 ${R.brightest.g.n}이고 가장 그늘진 데는 ${R.darkest.g.n}일세. ` +
        (센것 ? `얼굴에서 가장 세게 선 자리는 ${센것.c.n} — ${끝말(센것.c.s)}` : ""))}</p>`;
}
const 끝말 = t => /[.!?]$/.test(String(t).trim()) ? String(t).trim() : String(t).trim()+".";

/* ── 열두 자리 맛보기 ────────────────────────────
   트였는지 막혔는지까지는 무료로 보여 드립니다.
   자리마다 무엇을 해야 하는지와 선 백귀가 제7첩입니다. */
function renderGung12(box, R){
  if (!box || !R || !R.jari) return;
  box.hidden = false;
  const 말 = ["트임","반반","막힘"];
  box.innerHTML = `<span class="gt">자네 얼굴의 열두 자리</span>
    <ul class="g12">` + R.jari.map(j=>
      `<li class="l${j.lv}${j.g.k===R.boss.g.k?" now":""}">
         <b>${esc(j.g.n)}</b><em>${esc(j.g.bu)}</em>
         <i>${말[j.lv]}</i><span>${esc(j.g.d)}</span></li>`).join("") +
    `</ul>
     <p class="more">트인지 막힌지는 여기까지 보여 드립니다.
      자리마다 선 백귀와 푸는 길은 제7첩에 적혀 있습니다.</p>`;
}

/* ── 얼굴에서 그 자리만 오려 내기 ────────────────
   글로 "눈꼬리가 올라갔습니다" 해 봐야 손님은 제 눈을 못 봅니다.
   점 468개를 이미 찍어 두었으니, 그 자리를 그대로 오려 보여 드립니다. */
const PART = {
  /* 얼굴의 자리는 가로가 깁니다. 네모로 맞추면 위아래가 남아 머리카락이 찹니다. */
  이마: { idx:[103,332,10,107,336], pad:[0.08,0.16,0.08,0.10], nm:"이마", ja:"額",
         bu:["이마","삼정"] },
  눈:   { idx:[33,263,159,386,145,374,107,336], pad:[0.10,0.22,0.10,0.22], nm:"눈과 눈썹", ja:"眼",
         bu:["눈","눈썹"] },
  코:   { idx:[168,1,98,327,48,278], pad:[0.34,0.10,0.34,0.14], nm:"코", ja:"鼻",
         bu:["코","광대"] },
  입:   { idx:[61,291,0,17,2,18], pad:[0.30,0.26,0.30,0.30], nm:"입과 턱", ja:"口",
         bu:["입","인중","턱"] }
};
const PART_AR = 4/3;
function cutPart(src, F, spec, px){
  const cv = document.createElement("canvas");
  const S = px || 260;
  cv.width = S; cv.height = Math.round(S / PART_AR);
  const g = cv.getContext("2d");
  g.fillStyle = "#120a0b"; g.fillRect(0,0,cv.width,cv.height);
  if (!F || !F.rawAll) return cv;
  /* 점은 읽기용 720짜리 그림에 찍혀 있고, 여기 건네받은 사진은 본디 크기입니다.
     자가 다르니 맞춰 두지 않으면 엉뚱한 데가 잘립니다. */
  const kx = (F.W ? src.width / F.W : 1), ky = (F.H ? src.height / F.H : 1);
  const xs = spec.idx.map(i=>F.rawAll[i].x * kx), ys = spec.idx.map(i=>F.rawAll[i].y * ky);
  let x0=Math.min.apply(null,xs), x1=Math.max.apply(null,xs);
  let y0=Math.min.apply(null,ys), y1=Math.max.apply(null,ys);
  const w0=x1-x0, h0=y1-y0;
  const [pl,pt_,pr,pb] = spec.pad;
  x0 -= w0*pl; x1 += w0*pr; y0 -= h0*pt_; y1 += h0*pb;
  /* 넉 장이 같은 꼴이어야 나란히 놓았을 때 자리가 비교됩니다 */
  let w=x1-x0, h=y1-y0;
  const cx=(x0+x1)/2, cy=(y0+y1)/2 + (spec.shift ? Math.max(w,h)*spec.shift : 0);
  if (w / h < PART_AR) w = h * PART_AR; else h = w / PART_AR;
  x0 = cx - w/2; y0 = cy - h/2;
  const k = S/w;
  g.save(); g.translate(-x0*k, -y0*k); g.scale(k,k);
  try { g.drawImage(src, 0, 0); } catch(e){}
  g.restore();
  return cv;
}
/* 그 자리에서 실제로 선 단서 한 줄을 붙입니다 */
function partSay(C, spec){
  for (const b of spec.bu){
    const hit = (C.byBu && C.byBu[b]) || [];
    if (hit.length) return hit[0].c.s;
  }
  return "";
}
function renderParts(box, src, F, C){
  if (!box) return;
  if (!src || !F || !F.rawAll){ box.hidden = true; return; }
  box.hidden = false;
  box.innerHTML = `<span class="gt">눈여겨볼 자리</span><div class="prow"></div>` +
    `<p class="pfoot">자네 사진에서 그 자리만 오려 왔습니다. 사진은 기기 밖으로 나가지 않습니다.</p>`;
  const row = box.querySelector(".prow");
  for (const k of ["이마","눈","코","입"]){
    const spec = PART[k];
    const fig = document.createElement("figure");
    fig.className = "pcut";
    const cv = cutPart(src, F, spec);
    cv.setAttribute("aria-hidden","true");
    fig.appendChild(cv);
    const cap = document.createElement("figcaption");
    const say = partSay(C, spec);
    cap.innerHTML = `<b>${esc(spec.nm)}<i>${esc(spec.ja)}</i></b>` +
                    (say ? `<span>${esc(say)}</span>` : `<span>크게 어긋난 데가 없습니다</span>`);
    fig.appendChild(cap);
    row.appendChild(fig);
  }
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
  /* 여덟 개만 보여 주면 "열여섯 자리가 섰다"고 해 놓고 반을 감추는 꼴입니다.
     잡힌 자리는 전부 내어 놓습니다 — 이게 모든 풀이의 근거입니다. */
  $("#free-clues").innerHTML = C.list.map(h=>clueChip({
    n:h.c.n, s:h.c.s, g:h.c.g
  })).join("");
  $("#free-clue-more").textContent =
    `이 ${C.count} 자리가 아래 열 장의 근거입니다. 여기 없는 말은 적지 않았습니다.`;

  /* 읽은 것을 한 판에, 그리고 손님 얼굴에서 네 자리를 오려 보여 드립니다 */
  renderChart($("#free-chart"), ST.img, ST.F, R);
  renderVerdict($("#free-card"), R, C);
  renderParts($("#free-parts"), ST.img, ST.F, C);
  renderGung12($("#free-g12"), R);

  /* 첩 목록 — 두루마리로. 앞의 둘만 열고 나머지는 봉인합니다. */
  const list = sealCheop(ST.cheop);
  const fpara = (b)=> `<h4>${esc(b.h)}</h4>` + (b.p ? 글월(b.p) : "") +
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
    /* 무엇이 적혀 있는지는 다 보이고, 글만 안 읽힙니다.
       적힌 것을 감추면 궁금해지는 것이 아니라 없는 줄 압니다. */
    const 차례 = (c.mok && c.mok.length)
      ? `<div class="mok"><span class="mt">이 첩에 적힌 것</span><ul>` +
        c.mok.map(h=>`<li>${esc(h)}</li>`).join("") + `</ul>` +
        (c.glyph ? `<p class="mn">모두 ${c.glyph.toLocaleString()}자</p>` : "") + `</div>`
      : "";
    const 목 = c.veil.map(b=>b.h).filter(Boolean).slice(0,2).join(" · ");
    return `<div class="veil">
      ${차례}
      <div class="veiled" aria-hidden="true">${inner}</div>
      <div class="veilsay"><i class="vlock" aria-hidden="true"></i>
        <div class="vt">
          <b>${c.sealed ? "봉인되어 있습니다" : "이 뒤로 " + n + "마디가 더 있습니다"}</b>
          <span>${c.sealed ? "복채를 내시면 이 첩이 통째로 풀립니다" : (목 || "복채를 내시면 끝까지 읽힙니다")}</span>
        </div>
        <button class="vopen" type="button" data-pay="1">열기</button>
      </div>
    </div>`;
  };

  {
    const n = list.filter(c=>c.sealed).length;
    const el = $("#paybar-n");
    if (el) el.textContent = n + "장이 봉인되어 있습니다";
  }
  let 봉인첫 = true;
  $("#free-cheop").innerHTML = list.map((c)=>{
    let 금 = "";
    if (c.sealed && 봉인첫){ 봉인첫 = false;
      금 = `<div class="sealgate"><span class="ink" aria-hidden="true"></span><i></i><b>여기서부터 봉인입니다</b>
        <span>남은 여덟 장에 무엇이 적혀 있는지는 아래에 그대로 보입니다. 글만 아직 안 읽힐 뿐입니다.</span></div>`; }
    const art = `img/cheop/c${String(c.no).padStart(2,"0")}.webp`;
    const tag = c.sealed
      ? `<span class="jbadge lock" aria-label="봉인"></span>`
      : `<span class="jbadge free">무료</span>`;
    /* 첫 마디는 한지 위에 올립니다 — 열 장이 다 같은 검은 바탕이면 눈이 쉴 데가 없습니다 */
    const 머리 = c.body.length ? `<div class="lead juru">${fpara(c.body[0])}</div>` : "";
    const 나머지 = c.body.slice(1).map(fpara).join("");
    return 금 + `<article class="cp ${c.sealed ? "shut" : "open"}">
      <div class="cph"><img src="${art}" alt="" loading="lazy"></div>
      <div class="cpt juru${c.sealed ? " shut" : ""}">${tag}
        <span class="no">제${c.no}첩</span><h3>${esc(c.title)}</h3><p>${esc(c.sub)}</p></div>
      <div class="cpb">${머리}${나머지}${veilBlock(c)}</div>
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
  /* 관상도의 불 켜진 자리를 누르면 그 첩으로 갑니다 */
  document.addEventListener("click", (e)=>{
    const d = e.target.closest && e.target.closest("[data-cheop]");
    if (!d) return;
    const no = +d.dataset.cheop;
    const art = $$("#free-cheop .cp")[no-1];
    if (art) art.scrollIntoView({ behavior:"smooth", block:"start" });
  });
  /* 봉인 명판의 열기 — 첩마다 달려 있어 한 군데서 받습니다 */
  document.addEventListener("click", (e)=>{
    const b = e.target.closest && e.target.closest("[data-pay]");
    if (b) go("s-pay");
  });
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
    const para = (b)=> `<h4>${esc(b.h)}</h4>` + (b.p ? 글월(b.p) : "") +
      (b.list ? `<ul class="jari">` + b.list.map(x=>
        `<li${x.g>0?' class="gok"':x.g<0?' class="gbad"':''}><b>${esc(x.t)}</b><span>${esc(x.d)}</span></li>`
      ).join("") + `</ul>` : "");
    let inner = (c.body.length ? `<div class="lead juru">${para(c.body[0])}</div>` : "")
              + c.body.slice(1).map(para).join("");

/* ── 얼굴 지도 ──────────────────────────────────
   열두 자리를 글로만 늘어놓으면 손님은 그게 얼굴 어디인지 모릅니다.
   자리 좌표는 처음부터 자료에 있었으니, 얼굴 먹선 위에 그대로 찍습니다.
   좌표는 0~100 자로, 이마가 10 언저리, 눈이 43, 코끝이 64, 턱이 90입니다. */
function faceInk(){
  return `
    <path class="fl" d="M50 4c26 0 39 15 39 38 0 28-17 52-39 54-22-2-39-26-39-54C11 19 24 4 50 4z"/>
    <path class="fl" d="M26 16q24-8 48 0" opacity=".4"/>
    <path class="fl" d="M24 35q10-6 20-1"/><path class="fl" d="M76 35q-10-6-20-1"/>
    <ellipse class="fl" cx="34" cy="43" rx="8.4" ry="3.6"/>
    <ellipse class="fl" cx="66" cy="43" rx="8.4" ry="3.6"/>
    <circle class="fp" cx="34" cy="43" r="1.7"/><circle class="fp" cx="66" cy="43" r="1.7"/>
    <path class="fl" d="M50 40v20"/>
    <path class="fl" d="M43 64q7 4 14 0"/>
    <path class="fl" d="M43 64q-2-4 1-5"/><path class="fl" d="M57 64q2-4-1-5"/>
    <path class="fl" d="M41 77q9-3.5 18 0q-9 5.5-18 0z"/>
    <path class="fl" d="M50 77v-1.6"/>
    <path class="fl" d="M12 41q-5 1-4 7t6 6.4"/><path class="fl" d="M88 41q5 1 4 7t-6 6.4"/>
    <path class="fl" d="M43 88q7 3 14 0" opacity=".55"/>`;
}
function faceMap(marks, opt){
  const o = opt || {};
  const dots = marks.map((m,i)=>{
    const cls = "fm" + (m.lv===undefined ? "" : " lv"+m.lv) + (m.boss ? " boss" : "");
    const r = m.r || 3.2;
    return `<g class="${cls}">
      ${m.boss ? `<circle class="halo" cx="${m.x}" cy="${m.y}" r="${r+3.4}"/>` : ""}
      <circle class="dot" cx="${m.x}" cy="${m.y}" r="${r}"/>
      ${m.no ? `<text class="no" x="${m.x}" y="${m.y+1.3}">${m.no}</text>` : ""}
    </g>`;
  }).join("");
  return `<figure class="facemap${o.wide?" wide":""}">
    <svg viewBox="0 0 100 100" role="img" aria-label="${esc(o.alt||"얼굴 자리 그림")}">
      <g class="ink">${faceInk()}</g>${dots}
    </svg>
    ${o.legend ? `<figcaption class="fmleg">${o.legend}</figcaption>` : ""}
  </figure>`;
}

    if (c.key === "십이궁" && c.jari){
      inner += faceMap(c.jari.map(j=>({ x:j.x, y:j.y, lv:j.lv, boss:j.boss })), {
        wide:true, alt:"얼굴 열두 자리 지도",
        legend:`<i class="k0"></i>트임 <i class="k1"></i>반반 <i class="k2"></i>막힘 <i class="kb"></i>올해 쥐는 자리`
      });
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
        <h5>점 찍을 자리</h5>`
        + faceMap(c.jeom.map((j,i)=>({ x:j.x, y:j.y, no:i+1, r:3.6 })), {
            alt:"점 찍을 자리 셋", legend:"아래 셋 가운데 손님께 맞는 자리를 짚어 드립니다" })
        + `<ul class="moles">` + c.jeom.map((j,i)=>`<li><b><i class="n">${i+1}</i>${esc(j.t)}</b><span>${esc(j.w)}</span></li>`).join("") + `</ul>
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
      <div class="cpt juru"><span class="no">제${c.no}첩</span><h3>${esc(c.title)}</h3><p>${esc(c.sub)}</p></div>
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
  bindSound();
  bindPaybar();
  bindIntro(); bindAsk(); bindMirror(); bindPay(); bindMisc();
  /* 얼굴 읽는 기계를 미리 깨워 둡니다 — 손님이 사진을 고르는 동안 */
  setTimeout(()=>{ try { wakeMesh(); } catch(e){} }, 1200);
});
