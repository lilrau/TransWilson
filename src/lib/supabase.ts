import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://uidftoujrwepfookqemp.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpZGZ0b3VqcndlcGZvb2txZW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MzI4NjksImV4cCI6MjA1OTMwODg2OX0.792l7WswRWK9tS1VjpfGSXrgjmj0tCyMG3A_a9tKW0I')

const { data, error } = await supabase
  .from('todos')
  .select()
  console.log(data, error);