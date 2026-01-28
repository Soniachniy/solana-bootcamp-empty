import { AnchorProvider, Program, Wallet, web3, BN } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  getAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import escrowIdl from "./escrow.json";
import { Escrow } from "./idlType";
import { config } from "./config";

const TOKEN_PROGRAM = TOKEN_PROGRAM_ID;

export class EscrowProgram {
  protected program: Program<Escrow>;
  protected connection: web3.Connection;
  protected wallet: NodeWallet;

  constructor(connection: web3.Connection, wallet: Wallet) {
    const provider = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });
    this.program = new Program<Escrow>(escrowIdl as Escrow, provider);
    this.wallet = wallet;
    this.connection = connection;
  }

  createOfferPda = (maker: PublicKey, offerId: BN) => {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("offer"),
        maker.toBuffer(),
        offerId.toArrayLike(Buffer, "le", 8),
      ],
      new PublicKey(config.contractAddress),
    )[0];
  };

  async checkOfferExists(offerId: BN): Promise<boolean> {
    try {
      const offerAddress = this.createOfferPda(this.wallet.publicKey, offerId);
      const accountInfo = await this.connection.getAccountInfo(offerAddress);
      return accountInfo !== null;
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  async getOffer(maker: PublicKey, offerId: BN) {
    try {
      const offerAddress = this.createOfferPda(maker, offerId);
      const offerAccount = await this.program.account.offer.fetch(offerAddress);

      const vault = getAssociatedTokenAddressSync(
        offerAccount.tokenMintA,
        offerAddress,
        true,
        TOKEN_PROGRAM,
      );

      // Get vault balance for token A offered amount
      let tokenAOfferedAmount = new BN(0);
      try {
        const vaultAccount = await getAccount(this.connection, vault);
        tokenAOfferedAmount = new BN(vaultAccount.amount.toString());
      } catch {
        // Vault might not exist if offer was taken
      }

      return {
        id: offerAccount.id.toString(),
        offerId: offerAccount.id,
        maker: offerAccount.maker,
        tokenMintA: offerAccount.tokenMintA,
        tokenMintB: offerAccount.tokenMintB,
        tokenBWantedAmount: offerAccount.tokenBWantedAmount,
        tokenAOfferedAmount,
        offerAddress,
        vault,
      };
    } catch (e) {
      console.log("Error fetching offer:", e);
      return null;
    }
  }

  async makeOffer(
    tokenMintA: PublicKey,
    tokenMintB: PublicKey,
    tokenAmountA: number,
    tokenAmountB: number,
    userOfferId: string,
  ) {
    try {
      console.log(
        tokenAmountA,
        tokenAmountB,
        tokenMintA,
        tokenMintB,
        userOfferId,
      );

      return null;
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  async takeOffer(
    maker: PublicKey,
    offer: PublicKey,
    tokenMintA: PublicKey,
    tokenMintB: PublicKey,
  ) {
    try {
      console.log(maker, offer, tokenMintA, tokenMintB);
      return null;
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}
