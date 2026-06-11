import {
  collection,
  getDocs,
  updateDoc,
  doc,
  setDoc,
  serverTimestamp,
  writeBatch,
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

export async function getFolders() {
  const snapshot = await getDocs(
    collection(db, 'folders')
  )

  return snapshot.docs.map(docSnap => {
    const data = docSnap.data()

    return {
      ...data,
      id: docSnap.id,
      storedId: data.id ?? null,
    }
  })
}

export async function getLinks() {
  const snapshot = await getDocs(
    collection(db, 'links')
  )

  return snapshot.docs.map(docSnap => {
    const data = docSnap.data()

    return {
      ...data,
      id: docSnap.id,
      storedId: data.id ?? null,
    }
  })
}

/**
 * Folder ids that have a live (non-deleted) folders_audience mapping.
 * The mobile app fetches folders_audience by userId first, then loads
 * folders by the ids found there - a folder without a mapping here is
 * unreachable from the app.
 */
export async function getAudienceFolderIds() {
  const snapshot = await getDocs(
    collection(db, 'folders_audience')
  )

  const folderIds = new Set()

  snapshot.forEach(docSnap => {
    const data = docSnap.data()

    if (data.isDeleted !== true && data.folderId) {
      folderIds.add(data.folderId)
    }
  })

  return folderIds
}

export async function updateFolderFields(folderId, updates) {
  await updateDoc(
    doc(db, 'folders', folderId),
    updates
  )
}

export async function updateLinkFields(linkId, updates) {
  await updateDoc(
    doc(db, 'links', linkId),
    updates
  )
}

/**
 * Recreates the missing folders_audience mapping for the folder's owner,
 * using the same id convention (`{folderId}_{userId}`) and default
 * owner role seen on existing mappings.
 */
export async function createFolderAudienceMapping(folder) {
  const audienceId = `${folder.id}_${folder.userId}`

  await setDoc(
    doc(db, 'folders_audience', audienceId),
    {
      userId: folder.userId,
      folderId: folder.id,
      role: 1,
      isFavourite: false,
      isHidden: false,
      isDeleted: false,
      createdAt: serverTimestamp(),
    }
  )
}

function chunk(items, size) {
  const chunks = []

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }

  return chunks
}

export async function bulkUpdateFolders(updates) {
  for (const batchItems of chunk(updates, 500)) {
    const batch = writeBatch(db)

    batchItems.forEach(({ id, fields }) => {
      batch.update(doc(db, 'folders', id), fields)
    })

    await batch.commit()
  }
}

export async function bulkUpdateLinks(updates) {
  for (const batchItems of chunk(updates, 500)) {
    const batch = writeBatch(db)

    batchItems.forEach(({ id, fields }) => {
      batch.update(doc(db, 'links', id), fields)
    })

    await batch.commit()
  }
}