import algosdk, { OnApplicationComplete } from 'algosdk';

const app = 1272433669;
const app_address = algosdk.getApplicationAddress(app);
// @ts-ignore
const account = algosdk.mnemonicToSecretKey('');

console.log(account.addr);

const client = new algosdk.Algodv2('', 'https://mainnet-api.algonode.cloud', 443);

const boxCost = 2500 + 400 * (32 + 7);

async function vote(suggestedParams: algosdk.SuggestedParams, index: number) {
    const temp = algosdk.generateAccount();
    const group = [
        algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            from: account.addr,
            to: temp.addr,
            amount: 200000,
            suggestedParams,
        }),
        algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            from: temp.addr,
            to: app_address,
            amount: boxCost,
            suggestedParams,
        }),
        algosdk.makeApplicationCallTxnFromObject({
            from: temp.addr,
            appIndex: app,
            onComplete: OnApplicationComplete.NoOpOC,
            appArgs: [
                Uint8Array.from(Buffer.from('xA/9qg==', 'base64')),
                Uint8Array.from(Buffer.from('AAA=', 'base64')),
                Uint8Array.from(Buffer.from('AAAAAAAAAAA=', 'base64')),
                Uint8Array.from([0, 5, 0, 0, 0, 1, 1]),
                Uint8Array.from(Buffer.from('AAA=', 'base64')),
                Uint8Array.from(Buffer.from('AQ==', 'base64')),
            ],
            foreignApps: [1272433810],
            boxes: [
                { appIndex: app, name: algosdk.decodeAddress(temp.addr).publicKey },
                { appIndex: app, name: Uint8Array.from([86]) },
            ],
            suggestedParams,
        }),
        algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            from: temp.addr,
            to: account.addr,
            amount: 0,
            closeRemainderTo: account.addr,
            suggestedParams,
        }),
    ];
    algosdk.assignGroupID(group);

    const signedTxn = [
        algosdk.signTransaction(group[0], account.sk),
        algosdk.signTransaction(group[1], temp.sk),
        algosdk.signTransaction(group[2], temp.sk),
        algosdk.signTransaction(group[3], temp.sk),
    ];
    console.log(`Sending vote ${index}`);
    await client.sendRawTransaction(signedTxn.map((tx) => tx.blob)).do();
}

const main = async () => {
    const suggestedParams = await client.getTransactionParams().do();
    for (let i = 0; i < 800; ++i) await vote(suggestedParams, i);
};

main();
