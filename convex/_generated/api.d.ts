/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as game from "../game.js";
import type * as gameLogic from "../gameLogic.js";
import type * as gameQueries from "../gameQueries.js";
import type * as heartsGame from "../heartsGame.js";
import type * as heartsGameLogic from "../heartsGameLogic.js";
import type * as heartsGameQueries from "../heartsGameQueries.js";
import type * as rooms from "../rooms.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  game: typeof game;
  gameLogic: typeof gameLogic;
  gameQueries: typeof gameQueries;
  heartsGame: typeof heartsGame;
  heartsGameLogic: typeof heartsGameLogic;
  heartsGameQueries: typeof heartsGameQueries;
  rooms: typeof rooms;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
