CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    farm_name TEXT NOT NULL,
    farm_type TEXT,
    description TEXT,
    farm_size NUMERIC(10, 2),
    size_unit TEXT DEFAULT 'acres',
    established_year INTEGER,
    total_animals INTEGER NOT NULL DEFAULT 0,
    primary_products TEXT[],
    annual_revenue NUMERIC(15, 2),
    street_address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'India',
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_farms_owner_user_id ON farms(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_farms_city_state ON farms(city, state);

CREATE TABLE IF NOT EXISTS farm_risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    question_key TEXT NOT NULL,
    answer_boolean BOOLEAN,
    answer_text TEXT,
    score_snapshot INTEGER,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(farm_id, question_key)
);

CREATE INDEX IF NOT EXISTS idx_farm_risk_assessments_farm_id ON farm_risk_assessments(farm_id);

CREATE TABLE IF NOT EXISTS animals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    tag_number TEXT NOT NULL,
    animal_name TEXT,
    species TEXT NOT NULL,
    breed TEXT,
    age_months INTEGER,
    age_text TEXT,
    health_status TEXT DEFAULT 'healthy',
    vaccination_status TEXT DEFAULT 'unknown',
    last_checkup_at DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(farm_id, tag_number)
);

CREATE INDEX IF NOT EXISTS idx_animals_farm_id ON animals(farm_id);
CREATE INDEX IF NOT EXISTS idx_animals_farm_health ON animals(farm_id, health_status);
CREATE INDEX IF NOT EXISTS idx_animals_farm_species ON animals(farm_id, species);

CREATE TABLE IF NOT EXISTS farm_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to_name TEXT,
    assigned_by_user_id UUID REFERENCES users(id),
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    category TEXT,
    due_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    reference_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_farm_tasks_farm_id ON farm_tasks(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_tasks_farm_status ON farm_tasks(farm_id, status);
CREATE INDEX IF NOT EXISTS idx_farm_tasks_due_at ON farm_tasks(due_at);

CREATE TABLE IF NOT EXISTS farm_treatments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    animal_id UUID REFERENCES animals(id) ON DELETE SET NULL,
    diagnosis TEXT NOT NULL,
    medication TEXT NOT NULL,
    dosage TEXT,
    route TEXT,
    prescribed_by_user_id UUID REFERENCES users(id),
    prescribed_by_name TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    duration_days INTEGER,
    status TEXT DEFAULT 'active',
    withdrawal_days INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_farm_treatments_farm_id ON farm_treatments(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_treatments_farm_status ON farm_treatments(farm_id, status);
CREATE INDEX IF NOT EXISTS idx_farm_treatments_animal_id ON farm_treatments(animal_id);

CREATE TABLE IF NOT EXISTS withdrawal_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    animal_id UUID REFERENCES animals(id) ON DELETE SET NULL,
    treatment_id UUID REFERENCES farm_treatments(id) ON DELETE SET NULL,
    medicine_name TEXT NOT NULL,
    administered_at TIMESTAMPTZ NOT NULL,
    withdrawal_days INTEGER NOT NULL DEFAULT 0,
    safe_after_at TIMESTAMPTZ,
    collection_attempted_at TIMESTAMPTZ,
    collection_result TEXT,
    violation_flag BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_withdrawal_records_farm_id ON withdrawal_records(farm_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_records_safe_after_at ON withdrawal_records(safe_after_at);
CREATE INDEX IF NOT EXISTS idx_withdrawal_records_violation_flag ON withdrawal_records(violation_flag);

CREATE TABLE IF NOT EXISTS farm_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    severity TEXT DEFAULT 'medium',
    title TEXT NOT NULL,
    message TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_farm_alerts_farm_id ON farm_alerts(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_alerts_farm_is_read ON farm_alerts(farm_id, is_read);
CREATE INDEX IF NOT EXISTS idx_farm_alerts_farm_severity ON farm_alerts(farm_id, severity);

DROP TRIGGER IF EXISTS trg_farms_set_updated_at ON farms;
CREATE TRIGGER trg_farms_set_updated_at BEFORE UPDATE ON farms FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_animals_set_updated_at ON animals;
CREATE TRIGGER trg_animals_set_updated_at BEFORE UPDATE ON animals FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_farm_tasks_set_updated_at ON farm_tasks;
CREATE TRIGGER trg_farm_tasks_set_updated_at BEFORE UPDATE ON farm_tasks FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_farm_treatments_set_updated_at ON farm_treatments;
CREATE TRIGGER trg_farm_treatments_set_updated_at BEFORE UPDATE ON farm_treatments FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_withdrawal_records_set_updated_at ON withdrawal_records;
CREATE TRIGGER trg_withdrawal_records_set_updated_at BEFORE UPDATE ON withdrawal_records FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_farm_alerts_set_updated_at ON farm_alerts;
CREATE TRIGGER trg_farm_alerts_set_updated_at BEFORE UPDATE ON farm_alerts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
