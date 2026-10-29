/* Independent scene background, real content and independent functional controls. */
const referenceIntro=$('s-intro');
referenceIntro.innerHTML=`<div class="entrance-scene"><div class="entrance-content"><img class="intro-logo" src="img/title.webp" alt="백귀관상" fetchpriority="high"><p class="intro-subtitle">원안법사의 비밀 관상소</p><h1>얼굴에는<br>자네가 살아온 흔적이<br>남아 있지.</h1><div class="welcome-speech">어서 오시게.<br>거울 앞에 앉아보시게나.<br>자네 얼굴에 새겨진 이야기를<br>하나씩 읽어드리지.</div><button class="art-button entry-hit">원안법사에게 얼굴 보이기 <span aria-hidden="true">→</span></button><p class="entry-note">내 얼굴을 비추고, 직접 눌러 펼치는 관상첩</p></div></div><div class="reference-legal"><p>사진은 이 브라우저에서만 사용합니다.</p><button data-page="s-legal">이용안내</button> · <button data-page="s-privacy">사진 개인정보</button></div>`;
referenceIntro.querySelector('.entry-hit').onclick=()=>go('s-mirror');
referenceIntro.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>go(b.dataset.page));
const mirrorScreen=$('s-mirror');
mirrorScreen.querySelector('.character-scene').remove();
mirrorScreen.querySelector('.kick').outerHTML='<header class="capture-heading"><p>청동거울 앞에서</p><h1>거울에 자네의 얼굴을<br>비춰보시게.</h1></header>';
const captureScene=document.createElement('div');captureScene.className='capture-scene';mirrorScreen.querySelector('.capture-heading').after(captureScene);captureScene.append($('mirror'));
const captureHelp=document.createElement('div');captureHelp.className='capture-help';captureHelp.innerHTML='<span>정면</span><span>밝은 곳</span><span>가림 없이</span>';captureScene.after(captureHelp);
const captureControls=document.createElement('div');captureControls.className='capture-controls';captureHelp.after(captureControls);
captureControls.append($('order'),$('zoomRow'));['getrow','shotLive','shot','redo'].forEach(id=>captureControls.append($(id)));
const details=document.createElement('details');details.className='traditional-details';details.innerHTML='<summary>전통 연령표 정보 (선택)</summary>';details.append($('s-ask').querySelector('.fields'));captureControls.after(details);
$('mirrorHint').textContent='사진은 관상도 표시를 위해 이 브라우저에서만 사용합니다. 서버에 전송하지 않으며, 창을 닫으면 원본 사진은 사라집니다.';
$('live').textContent='사진 촬영';$('pickLbl').textContent='앨범에서 선택';$('shot').textContent='이 얼굴로 관상 보기';$('redo').textContent='다시 선택';
