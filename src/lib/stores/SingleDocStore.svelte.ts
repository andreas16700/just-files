import { client, databases, MAIN_DB_ID } from "$lib/appwrite";

import type { Models, RealtimeResponseEvent } from 'appwrite';

import type { PublicRecord, PrivateRecord } from "$lib/types";

// export class RecordStore<T extends Models.Document>{
    
//     realtimeChannel: string = ""

    
// }



export class PublicDocStore{
    doc: PublicRecord | null = $state(null)
    DB_ID: string
    COLL_ID: string
    DOC_ID: string

    realtimeChannel = ""
    
    constructor(col_id: string, doc_id: string) {
        this.DB_ID = MAIN_DB_ID
        this.COLL_ID = col_id
        this.DOC_ID = doc_id

        this.realtimeChannel = `databases.${MAIN_DB_ID}.collections.${col_id}.documents.${doc_id}`;
        console.log('will init')
        console.log(this.realtimeChannel)
        this.initialize()
    }
    async initialize() {
        console.log('fetching initial doc..')
        this.doc = await databases.getDocument(MAIN_DB_ID, this.COLL_ID, this.DOC_ID) as PublicRecord
        if (this.unsubscribeFunc != null){
            console.log("unsubbing..")
            this.unsubscribeFunc()
        }
        const c = "documents"
        console.log('subscribing to '+c)
        this.unsubscribeFunc = client.subscribe(c, this.handleResponseEvent.bind(this))
    }
    async clear() {
        this.doc = null
        if (this.unsubscribeFunc != null) {
            console.log("unsubbing..")
            this.unsubscribeFunc()
        }
    }

    handleResponseEvent(response: RealtimeResponseEvent<PublicRecord>) {
        console.log("trying to match with my channel: "+this.realtimeChannel)
        const matchedEvent = response.events.find(evt =>
            evt.startsWith(this.realtimeChannel)
        )
        if (!matchedEvent) {
            console.log("nope! events: "+response.events);
            // nobody cares about this event
            return
        }
        console.log("Yes. Matched event "+matchedEvent);
          
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
            const testsmth = response.payload
            this.doc = testsmth
        } else if (isDelete) {
            console.log("this is a delete event");
            if (response.payload && response.payload.$id) {
                console.warn("Unexpected! main record was deleted!")
                this.doc = null
            } else {
                console.warn("Received delete event without a valid payload ID!!!!\t", response);
            }
        } else {
            console.log("i don't know what tyoe of event "+matchedEvent+" is! All its events: "+response.events);
        }
    }

    unsubscribeFunc: (() => void) | null = $state(null)

}