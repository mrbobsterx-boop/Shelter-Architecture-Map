/* ============================================================
   MODULE 09 — UI CORE
   Разделы, карточка (системы или сцены), «Назад», общие блоки разметки, делегирование событий.
   Разделы регистрируются в модулях 10–16: VIEW_RENDERERS[id] = () => html.
   Элементы адресуются составным ключом: 'sys:<id>' — система, 'room:<id>' / 'bld:<id>' — сцена.
   Клики: data-item (открыть карточку по ключу), data-view (раздел), data-act (действие).
   ============================================================ */

const VIEWS=[
  {id:'overview',title:'Обзор'},{id:'systems',title:'Системы'},{id:'scenes',title:'Сцены'},
  {id:'roadmap',title:'Порядок постройки'},{id:'project',title:'Сверка с проектом'},{id:'reference',title:'Справочники и проверки'}
];
const VIEW_RENDERERS={};
const REFRESH={};   // частичная перерисовка раздела при смене фильтров: REFRESH[view]()
const ui={view:'overview',item:null,stack:[],fSys:{g:'',p:'',status:'',search:''},fScn:{kind:'',status:'',search:''}};

function itemByKey(key){
  if(!key) return null;
  if(key.indexOf('sys:')===0) return SYS_BY_ID.get(key.slice(4))||null;
  return SCENE_BY_KEY.get(key)||null;
}

/* ---------- разметка ---------- */
function lnk(key,label){
  const it=itemByKey(key), text=esc(label===undefined?(it?(it.n||it.name):key):label);
  return it?`<a class="lnk" data-item="${esc(key)}" title="${esc(key)}">${text}</a>`:`<span class="lnk bad" title="Нет в плане">${text}</span>`;
}
function badge(text,cls){ return `<span class="badge ${cls||''}">${esc(text)}</span>`; }
function prioBadge(p){ return `<span class="prio p${p}" title="${esc((PRIORITIES.find(x=>x.id===p)||{}).name||'')}">P${p}</span>`; }
function groupName(id){ const g=SYS_GROUPS.find(x=>x.id===id); return g?g.name:id; }
function kindTag(kind){ return `<span class="kindtag ${kind}">${kind==='room'?'комната':(kind==='building'?'здание':'система')}</span>`; }
function statusBadge(item){
  const st=statusOf(item), name=(STATUSES.find(s=>s.id===st)||{}).name||st;
  return `<span class="st ${st}">${esc(name)}</span>`+(statusIsAuto(item)&&st!=='todo'?' <span class="muted small" title="Определено автоматически по шагам и проекту">авто</span>':'');
}
function progressBar(done,total,cls){ return `<div class="bar"><i class="${cls||''}" style="width:${pct(done,total)}%"></i></div>`; }
function card(title,body,head){ return `<div class="card"><div class="cardhead"><b>${title}</b>${head||''}</div><div class="cardbody">${body}</div></div>`; }
function kv(rows){ return '<div class="kv">'+rows.map(([k,v])=>`<div>${esc(k)}</div><div>${(v===undefined||v===null||v==='')?'—':v}</div>`).join('')+'</div>'; }
function table(head,rows,empty){ return `<table><thead><tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')||`<tr><td colspan="${head.length}" class="empty">${empty||'Ничего нет.'}</td></tr>`}</tbody></table>`; }
function chipLink(view,fk,fv,label){ return `<span class="chip" data-act="filter" data-view="${esc(view)}" data-fk="${esc(fk)}" data-fv="${esc(fv)}">${esc(label)}</span>`; }
function tags(list,cls){ return (list||[]).map(t=>`<span class="tag ${cls||''}">${esc(t)}</span>`).join(''); }

/* ---------- навигация ---------- */
function openItem(key){ ui.stack.push({view:ui.view,item:ui.item}); ui.item=key; render(); document.getElementById('content').scrollTop=0; }
function goBack(){ const p=ui.stack.pop(); if(p){ ui.view=p.view; ui.item=p.item; } else ui.item=null; render(); }
function gotoView(view,filters,which){
  ui.stack=[]; ui.item=null; ui.view=view;
  if(which==='sys') ui.fSys=Object.assign({g:'',p:'',status:'',search:''},filters||{});
  if(which==='scn') ui.fScn=Object.assign({kind:'',status:'',search:''},filters||{});
  render(); document.getElementById('content').scrollTop=0;
}
function renderNav(){
  const bad=PLAN_PROBLEMS.filter(p=>p.level==='err').length;
  const cnt={systems:SYSTEMS.length,scenes:SCENES.length,roadmap:WAVES.length,project:PROJECT.scanned?(SCENES.length):'',reference:PLAN_PROBLEMS.filter(p=>p.level!=='info').length};
  document.getElementById('navList').innerHTML=VIEWS.map(v=>{
    const n=cnt[v.id]; const err=(v.id==='reference'&&bad);
    return `<button class="navbtn${(!ui.item&&ui.view===v.id)?' active':''}" data-view="${v.id}">${esc(v.title)}<span class="cnt${err?' err':''}">${n===undefined||n===''?'':fmt(n)}</span></button>`;
  }).join('');
}
function totals(list){ const c={done:0,wip:0,todo:0,skip:0}; list.forEach(i=>c[statusOf(i)]++); return c; }
function updateSidebar(){
  const cs=totals(SYSTEMS), sysTotal=SYSTEMS.length, sysActive=sysTotal-cs.skip;
  const set=(id,v)=>{ const el=document.getElementById(id); if(el) el.textContent=fmt(v); };
  set('sysDone',cs.done); set('sysWip',cs.wip); set('sysTodo',cs.todo); set('sysTotal',sysTotal);
  const sb=document.getElementById('sysBar'); if(sb) sb.style.width=pct(cs.done,sysActive)+'%';
  const sp=document.getElementById('sysPct'); if(sp) sp.textContent=`${pct(cs.done,sysActive)} % готово`;

  const cc=totals(SCENES), scnTotal=SCENES.length, scnActive=scnTotal-cc.skip;
  set('scnDone',cc.done); set('scnWip',cc.wip); set('scnTodo',cc.todo); set('scnTotal',scnTotal);
  const cb=document.getElementById('scnBar'); if(cb) cb.style.width=pct(cc.done,scnActive)+'%';
  const cp=document.getElementById('scnPct'); if(cp) cp.textContent=scnTotal?`${pct(cc.done,scnActive)} % готово`:'подключи папку проекта';

  const ps=document.getElementById('projSummary');
  if(ps) ps.innerHTML=PROJECT.scanned?`Комнат: <b>${fmt(SCENES.filter(s=>s.kind==='room').length)}</b>, зданий: <b>${fmt(SCENES.filter(s=>s.kind==='building').length)}</b>. Автозагрузок Godot найдено: <b>${fmt(PROJECT.autoloads.size)}</b>.<br><span class="small">Сверка: ${PROJECT.at.toLocaleTimeString()}</span>`:'Папка не подключена. Комнаты и здания читаются из data/rooms и data/buildings, .tscn ищутся в папке сцен Godot.';
}
function render(){
  renderNav(); updateSidebar();
  const c=document.getElementById('content');
  try{ c.innerHTML=ui.item?(VIEW_RENDERERS.card?VIEW_RENDERERS.card(ui.item):''):((VIEW_RENDERERS[ui.view]||(()=>''))()); }
  catch(e){ console.error(e); c.innerHTML=`<div class="problem err">Ошибка отрисовки: ${esc(e.message)}</div>`; }
}
function rerender(){ const c=document.getElementById('content'), y=c.scrollTop; render(); c.scrollTop=y; }

/* ---------- события (делегирование) ---------- */
document.addEventListener('click',e=>{
  const it=e.target.closest('[data-item]');
  if(it&&!e.target.closest('input,select,textarea')){ openItem(it.dataset.item); return; }
  const nav=e.target.closest('.navbtn'); if(nav){ gotoView(nav.dataset.view); return; }
  const act=e.target.closest('[data-act]'); if(!act) return;
  const a=act.dataset.act;
  if(a==='back') goBack();
  else if(a==='view') gotoView(act.dataset.view);
  else if(a==='filter'){ const f={}; f[act.dataset.fk]=act.dataset.fv; gotoView(act.dataset.view,f,act.dataset.which); }
  else if(a==='mark-done'){ setStatus(act.dataset.key,'done'); rerender(); }
  else if(a==='scan') scanProject();
  else if(a==='remove-custom'){ if(confirm('Удалить свою систему?')){ removeCustomSystem(act.dataset.id); rerender(); } }
});
document.addEventListener('change',e=>{
  const t=e.target;
  if(t.matches('[data-check]')){ setStatus(t.dataset.check,t.checked?'done':'todo'); rerender(); return; }
  if(t.matches('[data-status]')){ setStatus(t.dataset.status,t.value==='auto'?null:t.value); rerender(); return; }
  if(t.matches('[data-step]')){ setStep(t.dataset.item,t.dataset.step,t.checked); rerender(); return; }
  if(t.matches('[data-settings]')){ store.settings[t.dataset.settings]=t.value; saveStore(); return; }
  if(t.matches('[data-f]')){
    if(t.tagName==='INPUT'&&t.type==='text') return;
    const which=t.dataset.which, f=which==='sys'?ui.fSys:ui.fScn;
    f[t.dataset.f]=(t.type==='checkbox')?(t.checked?'1':''):t.value; (REFRESH[ui.view]||rerender)(); return; }
});
document.addEventListener('input',e=>{
  const t=e.target;
  if(t.matches('[data-note]')){ setNote(t.dataset.note,t.value); return; }
  if(t.matches('[data-f="search"]')){ (t.dataset.which==='sys'?ui.fSys:ui.fScn).search=t.value; (REFRESH[ui.view]||rerender)(); }
});
