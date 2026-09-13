/**
 * Google Gemini LLM Client for Legal Metrology Rule 6 Compliance Reasoning
 */

export interface GeminiAnalysisResult {
  product_name: string;
  product_category: string;
  compliant: boolean;
  confidence: number;
  declarations_found: string[];
  declarations_missing: string[];
  declaration_values: Record<string, string>;
  cleaned_summary: string;
  rule9_observations: string;
}

export const RULE6_FIELDS_CONFIG = [
  {
    key: 'manufacturer_details',
    sub_rule: '6(1)(a)',
    name: 'Manufacturer / Packer Details',
    description: 'Name and complete address of manufacturer, packer, or importer',
    mandatory: true,
  },
  {
    key: 'commodity_name',
    sub_rule: '6(1)(b)',
    name: 'Generic Commodity Name',
    description: 'Common or generic name of the commodity on principal display panel',
    mandatory: true,
  },
  {
    key: 'net_quantity',
    sub_rule: '6(1)(c)',
    name: 'Net Quantity (Standard Units)',
    description: 'Net weight, volume, or count in standard legal units',
    mandatory: true,
  },
  {
    key: 'manufacturing_date',
    sub_rule: '6(1)(d)',
    name: 'Month & Year of Mfg / Packing',
    description: 'Month and year of manufacture, pre-packing, or import',
    mandatory: true,
  },
  {
    key: 'mrp',
    sub_rule: '6(1)(e)',
    name: 'Retail Sale Price (MRP)',
    description: 'Maximum Retail Price inclusive of all taxes (MRP Rs. / INR / ₹)',
    mandatory: true,
  },
  {
    key: 'consumer_care',
    sub_rule: '6(1)(ca)',
    name: 'Consumer Care Details',
    description: 'Name, address, phone number, and email of consumer care cell',
    mandatory: true,
  },
  {
    key: 'country_of_origin',
    sub_rule: '6(1)(f)',
    name: 'Country of Origin',
    description: 'Country of origin (mandatory for imported and domestic goods)',
    mandatory: true,
  },
  {
    key: 'dimensions',
    sub_rule: '6(1)(g)',
    name: 'Dimensions of Commodity',
    description: 'Sizes/dimensions where applicable (length, breadth, height)',
    mandatory: false,
  },
  {
    key: 'best_before',
    sub_rule: '6(1)(h)',
    name: 'Best Before / Expiry Date',
    description: 'Best before or use-by date for perishable commodities',
    mandatory: false,
  },
  {
    key: 'unit_sale_price',
    sub_rule: '6(1)(i)',
    name: 'Unit Sale Price (USP)',
    description: 'Unit sale price rounded to two decimal places (exempt for single-unit items)',
    mandatory: true,
  },
];

export async function analyzeDeclarationsWithGemini(
  combinedText: string,
  ocrByAngle: Record<string, string>,
  avgOcrConfidence: number,
  images?: { mimeType: string; base64: string }[]
): Promise<GeminiAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'YOUR_GEMINI_API_KEY') {
    console.warn('[Gemini] GEMINI_API_KEY not configured. Using rule-based fallback.');
    return ruleBasedFallbackAnalysis(combinedText, avgOcrConfidence);
  }

  const anglesContext = Object.entries(ocrByAngle)
    .filter(([_, txt]) => txt && txt.trim().length > 0)
    .map(([angle, txt]) => `--- Panel: ${angle.toUpperCase()} ---\n${txt}`)
    .join('\n\n');

  const prompt = `
You are an expert Legal Metrology compliance inspector examining physical retail packaged commodity specimens under the Legal Metrology (Packaged Commodities) Rules, 2011 and recent 2025–2026 amendments.

Analyze the extracted OCR text (and provided package image panels if available) captured from 1 to 3 angles (Front PDP, Back Information Panel, Side Panel):

Extracted OCR Text by Panel:
${anglesContext || '(No angle context provided)'}

Full Combined OCR Text:
"""${combinedText}"""

Task:
1. Identify the exact **Product Name** (brand + commodity) and **Product Category** (Packaged Food, Beverages, Electronics & Accessories, Cosmetics & Personal Care, Pan Masala / Tobacco, Medical Devices, Household Goods, or General Commodity).
2. Evaluate presence of the 10 Statutory Declarations under Rule 6:
   - "manufacturer_details": Rule 6(1)(a) - Name & address of mfr/packer/importer
   - "commodity_name": Rule 6(1)(b) - Generic commodity name
   - "net_quantity": Rule 6(1)(c) - Net weight, volume, or count in standard units
   - "manufacturing_date": Rule 6(1)(d) - Month & year of manufacture/packing/import
   - "mrp": Rule 6(1)(e) - Maximum Retail Price inclusive of all taxes
   - "consumer_care": Rule 6(1)(ca) - Consumer care contact (name, phone, email, address)
   - "country_of_origin": Rule 6(1)(f) - Country of origin (crucial for imported goods)
   - "dimensions": Rule 6(1)(g) - Dimensions if applicable to size-based products
   - "best_before": Rule 6(1)(h) - Expiry/use-by date for perishables/food/cosmetics
   - "unit_sale_price": Rule 6(1)(i) - Unit sale price rounded to 2 decimals
3. For single-unit packages (e.g. Net Qty: "1 N", "1 piece", "1 unit", "1 count"), Unit Sale Price (USP) is NOT mandatory under Rule 6(1)(i). If it is a single-unit package, mark unit_sale_price as found/exempt.
4. For non-applicable declarations (e.g. dimensions for tea powder, or best before for a charging cable), count them as found/exempt.
5. For each found declaration, extract the exact text snippet as printed on the packaging. Do NOT return placeholder text like "Extracted from label" - return the actual text (e.g. "₹ 45.00", "500 g", "Mfd by: XYZ Ltd"). If not found, return empty string "".

Return valid JSON strictly matching:
{
  "product_name": "<exact product title>",
  "product_category": "<Packaged Food | Beverages | Electronics & Accessories | Cosmetics & Personal Care | Pan Masala / Tobacco | Medical Devices | Household Goods | General Commodity>",
  "compliant": <boolean: true if all required mandatory declarations are verified>,
  "confidence": <float between 0.0 and 1.0>,
  "declarations_found": [<keys from ["manufacturer_details", "commodity_name", "net_quantity", "manufacturing_date", "mrp", "consumer_care", "country_of_origin", "dimensions", "best_before", "unit_sale_price"]>],
  "declarations_missing": [<missing keys from the above list>],
  "declaration_values": {
    "manufacturer_details": "<exact extracted name & address snippet or empty string>",
    "commodity_name": "<exact extracted commodity name snippet or empty string>",
    "net_quantity": "<exact extracted net quantity snippet or empty string>",
    "manufacturing_date": "<exact extracted date snippet or empty string>",
    "mrp": "<exact extracted MRP snippet or empty string>",
    "consumer_care": "<exact extracted consumer care contact or empty string>",
    "country_of_origin": "<exact extracted origin snippet or empty string>",
    "dimensions": "<exact extracted dimensions snippet or empty string>",
    "best_before": "<exact extracted expiry snippet or empty string>",
    "unit_sale_price": "<exact extracted USP snippet or empty string>"
  },
  "cleaned_summary": "<clean multi-line text listing extracted declaration values with Rule citations, e.g. '[Rule 6(1)(e)] MRP: Rs 45.00 (incl. of all taxes)'>",
  "rule9_observations": "<observations on PDP clarity, font legibility, language, and USP proportion>"
}
`;

  // Try models in order of capability: gemini-3.6-flash, gemini-2.5-flash, gemini-2.0-flash
  const models = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.0-flash'];
  let lastError: any = null;

  // Build multimodal content parts
  const parts: any[] = [];
  if (images && images.length > 0) {
    for (const img of images) {
      parts.push({
        inlineData: {
          mimeType: img.mimeType || 'image/jpeg',
          data: img.base64,
        },
      });
    }
  }
  parts.push({ text: prompt });

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[Gemini] Model ${model} returned HTTP ${res.status}: ${errText}`);
        lastError = new Error(`HTTP ${res.status}: ${errText}`);
        continue;
      }

      const json = await res.json();
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('No candidate content in Gemini response');

      const parsed = JSON.parse(rawText);
      const declValues = parsed.declaration_values || {};
      const found = parsed.declarations_found || [];
      const missing = parsed.declarations_missing || [];

      const llmConf = typeof parsed.confidence === 'number' ? parsed.confidence : 0.9;
      const finalConf = avgOcrConfidence > 0 ? Math.round(((llmConf + avgOcrConfidence) / 2) * 100) / 100 : llmConf;

      return {
        product_name: parsed.product_name || 'Packaged Commodity',
        product_category: parsed.product_category || 'General Commodity',
        compliant: Boolean(parsed.compliant),
        confidence: finalConf,
        declarations_found: found,
        declarations_missing: missing,
        declaration_values: declValues,
        cleaned_summary: parsed.cleaned_summary || '',
        rule9_observations: parsed.rule9_observations || '',
      };
    } catch (err) {
      console.warn(`[Gemini] Error with model ${model}:`, err);
      lastError = err;
    }
  }

  console.warn('[Gemini] All Gemini API attempts failed. Using rule-based fallback analysis.', lastError);
  return ruleBasedFallbackAnalysis(combinedText, avgOcrConfidence);
}

/**
 * Fallback regex/keyword parser when LLM is unavailable
 */
export function ruleBasedFallbackAnalysis(
  text: string,
  ocrConfidence: number
): GeminiAnalysisResult {
  const lower = text.toLowerCase();

  const declaration_values: Record<string, string> = {
    manufacturer_details: '',
    commodity_name: '',
    net_quantity: '',
    manufacturing_date: '',
    mrp: '',
    consumer_care: '',
    country_of_origin: '',
    dimensions: '',
    best_before: '',
    unit_sale_price: '',
  };

  // MRP
  const mrpMatch = text.match(/(?:mrp|max(?:imum)?\s*retail\s*price|rs\.?|inr|₹)\s*[:.]?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);
  if (mrpMatch) declaration_values.mrp = `₹ ${mrpMatch[1]}`;

  // Net Quantity
  const qtyMatch = text.match(/(?:net\s*(?:qty|quantity|wt|weight|content)|quantity)\s*[:.]?\s*([0-9.]+\s*(?:g|gm|kg|ml|l|ltr|piece|pcs|units?|n|nos?))/i);
  if (qtyMatch) declaration_values.net_quantity = qtyMatch[1];

  // Mfg Date
  const dateMatch = text.match(/(?:mfd|mfg|pkd|packed|date\s*of\s*(?:mfg|packaging))\s*[:.]?\s*([0-9]{1,2}[\/\-][0-9]{2,4}|[a-z]{3}\s*[0-9]{2,4})/i);
  if (dateMatch) declaration_values.manufacturing_date = dateMatch[1];

  // Country of Origin
  const originMatch = text.match(/(?:country\s*of\s*origin|made\s*in|produced\s*in|manufactured\s*in)\s*[:.]?\s*([a-zA-Z\s]+)/i);
  if (originMatch) declaration_values.country_of_origin = originMatch[1].trim().split('\n')[0];

  // Consumer Care
  const careMatch = text.match(/(?:consumer\s*care|customer\s*care|helpline|toll\s*free|email)\s*[:.]?\s*([^\n]+)/i);
  if (careMatch) declaration_values.consumer_care = careMatch[1].trim();

  // Manufacturer Details
  const mfrMatch = text.match(/(?:manufactured\s*by|mfd\s*by|packed\s*by|mktd\s*by|marketed\s*by)\s*[:.]?\s*([^\n]+)/i);
  if (mfrMatch) declaration_values.manufacturer_details = mfrMatch[1].trim();

  // Unit Sale Price
  const uspMatch = text.match(/(?:usp|unit\s*sale\s*price|\/\s*(?:g|gm|kg|ml|l|unit|piece|n))\s*[:.]?\s*([^\n]+)/i);
  if (uspMatch) declaration_values.unit_sale_price = uspMatch[1].trim();

  // Best Before
  const expMatch = text.match(/(?:best\s*before|use\s*by|expiry|exp\s*date)\s*[:.]?\s*([^\n]+)/i);
  if (expMatch) declaration_values.best_before = expMatch[1].trim();

  // Determine found vs missing
  const found: string[] = [];
  const missing: string[] = [];

  RULE6_FIELDS_CONFIG.forEach(f => {
    if (declaration_values[f.key] && declaration_values[f.key].trim() !== '') {
      found.push(f.key);
    } else {
      missing.push(f.key);
    }
  });

  // Extract candidate product name from first non-empty lines
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
  const candidateName = lines.length > 0 ? lines[0] : 'Packaged Commodity';
  declaration_values.commodity_name = candidateName;
  if (!found.includes('commodity_name')) found.push('commodity_name');

  const summaryLines = found.map(k => {
    const cfg = RULE6_FIELDS_CONFIG.find(c => c.key === k);
    return `[Rule ${cfg?.sub_rule || '6'}] ${cfg?.name || k}: ${declaration_values[k]}`;
  });

  return {
    product_name: candidateName,
    product_category: 'Packaged Commodity',
    compliant: missing.length === 0,
    confidence: ocrConfidence > 0 ? ocrConfidence : 0.82,
    declarations_found: found,
    declarations_missing: missing,
    declaration_values,
    cleaned_summary: summaryLines.join('\n') || '(No declarations detected)',
    rule9_observations: 'Automated fallback evaluation.',
  };
}
