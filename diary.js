(() => {
  "use strict";
  const app = window.ForjaApp;
  if (!app) return;
  const $ = (q, r=document) => r.querySelector(q);
  const $$ = (q, r=document) => [...r.querySelectorAll(q)];
  const esc = v => app.escapeHtml(String(v ?? ""));
  const TYPE_META = {
    main: { icon: "★", label: "Principal", cls: "main" },
    secondary: { icon: "◆", label: "Secundaria", cls: "secondary" },
    task: { icon: "☑", label: "Tarea / Recado", cls: "task" }
  };
  const STATUS_META = {
    undiscovered: { icon: "◌", label: "No descubierta", cls: "locked" },
    available: { icon: "○", label: "Disponible", cls: "available" },
    active: { icon: "▶", label: "En curso", cls: "active" },
    info: { icon: "◐", label: "Falta información", cls: "info" },
    completed: { icon: "✓", label: "Completada", cls: "completed" },
    failed: { icon: "×", label: "Fallida", cls: "failed" }
  };
  let editingMissionId = "";
  let editingMilestoneId = "";
  let editingMilestoneMissionId = "";
  let missionDraft = null;
  let milestoneDraft = null;

  const els = {
    historySection: $("#diaryHistorySection"), missionsSection: $("#diaryMissionsSection"), tabs: $$(".diary-tab"),
    chapterFilter: $("#missionChapterFilter"), typeFilter: $("#missionTypeFilter"), statusFilter: $("#missionStatusFilter"), list: $("#missionList"), detail: $("#missionDetail"), newBtn: $("#missionNewBtn"), templateBtn: $("#missionTemplateBtn"),
    dialog: $("#missionDialog"), form: $("#missionForm"), dialogTitle: $("#missionDialogTitle"), title: $("#missionTitle"), type: $("#missionType"), chapter: $("#missionChapter"), description: $("#missionDescription"), infoText: $("#missionInfoText"), allowEarly: $("#missionAllowEarly"), appearMode: $("#missionAppearMode"), continueMode: $("#missionContinueMode"), completeMode: $("#missionCompleteMode"), appearReq: $("#missionAppearRequirements"), continueReq: $("#missionContinueRequirements"), completeReq: $("#missionCompleteRequirements"), sceneRefs: $("#missionSceneRefs"), markerRefs: $("#missionMarkerRefs"), historyRefs: $("#missionHistoryRefs"), reward: $("#missionReward"), notes: $("#missionNotes"), deleteBtn: $("#missionDeleteBtn"), duplicateBtn: $("#missionDuplicateBtn"),
    milestoneDialog: $("#milestoneDialog"), milestoneForm: $("#milestoneForm"), milestoneDialogTitle: $("#milestoneDialogTitle"), milestoneTitle: $("#milestoneTitle"), milestoneDescription: $("#milestoneDescription"), milestoneOptional: $("#milestoneOptional"), milestoneSecret: $("#milestoneSecret"), milestoneReqMode: $("#milestoneRequirementMode"), milestoneReq: $("#milestoneRequirements"), milestoneScene: $("#milestoneScene"), milestoneMarker: $("#milestoneMarker"), milestoneHistory: $("#milestoneHistory"), milestoneInfoText: $("#milestoneInfoText"), milestoneDeleteBtn: $("#milestoneDeleteBtn"),
    templateDialog: $("#missionTemplateDialog")
  };

  function state() { return app.getState(); }
  function diary() {
    const s = state();
    if (!s.diary || typeof s.diary !== "object") s.diary = { selectedSection:"history", selectedMissionId:"", chapterFilter:"all", typeFilter:"all", statusFilter:"open", missions:[] };
    s.diary.missions ||= [];
    return s.diary;
  }
  function chapters() { return state().history?.chapters || []; }
  function missionById(id) { return diary().missions.find(m => m.id === id) || null; }
  function milestoneById(missionId, milestoneId) { return missionById(missionId)?.milestones?.find(h => h.id === milestoneId) || null; }
  function chapterName(id) { return chapters().find(c => c.id === id)?.title || "Sin capítulo"; }
  function allAtlasScenes() { return state().atlas?.scenes || []; }
  function sceneById(id) { return allAtlasScenes().find(s => s.id === id) || null; }
  function markerById(id) { for (const scene of allAtlasScenes()) { const marker = (scene.markers || []).find(m => m.id === id); if (marker) return { marker, scene }; } return null; }
  function historyEventById(id) { return state().history?.events?.find(e => e.id === id) || null; }
  function save(renderAfter=true) { app.saveState(true); if (renderAfter) render(); document.dispatchEvent(new CustomEvent("forja:diarychange")); }
  function now() { return app.now(); }

  function reqSatisfied(key) {
    const value = String(key || "");
    if (value.startsWith("m:")) return missionById(value.slice(2))?.status === "completed";
    if (value.startsWith("h:")) {
      const [, missionId, milestoneId] = value.split(":");
      return milestoneById(missionId, milestoneId)?.status === "completed";
    }
    if (value.startsWith("e:")) return historyEventById(value.slice(2))?.status === "occurred";
    return false;
  }
  function requirementsMet(list, mode="all") {
    const reqs = Array.isArray(list) ? list.filter(Boolean) : [];
    if (!reqs.length) return true;
    return mode === "any" ? reqs.some(reqSatisfied) : reqs.every(reqSatisfied);
  }
  function requirementLabel(key) {
    const value = String(key || "");
    if (value.startsWith("m:")) { const m = missionById(value.slice(2)); return m ? `${TYPE_META[m.type]?.icon || "⚑"} ${m.title}` : "Misión eliminada"; }
    if (value.startsWith("h:")) { const [, missionId, milestoneId] = value.split(":"); const m=missionById(missionId), h=milestoneById(missionId,milestoneId); return h ? `◇ ${m?.title || "Misión"} → ${h.title}` : "Hito eliminado"; }
    if (value.startsWith("e:")) { const e=historyEventById(value.slice(2)); return e ? `⌁ ${e.title}` : "Suceso eliminado"; }
    return value;
  }
  function effectiveStatus(m) {
    if (!m) return "undiscovered";
    if (["completed","failed"].includes(m.status)) return m.status;
    const appear = requirementsMet(m.appearRequirements, m.appearMode);
    const cont = requirementsMet(m.continueRequirements, m.continueMode);
    if (m.status === "undiscovered") return appear ? "available" : "undiscovered";
    if (m.status === "available") return appear ? "available" : (m.allowEarlyDiscovery ? "info" : "undiscovered");
    if (["active","info"].includes(m.status)) return cont && appear ? "active" : "info";
    return m.status;
  }
  function refreshAutomaticStates() {
    let changed=false;
    diary().missions.forEach(m => {
      if (m.status === "undiscovered" && requirementsMet(m.appearRequirements,m.appearMode)) { m.status="available"; changed=true; }
      if (m.status === "info" && requirementsMet(m.appearRequirements,m.appearMode) && requirementsMet(m.continueRequirements,m.continueMode)) { m.status="active"; changed=true; }
    });
    if (changed) app.saveState();
  }

  function htmlText(text) { return `<p>${esc(String(text || "")).replace(/\n/g,"<br>")}</p>`; }
  function syncMissionEntry(mission) {
    if (!mission) return null;
    let entry = state().entries.find(e => e.id === mission.entryId && e.type === "quests") || null;
    if (!entry) {
      entry = app.createNotebookEntry({ type:"quests", name: mission.title, subtype: mission.type === "task" ? "task" : mission.type, chapterId: mission.chapterId });
      mission.entryId = entry.id;
      app.saveState();
    }
    entry.name = mission.title;
    entry.subtype = mission.type === "task" ? "task" : mission.type;
    entry.chapterId = mission.chapterId || "";
    entry.descriptionMarkdown = mission.description || "";
    entry.descriptionHtml = htmlText(mission.description || "");
    entry.diaryMissionId = mission.id;
    entry.status = mission.status === "completed" ? "completed" : mission.status === "failed" ? "failed" : ["active","info"].includes(mission.status) ? "active" : "notStarted";
    entry.updatedAt = now();
    return entry;
  }
  function syncAllEntries() { diary().missions.forEach(syncMissionEntry); }

  function syncFromNotebookEntry(entry, fields = {}) {
    if (!entry?.diaryMissionId) return false;
    const mission = missionById(entry.diaryMissionId);
    if (!mission) return false;
    if (fields.name) mission.title = String(entry.name || mission.title || "Misión").slice(0,180);
    if (fields.description) mission.description = String(entry.descriptionMarkdown || "").slice(0,12000);
    if (fields.chapter) mission.chapterId = entry.chapterId || "";
    if (fields.subtype && ["main","secondary","task"].includes(entry.subtype)) mission.type = entry.subtype;
    if (fields.status) {
      if (entry.status === "completed") mission.status = "completed";
      else if (entry.status === "failed") mission.status = "failed";
      else if (entry.status === "active") mission.status = requirementsMet(mission.continueRequirements, mission.continueMode) && requirementsMet(mission.appearRequirements, mission.appearMode) ? "active" : (mission.allowEarlyDiscovery ? "info" : "undiscovered");
      else if (entry.status === "notStarted") mission.status = requirementsMet(mission.appearRequirements, mission.appearMode) ? "available" : "undiscovered";
    }
    mission.updatedAt = now();
    app.saveState();
    if (state().view === "history" && diary().selectedSection === "missions") renderMissions();
    window.ForjaWorkspace?.renderSession?.();
    return true;
  }

  function allAtlasMarkers() { return (state().atlas?.scenes || []).flatMap(scene => (scene.markers || []).map(marker => ({ scene, marker }))); }
  function syncAtlasReferencesForMission(mission) {
    if (!mission) return;
    const missionMarkerIds = new Set(mission.atlasMarkerIds || []);
    const milestoneMarker = new Map((mission.milestones || []).filter(h => h.atlasMarkerId).map(h => [h.id, h.atlasMarkerId]));
    allAtlasMarkers().forEach(({ marker }) => {
      marker.diaryRefs = Array.isArray(marker.diaryRefs) ? marker.diaryRefs.filter(ref => ref?.missionId) : [];
      const hasMissionRef = marker.diaryRefs.some(ref => ref.missionId === mission.id && !ref.milestoneId);
      if (missionMarkerIds.has(marker.id) && !hasMissionRef) marker.diaryRefs.push({ missionId: mission.id, milestoneId: "" });
      if (!missionMarkerIds.has(marker.id)) marker.diaryRefs = marker.diaryRefs.filter(ref => !(ref.missionId === mission.id && !ref.milestoneId));
      for (const h of mission.milestones || []) {
        const should = milestoneMarker.get(h.id) === marker.id;
        const has = marker.diaryRefs.some(ref => ref.missionId === mission.id && ref.milestoneId === h.id);
        if (should && !has) marker.diaryRefs.push({ missionId: mission.id, milestoneId: h.id });
        if (!should && has) marker.diaryRefs = marker.diaryRefs.filter(ref => !(ref.missionId === mission.id && ref.milestoneId === h.id));
      }
    });
  }

  function setSection(section) {
    diary().selectedSection = section === "missions" ? "missions" : "history";
    els.tabs.forEach(b => b.classList.toggle("is-active", b.dataset.diarySection === diary().selectedSection));
    if (els.historySection) els.historySection.hidden = diary().selectedSection !== "history";
    if (els.missionsSection) els.missionsSection.hidden = diary().selectedSection !== "missions";
    app.saveState();
    if (diary().selectedSection === "history") window.ForjaHistory?.render?.(); else renderMissions();
  }

  function renderChapterFilter() {
    const d=diary();
    const opts = `<option value="all">Todos los capítulos</option><option value="none">Sin capítulo</option>` + chapters().map(c=>`<option value="${esc(c.id)}">${esc(c.title)}</option>`).join("");
    els.chapterFilter.innerHTML=opts;
    els.chapterFilter.value=[...els.chapterFilter.options].some(o=>o.value===d.chapterFilter)?d.chapterFilter:"all";
    els.typeFilter.value=d.typeFilter||"all"; els.statusFilter.value=d.statusFilter||"open";
  }
  function missionMatchesFilters(m) {
    const d=diary();
    if (d.chapterFilter !== "all" && (d.chapterFilter === "none" ? Boolean(m.chapterId) : m.chapterId !== d.chapterFilter)) return false;
    if (d.typeFilter !== "all" && m.type !== d.typeFilter) return false;
    const st=effectiveStatus(m);
    if (d.statusFilter === "completed" && !["completed","failed"].includes(st)) return false;
    if (d.statusFilter === "info" && st !== "info") return false;
    if (d.statusFilter === "open" && ["completed","failed"].includes(st)) return false;
    return true;
  }
  function renderMissionList() {
    els.list.replaceChildren();
    const items=diary().missions.filter(missionMatchesFilters).sort((a,b)=>{
      const ca=chapters().findIndex(c=>c.id===a.chapterId), cb=chapters().findIndex(c=>c.id===b.chapterId);
      return (ca<0?999:ca)-(cb<0?999:cb) || ({main:0,secondary:1,task:2}[a.type]-{main:0,secondary:1,task:2}[b.type]) || a.title.localeCompare(b.title,"es");
    });
    if (!items.length) { els.list.innerHTML='<div class="mission-list-empty"><span>⚑</span><p>No hay misiones en esta vista.</p></div>'; return; }
    let lastChapter="__none";
    items.forEach(m=>{
      const chapter=m.chapterId||"";
      if(chapter!==lastChapter){const h=document.createElement("div");h.className="mission-list-chapter";h.textContent=chapterName(chapter);els.list.append(h);lastChapter=chapter;}
      const meta=TYPE_META[m.type], st=STATUS_META[effectiveStatus(m)];
      const b=document.createElement("button");b.type="button";b.className=`mission-list-item mission-list-item--${meta.cls}${diary().selectedMissionId===m.id?" is-active":""}`;
      b.innerHTML=`<span class="mission-list-item__type">${meta.icon}</span><span class="mission-list-item__copy"><strong>${esc(m.title)}</strong><small>${st.icon} ${st.label}${m.milestones?.length?` · ${m.milestones.filter(h=>h.status==="completed").length}/${m.milestones.length} hitos`:""}</small></span>`;
      b.addEventListener("click",()=>{diary().selectedMissionId=m.id;app.saveState();renderMissionList();renderMissionDetail();});els.list.append(b);
    });
  }

  function directChildMissions(missionId) { return diary().missions.filter(m => (m.appearRequirements||[]).includes(`m:${missionId}`)); }
  function parentMissions(m) { return (m.appearRequirements||[]).filter(x=>x.startsWith("m:")).map(x=>missionById(x.slice(2))).filter(Boolean); }
  function routeHtml(m) {
    const parents=parentMissions(m), children=directChildMissions(m.id);
    if(!parents.length && !children.length) return "";
    return `<section class="mission-route"><div class="mission-section-heading"><div><small>RUTA</small><h3>Cómo encaja en la campaña</h3></div></div><div class="mission-route-flow">${parents.length?`<div class="mission-route-group"><small>Viene de</small>${parents.map(p=>`<button type="button" data-open-mission="${esc(p.id)}">${TYPE_META[p.type].icon} ${esc(p.title)}</button>`).join("")}</div><span class="mission-route-arrow">→</span>`:""}<div class="mission-route-current">${TYPE_META[m.type].icon}<strong>${esc(m.title)}</strong></div>${children.length?`<span class="mission-route-arrow">→</span><div class="mission-route-group"><small>Puede abrir</small>${children.map(c=>`<button type="button" data-open-mission="${esc(c.id)}">${TYPE_META[c.type].icon} ${esc(c.title)}</button>`).join("")}</div>`:""}</div></section>`;
  }
  function requirementSummary(title,list,mode) {
    if(!list?.length)return"";
    return `<div class="mission-requirement-summary"><strong>${esc(title)}</strong><span>${mode==="any"?"Cualquiera":"Todos"}</span><div>${list.map(r=>`<span class="${reqSatisfied(r)?"is-met":""}">${reqSatisfied(r)?"✓":"○"} ${esc(requirementLabel(r))}</span>`).join("")}</div></div>`;
  }
  function referencesHtml(m) {
    const refs=[];
    (m.atlasSceneIds||[]).forEach(id=>{const s=sceneById(id);if(s)refs.push(`<button type="button" data-open-scene="${esc(id)}">⌖ ${esc(s.name)}</button>`);});
    (m.atlasMarkerIds||[]).forEach(id=>{const x=markerById(id);if(x)refs.push(`<button type="button" data-open-marker="${esc(id)}" data-scene="${esc(x.scene.id)}">📍 ${esc(x.marker.name||x.marker.alias||"Marcador")}</button>`);});
    (m.historyEventIds||[]).forEach(id=>{const e=historyEventById(id);if(e)refs.push(`<button type="button" data-open-history="${esc(id)}">⌁ ${esc(e.title)}</button>`);});
    return refs.length?`<section class="mission-links"><div class="mission-section-heading"><div><small>REFERENCIAS</small><h3>Campaña relacionada</h3></div></div><div class="mission-link-chips">${refs.join("")}</div></section>`:"";
  }
  function milestoneEffectiveStatus(h) {
    if(["completed","failed"].includes(h.status))return h.status;
    if(!requirementsMet(h.requirements,h.requirementMode))return h.status==="active"?"info":"info";
    return h.status==="info"?"active":h.status;
  }
  function milestoneHtml(m,h,index) {
    const st=milestoneEffectiveStatus(h); const refs=[];
    if(h.atlasSceneId&&sceneById(h.atlasSceneId))refs.push(`⌖ ${esc(sceneById(h.atlasSceneId).name)}`);
    const mk=h.atlasMarkerId?markerById(h.atlasMarkerId):null;if(mk)refs.push(`📍 ${esc(mk.marker.name||mk.marker.alias||"Marcador")}`);
    if(h.historyEventId&&historyEventById(h.historyEventId))refs.push(`⌁ ${esc(historyEventById(h.historyEventId).title)}`);
    return `<article class="mission-milestone milestone--${st}${h.optional?" is-optional":""}${h.secret?" is-secret":""}"><div class="mission-milestone__rail"><span>${h.status==="completed"?"✓":st==="info"?"?":index+1}</span></div><div class="mission-milestone__content"><div class="mission-milestone__head"><div><small>${h.optional?"OPCIONAL":"HITO"}${h.secret?" · SECRETO":""}</small><h4>${esc(h.title)}</h4></div><button type="button" class="icon-button" data-edit-milestone="${esc(h.id)}" title="Editar hito">✎</button></div>${h.description?`<p>${esc(h.description)}</p>`:""}${st==="info"?`<div class="mission-info-callout">◐ ${esc(h.infoText||"No tienes suficiente información para comprenderlo todavía.")}</div>`:""}${h.requirements?.length?`<div class="milestone-reqs">${h.requirements.map(r=>`<span class="${reqSatisfied(r)?"is-met":""}">${reqSatisfied(r)?"✓":"○"} ${esc(requirementLabel(r))}</span>`).join("")}</div>`:""}${refs.length?`<div class="milestone-refs">${refs.map(x=>`<span>${x}</span>`).join("")}</div>`:""}<div class="mission-milestone__actions">${h.status!=="completed"?`<button type="button" class="button button--quiet" data-milestone-action="active" data-milestone-id="${esc(h.id)}">▶ En curso</button><button type="button" class="button" data-milestone-action="completed" data-milestone-id="${esc(h.id)}">✓ Completar</button>`:`<button type="button" class="button button--quiet" data-milestone-action="pending" data-milestone-id="${esc(h.id)}">↺ Reabrir</button>`}</div></div></article>`;
  }

  function missionPanelHtml(m, {atlas=false, milestoneId=""}={}) {
    const stKey=effectiveStatus(m), st=STATUS_META[stKey], meta=TYPE_META[m.type];
    const selectedMilestone = milestoneId ? milestoneById(m.id,milestoneId) : null;
    const milestones = selectedMilestone ? [selectedMilestone] : (m.milestones||[]);
    return `<article class="mission-sheet ${atlas?"mission-sheet--atlas":""}"><header class="mission-sheet__hero"><div><p class="mission-sheet__kicker">${meta.icon} ${meta.label} · ${esc(chapterName(m.chapterId))}</p><h2>${esc(m.title)}</h2><span class="mission-status mission-status--${st.cls}">${st.icon} ${st.label}</span></div>${atlas?"":`<div class="mission-sheet__hero-actions"><button type="button" class="button button--quiet" data-edit-mission>✎ Editar</button><button type="button" class="button button--quiet" data-open-notebook="${esc(m.entryId||"")}">☷ Cuaderno</button></div>`}</header>${m.description?`<section class="mission-document"><h3>Descripción</h3><p>${esc(m.description).replace(/\n/g,"<br>")}</p></section>`:""}${stKey==="info"?`<div class="mission-info-callout mission-info-callout--large">◐ ${esc(m.infoText||"No tienes suficiente información para entenderlo todavía.")}</div>`:""}<section class="mission-state-actions"><button type="button" class="button button--quiet" data-mission-action="start">▶ ${stKey==="undiscovered"?"Descubrir":"Iniciar / continuar"}</button><button type="button" class="button" data-mission-action="complete">✓ Completar misión</button><button type="button" class="button button--quiet" data-mission-action="fail">× Fallar</button><button type="button" class="button button--quiet" data-mission-action="reset">↺ Reabrir</button></section>${requirementSummary("Para aparecer",m.appearRequirements,m.appearMode)}${requirementSummary("Para continuar",m.continueRequirements,m.continueMode)}${requirementSummary("Para completar",m.completeRequirements,m.completeMode)}${atlas?"":routeHtml(m)}<section class="mission-milestones"><div class="mission-section-heading"><div><small>PROGRESO</small><h3>Hitos</h3></div>${atlas?"":'<button type="button" class="button button--quiet" data-add-milestone>+ Hito</button>'}</div>${milestones.length?milestones.map((h,i)=>milestoneHtml(m,h,i)).join(""):'<div class="mission-empty-milestones">Esta misión todavía no tiene hitos.</div>'}</section>${referencesHtml(m)}${m.reward?`<section class="mission-document"><h3>Recompensa / resultado</h3><p>${esc(m.reward).replace(/\n/g,"<br>")}</p></section>`:""}${!atlas&&m.notes?`<section class="mission-document mission-document--dm"><h3>Notas DM</h3><p>${esc(m.notes).replace(/\n/g,"<br>")}</p></section>`:""}</article>`;
  }

  function bindMissionPanel(root,m) {
    root.querySelector('[data-edit-mission]')?.addEventListener('click',()=>openMissionEditor(m.id));
    root.querySelector('[data-add-milestone]')?.addEventListener('click',()=>openMilestoneEditor(m.id));
    root.querySelector('[data-open-notebook]')?.addEventListener('click',()=>{ if(m.entryId){app.setView('notebook');app.selectEntryForPanel?.(m.entryId);} });
    root.querySelectorAll('[data-open-mission]').forEach(b=>b.addEventListener('click',()=>openMission(b.dataset.openMission)));
    root.querySelectorAll('[data-open-scene]').forEach(b=>b.addEventListener('click',()=>{app.setView('atlas');window.ForjaAtlas?.setScene?.(b.dataset.openScene);}));
    root.querySelectorAll('[data-open-marker]').forEach(b=>b.addEventListener('click',()=>{app.setView('atlas');window.ForjaAtlas?.setScene?.(b.dataset.scene);setTimeout(()=>window.ForjaAtlas?.openMarkerDialog?.(b.dataset.scene,b.dataset.openMarker),0);}));
    root.querySelectorAll('[data-open-history]').forEach(b=>b.addEventListener('click',()=>openHistoryEvent(b.dataset.openHistory)));
    root.querySelectorAll('[data-edit-milestone]').forEach(b=>b.addEventListener('click',()=>openMilestoneEditor(m.id,b.dataset.editMilestone)));
    root.querySelectorAll('[data-mission-action]').forEach(b=>b.addEventListener('click',()=>missionAction(m,b.dataset.missionAction)));
    root.querySelectorAll('[data-milestone-action]').forEach(b=>b.addEventListener('click',()=>milestoneAction(m,b.dataset.milestoneId,b.dataset.milestoneAction)));
  }
  function renderMissionDetail() {
    const m=missionById(diary().selectedMissionId);
    if(!m){els.detail.innerHTML='<div class="mission-detail-empty"><span>⚑</span><h2>Selecciona una misión</h2><p>Crea una historia principal, secundarias o recados y ordénalos con requisitos e hitos.</p><button class="button" type="button" data-new-empty-mission>+ Crear misión</button></div>';els.detail.querySelector('[data-new-empty-mission]')?.addEventListener('click',()=>openMissionEditor());return;}
    els.detail.innerHTML=missionPanelHtml(m);bindMissionPanel(els.detail,m);
  }

  function renderMissions() { refreshAutomaticStates(); syncAllEntries(); renderChapterFilter(); renderMissionList(); renderMissionDetail(); }
  function render() { const section=diary().selectedSection||"history";els.tabs.forEach(b=>b.classList.toggle("is-active",b.dataset.diarySection===section));if(els.historySection)els.historySection.hidden=section!=="history";if(els.missionsSection)els.missionsSection.hidden=section!=="missions";if(section==="missions")renderMissions(); }

  function allRequirementChoices(excludeMissionId="", excludeMilestoneId="") {
    const choices=[];
    diary().missions.forEach(m=>{
      if(m.id!==excludeMissionId) choices.push({key:`m:${m.id}`,label:`${TYPE_META[m.type].icon} ${m.title}`,group:`Misiones · ${chapterName(m.chapterId)}`});
      (m.milestones||[]).forEach(h=>{if(!(m.id===excludeMissionId&&h.id===excludeMilestoneId))choices.push({key:`h:${m.id}:${h.id}`,label:`◇ ${m.title} → ${h.title}`,group:"Hitos"});});
    });
    (state().history?.events||[]).forEach(e=>choices.push({key:`e:${e.id}`,label:`⌁ ${e.title}`,group:`Historia · ${chapterName(e.chapterId)}`}));
    return choices;
  }
  function renderReqPicker(host,selected,excludeMissionId="",excludeMilestoneId="") {
    const set=new Set(selected||[]);host.replaceChildren();const choices=allRequirementChoices(excludeMissionId,excludeMilestoneId);if(!choices.length){host.innerHTML='<p class="panel__hint">Todavía no hay otras misiones, hitos o sucesos.</p>';return;}
    const groups=new Map();choices.forEach(x=>{if(!groups.has(x.group))groups.set(x.group,[]);groups.get(x.group).push(x);});groups.forEach((items,name)=>{const details=document.createElement('details');details.className='mission-req-group';const summary=document.createElement('summary');summary.textContent=name;details.append(summary);const body=document.createElement('div');items.forEach(x=>{const label=document.createElement('label');label.className='mission-req-choice';label.innerHTML=`<input type="checkbox" value="${esc(x.key)}" ${set.has(x.key)?"checked":""}/><span>${esc(x.label)}</span>`;body.append(label);});details.append(body);host.append(details);});
  }
  function checkedValues(host){return $$('input[type="checkbox"]:checked',host).map(i=>i.value);}

  function missionRefChoice(id,label,selectedSet,subtitle="") {
    const row=document.createElement('label');row.className='mission-ref-choice';
    const input=document.createElement('input');input.type='checkbox';input.value=id;input.checked=selectedSet.has(id);
    const copy=document.createElement('span');copy.textContent=label;
    if(subtitle){const small=document.createElement('small');small.textContent=subtitle;copy.append(small);}
    row.append(input,copy);return row;
  }
  function missionRefGroup(title,count){const details=document.createElement('details');details.className='mission-ref-tree-group';details.open=false;const summary=document.createElement('summary');const name=document.createElement('span');name.textContent=title;const small=document.createElement('small');small.textContent=`${count} elemento${count===1?'':'s'}`;summary.append(name,small);const body=document.createElement('div');body.className='mission-ref-tree-group__body';details.append(summary,body);return {details,body};}
  function renderSceneReferenceTree(host,selectedSet){
    const scenes=allAtlasScenes();if(!scenes.length)return false;const known=new Set(scenes.map(x=>x.id));const byParent=new Map();scenes.forEach(scene=>{const parent=known.has(scene.parentSceneId)?scene.parentSceneId:'';if(!byParent.has(parent))byParent.set(parent,[]);byParent.get(parent).push(scene);});
    const walk=(scene,depth=0)=>{const kids=(byParent.get(scene.id)||[]).sort((a,b)=>a.name.localeCompare(b.name,'es'));if(!kids.length){const row=missionRefChoice(scene.id,scene.name,selectedSet);row.style.marginLeft=`${depth*9}px`;return row;}const group=missionRefGroup(scene.name,kids.length);group.details.classList.add('mission-ref-tree-branch');group.details.style.marginLeft=`${depth*7}px`;group.body.append(missionRefChoice(scene.id,'Esta escena',selectedSet));kids.forEach(child=>group.body.append(walk(child,depth+1)));return group.details;};
    (byParent.get('')||[]).sort((a,b)=>a.name.localeCompare(b.name,'es')).forEach(scene=>host.append(walk(scene)));return true;
  }
  function renderMarkerReferenceTree(host,selectedSet){
    const groups=allAtlasScenes().map(scene=>({scene,items:(scene.markers||[])})).filter(group=>group.items.length);if(!groups.length)return false;groups.sort((a,b)=>a.scene.name.localeCompare(b.scene.name,'es')).forEach(({scene,items})=>{const group=missionRefGroup(`⌖ ${scene.name}`,items.length);items.slice().sort((a,b)=>(a.name||a.alias||'').localeCompare(b.name||b.alias||'','es')).forEach(marker=>group.body.append(missionRefChoice(marker.id,marker.name||marker.alias||'Marcador',selectedSet,marker.category||'')));host.append(group.details);});return true;
  }
  function renderHistoryReferenceTree(host,selectedSet){
    const events=state().history?.events||[];if(!events.length)return false;chapters().forEach(chapter=>{const items=events.filter(e=>e.chapterId===chapter.id);if(!items.length)return;const ids=new Set(items.map(e=>e.id));const children=new Map();items.forEach(event=>{const parent=(event.requirementIds||[]).find(id=>ids.has(id))||'';if(!children.has(parent))children.set(parent,[]);children.get(parent).push(event);});const chapterGroup=missionRefGroup(`⌁ ${chapter.title}`,items.length);const walk=(event,depth=0)=>{const kids=(children.get(event.id)||[]).filter(x=>x.id!==event.id);if(!kids.length){const row=missionRefChoice(event.id,event.title,selectedSet,event.status||'');row.style.marginLeft=`${depth*9}px`;return row;}const group=missionRefGroup(event.title,kids.length);group.details.classList.add('mission-ref-tree-branch');group.body.append(missionRefChoice(event.id,'Este suceso',selectedSet,event.status||''));kids.forEach(child=>group.body.append(walk(child,depth+1)));return group.details;};(children.get('')||[]).forEach(root=>chapterGroup.body.append(walk(root)));host.append(chapterGroup.details);});return host.childElementCount>0;
  }
  function renderReferenceChecklist(host,items,selected,emptyText){
    const set=new Set(selected||[]);host.replaceChildren();let rendered=false;
    if(host===els.sceneRefs)rendered=renderSceneReferenceTree(host,set);
    else if(host===els.markerRefs)rendered=renderMarkerReferenceTree(host,set);
    else if(host===els.historyRefs)rendered=renderHistoryReferenceTree(host,set);
    else if(items?.length){items.forEach(x=>host.append(missionRefChoice(x.id,x.label,set)));rendered=true;}
    if(!rendered)host.innerHTML=`<p class="mission-ref-tree-empty">${esc(emptyText)}</p>`;
  }
  function atlasSceneOptions(){return allAtlasScenes().map(s=>({id:s.id,label:s.name}));}
  function atlasMarkerOptions(){return allAtlasScenes().flatMap(s=>(s.markers||[]).map(m=>({id:m.id,label:`${s.name} → ${m.name||m.alias||"Marcador"}`})));}
  function historyOptions(){return (state().history?.events||[]).map(e=>({id:e.id,label:`${chapterName(e.chapterId)} → ${e.title}`}));}

  function blankMission(){const chapter=diary().chapterFilter!=="all"&&diary().chapterFilter!=="none"?diary().chapterFilter:(chapters()[0]?.id||"");return {id:app.uid(),title:"Nueva misión",type:"secondary",chapterId:chapter,status:"undiscovered",description:"",playerText:"",infoText:"No tienes suficiente información para entenderlo todavía.",allowEarlyDiscovery:true,appearRequirements:[],continueRequirements:[],completeRequirements:[],appearMode:"all",continueMode:"all",completeMode:"all",milestones:[],entryId:"",atlasSceneIds:[],atlasMarkerIds:[],historyEventIds:[],reward:"",notes:"",createdAt:now(),updatedAt:now()};}
  function openMissionEditor(id="",template=null){editingMissionId=id;missionDraft=id?app.clone(missionById(id)):blankMission();if(!missionDraft)return;if(template)Object.assign(missionDraft,template);els.dialogTitle.textContent=id?"Editar misión":"Nueva misión";els.title.value=missionDraft.title;els.type.value=missionDraft.type;els.chapter.innerHTML='<option value="">Sin capítulo</option>'+chapters().map(c=>`<option value="${esc(c.id)}">${esc(c.title)}</option>`).join('');els.chapter.value=missionDraft.chapterId||'';els.description.value=missionDraft.description||'';els.infoText.value=missionDraft.infoText||'';els.allowEarly.checked=missionDraft.allowEarlyDiscovery!==false;els.appearMode.value=missionDraft.appearMode||'all';els.continueMode.value=missionDraft.continueMode||'all';els.completeMode.value=missionDraft.completeMode||'all';els.reward.value=missionDraft.reward||'';els.notes.value=missionDraft.notes||'';renderReqPicker(els.appearReq,missionDraft.appearRequirements,id);renderReqPicker(els.continueReq,missionDraft.continueRequirements,id);renderReqPicker(els.completeReq,missionDraft.completeRequirements,id);renderReferenceChecklist(els.sceneRefs,atlasSceneOptions(),missionDraft.atlasSceneIds,'No hay escenas.');renderReferenceChecklist(els.markerRefs,atlasMarkerOptions(),missionDraft.atlasMarkerIds,'No hay marcadores.');renderReferenceChecklist(els.historyRefs,historyOptions(),missionDraft.historyEventIds,'No hay sucesos.');els.deleteBtn.hidden=!id;els.duplicateBtn.hidden=!id;els.dialog.showModal();setTimeout(()=>els.title.focus(),0);}
  function saveMissionFromForm(){if(!missionDraft)return;missionDraft.title=els.title.value.trim().slice(0,180)||'Misión';missionDraft.type=els.type.value;missionDraft.chapterId=els.chapter.value||'';missionDraft.description=els.description.value.slice(0,12000);missionDraft.infoText=els.infoText.value.slice(0,3000)||'No tienes suficiente información para entenderlo todavía.';missionDraft.allowEarlyDiscovery=els.allowEarly.checked;missionDraft.appearMode=els.appearMode.value;missionDraft.continueMode=els.continueMode.value;missionDraft.completeMode=els.completeMode.value;missionDraft.appearRequirements=checkedValues(els.appearReq);missionDraft.continueRequirements=checkedValues(els.continueReq);missionDraft.completeRequirements=checkedValues(els.completeReq);missionDraft.atlasSceneIds=checkedValues(els.sceneRefs);missionDraft.atlasMarkerIds=checkedValues(els.markerRefs);missionDraft.historyEventIds=checkedValues(els.historyRefs);missionDraft.reward=els.reward.value.slice(0,4000);missionDraft.notes=els.notes.value.slice(0,8000);missionDraft.updatedAt=now();const d=diary(),idx=d.missions.findIndex(m=>m.id===editingMissionId);if(idx>=0)d.missions[idx]=missionDraft;else d.missions.push(missionDraft);d.selectedMissionId=missionDraft.id;syncMissionEntry(missionDraft);syncAtlasReferencesForMission(missionDraft);editingMissionId='';missionDraft=null;els.dialog.close();save();app.render?.();}
  function duplicateMission(id){
    const source=missionById(id); if(!source)return;
    const copy=app.clone(source); const oldMissionId=source.id; copy.id=app.uid(); copy.title=`${source.title} (copia)`; copy.status='undiscovered'; copy.entryId=''; copy.atlasSceneIds=[]; copy.atlasMarkerIds=[]; copy.historyEventIds=[];
    const milestoneIdMap=new Map();
    copy.milestones=(copy.milestones||[]).map(h=>{const old=h.id,next=app.uid();milestoneIdMap.set(old,next);return {...h,id:next,status:'pending',atlasSceneId:'',atlasMarkerId:'',historyEventId:'',createdAt:now(),updatedAt:now()};});
    const remapReq=r=>{if(r===`m:${oldMissionId}`)return `m:${copy.id}`;if(r.startsWith(`h:${oldMissionId}:`)){const oldH=r.split(':')[2];return `h:${copy.id}:${milestoneIdMap.get(oldH)||oldH}`;}return r;};
    ['appearRequirements','continueRequirements','completeRequirements'].forEach(k=>copy[k]=(copy[k]||[]).map(remapReq));
    copy.milestones.forEach(h=>h.requirements=(h.requirements||[]).map(remapReq));
    copy.createdAt=now();copy.updatedAt=now();diary().missions.push(copy);diary().selectedMissionId=copy.id;syncMissionEntry(copy);save();openMissionEditor(copy.id);
  }
  function deleteMission(id){const m=missionById(id);if(!m||!confirm(`¿Eliminar la misión “${m.title}”? Su ficha del Cuaderno también se enviará a la Papelera.`))return;allAtlasMarkers().forEach(({marker})=>{marker.diaryRefs=(marker.diaryRefs||[]).filter(ref=>ref.missionId!==id);});window.ForjaWorkspace?.pushTrash?.('diaryMission',m.title,{mission:app.clone(m),entry:state().entries.find(e=>e.id===m.entryId)?app.clone(state().entries.find(e=>e.id===m.entryId)):null});diary().missions=diary().missions.filter(x=>x.id!==id);if(m.entryId){const missionEntry=state().entries.find(e=>e.id===m.entryId);state().entries.forEach(e=>{if(e.parentId===m.entryId)e.parentId=missionEntry?.parentId||null;});state().entries=state().entries.filter(e=>e.id!==m.entryId);}diary().missions.forEach(other=>{['appearRequirements','continueRequirements','completeRequirements'].forEach(k=>other[k]=(other[k]||[]).filter(r=>r!==`m:${id}`&&!r.startsWith(`h:${id}:`)));other.milestones?.forEach(h=>h.requirements=(h.requirements||[]).filter(r=>r!==`m:${id}`&&!r.startsWith(`h:${id}:`)));});diary().selectedMissionId=diary().missions[0]?.id||'';els.dialog.close();save();app.render?.();}

  function blankMilestone(){return{id:app.uid(),title:'Nuevo hito',description:'',status:'pending',optional:false,secret:false,requirements:[],requirementMode:'all',atlasSceneId:'',atlasMarkerId:'',historyEventId:'',notebookEntryId:'',infoText:'No tienes suficiente información para comprender todavía qué significa esto.',createdAt:now(),updatedAt:now()};}
  function fillSelect(select,items,selected,emptyLabel='— Ninguno —'){select.innerHTML=`<option value="">${esc(emptyLabel)}</option>`+items.map(x=>`<option value="${esc(x.id)}">${esc(x.label)}</option>`).join('');select.value=items.some(x=>x.id===selected)?selected:'';}
  function openMilestoneEditor(missionId,id=''){const m=missionById(missionId);if(!m)return;editingMilestoneMissionId=missionId;editingMilestoneId=id;milestoneDraft=id?app.clone(milestoneById(missionId,id)):blankMilestone();els.milestoneDialogTitle.textContent=id?'Editar hito':'Nuevo hito';els.milestoneTitle.value=milestoneDraft.title;els.milestoneDescription.value=milestoneDraft.description||'';els.milestoneOptional.checked=Boolean(milestoneDraft.optional);els.milestoneSecret.checked=Boolean(milestoneDraft.secret);els.milestoneReqMode.value=milestoneDraft.requirementMode||'all';renderReqPicker(els.milestoneReq,milestoneDraft.requirements,missionId,id);fillSelect(els.milestoneScene,atlasSceneOptions(),milestoneDraft.atlasSceneId);fillSelect(els.milestoneMarker,atlasMarkerOptions(),milestoneDraft.atlasMarkerId);fillSelect(els.milestoneHistory,historyOptions(),milestoneDraft.historyEventId);els.milestoneInfoText.value=milestoneDraft.infoText||'';els.milestoneDeleteBtn.hidden=!id;els.milestoneDialog.showModal();setTimeout(()=>els.milestoneTitle.focus(),0);}
  function saveMilestoneFromForm(){const m=missionById(editingMilestoneMissionId);if(!m||!milestoneDraft)return;milestoneDraft.title=els.milestoneTitle.value.trim().slice(0,180)||'Hito';milestoneDraft.description=els.milestoneDescription.value.slice(0,8000);milestoneDraft.optional=els.milestoneOptional.checked;milestoneDraft.secret=els.milestoneSecret.checked;milestoneDraft.requirementMode=els.milestoneReqMode.value;milestoneDraft.requirements=checkedValues(els.milestoneReq);milestoneDraft.atlasSceneId=els.milestoneScene.value||'';milestoneDraft.atlasMarkerId=els.milestoneMarker.value||'';milestoneDraft.historyEventId=els.milestoneHistory.value||'';milestoneDraft.infoText=els.milestoneInfoText.value.slice(0,3000)||'No tienes suficiente información para comprender todavía qué significa esto.';milestoneDraft.updatedAt=now();const idx=m.milestones.findIndex(h=>h.id===editingMilestoneId);if(idx>=0)m.milestones[idx]=milestoneDraft;else m.milestones.push(milestoneDraft);m.updatedAt=now();els.milestoneDialog.close();editingMilestoneId='';editingMilestoneMissionId='';milestoneDraft=null;syncMissionEntry(m);syncAtlasReferencesForMission(m);save();}
  function deleteMilestone(){
    const m=missionById(editingMilestoneMissionId),h=milestoneById(editingMilestoneMissionId,editingMilestoneId);if(!m||!h||!confirm(`¿Eliminar el hito “${h.title}”?`))return;
    window.ForjaWorkspace?.pushTrash?.('milestone',h.title,{missionId:m.id,milestone:app.clone(h)});
    m.milestones=m.milestones.filter(x=>x.id!==h.id);
    diary().missions.forEach(other=>{['appearRequirements','continueRequirements','completeRequirements'].forEach(k=>other[k]=(other[k]||[]).filter(r=>r!==`h:${m.id}:${h.id}`));other.milestones?.forEach(x=>x.requirements=(x.requirements||[]).filter(r=>r!==`h:${m.id}:${h.id}`));});
    syncAtlasReferencesForMission(m);
    els.milestoneDialog.close();save();
  }
  function missionAction(m,action){if(!m)return;if(action==='start'){const appear=requirementsMet(m.appearRequirements,m.appearMode),cont=requirementsMet(m.continueRequirements,m.continueMode);m.status=appear&&cont?'active':(m.allowEarlyDiscovery?'info':'undiscovered');if(m.status==='undiscovered')alert('Esta misión todavía no puede descubrirse: faltan requisitos.');}else if(action==='complete'){if(!requirementsMet(m.completeRequirements,m.completeMode)){alert('Todavía faltan requisitos para completar esta misión.');return;}m.status='completed';}else if(action==='fail')m.status='failed';else if(action==='reset')m.status=requirementsMet(m.appearRequirements,m.appearMode)?'available':'undiscovered';m.updatedAt=now();syncMissionEntry(m);save();app.render?.();if(window.ForjaAtlas?.refreshDiaryPanel)window.ForjaAtlas.refreshDiaryPanel();}
  function milestoneAction(m,id,action){const h=milestoneById(m.id,id);if(!h)return;if(action==='completed'){if(!requirementsMet(h.requirements,h.requirementMode)){h.status='info';alert(h.infoText||'No tienes suficiente información para completar este hito.');}else h.status='completed';}else if(action==='active')h.status=requirementsMet(h.requirements,h.requirementMode)?'active':'info';else h.status='pending';h.updatedAt=now();m.updatedAt=now();save();if(window.ForjaAtlas?.refreshDiaryPanel)window.ForjaAtlas.refreshDiaryPanel();}

  function openMission(id){const m=missionById(id);if(!m)return;app.setView('history');diary().selectedSection='missions';diary().selectedMissionId=id;app.saveState();render();}
  function openHistoryEvent(id){app.setView('history');diary().selectedSection='history';app.saveState();render();window.ForjaHistory?.selectEvent?.(id);}

  function referenceTree() {
    const groups=[];
    const byChapter=new Map();
    diary().missions.forEach(m=>{const key=m.chapterId||'';if(!byChapter.has(key))byChapter.set(key,[]);byChapter.get(key).push(m);});
    const order=[...chapters().map(c=>c.id),''];
    order.forEach(ch => {
      const rank = { main: 0, secondary: 1, task: 2 };
      const missions = (byChapter.get(ch) || []).slice().sort((a, b) => (rank[a.type] ?? 9) - (rank[b.type] ?? 9) || a.title.localeCompare(b.title, 'es'));
      if (!missions.length) return;
      groups.push({ id: ch || 'none', name: chapterName(ch), missions: missions.map(m => ({ id: m.id, name: m.title, type: m.type, status: effectiveStatus(m), milestones: (m.milestones || []).map(h => ({ id: h.id, name: h.title, status: milestoneEffectiveStatus(h) })) })) });
    });
    return groups;
  }
  function renderAtlasPanel(refs=[]) {
    const clean=(refs||[]).filter(r=>missionById(r.missionId));
    if(!clean.length)return'<div class="mission-detail-empty"><span>⚑</span><p>No hay misiones asociadas.</p></div>';
    if(clean.length===1){const r=clean[0],m=missionById(r.missionId);return missionPanelHtml(m,{atlas:true,milestoneId:r.milestoneId||''});}
    return `<div class="atlas-diary-multi"><h3>Misiones asociadas</h3>${clean.map(r=>{const m=missionById(r.missionId),h=r.milestoneId?milestoneById(m.id,r.milestoneId):null;return `<button type="button" data-atlas-diary-open="${esc(m.id)}" data-atlas-diary-hito="${esc(h?.id||'')}"><span>${TYPE_META[m.type].icon}</span><strong>${esc(m.title)}</strong>${h?`<small>◇ ${esc(h.title)}</small>`:`<small>${STATUS_META[effectiveStatus(m)].label}</small>`}</button>`;}).join('')}</div>`;
  }
  function bindAtlasPanel(root,refs=[]) {
    root.querySelectorAll('[data-atlas-diary-open]').forEach(b=>b.addEventListener('click',()=>{const m=missionById(b.dataset.atlasDiaryOpen);if(!m)return;root.innerHTML=missionPanelHtml(m,{atlas:true,milestoneId:b.dataset.atlasDiaryHito||''});bindMissionPanel(root,m);}));
    if(refs.length===1){const m=missionById(refs[0].missionId);if(m)bindMissionPanel(root,m);}
  }

  function createFromTemplate(kind) {
    els.templateDialog.close();
    if (kind === "main") {
      openMissionEditor("", { title: "Nueva historia principal", type: "main", milestones: [
        { ...blankMilestone(), title: "Inicio" },
        { ...blankMilestone(), title: "Punto de giro" },
        { ...blankMilestone(), title: "Decisión final" }
      ] });
      return;
    }
    if (kind === "investigation") {
      const a = blankMilestone(), b = blankMilestone(), c = blankMilestone();
      a.title = "Encontrar la primera pista";
      b.title = "Comprender qué significa";
      b.requirements = [`h:__self__:${a.id}`];
      c.title = "Revelación";
      openMissionEditor("", { title: "Nueva investigación", type: "secondary", milestones: [a,b,c], infoText: "Has encontrado algo importante, pero aún no tienes suficiente contexto para comprenderlo." });
      return;
    }
    openMissionEditor("", { title: "Nuevo recado", type: "task", milestones: [
      { ...blankMilestone(), title: "Conseguir / realizar el encargo" },
      { ...blankMilestone(), title: "Entregar / informar" }
    ] });
  }

  // Replace placeholder self references after mission id exists on template save.
  function fixSelfRequirements(m){m.milestones?.forEach(h=>h.requirements=(h.requirements||[]).map(r=>r.replace('h:__self__:',`h:${m.id}:`)));}
  const originalSync=syncMissionEntry;
  syncMissionEntry=function(m){fixSelfRequirements(m);return originalSync(m);};

  function bind(){
    els.tabs.forEach(b=>b.addEventListener('click',()=>setSection(b.dataset.diarySection)));
    els.chapterFilter?.addEventListener('change',()=>{diary().chapterFilter=els.chapterFilter.value;app.saveState();renderMissions();});
    els.typeFilter?.addEventListener('change',()=>{diary().typeFilter=els.typeFilter.value;app.saveState();renderMissions();});
    els.statusFilter?.addEventListener('change',()=>{diary().statusFilter=els.statusFilter.value;app.saveState();renderMissions();});
    els.newBtn?.addEventListener('click',()=>openMissionEditor());els.templateBtn?.addEventListener('click',()=>els.templateDialog.showModal());
    els.form?.addEventListener('submit',e=>{e.preventDefault();saveMissionFromForm();});$$('.mission-dialog-close,.mission-dialog-cancel').forEach(b=>b.addEventListener('click',()=>els.dialog.close()));els.deleteBtn?.addEventListener('click',()=>editingMissionId&&deleteMission(editingMissionId));els.duplicateBtn?.addEventListener('click',()=>editingMissionId&&duplicateMission(editingMissionId));
    els.milestoneForm?.addEventListener('submit',e=>{e.preventDefault();saveMilestoneFromForm();});$$('.milestone-dialog-close,.milestone-dialog-cancel').forEach(b=>b.addEventListener('click',()=>els.milestoneDialog.close()));els.milestoneDeleteBtn?.addEventListener('click',deleteMilestone);
    $('.mission-template-close')?.addEventListener('click',()=>els.templateDialog.close());$$('[data-mission-template]').forEach(b=>b.addEventListener('click',()=>createFromTemplate(b.dataset.missionTemplate)));
    document.addEventListener('forja:campaignchange',()=>{render();});document.addEventListener('forja:historychange',()=>{refreshAutomaticStates();if(state().view==='history'&&diary().selectedSection==='missions')renderMissions();});
  }
  bind();
  document.addEventListener('forja:ready',()=>render());
  window.ForjaDiary={render,renderMissions,setSection,openMission,openHistoryEvent,missionById,milestoneById,requirementsMet,effectiveStatus,referenceTree,renderAtlasPanel,bindAtlasPanel,syncAllEntries,syncFromNotebookEntry,syncAtlasReferencesForMission,duplicateMission,deleteMission,restoreMission(payload){const m=payload?.mission;if(!m)return false;if(!missionById(m.id))diary().missions.push(m);if(payload.entry&&!state().entries.some(e=>e.id===payload.entry.id))state().entries.push(payload.entry);diary().selectedMissionId=m.id;syncAtlasReferencesForMission(m);save();return true;},restoreMilestone(payload){const m=missionById(payload?.missionId);if(!m||!payload?.milestone)return false;if(!m.milestones.some(h=>h.id===payload.milestone.id))m.milestones.push(payload.milestone);syncAtlasReferencesForMission(m);save();return true;}};
})();
