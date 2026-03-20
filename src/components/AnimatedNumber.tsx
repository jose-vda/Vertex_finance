import React, { useEffect, useState, useRef } from 'react';
import { Text, TextProps } from 'react-native';

const DURATION_MS = 520;

type AnimatedNumberProps = TextProps & {
  value: number;
  formatter?: (n: number) => string;
  duration?: number;
};

export function AnimatedNumber({
  value,
  formatter = (n) => String(Math.round(n)),
  style,
  duration = DURATION_MS,
  ...props
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const startRef = useRef(value);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = startRef.current;
    const startTime = Date.now();
    startRef.current = value;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setDisplay(start + (value - start) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return <Text style={style} {...props}>{formatter(display)}</Text>;
}
