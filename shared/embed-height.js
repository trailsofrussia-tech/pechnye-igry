(function(){
  const isLauncher=Boolean(document.querySelector('a.play'));

  function addGameNavigation(){
    if(isLauncher||document.querySelector('.pech-game-nav'))return;
    const style=document.createElement('style');
    style.textContent=`
      .pech-game-nav{position:fixed;right:max(12px,env(safe-area-inset-right));bottom:max(12px,env(safe-area-inset-bottom));z-index:90000;display:flex;align-items:center;gap:8px;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
      .pech-game-nav a{height:46px;border:1px solid #e3a35d;background:#26160ff0;color:#fff7e8!important;text-decoration:none!important;box-shadow:0 8px 24px #0007;backdrop-filter:blur(8px);display:inline-flex;align-items:center;justify-content:center;font-weight:850}
      .pech-game-nav a:hover{background:#a44f28}.pech-game-nav a:focus-visible{outline:4px solid #f3b24e;outline-offset:3px}
      .pech-game-back{padding:0 15px;border-radius:999px;font-size:14px;white-space:nowrap}
      .pech-museum-home{width:46px;border-radius:50%;background:#fff7e6!important;padding:6px!important}
      .pech-museum-home:hover{background:#ffe1b8!important}.pech-museum-home img{display:block;width:33px;height:33px}
      @media(max-width:520px){.pech-game-nav{right:8px;bottom:8px;gap:6px}.pech-game-nav a{height:42px}.pech-game-back{padding:0 12px;font-size:13px}.pech-museum-home{width:42px;padding:6px!important}.pech-museum-home img{width:29px;height:29px}}
    `;
    document.head.appendChild(style);
    const nav=document.createElement('nav');
    nav.className='pech-game-nav';
    nav.setAttribute('aria-label','Навигация по играм Музея Печи');
    nav.innerHTML=`<a class="pech-game-back" href="../index.html">← Назад</a><a class="pech-museum-home" href="https://pechmuseum.ru" target="_blank" rel="noopener noreferrer" aria-label="Открыть сайт Музея Печи" title="Музей Печи"><img src="../shared/museum-logo.svg" alt=""></a>`;
    document.body.appendChild(nav);
  }

  function reportHeight(){
    if(window.self===window.top)return;
    const body=document.body;
    const root=document.documentElement;
    const height=Math.max(body?body.scrollHeight:0,root?root.scrollHeight:0,620);
    window.parent.postMessage({type:'pech-games-height',height:height},'*');
  }

  addGameNavigation();
  if(window.self===window.top)return;
  window.addEventListener('load',reportHeight);
  window.addEventListener('resize',reportHeight);
  if('ResizeObserver' in window)new ResizeObserver(reportHeight).observe(document.documentElement);
  setTimeout(reportHeight,100);
  setTimeout(reportHeight,900);
})();
