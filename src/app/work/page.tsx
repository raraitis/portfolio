import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Work - Raitis Kraslovskis',
  description: 'Portfolio of web and mobile development projects',
}

const projects = [
  {
    id: 1,
    title: 'E-Commerce Platform',
    description: 'Full-stack e-commerce solution with payment integration, inventory management, and admin dashboard.',
    tech: ['Next.js', 'TypeScript', 'Stripe', 'PostgreSQL'],
    year: '2024',
    url: '#'
  },
  {
    id: 2,
    title: 'Mobile Fitness App',
    description: 'React Native app for endurance training tracking with GPS integration and social features.',
    tech: ['React Native', 'Firebase', 'Redux'],
    year: '2024',
    url: '#'
  },
  {
    id: 3,
    title: 'Dashboard Analytics',
    description: 'Real-time analytics dashboard for SaaS platform with custom visualizations.',
    tech: ['React', 'D3.js', 'Node.js', 'MongoDB'],
    year: '2023',
    url: '#'
  },
]

export default function WorkPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-6 pt-16">
        <h1 className="text-4xl md:text-6xl font-normal text-black mb-16 tracking-tight">
          WORK
        </h1>
        
        <div className="space-y-16">
          {projects.map((project) => (
            <div key={project.id} className="border-b border-gray-100 pb-16 last:border-b-0">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl md:text-2xl font-normal text-black">
                  {project.title}
                </h2>
                <span className="text-sm text-gray-500">
                  {project.year}
                </span>
              </div>
              
              <p className="text-gray-600 mb-6 max-w-2xl leading-relaxed">
                {project.description}
              </p>
              
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
                {project.tech.map((tech, index) => (
                  <span key={tech}>
                    {tech}{index < project.tech.length - 1 ? ',' : ''}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
