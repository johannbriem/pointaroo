import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dvtgizlrzukgboxbkioe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2dGdpemxyenVrZ2JveGJraW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NTU5MTcsImV4cCI6MjA2NjAzMTkxN30.XICCHXnXcitXc3wEuNLiY_LPoT3Em8XpWbrFFHvWbjM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
