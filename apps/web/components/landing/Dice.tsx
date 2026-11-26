// Dados em "falso 3D" (fora da landing por enquanto): faces chapadas em tons diferentes e sombra no chão.

export function D20() {
  return (
    <svg viewBox="0 0 100 110" width="104" height="114" aria-hidden>
      <ellipse cx="52" cy="102" rx="34" ry="6" fill="#000" opacity=".18" />
      {/* contorno e facetas */}
      <path d="M50 4 92 28v48L50 100 8 76V28z" fill="#4b3bc4" />
      <path d="M50 4 92 28 50 36 8 28z" fill="#8e81f5" />
      <path d="M8 28 50 36 28 72 8 76z" fill="#6f61e8" />
      <path d="M92 28 50 36 72 72 92 76z" fill="#4b3bc4" />
      <path d="M50 36 72 72H28z" fill="#7d70f0" />
      <path d="M28 72h44L50 100z" fill="#3c2fa6" />
      <path d="M8 76 28 72 50 100zM92 76 72 72 50 100z" fill="#33288f" />
      <g fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="1.2" strokeLinejoin="round">
        <path d="M8 28 50 36 92 28M50 36 28 72h44zM28 72 8 76M72 72l20 4M28 72l22 28 22-28" />
      </g>
      <path d="M50 4 92 28v48L50 100 8 76V28z" fill="none" stroke="#1d1660" strokeWidth="3" strokeLinejoin="round" />
      <text x="50" y="64" textAnchor="middle" fontFamily="var(--font-display), system-ui" fontWeight="700" fontSize="17" fill="#fff">
        20
      </text>
    </svg>
  );
}

export function D6() {
  return (
    <svg viewBox="0 0 100 104" width="84" height="88" aria-hidden>
      <ellipse cx="50" cy="96" rx="34" ry="6" fill="#000" opacity=".18" />
      {/* cubo isométrico: topo claro, frente média, lado escuro */}
      <path d="M50 8 88 28 50 48 12 28z" fill="#f7c66a" />
      <path d="M12 28 50 48v42L12 70z" fill="#e8a33d" />
      <path d="M88 28 50 48v42l38-20z" fill="#c4801f" />
      <path d="M12 28 50 48 88 28M50 48v42" fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M50 8 88 28v42L50 90 12 70V28z" fill="none" stroke="#5a3a0a" strokeWidth="3" strokeLinejoin="round" />
      {/* topo: 1 */}
      <ellipse cx="50" cy="28" rx="6" ry="3.4" fill="#3a2a12" />
      {/* frente: 2 */}
      <ellipse cx="22" cy="42" rx="3.6" ry="4.4" fill="#3a2a12" transform="rotate(-28 22 42)" />
      <ellipse cx="40" cy="74" rx="3.6" ry="4.4" fill="#3a2a12" transform="rotate(-28 40 74)" />
      {/* lado: 3 */}
      <ellipse cx="78" cy="42" rx="3.6" ry="4.4" fill="#2a1d0b" transform="rotate(28 78 42)" />
      <ellipse cx="69" cy="58" rx="3.6" ry="4.4" fill="#2a1d0b" transform="rotate(28 69 58)" />
      <ellipse cx="60" cy="74" rx="3.6" ry="4.4" fill="#2a1d0b" transform="rotate(28 60 74)" />
    </svg>
  );
}

export function D4() {
  return (
    <svg viewBox="0 0 100 96" width="76" height="73" aria-hidden>
      <ellipse cx="50" cy="88" rx="34" ry="6" fill="#000" opacity=".18" />
      {/* tetraedro: duas faces visíveis */}
      <path d="M50 6 10 80h44z" fill="#3cbfae" />
      <path d="M50 6 54 80l36-14z" fill="#1f7f73" />
      <path d="M50 6 54 80" fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth="1.2" />
      <path d="M50 6 90 66 54 80 10 80z" fill="none" stroke="#0e4a43" strokeWidth="3" strokeLinejoin="round" />
      <text x="38" y="66" textAnchor="middle" fontFamily="var(--font-display), system-ui" fontWeight="700" fontSize="18" fill="#fff">
        4
      </text>
    </svg>
  );
}
