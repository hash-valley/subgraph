import {
  Transfer as BottleTransfer,
  BottleMinted,
  Rejuvenated,
  Suggest,
  Support,
  Retort,
  Complete,
} from "../generated/WineBottle/WineBottle";
import { Bottle, VineProtocol, NewUri } from "../generated/schema";
import { BigInt } from "@graphprotocol/graph-ts";
import { getOrCreateAccount, ZERO_ADDRESS } from "./utils";

export function handleBottleTransfer(event: BottleTransfer): void {
  let bottle = Bottle.load(event.params.tokenId.toHex());
  if (bottle == null || event.params.from.toHex() == ZERO_ADDRESS) {
    bottle = new Bottle(event.params.tokenId.toHex());
    bottle.tokenId = event.params.tokenId;
    bottle.inCellar = false;
    bottle.spoiled = false;
    bottle.canEnterCellar = true;
    bottle.burnt = false;
    bottle.lastVotedWith = BigInt.fromI32(0);
    bottle.attributes = [];
  }

  let cellarAddress = (VineProtocol.load("0") as VineProtocol).cellar.toHex();
  if (
    event.params.to.toHex() != cellarAddress &&
    event.params.to.toHex() != ZERO_ADDRESS
  ) {
    let account = getOrCreateAccount(event.params.to);
    bottle.owner = account.id;
  }
  bottle.save();
}

export function handleBottleMinted(event: BottleMinted): void {
  let bottle = Bottle.load(event.params.tokenId.toHex()) as Bottle;
  bottle.attributes = event.params.attributes;
  bottle.save();
}

export function handleRejuvenated(event: Rejuvenated): void {
  let oldBottle = Bottle.load(event.params.oldTokenId.toHex()) as Bottle;
  oldBottle.owner = ZERO_ADDRESS;
  oldBottle.burnt = true;
  oldBottle.rejuvenatedTo = event.params.newTokenId.toHex();
  oldBottle.save();

  let newBottle = Bottle.load(event.params.newTokenId.toHex()) as Bottle;
  newBottle.rejuvenatedFrom = oldBottle.id;
  newBottle.save();
}

export function handleBottleSuggest(event: Suggest): void {
  let newUri = new NewUri(event.params.startTimestamp.toHex()) as NewUri;
  newUri.artist = event.params.artist;
  newUri.votesFor = event.params.forVotes;
  newUri.votesAgainst = BigInt.fromI32(0);
  newUri.newUri = event.params.newUri;
  newUri.startTimestamp = event.params.startTimestamp;
  newUri.type = "BOTTLE";
  newUri.completed = false;
  newUri.votes = [event.params.bottle];
  newUri.save();

  let bottle = Bottle.load(event.params.bottle.toHex()) as Bottle;
  bottle.lastVotedWith = event.block.timestamp;
  bottle.save();
}

export function handleBottleSupport(event: Support): void {
  let newUri = NewUri.load(event.params.startTimestamp.toHex()) as NewUri;
  newUri.votesFor = event.params.forVotes;
  newUri.votes = newUri.votes.concat([event.params.bottle]);
  newUri.save();

  let bottle = Bottle.load(event.params.bottle.toHex()) as Bottle;
  bottle.lastVotedWith = event.block.timestamp;
  bottle.save();
}

export function handleBottleRetort(event: Retort): void {
  let newUri = NewUri.load(event.params.startTimestamp.toHex()) as NewUri;
  newUri.votesAgainst = event.params.againstVotes;
  newUri.votes = newUri.votes.concat([event.params.bottle]);
  newUri.save();

  let bottle = Bottle.load(event.params.bottle.toHex()) as Bottle;
  bottle.lastVotedWith = event.block.timestamp;
  bottle.save();
}

export function handleBottleComplete(event: Complete): void {
  let newUri = NewUri.load(event.params.startTimestamp.toHex()) as NewUri;
  newUri.completed = true;
  newUri.save();
}
