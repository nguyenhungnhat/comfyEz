

import { useState, useEffect, useRef, useCallback } from 'react';
import { AppSettings, GenerationParams, QueueItem, HistoryItem, CanvasImage } from '../types';
import { generateClientId, queuePrompt, getHistory, getImageUrl, uploadImage } from '../services/comfyService';
import { constructWorkflow, dataURLtoFile } from '../utils';
import { saveHistoryItem, getAllHistory, deleteHistoryItemDB, saveQueueDB, loadQueueDB } from '../services/db';

export const useComfy = (settings: AppSettings, addToCurrent: boolean) => {
    // --- State ---
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [isQueueLoaded, setIsQueueLoaded] = useState(false);

    // History is now loaded async from DB
    const [history, setHistory] = useState<HistoryItem[]>([]);

    const [canvasImages, setCanvasImages] = useState<CanvasImage[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingError, setProcessingError] = useState<string | null>(null);
    const clientIdRef = useRef<string>(generateClientId());
    
    // Ref to track latest value of addToCurrent inside async closures
    const addToCurrentRef = useRef(addToCurrent);
    useEffect(() => { addToCurrentRef.current = addToCurrent; }, [addToCurrent]);

    // --- Helpers ---
    const addToHistory = useCallback(async (url: string, params: GenerationParams) => {
        const newItem: HistoryItem = {
            id: Date.now().toString() + Math.random(),
            imageUrl: url,
            params: JSON.parse(JSON.stringify(params)), // Deep copy
            timestamp: Date.now()
        };
        
        // Save to DB first
        try {
            await saveHistoryItem(newItem);
            setHistory(prev => [newItem, ...prev]);
        } catch (e) {
            console.error("Failed to save history", e);
        }
    }, []);

    const removeHistoryItem = useCallback(async (id: string) => {
        try {
            await deleteHistoryItemDB(id);
            setHistory(prev => prev.filter(item => item.id !== id));
        } catch (e) {
            console.error("Failed to delete history item", e);
        }
    }, []);

    const updateQueueStatus = (id: string, status: QueueItem['status'], error?: string) => {
        setQueue(prev => prev.map(item => 
            item.id === id ? { ...item, status, error } : item
        ));
    };

    // --- Core Logic ---
    const pollHistory = async (promptId: string, item: QueueItem) => {
        const maxAttempts = 120; // 2 mins
        let attempts = 0;

        const interval = setInterval(async () => {
            attempts++;
            if (attempts > maxAttempts) {
                clearInterval(interval);
                updateQueueStatus(item.id, 'error', 'Timeout');
                setIsProcessing(false);
                setProcessingError("Generation timed out.");
                setQueue(prev => prev.filter(q => q.id !== item.id));
                return;
            }

            try {
                const historyData = await getHistory(settings.host, promptId);
                
                if (historyData && historyData[promptId]) {
                    clearInterval(interval);
                    const promptData = historyData[promptId];

                    if (promptData.status && promptData.status.status_str === 'error') {
                        updateQueueStatus(item.id, 'error', 'ComfyUI Error');
                        setIsProcessing(false);
                        setProcessingError("ComfyUI reported an error.");
                         setQueue(prev => prev.filter(q => q.id !== item.id));
                        return;
                    }

                    const outputs = promptData.outputs;
                    const newCanvasImages: CanvasImage[] = [];
                    
                    // Identify nodes to check
                    const mapping = item.params.nodeMapping;
                    const workflow = item.params.workflow;

                    const normalPreviewId = mapping?.previewNode || '56';
                    let upscalePreviewId = mapping?.upscalePreviewNode;

                    // Smart detection for upscale preview node if enabled but not mapped
                    if (item.params.upscaler && !upscalePreviewId && workflow) {
                        const upscaleNodeId = mapping?.upscaleNode || 
                             Object.keys(workflow).find(k => workflow[k].class_type === "ImageScaleBy");
                        
                        if (upscaleNodeId) {
                            // Find a preview/save node that takes this as input
                            upscalePreviewId = Object.keys(workflow).find(k => {
                                const n = workflow[k];
                                const isImageNode = n.class_type === "PreviewImage" || n.class_type === "SaveImage";
                                return isImageNode && n.inputs?.images?.[0] === upscaleNodeId;
                            });
                        }
                    }

                    // Define output nodes to collect from
                    const outputNodes = [normalPreviewId];
                    if (item.params.upscaler && upscalePreviewId) {
                        outputNodes.push(upscalePreviewId);
                    }

                    outputNodes.forEach(nodeId => {
                         if (nodeId && outputs[nodeId] && outputs[nodeId].images.length > 0) {
                             const imagesData = outputs[nodeId].images;
                             // Visual multiplier hint
                             const isUpscale = nodeId === upscalePreviewId;
                             // Use configured factor if present, default to 2
                             const factor = item.params.upscaleFactor || 2;
                             const multiplier = isUpscale ? factor : 1; 

                             imagesData.forEach((img: any) => {
                                 newCanvasImages.push({
                                    id: Date.now().toString() + Math.random(),
                                    url: getImageUrl(settings.host, img.filename, img.subfolder, img.type),
                                    width: item.params.width * multiplier,
                                    height: item.params.height * multiplier,
                                    params: item.params
                                 });
                             });
                         }
                    });

                    if (newCanvasImages.length > 0) {
                        // Success!
                        setCanvasImages(prev => {
                            if (addToCurrentRef.current) {
                                return [...prev, ...newCanvasImages];
                            } else {
                                return newCanvasImages;
                            }
                        });
                        
                        // Async add to history
                        newCanvasImages.forEach(img => addToHistory(img.url, item.params));
                        
                        setIsProcessing(false);
                        setProcessingError(null);
                        setQueue(prev => prev.filter(q => q.id !== item.id)); // Remove done item
                    } else {
                        updateQueueStatus(item.id, 'error', 'No Output');
                        setIsProcessing(false);
                        setQueue(prev => prev.filter(q => q.id !== item.id));
                    }
                }
            } catch (err) {
                console.warn("Polling error:", err);
            }
        }, 1000);
    };

    const processQueueItem = async (item: QueueItem) => {
        setIsProcessing(true);
        setProcessingError(null);
        updateQueueStatus(item.id, 'processing');

        try {
            // 1. Upload Images if they exist
            let uploadedImageName = undefined;
            let uploadedMaskName = undefined;

            if (item.params.inputImage && item.params.inputImage.startsWith('data:')) {
                const safeName = `input_${Date.now()}.png`;
                const file = dataURLtoFile(item.params.inputImage, safeName);
                if (file) {
                    const result = await uploadImage(settings.host, file);
                    uploadedImageName = result.name;
                }
            }

            if (item.params.maskImage && item.params.maskImage.startsWith('data:')) {
                 const safeName = `mask_${Date.now()}.png`;
                 const file = dataURLtoFile(item.params.maskImage, safeName);
                 if (file) {
                     const result = await uploadImage(settings.host, file);
                     uploadedMaskName = result.name;
                 }
            }

            // 2. Construct Workflow
            const workflow = constructWorkflow(item.params, uploadedImageName, uploadedMaskName);
            
            // 3. Queue
            const response = await queuePrompt(settings.host, clientIdRef.current, workflow);
            
            if (response.prompt_id) {
                // Update queue with prompt_id so it persists
                setQueue(prev => prev.map(q => q.id === item.id ? { ...q, promptId: response.prompt_id } : q));
                pollHistory(response.prompt_id, item);
            } else {
                throw new Error("No prompt_id received");
            }
        } catch (err: any) {
            console.error(err);
            updateQueueStatus(item.id, 'error', err.message);
            setIsProcessing(false);
            setProcessingError(err.message || "Failed to queue prompt.");
             setTimeout(() => {
                setQueue(prev => prev.filter(q => q.id !== item.id));
             }, 2000);
        }
    };

    // --- Persistence Effects ---
    // Load History & Queue on Mount
    useEffect(() => {
        getAllHistory().then(setHistory).catch(console.error);
        loadQueueDB().then((savedQueue) => {
            let recoveringItem: QueueItem | undefined;

            const sanitizedQueue = savedQueue.map(item => {
                if (item.status === 'processing') {
                    // Try to recover if we have a prompt ID
                    if (item.promptId && !recoveringItem) {
                        recoveringItem = item;
                        return item;
                    }
                    // Otherwise reset to pending to try again
                    return { ...item, status: 'pending' as const, error: undefined };
                }
                return item;
            });

            setQueue(sanitizedQueue);
            setIsQueueLoaded(true);

            // Resume processing if we found a recovering item
            if (recoveringItem && recoveringItem.promptId) {
                setIsProcessing(true);
                pollHistory(recoveringItem.promptId, recoveringItem);
            }
        }).catch(console.error);
    }, []);

    // Save Queue on Change (only after initial load)
    useEffect(() => {
        if (isQueueLoaded) {
            saveQueueDB(queue).catch(console.error);
        }
    }, [queue, isQueueLoaded]);

    // --- Queue Watcher ---
    useEffect(() => {
        if (!isProcessing && isQueueLoaded && queue.length > 0) {
            const nextItem = queue.find(q => q.status === 'pending');
            if (nextItem) {
                processQueueItem(nextItem);
            }
        }
    }, [isProcessing, queue, isQueueLoaded, settings.host]); 

    // --- Public Actions ---
    const addToQueue = (params: GenerationParams) => {
        const newItem: QueueItem = {
            id: Date.now().toString(),
            params: JSON.parse(JSON.stringify(params)),
            timestamp: Date.now(),
            status: 'pending'
        };
        setQueue(prev => [...prev, newItem]);
    };

    const removeFromQueue = (id: string) => {
        setQueue(prev => prev.filter(q => q.id !== id));
    };

    const clearQueue = () => {
        setQueue(prev => prev.filter(q => q.status === 'processing')); 
    };

    const reorderQueue = (dragIndex: number, hoverIndex: number) => {
        setQueue(prev => {
            const newQueue = [...prev];
            const [removed] = newQueue.splice(dragIndex, 1);
            newQueue.splice(hoverIndex, 0, removed);
            return newQueue;
        });
    };

    return {
        queue,
        history,
        canvasImages,
        setCanvasImages,
        setHistory,
        removeHistoryItem,
        isProcessing,
        processingError,
        addToQueue,
        removeFromQueue,
        clearQueue,
        reorderQueue
    };
};