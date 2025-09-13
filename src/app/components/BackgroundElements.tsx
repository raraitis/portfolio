export default function BackgroundElements() {
  return (
    <>
      {/* Background with gradient, sphere, and dot pattern */}
      <div className="fixed inset-0 overflow-hidden">
        {/* Gradient background */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at 20% 80%, rgba(245, 238, 231, 0.8) 0%, transparent 50%),
              linear-gradient(135deg, #f5f0e8 0%, #f0ebe2 25%, #ede8dc 50%, #e8e3d6 75%, #e3ded0 100%)
            `
          }}
        />
        
        {/* Dot pattern */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(139, 125, 107, 0.3) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />
        
        {/* Gravity sphere */}
        <div 
          className="absolute w-96 h-96 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(139, 125, 107, 0.4) 0%, transparent 70%)',
            right: '10%',
            top: '20%',
            filter: 'blur(40px)'
          }}
        />
      </div>

      {/* Visual frame border */}
      <div className="fixed inset-0 pointer-events-none z-30">
        <div 
          className="absolute inset-5 rounded-lg"
          style={{ 
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: '#a09280',
            opacity: 0.4 
          }}
        />
      </div>
    </>
  )
}
