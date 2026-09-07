(() => {
  'use strict';
  const {chapters, clients, sources} = window.QUEST;
  const STORAGE = 'pech-museum-put-pechnika-v1';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const main = $('#main');
  const modal = $('#modal');
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const fresh = () => ({version:1,started:false,current:0,steps:[0,0,0,0,0,0],completed:[],solved:{},work:{},hints:{},mistakes:0,finalAnswers:[null,null,null],finalComplete:false,name:'',sound:false});
  let storageOK = true;
  function read() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE));
      if (!value || value.version !== 1 || !Array.isArray(value.steps) || value.steps.length !== 6 || !value.steps.every(x => Number.isInteger(x) && x >= 0 && x <= 2)) return fresh();
      const result = {...fresh(), ...value};
      result.completed = [...new Set((Array.isArray(value.completed) ? value.completed : []).filter(n => Number.isInteger(n) && n >= 0 && n < 6))];
      result.current = Number.isInteger(value.current) ? Math.max(0, Math.min(6, value.current)) : 0;
      result.solved = value.solved && typeof value.solved === 'object' && !Array.isArray(value.solved) ? value.solved : {};
      result.work = value.work && typeof value.work === 'object' && !Array.isArray(value.work) ? value.work : {};
      result.hints = value.hints && typeof value.hints === 'object' && !Array.isArray(value.hints) ? value.hints : {};
      result.finalAnswers = Array.isArray(value.finalAnswers) && value.finalAnswers.length === 3 ? value.finalAnswers.map(n => [0,1,2].includes(n) ? n : null) : [null,null,null];
      result.name = typeof value.name === 'string' ? value.name.slice(0,32) : '';
      result.mistakes = Number.isFinite(value.mistakes) ? Math.max(0,value.mistakes) : 0;
      result.finalComplete = result.completed.length === 6 && value.finalComplete === true;
      result.current = Math.min(result.current, result.completed.length);
      return result;
    } catch (_) { storageOK = false; return fresh(); }
  }
  let state = read();
  let selected = null;
  let previousFocus = null;
  let audioContext;
  let currentView = 'intro';
  function save() {
    try {localStorage.setItem(STORAGE, JSON.stringify(state));}
    catch (_) {storageOK = false;}
    $('#journal-count').textContent = `${state.completed.length}/6`;
  }
  function announce(text) { $('#announcement').textContent = text; }
  function scrollTop() { main.scrollTop = 0; window.scrollTo({top:0,behavior:'instant'}); }
  function focusHeading() { const heading = $('h1', main); if (heading) {heading.tabIndex = -1; heading.focus({preventScroll:true});} }
  function sound(success = true) {
    if (!state.sound) return;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      audioContext.resume();
      const now = audioContext.currentTime;
      (success ? [523.25,659.25,783.99] : [220]).forEach((freq,i) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type='sine';oscillator.frequency.value=freq;
        gain.gain.setValueAtTime(0,now+i*.07);gain.gain.linearRampToValueAtTime(.045,now+i*.07+.02);gain.gain.exponentialRampToValueAtTime(.001,now+i*.07+.32);
        oscillator.connect(gain);gain.connect(audioContext.destination);oscillator.start(now+i*.07);oscillator.stop(now+i*.07+.33);
      });
    } catch (_) { /* Sound is optional. */ }
  }
  function icon(name) {
    const shapes = {
      stone:'<path d="m4 19 5-9 12-3 8 8-4 11-15 1Z" fill="#a99a79"/><path d="m9 10 8 8 12-3M17 18l-7 9" fill="none"/>',
      clay:'<path d="M9 11q-7 12 2 17h13q9-5 0-17Z" fill="#c38960"/><ellipse cx="16.5" cy="11" rx="8" ry="3" fill="#a86945"/>',
      wood:'<path d="m5 15 17-8 7 7-17 9Z" fill="#ba8653"/><ellipse cx="9" cy="19" rx="5" ry="4" fill="#e0b780"/><path d="m8 26 17-8 5 4-17 8Z" fill="#bb824d"/>',
      straw:'<path d="m7 28 3-24m5 24L14 4m5 24 4-23m2 22 4-17M5 12l20 7M6 19l22 6" stroke="#b79249" stroke-width="2" fill="none"/>',
      bench:'<path d="M4 11h24v9H4Zm3 9v9m18-9v9" fill="#d8c7a7" stroke-width="2"/><path d="M6 8h17v4H6Z" fill="#a74329"/>',
      grip:'<path d="M17 29V14M10 4C3 15 27 20 25 4" fill="none" stroke-width="2.7"/>',
      floor:'<path d="M4 28V14Q16-4 28 14v14Z" fill="#d6c6a8"/><path d="M9 26V16q7-11 14 0v10Z" fill="#4c3c2b"/><path d="M9 24h14" stroke="#db9c52" stroke-width="3"/>'
    };
    return `<svg viewBox="0 0 34 34" aria-hidden="true" fill="none" stroke="#70573c" stroke-width="1.2" stroke-linejoin="round">${shapes[name] || shapes.stone}</svg>`;
  }
  function showDialog(html) {
    previousFocus = document.activeElement;
    $('#modal-content').innerHTML = html;
    if (!modal.open) modal.showModal();
    modal.scrollTop = 0;
    $('#modal-close').focus({preventScroll:true});
  }
  function closeDialog() {modal.close();if (previousFocus?.isConnected) previousFocus.focus({preventScroll:true});}
  $('#modal-close').addEventListener('click',closeDialog);
  modal.addEventListener('click',event => {if (event.target === modal) {const r=modal.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeDialog();}});
  modal.addEventListener('cancel',event => {event.preventDefault();closeDialog();});
  $('#sound').addEventListener('click',() => {state.sound=!state.sound;updateSound();save();sound();});
  function updateSound() {$('#sound').setAttribute('aria-pressed',String(state.sound));$('#sound').setAttribute('aria-label',state.sound?'Выключить звуки':'Включить звуки');$('.sound-mark').textContent=state.sound?'вкл.':'выкл.';}
  $('#journal').addEventListener('click',showJournal);
  function showJournal() {
    showDialog(`<div class="eyebrow">Записки ученика</div><h2 id="modal-title">Дневник печника</h2><p class="modal-intro">${state.completed.length ? `Собрано ${state.completed.length} из 6 знаков. Открытия остаются здесь, чтобы к ним можно было вернуться.` : 'Пройди испытания первой зоны — и здесь появятся твои открытия и первый знак мастерства.'}</p><div class="journal-entries">${chapters.map((chapter,i)=>`<article class="journal-entry ${state.completed.includes(i)?'':'locked'}"><small>${String(i+1).padStart(2,'0')} · ${state.completed.includes(i)?escape(chapter.badge):'Ещё предстоит открыть'}</small><h3>${escape(chapter.title)}</h3><p>${state.completed.includes(i)?escape(chapter.fact):escape(chapter.subject)}</p>${state.completed.includes(i)?`<div class="journal-tools">В коллекции: ${escape(chapter.tool)}</div>`:''}</article>`).join('')}</div><div class="end-actions"><button class="button small" id="sources-link">О музее и источниках</button>${state.started?'<button class="text-link" id="restart-link">Начать путь заново</button>':''}</div>`);
    $('#sources-link').onclick=showSources;
    if($('#restart-link'))$('#restart-link').onclick=confirmRestart;
  }
  function showSources() {
    showDialog(`<div class="eyebrow">За историей — в музей</div><h2 id="modal-title">Шесть зон, одна история</h2><p class="modal-intro">Названия и порядок глав соответствуют шести зонам Музея Печи в Муроме. Сюжет ученика, задания и иллюстрации созданы специально для игры. Рисунки передают принципы устройства, а не точный вид каждого музейного экспоната.</p><p class="modal-intro">Это тематический путь: курные, кирпичные, изразцовые и металлические печи долго существовали одновременно в разных местах. Подписи эпох обозначают контекст, а не универсальные даты изобретения.</p><ol class="source-list">${sources.map(s=>`<li><a href="${escape(s.url)}" target="_blank" rel="noopener noreferrer">${escape(s.title)}</a></li>`).join('')}</ol><div class="modal-hint">Конструкция и тепловые кривые упрощены для игры. Они помогают понять принципы и не являются строительными чертежами. Игра работает без подключения к интернету; ссылки на музей и источники открываются в сети.</div>`);
  }
  function confirmRestart() {
    showDialog('<div class="eyebrow">Новый ученик</div><h2 id="modal-title">Пройти путь заново?</h2><p class="modal-intro">Текущий прогресс и дневник этой игры будут очищены на этом устройстве. Скачанный знак мастера останется у тебя.</p><div class="end-actions"><button id="keep-progress" class="button">Продолжить мой путь</button><button id="reset-progress" class="button primary">Начать заново</button></div>');
    $('#keep-progress').onclick=closeDialog;
    $('#reset-progress').onclick=()=>{const soundPref=state.sound;state=fresh();state.sound=soundPref;save();closeDialog();renderIntro();scrollTop();};
  }
  function renderIntro() {
    currentView='intro';
    main.innerHTML=`<section class="hero"><div><div class="eyebrow">Интерактивный музейный квест</div><h1>Путь<br><em>печника</em></h1><p class="lead">От первого очага до железной печи.<br>Пройди шесть зон музея, собери секреты ремесла и заслужи знак мастера.</p><div class="hero-actions"><button class="button primary" id="begin">${state.started ? (state.finalComplete?'Мой знак мастера':'Продолжить путь') : 'Стать учеником'} <span aria-hidden="true">↗</span></button>${state.started?'<button class="button" id="intro-reset">Заново</button>':''}</div><div class="hero-notes"><span><b>6</b> музейных зон</span><span><b>12</b> испытаний + финал</span><span>В своём темпе</span></div>${state.started?`<p class="save-note">${state.finalComplete?'Путь пройден. Все открытия в дневнике.':`Твой прогресс: ${state.completed.length} из 6 знаков.`}</p>`:''}</div><div class="hero-picture"><img src="assets/russian-stove.svg" alt="Авторская иллюстрация русской печи с лежанкой, горнилом и печной утварью"><div class="hero-stamp"><span>ОТ УЧЕНИКА</span><strong>6</strong><span>ШАГОВ К МАСТЕРУ</span></div><p class="picture-caption">История тепла — в твоих руках</p></div></section><section class="route-preview"><div class="section-heading"><h2>Твой маршрут</h2><p>По шести зонам Музея Печи</p></div><div class="route-cards">${chapters.map((c,i)=>`<article class="route-card"><span>${String(i+1).padStart(2,'0')}</span><h3>${escape(c.title)}</h3><p>${escape(c.subject)}</p></article>`).join('')}</div><div class="route-bottom"><span>Нажимай, собирай, пробуй ещё раз.<br>${storageOK?'Прогресс сохраняется в этом браузере.':'Сохранение недоступно; можно пройти игру, не закрывая вкладку.'}</span><button class="text-link" id="about-quest">О музее и источниках ↗</button></div></section>`;
    $('#begin').onclick=()=>{state.started=true;save();state.finalComplete?renderCertificate():openChapter(state.current);};
    if($('#intro-reset'))$('#intro-reset').onclick=confirmRestart;
    $('#about-quest').onclick=showSources;
  }
  function openChapter(index) {
    if(index===6){renderFinal();return;}
    if(index<0||index>5||index>state.completed.length)return;
    state.current=index;state.started=true;selected=null;save();renderChapter();scrollTop();focusHeading();
  }
  function renderChapter() {
    currentView='chapter';
    const i=state.current,c=chapters[i];
    const rank=state.completed.length===6?'Мастер печного дела':state.completed.length>=3?'Подмастерье':'Ученик печника';
    main.innerHTML=`<div class="quest-shell"><aside class="sidebar"><div class="sidebar-caption">Карта твоего пути</div><nav class="chapter-nav" aria-label="Зоны квеста">${chapters.map((chapter,n)=>`<button class="chapter-link ${n===i?'active':''} ${state.completed.includes(n)?'complete':''}" data-chapter="${n}" ${n>state.completed.length?'disabled':''} ${n===i?'aria-current="step"':''} aria-label="${n+1}. ${escape(chapter.title)}${state.completed.includes(n)?', пройдено':''}"><span class="number">${state.completed.includes(n)?'✓':String(n+1).padStart(2,'0')}</span><span class="nav-name">${escape(chapter.title)}</span></button>`).join('')}</nav><div class="rank-box"><small>Твоё мастерство</small><strong>${rank}</strong><div class="rank-progress" role="progressbar" aria-label="Пройденные зоны" aria-valuemin="0" aria-valuemax="6" aria-valuenow="${state.completed.length}"><i style="width:${state.completed.length/6*100}%"></i></div><p>${state.completed.length} из 6 знаков собрано</p></div></aside><section class="chapter-main"><div class="chapter-top"><div class="eyebrow">Зона ${String(i+1).padStart(2,'0')} / 06</div><span class="era">${escape(c.era)}</span></div><h1>${escape(c.title)}</h1><div class="chapter-layout"><div class="story-column"><div class="scene-panel"><div class="scene-caption">${escape(c.subject)}</div><img src="assets/${c.art}.svg" alt="${escape(c.subject)} — учебная иллюстрация"><span class="scene-label">Музейная история · ${i+1}</span></div><div class="mentor"><span class="mentor-mark" aria-hidden="true">п</span><p><b>Из записок старого мастера</b>${escape(c.mentor)}</p></div><div class="museum-note"><b>В музее</b>${escape(c.museum)}</div></div><div id="task-area"></div></div></section></div>`;
    $$('[data-chapter]').forEach(button=>button.onclick=()=>openChapter(Number(button.dataset.chapter)));
    renderTask();
  }
  const taskKey=()=>`${state.current}-${state.steps[state.current]}`;
  function taskWork(task,key) {
    let work=state.work[key];
    const validArray=(a,length,valid)=>Array.isArray(a)&&a.length===length&&a.every(valid);
    if(!work||typeof work!=='object'||Array.isArray(work))work={};
    if(task.type==='match'&&!validArray(work.slots,task.slots.length,v=>v===null||task.items.some(i=>i.id===v)))work.slots=task.slots.map(()=>null);
    if(task.type==='order'&&!validArray(work.order,task.answer.length,v=>v===null||task.answer.includes(v)))work.order=task.answer.map(()=>null);
    if(task.type==='classify'&&!validArray(work.answers,task.statements.length,v=>v===null||['fact','belief'].includes(v)))work.answers=task.statements.map(()=>null);
    if(task.type==='mosaic'&&!validArray(work.rotations,4,v=>Number.isInteger(v)&&v>=0&&v<4))work.rotations=[1,3,2,1];
    if(task.type==='brick'&&!validArray(work.rows,4,v=>v===0||v===1))work.rows=[0,0,0,0];
    if(task.type==='pipes'&&!validArray(work.rotations,9,v=>Number.isInteger(v)&&v>=0&&v<4))work.rotations=[0,1,1,1,1,0,1,2,0];
    if(['choice','heat'].includes(task.type)&&!task.options.some((_,i)=>i===work.choice))work.choice=null;
    if(task.type==='heat'){work.time=Number.isFinite(work.time)?Math.max(0,Math.min(100,work.time)):0;work.explored=Boolean(work.explored);}
    state.work[key]=work;return work;
  }
  function renderTask() {
    const c=chapters[state.current],step=state.steps[state.current];
    if(step>=2){renderReward();return;}
    const task=c.tasks[step],key=taskKey(),work=taskWork(task,key),done=Boolean(state.solved[key]);
    $('#task-area').innerHTML=`<section class="task-panel"><div class="task-heading"><span>Испытание ${step+1} из 2</span><div class="task-dots" aria-hidden="true"><i class="${step>0||done?'done':''}"></i><i class="${step===1&&done?'done':''}"></i></div></div><h2>${escape(task.title)}</h2><p class="task-description">${escape(task.description)}</p><div id="puzzle" class="${done?'puzzle-lock':''}" ${done?'inert':''}></div><div id="feedback" ${done?'':'hidden'} class="feedback good" role="status">${done?`<strong>Получилось!</strong>${escape(task.success)}`:''}</div><div class="task-actions">${done?'<span class="earned">Открытие сделано</span><button class="button primary" id="next-step">Дальше <span aria-hidden="true">→</span></button>':'<button class="hint-button" id="hint">✧ Подсказка</button><button class="button primary" id="check">Проверить <span aria-hidden="true">→</span></button>'}</div></section>`;
    drawPuzzle(task,work);
    if(done)$('#next-step').onclick=()=>{
      state.steps[state.current]++;selected=null;
      if(state.steps[state.current]===2&&!state.completed.includes(state.current)){state.completed.push(state.current);sound();announce(`Получен знак: ${c.badge}`);}
      save();renderChapter();
      const target=$('#task-area');target.scrollIntoView({block:'nearest',behavior:'instant'});const button=$('button',target);button?.focus({preventScroll:true});
    };
    else {
      $('#hint').onclick=()=>{state.hints[key]=true;save();feedback(task.hint,'hint','Совет мастера');};
      $('#check').onclick=()=>checkTask(task,work,key);
    }
  }
  function feedback(text,type='wrong',title='Попробуй ещё раз') {
    const el=$('#feedback');el.hidden=false;el.className=`feedback ${type==='wrong'?'':type}`;el.innerHTML=`<strong>${escape(title)}</strong>${escape(text)}`;
  }
  function choiceMarkup(options,chosen,group='option') {
    return `<div class="choice-list">${options.map((text,i)=>`<button class="choice ${chosen===i?'selected':''}" data-${group}="${i}" aria-pressed="${chosen===i}"><span class="letter" aria-hidden="true">${String.fromCharCode(А_CODE+i)}</span><span>${escape(text)}</span></button>`).join('')}</div>`;
  }
  const А_CODE=1040;
  const flower=`<rect width="200" height="200" fill="#f1e4c6"/><rect x="9" y="9" width="182" height="182" rx="2" fill="none" stroke="#68754f" stroke-width="8"/><path d="M24 24h27M24 24v27M176 24h-27M176 24v27M24 176h27M24 176v-27M176 176h-27M176 176v-27" stroke="#a74329" stroke-width="3" fill="none"/><path d="M100 100C24 109 25 44 55 49Q92 49 100 100ZM100 100C91 24 156 25 151 55Q151 92 100 100ZM100 100C176 91 175 156 145 151Q108 151 100 100ZM100 100C109 176 44 175 49 145Q49 108 100 100Z" fill="#a74329" stroke="#813a29" stroke-width="2"/><path d="M100 37q-19 14 0 30 19-16 0-30M163 100q-14-19-30 0 16 19 30 0M100 163q19-14 0-30-19 16 0 30M37 100q14 19 30 0-16-19-30 0" fill="#738355"/><circle cx="100" cy="100" r="13" fill="#d8ad50" stroke="#f3e5c6" stroke-width="5"/>`;
  function drawPuzzle(task,work) {
    const puzzle=$('#puzzle');
    if(task.type==='match') {
      const remaining=task.items.filter(item=>!work.slots.includes(item.id));
      if(!remaining.some(item=>item.id===selected))selected=null;
      puzzle.innerHTML=`<div class="match-slots">${task.slots.map((slot,i)=>{const item=task.items.find(item=>item.id===work.slots[i]);return `<button class="match-slot ${item?'filled':''}" data-slot="${i}" aria-label="${escape(slot.label)}: ${item?escape(item.label):'пусто'}"><span class="slot-label">${escape(slot.label)}</span><span class="slot-value">${item?`${icon(item.icon)}${escape(item.label)}`:'<span class="plus" aria-hidden="true">＋</span>'}</span></button>`;}).join('')}</div><div class="part-pool" aria-label="Материалы и предметы">${remaining.map(item=>`<button class="part ${selected===item.id?'selected':''}" data-part="${item.id}" draggable="true" aria-pressed="${selected===item.id}">${icon(item.icon)}${escape(item.label)}</button>`).join('')}</div>`;
      $$('[data-part]',puzzle).forEach(button=>{
        button.onclick=()=>{selected=selected===button.dataset.part?null:button.dataset.part;drawPuzzle(task,work);$(`[data-part="${button.dataset.part}"]`)?.focus({preventScroll:true});};
        button.ondragstart=event=>{selected=button.dataset.part;event.dataTransfer.setData('text/plain',selected);event.dataTransfer.effectAllowed='move';};
      });
      $$('[data-slot]',puzzle).forEach(button=>{
        const place=item=>{const index=Number(button.dataset.slot);if(item&&remaining.some(part=>part.id===item)){work.slots[index]=item;selected=null;}else if(!item){work.slots[index]=null;}save();drawPuzzle(task,work);$(`[data-slot="${index}"]`)?.focus({preventScroll:true});};
        button.onclick=()=>place(selected);
        button.ondragover=event=>{event.preventDefault();button.classList.add('target');};button.ondragleave=()=>button.classList.remove('target');
        button.ondrop=event=>{event.preventDefault();place(event.dataTransfer.getData('text/plain'));};
      });
    } else if(task.type==='choice') {
      puzzle.innerHTML=choiceMarkup(task.options,work.choice);bindChoices(task,work);
    } else if(task.type==='order') {
      puzzle.innerHTML=`<div class="order-stack">${work.order.map((id,i)=>`<button class="order-slot ${id?'filled':''}" data-order-slot="${i}" aria-label="Шаг ${i+1}: ${escape(task.items.find(item=>item.id===id)?.label||'пусто')}"><b>${i+1}</b><span>${escape(task.items.find(item=>item.id===id)?.label||'Выбери следующую карточку')}</span></button>`).join('')}</div><div class="part-pool">${task.items.filter(item=>!work.order.includes(item.id)).map(item=>`<button class="part" data-order-item="${item.id}">${escape(item.label)}</button>`).join('')}</div>`;
      $$('[data-order-item]').forEach(b=>b.onclick=()=>{const next=work.order.indexOf(null);if(next!==-1)work.order[next]=b.dataset.orderItem;save();drawPuzzle(task,work);$(`[data-order-slot="${next}"]`)?.focus({preventScroll:true});});
      $$('[data-order-slot]').forEach(b=>b.onclick=()=>{work.order[Number(b.dataset.orderSlot)]=null;save();drawPuzzle(task,work);});
    } else if(task.type==='classify') {
      puzzle.innerHTML=`<div class="belief-list">${task.statements.map((statement,i)=>`<div class="belief-row"><p>${escape(statement.text)}</p><div class="segmented" role="group" aria-label="${escape(statement.text)}"><button data-belief="${i}:fact" aria-pressed="${work.answers[i]==='fact'}">Устройство и быт</button><button data-belief="${i}:belief" aria-pressed="${work.answers[i]==='belief'}">Народное поверье</button></div></div>`).join('')}</div>`;
      $$('[data-belief]').forEach(b=>b.onclick=()=>{const [n,value]=b.dataset.belief.split(':');work.answers[Number(n)]=value;save();drawPuzzle(task,work);$(`[data-belief="${n}:${value}"]`)?.focus({preventScroll:true});});
    } else if(task.type==='mosaic') {
      puzzle.innerHTML=`<div class="mosaic-wrap"><div class="mosaic">${work.rotations.map((rotation,i)=>`<button class="mosaic-tile" data-tile="${i}" aria-label="Часть ${i+1}, поворот ${rotation*90} градусов. Повернуть на 90 градусов"><svg viewBox="${i%2*100} ${Math.floor(i/2)*100} 100 100" style="transform:rotate(${rotation*90}deg)" aria-hidden="true">${flower}</svg></button>`).join('')}</div></div><p class="puzzle-note">Каждое нажатие — поворот на 90°</p>`;
      $$('[data-tile]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.tile);work.rotations[i]=(work.rotations[i]+1)%4;save();drawPuzzle(task,work);$(`[data-tile="${i}"]`).focus({preventScroll:true});});
    } else if(task.type==='brick') {
      puzzle.innerHTML=`<div class="brick-wall" aria-label="Четыре ряда кирпичей, нумерация снизу вверх">${work.rows.map((shift,i)=>`<button class="brick-row ${shift?'shifted':''}" data-row="${i}" aria-label="Ряд ${i+1}, ${shift?'со смещением':'без смещения'}. Сдвинуть"><span class="brick-num">${i+1}</span><span class="bricks"></span><span class="rotate" aria-hidden="true">⇄</span></button>`).join('')}</div><p class="puzzle-note">Белые вертикальные линии — швы между кирпичами</p>`;
      $$('[data-row]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.row);work.rows[i]=1-work.rows[i];save();drawPuzzle(task,work);$(`[data-row="${i}"]`).focus({preventScroll:true});});
    } else if(task.type==='pipes') {
      puzzle.innerHTML=`<div class="pipe-board"><span class="pipe-inlet">↑ ВХОД</span><span class="pipe-outlet">ВЫХОД ↑</span><div class="pipe-grid">${work.rotations.map((rotation,i)=>`<button class="pipe-cell" data-pipe="${i}" aria-label="Канал, ряд ${Math.floor(i/3)+1}, столбец ${i%3+1}, ${[0,1,7,8].includes(i)?'угол':'прямой'}, поворот ${rotation*90} градусов"><svg viewBox="0 0 80 80" style="transform:rotate(${rotation*90}deg)" aria-hidden="true"><path d="${[0,1,7,8].includes(i)?'M40 0V40H80':'M40 0V80'}" fill="none" stroke="#514638" stroke-width="21" stroke-linejoin="round"/><path d="${[0,1,7,8].includes(i)?'M40 0V40H80':'M40 0V80'}" fill="none" stroke="#c99356" stroke-width="3" stroke-dasharray="5 6"/></svg></button>`).join('')}</div></div><p class="puzzle-note">Нажми на канал, чтобы повернуть его</p>`;
      $$('[data-pipe]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.pipe);work.rotations[i]=(work.rotations[i]+1)%4;save();drawPuzzle(task,work);$(`[data-pipe="${i}"]`).focus({preventScroll:true});});
    } else if(task.type==='heat') {
      puzzle.innerHTML=`<div class="heat-chart"><svg viewBox="0 0 320 160" role="img" aria-label="Условные кривые тепла: металл быстро нагревается и остывает, кладка медленнее нагревается и дольше сохраняет тепло"><path d="M25 18V130H305" stroke="#aa9778" fill="none"/><path d="M25 45H305M25 85H305" stroke="#ddd0b6"/><path d="M137 18V130" stroke="#c0b098" stroke-dasharray="3 4"/><text x="142" y="20" fill="#756a5c" font-size="8">топка закончена</text><text x="25" y="149" fill="#756a5c" font-size="8">начало</text><text x="258" y="149" fill="#756a5c" font-size="8">остывание</text><path d="M25 125C45 50 63 24 105 26S126 25 137 27C159 78 175 124 305 128" stroke="#a74329" stroke-width="3" fill="none"/><path d="M25 128C65 124 107 85 137 55C157 45 212 61 305 89" stroke="#626e49" stroke-width="3" fill="none"/><line id="heat-cursor" x1="25" x2="25" y1="25" y2="132" stroke="#302821" stroke-width="1" stroke-dasharray="2 3"/></svg><div class="heat-legend"><span>Металл</span><span>Массивная кладка</span></div></div><div class="range-label"><label for="heat-time">Проведи время вперёд</label><span id="heat-phase"></span></div><input class="heat-slider" id="heat-time" type="range" min="0" max="100" value="${work.time}" aria-describedby="heat-readout"><p class="heat-readout" id="heat-readout" aria-live="polite"></p><p class="heat-task">Кто дольше отдаёт тепло после топки?</p>${choiceMarkup(task.options,work.choice)}`;
      updateHeat(work);$('#heat-time').oninput=event=>{work.time=Number(event.target.value);if(work.time>=75)work.explored=true;save();updateHeat(work);};bindChoices(task,work);
    }
  }
  function bindChoices(task,work) {
    $$('[data-option]').forEach(b=>b.onclick=()=>{work.choice=Number(b.dataset.option);save();drawPuzzle(task,work);$(`[data-option="${work.choice}"]`).focus({preventScroll:true});});
  }
  function updateHeat(work) {
    const x=25+work.time*2.8;$('#heat-cursor').setAttribute('x1',x);$('#heat-cursor').setAttribute('x2',x);
    $('#heat-phase').textContent=work.time<40?'Топка':'Остывание';
    $('#heat-readout').textContent=work.time<15?'Начало топки: обе печи ещё набирают тепло.':work.time<40?'Металл быстро нагревается. Массивная кладка набирает тепло постепенно.':work.time<70?'Топка закончилась: металл остывает быстрее, кладка продолжает отдавать тепло.':'Позднее остывание: у массивной кладки ещё остаётся запас тепла.';
  }
  function tracePipes(rotations) {
    const dirs=[[-1,0],[0,1],[1,0],[0,-1]];
    const openings=i=>([0,1,7,8].includes(i)?[0,1]:[0,2]).map(direction=>(direction+rotations[i])%4);
    const visited=[];let cell=6,entry=2;
    for(let count=0;count<10;count++){
      if(visited.includes(cell))return {valid:false,visited};
      const ends=openings(cell);if(!ends.includes(entry))return {valid:false,visited};
      visited.push(cell);const out=ends.find(d=>d!==entry);
      if(cell===2&&out===0)return {valid:visited.length===9,visited};
      const row=Math.floor(cell/3)+dirs[out][0],col=cell%3+dirs[out][1];
      if(row<0||row>2||col<0||col>2)return {valid:false,visited};
      cell=row*3+col;entry=(out+2)%4;
    }
    return {valid:false,visited};
  }
  function checkTask(task,work,key) {
    if(state.solved[key])return;
    let correct=false;
    if(task.type==='match')correct=task.slots.every((slot,i)=>work.slots[i]===slot.answer);
    if(task.type==='choice')correct=work.choice===task.answer;
    if(task.type==='order')correct=task.answer.every((value,i)=>work.order[i]===value);
    if(task.type==='classify')correct=task.statements.every((statement,i)=>work.answers[i]===statement.answer);
    if(task.type==='mosaic')correct=work.rotations.every(n=>n===0);
    if(task.type==='brick')correct=work.rows.every((n,i)=>i===0||n!==work.rows[i-1]);
    if(task.type==='pipes'){const trace=tracePipes(work.rotations);correct=trace.valid;trace.visited.forEach(i=>$(`[data-pipe="${i}"]`).classList.add('flow'));}
    if(task.type==='heat'){
      if(!work.explored){feedback('Передвинь ползунок к правому краю и сравни остывание печей. Затем сделай выбор.','hint','Сначала проведи опыт');return;}
      correct=work.choice===task.answer;
    }
    if(correct){state.solved[key]=true;save();sound();renderTask();$('#next-step').focus({preventScroll:true});announce('Получилось! '+task.success);}
    else{state.mistakes++;save();sound(false);feedback(task.wrong);}
  }
  function renderReward() {
    const c=chapters[state.current];
    $('#task-area').innerHTML=`<section class="chapter-reward"><div class="reward-medal" aria-hidden="true">${state.current+1}</div><div class="earned">Получен знак мастерства</div><h2>${escape(c.badge)}</h2><p class="fact">${escape(c.fact)}</p><div class="earned-tool">В коллекцию добавлено:<br><b>${escape(c.tool)}</b></div><button class="button primary" id="next-chapter">${state.current===5?'К испытанию мастера':'В следующую зону'} <span aria-hidden="true">→</span></button><button class="hint-button" id="reward-journal">Записано в дневник ↗</button></section>`;
    $('#next-chapter').onclick=()=>openChapter(state.current+1);$('#reward-journal').onclick=showJournal;
  }
  function renderFinal() {
    if(state.completed.length<6){openChapter(state.completed.length);return;}
    if(state.finalComplete){renderCertificate();return;}
    currentView='final';state.current=6;save();
    main.innerHTML=`<section class="final-page"><header class="final-head"><div class="eyebrow">Последнее испытание</div><h1>Три заказа мастеру</h1><p>Все шесть знаков у тебя. Теперь примени знания: подбери печь под жизнь её хозяев.</p></header><div class="client-grid">${clients.map((client,i)=>`<article class="client-card"><img src="assets/${client.art}.svg" alt="" aria-hidden="true"><div class="eyebrow">Заказ ${i+1}</div><h2>${escape(client.title)}</h2><p>${escape(client.text)}</p><div id="client-${i}">${choiceMarkup(client.options,state.finalAnswers[i],`client-${i}`)}</div><div id="client-feedback-${i}" class="feedback" hidden></div></article>`).join('')}</div><div class="final-action"><button class="button primary" id="final-check">Представить решения <span aria-hidden="true">→</span></button><div id="final-feedback" class="feedback" role="status" hidden></div><p class="save-note">Задача мастера — услышать хозяина и понять условия.</p></div></section>`;
    clients.forEach((client,i)=>$$(`[data-client-${i}]`).forEach(b=>b.onclick=()=>{state.finalAnswers[i]=Number(b.getAttribute(`data-client-${i}`));save();$$(`[data-client-${i}]`).forEach(option=>{const on=Number(option.getAttribute(`data-client-${i}`))===state.finalAnswers[i];option.classList.toggle('selected',on);option.setAttribute('aria-pressed',String(on));});}));
    $('#final-check').onclick=()=>{
      let correct=true;
      clients.forEach((client,i)=>{const ok=state.finalAnswers[i]===client.answer;correct&&=ok;const el=$(`#client-feedback-${i}`);el.hidden=false;el.className=`feedback ${ok?'good':''}`;el.textContent=ok?client.why:'Вспомни условия хозяина: '+client.text;});
      if(correct){state.finalComplete=true;save();sound();renderCertificate();showPromo();}
      else{state.mistakes++;save();sound(false);$('#final-feedback').hidden=false;$('#final-feedback').textContent='Некоторые решения ещё не подходят. У каждого заказа появилась подсказка — проверь условия.';}
    };
    scrollTop();focusHeading();
  }
  function renderCertificate() {
    currentView='certificate';
    main.innerHTML=`<section class="final-page"><header class="final-head"><div class="eyebrow">Путь пройден</div><h1>Теперь ты знаешь,<br>как рождается тепло</h1><p>Шесть зон, шесть принципов, три удачных решения. Твой знак мастера готов.</p></header><div class="certificate-preview" id="certificate"><div class="eyebrow" style="justify-content:center">Музей Печи · Муром</div><h2>Мастер печного дела</h2><div class="person" id="certificate-name">${escape(state.name||'Хранитель домашнего тепла')}</div><p>Прошёл квест «Путь печника»<br>и собрал шесть знаков мастерства</p><div class="certificate-stamps" aria-label="Все шесть знаков собраны">${chapters.map((c,i)=>`<span title="${escape(c.badge)}">${i+1}</span>`).join('')}</div><p>От первого очага — к осознанному выбору печи</p></div><div class="final-action"><label for="player-name">Имя на знаке <span class="save-note">(по желанию)</span></label><input id="player-name" class="name-input" maxlength="32" placeholder="Твоё имя" autocomplete="off" value="${escape(state.name)}"><div class="end-actions"><button id="download" class="button primary">Сохранить знак ↓</button><button id="end-journal" class="button">Мои открытия</button></div><p class="save-note">Имя остаётся в этом браузере и в скачанном файле.</p><div class="end-actions"><button id="end-museum" class="text-link">Продолжить знакомство с музеем ↗</button><button id="end-reset" class="text-link">Пройти ещё раз</button></div></div><p class="collection-note">${chapters.map(c=>escape(c.principle)).join(' · ')}</p></section>`;
    $('#player-name').oninput=event=>{state.name=event.target.value.slice(0,32);$('#certificate-name').textContent=state.name||'Хранитель домашнего тепла';save();};
    $('#download').onclick=downloadCertificate;$('#end-journal').onclick=showJournal;$('#end-museum').onclick=showPromo;$('#end-reset').onclick=confirmRestart;
    scrollTop();focusHeading();
  }
  function showPromo() {
    showDialog('<div class="promo"><img src="assets/museum-logo.svg" alt="Музей Печи"><div class="earned">Квест «Путь печника» пройден</div><h2 id="modal-title">Ещё больше о печках<br>рассказываем в нашем музее!</h2><p>Теперь познакомься с настоящими печами, инструментами и изразцами. История тепла продолжается в Муроме.</p><div class="end-actions"><a class="button primary" href="https://pechmuseum.ru" target="_blank" rel="noopener noreferrer">Сайт музея ↗</a><a class="button vk" href="https://vk.ru/club227711594" target="_blank" rel="noopener noreferrer">Группа ВКонтакте ↗</a></div><button class="hint-button" id="back-certificate">Вернуться к моему знаку мастера</button></div>');
    $('#back-certificate').onclick=closeDialog;
  }
  function downloadCertificate() {
    const name=escape(state.name||'Хранитель домашнего тепла');
    const xml=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 850"><title>Знак мастера — Путь печника</title><rect width="1200" height="850" fill="#f4ead7"/><rect x="32" y="32" width="1136" height="786" fill="none" stroke="#ae8d56" stroke-width="2"/><rect x="43" y="43" width="1114" height="764" fill="none" stroke="#ae8d56"/><g text-anchor="middle" font-family="Georgia,serif"><text x="600" y="120" font-size="18" letter-spacing="6" fill="#a74329">МУЗЕЙ ПЕЧИ · МУРОМ</text><text x="600" y="218" font-size="27" fill="#756a5c">КВЕСТ «ПУТЬ ПЕЧНИКА»</text><text x="600" y="310" font-size="68" fill="#302821">Мастер печного дела</text><text x="600" y="407" font-size="${state.name.length>25?36:44}" font-style="italic" fill="#a74329">${name}</text><text x="600" y="475" font-size="23" fill="#756a5c">прошёл шесть зон музея и собрал шесть знаков мастерства</text>${chapters.map((c,i)=>`<circle cx="${350+i*100}" cy="570" r="32" stroke="#626e49" fill="none"/><text x="${350+i*100}" y="581" font-size="29" fill="#626e49">${i+1}</text>`).join('')}<text x="600" y="677" font-size="23" fill="#302821">От первого очага — к осознанному выбору печи</text><text x="600" y="748" font-size="20" fill="#a74329">pechmuseum.ru</text></g></svg>`;
    const blob=new Blob([xml],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='Путь-печника — знак-мастера.svg';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);announce('Знак мастера сохранён как изображение SVG.');
  }
  // Keep the game and its modal inside one visible app viewport when embedded in Tilda.
  if(window.self!==window.top){
    document.documentElement.classList.add('embedded');
    const resize=()=>{const height=Math.max(540,Math.min(window.innerHeight,window.screen.height||800,900));document.documentElement.style.setProperty('--app-height',height+'px');window.parent.postMessage({type:'pech-games-height',height},'*');};
    window.addEventListener('resize',resize);resize();
  }
  // A standalone ZIP can sit at its own root; the collection retains its relative back link.
  if(!window.location.pathname.includes('/09-put-pechnika/'))$('#back-link').href='https://pechmuseum.ru/pechnye-igry';
  updateSound();save();renderIntro();
})();
