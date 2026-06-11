import {
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore'

import { db } from '@/firebase/config'
import { logAdminAction } from './adminActivityService'

/**
 * Reads the single app-wide configuration doc (`configurations/main`).
 * Returns `{}` if it doesn't exist yet (1 read).
 */
export async function getAppConfig() {
  const snapshot = await getDoc(doc(db, 'configurations', 'main'))
  return snapshot.exists() ? snapshot.data() : {}
}

/**
 * Merges `updates` into `configurations/main` and writes an audit log entry
 * recording the before/after value of each changed key.
 */
export async function updateAppConfig(updates, currentConfig, adminUser) {
  await setDoc(doc(db, 'configurations', 'main'), updates, { merge: true })

  const changes = {}
  Object.keys(updates).forEach(key => {
    changes[key] = {
      oldValue: currentConfig?.[key] ?? null,
      newValue: updates[key],
    }
  })

  await logAdminAction({
    action: 'update_config',
    entityType: 'configuration',
    entityId: 'main',
    entityName: 'App Configuration',
    performedBy: { email: adminUser?.email },
    changes,
    createdAt: new Date(),
  })
}
