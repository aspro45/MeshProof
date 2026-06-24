import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCube } from "@fortawesome/free-solid-svg-icons";

/**
 * Logo = ready-made FontAwesome icon (cube) + plain wordmark.
 * No custom SVG is drawn. Icon source documented in README.
 * https://fontawesome.com/icons/cube
 */
export function MeshProofLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-md border border-line bg-panel2 text-primary">
        <FontAwesomeIcon icon={faCube} className="h-[18px] w-[18px]" />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-[15px] font-semibold tracking-tight text-text">MeshProof</span>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">3D Asset Provenance</span>
        </span>
      )}
    </span>
  );
}
