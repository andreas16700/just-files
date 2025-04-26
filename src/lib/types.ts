import type { Models } from 'appwrite';


export interface StringFileExtra {
  text: string
}
export type StringFile = Models.File & StringFileExtra

export interface HasUpdatedAt{
  $updatedAt: string;
  $id: string;
}

interface PublicRecordExtras{
  has_update: boolean
}

export type PublicRecord = Models.Document & PublicRecordExtras

interface PrivateRecordExtras{
  uuid: string
  user_id: string
}

export type PrivateRecord = Models.Document & PrivateRecordExtras