(() => {
  const initial=['wood','air','brick','pot','milk','dough','apple','honey','water','cabbage','damper'];
  const atlas=['wood','air','brick','pot','milk','dough','apple','honey','water','damper','fire','storedHeat','strongHeat','hotPot','bakedMilk','bread','honeyApple','bakedApple','cabbage','cabbagePot','shchi','steam','proofed','fluffyBread'];
  const key='pech-alchemy-discoveries-v3', $=id=>document.getElementById(id);
  const recipeMap=new Map(RECIPES.map(r=>[[r[0],r[1]].sort().join('|'),r]));
  let found=new Set(),slots=[null,null],activeSlot=0,page=0,shown=false,promoTimer=null;
  try{const saved=JSON.parse(localStorage.getItem(key));if(Array.isArray(saved))found=new Set(saved.filter(id=>RECIPES.some(r=>r[2]===id)));}catch(_){}
  shown=found.size===RECIPES.length;
  const unlocked=()=>new Set([...initial,...found]);
  function save(){try{localStorage.setItem(key,JSON.stringify([...found]));}catch(_){}$('counter').textContent=`${found.size} / ${RECIPES.length}`;}
  function icon(id){const n=atlas.indexOf(id);return `<span class="alchemy-icon" aria-hidden="true" style="background-position:${n%6*20}% ${Math.floor(n/6)*100/3}%"></span>`;}
  function renderSlots(){['slotA','slotB'].forEach((id,i)=>{const item=slots[i];$(id).classList.toggle('filled',Boolean(item));$(id).innerHTML=item?`${icon(item)}<strong>${ITEMS[item][1]}</strong><small>Нажмите, чтобы заменить</small>`:`<small>ПРЕДМЕТ ${i+1}</small><span class="empty-mark" aria-hidden="true">＋</span><strong>Выбрать</strong>`;});$('combine').disabled=slots.some(x=>!x);}
  function openPicker(i){activeSlot=i;$('pickerTitle').textContent=`Выберите ${i===0?'первый':'второй'} предмет`;$('items').innerHTML=[...unlocked()].map(id=>`<button class="item" data-item="${id}" aria-pressed="${slots[i]===id}">${icon(id)}<span>${ITEMS[id][1]}</span></button>`).join('');$('items').querySelectorAll('[data-item]').forEach(button=>button.onclick=()=>{slots[activeSlot]=button.dataset.item;renderSlots();$('picker').close();$(activeSlot===0?'slotA':'slotB').focus();});$('picker').showModal();$('picker').scrollTop=0;}
  $('slotA').onclick=()=>openPicker(0);$('slotB').onclick=()=>openPicker(1);
  document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
  ['picker','book','resetDialog'].forEach(id=>$(id).addEventListener('click',e=>{if(e.target!==$(id))return;const r=$(id).getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$(id).close();}));
  $('clear').onclick=()=>{slots=[null,null];renderSlots();};
  $('combine').onclick=()=>{
    if(slots.some(x=>!x))return;
    const recipe=recipeMap.get([...slots].sort().join('|'));
    if(!recipe){$('result').className='result';$('result').innerHTML='<strong>Пока не получилось</strong><p>Попробуйте другую пару. В книге есть отдельная подсказка к каждому ещё не открытому элементу.</p>';return;}
    const id=recipe[2],already=found.has(id);found.add(id);save();$('result').className='result success';$('result').innerHTML=`<strong>${icon(id)}<span>${already?'Знакомый опыт':'Новое открытие'}: ${ITEMS[id][1]}</span></strong><p>${recipe[3]}</p>`;slots=[null,null];renderSlots();
    if(found.size===RECIPES.length&&!shown){shown=true;promoTimer=setTimeout(()=>{if(found.size===RECIPES.length){$('book').close();$('picker').close();showMuseumPromo('Все открытия записаны в книгу!');}},800);}
  };
  function renderBook(){const perPage=5,maxPage=Math.ceil(RECIPES.length/perPage)-1;page=Math.min(maxPage,Math.max(0,page));$('bookEntries').innerHTML=RECIPES.slice(page*perPage,(page+1)*perPage).map((r,i)=>{const open=found.has(r[2]),index=page*perPage+i;return `<article class="book-entry ${open?'':'locked'}">${icon(r[2])}<div class="book-entry-text"><h3>${String(index+1).padStart(2,'0')}. ${ITEMS[r[2]][1]}</h3>${open?`<p>${r[3]}</p>`:`<p>Эта строка ещё ждёт открытия.</p><button class="entry-hint" aria-expanded="false" aria-controls="hint-${r[2]}" data-hint="${r[2]}">Как создать?</button><p class="hint-text" id="hint-${r[2]}" hidden></p>`}</div></article>`;}).join('');
    $('bookPage').textContent=`Страница ${page+1} из ${maxPage+1} · ${found.size} открытий`;$('bookPrev').disabled=page===0;$('bookNext').disabled=page===maxPage;
    $('bookEntries').querySelectorAll('[data-hint]').forEach(button=>button.onclick=()=>{const r=RECIPES.find(r=>r[2]===button.dataset.hint),p=$('hint-'+r[2]),opening=p.hidden;p.hidden=!opening;button.setAttribute('aria-expanded',String(opening));const missing=[r[0],r[1]].filter(id=>!unlocked().has(id));p.textContent=`Соедините «${ITEMS[r[0]][1]}» + «${ITEMS[r[1]][1]}».`+(missing.length?` Сначала откройте: ${missing.map(id=>ITEMS[id][1]).join(', ')}. Их рецепты тоже есть в книге.`:' Оба предмета уже есть на полке.');});
  }
  $('openBook').onclick=()=>{renderBook();$('book').showModal();$('book').scrollTop=0;};$('bookPrev').onclick=()=>{page--;renderBook();$('book').scrollTop=0;};$('bookNext').onclick=()=>{page++;renderBook();$('book').scrollTop=0;};
  $('restart').onclick=()=>$('resetDialog').showModal();$('cancelReset').onclick=()=>$('resetDialog').close();$('confirmReset').onclick=()=>{clearTimeout(promoTimer);found.clear();slots=[null,null];shown=false;page=0;save();renderSlots();$('result').className='result';$('result').innerHTML='<strong>Новая книга, новые опыты</strong><p>Начните с дров и воздуха.</p>';$('resetDialog').close();};
  save();renderSlots();
})();
