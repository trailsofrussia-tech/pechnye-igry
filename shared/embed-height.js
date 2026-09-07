(function(){
  const launcher=Boolean(document.querySelector('a.play'));
  const framed=window.self!==window.top;
  let parentHeight=0;
  const style=document.createElement('style');
  style.textContent=`
    .pech-game-nav{position:fixed;right:max(10px,env(safe-area-inset-right));bottom:max(10px,env(safe-area-inset-bottom));z-index:90000;display:flex;gap:7px;align-items:center;font:700 13px/1.2 system-ui,sans-serif}
    .pech-game-nav a{box-sizing:border-box;min-height:44px;display:flex;align-items:center;justify-content:center;background:#fff2d7;color:#3d2518!important;border:1px solid #b18556;text-decoration:none!important;padding:9px 14px;border-radius:30px;box-shadow:0 4px 20px #0004}
    .pech-game-nav a:hover{background:#ffdf9f}.pech-game-nav a:focus-visible{outline:3px solid #5da4ed;outline-offset:3px}
    .pech-game-nav .pech-museum-home{padding:7px;width:44px}.pech-game-nav img{display:block;width:29px;height:29px}
    html.pech-embedded,html.pech-embedded body{height:var(--pech-viewport-height);min-height:0!important}
    html.pech-embedded body{overflow:auto}
    html.pech-embedded body[data-pech-fit]{overflow:hidden}
  `;
  document.head.appendChild(style);
  if(!launcher&&!document.querySelector('.pech-game-nav,.floating-nav')){
    const nav=document.createElement('nav');nav.className='pech-game-nav';nav.setAttribute('aria-label','Навигация Музея Печи');
    nav.innerHTML='<a class="pech-game-back" href="../index.html">← Обратно к играм</a><a class="pech-museum-home" href="https://pechmuseum.ru" target="_blank" rel="noopener noreferrer" aria-label="Открыть сайт Музея Печи"><img src="../shared/museum-logo.svg" alt="Музей Печи"></a>';
    document.body.appendChild(nav);
  }
  if(framed&&!launcher)document.documentElement.classList.add('pech-embedded');
  function size(){
    const height=framed?Math.max(360,Math.min(parentHeight||screen.availHeight||800,900)):Math.round(window.visualViewport?.height||window.innerHeight);
    document.documentElement.style.setProperty('--pech-viewport-height',height+'px');
    if(framed)window.parent.postMessage({type:'pech-games-height',height:launcher?Math.max(document.body.scrollHeight,620):height},'*');
  }
  window.addEventListener('message',event=>{
    if(!framed||event.source!==window.parent||event.data?.type!=='pech-games-viewport')return;
    const height=Number(event.data.height);if(Number.isFinite(height)&&height>=360&&height<=3000&&height!==parentHeight){parentHeight=height;size();}
  });
  window.addEventListener('resize',size);window.visualViewport?.addEventListener('resize',size);window.addEventListener('load',size);
  if(launcher&&framed&&'ResizeObserver'in window)new ResizeObserver(size).observe(document.body);
  size();if(framed)window.parent.postMessage({type:'pech-games-viewport-request'},'*');
})();
