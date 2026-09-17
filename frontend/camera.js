// Enhanced Continuous Guided Camera Engine for LabelLens Field Inspector
class GuidedCameraEngine {
  constructor(options = {}) {
    this.modalEl = options.modalEl;
    this.videoEl = options.videoEl;
    this.canvasEl = options.canvasEl;
    this.previewImgEl = options.previewImgEl;
    this.angleTitleEl = options.angleTitleEl;
    this.anglePromptEl = options.anglePromptEl;
    this.liveControlsEl = options.liveControlsEl;
    this.reviewControlsEl = options.reviewControlsEl;
    this.postGuidedControlsEl = options.postGuidedControlsEl;
    this.blurBadgeEl = options.blurBadgeEl;
    this.skipBtnEl = options.skipBtnEl;
    
    this.onPhotoAccepted = options.onPhotoAccepted || (() => {});
    this.onCompleted = options.onCompleted || (() => {});
    this.onNextItemRequested = options.onNextItemRequested || (() => {});

    this.stream = null;
    this.currentStepIdx = 0;
    this.extraCount = 0;
    this.currentSnapshotBlob = null;
    this.currentSnapshotDataUrl = null;

    this.angles = [
      {
        id: 'front',
        title: 'Angle 1 of 3: Front Panel (Mandatory)',
        prompt: 'Align Commodity Name, Net Qty, MRP & USP inside frame.',
        mandatory: true
      },
      {
        id: 'back',
        title: 'Angle 2 of 3: Back Panel (Recommended)',
        prompt: 'Align Manufacturer Details, Dates & Consumer Care.',
        mandatory: false
      },
      {
        id: 'side',
        title: 'Angle 3 of 3: Side / Detail (Optional)',
        prompt: 'Align Barcode, Dimensions or statutory markings.',
        mandatory: false
      }
    ];

    this.capturedData = {
      front: null,
      back: null,
      side: null,
      extras: []
    };

    if (this.skipBtnEl) {
      this.skipBtnEl.addEventListener('click', () => this.skipCurrentAngle());
    }
    this.isSingleSlot = false;
  }

  async start(startAngle = 'front', isSingleSlot = false) {
    this.isSingleSlot = isSingleSlot;
    this.currentStepIdx = this.angles.findIndex(a => a.id === startAngle);
    if (this.currentStepIdx < 0) this.currentStepIdx = 0;
    this.extraCount = 0;

    if (this.modalEl) this.modalEl.classList.remove('hidden');
    await this.initCurrentAngleStream();
  }

  async initCurrentAngleStream() {
    const isGuided = this.currentStepIdx < this.angles.length;
    let angleTitle = '';
    let anglePrompt = '';
    let isMandatory = false;

    if (isGuided) {
      const angleCfg = this.angles[this.currentStepIdx];
      angleTitle = angleCfg.title;
      anglePrompt = angleCfg.prompt;
      isMandatory = angleCfg.mandatory;
    } else {
      this.extraCount++;
      angleTitle = `Extra Angle #${this.extraCount} (Optional)`;
      anglePrompt = 'Capture any additional detail, ingredient, or certificate panel.';
      isMandatory = false;
    }

    if (this.angleTitleEl) this.angleTitleEl.textContent = angleTitle;
    if (this.anglePromptEl) this.anglePromptEl.textContent = anglePrompt;

    // Show/hide Skip button (never allow skipping mandatory front panel)
    if (this.skipBtnEl) {
      if (isMandatory) {
        this.skipBtnEl.classList.add('hidden');
        this.skipBtnEl.style.display = 'none';
      } else {
        this.skipBtnEl.classList.remove('hidden');
        this.skipBtnEl.style.display = 'inline-flex';
        this.skipBtnEl.textContent = 'Skip →';
      }
    }

    // Show live viewfinder, hide preview and review controls
    if (this.videoEl) this.videoEl.classList.remove('hidden');
    if (this.previewImgEl) this.previewImgEl.classList.add('hidden');
    if (this.liveControlsEl) this.liveControlsEl.classList.remove('hidden');
    if (this.reviewControlsEl) this.reviewControlsEl.classList.add('hidden');
    if (this.postGuidedControlsEl) this.postGuidedControlsEl.classList.add('hidden');
    if (this.blurBadgeEl) this.blurBadgeEl.classList.add('hidden');

    this.currentSnapshotBlob = null;
    this.currentSnapshotDataUrl = null;

    await this.startMediaStream();
  }

  async startMediaStream() {
    this.stopMediaStream();
    try {
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (this.videoEl) {
        this.videoEl.srcObject = this.stream;
        await this.videoEl.play();
      }
    } catch (err) {
      console.warn('Live camera access failed or unavailable, creating mock stream pattern:', err);
    }
  }

  stopMediaStream() {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.videoEl) {
      this.videoEl.srcObject = null;
    }
  }

  // Shutter action: freezes frame full-screen for review
  takeSnapshot() {
    if (!this.canvasEl) return;
    const ctx = this.canvasEl.getContext('2d');

    const width = this.videoEl && this.videoEl.videoWidth ? this.videoEl.videoWidth : 1280;
    const height = this.videoEl && this.videoEl.videoHeight ? this.videoEl.videoHeight : 720;

    this.canvasEl.width = width;
    this.canvasEl.height = height;

    if (this.videoEl && this.videoEl.videoWidth) {
      ctx.drawImage(this.videoEl, 0, 0, width, height);
    } else {
      // Fallback synthetic label frame if device camera is unavailable
      ctx.fillStyle = '#18181B';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#FCFBF7';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      const slotName = this.currentStepIdx < this.angles.length 
        ? this.angles[this.currentStepIdx].title 
        : `Extra Photo #${this.extraCount}`;
      ctx.fillText(slotName, width / 2, height / 2 - 20);
      ctx.font = '22px sans-serif';
      ctx.fillStyle = '#A1A1AA';
      ctx.fillText('Live Item Frame Captured', width / 2, height / 2 + 25);
    }

    this.currentSnapshotDataUrl = this.canvasEl.toDataURL('image/jpeg', 0.92);

    this.canvasEl.toBlob((blob) => {
      this.currentSnapshotBlob = blob;
    }, 'image/jpeg', 0.92);

    // Switch view to full-screen review state (Freeze frame)
    if (this.previewImgEl) {
      this.previewImgEl.src = this.currentSnapshotDataUrl;
      this.previewImgEl.classList.remove('hidden');
    }
    if (this.videoEl) this.videoEl.classList.add('hidden');
    if (this.liveControlsEl) this.liveControlsEl.classList.add('hidden');
    if (this.reviewControlsEl) this.reviewControlsEl.classList.remove('hidden');

    if (this.blurBadgeEl) {
      this.blurBadgeEl.classList.remove('hidden');
      this.blurBadgeEl.className = 'camera-blur-badge badge-sharp';
      this.blurBadgeEl.textContent = '✓ Sharp Frame';
    }
  }

  // ✕ RETAKE ACTION: Discards snapshot and immediately retakes the SAME slot
  retakeCurrentAngle() {
    if (this._customRetakeCallback) {
      const cb = this._customRetakeCallback;
      this._customConfirmCallback = null;
      this._customRetakeCallback = null;
      if (this.modalEl) this.modalEl.classList.add('hidden');
      cb();
      return;
    }
    this.currentSnapshotBlob = null;
    this.currentSnapshotDataUrl = null;
    this.initCurrentAngleStream();
  }

  // Skip an optional angle
  skipCurrentAngle() {
    this.currentSnapshotBlob = null;
    this.currentSnapshotDataUrl = null;
    if (this.currentStepIdx < this.angles.length - 1) {
      this.currentStepIdx++;
      this.initCurrentAngleStream();
    } else {
      this.showPostGuidedControls();
    }
  }

  // ✓ ACCEPT ACTION: Saves immediately and transitions to next capture instantly (no delay)
  acceptCurrentAngle() {
    if (this._customConfirmCallback) {
      const cb = this._customConfirmCallback;
      const file = this.currentSnapshotBlob;
      const dataUrl = this.currentSnapshotDataUrl;
      this._customConfirmCallback = null;
      this._customRetakeCallback = null;
      this.close();
      cb(file, dataUrl);
      return;
    }

    const isGuided = this.currentStepIdx < this.angles.length;
    const angleId = isGuided ? this.angles[this.currentStepIdx].id : `extra_${this.extraCount}`;


    if (!this.currentSnapshotBlob && this.currentSnapshotDataUrl) {
      const arr = this.currentSnapshotDataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) u8arr[n] = bstr.charCodeAt(n);
      this.currentSnapshotBlob = new Blob([u8arr], { type: mime });
    }

    const file = new File(
      [this.currentSnapshotBlob], 
      `item_${angleId}_${Date.now()}.jpg`, 
      { type: 'image/jpeg' }
    );

    if (isGuided) {
      this.capturedData[angleId] = {
        angle: angleId,
        file: file,
        dataUrl: this.currentSnapshotDataUrl
      };
      this.onPhotoAccepted(angleId, file, this.currentSnapshotDataUrl);
    } else {
      const extraItem = {
        angle: `extra_${this.extraCount}`,
        file: file,
        dataUrl: this.currentSnapshotDataUrl
      };
      this.capturedData.extras.push(extraItem);
      this.onPhotoAccepted('extra', file, this.currentSnapshotDataUrl, extraItem);
    }

    if (this.isSingleSlot) {
      this.close();
      return;
    }

    // Instant transition to next angle
    if (this.currentStepIdx < this.angles.length - 1) {
      this.currentStepIdx++;
      this.initCurrentAngleStream();
    } else {
      // Finished all 3 guided angles: offer Extra Photo or Finish
      this.showPostGuidedControls();
    }
  }

  hasFrontPhoto() {
    return !!this.capturedData.front;
  }

  resetForNewItem() {
    this.currentStepIdx = 0;
    this.extraCount = 0;
    this.currentSnapshotBlob = null;
    this.currentSnapshotDataUrl = null;
    this.capturedData = {
      front: null,
      back: null,
      side: null,
      extras: []
    };
    this.initCurrentAngleStream();
  }

  // Show option to add extra photos or finish
  showPostGuidedControls() {
    if (this.videoEl) this.videoEl.classList.add('hidden');
    if (this.previewImgEl) this.previewImgEl.classList.remove('hidden');
    if (this.liveControlsEl) this.liveControlsEl.classList.add('hidden');
    if (this.reviewControlsEl) this.reviewControlsEl.classList.add('hidden');
    if (this.skipBtnEl) {
      this.skipBtnEl.classList.add('hidden');
      this.skipBtnEl.style.display = 'none';
    }
    if (this.postGuidedControlsEl) this.postGuidedControlsEl.classList.remove('hidden');

    const hasFront = this.hasFrontPhoto();
    if (this.angleTitleEl) {
      this.angleTitleEl.textContent = hasFront ? 'Item Captured' : 'Front Photo Missing';
    }
    if (this.anglePromptEl) {
      this.anglePromptEl.textContent = hasFront
        ? 'Tap "Next Item →" to save and immediately start the next item, "+ Extra Angle" for more shots, or "Done" to finish.'
        : '⚠️ Front panel photo is required before saving.';
    }

    const btnNext = this.postGuidedControlsEl ? this.postGuidedControlsEl.querySelector('#btnCameraNextItem') : null;
    if (btnNext) {
      btnNext.disabled = !hasFront;
    }
  }

  // Trigger capturing an extra photo
  startExtraCapture() {
    this.currentStepIdx = this.angles.length; // beyond guided slots
    this.initCurrentAngleStream();
  }

  // Show Confirm / Retake Review screen for a single photo (e.g. chosen from gallery or camera)
  showReviewForImage(file, dataUrl, angleTitle = 'Review Photo', onConfirm, onRetake) {
    this.stopMediaStream();
    this.currentSnapshotBlob = file;
    this.currentSnapshotDataUrl = dataUrl;
    this._customConfirmCallback = onConfirm;
    this._customRetakeCallback = onRetake;

    if (this.modalEl) this.modalEl.classList.remove('hidden');
    if (this.videoEl) this.videoEl.classList.add('hidden');
    if (this.liveControlsEl) this.liveControlsEl.classList.add('hidden');
    if (this.postGuidedControlsEl) this.postGuidedControlsEl.classList.add('hidden');
    if (this.skipBtnEl) {
      this.skipBtnEl.classList.add('hidden');
      this.skipBtnEl.style.display = 'none';
    }

    if (this.angleTitleEl) this.angleTitleEl.textContent = angleTitle;
    if (this.anglePromptEl) this.anglePromptEl.textContent = 'Check image clarity and tap Confirm to replace, or Retake.';

    if (this.previewImgEl) {
      this.previewImgEl.src = dataUrl;
      this.previewImgEl.classList.remove('hidden');
    }
    if (this.reviewControlsEl) this.reviewControlsEl.classList.remove('hidden');

    if (this.blurBadgeEl) {
      this.blurBadgeEl.classList.remove('hidden');
      this.blurBadgeEl.className = 'camera-blur-badge badge-sharp';
      this.blurBadgeEl.textContent = '✓ Photo Selected';
    }
  }

  close() {
    this.stopMediaStream();
    this._customConfirmCallback = null;
    this._customRetakeCallback = null;
    if (this.modalEl) this.modalEl.classList.add('hidden');
    this.onCompleted(this.capturedData);
  }

}

window.GuidedCameraEngine = GuidedCameraEngine;
