(()=>{
  const fallback=[
    {id:'fernando-venturini',nome:'Fernando Venturini',funcao:'Proprietário e diretor.',instagram:'@nandovent',arquivo:'',ordem:1,publicado:true,escala:100,destaque:true},
    {id:'yago-wolf',nome:'Yago Wolf',funcao:'Videomaker e editor',instagram:'@yagowolf_',arquivo:'',ordem:2,publicado:true,escala:100},
    {id:'laura-vidal',nome:'Laura Vidal',funcao:'Storymaker e editora',instagram:'@llauravidall',arquivo:'',ordem:3,publicado:true,escala:100},
    {id:'will-moser',nome:'Will Moser',funcao:'Editor',instagram:'@wiillmoser',arquivo:'',ordem:4,publicado:true,escala:100},
    {id:'guilherme-antunes',nome:'Guilherme Antunes',funcao:'Videomaker',instagram:'',arquivo:'',ordem:5,publicado:true,escala:100},
    {id:'matheus-yuri',nome:'Matheus Yuri',funcao:'Videomaker',instagram:'@matheusyurirosa',arquivo:'',ordem:6,publicado:true,escala:100},
    {id:'beatriz-vieira',nome:'Beatriz Vieira',funcao:'Influencer e apresentadora',instagram:'@bevieiraa',arquivo:'',ordem:7,publicado:true,escala:100}
  ];
  const knownInstagram=Object.fromEntries(fallback.map(item=>[item.id,item.instagram]));
  const esc=value=>String(value||'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const insta=value=>{
    const raw=String(value||'').trim();
    if(!raw)return null;
    const handle=raw.replace(/^https?:\/\/(www\.)?instagram\.com\//i,'').replace(/^@/,'').replace(/\/?(?:\?.*)?$/,'').split('/')[0];
    if(!/^[A-Za-z0-9._]+$/.test(handle))return null;
    return {handle:'@'+handle,url:'https://www.instagram.com/'+handle+'/'};
  };
  const assetUrl=value=>{
    const raw=String(value||'').trim();
    if(!raw)return '';
    const path=raw.replace(/^https?:\/\/[^/]+/i,'').replace(/^\/+/, '');
    if(/^assets\/equipe\/[a-zA-Z0-9_-]+\.(png|jpe?g|webp)$/i.test(path)){
      return `/api/equipe?asset=${encodeURIComponent(path)}`;
    }
    return raw;
  };
  const render=items=>{
    const grid=document.querySelector('#home-team-grid');
    if(!grid)return;
    const visible=items
      .map(item=>({...item,instagram:String(item.instagram||knownInstagram[item.id]||'').trim()}))
      .filter(item=>item.publicado!==false)
      .sort((a,b)=>(a.ordem||999)-(b.ordem||999));
    if(!visible.length)return;
    grid.innerHTML=visible.map((item,index)=>{
      const scale=Math.min(170,Math.max(60,Number(item.escala)||100));
      const featured=item.destaque===true||index===0;
      const src=assetUrl(item.arquivo);
      const image=src?`<img src="${esc(src)}" alt="${esc(item.nome)}" loading="lazy" style="--team-scale:${scale/100}">`:'<span>Foto</span>';
      const profile=insta(item.instagram);
      const profileLabel=profile?`<span class="home-team-instagram">${esc(profile.handle)}</span>`:'';
      const content=`<div class="home-team-photo${src?' has-image':''}" aria-label="Foto de ${esc(item.nome)}">${image}</div><div class="home-team-info"><h3>${esc(item.nome)}</h3><p>${esc(item.funcao)}</p>${profileLabel}</div>`;
      if(profile){
        return `<a class="home-team-member home-team-member-link${featured?' home-team-member-featured':''}" href="${esc(profile.url)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir Instagram de ${esc(item.nome)}">${content}</a>`;
      }
      return `<article class="home-team-member${featured?' home-team-member-featured':''}">${content}</article>`;
    }).join('');
  };
  const init=async()=>{
    try{
      const response=await fetch('/data/equipe.json',{cache:'no-store'});
      if(!response.ok)throw new Error('sem dados');
      const data=await response.json();
      render(Array.isArray(data)&&data.length?data:fallback);
    }catch(_){render(fallback)}
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
