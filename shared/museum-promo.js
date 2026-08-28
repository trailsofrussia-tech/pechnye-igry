(function(){
  const VK_URL='https://vk.ru/club227711594';
  const MUSEUM_URL='https://pechmuseum.ru';
  let previousFocus=null;
  let previousHtmlOverflow='';
  let previousBodyOverflow='';

  function ensureModal(){
    let modal=document.getElementById('museum-promo');
    if(modal)return modal;

    const style=document.createElement('style');
    style.textContent=`
      #museum-promo,#museum-promo *{box-sizing:border-box}
      #museum-promo[hidden]{display:none!important}
      #museum-promo{position:fixed;inset:0;z-index:99999;display:block;background:rgba(19,10,6,.84);backdrop-filter:blur(8px);font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#3b2014}
      #museum-promo .museum-promo-card{position:absolute;left:50%;top:var(--museum-promo-y,50%);transform:translate(-50%,-50%);width:min(560px,calc(100% - 24px));max-height:min(520px,calc(100% - 24px));overflow:auto;padding:26px 24px 24px;border:2px solid #bd7645;border-radius:22px;background:radial-gradient(circle at 50% 0,#fff9e9,#f2dfbd 72%);box-shadow:0 24px 70px #0009;text-align:center}
      #museum-promo .museum-promo-close{position:absolute;right:10px;top:9px;width:38px;height:38px;padding:0;border:1px solid #b98c69;border-radius:50%;background:#fff9ec;color:#4a2a1b;font:700 24px/1 system-ui;cursor:pointer}
      #museum-promo .museum-promo-emblem{width:72px;height:72px;margin:0 auto 10px;border-radius:50%;display:grid;place-items:center;background:#fff6e2;box-shadow:inset 0 0 0 2px #d7a26a,0 7px 18px #63301e35}
      #museum-promo .museum-promo-emblem img{width:56px;height:56px;display:block}
      #museum-promo .museum-promo-finish{margin:0 0 5px;color:#9a4a25;font-size:14px;font-weight:900;letter-spacing:.04em;text-transform:uppercase}
      #museum-promo h2{margin:0 auto 9px;max-width:500px;color:#402014;font-family:Georgia,"Times New Roman",serif;font-size:clamp(24px,4vw,34px);line-height:1.08}
      #museum-promo p{max-width:500px;margin:0 auto 17px;color:#6d4b37;font-size:15px;line-height:1.42}
      #museum-promo .museum-promo-actions{display:flex;justify-content:center;gap:9px;flex-wrap:wrap}
      #museum-promo .museum-promo-vk,#museum-promo .museum-promo-home,#museum-promo .museum-promo-later{min-height:44px;padding:11px 15px;border-radius:11px;font:800 14px/1.2 system-ui;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}
      #museum-promo .museum-promo-vk{border:1px solid #006ee6;background:#0077ff;color:#fff;box-shadow:0 7px 18px #0077ff35}
      #museum-promo .museum-promo-home{border:1px solid #963b32;background:#a7232f;color:#fff}
      #museum-promo .museum-promo-later{border:1px solid #b98c69;background:#fff8e9;color:#53301f}
      #museum-promo a:focus-visible,#museum-promo button:focus-visible{outline:4px solid #f4a33c;outline-offset:3px}
      @media(max-width:520px){#museum-promo .museum-promo-card{padding:50px 15px 16px;max-height:520px}#museum-promo .museum-promo-emblem{width:58px;height:58px;margin-top:-34px}#museum-promo .museum-promo-emblem img{width:45px;height:45px}#museum-promo h2{font-size:22px}#museum-promo p{font-size:14px;margin-bottom:13px}#museum-promo .museum-promo-actions{display:grid;grid-template-columns:1fr 1fr}#museum-promo .museum-promo-vk{grid-column:1/-1}#museum-promo .museum-promo-vk,#museum-promo .museum-promo-home,#museum-promo .museum-promo-later{width:100%;min-height:42px;padding:9px 11px}}
    `;
    document.head.appendChild(style);

    modal=document.createElement('div');
    modal.id='museum-promo';
    modal.hidden=true;
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    modal.setAttribute('aria-labelledby','museum-promo-title');
    modal.innerHTML=`
      <div class="museum-promo-card">
        <button class="museum-promo-close" type="button" aria-label="Закрыть">×</button>
        <div class="museum-promo-emblem" aria-hidden="true"><img src="../shared/museum-logo.svg" alt=""></div>
        <div class="museum-promo-finish">Игра завершена</div>
        <h2 id="museum-promo-title">Ещё больше о печках рассказываем в нашем музее!</h2>
        <p>Истории настоящих печей, старинные изразцы, устройство очага и новые интерактивы ждут вас в Музее Печи.</p>
        <div class="museum-promo-actions">
          <a class="museum-promo-vk" href="${VK_URL}" target="_blank" rel="noopener noreferrer">Группа музея ВКонтакте</a>
          <a class="museum-promo-home" href="${MUSEUM_URL}" target="_blank" rel="noopener noreferrer">Сайт музея</a>
          <button class="museum-promo-later" type="button">Остаться в игре</button>
        </div>
      </div>`;
    document.body.appendChild(modal);

    function close(){
      modal.hidden=true;
      document.documentElement.style.overflow=previousHtmlOverflow;
      document.body.style.overflow=previousBodyOverflow;
      if(previousFocus&&typeof previousFocus.focus==='function')previousFocus.focus();
    }
    modal.querySelector('.museum-promo-close').addEventListener('click',close);
    modal.querySelector('.museum-promo-later').addEventListener('click',close);
    modal.addEventListener('click',event=>{if(event.target===modal)close()});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!modal.hidden)close()});
    return modal;
  }

  function setVisiblePosition(modal){
    const rect=previousFocus&&previousFocus.getBoundingClientRect?previousFocus.getBoundingClientRect():null;
    const viewportHeight=Math.max(window.innerHeight||0,440);
    const anchor=rect&&Number.isFinite(rect.top)?rect.top+rect.height/2:viewportHeight/2;
    const margin=Math.min(230,viewportHeight/2);
    const y=Math.max(margin,Math.min(viewportHeight-margin,anchor));
    modal.style.setProperty('--museum-promo-y',y+'px');
  }

  window.showMuseumPromo=function(completionTitle='Игра завершена!'){
    const modal=ensureModal();
    previousFocus=document.activeElement;
    modal.querySelector('.museum-promo-finish').textContent=completionTitle;
    setVisiblePosition(modal);
    previousHtmlOverflow=document.documentElement.style.overflow;
    previousBodyOverflow=document.body.style.overflow;
    modal.hidden=false;
    document.documentElement.style.overflow='hidden';
    document.body.style.overflow='hidden';
    modal.querySelector('.museum-promo-vk').focus();
  };
})();
