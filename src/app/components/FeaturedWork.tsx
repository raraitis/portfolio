import Link from 'next/link'

export function FeaturedWork() {
  const projects = [
    {
      id: 1,
      title: 'E-Commerce Platform',
      description: 'Full-stack e-commerce solution with payment integration',
      tech: ['Next.js', 'TypeScript', 'Stripe', 'PostgreSQL'],
      year: '2024'
    },
    {
      id: 2,
      title: 'Mobile Fitness App',
      description: 'React Native app for endurance training tracking',
      tech: ['React Native', 'Firebase', 'Redux'],
      year: '2024'
    },
    {
      id: 3,
      title: 'Dashboard Analytics',
      description: 'Real-time analytics dashboard for SaaS platform',
      tech: ['React', 'D3.js', 'Node.js', 'MongoDB'],
      year: '2023'
    }
  ]

  return (
    <section className="py-20 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-16">
          <h2 className="text-3xl md:text-4xl font-light text-gray-900">
            Featured Work
          </h2>
          
          <Link
            href="/work"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            View All Projects →
          </Link>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-lg p-8 hover:shadow-lg transition-shadow cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-gray-500 font-medium">
                  {project.year}
                </span>
              </div>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3 group-hover:text-gray-600 transition-colors">
                {project.title}
              </h3>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                {project.description}
              </p>
              
              <div className="flex flex-wrap gap-2">
                {project.tech.map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
