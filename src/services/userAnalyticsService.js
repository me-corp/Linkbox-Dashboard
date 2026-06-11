import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  Timestamp,
} from "firebase/firestore";

import { db } from "@/firebase/config";
import {
  countWhere,
  getWeekBoundaries,
  formatWeekLabel,
} from "@/services/firestoreHelpers";

export async function getTotalUsers() {
  const snapshot = await getCountFromServer(
    collection(db, "users")
  );

  return snapshot.data().count;
}

export async function getUserBreakdown() {
  const guestsQuery = query(
    collection(db, "users"),
    where("isGuest", "==", true)
  );

  const registeredQuery = query(
    collection(db, "users"),
    where("isGuest", "==", false)
  );

  const [
    guestsSnapshot,
    registeredSnapshot,
  ] = await Promise.all([
    getCountFromServer(guestsQuery),
    getCountFromServer(registeredQuery),
  ]);

  return {
    guests: guestsSnapshot.data().count,
    registered:
      registeredSnapshot.data().count,
  };
}
export async function getMissingGuestFlagUsers() {
  const snapshot = await getDocs(
    collection(db, "users")
  );

  let missing = 0;

  snapshot.forEach(doc => {
    const user = doc.data();

    if (
      user.isGuest !== true &&
      user.isGuest !== false
    ) {
      missing++;
    }
  });

  return missing;
}

/**
 * Daily / weekly / monthly active users, based on `lastActivityAt`.
 * 3 single-field range counts — no composite index required.
 */
export async function getActiveUserCounts() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [dau, wau, mau] = await Promise.all([
    countWhere("users", [where("lastActivityAt", ">=", Timestamp.fromDate(todayStart))]),
    countWhere("users", [where("lastActivityAt", ">=", Timestamp.fromDate(sevenDaysAgo))]),
    countWhere("users", [where("lastActivityAt", ">=", Timestamp.fromDate(thirtyDaysAgo))]),
  ]);

  return { dau, wau, mau };
}

/** Count of users with an active Pro subscription. Single equality count (1 read). */
export async function getProUsersCount() {
  return countWhere("users", [where("isPro", "==", true)]);
}

/**
 * Users who haven't been active in 30 / 60 / 90 days.
 * 3 single-field range counts — no composite index required.
 */
export async function getDormantUserCounts() {
  const now = Date.now();

  const [inactive30, inactive60, inactive90] = await Promise.all([
    countWhere("users", [where("lastActivityAt", "<", Timestamp.fromDate(new Date(now - 30 * 24 * 60 * 60 * 1000)))]),
    countWhere("users", [where("lastActivityAt", "<", Timestamp.fromDate(new Date(now - 60 * 24 * 60 * 60 * 1000)))]),
    countWhere("users", [where("lastActivityAt", "<", Timestamp.fromDate(new Date(now - 90 * 24 * 60 * 60 * 1000)))]),
  ]);

  return { inactive30, inactive60, inactive90 };
}

/**
 * Cumulative + new-user signup series for the last `weeks` weeks.
 * `weeks + 1` cumulative counts (single-field range on `createdAt`, no
 * composite index required) — new-per-week is derived by diffing.
 */
export async function getUserGrowthSeries(weeks = 8) {
  const boundaries = getWeekBoundaries(weeks);

  const cumulative = await Promise.all(
    boundaries.map(boundary =>
      countWhere("users", [where("createdAt", "<", Timestamp.fromDate(boundary))])
    )
  );

  const newUsers = [];
  for (let i = 0; i < weeks; i++) {
    newUsers.push(Math.max(0, cumulative[i + 1] - cumulative[i]));
  }

  return {
    labels: boundaries.slice(1).map(formatWeekLabel),
    cumulative: cumulative.slice(1),
    newUsers,
  };
}

/**
 * Weekly signup cohorts vs. the subset still active in the last 30 days.
 * `activeUsers[i]` is `null` if the `users: createdAt + lastActivityAt`
 * composite index hasn't been created yet (see Firestore index list).
 */
export async function getRetentionCohorts(weeks = 8) {
  const boundaries = getWeekBoundaries(weeks);
  const activeCutoff = Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

  const results = await Promise.all(
    Array.from({ length: weeks }, (_, i) => {
      const start = Timestamp.fromDate(boundaries[i]);
      const end = Timestamp.fromDate(boundaries[i + 1]);

      return Promise.all([
        countWhere("users", [where("createdAt", ">=", start), where("createdAt", "<", end)]),
        countWhere(
          "users",
          [
            where("createdAt", ">=", start),
            where("createdAt", "<", end),
            where("lastActivityAt", ">=", activeCutoff),
          ],
          null
        ),
      ]);
    })
  );

  return {
    labels: boundaries.slice(1).map(formatWeekLabel),
    newUsers: results.map(([total]) => total),
    activeUsers: results.map(([, active]) => active),
  };
}

/**
 * Tally of exit-survey reasons (`surveys.reasons`), most common first.
 * Single-field `orderBy(timestamp).limit(limitN)` — no composite index
 * required. Returns empty arrays if the collection is empty/unavailable.
 */
export async function getChurnReasons(limitN = 200) {
  try {
    const snapshot = await getDocs(
      query(collection(db, "surveys"), orderBy("timestamp", "desc"), limit(limitN))
    );

    const counts = new Map();

    snapshot.forEach(doc => {
      const reasons = doc.data().reasons;
      if (!Array.isArray(reasons)) return;

      reasons.forEach(reason => {
        counts.set(reason, (counts.get(reason) || 0) + 1);
      });
    });

    const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);

    return {
      labels: sorted.map(([reason]) => reason),
      counts: sorted.map(([, count]) => count),
    };
  } catch (error) {
    console.warn("[userAnalyticsService] getChurnReasons failed:", error.message);
    return { labels: [], counts: [] };
  }
}