// Keeps a copy of the store in MongoDB so data survives restarts.
// The app still works from memory; this loads the saved copy on start
// and writes it back shortly after every change.
// Without MONGODB_URI it does nothing and data lives in memory only.
const { MongoClient } = require("mongodb");
const store = require("./store");

const DOC_ID = "main";
let collection = null;
let timer = null;
let pending = Promise.resolve();

async function save() {
  if (!collection) return;
  const data = store.exportData();
  await collection.replaceOne({ _id: DOC_ID }, { _id: DOC_ID, ...data, savedAt: new Date() }, { upsert: true });
}

async function connect() {
  const uri = (process.env.MONGODB_URI || "").trim();
  if (!uri) {
    console.log("💾 MONGODB_URI not set: data is kept in memory only.");
    return;
  }
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });
  await client.connect();
  collection = client.db(process.env.MONGODB_DB || "indibazaar").collection("store");

  const saved = await collection.findOne({ _id: DOC_ID });
  if (saved) {
    store.importData(saved);
    console.log("💾 Loaded saved data from MongoDB.");
  } else {
    await save();
    console.log("💾 MongoDB connected: saved the starting data.");
  }
}

/** Save about a second after the last change (several quick changes = one write). */
function scheduleSave() {
  if (!collection) return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    pending = pending.then(save).catch((err) => console.error("💾 Could not save data:", err.message));
  }, 1000);
}

/** Write any unsaved changes now (used when the server shuts down). */
async function flush() {
  if (!collection) return;
  clearTimeout(timer);
  await pending;
  await save().catch((err) => console.error("💾 Could not save data:", err.message));
}

module.exports = { connect, scheduleSave, flush };
