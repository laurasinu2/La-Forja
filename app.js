(() => {
  "use strict";

  const STORAGE_KEY = "forja-narrador-profile-v3";
  const LEGACY_STORAGE_KEYS = ["goblin-notebook-v2", "goblin-notebook-v1"];
  const PROFILE_DB_NAME = "forja-narrador-storage";
  const PROFILE_DB_STORE = "profiles";
  const PROFILE_DB_KEY = "main";
  const LOCAL_STORAGE_SAFE_CHARS = 2200000;

  const TYPES = {
    locations: {
      label: "Localizaciones", singular: "Localización", icon: "✥",
      subtypes: [
        ["world", "◉", "Mundo / Plano"], ["country", "⚜", "País / Continente"],
        ["region", "🗺", "Región"], ["settlement", "♜", "Pueblo / Ciudad"],
        ["building", "⌂", "Edificio"], ["shop", "⚖", "Tienda / Comercio"], ["castle", "♖", "Castillo / Fuerte"],
        ["route", "⤳", "Ruta / Camino"], ["water", "≋", "Río / Masa de agua"],
        ["landmark", "⟁", "Lugar destacado"], ["dungeon", "⚿", "Mazmorra / Ruina"],
        ["other", "⌖", "Otro"], ["information", "✧", "Información"],
        ["scene", "◫", "Escena / Encuentro"]
      ]
    },
    organisations: {
      label: "Organizaciones", singular: "Organización", icon: "⚜",
      subtypes: [
        ["government", "♛", "Gobierno"], ["faith", "☩", "Fe / Religión"],
        ["education", "✒", "Educación"], ["military", "⛨", "Militar"],
        ["mercenary", "⚔", "Mercenarios"], ["criminal", "☠", "Criminal"],
        ["artisan", "⚒", "Artesanos"], ["society", "♟", "Sociedad / Cultura"],
        ["other", "⌘", "Otra"], ["information", "✧", "Información"]
      ]
    },
    creatures: {
      label: "Criaturas", singular: "Criatura", icon: "♞",
      subtypes: [
        ["player", "♕", "Personaje jugador"], ["friendly", "☼", "PNJ amistoso"],
        ["vendor", "⚖", "PNJ vendedor / Comerciante"],
        ["neutral", "◈", "PNJ neutral"], ["hostile", "☠", "PNJ hostil / Enemigo"],
        ["beast", "♞", "Bestia"], ["other", "⚝", "Otra criatura"],
        ["information", "✧", "Información"]
      ]
    },
    quests: {
      label: "Misiones", singular: "Misión", icon: "⚑",
      subtypes: [
        ["main", "?", "Misión principal"], ["secondary", "?", "Misión secundaria"],
        ["task", "✓", "Tarea"], ["commission", "⚑", "Encargo"],
        ["information", "⌘", "Información"], ["historical", "⌛", "Evento histórico"],
        ["scene", "◫", "Escena / Encuentro"]
      ]
    },
    things: {
      label: "Elementos", singular: "Elemento", icon: "♦",
      subtypes: [
        ["story", "☷", "Evento de historia"], ["information", "✧", "Información"],
        ["scene", "◫", "Escena"], ["dialogue", "❝", "Diálogo / Cita"],
        ["document", "✒", "Documento / Libro"], ["item", "⬡", "Objeto"],
        ["treasure", "▣", "Tesoro"], ["tool", "⚒", "Herramienta"],
        ["weapon", "⚔", "Arma"], ["armour", "⛨", "Armadura"],
        ["clothing", "♢", "Ropa"], ["spell", "✹", "Hechizo"],
        ["potion", "⚗", "Poción"], ["food", "♨", "Comida / Bebida"],
        ["vehicle", "⚙", "Vehículo"], ["mechanic", "⚄", "Juego / Mecánica"]
      ]
    }
  };

  const STATUS_OPTIONS = {
    locations: [
      ["notEncountered", "No encontrada"], ["encountered", "Encontrada"],
      ["destroyed", "Destruida"], ["irrelevant", "Ya no es relevante"]
    ],
    organisations: [
      ["hidden", "Oculta"], ["known", "Conocida"],
      ["dissolved", "Disuelta"], ["irrelevant", "Ya no es relevante"]
    ],
    creatures: [
      ["notEncountered", "No encontrada"], ["encountered", "Encontrada"],
      ["dead", "Muerta"], ["irrelevant", "Ya no es relevante"]
    ],
    quests: [
      ["notStarted", "No iniciada"], ["active", "Activa"],
      ["completed", "Completada"], ["failed", "Fallida"],
      ["irrelevant", "Ya no es relevante"]
    ],
    things: [
      ["notEncountered", "No encontrado"], ["encountered", "Encontrado"],
      ["destroyed", "Destruido"], ["irrelevant", "Ya no es relevante"]
    ]
  };

  const ABILITIES = [
    ["str", "FUE"], ["dex", "DES"], ["con", "CON"],
    ["int", "INT"], ["wis", "SAB"], ["cha", "CAR"]
  ];

  const GAME_MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const RARITY_OPTIONS = [
    ["common", "Común"], ["rare", "Raro"],
    ["ultrarare", "Ultrararo"], ["legendary", "Legendario"]
  ];

  const CURRENCY_OPTIONS = [
    ["cp", "cp", "Cobre"],
    ["sp", "sp", "Plata"],
    ["gp", "gp", "Oro"],
    ["ptp", "ptp", "Platino"]
  ];

  const TYPE_ORDER = Object.keys(TYPES);
  const DICE_SIDES = [4, 6, 8, 10, 12, 20, 100];
  const MAX_DICE_PER_TYPE = 50;
  const MINDMAP_NODE_WIDTH = 156;
  const MINDMAP_NODE_HEIGHT = 54;
  const MINDMAP_NODE_RADIUS = 96;
  const MINDMAP_EDGE_LENGTH = 228;
  const MINDMAP_LAYOUT_VERSION = 2;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const uid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const now = () => new Date().toISOString();
  const clone = value => typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
  const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);

  function sanitizeHtml(html = "") {
    const template = document.createElement("template");
    template.innerHTML = String(html);
    template.content.querySelectorAll("script,style,iframe,object,embed,link,meta").forEach(node => node.remove());
    template.content.querySelectorAll("*").forEach(node => {
      [...node.attributes].forEach(attribute => {
        const name = attribute.name.toLowerCase();
        if (name.startsWith("on") || name === "style" || name === "srcdoc") node.removeAttribute(attribute.name);
        if (name === "href" && /^javascript:/i.test(attribute.value.trim())) node.removeAttribute(attribute.name);
      });
    });
    return template.innerHTML;
  }

  function textToHtml(text = "") {
    const value = String(text).trim();
    if (!value) return "";
    return value.split(/\n{2,}/).map(block => `<p>${escapeHtml(block).replace(/\n/g, "<br>")}</p>`).join("");
  }

  function htmlToText(html = "") {
    const template = document.createElement("template");
    template.innerHTML = html;
    return template.content.textContent || "";
  }


  function htmlToMarkdown(html = "") {
    const root = document.createElement("div");
    root.innerHTML = sanitizeHtml(html);
    const inline = node => {
      if (node.nodeType === Node.TEXT_NODE) return node.textContent || "";
      if (node.nodeType !== Node.ELEMENT_NODE) return "";
      const text = [...node.childNodes].map(inline).join("");
      switch (node.tagName.toLowerCase()) {
        case "strong": case "b": return `**${text}**`;
        case "em": case "i": return `*${text}*`;
        case "s": case "strike": case "del": return `~~${text}~~`;
        case "a": return `[${text}](${node.getAttribute("href") || ""})`;
        case "br": return "\n";
        default: return text;
      }
    };
    const blocks = [];
    [...root.childNodes].forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) { const t=(node.textContent||"").trim(); if(t) blocks.push(t); return; }
      const tag=node.tagName.toLowerCase();
      if(tag === "h1" || tag === "h2") blocks.push(`# ${inline(node).trim()}`);
      else if(tag === "h3") blocks.push(`## ${inline(node).trim()}`);
      else if(tag === "blockquote") blocks.push(inline(node).split("\n").map(line => `> ${line}`).join("\n"));
      else if(tag === "ul" || tag === "ol") blocks.push([...node.children].map((li,i)=>`${tag === "ul" ? "-" : `${i+1}.`} ${inline(li).trim()}`).join("\n"));
      else blocks.push(inline(node).trim());
    });
    return blocks.filter(Boolean).join("\n\n");
  }

  function markdownToHtml(markdown = "") {
    const source = String(markdown).replace(/\r/g, "");
    const inline = text => escapeHtml(text)
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/~~([^~]+)~~/g, "<s>$1</s>")
      .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>");
    const lines = source.split("\n");
    let html = "", list = null;
    const closeList = () => { if (list) { html += `</${list}>`; list = null; } };
    for (const raw of lines) {
      const line = raw.trimEnd();
      let m;
      if (!line.trim()) { closeList(); continue; }
      if ((m = line.match(/^##\s+(.+)/))) { closeList(); html += `<h3>${inline(m[1])}</h3>`; }
      else if ((m = line.match(/^#\s+(.+)/))) { closeList(); html += `<h2>${inline(m[1])}</h2>`; }
      else if ((m = line.match(/^>\s?(.*)/))) { closeList(); html += `<blockquote>${inline(m[1])}</blockquote>`; }
      else if ((m = line.match(/^[-*]\s+(.+)/))) { if(list!=="ul"){closeList();list="ul";html+="<ul>";} html += `<li>${inline(m[1])}</li>`; }
      else if ((m = line.match(/^\d+[.)]\s+(.+)/))) { if(list!=="ol"){closeList();list="ol";html+="<ol>";} html += `<li>${inline(m[1])}</li>`; }
      else { closeList(); html += `<p>${inline(line)}</p>`; }
    }
    closeList();
    return sanitizeHtml(html);
  }

  function defaultSubtype(type) {
    return TYPES[type]?.subtypes?.[0]?.[0] || "information";
  }

  function defaultStatus(type) {
    return STATUS_OPTIONS[type]?.[0]?.[0] || "notEncountered";
  }

  function subtypeMeta(type, subtype) {
    const found = TYPES[type]?.subtypes.find(item => item[0] === subtype) || TYPES[type]?.subtypes[0];
    return found ? { value: found[0], icon: found[1], label: found[2] } : { value: "", icon: "✧", label: "Entrada" };
  }

  function isSalesEntry(entry) {
    return Boolean(entry && (
      (entry.type === "creatures" && entry.subtype === "vendor") ||
      (entry.type === "locations" && entry.subtype === "shop")
    ));
  }

  function normaliseCurrency(value = "", legacyPrice = "") {
    const raw = `${value} ${legacyPrice}`.toLocaleLowerCase("es");
    if (/\b(ptp|pp|platino|platinum)\b/.test(raw)) return "ptp";
    if (/\b(gp|po|oro|gold)\b/.test(raw)) return "gp";
    if (/\b(sp|pa|plata|silver)\b/.test(raw)) return "sp";
    if (/\b(cp|pc|cobre|copper)\b/.test(raw)) return "cp";
    return "gp";
  }

  function normalisePriceAmount(value, legacyPrice = "") {
    const direct = Number(value);
    if (value !== "" && value !== null && value !== undefined && Number.isFinite(direct) && direct >= 0) return direct;
    const match = String(legacyPrice || "").replace(",", ".").match(/\d+(?:\.\d+)?/);
    return match ? Math.max(0, Number(match[0])) : 0;
  }

  function normaliseVendorItem(item = {}) {
    const legacyPrice = String(item.price || "");
    return {
      id: item.id || uid(),
      name: String(item.name || ""),
      priceAmount: normalisePriceAmount(item.priceAmount, legacyPrice),
      currency: normaliseCurrency(item.currency, legacyPrice),
      description: String(item.description || "")
    };
  }

  function currencyMeta(value) {
    const found = CURRENCY_OPTIONS.find(option => option[0] === value) || CURRENCY_OPTIONS[2];
    return { value: found[0], label: found[1], name: found[2] };
  }

  function renderCurrencyControl(item, { form = false } = {}) {
    const wrapper = document.createElement("div");
    wrapper.className = "merchant-price-control";
    const amount = document.createElement("input");
    amount.type = "number";
    amount.min = "0";
    amount.step = "1";
    amount.inputMode = "numeric";
    amount.placeholder = "0";
    amount.className = "merchant-price-amount";
    amount.setAttribute("aria-label", "Cantidad del precio");
    amount.value = Number.isFinite(Number(item.priceAmount)) ? String(item.priceAmount) : "0";
    if (form) amount.id = "vendorItemPriceAmount";

    const coin = document.createElement("span");
    coin.className = "coin-icon";
    coin.setAttribute("aria-hidden", "true");

    const select = document.createElement("select");
    select.className = "merchant-currency-select";
    select.setAttribute("aria-label", "Moneda del precio");
    if (form) select.id = "vendorItemCurrency";
    select.innerHTML = CURRENCY_OPTIONS.map(([value, label, name]) =>
      `<option value="${value}">${label} · ${name}</option>`
    ).join("");
    select.value = currencyMeta(item.currency).value;

    const updateCoin = () => {
      const meta = currencyMeta(select.value);
      coin.className = `coin-icon coin-icon--${meta.value}`;
      coin.title = `Moneda de ${meta.name.toLocaleLowerCase("es")}`;
    };
    updateCoin();
    select.addEventListener("change", updateCoin);
    wrapper.append(amount, coin, select);
    return { wrapper, amount, select };
  }

  function setSubtypeIcon(element, type, subtype) {
    if (!element) return;
    const meta = subtypeMeta(type, subtype);
    element.replaceChildren();
    element.classList.remove("has-special-icon");
    if (type === "quests" && subtype === "main") {
      const glyph = document.createElement("span");
      glyph.className = "special-glyph special-glyph--quest-main";
      glyph.textContent = "?";
      element.append(glyph);
      element.classList.add("has-special-icon");
      return;
    }
    if (type === "things" && subtype === "treasure") {
      const holder = document.createElement("span");
      holder.className = "special-glyph special-glyph--treasure";
      holder.innerHTML = `<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="M4 10V8.5C4 5.5 7.6 3 12 3s8 2.5 8 5.5V10"/><rect x="3" y="9" width="18" height="11" rx="2"/><path d="M3 13h18M10 13v4h4v-4"/></svg>`;
      element.append(holder);
      element.classList.add("has-special-icon");
      return;
    }
    element.textContent = meta.icon;
  }

  function defaultStats() {
    return { hp: 9, maxhp: 9, ac: 12, speed: 30, initiative: 1, str: 10, dex: 12, con: 12, int: 14, wis: 13, cha: 13 };
  }

  function normaliseThingDetailItems(value) {
    if (Array.isArray(value)) {
      return value
        .map(item => typeof item === "string"
          ? { id: uid(), text: item }
          : { id: item?.id || uid(), text: String(item?.text || item?.value || "") })
        .filter(item => item.text.trim());
    }
    const text = String(value || "").trim();
    return text ? [{ id: uid(), text }] : [];
  }

  function defaultThingDetails() {
    return { location: [], lore: [], abilities: [] };
  }

  function normaliseThingDetails(raw = {}, legacy = {}) {
    return {
      location: normaliseThingDetailItems(raw?.location ?? legacy.itemLocation),
      lore: normaliseThingDetailItems(raw?.lore ?? legacy.itemLore),
      abilities: normaliseThingDetailItems(raw?.abilities ?? legacy.itemAbilities)
    };
  }

  function defaultGameCalendar() {
    return { startMonth: 0, daysPerMonth: 30, currentDay: 1, cursorMonthOffset: 0 };
  }

  function defaultDiceState() {
    const counts = Object.fromEntries(DICE_SIDES.map(sides => [String(sides), sides === 20 ? 1 : 0]));
    return { counts, modifier: 0, expression: "1d20", history: [], lastRoll: null };
  }

  function normaliseDiceState(raw = {}) {
    const fallback = defaultDiceState();
    const counts = {};
    DICE_SIDES.forEach(sides => {
      counts[String(sides)] = clampInteger(raw.counts?.[String(sides)], 0, MAX_DICE_PER_TYPE, fallback.counts[String(sides)]);
    });
    const modifier = clampInteger(raw.modifier, -20, 20, 0);
    const generatedExpression = buildDiceExpression(counts, modifier);
    const expression = typeof raw.expression === "string"
      ? raw.expression.slice(0, 160)
      : String(generatedExpression || fallback.expression).slice(0, 160);
    const history = Array.isArray(raw.history) ? raw.history.slice(0, 20).map(item => ({
      id: item.id || uid(),
      expression: String(item.expression || "").slice(0, 160),
      breakdown: String(item.breakdown || "").slice(0, 500),
      result: Number.isFinite(Number(item.result)) ? Number(item.result) : 0,
      createdAt: item.createdAt || now()
    })) : [];
    const lastRoll = raw.lastRoll && Number.isFinite(Number(raw.lastRoll.result)) ? {
      expression: String(raw.lastRoll.expression || "").slice(0, 160),
      breakdown: String(raw.lastRoll.breakdown || "").slice(0, 500),
      result: Number(raw.lastRoll.result)
    } : null;
    return { counts, modifier, expression, history, lastRoll };
  }

  function atlasNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }


  const DUNGEON_ELEMENT_TYPES = new Set([
    "room", "corridor", "wall", "text",
    "door", "double-door", "secret-door", "stairs-up", "stairs-down", "grate", "window", "column", "pit", "bridge",
    "table", "chair", "bed", "shelf", "wardrobe", "chest", "barrel", "crate", "altar", "statue", "torch", "brazier",
    "portal-rect", "portal-arch", "platform", "round-platform", "pedestal",
    "trap", "secret", "poi"
  ]);

  function normaliseDungeonProject(raw) {
    if (!raw || typeof raw !== "object") return null;
    const styleRaw = raw.style && typeof raw.style === "object" ? raw.style : {};
    const number = (value, minimum, maximum, fallback) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? Math.min(maximum, Math.max(minimum, parsed)) : fallback;
    };
    const material = source => {
      const rawMaterial = source && typeof source === "object" ? source : {};
      return {
        ...clone(rawMaterial),
        texture: String(rawMaterial.texture || ""),
        color: String(rawMaterial.color || ""),
        scale: number(rawMaterial.scale, .1, 12, 4),
        rotation: number(rawMaterial.rotation, 0, 360, 0),
        intensity: number(rawMaterial.intensity, .2, 1.4, 1),
        mode: ["continuous", "cover", "repeat"].includes(rawMaterial.mode) ? rawMaterial.mode : "continuous",
        customData: String(rawMaterial.customData || ""),
        customName: String(rawMaterial.customName || "").slice(0, 220)
      };
    };

    return {
      ...clone(raw),
      version: Math.max(1, Number(raw.version) || 1),
      widthCells: Math.round(number(raw.widthCells, 10, 120, 40)),
      heightCells: Math.round(number(raw.heightCells, 10, 120, 30)),
      gridVisible: raw.gridVisible !== false,
      snap: raw.snap !== false,
      preset: ["stone", "ruin", "cave", "fortress", "timber", "temple"].includes(raw.preset) ? raw.preset : "stone",
      style: {
        ...clone(styleRaw),
        floorTexture: String(styleRaw.floorTexture || "stone-light"),
        wallTexture: String(styleRaw.wallTexture || "stone"),
        floorColor: String(styleRaw.floorColor || "#77736b"),
        wallColor: String(styleRaw.wallColor || "#4c4a47"),
        lineColor: String(styleRaw.lineColor || "#17191b"),
        doorColor: String(styleRaw.doorColor || "#7a4d2c"),
        objectColor: String(styleRaw.objectColor || "#655441"),
        textColor: String(styleRaw.textColor || "#f1e5cc"),
        gridColor: String(styleRaw.gridColor || "#9a968d"),
        lineWidth: number(styleRaw.lineWidth, 1, 10, 4),
        shadowOpacity: number(styleRaw.shadowOpacity, 0, .8, .38),
        relief: number(styleRaw.relief, 0, 1, .7),
        floorTextureScale: number(styleRaw.floorTextureScale, .1, 12, 4),
        floorTextureRotation: number(styleRaw.floorTextureRotation, 0, 360, 0),
        floorTextureIntensity: number(styleRaw.floorTextureIntensity, .2, 1.4, 1),
        floorTextureMode: ["continuous", "cover", "repeat"].includes(styleRaw.floorTextureMode) ? styleRaw.floorTextureMode : "continuous",
        floorCustomTextureData: String(styleRaw.floorCustomTextureData || ""),
        floorCustomTextureName: String(styleRaw.floorCustomTextureName || "").slice(0, 220),
        wallTextureScale: number(styleRaw.wallTextureScale, .1, 12, 2),
        wallTextureRotation: number(styleRaw.wallTextureRotation, 0, 360, 0),
        wallTextureIntensity: number(styleRaw.wallTextureIntensity, .2, 1.4, 1),
        wallTextureMode: ["continuous", "cover", "repeat"].includes(styleRaw.wallTextureMode) ? styleRaw.wallTextureMode : "continuous",
        wallCustomTextureData: String(styleRaw.wallCustomTextureData || ""),
        wallCustomTextureName: String(styleRaw.wallCustomTextureName || "").slice(0, 220)
      },
      elements: Array.isArray(raw.elements) ? raw.elements.slice(0, 5000).map(element => {
        const source = element && typeof element === "object" ? element : {};
        const type = DUNGEON_ELEMENT_TYPES.has(source.type) ? source.type : "room";
        return {
          ...clone(source),
          id: String(source.id || uid()),
          type,
          x: number(source.x, -120, 240, 1),
          y: number(source.y, -120, 240, 1),
          w: number(source.w, .25, 240, type === "wall" ? .25 : 4),
          h: number(source.h, .25, 240, type === "wall" ? .25 : 4),
          x2: number(source.x2, -120, 240, 5),
          y2: number(source.y2, -120, 240, 5),
          rotation: number(source.rotation, -360, 360, 0),
          label: String(source.label || "").slice(0, 100),
          hidden: Boolean(source.hidden),
          floorTexture: String(source.floorTexture || ""),
          variant: String(source.variant || ""),
          customImageData: String(source.customImageData || ""),
          customImageName: String(source.customImageName || "").slice(0, 220),
          customImageType: String(source.customImageType || ""),
          customImageAspect: number(source.customImageAspect, .05, 100, 1),
          floorMaterial: material(source.floorMaterial)
        };
      }) : [],
      createdAt: raw.createdAt || now(),
      updatedAt: raw.updatedAt || now()
    };
  }

  function defaultAtlasState() {
    const rootId = uid();
    return {
      currentSceneId: rootId,
      projectionSceneId: rootId,
      playerNavigationMode: "follow",
      publicMerchantEntryId: "",
      customCategories: [],
      markerSheets: [],
      scenes: [{
        id: rootId,
        name: "Mundo",
        parentSceneId: "",
        imageId: "",
        imageName: "",
        imageType: "",
        imageWidth: 1600,
        imageHeight: 900,
        sourceType: "image",
        mapProject: null,
        discovered: true,
        markers: [],
        objects: [],
        fogStrokes: [],
        fogZones: [],
        createdAt: now(),
        updatedAt: now()
      }]
    };
  }

  function normaliseMarkerSheetStorage(raw = {}) {
    const optionalNumber = value => value === "" || value === null || value === undefined || !Number.isFinite(Number(value)) ? "" : Number(value);
    const stats = {};
    ["hp", "maxhp", "ac", "speed", "initiative", "proficiency", "str", "dex", "con", "int", "wis", "cha"].forEach(key => { stats[key] = optionalNumber(raw.stats?.[key]); });
    const loot = Array.isArray(raw.loot) ? raw.loot.map(item => ({
      id: String(item?.id || uid()), name: String(item?.name || "").slice(0, 160), quantity: Math.max(1, Math.trunc(Number(item?.quantity) || 1)), notes: String(item?.notes || "").slice(0, 500), checkType: String(item?.checkType || "").slice(0, 40), dc: optionalNumber(item?.dc)
    })).filter(item => item.name.trim()) : [];
    const stages = Array.isArray(raw.mission?.stages) ? raw.mission.stages.map(stage => ({ id: String(stage?.id || uid()), text: String(stage?.text || "").slice(0, 500), done: Boolean(stage?.done) })).filter(stage => stage.text.trim()) : [];
    return {
      id: String(raw.id || uid()), markerId: String(raw.markerId || ""), category: (["enemy", "ally"].includes(String(raw.category || "")) ? "npc" : String(raw.category || "npc")).slice(0, 60), kind: String(raw.kind || "creature").slice(0, 30), name: String(raw.name || (["enemy", "ally", "npc"].includes(String(raw.category || "npc")) ? "" : "Ficha")).slice(0, 100), imageId: String(raw.imageId || ""), description: String(raw.description || "").slice(0, 8000),
      stats, modifiers: String(raw.modifiers || "").slice(0, 5000), abilities: String(raw.abilities || "").slice(0, 5000), combatStyle: String(raw.combatStyle || "").slice(0, 5000), nonAggression: String(raw.nonAggression || "").slice(0, 5000), actions: String(raw.actions || "").slice(0, 7000), reactions: String(raw.reactions || "").slice(0, 5000),
      secret: { reveal: String(raw.secret?.reveal || "").slice(0, 5000), clues: String(raw.secret?.clues || "").slice(0, 5000), checkType: String(raw.secret?.checkType || "perception").slice(0, 40), dc: optionalNumber(raw.secret?.dc), success: String(raw.secret?.success || "").slice(0, 5000), failure: String(raw.secret?.failure || "").slice(0, 5000), discovered: Boolean(raw.secret?.discovered) },
      mission: { status: ["notStarted", "active", "completed", "failed"].includes(raw.mission?.status) ? raw.mission.status : "notStarted", giver: String(raw.mission?.giver || "").slice(0, 200), objective: String(raw.mission?.objective || "").slice(0, 500), secondary: String(raw.mission?.secondary || "").slice(0, 5000), reward: String(raw.mission?.reward || "").slice(0, 5000), notes: String(raw.mission?.notes || "").slice(0, 5000), stages },
      container: { cp: Math.max(0, Number(raw.container?.cp) || 0), sp: Math.max(0, Number(raw.container?.sp) || 0), gp: Math.max(0, Number(raw.container?.gp) || 0), pp: Math.max(0, Number(raw.container?.pp) || 0), locked: Boolean(raw.container?.locked), lockDc: optionalNumber(raw.container?.lockDc), key: String(raw.container?.key || "").slice(0, 500), trapped: Boolean(raw.container?.trapped), trapCheck: String(raw.container?.trapCheck || "perception").slice(0, 40), trapDc: optionalNumber(raw.container?.trapDc), trapEffect: String(raw.container?.trapEffect || "").slice(0, 3000), disarmDc: optionalNumber(raw.container?.disarmDc) },
      loot, createdAt: raw.createdAt || now(), updatedAt: raw.updatedAt || now(), orphanedAt: String(raw.orphanedAt || "")
    };
  }

  function normaliseAtlasState(raw = {}, entryIds = new Set()) {
    const fallback = defaultAtlasState();
    const scenes = Array.isArray(raw.scenes) && raw.scenes.length
      ? raw.scenes.map((scene, index) => ({
          id: String(scene?.id || uid()),
          name: String(scene?.name || `Escena ${index + 1}`).slice(0, 100),
          parentSceneId: String(scene?.parentSceneId || ""),
          imageId: String(scene?.imageId || ""),
          imageName: String(scene?.imageName || ""),
          imageType: String(scene?.imageType || ""),
          imageWidth: Math.max(1, Number(scene?.imageWidth) || 1600),
          imageHeight: Math.max(1, Number(scene?.imageHeight) || 900),
          sourceType: scene?.sourceType === "dungeon" || scene?.mapProject ? "dungeon" : "image",
          mapProject: normaliseDungeonProject(scene?.mapProject),
          discovered: Boolean(scene?.discovered),
          markers: Array.isArray(scene?.markers) ? scene.markers.map(marker => ({
            id: String(marker?.id || uid()),
            x: Math.max(0, Math.min(1, atlasNumber(marker?.x, 0.5))),
            y: Math.max(0, Math.min(1, atlasNumber(marker?.y, 0.5))),
            name: String(marker?.name ?? "").slice(0, 100),
            category: String(marker?.category || "place"),
            icon: String(marker?.icon || "⌖").slice(0, 8),
            alias: String(marker?.alias || "").slice(0, 60),
            disposition: ["enemy", "ally", "neutral"].includes(marker?.disposition) ? marker.disposition : (marker?.category === "enemy" ? "enemy" : marker?.category === "ally" ? "ally" : "neutral"),
            visibility: ["dm", "visible", "discovered"].includes(marker?.visibility) ? marker.visibility : "dm",
            targetSceneId: String(marker?.targetSceneId || ""),
            relatedEntryIds: Array.isArray(marker?.relatedEntryIds)
              ? marker.relatedEntryIds.map(String).filter(id => entryIds.has(id))
              : [],
            autoOpenDmSheet: Boolean(marker?.autoOpenDmSheet),
            sheetMode: marker?.sheetMode === "internal" || marker?.sheetMode === "notebook" ? marker.sheetMode : "",
            primaryEntryId: entryIds.has(String(marker?.primaryEntryId || "")) ? String(marker.primaryEntryId) : "",
            internalSheetId: String(marker?.internalSheetId || ""),
            mapSize: Math.max(0.25, Math.min(8, atlasNumber(marker?.mapSize, atlasNumber(marker?.size, 42) / 42))),
            size: Math.max(24, Math.min(80, atlasNumber(marker?.size, 42)))
          })) : [],
          objects: Array.isArray(scene?.objects) ? scene.objects.map(object => ({
            id: String(object?.id || uid()),
            kind: ["text", "line", "arrow", "rect", "circle"].includes(object?.kind) ? object.kind : "text",
            x1: Math.max(0, Math.min(1, atlasNumber(object?.x1, 0.2))),
            y1: Math.max(0, Math.min(1, atlasNumber(object?.y1, 0.2))),
            x2: Math.max(0, Math.min(1, atlasNumber(object?.x2, 0.5))),
            y2: Math.max(0, Math.min(1, atlasNumber(object?.y2, 0.5))),
            text: String(object?.text || "").slice(0, 300),
            visibleToPlayers: Boolean(object?.visibleToPlayers)
          })) : [],
          fogStrokes: Array.isArray(scene?.fogStrokes) ? scene.fogStrokes.slice(-8000).map(stroke => ({
            mode: stroke?.mode === "hide" ? "hide" : "reveal",
            x: Math.max(0, Math.min(1, atlasNumber(stroke?.x, 0))),
            y: Math.max(0, Math.min(1, atlasNumber(stroke?.y, 0))),
            radius: Math.max(0.005, Math.min(0.4, atlasNumber(stroke?.radius, 0.05)))
          })) : [],
          fogZones: Array.isArray(scene?.fogZones) ? scene.fogZones.map(zone => ({
            id: String(zone?.id || uid()),
            name: String(zone?.name || "Zona").slice(0, 80),
            x: Math.max(0, Math.min(1, atlasNumber(zone?.x, 0.2))),
            y: Math.max(0, Math.min(1, atlasNumber(zone?.y, 0.2))),
            width: Math.max(0.01, Math.min(1, atlasNumber(zone?.width, 0.2))),
            height: Math.max(0.01, Math.min(1, atlasNumber(zone?.height, 0.2))),
            revealed: Boolean(zone?.revealed)
          })) : [],
          dmEntryId: entryIds.has(String(scene?.dmEntryId || "")) ? String(scene.dmEntryId) : "",
          dmEntryIds: Array.isArray(scene?.dmEntryIds) ? scene.dmEntryIds.map(String).filter(id => entryIds.has(id)) : [],
          dmSourceMarkerId: String(scene?.dmSourceMarkerId || ""),
          createdAt: scene?.createdAt || now(),
          updatedAt: scene?.updatedAt || now()
        }))
      : fallback.scenes;
    const sceneIds = new Set(scenes.map(scene => scene.id));
    scenes.forEach(scene => {
      if (!sceneIds.has(scene.parentSceneId) || scene.parentSceneId === scene.id) scene.parentSceneId = "";
      scene.markers.forEach(marker => {
        if (!sceneIds.has(marker.targetSceneId)) marker.targetSceneId = "";
        if (marker.category === "enemy" || marker.category === "ally") {
          marker.disposition = marker.category === "enemy" ? "enemy" : "ally";
          marker.category = "npc";
          marker.icon = "●";
        }
        if (marker.category === "npc" && !["enemy", "ally", "neutral"].includes(marker.disposition)) marker.disposition = "neutral";
      });
    });
    const currentSceneId = sceneIds.has(raw.currentSceneId) ? raw.currentSceneId : scenes[0].id;
    const projectionSceneId = sceneIds.has(raw.projectionSceneId) ? raw.projectionSceneId : currentSceneId;
    return {
      currentSceneId,
      projectionSceneId,
      playerNavigationMode: raw.playerNavigationMode === "free" ? "free" : "follow",
      publicMerchantEntryId: entryIds.has(raw.publicMerchantEntryId) ? raw.publicMerchantEntryId : "",
      customCategories: Array.isArray(raw.customCategories) ? raw.customCategories.map(category => ({
        id: String(category?.id || uid()),
        label: String(category?.label || "Personalizada").slice(0, 50),
        icon: String(category?.icon || "✦").slice(0, 8)
      })) : [],
      markerSheets: Array.isArray(raw.markerSheets) ? raw.markerSheets.map(normaliseMarkerSheetStorage) : [],
      scenes
    };
  }

  function buildDiceExpression(counts, modifier = 0) {
    const dice = DICE_SIDES
      .map(sides => [sides, Math.max(0, Math.trunc(Number(counts?.[String(sides)]) || 0))])
      .filter(([, count]) => count > 0)
      .map(([sides, count]) => `${count}d${sides}`);
    const expression = dice.join(" + ");
    const mod = Math.trunc(Number(modifier) || 0);
    if (mod > 0) return `${expression}${expression ? " + " : "+ "}${mod}`;
    if (mod < 0) return `${expression}${expression ? " − " : "− "}${Math.abs(mod)}`;
    return expression;
  }

  function clampInteger(value, minimum, maximum, fallback) {
    const number = Math.trunc(Number(value));
    if (!Number.isFinite(number)) return fallback;
    return Math.min(maximum, Math.max(minimum, number));
  }

  function normaliseGameCalendar(raw = {}) {
    const fallback = defaultGameCalendar();
    return {
      startMonth: clampInteger(raw.startMonth, 0, 11, fallback.startMonth),
      daysPerMonth: clampInteger(raw.daysPerMonth, 20, 35, fallback.daysPerMonth),
      currentDay: Math.max(1, Math.trunc(Number(raw.currentDay) || fallback.currentDay)),
      cursorMonthOffset: Math.max(0, Math.trunc(Number(raw.cursorMonthOffset) || 0))
    };
  }

  function rarityLabel(value) {
    return RARITY_OPTIONS.find(option => option[0] === value)?.[1] || "Común";
  }

  function makeEntry(type, name, parentId = null, descriptionHtml = "", subtype = null) {
    return {
      id: uid(), type, name, parentId, subtype: subtype || defaultSubtype(type),
      descriptionHtml, descriptionMarkdown: htmlToMarkdown(descriptionHtml), status: defaultStatus(type), collapsed: false, order: 0,
      consumables: [], journal: [], connections: [], vendorItems: [], obtainableItems: [],
      thingDetails: type === "things" ? defaultThingDetails() : null,
      stats: type === "creatures" ? defaultStats() : null,
      createdAt: now(), updatedAt: now()
    };
  }

  function dateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function assignSequentialOrders(entries) {
    const groups = new Map();
    entries.forEach((entry, index) => {
      const key = `${entry.type}|${entry.parentId || "root"}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({ entry, index });
    });
    groups.forEach(group => {
      group.sort((a, b) => {
        const aOrder = Number.isFinite(Number(a.entry.order)) ? Number(a.entry.order) : a.index;
        const bOrder = Number.isFinite(Number(b.entry.order)) ? Number(b.entry.order) : b.index;
        return aOrder - bOrder || a.index - b.index;
      });
      group.forEach(({ entry }, index) => { entry.order = index; });
    });
  }

  function blankCampaign(name = "Nueva campaña") {
    return {
      id: uid(), version: 6, campaignName: name,
      view: "notebook", selectedId: null, search: "",
      gameCalendar: defaultGameCalendar(), calendarEvents: [], entries: [],
      mindmapLocationFilter: "", mindmapLayoutVersion: MINDMAP_LAYOUT_VERSION, mindmapLayouts: {}, dice: defaultDiceState(),
      atlas: defaultAtlasState(), auth: { passwordHash: "", passwordSalt: "", updatedAt: "" }, entriesCreated: 0,
      createdAt: now(), updatedAt: now()
    };
  }

  function demoCampaign() {
    const campaign = blankCampaign("Ecos de Valceniza");
    const world = makeEntry("locations", "Aledoria", null, "", "world");
    world.status = "encountered";
    const region = makeEntry("locations", "The Greenwood", world.id, "", "region");
    region.status = "encountered";
    const town = makeEntry("locations", "Valceniza", region.id,
      "<h2>Valceniza</h2><p>Tras varios días de viaje, las provisiones empiezan a escasear y el agua apenas alcanza para una jornada más. El camino desciende entre los árboles hasta revelar un pequeño pueblo oculto en el bosque.</p><blockquote>En el centro de la plaza se alza el tronco petrificado de un árbol gigantesco.</blockquote>", "settlement");
    town.status = "encountered";
    const plaza = makeEntry("locations", "Plaza", town.id, "", "landmark");
    const ruins = makeEntry("locations", "Ruinas", region.id, "", "dungeon");
    const interiors = makeEntry("locations", "Salas interiores", ruins.id, "", "building");
    const library = makeEntry("locations", "Biblioteca", interiors.id, "", "building");
    const study = makeEntry("locations", "Sala de estudio", interiors.id, "", "building");
    const store = makeEntry("locations", "Almacén", interiors.id, "", "building");

    const band = makeEntry("organisations", "Banda de los Seis Caminos", null, "", "criminal");
    band.status = "known";
    const bandCell = makeEntry("organisations", "Célula de Valceniza", band.id, "", "criminal");
    const gaël = makeEntry("creatures", "Loris (Gaël)", null, "", "player");
    gaël.status = "encountered";
    const npc = makeEntry("creatures", "PNJ del pueblo", null, "", "friendly");
    const merchant = makeEntry("creatures", "Maela, mercader del camino", null,
      "<h2>Mercader ambulante</h2><p>Compra suministros sencillos, curiosidades y objetos recuperados de las rutas del bosque.</p>", "vendor");
    merchant.status = "encountered";
    merchant.vendorItems = [
      { id: uid(), name: "Poción de curación", priceAmount: 50, currency: "gp", description: "Recupera 2d4 + 2 puntos de golpe." },
      { id: uid(), name: "Antorcha de resina", priceAmount: 8, currency: "cp", description: "Arde durante una hora incluso con lluvia ligera." }
    ];
    const bandits = makeEntry("creatures", "Bandidos", null, "", "hostile");
    const scout = makeEntry("creatures", "Bandido explorador", bandits.id, "", "hostile");
    const brute = makeEntry("creatures", "Bandido grandullón", bandits.id, "", "hostile");
    const quest = makeEntry("quests", "El carro perdido", null, "", "main");
    quest.status = "active";
    const clue = makeEntry("quests", "Investigar las huellas", quest.id, "", "task");
    const tree = makeEntry("things", "Árbol de Valceniza", null, "", "story");
    tree.status = "encountered";
    const shard = makeEntry("things", "Fragmento de corteza blanca", tree.id, "", "item");

    town.obtainableItems = [{
      id: uid(), name: "Provisiones para 2 días", rarity: "common",
      how: "Comprarlas en el mercado o ayudar a la posadera.", relatedId: plaza.id
    }];
    town.journal = [
      { id: uid(), text: "La herrería está muy ocupada; algunos materiales llegan en peor estado de lo habitual.", createdAt: now() },
      { id: uid(), text: "Cada vez recibe menos madera de calidad.", createdAt: now() }
    ];
    tree.connections = [{ id: uid(), targetId: plaza.id, label: "está en" }];

    campaign.entries = [world, region, town, plaza, ruins, interiors, library, study, store, band, bandCell, gaël, npc, merchant, bandits, scout, brute, quest, clue, tree, shard];
    assignSequentialOrders(campaign.entries);
    campaign.selectedId = town.id;
    return campaign;
  }

  function normaliseStatus(status, type) {
    const allowed = new Set((STATUS_OPTIONS[type] || []).map(option => option[0]));
    if (allowed.has(status)) return status;
    if (status === "destroyed") {
      if (type === "creatures") return "dead";
      if (type === "organisations") return "dissolved";
      if (type === "quests") return "failed";
      return "destroyed";
    }
    if (status === "encountered") {
      if (type === "organisations") return "known";
      if (type === "quests") return "active";
      return "encountered";
    }
    if (status === "notEncountered") {
      if (type === "organisations") return "hidden";
      if (type === "quests") return "notStarted";
      return "notEncountered";
    }
    return defaultStatus(type);
  }

  function normaliseMindmapLayouts(rawLayouts, ids) {
    const layouts = {};
    if (!rawLayouts || typeof rawLayouts !== "object" || Array.isArray(rawLayouts)) return layouts;
    Object.entries(rawLayouts).forEach(([layoutKey, rawPositions]) => {
      if (layoutKey !== "all" && !ids.has(layoutKey)) return;
      if (!rawPositions || typeof rawPositions !== "object" || Array.isArray(rawPositions)) return;
      const positions = {};
      Object.entries(rawPositions).forEach(([entryId, rawPosition]) => {
        if (!ids.has(entryId) || !rawPosition || typeof rawPosition !== "object") return;
        const x = Number(rawPosition.x);
        const y = Number(rawPosition.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
        positions[entryId] = {
          x: Math.max(0, Math.min(1, x)),
          y: Math.max(0, Math.min(1, y))
        };
      });
      if (Object.keys(positions).length) layouts[layoutKey] = positions;
    });
    return layouts;
  }

  function normaliseCampaign(raw, fallbackName = "Campaña importada") {
    const fallback = blankCampaign(fallbackName);
    if (!raw || !Array.isArray(raw.entries)) return fallback;

    const entries = raw.entries.map((original, index) => {
      const type = TYPES[original.type] ? original.type : "things";
      const validSubtype = TYPES[type].subtypes.some(item => item[0] === original.subtype);
      const oldConsumables = Array.isArray(original.consumables)
        ? original.consumables.map(item => ({ id: item.id || uid(), text: String(item.text || "") }))
        : [];
      const explicitObtainableItems = Array.isArray(original.obtainableItems)
        ? original.obtainableItems.map(item => ({
            id: item.id || uid(),
            name: String(item.name || item.text || ""),
            rarity: RARITY_OPTIONS.some(option => option[0] === item.rarity) ? item.rarity : "common",
            how: String(item.how || item.description || ""),
            relatedId: String(item.relatedId || item.targetId || "")
          }))
        : [];
      const migratedLocationItems = type === "locations" && !explicitObtainableItems.length
        ? oldConsumables.map(item => ({
            id: item.id || uid(), name: item.text, rarity: "common",
            how: "Disponible en esta localización.", relatedId: ""
          }))
        : explicitObtainableItems;

      return {
        ...original,
        id: original.id || uid(),
        type,
        name: String(original.name || "Sin nombre"),
        parentId: original.parentId || null,
        subtype: validSubtype ? original.subtype : defaultSubtype(type),
        descriptionHtml: sanitizeHtml(original.descriptionHtml ?? textToHtml(original.description || "")),
        descriptionMarkdown: String(original.descriptionMarkdown ?? htmlToMarkdown(original.descriptionHtml ?? textToHtml(original.description || ""))),
        status: normaliseStatus(original.status, type),
        collapsed: Boolean(original.collapsed),
        order: Number.isFinite(Number(original.order)) ? Number(original.order) : index,
        consumables: type === "locations" ? [] : oldConsumables,
        obtainableItems: migratedLocationItems,
        journal: Array.isArray(original.journal) ? original.journal.map(note => ({ id: note.id || uid(), text: String(note.text || ""), createdAt: note.createdAt || now() })) : [],
        connections: Array.isArray(original.connections) ? original.connections.map(connection => ({ id: connection.id || uid(), targetId: connection.targetId || "", label: String(connection.label || "") })) : [],
        vendorItems: Array.isArray(original.vendorItems)
          ? original.vendorItems.map(normaliseVendorItem)
          : [],
        thingDetails: type === "things"
          ? normaliseThingDetails(original.thingDetails || {}, original)
          : null,
        stats: type === "creatures" ? { ...defaultStats(), ...(original.stats || {}) } : null,
        createdAt: original.createdAt || now(),
        updatedAt: original.updatedAt || now()
      };
    });

    const ids = new Set(entries.map(entry => entry.id));
    entries.forEach(entry => {
      const parent = entries.find(candidate => candidate.id === entry.parentId);
      if (!parent || parent.type !== entry.type || parent.id === entry.id) entry.parentId = null;
      entry.connections = entry.connections.filter(connection => connection.targetId && ids.has(connection.targetId) && connection.targetId !== entry.id);
      entry.obtainableItems = (entry.obtainableItems || []).map(item => ({
        ...item,
        relatedId: ids.has(item.relatedId) && item.relatedId !== entry.id ? item.relatedId : ""
      }));
    });
    assignSequentialOrders(entries);

    const oldEvents = Array.isArray(raw.calendarEvents) ? raw.calendarEvents : [];
    const oldDates = oldEvents
      .map(event => /^\d{4}-\d{2}-\d{2}$/.test(event.date || "") ? event.date : null)
      .filter(Boolean)
      .sort();
    const oldBaseDate = oldDates[0] ? new Date(`${oldDates[0]}T12:00:00`) : null;
    const migratedEvents = oldEvents.map(event => {
      let day = Math.max(1, Math.trunc(Number(event.day) || 0));
      if (!Number(event.day) && oldBaseDate && /^\d{4}-\d{2}-\d{2}$/.test(event.date || "")) {
        const eventDate = new Date(`${event.date}T12:00:00`);
        day = Math.max(1, Math.round((eventDate - oldBaseDate) / 86400000) + 1);
      }
      return {
        id: event.id || uid(),
        day: day || 1,
        time: /^\d{2}:\d{2}$/.test(event.time || "") ? event.time : "",
        title: String(event.title || "Evento"),
        description: String(event.description || ""),
        entryId: ids.has(event.entryId) ? event.entryId : ""
      };
    });

    const inferredStartMonth = oldBaseDate
      ? oldBaseDate.getMonth()
      : /^\d{4}-\d{2}$/.test(raw.calendarCursor || "")
        ? Math.max(0, Math.min(11, Number(raw.calendarCursor.slice(5, 7)) - 1))
        : 0;
    const gameCalendar = normaliseGameCalendar(raw.gameCalendar || {
      startMonth: inferredStartMonth,
      currentDay: migratedEvents.length ? Math.max(1, Math.min(...migratedEvents.map(event => event.day))) : 1,
      cursorMonthOffset: 0,
      daysPerMonth: 30
    });

    return {
      id: raw.id || uid(),
      version: 6,
      campaignName: String(raw.campaignName || fallbackName),
      view: ["notebook", "calendar", "mindmap", "dice", "atlas"].includes(raw.view) ? raw.view : (raw.view === "dungeon" ? "atlas" : "notebook"),
      selectedId: ids.has(raw.selectedId) ? raw.selectedId : entries[0]?.id || null,
      search: String(raw.search || ""),
      gameCalendar,
      calendarEvents: migratedEvents,
      mindmapLocationFilter: ids.has(raw.mindmapLocationFilter) && entries.find(entry => entry.id === raw.mindmapLocationFilter)?.type === "locations"
        ? raw.mindmapLocationFilter : "",
      mindmapLayoutVersion: MINDMAP_LAYOUT_VERSION,
      mindmapLayouts: Number(raw.mindmapLayoutVersion || 0) === MINDMAP_LAYOUT_VERSION
        ? normaliseMindmapLayouts(raw.mindmapLayouts, ids)
        : {},
      dice: normaliseDiceState(raw.dice),
      atlas: normaliseAtlasState(raw.atlas, ids),
      auth: {
        passwordHash: String(raw.auth?.passwordHash || ""),
        passwordSalt: String(raw.auth?.passwordSalt || ""),
        updatedAt: String(raw.auth?.updatedAt || "")
      },
      entries,
      createdAt: raw.createdAt || now(),
      updatedAt: raw.updatedAt || now()
    };
  }

  function seedProfile() {
    const campaign = demoCampaign();
    return { version: 5, theme: "dark", activeCampaignId: campaign.id, campaigns: [campaign] };
  }

  function normaliseProfile(raw) {
    if (raw && Array.isArray(raw.campaigns)) {
      const campaigns = raw.campaigns.map((campaign, index) => normaliseCampaign(campaign, `Campaña ${index + 1}`));
      if (!campaigns.length) return seedProfile();
      const activeCampaignId = campaigns.some(campaign => campaign.id === raw.activeCampaignId) ? raw.activeCampaignId : campaigns[0].id;
      return { version: 5, theme: raw.theme === "light" ? "light" : "dark", activeCampaignId, campaigns };
    }
    if (raw && Array.isArray(raw.entries)) {
      const campaign = normaliseCampaign(raw, raw.campaignName || "Campaña migrada");
      return { version: 5, theme: raw.theme === "light" ? "light" : "dark", activeCampaignId: campaign.id, campaigns: [campaign] };
    }
    return seedProfile();
  }

  let profileLoadedFromLocalStorage = false;
  let profileDbPromise = null;
  let profileSaveChain = Promise.resolve();

  function openProfileDb() {
    if (!window.indexedDB) return Promise.reject(new Error("IndexedDB no está disponible."));
    if (profileDbPromise) return profileDbPromise;
    profileDbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(PROFILE_DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(PROFILE_DB_STORE)) db.createObjectStore(PROFILE_DB_STORE, { keyPath: "key" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("No se pudo abrir el almacenamiento local."));
    });
    return profileDbPromise;
  }

  async function readProfileFromIndexedDb() {
    const db = await openProfileDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(PROFILE_DB_STORE, "readonly");
      const request = transaction.objectStore(PROFILE_DB_STORE).get(PROFILE_DB_KEY);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || transaction.error);
    });
  }

  async function writeProfileToIndexedDb(snapshot) {
    const db = await openProfileDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(PROFILE_DB_STORE, "readwrite");
      transaction.objectStore(PROFILE_DB_STORE).put({ key: PROFILE_DB_KEY, profile: snapshot, savedAt: Date.now() });
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("No se pudo guardar la campaña en IndexedDB."));
      transaction.onabort = () => reject(transaction.error || new Error("Se canceló el guardado local."));
    });
  }

  function profileFreshness(candidate) {
    return Math.max(0, ...(candidate?.campaigns || []).map(campaign => {
      const parsed = Date.parse(campaign?.updatedAt || "");
      return Number.isFinite(parsed) ? parsed : 0;
    }));
  }

  function localStorageProfileJson(candidate) {
    const full = JSON.stringify(candidate);
    if (full.length <= LOCAL_STORAGE_SAFE_CHARS) return full;
    return JSON.stringify(candidate, (_key, value) => {
      if (typeof value === "string" && value.startsWith("data:image/") && value.length > 12000) return "";
      return value;
    });
  }

  function writeProfileToLocalStorage(candidate) {
    try {
      localStorage.setItem(STORAGE_KEY, localStorageProfileJson(candidate));
      return true;
    } catch (error) {
      try {
        const fallback = JSON.stringify(candidate, (_key, value) => {
          if (typeof value === "string" && value.startsWith("data:") && value.length > 2000) return "";
          return value;
        });
        localStorage.setItem(STORAGE_KEY, fallback);
        return true;
      } catch (fallbackError) {
        console.warn("No se pudo guardar ni siquiera la copia ligera en localStorage.", fallbackError || error);
        return false;
      }
    }
  }

  function loadProfile() {
    try {
      const current = localStorage.getItem(STORAGE_KEY);
      if (current) { profileLoadedFromLocalStorage = true; return normaliseProfile(JSON.parse(current)); }
      for (const key of LEGACY_STORAGE_KEYS) {
        const legacy = localStorage.getItem(key);
        if (legacy) { profileLoadedFromLocalStorage = true; return normaliseProfile(JSON.parse(legacy)); }
      }
    } catch (error) {
      console.warn("No se pudo leer el perfil guardado.", error);
    }
    return seedProfile();
  }

  let profile = loadProfile();
  let state = profile.campaigns.find(campaign => campaign.id === profile.activeCampaignId) || profile.campaigns[0];
  let pendingSaveTimer = null;
  let dialogType = "locations";
  let actionEntryId = null;
  let editingCalendarEventId = null;
  let connectionMode = false;
  let connectionSourceId = null;
  let connectionTargetId = null;
  let locationItemPickMode = false;
  let locationItemSourceId = null;
  let locationItemEditingId = null;
  let pendingLocationItemTargetId = "";
  let draggedEntryId = null;
  let mindmapTransform = { x: 0, y: 0, scale: 1 };
  let mindmapDrag = null;
  let mindmapNodeDrag = null;
  let mindmapLayout = null;
  let suppressMindmapNodeClick = false;
  let activeCollectionType = state.entries.find(entry => entry.id === state.selectedId)?.type || "locations";

  const els = {
    notebookView: $("#notebookView"), calendarView: $("#calendarView"), mindmapView: $("#mindmapView"), diceView: $("#diceView"), atlasView: $("#atlasView"), dungeonView: $("#dungeonView"), viewTabs: $$(".view-tab"),
    campaignSelect: $("#campaignSelect"), campaignManagerBtn: $("#campaignManagerBtn"),
    campaignDialog: $("#campaignDialog"), newCampaignForm: $("#newCampaignForm"), newCampaignName: $("#newCampaignName"), campaignList: $("#campaignList"),
    columns: $("#columns"), collectionTabs: $("#collectionTabs"), collectionsPanel: $("#collectionsPanel"), connectionModeBanner: $("#connectionModeBanner"), selectionModeText: $("#selectionModeText"), cancelConnectionBanner: $("#cancelConnectionBanner"),
    globalSearch: $("#globalSearch"), clearSearch: $("#clearSearch"),
    editor: $("#editor"), emptyState: $("#emptyState"), entrySubtype: $("#entrySubtype"), entryStatus: $("#entryStatus"),
    entryName: $("#entryName"), entryHeadingIcon: $("#entryHeadingIcon"), entryDescription: $("#entryDescription"), descriptionPreview: $("#descriptionPreview"),
    saveState: $("#saveState"), creaturePanel: $("#creaturePanel"),
    vendorPanel: $("#vendorPanel"), vendorItemsList: $("#vendorItemsList"), vendorItemForm: $("#vendorItemForm"),
    vendorItemName: $("#vendorItemName"), vendorItemPriceAmount: $("#vendorItemPriceAmount"), vendorItemCurrency: $("#vendorItemCurrency"), vendorItemCoin: $("#vendorItemCoin"), vendorItemDescription: $("#vendorItemDescription"),
    carryItemsPanel: $("#carryItemsPanel"), consumableForm: $("#consumableForm"), consumableInput: $("#consumableInput"), consumablesList: $("#consumablesList"),
    thingDetailsPanel: $("#thingDetailsPanel"),
    thingLocationList: $("#thingLocationList"), thingLocationForm: $("#thingLocationForm"), thingLocationInput: $("#thingLocationInput"),
    thingLoreList: $("#thingLoreList"), thingLoreForm: $("#thingLoreForm"), thingLoreInput: $("#thingLoreInput"),
    thingAbilitiesList: $("#thingAbilitiesList"), thingAbilitiesForm: $("#thingAbilitiesForm"), thingAbilitiesInput: $("#thingAbilitiesInput"),
    locationLootPanel: $("#locationLootPanel"), locationItemsList: $("#locationItemsList"), locationItemForm: $("#locationItemForm"),
    locationItemName: $("#locationItemName"), locationItemRarity: $("#locationItemRarity"), locationItemHow: $("#locationItemHow"), locationItemTargetButton: $("#locationItemTargetButton"),
    connectionsList: $("#connectionsList"), startConnectionBtn: $("#startConnectionBtn"), cancelConnectionBtn: $("#cancelConnectionBtn"), connectionModeHint: $("#connectionModeHint"),
    connectionDialog: $("#connectionDialog"), connectionDialogForm: $("#connectionDialogForm"), connectionSourceName: $("#connectionSourceName"), connectionTargetName: $("#connectionTargetName"), connectionRelation: $("#connectionRelation"),
    journalForm: $("#journalForm"), journalInput: $("#journalInput"), journalList: $("#journalList"),
    deleteBtn: $("#deleteBtn"), duplicateBtn: $("#duplicateBtn"), exportBtn: $("#exportBtn"), importBtn: $("#importBtn"),
    importFile: $("#importFile"), themeBtn: $("#themeBtn"), helpBtn: $("#helpBtn"), helpDialog: $("#helpDialog"), closeHelp: $("#closeHelp"),
    itemDialog: $("#itemDialog"), itemDialogForm: $("#itemDialogForm"), dialogTitle: $("#dialogTitle"),
    newItemName: $("#newItemName"), newItemSubtype: $("#newItemSubtype"), newItemParent: $("#newItemParent"),
    actionsDialog: $("#actionsDialog"), actionsTitle: $("#actionsTitle"),
    calendarTitle: $("#calendarTitle"), calendarCampaignDay: $("#calendarCampaignDay"), calendarGrid: $("#calendarGrid"), calendarPrev: $("#calendarPrev"),
    calendarNext: $("#calendarNext"), calendarToday: $("#calendarToday"), advanceCampaignDay: $("#advanceCampaignDay"), newCalendarEvent: $("#newCalendarEvent"), calendarSettingsBtn: $("#calendarSettingsBtn"),
    calendarEventDialog: $("#calendarEventDialog"), calendarEventForm: $("#calendarEventForm"), calendarEventDialogTitle: $("#calendarEventDialogTitle"),
    eventDay: $("#eventDay"), eventDayPreview: $("#eventDayPreview"), eventTime: $("#eventTime"), eventTitle: $("#eventTitle"), eventEntry: $("#eventEntry"),
    eventDescription: $("#eventDescription"), deleteCalendarEvent: $("#deleteCalendarEvent"),
    calendarSettingsDialog: $("#calendarSettingsDialog"), calendarSettingsForm: $("#calendarSettingsForm"), calendarStartMonth: $("#calendarStartMonth"),
    calendarDaysPerMonth: $("#calendarDaysPerMonth"), calendarCurrentDay: $("#calendarCurrentDay"),
    mindmapLocationFilter: $("#mindmapLocationFilter"), mindmapCanvas: $("#mindmapCanvas"), mindmapSvg: $("#mindmapSvg"), mindmapStage: $("#mindmapStage"), mindmapEmpty: $("#mindmapEmpty"),
    mindmapZoomOut: $("#mindmapZoomOut"), mindmapZoomIn: $("#mindmapZoomIn"), mindmapReset: $("#mindmapReset"),
    diceTypes: $("#diceTypes"), diceModifiers: $("#diceModifiers"), diceExpression: $("#diceExpression"), rollDiceBtn: $("#rollDiceBtn"),
    diceBreakdown: $("#diceBreakdown"), diceResult: $("#diceResult"), diceError: $("#diceError"), diceHistory: $("#diceHistory"),
    diceClearSelection: $("#diceClearSelection"), diceClearHistory: $("#diceClearHistory"), diceRollOutput: $("#diceRollOutput")
  };

  function saveState(immediate = false) {
    profile.activeCampaignId = state.id;
    state.updatedAt = now();
    els.saveState?.classList.add("is-saving");
    if (els.saveState) els.saveState.textContent = "Guardando…";
    clearTimeout(pendingSaveTimer);

    const commit = () => {
      const snapshot = clone(profile);
      writeProfileToLocalStorage(snapshot);
      document.dispatchEvent(new CustomEvent("forja:profilesaved", { detail: { updatedAt: state.updatedAt } }));
      profileSaveChain = profileSaveChain
        .catch(() => {})
        .then(() => writeProfileToIndexedDb(snapshot))
        .catch(error => console.warn("No se pudo guardar el perfil completo en IndexedDB.", error));
      profileSaveChain.finally(() => {
        if (els.saveState) {
          els.saveState.textContent = "Guardado";
          els.saveState.classList.remove("is-saving");
        }
      });
      return profileSaveChain;
    };

    if (immediate) return commit();
    pendingSaveTimer = setTimeout(commit, 180);
    return profileSaveChain;
  }

  async function hydrateProfileFromIndexedDb() {
    try {
      const stored = await readProfileFromIndexedDb();
      if (!stored?.profile) return;
      const candidate = normaliseProfile(stored.profile);
      const shouldUseIndexedDb = !profileLoadedFromLocalStorage || profileFreshness(candidate) >= profileFreshness(profile);
      if (!shouldUseIndexedDb) return;
      profile = candidate;
      state = profile.campaigns.find(campaign => campaign.id === profile.activeCampaignId) || profile.campaigns[0];
      activeCollectionType = state.entries.find(entry => entry.id === state.selectedId)?.type || "locations";
      render();
      document.dispatchEvent(new CustomEvent("forja:campaignchange", { detail: { campaignId: state.id } }));
    } catch (error) {
      console.warn("No se pudo recuperar la copia completa de IndexedDB.", error);
    } finally {
      try { await navigator.storage?.persist?.(); } catch (_error) {}
    }
  }


  function selectedEntry() {
    return state.entries.find(entry => entry.id === state.selectedId) || null;
  }

  function entriesOf(type) {
    return state.entries.filter(entry => entry.type === type);
  }

  function typeLabel(type) {
    return TYPES[type]?.singular || type;
  }

  function compareEntries(a, b) {
    return Number(a.order || 0) - Number(b.order || 0) || a.name.localeCompare(b.name, "es", { sensitivity: "base" });
  }

  function siblingsOf(entry) {
    return state.entries.filter(candidate => candidate.type === entry.type && (candidate.parentId || null) === (entry.parentId || null)).sort(compareEntries);
  }

  function nextSiblingOrder(type, parentId = null) {
    const siblings = state.entries.filter(entry => entry.type === type && (entry.parentId || null) === (parentId || null));
    return siblings.length ? Math.max(...siblings.map(entry => Number(entry.order || 0))) + 1 : 0;
  }

  function renumberEntries(entries) {
    entries.forEach((entry, index) => { entry.order = index; });
  }

  function setSelected(id) {
    cancelConnectionMode(false);
    pendingLocationItemTargetId = "";
    const entry = state.entries.find(candidate => candidate.id === id);
    if (entry) activeCollectionType = entry.type;
    state.selectedId = id;
    state.view = "notebook";
    saveState();
    render();
  }

  function selectEntryForPanel(id) {
    const entry = state.entries.find(candidate => candidate.id === id);
    if (!entry) return null;
    activeCollectionType = entry.type;
    state.selectedId = entry.id;
    saveState();
    renderEditor();
    return entry;
  }

  function clearEntryForPanel() {
    state.selectedId = "";
    saveState();
    renderEditor();
  }

  function updateSelected(patch, rerender = false) {
    const entry = selectedEntry();
    if (!entry) return;
    Object.assign(entry, patch, { updatedAt: now() });
    saveState();
    if (rerender) render();
  }

  function render() {
    document.documentElement.dataset.theme = profile.theme || "dark";
    els.globalSearch.value = state.search || "";
    renderCampaignControls();
    renderView();
    renderColumns();
    renderEditor();
    renderCalendar();
    renderMindMap();
    renderDice();
    window.ForjaAtlas?.render?.();
    renderConnectionModeState();
  }

  function renderCampaignControls() {
    els.campaignSelect.innerHTML = profile.campaigns.map(campaign => `<option value="${campaign.id}">${escapeHtml(campaign.campaignName)}</option>`).join("");
    els.campaignSelect.value = state.id;
  }

  function renderCampaignManager() {
    els.campaignList.replaceChildren();
    profile.campaigns.forEach(campaign => {
      const row = document.createElement("article");
      row.className = `campaign-row${campaign.id === state.id ? " is-active" : ""}`;
      const main = document.createElement("div");
      main.className = "campaign-row__main";
      const input = document.createElement("input");
      input.className = "campaign-row__name";
      input.value = campaign.campaignName;
      input.maxLength = 60;
      input.setAttribute("aria-label", `Nombre de ${campaign.campaignName}`);
      const meta = document.createElement("span");
      meta.className = "campaign-row__meta";
      meta.textContent = `${campaign.entries.length} entradas · ${campaign.calendarEvents.length} eventos${campaign.id === state.id ? " · Actual" : ""}`;
      main.append(input, meta);

      const open = document.createElement("button");
      open.type = "button";
      open.className = "mini-action";
      open.textContent = campaign.id === state.id ? "Abierta" : "Abrir";
      open.disabled = campaign.id === state.id;

      const duplicate = document.createElement("button");
      duplicate.type = "button";
      duplicate.className = "mini-action";
      duplicate.title = "Duplicar campaña";
      duplicate.textContent = "⧉";

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "mini-action mini-action--danger";
      remove.title = "Eliminar campaña";
      remove.textContent = "×";
      remove.disabled = profile.campaigns.length === 1;

      input.addEventListener("input", () => {
        campaign.campaignName = input.value.trimStart() || "Campaña sin nombre";
        campaign.updatedAt = now();
        saveState();
        renderCampaignControls();
      });
      open.addEventListener("click", () => {
        els.campaignDialog.close();
        activateCampaign(campaign.id);
      });
      duplicate.addEventListener("click", () => duplicateCampaign(campaign.id));
      remove.addEventListener("click", () => deleteCampaign(campaign.id));

      row.append(main, open, duplicate, remove);
      els.campaignList.append(row);
    });
  }

  function activateCampaign(id) {
    const campaign = profile.campaigns.find(candidate => candidate.id === id);
    if (!campaign || campaign.id === state.id) return;
    cancelConnectionMode(false);
    pendingLocationItemTargetId = "";
    profile.activeCampaignId = campaign.id;
    state = campaign;
    activeCollectionType = state.entries.find(entry => entry.id === state.selectedId)?.type || "locations";
    saveState(true);
    render();
    document.dispatchEvent(new CustomEvent("forja:campaignchange", { detail: { campaignId: state.id } }));
  }

  function createCampaign(name) {
    const campaign = blankCampaign(name.trim() || "Nueva campaña");
    profile.campaigns.push(campaign);
    profile.activeCampaignId = campaign.id;
    state = campaign;
    activeCollectionType = "locations";
    els.newCampaignName.value = "";
    saveState(true);
    renderCampaignManager();
    render();
    document.dispatchEvent(new CustomEvent("forja:campaignchange", { detail: { campaignId: state.id, created: true } }));
  }

  function duplicateCampaign(id) {
    const source = profile.campaigns.find(campaign => campaign.id === id);
    if (!source) return;
    const copy = normaliseCampaign(clone(source), `${source.campaignName} (copia)`);
    copy.id = uid();
    copy.campaignName = `${source.campaignName} (copia)`;
    copy.createdAt = copy.updatedAt = now();
    profile.campaigns.push(copy);
    saveState(true);
    renderCampaignManager();
    renderCampaignControls();
  }

  function deleteCampaign(id) {
    if (profile.campaigns.length <= 1) return;
    const campaign = profile.campaigns.find(candidate => candidate.id === id);
    if (!campaign || !confirm(`¿Eliminar la campaña “${campaign.campaignName}” y todos sus datos?`)) return;
    profile.campaigns = profile.campaigns.filter(candidate => candidate.id !== id);
    if (state.id === id) {
      state = profile.campaigns[0];
      profile.activeCampaignId = state.id;
      activeCollectionType = state.entries.find(entry => entry.id === state.selectedId)?.type || "locations";
    }
    saveState(true);
    renderCampaignManager();
    render();
  }

  function renderView() {
    if (state.view !== "atlas") window.ForjaAtlas?.closeDmSheet?.();
    els.notebookView.hidden = state.view !== "notebook";
    els.calendarView.hidden = state.view !== "calendar";
    els.mindmapView.hidden = state.view !== "mindmap";
    els.diceView.hidden = state.view !== "dice";
    if (els.atlasView) els.atlasView.hidden = state.view !== "atlas";
    if (els.dungeonView) els.dungeonView.hidden = state.view !== "dungeon";
    els.viewTabs.forEach(tab => tab.classList.toggle("is-active", tab.dataset.view === state.view));
  }

  function renderCollectionTabs() {
    if (!TYPES[activeCollectionType]) activeCollectionType = "locations";
    els.collectionTabs.replaceChildren();
    Object.entries(TYPES).forEach(([type, meta]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `collection-tab${type === activeCollectionType ? " is-active" : ""}`;
      button.dataset.type = type;
      button.setAttribute("aria-selected", type === activeCollectionType ? "true" : "false");
      button.title = meta.label;
      button.innerHTML = `<span aria-hidden="true">${escapeHtml(meta.icon)}</span><small>${escapeHtml(meta.label)}</small>`;
      button.addEventListener("click", () => {
        activeCollectionType = type;
        renderColumns();
      });
      els.collectionTabs.append(button);
    });
  }

  function renderColumns() {
    renderCollectionTabs();
    els.columns.replaceChildren();
    Object.entries(TYPES).forEach(([type, meta]) => {
      const fragment = $("#collectionTemplate").content.cloneNode(true);
      const column = $(".collection-column", fragment);
      column.dataset.type = type;
      column.classList.toggle("is-mobile-active", type === activeCollectionType);
      const items = $(".collection-items", fragment);
      $(".collection-icon", fragment).textContent = meta.icon;
      $(".collection-title", fragment).textContent = meta.label;
      $(".collection-count", fragment).textContent = entriesOf(type).length;
      $(".add-item", fragment).addEventListener("click", () => openCreateDialog(type));

      const matches = filterEntries(entriesOf(type));
      if (!matches.length) {
        items.innerHTML = `<div class="no-results">${state.search ? "Sin coincidencias" : "Todavía no hay entradas"}</div>`;
      } else {
        renderTree(items, type, matches);
      }
      els.columns.append(fragment);
    });
  }

  function filterEntries(entries) {
    const query = (state.search || "").trim().toLocaleLowerCase("es");
    if (!query) return entries;
    const direct = new Set(entries.filter(entry => {
      const subtype = subtypeMeta(entry.type, entry.subtype).label;
      const obtainable = (entry.obtainableItems || []).map(item => `${item.name} ${item.how} ${rarityLabel(item.rarity)}`).join(" ");
      return `${entry.name} ${htmlToText(entry.descriptionHtml)} ${subtype} ${obtainable}`.toLocaleLowerCase("es").includes(query);
    }).map(entry => entry.id));
    const byId = new Map(entries.map(entry => [entry.id, entry]));
    [...direct].forEach(id => {
      let cursor = byId.get(id);
      while (cursor?.parentId) {
        direct.add(cursor.parentId);
        cursor = byId.get(cursor.parentId);
      }
    });
    return entries.filter(entry => direct.has(entry.id));
  }

  function renderTree(container, type, visibleEntries) {
    const all = entriesOf(type);
    const visibleIds = new Set(visibleEntries.map(entry => entry.id));
    const byParent = new Map();
    all.forEach(entry => {
      const key = entry.parentId || "root";
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key).push(entry);
    });
    byParent.forEach(list => list.sort(compareEntries));

    const walk = (parentId, depth) => {
      for (const entry of byParent.get(parentId || "root") || []) {
        if (!visibleIds.has(entry.id)) continue;
        const children = (byParent.get(entry.id) || []).filter(child => visibleIds.has(child.id));
        container.append(makeRow(entry, depth, children.length > 0));
        if (children.length && (!entry.collapsed || state.search)) walk(entry.id, depth + 1);
      }
    };
    walk(null, 0);
  }

  function isCrossedOut(entry) {
    return ["destroyed", "dead", "dissolved", "irrelevant"].includes(entry.status);
  }

  function makeRow(entry, depth, hasChildren) {
    const row = document.createElement("div");
    const pickingMode = connectionMode || locationItemPickMode;
    const pickSourceId = connectionMode ? connectionSourceId : locationItemSourceId;
    row.className = `tree-row${entry.id === state.selectedId ? " is-selected" : ""}${isCrossedOut(entry) ? " is-crossed" : ""}${pickingMode && entry.id === pickSourceId ? " is-connection-source" : ""}`;
    row.style.setProperty("--depth", depth);
    row.dataset.id = entry.id;
    row.draggable = true;

    const drag = document.createElement("span");
    drag.className = "row-drag";
    drag.textContent = "⠿";
    drag.title = "Arrastra para reordenar";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = `row-toggle${hasChildren ? "" : " is-placeholder"}`;
    toggle.textContent = entry.collapsed ? "›" : "⌄";
    toggle.title = entry.collapsed ? "Expandir" : "Contraer";
    toggle.addEventListener("click", event => {
      event.stopPropagation();
      entry.collapsed = !entry.collapsed;
      saveState();
      renderColumns();
    });

    const subtype = subtypeMeta(entry.type, entry.subtype);
    const icon = document.createElement("span");
    icon.className = "row-icon";
    setSubtypeIcon(icon, entry.type, entry.subtype);
    icon.title = subtype.label;

    const name = document.createElement("span");
    name.className = "row-name";
    name.textContent = entry.name;

    const menu = document.createElement("button");
    menu.type = "button";
    menu.className = "row-menu";
    menu.textContent = "⋮";
    menu.title = "Acciones";
    menu.addEventListener("click", event => {
      event.stopPropagation();
      if (!connectionMode && !locationItemPickMode) openActionsDialog(entry.id);
    });

    row.append(drag, toggle, icon, name, menu);
    row.addEventListener("click", () => {
      if (connectionMode) pickConnectionTarget(entry.id);
      else if (locationItemPickMode) pickLocationItemTarget(entry.id);
      else setSelected(entry.id);
    });
    row.addEventListener("dblclick", event => {
      if (!connectionMode && !locationItemPickMode) {
        event.preventDefault();
        renameEntry(entry.id);
      }
    });

    row.addEventListener("dragstart", event => {
      if (connectionMode || locationItemPickMode) {
        event.preventDefault();
        return;
      }
      draggedEntryId = entry.id;
      row.classList.add("is-dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", entry.id);
    });
    row.addEventListener("dragover", event => {
      const source = state.entries.find(candidate => candidate.id === draggedEntryId);
      if (!source || source.id === entry.id || source.type !== entry.type || (source.parentId || null) !== (entry.parentId || null)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      const after = event.clientY > row.getBoundingClientRect().top + row.getBoundingClientRect().height / 2;
      row.classList.toggle("is-drop-before", !after);
      row.classList.toggle("is-drop-after", after);
    });
    row.addEventListener("dragleave", () => row.classList.remove("is-drop-before", "is-drop-after"));
    row.addEventListener("drop", event => {
      event.preventDefault();
      const sourceId = draggedEntryId || event.dataTransfer.getData("text/plain");
      const after = row.classList.contains("is-drop-after");
      row.classList.remove("is-drop-before", "is-drop-after");
      reorderRelative(sourceId, entry.id, after);
    });
    row.addEventListener("dragend", () => {
      draggedEntryId = null;
      $$(".tree-row").forEach(candidate => candidate.classList.remove("is-dragging", "is-drop-before", "is-drop-after"));
    });
    return row;
  }

  function reorderRelative(sourceId, targetId, after = false) {
    const source = state.entries.find(entry => entry.id === sourceId);
    const target = state.entries.find(entry => entry.id === targetId);
    if (!source || !target || source.id === target.id || source.type !== target.type || (source.parentId || null) !== (target.parentId || null)) return;
    const siblings = siblingsOf(source).filter(entry => entry.id !== source.id);
    const targetIndex = siblings.findIndex(entry => entry.id === target.id);
    siblings.splice(Math.max(0, targetIndex + (after ? 1 : 0)), 0, source);
    renumberEntries(siblings);
    source.updatedAt = now();
    saveState(true);
    renderColumns();
  }

  function moveEntry(id, direction) {
    const entry = state.entries.find(candidate => candidate.id === id);
    if (!entry) return;
    const siblings = siblingsOf(entry);
    const index = siblings.findIndex(candidate => candidate.id === entry.id);
    const destination = index + direction;
    if (destination < 0 || destination >= siblings.length) return;
    [siblings[index], siblings[destination]] = [siblings[destination], siblings[index]];
    renumberEntries(siblings);
    entry.updatedAt = now();
    saveState(true);
    renderColumns();
  }

  function renderEditor() {
    const entry = selectedEntry();
    els.emptyState.hidden = Boolean(entry);
    els.editor.hidden = !entry;
    if (!entry) return;

    const subtypes = TYPES[entry.type].subtypes;
    els.entrySubtype.innerHTML = subtypes.map(([value, icon, label]) => `<option value="${value}">${value === "main" && entry.type === "quests" ? "◯ ?" : icon} ${escapeHtml(label)}</option>`).join("");
    els.entrySubtype.value = entry.subtype;

    els.entryStatus.innerHTML = STATUS_OPTIONS[entry.type].map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`).join("");
    els.entryStatus.value = entry.status;

    els.entryName.value = entry.name;
    setSubtypeIcon(els.entryHeadingIcon, entry.type, entry.subtype);
    if (document.activeElement !== els.entryDescription) {
      entry.descriptionMarkdown ??= htmlToMarkdown(entry.descriptionHtml || "");
      els.entryDescription.value = entry.descriptionMarkdown;
      els.descriptionPreview.innerHTML = markdownToHtml(entry.descriptionMarkdown);
    }

    els.creaturePanel.hidden = entry.type !== "creatures";
    if (entry.type === "creatures") renderCreatureStats(entry);
    const isSeller = isSalesEntry(entry);
    els.vendorPanel.hidden = !isSeller;
    if (isSeller) renderVendorItems(entry);

    const isLocation = entry.type === "locations";
    const isThing = entry.type === "things";
    els.locationLootPanel.hidden = !isLocation;
    els.thingDetailsPanel.hidden = !isThing;
    els.carryItemsPanel.hidden = isLocation || isThing;
    if (isLocation) renderLocationItems(entry);
    else if (isThing) renderThingDetails(entry);
    else renderConsumables(entry);
    renderConnections(entry);
    renderJournal(entry);
  }

  function renderCreatureStats(entry) {
    entry.stats ||= defaultStats();
    $("#statHp").value = entry.stats.hp;
    $("#statMaxHp").value = entry.stats.maxhp;
    $("#statAc").value = entry.stats.ac;
    $("#statSpeed").value = entry.stats.speed;
    if (!Number.isFinite(Number(entry.stats.initiative))) {
      entry.stats.initiative = Math.floor((Number(entry.stats.dex ?? 10) - 10) / 2);
    }
    $("#statInitiative").value = entry.stats.initiative;
    const abilityRoot = $("#abilities");
    abilityRoot.replaceChildren();
    ABILITIES.forEach(([key, label]) => {
      const box = document.createElement("label");
      box.className = "ability";
      box.innerHTML = `<strong>${label}</strong><input type="number" min="1" max="30" data-stat="${key}" value="${Number(entry.stats[key] ?? 10)}"><output>${formatModifier(entry.stats[key])}</output>`;
      const input = $("input", box);
      const output = $("output", box);
      input.addEventListener("input", () => {
        entry.stats[key] = Number(input.value || 0);
        output.textContent = formatModifier(entry.stats[key]);
        entry.updatedAt = now();
        saveState();
      });
      abilityRoot.append(box);
    });
  }

  function formatModifier(value) {
    const modifier = Math.floor((Number(value || 0) - 10) / 2);
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  }

  function renderVendorItems(entry) {
    entry.vendorItems ||= [];
    els.vendorItemsList.replaceChildren();
    if (!entry.vendorItems.length) {
      els.vendorItemsList.innerHTML = '<div class="empty-list merchant-empty">Todavía no hay artículos a la venta.</div>';
      return;
    }

    entry.vendorItems.forEach(rawItem => {
      const item = Object.assign(rawItem, normaliseVendorItem(rawItem));
      const row = document.createElement("div");
      row.className = "merchant-table-row";

      const nameLabel = document.createElement("label");
      nameLabel.innerHTML = `<span class="sr-only">Nombre del artículo</span><input data-field="name" maxlength="100" value="${escapeHtml(item.name)}" placeholder="Nombre">`;

      const priceLabel = document.createElement("label");
      priceLabel.className = "merchant-price-label";
      const priceControl = renderCurrencyControl(item);
      priceLabel.append(priceControl.wrapper);

      const descriptionLabel = document.createElement("label");
      descriptionLabel.innerHTML = `<span class="sr-only">Descripción</span><input data-field="description" maxlength="240" value="${escapeHtml(item.description)}" placeholder="Descripción">`;

      const remove = document.createElement("button");
      remove.className = "card-remove";
      remove.type = "button";
      remove.title = "Eliminar artículo";
      remove.setAttribute("aria-label", "Eliminar artículo");
      remove.textContent = "×";

      row.append(nameLabel, priceLabel, descriptionLabel, remove);

      $$("input[data-field]", row).forEach(input => input.addEventListener("input", () => {
        item[input.dataset.field] = input.value;
        entry.updatedAt = now();
        saveState();
      }));
      priceControl.amount.addEventListener("input", () => {
        item.priceAmount = Math.max(0, Number(priceControl.amount.value || 0));
        entry.updatedAt = now();
        saveState();
      });
      priceControl.select.addEventListener("change", () => {
        item.currency = priceControl.select.value;
        entry.updatedAt = now();
        saveState();
      });
      remove.addEventListener("click", () => {
        entry.vendorItems = entry.vendorItems.filter(candidate => candidate.id !== item.id);
        entry.updatedAt = now();
        saveState();
        renderVendorItems(entry);
      });
      els.vendorItemsList.append(row);
    });
  }

  function renderLocationItems(entry) {
    entry.obtainableItems ||= [];
    els.locationItemsList.replaceChildren();
    if (!entry.obtainableItems.length) {
      els.locationItemsList.innerHTML = '<div class="empty-list loot-empty">Todavía no hay items que se puedan conseguir aquí.</div>';
    } else {
      entry.obtainableItems.forEach(item => {
        const row = document.createElement("div");
        row.className = "loot-table-row";

        const nameLabel = document.createElement("label");
        nameLabel.innerHTML = `<span class="sr-only">Nombre del item</span><input data-field="name" maxlength="100" value="${escapeHtml(item.name)}" placeholder="Nombre">`;
        const rarityLabelElement = document.createElement("label");
        const raritySelect = document.createElement("select");
        raritySelect.setAttribute("aria-label", "Rareza del item");
        raritySelect.innerHTML = RARITY_OPTIONS.map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`).join("");
        raritySelect.value = item.rarity || "common";
        rarityLabelElement.append(raritySelect);
        const howLabel = document.createElement("label");
        howLabel.innerHTML = `<span class="sr-only">Cómo conseguirlo</span><input data-field="how" maxlength="240" value="${escapeHtml(item.how)}" placeholder="Cómo conseguirlo">`;

        const related = state.entries.find(candidate => candidate.id === item.relatedId);
        const targetButton = document.createElement("button");
        targetButton.type = "button";
        targetButton.className = `relation-picker-field${related ? " has-target" : ""}`;
        targetButton.textContent = related ? `${subtypeMeta(related.type, related.subtype).icon} ${related.name}` : "✦ Elegir relación";
        targetButton.title = related ? "Cambiar entrada relacionada" : "Elegir una entrada relacionada";
        targetButton.addEventListener("click", () => startLocationItemPick(item.id));

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "card-remove";
        remove.title = "Eliminar item";
        remove.setAttribute("aria-label", "Eliminar item");
        remove.textContent = "×";

        $$('input[data-field]', nameLabel).concat($$('input[data-field]', howLabel)).forEach(input => input.addEventListener("input", () => {
          item[input.dataset.field] = input.value;
          entry.updatedAt = now();
          saveState();
        }));
        raritySelect.addEventListener("change", () => {
          item.rarity = raritySelect.value;
          entry.updatedAt = now();
          saveState();
        });
        remove.addEventListener("click", () => {
          entry.obtainableItems = entry.obtainableItems.filter(candidate => candidate.id !== item.id);
          entry.updatedAt = now();
          saveState();
          renderLocationItems(entry);
          if (state.view === "mindmap") renderMindMap();
        });

        row.append(nameLabel, rarityLabelElement, howLabel, targetButton, remove);
        els.locationItemsList.append(row);
      });
    }
    updateLocationItemTargetButton();
  }

  function updateLocationItemTargetButton() {
    const target = state.entries.find(entry => entry.id === pendingLocationItemTargetId);
    els.locationItemTargetButton.classList.toggle("has-target", Boolean(target));
    els.locationItemTargetButton.textContent = target
      ? `${subtypeMeta(target.type, target.subtype).icon} ${target.name}`
      : "✦ Elegir relación";
  }

  function renderThingDetails(entry) {
    entry.thingDetails = normaliseThingDetails(entry.thingDetails || {});
    renderThingDetailList(entry, "location", els.thingLocationList, "Todavía no has añadido ninguna ubicación.");
    renderThingDetailList(entry, "lore", els.thingLoreList, "Todavía no has añadido ninguna leyenda o información.");
    renderThingDetailList(entry, "abilities", els.thingAbilitiesList, "Todavía no has añadido ninguna habilidad.");
  }

  function renderThingDetailList(entry, field, root, emptyText) {
    const items = entry.thingDetails[field];
    root.replaceChildren();
    if (!items.length) {
      root.innerHTML = `<div class="empty-list thing-detail-empty">${escapeHtml(emptyText)}</div>`;
      return;
    }

    items.forEach((item, index) => {
      const card = document.createElement("article");
      card.className = "thing-detail-card";
      card.innerHTML = `
        <span class="thing-detail-card__order" aria-label="Posición ${index + 1}">${index + 1}</span>
        <p>${escapeHtml(item.text)}</p>
        <div class="thing-detail-card__actions" aria-label="Ordenar o eliminar">
          <button type="button" class="thing-detail-move" data-direction="up" title="Subir" aria-label="Subir" ${index === 0 ? "disabled" : ""}>↑</button>
          <button type="button" class="thing-detail-move" data-direction="down" title="Bajar" aria-label="Bajar" ${index === items.length - 1 ? "disabled" : ""}>↓</button>
          <button type="button" class="card-remove" title="Eliminar" aria-label="Eliminar">×</button>
        </div>`;

      $$(".thing-detail-move", card).forEach(button => button.addEventListener("click", () => {
        const nextIndex = button.dataset.direction === "up" ? index - 1 : index + 1;
        if (nextIndex < 0 || nextIndex >= items.length) return;
        [items[index], items[nextIndex]] = [items[nextIndex], items[index]];
        entry.updatedAt = now();
        saveState();
        renderThingDetailList(entry, field, root, emptyText);
      }));

      $(".card-remove", card).addEventListener("click", () => {
        entry.thingDetails[field] = items.filter(candidate => candidate.id !== item.id);
        entry.updatedAt = now();
        saveState();
        renderThingDetailList(entry, field, root, emptyText);
      });
      root.append(card);
    });
  }

  function addThingDetail(field, input) {
    const entry = selectedEntry();
    const text = input.value.trim();
    if (!entry || entry.type !== "things" || !text) return;
    entry.thingDetails = normaliseThingDetails(entry.thingDetails || {});
    entry.thingDetails[field].push({ id: uid(), text });
    input.value = "";
    entry.updatedAt = now();
    saveState();
    renderThingDetails(entry);
    input.focus();
  }

  function renderConsumables(entry) {
    els.consumablesList.replaceChildren();
    if (!entry.consumables?.length) {
      els.consumablesList.innerHTML = '<div class="empty-list">No lleva ningún item encima.</div>';
      return;
    }
    entry.consumables.forEach(item => {
      const card = document.createElement("div");
      card.className = "item-card";
      card.innerHTML = `<span>${escapeHtml(item.text)}</span><button class="card-remove" type="button" title="Eliminar">×</button>`;
      $("button", card).addEventListener("click", () => {
        entry.consumables = entry.consumables.filter(candidate => candidate.id !== item.id);
        entry.updatedAt = now();
        saveState();
        renderConsumables(entry);
      });
      els.consumablesList.append(card);
    });
  }

  function renderConnections(entry) {
    els.connectionsList.replaceChildren();
    const connections = entry.connections || [];
    const atlasReferences = (state.atlas?.scenes || []).flatMap(scene =>
      (scene.markers || [])
        .filter(marker => (marker.relatedEntryIds || []).includes(entry.id))
        .map(marker => ({ scene, marker }))
    );
    if (!connections.length && !atlasReferences.length) {
      els.connectionsList.innerHTML = '<div class="empty-list">No hay conexiones.</div>';
      return;
    }
    connections.forEach(connection => {
      const target = state.entries.find(candidate => candidate.id === connection.targetId);
      const card = document.createElement("div");
      card.className = "connection-card";
      if (!target) {
        card.innerHTML = '<span>Entrada eliminada</span><button class="card-remove" type="button">×</button>';
      } else {
        const targetSubtype = subtypeMeta(target.type, target.subtype);
        const sentence = document.createElement("div");
        sentence.className = "connection-card__sentence";
        sentence.innerHTML = `<span class="connection-card__source">${escapeHtml(entry.name)}</span> <span class="connection-card__label">${escapeHtml(connection.label || "se relaciona con")}</span> `;
        const link = document.createElement("button");
        link.type = "button";
        link.className = "connection-card__link";
        link.textContent = target.name;
        link.addEventListener("click", () => setSelected(target.id));
        const meta = document.createElement("small");
        meta.className = "connection-card__type";
        meta.textContent = `${targetSubtype.icon} ${targetSubtype.label} · ${TYPES[target.type].label}`;
        sentence.append(link, meta);
        card.append(sentence);
        const remove = document.createElement("button");
        remove.className = "card-remove";
        remove.type = "button";
        remove.title = "Eliminar conexión";
        remove.textContent = "×";
        card.append(remove);
      }
      $(".card-remove", card).addEventListener("click", () => {
        entry.connections = entry.connections.filter(candidate => candidate.id !== connection.id);
        entry.updatedAt = now();
        saveState();
        renderConnections(entry);
      });
      els.connectionsList.append(card);
    });

    atlasReferences.forEach(({ scene, marker }) => {
      const card = document.createElement("div");
      card.className = "connection-card connection-card--atlas";
      const sentence = document.createElement("div");
      sentence.className = "connection-card__sentence";
      sentence.innerHTML = `<span class="connection-card__source">${escapeHtml(entry.name)}</span> <span class="connection-card__label">aparece en el Atlas como</span> `;
      const link = document.createElement("button");
      link.type = "button";
      link.className = "connection-card__link";
      link.textContent = marker.name;
      link.addEventListener("click", () => {
        state.atlas.currentSceneId = scene.id;
        state.view = "atlas";
        saveState();
        renderView();
        window.ForjaAtlas?.render?.();
      });
      const meta = document.createElement("small");
      meta.className = "connection-card__type";
      meta.textContent = `⌖ ${scene.name} · Marcador del Atlas`;
      sentence.append(link, meta);
      const remove = document.createElement("button");
      remove.className = "card-remove";
      remove.type = "button";
      remove.title = "Quitar relación con el Atlas";
      remove.textContent = "×";
      remove.addEventListener("click", () => {
        marker.relatedEntryIds = (marker.relatedEntryIds || []).filter(id => id !== entry.id);
        saveState();
        window.ForjaAtlas?.publish?.();
        renderConnections(entry);
      });
      card.append(sentence, remove);
      els.connectionsList.append(card);
    });
  }

  function renderJournal(entry) {
    els.journalList.replaceChildren();
    if (!entry.journal?.length) {
      els.journalList.innerHTML = '<div class="empty-list">El journal está vacío.</div>';
      return;
    }
    [...entry.journal].reverse().forEach(note => {
      const card = document.createElement("article");
      card.className = "journal-entry";
      const date = new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(new Date(note.createdAt));
      card.innerHTML = `<div class="journal-entry__content"><p>${escapeHtml(note.text)}</p><time>${date}</time></div><button class="card-remove" type="button" title="Eliminar nota">×</button>`;
      $("button", card).addEventListener("click", () => {
        entry.journal = entry.journal.filter(candidate => candidate.id !== note.id);
        entry.updatedAt = now();
        saveState();
        renderJournal(entry);
      });
      els.journalList.append(card);
    });
  }

  function renderConnectionModeState() {
    const picking = connectionMode || locationItemPickMode;
    document.body.classList.toggle("is-connection-picking", picking);
    els.connectionModeBanner.hidden = !picking;
    els.cancelConnectionBtn.hidden = !connectionMode;
    els.startConnectionBtn.hidden = picking;

    if (connectionMode) {
      els.selectionModeText.innerHTML = "<strong>Modo conexión:</strong> pulsa cualquier entrada de las cinco columnas.";
      els.connectionModeHint.textContent = "Pulsa una entrada de cualquier columna para usarla como destino.";
    } else if (locationItemPickMode) {
      els.selectionModeText.innerHTML = "<strong>Relacionar item:</strong> pulsa la entrada vinculada al hallazgo.";
      els.connectionModeHint.textContent = "Termina primero de relacionar el item obtenible.";
    } else {
      els.connectionModeHint.textContent = "Después podrás elegir cualquier entrada de la izquierda.";
    }
  }

  function startConnectionMode() {
    const source = selectedEntry();
    if (!source) return;
    cancelConnectionMode(false);
    connectionMode = true;
    connectionSourceId = source.id;
    connectionTargetId = null;
    renderColumns();
    renderConnectionModeState();
  }

  function startLocationItemPick(itemId = null) {
    const source = selectedEntry();
    if (!source || source.type !== "locations") return;
    cancelConnectionMode(false);
    locationItemPickMode = true;
    locationItemSourceId = source.id;
    locationItemEditingId = itemId;
    renderColumns();
    renderConnectionModeState();
  }

  function cancelConnectionMode(rerender = true) {
    connectionMode = false;
    connectionSourceId = null;
    connectionTargetId = null;
    locationItemPickMode = false;
    locationItemSourceId = null;
    locationItemEditingId = null;
    renderConnectionModeState();
    if (rerender) renderColumns();
  }

  function pickConnectionTarget(targetId) {
    if (!connectionMode) return;
    const source = state.entries.find(entry => entry.id === connectionSourceId);
    const target = state.entries.find(entry => entry.id === targetId);
    if (!source || !target) {
      cancelConnectionMode();
      return;
    }
    if (source.id === target.id) {
      alert("Selecciona una entrada distinta.");
      return;
    }
    connectionMode = false;
    connectionTargetId = target.id;
    renderColumns();
    renderConnectionModeState();
    els.connectionSourceName.textContent = source.name;
    els.connectionTargetName.textContent = target.name;
    els.connectionRelation.value = "";
    els.connectionDialog.showModal();
    setTimeout(() => els.connectionRelation.focus(), 0);
  }

  function pickLocationItemTarget(targetId) {
    if (!locationItemPickMode) return;
    const source = state.entries.find(entry => entry.id === locationItemSourceId);
    const target = state.entries.find(entry => entry.id === targetId);
    if (!source || source.type !== "locations" || !target) {
      cancelConnectionMode();
      return;
    }
    if (source.id === target.id) {
      alert("Relaciona el item con una entrada distinta de la localización abierta.");
      return;
    }

    if (locationItemEditingId) {
      const item = (source.obtainableItems || []).find(candidate => candidate.id === locationItemEditingId);
      if (item) {
        item.relatedId = target.id;
        source.updatedAt = now();
        saveState(true);
      }
    } else {
      pendingLocationItemTargetId = target.id;
    }

    cancelConnectionMode(false);
    renderColumns();
    if (state.selectedId === source.id) renderLocationItems(source);
    renderConnectionModeState();
    renderMindMap();
  }

  function closeConnectionDialog() {
    if (els.connectionDialog.open) els.connectionDialog.close();
    connectionSourceId = null;
    connectionTargetId = null;
  }

  function createConnection() {
    const source = state.entries.find(entry => entry.id === connectionSourceId);
    const target = state.entries.find(entry => entry.id === connectionTargetId);
    const label = els.connectionRelation.value.trim();
    if (!source || !target || !label) return;
    source.connections ||= [];
    if (source.connections.some(connection => connection.targetId === target.id && connection.label.toLocaleLowerCase("es") === label.toLocaleLowerCase("es"))) {
      alert("Esa conexión ya existe.");
      return;
    }
    source.connections.push({ id: uid(), targetId: target.id, label });
    source.updatedAt = now();
    saveState(true);
    closeConnectionDialog();
    if (state.selectedId === source.id) renderConnections(source);
    renderMindMap();
  }

  function treeOrderedEntries(type, excludedIds = new Set()) {
    const all = entriesOf(type).filter(entry => !excludedIds.has(entry.id));
    const byParent = new Map();
    all.forEach(entry => {
      const key = all.some(candidate => candidate.id === entry.parentId) ? entry.parentId : "root";
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key).push(entry);
    });
    byParent.forEach(list => list.sort(compareEntries));
    const result = [];
    const walk = (parentId, depth) => {
      (byParent.get(parentId || "root") || []).forEach(entry => {
        result.push({ entry, depth });
        walk(entry.id, depth + 1);
      });
    };
    walk(null, 0);
    return result;
  }

  function openCreateDialog(type, presetParent = null) {
    cancelConnectionMode(false);
    dialogType = type;
    els.dialogTitle.textContent = `Nueva ${TYPES[type].singular.toLocaleLowerCase("es")}`;
    els.newItemName.value = "";
    els.newItemSubtype.innerHTML = TYPES[type].subtypes.map(([value, icon, label]) => `<option value="${value}">${icon} ${escapeHtml(label)}</option>`).join("");
    els.newItemSubtype.value = defaultSubtype(type);

    const current = selectedEntry();
    const defaultParent = presetParent ?? (current?.type === type ? current.id : "");
    const options = treeOrderedEntries(type).map(({ entry, depth }) => `<option value="${entry.id}">${"— ".repeat(depth)}${escapeHtml(entry.name)}</option>`).join("");
    els.newItemParent.innerHTML = `<option value="">Raíz / sin padre</option>${options}`;
    els.newItemParent.value = defaultParent || "";
    els.itemDialog.showModal();
    setTimeout(() => els.newItemName.focus(), 0);
  }

  function createEntry(type, name, parentId = null, subtype = null) {
    const entry = makeEntry(type, name.trim(), parentId || null, "", subtype);
    entry.order = nextSiblingOrder(type, entry.parentId);
    state.entries.push(entry);
    activeCollectionType = type;
    state.selectedId = entry.id;
    state.view = "notebook";
    saveState(true);
    render();
  }

  function openActionsDialog(id) {
    const entry = state.entries.find(candidate => candidate.id === id);
    if (!entry) return;
    actionEntryId = id;
    els.actionsTitle.textContent = entry.name;
    els.actionsDialog.scrollTop = 0;
    els.actionsDialog.scrollLeft = 0;
    els.actionsDialog.showModal();
    requestAnimationFrame(() => {
      els.actionsDialog.scrollTop = 0;
      els.actionsDialog.scrollLeft = 0;
    });
  }

  function renameEntry(id) {
    const entry = state.entries.find(candidate => candidate.id === id);
    if (!entry) return;
    const name = prompt("Nuevo nombre", entry.name)?.trim();
    if (!name) return;
    entry.name = name;
    entry.updatedAt = now();
    saveState();
    render();
  }

  function duplicateEntry(id) {
    const source = state.entries.find(candidate => candidate.id === id);
    if (!source) return;
    const copy = clone(source);
    copy.id = uid();
    copy.name = `${source.name} (copia)`;
    copy.order = nextSiblingOrder(source.type, source.parentId);
    copy.createdAt = copy.updatedAt = now();
    copy.connections = [];
    copy.consumables = (copy.consumables || []).map(item => ({ ...item, id: uid() }));
    copy.obtainableItems = (copy.obtainableItems || []).map(item => ({ ...item, id: uid() }));
    copy.vendorItems = (copy.vendorItems || []).map(item => ({ ...item, id: uid() }));
    copy.journal = (copy.journal || []).map(note => ({ ...note, id: uid() }));
    state.entries.push(copy);
    activeCollectionType = copy.type;
    state.selectedId = copy.id;
    saveState(true);
    render();
  }

  function descendantsOf(id) {
    const result = [];
    const walk = parentId => state.entries.filter(entry => entry.parentId === parentId).forEach(child => {
      result.push(child.id);
      walk(child.id);
    });
    walk(id);
    return result;
  }

  function deleteEntry(id) {
    const entry = state.entries.find(candidate => candidate.id === id);
    if (!entry) return;
    const descendants = descendantsOf(id);
    const extra = descendants.length ? ` También se eliminarán ${descendants.length} entradas hijas.` : "";
    if (!confirm(`¿Eliminar “${entry.name}”?${extra}`)) return;
    const ids = new Set([id, ...descendants]);
    state.entries = state.entries.filter(candidate => !ids.has(candidate.id));
    state.entries.forEach(candidate => {
      candidate.connections = (candidate.connections || []).filter(connection => !ids.has(connection.targetId));
      (candidate.obtainableItems || []).forEach(item => {
        if (ids.has(item.relatedId)) item.relatedId = "";
      });
    });
    state.calendarEvents.forEach(event => {
      if (ids.has(event.entryId)) event.entryId = "";
    });
    if (ids.has(state.selectedId)) state.selectedId = state.entries[0]?.id || null;
    cancelConnectionMode(false);
    assignSequentialOrders(state.entries);
    saveState(true);
    render();
  }

  function exportData() {
    saveState(true);
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "perfil-la-forja-del-narrador.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function campaignDateForDay(day, calendar = state.gameCalendar) {
    const safeCalendar = normaliseGameCalendar(calendar);
    const safeDay = Math.max(1, Math.trunc(Number(day) || 1));
    const zeroBasedDay = safeDay - 1;
    const monthOffset = Math.floor(zeroBasedDay / safeCalendar.daysPerMonth);
    const dayOfMonth = (zeroBasedDay % safeCalendar.daysPerMonth) + 1;
    const absoluteMonth = safeCalendar.startMonth + monthOffset;
    const year = Math.floor(absoluteMonth / GAME_MONTHS.length) + 1;
    const monthIndex = ((absoluteMonth % GAME_MONTHS.length) + GAME_MONTHS.length) % GAME_MONTHS.length;
    return { day: safeDay, dayOfMonth, monthOffset, monthIndex, monthName: GAME_MONTHS[monthIndex], year };
  }

  function campaignMonthForOffset(offset, calendar = state.gameCalendar) {
    const safeCalendar = normaliseGameCalendar(calendar);
    const safeOffset = Math.max(0, Math.trunc(Number(offset) || 0));
    const absoluteMonth = safeCalendar.startMonth + safeOffset;
    const year = Math.floor(absoluteMonth / GAME_MONTHS.length) + 1;
    const monthIndex = absoluteMonth % GAME_MONTHS.length;
    return { offset: safeOffset, monthIndex, monthName: GAME_MONTHS[monthIndex], year };
  }

  function currentCampaignMonthOffset() {
    state.gameCalendar = normaliseGameCalendar(state.gameCalendar);
    return Math.floor((state.gameCalendar.currentDay - 1) / state.gameCalendar.daysPerMonth);
  }

  function shiftCalendarMonth(delta) {
    state.gameCalendar = normaliseGameCalendar(state.gameCalendar);
    state.gameCalendar.cursorMonthOffset = Math.max(0, state.gameCalendar.cursorMonthOffset + delta);
    saveState();
    renderCalendar();
  }

  function renderCalendar() {
    state.gameCalendar = normaliseGameCalendar(state.gameCalendar);
    const calendar = state.gameCalendar;
    const cursor = campaignMonthForOffset(calendar.cursorMonthOffset, calendar);
    const current = campaignDateForDay(calendar.currentDay, calendar);
    els.calendarTitle.textContent = `${cursor.monthName} · Año ${cursor.year}`;
    els.calendarCampaignDay.textContent = `Día ${calendar.currentDay} de campaña · ${current.dayOfMonth} de ${current.monthName}, Año ${current.year}`;
    els.calendarPrev.disabled = calendar.cursorMonthOffset <= 0;
    els.calendarGrid.replaceChildren();

    const firstWeekdayOffset = (calendar.cursorMonthOffset * calendar.daysPerMonth) % 7;
    for (let index = 0; index < 42; index += 1) {
      const dayOfCursorMonth = index - firstWeekdayOffset + 1;
      const campaignDay = calendar.cursorMonthOffset * calendar.daysPerMonth + dayOfCursorMonth;
      const isBeforeCampaign = campaignDay < 1;
      const info = campaignDateForDay(Math.max(1, campaignDay), calendar);
      const outside = dayOfCursorMonth < 1 || dayOfCursorMonth > calendar.daysPerMonth;
      const isCurrent = campaignDay === calendar.currentDay;

      const cell = document.createElement("button");
      cell.type = "button";
      cell.disabled = isBeforeCampaign;
      cell.className = `calendar-day${outside ? " is-outside" : ""}${isCurrent ? " is-current-day" : ""}${isBeforeCampaign ? " is-before-campaign" : ""}`;
      cell.setAttribute("aria-label", isBeforeCampaign
        ? "Antes del comienzo de la campaña"
        : `Día ${campaignDay} de campaña, ${info.dayOfMonth} de ${info.monthName}, año ${info.year}`);

      const number = document.createElement("span");
      number.className = "calendar-day__number";
      number.textContent = isBeforeCampaign ? "—" : String(info.dayOfMonth);
      const campaignNumber = document.createElement("small");
      campaignNumber.className = "calendar-day__campaign-number";
      campaignNumber.textContent = isBeforeCampaign ? "" : `Día ${campaignDay}`;
      cell.append(number, campaignNumber);

      const events = state.calendarEvents
        .filter(event => Number(event.day) === campaignDay)
        .sort((a, b) => `${a.time || "99:99"}${a.title}`.localeCompare(`${b.time || "99:99"}${b.title}`, "es"));
      const list = document.createElement("span");
      list.className = "calendar-day__events";
      events.slice(0, 4).forEach(event => {
        const pill = document.createElement("span");
        pill.className = "calendar-event-pill";
        pill.innerHTML = `${event.time ? `<small>${escapeHtml(event.time)}</small>` : ""}<span>${escapeHtml(event.title)}</span>`;
        pill.addEventListener("click", clickEvent => {
          clickEvent.stopPropagation();
          openCalendarEventDialog(event.day, event.id);
        });
        list.append(pill);
      });
      if (events.length > 4) {
        const more = document.createElement("span");
        more.className = "calendar-more";
        more.textContent = `+${events.length - 4} más`;
        list.append(more);
      }
      cell.append(list);
      if (!isBeforeCampaign) cell.addEventListener("click", () => openCalendarEventDialog(campaignDay));
      els.calendarGrid.append(cell);
    }
  }

  function fillEventEntryOptions(selected = "") {
    const entries = [...state.entries].sort((a, b) => a.name.localeCompare(b.name, "es"));
    els.eventEntry.innerHTML = '<option value="">Sin relación</option>' + entries.map(entry => {
      const subtype = subtypeMeta(entry.type, entry.subtype);
      return `<option value="${entry.id}">${subtype.icon} ${escapeHtml(entry.name)} · ${escapeHtml(TYPES[entry.type].label)}</option>`;
    }).join("");
    els.eventEntry.value = selected || "";
  }

  function updateEventDayPreview() {
    const day = Math.max(1, Math.trunc(Number(els.eventDay.value) || 1));
    const info = campaignDateForDay(day);
    els.eventDayPreview.textContent = `Día ${day} de campaña · ${info.dayOfMonth} de ${info.monthName}, Año ${info.year}`;
  }

  function openCalendarEventDialog(day = state.gameCalendar.currentDay, eventId = null) {
    editingCalendarEventId = eventId;
    const event = state.calendarEvents.find(candidate => candidate.id === eventId);
    els.calendarEventDialogTitle.textContent = event ? "Editar evento" : "Nuevo evento";
    els.eventDay.value = String(event?.day || Math.max(1, Math.trunc(Number(day) || state.gameCalendar.currentDay)));
    els.eventTime.value = event?.time || "";
    els.eventTitle.value = event?.title || "";
    els.eventDescription.value = event?.description || "";
    fillEventEntryOptions(event?.entryId || "");
    updateEventDayPreview();
    els.deleteCalendarEvent.hidden = !event;
    els.calendarEventDialog.showModal();
    setTimeout(() => els.eventTitle.focus(), 0);
  }

  function saveCalendarEvent() {
    const title = els.eventTitle.value.trim();
    const day = Math.max(1, Math.trunc(Number(els.eventDay.value) || 0));
    if (!title || !day) return;
    const patch = {
      day,
      time: els.eventTime.value,
      title,
      description: els.eventDescription.value.trim(),
      entryId: els.eventEntry.value
    };
    const existing = state.calendarEvents.find(event => event.id === editingCalendarEventId);
    if (existing) Object.assign(existing, patch);
    else state.calendarEvents.push({ id: uid(), ...patch });
    state.gameCalendar.cursorMonthOffset = campaignDateForDay(day).monthOffset;
    saveState(true);
    els.calendarEventDialog.close();
    renderCalendar();
  }

  function deleteCalendarEvent() {
    if (!editingCalendarEventId) return;
    const event = state.calendarEvents.find(candidate => candidate.id === editingCalendarEventId);
    if (!event || !confirm(`¿Eliminar el evento “${event.title}”?`)) return;
    state.calendarEvents = state.calendarEvents.filter(candidate => candidate.id !== editingCalendarEventId);
    saveState(true);
    els.calendarEventDialog.close();
    renderCalendar();
  }

  function openCalendarSettings() {
    state.gameCalendar = normaliseGameCalendar(state.gameCalendar);
    els.calendarStartMonth.innerHTML = GAME_MONTHS.map((month, index) => `<option value="${index}">${month}</option>`).join("");
    els.calendarStartMonth.value = String(state.gameCalendar.startMonth);
    els.calendarDaysPerMonth.value = String(state.gameCalendar.daysPerMonth);
    els.calendarCurrentDay.value = String(state.gameCalendar.currentDay);
    els.calendarSettingsDialog.showModal();
  }

  function saveCalendarSettings() {
    state.gameCalendar = normaliseGameCalendar({
      startMonth: els.calendarStartMonth.value,
      daysPerMonth: els.calendarDaysPerMonth.value,
      currentDay: els.calendarCurrentDay.value,
      cursorMonthOffset: 0
    });
    state.gameCalendar.cursorMonthOffset = currentCampaignMonthOffset();
    saveState(true);
    els.calendarSettingsDialog.close();
    renderCalendar();
  }

  function graphEdges() {
    const ids = new Set(state.entries.map(entry => entry.id));
    const edges = [];
    state.entries.forEach(source => {
      (source.connections || []).forEach(connection => {
        if (!ids.has(connection.targetId) || connection.targetId === source.id) return;
        edges.push({ id: connection.id, sourceId: source.id, targetId: connection.targetId, label: connection.label || "se relaciona con", kind: "connection" });
      });
      if (source.type === "locations") {
        (source.obtainableItems || []).forEach(item => {
          if (!ids.has(item.relatedId) || item.relatedId === source.id) return;
          edges.push({
            id: `loot-${source.id}-${item.id}`,
            sourceId: source.id,
            targetId: item.relatedId,
            label: `permite conseguir: ${item.name || "item"}`,
            kind: "loot"
          });
        });
      }
    });
    return edges;
  }

  function locationDescendantIds(rootId) {
    const result = new Set([rootId]);
    let changed = true;
    while (changed) {
      changed = false;
      state.entries.forEach(entry => {
        if (entry.type === "locations" && entry.parentId && result.has(entry.parentId) && !result.has(entry.id)) {
          result.add(entry.id);
          changed = true;
        }
      });
    }
    return result;
  }

  function mindmapData() {
    const allEdges = graphEdges();
    const byId = new Map(state.entries.map(entry => [entry.id, entry]));
    const filterId = state.mindmapLocationFilter;
    if (!filterId || !byId.has(filterId)) {
      const nodeIds = new Set();
      allEdges.forEach(edge => { nodeIds.add(edge.sourceId); nodeIds.add(edge.targetId); });
      return { nodes: [...nodeIds].map(id => byId.get(id)).filter(Boolean), edges: allEdges, rootId: "" };
    }

    const scope = locationDescendantIds(filterId);
    const adjacency = new Map();
    allEdges.forEach(edge => {
      if (!adjacency.has(edge.sourceId)) adjacency.set(edge.sourceId, new Set());
      if (!adjacency.has(edge.targetId)) adjacency.set(edge.targetId, new Set());
      adjacency.get(edge.sourceId).add(edge.targetId);
      adjacency.get(edge.targetId).add(edge.sourceId);
    });
    const visited = new Set(scope);
    const queue = [...scope];
    while (queue.length) {
      const id = queue.shift();
      (adjacency.get(id) || []).forEach(next => {
        if (!visited.has(next)) {
          visited.add(next);
          queue.push(next);
        }
      });
    }
    const edges = allEdges.filter(edge => visited.has(edge.sourceId) && visited.has(edge.targetId));
    const connectedIds = new Set([filterId]);
    edges.forEach(edge => { connectedIds.add(edge.sourceId); connectedIds.add(edge.targetId); });
    return { nodes: [...connectedIds].map(id => byId.get(id)).filter(Boolean), edges, rootId: filterId };
  }

  function fillMindmapLocationFilter() {
    const locations = treeOrderedEntries("locations");
    els.mindmapLocationFilter.innerHTML = '<option value="">Todas las conexiones</option>' + locations.map(({ entry, depth }) =>
      `<option value="${entry.id}">${"— ".repeat(depth)}${escapeHtml(entry.name)}</option>`
    ).join("");
    if (!locations.some(({ entry }) => entry.id === state.mindmapLocationFilter)) state.mindmapLocationFilter = "";
    els.mindmapLocationFilter.value = state.mindmapLocationFilter || "";
  }

  function svgElement(name, attributes = {}) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
    return element;
  }

  function mindmapLayoutKey() {
    return state.mindmapLocationFilter || "all";
  }

  function mindmapCentralNode(nodes, edges, rootId) {
    if (rootId && nodes.some(node => node.id === rootId)) return rootId;
    const degree = new Map(nodes.map(node => [node.id, 0]));
    edges.forEach(edge => {
      degree.set(edge.sourceId, (degree.get(edge.sourceId) || 0) + 1);
      degree.set(edge.targetId, (degree.get(edge.targetId) || 0) + 1);
    });
    return [...nodes].sort((a, b) =>
      (degree.get(b.id) || 0) - (degree.get(a.id) || 0) ||
      (a.type === "locations" ? -1 : 0) - (b.type === "locations" ? -1 : 0) ||
      a.name.localeCompare(b.name, "es")
    )[0]?.id || nodes[0]?.id || "";
  }

  function mindmapDistanceMap(nodes, edges, centerId) {
    const adjacency = new Map(nodes.map(node => [node.id, new Set()]));
    const degree = new Map(nodes.map(node => [node.id, 0]));
    edges.forEach(edge => {
      adjacency.get(edge.sourceId)?.add(edge.targetId);
      adjacency.get(edge.targetId)?.add(edge.sourceId);
      degree.set(edge.sourceId, (degree.get(edge.sourceId) || 0) + 1);
      degree.set(edge.targetId, (degree.get(edge.targetId) || 0) + 1);
    });

    const distances = new Map([[centerId, 0]]);
    const visitComponent = (seedId, baseDistance) => {
      const local = new Map([[seedId, 0]]);
      const queue = [seedId];
      while (queue.length) {
        const id = queue.shift();
        (adjacency.get(id) || []).forEach(next => {
          if (distances.has(next) || local.has(next)) return;
          local.set(next, local.get(id) + 1);
          queue.push(next);
        });
      }
      local.forEach((distance, id) => distances.set(id, baseDistance + distance));
      return Math.max(0, ...local.values());
    };

    const mainQueue = [centerId];
    while (mainQueue.length) {
      const id = mainQueue.shift();
      (adjacency.get(id) || []).forEach(next => {
        if (distances.has(next)) return;
        distances.set(next, distances.get(id) + 1);
        mainQueue.push(next);
      });
    }

    let outerDistance = Math.max(0, ...distances.values()) + 1;
    while (distances.size < nodes.length) {
      const seed = nodes
        .filter(node => !distances.has(node.id))
        .sort((a, b) => (degree.get(b.id) || 0) - (degree.get(a.id) || 0) || a.name.localeCompare(b.name, "es"))[0];
      if (!seed) break;
      const componentDepth = visitComponent(seed.id, outerDistance);
      outerDistance += componentDepth + 1;
    }
    return distances;
  }

  function clampMindmapPosition(position, width, height) {
    const marginX = MINDMAP_NODE_WIDTH / 2 + 24;
    const marginY = MINDMAP_NODE_HEIGHT / 2 + 24;
    position.x = Math.max(marginX, Math.min(width - marginX, position.x));
    position.y = Math.max(marginY, Math.min(height - marginY, position.y));
  }

  function resolveMindmapCollisions(positions, width, height, fixedId = "", iterations = 44) {
    const ids = [...positions.keys()];
    const minimumDistance = MINDMAP_NODE_RADIUS * 2;
    for (let iteration = 0; iteration < iterations; iteration += 1) {
      let moved = false;
      for (let aIndex = 0; aIndex < ids.length; aIndex += 1) {
        for (let bIndex = aIndex + 1; bIndex < ids.length; bIndex += 1) {
          const aId = ids[aIndex];
          const bId = ids[bIndex];
          const a = positions.get(aId);
          const b = positions.get(bId);
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          let distance = Math.hypot(dx, dy);
          if (distance >= minimumDistance) continue;
          if (distance < .001) {
            const seed = (aIndex + 1) * 37 + (bIndex + 1) * 71;
            const angle = (seed % 360) * Math.PI / 180;
            dx = Math.cos(angle);
            dy = Math.sin(angle);
            distance = 1;
          }
          const overlap = minimumDistance - distance + .5;
          const nx = dx / distance;
          const ny = dy / distance;
          if (aId === fixedId) {
            b.x += nx * overlap;
            b.y += ny * overlap;
          } else if (bId === fixedId) {
            a.x -= nx * overlap;
            a.y -= ny * overlap;
          } else {
            a.x -= nx * overlap / 2;
            a.y -= ny * overlap / 2;
            b.x += nx * overlap / 2;
            b.y += ny * overlap / 2;
          }
          clampMindmapPosition(a, width, height);
          clampMindmapPosition(b, width, height);
          moved = true;
        }
      }
      if (!moved) break;
    }
  }

  function buildMindmapHierarchy(nodes, edges, centerId) {
    const byId = new Map(nodes.map(node => [node.id, node]));
    const adjacency = new Map(nodes.map(node => [node.id, new Set()]));
    const degree = new Map(nodes.map(node => [node.id, 0]));
    edges.forEach(edge => {
      if (!adjacency.has(edge.sourceId) || !adjacency.has(edge.targetId)) return;
      adjacency.get(edge.sourceId).add(edge.targetId);
      adjacency.get(edge.targetId).add(edge.sourceId);
      degree.set(edge.sourceId, (degree.get(edge.sourceId) || 0) + 1);
      degree.set(edge.targetId, (degree.get(edge.targetId) || 0) + 1);
    });

    const parent = new Map([[centerId, ""]]);
    const depth = new Map([[centerId, 0]]);
    const virtualChildren = new Set();
    const children = new Map(nodes.map(node => [node.id, []]));
    const sortIds = ids => [...ids].sort((a, b) =>
      (degree.get(b) || 0) - (degree.get(a) || 0) ||
      TYPE_ORDER.indexOf(byId.get(a)?.type) - TYPE_ORDER.indexOf(byId.get(b)?.type) ||
      (byId.get(a)?.name || "").localeCompare(byId.get(b)?.name || "", "es")
    );

    const visitComponent = seedId => {
      const queue = [seedId];
      while (queue.length) {
        const id = queue.shift();
        sortIds(adjacency.get(id) || []).forEach(next => {
          if (parent.has(next)) return;
          parent.set(next, id);
          depth.set(next, (depth.get(id) || 0) + 1);
          children.get(id)?.push(next);
          queue.push(next);
        });
      }
    };

    visitComponent(centerId);
    while (parent.size < nodes.length) {
      const seed = nodes
        .filter(node => !parent.has(node.id))
        .sort((a, b) =>
          (degree.get(b.id) || 0) - (degree.get(a.id) || 0) ||
          a.name.localeCompare(b.name, "es")
        )[0];
      if (!seed) break;
      parent.set(seed.id, centerId);
      depth.set(seed.id, 1);
      children.get(centerId)?.push(seed.id);
      virtualChildren.add(seed.id);
      visitComponent(seed.id);
    }

    children.forEach((ids, id) => {
      ids.sort((a, b) =>
        (degree.get(b) || 0) - (degree.get(a) || 0) ||
        TYPE_ORDER.indexOf(byId.get(a)?.type) - TYPE_ORDER.indexOf(byId.get(b)?.type) ||
        (byId.get(a)?.name || "").localeCompare(byId.get(b)?.name || "", "es")
      );
    });

    const weights = new Map();
    const calculateWeight = id => {
      if (weights.has(id)) return weights.get(id);
      const branchWeight = (children.get(id) || []).reduce((total, childId) => total + calculateWeight(childId), 0);
      const weight = 1 + branchWeight;
      weights.set(id, weight);
      return weight;
    };
    calculateWeight(centerId);

    return { adjacency, parent, depth, children, virtualChildren, weights };
  }

  function seedMindmapBranches(nodes, hierarchy, centerId) {
    const positions = new Map([[centerId, { x: 0, y: 0 }]]);
    const anchors = new Map([[centerId, { x: 0, y: 0 }]]);
    const minimumDistance = MINDMAP_NODE_RADIUS * 2;

    const placeChildren = (parentId, outwardAngle, availableSpan, isRoot = false) => {
      const childIds = hierarchy.children.get(parentId) || [];
      if (!childIds.length) return;
      const parentPosition = positions.get(parentId) || { x: 0, y: 0 };
      const weights = childIds.map(id => Math.max(1, Math.sqrt(hierarchy.weights.get(id) || 1)));
      const totalWeight = weights.reduce((total, weight) => total + weight, 0) || 1;
      const count = childIds.length;

      let fanSpan;
      if (isRoot) {
        fanSpan = count === 1 ? 0 : Math.PI * 2;
      } else {
        const minimumStepAtBaseRadius = 2 * Math.asin(Math.min(.96, minimumDistance / (2 * MINDMAP_EDGE_LENGTH)));
        const wantedSpan = count <= 1 ? 0 : Math.max(1.05, minimumStepAtBaseRadius * (count - 1));
        fanSpan = Math.min(Math.PI * 1.72, Math.max(.92, Math.min(availableSpan || Math.PI * 1.72, wantedSpan)));
        if (count === 1) fanSpan = 0;
      }

      const angularSlots = count <= 1 ? 1 : count - (isRoot ? 0 : 1);
      const angularStep = fanSpan / Math.max(1, angularSlots);
      const requiredRadius = count <= 1 || angularStep <= .01
        ? MINDMAP_EDGE_LENGTH
        : minimumDistance / (2 * Math.sin(Math.min(Math.PI / 2, angularStep / 2)));
      const baseRadius = isRoot && count > 1 ? MINDMAP_EDGE_LENGTH + 12 : MINDMAP_EDGE_LENGTH;
      const radius = Math.max(baseRadius, Math.min(390, requiredRadius + 8));
      const startAngle = count === 1
        ? outwardAngle
        : isRoot
          ? -Math.PI / 2
          : outwardAngle - fanSpan / 2;

      let consumedWeight = 0;
      childIds.forEach((childId, index) => {
        const weight = weights[index];
        let angle;
        let childSpan;
        if (count === 1) {
          angle = outwardAngle;
          childSpan = Math.min(Math.PI * 1.72, Math.max(1.3, availableSpan || Math.PI * 1.45));
        } else if (isRoot) {
          const slice = Math.PI * 2 * weight / totalWeight;
          angle = startAngle + Math.PI * 2 * (consumedWeight + weight / 2) / totalWeight;
          childSpan = Math.max(.9, slice * .9);
        } else {
          const usableSpan = Math.max(.01, fanSpan);
          const slice = usableSpan * weight / totalWeight;
          angle = startAngle + usableSpan * (consumedWeight + weight / 2) / totalWeight;
          childSpan = Math.max(.82, Math.min(Math.PI * 1.55, slice * 1.18));
        }
        consumedWeight += weight;

        const branchRadius = hierarchy.virtualChildren.has(childId) ? Math.max(460, radius + 220) : radius;
        const position = {
          x: parentPosition.x + Math.cos(angle) * branchRadius,
          y: parentPosition.y + Math.sin(angle) * branchRadius
        };
        positions.set(childId, position);
        anchors.set(childId, { ...position });
        placeChildren(childId, angle, childSpan, false);
      });
    };

    placeChildren(centerId, -Math.PI / 2, Math.PI * 2, true);
    nodes.forEach((node, index) => {
      if (positions.has(node.id)) return;
      const angle = -Math.PI / 2 + index * 2.3999632297;
      const radius = 500 + index * 12;
      const position = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
      positions.set(node.id, position);
      anchors.set(node.id, { ...position });
    });
    return { positions, anchors };
  }

  function relaxMindmapBranches(nodes, edges, hierarchy, positions, anchors, centerId) {
    const ids = nodes.map(node => node.id);
    const minimumDistance = MINDMAP_NODE_RADIUS * 2;
    const edgePairs = edges.filter(edge => positions.has(edge.sourceId) && positions.has(edge.targetId)).map(edge => ({
      sourceId: edge.sourceId,
      targetId: edge.targetId,
      isTree: hierarchy.parent.get(edge.sourceId) === edge.targetId || hierarchy.parent.get(edge.targetId) === edge.sourceId
    }));
    const iterations = ids.length > 180 ? 42 : ids.length > 90 ? 68 : 105;

    const movePair = (aId, bId, forceX, forceY) => {
      const a = positions.get(aId);
      const b = positions.get(bId);
      if (aId !== centerId) { a.x += forceX; a.y += forceY; }
      if (bId !== centerId) { b.x -= forceX; b.y -= forceY; }
    };

    for (let iteration = 0; iteration < iterations; iteration += 1) {
      const cooling = 1 - iteration / iterations * .72;

      edgePairs.forEach(pair => {
        const source = positions.get(pair.sourceId);
        const target = positions.get(pair.targetId);
        let dx = target.x - source.x;
        let dy = target.y - source.y;
        let distance = Math.hypot(dx, dy) || 1;
        const desired = pair.isTree ? MINDMAP_EDGE_LENGTH : MINDMAP_EDGE_LENGTH * 1.16;
        const strength = (pair.isTree ? .052 : .025) * cooling;
        const displacement = (distance - desired) * strength;
        dx /= distance;
        dy /= distance;
        movePair(pair.sourceId, pair.targetId, dx * displacement, dy * displacement);
      });

      for (let aIndex = 0; aIndex < ids.length; aIndex += 1) {
        for (let bIndex = aIndex + 1; bIndex < ids.length; bIndex += 1) {
          const aId = ids[aIndex];
          const bId = ids[bIndex];
          const a = positions.get(aId);
          const b = positions.get(bId);
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          let distance = Math.hypot(dx, dy);
          if (distance > minimumDistance * 1.7) continue;
          if (distance < .001) {
            const angle = ((aIndex + 1) * 47 + (bIndex + 1) * 83) % 360 * Math.PI / 180;
            dx = Math.cos(angle);
            dy = Math.sin(angle);
            distance = 1;
          }
          const nx = dx / distance;
          const ny = dy / distance;
          if (distance < minimumDistance) {
            const overlap = (minimumDistance - distance + 1) * .34 * cooling;
            movePair(aId, bId, -nx * overlap, -ny * overlap);
          } else {
            const repulsion = (minimumDistance * 1.7 - distance) / (minimumDistance * .7) * 1.15 * cooling;
            movePair(aId, bId, -nx * repulsion, -ny * repulsion);
          }
        }
      }

      ids.forEach(id => {
        if (id === centerId) return;
        const position = positions.get(id);
        const anchor = anchors.get(id);
        if (!anchor) return;
        const anchorStrength = .012 * cooling;
        position.x += (anchor.x - position.x) * anchorStrength;
        position.y += (anchor.y - position.y) * anchorStrength;
      });
      positions.set(centerId, { x: 0, y: 0 });
    }
  }

  function mindmapPositions(nodes, edges, rootId, minimumWidth, minimumHeight) {
    const centerId = mindmapCentralNode(nodes, edges, rootId);
    const hierarchy = buildMindmapHierarchy(nodes, edges, centerId);
    const seeded = seedMindmapBranches(nodes, hierarchy, centerId);
    relaxMindmapBranches(nodes, edges, hierarchy, seeded.positions, seeded.anchors, centerId);

    let minX = 0;
    let maxX = 0;
    let minY = 0;
    let maxY = 0;
    seeded.positions.forEach(position => {
      minX = Math.min(minX, position.x);
      maxX = Math.max(maxX, position.x);
      minY = Math.min(minY, position.y);
      maxY = Math.max(maxY, position.y);
    });
    const horizontalExtent = Math.max(Math.abs(minX), Math.abs(maxX)) + MINDMAP_NODE_RADIUS + 105;
    const verticalExtent = Math.max(Math.abs(minY), Math.abs(maxY)) + MINDMAP_NODE_RADIUS + 105;
    const width = Math.max(minimumWidth, Math.ceil(horizontalExtent * 2), 720);
    const height = Math.max(minimumHeight, Math.ceil(verticalExtent * 2), 620);
    const positions = new Map();
    seeded.positions.forEach((position, id) => positions.set(id, {
      x: position.x + width / 2,
      y: position.y + height / 2
    }));

    const stored = state.mindmapLayouts?.[mindmapLayoutKey()] || {};
    nodes.forEach(node => {
      const saved = stored[node.id];
      if (!saved) return;
      positions.set(node.id, { x: saved.x * width, y: saved.y * height });
      clampMindmapPosition(positions.get(node.id), width, height);
    });
    resolveMindmapCollisions(positions, width, height, stored[centerId] ? "" : centerId, 64);
    return { positions, width, height, centerId };
  }

  function updateMindmapGeometry() {
    if (!mindmapLayout) return;
    mindmapLayout.edgeElements.forEach(({ edge, line, label }) => {
      const source = mindmapLayout.positions.get(edge.sourceId);
      const target = mindmapLayout.positions.get(edge.targetId);
      if (!source || !target) return;
      line.setAttribute("x1", source.x);
      line.setAttribute("y1", source.y);
      line.setAttribute("x2", target.x);
      line.setAttribute("y2", target.y);
      label.setAttribute("x", (source.x + target.x) / 2);
      label.setAttribute("y", (source.y + target.y) / 2 - 6);
    });
    mindmapLayout.nodeElements.forEach((element, entryId) => {
      const position = mindmapLayout.positions.get(entryId);
      if (!position) return;
      element.setAttribute("transform", `translate(${position.x - MINDMAP_NODE_WIDTH / 2} ${position.y - MINDMAP_NODE_HEIGHT / 2})`);
    });
  }

  function persistMindmapPositions() {
    if (!mindmapLayout) return;
    state.mindmapLayouts ||= {};
    const stored = {};
    mindmapLayout.positions.forEach((position, entryId) => {
      stored[entryId] = {
        x: Math.max(0, Math.min(1, position.x / mindmapLayout.width)),
        y: Math.max(0, Math.min(1, position.y / mindmapLayout.height))
      };
    });
    state.mindmapLayouts[mindmapLayoutKey()] = stored;
    saveState();
  }

  function mindmapClientPoint(element, clientX, clientY) {
    const point = els.mindmapSvg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const matrix = element.getScreenCTM();
    return matrix ? point.matrixTransform(matrix.inverse()) : { x: clientX, y: clientY };
  }

  function applyMindmapTransform() {
    els.mindmapStage.setAttribute("transform", `translate(${mindmapTransform.x} ${mindmapTransform.y}) scale(${mindmapTransform.scale})`);
  }

  function resetMindmapTransform() {
    mindmapTransform = { x: 0, y: 0, scale: 1 };
    applyMindmapTransform();
  }

  function renderMindMap() {
    fillMindmapLocationFilter();
    const { nodes, edges, rootId } = mindmapData();
    els.mindmapStage.replaceChildren();
    els.mindmapEmpty.hidden = nodes.length > 0;
    els.mindmapSvg.hidden = nodes.length === 0;
    mindmapLayout = null;
    if (!nodes.length) return;

    const minimumWidth = Math.max(720, els.mindmapCanvas.clientWidth || 1100);
    const minimumHeight = Math.max(620, els.mindmapCanvas.clientHeight || 720);
    const layout = mindmapPositions(nodes, edges, rootId, minimumWidth, minimumHeight);
    els.mindmapSvg.setAttribute("viewBox", `0 0 ${layout.width} ${layout.height}`);
    mindmapLayout = {
      ...layout,
      edges,
      nodeElements: new Map(),
      edgeElements: []
    };

    edges.forEach(edge => {
      const group = svgElement("g", { class: `mindmap-edge mindmap-edge--${edge.kind}` });
      const line = svgElement("line", { "marker-end": "url(#mindmapArrow)" });
      const label = svgElement("text", { class: "mindmap-edge__label", "text-anchor": "middle" });
      label.textContent = edge.label.length > 34 ? `${edge.label.slice(0, 33)}…` : edge.label;
      const title = svgElement("title");
      title.textContent = edge.label;
      group.append(line, label, title);
      els.mindmapStage.append(group);
      mindmapLayout.edgeElements.push({ edge, line, label });
    });

    nodes.forEach(entry => {
      const meta = subtypeMeta(entry.type, entry.subtype);
      const group = svgElement("g", {
        class: `mindmap-node mindmap-node--${entry.type}${entry.id === layout.centerId ? " is-root" : ""}`,
        tabindex: "0",
        role: "button",
        "data-entry-id": entry.id,
        "aria-label": `${entry.name}, ${TYPES[entry.type].label}. Arrastra para mover.`
      });
      const rect = svgElement("rect", { width: MINDMAP_NODE_WIDTH, height: MINDMAP_NODE_HEIGHT, rx: 10, ry: 10 });
      const icon = svgElement("text", { x: 15, y: 23, class: "mindmap-node__icon" });
      icon.textContent = meta.icon;
      const name = svgElement("text", { x: 39, y: 22, class: "mindmap-node__name" });
      name.textContent = entry.name.length > 18 ? `${entry.name.slice(0, 17)}…` : entry.name;
      const type = svgElement("text", { x: 39, y: 40, class: "mindmap-node__type" });
      type.textContent = meta.label.length > 22 ? `${meta.label.slice(0, 21)}…` : meta.label;
      const title = svgElement("title");
      title.textContent = `${entry.name} · ${meta.label}. Puedes arrastrarlo.`;
      const open = () => setSelected(entry.id);
      group.addEventListener("pointerdown", event => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        const point = mindmapClientPoint(els.mindmapStage, event.clientX, event.clientY);
        const position = mindmapLayout?.positions.get(entry.id);
        if (!position) return;
        mindmapNodeDrag = {
          pointerId: event.pointerId,
          entryId: entry.id,
          startPointer: point,
          startPosition: { ...position },
          moved: false,
          element: group
        };
        els.mindmapSvg.setPointerCapture(event.pointerId);
        group.classList.add("is-dragging");
      });
      group.addEventListener("click", event => {
        if (suppressMindmapNodeClick) {
          event.preventDefault();
          return;
        }
        open();
      });
      group.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      });
      group.append(rect, icon, name, type, title);
      els.mindmapStage.append(group);
      mindmapLayout.nodeElements.set(entry.id, group);
    });
    updateMindmapGeometry();
    applyMindmapTransform();
  }

  function diceIconSvg(sides) {
    const shapes = {
      4: '<polygon points="24,5 43,40 5,40"/><path d="M24 5v35M5 40l19-13 19 13"/>',
      6: '<rect x="8" y="8" width="32" height="32" rx="3" transform="rotate(9 24 24)"/><circle cx="16" cy="16" r="2.2"/><circle cx="32" cy="32" r="2.2"/><circle cx="24" cy="24" r="2.2"/>',
      8: '<polygon points="24,4 43,24 24,44 5,24"/><path d="M24 4v40M5 24h38M24 4 5 24l19 7 19-7z"/>',
      10: '<polygon points="24,4 43,18 36,42 12,42 5,18"/><path d="M24 4 12 42M24 4l12 38M5 18h38M5 18l19 13 19-13"/>',
      12: '<polygon points="15,5 33,5 44,20 38,40 10,40 4,20"/><path d="M15 5 10 40M33 5l5 35M4 20h40M15 5l9 13 9-13M10 40l14-12 14 12"/>',
      20: '<polygon points="24,3 42,13 45,31 33,44 15,44 3,31 6,13"/><path d="M24 3 15 44M24 3l9 41M6 13l39 18M42 13 3 31M6 13l18 15 18-15M3 31l21-3 21 3"/>',
      100: '<polygon points="18,5 35,9 44,24 35,40 18,44 5,30 7,15"/><path d="M18 5 35 40M35 9 18 44M7 15l37 9M5 30l39-6"/><circle cx="27" cy="24" r="11"/>'
    };
    return `<svg viewBox="0 0 48 48" aria-hidden="true"><g>${shapes[sides] || shapes[20]}</g></svg>`;
  }

  function renderDice() {
    state.dice = normaliseDiceState(state.dice);
    const dice = state.dice;
    els.diceTypes.replaceChildren();
    DICE_SIDES.forEach(sides => {
      const count = dice.counts[String(sides)] || 0;
      const row = document.createElement("div");
      row.className = `dice-type-row${count ? " is-selected" : ""}`;
      row.dataset.sides = String(sides);
      row.innerHTML = `
        <button class="dice-type-main" type="button" data-dice-action="add" aria-label="Añadir un d${sides}">
          ${diceIconSvg(sides)}
          <strong>d${sides}</strong>
          ${count ? `<span class="dice-count-badge">${count}</span>` : ""}
        </button>
        <div class="dice-count-controls" aria-label="Cantidad de d${sides}">
          <button type="button" data-dice-action="subtract" aria-label="Quitar un d${sides}" ${count === 0 ? "disabled" : ""}>−</button>
          <output>${count}</output>
          <button type="button" data-dice-action="add" aria-label="Añadir un d${sides}" ${count >= MAX_DICE_PER_TYPE ? "disabled" : ""}>+</button>
        </div>`;
      els.diceTypes.append(row);
    });

    els.diceModifiers.replaceChildren();
    for (let modifier = 20; modifier >= -20; modifier -= 1) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `dice-modifier${modifier === dice.modifier ? " is-selected" : ""}`;
      button.dataset.modifier = String(modifier);
      button.setAttribute("role", "radio");
      button.setAttribute("aria-checked", modifier === dice.modifier ? "true" : "false");
      button.textContent = modifier > 0 ? `+${modifier}` : String(modifier).replace("-", "−");
      els.diceModifiers.append(button);
    }

    if (document.activeElement !== els.diceExpression) els.diceExpression.value = dice.expression || buildDiceExpression(dice.counts, dice.modifier);
    renderDiceLastRoll();
    renderDiceHistory();
  }

  function renderDiceLastRoll() {
    const last = state.dice?.lastRoll;
    els.diceError.hidden = true;
    if (!last) {
      els.diceBreakdown.textContent = "Selecciona una combinación y tira los dados.";
      els.diceResult.textContent = "—";
      els.diceResult.classList.remove("has-result");
      return;
    }
    els.diceBreakdown.textContent = `${last.breakdown} =`;
    els.diceResult.textContent = String(last.result);
    els.diceResult.classList.add("has-result");
  }

  function renderDiceHistory() {
    const history = state.dice?.history || [];
    els.diceHistory.replaceChildren();
    if (!history.length) {
      els.diceHistory.innerHTML = '<p class="dice-history-empty">Todavía no has hecho ninguna tirada.</p>';
      return;
    }
    history.forEach(item => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "dice-history-row";
      row.title = "Reutilizar esta fórmula";
      row.innerHTML = `<span><strong>${escapeHtml(item.expression)}</strong><small>${escapeHtml(item.breakdown)}</small></span><output>${item.result}</output>`;
      row.addEventListener("click", () => {
        state.dice.expression = item.expression;
        els.diceExpression.value = item.expression;
        syncDiceControlsFromExpression(item.expression, false);
        saveState();
      });
      els.diceHistory.append(row);
    });
  }

  function updateDiceExpressionFromControls() {
    state.dice.expression = buildDiceExpression(state.dice.counts, state.dice.modifier);
    els.diceExpression.value = state.dice.expression;
    state.dice.lastRoll = null;
    saveState();
    renderDice();
  }

  function parseDiceExpression(expression) {
    const source = String(expression || "").trim().replace(/[−–—]/g, "-").replace(/\s+/g, "");
    if (!source) throw new Error("Escribe una fórmula o selecciona al menos un dado.");
    const normalised = /^[+-]/.test(source) ? source : `+${source}`;
    const tokenPattern = /([+-])(?:(\d*)d(\d+)|(\d+))/gi;
    const terms = [];
    let cursor = 0;
    let match;
    while ((match = tokenPattern.exec(normalised))) {
      if (match.index !== cursor) throw new Error("La fórmula no es válida. Usa formatos como 2d20 + 4.");
      const sign = match[1] === "-" ? -1 : 1;
      if (match[3]) {
        const count = Number(match[2] || 1);
        const sides = Number(match[3]);
        if (!Number.isInteger(count) || count < 1 || count > 100) throw new Error("Puedes tirar entre 1 y 100 dados por término.");
        if (!Number.isInteger(sides) || sides < 2 || sides > 10000) throw new Error("Cada dado debe tener entre 2 y 10.000 caras.");
        terms.push({ kind: "dice", sign, count, sides });
      } else {
        const value = Number(match[4]);
        if (!Number.isSafeInteger(value) || value > 1000000) throw new Error("El modificador de la fórmula es demasiado grande.");
        terms.push({ kind: "number", sign, value });
      }
      cursor = tokenPattern.lastIndex;
    }
    if (cursor !== normalised.length || !terms.some(term => term.kind === "dice")) {
      throw new Error("La fórmula debe incluir al menos un dado, por ejemplo 1d20.");
    }
    return terms;
  }

  function rollDie(sides) {
    const range = 0x100000000;
    const limit = range - (range % sides);
    const buffer = new Uint32Array(1);
    let value;
    do {
      crypto.getRandomValues(buffer);
      value = buffer[0];
    } while (value >= limit);
    return (value % sides) + 1;
  }

  function rollDiceExpression() {
    const expression = els.diceExpression.value.trim();
    let terms;
    try {
      terms = parseDiceExpression(expression);
    } catch (error) {
      els.diceError.textContent = error.message;
      els.diceError.hidden = false;
      return;
    }

    let total = 0;
    const parts = [];
    terms.forEach((term, index) => {
      if (term.kind === "dice") {
        const rolls = Array.from({ length: term.count }, () => rollDie(term.sides));
        const sum = rolls.reduce((accumulator, value) => accumulator + value, 0);
        total += term.sign * sum;
        const rolled = rolls.length > 1 ? `(${rolls.join(" + ")})` : String(rolls[0]);
        const prefix = term.sign < 0 ? "− " : (index > 0 ? "+ " : "");
        parts.push(`${prefix}${rolled}`);
      } else {
        total += term.sign * term.value;
        const prefix = term.sign < 0 ? "−" : "+";
        parts.push(`${prefix} ${term.value}`);
      }
    });

    const breakdown = parts.join(" ").replace(/^\+\s*/, "");
    const lastRoll = { expression, breakdown, result: total };
    state.dice.expression = expression;
    state.dice.lastRoll = lastRoll;
    state.dice.history.unshift({ id: uid(), ...lastRoll, createdAt: now() });
    state.dice.history = state.dice.history.slice(0, 20);
    saveState(true);
    renderDiceLastRoll();
    renderDiceHistory();
    els.diceRollOutput.classList.remove("is-rolling");
    void els.diceRollOutput.offsetWidth;
    els.diceRollOutput.classList.add("is-rolling");
  }

  function rollFormula(expression = "1d20") {
    expression = String(expression || "1d20").trim();
    const terms = parseDiceExpression(expression);
    let total = 0;
    const parts = [];
    terms.forEach((term, index) => {
      if (term.kind === "dice") {
        const rolls = Array.from({ length: term.count }, () => rollDie(term.sides));
        const sum = rolls.reduce((accumulator, value) => accumulator + value, 0);
        total += term.sign * sum;
        const rolled = rolls.length > 1 ? `(${rolls.join(" + ")})` : String(rolls[0]);
        const prefix = term.sign < 0 ? "− " : (index > 0 ? "+ " : "");
        parts.push(`${prefix}${rolled}`);
      } else {
        total += term.sign * term.value;
        const prefix = term.sign < 0 ? "−" : "+";
        parts.push(`${prefix} ${term.value}`);
      }
    });
    const breakdown = parts.join(" ").replace(/^\+\s*/, "");
    const lastRoll = { expression, breakdown, result: total };
    syncDiceControlsFromExpression(expression, false);
    state.dice.expression = expression;
    state.dice.lastRoll = lastRoll;
    state.dice.history.unshift({ id: uid(), ...lastRoll, createdAt: now() });
    state.dice.history = state.dice.history.slice(0, 20);
    saveState(true);
    if (state.view === "dice") renderDice();
    return { ...lastRoll };
  }

  function syncDiceControlsFromExpression(expression, rerender = true) {
    let terms;
    try { terms = parseDiceExpression(expression); } catch { return false; }
    const counts = Object.fromEntries(DICE_SIDES.map(sides => [String(sides), 0]));
    let modifier = 0;
    let compatible = true;
    terms.forEach(term => {
      if (term.kind === "dice") {
        if (term.sign < 0 || !DICE_SIDES.includes(term.sides)) compatible = false;
        else counts[String(term.sides)] = Math.min(MAX_DICE_PER_TYPE, counts[String(term.sides)] + term.count);
      } else {
        modifier += term.sign * term.value;
      }
    });
    if (!compatible || modifier < -20 || modifier > 20) return false;
    state.dice.counts = counts;
    state.dice.modifier = modifier;
    state.dice.expression = expression;
    saveState();
    if (rerender) renderDice();
    return true;
  }

  function openMarkdownEditor() {
    els.descriptionPreview.hidden = true;
    els.entryDescription.hidden = false;
    els.entryDescription.focus();
  }

  function closeMarkdownEditor() {
    syncDescription();
    els.descriptionPreview.innerHTML = markdownToHtml(els.entryDescription.value);
    els.entryDescription.hidden = true;
    els.descriptionPreview.hidden = false;
  }

  function applyMarkdown(command) {
    const area = els.entryDescription;
    openMarkdownEditor();
    const start = area.selectionStart;
    const end = area.selectionEnd;
    const hasSelection = end > start;
    const selected = area.value.slice(start, end) || "texto";

    if (["bold", "italic", "strike"].includes(command)) {
      const marker = { bold: "**", italic: "*", strike: "~~" }[command];
      // Markdown se interpreta línea por línea en la vista previa. Cuando la
      // selección ocupa varias líneas, envolvemos cada una por separado.
      const replacement = selected.includes("\n")
        ? selected.split("\n").map(line => line ? `${marker}${line}${marker}` : line).join("\n")
        : `${marker}${selected}${marker}`;
      area.setRangeText(replacement, start, end, "select");
      syncDescription();
      return;
    }

    if (["heading1", "heading2", "quote", "ul", "ol", "paragraph"].includes(command)) {
      const value = area.value;
      const lineStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
      // Si la selección termina justo después de un salto de línea, no debe
      // formatearse también la siguiente línea vacía o no seleccionada.
      const selectionEnd = hasSelection && end > lineStart && value[end - 1] === "\n" ? end - 1 : end;
      const nextBreak = value.indexOf("\n", selectionEnd);
      const lineEnd = nextBreak < 0 ? value.length : nextBreak;
      const lines = value.slice(lineStart, lineEnd).split("\n");
      const targetPattern = {
        heading1: /^\s*#\s+/,
        heading2: /^\s*##\s+/,
        quote: /^\s*>\s?/,
        ul: /^\s*[-*+]\s+/,
        ol: /^\s*\d+[.)]\s+/
      }[command];
      const nonEmpty = lines.filter(line => line.trim());
      const removeOnly = command !== "paragraph" && nonEmpty.length > 0 && nonEmpty.every(line => targetPattern.test(line));
      const stripBlockPrefix = line => {
        const match = line.match(/^(\s*)(.*)$/);
        const indent = match?.[1] || "";
        const content = (match?.[2] || "").replace(/^(?:#{1,6}\s+|>\s?|[-*+]\s+|\d+[.)]\s+)/, "");
        return { indent, content };
      };

      let number = 1;
      const replacement = lines.map(line => {
        if (!line.trim()) return line;
        const { indent, content } = stripBlockPrefix(line);
        if (command === "paragraph" || removeOnly) return indent + content;
        if (command === "heading1") return `${indent}# ${content}`;
        if (command === "heading2") return `${indent}## ${content}`;
        if (command === "quote") return `${indent}> ${content}`;
        if (command === "ul") return `${indent}- ${content}`;
        if (command === "ol") return `${indent}${number++}. ${content}`;
        return line;
      }).join("\n");

      area.setRangeText(replacement, lineStart, lineEnd, "select");
      syncDescription();
    }
  }

  function syncDescription() {
    const entry = selectedEntry();
    if (!entry) return;
    entry.descriptionMarkdown = els.entryDescription.value;
    entry.descriptionHtml = markdownToHtml(entry.descriptionMarkdown);
    entry.updatedAt = now();
    saveState();
  }

  function bindEvents() {
    els.viewTabs.forEach(tab => tab.addEventListener("click", () => {
      cancelConnectionMode(false);
      state.view = tab.dataset.view;
      saveState();
      renderView();
      if (state.view === "calendar") renderCalendar();
      if (state.view === "mindmap") {
        resetMindmapTransform();
        renderMindMap();
      }
      if (state.view === "dice") renderDice();
      if (state.view === "atlas") window.ForjaAtlas?.render?.();
    }));

    els.campaignSelect.addEventListener("change", () => activateCampaign(els.campaignSelect.value));
    els.campaignManagerBtn.addEventListener("click", () => {
      renderCampaignManager();
      els.campaignDialog.showModal();
      setTimeout(() => els.newCampaignName.focus(), 0);
    });
    $(".campaign-dialog-close", els.campaignDialog).addEventListener("click", () => els.campaignDialog.close());
    els.newCampaignForm.addEventListener("submit", event => {
      event.preventDefault();
      createCampaign(els.newCampaignName.value);
    });

    els.globalSearch.addEventListener("input", () => {
      state.search = els.globalSearch.value;
      saveState();
      renderColumns();
    });
    els.clearSearch.addEventListener("click", () => {
      state.search = "";
      els.globalSearch.value = "";
      saveState();
      renderColumns();
    });

    els.entryName.addEventListener("input", () => {
      updateSelected({ name: els.entryName.value });
      renderColumns();
      const entry = selectedEntry();
      if (entry) renderConnections(entry);
      renderMindMap();
    });
    els.descriptionPreview.addEventListener("click", openMarkdownEditor);
    els.descriptionPreview.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openMarkdownEditor(); } });
    els.entryDescription.addEventListener("input", syncDescription);
    els.entryDescription.addEventListener("blur", closeMarkdownEditor);
    els.entryStatus.addEventListener("change", () => {
      updateSelected({ status: els.entryStatus.value });
      renderColumns();
      renderMindMap();
    });
    els.entrySubtype.addEventListener("change", () => {
      updateSelected({ subtype: els.entrySubtype.value });
      renderColumns();
      const entry = selectedEntry();
      if (entry) {
        setSubtypeIcon(els.entryHeadingIcon, entry.type, entry.subtype);
        const isSeller = isSalesEntry(entry);
        els.vendorPanel.hidden = !isSeller;
        if (isSeller) renderVendorItems(entry);
        renderMindMap();
      }
    });

    $$(".editor-toolbar [data-markdown]").forEach(button => button.addEventListener("mousedown", event => {
      event.preventDefault();
      applyMarkdown(button.dataset.markdown);
    }));
    $("#insertLinkBtn").addEventListener("mousedown", event => {
      event.preventDefault();
      let url = prompt("Dirección del enlace (URL)")?.trim();
      if (!url) return;
      if (!/^(https?:|mailto:|#)/i.test(url)) url = `https://${url}`;
      openMarkdownEditor();
      const start = els.entryDescription.selectionStart, end = els.entryDescription.selectionEnd;
      const label = els.entryDescription.value.slice(start, end) || "enlace";
      els.entryDescription.setRangeText(`[${label}](${url})`, start, end, "end");
      syncDescription();
    });
    $("#removeFormatBtn").addEventListener("mousedown", event => {
      event.preventDefault();
      const area = els.entryDescription;
      openMarkdownEditor();
      const start = area.selectionStart, end = area.selectionEnd;
      const plain = area.value.slice(start, end).replace(/[*_~`#>\[\]()]/g, "");
      area.setRangeText(plain, start, end, "select");
      syncDescription();
    });

    ["Hp", "MaxHp", "Ac", "Speed", "Initiative"].forEach(label => {
      const element = $(`#stat${label}`);
      element.addEventListener("input", () => {
        const entry = selectedEntry();
        if (!entry || entry.type !== "creatures") return;
        const key = ({ Hp: "hp", MaxHp: "maxhp", Ac: "ac", Speed: "speed", Initiative: "initiative" })[label];
        entry.stats[key] = Number(element.value || 0);
        entry.updatedAt = now();
        saveState();
      });
    });

    const updateVendorFormCoin = () => {
      const meta = currencyMeta(els.vendorItemCurrency.value);
      els.vendorItemCoin.className = `coin-icon coin-icon--${meta.value}`;
      els.vendorItemCoin.title = `Moneda de ${meta.name.toLocaleLowerCase("es")}`;
    };
    els.vendorItemCurrency.addEventListener("change", updateVendorFormCoin);
    updateVendorFormCoin();

    els.vendorItemForm.addEventListener("submit", event => {
      event.preventDefault();
      const entry = selectedEntry();
      const name = els.vendorItemName.value.trim();
      const priceAmount = Math.max(0, Number(els.vendorItemPriceAmount.value || 0));
      const currency = currencyMeta(els.vendorItemCurrency.value).value;
      const description = els.vendorItemDescription.value.trim();
      if (!isSalesEntry(entry) || !name) return;
      entry.vendorItems ||= [];
      entry.vendorItems.push({ id: uid(), name, priceAmount, currency, description });
      els.vendorItemForm.reset();
      updateVendorFormCoin();
      entry.updatedAt = now();
      saveState();
      renderVendorItems(entry);
      els.vendorItemName.focus();
    });

    els.locationItemTargetButton.addEventListener("click", () => startLocationItemPick(null));
    els.locationItemForm.addEventListener("submit", event => {
      event.preventDefault();
      const entry = selectedEntry();
      const name = els.locationItemName.value.trim();
      const how = els.locationItemHow.value.trim();
      if (!entry || entry.type !== "locations" || !name) return;
      if (!pendingLocationItemTargetId) {
        alert("Selecciona una entrada relacionada pulsando “Elegir relación”.");
        return;
      }
      entry.obtainableItems ||= [];
      entry.obtainableItems.push({
        id: uid(), name, rarity: els.locationItemRarity.value,
        how, relatedId: pendingLocationItemTargetId
      });
      pendingLocationItemTargetId = "";
      els.locationItemForm.reset();
      els.locationItemRarity.value = "common";
      entry.updatedAt = now();
      saveState(true);
      renderLocationItems(entry);
      renderMindMap();
      els.locationItemName.focus();
    });

    [
      [els.thingLocationForm, els.thingLocationInput, "location"],
      [els.thingLoreForm, els.thingLoreInput, "lore"],
      [els.thingAbilitiesForm, els.thingAbilitiesInput, "abilities"]
    ].forEach(([form, input, field]) => form.addEventListener("submit", event => {
      event.preventDefault();
      addThingDetail(field, input);
    }));

    els.consumableForm.addEventListener("submit", event => {
      event.preventDefault();
      const text = els.consumableInput.value.trim();
      const entry = selectedEntry();
      if (!entry || !text) return;
      entry.consumables ||= [];
      entry.consumables.push({ id: uid(), text });
      els.consumableInput.value = "";
      entry.updatedAt = now();
      saveState();
      renderConsumables(entry);
    });

    els.startConnectionBtn.addEventListener("click", startConnectionMode);
    els.cancelConnectionBtn.addEventListener("click", () => cancelConnectionMode());
    els.cancelConnectionBanner.addEventListener("click", () => cancelConnectionMode());
    $(".connection-dialog-close", els.connectionDialog).addEventListener("click", closeConnectionDialog);
    $(".connection-dialog-cancel", els.connectionDialog).addEventListener("click", closeConnectionDialog);
    els.connectionDialogForm.addEventListener("submit", event => {
      event.preventDefault();
      createConnection();
    });

    els.journalForm.addEventListener("submit", event => {
      event.preventDefault();
      const text = els.journalInput.value.trim();
      const entry = selectedEntry();
      if (!entry || !text) return;
      entry.journal ||= [];
      entry.journal.push({ id: uid(), text, createdAt: now() });
      els.journalInput.value = "";
      entry.updatedAt = now();
      saveState();
      renderJournal(entry);
    });

    els.deleteBtn.addEventListener("click", () => selectedEntry() && deleteEntry(state.selectedId));
    els.duplicateBtn.addEventListener("click", () => selectedEntry() && duplicateEntry(state.selectedId));
    els.exportBtn.addEventListener("click", exportData);
    els.importBtn.addEventListener("click", () => els.importFile.click());
    els.importFile.addEventListener("change", async () => {
      const file = els.importFile.files?.[0];
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        if (Array.isArray(data?.campaigns)) {
          if (!confirm("La importación reemplazará todo el perfil local, incluidas sus campañas. ¿Continuar?")) return;
          profile = normaliseProfile(data);
          state = profile.campaigns.find(campaign => campaign.id === profile.activeCampaignId) || profile.campaigns[0];
          activeCollectionType = state.entries.find(entry => entry.id === state.selectedId)?.type || "locations";
        } else if (Array.isArray(data?.entries)) {
          const imported = normaliseCampaign(data, data.campaignName || "Campaña importada");
          imported.id = uid();
          profile.campaigns.push(imported);
          profile.activeCampaignId = imported.id;
          state = imported;
          activeCollectionType = state.entries.find(entry => entry.id === state.selectedId)?.type || "locations";
        } else {
          throw new Error("Formato no válido");
        }
        cancelConnectionMode(false);
        saveState(true);
        render();
      } catch (error) {
        alert(`No se pudo importar: ${error.message}`);
      } finally {
        els.importFile.value = "";
      }
    });

    els.themeBtn.addEventListener("click", () => {
      profile.theme = profile.theme === "light" ? "dark" : "light";
      saveState(true);
      render();
    });
    els.helpBtn.addEventListener("click", () => els.helpDialog.showModal());
    els.closeHelp.addEventListener("click", () => els.helpDialog.close());

    $(".dialog-close", els.itemDialog).addEventListener("click", () => els.itemDialog.close());
    $(".dialog-cancel", els.itemDialog).addEventListener("click", () => els.itemDialog.close());
    els.itemDialogForm.addEventListener("submit", event => {
      event.preventDefault();
      const name = els.newItemName.value.trim();
      if (!name) return;
      createEntry(dialogType, name, els.newItemParent.value, els.newItemSubtype.value);
      els.itemDialog.close();
    });

    $(".actions-close", els.actionsDialog).addEventListener("click", () => els.actionsDialog.close());
    $$(".action-choice", els.actionsDialog).forEach(button => button.addEventListener("click", () => {
      const id = actionEntryId;
      els.actionsDialog.close();
      if (!id) return;
      if (button.dataset.action === "child") {
        const entry = state.entries.find(candidate => candidate.id === id);
        if (entry) openCreateDialog(entry.type, entry.id);
      }
      if (button.dataset.action === "up") moveEntry(id, -1);
      if (button.dataset.action === "down") moveEntry(id, 1);
      if (button.dataset.action === "rename") renameEntry(id);
      if (button.dataset.action === "duplicate") duplicateEntry(id);
      if (button.dataset.action === "delete") deleteEntry(id);
    }));

    els.calendarPrev.addEventListener("click", () => shiftCalendarMonth(-1));
    els.calendarNext.addEventListener("click", () => shiftCalendarMonth(1));
    els.calendarToday.addEventListener("click", () => {
      state.gameCalendar.cursorMonthOffset = currentCampaignMonthOffset();
      saveState();
      renderCalendar();
    });
    els.advanceCampaignDay.addEventListener("click", () => {
      state.gameCalendar.currentDay += 1;
      state.gameCalendar.cursorMonthOffset = currentCampaignMonthOffset();
      saveState(true);
      renderCalendar();
    });
    els.newCalendarEvent.addEventListener("click", () => openCalendarEventDialog(state.gameCalendar.currentDay));
    els.calendarSettingsBtn.addEventListener("click", openCalendarSettings);
    $(".calendar-settings-close", els.calendarSettingsDialog).addEventListener("click", () => els.calendarSettingsDialog.close());
    $(".calendar-settings-cancel", els.calendarSettingsDialog).addEventListener("click", () => els.calendarSettingsDialog.close());
    els.calendarSettingsForm.addEventListener("submit", event => {
      event.preventDefault();
      saveCalendarSettings();
    });
    els.eventDay.addEventListener("input", updateEventDayPreview);
    $(".calendar-event-close", els.calendarEventDialog).addEventListener("click", () => els.calendarEventDialog.close());
    $(".calendar-event-cancel", els.calendarEventDialog).addEventListener("click", () => els.calendarEventDialog.close());
    els.calendarEventForm.addEventListener("submit", event => {
      event.preventDefault();
      saveCalendarEvent();
    });
    els.deleteCalendarEvent.addEventListener("click", deleteCalendarEvent);

    els.mindmapLocationFilter.addEventListener("change", () => {
      state.mindmapLocationFilter = els.mindmapLocationFilter.value;
      saveState();
      resetMindmapTransform();
      renderMindMap();
    });
    els.mindmapZoomIn.addEventListener("click", () => {
      mindmapTransform.scale = Math.min(2.5, mindmapTransform.scale * 1.18);
      applyMindmapTransform();
    });
    els.mindmapZoomOut.addEventListener("click", () => {
      mindmapTransform.scale = Math.max(.45, mindmapTransform.scale / 1.18);
      applyMindmapTransform();
    });
    els.mindmapReset.addEventListener("click", resetMindmapTransform);
    els.mindmapSvg.addEventListener("wheel", event => {
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
      mindmapTransform.scale = Math.max(.45, Math.min(2.5, mindmapTransform.scale * factor));
      applyMindmapTransform();
    }, { passive: false });
    els.mindmapSvg.addEventListener("pointerdown", event => {
      if (event.button !== 0 || event.target.closest?.(".mindmap-node")) return;
      const point = mindmapClientPoint(els.mindmapSvg, event.clientX, event.clientY);
      mindmapDrag = { pointerId: event.pointerId, point, startX: mindmapTransform.x, startY: mindmapTransform.y };
      els.mindmapSvg.setPointerCapture(event.pointerId);
      els.mindmapSvg.classList.add("is-panning");
    });
    els.mindmapSvg.addEventListener("pointermove", event => {
      if (mindmapNodeDrag && mindmapNodeDrag.pointerId === event.pointerId && mindmapLayout) {
        const point = mindmapClientPoint(els.mindmapStage, event.clientX, event.clientY);
        const dx = point.x - mindmapNodeDrag.startPointer.x;
        const dy = point.y - mindmapNodeDrag.startPointer.y;
        if (Math.hypot(dx, dy) > 3) mindmapNodeDrag.moved = true;
        const position = mindmapLayout.positions.get(mindmapNodeDrag.entryId);
        if (!position) return;
        position.x = mindmapNodeDrag.startPosition.x + dx;
        position.y = mindmapNodeDrag.startPosition.y + dy;
        clampMindmapPosition(position, mindmapLayout.width, mindmapLayout.height);
        resolveMindmapCollisions(
          mindmapLayout.positions,
          mindmapLayout.width,
          mindmapLayout.height,
          mindmapNodeDrag.entryId,
          18
        );
        updateMindmapGeometry();
        return;
      }
      if (!mindmapDrag || mindmapDrag.pointerId !== event.pointerId) return;
      const point = mindmapClientPoint(els.mindmapSvg, event.clientX, event.clientY);
      mindmapTransform.x = mindmapDrag.startX + (point.x - mindmapDrag.point.x);
      mindmapTransform.y = mindmapDrag.startY + (point.y - mindmapDrag.point.y);
      applyMindmapTransform();
    });
    const stopMindmapDrag = event => {
      if (mindmapNodeDrag && mindmapNodeDrag.pointerId === event.pointerId) {
        const moved = mindmapNodeDrag.moved;
        mindmapNodeDrag.element?.classList.remove("is-dragging");
        mindmapNodeDrag = null;
        if (moved) {
          persistMindmapPositions();
          suppressMindmapNodeClick = true;
          setTimeout(() => { suppressMindmapNodeClick = false; }, 0);
        }
        if (els.mindmapSvg.hasPointerCapture(event.pointerId)) els.mindmapSvg.releasePointerCapture(event.pointerId);
        return;
      }
      if (!mindmapDrag || mindmapDrag.pointerId !== event.pointerId) return;
      mindmapDrag = null;
      els.mindmapSvg.classList.remove("is-panning");
      if (els.mindmapSvg.hasPointerCapture(event.pointerId)) els.mindmapSvg.releasePointerCapture(event.pointerId);
    };
    els.mindmapSvg.addEventListener("pointerup", stopMindmapDrag);
    els.mindmapSvg.addEventListener("pointercancel", stopMindmapDrag);
    window.addEventListener("resize", () => {
      if (state.view === "mindmap") renderMindMap();
    });

    els.diceTypes.addEventListener("click", event => {
      const control = event.target.closest("[data-dice-action]");
      const row = event.target.closest(".dice-type-row");
      if (!control || !row) return;
      const sides = row.dataset.sides;
      const current = state.dice.counts[sides] || 0;
      state.dice.counts[sides] = control.dataset.diceAction === "subtract"
        ? Math.max(0, current - 1)
        : Math.min(MAX_DICE_PER_TYPE, current + 1);
      updateDiceExpressionFromControls();
    });
    els.diceModifiers.addEventListener("click", event => {
      const button = event.target.closest(".dice-modifier");
      if (!button) return;
      state.dice.modifier = Number(button.dataset.modifier || 0);
      updateDiceExpressionFromControls();
    });
    els.diceExpression.addEventListener("input", () => {
      state.dice.expression = els.diceExpression.value;
      state.dice.lastRoll = null;
      els.diceError.hidden = true;
      saveState();
    });
    els.diceExpression.addEventListener("change", () => syncDiceControlsFromExpression(els.diceExpression.value));
    els.diceExpression.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        rollDiceExpression();
      }
    });
    els.rollDiceBtn.addEventListener("click", rollDiceExpression);
    els.diceClearSelection.addEventListener("click", () => {
      state.dice.counts = Object.fromEntries(DICE_SIDES.map(sides => [String(sides), 0]));
      state.dice.modifier = 0;
      state.dice.expression = "";
      state.dice.lastRoll = null;
      saveState();
      renderDice();
      els.diceExpression.focus();
    });
    els.diceClearHistory.addEventListener("click", () => {
      if (!state.dice.history.length || !confirm("¿Borrar el historial de tiradas de esta campaña?")) return;
      state.dice.history = [];
      saveState(true);
      renderDiceHistory();
    });

    document.addEventListener("keydown", event => {
      const ctrl = event.ctrlKey || event.metaKey;
      if (event.key === "Escape" && (connectionMode || locationItemPickMode)) {
        event.preventDefault();
        cancelConnectionMode();
      }
      if (ctrl && event.key.toLowerCase() === "k") {
        event.preventDefault();
        cancelConnectionMode(false);
        state.view = "notebook";
        renderView();
        els.globalSearch.focus();
      }
      if (ctrl && event.key.toLowerCase() === "s") {
        event.preventDefault();
        exportData();
      }
      if (ctrl && event.key === "Enter" && selectedEntry() && state.view === "notebook") {
        event.preventDefault();
        els.journalInput.focus();
      }
    });
  }


  const ACCESS_CODE_KEY = "forja-access-code-v1";
  const ACCESS_AUTH_KEY = "forja-access-authorized-v1";
  const ACCESS_DEFAULT_CODE = "2917";

  function publicProjectionMode() {
    const params = new URLSearchParams(location.search);
    return params.get("lan") === "1" || params.get("projection") === "1" || params.get("player") === "1";
  }

  function currentAccessCode() {
    try { return localStorage.getItem(ACCESS_CODE_KEY) || ACCESS_DEFAULT_CODE; }
    catch { return ACCESS_DEFAULT_CODE; }
  }

  function setAccessGateVisible(visible) {
    const gate = document.getElementById("accessGate");
    if (!gate) return;
    gate.hidden = !visible;
    document.documentElement.classList.toggle("access-locked", visible);
    if (visible) requestAnimationFrame(() => document.getElementById("accessGateCode")?.focus());
  }

  function initAccessGate() {
    if (publicProjectionMode()) { setAccessGateVisible(false); return; }
    let authorized = false;
    try { authorized = localStorage.getItem(ACCESS_AUTH_KEY) === "1"; } catch { authorized = false; }
    setAccessGateVisible(!authorized);
    const form = document.getElementById("accessGateForm");
    const input = document.getElementById("accessGateCode");
    const error = document.getElementById("accessGateError");
    form?.addEventListener("submit", event => {
      event.preventDefault();
      if (String(input?.value || "") !== currentAccessCode()) {
        if (error) { error.textContent = "Código incorrecto."; error.hidden = false; }
        if (input) { input.select(); input.focus(); }
        return;
      }
      try { localStorage.setItem(ACCESS_AUTH_KEY, "1"); } catch { /* storage can be blocked */ }
      if (error) error.hidden = true;
      if (input) input.value = "";
      setAccessGateVisible(false);
    });

    const changeForm = document.getElementById("changeAccessCodeForm");
    const first = document.getElementById("newAccessCode");
    const second = document.getElementById("newAccessCodeConfirm");
    const changeError = document.getElementById("accessCodeChangeError");
    changeForm?.addEventListener("submit", event => {
      event.preventDefault();
      const value = String(first?.value || "").trim();
      if (!/^\d{4,12}$/.test(value)) {
        if (changeError) { changeError.textContent = "Usa entre 4 y 12 dígitos."; changeError.hidden = false; }
        return;
      }
      if (value !== String(second?.value || "").trim()) {
        if (changeError) { changeError.textContent = "Los códigos no coinciden."; changeError.hidden = false; }
        return;
      }
      try { localStorage.setItem(ACCESS_CODE_KEY, value); localStorage.setItem(ACCESS_AUTH_KEY, "1"); }
      catch (storageError) {
        if (changeError) { changeError.textContent = "El navegador no permitió guardar el código."; changeError.hidden = false; }
        return;
      }
      if (changeError) { changeError.textContent = "Código actualizado en este dispositivo."; changeError.hidden = false; changeError.dataset.tone = "ok"; }
      if (first) first.value = "";
      if (second) second.value = "";
    });
  }


  let nativeFilePlugin = null;

  function getNativeFilePlugin() {
    if (nativeFilePlugin) return nativeFilePlugin;
    const cap = window.Capacitor;
    if (!cap?.isNativePlatform?.()) return null;
    try {
      if (typeof cap.registerPlugin === "function") nativeFilePlugin = cap.registerPlugin("LanHost");
      else nativeFilePlugin = cap.Plugins?.LanHost || null;
    } catch (error) {
      console.warn("No se pudo registrar el guardado nativo.", error);
      nativeFilePlugin = null;
    }
    return nativeFilePlugin;
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const value = String(reader.result || "");
        const comma = value.indexOf(",");
        resolve(comma >= 0 ? value.slice(comma + 1) : value);
      };
      reader.onerror = () => reject(reader.error || new Error("No se pudo preparar el archivo para Android."));
      reader.readAsDataURL(blob);
    });
  }

  function bytesToBase64(bytes) {
    let binary = "";
    const step = 0x8000;
    for (let offset = 0; offset < bytes.length; offset += step) {
      const slice = bytes.subarray(offset, Math.min(bytes.length, offset + step));
      binary += String.fromCharCode(...slice);
    }
    return btoa(binary);
  }

  async function saveBlob(blob, filename, mimeType = "") {
    const safeName = String(filename || "archivo").replace(/[\\/:*?"<>|]+/g, "-");
    const plugin = getNativeFilePlugin();
    if (plugin && window.Capacitor?.isNativePlatform?.()) {
      const mime = mimeType || blob.type || "application/octet-stream";

      // Android: transferimos el archivo por fragmentos a una copia temporal nativa
      // ANTES de abrir «Guardar como». Así el contenido no depende de conservar un
      // payload Base64 grande durante el ActivityResult del selector de documentos.
      if (plugin.beginFileSave && plugin.appendFileChunk && plugin.finishFileSave) {
        const bytes = new Uint8Array(await blob.arrayBuffer());
        const chunkSize = 192 * 1024;
        await plugin.beginFileSave({ filename: safeName, mime, totalBytes: bytes.length });
        try {
          for (let offset = 0; offset < bytes.length; offset += chunkSize) {
            const chunk = bytes.subarray(offset, Math.min(bytes.length, offset + chunkSize));
            await plugin.appendFileChunk({ base64: bytesToBase64(chunk) });
          }
          const result = await plugin.finishFileSave();
          return { native: true, cancelled: Boolean(result?.cancelled), uri: result?.uri || "", bytes: Number(result?.bytes || 0) };
        } catch (error) {
          try { await plugin.abortFileSave?.(); } catch (_) { /* ignore cleanup error */ }
          throw error;
        }
      }

      // Compatibilidad con el parche Android anterior.
      if (plugin.saveFile) {
        const base64 = await blobToBase64(blob);
        const result = await plugin.saveFile({ filename: safeName, mime, base64 });
        return { native: true, cancelled: Boolean(result?.cancelled), uri: result?.uri || "", bytes: Number(result?.bytes || 0) };
      }
    }

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = safeName;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    return { native: false, cancelled: false, uri: "", bytes: blob.size };
  }

  window.ForjaApp = {
    getProfile: () => profile,
    getState: () => state,
    getTypes: () => TYPES,
    saveState,
    render,
    renderView,
    activateCampaign,
    selectedEntry,
    selectEntryForPanel,
    clearEntryForPanel,
    renderEditor,
    exportJson: exportData,
    normaliseProfile,
    normaliseCampaign,
    replaceProfile(data) {
      profile = normaliseProfile(data);
      state = profile.campaigns.find(campaign => campaign.id === profile.activeCampaignId) || profile.campaigns[0];
      activeCollectionType = state.entries.find(entry => entry.id === state.selectedId)?.type || "locations";
      saveState(true);
      render();
      document.dispatchEvent(new CustomEvent("forja:campaignchange", { detail: { campaignId: state.id } }));
    },
    setView(view) {
      if (!["notebook", "calendar", "mindmap", "dice", "atlas", "dungeon"].includes(view)) return;
      state.view = view;
      saveState();
      renderView();
      if (view === "atlas") window.ForjaAtlas?.render?.();
      if (view === "dungeon") window.ForjaDungeon?.render?.();
    },
    uid,
    now,
    escapeHtml,
    clone,
    rollFormula,
    saveBlob
  };
  document.dispatchEvent(new CustomEvent("forja:ready"));

  initAccessGate();
  bindEvents();
  render();
  hydrateProfileFromIndexedDb().finally(() => saveState(true));

  window.addEventListener("pagehide", () => saveState(true));

  const nativeCapacitor = Boolean(window.Capacitor?.isNativePlatform?.());
  const lanPlayer = new URLSearchParams(location.search).get("lan") === "1";
  if ("serviceWorker" in navigator && location.protocol !== "file:" && !nativeCapacitor && !lanPlayer) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
})();
