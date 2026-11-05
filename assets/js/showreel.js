(()=>{
  const card=document.querySelector('[data-showreel]');
  if(!card)return;
  const video=card.querySelector('video');
  const play=card.querySelector('[data-showreel-play]');
  const mute=card.querySelector('[data-showreel-mute]');
  if(!video||!play||!mute)return;
  video.muted=true;
  const sync=()=>{
    play.textContent=video.paused?'Reproduzir':'Pausar';
    play.setAttribute('aria-label',video.paused?'Reproduzir vídeo':'Pausar vídeo');
    mute.textContent=video.muted?'Ativar som':'Silenciar';
    mute.setAttribute('aria-label',video.muted?'Ativar som':'Silenciar vídeo');
  };
  const start=()=>{
    if(document.hidden)return;
    const request=video.play();
    if(request&&typeof request.catch==='function')request.catch(sync);
  };
  play.addEventListener('click',()=>{
    if(video.paused)start();else video.pause();
    sync();
  });
  mute.addEventListener('click',()=>{
    video.muted=!video.muted;
    if(video.paused)start();
    sync();
  });
  ['play','pause','volumechange','loadedmetadata','error'].forEach(name=>video.addEventListener(name,sync));
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      if(entries[0].isIntersecting)start();
      else video.pause();
    },{threshold:.2});
    observer.observe(card);
  }else start();
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)video.pause();
    else if(card.getBoundingClientRect().top<innerHeight&&card.getBoundingClientRect().bottom>0)start();
  });
  sync();
})();
