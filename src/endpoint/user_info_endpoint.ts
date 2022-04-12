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


import { AuthleteApi, isNotEmpty } from 'https://deno.land/x/authlete_deno@v1.2.6/mod.ts';
import { UserInfoRequestHandler } from 'https://deno.land/x/authlete_deno_oak@v1.0.1/mod.ts';
import { Context } from 'https://deno.land/x/oak@v10.2.0/mod.ts';
import { UserInfoRequestHandlerSpiImpl } from '../impl/user_info_request_handler_spi_impl.ts';
import {
    BaseEndpoint, extractAccessTokenForGet, extractAccessTokenForPost
} from './base_endpoint.ts';


async function handle(
    api: AuthleteApi, ctx: Context, accessToken: string | null): Promise<void>
{
    await new UserInfoRequestHandler(api, new UserInfoRequestHandlerSpiImpl())
        .handle(ctx, buildParams(ctx, accessToken));
}


function buildParams(
    ctx: Context, accessToken: string | null): UserInfoRequestHandler.Params
{
    // Parameters for the handler.
    const params: UserInfoRequestHandler.Params = {};

    // Access token.
    if (isNotEmpty(accessToken)) params.accessToken = accessToken;

    return params;
}


/**
 * An implementation of userinfo endpoint. See [5.3. UserInfo Endpoint
 * ](http://openid.net/specs/openid-connect-core-1_0.html#UserInfo) of
 * [OpenID Connect Core 1.0](http://openid.net/specs/openid-connect-core-1_0.html).
 */
export class UserInfoEndpoint extends BaseEndpoint
{
    /**
     * UserInfo endpoint for `GET` method.
     */
    public async handleGet(ctx: Context): Promise<void>
    {
        await handle(this.api, ctx, extractAccessTokenForGet(ctx));
    }


    /**
     * UserInfo endpoint for `POST` method.
     */
    public async handlePost(ctx: Context): Promise<void>
    {
        await handle(this.api, ctx, await extractAccessTokenForPost(ctx));
    }
}