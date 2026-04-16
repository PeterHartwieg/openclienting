export function ImpressumDe() {
  return (
    <>
      <h1 className="text-h1 font-bold tracking-tight">Impressum</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Anbieterkennzeichnung gemäß &sect;5 DDG
      </p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground/90">
        <section>
          <h2 className="text-lg font-semibold">Verantwortlich für den Inhalt</h2>
          <p className="mt-2">
            Peter Hartwieg
            <br />
            Tölzer Str. 5a
            <br />
            81379 München
            <br />
            Deutschland
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Kontakt</h2>
          <p className="mt-2">
            E-Mail:{" "}
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
            Verantwortlich für redaktionelle Inhalte (V.i.S.d.P.)
          </h2>
          <p className="mt-2">
            Peter Hartwieg
            <br />
            Anschrift wie oben
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Verbraucherstreitbeilegung</h2>
          <p className="mt-2">
            Wir sind weder verpflichtet noch bereit, an Streitbeilegungsverfahren
            vor einer Verbraucherschlichtungsstelle teilzunehmen (&sect;&nbsp;36
            VSBG).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Haftung für Inhalte</h2>
          <p className="mt-2">
            Als Diensteanbieter sind wir gemäß &sect;7 Abs. 1 DDG für eigene
            Inhalte auf diesen Seiten nach den allgemeinen Gesetzen
            verantwortlich. Nach &sect;&sect;8 bis 10 DDG sind wir als
            Diensteanbieter jedoch nicht verpflichtet, übermittelte oder
            gespeicherte fremde Informationen zu überwachen oder nach Umständen
            zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
            Verpflichtungen zur Entfernung oder Sperrung der Nutzung von
            Informationen nach den allgemeinen Gesetzen bleiben hiervon
            unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem
            Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei
            Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese
            Inhalte umgehend entfernen.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Haftung für Links</h2>
          <p className="mt-2">
            Unser Angebot enthält Links zu externen Websites Dritter, auf deren
            Inhalte wir keinen Einfluss haben. Deshalb können wir für diese
            fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der
            verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der
            Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der
            Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige
            Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine
            permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch
            ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar.
            Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links
            umgehend entfernen.
          </p>
        </section>
      </div>
    </>
  );
}
