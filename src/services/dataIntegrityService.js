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

export async function getFoldersAudience() {
  const snapshot = await getDocs(
    collection(db, 'folders_audience')
  )

  return snapshot.docs.map(docSnap => {
    const data = docSnap.data()

    return {
      ...data,
      id: docSnap.id,
    }
  })
}

export async function updateFolderAudienceFields(docId, updates) {
  await updateDoc(
    doc(db, 'folders_audience', docId),
    updates
  )
}

export async function bulkUpdateFoldersAudience(updates) {
  for (const batchItems of chunk(updates, 500)) {
    const batch = writeBatch(db)

    batchItems.forEach(({ id, fields }) => {
      batch.update(doc(db, 'folders_audience', id), fields)
    })

    await batch.commit()
  }
}

function compareSemver(a, b) {
  const pa = (a || '0').split('.').map(Number)
  const pb = (b || '0').split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0)
    if (diff !== 0) return diff
  }
  return 0
}

/**
 * Returns a map of userId → highest appVersion string seen across all of
 * that user's devices_info documents. Users with no device record are omitted.
 */
export async function getUserMaxVersions() {
  const snapshot = await getDocs(
    collection(db, 'devices_info')
  )

  const maxVersions = {}

  snapshot.forEach(docSnap => {
    const { userId, appVersion } = docSnap.data()
    if (!userId || !appVersion) return

    if (
      !maxVersions[userId] ||
      compareSemver(appVersion, maxVersions[userId]) > 0
    ) {
      maxVersions[userId] = appVersion
    }
  })

  return maxVersions
}

/**
 * Reads all links, folders, and folders_audience documents and tallies
 * per-user counts. Returns a map of userId → { linksCount, foldersCount,
 * addedFoldersCount } based on actual document counts rather than the
 * trigger-maintained counters (which can drift for users created before
 * the triggers were deployed).
 */
export async function calculateUserCounts() {
  const [linksSnap, foldersSnap, audienceSnap] = await Promise.all([
    getDocs(collection(db, 'links')),
    getDocs(collection(db, 'folders')),
    getDocs(collection(db, 'folders_audience')),
  ])

  const linkCounts = {}
  linksSnap.forEach(docSnap => {
    const { userId, isDeleted, IsDeleted } = docSnap.data()
    if (userId && isDeleted !== true && IsDeleted !== true) {
      linkCounts[userId] = (linkCounts[userId] || 0) + 1
    }
  })

  const folderCounts = {}
  foldersSnap.forEach(docSnap => {
    const { userId, isDeleted } = docSnap.data()
    if (userId && isDeleted !== true) {
      folderCounts[userId] = (folderCounts[userId] || 0) + 1
    }
  })

  // role: 1 = owner (created by createFolderAudienceMapping convention)
  // any other role = added / shared into a folder they don't own
  const addedFolderCounts = {}
  audienceSnap.forEach(docSnap => {
    const { userId, role, isDeleted } = docSnap.data()
    if (userId && role !== 1 && isDeleted !== true) {
      addedFolderCounts[userId] = (addedFolderCounts[userId] || 0) + 1
    }
  })

  return { linkCounts, folderCounts, addedFolderCounts }
}

export async function applyUserCounts(userIds, linkCounts, folderCounts, addedFolderCounts) {
  let processed = 0

  for (const batchIds of chunk(userIds, 500)) {
    const batch = writeBatch(db)

    batchIds.forEach(userId => {
      batch.update(doc(db, 'users', userId), {
        linksCount: linkCounts[userId] || 0,
        foldersCount: folderCounts[userId] || 0,
        addedFoldersCount: addedFolderCounts[userId] || 0,
        insightsUpdatedAt: serverTimestamp(),
      })
    })

    await batch.commit()
    processed += batchIds.length
  }

  return processed
}