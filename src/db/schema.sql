-- ====================================================================
-- 🐾 Moca-ToTo Care Production Database Schema (PostgreSQL + PostGIS)
-- ====================================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. Users Table (Auth & Guardians)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'GUARDIAN_PRIMARY',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Pets Table (Profiles & Vitals)
CREATE TABLE IF NOT EXISTS pets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    primary_guardian_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    species VARCHAR(50) NOT NULL DEFAULT 'dog',
    breed VARCHAR(100) NOT NULL,
    birthdate DATE,
    age_years INT DEFAULT 2,
    gender VARCHAR(10) DEFAULT 'MALE_NEUTERED',
    weight_kg NUMERIC(5, 2) NOT NULL DEFAULT 3.80,
    happiness_level INT DEFAULT 88 CHECK (happiness_level BETWEEN 0 AND 100),
    satiety_level INT DEFAULT 75 CHECK (satiety_level BETWEEN 0 AND 100),
    energy_level INT DEFAULT 90 CHECK (energy_level BETWEEN 0 AND 100),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Family Co-Parenting & Sharing
CREATE TABLE IF NOT EXISTS family_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'CO_PARENT', -- 'PRIMARY' | 'CO_PARENT' | 'SITTER'
    invite_code VARCHAR(50),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pet_id, user_id)
);

-- 5. Daily Checklist & Care Logs
CREATE TABLE IF NOT EXISTS daily_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    time_label VARCHAR(50) NOT NULL,
    detail TEXT,
    category VARCHAR(50) DEFAULT 'MEAL', -- 'MEAL' | 'SUPPLEMENT' | 'MEDICATION' | 'GROOMING' | 'CUSTOM'
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    record_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Health & Hospital Medical Records
CREATE TABLE IF NOT EXISTS health_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
    record_date DATE NOT NULL DEFAULT CURRENT_DATE,
    hospital_name VARCHAR(255) NOT NULL,
    doctor_name VARCHAR(100),
    category VARCHAR(50) NOT NULL DEFAULT 'checkup', -- 'checkup' | 'vaccine' | 'dental' | 'treatment'
    diagnosis TEXT NOT NULL,
    prescription TEXT,
    weight_kg NUMERIC(5, 2),
    cost_krw INT DEFAULT 0,
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Vaccine & Medication D-Day Schedules
CREATE TABLE IF NOT EXISTS vaccine_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'HEARTWORM' | 'RABIES' | 'CORE_5' | 'KENNEL_COUGH'
    due_date DATE NOT NULL,
    interval_days INT DEFAULT 30,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Walk Sessions (PostGIS Spatial Trajectory & Shapeify)
CREATE TABLE IF NOT EXISTS walk_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
    walker_id UUID REFERENCES users(id) ON DELETE SET NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INT NOT NULL DEFAULT 0,
    distance_km NUMERIC(6, 3) NOT NULL DEFAULT 0.000,
    calories_burned INT NOT NULL DEFAULT 0,
    step_count INT NOT NULL DEFAULT 0,
    shape_type VARCHAR(50) DEFAULT 'raw', -- 'raw' | 'paw' | 'heart' | 'bone'
    weather_info VARCHAR(100),
    notes TEXT,
    -- PostGIS spatial line for GPS trajectory tracking
    geom_route GEOMETRY(LineString, 4326),
    raw_points_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Community Places (Spatial Geo Locations)
CREATE TABLE IF NOT EXISTS community_places (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'hospital' | 'park' | 'cafe' | 'salon'
    rating NUMERIC(3, 2) DEFAULT 4.90,
    review_count INT DEFAULT 0,
    address TEXT NOT NULL,
    phone VARCHAR(50),
    tags TEXT[],
    badge_label VARCHAR(100),
    image_url TEXT,
    -- PostGIS spatial point for location & distance queries
    location GEOMETRY(Point, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Gemini Multimodal AI Consultations
CREATE TABLE IF NOT EXISTS ai_consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL, -- 'behavior' | 'stool' | 'skin' | 'food' | 'general'
    user_query TEXT NOT NULL,
    image_url TEXT,
    summary TEXT NOT NULL,
    urgency_level VARCHAR(30) DEFAULT 'NORMAL', -- 'NORMAL' | 'ATTENTION' | 'URGENT'
    health_score INT DEFAULT 85,
    inner_voice_translation TEXT,
    mood_status VARCHAR(100),
    detected_issues JSONB,
    veterinary_tip TEXT,
    action_plan JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for Fast Spatial & Relational Queries
CREATE INDEX IF NOT EXISTS idx_pets_guardian ON pets(primary_guardian_id);
CREATE INDEX IF NOT EXISTS idx_daily_records_pet_date ON daily_records(pet_id, record_date);
CREATE INDEX IF NOT EXISTS idx_walk_sessions_pet ON walk_sessions(pet_id);
CREATE INDEX IF NOT EXISTS idx_walk_geom ON walk_sessions USING GIST(geom_route);
CREATE INDEX IF NOT EXISTS idx_places_location ON community_places USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_ai_consultations_pet ON ai_consultations(pet_id);
