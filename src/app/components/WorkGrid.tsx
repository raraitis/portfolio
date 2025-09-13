export function WorkGrid() {
  const projects = [
    {
      id: 1,
      title: 'E-Commerce Platform',
      description: 'Full-stack e-commerce solution with payment integration, inventory management, and admin dashboard.',
      tech: ['Next.js', 'TypeScript', 'Stripe', 'PostgreSQL', 'Tailwind CSS'],
      year: '2024',
      category: 'Web Application'
    },
    {
      id: 2,
      title: 'Mobile Fitness App',
      description: 'React Native app for endurance training tracking with GPS integration and social features.',
      tech: ['React Native', 'Firebase', 'Redux', 'Google Maps API'],
      year: '2024',
      category: 'Mobile App'
    },
    {
      id: 3,
      title: 'Dashboard Analytics',
      description: 'Real-time analytics dashboard for SaaS platform with custom visualizations.',
      tech: ['React', 'D3.js', 'Node.js', 'MongoDB', 'Socket.io'],
      year: '2023',
      category: 'Web Application'
    },
    {
      id: 4,
      title: 'Task Management System',
      description: 'Collaborative project management tool with real-time updates and team features.',
      tech: ['Vue.js', 'Express.js', 'Socket.io', 'PostgreSQL'],
      year: '2023',
      category: 'Web Application'
    },
    {
      id: 5,
      title: 'Restaurant Booking App',
      description: 'Mobile app for restaurant reservations with payment integration and review system.',
      tech: ['React Native', 'Node.js', 'MongoDB', 'Stripe'],
      year: '2023',
      category: 'Mobile App'
    },
    {
      id: 6,
      title: 'Portfolio Website',
      description: 'Modern, responsive portfolio website built with Next.js and optimized for performance.',
      tech: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Vercel'],
      year: '2024',
      category: 'Website'
    }
  ]

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {projects.map((project) => (
        <div
          key={project.id}
          className="group cursor-pointer"
        >
          <div className="bg-white rounded-lg p-8 hover:shadow-lg transition-all duration-300 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                {project.category}
              </span>
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
                  className="px-3 py-1 bg-gray-50 text-gray-600 text-xs rounded-full"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
