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
const FACE = { x:17, y:9, w:66, h:82 };

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
  const mR = sumR/n, mG = sumG/n, mB = sumB/n;

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

  return {
    meanL, sd, mR, mG, mB,
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
  if (chae < 0.12)      return geuneul > 0.30 ? "흑" : "백";
  if (geuneul > 0.36)   return "흑";
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

  /* 열두 자리 — 그 얼굴 안에서 서로 견주어 가립니다 */
  const lvAll = gradeAll(m);
  const jari = GUNG.map((G, i) => {
    const lv = lvAll[G.k];
    const bg = pickFrom(G.pool, seed, i*31 + lv);
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
    mori[1] += " 턱을 덮지 마시고요. 자네는 뒤로 갈수록 좋아지는 얼굴입니다.";
  if (R.samjeong === "상")
    mori[1] += " 이마는 끝까지 드러내세요. 초년에 받은 것이 거기 있습니다.";

  return { jeom, gil, hyung, mori, oh, gi };
}
