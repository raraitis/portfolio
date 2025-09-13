import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact - Raitis Kraslovskis',
  description: 'Get in touch for web and mobile development projects',
}

export default function ContactPage() {
  return (
    <div className='min-h-screen py-20 relative z-10'>
      <div className='max-w-4xl mx-auto px-6 pt-16'>
        <div className='space-y-16'>
          <div>
            <h1 className='text-4xl md:text-6xl font-normal text-black mb-8 tracking-tight'>
              CONTACT
            </h1>
          </div>

          <div className='space-y-8'>
            <div className='space-y-6'>
              <div className='flex'>
                <span className='text-gray-900 w-20'>Email</span>
                <a
                  href='mailto:raraitis@gmail.com'
                  className='text-gray-600 hover:text-black transition-colors'
                >
                  raraitis@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}