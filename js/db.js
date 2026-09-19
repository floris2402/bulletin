// Bulletin — couche de stockage IndexedDB
// Équivalent JS de AppDatabase.java + BulletinRepository.java (Room -> IndexedDB)

const DB_NOM = 'bulletin_db';
const DB_VERSION = 1;

let dbPromise = null;

function ouvrirDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const requete = indexedDB.open(DB_NOM, DB_VERSION);

    requete.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('semaines')) {
        const semaines = db.createObjectStore('semaines', { keyPath: 'id', autoIncrement: true });
        semaines.createIndex('parDateDebut', 'dateDebut', { unique: false });
        semaines.createIndex('parTerminee', 'terminee', { unique: false });
      }

      if (!db.objectStoreNames.contains('lignes')) {
        const lignes = db.createObjectStore('lignes', { keyPath: 'id', autoIncrement: true });
        lignes.createIndex('parSemaineId', 'semaineId', { unique: false });
        lignes.createIndex('parSemaineEtDate', ['semaineId', 'date'], { unique: false });
      }
    };

    requete.onsuccess = (event) => resolve(event.target.result);
    requete.onerror = (event) => reject(event.target.error);
  });

  return dbPromise;
}

function transaction(nomsStores, mode) {
  return ouvrirDB().then((db) => db.transaction(nomsStores, mode));
}

function promesseRequete(requete) {
  return new Promise((resolve, reject) => {
    requete.onsuccess = () => resolve(requete.result);
    requete.onerror = () => reject(requete.error);
  });
}

// ===== Semaines =====

async function creerSemaine(nom, prenom, dateDebut, dateFin) {
  const tx = await transaction(['semaines'], 'readwrite');
  const store = tx.objectStore('semaines');
  const semaine = { nom, prenom, dateDebut, dateFin, terminee: false };
  const id = await promesseRequete(store.add(semaine));
  semaine.id = id;
  return semaine;
}

async function getSemaine(id) {
  const tx = await transaction(['semaines'], 'readonly');
  return promesseRequete(tx.objectStore('semaines').get(id));
}

async function getSemaineParDateDebut(dateDebut) {
  const tx = await transaction(['semaines'], 'readonly');
  const index = tx.objectStore('semaines').index('parDateDebut');
  return promesseRequete(index.get(dateDebut));
}

async function getSemaineEnCours() {
  const tx = await transaction(['semaines'], 'readonly');
  const store = tx.objectStore('semaines');
  const toutes = await promesseRequete(store.getAll());
  const enCours = toutes.filter((s) => !s.terminee);
  if (enCours.length === 0) return null;
  enCours.sort((a, b) => (a.dateDebut < b.dateDebut ? 1 : -1));
  return enCours[0];
}

async function getToutesSemaines() {
  const tx = await transaction(['semaines'], 'readonly');
  const toutes = await promesseRequete(tx.objectStore('semaines').getAll());
  toutes.sort((a, b) => (a.dateDebut < b.dateDebut ? 1 : -1));
  return toutes;
}

async function marquerTerminee(semaine) {
  semaine.terminee = true;
  const tx = await transaction(['semaines'], 'readwrite');
  await promesseRequete(tx.objectStore('semaines').put(semaine));
}

/** Garde le mois en cours + le mois précédent, supprime tout ce qui est plus ancien (semaines + lignes liées). */
async function nettoyerAnciennesDonnees() {
  const cal = new Date();
  cal.setDate(1);
  cal.setMonth(cal.getMonth() - 1); // premier jour du mois précédent
  const dateLimite = versISO(cal);

  const tx = await transaction(['semaines', 'lignes'], 'readwrite');
  const storeSemaines = tx.objectStore('semaines');
  const storeLignes = tx.objectStore('lignes');
  const toutes = await promesseRequete(storeSemaines.getAll());

  for (const semaine of toutes) {
    if (semaine.dateDebut < dateLimite) {
      const indexLignes = storeLignes.index('parSemaineId');
      const lignes = await promesseRequete(indexLignes.getAll(semaine.id));
      for (const ligne of lignes) {
        await promesseRequete(storeLignes.delete(ligne.id));
      }
      await promesseRequete(storeSemaines.delete(semaine.id));
    }
  }
}

// ===== Lignes de saisie =====

async function ajouterLigne(semaineId, date, ordre) {
  const tx = await transaction(['lignes'], 'readwrite');
  const store = tx.objectStore('lignes');
  const ligne = {
    semaineId, date, ordre,
    commandeClient: '', frais: 0, km: 0,
    hDeplacements: 0, hSurDevis: 0, hRegie: 0, hDivers: 0,
    affectationDivers: ''
  };
  const id = await promesseRequete(store.add(ligne));
  ligne.id = id;
  return ligne;
}

async function sauvegarderLigne(ligne) {
  const tx = await transaction(['lignes'], 'readwrite');
  await promesseRequete(tx.objectStore('lignes').put(ligne));
}

async function supprimerLigne(ligne) {
  const tx = await transaction(['lignes'], 'readwrite');
  await promesseRequete(tx.objectStore('lignes').delete(ligne.id));
}

async function getLignesJour(semaineId, date) {
  const tx = await transaction(['lignes'], 'readonly');
  const index = tx.objectStore('lignes').index('parSemaineEtDate');
  const lignes = await promesseRequete(index.getAll(IDBKeyRange.only([semaineId, date])));
  lignes.sort((a, b) => a.ordre - b.ordre);
  return lignes;
}

async function getToutesLignes(semaineId) {
  const tx = await transaction(['lignes'], 'readonly');
  const index = tx.objectStore('lignes').index('parSemaineId');
  const lignes = await promesseRequete(index.getAll(semaineId));
  lignes.sort((a, b) => (a.date === b.date ? a.ordre - b.ordre : (a.date < b.date ? -1 : 1)));
  return lignes;
}

// Utilisé aussi par date-utils.js — répété ici volontairement pour garder db.js autonome
function versISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

window.BulletinDB = {
  creerSemaine, getSemaine, getSemaineParDateDebut, getSemaineEnCours, getToutesSemaines,
  marquerTerminee, nettoyerAnciennesDonnees,
  ajouterLigne, sauvegarderLigne, supprimerLigne, getLignesJour, getToutesLignes
};
