import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Video, VideoOff, Mic, MicOff, PhoneOff, Users, Settings, MessageSquare, MonitorUp, Grid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function VideoCall() {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showChat, setShowChat] = useState(false);
  
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const participants = [
    { id: 1, name: 'You', isActive: true },
    { id: 2, name: 'Alice Chen', isActive: true },
    { id: 3, name: 'Bob Smith', isActive: false },
    { id: 4, name: 'Carol Davis', isActive: true },
  ];

  const endCall = () => {
    navigate('/');
  };

  return (
    <div className="h-screen bg-[#1a1a2e] flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="px-4 py-3 flex items-center justify-between bg-black/20"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="font-semibold text-white">Study Session</h1>
            <p className="text-xs text-white/60 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Live • {participants.length} participants
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <Grid className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </motion.header>

      {/* Video Grid */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="h-full grid grid-cols-2 gap-3">
          {participants.map((participant, index) => (
            <motion.div
              key={participant.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-2xl overflow-hidden ${
                participant.id === 1 && isVideoOff
                  ? 'bg-gradient-to-br from-primary/20 to-secondary/20'
                  : 'bg-gradient-to-br from-gray-800 to-gray-900'
              }`}
            >
              {/* Video placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                {(participant.id === 1 && isVideoOff) || !participant.isActive ? (
                  <div className="w-20 h-20 rounded-full loopify-gradient flex items-center justify-center text-2xl font-bold text-white">
                    {participant.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30" />
                )}
              </div>

              {/* Name tag */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-black/50 text-white text-sm font-medium backdrop-blur">
                  {participant.name}
                </span>
                {!participant.isActive && participant.id !== 1 && (
                  <span className="p-2 rounded-full bg-red-500/80">
                    <MicOff className="w-3 h-3 text-white" />
                  </span>
                )}
              </div>

              {/* Speaking indicator */}
              {participant.isActive && participant.id !== 1 && (
                <div className="absolute top-3 right-3">
                  <span className="w-3 h-3 rounded-full bg-green-500 block animate-pulse" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom Controls */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="px-4 py-6 bg-black/30"
      >
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={() => setIsMuted(!isMuted)}
            className={`w-14 h-14 rounded-full ${
              isMuted 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-white/10 hover:bg-white/20'
            } transition-colors`}
          >
            {isMuted ? (
              <MicOff className="w-6 h-6 text-white" />
            ) : (
              <Mic className="w-6 h-6 text-white" />
            )}
          </Button>

          <Button
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`w-14 h-14 rounded-full ${
              isVideoOff 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-white/10 hover:bg-white/20'
            } transition-colors`}
          >
            {isVideoOff ? (
              <VideoOff className="w-6 h-6 text-white" />
            ) : (
              <Video className="w-6 h-6 text-white" />
            )}
          </Button>

          <Button
            className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <MonitorUp className="w-6 h-6 text-white" />
          </Button>

          <Button
            onClick={() => setShowChat(!showChat)}
            className={`w-14 h-14 rounded-full ${
              showChat 
                ? 'bg-primary' 
                : 'bg-white/10 hover:bg-white/20'
            } transition-colors`}
          >
            <MessageSquare className="w-6 h-6 text-white" />
          </Button>

          <Button
            onClick={endCall}
            className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
          >
            <PhoneOff className="w-6 h-6 text-white" />
          </Button>
        </div>

        {/* Participants indicator */}
        <div className="flex justify-center mt-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10">
            <Users className="w-4 h-4 text-white/70" />
            <span className="text-sm text-white/70">{participants.length} in call</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
