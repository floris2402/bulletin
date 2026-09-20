// Bulletin — génération du PDF (équivalent de PdfGenerator.java, avec pdfmake au lieu d'iText7)

const BLEU = '#1F6FC9';
const FOND_TOTAL = '#E8F1FB';

async function chargerImageEnBase64(url) {
  try {
    const reponse = await fetch(url);
    const blob = await reponse.blob();
    return await new Promise((resolve, reject) => {
      const lecteur = new FileReader();
      lecteur.onload = () => resolve(lecteur.result);
      lecteur.onerror = reject;
      lecteur.readAsDataURL(blob);
    });
  } catch (e) {
    return null; // pas de logo trouvé : le PDF se génère quand même, juste sans logo
  }
}

function formatNombre(valeur) {
  return valeur ? String(valeur) : '';
}

function construireDocDefinition(semaine, dates5Jours, lignes, logoDataUrl) {
  const corpsTableau = [
    [
      { text: 'Date', rowSpan: 2, style: 'enteteTableau' },
      { text: 'Commande\nNom Client', rowSpan: 2, style: 'enteteTableau' },
      { text: 'Frais', rowSpan: 2, style: 'enteteTableau' },
      { text: 'Kilomètre\nParcouru', rowSpan: 2, style: 'enteteTableau' },
      { text: "Nombres D'Heures", colSpan: 4, style: 'enteteTableau' }, {}, {}, {},
      { text: 'Affectation des Heures\nDIVERS', rowSpan: 2, style: 'enteteTableau' }
    ],
    [
      {}, {}, {}, {},
      { text: 'Déplacements', style: 'sousEntete' },
      { text: 'Sur Devis', style: 'sousEntete' },
      { text: 'En Régie', style: 'sousEntete' },
      { text: 'Divers', style: 'sousEntete' },
      {}
    ]
  ];

  let totalDeplacements = 0, totalSurDevis = 0, totalRegie = 0, totalDivers = 0;

  for (const dateJour of dates5Jours) {
    const lignesDuJour = lignes.filter((l) => l.date === dateJour).sort((a, b) => a.ordre - b.ordre);

    if (lignesDuJour.length === 0) {
      corpsTableau.push([
        { text: DateUtils.formatJourMois(dateJour), style: 'celluleDonnee' },
        { text: '', style: 'celluleDonnee' },
        { text: '', style: 'celluleDonnee', alignment: 'right' },
        { text: '', style: 'celluleDonnee', alignment: 'right' },
        { text: '', style: 'celluleDonnee', alignment: 'center' },
        { text: '', style: 'celluleDonnee', alignment: 'center' },
        { text: '', style: 'celluleDonnee', alignment: 'center' },
        { text: '', style: 'celluleDonnee', alignment: 'center' },
        { text: '', style: 'celluleDonnee' }
      ]);
      continue;
    }

    let premiere = true;
    for (const ligne of lignesDuJour) {
      corpsTableau.push([
        { text: premiere ? DateUtils.formatJourMois(dateJour) : '', style: 'celluleDonnee' },
        { text: ligne.commandeClient || '', style: 'celluleDonnee' },
        { text: formatNombre(ligne.frais), style: 'celluleDonnee', alignment: 'right' },
        { text: formatNombre(ligne.km), style: 'celluleDonnee', alignment: 'right' },
        { text: HeuresUtils.formatHeuresMinutesOuVide(ligne.hDeplacements), style: 'celluleDonnee', alignment: 'center' },
        { text: HeuresUtils.formatHeuresMinutesOuVide(ligne.hSurDevis), style: 'celluleDonnee', alignment: 'center' },
        { text: HeuresUtils.formatHeuresMinutesOuVide(ligne.hRegie), style: 'celluleDonnee', alignment: 'center' },
        { text: HeuresUtils.formatHeuresMinutesOuVide(ligne.hDivers), style: 'celluleDonnee', alignment: 'center' },
        { text: ligne.affectationDivers || '', style: 'celluleDonnee' }
      ]);
      premiere = false;
      totalDeplacements += ligne.hDeplacements;
      totalSurDevis += ligne.hSurDevis;
      totalRegie += ligne.hRegie;
      totalDivers += ligne.hDivers;
    }
  }

  const totalGeneral = totalDeplacements + totalSurDevis + totalRegie + totalDivers;
  corpsTableau.push([
    { text: '', style: 'celluleTotal' },
    { text: 'Total', style: 'celluleTotal' },
    { text: '', style: 'celluleTotal' },
    { text: '', style: 'celluleTotal' },
    { text: HeuresUtils.formatHeuresMinutes(totalDeplacements), style: 'celluleTotal', alignment: 'center' },
    { text: HeuresUtils.formatHeuresMinutes(totalSurDevis), style: 'celluleTotal', alignment: 'center' },
    { text: HeuresUtils.formatHeuresMinutes(totalRegie), style: 'celluleTotal', alignment: 'center' },
    { text: HeuresUtils.formatHeuresMinutes(totalDivers), style: 'celluleTotal', alignment: 'center' },
    { text: HeuresUtils.formatHeuresMinutes(totalGeneral), style: 'celluleTotal', alignment: 'center' }
  ]);

  const content = [];

  if (logoDataUrl) {
    content.push({ image: logoDataUrl, width: 56, absolutePosition: { x: 20, y: 20 } });
  }

  content.push({ text: 'BULLETIN INDIVIDUEL DE PRODUCTION', style: 'titre', margin: [0, 0, 0, 10] });

  content.push({
    table: {
      widths: ['25%', '25%', '12%', '25%'],
      body: [[
        { text: 'Semaine du', style: 'libelle', alignment: 'right', border: [false, false, false, false] },
        { text: DateUtils.formatAffichage(semaine.dateDebut), style: 'valeur', alignment: 'center' },
        { text: 'au', style: 'libelle', alignment: 'center', border: [false, false, false, false] },
        { text: DateUtils.formatAffichage(semaine.dateFin), style: 'valeur', alignment: 'center' }
      ]]
    },
    margin: [0, 0, 0, 8]
  });

  content.push({
    table: {
      widths: ['12%', '38%', '12%', '38%'],
      body: [[
        { text: 'NOM:', style: 'libelle', border: [false, false, false, false] },
        { text: semaine.nom || '', style: 'valeur', alignment: 'center' },
        { text: 'Prénom:', style: 'libelle', border: [false, false, false, false] },
        { text: semaine.prenom || '', style: 'valeur', alignment: 'center' }
      ]]
    },
    margin: [0, 0, 0, 14]
  });

  content.push({
    table: {
      headerRows: 2,
            widths: ['8.6%', '13.8%', '8.6%', '10.3%', '10.3%', '10.3%', '10.3%', '10.3%', '17.5%'],
      body: corpsTableau
    },
    layout: {
      hLineWidth: () => 0.75,
      vLineWidth: () => 0.75,
      hLineColor: () => '#D8DEE8',
      vLineColor: () => '#D8DEE8',
      paddingLeft: () => 6, paddingRight: () => 6, paddingTop: () => 6, paddingBottom: () => 6
    }
  });

  return {
    pageSize: 'A4',
    pageOrientation: 'landscape',
    pageMargins: [20, 20, 20, 20],
    content,
    styles: {
      titre: { fontSize: 20, bold: true, italics: true, color: BLEU, alignment: 'center' },
      libelle: { fontSize: 11, bold: true, color: BLEU },
      valeur: { fontSize: 11 },
      enteteTableau: { fontSize: 10, bold: true, color: BLEU, alignment: 'center' },
      sousEntete: { fontSize: 9, bold: true, color: BLEU, alignment: 'center' },
      celluleDonnee: { fontSize: 9 },
      celluleTotal: { fontSize: 9, bold: true, fillColor: FOND_TOTAL }
    },
    defaultStyle: { font: 'Roboto' }
  };
}

/** Génère le PDF et renvoie un Blob prêt à afficher/partager/télécharger. Rejette si la génération échoue ou produit un fichier vide. */
async function genererPdfBlob(semaine, dates5Jours, lignes) {
  const logoDataUrl = await chargerImageEnBase64('assets/logo.png');
  const docDefinition = construireDocDefinition(semaine, dates5Jours, lignes, logoDataUrl);
  return new Promise((resolve, reject) => {
    try {
      pdfMake.createPdf(docDefinition).getBlob((blob) => {
        if (!blob || blob.size < 500) {
          reject(new Error('Le fichier PDF généré est vide ou invalide.'));
          return;
        }
        resolve(new Blob([blob], { type: 'application/pdf' }));
      });
    } catch (erreur) {
      reject(erreur);
    }
  });
}

window.PdfGenerator = { genererPdfBlob };
