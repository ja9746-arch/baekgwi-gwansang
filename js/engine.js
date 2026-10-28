/* 백귀관상 — 판정 엔진
   사진에서 실제로 수치를 재고, 그 수치로 관상을 가립니다.

   재는 것
     삼정(三停)    이마·중앙·턱 세 구간의 밝기와 두께
     오악(五岳)    이마·좌우 광대·코·턱의 솟음
     윤곽          얼굴의 가로세로비와 하정이 좁아지는 정도 → 오행형상
     기색(氣色)    전체 색이 어느 쪽으로 기울었는가 → 청적황백흑
     십이궁        궁마다 그 자리의 밝기를 얼굴 평균과 견주어 등급

   가리는 것
     오행형상 → 타고난 그릇
     기색     → 지금의 기운
     둘의 상생상극 → 왜 지금 되고 안 되는가
     궁별 등급 → 열두 자리의 트임과 막힘
     유년운기 → 올해를 쥔 자리와 그 자리의 우두머리 */

/* 얼굴 틀 — 거울면 안에서 길잡이 타원이 차지하는 자리 (백분율) */
const FACE = { x:20, y:11, w:60, h:74 };

/* ── 1. 거울에 비친 그대로를 화폭에 옮긴다 ───────────── */
function captureMirror(srcEl, st, holeW, holeH){
  const CW = 320, CH = Math.max(1, Math.round(CW * holeH / holeW));
  const c = document.createElement("canvas");
  c.width = CW; c.height = CH;
  const g = c.getContext("2d", { willReadFrequently:true });
  g.fillStyle = "#070406"; g.fillRect(0,0,CW,CH);
  const cover = Math.max(holeW/st.natW, holeH/st.natH);
  const w = st.natW*cover*st.scale, h = st.natH*cover*st.scale;
  const k = CW/holeW;
  const dx = (holeW - w)/2 + st.x*holeW/100;
  const dy = (holeH - h)/2 + st.y*holeH/100;
  try { g.drawImage(srcEl, dx*k, dy*k, w*k, h*k); } catch(e){ return null; }
  return c;
}

/* ── 2. 수치를 뽑는다 ──────────────────────────────── */
function readMetrics(canvas){
  const CW = canvas.width, CH = canvas.height;
  let px;
  try { px = canvas.getContext("2d").getImageData(0,0,CW,CH).data; }
  catch(e){ return null; }

  const fx = CW*FACE.x/100, fy = CH*FACE.y/100;
  const fw = CW*FACE.w/100, fh = CH*FACE.h/100;
  const cx = fx+fw/2, cy = fy+fh/2, rx = fw/2, ry = fh/2;

  const lum = (i)=> (px[i]*0.299 + px[i+1]*0.587 + px[i+2]*0.114);
  const inFace = (x,y)=>{ const a=(x-cx)/rx, b=(y-cy)/ry; return a*a+b*b <= 1; };

  /* 얼굴 전체 */
  let n=0, sumL=0, sumL2=0, sumR=0, sumG=0, sumB=0;
  /* 삼정 */
  const band=[{n:0,s:0},{n:0,s:0},{n:0,s:0}];
  /* 좌우 */
  let ln=0, ls=0, rn=0, rs=0;
  /* 살빛 자리 — 윤곽을 재는 데 씁니다 */
  const rowMin=new Array(CH).fill(1e9), rowMax=new Array(CH).fill(-1);

  for(let y=Math.floor(fy); y<Math.ceil(fy+fh); y++){
    if(y<0||y>=CH) continue;
    for(let x=Math.floor(fx); x<Math.ceil(fx+fw); x++){
      if(x<0||x>=CW) continue;
      if(!inFace(x,y)) continue;
      const i=(y*CW+x)*4, L=lum(i);
      n++; sumL+=L; sumL2+=L*L; sumR+=px[i]; sumG+=px[i+1]; sumB+=px[i+2];
      const t=(y-fy)/fh;
      const bi = t<0.34 ? 0 : (t<0.67 ? 1 : 2);
      band[bi].n++; band[bi].s+=L;
      if(x<cx){ ln++; ls+=L; } else { rn++; rs+=L; }
    }
  }
  if(n<400) return null;

  const meanL = sumL/n;
  const sd = Math.sqrt(Math.max(0, sumL2/n - meanL*meanL));
  let mR = sumR/n, mG = sumG/n, mB = sumB/n;

  /* 빛 보정 — 얼굴에서 가장 밝은 자리는 조명색에 가깝습니다.
     그 색으로 나누어, 노란 전등 아래서 찍어도 기색이 흔들리지 않게 합니다. */
  const hi = [];
  for(let y=Math.floor(fy); y<Math.ceil(fy+fh); y++){
    if(y<0||y>=CH) continue;
    for(let x=Math.floor(fx); x<Math.ceil(fx+fw); x++){
      if(x<0||x>=CW||!inFace(x,y)) continue;
      const i=(y*CW+x)*4;
      hi.push([lum(i), px[i], px[i+1], px[i+2]]);
    }
  }
  hi.sort((a,b)=>b[0]-a[0]);
  const take = Math.max(12, Math.round(hi.length*0.03));
  let iR=0,iG=0,iB=0;
  for(let k=0;k<take;k++){ iR+=hi[k][1]; iG+=hi[k][2]; iB+=hi[k][3]; }
  iR/=take; iG/=take; iB/=take;
  const iL = (iR+iG+iB)/3;
  if(iL > 24){
    const kR = iL/Math.max(iR,1), kG = iL/Math.max(iG,1), kB = iL/Math.max(iB,1);
    const lim = v => Math.max(0.72, Math.min(1.38, v));
    mR = Math.min(255, mR*lim(kR));
    mG = Math.min(255, mG*lim(kG));
    mB = Math.min(255, mB*lim(kB));
  }

  /* 살빛 자리를 추려 윤곽을 잡는다 */
  const loL = meanL*0.72, hiL = meanL*1.45;
  for(let y=Math.floor(fy); y<Math.ceil(fy+fh); y++){
    if(y<0||y>=CH) continue;
    for(let x=Math.floor(fx); x<Math.ceil(fx+fw); x++){
      if(x<0||x>=CW) continue;
      if(!inFace(x,y)) continue;
      const i=(y*CW+x)*4, L=lum(i);
      if(L>loL && L<hiL && px[i]>=px[i+2]){
        if(x<rowMin[y]) rowMin[y]=x;
        if(x>rowMax[y]) rowMax[y]=x;
      }
    }
  }
  function widthAt(t0,t1){
    let w=0,c=0;
    for(let y=Math.floor(fy+fh*t0); y<Math.ceil(fy+fh*t1); y++){
      if(y<0||y>=CH||rowMax[y]<0) continue;
      w += rowMax[y]-rowMin[y]; c++;
    }
    return c ? w/c : 0;
  }
  let top=-1, bot=-1;
  for(let y=0;y<CH;y++){ if(rowMax[y]>=0){ if(top<0) top=y; bot=y; } }
  const faceH = (bot>top) ? bot-top : fh;
  const wUp = widthAt(0.10,0.34), wMid = widthAt(0.34,0.67), wLow = widthAt(0.70,0.95);
  const wMax = Math.max(wUp,wMid,wLow,1);

  /* 궁별 자리 */
  const gung = {};
  for(const G of GUNG){
    const gx = fx + fw*G.x/100, gy = fy + fh*G.y/100;
    const hw = fw*G.sx/200, hh = fh*G.sy/200;
    let gn=0, gs=0, gs2=0;
    for(let y=Math.round(gy-hh); y<=Math.round(gy+hh); y++){
      if(y<0||y>=CH) continue;
      for(let x=Math.round(gx-hw); x<=Math.round(gx+hw); x++){
        if(x<0||x>=CW) continue;
        const L=lum((y*CW+x)*4); gn++; gs+=L; gs2+=L*L;
      }
    }
    gung[G.k] = gn ? { L:gs/gn, sd:Math.sqrt(Math.max(0,gs2/gn-(gs/gn)*(gs/gn))) }
                   : { L:meanL, sd:sd };
  }

  /* 얼굴이 맞는지 — 결이 거의 없거나 너무 어둡고 너무 밝으면 못 읽습니다 */
  let rows=0;
  for(let y=0;y<CH;y++) if(rowMax[y]>=0) rows++;
  const ok = sd >= 10 && meanL > 16 && meanL < 243 && rows >= fh*0.35;

  return {
    ok, meanL, sd, mR, mG, mB,
    sam: band.map(b=> b.n ? b.s/b.n : meanL),
    left: ln?ls/ln:meanL, right: rn?rs/rn:meanL,
    ratio: wMax/Math.max(faceH,1),      /* 가로세로비 */
    taper: wLow/Math.max(wMid,1),       /* 하정이 좁아지는 정도 */
    brow:  wUp/Math.max(wMid,1),        /* 상정 폭 */
    gung
  };
}

/* ── 3. 오행형상을 가린다 ──────────────────────────
   다섯 갈래에 각각 점수를 매겨 가장 높은 쪽으로 봅니다.
   얼굴마다 조금씩이라도 기운 데가 있으므로 한쪽으로 몰리지 않습니다. */
function pickHyeong(m){
  const r = m.ratio, t = m.taper, sd = m.sd;
  const sc = {
    "목": (0.720 - r) / 0.12,     /* 길고 곧은 상 */
    "수": (r - 0.720) / 0.12,     /* 둥글고 도톰한 상 */
    "화": (0.745 - t) / 0.13,     /* 아래로 뾰족이 모이는 상 */
    "토": (t - 0.745) / 0.13,     /* 두텁고 네모진 상 */
    "금": (sd - 46) / 26          /* 뼈대가 또렷한 상 */
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
  const chae  = (mx - mn) / Math.max(mx,1);
  const geuneul = (Math.max.apply(null,m.sam) - Math.min.apply(null,m.sam)) / Math.max(L,1);
  if (chae < 0.12)      return geuneul > 0.42 ? "흑" : "백";
  if (geuneul > 0.48)   return "흑";
  if (B >= G - 4)       return "청";
  const ddeum = (R - G) / Math.max(R - B, 1);   /* 붉은 쪽인가 누런 쪽인가 */
  if (ddeum > 0.60)     return "적";
  if (ddeum < 0.52)     return "황";
  return (chae > 0.28) ? "적" : "황";
}

/* ── 5. 삼정을 가린다 ─────────────────────────────── */
function pickSamjeong(m){
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
  const mu = v.reduce((a,b)=>a+b,0)/v.length;
  const sd = Math.sqrt(v.reduce((a,b)=>a+(b-mu)*(b-mu),0)/v.length) || 1;
  const out = {};
  ks.forEach((k,i)=>{
    const z = (v[i]-mu)/sd;
    out[k] = z > 0.62 ? 0 : (z < -0.62 ? 2 : 1);
  });
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

  /* 좌우 기울기 — 일월각 */
  const tilt = (m.left - m.right) / Math.max(m.meanL,1);
  const gyeol = Math.abs(tilt) < 0.035 ? null
              : (tilt > 0 ? "왼쪽" : "오른쪽");

  /* 열두 자리 — 그 얼굴 안에서 서로 견주어 가립니다.
     무서워하는 얼굴로 보여준 셋은 실제로 서지 않습니다. 말이 어긋나니까요. */
  const 보류 = PICK3.map(x=>x.i);
  const lvAll = gradeAll(m);
  const jari = GUNG.map((G, i) => {
    const lv = lvAll[G.k];
    const pool = G.pool.filter(x=>보류.indexOf(x)<0);
    const bg = pickFrom(pool.length?pool:G.pool, seed, i*31 + lv);
    return { g:G, lv, bg };
  });

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

  return { seed, hyeong, gisaek, samjeong, gyo, yun, gyeol,
           jari, boss, hitAge, hitYun, blocked, opened, m };
}

/* ── 10. 처방 ─────────────────────────────────────── */
function prescribe(R){
  const oh = OH[R.hyeong];
  const gi = GISAEK[R.gisaek];

  /* 점자리 — 올해를 쥔 궁에서 */
  const jeom = (JEOM[R.boss.g.k] || JEOM["명"]).slice();

  /* 색 — 그릇의 길색 둘, 그리고 지금 기운이 누르는 색 하나 */
  const gil = oh.ggil.slice();
  let hyung = oh.ghyung.slice();
  hyung[2] = hyung[2] + "에는 올해 쓰지 마세요";
  /* 기색이 그릇을 누르고 있으면 꺼릴 색을 기색 쪽으로 바꿉니다 */
  if (R.gyo.dan === "극(剋)"){
    const saekColor = {
      "청":["쪽빛","#2a4a6b"], "적":["다홍","#b9372c"], "황":["치자","#c8a02e"],
      "백":["백자","#ddd6c7"], "흑":["먹빛","#1d1a1a"] }[R.gisaek];
    hyung = [saekColor[0], saekColor[1], "올해는 몸에 지니지 마세요"];
  }

  /* 머리 — 그릇에 삼정을 더해 */
  const mori = oh.mori.slice();
  if (R.samjeong === "하" && R.hyeong !== "토")
    mori[1] += " 턱을 덮지 마시고요. 손님은 뒤로 갈수록 좋아지는 얼굴입니다.";
  if (R.samjeong === "상")
    mori[1] += " 이마는 끝까지 드러내세요. 초년에 받은 것이 거기 있습니다.";

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
  const avoidPool = block.concat(mid).filter(j=>!todo.some(x=>x.k===j.g.k));
  const avoidSrc = (avoidPool.length>=2 ? avoidPool
                    : avoidPool.concat(block, mid)).slice(0,2);
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

/* ── 12. 얼굴 자리를 스스로 찾습니다 ─────────────
   살빛이 도는 자리를 모아 가장 큰 덩어리의 테두리를 잡습니다.
   찾으면 거울 안에서 얼굴이 길잡이 타원에 맞게 저절로 놓입니다. */
function findFace(srcEl, natW, natH){
  const W = 180, H = Math.max(1, Math.round(W*natH/natW));
  if (!natW || !natH) return null;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d", { willReadFrequently:true });
  try { g.drawImage(srcEl, 0, 0, W, H); } catch(e){ return null; }
  let px;
  try { px = g.getImageData(0,0,W,H).data; } catch(e){ return null; }

  /* 조명색을 먼저 고릅니다. 푸른 전등이나 노란 전등 아래서도 살빛이 잡히게. */
  let aR=0,aG=0,aB=0;
  for(let p=0;p<px.length;p+=4){ aR+=px[p]; aG+=px[p+1]; aB+=px[p+2]; }
  const tot=px.length/4; aR/=tot; aG/=tot; aB/=tot;
  const avg=(aR+aG+aB)/3;
  const nd=(v)=>Math.max(.88,Math.min(1.14,1+(avg/Math.max(v,1)-1)*0.55));
  const wR=nd(aR), wG=nd(aG), wB=nd(aB);

  /* 살빛 판정 — 밝기에 덜 끌리도록 색의 치우침으로 봅니다 */
  const mask = new Uint8Array(W*H);
  let cnt = 0;
  for(let i=0,p=0; i<W*H; i++, p+=4){
    const r=Math.min(255,px[p]*wR), gg=Math.min(255,px[p+1]*wG), b=Math.min(255,px[p+2]*wB);
    const mx=Math.max(r,gg,b), mn=Math.min(r,gg,b);
    const ok = r>52 && gg>30 && b>14 && (mx-mn)>11 &&
               r>=gg && gg>=b-16 && (r-gg)>5 && (r-b)>10 && mx<253;
    if(ok){ mask[i]=1; cnt++; }
  }
  if(cnt < W*H*0.02) return null;

  /* 가장 큰 덩어리 */
  const lab = new Int32Array(W*H).fill(-1);
  const stack = new Int32Array(W*H);
  let best=-1, bestN=0, cur=0;
  for(let i=0;i<W*H;i++){
    if(!mask[i] || lab[i]>=0) continue;
    let sp=0, n=0; stack[sp++]=i; lab[i]=cur;
    while(sp){
      const q=stack[--sp]; n++;
      const x=q%W, y=(q/W)|0;
      for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){
        const nx=x+dx, ny=y+dy;
        if(nx<0||ny<0||nx>=W||ny>=H) continue;
        const k=ny*W+nx;
        if(mask[k] && lab[k]<0){ lab[k]=cur; stack[sp++]=k; }
      }
    }
    if(n>bestN){ bestN=n; best=cur; }
    cur++;
  }
  if(best<0 || bestN < W*H*0.02) return null;

  /* 가로줄마다 폭을 재서 가장자리 잡티를 걷어냅니다 */
  let x0=W, x1=-1, y0=H, y1=-1;
  const rowW = new Int32Array(H);
  for(let y=0;y<H;y++){
    let a=-1,b2=-1;
    for(let x=0;x<W;x++) if(lab[y*W+x]===best){ if(a<0)a=x; b2=x; }
    if(a>=0){ rowW[y]=b2-a+1; if(y<y0)y0=y; y1=y; if(a<x0)x0=a; if(b2>x1)x1=b2; }
  }
  const widths = Array.from(rowW).filter(v=>v>0).sort((p,q)=>p-q);
  if(!widths.length) return null;
  const medW = widths[(widths.length/2)|0];
  /* 목이나 어깨처럼 아래로 넓게 퍼진 부분은 얼굴에서 뺍니다 */
  let yEnd = y1;
  for(let y=y0+Math.round((y1-y0)*0.55); y<=y1; y++){
    if(rowW[y] > medW*1.32){ yEnd = y-1; break; }
  }
  if(yEnd - y0 < (y1-y0)*0.45) yEnd = y1;

  let lx=W, rx=-1;
  for(let y=y0;y<=yEnd;y++)
    for(let x=0;x<W;x++) if(lab[y*W+x]===best){ if(x<lx)lx=x; if(x>rx)rx=x; }
  if(rx<=lx) return null;

  /* 머리카락과 이마 윗부분을 조금 얹어 얼굴 틀에 맞춥니다 */
  const fh0 = yEnd - y0 + 1;
  const top = Math.max(0, y0 - fh0*0.16);
  const bot = Math.min(H-1, yEnd + fh0*0.04);

  return {
    cx: ((lx+rx)/2) / W,
    cy: ((top+bot)/2) / H,
    w:  (rx-lx+1) / W,
    h:  (bot-top+1) / H
  };
}

/* 찾은 얼굴을 길잡이 타원에 맞춰 크기와 자리를 셈합니다 */
function fitFace(face, natW, natH, holeW, holeH){
  if(!face) return null;
  const cover = Math.max(holeW/natW, holeH/natH);
  const tw = holeW * (FACE.w/100) * 0.98;
  const th = holeH * (FACE.h/100) * 0.98;
  const sW = tw / (natW * cover * face.w);
  const sH = th / (natH * cover * face.h);
  let scale = Math.min(sW, sH);
  scale = Math.max(1, Math.min(2.6, scale));
  const dispW = natW*cover*scale, dispH = natH*cover*scale;
  const x = -((face.cx - 0.5) * dispW) / holeW * 100;
  const y = -((face.cy - 0.5) * dispH) / holeH * 100;
  return { scale, x, y };
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
