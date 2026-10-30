/* Presentation and product orchestration. Existing capture, fit and reading engine retained. */
const ATELIER_REGIONS=[
 {key:'forehead',name:'이마',palace:'관록궁',x:50,y:20,free:true,subtitle:'처음 세상을 마주하는 자리',story:'전통 관상에서는 이마를 상정으로 나누고 성장의 시기와 사회생활의 출발을 이야기했습니다.',reflection:'지나온 시작들을 떠올려 보세요. 사진 한 장이 그 시간을 대신 설명할 수는 없지만, 기억을 펼치는 계기가 될 수 있습니다.'},
 {key:'brow',name:'눈썹',palace:'형제궁',x:28,y:35,subtitle:'곁에 머무는 사람들의 이야기',story:'눈썹은 형제궁으로 불리며 형제와 동료 등 가까운 관계를 이야기하는 자리에 해당했습니다.',reflection:'가까운 사람과 편안해지는 방식은 얼굴보다 함께 보낸 경험에서 찾을 수 있습니다.'},
 {key:'eyes',name:'눈',palace:'눈의 자리',x:72,y:43,free:true,subtitle:'시선이 머무는 곳',story:'전통 관상에서는 눈의 형태와 시선을 얼굴 전체의 인상을 읽는 중요한 단서로 보았습니다.',reflection:'눈의 인상은 표정과 촬영 순간에 따라 달라집니다. 평소의 내 표정과 지금 사진의 차이를 함께 살펴보세요.'},
 {key:'nose',name:'코',palace:'재백궁',x:50,y:65,free:true,subtitle:'재물이 머무는 자리',story:'전통 관상에서 코는 재백궁, 곧 재물에 관한 이야기를 담는 자리로 불렸습니다.',reflection:'이 이름은 실제 재산이나 수입을 알려주는 지표가 아닙니다. 내가 소중하게 모으고 지키는 것을 떠올리는 이야기로 읽어보세요.'},
 {key:'mouth',name:'입',palace:'입의 자리',x:50,y:80,subtitle:'아직 열리지 않은 이야기',story:'전통 관상에서는 입의 윤곽과 입매를 말과 표현에 연결해 이야기했습니다.',reflection:'사진 속 입매가 실제 말투나 성격을 정해주지는 않습니다. 내가 자주 건네는 말부터 돌아보세요.'},
 {key:'chin',name:'턱',palace:'하정',x:50,y:94,subtitle:'세월이 머무는 자리',story:'턱을 포함한 얼굴 아래쪽은 하정으로 불리며 말년과 안정에 관한 이야기와 연결되었습니다.',reflection:'말년은 정해진 결말이 아닙니다. 앞으로 편안하게 머물고 싶은 삶의 모습을 생각해보세요.'},
 {key:'center',name:'미간',palace:'명궁',x:50,y:32,subtitle:'원안법사가 마지막에 살펴볼 곳',story:'두 눈썹 사이인 인당은 명궁으로 불렸습니다. 여러 부위와 함께 얼굴의 중심을 살피던 자리입니다.',reflection:'한 자리만으로 사람 전체를 설명할 수는 없습니다. 얼굴의 부분과 전체를 오가며 바라보세요.'},
 {key:'ear',name:'귀',palace:'귀의 자리',x:5,y:49,subtitle:'얼굴 바깥에서 이어지는 이야기',story:'전통 관상은 귀의 위치와 윤곽도 얼굴 전체와 함께 살폈습니다.',reflection:'사진에서 귀가 가려졌다면 그 형태를 짐작하지 않습니다. 잘 보이는 사진에서만 함께 확인하세요.'}
];
const ATELIER_CHAPTERS=[
 ['第一帖','타고난 얼굴의 상','전체 인상 · 눈여겨본 세 곳'],['第二帖','재물이 머무는 자리','코 · 이마 · 턱'],['第三帖','인연이 들어오는 얼굴','눈 · 눈썹 · 입'],['第四帖','세상에 보이는 얼굴','사진 속 표정과 내가 느끼는 나'],['第五帖','세월이 머무는 자리','상정 · 중정 · 하정'],['第六帖','얼굴이 가진 힘과 주의점','부분과 전체의 균형'],['第七帖','얼굴 열두 자리','내 얼굴 위에서 펼치는 십이궁'],['第八帖','원안법사의 마지막 밀서','여덟 첩을 닫으며 건네는 편지']
];
const escapeText=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let atelierChapter=0, ritualTimers=[], atelierName="", atelierNote="";
const bookScreen=document.createElement('section');bookScreen.className='screen';bookScreen.id='s-book';bookScreen.hidden=true;
bookScreen.innerHTML='<div class="top"><div class="brand">백귀관상</div><div class="step">나의 관상첩</div></div><div id="bookContent"></div>';
$('stage').append(bookScreen);
const printBook=document.createElement('div');printBook.id='print-book';printBook.hidden=true;document.body.append(printBook);
$('readGo').textContent='내 얼굴 관상도 펼치기';
$('readTag').textContent='내 사진 위의 자리를 눌러 전통 관상 이야기를 발견하세요.';
$('s-pay').querySelector('.kick').textContent='원안법사의 비밀 관상첩';
$('payTimer').textContent='8첩 전체 · 얼굴 열두 자리 · 마지막 밀서';
if(DEMO_CHECKOUT){$('payBtn').textContent='전체 관상첩 미리보기 · 결제 없음';}
$('s-intro').querySelector('.foot').innerHTML='전통 관상을 소재로 한 문화·오락 콘텐츠입니다.<br>사진은 이 브라우저에서만 사용하며 서버로 전송하지 않습니다.';
// Existing result summaries remain local. No original image is persisted.
$('lastNote').innerHTML='';
document.querySelectorAll('.step').forEach(n=>{if(n.textContent.includes('/ 6'))n.textContent=({'s-ask':'입장 준비','s-mirror':'청동거울','s-read':'첫 관상첩','s-board':'나의 관상도','s-pay':'봉인된 기록'})[n.closest('.screen').id]||'관상첩';});
function firstPaper(){return `<div class="paper"><span class="edition">第一帖 · 무료 관상첩</span><h3>타고난 얼굴</h3><h4>첫인상</h4><p>${R?.brightest ? `이 사진에서 상대적으로 밝게 잡힌 곳은 ${escapeText(R.brightest.g.bu)}입니다. ` : ""}이마에서 눈, 코로 시선을 옮겨봅니다. 빛의 차이는 촬영 환경에 영향을 받으며 운의 좋고 나쁨을 뜻하지 않습니다.</p><h4>눈여겨볼 세 곳</h4><p>이마 · 눈 · 코<br>아래 관상도에서 세 자리를 직접 눌러볼 수 있습니다.</p><h4>얼굴의 균형</h4><p>옛 관상은 얼굴을 상정·중정·하정으로 나누어 전체와 부분을 함께 읽었습니다. 사진의 각도에 따라 비율은 달라 보일 수 있습니다.</p><blockquote>“한 곳만 보고 자네를 다 안다고 할 수는 없지.”</blockquote></div>`;}
showReadOut=function(){ $('s-read').querySelector('.character-scene img').src='img/atelier/wonan-invite.webp';$('readOut').innerHTML=firstPaper();$('readGo').hidden=false;$('readOrder').textContent='첫 번째 관상첩이 펼쳐졌네.';saveReading(R); };
startRead=function(){
 ritualTimers.forEach(clearTimeout);ritualTimers=[];go('s-read');const fw=mountFace('faceRead');fw.querySelectorAll('.pt,.scanline').forEach(n=>n.remove());$('readOut').innerHTML='';$('readGo').hidden=true;
 const seq=[ATELIER_REGIONS[0],ATELIER_REGIONS[1],ATELIER_REGIONS[2],ATELIER_REGIONS[3],ATELIER_REGIONS[4],ATELIER_REGIONS[5]];
 const finish=()=>{ritualTimers.forEach(clearTimeout);$('ritualSkip')?.remove();showReadOut();};
 const skip=document.createElement('button');skip.id='ritualSkip';skip.className='btn ghost';skip.textContent='연출 건너뛰기';skip.onclick=finish;$('readOut').before(skip);
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){finish();return;}
 seq.forEach((a,i)=>ritualTimers.push(setTimeout(()=>{ $('readOrder').textContent=a.name+'의 자리를 살펴보겠네.';const b=document.createElement('button');b.className='pt';b.style.left=px(a.x)+'%';b.style.top=py(a.y)+'%';b.innerHTML='<i></i>';b.setAttribute('aria-label',a.name);b.onclick=()=>{$('readTag').textContent=a.name+' · '+a.subtitle;};fw.append(b);},i*600)));
 ritualTimers.push(setTimeout(finish,3900));
};
function regionPanel(a){return `<div class="paper map-panel"><button class="close" aria-label="풀이 닫기" onclick="document.getElementById('boardHead').innerHTML=''">×</button><span class="edition">${a.name} · ${a.palace}</span><h3>${a.subtitle}</h3><h4>사진에서 살펴볼 특징</h4><p>표시된 ${a.name}의 윤곽과 주변 부위의 간격을 확인해 보세요. 가려진 부분은 해석하지 않습니다.</p><h4>전통 관상 이야기</h4><p>${a.story}</p><h4>오늘의 언어로 읽기</h4><p>${a.reflection}</p><blockquote>“자네의 얼굴은 이야기의 시작이지, 정해진 답은 아니네.”</blockquote></div>`;}
buildBoard=function(palaces=false){
 const fw=mountFace('faceBoard');fw.querySelectorAll('.pt,.mole').forEach(n=>n.remove());$('boardTitle').innerHTML='내 얼굴이<br>하나의 관상도가 된다.';$('s-board').querySelector('.kick').textContent=palaces?'第七帖 · 얼굴 열두 자리':'살아있는 관상도';$('boardHint').textContent='사진 위의 가는 표시 또는 아래 부위 이름을 눌러보세요.';$('boardHead').innerHTML='';$('gungs').innerHTML='';
 let tabs=document.getElementById('faceTabs');if(!tabs){tabs=document.createElement('div');tabs.id='faceTabs';tabs.className='face-tabs';$('boardHint').after(tabs);}tabs.innerHTML='';
 const areas=palaces?R.jari.map(j=>({key:j.g.k,name:j.g.n,palace:j.g.h,x:j.g.x,y:j.g.y,subtitle:j.g.bu,story:`전통 십이궁에서 ${j.g.n}은 ${j.g.bu} 부근에 놓입니다. 시대와 문헌에 따라 구분은 달라질 수 있습니다.`,reflection:'이 도표는 전통 관상의 위치를 알아보는 안내입니다. 질병·성격·재산이나 미래를 판정하지 않습니다.'})):ATELIER_REGIONS;
 areas.forEach(a=>{const tap=()=>{fw.querySelectorAll('.pt').forEach(p=>p.classList.toggle('sel',p.dataset.region===a.key));tabs.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.region===a.key));if(!S.paid&&!a.free){$('boardHead').innerHTML=`<div class="paper"><span class="seal-label">아직 펼치지 않은 기록</span><h3>${a.name} · ${a.subtitle}</h3><p>${a.story}</p><div class="locked-preview" aria-hidden="true"><p>다른 자리와 함께 읽는 관상 이야기. 여러 부분이 이어져 하나의 기록이 됩니다.</p></div><p>“앞에서 본 자리들과 함께 놓고 봐야 하거든.”</p><button class="btn" onclick="go('s-pay')">봉인된 관상첩 살펴보기</button></div>`;}else $('boardHead').innerHTML=regionPanel(a);$('boardHead').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});};
 const dot=document.createElement('button');dot.className='pt';dot.dataset.region=a.key;dot.style.left=px(a.x)+'%';dot.style.top=py(a.y)+'%';dot.setAttribute('aria-label',a.name+(S.paid||a.free?' 풀이':' 봉인된 이야기'));dot.innerHTML='<i></i>';dot.onclick=tap;fw.append(dot);
 const tab=document.createElement('button');tab.dataset.region=a.key;tab.innerHTML=a.name+(!S.paid&&!a.free?'<span>封</span>':'');tab.onclick=tap;tabs.append(tab);});
 $('boardTail').innerHTML='<button class="btn" onclick="openBook()">'+(S.paid?'내 관상첩 다시 펼치기':'여덟 첩의 이야기 살펴보기')+'</button><button class="btn ghost" onclick="go(\'s-mirror\')">사진 다시 선택</button>';
};
function openBook(){if(!R){go('s-mirror');return;}go('s-book');$('bookContent').innerHTML=`<div class="book-cover"><p>원안법사의 비밀 기록</p><h2>나만의<br>관상첩</h2><span class="seal-label">${S.paid?'개봉 · 여덟 첩':'봉인 · 아직 남은 이야기'}</span><p>얼굴 한 장에서 시작된 여덟 개의 기록</p></div><div class="chapters">${ATELIER_CHAPTERS.map((c,i)=>`<button class="chapter-row" onclick="openChapter(${i})"><span class="number">${String(i+1).padStart(2,'0')}</span><span><strong>${c[1]}</strong><small>${c[2]}</small></span><span class="status">${!i?'무료':S.paid?'펼침':'封'}</span></button>`).join('')}</div><button class="btn ghost" onclick="go('s-board');buildBoard()">내 얼굴 관상도로</button>${S.paid?'<label class="name-field">관상첩에 남길 이름 (선택)<input id="bookName" maxlength="40" placeholder="나의 관상첩" autocomplete="off" oninput="atelierName=this.value"></label><div class="book-actions"><button class="btn ghost" onclick="printAtelier()">관상첩 PDF 저장</button><button class="btn ghost" onclick="shareAtelier()">공유 카드 저장</button></div>':''}`;if($('bookName'))$('bookName').value=atelierName;}
function chapterBody(i){
 if(i===0)return firstPaper();
 const sets={1:[3,0,5],2:[2,1,4],4:[0,3,5],5:[0,2,3]};
 if(sets[i])return `<div class="paper"><span class="edition">${ATELIER_CHAPTERS[i][0]}</span><h3>${ATELIER_CHAPTERS[i][1]}</h3>${sets[i].map(n=>`<h4>${ATELIER_REGIONS[n].name} · ${ATELIER_REGIONS[n].palace}</h4><p>${ATELIER_REGIONS[n].story}</p><p>${ATELIER_REGIONS[n].reflection}</p>`).join('')}<blockquote>“어느 한 자리가 자네의 삶을 결정하지는 않네.”</blockquote></div>`;
 if(i===3)return '<div class="paper"><span class="edition">第四帖</span><h3>세상에 보이는 얼굴</h3><p>사진 속 표정과 스스로 느끼는 나는 얼마나 닮아 있나요? 타인이 실제로 받는 인상을 사진만으로 확정할 수는 없습니다.</p><h4>나의 말로 남기기</h4><label for="selfNote">나는 처음 만난 사람 앞에서</label><textarea id="selfNote" maxlength="300" rows="4" oninput="atelierNote=this.value" placeholder="예: 조용히 듣다가 편해지면 말을 많이 해요." style="width:100%;margin-top:12px;padding:12px;background:#f4ead8;color:#34291f;border:1px solid #9d8661;font:15px/1.7 sans-serif"></textarea><blockquote>“자네 이야기를 들어야 얼굴 너머도 보이지.”</blockquote></div>';
 if(i===7)return '<div class="letter-character"><img src="img/atelier/wonan-letter.webp" alt="밀서를 건네는 원안법사"></div><div class="paper letter"><span class="seal-label">원안법사의 밀서</span><h3>거울 앞에 앉았던 자네에게.</h3><p>이마에서 시작해 눈과 코를 지나, 세월이 머무는 턱까지 함께 살펴보았네.</p><p>옛사람들은 얼굴의 자리마다 이름을 붙이고 그 안에 삶의 이야기를 담았지. 하지만 그 이름이 자네의 삶을 대신 살아주는 것은 아니네.</p><p>오늘 마음에 남은 자리 하나가 있다면, 그곳에 붙은 이야기를 자네의 경험과 견주어 보게. 맞지 않는 것은 내려놓아도 좋네.</p><p>다음에 이 관상첩을 펼칠 때는 얼굴의 정답보다, 오늘의 자네가 남긴 질문을 다시 만나길 바라네.</p><div class="signature">원안법사 <span class="seal-label">圓安</span></div></div>';
 return '';
}
function openChapter(i){if(i>0&&!S.paid){go('s-pay');return;}if(i===6){go('s-board');buildBoard(true);return;}atelierChapter=i;$('bookContent').innerHTML=`<button class="btn ghost" onclick="openBook()">← 여덟 첩 목차</button><div class="chapter-detail">${chapterBody(i)}</div><button class="btn" onclick="${i===7?'openBook()':'openChapter('+(i+1)+')'}">${i===7?'내 관상첩으로':'다음 관상첩 펼치기'}</button>`;if($('selfNote'))$('selfNote').value=atelierNote;if(i===7){const letter=$('bookContent').querySelector('.letter');letter.hidden=true;const seal=document.createElement('button');seal.className='btn';seal.textContent='붉은 봉인 풀기';seal.onclick=()=>{letter.hidden=false;letter.classList.add('unsealed');seal.remove();};letter.before(seal);}window.scrollTo(0,0);}
function printAtlasImage(){
  if(!S.url||!phM.complete||!R)return '';
  const r=hole.getBoundingClientRect();
  const width=r.width||320, height=r.height||width*604/694;
  const original=captureMirror(phM,S,width,height);if(!original)return '';
  const c=document.createElement('canvas');c.width=640;c.height=800;
  const ctx=c.getContext('2d');ctx.fillStyle='#dfc7a1';ctx.fillRect(0,0,640,800);
  const faceWidth=original.width*FW/100,faceHeight=original.height*FH/100;
  const outW=520,outH=outW*faceHeight/faceWidth;
  ctx.drawImage(original,original.width*FX/100,original.height*FY/100,faceWidth,faceHeight,60,35,outW,outH);
  ctx.font='20px serif';ctx.textAlign='center';
  R.jari.forEach((j,i)=>{const x=60+j.g.x/100*outW,y=35+j.g.y/100*outH;ctx.fillStyle='#671f18';ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff3d9';ctx.fillText(String(i+1),x,y-12);});
  return c.toDataURL('image/png');
}
function printAtelier(){
 const name=atelierName.trim()||'나의';const atlas=printAtlasImage();
 printBook.innerHTML=`<article class="print-page print-cover"><img src="img/title.webp" alt="백귀관상"><h1>${escapeText(name)} 관상첩</h1><p>원안법사의 비밀 관상소</p><p>${new Date().toLocaleDateString('ko-KR')}</p><span class="seal-label">圓安 · 원안법사</span><p>전통 관상을 소재로 한 문화적 읽을거리</p></article>`+
 ATELIER_CHAPTERS.map((c,i)=>`<article class="print-page"><h2>${c[0]} · ${c[1]}</h2>${i===6?`${atlas?`<img class="print-atlas" src="${atlas}" alt="내 얼굴 열두 자리 관상도">`:'<p>사진이 없어 관상도를 포함하지 못했습니다.</p>'}<div class="print-palaces">${R.jari.map((j,k)=>`<p>${k+1}. ${escapeText(j.g.n)} · ${escapeText(j.g.bu)}</p>`).join('')}</div>`:i===3?`<div class="paper"><h3>세상에 보이는 얼굴</h3><p>사진 속 표정과 스스로 느끼는 나를 함께 돌아봅니다.</p><h4>내가 남긴 이야기</h4><p>${escapeText(atelierNote||'남긴 이야기가 없습니다.').replace(/\n/g,'<br>')}</p></div>`:chapterBody(i)}</article>`).join('');
 window.print();
}
function shareAtelier(){const c=document.createElement('canvas');c.width=900;c.height=1200;const x=c.getContext('2d');x.fillStyle='#17120f';x.fillRect(0,0,900,1200);x.strokeStyle='#9c8155';x.strokeRect(50,50,800,1100);x.textAlign='center';x.fillStyle='#dbc5a0';x.font='32px serif';x.fillText('원안법사가 먼저 살펴본 세 곳',450,250);x.font='64px serif';x.fillText('이마 · 눈 · 코',450,500);x.font='27px serif';x.fillText('내 얼굴에서 시작된 관상 이야기',450,620);x.fillStyle='#a94c3b';x.fillRect(392,760,116,116);x.fillStyle='#f3e2c5';x.font='38px serif';x.fillText('圓安',450,832);x.font='36px serif';x.fillText('백귀관상',450,1000);x.font='24px serif';x.fillText('원안법사의 비밀 관상소',450,1050);const a=document.createElement('a');a.download='백귀관상-공유카드.png';a.href=c.toDataURL('image/png');a.click();}
// Missing character assets leave the usable scene and controls in place.
document.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>{img.style.visibility='hidden';}));
// One short ritual; remove legacy staged instructions about unmeasured lighting.
runOrders=function(){ritual=true;watchFit(false);if(measureNow()){stopLive();startRead();}};
