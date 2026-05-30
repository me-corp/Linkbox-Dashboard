import {
  collection,
  getCountFromServer,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/firebase/config";

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