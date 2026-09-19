/**
 * Supabase Client & Data Layer
 * 
 * STRICTLY DATA-ONLY:
 * Used exclusively for PostgreSQL database persistence, Auth, and Storage.
 * Zero compute logic, zero OCR, and zero LLM calls live in Supabase.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (_supabaseClient) return _supabaseClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key || url.includes('placeholder') || key.includes('placeholder')) {
    return null;
  }

  try {
    _supabaseClient = createClient(url, key, {
      auth: { persistSession: false },
      global: {
        fetch: (url, init) => fetch(url, { ...init, cache: 'no-store' }),
      },
    });
    return _supabaseClient;
  } catch (err) {
    console.warn('[Supabase] Failed to initialize Supabase client:', err);
    return null;
  }
}

/**
 * Storage Helper: Uploads a photo buffer to Supabase Storage bucket 'specimen-photos'.
 * Returns real public Storage URL. Throws loud error if upload fails.
 */
export async function uploadSpecimenPhoto(
  buffer: Buffer,
  filename: string,
  contentType: string = 'image/jpeg'
): Promise<string> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    const msg = '[Supabase Storage] Supabase client is not configured. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.';
    console.error(msg);
    throw new Error(msg);
  }

  const { data, error } = await supabase.storage
    .from('specimen-photos')
    .upload(`uploads/${filename}`, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    console.error(`[Supabase Storage] Upload failed for uploads/${filename}:`, error.message);
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  const { data: publicData } = supabase.storage
    .from('specimen-photos')
    .getPublicUrl(`uploads/${filename}`);

  if (!publicData?.publicUrl) {
    const msg = `[Supabase Storage] Failed to get public URL for uploads/${filename}`;
    console.error(msg);
    throw new Error(msg);
  }

  return publicData.publicUrl;
}

/**
 * Validates that every photo URL in the photos array starts with
 * ${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/specimen-photos/
 * Rejects external or unverified URLs by throwing a validation Error.
 */
export function validatePhotoProvenance(photos?: any[]): void {
  if (!photos || !Array.isArray(photos) || photos.length === 0) {
    return;
  }

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zrgrucpghxdtailgcpam.supabase.co').replace(/\/+$/, '');
  const allowedPrefix = `${supabaseUrl}/storage/v1/object/public/specimen-photos/`;

  for (const photo of photos) {
    if (!photo || typeof photo !== 'object') continue;
    const url = photo.url;
    if (typeof url !== 'string' || !url.startsWith(allowedPrefix)) {
      throw new Error('Invalid photo URL: must originate from specimen-photos storage');
    }
  }
}

// ============================================================================
// DATA ACCESS LAYER FOR BATCHES & ITEMS
// Seamlessly delegates to live Supabase DB, with offline in-memory fallback only if unconfigured
// ============================================================================

export interface BatchRecord {
  batch_id: string;
  inspector_id: string;
  inspector_name: string;
  jurisdiction: string;
  store_name: string;
  store_location: string;
  status: 'draft' | 'pending_review' | 'under_review' | 'completed';
  created_at: string;
  submitted_at: string | null;
  items?: BatchItemRecord[];
  item_count?: number;
  compliant_count?: number;
  non_compliant_count?: number;
}

export interface BatchItemRecord {
  item_id: string;
  batch_id: string;
  product_name: string;
  product_category: string;
  photos: any[];
  compliant: boolean;
  confidence: number;
  declarations_found: string[];
  declarations_missing: string[];
  declaration_values: Record<string, string>;
  raw_ocr_text: string;
  cleaned_summary: string;
  status: string;
  needs_review: boolean;
  review_reasons: string[];
  created_at: string;
  officer_action?: string | null;
  officer_remarks?: string | null;
  reviewed_by?: string | null;
  product_origin?: string;
  pack_type?: string;
}

// In-memory backing store (offline / test mock only)
const memoryBatches: Map<string, BatchRecord> = new Map();
const memoryItems: Map<string, BatchItemRecord> = new Map();

// Initialize demo batches only for offline local testing when Supabase is not connected
function initDemoData() {
  // Offline in-memory store starts clean with zero active draft batches
}
initDemoData();

export const dataStore = {
  async createBatch(batch: Omit<BatchRecord, 'created_at' | 'submitted_at' | 'status'>): Promise<BatchRecord> {
    const supabase = getSupabaseClient();
    const record: BatchRecord = {
      ...batch,
      status: 'draft',
      created_at: new Date().toISOString(),
      submitted_at: null,
      items: [],
    };

    if (supabase) {
      const { data, error } = await supabase.from('batches').insert([{
        batch_id: record.batch_id,
        inspector_id: record.inspector_id,
        inspector_name: record.inspector_name,
        jurisdiction: record.jurisdiction,
        store_name: record.store_name,
        store_location: record.store_location,
        status: record.status,
        created_at: record.created_at,
        submitted_at: record.submitted_at
      }]).select().single();

      if (error) {
        console.error('[Supabase DB] Error creating batch:', error.message);
        throw new Error(`Supabase DB createBatch failed: ${error.message}`);
      }
      return { ...record, ...(data || {}) };
    }

    memoryBatches.set(batch.batch_id, record);
    return record;
  },

  async getBatchById(batchId: string): Promise<BatchRecord | null> {
    const supabase = getSupabaseClient();

    if (supabase) {
      const { data: batch, error: batchErr } = await supabase
        .from('batches')
        .select('*')
        .eq('batch_id', batchId)
        .maybeSingle();

      if (batchErr) {
        console.error('[Supabase DB] Error fetching batch by ID:', batchErr.message);
        throw new Error(`Supabase DB getBatchById failed: ${batchErr.message}`);
      }

      if (!batch) return null;

      const { data: items, error: itemsErr } = await supabase
        .from('batch_items')
        .select('*')
        .eq('batch_id', batchId)
        .order('created_at', { ascending: true });

      if (itemsErr) {
        console.error('[Supabase DB] Error fetching batch items:', itemsErr.message);
        throw new Error(`Supabase DB getBatchById items failed: ${itemsErr.message}`);
      }

      return {
        ...batch,
        items: items || [],
      };
    }

    const memBatch = memoryBatches.get(batchId);
    if (!memBatch) return null;

    const items = Array.from(memoryItems.values()).filter(i => i.batch_id === batchId);
    return {
      ...memBatch,
      items,
    };
  },

  async getActiveBatch(inspectorId?: string): Promise<BatchRecord | null> {
    const supabase = getSupabaseClient();

    if (supabase) {
      let query = supabase
        .from('batches')
        .select('*')
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(1);

      if (inspectorId) {
        query = query.eq('inspector_id', inspectorId);
      }

      const { data, error } = await query;
      if (error) {
        console.error('[Supabase DB] Error fetching active batch:', error.message);
        throw new Error(`Supabase DB getActiveBatch failed: ${error.message}`);
      }

      if (data && data.length > 0) {
        return this.getBatchById(data[0].batch_id);
      }
      return null;
    }

    const drafts = Array.from(memoryBatches.values())
      .filter(b => b.status === 'draft' && (!inspectorId || b.inspector_id === inspectorId))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (drafts.length === 0) return null;
    return this.getBatchById(drafts[0].batch_id);
  },

  async listBatches(inspectorId?: string): Promise<{ drafts: BatchRecord[]; submitted: BatchRecord[] }> {
    const supabase = getSupabaseClient();

    if (supabase) {
      let query = supabase
        .from('batches')
        .select(`
          *,
          batch_items (
            item_id,
            compliant
          )
        `)
        .order('created_at', { ascending: false });

      if (inspectorId) {
        query = query.eq('inspector_id', inspectorId);
      }
      const { data, error } = await query;
      if (error) {
        console.error('[Supabase DB] Error listing batches:', error.message);
        throw new Error(`Supabase DB listBatches failed: ${error.message}`);
      }
      const all = (data || []).map((b: any) => {
        const items = b.batch_items || [];
        const compliantCount = items.filter((i: any) => i.compliant).length;
        const nonCompliantCount = items.length - compliantCount;
        return {
          ...b,
          item_count: items.length,
          compliant_count: compliantCount,
          non_compliant_count: nonCompliantCount,
        };
      });
      return {
        drafts: all.filter(b => b.status === 'draft'),
        submitted: all.filter(b => b.status !== 'draft'),
      };
    }

    const all = Array.from(memoryBatches.values())
      .filter(b => !inspectorId || b.inspector_id === inspectorId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map(b => {
        const items = Array.from(memoryItems.values()).filter(i => i.batch_id === b.batch_id);
        const compliantCount = items.filter(i => i.compliant).length;
        return {
          ...b,
          item_count: items.length,
          compliant_count: compliantCount,
          non_compliant_count: items.length - compliantCount,
        };
      });

    return {
      drafts: all.filter(b => b.status === 'draft'),
      submitted: all.filter(b => b.status !== 'draft'),
    };
  },

  async activateBatch(batchId: string): Promise<BatchRecord | null> {
    const now = new Date().toISOString();
    const supabase = getSupabaseClient();

    if (supabase) {
      const { error } = await supabase
        .from('batches')
        .update({ created_at: now })
        .eq('batch_id', batchId);

      if (error) {
        console.error('[Supabase DB] Error activating batch:', error.message);
        throw new Error(`Supabase DB activateBatch failed: ${error.message}`);
      }
      return this.getBatchById(batchId);
    }

    const batch = memoryBatches.get(batchId);
    if (batch) {
      batch.created_at = now;
      return this.getBatchById(batchId);
    }
    return null;
  },

  async submitBatch(batchId: string): Promise<BatchRecord | null> {
    const now = new Date().toISOString();
    const supabase = getSupabaseClient();

    if (supabase) {
      const { error } = await supabase
        .from('batches')
        .update({ status: 'pending_review', submitted_at: now })
        .eq('batch_id', batchId);

      if (error) {
        console.error('[Supabase DB] Error submitting batch:', error.message);
        throw new Error(`Supabase DB submitBatch failed: ${error.message}`);
      }

      // Synchronize item statuses from draft to submitted
      try {
        await supabase
          .from('batch_items')
          .update({ status: 'submitted' })
          .eq('batch_id', batchId)
          .eq('status', 'draft');
      } catch (itemSyncErr: any) {
        console.warn(`[Supabase DB] Warning syncing item statuses for ${batchId}:`, itemSyncErr.message);
      }

      return this.getBatchById(batchId);
    }

    const batch = memoryBatches.get(batchId);
    if (batch) {
      batch.status = 'pending_review';
      batch.submitted_at = now;
      Array.from(memoryItems.values())
        .filter(i => i.batch_id === batchId && i.status === 'draft')
        .forEach(i => { i.status = 'submitted'; });
      return this.getBatchById(batchId);
    }
    return null;
  },

  async updateBatchStatus(batchId: string, status: string): Promise<BatchRecord | null> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { error } = await supabase
        .from('batches')
        .update({ status })
        .eq('batch_id', batchId);
      if (error) {
        console.error('[Supabase DB] Error updating batch status:', error.message);
        throw new Error(`Supabase DB updateBatchStatus failed: ${error.message}`);
      }
      return this.getBatchById(batchId);
    }
    const batch = memoryBatches.get(batchId);
    if (batch) {
      batch.status = status as any;
      return this.getBatchById(batchId);
    }
    return null;
  },

  async getBatchItem(itemId: string): Promise<BatchItemRecord | null> {
    const supabase = getSupabaseClient();

    if (supabase) {
      const { data, error } = await supabase
        .from('batch_items')
        .select('*')
        .eq('item_id', itemId)
        .maybeSingle();

      if (error) {
        console.error('[Supabase DB] Error getting batch item:', error.message);
        throw new Error(`Supabase DB getBatchItem failed: ${error.message}`);
      }
      return data || null;
    }

    return memoryItems.get(itemId) || null;
  },

  async addBatchItem(item: BatchItemRecord): Promise<BatchItemRecord> {
    if (item.photos) {
      validatePhotoProvenance(item.photos);
    }
    const supabase = getSupabaseClient();

    if (supabase) {
      const { data, error } = await supabase.from('batch_items').upsert([item]).select().single();
      if (error) {
        console.error('[Supabase DB] Error adding batch item:', error.message);
        throw new Error(`Supabase DB addBatchItem failed: ${error.message}`);
      }
      return data || item;
    }

    memoryItems.set(item.item_id, item);
    return item;
  },

  async getItemById(itemId: string): Promise<BatchItemRecord | null> {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('batch_items')
        .select('*')
        .eq('item_id', itemId)
        .maybeSingle();
      if (error) {
        console.error('[Supabase DB] Error getting batch item:', error.message);
        return null;
      }
      return data;
    }
    return memoryItems.get(itemId) || null;
  },

  async updateBatchItem(itemId: string, patch: Partial<BatchItemRecord>): Promise<BatchItemRecord | null> {
    if (patch.photos) {
      validatePhotoProvenance(patch.photos);
    }
    const supabase = getSupabaseClient();

    if (supabase) {
      const dbPatch: any = { ...patch };
      delete dbPatch.product_origin;
      delete dbPatch.pack_type;
      const { data, error } = await supabase
        .from('batch_items')
        .update(dbPatch)
        .eq('item_id', itemId)
        .select()
        .maybeSingle();

      if (error) {
        console.error('[Supabase DB] Error updating batch item:', error.message);
        throw new Error(`Supabase DB updateBatchItem failed: ${error.message}`);
      }
      return data;
    }

    const existing = memoryItems.get(itemId);
    if (!existing) return null;

    const updated = { ...existing, ...patch };
    memoryItems.set(itemId, updated);
    return updated;
  },

  async deleteBatchItem(itemId: string): Promise<boolean> {
    const supabase = getSupabaseClient();

    if (supabase) {
      const { error } = await supabase.from('batch_items').delete().eq('item_id', itemId);
      if (error) {
        console.error('[Supabase DB] Error deleting batch item:', error.message);
        throw new Error(`Supabase DB deleteBatchItem failed: ${error.message}`);
      }
      return true;
    }

    return memoryItems.delete(itemId);
  },

  async deleteBatch(batchId: string): Promise<{ success: boolean; message: string }> {
    const supabase = getSupabaseClient();

    if (supabase) {
      // 1. Verify batch exists and is a draft
      const { data: batch, error: bErr } = await supabase
        .from('batches')
        .select('batch_id, status')
        .eq('batch_id', batchId)
        .single();

      if (bErr || !batch) {
        return { success: true, message: "Batch already deleted." };
      }

      if (batch.status !== 'draft') {
        throw new Error(`Cannot delete batch '${batchId}': only draft (unsubmitted) batches can be deleted.`);
      }

      // 2. Fetch all items to clean up photos from Storage
      const { data: items } = await supabase
        .from('batch_items')
        .select('photos')
        .eq('batch_id', batchId);

      const storagePaths: string[] = [];
      if (items && items.length > 0) {
        for (const item of items) {
          const photos = Array.isArray(item.photos) ? item.photos : [];
          for (const p of photos) {
            if (p && p.url) {
              const marker = '/storage/v1/object/public/specimen-photos/';
              const idx = p.url.indexOf(marker);
              if (idx !== -1) {
                storagePaths.push(decodeURIComponent(p.url.substring(idx + marker.length)));
              } else if (p.storage_path) {
                storagePaths.push(p.storage_path);
              }
            }
          }
        }
      }

      // Remove photo files from Supabase Storage
      if (storagePaths.length > 0) {
        try {
          const { error: sErr } = await supabase.storage.from('specimen-photos').remove(storagePaths);
          if (sErr) {
            console.warn('[Supabase Storage] Warning removing photos during batch delete:', sErr.message);
          }
        } catch (sEx: any) {
          console.warn('[Supabase Storage] Exception removing photos during batch delete:', sEx.message);
        }
      }

      // 3. Delete batch items
      const { error: itemsDelErr } = await supabase
        .from('batch_items')
        .delete()
        .eq('batch_id', batchId);

      if (itemsDelErr) {
        console.error('[Supabase DB] Error deleting batch items:', itemsDelErr.message);
        throw new Error(`Failed to delete batch items: ${itemsDelErr.message}`);
      }

      // 4. Delete the batch row
      const { error: batchDelErr } = await supabase
        .from('batches')
        .delete()
        .eq('batch_id', batchId);

      if (batchDelErr) {
        console.error('[Supabase DB] Error deleting batch:', batchDelErr.message);
        throw new Error(`Failed to delete batch: ${batchDelErr.message}`);
      }

      return { success: true, message: `Batch ${batchId} and all associated items and photos were permanently deleted.` };
    }

    // In-memory fallback
    const memBatch = memoryBatches.get(batchId);
    if (!memBatch) {
      return { success: true, message: "Batch already deleted." };
    }
    if (memBatch.status !== 'draft') {
      throw new Error(`Cannot delete batch '${batchId}': only draft (unsubmitted) batches can be deleted.`);
    }

    for (const [itemId, item] of memoryItems.entries()) {
      if (item.batch_id === batchId) {
        memoryItems.delete(itemId);
      }
    }
    memoryBatches.delete(batchId);

    return { success: true, message: `Batch ${batchId} deleted.` };
  },

  /**
   * Retrieves assigned inspector IDs mapped to an officer in public.officer_inspectors.
   * Emits a visible server-side warning if falling back to demo mapping.
   */
  async getOfficerInspectorIds(officerId: string = 'AD-CTRL-DL-02'): Promise<string[]> {
    const isOfficer2 = officerId === 'officer2' || officerId === 'AD-CTRL-MH-01';
    const fallbackIds = isOfficer2 
      ? ['LMO-MH-02', 'LMO-MH-03'] 
      : ['LMO-DL-04', 'LMO-DL-05', 'INSP-DEL-042', 'LMO-01', 'inspector'];

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('officer_inspectors')
          .select('inspector_id')
          .eq('officer_id', officerId);

        if (error) {
          console.warn(`[officer-scoping] officer_inspectors table not found — using hardcoded demo fallback. Run migration_officer_scoping.sql.`);
          return fallbackIds;
        }

        if (data && data.length > 0) {
          return data.map((r: any) => r.inspector_id);
        }

        // Try badge/username alias
        const alternateId = isOfficer2 
          ? (officerId === 'officer2' ? 'AD-CTRL-MH-01' : 'officer2')
          : (officerId === 'officer' ? 'AD-CTRL-DL-02' : 'officer');

        const { data: altData } = await supabase
          .from('officer_inspectors')
          .select('inspector_id')
          .eq('officer_id', alternateId);
        if (altData && altData.length > 0) {
          return altData.map((r: any) => r.inspector_id);
        }

        console.warn(`[officer-scoping] officer_inspectors table not found — using hardcoded demo fallback. Run migration_officer_scoping.sql.`);
        return fallbackIds;
      } catch (err: any) {
        console.warn(`[officer-scoping] officer_inspectors table not found — using hardcoded demo fallback. Run migration_officer_scoping.sql.`);
        return fallbackIds;
      }
    }

    console.warn(`[officer-scoping] officer_inspectors table not found — using hardcoded demo fallback. Run migration_officer_scoping.sql.`);
    return fallbackIds;
  },

  async getInspectorSupervisingOfficer(inspectorId?: string): Promise<any> {
    const id = (inspectorId || '').toUpperCase();
    if (id.includes('MH') || id.includes('MUMBAI') || id === 'LMO-MH-02' || id === 'LMO-MH-03') {
      return {
        officer_name: 'Smt. Anita Desai',
        officer_title: 'Deputy Controller (Legal Metrology, Mumbai Zone)',
        badge_number: 'AD-CTRL-MH-01',
        jurisdiction: 'Controller Office Mumbai',
      };
    }
    return {
      officer_name: 'Dr. S. K. Sharma',
      officer_title: 'Assistant Controller (Legal Metrology, Delhi Zone)',
      badge_number: 'AD-CTRL-DL-02',
      jurisdiction: 'Controller Office Delhi',
    };
  },

  async listOfficerBatches(officerId?: string): Promise<BatchRecord[]> {
    const assignedInspectors = await this.getOfficerInspectorIds(officerId || 'AD-CTRL-DL-02');
    const supabase = getSupabaseClient();

    if (supabase) {
      const { data, error } = await supabase
        .from('batches')
        .select(`
          *,
          batch_items (
            item_id,
            product_name,
            compliant,
            confidence,
            needs_review,
            review_reasons,
            status,
            officer_action,
            photos,
            declaration_values
          )
        `)
        .neq('status', 'draft')
        .in('inspector_id', assignedInspectors)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('[Supabase DB] Error listing officer batches:', error.message);
        throw new Error(`Supabase DB listOfficerBatches failed: ${error.message}`);
      }
      return (data || []).map((b: any) => {
        const items = b.batch_items || [];
        const compliantCount = items.filter((i: any) => i.compliant).length;
        return {
          ...b,
          item_count: items.length,
          compliant_count: compliantCount,
          non_compliant_count: items.length - compliantCount,
          items,
        };
      });
    }

    return Array.from(memoryBatches.values())
      .filter(b => b.status !== 'draft' && assignedInspectors.includes(b.inspector_id))
      .sort((a, b) => new Date(b.submitted_at || b.created_at).getTime() - new Date(a.submitted_at || a.created_at).getTime())
      .map(b => {
        const items = Array.from(memoryItems.values()).filter(i => i.batch_id === b.batch_id);
        const compliantCount = items.filter(i => i.compliant).length;
        return {
          ...b,
          item_count: items.length,
          compliant_count: compliantCount,
          non_compliant_count: items.length - compliantCount,
          items,
        };
      });
  },

  async getOfficerDashboardData(officerId: string = 'AD-CTRL-DL-02'): Promise<any> {
    const batches = await this.listOfficerBatches(officerId);
    const pendingBatches = batches.filter(b => b.status === 'pending_review' || b.status === 'under_review');
    const completedBatches = batches.filter(b => b.status === 'completed');

    let totalPendingItems = 0;
    let totalApprovedItems = 0;
    let totalOverriddenItems = 0;
    const needsAttentionItems: any[] = [];

    // Zero-roundtrip in-memory computation from pre-fetched batch items
    for (const b of batches) {
      const items = (b as any).items || (b as any).batch_items || [];
      const isPending = (b.status === 'pending_review' || b.status === 'under_review');

      for (const item of items) {
        const itemActioned = item.status === 'reviewed' || (!!item.officer_action && item.officer_action !== 'recapture_resolved') || item.status === 'recapture_requested';
        if (isPending && !itemActioned) {
          totalPendingItems++;
          // Flagged items: non-compliant or needs_review = true
          if (!item.compliant || item.needs_review) {
            needsAttentionItems.push({
              ...item,
              batch_id: b.batch_id,
              store_name: b.store_name,
              store_location: b.store_location,
              inspector_name: b.inspector_name,
              inspector_id: b.inspector_id,
              batch_submitted_at: b.submitted_at,
            });
          }
        }
        if (item.officer_action === 'approve' || item.officer_action === 'correct') {
          totalApprovedItems++;
        } else if (item.officer_action === 'override') {
          totalOverriddenItems++;
        }
      }
    }

    // Sort needs attention items: non-compliant first, then lowest confidence
    needsAttentionItems.sort((a, b) => {
      if (a.compliant !== b.compliant) return a.compliant ? 1 : -1;
      return (a.confidence || 0) - (b.confidence || 0);
    });

    return {
      stats: {
        pending_batches_count: pendingBatches.length,
        pending_items_count: totalPendingItems,
        approved_items_count: totalApprovedItems,
        overridden_items_count: totalOverriddenItems,
        completed_batches_count: completedBatches.length,
      },
      pending_batches: pendingBatches.length,
      pending_items: totalPendingItems,
      approved_items: totalApprovedItems,
      overridden_items: totalOverriddenItems,
      completed_batches: completedBatches.length,
      needs_attention: needsAttentionItems.slice(0, 20),
    };
  },

  async getOfficerInspectorsSummary(officerId: string = 'AD-CTRL-DL-02'): Promise<any[]> {
    const assignedInspectors = await this.getOfficerInspectorIds(officerId);
    const batches = await this.listOfficerBatches(officerId);

    // Query real inspectors table for authoritative names and jurisdictions
    const inspectorDetails: Record<string, { full_name: string; jurisdiction: string; phone?: string }> = {};
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: dbInspectors, error: inspErr } = await supabase
          .from('inspectors')
          .select('inspector_id, full_name, jurisdiction, contact_phone');

        if (!inspErr && dbInspectors && dbInspectors.length > 0) {
          for (const insp of dbInspectors) {
            let name = insp.full_name;
            if (insp.inspector_id === 'LMO-01' && name.includes('Auth Fallback')) {
              name = 'Amitabh Sen';
            }
            inspectorDetails[insp.inspector_id] = {
              full_name: name,
              jurisdiction: insp.jurisdiction || 'Delhi Zone',
              phone: insp.contact_phone,
            };
          }
        } else if (inspErr) {
          console.warn(`[inspector-names] real inspectors table query returned error: ${inspErr.message}`);
        }
      } catch (err: any) {
        console.warn(`[inspector-names] real inspectors table lookup failed: ${err.message}`);
      }
    }

    const fallbackNameMap: Record<string, { full_name: string; jurisdiction: string }> = {
      'LMO-DL-04': { full_name: 'Rajesh Kumar', jurisdiction: 'Central District, Circle 2, Delhi' },
      'LMO-DL-05': { full_name: 'Priya Sharma', jurisdiction: 'West & South West Delhi' },
      'INSP-DEL-042': { full_name: 'Vikas Verma', jurisdiction: 'North & North West Delhi' },
      'LMO-01': { full_name: 'Amitabh Sen', jurisdiction: 'Central District, Delhi' },
      'inspector': { full_name: 'Anil Saxena', jurisdiction: 'Field Operations, Delhi' },
      'LMO-MH-02': { full_name: 'Sunil Joshi', jurisdiction: 'Mumbai Suburban, Zone 4' },
      'LMO-MH-03': { full_name: 'Neha Kulkarni', jurisdiction: 'Mumbai Suburban, Zone 5 & 6' },
    };

    const summaries: Map<string, any> = new Map();

    for (const id of assignedInspectors) {
      let details = inspectorDetails[id];
      if (!details) {
        console.warn(`[inspector-names] real inspectors table lookup failed for ${id}, using hardcoded fallback name`);
        details = fallbackNameMap[id] || { full_name: `Field Inspector (${id})`, jurisdiction: 'Assigned Circle' };
      }

      summaries.set(id, {
        inspector_id: id,
        inspector_name: details.full_name,
        jurisdiction: details.jurisdiction,
        total_batches: 0,
        total_items: 0,
        compliant_count: 0,
        non_compliant_count: 0,
        compliance_rate: 0,
        last_submission_date: null,
        last_store_name: '',
      });
    }

    for (const b of batches) {
      const summary = summaries.get(b.inspector_id);
      if (!summary) continue;

      summary.total_batches += 1;
      summary.total_items += (b.item_count || 0);
      summary.compliant_count += (b.compliant_count || 0);
      summary.non_compliant_count += (b.non_compliant_count || 0);

      const subDate = b.submitted_at || b.created_at;
      if (!summary.last_submission_date || new Date(subDate) > new Date(summary.last_submission_date)) {
        summary.last_submission_date = subDate;
        summary.last_store_name = b.store_name;
      }
    }

    return Array.from(summaries.values()).map(s => {
      const total = s.total_items;
      s.compliance_rate = total > 0 ? Math.round((s.compliant_count / total) * 100) : 100;
      s.full_name = s.inspector_name;
      return s;
    });
  },

  async listOfficerLedgerItems(officerId: string = 'AD-CTRL-DL-02', filters?: any): Promise<any[]> {
    const assignedInspectors = await this.getOfficerInspectorIds(officerId);
    const batches: any[] = await this.listOfficerBatches(officerId);
    const batchMap = new Map<string, any>(batches.map((b: any) => [b.batch_id, b]));

    const supabase = getSupabaseClient();
    let items: any[] = [];

    if (supabase) {
      const batchIds = batches.map((b: any) => b.batch_id);
      if (batchIds.length === 0) return [];

      let query = supabase
        .from('batch_items')
        .select('*')
        .in('batch_id', batchIds)
        .in('status', ['reviewed', 'completed', 'approved'])
        .order('created_at', { ascending: false });

      if (filters?.status === 'compliant') {
        query = query.eq('compliant', true);
      } else if (filters?.status === 'non_compliant') {
        query = query.eq('compliant', false);
      }

      if (filters?.category && filters.category !== 'all') {
        query = query.eq('product_category', filters.category);
      }

      const { data, error } = await query;
      if (error) {
        console.error('[Supabase DB] Error fetching ledger items:', error.message);
        return [];
      }
      items = data || [];
    } else {
      const batchIds = new Set(batches.map((b: any) => b.batch_id));
      items = Array.from(memoryItems.values()).filter(i => {
        if (!batchIds.has(i.batch_id)) return false;
        if (!['reviewed', 'completed', 'approved'].includes(i.status) && !i.officer_action) return false;
        if (filters?.status === 'compliant' && !i.compliant) return false;
        if (filters?.status === 'non_compliant' && i.compliant) return false;
        if (filters?.category && filters.category !== 'all' && i.product_category !== filters.category) return false;
        return true;
      });
    }

    let enriched = items.map((item: any) => {
      const parent: any = batchMap.get(item.batch_id);
      return {
        ...item,
        store_name: parent?.store_name || 'Retail Establishment',
        store_location: parent?.store_location || '',
        inspector_name: parent?.inspector_name || 'Field Inspector',
        inspector_id: parent?.inspector_id || '',
        batch_submitted_at: parent?.submitted_at || item.created_at,
      };
    });

    if (filters?.search) {
      const term = filters.search.toLowerCase();
      enriched = enriched.filter(i =>
        (i.product_name || '').toLowerCase().includes(term) ||
        (i.item_id || '').toLowerCase().includes(term) ||
        (i.batch_id || '').toLowerCase().includes(term) ||
        (i.store_name || '').toLowerCase().includes(term) ||
        (i.declaration_values?.commodity_name || '').toLowerCase().includes(term) ||
        (i.declaration_values?.manufacturer_details || '').toLowerCase().includes(term)
      );
    }

    return enriched;
  },

  async approveCleanBatchItems(batchId: string, officerId: string = 'AD-CTRL-DL-02', remarks?: string, reviewerName?: string): Promise<any> {
    const full = await this.getBatchById(batchId);
    if (!full) throw new Error(`Batch ${batchId} not found`);

    const items = full.items || [];
    // Clean criteria: compliant === true && confidence >= 0.85 && needs_review === false && not already reviewed or flagged for recapture
    const cleanItems = items.filter(item =>
      item.compliant === true &&
      Number(item.confidence || 0) >= 0.85 &&
      !item.needs_review &&
      item.status !== 'reviewed' &&
      item.status !== 'recapture_requested' &&
      item.officer_action !== 'approve'
    );

    if (cleanItems.length === 0) {
      return {
        success: true,
        count: 0,
        approved_item_ids: [],
        message: 'No pending clean items found matching all criteria.',
      };
    }

    const cleanIds = cleanItems.map(i => i.item_id);
    const supabase = getSupabaseClient();
    const approvedAt = new Date().toISOString();
    const note = remarks || 'Approved under Rule 6 compliance review (Clean specimen endorsement)';
    const reviewer = reviewerName || officerId || 'Senior Reviewing Officer';

    if (supabase) {
      const { error: updateErr } = await supabase
        .from('batch_items')
        .update({
          status: 'reviewed',
          officer_action: 'approve',
          officer_remarks: note,
          reviewed_by: reviewer,
        })
        .in('item_id', cleanIds);

      if (updateErr) {
        console.error('[Supabase DB] Error in approveCleanBatchItems:', updateErr.message);
        throw new Error(`Failed to approve clean items: ${updateErr.message}`);
      }

      // Check if all items in this batch are now actioned
      const { data: allItems } = await supabase
        .from('batch_items')
        .select('item_id, status, officer_action')
        .eq('batch_id', batchId);

      if (allItems && allItems.length > 0) {
        const allReviewed = allItems.every((it: any) =>
          it.status === 'reviewed' || it.status === 'recapture_requested' || (!!it.officer_action && it.officer_action !== 'recapture_resolved')
        );
        if (allReviewed) {
          await this.updateBatchStatus(batchId, 'completed');
        }
      }
    } else {
      for (const id of cleanIds) {
        const item = memoryItems.get(id);
        if (item) {
          item.status = 'reviewed';
          item.officer_action = 'approve';
          item.officer_remarks = note;
          item.reviewed_by = reviewer;
          memoryItems.set(id, item);
        }
      }

      const memItems = Array.from(memoryItems.values()).filter(i => i.batch_id === batchId);
      const allDone = memItems.every(i => i.status === 'reviewed' || i.status === 'recapture_requested' || (!!i.officer_action && i.officer_action !== 'recapture_resolved'));
      if (allDone) {
        const b = memoryBatches.get(batchId);
        if (b) {
          b.status = 'completed';
          memoryBatches.set(batchId, b);
        }
      }
    }

    return {
      success: true,
      count: cleanIds.length,
      approved_item_ids: cleanIds,
      batch_id: batchId,
      message: `Successfully approved ${cleanIds.length} clean specimen(s) with individual audit logs.`,
    };
  },

  async getRecaptureItems(inspectorId?: string): Promise<any[]> {
    const supabase = getSupabaseClient();

    if (supabase) {
      // 1. Get all batches for this inspector (across draft, pending_review, completed)
      let bQuery = supabase.from('batches').select('batch_id, store_name, store_location, status');
      if (inspectorId) {
        bQuery = bQuery.eq('inspector_id', inspectorId);
      }
      const { data: batches, error: bErr } = await bQuery;
      if (bErr) {
        console.error('[Supabase DB] Error fetching batches for recaptures:', bErr.message);
        return [];
      }
      if (!batches || batches.length === 0) return [];

      const batchMap = new Map(batches.map(b => [b.batch_id, b]));
      const batchIds = batches.map(b => b.batch_id);

      // 2. Fetch all items flagged for recapture across all those batches
      const { data: items, error: iErr } = await supabase
        .from('batch_items')
        .select('*')
        .in('batch_id', batchIds)
        .eq('status', 'recapture_requested')
        .order('created_at', { ascending: false });

      if (iErr) {
        console.error('[Supabase DB] Error fetching recapture items:', iErr.message);
        return [];
      }

      return (items || []).map(item => {
        const parent = batchMap.get(item.batch_id);
        return {
          ...item,
          store_name: parent?.store_name || 'Retail Store',
          store_location: parent?.store_location || '',
          batch_status: parent?.status || 'submitted',
        };
      });
    }

    // In-memory fallback
    const memBatches = Array.from(memoryBatches.values())
      .filter(b => !inspectorId || b.inspector_id === inspectorId);
    const batchMap = new Map(memBatches.map(b => [b.batch_id, b]));
    const batchIds = new Set(memBatches.map(b => b.batch_id));

    return Array.from(memoryItems.values())
      .filter(i => batchIds.has(i.batch_id) && i.status === 'recapture_requested')
      .map(item => {
        const parent = batchMap.get(item.batch_id);
        return {
          ...item,
          store_name: parent?.store_name || 'Retail Store',
          store_location: parent?.store_location || '',
          batch_status: parent?.status || 'submitted',
        };
      });
  },

  async resubmitRecapturedItems(itemIds: string[]): Promise<any[]> {
    if (!itemIds || itemIds.length === 0) return [];
    const supabase = getSupabaseClient();

    if (supabase) {
      const { data, error } = await supabase
        .from('batch_items')
        .update({
          status: 'recapture_resolved',
          officer_action: 'recapture_resolved',
        })
        .in('item_id', itemIds)
        .select();

      if (error) {
        console.error('[Supabase DB] Error resubmitting recapture items:', error.message);
        return [];
      }
      return data || [];
    }

    const updated: any[] = [];
    for (const id of itemIds) {
      const item = memoryItems.get(id);
      if (item) {
        item.status = 'recapture_resolved';
        item.officer_action = 'recapture_resolved';
        memoryItems.set(id, item);
        updated.push(item);
      }
    }
    return updated;
  },
};

