// Bulletin — préférences locales (équivalent de PreferencesManager.java)

const CLE_MAIL_PRINCIPAL = 'bulletin_mail_principal';
const CLE_MAIL_COPIE = 'bulletin_mail_copie';
const CLE_NOM = 'bulletin_dernier_nom';
const CLE_PRENOM = 'bulletin_dernier_prenom';

function getMailPrincipal() { return localStorage.getItem(CLE_MAIL_PRINCIPAL) || ''; }
function getMailCopie() { return localStorage.getItem(CLE_MAIL_COPIE) || ''; }
function sauvegarderMails(mailPrincipal, mailCopie) {
  localStorage.setItem(CLE_MAIL_PRINCIPAL, mailPrincipal || '');
  localStorage.setItem(CLE_MAIL_COPIE, mailCopie || '');
}

function getNom() { return localStorage.getItem(CLE_NOM) || ''; }
function getPrenom() { return localStorage.getItem(CLE_PRENOM) || ''; }
function sauvegarderNomPrenom(nom, prenom) {
  localStorage.setItem(CLE_NOM, nom || '');
  localStorage.setItem(CLE_PRENOM, prenom || '');
}

window.Preferences = {
  getMailPrincipal, getMailCopie, sauvegarderMails,
  getNom, getPrenom, sauvegarderNomPrenom
};
