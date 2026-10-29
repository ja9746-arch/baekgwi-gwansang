/* 백귀관상 — 사주 셈
   얼굴과 맞대어 보기 위한 네 기둥(四柱)과 십성(十星)을 셈합니다.

   취법
     해는 입춘(立春)에 바뀝니다. 설날이 아닙니다.
     달은 절입(節入)으로 가릅니다. 달력의 달이 아닙니다.
     시간은 전국 일괄 30분을 당겨 봅니다(진태양시 보정).
     야자시는 일주를 그날 그대로 두고, 시주만 다음 날 일간으로 셉니다.
*/

const STEM = [
  ["갑","甲","목","양"],["을","乙","목","음"],["병","丙","화","양"],["정","丁","화","음"],
  ["무","戊","토","양"],["기","己","토","음"],["경","庚","금","양"],["신","辛","금","음"],
  ["임","壬","수","양"],["계","癸","수","음"]
];
const BRANCH = [
  ["자","子","수","양","쥐"],   ["축","丑","토","음","소"],   ["인","寅","목","양","범"],
  ["묘","卯","목","음","토끼"], ["진","辰","토","양","용"],   ["사","巳","화","음","뱀"],
  ["오","午","화","양","말"],   ["미","未","토","음","양"],   ["신","申","금","양","원숭이"],
  ["유","酉","금","음","닭"],   ["술","戌","토","양","개"],   ["해","亥","수","음","돼지"]
];
/* 지지 속 본기(本氣) 천간 — 십성을 셀 때 씁니다 */
const JIJANG = [8,5,0,1,4,2,3,5,6,7,4,8];   /* 子壬 丑己 寅甲 卯乙 辰戊 巳丙 午丁 未己 申庚 酉辛 戌戊 亥壬 */

const SMOD = (n,m)=>((n%m)+m)%m;

/* ── 날짜 셈 ─────────────────────────────────── */
function toJdn(y,m,d){
  const a=Math.floor((14-m)/12), yy=y+4800-a, mm=m+12*a-3;
  return d + Math.floor((153*mm+2)/5) + 365*yy + Math.floor(yy/4)
           - Math.floor(yy/100) + Math.floor(yy/400) - 32045;
}
/* 한국 표준시(UTC+9) 기준 날짜·시각 → 율리우스일(세계시) */
function toJd(y,m,d,h,mi){
  return toJdn(y,m,d) - 0.5 + (h - 9 + mi/60)/24;
}
function fromJd(jd){
  const z=Math.floor(jd+0.5), f=jd+0.5-z;
  let a=z;
  if(z>=2299161){ const al=Math.floor((z-1867216.25)/36524.25); a=z+1+al-Math.floor(al/4); }
  const b=a+1524, c=Math.floor((b-122.1)/365.25), dd=Math.floor(365.25*c),
        e=Math.floor((b-dd)/30.6001);
  const day=b-dd-Math.floor(30.6001*e)+f;
  const mo=e<14?e-1:e-13, yr=mo>2?c-4716:c-4715;
  return { y:yr, m:mo, d:Math.floor(day) };
}

/* ── 태양의 겉보기 황경(度) ─────────────────── */
function sunLongitude(jd){
  const T=(jd-2451545.0)/36525;
  const rad=Math.PI/180;
  const L0=280.46646+36000.76983*T+0.0003032*T*T;
  const M =357.52911+35999.05029*T-0.0001537*T*T;
  const C =(1.914602-0.004817*T-0.000014*T*T)*Math.sin(M*rad)
          +(0.019993-0.000101*T)*Math.sin(2*M*rad)
          +0.000289*Math.sin(3*M*rad);
  const O =125.04-1934.136*T;
  return SMOD(L0+C-0.00569-0.00478*Math.sin(O*rad), 360);
}
/* 태양 황경이 목표에 닿는 순간을 이분법으로 찾습니다 */
function solarTermJd(target, nearJd){
  const diff = jd => { let d=SMOD(sunLongitude(jd)-target+180,360)-180; return d; };
  let lo=nearJd-20, hi=nearJd+20;
  if(diff(lo)>0) lo-=20;
  if(diff(hi)<0) hi+=20;
  for(let i=0;i<60;i++){
    const mid=(lo+hi)/2;
    if(diff(mid)<0) lo=mid; else hi=mid;
  }
  return (lo+hi)/2;
}
/* 그 해의 입춘(황경 315도) */
function ipchunJd(year){
  return solarTermJd(315, toJd(year,2,4,12,0));
}

/* ── 네 기둥 ─────────────────────────────────── */
function fourPillars(y, m, d, h, mi, opt){
  const o = opt||{};
  const corr = (o.correctionMin===undefined) ? 30 : o.correctionMin;   /* 분 단위로 당깁니다 */
  const hasTime = o.hasTime !== false;

  /* 보정한 때 */
  const base = new Date(Date.UTC(y, m-1, d, hasTime?h:12, hasTime?mi:0));
  base.setUTCMinutes(base.getUTCMinutes() - (hasTime?corr:0));
  const cy=base.getUTCFullYear(), cm=base.getUTCMonth()+1, cd=base.getUTCDate(),
        ch=base.getUTCHours(), cmi=base.getUTCMinutes();

  const jd = toJd(cy,cm,cd,ch,cmi);
  const lon = sunLongitude(jd);

  /* 년주 — 입춘으로 가릅니다 */
  let sajuYear = cy;
  if(jd < ipchunJd(cy)) sajuYear = cy-1;
  const yStem = SMOD(sajuYear-4,10), yBr = SMOD(sajuYear-4,12);

  /* 월주 — 절입으로 가릅니다 */
  const order = Math.floor(SMOD(lon-315,360)/30);     /* 0 = 인월 */
  const mBr = SMOD(2+order,12);
  const firstStem = SMOD(SMOD(yStem,5)*2+2,10);        /* 오호둔 */
  const mStem = SMOD(firstStem+order,10);

  /* 일주 — 보정한 날의 민간일로 셉니다 (야자시에도 그날 그대로) */
  const dJdn = toJdn(cy,cm,cd);
  const dIdx = SMOD(dJdn+49,60);
  const dStem = dIdx%10, dBr = dIdx%12;

  /* 시주 — 야자시는 다음 날 일간으로 */
  let hStem=null, hBr=null;
  if(hasTime){
    hBr = Math.floor(SMOD(ch+1,24)/2);
    const baseStem = (ch>=23) ? SMOD(dJdn+1+49,60)%10 : dStem;
    hStem = SMOD(SMOD(baseStem,5)*2 + hBr, 10);
  }

  return {
    sajuYear, lon,
    year:  { s:yStem, b:yBr },
    month: { s:mStem, b:mBr },
    day:   { s:dStem, b:dBr },
    hour:  hasTime ? { s:hStem, b:hBr } : null,
    hasTime,
    ilgan: dStem
  };
}

/* ── 십성(十星) ──────────────────────────────── */
const SAENG = { "목":"화","화":"토","토":"금","금":"수","수":"목" };   /* 생 */
const GEUK  = { "목":"토","토":"수","수":"화","화":"금","금":"목" };   /* 극 */

function tenGod(meStem, otherStem){
  const [,,mo,my] = STEM[meStem];
  const [,,oo,oy] = STEM[otherStem];
  const same = (my===oy);
  if(oo===mo)            return same ? "비견" : "겁재";
  if(SAENG[mo]===oo)     return same ? "식신" : "상관";
  if(GEUK[mo]===oo)      return same ? "편재" : "정재";
  if(GEUK[oo]===mo)      return same ? "편관" : "정관";
  if(SAENG[oo]===mo)     return same ? "편인" : "정인";
  return "비견";
}
const GROUP = {
  "비견":"비겁","겁재":"비겁", "식신":"식상","상관":"식상",
  "편재":"재성","정재":"재성", "편관":"관성","정관":"관성",
  "편인":"인성","정인":"인성"
};

/* 여덟 글자에서 무엇이 몇인지 셉니다 */
function tally(P){
  const me = P.ilgan;
  const cells = [];
  [["년",P.year],["월",P.month],["일",P.day]].forEach(([n,p])=>{
    cells.push({ at:n, kind:"천간", stem:p.s });
    cells.push({ at:n, kind:"지지", stem:JIJANG[p.b], br:p.b });
  });
  if(P.hour){
    cells.push({ at:"시", kind:"천간", stem:P.hour.s });
    cells.push({ at:"시", kind:"지지", stem:JIJANG[P.hour.b], br:P.hour.b });
  }
  const cnt = { 비겁:0, 식상:0, 재성:0, 관성:0, 인성:0 };
  const detail = [];
  cells.forEach(c=>{
    if(c.at==="일" && c.kind==="천간") return;            /* 일간은 '나'라 세지 않습니다 */
    const g = tenGod(me, c.stem);
    cnt[GROUP[g]]++;
    detail.push({ ...c, god:g, grp:GROUP[g] });
  });
  return { cnt, detail, total:detail.length };
}

/* 강약 — 없음 0 / 약함 1 / 보통 2 / 강함 3 */
function strength(n, total){
  const r = n / Math.max(total,1);
  if(n===0)      return 0;
  if(r < 0.17)   return 1;
  if(r < 0.34)   return 2;
  return 3;
}
const STRNM = ["없음","약함","보통","강함"];

/* ── 역마와 충 ───────────────────────────────── */
const YEOKMA_BR = [2,8,5,11];                       /* 寅申巳亥 */
const CHUNG = [[0,6],[1,7],[2,8],[3,9],[4,10],[5,11]];
function moveSigns(P){
  const brs = [P.year.b, P.month.b, P.day.b].concat(P.hour?[P.hour.b]:[]);
  const yeokma = brs.filter(b=>YEOKMA_BR.indexOf(b)>=0).length;
  let chung = 0;
  for(let i=0;i<brs.length;i++) for(let j=i+1;j<brs.length;j++)
    if(CHUNG.some(([a,b])=>(brs[i]===a&&brs[j]===b)||(brs[i]===b&&brs[j]===a))) chung++;
  return { yeokma, chung, brs };
}

/* ── 글자로 ──────────────────────────────────── */
function pillarText(p){
  if(!p) return "—";
  return STEM[p.s][0]+BRANCH[p.b][0]+" "+STEM[p.s][1]+BRANCH[p.b][1];
}
function sajuText(P){
  return {
    year:  pillarText(P.year),
    month: pillarText(P.month),
    day:   pillarText(P.day),
    hour:  P.hour ? pillarText(P.hour) : "모름",
    ilgan: STEM[P.ilgan][0]+"("+STEM[P.ilgan][1]+")",
    ilganOh: STEM[P.ilgan][2],
    ddi: BRANCH[P.year.b][4]
  };
}

/* ══════════════════════════════════════════════
   때를 셈합니다 — 대운·격국·신강약·용신·충합·공망·월운
   "얼굴은 그릇, 사주는 때" 라고 말해 놓고 때를 안 알려주면
   그건 사주를 판 것이 아닙니다.
   ══════════════════════════════════════════════ */

/* 지지 속 천간 — 여기(餘氣)·중기(中氣)·정기(正氣) */
const JIJANG3 = [
  [8,null,9],[9,7,5],[4,2,0],[0,null,1],[1,9,4],[4,6,2],
  [2,5,3],[3,1,5],[4,8,6],[6,null,7],[7,3,4],[4,0,8]
];
/* 십성 무리 → 일간에서 본 오행 */
function grpElem(meStem, grp){
  const mo = STEM[meStem][2];
  if(grp==="비겁") return mo;
  if(grp==="식상") return SAENG[mo];
  if(grp==="재성") return GEUK[mo];
  if(grp==="관성") return Object.keys(GEUK).find(k=>GEUK[k]===mo);
  if(grp==="인성") return Object.keys(SAENG).find(k=>SAENG[k]===mo);
  return mo;
}
const ELEM_SAEK = { "목":"쪽빛", "화":"다홍", "토":"치자", "금":"백자", "수":"먹빛" };
const ELEM_BANG = { "목":"동쪽", "화":"남쪽", "토":"가운데", "금":"서쪽", "수":"북쪽" };
const ELEM_CHEOL= { "목":"봄",   "화":"여름", "토":"환절기", "금":"가을", "수":"겨울" };

/* ── 대운 ───────────────────────────────────────
   양년생 남자와 음년생 여자는 순행, 나머지는 역행합니다.
   생일에서 절입까지의 날수를 사흘에 한 해로 쳐서 첫 대운 나이를 잡습니다. */
function daeun(P, y, m, d, h, mi, sex, opt){
  const o = opt||{};
  const corr = (o.correctionMin===undefined) ? 30 : o.correctionMin;
  const hasTime = o.hasTime !== false;
  const base = new Date(Date.UTC(y, m-1, d, hasTime?h:12, hasTime?mi:0));
  base.setUTCMinutes(base.getUTCMinutes() - (hasTime?corr:0));
  const jd = toJd(base.getUTCFullYear(), base.getUTCMonth()+1, base.getUTCDate(),
                  base.getUTCHours(), base.getUTCMinutes());

  const yangYear = STEM[P.year.s][3] === "양";
  const forward  = (yangYear === (sex === "남"));

  const lon   = sunLongitude(jd);
  const order = Math.floor(SMOD(lon-315,360)/30);        /* 0 = 인월 */
  const curT  = SMOD(315 + order*30, 360);
  const curJd = solarTermJd(curT, jd-15);
  const nxtJd = solarTermJd(SMOD(curT+30,360), jd+15);

  const days = forward ? (nxtJd - jd) : (jd - curJd);
  let num = Math.floor(days/3 + 0.5);
  if(num < 1) num = 1; if(num > 10) num = 10;

  const list = [];
  for(let i=0;i<9;i++){
    const step = forward ? (i+1) : -(i+1);
    list.push({ s:SMOD(P.month.s+step,10), b:SMOD(P.month.b+step,12),
                from:num + i*10, to:num + i*10 + 9 });
  }
  return { forward, num, list };
}
/* 그 나이에 어느 대운을 지나는가 */
function daeunAt(D, age){
  if(age < D.num) return { before:true, at:null, idx:-1 };
  const idx = Math.min(D.list.length-1, Math.floor((age - D.num)/10));
  return { before:false, at:D.list[idx], idx, next:D.list[idx+1]||null };
}

/* ── 신강·신약 ─────────────────────────────────
   월령을 가장 무겁게 보고, 일지·천간·지지 순으로 무게를 둡니다. */
function bodyStrength(P){
  const me = P.ilgan;
  const help = g => (g==="비겁" || g==="인성");
  let sc = 0, cap = 0;
  const put = (stem, w) => {
    const g = GROUP[tenGod(me, stem)];
    sc += help(g) ? w : -w*0.82; cap += w;
  };
  put(JIJANG[P.month.b], 3.0);                 /* 월령 */
  put(P.month.s,         1.3);
  put(JIJANG[P.day.b],   2.0);                 /* 득지 */
  put(P.year.s,          1.0);
  put(JIJANG[P.year.b],  1.1);
  if(P.hour){ put(P.hour.s, 1.1); put(JIJANG[P.hour.b], 1.2); }
  const r = sc / Math.max(cap,1);
  /* -1 아주 약 … +1 아주 강 */
  const lv = r >=  0.34 ? 4 : r >= 0.10 ? 3 : r >= -0.14 ? 2 : r >= -0.38 ? 1 : 0;
  return { r, lv, nm:["아주 약함","약함","중화에 가까움","강함","아주 강함"][lv],
           strong: lv >= 3, weak: lv <= 1 };
}

/* ── 격국 ──────────────────────────────────────
   월지의 정기를 보되, 그 글자가 천간에 드러나 있으면 그쪽을 먼저 씁니다. */
function gyeokguk(P){
  const me = P.ilgan;
  const [yeo, jung, jeong] = JIJANG3[P.month.b];
  const stems = [P.year.s, P.month.s].concat(P.hour?[P.hour.s]:[]);
  /* 정기가 천간에 드러나면 그것, 아니면 중기·여기 순, 아무것도 안 드러나면 정기로 봅니다 */
  let use = jeong, why = "월지의 정기";
  if(jeong!=null && stems.indexOf(jeong)>=0)      { use = jeong; why = "월지의 정기가 천간에 드러남"; }
  else if(jung!=null && stems.indexOf(jung)>=0)   { use = jung;  why = "월지의 중기가 천간에 드러남"; }
  else if(yeo!=null && stems.indexOf(yeo)>=0)     { use = yeo;   why = "월지의 여기가 천간에 드러남"; }
  const g = tenGod(me, use);
  let nm;
  if(g==="비견")      nm = "건록격(建祿格)";
  else if(g==="겁재") nm = "양인격(羊刃格)";
  else                nm = g + "격";
  return { god:g, grp:GROUP[g], nm, why, stem:use };
}

/* ── 용신 가닥 ─────────────────────────────────
   억부(抑扶)로 봅니다. 강하면 덜어내고, 약하면 받칩니다. */
function yongsin(P, BS){
  const me = P.ilgan, T = tally(P);
  let want, avoid;
  if(BS.strong){
    /* 재성이 이미 두터우면 관성으로 눌러 쓰고, 아니면 식상·재성으로 덜어냅니다 */
    want  = (T.cnt.재성 >= 2) ? ["관성","식상"] : ["식상","재성"];
    avoid = ["인성","비겁"];
  }else if(BS.weak){
    want  = (T.cnt.관성 >= 2) ? ["인성","비겁"] : ["비겁","인성"];
    avoid = ["재성","관성"];
  }else{
    /* 중화에 가까우면 가장 모자란 쪽을 채웁니다 */
    const order = Object.keys(T.cnt).sort((a,b)=>T.cnt[a]-T.cnt[b]);
    want  = [order[0], order[1]];
    avoid = [order[4]];
  }
  const el = g => grpElem(me, g);
  return {
    want, avoid,
    wantEl : want.map(el),
    avoidEl: avoid.map(el),
    saek   : want.map(g=>ELEM_SAEK[el(g)]),
    bang   : ELEM_BANG[el(want[0])],
    cheol  : ELEM_CHEOL[el(want[0])],
    kkeori : ELEM_SAEK[el(avoid[0])]
  };
}

/* ── 지지끼리의 관계 ───────────────────────── */
const YUKHAP  = [[0,1],[2,11],[3,10],[4,9],[5,8],[6,7]];
const SAMHAP  = [[8,0,4,"수"],[11,3,7,"목"],[2,6,10,"화"],[5,9,1,"금"]];
const HYEONG  = [[2,5,8],[1,10,7],[0,3]];
const JAHYEONG= [4,6,9,11];
function branchRel(P){
  const at = ["년","월","일"].concat(P.hour?["시"]:[]);
  const brs = [P.year.b, P.month.b, P.day.b].concat(P.hour?[P.hour.b]:[]);
  const out = { chung:[], hap:[], samhap:[], hyeong:[], jahyeong:[] };
  for(let i=0;i<brs.length;i++) for(let j=i+1;j<brs.length;j++){
    const a=brs[i], b=brs[j], nm=at[i]+"지·"+at[j]+"지";
    if(CHUNG.some(([x,y])=>(a===x&&b===y)||(a===y&&b===x)))
      out.chung.push({ nm, a, b, t:BRANCH[a][0]+BRANCH[b][0]+" 충("+nm+")" });
    if(YUKHAP.some(([x,y])=>(a===x&&b===y)||(a===y&&b===x)))
      out.hap.push({ nm, a, b, t:BRANCH[a][0]+BRANCH[b][0]+" 합("+nm+")" });
    if(a===b && JAHYEONG.indexOf(a)>=0)
      out.jahyeong.push({ nm, t:BRANCH[a][0]+" 자형" });
  }
  /* 형은 셋이 모이면 삼형으로 한 번만 셉니다. 짝만 걸리면 그 짝으로 셉니다. */
  HYEONG.forEach(h=>{
    const have = h.filter(v=>brs.indexOf(v)>=0);
    if(h.length===3 && have.length===3)
      out.hyeong.push({ full:true, t:h.map(v=>BRANCH[v][0]).join("")+" 삼형" });
    else if(have.length>=2)
      out.hyeong.push({ full:false, t:have.slice(0,2).map(v=>BRANCH[v][0]).join("")+" 형" });
  });
  SAMHAP.forEach(([x,y,z,el])=>{
    const have = [x,y,z].filter(v=>brs.indexOf(v)>=0);
    if(have.length>=2) out.samhap.push({ el, full:have.length===3,
      t:have.map(v=>BRANCH[v][0]).join("")+(have.length===3?" 삼합":" 반합")+"("+el+")" });
  });
  return out;
}

/* ── 공망 ─────────────────────────────────────── */
function gongmang(P){
  const b0 = SMOD(P.day.b - P.day.s, 12);
  const g  = [SMOD(b0+10,12), SMOD(b0+11,12)];
  const at = [];
  [["년",P.year.b],["월",P.month.b]].concat(P.hour?[["시",P.hour.b]]:[])
    .forEach(([n,b])=>{ if(g.indexOf(b)>=0) at.push(n); });
  return { br:g, t:g.map(b=>BRANCH[b][0]).join("·"), at };
}

/* ── 그 해의 기둥 ─────────────────────────────── */
function yearPillar(Y){
  /* 그 해 입춘 뒤의 간지 */
  return { s:SMOD(Y-4,10), b:SMOD(Y-4,12) };
}
/* 세운이 원국을 건드리는 자리 */
function seunRel(P, Y){
  const sp = yearPillar(Y);
  const me = P.ilgan;
  const god = tenGod(me, sp.s), grp = GROUP[god];
  const hits = [];
  [["년",P.year.b],["월",P.month.b],["일",P.day.b]].concat(P.hour?[["시",P.hour.b]]:[])
    .forEach(([n,b])=>{
      if(CHUNG.some(([x,y])=>(b===x&&sp.b===y)||(b===y&&sp.b===x)))
        hits.push({ n, kind:"충", t:n+"지와 충" });
      else if(YUKHAP.some(([x,y])=>(b===x&&sp.b===y)||(b===y&&sp.b===x)))
        hits.push({ n, kind:"합", t:n+"지와 합" });
    });
  return { p:sp, god, grp, hits,
           gm: (gongmang(P).br.indexOf(sp.b)>=0) };
}
/* 그 해 열두 달 — 쓸 달과 쉴 달 */
/* 그 해 열두 달이 아니라, 보는 날로부터 앞으로 열두 달을 봅니다.
   시월에 보면서 지난 유월을 권하면 사주를 본 게 아닙니다. */
function monthLuck(P, Y, YS, fromDate){
  const me = P.ilgan;
  const now = fromDate || new Date();
  const rows = [];
  for(let k=0; k<12; k++){
    /* 이번 달부터 앞으로 열두 달 — 달의 한가운데를 잡아 절입을 넘겨 셉니다 */
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth()+k, 16, 3, 0));
    const jd = toJd(d.getUTCFullYear(), d.getUTCMonth()+1, d.getUTCDate(), 12, 0);
    const lon = sunLongitude(jd);
    const order = Math.floor(SMOD(lon-315,360)/30);        /* 0 = 인월 */
    const br = SMOD(2+order,12);
    let sy = d.getUTCFullYear();
    if(jd < ipchunJd(sy)) sy = sy-1;                        /* 입춘 전이면 지난해 */
    const yp = yearPillar(sy);
    const first = SMOD(SMOD(yp.s,5)*2+2,10);                /* 오호둔 */
    const st = SMOD(first+order,10);
    const gS = GROUP[tenGod(me, st)], gB = GROUP[tenGod(me, JIJANG[br])];
    const score = (YS.want.indexOf(gS)>=0?1:0) + (YS.want.indexOf(gB)>=0?1.2:0)
                - (YS.avoid.indexOf(gS)>=0?1:0) - (YS.avoid.indexOf(gB)>=0?1.2:0);
    rows.push({ y:d.getUTCFullYear(), mth:d.getUTCMonth()+1, st, br, score, gS, gB, k });
  }
  const byScore = rows.slice().sort((a,b)=>b.score-a.score || a.k-b.k);
  const pick = arr => arr.sort((a,b)=>a.k-b.k);
  return {
    good: pick(byScore.slice(0,2).filter(r=>r.score>0)),
    bad : pick(byScore.slice(-2).filter(r=>r.score<0)),
    rows
  };
}

