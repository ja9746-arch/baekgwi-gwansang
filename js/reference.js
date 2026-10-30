/* Unified scenes are cropped directly from the supplied screen reference. */
const referenceIntro=$('s-intro');
referenceIntro.innerHTML=`<div class="unified-entrance"><header class="scene-brand"><span>백귀관상</span><small>원안법사의 비밀 관상소</small></header><div class="entrance-art" role="img" aria-label="원안법사가 손을 내미는 관상소. 얼굴에는 자네가 살아온 흔적이 남아 있지."></div><div class="entrance-content"><h1 class="visually-hidden">얼굴에는 자네가 살아온 흔적이 남아 있지.</h1><p class="welcome-speech">어서 오시게.<br>거울 앞에 앉아보시게나.<br>자네 얼굴에 새겨진 이야기를<br>하나씩 읽어드리지.</p><button class="art-button entry-hit">원안법사에게 얼굴 보이기 <span aria-hidden="true">→</span></button><p class="entry-note">내 얼굴을 비추고, 직접 눌러 펼치는 관상첩</p></div></div><div class="reference-legal"><p>사진은 이 브라우저에서만 사용합니다.</p><button data-page="s-legal">이용안내</button> · <button data-page="s-privacy">사진 개인정보</button></div>`;
referenceIntro.querySelector('.entry-hit').onclick=()=>go('s-mirror');
referenceIntro.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>go(b.dataset.page));
const mirrorScreen=$('s-mirror');mirrorScreen.querySelector('.character-scene').remove();
mirrorScreen.querySelector('.kick').outerHTML='<header class="capture-heading"><p>청동거울 앞에서</p><h1>거울에 자네의 얼굴을 비춰보시게.</h1></header>';
const captureScene=document.createElement('div');captureScene.className='capture-scene';
captureScene.innerHTML='<div class="mirror-surface"><canvas id="mirrorPhoto" width="660" height="820" hidden aria-label="선택한 얼굴 사진"></canvas><div id="mirrorPrompt"><span aria-hidden="true">◎</span><p>정면을 바라봐 주세요.</p><small>아래에서 촬영하거나 사진을 선택하세요.</small></div></div>';
mirrorScreen.querySelector('.capture-heading').after(captureScene);
// The proven capture coordinate system remains independent of the scene artwork.
const logicalCapture=document.createElement('div');logicalCapture.className='logical-capture';logicalCapture.setAttribute('aria-hidden','true');logicalCapture.append($('mirror'));captureScene.append(logicalCapture);
const help=document.createElement('div');help.className='capture-help';help.innerHTML='<span>정면</span><span>밝은 곳</span><span>가림 없이</span>';captureScene.after(help);
const controls=document.createElement('div');controls.className='capture-controls';help.after(controls);controls.append($('order'),$('zoomRow'));['getrow','shotLive','shot','redo'].forEach(id=>controls.append($(id)));
const details=document.createElement('details');details.className='traditional-details';details.innerHTML='<summary>전통 연령표 정보 (선택)</summary>';details.append($('s-ask').querySelector('.fields'));controls.after(details);
$('mirrorHint').textContent='사진은 관상도 표시를 위해 이 브라우저에서만 사용합니다. 서버에 전송하지 않으며, 창을 닫으면 원본 사진은 사라집니다.';
$('live').textContent='사진 촬영';$('pickLbl').textContent='앨범에서 선택';$('shot').textContent='이 얼굴로 관상 보기';$('redo').textContent='다시 선택';
['pickLbl','redo'].forEach(id=>{const label=$(id);label.setAttribute('role','button');label.tabIndex=0;label.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('filePick').click();}});});
let mirrorLastState='';
function renderMirrorPhoto(){
 if($('s-mirror').hidden||document.hidden)return;
 const source=(!vid.hidden&&vid.readyState>=2)?vid:phM;
 const ready=source===vid?source.videoWidth:(!source.hidden&&source.complete&&source.naturalWidth);
 $('mirrorPrompt').hidden=!!ready;$('mirrorPhoto').hidden=!ready;if(!ready){mirrorLastState='';return;}
 const key=[S.url,S.x,S.y,S.scale,source.naturalWidth,source.naturalHeight].join('|');if(source!==vid&&key===mirrorLastState)return;mirrorLastState=key;
 const r=hole.getBoundingClientRect();const c=captureMirror(source,S,r.width,r.height);if(!c)return;
 const ctx=$('mirrorPhoto').getContext('2d');ctx.clearRect(0,0,660,820);
 ctx.drawImage(c,c.width*FX/100,c.height*FY/100,c.width*FW/100,c.height*FH/100,0,0,660,820);
}
setInterval(renderMirrorPhoto,180);
let mirrorDrag=null;
const surface=captureScene.querySelector('.mirror-surface');
surface.addEventListener('pointerdown',e=>{if(!S.url&&!stream)return;mirrorDrag={x:e.clientX,y:e.clientY,sx:S.x,sy:S.y};surface.setPointerCapture(e.pointerId);});
surface.addEventListener('pointermove',e=>{if(!mirrorDrag)return;const r=surface.getBoundingClientRect();S.x=mirrorDrag.sx+(e.clientX-mirrorDrag.x)/r.width*FW;S.y=mirrorDrag.sy+(e.clientY-mirrorDrag.y)/r.height*FH;layout(stream?vid:phM,hole);unlock();renderMirrorPhoto();});
['pointerup','pointercancel'].forEach(ev=>surface.addEventListener(ev,()=>mirrorDrag=null));
