// Bulletin — écran de saisie jour par jour (équivalent de SaisieJourActivity.java)

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js').catch(() => {});
}

const params = new URLSearchParams(window.location.search);
const semaineId = Number(params.get('semaineId'));

const textJourTitre = document.getElementById('textJourTitre');
const containerLignes = document.getElementById('containerLignes');
const btnAjouterLigne = document.getElementById('btnAjouterLigne');
const btnPrecedent = document.getElementById('btnPrecedent');
const btnSuivant = document.getElementById('btnSuivant');

let semaine = null;
let dates5Jours = [];
let indexJourCourant = 0;
let lignesCourantes = []; // [{ ligne, element }]

(async function init() {
  if (!semaineId) { window.location.href = 'index.html'; return; }

  semaine = await BulletinDB.getSemaine(semaineId);
  if (!semaine) { window.location.href = 'index.html'; return; }

  dates5Jours = DateUtils.genererSemaineLunVen(DateUtils.depuisISO(semaine.dateDebut));

  let indexDepart = 0;
  for (let i = 0; i < dates5Jours.length; i++) {
    const lignesJour = await BulletinDB.getLignesJour(semaineId, dates5Jours[i]);
    indexDepart = i;
    if (lignesJour.length === 0) break;
  }
  await afficherJour(indexDepart);
})();

async function afficherJour(index) {
  indexJourCourant = index;
  const dateIso = dates5Jours[index];
  textJourTitre.textContent = DateUtils.formatTitreJour(dateIso);

  containerLignes.innerHTML = '';
  lignesCourantes = [];
  btnPrecedent.disabled = index === 0;
  btnSuivant.textContent = index === dates5Jours.length - 1 ? 'Terminer' : 'Suivant ▶';
  btnAjouterLigne.disabled = true;

  const lignes = await BulletinDB.getLignesJour(semaineId, dateIso);
  if (lignes.length === 0) {
    await ajouterNouvelleLigne();
  } else {
    for (const ligne of lignes) ajouterVueLigne(ligne);
  }
  btnAjouterLigne.disabled = false;
}

async function ajouterNouvelleLigne() {
  const dateIso = dates5Jours[indexJourCourant];
  const ordre = lignesCourantes.length;
  btnAjouterLigne.disabled = true;
  const ligne = await BulletinDB.ajouterLigne(semaineId, dateIso, ordre);
  ajouterVueLigne(ligne);
  btnAjouterLigne.disabled = false;
}

function escapeHtml(texte) {
  const div = document.createElement('div');
  div.textContent = texte || '';
  return div.innerHTML;
}

function ajouterVueLigne(ligne) {
  const carte = document.createElement('div');
  carte.className = 'carte-ligne';
  carte.innerHTML = `
    <div class="champ">
      <label>Commande / Nom Client</label>
      <input type="text" class="champCommandeClient" value="${escapeHtml(ligne.commandeClient)}">
    </div>
    <div class="ligne-champs">
      <div class="champ">
        <label>Frais (€)</label>
        <input type="text" inputmode="decimal" class="champFrais" value="${ligne.frais ? ligne.frais : ''}">
      </div>
      <div class="champ">
        <label>Kilomètres</label>
        <input type="text" inputmode="decimal" class="champKm" value="${ligne.km ? ligne.km : ''}">
      </div>
    </div>
    <div class="ligne-champs">
      <div class="champ">
        <label>Déplacements</label>
        <input type="text" inputmode="decimal" placeholder="ex: 6.30" class="champHDeplacements" value="${HeuresUtils.formatPourSaisie(ligne.hDeplacements)}">
      </div>
      <div class="champ">
        <label>Sur Devis</label>
        <input type="text" inputmode="decimal" placeholder="ex: 6.30" class="champHSurDevis" value="${HeuresUtils.formatPourSaisie(ligne.hSurDevis)}">
      </div>
    </div>
    <div class="ligne-champs">
      <div class="champ">
        <label>En Régie</label>
        <input type="text" inputmode="decimal" placeholder="ex: 6.30" class="champHRegie" value="${HeuresUtils.formatPourSaisie(ligne.hRegie)}">
      </div>
      <div class="champ">
        <label>Divers</label>
        <input type="text" inputmode="decimal" placeholder="ex: 6.30" class="champHDivers" value="${HeuresUtils.formatPourSaisie(ligne.hDivers)}">
      </div>
    </div>
    <div class="champ">
      <label>Affectation des heures Divers</label>
      <input type="text" placeholder="ex: 08h00-12h00 13h30-17h00" class="champAffectationDivers" value="${escapeHtml(ligne.affectationDivers)}">
    </div>
    <button class="supprimer">Supprimer cette ligne</button>
  `;

  const ligneVue = { ligne, element: carte };
  carte.querySelector('.supprimer').addEventListener('click', () => supprimerLigne(ligneVue));

  containerLignes.appendChild(carte);
  lignesCourantes.push(ligneVue);
}

async function supprimerLigne(ligneVue) {
  if (lignesCourantes.length === 1) {
    alert('Il doit rester au moins une ligne par jour');
    return;
  }
  containerLignes.removeChild(ligneVue.element);
  lignesCourantes = lignesCourantes.filter((lv) => lv !== ligneVue);
  await BulletinDB.supprimerLigne(ligneVue.ligne);
}

function lireChampsDepuisDOM(ligneVue) {
  const el = ligneVue.element;
  const ligne = ligneVue.ligne;
  ligne.commandeClient = el.querySelector('.champCommandeClient').value;
  ligne.frais = parseFloat((el.querySelector('.champFrais').value || '0').replace(',', '.')) || 0;
  ligne.km = parseFloat((el.querySelector('.champKm').value || '0').replace(',', '.')) || 0;
  ligne.hDeplacements = HeuresUtils.parseHeuresMinutes(el.querySelector('.champHDeplacements').value);
  ligne.hSurDevis = HeuresUtils.parseHeuresMinutes(el.querySelector('.champHSurDevis').value);
  ligne.hRegie = HeuresUtils.parseHeuresMinutes(el.querySelector('.champHRegie').value);
  ligne.hDivers = HeuresUtils.parseHeuresMinutes(el.querySelector('.champHDivers').value);
  ligne.affectationDivers = el.querySelector('.champAffectationDivers').value;
}

async function sauvegarderLignesCourantes() {
  for (const lv of lignesCourantes) {
    lireChampsDepuisDOM(lv);
    await BulletinDB.sauvegarderLigne(lv.ligne);
  }
}

btnAjouterLigne.addEventListener('click', ajouterNouvelleLigne);

btnPrecedent.addEventListener('click', async () => {
  if (indexJourCourant === 0) return;
  await sauvegarderLignesCourantes();
  await afficherJour(indexJourCourant - 1);
});

btnSuivant.addEventListener('click', async () => {
  if (indexJourCourant === dates5Jours.length - 1) {
    await terminerSemaine();
  } else {
    await sauvegarderLignesCourantes();
    await afficherJour(indexJourCourant + 1);
  }
});

async function terminerSemaine() {
  btnSuivant.disabled = true;
  await sauvegarderLignesCourantes();
  window.location.href = `apercu.html?semaineId=${semaineId}`;
}
