import Typewriter from './Typewriter';
import BackgroundElements from './BackgroundElements';

export function About() {
  return (
    <>
      <BackgroundElements />
      <section className='py-20 px-6 relative z-10'>
        <div className='max-w-6xl mx-auto text-center'>
          <h2 className='text-3xl md:text-4xl font-light text-gray-900 mb-8'>
            About Me
          </h2>

          <div className='max-w-2xl mx-auto'>
            <Typewriter
              text='you think it. i make it. you break it. i fix it. we happy'
              delay={80}
              className='text-lg text-gray-500'
            />
          </div>
        </div>
      </section>
    </>
  );
}
