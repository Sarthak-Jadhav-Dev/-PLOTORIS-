"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, GraduationCap, Briefcase, BookOpen } from "lucide-react";
import Lottie from "lottie-react";

// Slide Data
const slides = [
  {
    id: "profession",
    title: "What is your profession?",
    subtitle: "Help us tailor your research experience.",
    icon: <Briefcase size={24} className="text-orange-primary" />,
    options: ["Student", "Teacher", "Researcher", "Publisher", "Industry Professional", "Other"],
    mainIcon: Briefcase
  },
  {
    id: "education",
    title: "What is your highest education level?",
    subtitle: "This helps us adjust the complexity of insights.",
    icon: <GraduationCap size={24} className="text-orange-primary" />,
    options: ["High School", "Bachelor's Degree", "Master's Degree", "Ph.D.", "Postdoctoral", "Other"],
    mainIcon: GraduationCap
  },
  {
    id: "interests",
    title: "What fields are you interested in?",
    subtitle: "Select all that apply.",
    icon: <BookOpen size={24} className="text-orange-primary" />,
    options: ["Computer Science", "Biology", "Physics", "Medicine", "Economics", "Psychology", "Engineering", "Mathematics"],
    multiSelect: true,
    mainIcon: BookOpen
  }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [profession, setProfession] = useState("");
  const [education, setEducation] = useState("");
  const [interests, setInterests] = useState<string[]>([]);

  const handleNext = () => {
    if (currentStep < slides.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      submitOnboarding();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const submitOnboarding = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          profession,
          education,
          fieldsOfInterest: interests.join(", ")
        })
      });
      // Redirect to chat regardless of DB success for smooth UX
      router.push("/chat");
    } catch (err) {
      console.error(err);
      router.push("/chat");
    }
  };

  const slide = slides[currentStep];
  const isNextDisabled = 
    (slide.id === "profession" && !profession) ||
    (slide.id === "education" && !education) ||
    (slide.id === "interests" && interests.length === 0);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-primary/10 rounded-full blur-[150px] animate-float" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-dark/10 rounded-full blur-[150px] animate-float" style={{ animationDelay: "2s" }} />

      <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-surface-raised/40 backdrop-blur-xl border border-border rounded-3xl p-8 shadow-2xl">
        
        {/* Left Side - Animated Icon */}
        <div className="hidden md:flex flex-col items-center justify-center h-full bg-surface-overlay rounded-2xl p-6 border border-border">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.5, rotate: 20 }}
              transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
              className="w-full max-w-[300px] aspect-square flex flex-col items-center justify-center relative"
            >
              <div className="absolute inset-0 bg-orange-primary/5 rounded-full blur-2xl animate-pulse" />
              <div className="relative w-40 h-40 rounded-full bg-linear-to-br from-orange-primary/20 to-orange-dark/20 border-2 border-orange-primary/30 flex items-center justify-center shadow-[0_0_50px_-12px_rgba(255,107,0,0.3)]">
                <slide.mainIcon size={80} className="text-orange-primary drop-shadow-[0_0_15px_rgba(255,107,0,0.5)]" />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Side - Form */}
        <div className="flex flex-col justify-between h-full min-h-[400px]">
          <div>
            <div className="mb-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={slide.id + "header"}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="w-12 h-12 rounded-xl bg-orange-primary/10 flex items-center justify-center mb-6">
                    {slide.icon}
                  </div>
                  <h1 className="text-3xl font-bold mb-2">{slide.title}</h1>
                  <p className="text-text-secondary">{slide.subtitle}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="space-y-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={slide.id + "options"}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                  {slide.options.map((opt) => {
                    const isSelected = slide.multiSelect 
                      ? interests.includes(opt)
                      : (slide.id === "profession" ? profession === opt : education === opt);

                    return (
                      <button
                        key={opt}
                        onClick={() => {
                          if (slide.id === "profession") setProfession(opt);
                          else if (slide.id === "education") setEducation(opt);
                          else if (slide.id === "interests") {
                            setInterests(prev => 
                              prev.includes(opt) ? prev.filter(i => i !== opt) : [...prev, opt]
                            );
                          }
                        }}
                        className={`text-left px-4 py-4 rounded-xl border transition-all duration-300 flex items-center justify-between ${
                          isSelected 
                            ? "border-orange-primary bg-orange-primary/10 text-orange-primary" 
                            : "border-border bg-surface hover:border-orange-primary/50 hover:bg-surface-raised text-text-primary"
                        }`}
                      >
                        <span className="text-sm font-medium">{opt}</span>
                        {isSelected && <Check size={16} className="text-orange-primary" />}
                      </button>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Navigation & Progress */}
          <div className="mt-12">
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="p-3 rounded-xl border border-border bg-surface-raised hover:bg-surface-overlay disabled:opacity-50 transition-colors"
              >
                <ArrowLeft size={18} />
              </button>
              
              <button
                onClick={handleNext}
                disabled={isNextDisabled || isLoading}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-orange-primary to-orange-dark text-white font-medium hover:shadow-lg hover:shadow-orange-primary/20 disabled:opacity-50 transition-all duration-300"
              >
                {isLoading ? "Saving..." : currentStep === slides.length - 1 ? "Complete Setup" : "Continue"}
                {!isLoading && <ArrowRight size={18} />}
              </button>
            </div>

            {/* Dot Progress Bar */}
            <div className="flex items-center justify-center gap-2">
              {slides.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all duration-500 ${
                    idx === currentStep ? "w-8 bg-orange-primary" : "w-2 bg-border"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
