#! /usr/bin/env node
import fs from "fs";
import JsonAdapter from "../src/tools/consolidator/adapters/json";
import { Consolidator } from "../src/tools/consolidator/consolidator";
import arg from "arg";
import { getApi, prefixToArray } from "../src/tools/utils";

const consolidate = async () => {
  const args = arg({
    "--json": String, // The JSON file from which to consolidate
    "--collection": String, // Filter by specific collection
    "--ws": String, // Optional websocket url
    "--prefixes": String, // Limit remarks to prefix. No default. Can be hex (0x726d726b,0x524d524b) or string (rmrk,RMRK), or combination (rmrk,0x524d524b), separate with comma for multiple
    "--out": String, // optional output name
    "--noinvalid": Boolean, // don't include invalid calls
  });

  const ws = args["--ws"] || "ws://127.0.0.1:9944";
  const api = await getApi(ws);

  const prefixes = prefixToArray(args["--prefixes"] || "0x726d726b,0x524d524b");

  const systemProperties = await api.rpc.system.properties();
  const { ss58Format: chainSs58Format } = systemProperties.toHuman();

  const ss58Format = (chainSs58Format as number) || 2;

  const file = args["--json"];
  const out = args["--out"];
  const noInvalid = args["--noinvalid"] || false;

  const collectionFilter = args["--collection"];
  if (!file) {
    console.error("File path must be provided");
    process.exit(1);
  }
  // Check the JSON file exists and is reachable
  try {
    fs.accessSync(file, fs.constants.R_OK);
  } catch (e) {
    console.error("File is not readable. Are you providing the right path?");
    process.exit(1);
  }
  const ja = new JsonAdapter(file, prefixes);
  const remarks = ja.getRemarks();
  const con = new Consolidator(ss58Format);
  let result = await con.consolidate(remarks);
  if (collectionFilter) {
    result = {
      ...result,
      nfts: result.nfts.filter((nft) => nft.collection === collectionFilter),
      collections: result.collections.filter(
        (col) => col.id === collectionFilter
      ),
    };
  }

  //@ts-ignore
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };
  fs.writeFileSync(
    out ? `consolidated-from-${out}` : `consolidated-from-${file}`,
    JSON.stringify({
      ...result,
      invalid: noInvalid ? [] : result.invalid,
      lastBlock: ja.getLastBlock(),
    })
  );
  process.exit(0);
};

consolidate();
