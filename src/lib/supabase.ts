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
    });
    return _supabaseClient;
  } catch (err) {
    console.warn('[Supabase] Failed to initialize Supabase client:', err);
    return null;
  }
}

/**
 * Storage Helper: Uploads a photo buffer to Supabase Storage bucket 'specimen-photos'.
 * Returns public URL or fallback data URL.
 */
export async function uploadSpecimenPhoto(
  buffer: Buffer,
  filename: string,
  contentType: string = 'image/jpeg'
): Promise<string> {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase.storage
        .from('specimen-photos')
        .upload(`uploads/${filename}`, buffer, {
          contentType,
          upsert: true,
        });

      if (!error && data) {
        const { data: publicData } = supabase.storage
          .from('specimen-photos')
          .getPublicUrl(`uploads/${filename}`);

        if (publicData?.publicUrl) {
          return publicData.publicUrl;
        }
      } else if (error) {
        console.warn(`[Supabase Storage] Upload error: ${error.message}. Using fallback.`);
      }
    } catch (e: any) {
      console.warn(`[Supabase Storage] Exception: ${e.message}. Using fallback.`);
    }
  }

  // Fallback: Base64 data URI (guarantees photos always display cleanly in UI)
  const base64 = buffer.toString('base64');
  return `data:${contentType};base64,${base64}`;
}

// ============================================================================
// IN-MEMORY / HYBRID DATA ADAPTER FOR BATCHES & ITEMS
// Seamlessly delegates to Supabase DB when connected, with in-memory persistence fallback
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
}

// In-memory backing store for local dev or when Supabase credentials aren't set
const memoryBatches: Map<string, BatchRecord> = new Map();
const memoryItems: Map<string, BatchItemRecord> = new Map();

// Initialize demo batches for out-of-the-box local testing
function initDemoData() {
  if (memoryBatches.size > 0) return;

  const demoBatchId = 'BATCH-2026-DEL-001';
  memoryBatches.set(demoBatchId, {
    batch_id: demoBatchId,
    inspector_id: 'LMO-DL-04',
    inspector_name: 'Rajesh Kumar',
    jurisdiction: 'Central District, Circle 2',
    store_name: 'SuperMart Hypermarket',
    store_location: 'Connaught Place, New Delhi',
    status: 'draft',
    created_at: new Date().toISOString(),
    submitted_at: null,
  });
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
      try {
        const { error } = await supabase.from('batches').insert([record]);
        if (error) console.warn('[Supabase DB] Error creating batch:', error.message);
      } catch (err) {
        console.warn('[Supabase DB] Exception creating batch:', err);
      }
    }

    memoryBatches.set(batch.batch_id, record);
    return record;
  },

  async getBatchById(batchId: string): Promise<BatchRecord | null> {
    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        const { data: batch, error: batchErr } = await supabase
          .from('batches')
          .select('*')
          .eq('batch_id', batchId)
          .single();

        if (!batchErr && batch) {
          const { data: items } = await supabase
            .from('batch_items')
            .select('*')
            .eq('batch_id', batchId)
            .order('created_at', { ascending: true });

          return {
            ...batch,
            items: items || [],
          };
        }
      } catch (err) {
        console.warn('[Supabase DB] Exception fetching batch:', err);
      }
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
      try {
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
        if (!error && data && data.length > 0) {
          return this.getBatchById(data[0].batch_id);
        }
      } catch (err) {
        console.warn('[Supabase DB] Exception fetching active batch:', err);
      }
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
      try {
        let query = supabase.from('batches').select('*').order('created_at', { ascending: false });
        if (inspectorId) {
          query = query.eq('inspector_id', inspectorId);
        }
        const { data, error } = await query;
        if (!error && data) {
          const drafts = data.filter(b => b.status === 'draft');
          const submitted = data.filter(b => b.status !== 'draft');
          return { drafts, submitted };
        }
      } catch (err) {
        console.warn('[Supabase DB] Exception listing batches:', err);
      }
    }

    const all = Array.from(memoryBatches.values())
      .filter(b => !inspectorId || b.inspector_id === inspectorId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return {
      drafts: all.filter(b => b.status === 'draft'),
      submitted: all.filter(b => b.status !== 'draft'),
    };
  },

  async activateBatch(batchId: string): Promise<BatchRecord | null> {
    const now = new Date().toISOString();
    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        await supabase
          .from('batches')
          .update({ created_at: now })
          .eq('batch_id', batchId);
      } catch (err) {
        console.warn('[Supabase DB] Exception activating batch:', err);
      }
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
      try {
        await supabase
          .from('batches')
          .update({ status: 'pending_review', submitted_at: now })
          .eq('batch_id', batchId);
      } catch (err) {
        console.warn('[Supabase DB] Exception submitting batch:', err);
      }
    }

    const batch = memoryBatches.get(batchId);
    if (batch) {
      batch.status = 'pending_review';
      batch.submitted_at = now;
      return this.getBatchById(batchId);
    }
    return null;
  },

  async addBatchItem(item: BatchItemRecord): Promise<BatchItemRecord> {
    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        await supabase.from('batch_items').upsert([item]);
      } catch (err) {
        console.warn('[Supabase DB] Exception adding item:', err);
      }
    }

    memoryItems.set(item.item_id, item);
    return item;
  },

  async updateBatchItem(itemId: string, patch: Partial<BatchItemRecord>): Promise<BatchItemRecord | null> {
    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        await supabase.from('batch_items').update(patch).eq('item_id', itemId);
      } catch (err) {
        console.warn('[Supabase DB] Exception updating item:', err);
      }
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
      try {
        await supabase.from('batch_items').delete().eq('item_id', itemId);
      } catch (err) {
        console.warn('[Supabase DB] Exception deleting item:', err);
      }
    }

    return memoryItems.delete(itemId);
  },

  async listOfficerBatches(): Promise<BatchRecord[]> {
    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('batches')
          .select('*')
          .neq('status', 'draft')
          .order('submitted_at', { ascending: false });

        if (!error && data) return data;
      } catch (err) {
        console.warn('[Supabase DB] Exception listing officer batches:', err);
      }
    }

    return Array.from(memoryBatches.values())
      .filter(b => b.status !== 'draft')
      .sort((a, b) => new Date(b.submitted_at || b.created_at).getTime() - new Date(a.submitted_at || a.created_at).getTime());
  },
};
