/* 백귀관상 — 살빛과 기색을 재는 자
   얼굴 점 468개가 잡힌 뒤, 그 점들이 가리키는 자리의 빛을 잽니다.

   예전에는 얼굴 위에 타원 하나를 올려놓고 그 안을 통째로 보았습니다.
   그래서 눈썹이든 머리카락이든 뒷배경이든 한데 섞였습니다.
   여기서는 점이 가리킨 자리만 봅니다. 인당은 인당 자리에서,
   준두는 준두 자리에서 빛을 잽니다. */

/* 그림의 지문 — 같은 사진인지 가리는 데 씁니다.
   얼굴 읽는 기계는 본디 영상을 쫓도록 만들어져 같은 사진도 조금씩 다르게 읽습니다.
   그래서 한 번 잰 사진은 지문으로 적어 두고, 다시 오면 그대로 꺼내 씁니다.
   "같은 얼굴인데 어제와 다른 말을 하네" 소리를 들으면 안 되니까요. */
function fingerprint(cv){
  let d;
  try { d = cv.getContext("2d").getImageData(0,0,cv.width,cv.height).data; }
  catch(e){ return null; }
  let h = 2166136261;
  for (let i = 0; i < d.length; i += 733){
    h ^= d[i]; h = Math.imul(h, 16777619);
  }
  return (h>>>0).toString(36) + "." + cv.width + "x" + cv.height;
}

/* 그림을 화폭에 옮깁니다. 재는 데 쓸 크기로 줄입니다. */
function toCanvas(srcEl, maxW){
  const W0 = srcEl.naturalWidth || srcEl.videoWidth || srcEl.width;
  const H0 = srcEl.naturalHeight || srcEl.videoHeight || srcEl.height;
  if (!W0 || !H0) return null;
  const k = Math.min(1, (maxW||640) / Math.max(W0, H0));
  const W = Math.max(64, Math.round(W0*k)), H = Math.max(64, Math.round(H0*k));
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d", { willReadFrequently:true });
  g.drawImage(srcEl, 0, 0, W, H);
  return c;
}

/* 얼굴 안쪽만 훑도록 테두리를 만듭니다 (점 번호는 얼굴 둘레). */
const OVAL = [10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,
              152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109];

/* 눈·눈썹·입은 살빛이 아닙니다. 기색을 잴 때 빼 둡니다. */
const SKIP = [
  [33,7,163,144,145,153,154,155,133,173,157,158,159,160,161,246],          /* 왼눈 */
  [362,382,381,380,374,373,390,249,263,466,388,387,386,385,384,398],       /* 오른눈 */
  [70,63,105,66,107,55,65,52,53,46],                                       /* 왼눈썹 */
  [300,293,334,296,336,285,295,282,283,276],                               /* 오른눈썹 */
  [61,146,91,181,84,17,314,405,321,375,291,409,270,269,267,0,37,39,40,185] /* 입 */
];

function inPoly(x, y, poly){
  let hit = false;
  for (let i=0, j=poly.length-1; i<poly.length; j=i++){
    const xi=poly[i].x, yi=poly[i].y, xj=poly[j].x, yj=poly[j].y;
    if (((yi>y)!==(yj>y)) && (x < (xj-xi)*(y-yi)/((yj-yi)||1e-9) + xi)) hit = !hit;
  }
  return hit;
}

/* 점 둘레로 작은 상자를 놓고 그 안의 빛을 잽니다. */
function patch(px, W, H, cx, cy, r, kR, kG, kB){
  /* 얼굴 평균(meanL)은 흰 기준으로 보정한 픽셀로 내는데 여기만 날 것을 쓰면,
     누런 전등 아래 사진에서 열두 자리 빛이 한꺼번에 같은 쪽으로 밀립니다.
     같은 자로 재야 견줄 수 있습니다. */
  kR = kR || 1; kG = kG || 1; kB = kB || 1;
  let n=0, sL=0, sL2=0, sR=0, sG=0, sB=0;
  const x0=Math.max(0,Math.round(cx-r)), x1=Math.min(W-1,Math.round(cx+r));
  const y0=Math.max(0,Math.round(cy-r)), y1=Math.min(H-1,Math.round(cy+r));
  for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){
    const dx=x-cx, dy=y-cy; if(dx*dx+dy*dy > r*r) continue;
    const i=(y*W+x)*4;
    const R=Math.min(255,px[i]*kR), G=Math.min(255,px[i+1]*kG), B=Math.min(255,px[i+2]*kB);
    const L = R*0.299 + G*0.587 + B*0.114;
    n++; sL+=L; sL2+=L*L; sR+=R; sG+=G; sB+=B;
  }
  if(!n) return { n:0, L:0, sd:0, R:0, G:0, B:0 };
  const mL = sL/n;
  return { n, L:mL, sd:Math.sqrt(Math.max(0, sL2/n - mL*mL)), R:sR/n, G:sG/n, B:sB/n };
}

/* ── 살빛 재기 ──────────────────────────────────── */
function readSkin(canvas, F, sex){
  const W = canvas.width, H = canvas.height;
  let px;
  try { px = canvas.getContext("2d").getImageData(0,0,W,H).data; }
  catch(e){ return null; }

  const r = F.raw;                      /* 돌려놓지 않은, 그림 그대로의 자리 */
  const poly = OVAL.map(i=>r["_"+i] || null);
  /* 둘레 점은 raw 에 이름이 없으므로 점 목록에서 다시 꺼냅니다 */
  const pts = F.rawAll;
  const face = OVAL.map(i=>({ x: pts[i].x*W/F.W, y: pts[i].y*H/F.H }));
  const skipPolys = SKIP.map(arr => arr.map(i=>({ x: pts[i].x*W/F.W, y: pts[i].y*H/F.H })));

  /* 테두리 상자 */
  let X0=1e9, X1=-1e9, Y0=1e9, Y1=-1e9;
  for (const q of face){ X0=Math.min(X0,q.x); X1=Math.max(X1,q.x); Y0=Math.min(Y0,q.y); Y1=Math.max(Y1,q.y); }
  X0=Math.max(0,Math.floor(X0)); X1=Math.min(W-1,Math.ceil(X1));
  Y0=Math.max(0,Math.floor(Y0)); Y1=Math.min(H-1,Math.ceil(Y1));

  /* 흰 것이 비치면 그것을 흰 기준으로 삼습니다.
     찬 전등·누런 전등을 먼저 걷어내야 살빛이 제대로 보입니다. */
  let wN=0,wR=0,wG=0,wB=0, aN=0,aR=0,aG=0,aB=0;
  for(let y=Y0;y<=Y1;y++) for(let x=X0;x<=X1;x++){
    if(!inPoly(x,y,face)) continue;
    const i=(y*W+x)*4, R=px[i], G=px[i+1], B=px[i+2];
    aN++; aR+=R; aG+=G; aB+=B;
    const mx=Math.max(R,G,B), mn=Math.min(R,G,B);
    if(mx>148 && mx<252 && (mx-mn)/mx < 0.14){ wN++; wR+=R; wG+=G; wB+=B; }
  }
  if(aN < 300) return null;
  aR/=aN; aG/=aN; aB/=aN;
  let kR,kG,kB;
  if(wN > aN*0.004){
    const rm=wR/wN, gm=wG/wN, bm=wB/wN, wl=(rm+gm+bm)/3;
    const lim=v=>Math.max(0.76,Math.min(1.30,v));
    kR=lim(wl/Math.max(rm,1)); kG=lim(wl/Math.max(gm,1)); kB=lim(wl/Math.max(bm,1));
  }else{
    const av=(aR+aG+aB)/3;
    const nd=v=>Math.max(.88,Math.min(1.14,1+(av/Math.max(v,1)-1)*0.55));
    kR=nd(aR); kG=nd(aG); kB=nd(aB);
  }

  /* 얼굴 안을 훑되 눈·눈썹·입은 뺍니다 */
  const yNose = (F.rawAll[1].y*H/F.H);
  const yBrow = (F.rawAll[9].y*H/F.H);
  let n=0,sL=0,sL2=0,sR=0,sG=0,sB=0;
  let ln=0,ls=0,rn=0,rs=0;
  const band=[{n:0,s:0},{n:0,s:0},{n:0,s:0}];
  const midX = (face.reduce((a,q)=>a+q.x,0)/face.length);
  const yTop = Y0, yBot = Y1, hgt = Math.max(1, yBot-yTop);
  for(let y=Y0;y<=Y1;y++) for(let x=X0;x<=X1;x++){
    if(!inPoly(x,y,face)) continue;
    let skip=false;
    for(const sp of skipPolys){ if(inPoly(x,y,sp)){ skip=true; break; } }
    if(skip) continue;
    const i=(y*W+x)*4;
    const R=Math.min(255,px[i]*kR), G=Math.min(255,px[i+1]*kG), B=Math.min(255,px[i+2]*kB);
    const L=R*0.299+G*0.587+B*0.114;
    n++; sL+=L; sL2+=L*L; sR+=R; sG+=G; sB+=B;
    if(x<midX){ ln++; ls+=L; } else { rn++; rs+=L; }
    const t=(y-yTop)/hgt, bi = t<0.34?0:(t<0.67?1:2);
    band[bi].n++; band[bi].s+=L;
  }
  if(n < 200) return null;
  const meanL=sL/n, sd=Math.sqrt(Math.max(0,sL2/n-meanL*meanL));

  /* 열두 자리의 빛 — 점이 가리킨 자리에서 바로 */
  const spots = gungSpots(F, sex);
  const rad = Math.max(3, F.FW * (W/F.W) * 0.055);
  const gung = {};
  for(const k in spots){
    const q = spots[k];
    /* spots 는 돌려놓은 자리이므로 그림 자리로 되돌립니다 */
    const b = F.unrot(q);
    gung[k] = patch(px, W, H, b.x*W/F.W, b.y*H/F.H, rad, kR, kG, kB);
  }

  /* 앞머리·모자·수염·안경이 덮은 자리는 살빛이 아니라 머리카락이나 테를 읽습니다.
     그 자리를 그대로 두면 관록·복덕·부모·노복이 거짓으로 "막힘"이 됩니다.

     견줄 자리를 산근 하나로 삼으면 안경 쓴 얼굴에서 그 기준이 먼저 무너집니다 —
     안경다리와 코받침이 바로 산근에 얹히니까요. 그래서 열두 자리의 밝은 쪽
     여섯째 값(60분위)을 기준으로 씁니다. 한두 자리가 덮여도 기준은 안 흔들립니다. */
  const Ls = [];
  for (const k in gung){ if (gung[k].n) Ls.push(gung[k].L); }
  Ls.sort((a,b)=>a-b);
  const 분위 = (arr, q) => arr.length ? arr[Math.min(arr.length-1, Math.floor(arr.length*q))] : 0;
  const ref = Math.max(분위(Ls, 0.60), meanL * 0.86, 1);
  const covered = {};
  for(const k in gung){
    const g = gung[k];
    /* 이마나 턱이 잘린 사진에서는 점이 화면 밖으로 나가 한 픽셀도 못 셉니다.
       그때 covered 를 false 로 두면 L=0 이 그대로 z 로 들어가 그 자리가
       "막힘"으로 떨어지고, 사진에 없는 살을 두고 그늘졌다고 적게 됩니다.
       못 본 자리는 덮인 자리와 같게 잡습니다. */
    if(!g.n){ covered[k] = true; continue; }
    const r = g.L / ref;
    /* 거칠기는 그 자리 제 기준으로 잽니다. 한 자로 재면 코끝이 늘 걸립니다. */
    const 제결 = (typeof GUNG_SD !== "undefined" && GUNG_SD[k]) || 6;
    /* 밝기도 그 자리 제 기준으로 봅니다. 열두 자리를 한 자로 재면
       눈두덩이나 눈꼬리처럼 본디 그늘진 자리가 늘 "덮였다"가 됩니다.
       그 자리가 보통 얼마나 밝은지(GUNG_BASE)에 견주어 봅니다. */
    const 제밝 = (typeof GUNG_LIT !== "undefined" && GUNG_LIT[k]) ? GUNG_LIT[k] : 1;
    covered[k] = (r < 제밝 * 0.70) || (g.sd > 제결 * 2.4 && r < 제밝 * 0.90);
  }

  return {
    meanL, sd, covered,
    mR:sR/n, mG:sG/n, mB:sB/n,
    sam: band.map(b=> b.n ? b.s/b.n : meanL),
    left: ln?ls/ln:meanL, right: rn?rs/rn:meanL,
    gung, n,
    bandW: F.bandW, ratio: F.ratio, taper: F.taper, boxy: F.boxy,
    F
  };
}
