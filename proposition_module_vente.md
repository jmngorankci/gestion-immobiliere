# Module de Gestion des Ventes Immobilières

Ce document présente l'analyse et la proposition technique pour l'intégration d'un module de gestion des ventes (maisons, terrains, etc.) dans votre application.

## 1. Analyse des Acteurs et Entités

Pour gérer une vente immobilière, nous devons faire interagir plusieurs entités. Voici la structure de données recommandée :

### A. Le Bien Immobilier (Property)
*   **ID** (Identifiant unique)
*   **Type** (Maison, Terrain, Appartement, Local commercial...)
*   **Statut** (À vendre, Sous compromis, Vendu)
*   **Prix demandé**
*   **Propriétaire actuel** (Celui qui vend)
*   **Caractéristiques** (Superficie, adresse, etc.)

### B. Les Acteurs (Contacts)
*   **Acquéreur (Acheteur)** : Informations de contact, capacité de financement.
*   **Propriétaire (Vendeur)** : Informations de contact.
*   **Notaire** : Officier public en charge de la transaction (Nom, Étude, Contact).

### C. L'Opération de Vente (Transaction)
C'est le cœur du module. Elle relie toutes les entités précédentes.
*   **ID Transaction**
*   **Bien vendu** (Référence au Bien)
*   **Vendeur** (Référence au Propriétaire)
*   **Acquéreur** (Référence à l'Acheteur)
*   **Notaire** (Référence au Notaire)
*   **Prix convenu**
*   **Statut de la vente** (Ex: *Initiée*, *Compromis signé*, *Fonds reçus*, *Acte final signé*, *Annulée*)
*   **Dates clés** (Signature compromis, acte final)

---

## 2. Interface Utilisateur Proposée (Frontend)

1.  **Tableau de bord des Ventes (Pipeline de transactions)** : Une vue type "Kanban" ou tableau pour voir l'avancement des ventes en cours.
2.  **Formulaire de Création de Vente** : 
    *   Sélection du bien à vendre.
    *   Sélection de l'Acquéreur, du Vendeur et du Notaire.
    *   Saisie du prix.
3.  **Dossier de Vente (Détail de la transaction)** :
    *   Espace regroupant tous les acteurs.
    *   Boutons pour faire avancer le statut.
    *   Espace de gestion documentaire (Compromis de vente, attestations, etc.).

---

## 3. Flux de travail (Workflow)

1.  **Création du Bien** : Statut "À vendre".
2.  **Offre acceptée** : L'agent crée une "Transaction". Le statut du bien passe en "Sous compromis".
3.  **Processus Notarial** : Suivi des étapes (financement, documents).
4.  **Clôture** : Une fois l'acte signé chez le notaire, la transaction passe en "Finalisée", et le bien passe en statut "Vendu". Le propriétaire du bien est mis à jour vers le nouvel acquéreur.

---

## Prochaines étapes

Si cette architecture vous convient, nous pouvons procéder étape par étape :
1.  **Étape 1** : Création/Mise à jour des modèles de base de données (Prisma ou autre).
2.  **Étape 2** : Création des APIs pour la gestion des transactions.
3.  **Étape 3** : Développement des interfaces React/Next.js.

Souhaitez-vous valider cette proposition ou y apporter des modifications avant que l'on commence l'implémentation (ex: ajouter d'autres acteurs comme un courtier) ?
