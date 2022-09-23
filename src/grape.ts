import { Transfer as GrapeTransfer } from "../generated/Vinegar/Vinegar";
import { getOrCreateAccount, ZERO_ADDRESS } from "./utils";

export function handleGrapeTransfer(event: GrapeTransfer): void {
  if (event.params.from.toHex() != ZERO_ADDRESS) {
    let from = getOrCreateAccount(event.params.from);
    from.grapeBalance = from.grapeBalance.minus(event.params.value);
    from.save();
  }

  if (event.params.to.toHex() != ZERO_ADDRESS) {
    let to = getOrCreateAccount(event.params.to);
    to.grapeBalance = to.grapeBalance.plus(event.params.value);
    to.save();
  }
}
