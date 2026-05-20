import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <div className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        <h1 className="font-display font-black text-4xl mb-2">Terms of Service</h1>
        <p className="text-muted-foreground text-sm mb-12">Last updated: May 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground/80 leading-relaxed">

          <section>
            <h2 className="font-display font-bold text-xl text-foreground mb-3">1. Agreement to Terms</h2>
            <p>By engaging DDalton Designs for any design, web development, or marketing services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-foreground mb-3">2. Services</h2>
            <p>DDalton Designs provides creative services including but not limited to website design and development, logo and brand identity design, marketing materials, and photography. The scope of work for each project will be outlined in a separate project agreement or estimate provided to the client.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-foreground mb-3">3. Payment Terms</h2>
            <p>All projects require a deposit before work begins, as specified in your project estimate or invoice. Final deliverables will not be released until full payment is received. Invoices are due within the timeframe specified on the invoice. Late payments may result in a pause of services.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-foreground mb-3">4. Revisions</h2>
            <p>Each project includes a set number of revision rounds as outlined in the project agreement. Additional revisions beyond the included scope may be billed at an hourly rate. Revision requests must be submitted in writing via email or the client portal.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-foreground mb-3">5. Intellectual Property & Ownership</h2>
            <p>Upon receipt of full payment, the client will own the final approved deliverables. DDalton Designs retains the right to display completed work in our portfolio and marketing materials unless otherwise agreed in writing. All preliminary concepts, drafts, and unused designs remain the property of DDalton Designs.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-foreground mb-3">6. Client Responsibilities</h2>
            <p>Clients are responsible for providing accurate content, feedback, and approvals in a timely manner. Delays caused by the client may result in project timeline extensions or additional fees. Clients warrant that any materials provided (text, images, logos) do not infringe on any third-party intellectual property rights.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-foreground mb-3">7. Cancellation</h2>
            <p>If a client cancels a project after work has begun, any deposit paid is non-refundable. If significant work has been completed beyond the deposit amount, an additional invoice may be issued for hours worked. DDalton Designs reserves the right to terminate a project if a client is abusive, unresponsive, or in breach of these terms.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-foreground mb-3">8. Limitation of Liability</h2>
            <p>DDalton Designs shall not be liable for any indirect, incidental, or consequential damages arising from the use of our services or deliverables. Our total liability shall not exceed the amount paid for the specific project in question.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-foreground mb-3">9. Governing Law</h2>
            <p>These Terms of Service shall be governed by and construed in accordance with the laws of the United States. Any disputes shall be resolved through good-faith negotiation, and if necessary, binding arbitration.</p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-foreground mb-3">10. Contact</h2>
            <p>For questions about these Terms of Service, please contact us at <a href="mailto:derek@ddaltondesigns.com" className="text-accent underline">derek@ddaltondesigns.com</a>.</p>
          </section>

        </div>
      </div>
      <PublicFooter />
    </div>
  );
}