-- Schema definition for the application database

-- Ensure necessary extensions are enabled (optional, Supabase often enables them by default)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- For gen_random_uuid() if not default

-- Define custom types first
CREATE TYPE public.transformation_status AS ENUM (
    'created',       -- Job created, awaiting payment or processing
    'pending',       -- Payment received, awaiting processing start
    'processing',    -- Image transformation in progress
    'completed',     -- Transformation successful
    'error'          -- Transformation failed
);

-- Table: users
-- Stores user profile information, extending Supabase auth users.
CREATE TABLE public.users (
    id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Links to Supabase auth user
    email text NULL UNIQUE,
    full_name text NULL,
    avatar_url text NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NULL,
    stripe_customer_id text NULL UNIQUE, -- Stores the Stripe customer ID for subscriptions/payments
    CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- Comment: The handle_updated_at function is typically provided by Supabase
-- or needs to be created separately. It updates the updated_at column.
-- Example function (if needed):
-- CREATE OR REPLACE FUNCTION public.handle_updated_at()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   NEW.updated_at = now();
--   RETURN NEW;
-- END;
-- $$ language 'plpgsql';

-- Trigger: on_users_updated
-- Automatically updates the updated_at timestamp when a user row is modified.
CREATE TRIGGER on_users_updated
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at(); -- Assumes handle_updated_at() exists

-- Table: styles
-- Defines the available artistic styles for image transformation.
CREATE TABLE public.styles (
    id text NOT NULL, -- Unique identifier for the style (e.g., 'ghibli', 'pixel-art')
    name text NOT NULL, -- Display name of the style
    description text NULL, -- Optional description
    example_image_url text NULL, -- URL for an image showcasing the style
    is_limited_edition boolean NOT NULL DEFAULT false, -- Flag for special styles
    is_active boolean NOT NULL DEFAULT true, -- Whether the style is currently available for selection
    prompt_template text NULL, -- Template for generating the AI prompt (can include placeholders)
    "order" integer NULL DEFAULT 0, -- Order in which styles should be displayed
    CONSTRAINT styles_pkey PRIMARY KEY (id)
);

-- Table: transformations
-- Records each image transformation job requested by users.
CREATE TABLE public.transformations (
    id uuid NOT NULL DEFAULT gen_random_uuid(), -- Unique identifier for the transformation job
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, -- User who requested the transformation
    style_requested text NOT NULL REFERENCES public.styles(id), -- The style used for transformation
    status public.transformation_status NOT NULL DEFAULT 'created'::public.transformation_status, -- Current status of the job
    input_file_path text NULL, -- Path/URL to the original uploaded image in storage
    output_file_path text NULL, -- Path/URL to the transformed image in storage
    output_metadata jsonb NULL, -- Any metadata returned by the transformation process (e.g., AI model details)
    error_message text NULL, -- Stores error details if the job fails
    stripe_charge_id text NULL UNIQUE, -- Stripe Charge or Payment Intent ID associated with this job
    created_at timestamp with time zone NOT NULL DEFAULT now(), -- When the job record was created
    processing_started_at timestamp with time zone NULL, -- When the actual image processing began
    completed_at timestamp with time zone NULL, -- When the job finished (successfully or with error)
    CONSTRAINT transformations_pkey PRIMARY KEY (id)
);

-- Indexes for faster querying on transformations table
CREATE INDEX IF NOT EXISTS idx_transformations_user_id ON public.transformations USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_transformations_status ON public.transformations USING btree (status);
CREATE INDEX IF NOT EXISTS idx_transformations_created_at ON public.transformations USING btree (created_at DESC); -- Often queried by newest

-- End of schema definition
