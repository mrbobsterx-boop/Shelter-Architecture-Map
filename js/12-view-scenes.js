/* ============================================================
   MODULE 12 — VIEW: СЦЕНЫ (чек-лист комнат и зданий из проекта)
   Список целиком приходит из data/rooms и data/buildings — своего каталога у сцен нет.
   ============================================================ */

function filteredScenes(){
  const f=ui.fScn, q=(f.search||'').trim().toLowerCase();
  return SCENES.filter(i=>
    (!f.kind||i.kind===f.kind) && (!f.status||statusOf(i)===f.status) &&
    (!q||(i.id+' '+i.name+' '+(i.type||'')).toLowerCase().indexOf(q)!==-1)
  );
}
function sceneRow(i){
  const st=stepStats(i);
  return `<tr class="click" data-item="${esc(i.key)}">
    <td><input type="checkbox" class="chk" data-check="${esc(i.key)}" ${isDone(i)?'checked':''} onclick="event.stopPropagation()"></td>
    <td>${kindTag(i.kind)}</td>
    <td class="namecell"><b>${esc(i.name)}</b> <span class="muted small">${esc(i.id)}</span></td>
    <td>${esc(i.kind==='room'?(i.type||'—'):i.layoutMode)}</td>
    <td>${st.done}/${st.total}${progressBar(st.done,st.total)}</td>
    <td>${statusBadge(i)}</td>
  </tr>`;
}
function renderScenesBody(){
  if(!PROJECT.scanned) return '<div class="empty">Подключи папку проекта — список комнат и зданий читается из data/rooms и data/buildings.</div>';
  const blockers=blockingSystems();
  const banner=blockers.length?`<div class="blockedbanner">⛔ Ждёт фундамент движка: ${blockers.map(b=>lnk(b.key)).join(', ')}. Чек-лист ниже всё равно можно вести — просто помни, что «по-настоящему» он заработает только после этих систем.</div>`:'';
  const list=filteredScenes();
  if(!list.length) return banner+'<div class="empty">Ничего не найдено под текущие фильтры (или в проекте нет комнат/зданий).</div>';
  const groups=[['room','Комнаты'],['building','Здания и улицы']];
  return banner+groups.map(([kind,label])=>{
    const items=list.filter(i=>i.kind===kind).sort((a,b)=>a.id.localeCompare(b.id));
    if(!items.length) return '';
    const done=items.filter(isDone).length;
    return `<div class="card">
      <div class="grouphead"><b>${esc(label)}</b><span class="muted">${done}/${items.length}</span>${progressBar(done,items.length)}</div>
      <div class="cardbody" style="padding:0">
        ${table(['','Тип','Название','Подтип/режим','Шаги','Статус'],items.map(sceneRow))}
      </div>
    </div>`;
  }).join('');
}
function scenesFilterBar(){
  const f=ui.fScn;
  const opt=(v,label,cur)=>`<option value="${esc(v)}" ${v===cur?'selected':''}>${esc(label)}</option>`;
  return `<div class="filters">
    <div><label>Тип</label><select data-f="kind" data-which="scn">
      ${opt('','Комнаты и здания',f.kind)}${opt('room','Только комнаты',f.kind)}${opt('building','Только здания/улицы',f.kind)}
    </select></div>
    <div><label>Статус</label><select data-f="status" data-which="scn">
      ${opt('','Все',f.status)}${STATUSES.map(s=>opt(s.id,s.name,f.status)).join('')}
    </select></div>
    <div><label>Поиск</label><input class="search" data-f="search" data-which="scn" value="${esc(f.search)}" placeholder="имя, id, тип…"></div>
  </div>`;
}
VIEW_RENDERERS.scenes=function(){
  return `<div class="toolbar"><h2>Сцены (комнаты и здания)</h2></div>
    ${scenesFilterBar()}
    <div id="scenesBody" style="margin-top:12px">${renderScenesBody()}</div>`;
};
REFRESH.scenes=function(){ const el=document.getElementById('scenesBody'); if(el) el.innerHTML=renderScenesBody(); updateSidebar(); };
