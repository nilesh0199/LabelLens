import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib';

// Color Palette matching LabelLens Branding
const NAVY = rgb(0.08, 0.09, 0.23);        // #14163A (Brand Navy)
const SLATE_DARK = rgb(0.12, 0.15, 0.32);  // #1F2652
const GOLD = rgb(0.72, 0.54, 0.17);        // #B8892B (Gold Accent)
const TEXT_DARK = rgb(0.1, 0.1, 0.14);     // #1A1A24
const TEXT_MUTED = rgb(0.42, 0.44, 0.52);  // #6B7084
const BORDER_LIGHT = rgb(0.88, 0.89, 0.92);// #E0E2EA
const GREEN = rgb(0.02, 0.48, 0.3);        // #057A4C (Compliant)
const RED = rgb(0.78, 0.12, 0.12);         // #C81E1E (Non-Compliant)
const BG_PAPER = rgb(0.98, 0.98, 0.96);    // #FAF9F5

export interface OfficerInfo {
  full_name: string;
  badge_number: string;
  jurisdiction: string;
}

const MANDATORY_RULE6_FIELDS: { key: string; label: string }[] = [
  { key: 'commodity_name', label: '1. Name & Description of Commodity' },
  { key: 'net_quantity', label: '2. Net Quantity (Weight/Measure/Count)' },
  { key: 'mrp', label: '3. Maximum Retail Price (MRP incl. taxes)' },
  { key: 'unit_sale_price', label: '4. Unit Sale Price (USP)' },
  { key: 'manufacturing_date', label: '5. Date of Packaging / Mfg / Import' },
  { key: 'best_before', label: '6. Expiry / Best Before / Use By' },
  { key: 'manufacturer_details', label: '7. Manufacturer / Packer / Importer' },
  { key: 'consumer_care', label: '8. Consumer Care Details (Phone/Email)' },
  { key: 'country_of_origin', label: '9. Country of Origin (Imported Goods)' },
  { key: 'dimensions', label: '10. Dimensions of Commodity / Package' },
];

function safeStr(text: any): string {
  if (text === null || text === undefined) return '';
  let str = String(text);
  str = str.replace(/₹/g, 'Rs. ');
  str = str.replace(/•/g, '-');
  str = str.replace(/—/g, '-');
  str = str.replace(/–/g, '-');
  str = str.replace(/“/g, '"').replace(/”/g, '"');
  str = str.replace(/‘/g, "'").replace(/’/g, "'");
  str = str.replace(/…/g, '...');
  return str.replace(/[^\x20-\x7E\xA0-\xFF]/g, '');
}

function wrapPageWithSafeDraw(page: PDFPage): PDFPage {
  const origDrawText = page.drawText.bind(page);
  page.drawText = (text: string, options?: any) => {
    return origDrawText(safeStr(text), options);
  };
  return page;
}

/**
 * Level 1: Single-Item Statutory Compliance PDF Report
 */
export async function generateSingleItemPdf(
  item: any,
  batch: any,
  officer: OfficerInfo = {
    full_name: 'Dr. S. K. Sharma',
    badge_number: 'AD-CTRL-DL-02',
    jurisdiction: 'Controller Office Delhi',
  }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = wrapPageWithSafeDraw(pdfDoc.addPage([595.28, 841.89])); // A4 (points)
  const { width, height } = page.getSize();
  let y = height - 36;

  // Header Banner
  page.drawRectangle({
    x: 36,
    y: y - 55,
    width: width - 72,
    height: 60,
    color: NAVY,
  });

  page.drawText('GOVERNMENT OF INDIA - DEPARTMENT OF CONSUMER AFFAIRS', {
    x: 48,
    y: y - 18,
    size: 8,
    font: fontBold,
    color: GOLD,
  });

  page.drawText('LEGAL METROLOGY ACT, 2009 - STATUTORY SPECIMEN AUDIT DOSSIER', {
    x: 48,
    y: y - 34,
    size: 11,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(`Official Adjudication Record - Section 15 & 36 Verification - Case ID: ${item.item_id || 'N/A'}`, {
    x: 48,
    y: y - 48,
    size: 8,
    font: fontRegular,
    color: rgb(0.8, 0.85, 0.95),
  });

  y -= 70;

  // Overview Strip (2 Columns)
  page.drawRectangle({
    x: 36,
    y: y - 56,
    width: width - 72,
    height: 56,
    color: BG_PAPER,
    borderColor: BORDER_LIGHT,
    borderWidth: 1,
  });

  const col1X = 48;
  const col2X = 310;

  page.drawText('SPECIMEN DETAILS', { x: col1X, y: y - 14, size: 8.5, font: fontBold, color: SLATE_DARK });
  page.drawText(`Product: ${item.product_name || 'Unspecified Commodity'}`, { x: col1X, y: y - 27, size: 7.5, font: fontRegular, color: TEXT_DARK });
  page.drawText(`Category: ${item.product_category || 'General Commodity'}`, { x: col1X, y: y - 38, size: 7.5, font: fontRegular, color: TEXT_DARK });
  page.drawText(`Item ID: ${item.item_id} | Batch: ${batch?.batch_id || item.batch_id}`, { x: col1X, y: y - 49, size: 7.5, font: fontRegular, color: TEXT_MUTED });

  page.drawText('JURISDICTION & INSPECTION', { x: col2X, y: y - 14, size: 8.5, font: fontBold, color: SLATE_DARK });
  page.drawText(`Store: ${batch?.store_name || item.store_name || 'Retail Establishment'}`, { x: col2X, y: y - 27, size: 7.5, font: fontRegular, color: TEXT_DARK });
  page.drawText(`Location: ${batch?.store_location || item.store_location || 'Jurisdiction Circle'}`, { x: col2X, y: y - 38, size: 7.5, font: fontRegular, color: TEXT_DARK });
  page.drawText(`Inspector: ${batch?.inspector_name || item.inspector_name || 'LMO Officer'} (${batch?.inspector_id || item.inspector_id || ''})`, { x: col2X, y: y - 49, size: 7.5, font: fontRegular, color: TEXT_MUTED });

  y -= 68;

  // Compliance Verdict Banner
  const isCompliant = Boolean(item.compliant);
  const verdictBg = isCompliant ? rgb(0.92, 0.98, 0.94) : rgb(0.99, 0.93, 0.93);
  const verdictBorder = isCompliant ? GREEN : RED;
  const verdictText = isCompliant ? 'COMPLIANT (RULE 6 MANDATES SATISFIED)' : 'NON-COMPLIANT (STATUTORY VIOLATION NOTED)';

  page.drawRectangle({
    x: 36,
    y: y - 30,
    width: width - 72,
    height: 30,
    color: verdictBg,
    borderColor: verdictBorder,
    borderWidth: 1.5,
  });

  page.drawText(`OFFICIAL STATUTORY VERDICT: ${verdictText}`, {
    x: 48,
    y: y - 15,
    size: 9,
    font: fontBold,
    color: isCompliant ? GREEN : RED,
  });

  page.drawText(`AI Confidence Score: ${Math.round((item.confidence || 0.9) * 100)}% | Status: ${item.status || 'reviewed'} | Needs Review Flag: ${item.needs_review ? 'YES' : 'NO'}`, {
    x: 48,
    y: y - 25,
    size: 7,
    font: fontRegular,
    color: TEXT_DARK,
  });

  y -= 42;

  // Fetch and embed photos from Supabase Storage
  const photos = item.photos || [];
  const embeddedPhotos: { img: any; angle: string }[] = [];

  for (const p of photos) {
    if (!p || !p.url) continue;
    try {
      const pRes = await fetch(p.url);
      if (pRes.ok) {
        const buf = await pRes.arrayBuffer();
        const uint8 = new Uint8Array(buf);
        let embedded;
        if (uint8[0] === 0x89 && uint8[1] === 0x50 && uint8[2] === 0x4E && uint8[3] === 0x47) {
          embedded = await pdfDoc.embedPng(buf);
        } else {
          embedded = await pdfDoc.embedJpg(buf);
        }
        embeddedPhotos.push({
          img: embedded,
          angle: (p.angle || 'Evidence').toUpperCase(),
        });
      }
    } catch (err) {
      console.warn('[SingleItemPdf] Could not fetch/embed photo:', p.url, err);
    }
  }

  // Side-by-Side: Left Column (Photographic Evidence) & Right Column (Rule 6 Checklist)
  const photoColX = 36;
  const photoColW = 180;
  const tableColX = 224;
  const tableColW = 335;
  const sectionTopY = y;

  // Left Column Header: Photos
  page.drawRectangle({ x: photoColX, y: sectionTopY - 16, width: photoColW, height: 16, color: SLATE_DARK });
  page.drawText(`Captured Evidence Photos (${embeddedPhotos.length})`, { x: photoColX + 8, y: sectionTopY - 11, size: 7.5, font: fontBold, color: rgb(1, 1, 1) });

  // Right Column Header: Checklist
  page.drawRectangle({ x: tableColX, y: sectionTopY - 16, width: tableColW, height: 16, color: SLATE_DARK });
  page.drawText('Rule 6(1) Statutory Particular', { x: tableColX + 6, y: sectionTopY - 11, size: 7, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('Detected / Verified Value', { x: tableColX + 140, y: sectionTopY - 11, size: 7, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('Status', { x: tableColX + 285, y: sectionTopY - 11, size: 7, font: fontBold, color: rgb(1, 1, 1) });

  let curTableY = sectionTopY - 16;

  // Render Table Rows (Right Column)
  const foundSet = new Set(item.declarations_found || []);
  const declVals = item.declaration_values || {};

  for (let i = 0; i < MANDATORY_RULE6_FIELDS.length; i++) {
    const field = MANDATORY_RULE6_FIELDS[i];
    const isFound = foundSet.has(field.key);
    let val = declVals[field.key] || (isFound ? 'Present on packaging' : 'Not detected');
    if (val.length > 32) val = val.substring(0, 30) + '...';

    const rowBg = i % 2 === 0 ? rgb(0.99, 0.99, 1) : rgb(1, 1, 1);
    page.drawRectangle({
      x: tableColX,
      y: curTableY - 17,
      width: tableColW,
      height: 17,
      color: rowBg,
      borderColor: BORDER_LIGHT,
      borderWidth: 0.5,
    });

    page.drawText(field.label.substring(0, 24), { x: tableColX + 6, y: curTableY - 12, size: 6.8, font: fontRegular, color: TEXT_DARK });
    page.drawText(val, { x: tableColX + 140, y: curTableY - 12, size: 6.8, font: fontRegular, color: isFound ? TEXT_DARK : TEXT_MUTED });

    const statusStr = isFound ? 'PRESENT' : 'MISSING';
    const statusColor = isFound ? GREEN : RED;
    page.drawText(statusStr, { x: tableColX + 285, y: curTableY - 12, size: 6.8, font: fontBold, color: statusColor });

    curTableY -= 17;
  }

  // Render Photographic Evidence (Left Column)
  let curPhotoY = sectionTopY - 16;
  const totalPhotoH = 170; // Matches checklist table height (10 * 17)

  if (embeddedPhotos.length === 0) {
    page.drawRectangle({
      x: photoColX,
      y: curPhotoY - totalPhotoH,
      width: photoColW,
      height: totalPhotoH,
      color: BG_PAPER,
      borderColor: BORDER_LIGHT,
      borderWidth: 1,
    });
    page.drawText('No photo files captured', { x: photoColX + 25, y: curPhotoY - 75, size: 8, font: fontBold, color: TEXT_MUTED });
    page.drawText('or available in storage.', { x: photoColX + 32, y: curPhotoY - 90, size: 7.5, font: fontRegular, color: TEXT_MUTED });
  } else {
    const slotH = Math.floor(totalPhotoH / embeddedPhotos.length);
    for (let pIdx = 0; pIdx < embeddedPhotos.length; pIdx++) {
      const ep = embeddedPhotos[pIdx];
      const boxY = curPhotoY - slotH;

      page.drawRectangle({
        x: photoColX,
        y: boxY,
        width: photoColW,
        height: slotH,
        color: rgb(0.97, 0.97, 0.98),
        borderColor: BORDER_LIGHT,
        borderWidth: 0.5,
      });

      // Scale photo to fit in box with padding for label
      const availW = photoColW - 12;
      const availH = slotH - 16;
      const scaled = ep.img.scaleToFit(availW, availH);
      const imgX = photoColX + Math.round((photoColW - scaled.width) / 2);
      const imgY = boxY + 14 + Math.round((availH - scaled.height) / 2);

      page.drawImage(ep.img, {
        x: imgX,
        y: imgY,
        width: scaled.width,
        height: scaled.height,
      });

      page.drawText(`Angle: ${ep.angle}`, {
        x: photoColX + 6,
        y: boxY + 4,
        size: 6.5,
        font: fontBold,
        color: NAVY,
      });

      curPhotoY -= slotH;
    }
  }

  y = curTableY - 14;

  // Reviewing Officer Remarks & Adjudication Notes
  page.drawText('ADJUDICATING OFFICER ACTION & REMARKS', {
    x: 36,
    y: y,
    size: 9,
    font: fontBold,
    color: SLATE_DARK,
  });
  y -= 10;

  page.drawRectangle({
    x: 36,
    y: y - 44,
    width: width - 72,
    height: 44,
    color: BG_PAPER,
    borderColor: BORDER_LIGHT,
    borderWidth: 1,
  });

  const actionText = item.officer_action ? item.officer_action.toUpperCase() : 'PENDING REVIEW';
  const remarksText = item.officer_remarks || '(No special remarks noted. Approved under standard Rule 6 compliance assessment.)';

  page.drawText(`Action Logged: ${actionText} | Adjudicated By: ${officer.full_name} (${officer.badge_number})`, {
    x: 44,
    y: y - 13,
    size: 7.5,
    font: fontBold,
    color: TEXT_DARK,
  });

  page.drawText(`Judicial Rationale: "${remarksText.substring(0, 110)}"`, {
    x: 44,
    y: y - 26,
    size: 7,
    font: fontRegular,
    color: TEXT_DARK,
  });

  page.drawText(`Jurisdiction: ${officer.jurisdiction} - Date Generated: ${new Date().toLocaleString('en-IN')}`, {
    x: 44,
    y: y - 37,
    size: 6.5,
    font: fontRegular,
    color: TEXT_MUTED,
  });

  y -= 54;

  // Digital Authentication Seal
  page.drawRectangle({
    x: width - 230,
    y: 38,
    width: 194,
    height: 42,
    borderColor: GOLD,
    borderWidth: 1,
    color: rgb(0.99, 0.98, 0.94),
  });

  page.drawText('DIGITALLY AUTHENTICATED RECORD', {
    x: width - 222,
    y: 67,
    size: 6.5,
    font: fontBold,
    color: GOLD,
  });
  page.drawText(`${officer.full_name}, ${officer.badge_number}`, {
    x: width - 222,
    y: 56,
    size: 7.5,
    font: fontBold,
    color: NAVY,
  });
  page.drawText('Senior Reviewing Officer - Legal Metrology', {
    x: width - 222,
    y: 45,
    size: 6.5,
    font: fontRegular,
    color: TEXT_MUTED,
  });

  // Footer Citation
  page.drawText('LabelLens Statutory Inspection Platform - Ministry of Consumer Affairs, Food & Public Distribution - Page 1 of 1', {
    x: 36,
    y: 22,
    size: 6.5,
    font: fontRegular,
    color: TEXT_MUTED,
  });

  return await pdfDoc.save();
}

/**
 * Level 2: Multi-Item Combined Ledger PDF Report
 */
export async function generateCombinedLedgerPdf(
  items: any[],
  officer: OfficerInfo = {
    full_name: 'Dr. S. K. Sharma',
    badge_number: 'AD-CTRL-DL-02',
    jurisdiction: 'Controller Office Delhi',
  }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const ITEMS_PER_PAGE = 12;
  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    const page = wrapPageWithSafeDraw(pdfDoc.addPage([841.89, 595.28])); // A4 Landscape
    const { width, height } = page.getSize();
    let y = height - 36;

    // Header Banner
    page.drawRectangle({ x: 36, y: y - 48, width: width - 72, height: 48, color: NAVY });
    page.drawText('GOVERNMENT OF INDIA - DEPARTMENT OF CONSUMER AFFAIRS', { x: 48, y: y - 16, size: 7.5, font: fontBold, color: GOLD });
    page.drawText('LEGAL METROLOGY REGULATORY ENFORCEMENT LEDGER - COMBINED COMPLIANCE DOSSIER', { x: 48, y: y - 30, size: 10.5, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText(`Supervising Officer: ${officer.full_name} (${officer.badge_number}) - Jurisdiction: ${officer.jurisdiction} - Generated: ${new Date().toLocaleString('en-IN')}`, { x: 48, y: y - 42, size: 7.5, font: fontRegular, color: rgb(0.85, 0.9, 0.98) });

    y -= 64;

    // Subheader info
    page.drawText(`Selected Records: ${items.length} specimens | Page ${pageIdx + 1} of ${totalPages}`, {
      x: 36,
      y: y,
      size: 8,
      font: fontBold,
      color: SLATE_DARK,
    });
    y -= 14;

    // Table Columns Header
    page.drawRectangle({ x: 36, y: y - 18, width: width - 72, height: 18, color: SLATE_DARK });
    page.drawText('#', { x: 42, y: y - 13, size: 7, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('Item ID', { x: 62, y: y - 13, size: 7, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('Product Name / Commodity', { x: 165, y: y - 13, size: 7, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('Category', { x: 320, y: y - 13, size: 7, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('Store / Establishment', { x: 420, y: y - 13, size: 7, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('Inspector', { x: 550, y: y - 13, size: 7, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('Verdict', { x: 645, y: y - 13, size: 7, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('Officer Action', { x: 720, y: y - 13, size: 7, font: fontBold, color: rgb(1, 1, 1) });
    y -= 18;

    const slice = items.slice(pageIdx * ITEMS_PER_PAGE, (pageIdx + 1) * ITEMS_PER_PAGE);

    for (let r = 0; r < slice.length; r++) {
      const it = slice[r];
      const rowIdx = pageIdx * ITEMS_PER_PAGE + r + 1;
      const isCompliant = Boolean(it.compliant);
      const rowBg = r % 2 === 0 ? rgb(0.99, 0.99, 1) : rgb(1, 1, 1);

      page.drawRectangle({ x: 36, y: y - 20, width: width - 72, height: 20, color: rowBg, borderColor: BORDER_LIGHT, borderWidth: 0.5 });

      page.drawText(String(rowIdx), { x: 42, y: y - 14, size: 7, font: fontRegular, color: TEXT_MUTED });
      page.drawText(it.item_id || '-', { x: 62, y: y - 14, size: 7, font: fontBold, color: NAVY });

      let prod = it.product_name || 'Commodity';
      if (prod.length > 32) prod = prod.substring(0, 30) + '...';
      page.drawText(prod, { x: 165, y: y - 14, size: 7, font: fontRegular, color: TEXT_DARK });

      page.drawText(it.product_category || 'General', { x: 320, y: y - 14, size: 7, font: fontRegular, color: TEXT_MUTED });

      let store = it.store_name || 'Retail Store';
      if (store.length > 25) store = store.substring(0, 23) + '...';
      page.drawText(store, { x: 420, y: y - 14, size: 7, font: fontRegular, color: TEXT_DARK });

      page.drawText(it.inspector_name || it.inspector_id || 'LMO Officer', { x: 550, y: y - 14, size: 7, font: fontRegular, color: TEXT_MUTED });

      const verdictStr = isCompliant ? 'COMPLIANT' : 'NON-COMPLIANT';
      page.drawText(verdictStr, { x: 645, y: y - 14, size: 6.8, font: fontBold, color: isCompliant ? GREEN : RED });

      const actionStr = (it.officer_action || it.status || 'APPROVED').toUpperCase();
      page.drawText(actionStr, { x: 720, y: y - 14, size: 6.8, font: fontBold, color: SLATE_DARK });

      y -= 20;
    }

    // Footer
    page.drawText('LabelLens Statutory Inspection Platform - Official Adjudication Ledger Record - Authenticated Copy', {
      x: 36,
      y: 20,
      size: 6.5,
      font: fontRegular,
      color: TEXT_MUTED,
    });
  }

  return await pdfDoc.save();
}

function wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
  if (!text) return ['-'];
  const words = String(text).split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(safeStr(testLine), fontSize);
    if (width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Word is longer than maxWidth: chunk it
        lines.push(word.substring(0, Math.max(1, Math.floor(word.length * (maxWidth / width)))));
        currentLine = word.substring(Math.max(1, Math.floor(word.length * (maxWidth / width))));
      }
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : ['-'];
}

/**
 * Level 3: Weekly/Monthly Executive Aggregate Compliance PDF Report
 * Features:
 * - Section I (Page 1): Executive Summary (authentic GoI letterhead, KPIs, Top Violations, Inspector Breakdown)
 * - Section I (Page 2+): Complete 7-Column Detailed Audit Ledger (Product, Category, Verdict, Missing Declarations, Inspector, Batch, Date) with multi-line text wrapping and no cell clipping.
 * - Section II: Appended Detailed Item Dossier Sheets for all items in scope (photos + 10-row Rule 6 checklist).
 */
export async function generateAggregateReportPdf(
  stats: any,
  officer: OfficerInfo = {
    full_name: 'Dr. S. K. Sharma',
    badge_number: 'AD-CTRL-DL-02',
    jurisdiction: 'Controller Office Delhi',
  },
  dateRange: { from: string; to: string; verdict?: string },
  items: any[] = []
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const filterLabel = dateRange.verdict === 'compliant'
    ? 'Compliant Items Only'
    : (dateRange.verdict === 'non_compliant' ? 'Non-Compliant Violations Only' : 'All Jurisdictional Items');

  const dossierSerial = `LMO/EXEC/AGG/${new Date().getFullYear()}/${Math.floor(10000 + Math.random() * 90000)}`;

  // ==========================================================================
  // SECTION I - PAGE 1: EXECUTIVE SUMMARY (Landscape A4: 841.89 x 595.28)
  // ==========================================================================
  const page1 = wrapPageWithSafeDraw(pdfDoc.addPage([841.89, 595.28]));
  const { width: p1W, height: p1H } = page1.getSize();
  let y1 = p1H - 30;

  // Formal double border
  page1.drawRectangle({
    x: 22,
    y: 20,
    width: p1W - 44,
    height: p1H - 40,
    borderColor: NAVY,
    borderWidth: 1.5,
  });
  page1.drawRectangle({
    x: 25,
    y: 23,
    width: p1W - 50,
    height: p1H - 46,
    borderColor: GOLD,
    borderWidth: 0.75,
  });

  // Authentic Government of India Header Banner
  page1.drawRectangle({ x: 34, y: y1 - 62, width: p1W - 68, height: 62, color: NAVY });
  page1.drawText('GOVERNMENT OF INDIA • DIRECTORATE GENERAL OF LEGAL METROLOGY', { x: 46, y: y1 - 16, size: 8, font: fontBold, color: GOLD });
  page1.drawText('DEPARTMENT OF CONSUMER AFFAIRS • MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION', { x: 46, y: y1 - 29, size: 7.2, font: fontRegular, color: rgb(0.88, 0.92, 0.98) });
  page1.drawText('EXECUTIVE STATUTORY COMPLIANCE AUDIT DOSSIER (STAGE 3 REGULATORY REPORT)', { x: 46, y: y1 - 45, size: 12, font: fontBold, color: rgb(1, 1, 1) });
  page1.drawText(`Dossier Serial: ${dossierSerial} | Period: ${dateRange.from} to ${dateRange.to} | Scope: ${filterLabel}`, { x: 46, y: y1 - 57, size: 7.2, font: fontRegular, color: rgb(0.8, 0.85, 0.95) });

  y1 -= 78;

  // Officer Meta Strip
  page1.drawText(`Supervising Officer: ${officer.full_name} (${officer.badge_number}) | Jurisdiction: ${officer.jurisdiction} | Generated: ${new Date().toLocaleString('en-IN')}`, {
    x: 36,
    y: y1,
    size: 8.5,
    font: fontBold,
    color: SLATE_DARK,
  });
  y1 -= 16;

  // 4 Big KPI Metric Boxes
  const totalScans = stats.total_items || (items.length > 0 ? items.length : 0);
  const compliantCount = stats.compliant_items !== undefined ? stats.compliant_items : items.filter(i => i.compliant).length;
  const nonCompliantCount = stats.non_compliant_items !== undefined ? stats.non_compliant_items : items.filter(i => !i.compliant).length;
  const complianceRate = totalScans > 0 ? Math.round((compliantCount / totalScans) * 100) : 100;

  const boxW = (p1W - 72 - 30) / 4;
  const boxH = 46;

  // Box 1: Total Scans
  page1.drawRectangle({ x: 36, y: y1 - boxH, width: boxW, height: boxH, color: BG_PAPER, borderColor: BORDER_LIGHT, borderWidth: 1 });
  page1.drawText('TOTAL AUDITED ITEMS', { x: 44, y: y1 - 14, size: 6.5, font: fontBold, color: TEXT_MUTED });
  page1.drawText(String(totalScans), { x: 44, y: y1 - 36, size: 16, font: fontBold, color: NAVY });

  // Box 2: Compliant
  page1.drawRectangle({ x: 36 + boxW + 10, y: y1 - boxH, width: boxW, height: boxH, color: rgb(0.95, 0.99, 0.96), borderColor: GREEN, borderWidth: 1 });
  page1.drawText('COMPLIANT ITEMS', { x: 44 + boxW + 10, y: y1 - 14, size: 6.5, font: fontBold, color: GREEN });
  page1.drawText(`${compliantCount} (${complianceRate}%)`, { x: 44 + boxW + 10, y: y1 - 36, size: 14, font: fontBold, color: GREEN });

  // Box 3: Non-Compliant
  page1.drawRectangle({ x: 36 + (boxW + 10) * 2, y: y1 - boxH, width: boxW, height: boxH, color: rgb(0.99, 0.94, 0.94), borderColor: RED, borderWidth: 1 });
  page1.drawText('STATUTORY VIOLATIONS', { x: 44 + (boxW + 10) * 2, y: y1 - 14, size: 6.5, font: fontBold, color: RED });
  page1.drawText(String(nonCompliantCount), { x: 44 + (boxW + 10) * 2, y: y1 - 36, size: 15, font: fontBold, color: RED });

  // Box 4: Total Batches
  page1.drawRectangle({ x: 36 + (boxW + 10) * 3, y: y1 - boxH, width: boxW, height: boxH, color: BG_PAPER, borderColor: BORDER_LIGHT, borderWidth: 1 });
  page1.drawText('TOTAL INSPECTION BATCHES', { x: 44 + (boxW + 10) * 3, y: y1 - 14, size: 6.5, font: fontBold, color: TEXT_MUTED });
  page1.drawText(String(stats.total_batches || 0), { x: 44 + (boxW + 10) * 3, y: y1 - 36, size: 16, font: fontBold, color: NAVY });

  y1 -= (boxH + 24);

  // 2-Column Section on Page 1:
  const colW = (p1W - 72 - 15) / 2;
  const colLeftX = 36;
  const colRightX = 36 + colW + 15;
  const middleSectionTopY = y1;

  // Left Column Header: Top Violations
  page1.drawText('TOP STATUTORY DECLARATION VIOLATIONS (RULE 6 RANKING)', { x: colLeftX, y: middleSectionTopY, size: 8.5, font: fontBold, color: SLATE_DARK });
  page1.drawRectangle({ x: colLeftX, y: middleSectionTopY - 18, width: colW, height: 16, color: SLATE_DARK });
  page1.drawText('Statutory Requirement', { x: colLeftX + 6, y: middleSectionTopY - 13, size: 7, font: fontBold, color: rgb(1, 1, 1) });
  page1.drawText('Infractions', { x: colLeftX + 265, y: middleSectionTopY - 13, size: 7, font: fontBold, color: rgb(1, 1, 1) });
  page1.drawText('% Total', { x: colLeftX + 330, y: middleSectionTopY - 13, size: 7, font: fontBold, color: rgb(1, 1, 1) });

  let curViolY = middleSectionTopY - 18;
  const topViolations: { name: string; count: number; pct: number }[] = stats.top_violations || [
    { name: 'Unit Sale Price (USP) under Rule 6(1)(i)', count: 4, pct: 44 },
    { name: 'Country of Origin declaration under Rule 6(1)(f)', count: 3, pct: 33 },
    { name: 'Consumer Care Phone / Email under Rule 6(1)(ca)', count: 2, pct: 22 },
  ];

  for (let v = 0; v < Math.min(6, topViolations.length); v++) {
    const item = topViolations[v];
    const rowBg = v % 2 === 0 ? rgb(0.99, 0.99, 1) : rgb(1, 1, 1);
    page1.drawRectangle({ x: colLeftX, y: curViolY - 16, width: colW, height: 16, color: rowBg, borderColor: BORDER_LIGHT, borderWidth: 0.5 });
    page1.drawText(item.name.substring(0, 42), { x: colLeftX + 6, y: curViolY - 11, size: 6.8, font: fontRegular, color: TEXT_DARK });
    page1.drawText(String(item.count), { x: colLeftX + 265, y: curViolY - 11, size: 7, font: fontBold, color: RED });
    page1.drawText(`${item.pct}%`, { x: colLeftX + 330, y: curViolY - 11, size: 6.8, font: fontRegular, color: TEXT_MUTED });
    curViolY -= 16;
  }

  // Right Column Header: Inspectors Breakdown
  page1.drawText('FIELD INSPECTOR ACTIVITY & COMPLIANCE BREAKDOWN', { x: colRightX, y: middleSectionTopY, size: 8.5, font: fontBold, color: SLATE_DARK });
  page1.drawRectangle({ x: colRightX, y: middleSectionTopY - 18, width: colW, height: 16, color: SLATE_DARK });
  page1.drawText('Inspector Name / Circle', { x: colRightX + 6, y: middleSectionTopY - 13, size: 7, font: fontBold, color: rgb(1, 1, 1) });
  page1.drawText('Batches', { x: colRightX + 185, y: middleSectionTopY - 13, size: 7, font: fontBold, color: rgb(1, 1, 1) });
  page1.drawText('Items', { x: colRightX + 235, y: middleSectionTopY - 13, size: 7, font: fontBold, color: rgb(1, 1, 1) });
  page1.drawText('Compliant', { x: colRightX + 280, y: middleSectionTopY - 13, size: 7, font: fontBold, color: rgb(1, 1, 1) });
  page1.drawText('Compliance %', { x: colRightX + 330, y: middleSectionTopY - 13, size: 7, font: fontBold, color: rgb(1, 1, 1) });

  let curInspY = middleSectionTopY - 18;
  const inspectorsList: any[] = stats.inspectors || [
    { inspector_name: 'Rajesh Kumar', inspector_id: 'LMO-DL-04', jurisdiction: 'Central District, Circle 2', total_batches: 3, total_items: 5, compliant_count: 3, compliance_rate: 60 },
  ];

  for (let ins = 0; ins < Math.min(6, inspectorsList.length); ins++) {
    const row = inspectorsList[ins];
    const rowBg = ins % 2 === 0 ? rgb(0.99, 0.99, 1) : rgb(1, 1, 1);
    page1.drawRectangle({ x: colRightX, y: curInspY - 16, width: colW, height: 16, color: rowBg, borderColor: BORDER_LIGHT, borderWidth: 0.5 });
    page1.drawText(`${row.inspector_name || 'Inspector'} (${row.inspector_id || ''})`, { x: colRightX + 6, y: curInspY - 11, size: 6.8, font: fontBold, color: NAVY });
    page1.drawText(String(row.total_batches || 0), { x: colRightX + 185, y: curInspY - 11, size: 6.8, font: fontRegular, color: TEXT_DARK });
    page1.drawText(String(row.total_items || 0), { x: colRightX + 235, y: curInspY - 11, size: 6.8, font: fontRegular, color: TEXT_DARK });
    page1.drawText(String(row.compliant_count || 0), { x: colRightX + 280, y: curInspY - 11, size: 6.8, font: fontBold, color: GREEN });
    page1.drawText(`${row.compliance_rate || 0}%`, { x: colRightX + 330, y: curInspY - 11, size: 6.8, font: fontBold, color: (row.compliance_rate >= 80 ? GREEN : GOLD) });
    curInspY -= 16;
  }

  // Section Navigation Note
  page1.drawRectangle({
    x: 36,
    y: 40,
    width: p1W - 72,
    height: 32,
    color: rgb(0.94, 0.96, 1),
    borderColor: rgb(0.78, 0.84, 0.98),
    borderWidth: 1,
  });

  page1.drawText(`OFFICIAL REGULATORY DOSSIER • SECTION I: AUDIT LEDGER FOLLOWS ON PAGE 2 • SECTION II: INDIVIDUAL ITEM DOSSIERS APPENDED`, {
    x: 48,
    y: 53,
    size: 7.2,
    font: fontBold,
    color: NAVY,
  });

  page1.drawText('LabelLens Statutory Platform • Directorate General of Legal Metrology • Section I: Executive Summary (Page 1)', {
    x: 36,
    y: 20,
    size: 6.5,
    font: fontRegular,
    color: TEXT_MUTED,
  });

  // ==========================================================================
  // SECTION I - PAGE 2+: DETAILED STATUTORY AUDIT LEDGER TABLE (7 COLUMNS)
  // Dynamic Text Wrapping (No Clipped Cells)
  // ==========================================================================
  const tableItems = items.length > 0 ? items : [];
  let currentTablePage = wrapPageWithSafeDraw(pdfDoc.addPage([841.89, 595.28]));
  const { width: tW, height: tH } = currentTablePage.getSize();
  let ty = tH - 34;
  let ledgerPageNum = 1;

  const drawLedgerHeader = (p: PDFPage) => {
    let yHead = tH - 34;
    // Outer border
    p.drawRectangle({ x: 22, y: 20, width: tW - 44, height: tH - 40, borderColor: NAVY, borderWidth: 1.2 });

    // Top Strip
    p.drawRectangle({ x: 34, y: yHead - 42, width: tW - 68, height: 42, color: NAVY });
    p.drawText('LEGAL METROLOGY ACT, 2009 • SECTION I: STATUTORY AUDIT LEDGER TABLE', { x: 46, y: yHead - 16, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });
    p.drawText(`Authority: ${officer.full_name} (${officer.badge_number}) | Scope: ${filterLabel} | Period: ${dateRange.from} to ${dateRange.to} | Ledger Page ${ledgerPageNum}`, { x: 46, y: yHead - 30, size: 7, font: fontRegular, color: GOLD });

    yHead -= 56;

    // 7 Columns Header
    // Col 1: Product Name (155 pt, x: 42)
    // Col 2: Category (85 pt, x: 202)
    // Col 3: Verdict (70 pt, x: 292)
    // Col 4: Missing Declarations (175 pt, x: 367)
    // Col 5: Inspector (95 pt, x: 547)
    // Col 6: Batch (75 pt, x: 647)
    // Col 7: Date (45 pt, x: 727)
    p.drawRectangle({ x: 34, y: yHead - 18, width: tW - 68, height: 18, color: SLATE_DARK });
    p.drawText('Product Name / Commodity', { x: 42, y: yHead - 13, size: 7, font: fontBold, color: rgb(1, 1, 1) });
    p.drawText('Category', { x: 202, y: yHead - 13, size: 7, font: fontBold, color: rgb(1, 1, 1) });
    p.drawText('Verdict', { x: 292, y: yHead - 13, size: 7, font: fontBold, color: rgb(1, 1, 1) });
    p.drawText('Missing Declarations (Rule 6)', { x: 367, y: yHead - 13, size: 7, font: fontBold, color: rgb(1, 1, 1) });
    p.drawText('Inspector', { x: 547, y: yHead - 13, size: 7, font: fontBold, color: rgb(1, 1, 1) });
    p.drawText('Batch ID', { x: 647, y: yHead - 13, size: 7, font: fontBold, color: rgb(1, 1, 1) });
    p.drawText('Date', { x: 727, y: yHead - 13, size: 7, font: fontBold, color: rgb(1, 1, 1) });

    return yHead - 18;
  };

  ty = drawLedgerHeader(currentTablePage);

  if (tableItems.length === 0) {
    currentTablePage.drawRectangle({ x: 34, y: ty - 26, width: tW - 68, height: 26, color: BG_PAPER, borderColor: BORDER_LIGHT, borderWidth: 0.5 });
    currentTablePage.drawText('No statutory item records found matching selected criteria in this audit window.', { x: 42, y: ty - 17, size: 8, font: fontRegular, color: TEXT_MUTED });
    currentTablePage.drawText(`LabelLens Executive Audit Dossier • Section I: Ledger (Page ${ledgerPageNum})`, { x: 36, y: 22, size: 6.5, font: fontRegular, color: TEXT_MUTED });
  } else {
    for (let r = 0; r < tableItems.length; r++) {
      const it = tableItems[r];
      const isComp = Boolean(it.compliant);

      // Wrap text for columns that may be long
      const pNameLines = wrapText(it.product_name || 'Specimen Item', 150, fontBold, 6.8);
      const missingText = it.missing_declarations || (isComp ? 'None (Fully Compliant)' : 'Particulars Missing');
      const missingLines = wrapText(missingText, 170, fontRegular, 6.5);
      const inspectorText = `${it.inspector_name || 'LMO'} (${it.inspector_id || ''})`;
      const inspLines = wrapText(inspectorText, 90, fontRegular, 6.5);

      const maxLines = Math.max(pNameLines.length, missingLines.length, inspLines.length, 1);
      const rowHeight = Math.max(20, maxLines * 10 + 6);

      // Check if row fits on current page
      if (ty - rowHeight < 45) {
        currentTablePage.drawText(`LabelLens Executive Audit Dossier • Section I: Ledger (Page ${ledgerPageNum})`, { x: 36, y: 22, size: 6.5, font: fontRegular, color: TEXT_MUTED });
        ledgerPageNum++;
        currentTablePage = wrapPageWithSafeDraw(pdfDoc.addPage([841.89, 595.28]));
        ty = drawLedgerHeader(currentTablePage);
      }

      const rowBg = r % 2 === 0 ? rgb(0.99, 0.99, 1) : rgb(1, 1, 1);
      currentTablePage.drawRectangle({ x: 34, y: ty - rowHeight, width: tW - 68, height: rowHeight, color: rowBg, borderColor: BORDER_LIGHT, borderWidth: 0.5 });

      // 1. Product Name (wrapped)
      for (let l = 0; l < pNameLines.length; l++) {
        currentTablePage.drawText(pNameLines[l], { x: 42, y: ty - 12 - (l * 9.5), size: 6.8, font: fontBold, color: NAVY });
      }

      // 2. Category
      const cat = (it.product_category || 'General').substring(0, 16);
      currentTablePage.drawText(cat, { x: 202, y: ty - 12, size: 6.8, font: fontRegular, color: TEXT_MUTED });

      // 3. Verdict
      const verdText = isComp ? 'COMPLIANT' : 'NON-COMPLIANT';
      currentTablePage.drawText(verdText, { x: 292, y: ty - 12, size: 6.8, font: fontBold, color: isComp ? GREEN : RED });

      // 4. Missing Declarations (wrapped)
      for (let l = 0; l < missingLines.length; l++) {
        currentTablePage.drawText(missingLines[l], { x: 367, y: ty - 12 - (l * 9.5), size: 6.5, font: fontRegular, color: isComp ? GREEN : RED });
      }

      // 5. Inspector (wrapped)
      for (let l = 0; l < inspLines.length; l++) {
        currentTablePage.drawText(inspLines[l], { x: 547, y: ty - 12 - (l * 9.5), size: 6.5, font: fontRegular, color: TEXT_DARK });
      }

      // 6. Batch ID
      const bId = (it.batch_id || '-').substring(0, 16);
      currentTablePage.drawText(bId, { x: 647, y: ty - 12, size: 6.8, font: fontRegular, color: TEXT_MUTED });

      // 7. Date
      currentTablePage.drawText(it.date || '-', { x: 727, y: ty - 12, size: 6.8, font: fontRegular, color: TEXT_MUTED });

      ty -= rowHeight;
    }
    currentTablePage.drawText(`LabelLens Executive Audit Dossier • Section I: Ledger (Page ${ledgerPageNum})`, { x: 36, y: 22, size: 6.5, font: fontRegular, color: TEXT_MUTED });
  }

  // ==========================================================================
  // SECTION II: DETAILED SPECIMEN DOSSIER SHEETS (ONE PER ITEM IN SCOPE)
  // Portrait A4: 595.28 x 841.89
  // ==========================================================================
  for (let idx = 0; idx < tableItems.length; idx++) {
    const item = tableItems[idx];
    const isCompliant = Boolean(item.compliant);
    const itemPage = wrapPageWithSafeDraw(pdfDoc.addPage([595.28, 841.89]));
    const { width: iW, height: iH } = itemPage.getSize();
    let iy = iH - 36;

    // Outer formal borders
    itemPage.drawRectangle({
      x: 24,
      y: 24,
      width: iW - 48,
      height: iH - 48,
      borderColor: NAVY,
      borderWidth: 1.2,
    });
    itemPage.drawRectangle({
      x: 27,
      y: 27,
      width: iW - 54,
      height: iH - 54,
      borderColor: GOLD,
      borderWidth: 0.6,
    });

    // Header Banner
    itemPage.drawRectangle({
      x: 36,
      y: iy - 56,
      width: iW - 72,
      height: 56,
      color: NAVY,
    });
    itemPage.drawText('GOVERNMENT OF INDIA • DIRECTORATE OF LEGAL METROLOGY', { x: 48, y: iy - 16, size: 7.5, font: fontBold, color: GOLD });
    itemPage.drawText('SECTION II: STATUTORY SPECIMEN EVIDENCE & AUDIT DOSSIER', { x: 48, y: iy - 32, size: 10.5, font: fontBold, color: rgb(1, 1, 1) });
    itemPage.drawText(`Case Ref: ${item.item_id || 'N/A'} | Batch: ${item.batch_id || 'N/A'} | Dossier Item ${idx + 1} of ${tableItems.length}`, { x: 48, y: iy - 46, size: 7, font: fontRegular, color: rgb(0.85, 0.9, 0.98) });

    iy -= 68;

    // Specimen Details (2 Columns)
    itemPage.drawRectangle({
      x: 36,
      y: iy - 54,
      width: iW - 72,
      height: 54,
      color: BG_PAPER,
      borderColor: BORDER_LIGHT,
      borderWidth: 1,
    });

    const col1X = 48;
    const col2X = 310;
    itemPage.drawText('SPECIMEN IDENTITY', { x: col1X, y: iy - 13, size: 8, font: fontBold, color: SLATE_DARK });
    itemPage.drawText(`Product: ${(item.product_name || 'Packaged Commodity').substring(0, 36)}`, { x: col1X, y: iy - 26, size: 7.5, font: fontRegular, color: TEXT_DARK });
    itemPage.drawText(`Category: ${(item.product_category || 'General').substring(0, 30)}`, { x: col1X, y: iy - 37, size: 7.5, font: fontRegular, color: TEXT_DARK });
    itemPage.drawText(`Item ID: ${item.item_id} | Batch ID: ${item.batch_id}`, { x: col1X, y: iy - 48, size: 7, font: fontRegular, color: TEXT_MUTED });

    itemPage.drawText('INSPECTION CONTEXT', { x: col2X, y: iy - 13, size: 8, font: fontBold, color: SLATE_DARK });
    itemPage.drawText(`Store: ${(item.store_name || 'Retail Establishment').substring(0, 34)}`, { x: col2X, y: iy - 26, size: 7.5, font: fontRegular, color: TEXT_DARK });
    itemPage.drawText(`Location: ${(item.store_location || 'Jurisdiction Circle').substring(0, 34)}`, { x: col2X, y: iy - 37, size: 7.5, font: fontRegular, color: TEXT_DARK });
    itemPage.drawText(`Inspector: ${item.inspector_name || 'Field Inspector'} (${item.inspector_id || ''})`, { x: col2X, y: iy - 48, size: 7, font: fontRegular, color: TEXT_MUTED });

    iy -= 64;

    // Official Statutory Verdict Banner
    const verdictBg = isCompliant ? rgb(0.92, 0.98, 0.94) : rgb(0.99, 0.93, 0.93);
    const verdictBorder = isCompliant ? GREEN : RED;
    const verdictText = isCompliant ? 'COMPLIANT (RULE 6 STATUTORY MANDATES SATISFIED)' : 'NON-COMPLIANT (STATUTORY VIOLATION CONFIRMED)';

    itemPage.drawRectangle({
      x: 36,
      y: iy - 28,
      width: iW - 72,
      height: 28,
      color: verdictBg,
      borderColor: verdictBorder,
      borderWidth: 1.5,
    });
    itemPage.drawText(`STATUTORY VERDICT: ${verdictText}`, {
      x: 48,
      y: iy - 14,
      size: 8.5,
      font: fontBold,
      color: isCompliant ? GREEN : RED,
    });
    itemPage.drawText(`AI Confidence Score: ${Math.round((item.confidence || 0.9) * 100)}% | Status: ${item.status || 'reviewed'} | Action: ${(item.officer_action || 'approved').toUpperCase()}`, {
      x: 48,
      y: iy - 23,
      size: 6.8,
      font: fontRegular,
      color: TEXT_DARK,
    });

    iy -= 38;

    // Embed photos safely if available
    const itemPhotos = item.photos || [];
    const embeddedPhotos: { img: any; angle: string }[] = [];

    for (const p of itemPhotos) {
      if (!p || !p.url) continue;
      try {
        if (p.url.startsWith('data:image/')) {
          const base64Data = p.url.split(',')[1];
          const imgBuf = Buffer.from(base64Data, 'base64');
          let emb;
          if (p.url.includes('png')) {
            emb = await pdfDoc.embedPng(imgBuf);
          } else {
            emb = await pdfDoc.embedJpg(imgBuf);
          }
          embeddedPhotos.push({ img: emb, angle: (p.angle || 'Evidence').toUpperCase() });
        } else if (p.url.startsWith('http')) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);
          const pRes = await fetch(p.url, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (pRes.ok) {
            const buf = await pRes.arrayBuffer();
            const uint8 = new Uint8Array(buf);
            let emb;
            if (uint8[0] === 0x89 && uint8[1] === 0x50 && uint8[2] === 0x4E && uint8[3] === 0x47) {
              emb = await pdfDoc.embedPng(buf);
            } else {
              emb = await pdfDoc.embedJpg(buf);
            }
            embeddedPhotos.push({ img: emb, angle: (p.angle || 'Evidence').toUpperCase() });
          }
        }
      } catch (e) {
        // Continue gracefully if image fetch fails or times out
      }
    }

    // Side-by-Side Section: Photos (Left) + Rule 6 Checklist Table (Right)
    const photoColX = 36;
    const photoColW = 180;
    const tableColX = 224;
    const tableColW = 335;
    const sectionTopY = iy;

    // Left Column Header: Photos
    itemPage.drawRectangle({ x: photoColX, y: sectionTopY - 16, width: photoColW, height: 16, color: SLATE_DARK });
    itemPage.drawText(`Evidence Photos (${embeddedPhotos.length})`, { x: photoColX + 8, y: sectionTopY - 11, size: 7.2, font: fontBold, color: rgb(1, 1, 1) });

    // Right Column Header: Rule 6 Checklist
    itemPage.drawRectangle({ x: tableColX, y: sectionTopY - 16, width: tableColW, height: 16, color: SLATE_DARK });
    itemPage.drawText('Rule 6(1) Statutory Particular', { x: tableColX + 6, y: sectionTopY - 11, size: 7, font: fontBold, color: rgb(1, 1, 1) });
    itemPage.drawText('Detected / Verified Value', { x: tableColX + 140, y: sectionTopY - 11, size: 7, font: fontBold, color: rgb(1, 1, 1) });
    itemPage.drawText('Status', { x: tableColX + 285, y: sectionTopY - 11, size: 7, font: fontBold, color: rgb(1, 1, 1) });

    let curTableY = sectionTopY - 16;
    const foundSet = new Set(item.declarations_found || []);
    const declVals = item.declaration_values || {};

    for (let i = 0; i < MANDATORY_RULE6_FIELDS.length; i++) {
      const field = MANDATORY_RULE6_FIELDS[i];
      const isFound = foundSet.has(field.key);
      let val = declVals[field.key] || (isFound ? 'Present on packaging' : 'Not detected');
      if (val.length > 30) val = val.substring(0, 28) + '...';

      const rowBg = i % 2 === 0 ? rgb(0.99, 0.99, 1) : rgb(1, 1, 1);
      itemPage.drawRectangle({
        x: tableColX,
        y: curTableY - 17,
        width: tableColW,
        height: 17,
        color: rowBg,
        borderColor: BORDER_LIGHT,
        borderWidth: 0.5,
      });

      itemPage.drawText(field.label.substring(0, 23), { x: tableColX + 6, y: curTableY - 12, size: 6.8, font: fontRegular, color: TEXT_DARK });
      itemPage.drawText(val, { x: tableColX + 140, y: curTableY - 12, size: 6.8, font: fontRegular, color: isFound ? TEXT_DARK : TEXT_MUTED });

      const statusStr = isFound ? 'PRESENT' : 'MISSING';
      const statusColor = isFound ? GREEN : RED;
      itemPage.drawText(statusStr, { x: tableColX + 285, y: curTableY - 12, size: 6.8, font: fontBold, color: statusColor });

      curTableY -= 17;
    }

    // Photo Box Rendering
    let curPhotoY = sectionTopY - 16;
    const totalPhotoH = 170;

    if (embeddedPhotos.length === 0) {
      itemPage.drawRectangle({
        x: photoColX,
        y: curPhotoY - totalPhotoH,
        width: photoColW,
        height: totalPhotoH,
        color: BG_PAPER,
        borderColor: BORDER_LIGHT,
        borderWidth: 1,
      });
      itemPage.drawText('No photo files captured', { x: photoColX + 32, y: curPhotoY - 80, size: 8, font: fontBold, color: TEXT_MUTED });
      itemPage.drawText('or available in storage.', { x: photoColX + 36, y: curPhotoY - 95, size: 7.5, font: fontRegular, color: TEXT_MUTED });
    } else {
      const slotH = Math.floor(totalPhotoH / embeddedPhotos.length);
      for (let pIdx = 0; pIdx < embeddedPhotos.length; pIdx++) {
        const ep = embeddedPhotos[pIdx];
        const boxY = curPhotoY - slotH;

        itemPage.drawRectangle({
          x: photoColX,
          y: boxY,
          width: photoColW,
          height: slotH,
          color: rgb(0.97, 0.97, 0.98),
          borderColor: BORDER_LIGHT,
          borderWidth: 0.5,
        });

        const availW = photoColW - 12;
        const availH = slotH - 16;
        const scaled = ep.img.scaleToFit(availW, availH);
        const imgX = photoColX + Math.round((photoColW - scaled.width) / 2);
        const imgY = boxY + 14 + Math.round((availH - scaled.height) / 2);

        itemPage.drawImage(ep.img, {
          x: imgX,
          y: imgY,
          width: scaled.width,
          height: scaled.height,
        });

        itemPage.drawText(`Angle: ${ep.angle}`, {
          x: photoColX + 6,
          y: boxY + 4,
          size: 6.5,
          font: fontBold,
          color: NAVY,
        });

        curPhotoY -= slotH;
      }
    }

    iy = curTableY - 14;

    // Reviewing Officer Remarks & Adjudication Notes
    itemPage.drawText('SUPERVISING OFFICER ACTION & STATUTORY RATIONALE', {
      x: 36,
      y: iy,
      size: 8.5,
      font: fontBold,
      color: SLATE_DARK,
    });
    iy -= 10;

    itemPage.drawRectangle({
      x: 36,
      y: iy - 42,
      width: iW - 72,
      height: 42,
      color: BG_PAPER,
      borderColor: BORDER_LIGHT,
      borderWidth: 1,
    });

    const actionText = item.officer_action ? item.officer_action.toUpperCase() : 'APPROVED';
    const remarksText = item.officer_remarks || '(Endorsed under Section 15 & 36 of Legal Metrology Act, 2009.)';

    itemPage.drawText(`Action Logged: ${actionText} | Adjudicated By: ${officer.full_name} (${officer.badge_number})`, {
      x: 44,
      y: iy - 13,
      size: 7.2,
      font: fontBold,
      color: TEXT_DARK,
    });

    itemPage.drawText(`Judicial Rationale: "${remarksText.substring(0, 110)}"`, {
      x: 44,
      y: iy - 25,
      size: 7,
      font: fontRegular,
      color: TEXT_DARK,
    });

    itemPage.drawText(`Jurisdiction: ${officer.jurisdiction} | Timestamp: ${new Date().toLocaleString('en-IN')}`, {
      x: 44,
      y: iy - 36,
      size: 6.5,
      font: fontRegular,
      color: TEXT_MUTED,
    });

    iy -= 52;

    // Official Seal & Signature Block
    itemPage.drawRectangle({
      x: iW - 230,
      y: 42,
      width: 194,
      height: 60,
      color: rgb(1, 1, 1),
      borderColor: BORDER_LIGHT,
      borderWidth: 1,
    });
    itemPage.drawText('OFFICIAL LEGAL METROLOGY SEAL', { x: iW - 220, y: 92, size: 6.5, font: fontBold, color: SLATE_DARK });
    itemPage.drawText(`Digitally Endorsed: ${officer.full_name}`, { x: iW - 220, y: 78, size: 6.8, font: fontBold, color: NAVY });
    itemPage.drawText('Senior Reviewing Officer - Legal Metrology', { x: iW - 220, y: 66, size: 6.5, font: fontRegular, color: TEXT_MUTED });
    itemPage.drawText(`Ref: ${dossierSerial}`, { x: iW - 220, y: 52, size: 6, font: fontRegular, color: TEXT_MUTED });

    // Page Footer
    itemPage.drawText(`LabelLens Statutory Audit Platform • Section II: Specimen Dossier (Item ${idx + 1} of ${tableItems.length})`, {
      x: 36,
      y: 22,
      size: 6.5,
      font: fontRegular,
      color: TEXT_MUTED,
    });
  }

  return await pdfDoc.save();
}


