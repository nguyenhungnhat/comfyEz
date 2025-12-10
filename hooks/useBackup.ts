import { useState } from 'react';
import { createBackup, restoreBackup } from '../services/backupService';

export const useBackup = () => {
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [backupError, setBackupError] = useState<string | null>(null);

    const handleBackup = async () => {
        setIsBackingUp(true);
        setBackupError(null);
        try {
            await createBackup();
        } catch (e: any) {
            console.error(e);
            setBackupError("Backup failed: " + (e.message || "Unknown error"));
        } finally {
            setIsBackingUp(false);
        }
    };

    const handleRestore = async (file: File) => {
        setIsRestoring(true);
        setBackupError(null);
        try {
            await restoreBackup(file);
            // Reload to apply all restored settings/state
            window.location.reload();
        } catch (e: any) {
            console.error(e);
            setBackupError("Restore failed: " + (e.message || "Unknown error"));
        } finally {
            setIsRestoring(false);
        }
    };

    return { 
        handleBackup, 
        handleRestore, 
        isBackingUp, 
        isRestoring, 
        backupError 
    };
};