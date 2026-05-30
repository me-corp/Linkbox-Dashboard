import {
  writeBatch,
  collection,
  getDocs,
  doc,
  updateDoc,
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