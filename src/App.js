import React, {useState, useEffect, useRef} from 'react';
import { io } from 'socket.io-client';
import SimplePeer from 'simple-peer';
import './App.css';

const socket = io('http://localhost:3000');

//I would also add some styling to this app. 
//I was also looking into using Next.js as a possibility to create this app as I am learning how to style with Tailwind

function App() {

  //I was thinking of decluttering this main app by creating some seperate files/components
  //One possibility was making an AudioStreaming.js in an components folder
  const [myId, setMyId] = useState(null);
  const [partnerId, setPartnerId] = useState('');
  const [audioInputs, setAudioInputs] = useState([]);
  const [audioOutputs, setAudioOutputs] = useState([]);
  const [selectedInput, setSelectedInput] = useState('');
  const [selectedOutput, setSelectedOutput] = useState('');

  const myAudioRef = useRef();
  const partnerAudioRef = useRef();
  const peerRef = useRef();

  useEffect(() => {
  
    socket.on('connect', () => {
      setMyId(socket.id);
    });

    
    socket.on('signal', ({ signal, from }) => {
      peerRef.current.signal(signal);
    });

   
    async function fetchDevices() {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAudioInputs(devices.filter(device => device.kind === 'audioinput'));
      setAudioOutputs(devices.filter(device => device.kind === 'audiooutput'));
    }

    fetchDevices();
  }, []);

  const startCall = async () => {
    const stream = await getAudioStream(selectedInput);
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream: stream
    });

    peer.on('signal', signal => {
      socket.emit('signal', { to: partnerId, from: myId, signal });
    });

    peer.on('stream', partnerStream => {
      partnerAudioRef.current.srcObject = partnerStream;
      partnerAudioRef.current.play();
    });

    peerRef.current = peer;
  };

   const joinCall = async () => {
    const stream = await getAudioStream(selectedInput);
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream: stream
    });

    peer.on('signal', signal => {
      socket.emit('signal', { to: partnerId, from: myId, signal });
    });

    peer.on('stream', partnerStream => {
      partnerAudioRef.current.srcObject = partnerStream;
      partnerAudioRef.current.play();
    });

    peerRef.current = peer;
  };

  const getAudioStream = async (deviceId) => {
    const constraints = {
      audio: { deviceId: deviceId ? { exact: deviceId } : undefined },
    };
    return await navigator.mediaDevices.getUserMedia(constraints);
  };

  const handleSetOutputDevice = async (audioElement, deviceId) => {
    if (typeof audioElement.setSinkId !== 'undefined') {
      await audioElement.setSinkId(deviceId);
    } else {
      console.warn('setSinkId() is not supported in your browser.');
    }
  };

  return (
    <div >
      <h1>Audio Streaming with WebRTC</h1>

      <label>Partner ID</label>
      <input type="text" value={partnerId} onChange={e => setPartnerId(e.target.value)} />

      <button onClick={startCall}>Start Call</button>
      <button onClick={joinCall}>Join Call</button>

      <h2>Audio Input</h2>
      <select onChange={e => setSelectedInput(e.target.value)}>
        {audioInputs.map(input => (
          <option key={input.deviceId} value={input.deviceId}>{input.label}</option>
        ))}
      </select>

      <h2>Audio Output</h2>
      <select onChange={e => setSelectedOutput(e.target.value)}>
        {audioOutputs.map(output => (
          <option key={output.deviceId} value={output.deviceId}>{output.label}</option>
        ))}
      </select>
      <button onClick={() => handleSetOutputDevice(myAudioRef.current, selectedOutput)}>Set Output</button>

      <h2>Your Audio</h2>
      <audio ref={myAudioRef} controls />

      <h2>Partner's Audio</h2>
      <audio ref={partnerAudioRef} controls />
    </div>
  );
}

export default App;
