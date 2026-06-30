import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroVideo from "@/assets/hero-video.mp4";

type Props = {
  title: string;
  subtitle?: string;
  backTo?: string;
};

const CategoryHeader = ({ title, subtitle, backTo = "/" }: Props) => {
  const navigate = useNavigate();
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto max-w-2xl px-5 py-6 space-y-4">
        <div
          className="relative w-full overflow-hidden rounded-xl shadow-lg"
          style={{ aspectRatio: "4/1" }}
        >
          <video
            src={heroVideo}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full scale-150 object-cover"
          />
        </div>
        <div>
          <button
            onClick={() => navigate(backTo)}
            className="mb-3 inline-flex items-center gap-1.5 font-body text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Tilbake
          </button>
          <h1 className="font-display text-xl font-extrabold tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 font-body text-xs text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </header>
  );
};

export default CategoryHeader;
