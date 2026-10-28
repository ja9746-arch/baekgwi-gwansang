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
