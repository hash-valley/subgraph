import { Transfer as GiveawayTransfer, Approval as GiveawayApproval } from "../generated/Vinegar/Vinegar";
import { getOrCreateAccount, ZERO_ADDRESS } from "./utils";
import { VineProtocol } from "../generated/schema";

export function handleVinegarTransfer(event: GiveawayTransfer): void {
  if (event.params.from.toHex() != ZERO_ADDRESS) {
    let from = getOrCreateAccount(event.params.from);
    from.vinegarBalance = from.vinegarBalance.minus(event.params.value);
    from.save();
  }

  if (event.params.to.toHex() != ZERO_ADDRESS) {
    let to = getOrCreateAccount(event.params.to);
    to.vinegarBalance = to.vinegarBalance.plus(event.params.value);
    to.save();
  }
}

export function handleGiveawayApproval(event: GiveawayApproval): void {
  let protocol = VineProtocol.load("0") as VineProtocol;
  if (event.params.spender == protocol.giveaway) {
    let account = getOrCreateAccount(event.params.owner)
    account.giveawayAllowance = account.giveawayAllowance.plus(event.params.value)
    account.save()
  }
}