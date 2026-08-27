(function(){
  const VK_URL='https://vk.ru/club227711594';
  let previousFocus=null;

  function ensureModal(){
    let modal=document.getElementById('museum-promo');
    if(modal)return modal;

    const style=document.createElement('style');
    style.textContent=`
      #museum-promo[hidden]{display:none!important}
      #museum-promo{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;padding:18px;background:rgba(19,10,6,.82);backdrop-filter:blur(8px);font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#3b2014}
      #museum-promo .museum-promo-card{position:relative;width:min(720px,100%);max-height:calc(100vh - 36px);overflow:auto;padding:clamp(24px,5vw,48px);border:2px solid #bd7645;border-radius:28px;background:radial-gradient(circle at 50% 0,#fff9e9,#f2dfbd 72%);box-shadow:0 28px 90px #0009;text-align:center}
      #museum-promo .museum-promo-close{position:absolute;right:14px;top:12px;width:42px;height:42px;padding:0;border:1px solid #b98c69;border-radius:50%;background:#fff9ec;color:#4a2a1b;font:700 26px/1 system-ui;cursor:pointer}
      #museum-promo .museum-promo-emblem{width:112px;height:112px;margin:0 auto 16px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(145deg,#6b2f20,#32150f);box-shadow:inset 0 0 0 7px #e6aa58,0 9px 24px #63301e45}
      #museum-promo .museum-promo-emblem svg{width:78px;height:78px;display:block}
      #museum-promo .museum-promo-finish{margin:0 0 8px;color:#9a4a25;font-size:clamp(15px,2.5vw,18px);font-weight:900;letter-spacing:.04em;text-transform:uppercase}
      #museum-promo h2{margin:0 auto 13px;max-width:620px;color:#402014;font-family:Georgia,"Times New Roman",serif;font-size:clamp(29px,5vw,48px);line-height:1.08}
      #museum-promo p{max-width:590px;margin:0 auto 24px;color:#6d4b37;font-size:clamp(16px,2.4vw,20px);line-height:1.5}
      #museum-promo .museum-promo-actions{display:flex;justify-content:center;gap:11px;flex-wrap:wrap}
      #museum-promo .museum-promo-vk,#museum-promo .museum-promo-later{min-height:50px;padding:13px 19px;border-radius:13px;font:800 16px/1.2 system-ui;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}
      #museum-promo .museum-promo-vk{border:1px solid #006ee6;background:#0077ff;color:#fff;box-shadow:0 9px 22px #0077ff45}
      #museum-promo .museum-promo-later{border:1px solid #b98c69;background:#fff8e9;color:#53301f}
      #museum-promo .museum-promo-vk:focus-visible,#museum-promo .museum-promo-later:focus-visible,#museum-promo .museum-promo-close:focus-visible{outline:4px solid #f4a33c;outline-offset:3px}
      @media(max-width:520px){#museum-promo .museum-promo-card{padding:62px 20px 24px}#museum-promo .museum-promo-actions{display:grid}#museum-promo .museum-promo-vk,#museum-promo .museum-promo-later{width:100%}}
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
        <div class="museum-promo-emblem" aria-hidden="true">
          <svg viewBox="0 0 96 96"><path fill="#e9ad5d" d="M24 75V34c0-17 10-27 24-27s24 10 24 27v41z"/><path fill="#4b2117" d="M33 75V45c0-10 6-17 15-17s15 7 15 17v30z"/><path fill="#f7e3b2" d="M16 75h64v12H16z"/><path fill="#f37835" d="M48 67c-10 0-15-7-11-15 3-6 8-8 8-16 10 7 18 17 14 25-2 4-6 6-11 6z"/><path fill="#ffd56c" d="M48 64c-5 0-7-4-5-8 2-3 4-4 4-8 5 4 8 9 6 13-1 2-3 3-5 3z"/><path fill="#7c3d25" d="M19 19h58v10H19z"/></svg>
        </div>
        <div class="museum-promo-finish">Игра завершена</div>
        <h2 id="museum-promo-title">Ещё больше о печках рассказываем в нашем музее!</h2>
        <p>Истории настоящих печей, старинные изразцы, устройство очага и новые интерактивы ждут вас в сообществе музея.</p>
        <div class="museum-promo-actions">
          <a class="museum-promo-vk" href="${VK_URL}" target="_blank" rel="noopener noreferrer">Перейти в группу музея ВКонтакте</a>
          <button class="museum-promo-later" type="button">Остаться в игре</button>
        </div>
      </div>`;
    document.body.appendChild(modal);

    function close(){
      modal.hidden=true;
      document.documentElement.style.overflow='';
      if(previousFocus&&typeof previousFocus.focus==='function')previousFocus.focus();
    }
    modal.querySelector('.museum-promo-close').addEventListener('click',close);
    modal.querySelector('.museum-promo-later').addEventListener('click',close);
    modal.addEventListener('click',event=>{if(event.target===modal)close()});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!modal.hidden)close()});
    return modal;
  }

  window.showMuseumPromo=function(completionTitle='Игра завершена!'){
    const modal=ensureModal();
    previousFocus=document.activeElement;
    modal.querySelector('.museum-promo-finish').textContent=completionTitle;
    modal.hidden=false;
    document.documentElement.style.overflow='hidden';
    modal.querySelector('.museum-promo-vk').focus();
  };
})();
