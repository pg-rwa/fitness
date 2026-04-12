"use client";
import { useState, useEffect, useRef } from "react";

/**
 * Peqo Mascot — web version with CSS animations and inline SVG.
 *
 * Props:
 *   mood      — "idle" | "happy" | "celebrating" | "concerned" | "sleeping" | "motivated" | "thinking"
 *   size      — base size in px (default 120)
 *   message   — optional speech bubble text
 *   onClick   — optional click handler
 *   level     — fitness level 1-10 (Peqo gets buffer)
 */
export default function PeqoMascot({ mood = "idle", size = 120, message, onClick, level = 1 }) {
  const [prevMood, setPrevMood] = useState(mood);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (mood !== prevMood) {
      setPrevMood(mood);
      setAnimKey((k) => k + 1);
    }
  }, [mood, prevMood]);

  const bufferScale = 1 + Math.min(level, 10) * 0.02;
  const bodyW = size * bufferScale;
  const bodyH = size;
  const eyeSize = size * 0.16;
  const pupilSize = eyeSize * 0.55;

  // Mood-specific eye & mouth params
  const moodConfig = {
    idle:        { leftEyeH: 1, rightEyeH: 1, mouthW: 0.18, mouthH: 0.06, mouthR: "50%", bodyAnim: "peqo-float", pupilOx: 0 },
    happy:       { leftEyeH: 0.6, rightEyeH: 0.6, mouthW: 0.25, mouthH: 0.1, mouthR: "50%", bodyAnim: "peqo-bounce", pupilOx: 0 },
    celebrating: { leftEyeH: 1.2, rightEyeH: 1.2, mouthW: 0.22, mouthH: 0.14, mouthR: "50%", bodyAnim: "peqo-celebrate", pupilOx: 0 },
    concerned:   { leftEyeH: 0.85, rightEyeH: 1, mouthW: 0.15, mouthH: 0.03, mouthR: "2px", bodyAnim: "peqo-worry", pupilOx: -1 },
    sleeping:    { leftEyeH: 0.05, rightEyeH: 0.05, mouthW: 0, mouthH: 0, mouthR: "0", bodyAnim: "peqo-sleep", pupilOx: 0 },
    motivated:   { leftEyeH: 0.7, rightEyeH: 0.7, mouthW: 0.28, mouthH: 0.12, mouthR: "50%", bodyAnim: "peqo-pump", pupilOx: 1 },
    thinking:    { leftEyeH: 0.5, rightEyeH: 1.1, mouthW: 0.1, mouthH: 0.06, mouthR: "50%", bodyAnim: "peqo-think", pupilOx: 0 },
  };

  const cfg = moodConfig[mood] || moodConfig.idle;

  return (
    <>
      <style>{`
        @keyframes peqo-float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-6px) scale(1); }
        }
        @keyframes peqo-bounce {
          0%, 100% { transform: translateY(0) scale(1.05) rotate(-2deg); }
          50% { transform: translateY(-8px) scale(1.05) rotate(2deg); }
        }
        @keyframes peqo-celebrate {
          0% { transform: translateY(0) scale(1) rotate(-5deg); }
          25% { transform: translateY(-16px) scale(1.15) rotate(5deg); }
          50% { transform: translateY(-4px) scale(1) rotate(-5deg); }
          75% { transform: translateY(-16px) scale(1.15) rotate(5deg); }
          100% { transform: translateY(0) scale(1) rotate(-5deg); }
        }
        @keyframes peqo-worry {
          0%, 100% { transform: translateY(0) scale(0.95) rotate(-3deg); }
          50% { transform: translateY(-2px) scale(0.95) rotate(-3deg); }
        }
        @keyframes peqo-sleep {
          0%, 100% { transform: translateY(-2px) scale(0.95) rotate(5deg); }
          50% { transform: translateY(2px) scale(0.95) rotate(5deg); }
        }
        @keyframes peqo-pump {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.08); }
        }
        @keyframes peqo-think {
          0%, 100% { transform: translateY(0) rotate(4deg); }
          50% { transform: translateY(-3px) rotate(4deg); }
        }
        @keyframes peqo-blink {
          0%, 90%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
        @keyframes peqo-sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes peqo-zzz {
          0% { opacity: 0; transform: translateY(0) scale(0.5); }
          50% { opacity: 0.6; transform: translateY(-10px) scale(1); }
          100% { opacity: 0; transform: translateY(-20px) scale(0.8); }
        }
        @keyframes peqo-dots {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        @keyframes peqo-bubble-in {
          from { opacity: 0; transform: translateY(4px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div
        onClick={onClick}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          cursor: onClick ? "pointer" : "default",
          userSelect: "none",
        }}
      >
        {/* Speech bubble */}
        {message && (
          <div
            key={`bubble-${animKey}`}
            style={{
              background: "rgba(30, 30, 46, 0.95)",
              border: "1px solid rgba(232, 97, 77, 0.3)",
              borderRadius: 12,
              padding: "8px 14px",
              marginBottom: 8,
              maxWidth: size * 2,
              position: "relative",
              animation: "peqo-bubble-in 0.3s ease-out",
            }}
          >
            <p style={{ color: "#fff", fontSize: size * 0.1, textAlign: "center", margin: 0, lineHeight: 1.4 }}>
              {message}
            </p>
            <div
              style={{
                position: "absolute",
                bottom: -6,
                left: "50%",
                marginLeft: -6,
                width: 12,
                height: 12,
                background: "rgba(30, 30, 46, 0.95)",
                border: "1px solid rgba(232, 97, 77, 0.3)",
                borderTop: "none",
                borderLeft: "none",
                transform: "rotate(45deg)",
              }}
            />
          </div>
        )}

        {/* Body */}
        <div
          key={`body-${animKey}`}
          style={{
            width: bodyW,
            height: bodyH,
            borderRadius: size * 0.35,
            background: "linear-gradient(145deg, #EF7B6A, #E8614D, #D4533F)",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            animation: `${cfg.bodyAnim} ${mood === "celebrating" ? "0.6s" : mood === "sleeping" ? "4s" : "2.4s"} ease-in-out infinite`,
            boxShadow: "0 4px 20px rgba(232, 97, 77, 0.3)",
            transition: "width 0.3s ease",
          }}
        >
          {/* Shine */}
          <div
            style={{
              position: "absolute",
              top: size * 0.08,
              left: size * 0.12,
              width: size * 0.22,
              height: size * 0.14,
              borderRadius: size * 0.1,
              background: "rgba(255, 255, 255, 0.25)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: size * 0.06,
              left: size * 0.38,
              width: size * 0.08,
              height: size * 0.06,
              borderRadius: size * 0.04,
              background: "rgba(255, 255, 255, 0.15)",
              pointerEvents: "none",
            }}
          />

          {/* Eyes */}
          <div style={{ display: "flex", gap: size * 0.14, marginTop: -size * 0.08 }}>
            {/* Left eye */}
            <div
              style={{
                width: eyeSize,
                height: eyeSize * cfg.leftEyeH,
                borderRadius: "50%",
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                transition: "height 0.3s ease",
                animation: mood === "idle" ? "peqo-blink 4s infinite" : "none",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: pupilSize,
                  height: pupilSize,
                  borderRadius: "50%",
                  background: "#1E1E2E",
                  transform: `translateX(${cfg.pupilOx}px)`,
                  transition: "transform 0.3s ease",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: eyeSize * 0.15,
                  right: eyeSize * 0.18,
                  width: eyeSize * 0.22,
                  height: eyeSize * 0.22,
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.8)",
                }}
              />
            </div>

            {/* Right eye */}
            <div
              style={{
                width: eyeSize,
                height: eyeSize * cfg.rightEyeH,
                borderRadius: "50%",
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                transition: "height 0.3s ease",
                animation: mood === "idle" ? "peqo-blink 4s 0.1s infinite" : "none",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: pupilSize,
                  height: pupilSize,
                  borderRadius: "50%",
                  background: "#1E1E2E",
                  transform: `translateX(${cfg.pupilOx}px)`,
                  transition: "transform 0.3s ease",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: eyeSize * 0.15,
                  right: eyeSize * 0.18,
                  width: eyeSize * 0.22,
                  height: eyeSize * 0.22,
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.8)",
                }}
              />
            </div>
          </div>

          {/* Mouth */}
          {cfg.mouthW > 0 && (
            <div
              style={{
                width: size * cfg.mouthW,
                height: size * cfg.mouthH,
                borderRadius: cfg.mouthR,
                borderTopLeftRadius: mood === "concerned" ? cfg.mouthR : "2px",
                borderTopRightRadius: mood === "concerned" ? cfg.mouthR : "2px",
                background: "#C0392B",
                marginTop: size * 0.06,
                overflow: "hidden",
                transition: "all 0.3s ease",
                position: "relative",
              }}
            >
              {(mood === "celebrating" || mood === "motivated") && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: "30%",
                    width: "40%",
                    height: "60%",
                    borderTopLeftRadius: 100,
                    borderTopRightRadius: 100,
                    background: "#E8614D",
                  }}
                />
              )}
            </div>
          )}

          {/* Sleeping Zzz */}
          {mood === "sleeping" && (
            <div style={{ position: "absolute", top: -5, right: -5 }}>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    display: "block",
                    color: "rgba(255,255,255,0.4)",
                    fontSize: size * (0.12 - i * 0.02),
                    fontWeight: "bold",
                    marginLeft: i * 8,
                    animation: `peqo-zzz 2s ${i * 0.6}s infinite`,
                  }}
                >
                  z
                </span>
              ))}
            </div>
          )}

          {/* Thinking dots */}
          {mood === "thinking" && (
            <div style={{ position: "absolute", top: size * 0.15, right: -size * 0.22, display: "flex", gap: 3 }}>
              {[4, 5, 6].map((s, i) => (
                <div
                  key={i}
                  style={{
                    width: s,
                    height: s,
                    borderRadius: "50%",
                    background: `rgba(255,255,255,${0.4 + i * 0.1})`,
                    animation: `peqo-dots 1.5s ${i * 0.3}s infinite`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Celebration sparkles */}
          {mood === "celebrating" &&
            [
              { top: -8, left: "15%", delay: "0s", size: 8 },
              { top: -4, right: "10%", delay: "0.3s", size: 6 },
              { bottom: "10%", right: -6, delay: "0.6s", size: 5 },
              { top: "20%", left: -6, delay: "0.9s", size: 7 },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  ...s,
                  width: s.size,
                  height: s.size,
                  borderRadius: "50%",
                  background: "#FBBF24",
                  animation: `peqo-sparkle 0.8s ${s.delay} infinite`,
                }}
              />
            ))}
        </div>

        {/* Label */}
        <span
          style={{
            color: "rgba(255, 255, 255, 0.4)",
            fontSize: size * 0.09,
            fontWeight: 600,
            marginTop: 6,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          PEQO
        </span>
      </div>
    </>
  );
}
