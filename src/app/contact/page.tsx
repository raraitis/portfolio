import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact - Raitis Kraslovskis',
  description: 'Get in touch for web and mobile development projects',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-6 pt-16">
        <div className="space-y-16">
          <div>
            <h1 className="text-4xl md:text-6xl font-normal text-black mb-8 tracking-tight">
              CONTACT
            </h1>
            
            <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mb-12">
              Interested in working together? I'd love to hear about your project 
              and discuss how we can bring your ideas to life.
            </p>
          </div>

          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex">
                <span className="text-gray-900 w-20">Email</span>
                <a 
                  href="mailto:hello@raitisk.dev" 
                  className="text-gray-600 hover:text-black transition-colors"
                >
                  hello@raitisk.dev
                </a>
              </div>
              
              <div className="flex">
                <span className="text-gray-900 w-20">LinkedIn</span>
                <a 
                  href="https://linkedin.com/in/raitiskraslovskis" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-black transition-colors"
                >
                  linkedin.com/in/raitiskraslovskis
                </a>
              </div>
              
              <div className="flex">
                <span className="text-gray-900 w-20">GitHub</span>
                <a 
                  href="https://github.com/raitiskraslovskis" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-black transition-colors"
                >
                  github.com/raitiskraslovskis
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
