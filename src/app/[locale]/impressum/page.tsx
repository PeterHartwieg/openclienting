import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impressum — OpenClienting.org",
};

export default function ImpressumPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-h1 font-bold tracking-tight">Impressum</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Legal notice in accordance with DDG &sect;5
      </p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground/90">
        <section>
          <h2 className="text-lg font-semibold">Responsible for content</h2>
          <p className="mt-2">
            Peter Hartwieg
            <br />
            Tölzer Str. 5a
            <br />
            81379 Munich
            <br />
            Germany
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Contact</h2>
          <p className="mt-2">
            Email:{" "}
            <a
              href="mailto:contact@openclienting.org"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              contact@openclienting.org
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">
            Responsible for editorial content (V.i.S.d.P.)
          </h2>
          <p className="mt-2">
            Peter Hartwieg
            <br />
            Address as above
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">EU Dispute Resolution</h2>
          <p className="mt-2">
            The European Commission provides a platform for online dispute
            resolution (ODR):{" "}
            <a
              href="https://ec.europa.eu/consumers/odr/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              https://ec.europa.eu/consumers/odr/
            </a>
          </p>
          <p className="mt-2">
            We are neither obligated nor willing to participate in dispute
            resolution proceedings before a consumer arbitration board.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Liability for content</h2>
          <p className="mt-2">
            As a service provider we are responsible for our own content on these
            pages in accordance with DDG &sect;7(1). According to DDG &sect;&sect;8
            to 10, however, we are not obligated to monitor transmitted or
            stored third-party information or to investigate circumstances that
            indicate illegal activity. Obligations to remove or block the use of
            information under general law remain unaffected. Liability in this
            respect is, however, only possible from the point in time at which
            we become aware of a specific infringement. Upon notification of
            such violations we will remove the content immediately.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Liability for links</h2>
          <p className="mt-2">
            Our website contains links to external third-party websites over
            whose content we have no influence. We therefore cannot accept any
            liability for this third-party content. The respective provider or
            operator of the linked pages is always responsible for their
            content. The linked pages were checked for possible legal violations
            at the time of linking. Illegal content was not recognisable at the
            time of linking. Permanent monitoring of the content of the linked
            pages is not reasonable without concrete indications of a legal
            violation. Upon notification of violations we will remove such links
            immediately.
          </p>
        </section>
      </div>
    </div>
  );
}
