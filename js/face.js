/* 백귀관상 — 얼굴 실측(實測)
   얼굴에 점 468개를 찍고, 관상이 보는 자리를 실제로 잽니다.

   예전에는 얼굴 위에 타원 하나를 올려놓고 그 안의 밝기만 보았습니다.
   그러면 누가 찍어도 비슷한 수가 나옵니다. 이마가 넓은지 좁은지,
   눈꼬리가 올랐는지 내렸는지, 턱이 각졌는지 둥근지를 보지 않으니까요.

   여기서는 점 468개를 찍어 다음을 직접 잽니다.
     삼정(三停)   발제—인당—준두—지각의 세 마디
     오악(五岳)   이마·좌우 광대·코·턱의 솟음
     이마         높이와 넓이, 양 끝의 기울기
     눈썹         길이·두께·꺾임·눈과의 사이
     눈           길이·높이·눈머리와 눈꼬리의 높낮이·두 눈 사이
     코           산근의 좁음, 콧대 길이, 준두 크기, 난대정위(콧방울)
     인중         길이와 또렷함
     입           너비·입술 두께·입꼬리 방향
     턱           넓이·길이·각짐·지각의 두터움
     좌우         짝이 있는 자리의 어긋남

   모든 길이는 얼굴 너비로 나눠 둡니다. 사진이 크든 작든 같은 수가 나옵니다. */

/* ── 점 번호 ────────────────────────────────────────
   얼굴 점 468개 중 관상이 보는 자리만 추립니다.
   왼쪽/오른쪽은 사진에서 본 쪽입니다. 거울을 마주한 사람의 몸으로는 반대입니다. */
const P = {
  /* 한가운데 세로줄 */
  이마꼭지: 10, 이마중간: 151, 인당: 9, 산근: 168, 콧대중간: 197,
  준두: 1, 인중위: 2, 윗입술: 0, 입중앙: 13, 아랫입술안: 14,
  아랫입술: 17, 승장: 18, 턱끝: 152,

  /* 얼굴 가장자리 — 위에서 아래로 */
  관자왼: 54, 관자오른: 284,
  귀앞왼: 234, 귀앞오른: 454,
  광대왼: 116, 광대오른: 345,
  볼왼: 192, 볼오른: 416,
  턱선왼: 172, 턱선오른: 397,
  아래턱왼: 149, 아래턱오른: 378,

  /* 이마 */
  이마왼: 103, 이마오른: 332,
  발제왼: 67, 발제오른: 297,
  이마끝왼: 21, 이마끝오른: 251,

  /* 눈썹 */
  미두왼: 107, 미중왼: 105, 미미왼: 70,
  미두오른: 336, 미중오른: 334, 미미오른: 300,
  미상왼: 52, 미상오른: 282,
  미하왼: 55, 미하오른: 285,

  /* 눈 */
  눈머리왼: 133, 눈꼬리왼: 33, 눈위왼: 159, 눈아래왼: 145,
  눈머리오른: 362, 눈꼬리오른: 263, 눈위오른: 386, 눈아래오른: 374,
  와잠왼: 23, 와잠오른: 253,
  눈두덩왼: 29, 눈두덩오른: 259,
  산근왼: 193, 산근오른: 417,

  /* 코 */
  콧방울왼: 98, 콧방울오른: 327,
  난대: 115, 정위: 344,
  콧볼왼: 48, 콧볼오른: 278,

  /* 입 */
  입꼬리왼: 61, 입꼬리오른: 291,
  윗입술왼: 37, 윗입술오른: 267,
  아랫입술왼: 84, 아랫입술오른: 314
};

/* ── 점 읽기 ──────────────────────────────────────── */
let _mesh = null, _meshBusy = null;

function meshBase(){
  if (typeof window !== "undefined" && window.__MESH_BASE__) return window.__MESH_BASE__;
  return "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/";
}

function loadScript(src){
  return new Promise((ok, no)=>{
    const s = document.createElement("script");
    s.src = src; s.crossOrigin = "anonymous";
    s.onload = ()=>ok(true);
    s.onerror = ()=>no(new Error("못 받음: "+src));
    document.head.appendChild(s);
  });
}

/* 얼굴 점을 찍는 기계를 한 번만 깨웁니다. */
async function wakeMesh(){
  if (_mesh) return _mesh;
  if (_meshBusy) return _meshBusy;
  _meshBusy = (async ()=>{
    const base = meshBase();
    if (typeof FaceMesh === "undefined") await loadScript(base + "face_mesh.js");
    const fm = new FaceMesh({ locateFile: (f)=> base + f });
    fm.setOptions({
      /* 사진 한 장을 한 장으로만 봅니다.
         이 자리를 비워 두면 기계가 앞서 본 얼굴을 기억해 다음 얼굴을 쫓습니다.
         그러면 같은 사진을 두 번 비춰도 수가 달라져, 손님이 바로 알아챕니다. */
      maxNumFaces: 1,
      refineLandmarks: true,     /* 눈동자와 입술을 한 번 더 다듬습니다 */
      minDetectionConfidence: 0.4,
      minTrackingConfidence: 0.4
    });
    await fm.initialize();
    /* 한 번 헛돌려 깨워 둡니다. 첫 장만 수가 다르게 나오던 것을 막습니다. */
    try {
      const warm = document.createElement("canvas");
      warm.width = 64; warm.height = 64;
      const wg = warm.getContext("2d");
      wg.fillStyle = "#808080"; wg.fillRect(0,0,64,64);
      await new Promise(ok=>{ let done=false;
        const t=setTimeout(()=>{ if(!done){done=true;ok();} }, 4000);
        fm.onResults(()=>{ if(!done){done=true;clearTimeout(t);ok();} });
        fm.send({ image: warm }).catch(()=>{ if(!done){done=true;clearTimeout(t);ok();} });
      });
    } catch(e){}
    _mesh = fm;
    return fm;
  })();
  return _meshBusy;
}

/* 그림 한 장에서 점 468개를 받습니다.
   이 기계는 본디 움직이는 영상을 쫓도록 만들어져, 앞서 본 얼굴을 기억합니다.
   그래서 같은 사진을 두 번 비춰도 점이 조금씩 흔들립니다.
   세 번 재어 가운데값을 쓰면 흔들림이 잦아듭니다. */
async function findLandmarksStable(srcEl, n){
  const runs = [];
  const N = (n||3) + 1;
  for (let i = 0; i < N; i++){
    const p = await findLandmarks(srcEl);
    /* 첫 장은 버립니다. 기계가 얼굴을 처음 찾을 때와 이미 쥐고 있을 때의
       수가 달라서, 첫 장을 섞으면 볼 때마다 다른 수가 나옵니다. */
    if (p && (i > 0 || N === 1)) runs.push(p);
  }
  if (!runs.length) return null;
  if (runs.length === 1) return runs[0];
  const mid = Math.floor(runs.length/2);
  const pick = (arr)=>{ const a = arr.slice().sort((x,y)=>x-y); return a[mid]; };
  return runs[0].map((_, i)=>({
    x: pick(runs.map(r=>r[i].x)),
    y: pick(runs.map(r=>r[i].y)),
    z: pick(runs.map(r=>r[i].z || 0))
  }));
}

/* 그림 한 장에서 점 468개를 받습니다. */
async function findLandmarks(srcEl){
  const fm = await wakeMesh();
  return await new Promise((done)=>{
    let settled = false;
    const t = setTimeout(()=>{ if(!settled){ settled=true; done(null); } }, 12000);
    fm.onResults((res)=>{
      if (settled) return;
      settled = true; clearTimeout(t);
      const ls = res.multiFaceLandmarks;
      done(ls && ls.length ? ls[0] : null);
    });
    fm.send({ image: srcEl }).catch(()=>{ if(!settled){ settled=true; clearTimeout(t); done(null); } });
  });
}

/* ── 자 ────────────────────────────────────────────
   점은 0~1 사이로 옵니다. 그림의 가로세로가 다르니 실제 길이로 돌려놓습니다. */
function mk(pts, W, H){
  const g = (i)=>({ x: pts[i].x*W, y: pts[i].y*H, z: (pts[i].z||0)*W });
  return g;
}
const dist = (a,b)=> Math.hypot(a.x-b.x, a.y-b.y);
const midp = (a,b)=>({ x:(a.x+b.x)/2, y:(a.y+b.y)/2, z:((a.z||0)+(b.z||0))/2 });
/* 수평에서 몇 도 기울었는가 — 위로 오르면 양수 */
const ang = (a,b)=> Math.atan2(a.y-b.y, Math.abs(b.x-a.x)) * 180/Math.PI;

/* ── 재기 ──────────────────────────────────────────
   돌려주는 수는 모두 얼굴 너비(FW)로 나눈 값입니다. */
function measure(pts, W, H){
  const g = mk(pts, W, H);
  const p = {}; for (const k in P) p[k] = g(P[k]);

  /* 얼굴 너비 — 광대 바깥, 얼굴에서 가장 넓은 자리 */
  const FW = dist(p.귀앞왼, p.귀앞오른);
  if (!(FW > 4)) return null;
  const n = (v)=> v / FW;

  /* 얼굴을 바로 세웁니다 — 고개가 기울어도 같은 수가 나오게 */
  const eyeL = midp(p.눈머리왼, p.눈꼬리왼), eyeR = midp(p.눈머리오른, p.눈꼬리오른);
  const roll = Math.atan2(eyeR.y - eyeL.y, eyeR.x - eyeL.x);
  const cs = Math.cos(-roll), sn = Math.sin(-roll);
  const o = midp(eyeL, eyeR);
  const rot = (q)=>({ x:(q.x-o.x)*cs - (q.y-o.y)*sn, y:(q.x-o.x)*sn + (q.y-o.y)*cs, z:q.z });
  /* 돌려놓은 자리를 그림 자리로 되돌립니다 — 빛을 잴 때 씁니다 */
  const unrot = (q)=>({ x: q.x*cs + q.y*sn + o.x, y: -q.x*sn + q.y*cs + o.y });
  const r = {}; for (const k in p) r[k] = rot(p[k]);
  const rawAll = pts.map(q=>({ x:q.x*W, y:q.y*H }));

  /* 고개를 돌린 정도 — 코끝이 양 귀 가운데에서 얼마나 비켜 있는가 */
  const earMid = (r.귀앞왼.x + r.귀앞오른.x)/2;
  const yaw = (r.준두.x - earMid) / FW;
  /* 고개를 든 정도 — 콧구멍이 보이는 만큼 */
  const pitch = (r.준두.y - midp(r.콧방울왼, r.콧방울오른).y) / FW;

  /* ── 삼정 ──
     발제는 점으로 잡히지 않습니다. 이마꼭지 위로 이마 높이의 몫만큼 올려
     발제 자리를 어림합니다. 옛 자와 어긋나지 않는 몫입니다. */
  const 인당y = r.인당.y, 준두y = r.준두.y, 턱끝y = r.턱끝.y;
  const 이마꼭y = r.이마꼭지.y;
  const 발제y = 이마꼭y - (인당y - 이마꼭y) * 0.92;
  const 상정 = 인당y - 발제y, 중정 = 준두y - 인당y, 하정 = 턱끝y - 준두y;
  const 전장 = 턱끝y - 발제y;
  const sam = [상정/전장, 중정/전장, 하정/전장];

  /* ── 윤곽 ── */
  const 얼굴높이 = 전장;
  const 상폭 = dist(r.관자왼, r.관자오른);        /* 관자놀이 — 이마 너비 */
  const 중폭 = dist(r.광대왼, r.광대오른);        /* 광대 너비 */
  const 하폭 = dist(r.아래턱왼, r.아래턱오른);    /* 턱 너비 */
  const 턱선폭 = dist(r.턱선왼, r.턱선오른);

  /* ── 이마 ── */
  const 이마높이 = 인당y - 발제y;
  const 이마폭 = dist(r.이마왼, r.이마오른);
  /* 이마 양 끝이 깎였는가 — 발제 모서리가 가운데보다 얼마나 내려와 있는가 */
  const 이마모서리 = ((r.이마끝왼.y + r.이마끝오른.y)/2 - 이마꼭y) / FW;

  /* ── 눈썹 ── */
  const 미길왼 = dist(r.미두왼, r.미미왼), 미길오 = dist(r.미두오른, r.미미오른);
  const 미길 = (미길왼 + 미길오)/2;
  /* 눈썹 꺾임 — 눈썹 가운데가 두 끝을 이은 줄보다 얼마나 솟았는가 */
  const 꺾왼 = ((r.미두왼.y + r.미미왼.y)/2 - r.미중왼.y) / FW;
  const 꺾오 = ((r.미두오른.y + r.미미오른.y)/2 - r.미중오른.y) / FW;
  const 미꺾 = (꺾왼 + 꺾오)/2;
  /* 눈썹과 눈 사이 — 전택궁의 넓이 */
  const 미안왼 = (r.눈위왼.y - r.미상왼.y)/FW, 미안오 = (r.눈위오른.y - r.미상오른.y)/FW;
  const 미안 = (미안왼 + 미안오)/2;
  /* 눈썹 기울기 — 미미가 미두보다 높으면 오른 눈썹 */
  const 미각 = (ang(r.미미왼, r.미두왼) + ang(r.미미오른, r.미두오른))/2;
  /* 두 눈썹 사이 — 인당의 너비 */
  const 미간 = dist(r.미하왼, r.미하오른);

  /* ── 눈 ── */
  const 눈길왼 = dist(r.눈머리왼, r.눈꼬리왼), 눈길오 = dist(r.눈머리오른, r.눈꼬리오른);
  const 눈길 = (눈길왼 + 눈길오)/2;
  const 눈높왼 = Math.abs(r.눈위왼.y - r.눈아래왼.y), 눈높오 = Math.abs(r.눈위오른.y - r.눈아래오른.y);
  const 눈높 = (눈높왼 + 눈높오)/2;
  /* 눈꼬리 — 눈머리보다 높으면 오른 눈.
     여기 한쪽에만 -1 이 붙어 있어, 두 눈이 똑같이 올라간 얼굴이
     왼쪽 +θ 오른쪽 -θ 로 서로 지워졌습니다. 재던 것은 올라감이 아니라
     좌우 어긋남이었습니다. 두 눈 다 같은 부호로 세웁니다. */
  const 눈각왼 = ang(r.눈꼬리왼, r.눈머리왼) * -1;
  const 눈각오 = ang(r.눈꼬리오른, r.눈머리오른) * -1;
  const 눈각 = (눈각왼 + 눈각오)/2;
  /* 두 눈 사이 — 산근의 너비. 눈 하나 길이와 견줍니다. */
  const 눈사이 = dist(r.눈머리왼, r.눈머리오른);
  /* 와잠 — 눈 아래 도톰한 자리 */
  const 와잠 = ((r.와잠왼.y - r.눈아래왼.y) + (r.와잠오른.y - r.눈아래오른.y)) / 2 / FW;

  /* ── 코 ── */
  const 콧대길 = 준두y - r.산근.y;
  const 산근폭 = dist(r.산근왼, r.산근오른);
  const 코폭 = dist(r.콧방울왼, r.콧방울오른);
  const 콧볼폭 = dist(r.콧볼왼, r.콧볼오른);
  /* 준두 크기 — 코끝이 둥근가 뾰족한가.
     전에는 |준두.y - 콧방울중점.y| 였는데, 그건 바로 위 pitch 와
     부호만 빼고 똑같은 식입니다. 고개를 숙이면 "코끝이 둥글다",
     들면 "뾰족하다"가 나오고 있었습니다. 코는 보지도 않고요.
     코끝 살의 너비를 코 전체 너비로 견주어 봅니다 —
     난대·정위(콧방울 윗점) 사이가 넓을수록 코끝이 둥글게 퍼진 것입니다. */
  const 준두 = dist(r.난대, r.정위) / Math.max(1, dist(r.콧방울왼, r.콧방울오른));
  /* 콧대가 곧은가 — 산근·중간·준두 셋이 한 줄에 서는가 */
  const 콧대휨 = Math.abs(r.콧대중간.x - (r.산근.x + r.준두.x)/2) / FW;

  /* ── 인중 ── */
  const 인중길 = r.윗입술.y - r.인중위.y;

  /* ── 입 ── */
  const 입폭 = dist(r.입꼬리왼, r.입꼬리오른);
  const 윗술 = Math.abs(r.입중앙.y - r.윗입술.y);
  const 아술 = Math.abs(r.아랫입술.y - r.아랫입술안.y);
  const 입술 = 윗술 + 아술;
  /* 입꼬리 — 가운데보다 높으면 오른 입 */
  const 입각 = (( r.입중앙.y - r.입꼬리왼.y ) + ( r.입중앙.y - r.입꼬리오른.y )) / 2 / FW;

  /* ── 턱 ── */
  const 턱길 = 턱끝y - r.아랫입술.y;
  /* 턱이 각진 정도 — 턱선에서 턱끝까지 꺾이는 각 */
  const 턱각왼 = ang(r.턱끝, r.아래턱왼), 턱각오 = ang(r.턱끝, r.아래턱오른);
  const 턱각 = (Math.abs(턱각왼) + Math.abs(턱각오))/2;
  /* 지각(地閣)이 두터운가 — 아래턱 너비를 턱선 너비로 */
  const 지각 = 하폭 / Math.max(턱선폭, 1);

  /* ── 광대 ── */
  /* 광대가 솟았는가 — 광대 너비를 관자·턱 너비의 가운데와 견줍니다 */
  const 광대 = 중폭 / Math.max((상폭 + 하폭)/2, 1);

  /* ── 좌우 ──
     짝이 있는 자리들이 얼마나 어긋났는가. 하나하나는 작아도 쌓이면 보입니다. */
  const sym = [
    Math.abs(눈길왼 - 눈길오)/Math.max(눈길,1),
    Math.abs(눈높왼 - 눈높오)/Math.max(눈높,1),
    Math.abs(미길왼 - 미길오)/Math.max(미길,1),
    Math.abs(미안왼 - 미안오)/Math.max(미안,0.01),
    Math.abs(r.미상왼.y - r.미상오른.y)/FW*6,
    Math.abs(r.입꼬리왼.y - r.입꼬리오른.y)/FW*6
  ];
  const 어긋남 = sym.reduce((a,b)=>a+b,0)/sym.length;

  /* 얼굴 한가운데 줄에서 코와 입이 얼마나 비켜 섰는가.
     가운데 줄은 이마·인당·턱끝을 이은 줄로 잡습니다. */
  const 축 = (r.이마중간.x + r.인당.x + r.턱끝.x) / 3;
  /* 점 둘로 재면 사람 사이 벌어짐이 얼굴 너비의 0.001 — 300픽셀 얼굴에서
     0.3픽셀입니다. 점이 떠는 폭보다 작으니 그 자리 글은 동전 던지기였습니다.
     비켜선 정도를 네 군데에서 재어 평균합니다. */
  const 쏠림 = (Math.abs(r.준두.x-축) + Math.abs(r.입중앙.x-축)
              + Math.abs(r.산근.x-축) + Math.abs(r.인중위.x-축)) / 4 / FW;

  /* ── 자세를 되돌립니다 ──────────────────────────
     관상의 자는 정면을 두고 잰 자입니다. 고개를 들면 이마가 줄고 턱이 늘며,
     고개를 돌리면 이목구비가 한쪽으로 쏠린 것처럼 보입니다.
     얼굴 열둘을 자세를 바꿔 가며 재어 그 기울기를 뽑았습니다.
     막지 않고 되돌려 읽습니다. 손님을 돌려보내는 것보다 낫습니다. */
  const 바름 = -0.025;                 /* 정면으로 섰을 때의 들린 정도 */
  const dp = pitch - 바름;
  const ay = Math.abs(yaw), ar = Math.abs(roll*180/Math.PI);
  const cl = (v,a,b)=> Math.max(a, Math.min(b, v));

  let 상 = sam[0] - 0.72*dp;
  let 하 = sam[2] + 2.28*dp;
  상 = cl(상, 0.18, 0.46); 하 = cl(하, 0.22, 0.52);
  let 중 = 1 - 상 - 하;
  if (중 < 0.16){ 중 = 0.16; const t = 상+하; 상 = 상/t*0.84; 하 = 하/t*0.84; }
  const sam2 = [상, 중, 하];

  /* 바닥값 0.002 가 사람 평균(0.0020)과 똑같았습니다. 그래서 쏠림 z 는
     0 아래로 내려가지 못했고, "이목구비가 한가운데로 모였습니다"(오악조귀)는
     어떤 얼굴에서도 설 수 없었습니다. 바닥을 아예 치웁니다 —
     고개 돌린 몫을 뺀 뒤의 음수는 "돌린 것치고도 안 쏠렸다"는 뜻이라
     그대로 두어야 양쪽으로 다 읽힙니다. */
  const 쏠림2  = 쏠림 - 0.272*ay;
  const 어긋남2 = Math.max(0.018, 어긋남 - 0.42*ay - 0.0045*ar);
  const ratio2 = cl(FW/Math.max(얼굴높이,1) + 1.29*dp + 0.15*ay, 0.55, 1.05);

  /* 자세가 많이 비뚤면 그만큼 믿을 수 없습니다.
     믿을 수 없는 만큼 그 자리의 문턱을 올려 억지 단서가 서지 않게 합니다. */
  const 흔들림 = Math.min(1, ay/0.42 + Math.abs(dp)/0.12*0.7 + ar/26*0.5);

  return {
    ok: true, FW, W, H, yaw, pitch, roll: roll*180/Math.PI, 흔들림,
    pts: r, raw: p, rawAll, unrot,

    /* 틀 */
    sam: sam2, sam0: sam, 전장: n(전장), 세로: 얼굴높이/FW,
    ratio: ratio2,                                 /* 넓이 ÷ 길이 — 클수록 넓은 얼굴 */
    taper: 하폭 / Math.max(중폭,1),                /* 아래가 좁아지는 정도 */
    boxy: 턱선폭 / Math.max(중폭,1),               /* 네모진 정도 */
    상폭: n(상폭), 중폭: n(중폭), 하폭: n(하폭),
    /* 위가 좁고 아래가 넓은가, 그 반대인가 — 한 수로 잡습니다.
       상폭·하폭을 따로 쓰면 가늠자(NORM)에 없어 z 가 늘 0 이었고,
       그 둘로 가리던 단서 둘은 어떤 얼굴에서도 서지 못했습니다. */
    위아래폭: 상폭 / Math.max(하폭, 1),

    /* 자리마다 */
    이마높: 이마높이/Math.max(전장,1), 이마폭: n(이마폭), 이마모서리,
    미길: n(미길), 미꺾, 미안, 미각, 미간: n(미간),
    눈길: n(눈길), 눈높: 눈높/Math.max(눈길,1), 눈각, 눈사이: 눈사이/Math.max(눈길,1), 와잠,
    콧대길: 콧대길/Math.max(전장,1), 산근폭: n(산근폭), 코폭: n(코폭),
    콧볼폭: n(콧볼폭), 준두, 콧대휨,
    인중길: 인중길/Math.max(전장,1),
    입폭: n(입폭), 입술: 입술/Math.max(입폭,1), 윗술: 윗술/Math.max(입술,1), 입각,
    턱길: 턱길/Math.max(전장,1), 턱각, 지각,
    광대, 어긋남: 어긋남2, 쏠림: 쏠림2,

    /* 세 마디의 폭 — 예전 엔진이 쓰던 자리 */
    bandW: [상폭, 중폭, 하폭]
  };
}

/* ── 열두 자리의 자리값 ────────────────────────────
   십이궁을 타원 위의 백분율이 아니라 실제 점에서 끌어냅니다.
   기색을 잴 때 이 자리의 살빛을 봅니다. */
function gungSpots(F, sex){
  const r = F.pts, FW = F.FW;

  /* 좌우 짝인 자리를 두 점의 가운데(mid)로 잡으면, 그 가운데는 반드시
     얼굴 한가운데 줄입니다. 그러면 눈썹을 본다면서 미간을 보고,
     눈꼬리를 본다면서 산근을 보게 됩니다. 실제로 형제·전택·처첩·남녀·부모
     다섯 자리가 콧대 한 뼘의 같은 살을 읽고 있었습니다.
     자리마다 제 부위에서 잽니다. */

  /* 남좌여우(男左女右) — 남자는 몸의 왼쪽, 여자는 오른쪽을 본인 자리로 봅니다.
     사진에 보이는 그대로의 왼쪽·오른쪽입니다. */
  const 내 = (sex === "여") ? "오른" : "왼";
  const P_ = (이름, 쪽)=> r[이름 + 쪽];
  const 안으로 = (q, d)=> ({ x: q.x + (r.인당.x - q.x) * d, y: q.y });
  const 위로   = (q, d)=> ({ x: q.x, y: q.y - FW * d });
  const 아래로 = (q, d)=> ({ x: q.x, y: q.y + FW * d });
  const 밖으로 = (q, d)=> ({ x: q.x + (q.x - r.인당.x) * d, y: q.y });

  return {
    /* 한가운데 줄에 있는 자리 셋 — 여기는 가운데가 맞습니다 */
    명:    r.인당,
    관록:  r.이마중간,
    질액:  r.산근,
    재백:  r.준두,

    /* 천창(天倉) — 관자놀이. 머리카락이 걸리니 안으로 조금 당깁니다. */
    복덕:  안으로(위로(P_("관자", 내), 0.03), 0.40),
    /* 역마(驛馬) — 이마 모서리. 천창보다 위입니다. */
    /* 역마는 천창보다 위입니다. 둘 다 손님 쪽에서 보되 높이로 가릅니다. */
    천이:  { x: P_("이마끝", 내).x + (r.이마중간.x - P_("이마끝", 내).x) * 0.46,
             y: P_("이마끝", 내).y * 0.62 + r.이마중간.y * 0.38 },
    /* 일각·월각(日角月角) — 이마 양 끝. 본인 쪽 하나를 봅니다. */
    부모:  안으로(P_("이마", 내), 0.34),
    /* 눈썹 — 눈썹 가운데 바로 위 살 */
    형제:  위로(P_("미중", 내), 0.072),
    /* 전택(田宅) — 눈두덩. 눈을 덜 물게 조금 올려 봅니다. */
    전택:  위로(P_("눈두덩", 내), 0.018),
    /* 어미(魚尾) — 눈꼬리 바깥. 눈을 안 물게 바깥으로 밀어 둡니다. */
    처첩:  위로(밖으로(P_("눈꼬리", 내), 0.24), 0.028),
    /* 와잠(臥蠶) — 눈 밑 도톰한 자리 */
    남녀:  아래로(P_("와잠", 내), 0.026),
    /* 지고(地庫) — 턱 옆. 가운데로 잡으면 턱끝이 됩니다. */
    노복:  안으로(P_("아래턱", 내), 0.22)
  };
}
