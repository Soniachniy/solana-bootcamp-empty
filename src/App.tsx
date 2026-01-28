import React from "react";

import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";

import "@solana/wallet-adapter-react-ui/styles.css";

import { useWallet } from "@solana/wallet-adapter-react";

import { Toaster } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet as WalletIcon, ArrowLeftRight } from "lucide-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

import { WalletBalancesPage } from "@/pages/wallet-balances";
import { cn } from "@/utils";
import ExchangePage from "./pages/exchange-page";

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
              location.pathname === item.path && "pointer-events-none",
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

const App: React.FC = () => {
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
    <BrowserRouter>
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
                    <p className="text-sm text-muted-foreground">
                      Connected as:
                    </p>
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
    </BrowserRouter>
  );
};

export default App;
