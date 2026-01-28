import { useQuery } from "@tanstack/react-query";
import { createHelius } from "helius-sdk";

const HELIUS_API_KEY = "YOUR_HELIUS_API_KEY";

export interface TokenBalance {
  mint: string;
  amount: number;
  decimals: number;
  tokenAccount: string;
  name: string;
  symbol: string;
  icon: string | null;
}

export interface NativeBalance {
  lamports: number;
  solAmount: number;
}

export interface HeliusBalancesResponse {
  nativeBalance: NativeBalance;
  tokens: TokenBalance[];
}

async function fetchBalances(
  walletAddress: string,
): Promise<HeliusBalancesResponse> {
  const helius = createHelius({ apiKey: HELIUS_API_KEY, network: "devnet" });

  console.log("Fetching balances for", walletAddress, helius);
  return { nativeBalance: { lamports: 0, solAmount: 0 }, tokens: [] }; // TEMPORARY RETURN TO AVOID ERRORS;

  // if (!response.items) {
  //   throw new Error("Failed to fetch balances from Helius");
  // }

  // const nativeBalance: NativeBalance = {
  //   lamports: response.nativeBalance?.lamports || 0,
  //   solAmount: (response.nativeBalance?.lamports || 0) / 1e9,
  // };

  // const tokens: TokenBalance[] = (response.items || []).map((item) => ({
  //   mint: item.id,
  //   amount: item.token_info?.balance || 0,
  //   decimals: item.token_info?.decimals || 0,
  //   tokenAccount: item.token_info?.associated_token_address || "",
  //   name: item.mint_extensions?.metadata?.name || "UNKNOWN",
  //   symbol: item.mint_extensions?.metadata?.symbol || "UNKNOWN",
  //   icon: item.mint_extensions?.metadata?.uri || null,
  // }));

  // return {
  //   nativeBalance,
  //   tokens,
  // };
}

export function useHeliusBalances(walletAddress?: string | null) {
  return useQuery({
    queryKey: ["heliusBalances", walletAddress],
    queryFn: () => {
      if (!walletAddress) {
        throw new Error("Wallet address is required");
      }
      return fetchBalances(walletAddress);
    },
    enabled: !!walletAddress,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });
}
