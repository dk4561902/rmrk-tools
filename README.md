# RMRK Tools

Typescript implementation of the [RMRK spec](https://github.com/Swader/rmrk-spec/).

![Tests](https://github.com/Swader/rmrk-tools/actions/workflows/run-tests.yml/badge.svg)

## Installation

> Note: NodeJS 14+ is required. Please install with [NVM](https://nvm.sh).

`yarn install git+https://github.com/Swader/rmrk-tools`

## Usage

### ESM / Typescript

#### Fetch Manually and consolidate

```
import { fetchRemarks, getRemarksFromBlocks, getLatestFinalizedBlock, Consolidator } from 'rmrk-tools';
import { ApiPromise, WsProvider } from '@polkadot/api';

const wsProvider = new WsProvider('wss://node.rmrk.app');

const fetchAndConsolidate = async () => {
    try {
        const api = await ApiPromise.create({ provider: wsProvider });
        const to = await getLatestFinalizedBlock(api);

        const remarkBlocks = await fetchRemarks(api, 6431422, to, ['']);
        if (remarkBlocks && !isEmpty(remarkBlocks)) {
          const remarks = getRemarksFromBlocks(remarkBlocks);
          const consolidator = new Consolidator();
          const { nfts, collections } = consolidator.consolidate(remarks);
          console.log('Consolidated nfts:', nfts);
          console.log('Consolidated collections:', collections);
        }
    } catch (error) {
        console.log(error)
    }
}
```

#### Subscribe to Remarks

```
import { RemarkListener } from 'rmrk-tools';
import { WsProvider } from "@polkadot/api";

const wsProvider = new WsProvider("wss://node.rmrk.app");

const startListening = async () => {
  const listener = new RemarkListener({ providerInterface: wsProvider, prefixes: [], initialRemarksUrl: 'ipfs://optional-urlp-for-remarks-dumps' });
  const subscriber = listener.initialiseObservable();
  subscriber.subscribe((val) => console.log(val));
};

startListening();
```

if you want to subscribe to consolidated state that includes unfinilised blocks to react to them quickly, you can use:
```
const unfinilisedSubscriber = listener.initialiseObservableUnfinalised();
unfinilisedSubscriber.subscribe((val) => console.log('Unfinalised consolidated:', val));
```

### Browser

```
<script src="node_modules/rmrk-tools"></script>
<script>
    const { Collection, NFT, Consolidator, fetchRemarks } = window.rmrkTools;
</script>
```

TBD

## Helper Tools

### Fetch

Grabs all `system.remark` extrinsics in a block range and logs an array of them all, keyed by block.

Export functionality will be added soon (SQL and file, total and in chunks).

```bash
yarn cli:fetch
```

Optional parameters:

- `--ws URL`: websocket URL to connecto to, defaults to `127.0.0.1:9944`
- `--from FROM`: block from which to start, defaults to 0 (note that for RMRK, canonically the block 4892957 is genesis)
- `--to TO`: block until which to search, defaults to latest
- `--prefixes PREFIXES`: limit return data to only remarks with these prefixes. Can be comma separated list. Prefixes can be hex or utf8. Case sensitive. Example: 0x726d726b,0x524d524b
- `--append PATH`: special mode which takes the last block in an existing dump file + 1 as FROM (overrides FROM). Appends new blocks with remarks into that file. Convenient for running via cronjob for continuous remark list building. Performance right now is 1000 blocks per 10 seconds, so processing 5000 blocks with a `* * * * *` cronjob should be doable. Example: `yarn cli:fetch --prefixes=0x726d726b,0x524d524b --append=somefile.json`

The return data will look like this:

```js
[
  {
    block: 8,
    call: [
      {
        call: "system.remark",
        value: "0x13371337",
      },
      {
        call: "balances.transfer",
        value:
          "5CK8D1sKNwF473wbuBP6NuhQfPaWUetNsWUNAAzVwTfxqjfr,10000000000000000",
      },
    ],
  },
  {
    block: 20,
    call: [
      {
        call: "system.remark",
        value: "0x13371338",
      },
    ],
  },
];
```

## Consolidate

Takes as input a JSON file and processes all remarks within it to reach a final state of the NFT ecosystem based on that JSON.

```bash
 yarn cli:consolidate --json=dumps/remarks-4892957-5437981-0x726d726b.json
```

Todo:

- [ ] Write adapter interface
- [ ] Support multiple adapters apart from JSON (SQL?)
- [ ] Write exporters for SQL (ready-to-execute, or even direct to DB)
- [ ] Write class for a single RMRK entry so it's easy to iterate through across these different adapters and consolidators

## Seed

> Note, none of the below is true, this is still VERY much a work in progress.

A local chain must be running in `--dev` mode for this to work.

```bash
yarn cli:seed --folder=[folder]
```

When running a local chain, you can run `yarn seed` to populate the chain with pre-written NFT configurations. This is good for testing UIs, wallets, etc. It will use the unlocked ALICE, BOB, and CHARLIE accounts so `--dev` is required here.

You can see how the seeders are written in `test/seed/default`. `yarn seed` will by default execute all the seeds in the `default` folder. If you want to execute only your own seeders, put them into a subfolder inside `test/seed` and provide the folder name: `yarn seed myfolder`.

Check that all edge cases are covered by running [Consolidate](#consolidate).
