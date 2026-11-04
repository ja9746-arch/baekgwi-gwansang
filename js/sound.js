/* 백귀관상 — 배경음
   음원이 있으면 그것을 깔고, 없거나 못 열면 그 자리에서 소리를 지어냅니다.
   지어내는 소리는 낮은 북 같은 울림과 멀리서 도는 종, 그 위에 아주 옅은 장단입니다.
   잡음(스스스)은 넣지 않았습니다. 처음에는 꺼져 있습니다.

   음원은 손님이 소리를 켜실 때 비로소 받습니다.
   끝까지 안 켜시는 분은 한 바이트도 안 받습니다 — 그래서 들머리가 안 느려집니다.

   되풀이는 <audio loop> 가 아니라 울림통 안에서 돌립니다. <audio> 의 되풀이는
   한 바퀴마다 아주 짧게 숨이 끊기는 기기가 있어, 깔아 두는 소리로는 그 한 번이
   귀에 걸립니다. 울림통은 낱낱의 소리알까지 맞춰 돌려 이음매가 없습니다. */
const Sound = (function(){
  /* 사파리는 webm 을 못 여는 때가 있어 m4a 를 함께 둡니다 */
  const 음원길 = { webm: "snd/bgm.webm", m4a: "snd/bgm.m4a" };

  let ctx=null, master=null, bus=null, lp=null, fileGain=null;
  let on=false, timer=null, beat=null;
  let buf=null, node=null, 음원틀렸나=false, 지어냈나=false;

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
    return (opus === "probably" || opus === "maybe") ? 음원길.webm : 음원길.m4a;
  }
  /* 인코더는 꼬리에 빈 자리를 조금 붙여 둡니다. 그걸 두고 돌리면 한 바퀴마다
     숨이 끊기니, 소리가 실제로 끝나는 데까지만 돌립니다. */
  function 참길이(b){
    try{
      const d = b.getChannelData(0), sr = b.sampleRate, 바닥 = 0.0005;
      let i = d.length - 1;
      while (i > sr && Math.abs(d[i]) < 바닥) i--;
      return Math.max(1, (i + 1) / sr);
    }catch(e){ return b.duration; }
  }
  function 흘리기(){
    try{ if(node){ node.stop(); node.disconnect(); } }catch(e){}
    node = ctx.createBufferSource();
    node.buffer = buf;
    node.loop = true;
    node.loopStart = 0;
    node.loopEnd = 참길이(buf);
    node.connect(fileGain);
    node.start(0, 0);
  }
  /* 섰으면 true, 아직 없거나 못 열면 false. 한 번 틀리면 다시 안 건드립니다. */
  function 음원틀기(){
    return new Promise((끝)=>{
      if (음원틀렸나) return 끝(false);
      if (buf){ 흘리기(); return 끝(true); }
      if (typeof fetch !== "function") { 음원틀렸나 = true; return 끝(false); }
      let 끝났나 = false;
      const 마침 = (v)=>{ if(끝났나) return; 끝났나 = true; 끝(v); };
      const 틀림 = ()=>{ 음원틀렸나 = true; 마침(false); };
      /* 그물이 느릴 때 한없이 기다리지 않습니다 — 여덟 셈을 넘기면 지어냅니다 */
      const 지킴 = setTimeout(틀림, 8000);
      fetch(음원고르기())
        .then(r=> r.ok ? r.arrayBuffer() : Promise.reject(new Error("없음")))
        .then(ab=> new Promise((o,n)=>{
          const p = ctx.decodeAudioData(ab, o, n);
          if (p && p.then) p.then(o, n);          /* 옛 꼴과 새 꼴을 다 받습니다 */
        }))
        .then(b=>{ clearTimeout(지킴);
          if (음원틀렸나 || !on) return 마침(false);
          buf = b; 흘리기(); 마침(true); })
        .catch(()=>{ clearTimeout(지킴); 틀림(); });
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
        if (!on){ try{ if(node){ node.stop(); node.disconnect(); node=null; } }catch(e){} return; }
        if (섰나) return;                        /* 음원이 섰으면 지어내지 않습니다 */
        지어내기(); 장단시작();
      });
      return true;
    }catch(e){ return false; }
  }
  function stop(){
    on=false;
    clearInterval(timer); clearInterval(beat);
    try{ master.gain.cancelScheduledValues(ctx.currentTime);
         master.gain.linearRampToValueAtTime(0, ctx.currentTime+0.8); }catch(e){}
    /* 소리를 줄이기만 하면 울림통은 계속 돕니다. 전화기에서는 그것만으로도
       배터리가 답니다. 다 줄어든 뒤에 음원을 세우고 울림통을 재웁니다. */
    setTimeout(()=>{
      if (on) return;                            /* 사이에 다시 켜셨으면 그냥 둡니다 */
      try{ if(node){ node.stop(); node.disconnect(); node=null; } }catch(e){}
      try{ if(ctx && ctx.state === "running") ctx.suspend(); }catch(e){}
    }, 1000);
  }
  return {
    toggle(){ if(on){ stop(); return false; } return start(); },
    get on(){ return on; },
    stop
  };
})();
