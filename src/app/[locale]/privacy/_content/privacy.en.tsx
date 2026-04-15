export function PrivacyEn() {
  return (
    <>
      <h1 className="text-h1 font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Datenschutzerkl&auml;rung in accordance with GDPR
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Last updated: April 14, 2026
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

          <h3 className="mt-4 font-medium">
            2.4 Cookies and storage on your device
          </h3>
          <p className="mt-1">
            We store or read the following information on your device. The
            governing rule is &sect;&nbsp;25 TDDDG (the German implementation of
            the ePrivacy Directive).
          </p>

          <p className="mt-3 font-medium">
            Strictly necessary (no consent required under &sect;&nbsp;25(2)
            TDDDG)
          </p>
          <p className="mt-1">
            These items are necessary for the service to function or to provide
            a feature you explicitly requested. They are set without consent but
            are disclosed here for transparency.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              <strong>Supabase Auth session cookie (JWT)</strong>{" "}&mdash; keeps
              you signed in after login. Storage: cookie. Lifetime: per Supabase
              Auth defaults (typically until sign-out or session expiry).
            </li>
            <li>
              <strong><code>oc_cookie_consent</code></strong>{" "}&mdash; stores
              your choice in the cookie banner so it doesn&apos;t reappear on
              every page view. Storage: <code>localStorage</code>. Lifetime:
              6 months, after which you are asked again.
            </li>
            <li>
              <strong><code>NEXT_LOCALE</code></strong>{" "}&mdash; remembers your
              language preference (German / English) so you don&apos;t have to
              choose on every visit. Storage: cookie. Lifetime: 1 year.
            </li>
            <li>
              <strong><code>oc_persona</code></strong>{" "}&mdash; remembers whether
              you selected the homepage view for established companies or for
              start-ups. Storage: cookie. Lifetime: 1 year.
            </li>
            <li>
              <strong><code>theme</code></strong> (next-themes) &mdash;
              remembers your light/dark mode preference. Storage:{" "}
              <code>localStorage</code>. Lifetime: until you clear it.
            </li>
          </ul>

          <p className="mt-3 font-medium">
            Consent-based (only after opt-in via the cookie banner)
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              <strong>Google Tag Manager (GTM)</strong>{" "}&mdash; loads tags
              after you consent, in particular Google Analytics 4. GTM itself
              doesn&apos;t store analytics cookies, but loading it triggers a
              connection to Google&apos;s servers.
            </li>
            <li>
              <strong>Google Analytics cookies</strong>{" "}&mdash; <code>_ga</code>,{" "}
              <code>_gid</code>, <code>_gcl_*</code>. Set only if you consent
              to analytics. If you decline or withdraw consent, these cookies
              are removed. See Section 5 for details.
            </li>
          </ul>

          <p className="mt-3">
            To change your choice or withdraw your consent, click{" "}
            <strong>&ldquo;Cookie Settings&rdquo;</strong> in the footer. The
            cookie banner will reappear and you can either choose{" "}
            <em>Decline</em> or, under <em>Settings</em>, untick the analytics
            option and save. At that moment existing analytics cookies are
            deleted and a Google Consent Mode withdrawal signal is sent. If
            the Tag Manager was already loaded in your current tab, the page
            is also reloaded automatically so that no further analytics data
            is processed in this session either.
          </p>

          <h3 className="mt-4 font-medium">2.5 Google OAuth</h3>
          <p className="mt-1">
            If you sign in with Google, we receive your name and email address
            from Google. We do not access your contacts, calendar, or any other
            Google data. Google&apos;s own privacy policy applies to data Google
            collects during the OAuth flow.
          </p>
          <p className="mt-1">
            <strong>Legal basis:</strong> Performance of a contract / pre-contractual
            measures (Art. 6(1)(b) GDPR) &mdash; signing in with Google is one
            of several sign-in options and is part of providing the service.
          </p>

          <h3 className="mt-4 font-medium">2.6 Organization data</h3>
          <p className="mt-1">
            When you create an organization as a signed-in user, we store its{" "}
            <strong>name</strong>, a URL <strong>slug</strong> derived from it,
            optionally a <strong>website</strong>, <strong>description</strong>{" "}
            and <strong>employee count</strong>, a{" "}
            <strong>verification status</strong> (e.g. unverified, pending,
            verified), and your user ID as the <strong>creator</strong>. This
            data is publicly visible (with the exception of internal status
            fields).
          </p>
          <p className="mt-1">
            <strong>Legal basis:</strong> Performance of a contract (Art.
            6(1)(b) GDPR). <strong>Recipients:</strong> Supabase (database
            hosting). <strong>Retention:</strong> until the organization is
            deleted. If you delete your account, the creator reference is
            anonymised.
          </p>

          <h3 className="mt-4 font-medium">
            2.7 Memberships and join requests
          </h3>
          <p className="mt-1">
            When you request membership in a verified organization, we store
            your <strong>user ID</strong>, the{" "}
            <strong>organization ID</strong>, your <strong>role</strong>{" "}
            (member or admin), the <strong>membership status</strong>{" "}
            (pending, active, rejected, revoked), and timestamps. Administrators
            of the organization can see your request and accept or reject it.
          </p>
          <p className="mt-1">
            <strong>Legal basis:</strong> Performance of a contract (Art.
            6(1)(b) GDPR). <strong>Retention:</strong> for as long as the
            membership exists; rejected or revoked records are retained to
            prevent repeated requests.
          </p>

          <h3 className="mt-4 font-medium">
            2.8 Notifications and notification preferences
          </h3>
          <p className="mt-1">
            We generate <strong>in-app notifications</strong> when relevant
            events occur on your contributions (e.g. status changes, comments,
            suggested edits). They are stored with your user ID, the event
            type, and a timestamp. You can mark notifications as{" "}
            <em>read</em> individually or all at once; they are retained until
            your account is deleted.
          </p>
          <p className="mt-1">
            You can additionally enable or disable{" "}
            <strong>email notifications</strong> for individual categories
            (status changes, suggested edits, replies to your comments,
            verification outcomes, success report decisions, reverted
            revisions). Your preferences are stored against your user ID.
          </p>
          <p className="mt-1">
            <strong>Legal basis:</strong> Performance of a contract (Art.
            6(1)(b) GDPR) for service-related notifications, switchable by you
            at any time. <strong>Retention:</strong> until your account is
            deleted. (There is currently no separate delete function for
            individual notifications.)
          </p>

          <h3 className="mt-4 font-medium">
            2.9 Public organization logos
          </h3>
          <p className="mt-1">
            Organization administrators can upload a <strong>logo</strong>.
            Logos are stored in the <strong>public</strong> Supabase Storage
            bucket <code>org-logos</code> and served via a CDN; they are
            therefore visible to all visitors. Uploads are limited to{" "}
            <strong>image files up to 512&nbsp;KB</strong>.
          </p>
          <p className="mt-1">
            <strong>Legal basis:</strong> Performance of a contract (Art.
            6(1)(b) GDPR) and legitimate interest in a recognisable
            representation of organizations (Art. 6(1)(f) GDPR).{" "}
            <strong>Retention:</strong> until removed by an administrator or
            until the organization is deleted.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">
            3. Recipients &amp; third-party processors
          </h2>
          <p className="mt-2">We share personal data with the following processors:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              <strong>Supabase Inc.</strong>{" "}&mdash; database hosting &amp;
              authentication (Data Processing Agreement in place).
            </li>
            <li>
              <strong>Vercel Inc.</strong>{" "}&mdash; website hosting (Data
              Processing Agreement in place).
            </li>
            <li>
              <strong>Cloudflare Inc.</strong>{" "}&mdash; DNS and CDN services.
            </li>
            <li>
              <strong>Google LLC</strong>{" "}&mdash; OAuth authentication and, if
              you consent, Google Tag Manager and Google Analytics 4 loaded
              through it.
            </li>
            <li>
              <strong>Brevo</strong> (Sendinblue SAS, 17 rue Salneuve, 75017
              Paris, France){" "}&mdash; sending transactional email notifications
              (e.g. submission status changes, replies to comments). Brevo is
              based in the EU. Any third-country transfers, if applicable, are
              covered by appropriate safeguards under the GDPR (in particular
              Standard Contractual Clauses).
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
          <h2
            id="5-google-analytics"
            className="scroll-mt-24 text-lg font-semibold"
          >
            5. Google Analytics &amp; Google Tag Manager
          </h2>
          <p className="mt-2">
            We use <strong>Google Tag Manager (GTM)</strong> to load Google
            Analytics 4 (GA4) on our website. GTM itself does not collect
            analytics data, but when it is loaded it makes a request to
            Google&apos;s servers, which logs the IP address and user agent of
            your browser.
          </p>
          <p className="mt-2">
            Google Analytics 4 is configured as a tag inside our GTM container
            to understand how visitors use our website (pages visited, time on
            site, device type, country). GA4 anonymises IP addresses by default
            for traffic from the EU.
          </p>
          <p className="mt-2">
            Both GTM and the cookies set by tags loaded through it (
            <code>_ga</code>, <code>_gid</code>, <code>_gcl_*</code>) are{" "}
            <strong>only loaded after you give explicit consent</strong> via
            our cookie banner. If you decline, GTM is never loaded, no
            analytics data is collected, and no analytics cookies are placed on
            your device.
          </p>
          <p className="mt-2">
            You can withdraw your consent at any time: click{" "}
            <strong>&ldquo;Cookie Settings&rdquo;</strong> in the website
            footer to bring the banner back, then either choose{" "}
            <em>Decline</em> or open <em>Settings</em> and save without
            analytics. Existing analytics cookies are removed at that moment
            and a Consent Mode withdrawal signal is sent to Google. If the
            Tag Manager was already loaded in your current tab, the page is
            reloaded automatically so it cannot process further data in this
            session. The Tag Manager will not be loaded on subsequent visits.
          </p>
          <p className="mt-2">
            <strong>Legal basis:</strong> Consent (Art. 6(1)(a) GDPR).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">6. Fonts</h2>
          <p className="mt-2">
            We use <strong>IBM Plex Sans</strong> and{" "}
            <strong>IBM Plex Mono</strong>. These fonts are downloaded at build
            time via <code>next/font</code> and then{" "}
            <strong>self-hosted</strong> from our own servers. When you visit
            our pages, <strong>no data is transmitted to Google</strong> for
            font delivery.
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
              <strong>Withdraw consent</strong>{" "}&mdash; where processing is
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
