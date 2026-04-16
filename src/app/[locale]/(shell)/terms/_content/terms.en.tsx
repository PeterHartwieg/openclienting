import Link from "next/link";

export function TermsEn() {
  return (
    <>
      <h1 className="text-h1 font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Nutzungsbedingungen</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Last updated: April 2026
      </p>

      <div className="mt-10 space-y-10 text-sm leading-relaxed text-foreground/90">
        <section>
          <h2 className="text-lg font-semibold">1. Scope and acceptance</h2>
          <p className="mt-2">
            These Terms of Service (&ldquo;Terms&rdquo;) govern your use of
            OpenClienting.org (&ldquo;the Platform&rdquo;), operated by Peter
            Hartwieg from Germany. By creating an account or using the Platform,
            you agree to these Terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">2. Eligibility</h2>
          <p className="mt-2">
            You must be at least <strong>16 years of age</strong> to create an
            account and use the Platform. By registering, you confirm that you
            meet this age requirement.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">3. User accounts</h2>
          <p className="mt-2">
            You are responsible for maintaining the security of your account
            credentials. You must not share your account or allow others to
            access it. You are responsible for all activity that occurs under
            your account.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">4. User-generated content</h2>
          <p className="mt-2">
            You retain ownership of content you submit to the Platform (problem
            templates, requirements, pilot frameworks, solution approaches,
            success reports, comments, and suggested edits).
          </p>
          <p className="mt-2">
            By submitting content, you grant OpenClienting.org a worldwide,
            non-exclusive, royalty-free licence to display, store, reproduce,
            and distribute your content as part of the Platform&apos;s operation.
            This licence ends when you delete your content or account, except
            for content that has already been anonymised or shared by others.
          </p>
          <p className="mt-2">
            You warrant that you have the right to submit the content and that
            it does not infringe any third-party rights.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">5. Anonymous posting</h2>
          <p className="mt-2">
            You may choose to publish content anonymously. When anonymous mode
            is selected, your identity is hidden from other users on the
            published page. However, your identity is{" "}
            <strong>always stored server-side</strong> and is visible to
            moderators and administrators for content moderation and legal
            compliance purposes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">6. Acceptable use</h2>
          <p className="mt-2">You agree not to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Post illegal, defamatory, or harassing content</li>
            <li>
              Submit hate speech, threats of violence, or content that
              discriminates based on race, gender, religion, or other protected
              characteristics
            </li>
            <li>Post spam, advertising, or unsolicited commercial content</li>
            <li>
              Reference specific startup or company names in solution approaches
              (technology categories only)
            </li>
            <li>
              Attempt to circumvent moderation, access controls, or security
              measures
            </li>
            <li>Impersonate others or misrepresent your affiliation</li>
            <li>
              Use automated tools (bots, scrapers) to access the Platform
              without prior written permission
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">7. Content moderation</h2>
          <p className="mt-2">
            All submitted content goes through a moderation process before
            publication. Moderators may approve, reject, or request changes to
            submitted content. If your content is rejected, you will receive a
            reason for the rejection.
          </p>
          <p className="mt-2">
            We reserve the right to remove any content that violates these Terms
            or applicable law, and to suspend or terminate accounts that
            repeatedly violate our policies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">8. Reporting illegal content</h2>
          <p className="mt-2">
            If you encounter content that you believe is illegal or violates
            these Terms, please report it to{" "}
            <a
              href="mailto:report@openclienting.org"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              report@openclienting.org
            </a>
            . We will review and act on reports promptly in accordance with the
            EU Digital Services Act.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">9. Platform intellectual property</h2>
          <p className="mt-2">
            The Platform&apos;s source code is open source and available under
            its respective licence on GitHub. The OpenClienting name, logo, and
            branding are the property of the operator and may not be used
            without permission.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">
            10. Disclaimer and limitation of liability
          </h2>
          <p className="mt-2">
            The Platform is provided &ldquo;as is&rdquo; without warranties of
            any kind. We do not guarantee the accuracy, completeness, or
            usefulness of any user-generated content.
          </p>
          <p className="mt-2">
            To the maximum extent permitted by German law, we are not liable for
            any indirect, incidental, or consequential damages arising from your
            use of the Platform. Our liability for direct damages is limited to
            cases of intent and gross negligence.
          </p>
          <p className="mt-2">
            We are not responsible for content posted by users. Each user is
            solely responsible for the content they submit.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">11. Privacy</h2>
          <p className="mt-2">
            Your use of the Platform is also governed by our{" "}
            <Link
              href="/en/privacy"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              Privacy Policy
            </Link>
            , which explains how we collect, use, and protect your personal
            data.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">12. Account termination</h2>
          <p className="mt-2">
            You may delete your account at any time. Upon deletion, your
            personal data will be removed and your published content will be
            anonymised (author attribution removed).
          </p>
          <p className="mt-2">
            We may suspend or terminate your account if you violate these Terms.
            In such cases we will provide an explanation of the reasons.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">13. Changes to these terms</h2>
          <p className="mt-2">
            We may update these Terms from time to time. Material changes will
            be communicated via the Platform. Continued use of the Platform
            after changes constitutes acceptance of the revised Terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">
            14. Governing law and jurisdiction
          </h2>
          <p className="mt-2">
            These Terms are governed by the laws of the Federal Republic of
            Germany. Any disputes arising from these Terms shall be subject to
            the exclusive jurisdiction of the courts in Germany.
          </p>
        </section>
      </div>
    </>
  );
}
