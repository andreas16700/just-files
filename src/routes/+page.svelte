<script lang="ts">
    import { page } from '$app/state';
	import { databases, MAIN_DB_ID, PRIV_COLL_ID, PUBLIC_COLL_ID, RECORD_ID } from '$lib/appwrite';
	import { PublicDocStore } from '$lib/stores/SingleDocStore.svelte';
	import type { PrivateRecord } from '$lib/types';
    
    let store = $state(new PublicDocStore(PRIV_COLL_ID, RECORD_ID))

    $effect(()=>{
        console.log(page.url)
        for (const t of page.url.searchParams){
          console.log(t)
        }
        const uuid = page.url.searchParams.get("uuid")
        console.log(uuid)
        if (uuid != null) {
            console.log("requested to initiate authentication process for uuid " + uuid)
            authenticateUUID(uuid)
        }
    })
    let sentAuthReqForUUID = $state("")
    async function authenticateUUID(uuid: string){
        if (sentAuthReqForUUID === uuid){
            console.log("ignore uuid request.")
            return
        }
        sentAuthReqForUUID = uuid
        await databases.updateDocument(MAIN_DB_ID, PRIV_COLL_ID, RECORD_ID, {
                "uuid": uuid
        })
        await databases.updateDocument(MAIN_DB_ID, PUBLIC_COLL_ID, RECORD_ID, {
                "has_update": true
        })
        
    }
</script>

<h1>hi there</h1>
