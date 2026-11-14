const fs = require("fs");
const path = require("path");

const casesDir = path.join(process.cwd(), "public", "drop", "cases");
const itemsDir = path.join(process.cwd(), "public", "drop", "items");

fs.mkdirSync(casesDir, { recursive: true });
fs.mkdirSync(itemsDir, { recursive: true });

function generateZipBagSvg({ id, title, subtitle, collection, rarity, color, shapeType, serial, barcode, isVoucher }) {
  const rarityColors = {
    common: { border: "#94A3B8", glow: "#CBD5E1", bg: "#0F172A", text: "#E2E8F0" },
    rare: { border: "#00F0FF", glow: "#38BDF8", bg: "#082F49", text: "#38BDF8" },
    epic: { border: "#A855F7", glow: "#C084FC", bg: "#3B0764", text: "#C084FC" },
    legendary: { border: "#F59E0B", glow: "#FCD34D", bg: "#451A03", text: "#FCD34D" },
    mythic: { border: "#F43F5E", glow: "#FB7185", bg: "#4C0519", text: "#FB7185" },
    special_reward: { border: "#EAB308", glow: "#FEF08A", bg: "#422006", text: "#FDE047" },
  };

  const rc = rarityColors[rarity] || rarityColors.common;

  // Shapes internal drawing
  let artworkSvg = "";
  if (isVoucher) {
    artworkSvg = `
      <!-- VIP COVER VOUCHER TICKET -->
      <g transform="translate(150, 220)">
        <rect x="-110" y="-70" width="220" height="140" rx="14" fill="#181309" stroke="#EAB308" stroke-width="3" filter="url(#glow)"/>
        <line x1="-110" y1="0" x2="110" y2="0" stroke="#EAB308" stroke-dasharray="6,4" stroke-width="1.5" opacity="0.6"/>
        <circle cx="-110" cy="0" r="14" fill="#0A0812"/>
        <circle cx="110" cy="0" r="14" fill="#0A0812"/>
        <text x="0" y="-35" font-family="'Unbounded', sans-serif" font-weight="900" font-size="14" fill="#FEF08A" text-anchor="middle" letter-spacing="3">CXRNER VOUCHER</text>
        <text x="0" y="-15" font-family="'Inter', sans-serif" font-weight="700" font-size="10" fill="#E2E8F0" text-anchor="middle" letter-spacing="1">100% FREE RELEASE COVER</text>
        <text x="0" y="24" font-family="'Space Grotesk', monospace" font-size="9" fill="#FDE047" text-anchor="middle" letter-spacing="2">CLAIM CODE: CV-2026-ARCHIVE</text>
        <text x="0" y="44" font-family="'Inter', sans-serif" font-size="8" fill="#94A3B8" text-anchor="middle">DESIGNED BY @KAZUMAIQ</text>
      </g>
    `;
  } else if (shapeType === "cylinder") {
    artworkSvg = `
      <!-- CYBER VINYL / DISC -->
      <g transform="translate(150, 220)">
        <circle cx="0" cy="0" r="76" fill="#090611" stroke="${color}" stroke-width="3" filter="url(#glow)"/>
        <circle cx="0" cy="0" r="66" fill="none" stroke="#FFFFFF" stroke-width="0.8" opacity="0.25"/>
        <circle cx="0" cy="0" r="56" fill="none" stroke="${color}" stroke-width="0.8" opacity="0.4"/>
        <circle cx="0" cy="0" r="46" fill="none" stroke="#FFFFFF" stroke-width="0.8" opacity="0.2"/>
        <circle cx="0" cy="0" r="36" fill="none" stroke="${color}" stroke-width="0.8" opacity="0.5"/>
        <!-- Center Label -->
        <circle cx="0" cy="0" r="24" fill="${color}" opacity="0.85"/>
        <circle cx="0" cy="0" r="8" fill="#05030A"/>
        <circle cx="0" cy="0" r="3" fill="#FFFFFF"/>
        <text x="0" y="3" font-family="'Unbounded', sans-serif" font-weight="900" font-size="5" fill="#FFFFFF" text-anchor="middle">CXRNER</text>
      </g>
    `;
  } else if (shapeType === "box") {
    artworkSvg = `
      <!-- CASSETTE / DATA MODULE -->
      <g transform="translate(150, 220)">
        <rect x="-80" y="-50" width="160" height="100" rx="10" fill="#090611" stroke="${color}" stroke-width="3" filter="url(#glow)"/>
        <rect x="-68" y="-38" width="136" height="76" rx="6" fill="#140F22" stroke="#FFFFFF" stroke-width="0.8" opacity="0.4"/>
        <!-- Cassette reels -->
        <circle cx="-35" cy="0" r="18" fill="#07040D" stroke="${color}" stroke-width="2"/>
        <circle cx="-35" cy="0" r="7" fill="${color}" opacity="0.8"/>
        <circle cx="35" cy="0" r="18" fill="#07040D" stroke="${color}" stroke-width="2"/>
        <circle cx="35" cy="0" r="7" fill="${color}" opacity="0.8"/>
        <rect x="-18" y="-10" width="36" height="20" rx="3" fill="#090611" stroke="#FFFFFF" stroke-width="0.8" opacity="0.3"/>
        <line x1="-35" y1="0" x2="35" y2="0" stroke="${color}" stroke-width="1.5" stroke-dasharray="2,2"/>
        <text x="0" y="28" font-family="'Space Grotesk', monospace" font-size="7" fill="#E2E8F0" text-anchor="middle" letter-spacing="1">CXRNER ARCHIVE 90MIN</text>
      </g>
    `;
  } else if (shapeType === "torus") {
    artworkSvg = `
      <!-- VOID RING / CROWN -->
      <g transform="translate(150, 220)">
        <circle cx="0" cy="0" r="72" fill="none" stroke="${color}" stroke-width="14" opacity="0.3" filter="url(#glow)"/>
        <circle cx="0" cy="0" r="70" fill="none" stroke="${color}" stroke-width="6"/>
        <circle cx="0" cy="0" r="50" fill="none" stroke="#FFFFFF" stroke-width="1.5" opacity="0.7"/>
        <circle cx="0" cy="0" r="30" fill="#090611" stroke="${color}" stroke-width="2"/>
        <!-- Crown Spikes -->
        <path d="M-60 -40 L-40 -75 L-20 -40 L0 -85 L20 -40 L40 -75 L60 -40" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="0" cy="0" r="6" fill="#00F0FF" filter="url(#glow)"/>
      </g>
    `;
  } else if (shapeType === "octahedron" || shapeType === "dodecahedron" || shapeType === "icosahedron") {
    artworkSvg = `
      <!-- POLYGONAL METALLIC ARTIFACT -->
      <g transform="translate(150, 220)">
        <polygon points="0,-75 65,-25 65,45 0,75 -65,45 -65,-25" fill="#090611" stroke="${color}" stroke-width="3" filter="url(#glow)"/>
        <polygon points="0,-75 0,75 65,-25" fill="${color}" fill-opacity="0.18" stroke="#FFFFFF" stroke-width="0.8" opacity="0.5"/>
        <polygon points="0,-75 0,75 -65,-25" fill="${color}" fill-opacity="0.08" stroke="#FFFFFF" stroke-width="0.8" opacity="0.5"/>
        <polygon points="0,0 65,45 0,75" fill="${color}" fill-opacity="0.25"/>
        <polygon points="0,0 -65,45 0,75" fill="${color}" fill-opacity="0.35"/>
        <circle cx="0" cy="0" r="14" fill="#05030A" stroke="#FFFFFF" stroke-width="1.5"/>
        <circle cx="0" cy="0" r="6" fill="${rc.glow}" filter="url(#glow)"/>
      </g>
    `;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 420" width="100%" height="100%">
  <defs>
    <!-- Filter glow -->
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <!-- Background linear -->
    <linearGradient id="bg_grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#120D22"/>
      <stop offset="40%" stop-color="#07050D"/>
      <stop offset="100%" stop-color="#020105"/>
    </linearGradient>
    <!-- Zip foil reflection -->
    <linearGradient id="foil_metal" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#475569"/>
      <stop offset="25%" stop-color="#E2E8F0"/>
      <stop offset="50%" stop-color="#94A3B8"/>
      <stop offset="75%" stop-color="#F8FAFC"/>
      <stop offset="100%" stop-color="#334155"/>
    </linearGradient>
    <linearGradient id="rarity_border" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${rc.border}"/>
      <stop offset="50%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="${rc.border}"/>
    </linearGradient>
  </defs>

  <!-- Pouch Outer Frame with rounded corners -->
  <rect x="6" y="6" width="288" height="408" rx="22" fill="url(#bg_grad)" stroke="url(#rarity_border)" stroke-width="2"/>

  <!-- Top Heat Seal Header -->
  <path d="M 6 28 Q 150 24 294 28 L 294 6 Q 150 6 6 6 Z" fill="url(#foil_metal)" opacity="0.85"/>
  <line x1="6" y1="28" x2="294" y2="28" stroke="#000000" stroke-width="2"/>
  
  <!-- Hanging hole punched in pouch -->
  <ellipse cx="150" cy="18" rx="14" ry="4" fill="#000000" stroke="#64748B" stroke-width="1"/>

  <!-- Zipper Track Strip -->
  <rect x="14" y="38" width="272" height="10" rx="3" fill="#1E293B" stroke="#475569" stroke-width="1"/>
  <!-- Zipper teeth pattern -->
  <line x1="16" y1="43" x2="284" y2="43" stroke="#CBD5E1" stroke-width="2" stroke-dasharray="3,3"/>
  <circle cx="270" cy="43" r="3.5" fill="${rc.border}"/>

  <!-- Industrial Warning / Archive Header -->
  <g transform="translate(18, 62)">
    <!-- Warning stripes -->
    <rect x="0" y="0" width="264" height="6" fill="#F59E0B" opacity="0.4"/>
    <line x1="0" y1="3" x2="264" y2="3" stroke="#000000" stroke-width="3" stroke-dasharray="8,8"/>
    
    <text x="0" y="20" font-family="'Space Grotesk', monospace" font-size="8.5" font-weight="700" fill="#94A3B8" letter-spacing="1.8">
      // CXRNER ARCHIVE: SPECIMEN-SEC-01
    </text>
    <text x="264" y="20" font-family="'Space Grotesk', monospace" font-size="8.5" font-weight="700" fill="${rc.text}" letter-spacing="1.5" text-anchor="end">
      №${serial}
    </text>
  </g>

  <!-- Central Artwork Scene -->
  ${artworkSvg}

  <!-- Foil Specimen Badge & Label -->
  <g transform="translate(24, 305)">
    <!-- Card bottom backdrop -->
    <rect x="0" y="0" width="252" height="88" rx="12" fill="#0A0814" fill-opacity="0.9" stroke="url(#foil_metal)" stroke-width="1.2"/>

    <!-- Rarity Pill -->
    <rect x="10" y="10" width="90" height="18" rx="9" fill="${rc.bg}" stroke="${rc.border}" stroke-width="1"/>
    <text x="55" y="22.5" font-family="'Unbounded', sans-serif" font-weight="800" font-size="8" fill="${rc.text}" letter-spacing="1.5" text-anchor="middle">
      ${rarity.toUpperCase()}
    </text>

    <!-- Collection Tag -->
    <text x="110" y="22" font-family="'Space Grotesk', monospace" font-size="8" fill="#94A3B8" letter-spacing="1">
      ${collection}
    </text>

    <!-- Item Title -->
    <text x="12" y="46" font-family="'Unbounded', sans-serif" font-weight="900" font-size="12" fill="#FFFFFF" letter-spacing="0.5">
      ${title}
    </text>

    <!-- Barcode & Serial -->
    <g transform="translate(12, 54)">
      <!-- Simulated barcode lines -->
      <line x1="0" y1="0" x2="0" y2="18" stroke="#E2E8F0" stroke-width="2"/>
      <line x1="4" y1="0" x2="4" y2="18" stroke="#E2E8F0" stroke-width="1"/>
      <line x1="7" y1="0" x2="7" y2="18" stroke="#E2E8F0" stroke-width="3"/>
      <line x1="12" y1="0" x2="12" y2="18" stroke="#E2E8F0" stroke-width="1"/>
      <line x1="15" y1="0" x2="15" y2="18" stroke="#E2E8F0" stroke-width="2"/>
      <line x1="19" y1="0" x2="19" y2="18" stroke="#E2E8F0" stroke-width="1"/>
      <line x1="22" y1="0" x2="22" y2="18" stroke="#E2E8F0" stroke-width="3"/>
      <line x1="27" y1="0" x2="27" y2="18" stroke="#E2E8F0" stroke-width="2"/>
      <line x1="31" y1="0" x2="31" y2="18" stroke="#E2E8F0" stroke-width="1"/>
      <line x1="35" y1="0" x2="35" y2="18" stroke="#E2E8F0" stroke-width="2"/>
      <line x1="39" y1="0" x2="39" y2="18" stroke="#E2E8F0" stroke-width="3"/>
      <line x1="44" y1="0" x2="44" y2="18" stroke="#E2E8F0" stroke-width="1"/>
      <line x1="48" y1="0" x2="48" y2="18" stroke="#E2E8F0" stroke-width="2"/>
      <line x1="52" y1="0" x2="52" y2="18" stroke="#E2E8F0" stroke-width="1"/>
      <line x1="56" y1="0" x2="56" y2="18" stroke="#E2E8F0" stroke-width="3"/>
      
      <text x="66" y="14" font-family="'Space Grotesk', monospace" font-size="8" fill="#64748B" letter-spacing="1.5">
        ${barcode}
      </text>
    </g>

    <text x="240" y="70" font-family="'Unbounded', sans-serif" font-weight="900" font-size="9" fill="${rc.border}" text-anchor="end">
      CXRNER
    </text>
  </g>
</svg>`;
}

// 1. Generate all 25 items
const itemsList = [
  // Common
  { id: "specimen_cyber_vinyl_01", title: "CYBER VINYL", collection: "GENESIS ARCHIVE", rarity: "common", color: "#A855F7", shapeType: "cylinder", serial: "000184", barcode: "CXR-VIN-01" },
  { id: "specimen_archive_cassette_02", title: "ARCHIVE CASSETTE", collection: "GENESIS ARCHIVE", rarity: "common", color: "#06B6D4", shapeType: "box", serial: "000219", barcode: "CXR-CAS-02" },
  { id: "specimen_data_key_03", title: "DATA KEY", collection: "SPECIMEN ARCHIVE", rarity: "common", color: "#94A3B8", shapeType: "box", serial: "000305", barcode: "CXR-KEY-03" },
  { id: "specimen_basic_specimen_04", title: "BASIC SPECIMEN", collection: "SPECIMEN ARCHIVE", rarity: "common", color: "#64748B", shapeType: "cylinder", serial: "000412", barcode: "CXR-BAS-04" },
  { id: "specimen_chrome_tag_05", title: "CHROME TAG", collection: "CHROME AGE", rarity: "common", color: "#CBD5E1", shapeType: "box", serial: "000550", barcode: "CXR-TAG-05" },

  // Rare
  { id: "specimen_chrome_disc_06", title: "CHROME DISC", collection: "CHROME AGE", rarity: "rare", color: "#38BDF8", shapeType: "cylinder", serial: "000671", barcode: "CXR-DSC-06" },
  { id: "specimen_dead_wing_07", title: "DEAD WING", collection: "BLACK SPECIMEN", rarity: "rare", color: "#475569", shapeType: "octahedron", serial: "000784", barcode: "CXR-WNG-07" },
  { id: "specimen_void_core_08", title: "VOID CORE", collection: "BLACK SPECIMEN", rarity: "rare", color: "#6366F1", shapeType: "torus", serial: "000839", barcode: "CXR-COR-08" },
  { id: "specimen_chrome_chain_09", title: "CHROME CHAIN", collection: "CHROME AGE", rarity: "rare", color: "#E2E8F0", shapeType: "torus", serial: "000912", barcode: "CXR-CHN-09" },
  { id: "specimen_parasite_mini_10", title: "PARASITE MINI", collection: "BLACK SPECIMEN", rarity: "rare", color: "#A21CAF", shapeType: "dodecahedron", serial: "001045", barcode: "CXR-PAR-10" },

  // Epic
  { id: "specimen_watcher_eye_11", title: "WATCHER EYE", collection: "SPECIMEN ARCHIVE", rarity: "epic", color: "#C084FC", shapeType: "dodecahedron", serial: "001150", barcode: "CXR-EYE-11" },
  { id: "specimen_black_heart_12", title: "BLACK HEART", collection: "BLACK SPECIMEN", rarity: "epic", color: "#831843", shapeType: "octahedron", serial: "001290", barcode: "CXR-HRT-12" },
  { id: "specimen_violet_visor_13", title: "VIOLET VISOR", collection: "SPECIMEN ARCHIVE", rarity: "epic", color: "#8B5CF6", shapeType: "box", serial: "001334", barcode: "CXR-VSR-13" },
  { id: "specimen_specimen_mask_14", title: "SPECIMEN MASK", collection: "BLACK SPECIMEN", rarity: "epic", color: "#701A75", shapeType: "octahedron", serial: "001402", barcode: "CXR-MSK-14" },
  { id: "specimen_dark_wings_15", title: "DARK WINGS", collection: "BLACK SPECIMEN", rarity: "epic", color: "#9333EA", shapeType: "icosahedron", serial: "001599", barcode: "CXR-DWN-15" },

  // Legendary
  { id: "specimen_chrome_spike_16", title: "CHROME SPIKE", collection: "CHROME AGE", rarity: "legendary", color: "#F8FAFC", shapeType: "octahedron", serial: "001601", barcode: "CXR-SPK-16" },
  { id: "specimen_void_crown_17", title: "VOID CROWN", collection: "BLACK SPECIMEN", rarity: "legendary", color: "#1E1B4B", shapeType: "torus", serial: "001777", barcode: "CXR-CRW-17" },
  { id: "specimen_parasite_18", title: "PARASITE PRIME", collection: "BLACK SPECIMEN", rarity: "legendary", color: "#7E22CE", shapeType: "icosahedron", serial: "001888", barcode: "CXR-PRM-18" },
  { id: "specimen_chrome_fang_19", title: "CHROME FANG", collection: "CHROME AGE", rarity: "legendary", color: "#F1F5F9", shapeType: "dodecahedron", serial: "001999", barcode: "CXR-FNG-19" },
  { id: "specimen_black_relic_20", title: "BLACK RELIC", collection: "BLACK SPECIMEN", rarity: "legendary", color: "#312E81", shapeType: "icosahedron", serial: "002044", barcode: "CXR-RLC-20" },

  // Mythic
  { id: "specimen_unknown_001_21", title: "UNKNOWN-001", collection: "RESTRICTED VAULT", rarity: "mythic", color: "#F43F5E", shapeType: "icosahedron", serial: "000001", barcode: "CXR-UNK-21" },
  { id: "specimen_forbidden_22", title: "FORBIDDEN", collection: "RESTRICTED VAULT", rarity: "mythic", color: "#BE123C", shapeType: "dodecahedron", serial: "000002", barcode: "CXR-FRB-22" },
  { id: "specimen_last_signal_23", title: "LAST SIGNAL", collection: "RESTRICTED VAULT", rarity: "mythic", color: "#E11D48", shapeType: "octahedron", serial: "000003", barcode: "CXR-SGN-23" },
  { id: "specimen_cxrner_original_24", title: "CXRNER ORIGINAL", collection: "FOUNDERS EDITION", rarity: "mythic", color: "#FB7185", shapeType: "torus", serial: "000004", barcode: "CXR-ORG-24" },

  // Special Reward
  { id: "specimen_cover_voucher_25", title: "COVER VOUCHER", collection: "SPECIAL REWARDS", rarity: "special_reward", color: "#EAB308", shapeType: "box", serial: "000000", barcode: "CXR-VOUCH", isVoucher: true },
];

for (const item of itemsList) {
  const svg = generateZipBagSvg(item);
  fs.writeFileSync(path.join(itemsDir, `${item.id}.svg`), svg, "utf-8");
}
console.log(`Generated ${itemsList.length} specimen item SVGs in public/drop/items/`);

// 2. Generate Case Sealed Pouches (Packs)
function generateCasePouchSvg({ id, title, subtitle, price, badge, themeColor, secondaryColor }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 480" width="100%" height="100%">
  <defs>
    <filter id="pouch_glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <linearGradient id="case_body" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1A0B2E"/>
      <stop offset="50%" stop-color="#090514"/>
      <stop offset="100%" stop-color="#030108"/>
    </linearGradient>
    <linearGradient id="foil_header" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#334155"/>
      <stop offset="25%" stop-color="#F8FAFC"/>
      <stop offset="50%" stop-color="#94A3B8"/>
      <stop offset="75%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#475569"/>
    </linearGradient>
    <linearGradient id="case_rim" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${themeColor}"/>
      <stop offset="50%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="${secondaryColor}"/>
    </linearGradient>
  </defs>

  <!-- Pouch Silhouette -->
  <rect x="10" y="10" width="320" height="460" rx="26" fill="url(#case_body)" stroke="url(#case_rim)" stroke-width="2.5" filter="url(#pouch_glow)"/>

  <!-- Heat Sealing Top -->
  <path d="M 10 36 Q 170 30 330 36 L 330 10 Q 170 10 10 10 Z" fill="url(#foil_header)"/>
  <ellipse cx="170" cy="22" rx="16" ry="5" fill="#000000" stroke="#64748B" stroke-width="1.2"/>

  <!-- Zipper Section -->
  <rect x="20" y="46" width="300" height="12" rx="4" fill="#0F172A" stroke="#334155"/>
  <line x1="24" y1="52" x2="316" y2="52" stroke="#CBD5E1" stroke-width="2" stroke-dasharray="4,4"/>
  <circle cx="300" cy="52" r="4" fill="${themeColor}"/>

  <!-- Seal Notch Indicator -->
  <path d="M 10 52 L 20 48 L 20 56 Z" fill="#FFFFFF"/>
  <path d="M 330 52 L 320 48 L 320 56 Z" fill="#FFFFFF"/>

  <!-- Header Badge -->
  <g transform="translate(30, 75)">
    <rect x="0" y="0" width="280" height="24" rx="12" fill="${themeColor}" fill-opacity="0.15" stroke="${themeColor}" stroke-width="1.2"/>
    <text x="140" y="16" font-family="'Unbounded', sans-serif" font-weight="900" font-size="9" fill="${themeColor}" letter-spacing="2" text-anchor="middle">
      ${badge}
    </text>
  </g>

  <!-- Main Center Specimen Holographic Seal -->
  <g transform="translate(170, 230)">
    <!-- Outer energy rings -->
    <circle cx="0" cy="0" r="95" fill="none" stroke="${themeColor}" stroke-width="1.5" stroke-dasharray="8,6" opacity="0.4"/>
    <circle cx="0" cy="0" r="80" fill="#080410" stroke="url(#case_rim)" stroke-width="3" filter="url(#pouch_glow)"/>
    <circle cx="0" cy="0" r="68" fill="none" stroke="#FFFFFF" stroke-width="1" opacity="0.25"/>
    
    <!-- Geometric Cyber Emblem -->
    <polygon points="0,-45 38,-22 38,22 0,45 -38,22 -38,-22" fill="${themeColor}" fill-opacity="0.2" stroke="${themeColor}" stroke-width="2"/>
    <polygon points="0,-25 22,-12 22,12 0,25 -22,12 -22,-12" fill="#040207" stroke="#FFFFFF" stroke-width="1.5"/>
    <circle cx="0" cy="0" r="8" fill="${secondaryColor}"/>

    <text x="0" y="60" font-family="'Unbounded', sans-serif" font-weight="900" font-size="10" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">
      CXRNER
    </text>
  </g>

  <!-- Title & Subtitle Section -->
  <g transform="translate(30, 360)">
    <text x="140" y="0" font-family="'Unbounded', sans-serif" font-weight="900" font-size="16" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">
      ${title}
    </text>
    <text x="140" y="20" font-family="'Space Grotesk', monospace" font-size="9.5" fill="${themeColor}" text-anchor="middle" letter-spacing="2">
      ${subtitle}
    </text>

    <!-- Price Pill -->
    <g transform="translate(60, 34)">
      <rect x="0" y="0" width="160" height="32" rx="16" fill="#090514" stroke="${themeColor}" stroke-width="1.5"/>
      <circle cx="22" cy="16" r="8" fill="${themeColor}"/>
      <text x="22" y="20" font-family="'Unbounded', sans-serif" font-weight="900" font-size="9" fill="#000000" text-anchor="middle">C</text>
      <text x="90" y="21" font-family="'Unbounded', sans-serif" font-weight="900" font-size="12" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">
        ${price} CXP
      </text>
    </g>
  </g>

  <!-- Bottom Barcode Strip -->
  <g transform="translate(35, 442)">
    <line x1="0" y1="0" x2="270" y2="0" stroke="#334155" stroke-width="0.8"/>
    <text x="135" y="14" font-family="'Space Grotesk', monospace" font-size="8" fill="#64748B" letter-spacing="2" text-anchor="middle">
      AUTHENTIC SEALED SPECIMEN PACK // CXRNER MUSIC
    </text>
  </g>
</svg>`;
}

const casesList = [
  {
    id: "case_001_archive",
    title: "CASE 001 — ARCHIVE",
    subtitle: "BASE SPECIMEN ARCHIVE",
    price: 50,
    badge: "SEALED POUCH // ARCHIVE 01",
    themeColor: "#8737FF",
    secondaryColor: "#00F0FF",
  },
  {
    id: "case_002_black_specimen",
    title: "CASE 002 — BLACK SPECIMEN",
    subtitle: "ORGANIC FORMS & MASKS",
    price: 75,
    badge: "DARK METALLIC // LIMITED EDITION",
    themeColor: "#A21CAF",
    secondaryColor: "#C084FC",
  },
  {
    id: "case_003_chrome_age",
    title: "CASE 003 — CHROME AGE",
    subtitle: "LIQUID CHROME & SPIKES",
    price: 100,
    badge: "ULTRA CHROME // RARE METALS",
    themeColor: "#00F0FF",
    secondaryColor: "#FFFFFF",
  },
];

for (const c of casesList) {
  const svg = generateCasePouchSvg(c);
  fs.writeFileSync(path.join(casesDir, `${c.id}.svg`), svg, "utf-8");
}
console.log(`Generated ${casesList.length} case SVGs in public/drop/cases/`);
