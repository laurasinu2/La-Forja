(() => {
  "use strict";
  const app = window.ForjaApp;
  if (!app) return;
  const $ = selector => document.querySelector(selector);
  const STAGE_W = 3800, STAGE_H = 2400, NODE_W = 220, NODE_H = 108;
  const STATUS = {
    locked: ["🔒", "Bloqueado"], available: ["○", "Disponible"], inProgress: ["▶", "En curso"], occurred: ["✓", "Ocurrido"], discarded: ["×", "Descartado"]
  };
  const NODE_TYPES = {
    story: ["📖", "Suceso"], combat: ["⚔", "Combate"], investigation: ["🔎", "Investigación"], conversation: ["💬", "Conversación"],
    objective: ["🎯", "Objetivo"], decision: ["❗", "Decisión"], discovery: ["🗺", "Descubrimiento"], milestone: ["👑", "Evento importante"]
  };
  const els = {
    view: $("#historyView"), newEvent: $("#historyNewEvent"), emptyNewEvent: $("#historyEmptyNewEvent"), newChapter: $("#historyNewChapter"), renameChapter: $("#historyRenameChapter"), deleteChapter: $("#historyDeleteChapter"),
    chapterTabs: $("#historyChapterTabs"), chapterTitle: $("#historyChapterTitle"), chapterStats: $("#historyChapterStats"), mapViewport: $("#historyMapViewport"), mapStage: $("#historyMapStage"), nodeLayer: $("#historyNodeLayer"), edgeLayer: $("#historyEdgeLayer"), mapEmpty: $("#historyMapEmpty"), autoLayout: $("#historyAutoLayout"), centerSelection: $("#historyCenterSelection"),
    empty: $("#historyEmpty"), editor: $("#historyEditor"), statusBadge: $("#historyStatusBadge"), title: $("#historyEventTitle"), nodeType: $("#historyNodeType"), description: $("#historyEventDescription"), requirementMode: $("#historyRequirementMode"), requirements: $("#historyRequirements"), addChild: $("#historyAddChild"),
    markProgress: $("#historyMarkProgress"), markOccurred: $("#historyMarkOccurred"), discard: $("#historyDiscard"), resetStatus: $("#historyResetStatus"), deleteEvent: $("#historyDeleteEvent"), unlocks: $("#historyUnlocks"), latentAtlas: $("#historyLatentAtlas"),
    entrySelect: $("#historyLinkEntrySelect"), sceneSelect: $("#historyLinkSceneSelect"), markerSelect: $("#historyLinkMarkerSelect"), addEntry: $("#historyAddEntryLink"), addScene: $("#historyAddSceneLink"), addMarker: $("#historyAddMarkerLink"), campaignLinks: $("#historyCampaignLinks"),
    entryTree: $("#historyEntryReferenceTree"), sceneTree: $("#historySceneReferenceTree"), markerTree: $("#historyMarkerReferenceTree"), moveChapter: $("#historyMoveChapter"), moveNodeChapter: $("#historyMoveNodeChapter"),
    moveLeft: $("#historyMoveLeft"), moveUp: $("#historyMoveUp"), moveDown: $("#historyMoveDown"), moveRight: $("#historyMoveRight")
  };
  if (!els.view) return;

  let drag = null;
  function campaign() { return app.getState(); }
  function history() {
    const state = campaign();
    if (!state.history || !Array.isArray(state.history.events)) state.history = { selectedChapterId: "", selectedEventId: "", chapters: [], events: [] };
    state.history.chapters ||= [];
    return state.history;
  }
  function chapterById(id) { return history().chapters.find(chapter => chapter.id === id) || null; }
  function selectedChapter() { return chapterById(history().selectedChapterId); }
  function eventById(id) { return history().events.find(event => event.id === id) || null; }
  function selectedEvent() { return eventById(history().selectedEventId); }
  function chapterEvents(chapterId = history().selectedChapterId) { return history().events.filter(event => event.chapterId === chapterId); }
  function requirementsMet(event) {
    const ids = event?.requirementIds || [];
    if (!ids.length) return true;
    const checks = ids.map(id => eventById(id)?.status === "occurred");
    return event.requirementMode === "any" ? checks.some(Boolean) : checks.every(Boolean);
  }
  function refreshUnlocks({ save = false } = {}) {
    let changed = false;
    history().events.forEach(event => {
      if (["occurred", "discarded"].includes(event.status)) return;
      const next = requirementsMet(event) ? (event.status === "inProgress" ? "inProgress" : "available") : "locked";
      if (next !== event.status) { event.status = next; event.updatedAt = app.now(); changed = true; }
    });
    if (save || changed) app.saveState(true);
    return changed;
  }
  function notifyStructuralChange() { app.saveState(true); document.dispatchEvent(new CustomEvent("forja:historychange")); }
  function ensureChapter() {
    let chapter = selectedChapter();
    if (!chapter && history().chapters.length) { history().selectedChapterId = history().chapters[0].id; chapter = history().chapters[0]; }
    return chapter;
  }
  function clampPosition(value, max) { return Math.max(24, Math.min(max, Number(value) || 24)); }
  function typeMeta(event) { return NODE_TYPES[event?.nodeType] || NODE_TYPES.story; }
  function chapterTitle(id) { return chapterById(id)?.title || "Sin capítulo"; }
  function directChildren(eventId) { return history().events.filter(candidate => (candidate.requirementIds || []).includes(eventId)); }
  function descendantIds(eventId) {
    const result = new Set(), queue = [eventId];
    while (queue.length) { const current = queue.shift(); directChildren(current).forEach(child => { if (!result.has(child.id)) { result.add(child.id); queue.push(child.id); } }); }
    result.delete(eventId); return result;
  }
  function wouldCreateCycle(eventId, parentId) { return eventId === parentId || descendantIds(eventId).has(parentId); }

  function renderChapters() {
    els.chapterTabs.replaceChildren();
    history().chapters.forEach(chapter => {
      const button = document.createElement("button"); button.type = "button"; button.className = `history-chapter-tab${chapter.id === history().selectedChapterId ? " is-active" : ""}`;
      const count = chapterEvents(chapter.id).length;
      button.innerHTML = `<span></span><small>${count}</small>`; button.querySelector("span").textContent = chapter.title;
      button.addEventListener("click", () => { history().selectedChapterId = chapter.id; const current = selectedEvent(); if (!current || current.chapterId !== chapter.id) history().selectedEventId = chapterEvents(chapter.id)[0]?.id || ""; app.saveState(); render(); });
      els.chapterTabs.append(button);
    });
    const chapter = selectedChapter();
    els.renameChapter.disabled = !chapter; els.deleteChapter.disabled = !chapter;
    els.newEvent.disabled = !chapter;
    els.chapterTitle.textContent = chapter?.title || "Sin capítulo";
    const list = chapter ? chapterEvents(chapter.id) : [];
    const occurred = list.filter(event => event.status === "occurred").length;
    const available = list.filter(event => ["available", "inProgress"].includes(event.status)).length;
    els.chapterStats.textContent = `${list.length} nodo${list.length === 1 ? "" : "s"} · ${occurred} ocurrido${occurred === 1 ? "" : "s"} · ${available} disponible${available === 1 ? "" : "s"}`;
  }

  function edgePath(parent, child) {
    const x1 = parent.x + NODE_W, y1 = parent.y + NODE_H / 2, x2 = child.x, y2 = child.y + NODE_H / 2;
    const bend = Math.max(70, Math.abs(x2 - x1) * .45);
    return `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`;
  }
  function renderEdges(list) {
    els.edgeLayer.replaceChildren();
    const ids = new Set(list.map(event => event.id));
    list.forEach(child => (child.requirementIds || []).forEach(parentId => {
      if (!ids.has(parentId)) return;
      const parent = eventById(parentId); if (!parent) return;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", edgePath(parent, child)); path.setAttribute("class", `history-map-edge${parent.status === "occurred" ? " is-complete" : ""}`); path.setAttribute("marker-end", "url(#historyArrow)"); els.edgeLayer.append(path);
    }));
  }
  function nodeEffects(event) {
    const scenes = campaign().atlas?.scenes?.filter(scene => scene.unlockEventId === event.id).length || 0;
    const markers = campaign().atlas?.scenes?.reduce((total, scene) => total + (scene.markers || []).filter(marker => marker.unlockEventId === event.id).length, 0) || 0;
    const refs = (event.linkedEntryIds?.length || 0) + (event.linkedSceneIds?.length || 0) + (event.linkedMarkerRefs?.length || 0);
    return { scenes, markers, refs };
  }
  function nodeReferencePreview(event) {
    const labels = [];
    (event.linkedEntryIds || []).forEach(id => { const entry = campaign().entries?.find(item => item.id === id); if (entry) labels.push(`📖 ${entry.name}`); });
    (event.linkedSceneIds || []).forEach(id => { const scene = campaign().atlas?.scenes?.find(item => item.id === id); if (scene) labels.push(`⌖ ${scene.name}`); });
    (event.linkedMarkerRefs || []).forEach(ref => { const [sceneId, markerId] = String(ref).split("::"); const scene = campaign().atlas?.scenes?.find(item => item.id === sceneId), marker = scene?.markers?.find(item => item.id === markerId); if (marker) labels.push(`📍 ${marker.name || marker.alias || "Marcador"}`); });
    return labels.slice(0, 2).join(" · ");
  }
  function makeNode(event) {
    const button = document.createElement("button"); button.type = "button"; button.className = `history-map-node history-map-node--${event.status}${event.id === history().selectedEventId ? " is-selected" : ""}`;
    button.style.left = `${event.x}px`; button.style.top = `${event.y}px`; button.dataset.eventId = event.id;
    const [statusIcon, statusLabel] = STATUS[event.status] || STATUS.available; const [typeIcon, typeLabel] = typeMeta(event); const effects = nodeEffects(event); const referencePreview = nodeReferencePreview(event);
    const crossParents = (event.requirementIds || []).map(eventById).filter(parent => parent && parent.chapterId !== event.chapterId);
    const crossChildren = directChildren(event.id).filter(child => child.chapterId !== event.chapterId);
    const crossMeta = `${crossParents.length ? ` · ↖ ${crossParents.length}` : ""}${crossChildren.length ? ` · ↗ ${crossChildren.length}` : ""}`;
    const crossPreview = crossParents[0] ? `↖ ${chapterTitle(crossParents[0].chapterId)}: ${crossParents[0].title}` : "";
    button.innerHTML = `<span class="history-map-node__top"><span class="history-map-node__type">${typeIcon} ${typeLabel}</span><span class="history-map-node__status">${statusIcon}</span></span><strong></strong>${referencePreview || crossPreview ? `<span class="history-map-node__refs">${app.escapeHtml([crossPreview, referencePreview].filter(Boolean).join(" · "))}</span>` : ""}<span class="history-map-node__meta">${statusLabel}${effects.refs ? ` · 🔗 ${effects.refs}` : ""}${effects.scenes ? ` · ⌖ ${effects.scenes}` : ""}${effects.markers ? ` · 📍 ${effects.markers}` : ""}${crossMeta}</span>`;
    button.querySelector("strong").textContent = event.title || "Nodo sin nombre";
    button.addEventListener("click", e => { if (drag?.moved) return; history().selectedEventId = event.id; app.saveState(); render(); });
    button.addEventListener("dblclick", () => { history().selectedEventId = event.id; app.saveState(); render(); setTimeout(() => { els.title.focus(); els.title.select(); }, 0); });
    button.addEventListener("pointerdown", startDrag);
    return button;
  }
  function renderMap() {
    const chapter = selectedChapter(); const list = chapter ? chapterEvents(chapter.id) : [];
    els.nodeLayer.replaceChildren(); renderEdges(list); els.mapEmpty.hidden = Boolean(list.length); els.mapStage.hidden = !list.length;
    list.forEach(event => els.nodeLayer.append(makeNode(event)));
  }

  function startDrag(event) {
    if (event.button !== undefined && event.button !== 0) return;
    const id = event.currentTarget.dataset.eventId, node = eventById(id); if (!node) return;
    drag = { id, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, nodeX: node.x, nodeY: node.y, moved: false, el: event.currentTarget };
    event.currentTarget.setPointerCapture?.(event.pointerId); event.currentTarget.classList.add("is-dragging");
  }
  function moveDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return; const node = eventById(drag.id); if (!node) return;
    const dx = event.clientX - drag.startX, dy = event.clientY - drag.startY; if (Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true;
    node.x = clampPosition(drag.nodeX + dx, STAGE_W - NODE_W - 24); node.y = clampPosition(drag.nodeY + dy, STAGE_H - NODE_H - 24);
    drag.el.style.left = `${node.x}px`; drag.el.style.top = `${node.y}px`; renderEdges(chapterEvents(node.chapterId));
  }
  function endDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return; drag.el.classList.remove("is-dragging"); if (drag.moved) { const node = eventById(drag.id); if (node) node.updatedAt = app.now(); app.saveState(); }
    setTimeout(() => { drag = null; }, 0);
  }

  function effectRow(icon, title, subtitle, actions = []) {
    const row = document.createElement("div"); row.className = "history-effect-row";
    const glyph = document.createElement("span"); glyph.className = "history-effect-row__icon"; glyph.textContent = icon;
    const text = document.createElement("div"); const strong = document.createElement("strong"); strong.textContent = title; text.append(strong); if (subtitle) { const small = document.createElement("small"); small.textContent = subtitle; text.append(small); }
    row.append(glyph, text); const controls = document.createElement("span"); controls.className = "history-effect-row__actions";
    actions.forEach(action => { const button = document.createElement("button"); button.type = "button"; button.className = "button button--quiet"; button.textContent = action.label; button.addEventListener("click", action.run); controls.append(button); });
    if (actions.length) row.append(controls); return row;
  }
  function renderRequirements(event) {
    els.requirements.replaceChildren();
    const others = history().events.filter(candidate => candidate.id !== event.id);
    if (!others.length) { const p = document.createElement("p"); p.className = "history-empty-list"; p.textContent = "Todavía no hay otros nodos en la campaña."; els.requirements.append(p); return; }
    const groups = history().chapters.map(chapter => ({ chapter, items: others.filter(candidate => candidate.chapterId === chapter.id) })).filter(group => group.items.length);
    groups.forEach(({ chapter, items }) => {
      const details = document.createElement("details"); details.className = "history-requirement-group"; details.open = false;
      const summary = document.createElement("summary"); const selectedCount = items.filter(candidate => event.requirementIds.includes(candidate.id)).length; summary.innerHTML = `<span>${app.escapeHtml(chapter.title)}</span><small>${selectedCount ? `${selectedCount} seleccionado${selectedCount === 1 ? "" : "s"}` : `${items.length} nodos`}</small>`; details.append(summary);
      const body = document.createElement("div"); body.className = "history-requirement-group__body";
      items.forEach(candidate => {
        const label = document.createElement("label"); label.className = "history-requirement";
        const input = document.createElement("input"); input.type = "checkbox"; input.checked = event.requirementIds.includes(candidate.id);
        const cycle = wouldCreateCycle(event.id, candidate.id); input.disabled = cycle && !input.checked;
        const text = document.createElement("span"); const strong = document.createElement("strong"); strong.textContent = candidate.title; const small = document.createElement("small"); small.textContent = `${STATUS[candidate.status]?.[0] || "○"} ${STATUS[candidate.status]?.[1] || candidate.status}${candidate.chapterId !== event.chapterId ? ` · ${chapter.title}` : ""}${cycle ? " · crearía un ciclo" : ""}`; text.append(strong, small);
        input.addEventListener("change", () => {
          const set = new Set(event.requirementIds); if (input.checked) set.add(candidate.id); else set.delete(candidate.id); event.requirementIds = [...set]; event.updatedAt = app.now(); refreshUnlocks(); app.saveState(true);
          const count = items.filter(item => event.requirementIds.includes(item.id)).length; const counter = summary.querySelector("small"); if (counter) counter.textContent = count ? `${count} seleccionado${count===1?"":"s"}` : `${items.length} nodos`;
          renderMap(); renderEffects(event);
        });
        label.append(input, text); body.append(label);
      });
      details.append(body); els.requirements.append(details);
    });
  }
  function renderEffects(event) {
    els.unlocks.replaceChildren(); const children = directChildren(event.id);
    if (!children.length) { const p = document.createElement("p"); p.className = "history-empty-list"; p.textContent = "Este nodo todavía no tiene hijos directos."; els.unlocks.append(p); }
    children.forEach(child => els.unlocks.append(effectRow(typeMeta(child)[0], child.title, `${child.chapterId !== event.chapterId ? `${chapterTitle(child.chapterId)} · ` : ""}${requirementsMet(child) ? "Puede quedar disponible" : "Todavía tiene padres pendientes"}`, [{ label: "Abrir", run: () => { history().selectedChapterId = child.chapterId; history().selectedEventId = child.id; app.saveState(); render(); centerOnEvent(child); } }])));
    els.latentAtlas.replaceChildren();
    const scenes = campaign().atlas?.scenes?.filter(scene => scene.unlockEventId === event.id) || [];
    const markers = (campaign().atlas?.scenes || []).flatMap(scene => (scene.markers || []).filter(marker => marker.unlockEventId === event.id).map(marker => ({ scene, marker })));
    if (!scenes.length && !markers.length) { const p = document.createElement("p"); p.className = "history-empty-list"; p.textContent = "No hay contenido del Atlas controlado por este nodo."; els.latentAtlas.append(p); }
    scenes.forEach(scene => els.latentAtlas.append(effectRow(event.status === "occurred" ? "⌖" : "🔒", scene.name, event.status === "occurred" ? "Escena visible en el Atlas" : "Escena latente hasta que ocurra este nodo", [{ label: "Editar", run: () => window.ForjaAtlas?.openSceneDialog?.(scene.id) }])));
    markers.forEach(({ scene, marker }) => els.latentAtlas.append(effectRow(event.status === "occurred" ? "📍" : "🔒", marker.name || marker.alias || "Marcador sin nombre", `${scene.name} · ${event.status === "occurred" ? "visible" : "latente"}`, [{ label: "Editar", run: () => window.ForjaAtlas?.openMarkerDialog?.(scene.id, marker.id) }])));
  }

  function referenceTreeRow({ label, subtitle = "", icon = "", hasChildren = false, onAdd, children = [] }) {
    const wrap = document.createElement("div"); wrap.className = "history-ref-tree-item";
    const row = document.createElement("div"); row.className = "history-ref-tree-row";
    const toggle = document.createElement("button"); toggle.type = "button"; toggle.className = hasChildren ? "history-ref-tree-toggle" : "history-ref-tree-spacer"; toggle.textContent = hasChildren ? "›" : "";
    const add = document.createElement("button"); add.type = "button"; add.className = "history-ref-tree-add"; add.innerHTML = `<span>${app.escapeHtml(icon)}</span><strong>${app.escapeHtml(label)}</strong>${subtitle ? `<small>${app.escapeHtml(subtitle)}</small>` : ""}`; add.addEventListener("click", () => { if (typeof onAdd === "function") onAdd(); else if (hasChildren) toggle.click(); });
    row.append(toggle, add); wrap.append(row);
    if (hasChildren) { const childWrap = document.createElement("div"); childWrap.className = "history-ref-tree-children"; childWrap.hidden = true; children.forEach(child => childWrap.append(child)); toggle.addEventListener("click", () => { childWrap.hidden = !childWrap.hidden; toggle.classList.toggle("is-open", !childWrap.hidden); }); wrap.append(childWrap); }
    return wrap;
  }

  function renderEntryReferenceTree(event) {
    if (!els.entryTree) return; els.entryTree.replaceChildren();
    const entries = campaign().entries || [], types = app.getTypes();
    Object.entries(types).forEach(([typeId, meta]) => {
      const list = entries.filter(entry => entry.type === typeId); if (!list.length) return;
      const byParent = new Map(); list.forEach(entry => { const parent = list.some(item => item.id === entry.parentId) ? entry.parentId : ""; if (!byParent.has(parent)) byParent.set(parent, []); byParent.get(parent).push(entry); });
      byParent.forEach(items => items.sort((a,b) => (Number(a.order)||0)-(Number(b.order)||0) || a.name.localeCompare(b.name, "es")));
      const makeEntry = entry => { const kids = (byParent.get(entry.id) || []).map(makeEntry); return referenceTreeRow({ icon: meta.icon, label: entry.name, subtitle: chapterTitle(entry.chapterId), hasChildren: kids.length > 0, children: kids, onAdd: () => { event.linkedEntryIds ||= []; if (!event.linkedEntryIds.includes(entry.id)) event.linkedEntryIds.push(entry.id); event.updatedAt = app.now(); notifyStructuralChange(); render(); } }); };
      const roots = (byParent.get("") || []).map(makeEntry);
      els.entryTree.append(referenceTreeRow({ icon: meta.icon, label: meta.label, subtitle: `${list.length} ficha${list.length===1?"":"s"}`, hasChildren: true, children: roots, onAdd: null }));
    });
    if (!els.entryTree.children.length) els.entryTree.innerHTML = '<p class="history-empty-list">El Cuaderno está vacío.</p>';
  }

  function renderSceneReferenceTree(event, markerMode = false) {
    const root = markerMode ? els.markerTree : els.sceneTree; if (!root) return; root.replaceChildren();
    const scenes = campaign().atlas?.scenes || []; const byParent = new Map(); scenes.forEach(scene => { const parent = scenes.some(item => item.id === scene.parentSceneId) ? scene.parentSceneId : ""; if (!byParent.has(parent)) byParent.set(parent, []); byParent.get(parent).push(scene); });
    const makeScene = scene => {
      const sceneChildren = (byParent.get(scene.id) || []).map(makeScene);
      const markerChildren = markerMode ? (scene.markers || []).map(marker => referenceTreeRow({ icon: "📍", label: marker.name || marker.alias || "Marcador", subtitle: scene.name, onAdd: () => { const ref = `${scene.id}::${marker.id}`; event.linkedMarkerRefs ||= []; if (!event.linkedMarkerRefs.includes(ref)) event.linkedMarkerRefs.push(ref); event.updatedAt = app.now(); notifyStructuralChange(); render(); } })) : [];
      const children = markerMode ? [...markerChildren, ...sceneChildren] : sceneChildren;
      return referenceTreeRow({ icon: "⌖", label: scene.name, subtitle: markerMode ? `${(scene.markers||[]).length} marcadores` : "Escena", hasChildren: children.length > 0, children, onAdd: markerMode ? null : () => { event.linkedSceneIds ||= []; if (!event.linkedSceneIds.includes(scene.id)) event.linkedSceneIds.push(scene.id); event.updatedAt = app.now(); notifyStructuralChange(); render(); } });
    };
    (byParent.get("") || []).forEach(scene => root.append(makeScene(scene)));
    if (!root.children.length) root.innerHTML = `<p class="history-empty-list">${markerMode ? "No hay marcadores en el Atlas." : "El Atlas está vacío."}</p>`;
  }

  function renderReferenceTrees(event) { renderEntryReferenceTree(event); renderSceneReferenceTree(event, false); renderSceneReferenceTree(event, true); }

  function populateLinkSelects(event) {
    const entries = campaign().entries || [], scenes = campaign().atlas?.scenes || [];
    els.entrySelect.innerHTML = '<option value="">Selecciona una ficha…</option>' + Object.entries(app.getTypes()).map(([typeId, type]) => { const list = entries.filter(entry => entry.type === typeId); if (!list.length) return ""; return `<optgroup label="${app.escapeHtml(type.label)}">${list.map(entry => `<option value="${entry.id}">${app.escapeHtml(entry.name)}</option>`).join("")}</optgroup>`; }).join("");
    els.sceneSelect.innerHTML = '<option value="">Selecciona una escena…</option>' + scenes.map(scene => `<option value="${scene.id}">${app.escapeHtml(scene.name)}</option>`).join("");
    els.markerSelect.innerHTML = '<option value="">Selecciona un marcador…</option>' + scenes.flatMap(scene => (scene.markers || []).map(marker => `<option value="${scene.id}::${marker.id}">${app.escapeHtml(scene.name)} › ${app.escapeHtml(marker.name || marker.alias || "Marcador")}</option>`)).join("");
  }
  function openNotebookEntry(id) { if (!id) return; app.selectEntryForPanel?.(id); app.setView?.("notebook"); app.render?.(); }
  function openAtlasScene(id) { const scene = campaign().atlas?.scenes?.find(item => item.id === id); if (!scene) return; if (window.ForjaAtlas?.sceneIsUnlocked?.(scene)) { campaign().atlas.currentSceneId = id; app.setView?.("atlas"); app.saveState(); window.ForjaAtlas?.render?.(); } else window.ForjaAtlas?.openSceneDialog?.(id); }
  function openAtlasMarker(ref) { const [sceneId, markerId] = String(ref || "").split("::"); if (sceneId && markerId) window.ForjaAtlas?.openMarkerDialog?.(sceneId, markerId); }
  function renderCampaignLinks(event) {
    els.campaignLinks.replaceChildren(); populateLinkSelects(event); renderReferenceTrees(event);
    const rows = [];
    (event.linkedEntryIds || []).forEach(id => { const entry = campaign().entries?.find(item => item.id === id); if (entry) rows.push(effectRow("📖", entry.name, "Cuaderno", [{ label: "Abrir", run: () => openNotebookEntry(id) }, { label: "Quitar", run: () => removeLink(event, "linkedEntryIds", id) }])); });
    (event.linkedSceneIds || []).forEach(id => { const scene = campaign().atlas?.scenes?.find(item => item.id === id); if (scene) rows.push(effectRow("⌖", scene.name, "Escena del Atlas", [{ label: "Abrir", run: () => openAtlasScene(id) }, { label: "Quitar", run: () => removeLink(event, "linkedSceneIds", id) }])); });
    (event.linkedMarkerRefs || []).forEach(ref => { const [sceneId, markerId] = String(ref).split("::"); const scene = campaign().atlas?.scenes?.find(item => item.id === sceneId), marker = scene?.markers?.find(item => item.id === markerId); if (marker) rows.push(effectRow("📍", marker.name || marker.alias || "Marcador", scene.name, [{ label: "Editar", run: () => openAtlasMarker(ref) }, { label: "Quitar", run: () => removeLink(event, "linkedMarkerRefs", ref) }])); });
    if (!rows.length) { const p = document.createElement("p"); p.className = "history-empty-list"; p.textContent = "Todavía no has asociado nada del Cuaderno o el Atlas."; els.campaignLinks.append(p); } else rows.forEach(row => els.campaignLinks.append(row));
  }
  function removeLink(event, key, value) { event[key] = (event[key] || []).filter(item => item !== value); event.updatedAt = app.now(); notifyStructuralChange(); render(); }
  function addLink(key, select) { const event = selectedEvent(), value = select?.value; if (!event || !value) return; event[key] ||= []; if (!event[key].includes(value)) event[key].push(value); event.updatedAt = app.now(); select.value = ""; notifyStructuralChange(); render(); }

  function renderDetail() {
    const event = selectedEvent(); els.empty.hidden = Boolean(event); els.editor.hidden = !event; if (!event) return;
    const [icon, label] = STATUS[event.status] || STATUS.available; els.statusBadge.textContent = `${icon} ${label}`; els.statusBadge.dataset.status = event.status;
    if (document.activeElement !== els.title) els.title.value = event.title; if (document.activeElement !== els.description) els.description.value = event.description;
    els.nodeType.value = event.nodeType || "story"; els.requirementMode.value = event.requirementMode;
    if (els.moveChapter) { els.moveChapter.innerHTML = history().chapters.map(chapter => `<option value="${chapter.id}">${app.escapeHtml(chapter.title)}</option>`).join(""); els.moveChapter.value = event.chapterId; }
    els.markProgress.disabled = event.status === "locked" || event.status === "inProgress"; els.markOccurred.disabled = event.status === "locked" || event.status === "occurred"; els.discard.disabled = event.status === "discarded"; els.resetStatus.hidden = !["occurred", "discarded", "inProgress"].includes(event.status);
    renderRequirements(event); renderCampaignLinks(event); renderEffects(event);
  }
  function render() {
    refreshUnlocks(); ensureChapter();
    const selected = selectedEvent(); if (selected && selected.chapterId !== history().selectedChapterId) history().selectedChapterId = selected.chapterId;
    if (history().selectedEventId && !eventById(history().selectedEventId)) history().selectedEventId = chapterEvents()[0]?.id || "";
    renderChapters(); renderMap(); renderDetail();
  }

  function createChapter() {
    const n = history().chapters.length + 1; const title = prompt("Nombre del nuevo capítulo:", `Capítulo ${n}`); if (title === null) return;
    const chapter = { id: app.uid(), title: title.trim().slice(0, 100) || `Capítulo ${n}`, order: history().chapters.length, createdAt: app.now(), updatedAt: app.now() };
    history().chapters.push(chapter); history().selectedChapterId = chapter.id; history().selectedEventId = ""; notifyStructuralChange(); render();
  }
  function renameChapter() { const chapter = selectedChapter(); if (!chapter) return; const value = prompt("Nombre del capítulo:", chapter.title); if (value === null) return; chapter.title = value.trim().slice(0, 100) || chapter.title; chapter.updatedAt = app.now(); notifyStructuralChange(); render(); }
  function deleteChapter() {
    const chapter = selectedChapter(); if (!chapter) return; const events = chapterEvents(chapter.id); const linkedIds = new Set(events.map(event => event.id));
    if (!confirm(`¿Eliminar “${chapter.title}” y sus ${events.length} nodo${events.length === 1 ? "" : "s"}?\n\nEl contenido del Atlas que dependía de esos nodos pasará a ser visible para el DM.`)) return;
    history().events = history().events.filter(event => event.chapterId !== chapter.id); history().events.forEach(event => { event.requirementIds = event.requirementIds.filter(id => !linkedIds.has(id)); });
    (campaign().atlas?.scenes || []).forEach(scene => { if (linkedIds.has(scene.unlockEventId)) scene.unlockEventId = ""; (scene.markers || []).forEach(marker => { if (linkedIds.has(marker.unlockEventId)) marker.unlockEventId = ""; }); });
    (campaign().entries || []).forEach(entry => { if (entry.chapterId === chapter.id) entry.chapterId = ""; });
    if (campaign().notebookChapterFilter === chapter.id) campaign().notebookChapterFilter = "all";
    history().chapters = history().chapters.filter(item => item.id !== chapter.id); history().chapters.forEach((item, index) => item.order = index); history().selectedChapterId = history().chapters[0]?.id || ""; history().selectedEventId = chapterEvents(history().selectedChapterId)[0]?.id || ""; refreshUnlocks(); notifyStructuralChange(); render();
  }
  function createEvent(parentId = "") {
    let chapter = selectedChapter(); if (!chapter) { const fallback = { id: app.uid(), title: "Capítulo 1", order: 0, createdAt: app.now(), updatedAt: app.now() }; history().chapters.push(fallback); history().selectedChapterId = fallback.id; chapter = fallback; }
    const parent = parentId ? eventById(parentId) : null; const siblings = parent ? chapterEvents(chapter.id).filter(event => event.requirementIds.includes(parent.id)) : chapterEvents(chapter.id).filter(event => !event.requirementIds.length);
    const event = { id: app.uid(), chapterId: chapter.id, title: parent ? "Nuevo paso" : "Nuevo suceso", description: "", nodeType: "story", status: parent && parent.status !== "occurred" ? "locked" : "available", requirementMode: "all", requirementIds: parent ? [parent.id] : [], linkedEntryIds: [], linkedSceneIds: [], linkedMarkerRefs: [], x: parent ? clampPosition(parent.x + 290, STAGE_W - NODE_W - 24) : 80, y: parent ? clampPosition(parent.y + siblings.length * 120, STAGE_H - NODE_H - 24) : 80 + siblings.length * 120, createdAt: app.now(), updatedAt: app.now() };
    history().events.push(event); history().selectedEventId = event.id; notifyStructuralChange(); render(); centerOnEvent(event); setTimeout(() => { els.title.focus(); els.title.select(); }, 0);
  }
  function moveSelectedToChapter() {
    const event = selectedEvent(), targetId = els.moveChapter?.value || ""; if (!event || !chapterById(targetId) || targetId === event.chapterId) return;
    const descendants = [...descendantIds(event.id)].map(eventById).filter(Boolean);
    const moveChildren = descendants.length ? confirm(`Este nodo tiene ${descendants.length} descendiente${descendants.length===1?"":"s"}.\n\nAceptar: mover también sus hijos/descendientes a “${chapterTitle(targetId)}”.\nCancelar: mover sólo este nodo.`) : false;
    const moving = moveChildren ? [event, ...descendants] : [event];
    moving.forEach((node, index) => { node.chapterId = targetId; node.x = clampPosition(80 + (index % 4) * 290, STAGE_W - NODE_W - 24); node.y = clampPosition(80 + Math.floor(index / 4) * 130, STAGE_H - NODE_H - 24); node.updatedAt = app.now(); });
    history().selectedChapterId = targetId; history().selectedEventId = event.id; refreshUnlocks(); notifyStructuralChange(); render(); centerOnEvent(event);
  }

  function setStatus(status) { const event = selectedEvent(); if (!event) return; if (["inProgress", "occurred"].includes(status) && !requirementsMet(event)) { alert("Este nodo todavía tiene padres pendientes."); return; } event.status = status; event.updatedAt = app.now(); refreshUnlocks(); notifyStructuralChange(); render(); }
  function deleteSelected() {
    const event = selectedEvent(); if (!event) return; const linkedScenes = campaign().atlas?.scenes?.filter(scene => scene.unlockEventId === event.id) || []; const linkedMarkers = (campaign().atlas?.scenes || []).flatMap(scene => (scene.markers || []).filter(marker => marker.unlockEventId === event.id));
    if (!confirm(`¿Eliminar el nodo “${event.title}”?${linkedScenes.length + linkedMarkers.length ? "\n\nEl contenido del Atlas que dependía de este nodo pasará a ser visible para el DM." : ""}`)) return;
    history().events = history().events.filter(candidate => candidate.id !== event.id); history().events.forEach(candidate => { candidate.requirementIds = candidate.requirementIds.filter(id => id !== event.id); }); linkedScenes.forEach(scene => scene.unlockEventId = ""); linkedMarkers.forEach(marker => marker.unlockEventId = ""); history().selectedEventId = chapterEvents(event.chapterId)[0]?.id || ""; refreshUnlocks(); notifyStructuralChange(); render();
  }
  function autoLayout() {
    const list = chapterEvents(); if (!list.length) return; const ids = new Set(list.map(event => event.id)); const depthCache = new Map();
    const depthOf = (event, visiting = new Set()) => { if (depthCache.has(event.id)) return depthCache.get(event.id); if (visiting.has(event.id)) return 0; const next = new Set(visiting); next.add(event.id); const parents = event.requirementIds.map(eventById).filter(parent => parent && ids.has(parent.id)); const depth = parents.length ? 1 + Math.max(...parents.map(parent => depthOf(parent, next))) : 0; depthCache.set(event.id, depth); return depth; };
    const rows = new Map(); list.sort((a,b) => depthOf(a)-depthOf(b) || a.createdAt.localeCompare?.(b.createdAt) || 0).forEach(event => { const depth = Math.min(10, depthOf(event)), row = rows.get(depth) || 0; rows.set(depth, row+1); event.x = 70 + depth * 290; event.y = 70 + row * 125; event.updatedAt = app.now(); }); notifyStructuralChange(); render();
  }
  function centerOnEvent(event = selectedEvent()) { if (!event || !els.mapViewport) return; requestAnimationFrame(() => { els.mapViewport.scrollTo({ left: Math.max(0, event.x - els.mapViewport.clientWidth / 2 + NODE_W / 2), top: Math.max(0, event.y - els.mapViewport.clientHeight / 2 + NODE_H / 2), behavior: "smooth" }); }); }
  function nudge(dx, dy) { const event = selectedEvent(); if (!event) return; event.x = clampPosition(event.x + dx, STAGE_W - NODE_W - 24); event.y = clampPosition(event.y + dy, STAGE_H - NODE_H - 24); event.updatedAt = app.now(); app.saveState(); renderMap(); }

  els.newChapter.addEventListener("click", createChapter); els.renameChapter.addEventListener("click", renameChapter); els.deleteChapter.addEventListener("click", deleteChapter);
  els.newEvent.addEventListener("click", () => createEvent()); els.emptyNewEvent.addEventListener("click", () => createEvent()); els.addChild.addEventListener("click", () => { const event = selectedEvent(); if (event) createEvent(event.id); });
  els.title.addEventListener("input", () => { const event = selectedEvent(); if (!event) return; event.title = els.title.value.slice(0,140) || "Nodo sin nombre"; event.updatedAt = app.now(); app.saveState(); renderMap(); renderEffects(event); });
  els.nodeType.addEventListener("change", () => { const event = selectedEvent(); if (!event) return; event.nodeType = NODE_TYPES[els.nodeType.value] ? els.nodeType.value : "story"; event.updatedAt = app.now(); app.saveState(); renderMap(); });
  els.description.addEventListener("input", () => { const event = selectedEvent(); if (!event) return; event.description = els.description.value.slice(0,6000); event.updatedAt = app.now(); app.saveState(); });
  els.requirementMode.addEventListener("change", () => { const event = selectedEvent(); if (!event) return; event.requirementMode = els.requirementMode.value === "any" ? "any" : "all"; event.updatedAt = app.now(); refreshUnlocks(); notifyStructuralChange(); render(); });
  els.moveNodeChapter?.addEventListener("click", moveSelectedToChapter);
  els.markProgress.addEventListener("click", () => setStatus("inProgress")); els.markOccurred.addEventListener("click", () => setStatus("occurred")); els.discard.addEventListener("click", () => setStatus("discarded")); els.resetStatus.addEventListener("click", () => { const event = selectedEvent(); if (!event) return; event.status = requirementsMet(event) ? "available" : "locked"; event.updatedAt = app.now(); refreshUnlocks(); notifyStructuralChange(); render(); }); els.deleteEvent.addEventListener("click", deleteSelected);
  els.addEntry.addEventListener("click", () => addLink("linkedEntryIds", els.entrySelect)); els.addScene.addEventListener("click", () => addLink("linkedSceneIds", els.sceneSelect)); els.addMarker.addEventListener("click", () => addLink("linkedMarkerRefs", els.markerSelect));
  els.autoLayout.addEventListener("click", autoLayout); els.centerSelection.addEventListener("click", () => centerOnEvent());
  els.moveLeft.addEventListener("click", () => nudge(-24,0)); els.moveRight.addEventListener("click", () => nudge(24,0)); els.moveUp.addEventListener("click", () => nudge(0,-24)); els.moveDown.addEventListener("click", () => nudge(0,24));
  els.nodeLayer.addEventListener("pointermove", moveDrag); els.nodeLayer.addEventListener("pointerup", endDrag); els.nodeLayer.addEventListener("pointercancel", endDrag);
  document.addEventListener("forja:campaignchange", render); document.addEventListener("forja:historychange", () => { if (campaign().view === "history") render(); });
  window.ForjaHistory = { render, refreshUnlocks, requirementsMet, eventById, chapterById };
  render();
})();
