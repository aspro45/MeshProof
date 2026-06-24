"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWallet, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

export function WalletConnect() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;
        return (
          <div aria-hidden={!ready} className={ready ? "" : "pointer-events-none select-none opacity-0"}>
            {(() => {
              if (!connected) {
                return (
                  <button type="button" onClick={openConnectModal} className="btn btn-primary">
                    <FontAwesomeIcon icon={faWallet} className="h-3.5 w-3.5" /> Connect wallet
                  </button>
                );
              }
              if (chain.unsupported) {
                return (
                  <button type="button" onClick={openChainModal} className="btn btn-warn">
                    <FontAwesomeIcon icon={faTriangleExclamation} className="h-3.5 w-3.5" /> Wrong network
                  </button>
                );
              }
              return (
                <div className="flex items-center gap-2">
                  <button type="button" onClick={openChainModal} className="btn btn-ghost btn-xs hidden sm:inline-flex">
                    <span className="h-2 w-2 rounded-full bg-verified" /> {chain.name ?? "Studionet"}
                  </button>
                  <button type="button" onClick={openAccountModal} className="btn btn-ghost btn-xs">
                    <FontAwesomeIcon icon={faWallet} className="h-3.5 w-3.5 text-primary" />
                    <span className="mono">{account.displayName}</span>
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
