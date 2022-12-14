import {
  Transfer as BottleTransfer,
  BottleMinted,
  Rejuvenated,
} from "../generated/WineBottle/WineBottle";
import { Bottle, VineProtocol } from "../generated/schema";
import { BigInt } from "@graphprotocol/graph-ts";
import { getOrCreateAccount, ZERO_ADDRESS } from "./utils";

export function handleBottleTransfer(event: BottleTransfer): void {
  let bottle = Bottle.load(event.params.tokenId.toString());
  if (bottle == null || event.params.from.toHex() == ZERO_ADDRESS) {
    bottle = new Bottle(event.params.tokenId.toString());
    bottle.tokenId = event.params.tokenId;
    bottle.inCellar = false;
    bottle.spoiled = false;
    bottle.canEnterCellar = true;
    bottle.burnt = false;
    bottle.lastVotedWith = BigInt.fromI32(0);
    bottle.attributes = [];
  }

  let cellarAddress = (VineProtocol.load("0") as VineProtocol).cellar.toHex();
  if (event.params.to.toHex() != cellarAddress && event.params.to.toHex() != ZERO_ADDRESS) {
    let account = getOrCreateAccount(event.params.to);
    bottle.owner = account.id;
  }
  bottle.save();
}

export function handleBottleMinted(event: BottleMinted): void {
  let bottle = Bottle.load(event.params.tokenId.toString()) as Bottle;
  bottle.attributes = event.params.attributes;
  bottle.save();
}

export function handleRejuvenated(event: Rejuvenated): void {
  let oldBottle = Bottle.load(event.params.oldTokenId.toString()) as Bottle;
  oldBottle.owner = ZERO_ADDRESS;
  oldBottle.burnt = true;
  oldBottle.rejuvenatedTo = event.params.newTokenId.toString();
  oldBottle.save();

  let newBottle = Bottle.load(event.params.newTokenId.toString()) as Bottle;
  newBottle.rejuvenatedFrom = oldBottle.id;
  newBottle.save();
}
