
import os
from supabase import create_client, Client

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Missing Supabase credentials")
    exit(1)

supabase: Client = create_client(url, key)

try:
    print("Checking 'students' table columns...")
    # This is a hacky way to get columns via RPC or just query one row
    res = supabase.from_('students').select('*').limit(1).execute()
    if res.data:
        print("Columns found in first row:", res.data[0].keys())
    else:
        print("No data in students table or error.")

    print("\nChecking specifically for NIS 12105...")
    res = supabase.from_('students').select('id, nis, pin, full_name').eq('nis', '12105').execute()
    if res.data:
        print("Student found:", res.data[0])
    else:
        print("Student with NIS 12105 not found.")

except Exception as e:
    print("Error:", e)
