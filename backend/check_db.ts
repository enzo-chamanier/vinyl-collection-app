
import { query, pool } from "./src/config/database";

async function checkSchema() {
    try {
        const result = await query(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';"
        );
        console.log("Columns in users table:");
        result.rows.forEach(row => {
            console.log(`- ${row.column_name} (${row.data_type})`);
        });
    } catch (error) {
        console.error("Error checking schema:", error);
    } finally {
        await pool.end();
    }
}

checkSchema();
