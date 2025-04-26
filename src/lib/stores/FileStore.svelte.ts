// src/lib/stores/FileStore.ts
import { ResourceStore } from './ResourceStore.svelte';
import { storage } from '$lib/appwrite'; // Assuming you export storage instance
import {Query} from 'appwrite'
import type {Models} from 'appwrite'

/**
 * Store for Appwrite file *content* (assuming text).
 * The cache key is the file ID, the value is the file content string.
 */
export class FileStore extends ResourceStore<Models.File> {
    protected bucketId: string;

    static UPDATES_PAGE_SIZE = 100
    
    constructor(bucketId: string) {
        super();
        this.bucketId = bucketId;
        this.realtimeChannel = `buckets.${bucketId}.files`;
    }

    /**
     * Fetches a single file's content as text from Appwrite Storage.
     * @override
     */
    protected async _fetchOne(id: string): Promise<Models.File> {
        try {
            const file = await storage.getFile(this.bucketId, id)
            console.log("metadata: "+file)
            console.log(`Requesting view URL for file ${id} from bucket ${this.bucketId}`);
            const f = await storage.getFile(this.bucketId, id)
            return f
    
        } catch (error) {
            console.error(`Error fetching file ${id} from bucket ${this.bucketId}:`, error);
            throw error;
        }
    }

    protected lastFetchedUpdateId = $state<string | null>(null);
    
    defaultQueries: string[] = [
            Query.orderDesc('$updatedAt'),
            Query.limit(FileStore.UPDATES_PAGE_SIZE)
        ];
    async fetchNext() {
        const f = (await storage.listFiles(this.bucketId, this.defaultQueries)).files
        f.forEach(doc => this.addOrUpdateItem(doc));

        if (f.length > 0) {
            // Set cursor to the last document ID of the fetched page
            this.lastFetchedUpdateId = f[f.length - 1].$id
        }
    }
    async initialize(){
        await this.fetchNext
    }

    clear(): void {
        super.clear()
        this.lastFetchedUpdateId = null
    }
}