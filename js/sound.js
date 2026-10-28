/* 백귀관상 — 배경음
   파일을 받지 않고 그 자리에서 소리를 지어냅니다.
   낮은 북소리 같은 울림과 멀리서 도는 종, 그 위에 아주 옅은 장단.
   잡음(스스스)은 넣지 않았습니다. 처음에는 꺼져 있습니다. */
const Sound = (function(){
  let ctx=null, bus=null, on=false, timer=null, beat=null;

  function build(){
    ctx = new (window.AudioContext||window.webkitAudioContext)();
    bus = ctx.createGain();
    bus.gain.value = 0;
    const lp = ctx.createBiquadFilter();
    lp.type="lowpass"; lp.frequency.value=900; lp.Q.value=0.6;
    bus.connect(lp).connect(ctx.destination);

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
    return ctx;
  }

  /* 멀리서 도는 종 */
  function bell(){
    if(!ctx || !on) return;
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
    if(!ctx || !on) return;
    const t=ctx.currentTime;
    const o=ctx.createOscillator(), g=ctx.createGain();
    o.type="sine"; o.frequency.setValueAtTime(96,t);
    o.frequency.exponentialRampToValueAtTime(52,t+0.18);
    g.gain.setValueAtTime(0.055,t);
    g.gain.exponentialRampToValueAtTime(0.0001,t+0.4);
    o.connect(g).connect(bus); o.start(t); o.stop(t+0.45);
  }

  function start(){
    try{
      if(!ctx) build();
      if(ctx.state==="suspended") ctx.resume();
      on=true;
      bus.gain.cancelScheduledValues(ctx.currentTime);
      bus.gain.linearRampToValueAtTime(0.5, ctx.currentTime+2.2);
      clearInterval(timer); clearInterval(beat);
      timer=setInterval(()=>{ if(Math.random()<0.55) bell(); }, 11000);
      beat =setInterval(tap, 2400);
      setTimeout(bell, 900);
      return true;
    }catch(e){ return false; }
  }
  function stop(){
    on=false;
    clearInterval(timer); clearInterval(beat);
    try{ bus.gain.cancelScheduledValues(ctx.currentTime);
         bus.gain.linearRampToValueAtTime(0, ctx.currentTime+0.8); }catch(e){}
  }
  return {
    toggle(){ if(on){ stop(); return false; } return start(); },
    get on(){ return on; },
    stop
  };
})();
