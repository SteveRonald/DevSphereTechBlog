import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Frequently Asked Questions - CodeCraft Academy",
  description: "Find answers to common questions about CodeCraft Academy, our blog, courses, and services.",
};

const faqs = [
  {
    category: "General",
    questions: [
      {
        question: "What is CodeCraft Academy?",
        answer: "CodeCraft Academy is a tech blog and learning platform that provides practical tutorials, in-depth reviews, and career advice for developers. We cover topics from React to AI, focusing on what matters most to modern developers.",
      },
      {
        question: "Is CodeCraft Academy free?",
        answer: "Yes! Most of our content, including blog posts and tutorials, is completely free. We may offer premium courses in the future, but our core educational content remains accessible to everyone.",
      },
      {
        question: "How can I stay updated with new posts?",
        answer: "You can subscribe to our newsletter to receive notifications about new blog posts, tutorials, and updates. Simply visit the newsletter page and enter your email address.",
      },
    ],
  },
  {
    category: "Blog & Content",
    questions: [
      {
        question: "What topics do you cover?",
        answer: "We cover a wide range of topics including web development (React, Next.js, TypeScript), backend development, AI and machine learning, DevOps, and career advice for developers. Browse our categories to see all topics.",
      },
      {
        question: "How often do you publish new content?",
        answer: "We publish new blog posts regularly. Subscribe to our newsletter to get notified whenever we publish new content.",
      },
      {
        question: "Can I suggest a topic?",
        answer: "Absolutely! We love hearing from our community. You can contact us through our contact form with your topic suggestions, and we'll consider them for future posts.",
      },
    ],
  },
  {
    category: "Support & Donations",
    questions: [
      {
        question: "How can I support CodeCraft Academy?",
        answer: "You can support us by making a donation through our donation page. We accept payments via M-Pesa (KES) and bank transfers (USD). Your support helps us create more free content for the developer community.",
      },
      {
        question: "Do you offer courses or mentorship?",
        answer: "Currently, we focus on blog posts and tutorials. We're always exploring new ways to help developers learn. Stay tuned for updates on courses and mentorship programs.",
      },
      {
        question: "How can I contact you?",
        answer: "You can reach us through our contact form on the website. We typically respond within 24-48 hours. You can also use our chatbot to ask questions about the website.",
      },
    ],
  },
  {
    category: "Technical",
    questions: [
      {
        question: "Can I share your content?",
        answer: "Yes! We encourage sharing our content. Please provide proper attribution and a link back to the original post. If you're republishing content, please contact us first.",
      },
      {
        question: "Do you accept guest posts?",
        answer: "We occasionally accept guest posts from experienced developers. If you're interested, please contact us through our contact form with your idea and a writing sample.",
      },
      {
        question: "How can I report an error or issue?",
        answer: "If you find any errors in our content or experience technical issues with the website, please contact us through our contact form. We appreciate your feedback!",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-muted/30 py-12 border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 md:px-6">
          <div className="flex items-center gap-3 mb-4">
            <HelpCircle className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Frequently Asked Questions
            </h1>
          </div>
          <p className="text-muted-foreground max-w-3xl">
            Find answers to common questions about CodeCraft Academy. 
            Can't find what you're looking for? Try our chatbot or contact us directly.
          </p>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="container max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="space-y-8">
          {faqs.map((category, categoryIndex) => (
            <Card key={categoryIndex}>
              <CardHeader>
                <CardTitle>{category.category}</CardTitle>
                <CardDescription>
                  Common questions about {category.category.toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {category.questions.map((faq, index) => (
                    <AccordionItem
                      key={index}
                      value={`item-${categoryIndex}-${index}`}
                    >
                      <AccordionTrigger className="text-left font-medium">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Help Section */}
        <Card className="mt-8 border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle>Still have questions?</CardTitle>
            <CardDescription>
              We're here to help! Get in touch with us.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/contact"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Contact Us
              </a>
              <a
                href="/newsletter"
                className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
              >
                Subscribe to Newsletter
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


