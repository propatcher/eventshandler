export default function BackgroundDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <span className="float-1 absolute top-[12%] left-[7%] w-32 h-32 border border-neutral-300/70" />
      <span className="float-2 absolute top-[20%] right-[10%] w-24 h-24 border border-neutral-400/60 rotate-12" />
      <span className="float-3 absolute bottom-[16%] left-[15%] w-16 h-16 border-2 border-neutral-300/70" />
      <span className="float-1 absolute bottom-[24%] right-[9%] w-28 h-28 border border-neutral-400/55 -rotate-6" />

      <svg className="float-2 absolute top-[58%] left-[12%]" width="96" height="96" viewBox="0 0 100 100" fill="none">
        <polygon points="50,8 92,88 8,88" stroke="#9ca3af" strokeOpacity="0.7" strokeWidth="2" strokeLinejoin="round" />
      </svg>
      <svg className="float-3 absolute top-[16%] left-[46%]" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.8">
        <path d="M12 5v14M5 12h14" />
      </svg>
      <svg className="float-1 absolute bottom-[12%] right-[26%]" width="64" height="64" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="30" stroke="#9ca3af" strokeOpacity="0.6" strokeWidth="2" />
      </svg>

      <span className="float-2 absolute top-[40%] right-[30%] w-3 h-3 bg-neutral-400/70" />
      <span className="float-3 absolute top-[30%] left-[28%] w-2 h-2 bg-neutral-400/60" />
      <span className="float-1 absolute bottom-[38%] left-[5%] w-2.5 h-2.5 bg-neutral-400/60" />
      <span className="float-2 absolute bottom-[8%] left-[40%] w-2 h-2 bg-neutral-400/60" />
    </div>
  );
}
