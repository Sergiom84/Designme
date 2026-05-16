export function renderChartBars(values: number[] = [46, 68, 58, 83, 74, 91]): string {
  return `
    <div class="bars" aria-label="Signal trend chart">
      ${values.map((value) => `<i style="height: ${Math.max(8, Math.min(100, value))}%"></i>`).join('')}
    </div>
  `;
}
