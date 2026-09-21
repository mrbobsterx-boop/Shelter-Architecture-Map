/* ============================================================
   MODULE 10 — VIEW: ОБЗОР
   ============================================================ */

function nextSystems(n){
  return SYSTEMS.filter(i=>!['done','skip'].includes(statusOf(i))&&blockedBy(i).length===0).sort((a,b)=>a.p-b.p||a.wave-b.wave).slice(0,n);
}
function nextScenes(n){
  return SCENES.filter(i=>!['done','skip'].includes(statusOf(i))).sort((a,b)=>a.kind.localeCompare(b.kind)||a.id.localeCompare(b.id)).slice(0,n);
}
function progressByLayer(list){
  const rows=[];
  for(let l=1;l<=8;l++){
    const groups=SYS_GROUPS.filter(g=>g.layer===l);
    const items=list.filter(i=>groups.some(g=>g.id===i.g));
    if(!items.length) continue;
    const c=totals(items);
    rows.push({l,name:LAYERS[l],c,total:items.length});
  }
  return rows;
}

VIEW_RENDERERS.overview=function(){
  const blockers=blockingSystems();
  const banner=blockers.length?`<div class="blockedbanner">⛔ Сцены рано собирать «по-настоящему»: не готовы фундаментальные системы — ${blockers.map(b=>lnk(b.key)).join(', ')}. Сначала мост данных и фундамент движка (слой 1), потом сцены.</div>`:'';

  const layerRows=progressByLayer(SYSTEMS).map(r=>`
    <div class="grouphead click" data-act="filter" data-view="systems" data-which="sys" data-fk="g" data-fv="">
      <b>Слой ${r.l} · ${esc(r.name)}</b>
      <span class="muted">${r.c.done}/${r.total} готово</span>
      ${progressBar(r.c.done,r.total-r.c.skip)}
    </div>`).join('');

  const nextSysRows=nextSystems(8).map(i=>`
    <div class="reqrow"><span class="nm">${lnk(i.key)}</span>${prioBadge(i.p)}${badge(groupName(i.g))}</div>`).join('')||'<div class="empty">Все доступные системы уже готовы или отложены.</div>';

  const nextScnRows=blockers.length?'':(nextScenes(8).map(i=>`
    <div class="reqrow"><span class="nm">${kindTag(i.kind)}${lnk(i.key,i.name)}</span>${statusBadge(i)}</div>`).join('')||'<div class="empty">Все сцены готовы (или проект не подключён).</div>');

  return `
    <div class="toolbar"><h2>Обзор</h2></div>
    ${banner}
    <div class="two">
      <div class="card"><div class="cardhead"><b>Что делать дальше — системы</b></div><div class="cardbody">${nextSysRows}</div></div>
      <div class="card"><div class="cardhead"><b>Что делать дальше — сцены</b></div><div class="cardbody">${blockers.length?'<div class="muted">Сначала закрой блокирующие системы выше.</div>':nextScnRows}</div></div>
    </div>
    <div class="card"><div class="cardhead"><b>Слои разработки (системы)</b></div><div class="cardbody">${layerRows}</div></div>
  `;
};
