const svgId = 'neo-svg-filter';
function injectSvgFilter(): void {
  if (document.getElementById(svgId)) return;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.id = svgId;
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.position = 'absolute';
  svg.innerHTML = `<defs>
    <filter id="neo-neon-emoji" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur1"/>
      <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur2"/>
      <feGaussianBlur in="SourceGraphic" stdDeviation="6.5" result="blur3"/>
      <feComponentTransfer in="blur3" result="blur3-fade">
        <feFuncA type="linear" slope="0.55" intercept="0"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode in="blur3-fade"/>
        <feMergeNode in="blur2"/>
        <feMergeNode in="blur1"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>`;
  document.head.appendChild(svg);
}
function removeSvgFilter(): void {
  const el = document.getElementById(svgId);
  if (el) {
    el.remove();
  }
}
export function initSvgFilter(): void {
  injectSvgFilter();
}
export function destroySvgFilter(): void {
  removeSvgFilter();
}