(() => {
  "use strict";

  const app = window.ForjaApp;
  if (!app) return;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, Number(value) || 0));
  const MEDIA_DB = "forja-narrador-media-v1";
  const MEDIA_STORE = "images";
  const PROJECTION_KEY_PREFIX = "forja-projection-v1:";
  const TRUST_KEY_PREFIX = "forja-trusted-dm-v1:";
  const LAN_PLAYER_MODE = new URLSearchParams(location.search).get("lan") === "1";
  const LAN_POLL_MS = 700;
  let channel = null;
  try { if ("BroadcastChannel" in window) channel = new BroadcastChannel("forja-narrador-projection"); } catch { channel = null; }

  const BASE_CATEGORIES = [
    ["world", "◉", "Mundo"], ["city", "♜", "Ciudad / Pueblo"], ["shop", "⚖", "Tienda"],
    ["tavern", "♨", "Taberna"], ["castle", "♖", "Castillo"], ["tower", "♝", "Torre"],
    ["ruins", "⚿", "Ruinas"], ["dungeon", "⌘", "Mazmorra"], ["road", "⤳", "Camino"],
    ["port", "⚓", "Puerto"], ["temple", "☩", "Templo"], ["camp", "⌂", "Campamento"],
    ["treasure", "▣", "Tesoro"], ["danger", "⚠", "Peligro"], ["combat", "⚔", "Combate"],
    ["npc", "●", "Personaje / NPC"], ["merchant", "⚖", "Comerciante"], ["secret", "✦", "Secreto"],
    ["mission", "⚑", "Misión"], ["chest", "▤", "Cofre"], ["portal", "◈", "Portal"], ["poi", "✦", "Punto de interés"], ["place", "⌖", "Lugar"]
  ];

  const els = {
    roleGate: $("#roleGate"), dmApp: $("#dmApp"), playerApp: $("#playerApp"), roleCampaignSelect: $("#roleCampaignSelect"),
    chooseDmRole: $("#chooseDmRole"), choosePlayerRole: $("#choosePlayerRole"), dmAuthForm: $("#dmAuthForm"),
    backToRoles: $("#backToRoles"), dmAuthTitle: $("#dmAuthTitle"), dmAuthHint: $("#dmAuthHint"), dmPassword: $("#dmPassword"),
    dmPasswordConfirm: $("#dmPasswordConfirm"), dmPasswordConfirmLabel: $("#dmPasswordConfirmLabel"), rememberDmDevice: $("#rememberDmDevice"), dmAuthError: $("#dmAuthError"),
    settingsBtn: $("#settingsBtn"), settingsDrawer: $("#settingsDrawer"), drawerBackdrop: $("#drawerBackdrop"), closeSettingsDrawer: $("#closeSettingsDrawer"),
    drawerCampaignName: $("#drawerCampaignName"), drawerExportJson: $("#drawerExportJson"), drawerExportZip: $("#drawerExportZip"), drawerImport: $("#drawerImport"), drawerImportFile: $("#drawerImportFile"), drawerBackupStatus: $("#drawerBackupStatus"),
    folderSyncSection: $("#folderSyncSection"), folderSyncDot: $("#folderSyncDot"), folderSyncStatus: $("#folderSyncStatus"), folderSyncHint: $("#folderSyncHint"), folderSyncPath: $("#folderSyncPath"), folderSyncChoose: $("#folderSyncChoose"), folderSyncNow: $("#folderSyncNow"), folderSyncRestore: $("#folderSyncRestore"), folderSyncDisconnect: $("#folderSyncDisconnect"),
    lanHostSection: $("#lanHostSection"), lanHostDot: $("#lanHostDot"), lanHostStatus: $("#lanHostStatus"), lanHostHint: $("#lanHostHint"), lanHostUrlWrap: $("#lanHostUrlWrap"), lanHostUrl: $("#lanHostUrl"), lanHostStart: $("#lanHostStart"), lanHostStop: $("#lanHostStop"), lanHostCopy: $("#lanHostCopy"),
    changePasswordForm: $("#changePasswordForm"), currentDmPassword: $("#currentDmPassword"), newDmPassword: $("#newDmPassword"), newDmPasswordConfirm: $("#newDmPasswordConfirm"), passwordChangeError: $("#passwordChangeError"), logoutDm: $("#logoutDm"),
    atlasView: $("#atlasView"), atlasBackBtn: $("#atlasBackBtn"), atlasBreadcrumbs: $("#atlasBreadcrumbs"), atlasSceneTitle: $("#atlasSceneTitle"),
    atlasUploadImage: $("#atlasUploadImage"), atlasEditDungeon: $("#atlasEditDungeon"), atlasEmptyUpload: $("#atlasEmptyUpload"), atlasEmptyCreateMap: $("#atlasEmptyCreateMap"), atlasImageInput: $("#atlasImageInput"), atlasNewScene: $("#atlasNewScene"),
    atlasShowScene: $("#atlasShowScene"), atlasOpenProjection: $("#atlasOpenProjection"), atlasDmSheetBtn: $("#atlasDmSheetBtn"), atlasTools: $("#atlasTools"), atlasZoomOut: $("#atlasZoomOut"), atlasZoomReset: $("#atlasZoomReset"), atlasZoomIn: $("#atlasZoomIn"), atlasBrushSize: $("#atlasBrushSize"), atlasBrushValue: $("#atlasBrushValue"),
    atlasResetFog: $("#atlasResetFog"), atlasRevealAllFog: $("#atlasRevealAllFog"), atlasPlayerMode: $("#atlasPlayerMode"), atlasCloseMerchant: $("#atlasCloseMerchant"), atlasSceneTree: $("#atlasSceneTree"), atlasSceneMenu: $("#atlasSceneMenu"), atlasCustomCategory: $("#atlasCustomCategory"),
    atlasMapViewport: $("#atlasMapViewport"), atlasEmptyMap: $("#atlasEmptyMap"), atlasMapStage: $("#atlasMapStage"), atlasBackground: $("#atlasBackground"),
    atlasObjectLayer: $("#atlasObjectLayer"), atlasMarkerLayer: $("#atlasMarkerLayer"), atlasFogCanvas: $("#atlasFogCanvas"), atlasDmZoneLayer: $("#atlasDmZoneLayer"), atlasDraft: $("#atlasDraft"),
    atlasLayers: $("#atlasLayers"), atlasLayerCount: $("#atlasLayerCount"),
    atlasSceneDialog: $("#atlasSceneDialog"), atlasSceneForm: $("#atlasSceneForm"), atlasSceneDialogTitle: $("#atlasSceneDialogTitle"), atlasSceneName: $("#atlasSceneName"), atlasSceneParent: $("#atlasSceneParent"), atlasSceneDiscovered: $("#atlasSceneDiscovered"), atlasSceneUnlockEvent: $("#atlasSceneUnlockEvent"), atlasSceneCreateNotebookWrap: $("#atlasSceneCreateNotebookWrap"), atlasSceneCreateNotebook: $("#atlasSceneCreateNotebook"), atlasDeleteScene: $("#atlasDeleteScene"), atlasSceneSourceFieldset: $("#atlasSceneSourceFieldset"), atlasSceneEditDungeon: $("#atlasSceneEditDungeon"),
    atlasMarkerDialog: $("#atlasMarkerDialog"), atlasMarkerForm: $("#atlasMarkerForm"), atlasMarkerDialogTitle: $("#atlasMarkerDialogTitle"), atlasMarkerName: $("#atlasMarkerName"), atlasMarkerCategory: $("#atlasMarkerCategory"), atlasMarkerAlias: $("#atlasMarkerAlias"), atlasMarkerDisposition: $("#atlasMarkerDisposition"), atlasNpcFields: $("#atlasNpcFields"), atlasMarkerVisibility: $("#atlasMarkerVisibility"), atlasMarkerUnlockEvent: $("#atlasMarkerUnlockEvent"), atlasMarkerSize: $("#atlasMarkerSize"), atlasMarkerSizeValue: $("#atlasMarkerSizeValue"), atlasMarkerSizeUnit: $("#atlasMarkerSizeUnit"), atlasMarkerTargetScene: $("#atlasMarkerTargetScene"), atlasMarkerTargetTree: $("#atlasMarkerTargetTree"), atlasRelatedEntries: $("#atlasRelatedEntries"), atlasRelatedFieldset: $("#atlasRelatedFieldset"), atlasMarkerCreateNotebookWrap: $("#atlasMarkerCreateNotebookWrap"), atlasMarkerCreateNotebook: $("#atlasMarkerCreateNotebook"), atlasMarkerSheetModeWrap: $("#atlasMarkerSheetModeWrap"), atlasOrphanSheets: $("#atlasOrphanSheets"), atlasOrphanSheetList: $("#atlasOrphanSheetList"), atlasMarkerAutoDmSheet: $("#atlasMarkerAutoDmSheet"), atlasMarkerOpenSheet: $("#atlasMarkerOpenSheet"), atlasDeleteMarker: $("#atlasDeleteMarker"),
    atlasInternalSheetDialog: $("#atlasInternalSheetDialog"), atlasInternalSheetForm: $("#atlasInternalSheetForm"), atlasInternalSheetEditToggle: $("#atlasInternalSheetEditToggle"), atlasInternalSheetTitle: $("#atlasInternalSheetTitle"), atlasInternalSheetKind: $("#atlasInternalSheetKind"), atlasSheetName: $("#atlasSheetName"), atlasSheetStatusWrap: $("#atlasSheetStatusWrap"), atlasSheetStatus: $("#atlasSheetStatus"), atlasSheetCreaturePhotoWrap: $("#atlasSheetCreaturePhotoWrap"), atlasSheetPhotoPreview: $("#atlasSheetPhotoPreview"), atlasSheetPhotoEmpty: $("#atlasSheetPhotoEmpty"), atlasSheetPhotoChoose: $("#atlasSheetPhotoChoose"), atlasSheetPhotoRemove: $("#atlasSheetPhotoRemove"), atlasSheetPhotoInput: $("#atlasSheetPhotoInput"), atlasSheetDescription: $("#atlasSheetDescription"), atlasCreatureSheetSection: $("#atlasCreatureSheetSection"), atlasCreatureModifiers: $("#atlasCreatureModifiers"), atlasCreatureAbilities: $("#atlasCreatureAbilities"), atlasCreatureCombatStyle: $("#atlasCreatureCombatStyle"), atlasCreatureNonAggression: $("#atlasCreatureNonAggression"), atlasCreatureActions: $("#atlasCreatureActions"), atlasCreatureReactions: $("#atlasCreatureReactions"), atlasMerchantSheetSection: $("#atlasMerchantSheetSection"), atlasMerchantItemsList: $("#atlasMerchantItemsList"), atlasMerchantItemName: $("#atlasMerchantItemName"), atlasMerchantItemPrice: $("#atlasMerchantItemPrice"), atlasMerchantItemCurrency: $("#atlasMerchantItemCurrency"), atlasMerchantItemDescription: $("#atlasMerchantItemDescription"), atlasMerchantItemAdd: $("#atlasMerchantItemAdd"), atlasSecretSheetSection: $("#atlasSecretSheetSection"), atlasSecretReveal: $("#atlasSecretReveal"), atlasSecretClues: $("#atlasSecretClues"), atlasSecretCheckType: $("#atlasSecretCheckType"), atlasSecretCheckDc: $("#atlasSecretCheckDc"), atlasSecretSuccess: $("#atlasSecretSuccess"), atlasSecretFailure: $("#atlasSecretFailure"), atlasSecretDiscovered: $("#atlasSecretDiscovered"), atlasMissionSheetSection: $("#atlasMissionSheetSection"), atlasMissionGiver: $("#atlasMissionGiver"), atlasMissionObjective: $("#atlasMissionObjective"), atlasMissionSecondary: $("#atlasMissionSecondary"), atlasMissionReward: $("#atlasMissionReward"), atlasMissionNotes: $("#atlasMissionNotes"), atlasMissionStages: $("#atlasMissionStages"), atlasMissionStageInput: $("#atlasMissionStageInput"), atlasMissionStageAdd: $("#atlasMissionStageAdd"), atlasContainerSheetSection: $("#atlasContainerSheetSection"), atlasContainerTitle: $("#atlasContainerTitle"), atlasContainerCp: $("#atlasContainerCp"), atlasContainerSp: $("#atlasContainerSp"), atlasContainerGp: $("#atlasContainerGp"), atlasContainerPp: $("#atlasContainerPp"), atlasContainerLocked: $("#atlasContainerLocked"), atlasContainerLockDc: $("#atlasContainerLockDc"), atlasContainerKey: $("#atlasContainerKey"), atlasContainerTrapped: $("#atlasContainerTrapped"), atlasContainerTrapCheck: $("#atlasContainerTrapCheck"), atlasContainerTrapDc: $("#atlasContainerTrapDc"), atlasContainerTrapEffect: $("#atlasContainerTrapEffect"), atlasContainerDisarmDc: $("#atlasContainerDisarmDc"), atlasLootSheetSection: $("#atlasLootSheetSection"), atlasSheetLootGroups: $("#atlasSheetLootGroups"), atlasLootName: $("#atlasLootName"), atlasLootQuantity: $("#atlasLootQuantity"), atlasLootCheckType: $("#atlasLootCheckType"), atlasLootCheckDc: $("#atlasLootCheckDc"), atlasLootNotes: $("#atlasLootNotes"), atlasLootAdd: $("#atlasLootAdd"), atlasLootSearchCheck: $("#atlasLootSearchCheck"), atlasLootSearchModifier: $("#atlasLootSearchModifier"), atlasLootSearchResult: $("#atlasLootSearchResult"), atlasLootSearchRoll: $("#atlasLootSearchRoll"), atlasLootSearchResultList: $("#atlasLootSearchResultList"),
    atlasDmSheet: $("#atlasDmSheet"), atlasDmSheetResize: $("#atlasDmSheetResize"), atlasDmSheetTitle: $("#atlasDmSheetTitle"), atlasDmSheetSubtitle: $("#atlasDmSheetSubtitle"), atlasDmSheetEdit: $("#atlasDmSheetEdit"), atlasDmSheetClose: $("#atlasDmSheetClose"), atlasDmNpcDispositionBar: $("#atlasDmNpcDispositionBar"), atlasDmNpcDisposition: $("#atlasDmNpcDisposition"), atlasDmEntryPicker: $("#atlasDmEntryPicker"), atlasDmEntrySummary: $("#atlasDmEntrySummary"), atlasDmEntryTree: $("#atlasDmEntryTree"), atlasDmRelatedWrap: $("#atlasDmRelatedWrap"), atlasDmRelatedSelect: $("#atlasDmRelatedSelect"), atlasDmDetailHost: $("#atlasDmDetailHost"), detailPanel: $("#detailPanel"), detailPanelPlaceholder: $("#detailPanelPlaceholder"),
    atlasNotebookCreateDialog: $("#atlasNotebookCreateDialog"), atlasNotebookCreateForm: $("#atlasNotebookCreateForm"), atlasNotebookCreateName: $("#atlasNotebookCreateName"), atlasNotebookCreateType: $("#atlasNotebookCreateType"), atlasNotebookCreateSubtype: $("#atlasNotebookCreateSubtype"), atlasNotebookCreateChapter: $("#atlasNotebookCreateChapter"), atlasNotebookCreateParent: $("#atlasNotebookCreateParent"),
    atlasTextDialog: $("#atlasTextDialog"), atlasTextForm: $("#atlasTextForm"), atlasTextValue: $("#atlasTextValue"), atlasTextVisible: $("#atlasTextVisible"),
    atlasCategoryDialog: $("#atlasCategoryDialog"), atlasCategoryForm: $("#atlasCategoryForm"), atlasCategoryName: $("#atlasCategoryName"), atlasCategoryIcon: $("#atlasCategoryIcon"),
    playerWaiting: $("#playerWaiting"), playerAtlas: $("#playerAtlas"), playerModeBadge: $("#playerModeBadge"), playerBreadcrumbs: $("#playerBreadcrumbs"), playerMapViewport: $("#playerMapViewport"), playerMapStage: $("#playerMapStage"), playerMerchantPanel: $("#playerMerchantPanel"), leavePlayerMode: $("#leavePlayerMode"), playerZoomOut: $("#playerZoomOut"), playerZoomReset: $("#playerZoomReset"), playerZoomIn: $("#playerZoomIn")
  };

  let dbPromise = null;
  const imageUrls = new Map();
  let renderToken = 0;
  let currentTool = "select";
  let currentTransform = { x: 0, y: 0, scale: 1 };
  let drawState = null;
  let markerDrag = null;
  let zoneDrag = null;
  const atlasTouchPoints = new Map();
  let atlasPinch = null;
  let atlasSuppressTapUntil = 0;
  let selectedZoneId = "";
  let editingSceneId = "";
  let editingMarkerId = "";
  let editingMarkerSceneId = "";
  let pendingPoint = null;
  let playerSnapshot = null;
  let playerSceneId = "";
  let playerTransform = { x: 0, y: 0, scale: 1, baseWidth: 0, baseHeight: 0 };
  let playerTransformSceneId = "";
  const playerTouchPoints = new Map();
  let playerGesture = null;
  let playerGestureMoved = false;
  let folderSyncTimer = null;
  let folderSyncBusy = false;
  let folderHandle = null;
  let folderDbPromise = null;
  const FOLDER_DB = "forja-folder-sync-v1";
  const FOLDER_STORE = "config";
  const FOLDER_KEY = "directory-handle";
  const FOLDER_BACKUP_NAME = "la-forja-autoguardado.zip";
  let currentRole = "";
  let scenePickerCollapsed = new Set();
  const relatedPickerCollapsed = new Map();
  let dmEntryCollapsed = new Set();
  let dmSheetOpen = false;
  let activeDmNpcMarkerId = "";
  const DM_SHEET_WIDTH_KEY = "forja-atlas-dm-sheet-width-v1";
  let dmSheetResizeState = null;
  let dmSheetMode = "notebook";
  let editingInternalSheetId = "";
  let internalSheetDraft = null;
  let pendingOrphanSheetId = "";
  let internalSheetEditMode = false;
  let pendingNotebookLink = null;
  let sheetPhotoRenderToken = 0;
  let lanHostPlugin = null;
  let lanHosting = false;
  let lanHostAddress = "";
  let lanPollTimer = null;
  let lanLastSnapshotStamp = 0;
  const lanSyncedImages = new Set();

  function state() { return app.getState(); }
  function profile() { return app.getProfile(); }
  function atlas() {
    const campaign = state();
    if (!campaign.atlas || !Array.isArray(campaign.atlas.scenes) || !campaign.atlas.scenes.length) {
      const rootId = app.uid();
      campaign.atlas = {
        currentSceneId: rootId, projectionSceneId: rootId, playerNavigationMode: "follow", publicMerchantEntryId: "", customCategories: [],
        scenes: [{ id: rootId, name: "Mundo", parentSceneId: "", imageId: "", imageName: "", imageType: "", imageWidth: 1600, imageHeight: 900, sourceType: "image", mapProject: null, discovered: true, unlockEventId: "", markers: [], objects: [], fogBase: "covered", fogStrokes: [], fogZones: [], createdAt: app.now(), updatedAt: app.now() }]
      };
    }
    if (!Array.isArray(campaign.atlas.markerSheets)) campaign.atlas.markerSheets = [];
    campaign.atlas.markerSheets = campaign.atlas.markerSheets.map(normaliseMarkerSheet);
    campaign.atlas.scenes.forEach(scene => {
      scene.sourceType = scene.sourceType === "dungeon" || scene.mapProject ? "dungeon" : "image";
      if (!Object.prototype.hasOwnProperty.call(scene, "mapProject")) scene.mapProject = null;
      scene.fogBase = scene.fogBase === "revealed" ? "revealed" : "covered";
      if (!Array.isArray(scene.fogStrokes)) scene.fogStrokes = [];
      if (!Array.isArray(scene.fogZones)) scene.fogZones = [];
      if (!Object.prototype.hasOwnProperty.call(scene, "dmEntryId")) scene.dmEntryId = "";
      if (!Array.isArray(scene.dmEntryIds)) scene.dmEntryIds = scene.dmEntryId ? [scene.dmEntryId] : [];
      scene.dmEntryIds = [...new Set(scene.dmEntryIds.filter(id => entryById(id)))];
      if (scene.dmEntryId && !scene.dmEntryIds.includes(scene.dmEntryId)) scene.dmEntryIds.unshift(scene.dmEntryId);
      if (!Object.prototype.hasOwnProperty.call(scene, "dmSourceMarkerId")) scene.dmSourceMarkerId = "";
      if (!Object.prototype.hasOwnProperty.call(scene, "unlockEventId")) scene.unlockEventId = "";
      scene.unlockEventId = String(scene.unlockEventId || "");
      scene.markers.forEach(marker => {
        if (marker.category === "enemy" || marker.category === "ally") { marker.disposition = marker.category; marker.category = "npc"; marker.icon = "●"; }
        marker.alias = String(marker.alias || "").slice(0, 60);
        marker.disposition = ["enemy", "ally", "neutral"].includes(marker.disposition) ? marker.disposition : "neutral";
        marker.unlockEventId = String(marker.unlockEventId || "");
        marker.mapSize = clamp(marker.mapSize || ((Number(marker.size) || 42) / 42), .25, 8);
        if (!Array.isArray(marker.relatedEntryIds)) marker.relatedEntryIds = [];
        marker.autoOpenDmSheet = Boolean(marker.autoOpenDmSheet);
        marker.sheetMode = marker.sheetMode === "internal" || marker.sheetMode === "notebook" ? marker.sheetMode : "";
        if (!marker.sheetMode && marker.relatedEntryIds.length && supportsInternalMarkerSheet(marker.category)) marker.sheetMode = "notebook";
        marker.primaryEntryId = entryById(marker.primaryEntryId)?.id || "";
        marker.internalSheetId = String(marker.internalSheetId || "");
        if (!marker.sheetMode && marker.category === "merchant" && !marker.relatedEntryIds.length) {
          const sheet = defaultMarkerSheet("merchant", marker.name || "Comerciante", marker.id);
          campaign.atlas.markerSheets.push(sheet);
          marker.sheetMode = "internal";
          marker.internalSheetId = sheet.id;
        }
        if (marker.sheetMode === "internal") {
          const sheet = campaign.atlas.markerSheets.find(item => item.id === marker.internalSheetId);
          if (sheet) { if (!sheet.markerId) sheet.markerId = marker.id; sheet.category = marker.category; sheet.kind = markerSheetKind(marker.category) || sheet.kind; if (!sheet.name && marker.name) sheet.name = marker.name; }
          else { marker.sheetMode = ""; marker.internalSheetId = ""; }
        } else if (marker.sheetMode === "notebook") {
          const primary = entryById(marker.primaryEntryId) || marker.relatedEntryIds.map(entryById).find(Boolean);
          if (primary) { marker.primaryEntryId = primary.id; if (!marker.name) marker.name = primary.name || "Punto"; }
          else { marker.sheetMode = ""; marker.primaryEntryId = ""; }
        }
      });
    });
    if (!Array.isArray(campaign.atlas.collapsedSceneIds)) campaign.atlas.collapsedSceneIds = campaign.atlas.scenes.filter(scene => campaign.atlas.scenes.some(child => child.parentSceneId === scene.id)).map(scene => scene.id);
    const validSceneIds = new Set(campaign.atlas.scenes.map(scene => scene.id));
    campaign.atlas.collapsedSceneIds = [...new Set(campaign.atlas.collapsedSceneIds.filter(id => validSceneIds.has(id)))];
    return campaign.atlas;
  }
  function currentScene() {
    const data = atlas();
    const requested = data.scenes.find(scene => scene.id === data.currentSceneId);
    if (requested && sceneIsUnlocked(requested)) return requested;
    return data.scenes.find(scene => sceneIsUnlocked(scene)) || data.scenes[0];
  }
  function sceneById(id) { return atlas().scenes.find(scene => scene.id === id) || null; }
  function entryById(id) { return state().entries.find(entry => entry.id === id) || null; }

  function historyEventById(id) { return state().history?.events?.find(event => event.id === id) || null; }
  function sceneOwnUnlockMet(scene) { return !scene?.unlockEventId || historyEventById(scene.unlockEventId)?.status === "occurred"; }
  function sceneIsUnlocked(scene) {
    if (!scene) return false;
    const visited = new Set();
    let cursor = scene;
    while (cursor && !visited.has(cursor.id)) {
      if (!sceneOwnUnlockMet(cursor)) return false;
      visited.add(cursor.id);
      cursor = cursor.parentSceneId ? sceneById(cursor.parentSceneId) : null;
    }
    return true;
  }
  function markerIsUnlocked(marker) { return !marker?.unlockEventId || historyEventById(marker.unlockEventId)?.status === "occurred"; }
  function markerDialogScene() { return sceneById(editingMarkerSceneId) || currentScene(); }

  const MARKER_SHEET_KINDS = { npc: "creature", merchant: "creature", enemy: "creature", ally: "creature", secret: "secret", mission: "mission", treasure: "container", chest: "container" };
  const MERCHANT_CURRENCIES = [["cp", "cp", "Cobre"], ["sp", "sp", "Plata"], ["gp", "gp", "Oro"], ["ptp", "ptp", "Platino"]];
  const CHECK_TYPES = [
    ["", "Sin tirada · siempre visible"], ["perception", "Percepción"], ["investigation", "Investigación"],
    ["arcana", "Arcana"], ["history", "Historia"], ["nature", "Naturaleza"], ["religion", "Religión"],
    ["medicine", "Medicina"], ["survival", "Supervivencia"], ["insight", "Perspicacia"], ["other", "Otra prueba"]
  ];
  const CHECK_LABELS = Object.fromEntries(CHECK_TYPES);

  function markerSheetKind(category) { return MARKER_SHEET_KINDS[category] || ""; }
  function supportsInternalMarkerSheet(category) { return Boolean(markerSheetKind(category)); }
  function emptySheetStats() { return { hp: "", maxhp: "", ac: "", speed: "", initiative: "", proficiency: "", str: "", dex: "", con: "", int: "", wis: "", cha: "" }; }
  function normaliseOptionalNumber(value) { return value === "" || value === null || value === undefined || !Number.isFinite(Number(value)) ? "" : Number(value); }
  function normaliseLootItem(raw = {}) {
    return {
      id: String(raw.id || app.uid()), name: String(raw.name || "").slice(0, 160), quantity: Math.max(1, Math.trunc(Number(raw.quantity) || 1)),
      notes: String(raw.notes || "").slice(0, 500), checkType: CHECK_LABELS[String(raw.checkType || "")] !== undefined ? String(raw.checkType || "") : "",
      dc: raw.checkType && Number.isFinite(Number(raw.dc)) ? Math.max(0, Math.min(40, Number(raw.dc))) : ""
    };
  }
  function normaliseMerchantItem(raw = {}) {
    const currency = MERCHANT_CURRENCIES.some(item => item[0] === String(raw.currency || "")) ? String(raw.currency) : "gp";
    return { id: String(raw.id || app.uid()), name: String(raw.name || "").slice(0, 100), priceAmount: Math.max(0, Number(raw.priceAmount ?? raw.price ?? 0) || 0), currency, description: String(raw.description || "").slice(0, 240) };
  }
  function normaliseStage(raw = {}) { return { id: String(raw.id || app.uid()), text: String(raw.text || "").slice(0, 500), done: Boolean(raw.done) }; }
  function defaultMarkerSheet(category, name, markerId = "") {
    return {
      id: app.uid(), markerId, category, kind: markerSheetKind(category) || "creature", name: String(name || (category === "npc" ? "" : "Ficha")).slice(0, 100), imageId: "", description: "",
      stats: emptySheetStats(), modifiers: "", abilities: "", combatStyle: "", nonAggression: "", actions: "", reactions: "",
      secret: { reveal: "", clues: "", checkType: "perception", dc: "", success: "", failure: "", discovered: false },
      mission: { status: "notStarted", giver: "", objective: "", secondary: "", reward: "", notes: "", stages: [] },
      container: { cp: 0, sp: 0, gp: 0, pp: 0, locked: false, lockDc: "", key: "", trapped: false, trapCheck: "perception", trapDc: "", trapEffect: "", disarmDc: "" },
      loot: [], vendorItems: [], createdAt: app.now(), updatedAt: app.now(), orphanedAt: ""
    };
  }
  function normaliseMarkerSheet(raw = {}) {
    const rawCategory = String(raw.category || "npc");
    const category = rawCategory === "enemy" || rawCategory === "ally" ? "npc" : rawCategory;
    const base = defaultMarkerSheet(category, raw.name ?? (category === "npc" ? "" : "Ficha"), raw.markerId || "");
    const stats = { ...base.stats, ...(raw.stats || {}) };
    Object.keys(stats).forEach(key => { stats[key] = normaliseOptionalNumber(stats[key]); });
    return {
      ...base, ...raw,
      id: String(raw.id || base.id), markerId: String(raw.markerId || ""), category, kind: markerSheetKind(category) || String(raw.kind || base.kind),
      name: String(raw.name || base.name).slice(0, 100), imageId: String(raw.imageId || ""), description: String(raw.description || "").slice(0, 8000), stats,
      modifiers: String(raw.modifiers || "").slice(0, 5000), abilities: String(raw.abilities || "").slice(0, 5000), combatStyle: String(raw.combatStyle || "").slice(0, 5000), nonAggression: String(raw.nonAggression || "").slice(0, 5000), actions: String(raw.actions || "").slice(0, 7000), reactions: String(raw.reactions || "").slice(0, 5000),
      secret: { ...base.secret, ...(raw.secret || {}) }, mission: { ...base.mission, ...(raw.mission || {}), stages: Array.isArray(raw.mission?.stages) ? raw.mission.stages.map(normaliseStage).filter(stage => stage.text.trim()) : [] },
      container: { ...base.container, ...(raw.container || {}) }, loot: Array.isArray(raw.loot) ? raw.loot.map(normaliseLootItem).filter(item => item.name.trim()) : [],
      vendorItems: Array.isArray(raw.vendorItems) ? raw.vendorItems.map(normaliseMerchantItem).filter(item => item.name.trim()) : [],
      createdAt: raw.createdAt || base.createdAt, updatedAt: raw.updatedAt || base.updatedAt, orphanedAt: raw.orphanedAt || ""
    };
  }
  function markerSheetById(id) { return atlas().markerSheets.find(sheet => sheet.id === id) || null; }
  function markersForInternalSheet(sheetId) {
    const matches = [];
    for (const scene of atlas().scenes) scene.markers.forEach(marker => { if (marker.sheetMode === "internal" && marker.internalSheetId === sheetId) matches.push({ scene, marker }); });
    return matches;
  }
  function markerForInternalSheet(sheetId) { return markersForInternalSheet(sheetId)[0] || null; }
  function syncMarkerNameFromSheet(marker) {
    if (!marker) return;
    if (marker.sheetMode === "internal") { const sheet = markerSheetById(marker.internalSheetId); if (sheet?.name) marker.name = sheet.name; }
    else if (marker.sheetMode === "notebook") { const entry = entryById(marker.primaryEntryId) || marker.relatedEntryIds?.map(entryById).find(Boolean); if (entry?.name) marker.name = entry.name; }
  }

  function markerHasSheet(marker) {
    if (!marker) return false;
    if (marker.sheetMode === "internal" && markerSheetById(marker.internalSheetId)) return true;
    if (marker.sheetMode === "notebook" && (entryById(marker.primaryEntryId) || marker.relatedEntryIds?.some(id => entryById(id)))) return true;
    if (marker.relatedEntryIds?.some(id => entryById(id))) return true;
    return false;
  }
  function createInternalSheetForMarker(marker, reuseSheetId = "") {
    if (!marker || !supportsInternalMarkerSheet(marker.category)) return null;
    let sheet = reuseSheetId ? markerSheetById(reuseSheetId) : null;
    if (sheet && sheet.category !== marker.category) sheet = null;
    if (!sheet) { sheet = defaultMarkerSheet(marker.category, marker.name, marker.id); atlas().markerSheets.push(sheet); }
    if (!sheet.markerId) sheet.markerId = marker.id;
    sheet.category = marker.category; sheet.kind = markerSheetKind(marker.category);
    if (!sheet.name && marker.name) sheet.name = marker.name;
    sheet.orphanedAt = ""; sheet.updatedAt = app.now();
    marker.sheetMode = "internal"; marker.internalSheetId = sheet.id; marker.primaryEntryId = "";
    if (!marker.name && sheet.name) marker.name = sheet.name;
    return sheet;
  }
  function orphanInternalSheet(marker) {
    const sheet = markerSheetById(marker?.internalSheetId); if (!sheet) return;
    const sheetId = sheet.id; marker.internalSheetId = ""; marker.sheetMode = marker.sheetMode === "internal" ? "" : marker.sheetMode;
    const remaining = markersForInternalSheet(sheetId);
    sheet.markerId = remaining[0]?.marker?.id || ""; sheet.orphanedAt = remaining.length ? "" : app.now(); sheet.updatedAt = app.now();
  }
  function internalSheetLabel(sheet) {
    const category = categoryMeta(sheet.category);
    return `${category.icon} ${sheet.name || "Ficha"}`;
  }

  function orderedEntryIds(ids = []) {
    const priority = { locations: 0, creatures: 1, organisations: 2, quests: 3, things: 4 };
    return [...new Set(ids)].map(entryById).filter(Boolean).sort((a, b) => (priority[a.type] ?? 9) - (priority[b.type] ?? 9) || a.name.localeCompare(b.name, "es")).map(entry => entry.id);
  }

  function linkedEntryIdsForScene(scene) {
    if (!scene) return [];
    const ids = orderedEntryIds(scene.dmEntryIds || []);
    if (scene.dmEntryId && entryById(scene.dmEntryId) && !ids.includes(scene.dmEntryId)) ids.unshift(scene.dmEntryId);
    return ids;
  }

  function clearMarkerSceneLink(markerId, targetSceneId) {
    const target = sceneById(targetSceneId);
    if (!target || target.dmSourceMarkerId !== markerId) return;
    target.dmEntryIds = [];
    target.dmEntryId = "";
    target.dmSourceMarkerId = "";
  }

  function applyMarkerSceneLink(marker, previousTargetSceneId = "") {
    if (!marker) return;
    if (previousTargetSceneId && previousTargetSceneId !== marker.targetSceneId) clearMarkerSceneLink(marker.id, previousTargetSceneId);
    if (!marker.targetSceneId) return;
    const target = sceneById(marker.targetSceneId);
    if (!target) return;
    const ids = orderedEntryIds(marker.relatedEntryIds || []);
    if (!ids.length) {
      if (target.dmSourceMarkerId === marker.id) clearMarkerSceneLink(marker.id, target.id);
      return;
    }
    target.dmEntryIds = ids;
    target.dmEntryId = ids[0];
    target.dmSourceMarkerId = marker.id;
  }

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(MEDIA_DB, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(MEDIA_STORE)) db.createObjectStore(MEDIA_STORE, { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return dbPromise;
  }

  async function putImage(record) {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(MEDIA_STORE, "readwrite");
      transaction.objectStore(MEDIA_STORE).put(record);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
    revokeImageUrl(record.id);
  }

  async function getImage(id) {
    if (!id) return null;
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const request = db.transaction(MEDIA_STORE, "readonly").objectStore(MEDIA_STORE).get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async function getAllImages() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const request = db.transaction(MEDIA_STORE, "readonly").objectStore(MEDIA_STORE).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  function revokeImageUrl(id) {
    const old = imageUrls.get(id);
    if (old) URL.revokeObjectURL(old);
    imageUrls.delete(id);
  }

  async function imageUrl(id) {
    if (!id) return "";
    if (LAN_PLAYER_MODE && currentRole === "player") return `/api/image/${encodeURIComponent(id)}`;
    if (imageUrls.has(id)) return imageUrls.get(id);
    const record = await getImage(id);
    if (!record?.blob) return "";
    const url = URL.createObjectURL(record.blob);
    imageUrls.set(id, url);
    return url;
  }

  function save({ publish = true, render = false, immediate = false } = {}) {
    app.saveState(immediate);
    if (publish) publishProjection();
    if (render) renderAtlas();
  }

  function categories() {
    return [
      ...BASE_CATEGORIES.map(([id, icon, label]) => ({ id, icon, label })),
      ...(atlas().customCategories || []).map(category => ({ ...category, custom: true }))
    ];
  }

  function categoryMeta(id, explicitIcon = "") {
    const found = categories().find(category => category.id === id);
    return found || { id, icon: explicitIcon || "✦", label: "Personalizada" };
  }

  function scenePath(scene) {
    const result = [];
    const visited = new Set();
    let cursor = scene;
    while (cursor && !visited.has(cursor.id)) {
      result.unshift(cursor);
      visited.add(cursor.id);
      cursor = sceneById(cursor.parentSceneId);
    }
    return result;
  }

  function descendantsOfScene(id) {
    const result = [];
    const walk = parent => atlas().scenes.filter(scene => scene.parentSceneId === parent).forEach(scene => { result.push(scene.id); walk(scene.id); });
    walk(id);
    return result;
  }

  function expandSceneAncestors(id) {
    const data = atlas();
    const collapsed = new Set(data.collapsedSceneIds || []);
    let cursor = sceneById(id);
    let changed = false;
    while (cursor?.parentSceneId) {
      if (collapsed.delete(cursor.parentSceneId)) changed = true;
      cursor = sceneById(cursor.parentSceneId);
    }
    if (changed) data.collapsedSceneIds = [...collapsed];
    return changed;
  }

  function setScene(id, { publish = false, sourceMarker = null } = {}) {
    const target = sceneById(id);
    if (!target || !sceneIsUnlocked(target)) return;
    if (sourceMarker?.relatedEntryIds?.length) applyMarkerSceneLink(sourceMarker);
    atlas().currentSceneId = id;
    expandSceneAncestors(id);
    currentTransform = { x: 0, y: 0, scale: 1 };
    selectedZoneId = "";
    save({ publish, render: true });
    if (sourceMarker?.autoOpenDmSheet && linkedEntryIdsForScene(target).length) setTimeout(() => openDmSheet(), 0);
  }

  async function hashPassword(password, salt) {
    const value = `${salt}\u241f${password}`;
    if (crypto?.subtle) {
      const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
      return [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, "0")).join("");
    }
    let a = 2166136261, b = 2246822519;
    for (let i = 0; i < value.length; i += 1) {
      a = Math.imul(a ^ value.charCodeAt(i), 16777619);
      b = Math.imul(b ^ value.charCodeAt(i), 3266489917);
    }
    return `${(a >>> 0).toString(16).padStart(8, "0")}${(b >>> 0).toString(16).padStart(8, "0")}`.repeat(4);
  }

  function authFor(campaign = state()) {
    campaign.auth ||= { passwordHash: "", passwordSalt: "", updatedAt: "" };
    return campaign.auth;
  }

  function trustedKey(campaign = state()) { return `${TRUST_KEY_PREFIX}${campaign.id}`; }
  function isTrusted(campaign = state()) {
    const auth = authFor(campaign);
    return Boolean(auth.passwordHash && localStorage.getItem(trustedKey(campaign)) === auth.passwordHash.slice(0, 24));
  }
  function trustDevice(campaign = state()) { localStorage.setItem(trustedKey(campaign), authFor(campaign).passwordHash.slice(0, 24)); }
  function forgetDevice(campaign = state()) { localStorage.removeItem(trustedKey(campaign)); }

  function renderRoleCampaigns() {
    const campaigns = profile().campaigns;
    els.roleCampaignSelect.innerHTML = campaigns.map(campaign => `<option value="${campaign.id}">${app.escapeHtml(campaign.campaignName)}</option>`).join("");
    els.roleCampaignSelect.value = state().id;
  }

  function showRoleChoice() {
    currentRole = "";
    els.dmApp.hidden = true;
    els.playerApp.hidden = true;
    els.roleGate.hidden = false;
    els.dmAuthForm.hidden = true;
    $(".role-cards", els.roleGate).hidden = false;
    renderRoleCampaigns();
  }

  function enterDm() {
    currentRole = "dm";
    els.roleGate.hidden = true;
    els.playerApp.hidden = true;
    els.dmApp.hidden = false;
    app.render();
    renderAtlas();
  }

  function showDmAuth() {
    if (isTrusted()) { enterDm(); return; }
    const auth = authFor();
    const setup = !auth.passwordHash;
    $(".role-cards", els.roleGate).hidden = true;
    els.dmAuthForm.hidden = false;
    els.dmAuthTitle.textContent = setup ? "Crea la contraseña de esta campaña" : "Acceso de Director de juego";
    els.dmAuthHint.textContent = setup
      ? "Esta campaña todavía no tiene contraseña. Crea una para continuar."
      : "Introduce la contraseña de DM para abrir todas las herramientas de la campaña.";
    els.dmPassword.value = "";
    els.dmPasswordConfirm.value = "";
    els.dmPasswordConfirmLabel.hidden = !setup;
    els.dmPasswordConfirm.required = setup;
    els.dmAuthError.hidden = true;
    setTimeout(() => els.dmPassword.focus(), 0);
  }

  async function submitDmAuth(event) {
    event.preventDefault();
    const auth = authFor();
    const setup = !auth.passwordHash;
    const password = els.dmPassword.value;
    if (password.length < 8) return showAuthError("La contraseña debe tener al menos 8 caracteres.");
    if (setup) {
      if (password !== els.dmPasswordConfirm.value) return showAuthError("Las contraseñas no coinciden.");
      auth.passwordSalt = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
      auth.passwordHash = await hashPassword(password, auth.passwordSalt);
      auth.updatedAt = app.now();
      app.saveState(true);
    } else {
      const hash = await hashPassword(password, auth.passwordSalt);
      if (hash !== auth.passwordHash) return showAuthError("La contraseña no es correcta.");
    }
    if (els.rememberDmDevice.checked) trustDevice();
    else forgetDevice();
    enterDm();
  }

  function showAuthError(text) {
    els.dmAuthError.textContent = text;
    els.dmAuthError.hidden = false;
  }

  function enterPlayer({ projection = false } = {}) {
    currentRole = "player";
    els.roleGate.hidden = true;
    els.dmApp.hidden = true;
    els.playerApp.hidden = false;
    if (els.leavePlayerMode) els.leavePlayerMode.hidden = LAN_PLAYER_MODE;
    const campaignId = new URLSearchParams(location.search).get("campaign") || state().id;
    loadProjectionSnapshot(campaignId);
    if (!projection) history.replaceState(null, "", `${location.pathname}?player=1&campaign=${encodeURIComponent(campaignId)}`);
  }

  function leavePlayer() {
    history.replaceState(null, "", location.pathname);
    showRoleChoice();
  }

  function initRoleGate() {
    const params = new URLSearchParams(location.search);
    if (LAN_PLAYER_MODE || params.get("projection") === "1" || params.get("player") === "1") {
      const campaignId = params.get("campaign");
      if (campaignId && profile().campaigns.some(campaign => campaign.id === campaignId)) app.activateCampaign(campaignId);
      enterPlayer({ projection: true });
      return;
    }
    showRoleChoice();
  }


  function getLanHostPlugin() {
    if (lanHostPlugin) return lanHostPlugin;
    const cap = window.Capacitor;
    try {
      if (!cap?.isNativePlatform?.()) return null;
      if (typeof cap.registerPlugin === "function") lanHostPlugin = cap.registerPlugin("LanHost");
      else lanHostPlugin = cap.Plugins?.LanHost || null;
    } catch (error) { console.warn("No se pudo registrar el host LAN.", error); }
    return lanHostPlugin;
  }

  function renderLanHostState({ running = lanHosting, url = lanHostAddress, error = "" } = {}) {
    if (!els.lanHostSection) return;
    lanHosting = Boolean(running);
    lanHostAddress = url || "";
    els.lanHostSection.classList.toggle("is-running", lanHosting);
    els.lanHostSection.classList.toggle("is-error", Boolean(error));
    const available = Boolean(getLanHostPlugin());
    if (error) {
      els.lanHostStatus.textContent = "No se pudo iniciar la proyección";
      els.lanHostHint.textContent = error;
    } else if (lanHosting) {
      els.lanHostStatus.textContent = "Compartiendo mapa por Wi‑Fi";
      els.lanHostHint.textContent = "Los jugadores deben estar en la misma red y abrir la dirección indicada.";
    } else if (available) {
      els.lanHostStatus.textContent = "Host local detenido";
      els.lanHostHint.textContent = "Inícialo cuando quieras compartir la vista de jugadores del Atlas.";
    } else {
      els.lanHostStatus.textContent = "Disponible al ejecutar la APK";
      els.lanHostHint.textContent = "Esta función necesita el complemento Android incluido con esta versión.";
    }
    els.lanHostUrlWrap.hidden = !lanHosting || !lanHostAddress;
    els.lanHostUrl.textContent = lanHostAddress;
    els.lanHostStart.hidden = lanHosting;
    els.lanHostStart.disabled = !available;
    els.lanHostStop.hidden = !lanHosting;
    els.lanHostCopy.hidden = !lanHosting || !lanHostAddress;
  }

  async function blobToBase64(blob) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = "";
    const chunk = 0x8000;
    for (let index = 0; index < bytes.length; index += chunk) binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
    return btoa(binary);
  }

  async function syncLanImage(id) {
    if (!lanHosting || !id || lanSyncedImages.has(id)) return;
    const plugin = getLanHostPlugin();
    if (!plugin) return;
    const record = await getImage(id);
    if (!record?.blob) return;
    const base64 = await blobToBase64(record.blob);
    await plugin.setImage({ id, base64, mime: record.type || record.blob.type || "image/png" });
    lanSyncedImages.add(id);
  }

  async function syncLanProjection(snapshot = publicSnapshot()) {
    if (!lanHosting) return;
    const plugin = getLanHostPlugin();
    if (!plugin) return;
    try {
      await plugin.setSnapshot({ json: JSON.stringify(snapshot) });
      const imageIds = [...new Set(snapshot.scenes.map(scene => scene.imageId).filter(Boolean))];
      await Promise.all(imageIds.map(id => syncLanImage(id)));
    } catch (error) {
      console.warn("No se pudo actualizar la proyección LAN.", error);
      renderLanHostState({ running: false, error: error?.message || "Error de comunicación con el host local." });
    }
  }

  async function refreshLanHostStatus() {
    const plugin = getLanHostPlugin();
    if (!plugin) { renderLanHostState({ running: false }); return; }
    try {
      const result = await plugin.status();
      lanHosting = Boolean(result?.running);
      lanHostAddress = result?.url || "";
      renderLanHostState({ running: lanHosting, url: lanHostAddress });
      if (lanHosting) await syncLanProjection();
    } catch (error) { renderLanHostState({ running: false, error: error?.message || "No se pudo consultar el host local." }); }
  }

  async function startLanHost() {
    const plugin = getLanHostPlugin();
    if (!plugin) { renderLanHostState({ running: false, error: "El host Wi‑Fi solo está disponible dentro de la APK Android." }); return; }
    els.lanHostStart.disabled = true;
    try {
      const result = await plugin.start({ port: 8765 });
      lanHosting = Boolean(result?.running);
      lanHostAddress = result?.url || "";
      if (lanHosting && !lanHostAddress) {
        await plugin.stop();
        lanHosting = false;
        throw new Error("No encuentro una dirección Wi‑Fi local. Conecta la tablet a la misma red que usarán los jugadores.");
      }
      lanSyncedImages.clear();
      await plugin.clearImages();
      renderLanHostState({ running: lanHosting, url: lanHostAddress });
      await syncLanProjection();
    } catch (error) {
      renderLanHostState({ running: false, error: error?.message || "Comprueba que la tablet esté conectada a Wi‑Fi." });
    } finally { if (!lanHosting) els.lanHostStart.disabled = false; }
  }

  async function stopLanHost() {
    const plugin = getLanHostPlugin();
    try { await plugin?.stop?.(); } catch (error) { console.warn(error); }
    lanHosting = false; lanHostAddress = ""; lanSyncedImages.clear();
    renderLanHostState({ running: false });
  }

  async function copyLanHostAddress() {
    if (!lanHostAddress) return;
    try {
      await navigator.clipboard.writeText(lanHostAddress);
      els.lanHostCopy.textContent = "✓ Copiada";
      setTimeout(() => { if (els.lanHostCopy) els.lanHostCopy.textContent = "⧉ Copiar dirección"; }, 1300);
    } catch {
      prompt("Copia esta dirección y ábrela en el navegador de los jugadores:", lanHostAddress);
    }
  }

  async function fetchLanProjection() {
    try {
      const response = await fetch(`/api/state?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const snapshot = await response.json();
      const stamp = Number(snapshot?.updatedAt || 0);
      if (!playerSnapshot || stamp !== lanLastSnapshotStamp) {
        lanLastSnapshotStamp = stamp;
        playerSnapshot = snapshot;
        if (playerSnapshot.playerNavigationMode === "follow") playerSceneId = playerSnapshot.projectionSceneId;
        renderPlayer();
      }
    } catch (error) {
      if (!playerSnapshot) { els.playerWaiting.hidden = false; els.playerAtlas.hidden = true; }
    }
  }

  function openDrawer() {
    els.drawerCampaignName.textContent = state().campaignName;
    refreshLanHostStatus();
    els.settingsDrawer.classList.add("is-open");
    els.settingsDrawer.setAttribute("aria-hidden", "false");
    els.drawerBackdrop.hidden = false;
  }
  function closeDrawer() {
    els.settingsDrawer.classList.remove("is-open");
    els.settingsDrawer.setAttribute("aria-hidden", "true");
    els.drawerBackdrop.hidden = true;
  }

  async function changePassword(event) {
    event.preventDefault();
    const auth = authFor();
    const current = els.currentDmPassword.value;
    const next = els.newDmPassword.value;
    els.passwordChangeError.hidden = true;
    if (auth.passwordHash) {
      const currentHash = await hashPassword(current, auth.passwordSalt);
      if (currentHash !== auth.passwordHash) return passwordChangeError("La contraseña actual no es correcta.");
    }
    if (next.length < 8) return passwordChangeError("La nueva contraseña debe tener al menos 8 caracteres.");
    if (next !== els.newDmPasswordConfirm.value) return passwordChangeError("Las nuevas contraseñas no coinciden.");
    auth.passwordSalt = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    auth.passwordHash = await hashPassword(next, auth.passwordSalt);
    auth.updatedAt = app.now();
    forgetDevice();
    app.saveState(true);
    els.changePasswordForm.reset();
    alert("Contraseña actualizada. Puedes volver a recordar este dispositivo al iniciar sesión.");
  }
  function passwordChangeError(text) { els.passwordChangeError.textContent = text; els.passwordChangeError.hidden = false; }

  function renderAtlas() {
    if (!els.atlasView || state().view !== "atlas") return;
    const data = atlas();
    const scene = currentScene();
    if (!scene) return;
    if (data.currentSceneId !== scene.id) data.currentSceneId = scene.id;
    const token = ++renderToken;
    els.atlasSceneTitle.textContent = scene.name;
    els.atlasBackBtn.disabled = !scene.parentSceneId;
    els.atlasPlayerMode.value = data.playerNavigationMode;
    els.atlasCloseMerchant.hidden = !data.publicMerchantEntryId;
    if (els.atlasEditDungeon) els.atlasEditDungeon.hidden = !(scene.mapProject || scene.sourceType === "dungeon");
    renderBreadcrumbs(scene);
    renderSceneTree();
    renderCategories();
    if (dmSheetOpen) {
      const entryId = scene.dmEntryId && entryById(scene.dmEntryId) ? scene.dmEntryId : state().entries[0]?.id || "";
      if (entryId) { scene.dmEntryId = entryId; app.selectEntryForPanel?.(entryId); }
      renderDmEntryTree();
    }
    applyTransform();
    renderSceneImage(scene, token);
    renderLayers(scene);
  }

  function renderBreadcrumbs(scene) {
    els.atlasBreadcrumbs.replaceChildren();
    scenePath(scene).forEach((part, index, path) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = part.name;
      button.disabled = part.id === scene.id;
      button.addEventListener("click", () => setScene(part.id));
      els.atlasBreadcrumbs.append(button);
      if (index < path.length - 1) els.atlasBreadcrumbs.append(document.createTextNode("›"));
    });
  }

  function renderSceneTree() {
    const data = atlas();
    expandSceneAncestors(data.currentSceneId);
    els.atlasSceneTree.replaceChildren();

    const collapsed = new Set(data.collapsedSceneIds || []);
    const childrenByParent = new Map();
    data.scenes.filter(sceneIsUnlocked).forEach(scene => {
      const parentId = scene.parentSceneId || "";
      if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
      childrenByParent.get(parentId).push(scene);
    });

    const walk = (parentId, depth) => (childrenByParent.get(parentId) || []).forEach(scene => {
      const children = childrenByParent.get(scene.id) || [];
      const hasChildren = children.length > 0;
      const isCollapsed = hasChildren && collapsed.has(scene.id);
      const row = document.createElement("div");
      row.className = `atlas-scene-row${scene.id === data.currentSceneId ? " is-active" : ""}`;
      row.style.setProperty("--depth", depth);

      let toggle;
      if (hasChildren) {
        toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "atlas-scene-row__toggle";
        toggle.textContent = isCollapsed ? "▸" : "▾";
        toggle.title = isCollapsed ? "Desplegar escenas hijas" : "Plegar escenas hijas";
        toggle.setAttribute("aria-label", toggle.title);
        toggle.setAttribute("aria-expanded", String(!isCollapsed));
        toggle.addEventListener("click", event => {
          event.stopPropagation();
          const next = new Set(atlas().collapsedSceneIds || []);
          if (next.has(scene.id)) next.delete(scene.id);
          else next.add(scene.id);
          atlas().collapsedSceneIds = [...next];
          save({ publish: false, render: true });
        });
      } else {
        toggle = document.createElement("span");
        toggle.className = "atlas-scene-row__toggle-placeholder";
        toggle.setAttribute("aria-hidden", "true");
      }

      const open = document.createElement("button");
      open.type = "button";
      open.className = "atlas-scene-row__open";
      open.innerHTML = `<span>${scene.discovered ? "◉" : "○"}</span><strong>${app.escapeHtml(scene.name)}</strong>`;
      open.addEventListener("click", () => setScene(scene.id));

      const eye = document.createElement("button");
      eye.type = "button";
      eye.className = "atlas-eye-button";
      eye.title = scene.discovered ? "Ocultar escena a jugadores" : "Marcar escena como descubierta";
      eye.textContent = scene.discovered ? "◉" : "⊘";
      eye.addEventListener("click", () => { scene.discovered = !scene.discovered; save({ render: true }); });

      row.append(toggle, open, eye);
      els.atlasSceneTree.append(row);
      if (!isCollapsed) walk(scene.id, depth + 1);
    });
    walk("", 0);
  }

  function fitAtlasStage(scene) {
    const viewport = els.atlasMapViewport.getBoundingClientRect();
    if (!viewport.width || !viewport.height) return;
    const ratio = Math.max(.1, (scene.imageWidth || 1600) / (scene.imageHeight || 900));
    const padding = 18;
    let width = Math.max(120, viewport.width - padding * 2);
    let height = width / ratio;
    if (height > viewport.height - padding * 2) {
      height = Math.max(120, viewport.height - padding * 2);
      width = height * ratio;
    }
    els.atlasMapStage.style.width = `${Math.round(width)}px`;
    els.atlasMapStage.style.height = `${Math.round(height)}px`;
  }

  async function renderSceneImage(scene, token) {
    const url = await imageUrl(scene.imageId);
    if (token !== renderToken || currentScene()?.id !== scene.id) return;
    if (!url) {
      els.atlasEmptyMap.hidden = false;
      els.atlasMapStage.hidden = true;
      return;
    }
    els.atlasEmptyMap.hidden = true;
    els.atlasMapStage.hidden = false;
    els.atlasMapStage.style.aspectRatio = `${scene.imageWidth || 16} / ${scene.imageHeight || 9}`;
    fitAtlasStage(scene);
    els.atlasBackground.src = url;
    els.atlasBackground.onload = () => {
      resizeFogCanvas(scene);
      renderSceneOverlays(scene);
    };
    if (els.atlasBackground.complete) {
      resizeFogCanvas(scene);
      renderSceneOverlays(scene);
    }
  }

  function renderSceneOverlays(scene) {
    renderObjects(scene);
    renderMarkers(scene);
    renderFog(scene, els.atlasFogCanvas, true);
    renderZones(scene);
  }

  function renderObjects(scene) {
    els.atlasObjectLayer.replaceChildren();
    const ns = "http://www.w3.org/2000/svg";
    scene.objects.forEach(object => {
      let node;
      if (object.kind === "text") {
        node = document.createElementNS(ns, "text");
        node.setAttribute("x", object.x1 * 1000);
        node.setAttribute("y", object.y1 * 1000);
        node.textContent = object.text;
        node.classList.add("atlas-svg-text");
      } else if (object.kind === "line" || object.kind === "arrow") {
        node = document.createElementNS(ns, "line");
        node.setAttribute("x1", object.x1 * 1000); node.setAttribute("y1", object.y1 * 1000);
        node.setAttribute("x2", object.x2 * 1000); node.setAttribute("y2", object.y2 * 1000);
        if (object.kind === "arrow") node.setAttribute("marker-end", "url(#atlasArrowHead)");
      } else if (object.kind === "rect") {
        node = document.createElementNS(ns, "rect");
        node.setAttribute("x", Math.min(object.x1, object.x2) * 1000); node.setAttribute("y", Math.min(object.y1, object.y2) * 1000);
        node.setAttribute("width", Math.abs(object.x2 - object.x1) * 1000); node.setAttribute("height", Math.abs(object.y2 - object.y1) * 1000);
      } else {
        node = document.createElementNS(ns, "ellipse");
        node.setAttribute("cx", ((object.x1 + object.x2) / 2) * 1000); node.setAttribute("cy", ((object.y1 + object.y2) / 2) * 1000);
        node.setAttribute("rx", Math.abs(object.x2 - object.x1) * 500); node.setAttribute("ry", Math.abs(object.y2 - object.y1) * 500);
      }
      node.dataset.objectId = object.id;
      node.classList.add("atlas-svg-object");
      if (object.visibleToPlayers) node.classList.add("is-public");
      els.atlasObjectLayer.append(node);
    });
    if (!$("#atlasArrowHead", els.atlasObjectLayer)) {
      const defs = document.createElementNS(ns, "defs");
      defs.innerHTML = '<marker id="atlasArrowHead" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" /></marker>';
      els.atlasObjectLayer.prepend(defs);
    }
  }

  function sceneUnitWidth(scene) {
    const width = Number(scene?.mapProject?.widthCells);
    return Number.isFinite(width) && width > 0 ? width : 40;
  }

  function markerSizePercent(scene, marker) {
    return clamp((Number(marker?.mapSize) || 1) / sceneUnitWidth(scene) * 100, .15, 35);
  }

  function markerVisual(marker) {
    if (marker?.category === "npc") {
      const disposition = ["enemy", "ally", "neutral"].includes(marker.disposition) ? marker.disposition : "neutral";
      return { tone: disposition, icon: "", npc: true };
    }
    const tones = {
      treasure: "treasure", chest: "treasure", secret: "secret", mission: "mission", place: "poi",
      world: "place", city: "place", shop: "place", tavern: "place", castle: "place", tower: "place",
      ruins: "poi", dungeon: "poi", road: "place", port: "place", temple: "place", camp: "place",
      danger: "danger", combat: "danger", portal: "portal"
    };
    const meta = categoryMeta(marker?.category, marker?.icon);
    return { tone: tones[marker?.category] || "custom", icon: meta.icon || "", npc: false };
  }

  function markerPlayerLabel(marker) {
    if (marker?.category === "npc") return String(marker.alias || "").trim();
    return String(marker?.name || "").trim();
  }

  function markerDmLabel(marker) {
    if (marker?.name) return marker.name;
    if (marker?.category === "npc") return marker.alias || "NPC sin nombre";
    return categoryMeta(marker?.category, marker?.icon).label;
  }

  function renderMarkers(scene) {
    els.atlasMarkerLayer.replaceChildren();
    scene.markers.forEach(marker => {
      if (!markerIsUnlocked(marker)) return;
      syncMarkerNameFromSheet(marker);
      const visual = markerVisual(marker);
      const meta = categoryMeta(marker.category, marker.icon);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `atlas-marker atlas-marker--${marker.visibility} marker-tone--${visual.tone}${visual.npc ? " atlas-marker--npc" : ""}`;
      button.style.left = `${marker.x * 100}%`;
      button.style.top = `${marker.y * 100}%`;
      button.style.setProperty("--marker-map-size", `${markerSizePercent(scene, marker)}%`);
      button.dataset.markerId = marker.id;
      button.dataset.category = marker.category;
      const markerTarget = marker.targetSceneId ? sceneById(marker.targetSceneId) : null;
      button.title = markerTarget && !sceneIsUnlocked(markerTarget) ? `${markerDmLabel(marker)} · Escena aún bloqueada por Historia` : marker.targetSceneId ? `${markerDmLabel(marker)} · Abrir escena` : markerDmLabel(marker);
      const iconHtml = visual.npc ? '<span class="atlas-marker__dot" aria-hidden="true"></span>' : `<span class="atlas-marker__icon">${app.escapeHtml(meta.icon)}</span>`;
      button.innerHTML = `${iconHtml}<span class="atlas-marker__name">${app.escapeHtml(markerDmLabel(marker))}</span>`;
      button.addEventListener("pointerdown", event => startMarkerDrag(event, marker, button));
      button.addEventListener("dblclick", event => { event.stopPropagation(); openMarkerDialog(marker.id); });
      els.atlasMarkerLayer.append(button);
    });
  }

  function startMarkerDrag(event, marker, element) {
    if (currentTool !== "select" || event.button !== 0) return;
    event.stopPropagation();
    markerDrag = { pointerId: event.pointerId, marker, element, startX: event.clientX, startY: event.clientY, originalX: marker.x, originalY: marker.y, moved: false };
    element.setPointerCapture(event.pointerId);
    element.classList.add("is-dragging");
  }

  function moveMarkerDrag(event) {
    if (!markerDrag || markerDrag.pointerId !== event.pointerId) return;
    const rect = els.atlasMapStage.getBoundingClientRect();
    const dx = (event.clientX - markerDrag.startX) / rect.width;
    const dy = (event.clientY - markerDrag.startY) / rect.height;
    if (Math.hypot(event.clientX - markerDrag.startX, event.clientY - markerDrag.startY) > 4) markerDrag.moved = true;
    markerDrag.marker.x = clamp(markerDrag.originalX + dx);
    markerDrag.marker.y = clamp(markerDrag.originalY + dy);
    markerDrag.element.style.left = `${markerDrag.marker.x * 100}%`;
    markerDrag.element.style.top = `${markerDrag.marker.y * 100}%`;
  }

  function stopMarkerDrag(event) {
    if (!markerDrag || markerDrag.pointerId !== event.pointerId) return false;
    const { marker, element, moved } = markerDrag;
    element.classList.remove("is-dragging");
    if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
    markerDrag = null;
    if (moved) save({ publish: true });
    else if (Date.now() < atlasSuppressTapUntil) return true;
    else if (marker.targetSceneId) {
      const openSheetAfterNavigation = markerHasSheet(marker);
      setScene(marker.targetSceneId, { sourceMarker: marker });
      if (openSheetAfterNavigation) setTimeout(() => openMarkerSheet(marker), 0);
    }
    else if (markerHasSheet(marker)) openMarkerSheet(marker);
    else if (marker.relatedEntryIds?.length) openDmSheet(marker.relatedEntryIds);
    return true;
  }

  function resizeFogCanvas(scene) {
    const rect = els.atlasMapStage.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    if (els.atlasFogCanvas.width !== width || els.atlasFogCanvas.height !== height) {
      els.atlasFogCanvas.width = width;
      els.atlasFogCanvas.height = height;
    }
    renderFog(scene, els.atlasFogCanvas, true);
  }

  function createFogMask(scene, width, height) {
    const mask = document.createElement("canvas");
    mask.width = Math.max(1, Math.round(width));
    mask.height = Math.max(1, Math.round(height));
    const maskCtx = mask.getContext("2d");
    maskCtx.fillStyle = "#000";
    if (scene.fogBase !== "revealed") maskCtx.fillRect(0, 0, mask.width, mask.height);

    const applyFogCircle = (x, y, radius, mode) => {
      maskCtx.globalCompositeOperation = mode === "reveal" ? "destination-out" : "source-over";
      maskCtx.fillStyle = "#000";
      maskCtx.beginPath();
      maskCtx.arc(x * mask.width, y * mask.height, radius * Math.min(mask.width, mask.height), 0, Math.PI * 2);
      maskCtx.fill();
    };

    scene.fogZones.forEach(zone => {
      if (zone.revealed) {
        maskCtx.globalCompositeOperation = "destination-out";
        maskCtx.fillRect(zone.x * mask.width, zone.y * mask.height, zone.width * mask.width, zone.height * mask.height);
      } else if (scene.fogBase === "revealed") {
        maskCtx.globalCompositeOperation = "source-over";
        maskCtx.fillStyle = "#000";
        maskCtx.fillRect(zone.x * mask.width, zone.y * mask.height, zone.width * mask.width, zone.height * mask.height);
      }
    });
    scene.fogStrokes.forEach(stroke => applyFogCircle(stroke.x, stroke.y, stroke.radius, stroke.mode));
    return mask;
  }

  function renderFog(scene, canvas, dmPreview = false) {
    const ctx = canvas.getContext("2d");
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // La máscara se calcula siempre con negro totalmente opaco. Después se
    // dibuja de una sola vez con una opacidad fija para el DM. Así, repasar
    // una zona al ocultarla nunca acumula capas ni crea círculos más oscuros.
    const mask = createFogMask(scene, width, height);
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = dmPreview ? 0.62 : 1;
    ctx.drawImage(mask, 0, 0);
    ctx.restore();
  }

  function visibleFogBounds(scene) {
    const ratio = Math.max(.1, (scene.imageWidth || 1600) / (scene.imageHeight || 900));
    const width = 320;
    const height = Math.max(80, Math.round(width / ratio));
    const mask = createFogMask(scene, width, height);
    const pixels = mask.getContext("2d").getImageData(0, 0, width, height).data;
    let minX = width, minY = height, maxX = -1, maxY = -1, visible = 0;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const alpha = pixels[(y * width + x) * 4 + 3];
        if (alpha < 128) {
          visible += 1;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (!visible || maxX < minX || maxY < minY) return null;
    const padding = 0.045;
    const x = clamp(minX / width - padding);
    const y = clamp(minY / height - padding);
    const right = clamp((maxX + 1) / width + padding);
    const bottom = clamp((maxY + 1) / height + padding);
    return { x, y, width: Math.max(.01, right - x), height: Math.max(.01, bottom - y), fraction: visible / (width * height) };
  }

  function renderZones(scene) {
    els.atlasDmZoneLayer.replaceChildren();
    scene.fogZones.forEach(zone => {
      const node = document.createElement("div");
      node.className = `atlas-fog-zone${zone.revealed ? " is-revealed" : ""}${zone.id === selectedZoneId ? " is-selected" : ""}`;
      node.style.left = `${zone.x * 100}%`; node.style.top = `${zone.y * 100}%`;
      node.style.width = `${zone.width * 100}%`; node.style.height = `${zone.height * 100}%`;
      node.dataset.zoneId = zone.id;
      node.innerHTML = `<span>${app.escapeHtml(zone.name)}</span>`;
      ["nw", "n", "ne", "e", "se", "s", "sw", "w"].forEach(handle => {
        const grip = document.createElement("button");
        grip.type = "button";
        grip.className = `atlas-zone-handle atlas-zone-handle--${handle}`;
        grip.dataset.zoneHandle = handle;
        grip.title = "Redimensionar zona";
        grip.setAttribute("aria-label", `Redimensionar ${zone.name}`);
        node.append(grip);
      });
      node.addEventListener("pointerdown", event => startZoneDrag(event, zone, node));
      node.addEventListener("dblclick", event => { event.stopPropagation(); zone.revealed = !zone.revealed; save({ render: true, immediate: true }); });
      els.atlasDmZoneLayer.append(node);
    });
  }

  function selectZone(zoneId) {
    selectedZoneId = zoneId || "";
    $$(".atlas-fog-zone", els.atlasDmZoneLayer).forEach(node => node.classList.toggle("is-selected", node.dataset.zoneId === selectedZoneId));
  }

  function startZoneDrag(event, zone, element) {
    if (currentTool !== "select" || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    selectZone(zone.id);
    const handle = event.target.closest("[data-zone-handle]")?.dataset.zoneHandle || "move";
    zoneDrag = {
      pointerId: event.pointerId, zone, element, handle,
      startX: event.clientX, startY: event.clientY,
      original: { x: zone.x, y: zone.y, width: zone.width, height: zone.height },
      moved: false
    };
    element.setPointerCapture(event.pointerId);
    element.classList.add("is-dragging");
  }

  function moveZoneDrag(event) {
    if (!zoneDrag || zoneDrag.pointerId !== event.pointerId) return;
    const rect = els.atlasMapStage.getBoundingClientRect();
    const dx = (event.clientX - zoneDrag.startX) / rect.width;
    const dy = (event.clientY - zoneDrag.startY) / rect.height;
    if (Math.hypot(event.clientX - zoneDrag.startX, event.clientY - zoneDrag.startY) > 3) zoneDrag.moved = true;
    const minimum = 0.015;
    const original = zoneDrag.original;
    let { x, y, width, height } = original;
    const handle = zoneDrag.handle;

    if (handle === "move") {
      x = clamp(original.x + dx, 0, 1 - original.width);
      y = clamp(original.y + dy, 0, 1 - original.height);
    } else {
      if (handle.includes("e")) width = clamp(original.width + dx, minimum, 1 - original.x);
      if (handle.includes("s")) height = clamp(original.height + dy, minimum, 1 - original.y);
      if (handle.includes("w")) {
        x = clamp(original.x + dx, 0, original.x + original.width - minimum);
        width = original.width + (original.x - x);
      }
      if (handle.includes("n")) {
        y = clamp(original.y + dy, 0, original.y + original.height - minimum);
        height = original.height + (original.y - y);
      }
    }

    Object.assign(zoneDrag.zone, { x, y, width, height });
    zoneDrag.element.style.left = `${x * 100}%`;
    zoneDrag.element.style.top = `${y * 100}%`;
    zoneDrag.element.style.width = `${width * 100}%`;
    zoneDrag.element.style.height = `${height * 100}%`;
    renderFog(currentScene(), els.atlasFogCanvas, true);
  }

  function stopZoneDrag(event) {
    if (!zoneDrag || zoneDrag.pointerId !== event.pointerId) return false;
    const { element, moved } = zoneDrag;
    element.classList.remove("is-dragging");
    if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
    zoneDrag = null;
    if (moved) save({ publish: true });
    return true;
  }

  function renderLayers(scene) {
    els.atlasLayers.replaceChildren();
    const activeMarkers = scene.markers.filter(markerIsUnlocked);
    const total = activeMarkers.length + scene.objects.length + scene.fogZones.length;
    els.atlasLayerCount.textContent = total;
    if (!total) {
      els.atlasLayers.innerHTML = '<p class="atlas-layers-empty">Añade marcadores, formas o zonas para organizarlas aquí.</p>';
      return;
    }
    activeMarkers.forEach(marker => {
      syncMarkerNameFromSheet(marker);
      const meta = categoryMeta(marker.category, marker.icon);
      const row = layerRow(`${meta.icon} ${marker.name}`, marker.visibility === "dm" ? "⊘" : "◉");
      row.querySelector(".atlas-layer__eye").title = "Cambiar visibilidad";
      row.querySelector(".atlas-layer__eye").addEventListener("click", () => {
        marker.visibility = marker.visibility === "dm" ? "visible" : marker.visibility === "visible" ? "discovered" : "dm";
        if (marker.visibility === "discovered" && marker.targetSceneId) {
          const target = sceneById(marker.targetSceneId); if (target) target.discovered = true;
        }
        save({ render: true });
      });
      if (markerHasSheet(marker)) row.append(actionButton("▤", "Abrir ficha", () => openMarkerSheet(marker)));
      const edit = actionButton("✎", "Editar marcador", () => openMarkerDialog(marker.id));
      row.append(edit);
      const salesEntry = marker.relatedEntryIds.map(entryById).find(entry => entry && ((entry.type === "creatures" && entry.subtype === "vendor") || (entry.type === "locations" && entry.subtype === "shop")));
      const internalMerchantSheet = marker.category === "merchant" && marker.sheetMode === "internal" ? markerSheetById(marker.internalSheetId) : null;
      const salesSource = salesEntry || internalMerchantSheet;
      if (salesSource) row.append(actionButton("⚖", "Mostrar tabla de venta a jugadores", () => {
        atlas().publicMerchantEntryId = salesSource.id;
        save({ publish: true, render: true });
      }));
      els.atlasLayers.append(row);
    });
    scene.objects.forEach(object => {
      const names = { text: "Texto", line: "Línea", arrow: "Flecha", rect: "Rectángulo", circle: "Círculo" };
      const row = layerRow(`${object.kind === "text" ? "T" : "◇"} ${object.text || names[object.kind]}`, object.visibleToPlayers ? "◉" : "⊘");
      row.querySelector(".atlas-layer__eye").addEventListener("click", () => { object.visibleToPlayers = !object.visibleToPlayers; save({ render: true }); });
      row.append(actionButton("×", "Eliminar", () => { scene.objects = scene.objects.filter(item => item.id !== object.id); save({ render: true }); }, true));
      els.atlasLayers.append(row);
    });
    scene.fogZones.forEach(zone => {
      const row = layerRow(`▱ ${zone.name}`, zone.revealed ? "◉" : "⊘");
      row.querySelector(".atlas-layer__eye").addEventListener("click", () => { zone.revealed = !zone.revealed; save({ render: true, immediate: true }); });
      row.append(actionButton("↔", "Mover o redimensionar zona", () => { selectTool("select"); selectZone(zone.id); }));
      row.append(actionButton("×", "Eliminar", () => { scene.fogZones = scene.fogZones.filter(item => item.id !== zone.id); if (selectedZoneId === zone.id) selectedZoneId = ""; save({ render: true }); }, true));
      els.atlasLayers.append(row);
    });
  }

  function layerRow(name, eyeText) {
    const row = document.createElement("article");
    row.className = "atlas-layer";
    const label = document.createElement("span"); label.className = "atlas-layer__name"; label.textContent = name;
    const eye = document.createElement("button"); eye.type = "button"; eye.className = "atlas-layer__eye"; eye.textContent = eyeText;
    row.append(label, eye);
    return row;
  }
  function actionButton(text, title, handler, danger = false) {
    const button = document.createElement("button"); button.type = "button"; button.className = `atlas-layer__action${danger ? " is-danger" : ""}`; button.textContent = text; button.title = title; button.addEventListener("click", handler); return button;
  }

  function renderCategories() {
    els.atlasMarkerCategory.innerHTML = categories().map(category => `<option value="${category.id}">${app.escapeHtml(category.icon)} ${app.escapeHtml(category.label)}</option>`).join("");
  }

  function compareTreeItems(a, b) {
    return Number(a.order || 0) - Number(b.order || 0) || String(a.name || "").localeCompare(String(b.name || ""), "es", { sensitivity: "base" });
  }

  function childrenMap(items, parentField) {
    const ids = new Set(items.map(item => item.id));
    const map = new Map();
    items.forEach(item => {
      const rawParent = item[parentField] || "";
      const parent = rawParent && ids.has(rawParent) ? rawParent : "";
      if (!map.has(parent)) map.set(parent, []);
      map.get(parent).push(item);
    });
    map.forEach(list => list.sort(compareTreeItems));
    return map;
  }

  function expandSelectedAncestors(selectedIds, items, parentField, collapsed) {
    const byId = new Map(items.map(item => [item.id, item]));
    selectedIds.forEach(id => {
      let cursor = byId.get(id);
      while (cursor?.[parentField]) {
        collapsed.delete(cursor[parentField]);
        cursor = byId.get(cursor[parentField]);
      }
    });
  }

  function treeToggle(hasChildren, collapsed, id, rerender) {
    if (!hasChildren) {
      const spacer = document.createElement("span");
      spacer.className = "atlas-tree-picker__spacer";
      return spacer;
    }
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "atlas-tree-picker__toggle";
    toggle.textContent = collapsed.has(id) ? "▸" : "▾";
    toggle.title = collapsed.has(id) ? "Desplegar" : "Plegar";
    toggle.addEventListener("click", event => {
      event.stopPropagation();
      if (collapsed.has(id)) collapsed.delete(id); else collapsed.add(id);
      rerender();
    });
    return toggle;
  }

  function renderSceneTargetTree(selectedValue = "") {
    if (!els.atlasMarkerTargetTree) return;
    const scenes = atlas().scenes.filter(scene => scene.id !== markerDialogScene()?.id);
    const map = childrenMap(scenes, "parentSceneId");
    if (!scenePickerCollapsed.size) {
      scenes.forEach(scene => { if ((map.get(scene.id) || []).length) scenePickerCollapsed.add(scene.id); });
    }
    expandSelectedAncestors(new Set(selectedValue && selectedValue !== "__new__" ? [selectedValue] : []), scenes, "parentSceneId", scenePickerCollapsed);
    els.atlasMarkerTargetTree.replaceChildren();

    const addSpecial = (value, label, icon) => {
      const row = document.createElement("div");
      row.className = `atlas-tree-picker__row atlas-tree-picker__root${selectedValue === value ? " is-selected" : ""}`;
      row.style.setProperty("--tree-depth", 0);
      row.append(document.createElement("span"));
      const button = document.createElement("button");
      button.type = "button"; button.className = "atlas-tree-picker__choice";
      button.innerHTML = `<span>${icon}</span><strong>${app.escapeHtml(label)}</strong>`;
      button.addEventListener("click", () => { els.atlasMarkerTargetScene.value = value; renderSceneTargetTree(value); });
      row.append(button); els.atlasMarkerTargetTree.append(row);
    };
    addSpecial("", "No abre otra escena", "—");
    addSpecial("__new__", "Crear una escena nueva al guardar", "+");

    const walk = (parentId, depth) => (map.get(parentId) || []).forEach(scene => {
      const children = map.get(scene.id) || [];
      const row = document.createElement("div");
      row.className = `atlas-tree-picker__row${selectedValue === scene.id ? " is-selected" : ""}`;
      row.style.setProperty("--tree-depth", depth);
      row.append(treeToggle(children.length > 0, scenePickerCollapsed, scene.id, () => renderSceneTargetTree(els.atlasMarkerTargetScene.value)));
      const choice = document.createElement("button");
      choice.type = "button"; choice.className = "atlas-tree-picker__choice";
      choice.innerHTML = `<span>${scene.discovered ? "◉" : "○"}</span><strong>${app.escapeHtml(scene.name)}</strong>`;
      choice.title = scenePath(scene).map(part => part.name).join(" › ");
      choice.addEventListener("click", () => { els.atlasMarkerTargetScene.value = scene.id; renderSceneTargetTree(scene.id); });
      row.append(choice); els.atlasMarkerTargetTree.append(row);
      if (!scenePickerCollapsed.has(scene.id)) walk(scene.id, depth + 1);
    });
    walk("", 0);
  }

  function checkedRelatedIds() {
    return new Set($$('input[type="checkbox"]:checked', els.atlasRelatedEntries).map(input => input.value));
  }

  function renderRelatedEntries(selected = []) {
    if (!els.atlasRelatedEntries) return;
    const selectedSet = selected instanceof Set ? selected : new Set(selected);
    const types = app.getTypes();
    els.atlasRelatedEntries.replaceChildren();
    Object.entries(types).forEach(([type, meta]) => {
      const entries = state().entries.filter(entry => entry.type === type);
      if (!entries.length) return;
      const map = childrenMap(entries, "parentId");
      let collapsed = relatedPickerCollapsed.get(type);
      if (!collapsed) {
        collapsed = new Set();
        entries.forEach(entry => { if ((map.get(entry.id) || []).length) collapsed.add(entry.id); });
        relatedPickerCollapsed.set(type, collapsed);
      }
      expandSelectedAncestors(selectedSet, entries, "parentId", collapsed);
      const group = document.createElement("section");
      const heading = document.createElement("h3");
      heading.textContent = `${meta.icon} ${meta.label}`;
      const list = document.createElement("div");
      list.className = "atlas-related-list";
      const rerender = () => renderRelatedEntries(checkedRelatedIds());
      const walk = (parentId, depth) => (map.get(parentId) || []).forEach(entry => {
        const children = map.get(entry.id) || [];
        const row = document.createElement("div");
        row.className = "atlas-related-tree-row";
        row.style.setProperty("--tree-depth", depth);
        row.append(treeToggle(children.length > 0, collapsed, entry.id, rerender));
        const label = document.createElement("label");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox"; checkbox.value = entry.id; checkbox.checked = selectedSet.has(entry.id);
        const name = document.createElement("span"); name.textContent = entry.name;
        label.append(checkbox, name); row.append(label); list.append(row);
        if (!collapsed.has(entry.id)) walk(entry.id, depth + 1);
      });
      walk("", 0);
      group.append(heading, list); els.atlasRelatedEntries.append(group);
    });
  }

  function updateDmEntrySummary(scene = currentScene()) {
    if (!els.atlasDmEntrySummary) return;
    const entry = scene?.dmEntryId ? entryById(scene.dmEntryId) : null;
    els.atlasDmEntrySummary.textContent = entry?.name || "Sin ficha vinculada";
    els.atlasDmEntrySummary.title = entry?.name || "Sin ficha vinculada";
  }

  function renderDmEntryTree() {
    if (!els.atlasDmEntryTree) return;
    const scene = currentScene();
    updateDmEntrySummary(scene);
    const selectedId = scene?.dmEntryId || "";
    const entries = state().entries;
    const types = app.getTypes();
    els.atlasDmEntryTree.replaceChildren();
    if (!entries.length) {
      app.clearEntryForPanel?.();
      const empty = document.createElement("p"); empty.className = "atlas-layers__empty"; empty.textContent = "No hay entradas en el cuaderno."; els.atlasDmEntryTree.append(empty); return;
    }
    const selectedSet = new Set(selectedId ? [selectedId] : []);
    if (!dmEntryCollapsed.size) {
      const allMap = childrenMap(entries, "parentId");
      entries.forEach(entry => { if ((allMap.get(entry.id) || []).length) dmEntryCollapsed.add(entry.id); });
    }
    expandSelectedAncestors(selectedSet, entries, "parentId", dmEntryCollapsed);

    const noneRow = document.createElement("div");
    noneRow.className = `atlas-tree-picker__row atlas-tree-picker__root${!selectedId ? " is-selected" : ""}`;
    noneRow.append(document.createElement("span"));
    const none = document.createElement("button"); none.type = "button"; none.className = "atlas-tree-picker__choice"; none.innerHTML = "<span>—</span><strong>Sin ficha vinculada</strong>";
    none.addEventListener("click", () => { scene.dmEntryId = ""; scene.dmEntryIds = []; scene.dmSourceMarkerId = ""; app.clearEntryForPanel?.(); save({ render: false }); renderDmRelatedSelect(scene); if (els.atlasDmEntryPicker) els.atlasDmEntryPicker.open = false; renderDmEntryTree(); });
    noneRow.append(none); els.atlasDmEntryTree.append(noneRow);

    Object.entries(types).forEach(([type, meta]) => {
      const typeEntries = entries.filter(entry => entry.type === type);
      if (!typeEntries.length) return;
      const title = document.createElement("div"); title.className = "atlas-tree-picker__root"; title.innerHTML = `<strong>${app.escapeHtml(meta.icon)} ${app.escapeHtml(meta.label)}</strong>`; els.atlasDmEntryTree.append(title);
      const map = childrenMap(typeEntries, "parentId");
      const walk = (parentId, depth) => (map.get(parentId) || []).forEach(entry => {
        const children = map.get(entry.id) || [];
        const row = document.createElement("div"); row.className = `atlas-tree-picker__row${selectedId === entry.id ? " is-selected" : ""}`; row.style.setProperty("--tree-depth", depth);
        row.append(treeToggle(children.length > 0, dmEntryCollapsed, entry.id, renderDmEntryTree));
        const button = document.createElement("button"); button.type = "button"; button.className = "atlas-tree-picker__choice"; button.innerHTML = `<span>${app.escapeHtml(meta.icon)}</span><strong>${app.escapeHtml(entry.name)}</strong>`;
        button.addEventListener("click", () => {
          scene.dmEntryId = entry.id;
          scene.dmEntryIds = [entry.id];
          scene.dmSourceMarkerId = "";
          app.selectEntryForPanel?.(entry.id);
          save({ render: false });
          renderDmRelatedSelect(scene);
          if (els.atlasDmEntryPicker) els.atlasDmEntryPicker.open = false;
          renderDmEntryTree();
        });
        row.append(button); els.atlasDmEntryTree.append(row);
        if (!dmEntryCollapsed.has(entry.id)) walk(entry.id, depth + 1);
      });
      walk("", 0);
    });
  }

  function renderDmRelatedSelect(scene = currentScene()) {
    if (!els.atlasDmRelatedWrap || !els.atlasDmRelatedSelect) return;
    const ids = linkedEntryIdsForScene(scene);
    els.atlasDmRelatedWrap.hidden = ids.length < 2;
    els.atlasDmRelatedSelect.replaceChildren();
    ids.forEach(id => {
      const entry = entryById(id);
      if (!entry) return;
      const option = document.createElement("option");
      option.value = id;
      option.textContent = `${entry.type === "locations" ? "⌖" : entry.type === "creatures" ? "♟" : "✦"} ${entry.name}`;
      els.atlasDmRelatedSelect.append(option);
    });
    if (scene?.dmEntryId && ids.includes(scene.dmEntryId)) els.atlasDmRelatedSelect.value = scene.dmEntryId;
    else if (ids[0]) els.atlasDmRelatedSelect.value = ids[0];
    updateDmEntrySummary(scene);
  }

  function markerById(id) {
    if (!id) return null;
    for (const scene of atlas().scenes) {
      const marker = scene.markers.find(item => item.id === id);
      if (marker) return marker;
    }
    return null;
  }

  function setDmNpcMarkerContext(marker = null) {
    const npc = marker?.category === "npc" ? marker : null;
    activeDmNpcMarkerId = npc?.id || "";
    if (els.atlasDmNpcDispositionBar) els.atlasDmNpcDispositionBar.hidden = !npc;
    if (npc && els.atlasDmNpcDisposition) els.atlasDmNpcDisposition.value = ["enemy", "ally", "neutral"].includes(npc.disposition) ? npc.disposition : "neutral";
  }

  function restoreDmSheetChrome() {
    if (els.atlasDmSheetTitle) els.atlasDmSheetTitle.textContent = "Ficha del cuaderno";
    if (els.atlasDmSheetSubtitle) els.atlasDmSheetSubtitle.textContent = "Solo visible para el DM";
    if (els.atlasDmSheetEdit) els.atlasDmSheetEdit.hidden = true;
    const picker = els.atlasDmEntryPicker?.closest(".atlas-dm-sheet__picker");
    if (picker) picker.hidden = false;
  }

  function parkInternalSheetForm({ discard = true } = {}) {
    const form = els.atlasInternalSheetForm;
    if (!form) return;
    form.classList.remove("is-panel");
    if (els.atlasInternalSheetDialog && form.parentElement !== els.atlasInternalSheetDialog) els.atlasInternalSheetDialog.append(form);
    if (discard) { editingInternalSheetId = ""; internalSheetDraft = null; internalSheetEditMode = false; }
  }


  function clampDmSheetWidth(value) {
    const viewport = Math.max(320, window.innerWidth || 1024);
    const minimum = viewport <= 900 ? viewport : 360;
    const maximum = viewport <= 900 ? viewport : Math.max(minimum, Math.min(viewport - 260, viewport * .82));
    return Math.round(clamp(Number(value) || Math.min(620, viewport * .52), minimum, maximum));
  }

  function applyStoredDmSheetWidth() {
    if (!els.atlasDmSheet) return;
    if ((window.innerWidth || 0) <= 900) {
      els.atlasDmSheet.style.removeProperty('--atlas-dm-sheet-width');
      return;
    }
    const stored = Number(localStorage.getItem(DM_SHEET_WIDTH_KEY));
    const width = clampDmSheetWidth(stored || Math.min(620, window.innerWidth * .52));
    els.atlasDmSheet.style.setProperty('--atlas-dm-sheet-width', `${width}px`);
  }

  function startDmSheetResize(event) {
    if (!els.atlasDmSheet || (window.innerWidth || 0) <= 900 || event.button !== 0) return;
    event.preventDefault();
    dmSheetResizeState = { pointerId: event.pointerId, startX: event.clientX, startWidth: els.atlasDmSheet.getBoundingClientRect().width };
    els.atlasDmSheetResize?.setPointerCapture?.(event.pointerId);
    els.atlasDmSheet.classList.add('is-resizing');
  }

  function moveDmSheetResize(event) {
    if (!dmSheetResizeState || dmSheetResizeState.pointerId !== event.pointerId || !els.atlasDmSheet) return;
    const width = clampDmSheetWidth(dmSheetResizeState.startWidth + (dmSheetResizeState.startX - event.clientX));
    els.atlasDmSheet.style.setProperty('--atlas-dm-sheet-width', `${width}px`);
  }

  function stopDmSheetResize(event) {
    if (!dmSheetResizeState || dmSheetResizeState.pointerId !== event.pointerId || !els.atlasDmSheet) return;
    const width = Math.round(els.atlasDmSheet.getBoundingClientRect().width);
    dmSheetResizeState = null;
    els.atlasDmSheet.classList.remove('is-resizing');
    try { localStorage.setItem(DM_SHEET_WIDTH_KEY, String(width)); } catch (_) {}
    if (els.atlasDmSheetResize?.hasPointerCapture?.(event.pointerId)) els.atlasDmSheetResize.releasePointerCapture(event.pointerId);
  }

  function openDmSheet(entryIds = null, sourceMarker = null) {
    const scene = currentScene();
    if (!scene || !els.atlasDmSheet || !els.detailPanel) return;
    parkInternalSheetForm();
    dmSheetMode = "notebook";
    restoreDmSheetChrome();
    setDmNpcMarkerContext(sourceMarker);
    if (Array.isArray(entryIds) && entryIds.length) {
      scene.dmEntryIds = orderedEntryIds(entryIds);
      scene.dmEntryId = scene.dmEntryIds[0] || "";
    }
    dmSheetOpen = true;
    els.atlasDmSheet.hidden = false;
    if (els.atlasDmEntryPicker) els.atlasDmEntryPicker.open = false;
    els.detailPanel.classList.add("detail--atlas-dm");
    els.atlasDmDetailHost.replaceChildren();
    els.atlasDmDetailHost.append(els.detailPanel);
    const ids = linkedEntryIdsForScene(scene);
    let entryId = scene.dmEntryId && ids.includes(scene.dmEntryId) ? scene.dmEntryId : ids[0] || "";
    if (entryId) {
      scene.dmEntryId = entryId;
      app.selectEntryForPanel?.(entryId);
      save({ render: false });
    } else {
      app.clearEntryForPanel?.();
    }
    renderDmRelatedSelect(scene);
    renderDmEntryTree();
  }

  function openInternalSheetPanel(sheetId, sourceMarker = null) {
    const sheet = markerSheetById(sheetId); if (!sheet || !els.atlasDmSheet || !els.atlasInternalSheetForm) return;
    const linkedMarkerInfo = markerForInternalSheet(sheetId);
    setDmNpcMarkerContext(sourceMarker || linkedMarkerInfo?.marker || null);
    if (dmSheetMode === "notebook" && els.detailPanel?.classList.contains("detail--atlas-dm")) {
      els.detailPanel.classList.remove("detail--atlas-dm");
      els.detailPanelPlaceholder?.after(els.detailPanel);
    }
    editingInternalSheetId = sheet.id;
    internalSheetDraft = app.clone(sheet);
    fillInternalSheetCheckOptions();
    loadInternalSheetForm();
    setInternalSheetEditMode(false);
    dmSheetMode = "internal";
    dmSheetOpen = true;
    els.atlasDmSheet.hidden = false;
    els.atlasMarkerDialog?.close?.();
    if (els.atlasInternalSheetDialog?.open) els.atlasInternalSheetDialog.close();
    const meta = categoryMeta(sheet.category);
    if (els.atlasDmSheetTitle) els.atlasDmSheetTitle.textContent = `${meta.icon} ${sheet.name || meta.label}`;
    if (els.atlasDmSheetSubtitle) { const count = markersForInternalSheet(sheet.id).length; els.atlasDmSheetSubtitle.textContent = `${meta.label} · ficha interna privada del Atlas${count > 1 ? ` · compartida por ${count} marcadores` : ""}`; }
    if (els.atlasDmSheetEdit) els.atlasDmSheetEdit.hidden = false;
    const picker = els.atlasDmEntryPicker?.closest(".atlas-dm-sheet__picker");
    if (picker) picker.hidden = true;
    els.atlasDmDetailHost.replaceChildren();
    els.atlasInternalSheetForm.classList.add("is-panel");
    els.atlasDmDetailHost.append(els.atlasInternalSheetForm);
    requestAnimationFrame(() => els.atlasDmDetailHost.scrollTo?.({ top: 0, behavior: "instant" }));
  }

  function closeDmSheet() {
    if (!els.atlasDmSheet || !els.detailPanel) return;
    if (dmSheetMode === "internal") parkInternalSheetForm();
    dmSheetMode = "notebook";
    dmSheetOpen = false;
    setDmNpcMarkerContext(null);
    els.atlasDmSheet.hidden = true;
    restoreDmSheetChrome();
    if (els.detailPanel.classList.contains("detail--atlas-dm")) {
      els.detailPanel.classList.remove("detail--atlas-dm");
      els.detailPanelPlaceholder?.after(els.detailPanel);
    }
    els.atlasDmDetailHost.replaceChildren();
  }

  function historyUnlockOptions() {
    const data = state().history || {};
    const events = data.events || [], chapters = data.chapters || [];
    const known = new Set();
    const groups = chapters.map(chapter => {
      const items = events.filter(event => event.chapterId === chapter.id); items.forEach(event => known.add(event.id));
      if (!items.length) return "";
      return `<optgroup label="${app.escapeHtml(chapter.title)}">${items.map(event => `<option value="${event.id}">${event.status === "occurred" ? "✓" : "⌁"} ${app.escapeHtml(event.title)}</option>`).join("")}</optgroup>`;
    }).join("");
    const legacy = events.filter(event => !known.has(event.id));
    return groups + (legacy.length ? `<optgroup label="Sin capítulo">${legacy.map(event => `<option value="${event.id}">${event.status === "occurred" ? "✓" : "⌁"} ${app.escapeHtml(event.title)}</option>`).join("")}</optgroup>` : "");
  }

  function notebookSuggestion(link = {}) {
    const markerMap = {
      merchant: ["creatures", "vendor"], mission: ["quests", "main"], secret: ["things", "information"], treasure: ["things", "treasure"], chest: ["things", "treasure"],
      shop: ["locations", "shop"], city: ["locations", "settlement"], world: ["locations", "world"], castle: ["locations", "castle"], ruins: ["locations", "dungeon"], dungeon: ["locations", "dungeon"], tavern: ["locations", "building"], temple: ["locations", "building"], camp: ["locations", "landmark"], road: ["locations", "route"], place: ["locations", "other"], poi: ["locations", "landmark"]
    };
    if (link.kind === "scene") return ["locations", "scene"];
    return markerMap[link.categoryId] || ["things", "information"];
  }

  function renderNotebookCreateSubtype() {
    if (!els.atlasNotebookCreateType || !els.atlasNotebookCreateSubtype) return;
    const types = app.getTypes(), meta = types[els.atlasNotebookCreateType.value] || types.things;
    els.atlasNotebookCreateSubtype.innerHTML = meta.subtypes.map(([id, icon, label]) => `<option value="${id}">${app.escapeHtml(icon)} ${app.escapeHtml(label)}</option>`).join("");
    const wanted = pendingNotebookLink?.suggestedSubtype || ""; if ([...els.atlasNotebookCreateSubtype.options].some(option => option.value === wanted)) els.atlasNotebookCreateSubtype.value = wanted;
    renderNotebookCreateParents();
  }
  function renderNotebookCreateParents() {
    if (!els.atlasNotebookCreateParent || !els.atlasNotebookCreateType) return; const type = els.atlasNotebookCreateType.value;
    const list = (state().entries || []).filter(entry => entry.type === type); const byParent = new Map(); list.forEach(entry => { const parent = list.some(item => item.id === entry.parentId) ? entry.parentId : ""; if (!byParent.has(parent)) byParent.set(parent, []); byParent.get(parent).push(entry); });
    byParent.forEach(items => items.sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0)||a.name.localeCompare(b.name,"es"))); const options=[]; const walk=(id,depth)=>{ (byParent.get(id)||[]).forEach(entry=>{ options.push(`<option value="${entry.id}">${"— ".repeat(depth)}${app.escapeHtml(entry.name)}</option>`); walk(entry.id,depth+1); }); }; walk("",0);
    els.atlasNotebookCreateParent.innerHTML = '<option value="">Raíz / sin padre</option>' + options.join("");
  }
  function openNotebookCreateDialog(link) {
    if (!els.atlasNotebookCreateDialog || !els.atlasNotebookCreateForm) return; pendingNotebookLink = { ...link }; const types=app.getTypes(); const [suggestedType,suggestedSubtype]=notebookSuggestion(link); pendingNotebookLink.suggestedSubtype=suggestedSubtype;
    els.atlasNotebookCreateName.value = String(link.name || "Nueva ficha").slice(0,100); els.atlasNotebookCreateType.innerHTML = Object.entries(types).map(([id,meta])=>`<option value="${id}">${app.escapeHtml(meta.icon)} ${app.escapeHtml(meta.label)}</option>`).join(""); els.atlasNotebookCreateType.value=suggestedType;
    const chapters=state().history?.chapters||[]; els.atlasNotebookCreateChapter.innerHTML='<option value="">Sin capítulo</option>'+chapters.map(ch=>`<option value="${ch.id}">${app.escapeHtml(ch.title)}</option>`).join(""); els.atlasNotebookCreateChapter.value=state().history?.selectedChapterId||""; renderNotebookCreateSubtype();
    els.atlasNotebookCreateDialog.showModal(); setTimeout(()=>els.atlasNotebookCreateName.focus(),0);
  }
  function closeNotebookCreateDialog() { const link = pendingNotebookLink; els.atlasNotebookCreateDialog?.close?.(); pendingNotebookLink=null; if (link?.openDungeonAfter) setTimeout(() => window.ForjaDungeon?.open?.(link.sceneId), 0); }
  function saveNotebookCreateDialog(event) {
    event.preventDefault(); const link=pendingNotebookLink; if (!link) return; const entry=app.createNotebookEntry?.({ type: els.atlasNotebookCreateType.value, name: els.atlasNotebookCreateName.value.trim(), subtype: els.atlasNotebookCreateSubtype.value, parentId: els.atlasNotebookCreateParent.value, chapterId: els.atlasNotebookCreateChapter.value }); if (!entry) return;
    if (link.kind === "scene") { const scene=sceneById(link.sceneId); if (scene) { scene.dmEntryIds=orderedEntryIds([...(scene.dmEntryIds||[]),entry.id]); scene.dmEntryId ||= entry.id; scene.updatedAt=app.now(); } }
    if (link.kind === "marker") { const scene=sceneById(link.sceneId), marker=scene?.markers?.find(item=>item.id===link.markerId); if (marker) { marker.relatedEntryIds=orderedEntryIds([...(marker.relatedEntryIds||[]),entry.id]); if (marker.sheetMode !== "internal") { marker.sheetMode="notebook"; marker.primaryEntryId=entry.id; } } }
    save({render:true}); closeNotebookCreateDialog();
  }

  function openSceneDialog(sceneId = "") {
    editingSceneId = sceneId;
    const editing = sceneById(sceneId);
    els.atlasSceneDialogTitle.textContent = editing ? "Editar escena" : "Nueva escena";
    els.atlasSceneName.value = editing?.name || "";
    els.atlasSceneDiscovered.checked = editing?.discovered ?? false;
    if (els.atlasSceneCreateNotebook) els.atlasSceneCreateNotebook.checked = false;
    if (els.atlasSceneCreateNotebookWrap) els.atlasSceneCreateNotebookWrap.hidden = Boolean(editing && linkedEntryIdsForScene(editing).length);
    if (els.atlasSceneUnlockEvent) {
      const isRootScene = Boolean(editing && atlas().scenes[0]?.id === editing.id);
      els.atlasSceneUnlockEvent.innerHTML = '<option value="">Visible para el DM desde el principio</option>' + historyUnlockOptions();
      els.atlasSceneUnlockEvent.value = isRootScene ? "" : (editing?.unlockEventId || "");
      els.atlasSceneUnlockEvent.disabled = isRootScene;
      els.atlasSceneUnlockEvent.title = isRootScene ? "La escena raíz del Atlas siempre debe permanecer disponible." : "";
    }
    const excluded = new Set(editing ? [editing.id, ...descendantsOfScene(editing.id)] : []);
    els.atlasSceneParent.innerHTML = '<option value="">Sin escena superior</option>' + atlas().scenes.filter(scene => !excluded.has(scene.id)).map(scene => `<option value="${scene.id}">${app.escapeHtml(scenePath(scene).map(item => item.name).join(" › "))}</option>`).join("");
    els.atlasSceneParent.value = editing?.parentSceneId || currentScene()?.id || "";
    els.atlasDeleteScene.hidden = !editing || atlas().scenes.length === 1;
    if (els.atlasSceneSourceFieldset) els.atlasSceneSourceFieldset.hidden = Boolean(editing);
    if (els.atlasSceneEditDungeon) els.atlasSceneEditDungeon.hidden = !(editing?.mapProject || editing?.sourceType === "dungeon");
    const defaultSource = $("input[name='atlasSceneSource'][value='image']");
    if (!editing && defaultSource) defaultSource.checked = true;
    els.atlasSceneDialog.showModal();
    setTimeout(() => els.atlasSceneName.focus(), 0);
  }

  function saveSceneDialog(event) {
    event.preventDefault();
    const name = els.atlasSceneName.value.trim();
    if (!name) return;
    let scene = sceneById(editingSceneId);
    const isNew = !scene;
    const previousCurrentId = atlas().currentSceneId;
    const source = $("input[name='atlasSceneSource']:checked")?.value || "image";
    const createNotebook = Boolean(els.atlasSceneCreateNotebook?.checked);
    const rootSceneId = atlas().scenes[0]?.id || "";
    const unlockEventId = editingSceneId && editingSceneId === rootSceneId ? "" : String(els.atlasSceneUnlockEvent?.value || "");
    if (scene) {
      scene.name = name; scene.parentSceneId = els.atlasSceneParent.value; scene.discovered = els.atlasSceneDiscovered.checked; scene.unlockEventId = unlockEventId; scene.updatedAt = app.now();
    } else {
      scene = { id: app.uid(), name, parentSceneId: els.atlasSceneParent.value, imageId: "", imageName: "", imageType: "", imageWidth: 1600, imageHeight: 900, sourceType: source === "dungeon" ? "dungeon" : "image", mapProject: null, discovered: els.atlasSceneDiscovered.checked, unlockEventId, markers: [], objects: [], fogBase: "covered", fogStrokes: [], fogZones: [], createdAt: app.now(), updatedAt: app.now() };
      atlas().scenes.push(scene);
    }
    atlas().currentSceneId = sceneIsUnlocked(scene) ? scene.id : (scene.parentSceneId && sceneIsUnlocked(sceneById(scene.parentSceneId)) ? scene.parentSceneId : previousCurrentId);
    const projected = sceneById(atlas().projectionSceneId);
    if (!projected || !sceneIsUnlocked(projected)) atlas().projectionSceneId = atlas().currentSceneId;
    els.atlasSceneDialog.close();
    save({ render: true });
    document.dispatchEvent(new CustomEvent("forja:historychange"));
    if (createNotebook && !linkedEntryIdsForScene(scene).length) setTimeout(() => openNotebookCreateDialog({ kind: "scene", sceneId: scene.id, name: scene.name, openDungeonAfter: isNew && source === "dungeon" && sceneIsUnlocked(scene) }), 0);
    else if (isNew && source === "dungeon" && sceneIsUnlocked(scene)) setTimeout(() => window.ForjaDungeon?.open?.(scene.id), 0);
  }

  function deleteScene() {
    const scene = sceneById(editingSceneId);
    if (!scene || atlas().scenes.length === 1) return;
    const ids = new Set([scene.id, ...descendantsOfScene(scene.id)]);
    if (!confirm(`¿Eliminar “${scene.name}” y ${ids.size - 1} escenas interiores?`)) return;
    const affectedInternalSheetIds = new Set();
    atlas().scenes.filter(item => ids.has(item.id)).forEach(item => item.markers.forEach(marker => {
      if (marker.sheetMode === "internal" && marker.internalSheetId) affectedInternalSheetIds.add(marker.internalSheetId);
    }));
    atlas().scenes = atlas().scenes.filter(item => !ids.has(item.id));
    affectedInternalSheetIds.forEach(sheetId => {
      const sheet = markerSheetById(sheetId); if (!sheet) return;
      const remaining = markersForInternalSheet(sheetId); sheet.markerId = remaining[0]?.marker?.id || ""; sheet.orphanedAt = remaining.length ? "" : app.now(); sheet.updatedAt = app.now();
    });
    atlas().scenes.forEach(item => item.markers.forEach(marker => { if (ids.has(marker.targetSceneId)) marker.targetSceneId = ""; }));
    atlas().currentSceneId = scene.parentSceneId && !ids.has(scene.parentSceneId) ? scene.parentSceneId : atlas().scenes[0].id;
    if (ids.has(atlas().projectionSceneId)) atlas().projectionSceneId = atlas().currentSceneId;
    els.atlasSceneDialog.close();
    save({ render: true });
  }

  function populateCheckSelect(select, includeAlways = true) {
    if (!select) return;
    const options = includeAlways ? CHECK_TYPES : CHECK_TYPES.filter(([value]) => value);
    select.innerHTML = options.map(([value, label]) => `<option value="${value}">${app.escapeHtml(label)}</option>`).join("");
  }

  function currentMarkerSheetMode() {
    return $("input[name='atlasMarkerSheetMode']:checked", els.atlasMarkerForm)?.value || "internal";
  }

  function renderOrphanSheets(category = els.atlasMarkerCategory?.value || "") {
    if (!els.atlasOrphanSheetList || !els.atlasOrphanSheets) return;
    const sheets = atlas().markerSheets.filter(sheet => sheet.category === category);
    els.atlasOrphanSheetList.replaceChildren();
    if (!sheets.length) { const empty = document.createElement("p"); empty.className = "dialog-intro"; empty.textContent = "No hay fichas internas disponibles para esta categoría."; els.atlasOrphanSheetList.append(empty); return; }
    sheets.sort((a,b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""))).forEach(sheet => {
      const linked = markersForInternalSheet(sheet.id);
      const row = document.createElement("div"); row.className = `atlas-orphan-sheet${pendingOrphanSheetId === sheet.id ? " is-selected" : ""}`;
      const info = document.createElement("div"); const strong = document.createElement("strong"); strong.textContent = internalSheetLabel(sheet);
      const small = document.createElement("small"); small.textContent = linked.length ? `Usada por ${linked.length} marcador${linked.length===1?"":"es"} · se puede compartir` : "Ficha interna sin marcador"; info.append(strong, small);
      const actions = document.createElement("div"); actions.className = "atlas-sheet-photo-actions";
      const open = document.createElement("button"); open.type = "button"; open.className = "button button--quiet"; open.textContent = "Abrir"; open.addEventListener("click", () => openInternalSheetPanel(sheet.id));
      const button = document.createElement("button"); button.type = "button"; button.className = "button button--quiet"; button.textContent = pendingOrphanSheetId === sheet.id ? "Seleccionada" : "Usar esta ficha";
      button.addEventListener("click", () => { pendingOrphanSheetId = sheet.id; const radio = $("input[name='atlasMarkerSheetMode'][value='internal']", els.atlasMarkerForm); if (radio) radio.checked = true; if (!els.atlasMarkerName.value.trim() && sheet.name) els.atlasMarkerName.value = sheet.name; renderMarkerSheetMode(); });
      actions.append(open, button); row.append(info, actions); els.atlasOrphanSheetList.append(row);
    });
  }

  function renderMarkerSheetMode(marker = markerDialogScene()?.markers.find(item => item.id === editingMarkerId) || null) {
    if (!els.atlasMarkerSheetModeWrap) return;
    const category = els.atlasMarkerCategory.value;
    const supported = supportsInternalMarkerSheet(category);
    els.atlasMarkerSheetModeWrap.hidden = !supported;
    const internalRadio = $("input[name='atlasMarkerSheetMode'][value='internal']", els.atlasMarkerForm);
    const notebookRadio = $("input[name='atlasMarkerSheetMode'][value='notebook']", els.atlasMarkerForm);
    if (supported && !internalRadio.checked && !notebookRadio.checked) internalRadio.checked = true;
    const mode = supported ? currentMarkerSheetMode() : "";
    if (els.atlasRelatedFieldset) {
      const legend = $("legend", els.atlasRelatedFieldset);
      if (legend) legend.innerHTML = mode === "notebook" ? 'Ficha principal del cuaderno <small>(elige al menos una)</small>' : 'Relacionar además con el cuaderno <small>(opcional)</small>';
    }
    if (els.atlasMarkerAutoDmSheet) els.atlasMarkerAutoDmSheet.closest("label").hidden = supported && mode === "internal";
    if (els.atlasOrphanSheets) els.atlasOrphanSheets.hidden = !supported;
    renderOrphanSheets(category);
    if (els.atlasMarkerOpenSheet) els.atlasMarkerOpenSheet.hidden = !markerHasSheet(marker);
  }

  function openMarkerSheet(marker) {
    if (!marker) return;
    if (marker.sheetMode === "internal") {
      const sheet = markerSheetById(marker.internalSheetId);
      if (sheet) { openInternalSheetPanel(sheet.id, marker); return; }
    }
    if (marker.sheetMode === "notebook") {
      const ids = orderedEntryIds([marker.primaryEntryId, ...(marker.relatedEntryIds || [])].filter(Boolean));
      if (ids.length) { els.atlasMarkerDialog?.close?.(); openDmSheet(ids, marker); return; }
    }
    if (marker.relatedEntryIds?.length) { els.atlasMarkerDialog?.close?.(); openDmSheet(marker.relatedEntryIds, marker); }
  }

  function fillInternalSheetCheckOptions() {
    populateCheckSelect(els.atlasSecretCheckType, false);
    populateCheckSelect(els.atlasContainerTrapCheck, false);
    populateCheckSelect(els.atlasLootCheckType, true);
    populateCheckSelect(els.atlasLootSearchCheck, false);
  }

  async function renderInternalSheetPhoto() {
    if (!els.atlasSheetPhotoPreview || !internalSheetDraft) return;
    const token = ++sheetPhotoRenderToken;
    if (!internalSheetDraft.imageId) {
      els.atlasSheetPhotoPreview.hidden = true; els.atlasSheetPhotoPreview.removeAttribute("src"); els.atlasSheetPhotoEmpty.hidden = false; els.atlasSheetPhotoRemove.hidden = true; return;
    }
    const url = await imageUrl(internalSheetDraft.imageId).catch(() => "");
    if (token !== sheetPhotoRenderToken) return;
    if (!url) { els.atlasSheetPhotoPreview.hidden = true; els.atlasSheetPhotoEmpty.hidden = false; els.atlasSheetPhotoRemove.hidden = true; return; }
    els.atlasSheetPhotoPreview.src = url; els.atlasSheetPhotoPreview.hidden = false; els.atlasSheetPhotoEmpty.hidden = true; els.atlasSheetPhotoRemove.hidden = false;
  }

  function renderMissionStages() {
    if (!els.atlasMissionStages || !internalSheetDraft) return;
    els.atlasMissionStages.replaceChildren();
    const stages = internalSheetDraft.mission.stages || [];
    if (!stages.length) { els.atlasMissionStages.innerHTML = '<p class="dialog-intro">Todavía no hay etapas.</p>'; return; }
    stages.forEach((stage, index) => {
      const row = document.createElement("div"); row.className = `atlas-sheet-stage${stage.done ? " is-done" : ""}`;
      const check = document.createElement("input"); check.type = "checkbox"; check.checked = stage.done; check.title = "Completada";
      check.addEventListener("change", () => { stage.done = check.checked; renderMissionStages(); });
      const textNode = document.createElement("span"); textNode.className = "atlas-sheet-stage__text"; textNode.textContent = stage.text;
      const up = document.createElement("button"); up.type = "button"; up.className = "atlas-layer__action"; up.textContent = "↑"; up.disabled = index === 0;
      up.addEventListener("click", () => { if (index <= 0) return; [stages[index - 1], stages[index]] = [stages[index], stages[index - 1]]; renderMissionStages(); });
      const down = document.createElement("button"); down.type = "button"; down.className = "atlas-layer__action"; down.textContent = "↓"; down.disabled = index === stages.length - 1;
      down.addEventListener("click", () => { if (index >= stages.length - 1) return; [stages[index + 1], stages[index]] = [stages[index], stages[index + 1]]; renderMissionStages(); });
      const remove = document.createElement("button"); remove.type = "button"; remove.className = "atlas-layer__action is-danger"; remove.textContent = "×";
      remove.addEventListener("click", () => { internalSheetDraft.mission.stages = stages.filter(item => item.id !== stage.id); renderMissionStages(); });
      row.append(check, textNode, up, down, remove); els.atlasMissionStages.append(row);
    });
  }

  function lootGroupKey(item) { return item.checkType ? `${item.checkType}|${Number(item.dc) || 0}` : "always|0"; }
  function lootGroupLabel(item) { return item.checkType ? `${CHECK_LABELS[item.checkType] || "Prueba"} · CD ${Number(item.dc) || 0}` : "Siempre visible · sin tirada"; }

  function renderLootGroups() {
    if (!els.atlasSheetLootGroups || !internalSheetDraft) return;
    els.atlasSheetLootGroups.replaceChildren();
    const items = internalSheetDraft.loot || [];
    if (!items.length) { els.atlasSheetLootGroups.innerHTML = '<p class="dialog-intro">No hay items ni recompensas añadidos.</p>'; renderLootSearchResults(); return; }
    const groups = new Map();
    [...items].sort((a, b) => {
      if (!a.checkType && b.checkType) return -1; if (a.checkType && !b.checkType) return 1;
      return String(a.checkType).localeCompare(String(b.checkType), "es") || Number(a.dc || 0) - Number(b.dc || 0) || a.name.localeCompare(b.name, "es");
    }).forEach(item => { const key = lootGroupKey(item); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(item); });
    groups.forEach(groupItems => {
      const hiddenGroup = Boolean(groupItems[0].checkType);
      const group = document.createElement(hiddenGroup ? "details" : "section"); group.className = "atlas-loot-group";
      const title = document.createElement(hiddenGroup ? "summary" : "h4"); title.textContent = lootGroupLabel(groupItems[0]);
      const list = document.createElement("div"); list.className = "atlas-loot-group-list";
      groupItems.forEach(item => {
        const row = document.createElement("div"); row.className = "atlas-loot-row";
        const name = document.createElement("strong"); name.textContent = item.name;
        const qty = document.createElement("span"); qty.textContent = `×${item.quantity}`;
        const notes = document.createElement("span"); notes.className = "atlas-loot-row__notes"; notes.textContent = item.notes || "";
        const remove = document.createElement("button"); remove.type = "button"; remove.className = "atlas-layer__action is-danger"; remove.textContent = "×"; remove.title = "Eliminar";
        remove.addEventListener("click", () => { internalSheetDraft.loot = items.filter(candidate => candidate.id !== item.id); renderLootGroups(); });
        row.append(name, qty, notes, remove); list.append(row);
      });
      group.append(title, list); els.atlasSheetLootGroups.append(group);
    });
    renderLootSearchResults();
  }

  function renderLootSearchResults() {
    if (!els.atlasLootSearchResultList || !internalSheetDraft) return;
    const allItems = internalSheetDraft.loot || [];
    const always = allItems.filter(item => !item.checkType);
    const checkType = els.atlasLootSearchCheck?.value || "perception";
    const resultValue = els.atlasLootSearchResult?.value === "" ? null : Number(els.atlasLootSearchResult.value);
    const foundByCheck = Number.isFinite(resultValue) ? allItems.filter(item => item.checkType === checkType && Number(item.dc) <= resultValue) : [];
    const visible = [...always, ...foundByCheck];
    els.atlasLootSearchResultList.replaceChildren();
    if (!visible.length) { els.atlasLootSearchResultList.innerHTML = '<p class="atlas-loot-hidden-note">No hay objetos visibles con este resultado.</p>'; return; }
    const groups = new Map();
    visible.forEach(item => { const key = lootGroupKey(item); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(item); });
    groups.forEach(groupItems => {
      const group = document.createElement("section"); group.className = "atlas-loot-found-group";
      const title = document.createElement("h5"); title.textContent = lootGroupLabel(groupItems[0]);
      const list = document.createElement("ul"); groupItems.forEach(item => { const li = document.createElement("li"); li.textContent = `${item.name}${item.quantity > 1 ? ` ×${item.quantity}` : ""}${item.notes ? ` — ${item.notes}` : ""}`; list.append(li); });
      group.append(title, list); els.atlasLootSearchResultList.append(group);
    });
  }

  function formatSheetAbilityModifier(value) {
    if (value === "" || value === null || value === undefined || !Number.isFinite(Number(value))) return "—";
    const modifier = Math.floor((Number(value) - 10) / 2);
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  }

  function syncInternalCreatureModifiers() {
    if (!els.atlasCreatureSheetSection) return;
    $$('[data-sheet-mod]', els.atlasCreatureSheetSection).forEach(output => {
      const key = output.dataset.sheetMod;
      const input = $(`[data-sheet-stat="${key}"]`, els.atlasCreatureSheetSection);
      output.textContent = formatSheetAbilityModifier(input?.value ?? "");
    });
  }

  function renderInternalMerchantItems() {
    if (!els.atlasMerchantItemsList || !internalSheetDraft) return;
    internalSheetDraft.vendorItems ||= [];
    els.atlasMerchantItemsList.replaceChildren();
    if (!internalSheetDraft.vendorItems.length) {
      els.atlasMerchantItemsList.innerHTML = '<div class="empty-list merchant-empty">Todavía no hay artículos a la venta.</div>';
      return;
    }
    internalSheetDraft.vendorItems.forEach(rawItem => {
      const item = Object.assign(rawItem, normaliseMerchantItem(rawItem));
      const row = document.createElement("div"); row.className = "merchant-table-row";
      const name = document.createElement("label"); name.innerHTML = `<span class="sr-only">Nombre del artículo</span><input data-merchant-field="name" maxlength="100" value="${app.escapeHtml(item.name)}" placeholder="Nombre">`;
      const price = document.createElement("label"); price.className = "merchant-price-label";
      const priceWrap = document.createElement("div"); priceWrap.className = "merchant-price-control";
      const amount = document.createElement("input"); amount.type = "number"; amount.min = "0"; amount.step = "1"; amount.inputMode = "numeric"; amount.className = "merchant-price-amount"; amount.value = String(item.priceAmount || 0); amount.setAttribute("aria-label", "Cantidad del precio");
      const coin = document.createElement("span"); coin.className = `coin-icon coin-icon--${item.currency}`; coin.setAttribute("aria-hidden", "true");
      const currency = document.createElement("select"); currency.className = "merchant-currency-select"; currency.setAttribute("aria-label", "Moneda del precio"); currency.innerHTML = MERCHANT_CURRENCIES.map(([value,label,name]) => `<option value="${value}">${label} · ${name}</option>`).join(""); currency.value = item.currency;
      const updateCoin = () => { coin.className = `coin-icon coin-icon--${currency.value}`; };
      priceWrap.append(amount, coin, currency); price.append(priceWrap);
      const description = document.createElement("label"); description.innerHTML = `<span class="sr-only">Descripción</span><input data-merchant-field="description" maxlength="240" value="${app.escapeHtml(item.description)}" placeholder="Efecto, estado, procedencia…">`;
      const remove = document.createElement("button"); remove.type = "button"; remove.className = "card-remove"; remove.title = "Eliminar artículo"; remove.setAttribute("aria-label", "Eliminar artículo"); remove.textContent = "×";
      row.append(name, price, description, remove);
      $$('[data-merchant-field]', row).forEach(input => input.addEventListener("input", () => { item[input.dataset.merchantField] = input.value; }));
      amount.addEventListener("input", () => { item.priceAmount = Math.max(0, Number(amount.value || 0)); });
      currency.addEventListener("change", () => { item.currency = currency.value; updateCoin(); });
      remove.addEventListener("click", () => { internalSheetDraft.vendorItems = internalSheetDraft.vendorItems.filter(candidate => candidate.id !== item.id); renderInternalMerchantItems(); });
      els.atlasMerchantItemsList.append(row);
    });
  }

  function addInternalMerchantItem() {
    if (!internalSheetDraft || internalSheetDraft.category !== "merchant") return;
    const name = String(els.atlasMerchantItemName?.value || "").trim();
    if (!name) { els.atlasMerchantItemName?.focus(); return; }
    internalSheetDraft.vendorItems ||= [];
    internalSheetDraft.vendorItems.push(normaliseMerchantItem({ name, priceAmount: els.atlasMerchantItemPrice?.value, currency: els.atlasMerchantItemCurrency?.value, description: els.atlasMerchantItemDescription?.value }));
    if (els.atlasMerchantItemName) els.atlasMerchantItemName.value = "";
    if (els.atlasMerchantItemPrice) els.atlasMerchantItemPrice.value = "0";
    if (els.atlasMerchantItemCurrency) els.atlasMerchantItemCurrency.value = "gp";
    if (els.atlasMerchantItemDescription) els.atlasMerchantItemDescription.value = "";
    renderInternalMerchantItems();
    els.atlasMerchantItemName?.focus();
  }

  function isControlBlank(control) {
    if (control.type === "checkbox" || control.type === "radio") return !control.checked;
    if (control.tagName === "SELECT") return !String(control.value || "").trim();
    return !String(control.value ?? "").trim();
  }
  function refreshInternalSheetViewVisibility() {
    const form = els.atlasInternalSheetForm, sheet = internalSheetDraft; if (!form || !sheet) return;
    form.querySelectorAll(".view-hide").forEach(node => node.classList.remove("view-hide"));
    if (internalSheetEditMode) return;
    form.querySelectorAll("label").forEach(label => {
      const controls = [...label.querySelectorAll("input,textarea,select")].filter(control => !["atlasSheetPhotoInput"].includes(control.id));
      if (controls.length && controls.every(isControlBlank)) label.classList.add("view-hide");
    });
    if (!sheet.imageId) els.atlasSheetCreaturePhotoWrap?.classList.add("view-hide");
    if (!(sheet.loot || []).length) els.atlasLootSheetSection?.classList.add("view-hide");
    if (sheet.category === "merchant" && !(sheet.vendorItems || []).length) els.atlasMerchantSheetSection?.classList.add("view-hide");
    if (sheet.kind === "creature") { const hasStats = Object.values(sheet.stats || {}).some(value => value !== "" && value !== null && value !== undefined); const hasText = [sheet.modifiers, sheet.abilities, sheet.combatStyle, sheet.nonAggression, sheet.actions, sheet.reactions].some(value => String(value || "").trim()); if (!hasStats && !hasText) els.atlasCreatureSheetSection?.classList.add("view-hide"); }
    form.querySelectorAll(".atlas-sheet-inline-add,.atlas-sheet-photo-actions").forEach(node => node.classList.add("view-hide"));
    const statGroups = [form.querySelector(".atlas-sheet-stats-primary"), form.querySelector(".atlas-sheet-abilities"), form.querySelector(".atlas-sheet-text-grid")].filter(Boolean);
    statGroups.forEach(group => { const labels=[...group.querySelectorAll(":scope > label")]; if (labels.length && labels.every(label=>label.classList.contains("view-hide"))) group.classList.add("view-hide"); });
    [els.atlasCreatureSheetSection, els.atlasSecretSheetSection, els.atlasMissionSheetSection, els.atlasContainerSheetSection].filter(Boolean).forEach(section => {
      const visibleContent=[...section.querySelectorAll("label,.atlas-sheet-stats-primary,.atlas-sheet-abilities,.atlas-sheet-text-grid,.atlas-sheet-stage-list,.atlas-sheet-subcollection")].some(node=>!node.classList.contains("view-hide") && !node.hidden);
      if (!visibleContent && section !== els.atlasCreatureSheetSection) section.classList.add("view-hide");
    });
  }
  function setInternalSheetEditMode(editing) {
    const form=els.atlasInternalSheetForm; if (!form) return; internalSheetEditMode=Boolean(editing); form.classList.toggle("is-view-mode", !internalSheetEditMode);
    const exempt = new Set([els.atlasInternalSheetEditToggle, ...$$('.atlas-internal-sheet-close', form)]);
    form.querySelectorAll("input,textarea,select,button").forEach(control => { if (!exempt.has(control)) control.disabled = !internalSheetEditMode; });
    if (els.atlasInternalSheetEditToggle) { els.atlasInternalSheetEditToggle.textContent = internalSheetEditMode ? "✓" : "✎"; els.atlasInternalSheetEditToggle.title = internalSheetEditMode ? "Guardar y terminar edición" : "Editar ficha"; els.atlasInternalSheetEditToggle.setAttribute("aria-label", els.atlasInternalSheetEditToggle.title); }
    if (els.atlasDmSheetEdit) { els.atlasDmSheetEdit.textContent = internalSheetEditMode ? "✓" : "✎"; els.atlasDmSheetEdit.title = internalSheetEditMode ? "Guardar y terminar edición" : "Editar ficha"; els.atlasDmSheetEdit.setAttribute("aria-label", els.atlasDmSheetEdit.title); }
    refreshInternalSheetViewVisibility();
  }

  function toggleInternalSheetEdit() {
    if (!internalSheetDraft || !editingInternalSheetId) return;
    if (internalSheetEditMode) {
      const draft = collectInternalSheetForm();
      if (draft) {
        const index = atlas().markerSheets.findIndex(sheet => sheet.id === editingInternalSheetId);
        if (index >= 0) {
          atlas().markerSheets[index] = normaliseMarkerSheet(draft);
          markersForInternalSheet(editingInternalSheetId).forEach(({ marker }) => { marker.name = draft.name; });
          save({ render: true });
          internalSheetDraft = app.clone(atlas().markerSheets[index]);
          loadInternalSheetForm();
          const meta = categoryMeta(internalSheetDraft.category);
          if (els.atlasDmSheetTitle && dmSheetMode === "internal") els.atlasDmSheetTitle.textContent = `${meta.icon} ${internalSheetDraft.name || meta.label}`;
        }
      }
      setInternalSheetEditMode(false);
    } else {
      setInternalSheetEditMode(true);
      requestAnimationFrame(() => els.atlasSheetName?.focus());
    }
  }

  function loadInternalSheetForm() {
    const sheet = internalSheetDraft; if (!sheet) return;
    const kind = sheet.kind;
    const category = categoryMeta(sheet.category);
    els.atlasInternalSheetTitle.textContent = sheet.name || "Ficha del Atlas";
    els.atlasInternalSheetKind.textContent = `${category.icon} ${category.label} · ficha privada del DM`;
    els.atlasSheetName.value = sheet.name || "";
    els.atlasSheetDescription.value = sheet.description || "";
    els.atlasCreatureSheetSection.hidden = kind !== "creature";
    els.atlasSheetCreaturePhotoWrap.hidden = kind !== "creature";
    if (els.atlasMerchantSheetSection) els.atlasMerchantSheetSection.hidden = sheet.category !== "merchant";
    els.atlasSecretSheetSection.hidden = kind !== "secret";
    els.atlasMissionSheetSection.hidden = kind !== "mission";
    els.atlasContainerSheetSection.hidden = kind !== "container";
    els.atlasLootSheetSection.hidden = !["creature", "container"].includes(kind);
    els.atlasSheetStatusWrap.hidden = kind !== "mission";
    if (kind === "creature") {
      $$('[data-sheet-stat]', els.atlasCreatureSheetSection).forEach(input => { input.value = sheet.stats?.[input.dataset.sheetStat] ?? ""; });
      syncInternalCreatureModifiers();
      els.atlasCreatureModifiers.value = sheet.modifiers || ""; els.atlasCreatureAbilities.value = sheet.abilities || ""; els.atlasCreatureCombatStyle.value = sheet.combatStyle || ""; els.atlasCreatureNonAggression.value = sheet.nonAggression || ""; els.atlasCreatureActions.value = sheet.actions || ""; els.atlasCreatureReactions.value = sheet.reactions || "";
      if (sheet.category === "merchant") renderInternalMerchantItems();
    }
    if (kind === "secret") {
      els.atlasSecretReveal.value = sheet.secret.reveal || ""; els.atlasSecretClues.value = sheet.secret.clues || ""; els.atlasSecretCheckType.value = sheet.secret.checkType || "perception"; els.atlasSecretCheckDc.value = sheet.secret.dc ?? ""; els.atlasSecretSuccess.value = sheet.secret.success || ""; els.atlasSecretFailure.value = sheet.secret.failure || ""; els.atlasSecretDiscovered.checked = Boolean(sheet.secret.discovered);
    }
    if (kind === "mission") {
      els.atlasSheetStatus.value = sheet.mission.status || "notStarted"; els.atlasMissionGiver.value = sheet.mission.giver || ""; els.atlasMissionObjective.value = sheet.mission.objective || ""; els.atlasMissionSecondary.value = sheet.mission.secondary || ""; els.atlasMissionReward.value = sheet.mission.reward || ""; els.atlasMissionNotes.value = sheet.mission.notes || ""; renderMissionStages();
    }
    if (kind === "container") {
      els.atlasContainerTitle.textContent = sheet.category === "chest" ? "Cofre" : "Tesoro";
      els.atlasContainerCp.value = Number(sheet.container.cp || 0); els.atlasContainerSp.value = Number(sheet.container.sp || 0); els.atlasContainerGp.value = Number(sheet.container.gp || 0); els.atlasContainerPp.value = Number(sheet.container.pp || 0);
      els.atlasContainerLocked.checked = Boolean(sheet.container.locked); els.atlasContainerLockDc.value = sheet.container.lockDc ?? ""; els.atlasContainerKey.value = sheet.container.key || ""; els.atlasContainerTrapped.checked = Boolean(sheet.container.trapped); els.atlasContainerTrapCheck.value = sheet.container.trapCheck || "perception"; els.atlasContainerTrapDc.value = sheet.container.trapDc ?? ""; els.atlasContainerTrapEffect.value = sheet.container.trapEffect || ""; els.atlasContainerDisarmDc.value = sheet.container.disarmDc ?? "";
    }
    if (["creature", "container"].includes(kind)) renderLootGroups();
    renderInternalSheetPhoto();
  }

  function collectInternalSheetForm() {
    const sheet = internalSheetDraft; if (!sheet) return null;
    sheet.name = els.atlasSheetName.value.trim() || (sheet.category === "npc" ? "" : "Ficha");
    sheet.description = els.atlasSheetDescription.value.trim();
    if (sheet.kind === "creature") {
      $$('[data-sheet-stat]', els.atlasCreatureSheetSection).forEach(input => { sheet.stats[input.dataset.sheetStat] = normaliseOptionalNumber(input.value); });
      sheet.modifiers = els.atlasCreatureModifiers.value.trim(); sheet.abilities = els.atlasCreatureAbilities.value.trim(); sheet.combatStyle = els.atlasCreatureCombatStyle.value.trim(); sheet.nonAggression = els.atlasCreatureNonAggression.value.trim(); sheet.actions = els.atlasCreatureActions.value.trim(); sheet.reactions = els.atlasCreatureReactions.value.trim();
      if (sheet.category === "merchant") sheet.vendorItems = (sheet.vendorItems || []).map(normaliseMerchantItem).filter(item => item.name.trim());
    } else if (sheet.kind === "secret") {
      sheet.secret = { reveal: els.atlasSecretReveal.value.trim(), clues: els.atlasSecretClues.value.trim(), checkType: els.atlasSecretCheckType.value || "perception", dc: normaliseOptionalNumber(els.atlasSecretCheckDc.value), success: els.atlasSecretSuccess.value.trim(), failure: els.atlasSecretFailure.value.trim(), discovered: els.atlasSecretDiscovered.checked };
    } else if (sheet.kind === "mission") {
      sheet.mission.status = els.atlasSheetStatus.value; sheet.mission.giver = els.atlasMissionGiver.value.trim(); sheet.mission.objective = els.atlasMissionObjective.value.trim(); sheet.mission.secondary = els.atlasMissionSecondary.value.trim(); sheet.mission.reward = els.atlasMissionReward.value.trim(); sheet.mission.notes = els.atlasMissionNotes.value.trim();
    } else if (sheet.kind === "container") {
      sheet.container = { cp: Math.max(0, Number(els.atlasContainerCp.value) || 0), sp: Math.max(0, Number(els.atlasContainerSp.value) || 0), gp: Math.max(0, Number(els.atlasContainerGp.value) || 0), pp: Math.max(0, Number(els.atlasContainerPp.value) || 0), locked: els.atlasContainerLocked.checked, lockDc: normaliseOptionalNumber(els.atlasContainerLockDc.value), key: els.atlasContainerKey.value.trim(), trapped: els.atlasContainerTrapped.checked, trapCheck: els.atlasContainerTrapCheck.value || "perception", trapDc: normaliseOptionalNumber(els.atlasContainerTrapDc.value), trapEffect: els.atlasContainerTrapEffect.value.trim(), disarmDc: normaliseOptionalNumber(els.atlasContainerDisarmDc.value) };
    }
    sheet.updatedAt = app.now();
    return sheet;
  }

  function openInternalSheetDialog(sheetId) { openInternalSheetPanel(sheetId); }

  function saveInternalSheetDialog(event) {
    event.preventDefault();
    const draft = collectInternalSheetForm(); if (!draft) return;
    const index = atlas().markerSheets.findIndex(sheet => sheet.id === editingInternalSheetId);
    if (index < 0) return;
    atlas().markerSheets[index] = normaliseMarkerSheet(draft);
    const linked = markersForInternalSheet(editingInternalSheetId);
    linked.forEach(({ marker }) => { marker.name = draft.name; marker.category = draft.category; marker.icon = categoryMeta(draft.category).icon; });
    save({ render: true });
    if (dmSheetMode === "internal") {
      internalSheetDraft = app.clone(atlas().markerSheets[index]);
      loadInternalSheetForm();
      setInternalSheetEditMode(false);
      const meta = categoryMeta(internalSheetDraft.category);
      if (els.atlasDmSheetTitle) els.atlasDmSheetTitle.textContent = `${meta.icon} ${internalSheetDraft.name || "NPC sin nombre"}`;
      if (els.atlasDmSheetSubtitle) { const count = markersForInternalSheet(editingInternalSheetId).length; els.atlasDmSheetSubtitle.textContent = `${meta.label} · ficha guardada · solo DM${count > 1 ? ` · compartida por ${count} marcadores` : ""}`; }
      const submit = els.atlasInternalSheetForm.querySelector('button[type="submit"]');
      if (submit) { const oldText = submit.textContent; submit.textContent = "Guardada ✓"; setTimeout(() => { if (submit.isConnected) submit.textContent = oldText; }, 1100); }
      return;
    }
    els.atlasInternalSheetDialog.close(); editingInternalSheetId = ""; internalSheetDraft = null;
  }

  function updateMarkerDialogFields() {
    const isNpc = els.atlasMarkerCategory?.value === "npc";
    if (els.atlasNpcFields) els.atlasNpcFields.hidden = !isNpc;
    if (els.atlasMarkerName) els.atlasMarkerName.required = !isNpc;
    if (els.atlasMarkerCreateNotebookWrap) els.atlasMarkerCreateNotebookWrap.hidden = isNpc || Boolean(markerDialogScene()?.markers.find(item => item.id === editingMarkerId)?.relatedEntryIds?.length);
    if (isNpc && els.atlasMarkerCreateNotebook) els.atlasMarkerCreateNotebook.checked = false;
    const scene = markerDialogScene();
    if (els.atlasMarkerSizeUnit) els.atlasMarkerSizeUnit.textContent = scene?.mapProject?.widthCells ? "m" : "u";
    if (els.atlasMarkerSizeValue) els.atlasMarkerSizeValue.value = `${Number(els.atlasMarkerSize?.value || 1).toFixed(Number(els.atlasMarkerSize?.value || 1) % 1 ? 2 : 0)}`;
  }

  function openMarkerDialog(markerId = "", point = null, sceneId = "") {
    editingMarkerId = markerId;
    editingMarkerSceneId = sceneId || currentScene()?.id || "";
    pendingPoint = point;
    pendingOrphanSheetId = "";
    const marker = markerDialogScene()?.markers.find(item => item.id === markerId);
    renderCategories();
    els.atlasMarkerDialogTitle.textContent = marker ? "Editar marcador" : "Nuevo marcador";
    if (els.atlasMarkerCreateNotebook) els.atlasMarkerCreateNotebook.checked = false;
    els.atlasMarkerName.value = marker?.name || "";
    els.atlasMarkerCategory.value = marker?.category || "place";
    if (els.atlasMarkerAlias) els.atlasMarkerAlias.value = marker?.alias || "";
    if (els.atlasMarkerDisposition) els.atlasMarkerDisposition.value = marker?.disposition || "neutral";
    els.atlasMarkerVisibility.value = marker?.visibility || "dm";
    if (els.atlasMarkerUnlockEvent) {
      els.atlasMarkerUnlockEvent.innerHTML = '<option value="">Visible para el DM desde el principio</option>' + historyUnlockOptions();
      els.atlasMarkerUnlockEvent.value = marker?.unlockEventId || "";
    }
    els.atlasMarkerSize.value = marker?.mapSize || Math.max(.25, Math.min(8, (Number(marker?.size) || 42) / 42));
    els.atlasMarkerTargetScene.value = marker?.targetSceneId || "";
    updateMarkerDialogFields();
    scenePickerCollapsed = new Set();
    renderSceneTargetTree(els.atlasMarkerTargetScene.value);
    renderRelatedEntries(marker?.relatedEntryIds || []);
    if (supportsInternalMarkerSheet(els.atlasMarkerCategory.value)) {
      const radio = $("input[name='atlasMarkerSheetMode'][value='" + (marker?.sheetMode === "notebook" ? "notebook" : "internal") + "']", els.atlasMarkerForm); if (radio) radio.checked = true;
    }
    if (els.atlasMarkerAutoDmSheet) els.atlasMarkerAutoDmSheet.checked = Boolean(marker?.autoOpenDmSheet);
    els.atlasDeleteMarker.hidden = !marker;
    renderMarkerSheetMode(marker);
    if (els.atlasMarkerCreateNotebookWrap) els.atlasMarkerCreateNotebookWrap.hidden = els.atlasMarkerCategory.value === "npc" || Boolean(marker?.relatedEntryIds?.length);
    els.atlasMarkerDialog.showModal();
    setTimeout(() => (els.atlasMarkerCategory.value === "npc" ? els.atlasMarkerAlias : els.atlasMarkerName)?.focus(), 0);
  }

  function saveMarkerDialog(event) {
    event.preventDefault();
    const scene = markerDialogScene(); if (!scene) return;
    let marker = scene.markers.find(item => item.id === editingMarkerId);
    const previousTargetSceneId = marker?.targetSceneId || "";
    const previousInternalSheetId = marker?.internalSheetId || "";
    const category = categoryMeta(els.atlasMarkerCategory.value);
    const createNotebook = category.id !== "npc" && Boolean(els.atlasMarkerCreateNotebook?.checked);
    const relatedEntryIds = orderedEntryIds($$('input[type="checkbox"]:checked', els.atlasRelatedEntries).map(input => input.value));
    const supported = supportsInternalMarkerSheet(category.id);
    const requestedMode = supported ? currentMarkerSheetMode() : (relatedEntryIds.length ? "notebook" : "");
    if (supported && requestedMode === "notebook" && !relatedEntryIds.length && !createNotebook) { alert("Elige al menos una ficha del Cuaderno o marca «Crear además una ficha en el Cuaderno»."); return; }
    let targetSceneId = els.atlasMarkerTargetScene.value;
    if (targetSceneId === "__new__") {
      const child = { id: app.uid(), name: els.atlasMarkerName.value.trim() || els.atlasMarkerAlias?.value.trim() || "Nueva escena", parentSceneId: scene.id, imageId: "", imageName: "", imageType: "", imageWidth: 1600, imageHeight: 900, sourceType: "image", mapProject: null, discovered: els.atlasMarkerVisibility.value === "discovered", unlockEventId: "", markers: [], objects: [], fogBase: "covered", fogStrokes: [], fogZones: [], createdAt: app.now(), updatedAt: app.now() };
      atlas().scenes.push(child); targetSceneId = child.id;
    }
    const requestedName = els.atlasMarkerName.value.trim();
    const isNpc = category.id === "npc";
    const patch = {
      name: requestedName || (isNpc ? "" : category.label), category: category.id, icon: category.icon, visibility: els.atlasMarkerVisibility.value, unlockEventId: String(els.atlasMarkerUnlockEvent?.value || ""), targetSceneId, relatedEntryIds,
      alias: isNpc ? String(els.atlasMarkerAlias?.value || "").trim().slice(0, 60) : "",
      disposition: isNpc && ["enemy", "ally", "neutral"].includes(els.atlasMarkerDisposition?.value) ? els.atlasMarkerDisposition.value : "neutral",
      mapSize: clamp(Number(els.atlasMarkerSize.value) || 1, .25, 8), size: 42,
      autoOpenDmSheet: Boolean(els.atlasMarkerAutoDmSheet?.checked),
      sheetMode: requestedMode, primaryEntryId: requestedMode === "notebook" ? (marker?.primaryEntryId && relatedEntryIds.includes(marker.primaryEntryId) ? marker.primaryEntryId : relatedEntryIds[0] || "") : ""
    };
    if (marker) Object.assign(marker, patch);
    else { marker = { id: app.uid(), x: pendingPoint?.x ?? 0.5, y: pendingPoint?.y ?? 0.5, internalSheetId: "", ...patch }; scene.markers.push(marker); }

    if (requestedMode === "internal") {
      if (pendingOrphanSheetId && previousInternalSheetId && previousInternalSheetId !== pendingOrphanSheetId) { marker.internalSheetId = previousInternalSheetId; orphanInternalSheet(marker); }
      else if (previousInternalSheetId) marker.internalSheetId = previousInternalSheetId;
      createInternalSheetForMarker(marker, pendingOrphanSheetId || marker.internalSheetId);
      const sheet = markerSheetById(marker.internalSheetId); if (sheet) { if (!pendingOrphanSheetId || markersForInternalSheet(sheet.id).length <= 1) sheet.name = marker.name; sheet.category = marker.category; sheet.kind = markerSheetKind(marker.category); sheet.updatedAt = app.now(); }
    } else {
      if (previousInternalSheetId) { marker.internalSheetId = previousInternalSheetId; orphanInternalSheet(marker); }
      marker.internalSheetId = "";
      if (requestedMode === "notebook") {
        const primary = entryById(marker.primaryEntryId); if (primary && marker.name) { primary.name = marker.name; primary.updatedAt = app.now(); }
      }
    }
    if (pendingOrphanSheetId && requestedMode !== "internal") pendingOrphanSheetId = "";
    applyMarkerSceneLink(marker, previousTargetSceneId);
    if (patch.visibility === "discovered" && targetSceneId) { const target = sceneById(targetSceneId); if (target) target.discovered = true; }
    els.atlasMarkerDialog.close(); selectTool("select"); save({ render: true });
    document.dispatchEvent(new CustomEvent("forja:historychange"));
    if (createNotebook && !(marker.relatedEntryIds || []).length) setTimeout(() => openNotebookCreateDialog({ kind: "marker", sceneId: scene.id, markerId: marker.id, name: marker.name || marker.alias || category.label, categoryId: marker.category }), 0);
  }

  function deleteMarker() {
    const scene = markerDialogScene();
    const marker = scene?.markers.find(item => item.id === editingMarkerId);
    if (!scene || !marker || !confirm(`¿Eliminar el marcador “${markerDmLabel(marker)}”?`)) return;
    clearMarkerSceneLink(marker.id, marker.targetSceneId);
    if (marker.sheetMode === "internal" && marker.internalSheetId) {
      const sheet = markerSheetById(marker.internalSheetId);
      if (sheet) {
        const linked = markersForInternalSheet(sheet.id);
        if (linked.length <= 1) {
          const removeSheet = confirm("Este marcador es el último que usa su ficha interna.\n\nAceptar: eliminar también la ficha.\nCancelar: conservarla como ficha interna disponible.");
          if (removeSheet) atlas().markerSheets = atlas().markerSheets.filter(item => item.id !== sheet.id);
          else { sheet.markerId = ""; sheet.orphanedAt = app.now(); sheet.updatedAt = app.now(); }
        } else {
          const remaining = linked.filter(item => item.marker.id !== marker.id); sheet.markerId = remaining[0]?.marker?.id || ""; sheet.orphanedAt = ""; sheet.updatedAt = app.now();
        }
      }
    }
    scene.markers = scene.markers.filter(item => item.id !== marker.id);
    els.atlasMarkerDialog.close(); save({ render: true });
    document.dispatchEvent(new CustomEvent("forja:historychange"));
  }

  function saveText(event) {
    event.preventDefault();
    const scene = currentScene();
    if (!scene || !pendingPoint) return;
    scene.objects.push({ id: app.uid(), kind: "text", x1: pendingPoint.x, y1: pendingPoint.y, x2: pendingPoint.x, y2: pendingPoint.y, text: els.atlasTextValue.value.trim(), visibleToPlayers: els.atlasTextVisible.checked });
    els.atlasTextDialog.close();
    selectTool("select");
    save({ render: true });
  }

  function saveCategory(event) {
    event.preventDefault();
    const category = { id: `custom-${app.uid()}`, label: els.atlasCategoryName.value.trim(), icon: els.atlasCategoryIcon.value.trim() || "✦" };
    atlas().customCategories.push(category);
    els.atlasCategoryDialog.close();
    els.atlasCategoryForm.reset(); els.atlasCategoryIcon.value = "✦";
    save({ render: true });
  }

  async function uploadImage(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const dimensions = await readImageDimensions(file);
    const id = app.uid();
    await putImage({ id, blob: file, name: file.name, type: file.type, createdAt: app.now() });
    const scene = currentScene();
    scene.imageId = id; scene.imageName = file.name; scene.imageType = file.type; scene.imageWidth = dimensions.width; scene.imageHeight = dimensions.height; scene.sourceType = "image"; scene.updatedAt = app.now();
    save({ render: true });
  }

  async function setSceneImageFromBlob(sceneId, blob, options = {}) {
    const scene = sceneById(sceneId);
    if (!scene || !(blob instanceof Blob)) throw new Error("No se pudo guardar la imagen generada.");
    const id = app.uid();
    const type = options.type || blob.type || "image/png";
    const name = options.name || `${scene.name || "mapa"}.png`;
    await putImage({ id, blob, name, type, createdAt: app.now() });
    scene.imageId = id;
    scene.imageName = name;
    scene.imageType = type;
    scene.imageWidth = Math.max(1, Number(options.width) || 1600);
    scene.imageHeight = Math.max(1, Number(options.height) || 900);
    scene.sourceType = "dungeon";
    scene.updatedAt = app.now();
    save({ publish: true, render: state().view === "atlas" });
    return id;
  }

  function readImageDimensions(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => { resolve({ width: image.naturalWidth || 1600, height: image.naturalHeight || 900 }); URL.revokeObjectURL(url); };
      image.onerror = () => { reject(new Error("No se pudo leer la imagen.")); URL.revokeObjectURL(url); };
      image.src = url;
    });
  }

  function selectTool(tool) {
    currentTool = tool;
    $$('[data-atlas-tool]', els.atlasTools).forEach(button => button.classList.toggle("is-active", button.dataset.atlasTool === tool));
    els.atlasMapStage.dataset.tool = tool;
  }

  function pointFromEvent(event) {
    const rect = els.atlasMapStage.getBoundingClientRect();
    return { x: clamp((event.clientX - rect.left) / rect.width), y: clamp((event.clientY - rect.top) / rect.height) };
  }

  function startStageAction(event) {
    if (event.button !== 0 || event.target.closest(".atlas-marker,.atlas-fog-zone")) return;
    const scene = currentScene();
    if (!scene?.imageId) return;
    const point = pointFromEvent(event);
    if (currentTool === "marker") { openMarkerDialog("", point); return; }
    if (currentTool === "text") { pendingPoint = point; els.atlasTextValue.value = ""; els.atlasTextVisible.checked = false; els.atlasTextDialog.showModal(); return; }
    if (["line", "arrow", "rect", "circle", "zone"].includes(currentTool)) {
      drawState = { pointerId: event.pointerId, tool: currentTool, start: point, current: point };
      els.atlasMapStage.setPointerCapture(event.pointerId);
      showDraft(drawState);
      return;
    }
    if (["reveal", "hide"].includes(currentTool)) {
      drawState = { pointerId: event.pointerId, tool: currentTool, lastPoint: point };
      els.atlasMapStage.setPointerCapture(event.pointerId);
      addFogStroke(point, currentTool);
      return;
    }
    if (currentTool === "select") {
      if (selectedZoneId) selectZone("");
      drawState = { pointerId: event.pointerId, tool: "pan", startClient: { x: event.clientX, y: event.clientY }, startTransform: { ...currentTransform } };
      els.atlasMapStage.setPointerCapture(event.pointerId);
      els.atlasMapViewport.classList.add("is-panning");
    }
  }

  function moveStageAction(event) {
    if (markerDrag) { moveMarkerDrag(event); return; }
    if (zoneDrag) { moveZoneDrag(event); return; }
    if (!drawState || drawState.pointerId !== event.pointerId) return;
    if (drawState.tool === "pan") {
      currentTransform.x = drawState.startTransform.x + (event.clientX - drawState.startClient.x);
      currentTransform.y = drawState.startTransform.y + (event.clientY - drawState.startClient.y);
      applyTransform(); return;
    }
    const point = pointFromEvent(event);
    if (["reveal", "hide"].includes(drawState.tool)) {
      addFogStrokeSegment(drawState.lastPoint, point, drawState.tool);
      drawState.lastPoint = point;
      return;
    }
    drawState.current = point; showDraft(drawState);
  }

  function stopStageAction(event) {
    if (stopMarkerDrag(event)) return;
    if (stopZoneDrag(event)) return;
    if (!drawState || drawState.pointerId !== event.pointerId) return;
    const action = drawState;
    drawState = null;
    els.atlasDraft.hidden = true;
    els.atlasMapViewport.classList.remove("is-panning");
    if (els.atlasMapStage.hasPointerCapture(event.pointerId)) els.atlasMapStage.releasePointerCapture(event.pointerId);
    if (action.tool === "pan") return;
    if (["reveal", "hide"].includes(action.tool)) { save({ publish: true, immediate: true }); renderLayers(currentScene()); return; }
    const end = action.current || action.start;
    if (Math.hypot(end.x - action.start.x, end.y - action.start.y) < 0.008) return;
    const scene = currentScene();
    if (action.tool === "zone") {
      scene.fogZones.push({ id: app.uid(), name: `Zona ${scene.fogZones.length + 1}`, x: Math.min(action.start.x, end.x), y: Math.min(action.start.y, end.y), width: Math.abs(end.x - action.start.x), height: Math.abs(end.y - action.start.y), revealed: false });
    } else {
      scene.objects.push({ id: app.uid(), kind: action.tool, x1: action.start.x, y1: action.start.y, x2: end.x, y2: end.y, text: "", visibleToPlayers: false });
    }
    selectTool("select"); save({ render: true });
  }

  function pushFogStroke(scene, point, mode, radius) {
    scene.fogStrokes.push({ mode, x: point.x, y: point.y, radius });
    if (scene.fogStrokes.length > 8000) scene.fogStrokes.splice(0, scene.fogStrokes.length - 8000);
  }

  function addFogStroke(point, mode) {
    const scene = currentScene();
    const radius = Number(els.atlasBrushSize.value) / 100;
    pushFogStroke(scene, point, mode, radius);
    renderFog(scene, els.atlasFogCanvas, true);
  }

  function addFogStrokeSegment(from, to, mode) {
    const scene = currentScene();
    const radius = Number(els.atlasBrushSize.value) / 100;
    const rect = els.atlasMapStage.getBoundingClientRect();
    const distancePx = Math.hypot((to.x - from.x) * rect.width, (to.y - from.y) * rect.height);
    const radiusPx = radius * Math.min(rect.width, rect.height);
    const spacingPx = Math.max(2, radiusPx * 0.28);
    const steps = Math.max(1, Math.ceil(distancePx / spacingPx));
    for (let step = 1; step <= steps; step += 1) {
      const progress = step / steps;
      pushFogStroke(scene, {
        x: from.x + (to.x - from.x) * progress,
        y: from.y + (to.y - from.y) * progress
      }, mode, radius);
    }
    renderFog(scene, els.atlasFogCanvas, true);
  }

  function resetCurrentSceneFog() {
    const scene = currentScene();
    if (!scene) return;
    const hasFogEdits = scene.fogBase === "revealed" || scene.fogStrokes.length || scene.fogZones.some(zone => zone.revealed);
    if (hasFogEdits && !confirm("¿Volver a tapar toda la imagen? Se borrarán las zonas pintadas como reveladas u ocultas y todas las zonas preparadas volverán a estar cerradas.")) return;
    scene.fogBase = "covered";
    scene.fogStrokes = [];
    scene.fogZones.forEach(zone => { zone.revealed = false; });
    save({ publish: true, render: true, immediate: true });
  }

  function revealCurrentSceneFog() {
    const scene = currentScene();
    if (!scene) return;
    const isAlreadyRevealed = scene.fogBase === "revealed" && !scene.fogStrokes.length && scene.fogZones.every(zone => zone.revealed);
    if (!isAlreadyRevealed && !confirm("¿Revelar toda la imagen? Se borrarán los trazos de niebla actuales y todas las zonas preparadas quedarán abiertas.")) return;
    scene.fogBase = "revealed";
    scene.fogStrokes = [];
    scene.fogZones.forEach(zone => { zone.revealed = true; });
    save({ publish: true, render: true, immediate: true });
  }

  function showDraft(action) {
    const start = action.start, end = action.current;
    els.atlasDraft.hidden = false;
    els.atlasDraft.className = `atlas-draft atlas-draft--${action.tool}`;
    els.atlasDraft.style.left = `${Math.min(start.x, end.x) * 100}%`;
    els.atlasDraft.style.top = `${Math.min(start.y, end.y) * 100}%`;
    els.atlasDraft.style.width = `${Math.abs(end.x - start.x) * 100}%`;
    els.atlasDraft.style.height = `${Math.abs(end.y - start.y) * 100}%`;
    if (action.tool === "line" || action.tool === "arrow") {
      const dx = end.x - start.x, dy = end.y - start.y;
      const rect = els.atlasMapStage.getBoundingClientRect();
      const length = Math.hypot(dx * rect.width, dy * rect.height);
      const angle = Math.atan2(dy * rect.height, dx * rect.width) * 180 / Math.PI;
      els.atlasDraft.style.left = `${start.x * 100}%`; els.atlasDraft.style.top = `${start.y * 100}%`;
      els.atlasDraft.style.width = `${length}px`; els.atlasDraft.style.height = "0"; els.atlasDraft.style.transform = `rotate(${angle}deg)`;
    } else els.atlasDraft.style.transform = "";
  }

  function applyTransform() {
    if (!els.atlasMapStage) return;
    els.atlasMapStage.style.transform = `translate(${currentTransform.x}px, ${currentTransform.y}px) scale(${currentTransform.scale})`;
  }

  function setAtlasZoom(scale, { resetPosition = false } = {}) {
    if (state().view !== "atlas" || els.atlasMapStage.hidden) return;
    currentTransform.scale = Math.max(0.5, Math.min(4, Number(scale) || 1));
    if (resetPosition) { currentTransform.x = 0; currentTransform.y = 0; }
    applyTransform();
    if (els.atlasZoomReset) els.atlasZoomReset.textContent = `${Math.round(currentTransform.scale * 100)}%`;
  }

  function zoomAtlasBy(factor) {
    setAtlasZoom(currentTransform.scale * factor);
  }

  function zoomAtlas(event) {
    if (state().view !== "atlas" || els.atlasMapStage.hidden) return;
    event.preventDefault();
    zoomAtlasBy(event.deltaY < 0 ? 1.1 : 1 / 1.1);
  }

  function cancelAtlasPointerAction() {
    if (markerDrag) {
      const { element, pointerId } = markerDrag;
      element?.classList.remove("is-dragging");
      try { if (element?.hasPointerCapture?.(pointerId)) element.releasePointerCapture(pointerId); } catch (_) {}
      markerDrag = null;
    }
    if (zoneDrag) {
      const { element, pointerId } = zoneDrag;
      try { if (element?.hasPointerCapture?.(pointerId)) element.releasePointerCapture(pointerId); } catch (_) {}
      zoneDrag = null;
    }
    if (drawState) {
      const pointerId = drawState.pointerId;
      try { if (els.atlasMapStage?.hasPointerCapture?.(pointerId)) els.atlasMapStage.releasePointerCapture(pointerId); } catch (_) {}
      drawState = null;
      if (els.atlasDraft) els.atlasDraft.hidden = true;
      els.atlasMapViewport?.classList.remove("is-panning");
    }
  }

  function atlasTouchPair() {
    return [...atlasTouchPoints.values()].slice(0, 2);
  }

  function touchPairMetrics(points) {
    if (points.length < 2) return null;
    const [a, b] = points;
    return {
      distance: Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)),
      midX: (a.x + b.x) / 2,
      midY: (a.y + b.y) / 2
    };
  }

  function onAtlasTouchPointerDown(event) {
    if (event.pointerType !== "touch" || state().view !== "atlas" || els.atlasMapStage.hidden) return;
    atlasTouchPoints.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (atlasTouchPoints.size < 2) return;
    const metrics = touchPairMetrics(atlasTouchPair());
    if (!metrics) return;
    cancelAtlasPointerAction();
    const viewportRect = els.atlasMapViewport.getBoundingClientRect();
    atlasPinch = {
      startDistance: metrics.distance,
      startMidX: metrics.midX,
      startMidY: metrics.midY,
      startTransform: { ...currentTransform },
      viewportCenterX: viewportRect.left + viewportRect.width / 2,
      viewportCenterY: viewportRect.top + viewportRect.height / 2
    };
    atlasSuppressTapUntil = Date.now() + 350;
    event.preventDefault();
    event.stopPropagation();
  }

  function onAtlasTouchPointerMove(event) {
    if (event.pointerType !== "touch" || !atlasTouchPoints.has(event.pointerId)) return;
    atlasTouchPoints.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (!atlasPinch || atlasTouchPoints.size < 2) return;
    const metrics = touchPairMetrics(atlasTouchPair());
    if (!metrics) return;
    const ratio = metrics.distance / atlasPinch.startDistance;
    const nextScale = Math.max(0.5, Math.min(4, atlasPinch.startTransform.scale * ratio));
    const effectiveRatio = nextScale / atlasPinch.startTransform.scale;
    const anchorX = atlasPinch.startMidX - atlasPinch.viewportCenterX - atlasPinch.startTransform.x;
    const anchorY = atlasPinch.startMidY - atlasPinch.viewportCenterY - atlasPinch.startTransform.y;
    currentTransform.scale = nextScale;
    currentTransform.x = atlasPinch.startTransform.x + (metrics.midX - atlasPinch.startMidX) - anchorX * (effectiveRatio - 1);
    currentTransform.y = atlasPinch.startTransform.y + (metrics.midY - atlasPinch.startMidY) - anchorY * (effectiveRatio - 1);
    applyTransform();
    if (els.atlasZoomReset) els.atlasZoomReset.textContent = `${Math.round(currentTransform.scale * 100)}%`;
    atlasSuppressTapUntil = Date.now() + 350;
    event.preventDefault();
    event.stopPropagation();
  }

  function onAtlasTouchPointerEnd(event) {
    if (event.pointerType !== "touch") return;
    const wasPinching = Boolean(atlasPinch);
    atlasTouchPoints.delete(event.pointerId);
    if (atlasTouchPoints.size < 2) atlasPinch = null;
    if (wasPinching) {
      atlasSuppressTapUntil = Date.now() + 350;
      event.preventDefault();
      event.stopPropagation();
    }
  }

  function publicSnapshot() {
    const data = atlas();
    const notebookSalesEntries = state().entries.filter(entry => (entry.type === "creatures" && entry.subtype === "vendor") || (entry.type === "locations" && entry.subtype === "shop")).map(entry => ({
      id: entry.id, name: entry.name, vendorItems: (entry.vendorItems || []).map(item => ({ name: item.name, priceAmount: item.priceAmount, currency: item.currency, description: item.description }))
    }));
    const internalSalesEntries = data.markerSheets.filter(sheet => sheet.category === "merchant").map(sheet => ({
      id: sheet.id, name: sheet.name || "Comerciante", vendorItems: (sheet.vendorItems || []).map(item => ({ name: item.name, priceAmount: item.priceAmount, currency: item.currency, description: item.description }))
    }));
    const salesEntries = [...notebookSalesEntries, ...internalSalesEntries];
    return {
      version: 2, campaignId: state().id, campaignName: state().campaignName, updatedAt: Date.now(),
      projectionSceneId: data.projectionSceneId, playerNavigationMode: data.playerNavigationMode, publicMerchantEntryId: data.publicMerchantEntryId,
      entries: salesEntries,
      scenes: data.scenes.filter(scene => scene.discovered && sceneIsUnlocked(scene)).map(scene => ({
        id: scene.id, name: scene.name, parentSceneId: scene.parentSceneId, imageId: scene.imageId, imageWidth: scene.imageWidth, imageHeight: scene.imageHeight, discovered: scene.discovered, mapWidthUnits: sceneUnitWidth(scene),
        markers: scene.markers.filter(marker => markerIsUnlocked(marker) && marker.visibility !== "dm").map(marker => ({
          id: marker.id, x: marker.x, y: marker.y, name: marker.category === "npc" ? "" : marker.name, alias: marker.alias || "", disposition: marker.disposition || "neutral", category: marker.category, icon: marker.icon, visibility: marker.visibility, targetSceneId: marker.targetSceneId, mapSize: marker.mapSize || 1,
          relatedEntryIds: marker.relatedEntryIds.filter(id => salesEntries.some(entry => entry.id === id))
        })),
        objects: scene.objects.filter(object => object.visibleToPlayers), fogBase: scene.fogBase, fogStrokes: scene.fogStrokes, fogZones: scene.fogZones.map(zone => ({ ...zone }))
      }))
    };
  }

  function publishProjection() {
    const snapshot = publicSnapshot();
    try { localStorage.setItem(`${PROJECTION_KEY_PREFIX}${state().id}`, JSON.stringify(snapshot)); } catch (error) { console.warn("No se pudo preparar la proyección.", error); }
    channel?.postMessage({ type: "snapshot", snapshot });
    if (lanHosting) syncLanProjection(snapshot);
  }

  function loadProjectionSnapshot(campaignId) {
    if (LAN_PLAYER_MODE) {
      playerSnapshot = null; playerSceneId = ""; lanLastSnapshotStamp = 0;
      if (lanPollTimer) clearInterval(lanPollTimer);
      fetchLanProjection();
      lanPollTimer = setInterval(fetchLanProjection, LAN_POLL_MS);
      return;
    }
    try { playerSnapshot = JSON.parse(localStorage.getItem(`${PROJECTION_KEY_PREFIX}${campaignId}`) || "null"); } catch { playerSnapshot = null; }
    playerSceneId = playerSnapshot?.projectionSceneId || "";
    renderPlayer();
  }

  async function renderPlayer() {
    if (currentRole !== "player") return;
    if (!playerSnapshot?.scenes?.length || !playerSnapshot.projectionSceneId) {
      els.playerWaiting.hidden = false; els.playerAtlas.hidden = true; return;
    }
    els.playerWaiting.hidden = true; els.playerAtlas.hidden = false;
    if (playerSnapshot.playerNavigationMode === "follow" || !playerSnapshot.scenes.some(scene => scene.id === playerSceneId && scene.discovered)) playerSceneId = playerSnapshot.projectionSceneId;
    const scene = playerSnapshot.scenes.find(item => item.id === playerSceneId) || playerSnapshot.scenes.find(item => item.id === playerSnapshot.projectionSceneId);
    if (!scene) { els.playerWaiting.hidden = false; els.playerAtlas.hidden = true; return; }
    els.playerModeBadge.textContent = playerSnapshot.playerNavigationMode === "free" ? "Exploración libre" : "Siguiendo al DM";
    renderPlayerBreadcrumbs(scene);
    await renderPlayerMap(scene);
    renderPlayerMerchant();
  }

  function playerSceneById(id) { return playerSnapshot?.scenes?.find(scene => scene.id === id) || null; }
  function playerPath(scene) {
    const result = [], visited = new Set(); let cursor = scene;
    while (cursor && !visited.has(cursor.id)) { result.unshift(cursor); visited.add(cursor.id); cursor = playerSceneById(cursor.parentSceneId); }
    return result;
  }
  function renderPlayerBreadcrumbs(scene) {
    els.playerBreadcrumbs.replaceChildren();
    playerPath(scene).forEach((part, index, path) => {
      const button = document.createElement("button"); button.type = "button"; button.textContent = part.name;
      button.disabled = playerSnapshot.playerNavigationMode !== "free" || part.id === scene.id || !part.discovered;
      button.addEventListener("click", () => { playerSceneId = part.id; renderPlayer(); });
      els.playerBreadcrumbs.append(button); if (index < path.length - 1) els.playerBreadcrumbs.append(document.createTextNode("›"));
    });
  }

  function applyPlayerTransform() {
    if (!els.playerMapStage) return;
    const { x, y, scale, baseWidth, baseHeight } = playerTransform;
    els.playerMapStage.style.width = `${Math.max(1, Math.round(baseWidth))}px`;
    els.playerMapStage.style.height = `${Math.max(1, Math.round(baseHeight))}px`;
    els.playerMapStage.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    if (els.playerZoomReset) els.playerZoomReset.textContent = `${Math.round(scale * 100)}%`;
  }

  function clampPlayerTransform() {
    const viewport = els.playerMapViewport?.getBoundingClientRect();
    if (!viewport?.width || !viewport?.height) return;
    const scaledWidth = playerTransform.baseWidth * playerTransform.scale;
    const scaledHeight = playerTransform.baseHeight * playerTransform.scale;
    playerTransform.x = scaledWidth <= viewport.width ? (viewport.width - scaledWidth) / 2 : clamp(playerTransform.x, viewport.width - scaledWidth, 0);
    playerTransform.y = scaledHeight <= viewport.height ? (viewport.height - scaledHeight) / 2 : clamp(playerTransform.y, viewport.height - scaledHeight, 0);
  }

  function fitPlayerStage(scene, bounds = visibleFogBounds(scene), { force = false } = {}) {
    const viewport = els.playerMapViewport.getBoundingClientRect();
    if (!viewport.width || !viewport.height) return;
    const ratio = Math.max(.1, (scene.imageWidth || 1600) / (scene.imageHeight || 900));
    let width = viewport.width;
    let height = width / ratio;
    if (height > viewport.height) { height = viewport.height; width = height * ratio; }

    const sameScene = playerTransformSceneId === scene.id;
    if (sameScene && !force && playerTransform.baseWidth > 0 && playerTransform.baseHeight > 0) {
      const oldW = playerTransform.baseWidth, oldH = playerTransform.baseHeight;
      if (oldW && oldH && (Math.abs(oldW - width) > 1 || Math.abs(oldH - height) > 1)) {
        const cx = (viewport.width / 2 - playerTransform.x) / (oldW * playerTransform.scale);
        const cy = (viewport.height / 2 - playerTransform.y) / (oldH * playerTransform.scale);
        playerTransform.baseWidth = width; playerTransform.baseHeight = height;
        playerTransform.x = viewport.width / 2 - cx * width * playerTransform.scale;
        playerTransform.y = viewport.height / 2 - cy * height * playerTransform.scale;
        clampPlayerTransform(); applyPlayerTransform();
      }
      return;
    }

    let zoom = 1;
    if (bounds) {
      const targetWidth = Math.max(.035, bounds.width);
      const targetHeight = Math.max(.035, bounds.height);
      zoom = Math.min(viewport.width / (width * targetWidth), viewport.height / (height * targetHeight)) * .88;
      zoom = clamp(zoom, 1, 10);
    }
    const centerX = bounds ? bounds.x + bounds.width / 2 : .5;
    const centerY = bounds ? bounds.y + bounds.height / 2 : .5;
    playerTransform = {
      baseWidth: width, baseHeight: height, scale: zoom,
      x: viewport.width / 2 - centerX * width * zoom,
      y: viewport.height / 2 - centerY * height * zoom
    };
    playerTransformSceneId = scene.id;
    clampPlayerTransform(); applyPlayerTransform();
  }

  function zoomPlayerBy(factor, clientX = null, clientY = null) {
    if (!playerTransform.baseWidth) return;
    const viewport = els.playerMapViewport.getBoundingClientRect();
    const anchorX = clientX == null ? viewport.left + viewport.width / 2 : clientX;
    const anchorY = clientY == null ? viewport.top + viewport.height / 2 : clientY;
    const localX = anchorX - viewport.left;
    const localY = anchorY - viewport.top;
    const oldScale = playerTransform.scale;
    const nextScale = clamp(oldScale * factor, .65, 12);
    const mapX = (localX - playerTransform.x) / oldScale;
    const mapY = (localY - playerTransform.y) / oldScale;
    playerTransform.scale = nextScale;
    playerTransform.x = localX - mapX * nextScale;
    playerTransform.y = localY - mapY * nextScale;
    clampPlayerTransform(); applyPlayerTransform();
  }

  function playerTouchMetrics() {
    const points = [...playerTouchPoints.values()];
    if (points.length < 2) return null;
    const [a, b] = points;
    return { distance: Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)), midX: (a.x + b.x) / 2, midY: (a.y + b.y) / 2 };
  }

  function onPlayerPointerDown(event) {
    if (event.pointerType !== "touch" || event.target.closest(".player-marker")) return;
    playerTouchPoints.set(event.pointerId, { x: event.clientX, y: event.clientY });
    try { els.playerMapViewport.setPointerCapture(event.pointerId); } catch (_) {}
    playerGestureMoved = false;
    if (playerTouchPoints.size >= 2) {
      const metrics = playerTouchMetrics();
      const viewport = els.playerMapViewport.getBoundingClientRect();
      playerGesture = { mode: "pinch", start: metrics, transform: { ...playerTransform }, viewportLeft: viewport.left, viewportTop: viewport.top };
    } else {
      playerGesture = { mode: "pan", pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, transform: { ...playerTransform } };
    }
    event.preventDefault();
  }

  function onPlayerPointerMove(event) {
    if (event.pointerType !== "touch" || !playerTouchPoints.has(event.pointerId)) return;
    playerTouchPoints.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (playerTouchPoints.size >= 2) {
      const metrics = playerTouchMetrics();
      if (!metrics) return;
      if (!playerGesture || playerGesture.mode !== "pinch") {
        const viewport = els.playerMapViewport.getBoundingClientRect();
        playerGesture = { mode: "pinch", start: metrics, transform: { ...playerTransform }, viewportLeft: viewport.left, viewportTop: viewport.top };
      }
      const start = playerGesture.start;
      const base = playerGesture.transform;
      const nextScale = clamp(base.scale * metrics.distance / start.distance, .65, 12);
      const startLocalX = start.midX - playerGesture.viewportLeft;
      const startLocalY = start.midY - playerGesture.viewportTop;
      const nowLocalX = metrics.midX - playerGesture.viewportLeft;
      const nowLocalY = metrics.midY - playerGesture.viewportTop;
      const mapX = (startLocalX - base.x) / base.scale;
      const mapY = (startLocalY - base.y) / base.scale;
      playerTransform.scale = nextScale;
      playerTransform.x = nowLocalX - mapX * nextScale;
      playerTransform.y = nowLocalY - mapY * nextScale;
      playerGestureMoved = true;
    } else if (playerGesture?.mode === "pan" && playerGesture.pointerId === event.pointerId) {
      playerTransform.x = playerGesture.transform.x + (event.clientX - playerGesture.startX);
      playerTransform.y = playerGesture.transform.y + (event.clientY - playerGesture.startY);
      if (Math.hypot(event.clientX - playerGesture.startX, event.clientY - playerGesture.startY) > 4) playerGestureMoved = true;
    }
    clampPlayerTransform(); applyPlayerTransform();
    event.preventDefault();
  }

  function onPlayerPointerEnd(event) {
    if (event.pointerType !== "touch" || !playerTouchPoints.has(event.pointerId)) return;
    playerTouchPoints.delete(event.pointerId);
    try { if (els.playerMapViewport.hasPointerCapture(event.pointerId)) els.playerMapViewport.releasePointerCapture(event.pointerId); } catch (_) {}
    if (!playerTouchPoints.size) playerGesture = null;
    else if (playerTouchPoints.size === 1) {
      const [id, point] = [...playerTouchPoints.entries()][0];
      playerGesture = { mode: "pan", pointerId: id, startX: point.x, startY: point.y, transform: { ...playerTransform } };
    }
    event.preventDefault();
  }


  async function renderPlayerMap(scene) {
    els.playerMapStage.replaceChildren();
    els.playerMapStage.style.aspectRatio = `${scene.imageWidth || 16}/${scene.imageHeight || 9}`;
    fitPlayerStage(scene);
    const url = await imageUrl(scene.imageId);
    if (!url) { els.playerMapStage.innerHTML = '<div class="player-no-map">Esta escena todavía no tiene mapa.</div>'; return; }
    const image = document.createElement("img"); image.src = url; image.alt = scene.name; image.draggable = false;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.setAttribute("viewBox", "0 0 1000 1000"); svg.classList.add("player-object-layer");
    const defs = document.createElementNS(svg.namespaceURI, "defs");
    defs.innerHTML = '<marker id="playerArrowHead" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" /></marker>';
    svg.append(defs);
    scene.objects.forEach(object => {
      let node;
      if (object.kind === "text") { node = document.createElementNS(svg.namespaceURI, "text"); node.setAttribute("x", object.x1 * 1000); node.setAttribute("y", object.y1 * 1000); node.textContent = object.text; }
      else if (object.kind === "line" || object.kind === "arrow") { node = document.createElementNS(svg.namespaceURI, "line"); node.setAttribute("x1", object.x1 * 1000); node.setAttribute("y1", object.y1 * 1000); node.setAttribute("x2", object.x2 * 1000); node.setAttribute("y2", object.y2 * 1000); if (object.kind === "arrow") node.setAttribute("marker-end", "url(#playerArrowHead)"); }
      else if (object.kind === "rect") { node = document.createElementNS(svg.namespaceURI, "rect"); node.setAttribute("x", Math.min(object.x1, object.x2) * 1000); node.setAttribute("y", Math.min(object.y1, object.y2) * 1000); node.setAttribute("width", Math.abs(object.x2 - object.x1) * 1000); node.setAttribute("height", Math.abs(object.y2 - object.y1) * 1000); }
      else { node = document.createElementNS(svg.namespaceURI, "ellipse"); node.setAttribute("cx", ((object.x1 + object.x2) / 2) * 1000); node.setAttribute("cy", ((object.y1 + object.y2) / 2) * 1000); node.setAttribute("rx", Math.abs(object.x2 - object.x1) * 500); node.setAttribute("ry", Math.abs(object.y2 - object.y1) * 500); }
      svg.append(node);
    });
    const markers = document.createElement("div"); markers.className = "player-marker-layer";
    scene.markers.forEach(marker => {
      const meta = categoryMeta(marker.category, marker.icon);
      const visual = markerVisual(marker);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `player-marker player-marker--${marker.visibility} marker-tone--${visual.tone}${visual.npc ? " player-marker--npc" : ""}`;
      button.style.left = `${marker.x * 100}%`;
      button.style.top = `${marker.y * 100}%`;
      const unitWidth = Math.max(1, Number(scene.mapWidthUnits) || 40);
      const mapSize = Math.max(.25, Math.min(8, Number(marker.mapSize) || 1));
      button.style.setProperty("--marker-map-size", `${Math.max(.15, Math.min(35, mapSize / unitWidth * 100))}%`);
      const label = markerPlayerLabel(marker);
      const iconHtml = visual.npc ? '<span class="player-marker__dot" aria-hidden="true"></span>' : `<span class="player-marker__icon">${app.escapeHtml(meta.icon)}</span>`;
      button.innerHTML = `${iconHtml}${label ? `<small>${app.escapeHtml(label)}</small>` : ""}`;
      button.setAttribute("aria-label", label || meta.label);
      const target = playerSceneById(marker.targetSceneId);
      const navigable = playerSnapshot.playerNavigationMode === "free" && marker.visibility === "discovered" && target?.discovered;
      button.disabled = !navigable;
      if (navigable) button.addEventListener("click", () => { playerSceneId = target.id; playerTransformSceneId = ""; renderPlayer(); });
      markers.append(button);
    });
    const fog = document.createElement("canvas"); fog.className = "player-fog-canvas";
    els.playerMapStage.append(image, svg, markers, fog);
    requestAnimationFrame(() => { fog.width = Math.max(1, Math.round(els.playerMapStage.offsetWidth)); fog.height = Math.max(1, Math.round(els.playerMapStage.offsetHeight)); renderFog(scene, fog, false); });
  }

  function renderPlayerMerchant() {
    const id = playerSnapshot.publicMerchantEntryId;
    const entry = playerSnapshot.entries.find(item => item.id === id);
    if (!entry) { els.playerMerchantPanel.hidden = true; return; }
    els.playerMerchantPanel.hidden = false;
    els.playerMerchantPanel.innerHTML = `<h2>${app.escapeHtml(entry.name)}</h2><div class="player-shop-table"><div class="player-shop-row player-shop-row--head"><span>Artículo</span><span>Precio</span><span>Descripción</span></div>${entry.vendorItems.map(item => `<div class="player-shop-row"><strong>${app.escapeHtml(item.name)}</strong><span>${Number(item.priceAmount) || 0} ${app.escapeHtml(item.currency || "gp")}</span><span>${app.escapeHtml(item.description || "")}</span></div>`).join("") || '<p>No hay artículos disponibles.</p>'}</div>`;
  }

  function openProjection() {
    publishProjection();
    const url = `${location.href.split("?")[0]}?projection=1&campaign=${encodeURIComponent(state().id)}`;
    window.open(url, `forja-projection-${state().id}`, "popup=yes,width=1280,height=800");
  }

  function showCurrentSceneToPlayers() {
    const scene = currentScene();
    scene.discovered = true;
    atlas().projectionSceneId = scene.id;
    save({ publish: true, render: true });
  }

  async function downloadBlob(blob, filename) {
    if (typeof app.saveBlob === "function") return app.saveBlob(blob, filename, blob.type);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { native: false, cancelled: false };
  }

  function setBackupStatus(message, tone = "") {
    if (!els.drawerBackupStatus) return;
    els.drawerBackupStatus.textContent = message || "";
    els.drawerBackupStatus.dataset.tone = tone || "";
    els.drawerBackupStatus.hidden = !message;
  }

  async function exportJson() {
    app.saveState(true);
    setBackupStatus("Preparando JSON…");
    try {
      const blob = new Blob([JSON.stringify(profile(), null, 2)], { type: "application/json" });
      const native = Boolean(window.Capacitor?.isNativePlatform?.());
      if (native) setBackupStatus("JSON listo. Elige dónde guardarlo en Android…");
      const result = await downloadBlob(blob, "perfil-la-forja-del-narrador.json");
      setBackupStatus(result?.cancelled ? "Guardado cancelado." : (result?.native ? "✓ JSON guardado correctamente." : "✓ Descarga iniciada."), result?.cancelled ? "warn" : "ok");
    } catch (error) {
      console.error(error);
      setBackupStatus("No se pudo guardar el JSON.", "error");
      alert(`No se pudo guardar el JSON: ${error.message}`);
    }
  }

  const crcTable = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n += 1) { let c = n; for (let k = 0; k < 8; k += 1) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1; table[n] = c >>> 0; }
    return table;
  })();
  function crc32(bytes) { let c = 0xffffffff; for (const byte of bytes) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
  function u16(view, offset, value) { view.setUint16(offset, value, true); }
  function u32(view, offset, value) { view.setUint32(offset, value >>> 0, true); }

  async function createZip(files) {
    const encoder = new TextEncoder(); const parts = []; const central = []; let offset = 0;
    for (const file of files) {
      const name = encoder.encode(file.name); const data = file.data instanceof Uint8Array ? file.data : new Uint8Array(await file.data.arrayBuffer()); const crc = crc32(data);
      const local = new Uint8Array(30 + name.length); const lv = new DataView(local.buffer);
      u32(lv, 0, 0x04034b50); u16(lv, 4, 20); u16(lv, 6, 0x0800); u16(lv, 8, 0); u16(lv, 10, 0); u16(lv, 12, 0); u32(lv, 14, crc); u32(lv, 18, data.length); u32(lv, 22, data.length); u16(lv, 26, name.length); u16(lv, 28, 0); local.set(name, 30);
      parts.push(local, data);
      const header = new Uint8Array(46 + name.length); const hv = new DataView(header.buffer);
      u32(hv, 0, 0x02014b50); u16(hv, 4, 20); u16(hv, 6, 20); u16(hv, 8, 0x0800); u16(hv, 10, 0); u16(hv, 12, 0); u16(hv, 14, 0); u32(hv, 16, crc); u32(hv, 20, data.length); u32(hv, 24, data.length); u16(hv, 28, name.length); u16(hv, 30, 0); u16(hv, 32, 0); u16(hv, 34, 0); u16(hv, 36, 0); u32(hv, 38, 0); u32(hv, 42, offset); header.set(name, 46); central.push(header);
      offset += local.length + data.length;
    }
    const centralSize = central.reduce((sum, item) => sum + item.length, 0); const end = new Uint8Array(22); const ev = new DataView(end.buffer);
    u32(ev, 0, 0x06054b50); u16(ev, 4, 0); u16(ev, 6, 0); u16(ev, 8, files.length); u16(ev, 10, files.length); u32(ev, 12, centralSize); u32(ev, 16, offset); u16(ev, 20, 0);
    return new Blob([...parts, ...central, end], { type: "application/zip" });
  }

  async function createFullBackupBlob() {
    const ids = new Set(profile().campaigns.flatMap(campaign => [
      ...(campaign.atlas?.scenes?.map(scene => scene.imageId).filter(Boolean) || []),
      ...(campaign.atlas?.markerSheets?.map(sheet => sheet.imageId).filter(Boolean) || [])
    ]));
    const records = (await getAllImages()).filter(record => ids.has(record.id));
    const index = records.map(record => ({ id: record.id, name: record.name, type: record.type, path: `media/${record.id}` }));
    const files = [
      { name: "profile.json", data: new TextEncoder().encode(JSON.stringify(profile(), null, 2)) },
      { name: "media-index.json", data: new TextEncoder().encode(JSON.stringify(index, null, 2)) },
      ...records.map(record => ({ name: `media/${record.id}`, data: record.blob }))
    ];
    return { blob: await createZip(files), imageCount: records.length };
  }

  function openFolderConfigDb() {
    if (folderDbPromise) return folderDbPromise;
    folderDbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(FOLDER_DB, 1);
      request.onupgradeneeded = () => { const db = request.result; if (!db.objectStoreNames.contains(FOLDER_STORE)) db.createObjectStore(FOLDER_STORE); };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("No se pudo abrir el guardado de carpeta."));
    });
    return folderDbPromise;
  }

  async function loadSavedFolderHandle() {
    if (!window.indexedDB) return null;
    try {
      const db = await openFolderConfigDb();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(FOLDER_STORE, "readonly");
        const request = tx.objectStore(FOLDER_STORE).get(FOLDER_KEY);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch { return null; }
  }

  async function storeFolderHandle(handle) {
    if (!window.indexedDB) return;
    const db = await openFolderConfigDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(FOLDER_STORE, "readwrite");
      if (handle) tx.objectStore(FOLDER_STORE).put(handle, FOLDER_KEY); else tx.objectStore(FOLDER_STORE).delete(FOLDER_KEY);
      tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
    });
  }

  async function folderHandlePermission(handle, request = false) {
    if (!handle) return false;
    const options = { mode: "readwrite" };
    if (typeof handle.queryPermission === "function") {
      const status = await handle.queryPermission(options);
      if (status === "granted") return true;
    }
    if (request && typeof handle.requestPermission === "function") return (await handle.requestPermission(options)) === "granted";
    return false;
  }

  async function nativeFolderStatus() {
    const plugin = getLanHostPlugin();
    if (!plugin?.getSyncFolder) return { configured: false, supported: false };
    try { const result = await plugin.getSyncFolder(); return { supported: true, configured: Boolean(result?.configured), label: result?.label || "Carpeta Android" }; }
    catch { return { configured: false, supported: true }; }
  }

  function setFolderSyncUi({ configured = false, supported = true, label = "", status = "", error = false } = {}) {
    if (!els.folderSyncSection) return;
    els.folderSyncSection.classList.toggle("is-running", configured && !error);
    els.folderSyncSection.classList.toggle("is-error", error);
    if (!supported) {
      els.folderSyncStatus.textContent = "Carpetas automáticas no disponibles";
      els.folderSyncHint.textContent = "Usa Chrome/Edge en HTTPS o la APK Android. El ZIP manual sigue funcionando.";
    } else if (error) {
      els.folderSyncStatus.textContent = "Problema con la carpeta";
      els.folderSyncHint.textContent = status || "Vuelve a seleccionar la carpeta.";
    } else if (configured) {
      els.folderSyncStatus.textContent = status || "Autoguardado local activo";
      els.folderSyncHint.textContent = "La Forja mantiene una copia completa llamada la-forja-autoguardado.zip.";
    } else {
      els.folderSyncStatus.textContent = "Sin carpeta configurada";
      els.folderSyncHint.textContent = "Elige una carpeta y La Forja guardará allí una copia completa automáticamente.";
    }
    if (els.folderSyncPath) { els.folderSyncPath.hidden = !configured || !label; els.folderSyncPath.textContent = label || ""; }
    if (els.folderSyncChoose) { els.folderSyncChoose.hidden = configured; els.folderSyncChoose.disabled = !supported; }
    if (els.folderSyncNow) els.folderSyncNow.hidden = !configured;
    if (els.folderSyncRestore) els.folderSyncRestore.hidden = !configured;
    if (els.folderSyncDisconnect) els.folderSyncDisconnect.hidden = !configured;
  }

  async function refreshFolderSyncState() {
    if (!els.folderSyncSection || LAN_PLAYER_MODE) return;
    if (window.Capacitor?.isNativePlatform?.()) {
      const info = await nativeFolderStatus();
      setFolderSyncUi({ configured: info.configured, supported: info.supported, label: info.label });
      return;
    }
    const supported = typeof window.showDirectoryPicker === "function" && window.isSecureContext;
    if (!supported) { setFolderSyncUi({ supported: false }); return; }
    if (!folderHandle) folderHandle = await loadSavedFolderHandle();
    const granted = folderHandle ? await folderHandlePermission(folderHandle, false) : false;
    setFolderSyncUi({ configured: Boolean(folderHandle), supported: true, label: folderHandle?.name || "", status: granted ? "Autoguardado local activo" : (folderHandle ? "Carpeta recordada · permiso pendiente" : "") });
  }

  async function chooseFolderSync() {
    try {
      if (window.Capacitor?.isNativePlatform?.()) {
        const plugin = getLanHostPlugin();
        if (!plugin?.chooseSyncFolder) throw new Error("Actualiza LanHostPlugin.java con el incluido en esta versión.");
        const result = await plugin.chooseSyncFolder();
        if (result?.cancelled) return;
        setFolderSyncUi({ configured: true, supported: true, label: result?.label || "Carpeta Android", status: "Carpeta vinculada" });
      } else {
        if (typeof window.showDirectoryPicker !== "function") throw new Error("Este navegador no permite elegir una carpeta. Usa Chrome o Edge con la web en HTTPS.");
        folderHandle = await window.showDirectoryPicker({ id: "forja-del-narrador", mode: "readwrite" });
        if (!await folderHandlePermission(folderHandle, true)) throw new Error("No se concedió permiso de escritura.");
        await storeFolderHandle(folderHandle);
        setFolderSyncUi({ configured: true, supported: true, label: folderHandle.name, status: "Carpeta vinculada" });
      }
      await syncFolderBackup({ silent: false });
    } catch (error) {
      if (error?.name === "AbortError") return;
      console.error(error); setFolderSyncUi({ supported: true, error: true, status: error.message });
    }
  }

  async function writeBlobToNativeFolder(blob, filename) {
    const plugin = getLanHostPlugin();
    if (!plugin?.beginFolderFileSave || !plugin?.appendFolderFileChunk || !plugin?.finishFolderFileSave) throw new Error("El complemento Android de carpeta no está actualizado.");
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const chunkSize = 192 * 1024;
    await plugin.beginFolderFileSave({ filename, mime: blob.type || "application/octet-stream", totalBytes: bytes.length });
    try {
      for (let offset = 0; offset < bytes.length; offset += chunkSize) {
        const chunk = bytes.subarray(offset, Math.min(bytes.length, offset + chunkSize));
        let binary = ""; for (let i = 0; i < chunk.length; i += 0x8000) binary += String.fromCharCode(...chunk.subarray(i, i + 0x8000));
        await plugin.appendFolderFileChunk({ base64: btoa(binary) });
      }
      return await plugin.finishFolderFileSave();
    } catch (error) { try { await plugin.abortFolderFileSave?.(); } catch (_) {} throw error; }
  }

  async function writeBlobToWebFolder(blob, filename) {
    if (!folderHandle) folderHandle = await loadSavedFolderHandle();
    if (!folderHandle) throw new Error("No hay carpeta vinculada.");
    if (!await folderHandlePermission(folderHandle, false)) throw new Error("La carpeta necesita permiso de escritura. Pulsa «Sincronizar ahora» para concederlo.");
    const fileHandle = await folderHandle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob); await writable.close();
    return { bytes: blob.size };
  }

  async function syncFolderBackup({ silent = true } = {}) {
    if (folderSyncBusy || currentRole === "player" || LAN_PLAYER_MODE) return false;
    let configured = false;
    if (window.Capacitor?.isNativePlatform?.()) configured = (await nativeFolderStatus()).configured;
    else {
      if (!folderHandle) folderHandle = await loadSavedFolderHandle();
      configured = Boolean(folderHandle);
      if (configured && !await folderHandlePermission(folderHandle, false)) {
        if (silent) { setFolderSyncUi({ configured: true, supported: true, label: folderHandle.name || "", status: "Carpeta recordada · pulsa Sincronizar ahora para reautorizar" }); return false; }
        if (!await folderHandlePermission(folderHandle, true)) throw new Error("No se concedió permiso para escribir en la carpeta.");
      }
    }
    if (!configured) return false;
    folderSyncBusy = true;
    if (!silent) setFolderSyncUi({ configured: true, supported: true, label: window.Capacitor?.isNativePlatform?.() ? (await nativeFolderStatus()).label : folderHandle?.name, status: "Preparando copia completa…" });
    try {
      const { blob } = await createFullBackupBlob();
      if (window.Capacitor?.isNativePlatform?.()) await writeBlobToNativeFolder(blob, FOLDER_BACKUP_NAME);
      else await writeBlobToWebFolder(blob, FOLDER_BACKUP_NAME);
      const stamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const label = window.Capacitor?.isNativePlatform?.() ? (await nativeFolderStatus()).label : folderHandle?.name;
      setFolderSyncUi({ configured: true, supported: true, label, status: `✓ Guardado automáticamente · ${stamp}` });
      return true;
    } catch (error) {
      console.error("Autoguardado en carpeta:", error);
      setFolderSyncUi({ configured: true, supported: true, label: folderHandle?.name || "", error: true, status: error.message || "No se pudo actualizar la copia." });
      if (!silent) alert(`No se pudo sincronizar la carpeta: ${error.message}`);
      return false;
    } finally { folderSyncBusy = false; }
  }

  function scheduleFolderSync() {
    clearTimeout(folderSyncTimer);
    folderSyncTimer = setTimeout(() => syncFolderBackup({ silent: true }), 3500);
  }

  async function readNativeFolderBackup() {
    const plugin = getLanHostPlugin();
    if (!plugin?.beginFolderFileRead || !plugin?.readFolderFileChunk || !plugin?.finishFolderFileRead) throw new Error("El complemento Android de carpeta no está actualizado.");
    const start = await plugin.beginFolderFileRead({ filename: FOLDER_BACKUP_NAME });
    const chunks = []; let total = 0;
    try {
      while (true) {
        const result = await plugin.readFolderFileChunk({ maxBytes: 192 * 1024 });
        const raw = atob(result?.base64 || "");
        const bytes = new Uint8Array(raw.length); for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
        if (bytes.length) { chunks.push(bytes); total += bytes.length; }
        if (result?.done) break;
      }
      await plugin.finishFolderFileRead();
    } catch (error) { try { await plugin.finishFolderFileRead?.(); } catch (_) {} throw error; }
    const merged = new Uint8Array(total); let offset = 0; chunks.forEach(chunk => { merged.set(chunk, offset); offset += chunk.length; });
    return new File([merged], FOLDER_BACKUP_NAME, { type: "application/zip" });
  }

  async function restoreFromFolder() {
    try {
      let file;
      if (window.Capacitor?.isNativePlatform?.()) file = await readNativeFolderBackup();
      else {
        if (!folderHandle) folderHandle = await loadSavedFolderHandle();
        if (!folderHandle || !await folderHandlePermission(folderHandle, true)) throw new Error("No se pudo acceder a la carpeta.");
        const handle = await folderHandle.getFileHandle(FOLDER_BACKUP_NAME);
        file = await handle.getFile();
      }
      await importBackup(file);
    } catch (error) { console.error(error); alert(`No se pudo restaurar la copia automática: ${error.message}`); }
  }

  async function disconnectFolderSync() {
    if (!confirm("¿Desvincular la carpeta de La Forja? Los archivos existentes no se borrarán.")) return;
    try {
      if (window.Capacitor?.isNativePlatform?.()) await getLanHostPlugin()?.clearSyncFolder?.();
      else { folderHandle = null; await storeFolderHandle(null); }
    } catch (error) { console.warn(error); }
    setFolderSyncUi({ configured: false, supported: true });
  }

  async function exportZip() {
    app.saveState(true);
    els.drawerExportZip.disabled = true; els.drawerExportZip.textContent = "Preparando…";
    setBackupStatus("Preparando copia completa…");
    try {
      const { blob, imageCount } = await createFullBackupBlob();
      setBackupStatus(`ZIP creado${imageCount ? ` con ${imageCount} imagen${imageCount === 1 ? "" : "es"}` : ""}.`);
      if (window.Capacitor?.isNativePlatform?.()) {
        els.drawerExportZip.textContent = "Guardar…";
        setBackupStatus("ZIP creado. Elige una carpeta y pulsa Guardar en Android.");
      } else setBackupStatus("ZIP creado. Iniciando descarga…");
      const result = await downloadBlob(blob, "la-forja-del-narrador-completo.zip");
      if (result?.cancelled) setBackupStatus("Guardado cancelado. No se ha perdido ningún dato.", "warn");
      else if (result?.native) setBackupStatus("✓ Copia ZIP guardada correctamente.", "ok");
      else setBackupStatus("✓ Descarga del ZIP iniciada.", "ok");
    } catch (error) {
      console.error(error); setBackupStatus("No se pudo crear o guardar el ZIP.", "error"); alert(`No se pudo crear el ZIP: ${error.message}`);
    } finally { els.drawerExportZip.disabled = false; els.drawerExportZip.textContent = "⇩ Exportar ZIP completo"; }
  }

  async function parseStoredZip(file) {
    const bytes = new Uint8Array(await file.arrayBuffer()); const view = new DataView(bytes.buffer); const decoder = new TextDecoder(); const files = new Map(); let offset = 0;
    while (offset + 30 <= bytes.length && view.getUint32(offset, true) === 0x04034b50) {
      const method = view.getUint16(offset + 8, true); const size = view.getUint32(offset + 18, true); const nameLen = view.getUint16(offset + 26, true); const extraLen = view.getUint16(offset + 28, true);
      if (method !== 0) throw new Error("Este ZIP usa compresión no compatible. Importa un ZIP creado por La Forja.");
      const nameStart = offset + 30; const dataStart = nameStart + nameLen + extraLen; const name = decoder.decode(bytes.slice(nameStart, nameStart + nameLen)); files.set(name, bytes.slice(dataStart, dataStart + size)); offset = dataStart + size;
    }
    return files;
  }

  async function importBackup(file) {
    if (!file) return;
    try {
      const lowerName = String(file.name || "").toLowerCase();
      const zipTypes = new Set(["application/zip", "application/x-zip-compressed", "application/octet-stream"]);
      const isZip = lowerName.endsWith(".zip") || zipTypes.has(String(file.type || "").toLowerCase());
      const isJson = lowerName.endsWith(".json") || String(file.type || "").toLowerCase() === "application/json";
      if (!isZip && !isJson) throw new Error("Selecciona una copia de seguridad .zip o .json creada por La Forja.");
      if (isZip) {
        const files = await parseStoredZip(file);
        const profileBytes = files.get("profile.json"); if (!profileBytes) throw new Error("El ZIP no contiene profile.json.");
        const importedProfile = JSON.parse(new TextDecoder().decode(profileBytes));
        const index = JSON.parse(new TextDecoder().decode(files.get("media-index.json") || new Uint8Array([91, 93])));
        if (!confirm("La importación reemplazará el perfil local y restaurará sus imágenes. ¿Continuar?")) return;
        for (const item of index) {
          const data = files.get(item.path); if (!data) continue;
          await putImage({ id: item.id, blob: new Blob([data], { type: item.type || "application/octet-stream" }), name: item.name || item.id, type: item.type || "", createdAt: app.now() });
        }
        app.replaceProfile(importedProfile);
      } else {
        const importedProfile = JSON.parse(await file.text());
        if (!confirm("La importación reemplazará el perfil local. Las imágenes no incluidas en el JSON no se restaurarán. ¿Continuar?")) return;
        app.replaceProfile(importedProfile);
      }
      closeDrawer(); renderRoleCampaigns(); renderAtlas(); alert("Copia importada correctamente.");
    } catch (error) { alert(`No se pudo importar: ${error.message}`); }
    finally { els.drawerImportFile.value = ""; }
  }

  function bind() {
    els.roleCampaignSelect.addEventListener("change", () => { app.activateCampaign(els.roleCampaignSelect.value); renderRoleCampaigns(); });
    els.chooseDmRole.addEventListener("click", showDmAuth);
    els.choosePlayerRole.addEventListener("click", () => enterPlayer());
    els.backToRoles.addEventListener("click", showRoleChoice);
    els.dmAuthForm.addEventListener("submit", submitDmAuth);
    els.leavePlayerMode.addEventListener("click", leavePlayer);

    els.settingsBtn.addEventListener("click", openDrawer); els.closeSettingsDrawer.addEventListener("click", closeDrawer); els.drawerBackdrop.addEventListener("click", closeDrawer);
    els.drawerExportJson.addEventListener("click", exportJson); els.drawerExportZip.addEventListener("click", exportZip); els.drawerImport.addEventListener("click", () => els.drawerImportFile.click()); els.drawerImportFile.addEventListener("change", () => importBackup(els.drawerImportFile.files?.[0]));
    els.lanHostStart?.addEventListener("click", startLanHost);
    els.lanHostStop?.addEventListener("click", stopLanHost);
    els.lanHostCopy?.addEventListener("click", copyLanHostAddress);
    els.changePasswordForm.addEventListener("submit", changePassword);
    els.logoutDm.addEventListener("click", () => { forgetDevice(); closeDrawer(); showRoleChoice(); });

    els.atlasBackBtn.addEventListener("click", () => currentScene()?.parentSceneId && setScene(currentScene().parentSceneId));
    els.atlasNewScene.addEventListener("click", () => openSceneDialog()); els.atlasSceneMenu.addEventListener("click", () => openSceneDialog(currentScene()?.id));
    els.atlasUploadImage.addEventListener("click", () => els.atlasImageInput.click()); els.atlasEmptyUpload.addEventListener("click", () => els.atlasImageInput.click());
    els.atlasEditDungeon?.addEventListener("click", () => window.ForjaDungeon?.open?.(currentScene()?.id));
    els.atlasEmptyCreateMap?.addEventListener("click", () => window.ForjaDungeon?.open?.(currentScene()?.id));
    els.atlasSceneEditDungeon?.addEventListener("click", () => { const id = editingSceneId; els.atlasSceneDialog.close(); window.ForjaDungeon?.open?.(id); });
    els.atlasImageInput.addEventListener("change", async () => { try { await uploadImage(els.atlasImageInput.files?.[0]); } catch (error) { alert(error.message); } finally { els.atlasImageInput.value = ""; } });
    els.atlasShowScene.addEventListener("click", showCurrentSceneToPlayers); els.atlasOpenProjection.addEventListener("click", openProjection);
    els.atlasDmSheetBtn?.addEventListener("click", () => dmSheetOpen ? closeDmSheet() : openDmSheet());
    els.atlasDmSheetClose?.addEventListener("click", closeDmSheet);
    els.atlasDmNpcDisposition?.addEventListener("change", () => {
      const marker = markerById(activeDmNpcMarkerId);
      if (!marker || marker.category !== "npc") return;
      marker.disposition = ["enemy", "ally", "neutral"].includes(els.atlasDmNpcDisposition.value) ? els.atlasDmNpcDisposition.value : "neutral";
      save({ render: true, immediate: true });
    });
    els.atlasDmSheetResize?.addEventListener("pointerdown", startDmSheetResize);
    els.atlasDmSheetResize?.addEventListener("pointermove", moveDmSheetResize);
    els.atlasDmSheetResize?.addEventListener("pointerup", stopDmSheetResize);
    els.atlasDmSheetResize?.addEventListener("pointercancel", stopDmSheetResize);
    els.atlasDmRelatedSelect?.addEventListener("change", () => {
      const scene = currentScene();
      if (!scene || !entryById(els.atlasDmRelatedSelect.value)) return;
      scene.dmEntryId = els.atlasDmRelatedSelect.value;
      app.selectEntryForPanel?.(scene.dmEntryId);
      save({ render: false });
      updateDmEntrySummary(scene);
      renderDmEntryTree();
    });
    els.atlasPlayerMode.addEventListener("change", () => { atlas().playerNavigationMode = els.atlasPlayerMode.value; save({ publish: true }); });
    els.atlasCloseMerchant.addEventListener("click", () => { atlas().publicMerchantEntryId = ""; save({ publish: true, render: true }); });
    els.atlasBrushSize.addEventListener("input", () => { els.atlasBrushValue.textContent = `${els.atlasBrushSize.value}%`; });
    els.atlasResetFog.addEventListener("click", resetCurrentSceneFog);
    els.atlasRevealAllFog.addEventListener("click", revealCurrentSceneFog);
    els.atlasTools.addEventListener("click", event => { const button = event.target.closest("[data-atlas-tool]"); if (button) selectTool(button.dataset.atlasTool); });
    els.atlasCustomCategory.addEventListener("click", () => els.atlasCategoryDialog.showModal());

    els.atlasMapStage.addEventListener("pointerdown", startStageAction); els.atlasMapStage.addEventListener("pointermove", moveStageAction); els.atlasMapStage.addEventListener("pointerup", stopStageAction); els.atlasMapStage.addEventListener("pointercancel", stopStageAction);
    els.atlasMapViewport.addEventListener("wheel", zoomAtlas, { passive: false });
    els.atlasMapViewport.addEventListener("pointerdown", onAtlasTouchPointerDown, { capture: true });
    els.atlasMapViewport.addEventListener("pointermove", onAtlasTouchPointerMove, { capture: true });
    els.atlasMapViewport.addEventListener("pointerup", onAtlasTouchPointerEnd, { capture: true });
    els.atlasMapViewport.addEventListener("pointercancel", onAtlasTouchPointerEnd, { capture: true });
    els.atlasZoomOut?.addEventListener("click", () => zoomAtlasBy(1 / 1.2));
    els.atlasZoomIn?.addEventListener("click", () => zoomAtlasBy(1.2));
    els.atlasZoomReset?.addEventListener("click", () => setAtlasZoom(1, { resetPosition: true }));
    els.atlasMapViewport.addEventListener("dblclick", event => { if (!event.target.closest(".atlas-marker,.atlas-fog-zone")) setAtlasZoom(1, { resetPosition: true }); });

    els.atlasSceneForm.addEventListener("submit", saveSceneDialog); els.atlasDeleteScene.addEventListener("click", deleteScene);
    els.atlasNotebookCreateForm?.addEventListener("submit", saveNotebookCreateDialog);
    els.atlasNotebookCreateType?.addEventListener("change", () => { if (pendingNotebookLink) pendingNotebookLink.suggestedSubtype = ""; renderNotebookCreateSubtype(); });
    $$(".atlas-notebook-create-close,.atlas-notebook-create-cancel").forEach(button => button.addEventListener("click", closeNotebookCreateDialog));
    $$(".atlas-scene-dialog-close,.atlas-scene-dialog-cancel").forEach(button => button.addEventListener("click", () => els.atlasSceneDialog.close()));
    els.atlasMarkerForm.addEventListener("submit", saveMarkerDialog); els.atlasDeleteMarker.addEventListener("click", deleteMarker);
    els.atlasMerchantItemAdd?.addEventListener("click", addInternalMerchantItem);
    els.atlasMarkerCategory?.addEventListener("change", () => { pendingOrphanSheetId = ""; updateMarkerDialogFields(); renderMarkerSheetMode(); });
    els.atlasMarkerSize?.addEventListener("input", updateMarkerDialogFields);
    $$('input[name="atlasMarkerSheetMode"]', els.atlasMarkerForm).forEach(radio => radio.addEventListener("change", () => renderMarkerSheetMode()));
    els.atlasMarkerOpenSheet?.addEventListener("click", () => { const marker = markerDialogScene()?.markers.find(item => item.id === editingMarkerId); if (marker) openMarkerSheet(marker); });
    $$(".atlas-marker-dialog-close,.atlas-marker-dialog-cancel").forEach(button => button.addEventListener("click", () => els.atlasMarkerDialog.close()));

    els.atlasInternalSheetForm?.addEventListener("submit", saveInternalSheetDialog);
    els.atlasInternalSheetEditToggle?.addEventListener("click", toggleInternalSheetEdit);
    els.atlasDmSheetEdit?.addEventListener("click", toggleInternalSheetEdit);
    $$('[data-sheet-stat]', els.atlasCreatureSheetSection).forEach(input => input.addEventListener("input", () => {
      if (["str", "dex", "con", "int", "wis", "cha"].includes(input.dataset.sheetStat)) syncInternalCreatureModifiers();
    }));
    $$(".atlas-internal-sheet-close,.atlas-internal-sheet-cancel").forEach(button => button.addEventListener("click", () => { if (dmSheetMode === "internal") closeDmSheet(); else { els.atlasInternalSheetDialog.close(); editingInternalSheetId = ""; internalSheetDraft = null; } }));
    els.atlasSheetPhotoChoose?.addEventListener("click", () => els.atlasSheetPhotoInput?.click());
    els.atlasSheetPhotoInput?.addEventListener("change", async () => {
      const file = els.atlasSheetPhotoInput.files?.[0]; if (!file || !internalSheetDraft) return;
      if (!/^image\/(png|jpeg|webp)$/i.test(file.type) && !/\.(png|jpe?g|webp)$/i.test(file.name || "")) { alert("Selecciona una imagen PNG, JPG o WebP."); els.atlasSheetPhotoInput.value = ""; return; }
      try { const id = app.uid(); await putImage({ id, blob: file, name: file.name || "Retrato", type: file.type || "image/png", createdAt: app.now() }); internalSheetDraft.imageId = id; await renderInternalSheetPhoto(); }
      catch (error) { alert(`No se pudo guardar la imagen: ${error.message}`); }
      finally { els.atlasSheetPhotoInput.value = ""; }
    });
    els.atlasSheetPhotoRemove?.addEventListener("click", () => { if (!internalSheetDraft) return; internalSheetDraft.imageId = ""; renderInternalSheetPhoto(); });
    els.atlasMissionStageAdd?.addEventListener("click", () => {
      if (!internalSheetDraft || internalSheetDraft.kind !== "mission") return;
      const value = els.atlasMissionStageInput.value.trim(); if (!value) return;
      internalSheetDraft.mission.stages.push({ id: app.uid(), text: value.slice(0, 500), done: false }); els.atlasMissionStageInput.value = ""; renderMissionStages(); els.atlasMissionStageInput.focus();
    });
    els.atlasMissionStageInput?.addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); els.atlasMissionStageAdd?.click(); } });
    els.atlasLootCheckType?.addEventListener("change", () => { const noCheck = !els.atlasLootCheckType.value; els.atlasLootCheckDc.disabled = noCheck; if (noCheck) els.atlasLootCheckDc.value = ""; });
    els.atlasLootAdd?.addEventListener("click", () => {
      if (!internalSheetDraft || !["creature", "container"].includes(internalSheetDraft.kind)) return;
      const name = els.atlasLootName.value.trim(); if (!name) { els.atlasLootName.focus(); return; }
      const checkType = els.atlasLootCheckType.value || "";
      const dc = checkType ? Number(els.atlasLootCheckDc.value) : "";
      if (checkType && !Number.isFinite(dc)) { alert("Indica la CD necesaria para encontrar este objeto."); els.atlasLootCheckDc.focus(); return; }
      internalSheetDraft.loot.push(normaliseLootItem({ id: app.uid(), name, quantity: els.atlasLootQuantity.value, notes: els.atlasLootNotes.value.trim(), checkType, dc }));
      els.atlasLootName.value = ""; els.atlasLootQuantity.value = 1; els.atlasLootNotes.value = ""; renderLootGroups(); els.atlasLootName.focus();
    });
    els.atlasLootSearchCheck?.addEventListener("change", renderLootSearchResults);
    els.atlasLootSearchResult?.addEventListener("input", renderLootSearchResults);
    els.atlasLootSearchRoll?.addEventListener("click", () => {
      const modifier = Math.max(-20, Math.min(20, Number(els.atlasLootSearchModifier.value) || 0));
      const expression = `1d20${modifier > 0 ? `+${modifier}` : modifier < 0 ? modifier : ""}`;
      let roll = null;
      try { roll = app.rollFormula?.(expression) || null; } catch (error) { console.error(error); }
      if (!roll) { const die = crypto.getRandomValues(new Uint32Array(1))[0] % 20 + 1; roll = { result: die + modifier, breakdown: `${die}${modifier ? modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}` : ""}` }; }
      els.atlasLootSearchResult.value = roll.result; els.atlasLootSearchRoll.textContent = `⚄ ${roll.breakdown} = ${roll.result}`; renderLootSearchResults();
    });
    els.atlasTextForm.addEventListener("submit", saveText); $$(".atlas-text-dialog-close,.atlas-text-dialog-cancel").forEach(button => button.addEventListener("click", () => els.atlasTextDialog.close()));
    els.atlasCategoryForm.addEventListener("submit", saveCategory); $$(".atlas-category-dialog-close,.atlas-category-dialog-cancel").forEach(button => button.addEventListener("click", () => els.atlasCategoryDialog.close()));

    els.playerMapViewport?.addEventListener("pointerdown", onPlayerPointerDown, { passive: false });
    els.playerMapViewport?.addEventListener("pointermove", onPlayerPointerMove, { passive: false });
    els.playerMapViewport?.addEventListener("pointerup", onPlayerPointerEnd, { passive: false });
    els.playerMapViewport?.addEventListener("pointercancel", onPlayerPointerEnd, { passive: false });
    els.playerMapViewport?.addEventListener("wheel", event => { event.preventDefault(); zoomPlayerBy(event.deltaY < 0 ? 1.14 : 1 / 1.14, event.clientX, event.clientY); }, { passive: false });
    els.playerZoomOut?.addEventListener("click", () => zoomPlayerBy(1 / 1.25));
    els.playerZoomIn?.addEventListener("click", () => zoomPlayerBy(1.25));
    els.playerZoomReset?.addEventListener("click", () => { const scene = playerSceneById(playerSceneId); if (scene) { playerTransformSceneId = ""; fitPlayerStage(scene, visibleFogBounds(scene), { force: true }); } });

    els.folderSyncChoose?.addEventListener("click", chooseFolderSync);
    els.folderSyncNow?.addEventListener("click", () => syncFolderBackup({ silent: false }));
    els.folderSyncRestore?.addEventListener("click", restoreFromFolder);
    els.folderSyncDisconnect?.addEventListener("click", disconnectFolderSync);
    document.addEventListener("forja:profilesaved", scheduleFolderSync);

    channel?.addEventListener("message", event => {
      if (event.data?.type !== "snapshot") return;
      if (currentRole === "player" && (!playerSnapshot || event.data.snapshot.campaignId === playerSnapshot.campaignId)) { playerSnapshot = event.data.snapshot; if (playerSnapshot.playerNavigationMode === "follow") playerSceneId = playerSnapshot.projectionSceneId; renderPlayer(); }
    });
    window.addEventListener("storage", event => { if (currentRole === "player" && event.key?.startsWith(PROJECTION_KEY_PREFIX)) { try { playerSnapshot = JSON.parse(event.newValue); if (playerSnapshot.playerNavigationMode === "follow") playerSceneId = playerSnapshot.projectionSceneId; renderPlayer(); } catch {} } });
    window.addEventListener("resize", () => {
      if (state().view === "atlas" && currentScene()?.imageId) { fitAtlasStage(currentScene()); resizeFogCanvas(currentScene()); }
      if (currentRole === "player") { const scene = playerSceneById(playerSceneId); if (scene) fitPlayerStage(scene); }
      applyStoredDmSheetWidth();
    });
    document.addEventListener("forja:historychange", () => {
      if (currentRole === "dm") renderAtlas();
      publishProjection();
    });
    document.addEventListener("forja:campaignchange", () => {
      renderRoleCampaigns();
      if (currentRole === "dm" && !isTrusted()) showRoleChoice();
      renderAtlas();
    });
  }

  applyStoredDmSheetWidth();

  window.ForjaAtlas = { render: renderAtlas, publish: publishProjection, getScene: sceneById, currentScene, sceneIsUnlocked, markerIsUnlocked, setScene, openSceneDialog, openMarkerDialog: (sceneId, markerId) => openMarkerDialog(markerId, null, sceneId), setSceneImageFromBlob, imageUrl, openDmSheet, closeDmSheet };
  renderLanHostState({ running: false });
  bind();
  refreshFolderSyncState();
  initRoleGate();
  if (currentRole !== "player") publishProjection();
})();
