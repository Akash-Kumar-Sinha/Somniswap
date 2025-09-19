import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [isDark, setIsDark] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const sunRef = useRef<SVGSVGElement>(null);
  const moonRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const isDarkMode =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    setIsDark(isDarkMode);

    const ctx = gsap.context(() => {
      if (isDarkMode) {
        gsap.to(sunRef.current, {
          scale: 0,
          rotation: -90,
          duration: 0.3,
          ease: "power2.inOut",
        });
        gsap.to(moonRef.current, {
          scale: 1,
          rotation: 0,
          duration: 0.3,
          ease: "power2.inOut",
        });
      } else {
        gsap.to(sunRef.current, {
          scale: 1,
          rotation: 0,
          duration: 0.3,
          ease: "power2.inOut",
        });
        gsap.to(moonRef.current, {
          scale: 0,
          rotation: 90,
          duration: 0.3,
          ease: "power2.inOut",
        });
      }
    }, buttonRef);

    return () => ctx.revert();
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark";
    setTheme(newTheme);

    gsap.to(buttonRef.current, {
      scale: 0.9,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: "power2.out",
    });

    gsap.to(buttonRef.current, {
      rotationY: 180,
      duration: 0.4,
      ease: "back.out(1.7)",
      onComplete: () => {
        gsap.set(buttonRef.current, { rotationY: 0 });
      },
    });
  };

  return (
    <Button
      ref={buttonRef}
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="h-11 w-11 bg-[var(--color-background)] border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-all duration-200 shadow-lg hover:shadow-xl relative overflow-hidden"
      onMouseEnter={() => {
        gsap.to(buttonRef.current, {
          scale: 1.1,
          duration: 0.2,
          ease: "power2.out",
        });
      }}
      onMouseLeave={() => {
        gsap.to(buttonRef.current, {
          scale: 1,
          duration: 0.2,
          ease: "power2.out",
        });
      }}
    >
      <div className="relative">
        <Sun
          ref={sunRef}
          className="h-[1.3rem] w-[1.3rem] text-[var(--color-primary)] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        />
        <Moon
          ref={moonRef}
          className="h-[1.3rem] w-[1.3rem] text-[var(--color-primary)] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        />
      </div>
      <span className="sr-only">Toggle theme</span>

      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-primary)]/5 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
    </Button>
  );
}
