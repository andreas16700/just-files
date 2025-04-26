import { client, account } from "../appwrite";
import { DocumentStore } from "$lib/stores/DocumentStore.svelte";
import { FileStore } from "$lib/stores/FileStore.svelte";
// import { FileStore } from "./FileStore.svelte";
import type { Models, RealtimeResponseEvent } from 'appwrite';
import type { HasUpdatedAt } from '$lib/types';
import type { ResourceStore } from "$lib/stores/ResourceStore.svelte";

export const userContainer: {
    user: Models.User<Models.Preferences> | null
    selectedPane: string | null
} = $state({
    user: null,
    selectedPane: null,
})


export const fileStore = $state(new FileStore("files"))
// export const docStore = $state(new DocumentStore<Secret>("stuff"))

const allStores: ResourceStore<HasUpdatedAt>[] = [fileStore]

function isDocumentStore<T extends Models.Document>(
    store: ResourceStore<HasUpdatedAt>
  ): store is DocumentStore<T> {
    return store instanceof DocumentStore;
}
  
const docStores = allStores.filter(isDocumentStore);

export function select(pane: string | null) {
    userContainer.selectedPane = pane
}

export async function isUserSignedIn() {
    try {
        userContainer.user = await account.get()
    } catch {
        userContainer.user = null
    }
    return userContainer.user != null
}


export async function recreateStores() {
    // must be signed in!
    account.get()


    for (const ds of docStores) {
        ds.fetchNext()
    }
    console.log("was told to recreate stores..")
    
}
async function clearStores() {
    allStores.forEach(s=>{s.clear()})
    // calcUpdatesStore?.clear()
}
async function initStores() {
    await recreateStores()
}

// --- Realtime Subscription Logic ---

// ...(keep handleResponseEvent and subscribeToUpdates functions as they are)...
/**
 * Handles incoming Appwrite real-time events for the collection.
 * @param {import("appwrite").RealtimeResponseEvent<ModelUpdate>} response - The document data associated with the event.
 */
function handleResponseEvent<T extends HasUpdatedAt>(response: RealtimeResponseEvent<T>){
    console.log("Appwrite Realtime Event");
    console.log("can I match it to a store?");
    const matchedEvent = response.events.find(evt =>
        allStores.some(store => evt.startsWith(store.realtimeChannel + '.'))
    )
    
    if (!matchedEvent) {
        console.log("nope! events: "+response.events);
        // nobody cares about this event
        return
    }
    console.log("Yes. Matched event "+matchedEvent);
      // pull out the store whose channel was matched
      const store = allStores.find(s =>
        matchedEvent.startsWith(s!.realtimeChannel + '.')
      )!
      console.log("now, what kind of event is this?");
    // event.startsWith(realtimeChannel) && 
    const isCreateOrUpdate = response.events.some(event =>
        event.endsWith('.create') || event.endsWith('.update')
    );
    const isDelete = response.events.some(event =>
         event.endsWith('.delete')
    );

    if (isCreateOrUpdate) {
        console.log("this is a create/update event");
        store.addOrUpdateItem(response.payload)
    } else if (isDelete) {
        console.log("this is a delete event");
        if (response.payload && response.payload.$id) {
            store.removeItem(response.payload.$id)
        } else {
            console.warn("Received delete event without a valid payload ID!!!!\t", response);
        }
    } else {
        console.log("i don't know what tyoe of event "+matchedEvent+" is! All its events: "+response.events);
    }
}
let unsubscribeFunc: (() => void) | null = null

async function userSignedInTrigger() {
    console.log('initializing stores..')
    await initStores()
    console.log('subscribing..')
    unsubscribeFunc = client.subscribe(["files", "documents"], handleResponseEvent)
    
}
async function userSignedOutTrigger() {
    userContainer.user = null;
    if (unsubscribeFunc != null) {
        unsubscribeFunc()
        unsubscribeFunc = null
    }
    clearStores();
}
export async function appEntrypoint() {
    console.log("is user in?")
    if (await isUserSignedIn()) {
        console.log("yes")
        await userSignedInTrigger()
    } else {
        console.log("no")
        await userSignedOutTrigger()
    }
    
}
export async function signInWithRecord(userId: string, secret: string) {
    await account.createSession(userId, secret)
}
export async function loginWithToken(token: Models.Token) {
    try {
        await account.createSession(token.userId, token.secret)
        userContainer.user = await account.get()
        await userSignedInTrigger()
    } catch (error) {
        console.error(error);
    }
}
export async function login(email:string, password: string) {
    try {
        await account.createEmailPasswordSession(email, password)
        userContainer.user = await account.get()
        await userSignedInTrigger()
    } catch (error) {
        console.error(error);
    }
}
export async function logout() {
    await account.deleteSession('current')
    await userSignedOutTrigger()
}