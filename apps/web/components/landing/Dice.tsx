// Dados desenhados em vetor, no mesmo traço chapado das artes da landing.

export function D20({ value = 20 }: { value?: number }) {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden>
      <path d="M32 3 57 17.5v29L32 61 7 46.5v-29z" fill="#6c5ce7" />
      <path d="M32 3 57 17.5 32 22 7 17.5zM7 17.5 32 22 18 44 7 46.5zM57 17.5 32 22l14 22 11 2.5z" fill="#fff" fillOpacity=".14" />
      <path d="M32 22 46 44H18z" fill="#fff" fillOpacity=".22" />
      <text x="32" y="40" textAnchor="middle" fontFamily="var(--font-display), system-ui" fontWeight="700" fontSize="13" fill="#fff">
        {value}
      </text>
    </svg>
  );
}

export function D6({ value = 5 }: { value?: 1 | 2 | 3 | 4 | 5 | 6 }) {
  const pips: Record<number, Array<[number, number]>> = {
    1: [[32, 32]],
    2: [[22, 22], [42, 42]],
    3: [[21, 21], [32, 32], [43, 43]],
    4: [[22, 22], [42, 22], [22, 42], [42, 42]],
    5: [[21, 21], [43, 21], [32, 32], [21, 43], [43, 43]],
    6: [[22, 20], [42, 20], [22, 32], [42, 32], [22, 44], [42, 44]],
  };
  return (
    <svg viewBox="0 0 64 64" width="56" height="56" aria-hidden>
      <rect x="8" y="8" width="48" height="48" rx="10" fill="#e8a33d" />
      <rect x="8" y="8" width="48" height="24" rx="10" fill="#fff" fillOpacity=".14" />
      {pips[value]!.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4.5" fill="#3a2a12" />
      ))}
    </svg>
  );
}

export function D4({ value = 4 }: { value?: number }) {
  return (
    <svg viewBox="0 0 64 64" width="52" height="52" aria-hidden>
      <path d="M32 6 59 54H5z" fill="#2a9d8f" />
      <path d="M32 6 59 54 32 44z" fill="#000" fillOpacity=".14" />
      <text x="30" y="42" textAnchor="middle" fontFamily="var(--font-display), system-ui" fontWeight="700" fontSize="15" fill="#fff">
        {value}
      </text>
    </svg>
  );
}
