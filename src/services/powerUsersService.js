/**
 * Power Users Service
 * Bounded "top N" queries + per-user enrichment counts. Total cost is
 * capped at roughly limitN * 2 reads regardless of overall data volume.
 */

import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";

import { db } from "@/firebase/config";
import { countWhere } from "@/services/firestoreHelpers";
import { getUserLinksCount } from "@/services/linksService";

/**
 * Most recently active registered (non-guest) users.
 * Requires composite index: users (isGuest ASC, lastActivityAt DESC).
 */
export async function getMostActiveUsers(limitN = 10) {
  try {
    const snapshot = await getDocs(
      query(
        collection(db, "users"),
        where("isGuest", "==", false),
        orderBy("lastActivityAt", "desc"),
        limit(limitN)
      )
    );

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.warn("[powerUsersService] getMostActiveUsers failed:", error.message);
    return [];
  }
}

/**
 * Most recently active Pro users.
 * Requires composite index: users (isPro ASC, lastActivityAt DESC).
 */
export async function getTopProUsers(limitN = 10) {
  try {
    const snapshot = await getDocs(
      query(
        collection(db, "users"),
        where("isPro", "==", true),
        orderBy("lastActivityAt", "desc"),
        limit(limitN)
      )
    );

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.warn("[powerUsersService] getTopProUsers failed:", error.message);
    return [];
  }
}

/** Count of non-deleted folders owned by a user (1 read, equality filters only). */
export async function getUserFoldersCount(userId) {
  return countWhere("folders", [where("userId", "==", userId), where("isDeleted", "==", false)]);
}

/**
 * Attaches `linksCount` and `foldersCount` to each user.
 * Bounded: 2 reads per user (use only on already-limited "top N" lists).
 */
export async function enrichUsersWithCounts(users) {
  return Promise.all(
    users.map(async user => {
      const [linksCount, foldersCount] = await Promise.all([
        getUserLinksCount(user.id),
        getUserFoldersCount(user.id),
      ]);

      return { ...user, linksCount, foldersCount };
    })
  );
}
