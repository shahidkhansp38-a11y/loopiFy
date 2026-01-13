import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Camera, 
  User, 
  Loader2,
  Save,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, updating, updateProfile, uploadAvatar } = useProfile();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  useEffect(() => {
    if (profile) {
      const nameChanged = fullName !== (profile.full_name || '');
      const bioChanged = bio !== (profile.bio || '');
      setHasChanges(nameChanged || bioChanged);
    }
  }, [fullName, bio, profile]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    await uploadAvatar(file);
  };

  const handleSave = async () => {
    await updateProfile({ full_name: fullName, bio });
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent"
        />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 glass-effect border-b border-border/50"
      >
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold">Edit Profile</h1>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-md space-y-8">
        {/* Avatar Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAvatarClick}
              className="w-28 h-28 rounded-full overflow-hidden cursor-pointer ring-4 ring-primary/20 hover:ring-primary/40 transition-all"
            >
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full loopify-gradient flex items-center justify-center">
                  <User className="w-12 h-12 text-primary-foreground" />
                </div>
              )}
              {updating && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-full">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}
            </motion.div>
            <button
              onClick={handleAvatarClick}
              disabled={updating}
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full loopify-gradient flex items-center justify-center loopify-shadow hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Camera className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <p className="text-sm text-muted-foreground">Tap to change photo</p>
        </motion.section>

        {/* Form Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="h-12 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user.email || ''}
              disabled
              className="h-12 rounded-xl bg-muted"
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              className="min-h-[120px] rounded-xl resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">{bio.length}/500</p>
          </div>
        </motion.section>

        {/* Save Button */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={handleSave}
            disabled={updating || !hasChanges}
            className="w-full h-12 rounded-xl loopify-gradient hover:opacity-90 transition-opacity"
          >
            {updating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </motion.section>
      </main>
    </div>
  );
}
