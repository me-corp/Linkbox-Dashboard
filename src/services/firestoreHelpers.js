/**
 * Shared Firestore helpers focused on keeping read counts low.
 *
 * - `countWhere` / `aggregateQuery` use Firestore's server-side aggregation
 *   (`getCountFromServer` / `getAggregateFromServer`), which are billed at
 *   roughly 1 read per 1,000 matched documents (minimum 1) instead of 1 read
 *   per document returned.
 * - All helpers fail "soft": if a query needs a composite index that hasn't
 *   been created yet, we log a warning (with Firestore's console link to
 *   create it) and return a fallback value instead of throwing, so a single
 *   missing index doesn't break an entire insights page.
 */

import {
  collection,
  query,
  getCountFromServer,
  getAggregateFromServer,
} from 'firebase/firestore'

import { db } from '@/firebase/config'

function buildQuery(collectionName, constraints) {
  const ref = collection(db, collectionName)
  return constraints.length ? query(ref, ...constraints) : ref
}

/**
 * Returns the count of documents matching the given constraints.
 * Falls back to `fallback` (default 0) if the query fails (e.g. missing index).
 */
export async function countWhere(collectionName, constraints = [], fallback = 0) {
  try {
    const snapshot = await getCountFromServer(buildQuery(collectionName, constraints))
    return snapshot.data().count
  } catch (error) {
    console.warn(`[firestoreHelpers] countWhere(${collectionName}) failed:`, error.message)
    return fallback
  }
}

/**
 * Runs a sum/average/count aggregation in a single read.
 * `aggregateSpec` is the object passed to getAggregateFromServer (use sum()/average()/count()).
 * Falls back to `fallback` (default {}) if the query fails.
 */
export async function aggregateQuery(collectionName, aggregateSpec, constraints = [], fallback = {}) {
  try {
    const snapshot = await getAggregateFromServer(
      buildQuery(collectionName, constraints),
      aggregateSpec
    )
    return snapshot.data()
  } catch (error) {
    console.warn(`[firestoreHelpers] aggregateQuery(${collectionName}) failed:`, error.message)
    return fallback
  }
}

/**
 * Returns `weeks + 1` Date boundaries from oldest to now, e.g. for weeks=8:
 * [now-8w, now-7w, ..., now-1w, now]. Bucket i covers [boundaries[i], boundaries[i+1]).
 */
export function getWeekBoundaries(weeks) {
  const now = new Date()
  const boundaries = []

  for (let i = weeks; i >= 0; i--) {
    boundaries.push(new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000))
  }

  return boundaries
}

/** Short label for chart axes, e.g. "Jun 2" */
export function formatWeekLabel(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
