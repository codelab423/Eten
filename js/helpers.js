// Kleine hulpfuncties die op meerdere pagina's gebruikt worden.

// Geeft vandaag terug als "YYYY-MM-DD", gebaseerd op de lokale tijd
// van de telefoon/computer van de gebruiker (niet UTC). Zo begint de
// stemming voor iedereen in het gezin op hetzelfde moment opnieuw.
function vandaag() {
  const d = new Date();
  const jaar = d.getFullYear();
  const maand = String(d.getMonth() + 1).padStart(2, "0");
  const dag = String(d.getDate()).padStart(2, "0");
  return `${jaar}-${maand}-${dag}`;
}

// Aantal dagen tussen een datum ("YYYY-MM-DD") en vandaag.
function dagenGeleden(datumStr) {
  const [y, m, d] = datumStr.split("-").map(Number);
  const [vy, vm, vd] = vandaag().split("-").map(Number);
  const dan = new Date(y, m - 1, d);
  const nu = new Date(vy, vm - 1, vd);
  return Math.round((nu - dan) / (1000 * 60 * 60 * 24));
}

// Zet een aantal dagen om in leesbare tekst.
function laatstGegetenTekst(datumStr) {
  if (!datumStr) return "nog niet eerder gegeten";
  const dagen = dagenGeleden(datumStr);
  if (dagen <= 0) return "vandaag";
  if (dagen === 1) return "gisteren";
  return `${dagen} dagen geleden`;
}

function escapeHtml(tekst) {
  const div = document.createElement("div");
  div.textContent = tekst ?? "";
  return div.innerHTML;
}
