import { StrategyConfig } from '../types/roulette';

export type StrategyKey =
  | 'martingale_observation'
  | 'paroli'
  | 'dalembert'
  | 'fibonacci'
  | 'romanosky'
  | 'james_bond';

export interface StrategyDefinition {
  id: StrategyKey;
  name: string;
  tagline: string;
  badge: string;
  badgeTheme: 'purple' | 'emerald' | 'blue' | 'amber' | 'indigo' | 'rose';
  riskLevel: 'FAIBLE' | 'MODÉRÉ' | 'ÉLEVÉ';
  riskScore: number; // 1 to 5
  shortTermWinRate: string;
  recommendedBankroll: number;
  defaultBaseBet: number;
  description: string;
  rules: string[];
  pros: string[];
  cons: string[];
  config: StrategyConfig;
}

export const STRATEGY_DEFINITIONS: Record<StrategyKey, StrategyDefinition> = {
  martingale_observation: {
    id: 'martingale_observation',
    name: 'Martingale avec Observation (Votre Stratégie)',
    tagline: 'Attente de 2 couleurs identiques, doublement sur l\'opposé et plafond strict à 640 €',
    badge: 'Personnalisée & Active',
    badgeTheme: 'purple',
    riskLevel: 'ÉLEVÉ',
    riskScore: 4,
    shortTermWinRate: '85 % à 90 %',
    recommendedBankroll: 1275,
    defaultBaseBet: 5,
    description:
      'La stratégie centrale développée pour votre test : on observe la roue sans miser. Dès que 2 Rouges (ou 2 Noirs) sortent consécutivement, on mise sur la couleur opposée en doublant après chaque échec jusqu\'à un plafond strict de 640 €.',
    rules: [
      'Phase d\'observation : attend 2 tirages consécutifs de la même couleur (Rouge ou Noir)',
      'Déclenchement : mise sur la couleur opposée (si 2 Rouges -> mise sur Noir)',
      'En cas d\'échec : double la mise au tour suivant (5€, 10€, 20€, 40€, 80€, 160€, 320€, 640€)',
      'Plafond strict à 640 € : Stop-Loss de sécurité pour éviter la banqueroute totale',
      'En cas de gain : encaisse la mise de base (+5€ net) et réinitialise strictement les compteurs d\'observation à 0',
    ],
    pros: [
      'Taux de victoire impressionnant sur les sessions de 1h à 3h (~85-90%)',
      'Plafond de 640 € évitant de tout perdre sur une série noire infinie',
      'Patience : l\'observation élimine les séries courtes sans risquer d\'argent',
    ],
    cons: [
      'Un crash (série de 8 pertes) coûte -630 € à -1 275 €',
      'Nécessite une grande discipline pour s\'arrêter dès que l\'objectif de gain est atteint',
    ],
    config: {
      strategyType: 'martingale_observation',
      initialBankroll: 1000,
      baseBet: 5,
      consecutiveTrigger: 2,
      maxSteps: 8,
      betProgression: [5, 10, 20, 40, 80, 160, 320, 640],
      zeroRule: 'loss',
      stopLossBankroll: 0,
    },
  },

  paroli: {
    id: 'paroli',
    name: 'Système Paroli (Martingale Inversée)',
    tagline: 'Capital protégé : on ne double QUE sur les victoires jusqu\'à 3 gains consécutifs',
    badge: 'Préféré des Pros',
    badgeTheme: 'emerald',
    riskLevel: 'FAIBLE',
    riskScore: 2,
    shortTermWinRate: '55 % à 65 %',
    recommendedBankroll: 300,
    defaultBaseBet: 10,
    description:
      'Considérée par les mathématiciens comme l\'une des stratégies les plus saines. Au lieu de doubler après une perte et de risquer son propre argent, on ne double qu\'après une victoire en jouant avec les gains du casino, avec un palier fixe de 3 victoires.',
    rules: [
      'Mise de départ fixe sur chance simple (Rouge ou Noir)',
      'En cas de perte : on ne double PAS, on reste toujours à la mise de base (perte max : -10€)',
      'En cas de gain : on double la mise en réinvestissant le bénéfice (10€ -> 20€ -> 40€)',
      'Après 3 victoires d\'affilée : on empoche le gain total (+70€ net) et on revient à 10€',
    ],
    pros: [
      'Ne subit JAMAIS de crash violent : les pertes sont toujours limitées à 1 unité (10€)',
      'Exploite les séries de chance naturelles de la roulette',
      'Excellente gestion psychologique sans stress',
    ],
    cons: [
      'Nécessite d\'aligner 3 victoires d\'affilée pour réaliser le gros profit',
      'Taux d\'érosion lent si la roulette alterne constamment entre Rouge et Noir',
    ],
    config: {
      strategyType: 'paroli',
      initialBankroll: 500,
      baseBet: 10,
      consecutiveTrigger: 1,
      maxSteps: 3,
      betProgression: [10, 20, 40],
      zeroRule: 'loss',
      stopLossBankroll: 0,
    },
  },

  dalembert: {
    id: 'dalembert',
    name: 'Système D\'Alembert',
    tagline: 'Progression linéaire douce : +1 unité après une perte, -1 unité après un gain',
    badge: 'Équilibre & Stabilité',
    badgeTheme: 'blue',
    riskLevel: 'MODÉRÉ',
    riskScore: 2.5,
    shortTermWinRate: '68 % à 75 %',
    recommendedBankroll: 500,
    defaultBaseBet: 10,
    description:
      'Inspiré par le mathématicien français Jean d\'Alembert. Cette méthode repose sur le principe du retour à l\'équilibre : la mise augmente de manière arithmétique (et non géométrique), ce qui évite les montées de mises vertigineuses.',
    rules: [
      'Mise de base sur chance simple (ex: 10 € sur Rouge)',
      'En cas de perte : on augmente la mise de +1 unité (+10 €)',
      'En cas de gain : on diminue la mise de -1 unité (-10 €)',
      'Objectif : lorsque le nombre de gains égale le nombre de pertes, on est toujours en profit net positif !',
    ],
    pros: [
      'Progression très douce : la mise n\'explose jamais brutalement',
      'Idéal pour des sessions longues et posées au casino',
      'Rentable dès que les victoires équilibrent les défaites',
    ],
    cons: [
      'Peut stagner si une longue série de pertes s\'installe',
      'Nécessite plus de tours pour récupérer de gros trous de variance',
    ],
    config: {
      strategyType: 'dalembert',
      initialBankroll: 600,
      baseBet: 10,
      consecutiveTrigger: 1,
      maxSteps: 8,
      betProgression: [10, 20, 30, 40, 50, 60, 70, 80],
      zeroRule: 'loss',
      stopLossBankroll: 0,
    },
  },

  fibonacci: {
    id: 'fibonacci',
    name: 'Suite de Fibonacci',
    tagline: 'Progression naturelle (1, 1, 2, 3, 5, 8, 13...) avec recul de 2 crans en cas de gain',
    badge: 'Mathématique Célèbre',
    badgeTheme: 'amber',
    riskLevel: 'MODÉRÉ',
    riskScore: 3,
    shortTermWinRate: '72 % à 80 %',
    recommendedBankroll: 800,
    defaultBaseBet: 5,
    description:
      'Utilise la suite dorée découverte par Leonardo Fibonacci au Moyen-Âge. Chaque mise est la somme des deux précédentes. La règle magique : après une victoire, on recule de 2 rangs dans la suite, permettant d\'être gagnant même avec seulement 33% de victoires !',
    rules: [
      'Progression selon la suite : 5€, 5€, 10€, 15€, 25€, 40€, 65€, 105€, 170€, 275€...',
      'En cas de perte : on avance d\'un rang dans la suite',
      'En cas de gain : on recule de 2 rangs dans la suite (ou retour au début si palier 1 ou 2)',
      'Permet d\'effacer deux pertes passées avec une seule victoire',
    ],
    pros: [
      'Génère du profit même avec beaucoup plus de tirages perdants que de gagnants',
      'Moins risqué et moins brutal que la Martingale classique',
      'Très élégant mathématiquement',
    ],
    cons: [
      'Peut atteindre des montants élevés lors de très longues séries de défaites',
      'Nécessite un suivi attentif des paliers sur papier ou sur l\'app',
    ],
    config: {
      strategyType: 'fibonacci',
      initialBankroll: 800,
      baseBet: 5,
      consecutiveTrigger: 1,
      maxSteps: 9,
      betProgression: [5, 5, 10, 15, 25, 40, 65, 105, 170],
      zeroRule: 'loss',
      stopLossBankroll: 0,
    },
  },

  romanosky: {
    id: 'romanosky',
    name: 'Système Romanosky (Couverture 86,5%)',
    tagline: 'Couvre 32 numéros sur 37 à chaque tirage (2 douzaines + 2 carrés)',
    badge: '86,5% de Victoire / Tirage',
    badgeTheme: 'indigo',
    riskLevel: 'ASYMÉTRIQUE',
    riskScore: 3.5,
    shortTermWinRate: '86,5 % par tirage',
    recommendedBankroll: 800,
    defaultBaseBet: 10,
    description:
      'La stratégie favorite des joueurs qui détestent perdre un tour. En combinant deux douzaines et deux carrés (corners), on couvre 32 numéros sur les 37 de la roulette européenne. On gagne presque à chaque coup (+1 unité), mais les 5 numéros perdants coûtent 8 unités.',
    rules: [
      'Mise totale de 8 unités par tirage (ex: 80 €)',
      '3 unités sur la Douzaine 1 (numéros 1 à 12)',
      '3 unités sur la Douzaine 2 (numéros 13 à 24)',
      '1 unité sur le Carré 25-29 et 1 unité sur le Carré 26-30 dans la 3ème douzaine',
      'Si l\'un des 32 numéros sort : GAIN de +1 unité nette (+10 €)',
      'Si l\'un des 5 numéros non couverts sort (ex: Zéro ou numéros orphelins) : PERTE de 8 unités (-80 €)',
    ],
    pros: [
      'Sensation incroyable : on gagne dans 86,5 % des tirages !',
      'Idéal pour des sessions courtes où l\'on veut engranger de petits gains réguliers',
      'Couvre presque l\'intégralité du tapis de jeu',
    ],
    cons: [
      'Quand la perte arrive, elle efface 8 victoires d\'un coup',
      'Nécessite une bankroll solide pour encaisser les éventuels trous',
    ],
    config: {
      strategyType: 'romanosky',
      initialBankroll: 800,
      baseBet: 10,
      consecutiveTrigger: 1,
      maxSteps: 4,
      betProgression: [80, 160, 320, 640],
      zeroRule: 'loss',
      stopLossBankroll: 0,
    },
  },

  james_bond: {
    id: 'james_bond',
    name: 'Stratégie James Bond 007',
    tagline: 'Mise plate légendaire couvrant 25 numéros sur 37 (Passe, Sixain et Zéro)',
    badge: 'Culte & Rapide',
    badgeTheme: 'rose',
    riskLevel: 'MODÉRÉ',
    riskScore: 3,
    shortTermWinRate: '67,6 % par tirage',
    recommendedBankroll: 600,
    defaultBaseBet: 20,
    description:
      'Inventée par Ian Fleming dans le roman Casino Royale. 007 utilise une mise plate répartie stratégiquement pour couvrir plus des deux tiers de la roulette européenne, incluant une assurance sur le chiffre vert Zéro.',
    rules: [
      'Mise de base divisée en 20 fractions (ex: 20 € total)',
      '70 % de la mise (14 €) sur Passe (numéros 19 à 36)',
      '25 % de la mise (5 €) sur le Sixain 13-18',
      '5 % de la mise (1 €) sur le Zéro 0 en assurance',
      'Si 19-36 sort : gain net de +8 €',
      'Si 13-18 sort : gain net de +10 €',
      'Si 0 sort : gain net de +16 €',
      'Si 1-12 sort : perte de la mise (-20 €)',
    ],
    pros: [
      '67,6 % de chances de gain à chaque lancer de bille',
      'Le Zéro 0 ne fait plus peur : il devient au contraire le meilleur multiplicateur !',
      'Simple à jouer sans calcul mental complexe',
    ],
    cons: [
      'Les numéros 1 à 12 ne sont pas couverts',
      'Une série de numéros bas (1-12) peut entamer rapidement la bankroll sans progression',
    ],
    config: {
      strategyType: 'james_bond',
      initialBankroll: 600,
      baseBet: 20,
      consecutiveTrigger: 1,
      maxSteps: 4,
      betProgression: [20, 40, 80, 160],
      zeroRule: 'loss',
      stopLossBankroll: 0,
    },
  },
};
