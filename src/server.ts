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


import { AuthleteApiFactory } from 'https://deno.land/x/authlete_deno@v1.2.6/mod.ts';
import { Application, Router } from 'https://deno.land/x/oak@v10.2.0/mod.ts';
import { TimeEndpoint } from './endpoint/time_endpoint.ts';
import { UserInfoEndpoint } from './endpoint/user_info_endpoint.ts';


async function setupRouter(app: Application): Promise<void>
{
    // Get an Authlete API instance.
    const api = await AuthleteApiFactory.getDefault();

    // Endpoints.
    const userInfoEndpoint = new UserInfoEndpoint(api);
    const timeEndpoint     = new TimeEndpoint(api);

    // Router.
    const router = new Router();

    // Set up the router.
    router
      .get('/api/userinfo',  async(ctx) => { await userInfoEndpoint.handleGet(ctx); })
      .post('/api/userinfo', async(ctx) => { await userInfoEndpoint.handlePost(ctx); })
      .get('/api/time',      async(ctx) => { await timeEndpoint.handleGet(ctx); })
      .post('/api/time',     async(ctx) => { await timeEndpoint.handlePost(ctx); })
    ;

    // Set up the application to use the router.
    app.use(router.routes());
    app.use(router.allowedMethods());
}


async function setup(app: Application): Promise<void>
{
    // Set up routes.
    await setupRouter(app);
}


async function main(): Promise<void>
{
    // Create an application.
    const app = new Application();

    // Set up the application.
    await setup(app);

    // Start the application.
    await app.listen({ port: 1903 });
}


await main();