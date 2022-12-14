import { BigInt } from "@graphprotocol/graph-ts";
import { Bottle, VineProtocol, NewUri } from "../generated/schema";
import { Suggest, Support, Retort, Complete, Setup } from "../generated/VineUri/VotableUri";

export function handleSuggest(event: Suggest): void {
  let newUri = new NewUri(event.params.startTimestamp.toHex() + "-" + "VINEYARD") as NewUri;
  newUri.artist = event.params.newArtist;
  newUri.votesFor = event.params.forVotes;
  newUri.votesAgainst = BigInt.fromI32(0);
  newUri.newUri = event.params.newUri;
  newUri.startTimestamp = event.params.startTimestamp;
  newUri.type = "VINEYARD";
  newUri.completed = false;
  newUri.votes = [event.params.bottle];
  newUri.save();

  let bottle = Bottle.load(event.params.bottle.toString()) as Bottle;
  bottle.lastVotedWith = event.block.timestamp;
  bottle.save();
}

export function handleSupport(event: Support): void {
  let newUri = NewUri.load(event.params.startTimestamp.toHex() + "-" + "VINEYARD") as NewUri;
  newUri.votesFor = event.params.forVotes;
  newUri.votes = newUri.votes.concat([event.params.bottle]);
  newUri.save();

  let bottle = Bottle.load(event.params.bottle.toString()) as Bottle;
  bottle.lastVotedWith = event.block.timestamp;
  bottle.save();
}

export function handleRetort(event: Retort): void {
  let newUri = NewUri.load(event.params.startTimestamp.toHex() + "-" + "VINEYARD") as NewUri;
  newUri.votesAgainst = event.params.againstVotes;
  newUri.votes = newUri.votes.concat([event.params.bottle]);
  newUri.save();

  let bottle = Bottle.load(event.params.bottle.toString()) as Bottle;
  bottle.lastVotedWith = event.block.timestamp;
  bottle.save();
}

export function handleComplete(event: Complete): void {
  let vineProtocol = VineProtocol.load("0") as VineProtocol;

  let newUri = NewUri.load(event.params.startTimestamp.toHex() + "-" + "VINEYARD") as NewUri;
  newUri.completed = true;
  newUri.version = vineProtocol.vineImgVersions;
  newUri.save();

  vineProtocol.vineImgVersions += 1;
  vineProtocol.save();
}

export function handleSetup(event: Setup): void {
  let newUri = new NewUri(event.block.timestamp.toHex() + "-" + "VINEYARD") as NewUri;
  newUri.version = 0;
  newUri.artist = event.params.newArtist;
  newUri.votesFor = BigInt.fromI32(0);
  newUri.votesAgainst = BigInt.fromI32(0);
  newUri.newUri = event.params.newUri;
  newUri.startTimestamp = event.block.timestamp;
  newUri.type = "VINEYARD";
  newUri.completed = true;
  newUri.votes = [];
  newUri.save();
}
