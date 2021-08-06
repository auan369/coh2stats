import * as functions from "firebase-functions";
import { DEFAULT_FUNCTIONS_LOCATION } from "./constants";
import { getSteamPlayerSummaries } from "./libs/steam-api";
import { getPlayerStatsFromRelic } from "./libs/players/players";

const runtimeOpts: Record<string, "128MB" | any> = {
  timeoutSeconds: 120,
  memory: "128MB",
};

/**
 * Returns{
 *   relicPersonalStats: {},
 *   steamProfile: {}
 * }
 */
const getPlayerPersonalStats = functions
  .region(DEFAULT_FUNCTIONS_LOCATION)
  .runWith(runtimeOpts)
  .https.onCall(async (data, context) => {
    functions.logger.info(`Getting personal stats for ${JSON.stringify(data)}`);

    const steamID = data.steamID;

    if (!steamID) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        'The function must be called with {steamID: "4981651654"}',
      );
    }

    try {
      const PromiseRelicData = getPlayerStatsFromRelic(steamID);
      const PromiseSteamProfile = getSteamPlayerSummaries([steamID]);
      const [relicData, steamProfile] = await Promise.all([
        PromiseRelicData,
        PromiseSteamProfile,
      ]);

      return {
        relicPersonalStats: relicData,
        steamProfile: steamProfile,
      };
    } catch (e) {
      functions.logger.error(e);
      throw new functions.https.HttpsError("internal", `Error calling calling the API ${e}`);
    }
  });

export { getPlayerPersonalStats };
