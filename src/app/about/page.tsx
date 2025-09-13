'use client'

import { motion } from 'framer-motion';
import Typewriter from '../components/Typewriter';

export default function AboutPage() {
  return (
    <div className='min-h-screen bg-white relative z-10'>
      <div className='max-w-4xl mx-auto px-6 py-20'>
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className='mb-16'
        >
          <h1 className='text-5xl md:text-6xl font-light text-gray-900 mb-8'>
            About
          </h1>
        </motion.div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
          className='text-center'
        >
          <p className='text-xl md:text-2xl font-light text-gray-600 leading-relaxed mb-8'>
            endurance sports + web development
          </p>

          <Typewriter
            text='you think it. i make it. you break it. i solve it. we happy. thats a deal.'
            delay={80}
            className='text-lg text-gray-500'
          />
        </motion.div>
      </div>
    </div>
  );
}
