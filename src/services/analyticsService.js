import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";

import { db } from '@/firebase/config'
import { countWhere } from './firestoreHelpers'

// get total folders count
export async function getTotalFolders() {
  const snapshot = await getCountFromServer(
    collection(db, "folders")
  );

  return snapshot.data().count;
}

// get total links count
export async function getTotalLinks() {
  const snapshot = await getCountFromServer(
    collection(db, "links")
  );

  return snapshot.data().count;
}

// get folder audience count 
export async function getFolderAudienceCount() {
  const snapshot = await getCountFromServer(
    query(
      collection(db, "folders_audience"),
    )
  );

  return snapshot.data().count;
}

// get folder insights count
export async function getFolderInsightsCount() {
  const snapshot = await getCountFromServer(
    collection(db, "folders_insights")
  );

  return snapshot.data().count;
}

// get link insights count
export async function getLinkInsightsCount() {
  const snapshot = await getCountFromServer(
    collection(db, "link_insights")
  );

  return snapshot.data().count;
}

// get device_info count
export async function getDeviceInfoCount() {
  const snapshot = await getCountFromServer(
    collection(db, "devices_info")
  );

  return snapshot.data().count;
}

// get notifications count
export async function getNotificationsCount() {
  const snapshot = await getCountFromServer(
    collection(db, "notifications")
  );

  return snapshot.data().count;
}

/**
 * iOS vs Android device split, derived from `devices_info.brand`
 * ("Apple" for iOS, anything else for Android). 1 sample read + 2 counts —
 * no composite index required. Returns empty `labels`/`counts` if the
 * collection is empty or doesn't have a recognizable `brand` field.
 */
export async function getDeviceBreakdown() {
  try {
    const sampleSnapshot = await getDocs(
      query(collection(db, "devices_info"), limit(1))
    );

    if (sampleSnapshot.empty) return { labels: [], counts: [] };

    const sample = sampleSnapshot.docs[0].data();
    if (typeof sample.brand !== "string") return { labels: [], counts: [] };

    const [total, ios] = await Promise.all([
      getDeviceInfoCount(),
      countWhere("devices_info", [where("brand", "==", "Apple")]),
    ]);

    if (!total) return { labels: [], counts: [] };

    const android = Math.max(0, total - ios);

    const labels = [];
    const counts = [];

    if (ios) {
      labels.push("iOS");
      counts.push(ios);
    }
    if (android) {
      labels.push("Android");
      counts.push(android);
    }

    return { labels, counts };
  } catch (error) {
    console.warn("[analyticsService] getDeviceBreakdown failed:", error.message);
    return { labels: [], counts: [] };
  }
}