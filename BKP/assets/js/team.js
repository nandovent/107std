(()=>{
  const fallback=[
    {id:'fernando-venturini',nome:'Fernando Venturini',funcao:'Proprietário e diretor.',arquivo:'',ordem:1,publicado:true,escala:100,destaque:true},
    {id:'yago-wolf',nome:'Yago Wolf',funcao:'Videomaker e editor',arquivo:'',ordem:2,publicado:true,escala:100},
    {id:'laura-vidal',nome:'Laura Vidal',funcao:'Storymaker e editora',arquivo:'',ordem:3,publicado:true,escala:100},
    {id:'will-moser',nome:'Will Moser',funcao:'Editor',arquivo:'',ordem:4,publicado:true,escala:100},
    {id:'guilherme-antunes',nome:'Guilherme Antunes',funcao:'Videomaker',arquivo:'',ordem:5,publicado:true,escala:100},
    {id:'matheus-yuri',nome:'Matheus Yuri',funcao:'Videomaker',arquivo:'',ordem:6,publicado:true,escala:100},
    {id:'beatriz-vieira',nome:'Beatriz Vieira',funcao:'Influencer e apresentadora',arquivo:'',ordem:7,publicado:true,escala:100}
  ];
  const esc=value=>String(value||'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const render=items=>{
    const grid=document.querySelector('#home-team-grid');
    if(!grid)return;
    const visible=items.filter(item=>item.publicado!==false).sort((a,b)=>(a.ordem||999)-(b.ordem||999));
    if(!visible.length)return;
    grid.innerHTML=visible.map((item,index)=>{
      const scale=Math.min(170,Math.max(60,Number(item.escala)||100));
      const featured=item.destaque===true||index===0;
      const image=item.arquivo?`<img src="${esc(item.arquivo)}" alt="${esc(item.nome)}" loading="lazy" style="--team-scale:${scale/100}">`:'<span>Foto</span>';
      return `<article class="home-team-member${featured?' home-team-member-featured':''}"><div class="home-team-photo${item.arquivo?' has-image':''}" aria-label="Foto de ${esc(item.nome)}">${image}</div><div class="home-team-info"><h3>${esc(item.nome)}</h3><p>${esc(item.funcao)}</p></div></article>`;
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
