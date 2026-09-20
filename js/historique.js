// Bulletin — écran Historique (liste des semaines, avec accès à leur PDF)

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js').catch(() => {});
}

document.getElementById('btnRetour').addEventListener('click', () => {
  window.location.href = 'index.html';
});

(async function init() {
  const semaines = await BulletinDB.getToutesSemaines();
  const liste = document.getElementById('listeSemaines');
  const textVide = document.getElementById('textVide');

  if (semaines.length === 0) {
    textVide.style.display = 'block';
    return;
  }

  for (const semaine of semaines) {
    const item = document.createElement('li');

    const texte = document.createElement('span');
    texte.textContent = `Semaine du ${DateUtils.formatAffichage(semaine.dateDebut)} au ${DateUtils.formatAffichage(semaine.dateFin)}`;

    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = semaine.terminee ? 'Validée' : 'En cours';

    item.appendChild(texte);
    item.appendChild(badge);

    item.addEventListener('click', () => {
      if (semaine.terminee) {
        window.location.href = `apercu.html?semaineId=${semaine.id}`;
      } else {
        window.location.href = `saisie.html?semaineId=${semaine.id}`;
      }
    });

    liste.appendChild(item);
  }
})();
