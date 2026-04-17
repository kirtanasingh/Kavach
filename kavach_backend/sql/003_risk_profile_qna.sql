CREATE TABLE IF NOT EXISTS farm_risk_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL UNIQUE REFERENCES farms(id) ON DELETE CASCADE,
    submitted_by_user_id UUID REFERENCES users(id),

    farm_name TEXT NOT NULL,
    location_city_village TEXT NOT NULL,
    location_state TEXT NOT NULL,
    animal_count INTEGER NOT NULL,
    animal_types TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    water_source TEXT NOT NULL,
    feeding_system TEXT NOT NULL,
    vaccination_status TEXT NOT NULL,
    recent_disease BOOLEAN NOT NULL DEFAULT FALSE,
    recent_disease_details TEXT,
    waste_management TEXT NOT NULL,
    vet_service_usage TEXT NOT NULL,

    completion_percent INTEGER NOT NULL DEFAULT 0,
    risk_score INTEGER,
    risk_level TEXT,
    top_risk_factors TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    recommendations_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    dashboard_flags JSONB NOT NULL DEFAULT '{}'::jsonb,

    is_draft BOOLEAN NOT NULL DEFAULT TRUE,
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_farm_risk_profiles_farm_id ON farm_risk_profiles(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_risk_profiles_risk_level ON farm_risk_profiles(risk_level);

DROP TRIGGER IF EXISTS trg_farm_risk_profiles_set_updated_at ON farm_risk_profiles;
CREATE TRIGGER trg_farm_risk_profiles_set_updated_at
BEFORE UPDATE ON farm_risk_profiles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
