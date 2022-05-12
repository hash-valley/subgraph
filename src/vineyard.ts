import {
  Transfer as VineyardTransfer,
  VineyardMinted,
  Planted,
  Harvested,
  Vineyard as VineContract,
  Start,
  Suggest,
  Support,
  Retort,
  Complete,
  SprinklerPurchased,
} from "../generated/Vineyard/Vineyard";
import {
  AddressesSet,
  AddressStorage as ASContract,
} from "../generated/AddressStorage/AddressStorage";
import {
  Vineyard,
  Bottle,
  Account,
  VineProtocol,
  NewUri,
} from "../generated/schema";
import { BigInt } from "@graphprotocol/graph-ts";
import { getOrCreateAccount, ZERO_ADDRESS } from "./utils";

export function handleVineyardTransfer(event: VineyardTransfer): void {
  let vineyard = Vineyard.load(event.params.tokenId.toHex());
  if (vineyard == null || event.params.from.toHex() == ZERO_ADDRESS) {
    vineyard = new Vineyard(event.params.tokenId.toHex());
    vineyard.tokenId = event.params.tokenId;
    vineyard.location = 0;
    vineyard.elevation = 0;
    vineyard.soil = 0;
    vineyard.xp = BigInt.fromI32(0);
    vineyard.seasonsPlanted = [];
    vineyard.seasonsHarvested = [];
  }
  let account = getOrCreateAccount(event.params.to);
  vineyard.owner = account.id;
  vineyard.save();
}

export function handleVineyardMinted(event: VineyardMinted): void {
  let vineyard = Vineyard.load(event.params.tokenId.toHex()) as Vineyard;
  vineyard.location = event.params.location.toI32();
  vineyard.elevation = event.params.elevation.toI32();
  if (event.params.elevationNegative.toI32() == 1) {
    vineyard.elevation *= -1;
  }
  vineyard.soil = event.params.soilType.toI32();
  vineyard.save();

  let vineProtocol = VineProtocol.load("0") as VineProtocol;
  vineProtocol.mintedVineyards = vineProtocol.mintedVineyards + 1;
  vineProtocol.save();
}

export function handleSprinklerPurchased(event: SprinklerPurchased): void {
  let vineyard = Vineyard.load(event.params.tokenId.toHex()) as Vineyard;
  let threeYears = BigInt.fromI32(94348800);
  vineyard.sprinklerExpires = event.block.timestamp.plus(threeYears);
  vineyard.save();
}

export function handlePlanted(event: Planted): void {
  let vineyard = Vineyard.load(event.params.tokenId.toHex()) as Vineyard;
  vineyard.seasonsPlanted = vineyard.seasonsPlanted.concat([
    event.params.season.toI32(),
  ]);
  vineyard.save();
}

export function handleHarvested(event: Harvested): void {
  let vineyard = Vineyard.load(event.params.tokenId.toHex()) as Vineyard;
  vineyard.seasonsHarvested = vineyard.seasonsHarvested.concat([
    event.params.season.toI32(),
  ]);

  let contract = VineContract.bind(event.address);
  vineyard.xp = contract.xp(event.params.tokenId);
  vineyard.save();

  let bottle = Bottle.load(event.params.bottleId.toHex()) as Bottle;
  bottle.from = vineyard.id;
  bottle.save();
}

export function handleStart(event: Start): void {
  let protocol = VineProtocol.load("0") as VineProtocol;
  protocol.gameStarted = true;
  protocol.save();
}

export function handleVineSuggest(event: Suggest): void {
  let newUri = new NewUri(event.params.startTimestamp.toHex()) as NewUri;
  newUri.artist = event.params.artist;
  newUri.votesFor = event.params.forVotes;
  newUri.votesAgainst = BigInt.fromI32(0);
  newUri.newUri = event.params.newUri;
  newUri.startTimestamp = event.params.startTimestamp;
  newUri.type = "VINEYARD";
  newUri.completed = false;
  newUri.votes = [event.params.bottle];
  newUri.save();

  let bottle = Bottle.load(event.params.bottle.toHex()) as Bottle;
  bottle.lastVotedWith = event.block.timestamp;
  bottle.save();
}

export function handleVineSupport(event: Support): void {
  let newUri = NewUri.load(event.params.startTimestamp.toHex()) as NewUri;
  newUri.votesFor = event.params.forVotes;
  newUri.votes = newUri.votes.concat([event.params.bottle]);
  newUri.save();

  let bottle = Bottle.load(event.params.bottle.toHex()) as Bottle;
  bottle.lastVotedWith = event.block.timestamp;
  bottle.save();
}

export function handleVineRetort(event: Retort): void {
  let newUri = NewUri.load(event.params.startTimestamp.toHex()) as NewUri;
  newUri.votesAgainst = event.params.againstVotes;
  newUri.votes = newUri.votes.concat([event.params.bottle]);
  newUri.save();

  let bottle = Bottle.load(event.params.bottle.toHex()) as Bottle;
  bottle.lastVotedWith = event.block.timestamp;
  bottle.save();
}

export function handleVineComplete(event: Complete): void {
  let newUri = NewUri.load(event.params.startTimestamp.toHex()) as NewUri;
  newUri.completed = true;
  newUri.save();
}

export function handleAddressesSet(event: AddressesSet): void {
  let vineProtocol = new VineProtocol("0");
  vineProtocol.gameStarted = false;

  let asContract = ASContract.bind(event.address);
  vineProtocol.cellar = asContract.cellar();
  vineProtocol.vinegar = asContract.vinegar();
  vineProtocol.giveaway = asContract.giveawayToken();
  let vineAddress = asContract.vineyard();
  vineProtocol.vineyard = vineAddress;
  vineProtocol.bottle = asContract.bottle();

  let vineContract = VineContract.bind(vineAddress);
  vineProtocol.maxVineyards = vineContract.maxVineyards().toI32();
  vineProtocol.mintedVineyards = 0;

  vineProtocol.save();

  let account = new Account(ZERO_ADDRESS);
  account.vinegarBalance = BigInt.fromString("0");
  account.save();
}
