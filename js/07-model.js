/* ============================================================
   MODULE 07 — MODEL (СИСТЕМЫ)
   Из каталога (SYSTEM_ITEMS) + своих систем (store.customSystems) строится модель систем:
   индексы, обратные связи, «волны» постройки (что нужно сделать раньше), проверки каталога.
   Модель сцен (комнат/зданий) строится отдельно, в 08-store.js, из чтения проекта —
   у неё нет статического каталога, она вся приходит из data/rooms и data/buildings.
   ============================================================ */

let store={status:{},steps:{},notes:{},customSystems:{},settings:{}};
let SYSTEMS=[], SYS_BY_ID=new Map();
let REL={neededBy:new Map()};   // id → [id] систем, которые требуют эту систему раньше
let WAVES=[];                    // WAVES[n] = [system…]
let PLAN_PROBLEMS=[];            // {level, code, id, msg}

function normalizeSystem(raw,custom){
  const it=Object.assign({p:1,req:[],reads:[],autoload:null,path:'',blocksScenes:false,note:''},raw);
  it.custom=!!custom; it.kind='system'; it.key='sys:'+it.id;
  if(!Array.isArray(it.req)) it.req=[];
  if(!Array.isArray(it.reads)) it.reads=[];
  const g=GROUP_BY_ID().get(it.g); it.layer=g?g.layer:0;
  it.search=[it.id,it.n,it.g,it.why,it.fn,it.path,(it.req||[]).join(' ')].join(' ').toLowerCase();
  return it;
}

function buildModel(){
  SYSTEMS=[]; SYS_BY_ID=new Map(); PLAN_PROBLEMS=[];
  const seen=new Set();
  SYSTEM_ITEMS.forEach(r=>{ const it=normalizeSystem(r,false); if(seen.has(it.id)) PLAN_PROBLEMS.push({level:'err',code:'ID_DUP',id:it.id,msg:'Повторяется id в каталоге систем.'}); seen.add(it.id); SYSTEMS.push(it); SYS_BY_ID.set(it.id,it); });
  Object.values(store.customSystems||{}).forEach(r=>{ const it=normalizeSystem(r,true); if(SYS_BY_ID.has(it.id)){ PLAN_PROBLEMS.push({level:'err',code:'ID_DUP',id:it.id,msg:'Своя система повторяет id системы каталога.'}); return; } SYSTEMS.push(it); SYS_BY_ID.set(it.id,it); });

  REL={neededBy:new Map()};
  SYSTEMS.forEach(i=>{ REL.neededBy.set(i.id,[]); });
  SYSTEMS.forEach(i=>{ i.req.forEach(r=>{ if(REL.neededBy.has(r)) REL.neededBy.get(r).push(i.id); }); });

  // волны: 0 — ничего не требует; иначе 1 + максимум по требованиям
  const memo=new Map(), stack=new Set(); let cyc=new Set();
  function wave(id){
    if(memo.has(id)) return memo.get(id);
    if(stack.has(id)){ cyc.add(id); return 0; }
    stack.add(id);
    const it=SYS_BY_ID.get(id); let w=0;
    it.req.forEach(r=>{ if(SYS_BY_ID.has(r)&&r!==id) w=Math.max(w,wave(r)+1); });
    stack.delete(id); memo.set(id,w); return w;
  }
  SYSTEMS.forEach(i=>{ i.wave=wave(i.id); i.cyclic=cyc.has(i.id); });
  WAVES=[]; SYSTEMS.forEach(i=>{ (WAVES[i.wave]=WAVES[i.wave]||[]).push(i); });
  for(let k=0;k<WAVES.length;k++) if(!WAVES[k]) WAVES[k]=[];

  checkPlan(cyc);
}

function checkPlan(cyc){
  const add=(level,code,id,msg)=>PLAN_PROBLEMS.push({level,code,id,msg});
  const groups=GROUP_BY_ID();
  SYSTEMS.forEach(i=>{
    if(!/^[a-z0-9_\-]+$/.test(i.id)) add('warn','ID_SLUG',i.id,'id должен состоять из a-z, 0-9, _ и - (как имя файла Godot-скрипта).');
    if(!groups.has(i.g)) add('err','GROUP',i.id,`Раздела «${i.g}» нет в словаре (02-vocab.js).`);
    if(!i.custom){
      if(!i.why) add('warn','NO_WHY',i.id,'Не написано, зачем нужна система.');
      if(!i.fn) add('warn','NO_FN',i.id,'Не описано, что система делает.');
      if(!i.path) add('info','NO_PATH',i.id,'Не указан предполагаемый путь скрипта.');
    }
    i.req.forEach(r=>{ if(!SYS_BY_ID.has(r)) add('err','REQ_MISSING',i.id,`req: системы «${r}» нет в каталоге.`); if(r===i.id) add('err','REQ_SELF',i.id,'Система требует сама себя.'); });
    if(i.cyclic) add('err','CYCLE',i.id,'Система участвует в цикле требований (req) — волны постройки не определены.');
  });
}
