import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <div className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        <h1 className="font-display font-black text-4xl mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm mb-12">Last updated: May 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground/80 leading-relaxed">

          <section>
            <h2 className="font-display font-bold text-xl text-foreground mb-3">1. Introduction</h2>
            <p>DDalton Designs ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal information when you use our website or engage our services.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-foreground mb-3">2. Information We Collect</h2>
            <p>We may collect the following types of information:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Contact information:</strong> Name, email address, and phone number provided through our contact form or client portal.</li>
              <li><strong>Project information:</strong> Details about your business, project requirements, and budget you share with us.</li>
              <li><strong>Usage data:</strong> Basic analytics about how you interact with our website (pages visited, time on site).</li>
              <li><strong>Communications:</strong> Messages and correspondence exchanged through our client portal or email.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-foreground mb-3">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Respond to project inquiries and communicate about your project.</li>
              <li>Prepare and deliver estimates, invoices, and project plans.</li>
              <li>Provide access to the client portal and manage your projects.</li>
              <li>Improve our website and services.</li>
              <li>Comply with legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-foreground mb-3">4. Information Sharing</h2>
            <p>We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>With service providers who assist in operating our business (e.g., email services, hosting).</li>
              <li>When required by law or to protect our legal rights.</li>
              <li>With your explicit consent.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-foreground mb-3">5. Data Security</h2>
            <p>We implement reasonable security measures to protect your personal information from unauthorized access, alteration, or disclosure. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-foreground mb-3">6. Data Retention</h2>
            <p>We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy, comply with legal obligations, or resolve disputes. Client project records are typically retained for a minimum of 3 years.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-foreground mb-3">7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Request access to the personal information we hold about you.</li>
              <li>Request correction of inaccurate information.</li>
              <li>Request deletion of your personal data, subject to legal obligations.</li>
              <li>Opt out of marketing communications at any time.</li>
            </ul>
            <p className="mt-2">To exercise any of these rights, please contact us at <a href="mailto:derek@ddaltondesigns.com" className="text-accent underline">derek@ddaltondesigns.com</a>.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-foreground mb-3">8. Cookies</h2>
            <p>Our website may use cookies to enhance your browsing experience. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. Some features of our site may not function properly without cookies.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-foreground mb-3">9. Third-Party Links</h2>
            <p>Our website may contain links to third-party websites. We are not responsible for the privacy practices or content of those sites and encourage you to review their privacy policies.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-foreground mb-3">10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify clients of significant changes via email or through the client portal. Continued use of our services after changes are posted constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-foreground mb-3">11. Contact</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:derek@ddaltondesigns.com" className="text-accent underline">derek@ddaltondesigns.com</a>.</p>
          </section>

        </div>
      </div>
      <PublicFooter />
    </div>
  );
}