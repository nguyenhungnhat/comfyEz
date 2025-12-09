
import { useState, useEffect, useCallback } from 'react';
import { Lora } from '../types';
import { getLoras } from '../services/comfyService';
import { getAllLorasDB, updateLoraMetadataDB } from '../services/db';

export const useLoraLibrary = (host: string) => {
    const [library, setLibrary] = useState<Lora[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refreshLibrary = useCallback(async () => {
        setIsLoading(true);
        try {
            // 1. Fetch File List from API
            const filenames = await getLoras(host);
            
            // 2. Fetch Metadata from DB
            const metadataList = await getAllLorasDB();
            const metadataMap = new Map(metadataList.map(l => [l.name, l]));

            // 3. Merge
            const merged: Lora[] = filenames.map(name => {
                const meta = metadataMap.get(name);
                return {
                    id: meta?.id || name, // ID fallback to name
                    name: name,
                    strength: 1.0, // Default for library view
                    enabled: false,
                    previewImage: meta?.previewImage,
                    triggerKey: meta?.triggerKey,
                    isFavorite: meta?.isFavorite || false,
                    category: meta?.category || 'Uncategorized',
                    lastUsed: meta?.lastUsed || 0
                };
            });

            // 4. Sort (Favorites first, then Recent, then Alphabetical)
            merged.sort((a, b) => {
                if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
                if (a.lastUsed !== b.lastUsed) return (b.lastUsed || 0) - (a.lastUsed || 0);
                return a.name.localeCompare(b.name);
            });

            setLibrary(merged);
        } catch (e) {
            console.error("Failed to load LoRA library", e);
        } finally {
            setIsLoading(false);
        }
    }, [host]);

    // Initial Load
    useEffect(() => {
        if (host) refreshLibrary();
    }, [host, refreshLibrary]);

    // Listen for external updates (e.g. from generation cycle)
    useEffect(() => {
        const handleUpdate = () => refreshLibrary();
        window.addEventListener('lora-metadata-changed', handleUpdate);
        return () => window.removeEventListener('lora-metadata-changed', handleUpdate);
    }, [refreshLibrary]);

    const updateLora = async (name: string, updates: Partial<Lora>) => {
        setLibrary(prev => prev.map(l => {
            if (l.name === name) {
                const updated = { ...l, ...updates };
                // Persist to DB asynchronously
                updateLoraMetadataDB(updated).then(() => {
                    // Dispatch event for other listeners if needed, though local state update handles this instance
                    // window.dispatchEvent(new Event('lora-metadata-changed'));
                }).catch(console.error);
                return updated;
            }
            return l;
        }));
    };

    return {
        library,
        isLoading,
        refreshLibrary,
        updateLora
    };
};
