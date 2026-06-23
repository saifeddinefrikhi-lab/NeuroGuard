# NeuroGuard – Présentation du site

**NeuroGuard** est une application web de suivi patient (santé) avec rôles : **Admin**, **Médecin (Provider)**, **Patient**, **Aidant (Caregiver)**.

---

## Ce que fait le site

- **Authentification** : connexion par rôle (médecin, patient, etc.).
- **Dossiers médicaux** : le médecin crée des antécédents médicaux pour les patients ; le patient et l’aidant peuvent les consulter.
- **Plans de soins (Care plans)** : le médecin crée des plans (Nutrition, Sommeil, Activité, Médication) avec priorités et **échéances**. Le patient voit un **Kanban** et peut marquer les tâches comme terminées. **Discussion (chat)** médecin–patient par plan.
- **NeuroGuard Assistant** : chat (bouton en bas à droite) qui répond uniquement sur NeuroGuard et les plans de soins (alimenté par un moteur local si configuré).

---

## Message « Connexion impossible »

Le message :

> *Connexion impossible : vérifiez que la gateway (port 8083) et l'assistant sont démarrés, et que l'app est ouverte en http://localhost:4200.*

signifie que **le navigateur n’arrive pas à joindre le serveur** qui expose l’API (la **gateway**). Voici ce que chaque partie désigne :

| Élément | Rôle |
|--------|------|
| **Gateway (port 8083)** | Serveur backend qui reçoit les appels API (auth, care plans, dossiers médicaux, assistant). Sans elle, le site ne peut pas se connecter aux données. |
| **L’app en http://localhost:4200** | L’interface Angular. Il faut ouvrir le site à cette adresse (et non en `file://` ou une autre URL) pour éviter les erreurs CORS et de connexion. |
| **L’assistant** | Pour le **NeuroGuard Assistant** (chat en bas à droite), un service local doit tourner derrière la gateway. Sans lui, le reste du site peut marcher mais le chat affichera une erreur. |

---

## Démarrer le site (ordre conseillé)

### 1. Backend (obligatoire pour que le site fonctionne)

- **MySQL** : démarré et base créée (selon la config de vos services).
- **Eureka** (annuaire des microservices) :  
  `neuroguard-backend/eureka-server` → `mvnw spring-boot:run`
- **Gateway** (port **8083**) :  
  `neuroguard-backend/gateway` → `mvnw spring-boot:run`  
  C’est elle qui doit répondre pour que le message « Connexion impossible » disparaisse.
- **user-service**, **medical-history-service**, **careplan-service** : les lancer selon votre configuration (ports typiques 8081, 8082, 8084, etc.).

### 2. Frontend (le site web)

- Dossier **FrontEnd** :
  ```bash
  npm install
  npm start
  ```
- Ouvrir le navigateur sur : **http://localhost:4200**

### 3. NeuroGuard Assistant (optionnel, pour le chat)

- Si vous utilisez un moteur local (ex. Ollama) : lancer ce service sur la machine où tourne la gateway (souvent en localhost). La gateway redirige alors les requêtes « assistant » vers ce service.
- Sans cela, le reste du site (connexion, care plans, dossiers) fonctionne ; seul le chat assistant peut afficher une erreur.

---

## En résumé

- **Site** = frontend Angular sur **http://localhost:4200**.
- **API** = gateway sur **http://localhost:8083** + les autres microservices.
- « **Connexion impossible** » = le front ne peut pas joindre la gateway (8083) ou vous n’êtes pas en **http://localhost:4200**. Démarrer la gateway et ouvrir l’app à cette adresse règle en général le problème.
