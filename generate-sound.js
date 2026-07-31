const fs = require('fs');

const sampleRate = 44100;
const duration = 0.2; // very short sound
const numSamples = sampleRate * duration;

const buffer = Buffer.alloc(44 + numSamples * 2);

// WAV Header
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + numSamples * 2, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16); // PCM
buffer.writeUInt16LE(1, 20); // AudioFormat 1
buffer.writeUInt16LE(1, 22); // NumChannels 1
buffer.writeUInt32LE(sampleRate, 24); // SampleRate
buffer.writeUInt32LE(sampleRate * 2, 28); // ByteRate
buffer.writeUInt16LE(2, 32); // BlockAlign
buffer.writeUInt16LE(16, 34); // BitsPerSample
buffer.write('data', 36);
buffer.writeUInt32LE(numSamples * 2, 40);

// Generate PCM data (Single Water drop synthesis)
let phase = 0;
for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate;
  
  // Envelope: Fast attack, medium decay
  const envelope = Math.exp(-t * 25);
  
  // Frequency sweeps up exponentially for a water drop effect
  // Starts around 300Hz, sweeps up to ~1500Hz
  const freq = 300 + (1200 * (1 - Math.exp(-t * 30)));
  
  // Accumulate phase
  phase += 2 * Math.PI * freq / sampleRate;
  
  // Pure sine wave for the water drop
  let sample = Math.sin(phase) * envelope * 0.8;
  
  // Soft clipping
  if (sample > 1) sample = 1;
  if (sample < -1) sample = -1;
  
  // Convert to 16-bit PCM (-32768 to 32767)
  let val = Math.floor(sample * 32767);
  if (val > 32767) val = 32767;
  if (val < -32768) val = -32768;
  
  buffer.writeInt16LE(val, 44 + i * 2);
}

fs.writeFileSync('public/sounds/mention.wav', buffer);
console.log('Single water drop sound generated!');
