import { FoundOffer } from "@/components/dialogs/find-offer-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

import { useMetadata } from "@/hooks/useMetadata";

export default function OfferConfirmation({
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
