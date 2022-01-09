import { Transfer as VinegarTransfer } from "../generated/Vinegar/Vinegar";
import { getOrCreateAccount, ZERO_ADDRESS } from "./utils";

export function handleVinegarTransfer(event: VinegarTransfer): void {
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
