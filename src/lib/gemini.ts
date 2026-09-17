/**
 * Google Gemini LLM Client for Legal Metrology Rule 6 Compliance Reasoning
 */

export interface GeminiAnalysisResult {
  product_name: string;
  product_category: string;
  product_origin?: 'Domestic' | 'Imported';
  pack_type?: 'Single-unit' | 'Multi-unit';
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
    description: 'Country of origin (mandatory for imported goods; exempt for domestically manufactured goods)',
    mandatory: false,
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
    description: 'Unit sale price rounded to two decimal places (mandatory for multi-packs/bundles; exempt for single-unit retail packages)',
    mandatory: false,
  },
];

export async function analyzeDeclarationsWithGemini(
  combinedText: string,
  ocrByAngle: Record<string, string>,
  avgOcrConfidence: number
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

Analyze the extracted OCR text captured from 1 to 3 angles (Front PDP, Back Information Panel, Side Panel):

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
3. For single-unit packages (any single retail package sold at one MRP regardless of whether quantity is measured by count, weight, or volume, e.g. a single 1kg bag, 500ml bottle, 500g pouch, 1 unit), Unit Sale Price (USP) is NOT mandatory and is EXEMPT under Rule 6(1)(i). Only genuine multi-packs/bundles (e.g. "Pack of 6", "Combo of 3", "6x100g") require USP. If it is a single-unit package, mark unit_sale_price as found/exempt.
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

  // Verified functional models in priority order: gemini-3.5-flash-lite (fastest, ~1.5-2.5s), gemini-3.6-flash, gemini-3.5-flash
  const models = ['gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.5-flash'];
  let lastError: any = null;

  // Strict text-only content parts: Gemini only reasons over OCR text from Vision API
  const parts = [{ text: prompt }];

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

export interface MultimodalAnalysisResult extends GeminiAnalysisResult {
  raw_ocr_text: string;
  ocr_by_angle: Record<string, string>;
}

/**
 * Unified Gemini Multimodal Pipeline:
 * Analyzes packaging images directly to perform both accurate OCR transcription
 * and Rule 6 statutory compliance evaluation in a single round-trip.
 */
export async function analyzeMultimodalItemWithGemini(
  photos: { angle: string; buffer: Buffer; mimeType: string }[]
): Promise<MultimodalAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey || !apiKey.trim()) {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }

  const prompt = `You are the core regulatory AI engine of LabelLens, an automated compliance inspection system enforcing India's Legal Metrology (Packaged Commodities) Rules, 2011 (as amended).

Analyze the provided packaged commodity photos. You must perform BOTH accurate optical character recognition (OCR) and statutory Rule 6 compliance reasoning in this single call.

STATUTORY DECLARATIONS UNDER RULE 6(1):
1. 'commodity_name': Generic name of the commodity / product name on principal display panel.
2. 'net_quantity': Net quantity in standard metric units (g, kg, ml, l, n, u).
3. 'mrp': Maximum Retail Price inclusive of all taxes ('MRP Rs ... incl. of all taxes').
4. 'unit_sale_price': Unit sale price where required (per g, kg, ml, l, or number).
5. 'manufacturing_date': Month & year of manufacture / packing / import ('PKD' or 'MFG Date').
6. 'best_before': Best before date, expiry date, or 'Use By' if applicable.
7. 'manufacturer_details': Name and complete physical address of manufacturer / packer / importer.
8. 'consumer_care': Consumer care contact details (phone / email / physical address).
9. 'country_of_origin': Country of origin or manufacture ('Made in ...' / 'Country of Origin: ...').
10. 'dimensions': Package or commodity dimensions (if relevant to product packaging).

CRITICAL STATUTORY EXEMPTION RULES:
A. PRODUCT ORIGIN & RULE 6(1)(f) COUNTRY OF ORIGIN:
- Determine "product_origin": "Domestic" or "Imported".
  * If the manufacturer / packer / marketed-by address is in India (mentions an Indian state, city, PIN code, or India), classify as "Domestic".
  * If manufactured outside India or the label indicates imported goods, classify as "Imported".
- RULE 6(1)(f) EXEMPTION:
  * For "Domestic" products: Country of Origin is NOT mandatory under Rule 6(1)(f). Its absence must NOT be included in 'declarations_missing' and must NOT cause non-compliance!
  * For "Imported" products: Country of Origin IS mandatory. If absent from label, mark it in 'declarations_missing' and set compliant = false.

B. STATUTORY RULE 6(1)(i) UNIT SALE PRICE (USP) EXEMPTION:
- Determine "pack_type": "Single-unit" or "Multi-unit".
  * "Multi-unit": Genuine multi-pack or bundle of multiple separately-sellable retail units (e.g. "Pack of 6", "6x100g", "6×100g", "Combo of 3", "Set of 2", "Twin Pack").
  * "Single-unit": Any single retail package sold at one MRP, REGARDLESS of whether quantity is measured by count, weight, or volume (e.g. a single 1kg bag, a single 500g pouch, a single 500ml bottle, 250g box, 1 N toothbrush).
- RULE 6(1)(i) EXEMPTION:
  * For "Single-unit" packages: Unit Sale Price (USP) is NOT mandatory and is EXEMPT under Rule 6(1)(i). Its absence must NOT be included in 'declarations_missing' and must NOT cause non-compliance!
  * For "Multi-unit" packages: Unit Sale Price (USP) IS mandatory. If missing on a genuine multi-pack/bundle, mark 'unit_sale_price' in 'declarations_missing' and set compliant = false.

INSTRUCTIONS:
1. Accurately transcribe ALL visible text from the image into 'raw_ocr_text' and 'ocr_by_angle'.
2. Extract the exact value for each declaration if visible, or "" if missing.
3. Classify each declaration key into 'declarations_found' or 'declarations_missing' (respecting the Domestic and Single-unit exemptions above).
4. Determine if the packaging is fully compliant under Rule 6.
5. Set confidence between 0.0 and 1.0 based on text clarity and completeness. If text is clearly readable, confidence should be >= 0.85.

Respond with ONLY valid JSON strictly matching this schema:
{
  "product_name": "<generic or brand product name, or empty string if not stated on label>",
  "product_category": "<e.g. Packaged Foods, Staples, Personal Care, Dairy, Beverages, General>",
  "product_origin": "Domestic" | "Imported",
  "pack_type": "Single-unit" | "Multi-unit",
  "raw_ocr_text": "<all transcribed text from the packaging>",
  "ocr_by_angle": {
    "front": "<text transcribed from front photo>"
  },
  "compliant": true | false,
  "confidence": <number between 0.0 and 1.0>,
  "declarations_found": ["commodity_name", "net_quantity", ...],
  "declarations_missing": ["unit_sale_price", ...],
  "declaration_values": {
    "product_origin": "Domestic" | "Imported",
    "commodity_name": "...",
    "net_quantity": "...",
    "mrp": "...",
    "unit_sale_price": "...",
    "manufacturing_date": "...",
    "best_before": "...",
    "manufacturer_details": "...",
    "consumer_care": "...",
    "country_of_origin": "...",
    "dimensions": "..."
  },
  "cleaned_summary": "<clean multi-line summary of extracted statutory declarations with Rule citations>",
  "rule9_observations": "<observations on PDP clarity, font legibility, and contrast>"
}
`;

  // Validated working models: gemini-3.5-flash-lite (fastest, ~1.5-2.5s), gemini-3.6-flash, gemini-3.5-flash
  const models = ['gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.5-flash'];
  let lastError: any = null;

  // Build multimodal parts: attach each photo as inlineData followed by prompt
  const parts: any[] = [];
  for (const p of photos) {
    if (p.buffer && p.buffer.length > 0) {
      parts.push({
        inlineData: {
          mimeType: p.mimeType || 'image/jpeg',
          data: p.buffer.toString('base64'),
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
            maxOutputTokens: 2048,
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[Gemini Multimodal] Model ${model} returned HTTP ${res.status}: ${errText.slice(0, 150)}`);
        lastError = new Error(`HTTP ${res.status} from ${model}: ${errText.slice(0, 200)}`);
        continue;
      }

      const json = await res.json();
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error(`No candidate content returned from ${model}`);

      const parsed = JSON.parse(rawText);
      const declValues = parsed.declaration_values || {};
      const found = Array.isArray(parsed.declarations_found) ? parsed.declarations_found : [];
      let missing = Array.isArray(parsed.declarations_missing) ? parsed.declarations_missing : [];
      const conf = typeof parsed.confidence === 'number' ? parsed.confidence : 0.90;

      // Determine product origin (default to Domestic unless explicitly Imported)
      const origin: 'Domestic' | 'Imported' = (parsed.product_origin === 'Imported' || declValues.product_origin === 'Imported')
        ? 'Imported'
        : 'Domestic';
      declValues.product_origin = origin;

      // If Domestic, ensure country_of_origin is never in missing list
      if (origin === 'Domestic') {
        missing = missing.filter(k => k !== 'country_of_origin');
      }

      // Determine pack type: Single-unit vs Multi-unit
      const packType: 'Single-unit' | 'Multi-unit' = (parsed.pack_type === 'Multi-unit' || declValues.pack_type === 'Multi-unit')
        ? 'Multi-unit'
        : 'Single-unit';
      declValues.pack_type = packType;

      // If Single-unit, ensure unit_sale_price is never in missing list
      if (packType === 'Single-unit') {
        missing = missing.filter(k => k !== 'unit_sale_price');
      }

      let prodName = (parsed.product_name || '').trim();
      if (!prodName || prodName.toLowerCase() === 'unknown' || prodName.toLowerCase() === 'unidentified') {
        prodName = (declValues.commodity_name || '').trim();
      }
      if (!prodName) {
        prodName = declValues.net_quantity ? `Commodity (${declValues.net_quantity})` : 'Packaged Commodity';
      }

      return {
        product_name: prodName,
        product_category: parsed.product_category || 'General Commodity',
        product_origin: origin,
        pack_type: packType,
        raw_ocr_text: parsed.raw_ocr_text || '',
        ocr_by_angle: parsed.ocr_by_angle || {},
        compliant: Boolean(parsed.compliant) && missing.length === 0,
        confidence: conf,
        declarations_found: found,
        declarations_missing: missing,
        declaration_values: declValues,
        cleaned_summary: parsed.cleaned_summary || '',
        rule9_observations: parsed.rule9_observations || '',
      };
    } catch (err: any) {
      console.warn(`[Gemini Multimodal] Error with model ${model}:`, err.message);
      lastError = err;
    }
  }

  // Explicit non-silent failure: surface actual error rather than silently defaulting to 0-confidence
  throw new Error(`Gemini Multimodal Analysis failed across all models (${models.join(', ')}): ${lastError?.message || 'API error'}`);
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
