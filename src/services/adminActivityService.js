import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
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

/**
 * Most recent admin activity log entries, newest first.
 */
export async function getRecentAdminActivity(limitN = 50) {
  const snapshot = await getDocs(
    query(collection(db, 'admin_activity_logs'), orderBy('createdAt', 'desc'), limit(limitN))
  )

  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
}