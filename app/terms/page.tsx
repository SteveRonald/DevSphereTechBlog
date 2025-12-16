import { Card, CardContent } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 md:px-6 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Terms of Service</h1>
        <p className="text-muted-foreground">
          Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
        <Card>
          <CardContent className="pt-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using CodeCraft Academy ("the Website"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">2. Use License</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Permission is granted to temporarily access the materials on CodeCraft Academy's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or for any public display</li>
                <li>Attempt to reverse engineer any software contained on the website</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
                <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
              </ul>
            </section>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">3. User Accounts</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Maintaining the security of your account and password</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
                <li>Ensuring you are at least 13 years old to use this service</li>
              </ul>
            </section>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">4. Content and Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                All content on this website, including but not limited to text, graphics, logos, images, and software, is the property of CodeCraft Academy or its content suppliers and is protected by copyright and other intellectual property laws. You may not:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Reproduce, distribute, or create derivative works from our content without permission</li>
                <li>Use our content for commercial purposes without authorization</li>
                <li>Remove copyright notices or other proprietary markings</li>
              </ul>
            </section>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">5. User-Generated Content</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                If you submit comments, feedback, or other content to our website, you grant us a non-exclusive, royalty-free, perpetual, and worldwide license to use, modify, and publish such content. You represent and warrant that:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>You own or have the right to submit the content</li>
                <li>The content does not violate any third-party rights</li>
                <li>The content is not defamatory, obscene, or illegal</li>
              </ul>
            </section>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">6. Prohibited Uses</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You agree not to use the website:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>In any way that violates any applicable law or regulation</li>
                <li>To transmit any malicious code, viruses, or harmful data</li>
                <li>To impersonate or attempt to impersonate the company or other users</li>
                <li>To engage in any automated use of the system</li>
                <li>To interfere with or disrupt the website or servers</li>
                <li>To collect or harvest information about other users</li>
              </ul>
            </section>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">7. Disclaimer</h2>
              <p className="text-muted-foreground leading-relaxed">
                The materials on CodeCraft Academy's website are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">8. Limitations of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                In no event shall CodeCraft Academy or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on CodeCraft Academy's website, even if we or an authorized representative has been notified orally or in writing of the possibility of such damage.
              </p>
            </section>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">9. Revisions and Errata</h2>
              <p className="text-muted-foreground leading-relaxed">
                The materials appearing on CodeCraft Academy's website could include technical, typographical, or photographic errors. We do not warrant that any of the materials on its website are accurate, complete, or current. We may make changes to the materials contained on its website at any time without notice.
              </p>
            </section>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">10. Links to Third-Party Sites</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our website may contain links to third-party websites. We are not responsible for the content, privacy policies, or practices of third-party websites. Your use of third-party websites is at your own risk.
              </p>
            </section>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">11. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may terminate or suspend your account and access to the website immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the website will cease immediately.
              </p>
            </section>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">12. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms shall be governed by and construed in accordance with applicable laws, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
              </p>
            </section>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">13. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms of Service, please contact us through our{" "}
                <a href="/contact" className="text-primary hover:underline">contact page</a>.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

