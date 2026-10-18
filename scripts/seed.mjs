// Development & Emulator Seed Script
// Safeguard: Only runs against Firestore Emulator or a dedicated 'roammate-dev' project.
// Never run against production.

import { readFileSync } from "node:fs";
import admin from "firebase-admin";

const sa = JSON.parse(readFileSync(new URL("./service-account.json", import.meta.url)));

if (!process.env.FIRESTORE_EMULATOR_HOST && sa.project_id !== "roammate-dev") {
  throw new Error("Refusing to seed a non-dev project. Set FIRESTORE_EMULATOR_HOST or use a roammate-dev project.");
}

admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const demos = {
  "demo-maya":   { name: "Maya",   age: 27, gender: "Woman", city: "Porto",     travelStyle: "Slow travel", bio: "Mountains in the morning, a good story by sunset.", interests: ["Hiking","Books","Coffee","Photography"] },
  "demo-ananya": { name: "Ananya", age: 26, gender: "Woman", city: "Delhi",     travelStyle: "Foodie",      bio: "Will plan the whole trip, then abandon it for a street-food detour.", interests: ["Food","Culture","Museums","Music"] },
  "demo-sara":   { name: "Sara",   age: 30, gender: "Woman", city: "Goa",       travelStyle: "Adventure",   bio: "Dive logs, sunsets and a very full camera roll.", interests: ["Diving","Beaches","Wildlife","Photography"] },
  "demo-vivek":  { name: "Vivek",  age: 29, gender: "Man",   city: "Mumbai",    travelStyle: "Backpacking", bio: "Road trips with a terrible playlist and great company.", interests: ["Road trips","Music","Hiking","Coffee"] },
  "demo-eli":    { name: "Eli",    age: 31, gender: "Non-binary", city: "Lisbon", travelStyle: "Culture",  bio: "Collecting stories, not things.", interests: ["Art","Museums","Books","Yoga"] },
  "demo-noah":   { name: "Noah",   age: 28, gender: "Man",   city: "Bengaluru", travelStyle: "Slow travel", bio: "First up the trail, last to leave the cafe.", interests: ["Hiking","Coffee","Skiing","Photography"] },
};

const batch = db.batch();
for (const [id, p] of Object.entries(demos)) {
  batch.set(db.doc(`profiles/${id}`), { ...p, interestedIn: [], ageMin: 18, ageMax: 60, demo: true, updatedAt: Date.now() });
  batch.set(db.doc(`likes/${id}`), { liked: [], passed: [] });
}
await batch.commit();
console.log(`Seeded ${Object.keys(demos).length} demo profiles in dev/emulator environment.`);
