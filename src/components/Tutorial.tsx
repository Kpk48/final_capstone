"use client";
import { useState, useEffect, useRef } from "react";
import { tutorialStepsByRole, TutorialStep } from "@/config/tutorialSteps";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TutorialProps {
  role: "student" | "company" | "admin";
}

export default function Tutorial({ role }: TutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [placement, setPlacement] = useState<'top' | 'bottom' | 'left' | 'right' | 'center'>('bottom');

  const completeTutorial = async () => {
    try {
      await fetch("/api/tutorial", { method: "POST" });
      setIsActive(false);
    } catch (error) {
      console.error("Failed to mark tutorial as completed:", error);
    }
  };

  useEffect(() => {
    checkTutorialStatus();
  }, []);

  useEffect(() => {
    if (isActive && steps.length > 0) {
      updateTooltipPosition();
      window.addEventListener('resize', updateTooltipPosition);
      window.addEventListener('scroll', updateTooltipPosition);
      
      return () => {
        window.removeEventListener('resize', updateTooltipPosition);
        window.removeEventListener('scroll', updateTooltipPosition);
      };
    }
  }, [isActive, currentStep, steps]);

  useEffect(() => {
    if (!isActive || steps.length === 0) return;

    const step = steps[currentStep];
    if (!step) return;

    const overflowSensitiveTargets = new Set([
      '[data-tour="nav-overflow"]',
      '[data-tour="student-following"]',
      '[data-tour="search"]',
      '[data-tour="messages"]',
    ]);

    if (!overflowSensitiveTargets.has(step.target)) {
      return;
    }

    const overflowButton = document.querySelector<HTMLButtonElement>('[data-tour="nav-overflow"]');
    if (!overflowButton) return;

    const isExpanded = overflowButton.getAttribute('aria-expanded') === 'true';
    if (!isExpanded) {
      requestAnimationFrame(() => {
        if (overflowButton.getAttribute('aria-expanded') !== 'true') {
          overflowButton.click();
          setTimeout(() => {
            updateTooltipPosition();
          }, 60);
        }
      });
    }
  }, [currentStep, isActive, steps]);

  const checkTutorialStatus = async () => {
    try {
      const response = await fetch("/api/tutorial");
      if (response.ok) {
        const data = await response.json();
        
        if (!data.tutorial_completed) {
          const allSteps = tutorialStepsByRole[role];

          setTimeout(() => {
            const hasAnyTarget = allSteps.some((step) => {
              if (step.target === 'body') return true;
              return Boolean(document.querySelector(step.target));
            });

            if (!hasAnyTarget) {
              console.warn('Tutorial: no matching targets rendered; centering walkthrough');
              setSteps(allSteps);
              setIsActive(true);
              return;
            }

            const missingSteps = allSteps.filter((step, index) => {
              if (step.target === 'body') return false;
              const element = document.querySelector(step.target);
              if (!element) {
                console.warn(`Tutorial fallback: step ${index + 1} "${step.title}" target missing (${step.target}). Will render centered.`);
                return true;
              }
              return false;
            }).length;

            if (missingSteps > 0) {
              console.info(`Tutorial: ${missingSteps} step(s) will render in center because targets are hidden.`);
            }

            setSteps(allSteps);
            setIsActive(true);
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Failed to check tutorial status:", error);
    }
  };

  const updateTooltipPosition = () => {
    if (!steps[currentStep]) return;

    const step = steps[currentStep];
    
    // For 'body' or 'center' placement, center the tooltip
    if (step.target === 'body' || step.placement === 'center') {
      const tooltipWidth = 380;
      const tooltipHeight = 200;
      setTooltipPosition({
        top: window.innerHeight / 2 - tooltipHeight / 2,
        left: window.innerWidth / 2 - tooltipWidth / 2,
      });
      setPlacement('center');
      return;
    }

    const target = document.querySelector(step.target);
    
    // If target doesn't exist, center the tooltip and log warning
    if (!target) {
      console.warn(`Tutorial target not found: ${step.target}`);
      const tooltipWidth = 380;
      const tooltipHeight = 200;
      setTooltipPosition({
        top: window.innerHeight / 2 - tooltipHeight / 2,
        left: window.innerWidth / 2 - tooltipWidth / 2,
      });
      setPlacement('center');
      return;
    }

    const rect = target.getBoundingClientRect();
    const tooltipWidth = 380;
    const tooltipHeight = 250; // Increased for better content fit
    const gap = 20;

    let top = 0;
    let left = 0;
    const currentPlacement = step.placement || 'bottom';

    if (currentPlacement === 'bottom') {
      top = rect.bottom + gap + window.scrollY;
      left = rect.left + (rect.width / 2) - (tooltipWidth / 2) + window.scrollX;
    } else if (currentPlacement === 'top') {
      top = rect.top - tooltipHeight - gap + window.scrollY;
      left = rect.left + (rect.width / 2) - (tooltipWidth / 2) + window.scrollX;
    } else if (currentPlacement === 'left') {
      top = rect.top + (rect.height / 2) - (tooltipHeight / 2) + window.scrollY;
      left = rect.left - tooltipWidth - gap + window.scrollX;
    } else if (currentPlacement === 'right') {
      top = rect.top + (rect.height / 2) - (tooltipHeight / 2) + window.scrollY;
      left = rect.right + gap + window.scrollX;
    } else if (currentPlacement === 'center') {
      top = window.innerHeight / 2 - tooltipHeight / 2;
      left = window.innerWidth / 2 - tooltipWidth / 2;
    }

    // Keep tooltip in viewport
    const padding = 10;
    if (left < padding) left = padding;
    if (left + tooltipWidth > window.innerWidth - padding) {
      left = window.innerWidth - tooltipWidth - padding;
    }
    if (top < padding) top = padding;
    if (top + tooltipHeight > window.innerHeight - padding) {
      top = window.innerHeight - tooltipHeight - padding;
    }

    setTooltipPosition({ top, left });
    setPlacement(currentPlacement);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    completeTutorial();
  };

  // Get current step data before any conditional returns
  const currentStepData = isActive && steps.length > 0 ? steps[currentStep] : null;
  const target = currentStepData && currentStepData.target !== 'body' ? document.querySelector(currentStepData.target) : null;
  const targetRect = target ? target.getBoundingClientRect() : null;

  // Elevate the target element - must be before conditional return
  useEffect(() => {
    if (isActive && target && target instanceof HTMLElement) {
      // Store original styles
      const originalStyles = {
        position: target.style.position,
        zIndex: target.style.zIndex,
        pointerEvents: target.style.pointerEvents,
        filter: target.style.filter,
      };
      
      // Apply tutorial styles
      target.style.position = 'relative';
      target.style.zIndex = '10001';
      target.style.pointerEvents = 'auto';
      target.style.filter = 'none'; // Remove any blur effects
      
      return () => {
        // Restore original styles
        target.style.position = originalStyles.position;
        target.style.zIndex = originalStyles.zIndex;
        target.style.pointerEvents = originalStyles.pointerEvents;
        target.style.filter = originalStyles.filter;
      };
    }
  }, [isActive, target]);

  if (!isActive || steps.length === 0 || !currentStepData) {
    return null;
  }

  return (
    <>
      {/* Overlay with cutout effect */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998]"
        style={{
          background: target && targetRect && currentStepData.target !== 'body'
            ? `radial-gradient(
                circle at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px,
                transparent ${Math.max(targetRect.width, targetRect.height) / 2 + 30}px,
                rgba(0, 0, 0, 0.85) ${Math.max(targetRect.width, targetRect.height) / 2 + 60}px
              )`
            : 'rgba(0, 0, 0, 0.85)',
          pointerEvents: 'none',
        }}
      />

      {/* Spotlight highlight */}
      {target && targetRect && currentStepData.target !== 'body' && (
        <>
          {/* Glow border effect */}
          <motion.div
            key={`spotlight-${currentStep}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed z-[10001] pointer-events-none"
            style={{
              top: targetRect.top - 8 + window.scrollY,
              left: targetRect.left - 8 + window.scrollX,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
            }}
          >
            <div className="absolute inset-0 border-4 border-purple-500 rounded-xl shadow-2xl shadow-purple-500/50 animate-pulse" 
              style={{
                filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.8))',
              }}
            />
          </motion.div>
        </>
      )}

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="fixed z-[10002] w-[380px] max-h-[90vh] overflow-y-auto rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950 via-black to-black shadow-2xl"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
          }}
        >
          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-3 right-3 p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition z-10"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Content */}
          <div className="p-6 pr-12">
            {/* Title */}
            <h3 className="text-xl font-bold text-white mb-3">
              {currentStepData.title}
            </h3>

            {/* Content */}
            <p className="text-sm text-zinc-300 leading-relaxed mb-6 whitespace-pre-wrap">
              {currentStepData.content}
            </p>

            {/* Progress */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-zinc-500">
                Step {currentStep + 1} of {steps.length}
              </span>
              <div className="flex gap-1">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 rounded-full transition-all ${
                      index === currentStep
                        ? 'w-6 bg-purple-500'
                        : index < currentStep
                        ? 'w-1.5 bg-purple-500/50'
                        : 'w-1.5 bg-white/20'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handleSkip}
                className="text-sm text-zinc-400 hover:text-white transition"
              >
                Skip Tour
              </button>

              <div className="flex gap-2">
                {currentStep > 0 && (
                  <button
                    onClick={handleBack}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium transition flex items-center gap-1"
                >
                  {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                  {currentStep < steps.length - 1 && <ChevronRight className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
