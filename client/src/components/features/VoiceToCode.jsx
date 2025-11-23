import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiMic, FiMicOff, FiPlay, FiSquare, FiVolume2 } from 'react-icons/fi';

// Force cache refresh
import toast from 'react-hot-toast';

const VoiceToCode = ({ onCodeGenerated }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

  // Voice recognition setup
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Setup audio context for visualization
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

      const updateAudioLevel = () => {
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average / 255); // Normalize to 0-1
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };
      updateAudioLevel();

      // Setup Web Speech API
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript + interimTranscript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        toast.error('Voice recognition error. Please try again.');
        stopRecording();
      };

      recognition.start();
      setIsRecording(true);
      toast.success('Voice recording started. Describe what you want to build!');

    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    setIsRecording(false);

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    // Stop audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }

    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    setAudioLevel(0);
  };

  const processVoiceInput = async () => {
    if (!transcript.trim()) {
      toast.error('No voice input detected. Please try recording again.');
      return;
    }

    setIsProcessing(true);
    toast.loading('Converting voice to code...', { id: 'voice-to-code' });

    try {
      const res = await fetch(`${apiBase}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Voice input: ${transcript}`,
          model: 'gemini-2.5-flash'
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const cleaned = extractCodeBlock(data.code || '');

      if (!cleaned || cleaned.trim().length === 0) {
        throw new Error('No code generated');
      }

      onCodeGenerated(cleaned);
      toast.success('Voice converted to code successfully!', { id: 'voice-to-code' });

    } catch (error) {
      console.error('Voice processing error:', error);
      toast.error('Failed to convert voice to code. Please try again.', { id: 'voice-to-code' });
    } finally {
      setIsProcessing(false);
      setTranscript('');
    }
  };

  // Extract code block from AI response (same as in main App.jsx)
  const extractCodeBlock = (text) => {
    if (!text) return '';

    // Look for code blocks
    const codeBlockRegex = /```(?:javascript|jsx|js)?\n?([\s\S]*?)```/g;
    const matches = text.match(codeBlockRegex);

    if (matches) {
      // Return the first code block found
      const match = matches[0].match(/```(?:javascript|jsx|js)?\n?([\s\S]*?)```/);
      if (match) return match[1].trim();
    }

    // If no code blocks, try to find window.MainComponent assignment
    const mainComponentRegex = /(?:function|const|let|var)\s+([A-Z][a-zA-Z0-9]*)\s*[=\(]/;
    if (text.includes('window.MainComponent')) {
      return text.trim();
    }

    // Try to extract JSX/React code
    if (text.includes('React') || text.includes('JSX') || text.includes('function') || text.includes('const') || text.includes('export')) {
      return text.trim();
    }

    return '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
          <FiMic className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Voice-to-Code</h3>
          <p className="text-sm text-gray-400">Speak your requirements aloud</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Recording Controls */}
        <div className="flex items-center gap-4">
          <motion.button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isRecording
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isRecording ? <FiMicOff className="w-5 h-5" /> : <FiMic className="w-5 h-5" />}
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </motion.button>

          {isRecording && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-red-400">Recording...</span>
            </div>
          )}
        </div>

        {/* Audio Level Visualization */}
        {isRecording && (
          <div className="flex items-center gap-2">
            <FiVolume2 className="w-4 h-4 text-gray-400" />
            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                animate={{ width: `${audioLevel * 100}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </div>
        )}

        {/* Transcript Display - Editable after recording stops */}
        {transcript && (
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-300 mb-2">
              Transcript:
              {!isRecording && (
                <span className="ml-2 text-xs text-gray-500">(You can edit this before generating code)</span>
              )}
            </h4>
            {isRecording ? (
              <p className="text-sm text-gray-400 italic">"{transcript}"</p>
            ) : (
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Edit your transcript here..."
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y min-h-[80px]"
                rows={3}
              />
            )}
          </div>
        )}

        {/* Process Button */}
        {transcript && !isRecording && (
          <motion.button
            onClick={processVoiceInput}
            disabled={isProcessing}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Converting to Code...
              </>
            ) : (
              <>
                <FiPlay className="w-5 h-5" />
                Generate Code from Voice
              </>
            )}
          </motion.button>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>💡 Try saying: "Create a todo app with add, edit, and delete functionality"</p>
      </div>
    </motion.div>
  );
};

export default VoiceToCode;
