import { db, collection, doc, setDoc, addDoc } from './firebaseConfig.js';

// Your local JSON data
const earnData = {
  "1": { name: "Ring Fit", unit: "minutes", pointsByUnit: {45: 250}, timesUsed: 0, tags: [], outdoors: false },
  "2": { name: "Row", unit: "minutes", pointsByUnit: {30: 250, 45: 350, 60: 400}, intensityModifier: {"Easy": 0.9, "Moderate": 1, "Intense": 1.1}, timesUsed: 0, tags: [], outdoors: false},
  "3": { name: "Run", unit: "minutes", pointsByUnit: {30: 300, 60: 500}, timesUsed: 0, tags: [], outdoors: true },
  "4": { name: "Hula Hoop", unit: "minutes", pointsByUnit: {10: 5}, timesUsed: 0, tags: [], outdoors: false },
  "5": { name: "Walk around the park", unit: "laps", pointsByUnit: {1: 25, 2: 50, 3: 75}, timesUsed: 0, tags: [], outdoors: true },
  "6": { name: "Hike", unit: "miles", pointsByUnit: {1: 125, 2: 250, 3: 350, 4:400, 8.5: 1000}, timesUsed: 0, tags: [], outdoors: true },
  "7": { name: "Exercise Class", unit: "minutes", pointsByUnit: {30: 200}, intensityModifier: {"Easy": 0.6, "Moderate": 1, "Intense": 1.7}, timesUsed: 0, tags: [], outdoors: false },
  "8": { name: "Yoga", unit: "minutes", pointsByUnit: {10: 30, 20: 50, 30: 75, 45: 120, 60: 150}, intensityModifier: {"Easy": 0.7, "Moderate": 1, "Intense": 1.5}, timesUsed: 0, tags: [], outdoors: false },
  "9": { name: "Calisthenics", unit: "minutes", pointsByUnit: {10: 70, 20: 140, 30: 200}, intensityModifier: {"Easy": 0.5, "Moderate": 1, "Intense": 1.5}, timesUsed: 0, tags: [], outdoors: false }
};

const redeemData = {
  "1": { name: "Kombucha", pointValue: 10, timesUsed: 0, tags: [] },
  "2": { name: "Fresh Fruit", pointValue: 25, timesUsed: 0, tags: [] },
  "3": { name: "Juice", pointValue: 50, timesUsed: 0, tags: [] },
  "4": { name: "Cookie", pointValue: 80, timesUsed: 0, tags: [] },
  "5": { name: "Hot Chocolate", pointValue: 100, timesUsed: 0, tags: [] },
  "6": { name: "Wine", pointValue: 120, timesUsed: 0, tags: [] },
  "7": { name: "Whiskey", pointValue: 150, timesUsed: 0, tags: [] },
  "8": { name: "Ice Cream", pointValue: 250, timesUsed: 0, tags: [] },
  "9": { name: "Fast Food", pointValue: 400, timesUsed: 0, tags: [] },
  "10": { name: "Pizza", pointValue: 350, timesUsed: 0, tags: [] },
  "11": { name: "Pastry", pointValue: 350, timesUsed: 0, tags: [] }
};

async function uploadData() {
  console.log('Starting upload to Firestore...');

  try {
    // Upload earn data
    console.log('Uploading earn data...');
    for (const [id, data] of Object.entries(earnData)) {
      const docRef = await addDoc(collection(db, 'activities'), data);
      console.log(`Uploaded earn item with auto-ID: ${docRef.id}`);
    }

    // Upload redeem data
    console.log('Uploading redeem data...');
    for (const [id, data] of Object.entries(redeemData)) {
      const docRef = await addDoc(collection(db, 'rewards'), data);
      console.log(`Uploaded redeem item with auto-ID: ${docRef.id}`);
    }

    console.log('Upload complete');
  } catch (error) {
    console.error('Error uploading data:', error);
  }
}

// Run the upload
uploadData();
