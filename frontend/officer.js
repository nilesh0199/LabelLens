document.addEventListener('DOMContentLoaded', async () => {
  // 1. Auth Guard (Restricted to 'officer' role)
  const user = LabelLensAuth.requireAuth('officer');
  if (!user) return;

  const API_BASE_URL = (window.location.protocol === 'file:')
    ? 'http://localhost:3000'
    : (window.__LABEL_LENS_API__ || '');

  // Header Elements
  const headerOfficerName = document.getElementById('headerOfficerName');
  const headerOfficerBadge = document.getElementById('headerOfficerBadge');
  const mainOfficerName = document.getElementById('mainOfficerName');
  const mainOfficerJurisdiction = document.getElementById('mainOfficerJurisdiction');
  const btnSignOut = document.getElementById('btnSignOut');

  if (headerOfficerName) headerOfficerName.textContent = user.full_name || 'Reviewing Officer';
  if (headerOfficerBadge) headerOfficerBadge.textContent = `${user.badge_number || 'AD-CTRL'} • ${user.jurisdiction || 'Zone 4'}`;
  if (mainOfficerName) mainOfficerName.textContent = user.full_name || 'Reviewing Officer';
  if (mainOfficerJurisdiction) mainOfficerJurisdiction.textContent = `Jurisdiction: ${user.jurisdiction || 'Zone 4'}`;

  if (btnSignOut) btnSignOut.addEventListener('click', () => LabelLensAuth.logout());

  // Dashboard KPI Elements
  const btnRefreshOfficerDashboard = document.getElementById('btnRefreshOfficerDashboard');
  const kpiOfficerPendingBatches = document.getElementById('kpiOfficerPendingBatches');
  const kpiOfficerPendingItems = document.getElementById('kpiOfficerPendingItems');
  const kpiOfficerApprovedItems = document.getElementById('kpiOfficerApprovedItems');
  const kpiOfficerOverriddenItems = document.getElementById('kpiOfficerOverriddenItems');
  const officerInboxCard = document.getElementById('officerInboxCard');
  const officerBatchStatusFilter = document.getElementById('officerBatchStatusFilter');
  const officerQueueTableBody = document.getElementById('officerQueueTableBody');

  // Workbench Elements
  const officerWorkbenchCard = document.getElementById('officerWorkbenchCard');
  const btnBackToOfficerInbox = document.getElementById('btnBackToOfficerInbox');
  const workbenchBatchId = document.getElementById('workbenchBatchId');
  const workbenchEstablishment = document.getElementById('workbenchEstablishment');
  const workbenchBatchStatusPill = document.getElementById('workbenchBatchStatusPill');
  const workbenchStatsSummary = document.getElementById('workbenchStatsSummary');
  const workbenchItemsList = document.getElementById('workbenchItemsList');

  // Review Modal Elements
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
  const officerRemarksInput = document.getElementById('officerRemarksInput');

  // The 4 Symmetrical Action Buttons
  const btnOfficerApproveAsIs = document.getElementById('btnOfficerApproveAsIs');
  const btnOfficerOverride = document.getElementById('btnOfficerOverride');
  const btnOfficerOverrideSub = document.getElementById('btnOfficerOverrideSub');
  const btnOfficerRecapture = document.getElementById('btnOfficerRecapture');
  const btnOfficerCorrect = document.getElementById('btnOfficerCorrect');

  // State
  let activeBatch = null;
  let currentReviewingItem = null;

  // 1. Load Officer Dashboard
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

      await loadOfficerBatches(officerBatchStatusFilter ? officerBatchStatusFilter.value : 'all');
    } catch (err) {
      console.error('Error loading officer dashboard:', err);
    }
  }

  // 2. Load Batches
  async function loadOfficerBatches(status = 'all') {
    if (!officerQueueTableBody) return;
    officerQueueTableBody.innerHTML = '<tr><td colspan="8" class="table-empty">Loading dossiers...</td></tr>';

    try {
      const query = status && status !== 'all' ? `?status=${status}` : '';
      const res = await fetch(`${API_BASE_URL}/api/officer/batches${query}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const batches = await res.json();

      renderBatchQueue(batches);
    } catch (err) {
      officerQueueTableBody.innerHTML = `<tr><td colspan="8" class="table-empty" style="color:var(--red-text);">Error: ${err.message}</td></tr>`;
    }
  }

  function renderBatchQueue(batches) {
    if (!officerQueueTableBody) return;
    if (!batches || batches.length === 0) {
      officerQueueTableBody.innerHTML = '<tr><td colspan="8" class="table-empty">No inspection dossiers found in this queue.</td></tr>';
      return;
    }

    officerQueueTableBody.innerHTML = '';
    batches.forEach(b => {
      const tr = document.createElement('tr');
      const dateStr = b.submitted_at ? new Date(b.submitted_at).toLocaleString() : (b.created_at ? new Date(b.created_at).toLocaleString() : '--');
      const itemsCount = b.item_count || (b.items ? b.items.length : 0);

      let statusBadgeClass = 'badge-submitted';
      let statusLabel = 'Pending Review';
      if (b.status === 'completed') {
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

      tr.querySelector('.btn-review-dossier').addEventListener('click', () => openBatchWorkbench(b.batch_id));
      officerQueueTableBody.appendChild(tr);
    });
  }

  // 3. Open Batch Workbench
  async function openBatchWorkbench(batchId) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/officer/batches/${batchId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const batch = await res.json();
      activeBatch = batch;

      officerInboxCard.classList.add('hidden');
      officerWorkbenchCard.classList.remove('hidden');

      workbenchBatchId.textContent = batch.batch_id;
      workbenchEstablishment.textContent = `${batch.store_name} • ${batch.store_location || ''} (Inspector: ${batch.inspector_name || 'LMO'})`;

      const items = batch.items || [];
      const reviewedCount = items.filter(i => i.review_status && i.review_status !== 'pending').length;
      workbenchStatsSummary.innerHTML = `
        <div style="font-size:0.8rem; color:var(--text-secondary);">
          Progress: <strong>${reviewedCount} of ${items.length}</strong> adjudicated
        </div>
      `;

      renderWorkbenchItems(items);
    } catch (err) {
      showAlert(`Error loading batch details: ${err.message}`, 'Officer Workbench Error');
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

      const fieldVerdictHtml = item.compliant
        ? '<span class="history-status-pill tag-found">Field: Compliant</span>'
        : '<span class="history-status-pill tag-missing">Field: Non-Compliant</span>';

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

      card.querySelector('.officer-adjudicate-btn').addEventListener('click', () => openOfficerReviewModal(item));
      workbenchItemsList.appendChild(card);
    });
  }

  btnBackToOfficerInbox.addEventListener('click', () => {
    officerWorkbenchCard.classList.add('hidden');
    officerInboxCard.classList.remove('hidden');
    loadOfficerDashboard();
  });

  btnRefreshOfficerDashboard.addEventListener('click', loadOfficerDashboard);
  officerBatchStatusFilter.addEventListener('change', () => {
    loadOfficerBatches(officerBatchStatusFilter.value);
  });

  // 4. Open Specimen Review Modal
  function openOfficerReviewModal(item) {
    currentReviewingItem = item;

    modalCommodityTitle.textContent = item.product_name || 'Commodity Specimen';
    modalBatchRef.textContent = `Batch: ${activeBatch ? activeBatch.batch_id : '--'}`;
    modalInspectorRef.textContent = `Inspector: ${activeBatch ? (activeBatch.inspector_name || 'LMO') : '--'}`;
    modalScanDateRef.textContent = `Date: ${item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Today'}`;

    if (item.compliant) {
      modalFieldVerdictPill.className = 'status-pill status-compliant';
      modalFieldVerdictPill.textContent = 'Preliminary: Compliant';
    } else {
      modalFieldVerdictPill.className = 'status-pill status-noncompliant';
      modalFieldVerdictPill.textContent = 'Preliminary: Non-Compliant';
    }

    modalBrandManufacturerVal.textContent = item.brand || item.manufacturer || 'Detected on packaging';
    modalAiConfidenceVal.textContent = `${Math.round((item.confidence || 0) * 100)}%`;

    renderModalAngle('front');
    renderRule6List(item);

    if (officerRemarksInput) officerRemarksInput.value = item.officer_remarks || '';

    if (btnOfficerOverrideSub) {
      btnOfficerOverrideSub.textContent = item.compliant
        ? 'Flip to Non-Compliant (Violation)'
        : 'Flip to Compliant (Valid Declaration)';
    }

    officerReviewModal.classList.remove('hidden');
  }

  function renderModalAngle(angle) {
    modalAngleTabs.querySelectorAll('.angle-tab-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-angle') === angle);
    });

    const photos = currentReviewingItem.photos || [];
    const photo = photos.find(p => p.angle === angle) || photos[0];

    if (photo && modalEvidenceImage) {
      modalEvidenceImage.src = `${API_BASE_URL}${photo.url}`;
      if (photo.is_blurry) {
        modalImageBlurBadge.textContent = `Blur Warning (${Math.round(photo.blur_score || 0)})`;
        modalImageBlurBadge.style.background = 'rgba(220, 38, 38, 0.8)';
      } else {
        modalImageBlurBadge.textContent = `Sharp Image (${Math.round(photo.blur_score || 100)})`;
        modalImageBlurBadge.style.background = 'rgba(22, 163, 74, 0.8)';
      }
    }
  }

  modalAngleTabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.angle-tab-btn');
    if (btn) renderModalAngle(btn.getAttribute('data-angle'));
  });

  function renderRule6List(item) {
    modalRule6List.innerHTML = '';
    const decls = item.declarations || [];
    decls.forEach(d => {
      const row = document.createElement('div');
      row.className = 'rule6-item-row';
      const isFound = d.found || d.status === 'compliant';
      row.innerHTML = `
        <div class="rule6-req-title">${d.rule || d.requirement || d.name}</div>
        <div class="rule6-detected-val">${d.detected_value || (isFound ? 'Verified present' : 'Not detected')}</div>
        <div><span class="declaration-pill ${isFound ? 'pill-compliant' : 'pill-missing'}">${isFound ? 'Compliant' : 'Missing'}</span></div>
      `;
      modalRule6List.appendChild(row);
    });
  }

  // Tabs in Review Modal
  tabRule6Audit.addEventListener('click', () => {
    tabRule6Audit.classList.add('active');
    tabSpecialRegsAudit.classList.remove('active');
    contentRule6Audit.classList.remove('hidden');
    contentSpecialRegsAudit.classList.add('hidden');
  });

  tabSpecialRegsAudit.addEventListener('click', () => {
    tabSpecialRegsAudit.classList.add('active');
    tabRule6Audit.classList.remove('active');
    contentSpecialRegsAudit.classList.remove('hidden');
    contentRule6Audit.classList.add('hidden');
  });

  btnCloseOfficerModal.addEventListener('click', () => {
    officerReviewModal.classList.add('hidden');
    currentReviewingItem = null;
  });

  // 5. Execute 4 Symmetric Review Actions
  async function executeReview(action, newVerdict) {
    if (!currentReviewingItem) return;
    const remarks = (officerRemarksInput ? officerRemarksInput.value.trim() : '');

    if ((action === 'override' || action === 'recapture') && !remarks) {
      await showAlert(`A written legal justification or instruction is mandatory for "${action === 'override' ? 'Verdict Override' : 'Recapture Request'}".`, 'Remarks Required');
      if (officerRemarksInput) officerRemarksInput.focus();
      return;
    }

    const payload = {
      item_id: currentReviewingItem.item_id,
      action: action,
      new_verdict: newVerdict,
      remarks: remarks || 'Approved as compliant by Assistant Controller',
      reviewer_name: user.full_name
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/officer/review-item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Action failed');

      await showAlert(`Specimen [${currentReviewingItem.item_id}] review processed: ${action.toUpperCase()}.`, 'Adjudication Complete');
      officerReviewModal.classList.add('hidden');
      currentReviewingItem = null;

      if (activeBatch) await openBatchWorkbench(activeBatch.batch_id);
      await loadOfficerDashboard();
    } catch (err) {
      await showAlert(`Error: ${err.message}`, 'Action Error');
    }
  }

  btnOfficerApproveAsIs.addEventListener('click', () => {
    executeReview('approve', currentReviewingItem ? currentReviewingItem.compliant : true);
  });

  btnOfficerOverride.addEventListener('click', async () => {
    if (!currentReviewingItem) return;
    const flipped = !currentReviewingItem.compliant;
    const ok = await showConfirm(`Confirm verdict OVERRIDE: Flip to [${flipped ? 'Compliant' : 'Non-Compliant'}]?`, 'Confirm Verdict Override', 'Override Verdict', 'Cancel');
    if (ok) {
      executeReview('override', flipped);
    }
  });

  btnOfficerRecapture.addEventListener('click', async () => {
    const ok = await showConfirm('Send this specimen back to Field Inspector for photo recapture?', 'Confirm Recapture Request', 'Request Recapture', 'Cancel');
    if (ok) {
      executeReview('recapture', false);
    }
  });

  btnOfficerCorrect.addEventListener('click', () => {
    executeReview('correct', currentReviewingItem ? currentReviewingItem.compliant : true);
  });

  // Initial Load
  await loadOfficerDashboard();
});
