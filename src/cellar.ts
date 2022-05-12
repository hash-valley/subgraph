import {
  Staked,
  Withdrawn,
  Spoiled,
  Cellar as CellarContract,
} from "../generated/Cellar/Cellar";
import { Bottle } from "../generated/schema";

export function handleStaked(event: Staked): void {
  let bottle = Bottle.load(event.params.tokenId.toHex()) as Bottle;
  bottle.inCellar = true;
  bottle.canEnterCellar = false;
  bottle.stakedAt = event.block.timestamp;
  bottle.save();
}

export function handleWithdrawn(event: Withdrawn): void {
  let bottle = Bottle.load(event.params.tokenId.toHex()) as Bottle;
  bottle.inCellar = false;
  bottle.withdrawnAt = event.block.timestamp;
  bottle.save();
}

export function handleSpoiled(event: Spoiled): void {
  let bottle = Bottle.load(event.params.tokenId.toHex()) as Bottle;
  bottle.spoiled = true;
  bottle.inCellar = false;

  let contract = CellarContract.bind(event.address);
  bottle.rejuvenateCost = contract.cellarTime(event.params.tokenId);
  bottle.save();
}
