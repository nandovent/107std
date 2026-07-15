(()=>{
  const root=document.querySelector('[data-audio-player]');
  if(!root)return;
  const audio=root.querySelector('[data-audio]');
  const play=root.querySelector('[data-audio-play]');
  const restart=root.querySelector('[data-audio-restart]');
  const mute=root.querySelector('[data-audio-mute]');
  const wave=root.querySelector('[data-audio-wave]');
  const playIcon=root.querySelector('[data-play-icon]');
  const muteIcon=root.querySelector('[data-mute-icon]');
  const current=root.querySelector('[data-audio-current]');
  const duration=root.querySelector('[data-audio-duration]');
  const amplitudes=[0.222,0.329,0.649,0.804,0.897,0.739,0.507,0.592,0.772,0.944,0.785,0.546,0.788,0.830,0.975,0.828,0.646,0.594,0.866,0.931,0.778,0.658,0.706,0.849,0.959,0.874,0.653,0.552,0.833,0.887,0.780,0.567,0.527,0.769,0.847,0.792,0.546,0.572,0.789,0.827,0.952,0.666,0.767,0.801,0.801,0.916,0.474,0.620,0.789,0.800,0.881,0.644,0.528,0.768,0.871,0.949,0.665,0.660,0.794,0.800,0.883,0.537,0.733,0.911,0.799,0.877,0.594,0.634,0.781,0.761,0.842,0.760,0.540,0.756,0.808,0.909,0.593,0.743,0.949,0.758,0.941,0.583,0.729,0.942,0.720,0.950,0.567,0.723,0.921,0.666,0.956,0.800,0.719,0.803,0.662,0.997,0.724,0.703,0.927,0.747,0.919,0.850,0.737,0.725,0.769,0.859,0.971,0.874,0.595,0.787,0.923,0.957,0.781,0.585,0.904,0.777,0.844,0.733,0.505,0.761,0.813,0.869,0.825,0.482,0.438,0.777,0.911,0.791,0.572,0.800,0.913,0.940,0.767,0.611,1.000,0.945,0.947,0.766,0.613,0.486,0.874,0.945,0.906,0.930,0.872,1.000,1.000,1.000,0.559,1.000,1.000,1.000,1.000,0.862,0.685,0.912,0.892,0.966,0.095,0.080];
  amplitudes.forEach((value,index)=>{
    const bar=document.createElement('span');
    bar.className='sound-wave-bar';
    bar.style.setProperty('--wave-height',`${Math.max(8,value*100)}%`);
    bar.dataset.index=String(index);
    wave.appendChild(bar);
  });
  const bars=[...wave.children];
  const format=(seconds)=>{
    if(!Number.isFinite(seconds))return '0:00';
    const minutes=Math.floor(seconds/60);
    return `${minutes}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;
  };
  const update=()=>{
    const progress=audio.duration?audio.currentTime/audio.duration:0;
    current.textContent=format(audio.currentTime);
    duration.textContent=format(audio.duration||166.72);
    const active=Math.floor(progress*bars.length);
    bars.forEach((bar,index)=>bar.classList.toggle('is-played',index<=active));
    playIcon.textContent=audio.paused?'▶':'Ⅱ';
    play.classList.toggle('is-playing',!audio.paused);
    root.classList.toggle('is-playing',!audio.paused);
    muteIcon.textContent=audio.muted?'×':'◖';
  };
  let autoplayBlocked=false;
  const start=async()=>{
    audio.volume=.82;
    audio.muted=false;
    try{
      await audio.play();
      autoplayBlocked=false;
    }catch(error){
      autoplayBlocked=true;
    }
    update();
  };
  const unlockAudio=async()=>{
    if(!autoplayBlocked&& !audio.paused)return;
    audio.muted=false;
    audio.volume=.82;
    try{await audio.play();autoplayBlocked=false;}catch(error){}
    update();
  };
  play.addEventListener('click',async()=>{audio.paused?await audio.play():audio.pause();update();});
  restart.addEventListener('click',async()=>{audio.currentTime=0;if(audio.paused)await audio.play();update();});
  mute.addEventListener('click',()=>{audio.muted=!audio.muted;update();});
  wave.addEventListener('click',(event)=>{
    const rect=wave.getBoundingClientRect();
    const ratio=Math.min(1,Math.max(0,(event.clientX-rect.left)/rect.width));
    if(audio.duration)audio.currentTime=ratio*audio.duration;
    update();
  });
  audio.addEventListener('timeupdate',update);
  audio.addEventListener('loadedmetadata',update);
  audio.addEventListener('play',update);
  audio.addEventListener('pause',update);
  audio.addEventListener('ended',update);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&audio.paused&&audio.currentTime===0)start();},{once:true});
  ['pointerdown','touchstart','keydown'].forEach(type=>document.addEventListener(type,unlockAudio,{once:true,passive:true}));
  window.addEventListener('pageshow',start,{once:true});
  start();
})();
