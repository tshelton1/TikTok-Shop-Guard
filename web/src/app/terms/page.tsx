export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <a
        href="/"
        className="mb-8 inline-block text-sm text-gray-500 hover:text-gray-700"
      >
        ← Back to home
      </a>
      <h1 className="mb-2 text-3xl font-bold">Terms of Service</h1>
      <p className="mb-1 text-sm text-gray-500">Last updated: July 13, 2026</p>
      <p className="mb-12 text-sm text-gray-500">Effective date: July 13, 2026</p>

      <p className="mb-6 leading-relaxed">
        These Terms of Service ("Terms") govern your access to and use of
        TikTok Shop Guard (the "Service"), a web application operated by
        Metamorphosis LLC, a Florida limited liability company ("Company,"
        "we," "us," or "our"), available at tiktokshopguard.com. By creating
        an account or using the Service, you agree to be bound by these Terms
        and our Privacy Policy. If you do not agree, do not use the Service.
      </p>

      <div className="mb-10 rounded border-l-4 border-gray-300 bg-gray-50 px-5 py-4 text-sm leading-relaxed text-gray-700">
        <strong>Important notice:</strong> TikTok Shop Guard is an independent
        third-party tool. We are not affiliated with, endorsed by, or sponsored
        by TikTok, TikTok Shop, ByteDance Ltd., or any of their subsidiaries.
        "TikTok" and "TikTok Shop" are trademarks of ByteDance Ltd. Use of the
        Service does not guarantee any particular outcome with respect to your
        TikTok Shop account, listings, violations, or appeals.
      </div>

      <Section title="1. The Service">
        <p>
          TikTok Shop Guard provides tools for TikTok Shop sellers, including:
        </p>
        <ul className="ml-6 mt-2 list-disc space-y-2">
          <li>
            <strong>Compliance scanning:</strong> Automated review of your
            product listings against known TikTok Shop policy rules to
            identify potential violations before TikTok does.
          </li>
          <li>
            <strong>Violation alerts:</strong> Notifications about detected
            listing issues and policy risks.
          </li>
          <li>
            <strong>AI Appeal Drafter:</strong> AI-assisted generation of
            draft appeal responses to TikTok violation notices, powered by
            Anthropic's Claude.
          </li>
        </ul>
        <p className="mt-4">
          The Service connects to your TikTok Shop account through TikTok's
          official OAuth authorization flow. You may disconnect at any time
          from your account settings.
        </p>
      </Section>

      <Section title="2. Eligibility and Accounts">
        <p>
          You must be at least 18 years old and capable of forming a binding
          contract to use the Service. You must provide accurate registration
          information and keep it current. You are responsible for maintaining
          the confidentiality of your login credentials and for all activity
          that occurs under your account. Notify us immediately at
          support@tiktokshopguard.com if you suspect unauthorized access.
        </p>
        <p>
          You may only connect TikTok Shop accounts that you own or are
          expressly authorized to manage. Connecting an account you are not
          authorized to access is a material breach of these Terms.
        </p>
      </Section>

      <Section title="3. Subscriptions, Billing, and Refunds">
        <p>
          Certain features require a paid subscription. By subscribing, you
          authorize us to charge your payment method through our payment
          processor, Stripe, on a recurring basis at the price and interval
          disclosed at checkout.
        </p>
        <ul className="ml-6 mt-2 list-disc space-y-2">
          <li>
            <strong>Automatic renewal:</strong> Subscriptions renew
            automatically at the end of each billing period unless you cancel
            before the renewal date.
          </li>
          <li>
            <strong>Cancellation:</strong> You may cancel at any time from
            your account settings. Cancellation takes effect at the end of the
            current billing period, and you retain access until then.
          </li>
          <li>
            <strong>Price changes:</strong> We may change subscription prices
            with at least 30 days' notice. Changes apply at your next renewal.
          </li>
          <li>
            <strong>Refunds:</strong> Except where required by law, payments
            are non-refundable. If you believe you were charged in error,
            contact support@tiktokshopguard.com within 30 days of the charge.
          </li>
          <li>
            <strong>Failed payments:</strong> If a renewal payment fails, we
            may retry the charge and suspend paid features until payment is
            resolved.
          </li>
        </ul>
      </Section>

      <Section title="4. No Guarantee of Outcomes">
        <p>
          The Service provides informational tools only. We do not and cannot
          guarantee that:
        </p>
        <ul className="ml-6 mt-2 list-disc space-y-2">
          <li>
            Compliance scans will detect every actual or potential policy
            violation, or that flagged items are in fact violations;
          </li>
          <li>
            Using the Service will prevent TikTok from issuing violations,
            removing listings, restricting, suspending, or banning your shop;
          </li>
          <li>
            Any appeal — whether drafted with our AI tools or otherwise — will
            be accepted by TikTok or result in reinstatement of a listing or
            account.
          </li>
        </ul>
        <p className="mt-4">
          TikTok's policies change frequently and their enforcement decisions
          are entirely their own. The Service is not legal advice, and nothing
          in the Service creates an attorney-client relationship. For legal
          questions about your business, consult a licensed attorney.
        </p>
      </Section>

      <Section title="5. AI-Generated Content">
        <p>
          Appeal drafts and other AI-generated content are produced by an
          automated system and may contain errors, omissions, or statements
          that do not accurately reflect your situation. You are solely
          responsible for reviewing, editing, verifying, and approving all
          AI-generated content before using or submitting it anywhere,
          including to TikTok. You must not submit appeal content that is
          false, misleading, or that misrepresents the facts of your case.
        </p>
      </Section>

      <Section title="6. Acceptable Use">
        <p>You agree not to:</p>
        <ul className="ml-6 mt-2 list-disc space-y-2">
          <li>
            Use the Service to violate any law, regulation, or third-party
            right, including TikTok's own terms and policies;
          </li>
          <li>
            Use the Service to draft appeals containing knowingly false
            statements or fabricated evidence;
          </li>
          <li>
            Attempt to probe, scan, or test the vulnerability of the Service,
            bypass authentication, or access data belonging to other users;
          </li>
          <li>
            Scrape, harvest, reverse engineer, or copy the Service or its
            underlying scanning rules and detection patterns;
          </li>
          <li>
            Resell, sublicense, or provide the Service to third parties as a
            service bureau without our written consent;
          </li>
          <li>
            Interfere with or disrupt the integrity or performance of the
            Service, including by imposing an unreasonable load on our
            infrastructure.
          </li>
        </ul>
        <p className="mt-4">
          We may suspend or terminate accounts that violate this section.
        </p>
      </Section>

      <Section title="7. Your Content and Data">
        <p>
          You retain all rights to your product listings, shop data, violation
          notices, and any content you provide to the Service ("Your
          Content"). You grant us a limited, non-exclusive license to store,
          process, and display Your Content solely as necessary to provide the
          Service to you, as described in our Privacy Policy. This license
          ends when you delete the content or your account, subject to the
          retention periods in the Privacy Policy.
        </p>
        <p>
          You represent that you have all rights necessary to provide Your
          Content to us and that doing so does not violate any agreement you
          have with TikTok or any third party.
        </p>
      </Section>

      <Section title="8. Our Intellectual Property">
        <p>
          The Service, including its software, design, scanning rules,
          detection patterns, text, and graphics, is owned by Metamorphosis
          LLC and protected by intellectual property laws. We grant you a
          limited, non-exclusive, non-transferable, revocable license to use
          the Service for your own business purposes in accordance with these
          Terms. No other rights are granted.
        </p>
      </Section>

      <Section title="9. Third-Party Services">
        <p>
          The Service depends on third-party platforms and providers,
          including TikTok's Open Platform APIs, Supabase, Stripe, Vercel, and
          Anthropic. We are not responsible for the availability, accuracy, or
          conduct of third-party services. If TikTok changes or revokes API
          access in a way that affects the Service, we will make reasonable
          efforts to adapt, but we are not liable for resulting interruptions
          or loss of functionality.
        </p>
      </Section>

      <Section title="10. Disclaimer of Warranties">
        <p>
          THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT
          WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY,
          INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
          PARTICULAR PURPOSE, ACCURACY, AND NON-INFRINGEMENT. WE DO NOT
          WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR
          SECURE, OR THAT SCAN RESULTS OR AI-GENERATED CONTENT WILL BE
          ACCURATE OR COMPLETE.
        </p>
      </Section>

      <Section title="11. Limitation of Liability">
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, METAMORPHOSIS LLC AND ITS
          MEMBERS, OFFICERS, EMPLOYEES, AND AGENTS WILL NOT BE LIABLE FOR ANY
          INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
          OR ANY LOSS OF PROFITS, REVENUE, DATA, OR BUSINESS OPPORTUNITIES,
          ARISING FROM OR RELATED TO YOUR USE OF THE SERVICE — INCLUDING ANY
          ACTION TAKEN BY TIKTOK AGAINST YOUR SHOP, LISTINGS, OR ACCOUNT —
          EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
        </p>
        <p>
          OUR TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS ARISING FROM OR RELATED
          TO THE SERVICE WILL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE
          (12) MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM, OR ONE
          HUNDRED U.S. DOLLARS ($100), WHICHEVER IS GREATER. Some
          jurisdictions do not allow certain limitations, so portions of this
          section may not apply to you.
        </p>
      </Section>

      <Section title="12. Indemnification">
        <p>
          You agree to indemnify and hold harmless Metamorphosis LLC from any
          claims, damages, liabilities, and expenses (including reasonable
          attorneys' fees) arising from Your Content, your use of the Service,
          your violation of these Terms, or your violation of any law or
          third-party right, including TikTok's terms and policies.
        </p>
      </Section>

      <Section title="13. Termination">
        <p>
          You may stop using the Service and delete your account at any time.
          We may suspend or terminate your access immediately if you breach
          these Terms, if required by law, or if we discontinue the Service.
          Upon termination, your license to use the Service ends and your data
          is handled according to the retention schedule in our Privacy
          Policy. Sections 4, 5, 7, 8, and 10 through 16 survive termination.
        </p>
      </Section>

      <Section title="14. Governing Law and Disputes">
        <p>
          These Terms are governed by the laws of the State of Florida,
          without regard to conflict-of-law principles. Any dispute arising
          from these Terms or the Service will be resolved exclusively in the
          state or federal courts located in Florida, and you consent to their
          jurisdiction. You waive any right to participate in a class action
          against us to the extent permitted by law.
        </p>
      </Section>

      <Section title="15. Changes to These Terms">
        <p>
          We may update these Terms from time to time. For material changes,
          we will post the updated Terms here with a new effective date and
          notify you by email or an in-Service notice at least 14 days before
          they take effect. Continued use of the Service after the effective
          date constitutes acceptance of the revised Terms.
        </p>
      </Section>

      <Section title="16. General">
        <p>
          These Terms, together with the Privacy Policy, are the entire
          agreement between you and Metamorphosis LLC regarding the Service.
          If any provision is found unenforceable, the remainder stays in
          effect. Our failure to enforce a provision is not a waiver. You may
          not assign these Terms without our consent; we may assign them in
          connection with a merger, acquisition, or sale of assets.
        </p>
      </Section>

      <Section title="17. Contact">
        <p>Questions about these Terms? Contact us:</p>
        <div className="mt-4 rounded-lg bg-gray-50 px-5 py-4 text-sm">
          <p className="font-semibold">TikTok Shop Guard</p>
          <p>Operated by Metamorphosis LLC</p>
          <p>
            Email:{" "}
            <a
              href="mailto:support@tiktokshopguard.com"
              className="text-gray-700 underline"
            >
              support@tiktokshopguard.com
            </a>
          </p>
          <p>State of Florida, United States</p>
        </div>
      </Section>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 border-b border-gray-200 pb-2 text-xl font-semibold">
        {title}
      </h2>
      <div className="flex flex-col gap-3 leading-relaxed text-gray-700">
        {children}
      </div>
    </section>
  );
}
