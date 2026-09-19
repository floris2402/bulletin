// Bulletin — conversion heures/minutes (ex: "6.30" saisi = 6h30 = 6.5 en décimal)

/** Convertit une saisie "H.MM" (ex: "6.30" = 6h30, "6.05" = 6h05) en heures décimales (6.5). */
function parseHeuresMinutes(texte) {
  if (texte === null || texte === undefined) return 0;
  texte = String(texte).trim().replace(',', '.');
  if (texte === '') return 0;

  const parties = texte.split('.');
  const heures = parseInt(parties[0], 10);
  if (isNaN(heures)) return 0;

  let minutes = 0;
  if (parties.length > 1 && parties[1] !== '') {
    let partieMinutes = parties[1];
    if (partieMinutes.length === 1) partieMinutes += '0'; // "6.3" -> 6h30
    minutes = parseInt(partieMinutes.substring(0, 2), 10) || 0;
  }
  return heures + minutes / 60;
}

/** Convertit des heures décimales (6.5) en saisie "H.MM" affichable (ex: "6.30"). Vide si 0. */
function formatPourSaisie(heuresDecimal) {
  if (!heuresDecimal) return '';
  let heures = Math.floor(heuresDecimal);
  let minutes = Math.round((heuresDecimal - heures) * 60);
  if (minutes === 60) { heures++; minutes = 0; }
  if (minutes === 0) return String(heures);
  return `${heures}.${String(minutes).padStart(2, '0')}`;
}

/** Convertit des heures décimales (6.5) en affichage "6h30", toujours (même si 0 -> "0h00"). */
function formatHeuresMinutes(heuresDecimal) {
  let heures = Math.floor(heuresDecimal);
  let minutes = Math.round((heuresDecimal - heures) * 60);
  if (minutes === 60) { heures++; minutes = 0; }
  return `${heures}h${String(minutes).padStart(2, '0')}`;
}

/** Comme formatHeuresMinutes, mais renvoie une chaîne vide si la valeur est nulle. */
function formatHeuresMinutesOuVide(heuresDecimal) {
  return heuresDecimal === 0 ? '' : formatHeuresMinutes(heuresDecimal);
}

window.HeuresUtils = {
  parseHeuresMinutes, formatPourSaisie, formatHeuresMinutes, formatHeuresMinutesOuVide
};
