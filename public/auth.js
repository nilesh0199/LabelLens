// Shared Authentication & Route Guard Module
const AUTH_STORAGE_KEY = 'labelLensAuth';

function getAuthSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function setAuthSession(token, user) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token, user, loggedInAt: new Date().toISOString() }));
}

function clearAuthSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

function logout() {
  clearAuthSession();
  window.location.href = '/login';
}

// Universal In-App Dialog System
function ensureDialogModals() {
  if (!document.getElementById('appConfirmModal')) {
    const confirmDiv = document.createElement('div');
    confirmDiv.id = 'appConfirmModal';
    confirmDiv.className = 'modal-backdrop hidden';
    confirmDiv.setAttribute('role', 'dialog');
    confirmDiv.setAttribute('aria-modal', 'true');
    confirmDiv.innerHTML = `
      <div class="modal-card app-dialog-card">
        <div class="modal-header app-dialog-header">
          <div class="app-dialog-icon-badge warning" id="appConfirmIconBadge">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <div>
            <h3 class="modal-title app-dialog-title" id="appConfirmTitle">Confirm Action</h3>
            <p class="dialog-subtitle" style="font-size:0.8rem; color:var(--text-secondary); margin:2px 0 0;">Please review before continuing</p>
          </div>
        </div>
        <div class="modal-body app-dialog-body">
          <p class="app-dialog-message" id="appConfirmMessage">Are you sure you want to proceed?</p>
        </div>
        <div class="modal-actions app-dialog-actions">
          <button type="button" class="btn-cancel" id="btnAppConfirmCancel">Cancel</button>
          <button type="button" class="btn-primary" id="btnAppConfirmOk">Confirm</button>
        </div>
      </div>
    `;
    document.body.appendChild(confirmDiv);
  }

  if (!document.getElementById('appAlertModal')) {
    const alertDiv = document.createElement('div');
    alertDiv.id = 'appAlertModal';
    alertDiv.className = 'modal-backdrop hidden';
    alertDiv.setAttribute('role', 'dialog');
    alertDiv.setAttribute('aria-modal', 'true');
    alertDiv.innerHTML = `
      <div class="modal-card app-dialog-card">
        <div class="modal-header app-dialog-header">
          <div class="app-dialog-icon-badge info" id="appAlertIconBadge">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>
          <div>
            <h3 class="modal-title app-dialog-title" id="appAlertTitle">Notice</h3>
          </div>
        </div>
        <div class="modal-body app-dialog-body">
          <p class="app-dialog-message" id="appAlertMessage"></p>
        </div>
        <div class="modal-actions app-dialog-actions">
          <button type="button" class="btn-primary" id="btnAppAlertOk">OK</button>
        </div>
      </div>
    `;
    document.body.appendChild(alertDiv);
  }
}

function showConfirm(message, title = 'Confirm Action', confirmText = 'Confirm', cancelText = 'Cancel') {
  ensureDialogModals();
  const modal = document.getElementById('appConfirmModal');
  const titleEl = document.getElementById('appConfirmTitle');
  const msgEl = document.getElementById('appConfirmMessage');
  const btnOk = document.getElementById('btnAppConfirmOk');
  const btnCancel = document.getElementById('btnAppConfirmCancel');

  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.textContent = message;
  if (btnOk) btnOk.textContent = confirmText;
  if (btnCancel) btnCancel.textContent = cancelText;

  modal.classList.remove('hidden');

  return new Promise(resolve => {
    const handleOk = () => {
      cleanup();
      resolve(true);
    };
    const handleCancel = () => {
      cleanup();
      resolve(false);
    };
    const handleKeydown = (e) => {
      if (e.key === 'Escape') handleCancel();
      if (e.key === 'Enter') handleOk();
    };
    const cleanup = () => {
      if (btnOk) btnOk.removeEventListener('click', handleOk);
      if (btnCancel) btnCancel.removeEventListener('click', handleCancel);
      document.removeEventListener('keydown', handleKeydown);
      modal.classList.add('hidden');
    };

    if (btnOk) btnOk.addEventListener('click', handleOk);
    if (btnCancel) btnCancel.addEventListener('click', handleCancel);
    document.addEventListener('keydown', handleKeydown);
    if (btnOk) btnOk.focus();
  });
}

function showAlert(message, title = 'Notice') {
  ensureDialogModals();
  const modal = document.getElementById('appAlertModal');
  const titleEl = document.getElementById('appAlertTitle');
  const msgEl = document.getElementById('appAlertMessage');
  const btnOk = document.getElementById('btnAppAlertOk');

  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.textContent = message;

  modal.classList.remove('hidden');

  return new Promise(resolve => {
    const handleOk = () => {
      if (btnOk) btnOk.removeEventListener('click', handleOk);
      document.removeEventListener('keydown', handleKeydown);
      modal.classList.add('hidden');
      resolve();
    };
    const handleKeydown = (e) => {
      if (e.key === 'Enter' || e.key === 'Escape') handleOk();
    };

    if (btnOk) btnOk.addEventListener('click', handleOk);
    document.addEventListener('keydown', handleKeydown);
    if (btnOk) btnOk.focus();
  });
}

window.showAlert = showAlert;
window.showConfirm = showConfirm;
window.alert = function(message) {
  return showAlert(message);
};
window.confirm = function(message) {
  return showConfirm(message);
};

function requireAuth(allowedRole = null) {
  const session = getAuthSession();
  if (!session || !session.user) {
    window.location.href = '/login';
    return null;
  }
  if (allowedRole && session.user.role !== allowedRole) {
    showAlert(`Access Restricted: This area requires the [${allowedRole}] role.\nYou are currently logged in as [${session.user.role}].`, 'Access Restricted').then(() => {
      if (session.user.role === 'inspector') {
        window.location.href = '/inspector';
      } else if (session.user.role === 'officer') {
        window.location.href = '/officer';
      } else {
        window.location.href = '/login';
      }
    });
    return null;
  }
  return session.user;
}

window.LabelLensAuth = {
  getAuthSession,
  setAuthSession,
  clearAuthSession,
  logout,
  requireAuth,
  showAlert,
  showConfirm
};
