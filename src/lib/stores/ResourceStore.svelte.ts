// src/lib/stores/ResourceStore.ts
import { SvelteMap } from 'svelte/reactivity'
import type { HasUpdatedAt } from '../types';
// import { type HasUpdatedAt } from '$lib/types';
import { client } from "$lib/appwrite"
import type {Client} from "appwrite"

/**
 * @template T The type of the resource being stored (e.g., Document object, file content string).
 */
export class ResourceStore<T extends HasUpdatedAt> {

  subscribers: (() => void)[] = []
  addSub(s: () => void) {
    this.subscribers.push(s) 
  }
  
    realtimeChannel: string = ""

    // --- Reactive State ---
    /**
     * The core in-memory cache. Maps resource ID to resource data.
     * Using $state makes any reads of this map reactive.
     */
    cache = new SvelteMap<string, T>();

    

    /** chronological list of resource IDs (newest first) */
    ids = $state<string[]>([]);

    elements: T[] = $derived(this.ids.map((id)=>{
      return this.cache.get(id)
    })
      .filter((g) => g !== undefined)
    )


    /**
     * Stores promises for fetches that are currently in progress.
     * Maps resource ID to the promise handling its fetch.
     * This is key to avoid duplicate fetches and return results to concurrent callers.
     * This is intentionally *not* $state, as it's internal transient state.
     */
    ongoingFetches = new SvelteMap<string, Promise<T>>()

    /**
     * Stores any errors encountered during fetching, mapped by ID.
     */
    errors = new SvelteMap<string, Error>()

    // --- Dependencies ---
    protected client: Client; // Reference to the Appwrite client

    /**
     * @param client Initialized Appwrite Client instance.
     */
    constructor() {
        this.client = client;
        // Note: $state variables are initialized above directly
    }

    // --- Public Methods ---
    /**
   * Add a new item or update an existing one.
   * Repositions its ID in `ids` based on the
   * item’s `$updatedAt` (newest first).
   */
  addOrUpdateItem(item: T) {
    // 1. put/update in cache
    this.cache.set(item.$id, item);

    // 2. remove any existing reference in the ids array
    const oldIndex = this.ids.indexOf(item.$id);
    if (oldIndex !== -1) {
      this.ids.splice(oldIndex, 1);
    }

    // 3. find where to re‑insert (newest first)
    const newTime = Date.parse(item.$updatedAt);
    const insertAt = this.ids.findIndex(id => {
      const other = this.cache.get(id)!;
      return Date.parse(other.$updatedAt) < newTime;
    });

    if (insertAt === -1) {
      // either list is empty or this item is the oldest → push to end
      this.ids.push(item.$id);
    } else {
      // insert before the first item that’s older
      this.ids.splice(insertAt, 0, item.$id);
    }

    this.subscribers.forEach(s => s())
  }

  /**
   * Remove an item by ID from both cache and id list.
   */
  removeItem(id: string) {
    
    this.cache.delete(id);

    const idx = this.ids.indexOf(id);
    if (idx !== -1) {
      this.ids.splice(idx, 1);
    }
      
    this.cache.delete(id);
    this.ongoingFetches.delete(id); // Clean up associated states
    this.errors.delete(id);
    
    this.subscribers.forEach(s => s())
  }

    /**
     * Checks if a specific resource ID is currently being loaded.
     * @param id The resource ID.
     * @returns True if loading, false otherwise.
     */
    isLoading(id: string): boolean {
        return this.ongoingFetches.has(id);
    }


    /**
     * Gets the fetch error for a specific resource ID, if any.
     * @param id The resource ID.
     * @returns The Error object or undefined.
     */
    getError(id: string): Error | undefined {
        return this.errors.get(id);
    }

    /**
     * Loads a resource by its ID.
     * Fetches from the backend if not in cache or if forced.
     * Updates the reactive cache upon successful fetch.
     * @param id The resource ID.
     * @param forceRefresh Skip cache check and force fetch. Defaults to false.
     * @returns A promise resolving to the fetched resource data.
     */
    async loadById(id: string, forceRefresh = false): Promise<T> {
        if (!id) {
            throw new Error('Resource ID cannot be empty.');
        }

        // Return cached version if available and not forcing refresh
        const cachedItem = this.cache.get(id);
        if (cachedItem && !forceRefresh) {
            // console.log(`[Cache Hit] ${this.constructor.name}: ${id}`);
            return cachedItem;
        }

        // 2. Return ongoing fetch promise if available and not forcing refresh
        const ongoingFetch = this.ongoingFetches.get(id);
        if (ongoingFetch && !forceRefresh) {
            // console.log(`[Fetch Pending - Waiting] ${this.constructor.name}: ${id}`);
            return ongoingFetch; // Return the existing promise
        }

        // 3. Initiate a new fetch (first time, or forced refresh)
        // console.log(`[Fetching${forceRefresh ? ' - Force' : ''}] ${this.constructor.name}: ${id}`);

        // Create the promise *before* adding it to the map.
        // Use an async IIFE to capture the entire fetch-and-update logic.
        const fetchPromise = (async () => {
          this.errors.delete(id); // Clear previous errors for this ID

          try {
              const resource = await this._fetchOne(id);
              this.addOrUpdateItem(resource); // Update cache on success
              return resource;
          } catch (error) {
              console.error(`[Fetch Error] ${this.constructor.name} ${id}:`, error);
              this.errors.set(id, error instanceof Error ? error : new Error(String(error)));
              // this.errors = this.errors; // Ensure reactivity
              throw error; // Re-throw so the caller's promise rejects
          } finally {
              // Clean up regardless of success or failure
              this.ongoingFetches.delete(id); // Remove the promise from the map
          }
      })();

      // Store the promise so subsequent calls can await it
      this.ongoingFetches.set(id, fetchPromise);

      // Return the newly created promise
      return fetchPromise;
    }


    /**
     * Clears the entire cache for this resource type.
     */
    clear(): void {
        this.ids = []
        this.cache.clear();
        this.ongoingFetches.clear();
        this.errors.clear();
    }


    // --- Internal/Protected Methods ---



    /**
     * Abstract method to be implemented by subclasses for fetching a single resource.
     * @param id The resource ID.
     * @returns A promise resolving to the resource data.
     * @protected
     */
    protected async _fetchOne(id: string): Promise<T> {
        throw new Error(`[fetch ${id}]: _fetchOne not implemented in ${this.constructor.name}`);
    }
  async initialize() {
    throw new Error(`initialize() is not implemented in ${this.constructor.name}`);
    }
}