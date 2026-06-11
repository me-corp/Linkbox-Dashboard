import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'

import { db } from '@/firebase/config'
import { countWhere } from './firestoreHelpers'
import { logAdminAction } from './adminActivityService'

function mapDocs(snapshot) {
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
}

/**
 * Most recent creator program applications, newest first.
 */
export async function getCreatorApplications(limitN = 100) {
  const snapshot = await getDocs(
    query(collection(db, 'creator_applications'), orderBy('submittedAt', 'desc'), limit(limitN))
  )
  return mapDocs(snapshot)
}

/**
 * Updates a creator application's status and writes an audit log entry.
 */
export async function updateCreatorApplicationStatus(application, status, adminUser) {
  await updateDoc(doc(db, 'creator_applications', application.id), {
    status,
    reviewedAt: serverTimestamp(),
  })

  await logAdminAction({
    action: 'update_creator_application',
    entityType: 'creator_application',
    entityId: application.id,
    entityName: application.creatorName || application.fullName || application.email,
    changes: {
      status: { oldValue: application.status ?? null, newValue: status },
    },
    performedBy: { email: adminUser?.email },
    createdAt: new Date(),
  })
}

/**
 * Total + most recent PingMe waitlist signups.
 */
export async function getPingMeWaitlist(limitN = 50) {
  const [count, recentSnapshot] = await Promise.all([
    countWhere('pingmewaitlist'),
    getDocs(query(collection(db, 'pingmewaitlist'), orderBy('createdAt', 'desc'), limit(limitN))),
  ])

  return { count, recent: mapDocs(recentSnapshot) }
}

/**
 * Total + most recent newsletter subscriptions.
 */
export async function getNewsletterSubscriptions(limitN = 50) {
  const [count, recentSnapshot] = await Promise.all([
    countWhere('newsletter_subscriptions'),
    getDocs(query(collection(db, 'newsletter_subscriptions'), orderBy('subscribedAt', 'desc'), limit(limitN))),
  ])

  return { count, recent: mapDocs(recentSnapshot) }
}

/**
 * Most recent in-app feedback submissions, newest first.
 */
export async function getFeedback(limitN = 50) {
  const snapshot = await getDocs(
    query(collection(db, 'Feedback'), orderBy('time', 'desc'), limit(limitN))
  )
  return mapDocs(snapshot)
}

/**
 * Most recent in-app help requests, newest first.
 */
export async function getHelpRequests(limitN = 50) {
  const snapshot = await getDocs(
    query(collection(db, 'Help'), orderBy('time', 'desc'), limit(limitN))
  )
  return mapDocs(snapshot)
}
