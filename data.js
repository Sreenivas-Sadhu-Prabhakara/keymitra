/* ============================================================
   keymitra — script corpus.

   Each script defines an ITRANS-style scheme:
     vowels      latin -> [independent form, dependent sign (matra)]
     consonants  latin -> base glyph (carries the inherent short 'a')
     specials    latin -> anusvara / visarga / chandrabindu (attach as-is)
     halant      latin -> virama (explicit schwa-killer)
     digits      latin -> localized digit
     virama      the script's virama codepoint (used for clusters)

   Devanagari and Kannada are fully covered and verified against exact
   Unicode. Tamil and Telugu are included and marked beta: they render
   everyday words but Tamil in particular has no glyphs for several
   Sanskrit distinctions (aspirates, some sibilants), which the scheme
   maps to the nearest Tamil letter — honest, but lossy.

   No network. This file only declares data; app.js does the work.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- shared helpers for building grids / word chips ---------- */

  // ============================================================
  //  DEVANAGARI  (verified)
  // ============================================================
  var DEVANAGARI = {
    id: "devanagari",
    name: "Devanagari",
    note: "Hindi · Marathi · Sanskrit",
    status: "stable",
    lang: "hi",
    virama: "्",
    vowels: {
      "a":  ["अ", ""],          // अ
      "aa": ["आ", "ा"],    // आ ा
      "A":  ["आ", "ा"],
      "i":  ["इ", "ि"],    // इ ि
      "ii": ["ई", "ी"],    // ई ी
      "I":  ["ई", "ी"],
      "ee": ["ई", "ी"],
      "u":  ["उ", "ु"],    // उ ु
      "uu": ["ऊ", "ू"],    // ऊ ू
      "U":  ["ऊ", "ू"],
      "oo": ["ऊ", "ू"],
      "R":  ["ऋ", "ृ"],    // ऋ ृ  vocalic r
      "RR": ["ॠ", "ॄ"],    // ॠ ॄ
      "LR": ["ऌ", "ॢ"],    // ऌ ॢ
      "e":  ["ए", "े"],    // ए े
      "E":  ["ए", "े"],
      "ai": ["ऐ", "ै"],    // ऐ ै
      "o":  ["ओ", "ो"],    // ओ ो
      "O":  ["ओ", "ो"],
      "au": ["औ", "ौ"]     // औ ौ
    },
    vowelAliases: { "RRi": "R", "R^i": "R", "L^i": "LR" },
    consonants: {
      "k": "क", "kh": "ख", "g": "ग", "gh": "घ", "~N": "ङ", "N^": "ङ",
      "ch": "च", "Ch": "छ", "chh": "छ", "j": "ज", "jh": "झ", "~n": "ञ", "JN": "ञ",
      "T": "ट", "Th": "ठ", "D": "ड", "Dh": "ढ", "N": "ण",
      "t": "त", "th": "थ", "d": "द", "dh": "ध", "n": "न",
      "p": "प", "ph": "फ", "f": "फ", "b": "ब", "bh": "भ", "m": "म",
      "y": "य", "r": "र", "l": "ल", "v": "व", "w": "व",
      "sh": "श", "Sh": "ष", "S": "ष", "shh": "ष", "s": "स", "h": "ह",
      "L": "ळ", "ksh": "क्ष", "j~n": "ज्ञ", "GY": "ज्ञ"
    },
    specials: {
      "M": "ं", ".n": "ं", ".m": "ं",   // anusvara ं
      "H": "ः",                                   // visarga ः
      ".N": "ँ", "MM": "ँ"                   // chandrabindu ँ
    },
    halant: { ".h": "्", "q": "्" },
    digits: { "0":"०","1":"१","2":"२","3":"३","4":"४","5":"५","6":"६","7":"७","8":"८","9":"९" },
    words: [
      ["namaste","greeting"], ["dhanyavaad","thank you"], ["haan","yes"], ["nahiin","no"],
      ["shukriyaa","thanks"], ["kripayaa","please"], ["swaagat","welcome"], ["bhaarat","India"],
      ["paanii","water"], ["khaanaa","food"], ["dost","friend"], ["prem","love"],
      ["shaanti","peace"], ["kitnaa","how much"]
    ]
  };

  // ============================================================
  //  KANNADA  (verified)
  // ============================================================
  var KANNADA = {
    id: "kannada",
    name: "Kannada",
    note: "ಕನ್ನಡ · Karnataka",
    status: "stable",
    lang: "kn",
    virama: "್",
    vowels: {
      "a":  ["ಅ", ""],          // ಅ
      "aa": ["ಆ", "ಾ"],    // ಆ ಾ
      "A":  ["ಆ", "ಾ"],
      "i":  ["ಇ", "ಿ"],    // ಇ ಿ
      "ii": ["ಈ", "ೀ"],    // ಈ ೀ
      "I":  ["ಈ", "ೀ"],
      "ee": ["ಈ", "ೀ"],
      "u":  ["ಉ", "ು"],    // ಉ ು
      "uu": ["ಊ", "ೂ"],    // ಊ ೂ
      "U":  ["ಊ", "ೂ"],
      "oo": ["ಊ", "ೂ"],
      "R":  ["ಋ", "ೃ"],    // ಋ ೃ
      "RR": ["ೠ", "ೄ"],    // ೠ ೄ
      "e":  ["ಎ", "ೆ"],    // ಎ ೆ  short e
      "E":  ["ಏ", "ೇ"],    // ಏ ೇ  long e
      "ai": ["ಐ", "ೈ"],    // ಐ ೈ
      "o":  ["ಒ", "ೊ"],    // ಒ ೊ  short o
      "O":  ["ಓ", "ೋ"],    // ಓ ೋ  long o
      "au": ["ಔ", "ೌ"]     // ಔ ೌ
    },
    vowelAliases: { "RRi": "R", "R^i": "R" },
    consonants: {
      "k": "ಕ", "kh": "ಖ", "g": "ಗ", "gh": "ಘ", "~N": "ಙ",
      "ch": "ಚ", "Ch": "ಛ", "chh": "ಛ", "j": "ಜ", "jh": "ಝ", "~n": "ಞ",
      "T": "ಟ", "Th": "ಠ", "D": "ಡ", "Dh": "ಢ", "N": "ಣ",
      "t": "ತ", "th": "ಥ", "d": "ದ", "dh": "ಧ", "n": "ನ",
      "p": "ಪ", "ph": "ಫ", "f": "ಫ", "b": "ಬ", "bh": "ಭ", "m": "ಮ",
      "y": "ಯ", "r": "ರ", "l": "ಲ", "v": "ವ", "w": "ವ",
      "sh": "ಶ", "Sh": "ಷ", "S": "ಷ", "shh": "ಷ", "s": "ಸ", "h": "ಹ",
      "L": "ಳ", "ksh": "ಕ್ಷ", "j~n": "ಜ್ಞ", "GY": "ಜ್ಞ"
    },
    specials: {
      "M": "ಂ", ".n": "ಂ", ".m": "ಂ",   // anusvara ಂ
      "H": "ಃ",                                   // visarga ಃ
      ".N": "ಁ", "MM": "ಁ"                   // chandrabindu ಁ
    },
    halant: { ".h": "್", "q": "್" },
    digits: { "0":"೦","1":"೧","2":"೨","3":"೩","4":"೪","5":"೫","6":"೬","7":"೭","8":"೮","9":"೯" },
    words: [
      ["namaskaara","greeting"], ["dhanyavaada","thank you"], ["houdu","yes"], ["illa","no"],
      ["dayaviTTu","please"], ["swaagata","welcome"], ["kannaDa","Kannada"], ["niiru","water"],
      ["uuTa","meal"], ["snehita","friend"], ["preeti","love"], ["shaanti","peace"],
      ["chennaagide","it's good"], ["eshTu","how much"]
    ]
  };

  // ============================================================
  //  TELUGU  (beta — good everyday coverage)
  // ============================================================
  var TELUGU = {
    id: "telugu",
    name: "Telugu",
    note: "తెలుగు · beta",
    status: "beta",
    lang: "te",
    virama: "్",
    vowels: {
      "a":  ["అ", ""],          // అ
      "aa": ["ఆ", "ా"],    // ఆ ా
      "A":  ["ఆ", "ా"],
      "i":  ["ఇ", "ి"],    // ఇ ి
      "ii": ["ఈ", "ీ"],    // ఈ ీ
      "I":  ["ఈ", "ీ"],
      "ee": ["ఈ", "ీ"],
      "u":  ["ఉ", "ు"],    // ఉ ు
      "uu": ["ఊ", "ూ"],    // ఊ ూ
      "U":  ["ఊ", "ూ"],
      "oo": ["ఊ", "ూ"],
      "R":  ["ఋ", "ృ"],    // ఋ ృ
      "RR": ["ౠ", "ౄ"],    // ౠ ౄ
      "e":  ["ఎ", "ె"],    // ఎ ె  short e
      "E":  ["ఏ", "ే"],    // ఏ ే  long e
      "ai": ["ఐ", "ై"],    // ఐ ై
      "o":  ["ఒ", "ొ"],    // ఒ ొ  short o
      "O":  ["ఓ", "ో"],    // ఓ ో  long o
      "au": ["ఔ", "ౌ"]     // ఔ ౌ
    },
    vowelAliases: { "RRi": "R", "R^i": "R" },
    consonants: {
      "k": "క", "kh": "ఖ", "g": "గ", "gh": "ఘ", "~N": "ఙ",
      "ch": "చ", "Ch": "ఛ", "chh": "ఛ", "j": "జ", "jh": "ఝ", "~n": "ఞ",
      "T": "ట", "Th": "ఠ", "D": "డ", "Dh": "ఢ", "N": "ణ",
      "t": "త", "th": "థ", "d": "ద", "dh": "ధ", "n": "న",
      "p": "ప", "ph": "ఫ", "f": "ఫ", "b": "బ", "bh": "భ", "m": "మ",
      "y": "య", "r": "ర", "l": "ల", "v": "వ", "w": "వ",
      "sh": "శ", "Sh": "ష", "S": "ష", "shh": "ష", "s": "స", "h": "హ",
      "L": "ళ", "ksh": "క్ష", "j~n": "జ్ఞ", "GY": "జ్ఞ"
    },
    specials: {
      "M": "ం", ".n": "ం", ".m": "ం",   // anusvara ం
      "H": "ః",                                   // visarga ః
      ".N": "ఁ", "MM": "ఁ"                   // chandrabindu ఁ
    },
    halant: { ".h": "్", "q": "్" },
    digits: { "0":"౦","1":"౧","2":"౨","3":"౩","4":"౪","5":"౫","6":"౬","7":"౭","8":"౮","9":"౯" },
    words: [
      ["namaskaaram","greeting"], ["dhanyavaadamulu","thank you"], ["avunu","yes"], ["kaadu","no"],
      ["dayachEsi","please"], ["swaagatam","welcome"], ["telugu","Telugu"], ["niiLLu","water"],
      ["tindi","food"], ["snEhitudu","friend"], ["prEma","love"], ["shaanti","peace"],
      ["baagundi","it's good"], ["enta","how much"]
    ]
  };

  // ============================================================
  //  TAMIL  (beta — lossy by design; Tamil has no aspirate letters)
  //  Aspirates and several sibilants map to the nearest Tamil glyph.
  // ============================================================
  var TAMIL = {
    id: "tamil",
    name: "Tamil",
    note: "தமிழ் · beta",
    status: "beta",
    lang: "ta",
    virama: "்",
    vowels: {
      "a":  ["அ", ""],          // அ
      "aa": ["ஆ", "ா"],    // ஆ ா
      "A":  ["ஆ", "ா"],
      "i":  ["இ", "ி"],    // இ ி
      "ii": ["ஈ", "ீ"],    // ஈ ீ
      "I":  ["ஈ", "ீ"],
      "ee": ["ஈ", "ீ"],
      "u":  ["உ", "ு"],    // உ ு
      "uu": ["ஊ", "ூ"],    // ஊ ூ
      "U":  ["ஊ", "ூ"],
      "oo": ["ஊ", "ூ"],
      "e":  ["எ", "ெ"],    // எ ெ  short e
      "E":  ["ஏ", "ே"],    // ஏ ே  long e
      "ai": ["ஐ", "ை"],    // ஐ ை
      "o":  ["ஒ", "ொ"],    // ஒ ொ  short o
      "O":  ["ஓ", "ோ"],    // ஓ ோ  long o
      "au": ["ஔ", "ௌ"]     // ஔ ௌ
    },
    vowelAliases: {},
    // Tamil has one letter per place of articulation; aspirates & voiced/
    // voiceless are written the same. We map to the single available glyph.
    consonants: {
      "k": "க", "kh": "க", "g": "க", "gh": "க", "~N": "ங",
      "ch": "ச", "Ch": "ச", "chh": "ச", "j": "ஜ", "jh": "ஜ", "~n": "ஞ",
      "T": "ட", "Th": "ட", "D": "ட", "Dh": "ட", "N": "ண",
      "t": "த", "th": "த", "d": "த", "dh": "த", "n": "ன",
      "p": "ப", "ph": "ப", "f": "ப", "b": "ப", "bh": "ப", "m": "ம",
      "y": "ய", "r": "ர", "R2": "ற", "l": "ல", "L": "ள", "zh": "ழ",
      "v": "வ", "w": "வ",
      "sh": "ஷ", "Sh": "ஷ", "S": "ஷ", "s": "ஸ", "h": "ஹ",
      "j2": "ஜ", "ksh": "க்ஷ"
    },
    specials: {
      "M": "ம்", ".n": "ந்",       // Tamil has no anusvara: nasal shown with m/n + pulli
      "H": "ஃ", ".N": "ம்"              // aytham for visarga-like
    },
    halant: { ".h": "்", "q": "்" },
    digits: { "0":"0","1":"௧","2":"௨","3":"௩","4":"௪","5":"௫","6":"௬","7":"௭","8":"௮","9":"௯" },
    words: [
      ["vaNakkam","greeting"], ["nandri","thank you"], ["aamaam","yes"], ["illai","no"],
      ["tayavuseytu","please"], ["varuka","welcome"], ["tamizh","Tamil"], ["taNNiir","water"],
      ["saappaadu","food"], ["naNpan","friend"], ["anbu","love"], ["amaiti","peace"]
    ]
  };

  // Grid layout: which Latin keys to surface, in reading order, grouped.
  // (Rendered from the active script's own maps so beta scripts stay honest.)
  var GRID = {
    vowelKeys: ["a","aa","i","ii","u","uu","R","e","E","ai","o","O","au"],
    consonantRows: [
      ["k","kh","g","gh","~N"],
      ["ch","Ch","j","jh","~n"],
      ["T","Th","D","Dh","N"],
      ["t","th","d","dh","n"],
      ["p","ph","b","bh","m"],
      ["y","r","l","v","sh","Sh","s","h","L"]
    ]
  };

  window.KEYMITRA_DATA = {
    scripts: [DEVANAGARI, KANNADA, TELUGU, TAMIL],
    grid: GRID
  };
})();
