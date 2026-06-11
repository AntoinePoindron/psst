import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from './firebase'
import { generateGroupCode } from './utils'

/* ---------- Groupes ---------- */

export async function createGroup(name, profile) {
  const code = generateGroupCode()
  const groupRef = await addDoc(collection(db, 'groups'), {
    name: name.trim(),
    code,
    createdBy: profile.id,
    createdAt: serverTimestamp(),
  })
  await joinGroup(groupRef.id, profile)
  return { id: groupRef.id, code }
}

export async function findGroupByCode(code) {
  const q = query(collection(db, 'groups'), where('code', '==', code))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...d.data() }
}

export async function getGroup(groupId) {
  const snap = await getDoc(doc(db, 'groups', groupId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export async function joinGroup(groupId, profile) {
  await setDoc(doc(db, 'groups', groupId, 'members', profile.id), {
    pseudo: profile.pseudo,
    joinedAt: serverTimestamp(),
  })
}

export async function updateMemberPseudo(groupId, profile) {
  await setDoc(
    doc(db, 'groups', groupId, 'members', profile.id),
    { pseudo: profile.pseudo },
    { merge: true }
  )
}

export function listenGroup(groupId, callback) {
  return onSnapshot(doc(db, 'groups', groupId), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null)
  })
}

export function listenMembers(groupId, callback) {
  const q = query(collection(db, 'groups', groupId, 'members'), orderBy('joinedAt', 'asc'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

/* ---------- Articles ---------- */

export function listenItems(groupId, callback) {
  const q = query(collection(db, 'groups', groupId, 'items'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export async function addItem(groupId, profile, item) {
  await addDoc(collection(db, 'groups', groupId, 'items'), {
    ownerId: profile.id,
    ownerPseudo: profile.pseudo,
    name: item.name.trim(),
    price: item.price === '' ? null : Number(item.price),
    url: item.url?.trim() || null,
    photo: item.photo || null,
    note: item.note?.trim() || null,
    reservedBy: null,
    reservedByPseudo: null,
    createdAt: serverTimestamp(),
  })
}

export async function updateItem(groupId, itemId, item) {
  await updateDoc(doc(db, 'groups', groupId, 'items', itemId), {
    name: item.name.trim(),
    price: item.price === '' ? null : Number(item.price),
    url: item.url?.trim() || null,
    photo: item.photo || null,
    note: item.note?.trim() || null,
  })
}

export async function deleteItem(groupId, itemId) {
  await deleteDoc(doc(db, 'groups', groupId, 'items', itemId))
}

/* ---------- Réservations ---------- */

export async function reserveItem(groupId, itemId, profile) {
  await updateDoc(doc(db, 'groups', groupId, 'items', itemId), {
    reservedBy: profile.id,
    reservedByPseudo: profile.pseudo,
  })
}

export async function cancelReservation(groupId, itemId) {
  await updateDoc(doc(db, 'groups', groupId, 'items', itemId), {
    reservedBy: null,
    reservedByPseudo: null,
  })
}
