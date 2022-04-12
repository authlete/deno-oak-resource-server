リソースサーバー実装 (Deno)
======================

概要
--------

これはリソースサーバーの Deno 実装です。 [OpenID Connect Core 1.0][OIDCCore]
で定義されている[ユーザー情報エンドポイント][UserInfoEndpoint]をサポートし、
また、[RFC 6750][RFC6750] (The OAuth 2.0 Authorization Framework: Bearer Token Usage)
に定義されている方法でアクセストークンを受け取る保護リソースエンドポイントの例も含んでいます。

この実装は [oak][Oak] フレームワークと [authlete-deno-oak][AuthleteDenoOak] ライブラリ
を用いて書かれています。

クライアントアプリケーションが提示したアクセストークンの有効性を調べるため、
このリソースサーバーは [Authlete][Authlete] サーバーに問い合わせをおこないます。
これはつまり、このリソースサーバーは、アクセストークンを発行した認可サーバーが
Authlete をバックエンドサービスとして使用していることを期待していることを意味します。
[deno-oak-oauth-server][DenoOakOAuthServer] はそのような認可サーバーの実装であり、
[OAuth 2.0][RFC6749] と [OpenID Connect][OIDC] をサポートしています。

ライセンス
---------

  Apache License, Version 2.0

ソースコード
-----------

  <code>https://github.com/authlete/deno-oak-resource-server</code>

Authlete について
-----------------

[Authlete][Authlete] (オースリート) は、OAuth 2.0 & OpenID Connect
の実装をクラウドで提供するサービスです ([概説][AuthleteOverview])。 Authlete
が提供するデフォルト実装を使うことにより、もしくは [Authlete Web API][AuthleteAPI]
を用いて認可サーバーを自分で実装することにより、OAuth 2.0 と OpenID Connect
の機能を簡単に実現できます。

このリソースサーバーの実装を使うには、Authlete から API クレデンシャルズを取得し、
`authlete.json` に設定する必要があります。API クレデンシャルズを取得する手順はとても簡単です。
単にアカウントを登録するだけで済みます ([サインアップ][AuthleteSignUp])。
詳細は[クイックガイド][AuthleteGettingStarted]を参照してください。

実行方法
----------

1. このリソースサーバーの実装をダウンロードします。

        $ git clone https://github.com/authlete/deno-oak-resource-server.git
        $ cd deno-oak-resource-server

2. 設定ファイルを編集して API クレデンシャルズをセットします。

        $ vi authlete.json

3. `http://localhost:1903` でリソースサーバーを起動します。

        $ deno run --allow-net --allow-read --config tsconfig.json src/server.ts

エンドポイント
--------------

この実装は、下表に示すエンドポイントを公開します。

| エンドポイント             | パス            |
|:---------------------------|:----------------|
| ユーザー情報エンドポイント | `/api/userinfo` |
| 時刻エンドポイント         | `/api/time`     |

#### ユーザー情報エンドポイント

ユーザー情報エンドポイントは、[OpenID Connect Core 1.0][OIDCCore] の
[5.3. UserInfo Endpoint][UserInfoEndpoint] に記述されている要求事項を実装したものです。

このエンドポイントは、アクセストークンを Bearer Token として受け取ります。
つまり、`Authorization: Bearer {アクセストークン}` を介して、もしくはリクエストパラメーター
`access_token={アクセストークン}` によりアクセストークンを受け取ります。
詳細は [RFC 6750][RFC6750] を参照してください。

このエンドポイントは、クライアントアプリケーションの設定に応じて、ユーザー情報を
JSON 形式もしくは [JWT][RFC7519] 形式で返します。 クライアントアプリケーションのメタデータの
`userinfo_signed_response_alg` と `userinfo_encrypted_response_alg`
の両方とも指定されていなければ、ユーザー情報は素の JSON で返されます。
そうでない場合は、シリアライズされた JWT で返されます。 Authlete
はクライアントアプリケーションのメタデータを管理するための Web コンソール
([デベロッパー・コンソール][DeveloperConsole]) を提供しています。
クライアントアプリケーションのメタデータについては、
[OpenID Connect Dynamic Client Registration 1.0][DCR] の
[2. Client Metadata][ClientMetadata] を参照してください。

エンドポイントから返されるユーザー情報には、ユーザーの[クレーム][Claims]が含まれています。
手短に言うと、_クレーム_ とは、名前やメールアドレスなどの、ユーザーに関する情報です。
Authlete は (OpenID Connect をサポートしているにもかかわらず)
ユーザーデータを管理しないので、あなたがクレーム値を提供しなければなりません。
これは、`UserInfoRequestHandlerSpi` インターフェースを実装することでおこないます。

このリソースサーバーの実装では、`UserInfoRequestHandlerSpiImpl` が `UserInfoRequestHandlerSpi`
インターフェースの実装で、ダミーデータベースからクレーム値を取り出しています。
実際のユーザーデータベースを参照するよう、この実装を変更する必要があります。

#### 時刻エンドポイント

このリソースサーバーに実装されているカントリーエンドポイントは、
保護リソースエンドポイントの一例に過ぎません。
主な目的は、保護リソースエンドポイントにおけるアクセストークンの有効性の確認方法を示すことです。

時刻エンドポイントのパスは `/api/time` です。
このエンドポイントは [RFC 6750][RFC6750] で定義されている
3 つの方法を全てサポートするので、次のいずれの方法でもアクセストークンを渡すことができます。

```
# RFC 6750, 2.1. Authorization Request Header Field
$ curl -v http://localhost:1903/api/time \
       -H 'Authorization: Bearer {access_token}'
```

```
# RFC 6750, 2.2. Form-Encoded Body Parameter
$ curl -v http://localhost:1903/api/time \
       -d access_token={access_token}
```

```
# RFC 6750, 2.3. URI Query Parameter
$ curl -v http://localhost:1903/api/time\?access_token={access_token}
```

時刻エンドポイントは、現在時刻 (UTC) に関する情報を JSON で返します。
下記はレスポンスの例です。

```json
{
  "year":        2020,
  "month":       8,
  "day":         12,
  "hour":        15,
  "minute":      9,
  "second":      10,
  "millisecond": 15
}
```

Web API を OAuth 2.0 のアクセストークンで保護する方法に関する一般的な情報および
Authlete 固有の情報については、[Authlete Definitive Guide][AuthleteDefinitiveGuide] の
[Protected Resource][ProtectedResource] を参照してください。

その他の情報
------------

- [Authlete][Authlete] - Authlete ホームページ
- [authlete-deno][AuthleteDeno] - Deno 用 Authlete ライブラリ
- [deno-oak-oauth-server][DenoOakOAuthServer] - 認可サーバーの実装

コンタクト
----------

コンタクトフォーム : https://www.authlete.com/ja/contact/

| 目的 | メールアドレス       |
|:-----|:---------------------|
| 一般 | info@authlete.com    |
| 営業 | sales@authlete.com   |
| 広報 | pr@authlete.com      |
| 技術 | support@authlete.com |

[Authlete]:                https://www.authlete.com/
[AuthleteAPI]:             https://docs.authlete.com/
[AuthleteGettingStarted]:  https://www.authlete.com/developers/getting_started/
[AuthleteOverview]:        https://www.authlete.com/developers/overview/
[AuthleteDefinitiveGuide]: https://www.authlete.com/documents/definitive_guide
[AuthleteDeno]:            https://github.com/authlete/authlete-deno
[AuthleteDenoOak]:         https://github.com/authlete/authlete-deno-oak
[AuthleteSignUp]:          https://so.authlete.com/accounts/signup
[Claims]:                  https://openid.net/specs/openid-connect-core-1_0.html#Claims
[ClientMetadata]:          https://openid.net/specs/openid-connect-registration-1_0.html#ClientMetadata
[DCR]:                     https://openid.net/specs/openid-connect-registration-1_0.html
[DenoOakOAuthServer]:      https://github.com/authlete/deno-oak-oauth-server/
[DeveloperConsole]:        https://www.authlete.com/developers/cd_console/
[Oak]:                     https://github.com/oakserver/oak
[OIDC]:                    https://openid.net/connect/
[OIDCCore]:                https://openid.net/specs/openid-connect-core-1_0.html
[ProtectedResource]:       https://www.authlete.com/documents/definitive_guide/protected_resource
[RFC6749]:                 https://tools.ietf.org/html/rfc6749
[RFC6750]:                 https://tools.ietf.org/html/rfc6750
[RFC7519]:                 https://tools.ietf.org/html/rfc7519
[UserInfoEndpoint]:        https://openid.net/specs/openid-connect-core-1_0.html#UserInfo