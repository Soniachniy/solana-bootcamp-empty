import { toast } from "sonner";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";

import { Connection } from "@solana/web3.js";
import { clusterApiUrl } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

import { EscrowProgram } from "@/solana-service/program";
import { Wallet } from "@coral-xyz/anchor";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateOfferDialog } from "@/components/dialogs/create-offer-dialog";
import { useState } from "react";
import {
  FindOfferDialog,
  FoundOffer,
} from "@/components/dialogs/find-offer-dialog";
import OfferConfirmation from "./offer-confirmation";

export default function ExchangePage() {
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
        clusterApiUrl(WalletAdapterNetwork.Devnet),
      );

      const contract = new EscrowProgram(connection, wallet as Wallet);
      const result = await contract.takeOffer(
        selectedOffer.maker,
        selectedOffer.offerAddress,
        selectedOffer.tokenMintA,
        selectedOffer.tokenMintB,
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
