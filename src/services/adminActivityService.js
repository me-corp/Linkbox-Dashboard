import {
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore'

import { db } from '@/firebase/config'

export async function logAdminAction(
  payload
) {
  await addDoc(
    collection(
      db,
      'admin_activity_logs'
    ),
    {
      ...payload,
      createdAt:
        serverTimestamp(),
    }
  )
}