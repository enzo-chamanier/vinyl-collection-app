
import { query, pool } from "./src/config/database";

async function migrate() {
    try {
        console.log("Adding social columns to vinyls table...");

        await query(`
      ALTER TABLE vinyls 
      ADD COLUMN IF NOT EXISTS gifted_by_user_id UUID REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS shared_with_user_id UUID REFERENCES users(id);
    `);

        console.log("Columns added successfully.");
    } catch (error) {
        console.error("Error running migration:", error);
    } finally {
        await pool.end();
    }
}

migrate();
