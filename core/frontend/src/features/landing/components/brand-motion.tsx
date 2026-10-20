"use client";

import { useEffect, useId, useRef, useState } from "react";
import { crowantGeometry as shapes } from "@/shared/components/brand/crowant-geometry";
import styles from "./brand-motion.module.css";

export type BrandMotionVariant = "story" | "essential";

export const BRAND_MOTION = {
  story: { duration: 6400, nameAt: 3400, closeAt: 5700, label: "El encuentro" },
  essential: { duration: 3800, nameAt: 1650, closeAt: 3250, label: "La firma" },
} as const;

type Props = {
  autoPlay?: boolean;
};

type Playback = { play: () => void; pause: () => void };
type Frame = Keyframe & { offset: number };
const EASE = "cubic-bezier(.22,1,.36,1)";
const LEAVE = "cubic-bezier(.55,0,1,.45)";

function choreography(variant: BrandMotionVariant) {
  const duration = BRAND_MOTION[variant].duration;
  const at = (ms: number, values: Keyframe): Frame => ({ ...values, offset: ms / duration });
  const story = variant === "story";
  const antEnd = story ? 1350 : 700;
  const crowStart = story ? 1250 : 300;
  const crowEnd = story ? 2650 : 1200;
  const nameStart = story ? 2650 : 950;
  const nameEnd = story ? 2950 : 1250;
  const departure = story ? 4450 : 2250;
  const end = story ? 5150 : 2850;
  const settle = story ? 5650 : 3100;
  const definitions: [string, Keyframe[]][] = [
    ["pack", story ? [
      at(0, { transform: "translateX(0px)", opacity: 1 }),
      at(departure, { transform: "translateX(0px)", opacity: 1, easing: LEAVE }),
      at(end, { transform: "translateX(1750px)", opacity: 1 }),
      at(end + 1, { transform: "translateX(1750px)", opacity: 0 }),
      at(duration, { transform: "translateX(1750px)", opacity: 0 }),
    ] : [
      at(0, { transform: "translateX(0px) scale(1)", opacity: 1 }),
      at(departure, { transform: "translateX(0px) scale(1)", opacity: 1, easing: EASE }),
      at(end, { transform: "translateX(100px) scale(.88)", opacity: 0 }),
      at(duration, { transform: "translateX(100px) scale(.88)", opacity: 0 }),
    ]],
    ["ant", [
      at(0, { transform: "translateX(-780px)", opacity: 0 }),
      at(100, { transform: "translateX(-650px)", opacity: 1, easing: "cubic-bezier(.25,.5,.45,1)" }),
      at(antEnd, { transform: "translateX(0px)", opacity: 1 }),
      at(duration, { transform: "translateX(0px)", opacity: 1 }),
    ]],
    ["crow", [
      at(0, { transform: "translate(620px,-520px) rotate(-20deg)", opacity: 0 }),
      at(crowStart, { transform: "translate(620px,-520px) rotate(-20deg)", opacity: 0, easing: EASE }),
      at(crowStart + 70, { transform: "translate(560px,-460px) rotate(-18deg)", opacity: 1, easing: EASE }),
      at(crowEnd - 200, { transform: "translate(-3px,7px) rotate(1deg)", opacity: 1, easing: EASE }),
      at(crowEnd, { transform: "translate(0px,0px) rotate(0deg)", opacity: 1 }),
      at(duration, { transform: "translate(0px,0px) rotate(0deg)", opacity: 1 }),
    ]],
    ["name", [
      at(0, { opacity: 0, clipPath: "inset(0 100% 0 0)", transform: "translateY(9px)" }),
      at(nameStart, { opacity: 0, clipPath: "inset(0 100% 0 0)", transform: "translateY(9px)", easing: EASE }),
      at(nameEnd, { opacity: 1, clipPath: "inset(0 0% 0 0%)", transform: "translateY(0px)" }),
      at(departure, { opacity: 1, clipPath: "inset(0 0% 0 0%)", transform: "translateY(0px)", easing: story ? LEAVE : EASE }),
      at(end, { opacity: 0, clipPath: story ? "inset(0 0% 0 100%)" : "inset(0 0% 0 0%)", transform: "translateY(0px)" }),
      at(duration, { opacity: 0, clipPath: "inset(0 0% 0 100%)", transform: "translateY(0px)" }),
    ]],
    ["monogram", [
      at(0, { opacity: 0, transform: "translateY(12px) scale(.93)" }),
      at(story ? end - 150 : departure + 100, { opacity: 0, transform: "translateY(12px) scale(.93)", easing: EASE }),
      at(settle, { opacity: 1, transform: "translateY(0px) scale(1)" }),
      at(duration, { opacity: 1, transform: "translateY(0px) scale(1)" }),
    ]],
    ["trail", [
      at(0, { opacity: 0, transform: "translateX(0px) scaleX(.2)" }),
      at(departure, { opacity: 0, transform: "translateX(0px) scaleX(.2)" }),
      at(departure + 180, { opacity: story ? .25 : 0, transform: "translateX(0px) scaleX(1)" }),
      at(end, { opacity: 0, transform: "translateX(650px) scaleX(.1)" }),
      at(duration, { opacity: 0, transform: "translateX(650px) scaleX(.1)" }),
    ]],
  ];

  for (const [part, direction] of [["rear-leg", 1], ["middle-leg", -1], ["front-leg", 1]] as const) {
    const frames: Keyframe[] = [at(0, { transform: "rotate(0deg)" })];
    for (let ms = 140; ms < antEnd; ms += 140) {
      frames.push(at(ms, { transform: `rotate(${(Math.round(ms / 140) % 2 ? 11 : -11) * direction}deg)` }));
    }
    frames.push(at(antEnd, { transform: "rotate(0deg)" }));
    if (story) {
      frames.push(at(departure, { transform: "rotate(0deg)" }));
      for (let ms = departure + 60, step = 0; ms < end; ms += 60, step++) {
        frames.push(at(ms, { transform: `rotate(${(step % 2 ? -18 : 18) * direction}deg)` }));
      }
      frames.push(at(end, { transform: "rotate(0deg)" }));
    }
    frames.push(at(duration, { transform: "rotate(0deg)" }));
    definitions.push([part, frames]);
  }
  const gait: Keyframe[] = [at(0, { transform: "translateY(0px)" })];
  for (let ms = 70, step = 0; ms < antEnd; ms += 70, step++) {
    gait.push(at(ms, { transform: `translateY(${step % 2 ? 0 : -1.5}px)` }));
  }
  gait.push(at(antEnd, { transform: "translateY(0px)" }));
  if (story) {
    gait.push(at(departure, { transform: "translateY(0px)" }));
    for (let ms = departure + 60, step = 0; ms < end; ms += 60, step++) {
      gait.push(at(ms, { transform: `translateY(${step % 2 ? 0 : -2.5}px)` }));
    }
    gait.push(at(end, { transform: "translateY(0px)" }));
  }
  gait.push(at(duration, { transform: "translateY(0px)" }));
  definitions.push(["ant-gait", gait]);
  const wing: Keyframe[] = [at(0, { opacity: 0, transform: "rotate(-15deg)" }), at(crowStart, { opacity: 0, transform: "rotate(-15deg)" })];
  for (let ms = crowStart + 80, index = 0; ms < crowEnd - 250; ms += 140, index++) {
    wing.push(at(ms, { opacity: .9, transform: `rotate(${index % 2 ? 10 : -48}deg)` }));
  }
  wing.push(at(crowEnd - 180, { opacity: 0, transform: "rotate(0deg)" }));
  if (story) {
    wing.push(at(departure, { opacity: 0, transform: "rotate(0deg)" }));
    for (let ms = departure + 60, step = 0; ms < end; ms += 110, step++) {
      wing.push(at(ms, { opacity: .9, transform: `rotate(${step % 2 ? 8 : -32}deg)` }));
    }
    wing.push(at(end, { opacity: 0, transform: "rotate(0deg)" }));
  }
  wing.push(at(duration, { opacity: 0, transform: "rotate(0deg)" }));
  definitions.push(["wing", wing]);
  return definitions;
}

function MotionScene({ sceneRef }: { sceneRef: React.RefObject<SVGSVGElement | null> }) {
  return (
    <svg ref={sceneRef} viewBox="0 -17.5 1200 675" width="1920" height="1080" shapeRendering="geometricPrecision" className={styles.scene} role="img" aria-label="CrowAnt: la visión del cuervo y la fuerza de la hormiga se convierten en el monograma CA.">
      <g data-part="name" style={{ opacity: 0, transformBox: "fill-box" }}>
        <text x="500" y="380" fontFamily="var(--font-work-sans), sans-serif" fontSize="123" fontWeight="700" letterSpacing="-6">
          <tspan fill="var(--primary)">Crow</tspan><tspan fill="var(--hazelnut)">Ant</tspan>
        </text>
      </g>
      <g transform="translate(82 130) scale(.75)" fillRule="evenodd">
        <g data-part="pack" style={{ transformOrigin: "265px 210px", opacity: 0 }}>
          <g data-part="trail" fill="none" stroke="var(--primary)" strokeLinecap="round" style={{ opacity: 0 }}>
            <path d="M30 200H-230M80 245H-120M50 290H-175" strokeWidth="5" />
          </g>
          <g data-part="ant" fill="var(--hazelnut)">
            <g data-part="ant-gait">
              <g data-part="rear-leg" style={{ transformOrigin: "239px 310px" }}><path d={shapes.antRearLeg} /></g>
              <g data-part="middle-leg" style={{ transformOrigin: "242px 310px" }}><path d={shapes.antMiddleLeg} /></g>
              <g data-part="front-leg" style={{ transformOrigin: "290px 280px" }}>
                <path d={shapes.antFrontLeg} />
                <path d="M287 278Q296 289 309 299" fill="none" stroke="var(--hazelnut)" strokeWidth="12" strokeLinecap="round" />
              </g>
              <path d={shapes.antBody} />
              <circle cx="239" cy="310" r="6" />
              <circle cx="290" cy="280" r="6" />
            </g>
          </g>
          <g data-part="crow" style={{ transformOrigin: "290px 180px" }} fill="var(--primary)">
            <path d={shapes.crow} />
            <path data-part="wing" d="M295 170C190 95 155 44 95 22C109 115 171 190 267 223Z" style={{ opacity: 0, transformOrigin: "285px 180px" }} />
          </g>
        </g>
      </g>
      <g transform="translate(387 195) scale(.735)" fillRule="evenodd">
        <g data-part="monogram" style={{ transformOrigin: "290px 175px" }}>
          <path d={shapes.monogramC} fill="var(--primary)" />
          <path d={shapes.monogramA} fill="var(--hazelnut)" />
        </g>
      </g>
    </svg>
  );
}

export function BrandMotion({ autoPlay = false }: Props) {
  const instructionsId = useId();
  const sceneRef = useRef<SVGSVGElement>(null);
  const playback = useRef<Playback | null>(null);
  const [status, setStatus] = useState<"playing" | "paused" | "ended">("ended");
  const [reduced, setReduced] = useState(false);
  const { duration, label } = BRAND_MOTION.story;

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const clock = scene.animate([{ opacity: 1 }, { opacity: 1 }], { duration, fill: "both" });
    const animations = [clock, ...choreography("story").flatMap(([part, keyframes]) => {
      const element = scene.querySelector<SVGElement>(`[data-part="${part}"]`);
      return element ? [element.animate(keyframes, { duration, fill: "both" })] : [];
    })];
    animations.forEach((animation) => { animation.pause(); animation.currentTime = duration; });
    let observer: IntersectionObserver | undefined;
    clock.onfinish = () => setStatus("ended");
    const pause = () => {
      animations.forEach((animation) => animation.pause());
      setStatus("paused");
    };
    const play = () => {
      if (Number(clock.currentTime) >= duration) animations.forEach((animation) => { animation.currentTime = 0; });
      animations.forEach((animation) => animation.play());
      setStatus("playing");
    };
    const onPreferenceChange = () => {
      setReduced(motionPreference.matches);
      if (motionPreference.matches) {
        animations.forEach((animation) => { animation.pause(); animation.currentTime = duration; });
        setStatus("ended");
      }
    };
    playback.current = { play, pause };
    const preferenceFrame = requestAnimationFrame(() => setReduced(motionPreference.matches));
    motionPreference.addEventListener("change", onPreferenceChange);
    if (autoPlay && !motionPreference.matches) {
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) { play(); observer?.disconnect(); }
      }, { threshold: .45 });
      observer.observe(scene);
    }
    return () => {
      cancelAnimationFrame(preferenceFrame);
      observer?.disconnect();
      motionPreference.removeEventListener("change", onPreferenceChange);
      animations.forEach((animation) => animation.cancel());
      playback.current = null;
    };
  }, [autoPlay, duration]);

  return (
    <figure className={styles.player} aria-label={`Intro de CrowAnt: ${label}`}>
      <button
        type="button"
        className={styles.surface}
        data-playback={status}
        aria-label={`${status === "playing" ? "Pausar" : status === "ended" ? "Volver a reproducir" : "Continuar"} ${label}`}
        aria-describedby={instructionsId}
        onClick={() => status === "playing" ? playback.current?.pause() : playback.current?.play()}
      >
        <MotionScene sceneRef={sceneRef} />
      </button>
      <p id={instructionsId} className="sr-only">Haz clic sobre la animación, o usa Enter o la barra espaciadora, para pausar, continuar o volver a reproducirla.{reduced && " Se muestra la firma estática según tu preferencia de movimiento reducido."}</p>
    </figure>
  );
}
