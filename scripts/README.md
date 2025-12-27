# Scripts Directory

This directory contains utility scripts for testing and database management.

## Email Testing Script

**File**: `test-emails.ts`

Tests all email endpoints in the application.

### Usage

```bash
# Install dependencies (if not already installed)
npm install tsx

# Run the test script
npx tsx scripts/test-emails.ts
```

### What it tests

1. ✅ Contact Form Submission
2. ✅ New Course Notification
3. ✅ Course Update Notification
4. ✅ User Registration Notification
5. ✅ User Sign-In Notification
6. ⚠️ Newsletter New Post (requires manual Sanity trigger)
7. ✅ Donation Thank You

### Prerequisites

Set these environment variables in `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
RESEND_API_KEY=your_resend_key  # OR
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_app_password
CONTACT_EMAIL=admin@yourdomain.com
```

## Create Course Ratings Table Script

**File**: `create-course-ratings-table.ts`

Helps create the `course_ratings` table in Supabase.

### Usage

```bash
npx tsx scripts/create-course-ratings-table.ts
```

### Manual Alternative

1. Go to Supabase Dashboard → SQL Editor
2. Copy SQL from `database/migrations/create_course_ratings.sql`
3. Paste and run

### Prerequisites

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Notes

- All scripts use TypeScript and require `tsx` to run
- Make sure your `.env.local` file is properly configured
- The email test script will show which email service is being used (Resend/Gmail)
- Some tests may fail if the required data doesn't exist (e.g., subscribers, courses)

