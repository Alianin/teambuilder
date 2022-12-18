import { MonsterResponse } from "../client/models/MonsterResponse";
import { MonsterService } from "../client/services/MonsterService";

function cache(f: Function) {
  var NO_RESULT = {}; // unique, would use Symbol if ES2015-able
  var res = NO_RESULT;
  return function () {
    // if ES2015, name the function the same as fn
    if (res === NO_RESULT) {
      return (res = f.apply(f, arguments));
    }
    return res;
  };
}

export class MonsterCacheClient {
  cache: { [key: number]: Promise<MonsterResponse> };

  constructor() {
    this.cache = {};
  }

  public async get(monsterId: number) {
    if (monsterId === 0) {
      return undefined;
    }

    if (monsterId in this.cache) {
      return this.cache[monsterId];
    }

    const j = MonsterService.get(monsterId);
    this.cache[monsterId] = j;
    return j;
  }

  public async getMonsters(monsterIds: number[]) {
    const result = [];
    const needsQuery = [];
    for (var idx in monsterIds) {
      if (monsterIds[idx] in this.cache) {
        result.push({ idx: this.cache[monsterIds[idx]] });
        continue;
      }
      needsQuery.push({ index: idx, monsterId: monsterIds[idx] });
    }

    const j = await MonsterService.getManyById(needsQuery.map((a) => a.monsterId).join(","));
    j.monsters.forEach((m) => {
      this.cache[m.monster_id] = new Promise<MonsterResponse>((a, b) => m);
    });

    return j;
  }

  public async teamBuilderQuery(query: string) {
    const j = await MonsterService.teamBuilderQuery(query);
    [j.monster, ...j.evolutions].forEach((m) => {
      this.cache[m.monster_id] = new Promise<MonsterResponse>((a, b) => m);
    });

    return j;
  }
}

export const monsterCacheClient = new MonsterCacheClient();
