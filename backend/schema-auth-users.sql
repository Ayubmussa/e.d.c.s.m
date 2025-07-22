-- User settings table (updated to use auth.users)
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    notification_preferences JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}',
    accessibility_settings JSONB DEFAULT '{}',
    app_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS policy for user_settings
CREATE POLICY "Users can manage their own settings" ON user_settings
    FOR ALL USING (auth.uid() = user_id);

-- User sensor settings table (updated to use auth.users)
CREATE TABLE IF NOT EXISTS user_sensor_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_sensor_settings
ALTER TABLE user_sensor_settings ENABLE ROW LEVEL SECURITY;

-- RLS policy for user_sensor_settings
CREATE POLICY "Users can manage their own sensor settings" ON user_sensor_settings
    FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS sensor_calibration (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    calibration_data JSONB DEFAULT '{}',
    calibrated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sensor_calibration ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own sensor calibration" ON sensor_calibration
    FOR ALL USING (auth.uid() = user_id);

-- Notification history table (used for user notification events)
CREATE TABLE IF NOT EXISTS notification_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- Enable RLS on notification_history
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

-- RLS policy for notification_history (users can only access their own notification history)
CREATE POLICY "Users can manage their own notification history" ON notification_history
    FOR ALL USING (auth.uid() = user_id);
-- Add missing fields to user_profiles if not present
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS medical_conditions TEXT[];
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Add missing fields to emergency_contacts if not present
ALTER TABLE emergency_contacts ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE emergency_contacts ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT true;
ALTER TABLE emergency_contacts ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add missing fields to notification_logs if not present
ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Add missing fields to medications if not present
ALTER TABLE medications ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE medications ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE medications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE medications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add missing fields to medication_logs if not present
ALTER TABLE medication_logs ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE medication_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE medication_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add missing fields to health_checkins if not present
ALTER TABLE health_checkins ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE health_checkins ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE health_checkins ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add missing fields to emergency_alerts if not present
ALTER TABLE emergency_alerts ADD COLUMN IF NOT EXISTS location JSONB;
ALTER TABLE emergency_alerts ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ;
ALTER TABLE emergency_alerts ADD COLUMN IF NOT EXISTS acknowledged_by UUID REFERENCES auth.users(id);
ALTER TABLE emergency_alerts ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE emergency_alerts ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES auth.users(id);
ALTER TABLE emergency_alerts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE emergency_alerts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add missing fields to brain_training_sessions if not present
ALTER TABLE brain_training_sessions ADD COLUMN IF NOT EXISTS performance_data JSONB;
ALTER TABLE brain_training_sessions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Add missing fields to voice_interactions if not present
ALTER TABLE voice_interactions ADD COLUMN IF NOT EXISTS intent VARCHAR(100);
ALTER TABLE voice_interactions ADD COLUMN IF NOT EXISTS response TEXT;
ALTER TABLE voice_interactions ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2);
ALTER TABLE voice_interactions ADD COLUMN IF NOT EXISTS duration_ms INTEGER;
ALTER TABLE voice_interactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Add missing fields to sensor_data_logs if not present
ALTER TABLE sensor_data_logs ADD COLUMN IF NOT EXISTS processed_data JSONB;
ALTER TABLE sensor_data_logs ADD COLUMN IF NOT EXISTS anomalies_detected TEXT[];
ALTER TABLE sensor_data_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
-- Updated schema to use Supabase Auth users table instead of public users table
-- This schema uses auth.users as the primary user reference

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table (extends auth.users with app-specific data)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    phone_number VARCHAR(20),
    emergency_contact JSONB,
    address TEXT,
    medical_conditions TEXT[],
    user_type VARCHAR(20) DEFAULT 'elderly' CHECK (user_type IN ('elderly', 'caregiver')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    profile_image TEXT
);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policy for user_profiles (users can only access their own profile)
CREATE POLICY "Users can view and update their own profile" ON user_profiles
    FOR ALL USING (auth.uid() = id);

-- Family/Caregiver relationships table (updated to use auth.users)
CREATE TABLE IF NOT EXISTS family_relationships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    caregiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    elderly_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL CHECK (relationship_type IN ('child', 'spouse', 'sibling', 'parent', 'friend', 'professional_caregiver', 'other')),
    access_level VARCHAR(20) DEFAULT 'view' CHECK (access_level IN ('view', 'manage', 'full')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'revoked')),
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(caregiver_id, elderly_id)
);

-- Enable RLS on family_relationships
ALTER TABLE family_relationships ENABLE ROW LEVEL SECURITY;

-- RLS policy for family_relationships
CREATE POLICY "Users can manage their own family relationships" ON family_relationships
    FOR ALL USING (auth.uid() = caregiver_id OR auth.uid() = elderly_id);

-- Access permissions for family members (updated to use auth.users)
CREATE TABLE IF NOT EXISTS caregiver_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    relationship_id UUID REFERENCES family_relationships(id) ON DELETE CASCADE,
    permission_type VARCHAR(50) NOT NULL CHECK (permission_type IN ('view_health_data', 'manage_medications', 'view_emergency_alerts', 'manage_emergency_contacts', 'view_brain_training', 'manage_notifications', 'view_voice_interactions')),
    granted BOOLEAN DEFAULT false,
    granted_at TIMESTAMPTZ,
    granted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(relationship_id, permission_type)
);

-- Enable RLS on caregiver_permissions
ALTER TABLE caregiver_permissions ENABLE ROW LEVEL SECURITY;

-- Medications table (updated to use auth.users)
CREATE TABLE IF NOT EXISTS medications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    instructions TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    prescribing_doctor VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on medications
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;

-- RLS policy for medications
CREATE POLICY "Users can manage their own medications" ON medications
    FOR ALL USING (auth.uid() = user_id);

-- Medication schedules table (updated to use auth.users)
CREATE TABLE IF NOT EXISTS medication_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    medication_id UUID REFERENCES medications(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    scheduled_time TIME NOT NULL,
    days_of_week INTEGER[] NOT NULL, -- Array of day numbers (0=Sunday, 1=Monday, etc.)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on medication_schedules
ALTER TABLE medication_schedules ENABLE ROW LEVEL SECURITY;

-- RLS policy for medication_schedules
CREATE POLICY "Users can manage their own medication schedules" ON medication_schedules
    FOR ALL USING (auth.uid() = user_id);

-- Medication logs table (updated to use auth.users)
CREATE TABLE IF NOT EXISTS medication_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    medication_id UUID REFERENCES medications(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    scheduled_time TIMESTAMPTZ NOT NULL,
    taken_time TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'taken', 'missed', 'skipped')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on medication_logs
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;

-- RLS policy for medication_logs
CREATE POLICY "Users can manage their own medication logs" ON medication_logs
    FOR ALL USING (auth.uid() = user_id);

-- Health check-ins table (updated to use auth.users)
CREATE TABLE IF NOT EXISTS health_checkins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    heart_rate INTEGER,
    weight DECIMAL(5,2),
    temperature DECIMAL(4,1),
    mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 10),
    energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
    sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
    sleep_hours DECIMAL(3,1),
    pain_level INTEGER CHECK (pain_level >= 0 AND pain_level <= 10),
    symptoms TEXT[],
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on health_checkins
ALTER TABLE health_checkins ENABLE ROW LEVEL SECURITY;

-- RLS policy for health_checkins
CREATE POLICY "Users can manage their own health checkins" ON health_checkins
    FOR ALL USING (auth.uid() = user_id);

-- Emergency alerts table (updated to use auth.users)
CREATE TABLE IF NOT EXISTS emergency_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('manual', 'fall_detected', 'inactivity_detected', 'health_anomaly', 'medication_missed', 'zone_exit', 'zone_enter', 'zone_violation', 'location_emergency')),
    message TEXT NOT NULL,
    location JSONB,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'false_alarm')),
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on emergency_alerts
ALTER TABLE emergency_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policy for emergency_alerts
CREATE POLICY "Users can manage their own emergency alerts" ON emergency_alerts
    FOR ALL USING (auth.uid() = user_id);

-- User notification settings table (updated to use auth.users)
CREATE TABLE IF NOT EXISTS user_notification_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    settings JSONB NOT NULL DEFAULT '{
        "medication_reminders": true,
        "health_checkin_reminders": true,
        "emergency_alerts": true,
        "brain_training_reminders": true,
        "family_notifications": true,
        "quiet_hours_enabled": false,
        "quiet_hours_start": "22:00",
        "quiet_hours_end": "08:00",
        "notification_sound": true,
        "vibration": true
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_notification_settings
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS policy for user_notification_settings
CREATE POLICY "Users can manage their own notification settings" ON user_notification_settings
    FOR ALL USING (auth.uid() = user_id);

-- Brain training sessions table (updated to use auth.users)
CREATE TABLE IF NOT EXISTS brain_training_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_type VARCHAR(100) NOT NULL,
    difficulty_level VARCHAR(20) NOT NULL,
    score INTEGER NOT NULL,
    max_score INTEGER,
    duration_seconds INTEGER NOT NULL,
    completed BOOLEAN DEFAULT true,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    performance_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on brain_training_sessions
ALTER TABLE brain_training_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policy for brain_training_sessions
CREATE POLICY "Users can manage their own brain training sessions" ON brain_training_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Voice interactions table (updated to use auth.users)
CREATE TABLE IF NOT EXISTS voice_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    transcript TEXT NOT NULL,
    intent VARCHAR(100),
    response TEXT,
    confidence_score DECIMAL(3,2),
    duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on voice_interactions
ALTER TABLE voice_interactions ENABLE ROW LEVEL SECURITY;

-- RLS policy for voice_interactions
CREATE POLICY "Users can manage their own voice interactions" ON voice_interactions
    FOR ALL USING (auth.uid() = user_id);

-- Sensor data logs table (updated to use auth.users)
CREATE TABLE IF NOT EXISTS sensor_data_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    raw_sensor_data JSONB NOT NULL,
    processed_data JSONB,
    anomalies_detected TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on sensor_data_logs
ALTER TABLE sensor_data_logs ENABLE ROW LEVEL SECURITY;

-- RLS policy for sensor_data_logs
CREATE POLICY "Users can manage their own sensor data logs" ON sensor_data_logs
    FOR ALL USING (auth.uid() = user_id);

-- Safe zones table (updated to use auth.users)
CREATE TABLE IF NOT EXISTS safe_zones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    zone_type VARCHAR(50) NOT NULL DEFAULT 'safe' CHECK (zone_type IN ('safe', 'restricted', 'monitored')),
    center_latitude DECIMAL(10, 8) NOT NULL,
    center_longitude DECIMAL(11, 8) NOT NULL,
    radius_meters INTEGER NOT NULL DEFAULT 100,
    description TEXT,
    alert_on_enter BOOLEAN DEFAULT false,
    alert_on_exit BOOLEAN DEFAULT true,
    notification_message TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on safe_zones
ALTER TABLE safe_zones ENABLE ROW LEVEL SECURITY;

-- RLS policy for safe_zones
CREATE POLICY "Users can manage their own safe zones" ON safe_zones
    FOR ALL USING (auth.uid() = user_id);

-- Location events table (updated to use auth.users)
CREATE TABLE IF NOT EXISTS location_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('zone_enter', 'zone_exit', 'zone_violation', 'location_update', 'zone_status_init')),
    safe_zone_id UUID REFERENCES safe_zones(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address TEXT,
    distance_from_zone DECIMAL(10, 2),
    alert_triggered BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on location_events
ALTER TABLE location_events ENABLE ROW LEVEL SECURITY;

-- RLS policy for location_events
CREATE POLICY "Users can manage their own location events" ON location_events
    FOR ALL USING (auth.uid() = user_id);

-- User settings table (updated to use auth.users)
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    notification_preferences JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}',
    accessibility_settings JSONB DEFAULT '{}',
    app_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS policy for user_settings
CREATE POLICY "Users can manage their own settings" ON user_settings
    FOR ALL USING (auth.uid() = user_id);

-- User sensor settings table (updated to use auth.users)
CREATE TABLE IF NOT EXISTS user_sensor_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_sensor_settings
ALTER TABLE user_sensor_settings ENABLE ROW LEVEL SECURITY;

-- RLS policy for user_sensor_settings
CREATE POLICY "Users can manage their own sensor settings" ON user_sensor_settings
    FOR ALL USING (auth.uid() = user_id);

-- Sensor calibration table (updated to use auth.users)
CREATE TABLE IF NOT EXISTS sensor_calibration (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    calibration_data JSONB DEFAULT '{}',
    calibrated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on sensor_calibration
ALTER TABLE sensor_calibration ENABLE ROW LEVEL SECURITY;

-- RLS policy for sensor_calibration
CREATE POLICY "Users can manage their own sensor calibration" ON sensor_calibration
    FOR ALL USING (auth.uid() = user_id);

-- Notification logs table (updated to use auth.users)
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('push', 'email', 'sms')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    external_id VARCHAR(255),
    metadata JSONB,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on notification_logs
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS policy for notification_logs
CREATE POLICY "Users can view their own notification logs" ON notification_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON user_profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_family_relationships_caregiver ON family_relationships(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_family_relationships_elderly ON family_relationships(elderly_id);
CREATE INDEX IF NOT EXISTS idx_medications_user_active ON medications(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_medication_logs_user_time ON medication_logs(user_id, scheduled_time DESC);
CREATE INDEX IF NOT EXISTS idx_health_checkins_user_time ON health_checkins(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_checkins_user_date ON health_checkins(user_id, checkin_date DESC);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_user_status ON emergency_alerts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_brain_training_user_time ON brain_training_sessions(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_interactions_user_time ON voice_interactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_data_user_time ON sensor_data_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_safe_zones_location ON safe_zones(user_id, center_latitude, center_longitude);
CREATE INDEX IF NOT EXISTS idx_safe_zones_active ON safe_zones(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_location_events_user_time ON location_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_location_events_zone ON location_events(safe_zone_id, event_type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_time ON notification_logs(user_id, created_at DESC);
