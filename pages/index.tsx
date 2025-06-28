import Link from 'next/link';
import Head from 'next/head';
import styles from '../styles/index.module.css';

function Index() {
  return (
    <>
      <Head>
        <title>OpenBand Piano Studio</title>
        <meta name="description" content="Professional virtual piano with recording and playback features" />
      </Head>
      
      <div className={styles.container}>
        <div className={styles.content}>
          {/* Header */}
          <div className={styles.header}>
            <h1 className={styles.title}>
              OpenBand
            </h1>
            <h2 className={styles.subtitle}>
              Piano Studio
            </h2>
            <p className={styles.description}>
              Experience a professional virtual piano with advanced recording capabilities, 
              real-time playback, and studio-quality sound. Perfect for musicians of all levels.
            </p>
          </div>

          {/* Features Grid */}
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h3 className={styles.featureTitle}>High-Quality Sound</h3>
              <p className={styles.featureDescription}>Professional acoustic piano samples with realistic dynamics</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Advanced Recording</h3>
              <p className={styles.featureDescription}>Record with precise timing and velocity sensitivity</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Instant Playback</h3>
              <p className={styles.featureDescription}>Play back recordings with perfect timing</p>
            </div>
          </div>

          {/* CTA Button */}
          <div>
            <Link href="/piano" className={styles.ctaButton}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
              Launch Piano Studio
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default Index;
