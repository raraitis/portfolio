export function ContactInfo() {
  const contactMethods = [
    {
      label: 'Email',
      value: 'hello@raitisk.dev',
      href: 'mailto:hello@raitisk.dev'
    },
    {
      label: 'LinkedIn',
      value: 'linkedin.com/in/raitiskraslovskis',
      href: 'https://linkedin.com/in/raitiskraslovskis'
    },
    {
      label: 'GitHub',
      value: 'github.com/raitiskraslovskis',
      href: 'https://github.com/raitiskraslovskis'
    }
  ]

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-medium text-gray-900 mb-6">
          Let's Connect
        </h3>
        <p className="text-gray-600 leading-relaxed mb-8">
          I'm always interested in new opportunities and collaborations. 
          Whether you have a project in mind or just want to chat about 
          technology, feel free to reach out.
        </p>
      </div>

      <div className="space-y-4">
        {contactMethods.map((method) => (
          <div key={method.label} className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700 w-20">
              {method.label}
            </span>
            <a
              href={method.href}
              target={method.href.startsWith('http') ? '_blank' : undefined}
              rel={method.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              {method.value}
            </a>
          </div>
        ))}
      </div>

      <div className="pt-8 border-t border-gray-200">
        <h4 className="text-lg font-medium text-gray-900 mb-4">
          What I Can Help With
        </h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>• Web application development</li>
          <li>• Mobile app development (iOS & Android)</li>
          <li>• API design and backend services</li>
          <li>• UI/UX implementation</li>
          <li>• Performance optimization</li>
          <li>• Technical consultation</li>
        </ul>
      </div>
    </div>
  )
}
