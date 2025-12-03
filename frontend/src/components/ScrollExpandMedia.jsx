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
      className='transition-colors duration-700 ease-in-out overflow-x-hidden bg-black'
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
              src="https://www.shutterstock.com/image-photo/innovative-financial-technology-banking-concept-600nw-2487960615.jpg"
              alt='Background'
              className='w-screen h-screen object-cover'
            />
            <div className='absolute inset-0 bg-black/20' />
          </motion.div>
          <div className='container mx-auto flex flex-col items-center justify-start relative z-10'>
            <div className='flex flex-col items-center justify-center w-full h-[100dvh] relative'>
              {/* Horizontal Image Gallery */}
              <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10'>
                <div 
                  className='flex items-center justify-center gap-4 transition-all duration-300 ease-out'
                  style={{
                    // No gallery scale after transition
                    transform: 'scale(1)',
                  }}
                >
                  {/* Left Image - hidden until scroll */}
                  <motion.div
                    className='relative overflow-hidden rounded-2xl shadow-2xl'
                    style={{
                      width: '260px',
                      height: '390px',
                      opacity: scrollProgress > 0.2 ? 1 : 0,
                      pointerEvents: scrollProgress > 0.2 ? 'auto' : 'none',
                    }}
                    animate={{
                      x: scrollProgress > 0.2 ? -100 : 0,
                      rotateY: scrollProgress > 0.2 ? -15 : 0,
                      opacity: scrollProgress > 0.2 ? 1 : 0,
                      scale: 1,
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <img
                      src="https://media.istockphoto.com/id/182182451/photo/market-analyze.jpg?s=612x612&w=0&k=20&c=7EhLL0CyNUHOTPvhy8AnGYMMkr-TE7r0R-1w1EvXYiU="
                      alt="Banking feature 1"
                      className='w-full h-full object-cover rounded-2xl shadow-2xl'
                    />
                  </motion.div>

                  {/* Center Image - starts as part of background, animates out on scroll */}
                  <motion.div
                    className='relative overflow-hidden rounded-2xl shadow-2xl z-10'
                    style={{
                      width: scrollProgress < 0.2 ? '100vw' : '280px',
                      height: scrollProgress < 0.2 ? '100vh' : '420px',
                      left: scrollProgress < 0.2 ? '0' : undefined,
                      top: scrollProgress < 0.2 ? '0' : undefined,
                      boxShadow: scrollProgress < 0.2 ? 'none' : undefined,
                      borderRadius: scrollProgress < 0.2 ? '0' : '1rem',
                      zIndex: 10,
                      transition: 'width 0.5s, height 0.5s',
                    }}
                    animate={{
                      x: 0,
                      scale: 1,
                      opacity: 1,
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <img
                      src="https://www.shutterstock.com/image-photo/innovative-financial-technology-banking-concept-600nw-2487960615.jpg"
                      alt="Banking feature center"
                      className='w-full h-full object-cover rounded-2xl shadow-2xl'
                      style={{ objectPosition: 'center 40%' }}
                    />
                  </motion.div>

                  {/* Right Image - hidden until scroll */}
                  <motion.div
                    className='relative overflow-hidden rounded-2xl shadow-2xl'
                    style={{
                      width: '260px',
                      height: '390px',
                      opacity: scrollProgress > 0.2 ? 1 : 0,
                      pointerEvents: scrollProgress > 0.2 ? 'auto' : 'none',
                    }}
                    animate={{
                      x: scrollProgress > 0.2 ? 100 : 0,
                      scale: 1,
                      opacity: scrollProgress > 0.2 ? 1 : 0,
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <img
                      src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRv2B9_vGC-9zamUwBkj7Q2elMP9yqjFOiuVQ&s"
                      alt="Banking feature 3"
                      className='w-full h-full object-cover rounded-2xl shadow-2xl'
                    />
                  </motion.div>
                </div>

                {/* Scroll indicator */}
                <div className='flex flex-col items-center text-center relative z-10 mt-8 transition-none'>
                  {date && (
                    <p
                      className='text-2xl text-white/80'
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

              <div
                className={`flex items-center justify-center text-center gap-4 w-full relative z-10 transition-none flex-col ${
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
              </div>
            </div>

            <motion.section
              className='flex flex-col items-center justify-center text-center w-full px-8 pt-2 pb-2 md:px-16'
              style={{ marginTop: '16px', marginBottom: '0px' }}
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
