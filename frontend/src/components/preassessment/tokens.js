export const blue      = "#003D6B";
export const orange    = "#D97706";
export const muted     = "rgba(0,61,107,0.5)";
export const rule      = "rgba(0,61,107,0.1)";
export const darkNav   = "#001225";
export const ruleWhite = "rgba(255,255,255,0.1)";
export const EASE      = [0.22, 1, 0.36, 1];
export const white     = "#FFFFFF";

export const fadeUp = (delay = 0) => ({
  initial:     { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport:    { once: true, amount: 0.15 },
  transition:  { duration: 0.6, ease: EASE, delay },
});
