export function Hero() {
  return (
    <section className="min-h-screen flex flex-col justify-center px-6 max-w-5xl mx-auto">
      <div className="space-y-6">
        {/* Name with subtle treatment */}
        <div className="space-y-2">
          <h1 className="text-7xl md:text-9xl font-light text-gray-900 leading-none tracking-tight">
            <span className="font-normal text-gray-800">RAITIS</span>
          </h1>
          <h2 className="text-7xl md:text-9xl font-extralight text-gray-600 leading-none tracking-wide -mt-4">
            KRASLOVSKIS
          </h2>
        </div>
        
        <div className="pt-8 space-y-4 max-w-2xl">
          <p className="text-lg text-gray-700 font-light tracking-wide">
            Full Stack Developer
          </p>
          
          <p className="text-base text-gray-500 leading-relaxed">
            Creating modern web applications and mobile experiences with 
            clean code and thoughtful design.
          </p>
        </div>
      </div>
    </section>
  )
}
