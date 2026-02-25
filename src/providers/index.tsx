import { PropsWithChildren } from "react";
// import {
//   // ConnectionProvider,
//   WalletProvider as SolanaWalletProvider,
// } from "@solana/wallet-adapter-react";
// import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
// import { clusterApiUrl } from "@solana/web3.js";
// import {
//   PhantomWalletAdapter,
//   SolflareWalletAdapter,
//   UnsafeBurnerWalletAdapter,
// } from "@solana/wallet-adapter-wallets";

import "@solana/wallet-adapter-react-ui/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export const WalletProvider = ({ children }: PropsWithChildren) => {

  return (
    // <ConnectionProvider>
    // <SolanaWalletProvider>
    <WalletModalProvider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WalletModalProvider>
    // </SolanaWalletProvider>
    // </ConnectionProvider>
  );
};
