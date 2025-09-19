import { Badge } from "./ui/badge";
import type { Address } from "viem";
import { ModeToggle } from "./ModeToggle";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface HeaderProps {
  address: Address;
}

const Header = ({ address }: HeaderProps) => {
  const headerRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const titleRef = useRef<HTMLSpanElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const modeToggleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(
        [
          headerRef.current,
          logoRef.current,
          titleRef.current,
          badgeRef.current,
          modeToggleRef.current,
        ],
        {
          opacity: 0,
          y: -50,
        }
      );
      gsap.fromTo(
        headerRef.current,
        { y: -100, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          delay: 0.2,
        }
      );

      gsap.to(
        [
          logoRef.current,
          titleRef.current,
          badgeRef.current,
          modeToggleRef.current,
        ],
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "back.out(1.7)",
          stagger: 0.1,
          delay: 0.5,
        }
      );

      gsap.fromTo(
        logoRef.current,
        { rotation: 0 },
        {
          rotation: 360,
          duration: 2,
          ease: "power2.inOut",
        }
      );

      gsap.to(logoRef.current, {
        y: -2,
        duration: 2,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1,
        delay: 1.5,
      });
    }, headerRef);

    return () => ctx.revert();
  }, []);

  return (
    <header
      ref={headerRef}
      className="w-full sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-background)]/95 backdrop-blur-md flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4 shadow-lg"
      style={{ minHeight: 72 }}
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <img
            ref={logoRef}
            src="/somnia.svg"
            alt="Somnia Logo"
            className="h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer"
            style={{ background: "var(--color-card)" }}
            onMouseEnter={() => {
              gsap.to(logoRef.current, {
                scale: 1.1,
                rotation: "+=15",
                duration: 0.3,
                ease: "power2.out",
              });
            }}
            onMouseLeave={() => {
              gsap.to(logoRef.current, {
                scale: 1,
                rotation: "-=15",
                duration: 0.3,
                ease: "power2.out",
              });
            }}
          />
          <div className="absolute -inset-1 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary)] rounded-full opacity-20 blur animate-pulse"></div>
        </div>
        <span
          ref={titleRef}
          className="text-2xl sm:text-3xl font-black tracking-wide text-[var(--color-primary)] drop-shadow-lg bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary)]/80 bg-clip-text"
        >
          Somnia Swap
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div ref={badgeRef} className="flex gap-2">
          <Badge
            className="font-mono px-4 py-2 rounded-xl shadow-lg border border-[var(--color-border)] text-sm bg-[var(--color-primary)] text-[var(--color-primary-foreground)] transition-all duration-300"
            onMouseEnter={() => {
              gsap.to(badgeRef.current, {
                y: -2,
                duration: 0.3,
                ease: "power2.out",
              });
            }}
            onMouseLeave={() => {
              gsap.to(badgeRef.current, {
                y: 0,
                duration: 0.3,
                ease: "power2.out",
              });
            }}
          >
            {address
              ? `${address.slice(0, 6)}...${address.slice(-4)}`
              : "Not Connected"}
          </Badge>
        </div>
        <div ref={modeToggleRef}>
          <ModeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;
