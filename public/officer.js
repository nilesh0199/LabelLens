document.addEventListener('DOMContentLoaded', async () => {
  // 1. Auth Guard (Restricted to 'officer' role)
  const user = LabelLensAuth.requireAuth('officer');
  if (!user) return;

  const API_BASE_URL = (window.location.protocol === 'file:')
    ? 'http://localhost:3000'
    : (window.__LABEL_LENS_API__ || '');

  const officerId = user.badge_number || user.username || 'AD-CTRL-DL-02';

  function formatPhotoUrl(url) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
      return url;
    }
    return API_BASE_URL + (url.startsWith('/') ? url : '/' + url);
  }

  // Header & Profile Elements
  const headerOfficerName = document.getElementById('headerOfficerName');
  const headerOfficerBadge = document.getElementById('headerOfficerBadge');
  const mainOfficerName = document.getElementById('mainOfficerName');
  const mainOfficerJurisdiction = document.getElementById('mainOfficerJurisdiction');
  const sidebarJurisdiction = document.getElementById('sidebarJurisdiction');
  const btnSignOut = document.getElementById('btnSignOut');

  const officerDisplayName = user.full_name || 'Dr. S. K. Sharma';
  const officerBadgeText = `${user.badge_number || 'AD-CTRL-DL-02'} • ${user.jurisdiction || 'Controller Office Delhi'}`;
  const officerJurisdictionText = user.jurisdiction || 'Controller Office Delhi';

  if (headerOfficerName) headerOfficerName.textContent = officerDisplayName;
  if (headerOfficerBadge) headerOfficerBadge.textContent = officerBadgeText;
  if (mainOfficerName) mainOfficerName.textContent = officerDisplayName;
  if (mainOfficerJurisdiction) mainOfficerJurisdiction.textContent = `Jurisdiction: ${officerJurisdictionText}`;
  if (sidebarJurisdiction) sidebarJurisdiction.textContent = officerJurisdictionText;

  if (btnSignOut) btnSignOut.addEventListener('click', () => LabelLensAuth.logout());

  // Navigation / View System
  const navItemDashboard = document.getElementById('navItemDashboard');
  const navItemQueue = document.getElementById('navItemQueue');
  const navItemInspectors = document.getElementById('navItemInspectors');
  const navItemLedger = document.getElementById('navItemLedger');
  const navItemReports = document.getElementById('navItemReports');
  const navQueueBadge = document.getElementById('navQueueBadge');

  const views = {
    dashboard: document.getElementById('viewDashboard'),
    queue: document.getElementById('viewQueue'),
    inspectors: document.getElementById('viewInspectors'),
    ledger: document.getElementById('viewLedger'),
    reports: document.getElementById('viewReports'),
  };

  const navItems = {
    dashboard: navItemDashboard,
    queue: navItemQueue,
    inspectors: navItemInspectors,
    ledger: navItemLedger,
    reports: navItemReports,
  };

  let activeView = 'dashboard';

  function switchView(targetView) {
    if (!views[targetView]) return;
    activeView = targetView;

    // Toggle active state on sidebar items
    Object.keys(navItems).forEach(key => {
      if (navItems[key]) {
        navItems[key].classList.toggle('active', key === targetView);
      }
    });

    // Toggle view visibility
    Object.keys(views).forEach(key => {
      if (views[key]) {
        views[key].classList.toggle('hidden', key !== targetView);
      }
    });

    // Load data for newly selected view
    if (targetView === 'dashboard') {
      loadOfficerDashboard();
    } else if (targetView === 'queue') {
      if (officerWorkbenchCard) officerWorkbenchCard.classList.add('hidden');
      if (officerInboxCard) officerInboxCard.classList.remove('hidden');
      activeBatch = null;
      currentReviewingItem = null;
      loadAssignedInspectorsFilter();
      loadOfficerBatches(officerBatchStatusFilter ? officerBatchStatusFilter.value : 'all');
    } else if (targetView === 'inspectors') {
      loadOfficerInspectors();
    } else if (targetView === 'ledger') {
      loadOfficerLedger();
    } else if (targetView === 'reports') {
      loadOfficerReports(7);
    }
  }

  // Bind navigation clicks
  Object.keys(navItems).forEach(key => {
    if (navItems[key]) {
      navItems[key].addEventListener('click', () => switchView(key));
    }
  });

  // ==========================================================================
  // VIEW 1: DASHBOARD
  // ==========================================================================
  const btnRefreshOfficerDashboard = document.getElementById('btnRefreshOfficerDashboard');
  const kpiOfficerPendingBatches = document.getElementById('kpiOfficerPendingBatches');
  const kpiOfficerPendingItems = document.getElementById('kpiOfficerPendingItems');
  const kpiOfficerApprovedItems = document.getElementById('kpiOfficerApprovedItems');
  const kpiOfficerOverriddenItems = document.getElementById('kpiOfficerOverriddenItems');
  const needsAttentionList = document.getElementById('needsAttentionList');
  const needsAttentionCountBadge = document.getElementById('needsAttentionCountBadge');

  if (btnRefreshOfficerDashboard) {
    btnRefreshOfficerDashboard.addEventListener('click', async () => {
      const originalHtml = btnRefreshOfficerDashboard.innerHTML;
      btnRefreshOfficerDashboard.disabled = true;
      btnRefreshOfficerDashboard.innerHTML = 'Refreshing... ↻';
      btnRefreshOfficerDashboard.classList.add('refreshing');

      try {
        await Promise.all([
          loadOfficerDashboard(),
          loadOfficerBatches(officerBatchStatusFilter ? officerBatchStatusFilter.value : 'submitted', true),
          loadAssignedInspectorsFilter(),
          (typeof loadOfficerLedger === 'function' && officerLedgerTableBody) ? loadOfficerLedger() : Promise.resolve()
        ]);
        btnRefreshOfficerDashboard.innerHTML = 'Refreshed ✓';
        setTimeout(() => {
          btnRefreshOfficerDashboard.innerHTML = originalHtml;
          btnRefreshOfficerDashboard.disabled = false;
          btnRefreshOfficerDashboard.classList.remove('refreshing');
        }, 1500);
      } catch (err) {
        console.error('Refresh failed:', err);
        btnRefreshOfficerDashboard.innerHTML = 'Refresh ↻';
        btnRefreshOfficerDashboard.disabled = false;
        btnRefreshOfficerDashboard.classList.remove('refreshing');
      }
    });
  }

  // Recent Incoming Batches on Officer Dashboard
  const recentIncomingBatchesList = document.getElementById('recentIncomingBatchesList');
  const btnGoToFullQueue = document.getElementById('btnGoToFullQueue');
  if (btnGoToFullQueue) {
    btnGoToFullQueue.addEventListener('click', () => switchView('queue'));
  }

  async function loadRecentIncomingBatches() {
    if (!recentIncomingBatchesList) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/officer/batches?officer_id=${encodeURIComponent(officerId)}&status=submitted&_t=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const batches = await res.json();
      renderRecentIncomingBatches(batches);
    } catch (err) {
      console.error('Error loading recent incoming batches:', err);
      recentIncomingBatchesList.innerHTML = `<div style="padding:1rem; color:var(--red-text); font-size:0.85rem; text-align:center;">Failed to load incoming batches: ${err.message}</div>`;
    }
  }

  function renderRecentIncomingBatches(batches) {
    if (!recentIncomingBatchesList) return;
    if (!batches || batches.length === 0) {
      recentIncomingBatchesList.innerHTML = `
        <div style="padding: 1.25rem; background: #FFFFFF; border-radius: 8px; border: 1px dashed #E2E8F0; color: #64748B; font-size: 0.85rem; text-align: center;">
          ✓ No pending inspection batches currently awaiting review. All assigned circle submissions are up to date.
        </div>
      `;
      return;
    }

    recentIncomingBatchesList.innerHTML = '';
    batches.slice(0, 6).forEach(b => {
      const div = document.createElement('div');
      div.className = 'needs-attention-item';
      div.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 0.85rem 1rem; border-bottom: 1px solid #F1F5F9; gap: 1rem; flex-wrap: wrap;';

      const dateStr = b.submitted_at ? new Date(b.submitted_at).toLocaleString() : (b.created_at ? new Date(b.created_at).toLocaleString() : '--');
      const itemsCount = b.item_count || (b.items ? b.items.length : 0);
      const findingsPreview = `${b.compliant_count || 0} compliant, ${b.non_compliant_count || 0} non-compliant`;

      div.innerHTML = `
        <div style="flex: 1; min-width: 220px;">
          <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            <strong style="color: #14163A; font-size: 0.92rem;">${b.store_name || 'Retail Establishment'}</strong>
            <span style="font-size: 0.76rem; color: #64748B;">• ${b.store_location || 'Unspecified Location'}</span>
            <span class="report-status-badge badge-submitted" style="font-size: 0.68rem;">Pending Review</span>
          </div>
          <div style="font-size: 0.76rem; color: #64748B; margin-top: 3px;">
            Batch: <strong style="font-family: var(--font-mono);">${b.batch_id}</strong> • 
            Inspector: <strong>${b.inspector_name || 'Inspector'}</strong> (${b.inspector_id || '--'}) • 
            Items: <strong>${itemsCount}</strong> (${findingsPreview}) • 
            Submitted: <span>${dateStr}</span>
          </div>
        </div>
        <div style="flex-shrink: 0;">
          <button type="button" class="btn-primary btn-open-incoming-batch" data-batch-id="${b.batch_id}" style="font-size: 0.8rem; padding: 0.4rem 0.85rem; background: #14163A; border-color: #C79A3E; color: #FFFFFF; cursor: pointer; border-radius: 6px;">
            Review Batch →
          </button>
        </div>
      `;

      div.querySelector('.btn-open-incoming-batch').addEventListener('click', async () => {
        switchView('queue');
        await openBatchWorkbench(b.batch_id);
      });

      recentIncomingBatchesList.appendChild(div);
    });
  }

  async function loadOfficerDashboard() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/officer/dashboard?officer_id=${encodeURIComponent(officerId)}&_t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const stats = data.stats || {};
      const pendingBatches = stats.pending_batches_count ?? data.pending_batches ?? 0;
      const pendingItems = stats.pending_items_count ?? data.pending_items ?? 0;
      const approvedItems = stats.approved_items_count ?? data.approved_items ?? 0;
      const overriddenItems = stats.overridden_items_count ?? data.overridden_items ?? 0;

      if (kpiOfficerPendingBatches) kpiOfficerPendingBatches.textContent = pendingBatches;
      if (kpiOfficerPendingItems) kpiOfficerPendingItems.textContent = pendingItems;
      if (kpiOfficerApprovedItems) kpiOfficerApprovedItems.textContent = approvedItems;
      if (kpiOfficerOverriddenItems) kpiOfficerOverriddenItems.textContent = overriddenItems;
      if (navQueueBadge) navQueueBadge.textContent = pendingBatches;

      // Render Needs Attention Prioritized Strip
      renderNeedsAttention(data.needs_attention || []);

      // Render Recent Incoming Batches Strip
      loadRecentIncomingBatches();
    } catch (err) {
      console.error('Error loading officer dashboard:', err);
    }
  }

  function renderNeedsAttention(flaggedItems) {
    if (!needsAttentionList) return;
    if (needsAttentionCountBadge) {
      needsAttentionCountBadge.textContent = `${flaggedItems.length} Flagged`;
    }

    if (!flaggedItems || flaggedItems.length === 0) {
      needsAttentionList.innerHTML = `
        <div style="padding: 1.25rem; background: #FFFFFF; border-radius: 8px; border: 1px dashed #FDE68A; color: #92400E; font-size: 0.85rem; text-align: center;">
          ✓ All items across your assigned inspectors are currently compliant or reviewed. No urgent alerts.
        </div>
      `;
      return;
    }

    needsAttentionList.innerHTML = '';
    flaggedItems.slice(0, 8).forEach(item => {
      const div = document.createElement('div');
      div.className = 'needs-attention-item';

      const reasonLabel = item.needs_review
        ? 'Low Confidence / Review Flagged'
        : (!item.compliant ? 'Statutory Rule 6 Infraction' : 'Action Required');

      div.innerHTML = `
        <div class="needs-attention-item-left">
          <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            <strong style="color: #14163A; font-size: 0.9rem;">${item.product_name || 'Item ' + item.item_id}</strong>
            <span style="font-family: var(--font-mono); font-size: 0.72rem; color: #64748B;">(${item.item_id})</span>
            <span class="declaration-pill pill-missing" style="font-size: 0.68rem;">${reasonLabel}</span>
          </div>
          <div style="font-size: 0.76rem; color: #64748B;">
            Batch: <strong style="font-family: var(--font-mono);">${item.batch_id}</strong> • 
            Inspector: <strong>${item.inspector_id || 'Assigned LMO'}</strong> • 
            AI Confidence: <strong>${Math.round((item.confidence || 0) * 100)}%</strong>
          </div>
        </div>
        <div class="needs-attention-item-right">
          <button type="button" class="btn-secondary btn-quick-review" data-batch-id="${item.batch_id}" data-item-id="${item.item_id}" style="font-size: 0.78rem; padding: 0.35rem 0.75rem;">
            Quick Review →
          </button>
        </div>
      `;

      div.querySelector('.btn-quick-review').addEventListener('click', async () => {
        switchView('queue');
        await openBatchWorkbench(item.batch_id, item.item_id);
      });

      needsAttentionList.appendChild(div);
    });
  }

  // ==========================================================================
  // VIEW 2: REVIEW QUEUE & WORKBENCH
  // ==========================================================================
  const filterQueueInspector = document.getElementById('filterQueueInspector');
  const officerBatchStatusFilter = document.getElementById('officerBatchStatusFilter');
  const officerInboxCard = document.getElementById('officerInboxCard');
  const officerQueueTableBody = document.getElementById('officerQueueTableBody');

  const officerWorkbenchCard = document.getElementById('officerWorkbenchCard');
  const btnBackToOfficerInbox = document.getElementById('btnBackToOfficerInbox');
  const workbenchBatchId = document.getElementById('workbenchBatchId');
  const workbenchEstablishment = document.getElementById('workbenchEstablishment');
  const workbenchBatchStatusPill = document.getElementById('workbenchBatchStatusPill');
  const workbenchStatsSummary = document.getElementById('workbenchStatsSummary');
  const btnApproveAllClean = document.getElementById('btnApproveAllClean');
  const workbenchItemsList = document.getElementById('workbenchItemsList');

  let activeBatch = null;
  let currentReviewingItem = null;

  async function loadAssignedInspectorsFilter() {
    if (!filterQueueInspector) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/officer/inspectors?officer_id=${encodeURIComponent(officerId)}`);
      if (!res.ok) return;
      const raw = await res.json();
      const inspectors = Array.isArray(raw) ? raw : (raw.inspectors || []);
      
      const currentVal = filterQueueInspector.value;
      filterQueueInspector.innerHTML = '<option value="all">All Assigned Inspectors</option>';
      inspectors.forEach(insp => {
        const opt = document.createElement('option');
        opt.value = insp.inspector_id;
        opt.textContent = `${insp.full_name || insp.inspector_name || insp.inspector_id} (${insp.inspector_id})`;
        filterQueueInspector.appendChild(opt);
      });
      filterQueueInspector.value = currentVal || 'all';
    } catch (err) {
      console.error('Error loading inspectors for filter:', err);
    }
  }

  if (filterQueueInspector) {
    filterQueueInspector.addEventListener('change', () => {
      loadOfficerBatches(officerBatchStatusFilter ? officerBatchStatusFilter.value : 'submitted');
    });
  }

  if (officerBatchStatusFilter) {
    officerBatchStatusFilter.addEventListener('change', () => {
      loadOfficerBatches(officerBatchStatusFilter.value);
    });
  }

  const btnRefreshOfficerQueue = document.getElementById('btnRefreshOfficerQueue');
  if (btnRefreshOfficerQueue) {
    btnRefreshOfficerQueue.addEventListener('click', async () => {
      const origHtml = btnRefreshOfficerQueue.innerHTML;
      btnRefreshOfficerQueue.disabled = true;
      btnRefreshOfficerQueue.innerHTML = '<span class="refresh-icon spinning">🔄</span> Refreshing...';

      try {
        const currentFilter = officerBatchStatusFilter ? officerBatchStatusFilter.value : 'submitted';
        await Promise.all([
          loadOfficerBatches(currentFilter, false),
          loadOfficerDashboard(),
          loadAssignedInspectorsFilter(),
        ]);
        btnRefreshOfficerQueue.innerHTML = '<span style="color:#059669;">✓</span> Refreshed';
      } catch (err) {
        btnRefreshOfficerQueue.innerHTML = '<span style="color:#DC2626;">✗</span> Failed';
      } finally {
        setTimeout(() => {
          btnRefreshOfficerQueue.innerHTML = origHtml;
          btnRefreshOfficerQueue.disabled = false;
        }, 1200);
      }
    });
  }

  async function loadOfficerBatches(status = 'submitted', isBackground = false) {
    if (!officerQueueTableBody) return;
    if (!isBackground && officerQueueTableBody.children.length === 0) {
      officerQueueTableBody.innerHTML = '<tr><td colspan="8" class="table-empty">Loading batches...</td></tr>';
    }

    try {
      const params = new URLSearchParams();
      params.set('officer_id', officerId);
      if (status) params.set('status', status);
      if (filterQueueInspector && filterQueueInspector.value !== 'all') {
        params.set('inspector_id', filterQueueInspector.value);
      }

      const res = await fetch(`${API_BASE_URL}/api/officer/batches?${params.toString()}&_t=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const batches = await res.json();

      renderBatchQueue(batches);
    } catch (err) {
      if (!isBackground) {
        officerQueueTableBody.innerHTML = `<tr><td colspan="8" class="table-empty" style="color:var(--red-text);">Error: ${err.message}</td></tr>`;
      }
    }
  }

  function renderBatchQueue(batches) {
    if (!officerQueueTableBody) return;
    const activeBatches = (batches || []).filter(b => b.status !== 'completed');
    if (activeBatches.length === 0) {
      officerQueueTableBody.innerHTML = '<tr><td colspan="8" class="table-empty">✓ No pending inspection batches found in this queue. All reviewed batches have been moved to the Ledger.</td></tr>';
      if (navQueueBadge) navQueueBadge.textContent = '0';
      return;
    }

    officerQueueTableBody.innerHTML = '';
    activeBatches.forEach(b => {
      const tr = document.createElement('tr');
      const dateStr = b.submitted_at ? new Date(b.submitted_at).toLocaleString() : (b.created_at ? new Date(b.created_at).toLocaleString() : '--');
      const itemsCount = b.item_count || (b.items ? b.items.length : 0);

      const statusBadgeClass = b.status === 'under_review' ? 'badge-in-review' : 'badge-submitted';
      const statusLabel = b.status === 'under_review' ? 'Under Review' : 'Pending Review';

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
        <td><strong>${itemsCount}</strong> item(s)</td>
        <td style="font-size:0.75rem;">${findingsPreview}</td>
        <td><span class="report-status-badge ${statusBadgeClass}">${statusLabel}</span></td>
        <td style="text-align: right;">
          <button type="button" class="btn-secondary btn-review-dossier" data-batch-id="${b.batch_id}">
            Review Batch →
          </button>
        </td>
      `;

      tr.querySelector('.btn-review-dossier').addEventListener('click', () => openBatchWorkbench(b.batch_id));
      officerQueueTableBody.appendChild(tr);
    });

    if (navQueueBadge) {
      navQueueBadge.textContent = activeBatches.length;
    }
  }

  function updateBulkApproveButtonState(items) {
    if (!btnApproveAllClean) return;
    const allItems = items || [];
    const totalCompliant = allItems.filter(i => i.compliant === true && (i.confidence || 0) >= 0.85 && !i.needs_review).length;
    const remainingClean = allItems.filter(i => 
      i.compliant === true && 
      (i.confidence || 0) >= 0.85 && 
      !i.needs_review && 
      i.status !== 'recapture_requested' &&
      i.status !== 'reviewed' &&
      i.officer_action !== 'approve'
    );

    if (remainingClean.length === 0) {
      if (totalCompliant === 0) {
        btnApproveAllClean.disabled = false;
        btnApproveAllClean.textContent = 'No Clean Items in Batch';
        btnApproveAllClean.style.background = '#94A3B8';
        btnApproveAllClean.style.borderColor = '#64748B';
        btnApproveAllClean.style.cursor = 'pointer';
      } else {
        btnApproveAllClean.disabled = false;
        btnApproveAllClean.textContent = '✓ All Clean Items Approved';
        btnApproveAllClean.style.background = '#64748B';
        btnApproveAllClean.style.borderColor = '#475569';
        btnApproveAllClean.style.cursor = 'pointer';
      }
    } else {
      btnApproveAllClean.disabled = false;
      btnApproveAllClean.textContent = `✓ Approve All Clean Items (${remainingClean.length})`;
      btnApproveAllClean.style.background = '#059669';
      btnApproveAllClean.style.borderColor = '#047857';
      btnApproveAllClean.style.cursor = 'pointer';
    }
  }

  async function openBatchWorkbench(batchId, autoOpenItemId = null) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/officer/batches/${batchId}?_t=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const batch = await res.json();
      activeBatch = batch;

      officerInboxCard.classList.add('hidden');
      officerWorkbenchCard.classList.remove('hidden');

      workbenchBatchId.textContent = batch.batch_id;
      workbenchEstablishment.textContent = `${batch.store_name} • ${batch.store_location || ''} (Inspector: ${batch.inspector_name || batch.inspector_id || 'LMO'})`;

      const items = batch.items || [];
      const reviewedCount = items.filter(i => i.status === 'reviewed' || i.officer_action || i.status === 'recapture_requested').length;
      workbenchStatsSummary.innerHTML = `
        <div style="font-size:0.8rem; color:var(--text-secondary);">
          Progress: <strong>${reviewedCount} of ${items.length}</strong> reviewed
        </div>
      `;

      if (workbenchBatchStatusPill) {
        if (batch.status === 'completed' || (items.length > 0 && reviewedCount === items.length)) {
          workbenchBatchStatusPill.textContent = 'Completed';
          workbenchBatchStatusPill.className = 'status-pill badge-completed';
          workbenchBatchStatusPill.style.background = '#DCFCE7';
          workbenchBatchStatusPill.style.color = '#166534';
          workbenchBatchStatusPill.style.borderColor = '#86EFAC';
        } else {
          workbenchBatchStatusPill.textContent = 'In Review';
          workbenchBatchStatusPill.className = 'status-pill';
          workbenchBatchStatusPill.style.background = '';
          workbenchBatchStatusPill.style.color = '';
          workbenchBatchStatusPill.style.borderColor = '';
        }
      }

      updateBulkApproveButtonState(items);
      renderWorkbenchItems(items);

      if (autoOpenItemId) {
        const itemToOpen = items.find(i => i.item_id === autoOpenItemId);
        if (itemToOpen) openOfficerReviewModal(itemToOpen);
      }
    } catch (err) {
      showAlert(`Error loading batch details: ${err.message}`, 'Officer Workbench Error');
    }
  }

  function renderWorkbenchItems(items) {
    if (!workbenchItemsList) return;
    if (!items || items.length === 0) {
      workbenchItemsList.innerHTML = '<div class="table-empty">No items in this batch.</div>';
      return;
    }

    workbenchItemsList.innerHTML = '';
    items.forEach((item, idx) => {
      const card = document.createElement('div');
      const action = item.officer_action || (item.status === 'reviewed' ? 'approved' : item.status);
      let reviewedClass = '';
      if (action === 'approve' || action === 'approved') reviewedClass = 'item-reviewed-approved';
      else if (action === 'override' || action === 'overridden') reviewedClass = 'item-reviewed-overridden';
      else if (action === 'recapture' || item.status === 'recapture_requested') reviewedClass = 'item-reviewed-recapture';
      else if (action === 'recapture_resolved' || item.status === 'recapture_resolved') reviewedClass = 'item-reviewed-recaptured-resolved';
      else if (action === 'correct' || action === 'corrected') reviewedClass = 'item-reviewed-corrected';

      card.className = `workbench-item-card ${reviewedClass}`;

      let thumbHtml = '';
      if (item.photos && item.photos.length > 0) {
        thumbHtml = item.photos.map(p => `
          <div class="item-thumb-box">
            <img src="${formatPhotoUrl(p.url)}" alt="${p.angle}" title="${p.angle}" />
          </div>
        `).join('');
      } else {
        thumbHtml = '<div class="item-thumb-box"><span style="font-size:0.65rem; color:#999; display:flex; height:100%; align-items:center; justify-content:center;">No photo</span></div>';
      }

      const fieldVerdictHtml = item.compliant
        ? '<span class="history-status-pill tag-found">Field: Compliant</span>'
        : '<span class="history-status-pill tag-missing">Field: Non-Compliant</span>';

      let officerDecisionHtml = '<span class="declaration-pill" style="background:#F4F4F5; color:#71717A;">Pending Review</span>';
      let reviewBtnHtml = `
        <button type="button" class="officer-review-btn" data-item-id="${item.item_id}" style="min-height:36px; padding:0.35rem 0.85rem; font-size:0.8rem; font-weight:600; border-radius:6px; cursor:pointer; background:#14163A; color:#FFFFFF; border:1px solid #C79A3E;">
          Review Item
        </button>
      `;

      if (action === 'approve' || action === 'approved') {
        officerDecisionHtml = '<span class="declaration-pill pill-compliant">✓ Approved As-Is</span>';
        reviewBtnHtml = `
          <button type="button" class="officer-review-btn btn-item-approved" data-item-id="${item.item_id}" style="min-height:36px; padding:0.35rem 0.85rem; font-size:0.8rem; font-weight:600; border-radius:6px; cursor:pointer; background:#F0FDF4; color:#166534; border:1px solid #86EFAC;">
            ✓ Approved
          </button>
        `;
      } else if (action === 'override' || action === 'overridden') {
        officerDecisionHtml = `<span class="declaration-pill" style="background:#EDE9FE; color:#5B21B6;">⇄ Overridden (${item.compliant ? 'Compliant' : 'Non-Compliant'})</span>`;
        reviewBtnHtml = `
          <button type="button" class="officer-review-btn btn-item-overridden" data-item-id="${item.item_id}" style="min-height:36px; padding:0.35rem 0.85rem; font-size:0.8rem; font-weight:600; border-radius:6px; cursor:pointer; background:#EDE9FE; color:#5B21B6; border:1px solid #DDD6FE;">
            ⇄ Overridden
          </button>
        `;
      } else if (action === 'recapture' || item.status === 'recapture_requested') {
        officerDecisionHtml = '<span class="declaration-pill pill-missing">↺ Sent for Recapture</span>';
        reviewBtnHtml = `
          <button type="button" class="officer-review-btn btn-item-recapture" data-item-id="${item.item_id}" style="min-height:36px; padding:0.35rem 0.85rem; font-size:0.8rem; font-weight:600; border-radius:6px; cursor:pointer; background:#FFF7ED; color:#C2410C; border:1px solid #FED7AA;">
            ↺ Recapture
          </button>
        `;
      } else if (action === 'recapture_resolved' || item.status === 'recapture_resolved') {
        officerDecisionHtml = '<span class="declaration-pill" style="background:#FEF3C7; color:#92400E; border:1px solid #FCD34D; font-weight:600;">⚡ Recaptured — Ready for Re-Review</span>';
        reviewBtnHtml = `
          <button type="button" class="officer-review-btn" data-item-id="${item.item_id}" style="min-height:36px; padding:0.35rem 0.85rem; font-size:0.8rem; font-weight:600; border-radius:6px; cursor:pointer; background:#B45309; color:#FFFFFF; border:1px solid #F59E0B;">
            Re-Review Item
          </button>
        `;
      } else if (action === 'correct' || action === 'corrected') {
        officerDecisionHtml = '<span class="declaration-pill" style="background:#DBEAFE; color:#1D4ED8;">✎ Corrected & Remarked</span>';
        reviewBtnHtml = `
          <button type="button" class="officer-review-btn btn-item-corrected" data-item-id="${item.item_id}" style="min-height:36px; padding:0.35rem 0.85rem; font-size:0.8rem; font-weight:600; border-radius:6px; cursor:pointer; background:#DBEAFE; color:#1D4ED8; border:1px solid #BFDBFE;">
            ✎ Corrected
          </button>
        `;
      }

      card.innerHTML = `
        <div class="item-card-left">
          <div class="item-thumb-group">${thumbHtml}</div>
          <div class="item-card-info">
            <div class="item-commodity-name">
              ${item.product_name || 'Item #' + (idx + 1)}
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
        <div class="item-card-right" style="display: flex; gap: 0.5rem; align-items: center;">
          <button type="button" class="btn-secondary btn-generate-item-pdf" data-item-id="${item.item_id}" title="Download Statutory PDF Report" style="font-size: 0.78rem; padding: 0.35rem 0.65rem;">
            📄 PDF
          </button>
          ${reviewBtnHtml}
        </div>
      `;

      card.querySelector('.btn-generate-item-pdf').addEventListener('click', (e) => {
        e.stopPropagation();
        window.open(`${API_BASE_URL}/api/officer/reports/item/${item.item_id}`, '_blank');
      });

      card.querySelector('.officer-review-btn').addEventListener('click', () => openOfficerReviewModal(item));
      workbenchItemsList.appendChild(card);
    });

    const allReviewed = items.length > 0 && items.every(i => i.status === 'reviewed' || i.status === 'recapture_requested' || (!!i.officer_action && i.officer_action !== 'recapture_resolved'));
    if (allReviewed) {
      const banner = document.createElement('div');
      banner.className = 'workbench-completed-banner';
      banner.style.cssText = 'background: #F0FDF4; border: 1.5px solid #86EFAC; border-radius: 8px; padding: 1rem 1.25rem; margin-top: 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;';
      banner.innerHTML = `
        <div>
          <div style="font-weight: 700; color: #166534; font-size: 0.95rem; display: flex; align-items: center; gap: 0.4rem;">
            <span>✓</span> All ${items.length} items in batch [${activeBatch ? activeBatch.batch_id : ''}] have been adjudicated.
          </div>
          <div style="font-size: 0.8rem; color: #15803D; margin-top: 2px;">
            Batch review is complete. You can return to the review queue to continue with other pending batches.
          </div>
        </div>
        <button type="button" class="btn-primary btn-banner-return-queue" style="background: #166534; border-color: #14532D; font-size: 0.85rem; padding: 0.5rem 1.1rem; cursor: pointer; display: flex; align-items: center; gap: 0.4rem;">
          ← Return to Review Queue
        </button>
      `;
      banner.querySelector('.btn-banner-return-queue').addEventListener('click', returnToBatchQueue);
      workbenchItemsList.appendChild(banner);
    }
  }

  function returnToBatchQueue() {
    if (officerWorkbenchCard) officerWorkbenchCard.classList.add('hidden');
    if (officerInboxCard) officerInboxCard.classList.remove('hidden');

    // Immediately evict completed batch from table DOM so it never lingers
    if (activeBatch && activeBatch.status === 'completed' && officerQueueTableBody) {
      const row = officerQueueTableBody.querySelector(`[data-batch-id="${activeBatch.batch_id}"]`)?.closest('tr');
      if (row) row.remove();
    }

    activeBatch = null;
    currentReviewingItem = null;
    loadOfficerDashboard();
    // Default to 'submitted' so completed batches do not linger in the pending queue
    const currentFilter = officerBatchStatusFilter?.value || 'submitted';
    loadOfficerBatches(currentFilter);
  }

  if (btnBackToOfficerInbox) {
    btnBackToOfficerInbox.addEventListener('click', returnToBatchQueue);
  }

  // Bulk Action: Approve All Clean Items
  if (btnApproveAllClean) {
    btnApproveAllClean.addEventListener('click', async () => {
      if (!activeBatch) return;
      const items = activeBatch.items || [];
      const cleanItems = items.filter(i => 
        i.compliant === true && 
        (i.confidence || 0) >= 0.85 && 
        !i.needs_review && 
        i.status !== 'recapture_requested' &&
        i.status !== 'reviewed' &&
        i.officer_action !== 'approve'
      );

      if (cleanItems.length === 0) {
        await showAlert('No pending clean specimens found for bulk approval. Eligible specimens must be unreviewed, have 100% statutory compliance, AI confidence ≥ 85%, and no pending review flags.', 'No Eligible Items');
        return;
      }

      const confirmed = await showConfirm(
        'Confirm Bulk Endorsement',
        `Bulk-approve all ${cleanItems.length} compliant specimen(s) in batch [${activeBatch.batch_id}]? This will certify compliance under Rule 6 and record verdicts to the permanent ledger.`
      );

      if (!confirmed) return;

      try {
        btnApproveAllClean.disabled = true;
        btnApproveAllClean.textContent = 'Approving...';

        const reviewerName = user.full_name || 'Dr. S. K. Sharma';
        const res = await fetch(`${API_BASE_URL}/api/officer/approve-clean`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            batch_id: activeBatch.batch_id,
            officer_id: user.badge_number || officerId,
            reviewer_name: reviewerName,
            remarks: 'Approved under Rule 6 compliance review (Clean specimen endorsement)'
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Bulk approval failed');

        // 1. Immediately update activeBatch.items in memory
        const approvedIds = new Set(data.approved_item_ids || cleanItems.map(i => i.item_id));
        activeBatch.items.forEach(item => {
          if (approvedIds.has(item.item_id)) {
            item.status = 'reviewed';
            item.officer_action = 'approve';
            item.officer_remarks = 'Approved under Rule 6 compliance review (Clean specimen endorsement)';
            item.reviewed_by = reviewerName;
          }
        });

        // 2. Immediately re-render workbench items so visual changes are instantaneous
        renderWorkbenchItems(activeBatch.items);

        // 3. Update workbench progress summary and header pill
        const reviewedCount = activeBatch.items.filter(i => i.status === 'reviewed' || i.officer_action || i.status === 'recapture_requested').length;
        if (workbenchStatsSummary) {
          workbenchStatsSummary.innerHTML = `
            <div style="font-size:0.8rem; color:var(--text-secondary);">
              Progress: <strong>${reviewedCount} of ${activeBatch.items.length}</strong> reviewed
            </div>
          `;
        }

        const allDone = activeBatch.items.every(i => i.status === 'reviewed' || i.status === 'recapture_requested' || (!!i.officer_action && i.officer_action !== 'recapture_resolved'));
        if (allDone) {
          activeBatch.status = 'completed';
          if (workbenchBatchStatusPill) {
            workbenchBatchStatusPill.textContent = 'Completed';
            workbenchBatchStatusPill.className = 'status-pill badge-completed';
            workbenchBatchStatusPill.style.background = '#DCFCE7';
            workbenchBatchStatusPill.style.color = '#166534';
            workbenchBatchStatusPill.style.borderColor = '#86EFAC';
          }
        }

        // 4. Update bulk button state
        updateBulkApproveButtonState(activeBatch.items);

        // 5. Reload dashboard counters and queue table
        await loadOfficerDashboard();
        loadOfficerBatches(officerBatchStatusFilter ? officerBatchStatusFilter.value : 'submitted');

        await showAlert(`Successfully bulk-approved ${data.approved_count || data.count || approvedIds.size} clean specimen(s) to the permanent regulatory ledger.`, 'Bulk Approval Complete');
      } catch (err) {
        await showAlert(`Bulk approval error: ${err.message}`, 'Error');
        updateBulkApproveButtonState(activeBatch ? activeBatch.items : []);
      }
    });
  }

  // ==========================================================================
  // VIEW 3: INSPECTORS & SUBMISSION HISTORY
  // ==========================================================================
  const officerInspectorsTableBody = document.getElementById('officerInspectorsTableBody');
  const inspectorHistoryContainer = document.getElementById('inspectorHistoryContainer');
  const inspectorHistoryTitle = document.getElementById('inspectorHistoryTitle');
  const btnCloseInspectorHistory = document.getElementById('btnCloseInspectorHistory');
  const inspectorHistoryTableBody = document.getElementById('inspectorHistoryTableBody');

  async function loadOfficerInspectors() {
    if (!officerInspectorsTableBody) return;
    officerInspectorsTableBody.innerHTML = '<tr><td colspan="8" class="table-empty">Loading assigned inspectors...</td></tr>';

    try {
      const res = await fetch(`${API_BASE_URL}/api/officer/inspectors?officer_id=${encodeURIComponent(officerId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();
      const inspectors = Array.isArray(raw) ? raw : (raw.inspectors || []);

      if (!inspectors || inspectors.length === 0) {
        officerInspectorsTableBody.innerHTML = '<tr><td colspan="8" class="table-empty">No field inspectors assigned to your jurisdiction.</td></tr>';
        return;
      }

      officerInspectorsTableBody.innerHTML = '';
      inspectors.forEach(insp => {
        const tr = document.createElement('tr');
        const lastDate = insp.last_submission_date ? new Date(insp.last_submission_date).toLocaleDateString() : 'Never';
        const storeName = insp.last_submission_store || insp.last_store_name || '';
        const lastStore = storeName ? `<div style="font-size:0.75rem; color:#64748B;">${storeName}</div>` : '';

        tr.innerHTML = `
          <td><strong style="font-family:var(--font-mono); font-size:0.82rem;">${insp.inspector_id}</strong></td>
          <td class="inspector-name-cell" style="cursor: pointer;" title="Click to view submission history">
            <div style="font-weight:600; color:#14163A; text-decoration: underline; text-decoration-color: #94A3B8;">${insp.full_name || insp.inspector_name || 'Field Inspector'} ↗</div>
            <div style="font-size:0.72rem; color:#64748B;">${insp.email || ''}</div>
          </td>
          <td><span class="officer-jurisdiction-badge" style="font-size:0.72rem;">${insp.jurisdiction_circle || insp.jurisdiction || 'Delhi Circle'}</span></td>
          <td><strong>${insp.total_batches}</strong> batches</td>
          <td><strong>${insp.total_items}</strong> items</td>
          <td>
            <span style="font-weight:700; color:${insp.compliance_rate >= 80 ? '#059669' : '#DC2626'};">
              ${insp.compliance_rate}%
            </span>
          </td>
          <td>
            <div>${lastDate}</div>
            ${lastStore}
          </td>
          <td style="text-align: right;">
            <button type="button" class="btn-secondary btn-view-inspector-history" data-inspector-id="${insp.inspector_id}" data-name="${insp.inspector_name || insp.full_name || 'Inspector'}">
              View History →
            </button>
          </td>
        `;

        const triggerHistory = () => {
          officerInspectorsTableBody.querySelectorAll('tr').forEach(r => r.style.background = '');
          tr.style.background = '#EFF6FF';
          showInspectorHistory(insp);
        };

        const btnHistory = tr.querySelector('.btn-view-inspector-history');
        if (btnHistory) btnHistory.addEventListener('click', triggerHistory);
        const nameCell = tr.querySelector('.inspector-name-cell');
        if (nameCell) nameCell.addEventListener('click', triggerHistory);

        officerInspectorsTableBody.appendChild(tr);
      });
    } catch (err) {
      officerInspectorsTableBody.innerHTML = `<tr><td colspan="8" class="table-empty" style="color:var(--red-text);">Error: ${err.message}</td></tr>`;
    }
  }

  async function showInspectorHistory(insp) {
    if (!inspectorHistoryContainer || !inspectorHistoryTableBody) return;
    const name = insp.inspector_name || insp.full_name || 'Field Inspector';
    inspectorHistoryTitle.textContent = `Submission History: ${name} (${insp.inspector_id})`;
    inspectorHistoryContainer.classList.remove('hidden');
    inspectorHistoryContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    inspectorHistoryTableBody.innerHTML = '<tr><td colspan="7" class="table-empty">Loading history batches...</td></tr>';

    try {
      const res = await fetch(`${API_BASE_URL}/api/officer/batches?officer_id=${encodeURIComponent(officerId)}&inspector_id=${encodeURIComponent(insp.inspector_id)}&_t=${Date.now()}`, {
        cache: 'no-store'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const batches = await res.json();

      if (!batches || batches.length === 0) {
        inspectorHistoryTableBody.innerHTML = '<tr><td colspan="7" class="table-empty">No inspection batches submitted by this inspector.</td></tr>';
        return;
      }

      inspectorHistoryTableBody.innerHTML = '';
      batches.forEach(b => {
        const tr = document.createElement('tr');
        const dateStr = b.submitted_at ? new Date(b.submitted_at).toLocaleDateString() : (b.created_at ? new Date(b.created_at).toLocaleDateString() : '--');
        const rate = (b.item_count || 0) > 0 ? Math.round(((b.compliant_count || 0) / b.item_count) * 100) : 0;

        tr.innerHTML = `
          <td><strong style="font-family:var(--font-mono); font-size:0.82rem;">${b.batch_id}</strong></td>
          <td>
            <div style="font-weight:600;">${b.store_name || 'Establishment'}</div>
            <div style="font-size:0.75rem; color:#64748B;">${b.store_location || ''}</div>
          </td>
          <td style="font-size:0.78rem;">${dateStr}</td>
          <td><strong>${b.item_count || 0}</strong></td>
          <td><span style="font-weight:600; color:${rate >= 80 ? '#059669' : '#DC2626'};">${rate}% compliant</span></td>
          <td><span class="report-status-badge ${b.status === 'completed' ? 'badge-completed' : 'badge-submitted'}">${b.status}</span></td>
          <td style="text-align: right;">
            <button type="button" class="btn-secondary btn-inspect-dossier" data-batch-id="${b.batch_id}">
              Review Batch →
            </button>
          </td>
        `;

        tr.querySelector('.btn-inspect-dossier').addEventListener('click', () => {
          switchView('queue');
          openBatchWorkbench(b.batch_id);
        });

        inspectorHistoryTableBody.appendChild(tr);
      });
    } catch (err) {
      inspectorHistoryTableBody.innerHTML = `<tr><td colspan="7" class="table-empty" style="color:var(--red-text);">Error: ${err.message}</td></tr>`;
    }
  }

  if (btnCloseInspectorHistory) {
    btnCloseInspectorHistory.addEventListener('click', () => {
      inspectorHistoryContainer.classList.add('hidden');
    });
  }

  // ==========================================================================
  // VIEW 4: PERMANENT REGULATORY LEDGER
  // ==========================================================================
  const ledgerSearchInput = document.getElementById('ledgerSearchInput');
  const ledgerCategoryFilter = document.getElementById('ledgerCategoryFilter');
  const ledgerStatusFilter = document.getElementById('ledgerStatusFilter');
  const btnRefreshLedger = document.getElementById('btnRefreshLedger');
  const ledgerBulkBar = document.getElementById('ledgerBulkBar');
  const ledgerSelectedCountBadge = document.getElementById('ledgerSelectedCountBadge');
  const btnGenerateCombinedLedgerPdf = document.getElementById('btnGenerateCombinedLedgerPdf');
  const chkLedgerSelectAll = document.getElementById('chkLedgerSelectAll');
  const officerLedgerTableBody = document.getElementById('officerLedgerTableBody');

  const selectedLedgerItems = new Set();

  if (btnRefreshLedger) {
    btnRefreshLedger.addEventListener('click', () => loadOfficerLedger());
  }

  if (ledgerCategoryFilter) {
    ledgerCategoryFilter.addEventListener('change', () => loadOfficerLedger());
  }

  if (ledgerStatusFilter) {
    ledgerStatusFilter.addEventListener('change', () => loadOfficerLedger());
  }

  if (ledgerSearchInput) {
    let searchDebounce = null;
    ledgerSearchInput.addEventListener('input', () => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => loadOfficerLedger(), 350);
    });
  }

  async function loadOfficerLedger() {
    if (!officerLedgerTableBody) return;
    officerLedgerTableBody.innerHTML = '<tr><td colspan="9" class="table-empty">Loading official ledger entries...</td></tr>';
    selectedLedgerItems.clear();
    updateLedgerBulkBar();

    try {
      const params = new URLSearchParams();
      params.set('officer_id', officerId);
      if (ledgerCategoryFilter && ledgerCategoryFilter.value !== 'all') {
        params.set('category', ledgerCategoryFilter.value);
      }
      if (ledgerStatusFilter && ledgerStatusFilter.value !== 'all') {
        params.set('status', ledgerStatusFilter.value);
      }
      if (ledgerSearchInput && ledgerSearchInput.value.trim()) {
        params.set('search', ledgerSearchInput.value.trim());
      }

      const res = await fetch(`${API_BASE_URL}/api/officer/ledger?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();
      const items = Array.isArray(raw) ? raw : (raw.items || []);

      renderLedgerItems(items);
    } catch (err) {
      officerLedgerTableBody.innerHTML = `<tr><td colspan="9" class="table-empty" style="color:var(--red-text);">Error: ${err.message}</td></tr>`;
    }
  }

  function renderLedgerItems(items) {
    if (!officerLedgerTableBody) return;
    if (!items || items.length === 0) {
      officerLedgerTableBody.innerHTML = '<tr><td colspan="9" class="table-empty">No reviewed records matching criteria found in the ledger.</td></tr>';
      return;
    }

    officerLedgerTableBody.innerHTML = '';
    items.forEach(item => {
      const tr = document.createElement('tr');
      const isCompliant = item.final_verdict !== undefined ? item.final_verdict : item.compliant;
      const verdictPill = isCompliant
        ? '<span class="declaration-pill pill-compliant">✓ Compliant</span>'
        : '<span class="declaration-pill pill-missing">✗ Violation</span>';

      const action = item.officer_action || item.review_status;
      const actionText = action === 'override' || action === 'overridden'
        ? `Overridden by ${item.reviewed_by || 'Officer'}`
        : (action === 'correct' || action === 'corrected'
            ? `Corrected by ${item.reviewed_by || 'Officer'}`
            : `Approved by ${item.reviewed_by || 'Officer'}`);

      tr.innerHTML = `
        <td style="width: 36px; text-align: center;">
          <input type="checkbox" class="chk-ledger-item" data-item-id="${item.item_id}" style="accent-color: #1E1B4B; transform: scale(1.1); cursor: pointer;" />
        </td>
        <td><strong style="font-family:var(--font-mono); font-size:0.8rem;">${item.item_id}</strong></td>
        <td>
          <div style="font-weight:600; color:#14163A;">${item.product_name || 'Commodity'}</div>
          <div style="font-size:0.72rem; color:#64748B;">${item.brand || item.manufacturer || 'Declared'}</div>
        </td>
        <td><span class="badge" style="background:#F1F5F9; color:#334155; font-size:0.72rem;">${item.product_category || 'General'}</span></td>
        <td>
          <div style="font-size:0.82rem; font-weight:500;">${item.store_name || 'Establishment'}</div>
          <div style="font-size:0.72rem; color:#64748B;">${item.store_location || ''}</div>
        </td>
        <td>
          <div style="font-size:0.8rem;">${item.inspector_name || item.inspector_id || 'LMO'}</div>
        </td>
        <td>${verdictPill}</td>
        <td style="font-size:0.75rem; color:#64748B;">${actionText}</td>
        <td style="text-align: right;">
          <button type="button" class="btn-secondary btn-ledger-report" data-item-id="${item.item_id}" style="font-size: 0.78rem; padding: 0.3rem 0.65rem;">
            📄 Report
          </button>
        </td>
      `;

      // Wire Row Checkbox
      const chk = tr.querySelector('.chk-ledger-item');
      chk.addEventListener('change', () => {
        if (chk.checked) selectedLedgerItems.add(item.item_id);
        else selectedLedgerItems.delete(item.item_id);
        updateLedgerBulkBar();
      });

      // Wire Report Download
      tr.querySelector('.btn-ledger-report').addEventListener('click', () => {
        window.open(`${API_BASE_URL}/api/officer/reports/item/${item.item_id}`, '_blank');
      });

      officerLedgerTableBody.appendChild(tr);
    });
  }

  function updateLedgerBulkBar() {
    if (!ledgerBulkBar) return;
    const count = selectedLedgerItems.size;
    if (ledgerSelectedCountBadge) ledgerSelectedCountBadge.textContent = count;
    ledgerBulkBar.classList.toggle('hidden', count === 0);
  }

  if (chkLedgerSelectAll) {
    chkLedgerSelectAll.addEventListener('change', () => {
      const checkboxes = officerLedgerTableBody ? officerLedgerTableBody.querySelectorAll('.chk-ledger-item') : [];
      checkboxes.forEach(chk => {
        chk.checked = chkLedgerSelectAll.checked;
        const id = chk.getAttribute('data-item-id');
        if (chkLedgerSelectAll.checked) selectedLedgerItems.add(id);
        else selectedLedgerItems.delete(id);
      });
      updateLedgerBulkBar();
    });
  }

  // Combined Multi-Item PDF Report Generation
  if (btnGenerateCombinedLedgerPdf) {
    btnGenerateCombinedLedgerPdf.addEventListener('click', async () => {
      const itemIds = Array.from(selectedLedgerItems);
      if (itemIds.length === 0) {
        await showAlert('Please select at least one ledger record to compile a combined dossier report.', 'Selection Required');
        return;
      }

      try {
        btnGenerateCombinedLedgerPdf.disabled = true;
        btnGenerateCombinedLedgerPdf.textContent = 'Generating PDF...';

        const res = await fetch(`${API_BASE_URL}/api/officer/reports/combined`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item_ids: itemIds,
            officer_id: officerId,
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }

        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `LabelLens_Combined_Ledger_${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
      } catch (err) {
        await showAlert(`Combined PDF compilation failed: ${err.message}`, 'PDF Generation Error');
      } finally {
        btnGenerateCombinedLedgerPdf.disabled = false;
        btnGenerateCombinedLedgerPdf.textContent = '📄 Generate Combined PDF Report →';
      }
    });
  }

  // ==========================================================================
  // VIEW 5: STAGE 3 EXECUTIVE REPORTING & ANALYTICS
  // ==========================================================================
  const rptTotalScans = document.getElementById('rptTotalScans');
  const rptComplianceRate = document.getElementById('rptComplianceRate');
  const rptCompliantSub = document.getElementById('rptCompliantSub');
  const rptNonCompliantCount = document.getElementById('rptNonCompliantCount');
  const rptActiveInspectorsCount = document.getElementById('rptActiveInspectorsCount');
  const rptTopViolationsTableBody = document.getElementById('rptTopViolationsTableBody');
  const reportDateFrom = document.getElementById('reportDateFrom');
  const reportDateTo = document.getElementById('reportDateTo');
  const btnDownloadAggregatePdf = document.getElementById('btnDownloadAggregatePdf');

  // Set default dates (past 7 days to today)
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);

  if (reportDateTo) reportDateTo.value = today.toISOString().split('T')[0];
  if (reportDateFrom) reportDateFrom.value = sevenDaysAgo.toISOString().split('T')[0];

  // Preset buttons
  document.querySelectorAll('.btn-range-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-range-preset').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const days = parseInt(btn.getAttribute('data-days'), 10) || 7;
      const d = new Date();
      d.setDate(today.getDate() - days);
      if (reportDateFrom) reportDateFrom.value = d.toISOString().split('T')[0];
      if (reportDateTo) reportDateTo.value = today.toISOString().split('T')[0];

      loadOfficerReports(days);
    });
  });

  if (reportDateFrom) {
    reportDateFrom.addEventListener('change', () => loadOfficerReports(null));
  }
  if (reportDateTo) {
    reportDateTo.addEventListener('change', () => loadOfficerReports(null));
  }

  async function loadOfficerReports(presetDays = 7) {
    try {
      const from = reportDateFrom ? reportDateFrom.value : '';
      const to = reportDateTo ? reportDateTo.value : '';

      const params = new URLSearchParams();
      params.set('officer_id', officerId);
      params.set('format', 'json');
      if (from) params.set('from', from);
      if (to) params.set('to', to);

      // Fetch aggregate report data
      const res = await fetch(`${API_BASE_URL}/api/officer/reports/aggregate?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const summary = data.summary || {};
      const totalScanned = summary.total_scanned ?? 0;
      const rate = summary.compliance_rate ?? 0;
      const nonCompliant = summary.non_compliant ?? 0;
      const compliant = summary.compliant ?? 0;
      const activeInspectors = summary.active_inspectors ?? 1;

      if (rptTotalScans) rptTotalScans.textContent = totalScanned;
      if (rptComplianceRate) rptComplianceRate.textContent = `${rate}%`;
      if (rptCompliantSub) rptCompliantSub.textContent = `${compliant} compliant packages`;
      if (rptNonCompliantCount) rptNonCompliantCount.textContent = nonCompliant;
      if (rptActiveInspectorsCount) rptActiveInspectorsCount.textContent = activeInspectors;

      // Render top statutory violations
      renderTopViolations(data.top_violations || []);
    } catch (err) {
      console.error('Error loading reports analytics:', err);
    }
  }

  function renderTopViolations(violations) {
    if (!rptTopViolationsTableBody) return;
    if (!violations || violations.length === 0) {
      rptTopViolationsTableBody.innerHTML = '<tr><td colspan="5" class="table-empty">No statutory violations detected in this reporting cycle.</td></tr>';
      return;
    }

    rptTopViolationsTableBody.innerHTML = '';
    violations.forEach((v, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong style="color:#C79A3E;">#${idx + 1}</strong></td>
        <td><strong style="color:#14163A;">${v.requirement}</strong></td>
        <td><code style="background:#F1F5F9; padding:2px 6px; border-radius:4px; font-size:0.75rem;">${v.rule_citation}</code></td>
        <td><span style="font-weight:700; color:#DC2626;">${v.infractions_count}</span></td>
        <td><strong>${v.percentage}%</strong></td>
      `;
      rptTopViolationsTableBody.appendChild(tr);
    });
  }

  // ==========================================================================
  // LEVEL 3: EXECUTIVE AGGREGATE REPORT MODAL & GENERATION
  // ==========================================================================
  const aggregateReportModal = document.getElementById('aggregateReportModal');
  const btnCloseAggregateReportModal = document.getElementById('btnCloseAggregateReportModal');
  const btnCancelAggregateReportModal = document.getElementById('btnCancelAggregateReportModal');
  const btnConfirmGenerateAggregatePdf = document.getElementById('btnConfirmGenerateAggregatePdf');
  const btnModalRptRefreshPreview = document.getElementById('btnModalRptRefreshPreview');
  const modalRptDateFrom = document.getElementById('modalRptDateFrom');
  const modalRptDateTo = document.getElementById('modalRptDateTo');
  const modalRptVerdictFilter = document.getElementById('modalRptVerdictFilter');
  const modalRptMatchCount = document.getElementById('modalRptMatchCount');
  const modalRptMatchBreakdown = document.getElementById('modalRptMatchBreakdown');
  const modalRptPreviewTableBody = document.getElementById('modalRptPreviewTableBody');
  const modalRptPreviewCountNote = document.getElementById('modalRptPreviewCountNote');

  function openAggregateReportModal() {
    if (!aggregateReportModal) return;
    if (modalRptDateFrom && reportDateFrom) modalRptDateFrom.value = reportDateFrom.value;
    if (modalRptDateTo && reportDateTo) modalRptDateTo.value = reportDateTo.value;
    if (modalRptVerdictFilter) modalRptVerdictFilter.value = 'all';

    aggregateReportModal.classList.remove('hidden');
    loadAggregateReportPreview();
  }

  function closeAggregateReportModal() {
    if (aggregateReportModal) aggregateReportModal.classList.add('hidden');
  }

  if (btnCloseAggregateReportModal) btnCloseAggregateReportModal.addEventListener('click', closeAggregateReportModal);
  if (btnCancelAggregateReportModal) btnCancelAggregateReportModal.addEventListener('click', closeAggregateReportModal);

  if (aggregateReportModal) {
    aggregateReportModal.addEventListener('click', (e) => {
      if (e.target === aggregateReportModal) closeAggregateReportModal();
    });
  }

  if (modalRptDateFrom) modalRptDateFrom.addEventListener('change', () => loadAggregateReportPreview());
  if (modalRptDateTo) modalRptDateTo.addEventListener('change', () => loadAggregateReportPreview());
  if (modalRptVerdictFilter) modalRptVerdictFilter.addEventListener('change', () => loadAggregateReportPreview());
  if (btnModalRptRefreshPreview) btnModalRptRefreshPreview.addEventListener('click', () => loadAggregateReportPreview());

  async function loadAggregateReportPreview() {
    if (!modalRptPreviewTableBody) return;
    modalRptPreviewTableBody.innerHTML = '<tr><td colspan="7" class="table-empty">Querying jurisdictional database for matching records...</td></tr>';
    if (modalRptMatchCount) modalRptMatchCount.textContent = 'Matching Items: Calculating...';
    if (modalRptMatchBreakdown) modalRptMatchBreakdown.textContent = '';

    try {
      const from = modalRptDateFrom ? modalRptDateFrom.value : '';
      const to = modalRptDateTo ? modalRptDateTo.value : '';
      const verdict = modalRptVerdictFilter ? modalRptVerdictFilter.value : 'all';

      const params = new URLSearchParams();
      params.set('officer_id', officerId);
      params.set('format', 'json');
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (verdict) params.set('verdict', verdict);

      const res = await fetch(`${API_BASE_URL}/api/officer/reports/aggregate?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const items = data.items || [];
      const summary = data.summary || {};

      if (modalRptMatchCount) {
        modalRptMatchCount.textContent = `Matching Items: ${items.length} records`;
      }
      if (modalRptMatchBreakdown) {
        modalRptMatchBreakdown.textContent = `(${summary.compliant || 0} compliant, ${summary.non_compliant || 0} infractions in window)`;
      }
      if (modalRptPreviewCountNote) {
        modalRptPreviewCountNote.textContent = `Showing ${Math.min(25, items.length)} of ${items.length} records`;
      }

      if (items.length === 0) {
        modalRptPreviewTableBody.innerHTML = '<tr><td colspan="7" class="table-empty">No item records match the specified date range and verdict filter.</td></tr>';
        return;
      }

      modalRptPreviewTableBody.innerHTML = '';
      const previewItems = items.slice(0, 25);
      previewItems.forEach(it => {
        const tr = document.createElement('tr');
        const isComp = Boolean(it.compliant);
        tr.innerHTML = `
          <td><strong style="color: #14163A;">${it.product_name}</strong></td>
          <td><span style="color: #64748B;">${it.product_category}</span></td>
          <td><span class="badge ${isComp ? 'badge-approved' : 'badge-override'}">${isComp ? 'COMPLIANT' : 'NON-COMPLIANT'}</span></td>
          <td style="max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${it.missing_declarations}">
            <span style="color: ${isComp ? '#16A34A' : '#DC2626'}; font-size: 0.75rem;">${it.missing_declarations}</span>
          </td>
          <td><span style="color: #334155;">${it.inspector_name}</span></td>
          <td><code style="font-size: 0.72rem; background: #F1F5F9; padding: 2px 4px; border-radius: 3px;">${it.batch_id}</code></td>
          <td><span style="color: #64748B; font-size: 0.75rem;">${it.date}</span></td>
        `;
        modalRptPreviewTableBody.appendChild(tr);
      });
    } catch (err) {
      console.error('Error loading aggregate report preview:', err);
      modalRptPreviewTableBody.innerHTML = '<tr><td colspan="7" class="table-empty" style="color:#DC2626;">Failed to load preview records. Please check network/parameters.</td></tr>';
    }
  }

  // Level 3 Executive Report Download button opens the configuration modal
  if (btnDownloadAggregatePdf) {
    btnDownloadAggregatePdf.addEventListener('click', () => {
      openAggregateReportModal();
    });
  }

  // Confirm and generate aggregate PDF
  if (btnConfirmGenerateAggregatePdf) {
    btnConfirmGenerateAggregatePdf.addEventListener('click', () => {
      const from = modalRptDateFrom ? modalRptDateFrom.value : (reportDateFrom ? reportDateFrom.value : '');
      const to = modalRptDateTo ? modalRptDateTo.value : (reportDateTo ? reportDateTo.value : '');
      const verdict = modalRptVerdictFilter ? modalRptVerdictFilter.value : 'all';

      const params = new URLSearchParams();
      params.set('officer_id', officerId);
      params.set('format', 'pdf');
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (verdict) params.set('verdict', verdict);

      window.open(`${API_BASE_URL}/api/officer/reports/aggregate?${params.toString()}`, '_blank');
      closeAggregateReportModal();
    });
  }

  // ==========================================================================
  // SPECIMEN REVIEW MODAL & 4 ACTIONS
  // ==========================================================================
  const officerReviewModal = document.getElementById('officerReviewModal');
  const btnCloseOfficerModal = document.getElementById('btnCloseOfficerModal');
  const btnModalGeneratePdf = document.getElementById('btnModalGeneratePdf');
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
  const officerRemarksInput = document.getElementById('officerRemarksInput');
  const btnSaveDeclarationEdits = document.getElementById('btnSaveDeclarationEdits');
  const declEditStatus = document.getElementById('declEditStatus');

  const btnOfficerApproveAsIs = document.getElementById('btnOfficerApproveAsIs');
  const btnOfficerOverride = document.getElementById('btnOfficerOverride');
  const btnOfficerOverrideSub = document.getElementById('btnOfficerOverrideSub');
  const btnOfficerRecapture = document.getElementById('btnOfficerRecapture');
  const btnOfficerCorrect = document.getElementById('btnOfficerCorrect');

  let stagedEdits = {
    declaration_values: {},
    declarations_found: [],
    declarations_missing: [],
    isDirty: false,
  };

  function escapeAttr(str) {
    if (!str) return '';
    return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function detectProductOriginClient(mfrText, ocrText, cooText) {
    const combined = `${mfrText || ''} ${ocrText || ''} ${cooText || ''}`.toLowerCase();
    const foreign = ['china', 'usa', 'united states', 'uk', 'germany', 'japan', 'thailand', 'vietnam', 'taiwan', 'italy', 'france', 'korea', 'indonesia', 'malaysia', 'bangladesh', 'sri lanka', 'spain', 'brazil', 'mexico', 'switzerland', 'belgium', 'netherlands', 'australia', 'singapore'];
    for (const c of foreign) {
      if (new RegExp(`\\b(?:country\\s*of\\s*origin\\s*[:.]?\\s*|made\\s*in\\s*|product\\s*of\\s*|imported\\s*(?:from|by)\\s*[:.]?\\s*)${c}\\b`, 'i').test(combined)) {
        return 'Imported';
      }
    }
    if (/\b(?:imported\s*(?:by|from|commodity)|country\s*of\s*origin\s*[:.]?\\s*(?!india\b)[a-z]+)\b/i.test(combined)) {
      return 'Imported';
    }
    return 'Domestic';
  }

  function openOfficerReviewModal(item) {
    currentReviewingItem = item;

    const detectedOrigin = item.product_origin || item.declaration_values?.product_origin || detectProductOriginClient(
      item.declaration_values?.manufacturer_details,
      item.raw_ocr_text,
      item.declaration_values?.country_of_origin
    );

    stagedEdits = {
      product_origin: detectedOrigin === 'Imported' ? 'Imported' : 'Domestic',
      declaration_values: { ...(item.declaration_values || {}) },
      declarations_found: [ ...(item.declarations_found || []) ],
      declarations_missing: [ ...(item.declarations_missing || []) ],
      isDirty: false,
    };

    if (stagedEdits.declarations_found.length === 0 && stagedEdits.declarations_missing.length === 0) {
      MANDATORY_RULE6_FIELDS.forEach(field => {
        const val = stagedEdits.declaration_values[field.key];
        if (val && String(val).trim()) {
          stagedEdits.declarations_found.push(field.key);
        } else {
          stagedEdits.declarations_missing.push(field.key);
        }
      });
    }

    modalCommodityTitle.textContent = item.product_name || 'Product Item';
    modalBatchRef.textContent = `Batch: ${activeBatch ? activeBatch.batch_id : (item.batch_id || '--')}`;
    modalInspectorRef.textContent = `Inspector: ${activeBatch ? (activeBatch.inspector_name || activeBatch.inspector_id || 'LMO') : (item.inspector_id || 'LMO')}`;
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

    const photos = currentReviewingItem ? (currentReviewingItem.photos || []) : [];
    const photo = photos.find(p => p.angle === angle) || photos[0];

    if (photo && modalEvidenceImage) {
      modalEvidenceImage.src = formatPhotoUrl(photo.url);
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

  const MANDATORY_RULE6_FIELDS = [
    { key: 'commodity_name', label: 'Commodity Name / Identity', rule: 'Rule 6(1)(b)' },
    { key: 'net_quantity', label: 'Net Quantity (Metric Units)', rule: 'Rule 6(1)(c)' },
    { key: 'mrp', label: 'Maximum Retail Price (MRP)', rule: 'Rule 6(1)(e)' },
    { key: 'unit_sale_price', label: 'Unit Sale Price (USP)', rule: 'Rule 6(1)(i)' },
    { key: 'manufacturing_date', label: 'Date of Manufacture / Pkg', rule: 'Rule 6(1)(d)' },
    { key: 'best_before', label: 'Best Before / Expiry Date', rule: 'Rule 6(1)(h)' },
    { key: 'manufacturer_details', label: 'Manufacturer / Packer Details', rule: 'Rule 6(1)(a)' },
    { key: 'consumer_care', label: 'Consumer Care Contact / Email', rule: 'Rule 6(1)(ca)' },
    { key: 'country_of_origin', label: 'Country of Origin (Imports)', rule: 'Rule 6(1)(f)' },
    { key: 'dimensions', label: 'Dimensions (Size / Dimensions)', rule: 'Rule 6(1)(m)' },
  ];

  function isSingleUnitPackage(item) {
    if (!item) return true;
    if (item.pack_type === 'Single-unit' || item.pack_type === 'single-unit' || item.is_single_unit === true || item.single_unit === true) return true;
    if (item.pack_type === 'Multi-unit' || item.pack_type === 'multi-unit') return false;

    const declVals = item.declaration_values || (stagedEdits && stagedEdits.declaration_values) || {};
    const netQty = (declVals.net_quantity || '').toLowerCase().trim();
    const prodName = (item.product_name || (stagedEdits && stagedEdits.product_name) || '').toLowerCase();
    const text = ((item.cleaned_summary || '') + ' ' + (item.raw_ocr_text || '') + ' ' + prodName + ' ' + netQty).toLowerCase();

    // Multi-pack patterns (Rule 6(1)(i) USP requirement is ONLY for genuine multi-packs)
    if (/\b(?:pack|bundle|set|combo|box|case|bag)\s*of\s*([2-9]|[1-9][0-9]+)\b/i.test(text)) return false;
    if (/\b(?:multipack|multi-pack|twin\s*pack|triple\s*pack|duo\s*pack|combo\s*pack)\b/i.test(text)) return false;
    if (/\b([2-9]|[1-9][0-9]+)\s*[x×*]\s*[0-9]+/i.test(text)) return false;
    if (/\b[0-9.]+\s*(?:g|kg|ml|l|ltr|gm|grams)?\s*[x×*]\s*([2-9]|[1-9][0-9]+)\b/i.test(netQty) ||
        /\b([2-9]|[1-9][0-9]+)\s*[x×*]\s*[0-9.]+\s*(?:g|kg|ml|l|ltr|gm|grams)\b/i.test(netQty)) return false;
    if (/\b([2-9]|[1-9][0-9]+)\s*(?:units|pieces|pcs|items|bars|bottles|cans|pouches|sachets|tins|tubes|packs|packets)\b/i.test(netQty) ||
        /\b(?:contains|includes|consists\s*of)\s*([2-9]|[1-9][0-9]+)\s*(?:units|pieces|pcs|items|bars|bottles|cans|pouches|sachets|tins|tubes|packs|packets)\b/i.test(text)) return false;

    // Default: Single retail package sold at one MRP is exempt from USP regardless of count, weight, or volume
    return true;
  }

  function isDimensionsExempt(item) {
    if (!item) return true;
    const declVals = item.declaration_values || (typeof stagedEdits !== 'undefined' && stagedEdits?.declaration_values) || {};
    const dimVal = (declVals.dimensions || '').trim();
    if (dimVal && !/^(n\/?a|not applicable|exempt)/i.test(dimVal)) {
      return false;
    }
    return true;
  }

  function renderRule6List(item) {
    if (!modalRule6List) return;
    modalRule6List.innerHTML = '';

    if (declEditStatus) {
      declEditStatus.textContent = stagedEdits.isDirty
        ? '• Unsaved declaration edits pending'
        : '(Click Present/Absent to toggle, edit values directly)';
      declEditStatus.style.color = stagedEdits.isDirty ? '#B45309' : '#64748B';
    }

    const isDomestic = stagedEdits.product_origin === 'Domestic';

    // 0. Dedicated Product Origin Control Card
    const originCard = document.createElement('div');
    originCard.className = 'decl-editor-card decl-origin-card';
    originCard.style.borderLeft = '3.5px solid #C79A3E';
    originCard.style.background = '#FFFDF8';
    originCard.innerHTML = `
      <div class="decl-editor-top" style="display: flex; justify-content: space-between; align-items: center;">
        <div class="decl-label-box">
          <span class="decl-title" style="font-weight: 700; font-size: 0.84rem; color: #14163A;">Product Origin</span>
          <span class="decl-sub-tag" style="font-family: var(--font-mono); font-size: 0.7rem; color: #B45309;">Rule 6(1)(f) Exemption Control</span>
        </div>
        <div class="decl-toggle-pill-group">
          <button type="button" class="btn-decl-toggle ${isDomestic ? 'active-present' : ''}" data-origin="Domestic" style="cursor: pointer;">Domestic (India)</button>
          <button type="button" class="btn-decl-toggle ${!isDomestic ? 'active-absent' : ''}" data-origin="Imported" style="cursor: pointer;">Imported</button>
        </div>
      </div>
      <div style="font-size: 0.73rem; color: ${isDomestic ? '#166534' : '#991B1B'}; margin-top: 0.35rem; font-weight: 500;">
        ${isDomestic ? '✓ Domestically manufactured — Country of Origin is exempt under Rule 6(1)(f).' : '⚠️ Imported commodity — Country of Origin is mandatory under Rule 6(1)(f).'}
      </div>
    `;

    originCard.querySelector('[data-origin="Domestic"]').addEventListener('click', () => {
      if (stagedEdits.product_origin !== 'Domestic') {
        stagedEdits.product_origin = 'Domestic';
        stagedEdits.isDirty = true;
        renderRule6List(item);
      }
    });
    originCard.querySelector('[data-origin="Imported"]').addEventListener('click', () => {
      if (stagedEdits.product_origin !== 'Imported') {
        stagedEdits.product_origin = 'Imported';
        stagedEdits.isDirty = true;
        renderRule6List(item);
      }
    });
    modalRule6List.appendChild(originCard);

    const foundSet = new Set(stagedEdits.declarations_found || []);

    MANDATORY_RULE6_FIELDS.forEach(field => {
      const isFound = foundSet.has(field.key);
      let val = stagedEdits.declaration_values[field.key] || '';

      // Normalize any existing legacy exemption strings to 'Not Applicable'
      if (typeof val === 'string' && /^(n\/?a\s*\(exempt|exempt)/i.test(val.trim())) {
        val = 'Not Applicable';
      }

      // Special handling for Country of Origin when product is Domestic
      if (field.key === 'country_of_origin' && isDomestic) {
        if (!val || !val.trim() || val === 'Not Applicable' || !isFound) {
          const card = document.createElement('div');
          card.className = 'decl-editor-card is-present';
          card.style.background = '#F0FDF4';
          card.style.borderColor = '#86EFAC';
          card.setAttribute('data-key', field.key);
          card.innerHTML = `
            <div class="decl-editor-top" style="display: flex; justify-content: space-between; align-items: center;">
              <div class="decl-label-box">
                <span class="decl-title" style="font-weight: 600; font-size: 0.82rem; color: #166534;">${field.label}</span>
                <span class="decl-sub-tag" style="font-family: var(--font-mono); font-size: 0.7rem; color: #15803D;">Rule 6(1)(f) • Conditional</span>
              </div>
              <div>
                <span style="font-size: 0.72rem; font-weight: 600; background: #DCFCE7; color: #166534; padding: 3px 8px; border-radius: 999px; border: 1px solid #86EFAC;">
                  Not Applicable
                </span>
              </div>
            </div>
            <div class="decl-input-row" style="margin-top: 0.35rem;">
              <input type="text" class="decl-field-input" data-key="${field.key}" value="" placeholder="Not Applicable" disabled style="background: #F8FAFC; color: #64748B;" />
            </div>
          `;
          modalRule6List.appendChild(card);
          return;
        }
      }

      // Special handling for Unit Sale Price when product is a Single-unit package
      if (field.key === 'unit_sale_price' && isSingleUnitPackage(item)) {
        if (!val || !val.trim() || val === 'Not Applicable' || !isFound) {
          const card = document.createElement('div');
          card.className = 'decl-editor-card is-present';
          card.style.background = '#F0FDF4';
          card.style.borderColor = '#86EFAC';
          card.setAttribute('data-key', field.key);
          card.innerHTML = `
            <div class="decl-editor-top" style="display: flex; justify-content: space-between; align-items: center;">
              <div class="decl-label-box">
                <span class="decl-title" style="font-weight: 600; font-size: 0.82rem; color: #166534;">${field.label}</span>
                <span class="decl-sub-tag" style="font-family: var(--font-mono); font-size: 0.7rem; color: #15803D;">Rule 6(1)(i) • Conditional</span>
              </div>
              <div>
                <span style="font-size: 0.72rem; font-weight: 600; background: #DCFCE7; color: #166534; padding: 3px 8px; border-radius: 999px; border: 1px solid #86EFAC;">
                  Not Applicable
                </span>
              </div>
            </div>
            <div class="decl-input-row" style="margin-top: 0.35rem;">
              <input type="text" class="decl-field-input" data-key="${field.key}" value="" placeholder="Not Applicable" disabled style="background: #F8FAFC; color: #64748B;" />
            </div>
          `;
          modalRule6List.appendChild(card);
          return;
        }
      }

      // Special handling for Dimensions of Commodity when product is exempt
      if (field.key === 'dimensions' && isDimensionsExempt(item)) {
        if (!val || !val.trim() || val === 'Not Applicable' || !isFound) {
          const card = document.createElement('div');
          card.className = 'decl-editor-card is-present';
          card.style.background = '#F0FDF4';
          card.style.borderColor = '#86EFAC';
          card.setAttribute('data-key', field.key);
          card.innerHTML = `
            <div class="decl-editor-top" style="display: flex; justify-content: space-between; align-items: center;">
              <div class="decl-label-box">
                <span class="decl-title" style="font-weight: 600; font-size: 0.82rem; color: #166534;">${field.label}</span>
                <span class="decl-sub-tag" style="font-family: var(--font-mono); font-size: 0.7rem; color: #15803D;">Rule 6(1)(m) • Conditional</span>
              </div>
              <div>
                <span style="font-size: 0.72rem; font-weight: 600; background: #DCFCE7; color: #166534; padding: 3px 8px; border-radius: 999px; border: 1px solid #86EFAC;">
                  Not Applicable
                </span>
              </div>
            </div>
            <div class="decl-input-row" style="margin-top: 0.35rem;">
              <input type="text" class="decl-field-input" data-key="${field.key}" value="" placeholder="Not Applicable" disabled style="background: #F8FAFC; color: #64748B;" />
            </div>
          `;
          modalRule6List.appendChild(card);
          return;
        }
      }

      const card = document.createElement('div');
      card.className = `decl-editor-card ${isFound ? 'is-present' : 'is-absent'}`;
      card.setAttribute('data-key', field.key);

      card.innerHTML = `
        <div class="decl-editor-top" style="display: flex; justify-content: space-between; align-items: center;">
          <div class="decl-label-box">
            <span class="decl-title" style="font-weight: 600; font-size: 0.82rem; color: #14163A;">${field.label}</span>
            <span class="decl-sub-tag" style="font-family: var(--font-mono); font-size: 0.7rem; color: #64748B;">${field.rule}</span>
          </div>
          <div class="decl-toggle-pill-group">
            <button type="button" class="btn-decl-toggle ${isFound ? 'active-present' : ''}" data-status="present">Present</button>
            <button type="button" class="btn-decl-toggle ${!isFound ? 'active-absent' : ''}" data-status="absent">Absent</button>
          </div>
        </div>
        <div class="decl-input-row" style="margin-top: 0.35rem;">
          <input type="text" class="decl-field-input" data-key="${field.key}" value="${escapeAttr(val)}" placeholder="Enter detected statutory text..." ${!isFound ? 'disabled' : ''} />
        </div>
      `;

      const btnPresent = card.querySelector('[data-status="present"]');
      const btnAbsent = card.querySelector('[data-status="absent"]');
      const input = card.querySelector('.decl-field-input');

      btnPresent.addEventListener('click', () => {
        if (!stagedEdits.declarations_found.includes(field.key)) {
          stagedEdits.declarations_found.push(field.key);
        }
        stagedEdits.declarations_missing = stagedEdits.declarations_missing.filter(k => k !== field.key);
        stagedEdits.isDirty = true;
        card.classList.remove('is-absent');
        card.classList.add('is-present');
        btnPresent.classList.add('active-present');
        btnAbsent.classList.remove('active-absent');
        input.disabled = false;
        input.focus();
        if (declEditStatus) {
          declEditStatus.textContent = '• Unsaved declaration edits pending';
          declEditStatus.style.color = '#B45309';
        }
      });

      btnAbsent.addEventListener('click', () => {
        if (!stagedEdits.declarations_missing.includes(field.key)) {
          stagedEdits.declarations_missing.push(field.key);
        }
        stagedEdits.declarations_found = stagedEdits.declarations_found.filter(k => k !== field.key);
        stagedEdits.isDirty = true;
        card.classList.remove('is-present');
        card.classList.add('is-absent');
        btnAbsent.classList.add('active-absent');
        btnPresent.classList.remove('active-present');
        input.disabled = true;
        if (declEditStatus) {
          declEditStatus.textContent = '• Unsaved declaration edits pending';
          declEditStatus.style.color = '#B45309';
        }
      });

      input.addEventListener('input', (e) => {
        stagedEdits.declaration_values[field.key] = e.target.value;
        stagedEdits.isDirty = true;
        if (declEditStatus) {
          declEditStatus.textContent = '• Unsaved declaration edits pending';
          declEditStatus.style.color = '#B45309';
        }
      });

      modalRule6List.appendChild(card);
    });
  }

  // Save Declaration Edits Button Handler
  if (btnSaveDeclarationEdits) {
    btnSaveDeclarationEdits.addEventListener('click', async () => {
      if (!currentReviewingItem) return;
      const oldText = btnSaveDeclarationEdits.innerHTML;
      btnSaveDeclarationEdits.innerHTML = '💾 Saving...';
      btnSaveDeclarationEdits.disabled = true;

      try {
        const res = await fetch(`${API_BASE_URL}/api/officer/review-item`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item_id: currentReviewingItem.item_id,
            action: 'save_edits',
            product_origin: stagedEdits.product_origin,
            declaration_values: stagedEdits.declaration_values,
            declarations_found: stagedEdits.declarations_found,
            declarations_missing: stagedEdits.declarations_missing,
            remarks: officerRemarksInput ? officerRemarksInput.value.trim() : '',
            reviewer_name: user.full_name || 'Dr. S. K. Sharma',
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to save declaration edits (HTTP ${res.status})`);
        }

        const updated = await res.json();
        currentReviewingItem.declaration_values = updated.declaration_values;
        currentReviewingItem.declarations_found = updated.declarations_found;
        currentReviewingItem.declarations_missing = updated.declarations_missing;
        currentReviewingItem.compliant = updated.compliant;
        currentReviewingItem.needs_review = updated.needs_review;
        currentReviewingItem.product_origin = updated.declaration_values?.product_origin || stagedEdits.product_origin;
        stagedEdits.isDirty = false;

        // Immediately update modal verdict pill
        if (modalFieldVerdictPill) {
          if (updated.compliant) {
            modalFieldVerdictPill.className = 'status-pill status-compliant';
            modalFieldVerdictPill.textContent = 'Preliminary: Compliant';
          } else {
            modalFieldVerdictPill.className = 'status-pill status-noncompliant';
            modalFieldVerdictPill.textContent = 'Preliminary: Non-Compliant';
          }
        }

        if (btnOfficerOverrideSub) {
          btnOfficerOverrideSub.textContent = updated.compliant
            ? 'Flip to Non-Compliant (Violation)'
            : 'Flip to Compliant (Valid Declaration)';
        }

        if (declEditStatus) {
          declEditStatus.textContent = '✓ Declaration edits & recalculated verdict saved to record';
          declEditStatus.style.color = '#16A34A';
        }

        if (activeBatch && activeBatch.items) {
          const idx = activeBatch.items.findIndex(i => i.item_id === updated.item_id);
          if (idx !== -1) {
            activeBatch.items[idx] = { ...activeBatch.items[idx], ...updated };
            renderWorkbenchItems(activeBatch.items);
          }
        }

        await showAlert(`Rule 6 declaration edits have been saved. Verdict recalculated: [${updated.compliant ? 'Compliant' : 'Non-Compliant'}].`, 'Edits Saved & Recalculated');
      } catch (err) {
        await showAlert(`Error saving declaration edits: ${err.message}`, 'Save Error');
      } finally {
        btnSaveDeclarationEdits.innerHTML = oldText;
        btnSaveDeclarationEdits.disabled = false;
      }
    });
  }

  // Modal Level 1 PDF Generation Button
  if (btnModalGeneratePdf) {
    btnModalGeneratePdf.addEventListener('click', () => {
      if (!currentReviewingItem) return;
      window.open(`${API_BASE_URL}/api/officer/reports/item/${currentReviewingItem.item_id}`, '_blank');
    });
  }

  // Modal Tabs
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

  // Execute Review Actions
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
      remarks: remarks || (action === 'approve' ? 'Approved as compliant by Assistant Controller' : action),
      reviewer_name: user.full_name || 'Dr. S. K. Sharma',
      declaration_values: stagedEdits.declaration_values,
      declarations_found: stagedEdits.declarations_found,
      declarations_missing: stagedEdits.declarations_missing,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/officer/review-item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Action failed (HTTP ${res.status})`);
      }

      const updated = await res.json();
      const actionedId = currentReviewingItem.item_id;

      // Update in activeBatch.items immediately
      if (activeBatch && activeBatch.items) {
        const idx = activeBatch.items.findIndex(i => i.item_id === actionedId);
        if (idx !== -1) {
          activeBatch.items[idx] = {
            ...activeBatch.items[idx],
            ...updated,
            status: action === 'recapture' ? 'recapture_requested' : 'reviewed',
            officer_action: action,
            officer_remarks: remarks,
            compliant: (newVerdict !== undefined && newVerdict !== null) ? Boolean(newVerdict) : activeBatch.items[idx].compliant,
          };
        }
      }

      // Auto-advance: find next unreviewed item in activeBatch
      let nextItem = null;
      let currentIndex = -1;
      if (activeBatch && activeBatch.items) {
        currentIndex = activeBatch.items.findIndex(i => i.item_id === actionedId);
        // Look ahead
        for (let i = currentIndex + 1; i < activeBatch.items.length; i++) {
          const it = activeBatch.items[i];
          if (it.status !== 'reviewed' && it.status !== 'recapture_requested' && !it.officer_action) {
            nextItem = it;
            break;
          }
        }
        // If none found ahead, wrap around from start
        if (!nextItem) {
          for (let i = 0; i < currentIndex; i++) {
            const it = activeBatch.items[i];
            if (it.status !== 'reviewed' && it.status !== 'recapture_requested' && !it.officer_action) {
              nextItem = it;
              break;
            }
          }
        }
      }

      // Immediately re-render workbench items and refresh dashboard & queue in background
      if (activeBatch) {
        renderWorkbenchItems(activeBatch.items);
        const reviewedCount = activeBatch.items.filter(i => i.status === 'reviewed' || i.officer_action || i.status === 'recapture_requested').length;
        if (workbenchStatsSummary) {
          workbenchStatsSummary.innerHTML = `
            <div style="font-size:0.8rem; color:var(--text-secondary);">
              Progress: <strong>${reviewedCount} of ${activeBatch.items.length}</strong> reviewed
            </div>
          `;
        }
        const allDone = activeBatch.items.every(i => i.status === 'reviewed' || i.status === 'recapture_requested' || (!!i.officer_action && i.officer_action !== 'recapture_resolved'));
        if (allDone) {
          activeBatch.status = 'completed';
          if (workbenchBatchStatusPill) {
            workbenchBatchStatusPill.textContent = 'Completed';
            workbenchBatchStatusPill.className = 'status-pill badge-completed';
            workbenchBatchStatusPill.style.background = '#DCFCE7';
            workbenchBatchStatusPill.style.color = '#166534';
            workbenchBatchStatusPill.style.borderColor = '#86EFAC';
          }
        }
        updateBulkApproveButtonState(activeBatch.items);
      }
      loadOfficerDashboard();
      loadOfficerBatches(officerBatchStatusFilter ? officerBatchStatusFilter.value : 'submitted');

      if (nextItem) {
        // Continuous sitting: seamlessly load the next unreviewed item
        openOfficerReviewModal(nextItem);
      } else {
        // Last item in the batch has been actioned! Show clear batch complete state
        officerReviewModal.classList.add('hidden');
        currentReviewingItem = null;
        await showAlert(`✓ All ${activeBatch ? activeBatch.items.length : 0} items in batch [${activeBatch ? activeBatch.batch_id : ''}] have been adjudicated. Batch review complete!`, 'Batch Complete');
      }
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
    const ok = await showConfirm('Send this item back to Field Inspector for photo recapture?', 'Confirm Recapture Request', 'Request Recapture', 'Cancel');
    if (ok) {
      executeReview('recapture', false);
    }
  });

  btnOfficerCorrect.addEventListener('click', () => {
    executeReview('correct', currentReviewingItem ? currentReviewingItem.compliant : true);
  });

  // Periodic polling (every 15s) for Review Queue and Dashboard synchronization
  setInterval(async () => {
    if (activeView === 'queue') {
      const isWorkbenchOpen = officerWorkbenchCard && !officerWorkbenchCard.classList.contains('hidden');
      const isModalOpen = officerReviewModal && !officerReviewModal.classList.contains('hidden');
      if (!isWorkbenchOpen && !isModalOpen) {
        const currentFilter = officerBatchStatusFilter ? officerBatchStatusFilter.value : 'submitted';
        await loadOfficerBatches(currentFilter, true);
      }
    } else if (activeView === 'dashboard') {
      try {
        await loadOfficerDashboard();
      } catch (e) {}
    }
  }, 15000);

  // Initial Load on entry
  await loadOfficerDashboard();
});
