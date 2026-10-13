// Optional: adds demo profiles + sample group trips so you can test matching alone.
// 1) Firebase console → Project settings → Service accounts → Generate new private key
//    Save it as scripts/service-account.json (it is git-ignored — never commit it).
// 2) cd scripts && npm install && npm run seed
// Demo profiles that "like" everyone ("*") match you instantly when you like them.
import { readFileSync } from "node:fs";
import admin from "firebase-admin";

const sa = JSON.parse(readFileSync(new URL("./service-account.json", import.meta.url)));
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const demos = {
  "demo-maya":   { name: "Maya",   age: 27, gender: "Woman", city: "Porto",     travelStyle: "Slow travel", bio: "Mountains in the morning, a good story by sunset.", interests: ["Hiking","Books","Coffee","Photography"], likesEveryone: true },
  "demo-ananya": { name: "Ananya", age: 26, gender: "Woman", city: "Delhi",     travelStyle: "Foodie",      bio: "Will plan the whole trip, then abandon it for a street-food detour.", interests: ["Food","Culture","Museums","Music"], likesEveryone: true },
  "demo-sara":   { name: "Sara",   age: 30, gender: "Woman", city: "Goa",       travelStyle: "Adventure",   bio: "Dive logs, sunsets and a very full camera roll.", interests: ["Diving","Beaches","Wildlife","Photography"] },
  "demo-vivek":  { name: "Vivek",  age: 29, gender: "Man",   city: "Mumbai",    travelStyle: "Backpacking", bio: "Road trips with a terrible playlist and great company.", interests: ["Road trips","Music","Hiking","Coffee"], likesEveryone: true },
  "demo-eli":    { name: "Eli",    age: 31, gender: "Non-binary", city: "Lisbon", travelStyle: "Culture",  bio: "Collecting stories, not things.", interests: ["Art","Museums","Books","Yoga"], likesEveryone: true },
  "demo-noah":   { name: "Noah",   age: 28, gender: "Man",   city: "Bengaluru", travelStyle: "Slow travel", bio: "First up the trail, last to leave the cafe.", interests: ["Hiking","Coffee","Skiing","Photography"] },
};
const groups = {
  "alpine-reset":     { title: "Alpine reset",     place: "Swiss Alps",          start: "2026-12-12", end: "2026-12-18", capacity: 12, tags: ["Hiking","Slow travel"], description: "Hikes, mountain huts and slow mornings." },
  "marrakech-makers": { title: "Marrakech makers", place: "Marrakech, Morocco",  start: "2026-11-20", end: "2026-11-25", capacity: 10, tags: ["Culture","Food","Art"], description: "Markets, studios and unforgettable food." },
  "kyoto-autumn":     { title: "Kyoto in autumn",  place: "Kyoto, Japan",        start: "2026-11-08", end: "2026-11-14", capacity: 6,  tags: ["Culture","Photography"], description: "Temples, maple leaves and quiet tea houses." },
  "spiti-roadtrip":   { title: "Spiti road trip",  place: "Spiti Valley, India", start: "2027-06-05", end: "2027-06-14", capacity: 8,  tags: ["Adventure","Road trips","Hiking"], description: "High passes, monasteries and starry campsites." },
};

const batch = db.batch();
for (const [id, { likesEveryone, ...p }] of Object.entries(demos)) {
  batch.set(db.doc(`profiles/${id}`), { ...p, interestedIn: [], ageMin: 18, ageMax: 60, demo: true, updatedAt: Date.now() });
  batch.set(db.doc(`likes/${id}`), { liked: likesEveryone ? ["*"] : [], passed: [] });
}
for (const [id, g] of Object.entries(groups)) {
  batch.set(db.doc(`groups/${id}`), { ...g, host: null, sample: true, createdAt: Date.now() });
}
await batch.commit();
console.log(`Seeded ${Object.keys(demos).length} demo profiles and ${Object.keys(groups).length} sample group trips.`);
