
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Map, Compass, Clock, ArrowRight, Trash2 } from "lucide-react";
import { motion, useTransform, useMotionValue } from "framer-motion";

interface SavedTrip {
  id: string;
  name: string;
  date: string;
}

export default function Home() {
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);

  // Hero Parallax Setup
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    mouseX.set(clientX / innerWidth - 0.5);
    mouseY.set(clientY / innerHeight - 0.5);
  };

  const heroX = useTransform(mouseX, [-0.5, 0.5], [-20, 20]);
  const heroY = useTransform(mouseY, [-0.5, 0.5], [-20, 20]);
  const compassX = useTransform(mouseX, [-0.5, 0.5], [15, -15]);
  const compassY = useTransform(mouseY, [-0.5, 0.5], [15, -15]);

  useEffect(() => {
    const indexStr = localStorage.getItem("trip_index");
    if (indexStr) {
      try {
        setSavedTrips(JSON.parse(indexStr).reverse()); // Show newest first
      } catch (e) {
        console.error("Failed to parse saved trips", e);
      }
    }
  }, []);

  const handleDeleteTrip = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();

    if (confirm("Are you sure you want to delete this journey? This action cannot be undone.")) {
      const newTrips = savedTrips.filter(t => t.id !== id);
      setSavedTrips(newTrips);
      localStorage.setItem("trip_index", JSON.stringify(newTrips.slice().reverse()));
      localStorage.removeItem(`trip_${id}`);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <div
      className="flex flex-col items-center min-h-screen p-8 sm:p-20 text-center overflow-x-hidden relative"
      onMouseMove={handleMouseMove}
    >
      {/* Animated Background Layers */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Soft Gradient Vignette */}
        <div className="absolute inset-0 bg-radial-[circle_at_center_var(--tw-gradient-stops)] from-transparent via-background/80 to-background" />

        {/* Animated Orbs */}
        <motion.div
          className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[100px]"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px]"
          animate={{
            x: [0, -50, 0],
            y: [0, -40, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <header className="flex flex-col items-center space-y-6 mb-16 flex-grow relative z-10 perspective-1000">
        <motion.div
          style={{ x: compassX, y: compassY }}
          className="relative group cursor-pointer"
          whileHover={{ scale: 1.1, rotate: 360 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        >
          <div className="absolute inset-0 bg-secondary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="p-6 rounded-full border-2 border-primary/20 bg-card/80 backdrop-blur-sm shadow-xl relative">
            <Compass className="w-20 h-20 text-secondary" strokeWidth={1} />
          </div>
        </motion.div>

        <motion.div style={{ x: heroX, y: heroY }}>
          <h1 className="text-6xl sm:text-8xl font-serif text-primary tracking-wide drop-shadow-sm">
            The Voyager
          </h1>
          <div className="h-1 w-24 bg-gradient-to-r from-transparent via-secondary/50 to-transparent mx-auto mt-6 mb-6" />
          <p className="text-xl sm:text-2xl text-primary/80 max-w-2xl font-light italic mt-4 leading-relaxed">
            &quot;A journey of a thousand miles begins with a single step.&quot;
          </p>
        </motion.div>
      </header>

      <main className="flex flex-col gap-16 items-center w-full max-w-5xl z-10">

        <div className="w-full max-w-lg cursor-pointer transform transition-all duration-300 hover:-translate-y-1">
          <div className="p-10 bg-card/90 backdrop-blur-md border border-primary/10 shadow-xl rounded-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <p className="text-lg mb-8 leading-relaxed relative z-10 text-primary/90 font-light">
              Craft your perfect itinerary with our AI-powered travel assistant.
              Specializing in Asian aesthetics, history, and culture.
            </p>

            <Link
              href="/plan"
              className="relative z-10 inline-flex items-center gap-2 px-10 py-4 bg-secondary text-white rounded-lg text-lg hover:bg-secondary/90 transition-all shadow-md font-serif tracking-wider hover:shadow-xl hover:scale-105 active:scale-95"
            >
              <Map className="w-5 h-5" />
              Start Your Journey
            </Link>
          </div>
        </div>

        {/* Saved Trips Section */}
        {savedTrips.length > 0 && (
          <div className="w-full">
            <div className="flex items-center justify-center gap-4 mb-10">
              <div className="h-px w-12 bg-primary/20" />
              <h2 className="text-3xl font-serif text-primary/80 flex items-center justify-center gap-2">
                <Clock className="w-6 h-6 text-accent" /> My Past Journeys
              </h2>
              <div className="h-px w-12 bg-primary/20" />
            </div>

            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-left"
            >
              {savedTrips.map((trip) => (
                <motion.div key={trip.id} variants={item}>
                  <Link
                    href={`/trip/${trip.id}`}
                    className="group block h-full p-6 bg-card/80 backdrop-blur-sm border border-primary/5 rounded-xl hover:border-secondary/30 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative"
                  >
                    <h3 className="font-bold text-xl font-serif text-primary group-hover:text-secondary truncate pr-8 transition-colors">{trip.name}</h3>
                    <div className="flex items-center justify-between mt-4 text-sm text-primary/60 font-medium">
                      <span>{trip.date}</span>
                      <ArrowRight className="w-4 h-4 text-secondary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </div>

                    {/* Delete Button */}
                    <div
                      onClick={(e) => handleDeleteTrip(e, trip.id)}
                      className="absolute top-4 right-4 p-2 text-primary/20 hover:text-red-600 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-20"
                      title="Delete Trip"
                    >
                      <Trash2 className="w-4 h-4" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}
      </main>

      <footer className="mt-24 text-sm text-primary/40 relative z-10 flex flex-col items-center gap-2">
        <div className="w-8 h-8 opacity-20 hover:opacity-100 transition-opacity">
          <Compass />
        </div>
        <p>Est. 2025 • Crafted with patience and code</p>
      </footer>
    </div>
  );
}

