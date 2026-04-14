export function PrivacyDe() {
  return (
    <>
      <h1 className="text-h1 font-bold tracking-tight">Datenschutzerklärung</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Datenschutzerklärung gemäß DSGVO
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Stand: April 2026
      </p>

      <div className="mt-10 space-y-10 text-sm leading-relaxed text-foreground/90">
        <section>
          <h2 className="text-lg font-semibold">1. Verantwortlicher</h2>
          <p className="mt-2">
            Peter Hartwieg
            <br />
            Tölzer Str. 5a
            <br />
            81379 München
            <br />
            Deutschland
            <br />
            E-Mail:{" "}
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
            2. Welche Daten wir erheben und warum
          </h2>

          <h3 className="mt-4 font-medium">2.1 Kontodaten</h3>
          <p className="mt-1">
            Wenn du ein Konto erstellst (über Google OAuth oder per
            E-Mail-Magic-Link), speichern wir deine{" "}
            <strong>E-Mail-Adresse</strong>, deinen{" "}
            <strong>Anzeigenamen</strong> (aus deinem Google-Profil oder aus
            deiner E-Mail abgeleitet), eine{" "}
            <strong>eindeutige Benutzer-ID</strong> sowie das{" "}
            <strong>Registrierungsdatum</strong>.
          </p>
          <p className="mt-1">
            <strong>Rechtsgrundlage:</strong> Vertragserfüllung (Art. 6 Abs. 1
            lit. b DSGVO) &mdash; erforderlich, um dir ein Konto und die
            Möglichkeit zur Beitragserstellung bereitzustellen.
          </p>

          <h3 className="mt-4 font-medium">2.2 Nutzergenerierte Inhalte</h3>
          <p className="mt-1">
            Inhalte, die du einreichst (Problemvorlagen, Anforderungen,
            Pilot-Frameworks, Lösungsansätze, Erfolgsberichte, Kommentare,
            Stimmen und Änderungsvorschläge), werden zusammen mit deiner
            Autoren-ID und Zeitstempeln gespeichert.
          </p>
          <p className="mt-1">
            Wenn du beim Einreichen die <strong>anonyme</strong> Option wählst,
            wird deine Identität anderen Nutzer:innen auf der veröffentlichten
            Seite nicht angezeigt. Deine Autoren-ID wird jedoch stets
            serverseitig zur Moderation gespeichert.
          </p>
          <p className="mt-1">
            <strong>Rechtsgrundlage:</strong> Vertragserfüllung (Art. 6 Abs. 1
            lit. b DSGVO).
          </p>

          <h3 className="mt-4 font-medium">2.3 Server-Logs &amp; IP-Adressen</h3>
          <p className="mt-1">
            Wenn du unsere Website besuchst, übermittelt dein Browser
            automatisch bestimmte Daten (IP-Adresse, Browser-Typ, Betriebssystem,
            verweisende URL, Datum und Uhrzeit des Zugriffs). Diese Daten werden
            von unserem Hosting-Anbieter (Vercel) und unserem
            Authentifizierungs-Anbieter (Supabase) zu Sicherheits- und
            Betriebszwecken verarbeitet.
          </p>
          <p className="mt-1">
            <strong>Rechtsgrundlage:</strong> Berechtigtes Interesse (Art. 6
            Abs. 1 lit. f DSGVO) &mdash; Sicherstellung von Sicherheit und
            Verfügbarkeit des Dienstes.
          </p>

          <h3 className="mt-4 font-medium">2.4 Cookies</h3>
          <p className="mt-1">
            Wir verwenden <strong>zwingend erforderliche Cookies</strong> für
            die Authentifizierung. Supabase Auth setzt ein Sitzungs-Cookie
            (JWT), das dich angemeldet hält. Diese Cookies sind für den Betrieb
            des Dienstes essenziell und erfordern keine Einwilligung.
          </p>
          <p className="mt-1">
            <strong>Analyse-Cookies</strong> (geladen über Google Tag Manager,
            einschließlich Google Analytics 4) werden nur dann gesetzt, wenn du
            über unser Cookie-Banner ausdrücklich einwilligst. Details siehe
            Abschnitt 5.
          </p>

          <h3 className="mt-4 font-medium">2.5 Google OAuth</h3>
          <p className="mt-1">
            Wenn du dich mit Google anmeldest, erhalten wir von Google deinen
            Namen und deine E-Mail-Adresse. Wir greifen nicht auf deine
            Kontakte, deinen Kalender oder andere Google-Daten zu. Für die
            Daten, die Google im Rahmen des OAuth-Flows erhebt, gilt Googles
            eigene Datenschutzerklärung.
          </p>
          <p className="mt-1">
            <strong>Rechtsgrundlage:</strong> Einwilligung (Art. 6 Abs. 1 lit. a
            DSGVO) &mdash; du startest den Google-Anmeldevorgang.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">
            3. Empfänger &amp; Auftragsverarbeiter
          </h2>
          <p className="mt-2">
            Wir teilen personenbezogene Daten mit folgenden Auftragsverarbeitern:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              <strong>Supabase Inc.</strong> &mdash; Datenbank-Hosting &amp;
              Authentifizierung (Auftragsverarbeitungsvertrag liegt vor).
            </li>
            <li>
              <strong>Vercel Inc.</strong> &mdash; Website-Hosting
              (Auftragsverarbeitungsvertrag liegt vor).
            </li>
            <li>
              <strong>Cloudflare Inc.</strong> &mdash; DNS- und CDN-Dienste.
            </li>
            <li>
              <strong>Google LLC</strong> &mdash; OAuth-Authentifizierung und,
              falls du einwilligst, Google Tag Manager und das darüber geladene
              Google Analytics 4.
            </li>
            <li>
              <strong>Resend / SendGrid</strong> (geplant) &mdash; transaktionale
              E-Mail-Benachrichtigungen (z.&nbsp;B. Statusänderungen,
              Kommentar-Antworten).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">
            4. Datenübermittlung außerhalb der EU
          </h2>
          <p className="mt-2">
            Einige unserer Auftragsverarbeiter (Vercel, Google, Cloudflare)
            haben ihren Sitz in den USA. Diese Übermittlungen sind durch das{" "}
            <strong>EU&ndash;US Data Privacy Framework</strong> (sofern der
            Verarbeiter zertifiziert ist) und/oder durch von der Europäischen
            Kommission genehmigte{" "}
            <strong>Standardvertragsklauseln (SCCs)</strong> abgesichert. Wir
            stellen sicher, dass alle Auftragsverarbeiter angemessene
            Datenschutzgarantien bieten.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">
            5. Google Analytics &amp; Google Tag Manager
          </h2>
          <p className="mt-2">
            Wir verwenden <strong>Google Tag Manager (GTM)</strong>, um Google
            Analytics 4 (GA4) auf unserer Website zu laden. GTM selbst erhebt
            keine Analysedaten, sendet jedoch beim Laden eine Anfrage an Server
            von Google, bei der die IP-Adresse und der User-Agent deines
            Browsers protokolliert werden.
          </p>
          <p className="mt-2">
            Google Analytics 4 ist als Tag innerhalb unseres GTM-Containers
            konfiguriert, um zu verstehen, wie Besucher:innen unsere Website
            verwenden (besuchte Seiten, Verweildauer, Gerätetyp, Land). GA4
            anonymisiert IP-Adressen für EU-Datenverkehr standardmäßig.
          </p>
          <p className="mt-2">
            Sowohl GTM als auch die Cookies, die durch darüber geladene Tags
            gesetzt werden (<code>_ga</code>, <code>_gid</code>,{" "}
            <code>_gcl_*</code>), werden{" "}
            <strong>nur nach deiner ausdrücklichen Einwilligung</strong> über
            unser Cookie-Banner geladen. Lehnst du ab, wird GTM gar nicht erst
            geladen, es werden keine Analysedaten erfasst und keine
            Analyse-Cookies auf deinem Gerät gespeichert.
          </p>
          <p className="mt-2">
            Du kannst deine Einwilligung jederzeit widerrufen, indem du im
            Footer auf{" "}
            <strong>&bdquo;Cookie-Einstellungen&ldquo;</strong> klickst.
          </p>
          <p className="mt-2">
            <strong>Rechtsgrundlage:</strong> Einwilligung (Art. 6 Abs. 1 lit. a
            DSGVO).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">6. Schriftarten</h2>
          <p className="mt-2">
            Wir verwenden die Geist-Schriftfamilie. Diese Schriften werden über
            Next.js <strong>selbst gehostet</strong> und nicht von externen
            Google-Servern geladen. Es werden keine Daten an Google für die
            Auslieferung von Schriftarten übermittelt.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">7. Speicherdauer</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              <strong>Kontodaten:</strong> werden gespeichert, solange dein
              Konto besteht. Bei einer Löschungsanfrage werden sie entfernt.
            </li>
            <li>
              <strong>Veröffentlichte Inhalte:</strong> werden als Teil der
              öffentlichen Wissensbasis unbefristet gespeichert. Bei
              Kontolöschung werden deine Inhalte anonymisiert (Autorenbezug
              entfernt) und nicht gelöscht.
            </li>
            <li>
              <strong>Server-Logs:</strong> werden gemäß den Richtlinien unserer
              Hosting-Anbieter aufbewahrt (in der Regel 30 Tage).
            </li>
            <li>
              <strong>Analyse-Daten:</strong> Nutzerbezogene Google-Analytics-Daten
              werden 2 Monate aufbewahrt (GA4-Standard).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">8. Deine Rechte nach DSGVO</h2>
          <p className="mt-2">Du hast das Recht auf:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              <strong>Auskunft</strong> (Art. 15) &mdash; eine Kopie aller
              personenbezogenen Daten, die wir über dich speichern, anzufordern.
            </li>
            <li>
              <strong>Berichtigung</strong> (Art. 16) &mdash; unrichtige
              personenbezogene Daten korrigieren zu lassen.
            </li>
            <li>
              <strong>Löschung</strong> (Art. 17) &mdash; die Löschung deiner
              personenbezogenen Daten zu verlangen (&bdquo;Recht auf
              Vergessenwerden&ldquo;).
            </li>
            <li>
              <strong>Einschränkung der Verarbeitung</strong> (Art. 18) &mdash;
              die Einschränkung der Nutzung deiner Daten zu verlangen.
            </li>
            <li>
              <strong>Datenübertragbarkeit</strong> (Art. 20) &mdash; deine
              Daten in einem maschinenlesbaren Format zu erhalten.
            </li>
            <li>
              <strong>Widerspruch</strong> (Art. 21) &mdash; der Verarbeitung
              auf Grundlage berechtigter Interessen zu widersprechen.
            </li>
            <li>
              <strong>Widerruf der Einwilligung</strong> &mdash; soweit eine
              Verarbeitung auf Einwilligung beruht, kannst du diese jederzeit
              ohne Auswirkung auf die Rechtmäßigkeit der bisherigen Verarbeitung
              widerrufen.
            </li>
          </ul>
          <p className="mt-2">
            Um eines dieser Rechte auszuüben, kontaktiere uns bitte unter{" "}
            <a
              href="mailto:privacy@openclienting.org"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              privacy@openclienting.org
            </a>
            . Wir antworten innerhalb von 30 Tagen.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">
            9. Beschwerderecht
          </h2>
          <p className="mt-2">
            Wenn du der Auffassung bist, dass die Verarbeitung deiner
            personenbezogenen Daten gegen die DSGVO verstößt, hast du das Recht,
            Beschwerde bei einer Aufsichtsbehörde einzulegen, insbesondere im
            EU-Mitgliedstaat deines gewöhnlichen Aufenthaltsorts, deines
            Arbeitsplatzes oder des Orts der mutmaßlichen Verletzung (Art. 77
            DSGVO).
          </p>
          <p className="mt-2">
            Die für uns zuständige Aufsichtsbehörde ist:
            <br />
            Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)
            <br />
            Promenade 18, 91522 Ansbach, Deutschland
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
            10. Automatisierte Entscheidungsfindung
          </h2>
          <p className="mt-2">
            Wir verwenden keine automatisierte Entscheidungsfindung oder
            Profiling, die rechtliche Wirkung gegenüber dir entfaltet oder dich
            in ähnlicher Weise erheblich beeinträchtigt.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">
            11. Änderungen dieser Datenschutzerklärung
          </h2>
          <p className="mt-2">
            Wir können diese Datenschutzerklärung von Zeit zu Zeit aktualisieren.
            Das Datum &bdquo;Stand&ldquo; oben auf dieser Seite zeigt an, wann
            die Erklärung zuletzt überarbeitet wurde. Wir empfehlen, diese Seite
            regelmäßig zu besuchen.
          </p>
        </section>
      </div>
    </>
  );
}
