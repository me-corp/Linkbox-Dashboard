import {
  average,
  collection,
  getDocs,
  limit as fsLimit,
  orderBy,
  query,
  where,
} from 'firebase/firestore'

import { db } from '@/firebase/config'
import { countWhere, aggregateQuery } from '@/services/firestoreHelpers'

const COLLECTION = 'guest_conversion_events'

/**
 * Counts of each guest-conversion-prompt funnel event (4 count-aggregation
 * reads). See lib/features/auth/ui/widgets/guest_conversion_prompt.dart in
 * the Flutter app for where these get written.
 */
export async function getGuestConversionCounts() {
  const [shown, dismissed, converted, backedOut] = await Promise.all([
    countWhere(COLLECTION, [where('type', '==', 'shown')]),
    countWhere(COLLECTION, [where('type', '==', 'dismissed')]),
    countWhere(COLLECTION, [where('type', '==', 'converted')]),
    countWhere(COLLECTION, [where('type', '==', 'backed_out')]),
  ])

  return { shown, dismissed, converted, backedOut }
}

/** Average time-to-outcome (ms since the prompt was shown) for the two terminal outcomes. */
export async function getGuestConversionTiming() {
  const [convertedAvg, backedOutAvg] = await Promise.all([
    aggregateQuery(
      COLLECTION,
      { avgMsSinceShown: average('msSinceShown') },
      [where('type', '==', 'converted')],
    ),
    aggregateQuery(
      COLLECTION,
      { avgMsSinceShown: average('msSinceShown') },
      [where('type', '==', 'backed_out')],
    ),
  ])

  return {
    convertedAvgMs: convertedAvg.avgMsSinceShown || 0,
    backedOutAvgMs: backedOutAvg.avgMsSinceShown || 0,
  }
}

/** Most recent funnel events, newest first (1 read per document returned). */
export async function getRecentGuestConversionEvents(limitN = 50) {
  try {
    const snapshot = await getDocs(
      query(collection(db, COLLECTION), orderBy('createdAt', 'desc'), fsLimit(limitN)),
    )

    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (error) {
    console.warn('[guestConversionService] getRecentGuestConversionEvents failed:', error.message)
    return []
  }
}
