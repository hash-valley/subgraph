import { Transfer } from "../generated/Badge/Badge";
import { getOrCreateAccount, ZERO_ADDRESS } from "./utils";

export function handleBadgeTransfer(event: Transfer): void {
  if (event.params.from.toHex() == ZERO_ADDRESS) {
    let to = getOrCreateAccount(event.params.to);
    to.earlySupporter = true;
    to.badgeCount = 1;
    to.save();
  } else if (event.params.to.toHex() != ZERO_ADDRESS) {
    let to = getOrCreateAccount(event.params.to);
    if (!to.badgeCount) {
      to.earlySupporter = true;
      to.badgeCount = 0;
    }
    to.badgeCount++;
    to.save();

    let from = getOrCreateAccount(event.params.from);
    from.badgeCount--;
    if (from.badgeCount == 0) {
      from.earlySupporter = false;
    }
    from.save();
  }
}
