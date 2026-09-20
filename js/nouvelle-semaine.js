// Bulletin — écran Nouvelle semaine (équivalent de NouvelleSemaineActivity.java)

const editNom = document.getElementById('editNom');
const editPrenom = document.getElementById('editPrenom');
const textSemaineChoisie = document.getElementById('textSemaineChoisie');
const btnCommencer = document.getElementById('btnCommencer');
const selecteurDate = document.getElementById('selecteurDate');

let dates5Jours = null;
let semaineDejaValideeId = null; // null si aucune semaine existante pour la date choisie

// --- Enregistrement du service worker (fonctionnement hors-ligne) ---
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js').catch(() => {});
}

// --- Pré-remplissage NOM / Prénom mémorisés ---
editNom.value = Preferences.getNom();
editPrenom.value = Preferences.getPrenom();

// --- Nettoyage des données trop anciennes, puis reprise automatique d'une semaine en cours ---
(async function auDemarrage() {
  await BulletinDB.nettoyerAnciennesDonnees();
  const semaineEnCours = await BulletinDB.getSemaineEnCours();
  if (semaineEnCours) {
    window.location.href = `saisie.html?semaineId=${semaineEnCours.id}`;
  }
})();

// --- Bouton "Choisir le lundi de la semaine" ---
document.getElementById('btnChoisirLundi').addEventListener('click', () => {
  selecteurDate.value = DateUtils.versISO(new Date());
  selecteurDate.showPicker ? selecteurDate.showPicker() : selecteurDate.click();
});

selecteurDate.addEventListener('change', () => {
  if (!selecteurDate.value) return;
  calculerSemaine(DateUtils.depuisISO(selecteurDate.value));
});

async function calculerSemaine(dateChoisie) {
  dates5Jours = DateUtils.genererSemaineLunVen(dateChoisie);
  textSemaineChoisie.textContent =
    `Semaine du ${DateUtils.formatAffichage(dates5Jours[0])} au ${DateUtils.formatAffichage(dates5Jours[4])}`;

  semaineDejaValideeId = null;
  btnCommencer.textContent = 'Commencer la saisie';
  btnCommencer.disabled = true;

  const semaineExistante = await BulletinDB.getSemaineParDateDebut(dates5Jours[0]);
  if (semaineExistante && semaineExistante.terminee) {
    semaineDejaValideeId = semaineExistante.id;
    btnCommencer.textContent = 'Voir le PDF';
  }
  btnCommencer.disabled = false;
}

// --- Bouton principal : créer la semaine, ou voir le PDF d'une semaine déjà validée ---
btnCommencer.addEventListener('click', async () => {
  if (semaineDejaValideeId !== null) {
    window.location.href = `apercu.html?semaineId=${semaineDejaValideeId}`;
    return;
  }

  if (!dates5Jours) return;
  const nom = editNom.value.trim();
  const prenom = editPrenom.value.trim();

  Preferences.sauvegarderNomPrenom(nom, prenom);

  btnCommencer.disabled = true;
  const semaine = await BulletinDB.creerSemaine(nom, prenom, dates5Jours[0], dates5Jours[4]);
  window.location.href = `saisie.html?semaineId=${semaine.id}`;
});

// --- Historique ---
document.getElementById('btnHistorique').addEventListener('click', () => {
  window.location.href = 'historique.html';
});
