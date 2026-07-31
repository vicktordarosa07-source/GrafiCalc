const STORAGE_KEYS = {
  state: "graficalc-state-v1",
  config: "graficalc-config-v1",
  configView: "graficalc-config-view-v1",
  configSection: "graficalc-config-section-v1",
  authUsers: "graficalc-auth-users-v1",
  authSession: "graficalc-auth-session-v1",
  authPendingVerification: "graficalc-auth-pending-verification-v1",
  accessControl: "graficalc-access-control-v1",
};

const SESSION_KEYS = {
  configUnlocked: "graficalc-config-unlocked-v1",
};

const DEVELOPER_ACCOUNT = {
  id: "developer-helder",
  username: "Helder Pedro da Rosa",
  company: "GrafiCalc",
  role: "developer",
  status: "active",
  groupId: "developer",
  emailVerification: {
    status: "verified",
    code: "",
    sentAt: "",
    verifiedAt: new Date().toISOString(),
    expiresAt: "",
    resendAvailableAt: "",
    lastDeliveryMode: "developer-bypass",
  },
};
const SHARED_API_PATH = "/api/shared-state";
const AUTH_EMAIL_API_PATH = "/api/auth/send-verification-code";
const AUTH_USERS_API_PATH = "/api/auth/users";
const AUTH_DEVELOPER_LOGIN_API_PATH = "/api/auth/developer-login";
const AUTH_SESSION_API_PATH = "/api/auth/session";
const AUTH_LOGOUT_API_PATH = "/api/auth/logout";
const CONFIG_UNLOCK_API_PATH = "/api/config/unlock";
const SHARED_SYNC_INTERVAL_MS = 20000;
const EMAIL_VERIFICATION_CODE_LENGTH = 6;
const EMAIL_VERIFICATION_COOLDOWN_MS = 60 * 1000;
const EMAIL_VERIFICATION_EXPIRATION_MS = 15 * 60 * 1000;

const APP_TAB_LABELS = [
  { id: "home", label: "Home" },
  { id: "conta", label: "Minha conta" },
  { id: "calculo", label: "Cálculo de apostila" },
  { id: "impressos", label: "Impressos coloridos" },
  { id: "credenciais", label: "Credenciais" },
  { id: "m2", label: "Cálculo de m²" },
  { id: "prontos", label: "Materiais prontos" },
  { id: "resinados", label: "Resinados" },
  { id: "cartoes", label: "Cartões de visita" },
  { id: "panfletos", label: "Panfletos e folders" },
  { id: "blocosSulfite", label: "Blocos sulfite 75g" },
  { id: "blocosAutocopiativo", label: "Blocos autocopiativo" },
  { id: "configuracao", label: "Configuração" },
  { id: "clientes", label: "Clientes" },
  { id: "os", label: "OS" },
  { id: "historico", label: "Histórico" },
  { id: "orcamento", label: "Orçamento" },
  { id: "desenvolvedor", label: "Área do desenvolvedor", developerOnly: true },
];

const OPTIONS = {
  printTypes: ["Preto e branco", "Colorido jato de tinta", "Colorido laser"],
  sizes: ["A4", "A5"],
  printModes: ["Só frente", "Frente e verso"],
  bleedModes: ["Sem sangra", "Com sangra"],
  finishing: ["Sem acabamento", "Encadernação espiral", "Encadernação wire-o", "Livreto", "Capa dura", "Capa mole laminada"],
  coverTypes: ["Sem capa", "Colorida so frente", "Colorida frente e verso"],
  backCoverTypes: ["Sem contracapa", "Colorida so frente", "Colorida frente e verso"],
  coverPapers: ["Sulfite 75g", "Papel couche 170g", "Papel couche 250g", "Papel couche 300g"],
  colorPaperTypes: [
    "Sulfite 75g",
    "Offset 120g",
    "Couche 170g",
    "Offset 170g",
    "Reciclato 170g",
    "Couche 250g",
    "Offset 240g",
    "Reciclato 240g",
    "Couche 300g",
    "Metalizado branco",
    "Metalizado amarelo",
  ],
  credentialMaterials: [
    "Couche 250g",
    "Couche 300g",
    "Offset 240g",
    "PS 1mm",
    "PS 2mm",
  ],
  credentialLamination: ["Sem laminação", "Com laminação"],
  spiralOptions: ["Completa", "Sem capas plásticas"],
  discountTypes: ["R$", "%"],
  calcModes: ["Independente", "Somar quantidades"],
  m2CalcModes: ["Independente", "Somar materiais iguais"],
};

const CONFIG_SECTIONS = ["calculo", "impressos", "credenciais", "m2", "prontos", "resinados", "cartoes", "panfletos"];
const QUOTE_STATUS_META = {
  pending: { label: "Pendente", tone: "pending" },
  sent: { label: "Enviado", tone: "info" },
  negotiation: { label: "Em negociação", tone: "accent" },
  approved: { label: "Aprovado", tone: "approved" },
  converted: { label: "Virou OS", tone: "accent" },
  completed: { label: "Concluído", tone: "completed" },
  cancelled: { label: "Cancelado", tone: "cancelled" },
};
const WORK_ORDER_STATUS_META = {
  created: { label: "Aberta", tone: "pending" },
  prepress: { label: "Pré-produção", tone: "info" },
  production: { label: "Produção", tone: "accent" },
  finishing: { label: "Acabamento", tone: "accent" },
  ready: { label: "Pronta para entrega", tone: "approved" },
  delivered: { label: "Entregue", tone: "completed" },
  closed: { label: "Fechada", tone: "completed" },
  cancelled: { label: "Cancelada", tone: "cancelled" },
};
const WORK_ORDER_PRIORITY_META = {
  normal: { label: "Normal", tone: "pending" },
  high: { label: "Alta", tone: "info" },
  urgent: { label: "Urgente", tone: "cancelled" },
};
const DASHBOARD_CARD_DEFS = [
  { id: "statusChart", label: "Gráfico de status" },
  { id: "quickLinks", label: "Acesso rápido" },
  { id: "topProducts", label: "Mais vendidos" },
  { id: "lowProducts", label: "Menos vendidos" },
];

const M2_CATALOG = [
  { id: "digital-cut", label: "Adesivo impressão digital com corte especial", configKey: "digitalCut", bleedMm: 2 },
  { id: "uv-cut", label: "Adesivo impressão UV com corte especial", configKey: "uvCut", bleedMm: 2 },
  { id: "uv-verniz", label: "Adesivo impressão UV com verniz ou tinta branca", configKey: "uvVerniz", bleedMm: 2 },
  { id: "flat-cut", label: "Adesivo corte reto/sem acabamento", configKey: "flatCut" },
  { id: "banner", label: "Banner", configKey: "banner" },
  { id: "perfurado", label: "Adesivo perfurado", configKey: "perfurado" },
  { id: "ps1mm", label: "Chapa PS1mm", configKey: "ps1mm" },
  { id: "ps2mm", label: "Chapa PS 2mm", configKey: "ps2mm" },
];

const DEFAULT_CARD_CATALOG = [
  ...["Couche 300g", "Offset 240g", "Reciclato 240g", "Metalizado branco 250g"].flatMap((paper) => [
    { printType: "laser", paper, side: "Só frente", quantity: 100, price: 42.5 },
    { printType: "laser", paper, side: "Só frente", quantity: 200, price: 63 },
    { printType: "laser", paper, side: "Só frente", quantity: 300, price: 97 },
    { printType: "laser", paper, side: "Só frente", quantity: 500, price: 119 },
    { printType: "laser", paper, side: "Só frente", quantity: 1000, price: 206 },
    { printType: "laser", paper, side: "Frente e verso colorido", quantity: 100, price: 67 },
    { printType: "laser", paper, side: "Frente e verso colorido", quantity: 200, price: 115 },
    { printType: "laser", paper, side: "Frente e verso colorido", quantity: 300, price: 140 },
    { printType: "laser", paper, side: "Frente e verso colorido", quantity: 500, price: 200 },
    { printType: "laser", paper, side: "Frente e verso colorido", quantity: 1000, price: 345 },
  ]),
  ...[
    ["Couche 250g verniz brilho total frente", "Só frente", [[1000, 121], [2000, 231], [3000, 352], [5000, 480]]],
    ["Couche 250g verniz brilho total frente", "Verso preto", [[1000, 129], [2000, 244], [3000, 373], [5000, 440]]],
    ["Couche 250g verniz brilho total frente", "Verso colorido", [[1000, 145], [2000, 278], [3000, 424], [5000, 500]]],
    ["Couche 300g verniz brilho total frente", "Só frente", [[1000, 140], [2000, 266], [3000, 400], [5000, 505]]],
    ["Couche 300g verniz brilho total frente", "Verso preto", [[1000, 143], [2000, 273], [3000, 410], [5000, 512]]],
    ["Couche 300g verniz brilho total frente", "Verso colorido", [[1000, 167], [2000, 321], [3000, 483], [5000, 580]]],
    ["Supremo 300g laminação brilho total frente", "Verso colorido", [[1000, 231], [2000, 448], [3000, 519], [5000, 854]]],
    ["Couche 300g laminação fosca e verniz localizado", "4x4 cores", [[500, 212], [1000, 254], [2000, 496], [3000, 732], [5000, 902]]],
    ["Couche 300g laminação fosca frente e verso e hotstamping frente", "4x0 cores", [[500, 426], [1000, 603]]],
    ["Couche 300g laminação fosca frente e verso e hotstamping frente", "4x4 cores", [[500, 481], [1000, 654]]],
  ].flatMap(([paper, side, rows]) => rows.map(([quantity, price]) => ({
    printType: "offset",
    paper,
    side,
    quantity,
    price,
  }))),
].map((item, index) => ({ id: `card-price-${index + 1}`, ...item }));

const DEFAULT_CARD_FINISHES = [
  { id: "furo-4mm", label: "Furo 4mm", type: "perHundred", holeSizeMm: 4, minimumPrice: 10, minimumUntilQuantity: 100, pricePerHundred: 3, thousandPrice: 25 },
  { id: "furo-6mm", label: "Furo 6mm", type: "perHundred", holeSizeMm: 6, minimumPrice: 10, minimumUntilQuantity: 100, pricePerHundred: 3, thousandPrice: 25 },
  { id: "cantos-arredondados", label: "Cantos arredondados", type: "perHundred", holeSizeMm: 0, minimumPrice: 10, minimumUntilQuantity: 100, pricePerHundred: 3, thousandPrice: 25 },
];

const LASER_FLYER_ROWS = [
  ["10x7cm", "4x0 cores", [[500, 131], [1000, 235], [2000, 433], [5000, 1040]]],
  ["10x7cm", "4x4 cores", [[500, 261], [1000, 450], [2000, 830], [5000, 1870]]],
  ["10x14cm", "4x0 cores", [[200, 104], [500, 197], [1000, 362], [2000, 709], [5000, 1573]]],
  ["10x14cm", "4x4 cores", [[200, 205], [500, 393], [1000, 707], [2000, 1337], [5000, 2831]]],
  ["14x20cm", "4x0 cores", [[100, 78], [200, 142], [300, 189], [500, 300], [750, 433], [1000, 591], [1500, 865], [2000, 1180], [3000, 1650]]],
  ["14x20cm", "4x4 cores", [[100, 155], [200, 276], [300, 370], [500, 582], [750, 850], [1000, 1150], [1500, 1650], [2000, 2202], [3000, 3146]]],
  ["9,5x20cm", "4x0 cores", [[200, 105], [500, 182], [750, 321], [1000, 432], [2000, 866], [3000, 1225], [5000, 2163]]],
  ["9,5x20cm", "4x4 cores", [[200, 208], [500, 432], [750, 624], [1000, 840], [2000, 1644], [3000, 2508], [5000, 4152]]],
  ["20x28,5cm", "4x0 cores", [[100, 138], [200, 268], [300, 398], [400, 519], [500, 657], [1000, 1297], [1500, 1947]]],
  ["20x28,5cm", "4x4 cores", [[100, 288], [200, 514], [300, 796], [400, 1021], [500, 1297], [1000, 2561], [1500, 3875]]],
];

const OFFSET_FLYER_ROWS = [
  ["Couche 90g", "10x14cm", "4x0 cores", [[2500, 290], [5000, 460], [10000, 684]]],
  ["Couche 90g", "10x14cm", "4x4 cores", [[2500, 325], [5000, 470], [10000, 761]]],
  ["Couche 90g", "14x20cm", "4x0 cores", [[2500, 455], [5000, 726], [10000, 1268]]],
  ["Couche 90g", "14x20cm", "4x4 cores", [[2500, 510], [5000, 838], [10000, 1413]]],
  ["Couche 90g", "20x28cm", "4x0 cores", [[2500, 891], [5000, 1345], [10000, 2344]]],
  ["Couche 90g", "20x28cm", "4x4 cores", [[2500, 956], [5000, 1549], [10000, 2617]]],
  ["Couche 90g", "28x40cm", "4x0 cores", [[2500, 1653], [5000, 2490]]],
  ["Couche 90g", "28x40cm", "4x4 cores", [[2500, 1742], [5000, 2871]]],
  ["Couche 115g", "10x15cm", "4x0 cores", [[2500, 379], [5000, 467], [10000, 924]]],
  ["Couche 115g", "10x15cm", "4x4 cores", [[2500, 445], [5000, 527], [10000, 976]]],
  ["Couche 115g", "15x20cm", "4x0 cores", [[2500, 597], [5000, 840], [10000, 1710]]],
  ["Couche 115g", "15x20cm", "4x4 cores", [[2500, 702], [5000, 924], [10000, 1806]]],
  ["Couche 115g", "20x30cm", "4x0 cores", [[2500, 1101], [5000, 1719], [10000, 3180]]],
  ["Couche 115g", "20x30cm", "4x4 cores", [[2500, 1297], [5000, 1806], [10000, 3591]]],
  ["Couche 115g", "30x40cm", "4x0 cores", [[2500, 2029], [5000, 3180]]],
  ["Couche 115g", "30x40cm", "4x4 cores", [[2500, 2396], [5000, 3591]]],
  ["Couche 115g", "Filipeta 10x20cm", "4x0 cores", [[2500, 440], [5000, 697]]],
  ["Couche 115g", "Filipeta 10x20cm", "4x4 cores", [[2500, 531], [5000, 784]]],
  ["Couche 150g", "10x15cm", "4x0 cores", [[2500, 440], [5000, 796], [10000, 1475]]],
  ["Couche 150g", "10x15cm", "4x4 cores", [[2500, 458], [5000, 808], [10000, 1497]]],
  ["Couche 150g", "15x21cm", "4x0 cores", [[2500, 796], [5000, 1475], [10000, 2484]]],
  ["Couche 150g", "15x21cm", "4x4 cores", [[2500, 808], [5000, 1376], [10000, 2771]]],
  ["Couche 150g", "20x29,7cm", "4x0 cores", [[2500, 1475], [5000, 2732], [10000, 5412]]],
  ["Couche 150g", "20x29,7cm", "4x4 cores", [[2500, 1497], [5000, 2771], [10000, 5490]]],
  ["Couche 150g", "Filipeta 10,5x21cm", "4x0 cores", [[2500, 796], [5000, 1475]]],
  ["Couche 150g", "Filipeta 10,5x21cm", "4x4 cores", [[2500, 808], [5000, 1497]]],
];

const DEFAULT_FLYER_CATALOG = [
  ...["Couche 120g", "Offset 120g"].flatMap((paper) =>
    LASER_FLYER_ROWS.flatMap(([size, colorMode, rows]) =>
      rows.map(([quantity, price]) => ({ printType: "laser", paper, size, colorMode, quantity, price }))
    )
  ),
  ...OFFSET_FLYER_ROWS.flatMap(([paper, size, colorMode, rows]) =>
    rows.map(([quantity, price]) => ({ printType: "offset", paper, size, colorMode, quantity, price }))
  ),
].map((item, index) => ({ id: `flyer-price-${index + 1}`, ...item }));

const DEFAULT_FLYER_FINISHES = [
  {
    id: "sem-acabamento",
    label: "Sem acabamento",
    minimumPrice: 0,
    minimumUntilQuantity: 100,
    pricePerHundred: 0,
    thousandPrice: 0,
  },
  {
    id: "uma-dobra",
    label: "1 dobra",
    minimumPrice: 10,
    minimumUntilQuantity: 100,
    pricePerHundred: 5,
    thousandPrice: 70,
  },
  {
    id: "duas-dobras",
    label: "2 dobras",
    minimumPrice: 15,
    minimumUntilQuantity: 100,
    pricePerHundred: 7,
    thousandPrice: 120,
  },
];

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const STORE_CATALOG_TAB_CATEGORY_MAP = {
  calculo: ["encadernacoes", "criacao", "scanners", "copias-e-coloridos"],
  impressos: [
    "copias-e-coloridos",
    "encadernacoes",
    "criacao",
    "xerox-e-riso",
    "offset-folha",
    "scanners",
    "cartoes-de-visita",
    "carimbos-e-crachas",
    "panfletos-e-folders",
    "panfletos-riso",
    "filipetas-e-postais",
    "acabamento-grafico",
    "displays-e-cavaletes",
    "camisetas-e-brindes",
    "sublimacao-e-transfer",
    "adesivos-especiais-folha",
    "chaveiros-e-brindes",
  ],
  m2: ["impressao-digital", "materiais-flexiveis", "banners-e-fotos", "corte-laser", "adesivos-especiais-m2"],
  prontos: [
    "impressao-digital",
    "carimbos-e-crachas",
    "panfletos-e-folders",
    "panfletos-riso",
    "filipetas-e-postais",
    "displays-e-cavaletes",
    "camisetas-e-brindes",
    "sublimacao-e-transfer",
    "adesivos-especiais-folha",
    "chaveiros-e-brindes",
    "cartoes-de-visita",
  ],
};

const STORE_SERVICE_CATEGORY_IDS = ["encadernacoes", "criacao", "acabamento-grafico"];
const HIDDEN_IMPRESSOS_SEED_CATEGORY_IDS = new Set([
  "sublimacao-e-transfer",
  "chaveiros-e-brindes",
]);
const HIDDEN_IMPRESSOS_SERVICE_CATEGORY_IDS = new Set([
  "plastificacao",
  "criacao",
  "encadernacoes",
]);
const AUTO_PLASTIFICATION_SERVICE_ID = "plastificacao-automatica";
const PLASTIFICATION_BORDER_MM = 5;
const PLASEAL_SIZES = [
  { id: "a4", label: "Polaseal A4", widthMm: 220, heightMm: 307, group: "a4-oficio" },
  { id: "oficio", label: "Polaseal oficio", widthMm: 226, heightMm: 340, group: "a4-oficio" },
  { id: "a3", label: "Polaseal A3", widthMm: 303, heightMm: 426, group: "a3" },
];
const PLASTIFICATION_A4_TIERS = [
  { min: 1, value: 4.65 },
  { min: 11, value: 4.1 },
  { min: 51, value: 3.85 },
  { min: 101, value: 3.7 },
];
const PLASTIFICATION_A4_MULTIUP = [
  { minItems: 2, value: 8 },
  { minItems: 4, value: 10 },
  { minItems: 6, value: 12 },
  { minItems: 8, value: 14 },
  { minItems: 10, value: 18 },
];
const PLASTIFICATION_A3_TIERS = [
  { min: 1, value: 10.4 },
  { min: 6, value: 8.7 },
  { min: 51, value: 8.1 },
];
const RESIN_A3_WIDTH_MM = 420;
const RESIN_A3_HEIGHT_MM = 297;
const RESIN_MARGIN_MM = 3;
const DEFAULT_M2_BLEED_BY_PRODUCT = {
  "digital-cut": 2,
  "uv-cut": 2,
  "uv-verniz": 2,
};
const RESIN_MATERIAL_OPTIONS = [
  { id: "white", label: "Adesivo branco", pricingKey: "standard" },
  { id: "transparent", label: "Adesivo transparente", pricingKey: "standard" },
  { id: "holo-gold", label: "Adesivo holográfico dourado", pricingKey: "special" },
  { id: "holo-silver", label: "Adesivo holográfico prateado", pricingKey: "special" },
];
const BLOCK_TAB_DEFS = {
  sulfite: {
    appTab: "blocosSulfite",
    label: "Blocos em papel sulfite 75g",
    bodyId: "blocks-sulfite-rows-table-body",
    warningId: "blocks-sulfite-warning-list",
    summaryPrefix: "blocks-sulfite",
  },
  autocopiativo: {
    appTab: "blocosAutocopiativo",
    label: "Blocos papel autocopiativo",
    bodyId: "blocks-autocopiativo-rows-table-body",
    warningId: "blocks-autocopiativo-warning-list",
    summaryPrefix: "blocks-autocopiativo",
  },
};
const HIDDEN_IMPRESSOS_SEED_PRODUCT_IDS = new Set([
  "adesivo-vinil-laser-sem-corte",
  "adesivo-vinil-laser-com-semicorte",
  "papel-adesivo-a4-com-corte",
  "cracha-speed",
  "xerox-a4-preto-branco",
  "xerox-a3-preto-branco",
  "ampliacao-a4",
  "riso-a4-papel-75g",
  "scanner-padrao",
  "scanner-folhas-soltas-advance",
  "panfletos-papel-75g-riso",
  "panfletos-offset-120g-riso",
  "carimbo-pelicula",
  "almofada-carimbo",
  "tinta-carimbo",
  "cordao-credencial",
  "cordao-20mm-estampado",
  "cordao-sem-estampa",
  "porta-cracha",
  "jacare-cracha",
  "adesivo-resinado-vinil-branco-ou-transparente",
  "adesivo-resinado-vinil-especial",
  "camisetas-basicas-sublimacao",
  "somente-estampa-camiseta-basica",
  "camisetas-dtf-textil",
  "caneca-ceramica",
  "caneca-aluminio",
  "caneca-plastico",
  "plastificacao-a4-sem-acabamento",
  "plastificacao-a4-com-acabamento",
  "plastificacao-a5",
  "plastificacao-rg",
  "plastificacao-a3-sem-acabamento",
  "plastificacao-a3-com-acabamento",
  "etiquetas-simples-digitacao",
  "acabamentos-terceirizados",
  "acabamentos-internos",
]);
const HIDDEN_IMPRESSOS_LABELS = [
  "adesivo vinil com impressao laser",
  "papel adesivo a4 com corte",
  "cracha em speed",
  "xerox a4",
  "xerox a3",
  "ampliacao",
  "impressao riso",
  "scanner",
  "so pelicula",
  "almofada",
  "tinta",
  "cordao para credencial",
  "cordao 20 mm com estampa",
  "cordao sem estampa",
  "porta cracha",
  "jacare",
  "resinado",
  "camiseta",
  "caneca",
  "plastificacao",
  "plastificacao tamanho",
  "polaseal",
].map((label) => normalizeLookupText(label));

let STORE_MASTER_SEED = {
  version: "fallback-empty-seed",
  currency: "BRL",
  locale: "pt-BR",
  source: {
    type: "fallback",
    description: "Catalogo nao carregado neste ambiente.",
    status: "empty-seed",
  },
  categories: [],
  addonGroups: [],
};

let storeSeedAttempted = false;

async function loadStoreMasterSeed() {
  if (storeSeedAttempted) {
    return STORE_MASTER_SEED;
  }

  storeSeedAttempted = true;
  if (globalThis.STORE_MASTER_SEED && Array.isArray(globalThis.STORE_MASTER_SEED.categories)) {
    STORE_MASTER_SEED = globalThis.STORE_MASTER_SEED;
    return STORE_MASTER_SEED;
  }

  try {
    const module = await import("./catalogo-loja.seed.mjs");
    if (module?.STORE_MASTER_SEED && Array.isArray(module.STORE_MASTER_SEED.categories)) {
      STORE_MASTER_SEED = module.STORE_MASTER_SEED;
    }
  } catch (error) {
    console.warn("Nao foi possivel carregar o catalogo externo neste modo de abertura.", error);
  }

  return STORE_MASTER_SEED;
}

function getDefaultBlockCatalog() {
  const source = Array.isArray(globalThis.GRAFICALC_BLOCK_CATALOG)
    ? globalThis.GRAFICALC_BLOCK_CATALOG
    : [];
  return source.map((item, index) => ({
    id: item.id || `block-price-${index + 1}`,
    tab: item.tab === "autocopiativo" ? "autocopiativo" : "sulfite",
    format: typeof item.format === "string" ? item.format : "A4",
    measure: typeof item.measure === "string" ? item.measure : "",
    vias: toWholeNumber(item.vias || 1),
    quantity: toWholeNumber(item.quantity || 1),
    price: toMoneyNumber(item.price),
  }));
}

function normalizeBlockCatalog(list) {
  const normalizeItem = (item, index) => ({
    id: item.id || `block-price-${index + 1}`,
    tab: item.tab === "autocopiativo" ? "autocopiativo" : "sulfite",
    format: typeof item.format === "string" && item.format.trim() ? item.format.trim() : "A4",
    measure: typeof item.measure === "string" ? item.measure.trim() : "",
    vias: Math.max(1, toWholeNumber(item.vias || 1)),
    quantity: Math.max(1, toWholeNumber(item.quantity || 1)),
    price: toMoneyNumber(item.price),
  });
  const catalogByKey = new Map();

  getDefaultBlockCatalog()
    .filter((item) => item && typeof item === "object")
    .map(normalizeItem)
    .forEach((item) => {
      catalogByKey.set(`${item.tab}|${item.format}|${item.vias}|${item.quantity}`, item);
    });

  if (Array.isArray(list) && list.length > 0) {
    list
      .filter((item) => item && typeof item === "object")
      .map(normalizeItem)
      .forEach((item) => {
        catalogByKey.set(`${item.tab}|${item.format}|${item.vias}|${item.quantity}`, item);
      });
  }

  return Array.from(catalogByKey.values());
}

function ensureSeedCatalogCoverage(config) {
  let changed = false;
  changed = ensureAutomaticPlastificationService(config) || changed;

  for (const tab of ["impressos", "m2", "prontos"]) {
    const categories = getStoreSeedCategoriesForTab(tab);
    for (const category of categories) {
      for (const product of category.products || []) {
        const shouldImport =
          (tab === "m2" && isM2SeedProductCompatible(product)) ||
          (tab === "impressos" && isStoreSeedColorProductCompatible(category.id, product)) ||
          (tab === "impressos" && isStoreSeedCombinationServiceCompatible(category.id, product)) ||
          (tab === "prontos" && isStoreSeedReadyProductCompatible(category.id, product));

        if (!shouldImport || isStoreSeedProductAvailable(tab, category.id, product, config)) {
          continue;
        }

        const result = importStoreSeedProductToConfig(tab, category.id, product.id, config);
        if (result?.ok) {
          changed = true;
        }
      }
    }
  }

  const hasImaGeladeira = (config.catalogSections || []).some((item) => item?.tab === "prontos" && normalizeLookupText(item.label) === normalizeLookupText("Ímã de geladeira"));
  if (!hasImaGeladeira) {
    const readyPricingKey = createUniqueM2PricingKey("ima-geladeira", new Set(Object.keys(config.readyProductPricing || {})));
    config.catalogSections.push({
      id: `produto-${Date.now()}-ima-geladeira`,
      label: "Ímã de geladeira",
      tab: "prontos",
      note: "Produto de materiais prontos.",
      pricingModel: "manual",
      unitLabel: "unidades",
      readyPricingKey,
      readyPricingMode: "manual",
      readyVariantMode: "",
    });
    config.readyProductPricing[readyPricingKey] = [];
    changed = true;
  }

  return changed;
}

function ensureAutomaticPlastificationService(config) {
  if (!Array.isArray(config.combinationServices)) {
    config.combinationServices = [];
  }

  const existingIndex = config.combinationServices.findIndex((service) => service?.id === AUTO_PLASTIFICATION_SERVICE_ID);
  const servicePayload = {
    id: AUTO_PLASTIFICATION_SERVICE_ID,
    label: "Plastificacao automatica",
    defaultPrice: 0,
    note: "Calcula o melhor aproveitamento entre polaseal A4, oficio e A3 com borda de 5 mm por lado.",
    pricingMode: "plastification-auto",
    sourceSeedId: "",
    sourceCategoryId: "auto",
  };

  if (existingIndex === -1) {
    config.combinationServices.unshift(servicePayload);
    return true;
  }

  const current = config.combinationServices[existingIndex];
  const next = { ...current, ...servicePayload };
  const changed = JSON.stringify(current) !== JSON.stringify(next);
  config.combinationServices[existingIndex] = next;
  return changed;
}

function isHiddenFromImpressos(productOrEntry = {}) {
  if (productOrEntry?.id === AUTO_PLASTIFICATION_SERVICE_ID || productOrEntry?.sourceSeedId === AUTO_PLASTIFICATION_SERVICE_ID) {
    return false;
  }

  const sourceCategoryId = String(productOrEntry?.sourceCategoryId || productOrEntry?.categoryId || "");
  if (HIDDEN_IMPRESSOS_SEED_CATEGORY_IDS.has(sourceCategoryId) || HIDDEN_IMPRESSOS_SERVICE_CATEGORY_IDS.has(sourceCategoryId)) {
    return true;
  }

  const sourceSeedId = String(productOrEntry?.sourceSeedId || productOrEntry?.id || "");
  if (HIDDEN_IMPRESSOS_SEED_PRODUCT_IDS.has(sourceSeedId)) {
    return true;
  }

  const normalizedLabel = normalizeLookupText(productOrEntry?.label || "");
  return HIDDEN_IMPRESSOS_LABELS.some((label) => normalizedLabel.includes(label));
}

function cleanupHiddenImpressosEntries(config, state = null) {
  let changed = false;
  const removedCatalogIds = new Set();
  const removedPricingKeys = new Set();
  const removedServiceIds = new Set();

  if (Array.isArray(config.catalogSections)) {
    const nextCatalogSections = [];
    for (const item of config.catalogSections) {
      const shouldRemove = item?.tab === "impressos" && isHiddenFromImpressos(item);
      if (shouldRemove) {
        removedCatalogIds.add(item.id);
        if (item.customPricingKey) {
          removedPricingKeys.add(item.customPricingKey);
        }
        changed = true;
        continue;
      }
      nextCatalogSections.push(item);
    }
    config.catalogSections = nextCatalogSections;
  }

  if (Array.isArray(config.combinationServices)) {
    const nextServices = [];
    for (const item of config.combinationServices) {
      const shouldRemove = isHiddenFromImpressos(item);
      if (shouldRemove) {
        removedServiceIds.add(item.id);
        changed = true;
        continue;
      }
      nextServices.push(item);
    }
    config.combinationServices = nextServices;
  }

  if (config.colorProductPricing && typeof config.colorProductPricing === "object") {
    for (const pricingKey of removedPricingKeys) {
      if (pricingKey in config.colorProductPricing) {
        delete config.colorProductPricing[pricingKey];
        changed = true;
      }
    }
  }

  if (state && Array.isArray(state.colorPrintItems) && (removedCatalogIds.size > 0 || removedServiceIds.size > 0)) {
    state.colorPrintItems = state.colorPrintItems.map((row) => {
      const nextRow = { ...row };
      if (removedCatalogIds.has(nextRow.productPresetId)) {
        nextRow.productPresetId = "";
        changed = true;
      }
      if (Array.isArray(nextRow.serviceIds)) {
        const filteredServiceIds = nextRow.serviceIds.filter((id) => !removedServiceIds.has(id));
        if (filteredServiceIds.length !== nextRow.serviceIds.length) {
          nextRow.serviceIds = filteredServiceIds;
          changed = true;
        }
      }
      if (nextRow.serviceOverrides && typeof nextRow.serviceOverrides === "object") {
        const nextOverrides = { ...nextRow.serviceOverrides };
        let overrideChanged = false;
        for (const serviceId of removedServiceIds) {
          if (serviceId in nextOverrides) {
            delete nextOverrides[serviceId];
            overrideChanged = true;
          }
        }
        if (overrideChanged) {
          nextRow.serviceOverrides = nextOverrides;
          changed = true;
        }
      }
      return nextRow;
    });
  }

  return changed;
}

function createDefaultConfig() {
  return {
    security: {
      configAccess: {
        mode: "password",
        password: "",
      },
    },
    blockCatalog: getDefaultBlockCatalog(),
    printPricing: {
      blackWhite: [
        { min: 1, value: 2.0, mode: "fixed" },
        { min: 2, value: 3.0, mode: "fixed" },
        { min: 3, value: 1.0, mode: "unit" },
        { min: 6, value: 0.6, mode: "unit" },
        { min: 11, value: 0.3, mode: "unit" },
        { min: 51, value: 0.2, mode: "unit" },
        { min: 100, value: 0.18, mode: "unit" },
        { min: 1000, value: 0.13, mode: "unit" },
        { min: 10000, value: 0.12, mode: "unit" },
      ],
      inkjet: [
        { min: 1, value: 2.0, label: "1 a 10" },
        { min: 11, value: 1.5, label: "11 a 20" },
        { min: 21, value: 1.0, label: "21 a 50" },
        { min: 51, value: 0.6, label: "51 a 99" },
        { min: 100, value: 0.4, label: "100 a 500" },
        { min: 501, value: 0.3, label: "501 a 1000" },
        { min: 1001, value: 0.25, label: "1001 a 5000" },
        { min: 5001, value: 0.2, label: "Acima de 5000" },
      ],
      laser: [
        { min: 1, value: 4.0, label: "1 a 5" },
        { min: 6, value: 3.5, label: "6 a 10" },
        { min: 11, value: 2.0, label: "11 a 50" },
        { min: 51, value: 1.9, label: "51 a 100" },
        { min: 101, value: 1.75, label: "101 a 300" },
        { min: 301, value: 1.5, label: "Acima de 300" },
      ],
    },
    coverPricing: {
      "Sulfite 75g": [
        { min: 1, value: 4.0, label: "1 a 5" },
        { min: 6, value: 3.5, label: "6 a 10" },
        { min: 11, value: 2.0, label: "11 a 50" },
        { min: 51, value: 1.9, label: "51 a 100" },
        { min: 101, value: 1.75, label: "101 a 300" },
        { min: 301, value: 1.5, label: "Acima de 300" },
      ],
      "Papel couche 170g": [
        { min: 1, value: 5.0, label: "1 a 5" },
        { min: 6, value: 4.0, label: "6 a 10" },
        { min: 11, value: 2.75, label: "11 a 50" },
        { min: 51, value: 2.4, label: "51 a 100" },
        { min: 101, value: 2.2, label: "101 a 300" },
        { min: 301, value: 2.0, label: "Acima de 300" },
      ],
      "Papel couche 250g": [
        { min: 1, value: 5.0, label: "1 a 5" },
        { min: 6, value: 4.0, label: "6 a 10" },
        { min: 11, value: 3.2, label: "11 a 50" },
        { min: 51, value: 2.85, label: "51 a 100" },
        { min: 101, value: 2.75, label: "101 a 300" },
        { min: 301, value: 2.45, label: "Acima de 300" },
      ],
      "Papel couche 300g": [
        { min: 1, value: 9.0, label: "1 a 5" },
        { min: 6, value: 8.0, label: "6 a 10" },
        { min: 11, value: 5.05, label: "11 a 50" },
        { min: 51, value: 4.9, label: "51 a 100" },
        { min: 101, value: 4.4, label: "101 a 300" },
        { min: 301, value: 4.4, label: "Acima de 300 (assumido)" },
      ],
    },
    spiralPricing: [
      { maxSheets: 50, rates: { "1": 4.5, "21": 3.8, "51": 3.7, "101": 3.3 } },
      { maxSheets: 100, rates: { "1": 5.0, "21": 4.3, "51": 4.2, "101": 3.8 } },
      { maxSheets: 200, rates: { "1": 8.2, "21": 6.3, "51": 5.9, "101": 5.7 } },
      { maxSheets: 300, rates: { "1": 18.0, "21": 18.0, "51": 18.0, "101": 18.0 } },
      { maxSheets: 500, rates: { "1": 30.0, "21": 30.0, "51": 30.0, "101": 30.0 } },
    ],
    wireOPricing: [
      { maxSheets: 50, rates: { "1": 4.5, "21": 3.8, "51": 3.7, "101": 3.3 } },
      { maxSheets: 100, rates: { "1": 5.0, "21": 4.3, "51": 4.2, "101": 3.8 } },
      { maxSheets: 200, rates: { "1": 8.2, "21": 6.3, "51": 5.9, "101": 5.7 } },
      { maxSheets: 300, rates: { "1": 18.0, "21": 18.0, "51": 18.0, "101": 18.0 } },
      { maxSheets: 500, rates: { "1": 30.0, "21": 30.0, "51": 30.0, "101": 30.0 } },
    ],
    bookletPricing: [
      { min: 1, value: 2.0, label: "Ate 10" },
      { min: 11, value: 1.5, label: "10 a 20" },
      { min: 21, value: 0.5, label: "Acima de 21" },
    ],
    hardCoverPricing: [
      { min: 1, value: 0, label: "1 unidade" },
      { min: 10, value: 0, label: "A partir de 10" },
      { min: 50, value: 0, label: "A partir de 50" },
    ],
    laminatedSoftCoverPricing: [
      { min: 1, value: 0, label: "1 unidade" },
      { min: 10, value: 0, label: "A partir de 10" },
      { min: 50, value: 0, label: "A partir de 50" },
    ],
    colorPrintPricing: {
      "Sulfite 75g": [
        { min: 1, value: 4.0, label: "1 a 5" },
        { min: 6, value: 3.5, label: "6 a 10" },
        { min: 11, value: 2.0, label: "11 a 50" },
        { min: 51, value: 1.9, label: "51 a 100" },
        { min: 101, value: 1.75, label: "101 a 300" },
        { min: 301, value: 1.5, label: "Acima de 300" },
      ],
      "Offset 120g": [
        { min: 1, value: 5.0, label: "1 a 5" },
        { min: 6, value: 4.0, label: "6 a 10" },
        { min: 11, value: 2.45, label: "11 a 50" },
        { min: 51, value: 2.3, label: "51 a 100" },
        { min: 101, value: 2.2, label: "101 a 300" },
        { min: 301, value: 1.95, label: "Acima de 300" },
      ],
      "170g": [
        { min: 1, value: 5.0, label: "1 a 5" },
        { min: 6, value: 4.0, label: "6 a 10" },
        { min: 11, value: 2.75, label: "11 a 50" },
        { min: 51, value: 2.4, label: "51 a 100" },
        { min: 101, value: 2.2, label: "101 a 300" },
        { min: 301, value: 2.0, label: "Acima de 300" },
      ],
      "250g": [
        { min: 1, value: 5.0, label: "1 a 5" },
        { min: 6, value: 4.0, label: "6 a 10" },
        { min: 11, value: 3.2, label: "11 a 50" },
        { min: 51, value: 2.85, label: "51 a 100" },
        { min: 101, value: 2.75, label: "101 a 300" },
        { min: 301, value: 2.45, label: "Acima de 300" },
      ],
      "300g": [
        { min: 1, value: 9.0, label: "1 a 5" },
        { min: 6, value: 8.0, label: "6 a 10" },
        { min: 11, value: 5.05, label: "11 a 50" },
        { min: 51, value: 4.9, label: "51 a 100" },
        { min: 101, value: 4.4, label: "101 a 300" },
        { min: 301, value: 4.4, label: "Acima de 300 (assumido)" },
      ],
    },
    credentialLanyardPricing: {
      roundWhite2mm: 0.75,
      plainBadge: 2.75,
      printed: [
        { min: 1, value: 8.0, label: "Até 19" },
        { min: 20, value: 6.5, label: "20 a 29" },
        { min: 30, value: 5.0, label: "30 a 49" },
        { min: 50, value: 4.0, label: "50 ou mais" },
      ],
    },
    cutPricing: {
      upToFiveSheets: [
        { minUp: 1, value: 2.0, label: "Ate 11 por folha" },
        { minUp: 12, value: 2.5, label: "Acima de 11 por folha" },
        { minUp: 21, value: 3.0, label: "Acima de 20 por folha" },
        { minUp: 51, value: 10.0, label: "Acima de 50 por folha" },
      ],
      aboveFiveSheetsPerCut: 1.0,
    },
    m2Pricing: {
      digitalCut: [
        { min: 1, value: 30, label: "Valor minimo" },
        { min: 2, value: 90, label: "até 2 m²" },
        { min: 4, value: 85, label: "de 2 até 4 m²" },
        { min: 6, value: 80, label: "de 4 até 6 m²" },
        { min: 10, value: 75, label: "de 6 até 10 m²" },
        { min: 1000000, value: 65, label: "acima de 10 m²" },
      ],
      uvCut: [
        { min: 1, value: 30, label: "Valor minimo" },
        { min: 2, value: 125, label: "até 2 m²" },
        { min: 4, value: 115, label: "de 2 até 4 m²" },
        { min: 6, value: 110, label: "de 4 até 6 m²" },
        { min: 10, value: 105, label: "de 6 até 10 m²" },
        { min: 1000000, value: 100, label: "acima de 10 m²" },
      ],
      uvVerniz: [
        { min: 1, value: 30, label: "Valor minimo" },
        { min: 2, value: 155, label: "até 2 m²" },
        { min: 4, value: 145, label: "de 2 até 4 m²" },
        { min: 6, value: 140, label: "de 4 até 6 m²" },
        { min: 10, value: 135, label: "de 6 até 10 m²" },
        { min: 1000000, value: 130, label: "acima de 10 m²" },
      ],
      flatCut: [
        { min: 1, value: 30, label: "Valor minimo" },
        { min: 2, value: 70, label: "até 2 m²" },
        { min: 4, value: 65, label: "de 2 até 4 m²" },
        { min: 6, value: 63, label: "de 4 até 6 m²" },
        { min: 10, value: 60, label: "de 6 até 10 m²" },
        { min: 1000000, value: 58, label: "acima de 10 m²" },
      ],
      banner: [
        { min: 1, value: 35, label: "Valor minimo" },
        { min: 2, value: 80, label: "até 2 m²" },
        { min: 4, value: 75, label: "de 2 até 4 m²" },
        { min: 6, value: 73, label: "de 4 até 6 m²" },
        { min: 10, value: 70, label: "de 6 até 10 m²" },
        { min: 1000000, value: 68, label: "acima de 10 m²" },
      ],
      perfurado: [
        { min: 1, value: 45, label: "Valor minimo" },
        { min: 5, value: 88, label: "de 1 até 5 m²" },
        { min: 1000000, value: 75, label: "acima de 5 m²" },
      ],
      ps1mm: [
        { min: 1, value: 39, label: "Valor minimo" },
        { min: 1, value: 176, label: "até 1 m²" },
        { min: 2, value: 164, label: "de 1 até 2 m²" },
        { min: 4, value: 152, label: "de 2 até 4 m²" },
        { min: 10, value: 146, label: "de 4 até 10 m²" },
        { min: 1000000, value: 144, label: "acima de 10 m²" },
      ],
      ps2mm: [
        { min: 1, value: 39, label: "Valor minimo" },
        { min: 1, value: 200, label: "até 1 m²" },
        { min: 2, value: 194, label: "de 1 até 2 m²" },
        { min: 4, value: 188, label: "de 2 até 4 m²" },
        { min: 10, value: 182, label: "de 4 até 10 m²" },
        { min: 1000000, value: 178, label: "acima de 10 m²" },
      ],
    },
    m2Finishes: [
      { id: "ilhós-simples", label: "Ilhós Simples", type: "eyelet", price: 0.9, spacingCm: 20 },
      { id: "ilhós-latão", label: "Ilhós Latão", type: "eyelet", price: 1.5, spacingCm: 20 },
      { id: "bainha-corda", label: "Bainha com corda", type: "perimeter", price: 5.0 },
      { id: "laminacao", label: "Laminação", type: "area", price: 25.0 },
      { id: "verniz-laka", label: "Verniz laka", type: "area", price: 5.0 },
    ],
    m2BleedByProduct: { ...DEFAULT_M2_BLEED_BY_PRODUCT },
    resinPricing: {
      minimumOrderPrice: 35,
      markupPercent: 0,
      spacingMm: 3,
      standard: [
        { min: 1, value: 32, label: "1 folha A3" },
        { min: 2, value: 30, label: "2 folhas A3" },
        { min: 5, value: 28, label: "5 folhas A3" },
        { min: 10, value: 24, label: "10 folhas A3" },
      ],
      special: [
        { min: 1, value: 45, label: "1 folha A3" },
        { min: 2, value: 40, label: "2 folhas A3" },
        { min: 5, value: 38, label: "5 folhas A3" },
        { min: 10, value: 35, label: "10 folhas A3" },
      ],
    },
    colorProductPricing: {},
    readyProductPricing: {},
    cardPricing: deepClone(DEFAULT_CARD_CATALOG),
    cardFinishes: deepClone(DEFAULT_CARD_FINISHES),
    flyerPricing: deepClone(DEFAULT_FLYER_CATALOG),
    flyerFinishes: deepClone(DEFAULT_FLYER_FINISHES),
    catalogSections: [],
    combinationServices: [],
    spiralPlasticDiscount: 1.5,
  };
}

function createDefaultRow(index) {
  return {
    id: `row-${index + 1}`,
    description: "",
    printType: "Preto e branco",
    size: "A4",
  printMode: "Só frente",
    finishing: "Sem acabamento",
    bindingGroup: "",
    quantity: 0,
    pages: 0,
    coverType: "Sem capa",
    coverPaper: "Sulfite 75g",
    backCoverType: "Sem contracapa",
    backCoverPaper: "Sulfite 75g",
    spiralOption: "Completa",
    discountType: "R$",
    discountValue: 0,
  };
}

function createDefaultColorPrintRow(index) {
  return {
    id: `color-row-${index + 1}`,
    productPresetId: "",
    description: "",
    widthMm: 0,
    heightMm: 0,
    bleedMode: "Sem sangra",
    printMode: "Só frente",
    paperType: "Sulfite 75g",
    quantity: 0,
    cutPriceOverride: "",
    serviceIds: [],
    serviceOverrides: {},
    discountType: "R$",
    discountValue: 0,
  };
}

function createDefaultCredentialRow(index) {
  return {
    id: `credential-row-${index + 1}`,
    description: "",
    materialType: "Couche 250g",
    printMode: "Só frente",
    lamination: "Sem laminação",
    lanyardType: "none",
    widthCm: 0,
    heightCm: 0,
    quantity: 0,
    discountType: "R$",
    discountValue: 0,
  };
}

function createDefaultM2Row(index) {
  return {
    id: `m2-row-${index + 1}`,
    productId: M2_CATALOG[0].id,
    description: "",
    measureUnit: "cm",
    widthMm: 0,
    heightMm: 0,
    quantity: 0,
    finishIds: [],
    finishOverrides: {},
    extraCharge: 0,
    artCreationFee: 0,
    discountType: "R$",
    discountValue: 0,
    touched: false,
  };
}

function createDefaultReadyRow(index) {
  return {
    id: `ready-row-${index + 1}`,
    productId: "",
    variantIndex: 0,
    description: "",
    quantity: 0,
    basePriceOverride: "",
    extraCharge: 0,
    artCreationFee: 0,
    discountType: "R$",
    discountValue: 0,
  };
}

function createDefaultResinRow(index) {
  return {
    id: `resin-row-${index + 1}`,
    materialType: "white",
    description: "",
    widthMm: 0,
    heightMm: 0,
    quantity: 0,
    discountType: "R$",
    discountValue: 0,
  };
}

function createDefaultBlockRow(tab, index) {
  const first = getDefaultBlockCatalog().find((item) => item.tab === tab) || getDefaultBlockCatalog()[0] || {};
  return {
    id: `block-${tab}-row-${index + 1}`,
    description: "",
    format: first.format || "A4",
    vias: first.vias || 1,
    quantity: first.quantity || 1,
    artCreationFee: 0,
    discountType: "R$",
    discountValue: 0,
  };
}

function createDefaultCardRow(index) {
  const first = DEFAULT_CARD_CATALOG[0] || {};
  return {
    id: `card-row-${index + 1}`,
    description: "",
    printType: first.printType || "laser",
    paper: first.paper || "Couche 300g",
    side: first.side || "Só frente",
    quantity: first.quantity || 100,
    finishIds: [],
    finishOverrides: {},
    artCreationFee: 0,
    discountType: "R$",
    discountValue: 0,
    touched: false,
  };
}

function createDefaultFlyerRow(index) {
  const first = DEFAULT_FLYER_CATALOG[0] || {};
  return {
    id: `flyer-row-${index + 1}`,
    description: "",
    printType: first.printType || "laser",
    paper: first.paper || "Couche 120g",
    size: first.size || "10x7cm",
    colorMode: first.colorMode || "4x0 cores",
    quantity: first.quantity || 500,
    finishId: "sem-acabamento",
    artCreationFee: 0,
    discountType: "R$",
    discountValue: 0,
    touched: false,
  };
}

function createDefaultState() {
  return {
    calcMode: "Independente",
    m2CalcMode: "Independente",
    presets: {
      printType: "Preto e branco",
      size: "A4",
      printMode: "Só frente",
      finishing: "Sem acabamento",
      coverType: "Sem capa",
      coverPaper: "Sulfite 75g",
      backCoverType: "Sem contracapa",
      backCoverPaper: "Sulfite 75g",
      spiralOption: "Completa",
    },
    rows: Array.from({ length: 5 }, (_, index) => createDefaultRow(index)),
    colorPrintItems: Array.from({ length: 5 }, (_, index) => createDefaultColorPrintRow(index)),
    credentialItems: Array.from({ length: 5 }, (_, index) => createDefaultCredentialRow(index)),
    m2Items: Array.from({ length: 5 }, (_, index) => createDefaultM2Row(index)),
    readyItems: Array.from({ length: 5 }, (_, index) => createDefaultReadyRow(index)),
    resinItems: Array.from({ length: 5 }, (_, index) => createDefaultResinRow(index)),
    cardItems: Array.from({ length: 5 }, (_, index) => createDefaultCardRow(index)),
    flyerItems: Array.from({ length: 5 }, (_, index) => createDefaultFlyerRow(index)),
    blockItems: {
      sulfite: Array.from({ length: 5 }, (_, index) => createDefaultBlockRow("sulfite", index)),
      autocopiativo: Array.from({ length: 5 }, (_, index) => createDefaultBlockRow("autocopiativo", index)),
    },
    client: {
      name: "",
      contact: "",
      cnpj: "",
    },
    company: {
      name: "GrafiCalc",
      cnpj: "04.516.832/0001-16",
      contact: "",
      address: "Rua Coronel Pedro Demoro, 1793 - Galeria Alecio - Estreito - Fpolis",
      logoDataUrl: "",
    },
    clients: [],
    quoteHistory: [],
    workOrders: [],
    paymentTerms: "",
    quoteNotes: "",
  };
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeCatalogSections(list) {
  if (!Array.isArray(list)) {
    return [];
  }

  const normalized = [];
  for (const item of list) {
    if (!item || typeof item !== "object") {
      continue;
    }
    if (Array.isArray(item.products)) {
      const tab = item.tab === "calculo" || item.tab === "impressos" || item.tab === "m2" || item.tab === "prontos" ? item.tab : "m2";
      for (const product of item.products) {
        if (!product || typeof product !== "object") {
          continue;
        }
        normalized.push({
          id: product.id || `produto-${Date.now()}`,
          label: product.label || "Novo produto",
          tab,
          note: product.note || "",
        });
      }
      continue;
    }
    if (item.tab === "calculo" || item.tab === "impressos" || item.tab === "m2" || item.tab === "prontos") {
      normalized.push({
        id: item.id || `produto-${Date.now()}`,
        label: item.label || item.name || "Novo produto",
        tab: item.tab,
        pricingKey: item.tab === "m2" ? (item.pricingKey || "banner") : "",
        note: item.note || "",
        sourceSeedId: item.sourceSeedId || "",
        sourceCategoryId: item.sourceCategoryId || "",
        pricingModel: item.pricingModel || "",
        bleedMm: Number.isFinite(Number(item.bleedMm)) ? Number(item.bleedMm) : 0,
        widthCm: Number.isFinite(Number(item.widthCm)) ? Number(item.widthCm) : 0,
        heightCm: Number.isFinite(Number(item.heightCm)) ? Number(item.heightCm) : 0,
        bleedMode: item.bleedMode || "Sem sangra",
        printMode: item.printMode || "Só frente",
        paperType: item.paperType || "Sulfite 75g",
        customPricingKey: item.customPricingKey || "",
        customPricingMode: item.customPricingMode || "",
        unitLabel: item.unitLabel || "",
        readyPricingKey: item.readyPricingKey || "",
        readyPricingMode: item.readyPricingMode || "",
        readyVariantMode: item.readyVariantMode || "",
      });
    }
  }
  return normalized;
}

function createUniqueM2PricingKey(baseKey, existingKeys) {
  const base = `custom-${baseKey}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  let candidate = base;
  let counter = 1;
  while (existingKeys.has(candidate)) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }
  existingKeys.add(candidate);
  return candidate;
}

function normalizeM2Finishes(candidateFinishes, defaultFinishes) {
  const defaults = Array.isArray(defaultFinishes) ? defaultFinishes : [];
  if (!Array.isArray(candidateFinishes) || candidateFinishes.length === 0) {
    return deepClone(defaults);
  }

  const normalized = candidateFinishes
    .filter((item) => item && typeof item === "object")
    .map((item, index) => ({
      id: item.id || `acabamento-${Date.now()}-${index}`,
      label: item.label || "Novo acabamento",
      type: item.type || "area",
      price: Number.isFinite(Number(item.price)) ? Number(item.price) : 0,
      spacingCm: item.spacingCm === "" || item.spacingCm == null ? "" : Number(item.spacingCm),
    }));

  const existingKeys = new Set(
    normalized.map((item) => `${String(item.id || "").trim().toLowerCase()}::${String(item.label || "").trim().toLowerCase()}`)
  );

  for (const finish of defaults) {
    const key = `${String(finish.id || "").trim().toLowerCase()}::${String(finish.label || "").trim().toLowerCase()}`;
    if (!existingKeys.has(key)) {
      normalized.push(deepClone(finish));
    }
  }

  return normalized;
}

function normalizeCombinationServices(candidateServices) {
  if (!Array.isArray(candidateServices)) {
    return [];
  }

  return candidateServices
    .filter((item) => item && typeof item === "object")
    .map((item, index) => ({
      id: item.id || `servico-${Date.now()}-${index}`,
      label: item.label || "Novo complemento",
      defaultPrice: Number.isFinite(Number(item.defaultPrice)) ? Number(item.defaultPrice) : 0,
      note: item.note || "",
      pricingMode: item.pricingMode || "manual",
      sourceSeedId: item.sourceSeedId || "",
      sourceCategoryId: item.sourceCategoryId || "",
    }));
}

function normalizeCardPricing(candidatePricing, defaultPricing = DEFAULT_CARD_CATALOG) {
  const pricingByKey = new Map();
  const addRows = (rows) => {
    if (!Array.isArray(rows)) {
      return;
    }
    rows
      .filter((item) => item && typeof item === "object")
      .forEach((item, index) => {
        const normalized = {
          id: item.id || `card-price-${index + 1}`,
          printType: item.printType === "offset" ? "offset" : "laser",
          paper: typeof item.paper === "string" && item.paper.trim() ? item.paper.trim() : "Couche 300g",
          side: typeof item.side === "string" && item.side.trim() ? item.side.trim() : "Só frente",
          quantity: Math.max(1, toWholeNumber(item.quantity || 1)),
          price: toMoneyNumber(item.price),
        };
        pricingByKey.set(`${normalized.printType}|${normalized.paper}|${normalized.side}|${normalized.quantity}`, normalized);
      });
  };
  addRows(defaultPricing);
  addRows(candidatePricing);
  return Array.from(pricingByKey.values()).map((item, index) => ({ ...item, id: item.id || `card-price-${index + 1}` }));
}

function normalizeCardFinishes(candidateFinishes, defaultFinishes = DEFAULT_CARD_FINISHES) {
  const finishById = new Map();
  const addRows = (rows) => {
    if (!Array.isArray(rows)) {
      return;
    }
    rows
      .filter((item) => item && typeof item === "object")
      .forEach((item, index) => {
        const id = item.id || `card-finish-${index + 1}`;
        finishById.set(id, {
          id,
          label: typeof item.label === "string" && item.label.trim() ? item.label.trim() : "Novo acabamento",
          type: item.type || "perHundred",
          holeSizeMm: Math.max(0, toDecimalNumber(item.holeSizeMm)),
          minimumPrice: toMoneyNumber(item.minimumPrice),
          minimumUntilQuantity: Math.max(1, toWholeNumber(item.minimumUntilQuantity || 100)),
          pricePerHundred: toMoneyNumber(item.pricePerHundred),
          thousandPrice: toMoneyNumber(item.thousandPrice),
        });
      });
  };
  addRows(defaultFinishes);
  addRows(candidateFinishes);
  return Array.from(finishById.values());
}

function normalizeFlyerPricing(candidatePricing, defaultPricing = DEFAULT_FLYER_CATALOG) {
  const pricingByKey = new Map();
  const addRows = (rows) => {
    if (!Array.isArray(rows)) {
      return;
    }
    rows
      .filter((item) => item && typeof item === "object")
      .forEach((item, index) => {
        const normalized = {
          id: item.id || `flyer-price-${index + 1}`,
          printType: item.printType === "offset" ? "offset" : "laser",
          paper: typeof item.paper === "string" && item.paper.trim() ? item.paper.trim() : "Couche 120g",
          size: typeof item.size === "string" && item.size.trim() ? item.size.trim() : "10x7cm",
          colorMode: typeof item.colorMode === "string" && item.colorMode.trim() ? item.colorMode.trim() : "4x0 cores",
          quantity: Math.max(1, toWholeNumber(item.quantity || 1)),
          price: toMoneyNumber(item.price),
        };
        pricingByKey.set(`${normalized.printType}|${normalized.paper}|${normalized.size}|${normalized.colorMode}|${normalized.quantity}`, normalized);
      });
  };
  addRows(defaultPricing);
  addRows(candidatePricing);
  return Array.from(pricingByKey.values()).map((item, index) => ({ ...item, id: item.id || `flyer-price-${index + 1}` }));
}

function normalizeFlyerFinishes(candidateFinishes, defaultFinishes = DEFAULT_FLYER_FINISHES) {
  const finishById = new Map();
  const addRows = (rows) => {
    if (!Array.isArray(rows)) {
      return;
    }
    rows
      .filter((item) => item && typeof item === "object")
      .forEach((item, index) => {
        const id = item.id || `flyer-finish-${index + 1}`;
        finishById.set(id, {
          id,
          label: typeof item.label === "string" && item.label.trim() ? item.label.trim() : "Novo acabamento",
          minimumPrice: toMoneyNumber(item.minimumPrice),
          minimumUntilQuantity: Math.max(1, toWholeNumber(item.minimumUntilQuantity || 100)),
          pricePerHundred: toMoneyNumber(item.pricePerHundred),
          thousandPrice: toMoneyNumber(item.thousandPrice),
        });
      });
  };
  addRows(defaultFinishes);
  addRows(candidateFinishes);
  return Array.from(finishById.values());
}

function mergeConfig(candidate) {
  const defaults = createDefaultConfig();
  if (!candidate || typeof candidate !== "object") {
    return defaults;
  }

  const merged = deepClone(defaults);
  merged.blockCatalog = normalizeBlockCatalog(candidate.blockCatalog);

  if (candidate.security && typeof candidate.security === "object") {
    const configAccess = candidate.security.configAccess && typeof candidate.security.configAccess === "object"
      ? candidate.security.configAccess
      : {};
    merged.security.configAccess = {
      mode: configAccess.mode === "open" ? "open" : "password",
      password: typeof configAccess.password === "string" ? configAccess.password : "",
    };
  }

  if (candidate.printPricing) {
    merged.printPricing = {
      blackWhite: Array.isArray(candidate.printPricing.blackWhite) ? candidate.printPricing.blackWhite : merged.printPricing.blackWhite,
      inkjet: Array.isArray(candidate.printPricing.inkjet) ? candidate.printPricing.inkjet : merged.printPricing.inkjet,
      laser: Array.isArray(candidate.printPricing.laser) ? candidate.printPricing.laser : merged.printPricing.laser,
    };
  }

  if (candidate.coverPricing && typeof candidate.coverPricing === "object") {
    for (const paper of OPTIONS.coverPapers) {
      if (Array.isArray(candidate.coverPricing[paper])) {
        merged.coverPricing[paper] = candidate.coverPricing[paper];
      }
    }
  }

  if (Array.isArray(candidate.spiralPricing)) {
    merged.spiralPricing = candidate.spiralPricing;
  }

  if (Array.isArray(candidate.wireOPricing)) {
    merged.wireOPricing = candidate.wireOPricing;
  }

  if (Array.isArray(candidate.bookletPricing)) {
    merged.bookletPricing = candidate.bookletPricing;
  }

  if (Array.isArray(candidate.hardCoverPricing)) {
    merged.hardCoverPricing = candidate.hardCoverPricing;
  }

  if (Array.isArray(candidate.laminatedSoftCoverPricing)) {
    merged.laminatedSoftCoverPricing = candidate.laminatedSoftCoverPricing;
  }

  if (candidate.colorPrintPricing && typeof candidate.colorPrintPricing === "object") {
    for (const key of Object.keys(merged.colorPrintPricing)) {
      if (Array.isArray(candidate.colorPrintPricing[key])) {
        merged.colorPrintPricing[key] = candidate.colorPrintPricing[key];
      }
    }
  }

  if (candidate.credentialLanyardPricing && typeof candidate.credentialLanyardPricing === "object") {
    merged.credentialLanyardPricing.roundWhite2mm = Number.isFinite(Number(candidate.credentialLanyardPricing.roundWhite2mm))
      ? Number(candidate.credentialLanyardPricing.roundWhite2mm)
      : merged.credentialLanyardPricing.roundWhite2mm;
    merged.credentialLanyardPricing.plainBadge = Number.isFinite(Number(candidate.credentialLanyardPricing.plainBadge))
      ? Number(candidate.credentialLanyardPricing.plainBadge)
      : merged.credentialLanyardPricing.plainBadge;
    if (Array.isArray(candidate.credentialLanyardPricing.printed)) {
      merged.credentialLanyardPricing.printed = candidate.credentialLanyardPricing.printed;
    }
  }

  if (candidate.cutPricing && typeof candidate.cutPricing === "object") {
    if (Array.isArray(candidate.cutPricing.upToFiveSheets)) {
      merged.cutPricing.upToFiveSheets = candidate.cutPricing.upToFiveSheets;
    }
    if (Number.isFinite(Number(candidate.cutPricing.aboveFiveSheetsPerCut))) {
      merged.cutPricing.aboveFiveSheetsPerCut = Number(candidate.cutPricing.aboveFiveSheetsPerCut);
    }
  }

  merged.m2Finishes = normalizeM2Finishes(candidate.m2Finishes, defaults.m2Finishes);

  if (candidate.m2BleedByProduct && typeof candidate.m2BleedByProduct === "object") {
    merged.m2BleedByProduct = { ...defaults.m2BleedByProduct };
    for (const [productId, value] of Object.entries(candidate.m2BleedByProduct)) {
      if (Number.isFinite(Number(value))) {
        merged.m2BleedByProduct[productId] = Math.max(0, Number(value));
      }
    }
  }

  if (candidate.resinPricing && typeof candidate.resinPricing === "object") {
    merged.resinPricing.minimumOrderPrice = Number.isFinite(Number(candidate.resinPricing.minimumOrderPrice))
      ? Number(candidate.resinPricing.minimumOrderPrice)
      : merged.resinPricing.minimumOrderPrice;
    merged.resinPricing.markupPercent = Number.isFinite(Number(candidate.resinPricing.markupPercent))
      ? Number(candidate.resinPricing.markupPercent)
      : merged.resinPricing.markupPercent;
    merged.resinPricing.spacingMm = Number.isFinite(Number(candidate.resinPricing.spacingMm))
      ? Math.max(0, Number(candidate.resinPricing.spacingMm))
      : merged.resinPricing.spacingMm;
    if (Array.isArray(candidate.resinPricing.standard)) {
      merged.resinPricing.standard = candidate.resinPricing.standard;
    }
    if (Array.isArray(candidate.resinPricing.special)) {
      merged.resinPricing.special = candidate.resinPricing.special;
    }
  }

  if (Array.isArray(candidate.catalogSections)) {
    merged.catalogSections = normalizeCatalogSections(candidate.catalogSections);
  }

  merged.combinationServices = normalizeCombinationServices(candidate.combinationServices);

  if (candidate.m2Pricing && typeof candidate.m2Pricing === "object") {
    for (const key of Object.keys(merged.m2Pricing)) {
      if (Array.isArray(candidate.m2Pricing[key])) {
        merged.m2Pricing[key] = candidate.m2Pricing[key];
      }
    }
    for (const key of Object.keys(candidate.m2Pricing)) {
      if (!(key in merged.m2Pricing) && Array.isArray(candidate.m2Pricing[key])) {
        merged.m2Pricing[key] = candidate.m2Pricing[key];
      }
    }
  }

  if (candidate.colorProductPricing && typeof candidate.colorProductPricing === "object") {
    for (const [key, value] of Object.entries(candidate.colorProductPricing)) {
      if (Array.isArray(value)) {
        merged.colorProductPricing[key] = value;
      }
    }
  }

  if (candidate.readyProductPricing && typeof candidate.readyProductPricing === "object") {
    for (const [key, value] of Object.entries(candidate.readyProductPricing)) {
      if (Array.isArray(value)) {
        merged.readyProductPricing[key] = value;
      }
    }
  }

  merged.cardPricing = normalizeCardPricing(candidate.cardPricing, defaults.cardPricing);
  merged.cardFinishes = normalizeCardFinishes(candidate.cardFinishes, defaults.cardFinishes);
  merged.flyerPricing = normalizeFlyerPricing(candidate.flyerPricing, defaults.flyerPricing);
  merged.flyerFinishes = normalizeFlyerFinishes(candidate.flyerFinishes, defaults.flyerFinishes);

  if (Number.isFinite(Number(candidate.spiralPlasticDiscount))) {
    merged.spiralPlasticDiscount = Number(candidate.spiralPlasticDiscount);
  }

  return merged;
}

function mergeState(candidate, configCandidate = null) {
  const defaults = createDefaultState();
  if (!candidate || typeof candidate !== "object") {
    return defaults;
  }

  const state = deepClone(defaults);
  const normalizedCatalogSections = normalizeCatalogSections(configCandidate?.catalogSections);
  const validColorCatalog = new Set(
    normalizedCatalogSections.filter((item) => item?.tab === "impressos").map((item) => item.id)
  );
  const validM2Catalog = new Set(getM2Catalog({ catalogSections: normalizedCatalogSections }).map((product) => product.id));
  const validReadyCatalog = new Set(
    normalizedCatalogSections.filter((item) => item?.tab === "prontos").map((item) => item.id)
  );
  state.calcMode = OPTIONS.calcModes.includes(candidate.calcMode) ? candidate.calcMode : state.calcMode;
  state.m2CalcMode = OPTIONS.m2CalcModes.includes(candidate.m2CalcMode) ? candidate.m2CalcMode : state.m2CalcMode;
  state.presets = { ...state.presets, ...(candidate.presets || {}) };
  state.client = { ...state.client, ...(candidate.client || {}) };
  state.company = { ...state.company, ...(candidate.company || {}) };
  state.clients = Array.isArray(candidate.clients)
    ? candidate.clients
        .filter((client) => client && typeof client === "object")
        .map((client, index) => ({
          id: client.id || `client-${index + 1}`,
          name: typeof client.name === "string" ? client.name : "",
          contact: typeof client.contact === "string" ? client.contact : "",
          cnpj: typeof client.cnpj === "string" ? client.cnpj : "",
          notes: typeof client.notes === "string" ? client.notes : "",
          createdAt: typeof client.createdAt === "string" ? client.createdAt : new Date().toISOString(),
        }))
    : state.clients;
  state.quoteHistory = Array.isArray(candidate.quoteHistory)
    ? candidate.quoteHistory
        .filter((item) => item && typeof item === "object")
        .map((item, index) => ({
          id: item.id || `quote-${index + 1}`,
          title: typeof item.title === "string" ? item.title : "",
          clientName: typeof item.clientName === "string" ? item.clientName : "",
          total: Number.isFinite(Number(item.total)) ? Number(item.total) : 0,
          summary: typeof item.summary === "string" ? item.summary : "",
          status: normalizeQuoteStatus(item.status),
          items: Array.isArray(item.items)
            ? item.items
                .filter((entry) => entry && typeof entry === "object")
                .map((entry, entryIndex) => ({
                  id: entry.id || `quote-item-${index + 1}-${entryIndex + 1}`,
                  label: typeof entry.label === "string" ? entry.label : "",
                  category: typeof entry.category === "string" ? entry.category : "",
                  detail: typeof entry.detail === "string" ? entry.detail : "",
                  extraDetail: typeof entry.extraDetail === "string" ? entry.extraDetail : "",
                  quantity: Number.isFinite(Number(entry.quantity)) ? Number(entry.quantity) : 0,
                  total: Number.isFinite(Number(entry.total)) ? Number(entry.total) : 0,
                }))
            : [],
          createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
          updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
          osId: typeof item.osId === "string" ? item.osId : "",
          clientContact: typeof item.clientContact === "string" ? item.clientContact : "",
          clientCnpj: typeof item.clientCnpj === "string" ? item.clientCnpj : "",
          paymentTerms: typeof item.paymentTerms === "string" ? item.paymentTerms : "",
          quoteNotes: typeof item.quoteNotes === "string" ? item.quoteNotes : "",
          snapshot: item?.snapshot && typeof item.snapshot === "object" ? item.snapshot : null,
        }))
    : state.quoteHistory;
  state.workOrders = Array.isArray(candidate.workOrders)
    ? candidate.workOrders
        .filter((item) => item && typeof item === "object")
        .map((item, index) => ({
          id: item.id || `os-${index + 1}`,
          osNumber: typeof item.osNumber === "string" ? item.osNumber : `OS-${String(index + 1).padStart(4, "0")}`,
          quoteId: typeof item.quoteId === "string" ? item.quoteId : "",
          quoteTitle: typeof item.quoteTitle === "string" ? item.quoteTitle : "",
          clientName: typeof item.clientName === "string" ? item.clientName : "",
          clientContact: typeof item.clientContact === "string" ? item.clientContact : "",
          clientCnpj: typeof item.clientCnpj === "string" ? item.clientCnpj : "",
          total: Number.isFinite(Number(item.total)) ? Number(item.total) : 0,
          status: normalizeWorkOrderStatus(item.status),
          priority: normalizeWorkOrderPriority(item.priority),
          owner: typeof item.owner === "string" ? item.owner : "",
          promisedDate: typeof item.promisedDate === "string" ? item.promisedDate : "",
          deliveryDate: typeof item.deliveryDate === "string" ? item.deliveryDate : "",
          deliveryAddress: typeof item.deliveryAddress === "string" ? item.deliveryAddress : "",
          paymentTerms: typeof item.paymentTerms === "string" ? item.paymentTerms : "",
          paymentMethod: typeof item.paymentMethod === "string" ? item.paymentMethod : "",
          entryPaid: Boolean(item.entryPaid),
          entryAmount: item?.entryAmount === "" || item?.entryAmount === null || typeof item?.entryAmount === "undefined"
            ? ""
            : toMoneyNumber(item.entryAmount),
          totalPaid: Boolean(item.totalPaid),
          productionNotes: typeof item.productionNotes === "string" ? item.productionNotes : "",
          deliveryNotes: typeof item.deliveryNotes === "string" ? item.deliveryNotes : "",
          internalNotes: typeof item.internalNotes === "string" ? item.internalNotes : "",
          createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
          updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
          createdByUserId: typeof item.createdByUserId === "string" ? item.createdByUserId : "",
          createdByUsername: typeof item.createdByUsername === "string" ? item.createdByUsername : "",
          sequenceNumber: Math.max(1, toWholeNumber(item.sequenceNumber || 1)),
          timeline: Array.isArray(item.timeline)
            ? item.timeline
                .filter((entry) => entry && typeof entry === "object")
                .map((entry, entryIndex) => ({
                  id: entry.id || `os-event-${index + 1}-${entryIndex + 1}`,
                  label: typeof entry.label === "string" ? entry.label : "Atualização",
                  note: typeof entry.note === "string" ? entry.note : "",
                  at: typeof entry.at === "string" ? entry.at : new Date().toISOString(),
                }))
            : [],
          items: Array.isArray(item.items)
            ? item.items
                .filter((entry) => entry && typeof entry === "object")
                .map((entry, entryIndex) => ({
                  id: entry.id || `os-item-${index + 1}-${entryIndex + 1}`,
                  label: typeof entry.label === "string" ? entry.label : "",
                  category: typeof entry.category === "string" ? entry.category : "",
                  detail: typeof entry.detail === "string" ? entry.detail : "",
                  extraDetail: typeof entry.extraDetail === "string" ? entry.extraDetail : "",
                  quantity: Number.isFinite(Number(entry.quantity)) ? Number(entry.quantity) : 0,
                  total: Number.isFinite(Number(entry.total)) ? Number(entry.total) : 0,
                }))
            : [],
        }))
    : state.workOrders;
  state.paymentTerms = typeof candidate.paymentTerms === "string" ? candidate.paymentTerms : state.paymentTerms;
  state.quoteNotes = typeof candidate.quoteNotes === "string" ? candidate.quoteNotes : state.quoteNotes;

  if (Array.isArray(candidate.rows) && candidate.rows.length > 0) {
    state.rows = candidate.rows.map((row, index) => ({
      ...createDefaultRow(index),
      ...row,
      quantity: toWholeNumber(row?.quantity),
      pages: toWholeNumber(row?.pages),
      discountType: normalizeDiscountType(row?.discountType),
      discountValue: normalizeDiscountValue(row?.discountValue),
      id: row?.id || `row-${index + 1}`,
    }));
  }

  if (Array.isArray(candidate.colorPrintItems) && candidate.colorPrintItems.length > 0) {
    state.colorPrintItems = candidate.colorPrintItems.map((row, index) => ({
      ...createDefaultColorPrintRow(index),
      ...row,
      productPresetId: validColorCatalog.has(row?.productPresetId) ? row.productPresetId : "",
      widthMm: toDecimalNumber(row?.widthMm),
      heightMm: toDecimalNumber(row?.heightMm),
      quantity: toWholeNumber(row?.quantity),
      cutPriceOverride: row?.cutPriceOverride === "" || row?.cutPriceOverride === null || typeof row?.cutPriceOverride === "undefined"
        ? ""
        : toMoneyNumber(row?.cutPriceOverride),
      serviceIds: Array.isArray(row?.serviceIds) ? row.serviceIds.filter((item) => typeof item === "string") : [],
      serviceOverrides: row?.serviceOverrides && typeof row.serviceOverrides === "object" && !Array.isArray(row.serviceOverrides)
        ? Object.fromEntries(
            Object.entries(row.serviceOverrides)
              .filter(([key]) => typeof key === "string")
              .map(([key, value]) => [key, value === "" || value === null ? "" : toMoneyNumber(value)])
          )
        : {},
      discountType: normalizeDiscountType(row?.discountType),
      discountValue: normalizeDiscountValue(row?.discountValue),
      id: row?.id || `color-row-${index + 1}`,
    }));
  }

  if (Array.isArray(candidate.credentialItems) && candidate.credentialItems.length > 0) {
    state.credentialItems = candidate.credentialItems.map((row, index) => ({
      ...createDefaultCredentialRow(index),
      ...row,
      materialType: OPTIONS.credentialMaterials.includes(row?.materialType) ? row.materialType : "Couche 250g",
      printMode: row?.printMode === "Frente e verso" ? "Frente e verso" : "Só frente",
      lamination: row?.lamination === "Com laminação" ? "Com laminação" : "Sem laminação",
      lanyardType: typeof row?.lanyardType === "string" ? row.lanyardType : "none",
      widthCm: toDecimalNumber(row?.widthCm),
      heightCm: toDecimalNumber(row?.heightCm),
      quantity: toWholeNumber(row?.quantity),
      discountType: normalizeDiscountType(row?.discountType),
      discountValue: normalizeDiscountValue(row?.discountValue),
      id: row?.id || `credential-row-${index + 1}`,
    }));
  }

  if (Array.isArray(candidate.m2Items) && candidate.m2Items.length > 0) {
    state.catalogSections = normalizedCatalogSections;
    state.m2Items = candidate.m2Items.map((row, index) => ({
      ...createDefaultM2Row(index),
      ...row,
      widthMm: toDecimalNumber(row?.widthMm),
      heightMm: toDecimalNumber(row?.heightMm),
      measureUnit: row?.measureUnit === "m" ? "m" : "cm",
      quantity: toWholeNumber(row?.quantity),
      finishIds: Array.isArray(row?.finishIds) ? row.finishIds.filter((item) => typeof item === "string") : [],
      finishOverrides: row?.finishOverrides && typeof row.finishOverrides === "object" && !Array.isArray(row.finishOverrides)
        ? Object.fromEntries(
            Object.entries(row.finishOverrides)
              .filter(([key]) => typeof key === "string")
              .map(([key, value]) => [key, value === "" || value === null ? "" : toWholeNumber(value)])
          )
        : {},
      extraCharge: toMoneyNumber(
        typeof row?.extraCharge !== "undefined" ? row.extraCharge : row?.finishingExtra
      ),
      artCreationFee: toMoneyNumber(row?.artCreationFee),
      productId: validM2Catalog.has(row?.productId) ? row.productId : M2_CATALOG[0].id,
      discountType: normalizeDiscountType(row?.discountType),
      discountValue: normalizeDiscountValue(row?.discountValue),
      id: row?.id || `m2-row-${index + 1}`,
    }));
  }

  if (Array.isArray(candidate.readyItems) && candidate.readyItems.length > 0) {
    state.readyItems = candidate.readyItems.map((row, index) => ({
      ...createDefaultReadyRow(index),
      ...row,
      productId: validReadyCatalog.has(row?.productId) ? row.productId : "",
      variantIndex: toWholeNumber(row?.variantIndex),
      quantity: toWholeNumber(row?.quantity),
      basePriceOverride: row?.basePriceOverride === "" || row?.basePriceOverride === null || typeof row?.basePriceOverride === "undefined"
        ? ""
        : toMoneyNumber(row?.basePriceOverride),
      extraCharge: toMoneyNumber(row?.extraCharge),
      artCreationFee: toMoneyNumber(row?.artCreationFee),
      discountType: normalizeDiscountType(row?.discountType),
      discountValue: normalizeDiscountValue(row?.discountValue),
      id: row?.id || `ready-row-${index + 1}`,
    }));
  }

  if (Array.isArray(candidate.resinItems) && candidate.resinItems.length > 0) {
    const validResinMaterials = new Set(RESIN_MATERIAL_OPTIONS.map((item) => item.id));
    state.resinItems = candidate.resinItems.map((row, index) => ({
      ...createDefaultResinRow(index),
      ...row,
      materialType: validResinMaterials.has(row?.materialType) ? row.materialType : "white",
      widthMm: toDecimalNumber(row?.widthMm),
      heightMm: toDecimalNumber(row?.heightMm),
      quantity: toWholeNumber(row?.quantity),
      discountType: normalizeDiscountType(row?.discountType),
      discountValue: normalizeDiscountValue(row?.discountValue),
      id: row?.id || `resin-row-${index + 1}`,
    }));
  }

  if (Array.isArray(candidate.cardItems) && candidate.cardItems.length > 0) {
    state.cardItems = candidate.cardItems.map((row, index) => ({
      ...createDefaultCardRow(index),
      ...row,
      printType: row?.printType === "offset" ? "offset" : "laser",
      paper: typeof row?.paper === "string" ? row.paper : "Couche 300g",
      side: typeof row?.side === "string" ? row.side : "Só frente",
      quantity: Math.max(1, toWholeNumber(row?.quantity || 1)),
      finishIds: Array.isArray(row?.finishIds) ? row.finishIds.filter((item) => typeof item === "string") : [],
      finishOverrides: row?.finishOverrides && typeof row.finishOverrides === "object" && !Array.isArray(row.finishOverrides)
        ? Object.fromEntries(
            Object.entries(row.finishOverrides)
              .filter(([key]) => typeof key === "string")
              .map(([key, value]) => [key, value === "" || value === null ? "" : toMoneyNumber(value)])
          )
        : {},
      artCreationFee: toMoneyNumber(row?.artCreationFee),
      discountType: normalizeDiscountType(row?.discountType),
      discountValue: normalizeDiscountValue(row?.discountValue),
      touched: Boolean(row?.touched || row?.description?.trim()),
      id: row?.id || `card-row-${index + 1}`,
    }));
  }

  if (Array.isArray(candidate.flyerItems) && candidate.flyerItems.length > 0) {
    state.flyerItems = candidate.flyerItems.map((row, index) => ({
      ...createDefaultFlyerRow(index),
      ...row,
      printType: row?.printType === "offset" ? "offset" : "laser",
      paper: typeof row?.paper === "string" ? row.paper : "Couche 120g",
      size: typeof row?.size === "string" ? row.size : "10x7cm",
      colorMode: typeof row?.colorMode === "string" ? row.colorMode : "4x0 cores",
      quantity: Math.max(1, toWholeNumber(row?.quantity || 1)),
      finishId: typeof row?.finishId === "string" ? row.finishId : "sem-acabamento",
      artCreationFee: toMoneyNumber(row?.artCreationFee),
      discountType: normalizeDiscountType(row?.discountType),
      discountValue: normalizeDiscountValue(row?.discountValue),
      touched: Boolean(row?.touched || row?.description?.trim()),
      id: row?.id || `flyer-row-${index + 1}`,
    }));
  }

  if (candidate.blockItems && typeof candidate.blockItems === "object") {
    for (const tab of Object.keys(BLOCK_TAB_DEFS)) {
      if (!Array.isArray(candidate.blockItems[tab]) || candidate.blockItems[tab].length === 0) {
        continue;
      }
      state.blockItems[tab] = candidate.blockItems[tab].map((row, index) => ({
        ...createDefaultBlockRow(tab, index),
        ...row,
        vias: Math.max(1, toWholeNumber(row?.vias || 1)),
        quantity: Math.max(1, toWholeNumber(row?.quantity || 1)),
        artCreationFee: toMoneyNumber(row?.artCreationFee || row?.art),
        discountType: normalizeDiscountType(row?.discountType),
        discountValue: normalizeDiscountValue(row?.discountValue),
        touched: Boolean(row?.touched || row?.description?.trim()),
        id: row?.id || `block-${tab}-row-${index + 1}`,
      }));
    }
  }

  return state;
}

function normalizeSharedCollections(candidate) {
  const normalized = mergeState({
    clients: candidate?.clients,
    quoteHistory: candidate?.quoteHistory,
    workOrders: candidate?.workOrders,
  });

  return {
    clients: normalized.clients,
    quoteHistory: normalized.quoteHistory,
    workOrders: normalized.workOrders,
  };
}

function normalizeAccessControlCandidate(candidate) {
  const defaults = createDefaultAccessControl();
  const groups = Array.isArray(candidate?.groups) && candidate.groups.length
    ? candidate.groups.map((group, index) => ({
        id: group?.id || `group-${index + 1}`,
        name: group?.name || "Novo grupo",
        tabs: { ...createTabPermissionMap(false, false), conta: true, ...(group?.tabs || {}) },
        dashboards: { ...createDashboardPermissionMap(false), ...(group?.dashboards || {}) },
        protected: Boolean(group?.protected),
      }))
    : defaults.groups;
  const hasDeveloperGroup = groups.some((group) => group.id === "developer");
  if (!hasDeveloperGroup) {
    groups.unshift(defaults.groups[0]);
  }
  return {
    groups,
    userOverrides: candidate?.userOverrides && typeof candidate.userOverrides === "object" ? candidate.userOverrides : {},
    dashboardOverrides: candidate?.dashboardOverrides && typeof candidate.dashboardOverrides === "object" ? candidate.dashboardOverrides : {},
  };
}

function normalizeSharedSecurity(candidate) {
  const users = Array.isArray(candidate?.authUsers)
    ? candidate.authUsers.map(normalizeUserRecord).filter((user) => user.username)
    : [];
  const developerIndex = users.findIndex((user) => user.id === DEVELOPER_ACCOUNT.id || user.username.toLowerCase() === DEVELOPER_ACCOUNT.username.toLowerCase());
  const developerUser = normalizeUserRecord({
    ...DEVELOPER_ACCOUNT,
    createdAt: users[developerIndex]?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  if (developerIndex >= 0) {
    users[developerIndex] = developerUser;
  } else {
    users.unshift(developerUser);
  }
  return {
    authUsers: users,
    accessControl: normalizeAccessControlCandidate(candidate?.accessControl || {}),
  };
}

function loadFromStorage(key, merger) {
  if (typeof localStorage === "undefined") {
    return merger(null);
  }

  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return merger(null);
    }
    return merger(JSON.parse(raw));
  } catch {
    return merger(null);
  }
}

function saveToStorage(key, value) {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(key, JSON.stringify(value));
}

function createTabPermissionMap(enabled = true, developerEnabled = false) {
  return Object.fromEntries(
    APP_TAB_LABELS.map((tab) => [tab.id, tab.developerOnly ? developerEnabled : enabled])
  );
}

function createDashboardPermissionMap(enabled = true) {
  return Object.fromEntries(
    DASHBOARD_CARD_DEFS.map((item) => [item.id, enabled])
  );
}

function createDefaultAccessControl() {
  return {
    groups: [
      {
        id: "developer",
        name: "Desenvolvedor",
        tabs: createTabPermissionMap(true, true),
        dashboards: createDashboardPermissionMap(true),
        protected: true,
      },
      {
        id: "profissional",
        name: "Assinatura profissional",
        tabs: createTabPermissionMap(true, false),
        dashboards: createDashboardPermissionMap(true),
      },
      {
        id: "basico",
        name: "Assinatura básica",
        tabs: {
          ...createTabPermissionMap(false, false),
          conta: true,
          calculo: true,
          impressos: true,
          m2: true,
          prontos: true,
          orcamento: true,
        },
        dashboards: {
          ...createDashboardPermissionMap(false),
          statusChart: true,
          quickLinks: true,
        },
      },
    ],
    userOverrides: {},
    dashboardOverrides: {},
  };
}

function normalizeUserRecord(user, index = 0) {
  const normalizeEmailVerification = (candidate, emailValue) => {
    const status = ["pending", "verified"].includes(candidate?.status)
      ? candidate.status
      : (emailValue ? "pending" : "pending");
    return {
      status,
      code: typeof candidate?.code === "string" ? candidate.code.trim() : "",
      sentAt: typeof candidate?.sentAt === "string" ? candidate.sentAt : "",
      verifiedAt: typeof candidate?.verifiedAt === "string" ? candidate.verifiedAt : "",
      expiresAt: typeof candidate?.expiresAt === "string" ? candidate.expiresAt : "",
      resendAvailableAt: typeof candidate?.resendAvailableAt === "string" ? candidate.resendAvailableAt : "",
      lastDeliveryMode: typeof candidate?.lastDeliveryMode === "string" ? candidate.lastDeliveryMode : "manual",
    };
  };
  const normalizeDocumentVerification = (candidate, documentValue, birthDateValue) => {
    const digits = onlyDigits(documentValue);
    const defaultStatus = digits.length === 11
      ? (birthDateValue ? "official-ready" : "official-pending-data")
      : digits.length === 14
        ? "local-valid"
        : "not-checked";
    return {
      status: [
        "not-checked",
        "local-valid",
        "official-pending-data",
        "official-ready",
        "official-verified",
        "official-rejected",
      ].includes(candidate?.status) ? candidate.status : defaultStatus,
      source: ["local", "official-api", "manual"].includes(candidate?.source) ? candidate.source : "local",
      checkedAt: typeof candidate?.checkedAt === "string" ? candidate.checkedAt : "",
      verifiedAt: typeof candidate?.verifiedAt === "string" ? candidate.verifiedAt : "",
      message: typeof candidate?.message === "string" ? candidate.message.trim() : "",
    };
  };
  const email = typeof user?.email === "string" ? user.email.trim() : "";
  const document = typeof user?.document === "string" ? user.document.trim() : "";
  const birthDate = typeof user?.birthDate === "string" ? user.birthDate : "";
  return {
    id: user?.id || `user-${Date.now()}-${index}`,
    username: typeof user?.username === "string" ? user.username.trim() : "",
    password: typeof user?.password === "string" ? user.password : "",
    email,
    document,
    birthDate,
    company: typeof user?.company === "string" ? user.company.trim() : "",
    role: user?.role === "developer" ? "developer" : "user",
    status: ["active", "pending", "blocked"].includes(user?.status) ? user.status : "pending",
    mustChangePassword: Boolean(user?.mustChangePassword),
    passwordMode: user?.passwordMode === "temporary" ? "temporary" : "permanent",
    temporaryPasswordIssuedAt: typeof user?.temporaryPasswordIssuedAt === "string" ? user.temporaryPasswordIssuedAt : "",
    groupId: typeof user?.groupId === "string" ? user.groupId : "profissional",
    emailVerification: normalizeEmailVerification(user?.emailVerification, email),
    documentVerification: normalizeDocumentVerification(user?.documentVerification, document, birthDate),
    createdAt: typeof user?.createdAt === "string" ? user.createdAt : new Date().toISOString(),
    updatedAt: typeof user?.updatedAt === "string" ? user.updatedAt : new Date().toISOString(),
  };
}

function loadAuthUsers() {
  const saved = loadFromStorage(STORAGE_KEYS.authUsers, (candidate) => Array.isArray(candidate) ? candidate : []);
  const users = saved.map(normalizeUserRecord).filter((user) => user.username);
  const developerIndex = users.findIndex((user) => user.id === DEVELOPER_ACCOUNT.id || user.username.toLowerCase() === DEVELOPER_ACCOUNT.username.toLowerCase());
  const developerUser = normalizeUserRecord({
    ...DEVELOPER_ACCOUNT,
    createdAt: users[developerIndex]?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  if (developerIndex >= 0) {
    users[developerIndex] = developerUser;
  } else {
    users.unshift(developerUser);
  }

  saveToStorage(STORAGE_KEYS.authUsers, users);
  return users;
}

function saveAuthUsers(users) {
  saveToStorage(STORAGE_KEYS.authUsers, users.map(normalizeUserRecord));
}

function getRecordTime(record, key = "updatedAt") {
  const timestamp = new Date(record?.[key] || record?.createdAt || 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function mergeAuthUserCollections(localUsers, sharedUsers) {
  const merged = new Map();
  const makeKey = (user) => user?.id || normalizeLookupEmail(user?.email) || String(user?.username || "").trim().toLowerCase();
  [...(Array.isArray(sharedUsers) ? sharedUsers : []), ...(Array.isArray(localUsers) ? localUsers : [])]
    .map(normalizeUserRecord)
    .filter((user) => user.username)
    .forEach((user) => {
      const key = makeKey(user);
      const current = merged.get(key);
      if (!current || getRecordTime(user) >= getRecordTime(current)) {
        merged.set(key, user);
      }
    });
  return Array.from(merged.values());
}

function loadAccessControl() {
  const saved = loadFromStorage(STORAGE_KEYS.accessControl, (candidate) => candidate && typeof candidate === "object" ? candidate : {});
  return normalizeAccessControlCandidate(saved);
}

function saveAccessControl(accessControl) {
  saveToStorage(STORAGE_KEYS.accessControl, accessControl);
}

function loadAuthSession(users) {
  const session = loadFromStorage(STORAGE_KEYS.authSession, (candidate) => candidate && typeof candidate === "object" ? candidate : null);
  if (!session?.userId) {
    return null;
  }
  return users.find((user) => user.id === session.userId && user.status === "active") || null;
}

function saveAuthSession(user) {
  if (!user) {
    localStorage.removeItem(STORAGE_KEYS.authSession);
    return;
  }
  saveToStorage(STORAGE_KEYS.authSession, { userId: user.id, loggedAt: new Date().toISOString() });
}

function loadPendingVerificationEmail() {
  return loadFromStorage(
    STORAGE_KEYS.authPendingVerification,
    (candidate) => typeof candidate === "string" ? candidate.trim() : ""
  );
}

function savePendingVerificationEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) {
    localStorage.removeItem(STORAGE_KEYS.authPendingVerification);
    return;
  }
  saveToStorage(STORAGE_KEYS.authPendingVerification, normalized);
}

function normalizeLookupEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function findAuthUserByEmail(users, email) {
  const normalizedEmail = normalizeLookupEmail(email);
  if (!normalizedEmail) {
    return null;
  }
  return (Array.isArray(users) ? users : []).find((user) => normalizeLookupEmail(user.email) === normalizedEmail) || null;
}

function isValidEmailFormat(email) {
  const value = String(email || "").trim();
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getGroupForUser(accessControl, user) {
  return accessControl.groups.find((group) => group.id === user?.groupId)
    || accessControl.groups.find((group) => group.id === "profissional")
    || accessControl.groups[0];
}

function getUserTabPermissions(accessControl, user) {
  if (!user) {
    return createTabPermissionMap(false, false);
  }
  if (user.role === "developer") {
    return createTabPermissionMap(true, true);
  }
  const group = getGroupForUser(accessControl, user);
  const overrides = accessControl.userOverrides?.[user.id] || {};
  return { ...createTabPermissionMap(false, false), ...(group?.tabs || {}), ...overrides };
}

function getUserDashboardPermissions(accessControl, user) {
  if (!user) {
    return createDashboardPermissionMap(false);
  }
  if (user.role === "developer") {
    return createDashboardPermissionMap(true);
  }
  const group = getGroupForUser(accessControl, user);
  const overrides = accessControl.dashboardOverrides?.[user.id] || {};
  return { ...createDashboardPermissionMap(false), ...(group?.dashboards || {}), ...overrides };
}

function buildPasswordResetMailto(user, newPassword) {
  const subject = encodeURIComponent("GrafiCalc | Sua senha temporária foi gerada");
  const body = encodeURIComponent(
    [
      `Olá, ${user.username || "usuário"}.`,
      "",
      "Uma senha temporária de acesso ao GrafiCalc foi gerada para você.",
      `Senha temporária: ${newPassword}`,
      "",
      "No próximo login, o sistema vai pedir que você crie sua senha definitiva.",
      "",
      "Se você não solicitou essa alteração, fale com o administrador responsável.",
    ].join("\n")
  );
  return `mailto:${encodeURIComponent(user.email)}?subject=${subject}&body=${body}`;
}

function validateSecurePassword(password) {
  const value = String(password || "");
  if (value.length < 8) {
    return "A senha precisa ter pelo menos 8 caracteres.";
  }
  if (!/[A-Za-z]/.test(value)) {
    return "A senha precisa ter pelo menos uma letra.";
  }
  if (!/\d/.test(value)) {
    return "A senha precisa ter pelo menos um número.";
  }
  return "";
}

function onlyDigits(value) {
  return String(value || "").replace(/\D+/g, "");
}

function hasRepeatedDigits(value) {
  return /^(\d)\1+$/.test(String(value || ""));
}

function validateEmailAddress(email) {
  const value = String(email || "").trim().toLowerCase();
  if (!value) {
    return "Informe um e-mail para continuar.";
  }
  if (value.length > 254) {
    return "O e-mail informado ficou grande demais.";
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailPattern.test(value)) {
    return "Digite um e-mail valido para solicitar o cadastro.";
  }
  return "";
}

function validateCpf(value) {
  const digits = onlyDigits(value);
  if (digits.length !== 11 || hasRepeatedDigits(digits)) {
    return false;
  }
  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    sum += Number(digits[index]) * (10 - index);
  }
  let check = (sum * 10) % 11;
  if (check === 10) {
    check = 0;
  }
  if (check !== Number(digits[9])) {
    return false;
  }
  sum = 0;
  for (let index = 0; index < 10; index += 1) {
    sum += Number(digits[index]) * (11 - index);
  }
  check = (sum * 10) % 11;
  if (check === 10) {
    check = 0;
  }
  return check === Number(digits[10]);
}

function validateCnpj(value) {
  const digits = onlyDigits(value);
  if (digits.length !== 14 || hasRepeatedDigits(digits)) {
    return false;
  }
  const calculateDigit = (baseDigits, weights) => {
    const sum = baseDigits.reduce((total, digit, index) => total + Number(digit) * weights[index], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  const firstBase = digits.slice(0, 12).split("");
  const firstDigit = calculateDigit(firstBase, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (firstDigit !== Number(digits[12])) {
    return false;
  }
  const secondBase = digits.slice(0, 13).split("");
  const secondDigit = calculateDigit(secondBase, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return secondDigit === Number(digits[13]);
}

function validateBrazilianDocument(document) {
  const digits = onlyDigits(document);
  if (!digits) {
    return "Informe um CPF ou CNPJ para continuar.";
  }
  if (digits.length === 11) {
    return validateCpf(digits) ? "" : "O CPF informado parece invalido. Revise os numeros digitados.";
  }
  if (digits.length === 14) {
    return validateCnpj(digits) ? "" : "O CNPJ informado parece invalido. Revise os numeros digitados.";
  }
  return "Digite um CPF com 11 numeros ou um CNPJ com 14 numeros.";
}

function generateVerificationCode(length = 6) {
  const digits = "0123456789";
  let code = "";
  while (code.length < length) {
    code += digits[Math.floor(Math.random() * digits.length)];
  }
  return code;
}

function addMillisecondsToIso(dateLike, milliseconds) {
  const baseTime = dateLike ? new Date(dateLike).getTime() : Date.now();
  return new Date(baseTime + milliseconds).toISOString();
}

function getRemainingCooldownMs(user) {
  const availableAt = user?.emailVerification?.resendAvailableAt;
  if (!availableAt) {
    return 0;
  }
  return Math.max(0, new Date(availableAt).getTime() - Date.now());
}

function isEmailVerificationExpired(user) {
  const expiresAt = user?.emailVerification?.expiresAt;
  if (!expiresAt) {
    return false;
  }
  return new Date(expiresAt).getTime() <= Date.now();
}

function normalizeBirthDate(value) {
  const raw = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : "";
}

function getDocumentType(document) {
  const digits = onlyDigits(document);
  if (digits.length === 11) {
    return "cpf";
  }
  if (digits.length === 14) {
    return "cnpj";
  }
  return "";
}

function getDocumentVerificationSnapshot(document, birthDate = "") {
  const documentType = getDocumentType(document);
  const normalizedBirthDate = normalizeBirthDate(birthDate);
  const now = new Date().toISOString();
  if (documentType === "cpf") {
    return {
      status: normalizedBirthDate ? "official-ready" : "official-pending-data",
      source: "local",
      checkedAt: now,
      verifiedAt: "",
      message: normalizedBirthDate
        ? "CPF validado localmente e pronto para consulta oficial via API."
        : "CPF validado localmente. Falta data de nascimento para consulta oficial via API.",
    };
  }
  if (documentType === "cnpj") {
    return {
      status: "local-valid",
      source: "local",
      checkedAt: now,
      verifiedAt: "",
      message: "CNPJ validado localmente.",
    };
  }
  return {
    status: "not-checked",
    source: "local",
    checkedAt: now,
    verifiedAt: "",
    message: "",
  };
}

function getEmailVerificationMeta(user) {
  if (user?.emailVerification?.status === "verified") {
    return { label: "E-mail verificado", tone: "approved" };
  }
  return { label: "E-mail pendente", tone: "pending" };
}

function getDocumentVerificationMeta(user) {
  const status = user?.documentVerification?.status || "not-checked";
  if (status === "official-verified") {
    return { label: "CPF oficial validado", tone: "approved" };
  }
  if (status === "official-rejected") {
    return { label: "CPF oficial rejeitado", tone: "cancelled" };
  }
  if (status === "official-ready") {
    return { label: "CPF pronto para API", tone: "completed" };
  }
  if (status === "official-pending-data") {
    return { label: "CPF aguardando data de nascimento", tone: "warning" };
  }
  if (status === "local-valid") {
    return { label: "Documento validado localmente", tone: "completed" };
  }
  return { label: "Documento sem validação", tone: "pending" };
}

async function requestVerificationCodeDelivery(user) {
  const payload = {
    email: String(user?.email || "").trim(),
    username: String(user?.username || "").trim(),
    code: String(user?.emailVerification?.code || "").trim(),
    company: String(user?.company || "").trim(),
    expiresAt: user?.emailVerification?.expiresAt || "",
  };

  if (!payload.email || !payload.code) {
    return { ok: false, mode: "manual", message: "Cadastro sem e-mail ou código disponível." };
  }

  try {
    const response = await fetch(AUTH_EMAIL_API_PATH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok || !result?.ok) {
      throw new Error(result?.error || "delivery-failed");
    }
    return {
      ok: true,
      mode: result.deliveryMode || "local-outbox",
      message: typeof result.message === "string" ? result.message : "",
    };
  } catch {
    return {
      ok: false,
      mode: "manual",
      message: "O envio automático não respondeu nesta máquina.",
    };
  }
}

function buildOfficialCpfVerificationPayload(user) {
  const digits = onlyDigits(user?.document || "");
  if (digits.length !== 11) {
    return null;
  }
  return {
    cpf: digits,
    birthDate: normalizeBirthDate(user?.birthDate || ""),
    username: user?.username || "",
    email: user?.email || "",
  };
}

function generateTemporaryPassword(length = 10) {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const all = `${letters}${digits}`;
  let password = "";
  password += letters[Math.floor(Math.random() * letters.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  while (password.length < length) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

function loadSessionFlag(key) {
  if (typeof sessionStorage === "undefined") {
    return false;
  }

  try {
    return sessionStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

function saveSessionFlag(key, value) {
  if (typeof sessionStorage === "undefined") {
    return;
  }

  if (value) {
    sessionStorage.setItem(key, "true");
    return;
  }

  sessionStorage.removeItem(key);
}

async function requestSharedState(method = "GET", payload) {
  if (typeof fetch !== "function") {
    throw new Error("fetch-unavailable");
  }

  const response = await fetch(SHARED_API_PATH, {
    method,
    headers: payload ? { "Content-Type": "application/json" } : undefined,
    body: payload ? JSON.stringify(payload) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`shared-http-${response.status}`);
  }

  return response.json();
}

async function requestAuthUserSave(user, accessControl) {
  if (typeof fetch !== "function") {
    throw new Error("fetch-unavailable");
  }

  const response = await fetch(AUTH_USERS_API_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user,
      accessControl,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`auth-user-http-${response.status}`);
  }

  return response.json();
}

async function requestDeveloperLogin(username, password) {
  if (typeof fetch !== "function") {
    throw new Error("fetch-unavailable");
  }

  const response = await fetch(AUTH_DEVELOPER_LOGIN_API_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      password,
    }),
    cache: "no-store",
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result?.ok) {
    throw new Error(result?.error || `developer-login-http-${response.status}`);
  }

  return result;
}

async function requestServerAuthSession() {
  if (typeof fetch !== "function") {
    throw new Error("fetch-unavailable");
  }

  const response = await fetch(AUTH_SESSION_API_PATH, {
    method: "GET",
    cache: "no-store",
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result?.ok) {
    throw new Error(result?.error || `auth-session-http-${response.status}`);
  }

  return result;
}

async function requestAuthLogout() {
  if (typeof fetch !== "function") {
    throw new Error("fetch-unavailable");
  }

  const response = await fetch(AUTH_LOGOUT_API_PATH, {
    method: "POST",
    cache: "no-store",
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result?.ok) {
    throw new Error(result?.error || `auth-logout-http-${response.status}`);
  }

  return result;
}

async function requestConfigUnlock(password) {
  if (typeof fetch !== "function") {
    throw new Error("fetch-unavailable");
  }

  const response = await fetch(CONFIG_UNLOCK_API_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
    cache: "no-store",
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result?.ok) {
    throw new Error(result?.error || `config-unlock-http-${response.status}`);
  }

  return result;
}

function loadConfigViewMode() {
  if (typeof localStorage === "undefined") {
    return "basic";
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.configView);
    return raw === "advanced" ? "advanced" : "basic";
  } catch {
    return "basic";
  }
}

function saveConfigViewMode(mode) {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEYS.configView, mode === "advanced" ? "advanced" : "basic");
}

function loadConfigSection() {
  if (typeof localStorage === "undefined") {
    return "calculo";
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.configSection);
    return CONFIG_SECTIONS.includes(raw) ? raw : "calculo";
  } catch {
    return "calculo";
  }
}

function saveConfigSection(section) {
  if (typeof localStorage === "undefined") {
    return;
  }
  const safeSection = CONFIG_SECTIONS.includes(section) ? section : "calculo";
  localStorage.setItem(STORAGE_KEYS.configSection, safeSection);
}

function toWholeNumber(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function toMoneyNumber(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function toDecimalNumber(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function normalizeDiscountType(value) {
  return value === "%" ? "%" : "R$";
}

function normalizeDiscountValue(value) {
  return Math.max(0, toMoneyNumber(value));
}

function calculateDiscount(totalBeforeDiscount, row) {
  const base = Math.max(0, Number(totalBeforeDiscount || 0));
  const rawValue = normalizeDiscountValue(row?.discountValue);
  const type = normalizeDiscountType(row?.discountType);
  const amount = type === "%"
    ? base * Math.min(rawValue, 100) / 100
    : rawValue;
  const discountAmount = Math.min(base, Math.max(0, amount));
  return {
    discountType: type,
    discountValue: rawValue,
    discountAmount,
    totalAfterDiscount: Math.max(0, base - discountAmount),
  };
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));
}

function formatInteger(value) {
  return new Intl.NumberFormat("pt-BR").format(Number(value || 0));
}

function formatDecimal(value, fractionDigits = 2) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(Number(value || 0));
}

function getDiscountQuoteDetail(row) {
  if (!row || Number(row.discountAmount || 0) <= 0) {
    return "";
  }
  const value = normalizeDiscountType(row.discountType) === "%"
    ? `${formatMeasure(row.discountValue)}%`
    : formatCurrency(row.discountValue);
  return `Desconto: ${value} (-${formatCurrency(row.discountAmount)})`;
}

function createDiscountTypeSelect(row) {
  return `<select class="cell-select compact-select" name="discountType">${buildOptions(OPTIONS.discountTypes, normalizeDiscountType(row.discountType))}</select>`;
}

function createDiscountValueInput(row) {
  return `<input class="cell-input compact-money" name="discountValue" type="number" min="0" step="0.01" value="${escapeHtml(normalizeDiscountValue(row.discountValue))}" placeholder="0,00">`;
}

function formatDateTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function normalizeQuoteStatus(value) {
  return Object.prototype.hasOwnProperty.call(QUOTE_STATUS_META, value) ? value : "pending";
}

function getQuoteStatusMeta(value) {
  return QUOTE_STATUS_META[normalizeQuoteStatus(value)] || QUOTE_STATUS_META.pending;
}

function normalizeWorkOrderStatus(value) {
  return Object.prototype.hasOwnProperty.call(WORK_ORDER_STATUS_META, value) ? value : "created";
}

function getWorkOrderStatusMeta(value) {
  return WORK_ORDER_STATUS_META[normalizeWorkOrderStatus(value)] || WORK_ORDER_STATUS_META.created;
}

function normalizeWorkOrderPriority(value) {
  return Object.prototype.hasOwnProperty.call(WORK_ORDER_PRIORITY_META, value) ? value : "normal";
}

function getWorkOrderPriorityMeta(value) {
  return WORK_ORDER_PRIORITY_META[normalizeWorkOrderPriority(value)] || WORK_ORDER_PRIORITY_META.normal;
}

function formatMeasure(value) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatAreaM2(value) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(Number(value || 0));
}

function lookupTier(tiers, quantity, valueKey = "value") {
  const qty = Number(quantity || 0);
  if (!Array.isArray(tiers) || qty <= 0) {
    return 0;
  }

  let selected = tiers[0];
  for (const tier of tiers) {
    if (qty >= Number(tier.min || 0)) {
      selected = tier;
    }
  }

  return Number(selected?.[valueKey] || 0);
}

function getPrintAggregationKey(printType, printMode) {
  if (printType === "Preto e branco") {
    return `${printType}::${printMode === "Frente e verso" ? "Frente e verso" : "Só frente"}`;
  }

  return printType;
}

function getApplicableBlackWhiteTiers(config, printMode) {
  const tiers = Array.isArray(config?.printPricing?.blackWhite) ? config.printPricing.blackWhite : [];
  if (printMode === "Frente e verso") {
    return tiers;
  }

  return tiers.filter((tier) => Number(tier?.min || 0) < 1000);
}

function getBlackWhiteTotal(rowImpressions, effectiveQuantity, config, printMode) {
  if (rowImpressions <= 0 || effectiveQuantity <= 0) {
    return 0;
  }

  const tiers = getApplicableBlackWhiteTiers(config, printMode);
  const fixedOne = Number(tiers[0]?.value || 0);
  const fixedTwo = Number(tiers[1]?.value || 0);

  if (effectiveQuantity === 1) {
    return fixedOne * (rowImpressions / effectiveQuantity);
  }

  if (effectiveQuantity === 2) {
    return fixedTwo * (rowImpressions / effectiveQuantity);
  }

  return rowImpressions * lookupTier(tiers.slice(2), effectiveQuantity);
}

function getRegularPrintTotal(rowImpressions, effectiveQuantity, tiers) {
  if (rowImpressions <= 0 || effectiveQuantity <= 0) {
    return 0;
  }

  return rowImpressions * lookupTier(tiers, effectiveQuantity);
}

function getPrintTotalByType(printType, rowImpressions, effectiveQuantity, config, printMode) {
  if (printType === "Preto e branco") {
    return getBlackWhiteTotal(rowImpressions, effectiveQuantity, config, printMode);
  }

  if (printType === "Colorido jato de tinta") {
    return getRegularPrintTotal(rowImpressions, effectiveQuantity, config.printPricing.inkjet);
  }

  return getRegularPrintTotal(rowImpressions, effectiveQuantity, config.printPricing.laser);
}

function getCoverImpressions(row, kind) {
  const isCover = kind === "cover";
  const type = isCover ? row.coverType : row.backCoverType;
  const copies = Math.max(0, row.quantity);
  if ((isCover && type === "Sem capa") || (!isCover && type === "Sem contracapa") || copies <= 0) {
    return 0;
  }

  const sides = type === "Colorida frente e verso" ? 2 : 1;
  const baseCopies = row.size === "A5" && row.finishing !== "Livreto" ? Math.ceil(copies / 2) : copies;
  return baseCopies * sides;
}

function getBindingSheetsPerCopy(row) {
  const pages = Math.max(0, row.pages);
  if (pages <= 0) {
    return 0;
  }
  return row.printMode === "Frente e verso" ? Math.ceil(pages / 2) : pages;
}

function getInnerImpressions(row) {
  const copies = Math.max(0, row.quantity);
  const pages = Math.max(0, row.pages);
  if (copies <= 0 || pages <= 0) {
    return 0;
  }
  const pagesPerA4 = row.size === "A5" ? Math.ceil(pages / 2) : pages;
  return copies * pagesPerA4;
}

function getBindingMatrixUnitPrice(row, bindingSheetsPerCopy, pricingRows, config) {
  if (bindingSheetsPerCopy <= 0 || bindingSheetsPerCopy > 500) {
    return 0;
  }

  const band = (pricingRows || []).find((item) => bindingSheetsPerCopy <= Number(item.maxSheets || 0));
  if (!band) {
    return 0;
  }

  const qty = Math.max(0, row.quantity);
  const rateKey = qty >= 101 ? "101" : qty >= 51 ? "51" : qty >= 21 ? "21" : "1";
  const unit = Number(band.rates?.[rateKey] || 0);
  const discount = ["Sem capas plásticas", "Sem capas plasticas"].includes(row.spiralOption) ? Number(config.spiralPlasticDiscount || 0) : 0;
  return Math.max(0, unit - discount);
}

function getSpiralUnitPrice(row, bindingSheetsPerCopy, config) {
  return getBindingMatrixUnitPrice(row, bindingSheetsPerCopy, config.spiralPricing, config);
}

function getWireOUnitPrice(row, bindingSheetsPerCopy, config) {
  return getBindingMatrixUnitPrice(row, bindingSheetsPerCopy, config.wireOPricing, config);
}

function getBookletUnitPrice(quantity, config) {
  return lookupTier(config.bookletPricing, quantity);
}

function getHardCoverUnitPrice(quantity, config) {
  return lookupTier(config.hardCoverPricing, quantity);
}

function getLaminatedSoftCoverUnitPrice(quantity, config) {
  return lookupTier(config.laminatedSoftCoverPricing, quantity);
}

function getColorPaperPricingKey(paperType) {
  if (paperType === "Sulfite 75g" || paperType === "Offset 120g") {
    return paperType;
  }
  if (["Couche 170g", "Offset 170g", "Reciclato 170g"].includes(paperType)) {
    return "170g";
  }
  if (["Couche 250g", "Offset 240g", "Reciclato 240g"].includes(paperType)) {
    return "250g";
  }
  return "300g";
}

function getBestFitOnA4(widthMm, heightMm) {
  const normalCols = Math.floor(A4_WIDTH_MM / widthMm);
  const normalRows = Math.floor(A4_HEIGHT_MM / heightMm);
  const normalTotal = normalCols * normalRows;

  const rotatedCols = Math.floor(A4_WIDTH_MM / heightMm);
  const rotatedRows = Math.floor(A4_HEIGHT_MM / widthMm);
  const rotatedTotal = rotatedCols * rotatedRows;

  if (rotatedTotal > normalTotal) {
    return { itemsPerSheet: rotatedTotal, cols: rotatedCols, rows: rotatedRows, rotated: true };
  }

  return { itemsPerSheet: normalTotal, cols: normalCols, rows: normalRows, rotated: false };
}

function getBestFitOnSheet(widthMm, heightMm, sheetWidthMm, sheetHeightMm) {
  if (widthMm <= 0 || heightMm <= 0 || sheetWidthMm <= 0 || sheetHeightMm <= 0) {
    return { itemsPerSheet: 0, cols: 0, rows: 0, rotated: false };
  }

  const normalCols = Math.floor(sheetWidthMm / widthMm);
  const normalRows = Math.floor(sheetHeightMm / heightMm);
  const normalTotal = normalCols * normalRows;
  const rotatedCols = Math.floor(sheetWidthMm / heightMm);
  const rotatedRows = Math.floor(sheetHeightMm / widthMm);
  const rotatedTotal = rotatedCols * rotatedRows;

  if (rotatedTotal > normalTotal) {
    return { itemsPerSheet: rotatedTotal, cols: rotatedCols, rows: rotatedRows, rotated: true };
  }

  return { itemsPerSheet: normalTotal, cols: normalCols, rows: normalRows, rotated: false };
}

function estimateCuts(cols, rows) {
  return Math.max(0, cols - 1) + Math.max(0, rows - 1);
}

function lookupSmallJobCutValue(cutPricing, itemsPerSheet) {
  const tiers = cutPricing.upToFiveSheets || [];
  let selected = tiers[0];
  for (const tier of tiers) {
    if (itemsPerSheet >= Number(tier.minUp || 0)) {
      selected = tier;
    }
  }
  return Number(selected?.value || 0);
}

function normalizeBindingGroup(value) {
  return String(value ?? "").trim();
}

function isRowActive(row) {
  return Boolean(row.description?.trim() || Number(row.quantity) > 0 || Number(row.pages) > 0);
}

function isColorPrintRowActive(row) {
  return Boolean(
    row.description?.trim() ||
    Number(row.quantity) > 0 ||
    Number(row.widthMm) > 0 ||
    Number(row.heightMm) > 0 ||
    (Array.isArray(row.serviceIds) && row.serviceIds.length > 0) ||
    Number(row.cutPriceOverride) > 0
  );
}

function isReadyRowActive(row) {
  return Boolean(row.description?.trim() || row.productId || Number(row.quantity) > 0 || Number(row.basePriceOverride) > 0 || Number(row.extraCharge) > 0 || Number(row.artCreationFee) > 0);
}

function isResinRowActive(row) {
  return Boolean(row.description?.trim() || Number(row.quantity) > 0 || Number(row.widthMm) > 0 || Number(row.heightMm) > 0);
}

function calculateWorkbook(state, config) {
  const rows = state.rows.map((row) => ({
    ...row,
    quantity: toWholeNumber(row.quantity),
    pages: toWholeNumber(row.pages),
  }));

  const rowBase = rows.map((row) => {
    const innerImpressions = getInnerImpressions(row);
    const bindingSheetsPerCopy = getBindingSheetsPerCopy(row);
    const coverImpressions = getCoverImpressions(row, "cover");
    const backImpressions = getCoverImpressions(row, "back");
    return { row, innerImpressions, bindingSheetsPerCopy, coverImpressions, backImpressions };
  });

  const aggregateInnerByKey = {};
  const aggregateCoverByPaper = {};

  for (const item of rowBase) {
    const innerKey = getPrintAggregationKey(item.row.printType, item.row.printMode);
    aggregateInnerByKey[innerKey] = (aggregateInnerByKey[innerKey] || 0) + item.innerImpressions;

    if (item.coverImpressions > 0) {
      aggregateCoverByPaper[item.row.coverPaper] = (aggregateCoverByPaper[item.row.coverPaper] || 0) + item.coverImpressions;
    }

    if (item.backImpressions > 0) {
      aggregateCoverByPaper[item.row.backCoverPaper] = (aggregateCoverByPaper[item.row.backCoverPaper] || 0) + item.backImpressions;
    }
  }

  const warnings = [];
  const groupMetaByIndex = {};
  const groupedRowsMap = {};

  rowBase.forEach((item, index) => {
    const groupName = normalizeBindingGroup(item.row.bindingGroup);
    if (!groupName || !isRowActive(item.row)) {
      return;
    }

    if (!groupedRowsMap[groupName]) {
      groupedRowsMap[groupName] = [];
    }

    groupedRowsMap[groupName].push({ ...item, index, groupName });
  });

  for (const [groupName, entries] of Object.entries(groupedRowsMap)) {
    const leader = entries[0];
    const finishingType = leader.row.finishing;
    const spiralOption = leader.row.spiralOption;
    const activeQuantities = entries.map((entry) => Math.max(0, entry.row.quantity)).filter((quantity) => quantity > 0);
    const quantitySet = [...new Set(activeQuantities)];
    const groupQuantity = activeQuantities.length > 0 ? Math.min(...activeQuantities) : 0;
    const sheetsPerCopy = entries.reduce((sum, entry) => sum + entry.bindingSheetsPerCopy, 0);
    const mixedFinishing = entries.some((entry) => entry.row.finishing !== finishingType);
    const mixedSpiral = entries.some((entry) => entry.row.spiralOption !== spiralOption);

    if (mixedFinishing) {
      warnings.push(`Grupo ${groupName}: existem tipos de acabamento diferentes. O app usou o acabamento da primeira linha do grupo.`);
    }

    if (mixedSpiral && ["Encadernação espiral", "Encadernação wire-o"].includes(finishingType)) {
      warnings.push(`Grupo ${groupName}: existem opções de encadernação diferentes. O app usou a opção da primeira linha do grupo.`);
    }

    if (quantitySet.length > 1) {
      warnings.push(`Grupo ${groupName}: as quantidades das linhas estão diferentes. O acabamento foi calculado usando a menor quantidade do grupo.`);
    }

    let finishingUnit = 0;
    let finishingTotal = 0;

    if (finishingType === "Encadernação espiral") {
      finishingUnit = getSpiralUnitPrice({ ...leader.row, quantity: groupQuantity }, sheetsPerCopy, config);
      finishingTotal = groupQuantity * finishingUnit;
      if (sheetsPerCopy > 500) {
        warnings.push(`Grupo ${groupName}: a espiral vai até 500 folhas por apostila. Ajuste esse grupo manualmente.`);
      }
    } else if (finishingType === "Encadernação wire-o") {
      finishingUnit = getWireOUnitPrice({ ...leader.row, quantity: groupQuantity }, sheetsPerCopy, config);
      finishingTotal = groupQuantity * finishingUnit;
      if (sheetsPerCopy > 500) {
        warnings.push(`Grupo ${groupName}: o wire-o vai até 500 folhas por apostila nesta tabela. Ajuste esse grupo manualmente.`);
      }
    } else if (finishingType === "Livreto") {
      finishingUnit = getBookletUnitPrice(groupQuantity, config);
      finishingTotal = groupQuantity * finishingUnit;
    } else if (finishingType === "Capa dura") {
      finishingUnit = getHardCoverUnitPrice(groupQuantity, config);
      finishingTotal = groupQuantity * finishingUnit;
    } else if (finishingType === "Capa mole laminada") {
      finishingUnit = getLaminatedSoftCoverUnitPrice(groupQuantity, config);
      finishingTotal = groupQuantity * finishingUnit;
    }

    entries.forEach((entry, entryIndex) => {
      groupMetaByIndex[entry.index] = {
        groupName,
        isLeader: entryIndex === 0,
        finishingType,
        groupQuantity,
        sheetsPerCopy,
        finishingUnit: entryIndex === 0 ? finishingUnit : 0,
        finishingTotal: entryIndex === 0 ? finishingTotal : 0,
      };
    });
  }

  const computedRows = rowBase.map((item, index) => {
    const { row, innerImpressions, bindingSheetsPerCopy, coverImpressions, backImpressions } = item;
    const effectiveInnerQty =
      state.calcMode === "Somar quantidades" ? aggregateInnerByKey[getPrintAggregationKey(row.printType, row.printMode)] || 0 : innerImpressions;

    const samePaper = row.coverPaper === row.backCoverPaper;
    const coverPricingQty =
      state.calcMode === "Somar quantidades"
        ? aggregateCoverByPaper[row.coverPaper] || 0
        : samePaper
          ? coverImpressions + backImpressions
          : coverImpressions;
    const backPricingQty =
      state.calcMode === "Somar quantidades"
        ? aggregateCoverByPaper[row.backCoverPaper] || 0
        : samePaper
          ? coverImpressions + backImpressions
          : backImpressions;

    const innerTotal = getPrintTotalByType(row.printType, innerImpressions, effectiveInnerQty, config, row.printMode);
    const coverUnit = coverImpressions > 0 ? lookupTier(config.coverPricing[row.coverPaper], coverPricingQty) : 0;
    const backUnit = backImpressions > 0 ? lookupTier(config.coverPricing[row.backCoverPaper], backPricingQty) : 0;
    const coverTotal = coverImpressions * coverUnit;
    const backTotal = backImpressions * backUnit;

    let finishingUnit = 0;
    let finishingTotal = 0;
    const groupMeta = groupMetaByIndex[index];
    const hasGroupedFinishing = Boolean(groupMeta?.groupName);

    if (hasGroupedFinishing) {
      finishingUnit = groupMeta.finishingUnit;
      finishingTotal = groupMeta.finishingTotal;
    } else if (row.finishing === "Encadernação espiral") {
      finishingUnit = getSpiralUnitPrice(row, bindingSheetsPerCopy, config);
      finishingTotal = row.quantity * finishingUnit;
      if (bindingSheetsPerCopy > 500 && isRowActive(row)) {
        warnings.push(`Item ${index + 1}: a espiral vai até 500 folhas por apostila. Ajuste esse item manualmente.`);
      }
    } else if (row.finishing === "Encadernação wire-o") {
      finishingUnit = getWireOUnitPrice(row, bindingSheetsPerCopy, config);
      finishingTotal = row.quantity * finishingUnit;
      if (bindingSheetsPerCopy > 500 && isRowActive(row)) {
        warnings.push(`Item ${index + 1}: o wire-o vai até 500 folhas por apostila nesta tabela. Ajuste esse item manualmente.`);
      }
    } else if (row.finishing === "Livreto") {
      finishingUnit = getBookletUnitPrice(row.quantity, config);
      finishingTotal = row.quantity * finishingUnit;
    } else if (row.finishing === "Capa dura") {
      finishingUnit = getHardCoverUnitPrice(row.quantity, config);
      finishingTotal = row.quantity * finishingUnit;
    } else if (row.finishing === "Capa mole laminada") {
      finishingUnit = getLaminatedSoftCoverUnitPrice(row.quantity, config);
      finishingTotal = row.quantity * finishingUnit;
    }

    const totalBeforeDiscount = innerTotal + coverTotal + backTotal + finishingTotal;
    const discount = calculateDiscount(totalBeforeDiscount, row);
    const total = discount.totalAfterDiscount;
    const unitValue = row.quantity > 0 ? total / row.quantity : 0;

    return {
      ...row,
      active: isRowActive(row),
      innerImpressions,
      bindingSheetsPerCopy,
      coverImpressions,
      backImpressions,
      innerTotal,
      coverTotal,
      backTotal,
      bindingGroup: normalizeBindingGroup(row.bindingGroup),
      bindingGroupLeader: Boolean(groupMeta?.isLeader),
      groupedFinishing: hasGroupedFinishing,
      groupedSheetsPerCopy: groupMeta?.sheetsPerCopy || 0,
      groupedQuantity: groupMeta?.groupQuantity || 0,
      finishingUnit,
      finishingTotal,
      totalBeforeDiscount,
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      discountAmount: discount.discountAmount,
      total,
      unitValue,
    };
  });

  const activeRows = computedRows.filter((row) => row.active);
  const totalQuantity = activeRows.reduce((sum, row) => sum + row.quantity, 0);
  const totalGeneral = activeRows.reduce((sum, row) => sum + row.total, 0);
  const averageValue = totalQuantity > 0 ? totalGeneral / totalQuantity : 0;

  return {
    rows: computedRows,
    activeRows,
    totals: {
      activeLines: activeRows.length,
      totalQuantity,
      totalGeneral,
      averageValue,
    },
    warnings,
  };
}

function calculateColorPrintWorkbook(state, config) {
  const warnings = [];
  const colorCatalog = getColorProductCatalog(config);
  const combinationServices = getCombinationServices(config);

  const computedRows = state.colorPrintItems.map((row, index) => {
    const preset = colorCatalog.find((item) => item.id === row.productPresetId) || null;
    const widthCm = toDecimalNumber(row.widthMm);
    const heightCm = toDecimalNumber(row.heightMm);
    const widthMm = widthCm * 10;
    const heightMm = heightCm * 10;
    const quantity = toWholeNumber(row.quantity);
    const hasBleed = row.bleedMode === "Com sangra";
    const effectiveWidth = widthMm + (hasBleed ? 2 : 0);
    const effectiveHeight = heightMm + (hasBleed ? 2 : 0);
    const active = isColorPrintRowActive(row);
    const customPricing = preset?.customPricingKey ? config.colorProductPricing?.[preset.customPricingKey] : null;
    const usesDirectBracketPricing = preset?.customPricingMode === "direct-bracket-unit";

    if (usesDirectBracketPricing) {
      const serviceSummary = buildColorServiceSummary(row, combinationServices, {
        quantity,
        itemsPerSheet: quantity,
        a4Sheets: quantity,
        widthMm,
        heightMm,
      });
      const unitPrice = getDirectBracketUnitPrice(customPricing, quantity);
      const printTotal = quantity * unitPrice;
      const totalBeforeDiscount = printTotal + serviceSummary.total;
      const discount = calculateDiscount(totalBeforeDiscount, row);
      const total = discount.totalAfterDiscount;
      const unitValue = quantity > 0 ? total / quantity : 0;

      return {
        ...row,
        productLabel: preset?.label || "",
        widthMm: widthCm,
        heightMm: heightCm,
        effectiveWidth,
        effectiveHeight,
        active,
        itemsPerSheet: quantity,
        a4Sheets: quantity,
        a4Impressions: quantity,
        printTotal,
        suggestedCutPrice: 0,
        finalCutPrice: 0,
        serviceExtraTotal: serviceSummary.total,
        serviceSummary: serviceSummary.text,
        totalBeforeDiscount,
        discountType: discount.discountType,
        discountValue: discount.discountValue,
        discountAmount: discount.discountAmount,
        total,
        unitValue,
        estimatedCuts: 0,
        pricingSummary: preset?.unitLabel || "Folha A3",
      };
    }

    if ((effectiveWidth > A4_WIDTH_MM && effectiveWidth > A4_HEIGHT_MM) || (effectiveHeight > A4_HEIGHT_MM && effectiveHeight > A4_WIDTH_MM)) {
      if (active) {
        warnings.push(`Impresso ${index + 1}: o tamanho informado não cabe em uma folha A4.`);
      }
    }

    if (effectiveWidth <= 0 || effectiveHeight <= 0 || quantity <= 0) {
      const serviceSummary = buildColorServiceSummary(row, combinationServices, {
        quantity,
        itemsPerSheet: 0,
        a4Sheets: 0,
        widthMm,
        heightMm,
      });
      const totalBeforeDiscount = (row.cutPriceOverride === "" ? 0 : toMoneyNumber(row.cutPriceOverride)) + serviceSummary.total;
      const discount = calculateDiscount(totalBeforeDiscount, row);
      return {
        ...row,
        productLabel: preset?.label || "",
        widthMm: widthCm,
        heightMm: heightCm,
        effectiveWidth,
        effectiveHeight,
        active,
        itemsPerSheet: 0,
        a4Sheets: 0,
        a4Impressions: 0,
        printTotal: 0,
        suggestedCutPrice: 0,
        finalCutPrice: row.cutPriceOverride === "" ? 0 : toMoneyNumber(row.cutPriceOverride),
        serviceExtraTotal: serviceSummary.total,
        serviceSummary: serviceSummary.text,
        totalBeforeDiscount,
        discountType: discount.discountType,
        discountValue: discount.discountValue,
        discountAmount: discount.discountAmount,
        total: discount.totalAfterDiscount,
        unitValue: quantity > 0 ? discount.totalAfterDiscount / quantity : 0,
        estimatedCuts: 0,
      };
    }

    const fit = getBestFitOnA4(effectiveWidth, effectiveHeight);
    if (fit.itemsPerSheet <= 0) {
      if (active) {
        warnings.push(`Impresso ${index + 1}: o tamanho informado não cabe em uma folha A4.`);
      }
      const serviceSummary = buildColorServiceSummary(row, combinationServices, {
        quantity,
        itemsPerSheet: 0,
        a4Sheets: 0,
        widthMm,
        heightMm,
      });
      const totalBeforeDiscount = (row.cutPriceOverride === "" ? 0 : toMoneyNumber(row.cutPriceOverride)) + serviceSummary.total;
      const discount = calculateDiscount(totalBeforeDiscount, row);
      return {
        ...row,
        productLabel: preset?.label || "",
        widthMm: widthCm,
        heightMm: heightCm,
        effectiveWidth,
        effectiveHeight,
        active,
        itemsPerSheet: 0,
        a4Sheets: 0,
        a4Impressions: 0,
        printTotal: 0,
        suggestedCutPrice: 0,
        finalCutPrice: row.cutPriceOverride === "" ? 0 : toMoneyNumber(row.cutPriceOverride),
        serviceExtraTotal: serviceSummary.total,
        serviceSummary: serviceSummary.text,
        totalBeforeDiscount,
        discountType: discount.discountType,
        discountValue: discount.discountValue,
        discountAmount: discount.discountAmount,
        total: discount.totalAfterDiscount,
        unitValue: quantity > 0 ? discount.totalAfterDiscount / quantity : 0,
        estimatedCuts: 0,
      };
    }

    const sides = row.printMode === "Frente e verso" ? 2 : 1;
    const a4Sheets = Math.ceil(quantity / fit.itemsPerSheet);
    const a4Impressions = a4Sheets * sides;
    const pricingKey = getColorPaperPricingKey(row.paperType);
    const printUnit = lookupTier(Array.isArray(customPricing) && customPricing.length ? customPricing : config.colorPrintPricing[pricingKey], a4Impressions);
    const printTotal = a4Impressions * printUnit;
    const estimatedCuts = estimateCuts(fit.cols, fit.rows);
    let suggestedCutPrice = 0;

    if (fit.itemsPerSheet > 1 && estimatedCuts > 0) {
      if (a4Sheets <= 5) {
        suggestedCutPrice = lookupSmallJobCutValue(config.cutPricing, fit.itemsPerSheet);
      } else {
        suggestedCutPrice = estimatedCuts * Number(config.cutPricing.aboveFiveSheetsPerCut || 0);
      }
    }

    const finalCutPrice = row.cutPriceOverride === "" ? suggestedCutPrice : toMoneyNumber(row.cutPriceOverride);
    const serviceSummary = buildColorServiceSummary(row, combinationServices, {
      quantity,
      itemsPerSheet: fit.itemsPerSheet,
      a4Sheets,
      widthMm,
      heightMm,
    });
    const totalBeforeDiscount = printTotal + finalCutPrice + serviceSummary.total;
    const discount = calculateDiscount(totalBeforeDiscount, row);
    const total = discount.totalAfterDiscount;
    const unitValue = quantity > 0 ? total / quantity : 0;

    return {
      ...row,
      productLabel: preset?.label || "",
      widthMm: widthCm,
      heightMm: heightCm,
      effectiveWidth,
      effectiveHeight,
      active,
      itemsPerSheet: fit.itemsPerSheet,
      a4Sheets,
      a4Impressions,
      printTotal,
      suggestedCutPrice,
      finalCutPrice,
      serviceExtraTotal: serviceSummary.total,
      serviceSummary: serviceSummary.text,
      totalBeforeDiscount,
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      discountAmount: discount.discountAmount,
      total,
      unitValue,
      estimatedCuts,
    };
  });

  const activeRows = computedRows.filter((row) => row.active);
  const totalQuantity = activeRows.reduce((sum, row) => sum + toWholeNumber(row.quantity), 0);
  const totalGeneral = activeRows.reduce((sum, row) => sum + row.total, 0);
  const averageValue = totalQuantity > 0 ? totalGeneral / totalQuantity : 0;

  return {
    rows: computedRows,
    activeRows,
    totals: {
      activeLines: activeRows.length,
      totalQuantity,
      totalGeneral,
      averageValue,
    },
    warnings,
  };
}

function isCredentialRowActive(row) {
  return Boolean(row.description?.trim() || Number(row.quantity) > 0 || Number(row.widthCm) > 0 || Number(row.heightCm) > 0);
}

function getCredentialMaterialConfig(materialType) {
  const material = OPTIONS.credentialMaterials.includes(materialType) ? materialType : "Couche 250g";
  if (material === "PS 1mm") {
    return { label: material, pricingMode: "m2", pricingKey: "ps1mm" };
  }
  if (material === "PS 2mm") {
    return { label: material, pricingMode: "m2", pricingKey: "ps2mm" };
  }
  return { label: material, pricingMode: "a4", paperType: material };
}

function getCredentialLaminationPrice(config) {
  const finishes = Array.isArray(config.m2Finishes) ? config.m2Finishes : [];
  const lamination = finishes.find((finish) => String(finish.id || "").toLowerCase() === "laminacao")
    || finishes.find((finish) => normalizeLookupText(finish.label) === "laminacao");
  return toMoneyNumber(lamination?.price);
}

function getCredentialLanyardOptions(config) {
  const pricing = config?.credentialLanyardPricing || {};
  return [
    {
      id: "none",
      label: "Sem cordão",
      hint: "Entrega apenas da credencial.",
      unitPrice: 0,
    },
    {
      id: "round-white-2mm",
      label: "Cordão roliço branco 2mm",
      hint: `${formatCurrency(pricing.roundWhite2mm)} por unidade`,
      unitPrice: toMoneyNumber(pricing.roundWhite2mm),
    },
  ];
}

function getCredentialLanyardSelection(config, lanyardType) {
  const options = getCredentialLanyardOptions(config);
  return options.find((item) => item.id === lanyardType) || options[0];
}

function getCredentialMinimumBand(pricing) {
  if (!Array.isArray(pricing)) {
    return null;
  }
  return pricing.find((tier) => normalizeLookupText(tier.label).includes("valorminimo")) || null;
}

function calculateCredentialWorkbook(state, config) {
  const warnings = [];
  const laminationPricePerM2 = getCredentialLaminationPrice(config);

  const rows = state.credentialItems.map((row, index) => {
    const widthCm = toDecimalNumber(row.widthCm);
    const heightCm = toDecimalNumber(row.heightCm);
    const quantity = toWholeNumber(row.quantity);
    const active = isCredentialRowActive(row);
    const material = getCredentialMaterialConfig(row.materialType);
    const lanyard = getCredentialLanyardSelection(config, row.lanyardType);
    const printMode = row.printMode === "Frente e verso" ? "Frente e verso" : "Só frente";
    const sides = printMode === "Frente e verso" ? 2 : 1;
    const widthMm = widthCm * 10;
    const heightMm = heightCm * 10;
    const areaM2 = (widthCm * heightCm * quantity) / 10000;
    const laminationSelected = row.lamination === "Com laminação";
    const lanyardTotal = quantity * lanyard.unitPrice;

    const baseRow = {
      ...row,
      active,
      valid: false,
      widthCm,
      heightCm,
      quantity,
      materialType: material.label,
      materialLabel: material.label,
      printMode,
      lanyardType: lanyard.id,
      lanyardLabel: lanyard.label,
      lanyardUnitPrice: lanyard.unitPrice,
      areaM2,
      itemsPerSheet: 0,
      sheetsNeeded: 0,
      impressionsNeeded: 0,
      sheetPrice: 0,
      pricePerM2: 0,
      tierLabel: "-",
      baseTotal: 0,
      laminationTotal: 0,
      lanyardTotal,
      totalBeforeDiscount: 0,
      discountType: normalizeDiscountType(row.discountType),
      discountValue: normalizeDiscountValue(row.discountValue),
      discountAmount: 0,
      total: 0,
      unitValue: 0,
      warning: "",
    };

    if (!active) {
      return baseRow;
    }

    if (widthCm <= 0 || heightCm <= 0 || quantity <= 0) {
      return {
        ...baseRow,
        warning: `Credencial ${index + 1}: preencha largura, altura e quantidade maiores que zero.`,
      };
    }

    if (material.pricingMode === "a4") {
      if ((widthMm > A4_WIDTH_MM && widthMm > A4_HEIGHT_MM) || (heightMm > A4_HEIGHT_MM && heightMm > A4_WIDTH_MM)) {
        return {
          ...baseRow,
          warning: `Credencial ${index + 1}: o tamanho informado não cabe em uma folha A4.`,
        };
      }

      const fit = getBestFitOnA4(widthMm, heightMm);
      if (!fit.itemsPerSheet) {
        return {
          ...baseRow,
          warning: `Credencial ${index + 1}: não foi possível encaixar essa medida em uma folha A4.`,
        };
      }

      const sheetsNeeded = Math.ceil(quantity / fit.itemsPerSheet);
      const impressionsNeeded = sheetsNeeded * sides;
      const pricingKey = getColorPaperPricingKey(material.paperType);
      const sheetPrice = lookupTier(config.colorPrintPricing?.[pricingKey], impressionsNeeded);
      const baseTotal = impressionsNeeded * sheetPrice;
      const laminationTotal = laminationSelected ? areaM2 * laminationPricePerM2 : 0;
      const totalBeforeDiscount = baseTotal + laminationTotal + lanyardTotal;
      const discount = calculateDiscount(totalBeforeDiscount, row);
      const total = discount.totalAfterDiscount;

      return {
        ...baseRow,
        valid: true,
        itemsPerSheet: fit.itemsPerSheet,
        sheetsNeeded,
        impressionsNeeded,
        sheetPrice,
        baseTotal,
        laminationTotal,
        lanyardTotal,
        totalBeforeDiscount,
        discountType: discount.discountType,
        discountValue: discount.discountValue,
        discountAmount: discount.discountAmount,
        total,
        unitValue: quantity > 0 ? total / quantity : 0,
        tierLabel: `${fit.itemsPerSheet} por A4`,
      };
    }

    const pricing = config.m2Pricing?.[material.pricingKey] || [];
    const minimumBand = getCredentialMinimumBand(pricing);
    const tier = getM2PricingBand(pricing, areaM2);
    const pricePerM2 = toMoneyNumber(tier?.value);
    const minimumValue = toMoneyNumber(minimumBand?.value);
    const baseSubtotal = areaM2 * pricePerM2;
    let baseTotal = Math.max(minimumValue, baseSubtotal);

    if (printMode === "Frente e verso") {
      const flatCutBand = getM2PricingBand(config.m2Pricing?.flatCut || [], areaM2);
      baseTotal += areaM2 * toMoneyNumber(flatCutBand?.value);
    }

    const laminationTotal = laminationSelected ? areaM2 * laminationPricePerM2 : 0;
    const totalBeforeDiscount = baseTotal + laminationTotal + lanyardTotal;
    const discount = calculateDiscount(totalBeforeDiscount, row);
    const total = discount.totalAfterDiscount;

    return {
      ...baseRow,
      valid: true,
      pricePerM2,
      baseTotal,
      laminationTotal,
      lanyardTotal,
      totalBeforeDiscount,
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      discountAmount: discount.discountAmount,
      total,
      unitValue: quantity > 0 ? total / quantity : 0,
      tierLabel: tier?.label || "-",
    };
  });

  rows.forEach((row) => {
    if (row.warning) {
      warnings.push(row.warning);
    }
  });

  const activeRows = rows.filter((row) => row.active && row.valid);
  const totalQuantity = activeRows.reduce((sum, row) => sum + row.quantity, 0);
  const totalGeneral = activeRows.reduce((sum, row) => sum + row.total, 0);

  return {
    rows,
    activeRows,
    warnings,
    totals: {
      activeLines: activeRows.length,
      totalQuantity,
      totalGeneral,
      averageValue: totalQuantity > 0 ? totalGeneral / totalQuantity : 0,
    },
  };
}

function getReadyProductCatalog(config) {
  return (config.catalogSections || [])
    .filter((item) => item?.tab === "prontos")
    .map((item) => ({
      ...item,
      readyPricingKey: item.readyPricingKey || "",
      readyPricingMode: item.readyPricingMode || "manual",
      readyVariantMode: item.readyVariantMode || "",
      unitLabel: item.unitLabel || "unidades",
      note: item.note || "",
    }));
}

function getReadyPricingRows(config, product) {
  if (!product?.readyPricingKey) {
    return [];
  }
  return Array.isArray(config.readyProductPricing?.[product.readyPricingKey])
    ? config.readyProductPricing[product.readyPricingKey]
    : [];
}

function getReadyTierRow(rows, quantity) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }
  let selected = rows[0] || null;
  for (const row of rows) {
    if (quantity >= Number(row.min || 0)) {
      selected = row;
    }
  }
  return selected;
}

function getReadyVariantRow(rows, variantIndex) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }
  return rows[variantIndex] || rows[0] || null;
}

function calculateReadyWorkbook(state, config) {
  const warnings = [];
  const readyCatalog = getReadyProductCatalog(config);

  const rows = state.readyItems.map((row, index) => {
    const product = readyCatalog.find((item) => item.id === row.productId) || null;
    const quantity = toWholeNumber(row.quantity);
    const extraCharge = toMoneyNumber(row.extraCharge);
    const artCreationFee = toMoneyNumber(row.artCreationFee);
    const manualBase = row.basePriceOverride === "" ? 0 : toMoneyNumber(row.basePriceOverride);
    const pricingRows = getReadyPricingRows(config, product);
    const pricingMode = product?.readyPricingMode || "manual";
    const variantMode = product?.readyVariantMode || "";
    const active = isReadyRowActive(row);

    let pricingLabel = "";
    let baseTotal = 0;
    let baseUnit = 0;
    let effectiveQuantity = quantity;

    if (product && pricingMode === "quantity-tier") {
      const selectedTier = getReadyTierRow(pricingRows, quantity);
      const chargeMode = selectedTier?.mode === "total" ? "total" : "unit";
      pricingLabel = selectedTier?.label || "";
      if (chargeMode === "total") {
        baseTotal = Number(selectedTier?.value || 0);
        baseUnit = quantity > 0 ? baseTotal / quantity : 0;
      } else {
        baseUnit = Number(selectedTier?.value || 0);
        baseTotal = quantity * baseUnit;
      }
    } else if (product && pricingMode === "variant-fixed") {
      const selectedVariant = getReadyVariantRow(pricingRows, row.variantIndex);
      const chargeMode = selectedVariant?.mode === "total" ? "total" : "unit";
      pricingLabel = selectedVariant?.label || "";
      if (chargeMode === "total") {
        effectiveQuantity = Number(selectedVariant?.quantity || quantity || 0);
        baseTotal = Number(selectedVariant?.value || 0);
        baseUnit = effectiveQuantity > 0 ? baseTotal / effectiveQuantity : 0;
      } else {
        const variantQuantity = quantity > 0 ? quantity : Number(selectedVariant?.quantity || 1);
        effectiveQuantity = variantQuantity;
        baseUnit = Number(selectedVariant?.value || 0);
        baseTotal = variantQuantity * baseUnit;
      }
    } else {
      pricingLabel = manualBase > 0 ? "Preço manual" : "Preencher manualmente";
      baseTotal = manualBase;
      baseUnit = quantity > 0 ? baseTotal / quantity : 0;
    }

    if (active && product && pricingMode !== "manual" && baseTotal <= 0) {
      warnings.push(`Material pronto ${index + 1}: a faixa de preço deste produto não retornou valor. Confira a configuração.`);
    }

    if (active && !product) {
      warnings.push(`Material pronto ${index + 1}: selecione um produto para concluir este item.`);
    }

    const totalBeforeDiscount = baseTotal + extraCharge + artCreationFee;
    const discount = calculateDiscount(totalBeforeDiscount, row);
    const total = discount.totalAfterDiscount;
    const unitValue = effectiveQuantity > 0 ? total / effectiveQuantity : total;

    return {
      ...row,
      productLabel: product?.label || "",
      note: product?.note || "",
      unitLabel: product?.unitLabel || "unidades",
      pricingMode,
      readyVariantMode: variantMode,
      quantity,
      effectiveQuantity,
      baseTotal,
      baseUnit,
      basePriceManual: manualBase,
      pricingLabel,
      extraCharge,
      artCreationFee,
      totalBeforeDiscount,
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      discountAmount: discount.discountAmount,
      total,
      unitValue,
      active,
    };
  });

  const activeRows = rows.filter((row) => row.active);
  const totalQuantity = activeRows.reduce((sum, row) => sum + Number(row.effectiveQuantity || row.quantity || 0), 0);
  const totalGeneral = activeRows.reduce((sum, row) => sum + row.total, 0);

  return {
    rows,
    activeRows,
    totals: {
      activeLines: activeRows.length,
      totalQuantity,
      totalGeneral,
      averageValue: totalQuantity > 0 ? totalGeneral / totalQuantity : 0,
    },
    warnings,
  };
}

function getResinMaterialOption(materialType) {
  return RESIN_MATERIAL_OPTIONS.find((item) => item.id === materialType) || RESIN_MATERIAL_OPTIONS[0];
}

function getResinLayoutOption(pieceWidthMm, pieceHeightMm) {
  const fitAcross = Math.floor(RESIN_A3_WIDTH_MM / pieceWidthMm);
  const fitDown = Math.floor(RESIN_A3_HEIGHT_MM / pieceHeightMm);
  const piecesPerSheet = fitAcross * fitDown;

  return {
    fitAcross,
    fitDown,
    piecesPerSheet,
    leftoverWidth: Math.max(RESIN_A3_WIDTH_MM - fitAcross * pieceWidthMm, 0),
    leftoverHeight: Math.max(RESIN_A3_HEIGHT_MM - fitDown * pieceHeightMm, 0),
  };
}

function getResinBestLayout(pieceWidthMm, pieceHeightMm) {
  const normal = getResinLayoutOption(pieceWidthMm, pieceHeightMm);
  const rotated = getResinLayoutOption(pieceHeightMm, pieceWidthMm);
  return rotated.piecesPerSheet > normal.piecesPerSheet
    ? { ...rotated, rotated: true }
    : { ...normal, rotated: false };
}

function getResinSheetUnitPrice(config, pricingKey, sheetsNeeded) {
  const tiers = Array.isArray(config.resinPricing?.[pricingKey])
    ? config.resinPricing[pricingKey]
    : [];
  const selected = getReadyTierRow(tiers, sheetsNeeded) || tiers[0] || { value: 0, label: "" };
  return {
    value: Number(selected.value || 0),
    label: selected.label || "",
  };
}

function calculateResinWorkbook(state, config) {
  const warnings = [];
  const rows = (state.resinItems || []).map((row, index) => {
    const material = getResinMaterialOption(row.materialType);
    const widthMm = toDecimalNumber(row.widthMm);
    const heightMm = toDecimalNumber(row.heightMm);
    const quantity = toWholeNumber(row.quantity);
    const active = isResinRowActive(row);
    const spacingMm = Math.max(0, Number(config.resinPricing?.spacingMm ?? RESIN_MARGIN_MM));
    const finalWidthMm = widthMm > 0 ? widthMm + spacingMm : 0;
    const finalHeightMm = heightMm > 0 ? heightMm + spacingMm : 0;
    const layout = finalWidthMm > 0 && finalHeightMm > 0
      ? getResinBestLayout(finalWidthMm, finalHeightMm)
      : { fitAcross: 0, fitDown: 0, piecesPerSheet: 0, leftoverWidth: 0, leftoverHeight: 0, rotated: false };
    const sheetsNeeded = quantity > 0 && layout.piecesPerSheet > 0
      ? Math.ceil(quantity / layout.piecesPerSheet)
      : 0;
    const producedQuantity = sheetsNeeded * layout.piecesPerSheet;
    const sheetPrice = getResinSheetUnitPrice(config, material.pricingKey, sheetsNeeded || 1);
    const subtotal = sheetsNeeded * sheetPrice.value;
    const markupAmount = subtotal * (Number(config.resinPricing?.markupPercent || 0) / 100);
    const minimumOrderPrice = Number(config.resinPricing?.minimumOrderPrice || 0);
    const totalBeforeMinimum = subtotal + markupAmount;
    const totalBeforeDiscount = active && totalBeforeMinimum > 0
      ? Math.max(minimumOrderPrice, totalBeforeMinimum)
      : 0;
    const discount = calculateDiscount(totalBeforeDiscount, row);
    const total = discount.totalAfterDiscount;
    const unitValue = quantity > 0 ? total / quantity : 0;

    if (active && (!widthMm || !heightMm || !quantity)) {
      warnings.push(`Resinado ${index + 1}: informe largura, altura e quantidade para concluir o cálculo.`);
    }

    if (active && widthMm > 0 && heightMm > 0 && layout.piecesPerSheet <= 0) {
      warnings.push(`Resinado ${index + 1}: essa medida com ${formatMeasure(spacingMm)} mm de espaço técnico não cabe em uma folha A3.`);
    }

    return {
      ...row,
      materialType: material.id,
      materialLabel: material.label,
      pricingKey: material.pricingKey,
      widthMm,
      heightMm,
      quantity,
      finalWidthMm,
      finalHeightMm,
      spacingMm,
      fitAcross: layout.fitAcross,
      fitDown: layout.fitDown,
      piecesPerSheet: layout.piecesPerSheet,
      rotated: layout.rotated,
      sheetsNeeded,
      producedQuantity,
      sheetPrice: sheetPrice.value,
      sheetPriceLabel: sheetPrice.label,
      minimumOrderPrice,
      minimumApplied: active && totalBeforeMinimum > 0 && totalBeforeDiscount === minimumOrderPrice && totalBeforeMinimum < minimumOrderPrice,
      totalBeforeDiscount,
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      discountAmount: discount.discountAmount,
      total,
      unitValue,
      active,
    };
  });

  const activeRows = rows.filter((row) => row.active);
  const totalQuantity = activeRows.reduce((sum, row) => sum + row.quantity, 0);
  const totalGeneral = activeRows.reduce((sum, row) => sum + row.total, 0);

  return {
    rows,
    activeRows,
    totals: {
      activeLines: activeRows.length,
      totalQuantity,
      totalGeneral,
      averageValue: totalQuantity > 0 ? totalGeneral / totalQuantity : 0,
    },
    warnings,
  };
}

function getBlockCatalogForTab(config, tab) {
  return normalizeBlockCatalog(config.blockCatalog).filter((item) => item.tab === tab);
}

function getBlockFormats(config, tab) {
  return [...new Set(getBlockCatalogForTab(config, tab).map((item) => item.format))];
}

function findBlockPrice(config, tab, row) {
  return getBlockCatalogForTab(config, tab).find((item) =>
    item.format === row.format &&
    Number(item.vias) === Number(row.vias) &&
    Number(item.quantity) === Number(row.quantity)
  ) || null;
}

function isBlockRowActive(row) {
  return Boolean(
    row?.touched
    ||
    row?.description?.trim()
    || Number(row?.artCreationFee) > 0
    || Number(row?.discountValue) > 0
  );
}

function calculateBlockWorkbook(state, config, tab) {
  const rows = Array.isArray(state.blockItems?.[tab]) ? state.blockItems[tab] : [];
  const warnings = [];
  const computedRows = rows.map((row, index) => {
    const active = isBlockRowActive(row);
    const priceItem = findBlockPrice(config, tab, row);
    const tablePrice = toMoneyNumber(priceItem?.price);
    const artCreationFee = toMoneyNumber(row.artCreationFee);
    const totalBeforeDiscount = tablePrice + artCreationFee;
    const discount = calculateDiscount(totalBeforeDiscount, row);
    const total = discount.totalAfterDiscount;
    const quantity = Math.max(0, toWholeNumber(row.quantity));

    if (active && !priceItem) {
      warnings.push(`${BLOCK_TAB_DEFS[tab].label} ${index + 1}: não encontramos preço para formato, vias e quantidade selecionados.`);
    } else if (active && priceItem && tablePrice <= 0) {
      warnings.push(`${BLOCK_TAB_DEFS[tab].label} ${index + 1}: este preço está zerado na tabela e precisa ser configurado.`);
    }

    return {
      ...row,
      tab,
      active,
      priceItem,
      measure: priceItem?.measure || "",
      tablePrice,
      artCreationFee,
      totalBeforeDiscount,
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      discountAmount: discount.discountAmount,
      total,
      unitValue: quantity > 0 ? total / quantity : 0,
    };
  });

  const activeRows = computedRows.filter((row) => row.active);
  const totalQuantity = activeRows.reduce((sum, row) => sum + toWholeNumber(row.quantity), 0);
  const totalGeneral = activeRows.reduce((sum, row) => sum + row.total, 0);

  return {
    rows: computedRows,
    activeRows,
    warnings,
    totals: {
      activeLines: activeRows.length,
      totalQuantity,
      totalGeneral,
      averageValue: totalQuantity > 0 ? totalGeneral / totalQuantity : 0,
    },
  };
}

function getCardPricing(config) {
  return normalizeCardPricing(config.cardPricing, DEFAULT_CARD_CATALOG);
}

function getCardFinishes(config) {
  return normalizeCardFinishes(config.cardFinishes, DEFAULT_CARD_FINISHES);
}

function getCardSelectOptions(config, row) {
  const catalog = getCardPricing(config);
  const printTypes = [...new Set(catalog.map((item) => item.printType))];
  const selectedPrintType = printTypes.includes(row.printType) ? row.printType : printTypes[0] || "laser";
  const papers = [...new Set(catalog.filter((item) => item.printType === selectedPrintType).map((item) => item.paper))];
  const selectedPaper = papers.includes(row.paper) ? row.paper : papers[0] || row.paper || "Couche 300g";
  const sides = [...new Set(catalog.filter((item) => item.printType === selectedPrintType && item.paper === selectedPaper).map((item) => item.side))];
  const selectedSide = sides.includes(row.side) ? row.side : sides[0] || row.side || "Só frente";
  const quantities = [...new Set(catalog
    .filter((item) => item.printType === selectedPrintType && item.paper === selectedPaper && item.side === selectedSide)
    .map((item) => item.quantity))];
  const selectedQuantity = quantities.includes(Number(row.quantity))
    ? Number(row.quantity)
    : quantities[0] || Number(row.quantity) || 1;
  return { printTypes, selectedPrintType, papers, selectedPaper, sides, selectedSide, quantities, selectedQuantity };
}

function findCardPrice(config, row) {
  const options = getCardSelectOptions(config, row);
  return getCardPricing(config).find((item) =>
    item.printType === options.selectedPrintType &&
    item.paper === options.selectedPaper &&
    item.side === options.selectedSide &&
    Number(item.quantity) === Number(options.selectedQuantity)
  ) || null;
}

function calculateCardFinishTotal(finish, quantity, overrideValue = "") {
  const customValue = overrideValue === "" || overrideValue == null ? null : toMoneyNumber(overrideValue);
  if (customValue !== null && Number.isFinite(customValue)) {
    return customValue;
  }
  const safeQuantity = Math.max(0, toWholeNumber(quantity));
  if (safeQuantity <= 0) {
    return 0;
  }
  const thousandPrice = toMoneyNumber(finish.thousandPrice);
  if (safeQuantity >= 1000 && thousandPrice > 0) {
    return Math.ceil(safeQuantity / 1000) * thousandPrice;
  }
  const minimumUntil = Math.max(1, toWholeNumber(finish.minimumUntilQuantity || 100));
  if (safeQuantity <= minimumUntil) {
    return toMoneyNumber(finish.minimumPrice);
  }
  return toMoneyNumber(finish.minimumPrice) + Math.ceil((safeQuantity - minimumUntil) / 100) * toMoneyNumber(finish.pricePerHundred);
}

function isCardRowActive(row) {
  return Boolean(
    row?.touched ||
    row?.description?.trim() ||
    Number(row?.artCreationFee) > 0 ||
    Number(row?.discountValue) > 0 ||
    (Array.isArray(row?.finishIds) && row.finishIds.length > 0)
  );
}

function calculateCardWorkbook(state, config) {
  const rows = Array.isArray(state.cardItems) ? state.cardItems : [];
  const finishes = getCardFinishes(config);
  const warnings = [];
  const computedRows = rows.map((row, index) => {
    const options = getCardSelectOptions(config, row);
    const normalizedRow = {
      ...row,
      printType: options.selectedPrintType,
      paper: options.selectedPaper,
      side: options.selectedSide,
      quantity: options.selectedQuantity,
    };
    const active = isCardRowActive(normalizedRow);
    const priceItem = findCardPrice(config, normalizedRow);
    const tablePrice = toMoneyNumber(priceItem?.price);
    const selectedFinishes = finishes.filter((finish) => normalizedRow.finishIds?.includes(finish.id));
    const finishDetails = selectedFinishes.map((finish) => ({
      ...finish,
      total: calculateCardFinishTotal(finish, normalizedRow.quantity, normalizedRow.finishOverrides?.[finish.id]),
    }));
    const finishesTotal = finishDetails.reduce((sum, finish) => sum + finish.total, 0);
    const artCreationFee = toMoneyNumber(normalizedRow.artCreationFee);
    const totalBeforeDiscount = tablePrice + finishesTotal + artCreationFee;
    const discount = calculateDiscount(totalBeforeDiscount, normalizedRow);
    const total = discount.totalAfterDiscount;

    if (active && !priceItem) {
      warnings.push(`Cartão ${index + 1}: não encontramos preço para impressão, papel, lado e quantidade selecionados.`);
    }

    return {
      ...normalizedRow,
      active,
      priceItem,
      tablePrice,
      finishDetails,
      finishesTotal,
      finishSummary: finishDetails.map((finish) => finish.label).join(", "),
      artCreationFee,
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      discountAmount: discount.discountAmount,
      total,
      unitValue: normalizedRow.quantity > 0 ? total / normalizedRow.quantity : 0,
    };
  });

  const activeRows = computedRows.filter((row) => row.active);
  const totalQuantity = activeRows.reduce((sum, row) => sum + toWholeNumber(row.quantity), 0);
  const totalGeneral = activeRows.reduce((sum, row) => sum + row.total, 0);
  return {
    rows: computedRows,
    activeRows,
    warnings,
    totals: {
      activeLines: activeRows.length,
      totalQuantity,
      totalGeneral,
      averageValue: totalQuantity > 0 ? totalGeneral / totalQuantity : 0,
    },
  };
}

function getFlyerPricing(config) {
  return normalizeFlyerPricing(config.flyerPricing, DEFAULT_FLYER_CATALOG);
}

function getFlyerSelectOptions(config, row) {
  const catalog = getFlyerPricing(config);
  const printTypes = [...new Set(catalog.map((item) => item.printType))];
  const selectedPrintType = printTypes.includes(row.printType) ? row.printType : printTypes[0] || "laser";
  const papers = [...new Set(catalog.filter((item) => item.printType === selectedPrintType).map((item) => item.paper))];
  const selectedPaper = papers.includes(row.paper) ? row.paper : papers[0] || row.paper || "Couche 120g";
  const sizes = [...new Set(catalog.filter((item) => item.printType === selectedPrintType && item.paper === selectedPaper).map((item) => item.size))];
  const selectedSize = sizes.includes(row.size) ? row.size : sizes[0] || row.size || "10x7cm";
  const colorModes = [...new Set(catalog.filter((item) => item.printType === selectedPrintType && item.paper === selectedPaper && item.size === selectedSize).map((item) => item.colorMode))];
  const selectedColorMode = colorModes.includes(row.colorMode) ? row.colorMode : colorModes[0] || row.colorMode || "4x0 cores";
  const quantities = [...new Set(catalog
    .filter((item) => item.printType === selectedPrintType && item.paper === selectedPaper && item.size === selectedSize && item.colorMode === selectedColorMode)
    .map((item) => item.quantity))];
  const selectedQuantity = quantities.includes(Number(row.quantity)) ? Number(row.quantity) : quantities[0] || Number(row.quantity) || 1;
  return { printTypes, selectedPrintType, papers, selectedPaper, sizes, selectedSize, colorModes, selectedColorMode, quantities, selectedQuantity };
}

function findFlyerPrice(config, row) {
  const options = getFlyerSelectOptions(config, row);
  return getFlyerPricing(config).find((item) =>
    item.printType === options.selectedPrintType &&
    item.paper === options.selectedPaper &&
    item.size === options.selectedSize &&
    item.colorMode === options.selectedColorMode &&
    Number(item.quantity) === Number(options.selectedQuantity)
  ) || null;
}

function getFlyerFinishes(config) {
  return normalizeFlyerFinishes(config.flyerFinishes, DEFAULT_FLYER_FINISHES);
}

function getFlyerFinish(config, finishId) {
  const finishes = getFlyerFinishes(config);
  return finishes.find((finish) => finish.id === finishId) || finishes[0] || DEFAULT_FLYER_FINISHES[0];
}

function calculateFlyerFinishTotal(quantity, finish) {
  if (!finish || finish.id === "sem-acabamento") {
    return 0;
  }

  const units = Math.max(0, toWholeNumber(quantity));
  if (units <= 0) {
    return 0;
  }

  const minimumPrice = toMoneyNumber(finish.minimumPrice);
  const minimumUntilQuantity = Math.max(1, toWholeNumber(finish.minimumUntilQuantity || 100));
  const pricePerHundred = toMoneyNumber(finish.pricePerHundred);
  const thousandPrice = toMoneyNumber(finish.thousandPrice);

  if (units <= minimumUntilQuantity) {
    return minimumPrice;
  }

  if (thousandPrice > 0 && units >= 1000) {
    const thousands = Math.floor(units / 1000);
    const remainder = units % 1000;
    const remainderTotal = remainder > 0 ? Math.ceil(remainder / 100) * pricePerHundred : 0;
    return Math.max(minimumPrice, thousands * thousandPrice + remainderTotal);
  }

  return Math.max(minimumPrice, Math.ceil(units / 100) * pricePerHundred);
}

function isFlyerRowActive(row) {
  return Boolean(row?.touched || row?.description?.trim() || row?.finishId && row.finishId !== "sem-acabamento" || Number(row?.artCreationFee) > 0 || Number(row?.discountValue) > 0);
}

function calculateFlyerWorkbook(state, config) {
  const rows = Array.isArray(state.flyerItems) ? state.flyerItems : [];
  const warnings = [];
  const computedRows = rows.map((row, index) => {
    const options = getFlyerSelectOptions(config, row);
    const normalizedRow = {
      ...row,
      printType: options.selectedPrintType,
      paper: options.selectedPaper,
      size: options.selectedSize,
      colorMode: options.selectedColorMode,
      quantity: options.selectedQuantity,
    };
    const active = isFlyerRowActive(normalizedRow);
    const priceItem = findFlyerPrice(config, normalizedRow);
    const tablePrice = toMoneyNumber(priceItem?.price);
    const finish = getFlyerFinish(config, normalizedRow.finishId);
    const finishTotal = calculateFlyerFinishTotal(normalizedRow.quantity, finish);
    const artCreationFee = toMoneyNumber(normalizedRow.artCreationFee);
    const discount = calculateDiscount(tablePrice + finishTotal + artCreationFee, normalizedRow);
    const total = discount.totalAfterDiscount;

    if (active && !priceItem) {
      warnings.push(`Panfleto/folder ${index + 1}: não encontramos preço para impressão, papel, tamanho, cores e quantidade selecionados.`);
    }

    return {
      ...normalizedRow,
      active,
      priceItem,
      tablePrice,
      finishId: finish?.id || "sem-acabamento",
      finishLabel: finish?.label || "Sem acabamento",
      finishTotal,
      artCreationFee,
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      discountAmount: discount.discountAmount,
      total,
      unitValue: normalizedRow.quantity > 0 ? total / normalizedRow.quantity : 0,
    };
  });
  const activeRows = computedRows.filter((row) => row.active);
  const totalQuantity = activeRows.reduce((sum, row) => sum + toWholeNumber(row.quantity), 0);
  const totalGeneral = activeRows.reduce((sum, row) => sum + row.total, 0);
  return {
    rows: computedRows,
    activeRows,
    warnings,
    totals: {
      activeLines: activeRows.length,
      totalQuantity,
      totalGeneral,
      averageValue: totalQuantity > 0 ? totalGeneral / totalQuantity : 0,
    },
  };
}

function getM2MinimumValue(pricing) {
  const minimumRow = Array.isArray(pricing)
    ? pricing.find((tier) => String(tier.label || "").toLowerCase().includes("valor minimo"))
    : null;
  return Number(minimumRow?.value || 30);
}

function getM2PricingBand(pricing, areaM2) {
  if (!Array.isArray(pricing) || pricing.length === 0) {
    return null;
  }

  const bands = pricing.filter((tier) => !String(tier.label || "").toLowerCase().includes("valor minimo"));
  return bands.find((tier) => areaM2 <= Number(tier.min || 0)) || bands[bands.length - 1] || null;
}

function getM2ProductBleedMm(product, config) {
  if (!product) {
    return 0;
  }

  if (
    config.m2BleedByProduct &&
    Object.prototype.hasOwnProperty.call(config.m2BleedByProduct, product.id)
  ) {
    return Math.max(0, Number(config.m2BleedByProduct[product.id] || 0));
  }

  return Math.max(0, Number(product.bleedMm || 0));
}

function calculateM2WorkbookFromConfig(state, config) {
  const warnings = [];
  const catalog = getM2Catalog(config);
  const baseRows = state.m2Items.map((row, index) => {
    const product = catalog.find((item) => item.id === row.productId) || catalog[0];
    const pricing = config.m2Pricing?.[product.pricingKey || product.configKey] || [];
    const measureFactor = row.measureUnit === "m" ? 1000 : 10;
    const widthInput = toDecimalNumber(row.widthMm);
    const heightInput = toDecimalNumber(row.heightMm);
    const widthMm = widthInput * measureFactor;
    const heightMm = heightInput * measureFactor;
    const bleedMm = getM2ProductBleedMm(product, config);
    const pricingWidthMm = widthMm + bleedMm;
    const pricingHeightMm = heightMm + bleedMm;
    const quantity = toWholeNumber(row.quantity);
    const unitDisplayAreaM2 = widthMm > 0 && heightMm > 0 ? (widthMm * heightMm) / 1000000 : 0;
    const unitPricingAreaM2 = pricingWidthMm > 0 && pricingHeightMm > 0 ? (pricingWidthMm * pricingHeightMm) / 1000000 : 0;
    const displayAreaM2 = unitDisplayAreaM2 * quantity;
    const areaM2 = unitPricingAreaM2 * quantity;
    const tier = getM2PricingBand(pricing, areaM2);
    const pricePerM2 = Number(tier?.value || 0);
    const configuredFinishExtra = calculateM2FinishExtra(row, product, config);
    const configuredFinishExtraTotal = configuredFinishExtra * quantity;
    const extraCharge = toMoneyNumber(typeof row.extraCharge !== "undefined" ? row.extraCharge : row.finishingExtra);
    const artCreationFee = toMoneyNumber(row.artCreationFee);
    const fixedCharges = extraCharge + artCreationFee;
    const finishingExtra = configuredFinishExtra;
    const subtotal = (areaM2 * pricePerM2) + configuredFinishExtraTotal;
    const unitValue = quantity > 0 ? subtotal / quantity : 0;
    const total = subtotal + fixedCharges;
    const active = widthMm > 0 && heightMm > 0 && quantity > 0;

    if (active && areaM2 <= 0) {
      warnings.push(`Item m² ${index + 1}: informe largura e altura válidas.`);
    }

    return {
      ...row,
      productLabel: product.label,
      finishIds: Array.isArray(row.finishIds) ? row.finishIds : [],
      finishSummary: getM2FinishSummary(row, config).join(" | "),
      widthMm: widthInput,
      heightMm: heightInput,
      quantity,
      areaM2: displayAreaM2,
      effectiveArea: areaM2,
      tierLabel: tier?.label || "",
      tierValue: pricePerM2,
      configuredFinishExtra,
      configuredFinishExtraTotal,
      extraCharge,
      artCreationFee,
      fixedCharges,
      finishingExtra,
      unitValue,
      subtotal,
      total,
      active,
    };
  });

  const shouldGroupSameMaterials = state.m2CalcMode === "Somar materiais iguais";
  const pricingAreaByProduct = {};
  for (const row of baseRows) {
    if (!row.active) continue;
    pricingAreaByProduct[row.productId] = (pricingAreaByProduct[row.productId] || 0) + row.effectiveArea;
  }

  const rows = baseRows.map((row) => {
    if (!row.active) {
      return row;
    }

    const catalogProduct = catalog.find((item) => item.id === row.productId) || catalog[0];
    const pricing = config.m2Pricing?.[catalogProduct.pricingKey || catalogProduct.configKey] || [];
    const pricingArea = shouldGroupSameMaterials ? pricingAreaByProduct[row.productId] || row.effectiveArea : row.effectiveArea;
    const tier = getM2PricingBand(pricing, pricingArea);
    const pricePerM2 = Number(tier?.value || 0);
    const subtotal = (row.effectiveArea * pricePerM2) + row.configuredFinishExtraTotal;
    const unitValue = row.quantity > 0 ? subtotal / row.quantity : 0;
    const total = subtotal + row.fixedCharges;

    return {
      ...row,
      tierLabel: tier?.label || "",
      tierValue: pricePerM2,
      subtotal,
      unitValue,
      total,
      groupedPricingArea: pricingArea,
    };
  });

  const totalsByProduct = {};
  const baseTotalsByProduct = {};
  const fixedTotalsByProduct = {};
  for (const row of rows) {
    if (!row.active) continue;
    if (shouldGroupSameMaterials) {
      totalsByProduct[row.productId] = (totalsByProduct[row.productId] || 0) + row.total;
      baseTotalsByProduct[row.productId] = (baseTotalsByProduct[row.productId] || 0) + row.subtotal;
      fixedTotalsByProduct[row.productId] = (fixedTotalsByProduct[row.productId] || 0) + row.fixedCharges;
    }
  }

  const firstActiveIndexByProduct = {};
  rows.forEach((row, index) => {
    if (shouldGroupSameMaterials && row.active && typeof firstActiveIndexByProduct[row.productId] === "undefined") {
      firstActiveIndexByProduct[row.productId] = index;
    }
  });

  const rowsWithMinimum = rows.map((row, index) => {
    const product = M2_CATALOG.find((item) => item.id === row.productId) || M2_CATALOG[0];
    const minimumValue = getM2MinimumValue(config.m2Pricing?.[product.pricingKey || product.configKey] || []);

    if (!shouldGroupSameMaterials) {
      const minimumApplied = row.active && row.subtotal > 0 && row.subtotal < minimumValue;
      const adjustedBase = minimumApplied ? minimumValue : row.subtotal;
      const totalBeforeDiscount = row.active ? adjustedBase + row.fixedCharges : 0;
      const discount = calculateDiscount(totalBeforeDiscount, row);
      return {
        ...row,
        totalBeforeDiscount,
        discountType: discount.discountType,
        discountValue: discount.discountValue,
        discountAmount: discount.discountAmount,
        total: discount.totalAfterDiscount,
        unitValue: row.quantity > 0 ? discount.totalAfterDiscount / row.quantity : 0,
        groupTotal: row.total,
        groupBaseTotal: row.subtotal,
        groupFixedTotal: row.fixedCharges,
        minimumTotal: adjustedBase + row.fixedCharges,
        minimumApplied,
      };
    }

    const groupTotal = totalsByProduct[row.productId] || 0;
    const groupBaseTotal = baseTotalsByProduct[row.productId] || 0;
    const groupFixedTotal = fixedTotalsByProduct[row.productId] || 0;
    const minimumApplied = groupBaseTotal > 0 && groupBaseTotal < minimumValue;
    const adjustedGroupBaseTotal = minimumApplied ? minimumValue : groupBaseTotal;
    const displayTotal = row.active
      ? minimumApplied
        ? firstActiveIndexByProduct[row.productId] === index
          ? adjustedGroupBaseTotal + row.fixedCharges
          : row.fixedCharges
        : row.total
      : 0;
    const discount = calculateDiscount(displayTotal, row);

    return {
      ...row,
      totalBeforeDiscount: displayTotal,
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      discountAmount: discount.discountAmount,
      total: discount.totalAfterDiscount,
      unitValue: row.quantity > 0 ? discount.totalAfterDiscount / row.quantity : 0,
      groupTotal,
      groupBaseTotal,
      groupFixedTotal,
      minimumTotal: adjustedGroupBaseTotal + groupFixedTotal,
      minimumApplied: row.active && minimumApplied,
    };
  });

  const activeRows = rowsWithMinimum.filter((row) => row.active);
  const totalQuantity = activeRows.reduce((sum, row) => sum + row.quantity, 0);
  const totalGeneral = activeRows.reduce((sum, row) => sum + row.total, 0);

  return {
    rows: rowsWithMinimum,
    activeRows,
    totals: {
      activeLines: activeRows.length,
      totalQuantity,
      totalGeneral,
      averageValue: totalQuantity > 0 ? totalGeneral / totalQuantity : 0,
    },
    warnings,
  };
}

function buildOptions(options, currentValue) {
  return options
    .map((option) => `<option value="${escapeHtml(option)}"${option === currentValue ? " selected" : ""}>${escapeHtml(option)}</option>`)
    .join("");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

// Escape a value for use inside a double-quoted HTML attribute (e.g. <img src="...">).
// Also escapes single quotes so it is safe in single-quoted attributes too.
function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

function countPdfPagesFromText(text) {
  const countMatches = [...text.matchAll(/\/Count\s+(\d+)/g)].map((match) => Number(match[1]));
  const validCounts = countMatches.filter((value) => Number.isFinite(value) && value > 0);
  if (validCounts.length > 0) {
    return Math.max(...validCounts);
  }

  const pageMatches = text.match(/\/Type\s*\/Page\b/g);
  return pageMatches ? pageMatches.length : 0;
}

async function countPdfPages(file) {
  const buffer = await file.arrayBuffer();
  const decoder = new TextDecoder("windows-1252");
  const text = decoder.decode(buffer);
  return countPdfPagesFromText(text);
}

function ensureRowCount(state, minimumCount) {
  while (state.rows.length < minimumCount) {
    state.rows.push(createDefaultRow(state.rows.length));
  }
}

function ensureColorRowCount(state, minimumCount) {
  while (state.colorPrintItems.length < minimumCount) {
    state.colorPrintItems.push(createDefaultColorPrintRow(state.colorPrintItems.length));
  }
}

function ensureCredentialRowCount(state, minimumCount) {
  while (state.credentialItems.length < minimumCount) {
    state.credentialItems.push(createDefaultCredentialRow(state.credentialItems.length));
  }
}

function ensureM2RowCount(state, minimumCount) {
  while (state.m2Items.length < minimumCount) {
    state.m2Items.push(createDefaultM2Row(state.m2Items.length));
  }
}

function ensureReadyRowCount(state, minimumCount) {
  while (state.readyItems.length < minimumCount) {
    state.readyItems.push(createDefaultReadyRow(state.readyItems.length));
  }
}

function ensureResinRowCount(state, minimumCount) {
  if (!Array.isArray(state.resinItems)) {
    state.resinItems = [];
  }
  while (state.resinItems.length < minimumCount) {
    state.resinItems.push(createDefaultResinRow(state.resinItems.length));
  }
}

function trimEmptyRows(rows, minimumCount, isActive) {
  const trimmed = [...rows];
  while (trimmed.length > minimumCount && !isActive(trimmed[trimmed.length - 1])) {
    trimmed.pop();
  }
  return trimmed;
}

function applyPresetToRow(row, preset) {
  row.printType = preset.printType;
  row.size = preset.size;
  row.printMode = preset.printMode;
  row.finishing = preset.finishing;
  row.coverType = preset.coverType;
  row.coverPaper = preset.coverPaper;
  row.backCoverType = preset.backCoverType;
  row.backCoverPaper = preset.backCoverPaper;
  row.spiralOption = preset.spiralOption;
}

function createConfigSectionTabsMarkup(activeSection = "calculo") {
  const sections = [
    { id: "calculo", label: "Cálculo de apostila", helper: "Impressão, capas e acabamentos." },
    { id: "impressos", label: "Impressos coloridos", helper: "Papéis, cortes e produtos extras." },
    { id: "credenciais", label: "Credenciais", helper: "Materiais, PS, laminação e cordões." },
    { id: "m2", label: "Cálculo de m²", helper: "Faixas, acabamentos e produtos por área." },
    { id: "prontos", label: "Materiais prontos", helper: "Produtos rápidos, brindes e tabelas prontas." },
    { id: "resinados", label: "Resinados", helper: "Mínimo, resina e valores por A3." },
    { id: "cartoes", label: "Cartões de visita", helper: "Laser, offset, papéis e acabamentos." },
    { id: "panfletos", label: "Panfletos e folders", helper: "Laser, offset, papéis, tamanhos e cores." },
  ];

  return `
    <div class="config-section-tabs" role="tablist" aria-label="Seções da configuração">
      ${sections
        .map(
          (section) => `
            <button
              class="button config-section-tab${activeSection === section.id ? " is-active" : ""}"
              type="button"
              role="tab"
              aria-selected="${activeSection === section.id ? "true" : "false"}"
              data-config-section="${escapeHtml(section.id)}"
            >
              <span>${escapeHtml(section.label)}</span>
              <small>${escapeHtml(section.helper)}</small>
            </button>
          `
        )
        .join("")}
    </div>
  `;
}

function normalizeLookupText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function getStoreSeedCategoriesForTab(tab) {
  const allowedCategoryIds = STORE_CATALOG_TAB_CATEGORY_MAP[tab] || [];
  return (STORE_MASTER_SEED.categories || []).filter((category) => allowedCategoryIds.includes(category.id));
}

function isM2SeedProductCompatible(product) {
  return [
    "area_tiers_with_minimum",
    "area_with_minimum",
    "area_with_minimum_quantity",
  ].includes(product?.pricingModel);
}

function isStoreSeedProductAvailable(tab, categoryId, product, config) {
  if (tab === "impressos" && isStoreSeedCombinationServiceCompatible(categoryId, product) && !isStoreSeedColorProductCompatible(categoryId, product)) {
    return (config.combinationServices || []).some((item) => {
      const sameSource = item.sourceSeedId === product.id && item.sourceCategoryId === categoryId;
      const sameLabel = normalizeLookupText(item.label) === normalizeLookupText(product.label);
      return sameSource || sameLabel;
    });
  }

  if (tab === "m2") {
    const currentCatalog = getM2Catalog(config);
    return currentCatalog.some((item) => {
      const sameSource = item.sourceSeedId === product.id && item.sourceCategoryId === categoryId;
      const sameLabel = normalizeLookupText(item.label) === normalizeLookupText(product.label);
      return sameSource || sameLabel;
    });
  }

  return (config.catalogSections || []).some((item) => {
    if (!item || item.tab !== tab) {
      return false;
    }
    const sameSource = item.sourceSeedId === product.id && item.sourceCategoryId === categoryId;
    const sameLabel = normalizeLookupText(item.label) === normalizeLookupText(product.label);
    return sameSource || sameLabel;
  });
}

function isStoreSeedReadyProductCompatible(categoryId, product) {
  if (!product || typeof product !== "object") {
    return false;
  }
  if (STORE_SERVICE_CATEGORY_IDS.includes(categoryId)) {
    return false;
  }
  return [
    "fixed",
    "fixed_brackets",
    "fixed_variants",
    "unit_tiers",
    "custom-table",
  ].includes(product.pricingModel);
}

function normalizeSeedTierRows(rows) {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows
    .filter((row) => row && typeof row === "object")
    .map((row) => ({
      min: Number(row.min ?? row.exact ?? 0),
      value: Number(row.value ?? row.price ?? row.totalPrice ?? 0),
      label: row.label || row.description || "",
    }))
    .filter((row) => Number.isFinite(row.min) && Number.isFinite(row.value));
}

function getA4VariantTiers(product) {
  const variants = product?.tiersByVariant || [];
  const a4Variant = variants.find((variant) => normalizeLookupText(variant.variant).includes("a4"));
  return Array.isArray(a4Variant?.tiers) ? normalizeSeedTierRows(a4Variant.tiers) : null;
}

function isStoreSeedColorProductCompatible(categoryId, product) {
  if (!product || typeof product !== "object") {
    return false;
  }
  if (isHiddenFromImpressos(product)) {
    return false;
  }
  if (STORE_SERVICE_CATEGORY_IDS.includes(categoryId)) {
    return false;
  }
  if (product.pricingModel === "fixed_brackets") {
    return true;
  }
  if (product.pricingModel === "unit_tiers") {
    return true;
  }
  if (product.pricingModel === "fixed" && ["un", "folha", "folha-a3", ""].includes(product.unit || "")) {
    return true;
  }
  if (product.pricingModel === "sheet_tiers") {
    return true;
  }
  if (product.pricingModel === "sheet_tiers_by_size" || product.pricingModel === "sheet_tiers_variants") {
    return Boolean(getA4VariantTiers(product));
  }
  return false;
}

function isStoreSeedCombinationServiceCompatible(categoryId, product) {
  if (HIDDEN_IMPRESSOS_SERVICE_CATEGORY_IDS.has(String(categoryId || ""))) {
    return false;
  }
  if (isHiddenFromImpressos({
    id: product?.id,
    label: product?.label,
    sourceSeedId: product?.id,
    sourceCategoryId: categoryId,
  })) {
    return false;
  }
  if (STORE_SERVICE_CATEGORY_IDS.includes(categoryId)) {
    return true;
  }
  return false;
}

function resolveSeedColorPricingMode(product) {
  if (["fixed_brackets", "unit_tiers", "fixed"].includes(product?.pricingModel)) {
    return "direct-bracket-unit";
  }
  return "a4-imposition";
}

function inferPaperTypeFromSeedProduct(product) {
  const text = normalizeLookupText(`${product?.label || ""} ${product?.id || ""}`);
  if (text.includes("offset120")) return "Offset 120g";
  if (text.includes("170g")) return "Couche 170g";
  if (text.includes("250g")) return "Couche 250g";
  if (text.includes("300g") || text.includes("metalizado")) return "Couche 300g";
  return "Sulfite 75g";
}

function inferPrintModeFromSeedProduct(product) {
  const text = normalizeLookupText(`${product?.label || ""} ${product?.id || ""}`);
  if (text.includes("frenteeverso")) {
    return "Frente e verso";
  }
  return "Só frente";
}

function inferSeedProductDimensionsCm(product) {
  if (product?.unit === "folha-a3") {
    return { widthCm: 29.7, heightCm: 42 };
  }

  const haystack = [
    product?.label || "",
    ...(Array.isArray(product?.notes) ? product.notes : []),
  ].join(" ");
  const match = haystack.match(/(\d+(?:[.,]\d+)?)\s*x\s*(\d+(?:[.,]\d+)?)/i);
  if (match) {
    return {
      widthCm: Number(String(match[1]).replace(",", ".")),
      heightCm: Number(String(match[2]).replace(",", ".")),
    };
  }

  return { widthCm: 21, heightCm: 29.7 };
}

function convertSeedProductToColorPricing(product) {
  if (product.pricingModel === "fixed_brackets") {
    return (product.brackets || []).map((item) => ({
      min: Number(String(item.description || "").match(/\d+/)?.[0] || 0),
      value: Number(item.price || 0),
      label: item.description || "",
    }));
  }

  if (product.pricingModel === "unit_tiers") {
    return normalizeSeedTierRows(product.tiers || []);
  }

  if (product.pricingModel === "fixed") {
    return [
      {
        min: 1,
        value: Number(product.price || 0),
        label: product.label || "Preço unitário",
      },
    ];
  }

  if (product.pricingModel === "sheet_tiers") {
    return normalizeSeedTierRows(product.tiers || []);
  }

  const a4Tiers = getA4VariantTiers(product);
  return deepClone(a4Tiers || []);
}

function inferReadyChargeMode(description = "") {
  const text = normalizeLookupText(description);
  if (text.includes("cada") || text.includes("aunidade")) {
    return "unit";
  }
  return "total";
}

function extractLeadingQuantity(description = "") {
  const match = String(description || "").match(/(\d+(?:[.,]\d+)?)/);
  if (!match) {
    return 0;
  }
  return Number(String(match[1]).replace(",", ".")) || 0;
}

function inferReadyVariantMode(product) {
  if (!Array.isArray(product?.options) || product.options.length === 0) {
    return "";
  }
  const hasPackLikeOption = product.options.some((option) => {
    const text = normalizeLookupText(option?.description || "");
    return /^\d/.test(String(option?.description || "").trim()) || text.includes("cartoes") || text.includes("folhas") || text.includes("4x0") || text.includes("4x4");
  });
  return hasPackLikeOption ? "package-total" : "unit-variant";
}

function convertSeedProductToReadyPricing(product) {
  if (product.pricingModel === "fixed") {
    return {
      pricingMode: "quantity-tier",
      variantMode: "",
      rows: [
        {
          min: 1,
          value: Number(product.price || 0),
          mode: "unit",
          label: product.label || "Preço unitário",
        },
      ],
    };
  }

  if (product.pricingModel === "unit_tiers") {
    return {
      pricingMode: "quantity-tier",
      variantMode: "",
      rows: normalizeSeedTierRows(product.tiers || []).map((row) => ({
        ...row,
        mode: "unit",
      })),
    };
  }

  if (product.pricingModel === "fixed_brackets") {
    return {
      pricingMode: "quantity-tier",
      variantMode: "",
      rows: (product.brackets || []).map((item) => ({
        min: extractLeadingQuantity(item.description || "") || 1,
        value: Number(item.price || 0),
        mode: inferReadyChargeMode(item.description || ""),
        label: item.description || "",
      })),
    };
  }

  if (product.pricingModel === "fixed_variants") {
    return {
      pricingMode: "variant-fixed",
      variantMode: inferReadyVariantMode(product),
      rows: (product.options || []).map((item) => ({
        quantity: extractLeadingQuantity(item.description || "") || 1,
        value: Number(item.price || 0),
        mode: inferReadyVariantMode(product) === "package-total" ? "total" : "unit",
        label: item.description || "",
      })),
    };
  }

  return {
    pricingMode: "manual",
    variantMode: "",
    rows: [],
  };
}

function getColorProductCatalog(config) {
  return (config.catalogSections || [])
    .filter((item) => item?.tab === "impressos")
    .map((item) => ({
      ...item,
      widthCm: Number(item.widthCm || 0),
      heightCm: Number(item.heightCm || 0),
      bleedMode: item.bleedMode || "Sem sangra",
      printMode: item.printMode || "Só frente",
      paperType: item.paperType || "Sulfite 75g",
      customPricingKey: item.customPricingKey || "",
      customPricingMode: item.customPricingMode || "",
      unitLabel: item.unitLabel || "",
    }));
}

function getCombinationServices(config) {
  return Array.isArray(config.combinationServices) ? config.combinationServices : [];
}

function createColorServicePickerMarkup(row, config) {
  const services = getCombinationServices(config);
  const selectedIds = Array.isArray(row.serviceIds) ? row.serviceIds : [];
  const selectedLabels = selectedIds
    .map((serviceId) => services.find((service) => service.id === serviceId)?.label)
    .filter(Boolean);
  const buttonLabel = selectedLabels.length
    ? `Complementos (${selectedLabels.length})`
    : "Sem complemento";

  return `
    <div class="finish-picker">
      <button class="button finish-picker-button" type="button" data-color-service-toggle data-color-row-id="${escapeHtml(row.id)}">
        <span>${escapeHtml(buttonLabel)}</span>
        <span class="finish-picker-chevron">▾</span>
      </button>
    </div>
  `;
}

function convertSeedProductToM2Bands(product) {
  const bands = [];

  if (Number.isFinite(Number(product.minimumCharge))) {
    bands.push({
      min: 1,
      value: Number(product.minimumCharge),
      label: "Valor minimo",
    });
  }

  for (const tier of product.tiers || []) {
    if (!tier || !Number.isFinite(Number(tier.price))) {
      continue;
    }

    if (Number.isFinite(Number(tier.upTo)) && !Number.isFinite(Number(tier.min))) {
      bands.push({
        min: Number(tier.upTo),
        value: Number(tier.price),
        label: `até ${formatMeasure(Number(tier.upTo))} m²`,
      });
      continue;
    }

    if (Number.isFinite(Number(tier.upTo)) && Number.isFinite(Number(tier.min))) {
      bands.push({
        min: Number(tier.upTo),
        value: Number(tier.price),
        label: `de ${formatMeasure(Number(tier.min))} até ${formatMeasure(Number(tier.upTo))} m²`,
      });
      continue;
    }

    if (Number.isFinite(Number(tier.min))) {
      bands.push({
        min: 1000000,
        value: Number(tier.price),
        label: `acima de ${formatMeasure(Number(tier.min))} m²`,
      });
    }
  }

  return bands;
}

function resolveSeedServiceDefaultPrice(product) {
  if (Number.isFinite(Number(product?.price))) {
    return Number(product.price);
  }
  if (Array.isArray(product?.options) && product.options.length > 0) {
    return Number(product.options[0]?.price || 0);
  }
  if (Array.isArray(product?.brackets) && product.brackets.length > 0) {
    return Number(product.brackets[0]?.price || 0);
  }
  if (Array.isArray(product?.tiers) && product.tiers.length > 0) {
    const firstTier = product.tiers[0];
    return Number(firstTier?.totalPrice || firstTier?.price || 0);
  }
  return 0;
}

function findStoreSeedProductBySource(categoryId, productId) {
  const category = (STORE_MASTER_SEED.categories || []).find((item) => item.id === categoryId);
  return category?.products?.find((item) => item.id === productId) || null;
}

function getPlastificationA4MultiupPrice(itemsPerSheet) {
  let selected = PLASTIFICATION_A4_MULTIUP[0];
  for (const tier of PLASTIFICATION_A4_MULTIUP) {
    if (itemsPerSheet >= Number(tier.minItems || 0)) {
      selected = tier;
    }
  }
  return Number(selected?.value || 0);
}

function calculateAutomaticPlastificationTotal(context = {}) {
  const quantity = toWholeNumber(context.quantity);
  const baseWidthMm = toDecimalNumber(context.widthMm);
  const baseHeightMm = toDecimalNumber(context.heightMm);
  if (quantity <= 0 || baseWidthMm <= 0 || baseHeightMm <= 0) {
    return 0;
  }

  const pieceWidthMm = baseWidthMm + PLASTIFICATION_BORDER_MM * 2;
  const pieceHeightMm = baseHeightMm + PLASTIFICATION_BORDER_MM * 2;
  const candidates = [];

  for (const sheet of PLASEAL_SIZES) {
    const fit = getBestFitOnSheet(pieceWidthMm, pieceHeightMm, sheet.widthMm, sheet.heightMm);
    if (fit.itemsPerSheet <= 0) {
      continue;
    }

    const sheetsNeeded = Math.ceil(quantity / fit.itemsPerSheet);
    let unitPrice = 0;
    if (sheet.group === "a4-oficio") {
      unitPrice = fit.itemsPerSheet >= 2
        ? getPlastificationA4MultiupPrice(fit.itemsPerSheet)
        : lookupTier(PLASTIFICATION_A4_TIERS, quantity);
    } else {
      unitPrice = lookupTier(PLASTIFICATION_A3_TIERS, quantity);
    }

    candidates.push({
      total: sheetsNeeded * unitPrice,
      sheetsNeeded,
      unitPrice,
      itemsPerSheet: fit.itemsPerSheet,
      sheet,
      fit,
    });
  }

  if (!candidates.length) {
    return 0;
  }

  const preferredCandidates = candidates.some((candidate) => candidate.sheet.group === "a4-oficio")
    ? candidates.filter((candidate) => candidate.sheet.group === "a4-oficio")
    : candidates;
  preferredCandidates.sort((a, b) => a.total - b.total || b.itemsPerSheet - a.itemsPerSheet);
  return preferredCandidates[0].total;
}

function resolveAutomaticColorServiceTotal(service, context = {}) {
  const quantity = toWholeNumber(context.quantity);
  const a4Sheets = toWholeNumber(context.a4Sheets);
  const itemsPerSheet = toWholeNumber(context.itemsPerSheet);
  const seedProduct = findStoreSeedProductBySource(service?.sourceCategoryId, service?.sourceSeedId);

  if (service?.pricingMode === "plastification-auto" || service?.id === AUTO_PLASTIFICATION_SERVICE_ID) {
    return calculateAutomaticPlastificationTotal(context);
  }

  if (!seedProduct) {
    return Number(service?.defaultPrice || 0);
  }

  if (seedProduct.pricingModel === "unit_tiers") {
    const unitPrice = lookupTier(normalizeSeedTierRows(seedProduct.tiers || []), quantity);
    return quantity * unitPrice;
  }

  if (seedProduct.pricingModel === "fixed" && seedProduct.unit === "un") {
    return quantity * Number(seedProduct.price || 0);
  }

  return Number(service?.defaultPrice || 0);
}

function buildColorServiceSummary(row, services, context = {}) {
  const selectedServices = services
    .filter((service) => Array.isArray(row.serviceIds) && row.serviceIds.includes(service.id))
    .map((service) => {
      const isAutomaticPlastification = service.pricingMode === "plastification-auto" || service.id === AUTO_PLASTIFICATION_SERVICE_ID;
      const override = row.serviceOverrides?.[service.id];
      const value = isAutomaticPlastification || override === "" || override == null
        ? resolveAutomaticColorServiceTotal(service, context)
        : toMoneyNumber(override);
      return {
        id: service.id,
        label: isAutomaticPlastification ? "plastificação polaseal" : service.label,
        value,
      };
    });

  return {
    items: selectedServices,
    total: selectedServices.reduce((sum, service) => sum + Number(service.value || 0), 0),
    text: selectedServices
      .filter((service) => service.value > 0 || service.label)
      .map((service) => service.id === AUTO_PLASTIFICATION_SERVICE_ID
        ? service.label
        : `${service.label}: ${formatCurrency(service.value)}`)
      .join(" | "),
  };
}

function getDirectBracketUnitPrice(tiers, quantity) {
  if (!Array.isArray(tiers) || quantity <= 0) {
    return 0;
  }

  let selected = tiers[0] || null;
  for (const tier of tiers) {
    if (quantity >= Number(tier.min || 0)) {
      selected = tier;
    }
  }
  return Number(selected?.value || 0);
}

function importStoreSeedProductToConfig(tab, categoryId, productId, config) {
  const category = (STORE_MASTER_SEED.categories || []).find((item) => item.id === categoryId);
  const product = category?.products?.find((item) => item.id === productId);
  if (!category || !product) {
    return { ok: false, message: "Não foi possível localizar esse produto da tabela." };
  }

  if (isStoreSeedProductAvailable(tab, categoryId, product, config)) {
    return { ok: false, message: "Esse produto já está disponível no app." };
  }

  if (tab === "m2" && isM2SeedProductCompatible(product)) {
    const pricingKeys = new Set(Object.keys(config.m2Pricing || {}));
    const catalogIds = new Set((config.catalogSections || []).map((item) => item.id));
    const newPricingKey = createUniqueM2PricingKey(product.id || product.label || "m2", pricingKeys);
    const newProductId = createUniqueM2PricingKey(product.id || product.label || "produto", catalogIds);
    const bleedMm = /corte especial|verniz|tinta branca/i.test(product.label || "")
      ? Math.max(0, Number(config.m2BleedByProduct?.["digital-cut"] ?? DEFAULT_M2_BLEED_BY_PRODUCT["digital-cut"]))
      : 0;
    const note = [category.label, product.notes?.[0] || ""].filter(Boolean).join(" | ");

    config.catalogSections.push({
      id: newProductId,
      label: product.label || "Novo produto",
      tab: "m2",
      pricingKey: newPricingKey,
      note,
      sourceSeedId: product.id,
      sourceCategoryId: category.id,
      pricingModel: product.pricingModel || "",
      bleedMm,
    });
    config.m2Pricing[newPricingKey] = convertSeedProductToM2Bands(product);
    return { ok: true, message: "Produto da tabela adicionado à aba de cálculo de m²." };
  }

  if (tab === "impressos" && isStoreSeedColorProductCompatible(category.id, product)) {
    const pricingKeys = new Set(Object.keys(config.colorProductPricing || {}));
    const catalogIds = new Set((config.catalogSections || []).map((item) => item.id));
    const newPricingKey = createUniqueM2PricingKey(product.id || product.label || "impresso", pricingKeys);
    const newProductId = createUniqueM2PricingKey(product.id || product.label || "produto", catalogIds);
    const note = [category.label, product.notes?.[0] || ""].filter(Boolean).join(" | ");
    const pricingMode = resolveSeedColorPricingMode(product);
    const inferredDimensions = pricingMode === "direct-bracket-unit" && product.unit !== "folha-a3"
      ? { widthCm: 0, heightCm: 0 }
      : inferSeedProductDimensionsCm(product);

    config.catalogSections.push({
      id: newProductId,
      label: product.label || "Novo impresso",
      tab: "impressos",
      note,
      sourceSeedId: product.id,
      sourceCategoryId: category.id,
      pricingModel: product.pricingModel || "",
      widthCm: inferredDimensions.widthCm,
      heightCm: inferredDimensions.heightCm,
      bleedMode: "Sem sangra",
      printMode: inferPrintModeFromSeedProduct(product),
      paperType: inferPaperTypeFromSeedProduct(product),
      customPricingKey: newPricingKey,
      customPricingMode: pricingMode,
      unitLabel: product.unit === "folha-a3" ? "Folha A3" : "unidades",
    });
    config.colorProductPricing[newPricingKey] = convertSeedProductToColorPricing(product);
    return { ok: true, message: "Preset de impresso colorido adicionado ao app." };
  }

  if (tab === "impressos" && isStoreSeedCombinationServiceCompatible(categoryId, product)) {
    const existingKeys = new Set((config.combinationServices || []).map((item) => item.id));
    const newServiceId = createUniqueM2PricingKey(product.id || product.label || "servico", existingKeys);
    const note = [
      category.label,
      product.notes?.[0] || "",
      resolveSeedServiceDefaultPrice(product) > 0 ? "" : "Preencha o valor manualmente ao usar este complemento.",
    ]
      .filter(Boolean)
      .join(" | ");

    config.combinationServices.push({
      id: newServiceId,
      label: product.label || "Novo complemento",
      defaultPrice: resolveSeedServiceDefaultPrice(product),
      note,
      pricingMode: resolveSeedServiceDefaultPrice(product) > 0 ? "base" : "manual",
      sourceSeedId: product.id,
      sourceCategoryId: category.id,
    });
    return { ok: true, message: "Complemento combinável adicionado aos impressos." };
  }

  if (tab === "prontos" && isStoreSeedReadyProductCompatible(category.id, product)) {
    const pricingKeys = new Set(Object.keys(config.readyProductPricing || {}));
    const catalogIds = new Set((config.catalogSections || []).map((item) => item.id));
    const newPricingKey = createUniqueM2PricingKey(product.id || product.label || "pronto", pricingKeys);
    const newProductId = createUniqueM2PricingKey(product.id || product.label || "produto", catalogIds);
    const note = [category.label, ...(Array.isArray(product.notes) ? product.notes.slice(0, 2) : [])].filter(Boolean).join(" | ");
    const readyPricing = convertSeedProductToReadyPricing(product);

    config.catalogSections.push({
      id: newProductId,
      label: product.label || "Novo material pronto",
      tab: "prontos",
      note,
      sourceSeedId: product.id,
      sourceCategoryId: category.id,
      pricingModel: product.pricingModel || "",
      unitLabel: "unidades",
      readyPricingKey: newPricingKey,
      readyPricingMode: readyPricing.pricingMode,
      readyVariantMode: readyPricing.variantMode,
    });
    config.readyProductPricing[newPricingKey] = readyPricing.rows;
    return { ok: true, message: "Produto adicionado à aba de materiais prontos." };
  }

  return { ok: false, message: "Esse produto ainda não pode ser importado automaticamente nesta etapa." };
}

function createConfigSectionsMarkup(config, viewMode = "basic", activeSection = "calculo") {
  const apostilaCards = [
    createConfigCardMarkup(
      "Preços de impressão",
      "Esses valores alimentam a aba de cálculo de apostila.",
      [
        createInlineConfigBlockMarkup(
          "Preto e branco",
          createTableMarkup(
            ["Qtd mínima", "Valor", "Modo"],
            config.printPricing.blackWhite,
            "bw",
            [
              { key: "min", type: "number", step: "1" },
              { key: "value", type: "number", step: "0.01" },
              { key: "mode", type: "text" },
            ]
          ),
          "Os dois primeiros valores continuam como total fixo. As faixas de 1000 e 10000 valem apenas para frente e verso; no só frente, acima de 100 continua na mesma faixa."
        ),
        createInlineConfigBlockMarkup(
          "Colorido jato de tinta",
          createTableMarkup(
            ["Qtd mínima", "Valor", "Faixa"],
            config.printPricing.inkjet,
            "inkjet",
            [
              { key: "min", type: "number", step: "1" },
              { key: "value", type: "number", step: "0.01" },
              { key: "label", type: "text" },
            ]
          )
        ),
        createInlineConfigBlockMarkup(
          "Colorido laser",
          createTableMarkup(
            ["Qtd mínima", "Valor", "Faixa"],
            config.printPricing.laser,
            "laser",
            [
              { key: "min", type: "number", step: "1" },
              { key: "value", type: "number", step: "0.01" },
              { key: "label", type: "text" },
            ]
          )
        ),
      ].join("")
    ),
    createConfigCardMarkup(
      "Capas e contracapas",
      "Separei por papel para ficar mais fácil localizar o preço certo.",
      OPTIONS.coverPapers
        .map((paper) =>
          createInlineConfigBlockMarkup(
            paper,
            createTableMarkup(
              ["Qtd mínima", "Valor", "Faixa"],
              config.coverPricing[paper],
              `cover-${paper}`,
              [
                { key: "min", type: "number", step: "1" },
                { key: "value", type: "number", step: "0.01" },
                { key: "label", type: "text" },
              ]
            )
          )
        )
        .join("")
    ),
    createConfigCardMarkup(
      "Encadernação e livreto",
      "Ajuste aqui os valores de acabamento usados na apostila.",
      [
        createInlineConfigBlockMarkup(
          "Encadernação espiral",
          createSpiralTableMarkup(config.spiralPricing, "spiral"),
          "Valores por unidade de apostila, conforme faixa de folhas e quantidade de exemplares."
        ),
        createInlineConfigBlockMarkup(
          "Encadernação wire-o",
          `${createAddConfigButtonMarkup("Adicionar faixa de folhas", "binding", "wireo")}${createSpiralTableMarkup(config.wireOPricing, "wireo")}`,
          "Usa a mesma lógica da espiral: faixa por quantidade de folhas e desconto por volume."
        ),
        createInlineConfigBlockMarkup(
          "Livreto",
          createTableMarkup(
            ["Qtd mínima", "Valor", "Faixa"],
            config.bookletPricing,
            "booklet",
            [
              { key: "min", type: "number", step: "1" },
              { key: "value", type: "number", step: "0.01" },
              { key: "label", type: "text" },
            ]
          )
        ),
        createInlineConfigBlockMarkup(
          "Capa dura",
          `${createAddConfigButtonMarkup("Adicionar faixa", "apostila", "hard-cover")}${createTableMarkup(
            ["Qtd mínima", "Valor", "Faixa"],
            config.hardCoverPricing,
            "hard-cover",
            [
              { key: "min", type: "number", step: "1" },
              { key: "value", type: "number", step: "0.01" },
              { key: "label", type: "text" },
            ]
          )}`,
          "Preço por apostila. Use as faixas para aplicar desconto por quantidade."
        ),
        createInlineConfigBlockMarkup(
          "Capa mole laminada",
          `${createAddConfigButtonMarkup("Adicionar faixa", "apostila", "soft-cover-laminated")}${createTableMarkup(
            ["Qtd mínima", "Valor", "Faixa"],
            config.laminatedSoftCoverPricing,
            "soft-cover-laminated",
            [
              { key: "min", type: "number", step: "1" },
              { key: "value", type: "number", step: "0.01" },
              { key: "label", type: "text" },
            ]
          )}`,
          "Preço por apostila. Use as faixas para aplicar desconto por quantidade."
        ),
      ].join("")
    ),
    createCatalogTabCardMarkup("calculo", "Produtos extras desta aba", config.catalogSections, config, viewMode),
  ];

  const impressosCards = [
    createConfigCardMarkup(
      "Preços por papel",
      "Esses valores são usados na aba de impressos coloridos.",
      [
        createInlineConfigBlockMarkup(
          "Sulfite 75g",
          createTableMarkup(
            ["Qtd mínima", "Valor", "Faixa"],
            config.colorPrintPricing["Sulfite 75g"],
            "color-Sulfite 75g",
            [
              { key: "min", type: "number", step: "1" },
              { key: "value", type: "number", step: "0.01" },
              { key: "label", type: "text" },
            ]
          )
        ),
        createInlineConfigBlockMarkup(
          "Offset 120g",
          createTableMarkup(
            ["Qtd mínima", "Valor", "Faixa"],
            config.colorPrintPricing["Offset 120g"],
            "color-Offset 120g",
            [
              { key: "min", type: "number", step: "1" },
              { key: "value", type: "number", step: "0.01" },
              { key: "label", type: "text" },
            ]
          )
        ),
        createInlineConfigBlockMarkup(
          "Couche 170 / Offset 170 / Reciclato 170",
          createTableMarkup(
            ["Qtd mínima", "Valor", "Faixa"],
            config.colorPrintPricing["170g"],
            "color-170g",
            [
              { key: "min", type: "number", step: "1" },
              { key: "value", type: "number", step: "0.01" },
              { key: "label", type: "text" },
            ]
          )
        ),
        createInlineConfigBlockMarkup(
          "Couche 250 / Offset 240 / Reciclato 240",
          createTableMarkup(
            ["Qtd mínima", "Valor", "Faixa"],
            config.colorPrintPricing["250g"],
            "color-250g",
            [
              { key: "min", type: "number", step: "1" },
              { key: "value", type: "number", step: "0.01" },
              { key: "label", type: "text" },
            ]
          )
        ),
        createInlineConfigBlockMarkup(
          "Couche 300 / Metalizados",
          createTableMarkup(
            ["Qtd mínima", "Valor", "Faixa"],
            config.colorPrintPricing["300g"],
            "color-300g",
            [
              { key: "min", type: "number", step: "1" },
              { key: "value", type: "number", step: "0.01" },
              { key: "label", type: "text" },
            ]
          )
        ),
      ].join("")
    ),
    createConfigCardMarkup(
      "Tabela de cortes",
      "Até 5 folhas usa valor fixo por faixa. Acima de 5 folhas usa valor por corte.",
      createColorCutTableMarkup(config.cutPricing)
    ),
    createConfigCardMarkup(
      "Complementos combináveis",
      "Esses serviços podem ser somados ao mesmo item de impresso por meio do menu flutuante da aba de impressos coloridos.",
      createCombinationServicesMarkup(config.combinationServices)
    ),
    createCatalogTabCardMarkup("impressos", "Produtos extras desta aba", config.catalogSections, config, viewMode),
  ];

  const m2Cards = [
    createConfigCardMarkup(
      "Faixas de preço do m²",
      "Cada produto abaixo usa suas próprias faixas na aba de cálculo de m².",
      createM2PricingMarkup(config.m2Pricing)
    ),
    createConfigCardMarkup(
      "Sangra dos adesivos com corte especial",
      "Configure a margem técnica usada apenas no cálculo interno dos adesivos com corte especial.",
      createM2BleedSettingsMarkup(config)
    ),
    createConfigCardMarkup(
      "Acabamentos do m²",
      "Configure aqui os opcionais que aparecem no menu flutuante da aba de m².",
      createM2FinishesMarkup(config.m2Finishes)
    ),
    createCatalogTabCardMarkup("m2", "Produtos extras desta aba", config.catalogSections, config, viewMode),
  ];

  const credentialCards = [
    createConfigCardMarkup(
      "Materiais da credencial",
      "Papéis usam a mesma base de impressos coloridos. PS usa as faixas por m² já configuradas.",
      createCredentialMaterialPricingMarkup(config)
    ),
    createConfigCardMarkup(
      "Laminação",
      "Ajuste o valor da laminação aplicada nas credenciais.",
      createCredentialLaminationConfigMarkup(config.m2Finishes)
    ),
    createConfigCardMarkup(
      "Cordões",
      "Configure o cordão disponível na aba Credenciais e os cordões usados em materiais prontos.",
      createCredentialLanyardPricingMarkup(config.credentialLanyardPricing)
    ),
  ];

  const readyCards = [
    createCatalogTabCardMarkup("prontos", "Produtos desta aba", config.catalogSections, config, viewMode),
  ];

  const resinCards = [
    createConfigCardMarkup(
      "Regras gerais",
      "Ajuste o mínimo e o acréscimo aplicado aos adesivos resinados.",
      createResinSettingsMarkup(config.resinPricing)
    ),
    createConfigCardMarkup(
      "Valores por folha A3",
      "A aba Resinados calcula quantas folhas A3 serão necessárias e aplica a faixa correspondente.",
      createResinPricingMarkup(config.resinPricing)
    ),
  ];

  const cardCards = [
    createConfigCardMarkup(
      "Tabela de preços dos cartões",
      "Configure impressão, papel/acabamento, lado, quantidade e valor final de cada opção.",
      createCardsPricingConfigMarkup(config.cardPricing)
    ),
    createConfigCardMarkup(
      "Acabamentos dos cartões",
      "Configure furos, cantos arredondados e os valores usados no cálculo automático.",
      createCardsFinishesConfigMarkup(config.cardFinishes)
    ),
  ];

  const flyerCards = [
    createConfigCardMarkup(
      "Tabela de preços de panfletos e folders",
      "Configure impressão, papel, tamanho, cores, quantidade e valor final de cada opção.",
      createFlyersPricingConfigMarkup(config.flyerPricing)
    ),
    createConfigCardMarkup(
      "Acabamentos de panfletos e folders",
      "Configure dobras e outros acabamentos cobrados por mínimo, cento ou milheiro.",
      createFlyersFinishesConfigMarkup(config.flyerFinishes)
    ),
  ];

  const safeSection = CONFIG_SECTIONS.includes(activeSection) ? activeSection : "calculo";
  const configGroups = {
    calculo: createConfigGroupMarkup(
      "calculo",
      "Aba: Cálculo de apostila",
      "Tudo o que aparece aqui afeta somente a aba de apostilas.",
      apostilaCards
    ),
    impressos: createConfigGroupMarkup(
      "impressos",
      "Aba: Impressos coloridos",
      "Use este bloco para ajustar preços, cortes e produtos extras dos impressos coloridos.",
      impressosCards
    ),
    credenciais: createConfigGroupMarkup(
      "credenciais",
      "Aba: Credenciais",
      "Aqui ficam os materiais, laminação e cordões usados no cálculo de credenciais.",
      credentialCards
    ),
    m2: createConfigGroupMarkup(
      "m2",
      "Aba: Cálculo de m²",
      "Aqui ficam as faixas de preço, acabamentos e produtos extras do cálculo por área.",
      m2Cards
    ),
    prontos: createConfigGroupMarkup(
      "prontos",
      "Aba: Materiais prontos",
      "Aqui ficam brindes, carimbos, cartões, panfletos, ímãs e outros materiais rápidos com tabela pronta.",
      readyCards
    ),
    resinados: createConfigGroupMarkup(
      "resinados",
      "Aba: Resinados",
      "Aqui ficam o valor mínimo, o acréscimo e as faixas por folha A3 usadas na calculadora de adesivos resinados.",
      resinCards
    ),
    cartoes: createConfigGroupMarkup(
      "cartoes",
      "Aba: Cartões de visita",
      "Aqui ficam as opções de impressão laser e offset, papéis, quantidades e acabamentos dos cartões.",
      cardCards
    ),
    panfletos: createConfigGroupMarkup(
      "panfletos",
      "Aba: Panfletos e folders",
      "Aqui ficam as tabelas de impressão laser e offset, papéis, tamanhos, cores e quantidades.",
      flyerCards
    ),
  };

  return [
    `
      <article class="config-overview config-overview-hero">
        <div class="config-hero-copy">
          <span class="config-kicker">Central inteligente de preços</span>
          <h3>Organize tudo com visual mais simples e pronto para venda</h3>
          <p class="helper-text">Primeiro escolha a aba que deseja editar. Depois ajuste preços, acabamentos ou produtos extras somente daquele bloco.</p>
          <div class="config-tip-grid">
            <article class="config-tip-card">
              <span class="config-tip-icon">P</span>
              <div>
                <strong>Preços</strong>
                <p>Atualize faixas e valores sem procurar em várias telas.</p>
              </div>
            </article>
            <article class="config-tip-card">
              <span class="config-tip-icon">A</span>
              <div>
                <strong>Acabamentos</strong>
                <p>Deixe ilhós, laminação e demais extras prontos para uso.</p>
              </div>
            </article>
            <article class="config-tip-card">
              <span class="config-tip-icon">D</span>
              <div>
                <strong>Dicas</strong>
                <p>Use o modo iniciante para o essencial e o avançado para os detalhes técnicos.</p>
              </div>
            </article>
          </div>
        </div>
        <div class="config-overview-toolbar">
          <div class="config-view-switch" role="group" aria-label="Modo da configuração">
            <button class="button button-small${viewMode === "basic" ? " is-active" : ""}" type="button" data-config-view-mode="basic">Modo iniciante</button>
            <button class="button button-small${viewMode === "advanced" ? " is-active" : ""}" type="button" data-config-view-mode="advanced">Modo avançado</button>
          </div>
          ${createConfigSectionTabsMarkup(safeSection)}
        </div>
      </article>
    `,
    configGroups[safeSection],
  ].join("");
}

function createConfigLockedMarkup() {
  return `
    <article class="config-lock-card">
      <span class="config-lock-badge">Área protegida</span>
      <h3>Configuração bloqueada</h3>
      <p>
        Digite a senha para liberar preços, cortes, acabamentos e produtos extras nesta sessão.
      </p>
      <form id="config-lock-form" class="config-lock-form">
        <label>
          <span>Senha de acesso</span>
          <input
            id="config-password-input"
            type="password"
            autocomplete="current-password"
            placeholder="Digite a senha"
          >
        </label>
        <div class="toolbar">
          <button class="button button-primary" type="submit">Desbloquear configuração</button>
        </div>
      </form>
      <p class="helper-text">
        Essa trava ajuda a evitar alterações sem permissão nos computadores da equipe.
      </p>
    </article>
  `;
}

function createConfigErrorMarkup(message = "") {
  const detail = message ? `<p class="helper-text">${escapeHtml(message)}</p>` : "";
  return `
    <article class="config-lock-card">
      <span class="config-lock-badge">Atenção</span>
      <h3>Não foi possível montar esta área da configuração</h3>
      <p>
        O restante do app continua disponível. Recarregue a página e confira os dados salvos desta configuração.
      </p>
      ${detail}
    </article>
  `;
}

function createConfigCardMarkup(title, copy, innerMarkup) {
  return `
    <article class="config-card">
      <div class="config-card-meta">
        <span class="config-card-tag">Configuração</span>
        <span class="config-card-tag subtle">Base compartilhada</span>
      </div>
      <h3>${escapeHtml(title)}</h3>
      ${copy ? `<p class="helper-text">${escapeHtml(copy)}</p>` : ""}
      ${innerMarkup}
    </article>
  `;
}

function createConfigDeleteButtonMarkup(type, payload, disabled = false) {
  const attributes = Object.entries(payload)
    .map(([key, value]) => `data-${key}="${escapeHtml(String(value))}"`)
    .join(" ");
  return `
    <button class="button button-small button-danger config-delete-button" type="button" title="Excluir este item" data-config-delete="${escapeHtml(type)}"${disabled ? " disabled" : ""} ${attributes}>
      Excluir
    </button>
  `;
}

function createAddConfigButtonMarkup(label, group, target) {
  return `
    <div class="config-toolbar-inline">
      <button class="button button-small" type="button" data-add-${escapeHtml(group)}-pricing="${escapeHtml(target)}">${escapeHtml(label)}</button>
    </div>
  `;
}

function createInlineConfigBlockMarkup(title, innerMarkup, copy = "") {
  return `
    <section class="config-subblock">
      <h4>${escapeHtml(title)}</h4>
      ${copy ? `<p class="helper-text">${escapeHtml(copy)}</p>` : ""}
      ${innerMarkup}
    </section>
  `;
}

function createConfigGroupMarkup(id, title, copy, cards) {
  return `
    <section class="config-group" id="config-group-${escapeHtml(id)}">
      <div class="config-group-heading">
        <span class="config-group-kicker">Área de configuração</span>
        <h3>${escapeHtml(title)}</h3>
        <p class="helper-text">${escapeHtml(copy)}</p>
      </div>
      <div class="config-card-grid">
        ${cards.join("")}
      </div>
    </section>
  `;
}

function createTableMarkup(headers, rows, prefix, fields) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const head = [...headers, "Ações"].map((header) => `<th>${escapeHtml(header)}</th>`).join("");
  const body = safeRows
    .map((row, rowIndex) => {
      const cells = fields
        .map((field) => {
          const value = row[field.key] ?? "";
          return `
            <td>
              <input
                data-config-prefix="${escapeHtml(prefix)}"
                data-config-row="${rowIndex}"
                data-config-key="${escapeHtml(field.key)}"
                type="${field.type}"
                step="${field.step || "any"}"
                value="${escapeHtml(value)}"
              >
            </td>
          `;
        })
        .join("");
      const deleteButton = createConfigDeleteButtonMarkup(
        "config-row",
        {
          "config-prefix": prefix,
          "config-row": rowIndex,
        },
        safeRows.length <= 1
      );
      return `<tr>${cells}<td class="config-action-cell">${deleteButton}</td></tr>`;
    })
    .join("");

  return `
    <div class="table-shell">
      <table class="config-table">
        <thead><tr>${head}</tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  `;
}

function createSpiralTableMarkup(rows, prefix = "spiral") {
  const safeRows = Array.isArray(rows) ? rows : [];
  const body = safeRows
    .map(
      (row, rowIndex) => {
        const deleteButton = createConfigDeleteButtonMarkup(
          "config-row",
          {
            "config-prefix": prefix,
            "config-row": rowIndex,
          },
          safeRows.length <= 1
        );
        return `
        <tr>
          <td><input data-config-prefix="${escapeHtml(prefix)}" data-config-row="${rowIndex}" data-config-key="maxSheets" type="number" step="1" value="${escapeHtml(row.maxSheets)}"></td>
          <td><input data-config-prefix="${escapeHtml(prefix)}" data-config-row="${rowIndex}" data-config-key="rate-1" type="number" step="0.01" value="${escapeHtml(row.rates?.["1"])}"></td>
          <td><input data-config-prefix="${escapeHtml(prefix)}" data-config-row="${rowIndex}" data-config-key="rate-21" type="number" step="0.01" value="${escapeHtml(row.rates?.["21"])}"></td>
          <td><input data-config-prefix="${escapeHtml(prefix)}" data-config-row="${rowIndex}" data-config-key="rate-51" type="number" step="0.01" value="${escapeHtml(row.rates?.["51"])}"></td>
          <td><input data-config-prefix="${escapeHtml(prefix)}" data-config-row="${rowIndex}" data-config-key="rate-101" type="number" step="0.01" value="${escapeHtml(row.rates?.["101"])}"></td>
          <td>${deleteButton}</td>
        </tr>
      `;
      }
    )
    .join("");

  return `
    <div class="table-shell">
      <table class="config-table">
        <thead>
          <tr>
            <th>Folhas até</th>
            <th>1</th>
            <th>21</th>
            <th>51</th>
            <th>101</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  `;
}

function createColorCutTableMarkup(cutPricing) {
  const body = (cutPricing.upToFiveSheets || [])
    .map(
      (row, rowIndex) => `
        <tr>
          <td><input data-config-prefix="cut-up5" data-config-row="${rowIndex}" data-config-key="minUp" type="number" step="1" value="${escapeHtml(row.minUp)}"></td>
          <td><input data-config-prefix="cut-up5" data-config-row="${rowIndex}" data-config-key="value" type="number" step="0.01" value="${escapeHtml(row.value)}"></td>
          <td><input data-config-prefix="cut-up5" data-config-row="${rowIndex}" data-config-key="label" type="text" value="${escapeHtml(row.label)}"></td>
        </tr>
      `
    )
    .join("");

  return `
    <div class="table-shell">
      <table class="config-table">
        <thead>
          <tr>
            <th>Mínimo por folha</th>
            <th>Valor</th>
            <th>Faixa</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>
    <div class="config-grid">
      <label>
        <span>Acima de 5 folhas | valor por corte</span>
        <input data-config-prefix="cut-above5" data-config-row="0" data-config-key="aboveFiveSheetsPerCut" type="number" step="0.01" value="${escapeHtml(cutPricing.aboveFiveSheetsPerCut)}">
      </label>
    </div>
  `;
}

function createM2PricingMarkup(m2Pricing) {
  const rows = M2_CATALOG.map((product) => {
    const bands = m2Pricing?.[product.configKey] || [];
    return `
      <section class="m2-config-block">
        <div class="m2-config-heading">
          <h4>${escapeHtml(product.label)}</h4>
          <button class="button button-small" type="button" data-add-m2-pricing="${escapeHtml(product.configKey)}">Adicionar faixa</button>
        </div>
        ${createTableMarkup(
          ["Limite da faixa", "Valor", "Faixa"],
          bands,
          `m2-${product.configKey}`,
          [
            { key: "min", type: "number", step: "0.01" },
            { key: "value", type: "number", step: "0.01" },
            { key: "label", type: "text" },
          ]
        )}
      </section>
    `;
  }).join("");

  return `<div class="m2-config-list">${rows}</div>`;
}

function createM2FinishesMarkup(m2Finishes) {
  const rows = (m2Finishes || [])
    .map(
      (finish, rowIndex) => `
        <tr>
          <td><input data-config-prefix="m2-finish" data-config-row="${rowIndex}" data-config-key="label" type="text" value="${escapeHtml(finish.label || "")}"></td>
          <td>
            <select data-config-prefix="m2-finish" data-config-row="${rowIndex}" data-config-key="type">
              <option value="eyelet"${finish.type === "eyelet" ? " selected" : ""}>Ilhós por unidade</option>
              <option value="perimeter"${finish.type === "perimeter" ? " selected" : ""}>Perímetro</option>
              <option value="area"${finish.type === "area" ? " selected" : ""}>Área em m²</option>
            </select>
          </td>
          <td><input data-config-prefix="m2-finish" data-config-row="${rowIndex}" data-config-key="price" type="number" step="0.01" value="${escapeHtml(finish.price)}"></td>
          <td><input data-config-prefix="m2-finish" data-config-row="${rowIndex}" data-config-key="spacingCm" type="number" step="1" value="${escapeHtml(finish.spacingCm ?? "")}"></td>
          <td class="config-action-cell">
            ${createConfigDeleteButtonMarkup(
              "m2-finish",
              { "finish-row": rowIndex },
              (m2Finishes || []).length <= 1
            )}
          </td>
        </tr>
      `
    )
    .join("");

  return `
    <div class="config-grid">
      <button class="button button-primary" type="button" data-add-m2-finish="1">Adicionar acabamento</button>
    </div>
    <p class="helper-text">Use "Ilhós por unidade" para acabamentos baseados na quantidade de ilhós. Nos demais, o espaçamento pode ficar vazio.</p>
    <div class="table-shell">
      <table class="config-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Como calcula</th>
            <th>Valor</th>
            <th>Espaçamento padrão (cm)</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function createM2BleedSettingsMarkup(config) {
  const products = [
    { id: "digital-cut", label: "Adesivo impressão digital com corte especial" },
    { id: "uv-cut", label: "Adesivo impressão UV com corte especial" },
    { id: "uv-verniz", label: "Adesivo impressão UV com verniz ou tinta branca" },
  ];

  return `
    <div class="config-grid">
      ${products.map((product) => `
        <label>
          <span>${escapeHtml(product.label)}</span>
          <input
            data-m2-bleed-product-id="${escapeHtml(product.id)}"
            type="number"
            min="0"
            step="0.1"
            value="${escapeHtml(config.m2BleedByProduct?.[product.id] ?? DEFAULT_M2_BLEED_BY_PRODUCT[product.id] ?? 0)}"
          >
        </label>
      `).join("")}
    </div>
    <p class="helper-text">Valor em milímetros somado à largura e à altura apenas para cálculo interno. No orçamento do cliente aparece a medida original.</p>
  `;
}

function createResinSettingsMarkup(resinPricing = {}) {
  return `
    <div class="config-grid">
      <label>
        <span>Valor mínimo do pedido</span>
        <input data-resin-config-key="minimumOrderPrice" type="number" min="0" step="0.01" value="${escapeHtml(resinPricing.minimumOrderPrice ?? 35)}">
      </label>
      <label>
        <span>Acréscimo percentual (%)</span>
        <input data-resin-config-key="markupPercent" type="number" min="0" step="0.01" value="${escapeHtml(resinPricing.markupPercent ?? 0)}">
      </label>
      <label>
        <span>Espaço técnico entre adesivos (mm)</span>
        <input data-resin-config-key="spacingMm" type="number" min="0" step="0.1" value="${escapeHtml(resinPricing.spacingMm ?? RESIN_MARGIN_MM)}">
      </label>
    </div>
    <p class="helper-text">O espaço técnico é somado à largura e à altura apenas para calcular o aproveitamento na folha A3. No orçamento do cliente aparece a medida original.</p>
  `;
}

function createResinPricingMarkup(resinPricing = {}) {
  const standardRows = Array.isArray(resinPricing.standard) ? resinPricing.standard : [];
  const specialRows = Array.isArray(resinPricing.special) ? resinPricing.special : [];

  return `
    ${createInlineConfigBlockMarkup(
      "Adesivo branco / transparente",
      `
        <div class="toolbar">
          <button class="button button-small" type="button" data-add-resin-pricing="standard">Adicionar faixa</button>
        </div>
        ${createTableMarkup(
          ["Folhas A3 mín.", "Valor por folha", "Faixa"],
          standardRows,
          "resin-standard",
          [
            { key: "min", type: "number", step: "1" },
            { key: "value", type: "number", step: "0.01" },
            { key: "label", type: "text" },
          ]
        )}
      `,
      "Tabela padrão usada para adesivo branco e transparente."
    )}
    ${createInlineConfigBlockMarkup(
      "Adesivo holográfico",
      `
        <div class="toolbar">
          <button class="button button-small" type="button" data-add-resin-pricing="special">Adicionar faixa</button>
        </div>
        ${createTableMarkup(
          ["Folhas A3 mín.", "Valor por folha", "Faixa"],
          specialRows,
          "resin-special",
          [
            { key: "min", type: "number", step: "1" },
            { key: "value", type: "number", step: "0.01" },
            { key: "label", type: "text" },
          ]
        )}
      `,
      "Tabela especial usada para holográfico dourado e prateado."
    )}
  `;
}

function createCredentialLanyardPricingMarkup(credentialLanyardPricing = {}) {
  const pricing = credentialLanyardPricing || {};
  return [
    createInlineConfigBlockMarkup(
      "Cordão usado na credencial",
      `
        <div class="config-grid compact-grid">
          <label>
            <span>Cordão roliço branco 2mm (R$ / un)</span>
            <input data-config-prefix="credential-lanyard-fixed" data-config-row="0" data-config-key="roundWhite2mm" type="number" min="0" step="0.01" value="${escapeHtml(pricing.roundWhite2mm ?? 0.75)}">
          </label>
        </div>
      `,
      "Este é o cordão selecionável dentro da aba Credenciais."
    ),
    createInlineConfigBlockMarkup(
      "Cordões para materiais prontos",
      `
        <div class="config-grid compact-grid">
          <label>
            <span>Cordão de crachá liso (R$ / un)</span>
            <input data-config-prefix="credential-lanyard-fixed" data-config-row="0" data-config-key="plainBadge" type="number" min="0" step="0.01" value="${escapeHtml(pricing.plainBadge ?? 2.75)}">
          </label>
        </div>
        <div class="preset-card-head">
          <div>
            <strong>Cordão estampado 20mm</strong>
            <span class="helper-text">A mesma tabela vale para jacaré e mosquetão.</span>
          </div>
          <div class="toolbar">
            <button class="button button-small" type="button" data-add-credential-lanyard-band>Adicionar faixa</button>
          </div>
        </div>
        ${createTableMarkup(
          ["Qtd mínima", "Valor", "Faixa"],
          pricing.printed || [],
          "credential-lanyard-printed",
          [
            { key: "min", type: "number", step: "1" },
            { key: "value", type: "number", step: "0.01" },
            { key: "label", type: "text" },
          ]
        )}
      `,
      "Esses valores continuam abastecendo produtos prontos que usam cordão."
    ),
  ].join("");
}

function createCredentialMaterialPricingMarkup(config) {
  return [
    createInlineConfigBlockMarkup(
      "Couche 250g / Offset 240g",
      createTableMarkup(
        ["Qtd mínima", "Valor", "Faixa"],
        config.colorPrintPricing["250g"],
        "color-250g",
        [
          { key: "min", type: "number", step: "1" },
          { key: "value", type: "number", step: "0.01" },
          { key: "label", type: "text" },
        ]
      ),
      "Usado quando o material base da credencial for Couche 250g ou Offset 240g."
    ),
    createInlineConfigBlockMarkup(
      "Couche 300g",
      createTableMarkup(
        ["Qtd mínima", "Valor", "Faixa"],
        config.colorPrintPricing["300g"],
        "color-300g",
        [
          { key: "min", type: "number", step: "1" },
          { key: "value", type: "number", step: "0.01" },
          { key: "label", type: "text" },
        ]
      ),
      "Usado quando o material base da credencial for Couche 300g."
    ),
    createInlineConfigBlockMarkup(
      "PS 1mm",
      createTableMarkup(
        ["Limite da faixa", "Valor", "Faixa"],
        config.m2Pricing.ps1mm,
        "m2-ps1mm",
        [
          { key: "min", type: "number", step: "0.01" },
          { key: "value", type: "number", step: "0.01" },
          { key: "label", type: "text" },
        ]
      ),
      "Usado quando a credencial for calculada em PS 1mm por m²."
    ),
    createInlineConfigBlockMarkup(
      "PS 2mm",
      createTableMarkup(
        ["Limite da faixa", "Valor", "Faixa"],
        config.m2Pricing.ps2mm,
        "m2-ps2mm",
        [
          { key: "min", type: "number", step: "0.01" },
          { key: "value", type: "number", step: "0.01" },
          { key: "label", type: "text" },
        ]
      ),
      "Usado quando a credencial for calculada em PS 2mm por m²."
    ),
  ].join("");
}

function createCredentialLaminationConfigMarkup(m2Finishes) {
  const finishes = Array.isArray(m2Finishes) ? m2Finishes : [];
  const laminationIndex = finishes.findIndex((finish) =>
    String(finish?.id || "").toLowerCase() === "laminacao"
    || normalizeLookupText(finish?.label) === "laminacao"
  );

  if (laminationIndex === -1) {
    return `<p class="helper-text">A laminação não foi localizada na base atual de acabamentos do m².</p>`;
  }

  const lamination = finishes[laminationIndex];
  return createInlineConfigBlockMarkup(
    "Laminação",
    `
      <div class="config-grid compact-grid">
        <label>
          <span>Valor da laminação (R$ por m²)</span>
          <input data-config-prefix="m2-finish" data-config-row="${laminationIndex}" data-config-key="price" type="number" min="0" step="0.01" value="${escapeHtml(lamination.price)}">
        </label>
      </div>
    `,
    "Usado quando a linha de credencial estiver marcada com laminação."
  );
}

function createM2FinishPickerMarkup(row, config) {
  const selectedIds = Array.isArray(row.finishIds) ? row.finishIds : [];
  const finishes = Array.isArray(config.m2Finishes) ? config.m2Finishes : [];
  const selectedLabels = selectedIds
    .map((finishId) => finishes.find((finish) => finish.id === finishId)?.label)
    .filter(Boolean);
  const buttonLabel = selectedLabels.length
    ? `Acabamentos (${selectedLabels.length})`
    : "Sem acabamento";

  return `
    <div class="finish-picker">
      <button class="button finish-picker-button" type="button" data-finish-picker-toggle data-finish-row-id="${escapeHtml(row.id)}">
        <span>${escapeHtml(buttonLabel)}</span>
        <span class="finish-picker-chevron">▾</span>
      </button>
    </div>
  `;
}

function createCatalogTabCardMarkup(tab, title, sections, config, viewMode = "basic") {
  const products = Array.isArray(sections) ? sections.filter((item) => item?.tab === tab) : [];
  const isAdvanced = viewMode === "advanced";
  return `
    <article class="config-card nested-card">
      <div class="m2-config-heading">
        <h3>${escapeHtml(title)}</h3>
        <button class="button button-small" type="button" data-add-catalog-product="${escapeHtml(tab)}">Adicionar produto</button>
      </div>
      <p class="helper-text">Crie novos produtos para aparecer nesta aba do orçamento.</p>
      ${products.length ? `
        <div class="nested-list">
          ${products.map((product, productIndex) => `
            <div class="nested-row${isAdvanced ? " is-advanced" : ""}">
              <label>
                <span>Nome do produto</span>
                <input data-catalog-product-key="label" data-catalog-product-tab="${escapeHtml(tab)}" data-catalog-product-index="${productIndex}" type="text" value="${escapeHtml(product.label || "")}" placeholder="Ex.: Lona 440g">
              </label>
              <label${isAdvanced ? "" : ' class="is-hidden-basic"'}>
                <span>Código interno</span>
                <input data-catalog-product-key="id" data-catalog-product-tab="${escapeHtml(tab)}" data-catalog-product-index="${productIndex}" type="text" value="${escapeHtml(product.id || "")}" placeholder="Ex.: lona-440g">
              </label>
              <label${isAdvanced ? "" : ' class="is-hidden-basic"'}>
                <span>Observação opcional</span>
                <input data-catalog-product-key="note" data-catalog-product-tab="${escapeHtml(tab)}" data-catalog-product-index="${productIndex}" type="text" value="${escapeHtml(product.note || "")}" placeholder="Texto auxiliar">
              </label>
              <div class="config-row-toolbar">
                ${createConfigDeleteButtonMarkup(
                  "catalog-product",
                  {
                    "catalog-tab": tab,
                    "catalog-index": productIndex,
                  }
                )}
              </div>
            </div>
            ${tab === "m2" ? createM2ProductPricingMarkup(product, productIndex, config, viewMode) : ""}
            ${tab === "impressos" ? createColorProductPresetMarkup(product, productIndex, config, viewMode) : ""}
            ${tab === "prontos" ? createReadyProductPresetMarkup(product, productIndex, config, viewMode) : ""}
          `).join("")}
        </div>
      ` : `<div class="empty-state"><strong>Nenhum produto extra cadastrado</strong><span>Use o botão "Adicionar produto" para montar esta aba do jeito da sua gráfica.</span></div>`}
    </article>
  `;
}

function createColorProductPresetMarkup(product, productIndex, config, viewMode = "basic") {
  const isAdvanced = viewMode === "advanced";
  const pricingRows = config.colorProductPricing?.[product.customPricingKey] || [];
  return `
    <div class="m2-product-pricing">
      <div class="config-field-grid${isAdvanced ? " is-advanced" : ""}">
        <label>
          <span>Largura (cm)</span>
          <input data-catalog-product-key="widthCm" data-catalog-product-tab="impressos" data-catalog-product-index="${productIndex}" type="number" min="0" step="0.1" value="${escapeHtml(product.widthCm ?? 21)}">
        </label>
        <label>
          <span>Altura (cm)</span>
          <input data-catalog-product-key="heightCm" data-catalog-product-tab="impressos" data-catalog-product-index="${productIndex}" type="number" min="0" step="0.1" value="${escapeHtml(product.heightCm ?? 29.7)}">
        </label>
        <label>
          <span>Papel</span>
          <select data-catalog-product-key="paperType" data-catalog-product-tab="impressos" data-catalog-product-index="${productIndex}">
            ${buildOptions(OPTIONS.colorPaperTypes, product.paperType || "Sulfite 75g")}
          </select>
        </label>
        <label${isAdvanced ? "" : ' class="is-hidden-basic"'}>
          <span>Modo de impressão</span>
          <select data-catalog-product-key="printMode" data-catalog-product-tab="impressos" data-catalog-product-index="${productIndex}">
            ${buildOptions(OPTIONS.printModes, product.printMode || "Só frente")}
          </select>
        </label>
      </div>
      <div class="toolbar">
        <button class="button button-small" type="button" data-add-color-product-band="${escapeHtml(product.customPricingKey)}">Adicionar faixa de preço</button>
      </div>
      ${createTableMarkup(
        ["Qtd mínima", "Valor", "Faixa"],
        pricingRows,
        `color-product-${product.customPricingKey}`,
        [
          { key: "min", type: "number", step: "1" },
          { key: "value", type: "number", step: "0.01" },
          { key: "label", type: "text" },
        ]
      )}
    </div>
  `;
}

function createReadyProductPresetMarkup(product, productIndex, config, viewMode = "basic") {
  const isAdvanced = viewMode === "advanced";
  const pricingRows = config.readyProductPricing?.[product.readyPricingKey] || [];

  if (product.readyPricingMode === "manual") {
    return `
      <div class="m2-product-pricing">
        <p class="helper-text">Este produto usa preço manual na linha do orçamento. Ideal para cartões, panfletos e outros materiais que ainda vão ganhar cálculo fino.</p>
      </div>
    `;
  }

  const headers = product.readyPricingMode === "variant-fixed"
    ? ["Qtd. ref.", "Valor", "Cobrança", "Opção"]
    : ["Qtd mínima", "Valor", "Cobrança", "Faixa"];
  const fields = product.readyPricingMode === "variant-fixed"
    ? [
        { key: "quantity", type: "number", step: "1" },
        { key: "value", type: "number", step: "0.01" },
        { key: "mode", type: "text" },
        { key: "label", type: "text" },
      ]
    : [
        { key: "min", type: "number", step: "1" },
        { key: "value", type: "number", step: "0.01" },
        { key: "mode", type: "text" },
        { key: "label", type: "text" },
      ];

  return `
    <div class="m2-product-pricing">
      <div class="config-field-grid${isAdvanced ? " is-advanced" : ""}">
        <label${isAdvanced ? "" : ' class="is-hidden-basic"'}>
          <span>Modo do produto</span>
          <input data-catalog-product-key="readyPricingMode" data-catalog-product-tab="prontos" data-catalog-product-index="${productIndex}" type="text" value="${escapeHtml(product.readyPricingMode || "manual")}">
        </label>
        <label${isAdvanced ? "" : ' class="is-hidden-basic"'}>
          <span>Tipo de variante</span>
          <input data-catalog-product-key="readyVariantMode" data-catalog-product-tab="prontos" data-catalog-product-index="${productIndex}" type="text" value="${escapeHtml(product.readyVariantMode || "")}">
        </label>
      </div>
      <div class="toolbar">
        <button class="button button-small" type="button" data-add-ready-pricing="${escapeHtml(product.readyPricingKey)}" data-add-ready-mode="${escapeHtml(product.readyPricingMode)}">Adicionar faixa/opção</button>
      </div>
      ${createTableMarkup(headers, pricingRows, `ready-${product.readyPricingKey}`, fields)}
    </div>
  `;
}

function createCombinationServicesMarkup(services) {
  const rows = Array.isArray(services) ? services : [];
  if (!rows.length) {
    return `<div class="empty-state"><strong>Nenhum complemento cadastrado</strong><span>Importe plastificação, criação e outros extras para somar no mesmo item.</span></div>`;
  }

  return `
    <div class="nested-list">
      ${rows
        .map(
          (service, index) => `
            <div class="nested-row service-row">
              <label>
                <span>Nome do complemento</span>
                <input data-service-key="label" data-service-index="${index}" type="text" value="${escapeHtml(service.label || "")}">
              </label>
              <label>
                <span>Preço base</span>
                <input data-service-key="defaultPrice" data-service-index="${index}" type="number" min="0" step="0.01" value="${escapeHtml(service.defaultPrice ?? 0)}">
              </label>
              <label>
                <span>Observação</span>
                <input data-service-key="note" data-service-index="${index}" type="text" value="${escapeHtml(service.note || "")}" placeholder="Texto auxiliar">
              </label>
              <div class="config-row-toolbar">
                ${createConfigDeleteButtonMarkup("combination-service", { "service-index": index })}
              </div>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function createM2ProductPricingMarkup(product, productIndex, config, viewMode = "basic") {
  const pricingKey = product.pricingKey || "banner";
  const bands = config.m2Pricing?.[pricingKey] || [];
  const isAdvanced = viewMode === "advanced";
  return `
    <div class="m2-product-pricing">
      <div class="config-field-grid${isAdvanced ? " is-advanced" : ""}">
        <label>
          <span>Base de preços</span>
          <select data-catalog-product-key="pricingKey" data-catalog-product-tab="m2" data-catalog-product-index="${productIndex}">
            <option value="digitalCut"${pricingKey === "digitalCut" ? " selected" : ""}>Adesivo digital</option>
            <option value="uvCut"${pricingKey === "uvCut" ? " selected" : ""}>Adesivo UV</option>
            <option value="uvVerniz"${pricingKey === "uvVerniz" ? " selected" : ""}>UV com verniz/branco</option>
            <option value="flatCut"${pricingKey === "flatCut" ? " selected" : ""}>Corte reto</option>
            <option value="banner"${pricingKey === "banner" ? " selected" : ""}>Banner</option>
            <option value="perfurado"${pricingKey === "perfurado" ? " selected" : ""}>Perfurado</option>
            <option value="ps1mm"${pricingKey === "ps1mm" ? " selected" : ""}>PS 1mm</option>
            <option value="ps2mm"${pricingKey === "ps2mm" ? " selected" : ""}>PS 2mm</option>
          </select>
        </label>
        <label${isAdvanced ? "" : ' class="is-hidden-basic"'}>
          <span>Sangra automática (mm)</span>
          <input data-catalog-product-key="bleedMm" data-catalog-product-tab="m2" data-catalog-product-index="${productIndex}" type="number" step="0.01" value="${escapeHtml(product.bleedMm ?? 0)}">
        </label>
        <div>
          <span class="helper-text">Faixas de preço</span>
          <div class="toolbar">
            <button class="button button-small" type="button" data-add-m2-band="${escapeHtml(pricingKey)}">Adicionar faixa de preço</button>
          </div>
        </div>
      </div>
      ${createTableMarkup(
        ["Limite da faixa", "Valor", "Faixa"],
        bands,
        `m2-${pricingKey}`,
        [
          { key: "min", type: "number", step: "0.01" },
          { key: "value", type: "number", step: "0.01" },
          { key: "label", type: "text" },
        ]
      )}
    </div>
  `;
}

function createCardsPricingConfigMarkup(rows) {
  return `
    <div class="toolbar">
      <button class="button button-small" type="button" data-add-card-pricing>Adicionar opção de cartão</button>
    </div>
    ${createTableMarkup(
      ["Impressão", "Papel / acabamento", "Lados", "Quantidade", "Valor"],
      normalizeCardPricing(rows, []),
      "card-pricing",
      [
        { key: "printType", type: "text" },
        { key: "paper", type: "text" },
        { key: "side", type: "text" },
        { key: "quantity", type: "number", step: "1" },
        { key: "price", type: "number", step: "0.01" },
      ]
    )}
  `;
}

function createCardsFinishesConfigMarkup(rows) {
  return `
    <div class="toolbar">
      <button class="button button-small" type="button" data-add-card-finish>Adicionar acabamento</button>
    </div>
    ${createTableMarkup(
      ["Nome", "Tipo", "Medida furo mm", "Mínimo", "Até qtd.", "Por cento", "Milheiro"],
      normalizeCardFinishes(rows, []),
      "card-finish",
      [
        { key: "label", type: "text" },
        { key: "type", type: "text" },
        { key: "holeSizeMm", type: "number", step: "0.1" },
        { key: "minimumPrice", type: "number", step: "0.01" },
        { key: "minimumUntilQuantity", type: "number", step: "1" },
        { key: "pricePerHundred", type: "number", step: "0.01" },
        { key: "thousandPrice", type: "number", step: "0.01" },
      ]
    )}
  `;
}

function createFlyersPricingConfigMarkup(rows) {
  return `
    <div class="toolbar">
      <button class="button button-small" type="button" data-add-flyer-pricing>Adicionar opção de panfleto/folder</button>
    </div>
    ${createTableMarkup(
      ["Impressão", "Papel", "Tamanho", "Cores", "Quantidade", "Valor"],
      normalizeFlyerPricing(rows, []),
      "flyer-pricing",
      [
        { key: "printType", type: "text" },
        { key: "paper", type: "text" },
        { key: "size", type: "text" },
        { key: "colorMode", type: "text" },
        { key: "quantity", type: "number", step: "1" },
        { key: "price", type: "number", step: "0.01" },
      ]
    )}
  `;
}

function createFlyersFinishesConfigMarkup(rows) {
  return `
    <div class="toolbar">
      <button class="button button-small" type="button" data-add-flyer-finish>Adicionar acabamento</button>
    </div>
    ${createTableMarkup(
      ["Nome", "Mínimo", "Até qtd.", "Por cento", "Milheiro"],
      normalizeFlyerFinishes(rows, []),
      "flyer-finish",
      [
        { key: "label", type: "text" },
        { key: "minimumPrice", type: "number", step: "0.01" },
        { key: "minimumUntilQuantity", type: "number", step: "1" },
        { key: "pricePerHundred", type: "number", step: "0.01" },
        { key: "thousandPrice", type: "number", step: "0.01" },
      ]
    )}
  `;
}

function getConfigArrayByPrefix(config, prefix) {
  if (prefix === "bw") return config.printPricing.blackWhite;
  if (prefix === "inkjet") return config.printPricing.inkjet;
  if (prefix === "laser") return config.printPricing.laser;
  if (prefix === "booklet") return config.bookletPricing;
  if (prefix === "spiral") return config.spiralPricing;
  if (prefix === "wireo") return config.wireOPricing;
  if (prefix === "hard-cover") return config.hardCoverPricing;
  if (prefix === "soft-cover-laminated") return config.laminatedSoftCoverPricing;
  if (prefix === "cut-up5") return config.cutPricing.upToFiveSheets;
  if (prefix === "cut-above5") return config.cutPricing;
  if (prefix === "resin-standard") return config.resinPricing.standard;
  if (prefix === "resin-special") return config.resinPricing.special;
  if (prefix === "card-pricing") return config.cardPricing;
  if (prefix === "card-finish") return config.cardFinishes;
  if (prefix === "flyer-pricing") return config.flyerPricing;
  if (prefix === "flyer-finish") return config.flyerFinishes;
  if (prefix === "credential-lanyard-printed") return config.credentialLanyardPricing.printed;
  if (prefix.startsWith("m2-")) return config.m2Pricing[prefix.slice(3)];
  if (prefix.startsWith("ready-")) return config.readyProductPricing[prefix.slice(6)];
  if (prefix.startsWith("color-product-")) return config.colorProductPricing[prefix.slice(14)];
  if (prefix.startsWith("color-")) return config.colorPrintPricing[prefix.slice(6)];
  if (prefix.startsWith("cover-")) {
    return config.coverPricing[prefix.slice(6)];
  }
  return null;
}

function getM2Catalog(config) {
  const baseCatalog = [...M2_CATALOG];
  const extraSections = Array.isArray(config.catalogSections) ? config.catalogSections : [];
  for (const section of extraSections) {
    if (section?.tab !== "m2") {
      continue;
    }
    if (!section || typeof section !== "object" || !section.id || !section.label) {
      continue;
    }
    if (baseCatalog.some((item) => item.id === section.id)) {
      continue;
    }
    baseCatalog.push({
      id: section.id,
      label: section.label,
      configKey: `custom-${section.id}`,
      pricingKey: section.pricingKey || "banner",
      bleedMm: Number(section.bleedMm || 0),
      note: section.note || "",
      sourceSeedId: section.sourceSeedId || "",
      sourceCategoryId: section.sourceCategoryId || "",
    });
  }
  return baseCatalog;
}

function buildColorQuoteDetail(row) {
  const parts = [`${formatInteger(row.quantity)} ${row.pricingSummary || "unidades"}`];
  if (Number(row.widthMm) > 0 && Number(row.heightMm) > 0) {
    parts.push(`${formatMeasure(row.widthMm)} x ${formatMeasure(row.heightMm)} cm`);
  }
  if (row.paperType) {
    parts.push(row.paperType);
  }
  if (row.printMode) {
    parts.push(row.printMode);
  }
  if (row.serviceSummary) {
    parts.push(row.serviceSummary);
  }
  if (Number(row.serviceExtraTotal) > 0) {
    parts.push(`Extras: ${formatCurrency(row.serviceExtraTotal)}`);
  }
  return parts.join(" | ");
}

function buildResinMaterialDescription(row) {
  const material = String(row?.materialLabel || "adesivo").trim().toLowerCase();
  const normalizedMaterial = material.startsWith("adesivo") ? material : `adesivo ${material}`;
  return `${normalizedMaterial} com impressão digital, resinado`;
}

function calculateM2FinishExtra(row, product, config) {
  const finishes = Array.isArray(config.m2Finishes) ? config.m2Finishes : [];
  const selected = finishes.filter((finish) => Array.isArray(row.finishIds) && row.finishIds.includes(finish.id));
  const dimensions = getM2RowDimensions(row);
  const widthCm = dimensions.widthCm;
  const heightCm = dimensions.heightCm;
  const areaM2 = (dimensions.widthMm * dimensions.heightMm) / 1000000;
  const perimeterCm = (widthCm * 2) + (heightCm * 2);
  const overrides = row.finishOverrides && typeof row.finishOverrides === "object" ? row.finishOverrides : {};

  return selected.reduce((sum, finish) => {
    const price = Number(finish.price || 0);
    if (finish.type === "eyelet") {
      const spacingCm = Math.max(1, Number(finish.spacingCm || 0));
      const manualPieces = toWholeNumber(overrides[finish.id]);
      const pieces = manualPieces > 0 ? manualPieces : Math.max(4, Math.ceil(perimeterCm / spacingCm));
      return sum + pieces * price;
    }
    if (finish.type === "perimeter") {
      return sum + (perimeterCm / 100) * price;
    }
    if (finish.type === "area") {
      return sum + areaM2 * price;
    }
    return sum;
  }, 0);
}

function getM2FinishSummary(row, config) {
  const finishes = Array.isArray(config.m2Finishes) ? config.m2Finishes : [];
  const selected = finishes.filter((finish) => Array.isArray(row.finishIds) && row.finishIds.includes(finish.id));
  const dimensions = getM2RowDimensions(row);
  const widthCm = dimensions.widthCm;
  const heightCm = dimensions.heightCm;
  const areaM2 = (dimensions.widthMm * dimensions.heightMm) / 1000000;
  const perimeterCm = (widthCm * 2) + (heightCm * 2);
  const overrides = row.finishOverrides && typeof row.finishOverrides === "object" ? row.finishOverrides : {};

  return selected.map((finish) => {
    if (finish.type === "eyelet") {
      const spacingCm = Math.max(1, Number(finish.spacingCm || 0));
      const manualPieces = toWholeNumber(overrides[finish.id]);
      const pieces = manualPieces > 0 ? manualPieces : Math.max(4, Math.ceil(perimeterCm / spacingCm));
      const sourceLabel = manualPieces > 0 ? "manual" : "auto";
      return `${finish.label}: ${pieces} ilhós (${sourceLabel}) | espaçamento ${spacingCm} cm`;
    }
    if (finish.type === "perimeter") {
      return `${finish.label}: ${formatMeasure(perimeterCm / 100)} m lineares`;
    }
    if (finish.type === "area") {
      return `${finish.label}: ${formatAreaM2(areaM2)} m²`;
    }
    return finish.label;
  });
}

function getM2RowDimensions(row) {
  const widthInput = Number(row.widthMm || 0);
  const heightInput = Number(row.heightMm || 0);
  const factor = row.measureUnit === "m" ? 100 : 1;
  const widthCm = widthInput * factor;
  const heightCm = heightInput * factor;
  const widthMm = widthCm * 10;
  const heightMm = heightCm * 10;
  return {
    widthCm,
    heightCm,
    widthMm,
    heightMm,
  };
}

function buildApostilaCoverDetail(row) {
  const parts = [];
  const hasCover = (row.coverType && row.coverType !== "Sem capa") || Number(row.coverTotal) > 0;
  const hasBackCover = (row.backCoverType && row.backCoverType !== "Sem contracapa") || Number(row.backTotal) > 0;

  if (hasCover) {
    parts.push(`Capa: ${row.coverType && row.coverType !== "Sem capa" ? row.coverType : "Colorida"} | ${row.coverPaper || "Papel não informado"}`);
  }

  if (hasBackCover) {
    parts.push(`Contracapa: ${row.backCoverType && row.backCoverType !== "Sem contracapa" ? row.backCoverType : "Colorida"} | ${row.backCoverPaper || "Papel não informado"}`);
  }

  return parts.join(" | ");
}

function createQuoteEntries(state, workbook, colorWorkbook, credentialWorkbook, m2Workbook, readyWorkbook, resinWorkbook, cardWorkbook = { activeRows: [] }, flyerWorkbook = { activeRows: [] }, blockSulfiteWorkbook = { activeRows: [] }, blockAutocopiativoWorkbook = { activeRows: [] }) {
  return [
    ...workbook.activeRows.map((row) => {
      const coverDetail = buildApostilaCoverDetail(row);
      const discountDetail = getDiscountQuoteDetail(row);
      return {
        kind: "Apostila",
        description: row.description,
        detail: `${formatInteger(row.quantity)} apostilas | ${formatInteger(row.pages)} páginas | ${row.printType} | ${row.finishing}${row.bindingGroup ? ` | Grupo ${row.bindingGroup}` : ""}`,
        extraDetail: [coverDetail, discountDetail].filter(Boolean).join(" | "),
        total: row.total,
      };
    }),
    ...colorWorkbook.activeRows.map((row) => ({
      kind: "Impresso colorido",
      description: row.description || row.productLabel,
      detail: buildColorQuoteDetail(row),
      extraDetail: getDiscountQuoteDetail(row),
      total: row.total,
    })),
    ...credentialWorkbook.activeRows.map((row) => ({
      kind: "Credencial",
      description: row.description || "Credencial",
      detail: `${formatInteger(row.quantity)} unidades | ${formatMeasure(row.widthCm)} x ${formatMeasure(row.heightCm)} cm | ${row.materialLabel} | ${row.printMode}${row.lamination === "Com laminação" ? " | Com laminação" : ""}${row.lanyardType !== "none" ? ` | ${row.lanyardLabel}` : ""}`,
      extraDetail: getDiscountQuoteDetail(row),
      total: row.total,
    })),
    ...m2Workbook.activeRows.map((row) => ({
      kind: "Cálculo de m²",
      description: row.description || row.productLabel,
      detail: `${formatInteger(row.quantity)} unidades | ${formatMeasure(row.widthMm)} x ${formatMeasure(row.heightMm)} ${row.measureUnit || "cm"} | ${formatAreaM2(row.areaM2)} m² | ${row.productLabel}${row.finishSummary ? ` | ${row.finishSummary}` : ""}${row.artCreationFee > 0 ? ` | Arte/edição: ${formatCurrency(row.artCreationFee)}` : ""}`,
      extraDetail: getDiscountQuoteDetail(row),
      total: row.total,
    })),
    ...readyWorkbook.activeRows.map((row) => ({
      kind: "Material pronto",
      description: row.description || row.productLabel,
      detail: `${formatInteger(row.effectiveQuantity || row.quantity)} ${row.unitLabel || "unidades"} | ${row.productLabel}${row.pricingLabel ? ` | ${row.pricingLabel}` : ""}${row.artCreationFee > 0 ? ` | Arte/edição: ${formatCurrency(row.artCreationFee)}` : ""}${row.extraCharge > 0 ? ` | Extra: ${formatCurrency(row.extraCharge)}` : ""}`,
      extraDetail: getDiscountQuoteDetail(row),
      total: row.total,
    })),
    ...resinWorkbook.activeRows.map((row) => ({
      kind: "Resinado",
      description: buildResinMaterialDescription(row),
      detail: `${formatInteger(row.quantity)} unidades | ${formatMeasure(row.widthMm)} x ${formatMeasure(row.heightMm)} mm${row.description ? ` | ${row.description}` : ""}`,
      extraDetail: getDiscountQuoteDetail(row),
      total: row.total,
    })),
    ...cardWorkbook.activeRows.map((row) => ({
      kind: "Cartão de visita",
      description: row.description || "Cartão de visita",
      detail: `${formatInteger(row.quantity)} cartões | ${row.printType === "offset" ? "Offset" : "Laser"} | ${row.paper} | ${row.side}${row.finishSummary ? ` | ${row.finishSummary}` : ""}${row.artCreationFee > 0 ? ` | Arte: ${formatCurrency(row.artCreationFee)}` : ""}`,
      extraDetail: getDiscountQuoteDetail(row),
      total: row.total,
    })),
    ...flyerWorkbook.activeRows.map((row) => ({
      kind: "Panfleto/folder",
      description: row.description || "Panfleto/folder",
      detail: `${formatInteger(row.quantity)} unidades | ${row.printType === "offset" ? "Offset" : "Laser"} | ${row.paper} | ${row.size} | ${row.colorMode}${row.finishId !== "sem-acabamento" ? ` | ${row.finishLabel}` : ""}${row.artCreationFee > 0 ? ` | Arte: ${formatCurrency(row.artCreationFee)}` : ""}`,
      extraDetail: getDiscountQuoteDetail(row),
      total: row.total,
    })),
    ...blockSulfiteWorkbook.activeRows.map((row) => ({
      kind: "Blocos sulfite 75g",
      description: row.description || "Bloco sulfite 75g",
      detail: `${formatInteger(row.quantity)} blocos | ${row.format} | ${formatInteger(row.vias)} vias | ${row.measure || "medida não informada"}${row.artCreationFee > 0 ? ` | Arte: ${formatCurrency(row.artCreationFee)}` : ""}`,
      extraDetail: getDiscountQuoteDetail(row),
      total: row.total,
    })),
    ...blockAutocopiativoWorkbook.activeRows.map((row) => ({
      kind: "Blocos autocopiativo",
      description: row.description || "Bloco autocopiativo",
      detail: `${formatInteger(row.quantity)} blocos | ${row.format} | ${formatInteger(row.vias)} vias | ${row.measure || "medida não informada"}${row.artCreationFee > 0 ? ` | Arte: ${formatCurrency(row.artCreationFee)}` : ""}`,
      extraDetail: getDiscountQuoteDetail(row),
      total: row.total,
    })),
  ];
}

function createQuoteHistoryItems(state, workbook, colorWorkbook, credentialWorkbook, m2Workbook, readyWorkbook, resinWorkbook, cardWorkbook, flyerWorkbook, blockSulfiteWorkbook, blockAutocopiativoWorkbook) {
  return createQuoteEntries(state, workbook, colorWorkbook, credentialWorkbook, m2Workbook, readyWorkbook, resinWorkbook, cardWorkbook, flyerWorkbook, blockSulfiteWorkbook, blockAutocopiativoWorkbook).map((entry, index) => ({
    id: `quote-item-${index + 1}`,
    label: entry.description || `Item ${index + 1}`,
    category: entry.kind || "",
    detail: entry.detail || "",
    extraDetail: entry.extraDetail || "",
    quantity: Number.parseInt(String(entry.detail || "").match(/\d+/)?.[0] || "1", 10) || 1,
    total: Number(entry.total || 0),
  }));
}

function createQuoteHtml(state, workbook, colorWorkbook, credentialWorkbook, m2Workbook, readyWorkbook, resinWorkbook, cardWorkbook = { activeRows: [], totals: { totalGeneral: 0, totalQuantity: 0 } }, flyerWorkbook = { activeRows: [], totals: { totalGeneral: 0, totalQuantity: 0 } }, blockSulfiteWorkbook = { activeRows: [], totals: { totalGeneral: 0, totalQuantity: 0 } }, blockAutocopiativoWorkbook = { activeRows: [], totals: { totalGeneral: 0, totalQuantity: 0 } }) {
  const dateText = new Intl.DateTimeFormat("pt-BR").format(new Date());
  const quoteEntries = createQuoteEntries(state, workbook, colorWorkbook, credentialWorkbook, m2Workbook, readyWorkbook, resinWorkbook, cardWorkbook, flyerWorkbook, blockSulfiteWorkbook, blockAutocopiativoWorkbook);
  const combinedTotal = workbook.totals.totalGeneral + colorWorkbook.totals.totalGeneral + credentialWorkbook.totals.totalGeneral + m2Workbook.totals.totalGeneral + readyWorkbook.totals.totalGeneral + resinWorkbook.totals.totalGeneral + cardWorkbook.totals.totalGeneral + flyerWorkbook.totals.totalGeneral + blockSulfiteWorkbook.totals.totalGeneral + blockAutocopiativoWorkbook.totals.totalGeneral;
  const combinedUnits = workbook.totals.totalQuantity + colorWorkbook.totals.totalQuantity + credentialWorkbook.totals.totalQuantity + m2Workbook.totals.totalQuantity + readyWorkbook.totals.totalQuantity + resinWorkbook.totals.totalQuantity + cardWorkbook.totals.totalQuantity + flyerWorkbook.totals.totalQuantity + blockSulfiteWorkbook.totals.totalQuantity + blockAutocopiativoWorkbook.totals.totalQuantity;
  const lineItemsMarkup = quoteEntries.length
    ? quoteEntries
        .map(
          (entry, index) => `
            <div class="quote-line">
              <div>
                <strong>${escapeHtml(entry.description || `Item ${index + 1}`)}</strong>
                <small>
                  ${escapeHtml(entry.kind)} | ${escapeHtml(entry.detail)}
                </small>
                ${entry.extraDetail ? `<small class="quote-extra-detail">${escapeHtml(entry.extraDetail)}</small>` : ""}
              </div>
              <div>${formatCurrency(entry.total)}</div>
            </div>
          `
        )
        .join("")
    : `<div class="empty-state"><strong>Seu orçamento ainda está vazio</strong><span>Adicione itens nas abas de cálculo para montar uma prévia pronta para copiar, imprimir ou salvar em PDF.</span></div>`;

  const notesMarkup = state.quoteNotes?.trim()
    ? `<div class="quote-box"><h3>Observações</h3><p class="quote-muted">${escapeHtml(state.quoteNotes).replaceAll("\n", "<br>")}</p></div>`
    : "";

  const logoMarkup = state.company.logoDataUrl
    ? `<div class="logo-box"><img src="${state.company.logoDataUrl}" alt="Logo da empresa"></div>`
    : document.getElementById("logo-placeholder-template").innerHTML;

  return `
    <div class="quote-sheet">
      <div class="quote-header">
        ${logoMarkup}
        <div class="quote-company-block">
          <p class="eyebrow">Orçamento</p>
          <h2 class="quote-company-name">${escapeHtml(state.company.name || "Sua empresa")}</h2>
          <p class="quote-muted">Data: ${escapeHtml(dateText)}</p>
          <p class="quote-muted">CNPJ: ${escapeHtml(state.company.cnpj || "-")}</p>
          <p class="quote-muted">${escapeHtml(state.company.address || "-")}</p>
          <p class="quote-muted">${escapeHtml(state.company.contact || "")}</p>
        </div>
      </div>

      <div class="quote-meta-grid">
        <div class="quote-box">
          <h3>Cliente</h3>
          <p class="quote-muted">Nome / Razão social: ${escapeHtml(state.client.name || "-")}</p>
          <p class="quote-muted">Contato: ${escapeHtml(state.client.contact || "-")}</p>
          <p class="quote-muted">CNPJ: ${escapeHtml(state.client.cnpj || "-")}</p>
        </div>
        <div class="quote-box">
          <h3>Pagamento</h3>
          <p class="quote-muted">${escapeHtml(state.paymentTerms || "-")}</p>
        </div>
      </div>

      <div class="quote-box">
        <h3>Itens do orçamento</h3>
        <div class="quote-lines">${lineItemsMarkup}</div>
      </div>

      ${notesMarkup}

      <div class="quote-total-bar">
        <div>
          <strong>Total geral</strong>
          <p class="quote-muted">Total de unidades: ${formatInteger(combinedUnits)}</p>
        </div>
        <strong>${formatCurrency(combinedTotal)}</strong>
      </div>
    </div>
  `;
}

function createQuoteText(state, workbook, colorWorkbook, credentialWorkbook, m2Workbook, readyWorkbook, resinWorkbook, cardWorkbook = { activeRows: [], totals: { totalGeneral: 0 } }, flyerWorkbook = { activeRows: [], totals: { totalGeneral: 0 } }, blockSulfiteWorkbook = { activeRows: [], totals: { totalGeneral: 0 } }, blockAutocopiativoWorkbook = { activeRows: [], totals: { totalGeneral: 0 } }) {
  const dateText = new Intl.DateTimeFormat("pt-BR").format(new Date());
  const lines = [
    `ORÇAMENTO | ${state.company.name || "Sua empresa"}`,
    `Data: ${dateText}`,
    `CNPJ: ${state.company.cnpj || "-"}`,
    `Endereço: ${state.company.address || "-"}`,
    "",
    `Cliente: ${state.client.name || "-"}`,
    `Contato: ${state.client.contact || "-"}`,
    `CNPJ cliente: ${state.client.cnpj || "-"}`,
    `Pagamento: ${state.paymentTerms || "-"}`,
    "",
    "Itens:",
  ];

  const quoteEntries = [
    ...workbook.activeRows.map((row, index) => {
      const coverDetail = buildApostilaCoverDetail(row);
      const discountDetail = getDiscountQuoteDetail(row);
      return {
        text: `- ${row.description || `Apostila ${index + 1}`} | ${row.quantity} apostilas | ${row.pages} páginas | ${row.printType} | ${row.finishing}${row.bindingGroup ? ` | Grupo ${row.bindingGroup}` : ""}${coverDetail ? ` | ${coverDetail}` : ""}${discountDetail ? ` | ${discountDetail}` : ""} | ${formatCurrency(row.total)}`,
      };
    }),
    ...colorWorkbook.activeRows.map((row, index) => ({
      text: `- ${row.description || row.productLabel || `Impresso ${index + 1}`} | ${buildColorQuoteDetail(row)}${getDiscountQuoteDetail(row) ? ` | ${getDiscountQuoteDetail(row)}` : ""} | ${formatCurrency(row.total)}`,
    })),
    ...credentialWorkbook.activeRows.map((row, index) => ({
      text: `- ${row.description || `Credencial ${index + 1}`} | ${row.quantity} unidades | ${formatMeasure(row.widthCm)} x ${formatMeasure(row.heightCm)} cm | ${row.materialLabel} | ${row.printMode}${row.lamination === "Com laminação" ? " | Com laminação" : ""}${row.lanyardType !== "none" ? ` | ${row.lanyardLabel}` : ""}${getDiscountQuoteDetail(row) ? ` | ${getDiscountQuoteDetail(row)}` : ""} | ${formatCurrency(row.total)}`,
    })),
    ...m2Workbook.activeRows.map((row, index) => ({
      text: `- ${row.description || row.productLabel || `M² ${index + 1}`} | ${row.quantity} unidades | ${formatMeasure(row.widthMm)} x ${formatMeasure(row.heightMm)} ${row.measureUnit || "cm"} | ${formatAreaM2(row.areaM2)} m² | ${row.finishSummary ? `${row.finishSummary} | ` : ""}${row.artCreationFee > 0 ? `Arte/edição: ${formatCurrency(row.artCreationFee)} | ` : ""}${getDiscountQuoteDetail(row) ? `${getDiscountQuoteDetail(row)} | ` : ""}${formatCurrency(row.total)}`,
    })),
    ...readyWorkbook.activeRows.map((row, index) => ({
      text: `- ${row.description || row.productLabel || `Material ${index + 1}`} | ${row.effectiveQuantity || row.quantity} ${row.unitLabel || "unidades"} | ${row.productLabel}${row.pricingLabel ? ` | ${row.pricingLabel}` : ""}${row.artCreationFee > 0 ? ` | Arte/edição: ${formatCurrency(row.artCreationFee)}` : ""}${row.extraCharge > 0 ? ` | Extra: ${formatCurrency(row.extraCharge)}` : ""}${getDiscountQuoteDetail(row) ? ` | ${getDiscountQuoteDetail(row)}` : ""} | ${formatCurrency(row.total)}`,
    })),
    ...resinWorkbook.activeRows.map((row, index) => ({
      text: `- ${buildResinMaterialDescription(row) || `Resinado ${index + 1}`} | ${row.quantity} unidades | ${formatMeasure(row.widthMm)} x ${formatMeasure(row.heightMm)} mm${row.description ? ` | ${row.description}` : ""}${getDiscountQuoteDetail(row) ? ` | ${getDiscountQuoteDetail(row)}` : ""} | ${formatCurrency(row.total)}`,
    })),
    ...cardWorkbook.activeRows.map((row, index) => ({
      text: `- ${row.description || `Cartão de visita ${index + 1}`} | ${row.quantity} cartões | ${row.printType === "offset" ? "Offset" : "Laser"} | ${row.paper} | ${row.side}${row.finishSummary ? ` | ${row.finishSummary}` : ""}${row.artCreationFee > 0 ? ` | Arte: ${formatCurrency(row.artCreationFee)}` : ""}${getDiscountQuoteDetail(row) ? ` | ${getDiscountQuoteDetail(row)}` : ""} | ${formatCurrency(row.total)}`,
    })),
    ...flyerWorkbook.activeRows.map((row, index) => ({
      text: `- ${row.description || `Panfleto/folder ${index + 1}`} | ${row.quantity} unidades | ${row.printType === "offset" ? "Offset" : "Laser"} | ${row.paper} | ${row.size} | ${row.colorMode}${row.finishId !== "sem-acabamento" ? ` | ${row.finishLabel}` : ""}${row.artCreationFee > 0 ? ` | Arte: ${formatCurrency(row.artCreationFee)}` : ""}${getDiscountQuoteDetail(row) ? ` | ${getDiscountQuoteDetail(row)}` : ""} | ${formatCurrency(row.total)}`,
    })),
    ...blockSulfiteWorkbook.activeRows.map((row, index) => ({
      text: `- ${row.description || `Bloco sulfite ${index + 1}`} | ${row.quantity} blocos | ${row.format} | ${row.vias} vias | ${row.measure || "medida não informada"}${row.artCreationFee > 0 ? ` | Arte: ${formatCurrency(row.artCreationFee)}` : ""}${getDiscountQuoteDetail(row) ? ` | ${getDiscountQuoteDetail(row)}` : ""} | ${formatCurrency(row.total)}`,
    })),
    ...blockAutocopiativoWorkbook.activeRows.map((row, index) => ({
      text: `- ${row.description || `Bloco autocopiativo ${index + 1}`} | ${row.quantity} blocos | ${row.format} | ${row.vias} vias | ${row.measure || "medida não informada"}${row.artCreationFee > 0 ? ` | Arte: ${formatCurrency(row.artCreationFee)}` : ""}${getDiscountQuoteDetail(row) ? ` | ${getDiscountQuoteDetail(row)}` : ""} | ${formatCurrency(row.total)}`,
    })),
  ];

  if (quoteEntries.length === 0) {
    lines.push("- Nenhum item preenchido.");
  } else {
    quoteEntries.forEach((entry) => lines.push(entry.text));
  }

  lines.push("", `Total geral: ${formatCurrency(workbook.totals.totalGeneral + colorWorkbook.totals.totalGeneral + credentialWorkbook.totals.totalGeneral + m2Workbook.totals.totalGeneral + readyWorkbook.totals.totalGeneral + resinWorkbook.totals.totalGeneral + cardWorkbook.totals.totalGeneral + flyerWorkbook.totals.totalGeneral + blockSulfiteWorkbook.totals.totalGeneral + blockAutocopiativoWorkbook.totals.totalGeneral)}`);

  if (state.quoteNotes?.trim()) {
    lines.push("", "Observações:", state.quoteNotes.trim());
  }

  return lines.join("\n");
}

async function initApp() {
  await loadStoreMasterSeed();
  const config = loadFromStorage(STORAGE_KEYS.config, mergeConfig);
  const hiddenCleanupChanged = cleanupHiddenImpressosEntries(config);
  const seedCoverageChanged = ensureSeedCatalogCoverage(config);
  if (hiddenCleanupChanged || seedCoverageChanged) {
    saveToStorage(STORAGE_KEYS.config, config);
  }
  const state = loadFromStorage(STORAGE_KEYS.state, (candidate) => mergeState(candidate, config));
  let authUsers = loadAuthUsers();
  let accessControl = loadAccessControl();
  let currentUser = loadAuthSession(authUsers);
  let pendingVerificationEmail = loadPendingVerificationEmail();
  const hiddenStateCleanupChanged = cleanupHiddenImpressosEntries(config, state);
  if (hiddenStateCleanupChanged) {
    saveToStorage(STORAGE_KEYS.state, state);
    saveToStorage(STORAGE_KEYS.config, config);
  }
  let configViewMode = loadConfigViewMode();
  let activeConfigSection = loadConfigSection();
  let lastConfigSourceTab = activeConfigSection;
  let isConfigUnlocked = loadSessionFlag(SESSION_KEYS.configUnlocked);
  let sharedSyncTimer = null;
  let sharedSyncInFlight = false;
  let sharedSyncQueued = false;
  let sharedBootstrapComplete = false;
  let sharedUpdatedAt = "";
  let lastSharedSnapshot = "";
  let sharedRefreshHandle = null;
  let editingClientId = "";
  let selectedDeveloperUserId = "";
  let serverSecuritySession = {
    developerLoggedIn: false,
    configUnlocked: false,
    username: "",
  };
  const selectedRowIds = new Set();
  let activeAuthStage = "login";
  let emailVerificationTimerHandle = null;
  ensureRowCount(state, 5);
  ensureColorRowCount(state, 5);
  ensureCredentialRowCount(state, 5);
  ensureM2RowCount(state, 5);
  ensureReadyRowCount(state, 5);
  ensureResinRowCount(state, 5);
  if (!Array.isArray(state.cardItems)) {
    state.cardItems = [];
  }
  while (state.cardItems.length < 5) {
    state.cardItems.push(createDefaultCardRow(state.cardItems.length));
  }
  if (!Array.isArray(state.flyerItems)) {
    state.flyerItems = [];
  }
  while (state.flyerItems.length < 5) {
    state.flyerItems.push(createDefaultFlyerRow(state.flyerItems.length));
  }
  state.rows = trimEmptyRows(state.rows, 5, isRowActive);
  state.colorPrintItems = trimEmptyRows(state.colorPrintItems, 5, isColorPrintRowActive);
  state.credentialItems = trimEmptyRows(state.credentialItems, 5, isCredentialRowActive);
  state.m2Items = trimEmptyRows(state.m2Items, 5, (row) => Boolean(row.description?.trim() || Number(row.quantity) > 0 || Number(row.widthMm) > 0 || Number(row.heightMm) > 0));
  state.readyItems = trimEmptyRows(state.readyItems, 5, isReadyRowActive);
  state.resinItems = trimEmptyRows(state.resinItems, 5, isResinRowActive);
  state.cardItems = trimEmptyRows(state.cardItems, 5, isCardRowActive);
  state.flyerItems = trimEmptyRows(state.flyerItems, 5, isFlyerRowActive);
  state.blockItems = state.blockItems && typeof state.blockItems === "object"
    ? state.blockItems
    : { sulfite: [], autocopiativo: [] };
  state.blockItems.sulfite = trimEmptyRows(state.blockItems.sulfite || [], 5, isBlockRowActive);
  state.blockItems.autocopiativo = trimEmptyRows(state.blockItems.autocopiativo || [], 5, isBlockRowActive);

  const rowsTableBody = document.getElementById("rows-table-body");
  const colorRowsTableBody = document.getElementById("color-rows-table-body");
  const credentialRowsTableBody = document.getElementById("credential-rows-table-body");
  const warningList = document.getElementById("warning-list");
  const colorWarningList = document.getElementById("color-warning-list");
  const credentialWarningList = document.getElementById("credential-warning-list");
  const m2WarningList = document.getElementById("m2-warning-list");
  const readyWarningList = document.getElementById("ready-warning-list");
  const resinWarningList = document.getElementById("resin-warning-list");
  const configSections = document.getElementById("config-sections");
  const clientsList = document.getElementById("clients-list");
  const historyList = document.getElementById("history-list");
  const osList = document.getElementById("os-list");
  const clientsEditorName = document.getElementById("clients-editor-name");
  const clientsEditorContact = document.getElementById("clients-editor-contact");
  const clientsEditorCnpj = document.getElementById("clients-editor-cnpj");
  const clientsEditorNotes = document.getElementById("clients-editor-notes");
  const clientsEditorStatus = document.getElementById("clients-editor-status");
  const m2RowsTableBody = document.getElementById("m2-rows-table-body");
  const readyRowsTableBody = document.getElementById("ready-rows-table-body");
  const resinRowsTableBody = document.getElementById("resin-rows-table-body");
  const cardRowsTableBody = document.getElementById("cards-rows-table-body");
  const cardWarningList = document.getElementById("cards-warning-list");
  const flyerRowsTableBody = document.getElementById("flyers-rows-table-body");
  const flyerWarningList = document.getElementById("flyers-warning-list");
  const quotePreview = document.getElementById("quote-preview");
  const feedback = document.getElementById("import-feedback");
  const colorFeedback = document.getElementById("color-feedback");
  const credentialFeedback = document.getElementById("credential-feedback");
  const configStatus = document.getElementById("config-status");
  const syncStatus = document.getElementById("sync-status");
  const osStatus = document.getElementById("os-status");
  const spiralDiscountInput = document.getElementById("spiral-discount-input");
  const lockConfigButton = document.getElementById("lock-config-button");
  const confirmModal = document.getElementById("confirm-modal");
  const confirmModalKicker = document.getElementById("confirm-modal-kicker");
  const confirmModalTitle = document.getElementById("confirm-modal-title");
  const confirmModalMessage = document.getElementById("confirm-modal-message");
  const confirmModalConfirm = document.getElementById("confirm-modal-confirm");
  const confirmModalCancel = document.getElementById("confirm-modal-cancel");
  const passwordChangeModal = document.getElementById("password-change-modal");
  const passwordChangeForm = document.getElementById("password-change-form");
  const passwordChangeInput = document.getElementById("password-change-input");
  const passwordChangeConfirmInput = document.getElementById("password-change-confirm-input");
  const passwordChangeStatus = document.getElementById("password-change-status");
  const appShell = document.getElementById("app-shell");
  const authStatus = document.getElementById("auth-status");
  const emailVerificationForm = document.getElementById("email-verification-form");
  const authStageButtons = [...document.querySelectorAll("[data-auth-stage-target]")];
  const authStagePanels = [...document.querySelectorAll("[data-auth-stage]")];
  const emailVerificationTargetLabel = document.getElementById("email-verification-target-label");
  const emailVerificationHelp = document.getElementById("email-verification-help");
  const emailVerificationResendButton = document.getElementById("email-verification-resend-button");
  const emailVerificationResendStatus = document.getElementById("email-verification-resend-status");
  const currentUserLabel = document.getElementById("current-user-label");
  const developerUsersList = document.getElementById("developer-users-list");
  const developerGroupsList = document.getElementById("developer-groups-list");
  const developerUserPermissions = document.getElementById("developer-user-permissions");
  const developerPasswordForm = document.getElementById("developer-password-form");
  const developerPasswordSaveButton = document.getElementById("developer-password-save");
  const developerSyncUsersButton = document.getElementById("developer-sync-users-button");
  const developerLastSync = document.getElementById("developer-last-sync");
  const historyFilterStatus = document.getElementById("history-filter-status");
  const historyFilterClient = document.getElementById("history-filter-client");
  const historyFilterStart = document.getElementById("history-filter-start");
  const historyFilterEnd = document.getElementById("history-filter-end");
  const historyFilterClear = document.getElementById("history-filter-clear");
  const osFilterStatus = document.getElementById("os-filter-status");
  const osFilterClient = document.getElementById("os-filter-client");
  const osFilterOwner = document.getElementById("os-filter-owner");
  const osFilterDate = document.getElementById("os-filter-date");
  const osFilterClear = document.getElementById("os-filter-clear");
  const blockTableBodies = {
    sulfite: document.getElementById("blocks-sulfite-rows-table-body"),
    autocopiativo: document.getElementById("blocks-autocopiativo-rows-table-body"),
  };
  const blockWarningLists = {
    sulfite: document.getElementById("blocks-sulfite-warning-list"),
    autocopiativo: document.getElementById("blocks-autocopiativo-warning-list"),
  };

  let historyFilters = {
    status: "all",
    client: "",
    start: "",
    end: "",
  };
  let editingQuoteId = "";
  let workOrderFilters = {
    status: "all",
    client: "",
    owner: "",
    date: "",
  };
  let lastGeneratedTemporaryPassword = "";

  const tabButtons = [...document.querySelectorAll(".tab-button")];
  const tabPanels = [...document.querySelectorAll(".tab-panel")];
  const appMenuShell = document.querySelector(".app-menu-shell");
  const appMenuToggle = document.getElementById("app-menu-toggle");
  const appMenuPanel = document.getElementById("main-tab-menu");

  function setAppMenuOpen(open) {
    if (!appMenuToggle || !appMenuPanel) {
      return;
    }
    appMenuToggle.setAttribute("aria-expanded", open ? "true" : "false");
    appMenuPanel.hidden = !open;
  }

  function closeAppMenu() {
    setAppMenuOpen(false);
  }

  function setStatusMessage(element, message, tone = "neutral") {
    if (!element) {
      return;
    }
    element.textContent = message;
    if (tone === "neutral") {
      delete element.dataset.tone;
      return;
    }
    element.dataset.tone = tone;
  }

  function setConfigStatus(message, tone = "neutral") {
    setStatusMessage(configStatus, message, tone);
  }

  function setMainFeedback(message, tone = "neutral") {
    setStatusMessage(feedback, message, tone);
  }

  function setColorFeedback(message, tone = "neutral") {
    setStatusMessage(colorFeedback, message, tone);
  }

  function setCredentialFeedback(message, tone = "neutral") {
    setStatusMessage(credentialFeedback, message, tone);
  }

  function setSyncStatus(message, tone = "neutral") {
    setStatusMessage(syncStatus, message, tone);
  }

  function setAuthStatus(message, tone = "neutral") {
    setStatusMessage(authStatus, message, tone);
  }

  function setAuthStage(stage) {
    activeAuthStage = ["login", "register", "verify"].includes(stage) ? stage : "login";
    authStageButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.authStageTarget === activeAuthStage);
    });
    authStagePanels.forEach((panel) => {
      const isActive = panel.dataset.authStage === activeAuthStage;
      panel.hidden = !isActive;
      panel.classList.toggle("is-active", isActive);
    });
  }

  function updateEmailVerificationCountdown() {
    const emailInput = document.getElementById("email-verification-email");
    const activeEmail = normalizeLookupEmail(emailInput?.value || pendingVerificationEmail);
    const user = findAuthUserByEmail(authUsers, activeEmail);
    const remainingMs = getRemainingCooldownMs(user);
    if (emailVerificationResendButton) {
      emailVerificationResendButton.disabled = remainingMs > 0 || !user?.email;
    }
    if (emailVerificationResendStatus) {
      if (!user?.email) {
        setStatusMessage(emailVerificationResendStatus, "Informe o e-mail usado no cadastro para pedir um novo código.", "warning");
      } else if (remainingMs > 0) {
        setStatusMessage(emailVerificationResendStatus, `Você poderá reenviar um novo código em ${Math.ceil(remainingMs / 1000)}s.`, "warning");
      } else {
        setStatusMessage(emailVerificationResendStatus, "Se o e-mail não chegou, você já pode reenviar um novo código.", "success");
      }
    }
    if (remainingMs <= 0 && emailVerificationTimerHandle) {
      window.clearInterval(emailVerificationTimerHandle);
      emailVerificationTimerHandle = null;
    }
  }

  function startEmailVerificationCountdown() {
    if (emailVerificationTimerHandle) {
      window.clearInterval(emailVerificationTimerHandle);
    }
    updateEmailVerificationCountdown();
    emailVerificationTimerHandle = window.setInterval(() => {
      updateEmailVerificationCountdown();
    }, 1000);
  }

  function syncPendingVerificationForm() {
    const emailInput = document.getElementById("email-verification-email");
    if (emailInput && pendingVerificationEmail) {
      emailInput.value = pendingVerificationEmail;
    }
  }

  function openEmailVerificationStep(user, message, tone = "warning") {
    pendingVerificationEmail = String(user?.email || "").trim().toLowerCase();
    savePendingVerificationEmail(pendingVerificationEmail);
    syncPendingVerificationForm();
    setAuthStage("verify");
    if (emailVerificationTargetLabel) {
      emailVerificationTargetLabel.textContent = pendingVerificationEmail
        ? `Código enviado para ${pendingVerificationEmail}`
        : "Código de acesso";
    }
    if (emailVerificationHelp) {
      emailVerificationHelp.textContent = user?.emailVerification?.expiresAt
        ? `Este código vale até ${formatDateTime(user.emailVerification.expiresAt) || "alguns minutos"}.`
        : "O código expira após alguns minutos. Se necessário, reenvie um novo código.";
    }
    startEmailVerificationCountdown();
    setAuthStatus(message, tone);
    selectTab("login");
    requestAnimationFrame(() => {
      const codeInput = document.getElementById("email-verification-code");
      codeInput?.focus();
    });
  }

  function clearPendingVerificationStep() {
    pendingVerificationEmail = "";
    savePendingVerificationEmail("");
    setAuthStage("login");
    if (emailVerificationTimerHandle) {
      window.clearInterval(emailVerificationTimerHandle);
      emailVerificationTimerHandle = null;
    }
  }

  function returnToLoginFromVerification(message = "Você voltou para a tela de login. Se quiser, faça o acesso novamente ou peça um novo código.") {
    clearPendingVerificationStep();
    setAuthStatus(message, "warning");
    selectTab("login");
    requestAnimationFrame(() => {
      document.getElementById("login-user")?.focus();
    });
  }

  function setPasswordChangeStatus(message, tone = "neutral") {
    setStatusMessage(passwordChangeStatus, message, tone);
  }

  function isDeveloperSession() {
    return currentUser?.role === "developer" && currentUser?.status === "active";
  }

  function userNeedsPasswordChange(user) {
    return Boolean(user?.mustChangePassword);
  }

  function openPasswordChangeModal(user) {
    if (!passwordChangeModal || !user) {
      return;
    }
    passwordChangeModal.hidden = false;
    if (passwordChangeInput) {
      passwordChangeInput.value = "";
    }
    if (passwordChangeConfirmInput) {
      passwordChangeConfirmInput.value = "";
    }
    if (passwordChangeInput) {
      passwordChangeInput.type = "password";
      passwordChangeInput.focus();
    }
    if (passwordChangeConfirmInput) {
      passwordChangeConfirmInput.type = "password";
    }
    passwordChangeModal.querySelectorAll("[data-password-toggle]").forEach((button) => {
      button.textContent = "◐";
      button.setAttribute("aria-label", "Mostrar senha");
      button.setAttribute("aria-pressed", "false");
    });
    setPasswordChangeStatus(`Crie uma nova senha definitiva para ${user.username}.`, "warning");
  }

  function closePasswordChangeModal() {
    if (!passwordChangeModal) {
      return;
    }
    passwordChangeModal.hidden = true;
  }

  function reloadAuthContextFromStorage() {
    const previousUserId = currentUser?.id || "";
    authUsers = loadAuthUsers();
    accessControl = loadAccessControl();
    const rememberedUser = authUsers.find((user) => user.id === previousUserId && user.status === "active") || null;
    const storedUser = loadAuthSession(authUsers);
    const resolvedUser = rememberedUser || storedUser || null;
    if (resolvedUser?.role === "developer" && !serverSecuritySession.developerLoggedIn) {
      currentUser = null;
      saveAuthSession(null);
      return;
    }
    currentUser = resolvedUser;
  }

  async function hydrateServerSecuritySession() {
    try {
      const result = await requestServerAuthSession();
      serverSecuritySession = {
        developerLoggedIn: Boolean(result?.developerLoggedIn),
        configUnlocked: Boolean(result?.configUnlocked),
        username: typeof result?.username === "string" ? result.username : "",
      };
    } catch {
      serverSecuritySession = {
        developerLoggedIn: false,
        configUnlocked: false,
        username: "",
      };
    }

    const currentDeveloper = currentUser?.role === "developer";
    if (currentDeveloper && !serverSecuritySession.developerLoggedIn) {
      currentUser = null;
      saveAuthSession(null);
    }

    isConfigUnlocked = Boolean(serverSecuritySession.configUnlocked && (serverSecuritySession.developerLoggedIn || currentUser?.role === "developer"));
    saveSessionFlag(SESSION_KEYS.configUnlocked, isConfigUnlocked);
  }

  async function logoutCurrentUser() {
    const wasDeveloper = currentUser?.role === "developer";
    if (wasDeveloper) {
      try {
        await requestAuthLogout();
      } catch {
        // Keep local logout even if the server session is already gone.
      }
    }
    currentUser = null;
    isConfigUnlocked = false;
    serverSecuritySession = {
      developerLoggedIn: false,
      configUnlocked: false,
      username: "",
    };
    saveAuthSession(null);
    saveSessionFlag(SESSION_KEYS.configUnlocked, false);
    closePasswordChangeModal();
    applyAccessRules();
    setAuthStatus("Sessão encerrada com segurança.", "success");
    selectTab("login");
  }

  function applyAccessRules() {
    const logged = Boolean(currentUser?.status === "active");
    if (appShell) {
      appShell.hidden = false;
      appShell.classList.toggle("is-auth-mode", !logged);
    }
    if (currentUserLabel) {
      currentUserLabel.textContent = logged
        ? `${currentUser.username}${isDeveloperSession() ? " | Desenvolvedor" : ""}`
        : "Nenhum usuário conectado";
    }
    if (syncStatus) {
      syncStatus.hidden = !logged;
    }
    tabButtons.forEach((button) => {
      const tab = button.dataset.tabTarget;
      let allowed = false;
      if (tab === "login") {
        allowed = !logged;
      } else if (tab === "home") {
        allowed = logged;
      } else if (logged) {
        const permissions = getUserTabPermissions(accessControl, currentUser);
        allowed = Boolean(permissions[tab]);
      }
      button.hidden = !allowed;
      button.disabled = !allowed;
    });
    tabPanels.forEach((panel) => {
      const tab = panel.dataset.tabPanel;
      let allowed = false;
      if (tab === "login") {
        allowed = !logged;
      } else if (tab === "home") {
        allowed = logged;
      } else if (logged) {
        const permissions = getUserTabPermissions(accessControl, currentUser);
        allowed = Boolean(permissions[tab]);
      }
      panel.hidden = !allowed;
      if (!allowed) {
        panel.classList.remove("is-active");
      }
    });

    const activePanel = tabPanels.find((panel) => panel.classList.contains("is-active") && !panel.hidden);
    if (!activePanel) {
      const firstAllowed = tabButtons.find((button) => !button.hidden && !button.disabled);
      if (firstAllowed) {
        selectTab(firstAllowed.dataset.tabTarget);
      }
    }
  }

  function refreshAuthStorage(forceSharedSave = false) {
    saveAuthUsers(authUsers);
    saveAccessControl(accessControl);
    return forceSharedSave ? saveSharedNow(true) : queueSharedSave(false);
  }

  function renderDeveloperArea() {
    if (!isDeveloperSession() || !developerUsersList || !developerGroupsList || !developerUserPermissions) {
      return;
    }

    const pendingCount = authUsers.filter((user) => user.status === "pending").length;
    document.getElementById("developer-users-count").textContent = formatInteger(authUsers.length);
    document.getElementById("developer-pending-count").textContent = formatInteger(pendingCount);
    document.getElementById("developer-groups-count").textContent = formatInteger(accessControl.groups.length);
    if (developerLastSync) {
      developerLastSync.textContent = sharedUpdatedAt ? (formatDateTime(sharedUpdatedAt) || "Data indisponível") : "Ainda não sincronizado";
    }

    developerUsersList.innerHTML = authUsers
      .map((user) => {
        const isDev = user.role === "developer";
        const groupOptions = accessControl.groups
          .map((group) => `<option value="${escapeHtml(group.id)}"${group.id === user.groupId ? " selected" : ""}>${escapeHtml(group.name)}</option>`)
          .join("");
        const statusLabel = user.status === "active" ? "Ativo" : user.status === "blocked" ? "Bloqueado" : "Pendente";
        const emailMeta = getEmailVerificationMeta(user);
        const documentMeta = getDocumentVerificationMeta(user);
        return `
          <article class="list-card developer-user-card" data-dev-user-id="${escapeHtml(user.id)}">
            <div>
              <h3>${escapeHtml(user.username)}</h3>
              <p>${escapeHtml(user.company || "Empresa não informada")}</p>
              <p class="list-meta">${escapeHtml(user.email || "Sem e-mail cadastrado")}</p>
              <p class="list-meta">${escapeHtml(user.document || "Sem CPF/CNPJ cadastrado")}</p>
              <p class="list-meta">Status: ${escapeHtml(statusLabel)} | Perfil: ${isDev ? "Desenvolvedor" : "Usuário"}</p>
              <div class="developer-validation-badges">
                <span class="status-inline status-inline-${escapeHtml(emailMeta.tone)}">${escapeHtml(emailMeta.label)}</span>
                <span class="status-inline status-inline-${escapeHtml(documentMeta.tone)}">${escapeHtml(documentMeta.label)}</span>
              </div>
            </div>
            <div class="developer-user-actions">
              <label>
                <span>Grupo</span>
                <select data-dev-user-group="${escapeHtml(user.id)}"${isDev ? " disabled" : ""}>${groupOptions}</select>
              </label>
              <button class="button button-small" type="button" data-dev-user-action="activate" data-dev-user-id="${escapeHtml(user.id)}"${isDev ? " disabled" : ""}>Ativar</button>
              <button class="button button-small" type="button" data-dev-user-action="block" data-dev-user-id="${escapeHtml(user.id)}"${isDev ? " disabled" : ""}>Bloquear</button>
              <button class="button button-small" type="button" data-dev-user-action="permissions" data-dev-user-id="${escapeHtml(user.id)}">Permissões</button>
              <button class="button button-small button-danger" type="button" data-dev-user-action="delete" data-dev-user-id="${escapeHtml(user.id)}"${isDev ? " disabled" : ""}>Deletar usuário</button>
            </div>
          </article>
        `;
      })
      .join("");

    developerGroupsList.innerHTML = accessControl.groups
      .map((group) => {
        const tabToggles = APP_TAB_LABELS
          .filter((tab) => tab.id !== "home")
          .filter((tab) => !tab.developerOnly || group.id === "developer")
          .map((tab) => `
            <label class="developer-permission-chip">
              <input type="checkbox" data-dev-group-tab="${escapeHtml(group.id)}" data-tab-id="${escapeHtml(tab.id)}"${group.tabs?.[tab.id] ? " checked" : ""}${group.protected && tab.id === "desenvolvedor" ? " disabled" : ""}>
              <span>${escapeHtml(tab.label)}</span>
            </label>
          `)
          .join("");
        const dashboardToggles = DASHBOARD_CARD_DEFS
          .map((card) => `
            <label class="developer-permission-chip">
              <input type="checkbox" data-dev-group-dashboard="${escapeHtml(group.id)}" data-dashboard-id="${escapeHtml(card.id)}"${group.dashboards?.[card.id] ? " checked" : ""}>
              <span>${escapeHtml(card.label)}</span>
            </label>
          `)
          .join("");
        return `
          <article class="developer-group-card">
            <div class="developer-group-head">
              <div>
                <strong>${escapeHtml(group.name)}</strong>
                <span>${group.protected ? "Grupo protegido" : "Grupo editável"}</span>
              </div>
              <button class="button button-small button-danger" type="button" data-dev-delete-group="${escapeHtml(group.id)}"${group.protected ? " disabled" : ""}>Excluir</button>
            </div>
            <div class="developer-section-title">Abas liberadas</div>
            <div class="developer-permission-grid">${tabToggles}</div>
            <div class="developer-section-title">Painéis da Home</div>
            <div class="developer-permission-grid">${dashboardToggles}</div>
          </article>
        `;
      })
      .join("");

    const selectedUser = authUsers.find((user) => user.id === selectedDeveloperUserId)
      || authUsers.find((user) => user.id !== DEVELOPER_ACCOUNT.id)
      || authUsers[0];
    if (selectedUser) {
      selectedDeveloperUserId = selectedUser.id;
      renderDeveloperUserPermissions(selectedUser);
    }
  }

  function renderDeveloperUserPermissions(user) {
    if (!developerUserPermissions || !user) {
      return;
    }
    const overrides = accessControl.userOverrides?.[user.id] || {};
    const group = getGroupForUser(accessControl, user);
    const emailMeta = getEmailVerificationMeta(user);
    const documentMeta = getDocumentVerificationMeta(user);
    const cpfPayload = buildOfficialCpfVerificationPayload(user);
    const permissionRows = APP_TAB_LABELS
      .filter((tab) => !tab.developerOnly && tab.id !== "home")
      .map((tab) => {
        const inherited = Boolean(group?.tabs?.[tab.id]);
        const overrideValue = Object.prototype.hasOwnProperty.call(overrides, tab.id) ? overrides[tab.id] : "";
        return `
          <label class="developer-override-row">
            <span>${escapeHtml(tab.label)} <small>Grupo: ${inherited ? "liberado" : "pausado"}</small></span>
            <select data-dev-user-tab-override="${escapeHtml(user.id)}" data-tab-id="${escapeHtml(tab.id)}">
              <option value=""${overrideValue === "" ? " selected" : ""}>Usar grupo</option>
              <option value="true"${overrideValue === true ? " selected" : ""}>Liberar para este usuário</option>
              <option value="false"${overrideValue === false ? " selected" : ""}>Pausar para este usuário</option>
            </select>
          </label>
        `;
      })
      .join("");
    const dashboardOverrides = accessControl.dashboardOverrides?.[user.id] || {};
    const dashboardRows = DASHBOARD_CARD_DEFS
      .map((card) => {
        const inherited = Boolean(group?.dashboards?.[card.id]);
        const overrideValue = Object.prototype.hasOwnProperty.call(dashboardOverrides, card.id) ? dashboardOverrides[card.id] : "";
        return `
          <label class="developer-override-row">
            <span>${escapeHtml(card.label)} <small>Grupo: ${inherited ? "liberado" : "oculto"}</small></span>
            <select data-dev-user-dashboard-override="${escapeHtml(user.id)}" data-dashboard-id="${escapeHtml(card.id)}">
              <option value=""${overrideValue === "" ? " selected" : ""}>Usar grupo</option>
              <option value="true"${overrideValue === true ? " selected" : ""}>Liberar para este usuário</option>
              <option value="false"${overrideValue === false ? " selected" : ""}>Ocultar para este usuário</option>
            </select>
          </label>
        `;
      })
      .join("");
    developerUserPermissions.innerHTML = `
      <div class="developer-permission-title">
        <strong>${escapeHtml(user.username)}</strong>
        <span>${escapeHtml(user.company || "Empresa não informada")}</span>
      </div>
      <p class="list-meta">${escapeHtml(user.email || "Sem e-mail cadastrado")} | ${escapeHtml(user.document || "Sem CPF/CNPJ cadastrado")}</p>
      <div class="developer-validation-panel">
        <div class="developer-validation-badges">
          <span class="status-inline status-inline-${escapeHtml(emailMeta.tone)}">${escapeHtml(emailMeta.label)}</span>
          <span class="status-inline status-inline-${escapeHtml(documentMeta.tone)}">${escapeHtml(documentMeta.label)}</span>
        </div>
        <div class="developer-validation-copy">
          <p class="list-meta">Data de nascimento: ${escapeHtml(user.birthDate || "Não informada")}</p>
          <p class="list-meta">Consulta CPF oficial: ${cpfPayload ? "payload pronto para API" : "faltam dados ou o documento não é CPF"}</p>
          <p class="list-meta">${escapeHtml(user.documentVerification?.message || "Sem observações adicionais.")}</p>
        </div>
        <div class="developer-validation-actions">
          <button class="button button-small" type="button" data-dev-user-action="send-email-verification" data-dev-user-id="${escapeHtml(user.id)}"${user.email ? "" : " disabled"}>Enviar verificação</button>
          <button class="button button-small" type="button" data-dev-user-action="verify-email" data-dev-user-id="${escapeHtml(user.id)}"${user.emailVerification?.status === "verified" ? " disabled" : ""}>Marcar e-mail verificado</button>
          <button class="button button-small" type="button" data-dev-user-action="mark-cpf-ready" data-dev-user-id="${escapeHtml(user.id)}"${cpfPayload ? "" : " disabled"}>Marcar CPF pronto</button>
          <button class="button button-small" type="button" data-dev-user-action="verify-cpf-official" data-dev-user-id="${escapeHtml(user.id)}"${cpfPayload ? "" : " disabled"}>Marcar CPF oficial validado</button>
        </div>
      </div>
      <div class="developer-section-title">Abas</div>
      <div class="developer-override-grid">${permissionRows}</div>
      <div class="developer-section-title">Painéis da Home</div>
      <div class="developer-override-grid">${dashboardRows}</div>
    `;
  }

  async function issueEmailVerificationCode(user, { rerenderPermissions = false, openedFromDeveloper = false } = {}) {
    if (!user?.email) {
      const message = "Este cadastro ainda não possui e-mail para receber o código.";
      if (openedFromDeveloper) {
        setConfigStatus(message, "warning");
      } else {
        setAuthStatus(message, "warning");
      }
      return false;
    }

    const remainingMs = getRemainingCooldownMs(user);
    if (remainingMs > 0 && !openedFromDeveloper) {
      setAuthStatus(`Aguarde ${Math.ceil(remainingMs / 1000)}s para reenviar o código.`, "warning");
      openEmailVerificationStep(user, `Aguarde ${Math.ceil(remainingMs / 1000)}s para reenviar o código.`, "warning");
      return false;
    }

    const nowIso = new Date().toISOString();
    user.emailVerification = {
      ...user.emailVerification,
      status: user.emailVerification?.status === "verified" ? "verified" : "pending",
      code: generateVerificationCode(EMAIL_VERIFICATION_CODE_LENGTH),
      sentAt: nowIso,
      expiresAt: addMillisecondsToIso(nowIso, EMAIL_VERIFICATION_EXPIRATION_MS),
      resendAvailableAt: addMillisecondsToIso(nowIso, EMAIL_VERIFICATION_COOLDOWN_MS),
    };
    user.updatedAt = nowIso;

    const delivery = await requestVerificationCodeDelivery(user);
    user.emailVerification.lastDeliveryMode = delivery.mode || "manual";
    await saveSecuritySharedNow();
    renderDeveloperArea();
    if (rerenderPermissions) {
      renderDeveloperUserPermissions(user);
    }

    const deliveryLabel = delivery.ok
      ? delivery.mode === "resend-api"
        ? "Código enviado automaticamente por e-mail."
        : delivery.mode === "smtp"
          ? "Código enviado automaticamente pelo servidor."
          : `Modo local de teste ativo. Código salvo em work/email-outbox.local.json. Código atual: ${user.emailVerification.code}.`
      : `Envio automático indisponível nesta máquina. Código gerado: ${user.emailVerification.code}.`;

    if (openedFromDeveloper) {
      setConfigStatus(`${deliveryLabel} Usuário: ${user.username}.`, delivery.ok ? "success" : "warning");
    } else {
      openEmailVerificationStep(user, deliveryLabel, delivery.ok ? "success" : "warning");
      setAuthStatus(deliveryLabel, delivery.ok ? "success" : "warning");
    }
    return true;
  }

  async function loginUser(username, password) {
    const normalized = String(username || "").trim().toLowerCase();
    let user = authUsers.find((item) => item.username.trim().toLowerCase() === normalized);
    if (!user) {
      const synced = await refreshSecurityFromSharedSource();
      if (synced) {
        user = authUsers.find((item) => item.username.trim().toLowerCase() === normalized);
      }
    }
    if (!user) {
      setAuthStatus("Usuário ou senha inválidos.", "error");
      return;
    }
    if (user.status === "blocked") {
      setAuthStatus("Este usuário está bloqueado. Fale com o administrador.", "error");
      return;
    }
    if (user.role === "developer") {
      try {
        const result = await requestDeveloperLogin(username, password);
        serverSecuritySession = {
          developerLoggedIn: Boolean(result?.developerLoggedIn),
          configUnlocked: Boolean(result?.configUnlocked),
          username: typeof result?.username === "string" ? result.username : user.username,
        };
      } catch (error) {
        const message = String(error?.message || "");
        if (message.includes("developer-auth-not-configured")) {
          setAuthStatus("Login do desenvolvedor ainda não está configurado no servidor. Configure as variáveis da Vercel para liberar este acesso em produção.", "error");
        } else {
          setAuthStatus("Usuário ou senha inválidos.", "error");
        }
        return;
      }
      currentUser = user;
      isConfigUnlocked = Boolean(serverSecuritySession.configUnlocked);
      saveSessionFlag(SESSION_KEYS.configUnlocked, isConfigUnlocked);
      clearPendingVerificationStep();
      saveAuthSession(user);
      setAuthStatus("Login de desenvolvedor realizado com sucesso.", "success");
      applyAccessRules();
      renderAll();
      selectTab("home");
      return;
    }
    if (user.password !== password) {
      setAuthStatus("Usuário ou senha inválidos.", "error");
      return;
    }
    if (user.emailVerification?.status !== "verified") {
      openEmailVerificationStep(
        user,
        "Antes de entrar na Home, confirme o código enviado para o e-mail cadastrado.",
        "warning"
      );
      return;
    }
    if (user.status !== "active") {
      user.status = "active";
      user.updatedAt = new Date().toISOString();
      refreshAuthStorage();
      renderDeveloperArea();
    }
    currentUser = user;
    clearPendingVerificationStep();
    saveAuthSession(user);
    setAuthStatus("Login realizado com sucesso.", "success");
    applyAccessRules();
    renderAll();
    if (userNeedsPasswordChange(user)) {
      openPasswordChangeModal(user);
      return;
    }
    selectTab("home");
  }

  async function registerUser(username, email, document, birthDate, company, password) {
    const cleanUsername = String(username || "").trim();
    const cleanEmail = String(email || "").trim();
    const cleanDocument = String(document || "").trim();
    const normalizedBirthDate = normalizeBirthDate(birthDate);
    if (!cleanUsername || !password) {
      setAuthStatus("Preencha usuário, e-mail, CPF/CNPJ e senha para criar o cadastro.", "warning");
      return false;
    }
    if (!cleanEmail || !cleanDocument) {
      setAuthStatus("Preencha e-mail e CPF/CNPJ para continuar.", "warning");
      return false;
    }
    const passwordError = validateSecurePassword(password);
    if (passwordError) {
      setAuthStatus(passwordError, "warning");
      return false;
    }
    const emailError = validateEmailAddress(cleanEmail);
    if (emailError) {
      setAuthStatus(emailError, "warning");
      return false;
    }
    const documentError = validateBrazilianDocument(cleanDocument);
    if (documentError) {
      setAuthStatus(documentError, "warning");
      return false;
    }
    const exists = authUsers.some((user) => user.username.trim().toLowerCase() === cleanUsername.toLowerCase());
    if (exists) {
      setAuthStatus("Este usuário já existe. Use o login ou escolha outro nome.", "warning");
      return false;
    }
    const user = normalizeUserRecord({
      username: cleanUsername,
      password,
      email: cleanEmail,
      document: cleanDocument,
      birthDate: normalizedBirthDate,
      company,
      role: "user",
      status: "active",
      groupId: "profissional",
      emailVerification: {
        status: "pending",
        code: "",
        sentAt: "",
        verifiedAt: "",
        expiresAt: "",
        resendAvailableAt: "",
        lastDeliveryMode: "manual",
      },
      documentVerification: getDocumentVerificationSnapshot(cleanDocument, normalizedBirthDate),
    }, authUsers.length);
    authUsers.push(user);
    saveAuthUsers(authUsers);
    saveAccessControl(accessControl);
    renderDeveloperArea();
    setAuthStage("verify");
    await issueEmailVerificationCode(user);
    return true;
  }

  async function confirmEmailVerification(email, code) {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedCode = String(code || "").trim();
    if (!normalizedEmail || !normalizedCode) {
      setAuthStatus("Informe o e-mail e o código de verificação.", "warning");
      return false;
    }
    const user = findAuthUserByEmail(authUsers, normalizedEmail);
    if (!user) {
      setAuthStatus("Não encontramos um cadastro com este e-mail.", "error");
      return false;
    }
    if (user.emailVerification?.status === "verified") {
      currentUser = user.status === "blocked" ? null : user;
      if (currentUser) {
        saveAuthSession(currentUser);
        clearPendingVerificationStep();
        applyAccessRules();
        renderAll();
        selectTab("home");
      }
      setAuthStatus("Este e-mail já foi confirmado.", "success");
      return Boolean(currentUser);
    }
    if (isEmailVerificationExpired(user)) {
      setAuthStatus("Esse código expirou. Gere um novo código para continuar.", "warning");
      openEmailVerificationStep(user, "Esse código expirou. Gere um novo código para continuar.", "warning");
      return false;
    }
    if ((user.emailVerification?.code || "") !== normalizedCode) {
      setAuthStatus("Código de verificação inválido.", "error");
      return false;
    }
    user.emailVerification = {
      ...user.emailVerification,
      status: "verified",
      verifiedAt: new Date().toISOString(),
    };
    user.status = "active";
    user.updatedAt = new Date().toISOString();
    await saveSecuritySharedNow();
    renderDeveloperArea();
    currentUser = user;
    clearPendingVerificationStep();
    saveAuthSession(user);
    applyAccessRules();
    renderAll();
    setAuthStatus("E-mail confirmado com sucesso. Acesso liberado.", "success");
    selectTab("home");
    return true;
  }

  function prepareDeveloperEmailVerification(user, rerenderPermissions = false) {
    void issueEmailVerificationCode(user, { rerenderPermissions, openedFromDeveloper: true });
    return true;
  }

  function applyDeveloperValidationAction(user, action, { rerenderPermissions = false } = {}) {
    if (!user) {
      return false;
    }

    if (action === "send-email-verification") {
      return prepareDeveloperEmailVerification(user, rerenderPermissions);
    }

    if (action === "verify-email") {
      user.emailVerification = {
        ...user.emailVerification,
        status: "verified",
        verifiedAt: new Date().toISOString(),
      };
    } else if (action === "mark-cpf-ready") {
      user.documentVerification = {
        ...getDocumentVerificationSnapshot(user.document, user.birthDate),
        status: buildOfficialCpfVerificationPayload(user) ? "official-ready" : "official-pending-data",
      };
    } else if (action === "verify-cpf-official") {
      const payload = buildOfficialCpfVerificationPayload(user);
      if (!payload) {
        setConfigStatus("Este usuário ainda não possui os dados mínimos para a futura consulta oficial de CPF.", "warning");
        return true;
      }
      user.documentVerification = {
        ...user.documentVerification,
        status: "official-verified",
        source: "manual",
        checkedAt: new Date().toISOString(),
        verifiedAt: new Date().toISOString(),
        message: "CPF marcado manualmente como validado oficialmente. Substitua esta etapa pela API quando ela for conectada.",
      };
    } else {
      return false;
    }

    user.updatedAt = new Date().toISOString();
    refreshAuthStorage();
    renderDeveloperArea();
    if (rerenderPermissions) {
      renderDeveloperUserPermissions(user);
    }
    setConfigStatus("Validação do cadastro atualizada.", "success");
    return true;
  }

  function isVisibleFocusableField(element) {
    if (!element || element.disabled || element.readOnly) {
      return false;
    }
    if (!element.matches("input, select, textarea")) {
      return false;
    }
    if (element.matches('input[type="hidden"], input[type="checkbox"], input[type="radio"]')) {
      return false;
    }
    return element.getClientRects().length > 0;
  }

  function getCurrentTabScope(element) {
    const modal = element.closest(".app-modal");
    if (modal) {
      return null;
    }
    const popover = element.closest(".finish-popover, .color-service-popover");
    if (popover) {
      return null;
    }
    return element.closest(".tab-panel.is-active");
  }

  function getEditableFields(scope) {
    if (!scope) {
      return [];
    }
    return [...scope.querySelectorAll("input, select, textarea")].filter(isVisibleFocusableField);
  }

  function getFocusDescriptor(element, fallbackIndex = -1) {
    if (!element) {
      return null;
    }
    if (element.id) {
      return { type: "id", id: element.id, fallbackIndex };
    }

    const name = element.getAttribute("name");
    const rowSelectors = [
      ["row", "tr[data-row-index]", "rowIndex"],
      ["color", "tr[data-color-row-index]", "colorRowIndex"],
      ["credential", "tr[data-credential-row-index]", "credentialRowIndex"],
      ["m2", "tr[data-m2-row-index]", "m2RowIndex"],
      ["ready", "tr[data-ready-row-index]", "readyRowIndex"],
      ["resin", "tr[data-resin-row-index]", "resinRowIndex"],
    ];

    for (const [type, selector, key] of rowSelectors) {
      const row = element.closest(selector);
      if (row && name) {
        return { type, rowIndex: row.dataset[key], name, fallbackIndex };
      }
    }

    return { type: "fallback", fallbackIndex };
  }

  function resolveFocusDescriptor(descriptor) {
    if (!descriptor) {
      return null;
    }
    if (descriptor.type === "id") {
      return document.getElementById(descriptor.id);
    }

    const rowLookup = {
      row: `tr[data-row-index="${descriptor.rowIndex}"]`,
      color: `tr[data-color-row-index="${descriptor.rowIndex}"]`,
      credential: `tr[data-credential-row-index="${descriptor.rowIndex}"]`,
      m2: `tr[data-m2-row-index="${descriptor.rowIndex}"]`,
      ready: `tr[data-ready-row-index="${descriptor.rowIndex}"]`,
      resin: `tr[data-resin-row-index="${descriptor.rowIndex}"]`,
    };
    const rowSelector = rowLookup[descriptor.type];
    if (rowSelector && descriptor.name) {
      const row = document.querySelector(rowSelector);
      return row?.querySelector(`[name="${CSS.escape(descriptor.name)}"]`) || null;
    }

    return null;
  }

  function focusEditableField(descriptor) {
    requestAnimationFrame(() => {
      let next = resolveFocusDescriptor(descriptor);
      if (!isVisibleFocusableField(next)) {
        const scope = document.querySelector(".tab-panel.is-active");
        const fields = getEditableFields(scope);
        next = fields[descriptor?.fallbackIndex] || null;
      }
      if (!isVisibleFocusableField(next)) {
        return;
      }
      next.focus({ preventScroll: true });
      if (typeof next.select === "function" && next.matches('input:not([type="number"]), textarea')) {
        next.select();
      }
      next.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  }

  function handleManagedTabNavigation(event) {
    if (event.key !== "Tab" || event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }

    const current = event.target;
    if (!isVisibleFocusableField(current)) {
      return;
    }

    const scope = getCurrentTabScope(current);
    const fields = getEditableFields(scope);
    const currentIndex = fields.indexOf(current);
    if (currentIndex === -1) {
      return;
    }

    const nextIndex = currentIndex + (event.shiftKey ? -1 : 1);
    if (nextIndex < 0 || nextIndex >= fields.length) {
      return;
    }

    const nextDescriptor = getFocusDescriptor(fields[nextIndex], nextIndex);
    event.preventDefault();
    current.dispatchEvent(new Event("change", { bubbles: true }));
    focusEditableField(nextDescriptor);
  }

  function resetClientEditor(message = "Selecione um cliente da lista para editar ou preencha os campos acima para criar um novo cadastro.", tone = "neutral") {
    editingClientId = "";
    if (clientsEditorName) clientsEditorName.value = "";
    if (clientsEditorContact) clientsEditorContact.value = "";
    if (clientsEditorCnpj) clientsEditorCnpj.value = "";
    if (clientsEditorNotes) clientsEditorNotes.value = "";
    setStatusMessage(clientsEditorStatus, message, tone);
  }

  function fillClientEditor(client, message = "Cadastro carregado para edição.", tone = "success") {
    if (!client) {
      resetClientEditor();
      return;
    }
    editingClientId = client.id || "";
    if (clientsEditorName) clientsEditorName.value = client.name || "";
    if (clientsEditorContact) clientsEditorContact.value = client.contact || "";
    if (clientsEditorCnpj) clientsEditorCnpj.value = client.cnpj || "";
    if (clientsEditorNotes) clientsEditorNotes.value = client.notes || "";
    setStatusMessage(clientsEditorStatus, message, tone);
  }

  function calculateAllWorkbooks() {
    return {
      workbook: calculateWorkbook(state, config),
      colorWorkbook: calculateColorPrintWorkbook(state, config),
      credentialWorkbook: calculateCredentialWorkbook(state, config),
      m2Workbook: calculateM2WorkbookFromConfig(state, config),
      readyWorkbook: calculateReadyWorkbook(state, config),
      resinWorkbook: calculateResinWorkbook(state, config),
      cardWorkbook: calculateCardWorkbook(state, config),
      flyerWorkbook: calculateFlyerWorkbook(state, config),
      blockSulfiteWorkbook: calculateBlockWorkbook(state, config, "sulfite"),
      blockAutocopiativoWorkbook: calculateBlockWorkbook(state, config, "autocopiativo"),
    };
  }

  function buildQuoteStateSnapshot() {
    return {
      calcMode: state.calcMode,
      m2CalcMode: state.m2CalcMode,
      presets: deepClone(state.presets),
      rows: deepClone(state.rows),
      colorPrintItems: deepClone(state.colorPrintItems),
      credentialItems: deepClone(state.credentialItems),
      m2Items: deepClone(state.m2Items),
      readyItems: deepClone(state.readyItems),
      resinItems: deepClone(state.resinItems),
      cardItems: deepClone(state.cardItems),
      flyerItems: deepClone(state.flyerItems),
      blockItems: deepClone(state.blockItems),
      client: deepClone(state.client),
      company: deepClone(state.company),
      paymentTerms: state.paymentTerms,
      quoteNotes: state.quoteNotes,
    };
  }

  function applyQuoteStateSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return false;
    }
    const restored = mergeState(snapshot, config);
    const preservedCollections = {
      clients: state.clients,
      quoteHistory: state.quoteHistory,
      workOrders: state.workOrders,
    };
    Object.assign(state, restored, preservedCollections);
    return true;
  }

  function buildQuoteRecordFromCurrentState() {
    const {
      workbook,
      colorWorkbook,
      credentialWorkbook,
      m2Workbook,
      readyWorkbook,
      resinWorkbook,
      cardWorkbook,
      flyerWorkbook,
      blockSulfiteWorkbook,
      blockAutocopiativoWorkbook,
    } = calculateAllWorkbooks();
    const title = state.client.name.trim() || `Orçamento ${new Date().toLocaleDateString("pt-BR")}`;
    const summary = createQuoteText(
      state,
      workbook,
      colorWorkbook,
      credentialWorkbook,
      m2Workbook,
      readyWorkbook,
      resinWorkbook,
      cardWorkbook,
      flyerWorkbook,
      blockSulfiteWorkbook,
      blockAutocopiativoWorkbook
    ).split("\n").slice(0, 10).join(" • ");
    const total = workbook.totals.totalGeneral
      + colorWorkbook.totals.totalGeneral
      + credentialWorkbook.totals.totalGeneral
      + m2Workbook.totals.totalGeneral
      + readyWorkbook.totals.totalGeneral
      + resinWorkbook.totals.totalGeneral
      + cardWorkbook.totals.totalGeneral
      + flyerWorkbook.totals.totalGeneral
      + blockSulfiteWorkbook.totals.totalGeneral
      + blockAutocopiativoWorkbook.totals.totalGeneral;
    const savedAt = new Date().toISOString();

    return {
      id: `quote-${Date.now()}`,
      title,
      clientName: state.client.name.trim(),
      clientContact: state.client.contact.trim(),
      clientCnpj: state.client.cnpj.trim(),
      total,
      summary,
      status: "pending",
      items: createQuoteHistoryItems(
        state,
        workbook,
        colorWorkbook,
        credentialWorkbook,
        m2Workbook,
        readyWorkbook,
        resinWorkbook,
        cardWorkbook,
        flyerWorkbook,
        blockSulfiteWorkbook,
        blockAutocopiativoWorkbook
      ),
      paymentTerms: state.paymentTerms.trim(),
      quoteNotes: state.quoteNotes.trim(),
      snapshot: buildQuoteStateSnapshot(),
      createdAt: savedAt,
      updatedAt: savedAt,
      osId: "",
    };
  }

  function saveQuoteRecord(record) {
    if (editingQuoteId) {
      const existingIndex = state.quoteHistory.findIndex((item) => item.id === editingQuoteId);
      if (existingIndex >= 0) {
        const current = state.quoteHistory[existingIndex];
        const updated = {
          ...current,
          ...record,
          id: current.id,
          createdAt: current.createdAt,
          status: current.status || record.status,
          osId: current.osId || "",
          updatedAt: new Date().toISOString(),
        };
        state.quoteHistory[existingIndex] = updated;
        if (updated.osId) {
          const workOrder = state.workOrders.find((item) => item.id === updated.osId);
          if (workOrder) {
            workOrder.quoteTitle = updated.title;
            workOrder.clientName = updated.clientName;
            workOrder.clientContact = updated.clientContact;
            workOrder.clientCnpj = updated.clientCnpj;
            workOrder.total = updated.total;
            workOrder.paymentTerms = updated.paymentTerms;
            workOrder.items = deepClone(updated.items || []);
            workOrder.updatedAt = new Date().toISOString();
            workOrder.timeline.unshift(createWorkOrderTimelineEntry("Orçamento atualizado", "A OS recebeu as novas informações do orçamento salvo."));
          }
        }
        editingQuoteId = "";
        return updated;
      }
    }

    state.quoteHistory.unshift(record);
    state.quoteHistory = state.quoteHistory.slice(0, 50);
    return record;
  }

  function createWorkOrderTimelineEntry(label, note = "") {
    return {
      id: `os-event-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      label,
      note,
      at: new Date().toISOString(),
    };
  }

  function getCurrentWorkOrderUserMeta() {
    const username = String(currentUser?.username || "usuario").trim() || "usuario";
    const userId = String(currentUser?.id || "anonymous").trim() || "anonymous";
    const prefix = username
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "USR";
    return { username, userId, prefix };
  }

  function getNextWorkOrderNumber() {
    const currentYear = new Date().getFullYear();
    const userMeta = getCurrentWorkOrderUserMeta();
    const userOrders = state.workOrders.filter((item) => item.createdByUserId === userMeta.userId);
    const nextSequence = userOrders.reduce((max, item) => Math.max(max, Number(item.sequenceNumber || 0)), 0) + 1;
    return {
      sequenceNumber: nextSequence,
      osNumber: `${userMeta.prefix}-${currentYear}-${String(nextSequence).padStart(4, "0")}`,
      ...userMeta,
    };
  }

  function createWorkOrderFromQuote(quote, options = {}) {
    const createdAt = new Date().toISOString();
    const numbering = getNextWorkOrderNumber();
    const workOrder = {
      id: `os-${Date.now()}`,
      osNumber: numbering.osNumber,
      quoteId: quote.id,
      quoteTitle: quote.title || "Orçamento",
      clientName: quote.clientName || state.client.name || "",
      clientContact: quote.clientContact || state.client.contact || "",
      clientCnpj: quote.clientCnpj || state.client.cnpj || "",
      total: Number(quote.total || 0),
      status: "created",
      priority: options.priority || "normal",
      owner: options.owner || "",
      promisedDate: options.promisedDate || "",
      deliveryDate: "",
      deliveryAddress: options.deliveryAddress || state.company.address || "",
      paymentTerms: quote.paymentTerms || state.paymentTerms || "",
      paymentMethod: options.paymentMethod || "",
      entryPaid: Boolean(options.entryPaid),
      entryAmount: options.entryAmount === "" || options.entryAmount === null || typeof options.entryAmount === "undefined"
        ? ""
        : toMoneyNumber(options.entryAmount),
      totalPaid: Boolean(options.totalPaid),
      productionNotes: options.productionNotes || "",
      deliveryNotes: "",
      internalNotes: options.internalNotes || "",
      createdAt,
      updatedAt: createdAt,
      createdByUserId: numbering.userId,
      createdByUsername: numbering.username,
      sequenceNumber: numbering.sequenceNumber,
      timeline: [
        createWorkOrderTimelineEntry("OS gerada", `Criada a partir do orçamento ${quote.title || quote.id}.`),
      ],
      items: Array.isArray(quote.items) ? deepClone(quote.items) : [],
    };

    state.workOrders.unshift(workOrder);
    quote.osId = workOrder.id;
    quote.status = "converted";
    quote.updatedAt = createdAt;
    return workOrder;
  }

  function syncQuoteStatusFromWorkOrder(workOrder) {
    if (!workOrder?.quoteId) {
      return;
    }
    const quote = state.quoteHistory.find((item) => item.id === workOrder.quoteId);
    if (!quote) {
      return;
    }
    if (workOrder.status === "delivered" || workOrder.status === "closed") {
      quote.status = "completed";
    } else if (workOrder.status === "cancelled") {
      quote.status = "cancelled";
    } else {
      quote.status = "converted";
    }
    quote.osId = workOrder.id;
    quote.updatedAt = new Date().toISOString();
  }

  function persistLocalOnly() {
    saveToStorage(STORAGE_KEYS.state, state);
    saveToStorage(STORAGE_KEYS.config, config);
    saveAuthUsers(authUsers);
    saveAccessControl(accessControl);
  }

  function createSharedPayload() {
    return {
      sharedState: {
        clients: deepClone(state.clients),
        quoteHistory: deepClone(state.quoteHistory),
        workOrders: deepClone(state.workOrders),
      },
      security: {
        authUsers: deepClone(authUsers),
        accessControl: deepClone(accessControl),
      },
      config: deepClone(config),
    };
  }

  function applySharedPayload(payload, successMessage) {
    if (!payload || typeof payload !== "object") {
      return;
    }

    const sourceState = payload.sharedState || payload.state || {};
    const sharedCollections = normalizeSharedCollections(sourceState);
    state.clients = sharedCollections.clients;
    state.quoteHistory = sharedCollections.quoteHistory;
    state.workOrders = sharedCollections.workOrders;
    const sharedSecurity = normalizeSharedSecurity(payload.security || {});
    authUsers = mergeAuthUserCollections(authUsers, sharedSecurity.authUsers);
    accessControl = sharedSecurity.accessControl;
    currentUser = loadAuthSession(authUsers);
    if (payload.config && typeof payload.config === "object") {
      Object.assign(config, mergeConfig(payload.config));
      cleanupHiddenImpressosEntries(config, state);
      ensureAutomaticPlastificationService(config);
    }
    persistLocalOnly();
    renderAll();
    if (successMessage) {
      setSyncStatus(successMessage, "success");
    }
  }

  async function refreshSecurityFromSharedSource() {
    try {
      const shared = await requestSharedState("GET");
      const payload = shared?.payload && typeof shared.payload === "object" ? shared.payload : shared;
      const sharedSecurity = normalizeSharedSecurity(payload?.security || {});
      authUsers = mergeAuthUserCollections(authUsers, sharedSecurity.authUsers);
      accessControl = sharedSecurity.accessControl;
      persistLocalOnly();
      sharedUpdatedAt = shared?.updatedAt || sharedUpdatedAt;
      return true;
    } catch {
      return false;
    }
  }

  async function flushSharedSave(force = false) {
    if (!sharedBootstrapComplete && !force) {
      return;
    }

    if (sharedSyncInFlight) {
      sharedSyncQueued = true;
      return;
    }

    const payload = createSharedPayload();
    const serialized = JSON.stringify(payload);
    if (!force && serialized === lastSharedSnapshot) {
      return;
    }

    sharedSyncInFlight = true;
    setSyncStatus("Salvando alterações na base compartilhada...", "warning");

    try {
      const result = await requestSharedState("PUT", payload);
      lastSharedSnapshot = serialized;
      sharedUpdatedAt = result.updatedAt || new Date().toISOString();
      setSyncStatus("Tudo salvo e compartilhado entre os computadores.", "success");
    } catch {
      setSyncStatus("Não foi possível atualizar a base compartilhada agora. O app continua funcionando nesta máquina.", "error");
    } finally {
      sharedSyncInFlight = false;
      if (sharedSyncQueued) {
        sharedSyncQueued = false;
        void flushSharedSave(force);
      }
    }
  }

  async function saveSharedNow(force = true) {
    if (sharedSyncTimer) {
      clearTimeout(sharedSyncTimer);
      sharedSyncTimer = null;
    }

    while (sharedSyncInFlight) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    await flushSharedSave(force);
  }

  async function saveSecuritySharedNow() {
    saveAuthUsers(authUsers);
    saveAccessControl(accessControl);

    const nonDeveloperUsers = authUsers.filter((user) => user.id !== DEVELOPER_ACCOUNT.id);
    const usersToPersist = nonDeveloperUsers.length > 0 ? nonDeveloperUsers : authUsers;
    if (usersToPersist.length > 0) {
      try {
        await Promise.all(usersToPersist.map((user) => requestAuthUserSave(user, accessControl)));
        persistLocalOnly();
        setSyncStatus("Cadastro salvo na base compartilhada.", "success");
        return true;
      } catch {
        setSyncStatus("Não foi possível usar o endpoint de cadastro. Tentando sincronização completa...", "warning");
      }
    }

    while (sharedSyncInFlight) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    let basePayload = null;
    try {
      const currentShared = await requestSharedState("GET");
      basePayload = currentShared?.payload && typeof currentShared.payload === "object"
        ? currentShared.payload
        : null;
    } catch {
      basePayload = null;
    }

    const baseState = basePayload?.sharedState || basePayload?.state || {};
    const baseSecurity = normalizeSharedSecurity(basePayload?.security || {});
    const mergedPayload = {
      ...(basePayload || {}),
      sharedState: normalizeSharedCollections(baseState),
      security: {
        authUsers: mergeAuthUserCollections(authUsers, baseSecurity.authUsers),
        accessControl,
      },
      config: basePayload?.config && typeof basePayload.config === "object" ? basePayload.config : deepClone(config),
    };

    authUsers = mergedPayload.security.authUsers;
    const serialized = JSON.stringify(mergedPayload);
    sharedSyncInFlight = true;
    setSyncStatus("Salvando cadastro na base compartilhada...", "warning");
    try {
      const result = await requestSharedState("PUT", mergedPayload);
      lastSharedSnapshot = serialized;
      sharedUpdatedAt = result.updatedAt || new Date().toISOString();
      persistLocalOnly();
      setSyncStatus("Cadastro salvo na base compartilhada.", "success");
      return true;
    } catch {
      persistLocalOnly();
      setSyncStatus("Não foi possível salvar o cadastro na base compartilhada agora. Ele ficou salvo nesta máquina.", "error");
      return false;
    } finally {
      sharedSyncInFlight = false;
    }
  }

  function queueSharedSave(force = false) {
    if (sharedSyncTimer) {
      clearTimeout(sharedSyncTimer);
    }

    if (force) {
      return saveSharedNow(true);
    }

    if (!sharedBootstrapComplete) {
      return;
    }

    sharedSyncTimer = setTimeout(() => {
      sharedSyncTimer = null;
      void flushSharedSave(false);
    }, 500);
    return Promise.resolve();
  }

  async function refreshSharedState(showMessage = false) {
    if (!sharedBootstrapComplete || sharedSyncInFlight) {
      return { status: "skipped" };
    }

    try {
      const result = await requestSharedState("GET");
      if (!result?.exists || !result.payload) {
        return { status: "empty" };
      }

      const serialized = JSON.stringify(result.payload);
      if (serialized === lastSharedSnapshot || result.updatedAt === sharedUpdatedAt) {
        return { status: "unchanged" };
      }

      sharedUpdatedAt = result.updatedAt || "";
      lastSharedSnapshot = serialized;
      applySharedPayload(
        result.payload,
        showMessage ? "Dados compartilhados atualizados com mudanças feitas em outro computador." : ""
      );
      return { status: "updated" };
    } catch {
      if (showMessage) {
        setSyncStatus("A base compartilhada não respondeu agora. Tente novamente em instantes.", "error");
      }
      return { status: "error" };
    }
  }

  async function bootstrapSharedState() {
    setSyncStatus("Conectando a base compartilhada...", "warning");

    try {
      const result = await requestSharedState("GET");
      sharedBootstrapComplete = true;

      if (result?.exists && result.payload) {
        sharedUpdatedAt = result.updatedAt || "";
        lastSharedSnapshot = JSON.stringify(result.payload);
        applySharedPayload(result.payload, "Base compartilhada conectada com sucesso.");
        return;
      }

      persistLocalOnly();
      await flushSharedSave(true);
    } catch {
      sharedBootstrapComplete = true;
      setSyncStatus("Não foi possível conectar a base compartilhada agora. O app segue disponível nesta máquina.", "error");
    }
  }

  function startSharedRefresh() {
    if (sharedRefreshHandle || typeof window === "undefined") {
      return;
    }

    sharedRefreshHandle = window.setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) {
        return;
      }
      reloadAuthContextFromStorage();
      void refreshSharedState(false);
    }, SHARED_SYNC_INTERVAL_MS);

    window.addEventListener("focus", () => {
      reloadAuthContextFromStorage();
      renderAll();
      void refreshSharedState(true);
    });

    window.addEventListener("storage", (event) => {
      if (!event.key || ![
        STORAGE_KEYS.authUsers,
        STORAGE_KEYS.accessControl,
        STORAGE_KEYS.authSession,
      ].includes(event.key)) {
        return;
      }
      reloadAuthContextFromStorage();
      renderAll();
    });
  }

  function focusConfigPasswordField() {
    requestAnimationFrame(() => {
      document.getElementById("config-password-input")?.focus();
    });
  }

  function getConfigAccessSettings() {
    const settings = config.security?.configAccess || {};
    return {
      mode: settings.mode === "open" ? "open" : "password",
      password: typeof settings.password === "string" ? settings.password : "",
    };
  }

  function syncConfigLockWithMode() {
    if (getConfigAccessSettings().mode === "open" && !isConfigUnlocked) {
      isConfigUnlocked = true;
      saveSessionFlag(SESSION_KEYS.configUnlocked, true);
    }
  }

  function updateConfigAccessUi() {
    syncConfigLockWithMode();
    const locked = !isConfigUnlocked;
    const configButtons = [
      document.getElementById("save-config-button"),
      document.getElementById("export-config-button"),
      document.getElementById("import-config-button"),
      document.getElementById("reset-config-button"),
    ];

    configButtons.forEach((button) => {
      if (button) {
        button.disabled = locked;
      }
    });

    if (spiralDiscountInput) {
      spiralDiscountInput.disabled = locked;
    }

    if (lockConfigButton) {
      lockConfigButton.hidden = locked;
      lockConfigButton.disabled = false;
    }
  }

  function lockConfiguration(message = "Configuração bloqueada novamente.", tone = "warning") {
    if (getConfigAccessSettings().mode === "open") {
      isConfigUnlocked = true;
      saveSessionFlag(SESSION_KEYS.configUnlocked, true);
      renderConfig();
      setConfigStatus("A configuração está em modo livre. Para bloquear, ative a proteção em Minha conta.", "warning");
      return;
    }
    isConfigUnlocked = false;
    saveSessionFlag(SESSION_KEYS.configUnlocked, false);
    renderConfig();
    setConfigStatus(message, tone);
    focusConfigPasswordField();
  }

  async function unlockConfiguration(password) {
    const accessSettings = getConfigAccessSettings();
    if (accessSettings.mode === "open") {
      isConfigUnlocked = true;
      saveSessionFlag(SESSION_KEYS.configUnlocked, true);
      renderConfig();
      setConfigStatus("Configuração liberada porque o modo livre está ativo.", "success");
      return true;
    }

    if (!String(password || "").trim()) {
      setConfigStatus("Digite a senha da configuração para continuar.", "warning");
      focusConfigPasswordField();
      return false;
    }

    if (accessSettings.password && String(password) === accessSettings.password) {
      isConfigUnlocked = true;
      saveSessionFlag(SESSION_KEYS.configUnlocked, true);
      renderConfig();
      setConfigStatus("Configuração desbloqueada nesta sessão.", "success");
      return true;
    }

    try {
      const result = await requestConfigUnlock(password);
      serverSecuritySession = {
        ...serverSecuritySession,
        developerLoggedIn: Boolean(result?.developerLoggedIn ?? serverSecuritySession.developerLoggedIn),
        configUnlocked: Boolean(result?.configUnlocked),
        username: typeof result?.username === "string" ? result.username : serverSecuritySession.username,
      };
    } catch {
      setConfigStatus("Senha incorreta. A configuração continua bloqueada.", "error");
      focusConfigPasswordField();
      return false;
    }

    isConfigUnlocked = Boolean(serverSecuritySession.configUnlocked);
    saveSessionFlag(SESSION_KEYS.configUnlocked, isConfigUnlocked);
    renderConfig();
    setConfigStatus("Configuração desbloqueada nesta sessão.", "success");
    return true;
  }

  function selectTab(tabName) {
    const logged = currentUser?.status === "active";
    if (!logged && tabName !== "login") {
      tabName = "login";
    } else if (logged && tabName === "login") {
      tabName = "home";
    } else if (logged) {
      const permissions = getUserTabPermissions(accessControl, currentUser);
      const allowedSpecial = tabName === "home";
      if (!allowedSpecial && !permissions[tabName]) {
        const fallback = tabButtons.find((button) => {
          const target = button.dataset.tabTarget;
          return (target === "home" || permissions[target]) && !button.hidden;
        });
        tabName = fallback?.dataset.tabTarget || "home";
      }
    }

    tabButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.tabTarget === tabName);
    });
    tabPanels.forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.tabPanel === tabName);
    });

    if (tabName === "configuracao") {
      activeConfigSection = CONFIG_SECTIONS.includes(lastConfigSourceTab) ? lastConfigSourceTab : "calculo";
      saveConfigSection(activeConfigSection);
      renderConfig();
      if (!isConfigUnlocked) {
        setConfigStatus("Digite a senha para acessar a configuração.", "warning");
        focusConfigPasswordField();
      }
    } else if (CONFIG_SECTIONS.includes(tabName)) {
      lastConfigSourceTab = tabName;
    }
  }

  function persist() {
    persistLocalOnly();
    queueSharedSave(false);
  }

  function setAccountSettingsStatus(message, tone = "neutral") {
    setStatusMessage(document.getElementById("account-settings-status"), message, tone);
  }

  function renderAccountSettings() {
    const fields = {
      username: document.getElementById("account-username"),
      email: document.getElementById("account-email"),
      document: document.getElementById("account-document"),
      birthDate: document.getElementById("account-birth-date"),
      userCompany: document.getElementById("account-user-company"),
      companyName: document.getElementById("account-company-name"),
      companyCnpj: document.getElementById("account-company-cnpj"),
      companyContact: document.getElementById("account-company-contact"),
      companyAddress: document.getElementById("account-company-address"),
      logoPreview: document.getElementById("account-company-logo-preview"),
      protectedMode: document.getElementById("account-config-protected"),
      openMode: document.getElementById("account-config-open"),
      configPassword: document.getElementById("account-config-password"),
    };

    if (fields.username) fields.username.value = currentUser?.username || "";
    if (fields.email) fields.email.value = currentUser?.email || "";
    if (fields.document) fields.document.value = currentUser?.document || "";
    if (fields.birthDate) fields.birthDate.value = currentUser?.birthDate || "";
    if (fields.userCompany) fields.userCompany.value = currentUser?.company || "";
    if (fields.companyName) fields.companyName.value = state.company.name || "";
    if (fields.companyCnpj) fields.companyCnpj.value = state.company.cnpj || "";
    if (fields.companyContact) fields.companyContact.value = state.company.contact || "";
    if (fields.companyAddress) fields.companyAddress.value = state.company.address || "";

    if (fields.logoPreview) {
      fields.logoPreview.innerHTML = state.company.logoDataUrl
        ? `<img src="${escapeAttribute(state.company.logoDataUrl)}" alt="Logo atual da empresa">`
        : `<span>Nenhuma logo personalizada cadastrada.</span>`;
    }

    const accessSettings = getConfigAccessSettings();
    if (fields.protectedMode) fields.protectedMode.checked = accessSettings.mode !== "open";
    if (fields.openMode) fields.openMode.checked = accessSettings.mode === "open";
    if (fields.configPassword) {
      fields.configPassword.value = "";
      fields.configPassword.placeholder = accessSettings.password
        ? "Senha personalizada já cadastrada. Digite uma nova para trocar."
        : "Digite uma senha para proteger a configuração";
    }
  }

  function renderPresetControls() {
    const calcModeSelect = document.getElementById("calc-mode-select");
    const m2CalcModeSelect = document.getElementById("m2-calc-mode-select");
    const presetPrintType = document.getElementById("preset-print-type");
    const presetSize = document.getElementById("preset-size");
    const presetPrintMode = document.getElementById("preset-print-mode");
    const presetFinishing = document.getElementById("preset-finishing");
    const presetCover = document.getElementById("preset-cover");
    const presetCoverPaper = document.getElementById("preset-cover-paper");
    const presetBackCover = document.getElementById("preset-back-cover");
    const presetBackCoverPaper = document.getElementById("preset-back-cover-paper");
    const presetSpiralOption = document.getElementById("preset-spiral-option");

    if (calcModeSelect) calcModeSelect.value = state.calcMode;
    if (m2CalcModeSelect) m2CalcModeSelect.value = state.m2CalcMode;
    if (presetPrintType) presetPrintType.innerHTML = buildOptions(OPTIONS.printTypes, state.presets.printType);
    if (presetSize) presetSize.innerHTML = buildOptions(OPTIONS.sizes, state.presets.size);
    if (presetPrintMode) presetPrintMode.innerHTML = buildOptions(OPTIONS.printModes, state.presets.printMode);
    if (presetFinishing) presetFinishing.innerHTML = buildOptions(OPTIONS.finishing, state.presets.finishing);
    if (presetCover) presetCover.innerHTML = buildOptions(OPTIONS.coverTypes, state.presets.coverType);
    if (presetCoverPaper) presetCoverPaper.innerHTML = buildOptions(OPTIONS.coverPapers, state.presets.coverPaper);
    if (presetBackCover) presetBackCover.innerHTML = buildOptions(OPTIONS.backCoverTypes, state.presets.backCoverType);
    if (presetBackCoverPaper) presetBackCoverPaper.innerHTML = buildOptions(OPTIONS.coverPapers, state.presets.backCoverPaper);
    if (presetSpiralOption) presetSpiralOption.innerHTML = buildOptions(OPTIONS.spiralOptions, state.presets.spiralOption);
  }

  function renderClientFields() {
    const clientName = document.getElementById("client-name");
    const clientContact = document.getElementById("client-contact");
    const clientCnpj = document.getElementById("client-cnpj");
    const paymentTerms = document.getElementById("payment-terms");
    const quoteNotes = document.getElementById("quote-notes");
    const companyName = document.getElementById("company-name");
    const companyCnpj = document.getElementById("company-cnpj");
    const companyContact = document.getElementById("company-contact");
    const companyAddress = document.getElementById("company-address");

    if (clientName) clientName.value = state.client.name;
    if (clientContact) clientContact.value = state.client.contact;
    if (clientCnpj) clientCnpj.value = state.client.cnpj;
    if (paymentTerms) paymentTerms.value = state.paymentTerms;
    if (quoteNotes) quoteNotes.value = state.quoteNotes;
    if (companyName) companyName.value = state.company.name;
    if (companyCnpj) companyCnpj.value = state.company.cnpj;
    if (companyContact) companyContact.value = state.company.contact;
    if (companyAddress) companyAddress.value = state.company.address;
  }

  function renderConfig() {
    try {
      configSections.innerHTML = isConfigUnlocked
        ? createConfigSectionsMarkup(config, configViewMode, activeConfigSection)
        : createConfigLockedMarkup();
    } catch (error) {
      console.error("Falha ao renderizar a aba de configuração.", error);
      configSections.innerHTML = createConfigErrorMarkup(error?.message || "Erro inesperado ao montar a configuração.");
      setConfigStatus("A configuração encontrou um erro de renderização, mas o restante do app continua ativo.", "error");
    }
    if (spiralDiscountInput) {
      spiralDiscountInput.value = config.spiralPlasticDiscount;
    }
    updateConfigAccessUi();
  }

  function saveConfiguration() {
    persist();
    renderAll();
    setConfigStatus("Alterações salvas com sucesso.", "success");
    const button = document.getElementById("save-config-button");
    if (button) {
      const original = button.textContent;
      button.textContent = "Alterações salvas";
      setTimeout(() => {
        button.textContent = original;
      }, 1500);
    }
  }

  function removeConfigRow(prefix, rowIndex) {
    const array = getConfigArrayByPrefix(config, prefix);
    if (!Array.isArray(array) || array.length <= 1 || !array[rowIndex]) {
      return false;
    }
    array.splice(rowIndex, 1);
    return true;
  }

  function removeM2Finish(rowIndex) {
    const finish = config.m2Finishes?.[rowIndex];
    if (!finish || config.m2Finishes.length <= 1) {
      return false;
    }
    config.m2Finishes.splice(rowIndex, 1);
    state.m2Items.forEach((row) => {
      row.finishIds = Array.isArray(row.finishIds) ? row.finishIds.filter((id) => id !== finish.id) : [];
      if (row.finishOverrides && typeof row.finishOverrides === "object") {
        delete row.finishOverrides[finish.id];
      }
    });
    return true;
  }

  function removeCatalogProduct(tab, visibleIndex) {
    const products = config.catalogSections.filter((item) => item?.tab === tab);
    const product = products[visibleIndex];
    if (!product) {
      return false;
    }

    const sourceIndex = config.catalogSections.findIndex((item) => item?.id === product.id && item?.tab === tab);
    if (sourceIndex === -1) {
      return false;
    }

    config.catalogSections.splice(sourceIndex, 1);
    if (tab === "m2") {
      const removedPricingKey = product.pricingKey;
      const isBaseKey = M2_CATALOG.some((item) => item.configKey === removedPricingKey);
      if (removedPricingKey && !isBaseKey) {
        delete config.m2Pricing[removedPricingKey];
      }
      state.m2Items.forEach((row) => {
        if (row.productId === product.id) {
          row.productId = M2_CATALOG[0].id;
        }
      });
    }
    if (tab === "impressos") {
      const removedPricingKey = product.customPricingKey;
      if (removedPricingKey) {
        delete config.colorProductPricing[removedPricingKey];
      }
      state.colorPrintItems.forEach((row) => {
        if (row.productPresetId === product.id) {
          row.productPresetId = "";
        }
      });
    }
    if (tab === "prontos") {
      const removedPricingKey = product.readyPricingKey;
      if (removedPricingKey) {
        delete config.readyProductPricing[removedPricingKey];
      }
      state.readyItems.forEach((row) => {
        if (row.productId === product.id) {
          row.productId = "";
          row.variantIndex = 0;
        }
      });
    }
    return true;
  }

  function removeCombinationService(index) {
    const service = config.combinationServices?.[index];
    if (!service) {
      return false;
    }
    config.combinationServices.splice(index, 1);
    state.colorPrintItems.forEach((row) => {
      row.serviceIds = Array.isArray(row.serviceIds) ? row.serviceIds.filter((id) => id !== service.id) : [];
      if (row.serviceOverrides && typeof row.serviceOverrides === "object") {
        delete row.serviceOverrides[service.id];
      }
    });
    return true;
  }

  function confirmAppAction(options = {}) {
    const {
      kicker = "Confirmação",
      title = "Confirmar ação",
      message = "Deseja realmente continuar?",
      confirmLabel = "Confirmar",
      danger = true,
    } = options;

    if (!confirmModal || !confirmModalKicker || !confirmModalTitle || !confirmModalMessage || !confirmModalConfirm || !confirmModalCancel) {
      return Promise.resolve(true);
    }

    confirmModalKicker.textContent = kicker;
    confirmModalTitle.textContent = title;
    confirmModalMessage.textContent = message;
    confirmModalConfirm.textContent = confirmLabel;
    confirmModalConfirm.classList.toggle("button-danger", danger);
    confirmModalConfirm.classList.toggle("button-primary", !danger);
    confirmModal.hidden = false;
    document.body.style.overflow = "hidden";

    return new Promise((resolve) => {
      let settled = false;

      const finish = (result) => {
        if (settled) {
          return;
        }
        settled = true;
        confirmModal.hidden = true;
        document.body.style.overflow = "";
        confirmModalConfirm.removeEventListener("click", onConfirm);
        confirmModalCancel.removeEventListener("click", onCancel);
        confirmModal.removeEventListener("click", onBackdrop);
        document.removeEventListener("keydown", onKeydown);
        resolve(result);
      };

      const onConfirm = () => finish(true);
      const onCancel = () => finish(false);
      const onBackdrop = (event) => {
        if (event.target instanceof HTMLElement && event.target.hasAttribute("data-modal-close")) {
          finish(false);
        }
      };
      const onKeydown = (event) => {
        if (event.key === "Escape") {
          finish(false);
        }
      };

      confirmModalConfirm.addEventListener("click", onConfirm);
      confirmModalCancel.addEventListener("click", onCancel);
      confirmModal.addEventListener("click", onBackdrop);
      document.addEventListener("keydown", onKeydown);
      confirmModalConfirm.focus();
    });
  }

  function confirmConfigDelete(message) {
    return confirmAppAction({
      kicker: "Exclusão",
      title: "Confirmar exclusão",
      message,
      confirmLabel: "Excluir",
      danger: true,
    });
  }

  function renderClientsTab() {
    document.getElementById("clients-count").textContent = formatInteger(state.clients.length);
    document.getElementById("clients-latest").textContent = state.clients[0]?.name || "Nenhum cliente salvo";
    clientsList.innerHTML = state.clients.length
      ? state.clients
          .map(
            (client) => `
              <article class="list-card" data-client-id="${escapeHtml(client.id)}">
                <div>
                  <h3>${escapeHtml(client.name || "Sem nome")}</h3>
                  <p>${escapeHtml(client.contact || "Sem contato")}</p>
                  <p class="list-meta">${escapeHtml(client.cnpj || "Sem CNPJ")}</p>
                  ${client.notes ? `<p class="list-notes">${escapeHtml(client.notes)}</p>` : ""}
                  <p class="list-meta">Criado em ${escapeHtml(formatDateTime(client.createdAt) || "data indisponível")}</p>
                </div>
                <div class="list-actions">
                  <button class="button button-primary" type="button" data-client-action="load" data-client-id="${escapeHtml(client.id)}">Carregar</button>
                  <button class="button" type="button" data-client-action="edit" data-client-id="${escapeHtml(client.id)}">Editar</button>
                  <button class="button" type="button" data-client-action="duplicate" data-client-id="${escapeHtml(client.id)}">Duplicar</button>
                  <button class="button button-danger" type="button" data-client-action="delete" data-client-id="${escapeHtml(client.id)}">Excluir</button>
                </div>
              </article>
            `
          )
          .join("")
      : `<div class="empty-state"><strong>Nenhum cliente salvo ainda</strong><span>Quando preencher um orçamento, use "Salvar cliente atual" para criar sua base compartilhada de contatos.</span></div>`;

    if (editingClientId) {
      const editingClient = state.clients.find((item) => item.id === editingClientId);
      if (!editingClient) {
        resetClientEditor("O cliente que estava em edição não existe mais. Você pode criar um novo cadastro.", "warning");
      }
    }
  }

  function renderHistoryTab() {
    const totalQuotes = state.quoteHistory.length;
    const totalValue = state.quoteHistory.reduce((sum, item) => sum + Number(item.total || 0), 0);
    const convertedValue = state.quoteHistory
      .filter((item) => ["approved", "converted", "completed"].includes(normalizeQuoteStatus(item.status)))
      .reduce((sum, item) => sum + Number(item.total || 0), 0);
    const conversionRate = totalQuotes
      ? ((state.quoteHistory.filter((item) => ["approved", "converted", "completed"].includes(normalizeQuoteStatus(item.status))).length / totalQuotes) * 100)
      : 0;
    document.getElementById("history-count").textContent = formatInteger(totalQuotes);
    document.getElementById("history-total").textContent = formatCurrency(totalValue);
    document.getElementById("history-converted-total").textContent = formatCurrency(convertedValue);
    document.getElementById("history-conversion-rate").textContent = `${formatDecimal(conversionRate, 1)}%`;
    if (historyFilterStatus) {
      historyFilterStatus.value = historyFilters.status;
    }
    if (historyFilterClient) {
      historyFilterClient.value = historyFilters.client;
    }
    if (historyFilterStart) {
      historyFilterStart.value = historyFilters.start;
    }
    if (historyFilterEnd) {
      historyFilterEnd.value = historyFilters.end;
    }

    const filteredHistory = state.quoteHistory.filter((item) => {
      const statusMatch = historyFilters.status === "all" || normalizeQuoteStatus(item.status) === historyFilters.status;
      const clientMatch = !historyFilters.client || normalizeLookupText(item.clientName || "").includes(normalizeLookupText(historyFilters.client));
      const itemDate = typeof item.createdAt === "string" ? item.createdAt.slice(0, 10) : "";
      const startMatch = !historyFilters.start || itemDate >= historyFilters.start;
      const endMatch = !historyFilters.end || itemDate <= historyFilters.end;
      return statusMatch && clientMatch && startMatch && endMatch;
    });

    historyList.innerHTML = filteredHistory.length
      ? filteredHistory
          .map(
            (item) => {
              const statusMeta = getQuoteStatusMeta(item.status);
              return `
              <article class="list-card" data-quote-id="${escapeHtml(item.id)}">
                <div>
                  <h3>${escapeHtml(item.title || "Orçamento salvo")}</h3>
                  <p>${escapeHtml(item.clientName || "Cliente não informado")}</p>
                  <p class="list-meta">${escapeHtml(formatDateTime(item.createdAt) || "data indisponível")} | Total ${escapeHtml(formatCurrency(item.total || 0))}</p>
                  ${item.osId ? `<p class="list-meta">OS vinculada: ${escapeHtml(state.workOrders.find((entry) => entry.id === item.osId)?.osNumber || "Gerada")}</p>` : ""}
                  <div class="history-status-row">
                    ${Object.entries(QUOTE_STATUS_META).map(([statusId, meta]) => `
                      <button
                        class="status-chip ${statusId === normalizeQuoteStatus(item.status) ? "is-active" : ""}"
                        type="button"
                        data-history-status="${escapeHtml(statusId)}"
                        data-quote-id="${escapeHtml(item.id)}"
                        data-tone="${escapeHtml(meta.tone)}"
                      >${escapeHtml(meta.label)}</button>
                    `).join("")}
                  </div>
                  <p class="list-meta">Status atual: <span class="status-inline status-inline-${escapeHtml(statusMeta.tone)}">${escapeHtml(statusMeta.label)}</span></p>
                  ${item.summary ? `<p class="list-notes">${escapeHtml(item.summary)}</p>` : ""}
                </div>
                <div class="list-actions">
                  <button class="button button-primary" type="button" data-history-action="load-client" data-quote-id="${escapeHtml(item.id)}">Usar cliente</button>
                  <button class="button" type="button" data-history-action="edit-quote" data-quote-id="${escapeHtml(item.id)}">Editar orçamento</button>
                  <button class="button" type="button" data-history-action="generate-os" data-quote-id="${escapeHtml(item.id)}"${item.osId ? " disabled" : ""}>${item.osId ? "OS gerada" : "Gerar OS"}</button>
                  <button class="button" type="button" data-history-action="copy" data-quote-id="${escapeHtml(item.id)}">Copiar resumo</button>
                  <button class="button button-danger" type="button" data-history-action="delete" data-quote-id="${escapeHtml(item.id)}">Excluir</button>
                </div>
              </article>
            `;
            }
          )
          .join("")
      : `<div class="empty-state"><strong>Nenhum orçamento encontrado</strong><span>Ajuste os filtros ou salve um novo fechamento para alimentar o histórico.</span></div>`;
  }

  function renderOrdersTab() {
    const openCount = state.workOrders.filter((item) => !["delivered", "closed", "cancelled"].includes(normalizeWorkOrderStatus(item.status))).length;
    const productionCount = state.workOrders.filter((item) => ["prepress", "production", "finishing"].includes(normalizeWorkOrderStatus(item.status))).length;
    const readyCount = state.workOrders.filter((item) => ["ready", "delivered"].includes(normalizeWorkOrderStatus(item.status))).length;
    const totalValue = state.workOrders.reduce((sum, item) => sum + Number(item.total || 0), 0);

    document.getElementById("os-count-open").textContent = formatInteger(openCount);
    document.getElementById("os-count-production").textContent = formatInteger(productionCount);
    document.getElementById("os-count-ready").textContent = formatInteger(readyCount);
    document.getElementById("os-total-value").textContent = formatCurrency(totalValue);

    if (osFilterStatus) osFilterStatus.value = workOrderFilters.status;
    if (osFilterClient) osFilterClient.value = workOrderFilters.client;
    if (osFilterOwner) osFilterOwner.value = workOrderFilters.owner;
    if (osFilterDate) osFilterDate.value = workOrderFilters.date;

    const filteredOrders = state.workOrders.filter((item) => {
      const statusMatch = workOrderFilters.status === "all" || normalizeWorkOrderStatus(item.status) === workOrderFilters.status;
      const clientMatch = !workOrderFilters.client || normalizeLookupText(item.clientName || "").includes(normalizeLookupText(workOrderFilters.client));
      const ownerMatch = !workOrderFilters.owner || normalizeLookupText(item.owner || "").includes(normalizeLookupText(workOrderFilters.owner));
      const promisedDate = typeof item.promisedDate === "string" ? item.promisedDate : "";
      const dateMatch = !workOrderFilters.date || promisedDate === workOrderFilters.date;
      return statusMatch && clientMatch && ownerMatch && dateMatch;
    });

    osList.innerHTML = filteredOrders.length
      ? filteredOrders.map((item) => {
          const statusMeta = getWorkOrderStatusMeta(item.status);
          const priorityMeta = getWorkOrderPriorityMeta(item.priority);
          const quoteLabel = item.quoteTitle || "Orçamento sem título";
          const timelineMarkup = (item.timeline || [])
            .slice()
            .sort((left, right) => String(right.at || "").localeCompare(String(left.at || "")))
            .slice(0, 5)
            .map((entry) => `
              <div class="os-timeline-item">
                <strong>${escapeHtml(entry.label || "Atualização")}</strong>
                <span>${escapeHtml(formatDateTime(entry.at) || "data indisponível")}</span>
                ${entry.note ? `<small>${escapeHtml(entry.note)}</small>` : ""}
              </div>
            `)
            .join("");
          return `
            <article class="list-card os-card" data-os-id="${escapeHtml(item.id)}">
              <div class="os-card-header">
                <div>
                  <h3>${escapeHtml(item.osNumber)}</h3>
                  <p>${escapeHtml(item.clientName || "Cliente não informado")}</p>
                  <p class="list-meta">${escapeHtml(quoteLabel)} | Total ${escapeHtml(formatCurrency(item.total || 0))}</p>
                </div>
                <div>
                  <p class="list-meta">Status atual: <span class="status-inline status-inline-${escapeHtml(statusMeta.tone)}">${escapeHtml(statusMeta.label)}</span></p>
                  <p class="list-meta">Prioridade: <span class="status-inline status-inline-${escapeHtml(priorityMeta.tone)}">${escapeHtml(priorityMeta.label)}</span></p>
                  <p class="list-meta">Prazo: ${escapeHtml(item.promisedDate || "Não definido")}</p>
                  <p class="list-meta">Sequência do usuário: ${escapeHtml(item.createdByUsername || "Usuário")} #${escapeHtml(String(item.sequenceNumber || 1))}</p>
                </div>
              </div>

              <div class="history-status-row">
                ${Object.entries(WORK_ORDER_STATUS_META).map(([statusId, meta]) => `
                  <button
                    class="status-chip ${statusId === normalizeWorkOrderStatus(item.status) ? "is-active" : ""}"
                    type="button"
                    data-os-status="${escapeHtml(statusId)}"
                    data-os-id="${escapeHtml(item.id)}"
                    data-tone="${escapeHtml(meta.tone)}"
                  >${escapeHtml(meta.label)}</button>
                `).join("")}
              </div>

              <div class="history-status-row">
                ${Object.entries(WORK_ORDER_PRIORITY_META).map(([priorityId, meta]) => `
                  <button
                    class="status-chip ${priorityId === normalizeWorkOrderPriority(item.priority) ? "is-active" : ""}"
                    type="button"
                    data-os-priority="${escapeHtml(priorityId)}"
                    data-os-id="${escapeHtml(item.id)}"
                    data-tone="${escapeHtml(meta.tone)}"
                  >${escapeHtml(meta.label)}</button>
                `).join("")}
              </div>

              <div class="os-card-field-grid">
                <label>
                  <span>Responsável</span>
                  <input type="text" value="${escapeHtml(item.owner || "")}" data-os-field="owner" data-os-id="${escapeHtml(item.id)}" placeholder="Ex.: Produção / Atendente">
                </label>
                <label>
                  <span>Entrega prevista</span>
                  <input type="date" value="${escapeHtml(item.promisedDate || "")}" data-os-field="promisedDate" data-os-id="${escapeHtml(item.id)}">
                </label>
                <label>
                  <span>Data de entrega</span>
                  <input type="date" value="${escapeHtml(item.deliveryDate || "")}" data-os-field="deliveryDate" data-os-id="${escapeHtml(item.id)}">
                </label>
                <label>
                  <span>Forma de pagamento acordada</span>
                  <input type="text" value="${escapeHtml(item.paymentMethod || "")}" data-os-field="paymentMethod" data-os-id="${escapeHtml(item.id)}" placeholder="Pix, cartão, boleto, dinheiro...">
                </label>
                <label>
                  <span>Contato do cliente</span>
                  <input type="text" value="${escapeHtml(item.clientContact || "")}" data-os-field="clientContact" data-os-id="${escapeHtml(item.id)}">
                </label>
                <label>
                  <span>Valor de entrada pago</span>
                  <input type="number" min="0" step="0.01" value="${escapeHtml(item.entryAmount === "" ? "" : item.entryAmount || "")}" data-os-field="entryAmount" data-os-id="${escapeHtml(item.id)}" placeholder="0,00">
                </label>
                <label>
                  <span>Pagamento de entrada realizado</span>
                  <select data-os-field="entryPaid" data-os-id="${escapeHtml(item.id)}">
                    <option value="false"${item.entryPaid ? "" : " selected"}>Não</option>
                    <option value="true"${item.entryPaid ? " selected" : ""}>Sim</option>
                  </select>
                </label>
                <label>
                  <span>Pagamento total realizado</span>
                  <select data-os-field="totalPaid" data-os-id="${escapeHtml(item.id)}">
                    <option value="false"${item.totalPaid ? "" : " selected"}>Não</option>
                    <option value="true"${item.totalPaid ? " selected" : ""}>Sim</option>
                  </select>
                </label>
                <label class="full-width">
                  <span>Observações de produção</span>
                  <textarea data-os-field="productionNotes" data-os-id="${escapeHtml(item.id)}" placeholder="Materiais, conferência, impressão, acabamento...">${escapeHtml(item.productionNotes || "")}</textarea>
                </label>
                <label class="full-width">
                  <span>Observações de entrega / fechamento</span>
                  <textarea data-os-field="deliveryNotes" data-os-id="${escapeHtml(item.id)}" placeholder="Retirada, envio, aceite, pendências...">${escapeHtml(item.deliveryNotes || "")}</textarea>
                </label>
              </div>

              <div class="os-card-actions">
                <button class="button button-primary" type="button" data-os-action="load-client" data-os-id="${escapeHtml(item.id)}">Usar cliente</button>
                <button class="button" type="button" data-os-action="copy-summary" data-os-id="${escapeHtml(item.id)}">Copiar OS</button>
                <button class="button button-danger" type="button" data-os-action="delete" data-os-id="${escapeHtml(item.id)}">Excluir OS</button>
              </div>

              <div class="os-timeline">
                <strong>Timeline</strong>
                ${timelineMarkup || `<span class="list-meta">Sem atualizações ainda.</span>`}
              </div>
            </article>
          `;
        }).join("")
      : `<div class="empty-state"><strong>Nenhuma OS encontrada</strong><span>Gere uma OS a partir do orçamento atual ou de um item aprovado do histórico.</span></div>`;
  }

  function renderHomeTab() {
    const quoteCount = state.quoteHistory.length;
    const approvedCount = state.quoteHistory.filter((item) => normalizeQuoteStatus(item.status) === "approved").length;
    const completedCount = state.quoteHistory.filter((item) => normalizeQuoteStatus(item.status) === "completed").length;
    const pendingCount = state.quoteHistory.filter((item) => ["pending", "sent", "negotiation"].includes(normalizeQuoteStatus(item.status))).length;
    const convertedCount = state.quoteHistory.filter((item) => normalizeQuoteStatus(item.status) === "converted").length;
    const cancelledCount = state.quoteHistory.filter((item) => normalizeQuoteStatus(item.status) === "cancelled").length;
    const conversionCount = approvedCount + convertedCount + completedCount;
    const conversionRate = quoteCount ? (conversionCount / quoteCount) * 100 : 0;
    const approvedValue = state.quoteHistory
      .filter((item) => ["approved", "converted", "completed"].includes(normalizeQuoteStatus(item.status)))
      .reduce((sum, item) => sum + Number(item.total || 0), 0);
    const pendingValue = state.quoteHistory
      .filter((item) => ["pending", "sent", "negotiation"].includes(normalizeQuoteStatus(item.status)))
      .reduce((sum, item) => sum + Number(item.total || 0), 0);

    const statusChart = document.getElementById("home-status-chart");
    const quickLinks = document.getElementById("home-quick-links");
    const topProducts = document.getElementById("home-top-products");
    const lowProducts = document.getElementById("home-low-products");
    const dashboardPermissions = getUserDashboardPermissions(accessControl, currentUser);

    document.getElementById("home-quote-count").textContent = formatInteger(quoteCount);
    document.getElementById("home-conversion-rate").textContent = `${formatDecimal(conversionRate, 1)}%`;
    document.getElementById("home-approved-value").textContent = formatCurrency(approvedValue);
    document.getElementById("home-pending-value").textContent = formatCurrency(pendingValue);

    if (statusChart) {
      statusChart.closest(".panel")?.toggleAttribute("hidden", !dashboardPermissions.statusChart);
      const chartData = [
        { id: "pending", label: "Pendentes", count: pendingCount, tone: "pending" },
        { id: "approved", label: "Aprovados", count: approvedCount, tone: "approved" },
        { id: "converted", label: "Viraram OS", count: convertedCount, tone: "accent" },
        { id: "completed", label: "Concluídos", count: completedCount, tone: "completed" },
        { id: "cancelled", label: "Cancelados", count: cancelledCount, tone: "cancelled" },
      ];
      const maxCount = Math.max(1, ...chartData.map((item) => item.count));
      statusChart.innerHTML = `
        <div class="dashboard-chart-grid">
          ${chartData.map((item) => `
            <article class="dashboard-bar-card">
              <span>${escapeHtml(item.label)}</span>
              <strong>${formatInteger(item.count)}</strong>
              <div class="dashboard-bar-track">
                <div class="dashboard-bar dashboard-bar-${escapeHtml(item.tone)}" style="width:${(item.count / maxCount) * 100}%"></div>
              </div>
            </article>
          `).join("")}
        </div>
      `;
    }

    if (quickLinks) {
      quickLinks.closest(".panel")?.toggleAttribute("hidden", !dashboardPermissions.quickLinks);
      const visibleLinks = tabButtons
        .filter((button) => !button.hidden && !["login", "home"].includes(button.dataset.tabTarget))
        .map((button) => `
          <button class="quick-link-card" type="button" data-home-link="${escapeHtml(button.dataset.tabTarget)}">
            <strong>${escapeHtml(button.textContent.trim())}</strong>
            <span>Acessar esta área</span>
          </button>
        `)
        .join("");
      quickLinks.innerHTML = visibleLinks || `<div class="empty-state"><strong>Nenhuma aba liberada</strong><span>Libere abas para este usuário na área do desenvolvedor.</span></div>`;
    }

    const productMap = new Map();
    state.quoteHistory
      .filter((quote) => ["approved", "completed"].includes(normalizeQuoteStatus(quote.status)))
      .forEach((quote) => {
        (quote.items || []).forEach((entry) => {
          const key = normalizeLookupText(entry.label || "");
          if (!key) {
            return;
          }
          const current = productMap.get(key) || { label: entry.label || "Produto", count: 0, total: 0 };
          current.count += Number(entry.quantity || 0) || 1;
          current.total += Number(entry.total || 0);
          productMap.set(key, current);
        });
      });

    const rankedProducts = [...productMap.values()].sort((left, right) => right.count - left.count || right.total - left.total);
    const topList = rankedProducts.slice(0, 5);
    const lowList = [...rankedProducts].reverse().slice(0, 5);
    const renderProductList = (items, emptyMessage) => items.length
      ? items.map((item) => `
          <article class="list-card compact-card">
            <div>
              <h3>${escapeHtml(item.label)}</h3>
              <p class="list-meta">${formatInteger(item.count)} unidades | ${escapeHtml(formatCurrency(item.total))}</p>
            </div>
          </article>
        `).join("")
      : `<div class="empty-state"><strong>Sem dados suficientes</strong><span>${escapeHtml(emptyMessage)}</span></div>`;

    if (topProducts) {
      topProducts.closest(".panel")?.toggleAttribute("hidden", !dashboardPermissions.topProducts);
      topProducts.innerHTML = renderProductList(topList, "A lista será preenchida quando houver orçamentos aprovados ou concluídos.");
    }
    if (lowProducts) {
      lowProducts.closest(".panel")?.toggleAttribute("hidden", !dashboardPermissions.lowProducts);
      lowProducts.innerHTML = renderProductList(lowList, "Quando mais produtos forem vendidos, o ranking de baixa saída aparece aqui.");
    }
  }

  function getBlockSelectOptions(config, tab, row) {
    const entries = getBlockCatalogForTab(config, tab);
    const formats = getBlockFormats(config, tab);
    const selectedFormat = formats.includes(row.format) ? row.format : formats[0] || row.format || "A4";
    const formatEntries = entries.filter((item) => item.format === selectedFormat);
    const viasOptions = [...new Set(formatEntries.map((item) => item.vias))];
    const selectedVias = viasOptions.includes(Number(row.vias)) ? Number(row.vias) : viasOptions[0] || Number(row.vias) || 1;
    const quantityOptions = [...new Set(formatEntries
      .filter((item) => Number(item.vias) === Number(selectedVias))
      .map((item) => item.quantity))];
    const selectedQuantity = quantityOptions.includes(Number(row.quantity))
      ? Number(row.quantity)
      : quantityOptions[0] || Number(row.quantity) || 1;
    return { formats, selectedFormat, viasOptions, selectedVias, quantityOptions, selectedQuantity };
  }

  function renderBlockTab(tab, blockWorkbook) {
    const def = BLOCK_TAB_DEFS[tab];
    const body = blockTableBodies[tab];
    const warningList = blockWarningLists[tab];
    if (!def || !body) {
      return;
    }

    document.getElementById(`${def.summaryPrefix}-summary-active`).textContent = formatInteger(blockWorkbook.totals.activeLines);
    document.getElementById(`${def.summaryPrefix}-summary-quantity`).textContent = formatInteger(blockWorkbook.totals.totalQuantity);
    document.getElementById(`${def.summaryPrefix}-summary-total`).textContent = formatCurrency(blockWorkbook.totals.totalGeneral);
    document.getElementById(`${def.summaryPrefix}-summary-average`).textContent = formatCurrency(blockWorkbook.totals.averageValue);

    body.innerHTML = blockWorkbook.rows.map((row, index) => {
      const options = getBlockSelectOptions(config, tab, row);
      const formatOptions = options.formats.map((value) => `<option value="${escapeHtml(value)}"${value === options.selectedFormat ? " selected" : ""}>${escapeHtml(value)}</option>`).join("");
      const viasOptions = options.viasOptions.map((value) => `<option value="${escapeHtml(value)}"${Number(value) === Number(options.selectedVias) ? " selected" : ""}>${escapeHtml(value)}</option>`).join("");
      const quantityOptions = options.quantityOptions.map((value) => `<option value="${escapeHtml(value)}"${Number(value) === Number(options.selectedQuantity) ? " selected" : ""}>${escapeHtml(value)}</option>`).join("");
      return `
        <tr class="${row.active ? "" : "is-empty"}" data-block-tab="${escapeHtml(tab)}" data-block-row-index="${index}">
          <td><strong>${String(index + 1).padStart(2, "0")}</strong></td>
          <td><input class="cell-input description" name="description" value="${escapeHtml(row.description)}" placeholder="${escapeHtml(def.label)}"></td>
          <td><select class="cell-select" name="format">${formatOptions}</select></td>
          <td><select class="cell-select compact-select" name="vias">${viasOptions}</select></td>
          <td><select class="cell-select compact-select" name="quantity">${quantityOptions}</select></td>
          <td><span class="readonly-value subtle">${escapeHtml(row.measure || "-")}</span></td>
          <td><span class="readonly-value subtle">${formatCurrency(row.tablePrice)}</span></td>
          <td><input class="cell-input compact-money" name="artCreationFee" type="number" min="0" step="0.01" value="${escapeHtml(row.artCreationFee)}"></td>
          <td>${createDiscountTypeSelect(row)}</td>
          <td>${createDiscountValueInput(row)}</td>
          <td><span class="readonly-value">${formatCurrency(row.total)}</span></td>
          <td><span class="readonly-value subtle">${formatCurrency(row.unitValue)}</span></td>
        </tr>
      `;
    }).join("");

    if (warningList) {
      warningList.innerHTML = blockWorkbook.warnings.length
        ? blockWorkbook.warnings.map((warning) => `<div class="warning-item">${escapeHtml(warning)}</div>`).join("")
        : `<div class="warning-item is-success">Selecione formato, vias e quantidade para montar o orçamento de blocos.</div>`;
    }
  }

  function renderCardRows(cardWorkbook) {
    if (!cardRowsTableBody) {
      return;
    }
    document.getElementById("cards-summary-active").textContent = formatInteger(cardWorkbook.totals.activeLines);
    document.getElementById("cards-summary-quantity").textContent = formatInteger(cardWorkbook.totals.totalQuantity);
    document.getElementById("cards-summary-total").textContent = formatCurrency(cardWorkbook.totals.totalGeneral);
    document.getElementById("cards-summary-average").textContent = formatCurrency(cardWorkbook.totals.averageValue);

    const finishes = getCardFinishes(config);
    cardRowsTableBody.innerHTML = cardWorkbook.rows.map((row, index) => {
      const options = getCardSelectOptions(config, row);
      const printTypeOptions = options.printTypes.map((value) => `<option value="${escapeHtml(value)}"${value === options.selectedPrintType ? " selected" : ""}>${value === "offset" ? "Offset" : "Laser"}</option>`).join("");
      const paperOptions = options.papers.map((value) => `<option value="${escapeHtml(value)}"${value === options.selectedPaper ? " selected" : ""}>${escapeHtml(value)}</option>`).join("");
      const sideOptions = options.sides.map((value) => `<option value="${escapeHtml(value)}"${value === options.selectedSide ? " selected" : ""}>${escapeHtml(value)}</option>`).join("");
      const quantityOptions = options.quantities.map((value) => `<option value="${escapeHtml(value)}"${Number(value) === Number(options.selectedQuantity) ? " selected" : ""}>${formatInteger(value)}</option>`).join("");
      const finishMarkup = finishes.map((finish) => {
        const checked = row.finishIds?.includes(finish.id);
        return `
          <label class="popover-option finish-option">
            <input type="checkbox" data-card-finish-id="${escapeHtml(finish.id)}"${checked ? " checked" : ""}>
            <span>${escapeHtml(finish.label)}${finish.holeSizeMm > 0 ? ` (${formatMeasure(finish.holeSizeMm)}mm)` : ""}</span>
          </label>
        `;
      }).join("");
      return `
        <tr class="${row.active ? "" : "is-empty"}" data-card-row-index="${index}">
          <td><strong>${String(index + 1).padStart(2, "0")}</strong></td>
          <td><input class="cell-input description" name="description" value="${escapeHtml(row.description)}" placeholder="Cartão de visita"></td>
          <td><select class="cell-select" name="printType">${printTypeOptions}</select></td>
          <td><select class="cell-select" name="paper">${paperOptions}</select></td>
          <td><select class="cell-select" name="side">${sideOptions}</select></td>
          <td><select class="cell-select compact-select" name="quantity">${quantityOptions}</select></td>
          <td><input class="cell-input compact-money" name="artCreationFee" type="number" min="0" step="0.01" value="${escapeHtml(row.artCreationFee)}" placeholder="Arte"></td>
          <td><span class="readonly-value subtle">${formatCurrency(row.tablePrice)}</span></td>
          <td>
            <details class="inline-popover">
              <summary class="button button-small">${row.finishSummary || "Sem acabamento"}</summary>
              <div class="floating-menu inline-floating-menu">
                ${finishMarkup}
                <small class="helper-text">Valores calculados automaticamente pela quantidade.</small>
              </div>
            </details>
          </td>
          <td>${createDiscountTypeSelect(row)}</td>
          <td>${createDiscountValueInput(row)}</td>
          <td><span class="readonly-value">${formatCurrency(row.total)}</span></td>
          <td><span class="readonly-value subtle">${formatCurrency(row.unitValue)}</span></td>
        </tr>
      `;
    }).join("");

    if (cardWarningList) {
      cardWarningList.innerHTML = cardWorkbook.warnings.length
        ? cardWorkbook.warnings.map((warning) => `<div class="warning-item">${escapeHtml(warning)}</div>`).join("")
        : `<div class="warning-item is-success">Selecione impressão, papel, lado e quantidade para montar cartões de visita.</div>`;
    }
  }

  function renderFlyerRows(flyerWorkbook) {
    if (!flyerRowsTableBody) {
      return;
    }

    document.getElementById("flyers-summary-active").textContent = formatInteger(flyerWorkbook.totals.activeLines);
    document.getElementById("flyers-summary-quantity").textContent = formatInteger(flyerWorkbook.totals.totalQuantity);
    document.getElementById("flyers-summary-total").textContent = formatCurrency(flyerWorkbook.totals.totalGeneral);
    document.getElementById("flyers-summary-average").textContent = formatCurrency(flyerWorkbook.totals.averageValue);

    flyerRowsTableBody.innerHTML = flyerWorkbook.rows.map((row, index) => {
      const options = getFlyerSelectOptions(config, row);
      const finishes = getFlyerFinishes(config);
      const printTypeOptions = options.printTypes.map((value) => `<option value="${escapeHtml(value)}"${value === options.selectedPrintType ? " selected" : ""}>${value === "offset" ? "Offset" : "Laser"}</option>`).join("");
      const paperOptions = options.papers.map((value) => `<option value="${escapeHtml(value)}"${value === options.selectedPaper ? " selected" : ""}>${escapeHtml(value)}</option>`).join("");
      const sizeOptions = options.sizes.map((value) => `<option value="${escapeHtml(value)}"${value === options.selectedSize ? " selected" : ""}>${escapeHtml(value)}</option>`).join("");
      const colorModeOptions = options.colorModes.map((value) => `<option value="${escapeHtml(value)}"${value === options.selectedColorMode ? " selected" : ""}>${escapeHtml(value)}</option>`).join("");
      const quantityOptions = options.quantities.map((value) => `<option value="${escapeHtml(value)}"${Number(value) === Number(options.selectedQuantity) ? " selected" : ""}>${formatInteger(value)}</option>`).join("");
      const finishOptions = finishes.map((finish) => `<option value="${escapeHtml(finish.id)}"${finish.id === row.finishId ? " selected" : ""}>${escapeHtml(finish.label)}</option>`).join("");
      return `
        <tr class="${row.active ? "" : "is-empty"}" data-flyer-row-index="${index}">
          <td><strong>${String(index + 1).padStart(2, "0")}</strong></td>
          <td><input class="cell-input description" name="description" value="${escapeHtml(row.description)}" placeholder="Panfleto/folder"></td>
          <td><select class="cell-select" name="printType">${printTypeOptions}</select></td>
          <td><select class="cell-select" name="paper">${paperOptions}</select></td>
          <td><select class="cell-select" name="size">${sizeOptions}</select></td>
          <td><select class="cell-select" name="colorMode">${colorModeOptions}</select></td>
          <td><select class="cell-select compact-select" name="quantity">${quantityOptions}</select></td>
          <td><span class="readonly-value subtle">${formatCurrency(row.tablePrice)}</span></td>
          <td>
            <select class="cell-select" name="finishId">${finishOptions}</select>
            ${row.finishTotal > 0 ? `<small class="readonly-value subtle">${formatCurrency(row.finishTotal)}</small>` : ""}
          </td>
          <td><input class="cell-input compact-money" name="artCreationFee" type="number" min="0" step="0.01" value="${escapeHtml(row.artCreationFee)}" placeholder="Arte"></td>
          <td>${createDiscountTypeSelect(row)}</td>
          <td>${createDiscountValueInput(row)}</td>
          <td><span class="readonly-value">${formatCurrency(row.total)}</span></td>
          <td><span class="readonly-value subtle">${formatCurrency(row.unitValue)}</span></td>
        </tr>
      `;
    }).join("");

    if (flyerWarningList) {
      flyerWarningList.innerHTML = flyerWorkbook.warnings.length
        ? flyerWorkbook.warnings.map((warning) => `<div class="warning-item">${escapeHtml(warning)}</div>`).join("")
        : `<div class="warning-item is-success">Selecione impressão, papel, tamanho, cores e quantidade para montar panfletos e folders.</div>`;
    }
  }

  function renderRowsAndSummary() {
    const workbook = calculateWorkbook(state, config);
    const colorWorkbook = calculateColorPrintWorkbook(state, config);
    const credentialWorkbook = calculateCredentialWorkbook(state, config);
    const m2Workbook = calculateM2WorkbookFromConfig(state, config);
    const readyWorkbook = calculateReadyWorkbook(state, config);
    const resinWorkbook = calculateResinWorkbook(state, config);
    const cardWorkbook = calculateCardWorkbook(state, config);
    const flyerWorkbook = calculateFlyerWorkbook(state, config);
    const blockSulfiteWorkbook = calculateBlockWorkbook(state, config, "sulfite");
    const blockAutocopiativoWorkbook = calculateBlockWorkbook(state, config, "autocopiativo");
    const m2Catalog = getM2Catalog(config);
    const readyCatalog = getReadyProductCatalog(config);

    document.getElementById("summary-active-lines").textContent = formatInteger(workbook.totals.activeLines);
    document.getElementById("summary-booklets").textContent = formatInteger(workbook.totals.totalQuantity);
    document.getElementById("summary-total").textContent = formatCurrency(workbook.totals.totalGeneral);
    document.getElementById("summary-average").textContent = formatCurrency(workbook.totals.averageValue);

    document.getElementById("color-summary-active").textContent = formatInteger(colorWorkbook.totals.activeLines);
    document.getElementById("color-summary-quantity").textContent = formatInteger(colorWorkbook.totals.totalQuantity);
    document.getElementById("color-summary-total").textContent = formatCurrency(colorWorkbook.totals.totalGeneral);
    document.getElementById("color-summary-average").textContent = formatCurrency(colorWorkbook.totals.averageValue);

    document.getElementById("credential-summary-active").textContent = formatInteger(credentialWorkbook.totals.activeLines);
    document.getElementById("credential-summary-quantity").textContent = formatInteger(credentialWorkbook.totals.totalQuantity);
    document.getElementById("credential-summary-total").textContent = formatCurrency(credentialWorkbook.totals.totalGeneral);
    document.getElementById("credential-summary-average").textContent = formatCurrency(credentialWorkbook.totals.averageValue);

    document.getElementById("m2-summary-active").textContent = formatInteger(m2Workbook.totals.activeLines);
    document.getElementById("m2-summary-quantity").textContent = formatInteger(m2Workbook.totals.totalQuantity);
    document.getElementById("m2-summary-total").textContent = formatCurrency(m2Workbook.totals.totalGeneral);
    document.getElementById("m2-summary-average").textContent = formatCurrency(m2Workbook.totals.averageValue);
    document.getElementById("ready-summary-active").textContent = formatInteger(readyWorkbook.totals.activeLines);
    document.getElementById("ready-summary-quantity").textContent = formatInteger(readyWorkbook.totals.totalQuantity);
    document.getElementById("ready-summary-total").textContent = formatCurrency(readyWorkbook.totals.totalGeneral);
    document.getElementById("ready-summary-average").textContent = formatCurrency(readyWorkbook.totals.averageValue);

    document.getElementById("resin-summary-active").textContent = formatInteger(resinWorkbook.totals.activeLines);
    document.getElementById("resin-summary-quantity").textContent = formatInteger(resinWorkbook.totals.totalQuantity);
    document.getElementById("resin-summary-total").textContent = formatCurrency(resinWorkbook.totals.totalGeneral);
    document.getElementById("resin-summary-average").textContent = formatCurrency(resinWorkbook.totals.averageValue);

    renderBlockTab("sulfite", blockSulfiteWorkbook);
    renderBlockTab("autocopiativo", blockAutocopiativoWorkbook);
    renderCardRows(cardWorkbook);
    renderFlyerRows(flyerWorkbook);

    rowsTableBody.innerHTML = workbook.rows
      .map((row, index) => {
        const rowClass = row.active ? "" : "is-empty";
        return `
          <tr class="${rowClass}" data-row-index="${index}">
            <td><input type="checkbox" class="row-selector" data-row-id="${escapeHtml(row.id)}"${selectedRowIds.has(row.id) ? " checked" : ""}></td>
            <td><strong>${String(index + 1).padStart(2, "0")}</strong></td>
            <td><input class="cell-input description" name="description" value="${escapeHtml(row.description)}"></td>
            <td><select class="cell-select" name="printType">${buildOptions(OPTIONS.printTypes, row.printType)}</select></td>
            <td><select class="cell-select" name="size">${buildOptions(OPTIONS.sizes, row.size)}</select></td>
            <td><select class="cell-select" name="printMode">${buildOptions(OPTIONS.printModes, row.printMode)}</select></td>
            <td><select class="cell-select" name="finishing">${buildOptions(OPTIONS.finishing, row.finishing)}</select></td>
            <td><input class="cell-input" name="bindingGroup" value="${escapeHtml(row.bindingGroup)}" placeholder="Ex.: Grupo A"></td>
            <td><input class="cell-input" name="quantity" type="number" min="0" step="1" value="${escapeHtml(row.quantity)}"></td>
            <td><input class="cell-input" name="pages" type="number" min="0" step="1" value="${escapeHtml(row.pages)}"></td>
            <td><select class="cell-select" name="coverType">${buildOptions(OPTIONS.coverTypes, row.coverType)}</select></td>
            <td><select class="cell-select" name="coverPaper">${buildOptions(OPTIONS.coverPapers, row.coverPaper)}</select></td>
            <td><select class="cell-select" name="backCoverType">${buildOptions(OPTIONS.backCoverTypes, row.backCoverType)}</select></td>
            <td><select class="cell-select" name="backCoverPaper">${buildOptions(OPTIONS.coverPapers, row.backCoverPaper)}</select></td>
            <td><select class="cell-select" name="spiralOption">${buildOptions(OPTIONS.spiralOptions, row.spiralOption)}</select></td>
            <td><span class="readonly-value subtle">${formatCurrency(row.innerTotal)}</span></td>
            <td><span class="readonly-value subtle">${formatCurrency(row.coverTotal)}</span></td>
            <td><span class="readonly-value subtle">${formatCurrency(row.backTotal)}</span></td>
            <td><span class="readonly-value subtle">${formatCurrency(row.finishingTotal)}${row.groupedFinishing ? `<br><small>${row.bindingGroupLeader ? `Grupo ${escapeHtml(row.bindingGroup)}` : `Grupo ${escapeHtml(row.bindingGroup)} (na 1a linha)`}</small>` : ""}</span></td>
            <td>${createDiscountTypeSelect(row)}</td>
            <td>${createDiscountValueInput(row)}</td>
            <td><span class="readonly-value">${formatCurrency(row.total)}</span></td>
            <td><span class="readonly-value subtle">${formatCurrency(row.unitValue)}</span></td>
          </tr>
        `;
      })
      .join("");

    colorRowsTableBody.innerHTML = colorWorkbook.rows
      .map((row, index) => {
        return `
          <tr class="${row.active ? "" : "is-empty"}" data-color-row-index="${index}">
            <td><strong>${String(index + 1).padStart(2, "0")}</strong></td>
            <td><input class="cell-input description" name="description" value="${escapeHtml(row.description)}"></td>
            <td><input class="cell-input" name="widthMm" type="number" min="0" step="0.1" value="${escapeHtml(row.widthMm)}"></td>
            <td><input class="cell-input" name="heightMm" type="number" min="0" step="0.1" value="${escapeHtml(row.heightMm)}"></td>
            <td><select class="cell-select" name="bleedMode">${buildOptions(OPTIONS.bleedModes, row.bleedMode)}</select></td>
            <td><select class="cell-select" name="printMode">${buildOptions(OPTIONS.printModes, row.printMode)}</select></td>
            <td><select class="cell-select" name="paperType">${buildOptions(OPTIONS.colorPaperTypes, row.paperType)}</select></td>
            <td><input class="cell-input" name="quantity" type="number" min="0" step="1" value="${escapeHtml(row.quantity)}"></td>
            <td><span class="readonly-value subtle">${formatInteger(row.itemsPerSheet)}</span></td>
            <td><span class="readonly-value subtle">${formatInteger(row.a4Sheets)}</span></td>
            <td><span class="readonly-value subtle">${formatInteger(row.a4Impressions)}</span></td>
            <td><span class="readonly-value subtle">${formatCurrency(row.printTotal)}</span></td>
            <td><span class="readonly-value subtle">${formatCurrency(row.suggestedCutPrice)}</span></td>
            <td><input class="cell-input" name="cutPriceOverride" type="number" min="0" step="0.01" value="${escapeHtml(row.cutPriceOverride)}" placeholder="${row.suggestedCutPrice > 0 ? row.suggestedCutPrice.toFixed(2) : "0.00"}"></td>
            <td>${createColorServicePickerMarkup(row, config)}</td>
            <td><span class="readonly-value subtle">${formatCurrency(row.serviceExtraTotal || 0)}</span></td>
            <td>${createDiscountTypeSelect(row)}</td>
            <td>${createDiscountValueInput(row)}</td>
            <td><span class="readonly-value">${formatCurrency(row.total)}</span></td>
            <td><span class="readonly-value subtle">${formatCurrency(row.unitValue)}</span></td>
          </tr>
        `
      })
      .join("");

    warningList.innerHTML = workbook.warnings.map((warning) => `<div class="warning-item">${escapeHtml(warning)}</div>`).join("");
    colorWarningList.innerHTML = colorWorkbook.warnings.map((warning) => `<div class="warning-item">${escapeHtml(warning)}</div>`).join("");
    credentialRowsTableBody.innerHTML = credentialWorkbook.rows
      .map(
        (row, index) => `
          <tr class="${row.active ? "" : "is-empty"}" data-credential-row-index="${index}">
            <td><strong>${String(index + 1).padStart(2, "0")}</strong></td>
            <td><input class="cell-input description" name="description" value="${escapeHtml(row.description)}" placeholder="Ex.: Credencial evento"></td>
            <td><select class="cell-select" name="materialType">${buildOptions(OPTIONS.credentialMaterials, row.materialType)}</select></td>
            <td><select class="cell-select" name="printMode">${buildOptions(OPTIONS.printModes, row.printMode)}</select></td>
            <td><select class="cell-select" name="lamination">${buildOptions(OPTIONS.credentialLamination, row.lamination)}</select></td>
            <td>
              <div class="finish-picker">
                <button class="button finish-picker-button" type="button" data-credential-lanyard-toggle>
                  <span>${escapeHtml(row.lanyardLabel || "Sem cordão")}</span>
                  <span class="finish-picker-chevron">▾</span>
                </button>
              </div>
            </td>
            <td><input class="cell-input" name="widthCm" type="number" min="0" step="0.1" value="${escapeHtml(row.widthCm)}" placeholder="0,0"></td>
            <td><input class="cell-input" name="heightCm" type="number" min="0" step="0.1" value="${escapeHtml(row.heightCm)}" placeholder="0,0"></td>
            <td><input class="cell-input" name="quantity" type="number" min="0" step="1" value="${escapeHtml(row.quantity)}" placeholder="0"></td>
            <td><span class="readonly-value subtle">${formatAreaM2(row.areaM2)}</span></td>
            <td><span class="readonly-value subtle">${row.itemsPerSheet > 0 ? formatInteger(row.itemsPerSheet) : "-"}</span></td>
            <td><span class="readonly-value subtle">${row.sheetsNeeded > 0 ? formatInteger(row.sheetsNeeded) : "-"}</span></td>
            <td><span class="readonly-value subtle">${formatCurrency(row.baseTotal)}</span></td>
            <td><span class="readonly-value subtle">${formatCurrency(row.laminationTotal)}</span></td>
            <td><span class="readonly-value subtle">${formatCurrency(row.lanyardTotal)}</span></td>
            <td>${createDiscountTypeSelect(row)}</td>
            <td>${createDiscountValueInput(row)}</td>
            <td><span class="readonly-value">${formatCurrency(row.total)}</span></td>
            <td><span class="readonly-value subtle">${formatCurrency(row.unitValue)}</span></td>
          </tr>
        `
      )
      .join("");
    credentialWarningList.innerHTML = credentialWorkbook.warnings.length
      ? credentialWorkbook.warnings.map((warning) => `<div class="warning-item">${escapeHtml(warning)}</div>`).join("")
      : `<div class="warning-item is-success">Sem alertas no momento. A aba está usando papéis, PS, laminação e cordão da configuração.</div>`;
    setCredentialFeedback(
      credentialWorkbook.activeRows.length > 0
        ? "Cálculo de credenciais atualizado com sucesso."
        : "Couche e offset usam a base dos impressos coloridos. PS, laminação e cordões usam as bases configuradas no sistema.",
      credentialWorkbook.activeRows.length > 0 ? "success" : "neutral"
    );
    m2WarningList.innerHTML = m2Workbook.warnings.length
      ? m2Workbook.warnings.map((warning) => `<div class="warning-item">${escapeHtml(warning)}</div>`).join("")
      : `<div class="warning-item is-success">Sem alertas no momento. Preencha as medidas e acabamentos para o app montar o valor final com segurança.</div>`;

    m2RowsTableBody.innerHTML = m2Workbook.rows
      .map(
        (row, index) => `
          <tr class="${row.active ? "" : "is-empty"}" data-m2-row-index="${index}">
            <td><strong>${String(index + 1).padStart(2, "0")}</strong></td>
            <td>
              <select class="cell-select" name="productId">
                ${m2Catalog.map((product) => `<option value="${escapeHtml(product.id)}"${product.id === row.productId ? " selected" : ""}>${escapeHtml(product.label)}</option>`).join("")}
              </select>
            </td>
            <td>
              ${createM2FinishPickerMarkup(row, config)}
            </td>
            <td><input class="cell-input description" name="description" value="${escapeHtml(row.description)}" placeholder="${escapeHtml(row.productLabel)}"></td>
            <td>
              <select class="cell-select" name="measureUnit">
                <option value="cm"${row.measureUnit === "cm" ? " selected" : ""}>cm</option>
                <option value="m"${row.measureUnit === "m" ? " selected" : ""}>m</option>
              </select>
            </td>
            <td><input class="cell-input" name="widthMm" type="number" min="0" step="0.1" value="${escapeHtml(row.widthMm)}" placeholder="0,0"></td>
            <td><input class="cell-input" name="heightMm" type="number" min="0" step="0.1" value="${escapeHtml(row.heightMm)}" placeholder="0,0"></td>
            <td><input class="cell-input" name="quantity" type="number" min="0" step="1" value="${escapeHtml(row.quantity)}" placeholder="0"></td>
            <td><span class="readonly-value subtle">${formatAreaM2(row.areaM2)}</span></td>
            <td><span class="readonly-value subtle">${escapeHtml(row.tierLabel)}</span></td>
            <td><span class="readonly-value subtle">${formatCurrency(row.tierValue)}</span></td>
            <td><span class="readonly-value subtle">${formatCurrency(row.configuredFinishExtraTotal || 0)}</span></td>
            <td><input class="cell-input" name="extraCharge" type="number" min="0" step="0.01" value="${escapeHtml(row.extraCharge ?? 0)}" placeholder="0,00"></td>
            <td><input class="cell-input" name="artCreationFee" type="number" min="0" step="0.01" value="${escapeHtml(row.artCreationFee ?? 0)}" placeholder="0,00"></td>
            <td>${createDiscountTypeSelect(row)}</td>
            <td>${createDiscountValueInput(row)}</td>
            <td><span class="readonly-value">${formatCurrency(row.total)}</span></td>
          </tr>
        `
      )
      .join("");
    readyRowsTableBody.innerHTML = readyWorkbook.rows
      .map((row, index) => {
        const productOptions = [
          `<option value="">Selecione</option>`,
          ...readyCatalog.map((product) => `<option value="${escapeHtml(product.id)}"${product.id === row.productId ? " selected" : ""}>${escapeHtml(product.label)}</option>`),
        ].join("");
        const currentProduct = readyCatalog.find((product) => product.id === row.productId) || null;
        const currentPricingRows = getReadyPricingRows(config, currentProduct);
        const variantOptions = currentProduct?.readyPricingMode === "variant-fixed"
          ? currentPricingRows.map((entry, optionIndex) => `<option value="${optionIndex}"${optionIndex === row.variantIndex ? " selected" : ""}>${escapeHtml(entry.label || `Opção ${optionIndex + 1}`)}</option>`).join("")
          : `<option value="0">Padrão</option>`;
        const variantRow = currentProduct?.readyPricingMode === "variant-fixed" ? getReadyVariantRow(currentPricingRows, row.variantIndex) : null;
        const quantityLocked = currentProduct?.readyPricingMode === "variant-fixed" && variantRow?.mode === "total";
        return `
          <tr class="${row.active ? "" : "is-empty"}" data-ready-row-index="${index}">
            <td><strong>${String(index + 1).padStart(2, "0")}</strong></td>
            <td><select class="cell-select" name="productId">${productOptions}</select></td>
            <td><select class="cell-select" name="variantIndex">${variantOptions}</select></td>
            <td><input class="cell-input description" name="description" value="${escapeHtml(row.description)}" placeholder="${escapeHtml(row.productLabel || "Descrição opcional")}"></td>
            <td>${quantityLocked ? `<span class="readonly-value subtle">${formatInteger(row.effectiveQuantity || 0)}</span>` : `<input class="cell-input" name="quantity" type="number" min="0" step="1" value="${escapeHtml(row.quantity)}">`}</td>
            <td><span class="readonly-value subtle">${escapeHtml(row.pricingLabel || "-")}</span></td>
            <td>${currentProduct?.readyPricingMode === "manual" ? `<input class="cell-input" name="basePriceOverride" type="number" min="0" step="0.01" value="${escapeHtml(row.basePriceOverride)}" placeholder="0,00">` : `<span class="readonly-value subtle">${formatCurrency(row.baseTotal || 0)}</span>`}</td>
            <td><input class="cell-input" name="artCreationFee" type="number" min="0" step="0.01" value="${escapeHtml(row.artCreationFee)}" placeholder="0,00"></td>
            <td><input class="cell-input" name="extraCharge" type="number" min="0" step="0.01" value="${escapeHtml(row.extraCharge)}" placeholder="0,00"></td>
            <td>${createDiscountTypeSelect(row)}</td>
            <td>${createDiscountValueInput(row)}</td>
            <td><span class="readonly-value">${formatCurrency(row.total)}</span></td>
            <td><span class="readonly-value subtle">${formatCurrency(row.unitValue || 0)}</span></td>
          </tr>
        `;
      })
      .join("");
    readyWarningList.innerHTML = readyWorkbook.warnings.length
      ? readyWorkbook.warnings.map((warning) => `<div class="warning-item">${escapeHtml(warning)}</div>`).join("")
      : `<div class="warning-item is-success">Selecione um produto da tabela pronta e informe apenas os extras necessários para fechar o orçamento.</div>`;
    resinRowsTableBody.innerHTML = resinWorkbook.rows
      .map((row, index) => {
        const materialOptions = RESIN_MATERIAL_OPTIONS
          .map((option) => `<option value="${escapeHtml(option.id)}"${option.id === row.materialType ? " selected" : ""}>${escapeHtml(option.label)}</option>`)
          .join("");
        const finalSize = row.finalWidthMm > 0 && row.finalHeightMm > 0
          ? `${formatMeasure(row.finalWidthMm)} x ${formatMeasure(row.finalHeightMm)} mm`
          : "-";
        const perSheet = row.piecesPerSheet > 0
          ? `${formatInteger(row.piecesPerSheet)}${row.rotated ? " (girado)" : ""}`
          : "0";
        return `
          <tr class="${row.active ? "" : "is-empty"}" data-resin-row-index="${index}">
            <td><strong>${String(index + 1).padStart(2, "0")}</strong></td>
            <td><select class="cell-select" name="materialType">${materialOptions}</select></td>
            <td><input class="cell-input description" name="description" value="${escapeHtml(row.description)}" placeholder="${escapeHtml(buildResinMaterialDescription(row))}"></td>
            <td><input class="cell-input" name="widthMm" type="number" min="0" step="0.1" value="${escapeHtml(row.widthMm)}"></td>
            <td><input class="cell-input" name="heightMm" type="number" min="0" step="0.1" value="${escapeHtml(row.heightMm)}"></td>
            <td><input class="cell-input" name="quantity" type="number" min="0" step="1" value="${escapeHtml(row.quantity)}"></td>
            <td><span class="readonly-value subtle">${escapeHtml(finalSize)}</span></td>
            <td><span class="readonly-value subtle">${escapeHtml(perSheet)}</span></td>
            <td><span class="readonly-value subtle">${formatInteger(row.sheetsNeeded)}</span></td>
            <td><span class="readonly-value subtle">${formatCurrency(row.sheetPrice)}</span></td>
            <td><span class="readonly-value subtle">${row.minimumApplied ? "Aplicado" : formatCurrency(row.minimumOrderPrice)}</span></td>
            <td>${createDiscountTypeSelect(row)}</td>
            <td>${createDiscountValueInput(row)}</td>
            <td><span class="readonly-value">${formatCurrency(row.total)}</span></td>
            <td><span class="readonly-value subtle">${formatCurrency(row.unitValue)}</span></td>
          </tr>
        `;
      })
      .join("");
    resinWarningList.innerHTML = resinWorkbook.warnings.length
      ? resinWorkbook.warnings.map((warning) => `<div class="warning-item">${escapeHtml(warning)}</div>`).join("")
      : `<div class="warning-item is-success">Informe medidas em milímetros para calcular automaticamente a resina, o aproveitamento e o total por A3.</div>`;
    quotePreview.innerHTML = createQuoteHtml(state, workbook, colorWorkbook, credentialWorkbook, m2Workbook, readyWorkbook, resinWorkbook, cardWorkbook, flyerWorkbook, blockSulfiteWorkbook, blockAutocopiativoWorkbook);
    return { workbook, colorWorkbook, credentialWorkbook, m2Workbook, readyWorkbook, resinWorkbook, cardWorkbook, blockSulfiteWorkbook, blockAutocopiativoWorkbook };
  }

  function closeM2FinishPopover() {
    const existing = document.getElementById("m2-finish-popover");
    if (existing) {
      existing.remove();
    }
  }

  function closeCredentialLanyardPopover() {
    const existing = document.getElementById("credential-lanyard-popover");
    if (existing) {
      existing.remove();
    }
  }

  function openCredentialLanyardPopover(rowIndex, anchor) {
    const row = state.credentialItems[rowIndex];
    if (!row || !anchor) {
      return;
    }

    closeCredentialLanyardPopover();

    const quantity = toWholeNumber(row.quantity);
    const options = getCredentialLanyardOptions(config);
    const selected = getCredentialLanyardSelection(config, row.lanyardType);
    const popover = document.createElement("div");
    popover.id = "credential-lanyard-popover";
    popover.className = "finish-popover credential-lanyard-popover";
    popover.innerHTML = `
      <div class="finish-popover-header">
        <div class="finish-popover-title">
          <strong>Cordão da credencial</strong>
          <span>Escolha o acessório que será somado automaticamente ao valor desta linha.</span>
        </div>
        <button type="button" class="button finish-popover-close" data-credential-lanyard-close>Fechar</button>
      </div>
      <div class="finish-popover-list">
        ${options.map((option) => `
          <label class="finish-picker-option${option.id === "none" ? " is-none" : ""}">
            <input type="radio" name="credential-lanyard-option" value="${escapeHtml(option.id)}"${selected.id === option.id ? " checked" : ""} data-credential-lanyard-option>
            <div class="finish-picker-option-body">
              <div class="finish-option-copy">
                <span class="finish-option-label">${escapeHtml(option.label)}</span>
                <small>${escapeHtml(option.hint)}</small>
              </div>
            </div>
          </label>
        `).join("")}
      </div>
      <div class="finish-popover-footer">
        <span class="finish-popover-summary">${quantity > 0 ? `${formatInteger(quantity)} un na linha` : "Defina a quantidade para calcular o total"}</span>
        <button type="button" class="button finish-popover-clear" data-credential-lanyard-clear>Sem cordão</button>
      </div>
    `;

    document.body.appendChild(popover);

    const rect = anchor.getBoundingClientRect();
    popover.style.position = "fixed";
    popover.style.visibility = "hidden";
    popover.style.top = "12px";
    popover.style.left = "12px";
    const popoverRect = popover.getBoundingClientRect();
    const spacing = 12;
    const fitsBelow = rect.bottom + spacing + popoverRect.height <= window.innerHeight - spacing;
    const top = fitsBelow
      ? rect.bottom + spacing
      : Math.max(spacing, rect.top - popoverRect.height - spacing);
    const left = Math.min(
      Math.max(spacing, rect.left),
      Math.max(spacing, window.innerWidth - popoverRect.width - spacing)
    );
    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
    popover.style.visibility = "visible";

    popover.addEventListener("change", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement) || target.type !== "radio") {
        return;
      }
      row.lanyardType = target.value || "none";
      persist();
      renderRowsAndSummary();
      closeCredentialLanyardPopover();
    });

    popover.addEventListener("click", (event) => {
      if (event.target.closest("[data-credential-lanyard-close]")) {
        closeCredentialLanyardPopover();
        return;
      }
      if (event.target.closest("[data-credential-lanyard-clear]")) {
        row.lanyardType = "none";
        persist();
        renderRowsAndSummary();
        closeCredentialLanyardPopover();
      }
    });
  }

  function openM2FinishPopover(rowIndex, anchor) {
    const row = state.m2Items[rowIndex];
    if (!row || !anchor) {
      return;
    }

    closeM2FinishPopover();

    const finishes = Array.isArray(config.m2Finishes) ? config.m2Finishes : [];
    const selectedIds = Array.isArray(row.finishIds) ? row.finishIds : [];
    const selectedLabels = selectedIds
      .map((finishId) => finishes.find((finish) => finish.id === finishId)?.label)
      .filter(Boolean);
    const popover = document.createElement("div");
    popover.id = "m2-finish-popover";
    popover.className = "finish-popover";
    popover.innerHTML = `
      <div class="finish-popover-header">
        <div class="finish-popover-title">
          <strong>Acabamentos</strong>
          <span>Escolha os adicionais de produção que entram neste item.</span>
        </div>
        <button type="button" class="button finish-popover-close" data-finish-popover-close>Fechar</button>
      </div>
      <label class="finish-picker-option is-none finish-popover-empty">
        <input type="radio" name="m2-finish-none" value="none"${selectedIds.length === 0 ? " checked" : ""} data-finish-popover-option>
        <div class="finish-picker-option-body">
          <div class="finish-option-copy">
            <span class="finish-option-label">Sem acabamento</span>
            <small>Remove todos os adicionais e mantém apenas o material principal.</small>
          </div>
        </div>
      </label>
      <div class="finish-popover-list">
        ${finishes.map((finish) => {
          const checked = selectedIds.includes(finish.id);
          const isEyelet = finish.type === "eyelet";
          const overrideValue = row.finishOverrides?.[finish.id];
          const finishHint = isEyelet
            ? "Calculado pela quantidade de ilhós, com espaçamento automático ou quantidade manual."
            : finish.type === "perimeter"
              ? "Calculado pelo perímetro total da peça."
              : "Calculado pela área total em m².";
          return `
          <label class="finish-picker-option">
            <input type="checkbox" value="${escapeHtml(finish.id)}"${checked ? " checked" : ""} data-finish-popover-option data-finish-id="${escapeHtml(finish.id)}">
            <div class="finish-picker-option-body">
              <div class="finish-option-copy">
                <span class="finish-option-label">${escapeHtml(finish.label)}</span>
                <small>${escapeHtml(finishHint)}</small>
              </div>
              ${isEyelet ? `
                <div class="finish-eyelet-settings"${checked ? "" : " hidden"}>
                  <span>Espaçamento</span>
                  <input type="number" min="1" step="1" value="${escapeHtml(finish.spacingCm || 20)}" data-finish-spacing-id="${escapeHtml(finish.id)}">
                  <span>cm</span>
                </div>
                <div class="finish-eyelet-settings"${checked ? "" : " hidden"}>
                  <span>Qtd. manual</span>
                  <input type="number" min="0" step="1" value="${overrideValue > 0 ? escapeHtml(overrideValue) : ""}" placeholder="Auto" data-finish-override-id="${escapeHtml(finish.id)}">
                  <span>ilhós</span>
                </div>
              ` : ""}
            </div>
          </label>
        `;}).join("")}
      </div>
      <div class="finish-popover-footer">
        <span class="finish-popover-summary">${escapeHtml(selectedLabels.length ? `${selectedLabels.length} selecionado(s)` : "Nenhum acabamento selecionado")}</span>
        <button type="button" class="button finish-popover-clear" data-finish-popover-clear>Limpar seleção</button>
      </div>
    `;

    document.body.appendChild(popover);

    const rect = anchor.getBoundingClientRect();
    popover.style.position = "fixed";
    popover.style.visibility = "hidden";
    popover.style.top = "12px";
    popover.style.left = "12px";
    const popoverRect = popover.getBoundingClientRect();
    const spacing = 12;
    const fitsBelow = rect.bottom + spacing + popoverRect.height <= window.innerHeight - spacing;
    const top = fitsBelow
      ? rect.bottom + spacing
      : Math.max(spacing, rect.top - popoverRect.height - spacing);
    const left = Math.min(
      Math.max(spacing, rect.left),
      Math.max(spacing, window.innerWidth - popoverRect.width - spacing)
    );
    popover.style.position = "fixed";
    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
    popover.style.visibility = "visible";
    popover.dataset.rowIndex = String(rowIndex);

    const syncSelection = () => {
      const checked = Array.from(popover.querySelectorAll('input[type="checkbox"][data-finish-popover-option]:checked')).map((input) => input.value);
      row.finishIds = checked;
      persist();
      renderRowsAndSummary();
    };

    popover.addEventListener("change", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) {
        return;
      }

      if (target.type === "radio" && target.value === "none") {
        row.finishIds = [];
        persist();
        renderRowsAndSummary();
        closeM2FinishPopover();
        return;
      }

      if (target.type === "checkbox") {
        const noneRadio = popover.querySelector('input[type="radio"][value="none"]');
        if (noneRadio) {
          noneRadio.checked = false;
        }
        const rowLabel = target.closest(".finish-picker-option");
        rowLabel?.querySelectorAll(".finish-eyelet-settings").forEach((item) => {
          item.hidden = !target.checked;
        });
        const hasAny = Array.from(popover.querySelectorAll('input[type="checkbox"][data-finish-popover-option]')).some((input) => input.checked);
        if (!hasAny && noneRadio) {
          noneRadio.checked = true;
        }
        syncSelection();
        return;
      }

      if (target.type === "number" && target.dataset.finishSpacingId) {
        const finish = config.m2Finishes.find((item) => item.id === target.dataset.finishSpacingId);
        if (finish) {
          finish.spacingCm = toWholeNumber(target.value);
          persist();
          renderRowsAndSummary();
        }
        return;
      }

      if (target.type === "number" && target.dataset.finishOverrideId) {
        const finishId = target.dataset.finishOverrideId;
        if (!row.finishOverrides || typeof row.finishOverrides !== "object") {
          row.finishOverrides = {};
        }
        const rawValue = String(target.value || "").trim();
        if (!rawValue) {
          delete row.finishOverrides[finishId];
        } else {
          const overrideValue = toWholeNumber(rawValue);
          if (overrideValue > 0) {
            row.finishOverrides[finishId] = overrideValue;
          } else {
            delete row.finishOverrides[finishId];
          }
        }
        persist();
        renderRowsAndSummary();
      }
    });

    popover.addEventListener("click", (event) => {
      if (event.target.closest("[data-finish-popover-close]")) {
        closeM2FinishPopover();
        return;
      }

      if (event.target.closest("[data-finish-popover-clear]")) {
        row.finishIds = [];
        persist();
        renderRowsAndSummary();
        closeM2FinishPopover();
      }
    });
  }

  function closeColorServicePopover() {
    const existing = document.getElementById("color-service-popover");
    if (existing) {
      existing.remove();
    }
  }

  function openColorServicePopover(rowIndex, anchor) {
    const row = state.colorPrintItems[rowIndex];
    if (!row || !anchor) {
      return;
    }

    closeColorServicePopover();

    const services = getCombinationServices(config);
    const selectedIds = Array.isArray(row.serviceIds) ? row.serviceIds : [];
    const selectedLabels = selectedIds
      .map((serviceId) => services.find((service) => service.id === serviceId)?.label)
      .filter(Boolean);
    const popover = document.createElement("div");
    popover.id = "color-service-popover";
    popover.className = "finish-popover";
    popover.innerHTML = `
      <div class="finish-popover-header">
        <div class="finish-popover-title">
          <strong>Complementos do item</strong>
          <span>Combine plastificação, criação e extras no mesmo impresso.</span>
        </div>
        <button type="button" class="button finish-popover-close" data-color-service-close>Fechar</button>
      </div>
      <label class="finish-picker-option is-none finish-popover-empty">
        <input type="radio" name="color-service-none" value="none"${selectedIds.length === 0 ? " checked" : ""} data-color-service-option>
        <div class="finish-picker-option-body">
          <div class="finish-option-copy">
            <span class="finish-option-label">Sem complemento</span>
            <small>Remove todos os complementos e mantém apenas impressão/corte.</small>
          </div>
        </div>
      </label>
      <div class="finish-popover-list">
        ${services.map((service) => {
          const checked = selectedIds.includes(service.id);
          const overrideValue = row.serviceOverrides?.[service.id];
          const isAutomaticPlastification = service.pricingMode === "plastification-auto" || service.id === AUTO_PLASTIFICATION_SERVICE_ID;
          return `
            <label class="finish-picker-option">
              <input type="checkbox" value="${escapeHtml(service.id)}"${checked ? " checked" : ""} data-color-service-option data-color-service-id="${escapeHtml(service.id)}">
              <div class="finish-picker-option-body">
                <div class="finish-option-copy">
                  <span class="finish-option-label">${escapeHtml(service.label)}</span>
                  <small>${escapeHtml(service.note || "Defina o valor final deste complemento para este item.")}</small>
                </div>
                ${isAutomaticPlastification ? `
                  <div class="finish-eyelet-settings"${checked ? "" : " hidden"}>
                    <span>Valor calculado automaticamente</span>
                  </div>
                ` : `
                  <div class="finish-eyelet-settings"${checked ? "" : " hidden"}>
                    <span>Valor</span>
                    <input type="number" min="0" step="0.01" value="${escapeHtml(overrideValue === "" || overrideValue == null ? service.defaultPrice : overrideValue)}" data-color-service-price-id="${escapeHtml(service.id)}">
                    <span>R$</span>
                  </div>
                `}
              </div>
            </label>
          `;
        }).join("")}
      </div>
      <div class="finish-popover-footer">
        <span class="finish-popover-summary">${escapeHtml(selectedLabels.length ? `${selectedLabels.length} selecionado(s)` : "Nenhum complemento selecionado")}</span>
        <button type="button" class="button finish-popover-clear" data-color-service-clear>Limpar seleção</button>
      </div>
    `;

    document.body.appendChild(popover);

    const rect = anchor.getBoundingClientRect();
    popover.style.position = "fixed";
    popover.style.visibility = "hidden";
    popover.style.top = "12px";
    popover.style.left = "12px";
    const popoverRect = popover.getBoundingClientRect();
    const spacing = 12;
    const fitsBelow = rect.bottom + spacing + popoverRect.height <= window.innerHeight - spacing;
    const top = fitsBelow
      ? rect.bottom + spacing
      : Math.max(spacing, rect.top - popoverRect.height - spacing);
    const left = Math.min(
      Math.max(spacing, rect.left),
      Math.max(spacing, window.innerWidth - popoverRect.width - spacing)
    );
    popover.style.position = "fixed";
    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
    popover.style.visibility = "visible";

    const syncSelection = () => {
      const checked = Array.from(popover.querySelectorAll('input[type="checkbox"][data-color-service-option]:checked')).map((input) => input.value);
      row.serviceIds = checked;
      persist();
      renderRowsAndSummary();
    };

    popover.addEventListener("change", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) {
        return;
      }

      if (target.type === "radio" && target.value === "none") {
        row.serviceIds = [];
        row.serviceOverrides = {};
        persist();
        renderRowsAndSummary();
        closeColorServicePopover();
        return;
      }

      if (target.type === "checkbox") {
        const noneRadio = popover.querySelector('input[type="radio"][value="none"]');
        if (noneRadio) {
          noneRadio.checked = false;
        }
        const rowLabel = target.closest(".finish-picker-option");
        rowLabel?.querySelectorAll(".finish-eyelet-settings").forEach((item) => {
          item.hidden = !target.checked;
        });
        const hasAny = Array.from(popover.querySelectorAll('input[type="checkbox"][data-color-service-option]')).some((input) => input.checked);
        if (!hasAny && noneRadio) {
          noneRadio.checked = true;
        }
        syncSelection();
        return;
      }

      if (target.type === "number" && target.dataset.colorServicePriceId) {
        const serviceId = target.dataset.colorServicePriceId;
        if (!row.serviceOverrides || typeof row.serviceOverrides !== "object") {
          row.serviceOverrides = {};
        }
        row.serviceOverrides[serviceId] = toMoneyNumber(target.value);
        persist();
        renderRowsAndSummary();
      }
    });

    popover.addEventListener("click", (event) => {
      if (event.target.closest("[data-color-service-close]")) {
        closeColorServicePopover();
        return;
      }

      if (event.target.closest("[data-color-service-clear]")) {
        row.serviceIds = [];
        row.serviceOverrides = {};
        persist();
        renderRowsAndSummary();
        closeColorServicePopover();
      }
    });
  }

  function renderAll() {
    const steps = [
      ["preset-controls", () => renderPresetControls()],
      ["client-fields", () => renderClientFields()],
      ["account-settings", () => renderAccountSettings()],
      ["config", () => renderConfig()],
      ["clients-tab", () => renderClientsTab()],
      ["home-tab", () => renderHomeTab()],
      ["os-tab", () => renderOrdersTab()],
      ["history-tab", () => renderHistoryTab()],
      ["developer-area", () => renderDeveloperArea()],
      ["access-rules", () => applyAccessRules()],
    ];

    for (const [label, runStep] of steps) {
      try {
        runStep();
      } catch (error) {
        console.error(`Falha ao renderizar ${label}.`, error);
      }
    }

    if (currentUser && userNeedsPasswordChange(currentUser)) {
      openPasswordChangeModal(currentUser);
    }

    return renderRowsAndSummary();
  }

  function updatePreset(name, value) {
    state.presets[name] = value;
    persist();
  }

  function applyPreset(scope) {
    state.rows.forEach((row) => {
      if (scope === "active" && !isRowActive(row)) {
        return;
      }
      applyPresetToRow(row, state.presets);
    });
    persist();
    renderRowsAndSummary();
  }

  async function importPdfFiles(fileList) {
    const files = [...fileList].filter((file) => file.name.toLowerCase().endsWith(".pdf"));
    if (files.length === 0) {
      setMainFeedback("Nenhum PDF válido foi selecionado. Escolha um ou mais arquivos em PDF para preencher as linhas automaticamente.", "warning");
      return;
    }

    const firstFreeIndex = state.rows.findIndex((row) => !isRowActive(row));
    const startIndex = firstFreeIndex === -1 ? state.rows.length : firstFreeIndex;
    ensureRowCount(state, startIndex + files.length);

    let imported = 0;
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const pages = await countPdfPages(file);
      const row = state.rows[startIndex + index];
      applyPresetToRow(row, state.presets);
      row.description = file.name.replace(/\.pdf$/i, "");
      row.quantity = 1;
      row.pages = pages || 0;
      imported += 1;
    }

    persist();
    renderRowsAndSummary();
      setMainFeedback(`${imported} PDF(s) importado(s) com sucesso. Se a contagem de páginas de algum arquivo vier diferente, você pode corrigir direto na linha.`, "success");
  }

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectTab(button.dataset.tabTarget);
      closeAppMenu();
    });
  });

  appMenuToggle?.addEventListener("click", () => {
    const isOpen = appMenuToggle.getAttribute("aria-expanded") === "true";
    setAppMenuOpen(!isOpen);
  });

  document.addEventListener("click", (event) => {
    if (!appMenuPanel || appMenuPanel.hidden || !appMenuShell) {
      return;
    }
    if (!appMenuShell.contains(event.target)) {
      closeAppMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAppMenu();
    }
  });

  authStageButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setAuthStage(button.dataset.authStageTarget || "login");
      if ((button.dataset.authStageTarget || "") === "verify") {
        syncPendingVerificationForm();
        updateEmailVerificationCountdown();
      }
    });
  });

  document.getElementById("login-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await loginUser(
      document.getElementById("login-user")?.value || "",
      document.getElementById("login-password")?.value || ""
    );
  });

  document.getElementById("register-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const created = await registerUser(
      document.getElementById("register-user")?.value || "",
      document.getElementById("register-email")?.value || "",
      document.getElementById("register-document")?.value || "",
      document.getElementById("register-birth-date")?.value || "",
      document.getElementById("register-company")?.value || "",
      document.getElementById("register-password")?.value || ""
    );
    if (created) {
      event.target.reset();
    }
  });

  emailVerificationForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const confirmed = await confirmEmailVerification(
      document.getElementById("email-verification-email")?.value || "",
      document.getElementById("email-verification-code")?.value || ""
    );
    if (confirmed) {
      event.target.reset();
    }
  });

  document.getElementById("email-verification-email")?.addEventListener("input", (event) => {
    pendingVerificationEmail = normalizeLookupEmail(event.target.value);
    savePendingVerificationEmail(pendingVerificationEmail);
    updateEmailVerificationCountdown();
  });

  emailVerificationResendButton?.addEventListener("click", () => {
    const emailInput = document.getElementById("email-verification-email");
    const user = findAuthUserByEmail(authUsers, emailInput?.value || pendingVerificationEmail);
    if (!user) {
      setAuthStatus("Não encontramos um cadastro pendente para esse e-mail.", "warning");
      return;
    }
    void issueEmailVerificationCode(user);
  });

  document.getElementById("email-verification-back-button")?.addEventListener("click", () => {
    returnToLoginFromVerification();
  });

  syncPendingVerificationForm();
  setAuthStage("login");
  if (pendingVerificationEmail) {
    const pendingUser = findAuthUserByEmail(authUsers, pendingVerificationEmail);
    if (pendingUser && pendingUser.emailVerification?.status !== "verified") {
      setAuthStage("verify");
      if (emailVerificationTargetLabel) {
        emailVerificationTargetLabel.textContent = `Código enviado para ${pendingVerificationEmail}`;
      }
      if (emailVerificationHelp) {
        emailVerificationHelp.textContent = pendingUser?.emailVerification?.expiresAt
          ? `Este código vale até ${formatDateTime(pendingUser.emailVerification.expiresAt) || "alguns minutos"}.`
          : "O código expira após alguns minutos. Se necessário, reenvie um novo código.";
      }
    } else {
      clearPendingVerificationStep();
    }
  }
  updateEmailVerificationCountdown();

  document.getElementById("logout-button")?.addEventListener("click", async () => {
    await logoutCurrentUser();
  });

  [historyFilterStatus, historyFilterClient, historyFilterStart, historyFilterEnd].forEach((field) => {
    field?.addEventListener("input", () => {
      historyFilters = {
        status: historyFilterStatus?.value || "all",
        client: historyFilterClient?.value || "",
        start: historyFilterStart?.value || "",
        end: historyFilterEnd?.value || "",
      };
      renderHistoryTab();
    });
    field?.addEventListener("change", () => {
      historyFilters = {
        status: historyFilterStatus?.value || "all",
        client: historyFilterClient?.value || "",
        start: historyFilterStart?.value || "",
        end: historyFilterEnd?.value || "",
      };
      renderHistoryTab();
    });
  });

  historyFilterClear?.addEventListener("click", () => {
    historyFilters = {
      status: "all",
      client: "",
      start: "",
      end: "",
    };
    renderHistoryTab();
  });

  [osFilterStatus, osFilterClient, osFilterOwner, osFilterDate].forEach((field) => {
    field?.addEventListener("input", () => {
      workOrderFilters = {
        status: osFilterStatus?.value || "all",
        client: osFilterClient?.value || "",
        owner: osFilterOwner?.value || "",
        date: osFilterDate?.value || "",
      };
      renderOrdersTab();
    });
    field?.addEventListener("change", () => {
      workOrderFilters = {
        status: osFilterStatus?.value || "all",
        client: osFilterClient?.value || "",
        owner: osFilterOwner?.value || "",
        date: osFilterDate?.value || "",
      };
      renderOrdersTab();
    });
  });

  osFilterClear?.addEventListener("click", () => {
    workOrderFilters = {
      status: "all",
      client: "",
      owner: "",
      date: "",
    };
    renderOrdersTab();
  });

  developerUsersList?.addEventListener("click", (event) => {
    if (!isDeveloperSession()) {
      return;
    }
    const button = event.target.closest("[data-dev-user-action]");
    if (!button) {
      return;
    }
    const user = authUsers.find((item) => item.id === button.dataset.devUserId);
    if (!user || user.role === "developer") {
      return;
    }
    if (button.dataset.devUserAction === "activate") {
      user.status = "active";
    } else if (button.dataset.devUserAction === "block") {
      user.status = "blocked";
      if (currentUser?.id === user.id) {
        saveAuthSession(null);
      }
    } else if (applyDeveloperValidationAction(user, button.dataset.devUserAction)) {
      return;
    } else if (button.dataset.devUserAction === "delete") {
      confirmAppAction({
        kicker: "Exclusão",
        title: "Deletar usuário",
        message: `Deseja realmente deletar o usuário "${user.username}"? Esta ação remove o cadastro deste computador.`,
        confirmLabel: "Deletar",
        danger: true,
      }).then((confirmed) => {
        if (!confirmed) {
          setConfigStatus("A exclusão do usuário foi cancelada.", "warning");
          return;
        }
        authUsers = authUsers.filter((item) => item.id !== user.id);
        if (accessControl.userOverrides && typeof accessControl.userOverrides === "object") {
          delete accessControl.userOverrides[user.id];
        }
        if (accessControl.dashboardOverrides && typeof accessControl.dashboardOverrides === "object") {
          delete accessControl.dashboardOverrides[user.id];
        }
        if (selectedDeveloperUserId === user.id) {
          selectedDeveloperUserId = "";
        }
        if (currentUser?.id === user.id) {
          currentUser = null;
          saveAuthSession(null);
        }
        refreshAuthStorage();
        renderDeveloperArea();
        applyAccessRules();
        setConfigStatus(`Usuário ${user.username} deletado com sucesso.`, "warning");
      });
      return;
    } else if (button.dataset.devUserAction === "permissions") {
      selectedDeveloperUserId = user.id;
      renderDeveloperUserPermissions(user);
      return;
    }
    user.updatedAt = new Date().toISOString();
    refreshAuthStorage();
    renderDeveloperArea();
    applyAccessRules();
    setConfigStatus("Usuário atualizado na área do desenvolvedor.", "success");
  });

  developerUsersList?.addEventListener("change", (event) => {
    if (!isDeveloperSession()) {
      return;
    }
    const target = event.target;
    const userId = target.dataset.devUserGroup;
    if (!userId) {
      return;
    }
    const user = authUsers.find((item) => item.id === userId);
    if (!user || user.role === "developer") {
      return;
    }
    user.groupId = target.value;
    user.updatedAt = new Date().toISOString();
    refreshAuthStorage();
    renderDeveloperArea();
    setConfigStatus("Grupo do usuário atualizado.", "success");
  });

  developerUserPermissions?.addEventListener("click", (event) => {
    if (!isDeveloperSession()) {
      return;
    }
    const button = event.target.closest("[data-dev-user-action]");
    if (!button) {
      return;
    }
    const user = authUsers.find((item) => item.id === button.dataset.devUserId);
    if (!user) {
      return;
    }
    if (!applyDeveloperValidationAction(user, button.dataset.devUserAction, { rerenderPermissions: true })) {
      return;
    }
  });

  developerGroupsList?.addEventListener("change", (event) => {
    if (!isDeveloperSession()) {
      return;
    }
    const target = event.target;
    const groupId = target.dataset.devGroupTab;
    const tabId = target.dataset.tabId;
    const dashboardGroupId = target.dataset.devGroupDashboard;
    const dashboardId = target.dataset.dashboardId;
    if (groupId && tabId) {
      const group = accessControl.groups.find((item) => item.id === groupId);
      if (!group) {
        return;
      }
      group.tabs[tabId] = Boolean(target.checked);
      if (group.id === "developer") {
        group.tabs.desenvolvedor = true;
      }
      refreshAuthStorage();
      renderDeveloperArea();
      applyAccessRules();
      setConfigStatus("Permissões do grupo atualizadas.", "success");
      return;
    }
    if (!dashboardGroupId || !dashboardId) {
      return;
    }
    const group = accessControl.groups.find((item) => item.id === dashboardGroupId);
    if (!group) {
      return;
    }
    group.dashboards[dashboardId] = Boolean(target.checked);
    refreshAuthStorage();
    renderDeveloperArea();
    renderHomeTab();
    setConfigStatus("Painéis da Home atualizados para este grupo.", "success");
  });

  developerGroupsList?.addEventListener("click", async (event) => {
    if (!isDeveloperSession()) {
      return;
    }
    const button = event.target.closest("[data-dev-delete-group]");
    if (!button) {
      return;
    }
    const groupId = button.dataset.devDeleteGroup;
    const group = accessControl.groups.find((item) => item.id === groupId);
    if (!group || group.protected) {
      return;
    }
    if (!(await confirmConfigDelete("Deseja excluir este grupo de assinatura? Usuários deste grupo irão para a assinatura profissional."))) {
      return;
    }
    accessControl.groups = accessControl.groups.filter((item) => item.id !== groupId);
    authUsers.forEach((user) => {
      if (user.groupId === groupId) {
        user.groupId = "profissional";
      }
    });
    refreshAuthStorage();
    renderDeveloperArea();
    applyAccessRules();
    setConfigStatus("Grupo excluído.", "warning");
  });

  developerUserPermissions?.addEventListener("change", (event) => {
    if (!isDeveloperSession()) {
      return;
    }
    const target = event.target;
    const userId = target.dataset.devUserTabOverride;
    const tabId = target.dataset.tabId;
    const dashboardUserId = target.dataset.devUserDashboardOverride;
    const dashboardId = target.dataset.dashboardId;
    if (userId && tabId) {
      if (!accessControl.userOverrides[userId]) {
        accessControl.userOverrides[userId] = {};
      }
      if (target.value === "") {
        delete accessControl.userOverrides[userId][tabId];
      } else {
        accessControl.userOverrides[userId][tabId] = target.value === "true";
      }
      refreshAuthStorage();
      renderDeveloperArea();
      applyAccessRules();
      setConfigStatus("Permissão individual atualizada.", "success");
      return;
    }
    if (!dashboardUserId || !dashboardId) {
      return;
    }
    if (!accessControl.dashboardOverrides[dashboardUserId]) {
      accessControl.dashboardOverrides[dashboardUserId] = {};
    }
    if (target.value === "") {
      delete accessControl.dashboardOverrides[dashboardUserId][dashboardId];
    } else {
      accessControl.dashboardOverrides[dashboardUserId][dashboardId] = target.value === "true";
    }
    refreshAuthStorage();
    renderDeveloperArea();
    renderHomeTab();
    setConfigStatus("Painel da Home atualizado para este usuário.", "success");
  });

  developerPasswordForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!isDeveloperSession()) {
      return;
    }
    const selectedUser = authUsers.find((user) => user.id === selectedDeveloperUserId);
    if (!selectedUser) {
      setConfigStatus("Selecione um usuário antes de resetar a senha.", "warning");
      return;
    }
    const temporaryPassword = generateTemporaryPassword(10);
    lastGeneratedTemporaryPassword = temporaryPassword;
    selectedUser.password = temporaryPassword;
    selectedUser.mustChangePassword = true;
    selectedUser.passwordMode = "temporary";
    selectedUser.temporaryPasswordIssuedAt = new Date().toISOString();
    selectedUser.updatedAt = new Date().toISOString();
    refreshAuthStorage();
    let emailPrepared = false;
    if (selectedUser.email && typeof window !== "undefined") {
      try {
        window.location.href = buildPasswordResetMailto(selectedUser, temporaryPassword);
        emailPrepared = true;
      } catch {
        emailPrepared = false;
      }
    }
    renderDeveloperArea();
    if (emailPrepared) {
      setConfigStatus(`Senha temporária de ${selectedUser.username} gerada. O app preparou o envio do e-mail no cliente padrão desta máquina.`, "success");
    } else if (selectedUser.email) {
      setConfigStatus(`Senha temporária de ${selectedUser.username} gerada, mas o envio automático do e-mail não pôde ser iniciado nesta máquina. Senha temporária: ${temporaryPassword}`, "warning");
    } else {
      setConfigStatus(`Senha temporária de ${selectedUser.username} gerada. Este usuário não possui e-mail cadastrado. Senha temporária: ${temporaryPassword}`, "warning");
    }
  });

  developerPasswordSaveButton?.addEventListener("click", async () => {
    if (!isDeveloperSession()) {
      return;
    }
    if (!lastGeneratedTemporaryPassword) {
      setConfigStatus("Gere uma senha temporária antes de usar o botão salvar senha.", "warning");
      return;
    }
    try {
      await navigator.clipboard.writeText(lastGeneratedTemporaryPassword);
      setConfigStatus("Senha temporária copiada para a área de transferência.", "success");
    } catch {
      setConfigStatus(`Não foi possível copiar automaticamente. Senha temporária atual: ${lastGeneratedTemporaryPassword}`, "warning");
    }
  });

  developerSyncUsersButton?.addEventListener("click", async () => {
    if (!isDeveloperSession()) {
      return;
    }
    setConfigStatus("Sincronizando usuários e permissões com a base compartilhada...", "warning");
    reloadAuthContextFromStorage();
    const syncResult = await refreshSharedState(true);
    renderDeveloperArea();
    if (syncResult?.status === "updated") {
      setConfigStatus("Sincronização manual concluída com novos dados.", "success");
      return;
    }
    if (syncResult?.status === "unchanged") {
      setConfigStatus("Sincronização concluída, mas não havia novos dados para baixar.", "success");
      return;
    }
    if (syncResult?.status === "empty") {
      setConfigStatus("A base compartilhada ainda não possui dados disponíveis para sincronizar.", "warning");
      return;
    }
    if (syncResult?.status === "skipped") {
      setConfigStatus("A sincronização ainda não está pronta nesta sessão. Recarregue a página e tente novamente.", "warning");
      return;
    }
    setConfigStatus("Não foi possível sincronizar agora. Verifique se a base compartilhada está ativa nesta máquina.", "error");
  });

  passwordChangeForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!currentUser) {
      return;
    }
    const newPassword = passwordChangeInput?.value || "";
    const confirmPassword = passwordChangeConfirmInput?.value || "";
    if (!newPassword.trim()) {
      setPasswordChangeStatus("Digite sua nova senha para continuar.", "warning");
      passwordChangeInput?.focus();
      return;
    }
    if (!confirmPassword.trim()) {
      setPasswordChangeStatus("Confirme sua nova senha antes de salvar.", "warning");
      passwordChangeConfirmInput?.focus();
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordChangeStatus("A confirmação da senha está diferente. Revise os dois campos.", "error");
      passwordChangeConfirmInput?.focus();
      return;
    }
    const passwordError = validateSecurePassword(newPassword);
    if (passwordError) {
      setPasswordChangeStatus(passwordError, "warning");
      passwordChangeInput?.focus();
      return;
    }
    currentUser.password = newPassword;
    currentUser.mustChangePassword = false;
    currentUser.passwordMode = "permanent";
    currentUser.temporaryPasswordIssuedAt = "";
    currentUser.updatedAt = new Date().toISOString();
    const authIndex = authUsers.findIndex((user) => user.id === currentUser.id);
    if (authIndex >= 0) {
      authUsers[authIndex] = normalizeUserRecord(currentUser, authIndex);
      currentUser = authUsers[authIndex];
    }
    refreshAuthStorage();
    saveAuthSession(currentUser);
    closePasswordChangeModal();
    renderAll();
    selectTab("home");
    setMainFeedback("Nova senha salva com sucesso. Acesso liberado.", "success");
  });

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-password-toggle]");
    if (!button) {
      return;
    }
    const input = document.getElementById(button.dataset.passwordToggle || "");
    if (!input) {
      return;
    }
    const reveal = input.type === "password";
    input.type = reveal ? "text" : "password";
    button.textContent = reveal ? "◉" : "◐";
    button.setAttribute("aria-label", reveal ? "Ocultar senha" : "Mostrar senha");
    button.setAttribute("aria-pressed", reveal ? "true" : "false");
  });

  document.getElementById("developer-add-group-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!isDeveloperSession()) {
      return;
    }
    const input = document.getElementById("developer-group-name");
    const name = input?.value.trim() || "";
    if (!name) {
      setConfigStatus("Digite o nome do grupo antes de criar.", "warning");
      return;
    }
    accessControl.groups.push({
      id: `group-${Date.now()}`,
      name,
      tabs: createTabPermissionMap(true, false),
      dashboards: createDashboardPermissionMap(true),
    });
    if (input) {
      input.value = "";
    }
    refreshAuthStorage();
    renderDeveloperArea();
    setConfigStatus("Novo grupo de assinatura criado.", "success");
  });

  document.getElementById("import-button").addEventListener("click", () => {
    document.getElementById("pdf-input").click();
  });

  document.addEventListener("keydown", handleManagedTabNavigation, true);

  document.getElementById("pdf-input").addEventListener("change", async (event) => {
    if (event.target.files?.length) {
      await importPdfFiles(event.target.files);
      event.target.value = "";
    }
  });

  document.getElementById("add-row-button").addEventListener("click", () => {
    state.rows.push(createDefaultRow(state.rows.length));
    persist();
    renderRowsAndSummary();
  });

  document.getElementById("add-color-row-button").addEventListener("click", () => {
    state.colorPrintItems.push(createDefaultColorPrintRow(state.colorPrintItems.length));
    persist();
    renderRowsAndSummary();
  });

  document.getElementById("add-credential-row-button").addEventListener("click", () => {
    state.credentialItems.push(createDefaultCredentialRow(state.credentialItems.length));
    persist();
    renderRowsAndSummary();
  });

  document.getElementById("add-m2-row-button").addEventListener("click", () => {
    state.m2Items.push(createDefaultM2Row(state.m2Items.length));
    persist();
    renderRowsAndSummary();
  });

  document.getElementById("add-ready-row-button").addEventListener("click", () => {
    state.readyItems.push(createDefaultReadyRow(state.readyItems.length));
    persist();
    renderRowsAndSummary();
  });

  document.getElementById("add-resin-row-button").addEventListener("click", () => {
    state.resinItems.push(createDefaultResinRow(state.resinItems.length));
    persist();
    renderRowsAndSummary();
  });

  document.getElementById("add-card-row-button")?.addEventListener("click", () => {
    state.cardItems.push(createDefaultCardRow(state.cardItems.length));
    persist();
    renderRowsAndSummary();
  });

  document.getElementById("add-flyer-row-button")?.addEventListener("click", () => {
    state.flyerItems.push(createDefaultFlyerRow(state.flyerItems.length));
    persist();
    renderRowsAndSummary();
  });

  document.getElementById("add-block-sulfite-row-button")?.addEventListener("click", () => {
    state.blockItems.sulfite.push(createDefaultBlockRow("sulfite", state.blockItems.sulfite.length));
    persist();
    renderRowsAndSummary();
  });

  document.getElementById("add-block-autocopiativo-row-button")?.addEventListener("click", () => {
    state.blockItems.autocopiativo.push(createDefaultBlockRow("autocopiativo", state.blockItems.autocopiativo.length));
    persist();
    renderRowsAndSummary();
  });

  document.getElementById("clear-all-button").addEventListener("click", async () => {
    if (!(await confirmAppAction({
      kicker: "Limpeza",
      title: "Limpar linhas de apostila",
      message: "Deseja realmente limpar todas as linhas da aba de cálculo de apostila?",
      confirmLabel: "Limpar",
      danger: true,
    }))) {
      setMainFeedback("A limpeza das linhas de apostila foi cancelada.", "warning");
      return;
    }
    selectedRowIds.clear();
    state.rows = Array.from({ length: 5 }, (_, index) => createDefaultRow(index));
    persist();
    renderRowsAndSummary();
    setMainFeedback("As linhas de cálculo de apostila foram limpas.", "warning");
  });

  document.getElementById("clear-color-rows-button").addEventListener("click", async () => {
    if (!(await confirmAppAction({
      kicker: "Limpeza",
      title: "Limpar impressos coloridos",
      message: "Deseja realmente limpar todas as linhas da aba de impressos coloridos?",
      confirmLabel: "Limpar",
      danger: true,
    }))) {
      setColorFeedback("A limpeza dos impressos coloridos foi cancelada.", "warning");
      return;
    }
    state.colorPrintItems = Array.from({ length: 5 }, (_, index) => createDefaultColorPrintRow(index));
    persist();
    renderRowsAndSummary();
    setColorFeedback("As linhas de impressos coloridos foram limpas.", "warning");
  });

  document.getElementById("clear-credential-rows-button").addEventListener("click", async () => {
    if (!(await confirmAppAction({
      kicker: "Limpeza",
      title: "Limpar credenciais",
      message: "Deseja realmente limpar todas as linhas da aba de credenciais?",
      confirmLabel: "Limpar",
      danger: true,
    }))) {
      setCredentialFeedback("A limpeza das credenciais foi cancelada.", "warning");
      return;
    }
    state.credentialItems = Array.from({ length: 5 }, (_, index) => createDefaultCredentialRow(index));
    persist();
    renderRowsAndSummary();
    setCredentialFeedback("As linhas de credenciais foram limpas.", "warning");
  });

  document.getElementById("clear-m2-rows-button").addEventListener("click", async () => {
    if (!(await confirmAppAction({
      kicker: "Limpeza",
      title: "Limpar cálculo de m²",
      message: "Deseja realmente limpar todas as linhas da aba de cálculo de m²?",
      confirmLabel: "Limpar",
      danger: true,
    }))) {
      setConfigStatus("Limpeza cancelada.", "warning");
      return;
    }
    state.m2Items = Array.from({ length: 5 }, (_, index) => createDefaultM2Row(index));
    persist();
    renderRowsAndSummary();
    setConfigStatus("Linhas de cálculo de m² limpas.", "warning");
  });

  document.getElementById("clear-ready-rows-button").addEventListener("click", async () => {
    if (!(await confirmAppAction({
      kicker: "Limpeza",
      title: "Limpar materiais prontos",
      message: "Deseja realmente limpar todas as linhas da aba de materiais prontos?",
      confirmLabel: "Limpar",
      danger: true,
    }))) {
      setConfigStatus("Limpeza cancelada.", "warning");
      return;
    }
    state.readyItems = Array.from({ length: 5 }, (_, index) => createDefaultReadyRow(index));
    persist();
    renderRowsAndSummary();
    setConfigStatus("Linhas de materiais prontos limpas.", "warning");
  });

  document.getElementById("clear-resin-rows-button").addEventListener("click", async () => {
    if (!(await confirmAppAction({
      kicker: "Limpeza",
      title: "Limpar resinados",
      message: "Deseja realmente limpar todas as linhas da aba de resinados?",
      confirmLabel: "Limpar",
      danger: true,
    }))) {
      setConfigStatus("Limpeza cancelada.", "warning");
      return;
    }
    state.resinItems = Array.from({ length: 5 }, (_, index) => createDefaultResinRow(index));
    persist();
    renderRowsAndSummary();
    setConfigStatus("Linhas de resinados limpas.", "warning");
  });

  document.getElementById("clear-card-rows-button")?.addEventListener("click", async () => {
    if (!(await confirmAppAction({
      kicker: "Cartões",
      title: "Limpar cartões de visita",
      message: "Deseja realmente limpar todas as linhas da aba de cartões de visita?",
      confirmLabel: "Limpar",
      danger: true,
    }))) {
      return;
    }
    state.cardItems = Array.from({ length: 5 }, (_, index) => createDefaultCardRow(index));
    persist();
    renderRowsAndSummary();
    setConfigStatus("Linhas de cartões de visita limpas.", "warning");
  });

  document.getElementById("clear-flyer-rows-button")?.addEventListener("click", async () => {
    if (!(await confirmAppAction({
      kicker: "Panfletos",
      title: "Limpar panfletos e folders",
      message: "Deseja realmente limpar todas as linhas da aba de panfletos e folders?",
      confirmLabel: "Limpar",
      danger: true,
    }))) {
      return;
    }
    state.flyerItems = Array.from({ length: 5 }, (_, index) => createDefaultFlyerRow(index));
    persist();
    renderRowsAndSummary();
    setConfigStatus("Linhas de panfletos e folders limpas.", "warning");
  });

  document.getElementById("clear-block-sulfite-rows-button")?.addEventListener("click", async () => {
    if (!(await confirmAppAction({
      kicker: "Limpeza",
      title: "Limpar blocos sulfite",
      message: "Deseja realmente limpar todas as linhas da aba de blocos sulfite 75g?",
      confirmLabel: "Limpar",
      danger: true,
    }))) {
      return;
    }
    state.blockItems.sulfite = Array.from({ length: 5 }, (_, index) => createDefaultBlockRow("sulfite", index));
    persist();
    renderRowsAndSummary();
  });

  document.getElementById("clear-block-autocopiativo-rows-button")?.addEventListener("click", async () => {
    if (!(await confirmAppAction({
      kicker: "Limpeza",
      title: "Limpar blocos autocopiativo",
      message: "Deseja realmente limpar todas as linhas da aba de blocos papel autocopiativo?",
      confirmLabel: "Limpar",
      danger: true,
    }))) {
      return;
    }
    state.blockItems.autocopiativo = Array.from({ length: 5 }, (_, index) => createDefaultBlockRow("autocopiativo", index));
    persist();
    renderRowsAndSummary();
  });

  document.getElementById("calc-mode-select").addEventListener("change", (event) => {
    state.calcMode = event.target.value;
    persist();
    renderRowsAndSummary();
  });

  document.getElementById("m2-calc-mode-select").addEventListener("change", (event) => {
    state.m2CalcMode = OPTIONS.m2CalcModes.includes(event.target.value) ? event.target.value : "Independente";
    persist();
    renderRowsAndSummary();
  });

  document.getElementById("account-profile-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!currentUser) {
      setAccountSettingsStatus("Entre no sistema para alterar os dados do usuário.", "warning");
      return;
    }

    const username = document.getElementById("account-username")?.value.trim() || "";
    const email = document.getElementById("account-email")?.value.trim() || "";
    const documentValue = document.getElementById("account-document")?.value.trim() || "";
    const birthDate = document.getElementById("account-birth-date")?.value || "";
    const userCompany = document.getElementById("account-user-company")?.value.trim() || "";

    if (!username) {
      setAccountSettingsStatus("Informe o nome do usuário.", "warning");
      return;
    }
    if (!isValidEmailFormat(email)) {
      setAccountSettingsStatus("Informe um e-mail válido ou deixe o campo em branco.", "warning");
      return;
    }
    if (authUsers.some((user) => user.id !== currentUser.id && user.username.trim().toLowerCase() === username.toLowerCase())) {
      setAccountSettingsStatus("Já existe outro usuário com esse nome.", "error");
      return;
    }

    const previousEmail = normalizeLookupEmail(currentUser.email);
    const nextEmail = normalizeLookupEmail(email);
    currentUser = normalizeUserRecord({
      ...currentUser,
      username,
      email,
      document: documentValue,
      birthDate,
      company: userCompany,
      emailVerification: previousEmail === nextEmail
        ? currentUser.emailVerification
        : { status: email ? "pending" : "pending", code: "", sentAt: "", verifiedAt: "", expiresAt: "", resendAvailableAt: "", lastDeliveryMode: "manual" },
      updatedAt: new Date().toISOString(),
    });

    const authIndex = authUsers.findIndex((user) => user.id === currentUser.id);
    if (authIndex >= 0) {
      authUsers[authIndex] = currentUser;
    }
    saveAuthSession(currentUser);
    await saveSecuritySharedNow();
    renderAll();
    setAccountSettingsStatus("Dados do usuário salvos com sucesso.", "success");
  });

  document.getElementById("account-password-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!currentUser) {
      setAccountSettingsStatus("Entre no sistema para alterar a senha.", "warning");
      return;
    }
    if (currentUser.role === "developer") {
      setAccountSettingsStatus("A senha do desenvolvedor é controlada pelas variáveis do servidor para manter a segurança do SaaS.", "warning");
      return;
    }

    const currentPassword = document.getElementById("account-current-password")?.value || "";
    const newPassword = document.getElementById("account-new-password")?.value || "";
    const confirmPassword = document.getElementById("account-confirm-password")?.value || "";

    if (currentPassword !== currentUser.password) {
      setAccountSettingsStatus("A senha atual não confere.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      setAccountSettingsStatus("A nova senha e a confirmação precisam ser iguais.", "warning");
      return;
    }
    const passwordError = validateSecurePassword(newPassword);
    if (passwordError) {
      setAccountSettingsStatus(passwordError, "warning");
      return;
    }

    currentUser.password = newPassword;
    currentUser.passwordMode = "permanent";
    currentUser.mustChangePassword = false;
    currentUser.temporaryPasswordIssuedAt = "";
    currentUser.updatedAt = new Date().toISOString();
    const authIndex = authUsers.findIndex((user) => user.id === currentUser.id);
    if (authIndex >= 0) {
      authUsers[authIndex] = normalizeUserRecord(currentUser, authIndex);
      currentUser = authUsers[authIndex];
    }
    saveAuthSession(currentUser);
    await saveSecuritySharedNow();
    event.currentTarget.reset();
    setAccountSettingsStatus("Senha alterada com sucesso.", "success");
  });

  document.getElementById("account-company-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    state.company.name = document.getElementById("account-company-name")?.value.trim() || "";
    state.company.cnpj = document.getElementById("account-company-cnpj")?.value.trim() || "";
    state.company.contact = document.getElementById("account-company-contact")?.value.trim() || "";
    state.company.address = document.getElementById("account-company-address")?.value.trim() || "";
    persistLocalOnly();
    renderAll();
    await saveSharedNow(true);
    setAccountSettingsStatus("Dados da empresa salvos e aplicados ao orçamento.", "success");
  });

  document.getElementById("account-company-logo-input")?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      state.company.logoDataUrl = typeof reader.result === "string" ? reader.result : "";
      persistLocalOnly();
      renderAll();
      await saveSharedNow(true);
      setAccountSettingsStatus("Logo da empresa atualizada.", "success");
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  });

  document.getElementById("account-config-access-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const mode = document.getElementById("account-config-open")?.checked ? "open" : "password";
    const passwordInput = document.getElementById("account-config-password");
    const currentSettings = getConfigAccessSettings();
    const nextPassword = passwordInput?.value || "";

    if (mode === "password" && !currentSettings.password && !nextPassword.trim()) {
      setAccountSettingsStatus("Digite uma senha para proteger a configuração ou deixe a configuração em modo livre.", "warning");
      return;
    }

    config.security = config.security || {};
    config.security.configAccess = {
      mode,
      password: nextPassword.trim() ? nextPassword : currentSettings.password,
    };
    if (mode === "open") {
      isConfigUnlocked = true;
      saveSessionFlag(SESSION_KEYS.configUnlocked, true);
    } else {
      isConfigUnlocked = false;
      saveSessionFlag(SESSION_KEYS.configUnlocked, false);
    }

    saveToStorage(STORAGE_KEYS.config, config);
    renderAll();
    await saveSharedNow(true);
    setAccountSettingsStatus(mode === "open"
      ? "Configuração liberada sem senha."
      : "Configuração protegida por senha.", "success");
  });

  [
    ["preset-print-type", "printType"],
    ["preset-size", "size"],
    ["preset-print-mode", "printMode"],
    ["preset-finishing", "finishing"],
    ["preset-cover", "coverType"],
    ["preset-cover-paper", "coverPaper"],
    ["preset-back-cover", "backCoverType"],
    ["preset-back-cover-paper", "backCoverPaper"],
    ["preset-spiral-option", "spiralOption"],
  ].forEach(([elementId, key]) => {
    document.getElementById(elementId).addEventListener("change", (event) => {
      updatePreset(key, event.target.value);
    });
  });

  document.getElementById("apply-preset-active").addEventListener("click", () => {
    applyPreset("active");
  });

  document.getElementById("apply-preset-all").addEventListener("click", () => {
    applyPreset("all");
  });

  rowsTableBody.addEventListener("change", (event) => {
    const target = event.target;
    if (target.classList.contains("row-selector")) {
      const rowId = target.dataset.rowId;
      if (!rowId) {
        return;
      }
      if (target.checked) {
        selectedRowIds.add(rowId);
      } else {
        selectedRowIds.delete(rowId);
      }
      return;
    }

    const rowElement = target.closest("tr[data-row-index]");
    if (!rowElement) {
      return;
    }
    const row = state.rows[Number(rowElement.dataset.rowIndex)];
    const field = target.name;
    if (!field || !row) {
      return;
    }
    if (field === "quantity" || field === "pages") {
      row[field] = toWholeNumber(target.value);
    } else if (field === "discountValue") {
      row.discountValue = normalizeDiscountValue(target.value);
    } else if (field === "discountType") {
      row.discountType = normalizeDiscountType(target.value);
    } else {
      row[field] = target.value;
    }
    persist();
    renderRowsAndSummary();
  });

  colorRowsTableBody.addEventListener("change", (event) => {
    const target = event.target;
    const rowElement = target.closest("tr[data-color-row-index]");
    if (!rowElement) {
      return;
    }

    const row = state.colorPrintItems[Number(rowElement.dataset.colorRowIndex)];
    const field = target.name;
    if (!field || !row) {
      return;
    }

    if (field === "productPresetId") {
      row.productPresetId = target.value;
      const preset = getColorProductCatalog(config).find((item) => item.id === target.value);
      if (preset) {
        row.description = row.description || preset.label || "";
        row.widthMm = Number(preset.widthCm || 0);
        row.heightMm = Number(preset.heightCm || 0);
        row.bleedMode = preset.bleedMode || "Sem sangra";
        row.printMode = preset.printMode || "Só frente";
        row.paperType = preset.paperType || "Sulfite 75g";
        if (preset.customPricingMode === "direct-bracket-unit") {
          row.cutPriceOverride = "";
          if (preset.unitLabel === "Folha A3") {
            row.widthMm = 29.7;
            row.heightMm = 42;
          } else if (!(Number(preset.widthCm || 0) > 0 && Number(preset.heightCm || 0) > 0)) {
            row.widthMm = 0;
            row.heightMm = 0;
          }
        }
      }
    } else if (field === "quantity") {
      row[field] = toWholeNumber(target.value);
    } else if (field === "widthMm" || field === "heightMm") {
      row[field] = toDecimalNumber(target.value);
    } else if (field === "cutPriceOverride") {
      row[field] = target.value === "" ? "" : toMoneyNumber(target.value);
    } else if (field === "discountValue") {
      row.discountValue = normalizeDiscountValue(target.value);
    } else if (field === "discountType") {
      row.discountType = normalizeDiscountType(target.value);
    } else {
      row[field] = target.value;
    }

    persist();
    renderRowsAndSummary();
  });

  credentialRowsTableBody.addEventListener("change", (event) => {
    const target = event.target;
    const rowElement = target.closest("tr[data-credential-row-index]");
    if (!rowElement) {
      return;
    }

    const row = state.credentialItems[Number(rowElement.dataset.credentialRowIndex)];
    const field = target.name;
    if (!field || !row) {
      return;
    }

    if (field === "widthCm" || field === "heightCm") {
      row[field] = toDecimalNumber(target.value);
    } else if (field === "quantity") {
      row.quantity = toWholeNumber(target.value);
    } else if (field === "materialType") {
      row.materialType = OPTIONS.credentialMaterials.includes(target.value) ? target.value : "Couche 250g";
    } else if (field === "printMode") {
      row.printMode = target.value === "Frente e verso" ? "Frente e verso" : "Só frente";
    } else if (field === "lamination") {
      row.lamination = target.value === "Com laminação" ? "Com laminação" : "Sem laminação";
    } else if (field === "discountValue") {
      row.discountValue = normalizeDiscountValue(target.value);
    } else if (field === "discountType") {
      row.discountType = normalizeDiscountType(target.value);
    } else {
      row[field] = target.value;
    }

    persist();
    renderRowsAndSummary();
  });

  m2RowsTableBody.addEventListener("change", (event) => {
    const target = event.target;
    const rowElement = target.closest("tr[data-m2-row-index]");
    if (!rowElement) {
      return;
    }

    const row = state.m2Items[Number(rowElement.dataset.m2RowIndex)];
    const field = target.name;
    if (!field || !row) {
      return;
    }

    if (field === "widthMm" || field === "heightMm") {
      row[field] = toDecimalNumber(target.value);
    } else if (field === "measureUnit") {
      row.measureUnit = target.value === "m" ? "m" : "cm";
    } else if (field === "quantity") {
      row[field] = toWholeNumber(target.value);
    } else if (field === "extraCharge" || field === "artCreationFee" || field === "finishingExtra") {
      if (field === "finishingExtra") {
        row.extraCharge = toMoneyNumber(target.value);
      } else {
        row[field] = toMoneyNumber(target.value);
      }
    } else if (field === "discountValue") {
      row.discountValue = normalizeDiscountValue(target.value);
    } else if (field === "discountType") {
      row.discountType = normalizeDiscountType(target.value);
    } else {
      row[field] = target.value;
    }

    persist();
    renderRowsAndSummary();
  });

  readyRowsTableBody.addEventListener("change", (event) => {
    const target = event.target;
    const rowElement = target.closest("tr[data-ready-row-index]");
    if (!rowElement) {
      return;
    }

    const row = state.readyItems[Number(rowElement.dataset.readyRowIndex)];
    const field = target.name;
    if (!field || !row) {
      return;
    }

    if (field === "productId") {
      row.productId = target.value;
      row.variantIndex = 0;
      const product = getReadyProductCatalog(config).find((item) => item.id === target.value);
      row.description = row.description || product?.label || "";
      const variantRow = product?.readyPricingMode === "variant-fixed" ? getReadyVariantRow(getReadyPricingRows(config, product), 0) : null;
      if (product?.readyPricingMode === "variant-fixed" && variantRow?.mode === "total") {
        row.quantity = Number(variantRow.quantity || 0);
      } else if (!row.quantity) {
        row.quantity = 1;
      }
    } else if (field === "variantIndex") {
      row.variantIndex = toWholeNumber(target.value);
      const product = getReadyProductCatalog(config).find((item) => item.id === row.productId);
      const variantRow = product?.readyPricingMode === "variant-fixed" ? getReadyVariantRow(getReadyPricingRows(config, product), row.variantIndex) : null;
      if (product?.readyPricingMode === "variant-fixed" && variantRow?.mode === "total") {
        row.quantity = Number(variantRow.quantity || 0);
      }
    } else if (field === "quantity") {
      row.quantity = toWholeNumber(target.value);
    } else if (field === "basePriceOverride") {
      row.basePriceOverride = target.value === "" ? "" : toMoneyNumber(target.value);
    } else if (field === "extraCharge" || field === "artCreationFee") {
      row[field] = toMoneyNumber(target.value);
    } else if (field === "discountValue") {
      row.discountValue = normalizeDiscountValue(target.value);
    } else if (field === "discountType") {
      row.discountType = normalizeDiscountType(target.value);
    } else {
      row[field] = target.value;
    }

    persist();
    renderRowsAndSummary();
  });

  resinRowsTableBody.addEventListener("change", (event) => {
    const target = event.target;
    const rowElement = target.closest("tr[data-resin-row-index]");
    if (!rowElement) {
      return;
    }

    const row = state.resinItems[Number(rowElement.dataset.resinRowIndex)];
    const field = target.name;
    if (!field || !row) {
      return;
    }

    if (field === "widthMm" || field === "heightMm") {
      row[field] = toDecimalNumber(target.value);
    } else if (field === "quantity") {
      row.quantity = toWholeNumber(target.value);
    } else if (field === "materialType") {
      row.materialType = RESIN_MATERIAL_OPTIONS.some((option) => option.id === target.value)
        ? target.value
        : "white";
    } else if (field === "discountValue") {
      row.discountValue = normalizeDiscountValue(target.value);
    } else if (field === "discountType") {
      row.discountType = normalizeDiscountType(target.value);
    } else {
      row[field] = target.value;
    }

    persist();
    renderRowsAndSummary();
  });

  cardRowsTableBody?.addEventListener("change", (event) => {
    const target = event.target;
    const rowElement = target.closest("tr[data-card-row-index]");
    if (!rowElement) {
      return;
    }
    const row = state.cardItems[Number(rowElement.dataset.cardRowIndex)];
    if (!row) {
      return;
    }

    row.touched = true;
    const finishId = target.dataset.cardFinishId;
    if (finishId) {
      const finishIds = new Set(Array.isArray(row.finishIds) ? row.finishIds : []);
      if (target.checked) {
        finishIds.add(finishId);
      } else {
        finishIds.delete(finishId);
      }
      row.finishIds = Array.from(finishIds);
    } else if (target.name === "quantity") {
      row.quantity = Math.max(1, toWholeNumber(target.value));
    } else if (target.name === "artCreationFee") {
      row.artCreationFee = toMoneyNumber(target.value);
    } else if (target.name === "discountValue") {
      row.discountValue = normalizeDiscountValue(target.value);
    } else if (target.name === "discountType") {
      row.discountType = normalizeDiscountType(target.value);
    } else if (target.name) {
      row[target.name] = target.value;
    }

    if (["printType", "paper", "side"].includes(target.name)) {
      const options = getCardSelectOptions(config, row);
      row.printType = options.selectedPrintType;
      row.paper = options.selectedPaper;
      row.side = options.selectedSide;
      row.quantity = options.selectedQuantity;
    }

    persist();
    renderRowsAndSummary();
  });

  flyerRowsTableBody?.addEventListener("change", (event) => {
    const target = event.target;
    const rowElement = target.closest("tr[data-flyer-row-index]");
    if (!rowElement) {
      return;
    }
    const row = state.flyerItems[Number(rowElement.dataset.flyerRowIndex)];
    if (!row) {
      return;
    }

    row.touched = true;
    if (target.name === "quantity") {
      row.quantity = Math.max(1, toWholeNumber(target.value));
    } else if (target.name === "artCreationFee") {
      row.artCreationFee = toMoneyNumber(target.value);
    } else if (target.name === "discountValue") {
      row.discountValue = normalizeDiscountValue(target.value);
    } else if (target.name === "discountType") {
      row.discountType = normalizeDiscountType(target.value);
    } else if (target.name) {
      row[target.name] = target.value;
    }

    if (["printType", "paper", "size", "colorMode"].includes(target.name)) {
      const options = getFlyerSelectOptions(config, row);
      row.printType = options.selectedPrintType;
      row.paper = options.selectedPaper;
      row.size = options.selectedSize;
      row.colorMode = options.selectedColorMode;
      row.quantity = options.selectedQuantity;
    }

    persist();
    renderRowsAndSummary();
  });

  Object.entries(blockTableBodies).forEach(([tab, body]) => {
    body?.addEventListener("change", (event) => {
      const target = event.target;
      const rowElement = target.closest("tr[data-block-row-index]");
      if (!rowElement) {
        return;
      }

      const row = state.blockItems?.[tab]?.[Number(rowElement.dataset.blockRowIndex)];
      const field = target.name;
      if (!field || !row) {
        return;
      }

      row.touched = true;
      if (field === "vias" || field === "quantity") {
        row[field] = Math.max(1, toWholeNumber(target.value));
      } else if (field === "artCreationFee") {
        row.artCreationFee = toMoneyNumber(target.value);
      } else if (field === "discountValue") {
        row.discountValue = normalizeDiscountValue(target.value);
      } else if (field === "discountType") {
        row.discountType = normalizeDiscountType(target.value);
      } else {
        row[field] = target.value;
      }

      if (field === "format") {
        const options = getBlockSelectOptions(config, tab, row);
        row.format = options.selectedFormat;
        row.vias = options.selectedVias;
        row.quantity = options.selectedQuantity;
      }
      if (field === "vias") {
        const options = getBlockSelectOptions(config, tab, row);
        row.vias = options.selectedVias;
        row.quantity = options.selectedQuantity;
      }

      persist();
      renderRowsAndSummary();
    });
  });

  m2RowsTableBody.addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-finish-picker-toggle]");
    if (toggle) {
      event.preventDefault();
      const rowElement = toggle.closest("tr[data-m2-row-index]");
      if (!rowElement) {
        return;
      }
      openM2FinishPopover(Number(rowElement.dataset.m2RowIndex), toggle);
      return;
    }
  });

  colorRowsTableBody.addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-color-service-toggle]");
    if (toggle) {
      event.preventDefault();
      const rowElement = toggle.closest("tr[data-color-row-index]");
      if (!rowElement) {
        return;
      }
      openColorServicePopover(Number(rowElement.dataset.colorRowIndex), toggle);
    }
  });

  credentialRowsTableBody.addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-credential-lanyard-toggle]");
    if (toggle) {
      event.preventDefault();
      const rowElement = toggle.closest("tr[data-credential-row-index]");
      if (!rowElement) {
        return;
      }
      openCredentialLanyardPopover(Number(rowElement.dataset.credentialRowIndex), toggle);
    }
  });

  document.addEventListener("click", (event) => {
    if (
      event.target.closest("[data-finish-picker-toggle]") ||
      event.target.closest("#m2-finish-popover") ||
      event.target.closest("[data-color-service-toggle]") ||
      event.target.closest("#color-service-popover") ||
      event.target.closest("[data-credential-lanyard-toggle]") ||
      event.target.closest("#credential-lanyard-popover")
    ) {
      return;
    }
    closeM2FinishPopover();
    closeColorServicePopover();
    closeCredentialLanyardPopover();
  });

  document.getElementById("apply-group-selected").addEventListener("click", () => {
    const groupName = normalizeBindingGroup(document.getElementById("group-name-input").value);
    if (!groupName) {
      setMainFeedback("Digite um nome de grupo antes de aplicar o acabamento em lote.", "warning");
      return;
    }

    let changed = 0;
    state.rows.forEach((row) => {
      if (selectedRowIds.has(row.id)) {
        row.bindingGroup = groupName;
        changed += 1;
      }
    });

    persist();
    renderRowsAndSummary();
    setMainFeedback(changed > 0 ? `Grupo ${groupName} aplicado em ${changed} linha(s).` : "Selecione pelo menos uma linha para aplicar o grupo.", changed > 0 ? "success" : "warning");
  });

  document.getElementById("clear-group-selected").addEventListener("click", () => {
    let changed = 0;
    state.rows.forEach((row) => {
      if (selectedRowIds.has(row.id)) {
        row.bindingGroup = "";
        changed += 1;
      }
    });

    persist();
    renderRowsAndSummary();
    setMainFeedback(changed > 0 ? `Grupo removido de ${changed} linha(s).` : "Selecione pelo menos uma linha para remover o grupo.", changed > 0 ? "success" : "warning");
  });

  spiralDiscountInput.addEventListener("input", (event) => {
    if (!isConfigUnlocked) {
      event.target.value = config.spiralPlasticDiscount;
      return;
    }
    config.spiralPlasticDiscount = toMoneyNumber(event.target.value);
    persist();
    renderRowsAndSummary();
    setConfigStatus("Desconto da espiral atualizado.", "success");
  });

  configSections.addEventListener("submit", async (event) => {
    if (event.target.id !== "config-lock-form") {
      return;
    }

    event.preventDefault();
    const passwordInput = document.getElementById("config-password-input");
    await unlockConfiguration(passwordInput?.value || "");
    if (passwordInput) {
      passwordInput.value = "";
    }
  });

  configSections.addEventListener("input", (event) => {
    if (!isConfigUnlocked) {
      return;
    }

    const target = event.target;
    const prefix = target.dataset.configPrefix;
    const rowIndex = Number(target.dataset.configRow);
    const key = target.dataset.configKey;
    const catalogProductTab = target.dataset.catalogProductTab;
    const catalogProductIndex = Number(target.dataset.catalogProductIndex);
    const catalogProductKey = target.dataset.catalogProductKey;
    const resinConfigKey = target.dataset.resinConfigKey;
    const m2BleedProductId = target.dataset.m2BleedProductId;
    const serviceIndex = Number(target.dataset.serviceIndex);
    const serviceKey = target.dataset.serviceKey;
    if (!prefix || !key) {
      if (resinConfigKey) {
        config.resinPricing[resinConfigKey] = resinConfigKey === "spacingMm"
          ? Math.max(0, toDecimalNumber(target.value))
          : toMoneyNumber(target.value);
        persist();
        renderRowsAndSummary();
        setConfigStatus("Configuração de resinados atualizada.", "success");
        return;
      }
      if (m2BleedProductId) {
        if (!config.m2BleedByProduct || typeof config.m2BleedByProduct !== "object") {
          config.m2BleedByProduct = { ...DEFAULT_M2_BLEED_BY_PRODUCT };
        }
        config.m2BleedByProduct[m2BleedProductId] = Math.max(0, toDecimalNumber(target.value));
        persist();
        renderRowsAndSummary();
        setConfigStatus("Sangra dos adesivos de m² atualizada.", "success");
        return;
      }
      if (serviceKey && Number.isFinite(serviceIndex)) {
        const service = config.combinationServices?.[serviceIndex];
        if (!service) {
          return;
        }
        service[serviceKey] = serviceKey === "defaultPrice" ? toMoneyNumber(target.value) : target.value;
        persist();
        renderRowsAndSummary();
        setConfigStatus("Complemento combinável atualizado.", "success");
        return;
      }
      if (catalogProductTab && catalogProductKey && Number.isFinite(catalogProductIndex)) {
        const product = config.catalogSections.filter((item) => item?.tab === catalogProductTab)[catalogProductIndex];
        if (!product) {
          return;
        }
        const previousId = product.id;
        if (catalogProductKey === "bleedMm" || catalogProductKey === "widthCm" || catalogProductKey === "heightCm") {
          product[catalogProductKey] = toDecimalNumber(target.value);
        } else {
          product[catalogProductKey] = target.value;
        }
        if (catalogProductKey === "id" && catalogProductTab === "m2" && previousId && product.id && previousId !== product.id) {
          state.m2Items.forEach((row) => {
            if (row.productId === previousId) {
              row.productId = product.id;
            }
          });
        }
        if (catalogProductKey === "id" && catalogProductTab === "impressos" && previousId && product.id && previousId !== product.id) {
          state.colorPrintItems.forEach((row) => {
            if (row.productPresetId === previousId) {
              row.productPresetId = product.id;
            }
          });
        }
        if (catalogProductKey === "id" && catalogProductTab === "prontos" && previousId && product.id && previousId !== product.id) {
          state.readyItems.forEach((row) => {
            if (row.productId === previousId) {
              row.productId = product.id;
            }
          });
        }
        persist();
        renderRowsAndSummary();
        setConfigStatus("Produto extra atualizado.", "success");
      }
      return;
    }

    if (prefix === "m2-finish") {
      const finish = config.m2Finishes?.[rowIndex];
      if (!finish) {
        return;
      }
      if (key === "spacingCm") {
        finish[key] = toWholeNumber(target.value);
      } else if (key === "price") {
        finish[key] = toMoneyNumber(target.value);
      } else {
        finish[key] = target.value;
      }
      persist();
      renderRowsAndSummary();
      setConfigStatus("Acabamento de m² atualizado.", "success");
      return;
    }

    if (prefix === "credential-lanyard-fixed") {
      if (!config.credentialLanyardPricing || typeof config.credentialLanyardPricing !== "object") {
        config.credentialLanyardPricing = deepClone(createDefaultConfig().credentialLanyardPricing);
      }
      config.credentialLanyardPricing[key] = toMoneyNumber(target.value);
      persist();
      renderRowsAndSummary();
      setConfigStatus("Cordão da credencial atualizado.", "success");
      return;
    }

    const array = getConfigArrayByPrefix(config, prefix);
    if (!array || !array[rowIndex]) {
      return;
    }

    if ((prefix === "spiral" || prefix === "wireo") && key.startsWith("rate-")) {
      const rateKey = key.replace("rate-", "");
      if (!array[rowIndex].rates || typeof array[rowIndex].rates !== "object") {
        array[rowIndex].rates = {};
      }
      array[rowIndex].rates[rateKey] = toMoneyNumber(target.value);
    } else if (prefix === "cut-above5") {
      array[key] = toMoneyNumber(target.value);
    } else if (prefix.startsWith("resin-")) {
      if (key === "min") {
        array[rowIndex][key] = toWholeNumber(target.value);
      } else if (key === "value") {
        array[rowIndex][key] = toMoneyNumber(target.value);
      } else {
        array[rowIndex][key] = target.value;
      }
    } else if (prefix.startsWith("m2-")) {
      if (key === "min") {
        array[rowIndex][key] = toDecimalNumber(target.value);
      } else if (key === "value") {
        array[rowIndex][key] = toMoneyNumber(target.value);
      } else {
        array[rowIndex][key] = target.value;
      }
    } else if (prefix.startsWith("ready-")) {
      if (key === "min" || key === "quantity") {
        array[rowIndex][key] = toWholeNumber(target.value);
      } else if (key === "value") {
        array[rowIndex][key] = toMoneyNumber(target.value);
      } else {
        array[rowIndex][key] = target.value;
      }
    } else if (prefix === "card-pricing") {
      if (key === "quantity") {
        array[rowIndex][key] = Math.max(1, toWholeNumber(target.value));
      } else if (key === "price") {
        array[rowIndex][key] = toMoneyNumber(target.value);
      } else {
        array[rowIndex][key] = target.value;
      }
    } else if (prefix === "flyer-pricing") {
      if (key === "quantity") {
        array[rowIndex][key] = Math.max(1, toWholeNumber(target.value));
      } else if (key === "price") {
        array[rowIndex][key] = toMoneyNumber(target.value);
      } else {
        array[rowIndex][key] = target.value;
      }
    } else if (prefix === "flyer-finish") {
      if (key === "minimumUntilQuantity") {
        array[rowIndex][key] = Math.max(1, toWholeNumber(target.value));
      } else if (["minimumPrice", "pricePerHundred", "thousandPrice"].includes(key)) {
        array[rowIndex][key] = toMoneyNumber(target.value);
      } else {
        array[rowIndex][key] = target.value;
      }
    } else if (prefix === "card-finish") {
      if (key === "holeSizeMm") {
        array[rowIndex][key] = Math.max(0, toDecimalNumber(target.value));
      } else if (key === "minimumUntilQuantity") {
        array[rowIndex][key] = Math.max(1, toWholeNumber(target.value));
      } else if (key === "minimumPrice" || key === "pricePerHundred" || key === "thousandPrice") {
        array[rowIndex][key] = toMoneyNumber(target.value);
      } else {
        array[rowIndex][key] = target.value;
      }
    } else if (key === "min" || key === "maxSheets") {
      array[rowIndex][key] = toWholeNumber(target.value);
    } else if (key === "minUp") {
      array[rowIndex][key] = toWholeNumber(target.value);
    } else if (key === "value") {
      array[rowIndex][key] = toMoneyNumber(target.value);
    } else {
      array[rowIndex][key] = target.value;
    }

    persist();
    renderRowsAndSummary();
    setConfigStatus("Preço atualizado.", "success");
  });

  configSections.addEventListener("click", async (event) => {
    const saveConfigButton = event.target.closest("#save-config-button");
    if (saveConfigButton) {
      saveConfiguration();
      return;
    }

    const lockButton = event.target.closest("#lock-config-button");
    if (lockButton) {
      lockConfiguration();
      return;
    }

    const resetConfigButton = event.target.closest("#reset-config-button");
    if (resetConfigButton) {
      if (!(await confirmAppAction({
        kicker: "Restauração",
        title: "Restaurar configuração padrão",
        message: "Deseja realmente restaurar os preços e ajustes originais da configuração?",
        confirmLabel: "Restaurar",
        danger: true,
      }))) {
        setConfigStatus("Restauração cancelada.", "warning");
        return;
      }
      const reset = createDefaultConfig();
      Object.assign(config, reset);
      ensureAutomaticPlastificationService(config);
      persist();
      renderAll();
      setConfigStatus("Configuração restaurada para o padrão.", "warning");
      return;
    }

    const exportConfigButton = event.target.closest("#export-config-button");
    if (exportConfigButton) {
      const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "configuracao-graficalc.json";
      link.click();
      URL.revokeObjectURL(url);
      return;
    }

    const importConfigButton = event.target.closest("#import-config-button");
    if (importConfigButton) {
      document.getElementById("config-file-input")?.click();
      return;
    }

    if (!isConfigUnlocked) {
      return;
    }

    const modeButton = event.target.closest("[data-config-view-mode]");
    if (modeButton) {
      configViewMode = modeButton.dataset.configViewMode === "advanced" ? "advanced" : "basic";
      saveConfigViewMode(configViewMode);
      renderConfig();
      setConfigStatus(
        configViewMode === "advanced"
          ? "Modo avançado ativado."
          : "Modo iniciante ativado.",
        "success"
      );
      return;
    }

    const sectionButton = event.target.closest("[data-config-section]");
    if (sectionButton) {
      activeConfigSection = CONFIG_SECTIONS.includes(sectionButton.dataset.configSection)
        ? sectionButton.dataset.configSection
        : "calculo";
      saveConfigSection(activeConfigSection);
      renderConfig();
      setConfigStatus("Seção da configuração atualizada.", "success");
      return;
    }

    const deleteButton = event.target.closest("[data-config-delete]");
    if (deleteButton) {
      const deleteType = deleteButton.dataset.configDelete;
      if (deleteType === "config-row") {
        const prefix = deleteButton.dataset.configPrefix;
        const rowIndex = Number(deleteButton.dataset.configRow);
        if (!(await confirmConfigDelete("Deseja realmente excluir esta faixa de preço?"))) {
          setConfigStatus("Exclusão cancelada.", "warning");
          return;
        }
        if (removeConfigRow(prefix, rowIndex)) {
          persist();
          renderConfig();
          renderRowsAndSummary();
          setConfigStatus("Faixa excluída com sucesso.", "warning");
        }
        return;
      }

      if (deleteType === "m2-finish") {
        const rowIndex = Number(deleteButton.dataset.finishRow);
        if (!(await confirmConfigDelete("Deseja realmente excluir este acabamento de m²?"))) {
          setConfigStatus("Exclusão cancelada.", "warning");
          return;
        }
        if (removeM2Finish(rowIndex)) {
          persist();
          renderConfig();
          renderRowsAndSummary();
          setConfigStatus("Acabamento excluído com sucesso.", "warning");
        }
        return;
      }

      if (deleteType === "catalog-product") {
        const tab = deleteButton.dataset.catalogTab;
        const rowIndex = Number(deleteButton.dataset.catalogIndex);
        if (!(await confirmConfigDelete("Deseja realmente excluir este produto extra?"))) {
          setConfigStatus("Exclusão cancelada.", "warning");
          return;
        }
        if (removeCatalogProduct(tab, rowIndex)) {
          persist();
          renderConfig();
          renderRowsAndSummary();
          setConfigStatus("Produto extra excluído com sucesso.", "warning");
        }
        return;
      }

      if (deleteType === "combination-service") {
        const rowIndex = Number(deleteButton.dataset.serviceIndex);
        if (!(await confirmConfigDelete("Deseja realmente excluir este complemento combinável?"))) {
          setConfigStatus("Exclusão cancelada.", "warning");
          return;
        }
        if (removeCombinationService(rowIndex)) {
          persist();
          renderConfig();
          renderRowsAndSummary();
          setConfigStatus("Complemento excluído com sucesso.", "warning");
        }
        return;
      }
    }

    const addBindingPricingButton = event.target.closest("[data-add-binding-pricing]");
    if (addBindingPricingButton) {
      const prefix = addBindingPricingButton.dataset.addBindingPricing;
      const rows = getConfigArrayByPrefix(config, prefix);
      if (!Array.isArray(rows)) {
        return;
      }
      const lastRow = rows[rows.length - 1] || { maxSheets: 0, rates: { "1": 0, "21": 0, "51": 0, "101": 0 } };
      rows.push({
        maxSheets: Number(lastRow.maxSheets || 0) + 100,
        rates: {
          "1": Number(lastRow.rates?.["1"] || 0),
          "21": Number(lastRow.rates?.["21"] || 0),
          "51": Number(lastRow.rates?.["51"] || 0),
          "101": Number(lastRow.rates?.["101"] || 0),
        },
      });
      persist();
      renderConfig();
      renderRowsAndSummary();
      setConfigStatus("Nova faixa de encadernação criada.", "success");
      return;
    }

    const addApostilaPricingButton = event.target.closest("[data-add-apostila-pricing]");
    if (addApostilaPricingButton) {
      const prefix = addApostilaPricingButton.dataset.addApostilaPricing;
      const rows = getConfigArrayByPrefix(config, prefix);
      if (!Array.isArray(rows)) {
        return;
      }
      const lastRow = rows[rows.length - 1] || { min: 0, value: 0, label: "Nova faixa" };
      const nextMin = Math.max(1, Number(lastRow.min || 0) + 1);
      rows.push({
        min: nextMin,
        value: Number(lastRow.value || 0),
        label: `A partir de ${nextMin}`,
      });
      persist();
      renderConfig();
      renderRowsAndSummary();
      setConfigStatus("Nova faixa de acabamento criada.", "success");
      return;
    }

    const button = event.target.closest("[data-add-m2-pricing]");
    if (!button) {
      const addBandButton = event.target.closest("[data-add-m2-band]");
      if (addBandButton) {
        const pricingKey = addBandButton.dataset.addM2Band;
        if (!pricingKey) {
          return;
        }
        const bands = config.m2Pricing[pricingKey] || (config.m2Pricing[pricingKey] = []);
        const lastBand = bands[bands.length - 1] || { min: 0, value: 0, label: "Nova faixa" };
        bands.push({
          min: Number(lastBand.min || 0) + 1,
          value: Number(lastBand.value || 0),
          label: lastBand.label ? `acima de ${lastBand.min || 0} m²` : "nova faixa",
        });
        persist();
        renderConfig();
        setConfigStatus("Nova faixa criada para este produto.", "success");
        return;
      }

      const addColorProductBandButton = event.target.closest("[data-add-color-product-band]");
      if (addColorProductBandButton) {
        const pricingKey = addColorProductBandButton.dataset.addColorProductBand;
        if (!pricingKey) {
          return;
        }
        const bands = config.colorProductPricing[pricingKey] || (config.colorProductPricing[pricingKey] = []);
        const lastBand = bands[bands.length - 1] || { min: 1, value: 0, label: "Nova faixa" };
        bands.push({
          min: Number(lastBand.min || 0) + 1,
          value: Number(lastBand.value || 0),
          label: lastBand.label || "Nova faixa",
        });
        persist();
        renderConfig();
        setConfigStatus("Nova faixa criada para este preset.", "success");
        return;
      }

      const addReadyPricingButton = event.target.closest("[data-add-ready-pricing]");
      if (addReadyPricingButton) {
        const pricingKey = addReadyPricingButton.dataset.addReadyPricing;
        const readyMode = addReadyPricingButton.dataset.addReadyMode || "quantity-tier";
        if (!pricingKey) {
          return;
        }
        const rows = config.readyProductPricing[pricingKey] || (config.readyProductPricing[pricingKey] = []);
        if (readyMode === "variant-fixed") {
          const lastRow = rows[rows.length - 1] || { quantity: 1, value: 0, mode: "unit", label: "Nova opção" };
          rows.push({
            quantity: Number(lastRow.quantity || 0) + 1,
            value: Number(lastRow.value || 0),
            mode: lastRow.mode || "unit",
            label: "Nova opção",
          });
        } else {
          const lastRow = rows[rows.length - 1] || { min: 1, value: 0, mode: "unit", label: "Nova faixa" };
          rows.push({
            min: Number(lastRow.min || 0) + 1,
            value: Number(lastRow.value || 0),
            mode: lastRow.mode || "unit",
            label: "Nova faixa",
          });
        }
        persist();
        renderConfig();
        setConfigStatus("Nova faixa/opção criada para este material.", "success");
        return;
      }

      const addCredentialLanyardBandButton = event.target.closest("[data-add-credential-lanyard-band]");
      if (addCredentialLanyardBandButton) {
        const rows = config.credentialLanyardPricing.printed || (config.credentialLanyardPricing.printed = []);
        const lastRow = rows[rows.length - 1] || { min: 1, value: 0, label: "Nova faixa" };
        const nextMin = Math.max(1, Number(lastRow.min || 0) + 1);
        rows.push({
          min: nextMin,
          value: Number(lastRow.value || 0),
          label: `A partir de ${nextMin}`,
        });
        persist();
        renderConfig();
        renderRowsAndSummary();
        setConfigStatus("Nova faixa de cordão criada.", "success");
        return;
      }

      const addResinPricingButton = event.target.closest("[data-add-resin-pricing]");
      if (addResinPricingButton) {
        const pricingKey = addResinPricingButton.dataset.addResinPricing === "special" ? "special" : "standard";
        const rows = config.resinPricing[pricingKey] || (config.resinPricing[pricingKey] = []);
        const lastRow = rows[rows.length - 1] || { min: 1, value: 0, label: "Nova faixa" };
        const nextMin = Math.max(1, Number(lastRow.min || 0) + 1);
        rows.push({
          min: nextMin,
          value: Number(lastRow.value || 0),
          label: `${nextMin} folhas A3`,
        });
        persist();
        renderConfig();
        renderRowsAndSummary();
        setConfigStatus("Nova faixa de resinados criada.", "success");
        return;
      }

      const addCardPricingButton = event.target.closest("[data-add-card-pricing]");
      if (addCardPricingButton) {
        const lastRow = config.cardPricing?.[config.cardPricing.length - 1] || DEFAULT_CARD_CATALOG[0];
        config.cardPricing.push({
          id: `card-price-${Date.now()}`,
          printType: lastRow.printType || "laser",
          paper: lastRow.paper || "Couche 300g",
          side: lastRow.side || "Só frente",
          quantity: Number(lastRow.quantity || 100),
          price: Number(lastRow.price || 0),
        });
        persist();
        renderConfig();
        renderRowsAndSummary();
        setConfigStatus("Nova opção de cartão criada.", "success");
        return;
      }

      const addFlyerPricingButton = event.target.closest("[data-add-flyer-pricing]");
      if (addFlyerPricingButton) {
        const lastRow = config.flyerPricing?.[config.flyerPricing.length - 1] || DEFAULT_FLYER_CATALOG[0];
        config.flyerPricing.push({
          id: `flyer-price-${Date.now()}`,
          printType: lastRow.printType || "laser",
          paper: lastRow.paper || "Couche 120g",
          size: lastRow.size || "10x7cm",
          colorMode: lastRow.colorMode || "4x0 cores",
          quantity: Math.max(1, toWholeNumber(lastRow.quantity || 500)),
          price: toMoneyNumber(lastRow.price),
        });
        persist();
        renderConfig();
        renderRowsAndSummary();
        setConfigStatus("Nova opção de panfleto/folder criada.", "success");
        return;
      }

      const addFlyerFinishButton = event.target.closest("[data-add-flyer-finish]");
      if (addFlyerFinishButton) {
        const lastRow = config.flyerFinishes?.[config.flyerFinishes.length - 1] || DEFAULT_FLYER_FINISHES[1];
        config.flyerFinishes.push({
          id: `flyer-finish-${Date.now()}`,
          label: "Novo acabamento",
          minimumPrice: toMoneyNumber(lastRow.minimumPrice),
          minimumUntilQuantity: Math.max(1, toWholeNumber(lastRow.minimumUntilQuantity || 100)),
          pricePerHundred: toMoneyNumber(lastRow.pricePerHundred),
          thousandPrice: toMoneyNumber(lastRow.thousandPrice),
        });
        persist();
        renderConfig();
        renderRowsAndSummary();
        setConfigStatus("Novo acabamento de panfleto/folder criado.", "success");
        return;
      }

      const addCardFinishButton = event.target.closest("[data-add-card-finish]");
      if (addCardFinishButton) {
        config.cardFinishes.push({
          id: `card-finish-${Date.now()}`,
          label: "Novo acabamento",
          type: "perHundred",
          holeSizeMm: 0,
          minimumPrice: 10,
          minimumUntilQuantity: 100,
          pricePerHundred: 3,
          thousandPrice: 25,
        });
        persist();
        renderConfig();
        renderRowsAndSummary();
        setConfigStatus("Novo acabamento de cartão criado.", "success");
        return;
      }

      const addFinishButton = event.target.closest("[data-add-m2-finish]");
      if (addFinishButton) {
        config.m2Finishes.push({
          id: `acabamento-${Date.now()}`,
          label: "Novo acabamento",
          type: "area",
          price: 0,
          spacingCm: 20,
        });
        persist();
        renderConfig();
        setConfigStatus("Novo acabamento criado.", "success");
        return;
      }

      const addProductButton = event.target.closest("[data-add-catalog-product]");
      if (addProductButton) {
        const tab = addProductButton.dataset.addCatalogProduct;
        if (!tab) {
          return;
        }
        const existingKeys = new Set(Object.keys(config.m2Pricing || {}));
        const newPricingKey = tab === "m2" ? createUniqueM2PricingKey("lona", existingKeys) : "";
        const colorPricingKeys = new Set(Object.keys(config.colorProductPricing || {}));
        const newColorPricingKey = tab === "impressos" ? createUniqueM2PricingKey("impresso", colorPricingKeys) : "";
        const readyPricingKeys = new Set(Object.keys(config.readyProductPricing || {}));
        const newReadyPricingKey = tab === "prontos" ? createUniqueM2PricingKey("pronto", readyPricingKeys) : "";
        config.catalogSections.push({
          id: `produto-${Date.now()}`,
          label: "Novo produto",
          tab,
          pricingKey: newPricingKey,
          note: "",
          widthCm: tab === "impressos" ? 21 : 0,
          heightCm: tab === "impressos" ? 29.7 : 0,
          bleedMode: tab === "impressos" ? "Sem sangra" : "",
          printMode: tab === "impressos" ? "Só frente" : "",
          paperType: tab === "impressos" ? "Sulfite 75g" : "",
          customPricingKey: newColorPricingKey,
          readyPricingKey: newReadyPricingKey,
          readyPricingMode: tab === "prontos" ? "quantity-tier" : "",
          readyVariantMode: "",
        });
        if (tab === "m2") {
          config.m2Pricing[newPricingKey] = deepClone(config.m2Pricing.banner || []);
        }
        if (tab === "impressos") {
          config.colorProductPricing[newColorPricingKey] = deepClone(config.colorPrintPricing["Sulfite 75g"] || []);
        }
        if (tab === "prontos") {
          config.readyProductPricing[newReadyPricingKey] = [{ min: 1, value: 0, mode: "unit", label: "Preço inicial" }];
        }
        persist();
        renderConfig();
        setConfigStatus("Novo produto extra criado.", "success");
      }
      return;
    }

    const configKey = button.dataset.addM2Pricing;
    const bands = config.m2Pricing?.[configKey];
    if (!Array.isArray(bands)) {
      return;
    }

    const lastBand = bands[bands.length - 1] || { min: 0, value: 0 };
    const lastMin = Number(lastBand.min || 0);
    const nextMin = lastMin >= 1000000 ? 1000000 : lastMin + 1;
    bands.push({
      min: nextMin,
      value: Number(lastBand.value || 0),
      label: lastMin >= 1000000 ? "nova faixa" : `acima de ${lastMin} m²`,
    });

    persist();
    renderAll();
    setConfigStatus("Nova faixa de preço adicionada.", "success");
  });

  document.getElementById("save-config-button")?.addEventListener("click", () => {
    saveConfiguration();
  });

  lockConfigButton?.addEventListener("click", () => {
    lockConfiguration();
  });

  document.getElementById("reset-config-button")?.addEventListener("click", async () => {
    if (!(await confirmAppAction({
      kicker: "Restauração",
      title: "Restaurar configuração padrão",
      message: "Deseja realmente restaurar os preços e ajustes originais da configuração?",
      confirmLabel: "Restaurar",
      danger: true,
    }))) {
      setConfigStatus("Restauração cancelada.", "warning");
      return;
    }
    const reset = createDefaultConfig();
    Object.assign(config, reset);
    ensureAutomaticPlastificationService(config);
    persist();
    renderAll();
    setConfigStatus("Configuração restaurada para o padrão.", "warning");
  });

  document.getElementById("export-config-button")?.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "configuracao-graficalc.json";
    link.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("import-config-button")?.addEventListener("click", () => {
    document.getElementById("config-file-input")?.click();
  });

  document.getElementById("config-file-input")?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const imported = mergeConfig(JSON.parse(text));
      Object.assign(config, imported);
      cleanupHiddenImpressosEntries(config, state);
      ensureAutomaticPlastificationService(config);
      persist();
      renderAll();
      setMainFeedback("Configuração importada com sucesso. Os novos valores já foram aplicados ao app.", "success");
      setConfigStatus("Configuração importada com sucesso.", "success");
    } catch {
      setMainFeedback("Não foi possível ler esse arquivo de configuração. Confira se o arquivo está em JSON válido.", "error");
      setConfigStatus("Não foi possível importar esse arquivo de configuração.", "error");
    }

    event.target.value = "";
  });

  [
    ["client-name", "client", "name"],
    ["client-contact", "client", "contact"],
    ["client-cnpj", "client", "cnpj"],
    ["payment-terms", null, "paymentTerms"],
    ["quote-notes", null, "quoteNotes"],
    ["company-name", "company", "name"],
    ["company-cnpj", "company", "cnpj"],
    ["company-contact", "company", "contact"],
    ["company-address", "company", "address"],
  ].forEach(([elementId, section, field]) => {
    document.getElementById(elementId).addEventListener("input", (event) => {
      if (section) {
        state[section][field] = event.target.value;
      } else {
        state[field] = event.target.value;
      }
      persist();
      renderRowsAndSummary();
    });
  });

  document.getElementById("company-logo-input").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      state.company.logoDataUrl = typeof reader.result === "string" ? reader.result : "";
      persist();
      renderRowsAndSummary();
    };
    reader.readAsDataURL(file);
  });

  document.getElementById("copy-quote-button").addEventListener("click", async () => {
    const workbook = calculateWorkbook(state, config);
    const colorWorkbook = calculateColorPrintWorkbook(state, config);
    const credentialWorkbook = calculateCredentialWorkbook(state, config);
    const m2Workbook = calculateM2WorkbookFromConfig(state, config);
    const readyWorkbook = calculateReadyWorkbook(state, config);
    const resinWorkbook = calculateResinWorkbook(state, config);
    const cardWorkbook = calculateCardWorkbook(state, config);
    const flyerWorkbook = calculateFlyerWorkbook(state, config);
    const blockSulfiteWorkbook = calculateBlockWorkbook(state, config, "sulfite");
    const blockAutocopiativoWorkbook = calculateBlockWorkbook(state, config, "autocopiativo");
    const text = createQuoteText(state, workbook, colorWorkbook, credentialWorkbook, m2Workbook, readyWorkbook, resinWorkbook, cardWorkbook, flyerWorkbook, blockSulfiteWorkbook, blockAutocopiativoWorkbook);
    try {
      await navigator.clipboard.writeText(text);
      setMainFeedback("Resumo do orçamento copiado com sucesso.", "success");
    } catch {
      setMainFeedback("Não foi possível copiar automaticamente, mas a prévia continua disponível na tela para conferência.", "warning");
    }
  });

  document.getElementById("print-quote-button").addEventListener("click", () => {
    selectTab("orcamento");
    window.print();
  });

  document.getElementById("save-client-button").addEventListener("click", () => {
    const clientName = state.client.name.trim();
    if (!clientName) {
      setMainFeedback("Digite o nome do cliente antes de salvar na base compartilhada.", "warning");
      return;
    }

    const existingIndex = state.clients.findIndex((client) => client.name.trim().toLowerCase() === clientName.toLowerCase());
    const payload = {
      id: existingIndex >= 0 ? state.clients[existingIndex].id : `client-${Date.now()}`,
      name: state.client.name.trim(),
      contact: state.client.contact.trim(),
      cnpj: state.client.cnpj.trim(),
      notes: state.quoteNotes.trim(),
      createdAt: existingIndex >= 0 ? state.clients[existingIndex].createdAt : new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      state.clients[existingIndex] = payload;
    } else {
      state.clients.unshift(payload);
    }

    persist();
    renderClientsTab();
    setMainFeedback("Cliente salvo na base compartilhada com sucesso.", "success");
  });

  document.getElementById("save-client-record-button").addEventListener("click", () => {
    const name = clientsEditorName?.value.trim() || "";
    if (!name) {
      setStatusMessage(clientsEditorStatus, "Digite o nome do cliente para salvar o cadastro.", "warning");
      clientsEditorName?.focus();
      return;
    }

    const payload = {
      id: editingClientId || `client-${Date.now()}`,
      name,
      contact: clientsEditorContact?.value.trim() || "",
      cnpj: clientsEditorCnpj?.value.trim() || "",
      notes: clientsEditorNotes?.value.trim() || "",
      createdAt: editingClientId
        ? state.clients.find((client) => client.id === editingClientId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
    };

    const existingIndex = state.clients.findIndex((client) => client.id === payload.id);
    if (existingIndex >= 0) {
      state.clients[existingIndex] = payload;
    } else {
      state.clients.unshift(payload);
    }

    persist();
    renderClientsTab();
    fillClientEditor(payload, "Cadastro salvo com sucesso na base compartilhada.", "success");
    setMainFeedback("Cadastro de cliente salvo com sucesso.", "success");
  });

  document.getElementById("new-client-record-button").addEventListener("click", () => {
    resetClientEditor("Novo cadastro pronto para preenchimento.", "success");
    clientsEditorName?.focus();
  });

  document.getElementById("save-history-button").addEventListener("click", () => {
    const isEditingExistingQuote = Boolean(editingQuoteId);
    saveQuoteRecord(buildQuoteRecordFromCurrentState());
    persist();
    renderHistoryTab();
    renderOrdersTab();
    renderHomeTab();
    setMainFeedback(isEditingExistingQuote ? "Orçamento salvo e atualizado no histórico compartilhado." : "Orçamento salvo no histórico compartilhado.", "success");
  });

  document.getElementById("save-and-generate-os-button")?.addEventListener("click", () => {
    const isEditingExistingQuote = Boolean(editingQuoteId);
    const quote = saveQuoteRecord(buildQuoteRecordFromCurrentState());
    const workOrder = createWorkOrderFromQuote(quote);
    persist();
    renderHistoryTab();
    renderOrdersTab();
    renderHomeTab();
    setStatusMessage(osStatus, `OS ${workOrder.osNumber} gerada com sucesso.`, "success");
    setMainFeedback(isEditingExistingQuote ? `Orçamento atualizado e convertido na ${workOrder.osNumber}.` : `Orçamento salvo e convertido na ${workOrder.osNumber}.`, "success");
  });

  document.getElementById("create-os-from-current-button")?.addEventListener("click", () => {
    const isEditingExistingQuote = Boolean(editingQuoteId);
    const quote = saveQuoteRecord(buildQuoteRecordFromCurrentState());
    quote.status = "approved";
    const workOrder = createWorkOrderFromQuote(quote);
    persist();
    renderHistoryTab();
    renderOrdersTab();
    renderHomeTab();
    selectTab("os");
    setStatusMessage(osStatus, `OS ${workOrder.osNumber} criada a partir do orçamento atual.`, "success");
    setMainFeedback(isEditingExistingQuote ? `Orçamento atualizado e OS ${workOrder.osNumber} criada com sucesso.` : `OS ${workOrder.osNumber} criada com sucesso.`, "success");
  });

  clientsList.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-client-action]");
    if (!button) {
      return;
    }

    const client = state.clients.find((item) => item.id === button.dataset.clientId);
    if (!client) {
      return;
    }

    if (button.dataset.clientAction === "load") {
      state.client.name = client.name;
      state.client.contact = client.contact;
      state.client.cnpj = client.cnpj;
      state.quoteNotes = client.notes || state.quoteNotes;
      persist();
      renderAll();
      setMainFeedback("Cliente carregado no orçamento atual.", "success");
    } else if (button.dataset.clientAction === "edit") {
      fillClientEditor(client, `Editando o cadastro de ${client.name || "cliente selecionado"}.`, "success");
    } else if (button.dataset.clientAction === "duplicate") {
      state.clients.unshift({
        ...client,
        id: `client-${Date.now()}`,
        name: `${client.name} (cópia)`,
        createdAt: new Date().toISOString(),
      });
      persist();
      renderClientsTab();
      setMainFeedback("Cópia do cliente criada na base compartilhada.", "success");
    } else if (button.dataset.clientAction === "delete") {
      if (!(await confirmAppAction({
        kicker: "Exclusão",
        title: "Excluir cliente salvo",
        message: `Deseja realmente excluir o cliente "${client.name || "Sem nome"}" da base compartilhada?`,
        confirmLabel: "Excluir",
        danger: true,
      }))) {
        setMainFeedback("A exclusão do cliente foi cancelada.", "warning");
        return;
      }
      state.clients = state.clients.filter((item) => item.id !== client.id);
      persist();
      renderClientsTab();
      if (editingClientId === client.id) {
        resetClientEditor("Cliente removido da base compartilhada.", "warning");
      }
      setMainFeedback("Cliente excluído da base compartilhada.", "warning");
    }
  });

  historyList.addEventListener("click", async (event) => {
    const statusButton = event.target.closest("[data-history-status]");
    if (statusButton) {
      const item = state.quoteHistory.find((entry) => entry.id === statusButton.dataset.quoteId);
      if (!item) {
        return;
      }
      item.status = normalizeQuoteStatus(statusButton.dataset.historyStatus);
      item.updatedAt = new Date().toISOString();
      persist();
      renderHistoryTab();
      renderHomeTab();
      setMainFeedback(`Status do orçamento alterado para ${getQuoteStatusMeta(item.status).label}.`, "success");
      return;
    }

    const button = event.target.closest("[data-history-action]");
    if (!button) {
      return;
    }

    const item = state.quoteHistory.find((entry) => entry.id === button.dataset.quoteId);
    if (!item) {
      return;
    }

    if (button.dataset.historyAction === "load-client") {
      state.client.name = item.clientName || state.client.name;
      state.client.contact = item.clientContact || state.client.contact;
      state.client.cnpj = item.clientCnpj || state.client.cnpj;
      state.paymentTerms = item.paymentTerms || state.paymentTerms;
      state.quoteNotes = item.quoteNotes || state.quoteNotes;
      persist();
      renderAll();
      setMainFeedback("Cliente do histórico carregado no orçamento atual.", "success");
    } else if (button.dataset.historyAction === "edit-quote") {
      if (!item.snapshot || !applyQuoteStateSnapshot(item.snapshot)) {
        setMainFeedback("Este orçamento salvo não possui todos os dados para reedição completa.", "warning");
        return;
      }
      editingQuoteId = item.id;
      renderAll();
      selectTab("orcamento");
      setMainFeedback(`Orçamento "${item.title || "sem título"}" carregado para edição. Ao salvar, o registro existente será atualizado.`, "success");
    } else if (button.dataset.historyAction === "generate-os") {
      if (item.osId) {
        setMainFeedback("Este orçamento já possui uma OS vinculada.", "warning");
        return;
      }
      item.status = "approved";
      const workOrder = createWorkOrderFromQuote(item);
      persist();
      renderHistoryTab();
      renderOrdersTab();
      renderHomeTab();
      selectTab("os");
      setStatusMessage(osStatus, `OS ${workOrder.osNumber} gerada a partir do histórico.`, "success");
      setMainFeedback(`OS ${workOrder.osNumber} criada com sucesso.`, "success");
    } else if (button.dataset.historyAction === "copy") {
      navigator.clipboard.writeText(item.summary || item.title || "").catch(() => {});
      setMainFeedback("Resumo do histórico copiado.", "success");
    } else if (button.dataset.historyAction === "delete") {
      if (!(await confirmAppAction({
        kicker: "Exclusão",
        title: "Excluir item do histórico",
        message: `Deseja realmente excluir o histórico "${item.title || "Orçamento salvo"}"?`,
        confirmLabel: "Excluir",
        danger: true,
      }))) {
        setMainFeedback("A exclusão do histórico foi cancelada.", "warning");
        return;
      }
      state.quoteHistory = state.quoteHistory.filter((entry) => entry.id !== item.id);
      persist();
      renderHistoryTab();
      renderHomeTab();
      setMainFeedback("Item removido do histórico.", "warning");
    }
  });

  osList?.addEventListener("click", async (event) => {
    const statusButton = event.target.closest("[data-os-status]");
    if (statusButton) {
      const item = state.workOrders.find((entry) => entry.id === statusButton.dataset.osId);
      if (!item) {
        return;
      }
      item.status = normalizeWorkOrderStatus(statusButton.dataset.osStatus);
      item.updatedAt = new Date().toISOString();
      item.timeline.unshift(createWorkOrderTimelineEntry("Status atualizado", `Nova etapa: ${getWorkOrderStatusMeta(item.status).label}.`));
      syncQuoteStatusFromWorkOrder(item);
      persist();
      renderOrdersTab();
      renderHistoryTab();
      renderHomeTab();
      setStatusMessage(osStatus, `OS ${item.osNumber} atualizada para ${getWorkOrderStatusMeta(item.status).label}.`, "success");
      return;
    }

    const priorityButton = event.target.closest("[data-os-priority]");
    if (priorityButton) {
      const item = state.workOrders.find((entry) => entry.id === priorityButton.dataset.osId);
      if (!item) {
        return;
      }
      item.priority = normalizeWorkOrderPriority(priorityButton.dataset.osPriority);
      item.updatedAt = new Date().toISOString();
      item.timeline.unshift(createWorkOrderTimelineEntry("Prioridade atualizada", `Prioridade definida como ${getWorkOrderPriorityMeta(item.priority).label}.`));
      persist();
      renderOrdersTab();
      setStatusMessage(osStatus, `Prioridade da ${item.osNumber} ajustada.`, "success");
      return;
    }

    const button = event.target.closest("[data-os-action]");
    if (!button) {
      return;
    }

    const item = state.workOrders.find((entry) => entry.id === button.dataset.osId);
    if (!item) {
      return;
    }

    if (button.dataset.osAction === "load-client") {
      state.client.name = item.clientName || state.client.name;
      state.client.contact = item.clientContact || state.client.contact;
      state.client.cnpj = item.clientCnpj || state.client.cnpj;
      state.paymentTerms = item.paymentTerms || state.paymentTerms;
      persist();
      renderAll();
      setMainFeedback("Cliente da OS carregado no orçamento atual.", "success");
      return;
    }

    if (button.dataset.osAction === "copy-summary") {
      const lines = [
        item.osNumber,
        item.clientName || "Cliente não informado",
        `Status: ${getWorkOrderStatusMeta(item.status).label}`,
        `Prioridade: ${getWorkOrderPriorityMeta(item.priority).label}`,
        `Prazo: ${item.promisedDate || "Não definido"}`,
        `Total: ${formatCurrency(item.total || 0)}`,
      ];
      navigator.clipboard.writeText(lines.join("\n")).catch(() => {});
      setMainFeedback("Resumo da OS copiado.", "success");
      return;
    }

    if (button.dataset.osAction === "delete") {
      if (!(await confirmAppAction({
        kicker: "Exclusão",
        title: "Excluir ordem de serviço",
        message: `Deseja realmente excluir a ${item.osNumber}?`,
        confirmLabel: "Excluir",
        danger: true,
      }))) {
        setStatusMessage(osStatus, "A exclusão da OS foi cancelada.", "warning");
        return;
      }
      const quote = state.quoteHistory.find((entry) => entry.id === item.quoteId);
      if (quote) {
        quote.osId = "";
        quote.status = "approved";
        quote.updatedAt = new Date().toISOString();
      }
      state.workOrders = state.workOrders.filter((entry) => entry.id !== item.id);
      persist();
      renderOrdersTab();
      renderHistoryTab();
      renderHomeTab();
      setStatusMessage(osStatus, `${item.osNumber} excluída.`, "warning");
    }
  });

  osList?.addEventListener("change", (event) => {
    const target = event.target.closest("[data-os-field]");
    if (!target) {
      return;
    }
    const item = state.workOrders.find((entry) => entry.id === target.dataset.osId);
    if (!item) {
      return;
    }
    if (target.dataset.osField === "entryPaid" || target.dataset.osField === "totalPaid") {
      item[target.dataset.osField] = target.value === "true";
    } else if (target.dataset.osField === "entryAmount") {
      item.entryAmount = target.value === "" ? "" : toMoneyNumber(target.value);
    } else {
      item[target.dataset.osField] = target.value;
    }
    item.updatedAt = new Date().toISOString();
    syncQuoteStatusFromWorkOrder(item);
    persist();
    setStatusMessage(osStatus, `${item.osNumber} atualizada.`, "success");
  });

  document.getElementById("home-quick-links")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-home-link]");
    if (!button) {
      return;
    }
    selectTab(button.dataset.homeLink);
  });

  const dropzone = document.getElementById("pdf-dropzone");
  ["dragenter", "dragover"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.add("is-dragging");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.remove("is-dragging");
    });
  });

  dropzone.addEventListener("drop", async (event) => {
    const files = event.dataTransfer?.files;
    if (files?.length) {
      await importPdfFiles(files);
    }
  });

  await bootstrapSharedState();
  await hydrateServerSecuritySession();
  startSharedRefresh();
  renderAll();
}

  if (typeof window !== "undefined" && typeof document !== "undefined") {
  initApp().catch((error) => {
    console.error("Falha ao iniciar o GrafiCalc.", error);
    const syncStatus = document.getElementById("sync-status");
    if (syncStatus) {
      syncStatus.textContent = "O app encontrou um erro ao iniciar. Recarregue a pagina e, se continuar, revise o console do navegador.";
      syncStatus.dataset.tone = "error";
    }
    const appShell = document.getElementById("app-shell");
    if (appShell) {
      appShell.hidden = false;
      appShell.classList.add("is-auth-mode");
    }
    const loginPanel = document.querySelector('[data-tab-panel="login"]');
    if (loginPanel) {
      loginPanel.hidden = false;
      loginPanel.classList.add("is-active");
    }
    const authStatus = document.getElementById("auth-status");
    if (authStatus) {
      authStatus.textContent = "O GrafiCalc encontrou um erro ao carregar a tela. Recarregue a pagina. Se persistir, me avise que eu continuo a correção.";
      authStatus.dataset.tone = "error";
    }
  });
}






















