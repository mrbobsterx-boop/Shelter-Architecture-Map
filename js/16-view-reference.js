/* ============================================================
   MODULE 16 — VIEW: СПРАВОЧНИКИ, ПРОВЕРКИ ПЛАНА, СВОИ СИСТЕМЫ
   ============================================================ */

function dictionariesBlock(){
  const groupRows=SYS_GROUPS.map(g=>{
    const items=SYSTEMS.filter(i=>i.g===g.id);
    return `<tr class="click" data-act="filter" data-view="systems" data-which="sys" data-fk="g" data-fv="${esc(g.id)}">
      <td>${g.layer}</td><td><b>${esc(g.name)}</b></td><td>${items.length}</td><td class="muted">${esc(g.desc)}</td></tr>`;
  }).join('');
  const stepRows=(defs,label)=>`<div class="card"><div class="cardhead"><b>${label}</b></div><div class="cardbody">
    ${defs.map(s=>`<div class="reqrow"><span class="nm"><code>${esc(s.id)}</code> — ${esc(s.label)}</span></div>`).join('')}
  </div></div>`;
  return `
    <div class="card"><div class="cardhead"><b>Слои и разделы каталога систем</b></div><div class="cardbody" style="padding:0">
      ${table(['Слой','Раздел','Систем','Описание'],[groupRows])}
    </div></div>
    <div class="two">
      ${stepRows(SYS_STEP_DEFS,'Шаги готовности системы')}
      ${stepRows(ROOM_STEP_DEFS,'Шаги готовности сцены-комнаты')}
    </div>
    ${stepRows(BUILDING_STEP_DEFS,'Шаги готовности сцены-здания/улицы')}
  `;
}

function checksBlock(){
  const lvl={err:'Ошибки',warn:'Предупреждения',info:'К сведению'};
  const rows=['err','warn','info'].map(level=>{
    const list=PLAN_PROBLEMS.filter(p=>p.level===level);
    if(!list.length) return '';
    return `<div class="card"><div class="cardhead"><b>${lvl[level]} (${list.length})</b></div><div class="cardbody">
      ${list.map(p=>`<div class="problem ${level}"><b>${esc(p.code)}</b> — ${SYS_BY_ID.has(p.id)?lnk(SYS_BY_ID.get(p.id).key,p.id):esc(p.id)}: ${esc(p.msg)}</div>`).join('')}
    </div></div>`;
  }).join('');
  return rows||'<div class="empty">Проблем в каталоге систем не найдено.</div>';
}

function customSystemsBlock(){
  const list=SYSTEMS.filter(i=>i.custom);
  const rows=list.length?list.map(i=>`<div class="reqrow"><span class="nm">${lnk(i.key)}</span>${statusBadge(i)}<button data-act="remove-custom" data-id="${esc(i.id)}">🗑</button></div>`).join(''):'<div class="muted">Своих систем пока нет.</div>';
  return `<div class="card"><div class="cardhead"><b>Добавить свою систему</b></div><div class="cardbody">
    <form id="customSysForm" class="row" style="align-items:flex-end">
      <div><label>id (a-z0-9_-)</label><input name="id" required style="width:160px"></div>
      <div><label>Название</label><input name="n" required style="width:200px"></div>
      <div><label>Раздел</label><select name="g">${SYS_GROUPS.map(g=>`<option value="${esc(g.id)}">Слой ${g.layer} · ${esc(g.name)}</option>`).join('')}</select></div>
      <div><label>Приоритет</label><select name="p">${PRIORITIES.map(p=>`<option value="${p.id}">${p.label}</option>`).join('')}</select></div>
      <div><label>Путь скрипта</label><input name="path" placeholder="res://…" style="width:200px"></div>
      <button type="submit" class="primary">+ Добавить</button>
    </form>
    <div style="margin-top:10px">${rows}</div>
  </div></div>`;
}

VIEW_RENDERERS.reference=function(){
  return `<div class="toolbar"><h2>Справочники и проверки</h2></div>
    ${dictionariesBlock()}
    <h3 style="margin:18px 0 8px">Проверки каталога систем</h3>
    ${checksBlock()}
    <h3 style="margin:18px 0 8px">Свои системы</h3>
    ${customSystemsBlock()}`;
};
document.addEventListener('submit',e=>{
  // e.target.id не годится: форма отдаёт названный элемент <input name="id"> вместо своего id-атрибута.
  if(!e.target.matches || !e.target.matches('#customSysForm')) return;
  e.preventDefault();
  const f=new FormData(e.target);
  const id=String(f.get('id')||'').trim().toLowerCase().replace(/[^a-z0-9_-]/g,'');
  if(!id) return;
  addCustomSystem({id,n:f.get('n')||id,g:f.get('g'),p:Number(f.get('p')||1),path:f.get('path')||'',why:'',fn:'',req:[],reads:[],autoload:null,blocksScenes:false});
  rerender();
});
