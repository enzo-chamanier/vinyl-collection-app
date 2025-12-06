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

        // Add format column if it doesn't exist (migration)
        await query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vinyls' AND column_name='format') THEN 
                    ALTER TABLE vinyls ADD COLUMN format VARCHAR(20) DEFAULT 'vinyl'; 
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

        // Add status column to follows table if it doesn't exist
        await query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='follows' AND column_name='status') THEN 
                    ALTER TABLE follows ADD COLUMN status VARCHAR(20) DEFAULT 'accepted'; 
                END IF; 
            END $$;
        `);

        // Likes table
        await query(`
            CREATE TABLE IF NOT EXISTS likes (
                id UUID PRIMARY KEY,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                vinyl_id UUID REFERENCES vinyls(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(user_id, vinyl_id)
            );
            CREATE INDEX IF NOT EXISTS idx_likes_vinyl ON likes(vinyl_id);
            CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);
        `);

        // Add parent_id column to comments if it doesn't exist (migration)
        await query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='comments' AND column_name='parent_id') THEN 
                    ALTER TABLE comments ADD COLUMN parent_id UUID REFERENCES comments(id) ON DELETE CASCADE; 
                END IF; 
            END $$;
        `);

        // Comments table
        await query(`
            CREATE TABLE IF NOT EXISTS comments (
                id UUID PRIMARY KEY,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                vinyl_id UUID REFERENCES vinyls(id) ON DELETE CASCADE,
                parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_comments_vinyl ON comments(vinyl_id);
            CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
            CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
        `);

        // Comment Likes table
        await query(`
            CREATE TABLE IF NOT EXISTS comment_likes (
                id UUID PRIMARY KEY,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(user_id, comment_id)
            );
            CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id);
            CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON comment_likes(user_id);
        `);

        console.log("✅ Database initialized successfully");
    } catch (error) {
        console.error("❌ Error initializing database:", error);
        throw error;
    }
}
