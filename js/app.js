// Logica voor app.html (de hoofdpagina van de app)

let huidigeGebruiker = null;
let mijnNaam = "";

let gerechten = [];
let stemmenVandaag = [];
let laatsteGegetenPerGerecht = {}; // gerecht_id -> datum (YYYY-MM-DD)
let vastgesteldVandaag = null; // { gerecht_id, naam, emoji, vastgesteld_door_naam } of null

const gerechtenLijstEl = document.getElementById("gerechten-lijst");
const winnaarKnop = document.getElementById("winnaar-knop");
const winnaarBanner = document.getElementById("winnaar-banner");
const welkomNaamEl = document.getElementById("welkom-naam");
const appMeldingEl = document.getElementById("app-melding");

function toonAppMelding(tekst, isFout = true) {
  appMeldingEl.textContent = tekst;
  appMeldingEl.hidden = false;
  appMeldingEl.classList.toggle("melding-fout", isFout);
  appMeldingEl.classList.toggle("melding-ok", !isFout);
  setTimeout(() => (appMeldingEl.hidden = true), 4000);
}

async function initAuth() {
  const { data } = await supabaseClient.auth.getSession();
  if (!data.session) {
    window.location.href = "index.html";
    return false;
  }
  huidigeGebruiker = data.session.user;

  const { data: profiel } = await supabaseClient
    .from("profiles")
    .select("naam")
    .eq("id", huidigeGebruiker.id)
    .single();

  mijnNaam = profiel?.naam || huidigeGebruiker.email;
  welkomNaamEl.textContent = `Hoi, ${mijnNaam}!`;
  return true;
}

document.getElementById("uitlog-knop").addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
});

// ---------- Data ophalen ----------

async function laadGerechten() {
  const { data, error } = await supabaseClient
    .from("gerechten")
    .select("id, naam, emoji")
    .order("naam", { ascending: true });
  if (error) {
    console.error(error);
    return;
  }
  gerechten = data || [];
}

async function laadStemmenVandaag() {
  const { data, error } = await supabaseClient
    .from("stemmen")
    .select("id, gerecht_id, user_id, profiles(naam)")
    .eq("datum", vandaag());
  if (error) {
    console.error(error);
    return;
  }
  stemmenVandaag = data || [];
}

async function laadGegetenGeschiedenis() {
  const { data, error } = await supabaseClient
    .from("gegeten")
    .select("gerecht_id, datum")
    .order("datum", { ascending: false });
  if (error) {
    console.error(error);
    return;
  }
  laatsteGegetenPerGerecht = {};
  for (const rij of data || []) {
    if (!laatsteGegetenPerGerecht[rij.gerecht_id]) {
      laatsteGegetenPerGerecht[rij.gerecht_id] = rij.datum;
    }
  }
}

async function laadVastgesteldVandaag() {
  const { data, error } = await supabaseClient
    .from("gegeten")
    .select("gerecht_id, gerechten(naam, emoji), profiles(naam)")
    .eq("datum", vandaag())
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) {
    console.error(error);
    return;
  }
  const rij = (data || [])[0];
  vastgesteldVandaag = rij
    ? {
        gerecht_id: rij.gerecht_id,
        naam: rij.gerechten?.naam,
        emoji: rij.gerechten?.emoji,
        vastgesteld_door_naam: rij.profiles?.naam,
      }
    : null;
}

// ---------- Weergave ----------

function stemmenVoorGerecht(gerechtId) {
  return stemmenVandaag.filter((s) => s.gerecht_id === gerechtId);
}

function mijnStemVandaag() {
  return stemmenVandaag.find((s) => s.user_id === huidigeGebruiker.id);
}

function render() {
  // Winnaar-banner
  if (vastgesteldVandaag) {
    winnaarBanner.hidden = false;
    winnaarBanner.innerHTML = `Vanavond eten we: <strong>${escapeHtml(
      vastgesteldVandaag.emoji || ""
    )} ${escapeHtml(vastgesteldVandaag.naam)}</strong> 🎉<br />
      <small>Vastgesteld door ${escapeHtml(vastgesteldVandaag.vastgesteld_door_naam || "iemand")}</small>`;
  } else {
    winnaarBanner.hidden = true;
  }

  // Gerechtenlijst
  const mijnStem = mijnStemVandaag();
  gerechtenLijstEl.innerHTML = "";

  if (gerechten.length === 0) {
    gerechtenLijstEl.innerHTML = `<p class="hulptekst">Nog geen gerechten. Voeg er hieronder één toe!</p>`;
  }

  for (const gerecht of gerechten) {
    const stemmen = stemmenVoorGerecht(gerecht.id);
    const namen = stemmen.map((s) => s.profiles?.naam || "?");
    const isMijnStem = mijnStem?.gerecht_id === gerecht.id;

    const laatsteDatum = laatsteGegetenPerGerecht[gerecht.id];
    const dagenTekst = laatstGegetenTekst(laatsteDatum);
    const isWaarschuwing = laatsteDatum && dagenGeleden(laatsteDatum) <= 4;

    const div = document.createElement("div");
    div.className = "gerecht-rij" + (isMijnStem ? " gerecht-rij-actief" : "");
    div.innerHTML = `
      <div class="gerecht-info">
        <div class="gerecht-naam">${escapeHtml(gerecht.emoji || "")} ${escapeHtml(gerecht.naam)}</div>
        <div class="gerecht-laatst ${isWaarschuwing ? "waarschuwing" : ""}">
          Laatst gegeten: ${escapeHtml(dagenTekst)}${isWaarschuwing ? " ⚠️" : ""}
        </div>
        <div class="gerecht-stemmen">
          ${stemmen.length} stem${stemmen.length === 1 ? "" : "men"}${
      namen.length ? ": " + escapeHtml(namen.join(", ")) : ""
    }
        </div>
      </div>
      <button class="knop ${isMijnStem ? "knop-actief" : "knop-secundair"} stem-knop" data-id="${gerecht.id}">
        ${isMijnStem ? "✅ Gestemd" : "Stem"}
      </button>
    `;
    gerechtenLijstEl.appendChild(div);
  }

  // Knop "Dit eten we vandaag"
  if (vastgesteldVandaag) {
    winnaarKnop.disabled = true;
    winnaarKnop.textContent = "Al vastgesteld voor vandaag ✅";
  } else if (stemmenVandaag.length === 0) {
    winnaarKnop.disabled = true;
    winnaarKnop.textContent = "Nog geen stemmen vandaag";
  } else {
    const tellingen = {};
    for (const s of stemmenVandaag) {
      tellingen[s.gerecht_id] = (tellingen[s.gerecht_id] || 0) + 1;
    }
    let winnaarId = null;
    let hoogsteAantal = -1;
    for (const gerecht of gerechten) {
      const aantal = tellingen[gerecht.id] || 0;
      if (aantal > hoogsteAantal) {
        hoogsteAantal = aantal;
        winnaarId = gerecht.id;
      }
    }
    const winnaarGerecht = gerechten.find((g) => g.id === winnaarId);
    winnaarKnop.disabled = false;
    winnaarKnop.textContent = winnaarGerecht
      ? `Dit eten we vandaag: ${winnaarGerecht.emoji || ""} ${winnaarGerecht.naam} 🎉`
      : "Dit eten we vandaag 🎉";
    winnaarKnop.dataset.gerechtId = winnaarId;
  }
}

async function alleGegevensVernieuwen() {
  await Promise.all([laadGerechten(), laadStemmenVandaag(), laadGegetenGeschiedenis(), laadVastgesteldVandaag()]);
  render();
}

// ---------- Acties ----------

gerechtenLijstEl.addEventListener("click", async (e) => {
  const knop = e.target.closest(".stem-knop");
  if (!knop) return;
  const gerechtId = knop.dataset.id;

  const { error } = await supabaseClient
    .from("stemmen")
    .upsert(
      { user_id: huidigeGebruiker.id, gerecht_id: gerechtId, datum: vandaag() },
      { onConflict: "user_id,datum" }
    );

  if (error) {
    toonAppMelding("Stemmen is niet gelukt: " + error.message);
    return;
  }
  await laadStemmenVandaag();
  render();
});

winnaarKnop.addEventListener("click", async () => {
  const gerechtId = winnaarKnop.dataset.gerechtId;
  if (!gerechtId) return;

  const { error } = await supabaseClient.from("gegeten").insert({
    gerecht_id: gerechtId,
    datum: vandaag(),
    vastgesteld_door: huidigeGebruiker.id,
  });

  if (error) {
    toonAppMelding("Vastleggen is niet gelukt: " + error.message);
    return;
  }
  await alleGegevensVernieuwen();
});

document.getElementById("gerecht-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const naamInput = document.getElementById("gerecht-naam");
  const emojiInput = document.getElementById("gerecht-emoji");
  const naam = naamInput.value.trim();
  const emoji = emojiInput.value.trim();

  if (!naam) return;

  const { error } = await supabaseClient.from("gerechten").insert({
    naam,
    emoji: emoji || null,
    created_by: huidigeGebruiker.id,
  });

  if (error) {
    toonAppMelding("Gerecht toevoegen is niet gelukt: " + error.message);
    return;
  }

  naamInput.value = "";
  emojiInput.value = "";
  toonAppMelding("Gerecht toegevoegd!", false);
  await laadGerechten();
  render();
});

document.getElementById("vernieuw-knop").addEventListener("click", alleGegevensVernieuwen);

// ---------- Realtime ----------

function startRealtime() {
  supabaseClient
    .channel("eten-live")
    .on("postgres_changes", { event: "*", schema: "public", table: "stemmen" }, () => {
      laadStemmenVandaag().then(render);
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "gerechten" }, () => {
      laadGerechten().then(render);
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "gegeten" }, () => {
      Promise.all([laadGegetenGeschiedenis(), laadVastgesteldVandaag()]).then(render);
    })
    .subscribe();
}

// ---------- Start ----------

(async () => {
  const ingelogd = await initAuth();
  if (!ingelogd) return;
  await alleGegevensVernieuwen();
  startRealtime();
})();
