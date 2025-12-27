/**
 * Email Testing Script
 * 
 * This script tests all email endpoints in the application.
 * Run with: npx tsx scripts/test-emails.ts
 * 
 * Make sure to set up your environment variables first:
 * - RESEND_API_KEY or GMAIL_USER + GMAIL_APP_PASSWORD
 * - NEXT_PUBLIC_SITE_URL
 * - CONTACT_EMAIL
 */

import { resolve } from "path";

// Try to load dotenv if available
try {
  const { config } = require("dotenv");
  config({ path: resolve(process.cwd(), ".env.local") });
  config({ path: resolve(process.cwd(), ".env") });
} catch {
  // dotenv not available, use process.env directly
}

// Use localhost for local testing, or the configured URL
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL?.includes("localhost") || 
                 process.env.NEXT_PUBLIC_SITE_URL?.includes("127.0.0.1") ||
                 !process.env.NEXT_PUBLIC_SITE_URL ||
                 process.env.NEXT_PUBLIC_SITE_URL === "https://your-project.vercel.app"
  ? "http://localhost:3000"
  : process.env.NEXT_PUBLIC_SITE_URL;
const API_URL = `${BASE_URL}/api`;

interface TestResult {
  name: string;
  endpoint: string;
  method: string;
  success: boolean;
  status?: number;
  message?: string;
  error?: string;
}

const results: TestResult[] = [];

async function testEndpoint(
  name: string,
  endpoint: string,
  method: "GET" | "POST" | "PATCH" = "POST",
  body?: any,
  headers?: Record<string, string>
): Promise<TestResult> {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    console.log(`   ${method} ${endpoint}`);

    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    if (body && method !== "GET") {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);
    
    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    let data: any;
    
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      // If it's an HTML error page, try to extract error info
      if (text.includes("Error") || text.includes("error")) {
        data = { error: `Server returned HTML instead of JSON. Status: ${response.status}` };
      } else {
        data = { error: `Unexpected response format. Status: ${response.status}` };
      }
    }

    const result: TestResult = {
      name,
      endpoint,
      method,
      success: response.ok,
      status: response.status,
      message: data.message || data.success ? "Email sent successfully" : data.error,
      error: response.ok ? undefined : data.error || "Unknown error",
    };

    if (result.success) {
      console.log(`   ✅ Success: ${result.message}`);
      if (data.method) {
        console.log(`   📧 Method: ${data.method}`);
      }
      if (data.sent !== undefined) {
        console.log(`   📊 Sent: ${data.sent}/${data.total || 0}`);
      }
    } else {
      console.log(`   ❌ Failed: ${result.error}`);
    }

    return result;
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
    return {
      name,
      endpoint,
      method,
      success: false,
      error: error.message,
    };
  }
}

async function runTests() {
  console.log("=".repeat(60));
  console.log("📧 EMAIL TESTING SCRIPT");
  console.log("=".repeat(60));
  console.log(`\nBase URL: ${BASE_URL}`);
  console.log(`API URL: ${API_URL}\n`);

  // Check environment variables
  console.log("\n📋 Environment Check:");
  const hasResend = !!process.env.RESEND_API_KEY;
  const hasGmail = !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
  const hasContactEmail = !!(
    process.env.CONTACT_EMAIL ||
    process.env.RESEND_TO_EMAIL ||
    process.env.GMAIL_USER
  );

  console.log(`   Resend API Key: ${hasResend ? "✅ Set" : "❌ Missing"}`);
  console.log(`   Gmail Config: ${hasGmail ? "✅ Set" : "❌ Missing"}`);
  console.log(`   Contact Email: ${hasContactEmail ? "✅ Set" : "❌ Missing"}`);

  if (!hasResend && !hasGmail) {
    console.log(
      "\n⚠️  WARNING: No email service configured. Tests will fail."
    );
  }

  // Test 1: Contact Form
  console.log("\n" + "=".repeat(60));
  console.log("1. CONTACT FORM");
  console.log("=".repeat(60));
  results.push(
    await testEndpoint(
      "Contact Form Submission",
      "/contact",
      "POST",
      {
        name: "Test User",
        email: "test@example.com",
        subject: "Test Email",
        message: "This is a test message from the email testing script.",
      }
    )
  );

  // Test 2: New Course Notification
  console.log("\n" + "=".repeat(60));
  console.log("2. NEW COURSE NOTIFICATION");
  console.log("=".repeat(60));
  results.push(
    await testEndpoint(
      "New Course Published",
      "/newsletter/notify-new-course",
      "POST",
      {
        course: {
          id: "test-course-id",
          title: "Test Course - Email Testing",
          slug: "test-course-email-testing",
          short_description: "This is a test course for email notifications",
          thumbnail_url: "https://via.placeholder.com/400x300",
          category: "Testing",
          difficulty_level: "beginner",
        },
      }
    )
  );

  // Test 3: Course Update Notification
  console.log("\n" + "=".repeat(60));
  console.log("3. COURSE UPDATE NOTIFICATION");
  console.log("=".repeat(60));
  results.push(
    await testEndpoint(
      "Course Updated",
      "/newsletter/notify-updated-course",
      "POST",
      {
        course: {
          id: "test-course-id",
          title: "Test Course - Updated",
          slug: "test-course-email-testing",
          short_description: "This course has been updated with new content",
          thumbnail_url: "https://via.placeholder.com/400x300",
          category: "Testing",
          difficulty_level: "beginner",
        },
      }
    )
  );

  // Test 4: User Registration Notification
  console.log("\n" + "=".repeat(60));
  console.log("4. USER REGISTRATION NOTIFICATION");
  console.log("=".repeat(60));
  results.push(
    await testEndpoint(
      "User Registration",
      "/users/notify-registration",
      "POST",
      {
        email: "newuser@example.com",
        userId: "test-user-id-123",
      }
    )
  );

  // Test 5: User Sign-In Notification
  console.log("\n" + "=".repeat(60));
  console.log("5. USER SIGN-IN NOTIFICATION");
  console.log("=".repeat(60));
  results.push(
    await testEndpoint(
      "User Sign-In",
      "/auth/notify-signin",
      "POST",
      {
        email: "user@example.com",
        userId: "test-user-id-123",
        userAgent: "Mozilla/5.0 (Test Browser)",
        ip: "192.168.1.1",
      }
    )
  );

  // Test 6: Newsletter New Post (requires actual post data)
  console.log("\n" + "=".repeat(60));
  console.log("6. NEWSLETTER - NEW POST");
  console.log("=".repeat(60));
  console.log("   ⚠️  Skipping - Requires actual Sanity post data");
  console.log("   💡 Test this manually by publishing a post in Sanity CMS");

  // Test 7: Donation Thank You
  console.log("\n" + "=".repeat(60));
  console.log("7. DONATION THANK YOU");
  console.log("=".repeat(60));
  results.push(
    await testEndpoint(
      "Donation Thank You",
      "/donate/send-thank-you",
      "POST",
      {
        email: "donor@example.com",
        amount: 25.00,
        name: "Test Donor",
      }
    )
  );

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(60));

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const total = results.length;

  console.log(`\nTotal Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  console.log("\n📋 Detailed Results:");
  results.forEach((result, index) => {
    const icon = result.success ? "✅" : "❌";
    console.log(
      `\n${index + 1}. ${icon} ${result.name}`
    );
    console.log(`   Endpoint: ${result.method} ${result.endpoint}`);
    if (result.status) {
      console.log(`   Status: ${result.status}`);
    }
    if (result.message) {
      console.log(`   Message: ${result.message}`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log("\n" + "=".repeat(60));
  console.log("💡 NOTES");
  console.log("=".repeat(60));
  console.log(`
1. Quiz/Project Review Emails:
   - These require actual submissions and admin review
   - Test by: Submit quiz/project → Admin reviews → Check student email

2. Newsletter New Post:
   - Triggered by Sanity webhook when post is published
   - Test by: Publish post in Sanity CMS → Check subscriber emails

3. Course Rating:
   - Not an email endpoint, but can be tested via:
   - POST /api/courses/[courseId]/rate with rating and comment

4. Settings Check:
   - Some emails check system_settings before sending
   - Ensure settings are enabled in admin dashboard

5. Email Service:
   - Primary: Resend (if RESEND_API_KEY is set)
   - Fallback: Gmail SMTP (if GMAIL_USER + GMAIL_APP_PASSWORD are set)
  `);

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});

