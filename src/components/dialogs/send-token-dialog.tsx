import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Send } from "lucide-react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import {
  createTransferInstruction,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface SendTokenDialogProps {
  mint: string;
  symbol: string;
  balance: number;
  decimals: number;
  icon?: string;
  disabled?: boolean;
}

export function SendTokenDialog({
  mint,
  symbol,
  balance,
  decimals,
  icon,
  disabled,
}: SendTokenDialogProps) {
  const [open, setOpen] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const queryClient = useQueryClient();

  const displayBalance = balance / Math.pow(10, decimals);

  const handleSend = async () => {
    if (!wallet?.publicKey || !recipient || !amount) {
      toast.error("Please fill in all fields");
      return;
    }

    let recipientPubkey: PublicKey;
    try {
      recipientPubkey = new PublicKey(recipient);
    } catch {
      toast.error("Invalid recipient address");
      return;
    }

    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      toast.error("Invalid amount");
      return;
    }

    if (amountNumber > displayBalance) {
      toast.error("Insufficient balance");
      return;
    }

    setLoading(true);

    try {
      const mintPubkey = new PublicKey(mint);
      const rawAmount = Math.floor(amountNumber * Math.pow(10, decimals));

      const senderAta = getAssociatedTokenAddressSync(
        mintPubkey,
        wallet.publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const recipientAta = getAssociatedTokenAddressSync(
        mintPubkey,
        recipientPubkey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const transaction = new Transaction();

      // Check if recipient ATA exists
      const recipientAtaInfo = await connection.getAccountInfo(recipientAta);
      if (!recipientAtaInfo) {
        // Create ATA for recipient
        transaction.add(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            recipientAta,
            recipientPubkey,
            mintPubkey,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );
      }

      // Add transfer instruction
      transaction.add(
        createTransferInstruction(
          senderAta,
          recipientAta,
          wallet.publicKey,
          rawAmount,
          [],
          TOKEN_PROGRAM_ID
        )
      );

      transaction.feePayer = wallet.publicKey;
      transaction.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;

      const signedTx = await wallet.signTransaction(transaction);
      const txId = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(txId, "confirmed");

      toast.success(`Successfully sent ${amount} ${symbol}!`);

      // Invalidate balances query to refresh
      queryClient.invalidateQueries({ queryKey: ["heliusBalances"] });

      setOpen(false);
      setRecipient("");
      setAmount("");
    } catch (error) {
      console.error("Send error:", error);
      toast.error("Failed to send tokens");
    } finally {
      setLoading(false);
    }
  };

  const handleMaxClick = () => {
    setAmount(displayBalance.toString());
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Send className="h-4 w-4 mr-1" />
          Send
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Send {icon} {symbol}
          </DialogTitle>
          <DialogDescription>
            Transfer tokens to another wallet address.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              placeholder="Enter Solana wallet address"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="amount">Amount</Label>
              <span className="text-xs text-muted-foreground">
                Balance: {displayBalance.toLocaleString()} {symbol}
              </span>
            </div>
            <div className="flex gap-2">
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={loading}
                step="any"
                min="0"
                max={displayBalance}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleMaxClick}
                disabled={loading}
              >
                Max
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={loading || !recipient || !amount}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
