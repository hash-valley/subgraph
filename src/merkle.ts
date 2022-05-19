import { Claimed } from "../generated/MerkleDiscount/MerkleDiscount";
import { getOrCreateAccount } from "./utils";

export function handleClaimed(event: Claimed): void {
  let account = getOrCreateAccount(event.params.account);
  account.claimedDiscount = true;
  account.save();
}
