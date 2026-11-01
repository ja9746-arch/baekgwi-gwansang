/* 백귀관상 — 관상첩 간직하기
   카카오톡·네이버 같은 앱 안의 창에서는 <a download> 가 듣지 않는 일이 잦습니다.
   그래서 세 갈래로 둡니다.
     하나.  기기의 "공유"에 그림째 넘깁니다 (navigator.share)
     둘.    안 되면 내려받기를 시킵니다
     셋.    그것도 안 되면 그림을 화면에 띄워 길게 눌러 저장하시게 합니다
   글로 가져가실 분을 위해 "글로 복사"도 함께 둡니다. */

const SAVE = { W: 1080, pad: 64 };

/* 한지 결을 미리 받아 둡니다 — 그림을 구울 때 기다리지 않도록 */
let HANJI = null;
(function(){
  try{
    const im = new Image();
    im.decoding = "async";
    im.src = "img/ui/hanji-lotus.webp";
    HANJI = im;
  }catch(e){}
})();

/* 앱 안에서 열린 창인가 — 카카오톡·네이버·라인·인스타 들입니다.
   이런 창에서는 내려받기가 아무 말 없이 씹힙니다. 그러면 손님은
   눌렀는데 아무 일도 안 일어난 것으로 봅니다. 그래서 여기서는
   처음부터 그림을 띄워 길게 누르시게 합니다. */
function inApp(){
  const u = navigator.userAgent || "";
  return /KAKAOTALK|NAVER\(inapp|DaumApps|Instagram|FBAN|FBAV|FB_IAB|Line\/|everytimeApp|band_|zumapp|WhaleOn/i.test(u);
}

/* ── 글 줄바꿈 ──────────────────────────────────── */
function wrapText(g, t, maxW){
  const out = [];
  let line = "";
  for (const ch of String(t||"")){
    if (ch === "\n"){ out.push(line); line = ""; continue; }
    const test = line + ch;
    if (g.measureText(test).width > maxW && line){ out.push(line); line = ch; }
    else line = test;
  }
  if (line) out.push(line);
  return out;
}
function drawPara(g, t, x, y, maxW, lh){
  const ls = wrapText(g, t, maxW);
  ls.forEach((l,i)=> g.fillText(l, x, y + i*lh));
  return y + ls.length*lh;
}

/* ── 얼굴을 동그라미로 ──────────────────────────── */
function drawFaceCircle(g, src, F, cx, cy, r){
  g.save();
  g.beginPath(); g.arc(cx, cy, r, 0, 7); g.clip();
  g.fillStyle = "#160c0e"; g.fillRect(cx-r, cy-r, r*2, r*2);
  if (src && F && F.rawAll){
    const kx = (F.W ? src.width/F.W : 1), ky = (F.H ? src.height/F.H : 1);
    const P = i => ({ x:F.rawAll[i].x*kx, y:F.rawAll[i].y*ky });
    const ov = [10,152,234,454,103,332];
    const xs = ov.map(i=>P(i).x), ys = ov.map(i=>P(i).y);
    const x0=Math.min.apply(null,xs), x1=Math.max.apply(null,xs);
    const y0=Math.min.apply(null,ys), y1=Math.max.apply(null,ys);
    const fw=x1-x0, fh=y1-y0;
    const w = Math.max(fw, fh)*1.26, s = (r*2)/w;
    const ox = (x0+x1)/2 - w/2, oy = (y0+y1)/2 - w/2 - fh*0.02;
    g.translate(cx-r, cy-r); g.scale(s, s); g.translate(-ox, -oy);
    try { g.drawImage(src, 0, 0); } catch(e){}
  }
  g.restore();
  g.save();
  g.strokeStyle = "rgba(226,188,116,.9)"; g.lineWidth = 4;
  g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke();
  g.strokeStyle = "rgba(226,188,116,.32)"; g.lineWidth = 2;
  g.beginPath(); g.arc(cx, cy, r+12, 0, 7); g.stroke();
  g.restore();
}

/* ── 관상첩 한 장 ───────────────────────────────── */
function buildPoster(){
  const R = ST.R, C = ST.C, cheop = ST.cheop || [];
  if (!R) return null;
  const W = SAVE.W, pad = SAVE.pad;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = 3600;
  const g = cv.getContext("2d");
  const serif = '"Nanum Myeongjo","Song Myung",Gungsuh,serif';
  const sans  = '"Pretendard Variable",Pretendard,"Noto Sans KR",sans-serif';

  /* 바탕 */
  const bg = g.createLinearGradient(0,0,0,cv.height);
  bg.addColorStop(0,"#1a0d0f"); bg.addColorStop(.5,"#0d0608"); bg.addColorStop(1,"#140a0c");
  g.fillStyle = bg; g.fillRect(0,0,W,cv.height);
  /* 한지 결 — 화면에 깔린 것과 같은 연꽃 무늬를 옅게 */
  if (HANJI && HANJI.complete && HANJI.naturalWidth){
    g.save(); g.globalAlpha = 0.11;
    const pt = g.createPattern(HANJI, "repeat");
    if (pt){ g.fillStyle = pt; g.fillRect(0,0,W,cv.height); }
    g.restore();
  }
  const glow = g.createRadialGradient(W/2, 240, 40, W/2, 300, 760);
  glow.addColorStop(0,"rgba(170,86,34,.34)"); glow.addColorStop(1,"rgba(10,5,7,0)");
  g.fillStyle = glow; g.fillRect(0,0,W,900);

  let y = 96;
  g.textAlign = "center";
  g.fillStyle = "#cfa963"; g.font = `500 30px ${serif}`;
  g.fillText("백귀야행도 · 백귀관상", W/2, y); y += 62;
  g.fillStyle = "#f6e6c4"; g.font = `800 62px ${serif}`;
  g.fillText("원안법사의 관상첩", W/2, y); y += 40;
  g.strokeStyle = "rgba(201,162,74,.6)"; g.lineWidth = 2;
  g.beginPath(); g.moveTo(W/2-64, y); g.lineTo(W/2+64, y); g.stroke();
  y += 70;

  /* 얼굴 */
  drawFaceCircle(g, ST.img, ST.F, W/2, y + 180, 170);
  y += 400;

  /* 네 기둥 */
  const OHJA = {"목":"木","화":"火","토":"土","금":"金","수":"水"};
  const GIJA = {"청":"靑","적":"赤","황":"黃","백":"白","흑":"黑"};
  const cells = [
    ["五行", R.hyeong+"형", OHJA[R.hyeong]||""],
    ["氣色", R.gisaek+"기", GIJA[R.gisaek]||""],
    ["三停", R.samjeong+"정", ""],
    ["流年", R.boss.g.n, R.age+"세"]
  ];
  const cw = (W - pad*2 - 24*3)/4;
  cells.forEach((c,i)=>{
    const x = pad + i*(cw+24);
    g.fillStyle = "rgba(201,162,74,.08)"; g.strokeStyle = "rgba(201,162,74,.3)"; g.lineWidth = 2;
    g.beginPath(); g.rect(x, y, cw, 150); g.fill(); g.stroke();
    g.textAlign = "center";
    g.fillStyle = "#a08049"; g.font = `500 24px ${serif}`;
    g.fillText(c[0], x+cw/2, y+44);
    g.fillStyle = "#f3e2bd"; g.font = `800 38px ${serif}`;
    g.fillText(c[1], x+cw/2, y+96);
    if (c[2]){ g.fillStyle = "#c9a24a"; g.font = `400 24px ${serif}`;
      g.fillText(c[2], x+cw/2, y+132); }
  });
  y += 200;

  /* 한 줄 총평 */
  g.textAlign = "left";
  g.fillStyle = "#e3d3bb"; g.font = `400 30px ${sans}`;
  y = drawPara(g,
    `${R.hyeong}의 그릇에 ${R.gisaek}기가 도는 얼굴. 둘 사이는 ${R.gyo.dan}. ` +
    `열두 자리 가운데 트인 데가 ${R.opened}, 막힌 데가 ${R.blocked}.`,
    pad, y, W-pad*2, 48) + 36;

  /* 얼굴에서 잡힌 자리 */
  g.fillStyle = "#cfa963"; g.font = `700 26px ${serif}`;
  g.fillText("얼굴에서 잡힌 자리", pad, y); y += 42;
  const cl = (C && C.list) ? C.list.slice(0, 7) : [];
  cl.forEach(h=>{
    g.fillStyle = h.c.g > 0 ? "#e8c67e" : (h.c.g < 0 ? "#df8d78" : "#bfae97");
    g.fillRect(pad, y-18, 5, 26);
    g.fillStyle = "#ddcdb6"; g.font = `400 27px ${sans}`;
    y = drawPara(g, h.c.s, pad+20, y, W-pad*2-20, 42) + 16;
  });
  y += 16;

  /* 열두 자리 */
  g.fillStyle = "#cfa963"; g.font = `700 26px ${serif}`;
  g.fillText("얼굴 열두 자리", pad, y); y += 44;
  const 말 = ["트임","반반","막힘"];
  const col = (W - pad*2 - 20)/2;
  (R.jari||[]).forEach((j,i)=>{
    const x = pad + (i%2)*(col+20), yy = y + Math.floor(i/2)*52;
    g.fillStyle = "rgba(255,255,255,.035)"; g.fillRect(x, yy-26, col, 44);
    g.fillStyle = j.lv===0 ? "#e8c67e" : (j.lv===2 ? "#df8d78" : "#9f8f74");
    g.fillRect(x, yy-26, 4, 44);
    g.fillStyle = "#ecdcc0"; g.font = `700 26px ${serif}`;
    g.fillText(j.g.n, x+18, yy+2);
    g.textAlign = "right";
    g.fillStyle = j.lv===0 ? "#e8c67e" : (j.lv===2 ? "#df8d78" : "#a2947c");
    g.font = `400 24px ${sans}`;
    g.fillText(말[j.lv], x+col-14, yy+2);
    g.textAlign = "left";
  });
  y += Math.ceil((R.jari||[]).length/2)*52 + 30;

  /* 백귀 셋 */
  const g8 = cheop.find(c=>c.key==="백귀");
  if (g8 && g8.gwi && g8.gwi.length){
    g.fillStyle = "#cfa963"; g.font = `700 26px ${serif}`;
    g.fillText("얼굴에 선 백귀", pad, y); y += 44;
    g8.gwi.forEach(w=>{
      g.fillStyle = "#f0dcb3"; g.font = `700 30px ${serif}`;
      g.fillText(`${w.g.n} ${w.g.h||""}`, pad, y);
      g.textAlign = "right"; g.fillStyle = "#a2947c"; g.font = `400 24px ${sans}`;
      g.fillText(w.자리, W-pad, y); g.textAlign = "left";
      y += 36;
      g.fillStyle = "#c9bba4"; g.font = `400 25px ${sans}`;
      y = drawPara(g, (w.처방 && w.처방.l[0]) ? w.처방.l[0] : (w.말||""), pad, y, W-pad*2, 40) + 22;
    });
    y += 10;
  }

  /* 올해 할 일 / 피할 것 */
  const c10 = cheop.find(c=>c.key==="밀서");
  if (c10 && c10.todo){
    g.fillStyle = "#cfa963"; g.font = `700 26px ${serif}`;
    g.fillText("올해 할 일", pad, y); y += 44;
    c10.todo.forEach((t,i)=>{
      g.fillStyle = "#e8c67e"; g.font = `700 26px ${serif}`;
      g.fillText(String(i+1), pad, y);
      g.fillStyle = "#ddcdb6"; g.font = `400 27px ${sans}`;
      y = drawPara(g, t.t, pad+36, y, W-pad*2-36, 42) + 14;
    });
    y += 14;
    if (c10.avoid && c10.avoid.length){
      g.fillStyle = "#cfa963"; g.font = `700 26px ${serif}`;
      g.fillText("피할 것", pad, y); y += 44;
      c10.avoid.forEach(t=>{
        g.fillStyle = "#df8d78"; g.font = `700 26px ${serif}`;
        g.fillText("×", pad, y);
        g.fillStyle = "#ddcdb6"; g.font = `400 27px ${sans}`;
        y = drawPara(g, t.t, pad+36, y, W-pad*2-36, 42) + 14;
      });
    }
  }
  y += 40;

  /* 바닥 */
  g.strokeStyle = "rgba(201,162,74,.3)"; g.lineWidth = 2;
  g.beginPath(); g.moveTo(pad, y); g.lineTo(W-pad, y); g.stroke();
  y += 52;
  g.textAlign = "center";
  g.fillStyle = "#b79a6d"; g.font = `500 26px ${serif}`;
  g.fillText("백귀야행도 · 백귀관상", W/2, y); y += 40;
  g.fillStyle = "#8a7c6a"; g.font = `400 23px ${sans}`;
  g.fillText("운세는 재미로 보는 것입니다", W/2, y); y += 56;

  /* 쓴 만큼만 잘라 냅니다 */
  const out = document.createElement("canvas");
  out.width = W; out.height = Math.min(y + 24, cv.height);
  const og = out.getContext("2d");
  og.drawImage(cv, 0, 0);
  /* 두루마리 가장자리 — 안쪽에 금 실선 둘 */
  og.strokeStyle = "rgba(201,162,74,.42)"; og.lineWidth = 2;
  og.strokeRect(26, 26, out.width-52, out.height-52);
  og.strokeStyle = "rgba(201,162,74,.17)"; og.lineWidth = 1;
  og.strokeRect(33, 33, out.width-66, out.height-66);
  return out;
}

/* ── 글로 ───────────────────────────────────────── */
function buildText(){
  const R = ST.R, C = ST.C, cheop = ST.cheop || [];
  if (!R) return "";
  const L = [];
  L.push("백귀야행도 · 백귀관상 — 원안법사의 관상첩", "");
  L.push(`${R.hyeong}형(${R.hyeong}) · ${R.gisaek}기 · ${R.samjeong}정 · ${R.age}세 ${R.boss.g.n}`);
  L.push(`열두 자리 가운데 트인 데 ${R.opened}, 막힌 데 ${R.blocked}`, "");
  L.push("[얼굴에서 잡힌 자리]");
  (C && C.list || []).forEach(h=> L.push(" · " + h.c.s));
  L.push("");
  cheop.forEach(c=>{
    L.push(`[제${c.no}첩 ${c.title}]`);
    (c.body||[]).forEach(b=>{
      if (b.h) L.push("— " + b.h);
      if (b.p) String(b.p).split(/\n{2,}/).forEach(x=> x.trim() && L.push(x.trim()));
      (b.list||[]).forEach(x=> L.push(` · ${x.t} — ${x.d}`));
    });
    if (c.할것 && c.할것.length){
      L.push("— 오늘부터 할 것");
      c.할것.forEach(x=> x && x.d && L.push(` · [${x.t}] ${x.d}`));
    }
    if (c.si)  L.push(`시기 — ${c.si}`);
    if (c.act) L.push(`풀 길 — ${c.act}`);
    L.push("");
  });
  L.push("baekgwi-gwansang.vercel.app");
  return L.join("\n");
}

/* ── 간직하기 ───────────────────────────────────── */
async function saveSheet(btn){
  const cv = buildPoster();
  if (!cv){ toast("아직 읽은 것이 없습니다."); return; }
  const blob = await new Promise(r=> cv.toBlob(r, "image/png", 0.95));
  if (!blob){ toast("그림을 만들지 못했습니다."); return; }
  const file = new File([blob], "백귀관상.png", { type:"image/png" });

  /* 하나 — 기기의 공유로 넘깁니다 (앱 안의 창에서 가장 잘 듣습니다) */
  try{
    if (navigator.canShare && navigator.canShare({ files:[file] })){
      await navigator.share({ files:[file], title:"백귀관상" });
      return;
    }
  }catch(e){ if (e && e.name === "AbortError") return; }

  /* 둘 — 내려받기. 앱 안에서 열린 창이면 건너뜁니다 (씹히면 손님만 답답합니다) */
  const url = URL.createObjectURL(blob);
  try{
    const a = document.createElement("a");
    if (!inApp() && "download" in a){
      a.href = url; a.download = "백귀관상.png";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url), 4000);
      toast("관상첩을 내려받았습니다.");
      return;
    }
  }catch(e){}

  /* 셋 — 그림을 띄워 길게 눌러 저장하시게 합니다 */
  showSheet(url);
}

function showSheet(url){
  let box = $("#sheetbox");
  if (!box){
    box = document.createElement("div");
    box.id = "sheetbox"; box.className = "sheetbox";
    box.innerHTML = `<div class="sbbar">
      <p class="sbsay">관상첩을 <b>길게 눌러</b> 사진첩에 저장하시게나.</p>
      <button class="sbx" type="button" data-sbclose aria-label="닫기">\u2715</button>
    </div>
    <div class="sbin"><img alt="백귀관상 관상첩"></div>`;
    document.body.appendChild(box);
    box.addEventListener("click", (e)=>{
      if (e.target === box || e.target.closest("[data-sbclose]")){
        box.hidden = true; document.documentElement.style.overflow = "";
      }
    });
  }
  box.querySelector("img").src = url;
  box.hidden = false; box.scrollTop = 0;
  document.documentElement.style.overflow = "hidden";
}

async function copySheet(){
  const t = buildText();
  if (!t){ toast("아직 읽은 것이 없습니다."); return; }
  try{
    await navigator.clipboard.writeText(t);
    toast("관상첩을 글로 베꼈습니다.");
    return;
  }catch(e){}
  /* clipboard 를 막아 둔 창에서는 옛 방법으로 */
  try{
    const ta = document.createElement("textarea");
    ta.value = t; ta.style.position="fixed"; ta.style.opacity="0";
    document.body.appendChild(ta); ta.select();
    document.execCommand("copy"); ta.remove();
    toast("관상첩을 글로 베꼈습니다.");
  }catch(e){ toast("베끼지 못했습니다. 화면을 갈무리해 주세요."); }
}

function bindSave(){
  $$("[data-save]").forEach(b=> b.addEventListener("click", ()=> saveSheet(b)));
  $$("[data-copy]").forEach(b=> b.addEventListener("click", copySheet));
}
