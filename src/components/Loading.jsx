import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";

const Loading = () => {
  const [progress, setProgress] = useState(13);
  const [dots, setDots] = useState("");

  // Barre de progression
  useEffect(() => {
    const firstTimer = setTimeout(() => setProgress(33), 500);
    const secondTimer = setTimeout(() => setProgress(72), 700);
    return () => {
      clearTimeout(firstTimer);
      clearTimeout(secondTimer);
    };
  }, []);

  // Animation des points
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Ajoute des espaces insécables pour "caler" le texte
  const paddedDots = dots.padEnd(3, "\u00A0");

  return (
    <div className="h-[80vh] flex items-center justify-center">
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-center m-8">
          Chargement en cours{paddedDots}
        </h1>
        <Progress value={progress} className="w-full mx-auto my-auto" />
      </div>
    </div>
  );
};

export default Loading;
