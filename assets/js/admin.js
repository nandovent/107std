const loginCard=document.querySelector('#login-card');
const app=document.querySelector('#admin-app');
const passwordInput=document.querySelector('#password');
const loginBtn=document.querySelector('#login');
const loginStatus=document.querySelector('#login-status');
const statusEl=document.querySelector('#status');
const list=document.querySelector('#video-list');
const tpl=document.querySelector('#video-template');
const categoryFilter=document.querySelector('#category-filter');
const categorySummary=document.querySelector('#category-summary');

const BASE_CATEGORIES=['Filmes Institucionais','Videoclipes'];
const NEW_CATEGORY_VALUE='__nova_categoria__';
const ALL_CATEGORIES='__todas__';

let items=[];
let password=sessionStorage.getItem('107_admin_password')||'';
let activeCategory=ALL_CATEGORIES;

const setStatus=(msg,type='')=>{statusEl.textContent=msg;statusEl.className='status '+type};

const api=async(method='GET',body)=>{
  const response=await fetch('/api/portfolio',{method,headers:{'Content-Type':'application/json','x-admin-password':password},body:body?JSON.stringify(body):undefined});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||'Erro na API');
  return data;
};

const getCategories=()=>{
  const fromItems=items.map(item=>String(item.categoria||'').trim()).filter(Boolean);
  return [...new Set([...BASE_CATEGORIES,...fromItems])].sort((a,b)=>{
    const ai=BASE_CATEGORIES.indexOf(a),bi=BASE_CATEGORIES.indexOf(b);
    if(ai>=0||bi>=0){if(ai<0)return 1;if(bi<0)return -1;return ai-bi}
    return a.localeCompare(b,'pt-BR');
  });
};

const refreshCategoryFilter=()=>{
  const categories=getCategories();
  const previous=activeCategory;
  categoryFilter.innerHTML='<option value="__todas__">Todas as categorias</option>';
  categories.forEach(category=>{const option=document.createElement('option');option.value=category;option.textContent=category;categoryFilter.appendChild(option)});
  activeCategory=previous===ALL_CATEGORIES||categories.includes(previous)?previous:ALL_CATEGORIES;
  categoryFilter.value=activeCategory;
  const count=activeCategory===ALL_CATEGORIES?items.length:items.filter(item=>item.categoria===activeCategory).length;
  categorySummary.textContent=activeCategory===ALL_CATEGORIES?`Todas as categorias · ${count} vídeo${count===1?'':'s'}`:`${activeCategory} · ${count} vídeo${count===1?'':'s'}`;
};

const selectedCategory=editor=>{
  const select=editor.querySelector('[data-field="categoria"]');
  const input=editor.querySelector('[data-field="nova-categoria"]');
  return select.value===NEW_CATEGORY_VALUE?input.value.trim():select.value.trim();
};

const readEditor=el=>({
  id:el.dataset.id||crypto.randomUUID(),
  categoria:selectedCategory(el),
  titulo:el.querySelector('[data-field="titulo"]').value.trim(),
  descricao:el.querySelector('[data-field="descricao"]').value.trim(),
  link:el.querySelector('[data-field="link"]').value.trim(),
  ordem:Number(el.querySelector('[data-field="ordem"]').value||1),
  publicado:el.querySelector('[data-field="publicado"]').checked
});

const syncVisible=()=>{
  const visible=[...list.querySelectorAll('.video-editor')].map(readEditor);
  const byId=new Map(visible.map(item=>[item.id,item]));
  items=items.map(item=>byId.get(item.id)||item);
};

const normalizeCategoryOrder=category=>{
  items.filter(item=>item.categoria===category).sort((a,b)=>(a.ordem||999)-(b.ordem||999)).forEach((item,index)=>item.ordem=index+1);
};
const normalizeAllOrders=()=>getCategories().forEach(normalizeCategoryOrder);

const shownItems=()=>{
  const selected=activeCategory===ALL_CATEGORIES?items:items.filter(item=>item.categoria===activeCategory);
  return [...selected].sort((a,b)=>a.categoria===b.categoria?(a.ordem||999)-(b.ordem||999):a.categoria.localeCompare(b.categoria,'pt-BR'));
};

const moveItem=(id,direction)=>{
  syncVisible();
  const item=items.find(video=>video.id===id);
  if(!item)return;
  const categoryItems=items.filter(video=>video.categoria===item.categoria).sort((a,b)=>(a.ordem||999)-(b.ordem||999));
  const index=categoryItems.findIndex(video=>video.id===id),target=index+direction;
  if(index<0||target<0||target>=categoryItems.length)return;
  [categoryItems[index],categoryItems[target]]=[categoryItems[target],categoryItems[index]];
  categoryItems.forEach((video,position)=>video.ordem=position+1);
  render();
  setStatus('Ordem alterada dentro da categoria. Clique em “Publicar alterações” para salvar.','ok');
};

const applyManualOrder=(id,newOrder)=>{
  syncVisible();
  const item=items.find(video=>video.id===id);
  if(!item)return;
  const categoryItems=items.filter(video=>video.categoria===item.categoria).sort((a,b)=>(a.ordem||999)-(b.ordem||999));
  const currentIndex=categoryItems.findIndex(video=>video.id===id);
  if(currentIndex<0)return;
  const [moved]=categoryItems.splice(currentIndex,1);
  categoryItems.splice(Math.max(0,Math.min(categoryItems.length,Number(newOrder||1)-1)),0,moved);
  categoryItems.forEach((video,position)=>video.ordem=position+1);
  render();
  setStatus('Posição alterada dentro da categoria. Clique em “Publicar alterações” para salvar.','ok');
};

const setupCategoryField=(editor,item)=>{
  const select=editor.querySelector('[data-field="categoria"]');
  const newField=editor.querySelector('.new-category-field');
  const newInput=editor.querySelector('[data-field="nova-categoria"]');
  const categories=getCategories(),current=String(item.categoria||'').trim();
  select.innerHTML='';
  categories.forEach(category=>{const option=document.createElement('option');option.value=category;option.textContent=category;select.appendChild(option)});
  const newOption=document.createElement('option');newOption.value=NEW_CATEGORY_VALUE;newOption.textContent='+ Cadastrar nova categoria';select.appendChild(newOption);
  if(current&&categories.includes(current)){select.value=current;newField.hidden=true;newInput.value=''}
  else if(current){select.value=NEW_CATEGORY_VALUE;newField.hidden=false;newInput.value=current}
  else{select.value=activeCategory!==ALL_CATEGORIES?activeCategory:(categories[0]||BASE_CATEGORIES[0]);newField.hidden=true;newInput.value=''}
  select.onchange=()=>{const isNew=select.value===NEW_CATEGORY_VALUE;newField.hidden=!isNew;if(isNew)newInput.focus();else newInput.value=''};
};

const render=()=>{
  list.innerHTML='';
  normalizeAllOrders();
  refreshCategoryFilter();
  const shown=shownItems();
  if(!shown.length){list.innerHTML='<div class="admin-empty"><strong>Nenhum vídeo nesta categoria.</strong><span>Clique em “+ Novo vídeo” para cadastrar o primeiro.</span></div>';return}
  shown.forEach((item,index)=>{
    const el=tpl.content.firstElementChild.cloneNode(true),id=item.id||crypto.randomUUID();
    item.id=id;el.dataset.id=id;
    el.querySelector('.editor-title').textContent=item.titulo||'NOVO VÍDEO';
    el.querySelector('.position-badge').textContent=String(item.ordem||index+1).padStart(2,'0');
    setupCategoryField(el,item);
    ['titulo','descricao','link','ordem'].forEach(field=>el.querySelector(`[data-field="${field}"]`).value=item[field]??(field==='ordem'?index+1:''));
    el.querySelector('[data-field="publicado"]').checked=item.publicado!==false;
    const categoryItems=items.filter(video=>video.categoria===item.categoria).sort((a,b)=>(a.ordem||999)-(b.ordem||999));
    const categoryIndex=categoryItems.findIndex(video=>video.id===id);
    const up=el.querySelector('.move-up'),down=el.querySelector('.move-down');
    up.disabled=categoryIndex===0;down.disabled=categoryIndex===categoryItems.length-1;
    up.onclick=()=>moveItem(id,-1);down.onclick=()=>moveItem(id,1);
    el.querySelector('.remove').onclick=()=>{syncVisible();items=items.filter(video=>video.id!==id);normalizeCategoryOrder(item.categoria);render();setStatus('Vídeo removido da lista. Clique em “Publicar alterações” para salvar.','ok')};
    el.querySelector('[data-field="ordem"]').onchange=event=>applyManualOrder(id,event.target.value);
    el.querySelector('[data-field="titulo"]').oninput=event=>el.querySelector('.editor-title').textContent=event.target.value||'NOVO VÍDEO';
    list.appendChild(el);
  });
};

const load=async()=>{
  setStatus('Carregando...');
  try{items=await api();items=items.map(item=>({...item,id:item.id||crypto.randomUUID()}));normalizeAllOrders();render();setStatus('Portfólio carregado.','ok')}
  catch(error){setStatus(error.message,'error');if(error.message.includes('Senha')){sessionStorage.removeItem('107_admin_password');app.hidden=true;loginCard.hidden=false}}
};

loginBtn.onclick=async()=>{
  password=passwordInput.value;loginStatus.textContent='Entrando...';
  try{await api();sessionStorage.setItem('107_admin_password',password);loginCard.hidden=true;app.hidden=false;loginStatus.textContent='';load()}
  catch(error){loginStatus.textContent=error.message;loginStatus.className='status error'}
};

categoryFilter.onchange=()=>{syncVisible();activeCategory=categoryFilter.value;render()};

document.querySelector('#new-video').onclick=()=>{
  syncVisible();
  const category=activeCategory!==ALL_CATEGORIES?activeCategory:(getCategories()[0]||BASE_CATEGORIES[0]);
  const categoryCount=items.filter(item=>item.categoria===category).length;
  items.push({id:crypto.randomUUID(),categoria:category,titulo:'',descricao:'',link:'',ordem:categoryCount+1,publicado:true});
  activeCategory=category;render();window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'});
};

document.querySelector('#reload').onclick=load;

document.querySelector('#publish').onclick=async event=>{
  syncVisible();normalizeAllOrders();
  if(items.find(item=>!item.categoria||!item.titulo||!item.link))return setStatus('Preencha categoria, título e link em todos os vídeos.','error');
  event.target.disabled=true;setStatus('Publicando no GitHub...');
  try{await api('POST',{items,message:'Atualiza portfólio pelo painel 107'});setStatus('Publicado. A Vercel vai atualizar o site em instantes.','ok')}
  catch(error){setStatus(error.message,'error')}
  finally{event.target.disabled=false}
};

if(password){loginCard.hidden=true;app.hidden=false;load()}
