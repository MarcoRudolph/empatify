'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, Download } from 'lucide-react';
// Entferne: import { COOKIEBOT_CONFIG } from '@/lib/cookiebot';

export default function DatenschutzPage() {
  const t = useTranslations('privacy');

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-pink-100/80 to-purple-100/80 backdrop-blur-sm border-b border-pink-100/20">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <Link href="/#top" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" />
              {t('backToHome')}
            </Link>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 mb-4">
              {t('title')}
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
            
            {/* PDF Download Section - Removed for now */}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card className="border-none shadow-lg">
            <CardHeader className="text-center border-b border-gray-100">
              <CardTitle className="text-2xl font-semibold text-gray-800">
                Datenschutzerklärung
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="prose prose-lg max-w-none">
                
                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    1. Datenschutz auf einen Blick
                  </h2>
                  
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Allgemeine Hinweise</h3>
                  <p className="text-gray-600 mb-4">
                    Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können. Ausführliche Informationen zum Thema Datenschutz entnehmen Sie unserer unter diesem Text aufgeführten Datenschutzerklärung.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Datenerfassung auf dieser Website</h3>
                  
                  <h4 className="text-md font-semibold text-gray-700 mb-2">Wer ist verantwortlich für die Datenerfassung auf dieser Website?</h4>
                  <p className="text-gray-600 mb-4">
                    Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten können Sie dem Abschnitt &ldquo;Hinweis zur Verantwortlichen Stelle&rdquo; in dieser Datenschutzerklärung entnehmen.
                  </p>

                  <h4 className="text-md font-semibold text-gray-700 mb-2">Wie erfassen wir Ihre Daten?</h4>
                  <p className="text-gray-600 mb-4">
                    Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z. B. um Daten handeln, die Sie in ein Kontaktformular eingeben.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Andere Daten werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website durch unsere IT-Systeme erfasst. Das sind vor allem technische Daten (z. B. Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs). Die Erfassung dieser Daten erfolgt automatisch, sobald Sie diese Website betreten.
                  </p>

                  <h4 className="text-md font-semibold text-gray-700 mb-2">Wofür nutzen wir Ihre Daten?</h4>
                  <p className="text-gray-600 mb-4">
                    Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten. Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden. Sofern über die Website Verträge geschlossen oder angebahnt werden können, werden die übermittelten Daten auch für Vertragsangebote, Bestellungen oder sonstige Auftragsanfragen verarbeitet.
                  </p>

                  <h4 className="text-md font-semibold text-gray-700 mb-2">Welche Rechte haben Sie bezüglich Ihrer Daten?</h4>
                  <p className="text-gray-600 mb-4">
                    Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung oder Löschung dieser Daten zu verlangen. Wenn Sie eine Einwilligung zur Datenverarbeitung erteilt haben, können Sie diese Einwilligung jederzeit für die Zukunft widerrufen. Außerdem haben Sie das Recht, unter bestimmten Umständen die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen. Des Weiteren steht Ihnen ein Beschwerderecht bei der zuständigen Aufsichtsbehörde zu.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Hierzu sowie zu weiteren Fragen zum Thema Datenschutz können Sie sich jederzeit an uns wenden.
                  </p>

                  <h4 className="text-md font-semibold text-gray-700 mb-2">Analyse-Tools und Tools von Drittanbietern</h4>
                  <p className="text-gray-600 mb-4">
                    Beim Besuch dieser Website kann Ihr Surf-Verhalten statistisch ausgewertet werden. Das geschieht vor allem mit sogenannten Analyseprogrammen.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Detaillierte Informationen zu diesen Analyseprogrammen finden Sie in der folgenden Datenschutzerklärung.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    2. Hosting und externe Dienste
                  </h2>
                  
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Vercel</h3>
                  <p className="text-gray-600 mb-4">
                    Wir hosten die Inhalte unserer Website bei Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA (nachfolgend &ldquo;Vercel&rdquo;). Wenn Sie unsere Website besuchen, erfasst Vercel verschiedene Logfiles inklusive Ihrer IP-Adressen zur technischen Bereitstellung und Sicherheit der Website.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Weitere Informationen entnehmen Sie der Datenschutzerklärung von Vercel: <a href="https://vercel.com/legal/privacy-policy" className="text-purple-600 hover:text-purple-700 underline">https://vercel.com/legal/privacy-policy</a>.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Die Verwendung von Vercel erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Wir haben ein berechtigtes Interesse an einer möglichst zuverlässigen und schnellen Darstellung unserer Website.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Supabase</h3>
                  <p className="text-gray-600 mb-4">
                    Für die Benutzer-Authentifizierung und Datenspeicherung nutzen wir Supabase (Supabase Inc., USA). Hierbei werden personenbezogene Daten wie E-Mail-Adressen, Benutzernamen und Spielinformationen verarbeitet und auf Servern von Supabase gespeichert.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Weitere Informationen: <a href="https://supabase.com/privacy" className="text-purple-600 hover:text-purple-700 underline">https://supabase.com/privacy</a>.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Spotify Web API</h3>
                  <p className="text-gray-600 mb-4">
                    Empatify nutzt die Spotify Web API (Spotify AB, Regeringsgatan 19, 111 53 Stockholm, Schweden) zur Anzeige und Wiedergabe von Musiktiteln. Wenn Sie Songs suchen oder abspielen, werden Ihre Suchanfragen und Interaktionen an Spotify übermittelt. Die Verarbeitung erfolgt auf Grundlage Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO).
                  </p>
                  <p className="text-gray-600 mb-4">
                    Weitere Informationen: <a href="https://www.spotify.com/de/legal/privacy-policy/" className="text-purple-600 hover:text-purple-700 underline">https://www.spotify.com/de/legal/privacy-policy/</a>.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    3. Allgemeine Hinweise und Pflichtinformationen
                  </h2>
                  
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Datenschutz</h3>
                  <p className="text-gray-600 mb-4">
                    Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Wenn Sie diese Website benutzen, werden verschiedene personenbezogene Daten erhoben. Personenbezogene Daten sind Daten, mit denen Sie persönlich identifiziert werden können. Die vorliegende Datenschutzerklärung erläutert, welche Daten wir erheben und wofür wir sie nutzen. Sie erläutert auch, wie und zu welchem Zweck das geschieht.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Wir weisen darauf hin, dass die Datenübertragung im Internet (z. B. bei der Kommunikation per E-Mail) Sicherheitslücken aufweisen kann. Ein lückenloser Schutz der Daten vor dem Zugriff durch Dritte ist nicht möglich.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Hinweis zur verantwortlichen Stelle</h3>
                  <p className="text-gray-600 mb-4">
                    Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <p className="text-gray-600"><strong>Marco Rudolph</strong></p>
                    <p className="text-gray-600">No de Halloh 8a</p>
                    <p className="text-gray-600">25591 Ottenbüttel</p>
                    <p className="text-gray-600">Telefon: 048939373110</p>
                    <p className="text-gray-600">E-Mail: marcorudolph09@proton.me</p>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Verantwortliche Stelle ist die natürliche oder juristische Person, die allein oder gemeinsam mit anderen über die Zwecke und Mittel der Verarbeitung von personenbezogenen Daten (z. B. Namen, E-Mail-Adressen o. Ä.) entscheidet.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Speicherdauer</h3>
                  <p className="text-gray-600 mb-4">
                    Soweit innerhalb dieser Datenschutzerklärung keine speziellere Speicherdauer genannt wurde, verbleiben Ihre personenbezogenen Daten bei uns, bis der Zweck für die Datenverarbeitung entfällt. Wenn Sie ein berechtigtes Löschersuchen geltend machen oder eine Einwilligung zur Datenverarbeitung widerrufen, werden Ihre Daten gelöscht, sofern wir keine anderen rechtlich zulässigen Gründe für die Speicherung Ihrer personenbezogenen Daten haben (z. B. steuer- oder handelsrechtliche Aufbewahrungsfristen); im letztgenannten Fall erfolgt die Löschung nach Fortfall dieser Gründe.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Allgemeine Hinweise zu den Rechtsgrundlagen der Datenverarbeitung auf dieser Website</h3>
                  <p className="text-gray-600 mb-4">
                    Sofern Sie in die Datenverarbeitung eingewilligt haben, verarbeiten wir Ihre personenbezogenen Daten auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO bzw. Art. 9 Abs. 2 lit. a DSGVO, sofern besondere Datenkategorien nach Art. 9 Abs. 1 DSGVO verarbeitet werden. Im Falle einer ausdrücklichen Einwilligung in die Übertragung personenbezogener Daten in Drittstaaten erfolgt die Datenverarbeitung außerdem auf Grundlage von Art. 49 Abs. 1 lit. a DSGVO. Sofern Sie in die Speicherung von Cookies oder in den Zugriff auf Informationen in Ihr Endgerät (z. B. via Device-Fingerprinting) eingewilligt haben, erfolgt die Datenverarbeitung zusätzlich auf Grundlage von § 25 Abs. 1 TDDDG. Die Einwilligung ist jederzeit widerrufbar. Sind Ihre Daten zur Vertragserfüllung oder zur Durchführung vorvertraglicher Maßnahmen erforderlich, verarbeiten wir Ihre Daten auf Grundlage des Art. 6 Abs. 1 lit. b DSGVO. Des Weiteren verarbeiten wir Ihre Daten, sofern diese zur Erfüllung einer rechtlichen Verpflichtung erforderlich sind auf Grundlage von Art. 6 Abs. 1 lit. c DSGVO. Die Datenverarbeitung kann ferner auf Grundlage unseres berechtigten Interesses nach Art. 6 Abs. 1 lit. f DSGVO erfolgen. Über die jeweils im Einzelfall einschlägigen Rechtsgrundlagen wird in den folgenden Absätzen dieser Datenschutzerklärung informiert.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Empfänger von personenbezogenen Daten</h3>
                  <p className="text-gray-600 mb-4">
                    Im Rahmen unserer Geschäftstätigkeit arbeiten wir mit verschiedenen externen Stellen zusammen. Dabei ist teilweise auch eine Übermittlung von personenbezogenen Daten an diese externen Stellen erforderlich. Wir geben personenbezogene Daten nur dann an externe Stellen weiter, wenn dies im Rahmen einer Vertragserfüllung erforderlich ist, wenn wir gesetzlich hierzu verpflichtet sind (z. B. Weitergabe von Daten an Steuerbehörden), wenn wir ein berechtigtes Interesse nach Art. 6 Abs. 1 lit. f DSGVO an der Weitergabe haben oder wenn eine sonstige Rechtsgrundlage die Datenweitergabe erlaubt. Beim Einsatz von Auftragsverarbeitern geben wir personenbezogene Daten unserer Kunden nur auf Grundlage eines gültigen Vertrags über Auftragsverarbeitung weiter. Im Falle einer gemeinsamen Verarbeitung wird ein Vertrag über gemeinsame Verarbeitung geschlossen.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Widerruf Ihrer Einwilligung zur Datenverarbeitung</h3>
                  <p className="text-gray-600 mb-4">
                    Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung möglich. Sie können eine bereits erteilte Einwilligung jederzeit widerrufen. Die Rechtmäßigkeit der bis zum Widerruf erfolgten Datenverarbeitung bleibt vom Widerruf unberührt.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Widerspruchsrecht gegen die Datenerhebung in besonderen Fällen sowie gegen Direktwerbung (Art. 21 DSGVO)</h3>
                  <p className="text-gray-600 mb-4">
                    <strong>WENN DIE DATENVERARBEITUNG AUF GRUNDLAGE VON ART. 6 ABS. 1 LIT. E ODER F DSGVO ERFOLGT, HABEN SIE JEDERZEIT DAS RECHT, AUS GRÜNDEN, DIE SICH AUS IHRER BESONDEREN SITUATION ERGEBEN, GEGEN DIE VERARBEITUNG IHRER PERSONENBEZOGENEN DATEN WIDERSPRUCH EINZULEGEN; DIES GILT AUCH FÜR EIN AUF DIESE BESTIMMUNGEN GESTÜTZTES PROFILING. DIE JEWEILIGE RECHTSGRUNDLAGE, AUF DENEN EINE VERARBEITUNG BERUHT, ENTNEHMEN SIE DIESER DATENSCHUTZERKLÄRUNG. WENN SIE WIDERSPRUCH EINLEGEN, WERDEN WIR IHRE BETROFFENEN PERSONENBEZOGENEN DATEN NICHT MEHR VERARBEITEN, ES SEI DENN, WIR KÖNNEN ZWINGENDE SCHUTZWÜRDIGE GRÜNDE FÜR DIE VERARBEITUNG NACHWEISEN, DIE IHRE INTERESSEN, RECHTE UND FREIHEITEN ÜBERWIEGEN ODER DIE VERARBEITUNG DIENT DER GELTENDMACHUNG, AUSÜBUNG ODER VERTEIDIGUNG VON RECHTSANSPRÜCHEN (WIDERSPRUCH NACH ART. 21 ABS. 1 DSGVO).</strong>
                  </p>
                  <p className="text-gray-600 mb-4">
                    <strong>WERDEN IHRE PERSONENBEZOGENEN DATEN VERARBEITET, UM DIREKTWERBUNG ZU BETREIBEN, SO HABEN SIE DAS RECHT, JEDERZEIT WIDERSPRUCH GEGEN DIE VERARBEITUNG SIE BETREFFENDER PERSONENBEZOGENER DATEN ZUM ZWECKE DERARTIGER WERBUNG EINZULEGEN; DIES GILT AUCH FÜR DAS PROFILING, SOWEIT ES MIT SOLCHER DIREKTWERBUNG IN VERBINDUNG STEHT. WENN SIE WIDERSPRECHEN, WERDEN IHRE PERSONENBEZOGENEN DATEN ANSCHLIESSEND NICHT MEHR ZUM ZWECKE DER DIREKTWERBUNG VERWENDET (WIDERSPRUCH NACH ART. 21 ABS. 2 DSGVO).</strong>
                  </p>

                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Beschwerderecht bei der zuständigen Aufsichtsbehörde</h3>
                  <p className="text-gray-600 mb-4">
                    Im Falle von Verstößen gegen die DSGVO steht den Betroffenen ein Beschwerderecht bei einer Aufsichtsbehörde, insbesondere in dem Mitgliedstaat ihres gewöhnlichen Aufenthalts, ihres Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes zu. Das Beschwerderecht besteht unbeschadet anderweitiger verwaltungsrechtlicher oder gerichtlicher Rechtsbehelfe.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Recht auf Datenübertragbarkeit</h3>
                  <p className="text-gray-600 mb-4">
                    Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung oder in Erfüllung eines Vertrags automatisiert verarbeiten, an sich oder an einen Dritten in einem gängigen, maschinenlesbaren Format aushändigen zu lassen. Sofern Sie die direkte Übertragung der Daten an einen anderen Verantwortlichen verlangen, erfolgt dies nur, soweit es technisch machbar ist.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Auskunft, Berichtigung und Löschung</h3>
                  <p className="text-gray-600 mb-4">
                    Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger und den Zweck der Datenverarbeitung und ggf. ein Recht auf Berichtigung oder Löschung dieser Daten. Hierzu sowie zu weiteren Fragen zum Thema personenbezogene Daten können Sie sich jederzeit an uns wenden.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Recht auf Einschränkung der Verarbeitung</h3>
                  <p className="text-gray-600 mb-4">
                    Sie haben das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen. Hierzu können Sie sich jederzeit an uns wenden. Das Recht auf Einschränkung der Verarbeitung besteht in folgenden Fällen:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-4">
                    <li>Wenn Sie die Richtigkeit Ihrer bei uns gespeicherten personenbezogenen Daten bestreiten, benötigen wir in der Regel Zeit, um dies zu überprüfen. Für die Dauer der Prüfung haben Sie das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen.</li>
                    <li>Wenn die Verarbeitung Ihrer personenbezogenen Daten unrechtmäßig geschah/geschieht, können Sie statt der Löschung die Einschränkung der Datenverarbeitung verlangen.</li>
                    <li>Wenn wir Ihre personenbezogenen Daten nicht mehr benötigen, Sie sie jedoch zur Ausübung, Verteidigung oder Geltendmachung von Rechtsansprüchen benötigen, haben Sie das Recht, statt der Löschung die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen.</li>
                    <li>Wenn Sie einen Widerspruch nach Art. 21 Abs. 1 DSGVO eingelegt haben, muss eine Abwägung zwischen Ihren und unseren Interessen vorgenommen werden. Solange noch nicht feststeht, wessen Interessen überwiegen, haben Sie das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen.</li>
                  </ul>
                  <p className="text-gray-600 mb-4">
                    Wenn Sie die Verarbeitung Ihrer personenbezogenen Daten eingeschränkt haben, dürfen diese Daten – von ihrer Speicherung abgesehen – nur mit Ihrer Einwilligung oder zur Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen oder zum Schutz der Rechte einer anderen natürlichen oder juristischen Person oder aus Gründen eines wichtigen öffentlichen Interesses der Europäischen Union oder eines Mitgliedstaats verarbeitet werden.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    4. Datenerfassung auf dieser Website
                  </h2>
                  
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Cookies</h3>
                  <p className="text-gray-600 mb-4">
                    Unsere Internetseiten verwenden so genannte &quot;Cookies&quot;. Cookies sind kleine Datenpakete und richten auf Ihrem Endgerät keinen Schaden an. Sie werden entweder vorübergehend für die Dauer einer Sitzung (Session-Cookies) oder dauerhaft (permanente Cookies) auf Ihrem Endgerät gespeichert. Session-Cookies werden nach Ende Ihres Besuchs automatisch gelöscht. Permanente Cookies bleiben auf Ihrem Endgerät gespeichert, bis Sie diese selbst löschen oder eine automatische Löschung durch Ihren Webbrowser erfolgt.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Cookies können von uns (First-Party-Cookies) oder von Drittunternehmen stammen (sog. Third-Party Cookies). Third-Party-Cookies ermöglichen die Einbindung bestimmter Dienstleistungen von Drittunternehmen innerhalb von Webseiten (z. B. Cookies zur Abwicklung von Zahlungsdienstleistungen).
                  </p>
                  <p className="text-gray-600 mb-4">
                    Cookies haben verschiedene Funktionen. Zahlreiche Cookies sind technisch notwendig, da bestimmte Webseitenfunktionen ohne diese nicht funktionieren würden (z. B. die Warenkorbfunktion oder die Anzeige von Videos). Andere Cookies können zur Auswertung des Nutzerverhaltens oder zu Werbezwecken verwendet werden.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Cookies, die zur Durchführung des elektronischen Kommunikationsvorgangs, zur Bereitstellung bestimmter, von Ihnen gewünschter Funktionen (z. B. für die Warenkorbfunktion) oder zur Optimierung der Website (z. B. Cookies zur Messung des Webpublikums) erforderlich sind (notwendige Cookies), werden auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO gespeichert, sofern keine andere Rechtsgrundlage angegeben wird. Der Websitebetreiber hat ein berechtigtes Interesse an der Speicherung von notwendigen Cookies zur technisch fehlerfreien und optimierten Bereitstellung seiner Dienste. Sofern eine Einwilligung zur Speicherung von Cookies und vergleichbaren Wiedererkennungstechnologien abgefragt wurde, erfolgt die Verarbeitung ausschließlich auf Grundlage dieser Einwilligung (Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1 TDDDG); die Einwilligung ist jederzeit widerrufbar.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Sie können Ihren Browser so einstellen, dass Sie über das Setzen von Cookies informiert werden und Cookies nur im Einzelfall erlauben, die Annahme von Cookies für bestimmte Fälle oder generell ausschließen sowie das automatische Löschen der Cookies beim Schließen des Browsers aktivieren. Bei der Deaktivierung von Cookies kann die Funktionalität dieser Website eingeschränkt sein.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Welche Cookies und Dienste auf dieser Website eingesetzt werden, können Sie dieser Datenschutzerklärung entnehmen.
                  </p>
                  <div id="CookieDeclaration"></div>
                </section>


                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    5. Plugins und Tools
                  </h2>
                  
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">OpenAI API (ChatGPT)</h3>
                  <p className="text-gray-600 mb-4">
                    Empatify setzt die OpenAI API (OpenAI, L.L.C., 3180 18th St, San Francisco, CA 94110, USA) ein, um Song-Vorschläge automatisch auf die Übereinstimmung mit der Spiel-Kategorie zu überprüfen. Dabei werden Song-Metadaten (Titel, Künstler, Genre) und die gewählte Kategorie an die Server von OpenAI übertragen. Die Verarbeitung erfolgt zur Sicherstellung eines fairen Spielablaufs.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Es werden keine personenbezogenen Benutzerdaten an OpenAI übermittelt. Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Gewährleistung eines regelkonformen Spielablaufs).
                  </p>
                  <p className="text-gray-600 mb-4">
                    Weitere Informationen: <a href="https://openai.com/policies/privacy-policy" className="text-purple-600 hover:text-purple-700 underline">https://openai.com/policies/privacy-policy</a>.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Zahlungsabwicklung (Stripe)</h3>
                  <p className="text-gray-600 mb-4">
                    Für die Abwicklung von Zahlungen für den Pro-Plan nutzen wir Stripe (Stripe, Inc., 510 Townsend Street, San Francisco, CA 94103, USA). Im Rahmen des Zahlungsvorgangs werden Ihre Zahlungsdaten wie Name, E-Mail-Adresse und Zahlungsinformationen direkt an Stripe übermittelt. Empatify speichert keine Kreditkartendaten. Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
                  </p>
                  <p className="text-gray-600 mb-4">
                    Weitere Informationen: <a href="https://stripe.com/de/privacy" className="text-purple-600 hover:text-purple-700 underline">https://stripe.com/de/privacy</a>.
                  </p>
                </section>

              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cookiebot Declaration Script */}
      {/* Entfernt: <Script id="cookiebot-declaration" src={`https://consent.cookiebot.com/${COOKIEBOT_CONFIG.COOKIEBOT_ID}/cd.js`} strategy="afterInteractive" /> */}
    </div>
  );
} 