// src/lib/appwrite.ts
import { Client, Databases, Storage, Account, AppwriteException } from 'appwrite';
import type { Models } from 'appwrite';

export const client = new Client();

client
    .setEndpoint('https://aw2.aloiz.ch/v1')
    .setProject('justfiles');

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const MAIN_DB_ID = "main"

export const PUBLIC_COLL_ID = "public"
export const PRIV_COLL_ID = "private"

export const RECORD_ID = "main"

export async function triggerSecretGen(uuid: string) {
  await databases.updateDocument(MAIN_DB_ID, PRIV_COLL_ID, RECORD_ID, {
    "uuid": uuid
  })
  
  await databases.updateDocument(MAIN_DB_ID, PUBLIC_COLL_ID, RECORD_ID, {
    "has_update": true
  })
}


/**
 * Safely calls account.createJWT(), logging meaningful messages for success and errors.
 */
export async function createUserJWT(): Promise<string> {
    try {
      // Attempt to create the JWT
      const jwt: Models.Jwt = await account.createJWT();
  
      // Success: print JWT and its expiry
      console.log('✅ JWT created successfully');
        console.log(`Token: ${jwt.jwt}`);
        return jwt.jwt;
    } catch (error: unknown) {
      // Handle Appwrite-specific errors
      if (error instanceof AppwriteException) {
        console.error(`❌ AppwriteException [Code ${error.code}]: ${error.message}`);
        if (error.response) {
          console.error('Response:', error.response);
        }
      } else {
        // Handle unexpected errors
        console.error('❌ Unexpected error creating JWT:', error);
      }
      throw error
    }

}

