(()=>{
  const fallback=[
    {id:'teste-1',nome:'107 Studios',arquivo:'/assets/images/logo-dark.png',publicado:true,ordem:1,escala:90},
    {id:'teste-2',nome:'107 Studios',arquivo:'/assets/images/logo-orange.png',publicado:true,ordem:2,escala:90},
    {id:'teste-3',nome:'107 Studios',arquivo:'/assets/images/logo-light.png',publicado:true,ordem:3,escala:90},
    {id:'teste-4',nome:'107 Studios',arquivo:'/assets/images/logo-dark.png',publicado:true,ordem:4,escala:90},
    {id:'teste-5',nome:'107 Studios',arquivo:'/assets/images/logo-orange.png',publicado:true,ordem:5,escala:90},
    {id:'teste-6',nome:'107 Studios',arquivo:'/assets/images/logo-light.png',publicado:true,ordem:6,escala:90}
  ];

  const publicLogoUrl=item=>{
    const path=String(item.arquivo||'').replace(/^\/+/, '');
    if(path.startsWith('assets/clientes/')){
      return `/api/clientes?asset=${encodeURIComponent(path)}&v=${encodeURIComponent(item.id||'logo')}`;
    }
    return item.arquivo||'';
  };

  const logoMarkup=item=>{
    const escala=Math.min(250,Math.max(55,Number(item.escala)||100));
    const logo=document.createElement('div');
    logo.className='client-logo-item';
    const img=document.createElement('img');
    img.src=publicLogoUrl(item);
    img.alt=item.nome||'Logo de cliente';
    img.loading='eager';
    img.draggable=false;
    img.style.setProperty('--logo-scale',escala/100);
    img.addEventListener('error',()=>{logo.hidden=true},{once:true});
    logo.appendChild(img);
    return logo;
  };

  const createStrip=items=>{
    const visible=items.filter(item=>item.publicado!==false&&item.arquivo).sort((a,b)=>(a.ordem||999)-(b.ordem||999));
    if(!visible.length)return;
    const section=document.createElement('section');
    section.className='client-logo-section';
    section.setAttribute('aria-label','Clientes da 107 Studios');
    section.innerHTML='<div class="client-logo-heading"><span>Marcas que confiam na 107 Studios</span></div><div class="client-logo-viewport"><div class="client-logo-track"><div class="client-logo-group"></div><div class="client-logo-group" aria-hidden="true"></div></div></div>';
    const groups=[...section.querySelectorAll('.client-logo-group')];
    const itemWidth=window.matchMedia('(max-width:600px)').matches?145:190;
    const repeats=Math.max(1,Math.ceil((window.innerWidth*1.35)/(itemWidth*visible.length)));
    const sequence=Array.from({length:repeats},()=>visible).flat();
    groups.forEach(group=>sequence.forEach(item=>group.appendChild(logoMarkup(item))));
    const main=document.querySelector('main')||document.body;
    const footerPanel=[...main.querySelectorAll('section')].find(el=>el.querySelector('.footer'));
    if(footerPanel)main.insertBefore(section,footerPanel);else main.appendChild(section);
  };

  const init=async()=>{
    try{
      const response=await fetch('/data/clientes.json',{cache:'no-store'});
      if(!response.ok)throw new Error('sem dados');
      const data=await response.json();
      createStrip(Array.isArray(data)&&data.length?data:fallback);
    }catch(_){createStrip(fallback)}
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
