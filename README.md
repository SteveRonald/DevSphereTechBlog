# CodeCraft Academy - Tech Blog

A modern tech blog built with Next.js 14, Sanity.io, and Supabase.

## 🚀 Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **CMS:** Sanity.io (for blog posts, categories, authors)
- **Database:** Supabase (PostgreSQL for users, authentication, newsletter)
- **Email:** Resend (primary) with Gmail App Password fallback (for sign-in notifications), Resend (for contact form)
- **Deployment:** Vercel (recommended)

## 📋 Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_database_url

# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your_sanity_token

# Email - Gmail App Password (for sign-in notifications)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your_16_character_app_password

# Email - Resend (for contact form)
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=CodeCraft Academy <onboarding@resend.dev>
CONTACT_EMAIL=your-email@gmail.com

# Contact Information (shown on contact page)
NEXT_PUBLIC_CONTACT_EMAIL=your-email@gmail.com
NEXT_PUBLIC_CONTACT_PHONE=+1234567890

# Site URL
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### 2. Gmail App Password Setup

1. Go to your Google Account → Security
2. Enable 2-Step Verification (if not already enabled)
3. Go to App Passwords
4. Generate a new app password for "Mail"
5. Copy the 16-character password
6. Add to `.env` as `GMAIL_APP_PASSWORD`

### 3. Database Setup

Run the schema script:

```bash
node scripts/run-supabase-schema.js
node scripts/add-admin-column.js
node scripts/add-unsubscribe-fields.js
node scripts/add-device-tracking-fields.js
```

### 4. Make Yourself Admin

In Supabase SQL Editor:

```sql
UPDATE user_profiles 
SET is_admin = TRUE 
WHERE email = 'your-email@example.com';
```

### 5. Install Dependencies

```bash
npm install
```

### 6. Run Development Server

```bash
npm run dev
```

## 📝 Features

- ✅ Blog posts with Sanity CMS
- ✅ User authentication (Supabase)
- ✅ Newsletter subscriptions
- ✅ Contact form
- ✅ Email notifications (sign-in, registration)
- ✅ Device/location tracking
- ✅ 2FA recommendations for new devices
- ✅ Admin-only CMS access
- ✅ Responsive design
- ✅ Dark/light mode

## 🔐 Security Features

- Email confirmation on signup (Supabase)
- Sign-in email notifications (Gmail App Password)
- Device/location tracking
- 2FA recommendations for new devices
- Admin-only studio access

## 📚 Documentation

- See `CONTENT_CREATION_GUIDE.md` for creating posts
- See `ADMIN_SETUP.md` for admin configuration  
- See `POSTS_AND_CATEGORIES_GUIDE.md` for category setup
- See `GMAIL_SETUP.md` for Gmail App Password setup

## 🚀 Deployment

See `VERCEL_DEPLOYMENT.md` for detailed deployment instructions.

**Quick Deploy:**
1. Push to GitHub
2. Import project in Vercel
3. Add environment variables (see `SECURITY_CHECKLIST.md`)
4. Deploy!

## 🔒 Security

See `SECURITY_CHECKLIST.md` for:
- Security audit results
- Pre-deployment checklist
- Post-deployment monitoring

## 📧 Support

For questions, contact: [your-email@gmail.com](mailto:your-email@gmail.com)
