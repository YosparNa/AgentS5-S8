// 移植自原型 hotCard 的 sparkline(09index 行 3827–3852)
export function Spark({ trend, stroke = "#f97316" }: { trend: number[]; stroke?: string }) {
  if (trend.length < 2) return <svg className="spark" viewBox="0 0 60 20" />;
  const span = 60 / (trend.length - 1);
  const pts = trend.map((v, i) => `${i * span},${20 - v * 0.5}`).join(" ");
  const peakIdx = trend.indexOf(Math.max(...trend));
  return (
    <svg className="spark" viewBox="0 0 60 20">
      <polyline fill="none" stroke={stroke} strokeWidth="1.5" points={pts} />
      <circle cx={peakIdx * span} cy={20 - trend[peakIdx] * 0.5} r="2" fill={stroke} />
    </svg>
  );
}
