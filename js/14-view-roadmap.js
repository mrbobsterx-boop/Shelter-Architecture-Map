/* ============================================================
   MODULE 14 — VIEW: ПОРЯДОК ПОСТРОЙКИ (волны систем по req)
   ============================================================ */

function waveRow(i){
  return `<div class="reqrow"><span class="nm">${lnk(i.key)}${i.blocksScenes?badge('блокирует сцены','warn'):''}</span>${prioBadge(i.p)}${statusBadge(i)}</div>`;
}
function renderRoadmapBody(){
  const hidedone=ui.rhide==='0'?false:true;
  const onlyp0=ui.rprio==='1';
  return WAVES.map((items,idx)=>{
    let list=items.slice().sort((a,b)=>a.p-b.p||a.n.localeCompare(b.n));
    if(onlyp0) list=list.filter(i=>i.p===0);
    if(hidedone) list=list.filter(i=>!['done','skip'].includes(statusOf(i)));
    if(!list.length) return '';
    return `<div class="wave"><div class="wavehead">Волна ${idx} ${idx===0?'— ничего не требует (фундамент)':'— требует волну '+(idx-1)+' и ниже'}</div>${list.map(waveRow).join('')}</div>`;
  }).join('')||'<div class="empty">Под текущими фильтрами волн не осталось.</div>';
}
VIEW_RENDERERS.roadmap=function(){
  ui.rhide=ui.rhide===undefined?'1':ui.rhide; ui.rprio=ui.rprio||'';
  const cyc=SYSTEMS.filter(i=>i.cyclic);
  return `<div class="toolbar"><h2>Порядок постройки — системы</h2></div>
    <p class="muted">Волна 0 — системы, которые ни от чего не зависят (мост данных, фундамент движка). Дальше — то, что из них строится, по <code>req</code> каждой системы.</p>
    <div class="row" style="margin-bottom:10px">
      <label><input type="checkbox" data-f="rhide" data-which="sys" ${ui.rhide==='1'?'checked':''}> скрыть готовое/отложенное</label>
      <label><input type="checkbox" data-f="rprio" data-which="sys" ${ui.rprio==='1'?'checked':''}> только P0</label>
    </div>
    ${cyc.length?`<div class="problem err">Цикл в требованиях у: ${cyc.map(i=>lnk(i.key)).join(', ')} — волны для них не определены.</div>`:''}
    <div id="roadmapBody">${renderRoadmapBody()}</div>`;
};
REFRESH.roadmap=function(){
  ui.rhide=document.querySelector('[data-f="rhide"]')?.checked?'1':'0';
  ui.rprio=document.querySelector('[data-f="rprio"]')?.checked?'1':'0';
  const el=document.getElementById('roadmapBody'); if(el) el.innerHTML=renderRoadmapBody();
};
