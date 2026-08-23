import {
  collection,
  getDocs,
  limit as fsLimit,
  orderBy,
  query,
  where,
} from 'firebase/firestore'

import { db } from '@/firebase/config'
import { countWhere } from '@/services/firestoreHelpers'

const COLLECTION = 'login_screen_events'

/**
 * Counts of each login-screen top-of-funnel event (4 count-aggregation
 * reads). See lib/features/auth/services/login_screen_analytics.dart in the
 * Flutter app for where these get written.
 */
export async function getLoginScreenCounts() {
  const [opened, guestCardOpened, continuedAsGuest, loggedInDirectly] = await Promise.all([
    countWhere(COLLECTION, [where('type', '==', 'opened')]),
    countWhere(COLLECTION, [where('type', '==', 'guest_card_opened')]),
    countWhere(COLLECTION, [where('type', '==', 'continued_as_guest')]),
    countWhere(COLLECTION, [where('type', '==', 'logged_in_directly')]),
  ])

  return { opened, guestCardOpened, continuedAsGuest, loggedInDirectly }
}

/** Most recent funnel events, newest first (1 read per document returned). */
export async function getRecentLoginScreenEvents(limitN = 50) {
  try {
    const snapshot = await getDocs(
      query(collection(db, COLLECTION), orderBy('createdAt', 'desc'), fsLimit(limitN)),
    )

    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (error) {
    console.warn('[loginScreenInsightsService] getRecentLoginScreenEvents failed:', error.message)
    return []
  }
}
