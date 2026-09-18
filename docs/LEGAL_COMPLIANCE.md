# LabelLens: Legal & Statutory Compliance Guide

This document specifies the statutory framework, regulatory requirements, exemption rules, and penalty structures codified within the LabelLens compliance engine, in adherence to the **Legal Metrology Act, 2009** and the **Legal Metrology (Packaged Commodities) Rules, 2011 (PC Rules, 2011)**.

---

## 🏛️ Statutory Foundation

### 1. Legal Metrology Act, 2009 (Act No. 1 of 2010)
- **Section 18(1)**: No person shall manufacture, pack, sell, distribute, deliver, offer, expose or possess for sale any pre-packaged commodity unless such package bears thereon statements or declarations as may be prescribed.
- **Section 36(1)**: Penalty for manufacture, packing, or selling non-standard packages:
  - **First Offence**: Fine which may extend to **₹25,000**.
  - **Second Offence**: Fine which may extend to **₹50,000**.
  - **Subsequent Offences**: Fine of **₹50,000 to ₹1,00,000** or imprisonment up to **one year**, or both.
- **Section 49**: Corporate offences and statutory compounding provisions. Authorized controllers may compound specified offences prior to trial prosecution under prescribed compounding fees.

---

## 📋 Rule 6: Mandatory Package Declarations

Rule 6 of the Legal Metrology (Packaged Commodities) Rules, 2011 requires every pre-packaged commodity to bear the following 10 statutory declarations on its Principal Display Panel (PDP) or information panels:

| # | Statutory Clause | Required Declaration | Compliance Criteria | Exemption Rule (Display Standard) |
| :-: | :--- | :--- | :--- | :--- |
| **1** | Rule 6(1)(a) | **Manufacturer / Packer / Importer** | Complete legal name and physical address. Must include pin code and premises details. | None. Mandatory for all packages. |
| **2** | Rule 6(1)(aa) | **Country of Origin** | Mandatory for imported goods (e.g., "Country of Origin: USA"). | **Conditionally Exempt**: Domestically manufactured commodities are exempt. Displays strictly as **`Not Applicable`**. |
| **3** | Rule 6(1)(b) | **Common / Generic Name** | Recognizable generic name of commodity inside the package (e.g., "Iodized Salt", "Wheat Flour"). | None. Mandatory for all packages. |
| **4** | Rule 6(1)(c) | **Net Quantity** | Expressed in standard metric units: mass (g, kg), liquid volume (ml, l), or numeric count (units). | None. Mandatory for all packages. |
| **5** | Rule 6(1)(d) | **Month & Year of Manufacture** | Month and year in which commodity is manufactured, pre-packed, or imported (e.g., `03/2026`). | None. Mandatory for all packages. |
| **6** | Rule 6(1)(da) | **Best Before / Expiry Date** | Clear expiry or best before declaration for perishable commodities, cosmetics, and foods. | Exempt for commodities not subject to spoilage or where statutory rules omit expiry requirements. |
| **7** | Rule 6(1)(e) | **Maximum Retail Price (MRP)** | Inclusive of all statutory taxes. Must follow format: `₹ XX.XX (Incl. of all taxes)`. | None. Mandatory for all packages sold at retail. |
| **8** | Rule 6(1)(h) | **Unit Sale Price (USP)** | Price per standard unit: ₹ per g, per kg, per ml, per l, or per piece. | **Conditionally Exempt**: Single-unit packages (Net Qty = 1 unit) are exempt under Rule 6(1)(h). Displays strictly as **`Not Applicable`**. |
| **9** | Rule 6(1)(n) | **Dimensions of Commodity** | Linear dimensions (L x W x H) or size measurements. | **Conditionally Exempt**: Commodities sold strictly by net weight or volume are exempt. Displays strictly as **`Not Applicable`**. |
| **10** | Rule 6(1)(f) | **Consumer Care Details** | Name, full address, direct phone number, and email address for consumer grievances. | None. Mandatory for all retail packaging. |

---

## 🔍 Exemption Handling Standard

To prevent inspector and officer ambiguity during fast field audits, LabelLens enforces a strict text standardization rule:
Whenever a declaration is conditionally exempt (Country of Origin for domestic goods, Unit Sale Price for single-item packages, or Dimensions for weight/volume items), the system formats the display across all interfaces as:

```text
Not Applicable
```

This text is rendered consistently in:
1. Field Inspector's Declaration Editor (`inspector.js`)
2. Senior Reviewing Officer's Rule 6 Audit Checklist (`officer.js`)
3. Single-Item Statutory PDF Inspection Certificates (`pdf.ts`)
4. Multi-Item Aggregate Batch Dossiers (`pdf.ts`)

---

## 📏 Principal Display Panel (PDP) & Character Height Standards

Under **Rules 7 and 8** of the PC Rules, 2011, declarations must be legible and meet minimum font heights based on the area of the Principal Display Panel:

| Area of Principal Display Panel ($A$) | Minimum Height (Normal Case) | Minimum Height (Blown/Molded/Perforated) |
| :--- | :---: | :---: |
| $A \le 50\text{ cm}^2$ | **1.0 mm** | **2.0 mm** |
| $50\text{ cm}^2 < A \le 100\text{ cm}^2$ | **1.5 mm** | **3.0 mm** |
| $100\text{ cm}^2 < A \le 500\text{ cm}^2$ | **2.0 mm** | **4.0 mm** |
| $500\text{ cm}^2 < A \le 2500\text{ cm}^2$ | **4.0 mm** | **6.0 mm** |
| $A > 2500\text{ cm}^2$ | **6.0 mm** | **10.0 mm** |

---

## ⚖️ Adjudication Actions & Notice Issuance

Under judicial review in `/officer.html`, the Senior Reviewing Officer selects one of four statutory determination actions:

1. **Approve As-Is**: Endorses the inspector's findings. If non-compliant, automatically calculates recommended compounding fees under Section 36(1).
2. **Override Verdict**: Reverses the algorithm or inspector's determination. Requires mandatory judicial reasoning committed to the permanent ledger.
3. **Send Back for Recapture**: Rejects blurred or incomplete photographic evidence, transmitting a priority retake notification to the mobile field inspector.
4. **Correct & Remark**: Adjusts misread characters or values while retaining an audit trail of the original field capture.

### Statutory Form II Notice Generation
Upon finalizing an inspection dossier with detected violations, the system generates an official **Form II Notice of Violation** under the Legal Metrology Rules, embedding:
- Inspection session identification and GPS location
- High-resolution photographic exhibits (Front, Back, Sides)
- Clause-by-clause Rule 6 audit checklist with detected contraventions
- Statutory notice to show cause within 15 days under Section 18/36
- Digital stamp and verification badge of the inspecting Legal Metrology Officer
