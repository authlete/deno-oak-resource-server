// Copyright (C) 2022 Authlete, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


import { AuthleteApi, isEmpty } from 'https://deno.land/x/authlete_deno@v1.2.6/mod.ts';
import {
    AccessTokenValidator, getAuthorizationHeader, getFormParameters, getQueryParameters
} from 'https://deno.land/x/authlete_deno_oak@v1.0.1/mod.ts';
import { Context } from 'https://deno.land/x/oak@v10.2.0/mod.ts';


/**
 * A regular expression for extracting "DPoP {access_token}" in the
 * `Authorization` request header.
 */
const DPOP_PATTERN = /"^DPoP\s*([^\s]+)\s*$/i;


/**
 * A regular expression for extracting "Bearer {access_token}" in the
 * `Authorization` request header.
 */
const BEARER_PATTERN = /^Bearer\s*([^\s]+)\s*$/i;


/**
 * Extract an access token from 'Authorization' header or from parameters
 * in the request.
 *
 * @param ctx
 *         A context object.
 *
 * @returns A promise that returns an access token from 'Authorization'
 *          header or from parameters in the request.
 */
export async function extractAccessTokenForPost(ctx: Context): Promise<string | null>
{
    return extractAccessToken(ctx, (await getFormParameters(ctx)).get('access_token'));
}


/**
 * Extract an access token from 'Authorization' header or query parameters
 * in the request.
 *
 * @param ctx
 *         A context object.
 *
 * @returns An access token extracted from 'Authorization' header or query
 *          parameters in the request.
 */
export function extractAccessTokenForGet(ctx: Context): string | null
{
    return extractAccessToken(ctx, getQueryParameters(ctx).get('access_token'));
}


function extractAccessToken(ctx: Context, accessTokenInRequest: string | null): string | null
{
    // Get an access token from 'Authorization' header.
    let accessToken = extractAccessTokenFromAuthorizationHeader(ctx);

    if (isEmpty(accessToken))
    {
        // If an access token can't be extracted from 'Authorization'
        // header, use the access token value in the request.
        accessToken = accessTokenInRequest;
    }

    return accessToken;
}


function extractAccessTokenFromAuthorizationHeader(ctx: Context): string | null
{
    // The value of 'Authorization' header.
    const authorization = getAuthorizationHeader(ctx);

    if (isEmpty(authorization))
    {
        // The value of 'Authorization' header is empty.
        return null;
    }

    // Check 1: DPoP Token.
    // Check if the value of the 'Authorization' header matches the pattern,
    // "DPoP {access_token}".
    let accessToken = extractDpopToken(authorization);

    // Check 2. Bearer Token.
    // Check if the value of the 'Authorization' header matches the pattern,
    // "Bearer {access_token}".
    if (accessToken === null)
    {
        accessToken = extractBearerToken(authorization);
    }

    return accessToken;
}


function extractDpopToken(authorization: string)
{
    return extractPattern(DPOP_PATTERN, authorization);
}


function extractBearerToken(authorization: string)
{
    return extractPattern(BEARER_PATTERN, authorization);
}


function extractPattern(pattern: RegExp, target: string)
{
    // Execute pattern matching.
    const result = pattern.exec(target);

    if (result === null)
    {
        // The value doesn't match the pattern.
        return null;
    }

    // The matched part.
    const matched = result[1];

    // Return a null or non-empty string.
    return isEmpty(matched) ? null : matched;
}


/**
 * Validate the access token by calling Authlete `/auth/introspection`
 * API.
 *
 * @param api
 *         An implementation of the `AuthleteApi` interface.
 *
 * @param accessToken
 *         An access token.
 *
 * @param requiredScopes
 *         Scopes that needs be covered by the access token.
 *
 * @param requiredSubject
 *         Subject that needs to be associated with the access token.
 *
 * @returns The validation result.
 */
export async function validateAccessToken(
    api: AuthleteApi, accessToken: string | null, requiredScopes?: string[],
    requestedSubject?: string): Promise<AccessTokenValidator.Result>
{
    // Create an access token validator.
    const validator = new AccessTokenValidator(api);

    // Validate the access token.
    return await validator.validate(accessToken, requiredScopes, requestedSubject);
}


/**
 * Base endpoint.
 */
export class BaseEndpoint
{
    /**
     * An implementation of `AuthleteApi` interface.
     */
    protected api: AuthleteApi;


    /**
     * The constructor.
     *
     * @params api
     *          An implementation of `AuthleteApi` interface.
     */
    public constructor(api: AuthleteApi)
    {
        this.api = api;
    }
}