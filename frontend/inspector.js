document.addEventListener('DOMContentLoaded', async () => {
  // =========================================================================
  // 1. AUTHENTICATE GUARD (Restricted to 'inspector' role)
  // =========================================================================
  const user = LabelLensAuth.requireAuth('inspector');
  if (!user) return;

  const API_BASE_URL = (window.location.protocol === 'file:')
    ? 'http://localhost:3000'
    : (window.__LABEL_LENS_API__ || '');

  // Persistent Header Elements
  const headerInspectorName = document.getElementById('headerInspectorName');
  const headerInspectorBadge = document.getElementById('headerInspectorBadge');
  const headerAlertDot = document.getElementById('headerAlertDot');
  const btnSignOut = document.getElementById('btnSignOut');

  if (headerInspectorName) headerInspectorName.textContent = user.full_name || 'Rajesh Kumar';
  if (headerInspectorBadge) headerInspectorBadge.textContent = `${user.badge_number || 'LMO-DL-04'} • ${user.jurisdiction || 'Zone 4'}`;
  if (btnSignOut) btnSignOut.addEventListener('click', () => LabelLensAuth.logout());

  // Navigation Tab Bar Elements (Fixed Bottom Nav - 4 Tabs)
  const inspectorBottomNav = document.getElementById('inspectorBottomNav');
  const tabNavCamera = document.getElementById('tabNavCamera');
  const tabNavBatch = document.getElementById('tabNavBatch');
  const tabNavAlerts = document.getElementById('tabNavAlerts');
  const tabNavHistory = document.getElementById('tabNavHistory');
  const tabBatchBadge = document.getElementById('tabBatchBadge');
  const tabAlertBadge = document.getElementById('tabAlertBadge');
  const headerBellBtn = document.getElementById('headerBellBtn');

  // Panes
  const paneCamera = document.getElementById('paneCamera');
  const paneBatch = document.getElementById('paneBatch');
  const paneAlerts = document.getElementById('paneAlerts');
  const paneHistory = document.getElementById('paneHistory');

  // Summary Strip & Active Batch Session Elements
  const persistentBatchStrip = document.getElementById('persistentBatchStrip');
  const summaryBatchId = document.getElementById('summaryBatchId');
  const summaryStoreName = document.getElementById('summaryStoreName');
  const summaryItemCount = document.getElementById('summaryItemCount') || document.getElementById('summarySpecimenCount');
  const batchTabBatchId = document.getElementById('batchTabBatchId');
  const batchTabStoreName = document.getElementById('batchTabStoreName');
  const batchTabStatusBadge = document.getElementById('batchTabStatusBadge');

  // Capture Trigger & Modals
  const btnUploadLabel = document.getElementById('btnUploadLabel');
  const uploadOptionsModal = document.getElementById('uploadOptionsModal');
  const btnCloseUploadModal = document.getElementById('btnCloseUploadModal');
  const btnChooseCamera = document.getElementById('btnChooseCamera');
  const btnChooseGallery = document.getElementById('btnChooseGallery');
  const inputGalleryMulti = document.getElementById('inputGalleryMulti');
  const inputReplacePhoto = document.getElementById('inputReplacePhoto');

  // Recapture Banner in Camera Pane
  const recaptureActiveBanner = document.getElementById('recaptureActiveBanner');
  const recaptureItemTitle = document.getElementById('recaptureItemTitle');
  const recaptureOfficerNote = document.getElementById('recaptureOfficerNote');
  const btnCancelRecapture = document.getElementById('btnCancelRecapture');

  // Tables in Camera and Batch Panes
  const cameraItemListTableBody = document.getElementById('cameraItemListTableBody');
  const itemListTableBody = document.getElementById('itemListTableBody');

  // Batch Tab Elements
  const statTotalItems = document.getElementById('statTotalItems');
  const statCompliantItems = document.getElementById('statCompliantItems');
  const statNonCompliantItems = document.getElementById('statNonCompliantItems');
  const statQuotaText = document.getElementById('statQuotaText');
  const statProgressBar = document.getElementById('statProgressBar');
  const btnSubmitBatch = document.getElementById('btnSubmitBatch') || document.getElementById('btnSubmitDossier');
  const btnTriggerNewBatchModal = document.getElementById('btnTriggerNewBatchModal');

  // Alerts Tab Elements
  const alertsListContainer = document.getElementById('alertsListContainer');
  const alertsEmptyCard = document.getElementById('alertsEmptyCard');

  // History Tab Elements
  const historyBatchesView = document.getElementById('historyBatchesView');
  const historyBatchesList = document.getElementById('historyBatchesList');
  const historyBatchDetailView = document.getElementById('historyBatchDetailView');
  const btnHistoryBackToList = document.getElementById('btnHistoryBackToList');
  const historyDetailTitle = document.getElementById('historyDetailTitle');
  const historyDetailMeta = document.getElementById('historyDetailMeta');
  const historyItemsTableBody = document.getElementById('historyItemsTableBody');

  // Lightbox Modal Elements
  const photoLightboxModal = document.getElementById('photoLightboxModal');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxSubtitle = document.getElementById('lightboxSubtitle');
  const btnLightboxClose = document.getElementById('btnLightboxClose');
  const btnLightboxReplace = document.getElementById('btnLightboxReplace');
  const btnLightboxRemove = document.getElementById('btnLightboxRemove');
  const btnLightboxKeep = document.getElementById('btnLightboxKeep');

  // New Batch Modal Elements
  const newBatchModal = document.getElementById('newBatchModal');
  const btnCloseNewBatchModal = document.getElementById('btnCloseNewBatchModal');
  const newBatchSessionForm = document.getElementById('newBatchSessionForm');
  const modalStoreName = document.getElementById('modalStoreName');
  const modalStoreLocation = document.getElementById('modalStoreLocation');

  // Draft Warning Modal Elements
  const draftWarningModal = document.getElementById('draftWarningModal');
  const btnCloseDraftWarningModal = document.getElementById('btnCloseDraftWarningModal');
  const draftWarningMsg = document.getElementById('draftWarningMsg');
  const btnWarningFinish = document.getElementById('btnWarningFinish');
  const btnWarningSendReview = document.getElementById('btnWarningSendReview');
  const btnWarningSaveDraft = document.getElementById('btnWarningSaveDraft');

  // Camera Tab Empty State Elements
  const cameraNoBatchEmptyState = document.getElementById('cameraNoBatchEmptyState');
  const uploadTriggerContainer = document.getElementById('uploadTriggerContainer');
  const cameraItemListCard = document.getElementById('cameraItemListCard');
  const btnCameraStartNewBatch = document.getElementById('btnCameraStartNewBatch');
  const cameraDraftsNotice = document.getElementById('cameraDraftsNotice');
  const cameraDraftsList = document.getElementById('cameraDraftsList');

  // Switch Batch Modal Elements
  const btnSwitchBatch = document.getElementById('btnSwitchBatch');
  const switchBatchModal = document.getElementById('switchBatchModal');
  const btnCloseSwitchBatchModal = document.getElementById('btnCloseSwitchBatchModal');
  const switchDraftsList = document.getElementById('switchDraftsList');
  const switchSubmittedList = document.getElementById('switchSubmittedList');
  const switchDraftsCount = document.getElementById('switchDraftsCount');
  const switchSubmittedCount = document.getElementById('switchSubmittedCount');

  // In-App Confirm & Alert Modal Elements
  const appConfirmModal = document.getElementById('appConfirmModal');
  const appConfirmTitle = document.getElementById('appConfirmTitle');
  const appConfirmMessage = document.getElementById('appConfirmMessage');
  const btnAppConfirmOk = document.getElementById('btnAppConfirmOk');
  const btnAppConfirmCancel = document.getElementById('btnAppConfirmCancel');
  const btnAppConfirmClose = document.getElementById('btnAppConfirmClose');

  const appAlertModal = document.getElementById('appAlertModal');
  const appAlertTitle = document.getElementById('appAlertTitle');
  const appAlertMessage = document.getElementById('appAlertMessage');
  const appAlertIcon = document.getElementById('appAlertIcon');
  const btnAppAlertOk = document.getElementById('btnAppAlertOk');
  const btnAppAlertClose = document.getElementById('btnAppAlertClose');

  // In-App Dialog System (Replaces native browser confirm and alert)
  let activeConfirmResolver = null;
  function showConfirm(title, message, options = {}) {
    return new Promise((resolve) => {
      activeConfirmResolver = resolve;
      if (appConfirmTitle) appConfirmTitle.textContent = title || 'Confirm Action';
      if (appConfirmMessage) appConfirmMessage.textContent = message || '';
      if (btnAppConfirmOk) {
        btnAppConfirmOk.textContent = options.confirmText || 'Confirm';
        if (options.danger) {
          btnAppConfirmOk.classList.add('btn-danger-action');
        } else {
          btnAppConfirmOk.classList.remove('btn-danger-action');
        }
      }
      if (btnAppConfirmCancel) btnAppConfirmCancel.textContent = options.cancelText || 'Cancel';
      if (appConfirmModal) appConfirmModal.classList.remove('hidden');
    });
  }

  function resolveConfirm(result) {
    if (appConfirmModal) appConfirmModal.classList.add('hidden');
    if (activeConfirmResolver) {
      const res = activeConfirmResolver;
      activeConfirmResolver = null;
      res(result);
    }
  }

  if (btnAppConfirmOk) btnAppConfirmOk.addEventListener('click', () => resolveConfirm(true));
  if (btnAppConfirmCancel) btnAppConfirmCancel.addEventListener('click', () => resolveConfirm(false));
  if (btnAppConfirmClose) btnAppConfirmClose.addEventListener('click', () => resolveConfirm(false));
  if (appConfirmModal) {
    appConfirmModal.addEventListener('click', (e) => {
      if (e.target === appConfirmModal) resolveConfirm(false);
    });
  }

  let activeAlertResolver = null;
  function showAlert(title, message, type = 'info') {
    return new Promise((resolve) => {
      activeAlertResolver = resolve;
      if (appAlertTitle) appAlertTitle.textContent = title || 'Notice';
      if (appAlertMessage) appAlertMessage.textContent = message || '';
      if (appAlertIcon) {
        if (type === 'success') {
          appAlertIcon.textContent = '✓';
          appAlertIcon.style.color = '#047857';
        } else if (type === 'warning') {
          appAlertIcon.textContent = '⚠️';
          appAlertIcon.style.color = '#D97706';
        } else if (type === 'error') {
          appAlertIcon.textContent = '✕';
          appAlertIcon.style.color = '#DC2626';
        } else {
          appAlertIcon.textContent = 'ℹ️';
          appAlertIcon.style.color = '#2563EB';
        }
      }
      if (appAlertModal) appAlertModal.classList.remove('hidden');
    });
  }

  function resolveAlert() {
    if (appAlertModal) appAlertModal.classList.add('hidden');
    if (activeAlertResolver) {
      const res = activeAlertResolver;
      activeAlertResolver = null;
      res();
    }
  }

  if (btnAppAlertOk) btnAppAlertOk.addEventListener('click', resolveAlert);
  if (btnAppAlertClose) btnAppAlertClose.addEventListener('click', resolveAlert);
  if (appAlertModal) {
    appAlertModal.addEventListener('click', (e) => {
      if (e.target === appAlertModal) resolveAlert();
    });
  }

  // Safety net: override window dialogs so native browser popups never display
  window.alert = (msg) => showAlert('Notification', String(msg));
  window.confirm = (msg) => showConfirm('Confirm', String(msg));

  // =========================================================================
  // RULE 6 STATUTORY DECLARATIONS CONFIGURATION
  // =========================================================================
  const RULE6_FIELDS = [
    { key: 'mrp', name: 'Retail Sale Price (MRP)', sub: 'Rule 6(1)(e)', mandatory: true },
    { key: 'net_quantity', name: 'Net Quantity', sub: 'Rule 6(1)(c)', mandatory: true },
    { key: 'manufacturing_date', name: 'Month & Year of Mfg / Packing', sub: 'Rule 6(1)(d)', mandatory: true },
    { key: 'manufacturer_details', name: 'Manufacturer / Packer Details', sub: 'Rule 6(1)(a)', mandatory: true },
    { key: 'commodity_name', name: 'Generic Commodity Name', sub: 'Rule 6(1)(b)', mandatory: true },
    { key: 'consumer_care', name: 'Consumer Care Details', sub: 'Rule 6(1)(ca)', mandatory: true },
    { key: 'country_of_origin', name: 'Country of Origin', sub: 'Rule 6(1)(f)', mandatory: true },
    { key: 'unit_sale_price', name: 'Unit Sale Price (USP)', sub: 'Rule 6(1)(i)', mandatory: true },
    { key: 'best_before', name: 'Best Before / Expiry Date', sub: 'Rule 6(1)(h)', mandatory: false },
    { key: 'dimensions', name: 'Dimensions of Commodity', sub: 'Rule 6(1)(g)', mandatory: false }
  ];

  // =========================================================================
  // STATE MANAGEMENT (Preserved across tab switches)
  // =========================================================================
  let activeBatch = null;
  let activeRecaptures = [];
  let currentRecapturingItemId = null;
  let expandedItemId = null;
  let expandedHistoryItemId = null;
  let currentHistoryBatchItems = [];
  let stagedEdits = {}; // itemId -> { product_name, product_category, photos: [], declarations_found: [], declarations_missing: [], declaration_values: {} }
  let stagedBackgroundFiles = {}; // itemId -> { front, back, side, extras: [] }
  let photoReplacingTarget = null; // { itemId, photoIdx }
  let activeLightboxItem = null;
  let activeLightboxPhotoIdx = null;

  // In-progress item capture state
  let currentItemCapture = {
    front: null,  // { file, dataUrl }
    back: null,   // { file, dataUrl }
    side: null,   // { file, dataUrl }
    extras: []    // array of { file, dataUrl, id }
  };

  // Helper: Escape HTML
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function readFileDataUrl(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }

  // =========================================================================
  // 1. TAB SWITCHING (Never destroys in-progress capture state)
  // =========================================================================
  function updateBatchStripVisibility(targetTab) {
    if (!persistentBatchStrip) return;

    if (targetTab === 'batch') {
      // 1. Remove the batch strip from the Batch tab (redundant with batch list)
      persistentBatchStrip.classList.add('hidden');
      persistentBatchStrip.style.display = 'none';
    } else {
      // 2. Keep the batch strip on Camera, Alerts, and History tabs
      persistentBatchStrip.classList.remove('hidden');
      persistentBatchStrip.style.display = 'block';

      // 3. "+ New Batch" button only appears on Camera tab
      if (btnTriggerNewBatchModal) {
        if (targetTab === 'camera') {
          btnTriggerNewBatchModal.classList.remove('hidden');
          btnTriggerNewBatchModal.style.display = 'inline-flex';
        } else {
          btnTriggerNewBatchModal.classList.add('hidden');
          btnTriggerNewBatchModal.style.display = 'none';
        }
      }
    }
  }

  function switchTab(targetTab) {
    const tabs = [
      { id: 'camera', btn: tabNavCamera, pane: paneCamera },
      { id: 'batch', btn: tabNavBatch, pane: paneBatch },
      { id: 'alerts', btn: tabNavAlerts, pane: paneAlerts },
      { id: 'history', btn: tabNavHistory, pane: paneHistory }
    ];

    tabs.forEach(t => {
      if (!t.btn || !t.pane) return;
      if (t.id === targetTab) {
        t.btn.classList.add('active');
        t.pane.classList.remove('hidden');
        t.pane.style.display = 'flex';
      } else {
        t.btn.classList.remove('active');
        t.pane.classList.add('hidden');
        t.pane.style.display = 'none';
      }
    });

    updateBatchStripVisibility(targetTab);

    if (targetTab === 'history') {
      loadInspectorHistory();
    } else if (targetTab === 'batch') {
      renderBatchItemList();
    } else if (targetTab === 'camera') {
      renderBatchItemList();
      updateCameraTabEmptyState();
    } else {
      renderBatchItemList();
    }
  }

  if (inspectorBottomNav) {
    inspectorBottomNav.addEventListener('click', (e) => {
      const btn = e.target.closest('.tab-item');
      if (!btn) return;
      const tab = btn.getAttribute('data-tab');
      if (tab) switchTab(tab);
    });
  }

  if (tabNavCamera) tabNavCamera.addEventListener('click', () => switchTab('camera'));
  if (tabNavBatch) tabNavBatch.addEventListener('click', () => switchTab('batch'));
  if (tabNavAlerts) tabNavAlerts.addEventListener('click', () => switchTab('alerts'));
  if (tabNavHistory) tabNavHistory.addEventListener('click', () => switchTab('history'));
  if (headerBellBtn) headerBellBtn.addEventListener('click', () => switchTab('alerts'));

  // =========================================================================
  // 2. GUIDED CAMERA ENGINE INITIALIZATION
  // =========================================================================
  const guidedCameraModal = document.getElementById('guidedCameraModal');
  const cameraStreamVideo = document.getElementById('cameraStreamVideo');
  const cameraCaptureCanvas = document.getElementById('cameraCaptureCanvas');
  const cameraSnapshotPreview = document.getElementById('cameraSnapshotPreview');
  const cameraAngleTitle = document.getElementById('cameraAngleTitle');
  const cameraAnglePrompt = document.getElementById('cameraAnglePrompt');
  const cameraStepIndicator = document.getElementById('cameraStepIndicator');
  const cameraLiveControls = document.getElementById('cameraLiveControls');
  const cameraReviewControls = document.getElementById('cameraReviewControls');
  const cameraPostGuidedControls = document.getElementById('cameraPostGuidedControls');
  const cameraBlurBadge = document.getElementById('cameraBlurBadge');

  const btnCameraClose = document.getElementById('btnCameraClose');
  const btnCameraSkip = document.getElementById('btnCameraSkip');
  const btnCameraShutter = document.getElementById('btnCameraShutter');
  const btnCameraCross = document.getElementById('btnCameraCross');
  const btnCameraTick = document.getElementById('btnCameraTick');
  const btnCameraNextItem = document.getElementById('btnCameraNextItem');
  const btnAddExtraPhoto = document.getElementById('btnAddExtraPhoto');
  const btnFinishCamera = document.getElementById('btnFinishCamera');

  const cameraEngine = new GuidedCameraEngine({
    modalEl: guidedCameraModal,
    videoEl: cameraStreamVideo,
    canvasEl: cameraCaptureCanvas,
    previewImgEl: cameraSnapshotPreview,
    stepIndicatorEl: cameraStepIndicator,
    angleTitleEl: cameraAngleTitle,
    anglePromptEl: cameraAnglePrompt,
    liveControlsEl: cameraLiveControls,
    reviewControlsEl: cameraReviewControls,
    postGuidedControlsEl: cameraPostGuidedControls,
    blurBadgeEl: cameraBlurBadge,
    skipBtnEl: btnCameraSkip,
    onPhotoAccepted: (angleId, file, dataUrl) => {
      if (angleId === 'front') {
        currentItemCapture.front = { file, dataUrl };
      } else if (angleId === 'back') {
        currentItemCapture.back = { file, dataUrl };
      } else if (angleId === 'side') {
        currentItemCapture.side = { file, dataUrl };
      } else {
        currentItemCapture.extras.push({ file, dataUrl, id: angleId });
      }
    },
    onClosed: () => {
      renderBatchItemList();
    },
    onNextItemRequested: () => {
      handleNextItemTransition();
    }
  });

  btnCameraClose.addEventListener('click', () => {
    cameraEngine.close();
    renderBatchItemList();
  });

  btnCameraShutter.addEventListener('click', () => cameraEngine.takeSnapshot());
  btnCameraCross.addEventListener('click', () => cameraEngine.retakeCurrentAngle());
  btnCameraTick.addEventListener('click', () => cameraEngine.acceptCurrentAngle());
  btnAddExtraPhoto.addEventListener('click', () => cameraEngine.startExtraCapture());

  // IN-CAMERA "Next Item →": Instant 0ms transition with background compliance analysis!
  function handleNextItemTransition() {
    if (!currentItemCapture.front) {
      showAlert('Mandatory Angle', '⚠️ Front panel photo is mandatory before moving to the next item.', 'warning');
      return false;
    }

    if (!activeBatch || !activeBatch.batch_id) {
      showAlert('No Active Batch', 'No active batch session found. Please start a batch session.', 'warning');
      cameraEngine.close();
      switchTab('camera');
      return false;
    }

    // 1. Snapshot captured files & local previews
    const capturedFiles = {
      front: currentItemCapture.front.file,
      back: currentItemCapture.back ? currentItemCapture.back.file : null,
      side: currentItemCapture.side ? currentItemCapture.side.file : null,
      extras: currentItemCapture.extras.map(e => e.file)
    };

    const tempId = `ITEM-${Date.now().toString(36).toUpperCase()}`;
    const localPhotos = [
      { angle: 'front', url: currentItemCapture.front.dataUrl },
      ...(currentItemCapture.back ? [{ angle: 'back', url: currentItemCapture.back.dataUrl }] : []),
      ...(currentItemCapture.side ? [{ angle: 'side', url: currentItemCapture.side.dataUrl }] : []),
      ...currentItemCapture.extras.map((e, idx) => ({ angle: `extra_${idx + 1}`, url: e.dataUrl }))
    ];

    const queuedItem = {
      item_id: tempId,
      batch_id: activeBatch.batch_id,
      product_name: 'Unidentified Product',
      product_category: 'Packaged Commodity',
      photos: localPhotos,
      compliant: null,
      confidence: 0,
      declarations_found: [],
      declarations_missing: [],
      raw_ocr_text: '',
      cleaned_summary: '',
      analysis_status: 'analyzing', // 'analyzing' | 'completed' | 'failed'
      created_at: new Date().toISOString()
    };

    // 2. Add to active batch immediately
    if (!activeBatch.items) activeBatch.items = [];
    activeBatch.items.push(queuedItem);
    stagedBackgroundFiles[tempId] = capturedFiles;

    // 3. Clear recapture alert if this was a recapture
    if (currentRecapturingItemId) {
      activeRecaptures = activeRecaptures.filter(r => r.item_id !== currentRecapturingItemId);
      currentRecapturingItemId = null;
      recaptureActiveBanner.classList.add('hidden');
      renderAlertsTab();
    }

    // 4. Update UI instantly (quota counter + table row shows Analyzing...)
    renderBatchItemList();

    // 5. Reset camera to Angle 1 for the new item with live stream running continuously (0ms wait!)
    currentItemCapture = { front: null, back: null, side: null, extras: [] };
    cameraEngine.resetForNewItem();

    // 6. Launch asynchronous background compliance check (non-blocking)
    processItemAnalysis(queuedItem, capturedFiles);
    return true;
  }

  if (btnCameraNextItem) {
    btnCameraNextItem.addEventListener('click', () => {
      handleNextItemTransition();
    });
  }

  // IN-CAMERA "Done (View Items)": Saves if front photo exists, then exits camera to dashboard
  if (btnFinishCamera) {
    btnFinishCamera.addEventListener('click', () => {
      if (currentItemCapture.front) {
        handleNextItemTransition();
      }
      cameraEngine.close();
      renderBatchItemList();
    });
  }

  // =========================================================================
  // 3. ASYNCHRONOUS BACKGROUND COMPLIANCE ANALYSIS QUEUE
  // =========================================================================
  async function processItemAnalysis(item, capturedFiles) {
    item.analysis_status = 'analyzing';
    renderBatchItemList();

    try {
      // 1. Upload & OCR inspect in background
      const formData = new FormData();
      formData.append('photo_front', capturedFiles.front);
      if (capturedFiles.back) formData.append('photo_back', capturedFiles.back);
      if (capturedFiles.side) formData.append('photo_side', capturedFiles.side);
      capturedFiles.extras.forEach((extFile, i) => {
        formData.append(`photo_extra_${i + 1}`, extFile);
      });

      const inspectRes = await fetch(`${API_BASE_URL}/api/inspector/inspect-item`, {
        method: 'POST',
        body: formData
      });

      if (!inspectRes.ok) throw new Error(`Analysis failed (HTTP ${inspectRes.status})`);
      const inspectionData = await inspectRes.json();

      // 2. Commit inspected item to SQLite batch
      const addPayload = {
        batch_id: activeBatch.batch_id,
        item_id: inspectionData.item_id || item.item_id,
        product_name: inspectionData.product_name || 'Unidentified Product',
        product_category: inspectionData.product_category || 'Packaged Commodity',
        photos: inspectionData.photos || item.photos,
        compliant: inspectionData.compliant,
        confidence: inspectionData.confidence || 0.9,
        declarations_found: inspectionData.declarations_found || [],
        declarations_missing: inspectionData.declarations_missing || [],
        raw_ocr_text: inspectionData.raw_ocr_text || '',
        cleaned_summary: inspectionData.cleaned_summary || '',
        declaration_values: inspectionData.declaration_values || {}
      };

      const addRes = await fetch(`${API_BASE_URL}/api/inspector/add-item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addPayload)
      });

      if (!addRes.ok) throw new Error('Failed to record item in batch manifest');

      // 3. Update in-memory item with real server data
      item.item_id = addPayload.item_id;
      item.product_name = addPayload.product_name;
      item.product_category = addPayload.product_category;
      item.photos = addPayload.photos;
      item.compliant = addPayload.compliant;
      item.confidence = addPayload.confidence;
      item.declarations_found = addPayload.declarations_found;
      item.declarations_missing = addPayload.declarations_missing;
      item.declaration_values = addPayload.declaration_values;
      item.raw_ocr_text = addPayload.raw_ocr_text;
      item.cleaned_summary = addPayload.cleaned_summary;
      item.analysis_status = 'completed';

      renderBatchItemList();

    } catch (err) {
      console.error(`Analysis failed for item ${item.item_id}:`, err);
      item.analysis_status = 'failed';
      item.analysis_error = err.message || 'Inspection service unavailable';
      renderBatchItemList();
    }
  }

  function retryItemAnalysis(itemId) {
    const item = (activeBatch.items || []).find(i => i.item_id === itemId);
    if (!item) return;
    const files = stagedBackgroundFiles[itemId];
    if (!files) {
      showAlert('Retry Unavailable', 'Original image files unavailable for retry. Please recapture.', 'warning');
      return;
    }
    processItemAnalysis(item, files);
  }

  // =========================================================================
  // 4. UPLOAD LABEL TRIGGER & OPTIONS MODAL
  // =========================================================================
  btnUploadLabel.addEventListener('click', () => {
    uploadOptionsModal.classList.remove('hidden');
  });

  btnCloseUploadModal.addEventListener('click', () => {
    uploadOptionsModal.classList.add('hidden');
  });

  uploadOptionsModal.addEventListener('click', (e) => {
    if (e.target === uploadOptionsModal) uploadOptionsModal.classList.add('hidden');
  });

  // Camera Option Chosen
  btnChooseCamera.addEventListener('click', () => {
    uploadOptionsModal.classList.add('hidden');
    currentItemCapture = { front: null, back: null, side: null, extras: [] };
    cameraEngine.start('front');
  });

  // Gallery Option Chosen (Multi-select)
  btnChooseGallery.addEventListener('click', () => {
    uploadOptionsModal.classList.add('hidden');
    inputGalleryMulti.value = '';
    inputGalleryMulti.click();
  });

  // Gallery Multi-Select Auto-Assignment:
  inputGalleryMulti.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const dataUrl = await readFileDataUrl(file);

      if (i === 0) {
        currentItemCapture.front = { file, dataUrl };
      } else if (i === 1) {
        currentItemCapture.back = { file, dataUrl };
      } else if (i === 2) {
        currentItemCapture.side = { file, dataUrl };
      } else {
        currentItemCapture.extras.push({ file, dataUrl, id: `extra_${i - 2}` });
      }
    }

    handleNextItemTransition();
    await showAlert('Item Added', '✓ Item added to batch! Background compliance analysis is running.', 'success');
  });

  // Cancel recapture banner
  btnCancelRecapture.addEventListener('click', () => {
    currentRecapturingItemId = null;
    recaptureActiveBanner.classList.add('hidden');
  });

  // =========================================================================
  // 5. BATCH CREATION & SUBMISSION
  // =========================================================================
  btnTriggerNewBatchModal.addEventListener('click', () => {
    // Check if current batch has items that haven't been submitted for review yet
    const hasUnsubmittedItems = activeBatch && 
      activeBatch.status === 'draft' && 
      Array.isArray(activeBatch.items) && 
      activeBatch.items.length > 0;

    if (hasUnsubmittedItems) {
      const count = activeBatch.items.length;
      const store = activeBatch.store_name || 'Current Store';
      draftWarningMsg.textContent = `Batch [${activeBatch.batch_id}] (${store}) has ${count} item${count > 1 ? 's' : ''} that haven't been submitted for review yet. What would you like to do before starting a new batch?`;
      draftWarningModal.classList.remove('hidden');
    } else {
      // 0 items captured or no active batch: skip warning entirely and go straight to form
      newBatchModal.classList.remove('hidden');
      modalStoreName.value = '';
      modalStoreLocation.value = '';
      modalStoreName.focus();
    }
  });

  // Choice 1: Finish it — cancel starting a new batch, stay on the current one
  if (btnWarningFinish) {
    btnWarningFinish.addEventListener('click', () => {
      draftWarningModal.classList.add('hidden');
    });
  }

  // Choice 2: Send to Review — submit the current batch immediately, then proceed to the new batch form
  if (btnWarningSendReview) {
    btnWarningSendReview.addEventListener('click', async () => {
      if (!activeBatch) {
        draftWarningModal.classList.add('hidden');
        newBatchModal.classList.remove('hidden');
        return;
      }

      const items = activeBatch.items || [];
      const analyzingCount = items.filter(i => i.analysis_status === 'analyzing').length;
      if (analyzingCount > 0) {
        await showAlert('Analysis In Progress', `Please wait: ${analyzingCount} item(s) are still undergoing background analysis.`, 'warning');
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/batches/${activeBatch.batch_id}/submit`, { method: 'POST' });
        if (!res.ok) throw new Error('Submission failed');
        await showAlert('Batch Submitted', `✓ Batch [${activeBatch.batch_id}] submitted to jurisdictional review queue!`, 'success');

        draftWarningModal.classList.add('hidden');
        newBatchModal.classList.remove('hidden');
        modalStoreName.value = '';
        modalStoreLocation.value = '';
        modalStoreName.focus();
      } catch (err) {
        await showAlert('Submission Error', `Error submitting batch: ${err.message}`, 'error');
      }
    });
  }

  // Choice 3: Save as Draft — mark current batch as a draft, then proceed to the new batch form. The draft is not lost.
  if (btnWarningSaveDraft) {
    btnWarningSaveDraft.addEventListener('click', () => {
      draftWarningModal.classList.add('hidden');
      newBatchModal.classList.remove('hidden');
      modalStoreName.value = '';
      modalStoreLocation.value = '';
      modalStoreName.focus();
    });
  }

  if (btnCloseDraftWarningModal) {
    btnCloseDraftWarningModal.addEventListener('click', () => {
      draftWarningModal.classList.add('hidden');
    });
  }

  if (draftWarningModal) {
    draftWarningModal.addEventListener('click', (e) => {
      if (e.target === draftWarningModal) draftWarningModal.classList.add('hidden');
    });
  }

  btnCloseNewBatchModal.addEventListener('click', () => {
    newBatchModal.classList.add('hidden');
  });

  newBatchModal.addEventListener('click', (e) => {
    if (e.target === newBatchModal) newBatchModal.classList.add('hidden');
  });

  newBatchSessionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      store_name: modalStoreName.value.trim(),
      store_location: modalStoreLocation.value.trim(),
      inspector_id: user.badge_number || user.username,
      inspector_name: user.full_name,
      jurisdiction: user.jurisdiction || 'Zone 4'
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/batches/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to create new batch session');
      const newBatchData = await res.json();
      
      newBatchModal.classList.add('hidden');
      modalStoreName.value = '';
      modalStoreLocation.value = '';

      sessionStorage.setItem('labelLens_active_batch_id', newBatchData.batch_id);
      await loadInspectorDashboard();
      switchTab('camera');
      await showAlert('Batch Activated', '✓ New inspection batch session activated.', 'success');
    } catch (err) {
      await showAlert('Error', `Error: ${err.message}`, 'error');
    }
  });

  // =========================================================================
  // 5b. CAMERA EMPTY STATE & SWITCH BATCH MANAGEMENT
  // =========================================================================
  if (btnCameraStartNewBatch) {
    btnCameraStartNewBatch.addEventListener('click', () => {
      if (btnTriggerNewBatchModal) btnTriggerNewBatchModal.click();
    });
  }

  async function updateCameraTabEmptyState() {
    if (!cameraNoBatchEmptyState) return;
    if (activeBatch && activeBatch.batch_id) {
      cameraNoBatchEmptyState.classList.add('hidden');
      if (uploadTriggerContainer) uploadTriggerContainer.classList.remove('hidden');
      if (cameraItemListCard) cameraItemListCard.classList.remove('hidden');
    } else {
      cameraNoBatchEmptyState.classList.remove('hidden');
      if (uploadTriggerContainer) uploadTriggerContainer.classList.add('hidden');
      if (cameraItemListCard) cameraItemListCard.classList.add('hidden');

      // Fetch unsubmitted drafts to display in camera empty state
      try {
        const inspectorId = user.badge_number || user.username || 'LMO-DL-04';
        const res = await fetch(`${API_BASE_URL}/api/batches?inspector_id=${encodeURIComponent(inspectorId)}`);
        if (res.ok) {
          const allBatches = await res.json();
          const drafts = allBatches.filter(b => b.status === 'draft');
          if (drafts.length > 0 && cameraDraftsNotice && cameraDraftsList) {
            cameraDraftsNotice.classList.remove('hidden');
            cameraDraftsList.innerHTML = '';
            drafts.forEach(db => {
              const card = document.createElement('div');
              card.className = 'switch-batch-item';
              card.style.background = '#FFFFFF';
              const count = db.item_count || 0;
              const dateStr = db.created_at ? new Date(db.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Saved draft';

              card.innerHTML = `
                <div class="switch-batch-item-left">
                  <div class="switch-batch-title-row">
                    <span class="summary-pill">${escapeHtml(db.batch_id)}</span>
                    <span class="history-status-tag draft" style="background:#FEF3C7; color:#92400E; border-color:#FDE68A;">Draft</span>
                  </div>
                  <h4 class="switch-batch-store">${escapeHtml(db.store_name || 'Retail Store')}</h4>
                  <span class="switch-batch-meta">${escapeHtml(db.store_location || 'Jurisdiction')} • ${count} item(s) • ${dateStr}</span>
                </div>
                <button type="button" class="btn-resume-draft" data-batch-id="${db.batch_id}">
                  Resume Batch →
                </button>
              `;

              card.querySelector('.btn-resume-draft').addEventListener('click', async (e) => {
                e.stopPropagation();
                await resumeDraftBatch(db.batch_id);
              });

              cameraDraftsList.appendChild(card);
            });
          } else if (cameraDraftsNotice) {
            cameraDraftsNotice.classList.add('hidden');
          }
        }
      } catch (e) {
        console.warn('Could not fetch drafts for camera empty state:', e);
      }
    }
  }

  // Switch Batch Modal
  async function openSwitchBatchModal() {
    if (!switchBatchModal) return;
    switchBatchModal.classList.remove('hidden');
    await renderSwitchBatchModalContent();
  }

  function closeSwitchBatchModal() {
    if (switchBatchModal) switchBatchModal.classList.add('hidden');
  }

  if (btnSwitchBatch) btnSwitchBatch.addEventListener('click', openSwitchBatchModal);
  if (btnCloseSwitchBatchModal) btnCloseSwitchBatchModal.addEventListener('click', closeSwitchBatchModal);
  if (switchBatchModal) {
    switchBatchModal.addEventListener('click', (e) => {
      if (e.target === switchBatchModal) closeSwitchBatchModal();
    });
  }

  async function renderSwitchBatchModalContent() {
    if (!switchDraftsList || !switchSubmittedList) return;
    switchDraftsList.innerHTML = '<div class="table-empty">Loading drafts...</div>';
    switchSubmittedList.innerHTML = '<div class="table-empty">Loading submitted batches...</div>';

    try {
      const inspectorId = user.badge_number || user.username || 'LMO-DL-04';
      const res = await fetch(`${API_BASE_URL}/api/batches?inspector_id=${encodeURIComponent(inspectorId)}`);
      if (!res.ok) throw new Error('Failed to load batches');
      const allBatches = await res.json();

      const activeId = activeBatch ? activeBatch.batch_id : null;
      const drafts = allBatches.filter(b => b.status === 'draft' && b.batch_id !== activeId);
      const submitted = allBatches.filter(b => b.status !== 'draft');

      if (switchDraftsCount) switchDraftsCount.textContent = drafts.length;
      if (switchSubmittedCount) switchSubmittedCount.textContent = submitted.length;

      // Render Drafts
      if (drafts.length === 0) {
        switchDraftsList.innerHTML = '<div class="table-empty" style="padding: 0.75rem;">No other draft batches found.</div>';
      } else {
        switchDraftsList.innerHTML = '';
        drafts.forEach(db => {
          const card = document.createElement('div');
          card.className = 'switch-batch-item';
          const count = db.item_count || 0;
          const dateStr = db.created_at ? new Date(db.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Saved draft';

          card.innerHTML = `
            <div class="switch-batch-item-left">
              <div class="switch-batch-title-row">
                <span class="summary-pill">${escapeHtml(db.batch_id)}</span>
                <span class="history-status-tag draft" style="background:#FEF3C7; color:#92400E; border-color:#FDE68A;">Draft</span>
              </div>
              <h4 class="switch-batch-store">${escapeHtml(db.store_name || 'Retail Store')}</h4>
              <span class="switch-batch-meta">${escapeHtml(db.store_location || 'Jurisdiction')} • ${count} item(s) • ${dateStr}</span>
            </div>
            <button type="button" class="btn-resume-draft" data-batch-id="${db.batch_id}">
              Resume Batch →
            </button>
          `;

          card.querySelector('.btn-resume-draft').addEventListener('click', async (e) => {
            e.stopPropagation();
            closeSwitchBatchModal();
            await resumeDraftBatch(db.batch_id);
          });

          switchDraftsList.appendChild(card);
        });
      }

      // Render Submitted
      if (submitted.length === 0) {
        switchSubmittedList.innerHTML = '<div class="table-empty" style="padding: 0.75rem;">No submitted batches yet. Submitted batches appear here and in the History tab.</div>';
      } else {
        switchSubmittedList.innerHTML = '';
        submitted.forEach(sb => {
          const card = document.createElement('div');
          card.className = 'switch-batch-item';
          const count = sb.item_count || 0;
          const subDate = sb.submitted_at ? new Date(sb.submitted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Submitted';
          const statusText = sb.status === 'completed' ? 'Completed' : 'Pending Review';
          const statusClass = sb.status === 'completed' ? 'completed' : 'pending_review';

          card.innerHTML = `
            <div class="switch-batch-item-left">
              <div class="switch-batch-title-row">
                <span class="summary-pill">${escapeHtml(sb.batch_id)}</span>
                <span class="history-status-tag ${statusClass}">${statusText}</span>
              </div>
              <h4 class="switch-batch-store">${escapeHtml(sb.store_name || 'Retail Store')}</h4>
              <span class="switch-batch-meta">${escapeHtml(sb.store_location || 'Jurisdiction')} • ${count} item(s) • ${subDate}</span>
            </div>
            <button type="button" class="btn-secondary btn-view-submitted-batch" data-batch-id="${sb.batch_id}" style="min-height: 40px; font-size: 0.8rem; padding: 0 0.85rem; white-space: nowrap;">
              View in History →
            </button>
          `;

          card.querySelector('.btn-view-submitted-batch').addEventListener('click', (e) => {
            e.stopPropagation();
            closeSwitchBatchModal();
            switchTab('history');
            openHistoryBatchDetail(sb.batch_id);
          });

          switchSubmittedList.appendChild(card);
        });
      }
    } catch (err) {
      switchDraftsList.innerHTML = `<div class="table-empty" style="color:#DC2626;">Error: ${escapeHtml(err.message)}</div>`;
    }
  }

  async function resumeDraftBatch(batchId) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/batches/${batchId}/activate`, { method: 'POST' });
      if (!res.ok) throw new Error('Could not activate draft batch');
      const activatedBatch = await res.json();

      activeBatch = activatedBatch;
      sessionStorage.setItem('labelLens_active_batch_id', batchId);

      if (summaryBatchId) summaryBatchId.textContent = activeBatch.batch_id;
      if (summaryStoreName) summaryStoreName.textContent = `${activeBatch.store_name} • ${activeBatch.store_location || ''}`;
      if (batchTabBatchId) batchTabBatchId.textContent = activeBatch.batch_id;
      if (batchTabStoreName) batchTabStoreName.textContent = `${activeBatch.store_name} • ${activeBatch.store_location || ''}`;
      if (batchTabStatusBadge) {
        batchTabStatusBadge.textContent = 'Active Session';
        batchTabStatusBadge.className = 'history-status-tag pending_review';
        batchTabStatusBadge.style.background = '#ECFDF5';
        batchTabStatusBadge.style.color = '#047857';
        batchTabStatusBadge.style.borderColor = '#A7F3D0';
      }

      const count = (activeBatch.items || []).length;
      if (summaryItemCount) summaryItemCount.textContent = `${count} / 15`;
      if (tabBatchBadge) tabBatchBadge.textContent = count;

      stagedEdits = {};
      stagedBackgroundFiles = {};

      renderBatchItemList();
      updateCameraTabEmptyState();
      switchTab('camera');
      await showAlert('Batch Resumed', `✓ Resumed draft batch [${batchId}]! All ${count} item(s) loaded.`, 'success');
    } catch (err) {
      await showAlert('Error', `Error resuming draft batch: ${err.message}`, 'error');
    }
  }

  // Submit Batch for Review (Renamed from Dossier) - Uses Styled In-App Confirmation Modal
  btnSubmitBatch.addEventListener('click', async () => {
    if (!activeBatch) return;

    const items = activeBatch.items || [];
    const analyzingCount = items.filter(i => i.analysis_status === 'analyzing').length;
    if (analyzingCount > 0) {
      await showAlert('Analysis In Progress', `Please wait: ${analyzingCount} item(s) are still undergoing background analysis.`, 'warning');
      return;
    }

    const ok = await showConfirm(
      'Submit Batch for Review',
      `Submit batch [${activeBatch.batch_id}] (${items.length} items) to the Reviewing Officer?`
    );
    if (!ok) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/batches/${activeBatch.batch_id}/submit`, { method: 'POST' });
      if (!res.ok) throw new Error('Submission failed');
      await showAlert('Batch Submitted', `✓ Batch [${activeBatch.batch_id}] submitted to jurisdictional review queue!`, 'success');
      await loadInspectorDashboard();
      switchTab('history');
    } catch (err) {
      await showAlert('Submission Error', `Error submitting batch: ${err.message}`, 'error');
    }
  });

  // =========================================================================
  // 6. "NEEDS HUMAN REVIEW" LOGIC & ITEM LIST RENDERING
  // =========================================================================
  function isSingleUnitPackage(item) {
    if (!item) return false;
    if (item.is_single_unit === true || item.single_unit === true) return true;

    const declVals = item.declaration_values || {};
    const netQty = (declVals.net_quantity || '').toLowerCase().trim();
    if (/^1\s*(?:n|u|piece|pc|unit|item|number|count|nos|no|pk|pack)?$/i.test(netQty)) return true;
    if (/\b1\s*(?:n|u|piece|pc|unit|item|number|count|nos|no)\b/i.test(netQty)) return true;

    const text = ((item.cleaned_summary || '') + ' ' + (item.raw_ocr_text || '') + ' ' + (item.product_name || '')).toLowerCase();
    if (/\b(?:net\s*(?:qty|quantity|count)?\s*[:.]?\s*1\s*(?:n|u|piece|pc|unit|item|number|nos|no))\b/i.test(text)) return true;
    if (/\b(?:contains?|quantity|qty)\s*[:.]?\s*1\s*(?:n|u|piece|pc|unit|item|number|nos|no)\b/i.test(text)) return true;
    if (/\b(?:single\s*unit|single\s*piece|1\s*unit\s*pack|single\s*item)\b/i.test(text)) return true;

    return false;
  }

  function getItemReviewStatus(item) {
    if (!item) return { needsReview: false, reasons: [], summaryReason: '' };
    if (item.analysis_status === 'analyzing') {
      return { needsReview: false, reasons: [], summaryReason: '' };
    }
    if (item.analysis_status === 'failed') {
      return { needsReview: false, reasons: [], summaryReason: '' };
    }

    const reasons = [];

    // 1. Confidence score below 85%
    if (typeof item.confidence === 'number') {
      const confPct = item.confidence <= 1.0 ? Math.round(item.confidence * 100) : Math.round(item.confidence);
      if (confPct < 85) {
        reasons.push(`Confidence ${confPct}% (< 85%)`);
      }
    }

    // 2. Mandatory declarations missing per Rule 6 (respecting single-unit USP exemption)
    const isSingle = isSingleUnitPackage(item);
    const staged = stagedEdits[item.item_id];
    const foundKeys = new Set(staged ? staged.declarations_found : (item.declarations_found || []));

    const mandatoryList = [
      { key: 'commodity_name', name: 'Commodity Name' },
      { key: 'net_quantity', name: 'Net Quantity' },
      { key: 'mrp', name: 'MRP' },
      { key: 'manufacturing_date', name: 'Date of Mfg/Packing' },
      { key: 'manufacturer_details', name: 'Manufacturer Details' },
      { key: 'consumer_care', name: 'Consumer Care' },
      { key: 'country_of_origin', name: 'Country of Origin' },
      { key: 'unit_sale_price', name: 'Unit Sale Price (USP)' }
    ];

    const missingLabels = [];
    mandatoryList.forEach(field => {
      if (field.key === 'unit_sale_price' && isSingle) {
        // Single-unit items are exempt from Unit Sale Price (USP)
        return;
      }
      if (!foundKeys.has(field.key)) {
        missingLabels.push(field.name);
      }
    });

    if (missingLabels.length > 0) {
      reasons.push(`Missing: ${missingLabels.join(', ')}`);
    }

    return {
      needsReview: reasons.length > 0,
      reasons: reasons,
      summaryReason: reasons.join(' • ')
    };
  }

  function renderBatchItemList() {
    const tables = [
      { tbody: cameraItemListTableBody, isCameraTab: true },
      { tbody: itemListTableBody, isCameraTab: false }
    ].filter(t => t.tbody);

    if (tables.length === 0) return;

    if (!activeBatch) {
      tables.forEach(({ tbody }) => {
        tbody.innerHTML = '<tr><td colspan="7" class="table-empty">No active batch session. Tap "+ New Batch" in the top strip to begin.</td></tr>';
      });
      return;
    }

    const items = activeBatch.items || [];
    if (statTotalItems) statTotalItems.textContent = items.length;

    const compliant = items.filter(i => i.compliant === true).length;
    const nonCompliant = items.filter(i => i.compliant === false).length;
    if (statCompliantItems) statCompliantItems.textContent = compliant;
    if (statNonCompliantItems) statNonCompliantItems.textContent = nonCompliant;

    if (statQuotaText) statQuotaText.textContent = `${items.length} / 15`;
    if (summaryItemCount) summaryItemCount.textContent = `${items.length} / 15`;
    const pct = Math.min(Math.round((items.length / 15) * 100), 100);
    if (statProgressBar) statProgressBar.style.width = `${pct}%`;

    const hasAnalyzing = items.some(i => i.analysis_status === 'analyzing');
    if (btnSubmitBatch) {
      btnSubmitBatch.disabled = (items.length === 0 || hasAnalyzing);
    }

    tables.forEach(({ tbody, isCameraTab }) => {
      if (items.length === 0) {
        tbody.innerHTML = isCameraTab
          ? '<tr><td colspan="7" class="table-empty">No items in this batch yet. Tap "Upload Label" above to begin capturing items.</td></tr>'
          : '<tr><td colspan="7" class="table-empty">No items in this batch yet. Tap "Upload Label" in the Camera tab to begin.</td></tr>';
        return;
      }

      tbody.innerHTML = '';
      items.forEach((item, idx) => {
        const isExpanded = (expandedItemId === item.item_id);

        // Initialize staged edits for Batch tab if expanded
        if (!isCameraTab && isExpanded && !stagedEdits[item.item_id]) {
          stagedEdits[item.item_id] = {
            product_name: item.product_name || '',
            product_category: item.product_category || 'Packaged Commodity',
            photos: JSON.parse(JSON.stringify(item.photos || [])),
            declarations_found: [...(item.declarations_found || [])],
            declarations_missing: [...(item.declarations_missing || [])],
            declaration_values: extractInitialDeclarationValues(item)
          };
        }

        const tr = document.createElement('tr');
        tr.className = `manifest-item-row ${isExpanded ? 'row-expanded' : ''}`;
        tr.dataset.itemId = item.item_id;

        const photos = (!isCameraTab && isExpanded && stagedEdits[item.item_id])
          ? stagedEdits[item.item_id].photos
          : (item.photos || []);

        let thumbHtml = '';
        if (photos.length > 0) {
          thumbHtml = photos.map(p => {
            const src = p.url.startsWith('data:') ? p.url : (API_BASE_URL + p.url);
            return `<img src="${src}" class="manifest-thumb" title="${escapeHtml(p.angle || '')}" />`;
          }).join('');
        } else {
          thumbHtml = '<span style="color:#A1A1AA; font-size:0.75rem;">No photo</span>';
        }

        // Verdict column: Analyzing..., Failed [Retry], Compliant, or Non-Compliant
        let verdictHtml = '';
        if (item.analysis_status === 'analyzing') {
          verdictHtml = '<span class="status-pill status-analyzing"><span class="analyzing-spinner"></span> Analyzing...</span>';
        } else if (item.analysis_status === 'failed') {
          verdictHtml = `<span class="status-pill status-failed">⚠️ Failed <button type="button" class="btn-retry-inline" data-id="${item.item_id}">Retry</button></span>`;
        } else if (item.compliant) {
          verdictHtml = '<span class="status-pill status-compliant">Compliant</span>';
        } else {
          verdictHtml = '<span class="status-pill status-noncompliant">Non-Compliant</span>';
        }

        // Passive "Needs Review" icon/badge & reason (independent of compliance verdict)
        let reviewBadgeHtml = '';
        if (item.analysis_status !== 'analyzing' && item.analysis_status !== 'failed') {
          const reviewStatus = getItemReviewStatus(item);
          if (reviewStatus.needsReview) {
            reviewBadgeHtml = `
              <div class="needs-review-container" title="${escapeHtml(reviewStatus.summaryReason)}">
                <span class="badge-needs-review" data-item-id="${item.item_id}" role="button" tabindex="0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  Needs Review
                </span>
                <span class="needs-review-hint">${escapeHtml(reviewStatus.summaryReason)}</span>
              </div>
            `;
          }
        }

        const actionLabel = isExpanded
          ? 'Collapse ▲'
          : (isCameraTab ? 'Photos ▾' : 'Edit ▾');

        tr.innerHTML = `
          <td><div class="manifest-thumb-row">${thumbHtml}</div></td>
          <td>
            <strong>${escapeHtml(item.product_name || 'Item ' + (idx + 1))}</strong>
            <div style="font-family:var(--font-mono); font-size:0.72rem; color:var(--text-secondary);">${item.item_id}</div>
          </td>
          <td>
            <div class="verdict-cell-wrap">
              ${verdictHtml}
              ${reviewBadgeHtml}
            </div>
          </td>
          <td><span class="category-pill">${escapeHtml(item.product_category || 'General')}</span></td>
          <td>${photos.length} panel(s)</td>
          <td>${item.confidence ? Math.round(item.confidence * 100) + '%' : '—'}</td>
          <td style="text-align: right; white-space: nowrap;">
            <button type="button" class="btn-item-action btn-expand-item" title="${isCameraTab ? 'View item photos' : 'Edit statutory declarations'}">
              ${actionLabel}
            </button>
            <button type="button" class="btn-item-action btn-remove-item" title="Remove item">
              ✕
            </button>
          </td>
        `;

        // Retry button click listener
        const btnRetry = tr.querySelector('.btn-retry-inline');
        if (btnRetry) {
          btnRetry.addEventListener('click', (e) => {
            e.stopPropagation();
            retryItemAnalysis(item.item_id);
          });
        }

        const badgeReview = tr.querySelector('.badge-needs-review');
        if (badgeReview) {
          badgeReview.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleItemExpansion(item.item_id);
          });
        }

        tr.querySelector('.btn-expand-item').addEventListener('click', (e) => {
          e.stopPropagation();
          toggleItemExpansion(item.item_id);
        });

        tr.addEventListener('click', (e) => {
          if (e.target.closest('button')) return;
          toggleItemExpansion(item.item_id);
        });

        tr.querySelector('.btn-remove-item').addEventListener('click', async (e) => {
          e.stopPropagation();
          const ok = await showConfirm('Remove Item', `Remove item "${item.product_name}" from this batch?`, { danger: true });
          if (ok) {
            if (item.analysis_status !== 'analyzing') {
              try {
                await fetch(`${API_BASE_URL}/api/inspector/items/${item.item_id}`, { method: 'DELETE' });
              } catch (err) {
                console.warn('Backend delete ignored:', err);
              }
            }
            activeBatch.items = (activeBatch.items || []).filter(i => i.item_id !== item.item_id);
            if (expandedItemId === item.item_id) {
              expandedItemId = null;
              delete stagedEdits[item.item_id];
            }
            renderBatchItemList();
          }
        });

        tbody.appendChild(tr);

        // Render inline detail row if expanded
        if (isExpanded) {
          const trDetail = document.createElement('tr');
          trDetail.className = 'item-detail-row';
          const tdDetail = document.createElement('td');
          tdDetail.colSpan = 7;
          tdDetail.className = 'item-detail-cell';

          // Split responsibilities: Camera tab shows photos only; Batch tab shows declarations editor
          const detailCard = isCameraTab
            ? renderCameraPhotosDetailCard(item)
            : renderBatchDeclarationsDetailCard(item);

          tdDetail.appendChild(detailCard);
          trDetail.appendChild(tdDetail);
          tbody.appendChild(trDetail);
        }
      });
    });
  }

  function toggleItemExpansion(itemId) {
    if (expandedItemId === itemId) {
      expandedItemId = null;
      delete stagedEdits[itemId];
    } else {
      expandedItemId = itemId;
    }
    renderBatchItemList();
  }

  // =========================================================================
  // 7. CAMERA TAB: PHOTOS-ONLY INLINE DETAIL CARD
  // =========================================================================
  function renderCameraPhotosDetailCard(item) {
    const card = document.createElement('div');
    card.className = 'item-detail-card camera-photos-card';

    const photos = item.photos || [];
    let photosHtml = '';
    photos.forEach((p, pIdx) => {
      const src = p.url.startsWith('data:') ? p.url : (API_BASE_URL + p.url);
      const angleLabel = p.angle ? p.angle.toUpperCase() : `PHOTO #${pIdx + 1}`;
      photosHtml += `
        <div class="camera-photo-thumb-card" data-idx="${pIdx}" title="Tap to enlarge full-size">
          <img src="${src}" alt="${escapeHtml(angleLabel)}" class="camera-thumb-img" />
          <div class="camera-thumb-overlay">
            <span class="camera-thumb-label">${escapeHtml(angleLabel)}</span>
            <span class="camera-thumb-zoom-cue">🔍 Enlarge</span>
          </div>
        </div>
      `;
    });

    const reviewStatus = getItemReviewStatus(item);
    let reviewNoticeHtml = '';
    if (reviewStatus.needsReview) {
      reviewNoticeHtml = `
        <div class="item-detail-review-notice">
          <div class="review-notice-icon-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <div class="review-notice-text-wrap">
            <div class="review-notice-headline">Needs Human Review</div>
            <div class="review-notice-sub">${escapeHtml(reviewStatus.summaryReason)}</div>
          </div>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="detail-card-inner">
        <div class="detail-card-header">
          <div class="detail-title-col">
            <h4 class="detail-heading">${escapeHtml(item.product_name || item.item_id)} — Item Photos</h4>
            <span class="detail-meta">${item.item_id} • ${photos.length} photo(s) • Tap any photo to inspect large, replace, or remove</span>
          </div>
          <button type="button" class="btn-detail-close" title="Close">✕</button>
        </div>

        ${reviewNoticeHtml}

        <div class="camera-photos-gallery-section">
          <div class="camera-photos-gallery">
            ${photosHtml}
            <button type="button" class="btn-camera-add-photo-thumb" id="btnCameraAddPhotoThumb" title="Add another angle">
              <span class="add-icon">+</span>
              <span class="add-text">Add Photo</span>
            </button>
          </div>
        </div>
      </div>
    `;

    card.querySelector('.btn-detail-close').addEventListener('click', () => {
      expandedItemId = null;
      renderBatchItemList();
    });

    card.querySelectorAll('.camera-photo-thumb-card').forEach(thumb => {
      thumb.addEventListener('click', () => {
        const idx = parseInt(thumb.dataset.idx, 10);
        openPhotoLightbox(item, idx, false);
      });
    });

    const btnAdd = card.querySelector('#btnCameraAddPhotoThumb');
    if (btnAdd) {
      btnAdd.addEventListener('click', () => {
        photoReplacingTarget = { itemId: item.item_id, photoIdx: -1 };
        inputReplacePhoto.value = '';
        inputReplacePhoto.click();
      });
    }

    return card;
  }

  // =========================================================================
  // 8. BATCH TAB: RULE 6 DECLARATIONS & STATUTORY EDITOR DETAIL CARD
  // =========================================================================
  function renderBatchDeclarationsDetailCard(item) {
    const staged = stagedEdits[item.item_id];
    const card = document.createElement('div');
    card.className = 'item-detail-card batch-declarations-card';

    // Photos Gallery HTML
    let photosHtml = '';
    staged.photos.forEach((p, pIdx) => {
      const src = p.url.startsWith('data:') ? p.url : (API_BASE_URL + p.url);
      photosHtml += `
        <div class="detail-photo-card" data-idx="${pIdx}">
          <img src="${src}" alt="${p.angle || 'Photo'}" class="detail-photo-img" />
          <div class="detail-photo-overlay">
            <span class="detail-photo-label">${p.angle ? p.angle.toUpperCase() : 'Photo ' + (pIdx + 1)}</span>
            <div class="detail-photo-btns">
              <button type="button" class="btn-photo-replace" data-idx="${pIdx}">Replace</button>
              <button type="button" class="btn-photo-remove" data-idx="${pIdx}">Remove</button>
            </div>
          </div>
        </div>
      `;
    });

    // Rule 6 Declarations HTML
    let declsHtml = '';
    RULE6_FIELDS.forEach(f => {
      const isPresent = staged.declarations_found.includes(f.key);
      let val = staged.declaration_values[f.key] || '';
      if (val === 'Extracted from label') val = '';
      const inputPlaceholder = isPresent
        ? (val ? 'Extracted or corrected value...' : 'Not detected — enter manually')
        : 'Marked absent on package';

      declsHtml += `
        <div class="decl-editor-card ${isPresent ? 'is-present' : 'is-absent'}" data-key="${f.key}">
          <div class="decl-editor-top">
            <div class="decl-label-box">
              <span class="decl-title">${f.name}</span>
              <span class="decl-sub-tag">${f.sub} ${f.mandatory ? '• Mandatory' : '• Conditional'}</span>
            </div>
            <div class="decl-toggle-pill-group">
              <button type="button" class="btn-decl-toggle ${isPresent ? 'active-present' : ''}" data-key="${f.key}" data-val="present">
                ✓ Present
              </button>
              <button type="button" class="btn-decl-toggle ${!isPresent ? 'active-absent' : ''}" data-key="${f.key}" data-val="absent">
                ✕ Absent
              </button>
            </div>
          </div>
          <div class="decl-input-row">
            <input type="text" class="decl-field-input" data-key="${f.key}" value="${escapeHtml(val)}" placeholder="${escapeHtml(inputPlaceholder)}" ${!isPresent ? 'disabled' : ''} />
          </div>
        </div>
      `;
    });

    const reviewStatus = getItemReviewStatus(item);
    let reviewNoticeHtml = '';
    if (reviewStatus.needsReview) {
      reviewNoticeHtml = `
        <div class="item-detail-review-notice">
          <div class="review-notice-icon-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <div class="review-notice-text-wrap">
            <div class="review-notice-headline">Needs Human Review</div>
            <div class="review-notice-sub">${escapeHtml(reviewStatus.summaryReason)}</div>
          </div>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="detail-card-inner">
        <div class="detail-card-header">
          <div class="detail-title-col">
            <h4 class="detail-heading">Edit Item: ${escapeHtml(staged.product_name || item.item_id)}</h4>
            <span class="detail-meta">${item.item_id} • ${staged.photos.length} photo(s) • Changes staged until saved</span>
          </div>
          <button type="button" class="btn-detail-close" title="Close detail">✕</button>
        </div>

        ${reviewNoticeHtml}

        <div class="detail-general-row">
          <div class="detail-general-field">
            <label>Product / Commodity Name</label>
            <input type="text" class="input-detail-prodname" value="${escapeHtml(staged.product_name)}" />
          </div>
          <div class="detail-general-field">
            <label>Category</label>
            <input type="text" class="input-detail-prodcat" value="${escapeHtml(staged.product_category)}" />
          </div>
        </div>

        <div class="detail-photos-section">
          <div class="detail-sub-header">
            <strong>Item Photos (${staged.photos.length})</strong>
            <button type="button" class="btn-detail-add-photo">+ Add Photo</button>
          </div>
          <div class="detail-photos-gallery">
            ${photosHtml}
          </div>
        </div>

        <div class="detail-decls-section">
          <div class="detail-sub-header">
            <strong>Rule 6 Statutory Declarations</strong>
            <small>Toggle Present/Absent and edit extracted declaration text</small>
          </div>
          <div class="detail-decls-grid">
            ${declsHtml}
          </div>
        </div>

        <div class="detail-bottom-bar">
          <div class="staged-status-indicator">
            <span class="staged-dot"></span>
            <span>Edits recompute compliance verdict upon saving</span>
          </div>
          <div class="detail-action-buttons">
            <button type="button" class="btn-secondary btn-detail-cancel">Cancel</button>
            <button type="button" class="btn-primary btn-detail-save">
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    `;

    // Bind events
    card.querySelector('.btn-detail-close').addEventListener('click', () => {
      delete stagedEdits[item.item_id];
      expandedItemId = null;
      renderBatchItemList();
    });

    card.querySelector('.btn-detail-cancel').addEventListener('click', () => {
      delete stagedEdits[item.item_id];
      expandedItemId = null;
      renderBatchItemList();
    });

    card.querySelector('.input-detail-prodname').addEventListener('input', (e) => {
      staged.product_name = e.target.value;
    });

    card.querySelector('.input-detail-prodcat').addEventListener('input', (e) => {
      staged.product_category = e.target.value;
    });

    // Toggle Present / Absent
    card.querySelectorAll('.btn-decl-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        const val = btn.dataset.val;
        const cardEl = btn.closest('.decl-editor-card');
        const inputEl = cardEl.querySelector('.decl-field-input');

        if (val === 'present') {
          if (!staged.declarations_found.includes(key)) staged.declarations_found.push(key);
          staged.declarations_missing = staged.declarations_missing.filter(k => k !== key);
          cardEl.classList.add('is-present');
          cardEl.classList.remove('is-absent');
          inputEl.disabled = false;
          inputEl.placeholder = 'Extracted or corrected value...';
        } else {
          if (!staged.declarations_missing.includes(key)) staged.declarations_missing.push(key);
          staged.declarations_found = staged.declarations_found.filter(k => k !== key);
          cardEl.classList.remove('is-present');
          cardEl.classList.add('is-absent');
          inputEl.disabled = true;
          inputEl.placeholder = 'Marked absent on package';
        }

        // Toggle active styling
        cardEl.querySelectorAll('.btn-decl-toggle').forEach(b => {
          b.classList.remove('active-present', 'active-absent');
        });
        if (val === 'present') {
          btn.classList.add('active-present');
        } else {
          btn.classList.add('active-absent');
        }
      });
    });

    // Declaration text inputs
    card.querySelectorAll('.decl-field-input').forEach(inp => {
      inp.addEventListener('input', () => {
        const key = inp.dataset.key;
        staged.declaration_values[key] = inp.value;
      });
    });

    // Photo Replace & Remove
    card.querySelectorAll('.btn-photo-replace').forEach(btn => {
      btn.addEventListener('click', () => {
        const pIdx = parseInt(btn.dataset.idx, 10);
        photoReplacingTarget = { itemId: item.item_id, photoIdx: pIdx };
        inputReplacePhoto.value = '';
        inputReplacePhoto.click();
      });
    });

    card.querySelectorAll('.btn-photo-remove').forEach(btn => {
      btn.addEventListener('click', async () => {
        const pIdx = parseInt(btn.dataset.idx, 10);
        if (staged.photos.length <= 1) {
          await showAlert('Cannot remove the only photo. Use Replace instead.', 'Photo Management');
          return;
        }
        staged.photos.splice(pIdx, 1);
        renderBatchItemList();
      });
    });

    card.querySelector('.btn-detail-add-photo').addEventListener('click', () => {
      photoReplacingTarget = { itemId: item.item_id, photoIdx: -1 };
      inputReplacePhoto.value = '';
      inputReplacePhoto.click();
    });

    card.querySelector('.btn-detail-save').addEventListener('click', async () => {
      const btnSave = card.querySelector('.btn-detail-save');
      btnSave.disabled = true;
      btnSave.innerHTML = '<span>Saving Changes...</span>';
      try {
        await handleSaveItemChanges(item.item_id);
      } catch (err) {
        await showAlert(`Error saving item: ${err.message}`, 'Save Failed');
        btnSave.disabled = false;
        btnSave.innerHTML = '<span>Save Changes</span>';
      }
    });

    return card;
  }

  function extractInitialDeclarationValues(item) {
    const vals = {};
    // Primary source: structured declaration_values saved by backend/AI
    if (item.declaration_values && typeof item.declaration_values === 'object') {
      Object.entries(item.declaration_values).forEach(([k, v]) => {
        if (v && typeof v === 'string' && v.trim() && v.trim() !== 'Extracted from label') {
          vals[k] = v.trim();
        }
      });
    }

    const text = (item.cleaned_summary || '') + '\n' + (item.raw_ocr_text || '');
    
    // Fallback or regex matches for common declarations if not yet populated
    if (!vals['mrp']) {
      const mrpMatch = text.match(/(?:MRP|₹|Rs\.?)\s*([\d,.]+)/i);
      if (mrpMatch) vals['mrp'] = `₹ ${mrpMatch[1]}`;
    }

    if (!vals['net_quantity']) {
      const qtyMatch = text.match(/(?:Net\s*Qty|Net\s*Weight|Net\s*Quantity|Quantity)\s*[:.]?\s*([\d.]+\s*(?:g|kg|ml|l|gm|units|pieces))/i);
      if (qtyMatch) vals['net_quantity'] = qtyMatch[1];
    }

    if (!vals['manufacturing_date']) {
      const dateMatch = text.match(/(?:Mfg|Packed|Pkg|Pkd|Date)\s*[:.]?\s*([0-9]{1,2}[\/\-][0-9]{2,4}|[A-Za-z]{3}\s*[0-9]{2,4})/i);
      if (dateMatch) vals['manufacturing_date'] = dateMatch[1];
    }

    if (!vals['commodity_name'] && item.product_name) {
      vals['commodity_name'] = item.product_name;
    }

    RULE6_FIELDS.forEach(f => {
      if (!vals[f.key]) {
        vals[f.key] = '';
      }
    });

    return vals;
  }

  async function handleSaveItemChanges(itemId) {
    const staged = stagedEdits[itemId];
    if (!staged) return;

    // Recalculate Rule 6 compliance:
    const isSingle = isSingleUnitPackage({ ...item, ...staged });
    const mandatoryKeys = [
      'commodity_name', 'net_quantity', 'mrp', 'manufacturing_date',
      'manufacturer_details', 'consumer_care', 'country_of_origin', 'unit_sale_price'
    ];
    const requiredKeys = mandatoryKeys.filter(k => !(k === 'unit_sale_price' && isSingle));
    const isCompliant = requiredKeys.every(k => staged.declarations_found.includes(k));

    const payload = {
      product_name: staged.product_name,
      product_category: staged.product_category,
      photos: staged.photos,
      declarations_found: staged.declarations_found,
      declarations_missing: staged.declarations_missing,
      declaration_values: staged.declaration_values,
      compliant: isCompliant
    };

    const res = await fetch(`${API_BASE_URL}/api/inspector/items/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Failed to update item record');
    const updated = await res.json();

    const idx = (activeBatch.items || []).findIndex(i => i.item_id === itemId);
    if (idx !== -1) {
      activeBatch.items[idx] = updated;
    }

    delete stagedEdits[itemId];
    expandedItemId = null;
    renderBatchItemList();
    await showAlert(`Item updated successfully!\n\nNew verdict: ${updated.compliant ? 'COMPLIANT' : 'NON-COMPLIANT'}`, 'Item Changes Saved');
  }

  // =========================================================================
  // 9. FULL-SIZE PHOTO LIGHTBOX MODAL CONTROLLER
  // =========================================================================
  function openPhotoLightbox(item, photoIdx, isReadOnly = false) {
    activeLightboxItem = item;
    activeLightboxPhotoIdx = photoIdx;

    const photos = item.photos || [];
    const photo = photos[photoIdx];
    if (!photo) return;

    const src = photo.url.startsWith('data:') ? photo.url : (API_BASE_URL + photo.url);
    lightboxImg.src = src;
    const angleText = photo.angle ? photo.angle.toUpperCase() : `PHOTO #${photoIdx + 1}`;
    lightboxTitle.textContent = angleText;
    lightboxSubtitle.textContent = `${item.product_name || item.item_id} • High-resolution item inspection`;

    if (isReadOnly) {
      btnLightboxReplace.classList.add('hidden');
      btnLightboxRemove.classList.add('hidden');
    } else {
      btnLightboxReplace.classList.remove('hidden');
      btnLightboxRemove.classList.remove('hidden');
    }

    photoLightboxModal.classList.remove('hidden');
  }

  function closePhotoLightbox() {
    photoLightboxModal.classList.add('hidden');
    activeLightboxItem = null;
    activeLightboxPhotoIdx = null;
  }

  btnLightboxClose.addEventListener('click', closePhotoLightbox);
  btnLightboxKeep.addEventListener('click', closePhotoLightbox);
  photoLightboxModal.addEventListener('click', (e) => {
    if (e.target === photoLightboxModal) closePhotoLightbox();
  });

  btnLightboxReplace.addEventListener('click', () => {
    if (!activeLightboxItem || activeLightboxPhotoIdx === null) return;
    photoReplacingTarget = {
      itemId: activeLightboxItem.item_id,
      photoIdx: activeLightboxPhotoIdx
    };
    inputReplacePhoto.value = '';
    inputReplacePhoto.click();
  });

  btnLightboxRemove.addEventListener('click', async () => {
    if (!activeLightboxItem || activeLightboxPhotoIdx === null) return;
    if (activeLightboxItem.photos.length <= 1) {
      await showAlert('Cannot remove the only photo on this item.', 'Photo Management');
      return;
    }
    const confirmed = await showConfirm('Remove this photo from item?', 'Confirm Photo Deletion', 'Remove Photo', 'Keep Photo');
    if (!confirmed) return;

    activeLightboxItem.photos.splice(activeLightboxPhotoIdx, 1);
    if (stagedEdits[activeLightboxItem.item_id]) {
      stagedEdits[activeLightboxItem.item_id].photos = JSON.parse(JSON.stringify(activeLightboxItem.photos));
    }
    closePhotoLightbox();
    renderBatchItemList();

    // Persist photo removal if committed
    if (activeLightboxItem.analysis_status !== 'analyzing') {
      try {
        await fetch(`${API_BASE_URL}/api/inspector/items/${activeLightboxItem.item_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photos: activeLightboxItem.photos })
        });
      } catch (err) {
        console.warn('Backend photo removal sync skipped:', err);
      }
    }
  });

  // Photo replacement file input listener
  if (inputReplacePhoto) {
    inputReplacePhoto.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file || !photoReplacingTarget) return;

      const dataUrl = await readFileDataUrl(file);
      const { itemId, photoIdx } = photoReplacingTarget;
      const item = (activeBatch.items || []).find(i => i.item_id === itemId);

      if (item) {
        if (photoIdx >= 0 && photoIdx < item.photos.length) {
          item.photos[photoIdx].url = dataUrl;
        } else if (photoIdx === -1) {
          item.photos.push({
            angle: `extra_${item.photos.length + 1}`,
            url: dataUrl
          });
        }

        if (stagedEdits[itemId]) {
          stagedEdits[itemId].photos = JSON.parse(JSON.stringify(item.photos));
        }

        // If lightbox is open for this photo, update it
        if (activeLightboxItem && activeLightboxItem.item_id === itemId && activeLightboxPhotoIdx === photoIdx) {
          lightboxImg.src = dataUrl;
        }

        renderBatchItemList();

        // Persist photo replacement if committed
        if (item.analysis_status !== 'analyzing') {
          try {
            await fetch(`${API_BASE_URL}/api/inspector/items/${itemId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ photos: item.photos })
            });
          } catch (err) {
            console.warn('Backend photo update sync skipped:', err);
          }
        }
      }
      photoReplacingTarget = null;
    });
  }

  // =========================================================================
  // 10. HISTORY TAB (Submitted Batches & Read-Only Review)
  // =========================================================================
  async function loadInspectorHistory() {
    if (!historyBatchesList) return;
    historyBatchesList.innerHTML = '<div class="table-empty">Loading submitted batches...</div>';
    historyBatchesView.classList.remove('hidden');
    historyBatchDetailView.classList.add('hidden');

    try {
      const inspectorId = user.badge_number || user.username || 'LMO-DL-04';
      const res = await fetch(`${API_BASE_URL}/api/inspector/history?inspector_id=${encodeURIComponent(inspectorId)}`);
      if (!res.ok) throw new Error('Failed to load history');
      const batches = await res.json();
      renderHistoryBatchesList(batches);
    } catch (err) {
      historyBatchesList.innerHTML = `<div class="table-empty" style="color:#DC2626;">Error loading batch history: ${escapeHtml(err.message)}</div>`;
    }
  }

  function renderHistoryBatchesList(batches) {
    if (!historyBatchesList) return;
    if (!batches || batches.length === 0) {
      historyBatchesList.innerHTML = '<div class="table-empty">No submitted batches found. Completed batches submitted to the Reviewing Officer will appear here.</div>';
      return;
    }

    historyBatchesList.innerHTML = '';
    batches.forEach(b => {
      const card = document.createElement('div');
      card.className = 'history-batch-card';
      const subDate = b.submitted_at
        ? new Date(b.submitted_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : (b.created_at ? new Date(b.created_at).toLocaleDateString() : 'Recent');

      card.innerHTML = `
        <div class="history-batch-header">
          <div class="history-batch-title-col">
            <div class="history-badge-row">
              <span class="summary-pill">${escapeHtml(b.batch_id)}</span>
              <span class="history-status-tag ${b.status}">${b.status === 'completed' ? 'Completed' : 'Pending Review'}</span>
            </div>
            <h4 class="history-store-title">${escapeHtml(b.store_name || 'Retail Store')}</h4>
            <span class="history-store-loc">${escapeHtml(b.store_location || 'Jurisdiction')}</span>
          </div>
          <button type="button" class="btn-secondary btn-view-history-batch" data-batch-id="${b.batch_id}">
            View Items →
          </button>
        </div>
        <div class="history-batch-footer">
          <div class="history-stats-pill-group">
            <span class="chip-total">${b.item_count || 0} items</span>
            <span class="chip-compliant">${b.compliant_count || 0} compliant</span>
            <span class="chip-noncompliant">${b.non_compliant_count || 0} non-compliant</span>
          </div>
          <span class="history-date-sub">Submitted: ${subDate}</span>
        </div>
      `;

      card.querySelector('.btn-view-history-batch').addEventListener('click', () => {
        openHistoryBatchDetail(b.batch_id);
      });

      historyBatchesList.appendChild(card);
    });
  }

  async function openHistoryBatchDetail(batchId) {
    try {
      historyBatchesView.classList.add('hidden');
      historyBatchDetailView.classList.remove('hidden');
      historyDetailTitle.textContent = `Batch: ${batchId}`;
      historyItemsTableBody.innerHTML = '<tr><td colspan="7" class="table-empty">Loading items...</td></tr>';

      const res = await fetch(`${API_BASE_URL}/api/batches/${batchId}`);
      if (!res.ok) throw new Error('Failed to load batch details');
      const batchData = await res.json();

      historyDetailTitle.textContent = `Batch: ${batchData.batch_id}`;
      const subDate = batchData.submitted_at ? new Date(batchData.submitted_at).toLocaleDateString() : '';
      historyDetailMeta.textContent = `${batchData.store_name} • ${batchData.store_location || ''} • Submitted: ${subDate}`;

      renderHistoryItemsTable(batchData.items || []);
    } catch (err) {
      await showAlert(`Error loading batch details: ${err.message}`, 'History Error');
      historyBatchesView.classList.remove('hidden');
      historyBatchDetailView.classList.add('hidden');
    }
  }

  btnHistoryBackToList.addEventListener('click', () => {
    historyBatchesView.classList.remove('hidden');
    historyBatchDetailView.classList.add('hidden');
    expandedHistoryItemId = null;
  });

  function renderHistoryItemsTable(items) {
    currentHistoryBatchItems = items || [];
    if (!historyItemsTableBody) return;

    if (items.length === 0) {
      historyItemsTableBody.innerHTML = '<tr><td colspan="7" class="table-empty">No items recorded in this batch.</td></tr>';
      return;
    }

    historyItemsTableBody.innerHTML = '';
    items.forEach((item, idx) => {
      const isExpanded = (expandedHistoryItemId === item.item_id);
      const tr = document.createElement('tr');
      tr.className = `manifest-item-row ${isExpanded ? 'row-expanded' : ''}`;

      const photos = item.photos || [];
      let thumbHtml = '';
      if (photos.length > 0) {
        thumbHtml = photos.map(p => {
          const src = p.url.startsWith('data:') ? p.url : (API_BASE_URL + p.url);
          return `<img src="${src}" class="manifest-thumb" title="${escapeHtml(p.angle || '')}" />`;
        }).join('');
      } else {
        thumbHtml = '<span style="color:#A1A1AA; font-size:0.75rem;">No photo</span>';
      }

      const verdictHtml = item.compliant
        ? '<span class="status-pill status-compliant">Compliant</span>'
        : '<span class="status-pill status-noncompliant">Non-Compliant</span>';

      tr.innerHTML = `
        <td><div class="manifest-thumb-row">${thumbHtml}</div></td>
        <td>
          <strong>${escapeHtml(item.product_name || 'Item ' + (idx + 1))}</strong>
          <div style="font-family:var(--font-mono); font-size:0.72rem; color:var(--text-secondary);">${item.item_id}</div>
        </td>
        <td>${verdictHtml}</td>
        <td><span class="category-pill">${escapeHtml(item.product_category || 'General')}</span></td>
        <td>${photos.length} panel(s)</td>
        <td>${item.confidence ? Math.round(item.confidence * 100) + '%' : '—'}</td>
        <td style="text-align: right; white-space: nowrap;">
          <button type="button" class="btn-item-action btn-expand-item">
            ${isExpanded ? 'Collapse ▲' : 'View ▾'}
          </button>
        </td>
      `;

      tr.querySelector('.btn-expand-item').addEventListener('click', (e) => {
        e.stopPropagation();
        expandedHistoryItemId = isExpanded ? null : item.item_id;
        renderHistoryItemsTable(currentHistoryBatchItems);
      });

      tr.addEventListener('click', () => {
        expandedHistoryItemId = isExpanded ? null : item.item_id;
        renderHistoryItemsTable(currentHistoryBatchItems);
      });

      historyItemsTableBody.appendChild(tr);

      if (isExpanded) {
        const trDetail = document.createElement('tr');
        trDetail.className = 'item-detail-row';
        const tdDetail = document.createElement('td');
        tdDetail.colSpan = 7;
        tdDetail.className = 'item-detail-cell';
        tdDetail.appendChild(renderReadOnlyDetailCard(item));
        trDetail.appendChild(tdDetail);
        historyItemsTableBody.appendChild(trDetail);
      }
    });
  }

  function renderReadOnlyDetailCard(item) {
    const card = document.createElement('div');
    card.className = 'item-detail-card history-readonly-card';

    const photos = item.photos || [];
    let photosHtml = '';
    photos.forEach((p, pIdx) => {
      const src = p.url.startsWith('data:') ? p.url : (API_BASE_URL + p.url);
      const angleLabel = p.angle ? p.angle.toUpperCase() : `PHOTO #${pIdx + 1}`;
      photosHtml += `
        <div class="camera-photo-thumb-card" data-idx="${pIdx}" title="Tap to enlarge full-size">
          <img src="${src}" alt="${escapeHtml(angleLabel)}" class="camera-thumb-img" />
          <div class="camera-thumb-overlay">
            <span class="camera-thumb-label">${escapeHtml(angleLabel)}</span>
            <span class="camera-thumb-zoom-cue">🔍 Enlarge</span>
          </div>
        </div>
      `;
    });

    let declsHtml = '';
    RULE6_FIELDS.forEach(f => {
      const isPresent = (item.declarations_found || []).includes(f.key);
      declsHtml += `
        <div class="decl-editor-card ${isPresent ? 'is-present' : 'is-absent'}" style="pointer-events: none;">
          <div class="decl-editor-top">
            <div class="decl-label-box">
              <span class="decl-title">${f.name}</span>
              <span class="decl-sub-tag">${f.sub}</span>
            </div>
            <span class="rule6-status-tag ${isPresent ? 'found' : 'missing'}">
              ${isPresent ? '✓ Present' : '✕ Absent'}
            </span>
          </div>
        </div>
      `;
    });

    card.innerHTML = `
      <div class="detail-card-inner">
        <div class="detail-card-header">
          <div class="detail-title-col">
            <h4 class="detail-heading">${escapeHtml(item.product_name || item.item_id)}</h4>
            <span class="detail-meta">${item.item_id} • ${photos.length} photo(s) • Submitted Record (Read-Only)</span>
          </div>
          <button type="button" class="btn-detail-close" title="Close">✕</button>
        </div>

        <div class="detail-photos-section">
          <div class="detail-sub-header">
            <strong>Item Photos (${photos.length})</strong>
            <small>Tap any photo to view full size</small>
          </div>
          <div class="camera-photos-gallery">
            ${photosHtml}
          </div>
        </div>

        <div class="detail-decls-section">
          <div class="detail-sub-header">
            <strong>Rule 6 Statutory Declarations</strong>
            <small>Submitted Record</small>
          </div>
          <div class="detail-decls-grid">
            ${declsHtml}
          </div>
        </div>
      </div>
    `;

    card.querySelector('.btn-detail-close').addEventListener('click', () => {
      expandedHistoryItemId = null;
      renderHistoryItemsTable(currentHistoryBatchItems);
    });

    card.querySelectorAll('.camera-photo-thumb-card').forEach(thumb => {
      thumb.addEventListener('click', () => {
        const idx = parseInt(thumb.dataset.idx, 10);
        openPhotoLightbox(item, idx, true); // Read-only mode!
      });
    });

    return card;
  }

  // =========================================================================
  // 11. ALERTS TAB & RECAPTURE RESOLUTION
  // =========================================================================
  const btnTestRecapture = document.getElementById('btnTestRecapture');
  if (btnTestRecapture) {
    btnTestRecapture.addEventListener('click', () => {
      activeRecaptures = [{
        item_id: 'ITEM-TEST-REC-01',
        product_name: 'Tata Salt (Demo Recapture)',
        officer_remarks: 'Front Net Weight declaration was slightly shadowed. Please recapture under clear overhead lighting.'
      }];
      renderAlertsTab();
    });
  }

  function renderAlertsTab() {
    const alertCount = (activeRecaptures || []).length;

    if (alertCount > 0) {
      if (tabAlertBadge) {
        tabAlertBadge.textContent = alertCount;
        tabAlertBadge.classList.remove('hidden');
        tabAlertBadge.style.display = 'inline-block';
      }
      if (headerAlertDot) {
        headerAlertDot.textContent = alertCount;
        headerAlertDot.classList.remove('hidden');
        headerAlertDot.style.display = 'inline-flex';
      }
    } else {
      if (tabAlertBadge) {
        tabAlertBadge.textContent = '';
        tabAlertBadge.classList.add('hidden');
        tabAlertBadge.style.display = 'none';
      }
      if (headerAlertDot) {
        headerAlertDot.textContent = '';
        headerAlertDot.classList.add('hidden');
        headerAlertDot.style.display = 'none';
      }
    }

    if (alertCount === 0) {
      alertsListContainer.innerHTML = '';
      alertsEmptyCard.classList.remove('hidden');
      return;
    }

    alertsEmptyCard.classList.add('hidden');
    alertsListContainer.innerHTML = '';

    activeRecaptures.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'alert-notice-card';
      card.innerHTML = `
        <div class="alert-notice-header">
          <span class="notice-badge">⚠️ Recapture Requested</span>
          <span class="notice-item-id">${item.item_id}</span>
        </div>
        <h4 class="notice-product-title">${escapeHtml(item.product_name || 'Item')}</h4>
        <div class="notice-officer-box">
          <strong>Reviewing Officer Instructions:</strong>
          <p>"${escapeHtml(item.officer_remarks || 'Photo was blurry or statutory declaration obstructed. Please recapture under clear lighting.')}"</p>
        </div>
        <div class="notice-actions">
          <button type="button" class="btn-primary btn-resolve-recapture">
            Resolve Recaptures →
          </button>
        </div>
      `;

      card.querySelector('.btn-resolve-recapture').addEventListener('click', () => {
        currentRecapturingItemId = item.item_id;
        recaptureItemTitle.textContent = item.product_name || item.item_id;
        recaptureOfficerNote.textContent = `Officer note: ${item.officer_remarks || 'Retake photo under direct lighting.'}`;
        recaptureActiveBanner.classList.remove('hidden');

        switchTab('camera');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        uploadOptionsModal.classList.remove('hidden');
      });

      alertsListContainer.appendChild(card);
    });
  }

  // =========================================================================
  // 12. LOAD DASHBOARD DATA FROM API
  // =========================================================================
  async function loadInspectorDashboard() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/inspector/dashboard?inspector_id=${encodeURIComponent(user.badge_number || user.username)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // 1. Active Batch
      if (data.active_batch) {
        activeBatch = data.active_batch;
        summaryBatchId.textContent = activeBatch.batch_id;
        summaryStoreName.textContent = `${activeBatch.store_name} • ${activeBatch.store_location || ''}`;
        
        if (batchTabBatchId) batchTabBatchId.textContent = activeBatch.batch_id;
        if (batchTabStoreName) batchTabStoreName.textContent = `${activeBatch.store_name} • ${activeBatch.store_location || ''}`;
        if (batchTabStatusBadge) {
          batchTabStatusBadge.textContent = 'Active Session';
          batchTabStatusBadge.className = 'history-status-tag pending_review';
          batchTabStatusBadge.style.background = '#ECFDF5';
          batchTabStatusBadge.style.color = '#047857';
          batchTabStatusBadge.style.borderColor = '#A7F3D0';
        }

        const count = (activeBatch.items || []).length;
        if (summaryItemCount) summaryItemCount.textContent = `${count} / 15`;
        tabBatchBadge.textContent = count;
      } else {
        activeBatch = null;
        summaryBatchId.textContent = 'No Batch Active';
        summaryStoreName.textContent = 'Tap Camera tab to start session';
        if (batchTabBatchId) batchTabBatchId.textContent = 'No Batch Active';
        if (batchTabStoreName) batchTabStoreName.textContent = 'No active batch session';
        if (batchTabStatusBadge) {
          batchTabStatusBadge.textContent = 'No Active Session';
          batchTabStatusBadge.className = 'history-status-tag draft';
          batchTabStatusBadge.style.background = '#F4F4F5';
          batchTabStatusBadge.style.color = '#71717A';
          batchTabStatusBadge.style.borderColor = '#D4D4D8';
        }
        if (summaryItemCount) summaryItemCount.textContent = '0 / 15';
        tabBatchBadge.textContent = '0';
      }

      // 2. Recaptures / Alerts
      activeRecaptures = data.recapture_items || [];
      renderAlertsTab();
      renderBatchItemList();
      await updateCameraTabEmptyState();

    } catch (err) {
      console.warn('Could not load live dashboard data from API:', err);
    }
  }

  // Initial load
  await loadInspectorDashboard();
  switchTab('camera');
});
