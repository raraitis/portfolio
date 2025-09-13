'use client'

import type { Metadata } from 'next'
import { motion } from 'framer-motion'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-20">
        {/* Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-light text-gray-900 mb-8">About</h1>
        </motion.div>

        {/* Photo Placeholder */}
        <motion.div
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="mb-12"
        >
          <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
            Photo placeholder
          </div>
        </motion.div>

        {/* Introduction */}
        <motion.div
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="mb-12"
        >
          <p className="text-xl md:text-2xl font-light text-gray-800 leading-relaxed mb-8">
            I'm Raitis. A developer, endurance athlete and problem solver.
          </p>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          className="mb-16"
        >
          <div className="space-y-6 text-gray-700 text-lg leading-relaxed">
            <p>
              The rhythm of code and the rhythm of running have always been connected for me. Whether I'm debugging a complex algorithm at 2am or pushing through the final kilometers of a triathlon, I've learned that persistence and problem-solving go hand in hand. I've been building with code since I discovered programming, and racing since I could lace up running shoes.
            </p>
            
            <p>
              From early morning swim sessions to late-night coding marathons, I thrive on the discipline and focus that both worlds demand. The same mindset that gets me through century bike rides helps me architect scalable applications. The patience learned from long training runs translates perfectly to debugging and iterative development.
            </p>
            
            <p>
              What excites me most is building digital solutions that actually matter - tools that help people achieve their goals, whether that's a training app that helps runners reach their PR, or a business platform that streamlines operations. Like in endurance sports, it's about going the distance and delivering something meaningful.
            </p>
          </div>
        </motion.div>

        {/* Quote */}
        <motion.div
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
          className="mb-16 pl-8 border-l-2 border-gray-200"
        >
          <p className="text-lg italic text-gray-600 mb-4">
            "The miracle isn't that I finished. The miracle is that I had the courage to start."
          </p>
          <p className="text-sm text-gray-500">— John Bingham</p>
          
          <p className="text-gray-700 mt-6 leading-relaxed">
            This speaks to me both in athletics and in development. Every project starts with that first line of code, every race starts with that first step. The courage to begin something challenging, knowing it will test your limits, is what separates dreamers from doers.
          </p>
        </motion.div>

        {/* Skills */}
        <motion.div
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.0, ease: "easeOut" }}
          className="mb-16"
        >
          <h2 className="text-3xl font-light text-gray-900 mb-8">Skills</h2>
          <p className="text-gray-700 leading-relaxed">
            Full-Stack Development / JavaScript & TypeScript / React & Next.js / Node.js & Express / 
            Database Design / API Development / Cloud Architecture / Mobile Development / 
            UI/UX Design / Performance Optimization / Swimming / Running / Cycling / Triathlon Training
          </p>
        </motion.div>

        {/* CV Link */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2, ease: "easeOut" }}
          className="mb-16"
        >
          <a 
            href="#" 
            className="inline-block text-gray-900 hover:text-gray-600 transition-colors duration-300 border-b border-gray-300 hover:border-gray-600 pb-1"
          >
            My CV
          </a>
        </motion.div>

        {/* Acknowledgments */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.4, ease: "easeOut" }}
        >
          <h2 className="text-3xl font-light text-gray-900 mb-8">Acknowledgments</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Every finish line, whether in code or on the race course, represents countless hours of support from incredible people. 
            The mentors who reviewed my first pull requests, the training partners who pushed me through tough workouts, 
            and the community that celebrates both personal bests and successful deployments.
          </p>
          <p className="text-gray-600 italic">
            To my coaches, teammates, mentors, and the amazing developer community. THANK YOU.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
