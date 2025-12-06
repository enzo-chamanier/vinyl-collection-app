
import { query, pool } from "./src/config/database";
import fs from "fs";
import path from "path";

async function runMigration() {
    try {
        const migrationFile = process.argv[2];
        if (!migrationFile) {
            console.error("Please provide a migration file path");
            process.exit(1);
        }
        const migrationPath = path.resolve(process.cwd(), migrationFile);
        const sql = fs.readFileSync(migrationPath, "utf8");
        console.log("Running migration...");
        await query(sql);
        console.log("Migration completed successfully.");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await pool.end();
    }
}

runMigration();
