# Lekibbitz Bridge

> Apprendre le bridge en jouant — le plaisir d'abord, les finesses ensuite.

**Lekibbitz Bridge** est l'app pédagogique de la galaxie [Lekibbitz](https://lekibbitz.fr).
Elle s'appuie sur le **Petit Bridge** ([règles officielles FFB / Eduscol](https://eduscol.education.gouv.fr/sites/default/files/document/reglesle-petit-bridgeattenduspdf-73530.pdf)) :
4 familles × 10 cartes (1-10), pas d'enchères, pas d'atout, on apprend l'essence du bridge en jouant des plis.

Méthode unique pour tous les âges, visuels adaptés (skins jeunes / pré-ados / jeunes adultes / adultes neutres).

---

## Statut

- ✅ **Moteur de jeu** : TypeScript pur, UI-agnostique, 49/49 smoke tests passent.
- ✅ **MVP web jouable** : home + plateau + premier pli + écran "Bravo !" / "Pas grave !".
- 🚧 **Skins thématiques** : à designer.
- 🚧 **PWA déployée** : à empaqueter (Vite + React + Tailwind, cible `bridge.lekibbitz.fr`).
- 🚧 **Mort visible sur la table** : à intégrer (mécanique cœur du bridge).

## Architecture

```
.
├── engine/                 # Petit Bridge engine (TypeScript pur)
│   ├── types.ts           # Card, Suit, Seat, Team, Deal, phases
│   ├── deck.ts            # buildDeck / shuffle / dealCards / sortHand
│   ├── play.ts            # isLegalPlay / applyPlay / resolveTrickWinner
│   ├── ai.ts              # 3 niveaux : gentle / fair / sharp
│   ├── setup.ts           # startDeal (avec mains prédéfinies pour les tutos)
│   ├── index.ts           # API publique
│   └── smoke-test.ts      # 49 assertions, jeu complet rejoué déterministe
└── web/
    └── lesson-card.html   # MVP self-contained (HTML + CSS + JS inline)
```

## Faire tourner les tests du moteur

Node ≥ 22 (pour `--experimental-strip-types`) :

```bash
node --experimental-strip-types engine/smoke-test.ts
```

Sortie attendue :

```
=== Petit Bridge engine smoke test ===
1. Setup
  ✓ ...
6. 40-card deal still works
  ✓ ...
=== 49/49 passed ===
```

## Tester le MVP web

Ouvre `web/lesson-card.html` dans n'importe quel navigateur — il est totalement self-contained
(seules dépendances externes : Google Fonts + canvas-confetti via CDN).

## Stack cible (PWA)

- **Build** : Vite + React + Tailwind
- **State machine** : XState (pour les leçons branchées)
- **Backend** : Supabase self-hosted (VPS Hostinger)
- **Déploiement** : Docker → `bridge.lekibbitz.fr`
- **Phase 2** : Capacitor pour empaquetage iOS / Android

## Décisions techniques actées

| Point | Choix | Rationale |
|---|---|---|
| Plateforme | PWA pure, Capacitor en phase 2 | Mi-temps → leverage maximal, pas d'Expo / Flutter |
| Cartes | Adaptive deck 16 / 20 / 24 / 28 / 32 / 36 / 40 | Adaptable à l'âge / l'accompagnement |
| Familles | 4 couleurs abstraites + skins par tranche d'âge | Pédagogie unique, visuel adaptable |
| MVP | Premier pli sur deck 16 cartes | Boucle de feedback de 30 secondes |

## Sources & règles

- Eduscol — [Le Petit Bridge — Attendus et règle du jeu](https://eduscol.education.gouv.fr/sites/default/files/document/reglesle-petit-bridgeattenduspdf-73530.pdf)
- FFB — [Page Petit Bridge](https://www.ffbridge.fr/p/petit-bridge)
- Convention cadre Ministère Éducation Nationale 2022
- Contact FFB Petit Bridge : `petitbridge@ffbridge.fr`

## License

Privé — © Lekibbitz / Tom Joannès. Tous droits réservés.
