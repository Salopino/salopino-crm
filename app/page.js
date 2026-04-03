<section id="crm-activities-module">
  <style>
    #crm-activities-module{
      --bg:#0b0b10;
      --panel:#151822;
      --panel-2:#1b2030;
      --line:rgba(234,222,181,.14);
      --text:#f4f1e9;
      --muted:rgba(244,241,233,.68);
      --accent:#e7dfb2;
      --danger:#ff7b7b;
      --warn:#f0c36a;
      --ok:#75d39b;
      background:linear-gradient(180deg,#0b0b10 0%,#10131b 100%);
      color:var(--text);
      font-family:Poppins,system-ui,sans-serif;
      border:1px solid var(--line);
      border-radius:22px;
      padding:24px;
      margin:24px 0;
    }
    #crm-activities-module *{box-sizing:border-box}
    #crm-activities-module h2{margin:0 0 8px;font-size:28px}
    #crm-activities-module p{margin:0 0 18px;color:var(--muted)}
    #crm-activities-module .grid{
      display:grid;
      grid-template-columns:1.1fr .9fr;
      gap:18px;
    }
    #crm-activities-module .card{
      background:rgba(21,24,34,.92);
      border:1px solid var(--line);
      border-radius:18px;
      padding:18px;
    }
    #crm-activities-module .row{
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:12px;
      margin-bottom:12px;
    }
    #crm-activities-module label{
      display:block;
      font-size:13px;
      color:var(--muted);
      margin-bottom:6px;
    }
    #crm-activities-module input,
    #crm-activities-module select,
    #crm-activities-module textarea,
    #crm-activities-module button{
      width:100%;
      border-radius:12px;
      border:1px solid var(--line);
      background:#0f1219;
      color:var(--text);
      padding:11px 12px;
      font:inherit;
    }
    #crm-activities-module textarea{min-height:100px;resize:vertical}
    #crm-activities-module .actions{
      display:flex;
      gap:10px;
      flex-wrap:wrap;
      margin-top:8px;
    }
    #crm-activities-module button{
      width:auto;
      cursor:pointer;
      background:linear-gradient(135deg,#2b3246,#1a2030);
    }
    #crm-activities-module button.primary{
      background:linear-gradient(135deg,#e7dfb2,#b9aa6f);
      color:#171717;
      font-weight:700;
    }
    #crm-activities-module .list{
      display:flex;
      flex-direction:column;
      gap:12px;
    }
    #crm-activities-module .item{
      border:1px solid var(--line);
      border-radius:14px;
      padding:14px;
      background:rgba(255,255,255,.02);
    }
    #crm-activities-module .topline{
      display:flex;
      justify-content:space-between;
      gap:12px;
      align-items:center;
      margin-bottom:8px;
    }
    #crm-activities-module .badge{
      display:inline-block;
      padding:4px 10px;
      border-radius:999px;
      font-size:12px;
      font-weight:700;
      border:1px solid var(--line);
    }
    #crm-activities-module .badge.open{color:var(--warn)}
    #crm-activities-module .badge.done{color:var(--ok)}
    #crm-activities-module .badge.overdue{color:var(--danger)}
    #crm-activities-module .meta{
      font-size:13px;
      color:var(--muted);
      margin-bottom:6px;
    }
    @media (max-width: 900px){
      #crm-activities-module .grid{grid-template-columns:1fr}
      #crm-activities-module .row{grid-template-columns:1fr}
    }
  </style>

  <h2>Aktiviteetit ja muistutukset</h2>
  <p>Seuranta pysyy lämpimänä, kun avoimet kontaktit, follow-upit ja sovitut tehtävät näkyvät samassa näkymässä.</p>

  <div class="grid">
    <div class="card">
      <h3>Lisää aktiviteetti</h3>

      <div class="row">
        <div>
          <label for="actTitle">Otsikko</label>
          <input id="actTitle" type="text" placeholder="Esim. Soita asiakkaalle tarjouksesta">
        </div>
        <div>
          <label for="actType">Tyyppi</label>
          <select id="actType">
            <option value="call">Puhelu</option>
            <option value="email">Sähköposti</option>
            <option value="meeting">Tapaaminen</option>
            <option value="followup">Follow-up</option>
            <option value="task">Tehtävä</option>
          </select>
        </div>
      </div>

      <div class="row">
        <div>
          <label for="actClient">Asiakas</label>
          <input id="actClient" type="text" placeholder="Esim. Technopolis">
        </div>
        <div>
          <label for="actDate">Eräpäivä</label>
          <input id="actDate" type="date">
        </div>
      </div>

      <div class="row">
        <div>
          <label for="actStatus">Status</label>
          <select id="actStatus">
            <option value="open">Avoin</option>
            <option value="done">Valmis</option>
            <option value="cancelled">Peruttu</option>
          </select>
        </div>
        <div>
          <label for="actQuote">Tarjousnumero</label>
          <input id="actQuote" type="text" placeholder="Esim. SAL-2026-041">
        </div>
      </div>

      <div>
        <label for="actNotes">Muistiinpanot</label>
        <textarea id="actNotes" placeholder="Kirjaa mitä pitää tehdä tai mitä on sovittu."></textarea>
      </div>

      <div class="actions">
        <button class="primary" id="actAddBtn" type="button">Lisää aktiviteetti</button>
        <button id="actSeedBtn" type="button">Lisää esimerkkidata</button>
      </div>
    </div>

    <div class="card">
      <h3>Avoimet ja myöhässä</h3>
      <div class="list" id="activitiesList"></div>
    </div>
  </div>

  <script>
    (() => {
      const listEl = document.getElementById("activitiesList");
      const addBtn = document.getElementById("actAddBtn");
      const seedBtn = document.getElementById("actSeedBtn");

      const state = {
        items: []
      };

      function isOverdue(dateStr, status) {
        if (!dateStr || status !== "open") return false;
        const today = new Date();
        today.setHours(0,0,0,0);
        const due = new Date(dateStr + "T00:00:00");
        return due < today;
      }

      function renderActivities() {
        listEl.innerHTML = "";
        if (!state.items.length) {
          listEl.innerHTML = '<div class="item"><div class="meta">Ei vielä aktiviteetteja.</div></div>';
          return;
        }

        state.items
          .slice()
          .sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""))
          .forEach((item, index) => {
            const overdue = isOverdue(item.due_date, item.status);
            const badgeClass = overdue ? "overdue" : item.status === "done" ? "done" : "open";
            const badgeText = overdue ? "Myöhässä" : item.status === "done" ? "Valmis" : "Avoin";

            const wrapper = document.createElement("div");
            wrapper.className = "item";
            wrapper.innerHTML = `
              <div class="topline">
                <strong>${item.title}</strong>
                <span class="badge ${badgeClass}">${badgeText}</span>
              </div>
              <div class="meta">
                ${item.client || "Ei asiakasta"} · ${item.type} · ${item.due_date || "Ei päivää"} ${item.quote_id ? "· " + item.quote_id : ""}
              </div>
              <div>${item.notes || ""}</div>
              <div class="actions" style="margin-top:10px;">
                <button type="button" data-done="${index}">Merkitse valmiiksi</button>
                <button type="button" data-delete="${index}">Poista</button>
              </div>
            `;
            listEl.appendChild(wrapper);
          });

        listEl.querySelectorAll("[data-done]").forEach(btn => {
          btn.addEventListener("click", e => {
            const idx = Number(e.currentTarget.getAttribute("data-done"));
            state.items[idx].status = "done";
            renderActivities();
          });
        });

        listEl.querySelectorAll("[data-delete]").forEach(btn => {
          btn.addEventListener("click", e => {
            const idx = Number(e.currentTarget.getAttribute("data-delete"));
            state.items.splice(idx, 1);
            renderActivities();
          });
        });
      }

      addBtn.addEventListener("click", () => {
        const title = document.getElementById("actTitle").value.trim();
        const type = document.getElementById("actType").value;
        const client = document.getElementById("actClient").value.trim();
        const due_date = document.getElementById("actDate").value;
        const status = document.getElementById("actStatus").value;
        const quote_id = document.getElementById("actQuote").value.trim();
        const notes = document.getElementById("actNotes").value.trim();

        if (!title) {
          alert("Anna aktiviteetille otsikko.");
          return;
        }

        state.items.push({ title, type, client, due_date, status, quote_id, notes });

        document.getElementById("actTitle").value = "";
        document.getElementById("actClient").value = "";
        document.getElementById("actDate").value = "";
        document.getElementById("actQuote").value = "";
        document.getElementById("actNotes").value = "";
        document.getElementById("actStatus").value = "open";
        document.getElementById("actType").value = "call";

        renderActivities();
      });

      seedBtn.addEventListener("click", () => {
        state.items = [
          {
            title: "Soita asiakkaalle tarjouksesta",
            type: "call",
            client: "Sponda",
            due_date: "2026-04-04",
            status: "open",
            quote_id: "SAL-2026-041",
            notes: "Tarkista päätöksentekijän aikataulu ja seuraava askel."
          },
          {
            title: "Lähetä follow-up sähköpostilla",
            type: "followup",
            client: "Technopolis",
            due_date: "2026-04-02",
            status: "open",
            quote_id: "SAL-2026-039",
            notes: "Nosta esiin turvallisuus- ja perehdytyshyödyt."
          }
        ];
        renderActivities();
      });

      renderActivities();
    })();
  </script>
</section>
<section id="pricing-template-module">
  <style>
    #pricing-template-module{
      --bg:#0b0b10;
      --panel:#151822;
      --line:rgba(234,222,181,.14);
      --text:#f4f1e9;
      --muted:rgba(244,241,233,.68);
      --accent:#e7dfb2;
      background:linear-gradient(180deg,#0b0b10 0%,#111420 100%);
      color:var(--text);
      font-family:Poppins,system-ui,sans-serif;
      border:1px solid var(--line);
      border-radius:22px;
      padding:24px;
      margin:24px 0;
    }
    #pricing-template-module *{box-sizing:border-box}
    #pricing-template-module h2{margin:0 0 8px;font-size:28px}
    #pricing-template-module p{margin:0 0 18px;color:var(--muted)}
    #pricing-template-module .grid{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:18px;
    }
    #pricing-template-module .card{
      background:rgba(21,24,34,.92);
      border:1px solid var(--line);
      border-radius:18px;
      padding:18px;
    }
    #pricing-template-module .row{
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:12px;
      margin-bottom:12px;
    }
    #pricing-template-module label{
      display:block;
      margin-bottom:6px;
      font-size:13px;
      color:var(--muted);
    }
    #pricing-template-module input,
    #pricing-template-module select,
    #pricing-template-module textarea,
    #pricing-template-module button{
      width:100%;
      padding:11px 12px;
      border-radius:12px;
      border:1px solid var(--line);
      background:#0f1219;
      color:var(--text);
      font:inherit;
    }
    #pricing-template-module textarea{min-height:90px;resize:vertical}
    #pricing-template-module .actions{
      display:flex;
      gap:10px;
      flex-wrap:wrap;
      margin-top:10px;
    }
    #pricing-template-module button{
      width:auto;
      cursor:pointer;
      background:linear-gradient(135deg,#2b3246,#1a2030);
    }
    #pricing-template-module button.primary{
      background:linear-gradient(135deg,#e7dfb2,#b9aa6f);
      color:#171717;
      font-weight:700;
    }
    #pricing-template-module table{
      width:100%;
      border-collapse:collapse;
      margin-top:8px;
    }
    #pricing-template-module th,
    #pricing-template-module td{
      text-align:left;
      padding:10px 8px;
      border-bottom:1px solid var(--line);
      vertical-align:top;
    }
    #pricing-template-module .muted{color:var(--muted)}
    @media (max-width:900px){
      #pricing-template-module .grid,
      #pricing-template-module .row{grid-template-columns:1fr}
    }
  </style>

  <h2>Tarjousrivit valmiista hinnoittelupohjista</h2>
  <p>Valitse palvelupohja, tuo se tarjousriville ja tee tarvittaessa viimeinen hienosäätö käsin ennen tallennusta.</p>

  <div class="grid">
    <div class="card">
      <h3>Valitse pricing template</h3>

      <div class="row">
        <div>
          <label for="templateSelect">Pohja</label>
          <select id="templateSelect"></select>
        </div>
        <div>
          <label for="tplVat">ALV %</label>
          <input id="tplVat" type="number" step="0.1" value="25.5">
        </div>
      </div>

      <div class="row">
        <div>
          <label for="tplName">Rivin nimi</label>
          <input id="tplName" type="text">
        </div>
        <div>
          <label for="tplUnit">Yksikkö</label>
          <input id="tplUnit" type="text">
        </div>
      </div>

      <div class="row">
        <div>
          <label for="tplQty">Määrä</label>
          <input id="tplQty" type="number" step="0.01" value="1">
        </div>
        <div>
          <label for="tplPrice">Yksikköhinta ALV 0 %</label>
          <input id="tplPrice" type="number" step="0.01">
        </div>
      </div>

      <div>
        <label for="tplDesc">Kuvaus</label>
        <textarea id="tplDesc"></textarea>
      </div>

      <div class="actions">
        <button class="primary" id="tplAddLineBtn" type="button">Lisää tarjousriviksi</button>
        <button id="tplLoadDefaultsBtn" type="button">Lataa esimerkkipohjat</button>
      </div>
    </div>

    <div class="card">
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
        <tbody id="tplQuoteLinesBody"></tbody>
      </table>
      <p class="muted" id="tplTotals">Yhteensä ALV 0 %: 0,00 € · ALV:n kanssa: 0,00 €</p>
    </div>
  </div>

  <script>
    (() => {
      const templateSelect = document.getElementById("templateSelect");
      const tbody = document.getElementById("tplQuoteLinesBody");
      const totalsEl = document.getElementById("tplTotals");

      const state = {
        templates: [],
        quoteLines: []
      };

      function euro(n) {
        return Number(n || 0).toLocaleString("fi-FI", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
      }

      function fillTemplateForm(template) {
        if (!template) return;
        document.getElementById("tplName").value = template.name || "";
        document.getElementById("tplUnit").value = template.unit || "";
        document.getElementById("tplQty").value = template.default_qty || 1;
        document.getElementById("tplPrice").value = template.unit_price || 0;
        document.getElementById("tplDesc").value = template.description || "";
      }

      function renderTemplates() {
        templateSelect.innerHTML = "";
        state.templates.forEach((tpl, idx) => {
          const option = document.createElement("option");
          option.value = String(idx);
          option.textContent = tpl.name;
          templateSelect.appendChild(option);
        });
        if (state.templates.length) fillTemplateForm(state.templates[0]);
      }

      function renderQuoteLines() {
        tbody.innerHTML = "";
        let sumVat0 = 0;
        const vatRate = Number(document.getElementById("tplVat").value || 0);

        state.quoteLines.forEach((line, idx) => {
          const total = Number(line.qty) * Number(line.unit_price);
          sumVat0 += total;

          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>
              <strong>${line.name}</strong><br>
              <span class="muted">${line.description || ""}</span><br>
              <button type="button" data-remove="${idx}" style="margin-top:8px;">Poista</button>
            </td>
            <td>${line.qty} ${line.unit || ""}</td>
            <td>${euro(line.unit_price)}</td>
            <td>${euro(total)}</td>
          `;
          tbody.appendChild(tr);
        });

        const sumVat = sumVat0 * (1 + vatRate / 100);
        totalsEl.textContent = `Yhteensä ALV 0 %: ${euro(sumVat0)} · ALV:n kanssa: ${euro(sumVat)}`;

        tbody.querySelectorAll("[data-remove]").forEach(btn => {
          btn.addEventListener("click", e => {
            const idx = Number(e.currentTarget.getAttribute("data-remove"));
            state.quoteLines.splice(idx, 1);
            renderQuoteLines();
          });
        });
      }

      templateSelect.addEventListener("change", () => {
        const idx = Number(templateSelect.value);
        fillTemplateForm(state.templates[idx]);
      });

      document.getElementById("tplAddLineBtn").addEventListener("click", () => {
        const name = document.getElementById("tplName").value.trim();
        const unit = document.getElementById("tplUnit").value.trim();
        const qty = Number(document.getElementById("tplQty").value || 0);
        const unit_price = Number(document.getElementById("tplPrice").value || 0);
        const description = document.getElementById("tplDesc").value.trim();

        if (!name) {
          alert("Rivin nimi puuttuu.");
          return;
        }

        state.quoteLines.push({ name, unit, qty, unit_price, description });
        renderQuoteLines();
      });

      document.getElementById("tplLoadDefaultsBtn").addEventListener("click", () => {
        state.templates = [
          {
            name: "Kiinteistön 3D-kuvaus",
            unit: "m²",
            default_qty: 500,
            unit_price: 0.8,
            description: "Markkinointikäyttöön soveltuva 3D-kuvaus."
          },
          {
            name: "Turvallisuuskuvaus",
            unit: "kohde",
            default_qty: 1,
            unit_price: 700,
            description: "Tagit, poistumistiet, alkusammutuskalusto ja riskipisteet."
          },
          {
            name: "Perehdytyskuvaus",
            unit: "kohde",
            default_qty: 1,
            unit_price: 1000,
            description: "Virtuaalinen perehdytys, kulkureitit ja toimintaohjeiden upotus."
          }
        ];
        renderTemplates();
      });

      renderTemplates();
      renderQuoteLines();
    })();
  </script>
</section>
<section id="quotes-edit-module">
  <style>
    #quotes-edit-module{
      --bg:#0b0b10;
      --panel:#151822;
      --line:rgba(234,222,181,.14);
      --text:#f4f1e9;
      --muted:rgba(244,241,233,.68);
      --accent:#e7dfb2;
      --danger:#ff8787;
      background:linear-gradient(180deg,#0b0b10 0%,#121523 100%);
      color:var(--text);
      font-family:Poppins,system-ui,sans-serif;
      border:1px solid var(--line);
      border-radius:22px;
      padding:24px;
      margin:24px 0;
    }
    #quotes-edit-module *{box-sizing:border-box}
    #quotes-edit-module h2{margin:0 0 8px;font-size:28px}
    #quotes-edit-module p{margin:0 0 18px;color:var(--muted)}
    #quotes-edit-module .grid{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:18px;
    }
    #quotes-edit-module .card{
      background:rgba(21,24,34,.92);
      border:1px solid var(--line);
      border-radius:18px;
      padding:18px;
    }
    #quotes-edit-module label{
      display:block;
      font-size:13px;
      color:var(--muted);
      margin-bottom:6px;
    }
    #quotes-edit-module input,
    #quotes-edit-module select,
    #quotes-edit-module textarea,
    #quotes-edit-module button{
      width:100%;
      padding:11px 12px;
      border-radius:12px;
      border:1px solid var(--line);
      background:#0f1219;
      color:var(--text);
      font:inherit;
    }
    #quotes-edit-module .row{
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:12px;
      margin-bottom:12px;
    }
    #quotes-edit-module .list{
      display:flex;
      flex-direction:column;
      gap:12px;
    }
    #quotes-edit-module .item{
      border:1px solid var(--line);
      border-radius:14px;
      padding:14px;
      background:rgba(255,255,255,.02);
    }
    #quotes-edit-module .actions{
      display:flex;
      gap:10px;
      flex-wrap:wrap;
      margin-top:10px;
    }
    #quotes-edit-module button{
      width:auto;
      cursor:pointer;
      background:linear-gradient(135deg,#2b3246,#1a2030);
    }
    #quotes-edit-module button.primary{
      background:linear-gradient(135deg,#e7dfb2,#b9aa6f);
      color:#171717;
      font-weight:700;
    }
    #quotes-edit-module button.danger{
      background:linear-gradient(135deg,#6d2323,#481515);
      color:#fff;
      border-color:rgba(255,135,135,.35);
    }
    @media (max-width:900px){
      #quotes-edit-module .grid,
      #quotes-edit-module .row{grid-template-columns:1fr}
    }
  </style>

  <h2>Tarjouksen muokkaus ja poisto</h2>
  <p>Tarjouskannan hallinta tarvitsee editoinnin ja poistamisen, jotta pipeline ei täyty vanhentuneesta datasta.</p>

  <div class="grid">
    <div class="card">
      <h3>Tarjouslista</h3>
      <div class="list" id="quoteEditList"></div>
      <div class="actions">
        <button id="quoteSeedBtn" type="button">Lataa esimerkkitarjoukset</button>
      </div>
    </div>

    <div class="card">
      <h3>Muokkaa valittua tarjousta</h3>

      <div class="row">
        <div>
          <label for="qeNumber">Tarjousnumero</label>
          <input id="qeNumber" type="text">
        </div>
        <div>
          <label for="qeClient">Asiakas</label>
          <input id="qeClient" type="text">
        </div>
      </div>

      <div class="row">
        <div>
          <label for="qeStatus">Status</label>
          <select id="qeStatus">
            <option value="Luonnos">Luonnos</option>
            <option value="Lähetetty">Lähetetty</option>
            <option value="Hyväksytty">Hyväksytty</option>
            <option value="Hylätty">Hylätty</option>
            <option value="Vanhentunut">Vanhentunut</option>
          </select>
        </div>
        <div>
          <label for="qeAmount">Summa ALV 0 %</label>
          <input id="qeAmount" type="number" step="0.01">
        </div>
      </div>

      <div>
        <label for="qeNotes">Muistiinpanot</label>
        <textarea id="qeNotes" style="min-height:110px;"></textarea>
      </div>

      <div class="actions">
        <button class="primary" id="qeSaveBtn" type="button">Tallenna muutokset</button>
        <button class="danger" id="qeDeleteBtn" type="button">Poista tarjous</button>
      </div>
    </div>
  </div>

  <script>
    (() => {
      const listEl = document.getElementById("quoteEditList");
      const state = {
        selectedIndex: -1,
        quotes: []
      };

      function renderList() {
        listEl.innerHTML = "";
        if (!state.quotes.length) {
          listEl.innerHTML = '<div class="item">Ei tarjouksia ladattuna.</div>';
          return;
        }

        state.quotes.forEach((q, idx) => {
          const div = document.createElement("div");
          div.className = "item";
          div.innerHTML = `
            <strong>${q.quote_number}</strong><br>
            <span style="color:rgba(244,241,233,.68)">${q.client_name} · ${q.status} · ${Number(q.amount_vat0).toLocaleString("fi-FI",{minimumFractionDigits:2,maximumFractionDigits:2})} €</span>
            <div class="actions">
              <button type="button" data-select="${idx}">Muokkaa</button>
            </div>
          `;
          listEl.appendChild(div);
        });

        listEl.querySelectorAll("[data-select]").forEach(btn => {
          btn.addEventListener("click", e => {
            const idx = Number(e.currentTarget.getAttribute("data-select"));
            state.selectedIndex = idx;
            fillForm();
          });
        });
      }

      function fillForm() {
        const q = state.quotes[state.selectedIndex];
        if (!q) return;

        document.getElementById("qeNumber").value = q.quote_number || "";
        document.getElementById("qeClient").value = q.client_name || "";
        document.getElementById("qeStatus").value = q.status || "Luonnos";
        document.getElementById("qeAmount").value = q.amount_vat0 || 0;
        document.getElementById("qeNotes").value = q.notes || "";
      }

      document.getElementById("qeSaveBtn").addEventListener("click", () => {
        const idx = state.selectedIndex;
        if (idx < 0) {
          alert("Valitse ensin tarjous listasta.");
          return;
        }

        state.quotes[idx] = {
          ...state.quotes[idx],
          quote_number: document.getElementById("qeNumber").value.trim(),
          client_name: document.getElementById("qeClient").value.trim(),
          status: document.getElementById("qeStatus").value,
          amount_vat0: Number(document.getElementById("qeAmount").value || 0),
          notes: document.getElementById("qeNotes").value.trim()
        };

        renderList();
        alert("Muutokset tallennettu käyttöliittymätasolla.");
      });

      document.getElementById("qeDeleteBtn").addEventListener("click", () => {
        const idx = state.selectedIndex;
        if (idx < 0) {
          alert("Valitse ensin tarjous.");
          return;
        }

        const ok = confirm("Haluatko varmasti poistaa tarjouksen?");
        if (!ok) return;

        state.quotes.splice(idx, 1);
        state.selectedIndex = -1;

        document.getElementById("qeNumber").value = "";
        document.getElementById("qeClient").value = "";
        document.getElementById("qeStatus").value = "Luonnos";
        document.getElementById("qeAmount").value = "";
        document.getElementById("qeNotes").value = "";

        renderList();
      });

      document.getElementById("quoteSeedBtn").addEventListener("click", () => {
        state.quotes = [
          {
            quote_number: "SAL-2026-041",
            client_name: "Technopolis",
            status: "Lähetetty",
            amount_vat0: 3200,
            notes: "Sisältää 3D-kuvauksen ja turvallisuustagit."
          },
          {
            quote_number: "SAL-2026-042",
            client_name: "Sponda",
            status: "Luonnos",
            amount_vat0: 1850,
            notes: "Perehdytyskuvaus + virtuaalinen kierros."
          }
        ];
        renderList();
      });

      renderList();
    })();
  </script>
</section>
<section id="netvisor-import-module">
  <style>
    #netvisor-import-module{
      --bg:#0b0b10;
      --panel:#151822;
      --line:rgba(234,222,181,.14);
      --text:#f4f1e9;
      --muted:rgba(244,241,233,.68);
      --accent:#e7dfb2;
      --ok:#75d39b;
      --warn:#f0c36a;
      background:linear-gradient(180deg,#0b0b10 0%,#111522 100%);
      color:var(--text);
      font-family:Poppins,system-ui,sans-serif;
      border:1px solid var(--line);
      border-radius:22px;
      padding:24px;
      margin:24px 0;
    }
    #netvisor-import-module *{box-sizing:border-box}
    #netvisor-import-module h2{margin:0 0 8px;font-size:28px}
    #netvisor-import-module p{margin:0 0 18px;color:var(--muted)}
    #netvisor-import-module .steps{
      display:grid;
      grid-template-columns:repeat(5,minmax(0,1fr));
      gap:12px;
      margin-bottom:18px;
    }
    #netvisor-import-module .step{
      border:1px solid var(--line);
      border-radius:16px;
      padding:14px;
      background:rgba(255,255,255,.02);
      text-align:center;
      font-size:14px;
    }
    #netvisor-import-module .grid{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:18px;
    }
    #netvisor-import-module .card{
      background:rgba(21,24,34,.92);
      border:1px solid var(--line);
      border-radius:18px;
      padding:18px;
    }
    #netvisor-import-module label{
      display:block;
      margin-bottom:6px;
      font-size:13px;
      color:var(--muted);
    }
    #netvisor-import-module input,
    #netvisor-import-module textarea,
    #netvisor-import-module button,
    #netvisor-import-module select{
      width:100%;
      padding:11px 12px;
      border-radius:12px;
      border:1px solid var(--line);
      background:#0f1219;
      color:var(--text);
      font:inherit;
    }
    #netvisor-import-module textarea{min-height:220px;resize:vertical}
    #netvisor-import-module .actions{
      display:flex;
      gap:10px;
      flex-wrap:wrap;
      margin-top:10px;
    }
    #netvisor-import-module button{
      width:auto;
      cursor:pointer;
      background:linear-gradient(135deg,#2b3246,#1a2030);
    }
    #netvisor-import-module button.primary{
      background:linear-gradient(135deg,#e7dfb2,#b9aa6f);
      color:#171717;
      font-weight:700;
    }
    #netvisor-import-module .log{
      border:1px solid var(--line);
      border-radius:14px;
      padding:14px;
      background:rgba(255,255,255,.02);
      white-space:pre-wrap;
      line-height:1.5;
    }
    @media (max-width:900px){
      #netvisor-import-module .steps,
      #netvisor-import-module .grid{grid-template-columns:1fr}
    }
  </style>

  <h2>Netvisor-tuonnin analyysipolku</h2>
  <p>Tuonti kannattaa jakaa vaiheisiin: raakadata → parsinta → mapping → tarkastus → tallennus. Näin talousdata ei mene rikki yhdellä liian aikaisella importilla.</p>

  <div class="steps">
    <div class="step">1. Tiedosto sisään</div>
    <div class="step">2. Raw parse</div>
    <div class="step">3. Rivitunnistus</div>
    <div class="step">4. Tarkastus</div>
    <div class="step">5. Tallennus</div>
  </div>

  <div class="grid">
    <div class="card">
      <h3>Simuloitu importti</h3>

      <label for="netvisorSource">Tuo testiaineisto</label>
      <select id="netvisorSource">
        <option value="pl">Tuloslaskelma</option>
        <option value="bs">Tase</option>
      </select>

      <div class="actions">
        <button id="netvisorLoadBtn" type="button">Lataa esimerkkidata</button>
        <button class="primary" id="netvisorAnalyzeBtn" type="button">Analysoi rivit</button>
      </div>

      <label for="netvisorRaw" style="margin-top:14px;">Raw data</label>
      <textarea id="netvisorRaw" placeholder="Liitä tänne CSV- tai tekstipohjainen raportti..."></textarea>
    </div>

    <div class="card">
      <h3>Analyysiloki</h3>
      <div class="log" id="netvisorLog">Ei vielä analyysiä.</div>
    </div>
  </div>

  <script>
    (() => {
      const rawEl = document.getElementById("netvisorRaw");
      const logEl = document.getElementById("netvisorLog");

      document.getElementById("netvisorLoadBtn").addEventListener("click", () => {
        const source = document.getElementById("netvisorSource").value;
        if (source === "pl") {
          rawEl.value = [
            "Liikevaihto;12500",
            "Liiketoiminnan muut tuotot;0",
            "Materiaalit ja palvelut;-850",
            "Liiketoiminnan muut kulut;-2400",
            "Poistot;-300",
            "Liikevoitto;8950"
          ].join("\n");
        } else {
          rawEl.value = [
            "Rahat ja pankkisaamiset;3200",
            "Myyntisaamiset;1800",
            "Oma pääoma;1500",
            "Ostovelat;-900",
            "Tilikauden tulos;2600"
          ].join("\n");
        }
      });

      document.getElementById("netvisorAnalyzeBtn").addEventListener("click", () => {
        const raw = rawEl.value.trim();
        if (!raw) {
          alert("Liitä tai lataa ensin analysoitava aineisto.");
          return;
        }

        const lines = raw.split("\n").map(row => row.trim()).filter(Boolean);
        let revenue = 0;
        let expenses = 0;
        let assets = 0;
        let liabilities = 0;

        const mapped = lines.map((line, i) => {
          const parts = line.split(";");
          const label = (parts[0] || "").trim();
          const value = Number((parts[1] || "0").replace(",", "."));

          const lower = label.toLowerCase();

          if (lower.includes("liikevaihto")) revenue += value;
          if (lower.includes("kulut") || lower.includes("poistot") || lower.includes("materiaalit")) expenses += value;
          if (lower.includes("rahat") || lower.includes("saamiset")) assets += value;
          if (lower.includes("velat")) liabilities += value;

          return `${i + 1}. ${label} → ${value.toLocaleString("fi-FI",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
        });

        const result = [
          "ANALYYSIPOLKU",
          "------------------------------",
          "1) Raw-rivejä luettu: " + lines.length,
          "2) Parsinta valmis",
          "3) Tunnistetut rivit:",
          mapped.join("\n"),
          "------------------------------",
          "YHTEENVETO",
          "Liikevaihto: " + revenue.toLocaleString("fi-FI",{minimumFractionDigits:2,maximumFractionDigits:2}) + " €",
          "Kulut: " + expenses.toLocaleString("fi-FI",{minimumFractionDigits:2,maximumFractionDigits:2}) + " €",
          "Varat: " + assets.toLocaleString("fi-FI",{minimumFractionDigits:2,maximumFractionDigits:2}) + " €",
          "Velat: " + liabilities.toLocaleString("fi-FI",{minimumFractionDigits:2,maximumFractionDigits:2}) + " €",
          "------------------------------",
          "Seuraava production-vaihe: mapataan rivit accounting_monthly / finance_monthly -tauluihin vasta käyttäjän tarkastuksen jälkeen."
        ].join("\n");

        logEl.textContent = result;
      });
    })();
  </script>
</section>
<section id="accounting-documents-module">
  <style>
    #accounting-documents-module{
      --bg:#0b0b10;
      --panel:#151822;
      --line:rgba(234,222,181,.14);
      --text:#f4f1e9;
      --muted:rgba(244,241,233,.68);
      --accent:#e7dfb2;
      background:linear-gradient(180deg,#0b0b10 0%,#11141f 100%);
      color:var(--text);
      font-family:Poppins,system-ui,sans-serif;
      border:1px solid var(--line);
      border-radius:22px;
      padding:24px;
      margin:24px 0;
    }
    #accounting-documents-module *{box-sizing:border-box}
    #accounting-documents-module h2{margin:0 0 8px;font-size:28px}
    #accounting-documents-module p{margin:0 0 18px;color:var(--muted)}
    #accounting-documents-module .grid{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:18px;
    }
    #accounting-documents-module .card{
      background:rgba(21,24,34,.92);
      border:1px solid var(--line);
      border-radius:18px;
      padding:18px;
    }
    #accounting-documents-module .row{
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:12px;
      margin-bottom:12px;
    }
    #accounting-documents-module label{
      display:block;
      margin-bottom:6px;
      font-size:13px;
      color:var(--muted);
    }
    #accounting-documents-module input,
    #accounting-documents-module select,
    #accounting-documents-module textarea,
    #accounting-documents-module button{
      width:100%;
      padding:11px 12px;
      border-radius:12px;
      border:1px solid var(--line);
      background:#0f1219;
      color:var(--text);
      font:inherit;
    }
    #accounting-documents-module .actions{
      display:flex;
      gap:10px;
      flex-wrap:wrap;
      margin-top:10px;
    }
    #accounting-documents-module button{
      width:auto;
      cursor:pointer;
      background:linear-gradient(135deg,#2b3246,#1a2030);
    }
    #accounting-documents-module button.primary{
      background:linear-gradient(135deg,#e7dfb2,#b9aa6f);
      color:#171717;
      font-weight:700;
    }
    #accounting-documents-module table{
      width:100%;
      border-collapse:collapse;
    }
    #accounting-documents-module th,
    #accounting-documents-module td{
      text-align:left;
      padding:10px 8px;
      border-bottom:1px solid var(--line);
      vertical-align:top;
    }
    #accounting-documents-module a{
      color:var(--accent);
      text-decoration:none;
    }
    @media (max-width:900px){
      #accounting-documents-module .grid,
      #accounting-documents-module .row{grid-template-columns:1fr}
    }
  </style>

  <h2>Kirjanpidon aineistojen tiedostolinkitys</h2>
  <p>Pidä raportit, taseet, tuloslaskelmat ja muut liitteet samassa näkymässä kausittain, jotta kuukausiohjaus pysyy läpinäkyvänä.</p>

  <div class="grid">
    <div class="card">
      <h3>Lisää dokumentti</h3>

      <div class="row">
        <div>
          <label for="docType">Dokumenttityyppi</label>
          <select id="docType">
            <option value="tuloslaskelma">Tuloslaskelma</option>
            <option value="tase">Tase</option>
            <option value="paakirja">Pääkirja</option>
            <option value="tositteet">Tositteet</option>
            <option value="muu">Muu</option>
          </select>
        </div>
        <div>
          <label for="docYear">Vuosi</label>
          <input id="docYear" type="number" value="2026">
        </div>
      </div>

      <div class="row">
        <div>
          <label for="docMonth">Kuukausi</label>
          <input id="docMonth" type="number" min="1" max="12" value="4">
        </div>
        <div>
          <label for="docSource">Lähde</label>
          <input id="docSource" type="text" placeholder="Esim. Netvisor / manuaalinen">
        </div>
      </div>

      <div class="row">
        <div>
          <label for="docName">Tiedoston nimi</label>
          <input id="docName" type="text" placeholder="Esim. tuloslaskelma_2026_04.pdf">
        </div>
        <div>
          <label for="docUrl">Tiedostolinkki</label>
          <input id="docUrl" type="url" placeholder="https://...">
        </div>
      </div>

      <div>
        <label for="docNotes">Muistiinpanot</label>
        <textarea id="docNotes" style="min-height:100px;"></textarea>
      </div>

      <div class="actions">
        <button class="primary" id="docAddBtn" type="button">Lisää dokumentti</button>
        <button id="docSeedBtn" type="button">Lataa esimerkit</button>
      </div>
    </div>

    <div class="card">
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
        <tbody id="docTableBody"></tbody>
      </table>
    </div>
  </div>

  <script>
    (() => {
      const tbody = document.getElementById("docTableBody");
      const state = { docs: [] };

      function renderDocs() {
        tbody.innerHTML = "";
        if (!state.docs.length) {
          tbody.innerHTML = `<tr><td colspan="4">Ei dokumentteja lisättynä.</td></tr>`;
          return;
        }

        state.docs
          .slice()
          .sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.month - a.month;
          })
          .forEach((doc, idx) => {
            const tr = document.createElement("tr");
            const fileCell = doc.url
              ? `<a href="${doc.url}" target="_blank" rel="noopener noreferrer">${doc.file_name}</a>`
              : doc.file_name;

            tr.innerHTML = `
              <td>${doc.month}/${doc.year}</td>
              <td>${doc.document_type}</td>
              <td>${fileCell}<br><small>${doc.notes || ""}</small></td>
              <td>${doc.source || ""}<br><button type="button" data-remove="${idx}" style="margin-top:8px;">Poista</button></td>
            `;
            tbody.appendChild(tr);
          });

        tbody.querySelectorAll("[data-remove]").forEach(btn => {
          btn.addEventListener("click", e => {
            const idx = Number(e.currentTarget.getAttribute("data-remove"));
            state.docs.splice(idx, 1);
            renderDocs();
          });
        });
      }

      document.getElementById("docAddBtn").addEventListener("click", () => {
        const document_type = document.getElementById("docType").value;
        const year = Number(document.getElementById("docYear").value || 0);
        const month = Number(document.getElementById("docMonth").value || 0);
        const source = document.getElementById("docSource").value.trim();
        const file_name = document.getElementById("docName").value.trim();
        const url = document.getElementById("docUrl").value.trim();
        const notes = document.getElementById("docNotes").value.trim();

        if (!file_name) {
          alert("Anna tiedoston nimi.");
          return;
        }

        state.docs.push({ document_type, year, month, source, file_name, url, notes });

        document.getElementById("docName").value = "";
        document.getElementById("docUrl").value = "";
        document.getElementById("docNotes").value = "";
        renderDocs();
      });

      document.getElementById("docSeedBtn").addEventListener("click", () => {
        state.docs = [
          {
            document_type: "tuloslaskelma",
            year: 2026,
            month: 3,
            source: "Netvisor",
            file_name: "tuloslaskelma_2026_03.pdf",
            url: "https://example.com/tuloslaskelma_2026_03.pdf",
            notes: "Kuukauden lopullinen raportti."
          },
          {
            document_type: "tase",
            year: 2026,
            month: 3,
            source: "Netvisor",
            file_name: "tase_2026_03.pdf",
            url: "https://example.com/tase_2026_03.pdf",
            notes: "Käytetty talouskatselmuksessa."
          }
        ];
        renderDocs();
      });

      renderDocs();
    })();
  </script>
</section>
