export function PrivacyEn() {
  return (
    <>
      <h1 className="text-h1 font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Datenschutzerkl&auml;rung in accordance with GDPR
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Last updated: April 2026
      </p>

      <div className="mt-10 space-y-10 text-sm leading-relaxed text-foreground/90">
        <section>
          <h2 className="text-lg font-semibold">1. Data controller</h2>
          <p className="mt-2">
            Peter Hartwieg
            <br />
            Tölzer Str. 5a
            <br />
            81379 Munich
            <br />
            Germany
            <br />
            Email:{" "}
            <a
              href="mailto:privacy@openclienting.org"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              privacy@openclienting.org
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">
            2. What data we collect and why
          </h2>

          <h3 className="mt-4 font-medium">2.1 Account data</h3>
          <p className="mt-1">
            When you create an account (via Google OAuth or email magic link) we
            store your <strong>email address</strong>,{" "}
            <strong>display name</strong> (from your Google profile or derived
            from your email), a <strong>unique user ID</strong>, and the{" "}
            <strong>date of registration</strong>.
          </p>
          <p className="mt-1">
            <strong>Legal basis:</strong> Performance of a contract (Art.
            6(1)(b) GDPR) &mdash; necessary to provide you with an account and
            the ability to contribute content.
          </p>

          <h3 className="mt-4 font-medium">2.2 User-generated content</h3>
          <p className="mt-1">
            Content you submit (problem templates, requirements, pilot
            frameworks, solution approaches, success reports, comments, votes,
            and suggested edits) is stored along with your author ID and
            timestamps.
          </p>
          <p className="mt-1">
            If you choose the <strong>anonymous</strong> option when submitting,
            your identity is hidden from other users on the published page.
            However, your author ID is always stored server-side for moderation
            purposes.
          </p>
          <p className="mt-1">
            <strong>Legal basis:</strong> Performance of a contract (Art.
            6(1)(b) GDPR).
          </p>

          <h3 className="mt-4 font-medium">2.3 Server logs &amp; IP addresses</h3>
          <p className="mt-1">
            When you visit our website your browser transmits certain data
            automatically (IP address, browser type, operating system, referring
            URL, date and time of access). This data is processed by our hosting
            provider (Vercel) and our authentication provider (Supabase) for
            security and operational purposes.
          </p>
          <p className="mt-1">
            <strong>Legal basis:</strong> Legitimate interest (Art. 6(1)(f)
            GDPR) &mdash; ensuring security and availability of the service.
          </p>

          <h3 className="mt-4 font-medium">2.4 Cookies</h3>
          <p className="mt-1">
            We use <strong>strictly necessary cookies</strong> for
            authentication. Supabase Auth sets a session cookie (JWT) that keeps
            you logged in. These cookies are essential for the service to
            function and do not require your consent.
          </p>
          <p className="mt-1">
            <strong>Analytics cookies</strong> (Google Analytics) are only set if
            you give explicit consent via our cookie banner. See Section 5 for
            details.
          </p>

          <h3 className="mt-4 font-medium">2.5 Google OAuth</h3>
          <p className="mt-1">
            If you sign in with Google, we receive your name and email address
            from Google. We do not access your contacts, calendar, or any other
            Google data. Google&apos;s own privacy policy applies to data Google
            collects during the OAuth flow.
          </p>
          <p className="mt-1">
            <strong>Legal basis:</strong> Consent (Art. 6(1)(a) GDPR) &mdash;
            you initiate the Google sign-in flow.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">
            3. Recipients &amp; third-party processors
          </h2>
          <p className="mt-2">We share personal data with the following processors:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              <strong>Supabase Inc.</strong> &mdash; database hosting &amp;
              authentication (Data Processing Agreement in place).
            </li>
            <li>
              <strong>Vercel Inc.</strong> &mdash; website hosting (Data
              Processing Agreement in place).
            </li>
            <li>
              <strong>Cloudflare Inc.</strong> &mdash; DNS and CDN services.
            </li>
            <li>
              <strong>Google LLC</strong> &mdash; OAuth authentication and, if
              you consent, Google Analytics (GA4).
            </li>
            <li>
              <strong>Resend / SendGrid</strong> (planned) &mdash; transactional
              email notifications (e.g. submission status changes, comment
              replies).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">
            4. Data transfers outside the EU
          </h2>
          <p className="mt-2">
            Some of our processors (Vercel, Google, Cloudflare) are based in the
            United States. These transfers are safeguarded by the{" "}
            <strong>EU&ndash;US Data Privacy Framework</strong> (where the
            processor is certified) and/or{" "}
            <strong>Standard Contractual Clauses (SCCs)</strong> approved by the
            European Commission. We ensure that all processors provide adequate
            data protection guarantees.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">5. Google Analytics</h2>
          <p className="mt-2">
            We use Google Analytics 4 (GA4) to understand how visitors use our
            website (pages visited, time on site, device type, country). GA4
            anonymises IP addresses by default for traffic from the EU.
          </p>
          <p className="mt-2">
            Google Analytics cookies (<code>_ga</code>, <code>_gid</code>) are{" "}
            <strong>only set after you give explicit consent</strong> via our
            cookie banner. If you decline, no analytics data is collected and no
            analytics cookies are placed on your device.
          </p>
          <p className="mt-2">
            You can withdraw your consent at any time by clicking{" "}
            <strong>&ldquo;Cookie Settings&rdquo;</strong> in the website footer.
          </p>
          <p className="mt-2">
            <strong>Legal basis:</strong> Consent (Art. 6(1)(a) GDPR).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">6. Fonts</h2>
          <p className="mt-2">
            We use the Geist font family. These fonts are{" "}
            <strong>self-hosted</strong> on our servers via Next.js and are not
            loaded from external Google servers. No data is transmitted to Google
            for font delivery.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">7. Data retention</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              <strong>Account data:</strong> retained for as long as your account
              exists. Deleted upon account deletion request.
            </li>
            <li>
              <strong>Published content:</strong> retained indefinitely as part
              of the public knowledge base. Upon account deletion, your content
              is anonymised (author reference removed) rather than deleted.
            </li>
            <li>
              <strong>Server logs:</strong> retained per our hosting
              providers&apos; policies (typically 30 days).
            </li>
            <li>
              <strong>Analytics data:</strong> Google Analytics user-level data
              is retained for 2 months (GA4 default).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">8. Your rights under GDPR</h2>
          <p className="mt-2">You have the right to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              <strong>Access</strong> (Art. 15) &mdash; request a copy of all
              personal data we hold about you.
            </li>
            <li>
              <strong>Rectification</strong> (Art. 16) &mdash; correct
              inaccurate personal data.
            </li>
            <li>
              <strong>Erasure</strong> (Art. 17) &mdash; request deletion of
              your personal data (&ldquo;right to be forgotten&rdquo;).
            </li>
            <li>
              <strong>Restriction of processing</strong> (Art. 18) &mdash;
              request that we limit how we use your data.
            </li>
            <li>
              <strong>Data portability</strong> (Art. 20) &mdash; receive your
              data in a machine-readable format.
            </li>
            <li>
              <strong>Object</strong> (Art. 21) &mdash; object to processing
              based on legitimate interests.
            </li>
            <li>
              <strong>Withdraw consent</strong> &mdash; where processing is
              based on consent, you may withdraw it at any time without
              affecting the lawfulness of prior processing.
            </li>
          </ul>
          <p className="mt-2">
            To exercise any of these rights, contact us at{" "}
            <a
              href="mailto:privacy@openclienting.org"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              privacy@openclienting.org
            </a>
            . We will respond within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">
            9. Right to lodge a complaint
          </h2>
          <p className="mt-2">
            If you believe that the processing of your personal data violates
            the GDPR, you have the right to lodge a complaint with a supervisory
            authority, in particular in the EU member state of your habitual
            residence, place of work, or the place of the alleged infringement
            (Art. 77 GDPR).
          </p>
          <p className="mt-2">
            The competent supervisory authority for us is:
            <br />
            Bayerisches Landesamt f&uuml;r Datenschutzaufsicht (BayLDA)
            <br />
            Promenade 18, 91522 Ansbach, Germany
            <br />
            <a
              href="https://www.lda.bayern.de"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              https://www.lda.bayern.de
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">
            10. Automated decision-making
          </h2>
          <p className="mt-2">
            We do not use automated decision-making or profiling that produces
            legal effects concerning you or similarly significantly affects you.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">
            11. Changes to this privacy policy
          </h2>
          <p className="mt-2">
            We may update this privacy policy from time to time. The &ldquo;last
            updated&rdquo; date at the top of this page indicates when the
            policy was last revised. We encourage you to review this page
            periodically.
          </p>
        </section>
      </div>
    </>
  );
}
