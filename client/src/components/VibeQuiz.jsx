import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Sun, Moon, Coffee, Users, Ghost, Trash2, Cigarette, Leaf, BookOpen, ChevronRight, ChevronLeft, Save, CheckCircle2 } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

export default function VibeQuiz({ initialData, onSave, isSaving }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState(initialData);

  const steps = [
    {
      id: 'identity',
      title: 'The Identity',
      subtitle: 'Where are you leveling up?',
      icon: <BookOpen className="w-8 h-8 text-accent" />,
      fields: ['college']
    },
    {
      id: 'habits',
      title: 'Study Habits',
      subtitle: 'When does your brain peak?',
      icon: <Sparkles className="w-8 h-8 text-accent" />,
      options: [
        { value: 'MORNING', label: 'Early Bird', icon: <Sun className="w-5 h-5" />, desc: 'I peak at sunrise.' },
        { value: 'NIGHT', label: 'Night Owl', icon: <Moon className="w-5 h-5" />, desc: 'I thrive in the dark.' },
        { value: 'NEUTRAL', label: 'Hybrid', icon: <Coffee className="w-5 h-5" />, desc: 'I study when I can.' }
      ],
      field: 'studyPreference'
    },
    {
      id: 'social',
      title: 'Social Battery',
      subtitle: 'How do you recharge?',
      icon: <Users className="w-8 h-8 text-accent" />,
      options: [
        { value: 'EXTROVERT', label: 'Extrovert', icon: <Users className="w-5 h-5" />, desc: 'Gimme all the people!' },
        { value: 'INTROVERT', label: 'Introvert', icon: <Ghost className="w-5 h-5" />, desc: 'I need my space.' },
        { value: 'NEUTRAL', label: 'Ambivert', icon: <Coffee className="w-5 h-5" />, desc: 'Best of both worlds.' }
      ],
      field: 'socialPreference'
    },
    {
      id: 'cleaning',
      title: 'The Cleanliness',
      subtitle: 'How tidy is your sanctuary?',
      icon: <Trash2 className="w-8 h-8 text-accent" />,
      field: 'cleanlinessLevel'
    },
    {
      id: 'preferences',
      title: 'House Rules',
      subtitle: 'Vibe check on habits.',
      icon: <Leaf className="w-8 h-8 text-accent" />,
      fields: ['isSmoking', 'isVegetarian']
    },
    {
      id: 'bio',
      title: 'The Final Pitch',
      subtitle: 'Tell your future roommate why you rock.',
      icon: <Sparkles className="w-8 h-8 text-accent" />,
      field: 'bio'
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const updateData = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const chartData = [
    { subject: 'Study', A: data.studyPreference === 'MORNING' ? 100 : data.studyPreference === 'NIGHT' ? 80 : 50, fullMark: 150 },
    { subject: 'Social', A: data.socialPreference === 'EXTROVERT' ? 100 : data.socialPreference === 'INTROVERT' ? 20 : 60, fullMark: 150 },
    { subject: 'Clean', A: data.cleanlinessLevel * 20, fullMark: 150 },
    { subject: 'Vibe', A: 80, fullMark: 150 },
    { subject: 'Trust', A: 90, fullMark: 150 },
  ];

  const renderStep = () => {
    const currentStep = steps[step];
    
    switch (currentStep.id) {
      case 'identity':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-taupe px-1">College / University</label>
              <input 
                type="text" 
                value={data.college}
                onChange={(e) => updateData('college', e.target.value)}
                className="w-full px-8 py-5 bg-background border border-white/5 rounded-[2rem] focus:ring-2 focus:ring-accent outline-none text-primary font-bold text-xl"
                placeholder="Where do you study?"
              />
            </div>
          </div>
        );
      
      case 'habits':
      case 'social':
        return (
          <div className="grid grid-cols-1 gap-4">
            {currentStep.options.map(opt => (
              <button
                key={opt.value}
                onClick={() => updateData(currentStep.field, opt.value)}
                className={`p-6 rounded-[2rem] border-2 text-left transition-all flex items-center gap-6 ${
                  data[currentStep.field] === opt.value 
                  ? 'border-accent bg-accent/10' 
                  : 'border-white/5 bg-background hover:border-white/20'
                }`}
              >
                <div className={`p-4 rounded-2xl ${data[currentStep.field] === opt.value ? 'bg-accent text-background' : 'bg-surface text-taupe'}`}>
                  {opt.icon}
                </div>
                <div>
                  <p className="font-black text-primary uppercase text-xs tracking-widest">{opt.label}</p>
                  <p className="text-taupe text-sm font-medium">{opt.desc}</p>
                </div>
                {data[currentStep.field] === opt.value && <CheckCircle2 className="w-6 h-6 text-accent ml-auto" />}
              </button>
            ))}
          </div>
        );

      case 'cleaning':
        return (
          <div className="space-y-12 py-10">
            <div className="flex justify-between items-end mb-4">
              <p className="text-4xl font-black text-primary">{data.cleanlinessLevel}<span className="text-sm text-taupe ml-2">/ 5</span></p>
              <p className="text-xs font-black text-taupe uppercase tracking-widest">Sanitary Score</p>
            </div>
            <input 
              type="range" min="1" max="5" step="1"
              value={data.cleanlinessLevel}
              onChange={(e) => updateData('cleanlinessLevel', parseInt(e.target.value))}
              className="w-full h-3 bg-white/5 rounded-full appearance-none cursor-pointer accent-accent"
            />
            <div className="flex justify-between text-[10px] font-black text-taupe uppercase tracking-widest px-2">
              <span>Organized Chaos</span>
              <span>Lab Clean</span>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="grid grid-cols-1 gap-6">
            <button
              onClick={() => updateData('isSmoking', !data.isSmoking)}
              className={`p-8 rounded-[2.5rem] border-2 transition-all flex items-center justify-between ${
                data.isSmoking ? 'border-red-500/50 bg-red-500/5' : 'border-white/5 bg-background'
              }`}
            >
              <div className="flex items-center gap-6">
                <div className={`p-4 rounded-2xl ${data.isSmoking ? 'bg-red-500 text-white' : 'bg-surface text-taupe'}`}>
                  <Cigarette className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="font-black text-primary uppercase text-xs tracking-widest">I Smoke</p>
                  <p className="text-taupe text-sm font-medium">Be honest for a better match.</p>
                </div>
              </div>
              <div className={`w-12 h-6 rounded-full relative transition-all ${data.isSmoking ? 'bg-red-500' : 'bg-white/10'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${data.isSmoking ? 'right-1' : 'left-1'}`} />
              </div>
            </button>

            <button
              onClick={() => updateData('isVegetarian', !data.isVegetarian)}
              className={`p-8 rounded-[2.5rem] border-2 transition-all flex items-center justify-between ${
                data.isVegetarian ? 'border-green-500/50 bg-green-500/5' : 'border-white/5 bg-background'
              }`}
            >
              <div className="flex items-center gap-6">
                <div className={`p-4 rounded-2xl ${data.isVegetarian ? 'bg-green-500 text-white' : 'bg-surface text-taupe'}`}>
                  <Leaf className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="font-black text-primary uppercase text-xs tracking-widest">Vegetarian</p>
                  <p className="text-taupe text-sm font-medium">Cruelty-free living.</p>
                </div>
              </div>
              <div className={`w-12 h-6 rounded-full relative transition-all ${data.isVegetarian ? 'bg-green-500' : 'bg-white/10'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${data.isVegetarian ? 'right-1' : 'left-1'}`} />
              </div>
            </button>
          </div>
        );

      case 'bio':
        return (
          <div className="space-y-4">
            <textarea 
              value={data.bio}
              onChange={(e) => updateData('bio', e.target.value)}
              className="w-full px-8 py-6 bg-background border border-white/5 rounded-[2.5rem] focus:ring-2 focus:ring-accent outline-none text-primary font-bold h-48 resize-none text-lg"
              placeholder="Tell us about your vibe..."
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-surface rounded-[3rem] p-8 md:p-12 shadow-2xl border border-white/10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[120px] -mr-48 -mt-48" />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
        <div>
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-primary/5 rounded-3xl border border-white/5">
              {steps[step].icon}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">Step {step + 1} of {steps.length}</p>
              <h3 className="text-4xl font-black text-primary tracking-tighter">{steps[step].title}</h3>
            </div>
          </div>

          <p className="text-taupe text-lg font-medium mb-10">{steps[step].subtitle}</p>

          <div className="min-h-[300px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-4 mt-12">
            {step > 0 && (
              <button 
                onClick={handleBack}
                className="p-5 bg-primary/5 text-primary rounded-3xl hover:bg-primary/10 transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            
            {step < steps.length - 1 ? (
              <button 
                onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-3 py-5 bg-primary text-background rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-accent transition-all shadow-xl"
              >
                Next Vibe <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                onClick={() => onSave(data)}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-3 py-5 bg-accent text-background rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-accent/20 disabled:opacity-50"
              >
                {isSaving ? <Save className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Sync Quantum Vibe
              </button>
            )}
          </div>
        </div>

        <div className="hidden lg:block bg-background/50 rounded-[4rem] p-10 border border-white/5 aspect-square relative group">
           <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity">
              <Sparkles className="w-64 h-64 text-accent animate-pulse" />
           </div>
           
           <div className="relative h-full w-full">
             <div className="text-center mb-8">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-taupe mb-2">Real-time Preview</p>
                <h4 className="text-2xl font-black text-primary tracking-tighter">Your Vibe Radar</h4>
             </div>

             <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                    <PolarGrid stroke="#ffffff10" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10, fontWeight: 900 }} />
                    <Radar
                      name="User"
                      dataKey="A"
                      stroke="#CCFF00"
                      fill="#CCFF00"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
             </div>

             <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-white/5">
                   <p className="text-[10px] font-black text-taupe uppercase tracking-widest">Compatibility</p>
                   <p className="text-sm font-black text-accent">85% Ready</p>
                </div>
                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-white/5">
                   <p className="text-[10px] font-black text-taupe uppercase tracking-widest">Persona</p>
                   <p className="text-sm font-black text-primary">Quantum Explorer</p>
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
