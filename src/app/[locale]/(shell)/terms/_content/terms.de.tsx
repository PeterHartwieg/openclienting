import Link from "next/link";

export function TermsDe() {
  return (
    <>
      <h1 className="text-h1 font-bold tracking-tight">Nutzungsbedingungen</h1>
      <p className="mt-2 text-sm text-muted-foreground">Terms of Service</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Stand: April 2026
      </p>

      <div className="mt-10 space-y-10 text-sm leading-relaxed text-foreground/90">
        <section>
          <h2 className="text-lg font-semibold">1. Geltungsbereich und Annahme</h2>
          <p className="mt-2">
            Diese Nutzungsbedingungen (&bdquo;Bedingungen&ldquo;) regeln deine
            Nutzung von OpenClienting.org (&bdquo;die Plattform&ldquo;), betrieben
            von Peter Hartwieg aus Deutschland. Mit der Erstellung eines Kontos
            oder der Nutzung der Plattform stimmst du diesen Bedingungen zu.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">2. Voraussetzungen</h2>
          <p className="mt-2">
            Du musst mindestens <strong>16 Jahre alt</strong> sein, um ein Konto
            zu erstellen und die Plattform zu nutzen. Mit der Registrierung
            bestätigst du, dass du diese Altersanforderung erfüllst.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">3. Nutzerkonten</h2>
          <p className="mt-2">
            Du bist für die Sicherheit deiner Anmeldedaten verantwortlich. Du
            darfst dein Konto nicht weitergeben oder Dritten den Zugriff
            ermöglichen. Du bist für alle Aktivitäten verantwortlich, die unter
            deinem Konto stattfinden.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">4. Nutzergenerierte Inhalte</h2>
          <p className="mt-2">
            Du behältst das Eigentum an den Inhalten, die du auf der Plattform
            einreichst (Problemvorlagen, Anforderungen, Pilot-Frameworks,
            Lösungsansätze, Erfolgsberichte, Kommentare und
            Änderungsvorschläge).
          </p>
          <p className="mt-2">
            Mit dem Einreichen von Inhalten gewährst du OpenClienting.org eine
            weltweite, nicht ausschließliche, gebührenfreie Lizenz, deine
            Inhalte im Rahmen des Plattformbetriebs anzuzeigen, zu speichern, zu
            vervielfältigen und zu verbreiten. Diese Lizenz endet, wenn du deine
            Inhalte oder dein Konto löschst &mdash; ausgenommen Inhalte, die
            bereits anonymisiert oder von anderen geteilt wurden.
          </p>
          <p className="mt-2">
            Du sicherst zu, dass du berechtigt bist, die Inhalte einzureichen,
            und dass sie keine Rechte Dritter verletzen.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">5. Anonyme Beiträge</h2>
          <p className="mt-2">
            Du kannst Inhalte anonym veröffentlichen. Bei Auswahl des anonymen
            Modus wird deine Identität anderen Nutzer:innen auf der
            veröffentlichten Seite nicht angezeigt. Deine Identität wird jedoch{" "}
            <strong>stets serverseitig gespeichert</strong> und ist für
            Moderator:innen und Administrator:innen zur Inhaltsmoderation und
            zur Einhaltung gesetzlicher Vorgaben einsehbar.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">6. Zulässige Nutzung</h2>
          <p className="mt-2">Du verpflichtest dich, Folgendes zu unterlassen:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Veröffentlichen von rechtswidrigen, verleumderischen oder belästigenden Inhalten</li>
            <li>
              Einreichen von Hassrede, Gewaltandrohungen oder Inhalten, die
              aufgrund von Rasse, Geschlecht, Religion oder anderen geschützten
              Merkmalen diskriminieren
            </li>
            <li>Veröffentlichen von Spam, Werbung oder unaufgeforderten kommerziellen Inhalten</li>
            <li>
              Nennen konkreter Startup- oder Firmennamen in Lösungsansätzen
              (nur Technologie-Kategorien sind erlaubt)
            </li>
            <li>
              Versuche, Moderation, Zugriffskontrollen oder Sicherheitsmaßnahmen
              zu umgehen
            </li>
            <li>Identitätsmissbrauch oder falsche Angaben zur Zugehörigkeit</li>
            <li>
              Einsatz automatisierter Tools (Bots, Scraper) zum Zugriff auf die
              Plattform ohne vorherige schriftliche Erlaubnis
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">7. Inhaltsmoderation</h2>
          <p className="mt-2">
            Alle eingereichten Inhalte durchlaufen vor der Veröffentlichung
            einen Moderationsprozess. Moderator:innen können eingereichte
            Inhalte freigeben, ablehnen oder Änderungen anfordern. Wird dein
            Inhalt abgelehnt, erhältst du eine Begründung.
          </p>
          <p className="mt-2">
            Wir behalten uns das Recht vor, Inhalte zu entfernen, die diesen
            Bedingungen oder geltendem Recht widersprechen, und Konten zu
            sperren oder zu kündigen, die wiederholt gegen unsere Richtlinien
            verstoßen.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">8. Meldung rechtswidriger Inhalte</h2>
          <p className="mt-2">
            Wenn du Inhalte findest, die du für rechtswidrig hältst oder die
            gegen diese Bedingungen verstoßen, melde sie bitte an{" "}
            <a
              href="mailto:report@openclienting.org"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              report@openclienting.org
            </a>
            . Wir prüfen Meldungen und handeln zeitnah gemäß dem EU Digital
            Services Act.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">9. Geistiges Eigentum der Plattform</h2>
          <p className="mt-2">
            Der Quellcode der Plattform ist Open Source und unter der jeweiligen
            Lizenz auf GitHub verfügbar. Der Name OpenClienting, das Logo und
            das Branding sind Eigentum des Betreibers und dürfen ohne
            Genehmigung nicht verwendet werden.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">
            10. Haftungsausschluss und Haftungsbeschränkung
          </h2>
          <p className="mt-2">
            Die Plattform wird &bdquo;wie besehen&ldquo; ohne Gewährleistungen
            jeglicher Art bereitgestellt. Wir übernehmen keine Garantie für die
            Richtigkeit, Vollständigkeit oder Nützlichkeit nutzergenerierter
            Inhalte.
          </p>
          <p className="mt-2">
            Soweit nach deutschem Recht zulässig, haften wir nicht für indirekte
            Schäden, Begleitschäden oder Folgeschäden, die aus deiner Nutzung
            der Plattform entstehen. Unsere Haftung für direkte Schäden ist auf
            Vorsatz und grobe Fahrlässigkeit beschränkt.
          </p>
          <p className="mt-2">
            Wir sind nicht für Inhalte verantwortlich, die von Nutzer:innen
            veröffentlicht werden. Jede:r Nutzer:in ist allein für die von
            ihm/ihr eingereichten Inhalte verantwortlich.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">11. Datenschutz</h2>
          <p className="mt-2">
            Die Nutzung der Plattform unterliegt zudem unserer{" "}
            <Link
              href="/de/privacy"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              Datenschutzerklärung
            </Link>
            , die erläutert, wie wir deine personenbezogenen Daten erheben,
            verwenden und schützen.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">12. Kontokündigung</h2>
          <p className="mt-2">
            Du kannst dein Konto jederzeit löschen. Mit der Löschung werden
            deine personenbezogenen Daten entfernt und deine veröffentlichten
            Inhalte anonymisiert (Autorenangabe entfernt).
          </p>
          <p className="mt-2">
            Wir können dein Konto sperren oder kündigen, wenn du gegen diese
            Bedingungen verstößt. In solchen Fällen werden wir die Gründe
            erläutern.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">13. Änderungen dieser Bedingungen</h2>
          <p className="mt-2">
            Wir können diese Bedingungen von Zeit zu Zeit aktualisieren.
            Wesentliche Änderungen werden über die Plattform kommuniziert. Die
            fortgesetzte Nutzung der Plattform nach Änderungen gilt als Annahme
            der überarbeiteten Bedingungen.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">
            14. Anwendbares Recht und Gerichtsstand
          </h2>
          <p className="mt-2">
            Diese Bedingungen unterliegen dem Recht der Bundesrepublik
            Deutschland. Für alle Streitigkeiten aus diesen Bedingungen ist
            ausschließlich der Gerichtsstand in Deutschland zuständig.
          </p>
        </section>
      </div>
    </>
  );
}
