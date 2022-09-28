import {
  Transfer as VineyardTransfer,
  VineyardMinted,
  Planted,
  Harvested,
  Vineyard as VineContract,
  Start,
  SprinklerPurchased,
  GrapesHarvested,
  LocaleUnlocked,
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
  GrapeStatus,
} from "../generated/schema";
import { Address, BigInt } from "@graphprotocol/graph-ts";
import { getOrCreateAccount, ZERO_ADDRESS } from "./utils";
import { SaleParams as SPContract } from "../generated/Vineyard/SaleParams";

export function handleVineyardTransfer(event: VineyardTransfer): void {
  let vineyard = Vineyard.load(event.params.tokenId.toString());
  if (vineyard == null || event.params.from.toHex() == ZERO_ADDRESS) {
    vineyard = new Vineyard(event.params.tokenId.toString());
    vineyard.tokenId = event.params.tokenId;
    vineyard.location = 0;
    vineyard.elevation = 0;
    vineyard.soil = 0;
    vineyard.xp = BigInt.fromI32(0);
    vineyard.witherDeadline = BigInt.fromI32(0);
    vineyard.vitalized = false;
    vineyard.seasonsPlanted = [];
    vineyard.seasonsHarvested = [];
  }
  let account = getOrCreateAccount(event.params.to);
  vineyard.owner = account.id;
  vineyard.save();
}

export function handleVineyardMinted(event: VineyardMinted): void {
  let vineyard = Vineyard.load(event.params.tokenId.toString()) as Vineyard;
  vineyard.location = event.params.location.toI32();
  vineyard.elevation = event.params.elevation.toI32();
  vineyard.soil = event.params.soilType.toI32();
  vineyard.vitalized = false;
  vineyard.save();

  let vineProtocol = VineProtocol.load("0") as VineProtocol;
  vineProtocol.mintedVineyards = vineProtocol.mintedVineyards + 1;

  let contract = SPContract.bind(
    // SET TO CURRENT NETWORK CONFIG
    Address.fromString("0x9A676e781A523b5d0C0e43731313A708CB607508")
  );
  vineProtocol.currentPrice = contract.getSalesPrice(
    BigInt.fromI32(vineProtocol.mintedVineyards)
  );
  vineProtocol.save();
}

export function handleSprinklerPurchased(event: SprinklerPurchased): void {
  let vineyard = Vineyard.load(event.params.tokenId.toString()) as Vineyard;
  let threeYears = BigInt.fromI32(94348800);
  vineyard.sprinklerExpires = event.block.timestamp.plus(threeYears);
  vineyard.save();
}

export function handlePlanted(event: Planted): void {
  let vineyard = Vineyard.load(event.params.tokenId.toString()) as Vineyard;
  vineyard.seasonsPlanted = vineyard.seasonsPlanted.concat([
    event.params.season.toI32(),
  ]);
  vineyard.witherDeadline = BigInt.fromI32(0);
  vineyard.vitalized = false;
  vineyard.save();
}

export function handleHarvested(event: Harvested): void {
  let vineyard = Vineyard.load(event.params.tokenId.toString()) as Vineyard;
  vineyard.seasonsHarvested = vineyard.seasonsHarvested.concat([
    event.params.season.toI32(),
  ]);

  let contract = VineContract.bind(event.address);
  vineyard.xp = contract.xp(event.params.tokenId);
  vineyard.save();

  let bottle = Bottle.load(event.params.bottleId.toString()) as Bottle;
  bottle.from = vineyard.id;
  bottle.save();
}

export function handleStart(event: Start): void {
  let protocol = VineProtocol.load("0") as VineProtocol;
  protocol.gameStarted = true;
  protocol.startTime = event.block.timestamp;
  protocol.save();
}

export function handleAddressesSet(event: AddressesSet): void {
  let vineProtocol = VineProtocol.load("0");
  if (vineProtocol == null) {
    vineProtocol = new VineProtocol("0");
    vineProtocol.gameStarted = false;
    vineProtocol.mintedVineyards = 0;
    vineProtocol.bottleImgVersions = 1;
    vineProtocol.vineImgVersions = 1;

    let account = new Account(ZERO_ADDRESS);
    account.vinegarBalance = BigInt.fromString("0");
    account.giveawayBalance = BigInt.fromString("0");
    account.giveawayAllowance = BigInt.fromString("0");
    account.grapeBalance = BigInt.fromString("0");
    account.save();
  }

  let asContract = ASContract.bind(event.address);
  vineProtocol.cellar = asContract.cellar();
  vineProtocol.vinegar = asContract.vinegar();
  vineProtocol.giveaway = asContract.giveawayToken();
  let vineAddress = asContract.vineyard();
  vineProtocol.vineyard = vineAddress;
  vineProtocol.bottle = asContract.bottle();
  vineProtocol.royalty = asContract.royaltyManager();
  vineProtocol.wineUri = asContract.wineUri();
  vineProtocol.vineUri = asContract.vineUri();

  let vineContract = VineContract.bind(vineAddress);
  vineProtocol.maxVineyards = vineContract.maxVineyards().toI32();
  vineProtocol.currentPrice = BigInt.fromString("0");

  vineProtocol.save();
}

export function handleGrapesHarvested(event: GrapesHarvested): void {
  let grapeStatus = GrapeStatus.load(
    event.params.tokenId.toString() + "-" + event.params.season.toString()
  );
  if (grapeStatus == null) {
    grapeStatus = new GrapeStatus(
      event.params.tokenId.toString() + "-" + event.params.season.toString()
    );
    grapeStatus.vineyard = event.params.tokenId.toString();
    grapeStatus.season = event.params.season;
  }
  grapeStatus.harvested = event.params.harvested;
  grapeStatus.remaining = event.params.remaining;
  grapeStatus.save();
}

export function handleLocaleUnlocked(event: LocaleUnlocked): void {
  let vineProtocol = VineProtocol.load("0") as VineProtocol;
  vineProtocol.locales = event.params.locales;
  vineProtocol.save();
}
