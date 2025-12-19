
import { openDB, DBSchema } from 'idb';

interface DiscoryDB extends DBSchema {
    vinyls: {
        key: string;
        value: Vinyl;
    };
}

export interface Vinyl {
    id: string;
    title: string;
    artist: string;
    genre: string;
    cover_image?: string;
    rating?: number;
    vinyl_color?: string;
    disc_count?: number;
    format?: "vinyl" | "cd";
    // Add other fields as necessary, matching the API response
    user_id?: string;
    gifted_by_username?: string;
    shared_with_username?: string;
    date_added?: string;
}

const DB_NAME = 'discory-db';
const STORE_NAME = 'vinyls';

export async function initDB() {
    return openDB<DiscoryDB>(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        },
    });
}

export async function saveVinyls(vinyls: Vinyl[]) {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Clear existing to avoid stale data (optional, or we can just put/merge)
    // For a "sync" strategy where api source of truth is absolute, clear is safer but slower.
    // Let's use put for upsert. 

    // However, if items are deleted on server, they remain here. 
    // Ideally, valid sync clears or we track deletions. 
    // For simplicity MVP: clear and repopulate or just put all.
    // Let's clear store if we are doing a full fetch.
    await store.clear();

    for (const vinyl of vinyls) {
        await store.put(vinyl);
    }
    await tx.done;
}

export async function getVinyls(): Promise<Vinyl[]> {
    const db = await initDB();
    return db.getAll(STORE_NAME);
}
