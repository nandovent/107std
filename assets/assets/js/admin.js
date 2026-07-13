const loginCard=document.querySelector('#login-card');
const app=document.querySelector('#admin-app');
const passwordInput=document.querySelector('#password');
const loginBtn=document.querySelector('#login');
const loginStatus=document.querySelector('#login-status');
const statusEl=document.querySelector('#status');
const list=document.querySelector('#video-list');
const tpl=document.querySelector('#video-template');

const BASE_CATEGORIES=['Filmes Institucionais','Videoclipes'];
const NEW_CATEGORY_VALUE='__nova_categoria__';

let items=[];
let password=sessionStorage.getItem('107_admin_password')||'';

const setStatus=(msg,type='')=>{
  statusEl.textContent=msg;
  statusEl.className='status '+type;
};

const api=async(method='GET',body)=>{
  const response=await fetch('/api/portfolio',{
    method,
    headers:{
      'Content-Type':'application/json',
      'x-admin-password':password
    },
    body:body?JSON.stringify(body):undefined
  });

  const data=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(data.error||'Erro na API');
  return data;
};

const getCategories=()=>{
  const fromItems=items
    .map(item=>String(item.categoria||'').trim())
    .filter(Boolean);

  return [...new Set([...BASE_CATEGORIES,...fromItems])]
    .sort((a,b)=>{
      const aBase=BASE_CATEGORIES.indexOf(a);
      const bBase=BASE_CATEGORIES.indexOf(b);

      if(aBase>=0||bBase>=0){
        if(aBase<0)return 1;
        if(bBase<0)return -1;
        return aBase-bBase;
      }

      return a.localeCompare(b,'pt-BR');
    });
};

const selectedCategory=(editor)=>{
  const select=editor.querySelector('[data-field="categoria"]');
  const newInput=editor.querySelector('[data-field="nova-categoria"]');

  if(select.value===NEW_CATEGORY_VALUE){
    return newInput.value.trim();
  }

  return select.value.trim();
};

const readEditor=(el)=>({
  id:el.dataset.id||crypto.randomUUID(),
  categoria:selectedCategory(el),
  titulo:el.querySelector('[data-field="titulo"]').value.trim(),
  descricao:el.querySelector('[data-field="descricao"]').value.trim(),
  link:el.querySelector('[data-field="link"]').value.trim(),
  ordem:Number(el.querySelector('[data-field="ordem"]').value||1),
  publicado:el.querySelector('[data-field="publicado"]').checked
});

const normalizeOrder=()=>{
  items.forEach((item,index)=>item.ordem=index+1);
};

const sync=()=>{
  items=[...list.querySelectorAll('.video-editor')].map(readEditor);
};

const moveItem=(id,direction)=>{
  sync();
  items.sort((a,b)=>(a.ordem||999)-(b.ordem||999));

  const index=items.findIndex(item=>item.id===id);
  const target=index+direction;

  if(index<0||target<0||target>=items.length)return;

  [items[index],items[target]]=[items[target],items[index]];
  normalizeOrder();
  render();
  setStatus('Ordem alterada. Clique em “Publicar alterações” para salvar.','ok');
};

const applyManualOrder=(id,newOrder)=>{
  sync();
  items.sort((a,b)=>(a.ordem||999)-(b.ordem||999));

  const currentIndex=items.findIndex(item=>item.id===id);
  if(currentIndex<0)return;

  const [item]=items.splice(currentIndex,1);
  const targetIndex=Math.max(0,Math.min(items.length,Number(newOrder||1)-1));
  items.splice(targetIndex,0,item);

  normalizeOrder();
  render();
  setStatus('Ordem alterada. Clique em “Publicar alterações” para salvar.','ok');
};

const setupCategoryField=(editor,item)=>{
  const select=editor.querySelector('[data-field="categoria"]');
  const newField=editor.querySelector('.new-category-field');
  const newInput=editor.querySelector('[data-field="nova-categoria"]');
  const categories=getCategories();
  const current=String(item.categoria||'').trim();

  select.innerHTML='';

  categories.forEach(category=>{
    const option=document.createElement('option');
    option.value=category;
    option.textContent=category;
    select.appendChild(option);
  });

  const newOption=document.createElement('option');
  newOption.value=NEW_CATEGORY_VALUE;
  newOption.textContent='+ Cadastrar nova categoria';
  select.appendChild(newOption);

  if(current&&categories.includes(current)){
    select.value=current;
    newField.hidden=true;
    newInput.value='';
  }else if(current){
    select.value=NEW_CATEGORY_VALUE;
    newField.hidden=false;
    newInput.value=current;
  }else{
    select.value=categories[0]||BASE_CATEGORIES[0];
    newField.hidden=true;
    newInput.value='';
  }

  select.onchange=()=>{
    const isNew=select.value===NEW_CATEGORY_VALUE;
    newField.hidden=!isNew;

    if(isNew){
      newInput.focus();
    }else{
      newInput.value='';
    }
  };
};

const render=()=>{
  list.innerHTML='';
  items.sort((a,b)=>(a.ordem||999)-(b.ordem||999));
  normalizeOrder();

  items.forEach((item,index)=>{
    const el=tpl.content.firstElementChild.cloneNode(true);
    const id=item.id||crypto.randomUUID();

    item.id=id;
    el.dataset.id=id;

    el.querySelector('.editor-title').textContent=item.titulo||'NOVO VÍDEO';
    el.querySelector('.position-badge').textContent=String(index+1).padStart(2,'0');

    setupCategoryField(el,item);

    ['titulo','descricao','link','ordem'].forEach(field=>{
      el.querySelector(`[data-field="${field}"]`).value=
        item[field]??(field==='ordem'?index+1:'');
    });

    el.querySelector('[data-field="publicado"]').checked=item.publicado!==false;

    const up=el.querySelector('.move-up');
    const down=el.querySelector('.move-down');

    up.disabled=index===0;
    down.disabled=index===items.length-1;

    up.onclick=()=>moveItem(id,-1);
    down.onclick=()=>moveItem(id,1);

    el.querySelector('.remove').onclick=()=>{
      sync();
      items=items.filter(video=>video.id!==id);
      normalizeOrder();
      render();
      setStatus('Vídeo removido da lista. Clique em “Publicar alterações” para salvar.','ok');
    };

    el.querySelector('[data-field="ordem"]').onchange=event=>{
      applyManualOrder(id,event.target.value);
    };

    el.querySelector('[data-field="titulo"]').oninput=event=>{
      el.querySelector('.editor-title').textContent=event.target.value||'NOVO VÍDEO';
    };

    list.appendChild(el);
  });
};

const load=async()=>{
  setStatus('Carregando...');

  try{
    items=await api();
    items=items.map(item=>({...item,id:item.id||crypto.randomUUID()}));
    render();
    setStatus('Portfólio carregado.','ok');
  }catch(error){
    setStatus(error.message,'error');

    if(error.message.includes('Senha')){
      sessionStorage.removeItem('107_admin_password');
      app.hidden=true;
      loginCard.hidden=false;
    }
  }
};

loginBtn.onclick=async()=>{
  password=passwordInput.value;
  loginStatus.textContent='Entrando...';

  try{
    await api();
    sessionStorage.setItem('107_admin_password',password);
    loginCard.hidden=true;
    app.hidden=false;
    loginStatus.textContent='';
    load();
  }catch(error){
    loginStatus.textContent=error.message;
    loginStatus.className='status error';
  }
};

document.querySelector('#new-video').onclick=()=>{
  sync();
  items.sort((a,b)=>(a.ordem||999)-(b.ordem||999));
  items.push({
    id:crypto.randomUUID(),
    categoria:BASE_CATEGORIES[0],
    titulo:'',
    descricao:'',
    link:'',
    ordem:items.length+1,
    publicado:true
  });
  normalizeOrder();
  render();
  window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'});
};

document.querySelector('#reload').onclick=load;

document.querySelector('#publish').onclick=async(event)=>{
  sync();
  items.sort((a,b)=>(a.ordem||999)-(b.ordem||999));
  normalizeOrder();

  const invalid=items.find(item=>!item.categoria||!item.titulo||!item.link);

  if(invalid){
    return setStatus(
      'Preencha categoria, título e link em todos os vídeos. Para categoria nova, digite o nome no campo abaixo da seleção.',
      'error'
    );
  }

  event.target.disabled=true;
  setStatus('Publicando no GitHub...');

  try{
    await api('POST',{
      items,
      message:'Atualiza portfólio pelo painel 107'
    });
    setStatus('Publicado. A Vercel vai atualizar o site em instantes.','ok');
  }catch(error){
    setStatus(error.message,'error');
  }finally{
    event.target.disabled=false;
  }
};

if(password){
  loginCard.hidden=true;
  app.hidden=false;
  load();
}
