// src/lib/stores/DocumentStore.svelte.ts
import { ResourceStore } from './ResourceStore.svelte';
import { databases } from '$lib/appwrite'; // Assuming you export databases instance
import {Query} from 'appwrite'
import type { Models } from 'appwrite';
import { MAIN_DB_ID } from "$lib/appwrite"

/**
 * @template T Extends Appwrite's Document type.
 */
export class DocumentStore<T extends Models.Document> extends ResourceStore<T> {

    static UPDATES_PAGE_SIZE = 25; // Define page size for pagination

    databaseId: string;
    collectionId: string;

    protected lastFetchedUpdateId = $state<string | null>(null);


    constructor(collectionId: string) {
        super(); // Pass client to parent
        this.databaseId = MAIN_DB_ID
        this.collectionId = collectionId;
        this.realtimeChannel = `databases.${this.databaseId}.collections.${collectionId}.documents`;
    }

    /**
     * Fetches a single document from Appwrite.
     * @override
     */
    protected async _fetchOne(id: string): Promise<T> {
        // Use the databases instance from appwrite.ts
        return await databases.getDocument<T>(this.databaseId, this.collectionId, id);
    }

    
    // You can add methods specific to documents, e.g., list with queries
    async listDocuments(queries: string[]): Promise<Models.DocumentList<T>> {
        // Example: Fetch all documents (use pagination/queries in real app)
        const response = await databases.listDocuments<T>(
            this.databaseId,
            this.collectionId,
            queries
            // Add queries here, e.g., [Query.limit(10)]
        );
        // Optionally update the cache with fetched documents
        response.documents.forEach(doc => this.addOrUpdateItem(doc));
        return response;
    }

    defaultQueries: string[] = [
        Query.orderDesc('$updatedAt'),
        Query.limit(DocumentStore.UPDATES_PAGE_SIZE)
    ];

    async _fetchModelUpdatesPage(): Promise<T[]> {
        const queries = this.defaultQueries

        const cursor = this.lastFetchedUpdateId

        if (cursor) {
            queries.push(Query.cursorAfter(cursor));
        }
        
        const response = await databases.listDocuments<T>(
            this.databaseId,
            this.collectionId,
            queries
            
        );
        // Optionally update the cache with fetched documents
        response.documents.forEach(doc => this.addOrUpdateItem(doc));
        console.log("fetched "+response.documents.length+" items")
        if (response.documents.length > 0) {
            // Set cursor to the last document ID of the fetched page
            this.lastFetchedUpdateId = response.documents[response.documents.length - 1].$id
        }
        return response.documents
    }

    async fetchNext() {
        console.log("fetching next page..")
        await this._fetchModelUpdatesPage()
    }

    async initialize(){
        await this.fetchNext()
    }

    clear(): void {
        super.clear()
        this.lastFetchedUpdateId = null
    }
    async updateDoc(d: T) {
        return await databases.updateDocument(this.databaseId, this.collectionId, d.$id, d)
    }

}