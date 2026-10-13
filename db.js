// Small adapter that gives the app a simple, path-based API on top of Firestore:
//   db.doc("profiles/abc").set({...}) / .update() / .delete() / .get() / .onSnapshot()
//   db.collection("trips").where(...).orderBy(...).limit(...).onSnapshot()
//   db.collection("trips").doc() / .add({...})
import {
  doc, collection, getDoc, setDoc, updateDoc, deleteDoc, addDoc,
  onSnapshot, query, getDocs, where, orderBy, limit,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const wrapDoc = (d) => ({ id: d.id, exists: d.exists(), data: () => d.data() });

let track = (u) => u;

function docRef(fs, ref) {
  return {
    id: ref.id,
    path: ref.path,
    get: async () => wrapDoc(await getDoc(ref)),
    set: (data) => setDoc(ref, data),
    update: (data) => updateDoc(ref, data),
    delete: () => deleteDoc(ref),
    onSnapshot: (next, err) => track(onSnapshot(ref, (d) => next(wrapDoc(d)), err)),
    collection: (sub) => collRef(fs, collection(ref, sub)),
  };
}

function collRef(fs, ref, constraints = []) {
  const q = () => (constraints.length ? query(ref, ...constraints) : ref);
  return {
    path: ref.path,
    where: (f, op, v) => collRef(fs, ref, [...constraints, where(f, op, v)]),
    orderBy: (f, dir = "asc") => collRef(fs, ref, [...constraints, orderBy(f, dir)]),
    limit: (n) => collRef(fs, ref, [...constraints, limit(n)]),
    doc: (id) => docRef(fs, id ? doc(ref, id) : doc(ref)),
    add: async (data) => docRef(fs, await addDoc(ref, data)),
    get: async () => {
      const s = await getDocs(q());
      return { docs: s.docs.map(wrapDoc), size: s.size, empty: s.empty };
    },
    onSnapshot: (next, err) =>
      track(onSnapshot(q(), (s) => next({ docs: s.docs.map(wrapDoc), size: s.size, empty: s.empty }), err)),
  };
}

// onListen(unsub) is called for every live listener so the app can close them all on sign-out.
export function makeDb(fs, onListen) {
  if (onListen) track = (u) => (onListen(u), u);
  return {
    doc: (path) => docRef(fs, doc(fs, path)),
    collection: (path) => collRef(fs, collection(fs, path)),
  };
}
