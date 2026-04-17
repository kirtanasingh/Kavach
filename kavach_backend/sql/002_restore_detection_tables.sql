CREATE TABLE IF NOT EXISTS detection_records (
    id BIGSERIAL PRIMARY KEY,
    farmer_id INTEGER NOT NULL,
    animal_id INTEGER,
    species TEXT NOT NULL,
    predicted_label TEXT NOT NULL,
    confidence DOUBLE PRECISION NOT NULL DEFAULT 0,
    severity TEXT NOT NULL DEFAULT 'unknown',
    status TEXT NOT NULL DEFAULT 'pending',
    recommendation TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_detection_records_farmer_id ON detection_records(farmer_id);
CREATE INDEX IF NOT EXISTS idx_detection_records_created_at ON detection_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_detection_records_status ON detection_records(status);

CREATE TABLE IF NOT EXISTS cases (
    id BIGSERIAL PRIMARY KEY,
    detection_id BIGINT NOT NULL,
    farmer_id INTEGER NOT NULL,
    animal_id INTEGER,
    assigned_vet_id INTEGER,
    status TEXT NOT NULL DEFAULT 'open',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cases_detection_id ON cases(detection_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_updated_at ON cases(updated_at DESC);

CREATE TABLE IF NOT EXISTS detection_reviews (
    id BIGSERIAL PRIMARY KEY,
    detection_id BIGINT NOT NULL,
    vet_id INTEGER NOT NULL,
    review_status TEXT NOT NULL DEFAULT 'pending',
    vet_note TEXT,
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_detection_reviews_detection_id ON detection_reviews(detection_id);
CREATE INDEX IF NOT EXISTS idx_detection_reviews_vet_id ON detection_reviews(vet_id);
CREATE INDEX IF NOT EXISTS idx_detection_reviews_reviewed_at ON detection_reviews(reviewed_at DESC);
