import {
  collection,
  getCountFromServer,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from '@/firebase/config'

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