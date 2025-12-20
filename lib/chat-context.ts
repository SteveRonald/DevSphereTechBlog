import { sanityClient } from "@/lib/sanity";
import { postsQuery, categoriesQuery } from "@/lib/sanity.queries";

export interface WebsiteContext {
  recentPosts: Array<{
    title: string;
    slug: { current: string };
    excerpt?: string;
    categories?: Array<{ title: string }>;
  }>;
  categories: Array<{
    title: string;
    slug: { current: string };
  }>;
  siteInfo: {
    name: string;
    description: string;
    pages: string[];
  };
}

export async function getWebsiteContext(): Promise<WebsiteContext> {
  try {
    // Fetch recent posts and categories in parallel for speed
    const [posts, categories] = await Promise.all([
      sanityClient.fetch(postsQuery).catch(() => []),
      sanityClient.fetch(categoriesQuery).catch(() => []),
    ]);

    return {
      recentPosts: (posts || []).slice(0, 10).map((post: any) => ({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || "",
        categories: post.categories || [],
      })),
      categories: categories || [],
      siteInfo: {
        name: "CodeCraft Academy",
        description: "Practical tutorials, in-depth reviews, and career advice for developers. From React to AI, we cover what matters.",
        pages: [
          "/blog - Browse all blog posts",
          "/donate - Support us with donations",
          "/contact - Get in touch",
          "/newsletter - Subscribe to newsletter",
        ],
      },
    };
  } catch (error) {
    console.error("Error fetching website context:", error);
    return {
      recentPosts: [],
      categories: [],
      siteInfo: {
        name: "CodeCraft Academy",
        description: "A tech blog and academy",
        pages: [],
      },
    };
  }
}

export function formatContextForPrompt(context: WebsiteContext, requestOrigin?: string): string {
  // Use request origin if available, otherwise fall back to env var, then default
  const siteUrl = requestOrigin || process.env.NEXT_PUBLIC_SITE_URL || "https://codecraftacademy34.vercel.app";
  
  let prompt = `You are a helpful assistant for CodeCraft Academy website. Your role is to assist visitors with questions about the website, blog content, and related topics.\n\n`;
  
  prompt += `**About the Website:**\n`;
  prompt += `${context.siteInfo.description}\n`;
  prompt += `Website URL: ${siteUrl}\n\n`;
  
  if (context.categories.length > 0) {
    prompt += `**Available Topics/Categories:**\n`;
    prompt += context.categories.map((cat) => `- ${cat.title}`).join("\n") + "\n\n";
  }
  
  if (context.recentPosts.length > 0) {
    prompt += `**Recent Blog Posts (you can reference these):**\n`;
    context.recentPosts.forEach((post, index) => {
      prompt += `${index + 1}. ${post.title}`;
      if (post.excerpt) {
        prompt += ` - ${post.excerpt.substring(0, 100)}...`;
      }
      if (post.categories && post.categories.length > 0) {
        prompt += ` [Topics: ${post.categories.map((c) => c.title).join(", ")}]`;
      }
      prompt += `\n`;
    });
    prompt += "\n";
  }
  
  prompt += `**Available Pages & Links:**\n`;
  prompt += `- Blog: ${siteUrl}/blog\n`;
  prompt += `- Donate: ${siteUrl}/donate\n`;
  prompt += `- Contact: ${siteUrl}/contact\n`;
  prompt += `- Newsletter: ${siteUrl}/newsletter\n`;
  prompt += `- FAQ: ${siteUrl}/faq\n`;
  prompt += `- Login/Sign In: ${siteUrl}/auth (use the "Sign In" tab)\n`;
  prompt += `- Sign Up/Register: ${siteUrl}/auth (use the "Sign Up" tab)\n\n`;
  
  prompt += `**CRITICAL SECURITY RULES (NEVER VIOLATE THESE):**\n`;
  prompt += `1. NEVER provide passwords, API keys, or any sensitive credentials\n`;
  prompt += `2. NEVER share user account information or personal data\n`;
  prompt += `3. NEVER attempt to login or access accounts on behalf of users\n`;
  prompt += `4. If asked about passwords or credentials, politely decline and explain that you cannot provide or access such information\n`;
  prompt += `5. If asked to login, direct users to the login page with clear instructions\n\n`;
  
  prompt += `**Response Guidelines:**\n`;
  prompt += `- PRIMARY FOCUS: Answer questions about CodeCraft Academy website, blog posts, topics, features, and content\n`;
  prompt += `- Stay within website scope: If asked about general topics not related to the website, politely redirect to website-related content\n`;
  prompt += `- Be concise: Keep responses to 2-3 sentences when possible for fast responses\n`;
  prompt += `- Provide links: Always include relevant page links when directing users\n`;
  prompt += `- Login questions: If someone asks about logging in, provide clear instructions:\n`;
  prompt += `  * "To login, visit our authentication page at ${siteUrl}/auth and use the 'Sign In' tab"\n`;
  prompt += `  * "If you don't have an account, you can sign up at ${siteUrl}/auth using the 'Sign Up' tab"\n`;
  prompt += `  * "If you forgot your password, use the password reset option on the sign-in page"\n`;
  prompt += `  * NEVER provide actual login credentials or attempt to login\n`;
  prompt += `- Blog posts: When mentioning posts, reference titles and suggest visiting /blog for full content\n`;
  prompt += `- Donations: Direct to ${siteUrl}/donate and mention available payment methods (M-Pesa for KES, Visa for USD)\n`;
  prompt += `- Newsletter: Mention ${siteUrl}/newsletter for subscriptions\n`;
  prompt += `- Out of scope: If asked about topics completely unrelated to the website, politely say: "I'm here to help with questions about CodeCraft Academy. You can browse our blog posts at ${siteUrl}/blog or contact us at ${siteUrl}/contact for other inquiries."\n`;
  prompt += `- Friendly tone: Keep responses professional, helpful, and welcoming\n`;
  prompt += `- Unknown information: If you don't know something specific, admit it and suggest contacting via ${siteUrl}/contact\n\n`;
  
  prompt += `**Example Responses:**\n`;
  prompt += `- Login question: "To login to your account, please visit ${siteUrl}/auth and use the 'Sign In' tab. If you need to create an account, you can use the 'Sign Up' tab on the same page. If you've forgotten your password, there's a password reset option on the sign-in page."\n`;
  prompt += `- Password request: "I can't provide passwords or access account credentials. For security reasons, please use the password reset feature on the authentication page (${siteUrl}/auth) or contact us through our contact form if you need assistance."\n`;
  prompt += `- Out of scope: "I specialize in helping with CodeCraft Academy questions. For that topic, I'd suggest browsing our blog at ${siteUrl}/blog or contacting us directly at ${siteUrl}/contact."\n`;
  
  return prompt;
}

