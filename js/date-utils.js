// Bulletin — utilitaires de date (équivalent de DateUtils.java)

function versISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function depuisISO(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatAffichage(iso) {
  const date = depuisISO(iso);
  const j = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${j}/${m}/${date.getFullYear()}`;
}

const MOIS_COURT = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
function formatJourMois(iso) {
  const date = depuisISO(iso);
  return `${String(date.getDate()).padStart(2, '0')}-${MOIS_COURT[date.getMonth()]}`;
}

const JOURS_SEMAINE = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
function formatTitreJour(iso) {
  const date = depuisISO(iso);
  return `${JOURS_SEMAINE[date.getDay()]} ${formatAffichage(iso)}`;
}

/** Ramène la date donnée au lundi de sa semaine, puis génère lundi -> vendredi (5 dates ISO). */
function genererSemaineLunVen(dateChoisie) {
  const date = new Date(dateChoisie);
  const jourSemaine = date.getDay(); // 0 = dimanche ... 6 = samedi
  const decalage = jourSemaine === 0 ? -6 : (1 - jourSemaine);
  date.setDate(date.getDate() + decalage);

  const dates = [];
  for (let i = 0; i < 5; i++) {
    dates.push(versISO(date));
    date.setDate(date.getDate() + 1);
  }
  return dates;
}

window.DateUtils = {
  versISO, depuisISO, formatAffichage, formatJourMois, formatTitreJour, genererSemaineLunVen
};
