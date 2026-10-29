/* Use the user-supplied artwork as the scene, with real controls above it. */
const referenceIntro=$('s-intro');
referenceIntro.innerHTML=`<div class="reference-entrance"><img src="img/reference/entrance.webp" alt="백귀관상. 원안법사의 비밀 관상소. 얼굴에는 자네가 살아온 흔적이 남아 있지. 어서 오시게. 거울 앞에 앉아보시게나. 자네 얼굴에 새겨진 이야기를 하나씩 읽어드리지." fetchpriority="high"><button class="entry-hit" aria-label="원안법사에게 얼굴 보이기">원안법사에게 얼굴 보이기</button></div><div class="reference-legal">사진은 이 브라우저에서만 사용합니다.<br><button data-page="s-legal">이용안내</button> · <button data-page="s-privacy">사진 개인정보</button></div>`;
referenceIntro.querySelector('.entry-hit').onclick=()=>go('s-ask');
referenceIntro.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>go(b.dataset.page));
const captureScene=document.createElement('div');captureScene.className='reference-capture';
const captureControls=document.createElement('div');captureControls.className='capture-controls';
const mirrorScreen=$('s-mirror');mirrorScreen.append(captureScene);
captureScene.append($('mirror'));
const order=$('order'),zoom=$('zoomRow');captureScene.append(zoom,order,captureControls);
['getrow','shotLive','shot','redo'].forEach(id=>captureControls.append($(id)));
const captureNote=document.createElement('p');captureNote.className='capture-note';captureNote.textContent='정면 · 밝은 곳 · 얼굴을 가리지 않은 사진을 선택해 주세요. 사진은 관상도 표시를 위해 이 브라우저에서만 사용하며, 창을 닫으면 원본은 사라집니다.';mirrorScreen.append(captureNote);
$('mirrorHint').hidden=true;
referenceIntro.querySelector('.entry-hit').onclick=()=>go('s-mirror');
const traditionalDetails=document.createElement('details');traditionalDetails.innerHTML='<summary>전통 연령표 정보 입력 (선택)</summary>';
traditionalDetails.append($('s-ask').querySelector('.fields'));captureScene.append(traditionalDetails);
