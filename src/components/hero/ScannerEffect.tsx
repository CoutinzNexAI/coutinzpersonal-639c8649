
interface ScannerEffectProps {
  isLoaded: boolean;
}

const ScannerEffect = ({ isLoaded }: ScannerEffectProps) => {
  return (
    <div 
      className={`absolute inset-0 bg-gradient-to-b from-transparent via-cosmic-blue/20 to-transparent w-full h-32 z-20 transition-opacity duration-700 ${
        isLoaded ? "opacity-100" : "opacity-0" 
      }`}
      style={{
        animation: 'scan-line 6s linear infinite',
        animationDelay: '2s'
      }}
    />
  );
};

export default ScannerEffect;
