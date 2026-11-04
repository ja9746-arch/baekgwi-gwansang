/* 백귀관상 — 배경음
   음원이 있으면 그것을 깔고, 없거나 못 열면 그 자리에서 소리를 지어냅니다.
   지어내는 소리는 낮은 북 같은 울림과 멀리서 도는 종, 그 위에 아주 옅은 장단입니다.
   잡음(스스스)은 넣지 않았습니다. 처음에는 꺼져 있습니다.

   음원은 손님이 소리를 켜실 때 비로소 받습니다(preload="none").
   끝까지 안 켜시는 분은 한 바이트도 안 받습니다 — 그래서 들머리가 안 느려집니다. */
const Sound = (function(){
  const 음원길 = { webm: "snd/bgm.webm", mp3: "snd/bgm.mp3" };

  let ctx=null, master=null, bus=null, lp=null, fileGain=null;
  let on=false, timer=null, beat=null;
  let el=null, 음원섰나=false, 음원틀렸나=false, 지어냈나=false;

  function 판짜기(){
    ctx = new (window.AudioContext||window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    /* 낮은 쪽으로 거르는 것은 지어내는 소리에만 겁니다.
       녹음된 음원까지 걸면 이불 쓴 것처럼 먹먹해집니다. */
    bus = ctx.createGain();
    lp = ctx.createBiquadFilter();
    lp.type="lowpass"; lp.frequency.value=900; lp.Q.value=0.6;
    bus.connect(lp).connect(master);

    fileGain = ctx.createGain();
    fileGain.gain.value = 0.9;
    fileGain.connect(master);
  }

  /* ── 지어내는 소리 ─────────────────────────── */
  function 지어내기(){
    if (지어냈나) return;
    지어냈나 = true;
    /* 깔리는 울림 — 다섯 음을 아주 조금씩 어긋나게 겹칩니다 */
    const root=110;                                  /* 라 */
    [1, 1.5, 2, 3, 4].forEach((mul,i)=>{
      const o=ctx.createOscillator(), g=ctx.createGain();
      o.type = i<2 ? "sine" : "triangle";
      o.frequency.value = root*mul;
      o.detune.value = (i-2)*4;
      g.gain.value = [0.14,0.09,0.05,0.025,0.012][i];
      /* 숨 쉬듯 느리게 오르내립니다 */
      const lfo=ctx.createOscillator(), lg=ctx.createGain();
      lfo.frequency.value = 0.045 + i*0.012;
      lg.gain.value = g.gain.value*0.55;
      lfo.connect(lg).connect(g.gain);
      lfo.start();
      o.connect(g).connect(bus); o.start();
    });
  }

  /* 멀리서 도는 종 */
  function bell(){
    if(!ctx || !on || !지어냈나) return;
    const t=ctx.currentTime;
    const base=[220,277.18,329.63,440][Math.floor(Math.random()*4)];
    [1,2.02].forEach((m,k)=>{
      const o=ctx.createOscillator(), g=ctx.createGain();
      o.type="sine"; o.frequency.value=base*m;
      g.gain.setValueAtTime(0,t);
      g.gain.linearRampToValueAtTime(k?0.018:0.034, t+0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t+4.5);
      o.connect(g).connect(bus); o.start(t); o.stop(t+4.7);
    });
  }
  /* 아주 옅은 장단 — 가죽 북을 멀리서 두드리는 정도 */
  function tap(){
    if(!ctx || !on || !지어냈나) return;
    const t=ctx.currentTime;
    const o=ctx.createOscillator(), g=ctx.createGain();
    o.type="sine"; o.frequency.setValueAtTime(96,t);
    o.frequency.exponentialRampToValueAtTime(52,t+0.18);
    g.gain.setValueAtTime(0.055,t);
    g.gain.exponentialRampToValueAtTime(0.0001,t+0.4);
    o.connect(g).connect(bus); o.start(t); o.stop(t+0.45);
  }
  function 장단시작(){
    clearInterval(timer); clearInterval(beat);
    timer=setInterval(()=>{ if(Math.random()<0.55) bell(); }, 11000);
    beat =setInterval(tap, 2400);
    setTimeout(bell, 900);
  }

  /* ── 음원 ──────────────────────────────────── */
  function 음원고르기(){
    const a = document.createElement("audio");
    const opus = a.canPlayType && a.canPlayType('audio/webm; codecs="opus"');
    return (opus === "probably" || opus === "maybe") ? 음원길.webm : 음원길.mp3;
  }
  /* 섰으면 true, 아직 없거나 못 열면 false. 한 번 틀리면 다시 안 건드립니다. */
  function 음원틀기(){
    return new Promise((끝)=>{
      if (음원틀렸나) return 끝(false);
      if (음원섰나){ el.play().then(()=>끝(true)).catch(()=>끝(false)); return; }
      let 끝났나 = false;
      const 마침 = (v)=>{ if(끝났나) return; 끝났나 = true; 끝(v); };
      const 틀림 = ()=>{ 음원틀렸나 = true; try{ if(el) el.pause(); }catch(e){} 마침(false); };
      try{
        el = new Audio();
        el.loop = true;
        el.preload = "none";
        el.src = 음원고르기();
        el.addEventListener("error", 틀림, { once:true });
        /* 404 를 늦게 알려 주는 기기가 있습니다. 세 셈을 넘기면 지어내는 쪽으로 갑니다. */
        const 지킴 = setTimeout(틀림, 3000);
        el.addEventListener("playing", ()=>{ clearTimeout(지킴); 음원섰나 = true; 마침(true); }, { once:true });
        const s = ctx.createMediaElementSource(el);
        s.connect(fileGain);
        const p = el.play();
        if (p && p.catch) p.catch(()=>{ clearTimeout(지킴); 틀림(); });
      }catch(e){ 틀림(); }
    });
  }

  function start(){
    try{
      if(!ctx) 판짜기();
      if(ctx.state==="suspended") ctx.resume();
      on=true;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.5, ctx.currentTime+2.2);
      음원틀기().then(섰나=>{
        if (!on) { try{ if(el) el.pause(); }catch(e){} return; }  /* 사이에 끄셨으면 그만둡니다 */
        if (섰나) return;                                         /* 음원이 섰으면 지어내지 않습니다 */
        지어내기(); 장단시작();
      });
      return true;
    }catch(e){ return false; }
  }
  function stop(){
    on=false;
    clearInterval(timer); clearInterval(beat);
    try{ if(el) el.pause(); }catch(e){}
    try{ master.gain.cancelScheduledValues(ctx.currentTime);
         master.gain.linearRampToValueAtTime(0, ctx.currentTime+0.8); }catch(e){}
    /* 소리를 줄이기만 하면 울림통은 계속 돕니다. 전화기에서는 그것만으로도
       배터리가 답니다. 다 줄어든 뒤에 울림통을 재웁니다 — 다시 켜면 깹니다. */
    setTimeout(()=>{ try{ if(!on && ctx && ctx.state === "running") ctx.suspend(); }catch(e){} }, 1000);
  }
  return {
    toggle(){ if(on){ stop(); return false; } return start(); },
    get on(){ return on; },
    stop
  };
})();
