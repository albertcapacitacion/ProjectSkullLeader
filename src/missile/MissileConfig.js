export const missileSwarmDefaults = {
  damage: 12,
  missileCount: 32, launchInterval: 0.045, launchConeAngle: 0.72, initialSpeed: 13, maxSpeed: 46, acceleration: 30, terminalSpeedMultiplier: 1.08, lifetime: 6.5, proximityFuseRadius: 1.7,
  spreadStrength: 1.9, spreadDuration: 0.42, spreadFalloff: 1.4, spreadVariation: 0.35,
  curlStrength: 2.8, curlFrequency: 0.85, curlStart: 0.16, curlPeak: 0.48, curlEnd: 0.82, curlAxisVariation: 0.8, curlAxisDrift: 0.22, clockwiseRatio: 0.5, curlStrengthVariation: 0.35, curlFrequencyVariation: 0.28, curlPhaseVariation: 6.28,
  homingStrength: 2.4, homingDelay: 0.28, homingRampDuration: 0.48, maxTurnRate: 0.95, terminalTurnRate: 3.8, terminalTurnRamp: 0.35,
  noiseStrength: 0.16, noiseFrequency: 1.4, speedVariation: 0.16, turnRateVariation: 0.22, timingVariation: 0.18,
  trailEnabled: true, trailMode: "LINE", trailPointCount: 64, trailSampleInterval: 0.025, trailLifetime: 1.8, trailOpacity: 0.72, trailWidth: 1, trailFade: 1, trailQuality: 1,
  targetMovementMode: "CURRENT BOT", targetSpeed: 8, targetMovementRadius: 16,
  missileScale: 1, showMissiles: true, showTarget: true, showLauncher: true,
  showVelocityVectors: false, showDesiredDirection: false, showTargetVector: false, showSpreadVector: false, showCurlVector: false, showFinalSteeringVector: false, showLaunchCone: false, showTrailPoints: false,
  maxActiveMissiles: 128, pixelRatioCap: 1.6, explosionQuality: 1,
  phaseLaunch: 1, phaseSpread: 1, phaseCurl: 1, phaseHoming: 1
};

export const missileSwarmPresets = {
  "ANIME BLOOM": { ...missileSwarmDefaults, missileCount: 48, curlStrength: 3.5, curlFrequency: 0.7, homingDelay: 0.42, spreadStrength: 2.4, maxTurnRate: 0.72 },
  "DOUBLE SPIRAL": { ...missileSwarmDefaults, missileCount: 48, clockwiseRatio: 0.5, curlStrength: 3.1, curlFrequency: 0.95, curlAxisVariation: 0.5, homingDelay: 0.34 },
  ENCIRCLEMENT: { ...missileSwarmDefaults, missileCount: 64, spreadStrength: 2.8, curlStrength: 3.3, homingDelay: 0.58, maxTurnRate: 0.65, terminalTurnRate: 4.5 },
  "TIGHT HOMING": { ...missileSwarmDefaults, missileCount: 24, spreadStrength: 1.1, curlStrength: 1.5, homingDelay: 0.1, maxTurnRate: 1.4, terminalTurnRate: 5.2 },
  "CHAOTIC ANIME": { ...missileSwarmDefaults, missileCount: 56, spreadStrength: 2.2, spreadVariation: 0.65, curlStrengthVariation: 0.6, curlFrequencyVariation: 0.5, timingVariation: 0.45, noiseStrength: 0.23 }
};
