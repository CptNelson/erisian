//========SOUND EFFECTS, OSCILLATORS AND MIXERS========

const limiter = new Tone.Limiter(-3);
const reverb = new Tone.Freeverb(0.4);
const feedbackDelay = new Tone.FeedbackDelay("8n", 0.5);
const chorus = new Tone.Chorus(2, 0.5, 1.5);
const distortion = new Tone.Distortion(0.3);
const eq = new Tone.EQ3(-2, -1, -2);
const synthMix = new Tone.Gain({ gain: 1, convert: true });
const synth = new Tone.PolySynth(10, Tone.Synth).toMaster();
const masterCompressor = new Tone.Compressor({
  threshold: -6,
  ratio: 3,
  attack: 0.5,
  release: 0.1,
});

const waveforms = ["sine", "square", "triangle"];

let noteTime = "16n";
let tempo = 140;
let msTempo = 60000 / tempo;

//========NOTES&CHORDS=======================================

let synthNotes = [
  "B3",
  "C4",
  "D4",
  "E4",
  "F4",
  "G4",
  "A4",
  "B4",
  "C5",
].reverse();

//========SEQUENCER GRIDS==============================

synthSequencer = new Nexus.Sequencer("#synthgrid", {
  size: [800, 200],
  columns: 16,
  rows: 8,
  notesumns: 16,
});

synthSequencer.interval.rate = msTempo;

//========LOOP==========================================

let sequenceLoop = new Tone.Part(
  function (time, note) {
    //this loops the synth, notes are added from the matrix
    synth.triggerAttackRelease(note, noteTime);
  },
  [
    [0, []],
    ["0:1", []],
    ["0:2", []],
    ["0:3", []],
    ["0:4", []],
    ["1:1", []],
    ["1:2", []],
    ["1:3", []],
    ["1:4", []],
    ["2:1", []],
    ["2:2", []],
    ["2:3", []],
    ["2:4", []],
    ["3:1", []],
    ["3:2", []],
    ["3:3", []],
  ],
);

sequenceLoop.loop = true;
sequenceLoop.loopEnd = "3:4";
sequenceLoop.humanize = true;

//========CONTROL BUTTONS===============================

let powerButton = new Nexus.Toggle("#power", {
  size: [60, 30],
  state: false,
});

let bpmControl = new Nexus.Number("#bpmcontrol", {
  size: [60, 40],
  min: 23,
  max: 666,
  value: 140,
});

let waveButton = new Nexus.Button("#wavebutton", {
  size: [30, 20],
  mode: "button",
  state: false,
});

//========CONTROLS=======================================

let playing = false;

Tone.Transport.bpm.value = tempo;

powerButton.on("change", function (v) {
  if (!playing) {
    playing = true;
    sequenceLoop.start();
    synthSequencer.start();
    Tone.Transport.start("+0.0");
  } else {
    playing = false;
    synthSequencer.stop();
    Tone.Transport.stop();
  }
});

waveButton.on("change", function (v) {
  for (let i = 0, l = synth.voices.length; i < l; i++) {
    if (synth.voices[i].oscillator.type == waveforms[0]) {
      synth.voices[i].oscillator.type = waveforms[1];
    } else if (synth.voices[i].oscillator.type == waveforms[1]) {
      synth.voices[i].oscillator.type = waveforms[2];
    } else synth.voices[i].oscillator.type = waveforms[0];
  }
});

bpmControl.on("change", function (v) {
  tempo = bpmControl.value;
  Tone.Transport.bpm.value = tempo;
  synthSequencer.interval.rate = 60000 / bpmControl.value;
  console.log(bpmControl.value);
});

window.addEventListener("keypress", function (event) {
  if (event.keyCode == "32") {
    powerButton.state = !powerButton.state;
  }
});

//========Random Functions=========================

const percentageCalculator = (note, amount, notes, noteIndex) => {
  note.weight += amount;

  let percentages = amount / notes.length;
  //console.log("%: " + percentages);

  for (let i = 0; i < notes.length; i++) {
    if (i != noteIndex) notes[i].weight += percentages;
  }
};

const getRandom = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

let WeightedRandomBag = function () {
  this.entries = [];
  this.accumulatedWeight = 0.0;

  this.addEntry = function (object, weight) {
    this.accumulatedWeight += weight;
    this.entries.push({
      object: object,
      accumulatedWeight: this.accumulatedWeight,
    });
  };

  this.getRandom = () => {
    let r = Math.random() * this.accumulatedWeight;
    return this.entries.find(function (entry) {
      return entry.accumulatedWeight >= r;
    }).object;
  };
};

let notesWeight = [
  { note: 0, weight: 1 },
  { note: 1, weight: 3 },
  { note: 2, weight: 6 },
  { note: 3, weight: 2 },
  { note: 4, weight: 5 },
  { note: 5, weight: 2 },
  { note: 6, weight: 4 },
  { note: 7, weight: 2 },
  { note: 8, weight: 3 },
  //  { note: 9, weight: 5 },
];

/*for (let i = 0; i < notesWeight.length; i++) {
  let random = getRandom(-5, 5);
  if ((notesWeight[i].weight += random < 1)) random = 1;
  //percentageCalculator(notesWeight[i], random, notesWeight, i);
  notesWeight[i].weight += random;

  // bag.addEntry(notesWeight[i], notesWeight[i].weight);
} */

const randomizeMelody = () => {
  let notes = [notesWeight[7].note];
  let lastNote = notesWeight[1].note;
  console.log(notes[0]);

  for (let i = 1; i < 16; i++) {
    let bag = new WeightedRandomBag();
    let notesWeightCopy = [...notesWeight];

    console.log(lastNote);
    if (i > 0 && i < 16) {
      lastNote = notes[i - 1];
      if (lastNote > 0 && lastNote < 8) {
        notesWeightCopy[lastNote + 1].weight += 55;
        notesWeightCopy[lastNote - 1].weight += 55;
      }
      if (lastNote > 1 && lastNote < 7) {
        notesWeightCopy[lastNote + 2].weight += 45;
        notesWeightCopy[lastNote - 1].weight += 45;
      }
    }
    notesWeightCopy[lastNote].weight += -60;

    for (let i = 0; i < notesWeight.length; i++) {
      bag.addEntry(notesWeight[i], notesWeight[i].weight);
    }

    let note = bag.getRandom();
    console.log("n: " + note.note + " l: " + lastNote);

    notes[i] = note.note;
  }

  populateMatrixWithSequence(notes);
};

const populateMatrixWithSequence = (notes) => {
  synthSequencer.matrix.populate.all(0);
  for (let i = 0; i < notes.length; i++) {
    if (notes[i] > 0) {
      //console.log("1: " + i + " 2: " + notes[i]);
      synthSequencer.matrix.toggle.cell(i, notes[i] - 1);
    }
  }
};

//========MATRIX FUNCTIONS=========================================
//these functions add and delete notes from the Tone.Parts that are playing.

synthSequencer.on("change", function (v) {
  modifySequence(v);
});

const modifySequence = (v) => {
  if (v.state) {
    //if note was off, add note to the right column
    sequenceLoop._events[v.column].value.push(synthNotes[v.row]);
    //console.log("asd");
  } else {
    //if note was on, find the right ArrayIndex and delete it from right column
    let index = sequenceLoop._events[v.column].value.indexOf(synthNotes[v.row]);
    if (index > -1) {
      sequenceLoop._events[v.column].value.splice(index, 1);
    }
  }
};

let stepCount = 0;

synthSequencer.on("step", (v) => {
  stepCount++;
  if (stepCount == 1) {
    randomizeMelody();
    //   console.log(sequenceLoop);
  }
  if (stepCount >= synthSequencer.columns) {
    console.log("start");
    stepCount = 0;
  }
});
//========Setting Selector  =======================

function changeWave(x) {
  for (let i = 0, l = synth.voices.length; i < l; i++) {
    synth.voices[i].oscillator.type = x;
  }
}

function changeAttack(x) {
  for (let i = 0, l = synth.voices.length; i < l; i++) {
    synth.voices[i].envelope.attack = x;
  }
}

function changeDecay(x) {
  for (let i = 0, l = synth.voices.length; i < l; i++) {
    synth.voices[i].envelope.decay = x;
  }
}

function changeSustain(x) {
  for (let i = 0, l = synth.voices.length; i < l; i++) {
    synth.voices[i].envelope.sustain = x;
  }
}

function changeRelease(x) {
  for (let i = 0, l = synth.voices.length; i < l; i++) {
    synth.voices[i].envelope.release = x;
  }
}

let waveform = ["sine", "square", "triangle"];

// preset 1
function preset1() {
  changeWave(waveform[2]);
  synthMix.gain.value = 0.2;
  chorus.wet = 0.4;
  synth.chain(
    synthMix,
    //eq,
    //chorus,
    // feedbackDelay,
    // reverb,
    //limiter,
    Tone.Master,
  );
  changeAttack(0.02);
  changeDecay(0.3);
  changeSustain(0.2);
  changeRelease(2);
  feedbackDelay.wet.value = 0.05;
  feedbackDelay.feedback.value = 0.1;
  reverb.wet.value = 0.3;
  reverb.roomSize.value = 0.4;
}

function preset2() {
  changeWave(waveform[1]);
  synthMix.gain.value = 0.05;
  chorus.wet = 0;
  synth.chain(
    synthMix,
    distortion,
    eq,
    chorus,
    feedbackDelay,
    reverb,
    limiter,
    Tone.Master,
  );
  changeAttack(0.3);
  changeDecay(0.3);
  changeSustain(0.1);
  changeRelease(0.1);
  feedbackDelay.wet.value = 0.2;
  feedbackDelay.feedback.value = 0.2;
  reverb.wet.value = 0.1;
  reverb.roomSize.value = 0.4;
}

document.onload = preset1();
document.onload = Tone.Master.volume.value = -22;
document.onload = Tone.Master.chain(masterCompressor);
document.onload = Tone.Transport.stop();
