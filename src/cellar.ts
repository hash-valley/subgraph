import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  Staked,
  Withdrawn,
  Spoiled,
  Cellar as CellarContract,
} from "../generated/Cellar/Cellar";
import { Bottle, VineProtocol } from "../generated/schema";
import { WineBottle as BottleContract } from "../generated/WineBottle/WineBottle";

export function handleStaked(event: Staked): void {
  let bottle = Bottle.load(event.params.tokenId.toString()) as Bottle;
  bottle.inCellar = true;
  bottle.canEnterCellar = false;
  bottle.stakedAt = event.block.timestamp;
  bottle.save();
}

export function handleWithdrawn(event: Withdrawn): void {
  let bottle = Bottle.load(event.params.tokenId.toString()) as Bottle;
  bottle.inCellar = false;
  bottle.withdrawnAt = event.block.timestamp;
  bottle.save();
}

export function handleSpoiled(event: Spoiled): void {
  let bottle = Bottle.load(event.params.tokenId.toString()) as Bottle;
  bottle.spoiled = true;
  bottle.inCellar = false;

  let cellarTime = CellarContract.bind(event.address).cellarTime(
    event.params.tokenId
  );

  let vineProtocol = VineProtocol.load("0") as VineProtocol;
  let bottleAddress = Address.fromString(vineProtocol.bottle.toHex());
  let bottleContract = BottleContract.bind(bottleAddress);
  let cellarAged = bottleContract.cellarAged(cellarTime);

  bottle.rejuvenateCost = cellarAged
    .times(BigInt.fromString("1000000000000000000"))
    .div(BigInt.fromI32(86400))
    .times(BigInt.fromI32(3));
  bottle.save();
}
