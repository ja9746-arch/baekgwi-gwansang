/* 백귀관상 — 관상첩 열 장
   얼굴에서 잡힌 백가지 단서와 열두 궁의 판정을 엮어
   원안법사가 손님께 드리는 열 장의 첩을 짭니다.

   지켜야 할 것
     하나.  누구에게나 들어맞는 말은 쓰지 않습니다.
            모든 문장 뒤에는 얼굴에서 실제로 잡힌 자리가 있어야 합니다.
     둘.    시기를 말합니다. 언제인지 없는 풀이는 풀이가 아닙니다.
     셋.    왜 막혔는지와 어떻게 푸는지를 함께 둡니다.
     넷.    말은 쉽게, 뜻은 단정하게. */

/* ── 조사 ─────────────────────────────────────── */
function jo(w, a, b){            /* 받침 있으면 a, 없으면 b */
  if(!w) return a;
  const c = w.charCodeAt(w.length-1);
  if (c < 0xAC00 || c > 0xD7A3) return a;
  return ((c - 0xAC00) % 28) ? a : b;
}
const 은는 = w => w + jo(w,"은","는");
const 이가 = w => w + jo(w,"이","가");
const 을를 = w => w + jo(w,"을","를");

/* ── 제비 ─────────────────────────────────────── */
function dice(seed, salt, n){
  let h = (seed ^ Math.imul(salt+13, 2654435761)) >>> 0;
  h = (h ^ (h>>>13)) >>> 0; h = Math.imul(h, 1274126177) >>> 0;
  return ((h ^ (h>>>16)) >>> 0) % n;
}
const pickOne = (arr, seed, salt) => arr[dice(seed, salt, arr.length)];

/* ── 단서를 말로 ────────────────────────────────
   잡힌 자리를 그대로 읽고, 그 자리가 뜻하는 것을 붙입니다. */
const 이음같 = ["여기에 ", "그리고 ", "또 ", "거기에 더해 ", "한 가지 더 있습니다. "];
const 이음다 = ["다만 ", "그런데 ", "대신 ", "한편 "];
function clueLine(h, i, seed, salt, prev){
  let head = "";
  if (i > 0){
    const 뒤집 = prev && ((prev.c.g > 0 && h.c.g < 0) || (prev.c.g < 0 && h.c.g > 0));
    head = pickOne(뒤집 ? 이음다 : 이음같, seed, salt + i*7);
  }
  return head + h.c.s + ". " + h.c.m;
}
/* 세기에 따라 말을 더 세게 */
function force(h){
  return h.z >= 1.6 ? "아주 또렷하게" : (h.z >= 1.0 ? "또렷하게" : "");
}

/* ── 나이와 시기 ────────────────────────────────
   관상은 몇 년 몇 월을 찍지 않습니다. 대신 얼굴의 자리가
   몇 살을 맡고 있는지로 말합니다. 그게 관상의 자입니다. */
function ages(age){
  const a = Math.max(15, Math.min(90, age|0));
  const next = [];
  for (let k = 1; k <= 12; k++){
    const y = YUN[a+k]; if(!y) break;
    if (!next.find(x=>x.bu===y[0])) next.push({ age:a+k, bu:y[0], g:y[1] });
    if (next.length >= 3) break;
  }
  return next;
}
function 시기말(R, k, lv){
  const s = (SI[k] || SI["명"]);
  return s[Math.max(0, Math.min(2, lv))];
}

/* ── 백귀 한 마리를 말로 ────────────────────────── */
function gwiOf(i){
  const b = BG[i] || BG[0];
  return { i, n:b[0], h:b[1], no:b[2], d:b[3], warn:b[4], fix:b[5],
           img: "img/baekgwi/" + b[2] + ".webp" };
}
/* 같은 백귀도 두 얼굴을 가집니다 — 복으로 설 때와 흉으로 설 때 */
function gwiTwo(g, 길){
  return 길
    ? { on:"복(福)", t: g.d.replace(/\.$/,"") + " — 이 기운이 손님 쪽에 서면 그렇게 쓰입니다." }
    : { on:"흉(凶)", t: g.warn };
}

/* ── 첩 하나의 틀 ─────────────────────────────── */
function 첩(no, key, title, sub, free){
  return { no, key, title, sub, free: !!free, ev:[], body:[], si:null, act:null };
}
function 단락(h, p, ev){ return { h, p, ev: ev || [] }; }

/* ── 열 장을 짭니다 ─────────────────────────────── */
function makeCheop(R, C, age, sex){
  const seed = R.seed;
  const byT = C.byT;
  const G = {}; for (const j of R.jari) G[j.g.k] = j;
  const 나이 = ages(age);
  const out = [];

  /* 한 번 쓴 단서는 다음 첩에서 다시 쓰지 않습니다.
     같은 말이 두 번 나오면 손님은 바로 알아챕니다. */
  const 썼다 = new Set();
  function 뽑기(pool, n){
    const got = [];
    for (const h of pool){ if(got.length>=n) break; if(썼다.has(h.c.id)) continue; got.push(h); }
    got.forEach(h=>썼다.add(h.c.id));
    return got;
  }

  /* 잡힌 자리를 적어 두는 칸 */
  const ev = (list, n) => list.slice(0, n||3).map(h=>({
    id: h.c.id, bu: h.c.bu, n: h.c.n, s: h.c.s, z: +h.z.toFixed(2), g: h.c.g
  }));

  /* ── 제1첩 · 내 타고난 얼굴 ───────────────────── */
  {
    const c = 첩(1, "타고난", "내 타고난 얼굴", "얼굴에 새겨진, 자네가 가지고 난 결", true);
    const oh = OH[R.hyeong];
    const 본 = 뽑기(byT.본성, 4);
    c.ev = ev(본, 4);

    c.body.push(단락(
      "타고난 그릇",
      `손님 얼굴은 ${R.hyeong}(${{"목":"木","화":"火","토":"土","금":"金","수":"水"}[R.hyeong]})의 꼴입니다. ` +
      oh.seong + " " + (본[0] ? clueLine(본[0], 0, seed, 11) : ""),
      본[0] ? [본[0].c.id] : []
    ));

    const 삼 = SAMJEONG[R.samjeong];
    c.body.push(단락(
      "세 마디의 흐름",
      `삼정(三停) 가운데 ${R.samjeong}정이 도드라집니다. ` + (삼 ? 삼.dae : "") +
      (본[1] ? " " + clueLine(본[1], 1, seed, 23, 본[0]) : ""),
      본[1] ? [본[1].c.id] : []
    ));

    c.body.push(단락(
      "숨은 결",
      (본[2] ? clueLine(본[2], 0, seed, 31) : "") +
      (본[3] ? " " + clueLine(본[3], 1, seed, 37, 본[2]) : ""),
      [본[2], 본[3]].filter(Boolean).map(h=>h.c.id)
    ));

    const gi = GISAEK[R.gisaek];
    c.body.push(단락(
      "지금 도는 기운",
      `얼굴에 ${R.gisaek}기(${gi ? gi.ja : ""})가 돕니다. ${gi ? gi.mal : ""} ${gi ? gi.ttae : ""} ` +
      `타고난 그릇과 지금 기운이 ${R.gyo.dan}의 사이입니다. ${R.gyo.mal}`,
      []
    ));
    c.si = 시기말(R, "명", G["명"] ? G["명"].lv : 1);
    out.push(c);
  }

  /* ── 제2첩 · 재물의 자리 ──────────────────────── */
  {
    const c = 첩(2, "재물", "재물의 자리", "돈이 들어오는 길과 새는 길", true);
    const 재 = 뽑기(byT.재물, 4);
    const j = G["재백"], jt = G["전택"], jn = G["노복"];
    c.ev = ev(재, 4);

    c.body.push(단락(
      "돈이 들어오는 길",
      (재[0] ? clueLine(재[0], 0, seed, 41) + " " : "") +
      `재백궁(財帛宮)은 준두 — 코끝입니다. ${j.g.lv[j.lv].dx} ${j.g.lv[j.lv].rd}`,
      재[0] ? [재[0].c.id] : []
    ));

    c.body.push(단락(
      "새는 자리",
      (재[1] ? clueLine(재[1], 0, seed, 43) + " " : "") +
      (jt.lv === 2
        ? `전택궁(田宅宮)이 막혀 있습니다. ${jt.g.lv[2].rd} 집이나 묶어 둔 돈에서 샙니다.`
        : jt.lv === 1
          ? `전택궁은 반반입니다. ${jt.g.lv[1].rd}`
          : `전택궁이 트여 있습니다. ${jt.g.lv[0].rd}`),
      재[1] ? [재[1].c.id] : []
    ));

    c.body.push(단락(
      "큰돈을 다루는 힘",
      (재[2] ? clueLine(재[2], 0, seed, 47) + " " : "") +
      (재[3] ? clueLine(재[3], 1, seed, 53, 재[2]) + " " : "") +
      `${은는(jn.g.n)} ${jn.lv===0?"받칩니다":jn.lv===1?"들고 납니다":"비어 있습니다"}. ` +
      (jn.lv===2 ? "손님이 큰 것을 쥐었을 때 곁에 남을 사람을 지금 만들어 두셔야 합니다." : "곁의 사람이 손님 돈을 지켜 줍니다."),
      [재[2], 재[3]].filter(Boolean).map(h=>h.c.id)
    ));

    c.si = 시기말(R, "재백", j.lv);
    c.act = j.g.lv[j.lv].ac;
    out.push(c);
  }

  /* ── 제3첩 · 인연과 사람 ──────────────────────── */
  {
    const c = 첩(3, "인연", "인연과 사람", "다가오는 인연과, 멀리해야 할 인연");
    const 인 = 뽑기(byT.인연, 4);
    const ch = G["처첩"], hy = G["형제"], nn = G["남녀"];
    c.ev = ev(인, 4);

    c.body.push(단락(
      "손님이 사람을 대하는 법",
      (인[0] ? clueLine(인[0], 0, seed, 61) + " " : "") +
      (인[1] ? clueLine(인[1], 1, seed, 67, 인[0]) : ""),
      [인[0], 인[1]].filter(Boolean).map(h=>h.c.id)
    ));

    c.body.push(단락(
      "배우자의 자리",
      `처첩궁(妻妾宮)은 눈꼬리 바깥 어미(魚尾)입니다. ${ch.g.lv[ch.lv].dx} ${ch.g.lv[ch.lv].rd}`,
      []
    ));

    /* 맞는 사람 — 손님 그릇을 생해 주는 오행의 꼴 */
    const 도움 = OH_SAENG_ME[R.hyeong], 눌림 = OH_GEUK_ME[R.hyeong];
    const 꼴말 = { "목":"길고 갸름한 얼굴에 눈썹이 짙은", "화":"턱이 모이고 눈빛이 빠른",
                   "토":"얼굴이 두텁고 말이 느린", "금":"각이 지고 말이 또렷한",
                   "수":"둥글고 살이 도는" };
    c.body.push(단락(
      "맞는 사람과 피할 사람",
      `손님 그릇을 받쳐 주는 쪽은 ${꼴말[도움]} 사람입니다. 그 사람 곁에서는 손님이 애쓰지 않아도 일이 풉니다. ` +
      `반대로 ${꼴말[눌림]} 사람과는 길게 가지 마세요. 처음에는 끌리는데, 가까워질수록 손님이 깎입니다. ` +
      (인[2] ? clueLine(인[2], 1, seed, 71) : ""),
      인[2] ? [인[2].c.id] : []
    ));

    c.body.push(단락(
      "형제·동무·아랫사람",
      `${은는(hy.g.n)} ${hy.lv===0?"트였고":hy.lv===1?"반반이고":"막혔고"}, ` +
      `${은는(nn.g.n)} ${nn.lv===0?"찼습니다":nn.lv===1?"들고 납니다":"비었습니다"}. ` +
      hy.g.lv[hy.lv].rd + " " +
      (인[3] ? clueLine(인[3], 0, seed, 73) : ""),
      인[3] ? [인[3].c.id] : []
    ));

    c.si = 시기말(R, "처첩", ch.lv);
    c.act = ch.g.lv[ch.lv].ac;
    out.push(c);
  }

  /* ── 제4첩 · 사회적 인상과 평판 ───────────────── */
  {
    const c = 첩(4, "사회", "사회적 인상과 평판", "남이 보는 자네, 그리고 자네가 설 자리");
    const 사 = 뽑기(byT.사회, 4);
    const gw = G["관록"], ch2 = G["천이"], bd = G["복덕"];
    c.ev = ev(사, 4);

    c.body.push(단락(
      "첫인상",
      (사[0] ? clueLine(사[0], 0, seed, 81) + " " : "") +
      (사[1] ? clueLine(사[1], 1, seed, 83, 사[0]) : ""),
      [사[0], 사[1]].filter(Boolean).map(h=>h.c.id)
    ));

    c.body.push(단락(
      "직장과 사업의 자리",
      `관록궁(官祿宮)은 이마 가운데 중정(中正)입니다. ${gw.g.lv[gw.lv].dx} ${gw.g.lv[gw.lv].rd}`,
      []
    ));

    c.body.push(단락(
      "손님에게 맞는 길",
      (R.hyeong==="금"||R.hyeong==="토"
        ? "손님은 자리를 맡아야 제 몫을 합니다. 혼자 하는 일보다 사람을 쥐는 일이 맞습니다."
        : R.hyeong==="목"||R.hyeong==="수"
          ? "손님은 오래 쌓는 일이 맞습니다. 빨리 터지는 일에 들어가면 들인 것만 잃습니다."
          : "손님은 처음을 여는 일이 맞습니다. 다만 끝맺는 사람을 옆에 두셔야 합니다.") + " " +
      (사[2] ? clueLine(사[2], 1, seed, 87) : ""),
      사[2] ? [사[2].c.id] : []
    ));

    c.body.push(단락(
      "이동과 평판",
      `${은는(ch2.g.n)} ${ch2.lv===0?"열려 있습니다":ch2.lv===1?"반반입니다":"막혀 있습니다"}. ${ch2.g.lv[ch2.lv].rd} ` +
      `복덕궁은 ${bd.lv===0?"차 있어 마음에 여유 칸이 있습니다":bd.lv===1?"들고 납니다":"꺼져 있어 쉴 자리가 좁습니다"}. ` +
      (사[3] ? clueLine(사[3], 0, seed, 91) : ""),
      사[3] ? [사[3].c.id] : []
    ));

    c.si = 시기말(R, "관록", gw.lv);
    c.act = gw.g.lv[gw.lv].ac;
    out.push(c);
  }

  /* ── 제5첩 · 세월이 남긴 흔적 ─────────────────── */
  {
    const c = 첩(5, "세월", "세월이 남긴 흔적", "지나온 자리와, 앞으로 오는 자리");
    const 세 = 뽑기(byT.세월, 3);
    c.ev = ev(세, 4);

    c.body.push(단락(
      "지금 손님이 선 자리",
      `${age}세는 얼굴에서 ${R.yun.bu} 자리입니다. 이 자리를 ${R.boss.g.n}이 맡습니다. ` +
      `${R.boss.lv===0?"트여 있습니다":R.boss.lv===1?"반반입니다":"막혀 있습니다"}. ${R.boss.g.lv[R.boss.lv].rd}`,
      []
    ));

    c.body.push(단락(
      "지나온 자리",
      `${R.hitAge}세 무렵 손님은 ${R.hitYun.bu} 자리를 지났습니다. ` +
      `그때 한 번 크게 흔들렸거나, 지금 손님을 만든 일이 그 언저리에 있습니다. ` +
      (세[0] ? clueLine(세[0], 0, seed, 101) : ""),
      세[0] ? [세[0].c.id] : []
    ));

    const 앞 = 나이.map(x=>`${x.age}세에 ${x.bu}`).join(", ");
    c.body.push(단락(
      "앞으로 오는 자리",
      (앞 ? `앞으로는 ${앞} 자리로 넘어갑니다. ` : "") +
      (나이[0] && G[나이[0].g]
        ? `가장 먼저 오는 ${나이[0].bu}${jo(나이[0].bu,"은","는")} ${G[나이[0].g].g.n}이 맡는 자리라, ` +
          (G[나이[0].g].lv===2
            ? `${나이[0].age}세 언저리가 손님께 한 번 고비입니다. 미리 알고 가시면 덜 상합니다.`
            : `${나이[0].age}세 언저리에 한 번 길이 열립니다. 그때 움직이세요.`)
        : "") + " " +
      (세[1] ? clueLine(세[1], 1, seed, 103) : ""),
      세[1] ? [세[1].c.id] : []
    ));

    c.body.push(단락(
      "얼굴이 달라지는 자리",
      (세[2] ? clueLine(세[2], 0, seed, 107) + " " : "") +
      (R.samjeong === "하"
        ? "손님은 뒤로 갈수록 좋아지는 얼굴입니다. 지금 안 풀리는 것이 끝이 아닙니다."
        : R.samjeong === "상"
          ? "손님은 앞이 두터운 얼굴입니다. 초년에 받은 것을 지금 쓰고 계십니다. 뒤를 위해 남겨 두세요."
          : "손님은 중년을 길게 쓰는 얼굴입니다. 지금이 한가운데입니다."),
      세[2] ? [세[2].c.id] : []
    ));

    c.si = 시기말(R, R.boss.g.k, R.boss.lv);
    c.act = R.boss.g.lv[R.boss.lv].ac;
    out.push(c);
  }

  /* ── 제6첩 · 강점과 주의할 점 ─────────────────── */
  {
    const c = 첩(6, "강약", "강점과 주의할 점", "살릴 자리 셋, 지킬 자리 둘");
    const 길 = C.gil.slice(0, 3), 흉 = C.hyung.slice(0, 2);
    c.ev = ev(길.concat(흉), 5);

    c.body.push(단락(
      "가장 좋은 자리 셋",
      길.length
        ? 길.map((h,i)=>`${i+1}. ${h.c.s} — ${h.c.m}`).join(" ")
        : "크게 솟은 자리는 없습니다. 대신 고르게 섰습니다. 고른 얼굴은 무너지지 않습니다.",
      길.map(h=>h.c.id)
    ));

    c.body.push(단락(
      "지켜야 할 자리 둘",
      흉.length
        ? 흉.map((h,i)=>`${i+1}. ${h.c.s} — ${h.c.m}`).join(" ")
        : "크게 깎인 자리는 없습니다. 다만 고른 얼굴은 큰 것을 한 번에 쥐기 어렵습니다.",
      흉.map(h=>h.c.id)
    ));

    const 막 = R.jari.filter(j=>j.lv===2);
    c.body.push(단락(
      "왜 지금 안 풀리는가",
      막.length
        ? `지금 막힌 자리는 ${막.map(j=>j.g.n).join(", ")}입니다. ` +
          `${막[0].g.lv[2].rd} ${막[0].g.lv[2].ac}`
        : `크게 막힌 자리는 없습니다. 지금 안 풀리는 것이 있다면 자리 탓이 아니라 때 탓입니다. ${R.gyo.mal}`,
      []
    ));

    c.body.push(단락(
      "잘 쓰면 복이 되는 기질",
      (R.hyeong==="화"||R.hyeong==="금"
        ? "손님의 세기는 날이 섭니다. 날은 베기도 하고 열기도 합니다. 사람에게 쓰면 베고, 일에 쓰면 엽니다."
        : "손님의 더딤은 둔한 것이 아니라 두터운 것입니다. 급한 자리에 서면 손해를 보고, 오래 가는 자리에 서면 이깁니다."),
      []
    ));
    out.push(c);
  }

  /* ── 제7첩 · 얼굴 십이궁 ──────────────────────── */
  {
    const c = 첩(7, "십이궁", "얼굴 십이궁", "얼굴에 숨은 열두 자리의 운");
    c.jari = R.jari.map(j=>({
      k: j.g.k, n: j.g.n, h: j.g.h, bu: j.g.bu, d: j.g.d, lv: j.lv,
      dx: j.g.lv[j.lv].dx, rd: j.g.lv[j.lv].rd, ac: j.g.lv[j.lv].ac,
      gwi: gwiOf(j.bg), boss: j.g.k === R.boss.g.k
    }));
    c.body.push(단락(
      "열두 자리를 읽는 법",
      `얼굴에는 열두 자리가 있습니다. 자리마다 맡은 일이 다릅니다. ` +
      `손님은 트인 자리가 ${R.opened}, 막힌 자리가 ${R.blocked}입니다. ` +
      `가장 환한 자리는 ${R.brightest.g.n}, 가장 그늘진 자리는 ${R.darkest.g.n}입니다. ` +
      `그리고 올해를 쥐는 자리는 ${R.boss.g.n}입니다.`,
      []
    ));
    out.push(c);
  }

  /* ── 제8첩 · 얼굴에 깃든 백귀 ─────────────────── */
  {
    const c = 첩(8, "백귀", "얼굴에 깃든 백귀", "자네 얼굴의 자리를 지키고 선 것들");
    /* 막힌 자리와 트인 자리에서 셋을 고릅니다 */
    const ord = R.jari.slice().sort((a,b)=> (b.lv - a.lv) || (a.z - b.z));
    const 셋 = [ord[0], ord[1], R.brightest].filter((x,i,a)=> a.findIndex(y=>y.g.k===x.g.k)===i).slice(0,3);
    c.gwi = 셋.map((j, i)=>{
      const g = gwiOf(j.bg);
      return {
        rank: 3 - i, 자리: j.g.n, 부: j.g.bu, lv: j.lv,
        g, 두얼굴: [gwiTwo(g, true), gwiTwo(g, false)],
        근거: `${j.g.bu} 자리가 ${j.lv===0?"트여":"막혀"} 있어 ${이가(g.n)} 여기 섰습니다.`,
        말: j.lv === 2
          ? `${을를(g.n)} 그대로 두면 ${j.g.d} 쪽이 계속 막힙니다. ${g.fix}`
          : `${이가(g.n)} 손님 쪽에 서 있습니다. ${j.g.d} 쪽으로 힘이 붙습니다.`
      };
    });
    c.body.push(단락(
      "백귀는 왜 얼굴에 서는가",
      "백 가지 귀(鬼)는 열두 자리에 나뉘어 삽니다. 자리가 트이면 그 자리의 것이 손님을 받치고, " +
      "자리가 막히면 그 자리의 것이 문을 쥐고 섭니다. 손님 얼굴에서 가장 세게 선 셋을 보여 드리겠습니다.",
      []
    ));
    out.push(c);
  }

  /* ── 제9첩 · 원안법사의 처방 ──────────────────── */
  {
    const c = 첩(9, "처방", "원안법사의 처방", "점 찍을 자리, 길한 색, 어울리는 머리");
    const P = prescribe(R);
    c.jeom = P.jeom; c.gil = P.gil; c.hyung = P.hyung; c.mori = P.mori;
    c.body.push(단락(
      "점 하나의 자리",
      `올해를 쥐는 ${R.boss.g.n}에서 봅니다. 아래 세 자리 가운데 손님께 맞는 자리를 짚어 드립니다. ` +
      "점은 찍어도 되고 안 찍어도 됩니다. 다만 그 자리를 알고 계시면 거울을 볼 때마다 생각이 거기 갑니다. 그게 먼저입니다.",
      []
    ));
    const 길색 = (P.gil||[]).map(g=>`${g[0]}은 ${g[2]}에`).join(", ");
    c.body.push(단락(
      "색과 머리",
      `색은 겉옷보다 안쪽, 안쪽보다 몸에 닿는 것이 셉니다. 아래에 쓸 데까지 적어 두었습니다. ` +
      `머리는 ${P.mori[0]} — 손님 그릇이 ${R.hyeong}형이고 ${R.samjeong}정이 도드라져서입니다.`,
      []
    ));
    out.push(c);
  }

  /* ── 제10첩 · 원안법사의 마지막 밀서 ──────────── */
  {
    const c = 첩(10, "밀서", "원안법사의 마지막 밀서", "지금 자네에게 전하는 한마디");
    const S = summarize(R);
    c.verdict = S.verdict; c.verdictMore = S.verdictMore;
    c.todo = S.todo; c.avoid = S.avoid;
    c.go = S.go; c.stop = S.stop;

    c.body.push(단락(
      "총평",
      `손님 얼굴은 ${R.hyeong}의 그릇에 ${R.gisaek}기가 도는 얼굴입니다. 올해는 ${S.verdict}입니다. ${S.verdictMore} ` +
      `${S.boss}`,
      []
    ));
    c.body.push(단락(
      "지금 꼭 기억할 것",
      C.gil[0]
        ? `손님께 가장 센 자리는 여깁니다 — ${C.gil[0].c.s} ${C.gil[0].c.m} 이것 하나만 들고 가셔도 됩니다.`
        : "손님 얼굴은 고릅니다. 고른 얼굴은 크게 흔들리지 않습니다. 그것이 손님의 가장 큰 자리입니다.",
      C.gil[0] ? [C.gil[0].c.id] : []
    ));
    c.body.push(단락(
      "원안법사의 당부",
      (R.blocked >= 4
        ? "막힌 자리가 여럿입니다. 한꺼번에 다 열려고 하지 마세요. 올해는 하나만 여시면 됩니다. 나머지는 그 하나가 열리면 따라 열립니다."
        : R.opened >= 5
          ? "트인 자리가 여럿입니다. 가진 것이 많은데 손님만 모르고 계셨어요. 올해는 벌이는 해가 맞습니다."
          : "트인 데와 막힌 데가 반반입니다. 반반인 해는 고르는 해입니다. 둘 다 쥐려 하시면 둘 다 놓칩니다."),
      []
    ));
    out.push(c);
  }

  return out;
}

/* 무료로 보여 줄 범위 — 첫 두 장의 앞부분만 열고 나머지는 봉인합니다. */
function sealCheop(list){
  return list.map(c=>{
    if (!c.free) return Object.assign({}, c, {
      sealed:true, body:[], ev:c.ev.slice(0,1), si:null, act:null, jari:null, gwi:null
    });
    return Object.assign({}, c, {
      sealed:false,
      body: c.body.slice(0, 2),
      more: c.body.length - 2,
      si: null
    });
  });
}
