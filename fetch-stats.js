import fs from 'fs';

const RIOT_API_KEY = process.env.RIOT_API_KEY;
const FACEIT_API_KEY = process.env.FACEIT_API_KEY;

const PLAYERS_CONFIG = [
  {
    playerName: "Sitek",
    role: "Admin",
    lolAccounts: [
      { gameName: "Sit3k", tagLine: "Sit3k" },
      { gameName: "S1 Siteek", tagLine: "EUNE" },
      { gameName: "eGirl from Dream", tagLine: "EUNE" }
    ],
    cs2: {
      faceitNickname: "SitekProgres",
      premierRating: "BRAK" 
    }
  },
  {
    playerName: "Miki",
    role: "MEMBER",
    lolAccounts: [
      { gameName: "LACOST", tagLine: "CWL" }
    ],
    cs2: {
      faceitNickname: "mikifive2001",
      premierRating: "BRAK"
    }
  },
  {
    playerName: "PaczCat",
    role: "MEMBER",
    lolAccounts: [
      { gameName: "jawnogrzesznica", tagLine: "Paczu" }
    ],
    cs2: {
      faceitNickname: "PaczCat",
      premierRating: "BRAK"
    }
  },
  {
    playerName: "Areeone",
    role: "MEMBER",
    lolAccounts: [
      { gameName: "Areeone", tagLine: "Areeo" }
    ],
    cs2: {
      faceitNickname: "Alfred3000",
      premierRating: "BRAK"
    }
  },
  {
    playerName: "Drożdzu",
    role: "MEMBER",
    lolAccounts: [
      { gameName: "ZwyklyCWK", tagLine: "EUNE" }
    ],
    cs2: {
      faceitNickname: "TurboTaco123",
      premierRating: "BRAK"
    }
  },
    {
    playerName: "Smoky",
    role: "MEMBER",
    lolAccounts: [
      { gameName: "VanitasLighto", tagLine: "UwU" }
    ],
    cs2: {
      faceitNickname: "-",
      premierRating: "BRAK"
    }
  },
      {
    playerName: "Samoreq",
    role: "MEMBER",
    lolAccounts: [
      { gameName: "Samoreq", tagLine: "EUNE" }
    ],
    cs2: {
      faceitNickname: "-",
      premierRating: "BRAK"
    }
  },
        {
    playerName: "Jarzi",
    role: "MEMBER",
    lolAccounts: [
      { gameName: "-", tagLine: "-" }
    ],
    cs2: {
      faceitNickname: "jarzers",
      premierRating: "BRAK"
    }
  },
         {
    playerName: "MCK",
    role: "MEMBER",
    lolAccounts: [
      { gameName: "MCKFigura", tagLine: "EUNE" }
    ],
    cs2: {
      faceitNickname: "MCKFigura",
      premierRating: "BRAK"
    }
  },
           {
    playerName: "Gregor",
    role: "MEMBER",
    lolAccounts: [
      { gameName: "-", tagLine: "-" }
    ],
    cs2: {
      faceitNickname: "cebul4czek",
      premierRating: "BRAK"
    }
  },
             {
    playerName: "Zywan",
    role: "MEMBER",
    lolAccounts: [
      { gameName: "-", tagLine: "-" }
    ],
    cs2: {
      faceitNickname: "Zywan",
      premierRating: "BRAK"
    }
  },
];

async function fetchLoLAccountData(account) {
  if (!RIOT_API_KEY) return null;
  try {

    const accRes = await fetch(`https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${account.gameName}/${account.tagLine}?api_key=${RIOT_API_KEY}`);
    if (!accRes.ok) return null;
    const accData = await accRes.json();

    const leagueRes = await fetch(`https://eun1.api.riotgames.com/lol/league/v4/entries/by-puuid/${accData.puuid}?api_key=${RIOT_API_KEY}`);
    if (!leagueRes.ok) return null;
    const leagueData = await leagueRes.json();

    const soloQueue = leagueData.find(e => e.queueType === 'RANKED_SOLO_5x5');

    if (!soloQueue) {
      return {
        name: `${account.gameName}#${account.tagLine}`,
        currentElo: "Unranked",
        winrate: 0,
        games: 0
      };
    }

    const wins = soloQueue.wins || 0;
    const losses = soloQueue.losses || 0;
    const totalGames = wins + losses;
    const winrate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

    return {
      name: `${account.gameName}#${account.tagLine}`,
      currentElo: `${soloQueue.tier} ${soloQueue.rank} (${soloQueue.leaguePoints} LP)`,
      winrate: winrate,
      games: totalGames
    };
  } catch (err) {
    console.error(`Błąd podczas pobierania LoL dla ${account.gameName}:`, err.message);
    return null;
  }
}

async function fetchFaceitData(nickname) {
  if (!FACEIT_API_KEY || !nickname) return null;
  try {
    const headers = { Authorization: `Bearer ${FACEIT_API_KEY}` };
    

    const playerRes = await fetch(`https://open.faceit.com/data/v4/players?nickname=${nickname}`, { headers });
    if (!playerRes.ok) return null;
    const playerData = await playerRes.json();

    const statsRes = await fetch(`https://open.faceit.com/data/v4/players/${playerData.player_id}/stats/cs2`, { headers });
    const statsData = statsRes.ok ? await statsRes.json() : null;

    return {
      level: `Level ${playerData.games?.cs2?.skill_level || 'N/A'}`,
      elo: playerData.games?.cs2?.faceit_elo || 0,
      kd: statsData?.lifetime?.['Average K/D Ratio'] || 'N/A',
      winrate: statsData?.lifetime?.['Win Rate %'] || '0'
    };
  } catch (err) {
    console.error(`Błąd FACEIT dla ${nickname}:`, err.message);
    return null;
  }
}

async function main() {
  console.log("Rozpoczynanie pobierania danych z API...");
  const outputData = {
    updatedAt: new Date().toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" }),
    lolTeam: [],
    cs2Team: []
  };

  for (const player of PLAYERS_CONFIG) {

    const lolAccountsData = [];
    for (const acc of player.lolAccounts) {
      const data = await fetchLoLAccountData(acc);
      if (data) lolAccountsData.push(data);
    }

    outputData.lolTeam.push({
      playerName: player.playerName,
      role: player.role,
      accounts: lolAccountsData.length > 0 ? lolAccountsData : [
        { name: `${player.lolAccounts[0].gameName}#${player.lolAccounts[0].tagLine}`, currentElo: "Brak danych z API", winrate: 0, games: 0 }
      ]
    });


    const faceitData = await fetchFaceitData(player.cs2.faceitNickname);
    outputData.cs2Team.push({
      playerName: player.playerName,
      role: player.role,
      premier: { rating: player.cs2.premierRating },
      faceit: faceitData || { level: "N/A", elo: 0, kd: "N/A", winrate: 0 }
    });
  }

  fs.writeFileSync('stats.json', JSON.stringify(outputData, null, 2));
  console.log("Pomyślnie zaktualizowano plik stats.json!");
}

main();
