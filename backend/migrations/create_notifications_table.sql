CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY,
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'VINYL_COMMENT', 'COMMENT_LIKE'
    reference_id UUID NOT NULL, -- ID of the comment or vinyl
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
