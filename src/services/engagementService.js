/**
 * Engagement Service
 * Folder/notification engagement metrics built on aggregation queries
 * (sum/average/count) and bounded "top N" queries — costs stay flat
 * regardless of collection size.
 */

import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  sum,
  average,
} from "firebase/firestore";

import { db } from "@/firebase/config";
import { countWhere, aggregateQuery } from "@/services/firestoreHelpers";

/**
 * Total + average visit count across all (non-deleted) folders.
 * One getAggregateFromServer call (1 read).
 */
export async function getFolderEngagementAggregate() {
  const result = await aggregateQuery(
    "folders",
    { totalVisits: sum("visits"), avgVisits: average("visits") },
    [where("isDeleted", "==", false)],
    { totalVisits: 0, avgVisits: 0 }
  );

  return {
    totalVisits: result.totalVisits || 0,
    avgVisits: result.avgVisits || 0,
  };
}

/** Public vs. private folder counts (2 reads, equality filters only). */
export async function getFolderVisibilityCounts() {
  const [publicCount, privateCount] = await Promise.all([
    countWhere("folders", [where("isDeleted", "==", false), where("isPublic", "==", true)]),
    countWhere("folders", [where("isDeleted", "==", false), where("isPublic", "==", false)]),
  ]);

  return { public: publicCount, private: privateCount };
}

/** Count of folders marked as favourite (1 read). */
export async function getFavouriteFoldersCount() {
  return countWhere("folders", [where("isDeleted", "==", false), where("isFavourite", "==", true)]);
}

/**
 * Top N folders by visit count.
 * Requires composite index: folders (isDeleted ASC, visits DESC).
 */
export async function getTopFoldersByVisits(limitN = 10) {
  try {
    const snapshot = await getDocs(
      query(
        collection(db, "folders"),
        where("isDeleted", "==", false),
        orderBy("visits", "desc"),
        limit(limitN)
      )
    );

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.warn("[engagementService] getTopFoldersByVisits failed:", error.message);
    return [];
  }
}

/** Read vs. unread notification counts (2 reads, equality filters only). */
export async function getNotificationReadStats() {
  const [read, unread] = await Promise.all([
    countWhere("notifications", [where("read", "==", true)]),
    countWhere("notifications", [where("read", "==", false)]),
  ]);

  return { read, unread };
}
