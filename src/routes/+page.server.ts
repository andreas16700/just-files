import { AW_KEY } from "$env/static/private"

import { Client, Databases, Users} from "node-appwrite";
import type { PageServerLoad } from './$types';
// import { Secret } from "$lib/types";

 import { MAIN_DB_ID, PUBLIC_COLL_ID, PRIV_COLL_ID, RECORD_ID } from "$lib/appwrite";
import type { PrivateRecord } from "$lib/types";

const client = new Client();

client
    .setEndpoint('https://aw2.aloiz.ch/v1')
    .setProject('justfiles')
    .setKey(AW_KEY)


const databases = new Databases(client);
const users = new Users(client)

export const load: PageServerLoad = async ({ url }) => {
    console.log(url)
    console.log("q params: ")
    console.log(url.searchParams)
    
    const p = url.searchParams
    const requested_uuid = p.get("req_secret_with_uuid")
    console.log(requested_uuid)
    if (requested_uuid != null) {
        const actual_uuid_record = await databases.getDocument(MAIN_DB_ID, PRIV_COLL_ID, RECORD_ID) as PrivateRecord
        if (actual_uuid_record.uuid === requested_uuid) {
            // approve the request!
            console.log("UUID MATCHED.")
            await databases.updateDocument(MAIN_DB_ID, PUBLIC_COLL_ID, RECORD_ID, {
                "has_update": false
            })
            const user_id = actual_uuid_record.user_id
            const secret = await users.createToken(user_id)
            // make sure no one else can use this uuid!
            await databases.updateDocument(MAIN_DB_ID, PRIV_COLL_ID, RECORD_ID, {
                "uuid": ""
            })
            return {
                "secret": secret
            }
        } else {
            console.log(`UUID DID NOT MATCH: ${requested_uuid} !== ${actual_uuid_record.uuid}`)
            // bad request
        }
    }
}