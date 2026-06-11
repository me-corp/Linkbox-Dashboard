import {
  writeBatch,
  collection,
  documentId,
  getDocs,
  doc,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'

import { db } from '@/firebase/config'
import {
  logAdminAction,
} from './adminActivityService'

export async function getUsers() {
  const snapshot = await getDocs(
    collection(db, 'users')
  )

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }))
}

/**
 * Batch-fetches users by document id (chunks of 10 — Firestore `in` query
 * limit). Returns a `{ [userId]: user }` map, omitting ids that don't exist.
 */
export async function getUsersByIds(ids) {
  const uniqueIds = [...new Set(ids)].filter(Boolean)
  if (!uniqueIds.length) return {}

  const chunks = []
  for (let i = 0; i < uniqueIds.length; i += 10) {
    chunks.push(uniqueIds.slice(i, i + 10))
  }

  const snapshots = await Promise.all(
    chunks.map(chunk =>
      getDocs(query(collection(db, 'users'), where(documentId(), 'in', chunk)))
    )
  )

  const usersById = {}
  snapshots.forEach(snapshot => {
    snapshot.forEach(docSnap => {
      usersById[docSnap.id] = { id: docSnap.id, ...docSnap.data() }
    })
  })

  return usersById
}

export async function updateUserWithAudit(
  user,
  updates,
  adminUser
) {
  await updateDoc(
    doc(db, 'users', user.id),
    updates
  )

  const changes = {}

  Object.keys(updates)
    .forEach(key => {
      changes[key] = {
        oldValue: user[key] ?? null,
        newValue: updates[key],
      }
    })

  await logAdminAction({
    action: 'update_user',

    entityType: 'user',

    entityId: user.id,

    entityName:
      user.name ||
      user.username ||
      user.id,

    performedBy: {
      email:
        adminUser.email,
    },

    changes,

    createdAt:
      new Date(),
  })
}

export async function bulkApplySuggestedFixes(
  selectedItems
) {
  const batch = writeBatch(db)

  selectedItems.forEach(item => {
    batch.update(
      doc(
        db,
        'users',
        item.user.id
      ),
      item.suggestedFix
    )
  })

  await batch.commit()
}