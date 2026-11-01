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
const 적을빛 = ["meanL","sd","mR","mG","mB","sam","left","right","gung",
  "ratio","taper","boxy","bandW"];   /* 이 넷을 빼먹으면 그릇과 제비가 흔들립니다 */
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
async function readFace(srcEl){
  const cv = toCanvas(srcEl, 720);
  if(!cv) return { err:"그림을 열지 못했습니다" };

  let pts = null;
  try { pts = await findLandmarksStable(cv, 3); }
  catch(e){ return { err:"얼굴을 읽는 기계를 못 깨웠습니다", net:true }; }
  if(!pts) return { err:"얼굴을 못 찾았습니다" };

  const F = measure(pts, cv.width, cv.height);
  if(!F) return { err:"얼굴이 너무 작습니다" };

  let m = readSkin(cv, F, null);
  if(!m) return { err:"빛이 모자랍니다", F, canvas:cv, soft:true };

  /* 한 번 본 사진이면 그때 잰 수를 그대로 씁니다.
     기계가 볼 때마다 머리카락 굵기만큼 다르게 읽어, 그냥 두면
     같은 얼굴에 다른 말을 하게 됩니다. */
  const fp = fingerprint(cv);
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
  /* 가늠자는 얼굴들을 실제로 재서 잡았습니다 — clues.js 의 NORM 과 같은 자입니다.
     가로세로비·하정의 좁아짐·네모진 정도, 셋으로 다섯 갈래를 가립니다. */
  const r = m.ratio, t = m.taper, x = (m.boxy===undefined ? 0.852 : m.boxy);
  const zr = (r - 0.704) / 0.062;   /* 넓을수록 큼 */
  const zt = (t - 0.459) / 0.0260;   /* 아래가 두터울수록 큼 */
  const zx = (x - 0.852) / 0.0277;   /* 네모질수록 큼 */
  const sc = {
    "목": -zr*0.92 - zt*0.22,         /* 길고 좁으며 위아래가 고른 상 */
    "수":  zr*0.80 - zx*0.62,         /* 넓고 둥글며 모가 없는 상 */
    "화": -zt*1.00 - zx*0.18,         /* 아래로 뾰족이 모이는 상 */
    "토":  zt*0.80 + zr*0.42,         /* 아래가 두텁고 넓은 상 */
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
  const zChae = (chae - 0.309) / 0.052;
  const zWarm = (warm - 0.262) / 0.058;
  const zGb   = (gb   - 0.128) / 0.030;

  /* 흑기는 한쪽에만 진 그늘로만 봅니다. 사진이 어두운 것은 사진 이야기라
     따로 여쭙니다. 그늘이 아주 짙을 때만 흑으로 봅니다. */
  if (geuneul > 0.33) return "흑";

  const sc = {
    "백": -zChae,
    "적":  zWarm * 0.82 - zGb * 0.34,
    "청": -zGb * 1.15
  };
  /* 기색마다 넘어야 할 문턱이 다릅니다. 흔한 황기가 바탕이고,
     문턱을 가장 많이 넘어선 쪽이 그 얼굴에 도는 빛입니다. */
  const need = { "백":0.72, "적":0.62, "청":1.00 };
  let best = "황", bv = 0;
  for (const k in sc) { const over = sc[k] - need[k]; if (over > bv) { bv = over; best = k; } }
  return best;
}

/* ── 5. 삼정을 가린다 ─────────────────────────────── */
function pickSamjeong(m){
  /* 삼정은 세 마디의 길이로 봅니다. 밝기로 보면 세 마디가 거의 같아
     아무 뜻도 못 담고, 폭으로 보면 이마가 늘 이깁니다.
     그 얼굴 안에서가 아니라 사람들 사이에서 견주어야 갈립니다. */
  const F = m.F;
  if (F && F.sam){
    const z = [ (F.sam[0]-0.352)/0.0157,
                (F.sam[1]-0.371)/0.0351,
                (F.sam[2]-0.273)/0.0408 ];
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
  const out = {}, zz = {};
  ks.forEach((k,i)=>{ out[k] = z[i] > 0.58 ? 0 : (z[i] < -0.58 ? 2 : 1); zz[k]=z[i]; });
  out.__z = zz;
  /* 어느 얼굴에도 가진 것과 고칠 것이 함께 있어야 풀이가 섭니다.
     고르게 뭉친 얼굴이면 높은 차례·낮은 차례로 조금 벌려 줍니다. */
  const order = ks.map((k,i)=>({k, z:z[i]})).sort((a,b)=>b.z-a.z);
  let open = ks.filter(k=>out[k]===0).length;
  for(let i=0; open<3 && i<order.length; i++)
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
  const jari = GUNG.map((G, i) => {
    const lv = lvAll[G.k];
    const pool = G.pool.filter(x=>보류.indexOf(x)<0);
    const bg = pickFrom(pool.length?pool:G.pool, seed, i*31 + lv);
    return { g:G, lv, bg, z: (zAll[G.k]===undefined ? 0 : zAll[G.k]) };
  });
  /* 실제로 가장 환한 자리와 가장 그늘진 자리 */
  const byZ = jari.slice().sort((a,b)=>b.z-a.z);
  const brightest = byZ[0], darkest = byZ[byZ.length-1];

  /* 올해를 쥔 자리 */
  let boss = jari.find(j => j.g.k === yun.g) || jari[0];

  /* 지난 일을 짚을 나이 — 유년 부위가 바뀌는 길목 중 하나 */
  const marks = [19,22,25,28,31,35,38,41,44,48,51,56,60,64,70];
  const past  = marks.filter(a => a <= age-1);
  const hitAge = past.length ? past[past.length-1] : Math.max(15, age-2);
  const hitYun = yunOf(hitAge, sex);

  /* 무게 — 막힌 자리가 몇인가 */
  const blocked = jari.filter(j=>j.lv===2).length;
  const opened  = jari.filter(j=>j.lv===0).length;

  /* 기색은 빛을 탑니다. 어둡거나 날아간 사진이면 그 사실을 숨기지 않습니다. */
  const light = (m.meanL < 118) ? "어둠" : (m.meanL > 228 ? "날림" : "");
  return { seed, hyeong, gisaek, samjeong, gyo, yun, gyeol, gyeolMom, ju, sex, age, pick3, light,
           brightest, darkest,
           jari, boss, hitAge, hitYun, blocked, opened, m };
}

/* ── 10. 처방 ─────────────────────────────────────── */
function prescribe(R){
  const oh = OH[R.hyeong];
  const gi = GISAEK[R.gisaek];

  /* 점자리 — 올해를 쥔 궁에서 */
  const jeom = (JEOM[R.boss.g.k] || JEOM["명"]).slice();

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
             "지금 도는 "+R.gisaek+"기가 손님 그릇을 누르는 색입니다"];
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
  const rest = [block, mid, open].map(a=>a.filter(j=>j!==R.boss));
  const order = (R.boss.lv>=1)
    ? [R.boss].concat(rest[0], rest[1], rest[2])
    : rest[0].concat([R.boss], rest[1], rest[2]);
  const todo = [];
  for(const j of order){
    if(todo.length>=3) break;
    if(todo.some(x=>x.k===j.g.k)) continue;
    todo.push({ k:j.g.k, n:j.g.n, t:j.g.lv[j.lv].ac });
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
    "생(生)":    { s:"밀어도 되는 해",   d:"기운이 손님 그릇을 받칩니다. 하려던 것을 하세요." },
    "겹침":      { s:"한쪽으로 몰리는 해", d:"그릇과 기운이 같은 갈래라 색이 짙어집니다. 크게 되거나 크게 상합니다." },
    "설(洩)":    { s:"새는 해",         d:"쓰는 데가 많아 모이지 않습니다. 벌이보다 새는 자리를 먼저 막으세요." },
    "극(剋)":    { s:"눌리는 해",       d:"재주가 있어도 올해는 안 펴집니다. 손님 탓이 아니에요. 버티는 것이 이기는 겁니다." },
    "반극(反剋)":{ s:"밀면 되지만 뒤가 상하는 해", d:"밀어붙이면 되기는 합니다. 다만 뒤가 상해요. 한 번에 다 가지려 하지 마세요." }
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
