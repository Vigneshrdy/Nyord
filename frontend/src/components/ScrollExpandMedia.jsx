import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const ScrollExpandMedia = ({
  title = "Modern Digital Banking",
  date = "2024",
  scrollToExpand = "Scroll to explore",
  textBlend = false,
  children,
}) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [mediaFullyExpanded, setMediaFullyExpanded] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const [isMobileState, setIsMobileState] = useState(false);

  const sectionRef = useRef(null);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobileState(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {
    const handleWheel = (e) => {
      if (mediaFullyExpanded && e.deltaY < 0 && window.scrollY <= 5) {
        setMediaFullyExpanded(false);
        e.preventDefault();
      } else if (!mediaFullyExpanded) {
        e.preventDefault();
        const scrollDelta = e.deltaY * 0.0009;
        const newProgress = Math.min(
          Math.max(scrollProgress + scrollDelta, 0),
          1
        );
        setScrollProgress(newProgress);

        if (newProgress >= 1) {
          setMediaFullyExpanded(true);
          setShowContent(true);
        } else if (newProgress < 0.75) {
          setShowContent(false);
        }
      }
    };

    const handleTouchStart = (e) => {
      setTouchStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e) => {
      if (!touchStartY) return;

      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;

      if (mediaFullyExpanded && deltaY < -20 && window.scrollY <= 5) {
        setMediaFullyExpanded(false);
        e.preventDefault();
      } else if (!mediaFullyExpanded) {
        e.preventDefault();
        const scrollFactor = deltaY < 0 ? 0.008 : 0.005;
        const scrollDelta = deltaY * scrollFactor;
        const newProgress = Math.min(
          Math.max(scrollProgress + scrollDelta, 0),
          1
        );
        setScrollProgress(newProgress);

        if (newProgress >= 1) {
          setMediaFullyExpanded(true);
          setShowContent(true);
        } else if (newProgress < 0.75) {
          setShowContent(false);
        }

        setTouchStartY(touchY);
      }
    };

    const handleTouchEnd = () => {
      setTouchStartY(0);
    };

    const handleScroll = () => {
      if (!mediaFullyExpanded) {
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [scrollProgress, mediaFullyExpanded, touchStartY]);

  const textTranslateX = scrollProgress * (isMobileState ? 180 : 150);
  const firstWord = title ? title.split(' ')[0] : '';
  const restOfTitle = title ? title.split(' ').slice(1).join(' ') : '';

  return (
    <div
      ref={sectionRef}
      className='transition-colors duration-700 ease-in-out overflow-x-hidden'
    >
      <section className='relative flex flex-col items-center justify-start min-h-[100dvh]'>
        <div className='relative w-full flex flex-col items-center min-h-[100dvh]'>
          <motion.div
            className='absolute inset-0 z-0 h-full'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 - scrollProgress }}
            transition={{ duration: 0.1 }}
          >
            <img
              src="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1920&h=1080&fit=crop"
              alt='Background'
              className='w-screen h-screen object-cover'
            />
            <div className='absolute inset-0 bg-black/20' />
          </motion.div>

          <div className='container mx-auto flex flex-col items-center justify-start relative z-10'>
            <div className='flex flex-col items-center justify-between w-full h-[100dvh] relative'>
              {/* Hero Text Section - Top of viewport */}
              <div
                className={`flex items-center justify-center text-center gap-4 w-full relative z-20 transition-none flex-col pt-20 ${
                  textBlend ? 'mix-blend-difference' : 'mix-blend-normal'
                }`}
              >
                <motion.h2
                  className='text-4xl md:text-5xl lg:text-6xl font-bold text-white transition-none'
                  style={{ transform: `translateX(-${textTranslateX}vw)` }}
                >
                  {firstWord}
                </motion.h2>
                <motion.h2
                  className='text-4xl md:text-5xl lg:text-6xl font-bold text-center text-white transition-none'
                  style={{ transform: `translateX(${textTranslateX}vw)` }}
                >
                  {restOfTitle}
                </motion.h2>
                
                {/* Date and Scroll Indicator */}
                <div className='flex flex-col items-center text-center relative z-10 mt-8 transition-none'>
                  {date && (
                    <p
                      className='text-2xl text-white/80 mb-3'
                      style={{ transform: `translateX(-${textTranslateX}vw)` }}
                    >
                      {date}
                    </p>
                  )}
                  {scrollToExpand && (
                    <motion.p
                      className='text-white/90 font-medium text-center text-lg'
                      style={{ transform: `translateX(${textTranslateX}vw)` }}
                      animate={{ opacity: 1 - scrollProgress }}
                    >
                      {scrollToExpand}
                    </motion.p>
                  )}
                </div>
              </div>

              {/* Horizontal Image Gallery - Bottom of viewport */}
              <div className='relative z-10 flex justify-center items-center w-full pb-16'>
                <div 
                  className='flex items-center justify-center gap-4 transition-all duration-300 ease-out'
                  style={{
                    transform: `scale(${0.8 + scrollProgress * 0.4})`,
                    opacity: 1 - scrollProgress * 0.3,
                  }}
                >
                  {/* Image 1 - Hidden initially, appears on scroll */}
                  <motion.div
                    className='relative overflow-hidden rounded-2xl shadow-2xl'
                    style={{
                      width: `${200 + scrollProgress * (isMobileState ? 150 : 300)}px`,
                      height: `${300 + scrollProgress * (isMobileState ? 100 : 200)}px`,
                    }}
                    animate={{
                      x: scrollProgress < 0.3 ? -200 : -scrollProgress * (isMobileState ? 100 : 200),
                      rotateY: scrollProgress * -15,
                      opacity: scrollProgress < 0.3 ? 0 : 1,
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <img
                      src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=500&h=700&fit=crop"
                      alt="Banking feature 1"
                      className='w-full h-full object-cover'
                    />
                    <div className='absolute inset-0 bg-gradient-to-t from-black/50 to-transparent' />
                  </motion.div>

                  {/* Image 2 - Main center image, always visible */}
                  <motion.div
                    className='relative overflow-hidden rounded-2xl shadow-2xl z-10'
                    style={{
                      width: `${240 + scrollProgress * (isMobileState ? 200 : 400)}px`,
                      height: `${360 + scrollProgress * (isMobileState ? 150 : 300)}px`,
                    }}
                    animate={{
                      x: -scrollProgress * (isMobileState ? 50 : 100),
                      scale: 1 + scrollProgress * 0.2,
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <img
                      src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500&h=700&fit=crop"
                      alt="Banking feature 2"
                      className='w-full h-full object-cover'
                    />
                    <div className='absolute inset-0 bg-gradient-to-t from-black/40 to-transparent' />
                  </motion.div>

                  {/* Image 3 - Hidden initially, appears on scroll */}
                  <motion.div
                    className='relative overflow-hidden rounded-2xl shadow-2xl'
                    style={{
                      width: `${220 + scrollProgress * (isMobileState ? 180 : 350)}px`,
                      height: `${330 + scrollProgress * (isMobileState ? 120 : 250)}px`,
                    }}
                    animate={{
                      x: scrollProgress < 0.3 ? 200 : scrollProgress * (isMobileState ? 50 : 100),
                      scale: 1 + scrollProgress * 0.15,
                      opacity: scrollProgress < 0.3 ? 0 : 1,
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <img
                      src="https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=500&h=700&fit=crop"
                      alt="Banking feature 3"
                      className='w-full h-full object-cover'
                    />
                    <div className='absolute inset-0 bg-gradient-to-t from-black/50 to-transparent' />
                  </motion.div>
                </div>
              </div>
            </div>

            <motion.section
              className='flex flex-col w-full px-8 py-10 md:px-16 lg:py-20'
              initial={{ opacity: 0 }}
              animate={{ opacity: showContent ? 1 : 0 }}
              transition={{ duration: 0.7 }}
            >
              {children}
            </motion.section>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ScrollExpandMedia;
