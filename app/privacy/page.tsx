import { Card, CardContent } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 md:px-6 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground">
          Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
        <Card>
          <CardContent className="pt-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                Welcome to CodeCraft Academy ("we," "our," or "us"). We are committed to protecting your privacy and ensuring you have a positive experience on our website. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.
              </p>
            </section>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">2.1 Information You Provide</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Name and email address when you subscribe to our newsletter</li>
                    <li>Account information when you create a profile</li>
                    <li>Contact information when you reach out to us</li>
                    <li>Comments and feedback you submit</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">2.2 Automatically Collected Information</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>IP address and browser type</li>
                    <li>Pages visited and time spent on pages</li>
                    <li>Referring website addresses</li>
                    <li>Device information and operating system</li>
                  </ul>
                </div>
              </div>
            </section>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>To send you newsletters and updates (with your consent)</li>
                <li>To respond to your inquiries and provide customer support</li>
                <li>To improve our website and user experience</li>
                <li>To analyze website usage and trends</li>
                <li>To prevent fraud and ensure security</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">4. Data Storage and Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use industry-standard security measures to protect your information. Your data is stored securely using Supabase (PostgreSQL database) and Sanity.io (content management). We implement appropriate technical and organizational measures to safeguard your personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">5. Third-Party Services</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We use the following third-party services that may collect information:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li><strong>Supabase:</strong> User authentication and database storage</li>
                <li><strong>Sanity.io:</strong> Content management system</li>
                <li><strong>Resend:</strong> Email delivery service</li>
                <li><strong>Vercel:</strong> Website hosting and analytics</li>
              </ul>
            </section>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">6. Cookies and Tracking</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar tracking technologies to enhance your experience, analyze site traffic, and personalize content. You can control cookie preferences through your browser settings. Note that disabling cookies may affect website functionality.
              </p>
            </section>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">7. Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Unsubscribe from newsletters at any time</li>
                <li>Object to processing of your data</li>
                <li>Data portability</li>
              </ul>
            </section>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">8. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our website is not intended for children under 13 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
              </p>
            </section>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">9. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">10. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us through our{" "}
                <a href="/contact" className="text-primary hover:underline">contact page</a>.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}






