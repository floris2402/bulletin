// Bulletin — écran Aperçu PDF + envoi mail (équivalent de ApercuBulletinActivity.java)

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js').catch(() => {});
}

const params = new URLSearchParams(window.location.search);
const semaineId = Number(params.get('semaineId'));

let semaine = null;
let dates5Jours = [];
let pdfBlob = null;

(async function init() {
  if (!semaineId) { window.location.href = 'index.html'; return; }

  semaine = await BulletinDB.getSemaine(semaineId);
  if (!semaine) { window.location.href = 'index.html'; return; }

  dates5Jours = DateUtils.genererSemaineLunVen(DateUtils.depuisISO(semaine.dateDebut));
  const lignes = await BulletinDB.getToutesLignes(semaineId);

  pdfBlob = await PdfGenerator.genererPdfBlob(semaine, dates5Jours, lignes);
  const url = URL.createObjectURL(pdfBlob);
  document.getElementById('visionneusePdf').src = url;
})();

document.getElementById('btnCorriger').addEventListener('click', () => {
  window.location.href = `saisie.html?semaineId=${semaineId}`;
});

document.getElementById('btnEnvoyerMail').addEventListener('click', async () => {
  const btn = document.getElementById('btnEnvoyerMail');
  btn.disabled = true;

  const nomFichier = `Bulletin_${semaine.dateDebut}.pdf`;
  const objet = `Heures de ${semaine.nom || ''} ${semaine.prenom || ''}`.trim();
  const texte = `Bonjour,\n\nVeuillez trouver ci-joint mes heures pour la semaine du ${DateUtils.formatAffichage(semaine.dateDebut)} au ${DateUtils.formatAffichage(semaine.dateFin)}.\n\nCordialement,\n${(semaine.prenom || '') + ' ' + (semaine.nom || '')}`.trim();

  await BulletinDB.marquerTerminee(semaine);

  const fichier = new File([pdfBlob], nomFichier, { type: 'application/pdf' });

  if (navigator.canShare && navigator.canShare({ files: [fichier] })) {
    try {
      await navigator.share({ files: [fichier], title: objet, text: texte });
      window.location.href = 'index.html';
      return;
    } catch (erreurPartage) {
      btn.disabled = false;
      return;
    }
  }

  const mailPrincipal = Preferences.getMailPrincipal();
  const mailCopie = Preferences.getMailCopie();

  const url = URL.createObjectURL(pdfBlob);
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = nomFichier;
  lien.click();

  let mailto = `mailto:${encodeURIComponent(mailPrincipal)}?subject=${encodeURIComponent(objet)}&body=${encodeURIComponent(texte)}`;
  if (mailCopie) mailto += `&cc=${encodeURIComponent(mailCopie)}`;

  alert("Le PDF a été téléchargé sur cet appareil. Ta messagerie va s'ouvrir : pense à joindre manuellement le fichier téléchargé.");
  window.location.href = mailto;
});
