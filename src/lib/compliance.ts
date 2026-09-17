/**
 * Legal Metrology (Packaged Commodities) Rules, 2011 Compliance & Review Engine
 */

import { RULE6_FIELDS_CONFIG } from './gemini';

export interface NeedsReviewResult {
  needsReview: boolean;
  reasons: string[];
  summaryReason: string;
}

export interface Rule6DetailItem {
  key: string;
  sub_rule: string;
  name: string;
  description: string;
  found: boolean;
}

/**
 * Detects whether a commodity package is a Single-unit package or a Multi-unit package.
 * Under Rule 6(1)(i), Unit Sale Price (USP) is ONLY mandatory for genuine multi-packs/bundles
 * of multiple separately-sellable retail units (e.g. "Pack of 6", "6x100g", "Combo of 3", "Set of 2").
 * A single retail package sold at one MRP is exempt from USP regardless of whether its quantity
 * is measured by count, weight, or volume (a single 1kg bag, a single 500ml bottle, and a single piece are all equally exempt).
 */
export function detectPackType(
  netQuantityText: string = '',
  productName: string = '',
  ocrText: string = ''
): 'Single-unit' | 'Multi-unit' {
  const combined = `${productName} ${netQuantityText} ${ocrText}`.toLowerCase();
  const netQty = (netQuantityText || '').toLowerCase().trim();

  // Multi-pack patterns:
  // 1. "pack of N", "bundle of N", "set of N", "combo of N", "box of N" (where N >= 2)
  if (/\b(?:pack|bundle|set|combo|box|case|bag)\s*of\s*([2-9]|[1-9][0-9]+)\b/i.test(combined)) {
    return 'Multi-unit';
  }

  // 2. Multi-pack keywords: "multipack", "multi-pack", "twin pack", "triple pack", "duo pack", "combo pack"
  if (/\b(?:multipack|multi-pack|twin\s*pack|triple\s*pack|duo\s*pack|combo\s*pack)\b/i.test(combined)) {
    return 'Multi-unit';
  }

  // 3. Multiplier notation: "6x100g", "6 x 100g", "6×100g", "4 * 50ml", "N x ...", "N × ..." (N >= 2)
  if (/\b([2-9]|[1-9][0-9]+)\s*[x×*]\s*[0-9]+/i.test(combined)) {
    return 'Multi-unit';
  }

  // 4. Net Qty having explicit multiplier: e.g. "3 x 75 g", "2 x 125 ml", "100 g x 3", "6 x 150ml"
  if (/\b[0-9.]+\s*(?:g|kg|ml|l|ltr|gm|grams)?\s*[x×*]\s*([2-9]|[1-9][0-9]+)\b/i.test(netQty) ||
      /\b([2-9]|[1-9][0-9]+)\s*[x×*]\s*[0-9.]+\s*(?:g|kg|ml|l|ltr|gm|grams)\b/i.test(netQty)) {
    return 'Multi-unit';
  }

  // 5. Explicit multi-count: "contains N units / pieces / bars / sachets / pouches / bottles / cans" (where N >= 2)
  if (/\b([2-9]|[1-9][0-9]+)\s*(?:units|pieces|pcs|items|bars|bottles|cans|pouches|sachets|tins|tubes|packs|packets)\b/i.test(netQty) ||
      /\b(?:contains|includes|consists\s*of)\s*([2-9]|[1-9][0-9]+)\s*(?:units|pieces|pcs|items|bars|bottles|cans|pouches|sachets|tins|tubes|packs|packets)\b/i.test(combined)) {
    return 'Multi-unit';
  }

  // Default: Any single retail package sold at one MRP is a Single-unit package
  return 'Single-unit';
}

/**
 * Checks if a package is a single-unit commodity under Rule 6(1)(i).
 * Single-unit packages are exempt from declaring Unit Sale Price (USP).
 */
export function isSingleUnitPackage(
  netQuantityText: string = '',
  productName: string = '',
  ocrText: string = '',
  packType?: string
): boolean {
  if (packType) {
    const pt = packType.trim().toLowerCase();
    if (pt === 'single-unit' || pt === 'single_unit' || pt === 'single unit' || pt === 'single') return true;
    if (pt === 'multi-unit' || pt === 'multi_unit' || pt === 'multi unit' || pt === 'multi') return false;
  }
  return detectPackType(netQuantityText, productName, ocrText) === 'Single-unit';
}

/**
 * Evaluates whether an item needs human review based on two independent conditions:
 * 1. Confidence score below 85% (< 0.85)
 * 2. Any Rule 6 mandatory declaration missing (respecting single-unit exemption for USP)
 * Independent of Compliant / Non-Compliant verdict.
/**
 * Detects whether a packaged commodity is Domestic (India) or Imported under Rule 6(1)(f).
 * An Indian city, state, or PIN code in manufacturer/packer/marketed-by address indicates Domestic.
 * An explicit foreign address or non-Indian country declaration indicates Imported.
 */
export function detectProductOrigin(
  mfrText: string = '',
  ocrText: string = '',
  countryOfOrigin: string = ''
): 'Domestic' | 'Imported' {
  const combined = `${mfrText} ${ocrText} ${countryOfOrigin}`.toLowerCase();

  // Explicit foreign country mentions in country of origin or made-in patterns
  const foreignCountries = [
    'china', 'usa', 'united states', 'uk', 'united kingdom', 'germany', 'japan',
    'thailand', 'vietnam', 'taiwan', 'italy', 'france', 'korea', 'south korea',
    'indonesia', 'malaysia', 'bangladesh', 'sri lanka', 'spain', 'brazil', 'mexico',
    'switzerland', 'belgium', 'netherlands', 'australia', 'new zealand', 'singapore'
  ];

  for (const c of foreignCountries) {
    if (new RegExp(`\\b(?:country\\s*of\\s*origin\\s*[:.]?\\s*|made\\s*in\\s*|product\\s*of\\s*|imported\\s*(?:from|by)\\s*[:.]?\\s*)${c}\\b`, 'i').test(combined)) {
      return 'Imported';
    }
  }

  // Explicit imported signals
  if (/\b(?:imported\s*(?:by|from|commodity)|country\s*of\s*origin\s*[:.]?\s*(?!india\b)[a-z]+)\b/i.test(combined)) {
    return 'Imported';
  }

  // Indian domestic geographic markers
  const indianMarkers = [
    'india', 'delhi', 'new delhi', 'maharashtra', 'gujarat', 'karnataka', 'tamil nadu',
    'uttar pradesh', 'west bengal', 'haryana', 'punjab', 'rajasthan', 'madhya pradesh',
    'kerala', 'telangana', 'andhra pradesh', 'bihar', 'odisha', 'assam', 'jharkhand',
    'chhattisgarh', 'uttarakhand', 'himachal pradesh', 'goa', 'bengaluru', 'bangalore',
    'mumbai', 'kolkata', 'chennai', 'hyderabad', 'pune', 'ahmedabad', 'mithapur', 'dwarka',
    'gurgaon', 'gurugram', 'noida', 'faridabad', 'ghaziabad', 'vadodara', 'surat', 'jaipur'
  ];

  for (const marker of indianMarkers) {
    if (combined.includes(marker)) {
      return 'Domestic';
    }
  }

  // Indian postal PIN code pattern (6 digits, 100000 to 899999)
  if (/\b[1-8][0-9]{5}\b/.test(combined)) {
    return 'Domestic';
  }

  return 'Domestic';
}

/**
 * Evaluates whether an item needs human review based on two independent conditions:
 * 1. Confidence score below 85% (< 0.85)
 * 2. Any Rule 6 mandatory declaration missing (respecting single-unit exemption for USP and domestic exemption for COO)
 * Independent of Compliant / Non-Compliant verdict.
 */
export function checkNeedsReview(
  confidence: number,
  declarationsFound: string[] = [],
  declarationsMissing: string[] = [],
  netQuantityText: string = '',
  productName: string = '',
  ocrText: string = '',
  productOrigin?: 'Domestic' | 'Imported' | string,
  packType?: 'Single-unit' | 'Multi-unit' | string
): NeedsReviewResult {
  const reasons: string[] = [];

  // 1. Confidence score below 85%
  const confVal = confidence <= 1.0 ? Math.round(confidence * 100) : Math.round(confidence);
  if (confVal < 85) {
    reasons.push(`Confidence ${confVal}% (< 85%)`);
  }

  // 2. Check exemptions:
  // - Single-unit package exemption for Unit Sale Price (USP) under Rule 6(1)(i)
  // - Domestically manufactured commodity exemption for Country of Origin under Rule 6(1)(f)
  const isSingle = isSingleUnitPackage(netQuantityText, productName, ocrText, packType);
  const isDomestic = (productOrigin || 'Domestic').toString().trim().toLowerCase() === 'domestic';

  const mandatoryFields = [
    { key: 'commodity_name', name: 'Commodity Name' },
    { key: 'net_quantity', name: 'Net Quantity' },
    { key: 'mrp', name: 'MRP' },
    { key: 'manufacturing_date', name: 'Date of Mfg/Packing' },
    { key: 'manufacturer_details', name: 'Manufacturer Details' },
    { key: 'consumer_care', name: 'Consumer Care' },
    { key: 'country_of_origin', name: 'Country of Origin' },
    { key: 'unit_sale_price', name: 'Unit Sale Price (USP)' },
  ];

  const foundSet = new Set(declarationsFound);
  const missingLabels: string[] = [];

  for (const field of mandatoryFields) {
    if (field.key === 'unit_sale_price' && isSingle) {
      // Single-unit packages exempt from USP under Rule 6(1)(i)
      continue;
    }
    if (field.key === 'country_of_origin' && isDomestic) {
      // Domestic commodities exempt from Country of Origin under Rule 6(1)(f)
      continue;
    }
    if (!foundSet.has(field.key)) {
      missingLabels.push(field.name);
    }
  }

  if (missingLabels.length > 0) {
    reasons.push(`Missing: ${missingLabels.join(', ')}`);
  }

  return {
    needsReview: reasons.length > 0,
    reasons,
    summaryReason: reasons.join(' • '),
  };
}

export interface ComplianceVerdictResult {
  compliant: boolean;
  declarationsFound: string[];
  declarationsMissing: string[];
  needsReview: boolean;
  reviewReasons: string[];
  productOrigin: 'Domestic' | 'Imported';
  packType: 'Single-unit' | 'Multi-unit';
}

/**
 * Unified Rule 6 compliance adjudication function.
 * Evaluates whether an item is legally compliant under Rule 6, recalculating
 * declarations_found, declarations_missing, compliant flag, and review reasons.
 */
export function evaluateItemCompliance(
  declarationValues: Record<string, string> = {},
  declarationsFound: string[] = [],
  productOriginInput?: 'Domestic' | 'Imported' | string,
  productName: string = '',
  confidence: number = 0.95,
  ocrText: string = '',
  packTypeInput?: 'Single-unit' | 'Multi-unit' | string
): ComplianceVerdictResult {
  const origin: 'Domestic' | 'Imported' = (productOriginInput && productOriginInput.toString().trim().toLowerCase() === 'imported')
    ? 'Imported'
    : (productOriginInput && productOriginInput.toString().trim().toLowerCase() === 'domestic')
      ? 'Domestic'
      : detectProductOrigin(declarationValues.manufacturer_details || '', ocrText, declarationValues.country_of_origin || '');

  const isDomestic = origin === 'Domestic';

  const packType: 'Single-unit' | 'Multi-unit' = (packTypeInput && packTypeInput.toLowerCase().includes('multi'))
    ? 'Multi-unit'
    : (packTypeInput && packTypeInput.toLowerCase().includes('single'))
      ? 'Single-unit'
      : (declarationValues.pack_type && declarationValues.pack_type.toLowerCase().includes('multi'))
        ? 'Multi-unit'
        : (declarationValues.pack_type && declarationValues.pack_type.toLowerCase().includes('single'))
          ? 'Single-unit'
          : detectPackType(declarationValues.net_quantity || '', productName, ocrText);

  const isSingle = packType === 'Single-unit';

  // Core mandatory declarations under Rule 6
  const mandatoryRules = [
    { key: 'commodity_name', name: 'Commodity Name' },
    { key: 'net_quantity', name: 'Net Quantity' },
    { key: 'mrp', name: 'MRP' },
    { key: 'manufacturing_date', name: 'Date of Mfg/Packing' },
    { key: 'manufacturer_details', name: 'Manufacturer Details' },
    { key: 'consumer_care', name: 'Consumer Care' },
    { key: 'country_of_origin', name: 'Country of Origin' },
    { key: 'unit_sale_price', name: 'Unit Sale Price (USP)' },
  ];

  const foundSet = new Set(declarationsFound);
  const missingKeys: string[] = [];
  const missingNames: string[] = [];

  for (const rule of mandatoryRules) {
    // 1. USP single-unit exemption
    if (rule.key === 'unit_sale_price' && isSingle) {
      continue;
    }
    // 2. Country of Origin domestic exemption
    if (rule.key === 'country_of_origin' && isDomestic) {
      continue;
    }

    const hasExtractedVal = Boolean(declarationValues[rule.key] && declarationValues[rule.key].trim());
    const isMarkedFound = foundSet.has(rule.key);

    if (!isMarkedFound && !hasExtractedVal) {
      missingKeys.push(rule.key);
      missingNames.push(rule.name);
    }
  }

  const compliant = missingKeys.length === 0;

  const reasons: string[] = [];
  const confVal = confidence <= 1.0 ? Math.round(confidence * 100) : Math.round(confidence);
  if (confVal < 85) {
    reasons.push(`Confidence ${confVal}% (< 85%)`);
  }
  if (missingNames.length > 0) {
    reasons.push(`Missing: ${missingNames.join(', ')}`);
  }

  return {
    compliant,
    declarationsFound: Array.from(foundSet),
    declarationsMissing: missingKeys,
    needsReview: reasons.length > 0,
    reviewReasons: reasons,
    productOrigin: origin,
    packType: packType,
  };
}

/**
 * Formats full Rule 6 statutory details array for rich table display
 */
export function formatRule6Details(declarationsFound: string[] = []): Rule6DetailItem[] {
  const foundSet = new Set(declarationsFound);
  return RULE6_FIELDS_CONFIG.map(cfg => ({
    key: cfg.key,
    sub_rule: cfg.sub_rule,
    name: cfg.name,
    description: cfg.description,
    found: foundSet.has(cfg.key),
  }));
}
