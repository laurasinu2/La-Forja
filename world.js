(() => {
  "use strict";

  const app = window.ForjaApp;
  if (!app) return;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = value => app.escapeHtml(String(value ?? ""));
  const MEDIA_DB = "forja-narrador-media-v1";
  const MEDIA_STORE = "images";
  let mediaDbPromise = null;
  let creatureSearch = "";
  let organisationSearch = "";
  let creatureDraft = null;
  let organisationDraft = null;
  let characterDraft = null;
  let editingCreatureId = "";
  let editingOrganisationId = "";
  let editingCharacterId = "";
  let editingMemberId = "";
  let editingMemberOrganisationId = "";
  let viewingCharacterId = "";
  const ALL_CREATURES_CATEGORY = "__all";

  const STAT_KEYS = ["hp", "maxhp", "ac", "speed", "initiative", "proficiency", "str", "dex", "con", "int", "wis", "cha"];
  const STAT_LABELS = { hp: "PG", maxhp: "PG máx.", ac: "CA", speed: "Vel.", initiative: "Inic.", proficiency: "Comp.", str: "FUE", dex: "DES", con: "CON", int: "INT", wis: "SAB", cha: "CAR" };

  const els = {
    view: $("#worldView"), tabs: $$(".world-tab"), creaturesSection: $("#worldCreaturesSection"), organisationsSection: $("#worldOrganisationsSection"),
    newCreature: $("#worldNewCreature"), newOrganisation: $("#worldNewOrganisation"), creatureSearch: $("#worldCreatureSearch"), organisationSearch: $("#worldOrganisationSearch"),
    creatureCategories: $("#worldCreatureCategories"), newCreatureCategory: $("#worldNewCreatureCategory"),
    creatureList: $("#worldCreatureList"), organisationList: $("#worldOrganisationList"), creatureDetail: $("#worldCreatureDetail"), organisationDetail: $("#worldOrganisationDetail"),
    creatureDialog: $("#worldCreatureDialog"), creatureForm: $("#worldCreatureForm"), creatureDialogTitle: $("#worldCreatureDialogTitle"), creatureName: $("#worldCreatureName"), creatureType: $("#worldCreatureType"), creatureCategory: $("#worldCreatureCategory"), creatureTags: $("#worldCreatureTags"), creatureDescription: $("#worldCreatureDescription"), creatureModifiers: $("#worldCreatureModifiers"), creatureAbilities: $("#worldCreatureAbilities"), creatureCombatStyle: $("#worldCreatureCombatStyle"), creatureNonAggression: $("#worldCreatureNonAggression"), creatureActions: $("#worldCreatureActions"), creatureReactions: $("#worldCreatureReactions"), creaturePhotoPreview: $("#worldCreaturePhotoPreview"), creaturePhotoEmpty: $("#worldCreaturePhotoEmpty"), creaturePhotoInput: $("#worldCreaturePhotoInput"), creaturePhotoChoose: $("#worldCreaturePhotoChoose"), creaturePhotoRemove: $("#worldCreaturePhotoRemove"), creatureLootList: $("#worldCreatureLootList"), creatureLootName: $("#worldCreatureLootName"), creatureLootQty: $("#worldCreatureLootQty"), creatureLootNotes: $("#worldCreatureLootNotes"), creatureLootAdd: $("#worldCreatureLootAdd"), creatureDelete: $("#worldCreatureDelete"),
    organisationDialog: $("#worldOrganisationDialog"), organisationForm: $("#worldOrganisationForm"), organisationDialogTitle: $("#worldOrganisationDialogTitle"), organisationName: $("#worldOrganisationName"), organisationHeadquarters: $("#worldOrganisationHeadquarters"), organisationDescription: $("#worldOrganisationDescription"), organisationGoals: $("#worldOrganisationGoals"), organisationAttitude: $("#worldOrganisationAttitude"), organisationNotes: $("#worldOrganisationNotes"), organisationPhotoPreview: $("#worldOrganisationPhotoPreview"), organisationPhotoEmpty: $("#worldOrganisationPhotoEmpty"), organisationPhotoInput: $("#worldOrganisationPhotoInput"), organisationPhotoChoose: $("#worldOrganisationPhotoChoose"), organisationPhotoRemove: $("#worldOrganisationPhotoRemove"), organisationDelete: $("#worldOrganisationDelete"),
    memberDialog: $("#worldMemberDialog"), memberForm: $("#worldMemberForm"), memberCharacter: $("#worldMemberCharacter"), memberNewNameWrap: $("#worldMemberNewNameWrap"), memberNewName: $("#worldMemberNewName"), memberRole: $("#worldMemberRole"), memberParent: $("#worldMemberParent"), memberRemove: $("#worldMemberRemove"),
    characterDialog: $("#worldCharacterDialog"), characterForm: $("#worldCharacterForm"), characterDialogTitle: $("#worldCharacterDialogTitle"), characterName: $("#worldCharacterName"), characterType: $("#worldCharacterType"), characterDisposition: $("#worldCharacterDisposition"), characterDescription: $("#worldCharacterDescription"), characterModifiers: $("#worldCharacterModifiers"), characterAbilities: $("#worldCharacterAbilities"), characterCombatStyle: $("#worldCharacterCombatStyle"), characterNonAggression: $("#worldCharacterNonAggression"), characterActions: $("#worldCharacterActions"), characterReactions: $("#worldCharacterReactions"), characterNotes: $("#worldCharacterNotes"), characterPhotoPreview: $("#worldCharacterPhotoPreview"), characterPhotoEmpty: $("#worldCharacterPhotoEmpty"), characterPhotoInput: $("#worldCharacterPhotoInput"), characterPhotoChoose: $("#worldCharacterPhotoChoose"), characterPhotoRemove: $("#worldCharacterPhotoRemove"), characterDelete: $("#worldCharacterDelete"),
    characterViewDialog: $("#worldCharacterViewDialog"), characterViewTitle: $("#worldCharacterViewTitle"), characterViewSubtitle: $("#worldCharacterViewSubtitle"), characterViewBody: $("#worldCharacterViewBody"), characterViewEdit: $("#worldCharacterViewEdit")
  };

  function state() { return app.getState(); }
  function world() {
    const campaign = state();
    if (!campaign.world || typeof campaign.world !== "object") campaign.world = { selectedSection: "creatures", selectedCreatureId: "", selectedCreatureCategoryId: ALL_CREATURES_CATEGORY, selectedOrganisationId: "", selectedCharacterId: "", creatureCategories: [], creatures: [], characters: [], organisations: [] };
    campaign.world.creatures ||= [];
    campaign.world.characters ||= [];
    campaign.world.organisations ||= [];
    campaign.world.creatureCategories ||= [];
    campaign.world.creatureCategories = campaign.world.creatureCategories.filter(item => item && item.id && String(item.name || "").trim()).map(item => ({ ...item, name: String(item.name).trim().slice(0, 80) }));
    campaign.world.creatures.forEach(item => { if (typeof item.categoryId !== "string") item.categoryId = ""; });
    const validCategoryIds = new Set(campaign.world.creatureCategories.map(item => item.id));
    if (campaign.world.selectedCreatureCategoryId !== ALL_CREATURES_CATEGORY && !validCategoryIds.has(campaign.world.selectedCreatureCategoryId)) campaign.world.selectedCreatureCategoryId = ALL_CREATURES_CATEGORY;
    return campaign.world;
  }
  function save(renderAfter = false) { app.saveState(); if (renderAfter) render(); }
  function optionalNumber(value) { return value === "" || value === null || value === undefined || !Number.isFinite(Number(value)) ? "" : Number(value); }
  function blankStats() { return Object.fromEntries(STAT_KEYS.map(key => [key, ""])); }
  function blankCreature(name = "Nueva criatura", kind = "creature") {
    return { id: app.uid(), kind, name, imageId: "", type: "", categoryId: "", tags: "", description: "", disposition: "neutral", stats: blankStats(), modifiers: "", abilities: "", combatStyle: "", nonAggression: "", actions: "", reactions: "", notes: "", loot: [], createdAt: app.now(), updatedAt: app.now() };
  }
  function blankOrganisation() { return { id: app.uid(), name: "Nueva organización", imageId: "", description: "", headquarters: "", goals: "", attitude: "", notes: "", members: [], createdAt: app.now(), updatedAt: app.now() }; }
  function creatureById(id) { return world().creatures.find(item => item.id === id) || null; }
  function characterById(id) { return world().characters.find(item => item.id === id) || null; }
  function organisationById(id) { return world().organisations.find(item => item.id === id) || null; }

  function openMediaDb() {
    if (mediaDbPromise) return mediaDbPromise;
    mediaDbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(MEDIA_DB, 1);
      request.onupgradeneeded = () => { const db = request.result; if (!db.objectStoreNames.contains(MEDIA_STORE)) db.createObjectStore(MEDIA_STORE, { keyPath: "id" }); };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("No se pudo abrir el almacenamiento de imágenes."));
    });
    return mediaDbPromise;
  }
  async function putImage(file) {
    const db = await openMediaDb();
    const id = app.uid();
    const record = { id, blob: file, name: file.name || "Imagen", type: file.type || "image/png", createdAt: app.now() };
    await new Promise((resolve, reject) => { const tx = db.transaction(MEDIA_STORE, "readwrite"); tx.objectStore(MEDIA_STORE).put(record); tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); });
    return id;
  }
  async function imageUrl(id) {
    if (!id) return "";
    const db = await openMediaDb();
    const record = await new Promise((resolve, reject) => { const tx = db.transaction(MEDIA_STORE, "readonly"); const req = tx.objectStore(MEDIA_STORE).get(id); req.onsuccess = () => resolve(req.result || null); req.onerror = () => reject(req.error); });
    return record?.blob ? URL.createObjectURL(record.blob) : "";
  }
  async function setImageElement(img, empty, id, alt = "") {
    if (!img) return;
    if (img.dataset.objectUrl) { URL.revokeObjectURL(img.dataset.objectUrl); delete img.dataset.objectUrl; }
    if (!id) { img.hidden = true; img.removeAttribute("src"); if (empty) empty.hidden = false; return; }
    const url = await imageUrl(id).catch(() => "");
    if (!url) { img.hidden = true; if (empty) empty.hidden = false; return; }
    img.dataset.objectUrl = url; img.src = url; img.alt = alt; img.hidden = false; if (empty) empty.hidden = true;
  }

  function worldReferenceLabel(type, id) {
    if (type === "creature") return creatureById(id)?.name || "";
    if (type === "character") return characterById(id)?.name || "";
    if (type === "organisation") return organisationById(id)?.name || "";
    return "";
  }
  function referenceItems(type) {
    if (type === "creature") return world().creatures.map(item => ({ id: item.id, name: item.name }));
    if (type === "character") return world().characters.map(item => ({ id: item.id, name: item.name }));
    if (type === "organisation") return world().organisations.map(item => ({ id: item.id, name: item.name }));
    return [];
  }
  function referenceTree() {
    const w = world();
    const creatureItem = item => ({ type: "creature", id: item.id, name: item.name, imageId: item.imageId || "" });
    const allCreatures = w.creatures.slice().sort((a,b)=>a.name.localeCompare(b.name,"es"));
    const creatureGroups = [{ id: ALL_CREATURES_CATEGORY, name: "Todos", fixed: true, items: allCreatures.map(creatureItem) }];
    w.creatureCategories.slice().sort((a,b)=>a.name.localeCompare(b.name,"es")).forEach(category => {
      creatureGroups.push({ id: category.id, name: category.name, items: allCreatures.filter(item => item.categoryId === category.id).map(creatureItem) });
    });
    const uncategorised = allCreatures.filter(item => !item.categoryId);
    if (uncategorised.length) creatureGroups.push({ id: "__none", name: "Sin categoría", items: uncategorised.map(creatureItem) });

    const organisationGroups = w.organisations.slice().sort((a,b)=>a.name.localeCompare(b.name,"es")).map(org => {
      const seen = new Set();
      const characters = [];
      org.members.forEach(member => {
        if (seen.has(member.characterId)) return;
        const character = characterById(member.characterId);
        if (!character) return;
        seen.add(character.id);
        characters.push({ type: "character", id: character.id, name: character.name, role: member.role || "", imageId: character.imageId || "" });
      });
      characters.sort((a,b)=>a.name.localeCompare(b.name,"es"));
      return { id: org.id, name: org.name, organisation: { type: "organisation", id: org.id, name: org.name, imageId: org.imageId || "" }, characters };
    });
    const memberCharacterIds = new Set(w.organisations.flatMap(org => org.members.map(member => member.characterId)));
    const unattachedCharacters = w.characters.filter(character => !memberCharacterIds.has(character.id)).sort((a,b)=>a.name.localeCompare(b.name,"es")).map(character => ({ type: "character", id: character.id, name: character.name, role: "", imageId: character.imageId || "" }));
    return { creatureGroups, organisationGroups, unattachedCharacters };
  }

  function section(sectionName) {
    const w = world();
    w.selectedSection = sectionName === "organisations" ? "organisations" : "creatures";
    els.tabs.forEach(tab => tab.classList.toggle("is-active", tab.dataset.worldSection === w.selectedSection));
    if (els.creaturesSection) els.creaturesSection.hidden = w.selectedSection !== "creatures";
    if (els.organisationsSection) els.organisationsSection.hidden = w.selectedSection !== "organisations";
    if (els.newCreature) els.newCreature.hidden = w.selectedSection !== "creatures";
    if (els.newOrganisation) els.newOrganisation.hidden = w.selectedSection !== "organisations";
  }

  function emptyDetail(icon, title, text, actionHtml = "") { return `<div class="world-empty-detail"><div><span>${icon}</span><h2>${esc(title)}</h2><p>${esc(text)}</p>${actionHtml}</div></div>`; }

  function asyncThumb(container, id, fallback) {
    if (!container || !id) return;
    imageUrl(id).then(url => {
      if (!url || !container.isConnected) { if (url) URL.revokeObjectURL(url); return; }
      container.replaceChildren(); const img = document.createElement("img"); img.src = url; img.alt = ""; img.onload = () => {}; container.append(img);
    }).catch(() => { container.textContent = fallback; });
  }

  function creatureCategoryById(id) { return world().creatureCategories.find(item => item.id === id) || null; }
  function creatureInSelectedCategory(item) { const selected = world().selectedCreatureCategoryId || ALL_CREATURES_CATEGORY; return selected === ALL_CREATURES_CATEGORY || item.categoryId === selected; }
  function creaturesForSelectedCategory() { return world().creatures.filter(creatureInSelectedCategory); }

  function renderCreatureCategories() {
    if (!els.creatureCategories) return;
    const w = world();
    const categories = [{ id: ALL_CREATURES_CATEGORY, name: "Todos", fixed: true }, ...w.creatureCategories];
    els.creatureCategories.replaceChildren();
    categories.forEach(category => {
      const count = category.id === ALL_CREATURES_CATEGORY ? w.creatures.length : w.creatures.filter(item => item.categoryId === category.id).length;
      const button = document.createElement("button");
      button.type = "button";
      button.className = `world-category-chip${w.selectedCreatureCategoryId === category.id ? " is-active" : ""}`;
      button.innerHTML = `<span>${esc(category.name)}</span><small>${count}</small>`;
      button.addEventListener("click", () => {
        w.selectedCreatureCategoryId = category.id;
        const current = creatureById(w.selectedCreatureId);
        if (!current || !creatureInSelectedCategory(current)) {
          const first = creaturesForSelectedCategory().slice().sort((a,b)=>a.name.localeCompare(b.name,"es"))[0];
          w.selectedCreatureId = first?.id || "";
        }
        save();
        renderCreatureCategories(); renderCreatureList(); renderCreatureDetail();
      });
      els.creatureCategories.append(button);
    });
  }

  function createCreatureCategory() {
    const raw = prompt("Nombre de la nueva categoría de criaturas:");
    const name = String(raw || "").trim().slice(0, 80);
    if (!name) return;
    const w = world();
    const existing = w.creatureCategories.find(item => item.name.toLocaleLowerCase() === name.toLocaleLowerCase());
    if (existing) { w.selectedCreatureCategoryId = existing.id; save(); renderCreatureCategories(); renderCreatureList(); renderCreatureDetail(); return; }
    const category = { id: app.uid(), name, createdAt: app.now() };
    w.creatureCategories.push(category);
    w.selectedCreatureCategoryId = category.id;
    w.selectedCreatureId = w.creatures.find(item => item.categoryId === category.id)?.id || "";
    save(); renderCreatureCategories(); renderCreatureList(); renderCreatureDetail();
  }

  function fillCreatureCategoryOptions(selected = "") {
    if (!els.creatureCategory) return;
    const categories = world().creatureCategories.slice().sort((a,b)=>a.name.localeCompare(b.name,"es"));
    els.creatureCategory.innerHTML = '<option value="">Sin categoría</option>' + categories.map(item => `<option value="${esc(item.id)}">${esc(item.name)}</option>`).join("");
    els.creatureCategory.value = categories.some(item => item.id === selected) ? selected : "";
  }

  function renderCreatureList() {
    if (!els.creatureList) return;
    const w = world();
    const query = creatureSearch.trim().toLocaleLowerCase();
    const items = w.creatures.filter(item => creatureInSelectedCategory(item) && (!query || `${item.name} ${item.type} ${item.tags}`.toLocaleLowerCase().includes(query)));
    els.creatureList.replaceChildren();
    if (!items.length) {
      const p = document.createElement("p"); p.className = "panel__hint"; p.style.padding = "10px"; const category = creatureCategoryById(w.selectedCreatureCategoryId); p.textContent = query ? "No hay coincidencias." : (category ? `No hay criaturas en “${category.name}”.` : (w.creatures.length ? "No hay criaturas en esta vista." : "Aún no has creado criaturas.")); els.creatureList.append(p); return;
    }
    items.sort((a,b)=>a.name.localeCompare(b.name,"es")).forEach(item => {
      const button = document.createElement("button"); button.type = "button"; button.className = `world-library-card${w.selectedCreatureId === item.id ? " is-active" : ""}`;
      const thumb = document.createElement("span"); thumb.className = "world-library-card__thumb"; thumb.textContent = "🐉";
      const text = document.createElement("span"); text.className = "world-library-card__text"; text.innerHTML = `<strong>${esc(item.name)}</strong><small>${esc(item.type || item.tags || "Criatura")}</small>`;
      button.append(thumb,text); button.addEventListener("click",()=>{ w.selectedCreatureId=item.id; save(); renderCreatureList(); renderCreatureDetail(); }); els.creatureList.append(button); asyncThumb(thumb,item.imageId,"🐉");
    });
  }

  function statIsSet(value) { return value !== "" && value !== null && value !== undefined && Number.isFinite(Number(value)); }
  function modifier(score) { const n=Number(score); if (!Number.isFinite(n)) return ""; const m=Math.floor((n-10)/2); return `${m>=0?"+":""}${m}`; }
  function infoSection(title, value) { if (!String(value||"").trim()) return ""; return `<section class="world-info-section"><h3>${esc(title)}</h3><p>${esc(value)}</p></section>`; }
  function personSheetHtml(item, { character = false } = {}) {
    const mainStats = ["hp","maxhp","ac","speed","initiative","proficiency"].filter(key=>statIsSet(item.stats?.[key]));
    const abilities = ["str","dex","con","int","wis","cha"].filter(key=>statIsSet(item.stats?.[key]));
    const meta = [item.type, item.tags].filter(Boolean).join(" · ");
    const sections = [
      infoSection("Modificadores",item.modifiers), infoSection("Habilidades",item.abilities), infoSection("Estilo de combate",item.combatStyle), infoSection("Si los PJ no atacan",item.nonAggression), infoSection("Acciones",item.actions), infoSection("Reacciones",item.reactions), character ? infoSection("Notas DM",item.notes) : ""
    ].join("");
    const loot = !character && item.loot?.length ? `<section class="world-info-section"><h3>Botín / recompensas</h3><div class="world-loot-view">${item.loot.map(x=>`<div><span><strong>${esc(x.name)}</strong>${x.notes?`<small> · ${esc(x.notes)}</small>`:""}</span><span>×${Number(x.quantity)||1}</span></div>`).join("")}</div></section>` : "";
    return `<div class="world-sheet__stats">${mainStats.map(key=>`<div class="world-stat"><small>${esc(STAT_LABELS[key])}</small><strong>${esc(item.stats[key])}</strong></div>`).join("")}</div>${abilities.length?`<div class="world-sheet__abilities">${abilities.map(key=>`<div class="world-ability"><small>${esc(STAT_LABELS[key])}</small><strong>${esc(item.stats[key])}</strong><small>${esc(modifier(item.stats[key]))}</small></div>`).join("")}</div>`:""}<div class="world-sheet__sections">${sections}${loot}</div>`;
  }

  function renderCreatureDetail() {
    if (!els.creatureDetail) return;
    const w=world(); let item=creatureById(w.selectedCreatureId);
    if (item && !creatureInSelectedCategory(item)) item = null;
    if (!item) { const category=creatureCategoryById(w.selectedCreatureCategoryId); const title=category?`“${category.name}” está vacía`:"Bestiario vacío"; const text=category?"Crea una criatura o asigna una existente a esta categoría desde su edición.":"Crea una criatura y su ficha quedará disponible para reutilizarla desde cualquier marcador."; els.creatureDetail.innerHTML=emptyDetail("🐉",title,text,'<button class="button" type="button" data-world-empty-creature>+ Crear criatura</button>'); els.creatureDetail.querySelector('[data-world-empty-creature]')?.addEventListener('click',()=>openCreatureEditor()); return; }
    els.creatureDetail.innerHTML=`<div class="world-sheet world-sheet--creature"><div class="world-creature-profile"><section class="world-creature-info"><div class="world-sheet__heading"><div><p class="world-creature-kicker">Bestiario</p><h2>${esc(item.name)}</h2><p class="world-sheet__meta">${esc([item.type,item.tags].filter(Boolean).join(" · ")||"Criatura")}</p></div><button class="icon-button" type="button" data-world-edit-creature title="Editar criatura" aria-label="Editar criatura">✎</button></div>${item.description?`<p class="world-sheet__description">${esc(item.description)}</p>`:""}<div class="world-creature-data">${personSheetHtml(item)}</div></section><aside class="world-creature-portrait" data-world-detail-image aria-label="Imagen de ${esc(item.name)}"><span>🐉</span></aside></div></div>`;
    els.creatureDetail.querySelector('[data-world-edit-creature]')?.addEventListener('click',()=>openCreatureEditor(item.id));
    const host=els.creatureDetail.querySelector('[data-world-detail-image]'); if(item.imageId) imageUrl(item.imageId).then(url=>{if(!url||!host?.isConnected)return;host.replaceChildren();const img=document.createElement('img');img.src=url;img.alt=item.name;host.append(img);}).catch(()=>{});
  }

  function renderOrganisationList() {
    if (!els.organisationList) return; const w=world(); const query=organisationSearch.trim().toLocaleLowerCase(); const items=w.organisations.filter(item=>!query||`${item.name} ${item.headquarters} ${item.description}`.toLocaleLowerCase().includes(query));
    els.organisationList.replaceChildren(); if(!items.length){const p=document.createElement('p');p.className='panel__hint';p.style.padding='10px';p.textContent=w.organisations.length?'No hay coincidencias.':'Aún no has creado organizaciones.';els.organisationList.append(p);return;}
    items.sort((a,b)=>a.name.localeCompare(b.name,'es')).forEach(item=>{const button=document.createElement('button');button.type='button';button.className=`world-library-card${w.selectedOrganisationId===item.id?' is-active':''}`;const thumb=document.createElement('span');thumb.className='world-library-card__thumb';thumb.textContent='⚑';const text=document.createElement('span');text.className='world-library-card__text';text.innerHTML=`<strong>${esc(item.name)}</strong><small>${esc(item.headquarters||`${item.members.length} miembro${item.members.length===1?'':'s'}`)}</small>`;button.append(thumb,text);button.addEventListener('click',()=>{w.selectedOrganisationId=item.id;save();renderOrganisationList();renderOrganisationDetail();});els.organisationList.append(button);asyncThumb(thumb,item.imageId,'⚑');});
  }

  function memberDescendantIds(org, memberId) {
    const result=new Set(); const visit=id=>org.members.filter(m=>m.parentMemberId===id).forEach(m=>{if(result.has(m.id))return;result.add(m.id);visit(m.id);}); visit(memberId); return result;
  }

  function renderHierarchy(org) {
    if(!org.members.length) return `<div class="world-empty-detail" style="min-height:160px"><div><span>♙</span><p>Añade personajes y ordénalos por dependencia.</p></div></div>`;
    const byParent=new Map(); org.members.forEach(member=>{const key=member.parentMemberId||'';if(!byParent.has(key))byParent.set(key,[]);byParent.get(key).push(member);});
    const known=new Set(org.members.map(m=>m.id)); const roots=org.members.filter(m=>!m.parentMemberId||!known.has(m.parentMemberId));
    const renderNode=(member,seen=new Set())=>{if(seen.has(member.id))return'';const next=new Set(seen);next.add(member.id);const char=characterById(member.characterId);const children=(byParent.get(member.id)||[]).filter(x=>x.id!==member.id);return `<li><div class="world-member-node" data-world-member-node="${esc(member.id)}" data-world-member-parent="${esc(member.parentMemberId||'')}"><span class="world-member-node__avatar" data-world-member-avatar="${esc(char?.imageId||'')}">♙</span><button class="world-member-node__main" type="button" data-world-character-view="${esc(char?.id||'')}"><strong>${esc(char?.name||'Personaje eliminado')}</strong><small>${esc(member.role||char?.type||'Sin cargo')}</small></button><button class="world-member-node__edit" type="button" data-world-member-edit="${esc(member.id)}" title="Editar posición">✎</button></div>${children.length?`<ul>${children.map(child=>renderNode(child,next)).join('')}</ul>`:''}</li>`;};
    return `<div class="world-hierarchy-canvas"><svg class="world-hierarchy-lines" aria-hidden="true"></svg><ul class="world-hierarchy-tree">${roots.map(root=>renderNode(root)).join('')}</ul></div>`;
  }

  function drawHierarchyLines(root=els.organisationDetail) {
    const canvas=root?.querySelector?.('.world-hierarchy-canvas');
    const svg=canvas?.querySelector?.('.world-hierarchy-lines');
    const tree=canvas?.querySelector?.('.world-hierarchy-tree');
    if(!canvas||!svg||!tree)return;
    requestAnimationFrame(()=>{
      if(!canvas.isConnected)return;
      const width=Math.max(tree.scrollWidth,tree.offsetWidth,canvas.parentElement?.clientWidth||0);
      const height=Math.max(tree.scrollHeight,tree.offsetHeight);
      canvas.style.width=`${width}px`; canvas.style.height=`${height}px`;
      svg.setAttribute('viewBox',`0 0 ${Math.max(1,width)} ${Math.max(1,height)}`); svg.setAttribute('width',String(width)); svg.setAttribute('height',String(height)); svg.replaceChildren();
      const base=canvas.getBoundingClientRect();
      canvas.querySelectorAll('[data-world-member-node]').forEach(child=>{
        const parentId=child.dataset.worldMemberParent; if(!parentId)return;
        const parent=[...canvas.querySelectorAll('[data-world-member-node]')].find(node=>node.dataset.worldMemberNode===parentId); if(!parent)return;
        const pr=parent.getBoundingClientRect(), cr=child.getBoundingClientRect();
        const x1=pr.left-base.left+pr.width/2, y1=pr.bottom-base.top;
        const x2=cr.left-base.left+cr.width/2, y2=cr.top-base.top;
        const mid=y1+Math.max(14,(y2-y1)/2);
        const path=document.createElementNS('http://www.w3.org/2000/svg','path');
        path.setAttribute('d',`M ${x1} ${y1} V ${mid} H ${x2} V ${y2}`); path.setAttribute('class','world-hierarchy-line'); svg.append(path);
      });
    });
  }

  function renderOrganisationDetail() {
    if(!els.organisationDetail)return; const w=world();const org=organisationById(w.selectedOrganisationId);if(!org){els.organisationDetail.innerHTML=emptyDetail('⚑','Sin organizaciones','Crea una organización para definir su ficha, jerarquía y personajes.','<button class="button" type="button" data-world-empty-org>+ Crear organización</button>');els.organisationDetail.querySelector('[data-world-empty-org]')?.addEventListener('click',()=>openOrganisationEditor());return;}
    const info=[infoSection('Objetivos',org.goals),infoSection('Relación / actitud',org.attitude),infoSection('Notas DM',org.notes)].join('');
    els.organisationDetail.innerHTML=`<div class="world-sheet world-sheet--organisation"><div class="world-organisation-layout"><aside class="world-organisation-profile"><div class="world-organisation-logo" data-world-org-image><span>⚑</span></div><div class="world-organisation-copy"><div class="world-sheet__heading"><div><p class="world-creature-kicker">Organización</p><h2>${esc(org.name)}</h2>${org.headquarters?`<p class="world-sheet__meta">⌂ ${esc(org.headquarters)}</p>`:''}</div><button class="icon-button" type="button" data-world-edit-org title="Editar organización">✎</button></div>${org.description?`<p class="world-organisation-description">${esc(org.description)}</p>`:''}${info?`<div class="world-organisation-info">${info}</div>`:''}</div></aside><section class="world-hierarchy-wrap"><div class="world-hierarchy-heading"><div><h3>Jerarquía</h3><p class="panel__hint">Mando arriba; rangos inferiores debajo.</p></div><button class="button button--quiet" type="button" data-world-add-member>+ Personaje</button></div><div class="world-hierarchy world-hierarchy--pyramid">${renderHierarchy(org)}</div></section></div></div>`;
    els.organisationDetail.querySelector('[data-world-edit-org]')?.addEventListener('click',()=>openOrganisationEditor(org.id)); els.organisationDetail.querySelector('[data-world-add-member]')?.addEventListener('click',()=>openMemberEditor(org.id));
    els.organisationDetail.querySelectorAll('[data-world-character-view]').forEach(btn=>btn.addEventListener('click',()=>openCharacterView(btn.dataset.worldCharacterView)));
    els.organisationDetail.querySelectorAll('[data-world-member-edit]').forEach(btn=>btn.addEventListener('click',()=>openMemberEditor(org.id,btn.dataset.worldMemberEdit)));
    const logo=els.organisationDetail.querySelector('[data-world-org-image]'); if(org.imageId)imageUrl(org.imageId).then(url=>{if(!url||!logo?.isConnected)return;logo.replaceChildren();const img=document.createElement('img');img.src=url;img.alt=org.name;logo.append(img);}).catch(()=>{});
    els.organisationDetail.querySelectorAll('[data-world-member-avatar]').forEach(host=>{const id=host.dataset.worldMemberAvatar;if(id)imageUrl(id).then(url=>{if(!url||!host.isConnected)return;host.replaceChildren();const img=document.createElement('img');img.src=url;img.alt='';host.append(img);drawHierarchyLines();}).catch(()=>{});});
    drawHierarchyLines();
  }

  function render() {
    section(world().selectedSection || 'creatures'); renderCreatureCategories(); renderCreatureList(); renderOrganisationList(); if(world().selectedSection==='organisations')renderOrganisationDetail(); else renderCreatureDetail();
  }

  function loadStatsInto(selectorPrefix, stats) { $$(`[data-${selectorPrefix}-stat]`).forEach(input=>{const key=input.getAttribute(`data-${selectorPrefix}-stat`);input.value=stats?.[key]??'';}); }
  function readStatsFrom(selectorPrefix) { const stats={}; $$(`[data-${selectorPrefix}-stat]`).forEach(input=>{const key=input.getAttribute(`data-${selectorPrefix}-stat`);stats[key]=optionalNumber(input.value);}); return stats; }

  async function renderCreatureDraftPhoto() { await setImageElement(els.creaturePhotoPreview,els.creaturePhotoEmpty,creatureDraft?.imageId,creatureDraft?.name||'Criatura'); if(els.creaturePhotoRemove)els.creaturePhotoRemove.hidden=!creatureDraft?.imageId; }
  function renderCreatureLootEditor(){if(!els.creatureLootList||!creatureDraft)return;els.creatureLootList.replaceChildren();creatureDraft.loot ||= [];creatureDraft.loot.forEach(item=>{const row=document.createElement('div');row.className='world-loot-edit-row';row.innerHTML=`<input value="${esc(item.name)}" maxlength="160" aria-label="Objeto"><input type="number" min="1" value="${Number(item.quantity)||1}" aria-label="Cantidad"><input value="${esc(item.notes||'')}" maxlength="500" aria-label="Notas"><button type="button" class="mini-button" aria-label="Eliminar">×</button>`;const inputs=$$('input',row);inputs[0].addEventListener('input',()=>item.name=inputs[0].value);inputs[1].addEventListener('input',()=>item.quantity=Math.max(1,Number(inputs[1].value)||1));inputs[2].addEventListener('input',()=>item.notes=inputs[2].value);$('button',row).addEventListener('click',()=>{creatureDraft.loot=creatureDraft.loot.filter(x=>x.id!==item.id);renderCreatureLootEditor();});els.creatureLootList.append(row);});}
  function openCreatureEditor(id=''){editingCreatureId=id;creatureDraft=id?app.clone(creatureById(id)):blankCreature();if(!creatureDraft)return;if(!id&&world().selectedCreatureCategoryId!==ALL_CREATURES_CATEGORY&&creatureCategoryById(world().selectedCreatureCategoryId))creatureDraft.categoryId=world().selectedCreatureCategoryId;els.creatureDialogTitle.textContent=id?'Editar criatura':'Nueva criatura';els.creatureName.value=creatureDraft.name;els.creatureType.value=creatureDraft.type||'';fillCreatureCategoryOptions(creatureDraft.categoryId||'');els.creatureTags.value=creatureDraft.tags||'';els.creatureDescription.value=creatureDraft.description||'';els.creatureModifiers.value=creatureDraft.modifiers||'';els.creatureAbilities.value=creatureDraft.abilities||'';els.creatureCombatStyle.value=creatureDraft.combatStyle||'';els.creatureNonAggression.value=creatureDraft.nonAggression||'';els.creatureActions.value=creatureDraft.actions||'';els.creatureReactions.value=creatureDraft.reactions||'';loadStatsInto('world-creature',creatureDraft.stats);els.creatureDelete.hidden=!id;renderCreatureLootEditor();renderCreatureDraftPhoto();els.creatureDialog.showModal();setTimeout(()=>els.creatureName.focus(),0);}
  function saveCreatureFromForm(){if(!creatureDraft)return;creatureDraft.name=els.creatureName.value.trim().slice(0,120)||'Criatura sin nombre';creatureDraft.type=els.creatureType.value.trim().slice(0,100);creatureDraft.categoryId=creatureCategoryById(els.creatureCategory?.value)?.id||'';creatureDraft.tags=els.creatureTags.value.trim().slice(0,300);creatureDraft.description=els.creatureDescription.value.slice(0,8000);creatureDraft.modifiers=els.creatureModifiers.value.slice(0,5000);creatureDraft.abilities=els.creatureAbilities.value.slice(0,5000);creatureDraft.combatStyle=els.creatureCombatStyle.value.slice(0,5000);creatureDraft.nonAggression=els.creatureNonAggression.value.slice(0,5000);creatureDraft.actions=els.creatureActions.value.slice(0,7000);creatureDraft.reactions=els.creatureReactions.value.slice(0,5000);creatureDraft.stats=readStatsFrom('world-creature');creatureDraft.loot=(creatureDraft.loot||[]).filter(x=>String(x.name||'').trim());creatureDraft.updatedAt=app.now();const w=world();const index=w.creatures.findIndex(x=>x.id===editingCreatureId);if(index>=0)w.creatures[index]=creatureDraft;else w.creatures.push(creatureDraft);w.selectedCreatureId=creatureDraft.id;if(w.selectedCreatureCategoryId!==ALL_CREATURES_CATEGORY&&!creatureInSelectedCategory(creatureDraft)){const first=creaturesForSelectedCategory().filter(x=>x.id!==creatureDraft.id).slice().sort((a,b)=>a.name.localeCompare(b.name,'es'))[0];w.selectedCreatureId=first?.id||'';}editingCreatureId='';creatureDraft=null;els.creatureDialog.close();save();render();}

  async function renderOrganisationDraftPhoto(){await setImageElement(els.organisationPhotoPreview,els.organisationPhotoEmpty,organisationDraft?.imageId,organisationDraft?.name||'Organización');if(els.organisationPhotoRemove)els.organisationPhotoRemove.hidden=!organisationDraft?.imageId;}
  function openOrganisationEditor(id=''){editingOrganisationId=id;organisationDraft=id?app.clone(organisationById(id)):blankOrganisation();if(!organisationDraft)return;els.organisationDialogTitle.textContent=id?'Editar organización':'Nueva organización';els.organisationName.value=organisationDraft.name;els.organisationHeadquarters.value=organisationDraft.headquarters||'';els.organisationDescription.value=organisationDraft.description||'';els.organisationGoals.value=organisationDraft.goals||'';els.organisationAttitude.value=organisationDraft.attitude||'';els.organisationNotes.value=organisationDraft.notes||'';els.organisationDelete.hidden=!id;renderOrganisationDraftPhoto();els.organisationDialog.showModal();setTimeout(()=>els.organisationName.focus(),0);}
  function saveOrganisationFromForm(){if(!organisationDraft)return;organisationDraft.name=els.organisationName.value.trim().slice(0,140)||'Organización sin nombre';organisationDraft.headquarters=els.organisationHeadquarters.value.trim().slice(0,500);organisationDraft.description=els.organisationDescription.value.slice(0,8000);organisationDraft.goals=els.organisationGoals.value.slice(0,5000);organisationDraft.attitude=els.organisationAttitude.value.slice(0,1000);organisationDraft.notes=els.organisationNotes.value.slice(0,8000);organisationDraft.updatedAt=app.now();const w=world();const index=w.organisations.findIndex(x=>x.id===editingOrganisationId);if(index>=0)w.organisations[index]=organisationDraft;else w.organisations.push(organisationDraft);w.selectedOrganisationId=organisationDraft.id;editingOrganisationId='';organisationDraft=null;els.organisationDialog.close();save();render();}

  function fillMemberCharacterOptions(selected='__new'){const chars=world().characters.slice().sort((a,b)=>a.name.localeCompare(b.name,'es'));els.memberCharacter.innerHTML='<option value="__new">+ Crear personaje nuevo</option>'+chars.map(ch=>`<option value="${esc(ch.id)}">${esc(ch.name)}</option>`).join('');els.memberCharacter.value=chars.some(ch=>ch.id===selected)?selected:'__new';els.memberNewNameWrap.hidden=els.memberCharacter.value!=='__new';}
  function fillMemberParentOptions(org, currentMemberId='', selected=''){const descendants=currentMemberId?memberDescendantIds(org,currentMemberId):new Set();els.memberParent.innerHTML='<option value="">— Nivel superior —</option>'+org.members.filter(m=>m.id!==currentMemberId&&!descendants.has(m.id)).map(m=>{const ch=characterById(m.characterId);return `<option value="${esc(m.id)}">${esc(ch?.name||'Personaje')} ${m.role?`· ${esc(m.role)}`:''}</option>`;}).join('');els.memberParent.value=[...els.memberParent.options].some(o=>o.value===selected)?selected:'';}
  function openMemberEditor(orgId,memberId=''){const org=organisationById(orgId);if(!org)return;editingMemberOrganisationId=orgId;editingMemberId=memberId;const member=org.members.find(m=>m.id===memberId)||null;fillMemberCharacterOptions(member?.characterId||'__new');els.memberNewName.value='';els.memberRole.value=member?.role||'';fillMemberParentOptions(org,memberId,member?.parentMemberId||'');els.memberRemove.hidden=!member;els.memberDialog.showModal();}
  function saveMemberFromForm(){const org=organisationById(editingMemberOrganisationId);if(!org)return;let charId=els.memberCharacter.value;if(charId==='__new'){const name=els.memberNewName.value.trim();if(!name){els.memberNewName.focus();return;}const ch=blankCreature(name.slice(0,120),'character');world().characters.push(ch);charId=ch.id;}if(!characterById(charId))return;const patch={characterId:charId,role:els.memberRole.value.trim().slice(0,140),parentMemberId:els.memberParent.value||''};const existing=org.members.find(m=>m.id===editingMemberId);if(existing)Object.assign(existing,patch);else org.members.push({id:app.uid(),...patch});org.updatedAt=app.now();els.memberDialog.close();const createdNew=els.memberCharacter.value==='__new';editingMemberId='';editingMemberOrganisationId='';save();renderOrganisationDetail();renderOrganisationList();if(createdNew)openCharacterEditor(charId);}

  async function renderCharacterDraftPhoto(){await setImageElement(els.characterPhotoPreview,els.characterPhotoEmpty,characterDraft?.imageId,characterDraft?.name||'Personaje');if(els.characterPhotoRemove)els.characterPhotoRemove.hidden=!characterDraft?.imageId;}
  function openCharacterEditor(id=''){const item=id?characterById(id):null;if(id&&!item)return;editingCharacterId=id;characterDraft=item?app.clone(item):blankCreature('Nuevo personaje','character');els.characterDialogTitle.textContent=id?'Editar personaje':'Nuevo personaje';els.characterName.value=characterDraft.name;els.characterType.value=characterDraft.type||'';els.characterDisposition.value=characterDraft.disposition||'neutral';els.characterDescription.value=characterDraft.description||'';els.characterModifiers.value=characterDraft.modifiers||'';els.characterAbilities.value=characterDraft.abilities||'';els.characterCombatStyle.value=characterDraft.combatStyle||'';els.characterNonAggression.value=characterDraft.nonAggression||'';els.characterActions.value=characterDraft.actions||'';els.characterReactions.value=characterDraft.reactions||'';els.characterNotes.value=characterDraft.notes||'';loadStatsInto('world-character',characterDraft.stats);els.characterDelete.hidden=!id;renderCharacterDraftPhoto();els.characterDialog.showModal();setTimeout(()=>els.characterName.focus(),0);}
  function saveCharacterFromForm(){if(!characterDraft)return;characterDraft.name=els.characterName.value.trim().slice(0,120)||'Personaje sin nombre';characterDraft.type=els.characterType.value.trim().slice(0,100);characterDraft.disposition=['enemy','ally','neutral'].includes(els.characterDisposition.value)?els.characterDisposition.value:'neutral';characterDraft.description=els.characterDescription.value.slice(0,8000);characterDraft.modifiers=els.characterModifiers.value.slice(0,5000);characterDraft.abilities=els.characterAbilities.value.slice(0,5000);characterDraft.combatStyle=els.characterCombatStyle.value.slice(0,5000);characterDraft.nonAggression=els.characterNonAggression.value.slice(0,5000);characterDraft.actions=els.characterActions.value.slice(0,7000);characterDraft.reactions=els.characterReactions.value.slice(0,5000);characterDraft.notes=els.characterNotes.value.slice(0,8000);characterDraft.stats=readStatsFrom('world-character');characterDraft.updatedAt=app.now();const w=world();const index=w.characters.findIndex(x=>x.id===editingCharacterId);if(index>=0)w.characters[index]=characterDraft;else w.characters.push(characterDraft);const id=characterDraft.id;editingCharacterId='';characterDraft=null;els.characterDialog.close();save();render();if(viewingCharacterId===id)openCharacterView(id);}

  function characterOrganisations(id){return world().organisations.flatMap(org=>org.members.filter(m=>m.characterId===id).map(m=>({org,member:m})));}
  function openCharacterView(id){const ch=characterById(id);if(!ch)return;viewingCharacterId=id;els.characterViewTitle.textContent=ch.name;const memberships=characterOrganisations(id);els.characterViewSubtitle.textContent=[ch.type,memberships.map(x=>`${x.org.name}${x.member.role?` · ${x.member.role}`:''}`).join(' / ')].filter(Boolean).join(' · ');els.characterViewBody.innerHTML=`<div class="world-sheet"><div class="world-sheet__hero"><div class="world-sheet__image" data-world-char-view-image><span>♙</span></div><div>${ch.description?`<p class="world-sheet__description">${esc(ch.description)}</p>`:'<p class="panel__hint">Sin descripción.</p>'}</div></div>${personSheetHtml(ch,{character:true})}</div>`;const host=els.characterViewBody.querySelector('[data-world-char-view-image]');if(ch.imageId)imageUrl(ch.imageId).then(url=>{if(!url||!host?.isConnected)return;host.replaceChildren();const img=document.createElement('img');img.src=url;img.alt=ch.name;host.append(img);}).catch(()=>{});if(!els.characterViewDialog.open)els.characterViewDialog.showModal();}

  function clearAtlasRefs(type,id){for(const scene of state().atlas?.scenes||[]){if(scene.worldRefType===type&&scene.worldRefId===id){scene.worldRefType='';scene.worldRefId='';}for(const marker of scene.markers||[]){if(marker.worldRefType===type&&marker.worldRefId===id){marker.worldRefType='';marker.worldRefId='';}}}}

  function deleteCreature(){const item=creatureById(editingCreatureId);if(!item||!confirm(`¿Eliminar “${item.name}” del Bestiario? Los marcadores conservarán su posición, pero perderán esta referencia.`))return;const w=world();w.creatures=w.creatures.filter(x=>x.id!==item.id);clearAtlasRefs('creature',item.id);w.selectedCreatureId=creaturesForSelectedCategory().slice().sort((a,b)=>a.name.localeCompare(b.name,'es'))[0]?.id||'';els.creatureDialog.close();editingCreatureId='';creatureDraft=null;save();render();}
  function deleteOrganisation(){const item=organisationById(editingOrganisationId);if(!item||!confirm(`¿Eliminar la organización “${item.name}”? Los personajes no se borrarán.`))return;world().organisations=world().organisations.filter(x=>x.id!==item.id);clearAtlasRefs('organisation',item.id);world().selectedOrganisationId=world().organisations[0]?.id||'';els.organisationDialog.close();editingOrganisationId='';organisationDraft=null;save();render();}
  function deleteCharacter(){const item=characterById(editingCharacterId);if(!item||!confirm(`¿Eliminar el personaje “${item.name}”? Se quitará también de todas las jerarquías.`))return;world().characters=world().characters.filter(x=>x.id!==item.id);world().organisations.forEach(org=>{const removed=new Set(org.members.filter(m=>m.characterId===item.id).map(m=>m.id));org.members=org.members.filter(m=>m.characterId!==item.id);org.members.forEach(m=>{if(removed.has(m.parentMemberId))m.parentMemberId='';});});clearAtlasRefs('character',item.id);els.characterDialog.close();if(els.characterViewDialog.open)els.characterViewDialog.close();editingCharacterId='';characterDraft=null;viewingCharacterId='';save();render();}

  function openReference(type,id){if(!worldReferenceLabel(type,id))return false;if(type==='creature'){world().selectedSection='creatures';world().selectedCreatureId=id;app.setView('world');render();return true;}if(type==='organisation'){world().selectedSection='organisations';world().selectedOrganisationId=id;app.setView('world');render();return true;}if(type==='character'){world().selectedSection='organisations';app.setView('world');render();setTimeout(()=>openCharacterView(id),0);return true;}return false;}

  function bind() {
    els.tabs.forEach(tab=>tab.addEventListener('click',()=>{section(tab.dataset.worldSection);save();render();}));
    els.newCreature?.addEventListener('click',()=>openCreatureEditor()); els.newCreatureCategory?.addEventListener('click',createCreatureCategory); els.newOrganisation?.addEventListener('click',()=>openOrganisationEditor());
    els.creatureSearch?.addEventListener('input',()=>{creatureSearch=els.creatureSearch.value;renderCreatureList();}); els.organisationSearch?.addEventListener('input',()=>{organisationSearch=els.organisationSearch.value;renderOrganisationList();});
    els.creatureForm?.addEventListener('submit',e=>{e.preventDefault();saveCreatureFromForm();}); $$('.world-creature-close,.world-creature-cancel').forEach(b=>b.addEventListener('click',()=>els.creatureDialog.close())); els.creatureDelete?.addEventListener('click',deleteCreature);
    els.creaturePhotoChoose?.addEventListener('click',()=>els.creaturePhotoInput.click()); els.creaturePhotoInput?.addEventListener('change',async()=>{const file=els.creaturePhotoInput.files?.[0];if(!file||!creatureDraft)return;creatureDraft.imageId=await putImage(file);els.creaturePhotoInput.value='';renderCreatureDraftPhoto();}); els.creaturePhotoRemove?.addEventListener('click',()=>{if(!creatureDraft)return;creatureDraft.imageId='';renderCreatureDraftPhoto();});
    els.creatureLootAdd?.addEventListener('click',()=>{if(!creatureDraft)return;const name=els.creatureLootName.value.trim();if(!name)return;creatureDraft.loot.push({id:app.uid(),name:name.slice(0,160),quantity:Math.max(1,Number(els.creatureLootQty.value)||1),notes:els.creatureLootNotes.value.trim().slice(0,500)});els.creatureLootName.value='';els.creatureLootQty.value='1';els.creatureLootNotes.value='';renderCreatureLootEditor();});
    els.organisationForm?.addEventListener('submit',e=>{e.preventDefault();saveOrganisationFromForm();}); $$('.world-organisation-close,.world-organisation-cancel').forEach(b=>b.addEventListener('click',()=>els.organisationDialog.close())); els.organisationDelete?.addEventListener('click',deleteOrganisation);
    els.organisationPhotoChoose?.addEventListener('click',()=>els.organisationPhotoInput.click()); els.organisationPhotoInput?.addEventListener('change',async()=>{const file=els.organisationPhotoInput.files?.[0];if(!file||!organisationDraft)return;organisationDraft.imageId=await putImage(file);els.organisationPhotoInput.value='';renderOrganisationDraftPhoto();}); els.organisationPhotoRemove?.addEventListener('click',()=>{if(!organisationDraft)return;organisationDraft.imageId='';renderOrganisationDraftPhoto();});
    els.memberCharacter?.addEventListener('change',()=>els.memberNewNameWrap.hidden=els.memberCharacter.value!=='__new'); els.memberForm?.addEventListener('submit',e=>{e.preventDefault();saveMemberFromForm();}); $$('.world-member-close,.world-member-cancel').forEach(b=>b.addEventListener('click',()=>els.memberDialog.close())); els.memberRemove?.addEventListener('click',()=>{const org=organisationById(editingMemberOrganisationId);if(!org||!editingMemberId)return;const children=org.members.filter(m=>m.parentMemberId===editingMemberId);const member=org.members.find(m=>m.id===editingMemberId);org.members=org.members.filter(m=>m.id!==editingMemberId);children.forEach(child=>child.parentMemberId=member?.parentMemberId||'');els.memberDialog.close();editingMemberId='';editingMemberOrganisationId='';save();renderOrganisationDetail();renderOrganisationList();});
    els.characterForm?.addEventListener('submit',e=>{e.preventDefault();saveCharacterFromForm();}); $$('.world-character-close,.world-character-cancel').forEach(b=>b.addEventListener('click',()=>els.characterDialog.close())); els.characterDelete?.addEventListener('click',deleteCharacter);
    els.characterPhotoChoose?.addEventListener('click',()=>els.characterPhotoInput.click()); els.characterPhotoInput?.addEventListener('change',async()=>{const file=els.characterPhotoInput.files?.[0];if(!file||!characterDraft)return;characterDraft.imageId=await putImage(file);els.characterPhotoInput.value='';renderCharacterDraftPhoto();}); els.characterPhotoRemove?.addEventListener('click',()=>{if(!characterDraft)return;characterDraft.imageId='';renderCharacterDraftPhoto();});
    $$('.world-character-view-close').forEach(b=>b.addEventListener('click',()=>{els.characterViewDialog.close();viewingCharacterId='';})); els.characterViewEdit?.addEventListener('click',()=>{const id=viewingCharacterId;els.characterViewDialog.close();if(id)openCharacterEditor(id);});
    document.addEventListener('forja:campaignchange',()=>{creatureSearch='';organisationSearch='';render();});
    window.addEventListener('resize',()=>{if(state().view==='world'&&world().selectedSection==='organisations')drawHierarchyLines();});
  }

  window.ForjaWorld = { render, openReference, referenceItems, referenceTree, referenceLabel: worldReferenceLabel, getCreature: creatureById, getCharacter: characterById, getOrganisation: organisationById, openCharacter: openCharacterView };
  bind();
  render();
})();
