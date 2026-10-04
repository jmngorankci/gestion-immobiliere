# Proposition : Gestion des Documents Justificatifs

## 1. Faisabilité Technique
L'ajout de documents (photos, scans, fichiers PDF) est **totalement réalisable** avec votre pile technique actuelle (Next.js + Supabase). 

Voici comment les différentes méthodes de capture fonctionnent dans une application web moderne :
*   **Sélection de fichier (PDF/Images)** : Fonctionnement natif standard via l'explorateur de fichiers.
*   **Prise de photo** : Très bien supporté sur mobile et tablette. En utilisant l'attribut HTML `capture="environment"`, le navigateur ouvre directement l'appareil photo de l'appareil.
*   **Scan direct** : Les navigateurs web n'ont pas accès direct aux scanners de bureau (imprimantes) sans un logiciel intermédiaire. Cependant, sur smartphone, la "prise de photo" intègre souvent la détection automatique de documents (iOS et Android le font nativement). Pour un vrai scan depuis un ordinateur, l'utilisateur devra utiliser le logiciel de son scanner puis "Sélectionner le fichier".

---

## 2. Solution Architecturale Proposée

### A. Base de données (Supabase)
Plutôt que d'encombrer les tables existantes, je propose de créer une table dédiée `documents_justificatifs` et un *Bucket* de stockage.

**Nouveau Bucket Supabase Storage :**
*   Nom : `documents_contrats` (Sécurisé : seuls les utilisateurs autorisés peuvent lire/écrire).

**Nouvelle Table `documents_justificatifs` :**
*   `id` : UUID
*   `nom_fichier` : (ex: "carte_identite_acheteur.pdf")
*   `type_document` : (ex: "piece_identite", "titre_foncier", "contrat_signe", "autre")
*   `fichier_url` : Lien vers le fichier dans le bucket Supabase
*   `contrat_bail_id` : (UUID, optionnel) -> Lien vers un bail de location
*   `transaction_vente_id` : (UUID, optionnel) -> Lien vers une vente
*   `created_at` : Date d'ajout

Cette structure permet à un seul document d'être rattaché de manière flexible à n'importe quel type de contrat, et d'en rattacher une infinité.

### B. Interface Utilisateur (Frontend)
Je vais développer un composant réutilisable **`DocumentUploader`** qui sera intégré à la fois dans le formulaire des Ventes et celui des Locations.

Ce composant aura :
1.  **Une zone de glisser-déposer (Drag & Drop)** pour les ordinateurs.
2.  **Un bouton "📸 Prendre une photo"** (Très pratique sur mobile/tablette sur le terrain).
3.  **Un bouton "📁 Parcourir"** pour chercher un fichier ou un scan récent.
4.  **Une liste visuelle** des documents déjà rattachés au contrat (avec possibilité de cliquer pour les visualiser ou les supprimer).

### C. Déroulement de l'action
1.  L'utilisateur remplit le contrat de vente/location.
2.  Il ajoute les documents (uploadés immédiatement de manière sécurisée vers Supabase Storage).
3.  Lorsqu'il valide le contrat, les documents sont définitivement rattachés à ce contrat dans la base de données.

---

## 3. Prochaines Étapes
Si cette approche vous convient, voici l'ordre d'implémentation :
1.  **Exécuter un script SQL** pour créer la table `documents_justificatifs` et configurer le *Bucket* Supabase.
2.  **Créer le composant d'Upload** en React (TailwindCSS + Lucide Icons pour un beau design).
3.  **Intégrer ce composant** dans la `SalesManagement` (Ventes) et la gestion des Baux (Location).

**Validez-vous cette approche ? Souhaitez-vous que je commence l'implémentation par le script SQL ?**
