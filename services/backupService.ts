import JSZip from "jszip";
import { 
  getAllHistory, restoreHistoryDB,
  loadSessionParams, saveSessionParams,
  loadQueueDB, restoreQueueDB,
  getAllLorasDB, restoreLorasDB
} from "./db";

// Helper to trigger download
const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const LOCAL_STORAGE_KEYS = [
    'comfy_settings',
    'comfy_presets',
    'comfy_active_preset',
    'comfy_variant_system_prompt'
];

export const createBackup = async () => {
    const zip = new JSZip();

    // 1. Local Storage
    const localStorageData: Record<string, string | null> = {};
    LOCAL_STORAGE_KEYS.forEach(key => {
        const val = localStorage.getItem(key);
        if (val) localStorageData[key] = val;
    });
    zip.file("localstorage.json", JSON.stringify(localStorageData, null, 2));

    // 2. IndexedDB Data
    const history = await getAllHistory();
    zip.file("history.json", JSON.stringify(history, null, 2));

    const loras = await getAllLorasDB();
    zip.file("loras.json", JSON.stringify(loras, null, 2));

    const queue = await loadQueueDB();
    zip.file("queue.json", JSON.stringify(queue, null, 2));

    const session = await loadSessionParams();
    if (session) {
        zip.file("session.json", JSON.stringify(session, null, 2));
    }

    // Generate ZIP
    const content = await zip.generateAsync({ type: "blob" });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadBlob(content, `comfyez-backup-${timestamp}.zip`);
};

export const restoreBackup = async (file: File) => {
    const zip = await JSZip.loadAsync(file);

    // 1. Restore Local Storage
    const lsFile = zip.file("localstorage.json");
    if (lsFile) {
        const content = await lsFile.async("string");
        const data = JSON.parse(content);
        Object.entries(data).forEach(([key, value]) => {
            if (typeof value === 'string') {
                localStorage.setItem(key, value);
            }
        });
    }

    // 2. Restore IndexedDB
    
    // History
    const historyFile = zip.file("history.json");
    if (historyFile) {
        const content = await historyFile.async("string");
        const data = JSON.parse(content);
        if (Array.isArray(data)) {
            await restoreHistoryDB(data);
        }
    }

    // Loras
    const lorasFile = zip.file("loras.json");
    if (lorasFile) {
        const content = await lorasFile.async("string");
        const data = JSON.parse(content);
        if (Array.isArray(data)) {
            await restoreLorasDB(data);
        }
    }

    // Queue
    const queueFile = zip.file("queue.json");
    if (queueFile) {
        const content = await queueFile.async("string");
        const data = JSON.parse(content);
        if (Array.isArray(data)) {
            await restoreQueueDB(data);
        }
    }

    // Session
    const sessionFile = zip.file("session.json");
    if (sessionFile) {
        const content = await sessionFile.async("string");
        const data = JSON.parse(content);
        await saveSessionParams(data);
    }
};