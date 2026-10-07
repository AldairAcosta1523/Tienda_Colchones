/** Wordmark Almara: solo el nombre, en Newsreader con el tracking cerrado. */
export default function Wordmark({ className = "" }: { className?: string; light?: boolean }) {
  return (
    <span className={`wordmark ${className}`}>
      <span className="wordmark__name">Almara</span>
    </span>
  );
}
