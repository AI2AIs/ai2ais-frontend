export const PHONEME_TO_MORPH = {
  'A': { jawOpen: 0.3 },
  'B': { mouthPress_L: 0.4, mouthPress_R: 0.4 },
  'C': { jawOpen: 0.15 },
  'D': { jawOpen: 0.2 },
  'E': { jawOpen: 0.1 },
  'F': { mouthUpperUp_L: 0.3, mouthUpperUp_R: 0.3 },
  'G': { jawOpen: 0.25 },
  'H': { jawOpen: 0.1 },
  'X': {}
};

export const EXPRESSION_TO_MORPHS = {
  'smile': {
    mouthSmile_L: 0.7,
    mouthSmile_R: 0.7,
    cheekSquint_L: 0.3,
    cheekSquint_R: 0.3,
    eyeSquint_L: 0.2,
    eyeSquint_R: 0.2
  },
  'happy': {
    mouthSmile_L: 0.8,
    mouthSmile_R: 0.8,
    cheekSquint_L: 0.4,
    cheekSquint_R: 0.4,
    eyeSquint_L: 0.3,
    eyeSquint_R: 0.3,
    browInnerUp: 0.2
  },
  'sad': {
    mouthFrown_L: 0.6,
    mouthFrown_R: 0.6,
    browDown_L: 0.4,
    browDown_R: 0.4,
    eyeSquint_L: 0.1,
    eyeSquint_R: 0.1
  },
  'angry': {
    browDown_L: 0.7,
    browDown_R: 0.7,
    eyeSquint_L: 0.5,
    eyeSquint_R: 0.5,
    mouthFrown_L: 0.4,
    mouthFrown_R: 0.4,
    noseSneer_L: 0.3,
    noseSneer_R: 0.3
  },
  'surprised': {
    browInnerUp: 0.8,
    browOuterUp_L: 0.7,
    browOuterUp_R: 0.7,
    eyeWide_L: 0.9,
    eyeWide_R: 0.9,
    jawOpen: 0.4
  },
  'neutral': {}
};

export const MOUTH_MORPHS = [
  'jawOpen', 'mouthFunnel', 'mouthClose', 'mouthPress_L', 'mouthPress_R',
  'mouthShrugUpper', 'mouthShrugLower', 'tongueOut', 'mouthUpperUp_L', 'mouthUpperUp_R',
  'mouthLowerDown_L', 'mouthLowerDown_R', 'mouthLeft', 'mouthRight',
  'mouthRollUpper', 'mouthRollLower', 'mouthPucker'
];

export const EXPRESSION_MORPHS = [
  'mouthSmile_L', 'mouthSmile_R', 'mouthFrown_L', 'mouthFrown_R',
  'cheekSquint_L', 'cheekSquint_R', 'eyeSquint_L', 'eyeSquint_R',
  'browInnerUp', 'browDown_L', 'browDown_R', 'browOuterUp_L', 'browOuterUp_R',
  'eyeWide_L', 'eyeWide_R', 'noseSneer_L', 'noseSneer_R'
];