import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { useWallet } from "@solana/wallet-adapter-react";
import { useHeliusBalances } from "@/hooks/useHeliusBalances";

import { Loader2, RefreshCw, Wallet, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SendTokenDialog } from "@/components/dialogs/send-token-dialog";
import { SendSolDialog } from "@/components/dialogs/send-sol-dialog";
import { useQueryClient } from "@tanstack/react-query";

export function WalletBalancesPage() {
  const { publicKey, connected } = useWallet();
  const queryClient = useQueryClient();

  const {
    data: balances,
    isLoading,
    isError,
    error,
    refetch,
  } = useHeliusBalances(publicKey?.toBase58());

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ["multipleTokenMetadata"] });
  };

  if (!connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Balances
          </CardTitle>
          <CardDescription>
            Connect your wallet to view your token balances.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Please connect your wallet to view balances.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Wallet Balances
            </CardTitle>
            <CardDescription>
              View and manage your token balances. Send tokens to other wallets.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="text-center py-8 text-destructive">
            Error loading balances: {(error as Error)?.message}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Native SOL Balance */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                    SOL
                  </div>
                  <div>
                    <div className="font-medium">Solana</div>
                    <div className="text-sm text-muted-foreground">SOL</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-medium">
                      {balances?.nativeBalance.solAmount.toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 4,
                          maximumFractionDigits: 9,
                        },
                      )}{" "}
                      SOL
                    </div>
                  </div>
                  <SendSolDialog
                    balance={balances?.nativeBalance.solAmount || 0}
                    disabled={!balances?.nativeBalance.solAmount}
                  />
                </div>
              </div>
            </div>

            {/* Token Balances */}
            {balances?.tokens && balances.tokens.length > 0 ? (
              <>
                <div className="flex items-center gap-2 pt-4">
                  <Coins className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Token Balances ({balances.tokens.length})
                  </span>
                </div>
                {balances.tokens.map((token) => {
                  const displayAmount =
                    token.amount / Math.pow(10, token.decimals);

                  return (
                    <div
                      key={token.mint}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : token.icon ? (
                              token.icon.startsWith("http") ? (
                                <img
                                  src={token.icon ?? ""}
                                  alt={token.symbol}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (
                                      e.target as HTMLImageElement
                                    ).style.display = "none";
                                  }}
                                />
                              ) : (
                                <span className="text-xl">{token.symbol}</span>
                              )
                            ) : (
                              <span className="text-xs font-mono">
                                {token.mint.slice(0, 3)}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">
                              {token?.name || "Unknown Token"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {token?.symbol || token.mint.slice(0, 8)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-medium">
                              {displayAmount.toLocaleString(undefined, {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: token.decimals,
                              })}{" "}
                              {token?.symbol || ""}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {token.mint.slice(0, 8)}...{token.mint.slice(-8)}
                            </div>
                          </div>
                          <SendTokenDialog
                            mint={token.mint}
                            symbol={token?.symbol || "TOKEN"}
                            balance={token.amount}
                            decimals={token.decimals}
                            icon={token?.icon ?? ""}
                            disabled={token.amount === 0}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No token balances found.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
