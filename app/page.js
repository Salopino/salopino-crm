'use client'

import { useMemo, useState } from 'react'

function euro(n) {
  return Number(n || 0).toLocaleString('fi-FI', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' €'
}

function isOverdue(dateStr, status) {
  if (!dateStr || status !== 'open') return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(`${dateStr}T00:00:00`)
  return due < today
}

function Section({ title, subtitle, children }) {
  return (
    <section className="module">
      <h2>{title}</h2>
      {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
      {children}
    </section>
  )
}

export default function Page() {
  const [activities, setActivities] = useState([])
  const [activityForm, setActivityForm] = useState({
    title: '',
    type: 'call',
    client: '',
    due_date: '',
    status: 'open',
    quote_id: '',
    notes: '',
  })

  const [templates, setTemplates] = useState([])
  const [quoteLines, setQuoteLines] = useState([])
  const [templateForm, setTemplateForm] = useState({
    selectedIndex: '',
    vat: 25.5,
    name: '',
    unit: '',
    qty: 1,
    unit_price: '',
    description: '',
  })

  const [quotes, setQuotes] = useState([])
  const [selectedQuoteIndex, setSelectedQuoteIndex] = useState(-1)
  const [quoteEditForm, setQuoteEditForm] = useState({
    quote_number: '',
    client_name: '',
    status: 'Luonnos',
    amount_vat0: '',
    notes: '',
  })

  const [netvisorSource, setNetvisorSource] = useState('pl')
  const [netvisorRaw, setNetvisorRaw] = useState('')
  const [netvisorLog, setNetvisorLog] = useState('Ei vielä analyysiä.')

  const [docs, setDocs] = useState([])
  const [docForm, setDocForm] = useState({
    document_type: 'tuloslaskelma',
    year: 2026,
    month: 4,
    source: '',
    file_name: '',
    url: '',
    notes: '',
  })

  const sortedActivities = useMemo(() => {
    return [...activities].sort((a, b) =>
      (a.due_date || '').localeCompare(b.due_date || '')
    )
  }, [activities])

  const sumVat0 = useMemo(() => {
    return quoteLines.reduce(
      (sum, line) => sum + Number(line.qty || 0) * Number(line.unit_price || 0),
      0
    )
  }, [quoteLines])

  const sumVat = useMemo(() => {
    return sumVat0 * (1 + Number(templateForm.vat || 0) / 100)
  }, [sumVat0, templateForm.vat])

  function handleActivityChange(e) {
    const { name, value } = e.target
    setActivityForm((prev) => ({ ...prev, [name]: value }))
  }

  function addActivity() {
    if (!activityForm.title.trim()) {
      alert('Anna aktiviteetille otsikko.')
      return
    }

    setActivities((prev) => [
      ...prev,
      {
        title: activityForm.title.trim(),
        type: activityForm.type,
        client: activityForm.client.trim(),
        due_date: activityForm.due_date,
        status: activityForm.status,
        quote_id: activityForm.quote_id.trim(),
        notes: activityForm.notes.trim(),
      },
    ])

    setActivityForm({
      title: '',
      type: 'call',
      client: '',
      due_date: '',
      status: 'open',
      quote_id: '',
      notes: '',
    })
  }

  function seedActivities() {
    setActivities([
      {
        title: 'Soita asiakkaalle tarjouksesta',
        type: 'call',
        client: 'Sponda',
        due_date: '2026-04-04',
        status: 'open',
        quote_id: 'SAL-2026-041',
        notes: 'Tarkista päätöksentekijän aikataulu ja seuraava askel.',
      },
      {
        title: 'Lähetä follow-up sähköpostilla',
        type: 'followup',
        client: 'Technopolis',
        due_date: '2026-04-02',
        status: 'open',
        quote_id: 'SAL-2026-039',
        notes: 'Nosta esiin turvallisuus- ja perehdytyshyödyt.',
      },
    ])
  }

  function markActivityDone(index) {
    setActivities((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, status: 'done' } : item
      )
    )
  }

  function deleteActivity(index) {
    setActivities((prev) => prev.filter((_, i) => i !== index))
  }

  function loadDefaultTemplates() {
    const data = [
      {
        name: 'Kiinteistön 3D-kuvaus',
        unit: 'm²',
        default_qty: 500,
        unit_price: 0.8,
        description: 'Markkinointikäyttöön soveltuva 3D-kuvaus.',
      },
      {
        name: 'Turvallisuuskuvaus',
        unit: 'kohde',
        default_qty: 1,
        unit_price: 700,
        description:
          'Tagit, poistumistiet, alkusammutuskalusto ja riskipisteet.',
      },
      {
        name: 'Perehdytyskuvaus',
        unit: 'kohde',
        default_qty: 1,
        unit_price: 1000,
        description:
          'Virtuaalinen perehdytys, kulkureitit ja toimintaohjeiden upotus.',
      },
    ]
    setTemplates(data)
    setTemplateForm((prev) => ({
      ...prev,
      selectedIndex: '0',
      name: data[0].name,
      unit: data[0].unit,
      qty: data[0].default_qty,
      unit_price: data[0].unit_price,
      description: data[0].description,
    }))
  }

  function handleTemplateSelect(indexValue) {
    setTemplateForm((prev) => ({ ...prev, selectedIndex: indexValue }))
    const idx = Number(indexValue)
    const tpl = templates[idx]
    if (!tpl) return
    setTemplateForm((prev) => ({
      ...prev,
      selectedIndex: indexValue,
      name: tpl.name || '',
      unit: tpl.unit || '',
      qty: tpl.default_qty || 1,
      unit_price: tpl.unit_price || '',
      description: tpl.description || '',
    }))
  }

  function addQuoteLineFromTemplate() {
    if (!templateForm.name.trim()) {
      alert('Rivin nimi puuttuu.')
      return
    }

    setQuoteLines((prev) => [
      ...prev,
      {
        name: templateForm.name.trim(),
        unit: templateForm.unit.trim(),
        qty: Number(templateForm.qty || 0),
        unit_price: Number(templateForm.unit_price || 0),
        description: templateForm.description.trim(),
      },
    ])
  }

  function removeQuoteLine(index) {
    setQuoteLines((prev) => prev.filter((_, i) => i !== index))
  }

  function seedQuotes() {
    setQuotes([
      {
        quote_number: 'SAL-2026-041',
        client_name: 'Technopolis',
        status: 'Lähetetty',
        amount_vat0: 3200,
        notes: 'Sisältää 3D-kuvauksen ja turvallisuustagit.',
      },
      {
        quote_number: 'SAL-2026-042',
        client_name: 'Sponda',
        status: 'Luonnos',
        amount_vat0: 1850,
        notes: 'Perehdytyskuvaus + virtuaalinen kierros.',
      },
    ])
  }

  function selectQuote(index) {
    const q = quotes[index]
    if (!q) return
    setSelectedQuoteIndex(index)
    setQuoteEditForm({
      quote_number: q.quote_number || '',
      client_name: q.client_name || '',
      status: q.status || 'Luonnos',
      amount_vat0: q.amount_vat0 || '',
      notes: q.notes || '',
    })
  }

  function saveQuoteChanges() {
    if (selectedQuoteIndex < 0) {
      alert('Valitse ensin tarjous listasta.')
      return
    }

    setQuotes((prev) =>
      prev.map((q, i) =>
        i === selectedQuoteIndex
          ? {
              ...q,
              quote_number: quoteEditForm.quote_number.trim(),
              client_name: quoteEditForm.client_name.trim(),
              status: quoteEditForm.status,
              amount_vat0: Number(quoteEditForm.amount_vat0 || 0),
              notes: quoteEditForm.notes.trim(),
            }
          : q
      )
    )

    alert('Muutokset tallennettu käyttöliittymätasolla.')
  }

  function deleteSelectedQuote() {
    if (selectedQuoteIndex < 0) {
      alert('Valitse ensin tarjous.')
      return
    }

    const ok = confirm('Haluatko varmasti poistaa tarjouksen?')
    if (!ok) return

    setQuotes((prev) => prev.filter((_, i) => i !== selectedQuoteIndex))
    setSelectedQuoteIndex(-1)
    setQuoteEditForm({
      quote_number: '',
      client_name: '',
      status: 'Luonnos',
      amount_vat0: '',
      notes: '',
    })
  }

  function loadNetvisorSample() {
    if (netvisorSource === 'pl') {
      setNetvisorRaw(
        [
          'Liikevaihto;12500',
          'Liiketoiminnan muut tuotot;0',
          'Materiaalit ja palvelut;-850',
          'Liiketoiminnan muut kulut;-2400',
          'Poistot;-300',
          'Liikevoitto;8950',
        ].join('\n')
      )
    } else {
      setNetvisorRaw(
        [
          'Rahat ja pankkisaamiset;3200',
          'Myyntisaamiset;1800',
          'Oma pääoma;1500',
          'Ostovelat;-900',
          'Tilikauden tulos;2600',
        ].join('\n')
      )
    }
  }

  function analyzeNetvisor() {
    const raw = netvisorRaw.trim()
    if (!raw) {
      alert('Liitä tai lataa ensin analysoitava aineisto.')
      return
    }

    const lines = raw.split('\n').map((row) => row.trim()).filter(Boolean)
    let revenue = 0
    let expenses = 0
    let assets = 0
    let liabilities = 0

    const mapped = lines.map((line, i) => {
      const parts = line.split(';')
      const label = (parts[0] || '').trim()
      const value = Number((parts[1] || '0').replace(',', '.'))
      const lower = label.toLowerCase()

      if (lower.includes('liikevaihto')) revenue += value
      if (
        lower.includes('kulut') ||
        lower.includes('poistot') ||
        lower.includes('materiaalit')
      ) {
        expenses += value
      }
      if (lower.includes('rahat') || lower.includes('saamiset')) assets += value
      if (lower.includes('velat')) liabilities += value

      return `${i + 1}. ${label} → ${value.toLocaleString('fi-FI', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    })

    const result = [
      'ANALYYSIPOLKU',
      '------------------------------',
      `1) Raw-rivejä luettu: ${lines.length}`,
      '2) Parsinta valmis',
      '3) Tunnistetut rivit:',
      mapped.join('\n'),
      '------------------------------',
      'YHTEENVETO',
      `Liikevaihto: ${revenue.toLocaleString('fi-FI', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} €`,
      `Kulut: ${expenses.toLocaleString('fi-FI', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} €`,
      `Varat: ${assets.toLocaleString('fi-FI', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} €`,
      `Velat: ${liabilities.toLocaleString('fi-FI', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} €`,
      '------------------------------',
      'Seuraava production-vaihe: mapataan rivit accounting_monthly / finance_monthly -tauluihin vasta käyttäjän tarkastuksen jälkeen.',
    ].join('\n')

    setNetvisorLog(result)
  }

  function addDocument() {
    if (!docForm.file_name.trim()) {
      alert('Anna tiedoston nimi.')
      return
    }

    setDocs((prev) => [
      ...prev,
      {
        document_type: docForm.document_type,
        year: Number(docForm.year || 0),
        month: Number(docForm.month || 0),
        source: docForm.source.trim(),
        file_name: docForm.file_name.trim(),
        url: docForm.url.trim(),
        notes: docForm.notes.trim(),
      },
    ])

    setDocForm((prev) => ({
      ...prev,
      source: '',
      file_name: '',
      url: '',
      notes: '',
    }))
  }

  function seedDocuments() {
    setDocs([
      {
        document_type: 'tuloslaskelma',
        year: 2026,
        month: 3,
        source: 'Netvisor',
        file_name: 'tuloslaskelma_2026_03.pdf',
        url: 'https://example.com/tuloslaskelma_2026_03.pdf',
        notes: 'Kuukauden lopullinen raportti.',
      },
      {
        document_type: 'tase',
        year: 2026,
        month: 3,
        source: 'Netvisor',
        file_name: 'tase_2026_03.pdf',
        url: 'https://example.com/tase_2026_03.pdf',
        notes: 'Käytetty talouskatselmuksessa.',
      },
    ])
  }

  function removeDocument(index) {
    setDocs((prev) => prev.filter((_, i) => i !== index))
  }

  const sortedDocs = useMemo(() => {
    return [...docs].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year
      return b.month - a.month
    })
  }, [docs])

  return (
    <main className="page-shell">
      <style jsx>{`
        .page-shell {
          min-height: 100vh;
          padding: 28px;
          background: linear-gradient(180deg, #07070b 0%, #11111a 100%);
          color: #f4f1e9;
          font-family: Poppins, system-ui, sans-serif;
        }
        .page-wrap {
          max-width: 1400px;
          margin: 0 auto;
        }
        .hero {
          margin-bottom: 22px;
          padding: 24px;
          border-radius: 24px;
          border: 1px solid rgba(234, 222, 181, 0.14);
          background: linear-gradient(
            135deg,
            rgba(27, 22, 40, 0.95),
            rgba(16, 18, 28, 0.95)
          );
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.28);
        }
        .hero h1 {
          margin: 0 0 10px;
          font-size: 34px;
          line-height: 1.1;
        }
        .hero p {
          margin: 0;
          color: rgba(244, 241, 233, 0.72);
          max-width: 1000px;
        }
        .module {
          margin: 0 0 24px;
          padding: 24px;
          border-radius: 22px;
          border: 1px solid rgba(234, 222, 181, 0.14);
          background: rgba(21, 24, 34, 0.92);
          box-shadow: 0 14px 36px rgba(0, 0, 0, 0.18);
        }
        .module h2 {
          margin: 0 0 8px;
          font-size: 28px;
        }
        .section-subtitle {
          margin: 0 0 18px;
          color: rgba(244, 241, 233, 0.68);
        }
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }
        .grid-activities {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 18px;
        }
        .card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(234, 222, 181, 0.14);
          border-radius: 18px;
          padding: 18px;
        }
        .card h3 {
          margin-top: 0;
        }
        .row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 12px;
        }
        label {
          display: block;
          margin-bottom: 6px;
          font-size: 13px;
          color: rgba(244, 241, 233, 0.68);
        }
        input,
        select,
        textarea,
        button {
          width: 100%;
          padding: 11px 12px;
          border-radius: 12px;
          border: 1px solid rgba(234, 222, 181, 0.14);
          background: #0f1219;
          color: #f4f1e9;
          font: inherit;
        }
        textarea {
          min-height: 100px;
          resize: vertical;
        }
        .actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 10px;
        }
        button {
          width: auto;
          cursor: pointer;
          background: linear-gradient(135deg, #2b3246, #1a2030);
        }
        .primary {
          background: linear-gradient(135deg, #e7dfb2, #b9aa6f);
          color: #171717;
          font-weight: 700;
        }
        .danger {
          background: linear-gradient(135deg, #6d2323, #481515);
          color: #fff;
          border-color: rgba(255, 135, 135, 0.35);
        }
        .list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .item {
          border: 1px solid rgba(234, 222, 181, 0.14);
          border-radius: 14px;
          padding: 14px;
          background: rgba(255, 255, 255, 0.02);
        }
        .topline {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          margin-bottom: 8px;
        }
        .badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          border: 1px solid rgba(234, 222, 181, 0.14);
        }
        .badge.open {
          color: #f0c36a;
        }
        .badge.done {
          color: #75d39b;
        }
        .badge.overdue {
          color: #ff7b7b;
        }
        .meta {
          font-size: 13px;
          color: rgba(244, 241, 233, 0.68);
          margin-bottom: 6px;
        }
        .muted {
          color: rgba(244, 241, 233, 0.68);
        }
        .steps {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 18px;
        }
        .step {
          border: 1px solid rgba(234, 222, 181, 0.14);
          border-radius: 16px;
          padding: 14px;
          background: rgba(255, 255, 255, 0.02);
          text-align: center;
          font-size: 14px;
        }
        .log {
          border: 1px solid rgba(234, 222, 181, 0.14);
          border-radius: 14px;
          padding: 14px;
          background: rgba(255, 255, 255, 0.02);
          white-space: pre-wrap;
          line-height: 1.5;
          min-height: 220px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
        }
        th,
        td {
          text-align: left;
          padding: 10px 8px;
          border-bottom: 1px solid rgba(234, 222, 181, 0.14);
          vertical-align: top;
        }
        a {
          color: #e7dfb2;
          text-decoration: none;
        }
        .totals {
          margin-top: 14px;
          color: rgba(244, 241, 233, 0.72);
          font-weight: 600;
        }
        @media (max-width: 1100px) {
          .grid-activities,
          .grid-2,
          .steps,
          .row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="page-wrap">
        <div className="hero">
          <h1>CRM / tarjoukset / talous – V6.2 jatkorunko</h1>
          <p>
            Tämä on yksi yhtenäinen app/page.js-runko Next.js App Routeriin.
            Mukana ovat aktiviteetit, tarjousrivit pricing_templates-logiikalla,
            tarjouksen muokkaus, Netvisor-tuonnin analyysipolku ja kirjanpidon
            dokumenttilinkitys. Rakenne on pidetty tiiviinä, mutta kaikki
            liiketoiminnallisesti tärkeät osat on jätetty mukaan.
          </p>
        </div>

        <Section
          title="Aktiviteetit ja muistutukset"
          subtitle="Seuranta pysyy lämpimänä, kun avoimet kontaktit, follow-upit ja sovitut tehtävät näkyvät samassa näkymässä."
        >
          <div className="grid-activities">
            <div className="card">
              <h3>Lisää aktiviteetti</h3>

              <div className="row">
                <div>
                  <label>Otsikko</label>
                  <input
                    name="title"
                    value={activityForm.title}
                    onChange={handleActivityChange}
                    placeholder="Esim. Soita asiakkaalle tarjouksesta"
                  />
                </div>
                <div>
                  <label>Tyyppi</label>
                  <select
                    name="type"
                    value={activityForm.type}
                    onChange={handleActivityChange}
                  >
                    <option value="call">Puhelu</option>
                    <option value="email">Sähköposti</option>
                    <option value="meeting">Tapaaminen</option>
                    <option value="followup">Follow-up</option>
                    <option value="task">Tehtävä</option>
                  </select>
                </div>
              </div>

              <div className="row">
                <div>
                  <label>Asiakas</label>
                  <input
                    name="client"
                    value={activityForm.client}
                    onChange={handleActivityChange}
                    placeholder="Esim. Technopolis"
                  />
                </div>
                <div>
                  <label>Eräpäivä</label>
                  <input
                    name="due_date"
                    type="date"
                    value={activityForm.due_date}
                    onChange={handleActivityChange}
                  />
                </div>
              </div>

              <div className="row">
                <div>
                  <label>Status</label>
                  <select
                    name="status"
                    value={activityForm.status}
                    onChange={handleActivityChange}
                  >
                    <option value="open">Avoin</option>
                    <option value="done">Valmis</option>
                    <option value="cancelled">Peruttu</option>
                  </select>
                </div>
                <div>
                  <label>Tarjousnumero</label>
                  <input
                    name="quote_id"
                    value={activityForm.quote_id}
                    onChange={handleActivityChange}
                    placeholder="Esim. SAL-2026-041"
                  />
                </div>
              </div>

              <div>
                <label>Muistiinpanot</label>
                <textarea
                  name="notes"
                  value={activityForm.notes}
                  onChange={handleActivityChange}
                  placeholder="Kirjaa mitä pitää tehdä tai mitä on sovittu."
                />
              </div>

              <div className="actions">
                <button className="primary" type="button" onClick={addActivity}>
                  Lisää aktiviteetti
                </button>
                <button type="button" onClick={seedActivities}>
                  Lisää esimerkkidata
                </button>
              </div>
            </div>

            <div className="card">
              <h3>Avoimet ja myöhässä</h3>
              <div className="list">
                {!sortedActivities.length ? (
                  <div className="item">
                    <div className="meta">Ei vielä aktiviteetteja.</div>
                  </div>
                ) : (
                  sortedActivities.map((item, index) => {
                    const overdue = isOverdue(item.due_date, item.status)
                    const badgeClass = overdue
                      ? 'overdue'
                      : item.status === 'done'
                      ? 'done'
                      : 'open'
                    const badgeText = overdue
                      ? 'Myöhässä'
                      : item.status === 'done'
                      ? 'Valmis'
                      : 'Avoin'

                    return (
                      <div className="item" key={`${item.title}-${index}`}>
                        <div className="topline">
                          <strong>{item.title}</strong>
                          <span className={`badge ${badgeClass}`}>
                            {badgeText}
                          </span>
                        </div>
                        <div className="meta">
                          {item.client || 'Ei asiakasta'} · {item.type} ·{' '}
                          {item.due_date || 'Ei päivää'}{' '}
                          {item.quote_id ? `· ${item.quote_id}` : ''}
                        </div>
                        <div>{item.notes || ''}</div>
                        <div className="actions">
                          <button
                            type="button"
                            onClick={() => markActivityDone(index)}
                          >
                            Merkitse valmiiksi
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteActivity(index)}
                          >
                            Poista
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </Section>

        <Section
          title="Tarjousrivit valmiista hinnoittelupohjista"
          subtitle="Valitse palvelupohja, tuo se tarjousriville ja tee tarvittaessa viimeinen hienosäätö käsin ennen tallennusta."
        >
          <div className="grid-2">
            <div className="card">
              <h3>Valitse pricing template</h3>

              <div className="row">
                <div>
                  <label>Pohja</label>
                  <select
                    value={templateForm.selectedIndex}
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                  >
                    <option value="">Valitse pohja</option>
                    {templates.map((tpl, idx) => (
                      <option key={tpl.name + idx} value={String(idx)}>
                        {tpl.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>ALV %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={templateForm.vat}
                    onChange={(e) =>
                      setTemplateForm((prev) => ({
                        ...prev,
                        vat: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="row">
                <div>
                  <label>Rivin nimi</label>
                  <input
                    value={templateForm.name}
                    onChange={(e) =>
                      setTemplateForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label>Yksikkö</label>
                  <input
                    value={templateForm.unit}
                    onChange={(e) =>
                      setTemplateForm((prev) => ({
                        ...prev,
                        unit: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="row">
                <div>
                  <label>Määrä</label>
                  <input
                    type="number"
                    step="0.01"
                    value={templateForm.qty}
                    onChange={(e) =>
                      setTemplateForm((prev) => ({
                        ...prev,
                        qty: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label>Yksikköhinta ALV 0 %</label>
                  <input
                    type="number"
                    step="0.01"
                    value={templateForm.unit_price}
                    onChange={(e) =>
                      setTemplateForm((prev) => ({
                        ...prev,
                        unit_price: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <label>Kuvaus</label>
                <textarea
                  value={templateForm.description}
                  onChange={(e) =>
                    setTemplateForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="actions">
                <button
                  className="primary"
                  type="button"
                  onClick={addQuoteLineFromTemplate}
                >
                  Lisää tarjousriviksi
                </button>
                <button type="button" onClick={loadDefaultTemplates}>
                  Lataa esimerkkipohjat
                </button>
              </div>
            </div>

            <div className="card">
              <h3>Lisätyt tarjousrivit</h3>
              <table>
                <thead>
                  <tr>
                    <th>Nimi</th>
                    <th>Määrä</th>
                    <th>Yks.hinta</th>
                    <th>Yhteensä</th>
                  </tr>
                </thead>
                <tbody>
                  {!quoteLines.length ? (
                    <tr>
                      <td colSpan="4">Ei vielä rivejä.</td>
                    </tr>
                  ) : (
                    quoteLines.map((line, idx) => {
                      const total =
                        Number(line.qty || 0) * Number(line.unit_price || 0)
                      return (
                        <tr key={line.name + idx}>
                          <td>
                            <strong>{line.name}</strong>
                            <br />
                            <span className="muted">
                              {line.description || ''}
                            </span>
                            <br />
                            <button
                              type="button"
                              style={{ marginTop: 8 }}
                              onClick={() => removeQuoteLine(idx)}
                            >
                              Poista
                            </button>
                          </td>
                          <td>
                            {line.qty} {line.unit || ''}
                          </td>
                          <td>{euro(line.unit_price)}</td>
                          <td>{euro(total)}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>

              <div className="totals">
                Yhteensä ALV 0 %: {euro(sumVat0)} · ALV:n kanssa:{' '}
                {euro(sumVat)}
              </div>
            </div>
          </div>
        </Section>

        <Section
          title="Tarjouksen muokkaus ja poisto"
          subtitle="Tarjouskannan hallinta tarvitsee editoinnin ja poistamisen, jotta pipeline ei täyty vanhentuneesta datasta."
        >
          <div className="grid-2">
            <div className="card">
              <h3>Tarjouslista</h3>
              <div className="list">
                {!quotes.length ? (
                  <div className="item">Ei tarjouksia ladattuna.</div>
                ) : (
                  quotes.map((q, idx) => (
                    <div className="item" key={q.quote_number + idx}>
                      <strong>{q.quote_number}</strong>
                      <br />
                      <span className="muted">
                        {q.client_name} · {q.status} · {euro(q.amount_vat0)}
                      </span>
                      <div className="actions">
                        <button type="button" onClick={() => selectQuote(idx)}>
                          Muokkaa
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="actions">
                <button type="button" onClick={seedQuotes}>
                  Lataa esimerkkitarjoukset
                </button>
              </div>
            </div>

            <div className="card">
              <h3>Muokkaa valittua tarjousta</h3>

              <div className="row">
                <div>
                  <label>Tarjousnumero</label>
                  <input
                    value={quoteEditForm.quote_number}
                    onChange={(e) =>
                      setQuoteEditForm((prev) => ({
                        ...prev,
                        quote_number: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label>Asiakas</label>
                  <input
                    value={quoteEditForm.client_name}
                    onChange={(e) =>
                      setQuoteEditForm((prev) => ({
                        ...prev,
                        client_name: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="row">
                <div>
                  <label>Status</label>
                  <select
                    value={quoteEditForm.status}
                    onChange={(e) =>
                      setQuoteEditForm((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                  >
                    <option value="Luonnos">Luonnos</option>
                    <option value="Lähetetty">Lähetetty</option>
                    <option value="Hyväksytty">Hyväksytty</option>
                    <option value="Hylätty">Hylätty</option>
                    <option value="Vanhentunut">Vanhentunut</option>
                  </select>
                </div>
                <div>
                  <label>Summa ALV 0 %</label>
                  <input
                    type="number"
                    step="0.01"
                    value={quoteEditForm.amount_vat0}
                    onChange={(e) =>
                      setQuoteEditForm((prev) => ({
                        ...prev,
                        amount_vat0: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <label>Muistiinpanot</label>
                <textarea
                  value={quoteEditForm.notes}
                  onChange={(e) =>
                    setQuoteEditForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="actions">
                <button
                  className="primary"
                  type="button"
                  onClick={saveQuoteChanges}
                >
                  Tallenna muutokset
                </button>
                <button
                  className="danger"
                  type="button"
                  onClick={deleteSelectedQuote}
                >
                  Poista tarjous
                </button>
              </div>
            </div>
          </div>
        </Section>

        <Section
          title="Netvisor-tuonnin analyysipolku"
          subtitle="Tuonti kannattaa jakaa vaiheisiin: raakadata → parsinta → mapping → tarkastus → tallennus. Näin talousdata ei mene rikki yhdellä liian aikaisella importilla."
        >
          <div className="steps">
            <div className="step">1. Tiedosto sisään</div>
            <div className="step">2. Raw parse</div>
            <div className="step">3. Rivitunnistus</div>
            <div className="step">4. Tarkastus</div>
            <div className="step">5. Tallennus</div>
          </div>

          <div className="grid-2">
            <div className="card">
              <h3>Simuloitu importti</h3>

              <label>Tuo testiaineisto</label>
              <select
                value={netvisorSource}
                onChange={(e) => setNetvisorSource(e.target.value)}
              >
                <option value="pl">Tuloslaskelma</option>
                <option value="bs">Tase</option>
              </select>

              <div className="actions">
                <button type="button" onClick={loadNetvisorSample}>
                  Lataa esimerkkidata
                </button>
                <button
                  className="primary"
                  type="button"
                  onClick={analyzeNetvisor}
                >
                  Analysoi rivit
                </button>
              </div>

              <label style={{ marginTop: 14 }}>Raw data</label>
              <textarea
                style={{ minHeight: 220 }}
                value={netvisorRaw}
                onChange={(e) => setNetvisorRaw(e.target.value)}
                placeholder="Liitä tänne CSV- tai tekstipohjainen raportti..."
              />
            </div>

            <div className="card">
              <h3>Analyysiloki</h3>
              <div className="log">{netvisorLog}</div>
            </div>
          </div>
        </Section>

        <Section
          title="Kirjanpidon aineistojen tiedostolinkitys"
          subtitle="Pidä raportit, taseet, tuloslaskelmat ja muut liitteet samassa näkymässä kausittain, jotta kuukausiohjaus pysyy läpinäkyvänä."
        >
          <div className="grid-2">
            <div className="card">
              <h3>Lisää dokumentti</h3>

              <div className="row">
                <div>
                  <label>Dokumenttityyppi</label>
                  <select
                    value={docForm.document_type}
                    onChange={(e) =>
                      setDocForm((prev) => ({
                        ...prev,
                        document_type: e.target.value,
                      }))
                    }
                  >
                    <option value="tuloslaskelma">Tuloslaskelma</option>
                    <option value="tase">Tase</option>
                    <option value="paakirja">Pääkirja</option>
                    <option value="tositteet">Tositteet</option>
                    <option value="muu">Muu</option>
                  </select>
                </div>
                <div>
                  <label>Vuosi</label>
                  <input
                    type="number"
                    value={docForm.year}
                    onChange={(e) =>
                      setDocForm((prev) => ({
                        ...prev,
                        year: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="row">
                <div>
                  <label>Kuukausi</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={docForm.month}
                    onChange={(e) =>
                      setDocForm((prev) => ({
                        ...prev,
                        month: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label>Lähde</label>
                  <input
                    value={docForm.source}
                    onChange={(e) =>
                      setDocForm((prev) => ({
                        ...prev,
                        source: e.target.value,
                      }))
                    }
                    placeholder="Esim. Netvisor / manuaalinen"
                  />
                </div>
              </div>

              <div className="row">
                <div>
                  <label>Tiedoston nimi</label>
                  <input
                    value={docForm.file_name}
                    onChange={(e) =>
                      setDocForm((prev) => ({
                        ...prev,
                        file_name: e.target.value,
                      }))
                    }
                    placeholder="Esim. tuloslaskelma_2026_04.pdf"
                  />
                </div>
                <div>
                  <label>Tiedostolinkki</label>
                  <input
                    type="url"
                    value={docForm.url}
                    onChange={(e) =>
                      setDocForm((prev) => ({
                        ...prev,
                        url: e.target.value,
                      }))
                    }
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label>Muistiinpanot</label>
                <textarea
                  value={docForm.notes}
                  onChange={(e) =>
                    setDocForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="actions">
                <button className="primary" type="button" onClick={addDocument}>
                  Lisää dokumentti
                </button>
                <button type="button" onClick={seedDocuments}>
                  Lataa esimerkit
                </button>
              </div>
            </div>

            <div className="card">
              <h3>Dokumentit</h3>
              <table>
                <thead>
                  <tr>
                    <th>Kausi</th>
                    <th>Tyyppi</th>
                    <th>Tiedosto</th>
                    <th>Lähde</th>
                  </tr>
                </thead>
                <tbody>
                  {!sortedDocs.length ? (
                    <tr>
                      <td colSpan="4">Ei dokumentteja lisättynä.</td>
                    </tr>
                  ) : (
                    sortedDocs.map((doc, idx) => (
                      <tr key={`${doc.file_name}-${idx}`}>
                        <td>
                          {doc.month}/{doc.year}
                        </td>
                        <td>{doc.document_type}</td>
                        <td>
                          {doc.url ? (
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {doc.file_name}
                            </a>
                          ) : (
                            doc.file_name
                          )}
                          <br />
                          <small>{doc.notes || ''}</small>
                        </td>
                        <td>
                          {doc.source || ''}
                          <br />
                          <button
                            type="button"
                            style={{ marginTop: 8 }}
                            onClick={() => removeDocument(idx)}
                          >
                            Poista
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Section>
      </div>
    </main>
  )
}
