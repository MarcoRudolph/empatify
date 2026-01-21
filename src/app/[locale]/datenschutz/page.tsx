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
            
            {/* PDF Download Section */}
            <div className="mt-8">
              <a 
                href="/datenschutzerklaerung_date_talk_de_de.pdf" 
                download
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Download className="w-5 h-5" />
                {t('downloadPDF')}
              </a>
            </div>
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
                    2. Hosting
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Wir hosten die Inhalte unserer Website bei folgendem Anbieter:
                  </p>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Strato</h3>
                  <p className="text-gray-600 mb-4">
                    Anbieter ist die Strato AG, Otto-Ostrowski-Straße 7, 10249 Berlin (nachfolgend &ldquo;Strato&rdquo;). Wenn Sie unsere Website besuchen, erfasst Strato verschiedene Logfiles inklusive Ihrer IP-Adressen.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Weitere Informationen entnehmen Sie der Datenschutzerklärung von Strato: <a href="https://www.strato.de/datenschutz/" className="text-purple-600 hover:text-purple-700 underline">https://www.strato.de/datenschutz/</a>.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Die Verwendung von Strato erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Wir haben ein berechtigtes Interesse an einer möglichst zuverlässigen Darstellung unserer Website. Sofern eine entsprechende Einwilligung abgefragt wurde, erfolgt die Verarbeitung ausschließlich auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1 TDDDG, soweit die Einwilligung die Speicherung von Cookies oder den Zugriff auf Informationen im Endgerät des Nutzers (z. B. Device-Fingerprinting) im Sinne des TDDDG umfasst. Die Einwilligung ist jederzeit widerrufbar.
                  </p>
                  <h4 className="text-md font-semibold text-gray-700 mb-2">Auftragsverarbeitung</h4>
                  <p className="text-gray-600 mb-4">
                    Wir haben einen Vertrag über Auftragsverarbeitung (AVV) zur Nutzung des oben genannten Dienstes geschlossen. Hierbei handelt es sich um einen datenschutzrechtlich vorgeschriebenen Vertrag, der gewährleistet, dass dieser die personenbezogenen Daten unserer Websitebesucher nur nach unseren Weisungen und unter Einhaltung der DSGVO verarbeitet.
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
                    5. Soziale Medien
                  </h2>
                  
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Instagram</h3>
                  <p className="text-gray-600 mb-4">
                    Auf dieser Website sind Funktionen des Dienstes Instagram eingebunden. Diese Funktionen werden angeboten durch die Meta Platforms Ireland Limited, Merrion Road, Dublin 4, D04 X2K5, Irland.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Wenn das Social-Media-Element aktiv ist, wird eine direkte Verbindung zwischen Ihrem Endgerät und dem Instagram-Server hergestellt. Instagram erhält dadurch Informationen über den Besuch dieser Website durch Sie.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Wenn Sie in Ihrem Instagram-Account eingeloggt sind, können Sie durch Anklicken des Instagram-Buttons die Inhalte dieser Website mit Ihrem Instagram-Profil verlinken. Dadurch kann Instagram den Besuch dieser Website Ihrem Benutzerkonto zuordnen. Wir weisen darauf hin, dass wir als Anbieter der Seiten keine Kenntnis vom Inhalt der übermittelten Daten sowie deren Nutzung durch Instagram erhalten.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Die Nutzung dieses Dienstes erfolgt auf Grundlage Ihrer Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1 TDDDG. Die Einwilligung ist jederzeit widerrufbar.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Soweit mit Hilfe des hier beschriebenen Tools personenbezogene Daten auf unserer Website erfasst und an Facebook bzw. Instagram weitergeleitet werden, sind wir und die Meta Platforms Ireland Limited, 4 Grand Canal Square, Grand Canal Harbour, Dublin 2, Irland gemeinsam für diese Datenverarbeitung verantwortlich (Art. 26 DSGVO). Die gemeinsame Verantwortlichkeit beschränkt sich dabei ausschließlich auf die Erfassung der Daten und deren Weitergabe an Facebook bzw. Instagram. Die nach der Weiterleitung erfolgende Verarbeitung durch Facebook bzw. Instagram ist nicht Teil der gemeinsamen Verantwortlichkeit.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Die uns gemeinsam obliegenden Verpflichtungen wurden in einer Vereinbarung über gemeinsame Verarbeitung festgehalten. Den Wortlaut der Vereinbarung finden Sie unter: <a href="https://www.facebook.com/legal/controller_addendum" className="text-purple-600 hover:text-purple-700 underline">https://www.facebook.com/legal/controller_addendum</a>. Laut dieser Vereinbarung sind wir für die Erteilung der Datenschutzinformationen beim Einsatz des Facebook- bzw. Instagram-Tools und für die datenschutzrechtlich sichere Implementierung des Tools auf unserer Website verantwortlich. Für die Datensicherheit der Facebook bzw. Instagram-Produkte ist Facebook verantwortlich. Betroffenenrechte (z. B. Auskunftsersuchen) hinsichtlich der bei Facebook bzw. Instagram verarbeiteten Daten können Sie direkt bei Facebook geltend machen. Wenn Sie die Betroffenenrechte bei uns geltend machen, sind wir verpflichtet, diese an Facebook weiterzuleiten.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Die Datenübertragung in die USA wird auf die Standardvertragsklauseln der EU-Kommission gestützt. Details finden Sie hier:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-4">
                    <li><a href="https://www.facebook.com/legal/EU_data_transfer_addendum" className="text-purple-600 hover:text-purple-700 underline">https://www.facebook.com/legal/EU_data_transfer_addendum</a></li>
                    <li><a href="https://privacycenter.instagram.com/policy/" className="text-purple-600 hover:text-purple-700 underline">https://privacycenter.instagram.com/policy/</a></li>
                    <li><a href="https://de-de.facebook.com/help/566994660333381" className="text-purple-600 hover:text-purple-700 underline">https://de-de.facebook.com/help/566994660333381</a></li>
                  </ul>
                  <p className="text-gray-600 mb-4">
                    Weitere Informationen hierzu finden Sie in der Datenschutzerklärung von Instagram: <a href="https://privacycenter.instagram.com/policy/" className="text-purple-600 hover:text-purple-700 underline">https://privacycenter.instagram.com/policy/</a>.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Das Unternehmen verfügt über eine Zertifizierung nach dem &ldquo;EU-US Data Privacy Framework&rdquo; (DPF). Der DPF ist ein Übereinkommen zwischen der Europäischen Union und den USA, der die Einhaltung europäischer Datenschutzstandards bei Datenverarbeitungen in den USA gewährleisten soll. Jedes nach dem DPF zertifizierte Unternehmen verpflichtet sich, diese Datenschutzstandards einzuhalten. Weitere Informationen hierzu erhalten Sie vom Anbieter unter folgendem Link: <a href="https://www.dataprivacyframework.gov/participant/4452" className="text-purple-600 hover:text-purple-700 underline">https://www.dataprivacyframework.gov/participant/4452</a>.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    6. Plugins und Tools
                  </h2>
                  
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Google Fonts</h3>
                  <p className="text-gray-600 mb-4">
                    Diese Seite nutzt zur einheitlichen Darstellung von Schriftarten so genannte Google Fonts, die von Google bereitgestellt werden. Beim Aufruf einer Seite lädt Ihr Browser die benötigten Fonts in ihren Browsercache, um Texte und Schriftarten korrekt anzuzeigen.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Zu diesem Zweck muss der von Ihnen verwendete Browser Verbindung zu den Servern von Google aufnehmen. Hierdurch erlangt Google Kenntnis darüber, dass über Ihre IP-Adresse diese Website aufgerufen wurde. Die Nutzung von Google Fonts erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Der Websitebetreiber hat ein berechtigtes Interesse an der einheitlichen Darstellung des Schriftbildes auf seiner Website. Sofern eine entsprechende Einwilligung abgefragt wurde, erfolgt die Verarbeitung ausschließlich auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1 TDDDG, soweit die Einwilligung die Speicherung von Cookies oder den Zugriff auf Informationen im Endgerät des Nutzers (z. B. Device-Fingerprinting) im Sinne des TDDDG umfasst. Die Einwilligung ist jederzeit widerrufbar.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Wenn Ihr Browser Google Fonts nicht unterstützt, wird eine Standardschrift von Ihrem Computer genutzt.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Weitere Informationen zu Google Fonts finden Sie unter <a href="https://developers.google.com/fonts/faq" className="text-purple-600 hover:text-purple-700 underline">https://developers.google.com/fonts/faq</a> und in der Datenschutzerklärung von Google: <a href="https://policies.google.com/privacy?hl=de" className="text-purple-600 hover:text-purple-700 underline">https://policies.google.com/privacy?hl=de</a>.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Das Unternehmen verfügt über eine Zertifizierung nach dem &ldquo;EU-US Data Privacy Framework&rdquo; (DPF). Der DPF ist ein Übereinkommen zwischen der Europäischen Union und den USA, der die Einhaltung europäischer Datenschutzstandards bei Datenverarbeitungen in den USA gewährleisten soll. Jedes nach dem DPF zertifizierte Unternehmen verpflichtet sich, diese Datenschutzstandards einzuhalten. Weitere Informationen hierzu erhalten Sie vom Anbieter unter folgendem Link: <a href="https://www.dataprivacyframework.gov/participant/5780" className="text-purple-600 hover:text-purple-700 underline">https://www.dataprivacyframework.gov/participant/5780</a>.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Cloudflare</h3>
                  <p className="text-gray-600 mb-4">
                    Unsere Website nutzt die Dienste von Cloudflare (Cloudflare Inc., 101 Townsend St, San Francisco, CA 94107, USA) zur Absicherung und Optimierung der Ladezeiten. Cloudflare fungiert als Content Delivery Network (CDN) und bietet Schutz vor DDoS-Angriffen. Hierbei werden personenbezogene Daten, wie Ihre IP-Adresse, an Server von Cloudflare übertragen und dort verarbeitet.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Weitere Informationen finden Sie in der Datenschutzerklärung von Cloudflare: <a href="https://www.cloudflare.com/privacypolicy/" className="text-purple-600 hover:text-purple-700 underline">https://www.cloudflare.com/privacypolicy/</a>.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Einsatz von Künstlicher Intelligenz (KI)</h3>
                  <p className="text-gray-600 mb-4">
                    Auf unserer Website setzen wir Funktionen ein, die auf Künstlicher Intelligenz (KI) basieren, um Ihnen personalisierte Inhalte, Empfehlungen oder eine automatisierte Interaktion (z.B. Chatbot) zu ermöglichen. Hierbei können personenbezogene Daten wie Interaktionen, Texteingaben und Nutzungsverhalten verarbeitet und anonymisiert an externe KI-Dienstleister übertragen werden. Die Verarbeitung erfolgt ausschließlich auf Grundlage Ihrer Einwilligung und dient der Verbesserung unserer Dienste.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Google Analytics</h3>
                  <p className="text-gray-600 mb-4">
                    Diese Website benutzt Google Analytics, einen Webanalysedienst der Google Ireland Limited (&ldquo;Google&rdquo;), Gordon House, Barrow Street, Dublin 4, Irland. Google Analytics verwendet Cookies, die eine Analyse Ihrer Benutzung der Website ermöglichen. Die durch das Cookie erzeugten Informationen über Ihre Benutzung dieser Website werden in der Regel an einen Server von Google in den USA übertragen und dort gespeichert. Wir nutzen die IP-Anonymisierung, sodass Ihre IP-Adresse von Google innerhalb der Europäischen Union zuvor gekürzt wird.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Nähere Informationen finden Sie unter: <a href="https://policies.google.com/privacy" className="text-purple-600 hover:text-purple-700 underline">https://policies.google.com/privacy</a>.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Meta Conversion API (Facebook Conversion API)</h3>
                  <p className="text-gray-600 mb-4">
                    Unsere Website verwendet die Meta Conversion API, einen Dienst der Meta Platforms Ireland Ltd., 4 Grand Canal Square, Grand Canal Harbour, Dublin 2, Irland. Mit der Conversion API werden Daten wie Ihre IP-Adresse, Nutzerverhalten oder Bestellungen direkt von unseren Servern an Meta übermittelt, um die Effektivität unserer Werbemaßnahmen auf Facebook und Instagram zu messen.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Weitere Informationen zur Datenverarbeitung durch Meta finden Sie unter: <a href="https://www.facebook.com/about/privacy/" className="text-purple-600 hover:text-purple-700 underline">https://www.facebook.com/about/privacy/</a>.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-700 mb-3">TikTok Pixel</h3>
                  <p className="text-gray-600 mb-4">
                    Wir verwenden auf unserer Website das TikTok Pixel, einen Analysedienst der TikTok Technology Limited, 10 Earlsfort Terrace, Dublin, D02 T380, Irland. Mithilfe des Pixels können wir das Verhalten der Nutzer nachverfolgen, nachdem diese durch einen Klick auf eine TikTok-Werbeanzeige auf unsere Website weitergeleitet wurden. TikTok erhält dadurch Informationen, wie etwa Ihre IP-Adresse und Interaktionen auf der Website.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Weitere Informationen finden Sie unter: <a href="https://www.tiktok.com/legal/privacy-policy?lang=de" className="text-purple-600 hover:text-purple-700 underline">https://www.tiktok.com/legal/privacy-policy?lang=de</a>.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-700 mb-3">ChatGPT</h3>
                  <p className="text-gray-600 mb-4">
                    Wir setzen auf unserer Website ChatGPT von OpenAI (OpenAI, L.L.C., 3180 18th St, San Francisco, CA 94110, USA) ein, um Ihnen eine interaktive Beratung bzw. Chatfunktion bereitzustellen. Dabei können eingegebene Daten wie Textnachrichten und Interaktionen an die Server von OpenAI übertragen werden. Die Verarbeitung erfolgt zur Erbringung der jeweiligen Chat-Dienstleistung und zur Verbesserung unseres Angebots.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Weitere Informationen: <a href="https://openai.com/policies/privacy-policy" className="text-purple-600 hover:text-purple-700 underline">https://openai.com/policies/privacy-policy</a>.
                  </p>

                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Einsatz von Zahlungsdienstleistern</h3>
                  <p className="text-gray-600 mb-4">
                    Für die Abwicklung von Zahlungen bieten wir verschiedene Zahlungsdienstleister an (z.B. PayPal, Stripe, Klarna). Im Rahmen des Zahlungsvorgangs werden Ihre Zahlungsdaten wie Name, Adresse, E-Mail-Adresse und Zahlungsinformationen an den jeweiligen Zahlungsdienstleister übermittelt. Die Verarbeitung dieser Daten erfolgt ausschließlich zur Zahlungsabwicklung. Weitere Informationen entnehmen Sie bitte der Datenschutzerklärung des jeweiligen Anbieters.
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