import {
  collection,
  getDocs,
  updateDoc,
  doc,
} from 'firebase/firestore'

import { db } from '@/firebase/config'

export async function getUsersMissingGuestFlag() {
  const snapshot = await getDocs(
    collection(db, 'users')
  )

  const users = []

  snapshot.forEach(doc => {
    const data = doc.data()

    if (
      data.isGuest !== true &&
      data.isGuest !== false
    ) {
      users.push({
        id: doc.id,
        ...data,
      })
    }
  })

  return users
}


export async function updateUserGuestFlag(
  userId,
  isGuest
) {
  await updateDoc(
    doc(db, 'users', userId),
    {
      isGuest,
    }
  )
}