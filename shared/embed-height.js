(function(){
  if(window.self===window.top)return;

  function reportHeight(){
    const body=document.body;
    const root=document.documentElement;
    const height=Math.max(body?body.scrollHeight:0,root?root.scrollHeight:0,620);
    window.parent.postMessage({type:'pech-games-height',height:height},'*');
  }

  if(!document.querySelector('main .grid')){
    const style=document.createElement('style');
    style.textContent='.pech-games-back{position:fixed;left:14px;bottom:14px;z-index:90000;padding:10px 14px;border:1px solid #e3a35d;border-radius:999px;background:#26160fe8;color:#fff7e8!important;font:800 14px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif;text-decoration:none!important;box-shadow:0 8px 24px #0007;backdrop-filter:blur(7px)}.pech-games-back:hover{background:#a44f28}.pech-games-back:focus-visible{outline:4px solid #f3b24e;outline-offset:3px}';
    document.head.appendChild(style);
    const back=document.createElement('a');
    back.className='pech-games-back';
    back.href='../index.html';
    back.textContent='← Ко всем играм';
    document.body.appendChild(back);
  }

  window.addEventListener('load',reportHeight);
  window.addEventListener('resize',reportHeight);
  if('ResizeObserver' in window)new ResizeObserver(reportHeight).observe(document.documentElement);
  setTimeout(reportHeight,100);
  setTimeout(reportHeight,900);
})();
