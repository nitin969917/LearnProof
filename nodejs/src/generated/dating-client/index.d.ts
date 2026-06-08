
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model Post
 * 
 */
export type Post = $Result.DefaultSelection<Prisma.$PostPayload>
/**
 * Model Friendship
 * 
 */
export type Friendship = $Result.DefaultSelection<Prisma.$FriendshipPayload>
/**
 * Model Message
 * 
 */
export type Message = $Result.DefaultSelection<Prisma.$MessagePayload>
/**
 * Model Comment
 * 
 */
export type Comment = $Result.DefaultSelection<Prisma.$CommentPayload>
/**
 * Model Crush
 * 
 */
export type Crush = $Result.DefaultSelection<Prisma.$CrushPayload>
/**
 * Model CloseFriendRequest
 * 
 */
export type CloseFriendRequest = $Result.DefaultSelection<Prisma.$CloseFriendRequestPayload>
/**
 * Model LanguageRoom
 * 
 */
export type LanguageRoom = $Result.DefaultSelection<Prisma.$LanguageRoomPayload>
/**
 * Model Group
 * 
 */
export type Group = $Result.DefaultSelection<Prisma.$GroupPayload>
/**
 * Model GroupMember
 * 
 */
export type GroupMember = $Result.DefaultSelection<Prisma.$GroupMemberPayload>
/**
 * Model GroupMessage
 * 
 */
export type GroupMessage = $Result.DefaultSelection<Prisma.$GroupMessagePayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.post`: Exposes CRUD operations for the **Post** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Posts
    * const posts = await prisma.post.findMany()
    * ```
    */
  get post(): Prisma.PostDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.friendship`: Exposes CRUD operations for the **Friendship** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Friendships
    * const friendships = await prisma.friendship.findMany()
    * ```
    */
  get friendship(): Prisma.FriendshipDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.message`: Exposes CRUD operations for the **Message** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Messages
    * const messages = await prisma.message.findMany()
    * ```
    */
  get message(): Prisma.MessageDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.comment`: Exposes CRUD operations for the **Comment** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Comments
    * const comments = await prisma.comment.findMany()
    * ```
    */
  get comment(): Prisma.CommentDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.crush`: Exposes CRUD operations for the **Crush** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Crushes
    * const crushes = await prisma.crush.findMany()
    * ```
    */
  get crush(): Prisma.CrushDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.closeFriendRequest`: Exposes CRUD operations for the **CloseFriendRequest** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CloseFriendRequests
    * const closeFriendRequests = await prisma.closeFriendRequest.findMany()
    * ```
    */
  get closeFriendRequest(): Prisma.CloseFriendRequestDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.languageRoom`: Exposes CRUD operations for the **LanguageRoom** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more LanguageRooms
    * const languageRooms = await prisma.languageRoom.findMany()
    * ```
    */
  get languageRoom(): Prisma.LanguageRoomDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.group`: Exposes CRUD operations for the **Group** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Groups
    * const groups = await prisma.group.findMany()
    * ```
    */
  get group(): Prisma.GroupDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.groupMember`: Exposes CRUD operations for the **GroupMember** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more GroupMembers
    * const groupMembers = await prisma.groupMember.findMany()
    * ```
    */
  get groupMember(): Prisma.GroupMemberDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.groupMessage`: Exposes CRUD operations for the **GroupMessage** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more GroupMessages
    * const groupMessages = await prisma.groupMessage.findMany()
    * ```
    */
  get groupMessage(): Prisma.GroupMessageDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.19.2
   * Query Engine version: c2990dca591cba766e3b7ef5d9e8a84796e47ab7
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    User: 'User',
    Post: 'Post',
    Friendship: 'Friendship',
    Message: 'Message',
    Comment: 'Comment',
    Crush: 'Crush',
    CloseFriendRequest: 'CloseFriendRequest',
    LanguageRoom: 'LanguageRoom',
    Group: 'Group',
    GroupMember: 'GroupMember',
    GroupMessage: 'GroupMessage'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "user" | "post" | "friendship" | "message" | "comment" | "crush" | "closeFriendRequest" | "languageRoom" | "group" | "groupMember" | "groupMessage"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      Post: {
        payload: Prisma.$PostPayload<ExtArgs>
        fields: Prisma.PostFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PostFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PostFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          findFirst: {
            args: Prisma.PostFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PostFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          findMany: {
            args: Prisma.PostFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>[]
          }
          create: {
            args: Prisma.PostCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          createMany: {
            args: Prisma.PostCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PostCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>[]
          }
          delete: {
            args: Prisma.PostDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          update: {
            args: Prisma.PostUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          deleteMany: {
            args: Prisma.PostDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PostUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PostUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>[]
          }
          upsert: {
            args: Prisma.PostUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          aggregate: {
            args: Prisma.PostAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePost>
          }
          groupBy: {
            args: Prisma.PostGroupByArgs<ExtArgs>
            result: $Utils.Optional<PostGroupByOutputType>[]
          }
          count: {
            args: Prisma.PostCountArgs<ExtArgs>
            result: $Utils.Optional<PostCountAggregateOutputType> | number
          }
        }
      }
      Friendship: {
        payload: Prisma.$FriendshipPayload<ExtArgs>
        fields: Prisma.FriendshipFieldRefs
        operations: {
          findUnique: {
            args: Prisma.FriendshipFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FriendshipPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.FriendshipFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FriendshipPayload>
          }
          findFirst: {
            args: Prisma.FriendshipFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FriendshipPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.FriendshipFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FriendshipPayload>
          }
          findMany: {
            args: Prisma.FriendshipFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FriendshipPayload>[]
          }
          create: {
            args: Prisma.FriendshipCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FriendshipPayload>
          }
          createMany: {
            args: Prisma.FriendshipCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.FriendshipCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FriendshipPayload>[]
          }
          delete: {
            args: Prisma.FriendshipDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FriendshipPayload>
          }
          update: {
            args: Prisma.FriendshipUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FriendshipPayload>
          }
          deleteMany: {
            args: Prisma.FriendshipDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.FriendshipUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.FriendshipUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FriendshipPayload>[]
          }
          upsert: {
            args: Prisma.FriendshipUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FriendshipPayload>
          }
          aggregate: {
            args: Prisma.FriendshipAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateFriendship>
          }
          groupBy: {
            args: Prisma.FriendshipGroupByArgs<ExtArgs>
            result: $Utils.Optional<FriendshipGroupByOutputType>[]
          }
          count: {
            args: Prisma.FriendshipCountArgs<ExtArgs>
            result: $Utils.Optional<FriendshipCountAggregateOutputType> | number
          }
        }
      }
      Message: {
        payload: Prisma.$MessagePayload<ExtArgs>
        fields: Prisma.MessageFieldRefs
        operations: {
          findUnique: {
            args: Prisma.MessageFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.MessageFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          findFirst: {
            args: Prisma.MessageFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.MessageFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          findMany: {
            args: Prisma.MessageFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>[]
          }
          create: {
            args: Prisma.MessageCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          createMany: {
            args: Prisma.MessageCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.MessageCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>[]
          }
          delete: {
            args: Prisma.MessageDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          update: {
            args: Prisma.MessageUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          deleteMany: {
            args: Prisma.MessageDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.MessageUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.MessageUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>[]
          }
          upsert: {
            args: Prisma.MessageUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MessagePayload>
          }
          aggregate: {
            args: Prisma.MessageAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateMessage>
          }
          groupBy: {
            args: Prisma.MessageGroupByArgs<ExtArgs>
            result: $Utils.Optional<MessageGroupByOutputType>[]
          }
          count: {
            args: Prisma.MessageCountArgs<ExtArgs>
            result: $Utils.Optional<MessageCountAggregateOutputType> | number
          }
        }
      }
      Comment: {
        payload: Prisma.$CommentPayload<ExtArgs>
        fields: Prisma.CommentFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CommentFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommentPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CommentFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommentPayload>
          }
          findFirst: {
            args: Prisma.CommentFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommentPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CommentFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommentPayload>
          }
          findMany: {
            args: Prisma.CommentFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommentPayload>[]
          }
          create: {
            args: Prisma.CommentCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommentPayload>
          }
          createMany: {
            args: Prisma.CommentCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CommentCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommentPayload>[]
          }
          delete: {
            args: Prisma.CommentDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommentPayload>
          }
          update: {
            args: Prisma.CommentUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommentPayload>
          }
          deleteMany: {
            args: Prisma.CommentDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CommentUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CommentUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommentPayload>[]
          }
          upsert: {
            args: Prisma.CommentUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommentPayload>
          }
          aggregate: {
            args: Prisma.CommentAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateComment>
          }
          groupBy: {
            args: Prisma.CommentGroupByArgs<ExtArgs>
            result: $Utils.Optional<CommentGroupByOutputType>[]
          }
          count: {
            args: Prisma.CommentCountArgs<ExtArgs>
            result: $Utils.Optional<CommentCountAggregateOutputType> | number
          }
        }
      }
      Crush: {
        payload: Prisma.$CrushPayload<ExtArgs>
        fields: Prisma.CrushFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CrushFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrushPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CrushFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrushPayload>
          }
          findFirst: {
            args: Prisma.CrushFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrushPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CrushFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrushPayload>
          }
          findMany: {
            args: Prisma.CrushFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrushPayload>[]
          }
          create: {
            args: Prisma.CrushCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrushPayload>
          }
          createMany: {
            args: Prisma.CrushCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CrushCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrushPayload>[]
          }
          delete: {
            args: Prisma.CrushDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrushPayload>
          }
          update: {
            args: Prisma.CrushUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrushPayload>
          }
          deleteMany: {
            args: Prisma.CrushDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CrushUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CrushUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrushPayload>[]
          }
          upsert: {
            args: Prisma.CrushUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrushPayload>
          }
          aggregate: {
            args: Prisma.CrushAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCrush>
          }
          groupBy: {
            args: Prisma.CrushGroupByArgs<ExtArgs>
            result: $Utils.Optional<CrushGroupByOutputType>[]
          }
          count: {
            args: Prisma.CrushCountArgs<ExtArgs>
            result: $Utils.Optional<CrushCountAggregateOutputType> | number
          }
        }
      }
      CloseFriendRequest: {
        payload: Prisma.$CloseFriendRequestPayload<ExtArgs>
        fields: Prisma.CloseFriendRequestFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CloseFriendRequestFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CloseFriendRequestPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CloseFriendRequestFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CloseFriendRequestPayload>
          }
          findFirst: {
            args: Prisma.CloseFriendRequestFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CloseFriendRequestPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CloseFriendRequestFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CloseFriendRequestPayload>
          }
          findMany: {
            args: Prisma.CloseFriendRequestFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CloseFriendRequestPayload>[]
          }
          create: {
            args: Prisma.CloseFriendRequestCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CloseFriendRequestPayload>
          }
          createMany: {
            args: Prisma.CloseFriendRequestCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CloseFriendRequestCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CloseFriendRequestPayload>[]
          }
          delete: {
            args: Prisma.CloseFriendRequestDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CloseFriendRequestPayload>
          }
          update: {
            args: Prisma.CloseFriendRequestUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CloseFriendRequestPayload>
          }
          deleteMany: {
            args: Prisma.CloseFriendRequestDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CloseFriendRequestUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CloseFriendRequestUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CloseFriendRequestPayload>[]
          }
          upsert: {
            args: Prisma.CloseFriendRequestUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CloseFriendRequestPayload>
          }
          aggregate: {
            args: Prisma.CloseFriendRequestAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCloseFriendRequest>
          }
          groupBy: {
            args: Prisma.CloseFriendRequestGroupByArgs<ExtArgs>
            result: $Utils.Optional<CloseFriendRequestGroupByOutputType>[]
          }
          count: {
            args: Prisma.CloseFriendRequestCountArgs<ExtArgs>
            result: $Utils.Optional<CloseFriendRequestCountAggregateOutputType> | number
          }
        }
      }
      LanguageRoom: {
        payload: Prisma.$LanguageRoomPayload<ExtArgs>
        fields: Prisma.LanguageRoomFieldRefs
        operations: {
          findUnique: {
            args: Prisma.LanguageRoomFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LanguageRoomPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.LanguageRoomFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LanguageRoomPayload>
          }
          findFirst: {
            args: Prisma.LanguageRoomFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LanguageRoomPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.LanguageRoomFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LanguageRoomPayload>
          }
          findMany: {
            args: Prisma.LanguageRoomFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LanguageRoomPayload>[]
          }
          create: {
            args: Prisma.LanguageRoomCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LanguageRoomPayload>
          }
          createMany: {
            args: Prisma.LanguageRoomCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.LanguageRoomCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LanguageRoomPayload>[]
          }
          delete: {
            args: Prisma.LanguageRoomDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LanguageRoomPayload>
          }
          update: {
            args: Prisma.LanguageRoomUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LanguageRoomPayload>
          }
          deleteMany: {
            args: Prisma.LanguageRoomDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.LanguageRoomUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.LanguageRoomUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LanguageRoomPayload>[]
          }
          upsert: {
            args: Prisma.LanguageRoomUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LanguageRoomPayload>
          }
          aggregate: {
            args: Prisma.LanguageRoomAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLanguageRoom>
          }
          groupBy: {
            args: Prisma.LanguageRoomGroupByArgs<ExtArgs>
            result: $Utils.Optional<LanguageRoomGroupByOutputType>[]
          }
          count: {
            args: Prisma.LanguageRoomCountArgs<ExtArgs>
            result: $Utils.Optional<LanguageRoomCountAggregateOutputType> | number
          }
        }
      }
      Group: {
        payload: Prisma.$GroupPayload<ExtArgs>
        fields: Prisma.GroupFieldRefs
        operations: {
          findUnique: {
            args: Prisma.GroupFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.GroupFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupPayload>
          }
          findFirst: {
            args: Prisma.GroupFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.GroupFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupPayload>
          }
          findMany: {
            args: Prisma.GroupFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupPayload>[]
          }
          create: {
            args: Prisma.GroupCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupPayload>
          }
          createMany: {
            args: Prisma.GroupCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.GroupCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupPayload>[]
          }
          delete: {
            args: Prisma.GroupDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupPayload>
          }
          update: {
            args: Prisma.GroupUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupPayload>
          }
          deleteMany: {
            args: Prisma.GroupDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.GroupUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.GroupUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupPayload>[]
          }
          upsert: {
            args: Prisma.GroupUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupPayload>
          }
          aggregate: {
            args: Prisma.GroupAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateGroup>
          }
          groupBy: {
            args: Prisma.GroupGroupByArgs<ExtArgs>
            result: $Utils.Optional<GroupGroupByOutputType>[]
          }
          count: {
            args: Prisma.GroupCountArgs<ExtArgs>
            result: $Utils.Optional<GroupCountAggregateOutputType> | number
          }
        }
      }
      GroupMember: {
        payload: Prisma.$GroupMemberPayload<ExtArgs>
        fields: Prisma.GroupMemberFieldRefs
        operations: {
          findUnique: {
            args: Prisma.GroupMemberFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupMemberPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.GroupMemberFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupMemberPayload>
          }
          findFirst: {
            args: Prisma.GroupMemberFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupMemberPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.GroupMemberFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupMemberPayload>
          }
          findMany: {
            args: Prisma.GroupMemberFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupMemberPayload>[]
          }
          create: {
            args: Prisma.GroupMemberCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupMemberPayload>
          }
          createMany: {
            args: Prisma.GroupMemberCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.GroupMemberCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupMemberPayload>[]
          }
          delete: {
            args: Prisma.GroupMemberDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupMemberPayload>
          }
          update: {
            args: Prisma.GroupMemberUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupMemberPayload>
          }
          deleteMany: {
            args: Prisma.GroupMemberDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.GroupMemberUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.GroupMemberUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupMemberPayload>[]
          }
          upsert: {
            args: Prisma.GroupMemberUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupMemberPayload>
          }
          aggregate: {
            args: Prisma.GroupMemberAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateGroupMember>
          }
          groupBy: {
            args: Prisma.GroupMemberGroupByArgs<ExtArgs>
            result: $Utils.Optional<GroupMemberGroupByOutputType>[]
          }
          count: {
            args: Prisma.GroupMemberCountArgs<ExtArgs>
            result: $Utils.Optional<GroupMemberCountAggregateOutputType> | number
          }
        }
      }
      GroupMessage: {
        payload: Prisma.$GroupMessagePayload<ExtArgs>
        fields: Prisma.GroupMessageFieldRefs
        operations: {
          findUnique: {
            args: Prisma.GroupMessageFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupMessagePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.GroupMessageFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupMessagePayload>
          }
          findFirst: {
            args: Prisma.GroupMessageFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupMessagePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.GroupMessageFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupMessagePayload>
          }
          findMany: {
            args: Prisma.GroupMessageFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupMessagePayload>[]
          }
          create: {
            args: Prisma.GroupMessageCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupMessagePayload>
          }
          createMany: {
            args: Prisma.GroupMessageCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.GroupMessageCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupMessagePayload>[]
          }
          delete: {
            args: Prisma.GroupMessageDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupMessagePayload>
          }
          update: {
            args: Prisma.GroupMessageUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupMessagePayload>
          }
          deleteMany: {
            args: Prisma.GroupMessageDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.GroupMessageUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.GroupMessageUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupMessagePayload>[]
          }
          upsert: {
            args: Prisma.GroupMessageUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GroupMessagePayload>
          }
          aggregate: {
            args: Prisma.GroupMessageAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateGroupMessage>
          }
          groupBy: {
            args: Prisma.GroupMessageGroupByArgs<ExtArgs>
            result: $Utils.Optional<GroupMessageGroupByOutputType>[]
          }
          count: {
            args: Prisma.GroupMessageCountArgs<ExtArgs>
            result: $Utils.Optional<GroupMessageCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    user?: UserOmit
    post?: PostOmit
    friendship?: FriendshipOmit
    message?: MessageOmit
    comment?: CommentOmit
    crush?: CrushOmit
    closeFriendRequest?: CloseFriendRequestOmit
    languageRoom?: LanguageRoomOmit
    group?: GroupOmit
    groupMember?: GroupMemberOmit
    groupMessage?: GroupMessageOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    posts: number
    comments: number
    likedPosts: number
    sentFriendRequests: number
    receivedFriendRequests: number
    sentMessages: number
    receivedMessages: number
    myCrushes: number
    crushedBy: number
    sentCloseFriendRequests: number
    receivedCloseFriendRequests: number
    languageRooms: number
    createdGroups: number
    groupMembers: number
    groupMessages: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    posts?: boolean | UserCountOutputTypeCountPostsArgs
    comments?: boolean | UserCountOutputTypeCountCommentsArgs
    likedPosts?: boolean | UserCountOutputTypeCountLikedPostsArgs
    sentFriendRequests?: boolean | UserCountOutputTypeCountSentFriendRequestsArgs
    receivedFriendRequests?: boolean | UserCountOutputTypeCountReceivedFriendRequestsArgs
    sentMessages?: boolean | UserCountOutputTypeCountSentMessagesArgs
    receivedMessages?: boolean | UserCountOutputTypeCountReceivedMessagesArgs
    myCrushes?: boolean | UserCountOutputTypeCountMyCrushesArgs
    crushedBy?: boolean | UserCountOutputTypeCountCrushedByArgs
    sentCloseFriendRequests?: boolean | UserCountOutputTypeCountSentCloseFriendRequestsArgs
    receivedCloseFriendRequests?: boolean | UserCountOutputTypeCountReceivedCloseFriendRequestsArgs
    languageRooms?: boolean | UserCountOutputTypeCountLanguageRoomsArgs
    createdGroups?: boolean | UserCountOutputTypeCountCreatedGroupsArgs
    groupMembers?: boolean | UserCountOutputTypeCountGroupMembersArgs
    groupMessages?: boolean | UserCountOutputTypeCountGroupMessagesArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountPostsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PostWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountCommentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CommentWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountLikedPostsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PostWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountSentFriendRequestsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FriendshipWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountReceivedFriendRequestsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FriendshipWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountSentMessagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MessageWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountReceivedMessagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MessageWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountMyCrushesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CrushWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountCrushedByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CrushWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountSentCloseFriendRequestsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CloseFriendRequestWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountReceivedCloseFriendRequestsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CloseFriendRequestWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountLanguageRoomsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LanguageRoomWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountCreatedGroupsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: GroupWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountGroupMembersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: GroupMemberWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountGroupMessagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: GroupMessageWhereInput
  }


  /**
   * Count Type PostCountOutputType
   */

  export type PostCountOutputType = {
    likes: number
    comments: number
  }

  export type PostCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    likes?: boolean | PostCountOutputTypeCountLikesArgs
    comments?: boolean | PostCountOutputTypeCountCommentsArgs
  }

  // Custom InputTypes
  /**
   * PostCountOutputType without action
   */
  export type PostCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PostCountOutputType
     */
    select?: PostCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * PostCountOutputType without action
   */
  export type PostCountOutputTypeCountLikesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
  }

  /**
   * PostCountOutputType without action
   */
  export type PostCountOutputTypeCountCommentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CommentWhereInput
  }


  /**
   * Count Type GroupCountOutputType
   */

  export type GroupCountOutputType = {
    members: number
    messages: number
  }

  export type GroupCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    members?: boolean | GroupCountOutputTypeCountMembersArgs
    messages?: boolean | GroupCountOutputTypeCountMessagesArgs
  }

  // Custom InputTypes
  /**
   * GroupCountOutputType without action
   */
  export type GroupCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GroupCountOutputType
     */
    select?: GroupCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * GroupCountOutputType without action
   */
  export type GroupCountOutputTypeCountMembersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: GroupMemberWhereInput
  }

  /**
   * GroupCountOutputType without action
   */
  export type GroupCountOutputTypeCountMessagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: GroupMessageWhereInput
  }


  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserAvgAggregateOutputType = {
    id: number | null
  }

  export type UserSumAggregateOutputType = {
    id: number | null
  }

  export type UserMinAggregateOutputType = {
    id: number | null
    name: string | null
    email: string | null
    password: string | null
    googleId: string | null
    bio: string | null
    profilePicture: string | null
    collegeName: string | null
    department: string | null
    yearOfStudy: string | null
    phoneNumber: string | null
    phoneVisibility: string | null
    whatsappNumber: string | null
    whatsappVisibility: string | null
    instagramHandle: string | null
    instagramVisibility: string | null
    facebookUrl: string | null
    facebookVisibility: string | null
    snapchatUsername: string | null
    snapchatVisibility: string | null
    linkedinUrl: string | null
    linkedinVisibility: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserMaxAggregateOutputType = {
    id: number | null
    name: string | null
    email: string | null
    password: string | null
    googleId: string | null
    bio: string | null
    profilePicture: string | null
    collegeName: string | null
    department: string | null
    yearOfStudy: string | null
    phoneNumber: string | null
    phoneVisibility: string | null
    whatsappNumber: string | null
    whatsappVisibility: string | null
    instagramHandle: string | null
    instagramVisibility: string | null
    facebookUrl: string | null
    facebookVisibility: string | null
    snapchatUsername: string | null
    snapchatVisibility: string | null
    linkedinUrl: string | null
    linkedinVisibility: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    name: number
    email: number
    password: number
    googleId: number
    bio: number
    profilePicture: number
    collegeName: number
    department: number
    yearOfStudy: number
    phoneNumber: number
    phoneVisibility: number
    whatsappNumber: number
    whatsappVisibility: number
    instagramHandle: number
    instagramVisibility: number
    facebookUrl: number
    facebookVisibility: number
    snapchatUsername: number
    snapchatVisibility: number
    linkedinUrl: number
    linkedinVisibility: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type UserAvgAggregateInputType = {
    id?: true
  }

  export type UserSumAggregateInputType = {
    id?: true
  }

  export type UserMinAggregateInputType = {
    id?: true
    name?: true
    email?: true
    password?: true
    googleId?: true
    bio?: true
    profilePicture?: true
    collegeName?: true
    department?: true
    yearOfStudy?: true
    phoneNumber?: true
    phoneVisibility?: true
    whatsappNumber?: true
    whatsappVisibility?: true
    instagramHandle?: true
    instagramVisibility?: true
    facebookUrl?: true
    facebookVisibility?: true
    snapchatUsername?: true
    snapchatVisibility?: true
    linkedinUrl?: true
    linkedinVisibility?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    name?: true
    email?: true
    password?: true
    googleId?: true
    bio?: true
    profilePicture?: true
    collegeName?: true
    department?: true
    yearOfStudy?: true
    phoneNumber?: true
    phoneVisibility?: true
    whatsappNumber?: true
    whatsappVisibility?: true
    instagramHandle?: true
    instagramVisibility?: true
    facebookUrl?: true
    facebookVisibility?: true
    snapchatUsername?: true
    snapchatVisibility?: true
    linkedinUrl?: true
    linkedinVisibility?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    name?: true
    email?: true
    password?: true
    googleId?: true
    bio?: true
    profilePicture?: true
    collegeName?: true
    department?: true
    yearOfStudy?: true
    phoneNumber?: true
    phoneVisibility?: true
    whatsappNumber?: true
    whatsappVisibility?: true
    instagramHandle?: true
    instagramVisibility?: true
    facebookUrl?: true
    facebookVisibility?: true
    snapchatUsername?: true
    snapchatVisibility?: true
    linkedinUrl?: true
    linkedinVisibility?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: UserAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: UserSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _avg?: UserAvgAggregateInputType
    _sum?: UserSumAggregateInputType
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: number
    name: string
    email: string
    password: string | null
    googleId: string | null
    bio: string | null
    profilePicture: string | null
    collegeName: string | null
    department: string | null
    yearOfStudy: string | null
    phoneNumber: string | null
    phoneVisibility: string
    whatsappNumber: string | null
    whatsappVisibility: string
    instagramHandle: string | null
    instagramVisibility: string
    facebookUrl: string | null
    facebookVisibility: string
    snapchatUsername: string | null
    snapchatVisibility: string
    linkedinUrl: string | null
    linkedinVisibility: string
    createdAt: Date
    updatedAt: Date
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    email?: boolean
    password?: boolean
    googleId?: boolean
    bio?: boolean
    profilePicture?: boolean
    collegeName?: boolean
    department?: boolean
    yearOfStudy?: boolean
    phoneNumber?: boolean
    phoneVisibility?: boolean
    whatsappNumber?: boolean
    whatsappVisibility?: boolean
    instagramHandle?: boolean
    instagramVisibility?: boolean
    facebookUrl?: boolean
    facebookVisibility?: boolean
    snapchatUsername?: boolean
    snapchatVisibility?: boolean
    linkedinUrl?: boolean
    linkedinVisibility?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    posts?: boolean | User$postsArgs<ExtArgs>
    comments?: boolean | User$commentsArgs<ExtArgs>
    likedPosts?: boolean | User$likedPostsArgs<ExtArgs>
    sentFriendRequests?: boolean | User$sentFriendRequestsArgs<ExtArgs>
    receivedFriendRequests?: boolean | User$receivedFriendRequestsArgs<ExtArgs>
    sentMessages?: boolean | User$sentMessagesArgs<ExtArgs>
    receivedMessages?: boolean | User$receivedMessagesArgs<ExtArgs>
    myCrushes?: boolean | User$myCrushesArgs<ExtArgs>
    crushedBy?: boolean | User$crushedByArgs<ExtArgs>
    sentCloseFriendRequests?: boolean | User$sentCloseFriendRequestsArgs<ExtArgs>
    receivedCloseFriendRequests?: boolean | User$receivedCloseFriendRequestsArgs<ExtArgs>
    languageRooms?: boolean | User$languageRoomsArgs<ExtArgs>
    createdGroups?: boolean | User$createdGroupsArgs<ExtArgs>
    groupMembers?: boolean | User$groupMembersArgs<ExtArgs>
    groupMessages?: boolean | User$groupMessagesArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    email?: boolean
    password?: boolean
    googleId?: boolean
    bio?: boolean
    profilePicture?: boolean
    collegeName?: boolean
    department?: boolean
    yearOfStudy?: boolean
    phoneNumber?: boolean
    phoneVisibility?: boolean
    whatsappNumber?: boolean
    whatsappVisibility?: boolean
    instagramHandle?: boolean
    instagramVisibility?: boolean
    facebookUrl?: boolean
    facebookVisibility?: boolean
    snapchatUsername?: boolean
    snapchatVisibility?: boolean
    linkedinUrl?: boolean
    linkedinVisibility?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    email?: boolean
    password?: boolean
    googleId?: boolean
    bio?: boolean
    profilePicture?: boolean
    collegeName?: boolean
    department?: boolean
    yearOfStudy?: boolean
    phoneNumber?: boolean
    phoneVisibility?: boolean
    whatsappNumber?: boolean
    whatsappVisibility?: boolean
    instagramHandle?: boolean
    instagramVisibility?: boolean
    facebookUrl?: boolean
    facebookVisibility?: boolean
    snapchatUsername?: boolean
    snapchatVisibility?: boolean
    linkedinUrl?: boolean
    linkedinVisibility?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    name?: boolean
    email?: boolean
    password?: boolean
    googleId?: boolean
    bio?: boolean
    profilePicture?: boolean
    collegeName?: boolean
    department?: boolean
    yearOfStudy?: boolean
    phoneNumber?: boolean
    phoneVisibility?: boolean
    whatsappNumber?: boolean
    whatsappVisibility?: boolean
    instagramHandle?: boolean
    instagramVisibility?: boolean
    facebookUrl?: boolean
    facebookVisibility?: boolean
    snapchatUsername?: boolean
    snapchatVisibility?: boolean
    linkedinUrl?: boolean
    linkedinVisibility?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "email" | "password" | "googleId" | "bio" | "profilePicture" | "collegeName" | "department" | "yearOfStudy" | "phoneNumber" | "phoneVisibility" | "whatsappNumber" | "whatsappVisibility" | "instagramHandle" | "instagramVisibility" | "facebookUrl" | "facebookVisibility" | "snapchatUsername" | "snapchatVisibility" | "linkedinUrl" | "linkedinVisibility" | "createdAt" | "updatedAt", ExtArgs["result"]["user"]>
  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    posts?: boolean | User$postsArgs<ExtArgs>
    comments?: boolean | User$commentsArgs<ExtArgs>
    likedPosts?: boolean | User$likedPostsArgs<ExtArgs>
    sentFriendRequests?: boolean | User$sentFriendRequestsArgs<ExtArgs>
    receivedFriendRequests?: boolean | User$receivedFriendRequestsArgs<ExtArgs>
    sentMessages?: boolean | User$sentMessagesArgs<ExtArgs>
    receivedMessages?: boolean | User$receivedMessagesArgs<ExtArgs>
    myCrushes?: boolean | User$myCrushesArgs<ExtArgs>
    crushedBy?: boolean | User$crushedByArgs<ExtArgs>
    sentCloseFriendRequests?: boolean | User$sentCloseFriendRequestsArgs<ExtArgs>
    receivedCloseFriendRequests?: boolean | User$receivedCloseFriendRequestsArgs<ExtArgs>
    languageRooms?: boolean | User$languageRoomsArgs<ExtArgs>
    createdGroups?: boolean | User$createdGroupsArgs<ExtArgs>
    groupMembers?: boolean | User$groupMembersArgs<ExtArgs>
    groupMessages?: boolean | User$groupMessagesArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type UserIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      posts: Prisma.$PostPayload<ExtArgs>[]
      comments: Prisma.$CommentPayload<ExtArgs>[]
      likedPosts: Prisma.$PostPayload<ExtArgs>[]
      sentFriendRequests: Prisma.$FriendshipPayload<ExtArgs>[]
      receivedFriendRequests: Prisma.$FriendshipPayload<ExtArgs>[]
      sentMessages: Prisma.$MessagePayload<ExtArgs>[]
      receivedMessages: Prisma.$MessagePayload<ExtArgs>[]
      myCrushes: Prisma.$CrushPayload<ExtArgs>[]
      crushedBy: Prisma.$CrushPayload<ExtArgs>[]
      sentCloseFriendRequests: Prisma.$CloseFriendRequestPayload<ExtArgs>[]
      receivedCloseFriendRequests: Prisma.$CloseFriendRequestPayload<ExtArgs>[]
      languageRooms: Prisma.$LanguageRoomPayload<ExtArgs>[]
      createdGroups: Prisma.$GroupPayload<ExtArgs>[]
      groupMembers: Prisma.$GroupMemberPayload<ExtArgs>[]
      groupMessages: Prisma.$GroupMessagePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      name: string
      email: string
      password: string | null
      googleId: string | null
      bio: string | null
      profilePicture: string | null
      collegeName: string | null
      department: string | null
      yearOfStudy: string | null
      phoneNumber: string | null
      phoneVisibility: string
      whatsappNumber: string | null
      whatsappVisibility: string
      instagramHandle: string | null
      instagramVisibility: string
      facebookUrl: string | null
      facebookVisibility: string
      snapchatUsername: string | null
      snapchatVisibility: string
      linkedinUrl: string | null
      linkedinVisibility: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users and returns the data updated in the database.
     * @param {UserUpdateManyAndReturnArgs} args - Arguments to update many Users.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Users and only return the `id`
     * const userWithIdOnly = await prisma.user.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UserUpdateManyAndReturnArgs>(args: SelectSubset<T, UserUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    posts<T extends User$postsArgs<ExtArgs> = {}>(args?: Subset<T, User$postsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    comments<T extends User$commentsArgs<ExtArgs> = {}>(args?: Subset<T, User$commentsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    likedPosts<T extends User$likedPostsArgs<ExtArgs> = {}>(args?: Subset<T, User$likedPostsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    sentFriendRequests<T extends User$sentFriendRequestsArgs<ExtArgs> = {}>(args?: Subset<T, User$sentFriendRequestsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FriendshipPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    receivedFriendRequests<T extends User$receivedFriendRequestsArgs<ExtArgs> = {}>(args?: Subset<T, User$receivedFriendRequestsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FriendshipPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    sentMessages<T extends User$sentMessagesArgs<ExtArgs> = {}>(args?: Subset<T, User$sentMessagesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    receivedMessages<T extends User$receivedMessagesArgs<ExtArgs> = {}>(args?: Subset<T, User$receivedMessagesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    myCrushes<T extends User$myCrushesArgs<ExtArgs> = {}>(args?: Subset<T, User$myCrushesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CrushPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    crushedBy<T extends User$crushedByArgs<ExtArgs> = {}>(args?: Subset<T, User$crushedByArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CrushPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    sentCloseFriendRequests<T extends User$sentCloseFriendRequestsArgs<ExtArgs> = {}>(args?: Subset<T, User$sentCloseFriendRequestsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CloseFriendRequestPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    receivedCloseFriendRequests<T extends User$receivedCloseFriendRequestsArgs<ExtArgs> = {}>(args?: Subset<T, User$receivedCloseFriendRequestsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CloseFriendRequestPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    languageRooms<T extends User$languageRoomsArgs<ExtArgs> = {}>(args?: Subset<T, User$languageRoomsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LanguageRoomPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    createdGroups<T extends User$createdGroupsArgs<ExtArgs> = {}>(args?: Subset<T, User$createdGroupsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GroupPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    groupMembers<T extends User$groupMembersArgs<ExtArgs> = {}>(args?: Subset<T, User$groupMembersArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GroupMemberPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    groupMessages<T extends User$groupMessagesArgs<ExtArgs> = {}>(args?: Subset<T, User$groupMessagesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GroupMessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'Int'>
    readonly name: FieldRef<"User", 'String'>
    readonly email: FieldRef<"User", 'String'>
    readonly password: FieldRef<"User", 'String'>
    readonly googleId: FieldRef<"User", 'String'>
    readonly bio: FieldRef<"User", 'String'>
    readonly profilePicture: FieldRef<"User", 'String'>
    readonly collegeName: FieldRef<"User", 'String'>
    readonly department: FieldRef<"User", 'String'>
    readonly yearOfStudy: FieldRef<"User", 'String'>
    readonly phoneNumber: FieldRef<"User", 'String'>
    readonly phoneVisibility: FieldRef<"User", 'String'>
    readonly whatsappNumber: FieldRef<"User", 'String'>
    readonly whatsappVisibility: FieldRef<"User", 'String'>
    readonly instagramHandle: FieldRef<"User", 'String'>
    readonly instagramVisibility: FieldRef<"User", 'String'>
    readonly facebookUrl: FieldRef<"User", 'String'>
    readonly facebookVisibility: FieldRef<"User", 'String'>
    readonly snapchatUsername: FieldRef<"User", 'String'>
    readonly snapchatVisibility: FieldRef<"User", 'String'>
    readonly linkedinUrl: FieldRef<"User", 'String'>
    readonly linkedinVisibility: FieldRef<"User", 'String'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
    readonly updatedAt: FieldRef<"User", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User updateManyAndReturn
   */
  export type UserUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to delete.
     */
    limit?: number
  }

  /**
   * User.posts
   */
  export type User$postsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    where?: PostWhereInput
    orderBy?: PostOrderByWithRelationInput | PostOrderByWithRelationInput[]
    cursor?: PostWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PostScalarFieldEnum | PostScalarFieldEnum[]
  }

  /**
   * User.comments
   */
  export type User$commentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentInclude<ExtArgs> | null
    where?: CommentWhereInput
    orderBy?: CommentOrderByWithRelationInput | CommentOrderByWithRelationInput[]
    cursor?: CommentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CommentScalarFieldEnum | CommentScalarFieldEnum[]
  }

  /**
   * User.likedPosts
   */
  export type User$likedPostsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    where?: PostWhereInput
    orderBy?: PostOrderByWithRelationInput | PostOrderByWithRelationInput[]
    cursor?: PostWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PostScalarFieldEnum | PostScalarFieldEnum[]
  }

  /**
   * User.sentFriendRequests
   */
  export type User$sentFriendRequestsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Friendship
     */
    select?: FriendshipSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Friendship
     */
    omit?: FriendshipOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FriendshipInclude<ExtArgs> | null
    where?: FriendshipWhereInput
    orderBy?: FriendshipOrderByWithRelationInput | FriendshipOrderByWithRelationInput[]
    cursor?: FriendshipWhereUniqueInput
    take?: number
    skip?: number
    distinct?: FriendshipScalarFieldEnum | FriendshipScalarFieldEnum[]
  }

  /**
   * User.receivedFriendRequests
   */
  export type User$receivedFriendRequestsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Friendship
     */
    select?: FriendshipSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Friendship
     */
    omit?: FriendshipOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FriendshipInclude<ExtArgs> | null
    where?: FriendshipWhereInput
    orderBy?: FriendshipOrderByWithRelationInput | FriendshipOrderByWithRelationInput[]
    cursor?: FriendshipWhereUniqueInput
    take?: number
    skip?: number
    distinct?: FriendshipScalarFieldEnum | FriendshipScalarFieldEnum[]
  }

  /**
   * User.sentMessages
   */
  export type User$sentMessagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    where?: MessageWhereInput
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    cursor?: MessageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
  }

  /**
   * User.receivedMessages
   */
  export type User$receivedMessagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    where?: MessageWhereInput
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    cursor?: MessageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
  }

  /**
   * User.myCrushes
   */
  export type User$myCrushesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Crush
     */
    select?: CrushSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Crush
     */
    omit?: CrushOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrushInclude<ExtArgs> | null
    where?: CrushWhereInput
    orderBy?: CrushOrderByWithRelationInput | CrushOrderByWithRelationInput[]
    cursor?: CrushWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CrushScalarFieldEnum | CrushScalarFieldEnum[]
  }

  /**
   * User.crushedBy
   */
  export type User$crushedByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Crush
     */
    select?: CrushSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Crush
     */
    omit?: CrushOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrushInclude<ExtArgs> | null
    where?: CrushWhereInput
    orderBy?: CrushOrderByWithRelationInput | CrushOrderByWithRelationInput[]
    cursor?: CrushWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CrushScalarFieldEnum | CrushScalarFieldEnum[]
  }

  /**
   * User.sentCloseFriendRequests
   */
  export type User$sentCloseFriendRequestsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CloseFriendRequest
     */
    select?: CloseFriendRequestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CloseFriendRequest
     */
    omit?: CloseFriendRequestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CloseFriendRequestInclude<ExtArgs> | null
    where?: CloseFriendRequestWhereInput
    orderBy?: CloseFriendRequestOrderByWithRelationInput | CloseFriendRequestOrderByWithRelationInput[]
    cursor?: CloseFriendRequestWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CloseFriendRequestScalarFieldEnum | CloseFriendRequestScalarFieldEnum[]
  }

  /**
   * User.receivedCloseFriendRequests
   */
  export type User$receivedCloseFriendRequestsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CloseFriendRequest
     */
    select?: CloseFriendRequestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CloseFriendRequest
     */
    omit?: CloseFriendRequestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CloseFriendRequestInclude<ExtArgs> | null
    where?: CloseFriendRequestWhereInput
    orderBy?: CloseFriendRequestOrderByWithRelationInput | CloseFriendRequestOrderByWithRelationInput[]
    cursor?: CloseFriendRequestWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CloseFriendRequestScalarFieldEnum | CloseFriendRequestScalarFieldEnum[]
  }

  /**
   * User.languageRooms
   */
  export type User$languageRoomsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LanguageRoom
     */
    select?: LanguageRoomSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LanguageRoom
     */
    omit?: LanguageRoomOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LanguageRoomInclude<ExtArgs> | null
    where?: LanguageRoomWhereInput
    orderBy?: LanguageRoomOrderByWithRelationInput | LanguageRoomOrderByWithRelationInput[]
    cursor?: LanguageRoomWhereUniqueInput
    take?: number
    skip?: number
    distinct?: LanguageRoomScalarFieldEnum | LanguageRoomScalarFieldEnum[]
  }

  /**
   * User.createdGroups
   */
  export type User$createdGroupsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Group
     */
    select?: GroupSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Group
     */
    omit?: GroupOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupInclude<ExtArgs> | null
    where?: GroupWhereInput
    orderBy?: GroupOrderByWithRelationInput | GroupOrderByWithRelationInput[]
    cursor?: GroupWhereUniqueInput
    take?: number
    skip?: number
    distinct?: GroupScalarFieldEnum | GroupScalarFieldEnum[]
  }

  /**
   * User.groupMembers
   */
  export type User$groupMembersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GroupMember
     */
    select?: GroupMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GroupMember
     */
    omit?: GroupMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupMemberInclude<ExtArgs> | null
    where?: GroupMemberWhereInput
    orderBy?: GroupMemberOrderByWithRelationInput | GroupMemberOrderByWithRelationInput[]
    cursor?: GroupMemberWhereUniqueInput
    take?: number
    skip?: number
    distinct?: GroupMemberScalarFieldEnum | GroupMemberScalarFieldEnum[]
  }

  /**
   * User.groupMessages
   */
  export type User$groupMessagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GroupMessage
     */
    select?: GroupMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GroupMessage
     */
    omit?: GroupMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupMessageInclude<ExtArgs> | null
    where?: GroupMessageWhereInput
    orderBy?: GroupMessageOrderByWithRelationInput | GroupMessageOrderByWithRelationInput[]
    cursor?: GroupMessageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: GroupMessageScalarFieldEnum | GroupMessageScalarFieldEnum[]
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model Post
   */

  export type AggregatePost = {
    _count: PostCountAggregateOutputType | null
    _avg: PostAvgAggregateOutputType | null
    _sum: PostSumAggregateOutputType | null
    _min: PostMinAggregateOutputType | null
    _max: PostMaxAggregateOutputType | null
  }

  export type PostAvgAggregateOutputType = {
    id: number | null
    authorId: number | null
  }

  export type PostSumAggregateOutputType = {
    id: number | null
    authorId: number | null
  }

  export type PostMinAggregateOutputType = {
    id: number | null
    content: string | null
    image: string | null
    visibility: string | null
    createdAt: Date | null
    updatedAt: Date | null
    authorId: number | null
  }

  export type PostMaxAggregateOutputType = {
    id: number | null
    content: string | null
    image: string | null
    visibility: string | null
    createdAt: Date | null
    updatedAt: Date | null
    authorId: number | null
  }

  export type PostCountAggregateOutputType = {
    id: number
    content: number
    image: number
    visibility: number
    createdAt: number
    updatedAt: number
    authorId: number
    _all: number
  }


  export type PostAvgAggregateInputType = {
    id?: true
    authorId?: true
  }

  export type PostSumAggregateInputType = {
    id?: true
    authorId?: true
  }

  export type PostMinAggregateInputType = {
    id?: true
    content?: true
    image?: true
    visibility?: true
    createdAt?: true
    updatedAt?: true
    authorId?: true
  }

  export type PostMaxAggregateInputType = {
    id?: true
    content?: true
    image?: true
    visibility?: true
    createdAt?: true
    updatedAt?: true
    authorId?: true
  }

  export type PostCountAggregateInputType = {
    id?: true
    content?: true
    image?: true
    visibility?: true
    createdAt?: true
    updatedAt?: true
    authorId?: true
    _all?: true
  }

  export type PostAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Post to aggregate.
     */
    where?: PostWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Posts to fetch.
     */
    orderBy?: PostOrderByWithRelationInput | PostOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PostWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Posts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Posts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Posts
    **/
    _count?: true | PostCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PostAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PostSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PostMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PostMaxAggregateInputType
  }

  export type GetPostAggregateType<T extends PostAggregateArgs> = {
        [P in keyof T & keyof AggregatePost]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePost[P]>
      : GetScalarType<T[P], AggregatePost[P]>
  }




  export type PostGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PostWhereInput
    orderBy?: PostOrderByWithAggregationInput | PostOrderByWithAggregationInput[]
    by: PostScalarFieldEnum[] | PostScalarFieldEnum
    having?: PostScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PostCountAggregateInputType | true
    _avg?: PostAvgAggregateInputType
    _sum?: PostSumAggregateInputType
    _min?: PostMinAggregateInputType
    _max?: PostMaxAggregateInputType
  }

  export type PostGroupByOutputType = {
    id: number
    content: string
    image: string | null
    visibility: string
    createdAt: Date
    updatedAt: Date
    authorId: number
    _count: PostCountAggregateOutputType | null
    _avg: PostAvgAggregateOutputType | null
    _sum: PostSumAggregateOutputType | null
    _min: PostMinAggregateOutputType | null
    _max: PostMaxAggregateOutputType | null
  }

  type GetPostGroupByPayload<T extends PostGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PostGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PostGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PostGroupByOutputType[P]>
            : GetScalarType<T[P], PostGroupByOutputType[P]>
        }
      >
    >


  export type PostSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    content?: boolean
    image?: boolean
    visibility?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    authorId?: boolean
    author?: boolean | UserDefaultArgs<ExtArgs>
    likes?: boolean | Post$likesArgs<ExtArgs>
    comments?: boolean | Post$commentsArgs<ExtArgs>
    _count?: boolean | PostCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["post"]>

  export type PostSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    content?: boolean
    image?: boolean
    visibility?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    authorId?: boolean
    author?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["post"]>

  export type PostSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    content?: boolean
    image?: boolean
    visibility?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    authorId?: boolean
    author?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["post"]>

  export type PostSelectScalar = {
    id?: boolean
    content?: boolean
    image?: boolean
    visibility?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    authorId?: boolean
  }

  export type PostOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "content" | "image" | "visibility" | "createdAt" | "updatedAt" | "authorId", ExtArgs["result"]["post"]>
  export type PostInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    author?: boolean | UserDefaultArgs<ExtArgs>
    likes?: boolean | Post$likesArgs<ExtArgs>
    comments?: boolean | Post$commentsArgs<ExtArgs>
    _count?: boolean | PostCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type PostIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    author?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type PostIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    author?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $PostPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Post"
    objects: {
      author: Prisma.$UserPayload<ExtArgs>
      likes: Prisma.$UserPayload<ExtArgs>[]
      comments: Prisma.$CommentPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      content: string
      image: string | null
      visibility: string
      createdAt: Date
      updatedAt: Date
      authorId: number
    }, ExtArgs["result"]["post"]>
    composites: {}
  }

  type PostGetPayload<S extends boolean | null | undefined | PostDefaultArgs> = $Result.GetResult<Prisma.$PostPayload, S>

  type PostCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PostFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PostCountAggregateInputType | true
    }

  export interface PostDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Post'], meta: { name: 'Post' } }
    /**
     * Find zero or one Post that matches the filter.
     * @param {PostFindUniqueArgs} args - Arguments to find a Post
     * @example
     * // Get one Post
     * const post = await prisma.post.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PostFindUniqueArgs>(args: SelectSubset<T, PostFindUniqueArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Post that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PostFindUniqueOrThrowArgs} args - Arguments to find a Post
     * @example
     * // Get one Post
     * const post = await prisma.post.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PostFindUniqueOrThrowArgs>(args: SelectSubset<T, PostFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Post that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostFindFirstArgs} args - Arguments to find a Post
     * @example
     * // Get one Post
     * const post = await prisma.post.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PostFindFirstArgs>(args?: SelectSubset<T, PostFindFirstArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Post that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostFindFirstOrThrowArgs} args - Arguments to find a Post
     * @example
     * // Get one Post
     * const post = await prisma.post.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PostFindFirstOrThrowArgs>(args?: SelectSubset<T, PostFindFirstOrThrowArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Posts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Posts
     * const posts = await prisma.post.findMany()
     * 
     * // Get first 10 Posts
     * const posts = await prisma.post.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const postWithIdOnly = await prisma.post.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PostFindManyArgs>(args?: SelectSubset<T, PostFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Post.
     * @param {PostCreateArgs} args - Arguments to create a Post.
     * @example
     * // Create one Post
     * const Post = await prisma.post.create({
     *   data: {
     *     // ... data to create a Post
     *   }
     * })
     * 
     */
    create<T extends PostCreateArgs>(args: SelectSubset<T, PostCreateArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Posts.
     * @param {PostCreateManyArgs} args - Arguments to create many Posts.
     * @example
     * // Create many Posts
     * const post = await prisma.post.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PostCreateManyArgs>(args?: SelectSubset<T, PostCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Posts and returns the data saved in the database.
     * @param {PostCreateManyAndReturnArgs} args - Arguments to create many Posts.
     * @example
     * // Create many Posts
     * const post = await prisma.post.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Posts and only return the `id`
     * const postWithIdOnly = await prisma.post.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PostCreateManyAndReturnArgs>(args?: SelectSubset<T, PostCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Post.
     * @param {PostDeleteArgs} args - Arguments to delete one Post.
     * @example
     * // Delete one Post
     * const Post = await prisma.post.delete({
     *   where: {
     *     // ... filter to delete one Post
     *   }
     * })
     * 
     */
    delete<T extends PostDeleteArgs>(args: SelectSubset<T, PostDeleteArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Post.
     * @param {PostUpdateArgs} args - Arguments to update one Post.
     * @example
     * // Update one Post
     * const post = await prisma.post.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PostUpdateArgs>(args: SelectSubset<T, PostUpdateArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Posts.
     * @param {PostDeleteManyArgs} args - Arguments to filter Posts to delete.
     * @example
     * // Delete a few Posts
     * const { count } = await prisma.post.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PostDeleteManyArgs>(args?: SelectSubset<T, PostDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Posts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Posts
     * const post = await prisma.post.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PostUpdateManyArgs>(args: SelectSubset<T, PostUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Posts and returns the data updated in the database.
     * @param {PostUpdateManyAndReturnArgs} args - Arguments to update many Posts.
     * @example
     * // Update many Posts
     * const post = await prisma.post.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Posts and only return the `id`
     * const postWithIdOnly = await prisma.post.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PostUpdateManyAndReturnArgs>(args: SelectSubset<T, PostUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Post.
     * @param {PostUpsertArgs} args - Arguments to update or create a Post.
     * @example
     * // Update or create a Post
     * const post = await prisma.post.upsert({
     *   create: {
     *     // ... data to create a Post
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Post we want to update
     *   }
     * })
     */
    upsert<T extends PostUpsertArgs>(args: SelectSubset<T, PostUpsertArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Posts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostCountArgs} args - Arguments to filter Posts to count.
     * @example
     * // Count the number of Posts
     * const count = await prisma.post.count({
     *   where: {
     *     // ... the filter for the Posts we want to count
     *   }
     * })
    **/
    count<T extends PostCountArgs>(
      args?: Subset<T, PostCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PostCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Post.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PostAggregateArgs>(args: Subset<T, PostAggregateArgs>): Prisma.PrismaPromise<GetPostAggregateType<T>>

    /**
     * Group by Post.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PostGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PostGroupByArgs['orderBy'] }
        : { orderBy?: PostGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PostGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPostGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Post model
   */
  readonly fields: PostFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Post.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PostClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    author<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    likes<T extends Post$likesArgs<ExtArgs> = {}>(args?: Subset<T, Post$likesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    comments<T extends Post$commentsArgs<ExtArgs> = {}>(args?: Subset<T, Post$commentsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Post model
   */
  interface PostFieldRefs {
    readonly id: FieldRef<"Post", 'Int'>
    readonly content: FieldRef<"Post", 'String'>
    readonly image: FieldRef<"Post", 'String'>
    readonly visibility: FieldRef<"Post", 'String'>
    readonly createdAt: FieldRef<"Post", 'DateTime'>
    readonly updatedAt: FieldRef<"Post", 'DateTime'>
    readonly authorId: FieldRef<"Post", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * Post findUnique
   */
  export type PostFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * Filter, which Post to fetch.
     */
    where: PostWhereUniqueInput
  }

  /**
   * Post findUniqueOrThrow
   */
  export type PostFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * Filter, which Post to fetch.
     */
    where: PostWhereUniqueInput
  }

  /**
   * Post findFirst
   */
  export type PostFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * Filter, which Post to fetch.
     */
    where?: PostWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Posts to fetch.
     */
    orderBy?: PostOrderByWithRelationInput | PostOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Posts.
     */
    cursor?: PostWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Posts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Posts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Posts.
     */
    distinct?: PostScalarFieldEnum | PostScalarFieldEnum[]
  }

  /**
   * Post findFirstOrThrow
   */
  export type PostFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * Filter, which Post to fetch.
     */
    where?: PostWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Posts to fetch.
     */
    orderBy?: PostOrderByWithRelationInput | PostOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Posts.
     */
    cursor?: PostWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Posts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Posts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Posts.
     */
    distinct?: PostScalarFieldEnum | PostScalarFieldEnum[]
  }

  /**
   * Post findMany
   */
  export type PostFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * Filter, which Posts to fetch.
     */
    where?: PostWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Posts to fetch.
     */
    orderBy?: PostOrderByWithRelationInput | PostOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Posts.
     */
    cursor?: PostWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Posts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Posts.
     */
    skip?: number
    distinct?: PostScalarFieldEnum | PostScalarFieldEnum[]
  }

  /**
   * Post create
   */
  export type PostCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * The data needed to create a Post.
     */
    data: XOR<PostCreateInput, PostUncheckedCreateInput>
  }

  /**
   * Post createMany
   */
  export type PostCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Posts.
     */
    data: PostCreateManyInput | PostCreateManyInput[]
  }

  /**
   * Post createManyAndReturn
   */
  export type PostCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * The data used to create many Posts.
     */
    data: PostCreateManyInput | PostCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Post update
   */
  export type PostUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * The data needed to update a Post.
     */
    data: XOR<PostUpdateInput, PostUncheckedUpdateInput>
    /**
     * Choose, which Post to update.
     */
    where: PostWhereUniqueInput
  }

  /**
   * Post updateMany
   */
  export type PostUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Posts.
     */
    data: XOR<PostUpdateManyMutationInput, PostUncheckedUpdateManyInput>
    /**
     * Filter which Posts to update
     */
    where?: PostWhereInput
    /**
     * Limit how many Posts to update.
     */
    limit?: number
  }

  /**
   * Post updateManyAndReturn
   */
  export type PostUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * The data used to update Posts.
     */
    data: XOR<PostUpdateManyMutationInput, PostUncheckedUpdateManyInput>
    /**
     * Filter which Posts to update
     */
    where?: PostWhereInput
    /**
     * Limit how many Posts to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Post upsert
   */
  export type PostUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * The filter to search for the Post to update in case it exists.
     */
    where: PostWhereUniqueInput
    /**
     * In case the Post found by the `where` argument doesn't exist, create a new Post with this data.
     */
    create: XOR<PostCreateInput, PostUncheckedCreateInput>
    /**
     * In case the Post was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PostUpdateInput, PostUncheckedUpdateInput>
  }

  /**
   * Post delete
   */
  export type PostDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
    /**
     * Filter which Post to delete.
     */
    where: PostWhereUniqueInput
  }

  /**
   * Post deleteMany
   */
  export type PostDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Posts to delete
     */
    where?: PostWhereInput
    /**
     * Limit how many Posts to delete.
     */
    limit?: number
  }

  /**
   * Post.likes
   */
  export type Post$likesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    where?: UserWhereInput
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    cursor?: UserWhereUniqueInput
    take?: number
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * Post.comments
   */
  export type Post$commentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentInclude<ExtArgs> | null
    where?: CommentWhereInput
    orderBy?: CommentOrderByWithRelationInput | CommentOrderByWithRelationInput[]
    cursor?: CommentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CommentScalarFieldEnum | CommentScalarFieldEnum[]
  }

  /**
   * Post without action
   */
  export type PostDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PostInclude<ExtArgs> | null
  }


  /**
   * Model Friendship
   */

  export type AggregateFriendship = {
    _count: FriendshipCountAggregateOutputType | null
    _avg: FriendshipAvgAggregateOutputType | null
    _sum: FriendshipSumAggregateOutputType | null
    _min: FriendshipMinAggregateOutputType | null
    _max: FriendshipMaxAggregateOutputType | null
  }

  export type FriendshipAvgAggregateOutputType = {
    id: number | null
    senderId: number | null
    receiverId: number | null
  }

  export type FriendshipSumAggregateOutputType = {
    id: number | null
    senderId: number | null
    receiverId: number | null
  }

  export type FriendshipMinAggregateOutputType = {
    id: number | null
    status: string | null
    isCloseFriend: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
    senderId: number | null
    receiverId: number | null
  }

  export type FriendshipMaxAggregateOutputType = {
    id: number | null
    status: string | null
    isCloseFriend: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
    senderId: number | null
    receiverId: number | null
  }

  export type FriendshipCountAggregateOutputType = {
    id: number
    status: number
    isCloseFriend: number
    createdAt: number
    updatedAt: number
    senderId: number
    receiverId: number
    _all: number
  }


  export type FriendshipAvgAggregateInputType = {
    id?: true
    senderId?: true
    receiverId?: true
  }

  export type FriendshipSumAggregateInputType = {
    id?: true
    senderId?: true
    receiverId?: true
  }

  export type FriendshipMinAggregateInputType = {
    id?: true
    status?: true
    isCloseFriend?: true
    createdAt?: true
    updatedAt?: true
    senderId?: true
    receiverId?: true
  }

  export type FriendshipMaxAggregateInputType = {
    id?: true
    status?: true
    isCloseFriend?: true
    createdAt?: true
    updatedAt?: true
    senderId?: true
    receiverId?: true
  }

  export type FriendshipCountAggregateInputType = {
    id?: true
    status?: true
    isCloseFriend?: true
    createdAt?: true
    updatedAt?: true
    senderId?: true
    receiverId?: true
    _all?: true
  }

  export type FriendshipAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Friendship to aggregate.
     */
    where?: FriendshipWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Friendships to fetch.
     */
    orderBy?: FriendshipOrderByWithRelationInput | FriendshipOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: FriendshipWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Friendships from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Friendships.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Friendships
    **/
    _count?: true | FriendshipCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: FriendshipAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: FriendshipSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: FriendshipMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: FriendshipMaxAggregateInputType
  }

  export type GetFriendshipAggregateType<T extends FriendshipAggregateArgs> = {
        [P in keyof T & keyof AggregateFriendship]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateFriendship[P]>
      : GetScalarType<T[P], AggregateFriendship[P]>
  }




  export type FriendshipGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FriendshipWhereInput
    orderBy?: FriendshipOrderByWithAggregationInput | FriendshipOrderByWithAggregationInput[]
    by: FriendshipScalarFieldEnum[] | FriendshipScalarFieldEnum
    having?: FriendshipScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: FriendshipCountAggregateInputType | true
    _avg?: FriendshipAvgAggregateInputType
    _sum?: FriendshipSumAggregateInputType
    _min?: FriendshipMinAggregateInputType
    _max?: FriendshipMaxAggregateInputType
  }

  export type FriendshipGroupByOutputType = {
    id: number
    status: string
    isCloseFriend: boolean
    createdAt: Date
    updatedAt: Date
    senderId: number
    receiverId: number
    _count: FriendshipCountAggregateOutputType | null
    _avg: FriendshipAvgAggregateOutputType | null
    _sum: FriendshipSumAggregateOutputType | null
    _min: FriendshipMinAggregateOutputType | null
    _max: FriendshipMaxAggregateOutputType | null
  }

  type GetFriendshipGroupByPayload<T extends FriendshipGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<FriendshipGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof FriendshipGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], FriendshipGroupByOutputType[P]>
            : GetScalarType<T[P], FriendshipGroupByOutputType[P]>
        }
      >
    >


  export type FriendshipSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    status?: boolean
    isCloseFriend?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    senderId?: boolean
    receiverId?: boolean
    sender?: boolean | UserDefaultArgs<ExtArgs>
    receiver?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["friendship"]>

  export type FriendshipSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    status?: boolean
    isCloseFriend?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    senderId?: boolean
    receiverId?: boolean
    sender?: boolean | UserDefaultArgs<ExtArgs>
    receiver?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["friendship"]>

  export type FriendshipSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    status?: boolean
    isCloseFriend?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    senderId?: boolean
    receiverId?: boolean
    sender?: boolean | UserDefaultArgs<ExtArgs>
    receiver?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["friendship"]>

  export type FriendshipSelectScalar = {
    id?: boolean
    status?: boolean
    isCloseFriend?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    senderId?: boolean
    receiverId?: boolean
  }

  export type FriendshipOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "status" | "isCloseFriend" | "createdAt" | "updatedAt" | "senderId" | "receiverId", ExtArgs["result"]["friendship"]>
  export type FriendshipInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sender?: boolean | UserDefaultArgs<ExtArgs>
    receiver?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type FriendshipIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sender?: boolean | UserDefaultArgs<ExtArgs>
    receiver?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type FriendshipIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sender?: boolean | UserDefaultArgs<ExtArgs>
    receiver?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $FriendshipPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Friendship"
    objects: {
      sender: Prisma.$UserPayload<ExtArgs>
      receiver: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      status: string
      isCloseFriend: boolean
      createdAt: Date
      updatedAt: Date
      senderId: number
      receiverId: number
    }, ExtArgs["result"]["friendship"]>
    composites: {}
  }

  type FriendshipGetPayload<S extends boolean | null | undefined | FriendshipDefaultArgs> = $Result.GetResult<Prisma.$FriendshipPayload, S>

  type FriendshipCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<FriendshipFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: FriendshipCountAggregateInputType | true
    }

  export interface FriendshipDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Friendship'], meta: { name: 'Friendship' } }
    /**
     * Find zero or one Friendship that matches the filter.
     * @param {FriendshipFindUniqueArgs} args - Arguments to find a Friendship
     * @example
     * // Get one Friendship
     * const friendship = await prisma.friendship.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends FriendshipFindUniqueArgs>(args: SelectSubset<T, FriendshipFindUniqueArgs<ExtArgs>>): Prisma__FriendshipClient<$Result.GetResult<Prisma.$FriendshipPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Friendship that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {FriendshipFindUniqueOrThrowArgs} args - Arguments to find a Friendship
     * @example
     * // Get one Friendship
     * const friendship = await prisma.friendship.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends FriendshipFindUniqueOrThrowArgs>(args: SelectSubset<T, FriendshipFindUniqueOrThrowArgs<ExtArgs>>): Prisma__FriendshipClient<$Result.GetResult<Prisma.$FriendshipPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Friendship that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FriendshipFindFirstArgs} args - Arguments to find a Friendship
     * @example
     * // Get one Friendship
     * const friendship = await prisma.friendship.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends FriendshipFindFirstArgs>(args?: SelectSubset<T, FriendshipFindFirstArgs<ExtArgs>>): Prisma__FriendshipClient<$Result.GetResult<Prisma.$FriendshipPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Friendship that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FriendshipFindFirstOrThrowArgs} args - Arguments to find a Friendship
     * @example
     * // Get one Friendship
     * const friendship = await prisma.friendship.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends FriendshipFindFirstOrThrowArgs>(args?: SelectSubset<T, FriendshipFindFirstOrThrowArgs<ExtArgs>>): Prisma__FriendshipClient<$Result.GetResult<Prisma.$FriendshipPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Friendships that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FriendshipFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Friendships
     * const friendships = await prisma.friendship.findMany()
     * 
     * // Get first 10 Friendships
     * const friendships = await prisma.friendship.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const friendshipWithIdOnly = await prisma.friendship.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends FriendshipFindManyArgs>(args?: SelectSubset<T, FriendshipFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FriendshipPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Friendship.
     * @param {FriendshipCreateArgs} args - Arguments to create a Friendship.
     * @example
     * // Create one Friendship
     * const Friendship = await prisma.friendship.create({
     *   data: {
     *     // ... data to create a Friendship
     *   }
     * })
     * 
     */
    create<T extends FriendshipCreateArgs>(args: SelectSubset<T, FriendshipCreateArgs<ExtArgs>>): Prisma__FriendshipClient<$Result.GetResult<Prisma.$FriendshipPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Friendships.
     * @param {FriendshipCreateManyArgs} args - Arguments to create many Friendships.
     * @example
     * // Create many Friendships
     * const friendship = await prisma.friendship.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends FriendshipCreateManyArgs>(args?: SelectSubset<T, FriendshipCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Friendships and returns the data saved in the database.
     * @param {FriendshipCreateManyAndReturnArgs} args - Arguments to create many Friendships.
     * @example
     * // Create many Friendships
     * const friendship = await prisma.friendship.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Friendships and only return the `id`
     * const friendshipWithIdOnly = await prisma.friendship.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends FriendshipCreateManyAndReturnArgs>(args?: SelectSubset<T, FriendshipCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FriendshipPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Friendship.
     * @param {FriendshipDeleteArgs} args - Arguments to delete one Friendship.
     * @example
     * // Delete one Friendship
     * const Friendship = await prisma.friendship.delete({
     *   where: {
     *     // ... filter to delete one Friendship
     *   }
     * })
     * 
     */
    delete<T extends FriendshipDeleteArgs>(args: SelectSubset<T, FriendshipDeleteArgs<ExtArgs>>): Prisma__FriendshipClient<$Result.GetResult<Prisma.$FriendshipPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Friendship.
     * @param {FriendshipUpdateArgs} args - Arguments to update one Friendship.
     * @example
     * // Update one Friendship
     * const friendship = await prisma.friendship.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends FriendshipUpdateArgs>(args: SelectSubset<T, FriendshipUpdateArgs<ExtArgs>>): Prisma__FriendshipClient<$Result.GetResult<Prisma.$FriendshipPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Friendships.
     * @param {FriendshipDeleteManyArgs} args - Arguments to filter Friendships to delete.
     * @example
     * // Delete a few Friendships
     * const { count } = await prisma.friendship.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends FriendshipDeleteManyArgs>(args?: SelectSubset<T, FriendshipDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Friendships.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FriendshipUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Friendships
     * const friendship = await prisma.friendship.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends FriendshipUpdateManyArgs>(args: SelectSubset<T, FriendshipUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Friendships and returns the data updated in the database.
     * @param {FriendshipUpdateManyAndReturnArgs} args - Arguments to update many Friendships.
     * @example
     * // Update many Friendships
     * const friendship = await prisma.friendship.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Friendships and only return the `id`
     * const friendshipWithIdOnly = await prisma.friendship.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends FriendshipUpdateManyAndReturnArgs>(args: SelectSubset<T, FriendshipUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FriendshipPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Friendship.
     * @param {FriendshipUpsertArgs} args - Arguments to update or create a Friendship.
     * @example
     * // Update or create a Friendship
     * const friendship = await prisma.friendship.upsert({
     *   create: {
     *     // ... data to create a Friendship
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Friendship we want to update
     *   }
     * })
     */
    upsert<T extends FriendshipUpsertArgs>(args: SelectSubset<T, FriendshipUpsertArgs<ExtArgs>>): Prisma__FriendshipClient<$Result.GetResult<Prisma.$FriendshipPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Friendships.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FriendshipCountArgs} args - Arguments to filter Friendships to count.
     * @example
     * // Count the number of Friendships
     * const count = await prisma.friendship.count({
     *   where: {
     *     // ... the filter for the Friendships we want to count
     *   }
     * })
    **/
    count<T extends FriendshipCountArgs>(
      args?: Subset<T, FriendshipCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], FriendshipCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Friendship.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FriendshipAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends FriendshipAggregateArgs>(args: Subset<T, FriendshipAggregateArgs>): Prisma.PrismaPromise<GetFriendshipAggregateType<T>>

    /**
     * Group by Friendship.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FriendshipGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends FriendshipGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: FriendshipGroupByArgs['orderBy'] }
        : { orderBy?: FriendshipGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, FriendshipGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetFriendshipGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Friendship model
   */
  readonly fields: FriendshipFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Friendship.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__FriendshipClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    sender<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    receiver<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Friendship model
   */
  interface FriendshipFieldRefs {
    readonly id: FieldRef<"Friendship", 'Int'>
    readonly status: FieldRef<"Friendship", 'String'>
    readonly isCloseFriend: FieldRef<"Friendship", 'Boolean'>
    readonly createdAt: FieldRef<"Friendship", 'DateTime'>
    readonly updatedAt: FieldRef<"Friendship", 'DateTime'>
    readonly senderId: FieldRef<"Friendship", 'Int'>
    readonly receiverId: FieldRef<"Friendship", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * Friendship findUnique
   */
  export type FriendshipFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Friendship
     */
    select?: FriendshipSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Friendship
     */
    omit?: FriendshipOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FriendshipInclude<ExtArgs> | null
    /**
     * Filter, which Friendship to fetch.
     */
    where: FriendshipWhereUniqueInput
  }

  /**
   * Friendship findUniqueOrThrow
   */
  export type FriendshipFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Friendship
     */
    select?: FriendshipSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Friendship
     */
    omit?: FriendshipOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FriendshipInclude<ExtArgs> | null
    /**
     * Filter, which Friendship to fetch.
     */
    where: FriendshipWhereUniqueInput
  }

  /**
   * Friendship findFirst
   */
  export type FriendshipFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Friendship
     */
    select?: FriendshipSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Friendship
     */
    omit?: FriendshipOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FriendshipInclude<ExtArgs> | null
    /**
     * Filter, which Friendship to fetch.
     */
    where?: FriendshipWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Friendships to fetch.
     */
    orderBy?: FriendshipOrderByWithRelationInput | FriendshipOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Friendships.
     */
    cursor?: FriendshipWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Friendships from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Friendships.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Friendships.
     */
    distinct?: FriendshipScalarFieldEnum | FriendshipScalarFieldEnum[]
  }

  /**
   * Friendship findFirstOrThrow
   */
  export type FriendshipFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Friendship
     */
    select?: FriendshipSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Friendship
     */
    omit?: FriendshipOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FriendshipInclude<ExtArgs> | null
    /**
     * Filter, which Friendship to fetch.
     */
    where?: FriendshipWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Friendships to fetch.
     */
    orderBy?: FriendshipOrderByWithRelationInput | FriendshipOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Friendships.
     */
    cursor?: FriendshipWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Friendships from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Friendships.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Friendships.
     */
    distinct?: FriendshipScalarFieldEnum | FriendshipScalarFieldEnum[]
  }

  /**
   * Friendship findMany
   */
  export type FriendshipFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Friendship
     */
    select?: FriendshipSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Friendship
     */
    omit?: FriendshipOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FriendshipInclude<ExtArgs> | null
    /**
     * Filter, which Friendships to fetch.
     */
    where?: FriendshipWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Friendships to fetch.
     */
    orderBy?: FriendshipOrderByWithRelationInput | FriendshipOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Friendships.
     */
    cursor?: FriendshipWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Friendships from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Friendships.
     */
    skip?: number
    distinct?: FriendshipScalarFieldEnum | FriendshipScalarFieldEnum[]
  }

  /**
   * Friendship create
   */
  export type FriendshipCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Friendship
     */
    select?: FriendshipSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Friendship
     */
    omit?: FriendshipOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FriendshipInclude<ExtArgs> | null
    /**
     * The data needed to create a Friendship.
     */
    data: XOR<FriendshipCreateInput, FriendshipUncheckedCreateInput>
  }

  /**
   * Friendship createMany
   */
  export type FriendshipCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Friendships.
     */
    data: FriendshipCreateManyInput | FriendshipCreateManyInput[]
  }

  /**
   * Friendship createManyAndReturn
   */
  export type FriendshipCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Friendship
     */
    select?: FriendshipSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Friendship
     */
    omit?: FriendshipOmit<ExtArgs> | null
    /**
     * The data used to create many Friendships.
     */
    data: FriendshipCreateManyInput | FriendshipCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FriendshipIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Friendship update
   */
  export type FriendshipUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Friendship
     */
    select?: FriendshipSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Friendship
     */
    omit?: FriendshipOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FriendshipInclude<ExtArgs> | null
    /**
     * The data needed to update a Friendship.
     */
    data: XOR<FriendshipUpdateInput, FriendshipUncheckedUpdateInput>
    /**
     * Choose, which Friendship to update.
     */
    where: FriendshipWhereUniqueInput
  }

  /**
   * Friendship updateMany
   */
  export type FriendshipUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Friendships.
     */
    data: XOR<FriendshipUpdateManyMutationInput, FriendshipUncheckedUpdateManyInput>
    /**
     * Filter which Friendships to update
     */
    where?: FriendshipWhereInput
    /**
     * Limit how many Friendships to update.
     */
    limit?: number
  }

  /**
   * Friendship updateManyAndReturn
   */
  export type FriendshipUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Friendship
     */
    select?: FriendshipSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Friendship
     */
    omit?: FriendshipOmit<ExtArgs> | null
    /**
     * The data used to update Friendships.
     */
    data: XOR<FriendshipUpdateManyMutationInput, FriendshipUncheckedUpdateManyInput>
    /**
     * Filter which Friendships to update
     */
    where?: FriendshipWhereInput
    /**
     * Limit how many Friendships to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FriendshipIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Friendship upsert
   */
  export type FriendshipUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Friendship
     */
    select?: FriendshipSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Friendship
     */
    omit?: FriendshipOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FriendshipInclude<ExtArgs> | null
    /**
     * The filter to search for the Friendship to update in case it exists.
     */
    where: FriendshipWhereUniqueInput
    /**
     * In case the Friendship found by the `where` argument doesn't exist, create a new Friendship with this data.
     */
    create: XOR<FriendshipCreateInput, FriendshipUncheckedCreateInput>
    /**
     * In case the Friendship was found with the provided `where` argument, update it with this data.
     */
    update: XOR<FriendshipUpdateInput, FriendshipUncheckedUpdateInput>
  }

  /**
   * Friendship delete
   */
  export type FriendshipDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Friendship
     */
    select?: FriendshipSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Friendship
     */
    omit?: FriendshipOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FriendshipInclude<ExtArgs> | null
    /**
     * Filter which Friendship to delete.
     */
    where: FriendshipWhereUniqueInput
  }

  /**
   * Friendship deleteMany
   */
  export type FriendshipDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Friendships to delete
     */
    where?: FriendshipWhereInput
    /**
     * Limit how many Friendships to delete.
     */
    limit?: number
  }

  /**
   * Friendship without action
   */
  export type FriendshipDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Friendship
     */
    select?: FriendshipSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Friendship
     */
    omit?: FriendshipOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FriendshipInclude<ExtArgs> | null
  }


  /**
   * Model Message
   */

  export type AggregateMessage = {
    _count: MessageCountAggregateOutputType | null
    _avg: MessageAvgAggregateOutputType | null
    _sum: MessageSumAggregateOutputType | null
    _min: MessageMinAggregateOutputType | null
    _max: MessageMaxAggregateOutputType | null
  }

  export type MessageAvgAggregateOutputType = {
    id: number | null
    senderId: number | null
    receiverId: number | null
  }

  export type MessageSumAggregateOutputType = {
    id: number | null
    senderId: number | null
    receiverId: number | null
  }

  export type MessageMinAggregateOutputType = {
    id: number | null
    content: string | null
    isRead: boolean | null
    createdAt: Date | null
    senderId: number | null
    receiverId: number | null
  }

  export type MessageMaxAggregateOutputType = {
    id: number | null
    content: string | null
    isRead: boolean | null
    createdAt: Date | null
    senderId: number | null
    receiverId: number | null
  }

  export type MessageCountAggregateOutputType = {
    id: number
    content: number
    isRead: number
    createdAt: number
    senderId: number
    receiverId: number
    _all: number
  }


  export type MessageAvgAggregateInputType = {
    id?: true
    senderId?: true
    receiverId?: true
  }

  export type MessageSumAggregateInputType = {
    id?: true
    senderId?: true
    receiverId?: true
  }

  export type MessageMinAggregateInputType = {
    id?: true
    content?: true
    isRead?: true
    createdAt?: true
    senderId?: true
    receiverId?: true
  }

  export type MessageMaxAggregateInputType = {
    id?: true
    content?: true
    isRead?: true
    createdAt?: true
    senderId?: true
    receiverId?: true
  }

  export type MessageCountAggregateInputType = {
    id?: true
    content?: true
    isRead?: true
    createdAt?: true
    senderId?: true
    receiverId?: true
    _all?: true
  }

  export type MessageAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Message to aggregate.
     */
    where?: MessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Messages to fetch.
     */
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: MessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Messages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Messages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Messages
    **/
    _count?: true | MessageCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: MessageAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: MessageSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: MessageMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: MessageMaxAggregateInputType
  }

  export type GetMessageAggregateType<T extends MessageAggregateArgs> = {
        [P in keyof T & keyof AggregateMessage]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateMessage[P]>
      : GetScalarType<T[P], AggregateMessage[P]>
  }




  export type MessageGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MessageWhereInput
    orderBy?: MessageOrderByWithAggregationInput | MessageOrderByWithAggregationInput[]
    by: MessageScalarFieldEnum[] | MessageScalarFieldEnum
    having?: MessageScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: MessageCountAggregateInputType | true
    _avg?: MessageAvgAggregateInputType
    _sum?: MessageSumAggregateInputType
    _min?: MessageMinAggregateInputType
    _max?: MessageMaxAggregateInputType
  }

  export type MessageGroupByOutputType = {
    id: number
    content: string
    isRead: boolean
    createdAt: Date
    senderId: number
    receiverId: number
    _count: MessageCountAggregateOutputType | null
    _avg: MessageAvgAggregateOutputType | null
    _sum: MessageSumAggregateOutputType | null
    _min: MessageMinAggregateOutputType | null
    _max: MessageMaxAggregateOutputType | null
  }

  type GetMessageGroupByPayload<T extends MessageGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<MessageGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof MessageGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], MessageGroupByOutputType[P]>
            : GetScalarType<T[P], MessageGroupByOutputType[P]>
        }
      >
    >


  export type MessageSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    content?: boolean
    isRead?: boolean
    createdAt?: boolean
    senderId?: boolean
    receiverId?: boolean
    sender?: boolean | UserDefaultArgs<ExtArgs>
    receiver?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["message"]>

  export type MessageSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    content?: boolean
    isRead?: boolean
    createdAt?: boolean
    senderId?: boolean
    receiverId?: boolean
    sender?: boolean | UserDefaultArgs<ExtArgs>
    receiver?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["message"]>

  export type MessageSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    content?: boolean
    isRead?: boolean
    createdAt?: boolean
    senderId?: boolean
    receiverId?: boolean
    sender?: boolean | UserDefaultArgs<ExtArgs>
    receiver?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["message"]>

  export type MessageSelectScalar = {
    id?: boolean
    content?: boolean
    isRead?: boolean
    createdAt?: boolean
    senderId?: boolean
    receiverId?: boolean
  }

  export type MessageOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "content" | "isRead" | "createdAt" | "senderId" | "receiverId", ExtArgs["result"]["message"]>
  export type MessageInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sender?: boolean | UserDefaultArgs<ExtArgs>
    receiver?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type MessageIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sender?: boolean | UserDefaultArgs<ExtArgs>
    receiver?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type MessageIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sender?: boolean | UserDefaultArgs<ExtArgs>
    receiver?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $MessagePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Message"
    objects: {
      sender: Prisma.$UserPayload<ExtArgs>
      receiver: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      content: string
      isRead: boolean
      createdAt: Date
      senderId: number
      receiverId: number
    }, ExtArgs["result"]["message"]>
    composites: {}
  }

  type MessageGetPayload<S extends boolean | null | undefined | MessageDefaultArgs> = $Result.GetResult<Prisma.$MessagePayload, S>

  type MessageCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<MessageFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: MessageCountAggregateInputType | true
    }

  export interface MessageDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Message'], meta: { name: 'Message' } }
    /**
     * Find zero or one Message that matches the filter.
     * @param {MessageFindUniqueArgs} args - Arguments to find a Message
     * @example
     * // Get one Message
     * const message = await prisma.message.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MessageFindUniqueArgs>(args: SelectSubset<T, MessageFindUniqueArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Message that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {MessageFindUniqueOrThrowArgs} args - Arguments to find a Message
     * @example
     * // Get one Message
     * const message = await prisma.message.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MessageFindUniqueOrThrowArgs>(args: SelectSubset<T, MessageFindUniqueOrThrowArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Message that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageFindFirstArgs} args - Arguments to find a Message
     * @example
     * // Get one Message
     * const message = await prisma.message.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MessageFindFirstArgs>(args?: SelectSubset<T, MessageFindFirstArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Message that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageFindFirstOrThrowArgs} args - Arguments to find a Message
     * @example
     * // Get one Message
     * const message = await prisma.message.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MessageFindFirstOrThrowArgs>(args?: SelectSubset<T, MessageFindFirstOrThrowArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Messages that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Messages
     * const messages = await prisma.message.findMany()
     * 
     * // Get first 10 Messages
     * const messages = await prisma.message.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const messageWithIdOnly = await prisma.message.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends MessageFindManyArgs>(args?: SelectSubset<T, MessageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Message.
     * @param {MessageCreateArgs} args - Arguments to create a Message.
     * @example
     * // Create one Message
     * const Message = await prisma.message.create({
     *   data: {
     *     // ... data to create a Message
     *   }
     * })
     * 
     */
    create<T extends MessageCreateArgs>(args: SelectSubset<T, MessageCreateArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Messages.
     * @param {MessageCreateManyArgs} args - Arguments to create many Messages.
     * @example
     * // Create many Messages
     * const message = await prisma.message.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends MessageCreateManyArgs>(args?: SelectSubset<T, MessageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Messages and returns the data saved in the database.
     * @param {MessageCreateManyAndReturnArgs} args - Arguments to create many Messages.
     * @example
     * // Create many Messages
     * const message = await prisma.message.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Messages and only return the `id`
     * const messageWithIdOnly = await prisma.message.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends MessageCreateManyAndReturnArgs>(args?: SelectSubset<T, MessageCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Message.
     * @param {MessageDeleteArgs} args - Arguments to delete one Message.
     * @example
     * // Delete one Message
     * const Message = await prisma.message.delete({
     *   where: {
     *     // ... filter to delete one Message
     *   }
     * })
     * 
     */
    delete<T extends MessageDeleteArgs>(args: SelectSubset<T, MessageDeleteArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Message.
     * @param {MessageUpdateArgs} args - Arguments to update one Message.
     * @example
     * // Update one Message
     * const message = await prisma.message.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends MessageUpdateArgs>(args: SelectSubset<T, MessageUpdateArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Messages.
     * @param {MessageDeleteManyArgs} args - Arguments to filter Messages to delete.
     * @example
     * // Delete a few Messages
     * const { count } = await prisma.message.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends MessageDeleteManyArgs>(args?: SelectSubset<T, MessageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Messages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Messages
     * const message = await prisma.message.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends MessageUpdateManyArgs>(args: SelectSubset<T, MessageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Messages and returns the data updated in the database.
     * @param {MessageUpdateManyAndReturnArgs} args - Arguments to update many Messages.
     * @example
     * // Update many Messages
     * const message = await prisma.message.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Messages and only return the `id`
     * const messageWithIdOnly = await prisma.message.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends MessageUpdateManyAndReturnArgs>(args: SelectSubset<T, MessageUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Message.
     * @param {MessageUpsertArgs} args - Arguments to update or create a Message.
     * @example
     * // Update or create a Message
     * const message = await prisma.message.upsert({
     *   create: {
     *     // ... data to create a Message
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Message we want to update
     *   }
     * })
     */
    upsert<T extends MessageUpsertArgs>(args: SelectSubset<T, MessageUpsertArgs<ExtArgs>>): Prisma__MessageClient<$Result.GetResult<Prisma.$MessagePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Messages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageCountArgs} args - Arguments to filter Messages to count.
     * @example
     * // Count the number of Messages
     * const count = await prisma.message.count({
     *   where: {
     *     // ... the filter for the Messages we want to count
     *   }
     * })
    **/
    count<T extends MessageCountArgs>(
      args?: Subset<T, MessageCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], MessageCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Message.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends MessageAggregateArgs>(args: Subset<T, MessageAggregateArgs>): Prisma.PrismaPromise<GetMessageAggregateType<T>>

    /**
     * Group by Message.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MessageGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends MessageGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: MessageGroupByArgs['orderBy'] }
        : { orderBy?: MessageGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, MessageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMessageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Message model
   */
  readonly fields: MessageFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Message.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__MessageClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    sender<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    receiver<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Message model
   */
  interface MessageFieldRefs {
    readonly id: FieldRef<"Message", 'Int'>
    readonly content: FieldRef<"Message", 'String'>
    readonly isRead: FieldRef<"Message", 'Boolean'>
    readonly createdAt: FieldRef<"Message", 'DateTime'>
    readonly senderId: FieldRef<"Message", 'Int'>
    readonly receiverId: FieldRef<"Message", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * Message findUnique
   */
  export type MessageFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Message to fetch.
     */
    where: MessageWhereUniqueInput
  }

  /**
   * Message findUniqueOrThrow
   */
  export type MessageFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Message to fetch.
     */
    where: MessageWhereUniqueInput
  }

  /**
   * Message findFirst
   */
  export type MessageFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Message to fetch.
     */
    where?: MessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Messages to fetch.
     */
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Messages.
     */
    cursor?: MessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Messages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Messages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Messages.
     */
    distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
  }

  /**
   * Message findFirstOrThrow
   */
  export type MessageFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Message to fetch.
     */
    where?: MessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Messages to fetch.
     */
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Messages.
     */
    cursor?: MessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Messages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Messages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Messages.
     */
    distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
  }

  /**
   * Message findMany
   */
  export type MessageFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter, which Messages to fetch.
     */
    where?: MessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Messages to fetch.
     */
    orderBy?: MessageOrderByWithRelationInput | MessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Messages.
     */
    cursor?: MessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Messages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Messages.
     */
    skip?: number
    distinct?: MessageScalarFieldEnum | MessageScalarFieldEnum[]
  }

  /**
   * Message create
   */
  export type MessageCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * The data needed to create a Message.
     */
    data: XOR<MessageCreateInput, MessageUncheckedCreateInput>
  }

  /**
   * Message createMany
   */
  export type MessageCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Messages.
     */
    data: MessageCreateManyInput | MessageCreateManyInput[]
  }

  /**
   * Message createManyAndReturn
   */
  export type MessageCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * The data used to create many Messages.
     */
    data: MessageCreateManyInput | MessageCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Message update
   */
  export type MessageUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * The data needed to update a Message.
     */
    data: XOR<MessageUpdateInput, MessageUncheckedUpdateInput>
    /**
     * Choose, which Message to update.
     */
    where: MessageWhereUniqueInput
  }

  /**
   * Message updateMany
   */
  export type MessageUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Messages.
     */
    data: XOR<MessageUpdateManyMutationInput, MessageUncheckedUpdateManyInput>
    /**
     * Filter which Messages to update
     */
    where?: MessageWhereInput
    /**
     * Limit how many Messages to update.
     */
    limit?: number
  }

  /**
   * Message updateManyAndReturn
   */
  export type MessageUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * The data used to update Messages.
     */
    data: XOR<MessageUpdateManyMutationInput, MessageUncheckedUpdateManyInput>
    /**
     * Filter which Messages to update
     */
    where?: MessageWhereInput
    /**
     * Limit how many Messages to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Message upsert
   */
  export type MessageUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * The filter to search for the Message to update in case it exists.
     */
    where: MessageWhereUniqueInput
    /**
     * In case the Message found by the `where` argument doesn't exist, create a new Message with this data.
     */
    create: XOR<MessageCreateInput, MessageUncheckedCreateInput>
    /**
     * In case the Message was found with the provided `where` argument, update it with this data.
     */
    update: XOR<MessageUpdateInput, MessageUncheckedUpdateInput>
  }

  /**
   * Message delete
   */
  export type MessageDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
    /**
     * Filter which Message to delete.
     */
    where: MessageWhereUniqueInput
  }

  /**
   * Message deleteMany
   */
  export type MessageDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Messages to delete
     */
    where?: MessageWhereInput
    /**
     * Limit how many Messages to delete.
     */
    limit?: number
  }

  /**
   * Message without action
   */
  export type MessageDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Message
     */
    select?: MessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Message
     */
    omit?: MessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MessageInclude<ExtArgs> | null
  }


  /**
   * Model Comment
   */

  export type AggregateComment = {
    _count: CommentCountAggregateOutputType | null
    _avg: CommentAvgAggregateOutputType | null
    _sum: CommentSumAggregateOutputType | null
    _min: CommentMinAggregateOutputType | null
    _max: CommentMaxAggregateOutputType | null
  }

  export type CommentAvgAggregateOutputType = {
    id: number | null
    postId: number | null
    authorId: number | null
  }

  export type CommentSumAggregateOutputType = {
    id: number | null
    postId: number | null
    authorId: number | null
  }

  export type CommentMinAggregateOutputType = {
    id: number | null
    content: string | null
    createdAt: Date | null
    updatedAt: Date | null
    postId: number | null
    authorId: number | null
  }

  export type CommentMaxAggregateOutputType = {
    id: number | null
    content: string | null
    createdAt: Date | null
    updatedAt: Date | null
    postId: number | null
    authorId: number | null
  }

  export type CommentCountAggregateOutputType = {
    id: number
    content: number
    createdAt: number
    updatedAt: number
    postId: number
    authorId: number
    _all: number
  }


  export type CommentAvgAggregateInputType = {
    id?: true
    postId?: true
    authorId?: true
  }

  export type CommentSumAggregateInputType = {
    id?: true
    postId?: true
    authorId?: true
  }

  export type CommentMinAggregateInputType = {
    id?: true
    content?: true
    createdAt?: true
    updatedAt?: true
    postId?: true
    authorId?: true
  }

  export type CommentMaxAggregateInputType = {
    id?: true
    content?: true
    createdAt?: true
    updatedAt?: true
    postId?: true
    authorId?: true
  }

  export type CommentCountAggregateInputType = {
    id?: true
    content?: true
    createdAt?: true
    updatedAt?: true
    postId?: true
    authorId?: true
    _all?: true
  }

  export type CommentAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Comment to aggregate.
     */
    where?: CommentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Comments to fetch.
     */
    orderBy?: CommentOrderByWithRelationInput | CommentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CommentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Comments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Comments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Comments
    **/
    _count?: true | CommentCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: CommentAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: CommentSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CommentMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CommentMaxAggregateInputType
  }

  export type GetCommentAggregateType<T extends CommentAggregateArgs> = {
        [P in keyof T & keyof AggregateComment]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateComment[P]>
      : GetScalarType<T[P], AggregateComment[P]>
  }




  export type CommentGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CommentWhereInput
    orderBy?: CommentOrderByWithAggregationInput | CommentOrderByWithAggregationInput[]
    by: CommentScalarFieldEnum[] | CommentScalarFieldEnum
    having?: CommentScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CommentCountAggregateInputType | true
    _avg?: CommentAvgAggregateInputType
    _sum?: CommentSumAggregateInputType
    _min?: CommentMinAggregateInputType
    _max?: CommentMaxAggregateInputType
  }

  export type CommentGroupByOutputType = {
    id: number
    content: string
    createdAt: Date
    updatedAt: Date
    postId: number
    authorId: number
    _count: CommentCountAggregateOutputType | null
    _avg: CommentAvgAggregateOutputType | null
    _sum: CommentSumAggregateOutputType | null
    _min: CommentMinAggregateOutputType | null
    _max: CommentMaxAggregateOutputType | null
  }

  type GetCommentGroupByPayload<T extends CommentGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CommentGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CommentGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CommentGroupByOutputType[P]>
            : GetScalarType<T[P], CommentGroupByOutputType[P]>
        }
      >
    >


  export type CommentSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    content?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    postId?: boolean
    authorId?: boolean
    post?: boolean | PostDefaultArgs<ExtArgs>
    author?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["comment"]>

  export type CommentSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    content?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    postId?: boolean
    authorId?: boolean
    post?: boolean | PostDefaultArgs<ExtArgs>
    author?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["comment"]>

  export type CommentSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    content?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    postId?: boolean
    authorId?: boolean
    post?: boolean | PostDefaultArgs<ExtArgs>
    author?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["comment"]>

  export type CommentSelectScalar = {
    id?: boolean
    content?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    postId?: boolean
    authorId?: boolean
  }

  export type CommentOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "content" | "createdAt" | "updatedAt" | "postId" | "authorId", ExtArgs["result"]["comment"]>
  export type CommentInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    post?: boolean | PostDefaultArgs<ExtArgs>
    author?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type CommentIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    post?: boolean | PostDefaultArgs<ExtArgs>
    author?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type CommentIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    post?: boolean | PostDefaultArgs<ExtArgs>
    author?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $CommentPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Comment"
    objects: {
      post: Prisma.$PostPayload<ExtArgs>
      author: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      content: string
      createdAt: Date
      updatedAt: Date
      postId: number
      authorId: number
    }, ExtArgs["result"]["comment"]>
    composites: {}
  }

  type CommentGetPayload<S extends boolean | null | undefined | CommentDefaultArgs> = $Result.GetResult<Prisma.$CommentPayload, S>

  type CommentCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CommentFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CommentCountAggregateInputType | true
    }

  export interface CommentDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Comment'], meta: { name: 'Comment' } }
    /**
     * Find zero or one Comment that matches the filter.
     * @param {CommentFindUniqueArgs} args - Arguments to find a Comment
     * @example
     * // Get one Comment
     * const comment = await prisma.comment.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CommentFindUniqueArgs>(args: SelectSubset<T, CommentFindUniqueArgs<ExtArgs>>): Prisma__CommentClient<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Comment that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CommentFindUniqueOrThrowArgs} args - Arguments to find a Comment
     * @example
     * // Get one Comment
     * const comment = await prisma.comment.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CommentFindUniqueOrThrowArgs>(args: SelectSubset<T, CommentFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CommentClient<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Comment that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommentFindFirstArgs} args - Arguments to find a Comment
     * @example
     * // Get one Comment
     * const comment = await prisma.comment.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CommentFindFirstArgs>(args?: SelectSubset<T, CommentFindFirstArgs<ExtArgs>>): Prisma__CommentClient<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Comment that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommentFindFirstOrThrowArgs} args - Arguments to find a Comment
     * @example
     * // Get one Comment
     * const comment = await prisma.comment.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CommentFindFirstOrThrowArgs>(args?: SelectSubset<T, CommentFindFirstOrThrowArgs<ExtArgs>>): Prisma__CommentClient<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Comments that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommentFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Comments
     * const comments = await prisma.comment.findMany()
     * 
     * // Get first 10 Comments
     * const comments = await prisma.comment.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const commentWithIdOnly = await prisma.comment.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CommentFindManyArgs>(args?: SelectSubset<T, CommentFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Comment.
     * @param {CommentCreateArgs} args - Arguments to create a Comment.
     * @example
     * // Create one Comment
     * const Comment = await prisma.comment.create({
     *   data: {
     *     // ... data to create a Comment
     *   }
     * })
     * 
     */
    create<T extends CommentCreateArgs>(args: SelectSubset<T, CommentCreateArgs<ExtArgs>>): Prisma__CommentClient<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Comments.
     * @param {CommentCreateManyArgs} args - Arguments to create many Comments.
     * @example
     * // Create many Comments
     * const comment = await prisma.comment.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CommentCreateManyArgs>(args?: SelectSubset<T, CommentCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Comments and returns the data saved in the database.
     * @param {CommentCreateManyAndReturnArgs} args - Arguments to create many Comments.
     * @example
     * // Create many Comments
     * const comment = await prisma.comment.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Comments and only return the `id`
     * const commentWithIdOnly = await prisma.comment.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CommentCreateManyAndReturnArgs>(args?: SelectSubset<T, CommentCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Comment.
     * @param {CommentDeleteArgs} args - Arguments to delete one Comment.
     * @example
     * // Delete one Comment
     * const Comment = await prisma.comment.delete({
     *   where: {
     *     // ... filter to delete one Comment
     *   }
     * })
     * 
     */
    delete<T extends CommentDeleteArgs>(args: SelectSubset<T, CommentDeleteArgs<ExtArgs>>): Prisma__CommentClient<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Comment.
     * @param {CommentUpdateArgs} args - Arguments to update one Comment.
     * @example
     * // Update one Comment
     * const comment = await prisma.comment.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CommentUpdateArgs>(args: SelectSubset<T, CommentUpdateArgs<ExtArgs>>): Prisma__CommentClient<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Comments.
     * @param {CommentDeleteManyArgs} args - Arguments to filter Comments to delete.
     * @example
     * // Delete a few Comments
     * const { count } = await prisma.comment.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CommentDeleteManyArgs>(args?: SelectSubset<T, CommentDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Comments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommentUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Comments
     * const comment = await prisma.comment.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CommentUpdateManyArgs>(args: SelectSubset<T, CommentUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Comments and returns the data updated in the database.
     * @param {CommentUpdateManyAndReturnArgs} args - Arguments to update many Comments.
     * @example
     * // Update many Comments
     * const comment = await prisma.comment.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Comments and only return the `id`
     * const commentWithIdOnly = await prisma.comment.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CommentUpdateManyAndReturnArgs>(args: SelectSubset<T, CommentUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Comment.
     * @param {CommentUpsertArgs} args - Arguments to update or create a Comment.
     * @example
     * // Update or create a Comment
     * const comment = await prisma.comment.upsert({
     *   create: {
     *     // ... data to create a Comment
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Comment we want to update
     *   }
     * })
     */
    upsert<T extends CommentUpsertArgs>(args: SelectSubset<T, CommentUpsertArgs<ExtArgs>>): Prisma__CommentClient<$Result.GetResult<Prisma.$CommentPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Comments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommentCountArgs} args - Arguments to filter Comments to count.
     * @example
     * // Count the number of Comments
     * const count = await prisma.comment.count({
     *   where: {
     *     // ... the filter for the Comments we want to count
     *   }
     * })
    **/
    count<T extends CommentCountArgs>(
      args?: Subset<T, CommentCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CommentCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Comment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommentAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CommentAggregateArgs>(args: Subset<T, CommentAggregateArgs>): Prisma.PrismaPromise<GetCommentAggregateType<T>>

    /**
     * Group by Comment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommentGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CommentGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CommentGroupByArgs['orderBy'] }
        : { orderBy?: CommentGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CommentGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCommentGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Comment model
   */
  readonly fields: CommentFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Comment.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CommentClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    post<T extends PostDefaultArgs<ExtArgs> = {}>(args?: Subset<T, PostDefaultArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    author<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Comment model
   */
  interface CommentFieldRefs {
    readonly id: FieldRef<"Comment", 'Int'>
    readonly content: FieldRef<"Comment", 'String'>
    readonly createdAt: FieldRef<"Comment", 'DateTime'>
    readonly updatedAt: FieldRef<"Comment", 'DateTime'>
    readonly postId: FieldRef<"Comment", 'Int'>
    readonly authorId: FieldRef<"Comment", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * Comment findUnique
   */
  export type CommentFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentInclude<ExtArgs> | null
    /**
     * Filter, which Comment to fetch.
     */
    where: CommentWhereUniqueInput
  }

  /**
   * Comment findUniqueOrThrow
   */
  export type CommentFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentInclude<ExtArgs> | null
    /**
     * Filter, which Comment to fetch.
     */
    where: CommentWhereUniqueInput
  }

  /**
   * Comment findFirst
   */
  export type CommentFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentInclude<ExtArgs> | null
    /**
     * Filter, which Comment to fetch.
     */
    where?: CommentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Comments to fetch.
     */
    orderBy?: CommentOrderByWithRelationInput | CommentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Comments.
     */
    cursor?: CommentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Comments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Comments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Comments.
     */
    distinct?: CommentScalarFieldEnum | CommentScalarFieldEnum[]
  }

  /**
   * Comment findFirstOrThrow
   */
  export type CommentFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentInclude<ExtArgs> | null
    /**
     * Filter, which Comment to fetch.
     */
    where?: CommentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Comments to fetch.
     */
    orderBy?: CommentOrderByWithRelationInput | CommentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Comments.
     */
    cursor?: CommentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Comments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Comments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Comments.
     */
    distinct?: CommentScalarFieldEnum | CommentScalarFieldEnum[]
  }

  /**
   * Comment findMany
   */
  export type CommentFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentInclude<ExtArgs> | null
    /**
     * Filter, which Comments to fetch.
     */
    where?: CommentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Comments to fetch.
     */
    orderBy?: CommentOrderByWithRelationInput | CommentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Comments.
     */
    cursor?: CommentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Comments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Comments.
     */
    skip?: number
    distinct?: CommentScalarFieldEnum | CommentScalarFieldEnum[]
  }

  /**
   * Comment create
   */
  export type CommentCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentInclude<ExtArgs> | null
    /**
     * The data needed to create a Comment.
     */
    data: XOR<CommentCreateInput, CommentUncheckedCreateInput>
  }

  /**
   * Comment createMany
   */
  export type CommentCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Comments.
     */
    data: CommentCreateManyInput | CommentCreateManyInput[]
  }

  /**
   * Comment createManyAndReturn
   */
  export type CommentCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * The data used to create many Comments.
     */
    data: CommentCreateManyInput | CommentCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Comment update
   */
  export type CommentUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentInclude<ExtArgs> | null
    /**
     * The data needed to update a Comment.
     */
    data: XOR<CommentUpdateInput, CommentUncheckedUpdateInput>
    /**
     * Choose, which Comment to update.
     */
    where: CommentWhereUniqueInput
  }

  /**
   * Comment updateMany
   */
  export type CommentUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Comments.
     */
    data: XOR<CommentUpdateManyMutationInput, CommentUncheckedUpdateManyInput>
    /**
     * Filter which Comments to update
     */
    where?: CommentWhereInput
    /**
     * Limit how many Comments to update.
     */
    limit?: number
  }

  /**
   * Comment updateManyAndReturn
   */
  export type CommentUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * The data used to update Comments.
     */
    data: XOR<CommentUpdateManyMutationInput, CommentUncheckedUpdateManyInput>
    /**
     * Filter which Comments to update
     */
    where?: CommentWhereInput
    /**
     * Limit how many Comments to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Comment upsert
   */
  export type CommentUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentInclude<ExtArgs> | null
    /**
     * The filter to search for the Comment to update in case it exists.
     */
    where: CommentWhereUniqueInput
    /**
     * In case the Comment found by the `where` argument doesn't exist, create a new Comment with this data.
     */
    create: XOR<CommentCreateInput, CommentUncheckedCreateInput>
    /**
     * In case the Comment was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CommentUpdateInput, CommentUncheckedUpdateInput>
  }

  /**
   * Comment delete
   */
  export type CommentDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentInclude<ExtArgs> | null
    /**
     * Filter which Comment to delete.
     */
    where: CommentWhereUniqueInput
  }

  /**
   * Comment deleteMany
   */
  export type CommentDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Comments to delete
     */
    where?: CommentWhereInput
    /**
     * Limit how many Comments to delete.
     */
    limit?: number
  }

  /**
   * Comment without action
   */
  export type CommentDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comment
     */
    select?: CommentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Comment
     */
    omit?: CommentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommentInclude<ExtArgs> | null
  }


  /**
   * Model Crush
   */

  export type AggregateCrush = {
    _count: CrushCountAggregateOutputType | null
    _avg: CrushAvgAggregateOutputType | null
    _sum: CrushSumAggregateOutputType | null
    _min: CrushMinAggregateOutputType | null
    _max: CrushMaxAggregateOutputType | null
  }

  export type CrushAvgAggregateOutputType = {
    id: number | null
    userId: number | null
    crushId: number | null
  }

  export type CrushSumAggregateOutputType = {
    id: number | null
    userId: number | null
    crushId: number | null
  }

  export type CrushMinAggregateOutputType = {
    id: number | null
    createdAt: Date | null
    userId: number | null
    crushId: number | null
  }

  export type CrushMaxAggregateOutputType = {
    id: number | null
    createdAt: Date | null
    userId: number | null
    crushId: number | null
  }

  export type CrushCountAggregateOutputType = {
    id: number
    createdAt: number
    userId: number
    crushId: number
    _all: number
  }


  export type CrushAvgAggregateInputType = {
    id?: true
    userId?: true
    crushId?: true
  }

  export type CrushSumAggregateInputType = {
    id?: true
    userId?: true
    crushId?: true
  }

  export type CrushMinAggregateInputType = {
    id?: true
    createdAt?: true
    userId?: true
    crushId?: true
  }

  export type CrushMaxAggregateInputType = {
    id?: true
    createdAt?: true
    userId?: true
    crushId?: true
  }

  export type CrushCountAggregateInputType = {
    id?: true
    createdAt?: true
    userId?: true
    crushId?: true
    _all?: true
  }

  export type CrushAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Crush to aggregate.
     */
    where?: CrushWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Crushes to fetch.
     */
    orderBy?: CrushOrderByWithRelationInput | CrushOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CrushWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Crushes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Crushes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Crushes
    **/
    _count?: true | CrushCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: CrushAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: CrushSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CrushMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CrushMaxAggregateInputType
  }

  export type GetCrushAggregateType<T extends CrushAggregateArgs> = {
        [P in keyof T & keyof AggregateCrush]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCrush[P]>
      : GetScalarType<T[P], AggregateCrush[P]>
  }




  export type CrushGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CrushWhereInput
    orderBy?: CrushOrderByWithAggregationInput | CrushOrderByWithAggregationInput[]
    by: CrushScalarFieldEnum[] | CrushScalarFieldEnum
    having?: CrushScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CrushCountAggregateInputType | true
    _avg?: CrushAvgAggregateInputType
    _sum?: CrushSumAggregateInputType
    _min?: CrushMinAggregateInputType
    _max?: CrushMaxAggregateInputType
  }

  export type CrushGroupByOutputType = {
    id: number
    createdAt: Date
    userId: number
    crushId: number
    _count: CrushCountAggregateOutputType | null
    _avg: CrushAvgAggregateOutputType | null
    _sum: CrushSumAggregateOutputType | null
    _min: CrushMinAggregateOutputType | null
    _max: CrushMaxAggregateOutputType | null
  }

  type GetCrushGroupByPayload<T extends CrushGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CrushGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CrushGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CrushGroupByOutputType[P]>
            : GetScalarType<T[P], CrushGroupByOutputType[P]>
        }
      >
    >


  export type CrushSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    userId?: boolean
    crushId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    crush?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["crush"]>

  export type CrushSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    userId?: boolean
    crushId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    crush?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["crush"]>

  export type CrushSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    userId?: boolean
    crushId?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    crush?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["crush"]>

  export type CrushSelectScalar = {
    id?: boolean
    createdAt?: boolean
    userId?: boolean
    crushId?: boolean
  }

  export type CrushOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "createdAt" | "userId" | "crushId", ExtArgs["result"]["crush"]>
  export type CrushInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    crush?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type CrushIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    crush?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type CrushIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    crush?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $CrushPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Crush"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
      crush: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      createdAt: Date
      userId: number
      crushId: number
    }, ExtArgs["result"]["crush"]>
    composites: {}
  }

  type CrushGetPayload<S extends boolean | null | undefined | CrushDefaultArgs> = $Result.GetResult<Prisma.$CrushPayload, S>

  type CrushCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CrushFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CrushCountAggregateInputType | true
    }

  export interface CrushDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Crush'], meta: { name: 'Crush' } }
    /**
     * Find zero or one Crush that matches the filter.
     * @param {CrushFindUniqueArgs} args - Arguments to find a Crush
     * @example
     * // Get one Crush
     * const crush = await prisma.crush.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CrushFindUniqueArgs>(args: SelectSubset<T, CrushFindUniqueArgs<ExtArgs>>): Prisma__CrushClient<$Result.GetResult<Prisma.$CrushPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Crush that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CrushFindUniqueOrThrowArgs} args - Arguments to find a Crush
     * @example
     * // Get one Crush
     * const crush = await prisma.crush.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CrushFindUniqueOrThrowArgs>(args: SelectSubset<T, CrushFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CrushClient<$Result.GetResult<Prisma.$CrushPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Crush that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrushFindFirstArgs} args - Arguments to find a Crush
     * @example
     * // Get one Crush
     * const crush = await prisma.crush.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CrushFindFirstArgs>(args?: SelectSubset<T, CrushFindFirstArgs<ExtArgs>>): Prisma__CrushClient<$Result.GetResult<Prisma.$CrushPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Crush that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrushFindFirstOrThrowArgs} args - Arguments to find a Crush
     * @example
     * // Get one Crush
     * const crush = await prisma.crush.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CrushFindFirstOrThrowArgs>(args?: SelectSubset<T, CrushFindFirstOrThrowArgs<ExtArgs>>): Prisma__CrushClient<$Result.GetResult<Prisma.$CrushPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Crushes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrushFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Crushes
     * const crushes = await prisma.crush.findMany()
     * 
     * // Get first 10 Crushes
     * const crushes = await prisma.crush.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const crushWithIdOnly = await prisma.crush.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CrushFindManyArgs>(args?: SelectSubset<T, CrushFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CrushPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Crush.
     * @param {CrushCreateArgs} args - Arguments to create a Crush.
     * @example
     * // Create one Crush
     * const Crush = await prisma.crush.create({
     *   data: {
     *     // ... data to create a Crush
     *   }
     * })
     * 
     */
    create<T extends CrushCreateArgs>(args: SelectSubset<T, CrushCreateArgs<ExtArgs>>): Prisma__CrushClient<$Result.GetResult<Prisma.$CrushPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Crushes.
     * @param {CrushCreateManyArgs} args - Arguments to create many Crushes.
     * @example
     * // Create many Crushes
     * const crush = await prisma.crush.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CrushCreateManyArgs>(args?: SelectSubset<T, CrushCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Crushes and returns the data saved in the database.
     * @param {CrushCreateManyAndReturnArgs} args - Arguments to create many Crushes.
     * @example
     * // Create many Crushes
     * const crush = await prisma.crush.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Crushes and only return the `id`
     * const crushWithIdOnly = await prisma.crush.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CrushCreateManyAndReturnArgs>(args?: SelectSubset<T, CrushCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CrushPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Crush.
     * @param {CrushDeleteArgs} args - Arguments to delete one Crush.
     * @example
     * // Delete one Crush
     * const Crush = await prisma.crush.delete({
     *   where: {
     *     // ... filter to delete one Crush
     *   }
     * })
     * 
     */
    delete<T extends CrushDeleteArgs>(args: SelectSubset<T, CrushDeleteArgs<ExtArgs>>): Prisma__CrushClient<$Result.GetResult<Prisma.$CrushPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Crush.
     * @param {CrushUpdateArgs} args - Arguments to update one Crush.
     * @example
     * // Update one Crush
     * const crush = await prisma.crush.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CrushUpdateArgs>(args: SelectSubset<T, CrushUpdateArgs<ExtArgs>>): Prisma__CrushClient<$Result.GetResult<Prisma.$CrushPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Crushes.
     * @param {CrushDeleteManyArgs} args - Arguments to filter Crushes to delete.
     * @example
     * // Delete a few Crushes
     * const { count } = await prisma.crush.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CrushDeleteManyArgs>(args?: SelectSubset<T, CrushDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Crushes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrushUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Crushes
     * const crush = await prisma.crush.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CrushUpdateManyArgs>(args: SelectSubset<T, CrushUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Crushes and returns the data updated in the database.
     * @param {CrushUpdateManyAndReturnArgs} args - Arguments to update many Crushes.
     * @example
     * // Update many Crushes
     * const crush = await prisma.crush.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Crushes and only return the `id`
     * const crushWithIdOnly = await prisma.crush.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CrushUpdateManyAndReturnArgs>(args: SelectSubset<T, CrushUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CrushPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Crush.
     * @param {CrushUpsertArgs} args - Arguments to update or create a Crush.
     * @example
     * // Update or create a Crush
     * const crush = await prisma.crush.upsert({
     *   create: {
     *     // ... data to create a Crush
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Crush we want to update
     *   }
     * })
     */
    upsert<T extends CrushUpsertArgs>(args: SelectSubset<T, CrushUpsertArgs<ExtArgs>>): Prisma__CrushClient<$Result.GetResult<Prisma.$CrushPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Crushes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrushCountArgs} args - Arguments to filter Crushes to count.
     * @example
     * // Count the number of Crushes
     * const count = await prisma.crush.count({
     *   where: {
     *     // ... the filter for the Crushes we want to count
     *   }
     * })
    **/
    count<T extends CrushCountArgs>(
      args?: Subset<T, CrushCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CrushCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Crush.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrushAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CrushAggregateArgs>(args: Subset<T, CrushAggregateArgs>): Prisma.PrismaPromise<GetCrushAggregateType<T>>

    /**
     * Group by Crush.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrushGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CrushGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CrushGroupByArgs['orderBy'] }
        : { orderBy?: CrushGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CrushGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCrushGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Crush model
   */
  readonly fields: CrushFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Crush.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CrushClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    crush<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Crush model
   */
  interface CrushFieldRefs {
    readonly id: FieldRef<"Crush", 'Int'>
    readonly createdAt: FieldRef<"Crush", 'DateTime'>
    readonly userId: FieldRef<"Crush", 'Int'>
    readonly crushId: FieldRef<"Crush", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * Crush findUnique
   */
  export type CrushFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Crush
     */
    select?: CrushSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Crush
     */
    omit?: CrushOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrushInclude<ExtArgs> | null
    /**
     * Filter, which Crush to fetch.
     */
    where: CrushWhereUniqueInput
  }

  /**
   * Crush findUniqueOrThrow
   */
  export type CrushFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Crush
     */
    select?: CrushSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Crush
     */
    omit?: CrushOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrushInclude<ExtArgs> | null
    /**
     * Filter, which Crush to fetch.
     */
    where: CrushWhereUniqueInput
  }

  /**
   * Crush findFirst
   */
  export type CrushFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Crush
     */
    select?: CrushSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Crush
     */
    omit?: CrushOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrushInclude<ExtArgs> | null
    /**
     * Filter, which Crush to fetch.
     */
    where?: CrushWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Crushes to fetch.
     */
    orderBy?: CrushOrderByWithRelationInput | CrushOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Crushes.
     */
    cursor?: CrushWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Crushes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Crushes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Crushes.
     */
    distinct?: CrushScalarFieldEnum | CrushScalarFieldEnum[]
  }

  /**
   * Crush findFirstOrThrow
   */
  export type CrushFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Crush
     */
    select?: CrushSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Crush
     */
    omit?: CrushOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrushInclude<ExtArgs> | null
    /**
     * Filter, which Crush to fetch.
     */
    where?: CrushWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Crushes to fetch.
     */
    orderBy?: CrushOrderByWithRelationInput | CrushOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Crushes.
     */
    cursor?: CrushWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Crushes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Crushes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Crushes.
     */
    distinct?: CrushScalarFieldEnum | CrushScalarFieldEnum[]
  }

  /**
   * Crush findMany
   */
  export type CrushFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Crush
     */
    select?: CrushSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Crush
     */
    omit?: CrushOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrushInclude<ExtArgs> | null
    /**
     * Filter, which Crushes to fetch.
     */
    where?: CrushWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Crushes to fetch.
     */
    orderBy?: CrushOrderByWithRelationInput | CrushOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Crushes.
     */
    cursor?: CrushWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Crushes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Crushes.
     */
    skip?: number
    distinct?: CrushScalarFieldEnum | CrushScalarFieldEnum[]
  }

  /**
   * Crush create
   */
  export type CrushCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Crush
     */
    select?: CrushSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Crush
     */
    omit?: CrushOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrushInclude<ExtArgs> | null
    /**
     * The data needed to create a Crush.
     */
    data: XOR<CrushCreateInput, CrushUncheckedCreateInput>
  }

  /**
   * Crush createMany
   */
  export type CrushCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Crushes.
     */
    data: CrushCreateManyInput | CrushCreateManyInput[]
  }

  /**
   * Crush createManyAndReturn
   */
  export type CrushCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Crush
     */
    select?: CrushSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Crush
     */
    omit?: CrushOmit<ExtArgs> | null
    /**
     * The data used to create many Crushes.
     */
    data: CrushCreateManyInput | CrushCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrushIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Crush update
   */
  export type CrushUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Crush
     */
    select?: CrushSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Crush
     */
    omit?: CrushOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrushInclude<ExtArgs> | null
    /**
     * The data needed to update a Crush.
     */
    data: XOR<CrushUpdateInput, CrushUncheckedUpdateInput>
    /**
     * Choose, which Crush to update.
     */
    where: CrushWhereUniqueInput
  }

  /**
   * Crush updateMany
   */
  export type CrushUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Crushes.
     */
    data: XOR<CrushUpdateManyMutationInput, CrushUncheckedUpdateManyInput>
    /**
     * Filter which Crushes to update
     */
    where?: CrushWhereInput
    /**
     * Limit how many Crushes to update.
     */
    limit?: number
  }

  /**
   * Crush updateManyAndReturn
   */
  export type CrushUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Crush
     */
    select?: CrushSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Crush
     */
    omit?: CrushOmit<ExtArgs> | null
    /**
     * The data used to update Crushes.
     */
    data: XOR<CrushUpdateManyMutationInput, CrushUncheckedUpdateManyInput>
    /**
     * Filter which Crushes to update
     */
    where?: CrushWhereInput
    /**
     * Limit how many Crushes to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrushIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Crush upsert
   */
  export type CrushUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Crush
     */
    select?: CrushSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Crush
     */
    omit?: CrushOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrushInclude<ExtArgs> | null
    /**
     * The filter to search for the Crush to update in case it exists.
     */
    where: CrushWhereUniqueInput
    /**
     * In case the Crush found by the `where` argument doesn't exist, create a new Crush with this data.
     */
    create: XOR<CrushCreateInput, CrushUncheckedCreateInput>
    /**
     * In case the Crush was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CrushUpdateInput, CrushUncheckedUpdateInput>
  }

  /**
   * Crush delete
   */
  export type CrushDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Crush
     */
    select?: CrushSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Crush
     */
    omit?: CrushOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrushInclude<ExtArgs> | null
    /**
     * Filter which Crush to delete.
     */
    where: CrushWhereUniqueInput
  }

  /**
   * Crush deleteMany
   */
  export type CrushDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Crushes to delete
     */
    where?: CrushWhereInput
    /**
     * Limit how many Crushes to delete.
     */
    limit?: number
  }

  /**
   * Crush without action
   */
  export type CrushDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Crush
     */
    select?: CrushSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Crush
     */
    omit?: CrushOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CrushInclude<ExtArgs> | null
  }


  /**
   * Model CloseFriendRequest
   */

  export type AggregateCloseFriendRequest = {
    _count: CloseFriendRequestCountAggregateOutputType | null
    _avg: CloseFriendRequestAvgAggregateOutputType | null
    _sum: CloseFriendRequestSumAggregateOutputType | null
    _min: CloseFriendRequestMinAggregateOutputType | null
    _max: CloseFriendRequestMaxAggregateOutputType | null
  }

  export type CloseFriendRequestAvgAggregateOutputType = {
    id: number | null
    senderId: number | null
    receiverId: number | null
  }

  export type CloseFriendRequestSumAggregateOutputType = {
    id: number | null
    senderId: number | null
    receiverId: number | null
  }

  export type CloseFriendRequestMinAggregateOutputType = {
    id: number | null
    status: string | null
    createdAt: Date | null
    updatedAt: Date | null
    senderId: number | null
    receiverId: number | null
  }

  export type CloseFriendRequestMaxAggregateOutputType = {
    id: number | null
    status: string | null
    createdAt: Date | null
    updatedAt: Date | null
    senderId: number | null
    receiverId: number | null
  }

  export type CloseFriendRequestCountAggregateOutputType = {
    id: number
    status: number
    createdAt: number
    updatedAt: number
    senderId: number
    receiverId: number
    _all: number
  }


  export type CloseFriendRequestAvgAggregateInputType = {
    id?: true
    senderId?: true
    receiverId?: true
  }

  export type CloseFriendRequestSumAggregateInputType = {
    id?: true
    senderId?: true
    receiverId?: true
  }

  export type CloseFriendRequestMinAggregateInputType = {
    id?: true
    status?: true
    createdAt?: true
    updatedAt?: true
    senderId?: true
    receiverId?: true
  }

  export type CloseFriendRequestMaxAggregateInputType = {
    id?: true
    status?: true
    createdAt?: true
    updatedAt?: true
    senderId?: true
    receiverId?: true
  }

  export type CloseFriendRequestCountAggregateInputType = {
    id?: true
    status?: true
    createdAt?: true
    updatedAt?: true
    senderId?: true
    receiverId?: true
    _all?: true
  }

  export type CloseFriendRequestAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CloseFriendRequest to aggregate.
     */
    where?: CloseFriendRequestWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CloseFriendRequests to fetch.
     */
    orderBy?: CloseFriendRequestOrderByWithRelationInput | CloseFriendRequestOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CloseFriendRequestWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CloseFriendRequests from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CloseFriendRequests.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned CloseFriendRequests
    **/
    _count?: true | CloseFriendRequestCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: CloseFriendRequestAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: CloseFriendRequestSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CloseFriendRequestMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CloseFriendRequestMaxAggregateInputType
  }

  export type GetCloseFriendRequestAggregateType<T extends CloseFriendRequestAggregateArgs> = {
        [P in keyof T & keyof AggregateCloseFriendRequest]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCloseFriendRequest[P]>
      : GetScalarType<T[P], AggregateCloseFriendRequest[P]>
  }




  export type CloseFriendRequestGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CloseFriendRequestWhereInput
    orderBy?: CloseFriendRequestOrderByWithAggregationInput | CloseFriendRequestOrderByWithAggregationInput[]
    by: CloseFriendRequestScalarFieldEnum[] | CloseFriendRequestScalarFieldEnum
    having?: CloseFriendRequestScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CloseFriendRequestCountAggregateInputType | true
    _avg?: CloseFriendRequestAvgAggregateInputType
    _sum?: CloseFriendRequestSumAggregateInputType
    _min?: CloseFriendRequestMinAggregateInputType
    _max?: CloseFriendRequestMaxAggregateInputType
  }

  export type CloseFriendRequestGroupByOutputType = {
    id: number
    status: string
    createdAt: Date
    updatedAt: Date
    senderId: number
    receiverId: number
    _count: CloseFriendRequestCountAggregateOutputType | null
    _avg: CloseFriendRequestAvgAggregateOutputType | null
    _sum: CloseFriendRequestSumAggregateOutputType | null
    _min: CloseFriendRequestMinAggregateOutputType | null
    _max: CloseFriendRequestMaxAggregateOutputType | null
  }

  type GetCloseFriendRequestGroupByPayload<T extends CloseFriendRequestGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CloseFriendRequestGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CloseFriendRequestGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CloseFriendRequestGroupByOutputType[P]>
            : GetScalarType<T[P], CloseFriendRequestGroupByOutputType[P]>
        }
      >
    >


  export type CloseFriendRequestSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    senderId?: boolean
    receiverId?: boolean
    sender?: boolean | UserDefaultArgs<ExtArgs>
    receiver?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["closeFriendRequest"]>

  export type CloseFriendRequestSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    senderId?: boolean
    receiverId?: boolean
    sender?: boolean | UserDefaultArgs<ExtArgs>
    receiver?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["closeFriendRequest"]>

  export type CloseFriendRequestSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    senderId?: boolean
    receiverId?: boolean
    sender?: boolean | UserDefaultArgs<ExtArgs>
    receiver?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["closeFriendRequest"]>

  export type CloseFriendRequestSelectScalar = {
    id?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    senderId?: boolean
    receiverId?: boolean
  }

  export type CloseFriendRequestOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "status" | "createdAt" | "updatedAt" | "senderId" | "receiverId", ExtArgs["result"]["closeFriendRequest"]>
  export type CloseFriendRequestInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sender?: boolean | UserDefaultArgs<ExtArgs>
    receiver?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type CloseFriendRequestIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sender?: boolean | UserDefaultArgs<ExtArgs>
    receiver?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type CloseFriendRequestIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sender?: boolean | UserDefaultArgs<ExtArgs>
    receiver?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $CloseFriendRequestPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CloseFriendRequest"
    objects: {
      sender: Prisma.$UserPayload<ExtArgs>
      receiver: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      status: string
      createdAt: Date
      updatedAt: Date
      senderId: number
      receiverId: number
    }, ExtArgs["result"]["closeFriendRequest"]>
    composites: {}
  }

  type CloseFriendRequestGetPayload<S extends boolean | null | undefined | CloseFriendRequestDefaultArgs> = $Result.GetResult<Prisma.$CloseFriendRequestPayload, S>

  type CloseFriendRequestCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CloseFriendRequestFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CloseFriendRequestCountAggregateInputType | true
    }

  export interface CloseFriendRequestDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CloseFriendRequest'], meta: { name: 'CloseFriendRequest' } }
    /**
     * Find zero or one CloseFriendRequest that matches the filter.
     * @param {CloseFriendRequestFindUniqueArgs} args - Arguments to find a CloseFriendRequest
     * @example
     * // Get one CloseFriendRequest
     * const closeFriendRequest = await prisma.closeFriendRequest.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CloseFriendRequestFindUniqueArgs>(args: SelectSubset<T, CloseFriendRequestFindUniqueArgs<ExtArgs>>): Prisma__CloseFriendRequestClient<$Result.GetResult<Prisma.$CloseFriendRequestPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one CloseFriendRequest that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CloseFriendRequestFindUniqueOrThrowArgs} args - Arguments to find a CloseFriendRequest
     * @example
     * // Get one CloseFriendRequest
     * const closeFriendRequest = await prisma.closeFriendRequest.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CloseFriendRequestFindUniqueOrThrowArgs>(args: SelectSubset<T, CloseFriendRequestFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CloseFriendRequestClient<$Result.GetResult<Prisma.$CloseFriendRequestPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CloseFriendRequest that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CloseFriendRequestFindFirstArgs} args - Arguments to find a CloseFriendRequest
     * @example
     * // Get one CloseFriendRequest
     * const closeFriendRequest = await prisma.closeFriendRequest.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CloseFriendRequestFindFirstArgs>(args?: SelectSubset<T, CloseFriendRequestFindFirstArgs<ExtArgs>>): Prisma__CloseFriendRequestClient<$Result.GetResult<Prisma.$CloseFriendRequestPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CloseFriendRequest that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CloseFriendRequestFindFirstOrThrowArgs} args - Arguments to find a CloseFriendRequest
     * @example
     * // Get one CloseFriendRequest
     * const closeFriendRequest = await prisma.closeFriendRequest.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CloseFriendRequestFindFirstOrThrowArgs>(args?: SelectSubset<T, CloseFriendRequestFindFirstOrThrowArgs<ExtArgs>>): Prisma__CloseFriendRequestClient<$Result.GetResult<Prisma.$CloseFriendRequestPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more CloseFriendRequests that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CloseFriendRequestFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CloseFriendRequests
     * const closeFriendRequests = await prisma.closeFriendRequest.findMany()
     * 
     * // Get first 10 CloseFriendRequests
     * const closeFriendRequests = await prisma.closeFriendRequest.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const closeFriendRequestWithIdOnly = await prisma.closeFriendRequest.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CloseFriendRequestFindManyArgs>(args?: SelectSubset<T, CloseFriendRequestFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CloseFriendRequestPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a CloseFriendRequest.
     * @param {CloseFriendRequestCreateArgs} args - Arguments to create a CloseFriendRequest.
     * @example
     * // Create one CloseFriendRequest
     * const CloseFriendRequest = await prisma.closeFriendRequest.create({
     *   data: {
     *     // ... data to create a CloseFriendRequest
     *   }
     * })
     * 
     */
    create<T extends CloseFriendRequestCreateArgs>(args: SelectSubset<T, CloseFriendRequestCreateArgs<ExtArgs>>): Prisma__CloseFriendRequestClient<$Result.GetResult<Prisma.$CloseFriendRequestPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many CloseFriendRequests.
     * @param {CloseFriendRequestCreateManyArgs} args - Arguments to create many CloseFriendRequests.
     * @example
     * // Create many CloseFriendRequests
     * const closeFriendRequest = await prisma.closeFriendRequest.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CloseFriendRequestCreateManyArgs>(args?: SelectSubset<T, CloseFriendRequestCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many CloseFriendRequests and returns the data saved in the database.
     * @param {CloseFriendRequestCreateManyAndReturnArgs} args - Arguments to create many CloseFriendRequests.
     * @example
     * // Create many CloseFriendRequests
     * const closeFriendRequest = await prisma.closeFriendRequest.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many CloseFriendRequests and only return the `id`
     * const closeFriendRequestWithIdOnly = await prisma.closeFriendRequest.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CloseFriendRequestCreateManyAndReturnArgs>(args?: SelectSubset<T, CloseFriendRequestCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CloseFriendRequestPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a CloseFriendRequest.
     * @param {CloseFriendRequestDeleteArgs} args - Arguments to delete one CloseFriendRequest.
     * @example
     * // Delete one CloseFriendRequest
     * const CloseFriendRequest = await prisma.closeFriendRequest.delete({
     *   where: {
     *     // ... filter to delete one CloseFriendRequest
     *   }
     * })
     * 
     */
    delete<T extends CloseFriendRequestDeleteArgs>(args: SelectSubset<T, CloseFriendRequestDeleteArgs<ExtArgs>>): Prisma__CloseFriendRequestClient<$Result.GetResult<Prisma.$CloseFriendRequestPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one CloseFriendRequest.
     * @param {CloseFriendRequestUpdateArgs} args - Arguments to update one CloseFriendRequest.
     * @example
     * // Update one CloseFriendRequest
     * const closeFriendRequest = await prisma.closeFriendRequest.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CloseFriendRequestUpdateArgs>(args: SelectSubset<T, CloseFriendRequestUpdateArgs<ExtArgs>>): Prisma__CloseFriendRequestClient<$Result.GetResult<Prisma.$CloseFriendRequestPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more CloseFriendRequests.
     * @param {CloseFriendRequestDeleteManyArgs} args - Arguments to filter CloseFriendRequests to delete.
     * @example
     * // Delete a few CloseFriendRequests
     * const { count } = await prisma.closeFriendRequest.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CloseFriendRequestDeleteManyArgs>(args?: SelectSubset<T, CloseFriendRequestDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CloseFriendRequests.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CloseFriendRequestUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CloseFriendRequests
     * const closeFriendRequest = await prisma.closeFriendRequest.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CloseFriendRequestUpdateManyArgs>(args: SelectSubset<T, CloseFriendRequestUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CloseFriendRequests and returns the data updated in the database.
     * @param {CloseFriendRequestUpdateManyAndReturnArgs} args - Arguments to update many CloseFriendRequests.
     * @example
     * // Update many CloseFriendRequests
     * const closeFriendRequest = await prisma.closeFriendRequest.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more CloseFriendRequests and only return the `id`
     * const closeFriendRequestWithIdOnly = await prisma.closeFriendRequest.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CloseFriendRequestUpdateManyAndReturnArgs>(args: SelectSubset<T, CloseFriendRequestUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CloseFriendRequestPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one CloseFriendRequest.
     * @param {CloseFriendRequestUpsertArgs} args - Arguments to update or create a CloseFriendRequest.
     * @example
     * // Update or create a CloseFriendRequest
     * const closeFriendRequest = await prisma.closeFriendRequest.upsert({
     *   create: {
     *     // ... data to create a CloseFriendRequest
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CloseFriendRequest we want to update
     *   }
     * })
     */
    upsert<T extends CloseFriendRequestUpsertArgs>(args: SelectSubset<T, CloseFriendRequestUpsertArgs<ExtArgs>>): Prisma__CloseFriendRequestClient<$Result.GetResult<Prisma.$CloseFriendRequestPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of CloseFriendRequests.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CloseFriendRequestCountArgs} args - Arguments to filter CloseFriendRequests to count.
     * @example
     * // Count the number of CloseFriendRequests
     * const count = await prisma.closeFriendRequest.count({
     *   where: {
     *     // ... the filter for the CloseFriendRequests we want to count
     *   }
     * })
    **/
    count<T extends CloseFriendRequestCountArgs>(
      args?: Subset<T, CloseFriendRequestCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CloseFriendRequestCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CloseFriendRequest.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CloseFriendRequestAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CloseFriendRequestAggregateArgs>(args: Subset<T, CloseFriendRequestAggregateArgs>): Prisma.PrismaPromise<GetCloseFriendRequestAggregateType<T>>

    /**
     * Group by CloseFriendRequest.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CloseFriendRequestGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CloseFriendRequestGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CloseFriendRequestGroupByArgs['orderBy'] }
        : { orderBy?: CloseFriendRequestGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CloseFriendRequestGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCloseFriendRequestGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CloseFriendRequest model
   */
  readonly fields: CloseFriendRequestFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CloseFriendRequest.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CloseFriendRequestClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    sender<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    receiver<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the CloseFriendRequest model
   */
  interface CloseFriendRequestFieldRefs {
    readonly id: FieldRef<"CloseFriendRequest", 'Int'>
    readonly status: FieldRef<"CloseFriendRequest", 'String'>
    readonly createdAt: FieldRef<"CloseFriendRequest", 'DateTime'>
    readonly updatedAt: FieldRef<"CloseFriendRequest", 'DateTime'>
    readonly senderId: FieldRef<"CloseFriendRequest", 'Int'>
    readonly receiverId: FieldRef<"CloseFriendRequest", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * CloseFriendRequest findUnique
   */
  export type CloseFriendRequestFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CloseFriendRequest
     */
    select?: CloseFriendRequestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CloseFriendRequest
     */
    omit?: CloseFriendRequestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CloseFriendRequestInclude<ExtArgs> | null
    /**
     * Filter, which CloseFriendRequest to fetch.
     */
    where: CloseFriendRequestWhereUniqueInput
  }

  /**
   * CloseFriendRequest findUniqueOrThrow
   */
  export type CloseFriendRequestFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CloseFriendRequest
     */
    select?: CloseFriendRequestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CloseFriendRequest
     */
    omit?: CloseFriendRequestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CloseFriendRequestInclude<ExtArgs> | null
    /**
     * Filter, which CloseFriendRequest to fetch.
     */
    where: CloseFriendRequestWhereUniqueInput
  }

  /**
   * CloseFriendRequest findFirst
   */
  export type CloseFriendRequestFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CloseFriendRequest
     */
    select?: CloseFriendRequestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CloseFriendRequest
     */
    omit?: CloseFriendRequestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CloseFriendRequestInclude<ExtArgs> | null
    /**
     * Filter, which CloseFriendRequest to fetch.
     */
    where?: CloseFriendRequestWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CloseFriendRequests to fetch.
     */
    orderBy?: CloseFriendRequestOrderByWithRelationInput | CloseFriendRequestOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CloseFriendRequests.
     */
    cursor?: CloseFriendRequestWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CloseFriendRequests from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CloseFriendRequests.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CloseFriendRequests.
     */
    distinct?: CloseFriendRequestScalarFieldEnum | CloseFriendRequestScalarFieldEnum[]
  }

  /**
   * CloseFriendRequest findFirstOrThrow
   */
  export type CloseFriendRequestFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CloseFriendRequest
     */
    select?: CloseFriendRequestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CloseFriendRequest
     */
    omit?: CloseFriendRequestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CloseFriendRequestInclude<ExtArgs> | null
    /**
     * Filter, which CloseFriendRequest to fetch.
     */
    where?: CloseFriendRequestWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CloseFriendRequests to fetch.
     */
    orderBy?: CloseFriendRequestOrderByWithRelationInput | CloseFriendRequestOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CloseFriendRequests.
     */
    cursor?: CloseFriendRequestWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CloseFriendRequests from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CloseFriendRequests.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CloseFriendRequests.
     */
    distinct?: CloseFriendRequestScalarFieldEnum | CloseFriendRequestScalarFieldEnum[]
  }

  /**
   * CloseFriendRequest findMany
   */
  export type CloseFriendRequestFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CloseFriendRequest
     */
    select?: CloseFriendRequestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CloseFriendRequest
     */
    omit?: CloseFriendRequestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CloseFriendRequestInclude<ExtArgs> | null
    /**
     * Filter, which CloseFriendRequests to fetch.
     */
    where?: CloseFriendRequestWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CloseFriendRequests to fetch.
     */
    orderBy?: CloseFriendRequestOrderByWithRelationInput | CloseFriendRequestOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing CloseFriendRequests.
     */
    cursor?: CloseFriendRequestWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CloseFriendRequests from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CloseFriendRequests.
     */
    skip?: number
    distinct?: CloseFriendRequestScalarFieldEnum | CloseFriendRequestScalarFieldEnum[]
  }

  /**
   * CloseFriendRequest create
   */
  export type CloseFriendRequestCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CloseFriendRequest
     */
    select?: CloseFriendRequestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CloseFriendRequest
     */
    omit?: CloseFriendRequestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CloseFriendRequestInclude<ExtArgs> | null
    /**
     * The data needed to create a CloseFriendRequest.
     */
    data: XOR<CloseFriendRequestCreateInput, CloseFriendRequestUncheckedCreateInput>
  }

  /**
   * CloseFriendRequest createMany
   */
  export type CloseFriendRequestCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CloseFriendRequests.
     */
    data: CloseFriendRequestCreateManyInput | CloseFriendRequestCreateManyInput[]
  }

  /**
   * CloseFriendRequest createManyAndReturn
   */
  export type CloseFriendRequestCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CloseFriendRequest
     */
    select?: CloseFriendRequestSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CloseFriendRequest
     */
    omit?: CloseFriendRequestOmit<ExtArgs> | null
    /**
     * The data used to create many CloseFriendRequests.
     */
    data: CloseFriendRequestCreateManyInput | CloseFriendRequestCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CloseFriendRequestIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * CloseFriendRequest update
   */
  export type CloseFriendRequestUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CloseFriendRequest
     */
    select?: CloseFriendRequestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CloseFriendRequest
     */
    omit?: CloseFriendRequestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CloseFriendRequestInclude<ExtArgs> | null
    /**
     * The data needed to update a CloseFriendRequest.
     */
    data: XOR<CloseFriendRequestUpdateInput, CloseFriendRequestUncheckedUpdateInput>
    /**
     * Choose, which CloseFriendRequest to update.
     */
    where: CloseFriendRequestWhereUniqueInput
  }

  /**
   * CloseFriendRequest updateMany
   */
  export type CloseFriendRequestUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CloseFriendRequests.
     */
    data: XOR<CloseFriendRequestUpdateManyMutationInput, CloseFriendRequestUncheckedUpdateManyInput>
    /**
     * Filter which CloseFriendRequests to update
     */
    where?: CloseFriendRequestWhereInput
    /**
     * Limit how many CloseFriendRequests to update.
     */
    limit?: number
  }

  /**
   * CloseFriendRequest updateManyAndReturn
   */
  export type CloseFriendRequestUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CloseFriendRequest
     */
    select?: CloseFriendRequestSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CloseFriendRequest
     */
    omit?: CloseFriendRequestOmit<ExtArgs> | null
    /**
     * The data used to update CloseFriendRequests.
     */
    data: XOR<CloseFriendRequestUpdateManyMutationInput, CloseFriendRequestUncheckedUpdateManyInput>
    /**
     * Filter which CloseFriendRequests to update
     */
    where?: CloseFriendRequestWhereInput
    /**
     * Limit how many CloseFriendRequests to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CloseFriendRequestIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * CloseFriendRequest upsert
   */
  export type CloseFriendRequestUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CloseFriendRequest
     */
    select?: CloseFriendRequestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CloseFriendRequest
     */
    omit?: CloseFriendRequestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CloseFriendRequestInclude<ExtArgs> | null
    /**
     * The filter to search for the CloseFriendRequest to update in case it exists.
     */
    where: CloseFriendRequestWhereUniqueInput
    /**
     * In case the CloseFriendRequest found by the `where` argument doesn't exist, create a new CloseFriendRequest with this data.
     */
    create: XOR<CloseFriendRequestCreateInput, CloseFriendRequestUncheckedCreateInput>
    /**
     * In case the CloseFriendRequest was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CloseFriendRequestUpdateInput, CloseFriendRequestUncheckedUpdateInput>
  }

  /**
   * CloseFriendRequest delete
   */
  export type CloseFriendRequestDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CloseFriendRequest
     */
    select?: CloseFriendRequestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CloseFriendRequest
     */
    omit?: CloseFriendRequestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CloseFriendRequestInclude<ExtArgs> | null
    /**
     * Filter which CloseFriendRequest to delete.
     */
    where: CloseFriendRequestWhereUniqueInput
  }

  /**
   * CloseFriendRequest deleteMany
   */
  export type CloseFriendRequestDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CloseFriendRequests to delete
     */
    where?: CloseFriendRequestWhereInput
    /**
     * Limit how many CloseFriendRequests to delete.
     */
    limit?: number
  }

  /**
   * CloseFriendRequest without action
   */
  export type CloseFriendRequestDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CloseFriendRequest
     */
    select?: CloseFriendRequestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CloseFriendRequest
     */
    omit?: CloseFriendRequestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CloseFriendRequestInclude<ExtArgs> | null
  }


  /**
   * Model LanguageRoom
   */

  export type AggregateLanguageRoom = {
    _count: LanguageRoomCountAggregateOutputType | null
    _avg: LanguageRoomAvgAggregateOutputType | null
    _sum: LanguageRoomSumAggregateOutputType | null
    _min: LanguageRoomMinAggregateOutputType | null
    _max: LanguageRoomMaxAggregateOutputType | null
  }

  export type LanguageRoomAvgAggregateOutputType = {
    id: number | null
    creatorId: number | null
  }

  export type LanguageRoomSumAggregateOutputType = {
    id: number | null
    creatorId: number | null
  }

  export type LanguageRoomMinAggregateOutputType = {
    id: number | null
    roomName: string | null
    topic: string | null
    language: string | null
    createdAt: Date | null
    creatorId: number | null
  }

  export type LanguageRoomMaxAggregateOutputType = {
    id: number | null
    roomName: string | null
    topic: string | null
    language: string | null
    createdAt: Date | null
    creatorId: number | null
  }

  export type LanguageRoomCountAggregateOutputType = {
    id: number
    roomName: number
    topic: number
    language: number
    createdAt: number
    creatorId: number
    _all: number
  }


  export type LanguageRoomAvgAggregateInputType = {
    id?: true
    creatorId?: true
  }

  export type LanguageRoomSumAggregateInputType = {
    id?: true
    creatorId?: true
  }

  export type LanguageRoomMinAggregateInputType = {
    id?: true
    roomName?: true
    topic?: true
    language?: true
    createdAt?: true
    creatorId?: true
  }

  export type LanguageRoomMaxAggregateInputType = {
    id?: true
    roomName?: true
    topic?: true
    language?: true
    createdAt?: true
    creatorId?: true
  }

  export type LanguageRoomCountAggregateInputType = {
    id?: true
    roomName?: true
    topic?: true
    language?: true
    createdAt?: true
    creatorId?: true
    _all?: true
  }

  export type LanguageRoomAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which LanguageRoom to aggregate.
     */
    where?: LanguageRoomWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LanguageRooms to fetch.
     */
    orderBy?: LanguageRoomOrderByWithRelationInput | LanguageRoomOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: LanguageRoomWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LanguageRooms from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LanguageRooms.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned LanguageRooms
    **/
    _count?: true | LanguageRoomCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: LanguageRoomAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: LanguageRoomSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: LanguageRoomMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: LanguageRoomMaxAggregateInputType
  }

  export type GetLanguageRoomAggregateType<T extends LanguageRoomAggregateArgs> = {
        [P in keyof T & keyof AggregateLanguageRoom]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLanguageRoom[P]>
      : GetScalarType<T[P], AggregateLanguageRoom[P]>
  }




  export type LanguageRoomGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LanguageRoomWhereInput
    orderBy?: LanguageRoomOrderByWithAggregationInput | LanguageRoomOrderByWithAggregationInput[]
    by: LanguageRoomScalarFieldEnum[] | LanguageRoomScalarFieldEnum
    having?: LanguageRoomScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: LanguageRoomCountAggregateInputType | true
    _avg?: LanguageRoomAvgAggregateInputType
    _sum?: LanguageRoomSumAggregateInputType
    _min?: LanguageRoomMinAggregateInputType
    _max?: LanguageRoomMaxAggregateInputType
  }

  export type LanguageRoomGroupByOutputType = {
    id: number
    roomName: string
    topic: string
    language: string
    createdAt: Date
    creatorId: number
    _count: LanguageRoomCountAggregateOutputType | null
    _avg: LanguageRoomAvgAggregateOutputType | null
    _sum: LanguageRoomSumAggregateOutputType | null
    _min: LanguageRoomMinAggregateOutputType | null
    _max: LanguageRoomMaxAggregateOutputType | null
  }

  type GetLanguageRoomGroupByPayload<T extends LanguageRoomGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<LanguageRoomGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof LanguageRoomGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], LanguageRoomGroupByOutputType[P]>
            : GetScalarType<T[P], LanguageRoomGroupByOutputType[P]>
        }
      >
    >


  export type LanguageRoomSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    roomName?: boolean
    topic?: boolean
    language?: boolean
    createdAt?: boolean
    creatorId?: boolean
    creator?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["languageRoom"]>

  export type LanguageRoomSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    roomName?: boolean
    topic?: boolean
    language?: boolean
    createdAt?: boolean
    creatorId?: boolean
    creator?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["languageRoom"]>

  export type LanguageRoomSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    roomName?: boolean
    topic?: boolean
    language?: boolean
    createdAt?: boolean
    creatorId?: boolean
    creator?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["languageRoom"]>

  export type LanguageRoomSelectScalar = {
    id?: boolean
    roomName?: boolean
    topic?: boolean
    language?: boolean
    createdAt?: boolean
    creatorId?: boolean
  }

  export type LanguageRoomOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "roomName" | "topic" | "language" | "createdAt" | "creatorId", ExtArgs["result"]["languageRoom"]>
  export type LanguageRoomInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    creator?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type LanguageRoomIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    creator?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type LanguageRoomIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    creator?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $LanguageRoomPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "LanguageRoom"
    objects: {
      creator: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      roomName: string
      topic: string
      language: string
      createdAt: Date
      creatorId: number
    }, ExtArgs["result"]["languageRoom"]>
    composites: {}
  }

  type LanguageRoomGetPayload<S extends boolean | null | undefined | LanguageRoomDefaultArgs> = $Result.GetResult<Prisma.$LanguageRoomPayload, S>

  type LanguageRoomCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<LanguageRoomFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: LanguageRoomCountAggregateInputType | true
    }

  export interface LanguageRoomDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['LanguageRoom'], meta: { name: 'LanguageRoom' } }
    /**
     * Find zero or one LanguageRoom that matches the filter.
     * @param {LanguageRoomFindUniqueArgs} args - Arguments to find a LanguageRoom
     * @example
     * // Get one LanguageRoom
     * const languageRoom = await prisma.languageRoom.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends LanguageRoomFindUniqueArgs>(args: SelectSubset<T, LanguageRoomFindUniqueArgs<ExtArgs>>): Prisma__LanguageRoomClient<$Result.GetResult<Prisma.$LanguageRoomPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one LanguageRoom that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {LanguageRoomFindUniqueOrThrowArgs} args - Arguments to find a LanguageRoom
     * @example
     * // Get one LanguageRoom
     * const languageRoom = await prisma.languageRoom.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends LanguageRoomFindUniqueOrThrowArgs>(args: SelectSubset<T, LanguageRoomFindUniqueOrThrowArgs<ExtArgs>>): Prisma__LanguageRoomClient<$Result.GetResult<Prisma.$LanguageRoomPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first LanguageRoom that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LanguageRoomFindFirstArgs} args - Arguments to find a LanguageRoom
     * @example
     * // Get one LanguageRoom
     * const languageRoom = await prisma.languageRoom.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends LanguageRoomFindFirstArgs>(args?: SelectSubset<T, LanguageRoomFindFirstArgs<ExtArgs>>): Prisma__LanguageRoomClient<$Result.GetResult<Prisma.$LanguageRoomPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first LanguageRoom that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LanguageRoomFindFirstOrThrowArgs} args - Arguments to find a LanguageRoom
     * @example
     * // Get one LanguageRoom
     * const languageRoom = await prisma.languageRoom.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends LanguageRoomFindFirstOrThrowArgs>(args?: SelectSubset<T, LanguageRoomFindFirstOrThrowArgs<ExtArgs>>): Prisma__LanguageRoomClient<$Result.GetResult<Prisma.$LanguageRoomPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more LanguageRooms that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LanguageRoomFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all LanguageRooms
     * const languageRooms = await prisma.languageRoom.findMany()
     * 
     * // Get first 10 LanguageRooms
     * const languageRooms = await prisma.languageRoom.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const languageRoomWithIdOnly = await prisma.languageRoom.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends LanguageRoomFindManyArgs>(args?: SelectSubset<T, LanguageRoomFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LanguageRoomPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a LanguageRoom.
     * @param {LanguageRoomCreateArgs} args - Arguments to create a LanguageRoom.
     * @example
     * // Create one LanguageRoom
     * const LanguageRoom = await prisma.languageRoom.create({
     *   data: {
     *     // ... data to create a LanguageRoom
     *   }
     * })
     * 
     */
    create<T extends LanguageRoomCreateArgs>(args: SelectSubset<T, LanguageRoomCreateArgs<ExtArgs>>): Prisma__LanguageRoomClient<$Result.GetResult<Prisma.$LanguageRoomPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many LanguageRooms.
     * @param {LanguageRoomCreateManyArgs} args - Arguments to create many LanguageRooms.
     * @example
     * // Create many LanguageRooms
     * const languageRoom = await prisma.languageRoom.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends LanguageRoomCreateManyArgs>(args?: SelectSubset<T, LanguageRoomCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many LanguageRooms and returns the data saved in the database.
     * @param {LanguageRoomCreateManyAndReturnArgs} args - Arguments to create many LanguageRooms.
     * @example
     * // Create many LanguageRooms
     * const languageRoom = await prisma.languageRoom.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many LanguageRooms and only return the `id`
     * const languageRoomWithIdOnly = await prisma.languageRoom.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends LanguageRoomCreateManyAndReturnArgs>(args?: SelectSubset<T, LanguageRoomCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LanguageRoomPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a LanguageRoom.
     * @param {LanguageRoomDeleteArgs} args - Arguments to delete one LanguageRoom.
     * @example
     * // Delete one LanguageRoom
     * const LanguageRoom = await prisma.languageRoom.delete({
     *   where: {
     *     // ... filter to delete one LanguageRoom
     *   }
     * })
     * 
     */
    delete<T extends LanguageRoomDeleteArgs>(args: SelectSubset<T, LanguageRoomDeleteArgs<ExtArgs>>): Prisma__LanguageRoomClient<$Result.GetResult<Prisma.$LanguageRoomPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one LanguageRoom.
     * @param {LanguageRoomUpdateArgs} args - Arguments to update one LanguageRoom.
     * @example
     * // Update one LanguageRoom
     * const languageRoom = await prisma.languageRoom.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends LanguageRoomUpdateArgs>(args: SelectSubset<T, LanguageRoomUpdateArgs<ExtArgs>>): Prisma__LanguageRoomClient<$Result.GetResult<Prisma.$LanguageRoomPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more LanguageRooms.
     * @param {LanguageRoomDeleteManyArgs} args - Arguments to filter LanguageRooms to delete.
     * @example
     * // Delete a few LanguageRooms
     * const { count } = await prisma.languageRoom.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends LanguageRoomDeleteManyArgs>(args?: SelectSubset<T, LanguageRoomDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more LanguageRooms.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LanguageRoomUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many LanguageRooms
     * const languageRoom = await prisma.languageRoom.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends LanguageRoomUpdateManyArgs>(args: SelectSubset<T, LanguageRoomUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more LanguageRooms and returns the data updated in the database.
     * @param {LanguageRoomUpdateManyAndReturnArgs} args - Arguments to update many LanguageRooms.
     * @example
     * // Update many LanguageRooms
     * const languageRoom = await prisma.languageRoom.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more LanguageRooms and only return the `id`
     * const languageRoomWithIdOnly = await prisma.languageRoom.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends LanguageRoomUpdateManyAndReturnArgs>(args: SelectSubset<T, LanguageRoomUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LanguageRoomPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one LanguageRoom.
     * @param {LanguageRoomUpsertArgs} args - Arguments to update or create a LanguageRoom.
     * @example
     * // Update or create a LanguageRoom
     * const languageRoom = await prisma.languageRoom.upsert({
     *   create: {
     *     // ... data to create a LanguageRoom
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the LanguageRoom we want to update
     *   }
     * })
     */
    upsert<T extends LanguageRoomUpsertArgs>(args: SelectSubset<T, LanguageRoomUpsertArgs<ExtArgs>>): Prisma__LanguageRoomClient<$Result.GetResult<Prisma.$LanguageRoomPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of LanguageRooms.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LanguageRoomCountArgs} args - Arguments to filter LanguageRooms to count.
     * @example
     * // Count the number of LanguageRooms
     * const count = await prisma.languageRoom.count({
     *   where: {
     *     // ... the filter for the LanguageRooms we want to count
     *   }
     * })
    **/
    count<T extends LanguageRoomCountArgs>(
      args?: Subset<T, LanguageRoomCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], LanguageRoomCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a LanguageRoom.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LanguageRoomAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends LanguageRoomAggregateArgs>(args: Subset<T, LanguageRoomAggregateArgs>): Prisma.PrismaPromise<GetLanguageRoomAggregateType<T>>

    /**
     * Group by LanguageRoom.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LanguageRoomGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends LanguageRoomGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: LanguageRoomGroupByArgs['orderBy'] }
        : { orderBy?: LanguageRoomGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, LanguageRoomGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLanguageRoomGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the LanguageRoom model
   */
  readonly fields: LanguageRoomFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for LanguageRoom.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__LanguageRoomClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    creator<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the LanguageRoom model
   */
  interface LanguageRoomFieldRefs {
    readonly id: FieldRef<"LanguageRoom", 'Int'>
    readonly roomName: FieldRef<"LanguageRoom", 'String'>
    readonly topic: FieldRef<"LanguageRoom", 'String'>
    readonly language: FieldRef<"LanguageRoom", 'String'>
    readonly createdAt: FieldRef<"LanguageRoom", 'DateTime'>
    readonly creatorId: FieldRef<"LanguageRoom", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * LanguageRoom findUnique
   */
  export type LanguageRoomFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LanguageRoom
     */
    select?: LanguageRoomSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LanguageRoom
     */
    omit?: LanguageRoomOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LanguageRoomInclude<ExtArgs> | null
    /**
     * Filter, which LanguageRoom to fetch.
     */
    where: LanguageRoomWhereUniqueInput
  }

  /**
   * LanguageRoom findUniqueOrThrow
   */
  export type LanguageRoomFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LanguageRoom
     */
    select?: LanguageRoomSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LanguageRoom
     */
    omit?: LanguageRoomOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LanguageRoomInclude<ExtArgs> | null
    /**
     * Filter, which LanguageRoom to fetch.
     */
    where: LanguageRoomWhereUniqueInput
  }

  /**
   * LanguageRoom findFirst
   */
  export type LanguageRoomFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LanguageRoom
     */
    select?: LanguageRoomSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LanguageRoom
     */
    omit?: LanguageRoomOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LanguageRoomInclude<ExtArgs> | null
    /**
     * Filter, which LanguageRoom to fetch.
     */
    where?: LanguageRoomWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LanguageRooms to fetch.
     */
    orderBy?: LanguageRoomOrderByWithRelationInput | LanguageRoomOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for LanguageRooms.
     */
    cursor?: LanguageRoomWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LanguageRooms from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LanguageRooms.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of LanguageRooms.
     */
    distinct?: LanguageRoomScalarFieldEnum | LanguageRoomScalarFieldEnum[]
  }

  /**
   * LanguageRoom findFirstOrThrow
   */
  export type LanguageRoomFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LanguageRoom
     */
    select?: LanguageRoomSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LanguageRoom
     */
    omit?: LanguageRoomOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LanguageRoomInclude<ExtArgs> | null
    /**
     * Filter, which LanguageRoom to fetch.
     */
    where?: LanguageRoomWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LanguageRooms to fetch.
     */
    orderBy?: LanguageRoomOrderByWithRelationInput | LanguageRoomOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for LanguageRooms.
     */
    cursor?: LanguageRoomWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LanguageRooms from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LanguageRooms.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of LanguageRooms.
     */
    distinct?: LanguageRoomScalarFieldEnum | LanguageRoomScalarFieldEnum[]
  }

  /**
   * LanguageRoom findMany
   */
  export type LanguageRoomFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LanguageRoom
     */
    select?: LanguageRoomSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LanguageRoom
     */
    omit?: LanguageRoomOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LanguageRoomInclude<ExtArgs> | null
    /**
     * Filter, which LanguageRooms to fetch.
     */
    where?: LanguageRoomWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LanguageRooms to fetch.
     */
    orderBy?: LanguageRoomOrderByWithRelationInput | LanguageRoomOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing LanguageRooms.
     */
    cursor?: LanguageRoomWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LanguageRooms from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LanguageRooms.
     */
    skip?: number
    distinct?: LanguageRoomScalarFieldEnum | LanguageRoomScalarFieldEnum[]
  }

  /**
   * LanguageRoom create
   */
  export type LanguageRoomCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LanguageRoom
     */
    select?: LanguageRoomSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LanguageRoom
     */
    omit?: LanguageRoomOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LanguageRoomInclude<ExtArgs> | null
    /**
     * The data needed to create a LanguageRoom.
     */
    data: XOR<LanguageRoomCreateInput, LanguageRoomUncheckedCreateInput>
  }

  /**
   * LanguageRoom createMany
   */
  export type LanguageRoomCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many LanguageRooms.
     */
    data: LanguageRoomCreateManyInput | LanguageRoomCreateManyInput[]
  }

  /**
   * LanguageRoom createManyAndReturn
   */
  export type LanguageRoomCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LanguageRoom
     */
    select?: LanguageRoomSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the LanguageRoom
     */
    omit?: LanguageRoomOmit<ExtArgs> | null
    /**
     * The data used to create many LanguageRooms.
     */
    data: LanguageRoomCreateManyInput | LanguageRoomCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LanguageRoomIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * LanguageRoom update
   */
  export type LanguageRoomUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LanguageRoom
     */
    select?: LanguageRoomSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LanguageRoom
     */
    omit?: LanguageRoomOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LanguageRoomInclude<ExtArgs> | null
    /**
     * The data needed to update a LanguageRoom.
     */
    data: XOR<LanguageRoomUpdateInput, LanguageRoomUncheckedUpdateInput>
    /**
     * Choose, which LanguageRoom to update.
     */
    where: LanguageRoomWhereUniqueInput
  }

  /**
   * LanguageRoom updateMany
   */
  export type LanguageRoomUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update LanguageRooms.
     */
    data: XOR<LanguageRoomUpdateManyMutationInput, LanguageRoomUncheckedUpdateManyInput>
    /**
     * Filter which LanguageRooms to update
     */
    where?: LanguageRoomWhereInput
    /**
     * Limit how many LanguageRooms to update.
     */
    limit?: number
  }

  /**
   * LanguageRoom updateManyAndReturn
   */
  export type LanguageRoomUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LanguageRoom
     */
    select?: LanguageRoomSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the LanguageRoom
     */
    omit?: LanguageRoomOmit<ExtArgs> | null
    /**
     * The data used to update LanguageRooms.
     */
    data: XOR<LanguageRoomUpdateManyMutationInput, LanguageRoomUncheckedUpdateManyInput>
    /**
     * Filter which LanguageRooms to update
     */
    where?: LanguageRoomWhereInput
    /**
     * Limit how many LanguageRooms to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LanguageRoomIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * LanguageRoom upsert
   */
  export type LanguageRoomUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LanguageRoom
     */
    select?: LanguageRoomSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LanguageRoom
     */
    omit?: LanguageRoomOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LanguageRoomInclude<ExtArgs> | null
    /**
     * The filter to search for the LanguageRoom to update in case it exists.
     */
    where: LanguageRoomWhereUniqueInput
    /**
     * In case the LanguageRoom found by the `where` argument doesn't exist, create a new LanguageRoom with this data.
     */
    create: XOR<LanguageRoomCreateInput, LanguageRoomUncheckedCreateInput>
    /**
     * In case the LanguageRoom was found with the provided `where` argument, update it with this data.
     */
    update: XOR<LanguageRoomUpdateInput, LanguageRoomUncheckedUpdateInput>
  }

  /**
   * LanguageRoom delete
   */
  export type LanguageRoomDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LanguageRoom
     */
    select?: LanguageRoomSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LanguageRoom
     */
    omit?: LanguageRoomOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LanguageRoomInclude<ExtArgs> | null
    /**
     * Filter which LanguageRoom to delete.
     */
    where: LanguageRoomWhereUniqueInput
  }

  /**
   * LanguageRoom deleteMany
   */
  export type LanguageRoomDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which LanguageRooms to delete
     */
    where?: LanguageRoomWhereInput
    /**
     * Limit how many LanguageRooms to delete.
     */
    limit?: number
  }

  /**
   * LanguageRoom without action
   */
  export type LanguageRoomDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LanguageRoom
     */
    select?: LanguageRoomSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LanguageRoom
     */
    omit?: LanguageRoomOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LanguageRoomInclude<ExtArgs> | null
  }


  /**
   * Model Group
   */

  export type AggregateGroup = {
    _count: GroupCountAggregateOutputType | null
    _avg: GroupAvgAggregateOutputType | null
    _sum: GroupSumAggregateOutputType | null
    _min: GroupMinAggregateOutputType | null
    _max: GroupMaxAggregateOutputType | null
  }

  export type GroupAvgAggregateOutputType = {
    id: number | null
    creatorId: number | null
  }

  export type GroupSumAggregateOutputType = {
    id: number | null
    creatorId: number | null
  }

  export type GroupMinAggregateOutputType = {
    id: number | null
    name: string | null
    description: string | null
    isPrivate: boolean | null
    entryKey: string | null
    createdAt: Date | null
    creatorId: number | null
  }

  export type GroupMaxAggregateOutputType = {
    id: number | null
    name: string | null
    description: string | null
    isPrivate: boolean | null
    entryKey: string | null
    createdAt: Date | null
    creatorId: number | null
  }

  export type GroupCountAggregateOutputType = {
    id: number
    name: number
    description: number
    isPrivate: number
    entryKey: number
    createdAt: number
    creatorId: number
    _all: number
  }


  export type GroupAvgAggregateInputType = {
    id?: true
    creatorId?: true
  }

  export type GroupSumAggregateInputType = {
    id?: true
    creatorId?: true
  }

  export type GroupMinAggregateInputType = {
    id?: true
    name?: true
    description?: true
    isPrivate?: true
    entryKey?: true
    createdAt?: true
    creatorId?: true
  }

  export type GroupMaxAggregateInputType = {
    id?: true
    name?: true
    description?: true
    isPrivate?: true
    entryKey?: true
    createdAt?: true
    creatorId?: true
  }

  export type GroupCountAggregateInputType = {
    id?: true
    name?: true
    description?: true
    isPrivate?: true
    entryKey?: true
    createdAt?: true
    creatorId?: true
    _all?: true
  }

  export type GroupAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Group to aggregate.
     */
    where?: GroupWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Groups to fetch.
     */
    orderBy?: GroupOrderByWithRelationInput | GroupOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: GroupWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Groups from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Groups.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Groups
    **/
    _count?: true | GroupCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: GroupAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: GroupSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: GroupMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: GroupMaxAggregateInputType
  }

  export type GetGroupAggregateType<T extends GroupAggregateArgs> = {
        [P in keyof T & keyof AggregateGroup]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateGroup[P]>
      : GetScalarType<T[P], AggregateGroup[P]>
  }




  export type GroupGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: GroupWhereInput
    orderBy?: GroupOrderByWithAggregationInput | GroupOrderByWithAggregationInput[]
    by: GroupScalarFieldEnum[] | GroupScalarFieldEnum
    having?: GroupScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: GroupCountAggregateInputType | true
    _avg?: GroupAvgAggregateInputType
    _sum?: GroupSumAggregateInputType
    _min?: GroupMinAggregateInputType
    _max?: GroupMaxAggregateInputType
  }

  export type GroupGroupByOutputType = {
    id: number
    name: string
    description: string | null
    isPrivate: boolean
    entryKey: string | null
    createdAt: Date
    creatorId: number
    _count: GroupCountAggregateOutputType | null
    _avg: GroupAvgAggregateOutputType | null
    _sum: GroupSumAggregateOutputType | null
    _min: GroupMinAggregateOutputType | null
    _max: GroupMaxAggregateOutputType | null
  }

  type GetGroupGroupByPayload<T extends GroupGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<GroupGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof GroupGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], GroupGroupByOutputType[P]>
            : GetScalarType<T[P], GroupGroupByOutputType[P]>
        }
      >
    >


  export type GroupSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    description?: boolean
    isPrivate?: boolean
    entryKey?: boolean
    createdAt?: boolean
    creatorId?: boolean
    creator?: boolean | UserDefaultArgs<ExtArgs>
    members?: boolean | Group$membersArgs<ExtArgs>
    messages?: boolean | Group$messagesArgs<ExtArgs>
    _count?: boolean | GroupCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["group"]>

  export type GroupSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    description?: boolean
    isPrivate?: boolean
    entryKey?: boolean
    createdAt?: boolean
    creatorId?: boolean
    creator?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["group"]>

  export type GroupSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    description?: boolean
    isPrivate?: boolean
    entryKey?: boolean
    createdAt?: boolean
    creatorId?: boolean
    creator?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["group"]>

  export type GroupSelectScalar = {
    id?: boolean
    name?: boolean
    description?: boolean
    isPrivate?: boolean
    entryKey?: boolean
    createdAt?: boolean
    creatorId?: boolean
  }

  export type GroupOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "description" | "isPrivate" | "entryKey" | "createdAt" | "creatorId", ExtArgs["result"]["group"]>
  export type GroupInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    creator?: boolean | UserDefaultArgs<ExtArgs>
    members?: boolean | Group$membersArgs<ExtArgs>
    messages?: boolean | Group$messagesArgs<ExtArgs>
    _count?: boolean | GroupCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type GroupIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    creator?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type GroupIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    creator?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $GroupPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Group"
    objects: {
      creator: Prisma.$UserPayload<ExtArgs>
      members: Prisma.$GroupMemberPayload<ExtArgs>[]
      messages: Prisma.$GroupMessagePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      name: string
      description: string | null
      isPrivate: boolean
      entryKey: string | null
      createdAt: Date
      creatorId: number
    }, ExtArgs["result"]["group"]>
    composites: {}
  }

  type GroupGetPayload<S extends boolean | null | undefined | GroupDefaultArgs> = $Result.GetResult<Prisma.$GroupPayload, S>

  type GroupCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<GroupFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: GroupCountAggregateInputType | true
    }

  export interface GroupDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Group'], meta: { name: 'Group' } }
    /**
     * Find zero or one Group that matches the filter.
     * @param {GroupFindUniqueArgs} args - Arguments to find a Group
     * @example
     * // Get one Group
     * const group = await prisma.group.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends GroupFindUniqueArgs>(args: SelectSubset<T, GroupFindUniqueArgs<ExtArgs>>): Prisma__GroupClient<$Result.GetResult<Prisma.$GroupPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Group that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {GroupFindUniqueOrThrowArgs} args - Arguments to find a Group
     * @example
     * // Get one Group
     * const group = await prisma.group.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends GroupFindUniqueOrThrowArgs>(args: SelectSubset<T, GroupFindUniqueOrThrowArgs<ExtArgs>>): Prisma__GroupClient<$Result.GetResult<Prisma.$GroupPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Group that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GroupFindFirstArgs} args - Arguments to find a Group
     * @example
     * // Get one Group
     * const group = await prisma.group.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends GroupFindFirstArgs>(args?: SelectSubset<T, GroupFindFirstArgs<ExtArgs>>): Prisma__GroupClient<$Result.GetResult<Prisma.$GroupPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Group that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GroupFindFirstOrThrowArgs} args - Arguments to find a Group
     * @example
     * // Get one Group
     * const group = await prisma.group.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends GroupFindFirstOrThrowArgs>(args?: SelectSubset<T, GroupFindFirstOrThrowArgs<ExtArgs>>): Prisma__GroupClient<$Result.GetResult<Prisma.$GroupPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Groups that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GroupFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Groups
     * const groups = await prisma.group.findMany()
     * 
     * // Get first 10 Groups
     * const groups = await prisma.group.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const groupWithIdOnly = await prisma.group.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends GroupFindManyArgs>(args?: SelectSubset<T, GroupFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GroupPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Group.
     * @param {GroupCreateArgs} args - Arguments to create a Group.
     * @example
     * // Create one Group
     * const Group = await prisma.group.create({
     *   data: {
     *     // ... data to create a Group
     *   }
     * })
     * 
     */
    create<T extends GroupCreateArgs>(args: SelectSubset<T, GroupCreateArgs<ExtArgs>>): Prisma__GroupClient<$Result.GetResult<Prisma.$GroupPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Groups.
     * @param {GroupCreateManyArgs} args - Arguments to create many Groups.
     * @example
     * // Create many Groups
     * const group = await prisma.group.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends GroupCreateManyArgs>(args?: SelectSubset<T, GroupCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Groups and returns the data saved in the database.
     * @param {GroupCreateManyAndReturnArgs} args - Arguments to create many Groups.
     * @example
     * // Create many Groups
     * const group = await prisma.group.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Groups and only return the `id`
     * const groupWithIdOnly = await prisma.group.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends GroupCreateManyAndReturnArgs>(args?: SelectSubset<T, GroupCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GroupPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Group.
     * @param {GroupDeleteArgs} args - Arguments to delete one Group.
     * @example
     * // Delete one Group
     * const Group = await prisma.group.delete({
     *   where: {
     *     // ... filter to delete one Group
     *   }
     * })
     * 
     */
    delete<T extends GroupDeleteArgs>(args: SelectSubset<T, GroupDeleteArgs<ExtArgs>>): Prisma__GroupClient<$Result.GetResult<Prisma.$GroupPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Group.
     * @param {GroupUpdateArgs} args - Arguments to update one Group.
     * @example
     * // Update one Group
     * const group = await prisma.group.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends GroupUpdateArgs>(args: SelectSubset<T, GroupUpdateArgs<ExtArgs>>): Prisma__GroupClient<$Result.GetResult<Prisma.$GroupPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Groups.
     * @param {GroupDeleteManyArgs} args - Arguments to filter Groups to delete.
     * @example
     * // Delete a few Groups
     * const { count } = await prisma.group.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends GroupDeleteManyArgs>(args?: SelectSubset<T, GroupDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Groups.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GroupUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Groups
     * const group = await prisma.group.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends GroupUpdateManyArgs>(args: SelectSubset<T, GroupUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Groups and returns the data updated in the database.
     * @param {GroupUpdateManyAndReturnArgs} args - Arguments to update many Groups.
     * @example
     * // Update many Groups
     * const group = await prisma.group.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Groups and only return the `id`
     * const groupWithIdOnly = await prisma.group.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends GroupUpdateManyAndReturnArgs>(args: SelectSubset<T, GroupUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GroupPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Group.
     * @param {GroupUpsertArgs} args - Arguments to update or create a Group.
     * @example
     * // Update or create a Group
     * const group = await prisma.group.upsert({
     *   create: {
     *     // ... data to create a Group
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Group we want to update
     *   }
     * })
     */
    upsert<T extends GroupUpsertArgs>(args: SelectSubset<T, GroupUpsertArgs<ExtArgs>>): Prisma__GroupClient<$Result.GetResult<Prisma.$GroupPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Groups.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GroupCountArgs} args - Arguments to filter Groups to count.
     * @example
     * // Count the number of Groups
     * const count = await prisma.group.count({
     *   where: {
     *     // ... the filter for the Groups we want to count
     *   }
     * })
    **/
    count<T extends GroupCountArgs>(
      args?: Subset<T, GroupCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], GroupCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Group.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GroupAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends GroupAggregateArgs>(args: Subset<T, GroupAggregateArgs>): Prisma.PrismaPromise<GetGroupAggregateType<T>>

    /**
     * Group by Group.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GroupGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends GroupGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: GroupGroupByArgs['orderBy'] }
        : { orderBy?: GroupGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, GroupGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetGroupGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Group model
   */
  readonly fields: GroupFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Group.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__GroupClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    creator<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    members<T extends Group$membersArgs<ExtArgs> = {}>(args?: Subset<T, Group$membersArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GroupMemberPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    messages<T extends Group$messagesArgs<ExtArgs> = {}>(args?: Subset<T, Group$messagesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GroupMessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Group model
   */
  interface GroupFieldRefs {
    readonly id: FieldRef<"Group", 'Int'>
    readonly name: FieldRef<"Group", 'String'>
    readonly description: FieldRef<"Group", 'String'>
    readonly isPrivate: FieldRef<"Group", 'Boolean'>
    readonly entryKey: FieldRef<"Group", 'String'>
    readonly createdAt: FieldRef<"Group", 'DateTime'>
    readonly creatorId: FieldRef<"Group", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * Group findUnique
   */
  export type GroupFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Group
     */
    select?: GroupSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Group
     */
    omit?: GroupOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupInclude<ExtArgs> | null
    /**
     * Filter, which Group to fetch.
     */
    where: GroupWhereUniqueInput
  }

  /**
   * Group findUniqueOrThrow
   */
  export type GroupFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Group
     */
    select?: GroupSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Group
     */
    omit?: GroupOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupInclude<ExtArgs> | null
    /**
     * Filter, which Group to fetch.
     */
    where: GroupWhereUniqueInput
  }

  /**
   * Group findFirst
   */
  export type GroupFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Group
     */
    select?: GroupSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Group
     */
    omit?: GroupOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupInclude<ExtArgs> | null
    /**
     * Filter, which Group to fetch.
     */
    where?: GroupWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Groups to fetch.
     */
    orderBy?: GroupOrderByWithRelationInput | GroupOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Groups.
     */
    cursor?: GroupWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Groups from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Groups.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Groups.
     */
    distinct?: GroupScalarFieldEnum | GroupScalarFieldEnum[]
  }

  /**
   * Group findFirstOrThrow
   */
  export type GroupFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Group
     */
    select?: GroupSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Group
     */
    omit?: GroupOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupInclude<ExtArgs> | null
    /**
     * Filter, which Group to fetch.
     */
    where?: GroupWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Groups to fetch.
     */
    orderBy?: GroupOrderByWithRelationInput | GroupOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Groups.
     */
    cursor?: GroupWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Groups from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Groups.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Groups.
     */
    distinct?: GroupScalarFieldEnum | GroupScalarFieldEnum[]
  }

  /**
   * Group findMany
   */
  export type GroupFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Group
     */
    select?: GroupSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Group
     */
    omit?: GroupOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupInclude<ExtArgs> | null
    /**
     * Filter, which Groups to fetch.
     */
    where?: GroupWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Groups to fetch.
     */
    orderBy?: GroupOrderByWithRelationInput | GroupOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Groups.
     */
    cursor?: GroupWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Groups from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Groups.
     */
    skip?: number
    distinct?: GroupScalarFieldEnum | GroupScalarFieldEnum[]
  }

  /**
   * Group create
   */
  export type GroupCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Group
     */
    select?: GroupSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Group
     */
    omit?: GroupOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupInclude<ExtArgs> | null
    /**
     * The data needed to create a Group.
     */
    data: XOR<GroupCreateInput, GroupUncheckedCreateInput>
  }

  /**
   * Group createMany
   */
  export type GroupCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Groups.
     */
    data: GroupCreateManyInput | GroupCreateManyInput[]
  }

  /**
   * Group createManyAndReturn
   */
  export type GroupCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Group
     */
    select?: GroupSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Group
     */
    omit?: GroupOmit<ExtArgs> | null
    /**
     * The data used to create many Groups.
     */
    data: GroupCreateManyInput | GroupCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Group update
   */
  export type GroupUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Group
     */
    select?: GroupSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Group
     */
    omit?: GroupOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupInclude<ExtArgs> | null
    /**
     * The data needed to update a Group.
     */
    data: XOR<GroupUpdateInput, GroupUncheckedUpdateInput>
    /**
     * Choose, which Group to update.
     */
    where: GroupWhereUniqueInput
  }

  /**
   * Group updateMany
   */
  export type GroupUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Groups.
     */
    data: XOR<GroupUpdateManyMutationInput, GroupUncheckedUpdateManyInput>
    /**
     * Filter which Groups to update
     */
    where?: GroupWhereInput
    /**
     * Limit how many Groups to update.
     */
    limit?: number
  }

  /**
   * Group updateManyAndReturn
   */
  export type GroupUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Group
     */
    select?: GroupSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Group
     */
    omit?: GroupOmit<ExtArgs> | null
    /**
     * The data used to update Groups.
     */
    data: XOR<GroupUpdateManyMutationInput, GroupUncheckedUpdateManyInput>
    /**
     * Filter which Groups to update
     */
    where?: GroupWhereInput
    /**
     * Limit how many Groups to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Group upsert
   */
  export type GroupUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Group
     */
    select?: GroupSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Group
     */
    omit?: GroupOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupInclude<ExtArgs> | null
    /**
     * The filter to search for the Group to update in case it exists.
     */
    where: GroupWhereUniqueInput
    /**
     * In case the Group found by the `where` argument doesn't exist, create a new Group with this data.
     */
    create: XOR<GroupCreateInput, GroupUncheckedCreateInput>
    /**
     * In case the Group was found with the provided `where` argument, update it with this data.
     */
    update: XOR<GroupUpdateInput, GroupUncheckedUpdateInput>
  }

  /**
   * Group delete
   */
  export type GroupDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Group
     */
    select?: GroupSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Group
     */
    omit?: GroupOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupInclude<ExtArgs> | null
    /**
     * Filter which Group to delete.
     */
    where: GroupWhereUniqueInput
  }

  /**
   * Group deleteMany
   */
  export type GroupDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Groups to delete
     */
    where?: GroupWhereInput
    /**
     * Limit how many Groups to delete.
     */
    limit?: number
  }

  /**
   * Group.members
   */
  export type Group$membersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GroupMember
     */
    select?: GroupMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GroupMember
     */
    omit?: GroupMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupMemberInclude<ExtArgs> | null
    where?: GroupMemberWhereInput
    orderBy?: GroupMemberOrderByWithRelationInput | GroupMemberOrderByWithRelationInput[]
    cursor?: GroupMemberWhereUniqueInput
    take?: number
    skip?: number
    distinct?: GroupMemberScalarFieldEnum | GroupMemberScalarFieldEnum[]
  }

  /**
   * Group.messages
   */
  export type Group$messagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GroupMessage
     */
    select?: GroupMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GroupMessage
     */
    omit?: GroupMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupMessageInclude<ExtArgs> | null
    where?: GroupMessageWhereInput
    orderBy?: GroupMessageOrderByWithRelationInput | GroupMessageOrderByWithRelationInput[]
    cursor?: GroupMessageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: GroupMessageScalarFieldEnum | GroupMessageScalarFieldEnum[]
  }

  /**
   * Group without action
   */
  export type GroupDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Group
     */
    select?: GroupSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Group
     */
    omit?: GroupOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupInclude<ExtArgs> | null
  }


  /**
   * Model GroupMember
   */

  export type AggregateGroupMember = {
    _count: GroupMemberCountAggregateOutputType | null
    _avg: GroupMemberAvgAggregateOutputType | null
    _sum: GroupMemberSumAggregateOutputType | null
    _min: GroupMemberMinAggregateOutputType | null
    _max: GroupMemberMaxAggregateOutputType | null
  }

  export type GroupMemberAvgAggregateOutputType = {
    id: number | null
    groupId: number | null
    userId: number | null
  }

  export type GroupMemberSumAggregateOutputType = {
    id: number | null
    groupId: number | null
    userId: number | null
  }

  export type GroupMemberMinAggregateOutputType = {
    id: number | null
    joinedAt: Date | null
    groupId: number | null
    userId: number | null
  }

  export type GroupMemberMaxAggregateOutputType = {
    id: number | null
    joinedAt: Date | null
    groupId: number | null
    userId: number | null
  }

  export type GroupMemberCountAggregateOutputType = {
    id: number
    joinedAt: number
    groupId: number
    userId: number
    _all: number
  }


  export type GroupMemberAvgAggregateInputType = {
    id?: true
    groupId?: true
    userId?: true
  }

  export type GroupMemberSumAggregateInputType = {
    id?: true
    groupId?: true
    userId?: true
  }

  export type GroupMemberMinAggregateInputType = {
    id?: true
    joinedAt?: true
    groupId?: true
    userId?: true
  }

  export type GroupMemberMaxAggregateInputType = {
    id?: true
    joinedAt?: true
    groupId?: true
    userId?: true
  }

  export type GroupMemberCountAggregateInputType = {
    id?: true
    joinedAt?: true
    groupId?: true
    userId?: true
    _all?: true
  }

  export type GroupMemberAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which GroupMember to aggregate.
     */
    where?: GroupMemberWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GroupMembers to fetch.
     */
    orderBy?: GroupMemberOrderByWithRelationInput | GroupMemberOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: GroupMemberWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GroupMembers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GroupMembers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned GroupMembers
    **/
    _count?: true | GroupMemberCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: GroupMemberAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: GroupMemberSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: GroupMemberMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: GroupMemberMaxAggregateInputType
  }

  export type GetGroupMemberAggregateType<T extends GroupMemberAggregateArgs> = {
        [P in keyof T & keyof AggregateGroupMember]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateGroupMember[P]>
      : GetScalarType<T[P], AggregateGroupMember[P]>
  }




  export type GroupMemberGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: GroupMemberWhereInput
    orderBy?: GroupMemberOrderByWithAggregationInput | GroupMemberOrderByWithAggregationInput[]
    by: GroupMemberScalarFieldEnum[] | GroupMemberScalarFieldEnum
    having?: GroupMemberScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: GroupMemberCountAggregateInputType | true
    _avg?: GroupMemberAvgAggregateInputType
    _sum?: GroupMemberSumAggregateInputType
    _min?: GroupMemberMinAggregateInputType
    _max?: GroupMemberMaxAggregateInputType
  }

  export type GroupMemberGroupByOutputType = {
    id: number
    joinedAt: Date
    groupId: number
    userId: number
    _count: GroupMemberCountAggregateOutputType | null
    _avg: GroupMemberAvgAggregateOutputType | null
    _sum: GroupMemberSumAggregateOutputType | null
    _min: GroupMemberMinAggregateOutputType | null
    _max: GroupMemberMaxAggregateOutputType | null
  }

  type GetGroupMemberGroupByPayload<T extends GroupMemberGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<GroupMemberGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof GroupMemberGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], GroupMemberGroupByOutputType[P]>
            : GetScalarType<T[P], GroupMemberGroupByOutputType[P]>
        }
      >
    >


  export type GroupMemberSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    joinedAt?: boolean
    groupId?: boolean
    userId?: boolean
    group?: boolean | GroupDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["groupMember"]>

  export type GroupMemberSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    joinedAt?: boolean
    groupId?: boolean
    userId?: boolean
    group?: boolean | GroupDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["groupMember"]>

  export type GroupMemberSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    joinedAt?: boolean
    groupId?: boolean
    userId?: boolean
    group?: boolean | GroupDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["groupMember"]>

  export type GroupMemberSelectScalar = {
    id?: boolean
    joinedAt?: boolean
    groupId?: boolean
    userId?: boolean
  }

  export type GroupMemberOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "joinedAt" | "groupId" | "userId", ExtArgs["result"]["groupMember"]>
  export type GroupMemberInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    group?: boolean | GroupDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type GroupMemberIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    group?: boolean | GroupDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type GroupMemberIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    group?: boolean | GroupDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $GroupMemberPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "GroupMember"
    objects: {
      group: Prisma.$GroupPayload<ExtArgs>
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      joinedAt: Date
      groupId: number
      userId: number
    }, ExtArgs["result"]["groupMember"]>
    composites: {}
  }

  type GroupMemberGetPayload<S extends boolean | null | undefined | GroupMemberDefaultArgs> = $Result.GetResult<Prisma.$GroupMemberPayload, S>

  type GroupMemberCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<GroupMemberFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: GroupMemberCountAggregateInputType | true
    }

  export interface GroupMemberDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['GroupMember'], meta: { name: 'GroupMember' } }
    /**
     * Find zero or one GroupMember that matches the filter.
     * @param {GroupMemberFindUniqueArgs} args - Arguments to find a GroupMember
     * @example
     * // Get one GroupMember
     * const groupMember = await prisma.groupMember.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends GroupMemberFindUniqueArgs>(args: SelectSubset<T, GroupMemberFindUniqueArgs<ExtArgs>>): Prisma__GroupMemberClient<$Result.GetResult<Prisma.$GroupMemberPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one GroupMember that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {GroupMemberFindUniqueOrThrowArgs} args - Arguments to find a GroupMember
     * @example
     * // Get one GroupMember
     * const groupMember = await prisma.groupMember.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends GroupMemberFindUniqueOrThrowArgs>(args: SelectSubset<T, GroupMemberFindUniqueOrThrowArgs<ExtArgs>>): Prisma__GroupMemberClient<$Result.GetResult<Prisma.$GroupMemberPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first GroupMember that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GroupMemberFindFirstArgs} args - Arguments to find a GroupMember
     * @example
     * // Get one GroupMember
     * const groupMember = await prisma.groupMember.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends GroupMemberFindFirstArgs>(args?: SelectSubset<T, GroupMemberFindFirstArgs<ExtArgs>>): Prisma__GroupMemberClient<$Result.GetResult<Prisma.$GroupMemberPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first GroupMember that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GroupMemberFindFirstOrThrowArgs} args - Arguments to find a GroupMember
     * @example
     * // Get one GroupMember
     * const groupMember = await prisma.groupMember.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends GroupMemberFindFirstOrThrowArgs>(args?: SelectSubset<T, GroupMemberFindFirstOrThrowArgs<ExtArgs>>): Prisma__GroupMemberClient<$Result.GetResult<Prisma.$GroupMemberPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more GroupMembers that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GroupMemberFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all GroupMembers
     * const groupMembers = await prisma.groupMember.findMany()
     * 
     * // Get first 10 GroupMembers
     * const groupMembers = await prisma.groupMember.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const groupMemberWithIdOnly = await prisma.groupMember.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends GroupMemberFindManyArgs>(args?: SelectSubset<T, GroupMemberFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GroupMemberPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a GroupMember.
     * @param {GroupMemberCreateArgs} args - Arguments to create a GroupMember.
     * @example
     * // Create one GroupMember
     * const GroupMember = await prisma.groupMember.create({
     *   data: {
     *     // ... data to create a GroupMember
     *   }
     * })
     * 
     */
    create<T extends GroupMemberCreateArgs>(args: SelectSubset<T, GroupMemberCreateArgs<ExtArgs>>): Prisma__GroupMemberClient<$Result.GetResult<Prisma.$GroupMemberPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many GroupMembers.
     * @param {GroupMemberCreateManyArgs} args - Arguments to create many GroupMembers.
     * @example
     * // Create many GroupMembers
     * const groupMember = await prisma.groupMember.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends GroupMemberCreateManyArgs>(args?: SelectSubset<T, GroupMemberCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many GroupMembers and returns the data saved in the database.
     * @param {GroupMemberCreateManyAndReturnArgs} args - Arguments to create many GroupMembers.
     * @example
     * // Create many GroupMembers
     * const groupMember = await prisma.groupMember.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many GroupMembers and only return the `id`
     * const groupMemberWithIdOnly = await prisma.groupMember.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends GroupMemberCreateManyAndReturnArgs>(args?: SelectSubset<T, GroupMemberCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GroupMemberPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a GroupMember.
     * @param {GroupMemberDeleteArgs} args - Arguments to delete one GroupMember.
     * @example
     * // Delete one GroupMember
     * const GroupMember = await prisma.groupMember.delete({
     *   where: {
     *     // ... filter to delete one GroupMember
     *   }
     * })
     * 
     */
    delete<T extends GroupMemberDeleteArgs>(args: SelectSubset<T, GroupMemberDeleteArgs<ExtArgs>>): Prisma__GroupMemberClient<$Result.GetResult<Prisma.$GroupMemberPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one GroupMember.
     * @param {GroupMemberUpdateArgs} args - Arguments to update one GroupMember.
     * @example
     * // Update one GroupMember
     * const groupMember = await prisma.groupMember.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends GroupMemberUpdateArgs>(args: SelectSubset<T, GroupMemberUpdateArgs<ExtArgs>>): Prisma__GroupMemberClient<$Result.GetResult<Prisma.$GroupMemberPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more GroupMembers.
     * @param {GroupMemberDeleteManyArgs} args - Arguments to filter GroupMembers to delete.
     * @example
     * // Delete a few GroupMembers
     * const { count } = await prisma.groupMember.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends GroupMemberDeleteManyArgs>(args?: SelectSubset<T, GroupMemberDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more GroupMembers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GroupMemberUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many GroupMembers
     * const groupMember = await prisma.groupMember.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends GroupMemberUpdateManyArgs>(args: SelectSubset<T, GroupMemberUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more GroupMembers and returns the data updated in the database.
     * @param {GroupMemberUpdateManyAndReturnArgs} args - Arguments to update many GroupMembers.
     * @example
     * // Update many GroupMembers
     * const groupMember = await prisma.groupMember.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more GroupMembers and only return the `id`
     * const groupMemberWithIdOnly = await prisma.groupMember.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends GroupMemberUpdateManyAndReturnArgs>(args: SelectSubset<T, GroupMemberUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GroupMemberPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one GroupMember.
     * @param {GroupMemberUpsertArgs} args - Arguments to update or create a GroupMember.
     * @example
     * // Update or create a GroupMember
     * const groupMember = await prisma.groupMember.upsert({
     *   create: {
     *     // ... data to create a GroupMember
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the GroupMember we want to update
     *   }
     * })
     */
    upsert<T extends GroupMemberUpsertArgs>(args: SelectSubset<T, GroupMemberUpsertArgs<ExtArgs>>): Prisma__GroupMemberClient<$Result.GetResult<Prisma.$GroupMemberPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of GroupMembers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GroupMemberCountArgs} args - Arguments to filter GroupMembers to count.
     * @example
     * // Count the number of GroupMembers
     * const count = await prisma.groupMember.count({
     *   where: {
     *     // ... the filter for the GroupMembers we want to count
     *   }
     * })
    **/
    count<T extends GroupMemberCountArgs>(
      args?: Subset<T, GroupMemberCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], GroupMemberCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a GroupMember.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GroupMemberAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends GroupMemberAggregateArgs>(args: Subset<T, GroupMemberAggregateArgs>): Prisma.PrismaPromise<GetGroupMemberAggregateType<T>>

    /**
     * Group by GroupMember.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GroupMemberGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends GroupMemberGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: GroupMemberGroupByArgs['orderBy'] }
        : { orderBy?: GroupMemberGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, GroupMemberGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetGroupMemberGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the GroupMember model
   */
  readonly fields: GroupMemberFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for GroupMember.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__GroupMemberClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    group<T extends GroupDefaultArgs<ExtArgs> = {}>(args?: Subset<T, GroupDefaultArgs<ExtArgs>>): Prisma__GroupClient<$Result.GetResult<Prisma.$GroupPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the GroupMember model
   */
  interface GroupMemberFieldRefs {
    readonly id: FieldRef<"GroupMember", 'Int'>
    readonly joinedAt: FieldRef<"GroupMember", 'DateTime'>
    readonly groupId: FieldRef<"GroupMember", 'Int'>
    readonly userId: FieldRef<"GroupMember", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * GroupMember findUnique
   */
  export type GroupMemberFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GroupMember
     */
    select?: GroupMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GroupMember
     */
    omit?: GroupMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupMemberInclude<ExtArgs> | null
    /**
     * Filter, which GroupMember to fetch.
     */
    where: GroupMemberWhereUniqueInput
  }

  /**
   * GroupMember findUniqueOrThrow
   */
  export type GroupMemberFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GroupMember
     */
    select?: GroupMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GroupMember
     */
    omit?: GroupMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupMemberInclude<ExtArgs> | null
    /**
     * Filter, which GroupMember to fetch.
     */
    where: GroupMemberWhereUniqueInput
  }

  /**
   * GroupMember findFirst
   */
  export type GroupMemberFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GroupMember
     */
    select?: GroupMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GroupMember
     */
    omit?: GroupMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupMemberInclude<ExtArgs> | null
    /**
     * Filter, which GroupMember to fetch.
     */
    where?: GroupMemberWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GroupMembers to fetch.
     */
    orderBy?: GroupMemberOrderByWithRelationInput | GroupMemberOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for GroupMembers.
     */
    cursor?: GroupMemberWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GroupMembers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GroupMembers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of GroupMembers.
     */
    distinct?: GroupMemberScalarFieldEnum | GroupMemberScalarFieldEnum[]
  }

  /**
   * GroupMember findFirstOrThrow
   */
  export type GroupMemberFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GroupMember
     */
    select?: GroupMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GroupMember
     */
    omit?: GroupMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupMemberInclude<ExtArgs> | null
    /**
     * Filter, which GroupMember to fetch.
     */
    where?: GroupMemberWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GroupMembers to fetch.
     */
    orderBy?: GroupMemberOrderByWithRelationInput | GroupMemberOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for GroupMembers.
     */
    cursor?: GroupMemberWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GroupMembers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GroupMembers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of GroupMembers.
     */
    distinct?: GroupMemberScalarFieldEnum | GroupMemberScalarFieldEnum[]
  }

  /**
   * GroupMember findMany
   */
  export type GroupMemberFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GroupMember
     */
    select?: GroupMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GroupMember
     */
    omit?: GroupMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupMemberInclude<ExtArgs> | null
    /**
     * Filter, which GroupMembers to fetch.
     */
    where?: GroupMemberWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GroupMembers to fetch.
     */
    orderBy?: GroupMemberOrderByWithRelationInput | GroupMemberOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing GroupMembers.
     */
    cursor?: GroupMemberWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GroupMembers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GroupMembers.
     */
    skip?: number
    distinct?: GroupMemberScalarFieldEnum | GroupMemberScalarFieldEnum[]
  }

  /**
   * GroupMember create
   */
  export type GroupMemberCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GroupMember
     */
    select?: GroupMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GroupMember
     */
    omit?: GroupMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupMemberInclude<ExtArgs> | null
    /**
     * The data needed to create a GroupMember.
     */
    data: XOR<GroupMemberCreateInput, GroupMemberUncheckedCreateInput>
  }

  /**
   * GroupMember createMany
   */
  export type GroupMemberCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many GroupMembers.
     */
    data: GroupMemberCreateManyInput | GroupMemberCreateManyInput[]
  }

  /**
   * GroupMember createManyAndReturn
   */
  export type GroupMemberCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GroupMember
     */
    select?: GroupMemberSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the GroupMember
     */
    omit?: GroupMemberOmit<ExtArgs> | null
    /**
     * The data used to create many GroupMembers.
     */
    data: GroupMemberCreateManyInput | GroupMemberCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupMemberIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * GroupMember update
   */
  export type GroupMemberUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GroupMember
     */
    select?: GroupMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GroupMember
     */
    omit?: GroupMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupMemberInclude<ExtArgs> | null
    /**
     * The data needed to update a GroupMember.
     */
    data: XOR<GroupMemberUpdateInput, GroupMemberUncheckedUpdateInput>
    /**
     * Choose, which GroupMember to update.
     */
    where: GroupMemberWhereUniqueInput
  }

  /**
   * GroupMember updateMany
   */
  export type GroupMemberUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update GroupMembers.
     */
    data: XOR<GroupMemberUpdateManyMutationInput, GroupMemberUncheckedUpdateManyInput>
    /**
     * Filter which GroupMembers to update
     */
    where?: GroupMemberWhereInput
    /**
     * Limit how many GroupMembers to update.
     */
    limit?: number
  }

  /**
   * GroupMember updateManyAndReturn
   */
  export type GroupMemberUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GroupMember
     */
    select?: GroupMemberSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the GroupMember
     */
    omit?: GroupMemberOmit<ExtArgs> | null
    /**
     * The data used to update GroupMembers.
     */
    data: XOR<GroupMemberUpdateManyMutationInput, GroupMemberUncheckedUpdateManyInput>
    /**
     * Filter which GroupMembers to update
     */
    where?: GroupMemberWhereInput
    /**
     * Limit how many GroupMembers to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupMemberIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * GroupMember upsert
   */
  export type GroupMemberUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GroupMember
     */
    select?: GroupMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GroupMember
     */
    omit?: GroupMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupMemberInclude<ExtArgs> | null
    /**
     * The filter to search for the GroupMember to update in case it exists.
     */
    where: GroupMemberWhereUniqueInput
    /**
     * In case the GroupMember found by the `where` argument doesn't exist, create a new GroupMember with this data.
     */
    create: XOR<GroupMemberCreateInput, GroupMemberUncheckedCreateInput>
    /**
     * In case the GroupMember was found with the provided `where` argument, update it with this data.
     */
    update: XOR<GroupMemberUpdateInput, GroupMemberUncheckedUpdateInput>
  }

  /**
   * GroupMember delete
   */
  export type GroupMemberDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GroupMember
     */
    select?: GroupMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GroupMember
     */
    omit?: GroupMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupMemberInclude<ExtArgs> | null
    /**
     * Filter which GroupMember to delete.
     */
    where: GroupMemberWhereUniqueInput
  }

  /**
   * GroupMember deleteMany
   */
  export type GroupMemberDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which GroupMembers to delete
     */
    where?: GroupMemberWhereInput
    /**
     * Limit how many GroupMembers to delete.
     */
    limit?: number
  }

  /**
   * GroupMember without action
   */
  export type GroupMemberDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GroupMember
     */
    select?: GroupMemberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GroupMember
     */
    omit?: GroupMemberOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupMemberInclude<ExtArgs> | null
  }


  /**
   * Model GroupMessage
   */

  export type AggregateGroupMessage = {
    _count: GroupMessageCountAggregateOutputType | null
    _avg: GroupMessageAvgAggregateOutputType | null
    _sum: GroupMessageSumAggregateOutputType | null
    _min: GroupMessageMinAggregateOutputType | null
    _max: GroupMessageMaxAggregateOutputType | null
  }

  export type GroupMessageAvgAggregateOutputType = {
    id: number | null
    groupId: number | null
    senderId: number | null
  }

  export type GroupMessageSumAggregateOutputType = {
    id: number | null
    groupId: number | null
    senderId: number | null
  }

  export type GroupMessageMinAggregateOutputType = {
    id: number | null
    content: string | null
    createdAt: Date | null
    groupId: number | null
    senderId: number | null
  }

  export type GroupMessageMaxAggregateOutputType = {
    id: number | null
    content: string | null
    createdAt: Date | null
    groupId: number | null
    senderId: number | null
  }

  export type GroupMessageCountAggregateOutputType = {
    id: number
    content: number
    createdAt: number
    groupId: number
    senderId: number
    _all: number
  }


  export type GroupMessageAvgAggregateInputType = {
    id?: true
    groupId?: true
    senderId?: true
  }

  export type GroupMessageSumAggregateInputType = {
    id?: true
    groupId?: true
    senderId?: true
  }

  export type GroupMessageMinAggregateInputType = {
    id?: true
    content?: true
    createdAt?: true
    groupId?: true
    senderId?: true
  }

  export type GroupMessageMaxAggregateInputType = {
    id?: true
    content?: true
    createdAt?: true
    groupId?: true
    senderId?: true
  }

  export type GroupMessageCountAggregateInputType = {
    id?: true
    content?: true
    createdAt?: true
    groupId?: true
    senderId?: true
    _all?: true
  }

  export type GroupMessageAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which GroupMessage to aggregate.
     */
    where?: GroupMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GroupMessages to fetch.
     */
    orderBy?: GroupMessageOrderByWithRelationInput | GroupMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: GroupMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GroupMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GroupMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned GroupMessages
    **/
    _count?: true | GroupMessageCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: GroupMessageAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: GroupMessageSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: GroupMessageMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: GroupMessageMaxAggregateInputType
  }

  export type GetGroupMessageAggregateType<T extends GroupMessageAggregateArgs> = {
        [P in keyof T & keyof AggregateGroupMessage]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateGroupMessage[P]>
      : GetScalarType<T[P], AggregateGroupMessage[P]>
  }




  export type GroupMessageGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: GroupMessageWhereInput
    orderBy?: GroupMessageOrderByWithAggregationInput | GroupMessageOrderByWithAggregationInput[]
    by: GroupMessageScalarFieldEnum[] | GroupMessageScalarFieldEnum
    having?: GroupMessageScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: GroupMessageCountAggregateInputType | true
    _avg?: GroupMessageAvgAggregateInputType
    _sum?: GroupMessageSumAggregateInputType
    _min?: GroupMessageMinAggregateInputType
    _max?: GroupMessageMaxAggregateInputType
  }

  export type GroupMessageGroupByOutputType = {
    id: number
    content: string
    createdAt: Date
    groupId: number
    senderId: number
    _count: GroupMessageCountAggregateOutputType | null
    _avg: GroupMessageAvgAggregateOutputType | null
    _sum: GroupMessageSumAggregateOutputType | null
    _min: GroupMessageMinAggregateOutputType | null
    _max: GroupMessageMaxAggregateOutputType | null
  }

  type GetGroupMessageGroupByPayload<T extends GroupMessageGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<GroupMessageGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof GroupMessageGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], GroupMessageGroupByOutputType[P]>
            : GetScalarType<T[P], GroupMessageGroupByOutputType[P]>
        }
      >
    >


  export type GroupMessageSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    content?: boolean
    createdAt?: boolean
    groupId?: boolean
    senderId?: boolean
    group?: boolean | GroupDefaultArgs<ExtArgs>
    sender?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["groupMessage"]>

  export type GroupMessageSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    content?: boolean
    createdAt?: boolean
    groupId?: boolean
    senderId?: boolean
    group?: boolean | GroupDefaultArgs<ExtArgs>
    sender?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["groupMessage"]>

  export type GroupMessageSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    content?: boolean
    createdAt?: boolean
    groupId?: boolean
    senderId?: boolean
    group?: boolean | GroupDefaultArgs<ExtArgs>
    sender?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["groupMessage"]>

  export type GroupMessageSelectScalar = {
    id?: boolean
    content?: boolean
    createdAt?: boolean
    groupId?: boolean
    senderId?: boolean
  }

  export type GroupMessageOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "content" | "createdAt" | "groupId" | "senderId", ExtArgs["result"]["groupMessage"]>
  export type GroupMessageInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    group?: boolean | GroupDefaultArgs<ExtArgs>
    sender?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type GroupMessageIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    group?: boolean | GroupDefaultArgs<ExtArgs>
    sender?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type GroupMessageIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    group?: boolean | GroupDefaultArgs<ExtArgs>
    sender?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $GroupMessagePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "GroupMessage"
    objects: {
      group: Prisma.$GroupPayload<ExtArgs>
      sender: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      content: string
      createdAt: Date
      groupId: number
      senderId: number
    }, ExtArgs["result"]["groupMessage"]>
    composites: {}
  }

  type GroupMessageGetPayload<S extends boolean | null | undefined | GroupMessageDefaultArgs> = $Result.GetResult<Prisma.$GroupMessagePayload, S>

  type GroupMessageCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<GroupMessageFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: GroupMessageCountAggregateInputType | true
    }

  export interface GroupMessageDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['GroupMessage'], meta: { name: 'GroupMessage' } }
    /**
     * Find zero or one GroupMessage that matches the filter.
     * @param {GroupMessageFindUniqueArgs} args - Arguments to find a GroupMessage
     * @example
     * // Get one GroupMessage
     * const groupMessage = await prisma.groupMessage.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends GroupMessageFindUniqueArgs>(args: SelectSubset<T, GroupMessageFindUniqueArgs<ExtArgs>>): Prisma__GroupMessageClient<$Result.GetResult<Prisma.$GroupMessagePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one GroupMessage that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {GroupMessageFindUniqueOrThrowArgs} args - Arguments to find a GroupMessage
     * @example
     * // Get one GroupMessage
     * const groupMessage = await prisma.groupMessage.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends GroupMessageFindUniqueOrThrowArgs>(args: SelectSubset<T, GroupMessageFindUniqueOrThrowArgs<ExtArgs>>): Prisma__GroupMessageClient<$Result.GetResult<Prisma.$GroupMessagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first GroupMessage that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GroupMessageFindFirstArgs} args - Arguments to find a GroupMessage
     * @example
     * // Get one GroupMessage
     * const groupMessage = await prisma.groupMessage.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends GroupMessageFindFirstArgs>(args?: SelectSubset<T, GroupMessageFindFirstArgs<ExtArgs>>): Prisma__GroupMessageClient<$Result.GetResult<Prisma.$GroupMessagePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first GroupMessage that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GroupMessageFindFirstOrThrowArgs} args - Arguments to find a GroupMessage
     * @example
     * // Get one GroupMessage
     * const groupMessage = await prisma.groupMessage.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends GroupMessageFindFirstOrThrowArgs>(args?: SelectSubset<T, GroupMessageFindFirstOrThrowArgs<ExtArgs>>): Prisma__GroupMessageClient<$Result.GetResult<Prisma.$GroupMessagePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more GroupMessages that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GroupMessageFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all GroupMessages
     * const groupMessages = await prisma.groupMessage.findMany()
     * 
     * // Get first 10 GroupMessages
     * const groupMessages = await prisma.groupMessage.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const groupMessageWithIdOnly = await prisma.groupMessage.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends GroupMessageFindManyArgs>(args?: SelectSubset<T, GroupMessageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GroupMessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a GroupMessage.
     * @param {GroupMessageCreateArgs} args - Arguments to create a GroupMessage.
     * @example
     * // Create one GroupMessage
     * const GroupMessage = await prisma.groupMessage.create({
     *   data: {
     *     // ... data to create a GroupMessage
     *   }
     * })
     * 
     */
    create<T extends GroupMessageCreateArgs>(args: SelectSubset<T, GroupMessageCreateArgs<ExtArgs>>): Prisma__GroupMessageClient<$Result.GetResult<Prisma.$GroupMessagePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many GroupMessages.
     * @param {GroupMessageCreateManyArgs} args - Arguments to create many GroupMessages.
     * @example
     * // Create many GroupMessages
     * const groupMessage = await prisma.groupMessage.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends GroupMessageCreateManyArgs>(args?: SelectSubset<T, GroupMessageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many GroupMessages and returns the data saved in the database.
     * @param {GroupMessageCreateManyAndReturnArgs} args - Arguments to create many GroupMessages.
     * @example
     * // Create many GroupMessages
     * const groupMessage = await prisma.groupMessage.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many GroupMessages and only return the `id`
     * const groupMessageWithIdOnly = await prisma.groupMessage.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends GroupMessageCreateManyAndReturnArgs>(args?: SelectSubset<T, GroupMessageCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GroupMessagePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a GroupMessage.
     * @param {GroupMessageDeleteArgs} args - Arguments to delete one GroupMessage.
     * @example
     * // Delete one GroupMessage
     * const GroupMessage = await prisma.groupMessage.delete({
     *   where: {
     *     // ... filter to delete one GroupMessage
     *   }
     * })
     * 
     */
    delete<T extends GroupMessageDeleteArgs>(args: SelectSubset<T, GroupMessageDeleteArgs<ExtArgs>>): Prisma__GroupMessageClient<$Result.GetResult<Prisma.$GroupMessagePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one GroupMessage.
     * @param {GroupMessageUpdateArgs} args - Arguments to update one GroupMessage.
     * @example
     * // Update one GroupMessage
     * const groupMessage = await prisma.groupMessage.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends GroupMessageUpdateArgs>(args: SelectSubset<T, GroupMessageUpdateArgs<ExtArgs>>): Prisma__GroupMessageClient<$Result.GetResult<Prisma.$GroupMessagePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more GroupMessages.
     * @param {GroupMessageDeleteManyArgs} args - Arguments to filter GroupMessages to delete.
     * @example
     * // Delete a few GroupMessages
     * const { count } = await prisma.groupMessage.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends GroupMessageDeleteManyArgs>(args?: SelectSubset<T, GroupMessageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more GroupMessages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GroupMessageUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many GroupMessages
     * const groupMessage = await prisma.groupMessage.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends GroupMessageUpdateManyArgs>(args: SelectSubset<T, GroupMessageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more GroupMessages and returns the data updated in the database.
     * @param {GroupMessageUpdateManyAndReturnArgs} args - Arguments to update many GroupMessages.
     * @example
     * // Update many GroupMessages
     * const groupMessage = await prisma.groupMessage.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more GroupMessages and only return the `id`
     * const groupMessageWithIdOnly = await prisma.groupMessage.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends GroupMessageUpdateManyAndReturnArgs>(args: SelectSubset<T, GroupMessageUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GroupMessagePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one GroupMessage.
     * @param {GroupMessageUpsertArgs} args - Arguments to update or create a GroupMessage.
     * @example
     * // Update or create a GroupMessage
     * const groupMessage = await prisma.groupMessage.upsert({
     *   create: {
     *     // ... data to create a GroupMessage
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the GroupMessage we want to update
     *   }
     * })
     */
    upsert<T extends GroupMessageUpsertArgs>(args: SelectSubset<T, GroupMessageUpsertArgs<ExtArgs>>): Prisma__GroupMessageClient<$Result.GetResult<Prisma.$GroupMessagePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of GroupMessages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GroupMessageCountArgs} args - Arguments to filter GroupMessages to count.
     * @example
     * // Count the number of GroupMessages
     * const count = await prisma.groupMessage.count({
     *   where: {
     *     // ... the filter for the GroupMessages we want to count
     *   }
     * })
    **/
    count<T extends GroupMessageCountArgs>(
      args?: Subset<T, GroupMessageCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], GroupMessageCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a GroupMessage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GroupMessageAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends GroupMessageAggregateArgs>(args: Subset<T, GroupMessageAggregateArgs>): Prisma.PrismaPromise<GetGroupMessageAggregateType<T>>

    /**
     * Group by GroupMessage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GroupMessageGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends GroupMessageGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: GroupMessageGroupByArgs['orderBy'] }
        : { orderBy?: GroupMessageGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, GroupMessageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetGroupMessageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the GroupMessage model
   */
  readonly fields: GroupMessageFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for GroupMessage.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__GroupMessageClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    group<T extends GroupDefaultArgs<ExtArgs> = {}>(args?: Subset<T, GroupDefaultArgs<ExtArgs>>): Prisma__GroupClient<$Result.GetResult<Prisma.$GroupPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    sender<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the GroupMessage model
   */
  interface GroupMessageFieldRefs {
    readonly id: FieldRef<"GroupMessage", 'Int'>
    readonly content: FieldRef<"GroupMessage", 'String'>
    readonly createdAt: FieldRef<"GroupMessage", 'DateTime'>
    readonly groupId: FieldRef<"GroupMessage", 'Int'>
    readonly senderId: FieldRef<"GroupMessage", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * GroupMessage findUnique
   */
  export type GroupMessageFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GroupMessage
     */
    select?: GroupMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GroupMessage
     */
    omit?: GroupMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupMessageInclude<ExtArgs> | null
    /**
     * Filter, which GroupMessage to fetch.
     */
    where: GroupMessageWhereUniqueInput
  }

  /**
   * GroupMessage findUniqueOrThrow
   */
  export type GroupMessageFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GroupMessage
     */
    select?: GroupMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GroupMessage
     */
    omit?: GroupMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupMessageInclude<ExtArgs> | null
    /**
     * Filter, which GroupMessage to fetch.
     */
    where: GroupMessageWhereUniqueInput
  }

  /**
   * GroupMessage findFirst
   */
  export type GroupMessageFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GroupMessage
     */
    select?: GroupMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GroupMessage
     */
    omit?: GroupMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupMessageInclude<ExtArgs> | null
    /**
     * Filter, which GroupMessage to fetch.
     */
    where?: GroupMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GroupMessages to fetch.
     */
    orderBy?: GroupMessageOrderByWithRelationInput | GroupMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for GroupMessages.
     */
    cursor?: GroupMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GroupMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GroupMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of GroupMessages.
     */
    distinct?: GroupMessageScalarFieldEnum | GroupMessageScalarFieldEnum[]
  }

  /**
   * GroupMessage findFirstOrThrow
   */
  export type GroupMessageFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GroupMessage
     */
    select?: GroupMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GroupMessage
     */
    omit?: GroupMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupMessageInclude<ExtArgs> | null
    /**
     * Filter, which GroupMessage to fetch.
     */
    where?: GroupMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GroupMessages to fetch.
     */
    orderBy?: GroupMessageOrderByWithRelationInput | GroupMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for GroupMessages.
     */
    cursor?: GroupMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GroupMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GroupMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of GroupMessages.
     */
    distinct?: GroupMessageScalarFieldEnum | GroupMessageScalarFieldEnum[]
  }

  /**
   * GroupMessage findMany
   */
  export type GroupMessageFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GroupMessage
     */
    select?: GroupMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GroupMessage
     */
    omit?: GroupMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupMessageInclude<ExtArgs> | null
    /**
     * Filter, which GroupMessages to fetch.
     */
    where?: GroupMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of GroupMessages to fetch.
     */
    orderBy?: GroupMessageOrderByWithRelationInput | GroupMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing GroupMessages.
     */
    cursor?: GroupMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` GroupMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` GroupMessages.
     */
    skip?: number
    distinct?: GroupMessageScalarFieldEnum | GroupMessageScalarFieldEnum[]
  }

  /**
   * GroupMessage create
   */
  export type GroupMessageCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GroupMessage
     */
    select?: GroupMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GroupMessage
     */
    omit?: GroupMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupMessageInclude<ExtArgs> | null
    /**
     * The data needed to create a GroupMessage.
     */
    data: XOR<GroupMessageCreateInput, GroupMessageUncheckedCreateInput>
  }

  /**
   * GroupMessage createMany
   */
  export type GroupMessageCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many GroupMessages.
     */
    data: GroupMessageCreateManyInput | GroupMessageCreateManyInput[]
  }

  /**
   * GroupMessage createManyAndReturn
   */
  export type GroupMessageCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GroupMessage
     */
    select?: GroupMessageSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the GroupMessage
     */
    omit?: GroupMessageOmit<ExtArgs> | null
    /**
     * The data used to create many GroupMessages.
     */
    data: GroupMessageCreateManyInput | GroupMessageCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupMessageIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * GroupMessage update
   */
  export type GroupMessageUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GroupMessage
     */
    select?: GroupMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GroupMessage
     */
    omit?: GroupMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupMessageInclude<ExtArgs> | null
    /**
     * The data needed to update a GroupMessage.
     */
    data: XOR<GroupMessageUpdateInput, GroupMessageUncheckedUpdateInput>
    /**
     * Choose, which GroupMessage to update.
     */
    where: GroupMessageWhereUniqueInput
  }

  /**
   * GroupMessage updateMany
   */
  export type GroupMessageUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update GroupMessages.
     */
    data: XOR<GroupMessageUpdateManyMutationInput, GroupMessageUncheckedUpdateManyInput>
    /**
     * Filter which GroupMessages to update
     */
    where?: GroupMessageWhereInput
    /**
     * Limit how many GroupMessages to update.
     */
    limit?: number
  }

  /**
   * GroupMessage updateManyAndReturn
   */
  export type GroupMessageUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GroupMessage
     */
    select?: GroupMessageSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the GroupMessage
     */
    omit?: GroupMessageOmit<ExtArgs> | null
    /**
     * The data used to update GroupMessages.
     */
    data: XOR<GroupMessageUpdateManyMutationInput, GroupMessageUncheckedUpdateManyInput>
    /**
     * Filter which GroupMessages to update
     */
    where?: GroupMessageWhereInput
    /**
     * Limit how many GroupMessages to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupMessageIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * GroupMessage upsert
   */
  export type GroupMessageUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GroupMessage
     */
    select?: GroupMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GroupMessage
     */
    omit?: GroupMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupMessageInclude<ExtArgs> | null
    /**
     * The filter to search for the GroupMessage to update in case it exists.
     */
    where: GroupMessageWhereUniqueInput
    /**
     * In case the GroupMessage found by the `where` argument doesn't exist, create a new GroupMessage with this data.
     */
    create: XOR<GroupMessageCreateInput, GroupMessageUncheckedCreateInput>
    /**
     * In case the GroupMessage was found with the provided `where` argument, update it with this data.
     */
    update: XOR<GroupMessageUpdateInput, GroupMessageUncheckedUpdateInput>
  }

  /**
   * GroupMessage delete
   */
  export type GroupMessageDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GroupMessage
     */
    select?: GroupMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GroupMessage
     */
    omit?: GroupMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupMessageInclude<ExtArgs> | null
    /**
     * Filter which GroupMessage to delete.
     */
    where: GroupMessageWhereUniqueInput
  }

  /**
   * GroupMessage deleteMany
   */
  export type GroupMessageDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which GroupMessages to delete
     */
    where?: GroupMessageWhereInput
    /**
     * Limit how many GroupMessages to delete.
     */
    limit?: number
  }

  /**
   * GroupMessage without action
   */
  export type GroupMessageDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GroupMessage
     */
    select?: GroupMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the GroupMessage
     */
    omit?: GroupMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GroupMessageInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const UserScalarFieldEnum: {
    id: 'id',
    name: 'name',
    email: 'email',
    password: 'password',
    googleId: 'googleId',
    bio: 'bio',
    profilePicture: 'profilePicture',
    collegeName: 'collegeName',
    department: 'department',
    yearOfStudy: 'yearOfStudy',
    phoneNumber: 'phoneNumber',
    phoneVisibility: 'phoneVisibility',
    whatsappNumber: 'whatsappNumber',
    whatsappVisibility: 'whatsappVisibility',
    instagramHandle: 'instagramHandle',
    instagramVisibility: 'instagramVisibility',
    facebookUrl: 'facebookUrl',
    facebookVisibility: 'facebookVisibility',
    snapchatUsername: 'snapchatUsername',
    snapchatVisibility: 'snapchatVisibility',
    linkedinUrl: 'linkedinUrl',
    linkedinVisibility: 'linkedinVisibility',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const PostScalarFieldEnum: {
    id: 'id',
    content: 'content',
    image: 'image',
    visibility: 'visibility',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    authorId: 'authorId'
  };

  export type PostScalarFieldEnum = (typeof PostScalarFieldEnum)[keyof typeof PostScalarFieldEnum]


  export const FriendshipScalarFieldEnum: {
    id: 'id',
    status: 'status',
    isCloseFriend: 'isCloseFriend',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    senderId: 'senderId',
    receiverId: 'receiverId'
  };

  export type FriendshipScalarFieldEnum = (typeof FriendshipScalarFieldEnum)[keyof typeof FriendshipScalarFieldEnum]


  export const MessageScalarFieldEnum: {
    id: 'id',
    content: 'content',
    isRead: 'isRead',
    createdAt: 'createdAt',
    senderId: 'senderId',
    receiverId: 'receiverId'
  };

  export type MessageScalarFieldEnum = (typeof MessageScalarFieldEnum)[keyof typeof MessageScalarFieldEnum]


  export const CommentScalarFieldEnum: {
    id: 'id',
    content: 'content',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    postId: 'postId',
    authorId: 'authorId'
  };

  export type CommentScalarFieldEnum = (typeof CommentScalarFieldEnum)[keyof typeof CommentScalarFieldEnum]


  export const CrushScalarFieldEnum: {
    id: 'id',
    createdAt: 'createdAt',
    userId: 'userId',
    crushId: 'crushId'
  };

  export type CrushScalarFieldEnum = (typeof CrushScalarFieldEnum)[keyof typeof CrushScalarFieldEnum]


  export const CloseFriendRequestScalarFieldEnum: {
    id: 'id',
    status: 'status',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    senderId: 'senderId',
    receiverId: 'receiverId'
  };

  export type CloseFriendRequestScalarFieldEnum = (typeof CloseFriendRequestScalarFieldEnum)[keyof typeof CloseFriendRequestScalarFieldEnum]


  export const LanguageRoomScalarFieldEnum: {
    id: 'id',
    roomName: 'roomName',
    topic: 'topic',
    language: 'language',
    createdAt: 'createdAt',
    creatorId: 'creatorId'
  };

  export type LanguageRoomScalarFieldEnum = (typeof LanguageRoomScalarFieldEnum)[keyof typeof LanguageRoomScalarFieldEnum]


  export const GroupScalarFieldEnum: {
    id: 'id',
    name: 'name',
    description: 'description',
    isPrivate: 'isPrivate',
    entryKey: 'entryKey',
    createdAt: 'createdAt',
    creatorId: 'creatorId'
  };

  export type GroupScalarFieldEnum = (typeof GroupScalarFieldEnum)[keyof typeof GroupScalarFieldEnum]


  export const GroupMemberScalarFieldEnum: {
    id: 'id',
    joinedAt: 'joinedAt',
    groupId: 'groupId',
    userId: 'userId'
  };

  export type GroupMemberScalarFieldEnum = (typeof GroupMemberScalarFieldEnum)[keyof typeof GroupMemberScalarFieldEnum]


  export const GroupMessageScalarFieldEnum: {
    id: 'id',
    content: 'content',
    createdAt: 'createdAt',
    groupId: 'groupId',
    senderId: 'senderId'
  };

  export type GroupMessageScalarFieldEnum = (typeof GroupMessageScalarFieldEnum)[keyof typeof GroupMessageScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    
  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: IntFilter<"User"> | number
    name?: StringFilter<"User"> | string
    email?: StringFilter<"User"> | string
    password?: StringNullableFilter<"User"> | string | null
    googleId?: StringNullableFilter<"User"> | string | null
    bio?: StringNullableFilter<"User"> | string | null
    profilePicture?: StringNullableFilter<"User"> | string | null
    collegeName?: StringNullableFilter<"User"> | string | null
    department?: StringNullableFilter<"User"> | string | null
    yearOfStudy?: StringNullableFilter<"User"> | string | null
    phoneNumber?: StringNullableFilter<"User"> | string | null
    phoneVisibility?: StringFilter<"User"> | string
    whatsappNumber?: StringNullableFilter<"User"> | string | null
    whatsappVisibility?: StringFilter<"User"> | string
    instagramHandle?: StringNullableFilter<"User"> | string | null
    instagramVisibility?: StringFilter<"User"> | string
    facebookUrl?: StringNullableFilter<"User"> | string | null
    facebookVisibility?: StringFilter<"User"> | string
    snapchatUsername?: StringNullableFilter<"User"> | string | null
    snapchatVisibility?: StringFilter<"User"> | string
    linkedinUrl?: StringNullableFilter<"User"> | string | null
    linkedinVisibility?: StringFilter<"User"> | string
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    posts?: PostListRelationFilter
    comments?: CommentListRelationFilter
    likedPosts?: PostListRelationFilter
    sentFriendRequests?: FriendshipListRelationFilter
    receivedFriendRequests?: FriendshipListRelationFilter
    sentMessages?: MessageListRelationFilter
    receivedMessages?: MessageListRelationFilter
    myCrushes?: CrushListRelationFilter
    crushedBy?: CrushListRelationFilter
    sentCloseFriendRequests?: CloseFriendRequestListRelationFilter
    receivedCloseFriendRequests?: CloseFriendRequestListRelationFilter
    languageRooms?: LanguageRoomListRelationFilter
    createdGroups?: GroupListRelationFilter
    groupMembers?: GroupMemberListRelationFilter
    groupMessages?: GroupMessageListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    password?: SortOrderInput | SortOrder
    googleId?: SortOrderInput | SortOrder
    bio?: SortOrderInput | SortOrder
    profilePicture?: SortOrderInput | SortOrder
    collegeName?: SortOrderInput | SortOrder
    department?: SortOrderInput | SortOrder
    yearOfStudy?: SortOrderInput | SortOrder
    phoneNumber?: SortOrderInput | SortOrder
    phoneVisibility?: SortOrder
    whatsappNumber?: SortOrderInput | SortOrder
    whatsappVisibility?: SortOrder
    instagramHandle?: SortOrderInput | SortOrder
    instagramVisibility?: SortOrder
    facebookUrl?: SortOrderInput | SortOrder
    facebookVisibility?: SortOrder
    snapchatUsername?: SortOrderInput | SortOrder
    snapchatVisibility?: SortOrder
    linkedinUrl?: SortOrderInput | SortOrder
    linkedinVisibility?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    posts?: PostOrderByRelationAggregateInput
    comments?: CommentOrderByRelationAggregateInput
    likedPosts?: PostOrderByRelationAggregateInput
    sentFriendRequests?: FriendshipOrderByRelationAggregateInput
    receivedFriendRequests?: FriendshipOrderByRelationAggregateInput
    sentMessages?: MessageOrderByRelationAggregateInput
    receivedMessages?: MessageOrderByRelationAggregateInput
    myCrushes?: CrushOrderByRelationAggregateInput
    crushedBy?: CrushOrderByRelationAggregateInput
    sentCloseFriendRequests?: CloseFriendRequestOrderByRelationAggregateInput
    receivedCloseFriendRequests?: CloseFriendRequestOrderByRelationAggregateInput
    languageRooms?: LanguageRoomOrderByRelationAggregateInput
    createdGroups?: GroupOrderByRelationAggregateInput
    groupMembers?: GroupMemberOrderByRelationAggregateInput
    groupMessages?: GroupMessageOrderByRelationAggregateInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    email?: string
    googleId?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    name?: StringFilter<"User"> | string
    password?: StringNullableFilter<"User"> | string | null
    bio?: StringNullableFilter<"User"> | string | null
    profilePicture?: StringNullableFilter<"User"> | string | null
    collegeName?: StringNullableFilter<"User"> | string | null
    department?: StringNullableFilter<"User"> | string | null
    yearOfStudy?: StringNullableFilter<"User"> | string | null
    phoneNumber?: StringNullableFilter<"User"> | string | null
    phoneVisibility?: StringFilter<"User"> | string
    whatsappNumber?: StringNullableFilter<"User"> | string | null
    whatsappVisibility?: StringFilter<"User"> | string
    instagramHandle?: StringNullableFilter<"User"> | string | null
    instagramVisibility?: StringFilter<"User"> | string
    facebookUrl?: StringNullableFilter<"User"> | string | null
    facebookVisibility?: StringFilter<"User"> | string
    snapchatUsername?: StringNullableFilter<"User"> | string | null
    snapchatVisibility?: StringFilter<"User"> | string
    linkedinUrl?: StringNullableFilter<"User"> | string | null
    linkedinVisibility?: StringFilter<"User"> | string
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    posts?: PostListRelationFilter
    comments?: CommentListRelationFilter
    likedPosts?: PostListRelationFilter
    sentFriendRequests?: FriendshipListRelationFilter
    receivedFriendRequests?: FriendshipListRelationFilter
    sentMessages?: MessageListRelationFilter
    receivedMessages?: MessageListRelationFilter
    myCrushes?: CrushListRelationFilter
    crushedBy?: CrushListRelationFilter
    sentCloseFriendRequests?: CloseFriendRequestListRelationFilter
    receivedCloseFriendRequests?: CloseFriendRequestListRelationFilter
    languageRooms?: LanguageRoomListRelationFilter
    createdGroups?: GroupListRelationFilter
    groupMembers?: GroupMemberListRelationFilter
    groupMessages?: GroupMessageListRelationFilter
  }, "id" | "email" | "googleId">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    password?: SortOrderInput | SortOrder
    googleId?: SortOrderInput | SortOrder
    bio?: SortOrderInput | SortOrder
    profilePicture?: SortOrderInput | SortOrder
    collegeName?: SortOrderInput | SortOrder
    department?: SortOrderInput | SortOrder
    yearOfStudy?: SortOrderInput | SortOrder
    phoneNumber?: SortOrderInput | SortOrder
    phoneVisibility?: SortOrder
    whatsappNumber?: SortOrderInput | SortOrder
    whatsappVisibility?: SortOrder
    instagramHandle?: SortOrderInput | SortOrder
    instagramVisibility?: SortOrder
    facebookUrl?: SortOrderInput | SortOrder
    facebookVisibility?: SortOrder
    snapchatUsername?: SortOrderInput | SortOrder
    snapchatVisibility?: SortOrder
    linkedinUrl?: SortOrderInput | SortOrder
    linkedinVisibility?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _avg?: UserAvgOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
    _sum?: UserSumOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"User"> | number
    name?: StringWithAggregatesFilter<"User"> | string
    email?: StringWithAggregatesFilter<"User"> | string
    password?: StringNullableWithAggregatesFilter<"User"> | string | null
    googleId?: StringNullableWithAggregatesFilter<"User"> | string | null
    bio?: StringNullableWithAggregatesFilter<"User"> | string | null
    profilePicture?: StringNullableWithAggregatesFilter<"User"> | string | null
    collegeName?: StringNullableWithAggregatesFilter<"User"> | string | null
    department?: StringNullableWithAggregatesFilter<"User"> | string | null
    yearOfStudy?: StringNullableWithAggregatesFilter<"User"> | string | null
    phoneNumber?: StringNullableWithAggregatesFilter<"User"> | string | null
    phoneVisibility?: StringWithAggregatesFilter<"User"> | string
    whatsappNumber?: StringNullableWithAggregatesFilter<"User"> | string | null
    whatsappVisibility?: StringWithAggregatesFilter<"User"> | string
    instagramHandle?: StringNullableWithAggregatesFilter<"User"> | string | null
    instagramVisibility?: StringWithAggregatesFilter<"User"> | string
    facebookUrl?: StringNullableWithAggregatesFilter<"User"> | string | null
    facebookVisibility?: StringWithAggregatesFilter<"User"> | string
    snapchatUsername?: StringNullableWithAggregatesFilter<"User"> | string | null
    snapchatVisibility?: StringWithAggregatesFilter<"User"> | string
    linkedinUrl?: StringNullableWithAggregatesFilter<"User"> | string | null
    linkedinVisibility?: StringWithAggregatesFilter<"User"> | string
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
  }

  export type PostWhereInput = {
    AND?: PostWhereInput | PostWhereInput[]
    OR?: PostWhereInput[]
    NOT?: PostWhereInput | PostWhereInput[]
    id?: IntFilter<"Post"> | number
    content?: StringFilter<"Post"> | string
    image?: StringNullableFilter<"Post"> | string | null
    visibility?: StringFilter<"Post"> | string
    createdAt?: DateTimeFilter<"Post"> | Date | string
    updatedAt?: DateTimeFilter<"Post"> | Date | string
    authorId?: IntFilter<"Post"> | number
    author?: XOR<UserScalarRelationFilter, UserWhereInput>
    likes?: UserListRelationFilter
    comments?: CommentListRelationFilter
  }

  export type PostOrderByWithRelationInput = {
    id?: SortOrder
    content?: SortOrder
    image?: SortOrderInput | SortOrder
    visibility?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    authorId?: SortOrder
    author?: UserOrderByWithRelationInput
    likes?: UserOrderByRelationAggregateInput
    comments?: CommentOrderByRelationAggregateInput
  }

  export type PostWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: PostWhereInput | PostWhereInput[]
    OR?: PostWhereInput[]
    NOT?: PostWhereInput | PostWhereInput[]
    content?: StringFilter<"Post"> | string
    image?: StringNullableFilter<"Post"> | string | null
    visibility?: StringFilter<"Post"> | string
    createdAt?: DateTimeFilter<"Post"> | Date | string
    updatedAt?: DateTimeFilter<"Post"> | Date | string
    authorId?: IntFilter<"Post"> | number
    author?: XOR<UserScalarRelationFilter, UserWhereInput>
    likes?: UserListRelationFilter
    comments?: CommentListRelationFilter
  }, "id">

  export type PostOrderByWithAggregationInput = {
    id?: SortOrder
    content?: SortOrder
    image?: SortOrderInput | SortOrder
    visibility?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    authorId?: SortOrder
    _count?: PostCountOrderByAggregateInput
    _avg?: PostAvgOrderByAggregateInput
    _max?: PostMaxOrderByAggregateInput
    _min?: PostMinOrderByAggregateInput
    _sum?: PostSumOrderByAggregateInput
  }

  export type PostScalarWhereWithAggregatesInput = {
    AND?: PostScalarWhereWithAggregatesInput | PostScalarWhereWithAggregatesInput[]
    OR?: PostScalarWhereWithAggregatesInput[]
    NOT?: PostScalarWhereWithAggregatesInput | PostScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Post"> | number
    content?: StringWithAggregatesFilter<"Post"> | string
    image?: StringNullableWithAggregatesFilter<"Post"> | string | null
    visibility?: StringWithAggregatesFilter<"Post"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Post"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Post"> | Date | string
    authorId?: IntWithAggregatesFilter<"Post"> | number
  }

  export type FriendshipWhereInput = {
    AND?: FriendshipWhereInput | FriendshipWhereInput[]
    OR?: FriendshipWhereInput[]
    NOT?: FriendshipWhereInput | FriendshipWhereInput[]
    id?: IntFilter<"Friendship"> | number
    status?: StringFilter<"Friendship"> | string
    isCloseFriend?: BoolFilter<"Friendship"> | boolean
    createdAt?: DateTimeFilter<"Friendship"> | Date | string
    updatedAt?: DateTimeFilter<"Friendship"> | Date | string
    senderId?: IntFilter<"Friendship"> | number
    receiverId?: IntFilter<"Friendship"> | number
    sender?: XOR<UserScalarRelationFilter, UserWhereInput>
    receiver?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type FriendshipOrderByWithRelationInput = {
    id?: SortOrder
    status?: SortOrder
    isCloseFriend?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    senderId?: SortOrder
    receiverId?: SortOrder
    sender?: UserOrderByWithRelationInput
    receiver?: UserOrderByWithRelationInput
  }

  export type FriendshipWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    senderId_receiverId?: FriendshipSenderIdReceiverIdCompoundUniqueInput
    AND?: FriendshipWhereInput | FriendshipWhereInput[]
    OR?: FriendshipWhereInput[]
    NOT?: FriendshipWhereInput | FriendshipWhereInput[]
    status?: StringFilter<"Friendship"> | string
    isCloseFriend?: BoolFilter<"Friendship"> | boolean
    createdAt?: DateTimeFilter<"Friendship"> | Date | string
    updatedAt?: DateTimeFilter<"Friendship"> | Date | string
    senderId?: IntFilter<"Friendship"> | number
    receiverId?: IntFilter<"Friendship"> | number
    sender?: XOR<UserScalarRelationFilter, UserWhereInput>
    receiver?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "senderId_receiverId">

  export type FriendshipOrderByWithAggregationInput = {
    id?: SortOrder
    status?: SortOrder
    isCloseFriend?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    senderId?: SortOrder
    receiverId?: SortOrder
    _count?: FriendshipCountOrderByAggregateInput
    _avg?: FriendshipAvgOrderByAggregateInput
    _max?: FriendshipMaxOrderByAggregateInput
    _min?: FriendshipMinOrderByAggregateInput
    _sum?: FriendshipSumOrderByAggregateInput
  }

  export type FriendshipScalarWhereWithAggregatesInput = {
    AND?: FriendshipScalarWhereWithAggregatesInput | FriendshipScalarWhereWithAggregatesInput[]
    OR?: FriendshipScalarWhereWithAggregatesInput[]
    NOT?: FriendshipScalarWhereWithAggregatesInput | FriendshipScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Friendship"> | number
    status?: StringWithAggregatesFilter<"Friendship"> | string
    isCloseFriend?: BoolWithAggregatesFilter<"Friendship"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"Friendship"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Friendship"> | Date | string
    senderId?: IntWithAggregatesFilter<"Friendship"> | number
    receiverId?: IntWithAggregatesFilter<"Friendship"> | number
  }

  export type MessageWhereInput = {
    AND?: MessageWhereInput | MessageWhereInput[]
    OR?: MessageWhereInput[]
    NOT?: MessageWhereInput | MessageWhereInput[]
    id?: IntFilter<"Message"> | number
    content?: StringFilter<"Message"> | string
    isRead?: BoolFilter<"Message"> | boolean
    createdAt?: DateTimeFilter<"Message"> | Date | string
    senderId?: IntFilter<"Message"> | number
    receiverId?: IntFilter<"Message"> | number
    sender?: XOR<UserScalarRelationFilter, UserWhereInput>
    receiver?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type MessageOrderByWithRelationInput = {
    id?: SortOrder
    content?: SortOrder
    isRead?: SortOrder
    createdAt?: SortOrder
    senderId?: SortOrder
    receiverId?: SortOrder
    sender?: UserOrderByWithRelationInput
    receiver?: UserOrderByWithRelationInput
  }

  export type MessageWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: MessageWhereInput | MessageWhereInput[]
    OR?: MessageWhereInput[]
    NOT?: MessageWhereInput | MessageWhereInput[]
    content?: StringFilter<"Message"> | string
    isRead?: BoolFilter<"Message"> | boolean
    createdAt?: DateTimeFilter<"Message"> | Date | string
    senderId?: IntFilter<"Message"> | number
    receiverId?: IntFilter<"Message"> | number
    sender?: XOR<UserScalarRelationFilter, UserWhereInput>
    receiver?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id">

  export type MessageOrderByWithAggregationInput = {
    id?: SortOrder
    content?: SortOrder
    isRead?: SortOrder
    createdAt?: SortOrder
    senderId?: SortOrder
    receiverId?: SortOrder
    _count?: MessageCountOrderByAggregateInput
    _avg?: MessageAvgOrderByAggregateInput
    _max?: MessageMaxOrderByAggregateInput
    _min?: MessageMinOrderByAggregateInput
    _sum?: MessageSumOrderByAggregateInput
  }

  export type MessageScalarWhereWithAggregatesInput = {
    AND?: MessageScalarWhereWithAggregatesInput | MessageScalarWhereWithAggregatesInput[]
    OR?: MessageScalarWhereWithAggregatesInput[]
    NOT?: MessageScalarWhereWithAggregatesInput | MessageScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Message"> | number
    content?: StringWithAggregatesFilter<"Message"> | string
    isRead?: BoolWithAggregatesFilter<"Message"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"Message"> | Date | string
    senderId?: IntWithAggregatesFilter<"Message"> | number
    receiverId?: IntWithAggregatesFilter<"Message"> | number
  }

  export type CommentWhereInput = {
    AND?: CommentWhereInput | CommentWhereInput[]
    OR?: CommentWhereInput[]
    NOT?: CommentWhereInput | CommentWhereInput[]
    id?: IntFilter<"Comment"> | number
    content?: StringFilter<"Comment"> | string
    createdAt?: DateTimeFilter<"Comment"> | Date | string
    updatedAt?: DateTimeFilter<"Comment"> | Date | string
    postId?: IntFilter<"Comment"> | number
    authorId?: IntFilter<"Comment"> | number
    post?: XOR<PostScalarRelationFilter, PostWhereInput>
    author?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type CommentOrderByWithRelationInput = {
    id?: SortOrder
    content?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    postId?: SortOrder
    authorId?: SortOrder
    post?: PostOrderByWithRelationInput
    author?: UserOrderByWithRelationInput
  }

  export type CommentWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: CommentWhereInput | CommentWhereInput[]
    OR?: CommentWhereInput[]
    NOT?: CommentWhereInput | CommentWhereInput[]
    content?: StringFilter<"Comment"> | string
    createdAt?: DateTimeFilter<"Comment"> | Date | string
    updatedAt?: DateTimeFilter<"Comment"> | Date | string
    postId?: IntFilter<"Comment"> | number
    authorId?: IntFilter<"Comment"> | number
    post?: XOR<PostScalarRelationFilter, PostWhereInput>
    author?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id">

  export type CommentOrderByWithAggregationInput = {
    id?: SortOrder
    content?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    postId?: SortOrder
    authorId?: SortOrder
    _count?: CommentCountOrderByAggregateInput
    _avg?: CommentAvgOrderByAggregateInput
    _max?: CommentMaxOrderByAggregateInput
    _min?: CommentMinOrderByAggregateInput
    _sum?: CommentSumOrderByAggregateInput
  }

  export type CommentScalarWhereWithAggregatesInput = {
    AND?: CommentScalarWhereWithAggregatesInput | CommentScalarWhereWithAggregatesInput[]
    OR?: CommentScalarWhereWithAggregatesInput[]
    NOT?: CommentScalarWhereWithAggregatesInput | CommentScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Comment"> | number
    content?: StringWithAggregatesFilter<"Comment"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Comment"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Comment"> | Date | string
    postId?: IntWithAggregatesFilter<"Comment"> | number
    authorId?: IntWithAggregatesFilter<"Comment"> | number
  }

  export type CrushWhereInput = {
    AND?: CrushWhereInput | CrushWhereInput[]
    OR?: CrushWhereInput[]
    NOT?: CrushWhereInput | CrushWhereInput[]
    id?: IntFilter<"Crush"> | number
    createdAt?: DateTimeFilter<"Crush"> | Date | string
    userId?: IntFilter<"Crush"> | number
    crushId?: IntFilter<"Crush"> | number
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    crush?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type CrushOrderByWithRelationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    userId?: SortOrder
    crushId?: SortOrder
    user?: UserOrderByWithRelationInput
    crush?: UserOrderByWithRelationInput
  }

  export type CrushWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    userId_crushId?: CrushUserIdCrushIdCompoundUniqueInput
    AND?: CrushWhereInput | CrushWhereInput[]
    OR?: CrushWhereInput[]
    NOT?: CrushWhereInput | CrushWhereInput[]
    createdAt?: DateTimeFilter<"Crush"> | Date | string
    userId?: IntFilter<"Crush"> | number
    crushId?: IntFilter<"Crush"> | number
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    crush?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "userId_crushId">

  export type CrushOrderByWithAggregationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    userId?: SortOrder
    crushId?: SortOrder
    _count?: CrushCountOrderByAggregateInput
    _avg?: CrushAvgOrderByAggregateInput
    _max?: CrushMaxOrderByAggregateInput
    _min?: CrushMinOrderByAggregateInput
    _sum?: CrushSumOrderByAggregateInput
  }

  export type CrushScalarWhereWithAggregatesInput = {
    AND?: CrushScalarWhereWithAggregatesInput | CrushScalarWhereWithAggregatesInput[]
    OR?: CrushScalarWhereWithAggregatesInput[]
    NOT?: CrushScalarWhereWithAggregatesInput | CrushScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Crush"> | number
    createdAt?: DateTimeWithAggregatesFilter<"Crush"> | Date | string
    userId?: IntWithAggregatesFilter<"Crush"> | number
    crushId?: IntWithAggregatesFilter<"Crush"> | number
  }

  export type CloseFriendRequestWhereInput = {
    AND?: CloseFriendRequestWhereInput | CloseFriendRequestWhereInput[]
    OR?: CloseFriendRequestWhereInput[]
    NOT?: CloseFriendRequestWhereInput | CloseFriendRequestWhereInput[]
    id?: IntFilter<"CloseFriendRequest"> | number
    status?: StringFilter<"CloseFriendRequest"> | string
    createdAt?: DateTimeFilter<"CloseFriendRequest"> | Date | string
    updatedAt?: DateTimeFilter<"CloseFriendRequest"> | Date | string
    senderId?: IntFilter<"CloseFriendRequest"> | number
    receiverId?: IntFilter<"CloseFriendRequest"> | number
    sender?: XOR<UserScalarRelationFilter, UserWhereInput>
    receiver?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type CloseFriendRequestOrderByWithRelationInput = {
    id?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    senderId?: SortOrder
    receiverId?: SortOrder
    sender?: UserOrderByWithRelationInput
    receiver?: UserOrderByWithRelationInput
  }

  export type CloseFriendRequestWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    senderId_receiverId?: CloseFriendRequestSenderIdReceiverIdCompoundUniqueInput
    AND?: CloseFriendRequestWhereInput | CloseFriendRequestWhereInput[]
    OR?: CloseFriendRequestWhereInput[]
    NOT?: CloseFriendRequestWhereInput | CloseFriendRequestWhereInput[]
    status?: StringFilter<"CloseFriendRequest"> | string
    createdAt?: DateTimeFilter<"CloseFriendRequest"> | Date | string
    updatedAt?: DateTimeFilter<"CloseFriendRequest"> | Date | string
    senderId?: IntFilter<"CloseFriendRequest"> | number
    receiverId?: IntFilter<"CloseFriendRequest"> | number
    sender?: XOR<UserScalarRelationFilter, UserWhereInput>
    receiver?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "senderId_receiverId">

  export type CloseFriendRequestOrderByWithAggregationInput = {
    id?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    senderId?: SortOrder
    receiverId?: SortOrder
    _count?: CloseFriendRequestCountOrderByAggregateInput
    _avg?: CloseFriendRequestAvgOrderByAggregateInput
    _max?: CloseFriendRequestMaxOrderByAggregateInput
    _min?: CloseFriendRequestMinOrderByAggregateInput
    _sum?: CloseFriendRequestSumOrderByAggregateInput
  }

  export type CloseFriendRequestScalarWhereWithAggregatesInput = {
    AND?: CloseFriendRequestScalarWhereWithAggregatesInput | CloseFriendRequestScalarWhereWithAggregatesInput[]
    OR?: CloseFriendRequestScalarWhereWithAggregatesInput[]
    NOT?: CloseFriendRequestScalarWhereWithAggregatesInput | CloseFriendRequestScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"CloseFriendRequest"> | number
    status?: StringWithAggregatesFilter<"CloseFriendRequest"> | string
    createdAt?: DateTimeWithAggregatesFilter<"CloseFriendRequest"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"CloseFriendRequest"> | Date | string
    senderId?: IntWithAggregatesFilter<"CloseFriendRequest"> | number
    receiverId?: IntWithAggregatesFilter<"CloseFriendRequest"> | number
  }

  export type LanguageRoomWhereInput = {
    AND?: LanguageRoomWhereInput | LanguageRoomWhereInput[]
    OR?: LanguageRoomWhereInput[]
    NOT?: LanguageRoomWhereInput | LanguageRoomWhereInput[]
    id?: IntFilter<"LanguageRoom"> | number
    roomName?: StringFilter<"LanguageRoom"> | string
    topic?: StringFilter<"LanguageRoom"> | string
    language?: StringFilter<"LanguageRoom"> | string
    createdAt?: DateTimeFilter<"LanguageRoom"> | Date | string
    creatorId?: IntFilter<"LanguageRoom"> | number
    creator?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type LanguageRoomOrderByWithRelationInput = {
    id?: SortOrder
    roomName?: SortOrder
    topic?: SortOrder
    language?: SortOrder
    createdAt?: SortOrder
    creatorId?: SortOrder
    creator?: UserOrderByWithRelationInput
  }

  export type LanguageRoomWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    roomName?: string
    AND?: LanguageRoomWhereInput | LanguageRoomWhereInput[]
    OR?: LanguageRoomWhereInput[]
    NOT?: LanguageRoomWhereInput | LanguageRoomWhereInput[]
    topic?: StringFilter<"LanguageRoom"> | string
    language?: StringFilter<"LanguageRoom"> | string
    createdAt?: DateTimeFilter<"LanguageRoom"> | Date | string
    creatorId?: IntFilter<"LanguageRoom"> | number
    creator?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "roomName">

  export type LanguageRoomOrderByWithAggregationInput = {
    id?: SortOrder
    roomName?: SortOrder
    topic?: SortOrder
    language?: SortOrder
    createdAt?: SortOrder
    creatorId?: SortOrder
    _count?: LanguageRoomCountOrderByAggregateInput
    _avg?: LanguageRoomAvgOrderByAggregateInput
    _max?: LanguageRoomMaxOrderByAggregateInput
    _min?: LanguageRoomMinOrderByAggregateInput
    _sum?: LanguageRoomSumOrderByAggregateInput
  }

  export type LanguageRoomScalarWhereWithAggregatesInput = {
    AND?: LanguageRoomScalarWhereWithAggregatesInput | LanguageRoomScalarWhereWithAggregatesInput[]
    OR?: LanguageRoomScalarWhereWithAggregatesInput[]
    NOT?: LanguageRoomScalarWhereWithAggregatesInput | LanguageRoomScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"LanguageRoom"> | number
    roomName?: StringWithAggregatesFilter<"LanguageRoom"> | string
    topic?: StringWithAggregatesFilter<"LanguageRoom"> | string
    language?: StringWithAggregatesFilter<"LanguageRoom"> | string
    createdAt?: DateTimeWithAggregatesFilter<"LanguageRoom"> | Date | string
    creatorId?: IntWithAggregatesFilter<"LanguageRoom"> | number
  }

  export type GroupWhereInput = {
    AND?: GroupWhereInput | GroupWhereInput[]
    OR?: GroupWhereInput[]
    NOT?: GroupWhereInput | GroupWhereInput[]
    id?: IntFilter<"Group"> | number
    name?: StringFilter<"Group"> | string
    description?: StringNullableFilter<"Group"> | string | null
    isPrivate?: BoolFilter<"Group"> | boolean
    entryKey?: StringNullableFilter<"Group"> | string | null
    createdAt?: DateTimeFilter<"Group"> | Date | string
    creatorId?: IntFilter<"Group"> | number
    creator?: XOR<UserScalarRelationFilter, UserWhereInput>
    members?: GroupMemberListRelationFilter
    messages?: GroupMessageListRelationFilter
  }

  export type GroupOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    isPrivate?: SortOrder
    entryKey?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    creatorId?: SortOrder
    creator?: UserOrderByWithRelationInput
    members?: GroupMemberOrderByRelationAggregateInput
    messages?: GroupMessageOrderByRelationAggregateInput
  }

  export type GroupWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    name?: string
    AND?: GroupWhereInput | GroupWhereInput[]
    OR?: GroupWhereInput[]
    NOT?: GroupWhereInput | GroupWhereInput[]
    description?: StringNullableFilter<"Group"> | string | null
    isPrivate?: BoolFilter<"Group"> | boolean
    entryKey?: StringNullableFilter<"Group"> | string | null
    createdAt?: DateTimeFilter<"Group"> | Date | string
    creatorId?: IntFilter<"Group"> | number
    creator?: XOR<UserScalarRelationFilter, UserWhereInput>
    members?: GroupMemberListRelationFilter
    messages?: GroupMessageListRelationFilter
  }, "id" | "name">

  export type GroupOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrderInput | SortOrder
    isPrivate?: SortOrder
    entryKey?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    creatorId?: SortOrder
    _count?: GroupCountOrderByAggregateInput
    _avg?: GroupAvgOrderByAggregateInput
    _max?: GroupMaxOrderByAggregateInput
    _min?: GroupMinOrderByAggregateInput
    _sum?: GroupSumOrderByAggregateInput
  }

  export type GroupScalarWhereWithAggregatesInput = {
    AND?: GroupScalarWhereWithAggregatesInput | GroupScalarWhereWithAggregatesInput[]
    OR?: GroupScalarWhereWithAggregatesInput[]
    NOT?: GroupScalarWhereWithAggregatesInput | GroupScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Group"> | number
    name?: StringWithAggregatesFilter<"Group"> | string
    description?: StringNullableWithAggregatesFilter<"Group"> | string | null
    isPrivate?: BoolWithAggregatesFilter<"Group"> | boolean
    entryKey?: StringNullableWithAggregatesFilter<"Group"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Group"> | Date | string
    creatorId?: IntWithAggregatesFilter<"Group"> | number
  }

  export type GroupMemberWhereInput = {
    AND?: GroupMemberWhereInput | GroupMemberWhereInput[]
    OR?: GroupMemberWhereInput[]
    NOT?: GroupMemberWhereInput | GroupMemberWhereInput[]
    id?: IntFilter<"GroupMember"> | number
    joinedAt?: DateTimeFilter<"GroupMember"> | Date | string
    groupId?: IntFilter<"GroupMember"> | number
    userId?: IntFilter<"GroupMember"> | number
    group?: XOR<GroupScalarRelationFilter, GroupWhereInput>
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type GroupMemberOrderByWithRelationInput = {
    id?: SortOrder
    joinedAt?: SortOrder
    groupId?: SortOrder
    userId?: SortOrder
    group?: GroupOrderByWithRelationInput
    user?: UserOrderByWithRelationInput
  }

  export type GroupMemberWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    groupId_userId?: GroupMemberGroupIdUserIdCompoundUniqueInput
    AND?: GroupMemberWhereInput | GroupMemberWhereInput[]
    OR?: GroupMemberWhereInput[]
    NOT?: GroupMemberWhereInput | GroupMemberWhereInput[]
    joinedAt?: DateTimeFilter<"GroupMember"> | Date | string
    groupId?: IntFilter<"GroupMember"> | number
    userId?: IntFilter<"GroupMember"> | number
    group?: XOR<GroupScalarRelationFilter, GroupWhereInput>
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "groupId_userId">

  export type GroupMemberOrderByWithAggregationInput = {
    id?: SortOrder
    joinedAt?: SortOrder
    groupId?: SortOrder
    userId?: SortOrder
    _count?: GroupMemberCountOrderByAggregateInput
    _avg?: GroupMemberAvgOrderByAggregateInput
    _max?: GroupMemberMaxOrderByAggregateInput
    _min?: GroupMemberMinOrderByAggregateInput
    _sum?: GroupMemberSumOrderByAggregateInput
  }

  export type GroupMemberScalarWhereWithAggregatesInput = {
    AND?: GroupMemberScalarWhereWithAggregatesInput | GroupMemberScalarWhereWithAggregatesInput[]
    OR?: GroupMemberScalarWhereWithAggregatesInput[]
    NOT?: GroupMemberScalarWhereWithAggregatesInput | GroupMemberScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"GroupMember"> | number
    joinedAt?: DateTimeWithAggregatesFilter<"GroupMember"> | Date | string
    groupId?: IntWithAggregatesFilter<"GroupMember"> | number
    userId?: IntWithAggregatesFilter<"GroupMember"> | number
  }

  export type GroupMessageWhereInput = {
    AND?: GroupMessageWhereInput | GroupMessageWhereInput[]
    OR?: GroupMessageWhereInput[]
    NOT?: GroupMessageWhereInput | GroupMessageWhereInput[]
    id?: IntFilter<"GroupMessage"> | number
    content?: StringFilter<"GroupMessage"> | string
    createdAt?: DateTimeFilter<"GroupMessage"> | Date | string
    groupId?: IntFilter<"GroupMessage"> | number
    senderId?: IntFilter<"GroupMessage"> | number
    group?: XOR<GroupScalarRelationFilter, GroupWhereInput>
    sender?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type GroupMessageOrderByWithRelationInput = {
    id?: SortOrder
    content?: SortOrder
    createdAt?: SortOrder
    groupId?: SortOrder
    senderId?: SortOrder
    group?: GroupOrderByWithRelationInput
    sender?: UserOrderByWithRelationInput
  }

  export type GroupMessageWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: GroupMessageWhereInput | GroupMessageWhereInput[]
    OR?: GroupMessageWhereInput[]
    NOT?: GroupMessageWhereInput | GroupMessageWhereInput[]
    content?: StringFilter<"GroupMessage"> | string
    createdAt?: DateTimeFilter<"GroupMessage"> | Date | string
    groupId?: IntFilter<"GroupMessage"> | number
    senderId?: IntFilter<"GroupMessage"> | number
    group?: XOR<GroupScalarRelationFilter, GroupWhereInput>
    sender?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id">

  export type GroupMessageOrderByWithAggregationInput = {
    id?: SortOrder
    content?: SortOrder
    createdAt?: SortOrder
    groupId?: SortOrder
    senderId?: SortOrder
    _count?: GroupMessageCountOrderByAggregateInput
    _avg?: GroupMessageAvgOrderByAggregateInput
    _max?: GroupMessageMaxOrderByAggregateInput
    _min?: GroupMessageMinOrderByAggregateInput
    _sum?: GroupMessageSumOrderByAggregateInput
  }

  export type GroupMessageScalarWhereWithAggregatesInput = {
    AND?: GroupMessageScalarWhereWithAggregatesInput | GroupMessageScalarWhereWithAggregatesInput[]
    OR?: GroupMessageScalarWhereWithAggregatesInput[]
    NOT?: GroupMessageScalarWhereWithAggregatesInput | GroupMessageScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"GroupMessage"> | number
    content?: StringWithAggregatesFilter<"GroupMessage"> | string
    createdAt?: DateTimeWithAggregatesFilter<"GroupMessage"> | Date | string
    groupId?: IntWithAggregatesFilter<"GroupMessage"> | number
    senderId?: IntWithAggregatesFilter<"GroupMessage"> | number
  }

  export type UserCreateInput = {
    name: string
    email: string
    password?: string | null
    googleId?: string | null
    bio?: string | null
    profilePicture?: string | null
    collegeName?: string | null
    department?: string | null
    yearOfStudy?: string | null
    phoneNumber?: string | null
    phoneVisibility?: string
    whatsappNumber?: string | null
    whatsappVisibility?: string
    instagramHandle?: string | null
    instagramVisibility?: string
    facebookUrl?: string | null
    facebookVisibility?: string
    snapchatUsername?: string | null
    snapchatVisibility?: string
    linkedinUrl?: string | null
    linkedinVisibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostCreateNestedManyWithoutAuthorInput
    comments?: CommentCreateNestedManyWithoutAuthorInput
    likedPosts?: PostCreateNestedManyWithoutLikesInput
    sentFriendRequests?: FriendshipCreateNestedManyWithoutSenderInput
    receivedFriendRequests?: FriendshipCreateNestedManyWithoutReceiverInput
    sentMessages?: MessageCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageCreateNestedManyWithoutReceiverInput
    myCrushes?: CrushCreateNestedManyWithoutUserInput
    crushedBy?: CrushCreateNestedManyWithoutCrushInput
    sentCloseFriendRequests?: CloseFriendRequestCreateNestedManyWithoutSenderInput
    receivedCloseFriendRequests?: CloseFriendRequestCreateNestedManyWithoutReceiverInput
    languageRooms?: LanguageRoomCreateNestedManyWithoutCreatorInput
    createdGroups?: GroupCreateNestedManyWithoutCreatorInput
    groupMembers?: GroupMemberCreateNestedManyWithoutUserInput
    groupMessages?: GroupMessageCreateNestedManyWithoutSenderInput
  }

  export type UserUncheckedCreateInput = {
    id?: number
    name: string
    email: string
    password?: string | null
    googleId?: string | null
    bio?: string | null
    profilePicture?: string | null
    collegeName?: string | null
    department?: string | null
    yearOfStudy?: string | null
    phoneNumber?: string | null
    phoneVisibility?: string
    whatsappNumber?: string | null
    whatsappVisibility?: string
    instagramHandle?: string | null
    instagramVisibility?: string
    facebookUrl?: string | null
    facebookVisibility?: string
    snapchatUsername?: string | null
    snapchatVisibility?: string
    linkedinUrl?: string | null
    linkedinVisibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostUncheckedCreateNestedManyWithoutAuthorInput
    comments?: CommentUncheckedCreateNestedManyWithoutAuthorInput
    likedPosts?: PostUncheckedCreateNestedManyWithoutLikesInput
    sentFriendRequests?: FriendshipUncheckedCreateNestedManyWithoutSenderInput
    receivedFriendRequests?: FriendshipUncheckedCreateNestedManyWithoutReceiverInput
    sentMessages?: MessageUncheckedCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageUncheckedCreateNestedManyWithoutReceiverInput
    myCrushes?: CrushUncheckedCreateNestedManyWithoutUserInput
    crushedBy?: CrushUncheckedCreateNestedManyWithoutCrushInput
    sentCloseFriendRequests?: CloseFriendRequestUncheckedCreateNestedManyWithoutSenderInput
    receivedCloseFriendRequests?: CloseFriendRequestUncheckedCreateNestedManyWithoutReceiverInput
    languageRooms?: LanguageRoomUncheckedCreateNestedManyWithoutCreatorInput
    createdGroups?: GroupUncheckedCreateNestedManyWithoutCreatorInput
    groupMembers?: GroupMemberUncheckedCreateNestedManyWithoutUserInput
    groupMessages?: GroupMessageUncheckedCreateNestedManyWithoutSenderInput
  }

  export type UserUpdateInput = {
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    googleId?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    collegeName?: NullableStringFieldUpdateOperationsInput | string | null
    department?: NullableStringFieldUpdateOperationsInput | string | null
    yearOfStudy?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    phoneVisibility?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: NullableStringFieldUpdateOperationsInput | string | null
    whatsappVisibility?: StringFieldUpdateOperationsInput | string
    instagramHandle?: NullableStringFieldUpdateOperationsInput | string | null
    instagramVisibility?: StringFieldUpdateOperationsInput | string
    facebookUrl?: NullableStringFieldUpdateOperationsInput | string | null
    facebookVisibility?: StringFieldUpdateOperationsInput | string
    snapchatUsername?: NullableStringFieldUpdateOperationsInput | string | null
    snapchatVisibility?: StringFieldUpdateOperationsInput | string
    linkedinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    linkedinVisibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUpdateManyWithoutAuthorNestedInput
    comments?: CommentUpdateManyWithoutAuthorNestedInput
    likedPosts?: PostUpdateManyWithoutLikesNestedInput
    sentFriendRequests?: FriendshipUpdateManyWithoutSenderNestedInput
    receivedFriendRequests?: FriendshipUpdateManyWithoutReceiverNestedInput
    sentMessages?: MessageUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUpdateManyWithoutReceiverNestedInput
    myCrushes?: CrushUpdateManyWithoutUserNestedInput
    crushedBy?: CrushUpdateManyWithoutCrushNestedInput
    sentCloseFriendRequests?: CloseFriendRequestUpdateManyWithoutSenderNestedInput
    receivedCloseFriendRequests?: CloseFriendRequestUpdateManyWithoutReceiverNestedInput
    languageRooms?: LanguageRoomUpdateManyWithoutCreatorNestedInput
    createdGroups?: GroupUpdateManyWithoutCreatorNestedInput
    groupMembers?: GroupMemberUpdateManyWithoutUserNestedInput
    groupMessages?: GroupMessageUpdateManyWithoutSenderNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    googleId?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    collegeName?: NullableStringFieldUpdateOperationsInput | string | null
    department?: NullableStringFieldUpdateOperationsInput | string | null
    yearOfStudy?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    phoneVisibility?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: NullableStringFieldUpdateOperationsInput | string | null
    whatsappVisibility?: StringFieldUpdateOperationsInput | string
    instagramHandle?: NullableStringFieldUpdateOperationsInput | string | null
    instagramVisibility?: StringFieldUpdateOperationsInput | string
    facebookUrl?: NullableStringFieldUpdateOperationsInput | string | null
    facebookVisibility?: StringFieldUpdateOperationsInput | string
    snapchatUsername?: NullableStringFieldUpdateOperationsInput | string | null
    snapchatVisibility?: StringFieldUpdateOperationsInput | string
    linkedinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    linkedinVisibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUncheckedUpdateManyWithoutAuthorNestedInput
    comments?: CommentUncheckedUpdateManyWithoutAuthorNestedInput
    likedPosts?: PostUncheckedUpdateManyWithoutLikesNestedInput
    sentFriendRequests?: FriendshipUncheckedUpdateManyWithoutSenderNestedInput
    receivedFriendRequests?: FriendshipUncheckedUpdateManyWithoutReceiverNestedInput
    sentMessages?: MessageUncheckedUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUncheckedUpdateManyWithoutReceiverNestedInput
    myCrushes?: CrushUncheckedUpdateManyWithoutUserNestedInput
    crushedBy?: CrushUncheckedUpdateManyWithoutCrushNestedInput
    sentCloseFriendRequests?: CloseFriendRequestUncheckedUpdateManyWithoutSenderNestedInput
    receivedCloseFriendRequests?: CloseFriendRequestUncheckedUpdateManyWithoutReceiverNestedInput
    languageRooms?: LanguageRoomUncheckedUpdateManyWithoutCreatorNestedInput
    createdGroups?: GroupUncheckedUpdateManyWithoutCreatorNestedInput
    groupMembers?: GroupMemberUncheckedUpdateManyWithoutUserNestedInput
    groupMessages?: GroupMessageUncheckedUpdateManyWithoutSenderNestedInput
  }

  export type UserCreateManyInput = {
    id?: number
    name: string
    email: string
    password?: string | null
    googleId?: string | null
    bio?: string | null
    profilePicture?: string | null
    collegeName?: string | null
    department?: string | null
    yearOfStudy?: string | null
    phoneNumber?: string | null
    phoneVisibility?: string
    whatsappNumber?: string | null
    whatsappVisibility?: string
    instagramHandle?: string | null
    instagramVisibility?: string
    facebookUrl?: string | null
    facebookVisibility?: string
    snapchatUsername?: string | null
    snapchatVisibility?: string
    linkedinUrl?: string | null
    linkedinVisibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserUpdateManyMutationInput = {
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    googleId?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    collegeName?: NullableStringFieldUpdateOperationsInput | string | null
    department?: NullableStringFieldUpdateOperationsInput | string | null
    yearOfStudy?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    phoneVisibility?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: NullableStringFieldUpdateOperationsInput | string | null
    whatsappVisibility?: StringFieldUpdateOperationsInput | string
    instagramHandle?: NullableStringFieldUpdateOperationsInput | string | null
    instagramVisibility?: StringFieldUpdateOperationsInput | string
    facebookUrl?: NullableStringFieldUpdateOperationsInput | string | null
    facebookVisibility?: StringFieldUpdateOperationsInput | string
    snapchatUsername?: NullableStringFieldUpdateOperationsInput | string | null
    snapchatVisibility?: StringFieldUpdateOperationsInput | string
    linkedinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    linkedinVisibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    googleId?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    collegeName?: NullableStringFieldUpdateOperationsInput | string | null
    department?: NullableStringFieldUpdateOperationsInput | string | null
    yearOfStudy?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    phoneVisibility?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: NullableStringFieldUpdateOperationsInput | string | null
    whatsappVisibility?: StringFieldUpdateOperationsInput | string
    instagramHandle?: NullableStringFieldUpdateOperationsInput | string | null
    instagramVisibility?: StringFieldUpdateOperationsInput | string
    facebookUrl?: NullableStringFieldUpdateOperationsInput | string | null
    facebookVisibility?: StringFieldUpdateOperationsInput | string
    snapchatUsername?: NullableStringFieldUpdateOperationsInput | string | null
    snapchatVisibility?: StringFieldUpdateOperationsInput | string
    linkedinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    linkedinVisibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PostCreateInput = {
    content: string
    image?: string | null
    visibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    author: UserCreateNestedOneWithoutPostsInput
    likes?: UserCreateNestedManyWithoutLikedPostsInput
    comments?: CommentCreateNestedManyWithoutPostInput
  }

  export type PostUncheckedCreateInput = {
    id?: number
    content: string
    image?: string | null
    visibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    authorId: number
    likes?: UserUncheckedCreateNestedManyWithoutLikedPostsInput
    comments?: CommentUncheckedCreateNestedManyWithoutPostInput
  }

  export type PostUpdateInput = {
    content?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    visibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    author?: UserUpdateOneRequiredWithoutPostsNestedInput
    likes?: UserUpdateManyWithoutLikedPostsNestedInput
    comments?: CommentUpdateManyWithoutPostNestedInput
  }

  export type PostUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    content?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    visibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    authorId?: IntFieldUpdateOperationsInput | number
    likes?: UserUncheckedUpdateManyWithoutLikedPostsNestedInput
    comments?: CommentUncheckedUpdateManyWithoutPostNestedInput
  }

  export type PostCreateManyInput = {
    id?: number
    content: string
    image?: string | null
    visibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    authorId: number
  }

  export type PostUpdateManyMutationInput = {
    content?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    visibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PostUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    content?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    visibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    authorId?: IntFieldUpdateOperationsInput | number
  }

  export type FriendshipCreateInput = {
    status?: string
    isCloseFriend?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    sender: UserCreateNestedOneWithoutSentFriendRequestsInput
    receiver: UserCreateNestedOneWithoutReceivedFriendRequestsInput
  }

  export type FriendshipUncheckedCreateInput = {
    id?: number
    status?: string
    isCloseFriend?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    senderId: number
    receiverId: number
  }

  export type FriendshipUpdateInput = {
    status?: StringFieldUpdateOperationsInput | string
    isCloseFriend?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sender?: UserUpdateOneRequiredWithoutSentFriendRequestsNestedInput
    receiver?: UserUpdateOneRequiredWithoutReceivedFriendRequestsNestedInput
  }

  export type FriendshipUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    isCloseFriend?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    senderId?: IntFieldUpdateOperationsInput | number
    receiverId?: IntFieldUpdateOperationsInput | number
  }

  export type FriendshipCreateManyInput = {
    id?: number
    status?: string
    isCloseFriend?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    senderId: number
    receiverId: number
  }

  export type FriendshipUpdateManyMutationInput = {
    status?: StringFieldUpdateOperationsInput | string
    isCloseFriend?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FriendshipUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    isCloseFriend?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    senderId?: IntFieldUpdateOperationsInput | number
    receiverId?: IntFieldUpdateOperationsInput | number
  }

  export type MessageCreateInput = {
    content: string
    isRead?: boolean
    createdAt?: Date | string
    sender: UserCreateNestedOneWithoutSentMessagesInput
    receiver: UserCreateNestedOneWithoutReceivedMessagesInput
  }

  export type MessageUncheckedCreateInput = {
    id?: number
    content: string
    isRead?: boolean
    createdAt?: Date | string
    senderId: number
    receiverId: number
  }

  export type MessageUpdateInput = {
    content?: StringFieldUpdateOperationsInput | string
    isRead?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sender?: UserUpdateOneRequiredWithoutSentMessagesNestedInput
    receiver?: UserUpdateOneRequiredWithoutReceivedMessagesNestedInput
  }

  export type MessageUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    content?: StringFieldUpdateOperationsInput | string
    isRead?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    senderId?: IntFieldUpdateOperationsInput | number
    receiverId?: IntFieldUpdateOperationsInput | number
  }

  export type MessageCreateManyInput = {
    id?: number
    content: string
    isRead?: boolean
    createdAt?: Date | string
    senderId: number
    receiverId: number
  }

  export type MessageUpdateManyMutationInput = {
    content?: StringFieldUpdateOperationsInput | string
    isRead?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type MessageUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    content?: StringFieldUpdateOperationsInput | string
    isRead?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    senderId?: IntFieldUpdateOperationsInput | number
    receiverId?: IntFieldUpdateOperationsInput | number
  }

  export type CommentCreateInput = {
    content: string
    createdAt?: Date | string
    updatedAt?: Date | string
    post: PostCreateNestedOneWithoutCommentsInput
    author: UserCreateNestedOneWithoutCommentsInput
  }

  export type CommentUncheckedCreateInput = {
    id?: number
    content: string
    createdAt?: Date | string
    updatedAt?: Date | string
    postId: number
    authorId: number
  }

  export type CommentUpdateInput = {
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    post?: PostUpdateOneRequiredWithoutCommentsNestedInput
    author?: UserUpdateOneRequiredWithoutCommentsNestedInput
  }

  export type CommentUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    postId?: IntFieldUpdateOperationsInput | number
    authorId?: IntFieldUpdateOperationsInput | number
  }

  export type CommentCreateManyInput = {
    id?: number
    content: string
    createdAt?: Date | string
    updatedAt?: Date | string
    postId: number
    authorId: number
  }

  export type CommentUpdateManyMutationInput = {
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CommentUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    postId?: IntFieldUpdateOperationsInput | number
    authorId?: IntFieldUpdateOperationsInput | number
  }

  export type CrushCreateInput = {
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutMyCrushesInput
    crush: UserCreateNestedOneWithoutCrushedByInput
  }

  export type CrushUncheckedCreateInput = {
    id?: number
    createdAt?: Date | string
    userId: number
    crushId: number
  }

  export type CrushUpdateInput = {
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutMyCrushesNestedInput
    crush?: UserUpdateOneRequiredWithoutCrushedByNestedInput
  }

  export type CrushUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    userId?: IntFieldUpdateOperationsInput | number
    crushId?: IntFieldUpdateOperationsInput | number
  }

  export type CrushCreateManyInput = {
    id?: number
    createdAt?: Date | string
    userId: number
    crushId: number
  }

  export type CrushUpdateManyMutationInput = {
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CrushUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    userId?: IntFieldUpdateOperationsInput | number
    crushId?: IntFieldUpdateOperationsInput | number
  }

  export type CloseFriendRequestCreateInput = {
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    sender: UserCreateNestedOneWithoutSentCloseFriendRequestsInput
    receiver: UserCreateNestedOneWithoutReceivedCloseFriendRequestsInput
  }

  export type CloseFriendRequestUncheckedCreateInput = {
    id?: number
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    senderId: number
    receiverId: number
  }

  export type CloseFriendRequestUpdateInput = {
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sender?: UserUpdateOneRequiredWithoutSentCloseFriendRequestsNestedInput
    receiver?: UserUpdateOneRequiredWithoutReceivedCloseFriendRequestsNestedInput
  }

  export type CloseFriendRequestUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    senderId?: IntFieldUpdateOperationsInput | number
    receiverId?: IntFieldUpdateOperationsInput | number
  }

  export type CloseFriendRequestCreateManyInput = {
    id?: number
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    senderId: number
    receiverId: number
  }

  export type CloseFriendRequestUpdateManyMutationInput = {
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CloseFriendRequestUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    senderId?: IntFieldUpdateOperationsInput | number
    receiverId?: IntFieldUpdateOperationsInput | number
  }

  export type LanguageRoomCreateInput = {
    roomName: string
    topic: string
    language: string
    createdAt?: Date | string
    creator: UserCreateNestedOneWithoutLanguageRoomsInput
  }

  export type LanguageRoomUncheckedCreateInput = {
    id?: number
    roomName: string
    topic: string
    language: string
    createdAt?: Date | string
    creatorId: number
  }

  export type LanguageRoomUpdateInput = {
    roomName?: StringFieldUpdateOperationsInput | string
    topic?: StringFieldUpdateOperationsInput | string
    language?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    creator?: UserUpdateOneRequiredWithoutLanguageRoomsNestedInput
  }

  export type LanguageRoomUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    roomName?: StringFieldUpdateOperationsInput | string
    topic?: StringFieldUpdateOperationsInput | string
    language?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    creatorId?: IntFieldUpdateOperationsInput | number
  }

  export type LanguageRoomCreateManyInput = {
    id?: number
    roomName: string
    topic: string
    language: string
    createdAt?: Date | string
    creatorId: number
  }

  export type LanguageRoomUpdateManyMutationInput = {
    roomName?: StringFieldUpdateOperationsInput | string
    topic?: StringFieldUpdateOperationsInput | string
    language?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LanguageRoomUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    roomName?: StringFieldUpdateOperationsInput | string
    topic?: StringFieldUpdateOperationsInput | string
    language?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    creatorId?: IntFieldUpdateOperationsInput | number
  }

  export type GroupCreateInput = {
    name: string
    description?: string | null
    isPrivate?: boolean
    entryKey?: string | null
    createdAt?: Date | string
    creator: UserCreateNestedOneWithoutCreatedGroupsInput
    members?: GroupMemberCreateNestedManyWithoutGroupInput
    messages?: GroupMessageCreateNestedManyWithoutGroupInput
  }

  export type GroupUncheckedCreateInput = {
    id?: number
    name: string
    description?: string | null
    isPrivate?: boolean
    entryKey?: string | null
    createdAt?: Date | string
    creatorId: number
    members?: GroupMemberUncheckedCreateNestedManyWithoutGroupInput
    messages?: GroupMessageUncheckedCreateNestedManyWithoutGroupInput
  }

  export type GroupUpdateInput = {
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    entryKey?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    creator?: UserUpdateOneRequiredWithoutCreatedGroupsNestedInput
    members?: GroupMemberUpdateManyWithoutGroupNestedInput
    messages?: GroupMessageUpdateManyWithoutGroupNestedInput
  }

  export type GroupUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    entryKey?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    creatorId?: IntFieldUpdateOperationsInput | number
    members?: GroupMemberUncheckedUpdateManyWithoutGroupNestedInput
    messages?: GroupMessageUncheckedUpdateManyWithoutGroupNestedInput
  }

  export type GroupCreateManyInput = {
    id?: number
    name: string
    description?: string | null
    isPrivate?: boolean
    entryKey?: string | null
    createdAt?: Date | string
    creatorId: number
  }

  export type GroupUpdateManyMutationInput = {
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    entryKey?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type GroupUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    entryKey?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    creatorId?: IntFieldUpdateOperationsInput | number
  }

  export type GroupMemberCreateInput = {
    joinedAt?: Date | string
    group: GroupCreateNestedOneWithoutMembersInput
    user: UserCreateNestedOneWithoutGroupMembersInput
  }

  export type GroupMemberUncheckedCreateInput = {
    id?: number
    joinedAt?: Date | string
    groupId: number
    userId: number
  }

  export type GroupMemberUpdateInput = {
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    group?: GroupUpdateOneRequiredWithoutMembersNestedInput
    user?: UserUpdateOneRequiredWithoutGroupMembersNestedInput
  }

  export type GroupMemberUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    groupId?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
  }

  export type GroupMemberCreateManyInput = {
    id?: number
    joinedAt?: Date | string
    groupId: number
    userId: number
  }

  export type GroupMemberUpdateManyMutationInput = {
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type GroupMemberUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    groupId?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
  }

  export type GroupMessageCreateInput = {
    content: string
    createdAt?: Date | string
    group: GroupCreateNestedOneWithoutMessagesInput
    sender: UserCreateNestedOneWithoutGroupMessagesInput
  }

  export type GroupMessageUncheckedCreateInput = {
    id?: number
    content: string
    createdAt?: Date | string
    groupId: number
    senderId: number
  }

  export type GroupMessageUpdateInput = {
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    group?: GroupUpdateOneRequiredWithoutMessagesNestedInput
    sender?: UserUpdateOneRequiredWithoutGroupMessagesNestedInput
  }

  export type GroupMessageUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    groupId?: IntFieldUpdateOperationsInput | number
    senderId?: IntFieldUpdateOperationsInput | number
  }

  export type GroupMessageCreateManyInput = {
    id?: number
    content: string
    createdAt?: Date | string
    groupId: number
    senderId: number
  }

  export type GroupMessageUpdateManyMutationInput = {
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type GroupMessageUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    groupId?: IntFieldUpdateOperationsInput | number
    senderId?: IntFieldUpdateOperationsInput | number
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type PostListRelationFilter = {
    every?: PostWhereInput
    some?: PostWhereInput
    none?: PostWhereInput
  }

  export type CommentListRelationFilter = {
    every?: CommentWhereInput
    some?: CommentWhereInput
    none?: CommentWhereInput
  }

  export type FriendshipListRelationFilter = {
    every?: FriendshipWhereInput
    some?: FriendshipWhereInput
    none?: FriendshipWhereInput
  }

  export type MessageListRelationFilter = {
    every?: MessageWhereInput
    some?: MessageWhereInput
    none?: MessageWhereInput
  }

  export type CrushListRelationFilter = {
    every?: CrushWhereInput
    some?: CrushWhereInput
    none?: CrushWhereInput
  }

  export type CloseFriendRequestListRelationFilter = {
    every?: CloseFriendRequestWhereInput
    some?: CloseFriendRequestWhereInput
    none?: CloseFriendRequestWhereInput
  }

  export type LanguageRoomListRelationFilter = {
    every?: LanguageRoomWhereInput
    some?: LanguageRoomWhereInput
    none?: LanguageRoomWhereInput
  }

  export type GroupListRelationFilter = {
    every?: GroupWhereInput
    some?: GroupWhereInput
    none?: GroupWhereInput
  }

  export type GroupMemberListRelationFilter = {
    every?: GroupMemberWhereInput
    some?: GroupMemberWhereInput
    none?: GroupMemberWhereInput
  }

  export type GroupMessageListRelationFilter = {
    every?: GroupMessageWhereInput
    some?: GroupMessageWhereInput
    none?: GroupMessageWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type PostOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CommentOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type FriendshipOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type MessageOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CrushOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CloseFriendRequestOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type LanguageRoomOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type GroupOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type GroupMemberOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type GroupMessageOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    password?: SortOrder
    googleId?: SortOrder
    bio?: SortOrder
    profilePicture?: SortOrder
    collegeName?: SortOrder
    department?: SortOrder
    yearOfStudy?: SortOrder
    phoneNumber?: SortOrder
    phoneVisibility?: SortOrder
    whatsappNumber?: SortOrder
    whatsappVisibility?: SortOrder
    instagramHandle?: SortOrder
    instagramVisibility?: SortOrder
    facebookUrl?: SortOrder
    facebookVisibility?: SortOrder
    snapchatUsername?: SortOrder
    snapchatVisibility?: SortOrder
    linkedinUrl?: SortOrder
    linkedinVisibility?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    password?: SortOrder
    googleId?: SortOrder
    bio?: SortOrder
    profilePicture?: SortOrder
    collegeName?: SortOrder
    department?: SortOrder
    yearOfStudy?: SortOrder
    phoneNumber?: SortOrder
    phoneVisibility?: SortOrder
    whatsappNumber?: SortOrder
    whatsappVisibility?: SortOrder
    instagramHandle?: SortOrder
    instagramVisibility?: SortOrder
    facebookUrl?: SortOrder
    facebookVisibility?: SortOrder
    snapchatUsername?: SortOrder
    snapchatVisibility?: SortOrder
    linkedinUrl?: SortOrder
    linkedinVisibility?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    password?: SortOrder
    googleId?: SortOrder
    bio?: SortOrder
    profilePicture?: SortOrder
    collegeName?: SortOrder
    department?: SortOrder
    yearOfStudy?: SortOrder
    phoneNumber?: SortOrder
    phoneVisibility?: SortOrder
    whatsappNumber?: SortOrder
    whatsappVisibility?: SortOrder
    instagramHandle?: SortOrder
    instagramVisibility?: SortOrder
    facebookUrl?: SortOrder
    facebookVisibility?: SortOrder
    snapchatUsername?: SortOrder
    snapchatVisibility?: SortOrder
    linkedinUrl?: SortOrder
    linkedinVisibility?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type UserScalarRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type UserListRelationFilter = {
    every?: UserWhereInput
    some?: UserWhereInput
    none?: UserWhereInput
  }

  export type UserOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type PostCountOrderByAggregateInput = {
    id?: SortOrder
    content?: SortOrder
    image?: SortOrder
    visibility?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    authorId?: SortOrder
  }

  export type PostAvgOrderByAggregateInput = {
    id?: SortOrder
    authorId?: SortOrder
  }

  export type PostMaxOrderByAggregateInput = {
    id?: SortOrder
    content?: SortOrder
    image?: SortOrder
    visibility?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    authorId?: SortOrder
  }

  export type PostMinOrderByAggregateInput = {
    id?: SortOrder
    content?: SortOrder
    image?: SortOrder
    visibility?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    authorId?: SortOrder
  }

  export type PostSumOrderByAggregateInput = {
    id?: SortOrder
    authorId?: SortOrder
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type FriendshipSenderIdReceiverIdCompoundUniqueInput = {
    senderId: number
    receiverId: number
  }

  export type FriendshipCountOrderByAggregateInput = {
    id?: SortOrder
    status?: SortOrder
    isCloseFriend?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    senderId?: SortOrder
    receiverId?: SortOrder
  }

  export type FriendshipAvgOrderByAggregateInput = {
    id?: SortOrder
    senderId?: SortOrder
    receiverId?: SortOrder
  }

  export type FriendshipMaxOrderByAggregateInput = {
    id?: SortOrder
    status?: SortOrder
    isCloseFriend?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    senderId?: SortOrder
    receiverId?: SortOrder
  }

  export type FriendshipMinOrderByAggregateInput = {
    id?: SortOrder
    status?: SortOrder
    isCloseFriend?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    senderId?: SortOrder
    receiverId?: SortOrder
  }

  export type FriendshipSumOrderByAggregateInput = {
    id?: SortOrder
    senderId?: SortOrder
    receiverId?: SortOrder
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type MessageCountOrderByAggregateInput = {
    id?: SortOrder
    content?: SortOrder
    isRead?: SortOrder
    createdAt?: SortOrder
    senderId?: SortOrder
    receiverId?: SortOrder
  }

  export type MessageAvgOrderByAggregateInput = {
    id?: SortOrder
    senderId?: SortOrder
    receiverId?: SortOrder
  }

  export type MessageMaxOrderByAggregateInput = {
    id?: SortOrder
    content?: SortOrder
    isRead?: SortOrder
    createdAt?: SortOrder
    senderId?: SortOrder
    receiverId?: SortOrder
  }

  export type MessageMinOrderByAggregateInput = {
    id?: SortOrder
    content?: SortOrder
    isRead?: SortOrder
    createdAt?: SortOrder
    senderId?: SortOrder
    receiverId?: SortOrder
  }

  export type MessageSumOrderByAggregateInput = {
    id?: SortOrder
    senderId?: SortOrder
    receiverId?: SortOrder
  }

  export type PostScalarRelationFilter = {
    is?: PostWhereInput
    isNot?: PostWhereInput
  }

  export type CommentCountOrderByAggregateInput = {
    id?: SortOrder
    content?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    postId?: SortOrder
    authorId?: SortOrder
  }

  export type CommentAvgOrderByAggregateInput = {
    id?: SortOrder
    postId?: SortOrder
    authorId?: SortOrder
  }

  export type CommentMaxOrderByAggregateInput = {
    id?: SortOrder
    content?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    postId?: SortOrder
    authorId?: SortOrder
  }

  export type CommentMinOrderByAggregateInput = {
    id?: SortOrder
    content?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    postId?: SortOrder
    authorId?: SortOrder
  }

  export type CommentSumOrderByAggregateInput = {
    id?: SortOrder
    postId?: SortOrder
    authorId?: SortOrder
  }

  export type CrushUserIdCrushIdCompoundUniqueInput = {
    userId: number
    crushId: number
  }

  export type CrushCountOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    userId?: SortOrder
    crushId?: SortOrder
  }

  export type CrushAvgOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    crushId?: SortOrder
  }

  export type CrushMaxOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    userId?: SortOrder
    crushId?: SortOrder
  }

  export type CrushMinOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    userId?: SortOrder
    crushId?: SortOrder
  }

  export type CrushSumOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    crushId?: SortOrder
  }

  export type CloseFriendRequestSenderIdReceiverIdCompoundUniqueInput = {
    senderId: number
    receiverId: number
  }

  export type CloseFriendRequestCountOrderByAggregateInput = {
    id?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    senderId?: SortOrder
    receiverId?: SortOrder
  }

  export type CloseFriendRequestAvgOrderByAggregateInput = {
    id?: SortOrder
    senderId?: SortOrder
    receiverId?: SortOrder
  }

  export type CloseFriendRequestMaxOrderByAggregateInput = {
    id?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    senderId?: SortOrder
    receiverId?: SortOrder
  }

  export type CloseFriendRequestMinOrderByAggregateInput = {
    id?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    senderId?: SortOrder
    receiverId?: SortOrder
  }

  export type CloseFriendRequestSumOrderByAggregateInput = {
    id?: SortOrder
    senderId?: SortOrder
    receiverId?: SortOrder
  }

  export type LanguageRoomCountOrderByAggregateInput = {
    id?: SortOrder
    roomName?: SortOrder
    topic?: SortOrder
    language?: SortOrder
    createdAt?: SortOrder
    creatorId?: SortOrder
  }

  export type LanguageRoomAvgOrderByAggregateInput = {
    id?: SortOrder
    creatorId?: SortOrder
  }

  export type LanguageRoomMaxOrderByAggregateInput = {
    id?: SortOrder
    roomName?: SortOrder
    topic?: SortOrder
    language?: SortOrder
    createdAt?: SortOrder
    creatorId?: SortOrder
  }

  export type LanguageRoomMinOrderByAggregateInput = {
    id?: SortOrder
    roomName?: SortOrder
    topic?: SortOrder
    language?: SortOrder
    createdAt?: SortOrder
    creatorId?: SortOrder
  }

  export type LanguageRoomSumOrderByAggregateInput = {
    id?: SortOrder
    creatorId?: SortOrder
  }

  export type GroupCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    isPrivate?: SortOrder
    entryKey?: SortOrder
    createdAt?: SortOrder
    creatorId?: SortOrder
  }

  export type GroupAvgOrderByAggregateInput = {
    id?: SortOrder
    creatorId?: SortOrder
  }

  export type GroupMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    isPrivate?: SortOrder
    entryKey?: SortOrder
    createdAt?: SortOrder
    creatorId?: SortOrder
  }

  export type GroupMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    description?: SortOrder
    isPrivate?: SortOrder
    entryKey?: SortOrder
    createdAt?: SortOrder
    creatorId?: SortOrder
  }

  export type GroupSumOrderByAggregateInput = {
    id?: SortOrder
    creatorId?: SortOrder
  }

  export type GroupScalarRelationFilter = {
    is?: GroupWhereInput
    isNot?: GroupWhereInput
  }

  export type GroupMemberGroupIdUserIdCompoundUniqueInput = {
    groupId: number
    userId: number
  }

  export type GroupMemberCountOrderByAggregateInput = {
    id?: SortOrder
    joinedAt?: SortOrder
    groupId?: SortOrder
    userId?: SortOrder
  }

  export type GroupMemberAvgOrderByAggregateInput = {
    id?: SortOrder
    groupId?: SortOrder
    userId?: SortOrder
  }

  export type GroupMemberMaxOrderByAggregateInput = {
    id?: SortOrder
    joinedAt?: SortOrder
    groupId?: SortOrder
    userId?: SortOrder
  }

  export type GroupMemberMinOrderByAggregateInput = {
    id?: SortOrder
    joinedAt?: SortOrder
    groupId?: SortOrder
    userId?: SortOrder
  }

  export type GroupMemberSumOrderByAggregateInput = {
    id?: SortOrder
    groupId?: SortOrder
    userId?: SortOrder
  }

  export type GroupMessageCountOrderByAggregateInput = {
    id?: SortOrder
    content?: SortOrder
    createdAt?: SortOrder
    groupId?: SortOrder
    senderId?: SortOrder
  }

  export type GroupMessageAvgOrderByAggregateInput = {
    id?: SortOrder
    groupId?: SortOrder
    senderId?: SortOrder
  }

  export type GroupMessageMaxOrderByAggregateInput = {
    id?: SortOrder
    content?: SortOrder
    createdAt?: SortOrder
    groupId?: SortOrder
    senderId?: SortOrder
  }

  export type GroupMessageMinOrderByAggregateInput = {
    id?: SortOrder
    content?: SortOrder
    createdAt?: SortOrder
    groupId?: SortOrder
    senderId?: SortOrder
  }

  export type GroupMessageSumOrderByAggregateInput = {
    id?: SortOrder
    groupId?: SortOrder
    senderId?: SortOrder
  }

  export type PostCreateNestedManyWithoutAuthorInput = {
    create?: XOR<PostCreateWithoutAuthorInput, PostUncheckedCreateWithoutAuthorInput> | PostCreateWithoutAuthorInput[] | PostUncheckedCreateWithoutAuthorInput[]
    connectOrCreate?: PostCreateOrConnectWithoutAuthorInput | PostCreateOrConnectWithoutAuthorInput[]
    createMany?: PostCreateManyAuthorInputEnvelope
    connect?: PostWhereUniqueInput | PostWhereUniqueInput[]
  }

  export type CommentCreateNestedManyWithoutAuthorInput = {
    create?: XOR<CommentCreateWithoutAuthorInput, CommentUncheckedCreateWithoutAuthorInput> | CommentCreateWithoutAuthorInput[] | CommentUncheckedCreateWithoutAuthorInput[]
    connectOrCreate?: CommentCreateOrConnectWithoutAuthorInput | CommentCreateOrConnectWithoutAuthorInput[]
    createMany?: CommentCreateManyAuthorInputEnvelope
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
  }

  export type PostCreateNestedManyWithoutLikesInput = {
    create?: XOR<PostCreateWithoutLikesInput, PostUncheckedCreateWithoutLikesInput> | PostCreateWithoutLikesInput[] | PostUncheckedCreateWithoutLikesInput[]
    connectOrCreate?: PostCreateOrConnectWithoutLikesInput | PostCreateOrConnectWithoutLikesInput[]
    connect?: PostWhereUniqueInput | PostWhereUniqueInput[]
  }

  export type FriendshipCreateNestedManyWithoutSenderInput = {
    create?: XOR<FriendshipCreateWithoutSenderInput, FriendshipUncheckedCreateWithoutSenderInput> | FriendshipCreateWithoutSenderInput[] | FriendshipUncheckedCreateWithoutSenderInput[]
    connectOrCreate?: FriendshipCreateOrConnectWithoutSenderInput | FriendshipCreateOrConnectWithoutSenderInput[]
    createMany?: FriendshipCreateManySenderInputEnvelope
    connect?: FriendshipWhereUniqueInput | FriendshipWhereUniqueInput[]
  }

  export type FriendshipCreateNestedManyWithoutReceiverInput = {
    create?: XOR<FriendshipCreateWithoutReceiverInput, FriendshipUncheckedCreateWithoutReceiverInput> | FriendshipCreateWithoutReceiverInput[] | FriendshipUncheckedCreateWithoutReceiverInput[]
    connectOrCreate?: FriendshipCreateOrConnectWithoutReceiverInput | FriendshipCreateOrConnectWithoutReceiverInput[]
    createMany?: FriendshipCreateManyReceiverInputEnvelope
    connect?: FriendshipWhereUniqueInput | FriendshipWhereUniqueInput[]
  }

  export type MessageCreateNestedManyWithoutSenderInput = {
    create?: XOR<MessageCreateWithoutSenderInput, MessageUncheckedCreateWithoutSenderInput> | MessageCreateWithoutSenderInput[] | MessageUncheckedCreateWithoutSenderInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutSenderInput | MessageCreateOrConnectWithoutSenderInput[]
    createMany?: MessageCreateManySenderInputEnvelope
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
  }

  export type MessageCreateNestedManyWithoutReceiverInput = {
    create?: XOR<MessageCreateWithoutReceiverInput, MessageUncheckedCreateWithoutReceiverInput> | MessageCreateWithoutReceiverInput[] | MessageUncheckedCreateWithoutReceiverInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutReceiverInput | MessageCreateOrConnectWithoutReceiverInput[]
    createMany?: MessageCreateManyReceiverInputEnvelope
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
  }

  export type CrushCreateNestedManyWithoutUserInput = {
    create?: XOR<CrushCreateWithoutUserInput, CrushUncheckedCreateWithoutUserInput> | CrushCreateWithoutUserInput[] | CrushUncheckedCreateWithoutUserInput[]
    connectOrCreate?: CrushCreateOrConnectWithoutUserInput | CrushCreateOrConnectWithoutUserInput[]
    createMany?: CrushCreateManyUserInputEnvelope
    connect?: CrushWhereUniqueInput | CrushWhereUniqueInput[]
  }

  export type CrushCreateNestedManyWithoutCrushInput = {
    create?: XOR<CrushCreateWithoutCrushInput, CrushUncheckedCreateWithoutCrushInput> | CrushCreateWithoutCrushInput[] | CrushUncheckedCreateWithoutCrushInput[]
    connectOrCreate?: CrushCreateOrConnectWithoutCrushInput | CrushCreateOrConnectWithoutCrushInput[]
    createMany?: CrushCreateManyCrushInputEnvelope
    connect?: CrushWhereUniqueInput | CrushWhereUniqueInput[]
  }

  export type CloseFriendRequestCreateNestedManyWithoutSenderInput = {
    create?: XOR<CloseFriendRequestCreateWithoutSenderInput, CloseFriendRequestUncheckedCreateWithoutSenderInput> | CloseFriendRequestCreateWithoutSenderInput[] | CloseFriendRequestUncheckedCreateWithoutSenderInput[]
    connectOrCreate?: CloseFriendRequestCreateOrConnectWithoutSenderInput | CloseFriendRequestCreateOrConnectWithoutSenderInput[]
    createMany?: CloseFriendRequestCreateManySenderInputEnvelope
    connect?: CloseFriendRequestWhereUniqueInput | CloseFriendRequestWhereUniqueInput[]
  }

  export type CloseFriendRequestCreateNestedManyWithoutReceiverInput = {
    create?: XOR<CloseFriendRequestCreateWithoutReceiverInput, CloseFriendRequestUncheckedCreateWithoutReceiverInput> | CloseFriendRequestCreateWithoutReceiverInput[] | CloseFriendRequestUncheckedCreateWithoutReceiverInput[]
    connectOrCreate?: CloseFriendRequestCreateOrConnectWithoutReceiverInput | CloseFriendRequestCreateOrConnectWithoutReceiverInput[]
    createMany?: CloseFriendRequestCreateManyReceiverInputEnvelope
    connect?: CloseFriendRequestWhereUniqueInput | CloseFriendRequestWhereUniqueInput[]
  }

  export type LanguageRoomCreateNestedManyWithoutCreatorInput = {
    create?: XOR<LanguageRoomCreateWithoutCreatorInput, LanguageRoomUncheckedCreateWithoutCreatorInput> | LanguageRoomCreateWithoutCreatorInput[] | LanguageRoomUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: LanguageRoomCreateOrConnectWithoutCreatorInput | LanguageRoomCreateOrConnectWithoutCreatorInput[]
    createMany?: LanguageRoomCreateManyCreatorInputEnvelope
    connect?: LanguageRoomWhereUniqueInput | LanguageRoomWhereUniqueInput[]
  }

  export type GroupCreateNestedManyWithoutCreatorInput = {
    create?: XOR<GroupCreateWithoutCreatorInput, GroupUncheckedCreateWithoutCreatorInput> | GroupCreateWithoutCreatorInput[] | GroupUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: GroupCreateOrConnectWithoutCreatorInput | GroupCreateOrConnectWithoutCreatorInput[]
    createMany?: GroupCreateManyCreatorInputEnvelope
    connect?: GroupWhereUniqueInput | GroupWhereUniqueInput[]
  }

  export type GroupMemberCreateNestedManyWithoutUserInput = {
    create?: XOR<GroupMemberCreateWithoutUserInput, GroupMemberUncheckedCreateWithoutUserInput> | GroupMemberCreateWithoutUserInput[] | GroupMemberUncheckedCreateWithoutUserInput[]
    connectOrCreate?: GroupMemberCreateOrConnectWithoutUserInput | GroupMemberCreateOrConnectWithoutUserInput[]
    createMany?: GroupMemberCreateManyUserInputEnvelope
    connect?: GroupMemberWhereUniqueInput | GroupMemberWhereUniqueInput[]
  }

  export type GroupMessageCreateNestedManyWithoutSenderInput = {
    create?: XOR<GroupMessageCreateWithoutSenderInput, GroupMessageUncheckedCreateWithoutSenderInput> | GroupMessageCreateWithoutSenderInput[] | GroupMessageUncheckedCreateWithoutSenderInput[]
    connectOrCreate?: GroupMessageCreateOrConnectWithoutSenderInput | GroupMessageCreateOrConnectWithoutSenderInput[]
    createMany?: GroupMessageCreateManySenderInputEnvelope
    connect?: GroupMessageWhereUniqueInput | GroupMessageWhereUniqueInput[]
  }

  export type PostUncheckedCreateNestedManyWithoutAuthorInput = {
    create?: XOR<PostCreateWithoutAuthorInput, PostUncheckedCreateWithoutAuthorInput> | PostCreateWithoutAuthorInput[] | PostUncheckedCreateWithoutAuthorInput[]
    connectOrCreate?: PostCreateOrConnectWithoutAuthorInput | PostCreateOrConnectWithoutAuthorInput[]
    createMany?: PostCreateManyAuthorInputEnvelope
    connect?: PostWhereUniqueInput | PostWhereUniqueInput[]
  }

  export type CommentUncheckedCreateNestedManyWithoutAuthorInput = {
    create?: XOR<CommentCreateWithoutAuthorInput, CommentUncheckedCreateWithoutAuthorInput> | CommentCreateWithoutAuthorInput[] | CommentUncheckedCreateWithoutAuthorInput[]
    connectOrCreate?: CommentCreateOrConnectWithoutAuthorInput | CommentCreateOrConnectWithoutAuthorInput[]
    createMany?: CommentCreateManyAuthorInputEnvelope
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
  }

  export type PostUncheckedCreateNestedManyWithoutLikesInput = {
    create?: XOR<PostCreateWithoutLikesInput, PostUncheckedCreateWithoutLikesInput> | PostCreateWithoutLikesInput[] | PostUncheckedCreateWithoutLikesInput[]
    connectOrCreate?: PostCreateOrConnectWithoutLikesInput | PostCreateOrConnectWithoutLikesInput[]
    connect?: PostWhereUniqueInput | PostWhereUniqueInput[]
  }

  export type FriendshipUncheckedCreateNestedManyWithoutSenderInput = {
    create?: XOR<FriendshipCreateWithoutSenderInput, FriendshipUncheckedCreateWithoutSenderInput> | FriendshipCreateWithoutSenderInput[] | FriendshipUncheckedCreateWithoutSenderInput[]
    connectOrCreate?: FriendshipCreateOrConnectWithoutSenderInput | FriendshipCreateOrConnectWithoutSenderInput[]
    createMany?: FriendshipCreateManySenderInputEnvelope
    connect?: FriendshipWhereUniqueInput | FriendshipWhereUniqueInput[]
  }

  export type FriendshipUncheckedCreateNestedManyWithoutReceiverInput = {
    create?: XOR<FriendshipCreateWithoutReceiverInput, FriendshipUncheckedCreateWithoutReceiverInput> | FriendshipCreateWithoutReceiverInput[] | FriendshipUncheckedCreateWithoutReceiverInput[]
    connectOrCreate?: FriendshipCreateOrConnectWithoutReceiverInput | FriendshipCreateOrConnectWithoutReceiverInput[]
    createMany?: FriendshipCreateManyReceiverInputEnvelope
    connect?: FriendshipWhereUniqueInput | FriendshipWhereUniqueInput[]
  }

  export type MessageUncheckedCreateNestedManyWithoutSenderInput = {
    create?: XOR<MessageCreateWithoutSenderInput, MessageUncheckedCreateWithoutSenderInput> | MessageCreateWithoutSenderInput[] | MessageUncheckedCreateWithoutSenderInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutSenderInput | MessageCreateOrConnectWithoutSenderInput[]
    createMany?: MessageCreateManySenderInputEnvelope
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
  }

  export type MessageUncheckedCreateNestedManyWithoutReceiverInput = {
    create?: XOR<MessageCreateWithoutReceiverInput, MessageUncheckedCreateWithoutReceiverInput> | MessageCreateWithoutReceiverInput[] | MessageUncheckedCreateWithoutReceiverInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutReceiverInput | MessageCreateOrConnectWithoutReceiverInput[]
    createMany?: MessageCreateManyReceiverInputEnvelope
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
  }

  export type CrushUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<CrushCreateWithoutUserInput, CrushUncheckedCreateWithoutUserInput> | CrushCreateWithoutUserInput[] | CrushUncheckedCreateWithoutUserInput[]
    connectOrCreate?: CrushCreateOrConnectWithoutUserInput | CrushCreateOrConnectWithoutUserInput[]
    createMany?: CrushCreateManyUserInputEnvelope
    connect?: CrushWhereUniqueInput | CrushWhereUniqueInput[]
  }

  export type CrushUncheckedCreateNestedManyWithoutCrushInput = {
    create?: XOR<CrushCreateWithoutCrushInput, CrushUncheckedCreateWithoutCrushInput> | CrushCreateWithoutCrushInput[] | CrushUncheckedCreateWithoutCrushInput[]
    connectOrCreate?: CrushCreateOrConnectWithoutCrushInput | CrushCreateOrConnectWithoutCrushInput[]
    createMany?: CrushCreateManyCrushInputEnvelope
    connect?: CrushWhereUniqueInput | CrushWhereUniqueInput[]
  }

  export type CloseFriendRequestUncheckedCreateNestedManyWithoutSenderInput = {
    create?: XOR<CloseFriendRequestCreateWithoutSenderInput, CloseFriendRequestUncheckedCreateWithoutSenderInput> | CloseFriendRequestCreateWithoutSenderInput[] | CloseFriendRequestUncheckedCreateWithoutSenderInput[]
    connectOrCreate?: CloseFriendRequestCreateOrConnectWithoutSenderInput | CloseFriendRequestCreateOrConnectWithoutSenderInput[]
    createMany?: CloseFriendRequestCreateManySenderInputEnvelope
    connect?: CloseFriendRequestWhereUniqueInput | CloseFriendRequestWhereUniqueInput[]
  }

  export type CloseFriendRequestUncheckedCreateNestedManyWithoutReceiverInput = {
    create?: XOR<CloseFriendRequestCreateWithoutReceiverInput, CloseFriendRequestUncheckedCreateWithoutReceiverInput> | CloseFriendRequestCreateWithoutReceiverInput[] | CloseFriendRequestUncheckedCreateWithoutReceiverInput[]
    connectOrCreate?: CloseFriendRequestCreateOrConnectWithoutReceiverInput | CloseFriendRequestCreateOrConnectWithoutReceiverInput[]
    createMany?: CloseFriendRequestCreateManyReceiverInputEnvelope
    connect?: CloseFriendRequestWhereUniqueInput | CloseFriendRequestWhereUniqueInput[]
  }

  export type LanguageRoomUncheckedCreateNestedManyWithoutCreatorInput = {
    create?: XOR<LanguageRoomCreateWithoutCreatorInput, LanguageRoomUncheckedCreateWithoutCreatorInput> | LanguageRoomCreateWithoutCreatorInput[] | LanguageRoomUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: LanguageRoomCreateOrConnectWithoutCreatorInput | LanguageRoomCreateOrConnectWithoutCreatorInput[]
    createMany?: LanguageRoomCreateManyCreatorInputEnvelope
    connect?: LanguageRoomWhereUniqueInput | LanguageRoomWhereUniqueInput[]
  }

  export type GroupUncheckedCreateNestedManyWithoutCreatorInput = {
    create?: XOR<GroupCreateWithoutCreatorInput, GroupUncheckedCreateWithoutCreatorInput> | GroupCreateWithoutCreatorInput[] | GroupUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: GroupCreateOrConnectWithoutCreatorInput | GroupCreateOrConnectWithoutCreatorInput[]
    createMany?: GroupCreateManyCreatorInputEnvelope
    connect?: GroupWhereUniqueInput | GroupWhereUniqueInput[]
  }

  export type GroupMemberUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<GroupMemberCreateWithoutUserInput, GroupMemberUncheckedCreateWithoutUserInput> | GroupMemberCreateWithoutUserInput[] | GroupMemberUncheckedCreateWithoutUserInput[]
    connectOrCreate?: GroupMemberCreateOrConnectWithoutUserInput | GroupMemberCreateOrConnectWithoutUserInput[]
    createMany?: GroupMemberCreateManyUserInputEnvelope
    connect?: GroupMemberWhereUniqueInput | GroupMemberWhereUniqueInput[]
  }

  export type GroupMessageUncheckedCreateNestedManyWithoutSenderInput = {
    create?: XOR<GroupMessageCreateWithoutSenderInput, GroupMessageUncheckedCreateWithoutSenderInput> | GroupMessageCreateWithoutSenderInput[] | GroupMessageUncheckedCreateWithoutSenderInput[]
    connectOrCreate?: GroupMessageCreateOrConnectWithoutSenderInput | GroupMessageCreateOrConnectWithoutSenderInput[]
    createMany?: GroupMessageCreateManySenderInputEnvelope
    connect?: GroupMessageWhereUniqueInput | GroupMessageWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type PostUpdateManyWithoutAuthorNestedInput = {
    create?: XOR<PostCreateWithoutAuthorInput, PostUncheckedCreateWithoutAuthorInput> | PostCreateWithoutAuthorInput[] | PostUncheckedCreateWithoutAuthorInput[]
    connectOrCreate?: PostCreateOrConnectWithoutAuthorInput | PostCreateOrConnectWithoutAuthorInput[]
    upsert?: PostUpsertWithWhereUniqueWithoutAuthorInput | PostUpsertWithWhereUniqueWithoutAuthorInput[]
    createMany?: PostCreateManyAuthorInputEnvelope
    set?: PostWhereUniqueInput | PostWhereUniqueInput[]
    disconnect?: PostWhereUniqueInput | PostWhereUniqueInput[]
    delete?: PostWhereUniqueInput | PostWhereUniqueInput[]
    connect?: PostWhereUniqueInput | PostWhereUniqueInput[]
    update?: PostUpdateWithWhereUniqueWithoutAuthorInput | PostUpdateWithWhereUniqueWithoutAuthorInput[]
    updateMany?: PostUpdateManyWithWhereWithoutAuthorInput | PostUpdateManyWithWhereWithoutAuthorInput[]
    deleteMany?: PostScalarWhereInput | PostScalarWhereInput[]
  }

  export type CommentUpdateManyWithoutAuthorNestedInput = {
    create?: XOR<CommentCreateWithoutAuthorInput, CommentUncheckedCreateWithoutAuthorInput> | CommentCreateWithoutAuthorInput[] | CommentUncheckedCreateWithoutAuthorInput[]
    connectOrCreate?: CommentCreateOrConnectWithoutAuthorInput | CommentCreateOrConnectWithoutAuthorInput[]
    upsert?: CommentUpsertWithWhereUniqueWithoutAuthorInput | CommentUpsertWithWhereUniqueWithoutAuthorInput[]
    createMany?: CommentCreateManyAuthorInputEnvelope
    set?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    disconnect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    delete?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    update?: CommentUpdateWithWhereUniqueWithoutAuthorInput | CommentUpdateWithWhereUniqueWithoutAuthorInput[]
    updateMany?: CommentUpdateManyWithWhereWithoutAuthorInput | CommentUpdateManyWithWhereWithoutAuthorInput[]
    deleteMany?: CommentScalarWhereInput | CommentScalarWhereInput[]
  }

  export type PostUpdateManyWithoutLikesNestedInput = {
    create?: XOR<PostCreateWithoutLikesInput, PostUncheckedCreateWithoutLikesInput> | PostCreateWithoutLikesInput[] | PostUncheckedCreateWithoutLikesInput[]
    connectOrCreate?: PostCreateOrConnectWithoutLikesInput | PostCreateOrConnectWithoutLikesInput[]
    upsert?: PostUpsertWithWhereUniqueWithoutLikesInput | PostUpsertWithWhereUniqueWithoutLikesInput[]
    set?: PostWhereUniqueInput | PostWhereUniqueInput[]
    disconnect?: PostWhereUniqueInput | PostWhereUniqueInput[]
    delete?: PostWhereUniqueInput | PostWhereUniqueInput[]
    connect?: PostWhereUniqueInput | PostWhereUniqueInput[]
    update?: PostUpdateWithWhereUniqueWithoutLikesInput | PostUpdateWithWhereUniqueWithoutLikesInput[]
    updateMany?: PostUpdateManyWithWhereWithoutLikesInput | PostUpdateManyWithWhereWithoutLikesInput[]
    deleteMany?: PostScalarWhereInput | PostScalarWhereInput[]
  }

  export type FriendshipUpdateManyWithoutSenderNestedInput = {
    create?: XOR<FriendshipCreateWithoutSenderInput, FriendshipUncheckedCreateWithoutSenderInput> | FriendshipCreateWithoutSenderInput[] | FriendshipUncheckedCreateWithoutSenderInput[]
    connectOrCreate?: FriendshipCreateOrConnectWithoutSenderInput | FriendshipCreateOrConnectWithoutSenderInput[]
    upsert?: FriendshipUpsertWithWhereUniqueWithoutSenderInput | FriendshipUpsertWithWhereUniqueWithoutSenderInput[]
    createMany?: FriendshipCreateManySenderInputEnvelope
    set?: FriendshipWhereUniqueInput | FriendshipWhereUniqueInput[]
    disconnect?: FriendshipWhereUniqueInput | FriendshipWhereUniqueInput[]
    delete?: FriendshipWhereUniqueInput | FriendshipWhereUniqueInput[]
    connect?: FriendshipWhereUniqueInput | FriendshipWhereUniqueInput[]
    update?: FriendshipUpdateWithWhereUniqueWithoutSenderInput | FriendshipUpdateWithWhereUniqueWithoutSenderInput[]
    updateMany?: FriendshipUpdateManyWithWhereWithoutSenderInput | FriendshipUpdateManyWithWhereWithoutSenderInput[]
    deleteMany?: FriendshipScalarWhereInput | FriendshipScalarWhereInput[]
  }

  export type FriendshipUpdateManyWithoutReceiverNestedInput = {
    create?: XOR<FriendshipCreateWithoutReceiverInput, FriendshipUncheckedCreateWithoutReceiverInput> | FriendshipCreateWithoutReceiverInput[] | FriendshipUncheckedCreateWithoutReceiverInput[]
    connectOrCreate?: FriendshipCreateOrConnectWithoutReceiverInput | FriendshipCreateOrConnectWithoutReceiverInput[]
    upsert?: FriendshipUpsertWithWhereUniqueWithoutReceiverInput | FriendshipUpsertWithWhereUniqueWithoutReceiverInput[]
    createMany?: FriendshipCreateManyReceiverInputEnvelope
    set?: FriendshipWhereUniqueInput | FriendshipWhereUniqueInput[]
    disconnect?: FriendshipWhereUniqueInput | FriendshipWhereUniqueInput[]
    delete?: FriendshipWhereUniqueInput | FriendshipWhereUniqueInput[]
    connect?: FriendshipWhereUniqueInput | FriendshipWhereUniqueInput[]
    update?: FriendshipUpdateWithWhereUniqueWithoutReceiverInput | FriendshipUpdateWithWhereUniqueWithoutReceiverInput[]
    updateMany?: FriendshipUpdateManyWithWhereWithoutReceiverInput | FriendshipUpdateManyWithWhereWithoutReceiverInput[]
    deleteMany?: FriendshipScalarWhereInput | FriendshipScalarWhereInput[]
  }

  export type MessageUpdateManyWithoutSenderNestedInput = {
    create?: XOR<MessageCreateWithoutSenderInput, MessageUncheckedCreateWithoutSenderInput> | MessageCreateWithoutSenderInput[] | MessageUncheckedCreateWithoutSenderInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutSenderInput | MessageCreateOrConnectWithoutSenderInput[]
    upsert?: MessageUpsertWithWhereUniqueWithoutSenderInput | MessageUpsertWithWhereUniqueWithoutSenderInput[]
    createMany?: MessageCreateManySenderInputEnvelope
    set?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    disconnect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    delete?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    update?: MessageUpdateWithWhereUniqueWithoutSenderInput | MessageUpdateWithWhereUniqueWithoutSenderInput[]
    updateMany?: MessageUpdateManyWithWhereWithoutSenderInput | MessageUpdateManyWithWhereWithoutSenderInput[]
    deleteMany?: MessageScalarWhereInput | MessageScalarWhereInput[]
  }

  export type MessageUpdateManyWithoutReceiverNestedInput = {
    create?: XOR<MessageCreateWithoutReceiverInput, MessageUncheckedCreateWithoutReceiverInput> | MessageCreateWithoutReceiverInput[] | MessageUncheckedCreateWithoutReceiverInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutReceiverInput | MessageCreateOrConnectWithoutReceiverInput[]
    upsert?: MessageUpsertWithWhereUniqueWithoutReceiverInput | MessageUpsertWithWhereUniqueWithoutReceiverInput[]
    createMany?: MessageCreateManyReceiverInputEnvelope
    set?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    disconnect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    delete?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    update?: MessageUpdateWithWhereUniqueWithoutReceiverInput | MessageUpdateWithWhereUniqueWithoutReceiverInput[]
    updateMany?: MessageUpdateManyWithWhereWithoutReceiverInput | MessageUpdateManyWithWhereWithoutReceiverInput[]
    deleteMany?: MessageScalarWhereInput | MessageScalarWhereInput[]
  }

  export type CrushUpdateManyWithoutUserNestedInput = {
    create?: XOR<CrushCreateWithoutUserInput, CrushUncheckedCreateWithoutUserInput> | CrushCreateWithoutUserInput[] | CrushUncheckedCreateWithoutUserInput[]
    connectOrCreate?: CrushCreateOrConnectWithoutUserInput | CrushCreateOrConnectWithoutUserInput[]
    upsert?: CrushUpsertWithWhereUniqueWithoutUserInput | CrushUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: CrushCreateManyUserInputEnvelope
    set?: CrushWhereUniqueInput | CrushWhereUniqueInput[]
    disconnect?: CrushWhereUniqueInput | CrushWhereUniqueInput[]
    delete?: CrushWhereUniqueInput | CrushWhereUniqueInput[]
    connect?: CrushWhereUniqueInput | CrushWhereUniqueInput[]
    update?: CrushUpdateWithWhereUniqueWithoutUserInput | CrushUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: CrushUpdateManyWithWhereWithoutUserInput | CrushUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: CrushScalarWhereInput | CrushScalarWhereInput[]
  }

  export type CrushUpdateManyWithoutCrushNestedInput = {
    create?: XOR<CrushCreateWithoutCrushInput, CrushUncheckedCreateWithoutCrushInput> | CrushCreateWithoutCrushInput[] | CrushUncheckedCreateWithoutCrushInput[]
    connectOrCreate?: CrushCreateOrConnectWithoutCrushInput | CrushCreateOrConnectWithoutCrushInput[]
    upsert?: CrushUpsertWithWhereUniqueWithoutCrushInput | CrushUpsertWithWhereUniqueWithoutCrushInput[]
    createMany?: CrushCreateManyCrushInputEnvelope
    set?: CrushWhereUniqueInput | CrushWhereUniqueInput[]
    disconnect?: CrushWhereUniqueInput | CrushWhereUniqueInput[]
    delete?: CrushWhereUniqueInput | CrushWhereUniqueInput[]
    connect?: CrushWhereUniqueInput | CrushWhereUniqueInput[]
    update?: CrushUpdateWithWhereUniqueWithoutCrushInput | CrushUpdateWithWhereUniqueWithoutCrushInput[]
    updateMany?: CrushUpdateManyWithWhereWithoutCrushInput | CrushUpdateManyWithWhereWithoutCrushInput[]
    deleteMany?: CrushScalarWhereInput | CrushScalarWhereInput[]
  }

  export type CloseFriendRequestUpdateManyWithoutSenderNestedInput = {
    create?: XOR<CloseFriendRequestCreateWithoutSenderInput, CloseFriendRequestUncheckedCreateWithoutSenderInput> | CloseFriendRequestCreateWithoutSenderInput[] | CloseFriendRequestUncheckedCreateWithoutSenderInput[]
    connectOrCreate?: CloseFriendRequestCreateOrConnectWithoutSenderInput | CloseFriendRequestCreateOrConnectWithoutSenderInput[]
    upsert?: CloseFriendRequestUpsertWithWhereUniqueWithoutSenderInput | CloseFriendRequestUpsertWithWhereUniqueWithoutSenderInput[]
    createMany?: CloseFriendRequestCreateManySenderInputEnvelope
    set?: CloseFriendRequestWhereUniqueInput | CloseFriendRequestWhereUniqueInput[]
    disconnect?: CloseFriendRequestWhereUniqueInput | CloseFriendRequestWhereUniqueInput[]
    delete?: CloseFriendRequestWhereUniqueInput | CloseFriendRequestWhereUniqueInput[]
    connect?: CloseFriendRequestWhereUniqueInput | CloseFriendRequestWhereUniqueInput[]
    update?: CloseFriendRequestUpdateWithWhereUniqueWithoutSenderInput | CloseFriendRequestUpdateWithWhereUniqueWithoutSenderInput[]
    updateMany?: CloseFriendRequestUpdateManyWithWhereWithoutSenderInput | CloseFriendRequestUpdateManyWithWhereWithoutSenderInput[]
    deleteMany?: CloseFriendRequestScalarWhereInput | CloseFriendRequestScalarWhereInput[]
  }

  export type CloseFriendRequestUpdateManyWithoutReceiverNestedInput = {
    create?: XOR<CloseFriendRequestCreateWithoutReceiverInput, CloseFriendRequestUncheckedCreateWithoutReceiverInput> | CloseFriendRequestCreateWithoutReceiverInput[] | CloseFriendRequestUncheckedCreateWithoutReceiverInput[]
    connectOrCreate?: CloseFriendRequestCreateOrConnectWithoutReceiverInput | CloseFriendRequestCreateOrConnectWithoutReceiverInput[]
    upsert?: CloseFriendRequestUpsertWithWhereUniqueWithoutReceiverInput | CloseFriendRequestUpsertWithWhereUniqueWithoutReceiverInput[]
    createMany?: CloseFriendRequestCreateManyReceiverInputEnvelope
    set?: CloseFriendRequestWhereUniqueInput | CloseFriendRequestWhereUniqueInput[]
    disconnect?: CloseFriendRequestWhereUniqueInput | CloseFriendRequestWhereUniqueInput[]
    delete?: CloseFriendRequestWhereUniqueInput | CloseFriendRequestWhereUniqueInput[]
    connect?: CloseFriendRequestWhereUniqueInput | CloseFriendRequestWhereUniqueInput[]
    update?: CloseFriendRequestUpdateWithWhereUniqueWithoutReceiverInput | CloseFriendRequestUpdateWithWhereUniqueWithoutReceiverInput[]
    updateMany?: CloseFriendRequestUpdateManyWithWhereWithoutReceiverInput | CloseFriendRequestUpdateManyWithWhereWithoutReceiverInput[]
    deleteMany?: CloseFriendRequestScalarWhereInput | CloseFriendRequestScalarWhereInput[]
  }

  export type LanguageRoomUpdateManyWithoutCreatorNestedInput = {
    create?: XOR<LanguageRoomCreateWithoutCreatorInput, LanguageRoomUncheckedCreateWithoutCreatorInput> | LanguageRoomCreateWithoutCreatorInput[] | LanguageRoomUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: LanguageRoomCreateOrConnectWithoutCreatorInput | LanguageRoomCreateOrConnectWithoutCreatorInput[]
    upsert?: LanguageRoomUpsertWithWhereUniqueWithoutCreatorInput | LanguageRoomUpsertWithWhereUniqueWithoutCreatorInput[]
    createMany?: LanguageRoomCreateManyCreatorInputEnvelope
    set?: LanguageRoomWhereUniqueInput | LanguageRoomWhereUniqueInput[]
    disconnect?: LanguageRoomWhereUniqueInput | LanguageRoomWhereUniqueInput[]
    delete?: LanguageRoomWhereUniqueInput | LanguageRoomWhereUniqueInput[]
    connect?: LanguageRoomWhereUniqueInput | LanguageRoomWhereUniqueInput[]
    update?: LanguageRoomUpdateWithWhereUniqueWithoutCreatorInput | LanguageRoomUpdateWithWhereUniqueWithoutCreatorInput[]
    updateMany?: LanguageRoomUpdateManyWithWhereWithoutCreatorInput | LanguageRoomUpdateManyWithWhereWithoutCreatorInput[]
    deleteMany?: LanguageRoomScalarWhereInput | LanguageRoomScalarWhereInput[]
  }

  export type GroupUpdateManyWithoutCreatorNestedInput = {
    create?: XOR<GroupCreateWithoutCreatorInput, GroupUncheckedCreateWithoutCreatorInput> | GroupCreateWithoutCreatorInput[] | GroupUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: GroupCreateOrConnectWithoutCreatorInput | GroupCreateOrConnectWithoutCreatorInput[]
    upsert?: GroupUpsertWithWhereUniqueWithoutCreatorInput | GroupUpsertWithWhereUniqueWithoutCreatorInput[]
    createMany?: GroupCreateManyCreatorInputEnvelope
    set?: GroupWhereUniqueInput | GroupWhereUniqueInput[]
    disconnect?: GroupWhereUniqueInput | GroupWhereUniqueInput[]
    delete?: GroupWhereUniqueInput | GroupWhereUniqueInput[]
    connect?: GroupWhereUniqueInput | GroupWhereUniqueInput[]
    update?: GroupUpdateWithWhereUniqueWithoutCreatorInput | GroupUpdateWithWhereUniqueWithoutCreatorInput[]
    updateMany?: GroupUpdateManyWithWhereWithoutCreatorInput | GroupUpdateManyWithWhereWithoutCreatorInput[]
    deleteMany?: GroupScalarWhereInput | GroupScalarWhereInput[]
  }

  export type GroupMemberUpdateManyWithoutUserNestedInput = {
    create?: XOR<GroupMemberCreateWithoutUserInput, GroupMemberUncheckedCreateWithoutUserInput> | GroupMemberCreateWithoutUserInput[] | GroupMemberUncheckedCreateWithoutUserInput[]
    connectOrCreate?: GroupMemberCreateOrConnectWithoutUserInput | GroupMemberCreateOrConnectWithoutUserInput[]
    upsert?: GroupMemberUpsertWithWhereUniqueWithoutUserInput | GroupMemberUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: GroupMemberCreateManyUserInputEnvelope
    set?: GroupMemberWhereUniqueInput | GroupMemberWhereUniqueInput[]
    disconnect?: GroupMemberWhereUniqueInput | GroupMemberWhereUniqueInput[]
    delete?: GroupMemberWhereUniqueInput | GroupMemberWhereUniqueInput[]
    connect?: GroupMemberWhereUniqueInput | GroupMemberWhereUniqueInput[]
    update?: GroupMemberUpdateWithWhereUniqueWithoutUserInput | GroupMemberUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: GroupMemberUpdateManyWithWhereWithoutUserInput | GroupMemberUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: GroupMemberScalarWhereInput | GroupMemberScalarWhereInput[]
  }

  export type GroupMessageUpdateManyWithoutSenderNestedInput = {
    create?: XOR<GroupMessageCreateWithoutSenderInput, GroupMessageUncheckedCreateWithoutSenderInput> | GroupMessageCreateWithoutSenderInput[] | GroupMessageUncheckedCreateWithoutSenderInput[]
    connectOrCreate?: GroupMessageCreateOrConnectWithoutSenderInput | GroupMessageCreateOrConnectWithoutSenderInput[]
    upsert?: GroupMessageUpsertWithWhereUniqueWithoutSenderInput | GroupMessageUpsertWithWhereUniqueWithoutSenderInput[]
    createMany?: GroupMessageCreateManySenderInputEnvelope
    set?: GroupMessageWhereUniqueInput | GroupMessageWhereUniqueInput[]
    disconnect?: GroupMessageWhereUniqueInput | GroupMessageWhereUniqueInput[]
    delete?: GroupMessageWhereUniqueInput | GroupMessageWhereUniqueInput[]
    connect?: GroupMessageWhereUniqueInput | GroupMessageWhereUniqueInput[]
    update?: GroupMessageUpdateWithWhereUniqueWithoutSenderInput | GroupMessageUpdateWithWhereUniqueWithoutSenderInput[]
    updateMany?: GroupMessageUpdateManyWithWhereWithoutSenderInput | GroupMessageUpdateManyWithWhereWithoutSenderInput[]
    deleteMany?: GroupMessageScalarWhereInput | GroupMessageScalarWhereInput[]
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type PostUncheckedUpdateManyWithoutAuthorNestedInput = {
    create?: XOR<PostCreateWithoutAuthorInput, PostUncheckedCreateWithoutAuthorInput> | PostCreateWithoutAuthorInput[] | PostUncheckedCreateWithoutAuthorInput[]
    connectOrCreate?: PostCreateOrConnectWithoutAuthorInput | PostCreateOrConnectWithoutAuthorInput[]
    upsert?: PostUpsertWithWhereUniqueWithoutAuthorInput | PostUpsertWithWhereUniqueWithoutAuthorInput[]
    createMany?: PostCreateManyAuthorInputEnvelope
    set?: PostWhereUniqueInput | PostWhereUniqueInput[]
    disconnect?: PostWhereUniqueInput | PostWhereUniqueInput[]
    delete?: PostWhereUniqueInput | PostWhereUniqueInput[]
    connect?: PostWhereUniqueInput | PostWhereUniqueInput[]
    update?: PostUpdateWithWhereUniqueWithoutAuthorInput | PostUpdateWithWhereUniqueWithoutAuthorInput[]
    updateMany?: PostUpdateManyWithWhereWithoutAuthorInput | PostUpdateManyWithWhereWithoutAuthorInput[]
    deleteMany?: PostScalarWhereInput | PostScalarWhereInput[]
  }

  export type CommentUncheckedUpdateManyWithoutAuthorNestedInput = {
    create?: XOR<CommentCreateWithoutAuthorInput, CommentUncheckedCreateWithoutAuthorInput> | CommentCreateWithoutAuthorInput[] | CommentUncheckedCreateWithoutAuthorInput[]
    connectOrCreate?: CommentCreateOrConnectWithoutAuthorInput | CommentCreateOrConnectWithoutAuthorInput[]
    upsert?: CommentUpsertWithWhereUniqueWithoutAuthorInput | CommentUpsertWithWhereUniqueWithoutAuthorInput[]
    createMany?: CommentCreateManyAuthorInputEnvelope
    set?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    disconnect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    delete?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    update?: CommentUpdateWithWhereUniqueWithoutAuthorInput | CommentUpdateWithWhereUniqueWithoutAuthorInput[]
    updateMany?: CommentUpdateManyWithWhereWithoutAuthorInput | CommentUpdateManyWithWhereWithoutAuthorInput[]
    deleteMany?: CommentScalarWhereInput | CommentScalarWhereInput[]
  }

  export type PostUncheckedUpdateManyWithoutLikesNestedInput = {
    create?: XOR<PostCreateWithoutLikesInput, PostUncheckedCreateWithoutLikesInput> | PostCreateWithoutLikesInput[] | PostUncheckedCreateWithoutLikesInput[]
    connectOrCreate?: PostCreateOrConnectWithoutLikesInput | PostCreateOrConnectWithoutLikesInput[]
    upsert?: PostUpsertWithWhereUniqueWithoutLikesInput | PostUpsertWithWhereUniqueWithoutLikesInput[]
    set?: PostWhereUniqueInput | PostWhereUniqueInput[]
    disconnect?: PostWhereUniqueInput | PostWhereUniqueInput[]
    delete?: PostWhereUniqueInput | PostWhereUniqueInput[]
    connect?: PostWhereUniqueInput | PostWhereUniqueInput[]
    update?: PostUpdateWithWhereUniqueWithoutLikesInput | PostUpdateWithWhereUniqueWithoutLikesInput[]
    updateMany?: PostUpdateManyWithWhereWithoutLikesInput | PostUpdateManyWithWhereWithoutLikesInput[]
    deleteMany?: PostScalarWhereInput | PostScalarWhereInput[]
  }

  export type FriendshipUncheckedUpdateManyWithoutSenderNestedInput = {
    create?: XOR<FriendshipCreateWithoutSenderInput, FriendshipUncheckedCreateWithoutSenderInput> | FriendshipCreateWithoutSenderInput[] | FriendshipUncheckedCreateWithoutSenderInput[]
    connectOrCreate?: FriendshipCreateOrConnectWithoutSenderInput | FriendshipCreateOrConnectWithoutSenderInput[]
    upsert?: FriendshipUpsertWithWhereUniqueWithoutSenderInput | FriendshipUpsertWithWhereUniqueWithoutSenderInput[]
    createMany?: FriendshipCreateManySenderInputEnvelope
    set?: FriendshipWhereUniqueInput | FriendshipWhereUniqueInput[]
    disconnect?: FriendshipWhereUniqueInput | FriendshipWhereUniqueInput[]
    delete?: FriendshipWhereUniqueInput | FriendshipWhereUniqueInput[]
    connect?: FriendshipWhereUniqueInput | FriendshipWhereUniqueInput[]
    update?: FriendshipUpdateWithWhereUniqueWithoutSenderInput | FriendshipUpdateWithWhereUniqueWithoutSenderInput[]
    updateMany?: FriendshipUpdateManyWithWhereWithoutSenderInput | FriendshipUpdateManyWithWhereWithoutSenderInput[]
    deleteMany?: FriendshipScalarWhereInput | FriendshipScalarWhereInput[]
  }

  export type FriendshipUncheckedUpdateManyWithoutReceiverNestedInput = {
    create?: XOR<FriendshipCreateWithoutReceiverInput, FriendshipUncheckedCreateWithoutReceiverInput> | FriendshipCreateWithoutReceiverInput[] | FriendshipUncheckedCreateWithoutReceiverInput[]
    connectOrCreate?: FriendshipCreateOrConnectWithoutReceiverInput | FriendshipCreateOrConnectWithoutReceiverInput[]
    upsert?: FriendshipUpsertWithWhereUniqueWithoutReceiverInput | FriendshipUpsertWithWhereUniqueWithoutReceiverInput[]
    createMany?: FriendshipCreateManyReceiverInputEnvelope
    set?: FriendshipWhereUniqueInput | FriendshipWhereUniqueInput[]
    disconnect?: FriendshipWhereUniqueInput | FriendshipWhereUniqueInput[]
    delete?: FriendshipWhereUniqueInput | FriendshipWhereUniqueInput[]
    connect?: FriendshipWhereUniqueInput | FriendshipWhereUniqueInput[]
    update?: FriendshipUpdateWithWhereUniqueWithoutReceiverInput | FriendshipUpdateWithWhereUniqueWithoutReceiverInput[]
    updateMany?: FriendshipUpdateManyWithWhereWithoutReceiverInput | FriendshipUpdateManyWithWhereWithoutReceiverInput[]
    deleteMany?: FriendshipScalarWhereInput | FriendshipScalarWhereInput[]
  }

  export type MessageUncheckedUpdateManyWithoutSenderNestedInput = {
    create?: XOR<MessageCreateWithoutSenderInput, MessageUncheckedCreateWithoutSenderInput> | MessageCreateWithoutSenderInput[] | MessageUncheckedCreateWithoutSenderInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutSenderInput | MessageCreateOrConnectWithoutSenderInput[]
    upsert?: MessageUpsertWithWhereUniqueWithoutSenderInput | MessageUpsertWithWhereUniqueWithoutSenderInput[]
    createMany?: MessageCreateManySenderInputEnvelope
    set?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    disconnect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    delete?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    update?: MessageUpdateWithWhereUniqueWithoutSenderInput | MessageUpdateWithWhereUniqueWithoutSenderInput[]
    updateMany?: MessageUpdateManyWithWhereWithoutSenderInput | MessageUpdateManyWithWhereWithoutSenderInput[]
    deleteMany?: MessageScalarWhereInput | MessageScalarWhereInput[]
  }

  export type MessageUncheckedUpdateManyWithoutReceiverNestedInput = {
    create?: XOR<MessageCreateWithoutReceiverInput, MessageUncheckedCreateWithoutReceiverInput> | MessageCreateWithoutReceiverInput[] | MessageUncheckedCreateWithoutReceiverInput[]
    connectOrCreate?: MessageCreateOrConnectWithoutReceiverInput | MessageCreateOrConnectWithoutReceiverInput[]
    upsert?: MessageUpsertWithWhereUniqueWithoutReceiverInput | MessageUpsertWithWhereUniqueWithoutReceiverInput[]
    createMany?: MessageCreateManyReceiverInputEnvelope
    set?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    disconnect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    delete?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    connect?: MessageWhereUniqueInput | MessageWhereUniqueInput[]
    update?: MessageUpdateWithWhereUniqueWithoutReceiverInput | MessageUpdateWithWhereUniqueWithoutReceiverInput[]
    updateMany?: MessageUpdateManyWithWhereWithoutReceiverInput | MessageUpdateManyWithWhereWithoutReceiverInput[]
    deleteMany?: MessageScalarWhereInput | MessageScalarWhereInput[]
  }

  export type CrushUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<CrushCreateWithoutUserInput, CrushUncheckedCreateWithoutUserInput> | CrushCreateWithoutUserInput[] | CrushUncheckedCreateWithoutUserInput[]
    connectOrCreate?: CrushCreateOrConnectWithoutUserInput | CrushCreateOrConnectWithoutUserInput[]
    upsert?: CrushUpsertWithWhereUniqueWithoutUserInput | CrushUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: CrushCreateManyUserInputEnvelope
    set?: CrushWhereUniqueInput | CrushWhereUniqueInput[]
    disconnect?: CrushWhereUniqueInput | CrushWhereUniqueInput[]
    delete?: CrushWhereUniqueInput | CrushWhereUniqueInput[]
    connect?: CrushWhereUniqueInput | CrushWhereUniqueInput[]
    update?: CrushUpdateWithWhereUniqueWithoutUserInput | CrushUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: CrushUpdateManyWithWhereWithoutUserInput | CrushUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: CrushScalarWhereInput | CrushScalarWhereInput[]
  }

  export type CrushUncheckedUpdateManyWithoutCrushNestedInput = {
    create?: XOR<CrushCreateWithoutCrushInput, CrushUncheckedCreateWithoutCrushInput> | CrushCreateWithoutCrushInput[] | CrushUncheckedCreateWithoutCrushInput[]
    connectOrCreate?: CrushCreateOrConnectWithoutCrushInput | CrushCreateOrConnectWithoutCrushInput[]
    upsert?: CrushUpsertWithWhereUniqueWithoutCrushInput | CrushUpsertWithWhereUniqueWithoutCrushInput[]
    createMany?: CrushCreateManyCrushInputEnvelope
    set?: CrushWhereUniqueInput | CrushWhereUniqueInput[]
    disconnect?: CrushWhereUniqueInput | CrushWhereUniqueInput[]
    delete?: CrushWhereUniqueInput | CrushWhereUniqueInput[]
    connect?: CrushWhereUniqueInput | CrushWhereUniqueInput[]
    update?: CrushUpdateWithWhereUniqueWithoutCrushInput | CrushUpdateWithWhereUniqueWithoutCrushInput[]
    updateMany?: CrushUpdateManyWithWhereWithoutCrushInput | CrushUpdateManyWithWhereWithoutCrushInput[]
    deleteMany?: CrushScalarWhereInput | CrushScalarWhereInput[]
  }

  export type CloseFriendRequestUncheckedUpdateManyWithoutSenderNestedInput = {
    create?: XOR<CloseFriendRequestCreateWithoutSenderInput, CloseFriendRequestUncheckedCreateWithoutSenderInput> | CloseFriendRequestCreateWithoutSenderInput[] | CloseFriendRequestUncheckedCreateWithoutSenderInput[]
    connectOrCreate?: CloseFriendRequestCreateOrConnectWithoutSenderInput | CloseFriendRequestCreateOrConnectWithoutSenderInput[]
    upsert?: CloseFriendRequestUpsertWithWhereUniqueWithoutSenderInput | CloseFriendRequestUpsertWithWhereUniqueWithoutSenderInput[]
    createMany?: CloseFriendRequestCreateManySenderInputEnvelope
    set?: CloseFriendRequestWhereUniqueInput | CloseFriendRequestWhereUniqueInput[]
    disconnect?: CloseFriendRequestWhereUniqueInput | CloseFriendRequestWhereUniqueInput[]
    delete?: CloseFriendRequestWhereUniqueInput | CloseFriendRequestWhereUniqueInput[]
    connect?: CloseFriendRequestWhereUniqueInput | CloseFriendRequestWhereUniqueInput[]
    update?: CloseFriendRequestUpdateWithWhereUniqueWithoutSenderInput | CloseFriendRequestUpdateWithWhereUniqueWithoutSenderInput[]
    updateMany?: CloseFriendRequestUpdateManyWithWhereWithoutSenderInput | CloseFriendRequestUpdateManyWithWhereWithoutSenderInput[]
    deleteMany?: CloseFriendRequestScalarWhereInput | CloseFriendRequestScalarWhereInput[]
  }

  export type CloseFriendRequestUncheckedUpdateManyWithoutReceiverNestedInput = {
    create?: XOR<CloseFriendRequestCreateWithoutReceiverInput, CloseFriendRequestUncheckedCreateWithoutReceiverInput> | CloseFriendRequestCreateWithoutReceiverInput[] | CloseFriendRequestUncheckedCreateWithoutReceiverInput[]
    connectOrCreate?: CloseFriendRequestCreateOrConnectWithoutReceiverInput | CloseFriendRequestCreateOrConnectWithoutReceiverInput[]
    upsert?: CloseFriendRequestUpsertWithWhereUniqueWithoutReceiverInput | CloseFriendRequestUpsertWithWhereUniqueWithoutReceiverInput[]
    createMany?: CloseFriendRequestCreateManyReceiverInputEnvelope
    set?: CloseFriendRequestWhereUniqueInput | CloseFriendRequestWhereUniqueInput[]
    disconnect?: CloseFriendRequestWhereUniqueInput | CloseFriendRequestWhereUniqueInput[]
    delete?: CloseFriendRequestWhereUniqueInput | CloseFriendRequestWhereUniqueInput[]
    connect?: CloseFriendRequestWhereUniqueInput | CloseFriendRequestWhereUniqueInput[]
    update?: CloseFriendRequestUpdateWithWhereUniqueWithoutReceiverInput | CloseFriendRequestUpdateWithWhereUniqueWithoutReceiverInput[]
    updateMany?: CloseFriendRequestUpdateManyWithWhereWithoutReceiverInput | CloseFriendRequestUpdateManyWithWhereWithoutReceiverInput[]
    deleteMany?: CloseFriendRequestScalarWhereInput | CloseFriendRequestScalarWhereInput[]
  }

  export type LanguageRoomUncheckedUpdateManyWithoutCreatorNestedInput = {
    create?: XOR<LanguageRoomCreateWithoutCreatorInput, LanguageRoomUncheckedCreateWithoutCreatorInput> | LanguageRoomCreateWithoutCreatorInput[] | LanguageRoomUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: LanguageRoomCreateOrConnectWithoutCreatorInput | LanguageRoomCreateOrConnectWithoutCreatorInput[]
    upsert?: LanguageRoomUpsertWithWhereUniqueWithoutCreatorInput | LanguageRoomUpsertWithWhereUniqueWithoutCreatorInput[]
    createMany?: LanguageRoomCreateManyCreatorInputEnvelope
    set?: LanguageRoomWhereUniqueInput | LanguageRoomWhereUniqueInput[]
    disconnect?: LanguageRoomWhereUniqueInput | LanguageRoomWhereUniqueInput[]
    delete?: LanguageRoomWhereUniqueInput | LanguageRoomWhereUniqueInput[]
    connect?: LanguageRoomWhereUniqueInput | LanguageRoomWhereUniqueInput[]
    update?: LanguageRoomUpdateWithWhereUniqueWithoutCreatorInput | LanguageRoomUpdateWithWhereUniqueWithoutCreatorInput[]
    updateMany?: LanguageRoomUpdateManyWithWhereWithoutCreatorInput | LanguageRoomUpdateManyWithWhereWithoutCreatorInput[]
    deleteMany?: LanguageRoomScalarWhereInput | LanguageRoomScalarWhereInput[]
  }

  export type GroupUncheckedUpdateManyWithoutCreatorNestedInput = {
    create?: XOR<GroupCreateWithoutCreatorInput, GroupUncheckedCreateWithoutCreatorInput> | GroupCreateWithoutCreatorInput[] | GroupUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: GroupCreateOrConnectWithoutCreatorInput | GroupCreateOrConnectWithoutCreatorInput[]
    upsert?: GroupUpsertWithWhereUniqueWithoutCreatorInput | GroupUpsertWithWhereUniqueWithoutCreatorInput[]
    createMany?: GroupCreateManyCreatorInputEnvelope
    set?: GroupWhereUniqueInput | GroupWhereUniqueInput[]
    disconnect?: GroupWhereUniqueInput | GroupWhereUniqueInput[]
    delete?: GroupWhereUniqueInput | GroupWhereUniqueInput[]
    connect?: GroupWhereUniqueInput | GroupWhereUniqueInput[]
    update?: GroupUpdateWithWhereUniqueWithoutCreatorInput | GroupUpdateWithWhereUniqueWithoutCreatorInput[]
    updateMany?: GroupUpdateManyWithWhereWithoutCreatorInput | GroupUpdateManyWithWhereWithoutCreatorInput[]
    deleteMany?: GroupScalarWhereInput | GroupScalarWhereInput[]
  }

  export type GroupMemberUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<GroupMemberCreateWithoutUserInput, GroupMemberUncheckedCreateWithoutUserInput> | GroupMemberCreateWithoutUserInput[] | GroupMemberUncheckedCreateWithoutUserInput[]
    connectOrCreate?: GroupMemberCreateOrConnectWithoutUserInput | GroupMemberCreateOrConnectWithoutUserInput[]
    upsert?: GroupMemberUpsertWithWhereUniqueWithoutUserInput | GroupMemberUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: GroupMemberCreateManyUserInputEnvelope
    set?: GroupMemberWhereUniqueInput | GroupMemberWhereUniqueInput[]
    disconnect?: GroupMemberWhereUniqueInput | GroupMemberWhereUniqueInput[]
    delete?: GroupMemberWhereUniqueInput | GroupMemberWhereUniqueInput[]
    connect?: GroupMemberWhereUniqueInput | GroupMemberWhereUniqueInput[]
    update?: GroupMemberUpdateWithWhereUniqueWithoutUserInput | GroupMemberUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: GroupMemberUpdateManyWithWhereWithoutUserInput | GroupMemberUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: GroupMemberScalarWhereInput | GroupMemberScalarWhereInput[]
  }

  export type GroupMessageUncheckedUpdateManyWithoutSenderNestedInput = {
    create?: XOR<GroupMessageCreateWithoutSenderInput, GroupMessageUncheckedCreateWithoutSenderInput> | GroupMessageCreateWithoutSenderInput[] | GroupMessageUncheckedCreateWithoutSenderInput[]
    connectOrCreate?: GroupMessageCreateOrConnectWithoutSenderInput | GroupMessageCreateOrConnectWithoutSenderInput[]
    upsert?: GroupMessageUpsertWithWhereUniqueWithoutSenderInput | GroupMessageUpsertWithWhereUniqueWithoutSenderInput[]
    createMany?: GroupMessageCreateManySenderInputEnvelope
    set?: GroupMessageWhereUniqueInput | GroupMessageWhereUniqueInput[]
    disconnect?: GroupMessageWhereUniqueInput | GroupMessageWhereUniqueInput[]
    delete?: GroupMessageWhereUniqueInput | GroupMessageWhereUniqueInput[]
    connect?: GroupMessageWhereUniqueInput | GroupMessageWhereUniqueInput[]
    update?: GroupMessageUpdateWithWhereUniqueWithoutSenderInput | GroupMessageUpdateWithWhereUniqueWithoutSenderInput[]
    updateMany?: GroupMessageUpdateManyWithWhereWithoutSenderInput | GroupMessageUpdateManyWithWhereWithoutSenderInput[]
    deleteMany?: GroupMessageScalarWhereInput | GroupMessageScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutPostsInput = {
    create?: XOR<UserCreateWithoutPostsInput, UserUncheckedCreateWithoutPostsInput>
    connectOrCreate?: UserCreateOrConnectWithoutPostsInput
    connect?: UserWhereUniqueInput
  }

  export type UserCreateNestedManyWithoutLikedPostsInput = {
    create?: XOR<UserCreateWithoutLikedPostsInput, UserUncheckedCreateWithoutLikedPostsInput> | UserCreateWithoutLikedPostsInput[] | UserUncheckedCreateWithoutLikedPostsInput[]
    connectOrCreate?: UserCreateOrConnectWithoutLikedPostsInput | UserCreateOrConnectWithoutLikedPostsInput[]
    connect?: UserWhereUniqueInput | UserWhereUniqueInput[]
  }

  export type CommentCreateNestedManyWithoutPostInput = {
    create?: XOR<CommentCreateWithoutPostInput, CommentUncheckedCreateWithoutPostInput> | CommentCreateWithoutPostInput[] | CommentUncheckedCreateWithoutPostInput[]
    connectOrCreate?: CommentCreateOrConnectWithoutPostInput | CommentCreateOrConnectWithoutPostInput[]
    createMany?: CommentCreateManyPostInputEnvelope
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
  }

  export type UserUncheckedCreateNestedManyWithoutLikedPostsInput = {
    create?: XOR<UserCreateWithoutLikedPostsInput, UserUncheckedCreateWithoutLikedPostsInput> | UserCreateWithoutLikedPostsInput[] | UserUncheckedCreateWithoutLikedPostsInput[]
    connectOrCreate?: UserCreateOrConnectWithoutLikedPostsInput | UserCreateOrConnectWithoutLikedPostsInput[]
    connect?: UserWhereUniqueInput | UserWhereUniqueInput[]
  }

  export type CommentUncheckedCreateNestedManyWithoutPostInput = {
    create?: XOR<CommentCreateWithoutPostInput, CommentUncheckedCreateWithoutPostInput> | CommentCreateWithoutPostInput[] | CommentUncheckedCreateWithoutPostInput[]
    connectOrCreate?: CommentCreateOrConnectWithoutPostInput | CommentCreateOrConnectWithoutPostInput[]
    createMany?: CommentCreateManyPostInputEnvelope
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
  }

  export type UserUpdateOneRequiredWithoutPostsNestedInput = {
    create?: XOR<UserCreateWithoutPostsInput, UserUncheckedCreateWithoutPostsInput>
    connectOrCreate?: UserCreateOrConnectWithoutPostsInput
    upsert?: UserUpsertWithoutPostsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutPostsInput, UserUpdateWithoutPostsInput>, UserUncheckedUpdateWithoutPostsInput>
  }

  export type UserUpdateManyWithoutLikedPostsNestedInput = {
    create?: XOR<UserCreateWithoutLikedPostsInput, UserUncheckedCreateWithoutLikedPostsInput> | UserCreateWithoutLikedPostsInput[] | UserUncheckedCreateWithoutLikedPostsInput[]
    connectOrCreate?: UserCreateOrConnectWithoutLikedPostsInput | UserCreateOrConnectWithoutLikedPostsInput[]
    upsert?: UserUpsertWithWhereUniqueWithoutLikedPostsInput | UserUpsertWithWhereUniqueWithoutLikedPostsInput[]
    set?: UserWhereUniqueInput | UserWhereUniqueInput[]
    disconnect?: UserWhereUniqueInput | UserWhereUniqueInput[]
    delete?: UserWhereUniqueInput | UserWhereUniqueInput[]
    connect?: UserWhereUniqueInput | UserWhereUniqueInput[]
    update?: UserUpdateWithWhereUniqueWithoutLikedPostsInput | UserUpdateWithWhereUniqueWithoutLikedPostsInput[]
    updateMany?: UserUpdateManyWithWhereWithoutLikedPostsInput | UserUpdateManyWithWhereWithoutLikedPostsInput[]
    deleteMany?: UserScalarWhereInput | UserScalarWhereInput[]
  }

  export type CommentUpdateManyWithoutPostNestedInput = {
    create?: XOR<CommentCreateWithoutPostInput, CommentUncheckedCreateWithoutPostInput> | CommentCreateWithoutPostInput[] | CommentUncheckedCreateWithoutPostInput[]
    connectOrCreate?: CommentCreateOrConnectWithoutPostInput | CommentCreateOrConnectWithoutPostInput[]
    upsert?: CommentUpsertWithWhereUniqueWithoutPostInput | CommentUpsertWithWhereUniqueWithoutPostInput[]
    createMany?: CommentCreateManyPostInputEnvelope
    set?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    disconnect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    delete?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    update?: CommentUpdateWithWhereUniqueWithoutPostInput | CommentUpdateWithWhereUniqueWithoutPostInput[]
    updateMany?: CommentUpdateManyWithWhereWithoutPostInput | CommentUpdateManyWithWhereWithoutPostInput[]
    deleteMany?: CommentScalarWhereInput | CommentScalarWhereInput[]
  }

  export type UserUncheckedUpdateManyWithoutLikedPostsNestedInput = {
    create?: XOR<UserCreateWithoutLikedPostsInput, UserUncheckedCreateWithoutLikedPostsInput> | UserCreateWithoutLikedPostsInput[] | UserUncheckedCreateWithoutLikedPostsInput[]
    connectOrCreate?: UserCreateOrConnectWithoutLikedPostsInput | UserCreateOrConnectWithoutLikedPostsInput[]
    upsert?: UserUpsertWithWhereUniqueWithoutLikedPostsInput | UserUpsertWithWhereUniqueWithoutLikedPostsInput[]
    set?: UserWhereUniqueInput | UserWhereUniqueInput[]
    disconnect?: UserWhereUniqueInput | UserWhereUniqueInput[]
    delete?: UserWhereUniqueInput | UserWhereUniqueInput[]
    connect?: UserWhereUniqueInput | UserWhereUniqueInput[]
    update?: UserUpdateWithWhereUniqueWithoutLikedPostsInput | UserUpdateWithWhereUniqueWithoutLikedPostsInput[]
    updateMany?: UserUpdateManyWithWhereWithoutLikedPostsInput | UserUpdateManyWithWhereWithoutLikedPostsInput[]
    deleteMany?: UserScalarWhereInput | UserScalarWhereInput[]
  }

  export type CommentUncheckedUpdateManyWithoutPostNestedInput = {
    create?: XOR<CommentCreateWithoutPostInput, CommentUncheckedCreateWithoutPostInput> | CommentCreateWithoutPostInput[] | CommentUncheckedCreateWithoutPostInput[]
    connectOrCreate?: CommentCreateOrConnectWithoutPostInput | CommentCreateOrConnectWithoutPostInput[]
    upsert?: CommentUpsertWithWhereUniqueWithoutPostInput | CommentUpsertWithWhereUniqueWithoutPostInput[]
    createMany?: CommentCreateManyPostInputEnvelope
    set?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    disconnect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    delete?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    connect?: CommentWhereUniqueInput | CommentWhereUniqueInput[]
    update?: CommentUpdateWithWhereUniqueWithoutPostInput | CommentUpdateWithWhereUniqueWithoutPostInput[]
    updateMany?: CommentUpdateManyWithWhereWithoutPostInput | CommentUpdateManyWithWhereWithoutPostInput[]
    deleteMany?: CommentScalarWhereInput | CommentScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutSentFriendRequestsInput = {
    create?: XOR<UserCreateWithoutSentFriendRequestsInput, UserUncheckedCreateWithoutSentFriendRequestsInput>
    connectOrCreate?: UserCreateOrConnectWithoutSentFriendRequestsInput
    connect?: UserWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutReceivedFriendRequestsInput = {
    create?: XOR<UserCreateWithoutReceivedFriendRequestsInput, UserUncheckedCreateWithoutReceivedFriendRequestsInput>
    connectOrCreate?: UserCreateOrConnectWithoutReceivedFriendRequestsInput
    connect?: UserWhereUniqueInput
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type UserUpdateOneRequiredWithoutSentFriendRequestsNestedInput = {
    create?: XOR<UserCreateWithoutSentFriendRequestsInput, UserUncheckedCreateWithoutSentFriendRequestsInput>
    connectOrCreate?: UserCreateOrConnectWithoutSentFriendRequestsInput
    upsert?: UserUpsertWithoutSentFriendRequestsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutSentFriendRequestsInput, UserUpdateWithoutSentFriendRequestsInput>, UserUncheckedUpdateWithoutSentFriendRequestsInput>
  }

  export type UserUpdateOneRequiredWithoutReceivedFriendRequestsNestedInput = {
    create?: XOR<UserCreateWithoutReceivedFriendRequestsInput, UserUncheckedCreateWithoutReceivedFriendRequestsInput>
    connectOrCreate?: UserCreateOrConnectWithoutReceivedFriendRequestsInput
    upsert?: UserUpsertWithoutReceivedFriendRequestsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutReceivedFriendRequestsInput, UserUpdateWithoutReceivedFriendRequestsInput>, UserUncheckedUpdateWithoutReceivedFriendRequestsInput>
  }

  export type UserCreateNestedOneWithoutSentMessagesInput = {
    create?: XOR<UserCreateWithoutSentMessagesInput, UserUncheckedCreateWithoutSentMessagesInput>
    connectOrCreate?: UserCreateOrConnectWithoutSentMessagesInput
    connect?: UserWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutReceivedMessagesInput = {
    create?: XOR<UserCreateWithoutReceivedMessagesInput, UserUncheckedCreateWithoutReceivedMessagesInput>
    connectOrCreate?: UserCreateOrConnectWithoutReceivedMessagesInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutSentMessagesNestedInput = {
    create?: XOR<UserCreateWithoutSentMessagesInput, UserUncheckedCreateWithoutSentMessagesInput>
    connectOrCreate?: UserCreateOrConnectWithoutSentMessagesInput
    upsert?: UserUpsertWithoutSentMessagesInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutSentMessagesInput, UserUpdateWithoutSentMessagesInput>, UserUncheckedUpdateWithoutSentMessagesInput>
  }

  export type UserUpdateOneRequiredWithoutReceivedMessagesNestedInput = {
    create?: XOR<UserCreateWithoutReceivedMessagesInput, UserUncheckedCreateWithoutReceivedMessagesInput>
    connectOrCreate?: UserCreateOrConnectWithoutReceivedMessagesInput
    upsert?: UserUpsertWithoutReceivedMessagesInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutReceivedMessagesInput, UserUpdateWithoutReceivedMessagesInput>, UserUncheckedUpdateWithoutReceivedMessagesInput>
  }

  export type PostCreateNestedOneWithoutCommentsInput = {
    create?: XOR<PostCreateWithoutCommentsInput, PostUncheckedCreateWithoutCommentsInput>
    connectOrCreate?: PostCreateOrConnectWithoutCommentsInput
    connect?: PostWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutCommentsInput = {
    create?: XOR<UserCreateWithoutCommentsInput, UserUncheckedCreateWithoutCommentsInput>
    connectOrCreate?: UserCreateOrConnectWithoutCommentsInput
    connect?: UserWhereUniqueInput
  }

  export type PostUpdateOneRequiredWithoutCommentsNestedInput = {
    create?: XOR<PostCreateWithoutCommentsInput, PostUncheckedCreateWithoutCommentsInput>
    connectOrCreate?: PostCreateOrConnectWithoutCommentsInput
    upsert?: PostUpsertWithoutCommentsInput
    connect?: PostWhereUniqueInput
    update?: XOR<XOR<PostUpdateToOneWithWhereWithoutCommentsInput, PostUpdateWithoutCommentsInput>, PostUncheckedUpdateWithoutCommentsInput>
  }

  export type UserUpdateOneRequiredWithoutCommentsNestedInput = {
    create?: XOR<UserCreateWithoutCommentsInput, UserUncheckedCreateWithoutCommentsInput>
    connectOrCreate?: UserCreateOrConnectWithoutCommentsInput
    upsert?: UserUpsertWithoutCommentsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutCommentsInput, UserUpdateWithoutCommentsInput>, UserUncheckedUpdateWithoutCommentsInput>
  }

  export type UserCreateNestedOneWithoutMyCrushesInput = {
    create?: XOR<UserCreateWithoutMyCrushesInput, UserUncheckedCreateWithoutMyCrushesInput>
    connectOrCreate?: UserCreateOrConnectWithoutMyCrushesInput
    connect?: UserWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutCrushedByInput = {
    create?: XOR<UserCreateWithoutCrushedByInput, UserUncheckedCreateWithoutCrushedByInput>
    connectOrCreate?: UserCreateOrConnectWithoutCrushedByInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutMyCrushesNestedInput = {
    create?: XOR<UserCreateWithoutMyCrushesInput, UserUncheckedCreateWithoutMyCrushesInput>
    connectOrCreate?: UserCreateOrConnectWithoutMyCrushesInput
    upsert?: UserUpsertWithoutMyCrushesInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutMyCrushesInput, UserUpdateWithoutMyCrushesInput>, UserUncheckedUpdateWithoutMyCrushesInput>
  }

  export type UserUpdateOneRequiredWithoutCrushedByNestedInput = {
    create?: XOR<UserCreateWithoutCrushedByInput, UserUncheckedCreateWithoutCrushedByInput>
    connectOrCreate?: UserCreateOrConnectWithoutCrushedByInput
    upsert?: UserUpsertWithoutCrushedByInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutCrushedByInput, UserUpdateWithoutCrushedByInput>, UserUncheckedUpdateWithoutCrushedByInput>
  }

  export type UserCreateNestedOneWithoutSentCloseFriendRequestsInput = {
    create?: XOR<UserCreateWithoutSentCloseFriendRequestsInput, UserUncheckedCreateWithoutSentCloseFriendRequestsInput>
    connectOrCreate?: UserCreateOrConnectWithoutSentCloseFriendRequestsInput
    connect?: UserWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutReceivedCloseFriendRequestsInput = {
    create?: XOR<UserCreateWithoutReceivedCloseFriendRequestsInput, UserUncheckedCreateWithoutReceivedCloseFriendRequestsInput>
    connectOrCreate?: UserCreateOrConnectWithoutReceivedCloseFriendRequestsInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutSentCloseFriendRequestsNestedInput = {
    create?: XOR<UserCreateWithoutSentCloseFriendRequestsInput, UserUncheckedCreateWithoutSentCloseFriendRequestsInput>
    connectOrCreate?: UserCreateOrConnectWithoutSentCloseFriendRequestsInput
    upsert?: UserUpsertWithoutSentCloseFriendRequestsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutSentCloseFriendRequestsInput, UserUpdateWithoutSentCloseFriendRequestsInput>, UserUncheckedUpdateWithoutSentCloseFriendRequestsInput>
  }

  export type UserUpdateOneRequiredWithoutReceivedCloseFriendRequestsNestedInput = {
    create?: XOR<UserCreateWithoutReceivedCloseFriendRequestsInput, UserUncheckedCreateWithoutReceivedCloseFriendRequestsInput>
    connectOrCreate?: UserCreateOrConnectWithoutReceivedCloseFriendRequestsInput
    upsert?: UserUpsertWithoutReceivedCloseFriendRequestsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutReceivedCloseFriendRequestsInput, UserUpdateWithoutReceivedCloseFriendRequestsInput>, UserUncheckedUpdateWithoutReceivedCloseFriendRequestsInput>
  }

  export type UserCreateNestedOneWithoutLanguageRoomsInput = {
    create?: XOR<UserCreateWithoutLanguageRoomsInput, UserUncheckedCreateWithoutLanguageRoomsInput>
    connectOrCreate?: UserCreateOrConnectWithoutLanguageRoomsInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutLanguageRoomsNestedInput = {
    create?: XOR<UserCreateWithoutLanguageRoomsInput, UserUncheckedCreateWithoutLanguageRoomsInput>
    connectOrCreate?: UserCreateOrConnectWithoutLanguageRoomsInput
    upsert?: UserUpsertWithoutLanguageRoomsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutLanguageRoomsInput, UserUpdateWithoutLanguageRoomsInput>, UserUncheckedUpdateWithoutLanguageRoomsInput>
  }

  export type UserCreateNestedOneWithoutCreatedGroupsInput = {
    create?: XOR<UserCreateWithoutCreatedGroupsInput, UserUncheckedCreateWithoutCreatedGroupsInput>
    connectOrCreate?: UserCreateOrConnectWithoutCreatedGroupsInput
    connect?: UserWhereUniqueInput
  }

  export type GroupMemberCreateNestedManyWithoutGroupInput = {
    create?: XOR<GroupMemberCreateWithoutGroupInput, GroupMemberUncheckedCreateWithoutGroupInput> | GroupMemberCreateWithoutGroupInput[] | GroupMemberUncheckedCreateWithoutGroupInput[]
    connectOrCreate?: GroupMemberCreateOrConnectWithoutGroupInput | GroupMemberCreateOrConnectWithoutGroupInput[]
    createMany?: GroupMemberCreateManyGroupInputEnvelope
    connect?: GroupMemberWhereUniqueInput | GroupMemberWhereUniqueInput[]
  }

  export type GroupMessageCreateNestedManyWithoutGroupInput = {
    create?: XOR<GroupMessageCreateWithoutGroupInput, GroupMessageUncheckedCreateWithoutGroupInput> | GroupMessageCreateWithoutGroupInput[] | GroupMessageUncheckedCreateWithoutGroupInput[]
    connectOrCreate?: GroupMessageCreateOrConnectWithoutGroupInput | GroupMessageCreateOrConnectWithoutGroupInput[]
    createMany?: GroupMessageCreateManyGroupInputEnvelope
    connect?: GroupMessageWhereUniqueInput | GroupMessageWhereUniqueInput[]
  }

  export type GroupMemberUncheckedCreateNestedManyWithoutGroupInput = {
    create?: XOR<GroupMemberCreateWithoutGroupInput, GroupMemberUncheckedCreateWithoutGroupInput> | GroupMemberCreateWithoutGroupInput[] | GroupMemberUncheckedCreateWithoutGroupInput[]
    connectOrCreate?: GroupMemberCreateOrConnectWithoutGroupInput | GroupMemberCreateOrConnectWithoutGroupInput[]
    createMany?: GroupMemberCreateManyGroupInputEnvelope
    connect?: GroupMemberWhereUniqueInput | GroupMemberWhereUniqueInput[]
  }

  export type GroupMessageUncheckedCreateNestedManyWithoutGroupInput = {
    create?: XOR<GroupMessageCreateWithoutGroupInput, GroupMessageUncheckedCreateWithoutGroupInput> | GroupMessageCreateWithoutGroupInput[] | GroupMessageUncheckedCreateWithoutGroupInput[]
    connectOrCreate?: GroupMessageCreateOrConnectWithoutGroupInput | GroupMessageCreateOrConnectWithoutGroupInput[]
    createMany?: GroupMessageCreateManyGroupInputEnvelope
    connect?: GroupMessageWhereUniqueInput | GroupMessageWhereUniqueInput[]
  }

  export type UserUpdateOneRequiredWithoutCreatedGroupsNestedInput = {
    create?: XOR<UserCreateWithoutCreatedGroupsInput, UserUncheckedCreateWithoutCreatedGroupsInput>
    connectOrCreate?: UserCreateOrConnectWithoutCreatedGroupsInput
    upsert?: UserUpsertWithoutCreatedGroupsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutCreatedGroupsInput, UserUpdateWithoutCreatedGroupsInput>, UserUncheckedUpdateWithoutCreatedGroupsInput>
  }

  export type GroupMemberUpdateManyWithoutGroupNestedInput = {
    create?: XOR<GroupMemberCreateWithoutGroupInput, GroupMemberUncheckedCreateWithoutGroupInput> | GroupMemberCreateWithoutGroupInput[] | GroupMemberUncheckedCreateWithoutGroupInput[]
    connectOrCreate?: GroupMemberCreateOrConnectWithoutGroupInput | GroupMemberCreateOrConnectWithoutGroupInput[]
    upsert?: GroupMemberUpsertWithWhereUniqueWithoutGroupInput | GroupMemberUpsertWithWhereUniqueWithoutGroupInput[]
    createMany?: GroupMemberCreateManyGroupInputEnvelope
    set?: GroupMemberWhereUniqueInput | GroupMemberWhereUniqueInput[]
    disconnect?: GroupMemberWhereUniqueInput | GroupMemberWhereUniqueInput[]
    delete?: GroupMemberWhereUniqueInput | GroupMemberWhereUniqueInput[]
    connect?: GroupMemberWhereUniqueInput | GroupMemberWhereUniqueInput[]
    update?: GroupMemberUpdateWithWhereUniqueWithoutGroupInput | GroupMemberUpdateWithWhereUniqueWithoutGroupInput[]
    updateMany?: GroupMemberUpdateManyWithWhereWithoutGroupInput | GroupMemberUpdateManyWithWhereWithoutGroupInput[]
    deleteMany?: GroupMemberScalarWhereInput | GroupMemberScalarWhereInput[]
  }

  export type GroupMessageUpdateManyWithoutGroupNestedInput = {
    create?: XOR<GroupMessageCreateWithoutGroupInput, GroupMessageUncheckedCreateWithoutGroupInput> | GroupMessageCreateWithoutGroupInput[] | GroupMessageUncheckedCreateWithoutGroupInput[]
    connectOrCreate?: GroupMessageCreateOrConnectWithoutGroupInput | GroupMessageCreateOrConnectWithoutGroupInput[]
    upsert?: GroupMessageUpsertWithWhereUniqueWithoutGroupInput | GroupMessageUpsertWithWhereUniqueWithoutGroupInput[]
    createMany?: GroupMessageCreateManyGroupInputEnvelope
    set?: GroupMessageWhereUniqueInput | GroupMessageWhereUniqueInput[]
    disconnect?: GroupMessageWhereUniqueInput | GroupMessageWhereUniqueInput[]
    delete?: GroupMessageWhereUniqueInput | GroupMessageWhereUniqueInput[]
    connect?: GroupMessageWhereUniqueInput | GroupMessageWhereUniqueInput[]
    update?: GroupMessageUpdateWithWhereUniqueWithoutGroupInput | GroupMessageUpdateWithWhereUniqueWithoutGroupInput[]
    updateMany?: GroupMessageUpdateManyWithWhereWithoutGroupInput | GroupMessageUpdateManyWithWhereWithoutGroupInput[]
    deleteMany?: GroupMessageScalarWhereInput | GroupMessageScalarWhereInput[]
  }

  export type GroupMemberUncheckedUpdateManyWithoutGroupNestedInput = {
    create?: XOR<GroupMemberCreateWithoutGroupInput, GroupMemberUncheckedCreateWithoutGroupInput> | GroupMemberCreateWithoutGroupInput[] | GroupMemberUncheckedCreateWithoutGroupInput[]
    connectOrCreate?: GroupMemberCreateOrConnectWithoutGroupInput | GroupMemberCreateOrConnectWithoutGroupInput[]
    upsert?: GroupMemberUpsertWithWhereUniqueWithoutGroupInput | GroupMemberUpsertWithWhereUniqueWithoutGroupInput[]
    createMany?: GroupMemberCreateManyGroupInputEnvelope
    set?: GroupMemberWhereUniqueInput | GroupMemberWhereUniqueInput[]
    disconnect?: GroupMemberWhereUniqueInput | GroupMemberWhereUniqueInput[]
    delete?: GroupMemberWhereUniqueInput | GroupMemberWhereUniqueInput[]
    connect?: GroupMemberWhereUniqueInput | GroupMemberWhereUniqueInput[]
    update?: GroupMemberUpdateWithWhereUniqueWithoutGroupInput | GroupMemberUpdateWithWhereUniqueWithoutGroupInput[]
    updateMany?: GroupMemberUpdateManyWithWhereWithoutGroupInput | GroupMemberUpdateManyWithWhereWithoutGroupInput[]
    deleteMany?: GroupMemberScalarWhereInput | GroupMemberScalarWhereInput[]
  }

  export type GroupMessageUncheckedUpdateManyWithoutGroupNestedInput = {
    create?: XOR<GroupMessageCreateWithoutGroupInput, GroupMessageUncheckedCreateWithoutGroupInput> | GroupMessageCreateWithoutGroupInput[] | GroupMessageUncheckedCreateWithoutGroupInput[]
    connectOrCreate?: GroupMessageCreateOrConnectWithoutGroupInput | GroupMessageCreateOrConnectWithoutGroupInput[]
    upsert?: GroupMessageUpsertWithWhereUniqueWithoutGroupInput | GroupMessageUpsertWithWhereUniqueWithoutGroupInput[]
    createMany?: GroupMessageCreateManyGroupInputEnvelope
    set?: GroupMessageWhereUniqueInput | GroupMessageWhereUniqueInput[]
    disconnect?: GroupMessageWhereUniqueInput | GroupMessageWhereUniqueInput[]
    delete?: GroupMessageWhereUniqueInput | GroupMessageWhereUniqueInput[]
    connect?: GroupMessageWhereUniqueInput | GroupMessageWhereUniqueInput[]
    update?: GroupMessageUpdateWithWhereUniqueWithoutGroupInput | GroupMessageUpdateWithWhereUniqueWithoutGroupInput[]
    updateMany?: GroupMessageUpdateManyWithWhereWithoutGroupInput | GroupMessageUpdateManyWithWhereWithoutGroupInput[]
    deleteMany?: GroupMessageScalarWhereInput | GroupMessageScalarWhereInput[]
  }

  export type GroupCreateNestedOneWithoutMembersInput = {
    create?: XOR<GroupCreateWithoutMembersInput, GroupUncheckedCreateWithoutMembersInput>
    connectOrCreate?: GroupCreateOrConnectWithoutMembersInput
    connect?: GroupWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutGroupMembersInput = {
    create?: XOR<UserCreateWithoutGroupMembersInput, UserUncheckedCreateWithoutGroupMembersInput>
    connectOrCreate?: UserCreateOrConnectWithoutGroupMembersInput
    connect?: UserWhereUniqueInput
  }

  export type GroupUpdateOneRequiredWithoutMembersNestedInput = {
    create?: XOR<GroupCreateWithoutMembersInput, GroupUncheckedCreateWithoutMembersInput>
    connectOrCreate?: GroupCreateOrConnectWithoutMembersInput
    upsert?: GroupUpsertWithoutMembersInput
    connect?: GroupWhereUniqueInput
    update?: XOR<XOR<GroupUpdateToOneWithWhereWithoutMembersInput, GroupUpdateWithoutMembersInput>, GroupUncheckedUpdateWithoutMembersInput>
  }

  export type UserUpdateOneRequiredWithoutGroupMembersNestedInput = {
    create?: XOR<UserCreateWithoutGroupMembersInput, UserUncheckedCreateWithoutGroupMembersInput>
    connectOrCreate?: UserCreateOrConnectWithoutGroupMembersInput
    upsert?: UserUpsertWithoutGroupMembersInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutGroupMembersInput, UserUpdateWithoutGroupMembersInput>, UserUncheckedUpdateWithoutGroupMembersInput>
  }

  export type GroupCreateNestedOneWithoutMessagesInput = {
    create?: XOR<GroupCreateWithoutMessagesInput, GroupUncheckedCreateWithoutMessagesInput>
    connectOrCreate?: GroupCreateOrConnectWithoutMessagesInput
    connect?: GroupWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutGroupMessagesInput = {
    create?: XOR<UserCreateWithoutGroupMessagesInput, UserUncheckedCreateWithoutGroupMessagesInput>
    connectOrCreate?: UserCreateOrConnectWithoutGroupMessagesInput
    connect?: UserWhereUniqueInput
  }

  export type GroupUpdateOneRequiredWithoutMessagesNestedInput = {
    create?: XOR<GroupCreateWithoutMessagesInput, GroupUncheckedCreateWithoutMessagesInput>
    connectOrCreate?: GroupCreateOrConnectWithoutMessagesInput
    upsert?: GroupUpsertWithoutMessagesInput
    connect?: GroupWhereUniqueInput
    update?: XOR<XOR<GroupUpdateToOneWithWhereWithoutMessagesInput, GroupUpdateWithoutMessagesInput>, GroupUncheckedUpdateWithoutMessagesInput>
  }

  export type UserUpdateOneRequiredWithoutGroupMessagesNestedInput = {
    create?: XOR<UserCreateWithoutGroupMessagesInput, UserUncheckedCreateWithoutGroupMessagesInput>
    connectOrCreate?: UserCreateOrConnectWithoutGroupMessagesInput
    upsert?: UserUpsertWithoutGroupMessagesInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutGroupMessagesInput, UserUpdateWithoutGroupMessagesInput>, UserUncheckedUpdateWithoutGroupMessagesInput>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type PostCreateWithoutAuthorInput = {
    content: string
    image?: string | null
    visibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    likes?: UserCreateNestedManyWithoutLikedPostsInput
    comments?: CommentCreateNestedManyWithoutPostInput
  }

  export type PostUncheckedCreateWithoutAuthorInput = {
    id?: number
    content: string
    image?: string | null
    visibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    likes?: UserUncheckedCreateNestedManyWithoutLikedPostsInput
    comments?: CommentUncheckedCreateNestedManyWithoutPostInput
  }

  export type PostCreateOrConnectWithoutAuthorInput = {
    where: PostWhereUniqueInput
    create: XOR<PostCreateWithoutAuthorInput, PostUncheckedCreateWithoutAuthorInput>
  }

  export type PostCreateManyAuthorInputEnvelope = {
    data: PostCreateManyAuthorInput | PostCreateManyAuthorInput[]
  }

  export type CommentCreateWithoutAuthorInput = {
    content: string
    createdAt?: Date | string
    updatedAt?: Date | string
    post: PostCreateNestedOneWithoutCommentsInput
  }

  export type CommentUncheckedCreateWithoutAuthorInput = {
    id?: number
    content: string
    createdAt?: Date | string
    updatedAt?: Date | string
    postId: number
  }

  export type CommentCreateOrConnectWithoutAuthorInput = {
    where: CommentWhereUniqueInput
    create: XOR<CommentCreateWithoutAuthorInput, CommentUncheckedCreateWithoutAuthorInput>
  }

  export type CommentCreateManyAuthorInputEnvelope = {
    data: CommentCreateManyAuthorInput | CommentCreateManyAuthorInput[]
  }

  export type PostCreateWithoutLikesInput = {
    content: string
    image?: string | null
    visibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    author: UserCreateNestedOneWithoutPostsInput
    comments?: CommentCreateNestedManyWithoutPostInput
  }

  export type PostUncheckedCreateWithoutLikesInput = {
    id?: number
    content: string
    image?: string | null
    visibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    authorId: number
    comments?: CommentUncheckedCreateNestedManyWithoutPostInput
  }

  export type PostCreateOrConnectWithoutLikesInput = {
    where: PostWhereUniqueInput
    create: XOR<PostCreateWithoutLikesInput, PostUncheckedCreateWithoutLikesInput>
  }

  export type FriendshipCreateWithoutSenderInput = {
    status?: string
    isCloseFriend?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    receiver: UserCreateNestedOneWithoutReceivedFriendRequestsInput
  }

  export type FriendshipUncheckedCreateWithoutSenderInput = {
    id?: number
    status?: string
    isCloseFriend?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    receiverId: number
  }

  export type FriendshipCreateOrConnectWithoutSenderInput = {
    where: FriendshipWhereUniqueInput
    create: XOR<FriendshipCreateWithoutSenderInput, FriendshipUncheckedCreateWithoutSenderInput>
  }

  export type FriendshipCreateManySenderInputEnvelope = {
    data: FriendshipCreateManySenderInput | FriendshipCreateManySenderInput[]
  }

  export type FriendshipCreateWithoutReceiverInput = {
    status?: string
    isCloseFriend?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    sender: UserCreateNestedOneWithoutSentFriendRequestsInput
  }

  export type FriendshipUncheckedCreateWithoutReceiverInput = {
    id?: number
    status?: string
    isCloseFriend?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    senderId: number
  }

  export type FriendshipCreateOrConnectWithoutReceiverInput = {
    where: FriendshipWhereUniqueInput
    create: XOR<FriendshipCreateWithoutReceiverInput, FriendshipUncheckedCreateWithoutReceiverInput>
  }

  export type FriendshipCreateManyReceiverInputEnvelope = {
    data: FriendshipCreateManyReceiverInput | FriendshipCreateManyReceiverInput[]
  }

  export type MessageCreateWithoutSenderInput = {
    content: string
    isRead?: boolean
    createdAt?: Date | string
    receiver: UserCreateNestedOneWithoutReceivedMessagesInput
  }

  export type MessageUncheckedCreateWithoutSenderInput = {
    id?: number
    content: string
    isRead?: boolean
    createdAt?: Date | string
    receiverId: number
  }

  export type MessageCreateOrConnectWithoutSenderInput = {
    where: MessageWhereUniqueInput
    create: XOR<MessageCreateWithoutSenderInput, MessageUncheckedCreateWithoutSenderInput>
  }

  export type MessageCreateManySenderInputEnvelope = {
    data: MessageCreateManySenderInput | MessageCreateManySenderInput[]
  }

  export type MessageCreateWithoutReceiverInput = {
    content: string
    isRead?: boolean
    createdAt?: Date | string
    sender: UserCreateNestedOneWithoutSentMessagesInput
  }

  export type MessageUncheckedCreateWithoutReceiverInput = {
    id?: number
    content: string
    isRead?: boolean
    createdAt?: Date | string
    senderId: number
  }

  export type MessageCreateOrConnectWithoutReceiverInput = {
    where: MessageWhereUniqueInput
    create: XOR<MessageCreateWithoutReceiverInput, MessageUncheckedCreateWithoutReceiverInput>
  }

  export type MessageCreateManyReceiverInputEnvelope = {
    data: MessageCreateManyReceiverInput | MessageCreateManyReceiverInput[]
  }

  export type CrushCreateWithoutUserInput = {
    createdAt?: Date | string
    crush: UserCreateNestedOneWithoutCrushedByInput
  }

  export type CrushUncheckedCreateWithoutUserInput = {
    id?: number
    createdAt?: Date | string
    crushId: number
  }

  export type CrushCreateOrConnectWithoutUserInput = {
    where: CrushWhereUniqueInput
    create: XOR<CrushCreateWithoutUserInput, CrushUncheckedCreateWithoutUserInput>
  }

  export type CrushCreateManyUserInputEnvelope = {
    data: CrushCreateManyUserInput | CrushCreateManyUserInput[]
  }

  export type CrushCreateWithoutCrushInput = {
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutMyCrushesInput
  }

  export type CrushUncheckedCreateWithoutCrushInput = {
    id?: number
    createdAt?: Date | string
    userId: number
  }

  export type CrushCreateOrConnectWithoutCrushInput = {
    where: CrushWhereUniqueInput
    create: XOR<CrushCreateWithoutCrushInput, CrushUncheckedCreateWithoutCrushInput>
  }

  export type CrushCreateManyCrushInputEnvelope = {
    data: CrushCreateManyCrushInput | CrushCreateManyCrushInput[]
  }

  export type CloseFriendRequestCreateWithoutSenderInput = {
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    receiver: UserCreateNestedOneWithoutReceivedCloseFriendRequestsInput
  }

  export type CloseFriendRequestUncheckedCreateWithoutSenderInput = {
    id?: number
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    receiverId: number
  }

  export type CloseFriendRequestCreateOrConnectWithoutSenderInput = {
    where: CloseFriendRequestWhereUniqueInput
    create: XOR<CloseFriendRequestCreateWithoutSenderInput, CloseFriendRequestUncheckedCreateWithoutSenderInput>
  }

  export type CloseFriendRequestCreateManySenderInputEnvelope = {
    data: CloseFriendRequestCreateManySenderInput | CloseFriendRequestCreateManySenderInput[]
  }

  export type CloseFriendRequestCreateWithoutReceiverInput = {
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    sender: UserCreateNestedOneWithoutSentCloseFriendRequestsInput
  }

  export type CloseFriendRequestUncheckedCreateWithoutReceiverInput = {
    id?: number
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    senderId: number
  }

  export type CloseFriendRequestCreateOrConnectWithoutReceiverInput = {
    where: CloseFriendRequestWhereUniqueInput
    create: XOR<CloseFriendRequestCreateWithoutReceiverInput, CloseFriendRequestUncheckedCreateWithoutReceiverInput>
  }

  export type CloseFriendRequestCreateManyReceiverInputEnvelope = {
    data: CloseFriendRequestCreateManyReceiverInput | CloseFriendRequestCreateManyReceiverInput[]
  }

  export type LanguageRoomCreateWithoutCreatorInput = {
    roomName: string
    topic: string
    language: string
    createdAt?: Date | string
  }

  export type LanguageRoomUncheckedCreateWithoutCreatorInput = {
    id?: number
    roomName: string
    topic: string
    language: string
    createdAt?: Date | string
  }

  export type LanguageRoomCreateOrConnectWithoutCreatorInput = {
    where: LanguageRoomWhereUniqueInput
    create: XOR<LanguageRoomCreateWithoutCreatorInput, LanguageRoomUncheckedCreateWithoutCreatorInput>
  }

  export type LanguageRoomCreateManyCreatorInputEnvelope = {
    data: LanguageRoomCreateManyCreatorInput | LanguageRoomCreateManyCreatorInput[]
  }

  export type GroupCreateWithoutCreatorInput = {
    name: string
    description?: string | null
    isPrivate?: boolean
    entryKey?: string | null
    createdAt?: Date | string
    members?: GroupMemberCreateNestedManyWithoutGroupInput
    messages?: GroupMessageCreateNestedManyWithoutGroupInput
  }

  export type GroupUncheckedCreateWithoutCreatorInput = {
    id?: number
    name: string
    description?: string | null
    isPrivate?: boolean
    entryKey?: string | null
    createdAt?: Date | string
    members?: GroupMemberUncheckedCreateNestedManyWithoutGroupInput
    messages?: GroupMessageUncheckedCreateNestedManyWithoutGroupInput
  }

  export type GroupCreateOrConnectWithoutCreatorInput = {
    where: GroupWhereUniqueInput
    create: XOR<GroupCreateWithoutCreatorInput, GroupUncheckedCreateWithoutCreatorInput>
  }

  export type GroupCreateManyCreatorInputEnvelope = {
    data: GroupCreateManyCreatorInput | GroupCreateManyCreatorInput[]
  }

  export type GroupMemberCreateWithoutUserInput = {
    joinedAt?: Date | string
    group: GroupCreateNestedOneWithoutMembersInput
  }

  export type GroupMemberUncheckedCreateWithoutUserInput = {
    id?: number
    joinedAt?: Date | string
    groupId: number
  }

  export type GroupMemberCreateOrConnectWithoutUserInput = {
    where: GroupMemberWhereUniqueInput
    create: XOR<GroupMemberCreateWithoutUserInput, GroupMemberUncheckedCreateWithoutUserInput>
  }

  export type GroupMemberCreateManyUserInputEnvelope = {
    data: GroupMemberCreateManyUserInput | GroupMemberCreateManyUserInput[]
  }

  export type GroupMessageCreateWithoutSenderInput = {
    content: string
    createdAt?: Date | string
    group: GroupCreateNestedOneWithoutMessagesInput
  }

  export type GroupMessageUncheckedCreateWithoutSenderInput = {
    id?: number
    content: string
    createdAt?: Date | string
    groupId: number
  }

  export type GroupMessageCreateOrConnectWithoutSenderInput = {
    where: GroupMessageWhereUniqueInput
    create: XOR<GroupMessageCreateWithoutSenderInput, GroupMessageUncheckedCreateWithoutSenderInput>
  }

  export type GroupMessageCreateManySenderInputEnvelope = {
    data: GroupMessageCreateManySenderInput | GroupMessageCreateManySenderInput[]
  }

  export type PostUpsertWithWhereUniqueWithoutAuthorInput = {
    where: PostWhereUniqueInput
    update: XOR<PostUpdateWithoutAuthorInput, PostUncheckedUpdateWithoutAuthorInput>
    create: XOR<PostCreateWithoutAuthorInput, PostUncheckedCreateWithoutAuthorInput>
  }

  export type PostUpdateWithWhereUniqueWithoutAuthorInput = {
    where: PostWhereUniqueInput
    data: XOR<PostUpdateWithoutAuthorInput, PostUncheckedUpdateWithoutAuthorInput>
  }

  export type PostUpdateManyWithWhereWithoutAuthorInput = {
    where: PostScalarWhereInput
    data: XOR<PostUpdateManyMutationInput, PostUncheckedUpdateManyWithoutAuthorInput>
  }

  export type PostScalarWhereInput = {
    AND?: PostScalarWhereInput | PostScalarWhereInput[]
    OR?: PostScalarWhereInput[]
    NOT?: PostScalarWhereInput | PostScalarWhereInput[]
    id?: IntFilter<"Post"> | number
    content?: StringFilter<"Post"> | string
    image?: StringNullableFilter<"Post"> | string | null
    visibility?: StringFilter<"Post"> | string
    createdAt?: DateTimeFilter<"Post"> | Date | string
    updatedAt?: DateTimeFilter<"Post"> | Date | string
    authorId?: IntFilter<"Post"> | number
  }

  export type CommentUpsertWithWhereUniqueWithoutAuthorInput = {
    where: CommentWhereUniqueInput
    update: XOR<CommentUpdateWithoutAuthorInput, CommentUncheckedUpdateWithoutAuthorInput>
    create: XOR<CommentCreateWithoutAuthorInput, CommentUncheckedCreateWithoutAuthorInput>
  }

  export type CommentUpdateWithWhereUniqueWithoutAuthorInput = {
    where: CommentWhereUniqueInput
    data: XOR<CommentUpdateWithoutAuthorInput, CommentUncheckedUpdateWithoutAuthorInput>
  }

  export type CommentUpdateManyWithWhereWithoutAuthorInput = {
    where: CommentScalarWhereInput
    data: XOR<CommentUpdateManyMutationInput, CommentUncheckedUpdateManyWithoutAuthorInput>
  }

  export type CommentScalarWhereInput = {
    AND?: CommentScalarWhereInput | CommentScalarWhereInput[]
    OR?: CommentScalarWhereInput[]
    NOT?: CommentScalarWhereInput | CommentScalarWhereInput[]
    id?: IntFilter<"Comment"> | number
    content?: StringFilter<"Comment"> | string
    createdAt?: DateTimeFilter<"Comment"> | Date | string
    updatedAt?: DateTimeFilter<"Comment"> | Date | string
    postId?: IntFilter<"Comment"> | number
    authorId?: IntFilter<"Comment"> | number
  }

  export type PostUpsertWithWhereUniqueWithoutLikesInput = {
    where: PostWhereUniqueInput
    update: XOR<PostUpdateWithoutLikesInput, PostUncheckedUpdateWithoutLikesInput>
    create: XOR<PostCreateWithoutLikesInput, PostUncheckedCreateWithoutLikesInput>
  }

  export type PostUpdateWithWhereUniqueWithoutLikesInput = {
    where: PostWhereUniqueInput
    data: XOR<PostUpdateWithoutLikesInput, PostUncheckedUpdateWithoutLikesInput>
  }

  export type PostUpdateManyWithWhereWithoutLikesInput = {
    where: PostScalarWhereInput
    data: XOR<PostUpdateManyMutationInput, PostUncheckedUpdateManyWithoutLikesInput>
  }

  export type FriendshipUpsertWithWhereUniqueWithoutSenderInput = {
    where: FriendshipWhereUniqueInput
    update: XOR<FriendshipUpdateWithoutSenderInput, FriendshipUncheckedUpdateWithoutSenderInput>
    create: XOR<FriendshipCreateWithoutSenderInput, FriendshipUncheckedCreateWithoutSenderInput>
  }

  export type FriendshipUpdateWithWhereUniqueWithoutSenderInput = {
    where: FriendshipWhereUniqueInput
    data: XOR<FriendshipUpdateWithoutSenderInput, FriendshipUncheckedUpdateWithoutSenderInput>
  }

  export type FriendshipUpdateManyWithWhereWithoutSenderInput = {
    where: FriendshipScalarWhereInput
    data: XOR<FriendshipUpdateManyMutationInput, FriendshipUncheckedUpdateManyWithoutSenderInput>
  }

  export type FriendshipScalarWhereInput = {
    AND?: FriendshipScalarWhereInput | FriendshipScalarWhereInput[]
    OR?: FriendshipScalarWhereInput[]
    NOT?: FriendshipScalarWhereInput | FriendshipScalarWhereInput[]
    id?: IntFilter<"Friendship"> | number
    status?: StringFilter<"Friendship"> | string
    isCloseFriend?: BoolFilter<"Friendship"> | boolean
    createdAt?: DateTimeFilter<"Friendship"> | Date | string
    updatedAt?: DateTimeFilter<"Friendship"> | Date | string
    senderId?: IntFilter<"Friendship"> | number
    receiverId?: IntFilter<"Friendship"> | number
  }

  export type FriendshipUpsertWithWhereUniqueWithoutReceiverInput = {
    where: FriendshipWhereUniqueInput
    update: XOR<FriendshipUpdateWithoutReceiverInput, FriendshipUncheckedUpdateWithoutReceiverInput>
    create: XOR<FriendshipCreateWithoutReceiverInput, FriendshipUncheckedCreateWithoutReceiverInput>
  }

  export type FriendshipUpdateWithWhereUniqueWithoutReceiverInput = {
    where: FriendshipWhereUniqueInput
    data: XOR<FriendshipUpdateWithoutReceiverInput, FriendshipUncheckedUpdateWithoutReceiverInput>
  }

  export type FriendshipUpdateManyWithWhereWithoutReceiverInput = {
    where: FriendshipScalarWhereInput
    data: XOR<FriendshipUpdateManyMutationInput, FriendshipUncheckedUpdateManyWithoutReceiverInput>
  }

  export type MessageUpsertWithWhereUniqueWithoutSenderInput = {
    where: MessageWhereUniqueInput
    update: XOR<MessageUpdateWithoutSenderInput, MessageUncheckedUpdateWithoutSenderInput>
    create: XOR<MessageCreateWithoutSenderInput, MessageUncheckedCreateWithoutSenderInput>
  }

  export type MessageUpdateWithWhereUniqueWithoutSenderInput = {
    where: MessageWhereUniqueInput
    data: XOR<MessageUpdateWithoutSenderInput, MessageUncheckedUpdateWithoutSenderInput>
  }

  export type MessageUpdateManyWithWhereWithoutSenderInput = {
    where: MessageScalarWhereInput
    data: XOR<MessageUpdateManyMutationInput, MessageUncheckedUpdateManyWithoutSenderInput>
  }

  export type MessageScalarWhereInput = {
    AND?: MessageScalarWhereInput | MessageScalarWhereInput[]
    OR?: MessageScalarWhereInput[]
    NOT?: MessageScalarWhereInput | MessageScalarWhereInput[]
    id?: IntFilter<"Message"> | number
    content?: StringFilter<"Message"> | string
    isRead?: BoolFilter<"Message"> | boolean
    createdAt?: DateTimeFilter<"Message"> | Date | string
    senderId?: IntFilter<"Message"> | number
    receiverId?: IntFilter<"Message"> | number
  }

  export type MessageUpsertWithWhereUniqueWithoutReceiverInput = {
    where: MessageWhereUniqueInput
    update: XOR<MessageUpdateWithoutReceiverInput, MessageUncheckedUpdateWithoutReceiverInput>
    create: XOR<MessageCreateWithoutReceiverInput, MessageUncheckedCreateWithoutReceiverInput>
  }

  export type MessageUpdateWithWhereUniqueWithoutReceiverInput = {
    where: MessageWhereUniqueInput
    data: XOR<MessageUpdateWithoutReceiverInput, MessageUncheckedUpdateWithoutReceiverInput>
  }

  export type MessageUpdateManyWithWhereWithoutReceiverInput = {
    where: MessageScalarWhereInput
    data: XOR<MessageUpdateManyMutationInput, MessageUncheckedUpdateManyWithoutReceiverInput>
  }

  export type CrushUpsertWithWhereUniqueWithoutUserInput = {
    where: CrushWhereUniqueInput
    update: XOR<CrushUpdateWithoutUserInput, CrushUncheckedUpdateWithoutUserInput>
    create: XOR<CrushCreateWithoutUserInput, CrushUncheckedCreateWithoutUserInput>
  }

  export type CrushUpdateWithWhereUniqueWithoutUserInput = {
    where: CrushWhereUniqueInput
    data: XOR<CrushUpdateWithoutUserInput, CrushUncheckedUpdateWithoutUserInput>
  }

  export type CrushUpdateManyWithWhereWithoutUserInput = {
    where: CrushScalarWhereInput
    data: XOR<CrushUpdateManyMutationInput, CrushUncheckedUpdateManyWithoutUserInput>
  }

  export type CrushScalarWhereInput = {
    AND?: CrushScalarWhereInput | CrushScalarWhereInput[]
    OR?: CrushScalarWhereInput[]
    NOT?: CrushScalarWhereInput | CrushScalarWhereInput[]
    id?: IntFilter<"Crush"> | number
    createdAt?: DateTimeFilter<"Crush"> | Date | string
    userId?: IntFilter<"Crush"> | number
    crushId?: IntFilter<"Crush"> | number
  }

  export type CrushUpsertWithWhereUniqueWithoutCrushInput = {
    where: CrushWhereUniqueInput
    update: XOR<CrushUpdateWithoutCrushInput, CrushUncheckedUpdateWithoutCrushInput>
    create: XOR<CrushCreateWithoutCrushInput, CrushUncheckedCreateWithoutCrushInput>
  }

  export type CrushUpdateWithWhereUniqueWithoutCrushInput = {
    where: CrushWhereUniqueInput
    data: XOR<CrushUpdateWithoutCrushInput, CrushUncheckedUpdateWithoutCrushInput>
  }

  export type CrushUpdateManyWithWhereWithoutCrushInput = {
    where: CrushScalarWhereInput
    data: XOR<CrushUpdateManyMutationInput, CrushUncheckedUpdateManyWithoutCrushInput>
  }

  export type CloseFriendRequestUpsertWithWhereUniqueWithoutSenderInput = {
    where: CloseFriendRequestWhereUniqueInput
    update: XOR<CloseFriendRequestUpdateWithoutSenderInput, CloseFriendRequestUncheckedUpdateWithoutSenderInput>
    create: XOR<CloseFriendRequestCreateWithoutSenderInput, CloseFriendRequestUncheckedCreateWithoutSenderInput>
  }

  export type CloseFriendRequestUpdateWithWhereUniqueWithoutSenderInput = {
    where: CloseFriendRequestWhereUniqueInput
    data: XOR<CloseFriendRequestUpdateWithoutSenderInput, CloseFriendRequestUncheckedUpdateWithoutSenderInput>
  }

  export type CloseFriendRequestUpdateManyWithWhereWithoutSenderInput = {
    where: CloseFriendRequestScalarWhereInput
    data: XOR<CloseFriendRequestUpdateManyMutationInput, CloseFriendRequestUncheckedUpdateManyWithoutSenderInput>
  }

  export type CloseFriendRequestScalarWhereInput = {
    AND?: CloseFriendRequestScalarWhereInput | CloseFriendRequestScalarWhereInput[]
    OR?: CloseFriendRequestScalarWhereInput[]
    NOT?: CloseFriendRequestScalarWhereInput | CloseFriendRequestScalarWhereInput[]
    id?: IntFilter<"CloseFriendRequest"> | number
    status?: StringFilter<"CloseFriendRequest"> | string
    createdAt?: DateTimeFilter<"CloseFriendRequest"> | Date | string
    updatedAt?: DateTimeFilter<"CloseFriendRequest"> | Date | string
    senderId?: IntFilter<"CloseFriendRequest"> | number
    receiverId?: IntFilter<"CloseFriendRequest"> | number
  }

  export type CloseFriendRequestUpsertWithWhereUniqueWithoutReceiverInput = {
    where: CloseFriendRequestWhereUniqueInput
    update: XOR<CloseFriendRequestUpdateWithoutReceiverInput, CloseFriendRequestUncheckedUpdateWithoutReceiverInput>
    create: XOR<CloseFriendRequestCreateWithoutReceiverInput, CloseFriendRequestUncheckedCreateWithoutReceiverInput>
  }

  export type CloseFriendRequestUpdateWithWhereUniqueWithoutReceiverInput = {
    where: CloseFriendRequestWhereUniqueInput
    data: XOR<CloseFriendRequestUpdateWithoutReceiverInput, CloseFriendRequestUncheckedUpdateWithoutReceiverInput>
  }

  export type CloseFriendRequestUpdateManyWithWhereWithoutReceiverInput = {
    where: CloseFriendRequestScalarWhereInput
    data: XOR<CloseFriendRequestUpdateManyMutationInput, CloseFriendRequestUncheckedUpdateManyWithoutReceiverInput>
  }

  export type LanguageRoomUpsertWithWhereUniqueWithoutCreatorInput = {
    where: LanguageRoomWhereUniqueInput
    update: XOR<LanguageRoomUpdateWithoutCreatorInput, LanguageRoomUncheckedUpdateWithoutCreatorInput>
    create: XOR<LanguageRoomCreateWithoutCreatorInput, LanguageRoomUncheckedCreateWithoutCreatorInput>
  }

  export type LanguageRoomUpdateWithWhereUniqueWithoutCreatorInput = {
    where: LanguageRoomWhereUniqueInput
    data: XOR<LanguageRoomUpdateWithoutCreatorInput, LanguageRoomUncheckedUpdateWithoutCreatorInput>
  }

  export type LanguageRoomUpdateManyWithWhereWithoutCreatorInput = {
    where: LanguageRoomScalarWhereInput
    data: XOR<LanguageRoomUpdateManyMutationInput, LanguageRoomUncheckedUpdateManyWithoutCreatorInput>
  }

  export type LanguageRoomScalarWhereInput = {
    AND?: LanguageRoomScalarWhereInput | LanguageRoomScalarWhereInput[]
    OR?: LanguageRoomScalarWhereInput[]
    NOT?: LanguageRoomScalarWhereInput | LanguageRoomScalarWhereInput[]
    id?: IntFilter<"LanguageRoom"> | number
    roomName?: StringFilter<"LanguageRoom"> | string
    topic?: StringFilter<"LanguageRoom"> | string
    language?: StringFilter<"LanguageRoom"> | string
    createdAt?: DateTimeFilter<"LanguageRoom"> | Date | string
    creatorId?: IntFilter<"LanguageRoom"> | number
  }

  export type GroupUpsertWithWhereUniqueWithoutCreatorInput = {
    where: GroupWhereUniqueInput
    update: XOR<GroupUpdateWithoutCreatorInput, GroupUncheckedUpdateWithoutCreatorInput>
    create: XOR<GroupCreateWithoutCreatorInput, GroupUncheckedCreateWithoutCreatorInput>
  }

  export type GroupUpdateWithWhereUniqueWithoutCreatorInput = {
    where: GroupWhereUniqueInput
    data: XOR<GroupUpdateWithoutCreatorInput, GroupUncheckedUpdateWithoutCreatorInput>
  }

  export type GroupUpdateManyWithWhereWithoutCreatorInput = {
    where: GroupScalarWhereInput
    data: XOR<GroupUpdateManyMutationInput, GroupUncheckedUpdateManyWithoutCreatorInput>
  }

  export type GroupScalarWhereInput = {
    AND?: GroupScalarWhereInput | GroupScalarWhereInput[]
    OR?: GroupScalarWhereInput[]
    NOT?: GroupScalarWhereInput | GroupScalarWhereInput[]
    id?: IntFilter<"Group"> | number
    name?: StringFilter<"Group"> | string
    description?: StringNullableFilter<"Group"> | string | null
    isPrivate?: BoolFilter<"Group"> | boolean
    entryKey?: StringNullableFilter<"Group"> | string | null
    createdAt?: DateTimeFilter<"Group"> | Date | string
    creatorId?: IntFilter<"Group"> | number
  }

  export type GroupMemberUpsertWithWhereUniqueWithoutUserInput = {
    where: GroupMemberWhereUniqueInput
    update: XOR<GroupMemberUpdateWithoutUserInput, GroupMemberUncheckedUpdateWithoutUserInput>
    create: XOR<GroupMemberCreateWithoutUserInput, GroupMemberUncheckedCreateWithoutUserInput>
  }

  export type GroupMemberUpdateWithWhereUniqueWithoutUserInput = {
    where: GroupMemberWhereUniqueInput
    data: XOR<GroupMemberUpdateWithoutUserInput, GroupMemberUncheckedUpdateWithoutUserInput>
  }

  export type GroupMemberUpdateManyWithWhereWithoutUserInput = {
    where: GroupMemberScalarWhereInput
    data: XOR<GroupMemberUpdateManyMutationInput, GroupMemberUncheckedUpdateManyWithoutUserInput>
  }

  export type GroupMemberScalarWhereInput = {
    AND?: GroupMemberScalarWhereInput | GroupMemberScalarWhereInput[]
    OR?: GroupMemberScalarWhereInput[]
    NOT?: GroupMemberScalarWhereInput | GroupMemberScalarWhereInput[]
    id?: IntFilter<"GroupMember"> | number
    joinedAt?: DateTimeFilter<"GroupMember"> | Date | string
    groupId?: IntFilter<"GroupMember"> | number
    userId?: IntFilter<"GroupMember"> | number
  }

  export type GroupMessageUpsertWithWhereUniqueWithoutSenderInput = {
    where: GroupMessageWhereUniqueInput
    update: XOR<GroupMessageUpdateWithoutSenderInput, GroupMessageUncheckedUpdateWithoutSenderInput>
    create: XOR<GroupMessageCreateWithoutSenderInput, GroupMessageUncheckedCreateWithoutSenderInput>
  }

  export type GroupMessageUpdateWithWhereUniqueWithoutSenderInput = {
    where: GroupMessageWhereUniqueInput
    data: XOR<GroupMessageUpdateWithoutSenderInput, GroupMessageUncheckedUpdateWithoutSenderInput>
  }

  export type GroupMessageUpdateManyWithWhereWithoutSenderInput = {
    where: GroupMessageScalarWhereInput
    data: XOR<GroupMessageUpdateManyMutationInput, GroupMessageUncheckedUpdateManyWithoutSenderInput>
  }

  export type GroupMessageScalarWhereInput = {
    AND?: GroupMessageScalarWhereInput | GroupMessageScalarWhereInput[]
    OR?: GroupMessageScalarWhereInput[]
    NOT?: GroupMessageScalarWhereInput | GroupMessageScalarWhereInput[]
    id?: IntFilter<"GroupMessage"> | number
    content?: StringFilter<"GroupMessage"> | string
    createdAt?: DateTimeFilter<"GroupMessage"> | Date | string
    groupId?: IntFilter<"GroupMessage"> | number
    senderId?: IntFilter<"GroupMessage"> | number
  }

  export type UserCreateWithoutPostsInput = {
    name: string
    email: string
    password?: string | null
    googleId?: string | null
    bio?: string | null
    profilePicture?: string | null
    collegeName?: string | null
    department?: string | null
    yearOfStudy?: string | null
    phoneNumber?: string | null
    phoneVisibility?: string
    whatsappNumber?: string | null
    whatsappVisibility?: string
    instagramHandle?: string | null
    instagramVisibility?: string
    facebookUrl?: string | null
    facebookVisibility?: string
    snapchatUsername?: string | null
    snapchatVisibility?: string
    linkedinUrl?: string | null
    linkedinVisibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    comments?: CommentCreateNestedManyWithoutAuthorInput
    likedPosts?: PostCreateNestedManyWithoutLikesInput
    sentFriendRequests?: FriendshipCreateNestedManyWithoutSenderInput
    receivedFriendRequests?: FriendshipCreateNestedManyWithoutReceiverInput
    sentMessages?: MessageCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageCreateNestedManyWithoutReceiverInput
    myCrushes?: CrushCreateNestedManyWithoutUserInput
    crushedBy?: CrushCreateNestedManyWithoutCrushInput
    sentCloseFriendRequests?: CloseFriendRequestCreateNestedManyWithoutSenderInput
    receivedCloseFriendRequests?: CloseFriendRequestCreateNestedManyWithoutReceiverInput
    languageRooms?: LanguageRoomCreateNestedManyWithoutCreatorInput
    createdGroups?: GroupCreateNestedManyWithoutCreatorInput
    groupMembers?: GroupMemberCreateNestedManyWithoutUserInput
    groupMessages?: GroupMessageCreateNestedManyWithoutSenderInput
  }

  export type UserUncheckedCreateWithoutPostsInput = {
    id?: number
    name: string
    email: string
    password?: string | null
    googleId?: string | null
    bio?: string | null
    profilePicture?: string | null
    collegeName?: string | null
    department?: string | null
    yearOfStudy?: string | null
    phoneNumber?: string | null
    phoneVisibility?: string
    whatsappNumber?: string | null
    whatsappVisibility?: string
    instagramHandle?: string | null
    instagramVisibility?: string
    facebookUrl?: string | null
    facebookVisibility?: string
    snapchatUsername?: string | null
    snapchatVisibility?: string
    linkedinUrl?: string | null
    linkedinVisibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    comments?: CommentUncheckedCreateNestedManyWithoutAuthorInput
    likedPosts?: PostUncheckedCreateNestedManyWithoutLikesInput
    sentFriendRequests?: FriendshipUncheckedCreateNestedManyWithoutSenderInput
    receivedFriendRequests?: FriendshipUncheckedCreateNestedManyWithoutReceiverInput
    sentMessages?: MessageUncheckedCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageUncheckedCreateNestedManyWithoutReceiverInput
    myCrushes?: CrushUncheckedCreateNestedManyWithoutUserInput
    crushedBy?: CrushUncheckedCreateNestedManyWithoutCrushInput
    sentCloseFriendRequests?: CloseFriendRequestUncheckedCreateNestedManyWithoutSenderInput
    receivedCloseFriendRequests?: CloseFriendRequestUncheckedCreateNestedManyWithoutReceiverInput
    languageRooms?: LanguageRoomUncheckedCreateNestedManyWithoutCreatorInput
    createdGroups?: GroupUncheckedCreateNestedManyWithoutCreatorInput
    groupMembers?: GroupMemberUncheckedCreateNestedManyWithoutUserInput
    groupMessages?: GroupMessageUncheckedCreateNestedManyWithoutSenderInput
  }

  export type UserCreateOrConnectWithoutPostsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutPostsInput, UserUncheckedCreateWithoutPostsInput>
  }

  export type UserCreateWithoutLikedPostsInput = {
    name: string
    email: string
    password?: string | null
    googleId?: string | null
    bio?: string | null
    profilePicture?: string | null
    collegeName?: string | null
    department?: string | null
    yearOfStudy?: string | null
    phoneNumber?: string | null
    phoneVisibility?: string
    whatsappNumber?: string | null
    whatsappVisibility?: string
    instagramHandle?: string | null
    instagramVisibility?: string
    facebookUrl?: string | null
    facebookVisibility?: string
    snapchatUsername?: string | null
    snapchatVisibility?: string
    linkedinUrl?: string | null
    linkedinVisibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostCreateNestedManyWithoutAuthorInput
    comments?: CommentCreateNestedManyWithoutAuthorInput
    sentFriendRequests?: FriendshipCreateNestedManyWithoutSenderInput
    receivedFriendRequests?: FriendshipCreateNestedManyWithoutReceiverInput
    sentMessages?: MessageCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageCreateNestedManyWithoutReceiverInput
    myCrushes?: CrushCreateNestedManyWithoutUserInput
    crushedBy?: CrushCreateNestedManyWithoutCrushInput
    sentCloseFriendRequests?: CloseFriendRequestCreateNestedManyWithoutSenderInput
    receivedCloseFriendRequests?: CloseFriendRequestCreateNestedManyWithoutReceiverInput
    languageRooms?: LanguageRoomCreateNestedManyWithoutCreatorInput
    createdGroups?: GroupCreateNestedManyWithoutCreatorInput
    groupMembers?: GroupMemberCreateNestedManyWithoutUserInput
    groupMessages?: GroupMessageCreateNestedManyWithoutSenderInput
  }

  export type UserUncheckedCreateWithoutLikedPostsInput = {
    id?: number
    name: string
    email: string
    password?: string | null
    googleId?: string | null
    bio?: string | null
    profilePicture?: string | null
    collegeName?: string | null
    department?: string | null
    yearOfStudy?: string | null
    phoneNumber?: string | null
    phoneVisibility?: string
    whatsappNumber?: string | null
    whatsappVisibility?: string
    instagramHandle?: string | null
    instagramVisibility?: string
    facebookUrl?: string | null
    facebookVisibility?: string
    snapchatUsername?: string | null
    snapchatVisibility?: string
    linkedinUrl?: string | null
    linkedinVisibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostUncheckedCreateNestedManyWithoutAuthorInput
    comments?: CommentUncheckedCreateNestedManyWithoutAuthorInput
    sentFriendRequests?: FriendshipUncheckedCreateNestedManyWithoutSenderInput
    receivedFriendRequests?: FriendshipUncheckedCreateNestedManyWithoutReceiverInput
    sentMessages?: MessageUncheckedCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageUncheckedCreateNestedManyWithoutReceiverInput
    myCrushes?: CrushUncheckedCreateNestedManyWithoutUserInput
    crushedBy?: CrushUncheckedCreateNestedManyWithoutCrushInput
    sentCloseFriendRequests?: CloseFriendRequestUncheckedCreateNestedManyWithoutSenderInput
    receivedCloseFriendRequests?: CloseFriendRequestUncheckedCreateNestedManyWithoutReceiverInput
    languageRooms?: LanguageRoomUncheckedCreateNestedManyWithoutCreatorInput
    createdGroups?: GroupUncheckedCreateNestedManyWithoutCreatorInput
    groupMembers?: GroupMemberUncheckedCreateNestedManyWithoutUserInput
    groupMessages?: GroupMessageUncheckedCreateNestedManyWithoutSenderInput
  }

  export type UserCreateOrConnectWithoutLikedPostsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutLikedPostsInput, UserUncheckedCreateWithoutLikedPostsInput>
  }

  export type CommentCreateWithoutPostInput = {
    content: string
    createdAt?: Date | string
    updatedAt?: Date | string
    author: UserCreateNestedOneWithoutCommentsInput
  }

  export type CommentUncheckedCreateWithoutPostInput = {
    id?: number
    content: string
    createdAt?: Date | string
    updatedAt?: Date | string
    authorId: number
  }

  export type CommentCreateOrConnectWithoutPostInput = {
    where: CommentWhereUniqueInput
    create: XOR<CommentCreateWithoutPostInput, CommentUncheckedCreateWithoutPostInput>
  }

  export type CommentCreateManyPostInputEnvelope = {
    data: CommentCreateManyPostInput | CommentCreateManyPostInput[]
  }

  export type UserUpsertWithoutPostsInput = {
    update: XOR<UserUpdateWithoutPostsInput, UserUncheckedUpdateWithoutPostsInput>
    create: XOR<UserCreateWithoutPostsInput, UserUncheckedCreateWithoutPostsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutPostsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutPostsInput, UserUncheckedUpdateWithoutPostsInput>
  }

  export type UserUpdateWithoutPostsInput = {
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    googleId?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    collegeName?: NullableStringFieldUpdateOperationsInput | string | null
    department?: NullableStringFieldUpdateOperationsInput | string | null
    yearOfStudy?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    phoneVisibility?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: NullableStringFieldUpdateOperationsInput | string | null
    whatsappVisibility?: StringFieldUpdateOperationsInput | string
    instagramHandle?: NullableStringFieldUpdateOperationsInput | string | null
    instagramVisibility?: StringFieldUpdateOperationsInput | string
    facebookUrl?: NullableStringFieldUpdateOperationsInput | string | null
    facebookVisibility?: StringFieldUpdateOperationsInput | string
    snapchatUsername?: NullableStringFieldUpdateOperationsInput | string | null
    snapchatVisibility?: StringFieldUpdateOperationsInput | string
    linkedinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    linkedinVisibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    comments?: CommentUpdateManyWithoutAuthorNestedInput
    likedPosts?: PostUpdateManyWithoutLikesNestedInput
    sentFriendRequests?: FriendshipUpdateManyWithoutSenderNestedInput
    receivedFriendRequests?: FriendshipUpdateManyWithoutReceiverNestedInput
    sentMessages?: MessageUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUpdateManyWithoutReceiverNestedInput
    myCrushes?: CrushUpdateManyWithoutUserNestedInput
    crushedBy?: CrushUpdateManyWithoutCrushNestedInput
    sentCloseFriendRequests?: CloseFriendRequestUpdateManyWithoutSenderNestedInput
    receivedCloseFriendRequests?: CloseFriendRequestUpdateManyWithoutReceiverNestedInput
    languageRooms?: LanguageRoomUpdateManyWithoutCreatorNestedInput
    createdGroups?: GroupUpdateManyWithoutCreatorNestedInput
    groupMembers?: GroupMemberUpdateManyWithoutUserNestedInput
    groupMessages?: GroupMessageUpdateManyWithoutSenderNestedInput
  }

  export type UserUncheckedUpdateWithoutPostsInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    googleId?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    collegeName?: NullableStringFieldUpdateOperationsInput | string | null
    department?: NullableStringFieldUpdateOperationsInput | string | null
    yearOfStudy?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    phoneVisibility?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: NullableStringFieldUpdateOperationsInput | string | null
    whatsappVisibility?: StringFieldUpdateOperationsInput | string
    instagramHandle?: NullableStringFieldUpdateOperationsInput | string | null
    instagramVisibility?: StringFieldUpdateOperationsInput | string
    facebookUrl?: NullableStringFieldUpdateOperationsInput | string | null
    facebookVisibility?: StringFieldUpdateOperationsInput | string
    snapchatUsername?: NullableStringFieldUpdateOperationsInput | string | null
    snapchatVisibility?: StringFieldUpdateOperationsInput | string
    linkedinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    linkedinVisibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    comments?: CommentUncheckedUpdateManyWithoutAuthorNestedInput
    likedPosts?: PostUncheckedUpdateManyWithoutLikesNestedInput
    sentFriendRequests?: FriendshipUncheckedUpdateManyWithoutSenderNestedInput
    receivedFriendRequests?: FriendshipUncheckedUpdateManyWithoutReceiverNestedInput
    sentMessages?: MessageUncheckedUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUncheckedUpdateManyWithoutReceiverNestedInput
    myCrushes?: CrushUncheckedUpdateManyWithoutUserNestedInput
    crushedBy?: CrushUncheckedUpdateManyWithoutCrushNestedInput
    sentCloseFriendRequests?: CloseFriendRequestUncheckedUpdateManyWithoutSenderNestedInput
    receivedCloseFriendRequests?: CloseFriendRequestUncheckedUpdateManyWithoutReceiverNestedInput
    languageRooms?: LanguageRoomUncheckedUpdateManyWithoutCreatorNestedInput
    createdGroups?: GroupUncheckedUpdateManyWithoutCreatorNestedInput
    groupMembers?: GroupMemberUncheckedUpdateManyWithoutUserNestedInput
    groupMessages?: GroupMessageUncheckedUpdateManyWithoutSenderNestedInput
  }

  export type UserUpsertWithWhereUniqueWithoutLikedPostsInput = {
    where: UserWhereUniqueInput
    update: XOR<UserUpdateWithoutLikedPostsInput, UserUncheckedUpdateWithoutLikedPostsInput>
    create: XOR<UserCreateWithoutLikedPostsInput, UserUncheckedCreateWithoutLikedPostsInput>
  }

  export type UserUpdateWithWhereUniqueWithoutLikedPostsInput = {
    where: UserWhereUniqueInput
    data: XOR<UserUpdateWithoutLikedPostsInput, UserUncheckedUpdateWithoutLikedPostsInput>
  }

  export type UserUpdateManyWithWhereWithoutLikedPostsInput = {
    where: UserScalarWhereInput
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyWithoutLikedPostsInput>
  }

  export type UserScalarWhereInput = {
    AND?: UserScalarWhereInput | UserScalarWhereInput[]
    OR?: UserScalarWhereInput[]
    NOT?: UserScalarWhereInput | UserScalarWhereInput[]
    id?: IntFilter<"User"> | number
    name?: StringFilter<"User"> | string
    email?: StringFilter<"User"> | string
    password?: StringNullableFilter<"User"> | string | null
    googleId?: StringNullableFilter<"User"> | string | null
    bio?: StringNullableFilter<"User"> | string | null
    profilePicture?: StringNullableFilter<"User"> | string | null
    collegeName?: StringNullableFilter<"User"> | string | null
    department?: StringNullableFilter<"User"> | string | null
    yearOfStudy?: StringNullableFilter<"User"> | string | null
    phoneNumber?: StringNullableFilter<"User"> | string | null
    phoneVisibility?: StringFilter<"User"> | string
    whatsappNumber?: StringNullableFilter<"User"> | string | null
    whatsappVisibility?: StringFilter<"User"> | string
    instagramHandle?: StringNullableFilter<"User"> | string | null
    instagramVisibility?: StringFilter<"User"> | string
    facebookUrl?: StringNullableFilter<"User"> | string | null
    facebookVisibility?: StringFilter<"User"> | string
    snapchatUsername?: StringNullableFilter<"User"> | string | null
    snapchatVisibility?: StringFilter<"User"> | string
    linkedinUrl?: StringNullableFilter<"User"> | string | null
    linkedinVisibility?: StringFilter<"User"> | string
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
  }

  export type CommentUpsertWithWhereUniqueWithoutPostInput = {
    where: CommentWhereUniqueInput
    update: XOR<CommentUpdateWithoutPostInput, CommentUncheckedUpdateWithoutPostInput>
    create: XOR<CommentCreateWithoutPostInput, CommentUncheckedCreateWithoutPostInput>
  }

  export type CommentUpdateWithWhereUniqueWithoutPostInput = {
    where: CommentWhereUniqueInput
    data: XOR<CommentUpdateWithoutPostInput, CommentUncheckedUpdateWithoutPostInput>
  }

  export type CommentUpdateManyWithWhereWithoutPostInput = {
    where: CommentScalarWhereInput
    data: XOR<CommentUpdateManyMutationInput, CommentUncheckedUpdateManyWithoutPostInput>
  }

  export type UserCreateWithoutSentFriendRequestsInput = {
    name: string
    email: string
    password?: string | null
    googleId?: string | null
    bio?: string | null
    profilePicture?: string | null
    collegeName?: string | null
    department?: string | null
    yearOfStudy?: string | null
    phoneNumber?: string | null
    phoneVisibility?: string
    whatsappNumber?: string | null
    whatsappVisibility?: string
    instagramHandle?: string | null
    instagramVisibility?: string
    facebookUrl?: string | null
    facebookVisibility?: string
    snapchatUsername?: string | null
    snapchatVisibility?: string
    linkedinUrl?: string | null
    linkedinVisibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostCreateNestedManyWithoutAuthorInput
    comments?: CommentCreateNestedManyWithoutAuthorInput
    likedPosts?: PostCreateNestedManyWithoutLikesInput
    receivedFriendRequests?: FriendshipCreateNestedManyWithoutReceiverInput
    sentMessages?: MessageCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageCreateNestedManyWithoutReceiverInput
    myCrushes?: CrushCreateNestedManyWithoutUserInput
    crushedBy?: CrushCreateNestedManyWithoutCrushInput
    sentCloseFriendRequests?: CloseFriendRequestCreateNestedManyWithoutSenderInput
    receivedCloseFriendRequests?: CloseFriendRequestCreateNestedManyWithoutReceiverInput
    languageRooms?: LanguageRoomCreateNestedManyWithoutCreatorInput
    createdGroups?: GroupCreateNestedManyWithoutCreatorInput
    groupMembers?: GroupMemberCreateNestedManyWithoutUserInput
    groupMessages?: GroupMessageCreateNestedManyWithoutSenderInput
  }

  export type UserUncheckedCreateWithoutSentFriendRequestsInput = {
    id?: number
    name: string
    email: string
    password?: string | null
    googleId?: string | null
    bio?: string | null
    profilePicture?: string | null
    collegeName?: string | null
    department?: string | null
    yearOfStudy?: string | null
    phoneNumber?: string | null
    phoneVisibility?: string
    whatsappNumber?: string | null
    whatsappVisibility?: string
    instagramHandle?: string | null
    instagramVisibility?: string
    facebookUrl?: string | null
    facebookVisibility?: string
    snapchatUsername?: string | null
    snapchatVisibility?: string
    linkedinUrl?: string | null
    linkedinVisibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostUncheckedCreateNestedManyWithoutAuthorInput
    comments?: CommentUncheckedCreateNestedManyWithoutAuthorInput
    likedPosts?: PostUncheckedCreateNestedManyWithoutLikesInput
    receivedFriendRequests?: FriendshipUncheckedCreateNestedManyWithoutReceiverInput
    sentMessages?: MessageUncheckedCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageUncheckedCreateNestedManyWithoutReceiverInput
    myCrushes?: CrushUncheckedCreateNestedManyWithoutUserInput
    crushedBy?: CrushUncheckedCreateNestedManyWithoutCrushInput
    sentCloseFriendRequests?: CloseFriendRequestUncheckedCreateNestedManyWithoutSenderInput
    receivedCloseFriendRequests?: CloseFriendRequestUncheckedCreateNestedManyWithoutReceiverInput
    languageRooms?: LanguageRoomUncheckedCreateNestedManyWithoutCreatorInput
    createdGroups?: GroupUncheckedCreateNestedManyWithoutCreatorInput
    groupMembers?: GroupMemberUncheckedCreateNestedManyWithoutUserInput
    groupMessages?: GroupMessageUncheckedCreateNestedManyWithoutSenderInput
  }

  export type UserCreateOrConnectWithoutSentFriendRequestsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutSentFriendRequestsInput, UserUncheckedCreateWithoutSentFriendRequestsInput>
  }

  export type UserCreateWithoutReceivedFriendRequestsInput = {
    name: string
    email: string
    password?: string | null
    googleId?: string | null
    bio?: string | null
    profilePicture?: string | null
    collegeName?: string | null
    department?: string | null
    yearOfStudy?: string | null
    phoneNumber?: string | null
    phoneVisibility?: string
    whatsappNumber?: string | null
    whatsappVisibility?: string
    instagramHandle?: string | null
    instagramVisibility?: string
    facebookUrl?: string | null
    facebookVisibility?: string
    snapchatUsername?: string | null
    snapchatVisibility?: string
    linkedinUrl?: string | null
    linkedinVisibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostCreateNestedManyWithoutAuthorInput
    comments?: CommentCreateNestedManyWithoutAuthorInput
    likedPosts?: PostCreateNestedManyWithoutLikesInput
    sentFriendRequests?: FriendshipCreateNestedManyWithoutSenderInput
    sentMessages?: MessageCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageCreateNestedManyWithoutReceiverInput
    myCrushes?: CrushCreateNestedManyWithoutUserInput
    crushedBy?: CrushCreateNestedManyWithoutCrushInput
    sentCloseFriendRequests?: CloseFriendRequestCreateNestedManyWithoutSenderInput
    receivedCloseFriendRequests?: CloseFriendRequestCreateNestedManyWithoutReceiverInput
    languageRooms?: LanguageRoomCreateNestedManyWithoutCreatorInput
    createdGroups?: GroupCreateNestedManyWithoutCreatorInput
    groupMembers?: GroupMemberCreateNestedManyWithoutUserInput
    groupMessages?: GroupMessageCreateNestedManyWithoutSenderInput
  }

  export type UserUncheckedCreateWithoutReceivedFriendRequestsInput = {
    id?: number
    name: string
    email: string
    password?: string | null
    googleId?: string | null
    bio?: string | null
    profilePicture?: string | null
    collegeName?: string | null
    department?: string | null
    yearOfStudy?: string | null
    phoneNumber?: string | null
    phoneVisibility?: string
    whatsappNumber?: string | null
    whatsappVisibility?: string
    instagramHandle?: string | null
    instagramVisibility?: string
    facebookUrl?: string | null
    facebookVisibility?: string
    snapchatUsername?: string | null
    snapchatVisibility?: string
    linkedinUrl?: string | null
    linkedinVisibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostUncheckedCreateNestedManyWithoutAuthorInput
    comments?: CommentUncheckedCreateNestedManyWithoutAuthorInput
    likedPosts?: PostUncheckedCreateNestedManyWithoutLikesInput
    sentFriendRequests?: FriendshipUncheckedCreateNestedManyWithoutSenderInput
    sentMessages?: MessageUncheckedCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageUncheckedCreateNestedManyWithoutReceiverInput
    myCrushes?: CrushUncheckedCreateNestedManyWithoutUserInput
    crushedBy?: CrushUncheckedCreateNestedManyWithoutCrushInput
    sentCloseFriendRequests?: CloseFriendRequestUncheckedCreateNestedManyWithoutSenderInput
    receivedCloseFriendRequests?: CloseFriendRequestUncheckedCreateNestedManyWithoutReceiverInput
    languageRooms?: LanguageRoomUncheckedCreateNestedManyWithoutCreatorInput
    createdGroups?: GroupUncheckedCreateNestedManyWithoutCreatorInput
    groupMembers?: GroupMemberUncheckedCreateNestedManyWithoutUserInput
    groupMessages?: GroupMessageUncheckedCreateNestedManyWithoutSenderInput
  }

  export type UserCreateOrConnectWithoutReceivedFriendRequestsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutReceivedFriendRequestsInput, UserUncheckedCreateWithoutReceivedFriendRequestsInput>
  }

  export type UserUpsertWithoutSentFriendRequestsInput = {
    update: XOR<UserUpdateWithoutSentFriendRequestsInput, UserUncheckedUpdateWithoutSentFriendRequestsInput>
    create: XOR<UserCreateWithoutSentFriendRequestsInput, UserUncheckedCreateWithoutSentFriendRequestsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutSentFriendRequestsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutSentFriendRequestsInput, UserUncheckedUpdateWithoutSentFriendRequestsInput>
  }

  export type UserUpdateWithoutSentFriendRequestsInput = {
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    googleId?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    collegeName?: NullableStringFieldUpdateOperationsInput | string | null
    department?: NullableStringFieldUpdateOperationsInput | string | null
    yearOfStudy?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    phoneVisibility?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: NullableStringFieldUpdateOperationsInput | string | null
    whatsappVisibility?: StringFieldUpdateOperationsInput | string
    instagramHandle?: NullableStringFieldUpdateOperationsInput | string | null
    instagramVisibility?: StringFieldUpdateOperationsInput | string
    facebookUrl?: NullableStringFieldUpdateOperationsInput | string | null
    facebookVisibility?: StringFieldUpdateOperationsInput | string
    snapchatUsername?: NullableStringFieldUpdateOperationsInput | string | null
    snapchatVisibility?: StringFieldUpdateOperationsInput | string
    linkedinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    linkedinVisibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUpdateManyWithoutAuthorNestedInput
    comments?: CommentUpdateManyWithoutAuthorNestedInput
    likedPosts?: PostUpdateManyWithoutLikesNestedInput
    receivedFriendRequests?: FriendshipUpdateManyWithoutReceiverNestedInput
    sentMessages?: MessageUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUpdateManyWithoutReceiverNestedInput
    myCrushes?: CrushUpdateManyWithoutUserNestedInput
    crushedBy?: CrushUpdateManyWithoutCrushNestedInput
    sentCloseFriendRequests?: CloseFriendRequestUpdateManyWithoutSenderNestedInput
    receivedCloseFriendRequests?: CloseFriendRequestUpdateManyWithoutReceiverNestedInput
    languageRooms?: LanguageRoomUpdateManyWithoutCreatorNestedInput
    createdGroups?: GroupUpdateManyWithoutCreatorNestedInput
    groupMembers?: GroupMemberUpdateManyWithoutUserNestedInput
    groupMessages?: GroupMessageUpdateManyWithoutSenderNestedInput
  }

  export type UserUncheckedUpdateWithoutSentFriendRequestsInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    googleId?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    collegeName?: NullableStringFieldUpdateOperationsInput | string | null
    department?: NullableStringFieldUpdateOperationsInput | string | null
    yearOfStudy?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    phoneVisibility?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: NullableStringFieldUpdateOperationsInput | string | null
    whatsappVisibility?: StringFieldUpdateOperationsInput | string
    instagramHandle?: NullableStringFieldUpdateOperationsInput | string | null
    instagramVisibility?: StringFieldUpdateOperationsInput | string
    facebookUrl?: NullableStringFieldUpdateOperationsInput | string | null
    facebookVisibility?: StringFieldUpdateOperationsInput | string
    snapchatUsername?: NullableStringFieldUpdateOperationsInput | string | null
    snapchatVisibility?: StringFieldUpdateOperationsInput | string
    linkedinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    linkedinVisibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUncheckedUpdateManyWithoutAuthorNestedInput
    comments?: CommentUncheckedUpdateManyWithoutAuthorNestedInput
    likedPosts?: PostUncheckedUpdateManyWithoutLikesNestedInput
    receivedFriendRequests?: FriendshipUncheckedUpdateManyWithoutReceiverNestedInput
    sentMessages?: MessageUncheckedUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUncheckedUpdateManyWithoutReceiverNestedInput
    myCrushes?: CrushUncheckedUpdateManyWithoutUserNestedInput
    crushedBy?: CrushUncheckedUpdateManyWithoutCrushNestedInput
    sentCloseFriendRequests?: CloseFriendRequestUncheckedUpdateManyWithoutSenderNestedInput
    receivedCloseFriendRequests?: CloseFriendRequestUncheckedUpdateManyWithoutReceiverNestedInput
    languageRooms?: LanguageRoomUncheckedUpdateManyWithoutCreatorNestedInput
    createdGroups?: GroupUncheckedUpdateManyWithoutCreatorNestedInput
    groupMembers?: GroupMemberUncheckedUpdateManyWithoutUserNestedInput
    groupMessages?: GroupMessageUncheckedUpdateManyWithoutSenderNestedInput
  }

  export type UserUpsertWithoutReceivedFriendRequestsInput = {
    update: XOR<UserUpdateWithoutReceivedFriendRequestsInput, UserUncheckedUpdateWithoutReceivedFriendRequestsInput>
    create: XOR<UserCreateWithoutReceivedFriendRequestsInput, UserUncheckedCreateWithoutReceivedFriendRequestsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutReceivedFriendRequestsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutReceivedFriendRequestsInput, UserUncheckedUpdateWithoutReceivedFriendRequestsInput>
  }

  export type UserUpdateWithoutReceivedFriendRequestsInput = {
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    googleId?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    collegeName?: NullableStringFieldUpdateOperationsInput | string | null
    department?: NullableStringFieldUpdateOperationsInput | string | null
    yearOfStudy?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    phoneVisibility?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: NullableStringFieldUpdateOperationsInput | string | null
    whatsappVisibility?: StringFieldUpdateOperationsInput | string
    instagramHandle?: NullableStringFieldUpdateOperationsInput | string | null
    instagramVisibility?: StringFieldUpdateOperationsInput | string
    facebookUrl?: NullableStringFieldUpdateOperationsInput | string | null
    facebookVisibility?: StringFieldUpdateOperationsInput | string
    snapchatUsername?: NullableStringFieldUpdateOperationsInput | string | null
    snapchatVisibility?: StringFieldUpdateOperationsInput | string
    linkedinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    linkedinVisibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUpdateManyWithoutAuthorNestedInput
    comments?: CommentUpdateManyWithoutAuthorNestedInput
    likedPosts?: PostUpdateManyWithoutLikesNestedInput
    sentFriendRequests?: FriendshipUpdateManyWithoutSenderNestedInput
    sentMessages?: MessageUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUpdateManyWithoutReceiverNestedInput
    myCrushes?: CrushUpdateManyWithoutUserNestedInput
    crushedBy?: CrushUpdateManyWithoutCrushNestedInput
    sentCloseFriendRequests?: CloseFriendRequestUpdateManyWithoutSenderNestedInput
    receivedCloseFriendRequests?: CloseFriendRequestUpdateManyWithoutReceiverNestedInput
    languageRooms?: LanguageRoomUpdateManyWithoutCreatorNestedInput
    createdGroups?: GroupUpdateManyWithoutCreatorNestedInput
    groupMembers?: GroupMemberUpdateManyWithoutUserNestedInput
    groupMessages?: GroupMessageUpdateManyWithoutSenderNestedInput
  }

  export type UserUncheckedUpdateWithoutReceivedFriendRequestsInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    googleId?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    collegeName?: NullableStringFieldUpdateOperationsInput | string | null
    department?: NullableStringFieldUpdateOperationsInput | string | null
    yearOfStudy?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    phoneVisibility?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: NullableStringFieldUpdateOperationsInput | string | null
    whatsappVisibility?: StringFieldUpdateOperationsInput | string
    instagramHandle?: NullableStringFieldUpdateOperationsInput | string | null
    instagramVisibility?: StringFieldUpdateOperationsInput | string
    facebookUrl?: NullableStringFieldUpdateOperationsInput | string | null
    facebookVisibility?: StringFieldUpdateOperationsInput | string
    snapchatUsername?: NullableStringFieldUpdateOperationsInput | string | null
    snapchatVisibility?: StringFieldUpdateOperationsInput | string
    linkedinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    linkedinVisibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUncheckedUpdateManyWithoutAuthorNestedInput
    comments?: CommentUncheckedUpdateManyWithoutAuthorNestedInput
    likedPosts?: PostUncheckedUpdateManyWithoutLikesNestedInput
    sentFriendRequests?: FriendshipUncheckedUpdateManyWithoutSenderNestedInput
    sentMessages?: MessageUncheckedUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUncheckedUpdateManyWithoutReceiverNestedInput
    myCrushes?: CrushUncheckedUpdateManyWithoutUserNestedInput
    crushedBy?: CrushUncheckedUpdateManyWithoutCrushNestedInput
    sentCloseFriendRequests?: CloseFriendRequestUncheckedUpdateManyWithoutSenderNestedInput
    receivedCloseFriendRequests?: CloseFriendRequestUncheckedUpdateManyWithoutReceiverNestedInput
    languageRooms?: LanguageRoomUncheckedUpdateManyWithoutCreatorNestedInput
    createdGroups?: GroupUncheckedUpdateManyWithoutCreatorNestedInput
    groupMembers?: GroupMemberUncheckedUpdateManyWithoutUserNestedInput
    groupMessages?: GroupMessageUncheckedUpdateManyWithoutSenderNestedInput
  }

  export type UserCreateWithoutSentMessagesInput = {
    name: string
    email: string
    password?: string | null
    googleId?: string | null
    bio?: string | null
    profilePicture?: string | null
    collegeName?: string | null
    department?: string | null
    yearOfStudy?: string | null
    phoneNumber?: string | null
    phoneVisibility?: string
    whatsappNumber?: string | null
    whatsappVisibility?: string
    instagramHandle?: string | null
    instagramVisibility?: string
    facebookUrl?: string | null
    facebookVisibility?: string
    snapchatUsername?: string | null
    snapchatVisibility?: string
    linkedinUrl?: string | null
    linkedinVisibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostCreateNestedManyWithoutAuthorInput
    comments?: CommentCreateNestedManyWithoutAuthorInput
    likedPosts?: PostCreateNestedManyWithoutLikesInput
    sentFriendRequests?: FriendshipCreateNestedManyWithoutSenderInput
    receivedFriendRequests?: FriendshipCreateNestedManyWithoutReceiverInput
    receivedMessages?: MessageCreateNestedManyWithoutReceiverInput
    myCrushes?: CrushCreateNestedManyWithoutUserInput
    crushedBy?: CrushCreateNestedManyWithoutCrushInput
    sentCloseFriendRequests?: CloseFriendRequestCreateNestedManyWithoutSenderInput
    receivedCloseFriendRequests?: CloseFriendRequestCreateNestedManyWithoutReceiverInput
    languageRooms?: LanguageRoomCreateNestedManyWithoutCreatorInput
    createdGroups?: GroupCreateNestedManyWithoutCreatorInput
    groupMembers?: GroupMemberCreateNestedManyWithoutUserInput
    groupMessages?: GroupMessageCreateNestedManyWithoutSenderInput
  }

  export type UserUncheckedCreateWithoutSentMessagesInput = {
    id?: number
    name: string
    email: string
    password?: string | null
    googleId?: string | null
    bio?: string | null
    profilePicture?: string | null
    collegeName?: string | null
    department?: string | null
    yearOfStudy?: string | null
    phoneNumber?: string | null
    phoneVisibility?: string
    whatsappNumber?: string | null
    whatsappVisibility?: string
    instagramHandle?: string | null
    instagramVisibility?: string
    facebookUrl?: string | null
    facebookVisibility?: string
    snapchatUsername?: string | null
    snapchatVisibility?: string
    linkedinUrl?: string | null
    linkedinVisibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostUncheckedCreateNestedManyWithoutAuthorInput
    comments?: CommentUncheckedCreateNestedManyWithoutAuthorInput
    likedPosts?: PostUncheckedCreateNestedManyWithoutLikesInput
    sentFriendRequests?: FriendshipUncheckedCreateNestedManyWithoutSenderInput
    receivedFriendRequests?: FriendshipUncheckedCreateNestedManyWithoutReceiverInput
    receivedMessages?: MessageUncheckedCreateNestedManyWithoutReceiverInput
    myCrushes?: CrushUncheckedCreateNestedManyWithoutUserInput
    crushedBy?: CrushUncheckedCreateNestedManyWithoutCrushInput
    sentCloseFriendRequests?: CloseFriendRequestUncheckedCreateNestedManyWithoutSenderInput
    receivedCloseFriendRequests?: CloseFriendRequestUncheckedCreateNestedManyWithoutReceiverInput
    languageRooms?: LanguageRoomUncheckedCreateNestedManyWithoutCreatorInput
    createdGroups?: GroupUncheckedCreateNestedManyWithoutCreatorInput
    groupMembers?: GroupMemberUncheckedCreateNestedManyWithoutUserInput
    groupMessages?: GroupMessageUncheckedCreateNestedManyWithoutSenderInput
  }

  export type UserCreateOrConnectWithoutSentMessagesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutSentMessagesInput, UserUncheckedCreateWithoutSentMessagesInput>
  }

  export type UserCreateWithoutReceivedMessagesInput = {
    name: string
    email: string
    password?: string | null
    googleId?: string | null
    bio?: string | null
    profilePicture?: string | null
    collegeName?: string | null
    department?: string | null
    yearOfStudy?: string | null
    phoneNumber?: string | null
    phoneVisibility?: string
    whatsappNumber?: string | null
    whatsappVisibility?: string
    instagramHandle?: string | null
    instagramVisibility?: string
    facebookUrl?: string | null
    facebookVisibility?: string
    snapchatUsername?: string | null
    snapchatVisibility?: string
    linkedinUrl?: string | null
    linkedinVisibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostCreateNestedManyWithoutAuthorInput
    comments?: CommentCreateNestedManyWithoutAuthorInput
    likedPosts?: PostCreateNestedManyWithoutLikesInput
    sentFriendRequests?: FriendshipCreateNestedManyWithoutSenderInput
    receivedFriendRequests?: FriendshipCreateNestedManyWithoutReceiverInput
    sentMessages?: MessageCreateNestedManyWithoutSenderInput
    myCrushes?: CrushCreateNestedManyWithoutUserInput
    crushedBy?: CrushCreateNestedManyWithoutCrushInput
    sentCloseFriendRequests?: CloseFriendRequestCreateNestedManyWithoutSenderInput
    receivedCloseFriendRequests?: CloseFriendRequestCreateNestedManyWithoutReceiverInput
    languageRooms?: LanguageRoomCreateNestedManyWithoutCreatorInput
    createdGroups?: GroupCreateNestedManyWithoutCreatorInput
    groupMembers?: GroupMemberCreateNestedManyWithoutUserInput
    groupMessages?: GroupMessageCreateNestedManyWithoutSenderInput
  }

  export type UserUncheckedCreateWithoutReceivedMessagesInput = {
    id?: number
    name: string
    email: string
    password?: string | null
    googleId?: string | null
    bio?: string | null
    profilePicture?: string | null
    collegeName?: string | null
    department?: string | null
    yearOfStudy?: string | null
    phoneNumber?: string | null
    phoneVisibility?: string
    whatsappNumber?: string | null
    whatsappVisibility?: string
    instagramHandle?: string | null
    instagramVisibility?: string
    facebookUrl?: string | null
    facebookVisibility?: string
    snapchatUsername?: string | null
    snapchatVisibility?: string
    linkedinUrl?: string | null
    linkedinVisibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostUncheckedCreateNestedManyWithoutAuthorInput
    comments?: CommentUncheckedCreateNestedManyWithoutAuthorInput
    likedPosts?: PostUncheckedCreateNestedManyWithoutLikesInput
    sentFriendRequests?: FriendshipUncheckedCreateNestedManyWithoutSenderInput
    receivedFriendRequests?: FriendshipUncheckedCreateNestedManyWithoutReceiverInput
    sentMessages?: MessageUncheckedCreateNestedManyWithoutSenderInput
    myCrushes?: CrushUncheckedCreateNestedManyWithoutUserInput
    crushedBy?: CrushUncheckedCreateNestedManyWithoutCrushInput
    sentCloseFriendRequests?: CloseFriendRequestUncheckedCreateNestedManyWithoutSenderInput
    receivedCloseFriendRequests?: CloseFriendRequestUncheckedCreateNestedManyWithoutReceiverInput
    languageRooms?: LanguageRoomUncheckedCreateNestedManyWithoutCreatorInput
    createdGroups?: GroupUncheckedCreateNestedManyWithoutCreatorInput
    groupMembers?: GroupMemberUncheckedCreateNestedManyWithoutUserInput
    groupMessages?: GroupMessageUncheckedCreateNestedManyWithoutSenderInput
  }

  export type UserCreateOrConnectWithoutReceivedMessagesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutReceivedMessagesInput, UserUncheckedCreateWithoutReceivedMessagesInput>
  }

  export type UserUpsertWithoutSentMessagesInput = {
    update: XOR<UserUpdateWithoutSentMessagesInput, UserUncheckedUpdateWithoutSentMessagesInput>
    create: XOR<UserCreateWithoutSentMessagesInput, UserUncheckedCreateWithoutSentMessagesInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutSentMessagesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutSentMessagesInput, UserUncheckedUpdateWithoutSentMessagesInput>
  }

  export type UserUpdateWithoutSentMessagesInput = {
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    googleId?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    collegeName?: NullableStringFieldUpdateOperationsInput | string | null
    department?: NullableStringFieldUpdateOperationsInput | string | null
    yearOfStudy?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    phoneVisibility?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: NullableStringFieldUpdateOperationsInput | string | null
    whatsappVisibility?: StringFieldUpdateOperationsInput | string
    instagramHandle?: NullableStringFieldUpdateOperationsInput | string | null
    instagramVisibility?: StringFieldUpdateOperationsInput | string
    facebookUrl?: NullableStringFieldUpdateOperationsInput | string | null
    facebookVisibility?: StringFieldUpdateOperationsInput | string
    snapchatUsername?: NullableStringFieldUpdateOperationsInput | string | null
    snapchatVisibility?: StringFieldUpdateOperationsInput | string
    linkedinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    linkedinVisibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUpdateManyWithoutAuthorNestedInput
    comments?: CommentUpdateManyWithoutAuthorNestedInput
    likedPosts?: PostUpdateManyWithoutLikesNestedInput
    sentFriendRequests?: FriendshipUpdateManyWithoutSenderNestedInput
    receivedFriendRequests?: FriendshipUpdateManyWithoutReceiverNestedInput
    receivedMessages?: MessageUpdateManyWithoutReceiverNestedInput
    myCrushes?: CrushUpdateManyWithoutUserNestedInput
    crushedBy?: CrushUpdateManyWithoutCrushNestedInput
    sentCloseFriendRequests?: CloseFriendRequestUpdateManyWithoutSenderNestedInput
    receivedCloseFriendRequests?: CloseFriendRequestUpdateManyWithoutReceiverNestedInput
    languageRooms?: LanguageRoomUpdateManyWithoutCreatorNestedInput
    createdGroups?: GroupUpdateManyWithoutCreatorNestedInput
    groupMembers?: GroupMemberUpdateManyWithoutUserNestedInput
    groupMessages?: GroupMessageUpdateManyWithoutSenderNestedInput
  }

  export type UserUncheckedUpdateWithoutSentMessagesInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    googleId?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    collegeName?: NullableStringFieldUpdateOperationsInput | string | null
    department?: NullableStringFieldUpdateOperationsInput | string | null
    yearOfStudy?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    phoneVisibility?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: NullableStringFieldUpdateOperationsInput | string | null
    whatsappVisibility?: StringFieldUpdateOperationsInput | string
    instagramHandle?: NullableStringFieldUpdateOperationsInput | string | null
    instagramVisibility?: StringFieldUpdateOperationsInput | string
    facebookUrl?: NullableStringFieldUpdateOperationsInput | string | null
    facebookVisibility?: StringFieldUpdateOperationsInput | string
    snapchatUsername?: NullableStringFieldUpdateOperationsInput | string | null
    snapchatVisibility?: StringFieldUpdateOperationsInput | string
    linkedinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    linkedinVisibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUncheckedUpdateManyWithoutAuthorNestedInput
    comments?: CommentUncheckedUpdateManyWithoutAuthorNestedInput
    likedPosts?: PostUncheckedUpdateManyWithoutLikesNestedInput
    sentFriendRequests?: FriendshipUncheckedUpdateManyWithoutSenderNestedInput
    receivedFriendRequests?: FriendshipUncheckedUpdateManyWithoutReceiverNestedInput
    receivedMessages?: MessageUncheckedUpdateManyWithoutReceiverNestedInput
    myCrushes?: CrushUncheckedUpdateManyWithoutUserNestedInput
    crushedBy?: CrushUncheckedUpdateManyWithoutCrushNestedInput
    sentCloseFriendRequests?: CloseFriendRequestUncheckedUpdateManyWithoutSenderNestedInput
    receivedCloseFriendRequests?: CloseFriendRequestUncheckedUpdateManyWithoutReceiverNestedInput
    languageRooms?: LanguageRoomUncheckedUpdateManyWithoutCreatorNestedInput
    createdGroups?: GroupUncheckedUpdateManyWithoutCreatorNestedInput
    groupMembers?: GroupMemberUncheckedUpdateManyWithoutUserNestedInput
    groupMessages?: GroupMessageUncheckedUpdateManyWithoutSenderNestedInput
  }

  export type UserUpsertWithoutReceivedMessagesInput = {
    update: XOR<UserUpdateWithoutReceivedMessagesInput, UserUncheckedUpdateWithoutReceivedMessagesInput>
    create: XOR<UserCreateWithoutReceivedMessagesInput, UserUncheckedCreateWithoutReceivedMessagesInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutReceivedMessagesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutReceivedMessagesInput, UserUncheckedUpdateWithoutReceivedMessagesInput>
  }

  export type UserUpdateWithoutReceivedMessagesInput = {
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    googleId?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    collegeName?: NullableStringFieldUpdateOperationsInput | string | null
    department?: NullableStringFieldUpdateOperationsInput | string | null
    yearOfStudy?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    phoneVisibility?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: NullableStringFieldUpdateOperationsInput | string | null
    whatsappVisibility?: StringFieldUpdateOperationsInput | string
    instagramHandle?: NullableStringFieldUpdateOperationsInput | string | null
    instagramVisibility?: StringFieldUpdateOperationsInput | string
    facebookUrl?: NullableStringFieldUpdateOperationsInput | string | null
    facebookVisibility?: StringFieldUpdateOperationsInput | string
    snapchatUsername?: NullableStringFieldUpdateOperationsInput | string | null
    snapchatVisibility?: StringFieldUpdateOperationsInput | string
    linkedinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    linkedinVisibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUpdateManyWithoutAuthorNestedInput
    comments?: CommentUpdateManyWithoutAuthorNestedInput
    likedPosts?: PostUpdateManyWithoutLikesNestedInput
    sentFriendRequests?: FriendshipUpdateManyWithoutSenderNestedInput
    receivedFriendRequests?: FriendshipUpdateManyWithoutReceiverNestedInput
    sentMessages?: MessageUpdateManyWithoutSenderNestedInput
    myCrushes?: CrushUpdateManyWithoutUserNestedInput
    crushedBy?: CrushUpdateManyWithoutCrushNestedInput
    sentCloseFriendRequests?: CloseFriendRequestUpdateManyWithoutSenderNestedInput
    receivedCloseFriendRequests?: CloseFriendRequestUpdateManyWithoutReceiverNestedInput
    languageRooms?: LanguageRoomUpdateManyWithoutCreatorNestedInput
    createdGroups?: GroupUpdateManyWithoutCreatorNestedInput
    groupMembers?: GroupMemberUpdateManyWithoutUserNestedInput
    groupMessages?: GroupMessageUpdateManyWithoutSenderNestedInput
  }

  export type UserUncheckedUpdateWithoutReceivedMessagesInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    googleId?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    collegeName?: NullableStringFieldUpdateOperationsInput | string | null
    department?: NullableStringFieldUpdateOperationsInput | string | null
    yearOfStudy?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    phoneVisibility?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: NullableStringFieldUpdateOperationsInput | string | null
    whatsappVisibility?: StringFieldUpdateOperationsInput | string
    instagramHandle?: NullableStringFieldUpdateOperationsInput | string | null
    instagramVisibility?: StringFieldUpdateOperationsInput | string
    facebookUrl?: NullableStringFieldUpdateOperationsInput | string | null
    facebookVisibility?: StringFieldUpdateOperationsInput | string
    snapchatUsername?: NullableStringFieldUpdateOperationsInput | string | null
    snapchatVisibility?: StringFieldUpdateOperationsInput | string
    linkedinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    linkedinVisibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUncheckedUpdateManyWithoutAuthorNestedInput
    comments?: CommentUncheckedUpdateManyWithoutAuthorNestedInput
    likedPosts?: PostUncheckedUpdateManyWithoutLikesNestedInput
    sentFriendRequests?: FriendshipUncheckedUpdateManyWithoutSenderNestedInput
    receivedFriendRequests?: FriendshipUncheckedUpdateManyWithoutReceiverNestedInput
    sentMessages?: MessageUncheckedUpdateManyWithoutSenderNestedInput
    myCrushes?: CrushUncheckedUpdateManyWithoutUserNestedInput
    crushedBy?: CrushUncheckedUpdateManyWithoutCrushNestedInput
    sentCloseFriendRequests?: CloseFriendRequestUncheckedUpdateManyWithoutSenderNestedInput
    receivedCloseFriendRequests?: CloseFriendRequestUncheckedUpdateManyWithoutReceiverNestedInput
    languageRooms?: LanguageRoomUncheckedUpdateManyWithoutCreatorNestedInput
    createdGroups?: GroupUncheckedUpdateManyWithoutCreatorNestedInput
    groupMembers?: GroupMemberUncheckedUpdateManyWithoutUserNestedInput
    groupMessages?: GroupMessageUncheckedUpdateManyWithoutSenderNestedInput
  }

  export type PostCreateWithoutCommentsInput = {
    content: string
    image?: string | null
    visibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    author: UserCreateNestedOneWithoutPostsInput
    likes?: UserCreateNestedManyWithoutLikedPostsInput
  }

  export type PostUncheckedCreateWithoutCommentsInput = {
    id?: number
    content: string
    image?: string | null
    visibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    authorId: number
    likes?: UserUncheckedCreateNestedManyWithoutLikedPostsInput
  }

  export type PostCreateOrConnectWithoutCommentsInput = {
    where: PostWhereUniqueInput
    create: XOR<PostCreateWithoutCommentsInput, PostUncheckedCreateWithoutCommentsInput>
  }

  export type UserCreateWithoutCommentsInput = {
    name: string
    email: string
    password?: string | null
    googleId?: string | null
    bio?: string | null
    profilePicture?: string | null
    collegeName?: string | null
    department?: string | null
    yearOfStudy?: string | null
    phoneNumber?: string | null
    phoneVisibility?: string
    whatsappNumber?: string | null
    whatsappVisibility?: string
    instagramHandle?: string | null
    instagramVisibility?: string
    facebookUrl?: string | null
    facebookVisibility?: string
    snapchatUsername?: string | null
    snapchatVisibility?: string
    linkedinUrl?: string | null
    linkedinVisibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostCreateNestedManyWithoutAuthorInput
    likedPosts?: PostCreateNestedManyWithoutLikesInput
    sentFriendRequests?: FriendshipCreateNestedManyWithoutSenderInput
    receivedFriendRequests?: FriendshipCreateNestedManyWithoutReceiverInput
    sentMessages?: MessageCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageCreateNestedManyWithoutReceiverInput
    myCrushes?: CrushCreateNestedManyWithoutUserInput
    crushedBy?: CrushCreateNestedManyWithoutCrushInput
    sentCloseFriendRequests?: CloseFriendRequestCreateNestedManyWithoutSenderInput
    receivedCloseFriendRequests?: CloseFriendRequestCreateNestedManyWithoutReceiverInput
    languageRooms?: LanguageRoomCreateNestedManyWithoutCreatorInput
    createdGroups?: GroupCreateNestedManyWithoutCreatorInput
    groupMembers?: GroupMemberCreateNestedManyWithoutUserInput
    groupMessages?: GroupMessageCreateNestedManyWithoutSenderInput
  }

  export type UserUncheckedCreateWithoutCommentsInput = {
    id?: number
    name: string
    email: string
    password?: string | null
    googleId?: string | null
    bio?: string | null
    profilePicture?: string | null
    collegeName?: string | null
    department?: string | null
    yearOfStudy?: string | null
    phoneNumber?: string | null
    phoneVisibility?: string
    whatsappNumber?: string | null
    whatsappVisibility?: string
    instagramHandle?: string | null
    instagramVisibility?: string
    facebookUrl?: string | null
    facebookVisibility?: string
    snapchatUsername?: string | null
    snapchatVisibility?: string
    linkedinUrl?: string | null
    linkedinVisibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostUncheckedCreateNestedManyWithoutAuthorInput
    likedPosts?: PostUncheckedCreateNestedManyWithoutLikesInput
    sentFriendRequests?: FriendshipUncheckedCreateNestedManyWithoutSenderInput
    receivedFriendRequests?: FriendshipUncheckedCreateNestedManyWithoutReceiverInput
    sentMessages?: MessageUncheckedCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageUncheckedCreateNestedManyWithoutReceiverInput
    myCrushes?: CrushUncheckedCreateNestedManyWithoutUserInput
    crushedBy?: CrushUncheckedCreateNestedManyWithoutCrushInput
    sentCloseFriendRequests?: CloseFriendRequestUncheckedCreateNestedManyWithoutSenderInput
    receivedCloseFriendRequests?: CloseFriendRequestUncheckedCreateNestedManyWithoutReceiverInput
    languageRooms?: LanguageRoomUncheckedCreateNestedManyWithoutCreatorInput
    createdGroups?: GroupUncheckedCreateNestedManyWithoutCreatorInput
    groupMembers?: GroupMemberUncheckedCreateNestedManyWithoutUserInput
    groupMessages?: GroupMessageUncheckedCreateNestedManyWithoutSenderInput
  }

  export type UserCreateOrConnectWithoutCommentsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutCommentsInput, UserUncheckedCreateWithoutCommentsInput>
  }

  export type PostUpsertWithoutCommentsInput = {
    update: XOR<PostUpdateWithoutCommentsInput, PostUncheckedUpdateWithoutCommentsInput>
    create: XOR<PostCreateWithoutCommentsInput, PostUncheckedCreateWithoutCommentsInput>
    where?: PostWhereInput
  }

  export type PostUpdateToOneWithWhereWithoutCommentsInput = {
    where?: PostWhereInput
    data: XOR<PostUpdateWithoutCommentsInput, PostUncheckedUpdateWithoutCommentsInput>
  }

  export type PostUpdateWithoutCommentsInput = {
    content?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    visibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    author?: UserUpdateOneRequiredWithoutPostsNestedInput
    likes?: UserUpdateManyWithoutLikedPostsNestedInput
  }

  export type PostUncheckedUpdateWithoutCommentsInput = {
    id?: IntFieldUpdateOperationsInput | number
    content?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    visibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    authorId?: IntFieldUpdateOperationsInput | number
    likes?: UserUncheckedUpdateManyWithoutLikedPostsNestedInput
  }

  export type UserUpsertWithoutCommentsInput = {
    update: XOR<UserUpdateWithoutCommentsInput, UserUncheckedUpdateWithoutCommentsInput>
    create: XOR<UserCreateWithoutCommentsInput, UserUncheckedCreateWithoutCommentsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutCommentsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutCommentsInput, UserUncheckedUpdateWithoutCommentsInput>
  }

  export type UserUpdateWithoutCommentsInput = {
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    googleId?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    collegeName?: NullableStringFieldUpdateOperationsInput | string | null
    department?: NullableStringFieldUpdateOperationsInput | string | null
    yearOfStudy?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    phoneVisibility?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: NullableStringFieldUpdateOperationsInput | string | null
    whatsappVisibility?: StringFieldUpdateOperationsInput | string
    instagramHandle?: NullableStringFieldUpdateOperationsInput | string | null
    instagramVisibility?: StringFieldUpdateOperationsInput | string
    facebookUrl?: NullableStringFieldUpdateOperationsInput | string | null
    facebookVisibility?: StringFieldUpdateOperationsInput | string
    snapchatUsername?: NullableStringFieldUpdateOperationsInput | string | null
    snapchatVisibility?: StringFieldUpdateOperationsInput | string
    linkedinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    linkedinVisibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUpdateManyWithoutAuthorNestedInput
    likedPosts?: PostUpdateManyWithoutLikesNestedInput
    sentFriendRequests?: FriendshipUpdateManyWithoutSenderNestedInput
    receivedFriendRequests?: FriendshipUpdateManyWithoutReceiverNestedInput
    sentMessages?: MessageUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUpdateManyWithoutReceiverNestedInput
    myCrushes?: CrushUpdateManyWithoutUserNestedInput
    crushedBy?: CrushUpdateManyWithoutCrushNestedInput
    sentCloseFriendRequests?: CloseFriendRequestUpdateManyWithoutSenderNestedInput
    receivedCloseFriendRequests?: CloseFriendRequestUpdateManyWithoutReceiverNestedInput
    languageRooms?: LanguageRoomUpdateManyWithoutCreatorNestedInput
    createdGroups?: GroupUpdateManyWithoutCreatorNestedInput
    groupMembers?: GroupMemberUpdateManyWithoutUserNestedInput
    groupMessages?: GroupMessageUpdateManyWithoutSenderNestedInput
  }

  export type UserUncheckedUpdateWithoutCommentsInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    googleId?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    collegeName?: NullableStringFieldUpdateOperationsInput | string | null
    department?: NullableStringFieldUpdateOperationsInput | string | null
    yearOfStudy?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    phoneVisibility?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: NullableStringFieldUpdateOperationsInput | string | null
    whatsappVisibility?: StringFieldUpdateOperationsInput | string
    instagramHandle?: NullableStringFieldUpdateOperationsInput | string | null
    instagramVisibility?: StringFieldUpdateOperationsInput | string
    facebookUrl?: NullableStringFieldUpdateOperationsInput | string | null
    facebookVisibility?: StringFieldUpdateOperationsInput | string
    snapchatUsername?: NullableStringFieldUpdateOperationsInput | string | null
    snapchatVisibility?: StringFieldUpdateOperationsInput | string
    linkedinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    linkedinVisibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUncheckedUpdateManyWithoutAuthorNestedInput
    likedPosts?: PostUncheckedUpdateManyWithoutLikesNestedInput
    sentFriendRequests?: FriendshipUncheckedUpdateManyWithoutSenderNestedInput
    receivedFriendRequests?: FriendshipUncheckedUpdateManyWithoutReceiverNestedInput
    sentMessages?: MessageUncheckedUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUncheckedUpdateManyWithoutReceiverNestedInput
    myCrushes?: CrushUncheckedUpdateManyWithoutUserNestedInput
    crushedBy?: CrushUncheckedUpdateManyWithoutCrushNestedInput
    sentCloseFriendRequests?: CloseFriendRequestUncheckedUpdateManyWithoutSenderNestedInput
    receivedCloseFriendRequests?: CloseFriendRequestUncheckedUpdateManyWithoutReceiverNestedInput
    languageRooms?: LanguageRoomUncheckedUpdateManyWithoutCreatorNestedInput
    createdGroups?: GroupUncheckedUpdateManyWithoutCreatorNestedInput
    groupMembers?: GroupMemberUncheckedUpdateManyWithoutUserNestedInput
    groupMessages?: GroupMessageUncheckedUpdateManyWithoutSenderNestedInput
  }

  export type UserCreateWithoutMyCrushesInput = {
    name: string
    email: string
    password?: string | null
    googleId?: string | null
    bio?: string | null
    profilePicture?: string | null
    collegeName?: string | null
    department?: string | null
    yearOfStudy?: string | null
    phoneNumber?: string | null
    phoneVisibility?: string
    whatsappNumber?: string | null
    whatsappVisibility?: string
    instagramHandle?: string | null
    instagramVisibility?: string
    facebookUrl?: string | null
    facebookVisibility?: string
    snapchatUsername?: string | null
    snapchatVisibility?: string
    linkedinUrl?: string | null
    linkedinVisibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostCreateNestedManyWithoutAuthorInput
    comments?: CommentCreateNestedManyWithoutAuthorInput
    likedPosts?: PostCreateNestedManyWithoutLikesInput
    sentFriendRequests?: FriendshipCreateNestedManyWithoutSenderInput
    receivedFriendRequests?: FriendshipCreateNestedManyWithoutReceiverInput
    sentMessages?: MessageCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageCreateNestedManyWithoutReceiverInput
    crushedBy?: CrushCreateNestedManyWithoutCrushInput
    sentCloseFriendRequests?: CloseFriendRequestCreateNestedManyWithoutSenderInput
    receivedCloseFriendRequests?: CloseFriendRequestCreateNestedManyWithoutReceiverInput
    languageRooms?: LanguageRoomCreateNestedManyWithoutCreatorInput
    createdGroups?: GroupCreateNestedManyWithoutCreatorInput
    groupMembers?: GroupMemberCreateNestedManyWithoutUserInput
    groupMessages?: GroupMessageCreateNestedManyWithoutSenderInput
  }

  export type UserUncheckedCreateWithoutMyCrushesInput = {
    id?: number
    name: string
    email: string
    password?: string | null
    googleId?: string | null
    bio?: string | null
    profilePicture?: string | null
    collegeName?: string | null
    department?: string | null
    yearOfStudy?: string | null
    phoneNumber?: string | null
    phoneVisibility?: string
    whatsappNumber?: string | null
    whatsappVisibility?: string
    instagramHandle?: string | null
    instagramVisibility?: string
    facebookUrl?: string | null
    facebookVisibility?: string
    snapchatUsername?: string | null
    snapchatVisibility?: string
    linkedinUrl?: string | null
    linkedinVisibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostUncheckedCreateNestedManyWithoutAuthorInput
    comments?: CommentUncheckedCreateNestedManyWithoutAuthorInput
    likedPosts?: PostUncheckedCreateNestedManyWithoutLikesInput
    sentFriendRequests?: FriendshipUncheckedCreateNestedManyWithoutSenderInput
    receivedFriendRequests?: FriendshipUncheckedCreateNestedManyWithoutReceiverInput
    sentMessages?: MessageUncheckedCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageUncheckedCreateNestedManyWithoutReceiverInput
    crushedBy?: CrushUncheckedCreateNestedManyWithoutCrushInput
    sentCloseFriendRequests?: CloseFriendRequestUncheckedCreateNestedManyWithoutSenderInput
    receivedCloseFriendRequests?: CloseFriendRequestUncheckedCreateNestedManyWithoutReceiverInput
    languageRooms?: LanguageRoomUncheckedCreateNestedManyWithoutCreatorInput
    createdGroups?: GroupUncheckedCreateNestedManyWithoutCreatorInput
    groupMembers?: GroupMemberUncheckedCreateNestedManyWithoutUserInput
    groupMessages?: GroupMessageUncheckedCreateNestedManyWithoutSenderInput
  }

  export type UserCreateOrConnectWithoutMyCrushesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutMyCrushesInput, UserUncheckedCreateWithoutMyCrushesInput>
  }

  export type UserCreateWithoutCrushedByInput = {
    name: string
    email: string
    password?: string | null
    googleId?: string | null
    bio?: string | null
    profilePicture?: string | null
    collegeName?: string | null
    department?: string | null
    yearOfStudy?: string | null
    phoneNumber?: string | null
    phoneVisibility?: string
    whatsappNumber?: string | null
    whatsappVisibility?: string
    instagramHandle?: string | null
    instagramVisibility?: string
    facebookUrl?: string | null
    facebookVisibility?: string
    snapchatUsername?: string | null
    snapchatVisibility?: string
    linkedinUrl?: string | null
    linkedinVisibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostCreateNestedManyWithoutAuthorInput
    comments?: CommentCreateNestedManyWithoutAuthorInput
    likedPosts?: PostCreateNestedManyWithoutLikesInput
    sentFriendRequests?: FriendshipCreateNestedManyWithoutSenderInput
    receivedFriendRequests?: FriendshipCreateNestedManyWithoutReceiverInput
    sentMessages?: MessageCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageCreateNestedManyWithoutReceiverInput
    myCrushes?: CrushCreateNestedManyWithoutUserInput
    sentCloseFriendRequests?: CloseFriendRequestCreateNestedManyWithoutSenderInput
    receivedCloseFriendRequests?: CloseFriendRequestCreateNestedManyWithoutReceiverInput
    languageRooms?: LanguageRoomCreateNestedManyWithoutCreatorInput
    createdGroups?: GroupCreateNestedManyWithoutCreatorInput
    groupMembers?: GroupMemberCreateNestedManyWithoutUserInput
    groupMessages?: GroupMessageCreateNestedManyWithoutSenderInput
  }

  export type UserUncheckedCreateWithoutCrushedByInput = {
    id?: number
    name: string
    email: string
    password?: string | null
    googleId?: string | null
    bio?: string | null
    profilePicture?: string | null
    collegeName?: string | null
    department?: string | null
    yearOfStudy?: string | null
    phoneNumber?: string | null
    phoneVisibility?: string
    whatsappNumber?: string | null
    whatsappVisibility?: string
    instagramHandle?: string | null
    instagramVisibility?: string
    facebookUrl?: string | null
    facebookVisibility?: string
    snapchatUsername?: string | null
    snapchatVisibility?: string
    linkedinUrl?: string | null
    linkedinVisibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostUncheckedCreateNestedManyWithoutAuthorInput
    comments?: CommentUncheckedCreateNestedManyWithoutAuthorInput
    likedPosts?: PostUncheckedCreateNestedManyWithoutLikesInput
    sentFriendRequests?: FriendshipUncheckedCreateNestedManyWithoutSenderInput
    receivedFriendRequests?: FriendshipUncheckedCreateNestedManyWithoutReceiverInput
    sentMessages?: MessageUncheckedCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageUncheckedCreateNestedManyWithoutReceiverInput
    myCrushes?: CrushUncheckedCreateNestedManyWithoutUserInput
    sentCloseFriendRequests?: CloseFriendRequestUncheckedCreateNestedManyWithoutSenderInput
    receivedCloseFriendRequests?: CloseFriendRequestUncheckedCreateNestedManyWithoutReceiverInput
    languageRooms?: LanguageRoomUncheckedCreateNestedManyWithoutCreatorInput
    createdGroups?: GroupUncheckedCreateNestedManyWithoutCreatorInput
    groupMembers?: GroupMemberUncheckedCreateNestedManyWithoutUserInput
    groupMessages?: GroupMessageUncheckedCreateNestedManyWithoutSenderInput
  }

  export type UserCreateOrConnectWithoutCrushedByInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutCrushedByInput, UserUncheckedCreateWithoutCrushedByInput>
  }

  export type UserUpsertWithoutMyCrushesInput = {
    update: XOR<UserUpdateWithoutMyCrushesInput, UserUncheckedUpdateWithoutMyCrushesInput>
    create: XOR<UserCreateWithoutMyCrushesInput, UserUncheckedCreateWithoutMyCrushesInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutMyCrushesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutMyCrushesInput, UserUncheckedUpdateWithoutMyCrushesInput>
  }

  export type UserUpdateWithoutMyCrushesInput = {
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    googleId?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    collegeName?: NullableStringFieldUpdateOperationsInput | string | null
    department?: NullableStringFieldUpdateOperationsInput | string | null
    yearOfStudy?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    phoneVisibility?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: NullableStringFieldUpdateOperationsInput | string | null
    whatsappVisibility?: StringFieldUpdateOperationsInput | string
    instagramHandle?: NullableStringFieldUpdateOperationsInput | string | null
    instagramVisibility?: StringFieldUpdateOperationsInput | string
    facebookUrl?: NullableStringFieldUpdateOperationsInput | string | null
    facebookVisibility?: StringFieldUpdateOperationsInput | string
    snapchatUsername?: NullableStringFieldUpdateOperationsInput | string | null
    snapchatVisibility?: StringFieldUpdateOperationsInput | string
    linkedinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    linkedinVisibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUpdateManyWithoutAuthorNestedInput
    comments?: CommentUpdateManyWithoutAuthorNestedInput
    likedPosts?: PostUpdateManyWithoutLikesNestedInput
    sentFriendRequests?: FriendshipUpdateManyWithoutSenderNestedInput
    receivedFriendRequests?: FriendshipUpdateManyWithoutReceiverNestedInput
    sentMessages?: MessageUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUpdateManyWithoutReceiverNestedInput
    crushedBy?: CrushUpdateManyWithoutCrushNestedInput
    sentCloseFriendRequests?: CloseFriendRequestUpdateManyWithoutSenderNestedInput
    receivedCloseFriendRequests?: CloseFriendRequestUpdateManyWithoutReceiverNestedInput
    languageRooms?: LanguageRoomUpdateManyWithoutCreatorNestedInput
    createdGroups?: GroupUpdateManyWithoutCreatorNestedInput
    groupMembers?: GroupMemberUpdateManyWithoutUserNestedInput
    groupMessages?: GroupMessageUpdateManyWithoutSenderNestedInput
  }

  export type UserUncheckedUpdateWithoutMyCrushesInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    googleId?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    collegeName?: NullableStringFieldUpdateOperationsInput | string | null
    department?: NullableStringFieldUpdateOperationsInput | string | null
    yearOfStudy?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    phoneVisibility?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: NullableStringFieldUpdateOperationsInput | string | null
    whatsappVisibility?: StringFieldUpdateOperationsInput | string
    instagramHandle?: NullableStringFieldUpdateOperationsInput | string | null
    instagramVisibility?: StringFieldUpdateOperationsInput | string
    facebookUrl?: NullableStringFieldUpdateOperationsInput | string | null
    facebookVisibility?: StringFieldUpdateOperationsInput | string
    snapchatUsername?: NullableStringFieldUpdateOperationsInput | string | null
    snapchatVisibility?: StringFieldUpdateOperationsInput | string
    linkedinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    linkedinVisibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUncheckedUpdateManyWithoutAuthorNestedInput
    comments?: CommentUncheckedUpdateManyWithoutAuthorNestedInput
    likedPosts?: PostUncheckedUpdateManyWithoutLikesNestedInput
    sentFriendRequests?: FriendshipUncheckedUpdateManyWithoutSenderNestedInput
    receivedFriendRequests?: FriendshipUncheckedUpdateManyWithoutReceiverNestedInput
    sentMessages?: MessageUncheckedUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUncheckedUpdateManyWithoutReceiverNestedInput
    crushedBy?: CrushUncheckedUpdateManyWithoutCrushNestedInput
    sentCloseFriendRequests?: CloseFriendRequestUncheckedUpdateManyWithoutSenderNestedInput
    receivedCloseFriendRequests?: CloseFriendRequestUncheckedUpdateManyWithoutReceiverNestedInput
    languageRooms?: LanguageRoomUncheckedUpdateManyWithoutCreatorNestedInput
    createdGroups?: GroupUncheckedUpdateManyWithoutCreatorNestedInput
    groupMembers?: GroupMemberUncheckedUpdateManyWithoutUserNestedInput
    groupMessages?: GroupMessageUncheckedUpdateManyWithoutSenderNestedInput
  }

  export type UserUpsertWithoutCrushedByInput = {
    update: XOR<UserUpdateWithoutCrushedByInput, UserUncheckedUpdateWithoutCrushedByInput>
    create: XOR<UserCreateWithoutCrushedByInput, UserUncheckedCreateWithoutCrushedByInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutCrushedByInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutCrushedByInput, UserUncheckedUpdateWithoutCrushedByInput>
  }

  export type UserUpdateWithoutCrushedByInput = {
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    googleId?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    collegeName?: NullableStringFieldUpdateOperationsInput | string | null
    department?: NullableStringFieldUpdateOperationsInput | string | null
    yearOfStudy?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    phoneVisibility?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: NullableStringFieldUpdateOperationsInput | string | null
    whatsappVisibility?: StringFieldUpdateOperationsInput | string
    instagramHandle?: NullableStringFieldUpdateOperationsInput | string | null
    instagramVisibility?: StringFieldUpdateOperationsInput | string
    facebookUrl?: NullableStringFieldUpdateOperationsInput | string | null
    facebookVisibility?: StringFieldUpdateOperationsInput | string
    snapchatUsername?: NullableStringFieldUpdateOperationsInput | string | null
    snapchatVisibility?: StringFieldUpdateOperationsInput | string
    linkedinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    linkedinVisibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUpdateManyWithoutAuthorNestedInput
    comments?: CommentUpdateManyWithoutAuthorNestedInput
    likedPosts?: PostUpdateManyWithoutLikesNestedInput
    sentFriendRequests?: FriendshipUpdateManyWithoutSenderNestedInput
    receivedFriendRequests?: FriendshipUpdateManyWithoutReceiverNestedInput
    sentMessages?: MessageUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUpdateManyWithoutReceiverNestedInput
    myCrushes?: CrushUpdateManyWithoutUserNestedInput
    sentCloseFriendRequests?: CloseFriendRequestUpdateManyWithoutSenderNestedInput
    receivedCloseFriendRequests?: CloseFriendRequestUpdateManyWithoutReceiverNestedInput
    languageRooms?: LanguageRoomUpdateManyWithoutCreatorNestedInput
    createdGroups?: GroupUpdateManyWithoutCreatorNestedInput
    groupMembers?: GroupMemberUpdateManyWithoutUserNestedInput
    groupMessages?: GroupMessageUpdateManyWithoutSenderNestedInput
  }

  export type UserUncheckedUpdateWithoutCrushedByInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    googleId?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    collegeName?: NullableStringFieldUpdateOperationsInput | string | null
    department?: NullableStringFieldUpdateOperationsInput | string | null
    yearOfStudy?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    phoneVisibility?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: NullableStringFieldUpdateOperationsInput | string | null
    whatsappVisibility?: StringFieldUpdateOperationsInput | string
    instagramHandle?: NullableStringFieldUpdateOperationsInput | string | null
    instagramVisibility?: StringFieldUpdateOperationsInput | string
    facebookUrl?: NullableStringFieldUpdateOperationsInput | string | null
    facebookVisibility?: StringFieldUpdateOperationsInput | string
    snapchatUsername?: NullableStringFieldUpdateOperationsInput | string | null
    snapchatVisibility?: StringFieldUpdateOperationsInput | string
    linkedinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    linkedinVisibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUncheckedUpdateManyWithoutAuthorNestedInput
    comments?: CommentUncheckedUpdateManyWithoutAuthorNestedInput
    likedPosts?: PostUncheckedUpdateManyWithoutLikesNestedInput
    sentFriendRequests?: FriendshipUncheckedUpdateManyWithoutSenderNestedInput
    receivedFriendRequests?: FriendshipUncheckedUpdateManyWithoutReceiverNestedInput
    sentMessages?: MessageUncheckedUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUncheckedUpdateManyWithoutReceiverNestedInput
    myCrushes?: CrushUncheckedUpdateManyWithoutUserNestedInput
    sentCloseFriendRequests?: CloseFriendRequestUncheckedUpdateManyWithoutSenderNestedInput
    receivedCloseFriendRequests?: CloseFriendRequestUncheckedUpdateManyWithoutReceiverNestedInput
    languageRooms?: LanguageRoomUncheckedUpdateManyWithoutCreatorNestedInput
    createdGroups?: GroupUncheckedUpdateManyWithoutCreatorNestedInput
    groupMembers?: GroupMemberUncheckedUpdateManyWithoutUserNestedInput
    groupMessages?: GroupMessageUncheckedUpdateManyWithoutSenderNestedInput
  }

  export type UserCreateWithoutSentCloseFriendRequestsInput = {
    name: string
    email: string
    password?: string | null
    googleId?: string | null
    bio?: string | null
    profilePicture?: string | null
    collegeName?: string | null
    department?: string | null
    yearOfStudy?: string | null
    phoneNumber?: string | null
    phoneVisibility?: string
    whatsappNumber?: string | null
    whatsappVisibility?: string
    instagramHandle?: string | null
    instagramVisibility?: string
    facebookUrl?: string | null
    facebookVisibility?: string
    snapchatUsername?: string | null
    snapchatVisibility?: string
    linkedinUrl?: string | null
    linkedinVisibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostCreateNestedManyWithoutAuthorInput
    comments?: CommentCreateNestedManyWithoutAuthorInput
    likedPosts?: PostCreateNestedManyWithoutLikesInput
    sentFriendRequests?: FriendshipCreateNestedManyWithoutSenderInput
    receivedFriendRequests?: FriendshipCreateNestedManyWithoutReceiverInput
    sentMessages?: MessageCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageCreateNestedManyWithoutReceiverInput
    myCrushes?: CrushCreateNestedManyWithoutUserInput
    crushedBy?: CrushCreateNestedManyWithoutCrushInput
    receivedCloseFriendRequests?: CloseFriendRequestCreateNestedManyWithoutReceiverInput
    languageRooms?: LanguageRoomCreateNestedManyWithoutCreatorInput
    createdGroups?: GroupCreateNestedManyWithoutCreatorInput
    groupMembers?: GroupMemberCreateNestedManyWithoutUserInput
    groupMessages?: GroupMessageCreateNestedManyWithoutSenderInput
  }

  export type UserUncheckedCreateWithoutSentCloseFriendRequestsInput = {
    id?: number
    name: string
    email: string
    password?: string | null
    googleId?: string | null
    bio?: string | null
    profilePicture?: string | null
    collegeName?: string | null
    department?: string | null
    yearOfStudy?: string | null
    phoneNumber?: string | null
    phoneVisibility?: string
    whatsappNumber?: string | null
    whatsappVisibility?: string
    instagramHandle?: string | null
    instagramVisibility?: string
    facebookUrl?: string | null
    facebookVisibility?: string
    snapchatUsername?: string | null
    snapchatVisibility?: string
    linkedinUrl?: string | null
    linkedinVisibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostUncheckedCreateNestedManyWithoutAuthorInput
    comments?: CommentUncheckedCreateNestedManyWithoutAuthorInput
    likedPosts?: PostUncheckedCreateNestedManyWithoutLikesInput
    sentFriendRequests?: FriendshipUncheckedCreateNestedManyWithoutSenderInput
    receivedFriendRequests?: FriendshipUncheckedCreateNestedManyWithoutReceiverInput
    sentMessages?: MessageUncheckedCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageUncheckedCreateNestedManyWithoutReceiverInput
    myCrushes?: CrushUncheckedCreateNestedManyWithoutUserInput
    crushedBy?: CrushUncheckedCreateNestedManyWithoutCrushInput
    receivedCloseFriendRequests?: CloseFriendRequestUncheckedCreateNestedManyWithoutReceiverInput
    languageRooms?: LanguageRoomUncheckedCreateNestedManyWithoutCreatorInput
    createdGroups?: GroupUncheckedCreateNestedManyWithoutCreatorInput
    groupMembers?: GroupMemberUncheckedCreateNestedManyWithoutUserInput
    groupMessages?: GroupMessageUncheckedCreateNestedManyWithoutSenderInput
  }

  export type UserCreateOrConnectWithoutSentCloseFriendRequestsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutSentCloseFriendRequestsInput, UserUncheckedCreateWithoutSentCloseFriendRequestsInput>
  }

  export type UserCreateWithoutReceivedCloseFriendRequestsInput = {
    name: string
    email: string
    password?: string | null
    googleId?: string | null
    bio?: string | null
    profilePicture?: string | null
    collegeName?: string | null
    department?: string | null
    yearOfStudy?: string | null
    phoneNumber?: string | null
    phoneVisibility?: string
    whatsappNumber?: string | null
    whatsappVisibility?: string
    instagramHandle?: string | null
    instagramVisibility?: string
    facebookUrl?: string | null
    facebookVisibility?: string
    snapchatUsername?: string | null
    snapchatVisibility?: string
    linkedinUrl?: string | null
    linkedinVisibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostCreateNestedManyWithoutAuthorInput
    comments?: CommentCreateNestedManyWithoutAuthorInput
    likedPosts?: PostCreateNestedManyWithoutLikesInput
    sentFriendRequests?: FriendshipCreateNestedManyWithoutSenderInput
    receivedFriendRequests?: FriendshipCreateNestedManyWithoutReceiverInput
    sentMessages?: MessageCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageCreateNestedManyWithoutReceiverInput
    myCrushes?: CrushCreateNestedManyWithoutUserInput
    crushedBy?: CrushCreateNestedManyWithoutCrushInput
    sentCloseFriendRequests?: CloseFriendRequestCreateNestedManyWithoutSenderInput
    languageRooms?: LanguageRoomCreateNestedManyWithoutCreatorInput
    createdGroups?: GroupCreateNestedManyWithoutCreatorInput
    groupMembers?: GroupMemberCreateNestedManyWithoutUserInput
    groupMessages?: GroupMessageCreateNestedManyWithoutSenderInput
  }

  export type UserUncheckedCreateWithoutReceivedCloseFriendRequestsInput = {
    id?: number
    name: string
    email: string
    password?: string | null
    googleId?: string | null
    bio?: string | null
    profilePicture?: string | null
    collegeName?: string | null
    department?: string | null
    yearOfStudy?: string | null
    phoneNumber?: string | null
    phoneVisibility?: string
    whatsappNumber?: string | null
    whatsappVisibility?: string
    instagramHandle?: string | null
    instagramVisibility?: string
    facebookUrl?: string | null
    facebookVisibility?: string
    snapchatUsername?: string | null
    snapchatVisibility?: string
    linkedinUrl?: string | null
    linkedinVisibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostUncheckedCreateNestedManyWithoutAuthorInput
    comments?: CommentUncheckedCreateNestedManyWithoutAuthorInput
    likedPosts?: PostUncheckedCreateNestedManyWithoutLikesInput
    sentFriendRequests?: FriendshipUncheckedCreateNestedManyWithoutSenderInput
    receivedFriendRequests?: FriendshipUncheckedCreateNestedManyWithoutReceiverInput
    sentMessages?: MessageUncheckedCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageUncheckedCreateNestedManyWithoutReceiverInput
    myCrushes?: CrushUncheckedCreateNestedManyWithoutUserInput
    crushedBy?: CrushUncheckedCreateNestedManyWithoutCrushInput
    sentCloseFriendRequests?: CloseFriendRequestUncheckedCreateNestedManyWithoutSenderInput
    languageRooms?: LanguageRoomUncheckedCreateNestedManyWithoutCreatorInput
    createdGroups?: GroupUncheckedCreateNestedManyWithoutCreatorInput
    groupMembers?: GroupMemberUncheckedCreateNestedManyWithoutUserInput
    groupMessages?: GroupMessageUncheckedCreateNestedManyWithoutSenderInput
  }

  export type UserCreateOrConnectWithoutReceivedCloseFriendRequestsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutReceivedCloseFriendRequestsInput, UserUncheckedCreateWithoutReceivedCloseFriendRequestsInput>
  }

  export type UserUpsertWithoutSentCloseFriendRequestsInput = {
    update: XOR<UserUpdateWithoutSentCloseFriendRequestsInput, UserUncheckedUpdateWithoutSentCloseFriendRequestsInput>
    create: XOR<UserCreateWithoutSentCloseFriendRequestsInput, UserUncheckedCreateWithoutSentCloseFriendRequestsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutSentCloseFriendRequestsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutSentCloseFriendRequestsInput, UserUncheckedUpdateWithoutSentCloseFriendRequestsInput>
  }

  export type UserUpdateWithoutSentCloseFriendRequestsInput = {
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    googleId?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    collegeName?: NullableStringFieldUpdateOperationsInput | string | null
    department?: NullableStringFieldUpdateOperationsInput | string | null
    yearOfStudy?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    phoneVisibility?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: NullableStringFieldUpdateOperationsInput | string | null
    whatsappVisibility?: StringFieldUpdateOperationsInput | string
    instagramHandle?: NullableStringFieldUpdateOperationsInput | string | null
    instagramVisibility?: StringFieldUpdateOperationsInput | string
    facebookUrl?: NullableStringFieldUpdateOperationsInput | string | null
    facebookVisibility?: StringFieldUpdateOperationsInput | string
    snapchatUsername?: NullableStringFieldUpdateOperationsInput | string | null
    snapchatVisibility?: StringFieldUpdateOperationsInput | string
    linkedinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    linkedinVisibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUpdateManyWithoutAuthorNestedInput
    comments?: CommentUpdateManyWithoutAuthorNestedInput
    likedPosts?: PostUpdateManyWithoutLikesNestedInput
    sentFriendRequests?: FriendshipUpdateManyWithoutSenderNestedInput
    receivedFriendRequests?: FriendshipUpdateManyWithoutReceiverNestedInput
    sentMessages?: MessageUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUpdateManyWithoutReceiverNestedInput
    myCrushes?: CrushUpdateManyWithoutUserNestedInput
    crushedBy?: CrushUpdateManyWithoutCrushNestedInput
    receivedCloseFriendRequests?: CloseFriendRequestUpdateManyWithoutReceiverNestedInput
    languageRooms?: LanguageRoomUpdateManyWithoutCreatorNestedInput
    createdGroups?: GroupUpdateManyWithoutCreatorNestedInput
    groupMembers?: GroupMemberUpdateManyWithoutUserNestedInput
    groupMessages?: GroupMessageUpdateManyWithoutSenderNestedInput
  }

  export type UserUncheckedUpdateWithoutSentCloseFriendRequestsInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    googleId?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    collegeName?: NullableStringFieldUpdateOperationsInput | string | null
    department?: NullableStringFieldUpdateOperationsInput | string | null
    yearOfStudy?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    phoneVisibility?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: NullableStringFieldUpdateOperationsInput | string | null
    whatsappVisibility?: StringFieldUpdateOperationsInput | string
    instagramHandle?: NullableStringFieldUpdateOperationsInput | string | null
    instagramVisibility?: StringFieldUpdateOperationsInput | string
    facebookUrl?: NullableStringFieldUpdateOperationsInput | string | null
    facebookVisibility?: StringFieldUpdateOperationsInput | string
    snapchatUsername?: NullableStringFieldUpdateOperationsInput | string | null
    snapchatVisibility?: StringFieldUpdateOperationsInput | string
    linkedinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    linkedinVisibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUncheckedUpdateManyWithoutAuthorNestedInput
    comments?: CommentUncheckedUpdateManyWithoutAuthorNestedInput
    likedPosts?: PostUncheckedUpdateManyWithoutLikesNestedInput
    sentFriendRequests?: FriendshipUncheckedUpdateManyWithoutSenderNestedInput
    receivedFriendRequests?: FriendshipUncheckedUpdateManyWithoutReceiverNestedInput
    sentMessages?: MessageUncheckedUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUncheckedUpdateManyWithoutReceiverNestedInput
    myCrushes?: CrushUncheckedUpdateManyWithoutUserNestedInput
    crushedBy?: CrushUncheckedUpdateManyWithoutCrushNestedInput
    receivedCloseFriendRequests?: CloseFriendRequestUncheckedUpdateManyWithoutReceiverNestedInput
    languageRooms?: LanguageRoomUncheckedUpdateManyWithoutCreatorNestedInput
    createdGroups?: GroupUncheckedUpdateManyWithoutCreatorNestedInput
    groupMembers?: GroupMemberUncheckedUpdateManyWithoutUserNestedInput
    groupMessages?: GroupMessageUncheckedUpdateManyWithoutSenderNestedInput
  }

  export type UserUpsertWithoutReceivedCloseFriendRequestsInput = {
    update: XOR<UserUpdateWithoutReceivedCloseFriendRequestsInput, UserUncheckedUpdateWithoutReceivedCloseFriendRequestsInput>
    create: XOR<UserCreateWithoutReceivedCloseFriendRequestsInput, UserUncheckedCreateWithoutReceivedCloseFriendRequestsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutReceivedCloseFriendRequestsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutReceivedCloseFriendRequestsInput, UserUncheckedUpdateWithoutReceivedCloseFriendRequestsInput>
  }

  export type UserUpdateWithoutReceivedCloseFriendRequestsInput = {
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    googleId?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    collegeName?: NullableStringFieldUpdateOperationsInput | string | null
    department?: NullableStringFieldUpdateOperationsInput | string | null
    yearOfStudy?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    phoneVisibility?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: NullableStringFieldUpdateOperationsInput | string | null
    whatsappVisibility?: StringFieldUpdateOperationsInput | string
    instagramHandle?: NullableStringFieldUpdateOperationsInput | string | null
    instagramVisibility?: StringFieldUpdateOperationsInput | string
    facebookUrl?: NullableStringFieldUpdateOperationsInput | string | null
    facebookVisibility?: StringFieldUpdateOperationsInput | string
    snapchatUsername?: NullableStringFieldUpdateOperationsInput | string | null
    snapchatVisibility?: StringFieldUpdateOperationsInput | string
    linkedinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    linkedinVisibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUpdateManyWithoutAuthorNestedInput
    comments?: CommentUpdateManyWithoutAuthorNestedInput
    likedPosts?: PostUpdateManyWithoutLikesNestedInput
    sentFriendRequests?: FriendshipUpdateManyWithoutSenderNestedInput
    receivedFriendRequests?: FriendshipUpdateManyWithoutReceiverNestedInput
    sentMessages?: MessageUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUpdateManyWithoutReceiverNestedInput
    myCrushes?: CrushUpdateManyWithoutUserNestedInput
    crushedBy?: CrushUpdateManyWithoutCrushNestedInput
    sentCloseFriendRequests?: CloseFriendRequestUpdateManyWithoutSenderNestedInput
    languageRooms?: LanguageRoomUpdateManyWithoutCreatorNestedInput
    createdGroups?: GroupUpdateManyWithoutCreatorNestedInput
    groupMembers?: GroupMemberUpdateManyWithoutUserNestedInput
    groupMessages?: GroupMessageUpdateManyWithoutSenderNestedInput
  }

  export type UserUncheckedUpdateWithoutReceivedCloseFriendRequestsInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    googleId?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    collegeName?: NullableStringFieldUpdateOperationsInput | string | null
    department?: NullableStringFieldUpdateOperationsInput | string | null
    yearOfStudy?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    phoneVisibility?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: NullableStringFieldUpdateOperationsInput | string | null
    whatsappVisibility?: StringFieldUpdateOperationsInput | string
    instagramHandle?: NullableStringFieldUpdateOperationsInput | string | null
    instagramVisibility?: StringFieldUpdateOperationsInput | string
    facebookUrl?: NullableStringFieldUpdateOperationsInput | string | null
    facebookVisibility?: StringFieldUpdateOperationsInput | string
    snapchatUsername?: NullableStringFieldUpdateOperationsInput | string | null
    snapchatVisibility?: StringFieldUpdateOperationsInput | string
    linkedinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    linkedinVisibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUncheckedUpdateManyWithoutAuthorNestedInput
    comments?: CommentUncheckedUpdateManyWithoutAuthorNestedInput
    likedPosts?: PostUncheckedUpdateManyWithoutLikesNestedInput
    sentFriendRequests?: FriendshipUncheckedUpdateManyWithoutSenderNestedInput
    receivedFriendRequests?: FriendshipUncheckedUpdateManyWithoutReceiverNestedInput
    sentMessages?: MessageUncheckedUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUncheckedUpdateManyWithoutReceiverNestedInput
    myCrushes?: CrushUncheckedUpdateManyWithoutUserNestedInput
    crushedBy?: CrushUncheckedUpdateManyWithoutCrushNestedInput
    sentCloseFriendRequests?: CloseFriendRequestUncheckedUpdateManyWithoutSenderNestedInput
    languageRooms?: LanguageRoomUncheckedUpdateManyWithoutCreatorNestedInput
    createdGroups?: GroupUncheckedUpdateManyWithoutCreatorNestedInput
    groupMembers?: GroupMemberUncheckedUpdateManyWithoutUserNestedInput
    groupMessages?: GroupMessageUncheckedUpdateManyWithoutSenderNestedInput
  }

  export type UserCreateWithoutLanguageRoomsInput = {
    name: string
    email: string
    password?: string | null
    googleId?: string | null
    bio?: string | null
    profilePicture?: string | null
    collegeName?: string | null
    department?: string | null
    yearOfStudy?: string | null
    phoneNumber?: string | null
    phoneVisibility?: string
    whatsappNumber?: string | null
    whatsappVisibility?: string
    instagramHandle?: string | null
    instagramVisibility?: string
    facebookUrl?: string | null
    facebookVisibility?: string
    snapchatUsername?: string | null
    snapchatVisibility?: string
    linkedinUrl?: string | null
    linkedinVisibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostCreateNestedManyWithoutAuthorInput
    comments?: CommentCreateNestedManyWithoutAuthorInput
    likedPosts?: PostCreateNestedManyWithoutLikesInput
    sentFriendRequests?: FriendshipCreateNestedManyWithoutSenderInput
    receivedFriendRequests?: FriendshipCreateNestedManyWithoutReceiverInput
    sentMessages?: MessageCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageCreateNestedManyWithoutReceiverInput
    myCrushes?: CrushCreateNestedManyWithoutUserInput
    crushedBy?: CrushCreateNestedManyWithoutCrushInput
    sentCloseFriendRequests?: CloseFriendRequestCreateNestedManyWithoutSenderInput
    receivedCloseFriendRequests?: CloseFriendRequestCreateNestedManyWithoutReceiverInput
    createdGroups?: GroupCreateNestedManyWithoutCreatorInput
    groupMembers?: GroupMemberCreateNestedManyWithoutUserInput
    groupMessages?: GroupMessageCreateNestedManyWithoutSenderInput
  }

  export type UserUncheckedCreateWithoutLanguageRoomsInput = {
    id?: number
    name: string
    email: string
    password?: string | null
    googleId?: string | null
    bio?: string | null
    profilePicture?: string | null
    collegeName?: string | null
    department?: string | null
    yearOfStudy?: string | null
    phoneNumber?: string | null
    phoneVisibility?: string
    whatsappNumber?: string | null
    whatsappVisibility?: string
    instagramHandle?: string | null
    instagramVisibility?: string
    facebookUrl?: string | null
    facebookVisibility?: string
    snapchatUsername?: string | null
    snapchatVisibility?: string
    linkedinUrl?: string | null
    linkedinVisibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostUncheckedCreateNestedManyWithoutAuthorInput
    comments?: CommentUncheckedCreateNestedManyWithoutAuthorInput
    likedPosts?: PostUncheckedCreateNestedManyWithoutLikesInput
    sentFriendRequests?: FriendshipUncheckedCreateNestedManyWithoutSenderInput
    receivedFriendRequests?: FriendshipUncheckedCreateNestedManyWithoutReceiverInput
    sentMessages?: MessageUncheckedCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageUncheckedCreateNestedManyWithoutReceiverInput
    myCrushes?: CrushUncheckedCreateNestedManyWithoutUserInput
    crushedBy?: CrushUncheckedCreateNestedManyWithoutCrushInput
    sentCloseFriendRequests?: CloseFriendRequestUncheckedCreateNestedManyWithoutSenderInput
    receivedCloseFriendRequests?: CloseFriendRequestUncheckedCreateNestedManyWithoutReceiverInput
    createdGroups?: GroupUncheckedCreateNestedManyWithoutCreatorInput
    groupMembers?: GroupMemberUncheckedCreateNestedManyWithoutUserInput
    groupMessages?: GroupMessageUncheckedCreateNestedManyWithoutSenderInput
  }

  export type UserCreateOrConnectWithoutLanguageRoomsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutLanguageRoomsInput, UserUncheckedCreateWithoutLanguageRoomsInput>
  }

  export type UserUpsertWithoutLanguageRoomsInput = {
    update: XOR<UserUpdateWithoutLanguageRoomsInput, UserUncheckedUpdateWithoutLanguageRoomsInput>
    create: XOR<UserCreateWithoutLanguageRoomsInput, UserUncheckedCreateWithoutLanguageRoomsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutLanguageRoomsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutLanguageRoomsInput, UserUncheckedUpdateWithoutLanguageRoomsInput>
  }

  export type UserUpdateWithoutLanguageRoomsInput = {
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    googleId?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    collegeName?: NullableStringFieldUpdateOperationsInput | string | null
    department?: NullableStringFieldUpdateOperationsInput | string | null
    yearOfStudy?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    phoneVisibility?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: NullableStringFieldUpdateOperationsInput | string | null
    whatsappVisibility?: StringFieldUpdateOperationsInput | string
    instagramHandle?: NullableStringFieldUpdateOperationsInput | string | null
    instagramVisibility?: StringFieldUpdateOperationsInput | string
    facebookUrl?: NullableStringFieldUpdateOperationsInput | string | null
    facebookVisibility?: StringFieldUpdateOperationsInput | string
    snapchatUsername?: NullableStringFieldUpdateOperationsInput | string | null
    snapchatVisibility?: StringFieldUpdateOperationsInput | string
    linkedinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    linkedinVisibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUpdateManyWithoutAuthorNestedInput
    comments?: CommentUpdateManyWithoutAuthorNestedInput
    likedPosts?: PostUpdateManyWithoutLikesNestedInput
    sentFriendRequests?: FriendshipUpdateManyWithoutSenderNestedInput
    receivedFriendRequests?: FriendshipUpdateManyWithoutReceiverNestedInput
    sentMessages?: MessageUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUpdateManyWithoutReceiverNestedInput
    myCrushes?: CrushUpdateManyWithoutUserNestedInput
    crushedBy?: CrushUpdateManyWithoutCrushNestedInput
    sentCloseFriendRequests?: CloseFriendRequestUpdateManyWithoutSenderNestedInput
    receivedCloseFriendRequests?: CloseFriendRequestUpdateManyWithoutReceiverNestedInput
    createdGroups?: GroupUpdateManyWithoutCreatorNestedInput
    groupMembers?: GroupMemberUpdateManyWithoutUserNestedInput
    groupMessages?: GroupMessageUpdateManyWithoutSenderNestedInput
  }

  export type UserUncheckedUpdateWithoutLanguageRoomsInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    googleId?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    collegeName?: NullableStringFieldUpdateOperationsInput | string | null
    department?: NullableStringFieldUpdateOperationsInput | string | null
    yearOfStudy?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    phoneVisibility?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: NullableStringFieldUpdateOperationsInput | string | null
    whatsappVisibility?: StringFieldUpdateOperationsInput | string
    instagramHandle?: NullableStringFieldUpdateOperationsInput | string | null
    instagramVisibility?: StringFieldUpdateOperationsInput | string
    facebookUrl?: NullableStringFieldUpdateOperationsInput | string | null
    facebookVisibility?: StringFieldUpdateOperationsInput | string
    snapchatUsername?: NullableStringFieldUpdateOperationsInput | string | null
    snapchatVisibility?: StringFieldUpdateOperationsInput | string
    linkedinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    linkedinVisibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUncheckedUpdateManyWithoutAuthorNestedInput
    comments?: CommentUncheckedUpdateManyWithoutAuthorNestedInput
    likedPosts?: PostUncheckedUpdateManyWithoutLikesNestedInput
    sentFriendRequests?: FriendshipUncheckedUpdateManyWithoutSenderNestedInput
    receivedFriendRequests?: FriendshipUncheckedUpdateManyWithoutReceiverNestedInput
    sentMessages?: MessageUncheckedUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUncheckedUpdateManyWithoutReceiverNestedInput
    myCrushes?: CrushUncheckedUpdateManyWithoutUserNestedInput
    crushedBy?: CrushUncheckedUpdateManyWithoutCrushNestedInput
    sentCloseFriendRequests?: CloseFriendRequestUncheckedUpdateManyWithoutSenderNestedInput
    receivedCloseFriendRequests?: CloseFriendRequestUncheckedUpdateManyWithoutReceiverNestedInput
    createdGroups?: GroupUncheckedUpdateManyWithoutCreatorNestedInput
    groupMembers?: GroupMemberUncheckedUpdateManyWithoutUserNestedInput
    groupMessages?: GroupMessageUncheckedUpdateManyWithoutSenderNestedInput
  }

  export type UserCreateWithoutCreatedGroupsInput = {
    name: string
    email: string
    password?: string | null
    googleId?: string | null
    bio?: string | null
    profilePicture?: string | null
    collegeName?: string | null
    department?: string | null
    yearOfStudy?: string | null
    phoneNumber?: string | null
    phoneVisibility?: string
    whatsappNumber?: string | null
    whatsappVisibility?: string
    instagramHandle?: string | null
    instagramVisibility?: string
    facebookUrl?: string | null
    facebookVisibility?: string
    snapchatUsername?: string | null
    snapchatVisibility?: string
    linkedinUrl?: string | null
    linkedinVisibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostCreateNestedManyWithoutAuthorInput
    comments?: CommentCreateNestedManyWithoutAuthorInput
    likedPosts?: PostCreateNestedManyWithoutLikesInput
    sentFriendRequests?: FriendshipCreateNestedManyWithoutSenderInput
    receivedFriendRequests?: FriendshipCreateNestedManyWithoutReceiverInput
    sentMessages?: MessageCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageCreateNestedManyWithoutReceiverInput
    myCrushes?: CrushCreateNestedManyWithoutUserInput
    crushedBy?: CrushCreateNestedManyWithoutCrushInput
    sentCloseFriendRequests?: CloseFriendRequestCreateNestedManyWithoutSenderInput
    receivedCloseFriendRequests?: CloseFriendRequestCreateNestedManyWithoutReceiverInput
    languageRooms?: LanguageRoomCreateNestedManyWithoutCreatorInput
    groupMembers?: GroupMemberCreateNestedManyWithoutUserInput
    groupMessages?: GroupMessageCreateNestedManyWithoutSenderInput
  }

  export type UserUncheckedCreateWithoutCreatedGroupsInput = {
    id?: number
    name: string
    email: string
    password?: string | null
    googleId?: string | null
    bio?: string | null
    profilePicture?: string | null
    collegeName?: string | null
    department?: string | null
    yearOfStudy?: string | null
    phoneNumber?: string | null
    phoneVisibility?: string
    whatsappNumber?: string | null
    whatsappVisibility?: string
    instagramHandle?: string | null
    instagramVisibility?: string
    facebookUrl?: string | null
    facebookVisibility?: string
    snapchatUsername?: string | null
    snapchatVisibility?: string
    linkedinUrl?: string | null
    linkedinVisibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostUncheckedCreateNestedManyWithoutAuthorInput
    comments?: CommentUncheckedCreateNestedManyWithoutAuthorInput
    likedPosts?: PostUncheckedCreateNestedManyWithoutLikesInput
    sentFriendRequests?: FriendshipUncheckedCreateNestedManyWithoutSenderInput
    receivedFriendRequests?: FriendshipUncheckedCreateNestedManyWithoutReceiverInput
    sentMessages?: MessageUncheckedCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageUncheckedCreateNestedManyWithoutReceiverInput
    myCrushes?: CrushUncheckedCreateNestedManyWithoutUserInput
    crushedBy?: CrushUncheckedCreateNestedManyWithoutCrushInput
    sentCloseFriendRequests?: CloseFriendRequestUncheckedCreateNestedManyWithoutSenderInput
    receivedCloseFriendRequests?: CloseFriendRequestUncheckedCreateNestedManyWithoutReceiverInput
    languageRooms?: LanguageRoomUncheckedCreateNestedManyWithoutCreatorInput
    groupMembers?: GroupMemberUncheckedCreateNestedManyWithoutUserInput
    groupMessages?: GroupMessageUncheckedCreateNestedManyWithoutSenderInput
  }

  export type UserCreateOrConnectWithoutCreatedGroupsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutCreatedGroupsInput, UserUncheckedCreateWithoutCreatedGroupsInput>
  }

  export type GroupMemberCreateWithoutGroupInput = {
    joinedAt?: Date | string
    user: UserCreateNestedOneWithoutGroupMembersInput
  }

  export type GroupMemberUncheckedCreateWithoutGroupInput = {
    id?: number
    joinedAt?: Date | string
    userId: number
  }

  export type GroupMemberCreateOrConnectWithoutGroupInput = {
    where: GroupMemberWhereUniqueInput
    create: XOR<GroupMemberCreateWithoutGroupInput, GroupMemberUncheckedCreateWithoutGroupInput>
  }

  export type GroupMemberCreateManyGroupInputEnvelope = {
    data: GroupMemberCreateManyGroupInput | GroupMemberCreateManyGroupInput[]
  }

  export type GroupMessageCreateWithoutGroupInput = {
    content: string
    createdAt?: Date | string
    sender: UserCreateNestedOneWithoutGroupMessagesInput
  }

  export type GroupMessageUncheckedCreateWithoutGroupInput = {
    id?: number
    content: string
    createdAt?: Date | string
    senderId: number
  }

  export type GroupMessageCreateOrConnectWithoutGroupInput = {
    where: GroupMessageWhereUniqueInput
    create: XOR<GroupMessageCreateWithoutGroupInput, GroupMessageUncheckedCreateWithoutGroupInput>
  }

  export type GroupMessageCreateManyGroupInputEnvelope = {
    data: GroupMessageCreateManyGroupInput | GroupMessageCreateManyGroupInput[]
  }

  export type UserUpsertWithoutCreatedGroupsInput = {
    update: XOR<UserUpdateWithoutCreatedGroupsInput, UserUncheckedUpdateWithoutCreatedGroupsInput>
    create: XOR<UserCreateWithoutCreatedGroupsInput, UserUncheckedCreateWithoutCreatedGroupsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutCreatedGroupsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutCreatedGroupsInput, UserUncheckedUpdateWithoutCreatedGroupsInput>
  }

  export type UserUpdateWithoutCreatedGroupsInput = {
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    googleId?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    collegeName?: NullableStringFieldUpdateOperationsInput | string | null
    department?: NullableStringFieldUpdateOperationsInput | string | null
    yearOfStudy?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    phoneVisibility?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: NullableStringFieldUpdateOperationsInput | string | null
    whatsappVisibility?: StringFieldUpdateOperationsInput | string
    instagramHandle?: NullableStringFieldUpdateOperationsInput | string | null
    instagramVisibility?: StringFieldUpdateOperationsInput | string
    facebookUrl?: NullableStringFieldUpdateOperationsInput | string | null
    facebookVisibility?: StringFieldUpdateOperationsInput | string
    snapchatUsername?: NullableStringFieldUpdateOperationsInput | string | null
    snapchatVisibility?: StringFieldUpdateOperationsInput | string
    linkedinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    linkedinVisibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUpdateManyWithoutAuthorNestedInput
    comments?: CommentUpdateManyWithoutAuthorNestedInput
    likedPosts?: PostUpdateManyWithoutLikesNestedInput
    sentFriendRequests?: FriendshipUpdateManyWithoutSenderNestedInput
    receivedFriendRequests?: FriendshipUpdateManyWithoutReceiverNestedInput
    sentMessages?: MessageUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUpdateManyWithoutReceiverNestedInput
    myCrushes?: CrushUpdateManyWithoutUserNestedInput
    crushedBy?: CrushUpdateManyWithoutCrushNestedInput
    sentCloseFriendRequests?: CloseFriendRequestUpdateManyWithoutSenderNestedInput
    receivedCloseFriendRequests?: CloseFriendRequestUpdateManyWithoutReceiverNestedInput
    languageRooms?: LanguageRoomUpdateManyWithoutCreatorNestedInput
    groupMembers?: GroupMemberUpdateManyWithoutUserNestedInput
    groupMessages?: GroupMessageUpdateManyWithoutSenderNestedInput
  }

  export type UserUncheckedUpdateWithoutCreatedGroupsInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    googleId?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    collegeName?: NullableStringFieldUpdateOperationsInput | string | null
    department?: NullableStringFieldUpdateOperationsInput | string | null
    yearOfStudy?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    phoneVisibility?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: NullableStringFieldUpdateOperationsInput | string | null
    whatsappVisibility?: StringFieldUpdateOperationsInput | string
    instagramHandle?: NullableStringFieldUpdateOperationsInput | string | null
    instagramVisibility?: StringFieldUpdateOperationsInput | string
    facebookUrl?: NullableStringFieldUpdateOperationsInput | string | null
    facebookVisibility?: StringFieldUpdateOperationsInput | string
    snapchatUsername?: NullableStringFieldUpdateOperationsInput | string | null
    snapchatVisibility?: StringFieldUpdateOperationsInput | string
    linkedinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    linkedinVisibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUncheckedUpdateManyWithoutAuthorNestedInput
    comments?: CommentUncheckedUpdateManyWithoutAuthorNestedInput
    likedPosts?: PostUncheckedUpdateManyWithoutLikesNestedInput
    sentFriendRequests?: FriendshipUncheckedUpdateManyWithoutSenderNestedInput
    receivedFriendRequests?: FriendshipUncheckedUpdateManyWithoutReceiverNestedInput
    sentMessages?: MessageUncheckedUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUncheckedUpdateManyWithoutReceiverNestedInput
    myCrushes?: CrushUncheckedUpdateManyWithoutUserNestedInput
    crushedBy?: CrushUncheckedUpdateManyWithoutCrushNestedInput
    sentCloseFriendRequests?: CloseFriendRequestUncheckedUpdateManyWithoutSenderNestedInput
    receivedCloseFriendRequests?: CloseFriendRequestUncheckedUpdateManyWithoutReceiverNestedInput
    languageRooms?: LanguageRoomUncheckedUpdateManyWithoutCreatorNestedInput
    groupMembers?: GroupMemberUncheckedUpdateManyWithoutUserNestedInput
    groupMessages?: GroupMessageUncheckedUpdateManyWithoutSenderNestedInput
  }

  export type GroupMemberUpsertWithWhereUniqueWithoutGroupInput = {
    where: GroupMemberWhereUniqueInput
    update: XOR<GroupMemberUpdateWithoutGroupInput, GroupMemberUncheckedUpdateWithoutGroupInput>
    create: XOR<GroupMemberCreateWithoutGroupInput, GroupMemberUncheckedCreateWithoutGroupInput>
  }

  export type GroupMemberUpdateWithWhereUniqueWithoutGroupInput = {
    where: GroupMemberWhereUniqueInput
    data: XOR<GroupMemberUpdateWithoutGroupInput, GroupMemberUncheckedUpdateWithoutGroupInput>
  }

  export type GroupMemberUpdateManyWithWhereWithoutGroupInput = {
    where: GroupMemberScalarWhereInput
    data: XOR<GroupMemberUpdateManyMutationInput, GroupMemberUncheckedUpdateManyWithoutGroupInput>
  }

  export type GroupMessageUpsertWithWhereUniqueWithoutGroupInput = {
    where: GroupMessageWhereUniqueInput
    update: XOR<GroupMessageUpdateWithoutGroupInput, GroupMessageUncheckedUpdateWithoutGroupInput>
    create: XOR<GroupMessageCreateWithoutGroupInput, GroupMessageUncheckedCreateWithoutGroupInput>
  }

  export type GroupMessageUpdateWithWhereUniqueWithoutGroupInput = {
    where: GroupMessageWhereUniqueInput
    data: XOR<GroupMessageUpdateWithoutGroupInput, GroupMessageUncheckedUpdateWithoutGroupInput>
  }

  export type GroupMessageUpdateManyWithWhereWithoutGroupInput = {
    where: GroupMessageScalarWhereInput
    data: XOR<GroupMessageUpdateManyMutationInput, GroupMessageUncheckedUpdateManyWithoutGroupInput>
  }

  export type GroupCreateWithoutMembersInput = {
    name: string
    description?: string | null
    isPrivate?: boolean
    entryKey?: string | null
    createdAt?: Date | string
    creator: UserCreateNestedOneWithoutCreatedGroupsInput
    messages?: GroupMessageCreateNestedManyWithoutGroupInput
  }

  export type GroupUncheckedCreateWithoutMembersInput = {
    id?: number
    name: string
    description?: string | null
    isPrivate?: boolean
    entryKey?: string | null
    createdAt?: Date | string
    creatorId: number
    messages?: GroupMessageUncheckedCreateNestedManyWithoutGroupInput
  }

  export type GroupCreateOrConnectWithoutMembersInput = {
    where: GroupWhereUniqueInput
    create: XOR<GroupCreateWithoutMembersInput, GroupUncheckedCreateWithoutMembersInput>
  }

  export type UserCreateWithoutGroupMembersInput = {
    name: string
    email: string
    password?: string | null
    googleId?: string | null
    bio?: string | null
    profilePicture?: string | null
    collegeName?: string | null
    department?: string | null
    yearOfStudy?: string | null
    phoneNumber?: string | null
    phoneVisibility?: string
    whatsappNumber?: string | null
    whatsappVisibility?: string
    instagramHandle?: string | null
    instagramVisibility?: string
    facebookUrl?: string | null
    facebookVisibility?: string
    snapchatUsername?: string | null
    snapchatVisibility?: string
    linkedinUrl?: string | null
    linkedinVisibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostCreateNestedManyWithoutAuthorInput
    comments?: CommentCreateNestedManyWithoutAuthorInput
    likedPosts?: PostCreateNestedManyWithoutLikesInput
    sentFriendRequests?: FriendshipCreateNestedManyWithoutSenderInput
    receivedFriendRequests?: FriendshipCreateNestedManyWithoutReceiverInput
    sentMessages?: MessageCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageCreateNestedManyWithoutReceiverInput
    myCrushes?: CrushCreateNestedManyWithoutUserInput
    crushedBy?: CrushCreateNestedManyWithoutCrushInput
    sentCloseFriendRequests?: CloseFriendRequestCreateNestedManyWithoutSenderInput
    receivedCloseFriendRequests?: CloseFriendRequestCreateNestedManyWithoutReceiverInput
    languageRooms?: LanguageRoomCreateNestedManyWithoutCreatorInput
    createdGroups?: GroupCreateNestedManyWithoutCreatorInput
    groupMessages?: GroupMessageCreateNestedManyWithoutSenderInput
  }

  export type UserUncheckedCreateWithoutGroupMembersInput = {
    id?: number
    name: string
    email: string
    password?: string | null
    googleId?: string | null
    bio?: string | null
    profilePicture?: string | null
    collegeName?: string | null
    department?: string | null
    yearOfStudy?: string | null
    phoneNumber?: string | null
    phoneVisibility?: string
    whatsappNumber?: string | null
    whatsappVisibility?: string
    instagramHandle?: string | null
    instagramVisibility?: string
    facebookUrl?: string | null
    facebookVisibility?: string
    snapchatUsername?: string | null
    snapchatVisibility?: string
    linkedinUrl?: string | null
    linkedinVisibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostUncheckedCreateNestedManyWithoutAuthorInput
    comments?: CommentUncheckedCreateNestedManyWithoutAuthorInput
    likedPosts?: PostUncheckedCreateNestedManyWithoutLikesInput
    sentFriendRequests?: FriendshipUncheckedCreateNestedManyWithoutSenderInput
    receivedFriendRequests?: FriendshipUncheckedCreateNestedManyWithoutReceiverInput
    sentMessages?: MessageUncheckedCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageUncheckedCreateNestedManyWithoutReceiverInput
    myCrushes?: CrushUncheckedCreateNestedManyWithoutUserInput
    crushedBy?: CrushUncheckedCreateNestedManyWithoutCrushInput
    sentCloseFriendRequests?: CloseFriendRequestUncheckedCreateNestedManyWithoutSenderInput
    receivedCloseFriendRequests?: CloseFriendRequestUncheckedCreateNestedManyWithoutReceiverInput
    languageRooms?: LanguageRoomUncheckedCreateNestedManyWithoutCreatorInput
    createdGroups?: GroupUncheckedCreateNestedManyWithoutCreatorInput
    groupMessages?: GroupMessageUncheckedCreateNestedManyWithoutSenderInput
  }

  export type UserCreateOrConnectWithoutGroupMembersInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutGroupMembersInput, UserUncheckedCreateWithoutGroupMembersInput>
  }

  export type GroupUpsertWithoutMembersInput = {
    update: XOR<GroupUpdateWithoutMembersInput, GroupUncheckedUpdateWithoutMembersInput>
    create: XOR<GroupCreateWithoutMembersInput, GroupUncheckedCreateWithoutMembersInput>
    where?: GroupWhereInput
  }

  export type GroupUpdateToOneWithWhereWithoutMembersInput = {
    where?: GroupWhereInput
    data: XOR<GroupUpdateWithoutMembersInput, GroupUncheckedUpdateWithoutMembersInput>
  }

  export type GroupUpdateWithoutMembersInput = {
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    entryKey?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    creator?: UserUpdateOneRequiredWithoutCreatedGroupsNestedInput
    messages?: GroupMessageUpdateManyWithoutGroupNestedInput
  }

  export type GroupUncheckedUpdateWithoutMembersInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    entryKey?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    creatorId?: IntFieldUpdateOperationsInput | number
    messages?: GroupMessageUncheckedUpdateManyWithoutGroupNestedInput
  }

  export type UserUpsertWithoutGroupMembersInput = {
    update: XOR<UserUpdateWithoutGroupMembersInput, UserUncheckedUpdateWithoutGroupMembersInput>
    create: XOR<UserCreateWithoutGroupMembersInput, UserUncheckedCreateWithoutGroupMembersInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutGroupMembersInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutGroupMembersInput, UserUncheckedUpdateWithoutGroupMembersInput>
  }

  export type UserUpdateWithoutGroupMembersInput = {
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    googleId?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    collegeName?: NullableStringFieldUpdateOperationsInput | string | null
    department?: NullableStringFieldUpdateOperationsInput | string | null
    yearOfStudy?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    phoneVisibility?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: NullableStringFieldUpdateOperationsInput | string | null
    whatsappVisibility?: StringFieldUpdateOperationsInput | string
    instagramHandle?: NullableStringFieldUpdateOperationsInput | string | null
    instagramVisibility?: StringFieldUpdateOperationsInput | string
    facebookUrl?: NullableStringFieldUpdateOperationsInput | string | null
    facebookVisibility?: StringFieldUpdateOperationsInput | string
    snapchatUsername?: NullableStringFieldUpdateOperationsInput | string | null
    snapchatVisibility?: StringFieldUpdateOperationsInput | string
    linkedinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    linkedinVisibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUpdateManyWithoutAuthorNestedInput
    comments?: CommentUpdateManyWithoutAuthorNestedInput
    likedPosts?: PostUpdateManyWithoutLikesNestedInput
    sentFriendRequests?: FriendshipUpdateManyWithoutSenderNestedInput
    receivedFriendRequests?: FriendshipUpdateManyWithoutReceiverNestedInput
    sentMessages?: MessageUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUpdateManyWithoutReceiverNestedInput
    myCrushes?: CrushUpdateManyWithoutUserNestedInput
    crushedBy?: CrushUpdateManyWithoutCrushNestedInput
    sentCloseFriendRequests?: CloseFriendRequestUpdateManyWithoutSenderNestedInput
    receivedCloseFriendRequests?: CloseFriendRequestUpdateManyWithoutReceiverNestedInput
    languageRooms?: LanguageRoomUpdateManyWithoutCreatorNestedInput
    createdGroups?: GroupUpdateManyWithoutCreatorNestedInput
    groupMessages?: GroupMessageUpdateManyWithoutSenderNestedInput
  }

  export type UserUncheckedUpdateWithoutGroupMembersInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    googleId?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    collegeName?: NullableStringFieldUpdateOperationsInput | string | null
    department?: NullableStringFieldUpdateOperationsInput | string | null
    yearOfStudy?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    phoneVisibility?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: NullableStringFieldUpdateOperationsInput | string | null
    whatsappVisibility?: StringFieldUpdateOperationsInput | string
    instagramHandle?: NullableStringFieldUpdateOperationsInput | string | null
    instagramVisibility?: StringFieldUpdateOperationsInput | string
    facebookUrl?: NullableStringFieldUpdateOperationsInput | string | null
    facebookVisibility?: StringFieldUpdateOperationsInput | string
    snapchatUsername?: NullableStringFieldUpdateOperationsInput | string | null
    snapchatVisibility?: StringFieldUpdateOperationsInput | string
    linkedinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    linkedinVisibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUncheckedUpdateManyWithoutAuthorNestedInput
    comments?: CommentUncheckedUpdateManyWithoutAuthorNestedInput
    likedPosts?: PostUncheckedUpdateManyWithoutLikesNestedInput
    sentFriendRequests?: FriendshipUncheckedUpdateManyWithoutSenderNestedInput
    receivedFriendRequests?: FriendshipUncheckedUpdateManyWithoutReceiverNestedInput
    sentMessages?: MessageUncheckedUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUncheckedUpdateManyWithoutReceiverNestedInput
    myCrushes?: CrushUncheckedUpdateManyWithoutUserNestedInput
    crushedBy?: CrushUncheckedUpdateManyWithoutCrushNestedInput
    sentCloseFriendRequests?: CloseFriendRequestUncheckedUpdateManyWithoutSenderNestedInput
    receivedCloseFriendRequests?: CloseFriendRequestUncheckedUpdateManyWithoutReceiverNestedInput
    languageRooms?: LanguageRoomUncheckedUpdateManyWithoutCreatorNestedInput
    createdGroups?: GroupUncheckedUpdateManyWithoutCreatorNestedInput
    groupMessages?: GroupMessageUncheckedUpdateManyWithoutSenderNestedInput
  }

  export type GroupCreateWithoutMessagesInput = {
    name: string
    description?: string | null
    isPrivate?: boolean
    entryKey?: string | null
    createdAt?: Date | string
    creator: UserCreateNestedOneWithoutCreatedGroupsInput
    members?: GroupMemberCreateNestedManyWithoutGroupInput
  }

  export type GroupUncheckedCreateWithoutMessagesInput = {
    id?: number
    name: string
    description?: string | null
    isPrivate?: boolean
    entryKey?: string | null
    createdAt?: Date | string
    creatorId: number
    members?: GroupMemberUncheckedCreateNestedManyWithoutGroupInput
  }

  export type GroupCreateOrConnectWithoutMessagesInput = {
    where: GroupWhereUniqueInput
    create: XOR<GroupCreateWithoutMessagesInput, GroupUncheckedCreateWithoutMessagesInput>
  }

  export type UserCreateWithoutGroupMessagesInput = {
    name: string
    email: string
    password?: string | null
    googleId?: string | null
    bio?: string | null
    profilePicture?: string | null
    collegeName?: string | null
    department?: string | null
    yearOfStudy?: string | null
    phoneNumber?: string | null
    phoneVisibility?: string
    whatsappNumber?: string | null
    whatsappVisibility?: string
    instagramHandle?: string | null
    instagramVisibility?: string
    facebookUrl?: string | null
    facebookVisibility?: string
    snapchatUsername?: string | null
    snapchatVisibility?: string
    linkedinUrl?: string | null
    linkedinVisibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostCreateNestedManyWithoutAuthorInput
    comments?: CommentCreateNestedManyWithoutAuthorInput
    likedPosts?: PostCreateNestedManyWithoutLikesInput
    sentFriendRequests?: FriendshipCreateNestedManyWithoutSenderInput
    receivedFriendRequests?: FriendshipCreateNestedManyWithoutReceiverInput
    sentMessages?: MessageCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageCreateNestedManyWithoutReceiverInput
    myCrushes?: CrushCreateNestedManyWithoutUserInput
    crushedBy?: CrushCreateNestedManyWithoutCrushInput
    sentCloseFriendRequests?: CloseFriendRequestCreateNestedManyWithoutSenderInput
    receivedCloseFriendRequests?: CloseFriendRequestCreateNestedManyWithoutReceiverInput
    languageRooms?: LanguageRoomCreateNestedManyWithoutCreatorInput
    createdGroups?: GroupCreateNestedManyWithoutCreatorInput
    groupMembers?: GroupMemberCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutGroupMessagesInput = {
    id?: number
    name: string
    email: string
    password?: string | null
    googleId?: string | null
    bio?: string | null
    profilePicture?: string | null
    collegeName?: string | null
    department?: string | null
    yearOfStudy?: string | null
    phoneNumber?: string | null
    phoneVisibility?: string
    whatsappNumber?: string | null
    whatsappVisibility?: string
    instagramHandle?: string | null
    instagramVisibility?: string
    facebookUrl?: string | null
    facebookVisibility?: string
    snapchatUsername?: string | null
    snapchatVisibility?: string
    linkedinUrl?: string | null
    linkedinVisibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    posts?: PostUncheckedCreateNestedManyWithoutAuthorInput
    comments?: CommentUncheckedCreateNestedManyWithoutAuthorInput
    likedPosts?: PostUncheckedCreateNestedManyWithoutLikesInput
    sentFriendRequests?: FriendshipUncheckedCreateNestedManyWithoutSenderInput
    receivedFriendRequests?: FriendshipUncheckedCreateNestedManyWithoutReceiverInput
    sentMessages?: MessageUncheckedCreateNestedManyWithoutSenderInput
    receivedMessages?: MessageUncheckedCreateNestedManyWithoutReceiverInput
    myCrushes?: CrushUncheckedCreateNestedManyWithoutUserInput
    crushedBy?: CrushUncheckedCreateNestedManyWithoutCrushInput
    sentCloseFriendRequests?: CloseFriendRequestUncheckedCreateNestedManyWithoutSenderInput
    receivedCloseFriendRequests?: CloseFriendRequestUncheckedCreateNestedManyWithoutReceiverInput
    languageRooms?: LanguageRoomUncheckedCreateNestedManyWithoutCreatorInput
    createdGroups?: GroupUncheckedCreateNestedManyWithoutCreatorInput
    groupMembers?: GroupMemberUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutGroupMessagesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutGroupMessagesInput, UserUncheckedCreateWithoutGroupMessagesInput>
  }

  export type GroupUpsertWithoutMessagesInput = {
    update: XOR<GroupUpdateWithoutMessagesInput, GroupUncheckedUpdateWithoutMessagesInput>
    create: XOR<GroupCreateWithoutMessagesInput, GroupUncheckedCreateWithoutMessagesInput>
    where?: GroupWhereInput
  }

  export type GroupUpdateToOneWithWhereWithoutMessagesInput = {
    where?: GroupWhereInput
    data: XOR<GroupUpdateWithoutMessagesInput, GroupUncheckedUpdateWithoutMessagesInput>
  }

  export type GroupUpdateWithoutMessagesInput = {
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    entryKey?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    creator?: UserUpdateOneRequiredWithoutCreatedGroupsNestedInput
    members?: GroupMemberUpdateManyWithoutGroupNestedInput
  }

  export type GroupUncheckedUpdateWithoutMessagesInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    entryKey?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    creatorId?: IntFieldUpdateOperationsInput | number
    members?: GroupMemberUncheckedUpdateManyWithoutGroupNestedInput
  }

  export type UserUpsertWithoutGroupMessagesInput = {
    update: XOR<UserUpdateWithoutGroupMessagesInput, UserUncheckedUpdateWithoutGroupMessagesInput>
    create: XOR<UserCreateWithoutGroupMessagesInput, UserUncheckedCreateWithoutGroupMessagesInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutGroupMessagesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutGroupMessagesInput, UserUncheckedUpdateWithoutGroupMessagesInput>
  }

  export type UserUpdateWithoutGroupMessagesInput = {
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    googleId?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    collegeName?: NullableStringFieldUpdateOperationsInput | string | null
    department?: NullableStringFieldUpdateOperationsInput | string | null
    yearOfStudy?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    phoneVisibility?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: NullableStringFieldUpdateOperationsInput | string | null
    whatsappVisibility?: StringFieldUpdateOperationsInput | string
    instagramHandle?: NullableStringFieldUpdateOperationsInput | string | null
    instagramVisibility?: StringFieldUpdateOperationsInput | string
    facebookUrl?: NullableStringFieldUpdateOperationsInput | string | null
    facebookVisibility?: StringFieldUpdateOperationsInput | string
    snapchatUsername?: NullableStringFieldUpdateOperationsInput | string | null
    snapchatVisibility?: StringFieldUpdateOperationsInput | string
    linkedinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    linkedinVisibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUpdateManyWithoutAuthorNestedInput
    comments?: CommentUpdateManyWithoutAuthorNestedInput
    likedPosts?: PostUpdateManyWithoutLikesNestedInput
    sentFriendRequests?: FriendshipUpdateManyWithoutSenderNestedInput
    receivedFriendRequests?: FriendshipUpdateManyWithoutReceiverNestedInput
    sentMessages?: MessageUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUpdateManyWithoutReceiverNestedInput
    myCrushes?: CrushUpdateManyWithoutUserNestedInput
    crushedBy?: CrushUpdateManyWithoutCrushNestedInput
    sentCloseFriendRequests?: CloseFriendRequestUpdateManyWithoutSenderNestedInput
    receivedCloseFriendRequests?: CloseFriendRequestUpdateManyWithoutReceiverNestedInput
    languageRooms?: LanguageRoomUpdateManyWithoutCreatorNestedInput
    createdGroups?: GroupUpdateManyWithoutCreatorNestedInput
    groupMembers?: GroupMemberUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutGroupMessagesInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    googleId?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    collegeName?: NullableStringFieldUpdateOperationsInput | string | null
    department?: NullableStringFieldUpdateOperationsInput | string | null
    yearOfStudy?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    phoneVisibility?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: NullableStringFieldUpdateOperationsInput | string | null
    whatsappVisibility?: StringFieldUpdateOperationsInput | string
    instagramHandle?: NullableStringFieldUpdateOperationsInput | string | null
    instagramVisibility?: StringFieldUpdateOperationsInput | string
    facebookUrl?: NullableStringFieldUpdateOperationsInput | string | null
    facebookVisibility?: StringFieldUpdateOperationsInput | string
    snapchatUsername?: NullableStringFieldUpdateOperationsInput | string | null
    snapchatVisibility?: StringFieldUpdateOperationsInput | string
    linkedinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    linkedinVisibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUncheckedUpdateManyWithoutAuthorNestedInput
    comments?: CommentUncheckedUpdateManyWithoutAuthorNestedInput
    likedPosts?: PostUncheckedUpdateManyWithoutLikesNestedInput
    sentFriendRequests?: FriendshipUncheckedUpdateManyWithoutSenderNestedInput
    receivedFriendRequests?: FriendshipUncheckedUpdateManyWithoutReceiverNestedInput
    sentMessages?: MessageUncheckedUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUncheckedUpdateManyWithoutReceiverNestedInput
    myCrushes?: CrushUncheckedUpdateManyWithoutUserNestedInput
    crushedBy?: CrushUncheckedUpdateManyWithoutCrushNestedInput
    sentCloseFriendRequests?: CloseFriendRequestUncheckedUpdateManyWithoutSenderNestedInput
    receivedCloseFriendRequests?: CloseFriendRequestUncheckedUpdateManyWithoutReceiverNestedInput
    languageRooms?: LanguageRoomUncheckedUpdateManyWithoutCreatorNestedInput
    createdGroups?: GroupUncheckedUpdateManyWithoutCreatorNestedInput
    groupMembers?: GroupMemberUncheckedUpdateManyWithoutUserNestedInput
  }

  export type PostCreateManyAuthorInput = {
    id?: number
    content: string
    image?: string | null
    visibility?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CommentCreateManyAuthorInput = {
    id?: number
    content: string
    createdAt?: Date | string
    updatedAt?: Date | string
    postId: number
  }

  export type FriendshipCreateManySenderInput = {
    id?: number
    status?: string
    isCloseFriend?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    receiverId: number
  }

  export type FriendshipCreateManyReceiverInput = {
    id?: number
    status?: string
    isCloseFriend?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    senderId: number
  }

  export type MessageCreateManySenderInput = {
    id?: number
    content: string
    isRead?: boolean
    createdAt?: Date | string
    receiverId: number
  }

  export type MessageCreateManyReceiverInput = {
    id?: number
    content: string
    isRead?: boolean
    createdAt?: Date | string
    senderId: number
  }

  export type CrushCreateManyUserInput = {
    id?: number
    createdAt?: Date | string
    crushId: number
  }

  export type CrushCreateManyCrushInput = {
    id?: number
    createdAt?: Date | string
    userId: number
  }

  export type CloseFriendRequestCreateManySenderInput = {
    id?: number
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    receiverId: number
  }

  export type CloseFriendRequestCreateManyReceiverInput = {
    id?: number
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    senderId: number
  }

  export type LanguageRoomCreateManyCreatorInput = {
    id?: number
    roomName: string
    topic: string
    language: string
    createdAt?: Date | string
  }

  export type GroupCreateManyCreatorInput = {
    id?: number
    name: string
    description?: string | null
    isPrivate?: boolean
    entryKey?: string | null
    createdAt?: Date | string
  }

  export type GroupMemberCreateManyUserInput = {
    id?: number
    joinedAt?: Date | string
    groupId: number
  }

  export type GroupMessageCreateManySenderInput = {
    id?: number
    content: string
    createdAt?: Date | string
    groupId: number
  }

  export type PostUpdateWithoutAuthorInput = {
    content?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    visibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    likes?: UserUpdateManyWithoutLikedPostsNestedInput
    comments?: CommentUpdateManyWithoutPostNestedInput
  }

  export type PostUncheckedUpdateWithoutAuthorInput = {
    id?: IntFieldUpdateOperationsInput | number
    content?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    visibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    likes?: UserUncheckedUpdateManyWithoutLikedPostsNestedInput
    comments?: CommentUncheckedUpdateManyWithoutPostNestedInput
  }

  export type PostUncheckedUpdateManyWithoutAuthorInput = {
    id?: IntFieldUpdateOperationsInput | number
    content?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    visibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CommentUpdateWithoutAuthorInput = {
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    post?: PostUpdateOneRequiredWithoutCommentsNestedInput
  }

  export type CommentUncheckedUpdateWithoutAuthorInput = {
    id?: IntFieldUpdateOperationsInput | number
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    postId?: IntFieldUpdateOperationsInput | number
  }

  export type CommentUncheckedUpdateManyWithoutAuthorInput = {
    id?: IntFieldUpdateOperationsInput | number
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    postId?: IntFieldUpdateOperationsInput | number
  }

  export type PostUpdateWithoutLikesInput = {
    content?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    visibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    author?: UserUpdateOneRequiredWithoutPostsNestedInput
    comments?: CommentUpdateManyWithoutPostNestedInput
  }

  export type PostUncheckedUpdateWithoutLikesInput = {
    id?: IntFieldUpdateOperationsInput | number
    content?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    visibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    authorId?: IntFieldUpdateOperationsInput | number
    comments?: CommentUncheckedUpdateManyWithoutPostNestedInput
  }

  export type PostUncheckedUpdateManyWithoutLikesInput = {
    id?: IntFieldUpdateOperationsInput | number
    content?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    visibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    authorId?: IntFieldUpdateOperationsInput | number
  }

  export type FriendshipUpdateWithoutSenderInput = {
    status?: StringFieldUpdateOperationsInput | string
    isCloseFriend?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    receiver?: UserUpdateOneRequiredWithoutReceivedFriendRequestsNestedInput
  }

  export type FriendshipUncheckedUpdateWithoutSenderInput = {
    id?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    isCloseFriend?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    receiverId?: IntFieldUpdateOperationsInput | number
  }

  export type FriendshipUncheckedUpdateManyWithoutSenderInput = {
    id?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    isCloseFriend?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    receiverId?: IntFieldUpdateOperationsInput | number
  }

  export type FriendshipUpdateWithoutReceiverInput = {
    status?: StringFieldUpdateOperationsInput | string
    isCloseFriend?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sender?: UserUpdateOneRequiredWithoutSentFriendRequestsNestedInput
  }

  export type FriendshipUncheckedUpdateWithoutReceiverInput = {
    id?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    isCloseFriend?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    senderId?: IntFieldUpdateOperationsInput | number
  }

  export type FriendshipUncheckedUpdateManyWithoutReceiverInput = {
    id?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    isCloseFriend?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    senderId?: IntFieldUpdateOperationsInput | number
  }

  export type MessageUpdateWithoutSenderInput = {
    content?: StringFieldUpdateOperationsInput | string
    isRead?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    receiver?: UserUpdateOneRequiredWithoutReceivedMessagesNestedInput
  }

  export type MessageUncheckedUpdateWithoutSenderInput = {
    id?: IntFieldUpdateOperationsInput | number
    content?: StringFieldUpdateOperationsInput | string
    isRead?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    receiverId?: IntFieldUpdateOperationsInput | number
  }

  export type MessageUncheckedUpdateManyWithoutSenderInput = {
    id?: IntFieldUpdateOperationsInput | number
    content?: StringFieldUpdateOperationsInput | string
    isRead?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    receiverId?: IntFieldUpdateOperationsInput | number
  }

  export type MessageUpdateWithoutReceiverInput = {
    content?: StringFieldUpdateOperationsInput | string
    isRead?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sender?: UserUpdateOneRequiredWithoutSentMessagesNestedInput
  }

  export type MessageUncheckedUpdateWithoutReceiverInput = {
    id?: IntFieldUpdateOperationsInput | number
    content?: StringFieldUpdateOperationsInput | string
    isRead?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    senderId?: IntFieldUpdateOperationsInput | number
  }

  export type MessageUncheckedUpdateManyWithoutReceiverInput = {
    id?: IntFieldUpdateOperationsInput | number
    content?: StringFieldUpdateOperationsInput | string
    isRead?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    senderId?: IntFieldUpdateOperationsInput | number
  }

  export type CrushUpdateWithoutUserInput = {
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    crush?: UserUpdateOneRequiredWithoutCrushedByNestedInput
  }

  export type CrushUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    crushId?: IntFieldUpdateOperationsInput | number
  }

  export type CrushUncheckedUpdateManyWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    crushId?: IntFieldUpdateOperationsInput | number
  }

  export type CrushUpdateWithoutCrushInput = {
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutMyCrushesNestedInput
  }

  export type CrushUncheckedUpdateWithoutCrushInput = {
    id?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    userId?: IntFieldUpdateOperationsInput | number
  }

  export type CrushUncheckedUpdateManyWithoutCrushInput = {
    id?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    userId?: IntFieldUpdateOperationsInput | number
  }

  export type CloseFriendRequestUpdateWithoutSenderInput = {
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    receiver?: UserUpdateOneRequiredWithoutReceivedCloseFriendRequestsNestedInput
  }

  export type CloseFriendRequestUncheckedUpdateWithoutSenderInput = {
    id?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    receiverId?: IntFieldUpdateOperationsInput | number
  }

  export type CloseFriendRequestUncheckedUpdateManyWithoutSenderInput = {
    id?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    receiverId?: IntFieldUpdateOperationsInput | number
  }

  export type CloseFriendRequestUpdateWithoutReceiverInput = {
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sender?: UserUpdateOneRequiredWithoutSentCloseFriendRequestsNestedInput
  }

  export type CloseFriendRequestUncheckedUpdateWithoutReceiverInput = {
    id?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    senderId?: IntFieldUpdateOperationsInput | number
  }

  export type CloseFriendRequestUncheckedUpdateManyWithoutReceiverInput = {
    id?: IntFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    senderId?: IntFieldUpdateOperationsInput | number
  }

  export type LanguageRoomUpdateWithoutCreatorInput = {
    roomName?: StringFieldUpdateOperationsInput | string
    topic?: StringFieldUpdateOperationsInput | string
    language?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LanguageRoomUncheckedUpdateWithoutCreatorInput = {
    id?: IntFieldUpdateOperationsInput | number
    roomName?: StringFieldUpdateOperationsInput | string
    topic?: StringFieldUpdateOperationsInput | string
    language?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LanguageRoomUncheckedUpdateManyWithoutCreatorInput = {
    id?: IntFieldUpdateOperationsInput | number
    roomName?: StringFieldUpdateOperationsInput | string
    topic?: StringFieldUpdateOperationsInput | string
    language?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type GroupUpdateWithoutCreatorInput = {
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    entryKey?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    members?: GroupMemberUpdateManyWithoutGroupNestedInput
    messages?: GroupMessageUpdateManyWithoutGroupNestedInput
  }

  export type GroupUncheckedUpdateWithoutCreatorInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    entryKey?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    members?: GroupMemberUncheckedUpdateManyWithoutGroupNestedInput
    messages?: GroupMessageUncheckedUpdateManyWithoutGroupNestedInput
  }

  export type GroupUncheckedUpdateManyWithoutCreatorInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    entryKey?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type GroupMemberUpdateWithoutUserInput = {
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    group?: GroupUpdateOneRequiredWithoutMembersNestedInput
  }

  export type GroupMemberUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    groupId?: IntFieldUpdateOperationsInput | number
  }

  export type GroupMemberUncheckedUpdateManyWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    groupId?: IntFieldUpdateOperationsInput | number
  }

  export type GroupMessageUpdateWithoutSenderInput = {
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    group?: GroupUpdateOneRequiredWithoutMessagesNestedInput
  }

  export type GroupMessageUncheckedUpdateWithoutSenderInput = {
    id?: IntFieldUpdateOperationsInput | number
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    groupId?: IntFieldUpdateOperationsInput | number
  }

  export type GroupMessageUncheckedUpdateManyWithoutSenderInput = {
    id?: IntFieldUpdateOperationsInput | number
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    groupId?: IntFieldUpdateOperationsInput | number
  }

  export type CommentCreateManyPostInput = {
    id?: number
    content: string
    createdAt?: Date | string
    updatedAt?: Date | string
    authorId: number
  }

  export type UserUpdateWithoutLikedPostsInput = {
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    googleId?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    collegeName?: NullableStringFieldUpdateOperationsInput | string | null
    department?: NullableStringFieldUpdateOperationsInput | string | null
    yearOfStudy?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    phoneVisibility?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: NullableStringFieldUpdateOperationsInput | string | null
    whatsappVisibility?: StringFieldUpdateOperationsInput | string
    instagramHandle?: NullableStringFieldUpdateOperationsInput | string | null
    instagramVisibility?: StringFieldUpdateOperationsInput | string
    facebookUrl?: NullableStringFieldUpdateOperationsInput | string | null
    facebookVisibility?: StringFieldUpdateOperationsInput | string
    snapchatUsername?: NullableStringFieldUpdateOperationsInput | string | null
    snapchatVisibility?: StringFieldUpdateOperationsInput | string
    linkedinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    linkedinVisibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUpdateManyWithoutAuthorNestedInput
    comments?: CommentUpdateManyWithoutAuthorNestedInput
    sentFriendRequests?: FriendshipUpdateManyWithoutSenderNestedInput
    receivedFriendRequests?: FriendshipUpdateManyWithoutReceiverNestedInput
    sentMessages?: MessageUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUpdateManyWithoutReceiverNestedInput
    myCrushes?: CrushUpdateManyWithoutUserNestedInput
    crushedBy?: CrushUpdateManyWithoutCrushNestedInput
    sentCloseFriendRequests?: CloseFriendRequestUpdateManyWithoutSenderNestedInput
    receivedCloseFriendRequests?: CloseFriendRequestUpdateManyWithoutReceiverNestedInput
    languageRooms?: LanguageRoomUpdateManyWithoutCreatorNestedInput
    createdGroups?: GroupUpdateManyWithoutCreatorNestedInput
    groupMembers?: GroupMemberUpdateManyWithoutUserNestedInput
    groupMessages?: GroupMessageUpdateManyWithoutSenderNestedInput
  }

  export type UserUncheckedUpdateWithoutLikedPostsInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    googleId?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    collegeName?: NullableStringFieldUpdateOperationsInput | string | null
    department?: NullableStringFieldUpdateOperationsInput | string | null
    yearOfStudy?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    phoneVisibility?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: NullableStringFieldUpdateOperationsInput | string | null
    whatsappVisibility?: StringFieldUpdateOperationsInput | string
    instagramHandle?: NullableStringFieldUpdateOperationsInput | string | null
    instagramVisibility?: StringFieldUpdateOperationsInput | string
    facebookUrl?: NullableStringFieldUpdateOperationsInput | string | null
    facebookVisibility?: StringFieldUpdateOperationsInput | string
    snapchatUsername?: NullableStringFieldUpdateOperationsInput | string | null
    snapchatVisibility?: StringFieldUpdateOperationsInput | string
    linkedinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    linkedinVisibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    posts?: PostUncheckedUpdateManyWithoutAuthorNestedInput
    comments?: CommentUncheckedUpdateManyWithoutAuthorNestedInput
    sentFriendRequests?: FriendshipUncheckedUpdateManyWithoutSenderNestedInput
    receivedFriendRequests?: FriendshipUncheckedUpdateManyWithoutReceiverNestedInput
    sentMessages?: MessageUncheckedUpdateManyWithoutSenderNestedInput
    receivedMessages?: MessageUncheckedUpdateManyWithoutReceiverNestedInput
    myCrushes?: CrushUncheckedUpdateManyWithoutUserNestedInput
    crushedBy?: CrushUncheckedUpdateManyWithoutCrushNestedInput
    sentCloseFriendRequests?: CloseFriendRequestUncheckedUpdateManyWithoutSenderNestedInput
    receivedCloseFriendRequests?: CloseFriendRequestUncheckedUpdateManyWithoutReceiverNestedInput
    languageRooms?: LanguageRoomUncheckedUpdateManyWithoutCreatorNestedInput
    createdGroups?: GroupUncheckedUpdateManyWithoutCreatorNestedInput
    groupMembers?: GroupMemberUncheckedUpdateManyWithoutUserNestedInput
    groupMessages?: GroupMessageUncheckedUpdateManyWithoutSenderNestedInput
  }

  export type UserUncheckedUpdateManyWithoutLikedPostsInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    googleId?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    collegeName?: NullableStringFieldUpdateOperationsInput | string | null
    department?: NullableStringFieldUpdateOperationsInput | string | null
    yearOfStudy?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    phoneVisibility?: StringFieldUpdateOperationsInput | string
    whatsappNumber?: NullableStringFieldUpdateOperationsInput | string | null
    whatsappVisibility?: StringFieldUpdateOperationsInput | string
    instagramHandle?: NullableStringFieldUpdateOperationsInput | string | null
    instagramVisibility?: StringFieldUpdateOperationsInput | string
    facebookUrl?: NullableStringFieldUpdateOperationsInput | string | null
    facebookVisibility?: StringFieldUpdateOperationsInput | string
    snapchatUsername?: NullableStringFieldUpdateOperationsInput | string | null
    snapchatVisibility?: StringFieldUpdateOperationsInput | string
    linkedinUrl?: NullableStringFieldUpdateOperationsInput | string | null
    linkedinVisibility?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CommentUpdateWithoutPostInput = {
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    author?: UserUpdateOneRequiredWithoutCommentsNestedInput
  }

  export type CommentUncheckedUpdateWithoutPostInput = {
    id?: IntFieldUpdateOperationsInput | number
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    authorId?: IntFieldUpdateOperationsInput | number
  }

  export type CommentUncheckedUpdateManyWithoutPostInput = {
    id?: IntFieldUpdateOperationsInput | number
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    authorId?: IntFieldUpdateOperationsInput | number
  }

  export type GroupMemberCreateManyGroupInput = {
    id?: number
    joinedAt?: Date | string
    userId: number
  }

  export type GroupMessageCreateManyGroupInput = {
    id?: number
    content: string
    createdAt?: Date | string
    senderId: number
  }

  export type GroupMemberUpdateWithoutGroupInput = {
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutGroupMembersNestedInput
  }

  export type GroupMemberUncheckedUpdateWithoutGroupInput = {
    id?: IntFieldUpdateOperationsInput | number
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    userId?: IntFieldUpdateOperationsInput | number
  }

  export type GroupMemberUncheckedUpdateManyWithoutGroupInput = {
    id?: IntFieldUpdateOperationsInput | number
    joinedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    userId?: IntFieldUpdateOperationsInput | number
  }

  export type GroupMessageUpdateWithoutGroupInput = {
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sender?: UserUpdateOneRequiredWithoutGroupMessagesNestedInput
  }

  export type GroupMessageUncheckedUpdateWithoutGroupInput = {
    id?: IntFieldUpdateOperationsInput | number
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    senderId?: IntFieldUpdateOperationsInput | number
  }

  export type GroupMessageUncheckedUpdateManyWithoutGroupInput = {
    id?: IntFieldUpdateOperationsInput | number
    content?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    senderId?: IntFieldUpdateOperationsInput | number
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}