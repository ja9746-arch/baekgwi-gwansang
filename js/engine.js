/* 백귀관상 — 판정 엔진
   얼굴 점 468개를 찍어 실제로 재고(face.js),
   그 자리의 빛을 재고(measure.js), 백가지 단서를 가린 다음(clues.js),
   여기서 오행형상·기색·십이궁·유년운기로 묶습니다.

   재는 것
     삼정(三停)    발제·인당·준두·지각 네 자리로 가른 세 마디의 길이와 폭
     오악(五岳)    이마·좌우 광대·코·턱의 솟음
     윤곽          얼굴의 가로세로비, 하정이 좁아지는 정도, 턱선의 각짐
     기색(氣色)    눈·눈썹·입을 뺀 살빛이 어느 쪽으로 기울었는가
     십이궁        열두 자리에서 바로 잰 빛과 결

   가리는 것
     오행형상 → 타고난 그릇
     기색     → 지금의 기운
     둘의 상생상극 → 왜 지금 되고 안 되는가
     궁별 등급 → 열두 자리의 트임과 막힘
     유년운기 → 올해를 쥔 자리와 그 자리의 우두머리
     백가지 단서 → 모든 풀이의 근거 */

/* ── 0. 자세를 봅니다 ─────────────────────────────
   관상의 자는 정면을 두고 잰 자입니다. 다만 비뚤다고 손님을 돌려보내지는
   않습니다. 되돌려 읽고(face.js), 되돌린 만큼 그 자리의 문턱을 올립니다(clues.js).
   여기서는 아주 많이 비뚤 때만 한마디 거들 뿐, 길을 막지 않습니다. */
function poseNote(F){
  const ay = Math.abs(F.yaw), ar = Math.abs(F.roll);
  if (ar > 22) return { k:"roll", msg:"고개가 많이 기울었습니다",
    tip:"고개를 바로 세우고 한 장 더 주시면 훨씬 또렷하게 봅니다." };
  if (ay > 0.62) return { k:"yaw", msg:"고개가 많이 돌아갔습니다",
    tip:"코끝이 화면 한가운데에 오게 한 장 더 주시면 훨씬 또렷하게 봅니다." };
  if (F.pitch < -0.20) return { k:"up", msg:"고개를 많이 드셨습니다",
    tip:"턱을 조금 당기고 한 장 더 주시면 이마와 턱을 제대로 잽니다." };
  if (F.pitch > 0.17) return { k:"down", msg:"고개를 많이 숙이셨습니다",
    tip:"턱을 조금 들고 한 장 더 주시면 이마와 턱을 제대로 잽니다." };
  return null;
}
/* 되돌려 읽은 정도를 손님께 알려 주는 말 */
function poseWord(F){
  const s = F.흔들림 || 0;
  if (s < 0.22) return null;
  if (s < 0.5)  return "고개가 조금 기울어 그만큼 셈해 두었습니다.";
  return "고개가 많이 기울어 되돌려 읽었습니다. 정면으로 한 장 더 주시면 더 또렷하게 봅니다.";
}

/* ── 지문으로 적어 두기 ───────────────────────────
   재는 수만 적습니다. 사진은 적지 않습니다. */
const KEEP_M = "baekgwi-gwansang-measured";
/* 이 자리에서 본 사진은 바로 기억해 둡니다 — 같은 사진은 두 번 재지 않습니다 */
const _본것 = new Map();
const 적을것 = ["sam","ratio","taper","boxy","이마높","이마폭","이마모서리","미길","미꺾","미안",
  "미각","미간","눈길","눈높","눈각","눈사이","와잠","콧대길","산근폭","코폭","콧볼폭","준두",
  "콧대휨","인중길","입폭","입술","윗술","입각","턱길","턱각","지각","광대","어긋남","쏠림","흔들림"];
const 적을빛 = ["meanL","sd","mR","mG","mB","sam","left","right","gung","covered",
  "ratio","taper","boxy","bandW"];   /* 이 넷을 빼먹으면 그릇과 제비가 흔들립니다.
  covered 가 빠져 있어서, 같은 사진을 다시 올리면 빛은 캐시에서 꺼내 쓰고
  덮임 판정만 새로 해 "안경을 벗고 다시 비추시면" 이 있다 없다 했습니다. */
function loadMeasured(fp){
  try {
    const all = JSON.parse(localStorage.getItem(KEEP_M) || "{}");
    return all[fp] || null;
  } catch(e){ return null; }
}
function saveMeasured(fp, F, m){
  try {
    const all = JSON.parse(localStorage.getItem(KEEP_M) || "{}");
    const Fo = {}, mo = {};
    적을것.forEach(k=>{ if(F[k] !== undefined) Fo[k] = F[k]; });
    적을빛.forEach(k=>{ if(m[k] !== undefined) mo[k] = m[k]; });
    all[fp] = { F:Fo, m:mo, t:Date.now() };
    /* 너무 쌓이면 오래된 것부터 버립니다 */
    const ks = Object.keys(all);
    if (ks.length > 12){
      ks.sort((a,b)=>(all[a].t||0)-(all[b].t||0)).slice(0, ks.length-12).forEach(k=>delete all[k]);
    }
    localStorage.setItem(KEEP_M, JSON.stringify(all));
  } catch(e){}
}

/* ── 1. 사진 한 장을 읽습니다 ────────────────────── */
async function readFace(srcEl, sex){
  const cv = toCanvas(srcEl, 720);
  if(!cv) return { err:"그림을 열지 못했습니다" };

  let pts = null;
  try { pts = await findLandmarksStable(cv, 3); }
  catch(e){ return { err:"얼굴을 읽는 기계를 못 깨웠습니다", net:true }; }
  if(!pts) return { err:"얼굴을 못 찾았습니다" };

  const F = measure(pts, cv.width, cv.height);
  if(!F) return { err:"얼굴이 너무 작습니다" };

  /* 남좌여우 — 짝이 있는 여덟 자리를 어느 쪽에서 읽을지가 성별로 갈립니다.
     여태 null 을 넘기고 있어서 화면에서 한 약속이 셈에는 없었습니다. */
  let m = readSkin(cv, F, sex);
  if(!m) return { err:"빛이 모자랍니다", F, canvas:cv, soft:true };

  /* 한 번 본 사진이면 그때 잰 수를 그대로 씁니다.
     기계가 볼 때마다 머리카락 굵기만큼 다르게 읽어, 그냥 두면
     같은 얼굴에 다른 말을 하게 됩니다. */
  /* 자리가 성별로 갈리니 지문도 성별까지 묶어 둡니다.
     안 그러면 남으로 한 번, 여로 한 번 볼 때 묵은 빛을 꺼내 씁니다. */
  const fp0 = fingerprint(cv);
  const fp = fp0 ? (fp0 + "|" + (sex || "")) : null;
  if (fp){
    const kept = _본것.get(fp) || loadMeasured(fp);
    if (kept && kept.F && kept.m){
      for (const k in kept.F) F[k] = kept.F[k];
      for (const k in kept.m) m[k] = kept.m[k];
      m.F = F;
      /* 빛을 재는 자와 틀을 재는 자가 어긋나지 않게 다시 맞춰 둡니다 */
      m.ratio = F.ratio; m.taper = F.taper; m.boxy = F.boxy; m.bandW = F.bandW;
    } else {
      const Fo = {}, mo = {};
      적을것.forEach(k=>{ if(F[k] !== undefined) Fo[k] = F[k]; });
      적을빛.forEach(k=>{ if(m[k] !== undefined) mo[k] = m[k]; });
      _본것.set(fp, { F:Fo, m:mo });
      saveMeasured(fp, F, m);
    }
  }

  /* 비뚤어도 봅니다. 다만 아주 심하면 한 장 더 권합니다 — 막지는 않습니다. */
  return { ok:true, F, m, canvas:cv, pts, note: poseNote(F), word: poseWord(F) };
}

/* ── 3. 오행형상을 가린다 ──────────────────────────
   다섯 갈래에 각각 점수를 매겨 가장 높은 쪽으로 봅니다.
   얼굴마다 조금씩이라도 기운 데가 있으므로 한쪽으로 몰리지 않습니다. */
function pickHyeong(m){
  /* 가늠자는 사람 얼굴 마흔한 장을 실제로 재서 잡았습니다 —
     clues.js 의 NORM 과 같은 자입니다. 가로세로비·하정의 좁아짐·
     네모진 정도, 셋으로 다섯 갈래를 가립니다. */
  const r = m.ratio, t = m.taper, x = (m.boxy===undefined ? 0.8393 : m.boxy);
  const zr = (r - 0.7273) / 0.0333;   /* 넓을수록 큼 */
  const zt = (t - 0.4550) / 0.0203;   /* 아래가 두터울수록 큼 */
  const zx = (x - 0.8393) / 0.0213;   /* 네모질수록 큼 */
  const sc = {
    "목": -zr*0.92 - zt*0.22,         /* 길고 좁으며 위아래가 고른 상 */
    "수":  zr*0.80 - zx*0.62,         /* 넓고 둥글며 모가 없는 상 */
    "화": -zt*1.00 - zx*0.18,         /* 아래로 뾰족이 모이는 상 */
    "토":  zr*0.70 + zt*1.15,         /* 아래가 두텁고 넓은 상 */
    "금":  zx*1.00 + zt*0.14          /* 각이 지고 네모진 상 */
  };
  let best="수", bv=-1e9;
  for(const k in sc){ if(sc[k] > bv){ bv=sc[k]; best=k; } }
  return best;
}

/* ── 4. 기색을 가린다 ─────────────────────────────
   기색은 살빛이 아니라 그 얼굴에 '도는' 빛입니다.
   그래서 밝기 자체가 아니라, 그 얼굴 안에서의 치우침으로 가립니다. */
function pickGisaek(m){
  const { mR:R, mG:G, mB:B, meanL:L } = m;
  const mx = Math.max(R,G,B), mn = Math.min(R,G,B);
  const chae = (mx - mn) / Math.max(mx,1);                 /* 핏기 */
  const warm = (R - G) / Math.max(L,1);                    /* 붉은 쪽으로 치우친 정도 */
  const gb   = (G - B) / Math.max(L,1);                    /* 누런 쪽으로 치우친 정도 */
  const geuneul = (Math.max.apply(null,m.sam) - Math.min.apply(null,m.sam)) / Math.max(L,1);

  /* 얼굴들을 실제로 재어 얻은 자리입니다. 절대 눈금으로 끊으면
     살빛은 평생 그 눈금을 넘지 못해 다섯 기색 중 하나만 나옵니다. */
  const zChae = (chae - 0.1273) / 0.0568;
  const zWarm = (warm - 0.0914) / 0.0393;
  const zGb   = (gb   - 0.0449) / 0.0257;

  /* 흑백으로 찍었거나 색을 다 뺀 사진은 핏기가 0에 가깝습니다. 그걸 그대로
     재면 누구에게나 백기가 섭니다. 색을 못 읽은 것이니 바탕인 황으로 두고,
     읽지 못했다는 사실을 적어 둡니다 — 없는 것을 있다고 하지 않습니다. */
  if (chae < 0.035){ m.색못읽음 = true; return "황"; }

  /* 흑기는 한쪽에만 진 그늘로만 봅니다. 사진이 어두운 것은 사진 이야기라
     따로 여쭙니다. 그늘이 아주 짙을 때만 흑으로 봅니다. */
  if (geuneul > 0.52) return "흑";

  const sc = {
    "백": -zChae,
    "적":  zWarm * 0.82 - zGb * 0.34,
    "청": -zGb * 1.15
  };
  /* 기색마다 넘어야 할 문턱이 다릅니다. 흔한 황기가 바탕이고,
     문턱을 가장 많이 넘어선 쪽이 그 얼굴에 도는 빛입니다. */
  const need = { "백":0.50, "적":0.38, "청":0.62 };
  let best = "황", bv = 0;
  for (const k in sc) { const over = sc[k] - need[k]; if (over > bv) { bv = over; best = k; } }
  return best;
}

/* ── 5. 삼정을 가린다 ─────────────────────────────── */
/* 사람들 사이에서 잰 세 마디의 복판과 흔들림 — 얼굴 41장에서 나왔습니다.
   아래 마디는 누구나 길어서, 그 얼굴 안에서만 보면 늘 아래가 이깁니다. */
const SAM_BASE = [[0.3271,0.0112],[0.3196,0.0181],[0.3526,0.0214]];
function samZ(m){
  const F = m.F;
  if (!F || !F.sam) return null;
  return [0,1,2].map(i => (F.sam[i] - SAM_BASE[i][0]) / SAM_BASE[i][1]);
}
function pickSamjeong(m){
  /* 삼정은 세 마디의 길이로 봅니다. 밝기로 보면 세 마디가 거의 같아
     아무 뜻도 못 담고, 폭으로 보면 이마가 늘 이깁니다.
     그 얼굴 안에서가 아니라 사람들 사이에서 견주어야 갈립니다. */
  const z = samZ(m);
  if (z){
    const i = z.indexOf(Math.max.apply(null, z));
    return ["상","중","하"][i];
  }
  const [a,b,c] = m.sam;
  const mx = Math.max(a,b,c);
  return mx===a ? "상" : (mx===b ? "중" : "하");
}

/* ── 6. 궁별 등급 ─────────────────────────────────
   그 자리가 얼굴 평균보다 밝고 결이 고르면 트임,
   어둡거나 결이 거칠면 막힘으로 봅니다. */
function gradeAll(m){
  const ks = GUNG.map(G=>G.k);
  const v = ks.map(k => m.gung[k].L - m.gung[k].sd*0.42);
  /* 얼굴 평균으로 나눠, 사진이 밝든 어둡든 같은 자로 재게 합니다. */
  const face = m.meanL || (v.reduce((a,b)=>a+b,0)/v.length) || 1;
  const rel = v.map(x => x / Math.max(face,1));
  /* 자리마다 타고난 밝기가 달라서, 그 자리 무리 안에서 견줍니다.
     얼굴 열두 자리끼리 견주면 눈두덩은 누구나 막히고 산근은 누구나 트입니다. */
  const z = ks.map((k,i)=>{
    const bs = (typeof GUNG_BASE !== "undefined") && GUNG_BASE[k];
    if(!bs) return 0;
    /* 표본이 좁게 뭉친 자리가 눈금만 민감해지지 않게 폭을 잡아 둡니다. */
    const sd = Math.max(0.055, Math.min(0.20, bs[1]));
    return (rel[i] - bs[0]) / sd;
  });
  /* ── 모양도 함께 잽니다 ─────────────────────────
     빛만으로 자리를 가리면 얼굴이 아주 달라도 같은 꼴이 나옵니다.
     살빛은 그날의 기운이고 생김은 타고난 그릇이니, 둘을 섞어야
     사람마다 다른 자리가 섭니다. 관상이 본디 보던 것도 생김이고요.
     자리마다 옛 관상서가 함께 보던 축을 끌어옵니다. */
  const 모양축 = {
    "명":   [["미간", 1]],
    "관록": [["이마높", .6], ["이마폭", .4]],
    "복덕": [["이마모서리", 1]],
    "천이": [["이마모서리", .5], ["이마폭", .5]],
    "부모": [["상정", 1]],
    "형제": [["미길", .7], ["미안", .3]],
    "전택": [["미안", 1]],
    "처첩": [["눈길", .5], ["눈각", .5]],
    "질액": [["산근폭", 1]],
    /* 와잠 하나로는 사람 사이 벌어짐이 0.7픽셀뿐이라 자식·기다림 자리 등급이
       통째로 잡음이었습니다. 또렷하게 재지는 눈높이를 함께 겁니다. */
    "남녀": [["와잠", .6], ["눈높", .4]],
    "재백": [["준두", .6], ["콧볼폭", .4]],
    "노복": [["지각", .6], ["턱길", .4]]
  };
  const A = (typeof axes === "function" && m.F) ? axes(m.F) : null;
  const 모양z = ks.map(k=>{
    if (!A || typeof zOf !== "function") return null;
    const 축 = 모양축[k]; if (!축) return null;
    let v = 0, w = 0;
    for (const [ax, wt] of 축){
      const t = zOf(A, ax);
      if (!isFinite(t)) continue;
      v += Math.max(-2.2, Math.min(2.2, t)) * wt; w += wt;
    }
    return w ? v / w : null;
  });

  /* 가린 자리는 빛으로 가릴 수 없습니다. 어둡다고 막혔다 하면 거짓입니다.
     그 자리는 빛을 빼고 생김만으로 봅니다. */
  const cov = m.covered || {};
  ks.forEach((k,i)=>{
    const sh = 모양z[i];
    if (cov[k])      z[i] = (sh === null) ? 0 : sh;
    else if (sh !== null) z[i] = z[i] * 0.55 + sh * 0.45;
  });
  const out = {}, zz = {};
  ks.forEach((k,i)=>{ out[k] = z[i] > 0.58 ? 0 : (z[i] < -0.58 ? 2 : 1); zz[k]=z[i]; });
  out.__z = zz;
  out.__cov = ks.filter(k=>cov[k]);
  /* 어느 얼굴에도 가진 것과 고칠 것이 함께 있어야 풀이가 섭니다.
     고르게 뭉친 얼굴이면 높은 차례·낮은 차례로 조금 벌려 줍니다.

     다만 억지로 셋까지 끌어올리면, 자로 잰 값이 서로 다른 두 얼굴이
     같은 꼴로 뭉개집니다. 마흔한 장으로 재어 보니 셋이면 두 얼굴이 겹치고
     둘이면 마흔한 장이 모두 갈립니다. 둘만 세워 두고 나머지는 자가 정하게 둡니다. */
  const order = ks.map((k,i)=>({k, z:z[i]})).sort((a,b)=>b.z-a.z);
  let open = ks.filter(k=>out[k]===0).length;
  for(let i=0; open<2 && i<order.length; i++)
    if(out[order[i].k]!==0){ out[order[i].k]=0; open++; }
  let block = ks.filter(k=>out[k]===2).length;
  for(let i=order.length-1; block<2 && i>=0; i--)
    if(out[order[i].k]===1){ out[order[i].k]=2; block++; }
  return out;
}

/* ── 7. 유년운기 ──────────────────────────────────── */
function yunOf(age, sex){
  const a = Math.max(1, Math.min(99, age|0));
  const y = YUN[a] || YUN[99];
  if (a <= 14){
    const side = (a<=7) === (sex==="남") ? "왼쪽" : "오른쪽";
    return { bu:side+" 귀 "+y[0], g:y[1], ear:true };
  }
  return { bu:y[0], g:y[1] };
}

/* ── 8. 고르게 흩어주는 제비 ───────────────────────
   같은 사진·같은 나이면 늘 같은 결과가 나오되,
   사람이 바뀌면 다른 백귀가 서도록 수치에서 뽑습니다. */
function seedOf(m, age, sex){
  const v = [m.meanL, m.sd, m.mR, m.mG, m.mB, m.ratio*100, m.taper*100, age, sex==="남"?7:13];
  let h = 2166136261;
  for(const x of v){
    const n = Math.round(x*73) | 0;
    h ^= n; h = Math.imul(h, 16777619);
  }
  return (h>>>0);
}
function pickFrom(pool, seed, salt){
  let h = (seed ^ Math.imul(salt+1, 2654435761)) >>> 0;
  h = (h ^ (h>>>13)) >>> 0;
  h = Math.imul(h, 1274126177) >>> 0;
  h = (h ^ (h>>>16)) >>> 0;
  return pool[h % pool.length];
}

/* ── 9. 전체 판정 ─────────────────────────────────── */
function divine(m, age, sex){
  const seed    = seedOf(m, age, sex);
  const hyeong  = pickHyeong(m);
  const gisaek  = pickGisaek(m);
  const samjeong= pickSamjeong(m);
  const 삼정잣대 = samZ(m);          /* 사람들과 견준 거리 — 첩에서 숫자를 풀 때 씁니다 */
  const gyo     = hyeongGisaekMal(hyeong, gisaek);
  const yun     = yunOf(age, sex);

  /* 좌우 기울기 — 일월각.
     m.left 는 사진의 왼쪽 반입니다. 사진의 왼쪽은 마주 선 사람의 오른쪽이고요.
     낮은 쪽을 찾아 사진 기준과 몸 기준을 함께 들고 다닙니다. */
  /* 밝기로 보면 조명이 한쪽에서 오는 것까지 기울기로 읽힙니다.
     그건 얼굴 이야기가 아니라 전등 이야기라, 자리의 높낮이로 봅니다. */
  const Fm = m.F;
  let tilt = 0;
  if (Fm && Fm.raw){
    const d1 = (Fm.pts.미상왼.y - Fm.pts.미상오른.y) / Fm.FW;      /* 눈썹 높낮이 */
    const d2 = (Fm.pts.눈위왼.y - Fm.pts.눈위오른.y) / Fm.FW;      /* 눈 높낮이 */
    const d3 = (Fm.pts.입꼬리왼.y - Fm.pts.입꼬리오른.y) / Fm.FW;  /* 입꼬리 높낮이 */
    tilt = (d1*0.45 + d2*0.35 + d3*0.20);
  } else {
    tilt = (m.left - m.right) / Math.max(m.meanL,1) * 0.1;
  }
  const gyeol = Math.abs(tilt) < 0.012 ? null
              : (tilt > 0 ? "왼쪽" : "오른쪽");          /* 아래로 처진 쪽이 낮은 쪽 */
  const gyeolMom = gyeol ? (gyeol==="왼쪽" ? "오른" : "왼") : null;
  /* 남좌여우 — 남자는 왼쪽, 여자는 오른쪽을 본인 자리로 봅니다 (몸 기준) */
  const ju = (sex==="남") ? "왼" : "오른";

  /* 열두 자리 — 그 얼굴 안에서 서로 견주어 가립니다.
     무서워하는 얼굴로 보여준 셋은 실제로 서지 않습니다. 말이 어긋나니까요. */
  /* 오늘 보여 줄 무서워하는 얼굴 석 장 */
  const pick3 = PICK_POOL.map((th,ti)=>({ i: pickFrom(th.pool, seed, 907+ti*53), q: th.q }));
  const 보류 = pick3.map(x=>x.i);
  const lvAll = gradeAll(m);
  const zAll = lvAll.__z || {};
  const 가린자리 = lvAll.__cov || [];
  const jari = GUNG.map((G, i) => {
    const lv = lvAll[G.k];
    const pool = G.pool.filter(x=>보류.indexOf(x)<0);
    const bg = pickFrom(pool.length?pool:G.pool, seed, i*31 + lv);
    /* 덮인 자리는 빛을 빼고 모양으로만 보았으니, 짚는 말도
       빛·금·그늘을 말하지 않는 쪽(cdx)으로 바꿔 끼웁니다. */
    const z = (zAll[G.k]===undefined ? 0 : zAll[G.k]);
    /* 등급이 같으면 글자까지 같아지던 데를 가릅니다.
       dx·rd·ac 를 여러 갈래로 적어 두고, 그 자리에서 잰 값으로 한 갈래를 뽑습니다.
       같은 등급 안의 갈래끼리는 뜻이 같고 짚는 데만 다릅니다.
       세 등급을 다 풀어 두어, 다른 등급 글을 꺼내 쓰는 데서도 묶음이 새지 않게 합니다. */
    const 눈 = (()=>{ /* 잰 값에서 고른 정수 — 사람마다 다르고 늘 같습니다 */
      const a = Math.round((z + 12) * 1000), b = (seed|0) + i * 7919;
      let h = (a ^ Math.imul(b, 2654435761)) >>> 0;
      h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
      return (h ^ (h >>> 16)) >>> 0; })();
    const 뽑기 = (v, 몇)=> Array.isArray(v) ? (v.length ? v[몇 % v.length] : "") : v;
    const 덮 = 가린자리.indexOf(G.k) >= 0;
    const g = Object.assign({}, G, { lv: G.lv.map((o, n)=>{
      if (!o) return o;
      const 틀 = n * 5;
      return Object.assign({}, o, {
        dx: 뽑기((덮 && o.cdx) ? o.cdx : o.dx, (눈 >>> 틀) >>> 0),
        rd: 뽑기(o.rd,                          (눈 >>> (틀 + 11)) >>> 0),
        ac: 뽑기((덮 && o.cac) ? o.cac : o.ac,  (눈 >>> (틀 + 21)) >>> 0)
      }); }) });
    return { g, lv, bg, z };
  });
  /* 실제로 가장 환한 자리와 가장 그늘진 자리.
     덮인 자리는 빛이 아니라 모양에서 나온 값이라 "환하다/그늘졌다"고
     말할 수 없습니다. 그래서 고를 때 빼고, 뺄 것이 너무 많으면 그때만 씁니다. */
  const 성한것 = jari.filter(j => 가린자리.indexOf(j.g.k) < 0);
  const byZ = (성한것.length >= 4 ? 성한것 : jari).slice().sort((a,b)=>b.z-a.z);
  const brightest = byZ[0], darkest = byZ[byZ.length-1];

  /* 올해를 쥔 자리 */
  let boss = jari.find(j => j.g.k === yun.g) || jari[0];

  /* 지난 일을 짚을 나이 — 유년 부위가 바뀌는 길목 중 하나 */
  const marks = [19,22,25,28,31,35,38,41,44,48,51,56,60,64,70];
  const past  = marks.filter(a => a <= age-1);
  /* marks 의 맨 앞이 열아홉이라 열넷~열여덟에서는 past 가 빕니다.
     그때 Math.max(15, age-2) 가 나이보다 커져, 열네 살 손님께
     "15세 무렵 … 지났습니다"라고 적고 있었습니다. 나이를 넘지 못하게 둡니다. */
  const hitAge = past.length ? past[past.length-1]
               : Math.max(1, Math.min(age - 1, Math.max(15, age - 2)));
  const hitYun = yunOf(hitAge, sex);

  /* 무게 — 막힌 자리가 몇인가 */
  const blocked = jari.filter(j=>j.lv===2).length;
  const opened  = jari.filter(j=>j.lv===0).length;

  /* 기색은 빛을 탑니다. 어둡거나 날아간 사진이면 그 사실을 숨기지 않습니다. */
  const light = (m.meanL < 118) ? "어둠" : (m.meanL > 228 ? "날림" : "");
  return { seed, hyeong, gisaek, samjeong, 삼정잣대, 삼정복판:SAM_BASE.map(v=>v[0]), gyo, yun, gyeol, gyeolMom, ju, sex, age, pick3, light, 가린자리,
           brightest, darkest,
           jari, boss, hitAge, hitYun, blocked, opened, m };
}

/* ── 10. 처방 ─────────────────────────────────────── */
function prescribe(R){
  const oh = OH[R.hyeong];
  const gi = GISAEK[R.gisaek];

  /* 점자리 — 올해를 쥔 궁에서. 자리마다 바랄 것을 함께 답니다. */
  const jk = JEOM[R.boss.g.k] ? R.boss.g.k : "명";
  const je = (typeof JEOM_E !== "undefined" && JEOM_E[jk]) || [];
  const jeom = JEOM[jk].map((p,i)=> Object.assign({}, p, { e: je[i] || "" }));

  /* 색 — 그릇의 길색 둘, 그리고 지금 기운이 누르는 색 하나.
     같은 형상이라도 고쳐야 할 자리가 다르면 쓰는 데가 달라집니다. */
  const needK = (R.boss.lv >= 1) ? R.boss.g.k
              : ((R.darkest && R.darkest.g.k !== R.boss.g.k) ? R.darkest.g.k : R.boss.g.k);
  const ter = (typeof SAEK_TER !== "undefined" && SAEK_TER[needK]) || null;
  const gil = oh.ggil.map((c,i)=>{
    const c2 = c.slice();
    if(ter) c2[2] = ter[0][i] || c2[2];
    return c2;
  });
  let hyung = oh.ghyung.slice();
  if(ter) hyung[2] = ter[1];
  hyung[2] = hyung[2] + "에는 올해 쓰지 마세요";
  /* 기색이 그릇을 누르고 있으면 꺼릴 색을 기색 쪽으로 바꿉니다 */
  if (R.gyo.dan === "극(剋)"){
    const saekColor = {
      "청":["쪽빛","#2a4a6b"], "적":["다홍","#b9372c"], "황":["치자","#c8a02e"],
      "백":["백자","#ddd6c7"], "흑":["먹빛","#1d1a1a"] }[R.gisaek];
    hyung = [saekColor[0], saekColor[1], "올해는 몸에 지니지 마세요",
             "지금 도는 "+R.gisaek+"기가 손님 그릇을 누르는 색입니다",
             "올해 손님 얼굴에 도는 " + R.gisaek + "기가 타고난 " + R.hyeong +
             "의 그릇을 누르고 있습니다. 그 기운과 같은 색을 몸에 지니면 누르는 쪽에 힘을 보태는 꼴이라, " +
             "되던 일도 한 박자씩 늦어집니다. 올해만 피하시면 됩니다 — 기색은 반년이면 바뀝니다."];
  }

  /* 머리 — 그릇에 삼정을 더해 */
  const mori = oh.mori.slice();
  if (R.samjeong === "하" && R.hyeong !== "토")
    mori[1] += " 턱을 덮지 마시고요. 손님은 뒤로 갈수록 좋아지는 얼굴입니다.";
  if (R.samjeong === "상")
    mori[1] += " 이마는 끝까지 드러내세요. 초년에 받은 것이 거기 있습니다.";
  /* 고쳐야 할 자리에 맞춘 한 줄을 더 얹습니다 */
  if (typeof MORI_TER !== "undefined" && MORI_TER[needK])
    mori[1] += " " + MORI_TER[needK];

  return { jeom, gil, hyung, mori, oh, gi };
}

/* ── 11. 총평 ─────────────────────────────────────
   올해 한 줄 판정, 할 일 셋, 피할 것 둘, 그리고 시기. */
function summarize(R){
  const oh  = R.hyeong;
  const dow = OH_SAENG_ME[oh];           /* 나를 생해 주는 오행 */
  const nur = OH_GEUK_ME[oh];            /* 나를 누르는 오행 */
  const go  = (OH_WOL[dow]||[]).slice(0,2);
  const stop= (OH_WOL[nur]||[]).slice(0,2);

  /* 트인 자리에서 할 일을, 막힌 자리에서 피할 것을 */
  const open   = R.jari.filter(j=>j.lv===0);
  const block  = R.jari.filter(j=>j.lv===2);
  const mid    = R.jari.filter(j=>j.lv===1);

  /* 할 일은 고쳐야 할 데에서 나옵니다. 우두머리를 맨 앞에 두고,
     막힌 자리, 반반, 그래도 모자라면 트인 자리 순으로 셋을 고릅니다. */
  /* 우두머리가 막혔거나 서성이면 맨 앞에, 비켜섰으면 막힌 자리 뒤에 둡니다 */
  /* 덮인 자리는 빛을 못 봤으니, 같은 등급이면 맨 뒤로 미룹니다.
     안 그러면 "올해 할 일 셋"이 전부 안경·앞머리에 가렸던 자리로 채워집니다. */
  const 덮임 = (j)=> (R.가린자리||[]).indexOf(j.g.k) >= 0;
  const 뒤로 = (a)=> a.filter(j=>!덮임(j)).concat(a.filter(덮임));
  const rest = [block, mid, open].map(a=>뒤로(a.filter(j=>j!==R.boss)));
  const order = (R.boss.lv>=1)
    ? [R.boss].concat(rest[0], rest[1], rest[2])
    : rest[0].concat([R.boss], rest[1], rest[2]);
  const todo = [];
  for(const j of order){
    if(todo.length>=3) break;
    if(todo.some(x=>x.k===j.g.k)) continue;
    todo.push({ k:j.g.k, n:j.g.n, t:j.g.lv[j.lv].ac });
  }

  /* 셋이 전부 덮인 자리로 차면, 손님은 "안 보이는 데만 가지고 말하네"
     하십니다. 그래서 하나는 성히 본 자리로 바꿔 끼웁니다.
     올해를 쥔 자리는 해와 묶여 있으니 그것만은 두고, 뒤엣것부터 바꿉니다. */
  if (todo.length === 3 && todo.every(x=>(R.가린자리||[]).indexOf(x.k) >= 0)){
    const 성한 = order.find(j => !덮임(j) && !todo.some(x=>x.k===j.g.k));
    if (성한){
      let i = todo.length - 1;
      while (i > 0 && todo[i].k === R.boss.g.k) i--;
      todo[i] = { k:성한.g.k, n:성한.g.n, t:성한.g.lv[성한.lv].ac };
    }
  }

  /* 피할 것은 막힌 데에서. 할 일과 겹치지 않는 자리를 먼저 씁니다. */
  /* 후보를 먼저 둘로 자르면, 거기서 같은 자리가 겹쳤을 때 하나만 남습니다.
     겹치는 것을 먼저 거르고 그다음에 둘을 집습니다. */
  const avoidPool = block.concat(mid).filter(j=>!todo.some(x=>x.k===j.g.k));
  const avoidSrc = avoidPool.concat(block, mid, R.jari);
  const avoid = [];
  for(const j of avoidSrc){
    if(avoid.length>=2) break;
    if(avoid.some(x=>x.k===j.g.k)) continue;
    avoid.push({ k:j.g.k, n:j.g.n, t:PIHAL[j.g.k] });
  }

  /* 한 줄 판정 — 맞물림과 우두머리로 */
  const bg = BG[R.boss.bg];
  const bgNm = bg[0] + (/^[\u4e00-\u9fff]+$/.test(bg[1]||"") ? " "+bg[1] : "");
  /* 받침이 있으면 "이", 없으면 "가" */
  const bgLast = bg[0].charCodeAt(bg[0].length-1);
  const bgJo = (bgLast>=0xAC00 && bgLast<=0xD7A3 && (bgLast-0xAC00)%28!==0) ? "이" : "가";
  const dan = {
    /* 제1첩에서 사이를 짚고, 제6첩에서 바꿀 것을 적습니다.
       여기는 마지막 장이니 올해 할 셈 한 줄만 둡니다. */
    "생(生)":    { s:"밀어도 되는 해",   d:"하려던 것을 올해 안에 하십시오." },
    "겹침":      { s:"한쪽으로 몰리는 해", d:"고르는 데 공을 들이십시오. 고른 뒤는 쉽습니다." },
    "설(洩)":    { s:"새는 해",         d:"벌이를 늘리기 전에 나가는 데 하나를 끊으십시오." },
    "극(剋)":    { s:"눌리는 해",       d:"올해는 버티는 쪽이 이깁니다. 손님 탓이 아닙니다." },
    "반극(反剋)":{ s:"밀면 되지만 뒤가 상하는 해", d:"어디서 손을 뗄지 먼저 정하고 시작하십시오." }
  }[R.gyo.dan] || { s:"", d:"" };

  return {
    verdict: dan.s, verdictMore: dan.d,
    boss: [
      `${R.yun.bu}에 선 ${bgNm}${bgJo} 지금은 비켜서 있습니다. 그래도 ${R.boss.g.n}이 올해를 쥡니다.`,
      `${R.yun.bu}에서 ${bgNm}${bgJo} 서성입니다. ${R.boss.g.n}이 올해를 쥡니다.`,
      `${R.yun.bu}를 ${bgNm}${bgJo} 막고 섰습니다. ${R.boss.g.n}이 올해를 쥡니다.`
    ][R.boss.lv],
    todo, avoid,
    go, stop, dow, nur,
    openN: open.length, blockN: block.length
  };
}

/* ── 13. 지난번과 견주기 ──────────────────────────
   얼굴 사진은 남기지 않습니다. 판정만 기기 안에 적어 두었다가,
   다음에 오셨을 때 어느 자리가 달라졌는지 짚어 드립니다. */
const KEEP = "baekgwi-gwansang-last";

function saveReading(R){
  try{
    localStorage.setItem(KEEP, JSON.stringify({
      t: Date.now(),
      age: R.yunAge || null,
      hyeong: R.hyeong, gisaek: R.gisaek, samjeong: R.samjeong,
      dan: R.gyo.dan,
      boss: { k:R.boss.g.k, n:R.boss.g.n, bg:R.boss.bg },
      lv: R.jari.map(j=>[j.g.k, j.lv, j.bg])
    }));
  }catch(e){}
}
function loadReading(){
  try{
    const v = JSON.parse(localStorage.getItem(KEEP)||"null");
    if(!v || !v.lv || !v.lv.length) return null;
    return v;
  }catch(e){ return null; }
}
function clearReading(){ try{ localStorage.removeItem(KEEP); }catch(e){} }

/* 지난 판정과 이번 판정을 맞대어 봅니다 */
function compareReading(prev, R){
  if(!prev) return null;
  const days = Math.max(0, Math.round((Date.now()-prev.t)/86400000));
  const was = {}; prev.lv.forEach(([k,lv,bg])=>{ was[k]={lv,bg}; });
  const better=[], worse=[], same=[];
  R.jari.forEach(j=>{
    const w = was[j.g.k]; if(!w) return;
    if(j.lv < w.lv) better.push({ n:j.g.n, from:w.lv, to:j.lv });
    else if(j.lv > w.lv) worse.push({ n:j.g.n, from:w.lv, to:j.lv });
    else same.push(j.g.n);
  });
  const bossMoved = prev.boss.k !== R.boss.g.k;
  const bossGone  = !bossMoved && prev.boss.bg !== R.boss.bg;
  return { days, better, worse, same, bossMoved, bossGone,
           prevBoss: prev.boss, prevHyeong: prev.hyeong, prevGisaek: prev.gisaek,
           gisaekMoved: prev.gisaek !== R.gisaek };
}

/* ── 14. 사흘 동안 관상첩을 들고 있기 ──────────────
   복채를 내고 읽던 중에 뒤로 한 번 눌렀다고 첩이 사라지면
   손님은 돈을 잃은 기분이 듭니다. 그렇다고 평생 들고 있으면
   그건 "다시보기"가 되어 버리고요. 사흘만 들고 있습니다.

   사진은 여기에도 담지 않습니다 — 거울 앞에서 드린 약속입니다.
   담는 것은 잰 수뿐이고, 그 수로 같은 첩이 그대로 다시 납니다.
   얼굴 그림만 비는데, 그건 같은 사진을 다시 올리시면 돌아옵니다. */
const KEEP_FULL = "baekgwi-gwansang-keep3";
const KEEP_DAYS = 3;

function saveFull(F, m, age, sex){
  try{
    if (!F || !m) return;
    const 점 = p => ({ x: Math.round(p.x*10)/10, y: Math.round(p.y*10)/10 });
    const Fo = {};
    for (const k in F){
      if (k === "raw" || k === "unrot") continue;        /* 되살릴 때 쓰지 않습니다 */
      const v = F[k];
      if (typeof v === "function") continue;
      if (k === "rawAll" && Array.isArray(v)){ Fo[k] = v.map(점); continue; }
      if (k === "pts" && v && typeof v === "object"){
        const o = {}; for (const n in v) if (v[n]) o[n] = 점(v[n]);
        Fo[k] = o; continue;
      }
      Fo[k] = v;
    }
    const mo = {};
    for (const k in m){ if (k === "F") continue; mo[k] = m[k]; }
    localStorage.setItem(KEEP_FULL, JSON.stringify({
      t: Date.now(), age, sex, F: Fo, m: mo
    }));
  }catch(e){}
}

/* 사흘이 지났으면 없는 것으로 봅니다 */
function loadFull(){
  try{
    const v = JSON.parse(localStorage.getItem(KEEP_FULL) || "null");
    if (!v || !v.F || !v.m || !v.t) return null;
    const 지난날 = (Date.now() - v.t) / 86400000;
    if (지난날 > KEEP_DAYS || 지난날 < -1){ clearFull(); return null; }
    v.F.raw = v.F.rawAll;        /* 기울기를 자리로 재는 길을 그대로 탑니다 */
    v.m.F = v.F;
    v.남은시간 = Math.max(0, KEEP_DAYS*86400000 - (Date.now() - v.t));
    return v;
  }catch(e){ return null; }
}
function clearFull(){ try{ localStorage.removeItem(KEEP_FULL); }catch(e){} }
