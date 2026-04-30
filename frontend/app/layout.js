import "./globals.css";
import LetterGlitch from "@/components/LetterGlitch";

export const metadata = {
  title: "Sovereign Entity Audit",
  description: "Quiz funnel built with Next.js and FastAPI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <div className="global-letter-glitch">
          <LetterGlitch
            glitchColors={["#24345f", "#2dc6e8", "#be992e"]}
            glitchSpeed={55}
            centerVignette
            outerVignette
            smooth
          />
        </div>
        <div className="global-app-layer">{children}</div>
      </body>
    </html>
  );
}
