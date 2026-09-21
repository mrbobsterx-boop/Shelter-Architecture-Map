/* ============================================================
   MODULE 13 — VIEW: КАРТОЧКА (система или сцена — определяется по префиксу ключа)
   ============================================================ */

function backBtn(){ return `<button data-act="back">← Назад</button>`; }
function statusSelect(item){
  const cur=store.status[item.key]||'auto';
  const opt=(v,label)=>`<option value="${esc(v)}" ${v===cur?'selected':''}>${esc(label)}</option>`;
  return `<select data-status="${esc(item.key)}">${opt('auto','Авто (по шагам)')}${STATUSES.map(s=>opt(s.id,s.name)).join('')}</select>`;
}
function stepsBlock(item){
  const list=stepList(item);
  return `<div class="steps">${list.map(s=>{
    const auto=autoStepDone(item,s.id), man=stepManual(item,s.id), done=auto||man;
    return `<label><input type="checkbox" class="chk" data-item="${esc(item.key)}" data-step="${esc(s.id)}" ${done?'checked':''} ${auto?'disabled':''}>${esc(s.label)}${auto?' <span class="auto">✓ найдено в проекте</span>':''}</label>`;
  }).join('')}</div>`;
}
function noteBlock(item){
  return `<label>Заметка</label><textarea data-note="${esc(item.key)}" placeholder="свободный текст…">${esc(store.notes[item.key]||'')}</textarea>`;
}

function systemCard(i){
  const usedBy=(REL.neededBy.get(i.id)||[]);
  const blocked=blockedBy(i);
  return `${backBtn()}
    <div class="toolbar"><h2>${esc(i.n)}</h2>${prioBadge(i.p)}${statusBadge(i)}${i.blocksScenes?badge('блокирует сцены','warn'):''}${i.custom?badge('своя','new'):''}</div>
    <div class="two">
      <div class="card"><div class="cardhead"><b>Что и зачем</b></div><div class="cardbody">${kv([
        ['Зачем нужна',esc(i.why)],['Что делает',esc(i.fn)],['Раздел',esc(groupName(i.g))+' (слой '+i.layer+')'],
        ['Путь скрипта',`<code>${esc(i.path||'—')}</code>`],['Autoload',i.autoload?`<code>${esc(i.autoload)}</code>`:'не синглтон'],
        ['Читает',i.reads&&i.reads.length?tags(i.reads):'—'],['Открытый вопрос',i.note?esc(i.note):'—']
      ])}</div></div>
      <div class="card"><div class="cardhead"><b>Отметка и статус</b></div><div class="cardbody">${statusSelect(i)}<div style="margin-top:10px">${noteBlock(i)}</div></div></div>
    </div>
    <div class="two">
      <div class="card"><div class="cardhead"><b>Сначала сделай (${i.req.length})</b></div><div class="cardbody">${i.req.length?i.req.map(r=>{
        const q=SYS_BY_ID.get(r); if(!q) return `<div class="reqrow err">req: «${esc(r)}» не найдена</div>`;
        return `<div class="reqrow"><span class="nm">${lnk(q.key)}</span>${statusBadge(q)}</div>`;
      }).join(''):'<div class="muted">Ни от чего не зависит — можно начинать в первую очередь.</div>'}</div></div>
      <div class="card"><div class="cardhead"><b>От неё зависят (${usedBy.length})</b></div><div class="cardbody">${usedBy.length?usedBy.map(id=>{
        const q=SYS_BY_ID.get(id); return `<div class="reqrow"><span class="nm">${lnk(q.key)}</span>${statusBadge(q)}</div>`;
      }).join(''):'<div class="muted">Пока никто не требует.</div>'}</div></div>
    </div>
    ${blocked.length?`<div class="blockedbanner">Не готовы требования: ${blocked.map(r=>lnk(SYS_BY_ID.get(r).key)).join(', ')}</div>`:''}
    <div class="card"><div class="cardhead"><b>Шаги готовности</b></div><div class="cardbody">${stepsBlock(i)}</div></div>
    ${i.custom?`<button data-act="remove-custom" data-id="${esc(i.id)}">🗑 Удалить свою систему</button>`:''}
  `;
}

function sceneKV(i){
  if(i.kind==='room') return kv([
    ['Тип комнаты',esc(i.type||'—')],['Размер',i.widthM+' × '+i.heightM+' м'],
    ['Объектов (instances)',fmt(i.instCount)],['Дверей',fmt(i.doorCount)],['Свет',i.hasLight?'есть':'нет'],
    ['Блоки (грунт/стены)',i.hasBlocks?'есть':'нет'],['Фоновых слоёв',fmt(i.bgCount)],
    ['Роль в здании',esc(i.compositionRole||'—')],['Лестничных точек',fmt(i.stairCount)],
    ['Файл',`<code>${esc(i.sourceFile)}</code>`],
    ['.tscn в проекте',PROJECT.tscnById.has(i.id)?`<code>${esc(PROJECT.tscnById.get(i.id))}</code>`:'не найден']
  ]);
  return kv([
    ['Режим',esc(i.layoutMode)],['Комнат в составе',fmt(i.roomsCount)],['Связей дверей',fmt(i.doorLinkCount)],
    ['Случайных слотов',fmt(i.slotCount)],['Этажей',fmt(i.floorCount)],['Фоновых слоёв',fmt(i.bgCount)],
    ['Файл',`<code>${esc(i.sourceFile)}</code>`],
    ['.tscn в проекте',PROJECT.tscnById.has(i.id)?`<code>${esc(PROJECT.tscnById.get(i.id))}</code>`:'не найден']
  ]);
}
function sceneCard(i){
  const blockers=blockingSystems();
  return `${backBtn()}
    <div class="toolbar"><h2>${kindTag(i.kind)}${esc(i.name)}</h2>${statusBadge(i)}</div>
    ${blockers.length?`<div class="blockedbanner">⛔ Ждёт фундамент движка: ${blockers.map(b=>lnk(b.key)).join(', ')}</div>`:''}
    <div class="two">
      <div class="card"><div class="cardhead"><b>Данные из проекта</b></div><div class="cardbody">${sceneKV(i)}</div></div>
      <div class="card"><div class="cardhead"><b>Отметка и статус</b></div><div class="cardbody">${statusSelect(i)}<div style="margin-top:10px">${noteBlock(i)}</div></div></div>
    </div>
    <div class="card"><div class="cardhead"><b>Шаги готовности сцены в Godot</b></div><div class="cardbody">${stepsBlock(i)}</div></div>
  `;
}

VIEW_RENDERERS.card=function(key){
  const it=itemByKey(key);
  if(!it) return backBtn()+`<div class="empty">Не найдено: ${esc(key)}</div>`;
  return it.kind==='system'?systemCard(it):sceneCard(it);
};
