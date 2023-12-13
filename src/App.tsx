import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import Variable from 'Variable';

type VotingData = {
    accounts: Record<
        string,
        {
            created_at_timestamp: number;
            first_transaction_from: string;
            received_transactions_before_vote: number;
        }
    >;
    votes: {
        total: string[];
        TameQuest: string[];
        Janus: string[];
        DAOWakanda: string[];
        Aurally: string[];
        CompX: string[];
    };
};

const legendNames: Record<string, string> = {
    v: 'Valid votes',
    f1: 'One fraud condition votes',
    f2: 'Two fraud conditions votes',
    f3: 'Three fraud conditions votes',
    e: 'Votes used to disqualify cheaters',
};

function App() {
    const [votingData, setVotingData] = useState<VotingData>();
    const [minActiveDays, setMinActiveDays] = useState<number>(1);
    const [minTransactions, setMinTransactions] = useState<number>(5);
    const [fundedByLimit, setFundedByLimit] = useState<number>(5);

    const updateVotingData = async () => {
        const data = await axios.get<VotingData>('https://s3.vestige.fi/bab-votes.json');
        setVotingData(data.data);
    };
    useEffect(() => {
        updateVotingData();
        let interval = setInterval(updateVotingData, 30000);
        return () => clearInterval(interval);
    }, []);

    const [data, funderData, topFunders] = useMemo(() => {
        const votes: Record<keyof VotingData['votes'], number[]> = {
            total: [0, 0, 0, 0, 0],
            TameQuest: [0, 0, 0, 0, 0],
            Janus: [0, 0, 0, 0, 0],
            DAOWakanda: [0, 0, 0, 0, 0],
            Aurally: [0, 0, 0, 0, 0],
            CompX: [0, 0, 0, 0, 0],
        };
        const funderAccounts: Record<string, number[]> = {};
        if (votingData) {
            Object.keys(votingData.accounts).forEach((voterAddress) => {
                const funder = votingData.accounts[voterAddress].first_transaction_from;
                if (!funderAccounts[funder]) {
                    funderAccounts[funder] = [1, 0, 0, 0, 0, 0];
                } else {
                    funderAccounts[funder][0] += 1;
                }
            });
            const minTimestamp = 1702422000 - (minActiveDays - 1) * 24 * 60 * 60;
            Object.keys(votes).forEach((project, i) => {
                const voters = votingData.votes[project as keyof VotingData['votes']];

                voters.forEach((address) => {
                    let fraudLevel = 0;
                    const account = votingData.accounts[address];
                    if (
                        account.first_transaction_from === 'FRAUDD77SWCXYGJZS7G5GTNISGWQMM3JEIJIUNGOT64CTG25DJNA45EB7Y'
                    ) {
                        votes[project as keyof VotingData['votes']][4] += 1;
                    } else {
                        if (i > 0) funderAccounts[account.first_transaction_from][i] += 1;
                        if (funderAccounts[account.first_transaction_from][0] - 1 > fundedByLimit) fraudLevel += 1;
                        if (account.created_at_timestamp > minTimestamp) fraudLevel += 1;
                        if (account.received_transactions_before_vote < minTransactions) fraudLevel += 1;
                        votes[project as keyof VotingData['votes']][fraudLevel] += 1;
                    }
                });
            });
        }
        const funders = Object.keys(funderAccounts);
        funders.sort((a, b) => funderAccounts[b][0] - funderAccounts[a][0]);
        return [
            Object.keys(votes).map((project) => ({
                name: project,
                v: votes[project as keyof VotingData['votes']][0],
                f1: votes[project as keyof VotingData['votes']][1],
                f2: votes[project as keyof VotingData['votes']][2],
                f3: votes[project as keyof VotingData['votes']][3],
                e: votes[project as keyof VotingData['votes']][4],
            })),
            funderAccounts,
            funders.slice(0, 15),
        ];
    }, [votingData, minActiveDays, minTransactions, fundedByLimit]);

    return (
        <div className="flex justify-center text-center flex-col items-center">
            <div className="p-4">
                <h1 className="heading text-4xl">Build a Bull voting fraud detector</h1>
            </div>
            <div className="pb-2 text-sm opacity-60">
                Calculated from on-chain data. <br />
                Calculation scripts:{' '}
                <a
                    className="font-bold text-blue-500 hover:text-blue-600"
                    href="https://github.com/grzracz/BaBFraud"
                    target="_blank"
                >
                    https://github.com/grzracz/BaBFraud
                </a>
            </div>
            <div>
                <h1 className="font-bold text-center">Fraud criteria:</h1>
                <div className="space-y-2">
                    <div>
                        Account{' '}
                        <b>
                            younger than <Variable min={1} step={1} value={minActiveDays} onChange={setMinActiveDays} />{' '}
                            days
                        </b>
                    </div>
                    <div>
                        Account received{' '}
                        <b>
                            less than{' '}
                            <Variable min={2} step={5} value={minTransactions} onChange={setMinTransactions} />{' '}
                            transactions before voting
                        </b>
                    </div>
                    <div>
                        Account was funded by an account that{' '}
                        <b>
                            made at least{' '}
                            <Variable min={1} step={1} value={fundedByLimit} onChange={setFundedByLimit} /> other voting
                            accounts
                        </b>
                    </div>
                </div>
            </div>
            <div className="flex w-full">
                <ResponsiveContainer width="100%" height={500}>
                    <BarChart
                        data={data}
                        margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend formatter={(a) => legendNames[a]} />
                        <Bar dataKey="v" stackId="a" fill="#8884d8" />
                        <Bar dataKey="f1" stackId="a" fill="#feb9b9" />
                        <Bar dataKey="f2" stackId="a" fill="#ff5757" />
                        <Bar dataKey="f3" stackId="a" fill="#f40000" />
                        <Bar dataKey="e" stackId="a" fill="#dcdcdc" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="pb-32 px-4">
                <h1 className="font-bold text-center heading text-2xl pt-8">Top fraud accounts:</h1>
                <div className="grid grid-cols-12 border">
                    <div className="font-bold col-span-5">Funder address</div>
                    <div className="font-bold col-span-2 text-center">Created voting accounts</div>
                    <div className="col-span-5">
                        <div>Votes for</div>
                        <div className="font-bold grid grid-cols-5">
                            <div>TameQuest</div>
                            <div>Janus</div>
                            <div>DAOWakanda</div>
                            <div>Aurally</div>
                            <div>CompX</div>
                        </div>
                    </div>
                    {topFunders.map((f) =>
                        f === 'FRAUDD77SWCXYGJZS7G5GTNISGWQMM3JEIJIUNGOT64CTG25DJNA45EB7Y' ? (
                            <>
                                <div className="border bg-gray-100 text-ellipsis col-span-5 text-gray-800 max-w-full overflow-hidden font-bold pb-2">
                                    {f}
                                    <div>
                                        This address was used to equalize the votes for non-cheating projects and
                                        disqualify the cheaters
                                    </div>
                                </div>
                                <div className="border bg-gray-100 col-span-2 text-center">{funderData[f][0]}</div>
                                <div className="border bg-gray-100 text-center">1795</div>
                                <div className="border bg-gray-100 text-center">1795</div>
                                <div className="border bg-gray-100 text-center">{funderData[f][3] || ''}</div>
                                <div className="border bg-gray-100 text-center">{funderData[f][4] || ''}</div>
                                <div className="border bg-gray-100 text-center">1795</div>
                            </>
                        ) : (
                            <>
                                <div className="border text-ellipsis col-span-5 max-w-full overflow-hidden">{f}</div>
                                <div className="border col-span-2 text-center">{funderData[f][0]}</div>
                                <div className="border text-center">{funderData[f][1] || ''}</div>
                                <div className="border text-center">{funderData[f][2] || ''}</div>
                                <div className="border text-center">{funderData[f][3] || ''}</div>
                                <div className="border text-center">{funderData[f][4] || ''}</div>
                                <div className="border text-center">{funderData[f][5] || ''}</div>
                            </>
                        ),
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;
