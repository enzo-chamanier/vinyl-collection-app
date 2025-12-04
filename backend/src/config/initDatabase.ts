import { query } from "./database";

export async function initDatabase() {
    try {
        // Users table
        await query(`
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            username VARCHAR(100) UNIQUE NOT NULL,
            password TEXT NOT NULL,
            profile_picture TEXT,
            bio TEXT,
            is_public BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        `);

        // Vinyls table
        await query(`
        CREATE TABLE IF NOT EXISTS vinyls (
            id UUID PRIMARY KEY,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            artist TEXT NOT NULL,
            genre TEXT,
            release_year INT,
            barcode TEXT,
            discogs_id TEXT,
            cover_image TEXT,
            notes TEXT,
            rating INT CHECK (rating >= 0 AND rating <= 5),
            vinyl_color TEXT,
            date_added TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        `);

        // Add vinyl_color column if it doesn't exist (migration)
        await query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vinyls' AND column_name='vinyl_color') THEN 
                    ALTER TABLE vinyls ADD COLUMN vinyl_color TEXT; 
                END IF; 
            END $$;
        `);

        // Add disc_count column if it doesn't exist (migration)
        await query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vinyls' AND column_name='disc_count') THEN 
                    ALTER TABLE vinyls ADD COLUMN disc_count INT DEFAULT 1; 
                END IF; 
            END $$;
        `);

        await query(`
        CREATE INDEX IF NOT EXISTS idx_vinyls_user_id ON vinyls(user_id);
        CREATE INDEX IF NOT EXISTS idx_vinyls_genre ON vinyls(genre);
        CREATE INDEX IF NOT EXISTS idx_vinyls_artist ON vinyls(artist);
        `);

        // Follows table
        await query(`
            CREATE TABLE IF NOT EXISTS follows (
                id UUID PRIMARY KEY,
                follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
                following_id UUID REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(follower_id, following_id)
            );
            CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
            CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
        `);

        console.log("✅ Database initialized successfully");
    } catch (error) {
        console.error("❌ Error initializing database:", error);
        throw error;
    }
}
