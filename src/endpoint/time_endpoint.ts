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


import { AuthleteApi } from 'https://deno.land/x/authlete_deno@v1.2.6/mod.ts';
import { okJson } from 'https://deno.land/x/authlete_deno_oak@v1.0.1/mod.ts';
import { Context } from 'https://deno.land/x/oak@v10.2.0/mod.ts';
import {
    BaseEndpoint, extractAccessTokenForGet, extractAccessTokenForPost,
    validateAccessToken
} from './base_endpoint.ts';


export async function handle(
    api: AuthleteApi, ctx: Context, accessToken: string | null): Promise<void>
{
    // Validate the access token.
    const result = await validateAccessToken(api, accessToken);

    // If the access token is invalid.
    if (!result.isValid)
    {
        // When the value of 'isValid' is false, 'deny' holds a function
        // that generates an error response that should be returned
        // to the client application. The response complies with RFC
        // 6750 (The OAuth 2.0 Authorization Framework: Bearer Token
        // Usage).
        //
        // You can refer to 'introspectionResult' or 'introspectionError'
        // for more information.
        result.deny!(ctx);
        return;
    }

    // Return a json response with 200 OK.
    okJson(ctx, buildSuccessfulResponseContent());
}


export function buildSuccessfulResponseContent()
{
    // This simple example generates JSON that holds information
    // about the current time.

    // The current time in UTC.
    const now = new Date();

    // Build a result.
    const content = {
        'year':        now.getUTCFullYear(),
        'month':       now.getMonth() + 1,
        'day':         now.getUTCDate(),
        'hour':        now.getUTCHours(),
        'minute':      now.getUTCMinutes(),
        'second':      now.getUTCSeconds(),
        'millisecond': now.getUTCMilliseconds()
    };

    // Convert it to a JSON string.
    return JSON.stringify(content);
}


/**
 * An example of a protected resource endpoint. This implementation
 * returns JSON that contains information about the current time.
 */
export class TimeEndpoint extends BaseEndpoint
{
    /**
     * API entry point for HTTP GET method. The request must contain
     * an access token. Below are usage examples.
     *
     * ```bash
     * # Passing an access token in the way defined in RFC 6750, 2.3.
     * # URI Query Parameter.
     * $ curl -v http://localhost:8001/api/time\?access_token={access_token}
     *
     * # Passing an access token in the way defined in RFC 6750, 2.1.
     * # Authorization Request Header Field.
     * $ curl -v http://localhost:8001/api/time \
     *        -H 'Authorization: Bearer {access_token}'
     * ```
     */
    public async handleGet(ctx: Context): Promise<void>
    {
        await handle(this.api, ctx, extractAccessTokenForGet(ctx));
    }


    /**
     * API entry point for HTTP POST method. The request must contain
     * an access token. Below are examples.
     *
     * ```bash
     * # Passing an access token in the way defined in RFC 6750, 2.2.
     * # Form-Encoded Body Parameter.
     * $ curl -v http://localhost:8001/api/time \
     *        -d access_token={access_token}
     * ```
     *
     * ```bash
     * # Passing an access token in the way defined in RFC 6750, 2.1.
     * # Authorization Request Header Field.
     * $ curl -v -X POST http://localhost:8001/api/time \
     *        -H 'Content-Type: application/x-www-form-urlencoded' \
     *        -H 'Authorization: Bearer {access_token}'
     * ```
     */
    public async handlePost(ctx: Context): Promise<void>
    {
        await handle(this.api, ctx, await extractAccessTokenForPost(ctx));
    }
}