(() => {
  "use strict";
  const app = window.ForjaApp;
  if (!app) return;
  const $ = selector => document.querySelector(selector);

  const els = {
    view: $("#historyView"), newEvent: $("#historyNewEvent"), availableList: $("#historyAvailableList"), lockedList: $("#historyLockedList"), resolvedList: $("#historyResolvedList"),
    availableCount: $("#historyAvailableCount"), lockedCount: $("#historyLockedCount"), resolvedCount: $("#historyResolvedCount"), empty: $("#historyEmpty"), editor: $("#historyEditor"),
    statusBadge: $("#historyStatusBadge"), title: $("#historyEventTitle"), description: $("#historyEventDescription"), requirementMode: $("#historyRequirementMode"), requirements: $("#historyRequirements"),
    markProgress: $("#historyMarkProgress"), markOccurred: $("#historyMarkOccurred"), discard: $("#historyDiscard"), resetStatus: $("#historyResetStatus"), deleteEvent: $("#historyDeleteEvent"),
    unlocks: $("#historyUnlocks"), latentAtlas: $("#historyLatentAtlas")
  };
  if (!els.view) return;

  const STATUS = {
    locked: ["🔒", "Bloqueado"], available: ["○", "Disponible"], inProgress: ["▶", "En curso"], occurred: ["✓", "Ocurrido"], discarded: ["×", "Descartado"]
  };

  function campaign() { return app.getState(); }
  function history() {
    const state = campaign();
    if (!state.history || !Array.isArray(state.history.events)) state.history = { selectedEventId: "", events: [] };
    return state.history;
  }
  function eventById(id) { return history().events.find(event => event.id === id) || null; }
  function selectedEvent() { return eventById(history().selectedEventId); }
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
  function notifyStructuralChange() {
    app.saveState(true);
    document.dispatchEvent(new CustomEvent("forja:historychange"));
  }

  function makeEventCard(event) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `history-event-card history-event-card--${event.status}${event.id === history().selectedEventId ? " is-selected" : ""}`;
    const [icon, label] = STATUS[event.status] || STATUS.available;
    const dependentCount = history().events.filter(candidate => candidate.requirementIds?.includes(event.id)).length;
    const sceneCount = campaign().atlas?.scenes?.filter(scene => scene.unlockEventId === event.id).length || 0;
    const markerCount = campaign().atlas?.scenes?.reduce((total, scene) => total + (scene.markers || []).filter(marker => marker.unlockEventId === event.id).length, 0) || 0;
    const reqText = event.requirementIds?.length ? `${event.requirementIds.length} requisito${event.requirementIds.length === 1 ? "" : "s"}` : "Sin requisitos";
    button.innerHTML = `<span class="history-event-card__status">${icon}</span><span class="history-event-card__body"><strong></strong><small>${label} · ${reqText}</small><span class="history-event-card__effects">${dependentCount ? `⌁ ${dependentCount}` : ""}${sceneCount ? `⌖ ${sceneCount}` : ""}${markerCount ? `📍 ${markerCount}` : ""}</span></span>`;
    button.querySelector("strong").textContent = event.title || "Suceso sin nombre";
    button.addEventListener("click", () => { history().selectedEventId = event.id; app.saveState(); render(); });
    return button;
  }

  function renderBoard() {
    els.availableList.replaceChildren(); els.lockedList.replaceChildren(); els.resolvedList.replaceChildren();
    const available = [], locked = [], resolved = [];
    history().events.forEach(event => {
      if (event.status === "locked") locked.push(event);
      else if (["occurred", "discarded"].includes(event.status)) resolved.push(event);
      else available.push(event);
    });
    const add = (root, list, emptyText) => {
      if (!list.length) { const empty = document.createElement("p"); empty.className = "history-lane-empty"; empty.textContent = emptyText; root.append(empty); return; }
      list.forEach(event => root.append(makeEventCard(event)));
    };
    add(els.availableList, available, "Nada disponible todavía.");
    add(els.lockedList, locked, "No hay sucesos bloqueados.");
    add(els.resolvedList, resolved, "Todavía no ha ocurrido nada.");
    els.availableCount.textContent = available.length; els.lockedCount.textContent = locked.length; els.resolvedCount.textContent = resolved.length;
  }

  function effectRow(icon, title, subtitle, action) {
    const row = document.createElement("div"); row.className = "history-effect-row";
    const glyph = document.createElement("span"); glyph.className = "history-effect-row__icon"; glyph.textContent = icon;
    const text = document.createElement("div"); const strong = document.createElement("strong"); strong.textContent = title; text.append(strong);
    if (subtitle) { const small = document.createElement("small"); small.textContent = subtitle; text.append(small); }
    row.append(glyph, text);
    if (action) { const button = document.createElement("button"); button.type = "button"; button.className = "button button--quiet"; button.textContent = action.label; button.addEventListener("click", action.run); row.append(button); }
    return row;
  }

  function renderRequirements(event) {
    els.requirements.replaceChildren();
    const others = history().events.filter(candidate => candidate.id !== event.id);
    if (!others.length) { const p = document.createElement("p"); p.className = "history-empty-list"; p.textContent = "Crea otro suceso para poder usarlo como requisito."; els.requirements.append(p); return; }
    others.forEach(candidate => {
      const label = document.createElement("label"); label.className = "history-requirement";
      const input = document.createElement("input"); input.type = "checkbox"; input.checked = event.requirementIds.includes(candidate.id);
      const text = document.createElement("span"); const strong = document.createElement("strong"); strong.textContent = candidate.title; const small = document.createElement("small"); small.textContent = `${STATUS[candidate.status]?.[0] || "○"} ${STATUS[candidate.status]?.[1] || candidate.status}`; text.append(strong, small);
      input.addEventListener("change", () => {
        const set = new Set(event.requirementIds);
        if (input.checked) set.add(candidate.id); else set.delete(candidate.id);
        event.requirementIds = [...set]; event.updatedAt = app.now(); refreshUnlocks(); notifyStructuralChange(); render();
      });
      label.append(input, text); els.requirements.append(label);
    });
  }

  function renderEffects(event) {
    els.unlocks.replaceChildren();
    const dependents = history().events.filter(candidate => candidate.requirementIds.includes(event.id));
    if (!dependents.length) { const p = document.createElement("p"); p.className = "history-empty-list"; p.textContent = "Este suceso todavía no desbloquea otros sucesos."; els.unlocks.append(p); }
    dependents.forEach(candidate => els.unlocks.append(effectRow("⌁", candidate.title, requirementsMet(candidate) ? "Requisitos satisfechos" : "Aún tiene requisitos pendientes", { label: "Abrir", run: () => { history().selectedEventId = candidate.id; app.saveState(); render(); } })));

    els.latentAtlas.replaceChildren();
    const scenes = campaign().atlas?.scenes?.filter(scene => scene.unlockEventId === event.id) || [];
    const markers = (campaign().atlas?.scenes || []).flatMap(scene => (scene.markers || []).filter(marker => marker.unlockEventId === event.id).map(marker => ({ scene, marker })));
    if (!scenes.length && !markers.length) { const p = document.createElement("p"); p.className = "history-empty-list"; p.textContent = "No hay escenas ni marcadores del Atlas vinculados a este suceso."; els.latentAtlas.append(p); }
    scenes.forEach(scene => els.latentAtlas.append(effectRow(event.status === "occurred" ? "⌖" : "🔒", scene.name, event.status === "occurred" ? "Escena ya visible en el Atlas del DM" : "Escena latente hasta que ocurra este suceso", { label: "Editar", run: () => window.ForjaAtlas?.openSceneDialog?.(scene.id) })));
    markers.forEach(({ scene, marker }) => {
      const name = marker.name || marker.alias || "Marcador sin nombre";
      els.latentAtlas.append(effectRow(event.status === "occurred" ? "📍" : "🔒", name, `${scene.name} · ${event.status === "occurred" ? "Marcador ya visible para el DM" : "Marcador latente hasta que ocurra este suceso"}`, { label: "Editar", run: () => window.ForjaAtlas?.openMarkerDialog?.(scene.id, marker.id) }));
    });
  }

  function renderDetail() {
    const event = selectedEvent();
    els.empty.hidden = Boolean(event); els.editor.hidden = !event;
    if (!event) return;
    const [icon, label] = STATUS[event.status] || STATUS.available;
    els.statusBadge.textContent = `${icon} ${label}`; els.statusBadge.dataset.status = event.status;
    if (document.activeElement !== els.title) els.title.value = event.title;
    if (document.activeElement !== els.description) els.description.value = event.description;
    els.requirementMode.value = event.requirementMode;
    els.markProgress.disabled = event.status === "locked" || event.status === "inProgress";
    els.markOccurred.disabled = event.status === "locked" || event.status === "occurred";
    els.discard.disabled = event.status === "discarded";
    els.resetStatus.hidden = !["occurred", "discarded", "inProgress"].includes(event.status);
    renderRequirements(event); renderEffects(event);
  }

  function render() {
    refreshUnlocks();
    if (history().selectedEventId && !eventById(history().selectedEventId)) history().selectedEventId = history().events[0]?.id || "";
    renderBoard(); renderDetail();
  }

  function createEvent() {
    const event = { id: app.uid(), title: "Nuevo suceso", description: "", status: "available", requirementMode: "all", requirementIds: [], createdAt: app.now(), updatedAt: app.now() };
    history().events.push(event); history().selectedEventId = event.id; notifyStructuralChange(); render(); setTimeout(() => { els.title.focus(); els.title.select(); }, 0);
  }
  function setStatus(status) {
    const event = selectedEvent(); if (!event) return;
    if (["inProgress", "occurred"].includes(status) && !requirementsMet(event)) { alert("Este suceso todavía tiene requisitos pendientes."); return; }
    event.status = status; event.updatedAt = app.now(); refreshUnlocks(); notifyStructuralChange(); render();
  }
  function deleteSelected() {
    const event = selectedEvent(); if (!event) return;
    const linkedScenes = campaign().atlas?.scenes?.filter(scene => scene.unlockEventId === event.id) || [];
    const linkedMarkers = (campaign().atlas?.scenes || []).flatMap(scene => (scene.markers || []).filter(marker => marker.unlockEventId === event.id));
    const linkedTotal = linkedScenes.length + linkedMarkers.length;
    const extra = linkedTotal ? `\n\n${linkedScenes.length ? `${linkedScenes.length} escena${linkedScenes.length === 1 ? "" : "s"}` : ""}${linkedScenes.length && linkedMarkers.length ? " y " : ""}${linkedMarkers.length ? `${linkedMarkers.length} marcador${linkedMarkers.length === 1 ? "" : "es"}` : ""} del Atlas ${linkedTotal === 1 ? "dejará" : "dejarán"} de estar latente${linkedTotal === 1 ? "" : "s"} y ${linkedTotal === 1 ? "pasará" : "pasarán"} a ser visible${linkedTotal === 1 ? "" : "s"} para el DM.` : "";
    if (!confirm(`¿Eliminar el suceso “${event.title}”?${extra}`)) return;
    history().events = history().events.filter(candidate => candidate.id !== event.id);
    history().events.forEach(candidate => { candidate.requirementIds = candidate.requirementIds.filter(id => id !== event.id); });
    linkedScenes.forEach(scene => { scene.unlockEventId = ""; scene.updatedAt = app.now(); });
    linkedMarkers.forEach(marker => { marker.unlockEventId = ""; });
    history().selectedEventId = history().events[0]?.id || ""; refreshUnlocks(); notifyStructuralChange(); render();
  }

  els.newEvent.addEventListener("click", createEvent);
  els.title.addEventListener("input", () => { const event = selectedEvent(); if (!event) return; event.title = els.title.value.slice(0, 140) || "Suceso sin nombre"; event.updatedAt = app.now(); app.saveState(); renderBoard(); });
  els.description.addEventListener("input", () => { const event = selectedEvent(); if (!event) return; event.description = els.description.value.slice(0, 6000); event.updatedAt = app.now(); app.saveState(); });
  els.requirementMode.addEventListener("change", () => { const event = selectedEvent(); if (!event) return; event.requirementMode = els.requirementMode.value === "any" ? "any" : "all"; event.updatedAt = app.now(); refreshUnlocks(); notifyStructuralChange(); render(); });
  els.markProgress.addEventListener("click", () => setStatus("inProgress"));
  els.markOccurred.addEventListener("click", () => setStatus("occurred"));
  els.discard.addEventListener("click", () => setStatus("discarded"));
  els.resetStatus.addEventListener("click", () => { const event = selectedEvent(); if (!event) return; event.status = requirementsMet(event) ? "available" : "locked"; event.updatedAt = app.now(); refreshUnlocks(); notifyStructuralChange(); render(); });
  els.deleteEvent.addEventListener("click", deleteSelected);
  document.addEventListener("forja:campaignchange", render);

  window.ForjaHistory = { render, refreshUnlocks, requirementsMet, eventById };
  render();
})();
