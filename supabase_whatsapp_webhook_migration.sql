-- ==============================================================================
-- GLOBAL ERA TECHNICAL SCHOOL & KITE TVET MANAGEMENT SYSTEM
-- SUPABASE POSTGRESQL MIGRATION: META WHATSAPP CLOUD API & WEBHOOK
-- ==============================================================================

-- 1. WhatsApp Message Logs Table
CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    phone TEXT NOT NULL,
    direction TEXT NOT NULL DEFAULT 'outbound' CHECK (direction IN ('outbound', 'inbound')),
    message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'template', 'document', 'interactive')),
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
    content TEXT,
    meta_message_id TEXT,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for lightning-fast phone lookup
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_phone ON public.whatsapp_logs(phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_created_at ON public.whatsapp_logs(created_at DESC);

-- 2. WhatsApp Inbound Messages & Interactive Bot Events
CREATE TABLE IF NOT EXISTS public.whatsapp_inbound_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sender_phone TEXT NOT NULL,
    sender_name TEXT,
    message_text TEXT,
    meta_message_id TEXT UNIQUE,
    processed BOOLEAN DEFAULT FALSE,
    bot_reply_sent TEXT,
    lead_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_inbound_phone ON public.whatsapp_inbound_events(sender_phone);

-- 3. Automatic Trigger: Auto-Capture Inbound WhatsApp Inquiries into ERP Leads
CREATE OR REPLACE FUNCTION public.fn_auto_capture_whatsapp_lead()
RETURNS TRIGGER AS $$
DECLARE
    clean_phone TEXT;
    existing_lead_id TEXT;
    existing_student_id TEXT;
    new_lead_id TEXT;
BEGIN
    clean_phone := regexp_replace(NEW.sender_phone, '\D', '', 'g');
    -- Strip country code 977 if present to match 10-digit format
    IF length(clean_phone) = 12 AND clean_phone LIKE '977%' THEN
        clean_phone := substring(clean_phone FROM 4);
    END IF;

    -- Check if sender is already an enrolled student
    SELECT id INTO existing_student_id FROM public.students WHERE phone = clean_phone LIMIT 1;
    
    -- Check if sender is already an existing lead
    SELECT id INTO existing_lead_id FROM public.leads WHERE phone = clean_phone LIMIT 1;

    -- If sender is brand new, automatically create a high-priority CRM lead!
    IF existing_student_id IS NULL AND existing_lead_id IS NULL THEN
        new_lead_id := 'LEAD-WA-' || to_char(NOW(), 'YYMMDD') || '-' || substring(md5(random()::text) FROM 1 FOR 4);
        
        INSERT INTO public.leads (
            id,
            name,
            phone,
            source,
            stage,
            priority,
            notes,
            created_at,
            updated_at
        ) VALUES (
            new_lead_id,
            COALESCE(NEW.sender_name, 'WhatsApp Visitor (' || clean_phone || ')'),
            clean_phone,
            'WhatsApp Inquiry',
            'New Inquiry',
            'High',
            'Auto-captured from WhatsApp message: "' || LEFT(NEW.message_text, 100) || '"',
            NOW(),
            NOW()
        );

        NEW.lead_id := new_lead_id;
    ELSIF existing_lead_id IS NOT NULL THEN
        NEW.lead_id := existing_lead_id;
    END IF;

    NEW.processed := TRUE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_capture_whatsapp_lead ON public.whatsapp_inbound_events;
CREATE TRIGGER trg_auto_capture_whatsapp_lead
BEFORE INSERT ON public.whatsapp_inbound_events
FOR EACH ROW
EXECUTE FUNCTION public.fn_auto_capture_whatsapp_lead();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_inbound_events ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (Admin / Staff) full access
DROP POLICY IF EXISTS "Authenticated users full access to whatsapp_logs" ON public.whatsapp_logs;
CREATE POLICY "Authenticated users full access to whatsapp_logs"
    ON public.whatsapp_logs FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users full access to whatsapp_inbound_events" ON public.whatsapp_inbound_events;
CREATE POLICY "Authenticated users full access to whatsapp_inbound_events"
    ON public.whatsapp_inbound_events FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow service_role (Edge Functions / Webhooks) full insert access
DROP POLICY IF EXISTS "Service role access for whatsapp_logs" ON public.whatsapp_logs;
CREATE POLICY "Service role access for whatsapp_logs"
    ON public.whatsapp_logs FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Service role access for whatsapp_inbound_events" ON public.whatsapp_inbound_events;
CREATE POLICY "Service role access for whatsapp_inbound_events"
    ON public.whatsapp_inbound_events FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ==============================================================================
-- END OF SUPABASE WHATSAPP WEBHOOK MIGRATION
-- ==============================================================================
