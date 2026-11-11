(()=>{
  // Reserva local: as fotos continuam visiveis mesmo se /data/equipe.json nao responder.
  const fallback=[
    {
      "id": "fernando-venturini",
      "nome": "Fernando Venturini",
      "funcao": "Proprietário e diretor.",
      "instagram": "@nandovent",
      "arquivo": "/assets/equipe/fernando-venturini.png",
      "ordem": 1,
      "publicado": true,
      "destaque": true,
      "escala": 110
    },
    {
      "id": "yago-wolf",
      "nome": "Yago Wolf",
      "funcao": "Videomaker e editor",
      "instagram": "@yagowolf_",
      "arquivo": "/assets/equipe/yago-wolf.png",
      "ordem": 2,
      "publicado": true,
      "destaque": false,
      "escala": 100
    },
    {
      "id": "laura-vidal",
      "nome": "Laura Vidal",
      "funcao": "Storymaker e editora",
      "instagram": "@llauravidall",
      "arquivo": "/assets/equipe/laura-vidal.png",
      "ordem": 3,
      "publicado": true,
      "destaque": false,
      "escala": 105
    },
    {
      "id": "will-moser",
      "nome": "Will Moser",
      "funcao": "Editor",
      "instagram": "@wiillmoser",
      "arquivo": "/assets/equipe/will-moser.png",
      "ordem": 4,
      "publicado": true,
      "destaque": false,
      "escala": 100
    },
    {
      "id": "matheus-yuri",
      "nome": "Matheus Yuri",
      "funcao": "Videomaker",
      "instagram": "@matheusyurirosa",
      "arquivo": "/assets/equipe/matheus-yuri.png",
      "ordem": 6,
      "publicado": true,
      "destaque": false,
      "escala": 100
    },
    {
      "id": "beatriz-vieira",
      "nome": "Beatriz Vieira",
      "funcao": "Influencer e apresentadora",
      "instagram": "@bevieiraa",
      "arquivo": "/assets/equipe/beatriz-vieira.png",
      "ordem": 7,
      "publicado": true,
      "destaque": false,
      "escala": 100
    }
  ];

  const esc=value=>String(value||'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const insta=value=>{
    const raw=String(value||'').trim();
    if(!raw)return null;
    const handle=raw.replace(/^https?:\/\/(www\.)?instagram\.com\//i,'').replace(/^@/,'').replace(/\/?(?:\?.*)?$/,'').split('/')[0];
    if(!/^[A-Za-z0-9._]+$/.test(handle))return null;
    return {handle:'@'+handle,url:'https://www.instagram.com/'+handle+'/'};
  };
  const render=items=>{
    const grid=document.querySelector('#home-team-grid');
    if(!grid)return;
    const visible=items.filter(item=>item.publicado!==false).sort((a,b)=>(a.ordem||999)-(b.ordem||999));
    if(!visible.length){grid.innerHTML='';return;}
    grid.innerHTML=visible.map((item,index)=>{
      const scale=Math.min(170,Math.max(60,Number(item.escala)||100));
      const featured=item.destaque===true||index===0;
      const image=item.arquivo
        ? `<img src="${esc(item.arquivo)}" alt="${esc(item.nome)}" loading="lazy" style="--team-scale:${scale/100}" onerror="this.hidden=true;this.parentElement.classList.remove('has-image')">`
        : '<span>Foto</span>';
      const profile=insta(item.instagram);
      const tag=profile?'a':'article';
      const attrs=profile?` href="${esc(profile.url)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir Instagram de ${esc(item.nome)}"`:'';
      const handle=profile?`<span class="home-team-instagram">${esc(profile.handle)}</span>`:'';
      return `<${tag} class="home-team-member${featured?' home-team-member-featured':''}${profile?' is-clickable':''}"${attrs}><div class="home-team-photo${item.arquivo?' has-image':''}" aria-label="Foto de ${esc(item.nome)}">${image}</div><div class="home-team-info"><h3>${esc(item.nome)}</h3><p>${esc(item.funcao)}</p>${handle}</div></${tag}>`;
    }).join('');
  };
  const init=async()=>{
    try{
      const response=await fetch('/data/equipe.json',{cache:'no-store'});
      if(!response.ok)throw new Error('sem dados');
      const data=await response.json();
      render(Array.isArray(data)&&data.length?data:fallback);
    }catch(_){render(fallback);}
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
