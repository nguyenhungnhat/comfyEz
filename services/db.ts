

import { HistoryItem, GenerationParams, QueueItem, Lora } from "../types";

const DB_NAME = "ComfyPlaygroundDB";
const STORE_NAME_HISTORY = "history";
const STORE_NAME_SESSION = "session"; // For current params
const STORE_NAME_QUEUE = "queue";
const STORE_NAME_LORAS = "loras"; // New store for metadata

const KEY_PARAMS = "current_params";
const KEY_QUEUE = "current_queue";

const VERSION = 3; // Increment version for new stores

export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORE_NAME_HISTORY)) {
        db.createObjectStore(STORE_NAME_HISTORY, { keyPath: "id" });
      }
      
      if (!db.objectStoreNames.contains(STORE_NAME_SESSION)) {
        db.createObjectStore(STORE_NAME_SESSION);
      }

      if (!db.objectStoreNames.contains(STORE_NAME_QUEUE)) {
          db.createObjectStore(STORE_NAME_QUEUE);
      }

      if (!db.objectStoreNames.contains(STORE_NAME_LORAS)) {
          // Key path is the LoRA name (filename) as it's unique in ComfyUI
          db.createObjectStore(STORE_NAME_LORAS, { keyPath: "name" });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

// --- History ---

export const saveHistoryItem = async (item: HistoryItem) => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME_HISTORY], "readwrite");
    const store = transaction.objectStore(STORE_NAME_HISTORY);
    const request = store.put(item);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getAllHistory = async (): Promise<HistoryItem[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME_HISTORY], "readonly");
    const store = transaction.objectStore(STORE_NAME_HISTORY);
    const request = store.getAll();

    request.onsuccess = () => {
        const items = request.result as HistoryItem[];
        resolve(items.sort((a, b) => b.timestamp - a.timestamp));
    };
    request.onerror = () => reject(request.error);
  });
};

export const deleteHistoryItemDB = async (id: string) => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME_HISTORY], "readwrite");
    const store = transaction.objectStore(STORE_NAME_HISTORY);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const clearHistoryDB = async () => {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME_HISTORY], "readwrite");
        const store = transaction.objectStore(STORE_NAME_HISTORY);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// --- Session (Params) ---

export const saveSessionParams = async (params: GenerationParams) => {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME_SESSION], "readwrite");
        const store = transaction.objectStore(STORE_NAME_SESSION);
        const request = store.put(params, KEY_PARAMS);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const loadSessionParams = async (): Promise<GenerationParams | null> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME_SESSION], "readonly");
        const store = transaction.objectStore(STORE_NAME_SESSION);
        const request = store.get(KEY_PARAMS);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
};

// --- Queue ---

export const saveQueueDB = async (queue: QueueItem[]) => {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME_QUEUE], "readwrite");
        const store = transaction.objectStore(STORE_NAME_QUEUE);
        const request = store.put(queue, KEY_QUEUE);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const loadQueueDB = async (): Promise<QueueItem[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME_QUEUE], "readonly");
        const store = transaction.objectStore(STORE_NAME_QUEUE);
        const request = store.get(KEY_QUEUE);
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
};

// --- LoRA Metadata ---

export const getAllLorasDB = async (): Promise<Lora[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME_LORAS], "readonly");
        const store = transaction.objectStore(STORE_NAME_LORAS);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
};

export const updateLoraMetadataDB = async (lora: Lora) => {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME_LORAS], "readwrite");
        const store = transaction.objectStore(STORE_NAME_LORAS);
        // We only persist the metadata fields + name (key)
        const request = store.put(lora);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};