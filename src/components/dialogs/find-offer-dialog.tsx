import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search } from "lucide-react";

import { toast } from "sonner";
import { EscrowProgram } from "@/solana-service/program";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";

import { BN, Wallet } from "@coral-xyz/anchor";
import { useMetadata } from "@/hooks/useMetadata";

interface FoundOffer {
  id: string;
  offerId: BN;
  maker: PublicKey;
  tokenMintA: PublicKey;
  tokenMintB: PublicKey;
  tokenBWantedAmount: BN;
  tokenAOfferedAmount: BN;
  offerAddress: PublicKey;
  vault: PublicKey;
}

interface FindOfferDialogProps {
  isWalletConnected: boolean;
  onTakeOffer: (offer: FoundOffer) => void;
}

export function FindOfferDialog({
  isWalletConnected,
  onTakeOffer,
}: FindOfferDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [foundOffer, setFoundOffer] = useState<FoundOffer | null>(null);
  const { connect, wallets, select } = useWallet();
  const wallet = useAnchorWallet();
  const [formData, setFormData] = useState({
    makerAddress: "",
    offerId: "",
  });

  const { data: tokenAMetadata } = useMetadata(
    foundOffer?.tokenMintA?.toBase58()
  );
  const { data: tokenBMetadata } = useMetadata(
    foundOffer?.tokenMintB?.toBase58()
  );

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.makerAddress || !formData.offerId) {
      toast("Please enter both maker address and offer ID");
      return;
    }

    setIsSearching(true);
    setFoundOffer(null);

    try {
      const connection = new Connection(
        clusterApiUrl(WalletAdapterNetwork.Devnet)
      );

      // Create a temporary wallet for read-only operations if not connected
      const tempWallet = wallet as Wallet;
      if (!tempWallet) {
        toast("Please connect your wallet first");
        setIsSearching(false);
        return;
      }

      const contract = new EscrowProgram(connection, tempWallet);
      const offer = await contract.getOffer(
        new PublicKey(formData.makerAddress),
        new BN(formData.offerId)
      );

      if (!offer) {
        toast("Offer not found. Please check the maker address and offer ID.");
        return;
      }

      // Check if offer still has tokens (not taken)
      if (offer.tokenAOfferedAmount.isZero()) {
        toast("This offer has already been taken.");
        return;
      }

      setFoundOffer(offer);
      toast("Offer found!");
    } catch (error) {
      console.error("Error searching for offer:", error);
      toast("Error searching for offer. Please check the inputs.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleTakeOffer = async () => {
    if (!isWalletConnected) {
      select(wallets[0].adapter.name);
      await connect();
      return;
    }

    if (!foundOffer) return;

    onTakeOffer(foundOffer);
    setIsOpen(false);
    setFoundOffer(null);
    setFormData({ makerAddress: "", offerId: "" });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFoundOffer(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Search className="mr-2 h-4 w-4" />
          Find Offer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Find Offer</DialogTitle>
          <DialogDescription>
            Enter the maker's wallet address and the offer ID to find and take
            an offer.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSearch}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="makerAddress">Maker Wallet Address</Label>
              <Input
                id="makerAddress"
                name="makerAddress"
                placeholder="Enter maker's wallet address"
                value={formData.makerAddress}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="offerId">Offer ID</Label>
              <Input
                id="offerId"
                name="offerId"
                placeholder="Enter the offer ID number"
                type="number"
                min="0"
                value={formData.offerId}
                onChange={handleInputChange}
              />
            </div>

            <Button type="submit" variant="secondary" disabled={isSearching}>
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search Offer
                </>
              )}
            </Button>

            {foundOffer && (
              <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-3">Offer Found</h4>
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl mb-1">{tokenAMetadata?.icon}</div>
                    <div className="font-medium">
                      {foundOffer.tokenAOfferedAmount.toString()}{" "}
                      {tokenAMetadata?.symbol}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      You receive
                    </div>
                  </div>
                  <div className="text-xl">←</div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">{tokenBMetadata?.icon}</div>
                    <div className="font-medium">
                      {foundOffer.tokenBWantedAmount.toString()}{" "}
                      {tokenBMetadata?.symbol}
                    </div>
                    <div className="text-xs text-muted-foreground">You pay</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            {foundOffer && (
              <Button
                type="button"
                onClick={handleTakeOffer}
                disabled={!foundOffer}
              >
                {!isWalletConnected
                  ? "Connect Wallet to Take"
                  : "Take This Offer"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export type { FoundOffer };
