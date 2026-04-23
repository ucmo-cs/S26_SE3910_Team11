-- V1__initial_schema.sql
-- Commerce Bank Appointment System — initial schema
-- Mirrors the Supabase/PostgreSQL schema from the original project

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ───────────────────────────────────────────
-- appointments
-- ───────────────────────────────────────────
CREATE TABLE appointments (
    id            UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    topic_id      INT         NOT NULL,
    topic_name    VARCHAR(120) NOT NULL,
    branch_id     INT         NOT NULL,
    branch_name   VARCHAR(200) NOT NULL,
    branch_address VARCHAR(300) NOT NULL,
    date          DATE        NOT NULL,
    time          TIME        NOT NULL,
    first_name    VARCHAR(80)  NOT NULL,
    last_name     VARCHAR(80)  NOT NULL,
    email         VARCHAR(255) NOT NULL,
    phone         VARCHAR(40)  NOT NULL DEFAULT '',
    status        VARCHAR(30)  NOT NULL DEFAULT 'confirmed',
    staff_notes   TEXT         NOT NULL DEFAULT '',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT chk_status CHECK (status IN ('confirmed','cancelled','completed','no_show','pending_action'))
);

CREATE INDEX idx_appointments_branch_date ON appointments (branch_id, date);
CREATE INDEX idx_appointments_email       ON appointments (email);
CREATE INDEX idx_appointments_date        ON appointments (date DESC);

-- ───────────────────────────────────────────
-- appointment_history  (change-log / audit trail per row)
-- ───────────────────────────────────────────
CREATE TABLE appointment_history (
    id               UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    appointment_id   UUID        NOT NULL,
    actor_role       VARCHAR(20) NOT NULL DEFAULT 'system',
    changed_fields   JSONB       NOT NULL DEFAULT '{}',
    old_values       JSONB       NOT NULL DEFAULT '{}',
    new_values       JSONB       NOT NULL DEFAULT '{}',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_appt_history_appointment ON appointment_history (appointment_id);
CREATE INDEX idx_appt_history_created_at  ON appointment_history (created_at DESC);

-- ───────────────────────────────────────────
-- audit_log  (explicit employee action log)
-- ───────────────────────────────────────────
CREATE TABLE audit_log (
    id               UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    actor_role       VARCHAR(20) NOT NULL,
    action           VARCHAR(80) NOT NULL,
    appointment_id   UUID,
    details          JSONB       NOT NULL DEFAULT '{}',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_created_at ON audit_log (created_at DESC);

-- ───────────────────────────────────────────
-- rate_limit_log
-- ───────────────────────────────────────────
CREATE TABLE rate_limit_log (
    id         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    email      VARCHAR(255) NOT NULL,
    ip_address VARCHAR(64)  NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_rate_limit_email      ON rate_limit_log (email, created_at);
CREATE INDEX idx_rate_limit_ip_address ON rate_limit_log (ip_address, created_at);
