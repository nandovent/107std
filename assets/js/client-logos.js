(()=>{
  const isHome=document.body?.dataset?.page==='home'||/^\/?(?:index\.html)?$/.test(window.location.pathname.replace(/\/+$/,''));
  if(!isHome)return;

  const fallback=[
    {id:'teste-1',nome:'107 Studios',arquivo:'/assets/images/logo-dark.png',publicado:true,ordem:1},
    {id:'teste-2',nome:'107 Studios',arquivo:'/assets/images/logo-orange.png',publicado:true,ordem:2},
    {id:'teste-3',nome:'107 Studios',arquivo:'/assets/images/logo-light.png',publicado:true,ordem:3},
    {id:'teste-4',nome:'107 Studios',arquivo:'/assets/images/logo-dark.png',publicado:true,ordem:4},
    {id:'teste-5',nome:'107 Studios',arquivo:'/assets/images/logo-orange.png',publicado:true,ordem:5},
    {id:'teste-6',nome:'107 Studios',arquivo:'/assets/images/logo-light.png',publicado:true,ordem:6}
  ];

  const createStrip=(items)=>{
    const visible=items.filter(item=>item.publicado!==false&&item.arquivo).sort((a,b)=>(a.ordem||999)-(b.ordem||999));
    if(!visible.length)return;
    const section=document.createElement('section');
    section.className='client-logo-section';
    section.setAttribute('aria-label','Clientes da 107 Studios');
    section.innerHTML=`<div class="client-logo-heading"><span>Clientes que confiam na 107</span></div><div class="client-logo-viewport"><div class="client-logo-track"></div></div>`;
    const track=section.querySelector('.client-logo-track');
    const repeated=[...visible,...visible];
    repeated.forEach(item=>{
      const logo=document.createElement('div');
      logo.className='client-logo-item';
      logo.innerHTML=`<img src="${item.arquivo}" alt="${item.nome||'Logo de cliente'}" loading="lazy" draggable="false">`;
      track.appendChild(logo);
    });
    const main=document.querySelector('main')||document.body;
    const footerPanel=[...main.querySelectorAll('section')].find(el=>el.querySelector('.footer'));
    if(footerPanel)main.insertBefore(section,footerPanel);else main.appendChild(section);
  };

  const init=async()=>{
    try{
      const response=await fetch('/data/clientes.json',{cache:'no-store'});
      if(!response.ok)throw new Error('sem dados');
      const data=await response.json();
      createStrip(Array.isArray(data)?data:fallback);
    }catch(_){createStrip(fallback)}
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
