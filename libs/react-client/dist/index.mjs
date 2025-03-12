import { atom, selector, DefaultValue, useRecoilValue, useResetRecoilState, useSetRecoilState, useRecoilState } from 'recoil';
import { isEqual, debounce } from 'lodash';
import { v4 } from 'uuid';
import { createContext, useContext, useMemo, useCallback, useEffect } from 'react';
import xt, { SWRConfig } from 'swr';
import Ut from 'socket.io-client';
export { Socket } from 'socket.io-client';

var Be=o=>{let e={},t=new Date,s=new Date;s.setDate(t.getDate()-1);let n=new Date;n.setDate(t.getDate()-7);let r=new Date;return r.setDate(t.getDate()-30),o.forEach(i=>{let a=new Date(i.createdAt),l=a.toDateString()===t.toDateString(),h=a.toDateString()===s.toDateString(),u=a>=n,d=a>=r,p;l?p="Today":h?p="Yesterday":u?p="Previous 7 days":d?p="Previous 30 days":p=a.toLocaleString("default",{month:"long",year:"numeric"}).split(" ").slice(0,1).join(" "),e[p]||(e[p]=[]),e[p].push(i);}),e};var qe=[4186.01,4434.92,4698.63,4978.03,5274.04,5587.65,5919.91,6271.93,6644.88,7040,7458.62,7902.13],ht=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"],D=[],ae=[];for(let o=1;o<=8;o++)for(let e=0;e<qe.length;e++){let t=qe[e];D.push(t/Math.pow(2,8-o)),ae.push(ht[e]+o);}var ie=[32,2e3],ve=D.filter((o,e)=>D[e]>ie[0]&&D[e]<ie[1]),Ve=ae.filter((o,e)=>D[e]>ie[0]&&D[e]<ie[1]);var _=class o{static getFrequencies(e,t,s,n="frequency",r=-100,i=-30){s||(s=new Float32Array(e.frequencyBinCount),e.getFloatFrequencyData(s));let a=t/2,l=1/s.length*a,h,u,d;if(n==="music"||n==="voice"){let g=n==="voice"?ve:D,y=Array(g.length).fill(r);for(let M=0;M<s.length;M++){let Q=M*l,X=s[M];for(let x=g.length-1;x>=0;x--)if(Q>g[x]){y[x]=Math.max(y[x],X);break}}h=y,u=n==="voice"?ve:D,d=n==="voice"?Ve:ae;}else h=Array.from(s),u=h.map((g,y)=>l*y),d=u.map(g=>`${g.toFixed(2)} Hz`);let p=h.map(g=>Math.max(0,Math.min((g-r)/(i-r),1)));return {values:new Float32Array(p),frequencies:u,labels:d}}constructor(e,t=null){if(this.fftResults=[],t){let{length:s,sampleRate:n}=t,r=new OfflineAudioContext({length:s,sampleRate:n}),i=r.createBufferSource();i.buffer=t;let a=r.createAnalyser();a.fftSize=8192,a.smoothingTimeConstant=.1,i.connect(a);let l=1/60,h=s/n,u=d=>{let p=l*d;p<h&&r.suspend(p).then(()=>{let S=new Float32Array(a.frequencyBinCount);a.getFloatFrequencyData(S),this.fftResults.push(S),u(d+1);}),d===1?r.startRendering():r.resume();};i.start(0),u(1),this.audio=e,this.context=r,this.analyser=a,this.sampleRate=n,this.audioBuffer=t;}else {let s=new AudioContext,n=s.createMediaElementSource(e),r=s.createAnalyser();r.fftSize=8192,r.smoothingTimeConstant=.1,n.connect(r),r.connect(s.destination),this.audio=e,this.context=s,this.analyser=r,this.sampleRate=this.context.sampleRate,this.audioBuffer=null;}}getFrequencies(e="frequency",t=-100,s=-30){let n=null;if(this.audioBuffer&&this.fftResults.length){let r=this.audio.currentTime/this.audio.duration,i=Math.min(r*this.fftResults.length|0,this.fftResults.length-1);n=this.fftResults[i];}return o.getFrequencies(this.analyser,this.sampleRate,n,e,t,s)}async resumeIfSuspended(){return this.context.state==="suspended"&&await this.context.resume(),true}};globalThis.AudioAnalysis=_;var C=class{static floatTo16BitPCM(e){let t=new ArrayBuffer(e.length*2),s=new DataView(t),n=0;for(let r=0;r<e.length;r++,n+=2){let i=Math.max(-1,Math.min(1,e[r]));s.setInt16(n,i<0?i*32768:i*32767,true);}return t}static mergeBuffers(e,t){let s=new Uint8Array(e.byteLength+t.byteLength);return s.set(new Uint8Array(e),0),s.set(new Uint8Array(t),e.byteLength),s.buffer}_packData(e,t){return [new Uint8Array([t,t>>8]),new Uint8Array([t,t>>8,t>>16,t>>24])][e]}pack(e,t){if(t?.bitsPerSample)if(t?.channels){if(!t?.data)throw new Error('Missing "data"')}else throw new Error('Missing "channels"');else throw new Error('Missing "bitsPerSample"');let{bitsPerSample:s,channels:n,data:r}=t,i=["RIFF",this._packData(1,52),"WAVE","fmt ",this._packData(1,16),this._packData(0,1),this._packData(0,n.length),this._packData(1,e),this._packData(1,e*n.length*s/8),this._packData(0,n.length*s/8),this._packData(0,s),"data",this._packData(1,n[0].length*n.length*s/8),r],a=new Blob(i,{type:"audio/mpeg"}),l=URL.createObjectURL(a);return {blob:a,url:l,channelCount:n.length,sampleRate:e,duration:r.byteLength/(n.length*e*2)}}};globalThis.WavPacker=C;var dt=`
class AudioProcessor extends AudioWorkletProcessor {

  constructor() {
    super();
    this.port.onmessage = this.receive.bind(this);
    this.initialize();
  }

  initialize() {
    this.foundAudio = false;
    this.recording = false;
    this.chunks = [];
  }

  /**
   * Concatenates sampled chunks into channels
   * Format is chunk[Left[], Right[]]
   */
  readChannelData(chunks, channel = -1, maxChannels = 9) {
    let channelLimit;
    if (channel !== -1) {
      if (chunks[0] && chunks[0].length - 1 < channel) {
        throw new Error(
          \`Channel \${channel} out of range: max \${chunks[0].length}\`
        );
      }
      channelLimit = channel + 1;
    } else {
      channel = 0;
      channelLimit = Math.min(chunks[0] ? chunks[0].length : 1, maxChannels);
    }
    const channels = [];
    for (let n = channel; n < channelLimit; n++) {
      const length = chunks.reduce((sum, chunk) => {
        return sum + chunk[n].length;
      }, 0);
      const buffers = chunks.map((chunk) => chunk[n]);
      const result = new Float32Array(length);
      let offset = 0;
      for (let i = 0; i < buffers.length; i++) {
        result.set(buffers[i], offset);
        offset += buffers[i].length;
      }
      channels[n] = result;
    }
    return channels;
  }

  /**
   * Combines parallel audio data into correct format,
   * channels[Left[], Right[]] to float32Array[LRLRLRLR...]
   */
  formatAudioData(channels) {
    if (channels.length === 1) {
      // Simple case is only one channel
      const float32Array = channels[0].slice();
      const meanValues = channels[0].slice();
      return { float32Array, meanValues };
    } else {
      const float32Array = new Float32Array(
        channels[0].length * channels.length
      );
      const meanValues = new Float32Array(channels[0].length);
      for (let i = 0; i < channels[0].length; i++) {
        const offset = i * channels.length;
        let meanValue = 0;
        for (let n = 0; n < channels.length; n++) {
          float32Array[offset + n] = channels[n][i];
          meanValue += channels[n][i];
        }
        meanValues[i] = meanValue / channels.length;
      }
      return { float32Array, meanValues };
    }
  }

  /**
   * Converts 32-bit float data to 16-bit integers
   */
  floatTo16BitPCM(float32Array) {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    let offset = 0;
    for (let i = 0; i < float32Array.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return buffer;
  }

  /**
   * Retrieves the most recent amplitude values from the audio stream
   * @param {number} channel
   */
  getValues(channel = -1) {
    const channels = this.readChannelData(this.chunks, channel);
    const { meanValues } = this.formatAudioData(channels);
    return { meanValues, channels };
  }

  /**
   * Exports chunks as an audio/wav file
   */
  export() {
    const channels = this.readChannelData(this.chunks);
    const { float32Array, meanValues } = this.formatAudioData(channels);
    const audioData = this.floatTo16BitPCM(float32Array);
    return {
      meanValues: meanValues,
      audio: {
        bitsPerSample: 16,
        channels: channels,
        data: audioData,
      },
    };
  }

  receive(e) {
    const { event, id } = e.data;
    let receiptData = {};
    switch (event) {
      case 'start':
        this.recording = true;
        break;
      case 'stop':
        this.recording = false;
        break;
      case 'clear':
        this.initialize();
        break;
      case 'export':
        receiptData = this.export();
        break;
      case 'read':
        receiptData = this.getValues();
        break;
      default:
        break;
    }
    // Always send back receipt
    this.port.postMessage({ event: 'receipt', id, data: receiptData });
  }

  sendChunk(chunk) {
    const channels = this.readChannelData([chunk]);
    const { float32Array, meanValues } = this.formatAudioData(channels);
    const rawAudioData = this.floatTo16BitPCM(float32Array);
    const monoAudioData = this.floatTo16BitPCM(meanValues);
    this.port.postMessage({
      event: 'chunk',
      data: {
        mono: monoAudioData,
        raw: rawAudioData,
      },
    });
  }

  process(inputList, outputList, parameters) {
    // Copy input to output (e.g. speakers)
    // Note that this creates choppy sounds with Mac products
    const sourceLimit = Math.min(inputList.length, outputList.length);
    for (let inputNum = 0; inputNum < sourceLimit; inputNum++) {
      const input = inputList[inputNum];
      const output = outputList[inputNum];
      const channelCount = Math.min(input.length, output.length);
      for (let channelNum = 0; channelNum < channelCount; channelNum++) {
        input[channelNum].forEach((sample, i) => {
          output[channelNum][i] = sample;
        });
      }
    }
    const inputs = inputList[0];
    // There's latency at the beginning of a stream before recording starts
    // Make sure we actually receive audio data before we start storing chunks
    let sliceIndex = 0;
    if (!this.foundAudio) {
      for (const channel of inputs) {
        sliceIndex = 0; // reset for each channel
        if (this.foundAudio) {
          break;
        }
        if (channel) {
          for (const value of channel) {
            if (value !== 0) {
              // find only one non-zero entry in any channel
              this.foundAudio = true;
              break;
            } else {
              sliceIndex++;
            }
          }
        }
      }
    }
    if (inputs && inputs[0] && this.foundAudio && this.recording) {
      // We need to copy the TypedArray, because the \`process\`
      // internals will reuse the same buffer to hold each input
      const chunk = inputs.map((input) => input.slice(sliceIndex));
      this.chunks.push(chunk);
      this.sendChunk(chunk);
    }
    return true;
  }
}

registerProcessor('audio_processor', AudioProcessor);
`,pt=new Blob([dt],{type:"application/javascript"}),mt=URL.createObjectURL(pt),Oe=mt;var B=class{constructor({sampleRate:e=24e3,outputToSpeakers:t=false,debug:s=false}={}){this.scriptSrc=Oe,this.sampleRate=e,this.outputToSpeakers=t,this.debug=!!s,this._deviceChangeCallback=null,this._devices=[],this.stream=null,this.processor=null,this.source=null,this.node=null,this.recording=false,this._lastEventId=0,this.eventReceipts={},this.eventTimeout=5e3,this._chunkProcessor=()=>{},this._chunkProcessorSize=undefined,this._chunkProcessorBuffer={raw:new ArrayBuffer(0),mono:new ArrayBuffer(0)};}static async decode(e,t=24e3,s=-1){let n=new AudioContext({sampleRate:t}),r,i;if(e instanceof Blob){if(s!==-1)throw new Error('Can not specify "fromSampleRate" when reading from Blob');i=e,r=await i.arrayBuffer();}else if(e instanceof ArrayBuffer){if(s!==-1)throw new Error('Can not specify "fromSampleRate" when reading from ArrayBuffer');r=e,i=new Blob([r],{type:"audio/wav"});}else {let u,d;if(e instanceof Int16Array){d=e,u=new Float32Array(e.length);for(let y=0;y<e.length;y++)u[y]=e[y]/32768;}else if(e instanceof Float32Array)u=e;else if(e instanceof Array)u=new Float32Array(e);else throw new Error('"audioData" must be one of: Blob, Float32Arrray, Int16Array, ArrayBuffer, Array<number>');if(s===-1)throw new Error('Must specify "fromSampleRate" when reading from Float32Array, In16Array or Array');if(s<3e3)throw new Error('Minimum "fromSampleRate" is 3000 (3kHz)');d||(d=C.floatTo16BitPCM(u));let p={bitsPerSample:16,channels:[u],data:d};i=new C().pack(s,p).blob,r=await i.arrayBuffer();}let a=await n.decodeAudioData(r),l=a.getChannelData(0),h=URL.createObjectURL(i);return {blob:i,url:h,values:l,audioBuffer:a}}log(){return this.debug&&this.log(...arguments),true}getSampleRate(){return this.sampleRate}getStatus(){return this.processor?this.recording?"recording":"paused":"ended"}async _event(e,t={},s=null){if(s=s||this.processor,!s)throw new Error("Can not send events without recording first");let n={event:e,id:this._lastEventId++,data:t};s.port.postMessage(n);let r=new Date().valueOf();for(;!this.eventReceipts[n.id];){if(new Date().valueOf()-r>this.eventTimeout)throw new Error(`Timeout waiting for "${e}" event`);await new Promise(a=>setTimeout(()=>a(true),1));}let i=this.eventReceipts[n.id];return delete this.eventReceipts[n.id],i}listenForDeviceChange(e){if(e===null&&this._deviceChangeCallback)navigator.mediaDevices.removeEventListener("devicechange",this._deviceChangeCallback),this._deviceChangeCallback=null;else if(e!==null){let t=0,s=[],n=i=>i.map(a=>a.deviceId).sort().join(","),r=async()=>{let i=++t,a=await this.listDevices();i===t&&n(s)!==n(a)&&(s=a,e(a.slice()));};navigator.mediaDevices.addEventListener("devicechange",r),r(),this._deviceChangeCallback=r;}return  true}async requestPermission(){let e=await navigator.permissions.query({name:"microphone"});if(e.state==="denied")window.alert("You must grant microphone access to use this feature.");else if(e.state==="prompt")try{(await navigator.mediaDevices.getUserMedia({audio:!0})).getTracks().forEach(n=>n.stop());}catch{window.alert("You must grant microphone access to use this feature.");}return  true}async listDevices(){if(!navigator.mediaDevices||!("enumerateDevices"in navigator.mediaDevices))throw new Error("Could not request user devices");await this.requestPermission();let t=(await navigator.mediaDevices.enumerateDevices()).filter(r=>r.kind==="audioinput"),s=t.findIndex(r=>r.deviceId==="default"),n=[];if(s!==-1){let r=t.splice(s,1)[0],i=t.findIndex(a=>a.groupId===r.groupId);i!==-1&&(r=t.splice(i,1)[0]),r.default=true,n.push(r);}return n.concat(t)}async begin(e){if(this.processor)throw new Error("Already connected: please call .end() to start a new session");if(!navigator.mediaDevices||!("getUserMedia"in navigator.mediaDevices))throw new Error("Could not request user media");try{let a={audio:!0};e&&(a.audio={deviceId:{exact:e}}),this.stream=await navigator.mediaDevices.getUserMedia(a);}catch{throw new Error("Could not start media stream")}let t=new AudioContext({sampleRate:this.sampleRate}),s=t.createMediaStreamSource(this.stream);try{await t.audioWorklet.addModule(this.scriptSrc);}catch(a){throw console.error(a),new Error(`Could not add audioWorklet module: ${this.scriptSrc}`)}let n=new AudioWorkletNode(t,"audio_processor");n.port.onmessage=a=>{let{event:l,id:h,data:u}=a.data;if(l==="receipt")this.eventReceipts[h]=u;else if(l==="chunk")if(this._chunkProcessorSize){let d=this._chunkProcessorBuffer;this._chunkProcessorBuffer={raw:C.mergeBuffers(d.raw,u.raw),mono:C.mergeBuffers(d.mono,u.mono)},this._chunkProcessorBuffer.mono.byteLength>=this._chunkProcessorSize&&(this._chunkProcessor(this._chunkProcessorBuffer),this._chunkProcessorBuffer={raw:new ArrayBuffer(0),mono:new ArrayBuffer(0)});}else this._chunkProcessor(u);};let r=s.connect(n),i=t.createAnalyser();return i.fftSize=8192,i.smoothingTimeConstant=.1,r.connect(i),this.outputToSpeakers&&(console.warn(`Warning: Output to speakers may affect sound quality,
especially due to system audio feedback preventative measures.
use only for debugging`),i.connect(t.destination)),this.source=s,this.node=r,this.analyser=i,this.processor=n,true}getFrequencies(e="frequency",t=-100,s=-30){if(!this.processor)throw new Error("Session ended: please call .begin() first");return _.getFrequencies(this.analyser,this.sampleRate,null,e,t,s)}async pause(){if(this.processor){if(!this.recording)throw new Error("Already paused: please call .record() first")}else throw new Error("Session ended: please call .begin() first");return this._chunkProcessorBuffer.raw.byteLength&&this._chunkProcessor(this._chunkProcessorBuffer),this.log("Pausing ..."),await this._event("stop"),this.recording=false,true}async record(e=()=>{},t=8192){if(this.processor){if(this.recording)throw new Error("Already recording: please call .pause() first");if(typeof e!="function")throw new Error("chunkProcessor must be a function")}else throw new Error("Session ended: please call .begin() first");return this._chunkProcessor=e,this._chunkProcessorSize=t,this._chunkProcessorBuffer={raw:new ArrayBuffer(0),mono:new ArrayBuffer(0)},this.log("Recording ..."),await this._event("start"),this.recording=true,true}async clear(){if(!this.processor)throw new Error("Session ended: please call .begin() first");return await this._event("clear"),true}async read(){if(!this.processor)throw new Error("Session ended: please call .begin() first");return this.log("Reading ..."),await this._event("read")}async save(e=false){if(!this.processor)throw new Error("Session ended: please call .begin() first");if(!e&&this.recording)throw new Error("Currently recording: please call .pause() first, or call .save(true) to force");this.log("Exporting ...");let t=await this._event("export");return new C().pack(this.sampleRate,t.audio)}async end(){if(!this.processor)throw new Error("Session ended: please call .begin() first");let e=this.processor;this.log("Stopping ..."),await this._event("stop"),this.recording=false,this.stream.getTracks().forEach(i=>i.stop()),this.log("Exporting ...");let s=await this._event("export",{},e);return this.processor.disconnect(),this.source.disconnect(),this.node.disconnect(),this.analyser.disconnect(),this.stream=null,this.processor=null,this.source=null,this.node=null,new C().pack(this.sampleRate,s.audio)}async quit(){return this.listenForDeviceChange(null),this.processor&&await this.end(),true}};globalThis.WavRecorder=B;var gt=`
class StreamProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.hasStarted = false;
    this.hasInterrupted = false;
    this.outputBuffers = [];
    this.bufferLength = 128;
    this.write = { buffer: new Float32Array(this.bufferLength), trackId: null };
    this.writeOffset = 0;
    this.trackSampleOffsets = {};
    this.port.onmessage = (event) => {
      if (event.data) {
        const payload = event.data;
        if (payload.event === 'write') {
          const int16Array = payload.buffer;
          const float32Array = new Float32Array(int16Array.length);
          for (let i = 0; i < int16Array.length; i++) {
            float32Array[i] = int16Array[i] / 0x8000; // Convert Int16 to Float32
          }
          this.writeData(float32Array, payload.trackId);
        } else if (
          payload.event === 'offset' ||
          payload.event === 'interrupt'
        ) {
          const requestId = payload.requestId;
          const trackId = this.write.trackId;
          const offset = this.trackSampleOffsets[trackId] || 0;
          this.port.postMessage({
            event: 'offset',
            requestId,
            trackId,
            offset,
          });
          if (payload.event === 'interrupt') {
            this.hasInterrupted = true;
          }
        } else {
          throw new Error(\`Unhandled event "\${payload.event}"\`);
        }
      }
    };
  }

  writeData(float32Array, trackId = null) {
    let { buffer } = this.write;
    let offset = this.writeOffset;
    for (let i = 0; i < float32Array.length; i++) {
      buffer[offset++] = float32Array[i];
      if (offset >= buffer.length) {
        this.outputBuffers.push(this.write);
        this.write = { buffer: new Float32Array(this.bufferLength), trackId };
        buffer = this.write.buffer;
        offset = 0;
      }
    }
    this.writeOffset = offset;
    return true;
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const outputChannelData = output[0];
    const outputBuffers = this.outputBuffers;
    if (this.hasInterrupted) {
      this.port.postMessage({ event: 'stop' });
      return false;
    } else if (outputBuffers.length) {
      this.hasStarted = true;
      const { buffer, trackId } = outputBuffers.shift();
      for (let i = 0; i < outputChannelData.length; i++) {
        outputChannelData[i] = buffer[i] || 0;
      }
      if (trackId) {
        this.trackSampleOffsets[trackId] =
          this.trackSampleOffsets[trackId] || 0;
        this.trackSampleOffsets[trackId] += buffer.length;
      }
      return true;
    } else if (this.hasStarted) {
      this.port.postMessage({ event: 'stop' });
      return false;
    } else {
      return true;
    }
  }
}

registerProcessor('stream_processor', StreamProcessor);
`,yt=new Blob([gt],{type:"application/javascript"}),St=URL.createObjectURL(yt),je=St;var q=class{constructor({sampleRate:e=24e3,onStop:t}={}){this.scriptSrc=je,this.onStop=t,this.sampleRate=e,this.context=null,this.stream=null,this.analyser=null,this.trackSampleOffsets={},this.interruptedTrackIds={};}async connect(){this.context=new AudioContext({sampleRate:this.sampleRate}),this.context.state==="suspended"&&await this.context.resume();try{await this.context.audioWorklet.addModule(this.scriptSrc);}catch(t){throw console.error(t),new Error(`Could not add audioWorklet module: ${this.scriptSrc}`)}let e=this.context.createAnalyser();return e.fftSize=8192,e.smoothingTimeConstant=.1,this.analyser=e,true}getFrequencies(e="frequency",t=-100,s=-30){if(!this.analyser)throw new Error("Not connected, please call .connect() first");return _.getFrequencies(this.analyser,this.sampleRate,null,e,t,s)}_start(){let e=new AudioWorkletNode(this.context,"stream_processor");return e.connect(this.context.destination),e.port.onmessage=t=>{let{event:s}=t.data;if(s==="stop")this.onStop?.(),e.disconnect(),this.stream=null;else if(s==="offset"){let{requestId:n,trackId:r,offset:i}=t.data,a=i/this.sampleRate;this.trackSampleOffsets[n]={trackId:r,offset:i,currentTime:a};}},this.analyser.disconnect(),e.connect(this.analyser),this.stream=e,true}add16BitPCM(e,t="default"){if(typeof t!="string")throw new Error("trackId must be a string");if(this.interruptedTrackIds[t])return;this.stream||this._start();let s;if(e instanceof Int16Array)s=e;else if(e instanceof ArrayBuffer)s=new Int16Array(e);else throw new Error("argument must be Int16Array or ArrayBuffer");return this.stream.port.postMessage({event:"write",buffer:s,trackId:t}),s}async getTrackSampleOffset(e=false){if(!this.stream)return null;let t=crypto.randomUUID();this.stream.port.postMessage({event:e?"interrupt":"offset",requestId:t});let s;for(;!s;)s=this.trackSampleOffsets[t],await new Promise(r=>setTimeout(()=>r(),1));let{trackId:n}=s;return e&&n&&(this.interruptedTrackIds[n]=true),s}async interrupt(){return this.getTrackSampleOffset(true)}};globalThis.WavStreamPlayer=q;var ce=atom({key:"ThreadIdToResume",default:undefined}),We=atom({key:"ChatProfile",default:undefined}),$e=atom({key:"SessionId",default:v4()}),te=selector({key:"SessionIdSelector",get:({get:o})=>o($e),set:({set:o},e)=>o($e,e instanceof DefaultValue?v4():e)}),V=atom({key:"Session",dangerouslyAllowMutability:true,default:undefined}),O=atom({key:"Actions",default:[]}),j=atom({key:"Messages",dangerouslyAllowMutability:true,default:[]}),ue=atom({key:"TokenCount",default:0}),$=atom({key:"Loading",default:false}),z=atom({key:"AskUser",default:undefined}),le=atom({key:"WavRecorder",dangerouslyAllowMutability:true,default:new B}),fe=atom({key:"WavStreamPlayer",dangerouslyAllowMutability:true,default:new q}),he=atom({key:"AudioConnection",default:"off"}),de=atom({key:"isAiSpeaking",default:false}),pe=atom({key:"CallFn",default:undefined}),U=atom({key:"ChatSettings",default:[]}),be=selector({key:"ChatSettingsValue/Default",get:({get:o})=>o(U).reduce((t,s)=>(t[s.id]=s.initial,t),{})}),N=atom({key:"ChatSettingsValue",default:be}),W=atom({key:"DisplayElements",default:[]}),H=atom({key:"TasklistElements",default:[]}),K=atom({key:"FirstUserInteraction",default:undefined}),He=atom({key:"User",default:undefined}),Ke=atom({key:"ChainlitConfig",default:undefined}),Ge=atom({key:"AuthConfig",default:undefined}),Ye=atom({key:"ThreadHistory",default:{threads:undefined,currentThreadId:undefined,timeGroupedThreads:undefined,pageInfo:undefined},effects:[({setSelf:o,onSet:e})=>{e((t,s)=>{let n=t?.timeGroupedThreads;t?.threads&&!isEqual(t.threads,s?.timeGroupedThreads)&&(n=Be(t.threads)),o({...t,timeGroupedThreads:n});});}]}),Je=atom({key:"SideView",default:undefined}),G=atom({key:"CurrentThreadId",default:undefined});var ms=()=>{let o=useRecoilValue($),e=useRecoilValue(W),t=useRecoilValue(H),s=useRecoilValue(O),n=useRecoilValue(V),r=useRecoilValue(z),i=useRecoilValue(pe),a=useRecoilValue(U),l=useRecoilValue(N),h=useRecoilValue(be),u=n?.socket.connected&&!n?.error,d=!u||o||r?.spec.type==="file"||r?.spec.type==="action";return {actions:s,askUser:r,callFn:i,chatSettingsDefaultValue:h,chatSettingsInputs:a,chatSettingsValue:l,connected:u,disabled:d,elements:e,error:n?.error,loading:o,tasklists:t}};var Ss=o=>{let e=[];for(let t of o)e=R(e,t);return e},ws=(o,e)=>{if(o.length-1===e)return  true;for(let t=e+1;t<o.length;t++)if(!o[t].streaming)return  false;return  true},R=(o,e)=>ge(o,e.id)?ye(o,e.id,e):"parentId"in e&&e.parentId?Xe(o,e.parentId,e):"indent"in e&&e.indent&&e.indent>0?Qe(o,e.indent,e):[...o,e],Qe=(o,e,t,s=0)=>{let n=[...o];if(n.length===0)return [...n,t];{let r=n.length-1,i=n[r];return i.steps=i.steps||[],s+1===e?(i.steps=[...i.steps,t],n[r]={...i},n):(i.steps=Qe(i.steps,e,t,s+1),n[r]={...i},n)}},Xe=(o,e,t)=>{let s=[...o];for(let n=0;n<s.length;n++){let r=s[n];isEqual(r.id,e)?(r.steps=r.steps?[...r.steps,t]:[t],s[n]={...r}):ge(s,e)&&r.steps&&(r.steps=Xe(r.steps,e,t),s[n]={...r});}return s},Ze=(o,e)=>{for(let t of o){if(isEqual(t.id,e))return t;if(t.steps&&t.steps.length>0){let s=Ze(t.steps,e);if(s)return s}}},ge=(o,e)=>Ze(o,e)!==undefined,ye=(o,e,t)=>{let s=[...o];for(let n=0;n<s.length;n++){let r=s[n];isEqual(r.id,e)?s[n]={steps:r.steps,...t}:ge(s,e)&&r.steps&&(r.steps=ye(r.steps,e,t),s[n]={...r});}return s},Ce=(o,e)=>{let t=[...o];for(let s=0;s<t.length;s++){let n=t[s];n.id===e?t=[...t.slice(0,s),...t.slice(s+1)]:ge(t,e)&&n.steps&&(n.steps=Ce(n.steps,e),t[s]={...n});}return t},Te=(o,e,t,s,n)=>{let r=[...o];for(let i=0;i<r.length;i++){let a=r[i];isEqual(a.id,e)?("content"in a&&a.content!==undefined?s?a.content=t:a.content+=t:n?"input"in a&&a.input!==undefined&&(s?a.input=t:a.input+=t):"output"in a&&a.output!==undefined&&(s?a.output=t:a.output+=t),r[i]={...a}):a.steps&&(a.steps=Te(a.steps,e,t,s,n),r[i]={...a});}return r};var F=()=>{let[o,e]=useRecoilState(Ge),[t,s]=useRecoilState(He),n=useSetRecoilState(Ye);return {authConfig:o,setAuthConfig:e,user:t,setUser:s,setThreadHistory:n}};var bt=async(o,e)=>(await o.get(e))?.json(),Ct=o=>{let e=new J("","webapp");return Object.assign(e,o),e};function Y(o,{...e}={}){let t=useContext(L),{setUser:s}=F(),n=useMemo(()=>([i])=>{e.onErrorRetry||(e.onErrorRetry=(...l)=>{let[h]=l;if(h.status===401){s(null);return}return SWRConfig.defaultValue.onErrorRetry(...l)});let a=Ct(t);return a.on401=a.onError=undefined,bt(a,i)},[t]),r=useMemo(()=>o?[o]:null,[o]);return xt(r,n,e)}var st=()=>{let{authConfig:o,setAuthConfig:e}=F(),{data:t,isLoading:s}=Y(o?null:"/auth/config");return useEffect(()=>{t&&e(t);},[t,e]),{authConfig:o,isLoading:s}};var nt=()=>{let o=useContext(L),{setUser:e,setThreadHistory:t}=F();return {logout:async(n=false)=>{await o.logout(),e(undefined),t(undefined),n&&window.location.reload();}}};var ot=()=>{let{user:o,setUser:e}=F(),{data:t,error:s,isLoading:n,mutate:r}=Y("/user");return useEffect(()=>{t?e(t):n&&e(undefined);},[t,n,e]),useEffect(()=>{s&&e(null);},[s]),{user:o,setUserFromAPI:r}};var it=()=>{let{authConfig:o}=st(),{logout:e}=nt(),{user:t,setUserFromAPI:s}=ot(),n=!!o&&(!o.requireLogin||t!==undefined);return o&&!o.requireLogin?{data:o,user:null,isReady:n,isAuthenticated:true,logout:()=>Promise.resolve(),setUserFromAPI:()=>Promise.resolve()}:{data:o,user:t,isReady:n,isAuthenticated:!!t,logout:e,setUserFromAPI:s}};var Se=class extends Error{constructor(e,t,s){super(e),this.status=t,this.detail=s;}toString(){return this.detail?`${this.message}: ${this.detail}`:this.message}},Pe=class{constructor(e,t,s,n){this.httpEndpoint=e;this.type=t;this.on401=s;this.onError=n;}buildEndpoint(e){return this.httpEndpoint.endsWith("/")?`${this.httpEndpoint.slice(0,-1)}${e}`:`${this.httpEndpoint}${e}`}async getDetailFromErrorResponse(e){try{return (await e.json())?.detail}catch(t){console.error("Unable to parse error response",t);}}handleRequestError(e){e instanceof Se&&(e.status===401&&this.on401&&this.on401(),this.onError&&this.onError(e)),console.error(e);}async fetch(e,t,s,n,r={}){try{let i;s instanceof FormData?i=s:(r["Content-Type"]="application/json",i=s?JSON.stringify(s):null);let a=await fetch(this.buildEndpoint(t),{method:e,credentials:"include",headers:r,signal:n,body:i});if(!a.ok){let l=await this.getDetailFromErrorResponse(a);throw new Se(a.statusText,a.status,l)}return a}catch(i){throw this.handleRequestError(i),i}}async get(e){return await this.fetch("GET",e)}async post(e,t,s){return await this.fetch("POST",e,t,s)}async put(e,t){return await this.fetch("PUT",e,t)}async patch(e,t){return await this.fetch("PATCH",e,t)}async delete(e,t){return await this.fetch("DELETE",e,t)}},J=class extends Pe{async headerAuth(){return (await this.post("/auth/header",{})).json()}async jwtAuth(e){return (await this.fetch("POST","/auth/jwt",undefined,undefined,{Authorization:`Bearer ${e}`})).json()}async passwordAuth(e){return (await this.post("/login",e)).json()}async getUser(){return (await this.get("/user")).json()}async logout(){return (await this.post("/logout",{})).json()}async setFeedback(e){return (await this.put("/feedback",{feedback:e})).json()}async deleteFeedback(e){return (await this.delete("/feedback",{feedbackId:e})).json()}async listThreads(e,t){return (await this.post("/project/threads",{pagination:e,filter:t})).json()}async renameThread(e,t){return (await this.put("/project/thread",{threadId:e,name:t})).json()}async deleteThread(e){return (await this.delete("/project/thread",{threadId:e})).json()}uploadFile(e,t,s){let n=new XMLHttpRequest;n.withCredentials=true;let r=new Promise((i,a)=>{let l=new FormData;l.append("file",e),n.open("POST",this.buildEndpoint(`/project/file?session_id=${s}`),true),n.upload.onprogress=function(h){if(h.lengthComputable){let u=h.loaded/h.total*100;t(u);}},n.onload=function(){if(n.status===200){let h=JSON.parse(n.responseText);i(h);}else a("Upload failed");},n.onerror=function(){a("Upload error");},n.send(l);});return {xhr:n,promise:r}}async callAction(e,t){return (await this.post("/project/action",{sessionId:t,action:e})).json()}async updateElement(e,t){return (await this.put("/project/element",{sessionId:t,element:e})).json()}async deleteElement(e,t){return (await this.delete("/project/element",{sessionId:t,element:e})).json()}getElementUrl(e,t){let s=`?session_id=${t}`;return this.buildEndpoint(`/project/file/${e}${s}`)}getLogoEndpoint(e){return this.buildEndpoint(`/logo?theme=${e}`)}getOAuthEndpoint(e){return this.buildEndpoint(`/auth/oauth/${e}`)}};var Xs=undefined,L=createContext(new J("http://localhost:8000","webapp"));var at=()=>{let o=useContext(L),e=useRecoilValue(V),t=useRecoilValue(z),s=useRecoilValue(te),n=useResetRecoilState(U),r=useResetRecoilState(te),i=useResetRecoilState(N),a=useSetRecoilState(K),l=useSetRecoilState($),h=useSetRecoilState(j),u=useSetRecoilState(W),d=useSetRecoilState(H),p=useSetRecoilState(O),S=useSetRecoilState(ue),g=useSetRecoilState(ce),y=useSetRecoilState(Je),M=useSetRecoilState(G),Q=useCallback(()=>{e?.socket.emit("clear_session"),e?.socket.disconnect(),g(undefined),r(),a(undefined),h([]),u([]),d([]),p([]),S(0),n(),i(),y(undefined),M(undefined);},[e]),X=useCallback((I,v=[])=>{I.id||(I.id=v4()),I.createdAt||(I.createdAt=new Date().toISOString()),h(Z=>R(Z,I)),e?.socket.emit("client_message",{message:I,fileReferences:v});},[e?.socket]),x=useCallback(I=>{e?.socket.emit("edit_message",{message:I});},[e?.socket]),se=useCallback(I=>{e?.socket.emit("window_message",I);},[e?.socket]),ne=useCallback(()=>{e?.socket.emit("audio_start");},[e?.socket]),re=useCallback((I,v,Z,ee)=>{e?.socket.emit("audio_chunk",{isStart:I,mimeType:v,elapsedTime:Z,data:ee});},[e?.socket]),ke=useCallback(()=>{e?.socket.emit("audio_end");},[e?.socket]),oe=useCallback(I=>{t&&(t.parentId&&(I.parentId=t.parentId),h(v=>R(v,I)),t.callback(I));},[t]),Ie=useCallback(I=>{e?.socket.emit("chat_settings_change",I);},[e?.socket]),Ae=useCallback(()=>{h(I=>I.map(v=>(v.streaming=false,v))),l(false),e?.socket.emit("stop");},[e?.socket]);return {uploadFile:useCallback((I,v)=>o.uploadFile(I,v,s),[s]),clear:Q,replyMessage:oe,sendMessage:X,editMessage:x,windowMessage:se,startAudioStream:ne,sendAudioChunk:re,endAudioStream:ke,stopTask:Ae,setIdToResume:g,updateChatSettings:Ie}};var ln=()=>{let o=useRecoilValue(j),e=useRecoilValue(K);return {threadId:useRecoilValue(G),messages:o,firstInteraction:e}};var wn=()=>{let o=useContext(L),e=useRecoilValue(te),[t,s]=useRecoilState(V),n=useSetRecoilState(de),r=useSetRecoilState(he),i=useResetRecoilState(N),a=useSetRecoilState(K),l=useSetRecoilState($),h=useRecoilValue(fe),u=useRecoilValue(le),d=useSetRecoilState(j),p=useSetRecoilState(z),S=useSetRecoilState(pe),g=useSetRecoilState(W),y=useSetRecoilState(H),M=useSetRecoilState(O),Q=useSetRecoilState(U),X=useSetRecoilState(ue),[x,se]=useRecoilState(We),ne=useRecoilValue(ce),[re,ke]=useRecoilState(G);useEffect(()=>{t?.socket&&(t.socket.auth.threadId=re||"");},[re]);let oe=useCallback(({transports:Ue,userEnv:I})=>{let{protocol:v,host:Z,pathname:ee}=new URL(o.httpEndpoint),ut=`${v}//${Z}`,lt=ee&&ee!=="/"?`${ee}/ws/socket.io`:"/ws/socket.io",m=Ut(ut,{path:lt,withCredentials:true,transports:Ue,auth:{clientType:o.type,sessionId:e,threadId:ne||"",userEnv:JSON.stringify(I),chatProfile:x?encodeURIComponent(x):""}});s(c=>(c?.socket?.removeAllListeners(),c?.socket?.close(),{socket:m})),m.on("connect",()=>{m.emit("connection_successful"),s(c=>({...c,error:false}));}),m.on("connect_error",c=>{s(f=>({...f,error:true}));}),m.on("task_start",()=>{l(true);}),m.on("task_end",()=>{l(false);}),m.on("reload",()=>{m.emit("clear_session"),window.location.reload();}),m.on("audio_connection",async c=>{if(c==="on"){let f=true,w=Date.now(),A="pcm16";await u.begin(),await h.connect(),await u.record(async xe=>{let ft=Date.now()-w;m.emit("audio_chunk",{isStart:f,mimeType:A,elapsedTime:ft,data:xe.mono}),f=false;}),h.onStop=()=>n(false);}else await u.end(),await h.interrupt();r(c);}),m.on("audio_chunk",c=>{h.add16BitPCM(c.data,c.track),n(true);}),m.on("audio_interrupt",()=>{h.interrupt();}),m.on("resume_thread",c=>{let f=[];for(let A of c.steps)f=R(f,A);c.metadata?.chat_profile&&se(c.metadata?.chat_profile),d(f);let w=c.elements||[];y(w.filter(A=>A.type==="tasklist")),g(w.filter(A=>["avatar","tasklist"].indexOf(A.type)===-1));}),m.on("new_message",c=>{d(f=>R(f,c));}),m.on("first_interaction",c=>{a(c.interaction),ke(c.thread_id);}),m.on("update_message",c=>{d(f=>ye(f,c.id,c));}),m.on("delete_message",c=>{d(f=>Ce(f,c.id));}),m.on("stream_start",c=>{d(f=>R(f,c));}),m.on("stream_token",({id:c,token:f,isSequence:w,isInput:A})=>{d(xe=>Te(xe,c,f,w,A));}),m.on("ask",({msg:c,spec:f},w)=>{p({spec:f,callback:w,parentId:c.parentId}),d(A=>R(A,c)),l(false);}),m.on("ask_timeout",()=>{p(undefined),l(false);}),m.on("clear_ask",()=>{p(undefined);}),m.on("call_fn",({name:c,args:f},w)=>{S({name:c,args:f,callback:w});}),m.on("clear_call_fn",()=>{S(undefined);}),m.on("call_fn_timeout",()=>{S(undefined);}),m.on("chat_settings",c=>{Q(c),i();}),m.on("element",c=>{!c.url&&c.chainlitKey&&(c.url=o.getElementUrl(c.chainlitKey,e)),c.type==="tasklist"?y(f=>{let w=f.findIndex(A=>A.id===c.id);return w===-1?[...f,c]:[...f.slice(0,w),c,...f.slice(w+1)]}):g(f=>{let w=f.findIndex(A=>A.id===c.id);return w===-1?[...f,c]:[...f.slice(0,w),c,...f.slice(w+1)]});}),m.on("remove_element",c=>{g(f=>f.filter(w=>w.id!==c.id)),y(f=>f.filter(w=>w.id!==c.id));}),m.on("action",c=>{M(f=>[...f,c]);}),m.on("remove_action",c=>{M(f=>{let w=f.findIndex(A=>A.id===c.id);return w===-1?f:[...f.slice(0,w),...f.slice(w+1)]});}),m.on("token_usage",c=>{X(f=>f+c);}),m.on("window_message",c=>{window.parent&&window.parent.postMessage(c,"*");});},[s,e,x]),Ie=useCallback(debounce(oe,200),[oe]),Ae=useCallback(()=>{t?.socket&&(t.socket.removeAllListeners(),t.socket.close());},[t]);return {connect:Ie,disconnect:Ae,session:t,sessionId:e,chatProfile:x,idToResume:ne,setChatProfile:se}};var bn=()=>{let[o,e]=useRecoilState(he),t=useRecoilValue(le),s=useRecoilValue(fe),n=useRecoilValue(de),{startAudioStream:r,endAudioStream:i}=at(),a=useCallback(async()=>{e("connecting"),await r();},[r]),l=useCallback(async()=>{e("off"),await t.end(),await s.interrupt(),await i();},[i,t,s]);return {startConversation:a,endConversation:l,audioConnection:o,isAiSpeaking:n,wavRecorder:t,wavStreamPlayer:s}};var Dn=()=>{let[o,e]=useRecoilState(Ke),{isAuthenticated:t}=it(),s=navigator.language||"en-US",{data:n,error:r,isLoading:i}=Y(!o&&t?`/project/settings?language=${s}`:null);return useEffect(()=>{n&&e(n);},[n,e]),{config:o,error:r,isLoading:i,language:s}};var Le=new WeakMap,Ot=(o,e,t=false,s=false)=>{let n,r,i;if(s&&(r=e.toString(),i=t.toString(),n=Le.has(o)?Le.get(o):{},Le.set(o,n),n[r]=n[r]||{},n[r][i]))return n[r][i];let a=o.length,l=new Array(e);if(e<=a){l.fill(0);let h=new Array(e).fill(0);for(let u=0;u<a;u++){let d=Math.floor(u*(e/a));t?l[d]=Math.max(l[d],Math.abs(o[u])):l[d]+=Math.abs(o[u]),h[d]++;}if(!t)for(let u=0;u<l.length;u++)l[u]=l[u]/h[u];}else for(let h=0;h<e;h++){let u=h*(a-1)/(e-1),d=Math.floor(u),p=Math.ceil(u),S=u-d;p>=a?l[h]=o[a-1]:l[h]=o[d]*(1-S)+o[p]*S;}return s&&(n[r][i]=l),l},jt={drawBars:(o,e,t,s,n,r=0,i=0,a=0,l=false)=>{r=Math.floor(Math.min(r,(t-a)/(Math.max(i,1)+a))),r||(r=Math.floor((t-a)/(Math.max(i,1)+a))),i||(i=(t-a)/r-a);let h=Ot(e,r,true);for(let u=0;u<r;u++){let d=Math.abs(h[u]),p=Math.max(1,d*s),S=a+u*(i+a),g=l?(s-p)/2:s-p,y=Math.min(i/2,p/2);o.fillStyle=n,o.beginPath(),o.moveTo(S+y,g),o.lineTo(S+i-y,g),o.arcTo(S+i,g,S+i,g+y,y),o.lineTo(S+i,g+p-y),o.arcTo(S+i,g+p,S+i-y,g+p,y),o.lineTo(S+y,g+p),o.arcTo(S,g+p,S,g+p-y,y),o.lineTo(S,g+y),o.arcTo(S,g,S+y,g,y),o.closePath(),o.fill();}}};

export { Pe as APIBase, J as ChainlitAPI, L as ChainlitContext, Se as ClientError, jt as WavRenderer, O as actionState, R as addMessage, Xe as addMessageToParent, z as askUserState, he as audioConnectionState, Ge as authState, pe as callFnState, We as chatProfileState, be as chatSettingsDefaultValueSelector, U as chatSettingsInputsState, N as chatSettingsValueState, Ke as configState, G as currentThreadIdState, Xs as defaultChainlitContext, Ce as deleteMessageById, W as elementState, bt as fetcher, K as firstUserInteraction, ge as hasMessageById, de as isAiSpeakingState, ws as isLastMessage, $ as loadingState, j as messagesState, Ss as nestMessages, te as sessionIdState, V as sessionState, Je as sideViewState, H as tasklistState, Ye as threadHistoryState, ce as threadIdToResumeState, ue as tokenCountState, ye as updateMessageById, Te as updateMessageContentById, Y as useApi, bn as useAudio, it as useAuth, ms as useChatData, at as useChatInteract, ln as useChatMessages, wn as useChatSession, Dn as useConfig, He as userState, le as wavRecorderState, fe as wavStreamPlayerState };
//# sourceMappingURL=out.js.map
//# sourceMappingURL=index.mjs.map