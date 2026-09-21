/* ============================================================
   MODULE 11 — VIEW: СИСТЕМЫ (чек-лист движка)
   ============================================================ */

function filteredSystems(){
  const f=ui.fSys, q=(f.search||'').trim().toLowerCase();
  return SYSTEMS.filter(i=>
    (!f.g||i.g===f.g) && (f.p===''||f.p===undefined||i.p===Number(f.p)) &&
    (!f.status||statusOf(i)===f.status) && (!q||i.search.indexOf(q)!==-1)
  );
}
function systemRow(i){
  const st=stepStats(i), blocked=blockedBy(i);
  return `<tr class="click" data-item="${esc(i.key)}">
    <td><input type="checkbox" class="chk" data-check="${esc(i.key)}" ${isDone(i)?'checked':''} onclick="event.stopPropagation()"></td>
    <td>${prioBadge(i.p)}</td>
    <td class="namecell"><b>${esc(i.n)}</b>${i.custom?badge('своя','new'):''}</td>
    <td>${esc(groupName(i.g))}</td>
    <td>${blocked.length?`<span class="warn small">ждёт: ${blocked.length}</span>`:'<span class="ok small">можно</span>'}</td>
    <td>${st.done}/${st.total}${progressBar(st.done,st.total)}</td>
    <td>${statusBadge(i)}</td>
  </tr>`;
}
function renderSystemsBody(){
  const list=filteredSystems();
  const groups=SYS_GROUPS.filter(g=>list.some(i=>i.g===g.id));
  if(!groups.length) return '<div class="empty">Ничего не найдено под текущие фильтры.</div>';
  return groups.map(g=>{
    const items=list.filter(i=>i.g===g.id).sort((a,b)=>a.p-b.p||a.n.localeCompare(b.n));
    const done=items.filter(isDone).length;
    return `<div class="card">
      <div class="grouphead"><b>Слой ${g.layer} · ${esc(g.name)}</b><span class="muted">${done}/${items.length}</span>${progressBar(done,items.length)}</div>
      <div class="cardbody" style="padding:0">
        ${table(['','P','Система','Раздел','Готовность к старту','Шаги','Статус'],items.map(systemRow))}
      </div>
    </div>`;
  }).join('');
}
function systemsFilterBar(){
  const f=ui.fSys;
  const opt=(v,label,cur)=>`<option value="${esc(v)}" ${v===cur?'selected':''}>${esc(label)}</option>`;
  return `<div class="filters">
    <div><label>Слой/раздел</label><select data-f="g" data-which="sys">
      ${opt('','Все разделы',f.g)}${SYS_GROUPS.map(g=>opt(g.id,'Слой '+g.layer+' · '+g.name,f.g)).join('')}
    </select></div>
    <div><label>Приоритет</label><select data-f="p" data-which="sys">
      ${opt('','Все',f.p)}${PRIORITIES.map(p=>opt(String(p.id),p.label,f.p)).join('')}
    </select></div>
    <div><label>Статус</label><select data-f="status" data-which="sys">
      ${opt('','Все',f.status)}${STATUSES.map(s=>opt(s.id,s.name,f.status)).join('')}
    </select></div>
    <div><label>Поиск</label><input class="search" data-f="search" data-which="sys" value="${esc(f.search)}" placeholder="имя, id, путь…"></div>
  </div>`;
}
VIEW_RENDERERS.systems=function(){
  return `<div class="toolbar"><h2>Системы (движок Godot)</h2></div>
    ${systemsFilterBar()}
    <div id="systemsBody" style="margin-top:12px">${renderSystemsBody()}</div>`;
};
REFRESH.systems=function(){ const el=document.getElementById('systemsBody'); if(el) el.innerHTML=renderSystemsBody(); updateSidebar(); };
