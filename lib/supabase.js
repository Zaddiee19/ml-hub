import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://tldxtwbiwquksalltrci.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsZHh0d2Jpd3F1a3NhbGx0cmNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NTg3NTAsImV4cCI6MjA5MTAzNDc1MH0.CDxCWeScgbbDbjXgoiRR3Z5MRUWrDSa1U_UGWNN3jbM";

export const supabase = createClient(supabaseUrl, supabaseKey);