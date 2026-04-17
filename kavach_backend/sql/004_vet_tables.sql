CREATE TABLE vet_farm_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vet_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unassigned_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (vet_user_id, farm_id)
);

CREATE INDEX vfa_vet_idx ON vet_farm_assignments(vet_user_id, active);
CREATE INDEX vfa_farm_idx ON vet_farm_assignments(farm_id, active);

CREATE TABLE vet_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vet_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    farmer_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    appointment_type TEXT NOT NULL DEFAULT 'routine',
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    location_text TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled',
    reason TEXT,
    notes TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX va_vet_idx ON vet_appointments(vet_user_id, scheduled_at);
CREATE INDEX va_farm_idx ON vet_appointments(farm_id, scheduled_at);
CREATE INDEX va_status_idx ON vet_appointments(vet_user_id, status);
CREATE INDEX va_scheduled_idx ON vet_appointments(scheduled_at);

CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vet_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    animal_id UUID REFERENCES animals(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES vet_appointments(id) ON DELETE SET NULL,
    diagnosis TEXT NOT NULL,
    medicine_name TEXT NOT NULL,
    dose TEXT NOT NULL,
    frequency TEXT,
    duration_days INTEGER,
    route TEXT,
    withdrawal_days INTEGER DEFAULT 0,
    prescribed_on DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE,
    status TEXT NOT NULL DEFAULT 'active',
    refills_allowed INTEGER DEFAULT 0,
    refills_used INTEGER DEFAULT 0,
    special_instructions TEXT,
    comments TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX rx_vet_idx ON prescriptions(vet_user_id, prescribed_on DESC);
CREATE INDEX rx_farm_idx ON prescriptions(farm_id);
CREATE INDEX rx_animal_idx ON prescriptions(animal_id);
CREATE INDEX rx_status_idx ON prescriptions(vet_user_id, status);

CREATE TABLE amu_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    animal_id UUID REFERENCES animals(id) ON DELETE SET NULL,
    prescription_id UUID REFERENCES prescriptions(id) ON DELETE SET NULL,
    entered_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    species TEXT NOT NULL,
    drug_name TEXT NOT NULL,
    drug_class TEXT,
    route TEXT NOT NULL,
    dosage NUMERIC(10, 3) NOT NULL,
    dosage_unit TEXT NOT NULL DEFAULT 'mg',
    dosage_per_kg NUMERIC(10, 3),
    purpose TEXT NOT NULL,
    administration_date DATE NOT NULL,
    duration_days INTEGER,
    withdrawal_period_days INTEGER DEFAULT 0,
    safe_after_date DATE,
    batch_size INTEGER,
    reminder_enabled BOOLEAN DEFAULT FALSE,
    reminder_sent_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX amu_farm_idx ON amu_logs(farm_id, administration_date DESC);
CREATE INDEX amu_vet_idx ON amu_logs(entered_by_user_id);
CREATE INDEX amu_drug_idx ON amu_logs(drug_name);
CREATE INDEX amu_class_idx ON amu_logs(drug_class);
CREATE INDEX amu_species_idx ON amu_logs(farm_id, species);
CREATE INDEX amu_date_idx ON amu_logs(administration_date);

CREATE TABLE vet_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    vet_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    farmer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_role TEXT NOT NULL,
    message_text TEXT NOT NULL,
    attachment_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX vm_farm_vet_idx ON vet_messages(farm_id, vet_user_id, created_at DESC);
CREATE INDEX vm_unread_idx ON vet_messages(farm_id, is_read) WHERE is_read = FALSE;
CREATE INDEX vm_sender_idx ON vet_messages(sender_user_id);

CREATE TABLE vet_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vet_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium',
    title TEXT NOT NULL,
    message TEXT,
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX veta_vet_idx ON vet_alerts(vet_user_id, created_at DESC);
CREATE INDEX veta_unread_idx ON vet_alerts(vet_user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX veta_severity_idx ON vet_alerts(vet_user_id, severity);

CREATE TRIGGER vet_farm_assignments_updated_at
    BEFORE UPDATE ON vet_farm_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER vet_appointments_updated_at
    BEFORE UPDATE ON vet_appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER prescriptions_updated_at
    BEFORE UPDATE ON prescriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER amu_logs_updated_at
    BEFORE UPDATE ON amu_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER vet_alerts_updated_at
    BEFORE UPDATE ON vet_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
