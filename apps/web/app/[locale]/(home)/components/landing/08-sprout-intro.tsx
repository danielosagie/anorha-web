export function SproutIntro() {
  return (
    <section className="sprout-intro" id="sprout">
      <div aria-hidden="true" className="sprout-face">
        <svg viewBox="0 0 94 78">
          <title>Decorative Sprout face</title>
          <path
            d="M81 3H12C7 3 3 7 3 12V64C3 69 7 73 12 73H81C86 73 90 69 90 64V12C90 7 86 3 81 3Z"
            fill="none"
            stroke="#555"
            strokeWidth="6"
          />
          <path
            d="M56 30C57 25 60 21 64 21H73"
            fill="none"
            stroke="#555"
            strokeLinecap="round"
            strokeWidth="6"
          />
          <path
            d="M38 30C37 25 34 21 30 21H21"
            fill="none"
            stroke="#555"
            strokeLinecap="round"
            strokeWidth="6"
          />
          <path
            d="M27 52C33 57 40 53 47 53C53 53 60 56 66 52"
            fill="none"
            stroke="#555"
            strokeLinecap="round"
            strokeWidth="6"
          />
          {/* Nose: thin bar, flat top, rounded bottom — matches the brand
              mark's 1.34 x 4.47 proportions. Never a plain rectangle. */}
          <path
            d="M44 21H50V38C50 39.66 48.66 41 47 41C45.34 41 44 39.66 44 38Z"
            fill="#555"
          />
        </svg>
      </div>
      <h2>Sprout is here.</h2>
      <p>Your shelf has its own agent. It works while you don&apos;t.</p>
    </section>
  );
}
