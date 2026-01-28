import React from "react";

import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";

import "@solana/wallet-adapter-react-ui/styles.css";

import { toast } from "sonner";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";

import { Connection } from "@solana/web3.js";
import { clusterApiUrl } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

import { EscrowProgram } from "@/solana-service/program";
import { Wallet } from "@coral-xyz/anchor";

import { Toaster } from "sonner";

import { CreateOfferDialog } from "@/components/dialogs/create-offer-dialog";
import {
  FindOfferDialog,
  FoundOffer,
} from "@/components/dialogs/find-offer-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Wallet as WalletIcon, ArrowLeftRight } from "lucide-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useMetadata } from "@/hooks/useMetadata";
import { WalletBalancesPage } from "@/pages/wallet-balances";
import { cn } from "@/utils";

function OfferConfirmation({
  offer,
  onConfirm,
  onCancel,
  loading,
}: {
  offer: FoundOffer;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const { data: tokenAMetadata } = useMetadata(offer.tokenMintA.toBase58());
  const { data: tokenBMetadata } = useMetadata(offer.tokenMintB.toBase58());

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Confirm Take Offer</CardTitle>
        <CardDescription>
          You're about to exchange tokens. Please confirm the details below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl mb-1">{tokenBMetadata?.icon}</div>
            <div className="font-medium">
              {offer.tokenBWantedAmount.toString()} {tokenBMetadata?.symbol}
            </div>
            <div className="text-xs text-muted-foreground">You pay</div>
          </div>
          <div className="text-xl">→</div>
          <div className="text-center">
            <div className="text-2xl mb-1">{tokenAMetadata?.icon}</div>
            <div className="font-medium">
              {offer.tokenAOfferedAmount.toString()} {tokenAMetadata?.symbol}
            </div>
            <div className="text-xs text-muted-foreground">You receive</div>
          </div>
        </div>
        <div className="flex gap-2 justify-center mt-4">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Confirm Transaction"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Exchange", icon: ArrowLeftRight },
    { path: "/balances", label: "Balances", icon: WalletIcon },
  ];

  return (
    <nav className="flex gap-2 mb-6">
      {navItems.map((item) => (
        <Link key={item.path} to={item.path}>
          <Button
            variant={location.pathname === item.path ? "default" : "outline"}
            className={cn(
              "flex items-center gap-2",
              location.pathname === item.path && "pointer-events-none"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Button>
        </Link>
      ))}
    </nav>
  );
}

function ExchangePage() {
  const [loading, setLoading] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<FoundOffer | null>(null);

  const wallet = useAnchorWallet();
  const { connected } = useWallet();

  const onTakeOffer = async (offer: FoundOffer) => {
    setSelectedOffer(offer);
  };

  const confirmTakeOffer = async () => {
    if (!selectedOffer || !wallet) return;

    setLoading(true);
    try {
      const connection = new Connection(
        clusterApiUrl(WalletAdapterNetwork.Devnet)
      );

      const contract = new EscrowProgram(connection, wallet as Wallet);
      const result = await contract.takeOffer(
        selectedOffer.maker,
        selectedOffer.offerAddress,
        selectedOffer.tokenMintA,
        selectedOffer.tokenMintB
      );

      if (result) {
        toast.success("Offer taken successfully!");
        setSelectedOffer(null);
      } else {
        toast.error("Error taking offer");
      }
    } catch (e) {
      console.error("Error taking offer:", e);
      toast.error("Error taking offer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Token Exchange</CardTitle>
        <CardDescription>
          Create a new offer or find an existing offer by entering the maker's
          address and offer ID.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 justify-center flex-wrap">
          <CreateOfferDialog isWalletConnected={connected} />
          <FindOfferDialog
            isWalletConnected={connected}
            onTakeOffer={onTakeOffer}
          />
        </div>

        {selectedOffer && (
          <OfferConfirmation
            offer={selectedOffer}
            onConfirm={confirmTakeOffer}
            onCancel={() => setSelectedOffer(null)}
            loading={loading}
          />
        )}
      </CardContent>
    </Card>
  );
}

function AppContent() {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const { connected, publicKey, disconnect } = useWallet();

  useEffect(() => {
    if (connected && publicKey) {
      setIsWalletConnected(true);
      setWalletAddress(publicKey.toString());
    } else {
      setIsWalletConnected(false);
      setWalletAddress(null);
    }
  }, [connected, publicKey]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-3xl font-bold text-center mb-8">
          Solana Offers Management
        </h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Wallet</CardTitle>
            <CardDescription>
              Connect your wallet to create or take offers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isWalletConnected ? (
              <div className="text-center">
                <WalletMultiButton style={{ backgroundColor: "black" }}>
                  <Button asChild>
                    <div>Connect Wallet</div>
                  </Button>
                </WalletMultiButton>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Connected as:</p>
                  <p className="font-mono text-sm">
                    {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-8)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    disconnect();
                    setIsWalletConnected(false);
                  }}
                >
                  Disconnect
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Navigation />

        <Routes>
          <Route path="/" element={<ExchangePage />} />
          <Route path="/balances" element={<WalletBalancesPage />} />
        </Routes>
      </div>
      <Toaster />
    </main>
  );
}

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
