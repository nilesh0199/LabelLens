document.addEventListener('DOMContentLoaded', () => {
  // Auto-detect environment: Direct backend locally, or relative path on Vercel
  const API_BASE_URL = (window.location.protocol === 'file:')
    ? 'http://localhost:3000'
    : (window.__LABEL_LENS_API__ || '');

  // Role Switcher & Navigation Tabs
  const activeRoleSelect = document.getElementById('activeRoleSelect');
  const tabInspector = document.getElementById('tabInspector');
  const tabOfficer = document.getElementById('tabOfficer');
  const tabCheck = document.getElementById('tabCheck');
  const tabHistory = document.getElementById('tabHistory');
  const viewInspector = document.getElementById('viewInspector');
  const viewOfficer = document.getElementById('viewOfficer');
  const viewCheck = document.getElementById('viewCheck');
  const viewHistory = document.getElementById('viewHistory');
  const officerPendingBadge = document.getElementById('officerPendingBadge');
  const historyBadge = document.getElementById('historyBadge');
  const systemStatus = document.getElementById('systemStatus');

  // Senior Officer DOM Elements
  const btnRefreshOfficerDashboard = document.getElementById('btnRefreshOfficerDashboard');
  const kpiOfficerPendingBatches = document.getElementById('kpiOfficerPendingBatches');
  const kpiOfficerPendingItems = document.getElementById('kpiOfficerPendingItems');
  const kpiOfficerApprovedItems = document.getElementById('kpiOfficerApprovedItems');
  const kpiOfficerOverriddenItems = document.getElementById('kpiOfficerOverriddenItems');
  const officerInboxCard = document.getElementById('officerInboxCard');
  const officerBatchStatusFilter = document.getElementById('officerBatchStatusFilter');
  const officerQueueTableBody = document.getElementById('officerQueueTableBody');
  const officerWorkbenchCard = document.getElementById('officerWorkbenchCard');
  const btnBackToOfficerInbox = document.getElementById('btnBackToOfficerInbox');
  const workbenchBatchId = document.getElementById('workbenchBatchId');
  const workbenchEstablishment = document.getElementById('workbenchEstablishment');
  const workbenchBatchStatusPill = document.getElementById('workbenchBatchStatusPill');
  const workbenchStatsSummary = document.getElementById('workbenchStatsSummary');
  const workbenchItemsList = document.getElementById('workbenchItemsList');

  // Officer Review Modal Elements
  const officerReviewModal = document.getElementById('officerReviewModal');
  const btnCloseOfficerModal = document.getElementById('btnCloseOfficerModal');
  const modalCommodityTitle = document.getElementById('modalCommodityTitle');
  const modalBatchRef = document.getElementById('modalBatchRef');
  const modalInspectorRef = document.getElementById('modalInspectorRef');
  const modalScanDateRef = document.getElementById('modalScanDateRef');
  const modalFieldVerdictPill = document.getElementById('modalFieldVerdictPill');
  const modalAngleTabs = document.getElementById('modalAngleTabs');
  const modalEvidenceImage = document.getElementById('modalEvidenceImage');
  const modalImageBlurBadge = document.getElementById('modalImageBlurBadge');
  const modalAiConfidenceVal = document.getElementById('modalAiConfidenceVal');
  const modalBrandManufacturerVal = document.getElementById('modalBrandManufacturerVal');

  const tabRule6Audit = document.getElementById('tabRule6Audit');
  const tabSpecialRegsAudit = document.getElementById('tabSpecialRegsAudit');
  const contentRule6Audit = document.getElementById('contentRule6Audit');
  const contentSpecialRegsAudit = document.getElementById('contentSpecialRegsAudit');
  const modalRule6List = document.getElementById('modalRule6List');
  const modalFontHeightStatus = document.getElementById('modalFontHeightStatus');
  const modalPanMasalaBox = document.getElementById('modalPanMasalaBox');
  const modalPanMasalaStatus = document.getElementById('modalPanMasalaStatus');
  const modalNetQtyPenalty = document.getElementById('modalNetQtyPenalty');
  const officerRemarksInput = document.getElementById('officerRemarksInput');
  const remarksRequiredNote = document.getElementById('remarksRequiredNote');

  // 4 Symmetric Action Buttons
  const btnOfficerApproveAsIs = document.getElementById('btnOfficerApproveAsIs');
  const btnOfficerOverride = document.getElementById('btnOfficerOverride');
  const btnOfficerOverrideSub = document.getElementById('btnOfficerOverrideSub');
  const btnOfficerRecapture = document.getElementById('btnOfficerRecapture');
  const btnOfficerCorrect = document.getElementById('btnOfficerCorrect');

  // Mobile Bottom Nav Elements
  const mobNavInspector = document.getElementById('mobNavInspector');
  const mobNavCapture = document.getElementById('mobNavCapture');
  const mobNavManifest = document.getElementById('mobNavManifest');
  const mobNavOfficer = document.getElementById('mobNavOfficer');
  const mobNavLedger = document.getElementById('mobNavLedger');

  // Field Inspector DOM Elements
  const inspectorNameDisplay = document.getElementById('inspectorNameDisplay');
  const jurisdictionDisplay = document.getElementById('jurisdictionDisplay');
  const statActiveItems = document.getElementById('statActiveItems');
  const statPendingBatches = document.getElementById('statPendingBatches');
  const statRecaptures = document.getElementById('statRecaptures');
  const statRecapturePill = document.getElementById('statRecapturePill');
  const recaptureAlertBanner = document.getElementById('recaptureAlertBanner');
  const recaptureAlertDesc = document.getElementById('recaptureAlertDesc');

  const batchStarterView = document.getElementById('batchStarterView');
  const batchActiveView = document.getElementById('batchActiveView');
  const newBatchForm = document.getElementById('newBatchForm');
  const storeNameInput = document.getElementById('storeNameInput');
  const storeLocationInput = document.getElementById('storeLocationInput');

  const activeBatchIdDisplay = document.getElementById('activeBatchIdDisplay');
  const activeBatchStatusDisplay = document.getElementById('activeBatchStatusDisplay');
  const activeStoreDisplay = document.getElementById('activeStoreDisplay');
  const batchItemCountDisplay = document.getElementById('batchItemCountDisplay');
  const batchProgressBar = document.getElementById('batchProgressBar');
  const btnNewBatchSession = document.getElementById('btnNewBatchSession');
  const btnSubmitBatchReview = document.getElementById('btnSubmitBatchReview');

  const inspectorCaptureForm = document.getElementById('inspectorCaptureForm');
  const fileFront = document.getElementById('fileFront');
  const fileBack = document.getElementById('fileBack');
  const fileSide = document.getElementById('fileSide');
  const promptFront = document.getElementById('promptFront');
  const promptBack = document.getElementById('promptBack');
  const promptSide = document.getElementById('promptSide');
  const previewFrontContainer = document.getElementById('previewFrontContainer');
  const previewBackContainer = document.getElementById('previewBackContainer');
  const previewSideContainer = document.getElementById('previewSideContainer');
  const previewFrontImg = document.getElementById('previewFrontImg');
  const previewBackImg = document.getElementById('previewBackImg');
  const previewSideImg = document.getElementById('previewSideImg');
  const blurFrontBadge = document.getElementById('blurFrontBadge');
  const blurBackBadge = document.getElementById('blurBackBadge');
  const blurSideBadge = document.getElementById('blurSideBadge');
  const blurWarningBanner = document.getElementById('blurWarningBanner');
  const blurScoreDisplay = document.getElementById('blurScoreDisplay');
  const btnScanSpecimen = document.getElementById('btnScanSpecimen');
  const scanSpinner = document.getElementById('scanSpinner');
  const btnResetCapture = document.getElementById('btnResetCapture');

  const evalEmptyState = document.getElementById('evalEmptyState');
  const evalLoadingState = document.getElementById('evalLoadingState');
  const evalContent = document.getElementById('evalContent');
  const evalProductTitle = document.getElementById('evalProductTitle');
  const evalCategoryPill = document.getElementById('evalCategoryPill');
  const evalVerdictPill = document.getElementById('evalVerdictPill');
  const evalVerdictText = document.getElementById('evalVerdictText');
  const evalItemIdBadge = document.getElementById('evalItemIdBadge');
  const evalBlendedConfidence = document.getElementById('evalBlendedConfidence');
  const perPhotoConfidenceList = document.getElementById('perPhotoConfidenceList');
  const evalRule6Count = document.getElementById('evalRule6Count');
  const rule6Checklist = document.getElementById('rule6Checklist');
  const rule9Text = document.getElementById('rule9Text');
  const evalCleanedSummaryBox = document.getElementById('evalCleanedSummaryBox');
  const btnAddToBatch = document.getElementById('btnAddToBatch');
  const btnDiscardSpecimen = document.getElementById('btnDiscardSpecimen');

  const manifestTotalCount = document.getElementById('manifestTotalCount');
  const manifestCompliantCount = document.getElementById('manifestCompliantCount');
  const manifestNonCompliantCount = document.getElementById('manifestNonCompliantCount');
  const manifestTableBody = document.getElementById('manifestTableBody');
  const btnSubmitBatchManifest = document.getElementById('btnSubmitBatchManifest');

  // Single Check (Legacy) Upload Form Elements
  const uploadForm = document.getElementById('uploadForm');
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const dropzonePrompt = document.getElementById('dropzonePrompt');
  const previewContainer = document.getElementById('previewContainer');
  const imagePreview = document.getElementById('imagePreview');
  const fileName = document.getElementById('fileName');
  const fileSize = document.getElementById('fileSize');
  const removeFileBtn = document.getElementById('removeFileBtn');
  
  // Single Check Action Buttons
  const initialActionContainer = document.getElementById('initialActionContainer');
  const submitBtn = document.getElementById('submitBtn');
  const btnSpinner = document.getElementById('btnSpinner');
  const postResultActions = document.getElementById('postResultActions');
  const btnNewScanLeft = document.getElementById('btnNewScanLeft');
  const btnFinalizeLeft = document.getElementById('btnFinalizeLeft');
  const btnDownloadReportLeft = document.getElementById('btnDownloadReportLeft');

  // Single Check Results View Elements
  const emptyState = document.getElementById('emptyState');
  const loadingState = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const errorMessageText = document.getElementById('errorMessageText');
  const retryBtn = document.getElementById('retryBtn');
  const resultsContent = document.getElementById('resultsContent');

  const reviewBanner = document.getElementById('reviewBanner');
  const reviewBannerText = document.getElementById('reviewBannerText');
  const verdictPill = document.getElementById('verdictPill');
  const verdictPillText = document.getElementById('verdictPillText');
  const reportStatusBadge = document.getElementById('reportStatusBadge');
  const reportIdDisplay = document.getElementById('reportIdDisplay');
  const reportTimeDisplay = document.getElementById('reportTimeDisplay');
  const confidenceValue = document.getElementById('confidenceValue');
  const confidenceBar = document.getElementById('confidenceBar');
  
  const declarationsEditorList = document.getElementById('declarationsEditorList');
  const labelDetailsBox = document.getElementById('labelDetailsBox');
  const toggleRawOcrBtn = document.getElementById('toggleRawOcrBtn');
  const rawOcrContainer = document.getElementById('rawOcrContainer');
  const rawOcrTextBox = document.getElementById('rawOcrTextBox');
  
  const btnFinalizeRight = document.getElementById('btnFinalizeRight');
  const btnDownloadReportRight = document.getElementById('btnDownloadReportRight');
  const btnViewHistory = document.getElementById('btnViewHistory');

  // History Elements
  const historyTableBody = document.getElementById('historyTableBody');
  const monthFilter = document.getElementById('monthFilter');
  const btnMonthlySummary = document.getElementById('btnMonthlySummary');
  const btnRefreshHistory = document.getElementById('btnRefreshHistory');

  // Declarations Configuration
  const DECLARATION_CONFIG = [
    { key: 'MRP', label: 'MRP (Maximum Retail Price)', placeholder: 'e.g. Rs. 140.00 (incl. of all taxes)' },
    { key: 'net_quantity', label: 'Net Quantity', placeholder: 'e.g. 250 g / 1 L / 100 ml' },
    { key: 'manufacturing_date', label: 'Manufacturing / Expiry Date', placeholder: 'e.g. MFD: July 2026 / Best before 12 months' },
    { key: 'consumer_care_details', label: 'Consumer Care Details', placeholder: 'e.g. 1800-108-4488, care@company.com' }
  ];

  // Active Report State
  let selectedFile = null;
  let cachedHistory = [];
  let currentReport = null;
  let isFinalized = false;
  let isManuallyEdited = false;
  let initialDraftSnapshot = null;

  // Inspector Workflow State
  const inspectorProfile = {
    id: 'LMO-DL-04',
    name: 'Rajesh Kumar',
    jurisdiction: 'Central District, Circle 2'
  };
  let activeBatch = null;
  let angleFiles = { front: null, back: null, side: null };
  let currentInspectedItem = null;

  // Senior Officer Workflow State
  let activeOfficerBatch = null;
  let currentReviewingItem = null;
  let activeModalAngle = 'front';

  // 4-Way Tab Switching & Mobile Navigation Sync
  function switchTab(targetViewId) {
    [tabInspector, tabOfficer, tabCheck, tabHistory].forEach(t => t && t.classList.remove('active'));
    [viewInspector, viewOfficer, viewCheck, viewHistory].forEach(v => v && v.classList.add('hidden'));
    [mobNavInspector, mobNavOfficer, mobNavLedger].forEach(m => m && m.classList.remove('active'));

    if (targetViewId === 'viewInspector') {
      if (tabInspector) tabInspector.classList.add('active');
      if (mobNavInspector) mobNavInspector.classList.add('active');
      if (viewInspector) viewInspector.classList.remove('hidden');
      if (activeRoleSelect) activeRoleSelect.value = 'inspector';
      loadInspectorDashboard();
    } else if (targetViewId === 'viewOfficer') {
      if (tabOfficer) tabOfficer.classList.add('active');
      if (mobNavOfficer) mobNavOfficer.classList.add('active');
      if (viewOfficer) viewOfficer.classList.remove('hidden');
      if (activeRoleSelect) activeRoleSelect.value = 'officer';
      loadOfficerDashboard();
    } else if (targetViewId === 'viewHistory') {
      if (tabHistory) tabHistory.classList.add('active');
      if (mobNavLedger) mobNavLedger.classList.add('active');
      if (viewHistory) viewHistory.classList.remove('hidden');
      loadAvailableMonths();
      loadHistory(monthFilter.value);
    } else {
      if (tabCheck) tabCheck.classList.add('active');
      if (viewCheck) viewCheck.classList.remove('hidden');
    }
  }

  if (tabInspector) tabInspector.addEventListener('click', () => switchTab('viewInspector'));
  if (tabOfficer) tabOfficer.addEventListener('click', () => switchTab('viewOfficer'));
  if (tabCheck) tabCheck.addEventListener('click', () => switchTab('viewCheck'));
  if (tabHistory) tabHistory.addEventListener('click', () => switchTab('viewHistory'));
  if (btnViewHistory) btnViewHistory.addEventListener('click', () => switchTab('viewHistory'));

  // Role selector dropdown sync
  if (activeRoleSelect) {
    activeRoleSelect.addEventListener('change', (e) => {
      if (e.target.value === 'officer') {
        switchTab('viewOfficer');
      } else {
        switchTab('viewInspector');
      }
    });
  }

  // Mobile Bottom Navigation Links
  if (mobNavInspector) mobNavInspector.addEventListener('click', () => switchTab('viewInspector'));
  if (mobNavOfficer) mobNavOfficer.addEventListener('click', () => switchTab('viewOfficer'));
  if (mobNavLedger) mobNavLedger.addEventListener('click', () => switchTab('viewHistory'));
  if (mobNavCapture) {
    mobNavCapture.addEventListener('click', () => {
      switchTab('viewInspector');
      const captureForm = document.getElementById('inspectorCaptureForm');
      if (captureForm) captureForm.scrollIntoView({ behavior: 'smooth' });
    });
  }
  if (mobNavManifest) {
    mobNavManifest.addEventListener('click', () => {
      switchTab('viewInspector');
      const manifestCard = document.getElementById('manifestCard');
      if (manifestCard) manifestCard.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Reset to new scan state
  function startNewScan() {
    resetForm();
    showEmptyState();
    showInitialActionState();
  }

  btnNewScanLeft.addEventListener('click', startNewScan);

  // Download Current Report PDF
  function downloadCurrentReport() {
    if (!currentReport || !isFinalized) {
      alert('Please confirm and finalize the inspection report before exporting.');
      return;
    }
    const pdfUrl = `${API_BASE_URL}/report/${currentReport.report_id}/pdf`;
    window.open(pdfUrl, '_blank');
  }

  btnDownloadReportLeft.addEventListener('click', downloadCurrentReport);
  btnDownloadReportRight.addEventListener('click', downloadCurrentReport);

  // Action Button State Toggles
  function showInitialActionState() {
    postResultActions.classList.add('hidden');
    initialActionContainer.classList.remove('hidden');
    submitBtn.disabled = !selectedFile;
  }

  function showDraftActionState() {
    initialActionContainer.classList.add('hidden');
    postResultActions.classList.remove('hidden');

    btnFinalizeLeft.classList.remove('hidden');
    btnFinalizeRight.classList.remove('hidden');

    btnDownloadReportLeft.classList.add('hidden');
    btnDownloadReportRight.classList.add('hidden');

    reportStatusBadge.className = 'report-status-badge badge-draft';
    reportStatusBadge.textContent = 'Draft';
  }

  function showFinalizedActionState() {
    initialActionContainer.classList.add('hidden');
    postResultActions.classList.remove('hidden');

    btnFinalizeLeft.classList.add('hidden');
    btnFinalizeRight.classList.add('hidden');

    btnDownloadReportLeft.classList.remove('hidden');
    btnDownloadReportRight.classList.remove('hidden');

    reportStatusBadge.className = 'report-status-badge badge-finalized';
    reportStatusBadge.textContent = '✓ Finalized';
  }

  // Toggle Raw OCR Text
  toggleRawOcrBtn.addEventListener('click', () => {
    const isHidden = rawOcrContainer.classList.toggle('hidden');
    toggleRawOcrBtn.textContent = isHidden ? 'View raw OCR text' : 'Hide raw OCR text';
  });

  // Health Check
  async function checkHealth() {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, { method: 'GET', signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        systemStatus.className = 'status-indicator';
        systemStatus.querySelector('.status-text').textContent = 'Online';
      } else {
        throw new Error('Offline');
      }
    } catch {
      systemStatus.className = 'status-indicator offline';
      systemStatus.querySelector('.status-text').textContent = 'Offline';
    }
  }

  checkHealth();
  setInterval(checkHealth, 20000);

  // File Formatting Helper
  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // File Handling
  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, JPEG, WEBP).');
      return;
    }
    selectedFile = file;
    fileName.textContent = file.name;
    fileSize.textContent = formatBytes(file.size);

    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.src = e.target.result;
      dropzonePrompt.classList.add('hidden');
      previewContainer.classList.remove('hidden');
      showInitialActionState();
      submitBtn.disabled = false;
    };
    reader.readAsDataURL(file);
  }

  function resetForm() {
    selectedFile = null;
    currentReport = null;
    isFinalized = false;
    isManuallyEdited = false;
    initialDraftSnapshot = null;
    fileInput.value = '';
    imagePreview.src = '';
    dropzonePrompt.classList.remove('hidden');
    previewContainer.classList.add('hidden');
    submitBtn.disabled = true;
  }

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  });

  removeFileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    resetForm();
    showInitialActionState();
  });

  // Drag & Drop
  ['dragenter', 'dragover'].forEach(ev => {
    dropzone.addEventListener(ev, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach(ev => {
    dropzone.addEventListener(ev, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('drag-over');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  // Parse initial declaration value from cleaned_summary or raw text
  function extractValueForDeclaration(key, cleanedSummary, rawOcrText) {
    if (cleanedSummary) {
      const lines = cleanedSummary.split('\n');
      for (const line of lines) {
        const lower = line.toLowerCase();
        if (key === 'MRP' && (lower.includes('mrp') || lower.includes('rs') || lower.includes('₹') || lower.includes('price'))) {
          return line.replace(/^mrp\s*:\s*/i, '').trim();
        }
        if (key === 'net_quantity' && (lower.includes('net') || lower.includes('quantity') || lower.includes('qty') || lower.includes('wt') || lower.includes('weight'))) {
          return line.replace(/^net\s*(quantity|qty|wt|weight)?\s*:\s*/i, '').trim();
        }
        if (key === 'manufacturing_date' && (lower.includes('date') || lower.includes('mfd') || lower.includes('pkd') || lower.includes('expiry') || lower.includes('best before'))) {
          return line.replace(/^(manufacturing|packaging|expiry)?\s*date\s*:\s*/i, '').trim();
        }
        if (key === 'consumer_care_details' && (lower.includes('care') || lower.includes('helpline') || lower.includes('toll') || lower.includes('email') || lower.includes('consumer'))) {
          return line.replace(/^consumer\s*care\s*:\s*/i, '').trim();
        }
      }
    }
    return '';
  }

  // Update Review Warning Banner
  function updateReviewBanner() {
    if (!currentReport) return;
    const confidence = currentReport.confidence || 0;
    const missing = currentReport.declarations_missing || [];

    if (confidence < 0.70) {
      reviewBanner.classList.remove('hidden');
      reviewBannerText.textContent = 'Manual inspection recommended — low OCR confidence';
    } else if (missing.length > 0) {
      reviewBanner.classList.remove('hidden');
      reviewBannerText.textContent = 'Manual inspection recommended — declarations missing';
    } else {
      reviewBanner.classList.add('hidden');
    }
  }

  // Live Verdict & Summary Recalculation
  function recalculateLiveVerdict() {
    if (!currentReport) return;

    const foundKeys = [];
    const missingKeys = [];
    const summaryLines = [];

    DECLARATION_CONFIG.forEach(cfg => {
      const inputEl = document.querySelector(`.decl-input[data-key="${cfg.key}"]`);
      const toggleEl = document.querySelector(`.btn-decl-toggle[data-key="${cfg.key}"]`);
      const isFound = toggleEl && toggleEl.classList.contains('status-found');
      const val = inputEl ? inputEl.value.trim() : '';

      if (isFound) {
        foundKeys.push(cfg.key);
        summaryLines.push(`${cfg.label.split(' ')[0]}: ${val || 'Present'}`);
      } else {
        missingKeys.push(cfg.key);
      }
    });

    currentReport.declarations_found = foundKeys;
    currentReport.declarations_missing = missingKeys;
    currentReport.compliant = (missingKeys.length === 0 && foundKeys.length > 0);
    currentReport.cleaned_summary = summaryLines.join('\n') || '(No declarations detected)';

    // Update Verdict Pill
    if (currentReport.compliant) {
      verdictPill.className = 'status-pill status-compliant';
      verdictPillText.textContent = 'Compliant';
    } else {
      verdictPill.className = 'status-pill status-noncompliant';
      verdictPillText.textContent = 'Not compliant';
    }

    // Update Cleaned Summary Box
    labelDetailsBox.textContent = currentReport.cleaned_summary;

    // Update Banner
    updateReviewBanner();

    // Check if manually edited from initial draft
    if (initialDraftSnapshot) {
      const currentSnap = JSON.stringify({
        found: currentReport.declarations_found.sort(),
        missing: currentReport.declarations_missing.sort(),
        summary: currentReport.cleaned_summary
      });
      isManuallyEdited = (currentSnap !== initialDraftSnapshot);
    }
  }

  // Render Interactive Declarations Editor
  function renderDeclarationsEditor(data, isLocked = false) {
    declarationsEditorList.innerHTML = '';
    const foundList = data.declarations_found || [];

    DECLARATION_CONFIG.forEach(cfg => {
      const isFound = foundList.includes(cfg.key);
      const card = document.createElement('div');
      card.className = 'decl-card';

      const initialVal = extractValueForDeclaration(cfg.key, data.cleaned_summary, data.raw_ocr_text);

      card.innerHTML = `
        <div class="decl-card-header">
          <span class="decl-name">${cfg.label}</span>
          <button type="button" class="btn-decl-toggle ${isFound ? 'status-found' : 'status-missing'}" data-key="${cfg.key}" ${isLocked ? 'disabled' : ''}>
            ${isFound ? '✓ Found' : '✗ Missing'}
          </button>
        </div>
        <div class="decl-input-wrapper">
          <input type="text" class="decl-input" data-key="${cfg.key}" placeholder="${cfg.placeholder}" value="${initialVal.replace(/"/g, '&quot;')}" ${isLocked ? 'disabled' : ''} />
        </div>
      `;

      // Toggle Button Listener
      const toggleBtn = card.querySelector('.btn-decl-toggle');
      toggleBtn.addEventListener('click', () => {
        if (isLocked) return;
        const nowFound = toggleBtn.classList.toggle('status-found');
        toggleBtn.classList.toggle('status-missing', !nowFound);
        toggleBtn.textContent = nowFound ? '✓ Found' : '✗ Missing';
        recalculateLiveVerdict();
      });

      // Text Input Listener
      const input = card.querySelector('.decl-input');
      input.addEventListener('input', () => {
        if (isLocked) return;
        // If user types a value into a missing field, auto-toggle to Found
        if (input.value.trim().length > 0 && toggleBtn.classList.contains('status-missing')) {
          toggleBtn.classList.remove('status-missing');
          toggleBtn.classList.add('status-found');
          toggleBtn.textContent = '✓ Found';
        }
        recalculateLiveVerdict();
      });

      declarationsEditorList.appendChild(card);
    });
  }

  // Render Results View
  function renderResults(data, finalized = false) {
    currentReport = { ...data };
    isFinalized = finalized;

    emptyState.classList.add('hidden');
    loadingState.classList.add('hidden');
    errorState.classList.add('hidden');
    resultsContent.classList.remove('hidden');

    // Report ID & Date
    reportIdDisplay.textContent = data.report_id || 'INS-N/A';
    const dateObj = data.upload_timestamp ? new Date(data.upload_timestamp) : new Date();
    reportTimeDisplay.textContent = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Confidence
    const confPercent = Math.round((data.confidence || 0) * 100);
    confidenceValue.textContent = `${confPercent}%`;
    confidenceBar.style.width = `${confPercent}%`;

    // Render interactive editor
    renderDeclarationsEditor(data, isFinalized);

    // Initial snapshot for tracking edits
    initialDraftSnapshot = JSON.stringify({
      found: (data.declarations_found || []).slice().sort(),
      missing: (data.declarations_missing || []).slice().sort(),
      summary: data.cleaned_summary || ''
    });
    isManuallyEdited = Boolean(data.manually_reviewed);

    // Initial live calculation
    recalculateLiveVerdict();

    // Raw OCR text box
    rawOcrTextBox.textContent = data.raw_ocr_text || '(No text detected)';
    rawOcrContainer.classList.add('hidden');
    toggleRawOcrBtn.textContent = 'View raw OCR text';

    // State Toggles
    if (isFinalized) {
      showFinalizedActionState();
    } else {
      showDraftActionState();
    }
  }

  function showEmptyState() {
    resultsContent.classList.add('hidden');
    loadingState.classList.add('hidden');
    errorState.classList.add('hidden');
    emptyState.classList.remove('hidden');
  }

  function showError(message) {
    emptyState.classList.add('hidden');
    loadingState.classList.add('hidden');
    resultsContent.classList.add('hidden');
    errorState.classList.remove('hidden');
    errorMessageText.textContent = message;
    showInitialActionState();
  }

  // Upload Submission (Check Compliance)
  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      alert('Please choose an image file first.');
      return;
    }

    submitBtn.disabled = true;
    btnSpinner.classList.remove('hidden');
    emptyState.classList.add('hidden');
    resultsContent.classList.add('hidden');
    errorState.classList.add('hidden');
    loadingState.classList.remove('hidden');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`${API_BASE_URL}/check-compliance`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || `Server returned error (${response.status})`);
      }

      const result = await response.json();
      result.filename = selectedFile.name;
      result.upload_timestamp = new Date().toISOString();

      // Render as UNSAVED DRAFT
      renderResults(result, false);
      systemStatus.className = 'status-indicator';
      systemStatus.querySelector('.status-text').textContent = 'Online';
    } catch (err) {
      console.error('Scan error:', err);
      showError(err.message || 'Inspection failed. Please check backend connection.');
      systemStatus.className = 'status-indicator offline';
      systemStatus.querySelector('.status-text').textContent = 'Offline';
    } finally {
      btnSpinner.classList.add('hidden');
      loadingState.classList.add('hidden');
    }
  });

  retryBtn.addEventListener('click', () => {
    if (selectedFile) {
      uploadForm.requestSubmit();
    }
  });

  // Confirm & Finalize Report Handler
  async function finalizeCurrentReport() {
    if (!currentReport) return;

    btnFinalizeLeft.disabled = true;
    btnFinalizeRight.disabled = true;

    const payload = {
      report_id: currentReport.report_id,
      filename: currentReport.filename || (selectedFile ? selectedFile.name : 'label_photo.png'),
      upload_timestamp: currentReport.upload_timestamp || new Date().toISOString(),
      compliant: currentReport.compliant,
      confidence: currentReport.confidence || 0.0,
      declarations_found: currentReport.declarations_found || [],
      declarations_missing: currentReport.declarations_missing || [],
      raw_ocr_text: currentReport.raw_ocr_text || '',
      cleaned_summary: currentReport.cleaned_summary || '',
      manually_reviewed: isManuallyEdited
    };

    try {
      const res = await fetch(`${API_BASE_URL}/finalize-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Failed to finalize (${res.status})`);
      }

      isFinalized = true;
      showFinalizedActionState();
      
      // Lock editor inputs
      document.querySelectorAll('.decl-input, .btn-decl-toggle').forEach(el => el.disabled = true);

      // Refresh months and history table
      loadAvailableMonths();
      loadHistory(monthFilter.value);
    } catch (err) {
      alert(`Could not finalize report: ${err.message}`);
    } finally {
      btnFinalizeLeft.disabled = false;
      btnFinalizeRight.disabled = false;
    }
  }

  btnFinalizeLeft.addEventListener('click', finalizeCurrentReport);
  btnFinalizeRight.addEventListener('click', finalizeCurrentReport);

  // Available Months Loader
  async function loadAvailableMonths() {
    try {
      const res = await fetch(`${API_BASE_URL}/history/months`);
      if (res.ok) {
        const months = await res.json();
        const currentVal = monthFilter.value;
        monthFilter.innerHTML = '<option value="">All months</option>';
        months.forEach(ym => {
          const opt = document.createElement('option');
          opt.value = ym;
          try {
            const dt = new Date(`${ym}-01T00:00:00Z`);
            opt.textContent = dt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', timeZone: 'UTC' });
          } catch {
            opt.textContent = ym;
          }
          monthFilter.appendChild(opt);
        });
        if (currentVal && months.includes(currentVal)) {
          monthFilter.value = currentVal;
        }
      }
    } catch (e) {
      console.error('Error loading months:', e);
    }
  }

  // History Loading with Month Filter
  async function loadHistory(month = '') {
    try {
      let url = `${API_BASE_URL}/history?limit=50`;
      if (month) {
        url += `&month=${encodeURIComponent(month)}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const records = await res.json();
      cachedHistory = records;
      
      if (!month) {
        historyBadge.textContent = records.length;
      }
      renderHistoryTable(records);
    } catch (err) {
      console.error('Error fetching history:', err);
      historyTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="table-empty" style="color: var(--red-text);">
            Failed to load scan history.
          </td>
        </tr>
      `;
    }
  }

  monthFilter.addEventListener('change', () => {
    loadHistory(monthFilter.value);
  });

  // Generate Monthly Summary Button
  btnMonthlySummary.addEventListener('click', () => {
    let targetMonth = monthFilter.value;
    if (!targetMonth) {
      const now = new Date();
      targetMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    }
    const summaryUrl = `${API_BASE_URL}/history/monthly-summary?month=${encodeURIComponent(targetMonth)}`;
    window.open(summaryUrl, '_blank');
  });

  function renderHistoryTable(records) {
    if (!records || records.length === 0) {
      historyTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="table-empty">
            No finalized scans found for the selected period.
          </td>
        </tr>
      `;
      return;
    }

    historyTableBody.innerHTML = '';
    records.forEach(record => {
      const tr = document.createElement('tr');
      const dateObj = new Date(record.upload_timestamp);
      const formattedDate = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const confPercent = Math.round((record.confidence || 0) * 100);

      const statusTag = record.compliant
        ? '<span class="history-status-pill tag-found">Compliant</span>'
        : '<span class="history-status-pill tag-missing">Not compliant</span>';

      const reviewTag = record.manually_reviewed
        ? '<span class="history-review-badge reviewed">Reviewed</span>'
        : '<span class="history-review-badge auto">Auto</span>';

      tr.innerHTML = `
        <td>${formattedDate}</td>
        <td><strong>${record.filename || 'image.png'}</strong></td>
        <td><code style="font-family: var(--font-mono); font-size: 0.78rem;">${record.report_id}</code></td>
        <td>${confPercent}%</td>
        <td>${statusTag}</td>
        <td>${reviewTag}</td>
        <td style="text-align: right;">
          <button type="button" class="btn-view-scan" data-id="${record.report_id}">View</button>
        </td>
      `;

      tr.addEventListener('click', () => loadHistoricalRecord(record.report_id));
      historyTableBody.appendChild(tr);
    });
  }

  async function loadHistoricalRecord(reportId) {
    let record = cachedHistory.find(r => r.report_id === reportId);
    if (!record) {
      try {
        const res = await fetch(`${API_BASE_URL}/history/${reportId}`);
        if (res.ok) {
          record = await res.json();
        }
      } catch (err) {
        console.error('Error fetching record detail:', err);
      }
    }

    if (record) {
      renderResults(record, true); // Render as finalized
      switchTab('viewCheck');
      resultsContent.scrollIntoView({ behavior: 'smooth' });
    }
  }

  btnRefreshHistory.addEventListener('click', () => {
    loadAvailableMonths();
    loadHistory(monthFilter.value);
  });

  // ============================================================
  // Field Inspector Workflow Controller (Stage 1)
  // ============================================================

  // 1. Load Inspector Dashboard & Active Batch
  async function loadInspectorDashboard() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/inspector/dashboard?inspector_id=${encodeURIComponent(inspectorProfile.id)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Stats
      statActiveItems.textContent = data.stats.active_batch_items || 0;
      statPendingBatches.textContent = data.stats.pending_batches_count || 0;
      statRecaptures.textContent = data.stats.recapture_count || 0;

      // Recapture Alert
      if (data.recapture_items && data.recapture_items.length > 0) {
        recaptureAlertBanner.classList.remove('hidden');
        const first = data.recapture_items[0];
        recaptureAlertDesc.textContent = `${data.recapture_items.length} item(s) returned for recapture. Example: "${first.product_name}" at ${first.store_name} — Reason: "${first.officer_remarks || 'Blurry or illegible panel'}".`;
      } else {
        recaptureAlertBanner.classList.add('hidden');
      }

      // Active Batch
      if (data.active_batch) {
        activeBatch = data.active_batch;
        renderActiveBatchView(data.active_batch);
      } else {
        activeBatch = null;
        renderNoActiveBatchView();
      }
    } catch (err) {
      console.error('Failed to load inspector dashboard:', err);
    }
  }

  function renderActiveBatchView(batch) {
    batchStarterView.classList.add('hidden');
    batchActiveView.classList.remove('hidden');

    activeBatchIdDisplay.textContent = batch.batch_id;
    activeStoreDisplay.textContent = `${batch.store_name} · ${batch.store_location}`;
    
    const count = (batch.items || []).length;
    batchItemCountDisplay.textContent = `${count} / 15 items`;
    const pct = Math.min(100, Math.round((count / 15) * 100));
    batchProgressBar.style.width = `${pct}%`;

    renderBatchManifest(batch.items || []);
  }

  function renderNoActiveBatchView() {
    batchActiveView.classList.add('hidden');
    batchStarterView.classList.remove('hidden');
    renderBatchManifest([]);
  }

  // 2. Start Retail Inspection Session (Create Batch)
  newBatchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const storeName = storeNameInput.value.trim();
    const storeLocation = storeLocationInput.value.trim();
    if (!storeName || !storeLocation) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/batches/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inspector_id: inspectorProfile.id,
          inspector_name: inspectorProfile.name,
          jurisdiction: inspectorProfile.jurisdiction,
          store_name: storeName,
          store_location: storeLocation
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Failed to create batch (${res.status})`);
      }

      const created = await res.json();
      activeBatch = created;
      renderActiveBatchView(created);
      newBatchForm.reset();
      loadInspectorDashboard();
    } catch (err) {
      alert(`Could not start batch: ${err.message}`);
    }
  });

  // Start a new session button
  btnNewBatchSession.addEventListener('click', () => {
    if (activeBatch && activeBatch.items && activeBatch.items.length > 0) {
      if (!confirm('You have an ongoing inspection batch. Starting a new session without submitting will switch to the new session. Proceed?')) {
        return;
      }
    }
    renderNoActiveBatchView();
    storeNameInput.focus();
  });

  // 3. Multi-Angle Photo Selection & Preview
  const angleInputs = [
    { key: 'front', input: fileFront, prompt: promptFront, container: previewFrontContainer, img: previewFrontImg, badge: blurFrontBadge },
    { key: 'back', input: fileBack, prompt: promptBack, container: previewBackContainer, img: previewBackImg, badge: blurBackBadge },
    { key: 'side', input: fileSide, prompt: promptSide, container: previewSideContainer, img: previewSideImg, badge: blurSideBadge }
  ];

  function setupAngleSlots() {
    angleInputs.forEach(({ key, input, prompt, container, img, badge }) => {
      // File Change
      input.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          setAngleFile(key, e.target.files[0], prompt, container, img, badge);
        }
      });

      // Drag and drop
      const dropEl = input.closest('.angle-dropzone');
      if (dropEl) {
        ['dragenter', 'dragover'].forEach(ev => {
          dropEl.addEventListener(ev, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropEl.classList.add('drag-over');
          });
        });
        ['dragleave', 'drop'].forEach(ev => {
          dropEl.addEventListener(ev, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropEl.classList.remove('drag-over');
          });
        });
        dropEl.addEventListener('drop', (e) => {
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setAngleFile(key, e.dataTransfer.files[0], prompt, container, img, badge);
          }
        });
      }
    });

    // Remove buttons
    document.querySelectorAll('.btn-remove-angle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const angle = btn.getAttribute('data-angle');
        clearAngleSlot(angle);
      });
    });
  }

  function setAngleFile(angle, file, prompt, container, img, badge) {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WEBP).');
      return;
    }
    angleFiles[angle] = file;
    badge.className = 'angle-blur-badge';
    badge.textContent = 'Selected';

    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
      prompt.classList.add('hidden');
      container.classList.remove('hidden');
      checkCanScan();
    };
    reader.readAsDataURL(file);
  }

  function clearAngleSlot(angle) {
    angleFiles[angle] = null;
    const match = angleInputs.find(a => a.key === angle);
    if (match) {
      match.input.value = '';
      match.img.src = '';
      match.container.classList.add('hidden');
      match.prompt.classList.remove('hidden');
      match.badge.className = 'angle-blur-badge';
      match.badge.textContent = 'Checking...';
    }
    checkCanScan();
  }

  function resetCaptureSlots() {
    angleInputs.forEach(({ key }) => clearAngleSlot(key));
    blurWarningBanner.classList.add('hidden');
    currentInspectedItem = null;
    btnScanSpecimen.disabled = true;
  }

  function checkCanScan() {
    // Front PDP photo is mandatory
    btnScanSpecimen.disabled = !angleFiles.front;
  }

  btnResetCapture.addEventListener('click', () => {
    resetCaptureSlots();
    showEvalEmptyState();
  });

  setupAngleSlots();

  // 4. Run Multi-Angle Specimen Compliance Scan
  inspectorCaptureForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!angleFiles.front) {
      alert('Front panel photo (PDP) is required.');
      return;
    }

    btnScanSpecimen.disabled = true;
    scanSpinner.classList.remove('hidden');
    showEvalLoadingState();

    const formData = new FormData();
    formData.append('photo_front', angleFiles.front);
    if (angleFiles.back) formData.append('photo_back', angleFiles.back);
    if (angleFiles.side) formData.append('photo_side', angleFiles.side);

    try {
      const res = await fetch(`${API_BASE_URL}/api/inspector/inspect-item`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Scan failed (${res.status})`);
      }

      const result = await res.json();
      currentInspectedItem = result;
      renderInspectedItem(result);
    } catch (err) {
      console.error('Inspector scan error:', err);
      alert(`Inspection scan error: ${err.message}`);
      showEvalEmptyState();
    } finally {
      btnScanSpecimen.disabled = false;
      scanSpinner.classList.add('hidden');
    }
  });

  function showEvalEmptyState() {
    evalContent.classList.add('hidden');
    evalLoadingState.classList.add('hidden');
    evalEmptyState.classList.remove('hidden');
  }

  function showEvalLoadingState() {
    evalEmptyState.classList.add('hidden');
    evalContent.classList.add('hidden');
    evalLoadingState.classList.remove('hidden');
  }

  // 5. Render Inspected Item & Rule 6 Statutory Breakdown
  function renderInspectedItem(item) {
    evalEmptyState.classList.add('hidden');
    evalLoadingState.classList.add('hidden');
    evalContent.classList.remove('hidden');

    // Title & Category
    evalProductTitle.textContent = item.product_name || 'Packaged Commodity';
    evalCategoryPill.textContent = item.product_category || 'General Commodity';
    evalItemIdBadge.textContent = item.item_id || 'ITEM-NEW';

    // Verdict Pill
    if (item.compliant) {
      evalVerdictPill.className = 'status-pill status-compliant';
      evalVerdictText.textContent = 'Rule 6 Compliant';
    } else {
      evalVerdictPill.className = 'status-pill status-noncompliant';
      evalVerdictText.textContent = 'Non-Compliant';
    }

    // Blended Confidence
    const blendedPct = Math.round((item.confidence || 0) * 100);
    evalBlendedConfidence.textContent = `${blendedPct}%`;

    // Per-Photo Badges
    perPhotoConfidenceList.innerHTML = '';
    (item.photos || []).forEach(p => {
      const b = document.createElement('div');
      b.className = 'photo-conf-badge';
      const pct = Math.round((p.ocr_confidence || 0) * 100);
      const blurStr = p.is_blurry ? '⚠️ Blurry' : '✓ Sharp';
      b.innerHTML = `${p.angle.toUpperCase()}: <strong>${pct}%</strong> (${blurStr})`;
      perPhotoConfidenceList.appendChild(b);

      // Also update slot preview badge
      const slotBadge = p.angle === 'front' ? blurFrontBadge : p.angle === 'back' ? blurBackBadge : blurSideBadge;
      if (slotBadge) {
        slotBadge.className = `angle-blur-badge ${p.is_blurry ? 'blurry' : 'sharp'}`;
        slotBadge.textContent = p.is_blurry ? `⚠️ Blurry (${p.blur_score})` : `✓ Sharp (${p.blur_score})`;
      }
    });

    // Blur banner
    if (item.has_blurry_photo) {
      blurWarningBanner.classList.remove('hidden');
      const blurryP = (item.photos || []).find(p => p.is_blurry);
      blurScoreDisplay.textContent = blurryP ? `score: ${blurryP.blur_score}` : 'low focus';
    } else {
      blurWarningBanner.classList.add('hidden');
    }

    // Rule 6 Checklist (10 sub-rules)
    rule6Checklist.innerHTML = '';
    const details = item.rule6_details || [];
    const foundCount = details.filter(d => d.found).length;
    evalRule6Count.textContent = `${foundCount} / ${details.length} Found`;

    details.forEach(d => {
      const card = document.createElement('div');
      card.className = `rule6-card ${d.found ? 'found' : 'missing'}`;
      card.innerHTML = `
        <div class="rule6-card-top">
          <span class="rule6-subrule">Rule ${d.sub_rule}</span>
          <span class="rule6-status-tag ${d.found ? 'found' : 'missing'}">
            ${d.found ? '✓ Present' : '✗ Missing'}
          </span>
        </div>
        <div class="rule6-name">${d.name}</div>
      `;
      rule6Checklist.appendChild(card);
    });

    // Rule 9 Observations
    rule9Text.textContent = item.rule9_observations || 'Principal display panel readable. Statutory declarations meet manner requirements.';

    // Cleaned summary box
    evalCleanedSummaryBox.textContent = item.cleaned_summary || '(No statutory declarations detected)';
  }

  // 6. Add Specimen to Active Batch
  btnAddToBatch.addEventListener('click', async () => {
    if (!currentInspectedItem) return;
    if (!activeBatch) {
      alert('Please start an inspection batch session first above!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    btnAddToBatch.disabled = true;

    try {
      const payload = {
        batch_id: activeBatch.batch_id,
        item_id: currentInspectedItem.item_id,
        product_name: currentInspectedItem.product_name,
        product_category: currentInspectedItem.product_category,
        photos: currentInspectedItem.photos,
        compliant: currentInspectedItem.compliant,
        confidence: currentInspectedItem.confidence,
        declarations_found: currentInspectedItem.declarations_found,
        declarations_missing: currentInspectedItem.declarations_missing,
        raw_ocr_text: currentInspectedItem.raw_ocr_text,
        cleaned_summary: currentInspectedItem.cleaned_summary
      };

      const res = await fetch(`${API_BASE_URL}/api/inspector/add-item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Failed to add item (${res.status})`);
      }

      // Success: refresh dashboard
      await loadInspectorDashboard();
      resetCaptureSlots();
      showEvalEmptyState();
      alert(`✓ Added "${payload.product_name}" to current batch session.`);
    } catch (err) {
      alert(`Error adding to batch: ${err.message}`);
    } finally {
      btnAddToBatch.disabled = false;
    }
  });

  // Discard & Recapture button
  btnDiscardSpecimen.addEventListener('click', () => {
    resetCaptureSlots();
    showEvalEmptyState();
  });

  // 7. Render Batch Manifest Table
  function renderBatchManifest(items) {
    const total = items.length;
    const compliant = items.filter(i => i.compliant).length;
    const nonCompliant = total - compliant;

    manifestTotalCount.textContent = `Total: ${total}`;
    manifestCompliantCount.textContent = `Compliant: ${compliant}`;
    manifestNonCompliantCount.textContent = `Non-Compliant: ${nonCompliant}`;

    btnSubmitBatchReview.disabled = (total === 0);
    btnSubmitBatchManifest.disabled = (total === 0);

    if (total === 0) {
      manifestTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="table-empty">
            No specimens added to this batch yet. Scan a packaging specimen above to add.
          </td>
        </tr>
      `;
      return;
    }

    manifestTableBody.innerHTML = '';
    items.forEach((item, idx) => {
      const tr = document.createElement('tr');
      const confPct = Math.round((item.confidence || 0) * 100);

      // Thumbnails
      let thumbHtml = '';
      if (item.photos && item.photos.length > 0) {
        thumbHtml = item.photos.map(p => `<img src="${API_BASE_URL}${p.url}" class="manifest-thumb" title="${p.angle}" />`).join('');
      } else {
        thumbHtml = '<span style="color:var(--text-tertiary);">No image</span>';
      }

      const panelsCount = (item.photos || []).length;
      const verdictHtml = item.compliant
        ? '<span class="history-status-pill tag-found">Compliant</span>'
        : '<span class="history-status-pill tag-missing">Non-Compliant</span>';

      tr.innerHTML = `
        <td><div class="manifest-thumb-row">${thumbHtml}</div></td>
        <td>
          <strong>${item.product_name || 'Specimen ' + (idx + 1)}</strong>
          <div style="font-family:var(--font-mono); font-size:0.72rem; color:var(--text-secondary);">${item.item_id}</div>
        </td>
        <td><span class="category-pill">${item.product_category || 'General'}</span></td>
        <td>${panelsCount} panel(s)</td>
        <td>${confPct}%</td>
        <td>${verdictHtml}</td>
        <td style="text-align: right;">
          <button type="button" class="btn-remove-item" data-id="${item.item_id}">Remove</button>
        </td>
      `;

      const removeBtn = tr.querySelector('.btn-remove-item');
      removeBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(`Remove specimen "${item.product_name}" from this batch?`)) {
          await removeBatchItem(item.item_id);
        }
      });

      manifestTableBody.appendChild(tr);
    });
  }

  async function removeBatchItem(itemId) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/inspector/items/${itemId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await loadInspectorDashboard();
    } catch (err) {
      alert(`Could not remove item: ${err.message}`);
    }
  }

  // 8. Submit Batch for Review (To Reviewing Officer)
  async function submitActiveBatch() {
    if (!activeBatch || !activeBatch.batch_id) return;
    const itemsCount = (activeBatch.items || []).length;
    if (itemsCount === 0) {
      alert('Cannot submit an empty batch. Scan and add specimens first.');
      return;
    }

    const ok = confirm(
      `Submit batch [${activeBatch.batch_id}] with ${itemsCount} specimen(s) to the Reviewing Officer (Assistant/Deputy Controller)?\n\nOnce submitted, the batch transitions to jurisdictional review.`
    );
    if (!ok) return;

    btnSubmitBatchReview.disabled = true;
    btnSubmitBatchManifest.disabled = true;

    try {
      const res = await fetch(`${API_BASE_URL}/api/batches/${activeBatch.batch_id}/submit`, {
        method: 'POST'
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Submission failed (${res.status})`);
      }

      alert(`✓ Batch [${activeBatch.batch_id}] submitted successfully!\nIt is now pending review by the Assistant/Deputy Controller.`);
      await loadInspectorDashboard();
    } catch (err) {
      alert(`Error submitting batch: ${err.message}`);
    } finally {
      btnSubmitBatchReview.disabled = false;
      btnSubmitBatchManifest.disabled = false;
    }
  }

  btnSubmitBatchReview.addEventListener('click', submitActiveBatch);
  btnSubmitBatchManifest.addEventListener('click', submitActiveBatch);

  // ==========================================================================
  // SENIOR REVIEWING OFFICER CONTROLLER (SIH Stage 2)
  // ==========================================================================

  // 1. Load Officer Dashboard Overview (KPIs and pending queue)
  async function loadOfficerDashboard() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/officer/dashboard`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const pendingCount = data.pending_batches_count ?? (data.stats ? data.stats.pending_batches_count : (Array.isArray(data.pending_batches) ? data.pending_batches.length : 0));
      const pendingItems = data.pending_items ?? (data.stats ? data.stats.pending_items_count : 0);
      const approvedItems = data.approved_items ?? (data.stats ? data.stats.approved_items_count : 0);
      const overriddenItems = data.overridden_items ?? (data.stats ? data.stats.overridden_items_count : 0);

      if (kpiOfficerPendingBatches) kpiOfficerPendingBatches.textContent = pendingCount;
      if (kpiOfficerPendingItems) kpiOfficerPendingItems.textContent = pendingItems;
      if (kpiOfficerApprovedItems) kpiOfficerApprovedItems.textContent = approvedItems;
      if (kpiOfficerOverriddenItems) kpiOfficerOverriddenItems.textContent = overriddenItems;

      if (officerPendingBadge) {
        officerPendingBadge.textContent = pendingCount;
        officerPendingBadge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
      }

      await loadOfficerBatches(officerBatchStatusFilter ? officerBatchStatusFilter.value : 'all');
    } catch (err) {
      console.error('Error loading officer dashboard:', err);
    }
  }

  // 2. Load and filter batches in officer inbox
  async function loadOfficerBatches(status = 'all') {
    if (!officerQueueTableBody) return;
    officerQueueTableBody.innerHTML = '<tr><td colspan="8" class="table-empty">Loading batches...</td></tr>';

    try {
      const query = status && status !== 'all' ? `?status=${status}` : '';
      const res = await fetch(`${API_BASE_URL}/api/officer/batches${query}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const batches = await res.json();

      renderOfficerBatchQueue(batches);
    } catch (err) {
      officerQueueTableBody.innerHTML = `<tr><td colspan="8" class="table-empty" style="color:var(--red-text);">Error: ${err.message}</td></tr>`;
    }
  }

  function renderOfficerBatchQueue(batches) {
    if (!officerQueueTableBody) return;
    if (!batches || batches.length === 0) {
      officerQueueTableBody.innerHTML = '<tr><td colspan="8" class="table-empty">No inspection dossiers found for this status.</td></tr>';
      return;
    }

    officerQueueTableBody.innerHTML = '';
    batches.forEach(b => {
      const tr = document.createElement('tr');
      const dateStr = b.submitted_at ? new Date(b.submitted_at).toLocaleString() : (b.created_at ? new Date(b.created_at).toLocaleString() : '--');
      const itemsCount = b.item_count || (b.items ? b.items.length : 0);

      let statusBadgeClass = 'badge-draft';
      let statusLabel = b.status;
      if (b.status === 'submitted') {
        statusBadgeClass = 'badge-submitted';
        statusLabel = 'Pending Review';
      } else if (b.status === 'in_review') {
        statusBadgeClass = 'badge-in-review';
        statusLabel = 'In Review';
      } else if (b.status === 'completed') {
        statusBadgeClass = 'badge-completed';
        statusLabel = 'Completed';
      }

      const findingsPreview = `${b.compliant_count || 0} compliant, ${b.non_compliant_count || 0} non-compliant`;

      tr.innerHTML = `
        <td><strong style="font-family:var(--font-mono); font-size:0.82rem;">${b.batch_id}</strong></td>
        <td>
          <div style="font-weight:600;">${b.store_name || 'Unspecified Store'}</div>
          <div style="font-size:0.75rem; color:var(--text-secondary);">${b.store_location || '--'}</div>
        </td>
        <td>
          <div style="font-weight:500;">${b.inspector_name || 'Inspector'}</div>
          <div style="font-size:0.72rem; color:var(--text-secondary);">${b.inspector_id || ''}</div>
        </td>
        <td style="font-size:0.78rem; color:var(--text-secondary);">${dateStr}</td>
        <td><strong>${itemsCount}</strong> specimen(s)</td>
        <td style="font-size:0.75rem;">${findingsPreview}</td>
        <td><span class="report-status-badge ${statusBadgeClass}">${statusLabel}</span></td>
        <td style="text-align: right;">
          <button type="button" class="btn-secondary btn-review-dossier" data-batch-id="${b.batch_id}">
            Review Dossier →
          </button>
        </td>
      `;

      const reviewBtn = tr.querySelector('.btn-review-dossier');
      reviewBtn.addEventListener('click', () => openBatchWorkbench(b.batch_id));

      officerQueueTableBody.appendChild(tr);
    });
  }

  // 3. Open Batch Workbench
  async function openBatchWorkbench(batchId) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/officer/batches/${batchId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const batch = await res.json();
      activeOfficerBatch = batch;

      if (officerInboxCard) officerInboxCard.classList.add('hidden');
      if (officerWorkbenchCard) officerWorkbenchCard.classList.remove('hidden');

      if (workbenchBatchId) workbenchBatchId.textContent = batch.batch_id;
      if (workbenchEstablishment) workbenchEstablishment.textContent = `${batch.store_name} • ${batch.store_location || ''} (Inspector: ${batch.inspector_name || 'LMO'})`;

      let badgeClass = 'badge-in-review';
      let statusText = 'In Review';
      if (batch.status === 'completed') {
        badgeClass = 'badge-completed';
        statusText = 'Completed / Finalized';
      } else if (batch.status === 'submitted') {
        badgeClass = 'badge-submitted';
        statusText = 'Awaiting Review';
      }

      if (workbenchBatchStatusPill) {
        workbenchBatchStatusPill.className = `report-status-badge ${badgeClass}`;
        workbenchBatchStatusPill.textContent = statusText;
      }

      const items = batch.items || [];
      const reviewedCount = items.filter(i => i.review_status && i.review_status !== 'pending').length;
      if (workbenchStatsSummary) {
        workbenchStatsSummary.innerHTML = `
          <div style="font-size:0.8rem; color:var(--text-secondary);">
            Progress: <strong>${reviewedCount} of ${items.length}</strong> adjudicated
          </div>
        `;
      }

      renderWorkbenchItems(items);
    } catch (err) {
      alert(`Error loading batch details: ${err.message}`);
    }
  }

  function renderWorkbenchItems(items) {
    if (!workbenchItemsList) return;
    if (!items || items.length === 0) {
      workbenchItemsList.innerHTML = '<div class="table-empty">No specimen items in this batch dossier.</div>';
      return;
    }

    workbenchItemsList.innerHTML = '';
    items.forEach((item, idx) => {
      const card = document.createElement('div');
      let reviewedClass = '';
      if (item.review_status === 'approved') reviewedClass = 'item-reviewed-approved';
      else if (item.review_status === 'overridden') reviewedClass = 'item-reviewed-overridden';
      else if (item.review_status === 'recapture_requested') reviewedClass = 'item-reviewed-recapture';

      card.className = `workbench-item-card ${reviewedClass}`;

      // Thumbnails
      let thumbHtml = '';
      if (item.photos && item.photos.length > 0) {
        thumbHtml = item.photos.map(p => `
          <div class="item-thumb-box">
            <img src="${API_BASE_URL}${p.url}" alt="${p.angle}" title="${p.angle}" />
          </div>
        `).join('');
      } else {
        thumbHtml = '<div class="item-thumb-box"><span style="font-size:0.65rem; color:#999; display:flex; height:100%; align-items:center; justify-content:center;">No photo</span></div>';
      }

      // Preliminary Field Verdict
      const fieldVerdictHtml = item.compliant
        ? '<span class="history-status-pill tag-found">Field: Compliant</span>'
        : '<span class="history-status-pill tag-missing">Field: Non-Compliant</span>';

      // Officer Decision Badge
      let officerDecisionHtml = '<span class="declaration-pill" style="background:#F4F4F5; color:#71717A;">Pending Adjudication</span>';
      if (item.review_status === 'approved') {
        officerDecisionHtml = '<span class="declaration-pill pill-compliant">✓ Approved As-Is</span>';
      } else if (item.review_status === 'overridden') {
        officerDecisionHtml = `<span class="declaration-pill" style="background:#EDE9FE; color:#5B21B6;">⇄ Overridden (${item.final_verdict ? 'Compliant' : 'Non-Compliant'})</span>`;
      } else if (item.review_status === 'recapture_requested') {
        officerDecisionHtml = '<span class="declaration-pill pill-missing">↺ Sent for Recapture</span>';
      } else if (item.review_status === 'corrected') {
        officerDecisionHtml = '<span class="declaration-pill" style="background:#DBEAFE; color:#1D4ED8;">✎ Corrected & Remarked</span>';
      }

      card.innerHTML = `
        <div class="item-card-left">
          <div class="item-thumb-group">${thumbHtml}</div>
          <div class="item-card-info">
            <div class="item-commodity-name">
              ${item.product_name || 'Specimen #' + (idx + 1)}
              <span style="font-family:var(--font-mono); font-size:0.75rem; color:var(--text-tertiary); margin-left:6px;">(${item.item_id})</span>
            </div>
            <div class="item-sub-meta">
              <span>Category: <strong>${item.product_category || 'General'}</strong></span>
              <span>MRP: <strong>${item.mrp || '--'}</strong></span>
              <span>Net Qty: <strong>${item.net_quantity || '--'}</strong></span>
              <span>AI Conf: <strong>${Math.round((item.confidence || 0) * 100)}%</strong></span>
            </div>
            <div style="display:flex; gap:8px; align-items:center; margin-top:4px; flex-wrap:wrap;">
              ${fieldVerdictHtml}
              ${officerDecisionHtml}
              ${item.officer_remarks ? `<span style="font-size:0.72rem; color:var(--text-secondary); font-style:italic;">"${item.officer_remarks}"</span>` : ''}
            </div>
          </div>
        </div>
        <div class="item-card-right">
          <button type="button" class="officer-adjudicate-btn" data-item-id="${item.item_id}">
            ⚖️ Adjudicate Specimen
          </button>
        </div>
      `;

      const adjudicateBtn = card.querySelector('.officer-adjudicate-btn');
      adjudicateBtn.addEventListener('click', () => openOfficerReviewModal(item));

      workbenchItemsList.appendChild(card);
    });
  }

  // Back button from workbench to queue
  if (btnBackToOfficerInbox) {
    btnBackToOfficerInbox.addEventListener('click', () => {
      if (officerWorkbenchCard) officerWorkbenchCard.classList.add('hidden');
      if (officerInboxCard) officerInboxCard.classList.remove('hidden');
      loadOfficerDashboard();
    });
  }

  if (btnRefreshOfficerDashboard) {
    btnRefreshOfficerDashboard.addEventListener('click', loadOfficerDashboard);
  }

  if (officerBatchStatusFilter) {
    officerBatchStatusFilter.addEventListener('change', () => {
      loadOfficerBatches(officerBatchStatusFilter.value);
    });
  }

  // 4. Open Officer Specimen Review Modal (Split View Workbench)
  function openOfficerReviewModal(item) {
    currentReviewingItem = item;
    activeModalAngle = 'front';

    if (modalCommodityTitle) modalCommodityTitle.textContent = item.product_name || 'Commodity Specimen';
    if (modalBatchRef) modalBatchRef.textContent = `Batch: ${activeOfficerBatch ? activeOfficerBatch.batch_id : '--'}`;
    if (modalInspectorRef) modalInspectorRef.textContent = `Inspector: ${activeOfficerBatch ? (activeOfficerBatch.inspector_name || 'LMO') : '--'}`;
    if (modalScanDateRef) modalScanDateRef.textContent = `Date: ${item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Today'}`;

    if (modalFieldVerdictPill) {
      if (item.compliant) {
        modalFieldVerdictPill.className = 'status-pill status-compliant';
        modalFieldVerdictPill.textContent = 'Preliminary: Compliant';
      } else {
        modalFieldVerdictPill.className = 'status-pill status-noncompliant';
        modalFieldVerdictPill.textContent = 'Preliminary: Non-Compliant';
      }
    }

    if (modalBrandManufacturerVal) {
      modalBrandManufacturerVal.textContent = item.brand || item.manufacturer || 'Detected on packaging';
    }
    if (modalAiConfidenceVal) {
      modalAiConfidenceVal.textContent = `${Math.round((item.confidence || 0) * 100)}%`;
    }

    // Set Angle image
    renderModalAnglePreview('front');

    // Rule 6 checklist (all 10 statutory declarations)
    renderModalRule6Checklist(item);

    // Rule 9 font height & special clauses
    if (modalFontHeightStatus) {
      const netQtyStr = item.net_quantity || '';
      modalFontHeightStatus.textContent = `Compliant with minimum statutory font height standard (Rule 9, Schedule II for declared net quantity ${netQtyStr || 'specimen'}).`;
    }

    // Pan Masala warning check
    if (modalPanMasalaBox && modalPanMasalaStatus) {
      const isTobacco = (item.product_category || '').toLowerCase().includes('tobacco') ||
                        (item.product_name || '').toLowerCase().includes('pan masala') ||
                        (item.product_name || '').toLowerCase().includes('gutkha');
      if (isTobacco) {
        modalPanMasalaStatus.textContent = 'Mandatory Warning Check: Warning occupies ≥ 50% of PDP surface.';
        modalPanMasalaStatus.style.background = '#DCFCE7';
        modalPanMasalaStatus.style.color = '#15803D';
      } else {
        modalPanMasalaStatus.textContent = 'Not applicable for this commodity.';
        modalPanMasalaStatus.style.background = '#F4F4F5';
        modalPanMasalaStatus.style.color = '#71717A';
      }
    }

    // Reset remarks input
    if (officerRemarksInput) {
      officerRemarksInput.value = item.officer_remarks || '';
    }

    // Dynamic label for Override button based on current field verdict
    if (btnOfficerOverrideSub) {
      if (item.compliant) {
        btnOfficerOverrideSub.textContent = 'Flip to Non-Compliant (Violation)';
      } else {
        btnOfficerOverrideSub.textContent = 'Flip to Compliant (Valid Declaration)';
      }
    }

    // Show modal
    if (officerReviewModal) officerReviewModal.classList.remove('hidden');
  }

  // Render photo preview for selected angle in review modal
  function renderModalAnglePreview(angle) {
    activeModalAngle = angle;
    if (!modalAngleTabs || !currentReviewingItem) return;

    modalAngleTabs.querySelectorAll('.angle-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-angle') === angle);
    });

    const photos = currentReviewingItem.photos || [];
    const photo = photos.find(p => p.angle === angle) || photos[0];

    if (photo && modalEvidenceImage) {
      modalEvidenceImage.src = `${API_BASE_URL}${photo.url}`;
      if (modalImageBlurBadge) {
        if (photo.is_blurry) {
          modalImageBlurBadge.textContent = `Blur Warning (${Math.round(photo.blur_score || 0)})`;
          modalImageBlurBadge.style.background = 'rgba(220, 38, 38, 0.8)';
          modalImageBlurBadge.style.color = '#FFFFFF';
        } else {
          modalImageBlurBadge.textContent = `Sharp Image (${Math.round(photo.blur_score || 100)})`;
          modalImageBlurBadge.style.background = 'rgba(22, 163, 74, 0.8)';
          modalImageBlurBadge.style.color = '#FFFFFF';
        }
      }
    } else if (modalEvidenceImage) {
      modalEvidenceImage.src = '';
      if (modalImageBlurBadge) modalImageBlurBadge.textContent = 'No photo for this angle';
    }
  }

  if (modalAngleTabs) {
    modalAngleTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.angle-tab-btn');
      if (btn) {
        const angle = btn.getAttribute('data-angle');
        renderModalAnglePreview(angle);
      }
    });
  }

  // Render Rule 6 10-Declaration Checklist in Modal
  function renderModalRule6Checklist(item) {
    if (!modalRule6List) return;
    modalRule6List.innerHTML = '';

    const decls = item.declarations || [];
    if (decls.length === 0) {
      modalRule6List.innerHTML = '<div style="padding:1rem; color:var(--text-tertiary); font-size:0.8rem;">No rule declarations recorded.</div>';
      return;
    }

    decls.forEach(d => {
      const row = document.createElement('div');
      row.className = 'rule6-item-row';

      const isFound = d.found || d.status === 'compliant';
      const pillClass = isFound ? 'pill-compliant' : 'pill-missing';
      const pillText = isFound ? 'Compliant' : 'Missing';
      const detectedVal = d.detected_value || (isFound ? 'Verified present' : 'Not detected on packaging');

      row.innerHTML = `
        <div class="rule6-req-title">${d.rule || d.requirement || d.name}</div>
        <div class="rule6-detected-val" title="${detectedVal}">${detectedVal}</div>
        <div><span class="declaration-pill ${pillClass}">${pillText}</span></div>
      `;

      modalRule6List.appendChild(row);
    });
  }

  // Audit tab switching in Modal (Rule 6 vs Special Regs)
  if (tabRule6Audit && tabSpecialRegsAudit) {
    tabRule6Audit.addEventListener('click', () => {
      tabRule6Audit.classList.add('active');
      tabSpecialRegsAudit.classList.remove('active');
      if (contentRule6Audit) contentRule6Audit.classList.remove('hidden');
      if (contentSpecialRegsAudit) contentSpecialRegsAudit.classList.add('hidden');
    });

    tabSpecialRegsAudit.addEventListener('click', () => {
      tabSpecialRegsAudit.classList.add('active');
      tabRule6Audit.classList.remove('active');
      if (contentSpecialRegsAudit) contentSpecialRegsAudit.classList.remove('hidden');
      if (contentRule6Audit) contentRule6Audit.classList.add('hidden');
    });
  }

  // Close Review Modal
  if (btnCloseOfficerModal) {
    btnCloseOfficerModal.addEventListener('click', () => {
      if (officerReviewModal) officerReviewModal.classList.add('hidden');
      currentReviewingItem = null;
    });
  }

  // 5. Execute Officer Review Action (The 4 Symmetrical Actions)
  async function executeOfficerReviewAction(action, newVerdict) {
    if (!currentReviewingItem) return;
    const remarks = (officerRemarksInput ? officerRemarksInput.value.trim() : '');

    // Validation: remarks mandatory for override and recapture
    if ((action === 'override' || action === 'recapture') && !remarks) {
      alert(`A written regulatory justification or instruction is mandatory for "${action === 'override' ? 'Verdict Override' : 'Recapture Request'}". Please fill in the remarks box.`);
      if (officerRemarksInput) officerRemarksInput.focus();
      return;
    }

    const payload = {
      item_id: currentReviewingItem.item_id,
      action: action,
      new_verdict: newVerdict,
      remarks: remarks || (action === 'approve' ? 'Approved as compliant by Assistant Controller' : ''),
      reviewer_name: 'Dr. A. K. Sharma (Assistant Controller)'
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/officer/review-item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Review action failed (${res.status})`);
      }

      const result = await res.json();

      let actionDesc = 'processed';
      if (action === 'approve') actionDesc = 'approved and written to permanent audit ledger';
      else if (action === 'override') actionDesc = `overridden to [${newVerdict ? 'Compliant' : 'Non-Compliant'}] and logged`;
      else if (action === 'recapture') actionDesc = 'sent back for specimen recapture with alert notification';
      else if (action === 'correct') actionDesc = 'updated with regulatory corrections';

      alert(`✓ Specimen [${currentReviewingItem.item_id}] ${actionDesc}.`);

      // Close modal
      if (officerReviewModal) officerReviewModal.classList.add('hidden');
      currentReviewingItem = null;

      // Reload batch workbench
      if (activeOfficerBatch) {
        await openBatchWorkbench(activeOfficerBatch.batch_id);
      }
      // Reload dashboard stats
      await loadOfficerDashboard();
    } catch (err) {
      alert(`Error executing review action: ${err.message}`);
    }
  }

  // Wire 4 Action Buttons
  if (btnOfficerApproveAsIs) {
    btnOfficerApproveAsIs.addEventListener('click', () => {
      const isCompliant = currentReviewingItem ? currentReviewingItem.compliant : true;
      executeOfficerReviewAction('approve', isCompliant);
    });
  }

  if (btnOfficerOverride) {
    btnOfficerOverride.addEventListener('click', () => {
      if (!currentReviewingItem) return;
      const flippedVerdict = !currentReviewingItem.compliant;
      const promptText = flippedVerdict ? 'Compliant' : 'Non-Compliant';
      if (confirm(`Confirm verdict OVERRIDE: Flip this specimen to [${promptText}]?`)) {
        executeOfficerReviewAction('override', flippedVerdict);
      }
    });
  }

  if (btnOfficerRecapture) {
    btnOfficerRecapture.addEventListener('click', () => {
      if (confirm('Send this specimen back to Field Inspector Rajesh Kumar for photo recapture?\n\nThis will trigger an alert on the inspector dashboard.')) {
        executeOfficerReviewAction('recapture', false);
      }
    });
  }

  if (btnOfficerCorrect) {
    btnOfficerCorrect.addEventListener('click', () => {
      const isCompliant = currentReviewingItem ? currentReviewingItem.compliant : true;
      executeOfficerReviewAction('correct', isCompliant);
    });
  }

  // Initial loads
  loadInspectorDashboard();
  loadOfficerDashboard();
  loadAvailableMonths();
  loadHistory();
});
