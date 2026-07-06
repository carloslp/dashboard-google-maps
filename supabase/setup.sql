-- Supabase Setup SQL Script
-- Run this script in the Supabase SQL Editor to set up your database schema.

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create places table
CREATE TABLE IF NOT EXISTS public.places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    website TEXT,
    phone_number TEXT,
    reviews_count INTEGER,
    reviews_average NUMERIC(3, 2), -- e.g. 4.85
    place_type TEXT,
    opens_at TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure uniqueness by name and address for upsert operation
    CONSTRAINT unique_name_address UNIQUE (name, address)
);

-- Index for faster lookup and uniqueness performance
CREATE INDEX IF NOT EXISTS places_name_address_idx ON public.places (name, address);

-- Create a function to update the updated_at column automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the trigger
CREATE OR REPLACE TRIGGER update_places_updated_at
    BEFORE UPDATE ON public.places
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access to select, insert, update and delete
CREATE POLICY "Allow authenticated users to read places"
    ON public.places
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert places"
    ON public.places
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update places"
    ON public.places
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete places"
    ON public.places
    FOR DELETE
    TO authenticated
    USING (true);
