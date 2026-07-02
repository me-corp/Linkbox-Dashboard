import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import {
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth'

import { db, secondaryAuth } from '@/firebase/config'

const COL = 'linkbox_team'

export async function fetchTeamMemberByEmail(email) {
  const q = query(collection(db, COL), where('email', '==', email))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...d.data() }
}

export async function fetchAllTeamMembers() {
  const snap = await getDocs(collection(db, COL))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

/**
 * Creates a Firebase Auth account via secondary app (no logout of current admin)
 * then writes the linkbox_team doc.
 * If the email already has a Firebase Auth account, skips account creation and
 * only writes the team doc.
 */
export async function addTeamMember({ email, password, role, permissions, addedBy }) {
  // Try to create Firebase Auth user without affecting admin session
  try {
    await createUserWithEmailAndPassword(secondaryAuth, email, password)
    await signOut(secondaryAuth)
  } catch (err) {
    if (err.code !== 'auth/email-already-in-use') throw err
    // Email already exists — just create the team doc below
  }

  const ref = doc(collection(db, COL))
  await setDoc(ref, {
    email,
    role,
    permissions: role === 'admin' ? [] : permissions,
    addedBy,
    addedAt: serverTimestamp(),
  })

  return ref.id
}

export async function updateTeamMember(id, { role, permissions }) {
  await updateDoc(doc(db, COL, id), {
    role,
    permissions: role === 'admin' ? [] : permissions,
    updatedAt: serverTimestamp(),
  })
}

export async function removeTeamMember(id) {
  await deleteDoc(doc(db, COL, id))
}
