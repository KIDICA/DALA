import Dexie from "dexie";

const db = new Dexie("cala");
db.version(1).stores({
  snapshots: "created",
});

export default db;