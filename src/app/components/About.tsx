export function About() {
  const skills = [
    'TypeScript', 'React', 'Next.js', 'Node.js',
    'React Native', 'Tailwind CSS', 'PostgreSQL', 'MongoDB'
  ]

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-8">
              About Me
            </h2>
            
            <div className="space-y-6 text-gray-600 leading-relaxed">
              <p>
                I'm a passionate full-stack developer with expertise in building 
                scalable web applications and mobile experiences. I focus on writing 
                clean, efficient code while creating intuitive user interfaces.
              </p>
              
              <p>
                When I'm not coding, you can find me training for endurance sports 
                or exploring new technologies. I believe in continuous learning 
                and staying up-to-date with industry best practices.
              </p>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-medium text-gray-900 mb-6">
              Technologies I Work With
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              {skills.map((skill) => (
                <div
                  key={skill}
                  className="px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-700"
                >
                  {skill}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
