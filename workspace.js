(() => {
  "use strict";
  const app = window.ForjaApp;
  if (!app) return;
  const $ = (q,r=document)=>r.querySelector(q);
  const $$=(q,r=document)=>[...r.querySelectorAll(q)];
  const esc=v=>app.escapeHtml(String(v??""));
  const els={
    finderBtn:$("#globalFinderBtn"),finderDialog:$("#globalFinderDialog"),finderInput:$("#globalFinderInput"),finderResults:$("#globalFinderResults"),undoBtn:$("#undoBtn"),
    trashList:$("#trashList"),trashClear:$("#trashClearBtn"),settingsBtn:$("#settingsBtn"),
    sessionScene:$("#sessionCurrentScene"),sessionMissions:$("#sessionActiveMissions"),sessionHistory:$("#sessionHistoryReady"),sessionCalendar:$("#sessionCalendar"),sessionRecent:$("#sessionRecent")
  };
  let lastSnapshot="";
  let undoStack=[];
  let lastCaptureAt=0;
  let suppressCapture=false;
  let restoring=false;
  function state(){return app.getState();}
  function profile(){return app.getProfile();}
  function campaignSnapshot(c=state()){try{return JSON.stringify(c);}catch(_){return"";}}
  function captureBeforeSave(current){
    if(suppressCapture||restoring)return;
    const snap=campaignSnapshot(current);if(!snap)return;
    if(!lastSnapshot){lastSnapshot=snap;return;}
    if(snap===lastSnapshot)return;
    const t=Date.now();
    if(t-lastCaptureAt>900){undoStack.push(lastSnapshot);if(undoStack.length>30)undoStack.shift();lastCaptureAt=t;}
    lastSnapshot=snap;updateUndoButton();
  }
  function updateUndoButton(){if(els.undoBtn)els.undoBtn.disabled=!undoStack.length;}
  function undo(){
    const snap=undoStack.pop();if(!snap)return;let raw;try{raw=JSON.parse(snap);}catch(_){return;}
    suppressCapture=true;restoring=true;
    try{
      const p=profile();const idx=p.campaigns.findIndex(c=>c.id===state().id);if(idx<0)return;
      const restored=app.normaliseCampaign(raw,raw.campaignName||"Campaña");restored.id=state().id;p.campaigns[idx]=restored;p.activeCampaignId=restored.id;app.replaceProfile(p);lastSnapshot=campaignSnapshot(app.getState());
    }finally{suppressCapture=false;restoring=false;updateUndoButton();}
  }

  function trash(){const s=state();if(!Array.isArray(s.trash))s.trash=[];return s.trash;}
  function pushTrash(kind,label,payload){trash().push({id:app.uid(),kind:String(kind||"unknown"),label:String(label||"Elemento eliminado"),payload:app.clone(payload||{}),deletedAt:app.now()});if(trash().length>40)trash().splice(0,trash().length-40);app.saveState();renderTrash();}
  function kindLabel(kind){return({notebookEntry:"Cuaderno",worldCreature:"Criatura",worldOrganisation:"Organización",worldCharacter:"Personaje",historyEvent:"Historia",historyChapter:"Capítulo",atlasMarker:"Marcador",atlasScene:"Escena",diaryMission:"Misión",milestone:"Hito"})[kind]||"Elemento";}
  function restoreTrashItem(item){
    const s=state(),p=item.payload||{};let ok=false;
    if(item.kind==="diaryMission")ok=window.ForjaDiary?.restoreMission?.(p)||false;
    else if(item.kind==="milestone")ok=window.ForjaDiary?.restoreMilestone?.(p)||false;
    else if(item.kind==="notebookEntry"){
      const list=Array.isArray(p.entries)?p.entries:(p.entry?[p.entry]:[]);list.forEach(e=>{if(!s.entries.some(x=>x.id===e.id))s.entries.push(e);});ok=Boolean(list.length);
    } else if(item.kind==="worldCreature"&&p.item){s.world.creatures||=[];if(!s.world.creatures.some(x=>x.id===p.item.id))s.world.creatures.push(p.item);ok=true;}
    else if(item.kind==="worldOrganisation"&&p.item){s.world.organisations||=[];if(!s.world.organisations.some(x=>x.id===p.item.id))s.world.organisations.push(p.item);ok=true;}
    else if(item.kind==="worldCharacter"&&p.item){s.world.characters||=[];if(!s.world.characters.some(x=>x.id===p.item.id))s.world.characters.push(p.item);if(Array.isArray(p.members))p.members.forEach(({orgId,member})=>{const org=s.world.organisations?.find(o=>o.id===orgId);if(org&&!org.members.some(m=>m.id===member.id))org.members.push(member);});ok=true;}
    else if(item.kind==="historyEvent"&&p.event){s.history.events||=[];if(!s.history.events.some(x=>x.id===p.event.id))s.history.events.push(p.event);ok=true;}
    else if(item.kind==="historyChapter"&&p.chapter){s.history.chapters||=[];if(!s.history.chapters.some(x=>x.id===p.chapter.id))s.history.chapters.push(p.chapter);(p.events||[]).forEach(e=>{if(!s.history.events.some(x=>x.id===e.id))s.history.events.push(e);});(p.missionIds||[]).forEach(id=>{const m=s.diary?.missions?.find(x=>x.id===id);if(m)m.chapterId=p.chapter.id;});(p.entryIds||[]).forEach(id=>{const e=s.entries?.find(x=>x.id===id);if(e)e.chapterId=p.chapter.id;});ok=true;}
    else if(item.kind==="atlasMarker"&&p.marker&&p.sceneId){const scene=s.atlas?.scenes?.find(x=>x.id===p.sceneId);if(scene&&!scene.markers.some(x=>x.id===p.marker.id)){scene.markers.push(p.marker);ok=true;}}
    else if(item.kind==="atlasScene"&&Array.isArray(p.scenes)){s.atlas.scenes||=[];p.scenes.forEach(sc=>{if(!s.atlas.scenes.some(x=>x.id===sc.id))s.atlas.scenes.push(sc);});ok=p.scenes.length>0;}
    if(ok){s.trash=s.trash.filter(x=>x.id!==item.id);app.saveState(true);app.render();window.ForjaHistory?.render?.();window.ForjaDiary?.render?.();window.ForjaWorld?.render?.();window.ForjaAtlas?.render?.();renderTrash();}
  }
  function renderTrash(){if(!els.trashList)return;els.trashList.replaceChildren();const list=trash().slice().reverse();if(!list.length){els.trashList.innerHTML='<p class="panel__hint">La papelera está vacía.</p>';return;}list.forEach(item=>{const row=document.createElement('div');row.className='trash-item';row.innerHTML=`<div><strong>${esc(item.label)}</strong><small>${esc(kindLabel(item.kind))} · ${esc(new Date(item.deletedAt).toLocaleString('es-ES'))}</small></div><button class="button button--quiet" type="button">Restaurar</button>`;row.querySelector('button').addEventListener('click',()=>restoreTrashItem(item));els.trashList.append(row);});}

  function finderItems(){
    const s=state(),items=[];
    (s.entries||[]).forEach(e=>items.push({kind:'Cuaderno',icon:'☷',title:e.name,sub:e.type,open:()=>{app.setView('notebook');app.selectEntryForPanel?.(e.id);}}));
    (s.diary?.missions||[]).forEach(m=>{items.push({kind:'Misión',icon:m.type==='main'?'★':m.type==='task'?'☑':'◆',title:m.title,sub:(s.history?.chapters||[]).find(c=>c.id===m.chapterId)?.title||'Sin capítulo',open:()=>window.ForjaDiary?.openMission?.(m.id)});(m.milestones||[]).forEach(h=>items.push({kind:'Hito',icon:'◇',title:h.title,sub:m.title,open:()=>window.ForjaDiary?.openMission?.(m.id)}));});
    (s.history?.events||[]).forEach(e=>items.push({kind:'Historia',icon:'⌁',title:e.title,sub:(s.history?.chapters||[]).find(c=>c.id===e.chapterId)?.title||'',open:()=>window.ForjaDiary?.openHistoryEvent?.(e.id)}));
    (s.world?.creatures||[]).forEach(x=>items.push({kind:'Criatura',icon:'◆',title:x.name,sub:x.type||'Bestiario',open:()=>window.ForjaWorld?.openReference?.('creature',x.id)}));
    (s.world?.characters||[]).forEach(x=>items.push({kind:'Personaje',icon:'●',title:x.name,sub:x.type||'Mundo',open:()=>window.ForjaWorld?.openReference?.('character',x.id)}));
    (s.world?.organisations||[]).forEach(x=>items.push({kind:'Organización',icon:'⚑',title:x.name,sub:x.headquarters||'Mundo',open:()=>window.ForjaWorld?.openReference?.('organisation',x.id)}));
    (s.atlas?.scenes||[]).forEach(sc=>{items.push({kind:'Escena',icon:'⌖',title:sc.name,sub:'Atlas',open:()=>{app.setView('atlas');window.ForjaAtlas?.setScene?.(sc.id);}});(sc.markers||[]).forEach(m=>items.push({kind:'Marcador',icon:'📍',title:m.name||m.alias||'Marcador',sub:sc.name,open:()=>{app.setView('atlas');window.ForjaAtlas?.setScene?.(sc.id);setTimeout(()=>window.ForjaAtlas?.openMarkerDialog?.(sc.id,m.id),0);}}));});
    return items;
  }
  function renderFinder(){if(!els.finderResults)return;const q=(els.finderInput.value||'').trim().toLocaleLowerCase('es');const items=finderItems().filter(x=>!q||`${x.title} ${x.sub} ${x.kind}`.toLocaleLowerCase('es').includes(q)).slice(0,80);els.finderResults.replaceChildren();if(!items.length){els.finderResults.innerHTML='<p class="panel__hint">Sin resultados.</p>';return;}items.forEach(x=>{const b=document.createElement('button');b.type='button';b.className='global-finder-result';b.innerHTML=`<span>${x.icon}</span><div><strong>${esc(x.title)}</strong><small>${esc(x.kind)}${x.sub?` · ${esc(x.sub)}`:''}</small></div>`;b.addEventListener('click',()=>{els.finderDialog.close();x.open();});els.finderResults.append(b);});}
  function openFinder(){els.finderDialog.showModal();els.finderInput.value='';renderFinder();setTimeout(()=>els.finderInput.focus(),0);}

  function renderSession(){
    if(!$("#sessionView"))return;const s=state();const scene=s.atlas?.scenes?.find(x=>x.id===s.atlas.currentSceneId)||s.atlas?.scenes?.[0];
    if(els.sessionScene)els.sessionScene.innerHTML=scene?`<div class="session-scene-name"><span>⌖</span><div><strong>${esc(scene.name)}</strong><small>${(scene.markers||[]).length} marcadores · ${(scene.objects||[]).length} elementos</small></div></div>`:'<p class="panel__hint">Sin escena.</p>';
    const missions=(s.diary?.missions||[]).filter(m=>['active','info','available'].includes(window.ForjaDiary?.effectiveStatus?.(m)||m.status)).slice(0,8);if(els.sessionMissions){els.sessionMissions.replaceChildren();if(!missions.length)els.sessionMissions.innerHTML='<p class="panel__hint">No hay misiones abiertas.</p>';missions.forEach(m=>{const b=document.createElement('button');b.type='button';b.className='session-list-item';const st=window.ForjaDiary?.effectiveStatus?.(m)||m.status;b.innerHTML=`<span>${m.type==='main'?'★':m.type==='task'?'☑':'◆'}</span><div><strong>${esc(m.title)}</strong><small>${st==='info'?'◐ Falta información':st==='active'?'▶ En curso':'○ Disponible'}</small></div>`;b.addEventListener('click',()=>window.ForjaDiary?.openMission?.(m.id));els.sessionMissions.append(b);});}
    const events=(s.history?.events||[]).filter(e=>['available','inProgress'].includes(e.status)).slice(0,8);if(els.sessionHistory){els.sessionHistory.replaceChildren();if(!events.length)els.sessionHistory.innerHTML='<p class="panel__hint">No hay nodos disponibles.</p>';events.forEach(e=>{const b=document.createElement('button');b.type='button';b.className='session-list-item';b.innerHTML=`<span>${e.status==='inProgress'?'▶':'○'}</span><div><strong>${esc(e.title)}</strong><small>${esc((s.history.chapters||[]).find(c=>c.id===e.chapterId)?.title||'Historia')}</small></div>`;b.addEventListener('click',()=>window.ForjaDiary?.openHistoryEvent?.(e.id));els.sessionHistory.append(b);});}
    const day=Number(s.gameCalendar?.currentDay)||1;if(els.sessionCalendar)els.sessionCalendar.innerHTML=`<div class="session-day"><strong>Día ${day}</strong><span>de campaña</span></div>`;
    const recent=[];
    (s.entries||[]).forEach(e=>recent.push({at:e.updatedAt||e.createdAt||'',icon:({locations:'✥',organisations:'⚜',creatures:'♞',quests:'⚑',things:'♦'})[e.type]||'☷',title:e.name,sub:'Cuaderno',open:()=>{app.setView('notebook');app.selectEntryForPanel?.(e.id);}}));
    (s.diary?.missions||[]).forEach(m=>recent.push({at:m.updatedAt||m.createdAt||'',icon:m.type==='main'?'★':m.type==='task'?'☑':'◆',title:m.title,sub:'Diario · Misión',open:()=>window.ForjaDiary?.openMission?.(m.id)}));
    (s.world?.characters||[]).forEach(x=>recent.push({at:x.updatedAt||x.createdAt||'',icon:'●',title:x.name,sub:'Mundo · Personaje',open:()=>window.ForjaWorld?.openReference?.('character',x.id)}));
    (s.world?.creatures||[]).forEach(x=>recent.push({at:x.updatedAt||x.createdAt||'',icon:'◆',title:x.name,sub:'Mundo · Criatura',open:()=>window.ForjaWorld?.openReference?.('creature',x.id)}));
    (s.atlas?.scenes||[]).forEach(sc=>recent.push({at:sc.updatedAt||sc.createdAt||'',icon:'⌖',title:sc.name,sub:'Atlas · Escena',open:()=>{app.setView('atlas');window.ForjaAtlas?.setScene?.(sc.id);}}));
    recent.sort((a,b)=>String(b.at).localeCompare(String(a.at)));
    if(els.sessionRecent){els.sessionRecent.replaceChildren();const items=recent.slice(0,10);if(!items.length)els.sessionRecent.innerHTML='<p class="panel__hint">Sin actividad reciente.</p>';items.forEach(e=>{const b=document.createElement('button');b.type='button';b.className='session-recent-item';b.innerHTML=`<span>${e.icon}</span><div><strong>${esc(e.title)}</strong><small>${esc(e.sub)}</small></div>`;b.addEventListener('click',e.open);els.sessionRecent.append(b);});}
  }

  function bind(){
    els.finderBtn?.addEventListener('click',openFinder);$('.global-finder-close')?.addEventListener('click',()=>els.finderDialog.close());els.finderInput?.addEventListener('input',renderFinder);els.undoBtn?.addEventListener('click',undo);updateUndoButton();
    document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openFinder();}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!e.shiftKey&&!['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)){e.preventDefault();undo();}});
    els.settingsBtn?.addEventListener('click',()=>setTimeout(renderTrash,0));els.trashClear?.addEventListener('click',()=>{if(!trash().length)return;if(confirm('¿Vaciar la papelera reciente?')){state().trash=[];app.saveState(true);renderTrash();}});
    $$('[data-session-view]').forEach(b=>b.addEventListener('click',()=>app.setView(b.dataset.sessionView)));$('[data-session-open-atlas]')?.addEventListener('click',()=>app.setView('atlas'));$('[data-session-open-missions]')?.addEventListener('click',()=>{app.setView('history');window.ForjaDiary?.setSection?.('missions');});$('[data-session-open-history]')?.addEventListener('click',()=>{app.setView('history');window.ForjaDiary?.setSection?.('history');});$('[data-session-open-calendar]')?.addEventListener('click',()=>app.setView('calendar'));$('[data-session-search]')?.addEventListener('click',openFinder);
    document.addEventListener('forja:campaignchange',()=>{lastSnapshot='';undoStack=[];updateUndoButton();renderSession();renderTrash();});document.addEventListener('forja:diarychange',()=>{if(state().view==='session')renderSession();});document.addEventListener('forja:historychange',()=>{if(state().view==='session')renderSession();});
  }
  bind();renderTrash();lastSnapshot=campaignSnapshot(state());updateUndoButton();
  window.ForjaWorkspace={captureBeforeSave,undo,pushTrash,renderTrash,renderSession,openFinder};
})();
