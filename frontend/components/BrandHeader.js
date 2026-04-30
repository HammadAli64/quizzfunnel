import Image from "next/image";

export default function BrandHeader({ subtitle, subtitleClassName = "" }) {
  return (
    <header className="brand-header">
      <div className="brand-logo-wrap">
        <Image
          src="/logo.webp"
          alt="The Syndicate logo"
          width={220}
          height={140}
          className="brand-logo"
          priority
        />
      </div>
      <div>
        <p className="brand-kicker">THE SYNDICATE</p>
        <h1 className="brand-title">THE SOVEREIGN ENTITY AUDIT</h1>
        {subtitle ? <p className={`brand-subtitle ${subtitleClassName}`.trim()}>{subtitle}</p> : null}
      </div>
    </header>
  );
}
