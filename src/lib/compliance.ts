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
 * Detects if a package is a single-unit commodity under Rule 6(1)(i).
 * Single-unit packages are exempt from declaring Unit Sale Price (USP).
 */
export function isSingleUnitPackage(
  netQuantityText: string = '',
  productName: string = '',
  ocrText: string = ''
): boolean {
  const combined = `${netQuantityText} ${productName} ${ocrText}`.toLowerCase();
  const netQty = netQuantityText.trim().toLowerCase();

  // Pattern A: Net Qty string explicitly 1 count / piece / unit / N
  if (/^1\s*(?:n|u|piece|pc|unit|item|number|count|nos|no|pk|pack)?$/i.test(netQty)) {
    return true;
  }

  // Pattern B: Regex word boundary for single unit counts
  if (/\b1\s*(?:n|u|piece|pc|unit|item|number|count|nos|no)\b/i.test(combined)) {
    return true;
  }

  // Pattern C: Phrase matches
  if (/\b(?:single\s*(?:unit|piece|pack|item)|1\s*unit\s*pack)\b/i.test(combined)) {
    return true;
  }

  if (/\b(?:net\s*(?:qty|quantity|count)?\s*[:.]?\s*1\s*(?:n|u|piece|pc|unit|item|number|nos|no))\b/i.test(combined)) {
    return true;
  }

  return false;
}

/**
 * Evaluates whether an item needs human review based on two independent conditions:
 * 1. Confidence score below 85% (< 0.85)
 * 2. Any Rule 6 mandatory declaration missing (respecting single-unit exemption for USP)
 * Independent of Compliant / Non-Compliant verdict.
 */
export function checkNeedsReview(
  confidence: number,
  declarationsFound: string[] = [],
  declarationsMissing: string[] = [],
  netQuantityText: string = '',
  productName: string = '',
  ocrText: string = ''
): NeedsReviewResult {
  const reasons: string[] = [];

  // 1. Confidence score below 85%
  const confVal = confidence <= 1.0 ? Math.round(confidence * 100) : Math.round(confidence);
  if (confVal < 85) {
    reasons.push(`Confidence ${confVal}% (< 85%)`);
  }

  // 2. Check single-unit exemption for Unit Sale Price (USP)
  const isSingle = isSingleUnitPackage(netQuantityText, productName, ocrText);

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
